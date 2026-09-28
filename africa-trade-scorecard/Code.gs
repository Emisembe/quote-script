/**
 * Africa Trade Gap Scorecard
 * ------------------------------------------------------------------
 * A self-building Google Sheets app. Paste this ONE file into
 * Extensions → Apps Script of a Google Sheet, save, reload the sheet,
 * then use the "Africa Trade" menu.
 *
 * It does two things:
 *   1. Trade picture – imports and exports of every African country,
 *      by product (HS 2-digit) and by African partner.
 *   2. Gap finder – a composite index (multi-criteria scorecard) that
 *      ranks every "exporter A → importer B → product" combination where
 *      A already sells the product to the world, B already buys it from
 *      the world, but little or nothing flows between them yet.
 *
 * Updating the code later: paste the new version over this one, reload
 * the sheet, then run "Update workbook after pasting new code". Your
 * data, weights, settings and edits are kept.
 */

// ------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------

const APP = {
  version: '3.2.0',
  sheets: {
    guide: 'Guide',
    health: 'Health_Check',
    about: 'About',
    dashboard: 'Dashboard',
    charts: 'Charts',
    top: 'Top_Gaps',
    country: 'Country_View',
    explain: 'Explain_Score',
    score: 'Scorecard',
    settings: 'Settings',
    method: 'Methodology',
    glossary: 'Glossary',
    sources: 'Data_Sources',
    updates: 'Refresh_&_Updates',
    faq: 'FAQ',
    countries: 'Countries',
    products: 'Products',
    raw: 'Raw_Trade',
    vaSummary: 'Value_Addition',
    vaCharts: 'Value_Lost_Charts',
    vaScore: 'VA_Scorecard',
    needs: 'Country_Needs',
    chains: 'Value_Chains',
    enablers: 'Enablers',
    rawHs4: 'Raw_HS4',
  },
  color: {
    header: '#1f4e3d',
    headerText: '#ffffff',
    band: '#eef5f1',
    input: '#fff4d6',
    title: '#1f4e3d',
    warn: '#fce8e6',
    banner: '#eaf1fb',
    bannerText: '#1c3d6e',
  },
  fetchProp: 'CT_CURSOR',
  missingProp: 'CT_MISSING',
  versionProp: 'APP_VERSION',
  fetchHandler: 'continueComtradeFetch', // trigger handler names — keep stable across code updates
  autoHandler: 'autoRefresh',
};

// [name, default weight, explanation] — order matches Scorecard sub-score columns
const CRITERIA = [
  ['Demand', 20, "How much the importer buys of this product from the whole world (log scale)."],
  ['Supply capacity', 15, "How much the exporter sells of this product to the whole world (log scale)."],
  ['Untapped gap', 25, "min(demand, supply) minus what already flows from exporter to importer (log scale)."],
  ['Market access', 15, "Same customs union > same REC (Regional Economic Community) > both in AfCFTA > other."],
  ['Proximity', 10, "Distance between capitals, reduced if either country is landlocked."],
  ['Demand growth', 5, "Growth of the importer's world imports of this product vs. the previous year."],
  ['Competitiveness (RCA)', 10, "Exporter's Revealed Comparative Advantage (RCA) in the product vs. Africa as a whole."],
];

// [named range, label, default, note, editable]
const PARAMS = [
  ['P_YEAR', 'Analysis year', 2023, 'Latest year analysed. The year before is used for growth. Change it, then Refresh data.', true],
  ['P_MIN_GAP', 'Minimum untapped gap (USD – US dollars)', 100000, 'Smaller opportunities are ignored.', true],
  ['P_MAX_ROWS', 'Max rows in Scorecard', 20000, 'Largest gaps are kept. Keep below ~50,000 for speed.', true],
  ['P_ACC_CU', 'Access score: same customs union', 1, '0–1. E.g. SACU, EAC, WAEMU, CEMAC, ECOWAS CET (full names: Guide tab).', true],
  ['P_ACC_REC', 'Access score: same REC / FTA', 0.8, '0–1. REC = Regional Economic Community, FTA = Free Trade Area. E.g. COMESA, SADC.', true],
  ['P_ACC_AFCFTA', 'Access score: both in AfCFTA', 0.6, '0–1. AfCFTA = African Continental Free Trade Area (Countries tab).', true],
  ['P_ACC_OTHER', 'Access score: other', 0.3, '0–1.', true],
  ['P_LANDLOCK', 'Proximity multiplier if landlocked', 0.85, 'Applied when exporter or importer has no sea coast.', true],
  ['P_API_KEY', 'UN Comtrade API key', '', 'Free key: comtradedeveloper.un.org → subscribe to "comtrade - v1". API = Application Programming Interface.', true],
  ['P_STATUS', 'Data status', 'No data loaded', 'Set automatically. Shown on the Dashboard.', false],
  ['P_WB_STATUS', 'Enabler data status', 'No enabler data loaded', 'Set automatically: World Bank indicators or SAMPLE.', false],
  ['P_SOURCE', 'Data source', 'NONE', 'Set automatically: SAMPLE, COMTRADE or OWN. Refresh uses it.', false],
  ['P_LAST_REFRESH', 'Last computed', '—', 'Set automatically when step 3 (Compute) finishes.', false],
  ['P_AUTO', 'Monthly auto-refresh', 'OFF', 'Switch with the menu: Monthly auto-refresh ON / OFF.', false],
];

// ------------------------------------------------------------------
// Value addition — constants
// ------------------------------------------------------------------

// [name, default weight, explanation] — order matches VA_Scorecard sub-score columns M..Q
const VA_CRITERIA = [
  ['Value at stake', 30, 'Estimated extra export value if the raw exports were processed first (log scale).'],
  ['Raw material base', 20, 'How much raw and semi-processed material the country already exports (log scale).'],
  ['Processing gap', 15, 'Part of the chain still exported raw: 1 − processing share.'],
  ['Market for processed goods', 15, 'Home imports and Africa-wide imports of the processed products (log scale).'],
  ['Readiness (enablers)', 20, 'How the country scores on the enablers this chain needs (World Bank indicators).'],
];

// World Bank WDI (World Development Indicators). Higher is better for all of them.
// [indicator code, short label, full name, need key, why it matters]
const INDICATORS = [
  ['EG.ELC.ACCS.ZS', 'Electricity access (%)', 'Access to electricity (% of population)', 'energy',
    'Processing plants need reliable, affordable power.'],
  ['NV.IND.MANF.ZS', 'Manufacturing (% of GDP)', 'Manufacturing, value added (% of GDP — Gross Domestic Product)', 'industry',
    'An existing industrial base makes new processing easier.'],
  ['TX.VAL.MANF.ZS.UN', 'Manufactured exports (%)', 'Manufactures exports (% of merchandise exports)', 'industry',
    'Shows how much the country already sells processed goods abroad.'],
  ['LP.LPI.OVRL.XQ', 'Logistics LPI (1–5)', 'Logistics Performance Index (LPI): overall score, 1 = low to 5 = high', 'logistics',
    'Processed goods must reach buyers quickly and cheaply.'],
  ['SE.SEC.ENRR', 'Secondary school (%)', 'School enrollment, secondary (% gross)', 'skills',
    'Factories need trained technicians and workers.'],
  ['FS.AST.PRVT.GD.ZS', 'Private credit (% of GDP)', 'Domestic credit to private sector (% of GDP)', 'finance',
    'Plants need investment and working capital.'],
  ['IT.NET.USER.ZS', 'Internet use (%)', 'Individuals using the Internet (% of population)', 'digital',
    'Digital links help firms find buyers, meet standards and get paid.'],
];

const NEED_LABELS = {
  energy: 'Reliable, affordable electricity',
  industry: 'Industrial base & investment in plants',
  logistics: 'Logistics & trade facilitation',
  skills: 'Technical skills & training',
  finance: 'Access to finance / capital',
  digital: 'Digital connectivity',
  standards: 'Quality standards & certification (check)',
};

// [chain, sector, raw HS4, semi-processed HS4, processed HS4, value multiplier (assumption), needs, what processing requires]
// Some HS4 codes are broader than the chain (e.g. 0901 includes roasted coffee, 7102 includes cut diamonds).
const VALUE_CHAINS = [
  ['Cocoa → chocolate', 'Agri-food', '1801', '1803, 1804, 1805', '1806', 2.0, 'energy, finance, standards, skills',
    'Grinding and pressing plants (cocoa liquor, butter, powder), stable power, food-safety certification (e.g. HACCP, ISO 22000) and capital for plant and bean stocks.'],
  ['Coffee & tea → roasted, instant & packaged', 'Agri-food', '0901, 0902', '', '2101', 1.8, 'energy, standards, logistics, finance',
    'Roasting, extraction and packaging lines, food-safety certification, branding, and fast logistics to consumer markets.'],
  ['Cashew & nuts → kernels & snacks', 'Agri-food', '0801, 0802', '', '2008', 2.0, 'skills, standards, finance, energy',
    'Shelling and peeling plants (labour- and skill-intensive), drying, grading to buyer standards, and working capital to buy the harvest.'],
  ['Cotton → yarn, fabric & clothing', 'Textiles & apparel', '5201', '5205, 5208, 5209, 5210, 5211, 5212',
    '6104, 6105, 6106, 6109, 6110, 6203, 6204, 6205, 6206, 6211', 3.0, 'energy, skills, logistics, finance, industry',
    'Spinning and weaving need much power and capital; garment making needs trained workers, fast shipping and buyer compliance standards.'],
  ['Crude oil → refined fuels', 'Minerals & fuels', '2709', '', '2710', 1.3, 'finance, industry, skills, logistics',
    'Refineries need very large capital, technical skills, a reliable crude supply, and storage and pipeline logistics.'],
  ['Natural gas → ammonia & fertiliser', 'Minerals & fuels', '2711', '2814', '3102', 1.6, 'finance, industry, energy, skills',
    'Gas-to-ammonia and urea plants are capital-intensive and need a secure gas supply and skilled operators.'],
  ['Phosphate rock → phosphate fertiliser', 'Chemicals', '2510', '2809', '3103, 3105', 2.0, 'energy, finance, industry, logistics',
    'Acid and fertiliser plants need sulphur, water, energy, capital and bulk logistics.'],
  ['Copper ore → cathodes, wire & cable', 'Metals', '2603', '7402, 7403', '7408, 7409, 7411, 8544', 1.3, 'energy, finance, industry, skills',
    'Smelting and refining need large amounts of power and capital; wire and cable making needs industrial skills and standards.'],
  ['Cobalt → chemicals & battery materials', 'Metals', '2605', '8105, 2822', '8507', 1.8, 'energy, finance, skills, standards, industry',
    'Refining to cobalt chemicals needs power, capital and chemical skills; battery supply chains demand traceability and ESG standards.'],
  ['Iron ore → iron & steel', 'Metals', '2601', '7201, 7203, 7206, 7207', '7208, 7209, 7210, 7213, 7214, 7216, 7306, 7308', 2.5,
    'energy, finance, industry, logistics',
    'Steelmaking needs huge amounts of energy (or gas for direct reduction), capital, rail and port logistics, and industrial skills.'],
  ['Bauxite → alumina & aluminium', 'Metals', '2606', '2818, 7601', '7604, 7606, 7610, 7614, 7616', 4.0, 'energy, finance, industry, logistics',
    'Alumina refineries and especially smelters need very cheap, reliable electricity (often hydropower) and very large capital.'],
  ['Manganese & chrome ore → ferro-alloys', 'Metals', '2602, 2610', '', '7202', 2.0, 'energy, finance, industry',
    'Ferro-alloy furnaces use large amounts of electricity and capital.'],
  ['Gold & diamonds → refining, cutting & jewellery', 'Stone, glass & precious', '7102, 7108', '', '7113, 7114, 7116', 1.2,
    'skills, standards, finance',
    'Refining to international standards (e.g. LBMA accreditation), diamond cutting and jewellery design need skills, certification and secure logistics.'],
  ['Hides & skins → leather & footwear', 'Leather, wood & paper', '4101, 4102, 4103', '4104, 4105, 4106, 4107', '4202, 4203, 6403, 6405', 3.0,
    'skills, standards, energy, finance',
    'Tanneries need water treatment and environmental standards; footwear and bags need design and craft skills and buyer compliance.'],
  ['Logs → sawn wood, panels & furniture', 'Leather, wood & paper', '4403', '4407, 4408, 4412', '4418, 9403', 2.5,
    'energy, skills, standards, logistics',
    'Sawmills and panel plants need power and skills; furniture needs design, finishing and legal-timber certification.'],
  ['Oilseeds → vegetable oils', 'Agri-food', '1201, 1202, 1204, 1205, 1206, 1207', '', '1507, 1508, 1511, 1512, 1513, 1515, 1516, 1517', 1.6,
    'energy, finance, standards', 'Crushing and refining plants need steady power, capital and food-safety standards.'],
  ['Raw sugar → confectionery & drinks', 'Agri-food', '1701', '', '1704, 2202', 1.8, 'energy, standards, logistics, finance',
    'Food factories need power, food-safety certification, packaging and distribution networks.'],
  ['Cereals → flour, pasta & bakery', 'Agri-food', '1001, 1005, 1006, 1007', '1101, 1102, 1103', '1902, 1905', 1.4, 'energy, standards, logistics',
    'Mills and bakeries need power, storage, food-safety standards and distribution.'],
  ['Fish → fillets & canned fish', 'Agri-food', '0302, 0303', '0304', '1604', 1.7, 'energy, standards, logistics',
    'Cold chain, processing plants and export health certification (e.g. approval for the EU market) are essential.'],
  ['Fruit → juices & preserves', 'Agri-food', '0803, 0804, 0805', '', '2007, 2008, 2009', 1.8, 'energy, standards, logistics, finance',
    'Juice and canning lines need cold chain, packaging, food-safety standards and capital.'],
  ['Tobacco leaf → cigarettes', 'Agri-food', '2401', '', '2402', 2.5, 'industry, finance, standards',
    'Cigarette manufacturing is capital-intensive and heavily regulated.'],
  ['Natural rubber → tyres & gloves', 'Plastics & rubber', '4001', '', '4011, 4015', 2.0, 'energy, industry, finance, skills',
    'Tyre plants need capital, chemicals, power and skills; gloves need medical-grade standards.'],
  ['Lithium & graphite → battery materials', 'Minerals & fuels', '2504, 2530', '2825, 2836, 3801', '8507', 3.0,
    'energy, finance, skills, industry, standards',
    'Chemical refining (lithium hydroxide or carbonate, battery-grade graphite) needs power, chemicals, capital and strict traceability standards.'],
  ['Live animals → meat', 'Agri-food', '0102, 0104', '', '0201, 0202, 0204, 1602', 1.5, 'energy, standards, logistics',
    'Abattoirs need cold chain, veterinary and hygiene certification, and reliable transport.'],
  ['Cassava → starch & flour products', 'Agri-food', '0714', '', '1108, 1903', 2.0, 'energy, skills, standards',
    'Starch and flour plants need drying equipment, power and food-safety standards.'],
];

// --- Sample-data shape only (NOT real statistics): who produces / processes what. Index = VALUE_CHAINS row.
const SAMPLE_CHAIN_PRODUCERS = [
  ['CIV', 'GHA', 'CMR', 'NGA'], ['ETH', 'UGA', 'KEN', 'TZA', 'RWA', 'BDI'], ['CIV', 'NGA', 'TZA', 'GNB', 'BEN', 'MOZ', 'GHA'],
  ['BFA', 'MLI', 'BEN', 'CIV', 'TCD', 'CMR', 'EGY', 'TZA'], ['NGA', 'AGO', 'DZA', 'LBY', 'COG', 'GAB', 'GNQ', 'SSD', 'TCD', 'EGY', 'GHA'],
  ['DZA', 'NGA', 'EGY', 'MOZ', 'GNQ', 'LBY'], ['MAR', 'TUN', 'TGO', 'SEN', 'EGY', 'DZA'], ['ZMB', 'COD'], ['COD', 'ZMB', 'MDG'],
  ['ZAF', 'MRT', 'LBR', 'SLE', 'GIN'], ['GIN', 'SLE', 'GHA'], ['ZAF', 'GAB', 'GHA', 'ZWE', 'CIV'],
  ['GHA', 'ZAF', 'MLI', 'BFA', 'SDN', 'TZA', 'BWA', 'NAM', 'AGO', 'COD', 'ZWE', 'SLE'], ['ETH', 'SDN', 'NGA', 'KEN', 'SOM', 'TCD', 'MLI'],
  ['GAB', 'CMR', 'COG', 'CAF', 'COD', 'GNQ', 'LBR', 'MOZ'], ['SDN', 'NGA', 'ETH', 'TZA', 'SEN', 'BFA'], ['ZAF', 'SWZ', 'MUS', 'MWI', 'ZMB', 'SDN', 'EGY'],
  ['ZAF', 'ZMB', 'UGA', 'TZA'], ['MAR', 'MRT', 'SEN', 'NAM', 'ZAF', 'GHA', 'SYC', 'MUS'], ['MAR', 'ZAF', 'EGY', 'CIV', 'KEN', 'CMR', 'GHA'],
  ['ZWE', 'MWI', 'TZA', 'MOZ', 'ZMB'], ['CIV', 'LBR', 'NGA', 'GHA', 'CMR'], ['ZWE', 'COD', 'NAM', 'MDG', 'MOZ', 'TZA'],
  ['SOM', 'SDN', 'ETH', 'MLI', 'NER', 'TCD', 'BFA', 'MRT', 'DJI'], ['NGA', 'GHA', 'CIV', 'COD'],
];
const SAMPLE_CHAIN_PROCESSORS = [
  ['CIV', 'GHA', 'ZAF'], ['KEN'], ['CIV'], ['EGY', 'MUS', 'MAR', 'TUN', 'LSO', 'KEN', 'MDG', 'ETH'], ['DZA', 'EGY', 'NGA', 'ZAF'],
  ['EGY', 'DZA', 'NGA'], ['MAR', 'TUN', 'EGY', 'SEN', 'ZAF'], ['ZMB', 'COD', 'ZAF'], ['ZMB', 'ZAF'], ['ZAF', 'EGY', 'DZA'],
  ['MOZ', 'GHA', 'EGY', 'ZAF', 'CMR'], ['ZAF', 'ZWE'], ['ZAF', 'EGY'], ['ETH', 'KEN', 'MAR', 'TUN', 'EGY'], ['GAB', 'CMR', 'ZAF'],
  ['EGY', 'NGA', 'ZAF'], ['ZAF', 'EGY', 'KEN'], ['EGY', 'ZAF', 'NGA', 'MAR'], ['MAR', 'SEN', 'MUS', 'SYC', 'NAM', 'GHA'],
  ['MAR', 'ZAF', 'EGY', 'KEN'], ['ZAF', 'KEN', 'EGY'], ['ZAF', 'NGA'], ['MAR', 'ZAF'], ['ETH', 'BWA', 'NAM', 'SDN'], ['NGA', 'GHA'],
];

// What each tab shows and how to explain it. Shown as a blue box at the top of the tab
// and collected on the Guide. Each string = one line on screen (keep lines short).
const TAB_HELP = {
  dashboard: {
    title: 'Dashboard — the big picture',
    what: ['Six headline numbers for Africa (tiles), one row per country (54), and how much untapped trade there is in each sector.'],
    read: ['Tiles = totals for the continent. "Africa share of exports" = the part of a country\'s exports that goes to other African countries.',
      '"Best score" = that country\'s strongest opportunity as a seller (0–100). $1.2B = 1.2 billion US dollars, $3.4M = 3.4 million.'],
    say: ['"This page shows how much Africa trades with the world compared with how much it trades with itself. Only a small part of each',
      ' country\'s exports stays in Africa. The sector table on the right shows where the biggest unused potential is."'],
    watch: ['Read the line under the title: if it says SAMPLE DATA the numbers are made up. Gap totals overlap, so they show scale, not an exact amount.'],
  },
  charts: {
    title: 'Charts & diagrams — see it at a glance',
    what: ['A diagram of how the index works, the weights behind the score, an illustrated "untapped gap", and six charts about African trade.'],
    read: ['Each chart has a title and a one-line caption telling you what it shows. The small tables on the far right are the data behind the charts.'],
    say: ['"Data goes in, we look for gaps, score each gap on seven criteria, and rank them. The charts then show where Africa trades today',
      ' and where the potential is."'],
    watch: ['Charts refresh when you run step 3 (Compute). The weights, "Top 15" and "score spread" charts also update live when you change weights.'],
  },
  top: {
    title: 'Top_Gaps — the ranked shortlist',
    what: ['The best trade opportunities: "this country could sell this product to that country". Filter with the yellow cells.'],
    read: ['One row = exporter → importer → product. Untapped gap = extra trade possible per year in USD (US dollars). Score 0–100: higher = better.',
      'Current trade = what already flows between the two for that product. Market access = the best trade agreement they share.'],
    say: ['"Rank 1 is where demand, supply, market access, distance and competitiveness line up best. The importer already buys this product',
      ' abroad and the exporter already sells it abroad — they just are not trading it with each other yet."'],
    watch: ['A high score is a lead to investigate, not a guaranteed deal. Products are broad groups (HS2 = 2-digit Harmonized System code).'],
  },
  country: {
    title: 'Country_View — one country in detail',
    what: ['A profile of ONE country (pick it in the yellow cell): trade totals, top products, main African partners, best opportunities both ways.'],
    read: ['Top-10 tables are by value in USD. "Best opportunities to SELL" = African markets it could supply more.',
      '"Best African suppliers" = African countries that could supply what it now imports, often from outside Africa.'],
    say: ['"Here is this country at a glance: what it sells, what it buys, who it already trades with in Africa, and where the untapped',
      ' opportunities are — for its exporters and for its importers."'],
    watch: ['"Partner-reported" = taken from the other country\'s statistics. Zeros often mean the country did not report data for that year.'],
  },
  explain: {
    title: 'Explain_Score — why an opportunity got its score',
    what: ['Pick an exporter, importer and product: the story in words, how each of the 7 criteria added points, and a picture of the gap.'],
    read: ['Raw value = the real number. Sub-score = the number rescaled to 0–1. Points added = sub-score × share of weight × 100.',
      'All points added together = the composite score (0–100).'],
    say: ['"This opportunity scores X out of 100. Most of its points come from its strongest factor; it loses most on its weakest factor.',
      ' If we cared more about distance, we could raise that weight and the ranking would change."'],
    watch: ['Sub-scores are relative: 1 = best among all opportunities in this workbook, 0 = weakest. They are not absolute grades.'],
  },
  score: {
    title: 'Scorecard — the full composite index (the engine room)',
    what: ['Every exporter → importer → product opportunity, with its raw facts, 7 sub-scores (0–1) and the composite score (0–100).'],
    read: ['A–M = facts. N–T = sub-scores. U = composite score (live formula using the Settings weights). V–W = raw growth and RCA',
      '(Revealed Comparative Advantage). Hover over any header for a note.'],
    say: ['"This is the engine room: every pairing is scored the same way, so they can be compared fairly. The other tabs filter and summarise this table."'],
    watch: ['Do not type here — step 3 overwrites it. To sort or filter, use Data → Create a filter view so the layout is not broken.'],
  },
  settings: {
    title: 'Settings — the controls',
    what: ['How much each criterion counts: 7 trade-gap weights, 5 value-addition weights, and parameters such as the analysis year.'],
    read: ['Weights are relative: 20 vs 10 = twice as important; 0 = ignored. Yellow cells are editable. Grey rows are filled in automatically.'],
    say: ['"The weights are our priorities. With the default weights the size of the gap counts most. We can try other priorities and check',
      ' that the top results stay on top."'],
    watch: ['Weight changes apply instantly. Year, minimum gap, row limit, access scores and landlocked multiplier need Refresh or step 3.'],
  },
  countries: {
    title: 'Countries — the 54 AU (African Union) member states',
    what: ['For each country: codes (ISO3 letters, UN M49 number), AU region, capital location, customs unions, RECs and AfCFTA membership.'],
    read: ['Customs unions and RECs (Regional Economic Communities) drive the "Market access" score; capital locations drive "Proximity".',
      'Full names of every bloc (SACU, EAC, ECOWAS, WAEMU, CEMAC, COMESA, SADC, ECCAS, AMU) are in the abbreviations list on the Guide tab.'],
    say: ['"Countries in the same customs union or trade bloc face fewer barriers, so their opportunities get a higher market-access score."'],
    watch: ['Memberships change (e.g. Mali, Burkina Faso and Niger left ECOWAS in 2025). Verify, edit, then run step 3 again.'],
  },
  products: {
    title: 'Products — 96 HS (Harmonized System) product groups',
    what: ['The world-standard customs product list at 2-digit (chapter) level, grouped into 12 sectors. Untick "Include" to leave a product out.'],
    read: ['Sector names feed the filters and charts. Arms (93) and art (97) are excluded by default.'],
    say: ['"Products are grouped with the same HS codes every customs office in the world uses, so our figures line up with official statistics."'],
    watch: ['2-digit groups are broad: "Cereals" mixes wheat, rice and maize. Run step 3 again after changing ticks.'],
  },
  vaSummary: {
    title: 'Value_Addition — how much each country processes before it exports',
    what: ['For each country: raw materials exported, processed goods exported, the processing share, and the value lost by exporting raw.'],
    read: ['Processing share = processed ÷ all exports in the 25 value chains (higher = more value added at home).',
      'Value lost = extra export value if raw exports were processed first. Round-trip = processed imports bought while exporting the raw material.'],
    say: ['"This country exports its raw materials and buys the finished products back. By processing at home it could earn roughly this much',
      ' more each year — and the Country_Needs tab shows what it would take."'],
    watch: ['Value lost is an ESTIMATE built on the value multipliers on the Value_Chains tab (assumptions you can edit). Some HS4 codes are broad.'],
  },
  health: {
    title: 'Health_Check — is everything working?',
    what: ['Live checks of every part of the workbook (data loaded, scores calculated, weights, enablers) and a full audit that scans every tab for errors.'],
    read: ['OK = fine. CHECK = needs attention — the "What to do" column says how to fix it. INFO = for your information.',
      'Section 2 fills in when you run Africa Trade → Run full audit: it lists any cell showing an error such as #REF! or #N/A.'],
    say: ['"Before we present, we check this page: every line is OK, so the data is loaded, the scores are calculated and no tab shows errors."'],
    watch: ['The live checks update by themselves. The full audit is a snapshot — run it again after big changes.'],
  },
  vaCharts: {
    title: 'Value_Lost_Charts — value lost, explained with diagrams and charts',
    what: ['A diagram of how exporting raw materials loses value, the value ladder of every chain, a worked example,',
      'a live section where you pick a country and its charts redraw, and five Africa-wide charts.'],
    read: ['Grey = value of the raw material; green = value added by processing, which is lost when the material is exported raw.',
      'Each chart has a caption. The tables from column N are the data behind the charts.'],
    say: ['"For every dollar of cocoa beans exported raw, someone abroad turns it into about two dollars of chocolate. The green part is the value',
      ' we give away — this page shows how much that is, for which countries and which products."'],
    watch: ['All value-lost figures use the multipliers on Value_Chains (assumptions). Section 4 redraws when you pick another country.'],
  },
  vaScore: {
    title: 'VA_Scorecard — value-addition opportunities (country × value chain)',
    what: ['One row per country and value chain where the country exports the raw or semi-processed material, with 5 sub-scores and a score.'],
    read: ['E–L = facts in USD. M–Q = sub-scores (0–1). R = value-addition score, 0–100 (live formula using the value-addition weights on Settings).',
      'S = enablers this chain needs where the country is below the African median. T = what the processing step requires.'],
    say: ['"The higher the score, the more value is at stake, the bigger the raw base and market, and the better prepared the country is to process it."'],
    watch: ['Do not type here — step 3 overwrites it. Readiness uses World Bank indicators; SAMPLE enabler data is synthetic.'],
  },
  needs: {
    title: 'Country_Needs — what a country needs to add value',
    what: ['Pick a country: its enablers compared with the African median, its value-addition opportunities, and what each processing step requires.'],
    read: ['GAP = below the African median on that enabler. Opportunities are sorted by value lost (largest first).',
      'Section 3 explains what it takes to process each raw material; section 4 sums it up in words.'],
    say: ['"To capture this value, this country mainly needs what is flagged as a gap here. For its biggest chain, processing requires what section 3 lists."'],
    watch: ['Below the median is a flag, not a verdict: check national studies. Standards and certification have no indicator, so always check them.'],
  },
  chains: {
    title: 'Value_Chains — the 25 value chains tracked (editable)',
    what: ['Each chain lists its raw, semi-processed and processed product codes (HS4 = 4-digit Harmonized System), a value multiplier and its needs.'],
    read: ['Value multiplier = how many times more the processed product is worth than the raw one — an ASSUMPTION; replace it with study values.',
      'Needs keywords: energy, industry, logistics, skills, finance, digital, standards. Some codes are broad (0901 also covers roasted coffee).'],
    say: ['"We follow each raw material through its processing stages — for example cocoa beans, then cocoa butter and powder, then chocolate."'],
    watch: ['After editing product codes, download the data again (Refresh). After editing multipliers or needs, run step 3.'],
  },
  enablers: {
    title: 'Enablers — World Bank indicators of readiness for value addition',
    what: ['Seven indicators per country from the World Bank WDI (World Development Indicators): power, industry, logistics, skills, finance, internet.'],
    read: ['Latest available value for each country; higher is better for all seven. "Data years" shows how recent the values are.'],
    say: ['"These show whether the basics for processing are in place — power, skills, finance, logistics and an industrial base."'],
    watch: ['If the status says SAMPLE the values are synthetic. Menu "Fetch World Bank enabler indicators" loads real data (free, no key).'],
  },
  rawHs4: {
    title: 'Raw_HS4 — detailed trade data for the value chains',
    what: ['Exports (X) and imports (M) with the world (WLD) for the codes on the Value_Chains tab, at HS4 (4-digit) level, in USD.'],
    read: ['Same six columns as Raw_Trade, but the product column holds 4-digit HS codes (e.g. 1801 = cocoa beans, 1806 = chocolate).'],
    say: ['"This finer detail separates raw cocoa beans from chocolate, which the 2-digit data cannot do."'],
    watch: ['Filled by the menu (sample or UN Comtrade). If you paste your own data, keep the six columns in this order.'],
  },
  raw: {
    title: 'Raw_Trade — the data everything is calculated from',
    what: ['One row = one country\'s exports (X) or imports (M) of one product, with the whole world (WLD) or with one African partner, in USD.'],
    read: ['Reporter = the country that reported the figure. Partner = the other side of the trade. Year = calendar year of the trade.'],
    say: ['"All results come from these official figures — nothing is typed in by hand. Any number on the dashboard can be traced back to here."'],
    watch: ['Replace data with the menu (Refresh, 2a, 2b or 2c). If you paste your own data, keep exactly these six columns in this order.'],
  },
};

