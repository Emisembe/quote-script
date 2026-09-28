/**
 * Africa Trade Gap Scorecard
 * ------------------------------------------------------------------
 * A self-building Google Sheets app. Paste this file into
 * Extensions → Apps Script of an empty Google Sheet, save, reload the
 * sheet, then use the "🌍 Africa Trade" menu.
 *
 * It does two things:
 *   1. Trade picture – imports and exports of every African country,
 *      by product (HS 2-digit) and by African partner.
 *   2. Gap finder – a composite index (multi-criteria scorecard) that
 *      ranks every "exporter A → importer B → product" combination where
 *      A already sells the product to the world, B already buys it from
 *      the world, but little or nothing flows between them yet.
 *
 * The weights of the scorecard live on the Settings tab. Change them and
 * the ranking updates live (the composite score is a sheet formula).
 */

// ------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------

const APP = {
  sheets: {
    guide: 'Guide',
    about: 'About',
    explain: 'Explain_Score',
    method: 'Methodology',
    glossary: 'Glossary',
    sources: 'Data_Sources',
    faq: 'FAQ',
    dashboard: 'Dashboard',
    top: 'Top_Gaps',
    country: 'Country_View',
    score: 'Scorecard',
    settings: 'Settings',
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
  },
  fetchProp: 'CT_CURSOR',
  missingProp: 'CT_MISSING',
  fetchHandler: 'continueComtradeFetch',
};

// [name, default weight, explanation] — order matches Scorecard columns N..T
const CRITERIA = [
  ['Demand', 20, "How much the importer buys of this product from the whole world (log scale)."],
  ['Supply capacity', 15, "How much the exporter sells of this product to the whole world (log scale)."],
  ['Untapped gap', 25, "min(demand, supply) minus what already flows from exporter to importer (log scale)."],
  ['Market access', 15, "Same customs union > same REC/FTA > both in AfCFTA > other (scores set below)."],
  ['Proximity', 10, "Distance between capitals, reduced if either country is landlocked."],
  ['Demand growth', 5, "Growth of the importer's world imports of this product vs. the previous year."],
  ['Competitiveness (RCA)', 10, "Exporter's revealed comparative advantage in the product vs. Africa as a whole."],
];

// [named range, label, default, note]
const PARAMS = [
  ['P_YEAR', 'Analysis year', 2023, 'Latest year analysed. The year before is used for growth.'],
  ['P_MIN_GAP', 'Minimum untapped gap (USD)', 100000, 'Smaller opportunities are ignored.'],
  ['P_MAX_ROWS', 'Max rows in Scorecard', 20000, 'Largest gaps are kept. Keep below ~50,000 for speed.'],
  ['P_ACC_CU', 'Access score: same customs union', 1, '0–1. E.g. SACU, EAC, WAEMU, CEMAC, ECOWAS CET.'],
  ['P_ACC_REC', 'Access score: same REC / FTA', 0.8, '0–1. E.g. COMESA, SADC, ECCAS, AMU.'],
  ['P_ACC_AFCFTA', 'Access score: both in AfCFTA', 0.6, '0–1. Uses the AfCFTA column on the Countries tab.'],
  ['P_ACC_OTHER', 'Access score: other', 0.3, '0–1.'],
  ['P_LANDLOCK', 'Proximity multiplier if landlocked', 0.85, 'Applied when exporter or importer is landlocked.'],
  ['P_API_KEY', 'UN Comtrade API key', '', 'Free key: comtradedeveloper.un.org → subscribe to "comtrade - v1".'],
  ['P_STATUS', 'Data status', 'No data loaded', 'Set automatically. Shown on the Dashboard.'],
];

const SETTINGS_WEIGHT_ROW = 5;   // first weight row on Settings
const SETTINGS_PARAM_ROW = 15;   // first parameter row on Settings

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
    .createMenu('🌍 Africa Trade')
    .addItem('▶ Quick start (build + sample data + score)', 'quickStart')
    .addSeparator()
    .addItem('1. Build / rebuild workbook', 'buildWorkbook')
    .addItem('2a. Load SAMPLE data (synthetic, for testing)', 'loadSampleData')
    .addItem('2b. Fetch REAL data from UN Comtrade', 'fetchComtradeData')
    .addItem('2c. Clear Raw_Trade to paste your own data', 'clearRawTrade')
    .addItem('3. Compute scorecard & dashboard', 'computeScorecard')
    .addSeparator()
    .addItem('Stop a running Comtrade fetch', 'stopComtradeFetch')
    .addToUi();
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
      !confirm_('Rebuild will reset every app tab (your Comtrade API key is kept). Continue?')) return;
  buildWorkbook_();
  notify_('Workbook built. Next: load data (menu step 2a, 2b or 2c).');
}

function loadSampleData() {
  requireBuilt_();
  if (!confirm_('Replace everything in Raw_Trade with SAMPLE (synthetic) data?')) return;
  loadSampleData_();
  notify_('Sample data loaded. Next: menu step 3 (Compute scorecard).');
}

function clearRawTrade() {
  requireBuilt_();
  if (!confirm_('Clear all rows in Raw_Trade so you can paste your own data?')) return;
  clearSheetBody_(sheet_(APP.sheets.raw));
  setParam_('P_STATUS', 'Own data (pasted into Raw_Trade by user)');
  sheet_(APP.sheets.raw).activate();
  notify_('Raw_Trade cleared. Paste rows under the header, then run step 3.');
}

// ------------------------------------------------------------------
// Build
// ------------------------------------------------------------------

function buildWorkbook_() {
  const ss = SpreadsheetApp.getActive();
  const keptKey = ss.getRangeByName('P_API_KEY') ? ss.getRangeByName('P_API_KEY').getValue() : '';

  const s = APP.sheets;
  const order = [s.guide, s.about, s.dashboard, s.top, s.country, s.explain, s.score, s.settings,
    s.method, s.glossary, s.sources, s.faq, s.countries, s.products, s.raw];
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
  buildExplainScore_(ss);
  buildGuide_(ss);
  buildAbout_(ss);
  buildMethodology_(ss);
  buildGlossary_(ss);
  buildDataSources_(ss);
  buildFaq_(ss);
  colourTabs_(ss);
  ss.getSheetByName(APP.sheets.guide).activate();
}

