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
  version: '2.1.0',
  sheets: {
    guide: 'Guide',
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
  ['P_SOURCE', 'Data source', 'NONE', 'Set automatically: SAMPLE, COMTRADE or OWN. Refresh uses it.', false],
  ['P_LAST_REFRESH', 'Last computed', '—', 'Set automatically when step 3 (Compute) finishes.', false],
  ['P_AUTO', 'Monthly auto-refresh', 'OFF', 'Switch with the menu: Monthly auto-refresh ON / OFF.', false],
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
    what: ['How much each of the 7 criteria counts (weights) and other parameters such as the analysis year and the minimum gap size.'],
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
  ['ECCAS', 'Economic Community of Central African States'],
  ['ECOWAS', 'Economic Community of West African States'],
  ['FAQ', 'Frequently Asked Questions'],
  ['FTA', 'Free Trade Area'],
  ['HS', 'Harmonized Commodity Description and Coding System — the world standard product classification'],
  ['HS2', 'Harmonized System at 2-digit (chapter) level — 96 product groups'],
  ['ISO3', 'ISO 3166-1 alpha-3 three-letter country code (ISO = International Organization for Standardization), e.g. NGA = Nigeria'],
  ['ITC', 'International Trade Centre (UN / WTO agency)'],
  ['KPI', 'Key Performance Indicator — the headline tiles on the Dashboard'],
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
  ['WAEMU', 'West African Economic and Monetary Union'],
  ['WITS', 'World Integrated Trade Solution (World Bank)'],
  ['WLD', 'World — partner code meaning trade with all countries combined'],
  ['WTO', 'World Trade Organization'],
  ['X', 'Exports (trade flow code)'],
];

// Tabs whose first content row is a table header (frozen under the blue box).
const DATA_TABS = ['score', 'raw', 'countries', 'products'];

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
    settingsParamHead: s + CRITERIA.length + 3,
    settingsParam: s + CRITERIA.length + 4,
    scoreHead: top_('score'), scoreFirst: top_('score') + 1,
    rawHead: top_('raw'), rawFirst: top_('raw') + 1,
    ctryHead: top_('countries'), ctryFirst: top_('countries') + 1,
    prodHead: top_('products'), prodFirst: top_('products') + 1,
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
    .addItem('3. Compute scorecard, dashboard & charts', 'computeScorecard')
    .addSeparator()
    .addItem('Monthly auto-refresh ON / OFF', 'toggleAutoRefresh')
    .addItem('Update workbook after pasting new code (keeps your data)', 'upgradeWorkbook')
    .addItem('Reset workbook to defaults (deletes data)', 'buildWorkbook')
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
  if (!confirm_('Clear all rows in Raw_Trade so you can paste your own data?')) return;
  clearSheetBody_(sheet_(APP.sheets.raw), L.rawFirst);
  setParam_('P_SOURCE', 'OWN');
  setParam_('P_STATUS', 'Own data (pasted into Raw_Trade by user)');
  sheet_(APP.sheets.raw).activate();
  notify_(`Raw_Trade cleared. Paste your rows from row ${L.rawFirst} (under the header), then run Refresh or step 3.`);
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
  if (snap.raw.length) computeScorecard();
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
  const snap = { weights: {}, params: {}, countries: null, products: null, raw: [] };

  const st = ss.getSheetByName(APP.sheets.settings);
  if (st && st.getLastRow()) {
    const names = CRITERIA.map(c => c[0]);
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
  return snap;
}