// Every abbreviation used in the workbook, with its full name.
const ABBREVIATIONS = [
  ['AES', 'Alliance of Sahel States (Alliance des États du Sahel) — Mali, Burkina Faso, Niger; left ECOWAS in January 2025'],
  ['AfCFTA', 'African Continental Free Trade Area'],
  ['Afreximbank', 'African Export-Import Bank'],
  ['AMU', 'Arab Maghreb Union'],
  ['API', 'Application Programming Interface — the way the script downloads data automatically'],
  ['AU', 'African Union'],
  ['B / M (in numbers)', 'Billion / million (e.g. $1.2B = 1,200,000,000 US dollars)'],
  ['BACI', 'Base pour l\'Analyse du Commerce International — CEPII\'s reconciled world trade database'],
  ['CEMAC', 'Economic and Monetary Community of Central Africa (Communauté Économique et Monétaire de l\'Afrique Centrale)'],
  ['CEPII', 'Centre d\'Études Prospectives et d\'Informations Internationales (French research centre)'],
  ['CET', 'Common External Tariff'],
  ['CFA franc', 'Currency of WAEMU (West African CFA franc) and CEMAC (Central African CFA franc) countries'],
  ['COMESA', 'Common Market for Eastern and Southern Africa'],
  ['CU', 'Customs Union'],
  ['EAC', 'East African Community'],
  ['ESG', 'Environmental, Social and Governance (standards buyers ask suppliers to meet)'],
  ['EU', 'European Union'],
  ['ECCAS', 'Economic Community of Central African States'],
  ['ECOWAS', 'Economic Community of West African States'],
  ['FAQ', 'Frequently Asked Questions'],
  ['FTA', 'Free Trade Area'],
  ['GDP', 'Gross Domestic Product — the value of everything a country produces in a year'],
  ['HACCP', 'Hazard Analysis and Critical Control Points — a food-safety management standard'],
  ['HS', 'Harmonized Commodity Description and Coding System — the world standard product classification'],
  ['HS2', 'Harmonized System at 2-digit (chapter) level — 96 product groups'],
  ['HS4', 'Harmonized System at 4-digit (heading) level — about 1,200 products, e.g. 1801 cocoa beans'],
  ['ISO 22000', 'International food-safety management standard'],
  ['ISO3', 'ISO 3166-1 alpha-3 three-letter country code (ISO = International Organization for Standardization), e.g. NGA = Nigeria'],
  ['ITC', 'International Trade Centre (UN / WTO agency)'],
  ['KPI', 'Key Performance Indicator — the headline tiles on the Dashboard'],
  ['LBMA', 'London Bullion Market Association — sets the standard for refined gold'],
  ['LPI', 'Logistics Performance Index (World Bank), from 1 = low to 5 = high'],
  ['M', 'Imports (trade flow code)'],
  ['M49', 'UN standard numeric country code, used by UN Comtrade (e.g. 566 = Nigeria)'],
  ['RCA', 'Revealed Comparative Advantage (Balassa index)'],
  ['REC', 'Regional Economic Community — the regional blocs recognised by the African Union'],
  ['SACU', 'Southern African Customs Union'],
  ['SADC', 'Southern African Development Community'],
  ['UEMOA', 'Union Économique et Monétaire Ouest-Africaine (French name of WAEMU)'],
  ['UN', 'United Nations'],
  ['UN Comtrade', 'United Nations Commodity Trade Statistics Database'],
  ['UNCTAD', 'United Nations Conference on Trade and Development'],
  ['USD', 'United States dollars'],
  ['VA', 'Value addition — processing raw materials into higher-value products'],
  ['WAEMU', 'West African Economic and Monetary Union'],
  ['WDI', 'World Development Indicators — the World Bank\'s main database of country statistics'],
  ['WITS', 'World Integrated Trade Solution (World Bank)'],
  ['WLD', 'World — partner code meaning trade with all countries combined'],
  ['WTO', 'World Trade Organization'],
  ['X', 'Exports (trade flow code)'],
];

// Tabs whose first content row is a table header (frozen under the blue box).
const DATA_TABS = ['score', 'raw', 'countries', 'products', 'vaScore', 'chains', 'enablers', 'rawHs4'];

function bannerLines_(key) {
  const h = TAB_HELP[key];
  const out = [];
  [['WHAT YOU SEE', h.what], ['HOW TO READ IT', h.read], ['SAY IT LIKE THIS', h.say], ['WATCH OUT', h.watch]]
    .forEach(([label, lines]) => lines.forEach((text, i) => out.push([i === 0 ? label : '', text])));
  return out;
}

/** First row below the blue explanation box (header row on data tabs). */
function top_(key) {
  return 1 + bannerLines_(key).length + (DATA_TABS.indexOf(key) >= 0 ? 1 : 2);
}

// Row positions derived from the explanation boxes above.
const L = (() => {
  const s = top_('settings');
  return {
    settingsWeightHead: s,
    settingsWeight: s + 1,
    settingsVaHead: s + CRITERIA.length + 3,
    settingsVa: s + CRITERIA.length + 4,
    settingsParamHead: s + CRITERIA.length + VA_CRITERIA.length + 6,
    settingsParam: s + CRITERIA.length + VA_CRITERIA.length + 7,
    scoreHead: top_('score'), scoreFirst: top_('score') + 1,
    rawHead: top_('raw'), rawFirst: top_('raw') + 1,
    ctryHead: top_('countries'), ctryFirst: top_('countries') + 1,
    prodHead: top_('products'), prodFirst: top_('products') + 1,
    vaHead: top_('vaScore'), vaFirst: top_('vaScore') + 1,
    chainsHead: top_('chains'), chainsFirst: top_('chains') + 1,
    enHead: top_('enablers'), enFirst: top_('enablers') + 1,
    hs4Head: top_('rawHs4'), hs4First: top_('rawHs4') + 1,
  };
})();

/** Open-ended Scorecard column reference, e.g. sc_('B') → Scorecard!$B$8:$B */
function sc_(col) { return `Scorecard!$${col}$${L.scoreFirst}:$${col}`; }

function weightCell_(i) { return `Settings!$B$${L.settingsWeight + i}`; }
function weightRange_() { return `Settings!$B$${L.settingsWeight}:$B$${L.settingsWeight + CRITERIA.length - 1}`; }

// [ISO3, UN M49, name, AU region, capital lat, capital lon, landlocked,
//  customs unions, RECs / FTAs, AfCFTA member]
// Memberships are a starting point — edit them on the Countries tab.
const COUNTRIES = [
  ['DZA', 12, 'Algeria', 'North', 36.75, 3.06, false, '', 'AMU', true],
  ['AGO', 24, 'Angola', 'Southern', -8.84, 13.23, false, '', 'SADC;ECCAS', true],
  ['BEN', 204, 'Benin', 'West', 6.50, 2.60, false, 'WAEMU;ECOWAS', 'ECOWAS', true],
  ['BWA', 72, 'Botswana', 'Southern', -24.65, 25.91, true, 'SACU', 'SADC', true],
  ['BFA', 854, 'Burkina Faso', 'West', 12.37, -1.52, true, 'WAEMU', '', true],
  ['BDI', 108, 'Burundi', 'Central', -3.43, 29.92, true, 'EAC', 'COMESA;EAC;ECCAS', true],
  ['CPV', 132, 'Cabo Verde', 'West', 14.93, -23.51, false, 'ECOWAS', 'ECOWAS', true],
  ['CMR', 120, 'Cameroon', 'Central', 3.85, 11.50, false, 'CEMAC', 'ECCAS', true],
  ['CAF', 140, 'Central African Republic', 'Central', 4.39, 18.56, true, 'CEMAC', 'ECCAS', true],
  ['TCD', 148, 'Chad', 'Central', 12.13, 15.06, true, 'CEMAC', 'ECCAS', true],
  ['COM', 174, 'Comoros', 'East', -11.70, 43.26, false, '', 'COMESA;SADC', true],
  ['COG', 178, 'Congo', 'Central', -4.27, 15.28, false, 'CEMAC', 'ECCAS', true],
  ['COD', 180, 'DR Congo', 'Central', -4.32, 15.31, false, '', 'COMESA;SADC;EAC;ECCAS', true],
  ['CIV', 384, "Côte d'Ivoire", 'West', 6.82, -5.28, false, 'WAEMU;ECOWAS', 'ECOWAS', true],
  ['DJI', 262, 'Djibouti', 'East', 11.59, 43.15, false, '', 'COMESA', true],
  ['EGY', 818, 'Egypt', 'North', 30.04, 31.24, false, '', 'COMESA', true],
  ['GNQ', 226, 'Equatorial Guinea', 'Central', 3.75, 8.78, false, 'CEMAC', 'ECCAS', true],
  ['ERI', 232, 'Eritrea', 'East', 15.32, 38.93, false, '', 'COMESA', false],
  ['SWZ', 748, 'Eswatini', 'Southern', -26.31, 31.14, true, 'SACU', 'COMESA;SADC', true],
  ['ETH', 231, 'Ethiopia', 'East', 9.03, 38.74, true, '', 'COMESA', true],
  ['GAB', 266, 'Gabon', 'Central', 0.39, 9.45, false, 'CEMAC', 'ECCAS', true],
  ['GMB', 270, 'Gambia', 'West', 13.45, -16.58, false, 'ECOWAS', 'ECOWAS', true],
  ['GHA', 288, 'Ghana', 'West', 5.60, -0.19, false, 'ECOWAS', 'ECOWAS', true],
  ['GIN', 324, 'Guinea', 'West', 9.64, -13.58, false, 'ECOWAS', 'ECOWAS', true],
  ['GNB', 624, 'Guinea-Bissau', 'West', 11.86, -15.60, false, 'WAEMU;ECOWAS', 'ECOWAS', true],
  ['KEN', 404, 'Kenya', 'East', -1.29, 36.82, false, 'EAC', 'COMESA;EAC', true],
  ['LSO', 426, 'Lesotho', 'Southern', -29.31, 27.48, true, 'SACU', 'SADC', true],
  ['LBR', 430, 'Liberia', 'West', 6.30, -10.80, false, 'ECOWAS', 'ECOWAS', true],
  ['LBY', 434, 'Libya', 'North', 32.89, 13.19, false, '', 'AMU;COMESA', true],
  ['MDG', 450, 'Madagascar', 'East', -18.88, 47.51, false, '', 'COMESA;SADC', true],
  ['MWI', 454, 'Malawi', 'Southern', -13.96, 33.79, true, '', 'COMESA;SADC', true],
  ['MLI', 466, 'Mali', 'West', 12.64, -8.00, true, 'WAEMU', '', true],
  ['MRT', 478, 'Mauritania', 'North', 18.08, -15.98, false, '', 'AMU', true],
  ['MUS', 480, 'Mauritius', 'East', -20.16, 57.50, false, '', 'COMESA;SADC', true],
  ['MAR', 504, 'Morocco', 'North', 34.02, -6.84, false, '', 'AMU', true],
  ['MOZ', 508, 'Mozambique', 'Southern', -25.97, 32.57, false, '', 'SADC', true],
  ['NAM', 516, 'Namibia', 'Southern', -22.56, 17.08, false, 'SACU', 'SADC', true],
  ['NER', 562, 'Niger', 'West', 13.51, 2.11, true, 'WAEMU', '', true],
  ['NGA', 566, 'Nigeria', 'West', 9.08, 7.40, false, 'ECOWAS', 'ECOWAS', true],
  ['RWA', 646, 'Rwanda', 'East', -1.94, 30.06, true, 'EAC', 'COMESA;EAC;ECCAS', true],
  ['STP', 678, 'São Tomé and Príncipe', 'Central', 0.34, 6.73, false, '', 'ECCAS', true],
  ['SEN', 686, 'Senegal', 'West', 14.72, -17.47, false, 'WAEMU;ECOWAS', 'ECOWAS', true],
  ['SYC', 690, 'Seychelles', 'East', -4.62, 55.45, false, '', 'COMESA;SADC', true],
  ['SLE', 694, 'Sierra Leone', 'West', 8.48, -13.23, false, 'ECOWAS', 'ECOWAS', true],
  ['SOM', 706, 'Somalia', 'East', 2.05, 45.32, false, '', 'COMESA;EAC', true],
  ['ZAF', 710, 'South Africa', 'Southern', -25.75, 28.19, false, 'SACU', 'SADC', true],
  ['SSD', 728, 'South Sudan', 'East', 4.85, 31.58, true, 'EAC', 'EAC', true],
  ['SDN', 729, 'Sudan', 'East', 15.50, 32.56, false, '', 'COMESA', true],
  ['TZA', 834, 'Tanzania', 'East', -6.16, 35.75, false, 'EAC', 'EAC;SADC', true],
  ['TGO', 768, 'Togo', 'West', 6.14, 1.21, false, 'WAEMU;ECOWAS', 'ECOWAS', true],
  ['TUN', 788, 'Tunisia', 'North', 36.81, 10.18, false, '', 'AMU;COMESA', true],
  ['UGA', 800, 'Uganda', 'East', 0.35, 32.58, true, 'EAC', 'COMESA;EAC', true],
  ['ZMB', 894, 'Zambia', 'Southern', -15.39, 28.32, true, '', 'COMESA;SADC', true],
  ['ZWE', 716, 'Zimbabwe', 'Southern', -17.83, 31.05, true, '', 'COMESA;SADC', true],
];

// HS 2-digit chapters (77 is reserved in the HS).
const HS2 = [
  [1, 'Live animals'], [2, 'Meat'], [3, 'Fish & seafood'], [4, 'Dairy, eggs, honey'],
  [5, 'Other animal products'], [6, 'Live plants & flowers'], [7, 'Vegetables'], [8, 'Fruit & nuts'],
  [9, 'Coffee, tea, spices'], [10, 'Cereals'], [11, 'Milling products'], [12, 'Oil seeds'],
  [13, 'Lacs, gums, resins'], [14, 'Vegetable plaiting materials'], [15, 'Fats & oils'],
  [16, 'Meat & fish preparations'], [17, 'Sugar & confectionery'], [18, 'Cocoa'],
  [19, 'Cereal preparations'], [20, 'Vegetable & fruit preparations'], [21, 'Misc. food preparations'],
  [22, 'Beverages'], [23, 'Food residues & animal feed'], [24, 'Tobacco'], [25, 'Salt, stone, cement'],
  [26, 'Ores, slag & ash'], [27, 'Mineral fuels & oil'], [28, 'Inorganic chemicals'],
  [29, 'Organic chemicals'], [30, 'Pharmaceuticals'], [31, 'Fertilisers'], [32, 'Dyes, paints, inks'],
  [33, 'Essential oils & cosmetics'], [34, 'Soaps & detergents'], [35, 'Glues & enzymes'],
  [36, 'Explosives & matches'], [37, 'Photographic goods'], [38, 'Misc. chemical products'],
  [39, 'Plastics'], [40, 'Rubber'], [41, 'Raw hides & leather'], [42, 'Leather goods & bags'],
  [43, 'Furskins'], [44, 'Wood'], [45, 'Cork'], [46, 'Basketware'], [47, 'Pulp'],
  [48, 'Paper & paperboard'], [49, 'Printed matter'], [50, 'Silk'], [51, 'Wool'], [52, 'Cotton'],
  [53, 'Other vegetable fibres'], [54, 'Man-made filaments'], [55, 'Man-made staple fibres'],
  [56, 'Wadding, twine, ropes'], [57, 'Carpets'], [58, 'Special woven fabrics'],
  [59, 'Coated textiles'], [60, 'Knitted fabrics'], [61, 'Knitted apparel'], [62, 'Woven apparel'],
  [63, 'Other textile articles'], [64, 'Footwear'], [65, 'Headgear'], [66, 'Umbrellas'],
  [67, 'Feathers & artificial flowers'], [68, 'Stone & cement articles'], [69, 'Ceramics'],
  [70, 'Glass'], [71, 'Precious stones & metals'], [72, 'Iron & steel'], [73, 'Iron & steel articles'],
  [74, 'Copper'], [75, 'Nickel'], [76, 'Aluminium'], [78, 'Lead'], [79, 'Zinc'], [80, 'Tin'],
  [81, 'Other base metals'], [82, 'Tools & cutlery'], [83, 'Misc. base metal articles'],
  [84, 'Machinery & boilers'], [85, 'Electrical equipment'], [86, 'Railway equipment'],
  [87, 'Vehicles'], [88, 'Aircraft'], [89, 'Ships & boats'], [90, 'Optical & medical instruments'],
  [91, 'Clocks & watches'], [92, 'Musical instruments'], [93, 'Arms & ammunition'],
  [94, 'Furniture & bedding'], [95, 'Toys & sports goods'], [96, 'Misc. manufactured articles'],
  [97, 'Art & antiques'],
];

// Excluded from gap analysis by default (toggle on the Products tab).
const HS_EXCLUDED = [93, 97];

// [first chapter, last chapter, sector]
const SECTORS = [
  [1, 24, 'Agri-food'], [25, 27, 'Minerals & fuels'], [28, 38, 'Chemicals'],
  [39, 40, 'Plastics & rubber'], [41, 49, 'Leather, wood & paper'], [50, 63, 'Textiles & apparel'],
  [64, 67, 'Footwear & accessories'], [68, 71, 'Stone, glass & precious'], [72, 83, 'Metals'],
  [84, 85, 'Machinery & electrical'], [86, 89, 'Transport equipment'], [90, 97, 'Other manufactures'],
];

// --- Sample-data shape only. These are NOT real statistics. -------
// Rough relative economic size, used to scale the synthetic numbers.
const SAMPLE_SIZE = {
  ZAF: 100, NGA: 60, DZA: 50, EGY: 45, MAR: 40, AGO: 35, LBY: 30, COD: 25, GHA: 18, TUN: 18,
  CIV: 16, ZMB: 10, KEN: 8, COG: 8, GIN: 8, TZA: 7, GAB: 7, MOZ: 7, GNQ: 6, CMR: 6, BWA: 6,
  NAM: 6, ZWE: 6, SEN: 5, MLI: 5, BFA: 5, ETH: 4, UGA: 4, SDN: 4, TCD: 4, MDG: 3, BEN: 3,
  MRT: 3, MUS: 2.5, SWZ: 2, SSD: 2, NER: 1.5, TGO: 1.5, RWA: 1.5, LBR: 1.5, MWI: 1, LSO: 1,
  SLE: 1, DJI: 0.8, SOM: 0.8, SYC: 0.8, ERI: 0.5, CAF: 0.3, BDI: 0.3, GNB: 0.3, CPV: 0.3,
  GMB: 0.2, COM: 0.1, STP: 0.05,
};
// Chapters each country is (roughly) known to specialise in.
const SAMPLE_SPEC = {
  NGA: [27], AGO: [27], DZA: [27], LBY: [27], GNQ: [27], COG: [27], GAB: [27, 44], TCD: [27, 52],
  SSD: [27], CIV: [18, 40, 8], GHA: [18, 71, 27], CMR: [18, 27, 44], ETH: [9, 7, 12],
  KEN: [9, 6, 7], UGA: [9, 3], TZA: [71, 9, 24], ZAF: [71, 26, 87, 72, 8], ZMB: [74],
  COD: [74, 81, 26], BWA: [71], NAM: [71, 3, 26], GIN: [26, 71], MLI: [71, 52], BFA: [71, 52],
  EGY: [27, 31, 39, 8], MAR: [31, 85, 87, 8], TUN: [85, 62, 15], SEN: [3, 27, 28],
  MUS: [62, 3, 17], MDG: [9, 62], MOZ: [27, 76], ZWE: [24, 71], MWI: [24], RWA: [9, 26],
  BEN: [52], TGO: [31], MRT: [26, 3], SDN: [1, 12, 71], SOM: [1], NER: [28], SLE: [26],
  LBR: [89, 40], CAF: [44], BDI: [9], GMB: [8], GNB: [8], CPV: [3], COM: [9], DJI: [85],
  ERI: [26], STP: [18], SYC: [3], SWZ: [17, 33], LSO: [62, 71],
};
// Chapters that make up a large share of typical African import bills.
const SAMPLE_IMPORT_WEIGHT = {
  84: 4, 85: 4, 87: 3.5, 27: 3, 10: 3, 30: 2.5, 39: 2.5, 72: 2, 73: 2, 15: 2, 17: 1.5, 38: 1.5,
  48: 1.5, 63: 1.5, 90: 1.5, 88: 1.5, 4: 1.2, 2: 1.2, 11: 1.2, 19: 1.2, 21: 1.2, 25: 1.2,
  31: 1.2, 40: 1.2, 62: 1.2, 64: 1.2, 3: 1, 22: 1, 61: 1, 69: 1, 70: 1, 94: 1,
};


// ------------------------------------------------------------------
// Menu
// ------------------------------------------------------------------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Africa Trade')
    .addItem('Quick start (build + sample data + score)', 'quickStart')
    .addSeparator()
    .addItem('Refresh data (same source) & recompute', 'refreshData')
    .addItem('2a. Load SAMPLE data (synthetic, for testing)', 'loadSampleData')
    .addItem('2b. Fetch REAL data from UN Comtrade', 'fetchComtradeData')
    .addItem('2c. Clear Raw_Trade to paste your own data', 'clearRawTrade')
    .addItem('2d. Fetch World Bank enabler indicators (free)', 'fetchWorldBankData')
    .addItem('3. Compute scorecard, dashboard & charts', 'computeScorecard')
    .addSeparator()
    .addItem('Monthly auto-refresh ON / OFF', 'toggleAutoRefresh')
    .addItem('Update workbook after pasting new code (keeps your data)', 'upgradeWorkbook')
    .addItem('Reset workbook to defaults (deletes data)', 'buildWorkbook')
    .addItem('Run full audit (Health_Check)', 'runFullAudit')
    .addItem('Stop a running Comtrade fetch', 'stopComtradeFetch')
    .addToUi();
  checkVersion_();
}

/** Reminds the user to run Update when the pasted code is newer than the workbook. */
function checkVersion_() {
  try {
    const ss = SpreadsheetApp.getActive();
    if (!ss.getSheetByName(APP.sheets.settings)) return;
    const built = PropertiesService.getDocumentProperties().getProperty(APP.versionProp);
    if (built !== APP.version) {
      ss.toast(`This code is version ${APP.version}; the workbook was built with ${built || 'an older version'}. ` +
        'Run Africa Trade → Update workbook to apply it — your data is kept.', 'New code detected', 30);
    }
  } catch (e) {
    // simple triggers may lack permissions; the reminder is optional
  }
}

function quickStart() {
  if (!confirm_('Quick start will (re)build every tab, load SAMPLE data and compute the scorecard. ' +
      'Anything already in this workbook\'s app tabs will be replaced. Continue?')) return;
  buildWorkbook_();
  loadSampleData_();
  computeScorecard();
  SpreadsheetApp.getActive().getSheetByName(APP.sheets.dashboard).activate();
}

function buildWorkbook() {
  const ss = SpreadsheetApp.getActive();
  if (ss.getSheetByName(APP.sheets.settings) &&
      !confirm_('RESET rebuilds every tab with default settings and DELETES all data (only the API key is kept).\n\n' +
        'To apply new code and keep your data, cancel and use "Update workbook" instead.\n\nReset anyway?')) return;
  buildWorkbook_();
  notify_('Workbook reset. Next: load data (menu 2a, 2b or 2c).');
}

function loadSampleData() {
  requireBuilt_();
  if (!confirm_('Replace everything in Raw_Trade with SAMPLE (synthetic) data?')) return;
  loadSampleData_();
  notify_('Sample data loaded. Next: menu step 3 (Compute).');
}

function clearRawTrade() {
  requireBuilt_();
  if (!confirm_('Clear all rows in Raw_Trade and Raw_HS4 so you can paste your own data?')) return;
  clearSheetBody_(sheet_(APP.sheets.raw), L.rawFirst);
  clearSheetBody_(sheet_(APP.sheets.rawHs4), L.hs4First);
  setParam_('P_SOURCE', 'OWN');
  setParam_('P_STATUS', 'Own data (pasted into Raw_Trade by user)');
  sheet_(APP.sheets.raw).activate();
  notify_(`Cleared. Paste 2-digit rows into Raw_Trade (from row ${L.rawFirst}) and 4-digit rows into Raw_HS4 (from row ${L.hs4First}), then run step 3.`);
}

// ------------------------------------------------------------------
// Refresh, auto-refresh and code updates
// ------------------------------------------------------------------

/** Re-loads data from the same source as last time, then recomputes. */
function refreshData() {
  requireBuilt_();
  const source = String(getParam_('P_SOURCE'));
  if (source === 'COMTRADE') {
    startComtradeFetch_(true);
    return;
  }
  if (source === 'SAMPLE') {
    if (!confirm_('The data source is SAMPLE (synthetic). Regenerate sample data for the analysis year and recompute?\n\n' +
        'For real figures use 2b (UN Comtrade) instead.')) return;
    loadSampleData_();
    computeScorecard();
    return;
  }
  if (rawCount_() > 0) {
    computeScorecard();
    notify_('Recomputed from the rows in Raw_Trade. For new figures, paste them into Raw_Trade first, or use 2b (UN Comtrade).');
    return;
  }
  alert_('There is no data yet. Load data first: 2a (sample), 2b (UN Comtrade) or 2c (your own).');
}

/** Time-driven trigger handler (monthly). */
function autoRefresh() {
  const source = String(getParam_('P_SOURCE'));
  if (source === 'COMTRADE') startComtradeFetch_(false);
  else if (rawCount_() > 0) computeScorecard();
}

function toggleAutoRefresh() {
  requireBuilt_();
  const existing = autoTriggers_();
  if (existing.length) {
    existing.forEach(t => ScriptApp.deleteTrigger(t));
    setParam_('P_AUTO', 'OFF');
    notify_('Monthly auto-refresh is now OFF.');
    return;
  }
  if (!confirm_('Turn ON monthly auto-refresh?\n\nOn the 1st of every month (around 3–4 am) the workbook re-downloads ' +
      'UN Comtrade data (if that is the data source) and recomputes everything. Turn it off the same way.')) return;
  ScriptApp.newTrigger(APP.autoHandler).timeBased().onMonthDay(1).atHour(3).create();
  setParam_('P_AUTO', 'ON — 1st of each month, ~3 am');
  notify_('Monthly auto-refresh is now ON.');
}

function autoTriggers_() {
  return ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === APP.autoHandler);
}

/**
 * Applies new code to an existing workbook: rebuilds every tab's layout,
 * explanations and charts, then puts back data, weights, settings and edits.
 */
function upgradeWorkbook() {
  const ss = SpreadsheetApp.getActive();
  if (!ss.getSheetByName(APP.sheets.settings)) {
    buildWorkbook_();
    notify_('Workbook built. Next: load data (menu 2a, 2b or 2c).');
    return;
  }
  if (!confirm_(`Update this workbook to code version ${APP.version}?\n\n` +
      'Rebuilt: every tab\'s layout, explanations and charts.\n' +
      'Kept: Raw_Trade data, weights, settings, API key, and your Countries and Products edits.\n\n' +
      'Tip: File → Version history lets you go back if needed.')) return;
  const snap = snapshot_(ss);
  buildWorkbook_();
  restore_(snap);
  const filled = fillMissingValueAddition_();
  if (snap.raw.length) computeScorecard();
  if (filled) alert_(filled);
  notify_(`Workbook updated to version ${APP.version}. Kept ${snap.raw.length.toLocaleString()} data rows and your settings.`);
}

/** Reads everything worth keeping. Works with the old (v1) and new layouts. */
function snapshot_(ss) {
  const findHeader = (sh, text) => {
    if (!sh || sh.getLastRow() === 0) return 0;
    const col = sh.getRange(1, 1, Math.min(sh.getLastRow(), 40), 1).getValues();
    for (let i = 0; i < col.length; i++) if (String(col[i][0]).trim() === text) return i + 1;
    return 0;
  };
  const snap = { weights: {}, params: {}, countries: null, products: null, raw: [], hs4: [], enablers: [], chains: null };

  const st = ss.getSheetByName(APP.sheets.settings);
  if (st && st.getLastRow()) {
    const names = CRITERIA.map(c => c[0]).concat(VA_CRITERIA.map(c => c[0]));
    st.getRange(1, 1, st.getLastRow(), 2).getValues().forEach(r => {
      if (names.indexOf(r[0]) >= 0 && r[1] !== '') snap.weights[r[0]] = r[1];
    });
  }
  PARAMS.forEach(p => {
    const r = ss.getRangeByName(p[0]);
    if (r) snap.params[p[0]] = r.getValue();
  });
  if (!snap.params.P_SOURCE || snap.params.P_SOURCE === 'NONE') {
    const status = String(snap.params.P_STATUS || '');
    snap.params.P_SOURCE = /SAMPLE/i.test(status) ? 'SAMPLE' : /Comtrade/i.test(status) ? 'COMTRADE' :
      /Own/i.test(status) ? 'OWN' : 'NONE';
  }

  const ct = ss.getSheetByName(APP.sheets.countries);
  const ch = findHeader(ct, 'ISO3');
  if (ch && ct.getLastRow() > ch) {
    snap.countries = ct.getRange(ch + 1, 1, ct.getLastRow() - ch, 10).getValues()
      .filter(r => String(r[0]).trim().length === 3);
  }
  const pr = ss.getSheetByName(APP.sheets.products);
  const ph = findHeader(pr, 'HS2');
  if (ph && pr.getLastRow() > ph) {
    snap.products = {};
    pr.getRange(ph + 1, 1, pr.getLastRow() - ph, 4).getValues()
      .forEach(r => { if (Number(r[0]) > 0) snap.products[Number(r[0])] = r[3] === true; });
  }
  const rw = ss.getSheetByName(APP.sheets.raw);
  const rh = findHeader(rw, 'Year');
  if (rh && rw.getLastRow() > rh) {
    snap.raw = rw.getRange(rh + 1, 1, rw.getLastRow() - rh, 6).getValues()
      .filter(r => r[0] !== '' && r[1] !== '');
  }
  const h4 = ss.getSheetByName(APP.sheets.rawHs4);
  const h4h = findHeader(h4, 'Year');
  if (h4h && h4.getLastRow() > h4h) {
    snap.hs4 = h4.getRange(h4h + 1, 1, h4.getLastRow() - h4h, 6).getValues().filter(r => r[0] !== '' && r[1] !== '');
  }
  const en = ss.getSheetByName(APP.sheets.enablers);
  const enh = findHeader(en, 'ISO3');
  if (enh && en.getLastRow() > enh) {
    snap.enablers = en.getRange(enh + 1, 1, en.getLastRow() - enh, 3 + INDICATORS.length).getValues()
      .filter(r => String(r[0]).trim().length === 3);
  }
  const vc = ss.getSheetByName(APP.sheets.chains);
  const vch = findHeader(vc, 'Chain');
  if (vch && vc.getLastRow() > vch) {
    snap.chains = vc.getRange(vch + 1, 1, vc.getLastRow() - vch, 8).getValues().filter(r => String(r[0]).trim());
  }
  return snap;
}