function buildSettings_(ss, keptKey) {
  const sh = resetSheet_(ss, APP.sheets.settings);
  sh.getRange('A1').setValue('Settings — scorecard weights & parameters')
    .setFontSize(16).setFontWeight('bold').setFontColor(APP.color.title);
  sh.getRange('A2').setValue('Yellow cells are yours to edit. Weights are relative (they do not need to add up to 100). ' +
    'Changing a weight re-ranks the Scorecard and Top_Gaps instantly.').setFontStyle('italic');

  header_(sh.getRange(SETTINGS_WEIGHT_ROW - 1, 1, 1, 3), ['Criterion', 'Weight', 'What it measures']);
  sh.getRange(SETTINGS_WEIGHT_ROW, 1, CRITERIA.length, 3).setValues(CRITERIA);
  sh.getRange(SETTINGS_WEIGHT_ROW, 2, CRITERIA.length, 1).setBackground(APP.color.input);
  const totalRow = SETTINGS_WEIGHT_ROW + CRITERIA.length;
  sh.getRange(totalRow, 1, 1, 2).setValues([['Total', `=SUM(B${SETTINGS_WEIGHT_ROW}:B${totalRow - 1})`]])
    .setFontWeight('bold');
  ss.setNamedRange('WEIGHTS', sh.getRange(SETTINGS_WEIGHT_ROW, 2, CRITERIA.length, 1));

  header_(sh.getRange(SETTINGS_PARAM_ROW - 1, 1, 1, 3), ['Parameter', 'Value', 'Notes']);
  const rows = PARAMS.map(p => [p[1], p[0] === 'P_API_KEY' ? keptKey : p[2], p[3]]);
  sh.getRange(SETTINGS_PARAM_ROW, 1, rows.length, 3).setValues(rows);
  PARAMS.forEach((p, i) => {
    const cell = sh.getRange(SETTINGS_PARAM_ROW + i, 2);
    ss.setNamedRange(p[0], cell);
    if (p[0] !== 'P_STATUS') cell.setBackground(APP.color.input);
  });
  sh.getRange(SETTINGS_PARAM_ROW + 1, 2).setNumberFormat('#,##0');

  sh.setColumnWidth(1, 260); sh.setColumnWidth(2, 220); sh.setColumnWidth(3, 560);
  sh.setFrozenRows(0);
}

function buildCountries_(ss) {
  const sh = resetSheet_(ss, APP.sheets.countries);
  header_(sh.getRange(1, 1, 1, 10), ['ISO3', 'UN M49', 'Country', 'AU region', 'Capital lat',
    'Capital lon', 'Landlocked', 'Customs unions (; separated)', 'RECs / FTAs (; separated)',
    'AfCFTA member (verify)']);
  sh.getRange(2, 1, COUNTRIES.length, 10).setValues(COUNTRIES);
  sh.getRange(2, 7, COUNTRIES.length, 1).insertCheckboxes();
  sh.getRange(2, 10, COUNTRIES.length, 1).insertCheckboxes();
  sh.setFrozenRows(1);
  sh.setColumnWidth(3, 200); sh.setColumnWidth(8, 200); sh.setColumnWidth(9, 220); sh.setColumnWidth(10, 170);
  sh.getRange(COUNTRIES.length + 3, 1).setValue(
    'Memberships are a starting point (e.g. Mali, Burkina Faso and Niger left ECOWAS in Jan 2025). ' +
    'Check AfCFTA ratification status at au-afcfta.org and edit freely — step 3 re-reads this tab.')
    .setFontStyle('italic');
}

function buildProducts_(ss) {
  const sh = resetSheet_(ss, APP.sheets.products);
  header_(sh.getRange(1, 1, 1, 4), ['HS2', 'Product', 'Sector', 'Include in gap analysis']);
  const rows = HS2.map(([hs, name]) => [hs, name, sectorOf_(hs), HS_EXCLUDED.indexOf(hs) < 0]);
  sh.getRange(2, 1, rows.length, 4).setValues(rows);
  sh.getRange(2, 1, rows.length, 1).setNumberFormat('00');
  sh.getRange(2, 4, rows.length, 1).insertCheckboxes();
  sh.setFrozenRows(1);
  sh.setColumnWidth(2, 240); sh.setColumnWidth(3, 190); sh.setColumnWidth(4, 170);
}

function buildRawTrade_(ss) {
  const sh = resetSheet_(ss, APP.sheets.raw);
  header_(sh.getRange(1, 1, 1, 6), ['Year', 'Reporter ISO3', 'Partner ISO3 (WLD = world)',
    'Flow (X/M)', 'HS2', 'Value (USD)']);
  sh.getRange(1, 3).setNote('WLD = trade with the whole world. Any other code = an African partner.');
  sh.getRange(1, 4).setNote('X = exports by the reporter, M = imports by the reporter.');
  sh.getRange('E:E').setNumberFormat('00');
  sh.getRange('F:F').setNumberFormat('#,##0');
  sh.getRange('A1:F1').setNumberFormat('@');
  sh.setFrozenRows(1);
  sh.setColumnWidth(3, 190);
}

function buildScorecard_(ss) {
  const sh = resetSheet_(ss, APP.sheets.score);
  const headers = ['Exporter ISO3', 'Exporter', 'Importer ISO3', 'Importer', 'HS2', 'Product', 'Sector',
    'Importer demand (USD)', 'Exporter supply (USD)', 'Current A→B trade (USD)', 'Untapped gap (USD)',
    'Distance (km)', 'Market access']
    .concat(CRITERIA.map(c => c[0] + ' (0–1)'))
    .concat(['Composite score (0–100)', 'Import growth (raw)', 'RCA (raw)']);
  header_(sh.getRange(1, 1, 1, headers.length), headers);
  sh.getRange(1, 1, 1, headers.length).setWrap(true);
  sh.setRowHeight(1, 48);
  sh.setFrozenRows(1);
  sh.setFrozenColumns(0);
  sh.getRange('E:E').setNumberFormat('00');
  sh.getRange('H:L').setNumberFormat('#,##0');
  sh.getRange('N:T').setNumberFormat('0.000');
  sh.getRange('U:U').setNumberFormat('0.0').setFontWeight('bold');
  sh.getRange('V:V').setNumberFormat('0.0%');
  sh.getRange('W:W').setNumberFormat('0.00');
  const notes = ['Country that could sell', '', 'Country that could buy', '', 'HS 2-digit chapter', '', '',
    "Importer's imports of this product from the whole world",
    "Exporter's exports of this product to the whole world",
    'What the exporter already sells the importer (larger of both reports)',
    'min(demand, supply) − current trade', 'Great-circle distance between capitals',
    'Best shared arrangement: customs union > REC/FTA > AfCFTA > other']
    .concat(CRITERIA.map(c => c[2] + ' Scaled 0–1 — see Methodology.'))
    .concat(['Weighted average of the 7 sub-scores × 100. Live formula: follows the weights on Settings.',
      "Importer's import growth vs. previous year (capped −50%…+100%). Blank = unknown.",
      'Revealed comparative advantage of the exporter in this product (Africa = reference). >1 = specialised.']);
  sh.getRange(1, 1, 1, notes.length).setNotes([notes]);
}