function restore_(snap) {
  const st = sheet_(APP.sheets.settings);
  CRITERIA.forEach((c, i) => {
    if (snap.weights[c[0]] !== undefined) st.getRange(L.settingsWeight + i, 2).setValue(snap.weights[c[0]]);
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
}

// ------------------------------------------------------------------
// Build
// ------------------------------------------------------------------

function buildWorkbook_() {
  const ss = SpreadsheetApp.getActive();
  const keptKey = ss.getRangeByName('P_API_KEY') ? ss.getRangeByName('P_API_KEY').getValue() : '';
  const s = APP.sheets;
  const order = [s.guide, s.about, s.dashboard, s.charts, s.top, s.country, s.explain, s.score, s.settings,
    s.method, s.glossary, s.sources, s.updates, s.faq, s.countries, s.products, s.raw];
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
  buildScorecard_(ss);
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
  sh.getRange(T, 4).setValue('← Pick filters in the yellow cells. Ranking follows the weights on the Settings tab.')
    .setFontStyle('italic');
  sh.getRange(T + 1, 4).setValue('Want to know WHY a row scores what it does? Open the Explain_Score tab.')
    .setFontStyle('italic');

  const H = T + 5, F = T + 6;
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
  sh.getRange(T, 4).setValue('← Pick an exporter, importer and product (tip: copy them from Top_Gaps). Step 3 pre-selects the current #1.')
    .setFontStyle('italic');
  sh.getRange(T + 3, 1).setValue('Row in Scorecard');
  sh.getRange(T + 3, 2).setFormula(`=IFERROR(MATCH(1,INDEX((${sc_('B')}=$B$${T})*(${sc_('D')}=$B$${T + 1})*(${sc_('F')}=$B$${T + 2}),0),0),"")`);
  sh.getRange(T + 3, 3).setFormula(`=IF(${idx}="","Not in the Scorecard: one side does not trade this product, the gap is below the minimum, or it did not fit under the row limit.","Found")`);

  const at = col => `INDEX(${sc_(col)},${idx})`;
  const money = col => `TEXT(${at(col)},"$#,##0")`;
  const ex = `$B$${T}`, im = `$B$${T + 1}`, pr = `$B$${T + 2}`;
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
    ['#1f4e3d', [s.dashboard, s.charts, s.top, s.country, s.explain, s.score]],
    ['#e8a33d', [s.settings, s.countries, s.products]],
    ['#999999', [s.raw]],
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
  const helpRows = ['dashboard', 'charts', 'top', 'country', 'explain', 'score', 'settings', 'countries', 'products', 'raw']
    .map(k => {
      const h = TAB_HELP[k];
      return [h.title.split(' — ')[0], h.what.join(' '), h.read.join(' '), h.say.join('').trim(), h.watch.join(' ')];
    });
  writeDocPage_(ss, s.guide, [
    ['title', 'START HERE — Africa Trade Gap Scorecard'],
    ['sub', 'What African countries import and export, and where they could trade more with each other.'],
    ['sub', `Code version ${APP.version} · workbook built ${stamp}`],
    ['gap'],
    ['h', 'Get going in 4 steps'],
    ['table', ['Step', 'What to do', 'What happens'], [
      ['1. Build', 'Menu Africa Trade → Quick start (first time only)', 'Creates every tab, header, formula, chart area and dropdown.'],
      ['2. Load data', 'Pick ONE: 2a SAMPLE · 2b UN Comtrade (United Nations Commodity Trade Statistics Database) · 2c your own data', 'Fills Raw_Trade. See Data_Sources for what each option means.'],
      ['3. Compute', 'Menu → 3. Compute scorecard, dashboard & charts', 'Scores every exporter → importer → product combination and draws the charts.'],
      ['4. Explore', 'Dashboard, Charts, Top_Gaps, Country_View, Explain_Score', 'Change weights on Settings — rankings update instantly.'],
      ['Later', 'Refresh data · Monthly auto-refresh · Update workbook (new code)', 'All explained on the Refresh_&_Updates tab.'],
    ]],
    ['h', 'Every results and input tab starts with a blue box'],
    ['p', 'It has four parts: WHAT YOU SEE · HOW TO READ IT · SAY IT LIKE THIS (a sentence you can use when presenting) · WATCH OUT.'],
    ['p', 'Use the − / + button at the top left of the tab to hide or show it. All the boxes are also collected at the bottom of this page.'],
    ['gap'],
    ['h', 'Tab map  (tab colours: blue = explanation · green = results · orange = your inputs · grey = data)'],
    ['table', ['Tab', 'Type', 'What it is for'], [
      [s.guide, 'Explanation', 'This page: steps, tab map, presentation script, abbreviations.'],
      [s.about, 'Explanation', 'What the tool is, why it exists, and which questions it answers.'],
      [s.dashboard, 'Results', 'Africa-wide totals, one row per country, charts of intra-African share and gaps by sector.'],
      [s.charts, 'Results', 'Diagrams of how the index works, live weights, the gap illustrated, and six charts.'],
      [s.top, 'Results', 'Ranked list of the best trade opportunities. Filter by exporter, importer and sector.'],
      [s.country, 'Results', 'Pick one country: top exports and imports, African buyers and suppliers, best opportunities.'],
      [s.explain, 'Results', 'Pick one opportunity and see exactly how its score was built, criterion by criterion.'],
      [s.score, 'Results', 'The full composite index: raw inputs, 7 sub-scores (0–1) and the composite score (0–100).'],
      [s.settings, 'Your inputs', 'Weights of the 7 criteria and other parameters (yellow cells).'],
      [s.method, 'Explanation', 'Every formula, step by step, with a worked example and the known limits.'],
      [s.glossary, 'Explanation', 'Plain-English meaning of every term.'],
      [s.sources, 'Explanation', 'Where the numbers come from, the data format, and known gaps.'],
      [s.updates, 'Explanation', 'How to refresh the data, switch on auto-refresh, and safely update the code.'],
      [s.faq, 'Explanation', 'Common questions and answers.'],
      [s.countries, 'Your inputs', '54 countries with region, capital location, customs unions, RECs and AfCFTA status. Editable.'],
      [s.products, 'Your inputs', '96 HS (Harmonized System) product groups with sector. Untick "Include" to leave one out.'],
      [s.raw, 'Data', 'The trade figures everything is calculated from.'],
    ]],
    ['h', 'Presenting this workbook in 5 minutes'],
    ['table', ['#', 'Tab', 'What to show', 'What to say'], [
      [1, s.about, '"The problem" section', '"Africa trades far more with the rest of the world than with itself — even when a neighbour makes what we import."'],
      [2, s.charts, 'Diagram 1 (five boxes)', '"We take official trade data, find where a gap exists, score each gap on 7 criteria, weight them, and rank them."'],
      [3, s.dashboard, 'Tiles and "Africa share of exports"', '"Only a small part of each country\'s exports stays in Africa. The sector table shows where the potential is."'],
      [4, s.top, 'The top 10, then filter for your audience\'s country', '"These are the most promising pairings: the buyer already imports it, the seller already exports it — just not to each other."'],
      [5, s.explain, 'The #1 opportunity', '"Here is why it scores so high: most points come from the size of the gap and market access."'],
      [6, s.settings, 'Change one weight live', '"If we care more about distance, the ranking changes like this — the method is transparent."'],
      [7, s.method, '"Know the limits"', '"These are leads to investigate, not guarantees. Official data misses informal trade."'],
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
      ['4. Decision support', 'Rankings you can filter, and weights you can change to reflect your priorities — e.g. give more weight to proximity if logistics is your main concern.'],
    ]],
    ['h', 'Questions it answers'],
    ['p', '• Which African countries could supply what my country currently imports from outside Africa?'],
    ['p', '• Where are the biggest untapped markets in Africa for my country\'s exports?'],
    ['p', '• Which sectors hold the largest unrealised intra-African trade?'],
    ['p', '• How much of each country\'s exports already go to other African countries?'],
    ['p', '• Why does a particular opportunity rank high or low? (Explain_Score tab)'],
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
    ['h', 'Know the limits'],
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
    ['gap'],
    ['h', 'Other good sources'],
    ['table', ['Source', 'What it offers'], [
      ['WITS (World Integrated Trade Solution, World Bank)', 'wits.worldbank.org — Comtrade data with an easier download interface, plus tariff data.'],
      ['ITC (International Trade Centre) Trade Map', 'trademap.org — detailed trade flows, mirror data, and export-potential indicators.'],
      ['CEPII BACI', 'cepii.fr — BACI (Base pour l\'Analyse du Commerce International) from CEPII, a French research centre: Comtrade data reconciled between reporters and partners; good for countries that report poorly.'],
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
  const key = String(getParam_('P_API_KEY') || '').trim();
  const year = Number(getParam_('P_YEAR'));
  const started = Date.now();
  const missing = (props.getProperty(APP.missingProp) || '').split(',').filter(String);

  while (cursor < countries.length && Date.now() - started < 4.5 * 60 * 1000) {
    const c = countries[cursor];
    let rows;
    try {
      rows = fetchReporter_(c, countries, year, key);
    } catch (e) {
      setParam_('P_STATUS', `UN Comtrade fetch failed at ${c.name}: ${e.message}`);
      props.deleteProperty(APP.fetchProp);
      notify_('Comtrade fetch failed: ' + e.message);
      return;
    }
    if (rows.length) writeRaw_(rows, false);
    else missing.push(c.iso);
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
  const url = 'https://comtradeapi.un.org/data/v1/get/C/A/HS?' +
    Object.keys(query).map(k => `${k}=${encodeURIComponent(query[k])}`).join('&');

  let res;
  for (let attempt = 1; attempt <= 4; attempt++) {
    res = UrlFetchApp.fetch(url, {
      headers: { 'Ocp-Apim-Subscription-Key': key },
      muteHttpExceptions: true,
    });
    const code = res.getResponseCode();
    if (code === 401 || code === 403) throw new Error('the API key was rejected (check it on Settings)');
    if (code === 200) break;
    if (attempt === 4) throw new Error(`HTTP ${code}: ${res.getContentText().slice(0, 200)}`);
    Utilities.sleep(5000 * attempt);
  }

  const data = (JSON.parse(res.getContentText()).data) || [];
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