function restore_(snap) {
  const st = sheet_(APP.sheets.settings);
  CRITERIA.forEach((c, i) => {
    if (snap.weights[c[0]] !== undefined) st.getRange(L.settingsWeight + i, 2).setValue(snap.weights[c[0]]);
  });
  VA_CRITERIA.forEach((c, i) => {
    if (snap.weights[c[0]] !== undefined) st.getRange(L.settingsVa + i, 2).setValue(snap.weights[c[0]]);
  });
  Object.keys(snap.params).forEach(k => {
    const v = snap.params[k];
    if (v !== '' && v !== undefined && v !== null) setParam_(k, v);
  });
  setParam_('P_AUTO', autoTriggers_().length ? 'ON — 1st of each month, ~3 am' : 'OFF');

  if (snap.countries && snap.countries.length) {
    const sh = sheet_(APP.sheets.countries);
    clearSheetBody_(sh, L.ctryFirst);
    const rows = snap.countries.map(r => r.map((v, i) => (i === 6 || i === 9) ? v === true : v));
    ensureRows_(sh, L.ctryFirst + rows.length);
    sh.getRange(L.ctryFirst, 1, rows.length, 10).setValues(rows);
    sh.getRange(L.ctryFirst, 7, rows.length, 1).insertCheckboxes();
    sh.getRange(L.ctryFirst, 10, rows.length, 1).insertCheckboxes();
  }
  if (snap.products) {
    const sh = sheet_(APP.sheets.products);
    const n = HS2.length;
    const hsCol = sh.getRange(L.prodFirst, 1, n, 1).getValues();
    const inc = sh.getRange(L.prodFirst, 4, n, 1).getValues();
    hsCol.forEach((r, i) => {
      const v = snap.products[Number(r[0])];
      if (v !== undefined) inc[i][0] = v;
    });
    sh.getRange(L.prodFirst, 4, n, 1).setValues(inc);
  }
  if (snap.raw.length) writeRaw_(snap.raw, true);
  if (snap.hs4.length) writeHs4_(snap.hs4, true);
  if (snap.chains && snap.chains.length) {
    const sh = sheet_(APP.sheets.chains);
    clearSheetBody_(sh, L.chainsFirst);
    ensureRows_(sh, L.chainsFirst + snap.chains.length);
    sh.getRange(L.chainsFirst, 3, snap.chains.length, 3).setNumberFormat('@');
    sh.getRange(L.chainsFirst, 1, snap.chains.length, 8).setValues(snap.chains.map(r => r.map(v => String(v === null ? '' : v))
      .map((v, i) => (i === 5 ? Number(v) || 1 : v))));
  }
  if (snap.enablers.length) {
    const sh = sheet_(APP.sheets.enablers);
    clearSheetBody_(sh, L.enFirst);
    ensureRows_(sh, L.enFirst + snap.enablers.length);
    sh.getRange(L.enFirst, 1, snap.enablers.length, snap.enablers[0].length).setValues(snap.enablers);
  }
}

// ------------------------------------------------------------------
// Build
// ------------------------------------------------------------------

function buildWorkbook_() {
  const ss = SpreadsheetApp.getActive();
  const keptKey = ss.getRangeByName('P_API_KEY') ? ss.getRangeByName('P_API_KEY').getValue() : '';
  const s = APP.sheets;
  const order = [s.guide, s.health, s.about, s.dashboard, s.charts, s.top, s.country, s.explain, s.score, s.settings,
    s.vaSummary, s.vaCharts, s.needs, s.vaScore, s.method, s.glossary, s.sources, s.updates, s.faq,
    s.countries, s.products, s.chains, s.enablers, s.raw, s.rawHs4];
  order.forEach((name, i) => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name, i);
    ss.setActiveSheet(sh);
    ss.moveActiveSheet(i + 1);
  });
  const stray = ss.getSheetByName('Sheet1');
  if (stray && stray.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(stray);

  buildSettings_(ss, keptKey);
  buildCountries_(ss);
  buildProducts_(ss);
  buildRawTrade_(ss);
  buildValueChains_(ss);
  buildEnablers_(ss);
  buildRawHs4_(ss);
  buildScorecard_(ss);
  buildVaScorecard_(ss);
  buildValueAddition_(ss);
  buildValueLostCharts_(ss);
  buildCountryNeeds_(ss);
  buildTopGaps_(ss);
  buildCountryView_(ss);
  buildDashboard_(ss);
  buildCharts_(ss);
  buildExplainScore_(ss);
  buildGuide_(ss);
  buildAbout_(ss);
  buildMethodology_(ss);
  buildGlossary_(ss);
  buildDataSources_(ss);
  buildUpdates_(ss);
  buildFaq_(ss);
  buildHealthCheck_(ss);
  colourTabs_(ss);
  PropertiesService.getDocumentProperties().setProperty(APP.versionProp, APP.version);
  ss.getSheetByName(APP.sheets.guide).activate();
}

/** Blue "how to read this tab" box at the top of a tab. Returns its height in rows. */
function writeBanner_(sh, key) {
  const help = TAB_HELP[key];
  const lines = bannerLines_(key);
  const h = 1 + lines.length;
  const cols = Math.min(sh.getMaxColumns(), 26);
  sh.getRange(1, 1, h, cols).setBackground(APP.color.banner);

  const titleText = `${help.title}`;
  const hint = '     ·  this blue box explains the tab — use − / + on the left to hide or show it';
  const bold = SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).setForegroundColor(APP.color.bannerText).build();
  const small = SpreadsheetApp.newTextStyle().setItalic(true).setFontSize(9).setForegroundColor('#5f6f86').build();
  sh.getRange(1, 1).setRichTextValue(SpreadsheetApp.newRichTextValue()
    .setText(titleText + hint)
    .setTextStyle(0, titleText.length, bold)
    .setTextStyle(titleText.length, titleText.length + hint.length, small).build())
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);
  sh.setRowHeight(1, 30);

  const labelStyle = SpreadsheetApp.newTextStyle().setBold(true).setFontSize(9).setForegroundColor(APP.color.bannerText).build();
  const textStyle = SpreadsheetApp.newTextStyle().setFontSize(10).setForegroundColor('#202124').build();
  lines.forEach(([label, text], i) => {
    const lead = label ? label + ':  ' : '        ';
    const full = lead + text;
    sh.getRange(2 + i, 1).setRichTextValue(SpreadsheetApp.newRichTextValue()
      .setText(full)
      .setTextStyle(0, lead.length, labelStyle)
      .setTextStyle(lead.length, full.length, textStyle).build())
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);
  });

  if (DATA_TABS.indexOf(key) < 0) {
    try {
      sh.setRowGroupControlPosition(SpreadsheetApp.GroupControlTogglePosition.BEFORE);
      sh.getRange(2, 1, lines.length, 1).shiftRowGroupDepth(1);
    } catch (e) {
      // grouping is a convenience only
    }
  }
  return h;
}

function buildSettings_(ss, keptKey) {
  const sh = resetSheet_(ss, APP.sheets.settings);
  writeBanner_(sh, 'settings');

  header_(sh.getRange(L.settingsWeightHead, 1, 1, 3), ['Criterion', 'Weight', 'What it measures']);
  sh.getRange(L.settingsWeight, 1, CRITERIA.length, 3).setValues(CRITERIA);
  sh.getRange(L.settingsWeight, 2, CRITERIA.length, 1).setBackground(APP.color.input);
  const totalRow = L.settingsWeight + CRITERIA.length;
  sh.getRange(totalRow, 1, 1, 2).setValues([['Total', `=SUM(B${L.settingsWeight}:B${totalRow - 1})`]])
    .setFontWeight('bold');
  ss.setNamedRange('WEIGHTS', sh.getRange(L.settingsWeight, 2, CRITERIA.length, 1));

  header_(sh.getRange(L.settingsVaHead, 1, 1, 3), ['Value-addition criterion', 'Weight', 'What it measures']);
  sh.getRange(L.settingsVa, 1, VA_CRITERIA.length, 3).setValues(VA_CRITERIA);
  sh.getRange(L.settingsVa, 2, VA_CRITERIA.length, 1).setBackground(APP.color.input);
  const vaTotal = L.settingsVa + VA_CRITERIA.length;
  sh.getRange(vaTotal, 1, 1, 2).setValues([['Total', `=SUM(B${L.settingsVa}:B${vaTotal - 1})`]]).setFontWeight('bold');
  ss.setNamedRange('VA_WEIGHTS', sh.getRange(L.settingsVa, 2, VA_CRITERIA.length, 1));

  header_(sh.getRange(L.settingsParamHead, 1, 1, 3), ['Parameter', 'Value', 'Notes']);
  const rows = PARAMS.map(p => [p[1], p[0] === 'P_API_KEY' ? keptKey : p[2], p[3]]);
  sh.getRange(L.settingsParam, 1, rows.length, 3).setValues(rows);
  PARAMS.forEach((p, i) => {
    const cell = sh.getRange(L.settingsParam + i, 2);
    ss.setNamedRange(p[0], cell);
    cell.setBackground(p[4] ? APP.color.input : '#f1f3f4');
  });
  sh.getRange(L.settingsParam + 1, 2).setNumberFormat('#,##0');
  sh.setColumnWidth(1, 280); sh.setColumnWidth(2, 240); sh.setColumnWidth(3, 620);
}

function buildCountries_(ss) {
  const sh = resetSheet_(ss, APP.sheets.countries);
  writeBanner_(sh, 'countries');
  const head = ['ISO3', 'UN M49', 'Country', 'AU region', 'Capital lat', 'Capital lon', 'Landlocked',
    'Customs unions (; separated)', 'RECs / FTAs (; separated)', 'AfCFTA member (verify)'];
  header_(sh.getRange(L.ctryHead, 1, 1, 10), head);
  sh.getRange(L.ctryHead, 1, 1, 10).setNotes([[
    'ISO 3166-1 alpha-3 three-letter country code', 'UN numeric country code used by UN Comtrade', '',
    'African Union (AU) region', 'Latitude of the capital (used for distances)', 'Longitude of the capital',
    'No sea coast — goods must transit through a neighbour\'s port',
    'SACU = Southern African Customs Union · EAC = East African Community · WAEMU = West African Economic and ' +
    'Monetary Union · CEMAC = Economic and Monetary Community of Central Africa · ECOWAS = Economic Community of ' +
    'West African States (common external tariff)',
    'REC = Regional Economic Community, FTA = Free Trade Area. COMESA = Common Market for Eastern and Southern ' +
    'Africa · SADC = Southern African Development Community · ECCAS = Economic Community of Central African ' +
    'States · AMU = Arab Maghreb Union · EAC · ECOWAS',
    'AfCFTA = African Continental Free Trade Area. Check ratification status at au-afcfta.org',
  ]]);
  sh.getRange(L.ctryFirst, 1, COUNTRIES.length, 10).setValues(COUNTRIES);
  sh.getRange(L.ctryFirst, 7, COUNTRIES.length, 1).insertCheckboxes();
  sh.getRange(L.ctryFirst, 10, COUNTRIES.length, 1).insertCheckboxes();
  sh.setFrozenRows(L.ctryHead);
  sh.setColumnWidth(3, 200); sh.setColumnWidth(8, 200); sh.setColumnWidth(9, 220); sh.setColumnWidth(10, 170);
}

function buildProducts_(ss) {
  const sh = resetSheet_(ss, APP.sheets.products);
  writeBanner_(sh, 'products');
  header_(sh.getRange(L.prodHead, 1, 1, 4), ['HS2', 'Product', 'Sector', 'Include in gap analysis']);
  sh.getRange(L.prodHead, 1).setNote('Harmonized System code at 2-digit (chapter) level');
  const rows = HS2.map(([hs, name]) => [hs, name, sectorOf_(hs), HS_EXCLUDED.indexOf(hs) < 0]);
  sh.getRange(L.prodFirst, 1, rows.length, 4).setValues(rows);
  sh.getRange(L.prodFirst, 1, rows.length, 1).setNumberFormat('00');
  sh.getRange(L.prodFirst, 4, rows.length, 1).insertCheckboxes();
  sh.setFrozenRows(L.prodHead);
  sh.setColumnWidth(2, 240); sh.setColumnWidth(3, 190); sh.setColumnWidth(4, 170);
}

function buildRawTrade_(ss) {
  const sh = resetSheet_(ss, APP.sheets.raw);
  writeBanner_(sh, 'raw');
  header_(sh.getRange(L.rawHead, 1, 1, 6), ['Year', 'Reporter ISO3', 'Partner ISO3 (WLD = world)',
    'Flow (X/M)', 'HS2', 'Value (USD)']);
  sh.getRange(L.rawHead, 1, 1, 6).setNotes([[
    'Calendar year of the trade', 'Country that reported the figure (ISO3 code)',
    'WLD = trade with the whole world. Any other code = an African partner.',
    'X = exports by the reporter, M = imports by the reporter.',
    'Harmonized System 2-digit product code', 'Value in US dollars (USD)']]);
  sh.getRange(L.rawFirst, 5, sh.getMaxRows() - L.rawFirst + 1, 1).setNumberFormat('00');
  sh.getRange(L.rawFirst, 6, sh.getMaxRows() - L.rawFirst + 1, 1).setNumberFormat('#,##0');
  sh.setFrozenRows(L.rawHead);
  sh.setColumnWidth(3, 190);
}

function buildScorecard_(ss) {
  const sh = resetSheet_(ss, APP.sheets.score);
  writeBanner_(sh, 'score');
  const headers = ['Exporter ISO3', 'Exporter', 'Importer ISO3', 'Importer', 'HS2', 'Product', 'Sector',
    'Importer demand (USD)', 'Exporter supply (USD)', 'Current A→B trade (USD)', 'Untapped gap (USD)',
    'Distance (km)', 'Market access']
    .concat(CRITERIA.map(c => c[0] + ' (0–1)'))
    .concat(['Composite score (0–100)', 'Import growth (raw)', 'RCA (raw)']);
  header_(sh.getRange(L.scoreHead, 1, 1, headers.length), headers);
  sh.getRange(L.scoreHead, 1, 1, headers.length).setWrap(true);
  sh.setRowHeight(L.scoreHead, 48);
  sh.setFrozenRows(L.scoreHead);
  const n = sh.getMaxRows() - L.scoreFirst + 1;
  sh.getRange(L.scoreFirst, 5, n, 1).setNumberFormat('00');
  sh.getRange(L.scoreFirst, 8, n, 5).setNumberFormat('#,##0');
  sh.getRange(L.scoreFirst, 14, n, 7).setNumberFormat('0.000');
  sh.getRange(L.scoreFirst, 21, n, 1).setNumberFormat('0.0').setFontWeight('bold');
  sh.getRange(L.scoreFirst, 22, n, 1).setNumberFormat('0.0%');
  sh.getRange(L.scoreFirst, 23, n, 1).setNumberFormat('0.00');
  const notes = ['Country that could sell (ISO3 code)', '', 'Country that could buy (ISO3 code)', '',
    'Harmonized System 2-digit product code', '', '',
    "Importer's imports of this product from the whole world, US dollars",
    "Exporter's exports of this product to the whole world, US dollars",
    'What the exporter already sells the importer (larger of both countries\' reports)',
    'min(demand, supply) − current trade', 'Great-circle distance between the two capitals',
    'Best shared arrangement: customs union > REC/FTA (Regional Economic Community / Free Trade Area) > ' +
    'AfCFTA (African Continental Free Trade Area) > other']
    .concat(CRITERIA.map(c => c[2] + ' Scaled 0–1 — see Methodology.'))
    .concat(['Weighted average of the 7 sub-scores × 100. Live formula: follows the weights on Settings.',
      "Importer's import growth vs. previous year (capped −50%…+100%). Blank = unknown.",
      'Revealed Comparative Advantage of the exporter in this product (Africa = reference). >1 = specialised.']);
  sh.getRange(L.scoreHead, 1, 1, notes.length).setNotes([notes]);
}

function buildTopGaps_(ss) {
  const sh = resetSheet_(ss, APP.sheets.top);
  writeBanner_(sh, 'top');
  const T = top_('top');
  const names = COUNTRIES.map(c => c[2]).sort();
  const sectors = SECTORS.map(s => s[2]);

  sh.getRange(T, 1, 4, 2).setValues([['Exporter (seller)', 'All'], ['Importer (buyer)', 'All'],
    ['Sector', 'All'], ['Show top', 50]]);
  sh.getRange(T, 1, 4, 1).setFontWeight('bold');
  sh.getRange(T, 2, 4, 1).setBackground(APP.color.input);
  dropdown_(sh.getRange(T, 2), ['All'].concat(names));
  dropdown_(sh.getRange(T + 1, 2), ['All'].concat(names));
  dropdown_(sh.getRange(T + 2, 2), ['All'].concat(sectors));
  dropdown_(sh.getRange(T + 3, 2), [10, 25, 50, 100, 250, 500]);
  steps_(sh, T, 4, ['Step 1: choose filters in the yellow cells (All = no filter). Ranking follows the weights on Settings.',
    'Step 2: the green NOW SHOWING line below confirms your filters and how many rows match.',
    'Step 3: to see WHY a row scores what it does, copy it into the Explain_Score tab.']);
  sh.getRange(T, 2, 3, 1).setNote('Pick from the list. The table below updates automatically — the green NOW SHOWING line confirms it.');

  const H = T + 5, F = T + 6;
  nowShowing_(sh.getRange(T + 3, 4), `="NOW SHOWING: "&IF(COUNT(I${F}:I)=0,"no opportunities",COUNT(I${F}:I)&" opportunities")&` +
    `"  ·  exporter: "&$B$${T}&"  ·  importer: "&$B$${T + 1}&"  ·  sector: "&$B$${T + 2}&"  (from "&COUNTA(${sc_('A')})&" in the Scorecard)"`);
  header_(sh.getRange(H, 1, 1, 9), ['Rank', 'Exporter', 'Importer', 'HS2', 'Product',
    'Untapped gap (USD)', 'Current trade (USD)', 'Market access', 'Score (0–100)']);
  sh.getRange(F, 1).setFormula(`=ARRAYFORMULA(IF(ISNUMBER(I${F}:I),ROW(I${F}:I)-${F - 1},))`);
  const cols = `{${sc_('B')},${sc_('D')},${sc_('E')},${sc_('F')},${sc_('K')},${sc_('J')},${sc_('M')},${sc_('U')}}`;
  const f = n => `$B$${T + n}`;
  sh.getRange(F, 2).setFormula(
    `=IFERROR(ARRAY_CONSTRAIN(SORT(FILTER(${cols},${sc_('A')}<>"",` +
    `(${f(0)}="All")+(${sc_('B')}=${f(0)}),(${f(1)}="All")+(${sc_('D')}=${f(1)}),` +
    `(${f(2)}="All")+(${sc_('G')}=${f(2)})),8,FALSE),${f(3)},8),` +
    '"No opportunities match these filters yet (or step 3 has not been run).")');
  const n = sh.getMaxRows() - F + 1;
  sh.getRange(F, 4, n, 1).setNumberFormat('00');
  sh.getRange(F, 6, n, 2).setNumberFormat('#,##0');
  sh.getRange(F, 9, n, 1).setNumberFormat('0.0').setFontWeight('bold');
  sh.setConditionalFormatRules([SpreadsheetApp.newConditionalFormatRule()
    .setGradientMaxpoint('#57bb8a').setGradientMinpoint('#ffffff')
    .setRanges([sh.getRange(F, 9, n, 1)]).build()]);
  sh.setColumnWidth(1, 150); sh.setColumnWidth(2, 170); sh.setColumnWidth(3, 170);
  sh.setColumnWidth(5, 220); sh.setColumnWidth(6, 140); sh.setColumnWidth(7, 140); sh.setColumnWidth(8, 190);
}

function buildCountryView_(ss) {
  const sh = resetSheet_(ss, APP.sheets.country);
  writeBanner_(sh, 'country');
  const T = top_('country');
  const names = COUNTRIES.map(c => c[2]).sort();
  const iso = `$B$${T + 1}`;

  sh.getRange(T, 1, 1, 2).setValues([['Country', 'Nigeria']]);
  sh.getRange(T, 2).setBackground(APP.color.input).setFontWeight('bold');
  dropdown_(sh.getRange(T, 2), names);
  sh.getRange(T + 1, 1, 1, 2).setValues([['ISO3 code',
    `=IFERROR(INDEX(Countries!$A$${L.ctryFirst}:$A,MATCH($B$${T},Countries!$C$${L.ctryFirst}:$C,0)),"")`]]);
  sh.getRange(T, 1, 2, 1).setFontWeight('bold');
  sh.getRange(T, 4).setFormula('="Year "&P_YEAR&"  ·  "&P_STATUS').setFontStyle('italic');
  steps_(sh, T + 1, 4, ['Step 1: choose a country (yellow). Step 2: the green NOW SHOWING line confirms it. Step 3: every table below updates.']);
  sh.getRange(T, 2).setNote('Pick a country. Everything on this tab updates automatically — the green NOW SHOWING line confirms it.');
  const rows = `COUNTIFS(Raw_Trade!B:B,${iso},Raw_Trade!A:A,P_YEAR)`;
  nowShowing_(sh.getRange(T + 2, 1), `=IF(${iso}="","Choose a country in the yellow cell.",IF(${rows}=0,"NOW SHOWING: "&$B$${T}&` +
    `" — no trade data reported for "&P_YEAR&". Try another year on Settings.","NOW SHOWING: "&$B$${T}&" ("&${iso}&") — "&${rows}&` +
    `" data rows for "&P_YEAR&". Every table below is for this country."))`);

  const K = T + 3;
  const sumifs = (partner, flow) =>
    `=SUMIFS(Raw_Trade!F:F,Raw_Trade!A:A,P_YEAR,Raw_Trade!B:B,${iso},Raw_Trade!C:C,"${partner}",Raw_Trade!D:D,"${flow}")`;
  const kpis = [
    ['Exports to the world (USD)', sumifs('WLD', 'X')],
    ['Imports from the world (USD)', sumifs('WLD', 'M')],
    ['Trade balance (USD) = exports − imports', `=B${K}-B${K + 1}`],
    ['Exports to African countries (USD)', sumifs('<>WLD', 'X')],
    ['Share of exports going to Africa', `=IFERROR(B${K + 3}/B${K},0)`],
    ['Imports from African countries (USD, partner-reported)',
      `=SUMIFS(Raw_Trade!F:F,Raw_Trade!A:A,P_YEAR,Raw_Trade!C:C,${iso},Raw_Trade!D:D,"X")`],
  ];
  sh.getRange(K, 1, kpis.length, 2).setValues(kpis);
  sh.getRange(K, 1, kpis.length, 1).setFontWeight('bold');
  sh.getRange(K, 2, kpis.length, 1).setNumberFormat('#,##0');
  sh.getRange(K + 4, 2).setNumberFormat('0.0%');

  const rawRange = `Raw_Trade!A${L.rawFirst}:F`;
  const q = (select, where, group, label) =>
    `=IFERROR(QUERY(${rawRange},"select ${select}, sum(F) where A = "&P_YEAR&" and ${where} ` +
    `group by ${group} order by sum(F) desc limit 10 label ${group} '${label}', sum(F) 'Value (USD)'",0),"No data")`;
  const productName = r => `=ARRAYFORMULA(IF(${r}="",,IFERROR(VLOOKUP(${r},Products!A:B,2,FALSE),"")))`;
  const countryName = r => `=ARRAYFORMULA(IF(${r}="",,IFERROR(VLOOKUP(${r},{Countries!A:A,Countries!C:C},2,FALSE),"")))`;
  const isoQ = `'"&${iso}&"'`;
  const blocks = [
    [T + 10, 1, 'Top 10 exports (to the world)', q('E', `B = ${isoQ} and C = 'WLD' and D = 'X'`, 'E', 'HS2'), productName, 'Product'],
    [T + 10, 5, 'Top 10 imports (from the world)', q('E', `B = ${isoQ} and C = 'WLD' and D = 'M'`, 'E', 'HS2'), productName, 'Product'],
    [T + 24, 1, 'Top African buyers of its exports', q('C', `B = ${isoQ} and C <> 'WLD' and D = 'X'`, 'C', 'Partner'), countryName, 'Country'],
    [T + 24, 5, 'Top African suppliers to it (partner-reported)', q('B', `C = ${isoQ} and D = 'X'`, 'B', 'Partner'), countryName, 'Country'],
  ];
  blocks.forEach(([row, col, title, query, nameFn, nameHeader]) => {
    sh.getRange(row, col).setValue(title).setFontWeight('bold').setFontColor(APP.color.title);
    sh.getRange(row + 1, col).setFormula(query);
    sh.getRange(row + 1, col + 2).setValue(nameHeader).setFontWeight('bold');
    const first = sh.getRange(row + 2, col).getA1Notation();
    const last = sh.getRange(row + 11, col).getA1Notation();
    sh.getRange(row + 2, col + 2).setFormula(nameFn(`${first}:${last}`));
    sh.getRange(row + 2, col + 1, 10, 1).setNumberFormat('#,##0');
    if (nameHeader === 'Product') sh.getRange(row + 2, col, 10, 1).setNumberFormat('00');
  });

  const O = T + 38;
  const opp = (who, filterCol) =>
    `=IFERROR(ARRAY_CONSTRAIN(SORT(FILTER({${sc_(who)},${sc_('F')},${sc_('K')},${sc_('U')}},` +
    `${sc_(filterCol)}=${iso}),4,FALSE),10,4),"—")`;
  sh.getRange(O, 1).setValue('Best opportunities to SELL more in Africa').setFontWeight('bold')
    .setFontColor(APP.color.title);
  header_(sh.getRange(O + 1, 1, 1, 4), ['Buyer', 'Product', 'Gap (USD)', 'Score']);
  sh.getRange(O + 2, 1).setFormula(opp('D', 'A'));
  sh.getRange(O, 6).setValue('Best African suppliers for what it imports').setFontWeight('bold')
    .setFontColor(APP.color.title);
  header_(sh.getRange(O + 1, 6, 1, 4), ['Supplier', 'Product', 'Gap (USD)', 'Score']);
  sh.getRange(O + 2, 6).setFormula(opp('B', 'C'));
  sh.getRange(O + 2, 3, 10, 1).setNumberFormat('#,##0');
  sh.getRange(O + 2, 8, 10, 1).setNumberFormat('#,##0');
  sh.getRange(O + 2, 4, 10, 1).setNumberFormat('0.0');
  sh.getRange(O + 2, 9, 10, 1).setNumberFormat('0.0');

  sh.setColumnWidth(1, 330); sh.setColumnWidth(2, 150); sh.setColumnWidth(3, 200);
  sh.setColumnWidth(5, 110); sh.setColumnWidth(6, 170); sh.setColumnWidth(7, 200);
}

function buildDashboard_(ss) {
  const sh = resetSheet_(ss, APP.sheets.dashboard);
  writeBanner_(sh, 'dashboard');
  const T = top_('dashboard');
  sh.getRange(T, 1).setFormula('="Data: "&P_STATUS&"   |   Year: "&P_YEAR&"   |   Last computed: "&P_LAST_REFRESH')
    .setFontStyle('italic').setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);
  sh.getRange(T + 2, 1).setValue('Run menu step 3 (Compute scorecard, dashboard & charts) to fill this page.');
  sh.setConditionalFormatRules([SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(`=ISNUMBER(SEARCH("SAMPLE",$A$${T}))`)
    .setBackground(APP.color.warn).setFontColor('#a50e0e')
    .setRanges([sh.getRange(T, 1, 1, 13)]).build()]);
}