function buildTopGaps_(ss) {
  const sh = resetSheet_(ss, APP.sheets.top);
  const names = COUNTRIES.map(c => c[2]).sort();
  const sectors = SECTORS.map(s => s[2]);
  sh.getRange('A1').setValue('Top trade gaps — where African countries could trade more with each other')
    .setFontSize(16).setFontWeight('bold').setFontColor(APP.color.title);

  const labels = [['Exporter (supplier)', 'All'], ['Importer (market)', 'All'], ['Sector', 'All'], ['Show top', 50]];
  sh.getRange(2, 1, 4, 2).setValues(labels);
  sh.getRange(2, 1, 4, 1).setFontWeight('bold');
  sh.getRange(2, 2, 4, 1).setBackground(APP.color.input);
  dropdown_(sh.getRange('B2'), ['All'].concat(names));
  dropdown_(sh.getRange('B3'), ['All'].concat(names));
  dropdown_(sh.getRange('B4'), ['All'].concat(sectors));
  dropdown_(sh.getRange('B5'), [10, 25, 50, 100, 250, 500]);
  sh.getRange('D2').setValue('Pick filters in the yellow cells. Ranking follows the weights on the Settings tab.')
    .setFontStyle('italic');
  sh.getRange('D3').setValue('Want to know WHY a row scores what it does? Open the Explain_Score tab.')
    .setFontStyle('italic');

  header_(sh.getRange(7, 1, 1, 9), ['Rank', 'Exporter', 'Importer', 'HS2', 'Product',
    'Untapped gap (USD)', 'Current trade (USD)', 'Market access', 'Score']);
  sh.getRange('A8').setFormula('=ARRAYFORMULA(IF(ISNUMBER(I8:I),ROW(I8:I)-7,))');
  const cols = '{Scorecard!B2:B,Scorecard!D2:D,Scorecard!E2:E,Scorecard!F2:F,Scorecard!K2:K,' +
    'Scorecard!J2:J,Scorecard!M2:M,Scorecard!U2:U}';
  sh.getRange('B8').setFormula(
    `=IFERROR(ARRAY_CONSTRAIN(SORT(FILTER(${cols},Scorecard!A2:A<>"",` +
    '($B$2="All")+(Scorecard!B2:B=$B$2),($B$3="All")+(Scorecard!D2:D=$B$3),' +
    '($B$4="All")+(Scorecard!G2:G=$B$4)),8,FALSE),$B$5,8),' +
    '"No opportunities match these filters yet (or step 3 has not been run).")');
  sh.getRange('D8:D').setNumberFormat('00');
  sh.getRange('F8:G').setNumberFormat('#,##0');
  sh.getRange('I8:I').setNumberFormat('0.0').setFontWeight('bold');
  sh.setFrozenRows(7);
  sh.setColumnWidth(1, 150); sh.setColumnWidth(2, 170); sh.setColumnWidth(3, 170);
  sh.setColumnWidth(5, 220); sh.setColumnWidth(6, 140); sh.setColumnWidth(7, 140); sh.setColumnWidth(8, 190);
  sh.getRange('I8:I1000').setBackground(null);
  const rule = SpreadsheetApp.newConditionalFormatRule()
    .setGradientMaxpoint('#57bb8a').setGradientMinpoint('#ffffff')
    .setRanges([sh.getRange('I8:I1000')]).build();
  sh.setConditionalFormatRules([rule]);
}