function buildCharts_(ss) {
  const sh = resetSheet_(ss, APP.sheets.charts);
  writeBanner_(sh, 'charts');
  const T = top_('charts');
  [24, 170, 60, 170, 60, 170, 60, 170, 60, 170, 60, 100, 100, 230, 130, 130].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  const heading = (row, col, text) => sh.getRange(row, col).setValue(text).setFontSize(13).setFontWeight('bold')
    .setFontColor(APP.color.title).setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);
  const caption = (row, col, text) => sh.getRange(row, col).setValue(text).setFontStyle('italic')
    .setFontColor('#555555').setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);

  // 1. Flow diagram drawn with cells.
  heading(T, 2, '1. How the index works — the method in five steps');
  const boxes = [
    ['1. DATA\nOfficial trade figures\n(Raw_Trade tab)', '#d9e7fb'],
    ['2. FIND GAPS\nA exports it, B imports it,\nlittle flows from A to B', '#fde9c8'],
    ['3. SCORE\n7 criteria, each\nrescaled from 0 to 1', '#e2f0d9'],
    ['4. WEIGHT\nWeighted average × 100\n(weights on Settings)', '#f4dcdc'],
    ['5. RANK\nTop_Gaps, Dashboard,\nCountry_View', '#e6dcf3'],
  ];
  boxes.forEach(([text, colour], i) => {
    const col = 2 + i * 2;
    sh.getRange(T + 1, col, 3, 1).merge().setValue(text).setBackground(colour).setWrap(true)
      .setHorizontalAlignment('center').setVerticalAlignment('middle').setFontWeight('bold')
      .setBorder(true, true, true, true, false, false, '#888888', SpreadsheetApp.BorderStyle.SOLID);
    if (i < boxes.length - 1) {
      sh.getRange(T + 1, col + 1, 3, 1).merge().setValue('→').setFontSize(22).setFontColor('#888888')
        .setHorizontalAlignment('center').setVerticalAlignment('middle');
    }
  });
  sh.setRowHeights(T + 1, 3, 26);
  caption(T + 4, 2, 'Read left to right. Step 2 keeps only real gaps; step 3 makes very different numbers comparable; ' +
    'step 4 applies your priorities. Details: Methodology tab.');

  // 2. Live weights diagram.
  const W = T + 6;
  heading(W, 2, '2. What drives the score — live weights');
  header_(sh.getRange(W + 1, 2, 1, 3), ['Criterion', 'Weight', 'Share of the score']);
  sh.getRange(W + 1, 5, 1, 3).merge().setValue('').setBackground(APP.color.header);
  CRITERIA.forEach((c, i) => {
    const r = W + 2 + i;
    sh.getRange(r, 2, 1, 3).setFormulas([[`=Settings!A${L.settingsWeight + i}`, `=${weightCell_(i)}`,
      `=IFERROR(${weightCell_(i)}/SUM(${weightRange_()}),0)`]]);
    sh.getRange(r, 5, 1, 3).merge().setFormula(
      `=SPARKLINE(D${r},{"charttype","bar";"max",MAX($D$${W + 2}:$D$${W + 8});"color1","#1f4e3d"})`);
  });
  sh.getRange(W + 2, 4, CRITERIA.length, 1).setNumberFormat('0%');
  caption(W + 9, 2, 'Longer bar = counts more in the composite score. Change the weights on Settings and this updates instantly.');

  // 3. The gap, illustrated.
  const G = W + 11;
  heading(G, 2, '3. The "untapped gap", illustrated (example numbers, USD millions)');
  const steps = [
    ['Importer needs (world imports)', 500, '#4a86e8'],
    ['Exporter can supply (world exports)', 200, '#e8a33d'],
    ['Ceiling = the smaller of the two', 200, '#999999'],
    ['Already traded between them', 20, '#666666'],
    ['Untapped gap = ceiling − already traded', 180, '#1f4e3d'],
  ];
  steps.forEach(([label, v, colour], i) => {
    const r = G + 1 + i;
    sh.getRange(r, 2, 1, 2).setValues([[label, v]]);
    sh.getRange(r, 4, 1, 4).merge().setFormula(
      `=SPARKLINE(C${r},{"charttype","bar";"max",500;"color1","${colour}"})`);
  });
  sh.getRange(G + 5, 2, 1, 2).setFontWeight('bold');
  caption(G + 6, 2, 'The importer cannot buy more than it needs, the exporter cannot sell more than it makes — ' +
    'so the smaller of the two is the ceiling. What already flows is subtracted.');

  heading(G + 8, 2, '4. Charts about African trade');
  sh.getRange(G + 9, 2).setValue('Run Africa Trade → 3. Compute to draw the charts.').setFontStyle('italic')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);
  sh.setHiddenGridlines(true);
}

/** First row of the chart grid on the Charts tab. */
function chartsGridTop_() { return top_('charts') + 6 + 11 + 10; }

function buildExplainScore_(ss) {
  const sh = resetSheet_(ss, APP.sheets.explain);
  writeBanner_(sh, 'explain');
  const T = top_('explain');
  const names = COUNTRIES.map(c => c[2]).sort();
  const idx = `$B$${T + 3}`;

  sh.getRange(T, 1, 3, 2).setValues([['Exporter (seller)', 'Morocco'], ['Importer (buyer)', 'Algeria'], ['Product', 'Vehicles']]);
  sh.getRange(T, 1, 4, 1).setFontWeight('bold');
  sh.getRange(T, 2, 3, 1).setBackground(APP.color.input).setFontWeight('bold');
  dropdown_(sh.getRange(T, 2), names);
  dropdown_(sh.getRange(T + 1, 2), names);
  dropdown_(sh.getRange(T + 2, 2), HS2.map(h => h[1]));
  steps_(sh, T, 4, ['Step 1: pick an exporter, importer and product (yellow). Tip: copy them from Top_Gaps. Menu step 3 pre-selects the #1.',
    'Step 2: "Found" in column C and the green NOW SHOWING line confirm your pick.',
    'Step 3: read the story, the points table and the picture of the gap below.']);
  sh.getRange(T, 2, 3, 1).setNote('Pick from the list. Everything below updates automatically — the green NOW SHOWING line confirms it.');
  sh.getRange(T + 3, 1).setValue('Row in Scorecard');
  sh.getRange(T + 3, 2).setFormula(`=IFERROR(MATCH(1,INDEX((${sc_('B')}=$B$${T})*(${sc_('D')}=$B$${T + 1})*(${sc_('F')}=$B$${T + 2}),0),0),"")`);
  sh.getRange(T + 3, 3).setFormula(`=IF(${idx}="","Not in the Scorecard: one side does not trade this product, the gap is below the minimum, or it did not fit under the row limit.","Found")`);

  const at = col => `INDEX(${sc_(col)},${idx})`;
  const money = col => `TEXT(${at(col)},"$#,##0")`;
  const ex = `$B$${T}`, im = `$B$${T + 1}`, pr = `$B$${T + 2}`;
  nowShowing_(sh.getRange(T + 4, 1), `=IF(${idx}="","NOW SHOWING: "&${ex}&" → "&${im}&" · "&${pr}&" — not in the Scorecard (see the message above). Try another combination.",` +
    `"NOW SHOWING: "&${ex}&" → "&${im}&" · "&${pr}&" — score "&TEXT(${at('U')},"0.0")&", rank "&RANK(${at('U')},${sc_('U')})&" of "&COUNT(${sc_('U')})&".")`);
  sh.getRange(T + 5, 1).setFormula(`=IF(${idx}="","",${im}&" buys "&${money('H')}&" of "&LOWER(${pr})&" a year from the world. "&` +
    `${ex}&" sells "&${money('I')}&" of it to the world, but only "&${money('J')}&" to "&${im}&".")`);
  sh.getRange(T + 6, 1).setFormula(`=IF(${idx}="","","Untapped gap: "&${money('K')}&"   ·   Distance: "&TEXT(${at('L')},"#,##0")&" km   ·   Market access: "&${at('M')})`);
  sh.getRange(T + 7, 1).setFormula(`=IF(${idx}="","","Composite score: "&TEXT(${at('U')},"0.0")&" / 100   ·   Rank "&RANK(${at('U')},${sc_('U')})&" of "&COUNT(${sc_('U')}))`);
  sh.getRange(T + 5, 1, 3, 1).setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);
  sh.getRange(T + 7, 1).setFontWeight('bold').setFontSize(12).setFontColor(APP.color.title);

  const H = T + 9;
  header_(sh.getRange(H, 1, 1, 8), ['Criterion', 'Raw value', 'Sub-score (0–1)', 'Weight',
    'Share of weight', 'Points added', 'Contribution', 'How to read the sub-score']);
  const raw = [['H', '$#,##0'], ['I', '$#,##0'], ['K', '$#,##0'], ['M', '@'], ['L', '#,##0" km"'],
    ['V', '0.0%'], ['W', '0.00']];
  const reading = [
    '1 = the largest import market among all opportunities, 0 = the smallest.',
    '1 = the largest exporter of a product among all opportunities, 0 = the smallest.',
    '1 = the largest untapped gap among all opportunities, 0 = the smallest.',
    'Customs union / REC (Regional Economic Community) / AfCFTA / other — scores set on Settings.',
    '1 = the closest pair of capitals, 0 = the furthest; reduced if landlocked.',
    'Raw value = import growth vs. previous year. 0.33 = no growth; blank raw value = unknown (0.5).',
    'Raw value = RCA (Revealed Comparative Advantage). Above 1 (sub-score > 0.5) = the exporter is specialised.',
  ];
  const subCols = ['N', 'O', 'P', 'Q', 'R', 'S', 'T'];
  CRITERIA.forEach((c, i) => {
    const r = H + 1 + i;
    sh.getRange(r, 1, 1, 8).setValues([[
      `=Settings!A${L.settingsWeight + i}`,
      `=IF(${idx}="","",${at(raw[i][0])})`,
      `=IF(${idx}="","",${at(subCols[i])})`,
      `=${weightCell_(i)}`,
      `=IFERROR(D${r}/SUM(${weightRange_()}),0)`,
      `=IF(${idx}="","",C${r}*E${r}*100)`,
      `=IF(${idx}="","",SPARKLINE(F${r},{"charttype","bar";"max",MAX($F$${H + 1}:$F$${H + 7});"color1","#1f4e3d"}))`,
      reading[i],
    ]]);
    sh.getRange(r, 2).setNumberFormat(raw[i][1]);
  });
  const tot = H + 1 + CRITERIA.length;
  sh.getRange(tot, 1, 1, 8).setValues([['Composite score', '', '', `=SUM(D${H + 1}:D${tot - 1})`,
    `=SUM(E${H + 1}:E${tot - 1})`, `=IF(${idx}="","",SUM(F${H + 1}:F${tot - 1}))`, '',
    'Sum of points = composite score (same as the Scorecard, up to rounding).']]).setFontWeight('bold');
  sh.getRange(H + 1, 3, CRITERIA.length, 1).setNumberFormat('0.000');
  sh.getRange(H + 1, 5, CRITERIA.length + 1, 1).setNumberFormat('0.0%');
  sh.getRange(H + 1, 6, CRITERIA.length + 1, 1).setNumberFormat('0.0');
  for (let i = 0; i < CRITERIA.length; i += 2) sh.getRange(H + 1 + i, 1, 1, 8).setBackground(APP.color.band);

  const f = tot + 2;
  const labels = `A${H + 1}:A${tot - 1}`, subs = `C${H + 1}:C${tot - 1}`;
  sh.getRange(f, 1).setFormula(`=IF(${idx}="","","Strongest factor: "&INDEX(${labels},MATCH(MAX(${subs}),${subs},0))&"   ·   Weakest factor: "&INDEX(${labels},MATCH(MIN(${subs}),${subs},0)))`);
  sh.getRange(f + 1, 1).setValue('Try it: change a weight on Settings and watch the points, composite score and rank change here.')
    .setFontStyle('italic');
  sh.getRange(f, 1, 2, 1).setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);

  // Gap anatomy for the selected opportunity.
  const G = f + 3;
  sh.getRange(G, 1).setValue('Picture of this gap (USD)').setFontWeight('bold').setFontSize(12).setFontColor(APP.color.title);
  const parts = [
    ['Importer needs (world imports)', `=IF(${idx}="","",${at('H')})`, '#4a86e8'],
    ['Exporter can supply (world exports)', `=IF(${idx}="","",${at('I')})`, '#e8a33d'],
    ['Ceiling = the smaller of the two', `=IF(${idx}="","",MIN(B${G + 1},B${G + 2}))`, '#999999'],
    ['Already traded between them', `=IF(${idx}="","",${at('J')})`, '#666666'],
    ['Untapped gap = ceiling − already traded', `=IF(${idx}="","",${at('K')})`, '#1f4e3d'],
  ];
  parts.forEach(([label, formula, colour], i) => {
    const r = G + 1 + i;
    sh.getRange(r, 1, 1, 2).setValues([[label, formula]]);
    sh.getRange(r, 3, 1, 4).merge().setFormula(
      `=IF(${idx}="","",SPARKLINE(B${r},{"charttype","bar";"max",MAX($B$${G + 1}:$B$${G + 2});"color1","${colour}"}))`);
  });
  sh.getRange(G + 1, 2, 5, 1).setNumberFormat('$#,##0');
  sh.getRange(G + 5, 1, 1, 2).setFontWeight('bold');
  sh.getRange(G + 6, 1).setValue('The importer cannot buy more than it needs and the exporter cannot sell more than it makes; ' +
    'what already flows between them is subtracted.').setFontStyle('italic')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);

  sh.setColumnWidth(1, 250); sh.setColumnWidth(2, 170); sh.setColumnWidth(3, 120); sh.setColumnWidth(4, 70);
  sh.setColumnWidth(5, 110); sh.setColumnWidth(6, 100); sh.setColumnWidth(7, 160); sh.setColumnWidth(8, 600);
}

/** Point Explain_Score at the top-ranked opportunity under the current weights. */
function selectTopForExplain_(rows) {
  if (!rows.length) return;
  const w = SpreadsheetApp.getActive().getRangeByName('WEIGHTS').getValues().map(r => Number(r[0]) || 0);
  let best = null, bestScore = -1;
  rows.forEach(r => {
    const s = w.reduce((acc, wi, i) => acc + wi * r[13 + i], 0);
    if (s > bestScore) { bestScore = s; best = r; }
  });
  sheet_(APP.sheets.explain).getRange(top_('explain'), 2, 3, 1).setValues([[best[1]], [best[3]], [best[5]]]);
}

function colourTabs_(ss) {
  const s = APP.sheets;
  const groups = [
    ['#4a86e8', [s.guide, s.about, s.method, s.glossary, s.sources, s.updates, s.faq]],
    ['#1f4e3d', [s.health, s.dashboard, s.charts, s.top, s.country, s.explain, s.score, s.vaSummary, s.vaCharts, s.needs, s.vaScore]],
    ['#e8a33d', [s.settings, s.countries, s.products, s.chains]],
    ['#999999', [s.raw, s.enablers, s.rawHs4]],
  ];
  groups.forEach(([colour, names]) => names.forEach(n => {
    const sh = ss.getSheetByName(n);
    if (sh) sh.setTabColor(colour);
  }));
}


// ------------------------------------------------------------------
// Explanation tabs
// ------------------------------------------------------------------

/**
 * Writes a readable text page. Blocks:
 *   ['title', text] ['sub', text] ['h', text] ['p', text] ['gap']
 *   ['table', [headers], [[row], ...]]
 */
function writeDocPage_(ss, name, blocks, widths) {
  const sh = resetSheet_(ss, name);
  const w = widths || [24, 230, 430, 320, 260];
  w.forEach((px, i) => sh.setColumnWidth(i + 1, px));
  let row = 1;
  blocks.forEach(b => {
    const kind = b[0];
    if (kind === 'gap') { row++; return; }
    if (kind === 'table') {
      const head = b[1], rows = b[2];
      header_(sh.getRange(row, 2, 1, head.length), head);
      row++;
      sh.getRange(row, 2, rows.length, head.length).setValues(rows)
        .setWrap(true).setVerticalAlignment('top');
      for (let i = 0; i < rows.length; i += 2) {
        sh.getRange(row + i, 2, 1, head.length).setBackground(APP.color.band);
      }
      sh.getRange(row, 2, rows.length, 1).setFontWeight('bold');
      row += rows.length + 1;
      return;
    }
    const cell = sh.getRange(row, 2).setValue(b[1])
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);
    if (kind === 'title') cell.setFontSize(20).setFontWeight('bold').setFontColor(APP.color.title);
    if (kind === 'sub') cell.setFontSize(11).setFontStyle('italic').setFontColor('#555555');
    if (kind === 'h') {
      sh.getRange(row, 2, 1, w.length - 1).setBackground(APP.color.header);
      cell.setFontSize(12).setFontWeight('bold').setFontColor(APP.color.headerText);
    }
    row++;
  });
  sh.setHiddenGridlines(true);
  return sh;
}

function buildGuide_(ss) {
  const s = APP.sheets;
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const helpRows = ['health', 'dashboard', 'charts', 'top', 'country', 'explain', 'score', 'vaSummary', 'vaCharts', 'needs', 'vaScore', 'settings',
    'countries', 'products', 'chains', 'enablers', 'raw', 'rawHs4']
    .map(k => {
      const h = TAB_HELP[k];
      return [h.title.split(' — ')[0], h.what.join(' '), h.read.join(' '), h.say.join('').trim(), h.watch.join(' ')];
    });
  writeDocPage_(ss, s.guide, [
    ['title', 'START HERE — Africa Trade Gap Scorecard'],
    ['sub', 'What African countries import and export, where they could trade more with each other, and how much value they could add by processing.'],
    ['sub', `Code version ${APP.version} · workbook built ${stamp}`],
    ['gap'],
    ['h', 'Get going in 4 steps'],
    ['table', ['Step', 'What to do', 'What happens'], [
      ['1. Build', 'Menu Africa Trade → Quick start (first time only)', 'Creates every tab, header, formula, chart area and dropdown.'],
      ['2. Load data', 'Pick ONE: 2a SAMPLE · 2b UN Comtrade (United Nations Commodity Trade Statistics Database) · 2c your own data', 'Fills Raw_Trade. See Data_Sources for what each option means.'],
      ['3. Compute', 'Menu → 3. Compute scorecard, dashboard & charts', 'Scores every exporter → importer → product combination and draws the charts.'],
      ['4. Explore', 'Dashboard, Charts, Top_Gaps, Country_View, Explain_Score, Value_Addition, Country_Needs', 'Change weights on Settings — rankings update instantly.'],
      ['5. Check', 'Open Health_Check', 'Every line should say OK. For a deep check run Africa Trade → Run full audit.'],
      ['Later', 'Refresh data · Monthly auto-refresh · Update workbook (new code)', 'All explained on the Refresh_&_Updates tab.'],
    ]],
    ['h', 'Every results and input tab starts with a blue box'],
    ['p', 'It has four parts: WHAT YOU SEE · HOW TO READ IT · SAY IT LIKE THIS (a sentence you can use when presenting) · WATCH OUT.'],
    ['p', 'Use the − / + button at the top left of the tab to hide or show it. All the boxes are also collected at the bottom of this page.'],
    ['gap'],
    ['h', 'Tabs with a picker (dropdown): how you know the new data is shown'],
    ['table', ['Tab', 'Where you pick', 'What confirms the change'], [
      [s.top, 'Yellow cells: exporter, importer, sector, show top', 'The green NOW SHOWING line repeats your filters and counts the matching rows.'],
      [s.country, 'Yellow country cell', 'The green NOW SHOWING line names the country and counts its data rows for the year.'],
      [s.explain, 'Yellow exporter, importer and product cells', '"Found" in column C and the green NOW SHOWING line with the score and rank.'],
      [s.needs, 'Yellow country cell', 'The green NOW SHOWING line names the country and counts its indicators and value chains.'],
      [s.vaCharts, 'Yellow country cell in section 4', 'The green NOW SHOWING line, the table headers and both chart legends show the country name.'],
      [s.settings, 'Yellow weight cells', 'Scores on Scorecard and VA_Scorecard, Top_Gaps order and Explain_Score points and rank change at once.'],
    ]],
    ['p', 'If the green line says there is nothing to show, it also says why (no data for that year, no raw exports in the 25 chains, or data not loaded yet).'],
    ['gap'],
    ['h', 'Tab map  (tab colours: blue = explanation · green = results · orange = your inputs · grey = data)'],
    ['table', ['Tab', 'Type', 'What it is for'], [
      [s.guide, 'Explanation', 'This page: steps, tab map, presentation script, abbreviations.'],
      [s.health, 'Results', 'Live checks that everything works (OK / CHECK) and a full audit that scans every tab for errors.'],
      [s.about, 'Explanation', 'What the tool is, why it exists, and which questions it answers.'],
      [s.dashboard, 'Results', 'Africa-wide totals, one row per country, charts of intra-African share and gaps by sector.'],
      [s.charts, 'Results', 'Diagrams of how the index works, live weights, the gap illustrated, and six charts.'],
      [s.top, 'Results', 'Ranked list of the best trade opportunities. Filter by exporter, importer and sector.'],
      [s.country, 'Results', 'Pick one country: top exports and imports, African buyers and suppliers, best opportunities.'],
      [s.explain, 'Results', 'Pick one opportunity and see exactly how its score was built, criterion by criterion.'],
      [s.score, 'Results', 'The full composite index: raw inputs, 7 sub-scores (0–1) and the composite score (0–100).'],
      [s.vaSummary, 'Results', 'Value addition per country: raw vs processed exports, processing share, value lost, charts.'],
      [s.vaCharts, 'Results', 'Value lost made visual: how it happens (diagram), value ladder per chain, worked example, a live country view, 5 charts.'],
      [s.needs, 'Results', 'Pick a country: enablers vs the African median, its value-addition opportunities, what processing requires.'],
      [s.vaScore, 'Results', 'Every country × value chain with 5 sub-scores and a value-addition score (0–100).'],
      [s.settings, 'Your inputs', 'Weights of the 7 criteria and other parameters (yellow cells).'],
      [s.method, 'Explanation', 'Every formula, step by step, with a worked example and the known limits.'],
      [s.glossary, 'Explanation', 'Plain-English meaning of every term.'],
      [s.sources, 'Explanation', 'Where the numbers come from, the data format, and known gaps.'],
      [s.updates, 'Explanation', 'How to refresh the data, switch on auto-refresh, and safely update the code.'],
      [s.faq, 'Explanation', 'Common questions and answers.'],
      [s.countries, 'Your inputs', '54 countries with region, capital location, customs unions, RECs and AfCFTA status. Editable.'],
      [s.products, 'Your inputs', '96 HS (Harmonized System) product groups with sector. Untick "Include" to leave one out.'],
      [s.chains, 'Your inputs', 'The 25 value chains: raw, semi-processed and processed HS4 codes, value multipliers and needs.'],
      [s.enablers, 'Data', 'World Bank indicators of readiness: electricity, industry, logistics, skills, finance, internet.'],
      [s.raw, 'Data', 'The 2-digit trade figures the trade-gap analysis is calculated from.'],
      [s.rawHs4, 'Data', 'The 4-digit trade figures the value-addition analysis is calculated from.'],
    ]],
    ['h', 'Presenting this workbook in 5 minutes'],
    ['table', ['#', 'Tab', 'What to show', 'What to say'], [
      [1, s.about, '"The problem" section', '"Africa trades far more with the rest of the world than with itself — even when a neighbour makes what we import."'],
      [2, s.charts, 'Diagram 1 (five boxes)', '"We take official trade data, find where a gap exists, score each gap on 7 criteria, weight them, and rank them."'],
      [3, s.dashboard, 'Tiles and "Africa share of exports"', '"Only a small part of each country\'s exports stays in Africa. The sector table shows where the potential is."'],
      [4, s.top, 'The top 10, then filter for your audience\'s country', '"These are the most promising pairings: the buyer already imports it, the seller already exports it — just not to each other."'],
      [5, s.explain, 'The #1 opportunity', '"Here is why it scores so high: most points come from the size of the gap and market access."'],
      [6, s.settings, 'Change one weight live', '"If we care more about distance, the ranking changes like this — the method is transparent."'],
      [7, s.vaSummary, 'Top of the country table and the charts', '"Many countries export raw materials and buy the processed goods back. This is the value left on the table."'],
      ['7b', s.vaCharts, 'Diagram 1, the value ladder, then section 4 for your audience\'s country', '"For every dollar exported raw, the processed product is worth more — the green part is what we give away."'],
      [8, s.needs, 'Your audience\'s country', '"To capture that value, this country needs these enablers — and this is what processing each material requires."'],
      [9, s.method, '"Know the limits"', '"These are leads to investigate, not guarantees. Official data misses informal trade."'],
    ]],
    ['h', 'Abbreviations — full names'],
    ['table', ['Abbreviation', 'Full name / meaning'], ABBREVIATIONS],
    ['h', 'All tab explanations in one place (same text as the blue boxes)'],
    ['table', ['Tab', 'What you see', 'How to read it', 'Say it like this', 'Watch out'], helpRows],
    ['h', 'Before you share results'],
    ['p', '• Check the data line on the Dashboard. If it says SAMPLE DATA, the numbers are synthetic and must not be quoted.'],
    ['p', '• Read "Know the limits" on the Methodology tab. Results are leads to investigate, not conclusions.'],
  ], [24, 170, 330, 330, 360, 300]);
}

function buildAbout_(ss) {
  writeDocPage_(ss, APP.sheets.about, [
    ['title', 'About this tool'],
    ['sub', 'A composite index (also called a scorecard or multi-criteria decision tool) for intra-African trade.'],
    ['gap'],
    ['h', 'The problem'],
    ['p', 'African countries trade far more with the rest of the world than with each other. Commonly cited estimates from UNCTAD'],
    ['p', '(United Nations Conference on Trade and Development) and Afreximbank (African Export-Import Bank) put intra-African trade at'],
    ['p', 'around 15% of the continent\'s total trade, compared with well over half within Europe or Asia.'],
    ['p', 'Yet the same product is often exported by one African country and imported by another — from outside Africa.'],
    ['p', 'The AfCFTA (African Continental Free Trade Area) is lowering tariffs between members, so these gaps are becoming easier to close.'],
    ['gap'],
    ['h', 'What this tool does'],
    ['table', ['Part', 'What it gives you'], [
      ['1. Trade picture', 'Imports and exports of each of the 54 African countries — by product (HS 2-digit, Harmonized System) and by African partner. See Dashboard, Charts and Country_View.'],
      ['2. Gap finder', 'For every pair of countries and every product: does A export it, does B import it, and how much of that already flows from A to B? The difference is the "untapped gap".'],
      ['3. Composite index', 'Each gap is scored on 7 criteria (demand, supply, gap size, market access, proximity, growth, competitiveness), weighted and combined into one score from 0 to 100.'],
      ['4. Value addition', 'For 25 value chains (cocoa → chocolate, copper ore → cable, crude → fuel…): how much each country processes before it exports, the value lost by exporting raw, and what it needs (power, skills, finance, logistics…) to process more. See Value_Addition and Country_Needs.'],
      ['5. Decision support', 'Rankings you can filter, and weights you can change to reflect your priorities — e.g. give more weight to proximity if logistics is your main concern.'],
    ]],
    ['h', 'Questions it answers'],
    ['p', '• Which African countries could supply what my country currently imports from outside Africa?'],
    ['p', '• Where are the biggest untapped markets in Africa for my country\'s exports?'],
    ['p', '• Which sectors hold the largest unrealised intra-African trade?'],
    ['p', '• How much of each country\'s exports already go to other African countries?'],
    ['p', '• Why does a particular opportunity rank high or low? (Explain_Score tab)'],
    ['p', '• How much value does each country lose by exporting raw materials, and what would it need to process them? (Value_Addition, Country_Needs)'],
    ['gap'],
    ['h', 'Who it is for'],
    ['p', 'Trade promotion agencies, chambers of commerce, exporters and importers, policy analysts, researchers, students and journalists.'],
    ['gap'],
    ['h', 'How it works — in one line (diagram on the Charts tab)'],
    ['p', 'Raw_Trade data  →  find every exporter/importer/product gap  →  score 7 criteria (0–1)  →  weighted average (0–100)  →  rankings & dashboard.'],
    ['gap'],
    ['h', 'What it is NOT'],
    ['p', '• Not a forecast: a high score says the conditions look favourable, not that trade will happen.'],
    ['p', '• Not a market study: it does not know about product quality standards, non-tariff barriers, prices or buyer relationships.'],
    ['p', '• Not complete: official statistics miss informal cross-border trade and some countries report late or not at all.'],
    ['p', 'Use it to decide WHERE to look first, then investigate the shortlisted opportunities in depth.'],
  ]);
}

function buildMethodology_(ss) {
  const w = CRITERIA.map(c => c[1]);
  const ex = [0.72, 0.65, 0.70, 0.80, 0.90, 0.60, 0.55];
  const wSum = w.reduce((a, b) => a + b, 0);
  const exSum = ex.reduce((a, v, i) => a + v * w[i], 0);
  writeDocPage_(ss, APP.sheets.method, [
    ['title', 'Methodology'],
    ['sub', 'Exactly how every number in the Scorecard is calculated. A picture of the method is on the Charts tab.'],
    ['gap'],
    ['h', 'Step 1 — Find the candidate opportunities'],
    ['p', 'For every exporter A, every importer B (B ≠ A) and every included product p, using the analysis year on Settings:'],
    ['p', '   Supply  S = A\'s exports of p to the world           Demand  D = B\'s imports of p from the world'],
    ['p', '   Current C = what A already sells B of p (the larger of A\'s reported exports to B and B\'s reported imports from A)'],
    ['p', '   Untapped gap  G = min(D, S) − C'],
    ['p', 'Why min(D, S)? B cannot buy more than it needs, and A cannot sell more than it makes, so the smaller of the two is the ceiling.'],
    ['p', 'A combination is kept only if S > 0, D > 0 and G is at least the minimum gap on Settings. The largest gaps are kept, up to the row limit.'],
    ['gap'],
    ['h', 'Step 2 — Score each criterion from 0 to 1'],
    ['table', ['Criterion', 'Formula / scaling', 'Why it matters'], [
      ['Demand', 'log10(1 + D), then min-max across all opportunities: (x − min) / (max − min)', 'A big import market has room for a new supplier.'],
      ['Supply capacity', 'log10(1 + S), then min-max', 'A big exporter can actually deliver the volumes.'],
      ['Untapped gap', 'log10(1 + G), then min-max', 'The size of the prize.'],
      ['Market access', 'Same customs union → 1.0. Else same REC (Regional Economic Community) or FTA (Free Trade Area) → 0.8. Else both in AfCFTA (African Continental Free Trade Area) → 0.6. Else 0.3. (Values editable on Settings.)', 'Shared trade agreements mean lower tariffs and simpler customs.'],
      ['Proximity', '1 − (distance − min) / (max − min), using great-circle distance between capitals. × 0.85 if either country is landlocked', 'Shorter, cheaper transport. Landlocked countries face extra transit costs.'],
      ['Demand growth', 'g = (D this year − D last year) / D last year, capped to −50%…+100%, scaled as (g + 0.5) / 1.5. Unknown → 0.5', 'A growing market is easier to enter.'],
      ['Competitiveness (RCA = Revealed Comparative Advantage)', 'RCA = (S / A\'s total exports) ÷ (Africa\'s exports of p / Africa\'s total exports). Scaled as RCA / (1 + RCA)', 'RCA > 1 means A is relatively specialised in p — likely competitive. Scaled score > 0.5.'],
    ]],
    ['p', 'Why a log scale? Trade values range from thousands to billions of dollars. Without logs, a few giant flows (oil, gold) would squash every other score to near zero.'],
    ['p', 'Min-max scaling means scores are RELATIVE: 1.0 = the highest value among the opportunities in this Scorecard, 0 = the lowest.'],
    ['gap'],
    ['h', 'Step 3 — Combine into the composite score'],
    ['p', 'Composite = (w1·s1 + w2·s2 + … + w7·s7) ÷ (w1 + w2 + … + w7) × 100'],
    ['p', 'The weights w come from Settings. They are relative — they do not need to add up to 100. A weight of 0 switches a criterion off.'],
    ['p', 'The composite is a live sheet formula, so changing a weight re-ranks Scorecard, Top_Gaps, Explain_Score and Charts instantly.'],
    ['gap'],
    ['h', 'Worked example (illustrative numbers)'],
    ['table', ['Criterion', 'Sub-score', 'Default weight', 'Contribution = sub-score × weight'], [
      ['Demand', ex[0], w[0], Math.round(ex[0] * w[0] * 100) / 100],
      ['Supply capacity', ex[1], w[1], Math.round(ex[1] * w[1] * 100) / 100],
      ['Untapped gap', ex[2], w[2], Math.round(ex[2] * w[2] * 100) / 100],
      ['Market access', ex[3], w[3], Math.round(ex[3] * w[3] * 100) / 100],
      ['Proximity', ex[4], w[4], Math.round(ex[4] * w[4] * 100) / 100],
      ['Demand growth', ex[5], w[5], Math.round(ex[5] * w[5] * 100) / 100],
      ['Competitiveness (RCA)', ex[6], w[6], Math.round(ex[6] * w[6] * 100) / 100],
      ['Composite score', '', 'Σ weights = ' + wSum,
        'Σ = ' + exSum.toFixed(2) + '  →  ' + exSum.toFixed(2) + ' ÷ ' + wSum + ' × 100 = ' + (exSum / wSum * 100).toFixed(1)],
    ]],
    ['p', 'Read: sum of contributions ÷ sum of weights × 100. The Explain_Score tab does this live for any real opportunity.'],
    ['gap'],
    ['h', 'Step 4 — Summaries'],
    ['p', '• Intra-African exports of a country = sum of its flows to African partners (exporter-reported, or partner-reported when larger).'],
    ['p', '• Africa share of exports = intra-African exports ÷ exports to the world.'],
    ['p', '• Sector gap = sum of gaps in that sector. Gaps overlap (one supplier is counted against every buyer) so this shows scale, not an achievable total.'],
    ['gap'],
    ['h', 'Value addition (Value_Addition, VA_Scorecard, Country_Needs tabs)'],
    ['p', 'Each of the 25 value chains on the Value_Chains tab lists raw, semi-processed and processed HS4 (4-digit) codes. For every country and chain:'],
    ['p', '   Processing share = (semi-processed exports + processed exports) ÷ (raw + semi-processed + processed exports)'],
    ['p', '   Value lost (estimate) = raw exports × (multiplier − 1) + semi-processed exports × (multiplier − 1) ÷ 2'],
    ['p', '   Round-trip imports = min(raw exports, processed imports): processed goods bought back while the raw material is exported'],
    ['p', 'The multiplier (e.g. 2.0 = the processed product is worth twice the raw material) is an ASSUMPTION on the Value_Chains tab — replace it with study values.'],
    ['table', ['Value-addition criterion', 'Formula / scaling', 'Why it matters'], [
      ['Value at stake', 'log10(1 + value lost), then min-max', 'The size of the prize from processing.'],
      ['Raw material base', 'log10(1 + raw + semi-processed exports), then min-max', 'Processing needs a steady supply of the raw material.'],
      ['Processing gap', '1 − processing share', 'How much of the chain is still exported raw.'],
      ['Market for processed goods', '½ × min-max of log home imports of the processed goods + ½ × min-max of log Africa-wide imports', 'A buyer at home or in Africa for the processed product.'],
      ['Readiness (enablers)', 'Average of the min-max-scaled World Bank indicators this chain needs (e.g. electricity, finance). No data → 0.5', 'Whether the basics for processing are in place.'],
    ]],
    ['p', 'Value-addition score = weighted average of the 5 sub-scores × 100, with the value-addition weights on Settings (live formula).'],
    ['p', 'Needs flagged = the enablers a chain needs (Value_Chains → Needs) where the country is below the African median. Standards are always listed "(check)".'],
    ['gap'],
    ['h', 'Know the limits'],
    ['p', '• Value lost uses assumed multipliers and 4-digit codes that can be broader than the chain (0901 includes roasted coffee, 7102 cut diamonds).'],
    ['p', '• Enabler indicators are national averages with different latest years; a country can have a strong industrial zone despite a low average.'],
    ['p', '• Reporting gaps: several African countries report to UN Comtrade late or not at all; missing reporters appear as zero.'],
    ['p', '• Informal cross-border trade is not recorded, so actual intra-African trade is higher than the statistics show.'],
    ['p', '• HS 2-digit (Harmonized System chapter) is broad: "Cereals" can be wheat on one side and maize on the other. Drill down before acting.'],
    ['p', '• Capitals are a rough proxy for where goods travel; real routes, ports and corridors differ.'],
    ['p', '• Access tiers are simplified: they ignore product-specific tariffs, rules of origin, sensitive-product lists and non-tariff barriers.'],
    ['p', '• Scores are relative to the opportunities in this Scorecard; they are not comparable across different data loads.'],
  ]);
}

function buildGlossary_(ss) {
  writeDocPage_(ss, APP.sheets.glossary, [
    ['title', 'Glossary'],
    ['sub', 'Plain-English meaning of the terms used in this workbook. Abbreviations with full names are on the Guide tab.'],
    ['gap'],
    ['table', ['Term', 'Meaning'], [
      ['Composite index', 'A single score built by combining several indicators (criteria) with weights. Also called a scorecard or multi-criteria decision tool.'],
      ['Criterion / sub-score', 'One of the 7 factors scored from 0 to 1 (e.g. Demand, Proximity).'],
      ['Weight', 'How much a criterion counts in the composite. Set on the Settings tab. Relative, not percentages.'],
      ['Normalisation (min-max)', 'Rescaling values to 0–1: (value − smallest) ÷ (largest − smallest).'],
      ['Log scale', 'Using the logarithm of a value so that very large numbers do not dominate. 1,000 → 3, 1,000,000 → 6, 1,000,000,000 → 9.'],
      ['Untapped gap', 'min(importer\'s world imports, exporter\'s world exports) minus what already flows between them, for one product.'],
      ['Exporter / Importer', 'The country that could sell (supplier) and the country that could buy (market).'],
      ['Reporter / Partner', 'In trade data, the reporter is the country that submitted the figure; the partner is the other side of the flow.'],
      ['WLD (World)', 'Partner code meaning "the whole world" (total trade).'],
      ['Flow X / M', 'X = exports by the reporter. M = imports by the reporter.'],
      ['Mirror data', 'Using the partner\'s report to fill in a missing figure, e.g. B\'s imports from A in place of A\'s exports to B.'],
      ['HS code (Harmonized System)', 'The world standard product classification used by customs. HS2 = 96 chapters (e.g. 09 Coffee, tea, spices). HS4/HS6 are finer.'],
      ['Sector', 'A group of HS chapters used in this tool (e.g. Agri-food = HS 01–24).'],
      ['RCA (Revealed Comparative Advantage)', 'Balassa index: share of a product in a country\'s exports ÷ its share in Africa\'s exports. Above 1 = relatively specialised.'],
      ['Intra-African trade', 'Trade between African countries (not with the rest of the world).'],
      ['Trade balance', 'Exports minus imports. Negative = trade deficit.'],
      ['AfCFTA (African Continental Free Trade Area)', 'The agreement creating a single market across African Union members, in force since 2019, trading since 2021.'],
      ['REC (Regional Economic Community)', 'The regional blocs recognised by the African Union (e.g. ECOWAS, SADC, EAC, COMESA, ECCAS, AMU).'],
      ['Customs union', 'Members trade freely with each other AND apply a common external tariff (CET). Deeper than a free trade area.'],
      ['FTA (Free Trade Area)', 'Members remove tariffs between themselves but keep their own tariffs toward others.'],
      ['SACU (Southern African Customs Union)', 'Botswana, Eswatini, Lesotho, Namibia, South Africa.'],
      ['EAC (East African Community)', 'Customs union: Kenya, Uganda, Tanzania, Rwanda, Burundi, South Sudan, DR Congo, Somalia.'],
      ['ECOWAS (Economic Community of West African States)', 'West African bloc that applies a common external tariff (CET).'],
      ['WAEMU / UEMOA (West African Economic and Monetary Union)', 'Customs and currency union (CFA franc) of 8 West African states.'],
      ['CEMAC (Economic and Monetary Community of Central Africa)', 'Customs and currency union of 6 Central African states.'],
      ['COMESA (Common Market for Eastern and Southern Africa)', '21 member states with a free trade area.'],
      ['SADC (Southern African Development Community)', '16 member states with a free trade area.'],
      ['ECCAS (Economic Community of Central African States)', 'Central African regional bloc.'],
      ['AMU (Arab Maghreb Union)', 'Algeria, Libya, Mauritania, Morocco, Tunisia (largely inactive).'],
      ['ISO3', 'Three-letter country code from the International Organization for Standardization (e.g. NGA = Nigeria).'],
      ['M49', 'UN numeric country code, used by UN Comtrade (e.g. 566 = Nigeria).'],
      ['UN Comtrade', 'United Nations Commodity Trade Statistics Database — official trade statistics reported by countries.'],
      ['Landlocked', 'A country without a sea coast; its goods must transit through a neighbour\'s port.'],
      ['Informal cross-border trade', 'Trade that bypasses official customs recording, common across African land borders.'],
      ['Value addition (VA)', 'Processing a raw material into a product worth more — e.g. cocoa beans into chocolate. Also called beneficiation for minerals.'],
      ['Value chain', 'The stages a product goes through: raw material → semi-processed → processed (final) product.'],
      ['Processing share', 'Part of a country\'s exports in a value chain that is already processed: (semi-processed + processed) ÷ all exports in that chain.'],
      ['Value multiplier', 'How many times more a processed product is worth than its raw material. An assumption on the Value_Chains tab.'],
      ['Value lost (estimate)', 'Extra export value a country could earn if it processed its raw exports first: raw exports × (multiplier − 1) (+ half for semi-processed).'],
      ['Round-trip trade', 'Exporting a raw material while importing the processed product made from it (e.g. crude oil out, petrol in).'],
      ['Enabler', 'A condition that makes processing possible: electricity, industrial base, logistics, skills, finance, digital connectivity, standards.'],
      ['Readiness', 'Average of the enabler indicators a value chain needs, scaled 0–1 across African countries.'],
      ['African median', 'The middle value of all African countries for an indicator: half are above, half below. Below it = a GAP flag.'],
      ['Sensitivity analysis', 'Changing the weights to see whether the top opportunities stay on top. Robust results survive reasonable weight changes.'],
    ]],
  ], [24, 330, 760, 120, 120]);
}

function buildDataSources_(ss) {
  writeDocPage_(ss, APP.sheets.sources, [
    ['title', 'Data sources'],
    ['sub', 'Where the numbers come from and how to load your own.'],
    ['gap'],
    ['h', 'Three ways to load data (menu step 2)'],
    ['table', ['Option', 'What it is', 'When to use it'], [
      ['2a SAMPLE', 'Synthetic numbers generated by the script with a realistic shape (oil exporters export oil, etc.). NOT real statistics.', 'To learn the tool and test it. Never quote these numbers.'],
      ['2b UN Comtrade', 'Official statistics from the United Nations Commodity Trade Statistics Database, downloaded through its API (Application Programming Interface): each country\'s trade with the world and with every African partner, HS 2-digit, analysis year and the year before.', 'For real analysis. Needs a free API key (see below).'],
      ['2c Own data', 'Anything you paste into Raw_Trade in the format below — e.g. exports from WITS, ITC Trade Map or CEPII BACI.', 'When you have better or more recent data.'],
    ]],
    ['h', 'Getting a free UN Comtrade API key'],
    ['p', '1. Go to comtradedeveloper.un.org and sign up.'],
    ['p', '2. Products → subscribe to "comtrade - v1" (free tier).'],
    ['p', '3. Profile → copy the Primary key → paste into Settings → "UN Comtrade API key".'],
    ['p', '4. Run menu 2b. It downloads one country at a time and continues automatically in the background until all 54 are done.'],
    ['gap'],
    ['h', 'Raw_Trade format (one row per flow)'],
    ['table', ['Year', 'Reporter ISO3', 'Partner ISO3', 'Flow', 'HS2', 'Value (USD)'], [
      [2023, 'NGA', 'WLD', 'X', 27, 45000000000],
      [2023, 'NGA', 'WLD', 'M', 10, 2100000000],
      [2023, 'NGA', 'GHA', 'X', 27, 900000000],
      [2022, 'NGA', 'WLD', 'M', 10, 1900000000],
    ]],
    ['p', '(Example rows only — illustrative values.) Needed: world rows (WLD) for both X (exports) and M (imports), for the analysis year AND the year before;'],
    ['p', 'plus bilateral rows between African countries for the analysis year. Values in US dollars (USD).'],
    ['p', 'Raw_HS4 uses the same six columns with 4-digit codes, world partner (WLD) only, for the analysis year — codes listed on the Value_Chains tab.'],
    ['p', 'UN Comtrade (2b) fills both Raw_Trade and Raw_HS4 automatically and then downloads the World Bank enablers.'],
    ['gap'],
    ['h', 'Other good sources'],
    ['table', ['Source', 'What it offers'], [
      ['WITS (World Integrated Trade Solution, World Bank)', 'wits.worldbank.org — Comtrade data with an easier download interface, plus tariff data.'],
      ['ITC (International Trade Centre) Trade Map', 'trademap.org — detailed trade flows, mirror data, and export-potential indicators.'],
      ['CEPII BACI', 'cepii.fr — BACI (Base pour l\'Analyse du Commerce International) from CEPII, a French research centre: Comtrade data reconciled between reporters and partners; good for countries that report poorly.'],
      ['World Bank WDI (World Development Indicators)', 'data.worldbank.org — source of the 7 enabler indicators (menu 2d, free, no key). The latest available year per country is used.'],
      ['AfCFTA Secretariat', 'au-afcfta.org — African Continental Free Trade Area membership, ratification status and tariff schedules.'],
      ['UNCTADstat', 'unctadstat.unctad.org — statistics of the United Nations Conference on Trade and Development, for checking totals.'],
    ]],
    ['h', 'Known data gaps'],
    ['p', '• Several African countries report late (2+ years) or not at all. After 2b, the data status lists countries with no data.'],
    ['p', '• When a country does not report, its trade with African partners can still appear through the partner\'s report (mirror data).'],
    ['p', '• Re-exports and informal trade are not captured.'],
  ], [24, 250, 420, 300, 120, 120, 150]);
}

function buildUpdates_(ss) {
  writeDocPage_(ss, APP.sheets.updates, [
    ['title', 'Refreshing the data & updating the code'],
    ['sub', 'How to keep the numbers current, and what happens when you paste a new version of the code.'],
    ['gap'],
    ['h', 'Refreshing the data'],
    ['table', ['I want to…', 'Do this', 'What happens'], [
      ['Get the latest official figures', 'Menu → Refresh data (same source) & recompute', 'If the source is UN Comtrade: re-downloads all 54 countries for the analysis year and the year before (about 5–15 minutes, in the background), then recomputes everything.'],
      ['Move to a newer year', 'Settings → Analysis year (e.g. 2024) → Refresh data', 'Downloads that year and the one before. Newer years fill up gradually as countries report — the data status lists countries that have not reported yet.'],
      ['Use updated figures of my own', 'Paste the new rows into Raw_Trade (or 2c to clear it first) → Refresh data', 'Recomputes from whatever is in Raw_Trade.'],
      ['Update the enabler indicators', 'Menu → 2d. Fetch World Bank enabler indicators', 'Downloads the latest World Bank values (free, no key) and recomputes. Also done automatically after a UN Comtrade download.'],
      ['Keep it current automatically', 'Menu → Monthly auto-refresh ON / OFF', 'On the 1st of every month (~3–4 am) the workbook refreshes itself. Settings → "Monthly auto-refresh" shows whether it is on. Run the same menu item to turn it off.'],
      ['Only changed weights', 'Nothing', 'Scores, rankings, Explain_Score and the live charts update instantly.'],
      ['Changed Countries, Products or other Settings', 'Menu → 3. Compute', 'Re-scores every opportunity with the new inputs.'],
    ]],
    ['p', 'A refresh keeps your weights, settings, API key and your Countries/Products edits. It replaces Raw_Trade, Scorecard, Dashboard and Charts.'],
    ['p', 'Settings → "Last computed" shows when the numbers were last recalculated; "Data status" shows where they came from.'],
    ['gap'],
    ['h', 'Updating the code (when you get a new version of Code.gs)'],
    ['table', ['Step', 'What to do'], [
      ['1. Back up (optional)', 'File → Make a copy. (File → Version history also lets you go back later.)'],
      ['2. Replace the code', 'Extensions → Apps Script → click in the code → select all (Ctrl/Cmd + A) → delete → paste the new code → Save.'],
      ['3. Reload', 'Reload the Google Sheet tab in your browser. A message may say "New code detected".'],
      ['4. Apply it', 'Menu Africa Trade → Update workbook after pasting new code (keeps your data).'],
    ]],
    ['h', 'What happens when you update the code'],
    ['p', '• The code and your data live in different places: the code is in Apps Script, the data is in the tabs.'],
    ['p', '• Pasting new code changes NOTHING in the tabs until you run a menu item. The old layout keeps working meanwhile.'],
    ['p', '• "Update workbook" rebuilds every tab\'s layout, explanations and charts with the new version, then puts back:'],
    ['p', '      Raw_Trade data · weights · all settings · API key · Countries and Products edits — and recomputes.'],
    ['p', '• "Reset workbook to defaults" is different: it deletes the data and resets everything (only the API key is kept). Do not use it for updates.'],
    ['p', '• Auto-refresh keeps working after an update: the scheduled job calls a function name that never changes.'],
    ['p', '• Anything you typed INSIDE result tabs (Dashboard, Top_Gaps, Scorecard…) is rebuilt — keep your own notes in a separate tab.'],
    ['p', '• The Guide shows which code version built the workbook.'],
    ['gap'],
    ['h', 'Sharing'],
    ['p', '• Share the Google Sheet as usual. Viewers see everything; editors can also use the menu (they authorise the script once).'],
    ['p', '• Your UN Comtrade API key is visible to editors on the Settings tab. Use your own key per copy if that matters.'],
  ], [24, 280, 470, 520, 120]);
}

function buildFaq_(ss) {
  writeDocPage_(ss, APP.sheets.faq, [
    ['title', 'FAQ (Frequently Asked Questions)'],
    ['gap'],
    ['table', ['Question', 'Answer'], [
      ['Is the data real?', 'Only if the Dashboard data line says UN Comtrade or Own data. SAMPLE DATA is synthetic and for testing only.'],
      ['How do I refresh the data?', 'Menu → Refresh data. It re-loads from the same source and recomputes. Or turn on Monthly auto-refresh. Details: Refresh_&_Updates tab.'],
      ['What happens when I paste new code?', 'Nothing changes until you run Update workbook. That rebuilds layouts and explanations and keeps your data and settings.'],
      ['I changed a weight — do I need to re-run anything?', 'No. The composite score is a live formula. Scorecard, Top_Gaps, Explain_Score and the live charts update instantly.'],
      ['When DO I need to re-run step 3?', 'After changing data, Countries, Products, the year, minimum gap, row limit, access scores or the landlocked multiplier.'],
      ['Why is a combination missing from the Scorecard?', 'One side does not trade the product, the gap is below the minimum, it did not fit under the row limit, or the product is unticked on Products.'],
      ['Why does a country show zero trade?', 'It has not reported data for that year. Try an earlier analysis year on Settings, or paste data from another source.'],
      ['What does a score of 70 mean?', 'It is a weighted average of 7 relative sub-scores. 70 is strong compared with the other opportunities in this workbook — not an absolute probability.'],
      ['Which weights should I use?', 'Start with the defaults. Then match your goal: more Proximity/Access for quick wins, more Gap/Demand for big prizes, more Growth for future markets.'],
      ['How do I check if a result is robust?', 'Change the weights a little (sensitivity analysis). Opportunities that stay near the top are robust.'],
      ['How do I hide the blue explanation box?', 'Click the − button at the top left of the tab (next to the row numbers). Click + to show it again.'],
      ['Can I add more countries or criteria?', 'Countries: add rows on the Countries tab (ISO3, M49, coordinates). New criteria need a code change.'],
      ['Can I use HS 4-digit products?', 'Yes with code changes: the Products list and the Comtrade query must be extended. Expect ~12× more data.'],
      ['The Comtrade fetch stopped — what now?', 'Check the data status on Settings for the error. Use "Stop a running Comtrade fetch" and start Refresh again if needed.'],
      ['How is "value lost" calculated?', 'Raw exports × (value multiplier − 1), plus half of that for semi-processed exports. The multipliers are assumptions on the Value_Chains tab — replace them with study values.'],
      ['Why does a country have no value-addition rows?', 'It exports little of the raw materials in the 25 chains, or its HS4 data is missing for that year.'],
      ['Can I add a value chain?', 'Yes: add a row on the Value_Chains tab (codes, multiplier, needs), download data again with Refresh, then run step 3.'],
      ['What does "GAP" mean on Country_Needs?', 'The country is below the African median on that enabler. It is a flag to investigate, not a verdict.'],
      ['How do I know the page changed after I picked a country?', 'Look at the green NOW SHOWING line under the yellow cell: it names what you picked and counts what was found. On Value_Lost_Charts the chart legends show the country name too.'],
      ['A country shows nothing — is it broken?', 'No: the green line says why — no data for that year, no raw exports in the 25 value chains, or the data is not loaded yet. Health_Check shows which.'],
      ['How do I check everything works?', 'Open Health_Check: every line should say OK. Run Africa Trade → Run full audit to scan every tab for errors.'],
      ['Can I undo a mistake?', 'File → Version history → See version history, then restore an earlier version.'],
      ['Can I share this workbook?', 'Yes — share the Google Sheet. Editors must authorise the script once to use the menu.'],
    ]],
  ], [24, 330, 800, 120, 120]);
}


// ------------------------------------------------------------------
// Data: sample
// ------------------------------------------------------------------

function loadSampleData_() {
  const year = Number(getParam_('P_YEAR'));
  const rows = generateSampleRows_(readCountries_(), year);
  writeRaw_(rows, true);
  setParam_('P_SOURCE', 'SAMPLE');
  setParam_('P_STATUS', 'SAMPLE DATA — synthetic numbers for testing, NOT real trade statistics');
  loadSampleValueAddition_();
}

/** Deterministic synthetic trade data with a realistic shape. */
function generateSampleRows_(countries, year) {
  const rng = mulberry32_(20260928);
  const hsList = HS2.map(h => h[0]);
  const X = {}, M = {};

  countries.forEach(c => {
    const size = SAMPLE_SIZE[c.iso] || 1;
    const spec = SAMPLE_SPEC[c.iso] || [];
    const xw = {}, mw = {};
    let xs = 0, ms = 0;
    hsList.forEach(hs => {
      let w = rng() < 0.35 ? 0 : Math.pow(rng(), 2);
      if (spec.indexOf(hs) >= 0) w = 20 + 20 * rng();
      const m = rng() < 0.08 ? 0 : (SAMPLE_IMPORT_WEIGHT[hs] || 0.4) * (0.5 + rng());
      xw[hs] = w; xs += w;
      mw[hs] = m; ms += m;
    });
    const expTot = size * 1e9;
    const impTot = size * 1e9 * (0.7 + 0.6 * rng());
    X[c.iso] = {}; M[c.iso] = {};
    hsList.forEach(hs => {
      X[c.iso][hs] = xs ? expTot * xw[hs] / xs : 0;
      M[c.iso][hs] = ms ? impTot * mw[hs] / ms : 0;
    });
  });

  const rows = [];
  countries.forEach(c => hsList.forEach(hs => {
    [['X', X[c.iso][hs]], ['M', M[c.iso][hs]]].forEach(([flow, v]) => {
      if (v < 1000) return;
      rows.push([year, c.iso, 'WLD', flow, hs, Math.round(v)]);
      const growth = -0.15 + 0.4 * rng();
      rows.push([year - 1, c.iso, 'WLD', flow, hs, Math.round(v / (1 + growth))]);
    });
  }));

  // Intra-African flows: each exporter sends a small share to a few partners.
  countries.forEach(a => hsList.forEach(hs => {
    const x = X[a.iso][hs];
    if (x < 1e6) return;
    const share = 0.03 + 0.2 * Math.pow(rng(), 2);
    const k = 1 + Math.floor(rng() * 4);
    const cands = countries
      .filter(b => b.iso !== a.iso && M[b.iso][hs] > 0)
      .map(b => ({ b, w: (SAMPLE_SIZE[b.iso] || 1) / (1 + distanceKm_(a, b) / 800) * rng() }))
      .sort((p, q) => q.w - p.w)
      .slice(0, k);
    const wsum = cands.reduce((s, p) => s + p.w, 0);
    if (!wsum) return;
    cands.forEach(p => {
      const v = Math.min(x * share * p.w / wsum, 0.6 * M[p.b.iso][hs]);
      if (v >= 5e4) rows.push([year, a.iso, p.b.iso, 'X', hs, Math.round(v)]);
    });
  }));
  return rows;
}

function mulberry32_(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}


// ------------------------------------------------------------------
// Data: UN Comtrade
// ------------------------------------------------------------------

function fetchComtradeData() {
  requireBuilt_();
  startComtradeFetch_(true);
}

/** Starts a full download. interactive = false when called from the monthly trigger. */
function startComtradeFetch_(interactive) {
  const key = String(getParam_('P_API_KEY') || '').trim();
  if (!key) {
    if (interactive) {
      alert_('Add your free UN Comtrade API key on the Settings tab first.\n\n' +
        '1. Sign up at comtradedeveloper.un.org\n2. Products → subscribe to "comtrade - v1" (free)\n' +
        '3. Profile → copy the primary key into Settings → "UN Comtrade API key".');
    } else {
      setParam_('P_STATUS', 'Auto-refresh skipped: no UN Comtrade API key on Settings');
    }
    return;
  }
  const year = Number(getParam_('P_YEAR'));
  if (interactive && !confirm_(`Download ${year - 1}–${year} trade data for all 54 African countries from UN Comtrade?\n\n` +
      'This replaces Raw_Trade. It runs in chunks in the background (about 5–15 minutes); ' +
      'the Dashboard and Charts update automatically when it finishes.')) return;

  deleteFetchTriggers_();
  const props = PropertiesService.getDocumentProperties();
  props.setProperty(APP.fetchProp, '0');
  props.setProperty(APP.missingProp, '');
  clearSheetBody_(sheet_(APP.sheets.raw), L.rawFirst);
  clearSheetBody_(sheet_(APP.sheets.rawHs4), L.hs4First);
  setParam_('P_SOURCE', 'COMTRADE');
  runComtradeFetch_();
}

/** Trigger handler — continues a fetch that ran out of time. */
function continueComtradeFetch() {
  deleteFetchTriggers_();
  runComtradeFetch_();
}

function stopComtradeFetch() {
  deleteFetchTriggers_();
  PropertiesService.getDocumentProperties().deleteProperty(APP.fetchProp);
  setParam_('P_STATUS', 'UN Comtrade fetch stopped by user (partial data)');
  notify_('Comtrade fetch stopped.');
}

function runComtradeFetch_() {
  const props = PropertiesService.getDocumentProperties();
  const cursorRaw = props.getProperty(APP.fetchProp);
  if (cursorRaw === null) return;
  let cursor = Number(cursorRaw);
  const countries = readCountries_();
  const chains = readChains_();
  const key = String(getParam_('P_API_KEY') || '').trim();
  const year = Number(getParam_('P_YEAR'));
  const started = Date.now();
  const missing = (props.getProperty(APP.missingProp) || '').split(',').filter(String);

  while (cursor < countries.length && Date.now() - started < 4.5 * 60 * 1000) {
    const c = countries[cursor];
    let rows, rows4;
    try {
      rows = fetchReporter_(c, countries, year, key);
      Utilities.sleep(1200); // stay under the API rate limit
      rows4 = fetchReporterHs4_(c, chains, year, key);
    } catch (e) {
      setParam_('P_STATUS', `UN Comtrade fetch failed at ${c.name}: ${e.message}`);
      props.deleteProperty(APP.fetchProp);
      notify_('Comtrade fetch failed: ' + e.message);
      return;
    }
    if (rows.length) writeRaw_(rows, false);
    else missing.push(c.iso);
    if (rows4.length) writeHs4_(rows4, false);
    cursor++;
    props.setProperty(APP.fetchProp, String(cursor));
    props.setProperty(APP.missingProp, missing.join(','));
    setParam_('P_STATUS', `Fetching from UN Comtrade… ${cursor}/${countries.length} countries`);
    Utilities.sleep(1200); // stay under the API rate limit
  }

  if (cursor < countries.length) {
    ScriptApp.newTrigger(APP.fetchHandler).timeBased().after(60 * 1000).create();
    notify_(`Fetched ${cursor}/${countries.length} countries. Continuing automatically in about a minute…`);
    return;
  }

  props.deleteProperty(APP.fetchProp);
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  setParam_('P_STATUS', `UN Comtrade (fetched ${stamp}). ` +
    (missing.length ? `No ${year - 1}–${year} data reported by: ${missing.join(', ')}` : 'All countries reported.'));
  try {
    fetchWorldBank_();
  } catch (e) {
    setParam_('P_WB_STATUS', 'World Bank download failed: ' + e.message);
  }
  computeScorecard();
}

/** One reporter, both years, both flows, partners = world + all African countries, HS 2-digit. */
function fetchReporter_(reporter, countries, year, key) {
  const byM49 = {};
  countries.forEach(c => { byM49[c.m49] = c.iso; });
  const partners = ['0'].concat(countries.filter(c => c.iso !== reporter.iso).map(c => c.m49)).join(',');
  const query = {
    reporterCode: reporter.m49,
    period: `${year},${year - 1}`,
    partnerCode: partners,
    partner2Code: 0,
    flowCode: 'M,X',
    cmdCode: 'AG2',
    customsCode: 'C00',
    motCode: 0,
    maxRecords: 250000,
    includeDesc: 'false',
  };
  const data = comtradeGet_(query, key);
  const seen = {};
  data.forEach(d => {
    const flow = d.flowCode;
    const hs = Number(d.cmdCode);
    const value = Number(d.primaryValue);
    if ((flow !== 'X' && flow !== 'M') || !(hs >= 1 && hs <= 97) || !(value > 0)) return;
    if (d.motCode !== undefined && Number(d.motCode) !== 0) return;
    if (d.partner2Code !== undefined && Number(d.partner2Code) !== 0) return;
    if (d.customsCode !== undefined && d.customsCode !== 'C00') return;
    const partner = Number(d.partnerCode) === 0 ? 'WLD' : byM49[Number(d.partnerCode)];
    if (!partner) return;
    const yr = Number(d.period);
    seen[[yr, partner, flow, hs].join('|')] = [yr, reporter.iso, partner, flow, hs, Math.round(value)];
  });
  return Object.keys(seen).map(k => seen[k]);
}