function buildCountryView_(ss) {
  const sh = resetSheet_(ss, APP.sheets.country);
  const names = COUNTRIES.map(c => c[2]).sort();
  sh.getRange('A1').setValue('Country trade profile').setFontSize(16).setFontWeight('bold')
    .setFontColor(APP.color.title);
  sh.getRange('A2:B2').setValues([['Country', 'Nigeria']]);
  sh.getRange('B2').setBackground(APP.color.input).setFontWeight('bold');
  dropdown_(sh.getRange('B2'), names);
  sh.getRange('A3:B3').setValues([['ISO3', '=IFERROR(INDEX(Countries!A2:A,MATCH(B2,Countries!C2:C,0)),"")']]);
  sh.getRange('D2').setFormula('="Year "&P_YEAR&" — "&P_STATUS').setFontStyle('italic');

  const sumifs = (partner, flow, extra) =>
    `=SUMIFS(Raw_Trade!F:F,Raw_Trade!A:A,P_YEAR,${extra},Raw_Trade!C:C,"${partner}",Raw_Trade!D:D,"${flow}")`;
  const kpis = [
    ['Exports to the world (USD)', sumifs('WLD', 'X', 'Raw_Trade!B:B,$B$3')],
    ['Imports from the world (USD)', sumifs('WLD', 'M', 'Raw_Trade!B:B,$B$3')],
    ['Trade balance (USD)', '=B5-B6'],
    ['Exports to African countries (USD)', sumifs('<>WLD', 'X', 'Raw_Trade!B:B,$B$3')],
    ['Share of exports going to Africa', '=IFERROR(B8/B5,0)'],
    ['Imports from African countries (USD, partner-reported)',
      '=SUMIFS(Raw_Trade!F:F,Raw_Trade!A:A,P_YEAR,Raw_Trade!C:C,$B$3,Raw_Trade!D:D,"X")'],
  ];
  sh.getRange(5, 1, kpis.length, 2).setValues(kpis);
  sh.getRange(5, 1, kpis.length, 1).setFontWeight('bold');
  sh.getRange(5, 2, kpis.length, 1).setNumberFormat('#,##0');
  sh.getRange('B9').setNumberFormat('0.0%');

  const q = (select, where, group, label) =>
    `=IFERROR(QUERY(Raw_Trade!A2:F,"select ${select}, sum(F) where A = "&P_YEAR&" and ${where} ` +
    `group by ${group} order by sum(F) desc limit 10 label ${group} '${label}', sum(F) 'Value (USD)'",0),"No data")`;
  const productName = r => `=ARRAYFORMULA(IF(${r}="",,IFERROR(VLOOKUP(${r},Products!A:B,2,FALSE),"")))`;
  const countryName = r => `=ARRAYFORMULA(IF(${r}="",,IFERROR(VLOOKUP(${r},{Countries!A:A,Countries!C:C},2,FALSE),"")))`;

  const blocks = [
    // [row, col, title, query, name formula, name header, name kind]
    [12, 1, 'Top 10 exports (to the world)', q('E', `B = '"&$B$3&"' and C = 'WLD' and D = 'X'`, 'E', 'HS2'), productName, 'Product'],
    [12, 5, 'Top 10 imports (from the world)', q('E', `B = '"&$B$3&"' and C = 'WLD' and D = 'M'`, 'E', 'HS2'), productName, 'Product'],
    [26, 1, 'Top African buyers of its exports', q('C', `B = '"&$B$3&"' and C <> 'WLD' and D = 'X'`, 'C', 'Partner'), countryName, 'Country'],
    [26, 5, 'Top African suppliers to it (partner-reported)', q('B', `C = '"&$B$3&"' and D = 'X'`, 'B', 'Partner'), countryName, 'Country'],
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

  const opp = (who, filterCol) =>
    `=IFERROR(ARRAY_CONSTRAIN(SORT(FILTER({Scorecard!${who}2:${who},Scorecard!F2:F,Scorecard!K2:K,Scorecard!U2:U},` +
    `Scorecard!${filterCol}2:${filterCol}=$B$3),4,FALSE),10,4),"—")`;
  sh.getRange(40, 1).setValue('Best opportunities to SELL more in Africa').setFontWeight('bold')
    .setFontColor(APP.color.title);
  header_(sh.getRange(41, 1, 1, 4), ['Buyer', 'Product', 'Gap (USD)', 'Score']);
  sh.getRange(42, 1).setFormula(opp('D', 'A'));
  sh.getRange(40, 6).setValue('Best African suppliers for what it imports').setFontWeight('bold')
    .setFontColor(APP.color.title);
  header_(sh.getRange(41, 6, 1, 4), ['Supplier', 'Product', 'Gap (USD)', 'Score']);
  sh.getRange(42, 6).setFormula(opp('B', 'C'));
  sh.getRange('C42:C51').setNumberFormat('#,##0');
  sh.getRange('H42:H51').setNumberFormat('#,##0');
  sh.getRange('D42:D51').setNumberFormat('0.0');
  sh.getRange('I42:I51').setNumberFormat('0.0');

  sh.setColumnWidth(1, 330); sh.setColumnWidth(2, 150); sh.setColumnWidth(3, 200);
  sh.setColumnWidth(5, 110); sh.setColumnWidth(6, 170); sh.setColumnWidth(7, 200);
}

function buildDashboard_(ss) {
  const sh = resetSheet_(ss, APP.sheets.dashboard);
  sh.getRange('A1').setValue('Africa Trade Dashboard').setFontSize(18).setFontWeight('bold')
    .setFontColor(APP.color.title);
  sh.getRange('A2').setFormula('="Data: "&P_STATUS&"   |   Year: "&P_YEAR').setFontStyle('italic');
  sh.getRange('A4').setValue('Run menu step 3 (Compute scorecard & dashboard) to fill this page.');
  const rule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=ISNUMBER(SEARCH("SAMPLE",$A$2))')
    .setBackground(APP.color.warn).setFontColor('#a50e0e')
    .setRanges([sh.getRange('A2:M2')]).build();
  sh.setConditionalFormatRules([rule]);
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
  writeDocPage_(ss, APP.sheets.guide, [
    ['title', 'START HERE — Africa Trade Gap Scorecard'],
    ['sub', 'What African countries import and export, and where they could trade more with each other.'],
    ['gap'],
    ['h', 'Get going in 4 steps'],
    ['table', ['Step', 'What to do', 'What happens'], [
      ['1. Build', 'Menu 🌍 Africa Trade → "1. Build / rebuild workbook"', 'Creates every tab, header, formula and dropdown (already done if you can read this).'],
      ['2. Load data', 'Pick ONE: 2a SAMPLE, 2b UN Comtrade, 2c your own data', 'Fills Raw_Trade. See the Data_Sources tab for what each option means.'],
      ['3. Compute', 'Menu → "3. Compute scorecard & dashboard"', 'Scores every exporter → importer → product combination and fills the Dashboard.'],
      ['4. Explore', 'Dashboard, Top_Gaps, Country_View, Explain_Score', 'Change weights on Settings — rankings update instantly.'],
    ]],
    ['h', 'Tab map  (tab colours: blue = explanation · green = results · orange = your inputs · grey = data)'],
    ['table', ['Tab', 'Type', 'What it is for'], [
      ['Guide', 'Explanation', 'This page: steps and tab map.'],
      ['About', 'Explanation', 'What the tool is, why it exists, and which questions it answers.'],
      ['Dashboard', 'Results', 'Africa-wide totals, one row per country, charts of intra-African share and gaps by sector.'],
      ['Top_Gaps', 'Results', 'Ranked list of the best trade opportunities. Filter by exporter, importer and sector.'],
      ['Country_View', 'Results', 'Pick one country: top exports and imports, African buyers and suppliers, best opportunities.'],
      ['Explain_Score', 'Results', 'Pick one opportunity and see exactly how its score was built, criterion by criterion.'],
      ['Scorecard', 'Results', 'The full composite index: raw inputs, 7 sub-scores (0–1) and the composite score (0–100).'],
      ['Settings', 'Your inputs', 'Weights of the 7 criteria and other parameters (yellow cells).'],
      ['Methodology', 'Explanation', 'Every formula, step by step, with a worked example.'],
      ['Glossary', 'Explanation', 'Plain-English meaning of every term and abbreviation.'],
      ['Data_Sources', 'Explanation', 'Where the numbers come from, the data format, and known gaps.'],
      ['FAQ', 'Explanation', 'Common questions and answers.'],
      ['Countries', 'Your inputs', '54 countries with region, capital location, customs unions, RECs and AfCFTA status. Editable.'],
      ['Products', 'Your inputs', '96 HS 2-digit product groups with sector. Untick "Include" to leave a product out.'],
      ['Raw_Trade', 'Data', 'The trade figures everything is calculated from.'],
    ]],
    ['h', 'Before you share results'],
    ['p', '• Check the data status line on the Dashboard. If it says SAMPLE DATA, the numbers are synthetic and must not be quoted.'],
    ['p', '• Read "Know the limits" on the Methodology tab. Results are leads to investigate, not conclusions.'],
  ]);
}

function buildAbout_(ss) {
  writeDocPage_(ss, APP.sheets.about, [
    ['title', 'About this tool'],
    ['sub', 'A composite index (also called a scorecard or multi-criteria decision tool) for intra-African trade.'],
    ['gap'],
    ['h', 'The problem'],
    ['p', 'African countries trade far more with the rest of the world than with each other. Commonly cited estimates (UNCTAD, Afreximbank)'],
    ['p', 'put intra-African trade at around 15% of the continent\'s total trade, compared with well over half within Europe or Asia.'],
    ['p', 'Yet the same product is often exported by one African country and imported by another — from outside Africa.'],
    ['p', 'The African Continental Free Trade Area (AfCFTA) is lowering tariffs between members, so these gaps are becoming easier to close.'],
    ['gap'],
    ['h', 'What this tool does'],
    ['table', ['Part', 'What it gives you'], [
      ['1. Trade picture', 'Imports and exports of each of the 54 African countries — by product (HS 2-digit) and by African partner. See Dashboard and Country_View.'],
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
    ['h', 'How it works — in one line'],
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
    ['sub', 'Exactly how every number in the Scorecard is calculated.'],
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
      ['Market access', 'Same customs union → P_ACC_CU (1.0). Else same REC/FTA → 0.8. Else both AfCFTA → 0.6. Else 0.3', 'Shared trade agreements mean lower tariffs and simpler customs.'],
      ['Proximity', '1 − (distance − min) / (max − min), using great-circle distance between capitals. × 0.85 if either country is landlocked', 'Shorter, cheaper transport. Landlocked countries face extra transit costs.'],
      ['Demand growth', 'g = (D this year − D last year) / D last year, capped to −50%…+100%, scaled as (g + 0.5) / 1.5. Unknown → 0.5', 'A growing market is easier to enter.'],
      ['Competitiveness (RCA)', 'RCA = (S / A\'s total exports) ÷ (Africa\'s exports of p / Africa\'s total exports). Scaled as RCA / (1 + RCA)', 'RCA > 1 means A is relatively specialised in p — likely competitive. Scaled score > 0.5.'],
    ]],
    ['p', 'Why a log scale? Trade values range from thousands to billions of dollars. Without logs, a few giant flows (oil, gold) would squash every other score to near zero.'],
    ['p', 'Min-max scaling means scores are RELATIVE: 1.0 = the highest value among the opportunities in this Scorecard, 0 = the lowest.'],
    ['gap'],
    ['h', 'Step 3 — Combine into the composite score'],
    ['p', 'Composite = (w1·s1 + w2·s2 + … + w7·s7) ÷ (w1 + w2 + … + w7) × 100'],
    ['p', 'The weights w come from Settings. They are relative — they do not need to add up to 100. A weight of 0 switches a criterion off.'],
    ['p', 'The composite is a live sheet formula, so changing a weight re-ranks Scorecard, Top_Gaps and Explain_Score instantly — no need to re-run step 3.'],
    ['gap'],
    ['h', 'Worked example (illustrative numbers)'],
    ['table', ['Criterion', 'Sub-score', 'Default weight', 'Contribution'], [
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
    ['p', '• HS 2-digit is broad: "Cereals" can be wheat on one side and maize on the other. Drill down before acting.'],
    ['p', '• Capitals are a rough proxy for where goods travel; real routes, ports and corridors differ.'],
    ['p', '• Access tiers are simplified: they ignore product-specific tariffs, rules of origin, sensitive-product lists and non-tariff barriers.'],
    ['p', '• Scores are relative to the opportunities in this Scorecard; they are not comparable across different data loads.'],
  ]);
}

function buildGlossary_(ss) {
  writeDocPage_(ss, APP.sheets.glossary, [
    ['title', 'Glossary'],
    ['sub', 'Plain-English meaning of the terms used in this workbook.'],
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
      ['WLD', 'Partner code meaning "the whole world" (total trade).'],
      ['Flow X / M', 'X = exports by the reporter. M = imports by the reporter.'],
      ['Mirror data', 'Using the partner\'s report to fill in a missing figure, e.g. B\'s imports from A in place of A\'s exports to B.'],
      ['HS code', 'Harmonized System — the world standard product classification. HS2 = 96 chapters (e.g. 09 Coffee, tea, spices). HS4/HS6 are finer.'],
      ['Sector', 'A group of HS chapters used in this tool (e.g. Agri-food = HS 01–24).'],
      ['RCA', 'Revealed Comparative Advantage (Balassa index). Share of a product in a country\'s exports ÷ its share in Africa\'s exports. Above 1 = relatively specialised.'],
      ['Intra-African trade', 'Trade between African countries (not with the rest of the world).'],
      ['Trade balance', 'Exports minus imports. Negative = trade deficit.'],
      ['AfCFTA', 'African Continental Free Trade Area — the agreement creating a single market across African Union members, in force since 2019, trading since 2021.'],
      ['REC', 'Regional Economic Community — the regional blocs recognised by the African Union (e.g. ECOWAS, SADC, EAC, COMESA, ECCAS, AMU).'],
      ['Customs union', 'Members trade freely with each other AND apply a common external tariff. Deeper than a free trade area.'],
      ['FTA', 'Free Trade Area — members remove tariffs between themselves but keep their own tariffs toward others.'],
      ['SACU', 'Southern African Customs Union: Botswana, Eswatini, Lesotho, Namibia, South Africa.'],
      ['EAC', 'East African Community (customs union): Kenya, Uganda, Tanzania, Rwanda, Burundi, South Sudan, DR Congo, Somalia.'],
      ['ECOWAS', 'Economic Community of West African States; applies a common external tariff (CET).'],
      ['WAEMU / UEMOA', 'West African Economic and Monetary Union — customs and currency union (CFA franc) of 8 West African states.'],
      ['CEMAC', 'Economic and Monetary Community of Central Africa — customs and currency union of 6 Central African states.'],
      ['COMESA', 'Common Market for Eastern and Southern Africa — 21 member states with a free trade area.'],
      ['SADC', 'Southern African Development Community — 16 member states with a free trade area.'],
      ['ECCAS', 'Economic Community of Central African States.'],
      ['AMU', 'Arab Maghreb Union: Algeria, Libya, Mauritania, Morocco, Tunisia (largely inactive).'],
      ['ISO3', 'Three-letter country code (e.g. NGA = Nigeria).'],
      ['M49', 'UN numeric country code, used by UN Comtrade (e.g. 566 = Nigeria).'],
      ['UN Comtrade', 'United Nations database of official international trade statistics reported by countries.'],
      ['Landlocked', 'A country without a sea coast; its goods must transit through a neighbour\'s port.'],
      ['Informal cross-border trade', 'Trade that bypasses official customs recording, common across African land borders.'],
      ['Sensitivity analysis', 'Changing the weights to see whether the top opportunities stay on top. Robust results survive reasonable weight changes.'],
    ]],
  ], [24, 230, 820, 120, 120]);
}

function buildDataSources_(ss) {
  writeDocPage_(ss, APP.sheets.sources, [
    ['title', 'Data sources'],
    ['sub', 'Where the numbers come from and how to load your own.'],
    ['gap'],
    ['h', 'Three ways to load data (menu step 2)'],
    ['table', ['Option', 'What it is', 'When to use it'], [
      ['2a SAMPLE', 'Synthetic numbers generated by the script with a realistic shape (oil exporters export oil, etc.). NOT real statistics.', 'To learn the tool and test it. Never quote these numbers.'],
      ['2b UN Comtrade', 'Official statistics downloaded through the UN Comtrade API: each country\'s trade with the world and with every African partner, HS 2-digit, analysis year and the year before.', 'For real analysis. Needs a free API key (see below).'],
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
    ['p', '(Example rows only — illustrative values.) Needed: world rows (WLD) for both X and M, for the analysis year AND the year before;'],
    ['p', 'plus bilateral rows between African countries for the analysis year. Values in US dollars.'],
    ['gap'],
    ['h', 'Other good sources'],
    ['table', ['Source', 'What it offers'], [
      ['WITS (World Bank)', 'wits.worldbank.org — Comtrade data with an easier download interface, plus tariff data.'],
      ['ITC Trade Map', 'trademap.org — detailed trade flows, mirror data, and export-potential indicators.'],
      ['CEPII BACI', 'cepii.fr — Comtrade data reconciled between reporters and partners; good for countries that report poorly.'],
      ['AfCFTA Secretariat', 'au-afcfta.org — membership, ratification status and tariff schedules.'],
      ['UNCTADstat', 'unctadstat.unctad.org — trade aggregates and indicators for checking totals.'],
    ]],
    ['h', 'Known data gaps'],
    ['p', '• Several African countries report late (2+ years) or not at all. After 2b, the data status lists countries with no data.'],
    ['p', '• When a country does not report, its trade with African partners can still appear through the partner\'s report (mirror data).'],
    ['p', '• Re-exports and informal trade are not captured.'],
  ], [24, 170, 420, 300, 120, 120, 150]);
}

function buildFaq_(ss) {
  writeDocPage_(ss, APP.sheets.faq, [
    ['title', 'FAQ'],
    ['gap'],
    ['table', ['Question', 'Answer'], [
      ['Is the data real?', 'Only if the Dashboard data status says UN Comtrade or Own data. SAMPLE DATA is synthetic and for testing only.'],
      ['I changed a weight — do I need to re-run anything?', 'No. The composite score is a live formula. Scorecard, Top_Gaps, Explain_Score and the "Best score" column update instantly.'],
      ['When DO I need to re-run step 3?', 'After changing data (Raw_Trade), Countries, Products, the year, minimum gap, row limit, access scores or the landlocked multiplier.'],
      ['Why is a combination missing from the Scorecard?', 'One side does not trade the product, the gap is below the minimum, it did not fit under the row limit, or the product is unticked on Products.'],
      ['Why does a country show zero trade?', 'It has not reported data for that year. Try an earlier analysis year on Settings, or paste data from another source.'],
      ['What does a score of 70 mean?', 'It is a weighted average of 7 relative sub-scores. 70 is strong compared with the other opportunities in this workbook — not an absolute probability.'],
      ['Which weights should I use?', 'Start with the defaults. Then match your goal: more Proximity/Access for quick wins, more Gap/Demand for big prizes, more Growth for future markets.'],
      ['How do I check if a result is robust?', 'Change the weights a little (sensitivity analysis). Opportunities that stay near the top are robust.'],
      ['Can I add more countries or criteria?', 'Countries: add rows on the Countries tab (ISO3, M49, coordinates). New criteria need a small code change.'],
      ['Can I use HS 4-digit products?', 'Yes with code changes: the Products list and the Comtrade query (cmdCode AG4) must be extended. Expect ~12× more data.'],
      ['The Comtrade fetch stopped — what now?', 'Check the data status on Settings for the error. Use "Stop a running Comtrade fetch" and start 2b again if needed.'],
      ['Can I share this workbook?', 'Yes — share the Google Sheet. Others need edit access and must authorise the script to run the menu.'],
    ]],
  ], [24, 320, 800, 120, 120]);
}

function buildExplainScore_(ss) {
  const sh = resetSheet_(ss, APP.sheets.explain);
  const names = COUNTRIES.map(c => c[2]).sort();
  sh.getRange('A1').setValue('Explain a score — how one opportunity was rated')
    .setFontSize(16).setFontWeight('bold').setFontColor(APP.color.title);
  sh.getRange('A2').setValue('Pick an exporter, importer and product (tip: copy them from Top_Gaps). Step 3 pre-selects the current #1.')
    .setFontStyle('italic');

  sh.getRange('A4:B6').setValues([['Exporter (seller)', 'Morocco'], ['Importer (buyer)', 'Algeria'], ['Product', 'Vehicles']]);
  sh.getRange('A4:A7').setFontWeight('bold');
  sh.getRange('B4:B6').setBackground(APP.color.input).setFontWeight('bold');
  dropdown_(sh.getRange('B4'), names);
  dropdown_(sh.getRange('B5'), names);
  dropdown_(sh.getRange('B6'), HS2.map(h => h[1]));
  sh.getRange('A7').setValue('Row in Scorecard');
  sh.getRange('B7').setFormula('=IFERROR(MATCH(1,INDEX((Scorecard!$B$2:$B=$B$4)*(Scorecard!$D$2:$D=$B$5)*(Scorecard!$F$2:$F=$B$6),0),0),"")');
  sh.getRange('C7').setFormula('=IF($B$7="","✗ Not in the Scorecard: one side does not trade this product, the gap is below the minimum, or it did not fit under the row limit.","✓ Found")');

  const at = col => `INDEX(Scorecard!${col}2:${col},$B$7)`;
  const money = col => `TEXT(${at(col)},"$#,##0")`;
  sh.getRange('A9').setFormula(`=IF($B$7="","",$B$5&" buys "&${money('H')}&" of "&LOWER($B$6)&" a year from the world. "&` +
    `$B$4&" sells "&${money('I')}&" of it to the world, but only "&${money('J')}&" to "&$B$5&".")`);
  sh.getRange('A10').setFormula(`=IF($B$7="","","Untapped gap: "&${money('K')}&"   ·   Distance: "&TEXT(${at('L')},"#,##0")&" km   ·   Market access: "&${at('M')})`);
  sh.getRange('A11').setFormula(`=IF($B$7="","","Composite score: "&TEXT(${at('U')},"0.0")&" / 100   ·   Rank "&RANK(${at('U')},Scorecard!U2:U)&" of "&COUNT(Scorecard!U2:U))`);
  sh.getRange('A9:A11').setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);
  sh.getRange('A11').setFontWeight('bold').setFontSize(12).setFontColor(APP.color.title);

  const top = 13;
  header_(sh.getRange(top, 1, 1, 8), ['Criterion', 'Raw value', 'Sub-score (0–1)', 'Weight',
    'Share of weight', 'Points added', 'Contribution', 'How to read the sub-score']);
  const raw = [['H', '$#,##0'], ['I', '$#,##0'], ['K', '$#,##0'], ['M', '@'], ['L', '#,##0" km"'],
    ['V', '0.0%'], ['W', '0.00']];
  const reading = [
    '1 = the largest import market among all opportunities, 0 = the smallest.',
    '1 = the largest exporter of a product among all opportunities, 0 = the smallest.',
    '1 = the largest untapped gap among all opportunities, 0 = the smallest.',
    'Customs union / REC / AfCFTA / other — scores set on Settings.',
    '1 = the closest pair of capitals, 0 = the furthest; reduced if landlocked.',
    'Raw value = import growth vs. previous year. 0.33 = no growth; blank raw value = unknown (0.5).',
    'Raw value = RCA. Above 1 (sub-score > 0.5) = the exporter is specialised in this product.',
  ];
  const subCols = ['N', 'O', 'P', 'Q', 'R', 'S', 'T'];
  const wRange = `Settings!$B$${SETTINGS_WEIGHT_ROW}:$B$${SETTINGS_WEIGHT_ROW + CRITERIA.length - 1}`;
  CRITERIA.forEach((c, i) => {
    const r = top + 1 + i;
    sh.getRange(r, 1, 1, 8).setValues([[
      `=Settings!A${SETTINGS_WEIGHT_ROW + i}`,
      `=IF($B$7="","",${at(raw[i][0])})`,
      `=IF($B$7="","",${at(subCols[i])})`,
      `=Settings!B${SETTINGS_WEIGHT_ROW + i}`,
      `=IFERROR(D${r}/SUM(${wRange}),0)`,
      `=IF($B$7="","",C${r}*E${r}*100)`,
      `=IF($B$7="","",SPARKLINE(F${r},{"charttype","bar";"max",MAX($F$${top + 1}:$F$${top + 7});"color1","#1f4e3d"}))`,
      reading[i],
    ]]);
    sh.getRange(r, 2).setNumberFormat(raw[i][1]);
  });
  const tot = top + 1 + CRITERIA.length;
  sh.getRange(tot, 1, 1, 8).setValues([['Composite score', '', '', `=SUM(D${top + 1}:D${tot - 1})`,
    `=SUM(E${top + 1}:E${tot - 1})`, `=IF($B$7="","",SUM(F${top + 1}:F${tot - 1}))`, '',
    'Sum of points = composite score (same as the Scorecard, up to rounding).']]).setFontWeight('bold');
  sh.getRange(top + 1, 3, CRITERIA.length, 1).setNumberFormat('0.000');
  sh.getRange(top + 1, 5, CRITERIA.length + 1, 1).setNumberFormat('0.0%');
  sh.getRange(top + 1, 6, CRITERIA.length + 1, 1).setNumberFormat('0.0');
  for (let i = 0; i < CRITERIA.length; i += 2) sh.getRange(top + 1 + i, 1, 1, 8).setBackground(APP.color.band);

  const f = top + CRITERIA.length + 3;
  const rows = `A${top + 1}:A${tot - 1}`, subs = `C${top + 1}:C${tot - 1}`;
  sh.getRange(f, 1).setFormula(`=IF($B$7="","","Strongest factor: "&INDEX(${rows},MATCH(MAX(${subs}),${subs},0))&"   ·   Weakest factor: "&INDEX(${rows},MATCH(MIN(${subs}),${subs},0)))`);
  sh.getRange(f + 1, 1).setValue('Try it: change a weight on Settings and watch the points, composite score and rank change here.')
    .setFontStyle('italic');
  sh.getRange(f, 1, 2, 1).setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);

  sh.setColumnWidth(1, 200); sh.setColumnWidth(2, 170); sh.setColumnWidth(3, 120); sh.setColumnWidth(4, 70);
  sh.setColumnWidth(5, 110); sh.setColumnWidth(6, 100); sh.setColumnWidth(7, 160); sh.setColumnWidth(8, 560);
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
  sheet_(APP.sheets.explain).getRange('B4:B6').setValues([[best[1]], [best[3]], [best[5]]]);
}

function colourTabs_(ss) {
  const s = APP.sheets;
  const groups = [
    ['#4a86e8', [s.guide, s.about, s.method, s.glossary, s.sources, s.faq]],
    ['#1f4e3d', [s.dashboard, s.top, s.country, s.explain, s.score]],
    ['#e8a33d', [s.settings, s.countries, s.products]],
    ['#999999', [s.raw]],
  ];
  groups.forEach(([colour, names]) => names.forEach(n => {
    const sh = ss.getSheetByName(n);
    if (sh) sh.setTabColor(colour);
  }));
}

// ------------------------------------------------------------------
// Data: sample
// ------------------------------------------------------------------

function loadSampleData_() {
  const year = Number(getParam_('P_YEAR'));
  const rows = generateSampleRows_(readCountries_(), year);
  writeRaw_(rows, true);
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
  const key = String(getParam_('P_API_KEY') || '').trim();
  if (!key) {
    alert_('Add your free UN Comtrade API key on the Settings tab first.\n\n' +
      '1. Sign up at comtradedeveloper.un.org\n2. Products → subscribe to "comtrade - v1" (free)\n' +
      '3. Profile → copy the primary key into Settings → "UN Comtrade API key".');
    return;
  }
  const year = Number(getParam_('P_YEAR'));
  if (!confirm_(`Fetch ${year - 1}–${year} trade data for all 54 African countries from UN Comtrade?\n\n` +
      'This replaces Raw_Trade. It runs in chunks in the background (about 5–15 minutes); ' +
      'the Dashboard updates automatically when it finishes.')) return;

  deleteFetchTriggers_();
  const props = PropertiesService.getDocumentProperties();
  props.setProperty(APP.fetchProp, '0');
  props.setProperty(APP.missingProp, '');
  clearSheetBody_(sheet_(APP.sheets.raw));
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
  if (raw.getLastRow() < 2) {
    notify_('Raw_Trade is empty — load data first (menu step 2a, 2b or 2c).', true);
    return;
  }
  const rawRows = raw.getRange(2, 1, raw.getLastRow() - 1, 6).getValues();
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
  writeDashboard_(result.summary, params);
  selectTopForExplain_(result.rows);
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

  return {
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
  clearSheetBody_(sh);
  if (!rows.length) return;
  ensureRows_(sh, rows.length + 1);
  sh.getRange(2, 1, rows.length, 20).setValues(rows.map(r => r.slice(0, 20)));
  sh.getRange(2, 22, rows.length, 2).setValues(rows.map(r => r.slice(20, 22)));
  const w = r => `Settings!$B$${SETTINGS_WEIGHT_ROW + r}`;
  const cols = ['N', 'O', 'P', 'Q', 'R', 'S', 'T'];
  const weighted = cols.map((col, i) => `${col}2:${col}*${w(i)}`).join('+');
  const wRange = `Settings!$B$${SETTINGS_WEIGHT_ROW}:$B$${SETTINGS_WEIGHT_ROW + CRITERIA.length - 1}`;
  sh.getRange('U2').setFormula(
    `=ARRAYFORMULA(IF(A2:A="",,ROUND((${weighted})/MAX(SUM(${wRange}),0.0001)*100,1)))`);
}

function writeDashboard_(s, params) {
  const ss = SpreadsheetApp.getActive();
  const sh = sheet_(APP.sheets.dashboard);
  sh.getCharts().forEach(c => sh.removeChart(c));
  sh.getRange(4, 1, Math.max(sh.getMaxRows() - 3, 1), sh.getMaxColumns()).clear();

  // KPI tiles.
  const kpiLabels = ['African exports to the world', 'African imports from the world',
    'Intra-African exports', 'Intra-African share of exports', 'Opportunities in Scorecard',
    'Sum of pair gaps (overlapping)'];
  const k = s.kpis;
  const kpiValues = [k.totExp, k.totImp, k.totIntra, k.intraShare, k.opps, k.totGap];
  const tileCols = [1, 3, 5, 7, 9, 11];
  tileCols.forEach((col, i) => {
    sh.getRange(4, col, 1, 2).merge().setValue(kpiLabels[i]).setFontSize(9)
      .setFontColor('#555555').setHorizontalAlignment('center');
    const v = sh.getRange(5, col, 1, 2).merge().setValue(kpiValues[i]).setFontSize(16)
      .setFontWeight('bold').setHorizontalAlignment('center').setBackground(APP.color.band);
    v.setNumberFormat(i === 3 ? '0.0%' : i === 4 ? '#,##0' : '[>=1000000000]$#,##0.0,,,"B";[>=1000000]$#,##0.0,,"M";$#,##0');
  });

  // Country table.
  const head = ['ISO3', 'Country', 'Region', 'Exports to world', 'Imports from world', 'Balance',
    'Exports to Africa', 'Africa share of exports', 'Imports from Africa (partner-reported)',
    'Top export', 'Top import', 'Opportunities as supplier', 'Best score'];
  sh.getRange(7, 1).setValue('Country overview (sorted by exports)').setFontWeight('bold')
    .setFontColor(APP.color.title);
  header_(sh.getRange(8, 1, 1, head.length), head);
  sh.getRange(8, 1, 1, head.length).setWrap(true);
  const body = s.table.map((r, i) => [r.iso, r.name, r.region, r.exp, r.imp, r.bal, r.intraExp,
    r.intraShare, r.intraImp, r.topX, r.topM, r.opps,
    `=IFERROR(MAXIFS(Scorecard!U:U,Scorecard!A:A,A${9 + i}),"")`]);
  ensureRows_(sh, 9 + body.length + 5);
  sh.getRange(9, 1, body.length, head.length).setValues(body);
  sh.getRange(9, 4, body.length, 4).setNumberFormat('#,##0');
  sh.getRange(9, 8, body.length, 1).setNumberFormat('0.0%');
  sh.getRange(9, 9, body.length, 1).setNumberFormat('#,##0');
  sh.getRange(9, 13, body.length, 1).setNumberFormat('0.0');
  for (let i = 0; i < body.length; i += 2) sh.getRange(9 + i, 1, 1, head.length).setBackground(APP.color.band);

  // Sector table.
  const sc = 15; // column O
  sh.getRange(7, sc).setValue('Untapped gap by sector').setFontWeight('bold').setFontColor(APP.color.title);
  header_(sh.getRange(8, sc, 1, 3), ['Sector', 'Untapped gap (USD)', 'Opportunities']);
  if (s.sectors.length) {
    sh.getRange(9, sc, s.sectors.length, 3).setValues(s.sectors);
    sh.getRange(9, sc + 1, s.sectors.length, 2).setNumberFormat('#,##0');
  }

  // Charts.
  if (s.sectors.length) {
    sh.insertChart(sh.newChart().setChartType(Charts.ChartType.BAR)
      .addRange(sh.getRange(8, sc, s.sectors.length + 1, 2))
      .setNumHeaders(1)
      .setOption('title', 'Untapped intra-African trade gap by sector (USD)')
      .setOption('legend', { position: 'none' })
      .setOption('colors', ['#1f4e3d'])
      .setPosition(8, sc + 4, 0, 0).setOption('width', 620).setOption('height', 380)
      .build());
  }
  const byShare = s.table.filter(r => r.exp > 0).length;
  if (byShare) {
    sh.insertChart(sh.newChart().setChartType(Charts.ChartType.COLUMN)
      .addRange(sh.getRange(8, 2, s.table.length + 1, 1))
      .addRange(sh.getRange(8, 8, s.table.length + 1, 1))
      .setNumHeaders(1)
      .setOption('title', 'Share of each country\'s exports that go to other African countries')
      .setOption('legend', { position: 'none' })
      .setOption('colors', ['#e8a33d'])
      .setOption('vAxis', { format: 'percent' })
      .setOption('hAxis', { slantedText: true, slantedTextAngle: 60, textStyle: { fontSize: 9 } })
      .setPosition(29, sc + 4, 0, 0).setOption('width', 900).setOption('height', 420)
      .build());
  }

  sh.setFrozenRows(0);
  sh.setColumnWidth(2, 170); sh.setColumnWidth(10, 170); sh.setColumnWidth(11, 170);
  sh.setColumnWidth(sc, 190); sh.setColumnWidth(sc + 1, 150);
  sh.setRowHeight(8, 48);
  ss.setActiveSheet(sh);
}

// ------------------------------------------------------------------
// Readers & helpers
// ------------------------------------------------------------------

function readCountries_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(APP.sheets.countries);
  const values = sh ? sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 10).getValues() : COUNTRIES;
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
  return sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues()
    .filter(r => Number(r[0]) > 0)
    .map(r => ({ hs: Number(r[0]), name: String(r[1]), sector: String(r[2]), include: r[3] === true }));
}

function writeRaw_(rows, replace) {
  const sh = sheet_(APP.sheets.raw);
  if (replace) clearSheetBody_(sh);
  if (!rows.length) return;
  const start = sh.getLastRow() + 1;
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
  if (!sh) throw new Error(`Tab "${name}" is missing — run "1. Build / rebuild workbook".`);
  return sh;
}

function requireBuilt_() {
  if (!SpreadsheetApp.getActive().getSheetByName(APP.sheets.settings)) buildWorkbook_();
}

function resetSheet_(ss, name) {
  const sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.clear();
  sh.clearConditionalFormatRules();
  sh.getCharts().forEach(c => sh.removeChart(c));
  sh.getDataRange().clearDataValidations();
  sh.setFrozenRows(0);
  sh.setFrozenColumns(0);
  return sh;
}

function clearSheetBody_(sh) {
  if (sh.getMaxRows() > 1) sh.getRange(2, 1, sh.getMaxRows() - 1, sh.getMaxColumns()).clearContent();
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