function deleteFetchTriggers_() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === APP.fetchHandler)
    .forEach(t => ScriptApp.deleteTrigger(t));
}


// ------------------------------------------------------------------
// Compute
// ------------------------------------------------------------------

function computeScorecard() {
  requireBuilt_();
  const raw = sheet_(APP.sheets.raw);
  if (rawCount_() === 0) {
    notify_('Raw_Trade is empty — load data first (menu 2a, 2b or 2c).', true);
    return;
  }
  const rawRows = raw.getRange(L.rawFirst, 1, raw.getLastRow() - L.rawFirst + 1, 6).getValues();
  const countries = readCountries_();
  const products = readProducts_();
  const params = {
    year: Number(getParam_('P_YEAR')),
    minGap: Number(getParam_('P_MIN_GAP')) || 0,
    maxRows: Number(getParam_('P_MAX_ROWS')) || 20000,
    acc: {
      cu: Number(getParam_('P_ACC_CU')),
      rec: Number(getParam_('P_ACC_REC')),
      afcfta: Number(getParam_('P_ACC_AFCFTA')),
      other: Number(getParam_('P_ACC_OTHER')),
    },
    landlock: Number(getParam_('P_LANDLOCK')),
  };

  const result = scoreOpportunities_(countries, products, rawRows, params);
  writeScorecard_(result.rows);
  writeDashboard_(result.summary);
  writeCharts_(result.summary);
  selectTopForExplain_(result.rows);
  computeValueAddition_();
  setParam_('P_LAST_REFRESH', Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm'));
  notify_(`Scorecard ready: ${result.rows.length.toLocaleString()} opportunities scored.`);
}

/**
 * Pure computation (no Sheets calls) — builds the composite index.
 * rawRows: [year, reporter, partner, flow, hs, value]
 * Returns { rows: Scorecard rows A..T, summary: dashboard data }.
 */
function scoreOpportunities_(countries, products, rawRows, p) {
  const year = p.year;
  const world = {};   // `${year}|${flow}|${iso}|${hs}` → value
  const biX = {};     // `${exporter}|${importer}|${hs}` → exporter-reported exports
  const biM = {};     // `${exporter}|${importer}|${hs}` → importer-reported imports
  const add = (obj, k, v) => { obj[k] = (obj[k] || 0) + v; };

  rawRows.forEach(r => {
    const yr = Number(r[0]), rep = String(r[1]).trim(), par = String(r[2]).trim();
    const flow = String(r[3]).trim().toUpperCase(), hs = Number(r[4]), v = Number(r[5]);
    if (!rep || !(v > 0) || !hs) return;
    if (par === 'WLD') add(world, `${yr}|${flow}|${rep}|${hs}`, v);
    else if (yr === year && flow === 'X') add(biX, `${rep}|${par}|${hs}`, v);
    else if (yr === year && flow === 'M') add(biM, `${par}|${rep}|${hs}`, v);
  });
  const W = (yr, flow, iso, hs) => world[`${yr}|${flow}|${iso}|${hs}`] || 0;
  const bilateral = (a, b, hs) => Math.max(biX[`${a}|${b}|${hs}`] || 0, biM[`${a}|${b}|${hs}`] || 0);

  // Totals for RCA (Africa as the reference economy).
  const expTot = {}, afX = {};
  let afTot = 0;
  countries.forEach(c => {
    expTot[c.iso] = 0;
    products.forEach(pr => {
      const v = W(year, 'X', c.iso, pr.hs);
      expTot[c.iso] += v;
      afX[pr.hs] = (afX[pr.hs] || 0) + v;
      afTot += v;
    });
  });

  // 1. Candidate opportunities.
  const included = products.filter(pr => pr.include);
  let cands = [];
  countries.forEach(a => included.forEach(pr => {
    const supply = W(year, 'X', a.iso, pr.hs);
    if (supply <= 0) return;
    countries.forEach(b => {
      if (b.iso === a.iso) return;
      const demand = W(year, 'M', b.iso, pr.hs);
      if (demand <= 0) return;
      const current = bilateral(a.iso, b.iso, pr.hs);
      const gap = Math.min(demand, supply) - current;
      if (gap > 0 && gap >= p.minGap) cands.push({ a, b, pr, demand, supply, current, gap });
    });
  }));
  cands.sort((x, y) => y.gap - x.gap);
  if (cands.length > p.maxRows) cands = cands.slice(0, p.maxRows);

  // 2. Raw criterion values.
  cands.forEach(c => {
    c.dist = distanceKm_(c.a, c.b);
    const acc = accessTier_(c.a, c.b, p.acc);
    c.accLabel = acc.label; c.accScore = acc.score;
    const prev = W(year - 1, 'M', c.b.iso, c.pr.hs);
    c.growth = prev > 0 ? clamp_((c.demand - prev) / prev, -0.5, 1) : null;
    const share = expTot[c.a.iso] ? c.supply / expTot[c.a.iso] : 0;
    const afShare = afTot ? (afX[c.pr.hs] || 0) / afTot : 0;
    c.rca = afShare ? share / afShare : 0;
  });

  // 3. Normalise to 0–1.
  const logScale = key => scaler_(cands.map(c => Math.log10(1 + c[key])));
  const nDemand = logScale('demand'), nSupply = logScale('supply'), nGap = logScale('gap');
  const distMin = Math.min.apply(null, cands.map(c => c.dist).concat([Infinity]));
  const distMax = Math.max.apply(null, cands.map(c => c.dist).concat([-Infinity]));

  const r3 = v => Math.round(v * 1000) / 1000;
  const rows = cands.map(c => {
    let prox = distMax > distMin ? 1 - (c.dist - distMin) / (distMax - distMin) : 1;
    if (c.a.landlocked || c.b.landlocked) prox *= p.landlock;
    return [
      c.a.iso, c.a.name, c.b.iso, c.b.name, c.pr.hs, c.pr.name, c.pr.sector,
      Math.round(c.demand), Math.round(c.supply), Math.round(c.current), Math.round(c.gap),
      Math.round(c.dist), c.accLabel,
      r3(nDemand(Math.log10(1 + c.demand))),
      r3(nSupply(Math.log10(1 + c.supply))),
      r3(nGap(Math.log10(1 + c.gap))),
      r3(c.accScore),
      r3(prox),
      r3(c.growth === null ? 0.5 : (c.growth + 0.5) / 1.5),
      r3(c.rca / (1 + c.rca)),
      c.growth === null ? '' : r3(c.growth),
      Math.round(c.rca * 100) / 100,
    ];
  });

  return { rows, summary: summarise_(countries, products, W, biX, biM, cands, year) };
}

function summarise_(countries, products, W, biX, biM, cands, year) {
  const productName = {};
  products.forEach(pr => { productName[pr.hs] = pr.name; });

  // Intra-African exports: exporter-reported, else importer-reported mirror.
  const intraExp = {}, intraImp = {};
  const pairs = {};
  Object.keys(biX).forEach(k => { pairs[k] = Math.max(pairs[k] || 0, biX[k]); });
  Object.keys(biM).forEach(k => { pairs[k] = Math.max(pairs[k] || 0, biM[k]); });
  Object.keys(pairs).forEach(k => {
    const [a, b] = k.split('|');
    intraExp[a] = (intraExp[a] || 0) + pairs[k];
    intraImp[b] = (intraImp[b] || 0) + pairs[k];
  });

  const oppCount = {};
  const sectorGap = {};
  cands.forEach(c => {
    oppCount[c.a.iso] = (oppCount[c.a.iso] || 0) + 1;
    const s = sectorGap[c.pr.sector] || (sectorGap[c.pr.sector] = { gap: 0, n: 0 });
    s.gap += c.gap; s.n++;
  });

  const table = countries.map(c => {
    let exp = 0, imp = 0, topX = null, topM = null, topXv = 0, topMv = 0;
    products.forEach(pr => {
      const x = W(year, 'X', c.iso, pr.hs), m = W(year, 'M', c.iso, pr.hs);
      exp += x; imp += m;
      if (x > topXv) { topXv = x; topX = pr.hs; }
      if (m > topMv) { topMv = m; topM = pr.hs; }
    });
    const ie = intraExp[c.iso] || 0;
    return {
      iso: c.iso, name: c.name, region: c.region, exp, imp, bal: exp - imp,
      intraExp: ie, intraShare: exp ? ie / exp : 0, intraImp: intraImp[c.iso] || 0,
      topX: topX ? productName[topX] : '—', topM: topM ? productName[topM] : '—',
      opps: oppCount[c.iso] || 0,
    };
  }).sort((x, y) => y.exp - x.exp);

  const totExp = table.reduce((s, r) => s + r.exp, 0);
  const totImp = table.reduce((s, r) => s + r.imp, 0);
  const totIntra = table.reduce((s, r) => s + r.intraExp, 0);
  const sectors = Object.keys(sectorGap).map(k => [k, sectorGap[k].gap, sectorGap[k].n])
    .sort((x, y) => y[1] - x[1]);

  const sectorExp = {};
  countries.forEach(c => products.forEach(pr => {
    const v = W(year, 'X', c.iso, pr.hs);
    if (v) sectorExp[pr.sector] = (sectorExp[pr.sector] || 0) + v;
  }));
  const reg = {};
  table.forEach(r => {
    const g = reg[r.region] || (reg[r.region] = { exp: 0, intra: 0 });
    g.exp += r.exp; g.intra += r.intraExp;
  });
  const acc = {};
  cands.forEach(c => { const t = c.accLabel.split(':')[0]; acc[t] = (acc[t] || 0) + 1; });

  return {
    sectorExports: Object.keys(sectorExp).map(k => [k, sectorExp[k]]).sort((x, y) => y[1] - x[1]),
    regions: Object.keys(reg).map(k => [k, reg[k].exp ? reg[k].intra / reg[k].exp : 0]).sort((x, y) => y[1] - x[1]),
    access: ['Customs union', 'REC', 'AfCFTA', 'Other'].map(t => [t, acc[t] || 0]),
    kpis: {
      totExp, totImp, totIntra, intraShare: totExp ? totIntra / totExp : 0,
      opps: cands.length, totGap: cands.reduce((s, c) => s + c.gap, 0),
    },
    table, sectors,
  };
}

function accessTier_(a, b, acc) {
  const shared = (x, y) => x.filter(v => y.indexOf(v) >= 0);
  const cu = shared(a.cus, b.cus);
  if (cu.length) return { label: 'Customs union: ' + cu.join('/'), score: acc.cu };
  const rec = shared(a.recs, b.recs);
  if (rec.length) return { label: 'REC: ' + rec.join('/'), score: acc.rec };
  if (a.afcfta && b.afcfta) return { label: 'AfCFTA', score: acc.afcfta };
  return { label: 'Other', score: acc.other };
}

function distanceKm_(a, b) {
  const rad = d => d * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

function scaler_(values) {
  let lo = Infinity, hi = -Infinity;
  values.forEach(v => { if (v < lo) lo = v; if (v > hi) hi = v; });
  return v => (hi > lo ? (v - lo) / (hi - lo) : 1);
}

function clamp_(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function sectorOf_(hs) {
  const s = SECTORS.find(r => hs >= r[0] && hs <= r[1]);
  return s ? s[2] : 'Other';
}


// ------------------------------------------------------------------
// Write results
// ------------------------------------------------------------------

function writeScorecard_(rows) {
  const sh = sheet_(APP.sheets.score);
  clearSheetBody_(sh, L.scoreFirst);
  if (!rows.length) return;
  const F = L.scoreFirst;
  ensureRows_(sh, F + rows.length);
  sh.getRange(F, 1, rows.length, 20).setValues(rows.map(r => r.slice(0, 20)));
  sh.getRange(F, 22, rows.length, 2).setValues(rows.map(r => r.slice(20, 22)));
  const weighted = ['N', 'O', 'P', 'Q', 'R', 'S', 'T'].map((col, i) => `${col}${F}:${col}*${weightCell_(i)}`).join('+');
  sh.getRange(F, 21).setFormula(
    `=ARRAYFORMULA(IF(A${F}:A="",,ROUND((${weighted})/MAX(SUM(${weightRange_()}),0.0001)*100,1)))`);
}

function writeDashboard_(s) {
  const sh = sheet_(APP.sheets.dashboard);
  const T = top_('dashboard');
  sh.getCharts().forEach(c => sh.removeChart(c));
  const body = sh.getRange(T + 2, 1, Math.max(sh.getMaxRows() - T - 1, 1), sh.getMaxColumns());
  body.breakApart();
  body.clear();

  // KPI (Key Performance Indicator) tiles.
  const kpiLabels = ['African exports to the world', 'African imports from the world',
    'Intra-African exports', 'Intra-African share of exports', 'Opportunities in Scorecard',
    'Sum of pair gaps (overlapping)'];
  const k = s.kpis;
  const kpiValues = [k.totExp, k.totImp, k.totIntra, k.intraShare, k.opps, k.totGap];
  const money = '[>=1000000000]$#,##0.0,,,"B";[>=1000000]$#,##0.0,,"M";$#,##0';
  [1, 3, 5, 7, 9, 11].forEach((col, i) => {
    sh.getRange(T + 2, col, 1, 2).merge().setValue(kpiLabels[i]).setFontSize(9)
      .setFontColor('#555555').setHorizontalAlignment('center');
    sh.getRange(T + 3, col, 1, 2).merge().setValue(kpiValues[i]).setFontSize(16)
      .setFontWeight('bold').setHorizontalAlignment('center').setBackground(APP.color.band)
      .setNumberFormat(i === 3 ? '0.0%' : i === 4 ? '#,##0' : money);
  });

  // Country table.
  const head = ['ISO3', 'Country', 'Region', 'Exports to world', 'Imports from world', 'Balance',
    'Exports to Africa', 'Africa share of exports', 'Imports from Africa (partner-reported)',
    'Top export', 'Top import', 'Opportunities as supplier', 'Best score'];
  const H = T + 6, B = T + 7;
  sh.getRange(T + 5, 1).setValue('Country overview (sorted by exports, values in USD)').setFontWeight('bold')
    .setFontColor(APP.color.title);
  header_(sh.getRange(H, 1, 1, head.length), head);
  sh.getRange(H, 1, 1, head.length).setWrap(true);
  sh.setRowHeight(H, 48);
  const rows = s.table.map((r, i) => [r.iso, r.name, r.region, r.exp, r.imp, r.bal, r.intraExp,
    r.intraShare, r.intraImp, r.topX, r.topM, r.opps,
    `=IFERROR(MAXIFS(${sc_('U')},${sc_('A')},A${B + i}),"")`]);
  ensureRows_(sh, B + rows.length + 5);
  sh.getRange(B, 1, rows.length, head.length).setValues(rows);
  sh.getRange(B, 4, rows.length, 4).setNumberFormat('#,##0');
  sh.getRange(B, 8, rows.length, 1).setNumberFormat('0.0%');
  sh.getRange(B, 9, rows.length, 1).setNumberFormat('#,##0');
  sh.getRange(B, 13, rows.length, 1).setNumberFormat('0.0');
  for (let i = 0; i < rows.length; i += 2) sh.getRange(B + i, 1, 1, head.length).setBackground(APP.color.band);

  // Sector table.
  const sc = 15; // column O
  sh.getRange(T + 5, sc).setValue('Untapped gap by sector').setFontWeight('bold').setFontColor(APP.color.title);
  header_(sh.getRange(H, sc, 1, 3), ['Sector', 'Untapped gap (USD)', 'Opportunities']);
  if (s.sectors.length) {
    sh.getRange(B, sc, s.sectors.length, 3).setValues(s.sectors);
    sh.getRange(B, sc + 1, s.sectors.length, 2).setNumberFormat('#,##0');
    sh.insertChart(sh.newChart().setChartType(Charts.ChartType.BAR)
      .addRange(sh.getRange(H, sc, s.sectors.length + 1, 2))
      .setNumHeaders(1)
      .setOption('title', 'Untapped intra-African trade gap by sector (USD)')
      .setOption('legend', { position: 'none' })
      .setOption('colors', ['#1f4e3d'])
      .setOption('width', 620).setOption('height', 380)
      .setPosition(H, sc + 4, 0, 0)
      .build());
  }
  if (s.table.some(r => r.exp > 0)) {
    sh.insertChart(sh.newChart().setChartType(Charts.ChartType.COLUMN)
      .addRange(sh.getRange(H, 2, s.table.length + 1, 1))
      .addRange(sh.getRange(H, 8, s.table.length + 1, 1))
      .setNumHeaders(1)
      .setOption('title', 'Share of each country\'s exports that go to other African countries')
      .setOption('legend', { position: 'none' })
      .setOption('colors', ['#e8a33d'])
      .setOption('vAxis', { format: 'percent' })
      .setOption('hAxis', { slantedText: true, slantedTextAngle: 60, textStyle: { fontSize: 9 } })
      .setOption('width', 900).setOption('height', 420)
      .setPosition(H + 21, sc + 4, 0, 0)
      .build());
  }
  sh.setColumnWidth(2, 170); sh.setColumnWidth(10, 170); sh.setColumnWidth(11, 170);
  sh.setColumnWidth(sc, 190); sh.setColumnWidth(sc + 1, 150);
}

function writeCharts_(s) {
  const sh = sheet_(APP.sheets.charts);
  sh.getCharts().forEach(c => sh.removeChart(c));
  const G0 = chartsGridTop_();
  const area = sh.getRange(G0 - 1, 1, Math.max(sh.getMaxRows() - G0 + 2, 1), sh.getMaxColumns());
  area.breakApart();
  area.clear();
  ensureRows_(sh, G0 + 80);
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
  sh.getRange(G0 - 1, 2).setValue(`Drawn by step 3 on ${stamp}. The tables from column N onwards are the data behind each chart.`)
    .setFontStyle('italic').setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);

  // Data tables (column N onwards).
  const DC = 14;
  let r = G0;
  const table = (title, head, rows, formats) => {
    sh.getRange(r, DC).setValue(title).setFontWeight('bold').setFontColor(APP.color.title);
    header_(sh.getRange(r + 1, DC, 1, head.length), head);
    if (rows.length) sh.getRange(r + 2, DC, rows.length, head.length).setValues(rows);
    (formats || []).forEach((f, i) => { if (f) sh.getRange(r + 2, DC + i, Math.max(rows.length, 1), 1).setNumberFormat(f); });
    const range = sh.getRange(r + 1, DC, rows.length + 1, head.length);
    r += rows.length + 4;
    return range;
  };
  const t1 = table('Chart 1 data: exports by sector', ['Sector', 'Exports to world (USD)'], s.sectorExports, [null, '#,##0']);
  const top15 = s.table.slice(0, 15).map(x => [x.name, x.intraExp, Math.max(x.exp - x.intraExp, 0)]);
  const t2 = table('Chart 2 data: top 15 exporters', ['Country', 'To Africa', 'To rest of world'], top15, [null, '#,##0', '#,##0']);
  const t3 = table('Chart 3 data: share staying in Africa', ['Region', 'Share of exports to Africa'], s.regions, [null, '0.0%']);

  const liveTop = [['', '']];
  for (let i = 1; i < 15; i++) liveTop.push(['', '']);
  liveTop[0][0] = `=ARRAYFORMULA(IFERROR(ARRAY_CONSTRAIN(SORT(FILTER({${sc_('B')}&" → "&${sc_('D')}&": "&${sc_('F')},${sc_('U')}},` +
    `${sc_('A')}<>""),2,FALSE),15,2),""))`;
  const t4 = table('Chart 4 data (live): top 15 opportunities', ['Opportunity', 'Score'], liveTop, [null, '0.0']);
  const t5 = table('Chart 5 data: opportunities by market access', ['Market access', 'Opportunities'], s.access, [null, '#,##0']);
  const bands = [];
  for (let i = 0; i < 10; i++) {
    const lo = i * 10, hi = lo + 10;
    bands.push([`${lo}–${hi}`, `=COUNTIFS(${sc_('U')},">=${lo}",${sc_('U')},"${i === 9 ? '<=' : '<'}${hi}")`]);
  }
  const t6 = table('Chart 6 data (live): score bands', ['Score band', 'Opportunities'], bands, [null, '#,##0']);

  // Chart grid: two per row, title + caption above each chart.
  const specs = [
    [t1, Charts.ChartType.PIE, 'Chart 1 — What Africa sells to the world, by sector',
      'Each slice = a sector\'s share of all African exports. Big slices = what the continent mainly sells.', { pieHole: 0.4 }],
    [t2, Charts.ChartType.COLUMN, 'Chart 2 — Top 15 exporters: to Africa vs. rest of world',
      'Green = sold to other African countries, orange = sold outside Africa. Short green = little intra-African trade.',
      { isStacked: true, colors: ['#1f4e3d', '#e8a33d'], hAxis: { slantedText: true, slantedTextAngle: 45 } }],
    [t3, Charts.ChartType.COLUMN, 'Chart 3 — Share of exports that stay in Africa, by region',
      'Higher bar = that region\'s exports go more to other African countries.',
      { legend: { position: 'none' }, colors: ['#4a86e8'], vAxis: { format: 'percent' } }],
    [t4, Charts.ChartType.BAR, 'Chart 4 — Top 15 opportunities by score (live)',
      'Longest bar = best-rated opportunity with the current weights. Changes when you change weights.',
      { legend: { position: 'none' }, colors: ['#1f4e3d'], hAxis: { minValue: 0, maxValue: 100 } }],
    [t5, Charts.ChartType.PIE, 'Chart 5 — Opportunities by market access',
      'How many opportunities are inside a customs union, a REC (Regional Economic Community), AfCFTA only, or other.', { pieHole: 0.4 }],
    [t6, Charts.ChartType.COLUMN, 'Chart 6 — How the scores are spread (live)',
      'Number of opportunities per score band. Few reach the top bands — those are the ones to look at first.',
      { legend: { position: 'none' }, colors: ['#e8a33d'] }],
  ];
  specs.forEach(([range, type, title, caption, options], i) => {
    const row = G0 + Math.floor(i / 2) * 22;
    const col = i % 2 === 0 ? 2 : 8;
    sh.getRange(row, col).setValue(title).setFontWeight('bold').setFontSize(11).setFontColor(APP.color.title)
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);
    sh.getRange(row + 1, col).setValue(caption).setFontStyle('italic').setFontColor('#555555').setFontSize(9)
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);
    let b = sh.newChart().setChartType(type).addRange(range).setNumHeaders(1)
      .setOption('width', 620).setOption('height', 380)
      .setPosition(row + 2, col, 0, 0);
    Object.keys(options).forEach(k => { b = b.setOption(k, options[k]); });
    sh.insertChart(b.build());
  });
}

// ------------------------------------------------------------------
// Readers & helpers
// ------------------------------------------------------------------

function readCountries_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(APP.sheets.countries);
  const values = sh && sh.getLastRow() >= L.ctryFirst
    ? sh.getRange(L.ctryFirst, 1, sh.getLastRow() - L.ctryFirst + 1, 10).getValues()
    : COUNTRIES;
  return values.filter(r => String(r[0]).trim().length === 3).map(countryFromRow_);
}

function countryFromRow_(r) {
  const list = v => String(v || '').split(/[;,]/).map(s => s.trim()).filter(String);
  return {
    iso: String(r[0]).trim(), m49: Number(r[1]), name: String(r[2]), region: String(r[3]),
    lat: Number(r[4]), lon: Number(r[5]), landlocked: r[6] === true,
    cus: list(r[7]), recs: list(r[8]), afcfta: r[9] === true,
  };
}

function readProducts_() {
  const sh = sheet_(APP.sheets.products);
  return sh.getRange(L.prodFirst, 1, Math.max(sh.getLastRow() - L.prodFirst + 1, 1), 4).getValues()
    .filter(r => Number(r[0]) > 0)
    .map(r => ({ hs: Number(r[0]), name: String(r[1]), sector: String(r[2]), include: r[3] === true }));
}

function rawCount_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(APP.sheets.raw);
  return sh ? Math.max(sh.getLastRow() - L.rawFirst + 1, 0) : 0;
}

function writeRaw_(rows, replace) {
  const sh = sheet_(APP.sheets.raw);
  if (replace) clearSheetBody_(sh, L.rawFirst);
  if (!rows.length) return;
  const start = Math.max(sh.getLastRow() + 1, L.rawFirst);
  ensureRows_(sh, start + rows.length - 1);
  sh.getRange(start, 1, rows.length, 6).setValues(rows);
}

function getParam_(name) {
  const r = SpreadsheetApp.getActive().getRangeByName(name);
  const def = PARAMS.find(p => p[0] === name);
  if (!r) return def ? def[2] : '';
  const v = r.getValue();
  return v === '' && def && name !== 'P_API_KEY' ? def[2] : v;
}

function setParam_(name, value) {
  const r = SpreadsheetApp.getActive().getRangeByName(name);
  if (r) r.setValue(value);
}

function sheet_(name) {
  const sh = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sh) throw new Error(`Tab "${name}" is missing — run "Update workbook" or "Quick start".`);
  return sh;
}

function requireBuilt_() {
  if (!SpreadsheetApp.getActive().getSheetByName(APP.sheets.settings)) buildWorkbook_();
}

function resetSheet_(ss, name) {
  const sh = ss.getSheetByName(name) || ss.insertSheet(name);
  for (let i = 0; i < 5; i++) {
    try {
      const g = sh.getRowGroup(2, 1);
      if (!g) break;
      g.remove();
    } catch (e) {
      break;
    }
  }
  sh.getCharts().forEach(c => sh.removeChart(c));
  const all = sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns());
  all.breakApart();
  sh.clear();
  all.clearDataValidations();
  all.clearNote();
  sh.clearConditionalFormatRules();
  sh.setFrozenRows(0);
  sh.setFrozenColumns(0);
  sh.setHiddenGridlines(false);
  sh.setRowHeights(1, Math.min(sh.getMaxRows(), 300), 21);
  return sh;
}

function clearSheetBody_(sh, firstRow) {
  if (sh.getMaxRows() >= firstRow) {
    sh.getRange(firstRow, 1, sh.getMaxRows() - firstRow + 1, sh.getMaxColumns()).clearContent();
  }
}

function ensureRows_(sh, n) {
  const max = sh.getMaxRows();
  if (n > max) sh.insertRowsAfter(max, n - max);
}

function header_(range, values) {
  range.setValues([values]).setFontWeight('bold')
    .setBackground(APP.color.header).setFontColor(APP.color.headerText).setVerticalAlignment('middle');
}

function dropdown_(range, values) {
  range.setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(values.map(String), true).setAllowInvalid(false).build());
}

function notify_(msg, asAlert) {
  try {
    if (asAlert) SpreadsheetApp.getUi().alert(msg);
    else SpreadsheetApp.getActive().toast(msg, 'Africa Trade', 8);
  } catch (e) {
    console.log(msg); // running from a trigger: no UI available
  }
}

function alert_(msg) { notify_(msg, true); }

function confirm_(msg) {
  const ui = SpreadsheetApp.getUi();
  return ui.alert('Africa Trade', msg, ui.ButtonSet.YES_NO) === ui.Button.YES;
}

// ------------------------------------------------------------------
// Value addition — tabs
// ------------------------------------------------------------------

/** Open-ended VA_Scorecard column reference, e.g. va_('A') → VA_Scorecard!$A$8:$A */
function va_(col) { return `VA_Scorecard!$${col}$${L.vaFirst}:$${col}`; }
function en_(col) { return `Enablers!$${col}$${L.enFirst}:$${col}`; }
function vaWeightCell_(i) { return `Settings!$B$${L.settingsVa + i}`; }
function vaWeightRange_() { return `Settings!$B$${L.settingsVa}:$B$${L.settingsVa + VA_CRITERIA.length - 1}`; }

function colLetter_(n) {
  let s = '';
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

function buildValueChains_(ss) {
  const sh = resetSheet_(ss, APP.sheets.chains);
  writeBanner_(sh, 'chains');
  const head = ['Chain', 'Sector', 'Raw HS4 codes', 'Semi-processed HS4 codes', 'Processed HS4 codes',
    'Value multiplier (assumption)', 'Needs', 'What processing requires'];
  header_(sh.getRange(L.chainsHead, 1, 1, head.length), head);
  sh.getRange(L.chainsHead, 1, 1, head.length).setNotes([[
    'Raw material → processed product', 'Sector used in charts',
    'HS4 = 4-digit Harmonized System codes of the raw material, comma-separated',
    'Partly processed stage (e.g. cocoa butter, copper cathodes)', 'Final processed products (e.g. chocolate, copper wire)',
    'How many times more the processed product is worth than the raw material. ASSUMPTION — replace with study values.',
    'Keywords: energy, industry, logistics, skills, finance, digital, standards', '']]);
  sh.getRange(L.chainsFirst, 3, VALUE_CHAINS.length, 3).setNumberFormat('@');
  sh.getRange(L.chainsFirst, 1, VALUE_CHAINS.length, head.length).setValues(VALUE_CHAINS);
  sh.getRange(L.chainsFirst, 6, VALUE_CHAINS.length, 1).setBackground(APP.color.input).setNumberFormat('0.0');
  sh.setFrozenRows(L.chainsHead);
  [260, 150, 140, 200, 260, 120, 230, 700].forEach((w, i) => sh.setColumnWidth(i + 1, w));
}

function buildEnablers_(ss) {
  const sh = resetSheet_(ss, APP.sheets.enablers);
  writeBanner_(sh, 'enablers');
  const head = ['ISO3', 'Country'].concat(INDICATORS.map(i => i[1])).concat(['Data years']);
  header_(sh.getRange(L.enHead, 1, 1, head.length), head);
  sh.getRange(L.enHead, 1, 1, head.length).setWrap(true);
  sh.setRowHeight(L.enHead, 48);
  sh.getRange(L.enHead, 1, 1, head.length).setNotes([['ISO3 country code', '']
    .concat(INDICATORS.map(i => `${i[2]}. World Bank code ${i[0]}. ${i[4]}`))
    .concat(['Years of the latest available values'])]);
  sh.getRange(L.enFirst, 3, sh.getMaxRows() - L.enFirst + 1, INDICATORS.length).setNumberFormat('0.0');
  sh.setFrozenRows(L.enHead);
  sh.setColumnWidth(2, 190);
}

function buildRawHs4_(ss) {
  const sh = resetSheet_(ss, APP.sheets.rawHs4);
  writeBanner_(sh, 'rawHs4');
  header_(sh.getRange(L.hs4Head, 1, 1, 6), ['Year', 'Reporter ISO3', 'Partner ISO3 (WLD = world)',
    'Flow (X/M)', 'HS4', 'Value (USD)']);
  sh.getRange(L.hs4First, 5, sh.getMaxRows() - L.hs4First + 1, 1).setNumberFormat('0000');
  sh.getRange(L.hs4First, 6, sh.getMaxRows() - L.hs4First + 1, 1).setNumberFormat('#,##0');
  sh.setFrozenRows(L.hs4Head);
  sh.setColumnWidth(3, 190);
}

function buildVaScorecard_(ss) {
  const sh = resetSheet_(ss, APP.sheets.vaScore);
  writeBanner_(sh, 'vaScore');
  const head = ['ISO3', 'Country', 'Value chain', 'Sector', 'Raw exports (USD)', 'Semi-processed exports (USD)',
    'Processed exports (USD)', 'Processed imports (USD)', 'Processing share', 'Value multiplier (assumption)',
    'Value lost (estimate, USD)', 'Round-trip imports (USD)']
    .concat(VA_CRITERIA.map(c => c[0] + ' (0–1)'))
    .concat(['Value-addition score (0–100)', 'Needs flagged for this chain', 'What processing requires']);
  header_(sh.getRange(L.vaHead, 1, 1, head.length), head);
  sh.getRange(L.vaHead, 1, 1, head.length).setWrap(true);
  sh.setRowHeight(L.vaHead, 60);
  const notes = ['', '', 'Raw material → processed product (Value_Chains tab)', '',
    "Country's exports of the raw material to the world", 'Exports of partly processed products',
    'Exports of final processed products', 'Imports of the final processed products',
    '(semi-processed + processed exports) ÷ all exports in this chain. Higher = more value added at home.',
    'Assumption from the Value_Chains tab', 'raw exports × (multiplier − 1) + semi-processed exports × (multiplier − 1) ÷ 2',
    'Processed imports bought while exporting the raw material: min(raw exports, processed imports)']
    .concat(VA_CRITERIA.map(c => c[2] + ' Scaled 0–1.'))
    .concat(['Weighted average of the 5 sub-scores × 100. Live formula: follows the value-addition weights on Settings.',
      'Enablers this chain needs where the country is below the African median', '']);
  sh.getRange(L.vaHead, 1, 1, notes.length).setNotes([notes]);
  sh.setFrozenRows(L.vaHead);
  const n = sh.getMaxRows() - L.vaFirst + 1;
  sh.getRange(L.vaFirst, 5, n, 4).setNumberFormat('#,##0');
  sh.getRange(L.vaFirst, 9, n, 1).setNumberFormat('0.0%');
  sh.getRange(L.vaFirst, 10, n, 1).setNumberFormat('0.0');
  sh.getRange(L.vaFirst, 11, n, 2).setNumberFormat('#,##0');
  sh.getRange(L.vaFirst, 13, n, 5).setNumberFormat('0.000');
  sh.getRange(L.vaFirst, 18, n, 1).setNumberFormat('0.0').setFontWeight('bold');
  sh.setColumnWidth(2, 170); sh.setColumnWidth(3, 260); sh.setColumnWidth(19, 320); sh.setColumnWidth(20, 500);
}

function buildValueAddition_(ss) {
  const sh = resetSheet_(ss, APP.sheets.vaSummary);
  writeBanner_(sh, 'vaSummary');
  const T = top_('vaSummary');
  sh.getRange(T, 1).setFormula('="Trade data: "&P_STATUS&"   |   Enabler data: "&P_WB_STATUS&"   |   Year: "&P_YEAR')
    .setFontStyle('italic').setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);
  sh.getRange(T + 2, 1).setValue('Run menu step 3 (Compute) to fill this page.');
  sh.setConditionalFormatRules([SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(`=ISNUMBER(SEARCH("SAMPLE",$A$${T}))`)
    .setBackground(APP.color.warn).setFontColor('#a50e0e')
    .setRanges([sh.getRange(T, 1, 1, 12)]).build()]);
}

function buildCountryNeeds_(ss) {
  const sh = resetSheet_(ss, APP.sheets.needs);
  writeBanner_(sh, 'needs');
  const T = top_('needs');
  const names = COUNTRIES.map(c => c[2]).sort();
  const iso = `$B$${T + 1}`;
  const heading = (row, text) => sh.getRange(row, 1).setValue(text).setFontWeight('bold').setFontSize(12)
    .setFontColor(APP.color.title).setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);

  sh.getRange(T, 1, 1, 2).setValues([['Country', 'Côte d\'Ivoire']]);
  sh.getRange(T, 2).setBackground(APP.color.input).setFontWeight('bold');
  dropdown_(sh.getRange(T, 2), names);
  sh.getRange(T + 1, 1, 1, 2).setValues([['ISO3 code',
    `=IFERROR(INDEX(Countries!$A$${L.ctryFirst}:$A,MATCH($B$${T},Countries!$C$${L.ctryFirst}:$C,0)),"")`]]);
  sh.getRange(T, 1, 2, 1).setFontWeight('bold');
  sh.getRange(T, 4).setFormula('="Enabler data: "&P_WB_STATUS').setFontStyle('italic');
  steps_(sh, T + 1, 4, ['Step 1: choose a country (yellow). Step 2: the green NOW SHOWING line confirms it. Step 3: read sections 1–4 below.']);
  sh.getRange(T, 2).setNote('Pick a country. Everything on this tab updates automatically — the green NOW SHOWING line confirms it.');

  // 1. Enablers vs African median.
  const E = T + 3;
  heading(E, '1. Enablers — how ready is this country to add value? (compared with the African median)');
  header_(sh.getRange(E + 1, 1, 1, 6), ['Enabler', 'This country', 'African median', 'Status', 'Why it matters', 'Indicator (full name)']);
  INDICATORS.forEach((ind, i) => {
    const r = E + 2 + i;
    const col = colLetter_(3 + i);
    sh.getRange(r, 1, 1, 6).setValues([[
      ind[1],
      `=IFERROR(INDEX(${en_(col)},MATCH(${iso},${en_('A')},0)),"")`,
      `=IFERROR(MEDIAN(${en_(col)}),"")`,
      `=IF(ISNUMBER(B${r}),IF(B${r}<C${r},"GAP: below African median","OK"),"No data")`,
      ind[4],
      ind[2],
    ]]);
  });
  sh.getRange(E + 2, 2, INDICATORS.length, 2).setNumberFormat('0.0');
  const statusRange = sh.getRange(E + 2, 4, INDICATORS.length, 1);
  nowShowing_(sh.getRange(T + 2, 1), `=IF(${iso}="","Choose a country in the yellow cell.","NOW SHOWING: "&$B$${T}&" ("&${iso}&")` +
    ` — enabler indicators available: "&COUNT(B${E + 2}:B${E + 1 + INDICATORS.length})&" of ${INDICATORS.length}  ·  value chains: "&COUNTIF(${va_('A')},${iso})&` +
    `IF(COUNTA(${va_('A')})=0,"  (no value-addition data yet: run Africa Trade → Refresh data)","")&". Everything below is for this country.")`);

  // 2. Value-addition opportunities.
  const O = E + 2 + INDICATORS.length + 1;
  heading(O, '2. Value-addition opportunities (largest value lost first)');
  header_(sh.getRange(O + 1, 1, 1, 6), ['Value chain', 'Raw exports (USD)', 'Processing share', 'Value lost (estimate, USD)',
    'Score (0–100)', 'Needs flagged for this chain']);
  sh.getRange(O + 2, 1).setFormula(
    `=IFERROR(ARRAY_CONSTRAIN(SORT(FILTER({${va_('C')},${va_('E')},${va_('I')},${va_('K')},${va_('R')},${va_('S')}},` +
    `${va_('A')}=${iso}),4,FALSE),10,6),IF(COUNTA(${va_('A')})=0,"No value-addition data yet: the 4-digit data (Raw_HS4) is empty. Run Africa Trade → Refresh data.",` +
    `"This country exports little raw material in the 25 value chains, so there are no opportunities to list."))`);
  sh.getRange(O + 2, 2, 10, 1).setNumberFormat('#,##0');
  sh.getRange(O + 2, 3, 10, 1).setNumberFormat('0.0%');
  sh.getRange(O + 2, 4, 10, 1).setNumberFormat('#,##0');
  sh.getRange(O + 2, 5, 10, 1).setNumberFormat('0.0');

  // 3. What each processing step requires.
  const R = O + 13;
  heading(R, '3. What processing requires for these chains');
  header_(sh.getRange(R + 1, 1, 1, 3), ['Value chain', 'What processing requires', 'Needs (keywords)']);
  const chainRange = `Value_Chains!$A$${L.chainsFirst}:$H`;
  for (let i = 0; i < 10; i++) {
    const r = R + 2 + i, src = `A${O + 2 + i}`;
    sh.getRange(r, 1, 1, 3).setValues([[
      `=IF(ISNUMBER(D${O + 2 + i}),${src},"")`,
      `=IF(A${r}="","",IFERROR(VLOOKUP(A${r},${chainRange},8,FALSE),""))`,
      `=IF(A${r}="","",IFERROR(VLOOKUP(A${r},${chainRange},7,FALSE),""))`,
    ]]);
  }
  sh.getRange(R + 2, 2, 10, 1).setWrap(true);

  // 4. Summary in words.
  const S = R + 13;
  heading(S, '4. In one paragraph');
  const firstStatus = `D${E + 2}:D${E + 1 + INDICATORS.length}`, firstLabel = `A${E + 2}:A${E + 1 + INDICATORS.length}`;
  sh.getRange(S + 1, 1).setFormula(`=IF(${iso}="","",$B$${T}&" — biggest enabler gaps: "&IFERROR(TEXTJOIN(", ",TRUE,FILTER(${firstLabel},LEFT(${firstStatus},3)="GAP")),"none flagged")&".")`);
  sh.getRange(S + 2, 1).setFormula(`=IF(ISNUMBER(D${O + 2}),"Largest value lost: "&A${O + 2}&" — about "&TEXT(D${O + 2},"$#,##0")&" a year (estimate). Processing share today: "&TEXT(C${O + 2},"0%")&".","")`);
  sh.getRange(S + 3, 1).setValue('Always check as well: quality standards and certification, which no indicator measures.');
  sh.getRange(S + 1, 1, 3, 1).setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);

  sh.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenTextStartsWith('GAP').setBackground(APP.color.warn).setFontColor('#a50e0e')
      .setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('OK').setBackground(APP.color.band).setFontColor('#1f4e3d')
      .setRanges([statusRange]).build(),
  ]);
  [290, 150, 130, 200, 420, 380].forEach((w, i) => sh.setColumnWidth(i + 1, w));
}

// ------------------------------------------------------------------
// Value addition — data
// ------------------------------------------------------------------

function parseCodes_(v) {
  return String(v === null || v === undefined ? '' : v).split(/[^0-9]+/).filter(String).map(Number);
}

function chainFromRow_(r) {
  return {
    name: String(r[0]), sector: String(r[1]), raw: parseCodes_(r[2]), semi: parseCodes_(r[3]), fin: parseCodes_(r[4]),
    mult: Number(r[5]) || 1, needs: String(r[6] || '').split(/[,;]/).map(s => s.trim().toLowerCase()).filter(String),
    requires: String(r[7] || ''),
  };
}

function readChains_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(APP.sheets.chains);
  const values = sh && sh.getLastRow() >= L.chainsFirst
    ? sh.getRange(L.chainsFirst, 1, sh.getLastRow() - L.chainsFirst + 1, 8).getValues()
    : VALUE_CHAINS;
  return values.filter(r => String(r[0]).trim()).map(chainFromRow_);
}

/** { ISO3: [indicator values or null] } */
function readEnablers_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(APP.sheets.enablers);
  const out = {};
  if (!sh || sh.getLastRow() < L.enFirst) return out;
  sh.getRange(L.enFirst, 1, sh.getLastRow() - L.enFirst + 1, 2 + INDICATORS.length).getValues().forEach(r => {
    const iso = String(r[0]).trim();
    if (iso.length === 3) out[iso] = r.slice(2).map(v => (v === '' || v === null ? null : Number(v)));
  });
  return out;
}

function hs4Count_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(APP.sheets.rawHs4);
  return sh ? Math.max(sh.getLastRow() - L.hs4First + 1, 0) : 0;
}

function writeHs4_(rows, replace) {
  const sh = sheet_(APP.sheets.rawHs4);
  if (replace) clearSheetBody_(sh, L.hs4First);
  if (!rows.length) return;
  const start = Math.max(sh.getLastRow() + 1, L.hs4First);
  ensureRows_(sh, start + rows.length - 1);
  sh.getRange(start, 1, rows.length, 6).setValues(rows);
}

function writeEnablers_(byIso, years, status) {
  const sh = sheet_(APP.sheets.enablers);
  clearSheetBody_(sh, L.enFirst);
  const rows = readCountries_().map(c => [c.iso, c.name]
    .concat((byIso[c.iso] || []).concat(new Array(INDICATORS.length).fill(null)).slice(0, INDICATORS.length).map(v => (v === null || v === undefined ? '' : v)))
    .concat([years[c.iso] || '']));
  ensureRows_(sh, L.enFirst + rows.length);
  sh.getRange(L.enFirst, 1, rows.length, rows[0].length).setValues(rows);
  setParam_('P_WB_STATUS', status);
}

/** Synthetic HS4 flows with a realistic shape (NOT real statistics). */
function generateSampleHs4_(countries, chains, year) {
  const rng = mulberry32_(20261001);
  const rows = [];
  const push = (iso, flow, codes, value) => {
    if (!codes.length || value < 1000) return;
    const w = codes.map(() => 0.2 + rng());
    const sum = w.reduce((a, b) => a + b, 0);
    codes.forEach((code, i) => {
      const v = Math.round(value * w[i] / sum);
      if (v >= 1000) rows.push([year, iso, 'WLD', flow, code, v]);
    });
  };
  countries.forEach(c => {
    const size = SAMPLE_SIZE[c.iso] || 1;
    chains.forEach((k, i) => {
      const producer = (SAMPLE_CHAIN_PRODUCERS[i] || []).indexOf(c.iso) >= 0;
      const processor = (SAMPLE_CHAIN_PROCESSORS[i] || []).indexOf(c.iso) >= 0;
      let raw = 0, semi = 0, fin = 0;
      if (producer) {
        raw = size * 2e8 * (0.4 + rng());
        semi = raw * (processor ? 0.2 + 0.5 * rng() : 0.05 * rng());
        fin = raw * (processor ? 0.05 + 0.25 * rng() : 0.02 * rng());
      } else if (rng() < 0.15) {
        raw = size * 5e6 * rng();
      }
      if (processor && !producer) fin = size * 3e7 * (0.3 + rng());
      push(c.iso, 'X', k.raw, raw);
      push(c.iso, 'X', k.semi, semi);
      push(c.iso, 'X', k.fin, fin);
      push(c.iso, 'M', k.fin, size * 4e7 * (0.2 + rng()));
      if (rng() < 0.3) push(c.iso, 'M', k.semi, size * 1e7 * rng());
    });
  });
  return rows;
}

/** Synthetic enabler indicators (NOT real statistics). */
function generateSampleEnablers_(countries) {
  const rng = mulberry32_(20261002);
  const ranges = [[8, 100], [2, 22], [2, 80], [1.8, 3.7], [15, 100], [3, 80], [5, 85]];
  const byIso = {}, years = {};
  countries.forEach(c => {
    const tilt = Math.min(Math.log10(1 + (SAMPLE_SIZE[c.iso] || 1)) / 2, 1);
    byIso[c.iso] = ranges.map(([lo, hi]) => Math.round((lo + (hi - lo) * (0.6 * rng() + 0.4 * tilt)) * 10) / 10);
    years[c.iso] = 'sample';
  });
  return { byIso, years };
}

function loadSampleValueAddition_() {
  const countries = readCountries_();
  writeHs4_(generateSampleHs4_(countries, readChains_(), Number(getParam_('P_YEAR'))), true);
  const e = generateSampleEnablers_(countries);
  writeEnablers_(e.byIso, e.years, 'SAMPLE — synthetic enabler values, NOT real World Bank data');
}

/** Menu: real enabler indicators from the World Bank (free, no key). */
function fetchWorldBankData() {
  requireBuilt_();
  try {
    fetchWorldBank_();
  } catch (e) {
    alert_('Could not load World Bank data: ' + e.message);
    return;
  }
  if (rawCount_() > 0) computeScorecard();
  else notify_('World Bank indicators loaded. Load trade data and run step 3 to use them.');
}

function fetchWorldBank_() {
  const countries = readCountries_();
  const isoList = countries.map(c => c.iso).join(';');
  const byIso = {}, yearsSeen = {};
  countries.forEach(c => { byIso[c.iso] = new Array(INDICATORS.length).fill(null); yearsSeen[c.iso] = []; });
  INDICATORS.forEach((ind, j) => {
    const url = `https://api.worldbank.org/v2/country/${isoList}/indicator/${ind[0]}?format=json&mrnev=1&per_page=1000`;
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) throw new Error(`HTTP ${res.getResponseCode()} for ${ind[0]}`);
    const json = JSON.parse(res.getContentText());
    (Array.isArray(json) && json[1] ? json[1] : []).forEach(d => {
      const iso = d.countryiso3code;
      if (byIso[iso] && d.value !== null && d.value !== undefined) {
        byIso[iso][j] = Math.round(Number(d.value) * 10) / 10;
        yearsSeen[iso].push(Number(d.date));
      }
    });
  });
  const years = {};
  Object.keys(yearsSeen).forEach(iso => {
    const y = yearsSeen[iso].filter(Boolean);
    years[iso] = y.length ? (Math.min.apply(null, y) === Math.max.apply(null, y) ? String(y[0]) :
      `${Math.min.apply(null, y)}–${Math.max.apply(null, y)}`) : 'no data';
  });
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  writeEnablers_(byIso, years, `World Bank WDI (fetched ${stamp}; latest available year per country)`);
}

/** Shared UN Comtrade request with retries. Returns the data array. */
function comtradeGet_(query, key) {
  const url = 'https://comtradeapi.un.org/data/v1/get/C/A/HS?' +
    Object.keys(query).map(k => `${k}=${encodeURIComponent(query[k])}`).join('&');
  let res;
  for (let attempt = 1; attempt <= 4; attempt++) {
    res = UrlFetchApp.fetch(url, { headers: { 'Ocp-Apim-Subscription-Key': key }, muteHttpExceptions: true });
    const code = res.getResponseCode();
    if (code === 401 || code === 403) throw new Error('the API key was rejected (check it on Settings)');
    if (code === 200) break;
    if (attempt === 4) throw new Error(`HTTP ${code}: ${res.getContentText().slice(0, 200)}`);
    Utilities.sleep(5000 * attempt);
  }
  return (JSON.parse(res.getContentText()).data) || [];
}

/** One reporter, analysis year, trade with the world, HS4 codes of all value chains. */
function fetchReporterHs4_(reporter, chains, year, key) {
  const codes = {};
  chains.forEach(k => k.raw.concat(k.semi, k.fin).forEach(c => { codes[c] = true; }));
  const list = Object.keys(codes).map(c => ('000' + c).slice(-4));
  if (!list.length) return [];
  const data = comtradeGet_({
    reporterCode: reporter.m49, period: year, partnerCode: 0, partner2Code: 0, flowCode: 'M,X',
    cmdCode: list.join(','), customsCode: 'C00', motCode: 0, maxRecords: 250000, includeDesc: 'false',
  }, key);
  const seen = {};
  data.forEach(d => {
    const code = Number(d.cmdCode), value = Number(d.primaryValue);
    if ((d.flowCode !== 'X' && d.flowCode !== 'M') || !codes[code] || !(value > 0)) return;
    if (d.motCode !== undefined && Number(d.motCode) !== 0) return;
    if (d.partner2Code !== undefined && Number(d.partner2Code) !== 0) return;
    if (d.customsCode !== undefined && d.customsCode !== 'C00') return;
    if (Number(d.partnerCode) !== 0) return;
    seen[[d.flowCode, code].join('|')] = [Number(d.period), reporter.iso, 'WLD', d.flowCode, code, Math.round(value)];
  });
  return Object.keys(seen).map(k => seen[k]);
}

// ------------------------------------------------------------------
// Value addition — compute (pure, no Sheets calls)
// ------------------------------------------------------------------

/**
 * countries, chains: parsed objects. hs4Rows: [year, reporter, partner, flow, hs4, value].
 * enablers: { ISO3: [values] }. Returns { rows: VA_Scorecard rows, summary }.
 */
function valueAddition_(countries, chains, hs4Rows, enablers, year) {
  const X = {}, M = {};
  hs4Rows.forEach(r => {
    if (Number(r[0]) !== year || String(r[2]).trim() !== 'WLD') return;
    const iso = String(r[1]).trim(), code = Number(r[4]), v = Number(r[5]);
    if (!(v > 0)) return;
    const t = String(r[3]).trim().toUpperCase() === 'X' ? X : M;
    const k = iso + '|' + code;
    t[k] = (t[k] || 0) + v;
  });
  const sum = (t, iso, codes) => codes.reduce((s, c) => s + (t[iso + '|' + c] || 0), 0);

  // Enablers: min-max per indicator, African median, gaps.
  const nInd = INDICATORS.length;
  const norm = [], median = [];
  for (let j = 0; j < nInd; j++) {
    const vals = countries.map(c => (enablers[c.iso] || [])[j]).filter(v => typeof v === 'number' && !isNaN(v));
    const sorted = vals.slice().sort((a, b) => a - b);
    median[j] = sorted.length ? (sorted.length % 2 ? sorted[(sorted.length - 1) / 2] :
      (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2) : null;
    norm[j] = scaler_(vals);
  }
  const indValue = (iso, j) => { const v = (enablers[iso] || [])[j]; return typeof v === 'number' && !isNaN(v) ? v : null; };
  const isGap = (iso, j) => { const v = indValue(iso, j); return v !== null && median[j] !== null && v < median[j]; };
  const readiness = (iso, keys) => {
    const s = [];
    INDICATORS.forEach((ind, j) => {
      if (keys && keys.indexOf(ind[3]) < 0) return;
      const v = indValue(iso, j);
      if (v !== null) s.push(norm[j](v));
    });
    return s.length ? s.reduce((a, b) => a + b, 0) / s.length : 0.5;
  };
  const hasEnablers = Object.keys(enablers).some(iso => (enablers[iso] || []).some(v => typeof v === 'number'));
  const needsText = (iso, keys) => {
    if (!hasEnablers) return 'Enabler data missing — load World Bank indicators';
    const out = [];
    keys.forEach(key => {
      if (key === 'standards') return;
      if (INDICATORS.some((ind, j) => ind[3] === key && isGap(iso, j)) && NEED_LABELS[key]) out.push(NEED_LABELS[key]);
    });
    if (keys.indexOf('standards') >= 0) out.push(NEED_LABELS.standards);
    return out.length ? out.join('; ') : 'No enabler gaps flagged';
  };

  // Africa-wide demand for processed products of each chain.
  const afFinM = chains.map(k => countries.reduce((s, c) => s + sum(M, c.iso, k.fin), 0));

  const cands = [];
  countries.forEach(c => chains.forEach((k, i) => {
    const raw = sum(X, c.iso, k.raw), semi = sum(X, c.iso, k.semi), fin = sum(X, c.iso, k.fin);
    const finM = sum(M, c.iso, k.fin);
    if (raw + semi <= 0) return;
    const share = (semi + fin) / (raw + semi + fin);
    const lost = raw * (k.mult - 1) + semi * (k.mult - 1) / 2;
    cands.push({ c, k, i, raw, semi, fin, finM, share, lost: Math.max(lost, 0), round: raw > 0 ? Math.min(raw, finM) : 0 });
  }));
  cands.sort((a, b) => b.lost - a.lost);

  const lg = v => Math.log10(1 + v);
  const nStake = scaler_(cands.map(x => lg(x.lost)));
  const nBase = scaler_(cands.map(x => lg(x.raw + x.semi)));
  const nHome = scaler_(cands.map(x => lg(x.finM)));
  const nAf = scaler_(afFinM.map(lg));
  const r3 = v => Math.round(v * 1000) / 1000;

  const rows = cands.map(x => [
    x.c.iso, x.c.name, x.k.name, x.k.sector, Math.round(x.raw), Math.round(x.semi), Math.round(x.fin), Math.round(x.finM),
    r3(x.share), x.k.mult, Math.round(x.lost), Math.round(x.round),
    r3(nStake(lg(x.lost))), r3(nBase(lg(x.raw + x.semi))), r3(1 - x.share),
    r3(0.5 * nHome(lg(x.finM)) + 0.5 * nAf(lg(afFinM[x.i]))), r3(readiness(x.c.iso, x.k.needs)),
    needsText(x.c.iso, x.k.needs), x.k.requires,
  ]);

  // Country summary.
  const table = countries.map(c => {
    const mine = cands.filter(x => x.c.iso === c.iso);
    let raw = 0, processed = 0, lost = 0, round = 0, finM = 0;
    chains.forEach(k => {
      raw += sum(X, c.iso, k.raw); processed += sum(X, c.iso, k.semi) + sum(X, c.iso, k.fin); finM += sum(M, c.iso, k.fin);
    });
    mine.forEach(x => { lost += x.lost; round += x.round; });
    const gaps = INDICATORS.map((ind, j) => (isGap(c.iso, j) ? ind[1].replace(/ \(.*\)$/, '') : null)).filter(Boolean);
    return {
      iso: c.iso, name: c.name, region: c.region, finM, raw, processed, share: raw + processed ? processed / (raw + processed) : 0,
      lost, round, top: mine.length ? mine[0].k.name : '—', readiness: hasEnablers ? readiness(c.iso, null) : '',
      gaps: hasEnablers ? (gaps.length ? gaps.join(', ') : 'none flagged') : 'no enabler data', chains: mine.length,
    };
  }).sort((a, b) => b.lost - a.lost);

  const chainTable = chains.map((k, i) => {
    let raw = 0, processed = 0, lost = 0;
    countries.forEach(c => { raw += sum(X, c.iso, k.raw); processed += sum(X, c.iso, k.semi) + sum(X, c.iso, k.fin); });
    cands.filter(x => x.i === i).forEach(x => { lost += x.lost; });
    return [k.name, raw, processed, raw + processed ? processed / (raw + processed) : 0, lost];
  }).sort((a, b) => b[4] - a[4]);

  const tot = table.reduce((s, r) => ({ raw: s.raw + r.raw, processed: s.processed + r.processed, lost: s.lost + r.lost,
    round: s.round + r.round }), { raw: 0, processed: 0, lost: 0, round: 0 });
  return {
    rows,
    summary: {
      kpis: [tot.raw, tot.processed, tot.raw + tot.processed ? tot.processed / (tot.raw + tot.processed) : 0, tot.lost, tot.round, chains.length],
      table, chainTable,
      sectorLost: groupSum_(cands, x => x.k.sector, x => x.lost),
      regionLost: groupSum_(cands, x => x.c.region, x => x.lost),
    },
  };
}

// ------------------------------------------------------------------
// Value addition — write results
// ------------------------------------------------------------------

function computeValueAddition_() {
  const vaSheet = SpreadsheetApp.getActive().getSheetByName(APP.sheets.vaScore);
  if (!vaSheet) return;
  if (hs4Count_() === 0) {
    clearSheetBody_(vaSheet, L.vaFirst);
    const sh = sheet_(APP.sheets.vaSummary);
    sh.getCharts().forEach(c => sh.removeChart(c));
    const T = top_('vaSummary');
    const body = sh.getRange(T + 2, 1, Math.max(sh.getMaxRows() - T - 1, 1), sh.getMaxColumns());
    body.breakApart();
    body.clear();
    const vc = SpreadsheetApp.getActive().getSheetByName(APP.sheets.vaCharts);
    if (vc) vc.getCharts().forEach(ch => vc.removeChart(ch));
    sh.getRange(T + 2, 1).setValue('No HS4 data in Raw_HS4 yet. Load data (menu 2a sample or 2b UN Comtrade) to see value addition.');
    return;
  }
  const sh4 = sheet_(APP.sheets.rawHs4);
  const rows4 = sh4.getRange(L.hs4First, 1, sh4.getLastRow() - L.hs4First + 1, 6).getValues();
  const res = valueAddition_(readCountries_(), readChains_(), rows4, readEnablers_(), Number(getParam_('P_YEAR')));
  writeVaScorecard_(res.rows);
  writeValueAddition_(res.summary);
  writeValueLostCharts_(res.summary);
}

function writeVaScorecard_(rows) {
  const sh = sheet_(APP.sheets.vaScore);
  clearSheetBody_(sh, L.vaFirst);
  if (!rows.length) return;
  const F = L.vaFirst;
  ensureRows_(sh, F + rows.length);
  sh.getRange(F, 1, rows.length, 17).setValues(rows.map(r => r.slice(0, 17)));
  sh.getRange(F, 19, rows.length, 2).setValues(rows.map(r => r.slice(17, 19)));
  const weighted = ['M', 'N', 'O', 'P', 'Q'].map((col, i) => `${col}${F}:${col}*${vaWeightCell_(i)}`).join('+');
  sh.getRange(F, 18).setFormula(
    `=ARRAYFORMULA(IF(A${F}:A="",,ROUND((${weighted})/MAX(SUM(${vaWeightRange_()}),0.0001)*100,1)))`);
}

function writeValueAddition_(s) {
  const sh = sheet_(APP.sheets.vaSummary);
  const T = top_('vaSummary');
  sh.getCharts().forEach(c => sh.removeChart(c));
  const body = sh.getRange(T + 2, 1, Math.max(sh.getMaxRows() - T - 1, 1), sh.getMaxColumns());
  body.breakApart();
  body.clear();

  const labels = ['Raw exports in the 25 chains', 'Processed exports in the 25 chains', 'Africa processing share',
    'Value lost (estimate, per year)', 'Round-trip imports', 'Value chains tracked'];
  const money = '[>=1000000000]$#,##0.0,,,"B";[>=1000000]$#,##0.0,,"M";$#,##0';
  [1, 3, 5, 7, 9, 11].forEach((col, i) => {
    sh.getRange(T + 2, col, 1, 2).merge().setValue(labels[i]).setFontSize(9).setFontColor('#555555')
      .setHorizontalAlignment('center');
    sh.getRange(T + 3, col, 1, 2).merge().setValue(s.kpis[i]).setFontSize(16).setFontWeight('bold')
      .setHorizontalAlignment('center').setBackground(APP.color.band)
      .setNumberFormat(i === 2 ? '0.0%' : i === 5 ? '0' : money);
  });

  const head = ['ISO3', 'Country', 'Raw exports (USD)', 'Processed exports (USD)', 'Processing share',
    'Value lost (estimate, USD)', 'Round-trip imports (USD)', 'Chain with most value lost', 'Readiness (0–1)',
    'Enabler gaps (below African median)', 'Chains with raw exports', 'Best value-addition score'];
  const H = T + 6, B = T + 7;
  sh.getRange(T + 5, 1).setValue('Countries (sorted by value lost)').setFontWeight('bold').setFontColor(APP.color.title);
  header_(sh.getRange(H, 1, 1, head.length), head);
  sh.getRange(H, 1, 1, head.length).setWrap(true);
  sh.setRowHeight(H, 48);
  const rows = s.table.map((r, i) => [r.iso, r.name, r.raw, r.processed, r.share, r.lost, r.round, r.top,
    r.readiness === '' ? '' : Math.round(r.readiness * 100) / 100, r.gaps, r.chains,
    `=IFERROR(MAXIFS(${va_('R')},${va_('A')},A${B + i}),"")`]);
  ensureRows_(sh, B + rows.length + 5);
  sh.getRange(B, 1, rows.length, head.length).setValues(rows);
  sh.getRange(B, 3, rows.length, 2).setNumberFormat('#,##0');
  sh.getRange(B, 5, rows.length, 1).setNumberFormat('0.0%');
  sh.getRange(B, 6, rows.length, 2).setNumberFormat('#,##0');
  sh.getRange(B, 9, rows.length, 1).setNumberFormat('0.00');
  sh.getRange(B, 12, rows.length, 1).setNumberFormat('0.0');
  for (let i = 0; i < rows.length; i += 2) sh.getRange(B + i, 1, 1, head.length).setBackground(APP.color.band);

  const cc = 14; // column N
  sh.getRange(T + 5, cc).setValue('Value chains, all of Africa (sorted by value lost)').setFontWeight('bold')
    .setFontColor(APP.color.title);
  header_(sh.getRange(H, cc, 1, 5), ['Value chain', 'Raw exports (USD)', 'Processed exports (USD)', 'Processing share',
    'Value lost (estimate, USD)']);
  sh.getRange(H, cc, 1, 5).setWrap(true);
  sh.getRange(B, cc, s.chainTable.length, 5).setValues(s.chainTable);
  sh.getRange(B, cc + 1, s.chainTable.length, 2).setNumberFormat('#,##0');
  sh.getRange(B, cc + 3, s.chainTable.length, 1).setNumberFormat('0.0%');
  sh.getRange(B, cc + 4, s.chainTable.length, 1).setNumberFormat('#,##0');

  const top = Math.min(15, s.table.length);
  const charts = [
    [[sh.getRange(H, 2, top + 1, 1), sh.getRange(H, 6, top + 1, 1)], 'Top 15 countries by value lost (estimate, USD per year)', '#a50e0e', null],
    [[sh.getRange(H, cc, s.chainTable.length + 1, 1), sh.getRange(H, cc + 3, s.chainTable.length + 1, 1)],
      'Processing share by value chain, all of Africa (higher = more value added)', '#1f4e3d', 'percent'],
    [[sh.getRange(H, cc, s.chainTable.length + 1, 1), sh.getRange(H, cc + 4, s.chainTable.length + 1, 1)],
      'Value lost by value chain, all of Africa (estimate, USD per year)', '#e8a33d', null],
  ];
  charts.forEach(([ranges, title, colour, fmt], i) => {
    let b = sh.newChart().setChartType(Charts.ChartType.BAR).setNumHeaders(1)
      .setOption('title', title).setOption('legend', { position: 'none' }).setOption('colors', [colour])
      .setOption('width', 640).setOption('height', 420)
      .setPosition(H + i * 22, 20, 0, 0);
    ranges.forEach(r => { b = b.addRange(r); });
    if (fmt) b = b.setOption('hAxis', { format: fmt });
    sh.insertChart(b.build());
  });
  sh.setColumnWidth(2, 170); sh.setColumnWidth(8, 260); sh.setColumnWidth(10, 280);
  sh.setColumnWidth(cc, 260);
}

/** [[key, sum]] sorted by sum, largest first. */
function groupSum_(items, keyFn, valFn) {
  const acc = {};
  items.forEach(x => { const k = keyFn(x); acc[k] = (acc[k] || 0) + valFn(x); });
  return Object.keys(acc).map(k => [k, acc[k]]).sort((a, b) => b[1] - a[1]);
}

// ------------------------------------------------------------------
// Value lost — diagrams and charts tab
// ------------------------------------------------------------------

/** Row positions on the Value_Lost_Charts tab. */
function vlcLayout_() {
  const T = top_('vaCharts');
  return { T, ladder: T + 6, ladderRows: 30, example: T + 40, country: T + 48, grid: T + 86 };
}

function buildValueLostCharts_(ss) {
  const sh = resetSheet_(ss, APP.sheets.vaCharts);
  writeBanner_(sh, 'vaCharts');
  const V = vlcLayout_(), T = V.T;
  [24, 250, 40, 250, 40, 250, 40, 250, 80, 80, 80, 80, 80, 240, 140, 140].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  const heading = (row, text) => sh.getRange(row, 2).setValue(text).setFontSize(13).setFontWeight('bold')
    .setFontColor(APP.color.title).setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);
  const caption = (row, text) => sh.getRange(row, 2).setValue(text).setFontStyle('italic').setFontColor('#555555')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);
  const cellHeader = (row, col, text) => header_(sh.getRange(row, col, 1, 1), [text]);

  // 1. Diagram: how value is lost.
  heading(T, '1. How value is lost — the story in four steps');
  const boxes = [
    ['1. RAW MATERIAL LEAVES\nCocoa beans, copper ore,\ncrude oil… worth $1', '#e0e0e0'],
    ['2. PROCESSED ABROAD\nFactories, jobs, skills\nand profits are created\noutside Africa', '#fde9c8'],
    ['3. PRODUCT COMES BACK\nChocolate, cable, petrol…\nworth about $2 is imported\n(round-trip trade)', '#d9e7fb'],
    ['4. VALUE LOST\n$2 − $1 = $1 of value\nadded elsewhere for each\n$1 exported raw', '#f4dcdc'],
  ];
  boxes.forEach(([text, colour], i) => {
    const col = 2 + i * 2;
    sh.getRange(T + 1, col, 4, 1).merge().setValue(text).setBackground(colour).setWrap(true)
      .setHorizontalAlignment('center').setVerticalAlignment('middle').setFontWeight('bold')
      .setBorder(true, true, true, true, false, false, '#888888', SpreadsheetApp.BorderStyle.SOLID);
    if (i < boxes.length - 1) {
      sh.getRange(T + 1, col + 1, 4, 1).merge().setValue('→').setFontSize(22).setFontColor('#888888')
        .setHorizontalAlignment('center').setVerticalAlignment('middle');
    }
  });
  sh.setRowHeights(T + 1, 4, 22);
  caption(T + 5, 'Read left to right. "$2" is an example: the real ratio for each chain is its value multiplier (next diagram).');

  // 2. Value ladder per chain (live from Value_Chains).
  heading(V.ladder, '2. The value ladder — what $1 of raw material becomes when processed');
  cellHeader(V.ladder + 1, 2, 'Value chain');
  cellHeader(V.ladder + 1, 4, 'Raw → semi-processed → processed ($)');
  sh.getRange(V.ladder + 1, 6, 1, 3).merge();
  header_(sh.getRange(V.ladder + 1, 6, 1, 1), ['Grey = raw value ($1) · green = value added by processing (lost if exported raw)']);
  const mult = r => `Value_Chains!$F$${r}`;
  const multAll = `Value_Chains!$F$${L.chainsFirst}:$F`;
  for (let i = 0; i < V.ladderRows; i++) {
    const r = V.ladder + 2 + i, src = L.chainsFirst + i;
    sh.getRange(r, 2).setFormula(`=IF(Value_Chains!$A$${src}="","",Value_Chains!$A$${src})`);
    sh.getRange(r, 4).setFormula(`=IF(B${r}="","","1.00 → "&TEXT((1+${mult(src)})/2,"0.00")&" → "&TEXT(${mult(src)},"0.00"))`);
    sh.getRange(r, 6, 1, 3).merge().setFormula(
      `=IF(B${r}="","",SPARKLINE({1,MAX(${mult(src)}-1,0)},{"charttype","bar";"max",MAX(${multAll});"color1","#999999";"color2","#1f4e3d"}))`);
  }
  caption(V.ladder + 2 + V.ladderRows, 'Longer green bar = more value added by processing. Multipliers are assumptions — edit them on Value_Chains.');

  // 3. Worked example.
  heading(V.example, '3. Worked example (illustrative numbers, USD millions)');
  const steps = [
    ['Raw cocoa beans exported', 100, '#999999'],
    ['Same beans processed into chocolate (× 2.0)', 200, '#1f4e3d'],
    ['Value lost if exported raw = 200 − 100', 100, '#a50e0e'],
    ['If 30% were processed at home: value captured', 30, '#4a86e8'],
    ['Still lost', 70, '#e8a33d'],
  ];
  steps.forEach(([label, v, colour], i) => {
    const r = V.example + 1 + i;
    sh.getRange(r, 2).setValue(label);
    sh.getRange(r, 4).setValue(v).setNumberFormat('$#,##0"M"');
    sh.getRange(r, 6, 1, 3).merge().setFormula(`=SPARKLINE(D${r},{"charttype","bar";"max",200;"color1","${colour}"})`);
  });
  caption(V.example + 6, 'Formula used everywhere in the workbook: value lost = raw exports × (multiplier − 1). Semi-processed exports count half.');

  // 4. Live: one country.
  const C = V.country, iso = `$B$${C + 2}`;
  heading(C, '4. Pick a country — its value lost by chain (charts below redraw automatically)');
  sh.getRange(C + 1, 2).setValue('Côte d\'Ivoire').setBackground(APP.color.input).setFontWeight('bold');
  dropdown_(sh.getRange(C + 1, 2), COUNTRIES.map(c => c[2]).sort());
  steps_(sh, C + 1, 4, ['Step 1: choose a country (yellow). Step 2: the green NOW SHOWING line and the chart legends change to it.',
    'Step 3: the table and both charts below redraw within a second. Nothing to show? The green line says why.']);
  sh.getRange(C + 1, 2).setNote('Pick a country. The table and both charts below redraw automatically — the green NOW SHOWING line and the chart legends confirm it.');
  sh.getRange(C + 2, 2).setFormula(
    `=IFERROR(INDEX(Countries!$A$${L.ctryFirst}:$A,MATCH($B$${C + 1},Countries!$C$${L.ctryFirst}:$C,0)),"")`).setFontColor('#888888');
  const name = `$B$${C + 1}`, n = `COUNTIF(${va_('A')},${iso})`;
  nowShowing_(sh.getRange(C + 3, 2), `=IF(COUNTA(${va_('A')})=0,"No value-addition data yet: the 4-digit data (Raw_HS4) is empty. Run Africa Trade → Refresh data (or 2a for sample data).",` +
    `IF(${n}=0,"NOW SHOWING: "&${name}&" — no value chains: it exports little of the 25 raw materials in this data, so there is nothing to chart. Try another country.",` +
    `"NOW SHOWING: "&${name}&" ("&${iso}&") — "&${n}&" value chains · total value lost "&TEXT(SUMIF(${va_('A')},${iso},${va_('K')}),"$#,##0")&"  ·  table and charts below are for this country."))`);
  cellHeader(C + 4, 2, 'Value chain');
  [[4, 'Raw exports: '], [6, 'Processed exports: '], [8, 'Value lost: ']].forEach(([col, text]) => {
    cellHeader(C + 4, col, '');
    sh.getRange(C + 4, col).setFormula(`="${text}"&${name}`);
  });
  const base = `ARRAY_CONSTRAIN(SORT(FILTER({${va_('C')},${va_('E')},${va_('F')}+${va_('G')},${va_('K')}},${va_('A')}=${iso}),4,FALSE),10,4)`;
  [[2, 1], [4, 2], [6, 3], [8, 4]].forEach(([col, n]) =>
    sh.getRange(C + 5, col).setFormula(`=ARRAYFORMULA(IFERROR(INDEX(${base},0,${n}),""))`));
  [4, 6, 8].forEach(col => sh.getRange(C + 5, col, 10, 1).setNumberFormat('#,##0'));

  heading(V.grid - 2, '5. Africa-wide charts about value lost');
  sh.getRange(V.grid - 1, 2).setValue('Run Africa Trade → 3. Compute to draw the charts.').setFontStyle('italic')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);
  sh.setHiddenGridlines(true);
}

function writeValueLostCharts_(s) {
  const sh = SpreadsheetApp.getActive().getSheetByName(APP.sheets.vaCharts);
  if (!sh) return;
  const V = vlcLayout_();
  sh.getCharts().forEach(c => sh.removeChart(c));
  const area = sh.getRange(V.grid - 1, 1, Math.max(sh.getMaxRows() - V.grid + 2, 1), sh.getMaxColumns());
  area.breakApart();
  area.clear();
  ensureRows_(sh, V.grid + 70);
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
  sh.getRange(V.grid - 1, 2).setValue(`Drawn by step 3 on ${stamp}. The tables from column N are the data behind each chart. Values are estimates.`)
    .setFontStyle('italic').setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);

  const place = (row, col, title, caption, builder) => {
    sh.getRange(row, col).setValue(title).setFontWeight('bold').setFontSize(11).setFontColor(APP.color.title)
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);
    sh.getRange(row + 1, col).setValue(caption).setFontStyle('italic').setFontSize(9).setFontColor('#555555')
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);
    sh.insertChart(builder.setOption('width', 600).setOption('height', 380).setPosition(row + 2, col, 0, 0).build());
  };

  // Section 4 (live) charts — ranges hold formulas that follow the country dropdown.
  const C = V.country, rows = 11;
  place(C + 16, 2, 'Value lost by chain — country chosen above (live)',
    'Longest bar = the chain where this country loses most by exporting raw. The legend names the country.',
    sh.newChart().setChartType(Charts.ChartType.BAR).setNumHeaders(1)
      .addRange(sh.getRange(C + 4, 2, rows, 1)).addRange(sh.getRange(C + 4, 8, rows, 1))
      .setOption('legend', { position: 'top' }).setOption('colors', ['#a50e0e']));
  place(C + 16, 8, 'Raw vs processed exports — country chosen above (live)',
    'Grey = sold raw, green = sold processed. Mostly grey = little value added at home. The legend names the country.',
    sh.newChart().setChartType(Charts.ChartType.BAR).setNumHeaders(1)
      .addRange(sh.getRange(C + 4, 2, rows, 1)).addRange(sh.getRange(C + 4, 4, rows, 1)).addRange(sh.getRange(C + 4, 6, rows, 1))
      .setOption('isStacked', true).setOption('legend', { position: 'top' }).setOption('colors', ['#999999', '#1f4e3d']));

  // Section 5 data tables (column N onwards).
  const DC = 14;
  let r = V.grid;
  const table = (title, head, data, formats) => {
    sh.getRange(r, DC).setValue(title).setFontWeight('bold').setFontColor(APP.color.title);
    header_(sh.getRange(r + 1, DC, 1, head.length), head);
    if (data.length) sh.getRange(r + 2, DC, data.length, head.length).setValues(data);
    (formats || []).forEach((f, i) => { if (f) sh.getRange(r + 2, DC + i, Math.max(data.length, 1), 1).setNumberFormat(f); });
    const range = sh.getRange(r + 1, DC, data.length + 1, head.length);
    r += data.length + 4;
    return range;
  };
  const byLost = s.table.filter(x => x.lost > 0).slice(0, 15);
  const t1 = table('Data: raw vs processed, top 15 by value lost', ['Country', 'Raw exports', 'Processed exports'],
    byLost.map(x => [x.name, x.raw, x.processed]), [null, '#,##0', '#,##0']);
  const t2 = table('Data: value lost by sector', ['Sector', 'Value lost (USD)'], s.sectorLost, [null, '#,##0']);
  const t3 = table('Data: value lost by region', ['AU region', 'Value lost (USD)'], s.regionLost, [null, '#,##0']);
  const byRound = s.table.filter(x => x.round > 0).sort((a, b) => b.round - a.round).slice(0, 15);
  const t4 = table('Data: round trip, top 15', ['Country', 'Raw exports', 'Processed imports'],
    byRound.map(x => [x.name, x.raw, x.finM]), [null, '#,##0', '#,##0']);
  const scatter = s.table.filter(x => x.readiness !== '' && x.lost > 0).map(x => [x.readiness, x.lost]);
  const t5 = table('Data: readiness vs value lost (one row per country)', ['Readiness (0–1)', 'Value lost (USD)'],
    scatter, ['0.00', '#,##0']);

  const specs = [
    [t1, Charts.ChartType.BAR, 'A. Raw vs processed exports — top 15 countries by value lost',
      'Grey = exported raw, green = exported processed. Long grey bars = big value lost.',
      { isStacked: true, colors: ['#999999', '#1f4e3d'] }],
    [t2, Charts.ChartType.PIE, 'B. Where the value is lost — by sector',
      'Each slice = a sector\'s share of all value lost in Africa (estimate).', { pieHole: 0.4 }],
    [t3, Charts.ChartType.COLUMN, 'C. Value lost by region (estimate, USD per year)',
      'Which African Union regions lose most by exporting raw materials.',
      { legend: { position: 'none' }, colors: ['#a50e0e'] }],
    [t4, Charts.ChartType.COLUMN, 'D. Round trip — raw out, processed back in (top 15)',
      'Grey = raw exports, blue = processed goods imported in the same chains. Both high = round-trip trade.',
      { colors: ['#999999', '#4a86e8'], hAxis: { slantedText: true, slantedTextAngle: 45 } }],
    [t5, Charts.ChartType.SCATTER, 'E. Readiness vs value lost — one dot per country',
      'Right and high = much to gain and fairly ready: quick wins. Left and high = big prize, needs enablers first.',
      { legend: { position: 'none' }, colors: ['#1f4e3d'], hAxis: { title: 'Readiness (0–1)', minValue: 0, maxValue: 1 },
        vAxis: { title: 'Value lost (USD)' } }],
  ];
  specs.forEach(([range, type, title, caption, options], i) => {
    let b = sh.newChart().setChartType(type).addRange(range).setNumHeaders(1);
    Object.keys(options).forEach(k => { b = b.setOption(k, options[k]); });
    place(V.grid + 1 + Math.floor(i / 2) * 23, i % 2 === 0 ? 2 : 8, title, caption, b);
  });
}

/**
 * After an update from an older version: fill value-addition data that did not exist yet.
 * Returns a message for the user, or '' when nothing was needed.
 */
function fillMissingValueAddition_() {
  if (rawCount_() === 0) return '';
  const source = String(getParam_('P_SOURCE'));
  const noEnablers = Object.keys(readEnablers_()).length === 0;
  if (hs4Count_() === 0) {
    if (source === 'SAMPLE') {
      loadSampleValueAddition_();
      return 'Value-addition sample data was added (the older version did not have it). All value-addition tabs are now filled.';
    }
    if (noEnablers) { try { fetchWorldBank_(); } catch (e) { /* optional */ } }
    return 'Your data comes from an older version without the 4-digit (HS4) detail needed for value addition.\n\n' +
      'Run Africa Trade → Refresh data to download it. Until then the value-addition tabs say "no value-addition data yet".';
  }
  if (noEnablers && source !== 'SAMPLE') { try { fetchWorldBank_(); } catch (e) { /* optional */ } }
  return '';
}

// ------------------------------------------------------------------
// Guidance helpers and Health_Check
// ------------------------------------------------------------------

/** Green "NOW SHOWING" confirmation line (formula). */
function nowShowing_(range, formula) {
  range.setFormula(formula).setFontWeight('bold').setFontColor('#0d652d').setBackground('#e6f4ea')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);
}

/** Small numbered guidance notes, one per row, starting at (row, col). */
function steps_(sh, row, col, lines) {
  lines.forEach((t, i) => sh.getRange(row + i, col).setValue(t).setFontStyle('italic').setFontColor('#1c3d6e')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW));
}

/** Rows of the live checks: [check, result formula, status formula using {B}, what to do, where]. */
function healthChecks_() {
  const rt = c => `Raw_Trade!$${c}$${L.rawFirst}:$${c}`;
  return [
    ['Trade data rows (Raw_Trade)', `=COUNTA(${rt('B')})`, '=IF({B}>0,"OK","CHECK")',
      'Load data: menu 2a (sample), 2b (UN Comtrade) or 2c (your own).', 'Raw_Trade'],
    ['Rows for the analysis year', `=COUNTIF(${rt('A')},P_YEAR)`, '=IF({B}>0,"OK","CHECK")',
      'Set Settings → Analysis year to a year that exists in Raw_Trade, or run Refresh data.', 'Settings'],
    ['Countries with world trade in that year (of 54)',
      `=IFERROR(COUNTUNIQUE(FILTER(${rt('B')},${rt('A')}=P_YEAR,${rt('C')}="WLD")),0)`, '=IF({B}>=40,"OK","CHECK")',
      'Some countries have not reported for this year. Try an earlier year; the data status on Settings lists them.', 'Settings'],
    ['Opportunities in the Scorecard', `=COUNTA(${sc_('A')})`, '=IF({B}>0,"OK","CHECK")',
      'Run menu 3 (Compute).', 'Scorecard'],
    ['Composite scores calculated', `=COUNT(${sc_('U')})`, `=IF(AND({B}>0,{B}=COUNTA(${sc_('A')})),"OK","CHECK")`,
      'Run menu 3. Check that the weights on Settings are numbers.', 'Scorecard'],
    ['Trade-gap weights total', '=SUM(WEIGHTS)', '=IF({B}>0,"OK","CHECK")',
      'At least one trade-gap weight on Settings must be above 0.', 'Settings'],
    ['Detailed 4-digit rows (Raw_HS4)', `=COUNTA(Raw_HS4!$B$${L.hs4First}:$B)`, '=IF({B}>0,"OK","CHECK")',
      'Run Refresh data (UN Comtrade) or 2a (sample). Needed for all value-addition tabs.', 'Raw_HS4'],
    ['Value-addition rows (VA_Scorecard)', `=COUNTA(${va_('A')})`, '=IF({B}>0,"OK","CHECK")',
      'Needs Raw_HS4 data, then menu 3 (Compute).', 'VA_Scorecard'],
    ['Value-addition weights total', '=SUM(VA_WEIGHTS)', '=IF({B}>0,"OK","CHECK")',
      'At least one value-addition weight on Settings must be above 0.', 'Settings'],
    ['Countries with enabler data (of 54)', `=COUNT(${en_('C')})`, '=IF({B}>=30,"OK","CHECK")',
      'Run menu 2d (World Bank indicators, free).', 'Enablers'],
    ['Countries listed', `=COUNTA(Countries!$A$${L.ctryFirst}:$A)`, '=IF({B}>=50,"OK","CHECK")',
      'The Countries tab should list the 54 African countries.', 'Countries'],
    ['Products included', `=COUNTIF(Products!$D$${L.prodFirst}:$D,TRUE)`, '=IF({B}>0,"OK","CHECK")',
      'Tick at least one product on the Products tab.', 'Products'],
    ['Value chains listed', `=COUNTA(Value_Chains!$A$${L.chainsFirst}:$A)`, '=IF({B}>0,"OK","CHECK")',
      'The Value_Chains tab should list the value chains.', 'Value_Chains'],
    ['Trade data source', '=P_STATUS', '=IF(OR(ISNUMBER(SEARCH("SAMPLE",{B})),ISNUMBER(SEARCH("fail",{B}))),"CHECK","OK")',
      'SAMPLE = synthetic numbers. Use 2b (UN Comtrade) for real data before sharing results.', 'Settings'],
    ['Enabler data source', '=P_WB_STATUS', '=IF(OR(ISNUMBER(SEARCH("SAMPLE",{B})),ISNUMBER(SEARCH("fail",{B})),ISNUMBER(SEARCH("No enabler",{B}))),"CHECK","OK")',
      'Run menu 2d to load real World Bank indicators.', 'Enablers'],
    ['Last computed', '=P_LAST_REFRESH', '=IF(OR({B}="",{B}="—"),"CHECK","OK")', 'Run menu 3 (Compute).', 'Settings'],
    ['Monthly auto-refresh', '=P_AUTO', '="INFO"', 'Switch with the menu: Monthly auto-refresh ON / OFF.', 'Settings'],
  ];
}

function buildHealthCheck_(ss) {
  const sh = resetSheet_(ss, APP.sheets.health);
  writeBanner_(sh, 'health');
  const T = top_('health');
  const heading = (row, text) => sh.getRange(row, 1).setValue(text).setFontSize(13).setFontWeight('bold')
    .setFontColor(APP.color.title).setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);

  heading(T, '1. Live checks (update by themselves)');
  header_(sh.getRange(T + 1, 1, 1, 5), ['Check', 'Result', 'Status', 'What to do if it says CHECK', 'Tab']);
  const checks = healthChecks_();
  checks.forEach(([label, result, status, fix, where], i) => {
    const r = T + 2 + i;
    sh.getRange(r, 1, 1, 5).setValues([[label, result, status.split('{B}').join(`B${r}`), fix, where]]);
  });
  const statusRange = sh.getRange(T + 2, 3, checks.length, 1);
  statusRange.setFontWeight('bold').setHorizontalAlignment('center');
  sh.getRange(T + 2, 2, checks.length, 1).setHorizontalAlignment('left');
  const sumRow = T + 2 + checks.length;
  nowShowing_(sh.getRange(sumRow, 1), `=IF(COUNTIF(C${T + 2}:C${sumRow - 1},"CHECK")=0,"ALL CHECKS OK — the workbook is ready.",` +
    `COUNTIF(C${T + 2}:C${sumRow - 1},"CHECK")&" check(s) need attention — see the red rows and the ""What to do"" column.")`);

  const A = sumRow + 2;
  heading(A, '2. Full audit — scans every tab for errors (run: Africa Trade → Run full audit)');
  sh.getRange(A + 1, 1).setValue('Not run yet.').setFontStyle('italic');
  header_(sh.getRange(A + 2, 1, 1, 4), ['Tab', 'Cell', 'Problem', 'What to do']);

  const rules = [
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('OK').setBackground('#e6f4ea').setFontColor('#0d652d')
      .setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('CHECK').setBackground(APP.color.warn).setFontColor('#a50e0e')
      .setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('INFO').setBackground('#f1f3f4').setFontColor('#555555')
      .setRanges([statusRange]).build(),
  ];
  sh.setConditionalFormatRules(rules);
  [330, 330, 90, 560, 140].forEach((w, i) => sh.setColumnWidth(i + 1, w));
}

/** Row where the audit results start on Health_Check. */
function auditRow_() { return top_('health') + 2 + healthChecks_().length + 2; }

/** Menu: scans every tab for error values, missing tabs, named ranges and charts. */
function runFullAudit() {
  requireBuilt_();
  const ss = SpreadsheetApp.getActive();
  const problems = [];
  const s = APP.sheets;
  Object.keys(s).forEach(k => {
    if (!ss.getSheetByName(s[k])) problems.push([s[k], '—', 'Tab is missing', 'Run Africa Trade → Update workbook.']);
  });
  ['WEIGHTS', 'VA_WEIGHTS'].concat(PARAMS.map(p => p[0])).forEach(n => {
    if (!ss.getRangeByName(n)) problems.push([s.settings, '—', `Named range ${n} is missing`, 'Run Africa Trade → Update workbook.']);
  });
  const ERR = /^#(REF!|N\/A|ERROR!|VALUE!|DIV\/0!|NAME\?|NUM!|NULL!)/;
  let scanned = 0;
  Object.keys(s).forEach(k => {
    const sh = ss.getSheetByName(s[k]);
    if (!sh || sh.getLastRow() === 0 || sh.getLastColumn() === 0) return;
    const vals = sh.getRange(1, 1, sh.getLastRow(), sh.getLastColumn()).getDisplayValues();
    let found = 0;
    vals.forEach((row, i) => row.forEach((v, j) => {
      scanned++;
      if (!ERR.test(String(v))) return;
      found++;
      if (found <= 20) {
        problems.push([s[k], sh.getRange(i + 1, j + 1).getA1Notation(), `Shows ${v}`,
          'Run Update workbook; if it stays, send this line to whoever maintains the code.']);
      }
    }));
    if (found > 20) problems.push([s[k], '…', `${found - 20} more error cells`, 'See above.']);
  });
  if (rawCount_() > 0) {
    [[s.dashboard, 2], [s.charts, 6], [s.vaSummary, 3], [s.vaCharts, 7]].forEach(([name, n]) => {
      const sh = ss.getSheetByName(name);
      if (sh && hs4Count_() === 0 && (name === s.vaSummary || name === s.vaCharts)) return;
      if (sh && sh.getCharts().length < n) {
        problems.push([name, '—', `${sh.getCharts().length} of ${n} charts drawn`, 'Run menu 3 (Compute).']);
      }
    });
  }

  const sh = sheet_(APP.sheets.health);
  const A = auditRow_();
  clearSheetBody_(sh, A + 3);
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
  const summary = problems.length
    ? `Audit run ${stamp}: ${problems.length} problem(s) found in ${scanned.toLocaleString()} cells — see the list below.`
    : `Audit run ${stamp}: no problems found. ${scanned.toLocaleString()} cells on ${Object.keys(s).length} tabs checked, all named ranges and charts present.`;
  sh.getRange(A + 1, 1).setValue(summary).setFontWeight('bold')
    .setFontColor(problems.length ? '#a50e0e' : '#0d652d').setBackground(problems.length ? APP.color.warn : '#e6f4ea')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);
  if (problems.length) {
    ensureRows_(sh, A + 3 + problems.length);
    sh.getRange(A + 3, 1, problems.length, 4).setValues(problems);
  }
  sh.activate();
  notify_(problems.length ? `Audit: ${problems.length} problem(s) found — see Health_Check.` : 'Audit: no problems found.');
}
