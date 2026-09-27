/**
 * African Talent Destination Index
 * ---------------------------------
 * One-file Google Apps Script that turns an empty Google Sheet into a tool
 * that scores European countries as destinations for African professionals.
 *
 * Install:
 *   1. Create a new Google Sheet.
 *   2. Extensions > Apps Script. Delete everything in Code.gs, paste this file, Save.
 *   3. Reload the Sheet. A menu "Destination Index" appears.
 *   4. Destination Index > Build / repair the sheet  (approve permissions once).
 *   5. Destination Index > Open control panel  -> buttons for everything.
 *
 * You can add your own indicators, countries and source links (Eurostat links
 * or any CSV link) from the control panel or directly in the tabs.
 *
 * All formulas are written with English function names; they work in any
 * Google Sheets locale (setFormula always uses en-US syntax).
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

var APP_NAME = 'Destination Index';

var SHEETS = {
  GUIDE: 'Guide',
  DASHBOARD: 'Dashboard',
  DATA: 'Data',
  EVIDENCE: 'Evidence',
  WEIGHTS: 'Weights',
  SCORES: 'Scores',
  INDICATORS: 'Indicators',
  SOURCES: 'Sources',
  RUBRICS: 'Rubrics',
  LOG: 'Log'
};
var SHEET_ORDER = ['GUIDE', 'DASHBOARD', 'DATA', 'EVIDENCE', 'WEIGHTS', 'SCORES',
                   'INDICATORS', 'SOURCES', 'RUBRICS', 'LOG'];

// Country name + Eurostat geo code (Eurostat uses EL for Greece).
var DEFAULT_COUNTRIES = [
  ['Germany', 'DE'], ['Netherlands', 'NL'], ['France', 'FR'], ['Belgium', 'BE'],
  ['Ireland', 'IE'], ['Sweden', 'SE'], ['Spain', 'ES']
];

var PILLARS = ['Access', 'Fairness', 'Reward', 'Settlement'];
var DEFAULT_WEIGHTS = [30, 30, 25, 15];
var DIR_HIGHER = 'Higher is better', DIR_LOWER = 'Lower is better';

var EU_PORTAL = 'https://immigration-portal.ec.europa.eu/';
function dbLink_(code) { return 'https://ec.europa.eu/eurostat/databrowser/view/' + code + '/default/table'; }

// Starting indicators. After the first build, the Indicators TAB is the source
// of truth: edit it, or add rows with the control panel.
// code, pillar, name, direction, unit, how to get it, source, link
var DEFAULT_INDICATORS = [
  ['A1', 'Access', 'Shortage-occupation / Blue Card pathway for your profession', DIR_HIGHER, 'rating 0-10',
   'Manual - use Rubrics tab', 'EU Immigration Portal + national shortage lists', EU_PORTAL],
  ['A2', 'Access', 'EU Blue Card minimum gross salary', DIR_LOWER, 'EUR per year',
   'Manual', 'EU Immigration Portal (Blue Card page per country)', EU_PORTAL],
  ['A3', 'Access', 'Ease of recognising an African degree', DIR_HIGHER, 'rating 0-10',
   'Manual - use Rubrics tab', 'ENIC-NARIC national recognition centres', 'https://www.enic-naric.net/'],
  ['F1', 'Fairness', 'Over-qualification gap: non-EU minus nationals, tertiary graduates', DIR_LOWER, 'percentage points',
   'Auto (Sources tab) or manual', 'Eurostat over-qualification rates (migrant integration)', 'https://ec.europa.eu/eurostat/web/migrant-integration/database'],
  ['F2', 'Fairness', 'Employment-rate gap: native-born minus non-EU-born, tertiary graduates', DIR_LOWER, 'percentage points',
   'Auto (Sources tab) or manual', 'Eurostat lfsa_ergaedcob', dbLink_('lfsa_ergaedcob')],
  ['F3', 'Fairness', 'Hiring discrimination ratio: native callbacks / African-origin callbacks (1.0 = fair)', DIR_LOWER, 'ratio',
   'Manual - from published CV field experiments', 'Field-experiment studies (e.g. GEMM project, national testing studies)', 'https://gemm2020.eu/'],
  ['R1', 'Reward', 'Median equivalised net income, purchasing-power adjusted', DIR_HIGHER, 'PPS per year',
   'Auto (Sources tab) or manual', 'Eurostat ilc_di03', dbLink_('ilc_di03')],
  ['R2', 'Reward', 'Typical gross salary in YOUR profession (optional)', DIR_HIGHER, 'EUR per year',
   'Manual', 'National salary surveys / statistics offices', ''],
  ['R3', 'Reward', 'Price level index (EU27 = 100)', DIR_LOWER, 'index',
   'Auto (Sources tab) or manual', 'Eurostat prc_ppp_ind', dbLink_('prc_ppp_ind')],
  ['S1', 'Settlement', 'Years to permanent residence (skilled-worker route)', DIR_LOWER, 'years',
   'Manual', 'National immigration authority', EU_PORTAL],
  ['S2', 'Settlement', 'Years to citizenship (standard route)', DIR_LOWER, 'years',
   'Manual', 'National citizenship law / authority', ''],
  ['S3', 'Settlement', 'Working-language accessibility (10 = English widely usable at work)', DIR_HIGHER, 'rating 0-10',
   'Manual - use Rubrics tab', 'Job-board sample (see Rubrics)', ''],
  ['S4', 'Settlement', 'African-born population', DIR_HIGHER, 'thousands',
   'Manual', 'UN DESA International Migrant Stock', 'https://www.un.org/development/desa/pd/content/international-migrant-stock']
];

// Sources tab columns
var SRC = { IND: 1, TYPE: 2, LINK: 3, FILTER_A: 4, FILTER_B: 5, SINCE: 6,
            CSV_COUNTRY: 7, CSV_VALUE: 8, CSV_YEAR: 9, ENABLED: 10, NOTE: 11, STATUS: 12 };
var SRC_HEAD = ['Indicator', 'Type', 'Link or dataset code', 'Filters A', 'Filters B (optional: value = A - B)',
                'Since year', 'CSV: country column', 'CSV: value column', 'CSV: year column (optional)',
                'Enabled', 'Note', 'Last status'];
var SOURCE_TYPES = ['Eurostat', 'CSV link'];

// Starting sources (editable in the Sources tab).
var DEFAULT_SOURCES = [
  ['F1', 'Eurostat', dbLink_('lfsa_eoqgan'), 'sex=T&age=Y20-64&citizen=NEU27_2020_FOR', 'sex=T&age=Y20-64&citizen=NAT',
   2018, '', '', '', true, 'By citizenship (proxy for country of birth). Verify codes in the Eurostat data browser.'],
  ['F2', 'Eurostat', dbLink_('lfsa_ergaedcob'), 'sex=T&age=Y25-64&isced11=ED5-8&c_birth=NAT',
   'sex=T&age=Y25-64&isced11=ED5-8&c_birth=NEU27_2020_FOR', 2018, '', '', '', true,
   'Native-born minus non-EU-born employment rate, tertiary educated.'],
  ['R1', 'Eurostat', dbLink_('ilc_di03'), 'age=TOTAL&sex=T&indic_il=MED_E&unit=PPS', '', 2018, '', '', '', true,
   'Median equivalised net income in PPS.'],
  ['R3', 'Eurostat', dbLink_('prc_ppp_ind'), 'na_item=PLI_EU27_2020&ppp_cat=GDP', '', 2018, '', '', '', true,
   'Price level index for GDP, EU27 = 100.']
];

var EUROSTAT_API = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/';

// Layout of the Data tab
var DATA_FIRST_ROW = 4;   // first country row
var DATA_FIRST_COL = 3;   // column C = first indicator (A = country, B = Eurostat code)

var COLORS = {
  header: '#1F4E78', headerText: '#FFFFFF', input: '#FFF2CC', calc: '#E2EFDA',
  good: '#C6EFCE', mid: '#FFEB9C', bad: '#FFC7CE', grey: '#D9D9D9', title: '#1F4E78'
};

// ============================================================================
// MENU + CONTROL PANEL
// ============================================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(APP_NAME)
    .addItem('Open control panel (buttons)', 'showControlPanel')
    .addSeparator()
    .addItem('Build / repair the sheet', 'setupIndex')
    .addItem('Fetch data from all sources', 'fetchAllSources')
    .addItem('Refresh scores & dashboard', 'rebuildFormulas')
    .addSeparator()
    .addItem('Add a source link', 'menuAddSource')
    .addItem('Add an indicator', 'menuAddIndicator')
    .addItem('Add a country', 'menuAddCountry')
    .addSeparator()
    .addItem('Go to Guide', 'goGuide')
    .addItem('Go to Dashboard', 'goDashboard')
    .addItem('Go to Data', 'goData')
    .addItem('Go to Sources', 'goSources')
    .addSeparator()
    .addItem('Reset everything (deletes your data)', 'resetEverything')
    .addToUi();
}

function goGuide() { goTo_(SHEETS.GUIDE); }
function goDashboard() { goTo_(SHEETS.DASHBOARD); }
function goData() { goTo_(SHEETS.DATA); }
function goSources() { goTo_(SHEETS.SOURCES); }
function goTo_(name) {
  var ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName(name);
  if (!sh) { setupIndex(); sh = ss.getSheetByName(name); }
  ss.setActiveSheet(sh);
}

function menuAddSource() { showControlPanel('source'); }
function menuAddIndicator() { showControlPanel('indicator'); }
function menuAddCountry() { showControlPanel('country'); }

function showControlPanel(section) {
  var html = HtmlService.createHtmlOutput(controlPanelHtml_(section || ''))
    .setTitle(APP_NAME + ' - Control panel');
  SpreadsheetApp.getUi().showSidebar(html);
}

/** Data for the control panel dropdowns. */
function getPanelData() {
  ensureSetup_();
  return {
    indicators: getIndicators_().map(function (x) { return { code: x.code, name: x.name }; }),
    pillars: PILLARS,
    types: SOURCE_TYPES
  };
}

function controlPanelHtml_(section) {
  return '<!DOCTYPE html><html><head><base target="_top"><style>' +
  'body{font-family:Arial,sans-serif;font-size:13px;margin:10px;color:#222}' +
  'h3{margin:14px 0 6px;color:#1F4E78;font-size:14px}' +
  '.btn{display:block;width:100%;margin:4px 0;padding:8px;border:0;border-radius:4px;background:#1F4E78;color:#fff;font-size:13px;cursor:pointer;text-align:left}' +
  '.btn.sec{background:#e8eef5;color:#1F4E78}.btn.warn{background:#fbe3e3;color:#9c1c1c}' +
  '.btn:disabled{opacity:.5}' +
  'details{border:1px solid #d6dde6;border-radius:4px;margin:6px 0;padding:6px 8px}' +
  'summary{font-weight:bold;color:#1F4E78;cursor:pointer}' +
  'label{display:block;margin-top:6px;font-size:12px;color:#444}' +
  'input,select{width:100%;box-sizing:border-box;padding:5px;margin-top:2px;font-size:12px}' +
  '.hint{font-size:11px;color:#666;margin-top:2px}' +
  '#msg{margin-top:10px;padding:8px;border-radius:4px;background:#f3f3f3;min-height:18px;white-space:pre-wrap}' +
  '.csv{display:none}' +
  '</style></head><body>' +

  '<h3>Actions</h3>' +
  '<button class="btn" onclick="run(\'setupIndex\')">Build / repair the sheet</button>' +
  '<button class="btn" onclick="run(\'fetchAllSources\')">Fetch data from all sources</button>' +
  '<button class="btn" onclick="run(\'rebuildFormulas\')">Refresh scores &amp; dashboard</button>' +
  '<button class="btn sec" onclick="run(\'goDashboard\')">Go to Dashboard</button>' +
  '<button class="btn sec" onclick="run(\'goData\')">Go to Data</button>' +
  '<button class="btn sec" onclick="run(\'goSources\')">Go to Sources</button>' +
  '<button class="btn sec" onclick="run(\'goGuide\')">Go to Guide</button>' +

  '<h3>Add your own</h3>' +

  '<details id="d-source"><summary>Add a source link</summary>' +
  '<label>Indicator</label><select id="s_ind"></select>' +
  '<label>Type</label><select id="s_type" onchange="toggleCsv()"></select>' +
  '<label>Link or dataset code</label><input id="s_link" placeholder="https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/...">' +
  '<div class="hint">Eurostat: paste a data-browser link, an API link or just the code (e.g. ilc_di03).<br>CSV: any link that downloads a CSV (e.g. Google Sheet "Publish to web" as CSV).</div>' +
  '<div class="eu"><label>Filters A</label><input id="s_fa" placeholder="unit=PPS&amp;sex=T">' +
  '<label>Filters B (optional, value = A - B)</label><input id="s_fb" placeholder="">' +
  '<label>Since year</label><input id="s_since" value="2018"></div>' +
  '<div class="csv"><label>CSV: country column header</label><input id="s_cc" placeholder="geo or Country">' +
  '<label>CSV: value column header</label><input id="s_vc" placeholder="OBS_VALUE or Value">' +
  '<label>CSV: year column header (optional)</label><input id="s_yc" placeholder="TIME_PERIOD or Year"></div>' +
  '<label>Note</label><input id="s_note">' +
  '<label><input type="checkbox" id="s_fetch" checked style="width:auto"> Fetch it now</label>' +
  '<button class="btn" onclick="addSource()">Save source</button></details>' +

  '<details id="d-indicator"><summary>Add an indicator</summary>' +
  '<label>Code (short, unique)</label><input id="i_code" placeholder="F4">' +
  '<label>Pillar</label><select id="i_pillar"></select>' +
  '<label>Name</label><input id="i_name" placeholder="What it measures">' +
  '<label>Direction</label><select id="i_dir"><option>' + DIR_HIGHER + '</option><option>' + DIR_LOWER + '</option></select>' +
  '<label>Unit</label><input id="i_unit" placeholder="%, EUR, years, rating 0-10 ...">' +
  '<label>Source name</label><input id="i_src">' +
  '<label>Source link</label><input id="i_link" placeholder="https://...">' +
  '<button class="btn" onclick="addIndicator()">Save indicator</button></details>' +

  '<details id="d-country"><summary>Add a country</summary>' +
  '<label>Country name</label><input id="c_name" placeholder="Portugal">' +
  '<label>Eurostat / ISO code</label><input id="c_code" placeholder="PT">' +
  '<div class="hint">Greece = EL in Eurostat.</div>' +
  '<button class="btn" onclick="addCountry()">Save country</button></details>' +

  '<h3>Danger zone</h3>' +
  '<button class="btn warn" onclick="run(\'resetEverything\')">Reset everything</button>' +

  '<div id="msg"></div>' +

  '<script>' +
  'var OPEN=' + JSON.stringify(section) + ';' +
  'function msg(t){document.getElementById("msg").textContent=t;}' +
  'function busy(b){document.querySelectorAll("button").forEach(function(x){x.disabled=b;});}' +
  'function done(r){busy(false);msg(r||"Done.");}' +
  'function fail(e){busy(false);msg("Error: "+(e&&e.message?e.message:e));}' +
  'function run(fn){busy(true);msg("Working...");google.script.run.withSuccessHandler(done).withFailureHandler(fail)[fn]();}' +
  'function v(id){return document.getElementById(id).value.trim();}' +
  'function fill(id,items,label){var s=document.getElementById(id);s.innerHTML="";items.forEach(function(it){var o=document.createElement("option");o.value=it.code||it;o.textContent=label?label(it):(it.code||it);s.appendChild(o);});}' +
  'function toggleCsv(){var csv=v("s_type")==="CSV link";document.querySelectorAll(".csv").forEach(function(e){e.style.display=csv?"block":"none";});document.querySelectorAll(".eu").forEach(function(e){e.style.display=csv?"none":"block";});}' +
  'function load(){google.script.run.withSuccessHandler(function(d){' +
  ' fill("s_ind",d.indicators,function(x){return x.code+" - "+x.name;});fill("s_type",d.types);fill("i_pillar",d.pillars);toggleCsv();' +
  '}).withFailureHandler(fail).getPanelData();}' +
  'function addSource(){busy(true);msg("Saving...");google.script.run.withSuccessHandler(done).withFailureHandler(fail).addSourceFromPanel({' +
  ' indicator:v("s_ind"),type:v("s_type"),link:v("s_link"),filterA:v("s_fa"),filterB:v("s_fb"),since:v("s_since"),' +
  ' csvCountry:v("s_cc"),csvValue:v("s_vc"),csvYear:v("s_yc"),note:v("s_note"),fetchNow:document.getElementById("s_fetch").checked});}' +
  'function addIndicator(){busy(true);msg("Saving...");google.script.run.withSuccessHandler(function(r){done(r);load();}).withFailureHandler(fail).addIndicatorFromPanel({' +
  ' code:v("i_code"),pillar:v("i_pillar"),name:v("i_name"),direction:v("i_dir"),unit:v("i_unit"),source:v("i_src"),link:v("i_link")});}' +
  'function addCountry(){busy(true);msg("Saving...");google.script.run.withSuccessHandler(done).withFailureHandler(fail).addCountryFromPanel(v("c_name"),v("c_code"));}' +
  'if(OPEN){var d=document.getElementById("d-"+OPEN);if(d)d.open=true;}' +
  'load();' +
  '</script></body></html>';
}

// ============================================================================
// SETUP
// ============================================================================

/**
 * Creates missing tabs and repairs formulas. Your own content in Data,
 * Evidence, Weights, Indicators and Sources is never overwritten.
 * Guide and Rubrics are rebuilt; Scores and Dashboard are recalculated.
 */
function setupIndex() {
  var ss = SpreadsheetApp.getActive();
  buildGuide_(ss);
  buildRubrics_(ss);
  if (!ss.getSheetByName(SHEETS.INDICATORS)) buildIndicators_(ss);
  if (!ss.getSheetByName(SHEETS.DATA)) buildData_(ss);
  if (!ss.getSheetByName(SHEETS.EVIDENCE)) buildEvidence_(ss);
  if (!ss.getSheetByName(SHEETS.WEIGHTS)) buildWeights_(ss);
  if (!ss.getSheetByName(SHEETS.SOURCES)) buildSources_(ss);
  if (!ss.getSheetByName(SHEETS.LOG)) buildLog_(ss);
  rebuildFormulas();
  orderSheets_(ss);
  removeDefaultSheet_(ss);
  ss.setActiveSheet(ss.getSheetByName(SHEETS.GUIDE));
  log_('Setup', 'Sheet built / repaired.');
  ss.toast('Done. Start with the Guide tab, or open the control panel from the menu.', APP_NAME, 6);
  return 'Sheet built / repaired.';
}

function ensureSetup_() {
  var ss = SpreadsheetApp.getActive();
  if (!ss.getSheetByName(SHEETS.INDICATORS) || !ss.getSheetByName(SHEETS.DATA) || !ss.getSheetByName(SHEETS.SOURCES)) setupIndex();
}

function resetEverything() {
  var ui = SpreadsheetApp.getUi();
  var r = ui.alert('Reset everything?',
    'This deletes ALL tool tabs including your Data, Evidence, Indicators and Sources entries, then rebuilds them with defaults. Continue?',
    ui.ButtonSet.YES_NO);
  if (r !== ui.Button.YES) return 'Reset cancelled.';
  var ss = SpreadsheetApp.getActive();
  var keep = ss.insertSheet('tmp_' + Date.now()); // a spreadsheet must keep at least one sheet
  Object.keys(SHEETS).forEach(function (k) {
    var sh = ss.getSheetByName(SHEETS[k]);
    if (sh) ss.deleteSheet(sh);
  });
  setupIndex();
  ss.deleteSheet(keep);
  return 'Everything reset.';
}

// ---------------------------------------------------------------------------

function buildGuide_(ss) {
  var sh = freshSheet_(ss, SHEETS.GUIDE);
  var lines = [
    ['African Talent Destination Index', 'title'],
    ['Is this country a realistic destination for African university graduates? This sheet answers that with sourced data and a transparent formula.', 'text'],
    ['', ''],
    ['QUICK START', 'h'],
    ['1. Menu "Destination Index" > "Open control panel (buttons)". Everything can be done from there.', 'text'],
    ['2. Click "Fetch data from all sources". This fills the automatic indicators and logs each value in Evidence.', 'text'],
    ['3. Open the Data tab. Fill the remaining yellow cells from the sources listed in the Indicators tab.', 'text'],
    ['4. For every value you type yourself, add one row in the Evidence tab: country, indicator, value, year, source, link.', 'text'],
    ['5. For 0-10 ratings (A1, A3, S3) use the Rubrics tab so every country is judged the same way.', 'text'],
    ['6. Adjust the Weights tab to your own priorities, then read the Dashboard.', 'text'],
    ['', ''],
    ['ADDING YOUR OWN LINKS (SOURCES)', 'h'],
    ['Control panel > "Add a source link", or type a new row in the Sources tab. Two types:', 'text'],
    ['Eurostat - paste a data-browser link (ec.europa.eu/eurostat/databrowser/view/CODE/...), an API link, or just the dataset code.', 'text'],
    ['    Filters A narrow the data, e.g.  unit=PPS&sex=T&age=TOTAL . The country filter is added automatically from the Data tab.', 'code'],
    ['    Filters B (optional) makes the value a gap: value = A - B (for example native-born minus non-EU-born).', 'code'],
    ['    Find filter codes: open the dataset in the Eurostat data browser; the codes are shown next to each dimension.', 'text'],
    ['CSV link - any link that downloads a CSV file: a statistics office CSV, a GitHub "raw" file, or your own Google Sheet', 'text'],
    ['    (File > Share > Publish to web > choose a tab > CSV). Tell the script which column holds the country and which holds the value.', 'code'],
    ['    Country column may contain the code (DE) or the name (Germany). If you give a year column, the latest year per country is used.', 'code'],
    ['Each fetched value is written into Data, gets a note with source and year, and is logged in Evidence automatically.', 'text'],
    ['', ''],
    ['ADDING YOUR OWN INDICATORS', 'h'],
    ['Control panel > "Add an indicator" (or add a row in the Indicators tab, then click "Refresh scores & dashboard").', 'text'],
    ['Choose the pillar and the direction (higher or lower is better). A new yellow column appears in Data and the scores include it.', 'text'],
    ['To remove an indicator: delete its row in Indicators and its column in Data, then Refresh.', 'text'],
    ['', ''],
    ['THE FOUR PILLARS', 'h'],
    ['Access - can I get in? (visa pathway, Blue Card threshold, degree recognition)', 'text'],
    ['Fairness - is merit rewarded? (over-qualification gap, employment gap, hiring discrimination)', 'text'],
    ['Reward - is it worth it financially? (income in purchasing power, your salary, price level)', 'text'],
    ['Settlement - can I build a life? (years to permanent residence and citizenship, language, community)', 'text'],
    ['', ''],
    ['HOW THE SCORE IS CALCULATED', 'h'],
    ['Step 1 - each indicator becomes 0-100 by comparing the countries: best country = 100, worst = 0.', 'text'],
    ['    Higher is better:  (value - min) / (max - min) x 100', 'code'],
    ['    Lower is better:   (max - value) / (max - min) x 100', 'code'],
    ['Step 2 - pillar score = average of its indicator scores. Empty indicators are skipped, not counted as zero.', 'text'],
    ['Step 3 - Destination Score = weighted average of the pillars that have data (weights in the Weights tab).', 'text'],
    ['Step 4 - verdict: >= 70 Destination | 50-69 Conditional | < 50 Not recommended | too little data = Insufficient data.', 'text'],
    ['', ''],
    ['TABS', 'h'],
    ['Dashboard - ranking, verdicts and chart. Read-only.', 'text'],
    ['Data - the numbers (yellow cells). Row 2 = direction, row 3 = description (both come from Indicators).', 'text'],
    ['Evidence - source log for every number. If it is not in Evidence, do not trust it.', 'text'],
    ['Weights - pillar weights and verdict thresholds.', 'text'],
    ['Scores - all calculations (green). Do not edit.', 'text'],
    ['Indicators - list of indicators: pillar, direction, unit, source. Yours to edit.', 'text'],
    ['Sources - links the script fetches from. Yours to edit. "Last status" shows the result of each fetch.', 'text'],
    ['Rubrics - fixed rules for the 0-10 ratings.', 'text'],
    ['Log - what the script did and any errors.', 'text'],
    ['', ''],
    ['WHEN A FETCH FAILS', 'h'],
    ['Look at "Last status" in Sources and the Log tab. Usually a filter code or a CSV column name is wrong.', 'text'],
    ['Fix it in the Sources tab and click Fetch again - or copy the value by hand into Data and log it in Evidence.', 'text'],
    ['', ''],
    ['LIMITS - READ BEFORE USING THE RESULT', 'h'],
    ['- Scores are RELATIVE to the countries in the sheet. Add or remove a country and every score can shift.', 'text'],
    ['- National averages are not your personal outcome. Profession, language level and recognition status matter more.', 'text'],
    ['- Discrimination studies are few and use different methods; treat F3 as an approximate signal.', 'text'],
    ['- Eurostat "non-EU" is broader than "African". Where African-specific data exists, prefer it and note it in Evidence.', 'text']
  ];
  var values = lines.map(function (l) { return [l[0]]; });
  sh.getRange(1, 1, values.length, 1).setValues(values).setWrap(true).setVerticalAlignment('top');
  lines.forEach(function (l, i) {
    var cell = sh.getRange(i + 1, 1);
    if (l[1] === 'title') cell.setFontSize(18).setFontWeight('bold').setFontColor(COLORS.title);
    else if (l[1] === 'h') cell.setFontWeight('bold').setFontColor(COLORS.headerText).setBackground(COLORS.header);
    else if (l[1] === 'code') cell.setFontFamily('Roboto Mono').setFontSize(9);
  });
  sh.setColumnWidth(1, 950);
  sh.setHiddenGridlines(true);
}

function buildIndicators_(ss) {
  var sh = freshSheet_(ss, SHEETS.INDICATORS);
  writeTable_(sh, ['Code', 'Pillar', 'Indicator', 'Direction', 'Unit', 'How to get it', 'Source', 'Link'], DEFAULT_INDICATORS);
  formatIndicatorRows_(sh, 2, DEFAULT_INDICATORS.length);
  [7, 12, 50, 16, 16, 28, 42, 55].forEach(function (w, i) { sh.setColumnWidth(i + 1, w * 7); });
}

function formatIndicatorRows_(sh, firstRow, n) {
  sh.getRange(firstRow, 2, n, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(PILLARS, true).build());
  sh.getRange(firstRow, 4, n, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList([DIR_HIGHER, DIR_LOWER], true).build());
}

function buildRubrics_(ss) {
  var sh = freshSheet_(ss, SHEETS.RUBRICS);
  var rows = [
    ['A1 Pathway', 10, 'Profession on national shortage list AND lower Blue Card threshold applies'],
    ['A1 Pathway', 7, 'Blue Card at standard threshold; profession clearly in demand'],
    ['A1 Pathway', 4, 'Work permit possible but with labour-market test or heavy employer hurdles'],
    ['A1 Pathway', 1, 'No realistic work-visa route for this profession'],
    ['A3 Recognition', 10, 'No formal recognition needed (non-regulated profession) or automatic'],
    ['A3 Recognition', 7, 'Formal recognition, usually under 3 months, low cost'],
    ['A3 Recognition', 4, 'Takes 3-12 months, or only partial (adaptation course / exam)'],
    ['A3 Recognition', 1, 'Degree usually not recognised; must re-qualify'],
    ['S3 Language', 10, 'English is the everyday working language in most graduate jobs'],
    ['S3 Language', 7, 'Many graduate jobs in English, especially capital city / tech'],
    ['S3 Language', 4, 'English jobs exist, but local language (B2+) needed for most'],
    ['S3 Language', 1, 'Local language (C1) required almost everywhere'],
    ['Method tip', '', 'For S3: take 50 graduate job ads per country on the same job board; score = share in English / 10.']
  ];
  writeTable_(sh, ['Indicator', 'Score', 'Meaning'], rows);
  sh.setColumnWidth(1, 130); sh.setColumnWidth(2, 60); sh.setColumnWidth(3, 650);
}

function buildData_(ss) {
  var sh = freshSheet_(ss, SHEETS.DATA);
  var head = ['Country', 'Eurostat code', 'Notes'];
  sh.getRange(1, 1, 1, head.length).setValues([head]);
  styleHeader_(sh.getRange(1, 1, 1, head.length));
  sh.getRange(2, 1).setValue('Direction (+1 higher better, -1 lower better)');
  sh.getRange(3, 1).setValue('Indicator');
  var rows = DEFAULT_COUNTRIES.map(function (c) { return [c[0], c[1]]; });
  sh.getRange(DATA_FIRST_ROW, 1, rows.length, 2).setValues(rows);
  sh.getRange(DATA_FIRST_ROW, 1, rows.length, 1).setFontWeight('bold');
  sh.getRange(DATA_FIRST_ROW, 2, rows.length, 1).setBackground(COLORS.input);
  sh.setFrozenRows(3); sh.setFrozenColumns(2);
  sh.setColumnWidth(1, 140); sh.setColumnWidth(2, 90);
  // indicator columns are added by syncDataColumns_()
}

/**
 * Makes sure every indicator in the Indicators tab has a column in Data
 * (inserted before "Notes"), and refreshes rows 2-3 and input formatting.
 * Returns { code: columnNumber }.
 */
function syncDataColumns_(data, indicators) {
  var map = dataColumnMap_(data);
  var notesCol = map.__notes || (data.getLastColumn() + 1);
  if (!map.__notes) { data.getRange(1, notesCol).setValue('Notes'); styleHeader_(data.getRange(1, notesCol)); }

  indicators.forEach(function (x) {
    if (map[x.code]) return;
    data.insertColumnBefore(notesCol);
    data.getRange(1, notesCol).setValue(x.code);
    styleHeader_(data.getRange(1, notesCol));
    data.setColumnWidth(notesCol, 110);
    map[x.code] = notesCol;
    notesCol++;
  });
  data.setColumnWidth(notesCol, 250);

  var n = Math.max(countryCount_(data), 1);
  var rating = SpreadsheetApp.newDataValidation().requireNumberBetween(0, 10).setAllowInvalid(false)
    .setHelpText('Rating 0-10, see Rubrics tab').build();
  indicators.forEach(function (x) {
    var c = map[x.code];
    data.getRange(2, c).setValue(x.direction).setFontStyle('italic').setFontColor('#666666');
    data.getRange(3, c).setValue(x.name + (x.unit ? ' (' + x.unit + ')' : '')).setWrap(true)
      .setVerticalAlignment('top').setFontSize(9);
    var cells = data.getRange(DATA_FIRST_ROW, c, n, 1).setBackground(COLORS.input);
    if (/rating\s*0\s*-\s*10/i.test(x.unit)) cells.setDataValidation(rating);
  });
  data.setRowHeight(3, 110);
  return map;
}

/** Reads the Data header row: { code: column, __notes: column }. */
function dataColumnMap_(data) {
  var lastCol = Math.max(data.getLastColumn(), 1);
  var head = data.getRange(1, 1, 1, lastCol).getValues()[0];
  var map = {};
  for (var c = DATA_FIRST_COL; c <= lastCol; c++) {
    var h = String(head[c - 1]).trim();
    if (!h) continue;
    if (h.toLowerCase() === 'notes') map.__notes = c;
    else map[h] = c;
  }
  return map;
}

function buildEvidence_(ss) {
  var sh = freshSheet_(ss, SHEETS.EVIDENCE);
  writeTable_(sh, ['Country', 'Indicator code', 'Value', 'Data year', 'Source (title)', 'Link', 'Date accessed', 'Notes'], []);
  sh.getRange(2, 1, 200, 8).setBackground(COLORS.input);
  [110, 90, 80, 75, 260, 380, 100, 260].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
}

function buildWeights_(ss) {
  var sh = freshSheet_(ss, SHEETS.WEIGHTS);
  sh.getRange(1, 1, 1, 6).setValues([['Pillar'].concat(PILLARS).concat(['Total'])]);
  styleHeader_(sh.getRange(1, 1, 1, 6));
  sh.getRange(2, 1, 1, 5).setValues([['Weight'].concat(DEFAULT_WEIGHTS)]);
  sh.getRange(2, 2, 1, 4).setBackground(COLORS.input);
  sh.getRange(2, 6).setFormula('=SUM(B2:E2)').setBackground(COLORS.calc);
  sh.getRange('A4').setValue('Verdict thresholds').setFontWeight('bold');
  sh.getRange('A5:B7').setValues([
    ['Destination if score >=', 70],
    ['Conditional if score >=', 50],
    ['Minimum data coverage for a verdict', 0.6]
  ]);
  sh.getRange('B5:B7').setBackground(COLORS.input);
  sh.getRange('B7').setNumberFormat('0%');
  sh.getRange('A9').setValue('Weights do not have to add up to 100: the score divides by the weights of the pillars that have data.')
    .setFontStyle('italic');
  sh.setColumnWidth(1, 260);
}

function buildSources_(ss) {
  var sh = freshSheet_(ss, SHEETS.SOURCES);
  var rows = DEFAULT_SOURCES.map(function (s) { return s.concat(['']); });
  writeTable_(sh, SRC_HEAD, rows);
  formatSourceRows_(sh, 2, 100);
  sh.getRange(2, SRC.ENABLED, rows.length, 1).setValues(DEFAULT_SOURCES.map(function (s) { return [s[SRC.ENABLED - 1]]; }));
  [80, 90, 330, 280, 280, 70, 120, 120, 120, 65, 300, 380].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
}

function formatSourceRows_(sh, firstRow, n) {
  sh.getRange(firstRow, SRC.TYPE, n, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(SOURCE_TYPES, true).build());
  sh.getRange(firstRow, SRC.ENABLED, n, 1).insertCheckboxes();
  sh.getRange(firstRow, SRC.IND, n, SRC.NOTE).setBackground(COLORS.input);
  sh.getRange(firstRow, SRC.ENABLED, n, 1).setBackground(null);
}

function buildLog_(ss) {
  var sh = freshSheet_(ss, SHEETS.LOG);
  writeTable_(sh, ['Time', 'Action', 'Message'], []);
  sh.setColumnWidth(1, 150); sh.setColumnWidth(2, 120); sh.setColumnWidth(3, 800);
}

// ============================================================================
// INDICATORS (read from the Indicators tab)
// ============================================================================

function getIndicators_() {
  var sh = SpreadsheetApp.getActive().getSheetByName(SHEETS.INDICATORS);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 8).getValues()
    .filter(function (r) { return String(r[0]).trim() !== ''; })
    .map(function (r) {
      var dirText = String(r[3]).toLowerCase();
      return {
        code: String(r[0]).trim(), pillar: String(r[1]).trim(), name: String(r[2]).trim(),
        direction: (dirText.indexOf('lower') >= 0 || dirText === '-1') ? -1 : 1,
        unit: String(r[4]).trim(), source: String(r[6]).trim(), link: String(r[7]).trim()
      };
    });
}

// ============================================================================
// SCORES + DASHBOARD (formulas, regenerated for current countries/indicators)
// ============================================================================

function rebuildFormulas() {
  var ss = SpreadsheetApp.getActive();
  var data = ss.getSheetByName(SHEETS.DATA);
  if (!data || !ss.getSheetByName(SHEETS.INDICATORS)) { return setupIndex(); }
  var indicators = getIndicators_();
  var map = syncDataColumns_(data, indicators);
  var n = countryCount_(data);
  buildScores_(ss, n, indicators, map);
  buildDashboard_(ss, n, indicators.length);
  ss.toast('Scores refreshed: ' + n + ' countries, ' + indicators.length + ' indicators.', APP_NAME, 4);
  return 'Scores refreshed: ' + n + ' countries, ' + indicators.length + ' indicators.';
}

function countryCount_(data) {
  var last = data.getLastRow();
  if (last < DATA_FIRST_ROW) return 0;
  var names = data.getRange(DATA_FIRST_ROW, 1, last - DATA_FIRST_ROW + 1, 1).getValues();
  var n = 0;
  for (var i = 0; i < names.length; i++) { if (String(names[i][0]).trim() === '') break; n++; }
  return n;
}

/** Column positions in the Scores tab. */
function scoreLayout_(nI) {
  var pillarStart = 2 + nI;                 // after Country + indicator scores
  var total = pillarStart + PILLARS.length;
  return { nI: nI, pillarStart: pillarStart, total: total, coverage: total + 1, verdict: total + 2, rank: total + 3 };
}

function buildScores_(ss, n, indicators, map) {
  var sh = freshSheet_(ss, SHEETS.SCORES);
  var L = scoreLayout_(indicators.length);
  var head = ['Country'].concat(indicators.map(function (x) { return x.code; }))
    .concat(PILLARS.map(function (p) { return p + ' score'; }))
    .concat(['Destination Score', 'Data coverage', 'Verdict', 'Rank']);
  sh.getRange(1, 1, 1, head.length).setValues([head]);
  styleHeader_(sh.getRange(1, 1, 1, head.length));
  sh.getRange(2, 1).setValue('Indicator scores 0-100 (100 = best of the listed countries). Calculated - do not edit.')
    .setFontStyle('italic');
  if (n === 0) return;

  var first = DATA_FIRST_ROW, last = DATA_FIRST_ROW + n - 1;
  var D = SHEETS.DATA, W = SHEETS.WEIGHTS;
  var formulas = [];
  for (var r = first; r <= last; r++) {
    var row = ['=' + D + '!A' + r];

    // Indicator scores (min-max across countries; direction from Data row 2)
    indicators.forEach(function (x) {
      var c = colLetter_(map[x.code]);
      var v = D + '!' + c + r;
      var rng = D + '!' + c + '$' + first + ':' + c + '$' + last;
      row.push('=IFERROR(IF(OR(' + v + '="",COUNT(' + rng + ')=0),"",IF(MAX(' + rng + ')=MIN(' + rng + '),100,' +
        'IF(' + D + '!' + c + '$2=-1,(MAX(' + rng + ')-' + v + ')/(MAX(' + rng + ')-MIN(' + rng + ')),' +
        '(' + v + '-MIN(' + rng + '))/(MAX(' + rng + ')-MIN(' + rng + ')))*100)),"")');
    });

    // Pillar scores = average of that pillar's indicator scores (cells may be anywhere)
    PILLARS.forEach(function (p) {
      var cells = [];
      indicators.forEach(function (x, i) { if (x.pillar === p) cells.push(colLetter_(2 + i) + r); });
      row.push(cells.length ? '=IFERROR(AVERAGE(' + cells.join(',') + '),"")' : '=""');
    });

    // Weighted total over pillars that have data
    var wCells = ['$B$2', '$C$2', '$D$2', '$E$2'].map(function (a) { return W + '!' + a; });
    var num = [], den = [];
    PILLARS.forEach(function (p, k) {
      var a = colLetter_(L.pillarStart + k) + r;
      num.push('IF(ISNUMBER(' + a + '),' + a + '*' + wCells[k] + ',0)');
      den.push('IF(ISNUMBER(' + a + '),' + wCells[k] + ',0)');
    });
    row.push('=IF((' + den.join('+') + ')=0,"",(' + num.join('+') + ')/(' + den.join('+') + '))');

    var dataCells = indicators.map(function (x) { return D + '!' + colLetter_(map[x.code]) + r; });
    row.push(indicators.length ? '=COUNT(' + dataCells.join(',') + ')/' + indicators.length : '=0');

    var t = colLetter_(L.total) + r, cv = colLetter_(L.coverage) + r;
    row.push('=IF(' + cv + '<' + W + '!$B$7,"Insufficient data",IF(' + t + '>=' + W + '!$B$5,"Destination",IF(' +
      t + '>=' + W + '!$B$6,"Conditional","Not recommended")))');
    var tr = colLetter_(L.total) + '$' + first + ':' + colLetter_(L.total) + '$' + last;
    row.push('=IF(ISNUMBER(' + t + '),RANK(' + t + ',' + tr + '),"")');
    formulas.push(row);
  }
  sh.getRange(first, 1, n, formulas[0].length).setFormulas(formulas);
  sh.getRange(first, 2, n, formulas[0].length - 1).setBackground(COLORS.calc);
  sh.getRange(first, 2, n, L.coverage - 2).setNumberFormat('0');
  sh.getRange(first, L.coverage, n, 1).setNumberFormat('0%');
  sh.getRange(first, L.total, n, 1).setFontWeight('bold');
  sh.getRange(first, 1, n, 1).setFontWeight('bold');
  sh.setFrozenRows(1); sh.setFrozenColumns(1);
  sh.setColumnWidth(1, 140);
  sh.setColumnWidth(L.verdict, 140);
  sh.setConditionalFormatRules(verdictRules_(sh.getRange(first, L.verdict, n, 1)));
}

function buildDashboard_(ss, n, nI) {
  var sh = freshSheet_(ss, SHEETS.DASHBOARD);
  var L = scoreLayout_(nI);
  sh.getRange('A1').setValue('Destination ranking').setFontSize(16).setFontWeight('bold').setFontColor(COLORS.title);
  sh.getRange('A2').setValue('Menu "Destination Index" > "Open control panel" for all buttons.').setFontStyle('italic');
  var head = ['Country', 'Destination Score', 'Access', 'Fairness', 'Reward', 'Settlement', 'Data coverage', 'Verdict'];
  sh.getRange(3, 1, 1, head.length).setValues([head]);
  styleHeader_(sh.getRange(3, 1, 1, head.length));
  if (n === 0) { sh.getRange('A4').setValue('Add countries in the Data tab.'); return; }

  var S = SHEETS.SCORES, f = DATA_FIRST_ROW, l = DATA_FIRST_ROW + n - 1;
  var col = function (c) { return S + '!' + colLetter_(c) + f + ':' + colLetter_(c) + l; };
  var pill = S + '!' + colLetter_(L.pillarStart) + f + ':' + colLetter_(L.pillarStart + 3) + l;
  sh.getRange('A4').setFormula('=IFERROR(SORT(FILTER({' + col(1) + ',' + col(L.total) + ',' + pill + ',' +
    col(L.coverage) + ',' + col(L.verdict) + '},' + col(L.total) + '<>""),2,FALSE),' +
    '"No scores yet - fill the Data tab or click Fetch data from all sources.")');
  sh.getRange(4, 2, n, 5).setNumberFormat('0');
  sh.getRange(4, 7, n, 1).setNumberFormat('0%');
  sh.getRange(4, 1, n, 1).setFontWeight('bold');
  sh.setConditionalFormatRules(verdictRules_(sh.getRange(4, 8, n, 1)));

  var noteRow = 4 + n + 1;
  sh.getRange(noteRow, 1).setValue('Countries without any score yet:').setFontWeight('bold');
  sh.getRange(noteRow + 1, 1).setFormula('=IFERROR(TEXTJOIN(", ",TRUE,FILTER(' + col(1) + ',' + col(L.total) + '="")),"")');
  sh.getRange(noteRow + 3, 1).setValue('Legend: >= 70 Destination | 50-69 Conditional | < 50 Not recommended | coverage below minimum = Insufficient data. ' +
    'Scores are relative to the listed countries.').setFontStyle('italic');

  var chart = sh.newChart()
    .setChartType(Charts.ChartType.BAR)
    .addRange(sh.getRange(3, 1, n + 1, 2))
    .setPosition(3, 10, 0, 0)
    .setOption('title', 'Destination Score (0-100)')
    .setOption('legend', { position: 'none' })
    .setOption('hAxis', { minValue: 0, maxValue: 100 })
    .setOption('colors', ['#1F4E78'])
    .setOption('width', 520).setOption('height', 320)
    .build();
  sh.insertChart(chart);

  sh.setColumnWidth(1, 140); sh.setColumnWidth(2, 130); sh.setColumnWidth(7, 110); sh.setColumnWidth(8, 140);
  sh.setHiddenGridlines(true);
}

function verdictRules_(range) {
  var mk = function (text, color) {
    return SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(text).setBackground(color).setRanges([range]).build();
  };
  return [mk('Destination', COLORS.good), mk('Conditional', COLORS.mid),
          mk('Not recommended', COLORS.bad), mk('Insufficient data', COLORS.grey)];
}

// ============================================================================
// ADD COUNTRY / INDICATOR / SOURCE (called from the control panel)
// ============================================================================

function addCountryFromPanel(name, code) {
  name = String(name || '').trim(); code = String(code || '').trim().toUpperCase();
  if (!name) throw new Error('Please give a country name.');
  ensureSetup_();
  var data = SpreadsheetApp.getActive().getSheetByName(SHEETS.DATA);
  var existing = data.getRange(DATA_FIRST_ROW, 1, Math.max(countryCount_(data), 1), 1).getValues()
    .map(function (r) { return String(r[0]).toLowerCase(); });
  if (existing.indexOf(name.toLowerCase()) >= 0) throw new Error(name + ' is already in the Data tab.');
  var row = DATA_FIRST_ROW + countryCount_(data);
  data.getRange(row, 1, 1, 2).setValues([[name, code]]);
  data.getRange(row, 1).setFontWeight('bold');
  data.getRange(row, 2).setBackground(COLORS.input);
  rebuildFormulas();
  log_('Add country', name + ' (' + code + ') added in Data row ' + row + '.');
  return name + ' added. Run "Fetch data from all sources" to fill its automatic values.';
}

function addIndicatorFromPanel(o) {
  var code = String(o.code || '').trim();
  if (!code || !o.name) throw new Error('Code and name are required.');
  if (!/^[A-Za-z0-9_]+$/.test(code)) throw new Error('Code may only contain letters, digits and _ (e.g. F4).');
  if (code.toLowerCase() === 'notes') throw new Error('"Notes" is reserved.');
  if (PILLARS.indexOf(o.pillar) < 0) throw new Error('Pillar must be one of: ' + PILLARS.join(', '));
  ensureSetup_();
  if (getIndicators_().some(function (x) { return x.code.toLowerCase() === code.toLowerCase(); })) {
    throw new Error('Indicator ' + code + ' already exists.');
  }
  var sh = SpreadsheetApp.getActive().getSheetByName(SHEETS.INDICATORS);
  var row = sh.getLastRow() + 1;
  sh.getRange(row, 1, 1, 8).setValues([[code, o.pillar, o.name, o.direction === DIR_LOWER ? DIR_LOWER : DIR_HIGHER,
    o.unit || '', o.link ? 'Source link / manual' : 'Manual', o.source || '', o.link || '']]).setWrap(true);
  formatIndicatorRows_(sh, row, 1);
  rebuildFormulas();
  log_('Add indicator', code + ' - ' + o.name + ' (' + o.pillar + ').');
  return 'Indicator ' + code + ' added: new column in Data. Fill it by hand or add a source link for it.';
}

function addSourceFromPanel(o) {
  ensureSetup_();
  if (!o.indicator) throw new Error('Choose an indicator.');
  if (!o.link) throw new Error('Paste a link or dataset code.');
  if (o.type === 'CSV link') {
    if (!/^https?:\/\//i.test(o.link)) throw new Error('A CSV source needs a full link starting with http.');
    if (!o.csvCountry || !o.csvValue) throw new Error('For CSV, give the country column and value column headers.');
  }
  var sh = SpreadsheetApp.getActive().getSheetByName(SHEETS.SOURCES);
  var row = firstEmptyRow_(sh);
  var values = [o.indicator, o.type || 'Eurostat', o.link, o.filterA || '', o.filterB || '',
                Number(o.since) || 2018, o.csvCountry || '', o.csvValue || '', o.csvYear || '', true, o.note || '', ''];
  sh.getRange(row, 1, 1, values.length).setValues([values]);
  formatSourceRows_(sh, row, 1);
  sh.getRange(row, SRC.ENABLED).setValue(true);
  log_('Add source', o.indicator + ' <- ' + o.link);
  if (o.fetchNow) {
    var r = fetchSources_([row]);
    return 'Source saved and fetched: ' + r;
  }
  return 'Source saved in Sources row ' + row + '. Click "Fetch data from all sources" to use it.';
}

// ============================================================================
// FETCHING (Eurostat links and CSV links)
// ============================================================================

function fetchAllSources() {
  ensureSetup_();
  var sh = SpreadsheetApp.getActive().getSheetByName(SHEETS.SOURCES);
  var rows = [];
  for (var r = 2; r <= sh.getLastRow(); r++) rows.push(r);
  var summary = fetchSources_(rows);
  SpreadsheetApp.getActive().toast(summary, APP_NAME, 8);
  return summary;
}

/** Fetches the given Sources rows, writes values into Data and Evidence. */
function fetchSources_(rowNumbers) {
  var ss = SpreadsheetApp.getActive();
  var data = ss.getSheetByName(SHEETS.DATA);
  var src = ss.getSheetByName(SHEETS.SOURCES);
  var ev = ss.getSheetByName(SHEETS.EVIDENCE);
  var indicators = getIndicators_();
  var map = syncDataColumns_(data, indicators);

  var n = countryCount_(data);
  if (n === 0) return 'No countries in the Data tab.';
  var countries = data.getRange(DATA_FIRST_ROW, 1, n, 2).getValues().map(function (r, i) {
    return { name: String(r[0]).trim(), geo: String(r[1]).trim().toUpperCase(), row: DATA_FIRST_ROW + i };
  });
  var tz = ss.getSpreadsheetTimeZone();
  var today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  var written = 0, ok = 0, failed = 0, evidence = [];

  rowNumbers.forEach(function (rowNum) {
    var s = src.getRange(rowNum, 1, 1, SRC_HEAD.length).getValues()[0];
    var code = String(s[SRC.IND - 1]).trim(), link = String(s[SRC.LINK - 1]).trim();
    if (!code || !link || s[SRC.ENABLED - 1] !== true) return;
    var status = function (m) { src.getRange(rowNum, SRC.STATUS).setValue(m); };
    if (!map[code]) { status('ERROR: indicator ' + code + ' not found in Indicators tab.'); failed++; return; }

    try {
      var type = String(s[SRC.TYPE - 1]).trim() || 'Eurostat';
      var res = type === 'CSV link'
        ? fetchCsvSource_(link, s[SRC.CSV_COUNTRY - 1], s[SRC.CSV_VALUE - 1], s[SRC.CSV_YEAR - 1], countries)
        : fetchEurostatSource_(link, s[SRC.FILTER_A - 1], s[SRC.FILTER_B - 1], s[SRC.SINCE - 1], countries);

      var got = 0, missing = [];
      countries.forEach(function (c) {
        var hit = res.values[c.row];
        if (!hit) { missing.push(c.geo || c.name); return; }
        var value = Math.round(hit.value * 100) / 100;
        data.getRange(c.row, map[code]).setValue(value)
          .setNote(res.label + (hit.year ? ', ' + hit.year : '') + ' (fetched ' + today + ')');
        evidence.push([c.name, code, value, hit.year || '', res.label, res.url, today, 'Auto-fetched']);
        got++; written++;
      });
      var m = 'OK ' + today + ': ' + got + '/' + countries.length + ' countries' +
        (missing.length ? '. No data: ' + missing.join(', ') : '') +
        (res.warnings.length ? '. Warning: ' + res.warnings.join('; ') : '');
      status(m); log_('Fetch ' + code, m); ok++;
    } catch (e) {
      status('ERROR ' + today + ': ' + e.message); log_('Fetch ' + code, 'ERROR: ' + e.message); failed++;
    }
  });

  if (evidence.length) ev.getRange(firstEmptyRow_(ev), 1, evidence.length, 8).setValues(evidence);
  return written + ' values written from ' + ok + ' source(s)' + (failed ? ', ' + failed + ' failed (see Sources "Last status")' : '') + '.';
}

// ---------- Eurostat ----------

/**
 * Accepts a data-browser link, an API link (filters inside are kept) or a bare dataset code.
 * Returns { dataset, filters }.
 */
function parseEurostatLink_(link) {
  link = String(link).trim();
  var m = link.match(/databrowser\/view\/([A-Za-z0-9_$.-]+)/i);
  if (m) return { dataset: m[1], filters: '' };
  m = link.match(/statistics\/1\.0\/data\/([A-Za-z0-9_$.-]+)\/?\??(.*)$/i);
  if (m) {
    var keep = (m[2] || '').split('&').filter(function (p) {
      var k = p.split('=')[0].toLowerCase();
      return p && ['geo', 'format', 'lang', 'sincetimeperiod', 'untiltimeperiod', 'lasttimeperiod', 'time'].indexOf(k) < 0;
    });
    return { dataset: m[1], filters: keep.join('&') };
  }
  m = link.match(/sdmx\/[\d.]+\/data\/(?:dataflow\/ESTAT\/)?([A-Za-z0-9_$.-]+)/i);
  if (m) return { dataset: m[1], filters: '' };
  if (/^[A-Za-z0-9_$.-]+$/.test(link)) return { dataset: link, filters: '' };
  throw new Error('Could not read a Eurostat dataset from: ' + link);
}

function joinFilters_(a, b) {
  return [a, b].map(function (x) { return String(x || '').trim().replace(/^[?&]+|&+$/g, ''); })
    .filter(String).join('&');
}

function fetchEurostatSource_(link, filterA, filterB, since, countries) {
  var parsed = parseEurostatLink_(link);
  var geos = countries.map(function (c) { return c.geo; }).filter(String);
  if (!geos.length) throw new Error('No Eurostat codes in Data column B.');
  var a = fetchEurostatSeries_(parsed.dataset, joinFilters_(parsed.filters, filterA), geos, Number(since) || 2015);
  var b = String(filterB || '').trim()
    ? fetchEurostatSeries_(parsed.dataset, joinFilters_(parsed.filters, filterB), geos, Number(since) || 2015) : null;
  var values = {};
  countries.forEach(function (c) {
    var r = b ? latestGap_(a.series[c.geo], b.series[c.geo]) : latestValue_(a.series[c.geo]);
    if (r) values[c.row] = r;
  });
  return {
    values: values, warnings: a.warnings.concat(b ? b.warnings : []),
    label: 'Eurostat ' + parsed.dataset + (b ? ' (A - B gap)' : ''),
    url: a.url + (b ? '  |  B: ' + b.url : '')
  };
}

/** Calls the Eurostat JSON-stat API: { url, series: {GEO: {year: value}}, warnings }. */
function fetchEurostatSeries_(dataset, filters, geos, since) {
  var url = EUROSTAT_API + encodeURIComponent(dataset) + '?format=JSON&lang=EN' +
    (filters ? '&' + filters : '') +
    geos.map(function (g) { return '&geo=' + encodeURIComponent(g); }).join('') +
    '&sinceTimePeriod=' + since;
  var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  var text = resp.getContentText();
  if (resp.getResponseCode() !== 200) {
    var detail = text;
    try { var j = JSON.parse(text); detail = (j.error && (j.error.label || JSON.stringify(j.error))) || text; } catch (ignore) {}
    throw new Error('HTTP ' + resp.getResponseCode() + ' for ' + dataset + ': ' + String(detail).slice(0, 300));
  }
  var parsed = parseJsonStat_(JSON.parse(text));
  parsed.url = url;
  return parsed;
}

/**
 * Parses a JSON-stat 2.0 dataset into { series: {geo: {time: value}}, warnings }.
 * Dimensions other than geo/time should be filtered to one category; if not,
 * the first category is used and a warning is returned.
 */
function parseJsonStat_(js) {
  var ids = js.id, sizes = js.size, dims = js.dimension, values = js.value || {};
  if (!ids || !sizes || !dims) throw new Error('Unexpected response format (not JSON-stat).');
  var gi = ids.indexOf('geo'), ti = ids.indexOf('time');
  if (gi < 0 || ti < 0) throw new Error('Response has no geo/time dimension.');

  var warnings = [];
  ids.forEach(function (id, k) {
    if (k !== gi && k !== ti && sizes[k] > 1) {
      warnings.push('"' + id + '" has ' + sizes[k] + ' categories, first one used - add a filter for it');
    }
  });

  var invert = function (index) {
    var out = [];
    if (Array.isArray(index)) index.forEach(function (code, pos) { out[pos] = code; });
    else Object.keys(index).forEach(function (code) { out[index[code]] = code; });
    return out;
  };
  var geoCodes = invert(dims.geo.category.index);
  var timeCodes = invert(dims.time.category.index);

  var strides = [], acc = 1;
  for (var k = ids.length - 1; k >= 0; k--) { strides[k] = acc; acc *= sizes[k]; }

  var series = {};
  for (var g = 0; g < sizes[gi]; g++) {
    for (var t = 0; t < sizes[ti]; t++) {
      var flat = g * strides[gi] + t * strides[ti];   // other dimensions at position 0
      var v = Array.isArray(values) ? values[flat] : values[String(flat)];
      if (v === null || v === undefined || v === '') continue;
      var geo = geoCodes[g];
      if (!series[geo]) series[geo] = {};
      series[geo][timeCodes[t]] = Number(v);
    }
  }
  return { series: series, warnings: warnings };
}

function latestValue_(s) {
  if (!s) return null;
  var years = Object.keys(s).sort();
  if (!years.length) return null;
  var y = years[years.length - 1];
  return { year: y, value: s[y] };
}

function latestGap_(a, b) {
  if (!a || !b) return null;
  var years = Object.keys(a).filter(function (y) { return b[y] !== undefined; }).sort();
  if (!years.length) return null;
  var y = years[years.length - 1];
  return { year: y, value: a[y] - b[y] };
}

// ---------- CSV ----------

function fetchCsvSource_(link, countryCol, valueCol, yearCol, countries) {
  var resp = UrlFetchApp.fetch(link, { muteHttpExceptions: true, followRedirects: true });
  if (resp.getResponseCode() !== 200) throw new Error('HTTP ' + resp.getResponseCode() + ' for CSV link.');
  var text = resp.getContentText();
  var delim = guessDelimiter_(text);
  var rows = Utilities.parseCsv(text, delim);
  var parsed = extractCsvValues_(rows, countryCol, valueCol, yearCol, countries);
  return { values: parsed.values, warnings: parsed.warnings, label: 'CSV ' + shortHost_(link), url: link };
}

/** Pure function (testable): picks one value per country from parsed CSV rows. */
function extractCsvValues_(rows, countryCol, valueCol, yearCol, countries) {
  if (!rows.length) throw new Error('CSV is empty.');
  var head = rows[0].map(function (h) { return String(h).trim().toLowerCase(); });
  var find = function (name) { return name ? head.indexOf(String(name).trim().toLowerCase()) : -1; };
  var ci = find(countryCol), vi = find(valueCol), yi = find(yearCol);
  if (ci < 0) throw new Error('Country column "' + countryCol + '" not found. Headers: ' + rows[0].join(', '));
  if (vi < 0) throw new Error('Value column "' + valueCol + '" not found. Headers: ' + rows[0].join(', '));
  if (yearCol && yi < 0) throw new Error('Year column "' + yearCol + '" not found. Headers: ' + rows[0].join(', '));

  var lookup = {};
  countries.forEach(function (c) {
    if (c.geo) lookup[c.geo.toLowerCase()] = c.row;
    lookup[c.name.toLowerCase()] = c.row;
  });

  var values = {}, warnings = [], dupes = 0;
  for (var i = 1; i < rows.length; i++) {
    var key = String(rows[i][ci] || '').trim().toLowerCase();
    // SDMX-CSV style "DE:Germany" -> DE
    if (lookup[key] === undefined && key.indexOf(':') > 0) key = key.split(':')[0];
    var row = lookup[key];
    if (row === undefined) continue;
    var num = toNumber_(rows[i][vi]);
    if (num === null) continue;
    var year = yi >= 0 ? String(rows[i][yi]).trim() : '';
    var prev = values[row];
    if (!prev) { values[row] = { value: num, year: year }; continue; }
    if (yi >= 0 && year > prev.year) values[row] = { value: num, year: year };
    else if (yi < 0) dupes++;
  }
  if (dupes) warnings.push(dupes + ' extra rows per country ignored (first used) - add a year column or filter the CSV');
  return { values: values, warnings: warnings };
}

function toNumber_(v) {
  if (typeof v === 'number') return v;
  var s = String(v || '').trim().replace(/\s/g, '');
  if (!s || s === ':' || s === '..') return null;
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');   // 1.234,5
  else if (/^-?\d+,\d+$/.test(s)) s = s.replace(',', '.');                                  // 12,5
  else s = s.replace(/,/g, '');                                                             // 1,234.5
  var n = Number(s.replace(/[^0-9.\-eE]/g, ''));
  return isNaN(n) ? null : n;
}

function guessDelimiter_(text) {
  var line = String(text).split(/\r?\n/)[0] || '';
  var counts = { ',': 0, ';': 0, '\t': 0 };
  for (var i = 0; i < line.length; i++) if (counts[line[i]] !== undefined) counts[line[i]]++;
  return Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0];
}

function shortHost_(url) {
  var m = String(url).match(/^https?:\/\/([^\/?#]+)/i);
  return m ? m[1] : url;
}

// ============================================================================
// HELPERS
// ============================================================================

function freshSheet_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (sh) {
    sh.clear(); sh.clearConditionalFormatRules();
    sh.getDataRange().clearDataValidations();
    sh.getCharts().forEach(function (c) { sh.removeChart(c); });
    sh.setFrozenRows(0); sh.setFrozenColumns(0);
  } else {
    sh = ss.insertSheet(name);
  }
  return sh;
}

function writeTable_(sh, head, rows) {
  sh.getRange(1, 1, 1, head.length).setValues([head]);
  styleHeader_(sh.getRange(1, 1, 1, head.length));
  if (rows.length) sh.getRange(2, 1, rows.length, head.length).setValues(rows).setWrap(true).setVerticalAlignment('top');
  sh.setFrozenRows(1);
}

function styleHeader_(range) {
  range.setBackground(COLORS.header).setFontColor(COLORS.headerText).setFontWeight('bold')
    .setWrap(true).setVerticalAlignment('middle');
}

function colLetter_(n) {
  var s = '';
  while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

function firstEmptyRow_(sh) {
  var last = sh.getLastRow();
  if (last < 2) return 2;
  var colA = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < colA.length; i++) if (String(colA[i][0]) === '') return i + 2;
  return last + 1;
}

function orderSheets_(ss) {
  SHEET_ORDER.forEach(function (key, i) {
    var sh = ss.getSheetByName(SHEETS[key]);
    if (sh) { ss.setActiveSheet(sh); ss.moveActiveSheet(i + 1); }
  });
}

function removeDefaultSheet_(ss) {
  ['Sheet1', 'Tabellenblatt1', 'Feuille 1', 'Blad1', 'Hoja 1'].forEach(function (nm) {
    var sh = ss.getSheetByName(nm);
    if (sh && sh.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(sh);
  });
}

function log_(action, msg) {
  var sh = SpreadsheetApp.getActive().getSheetByName(SHEETS.LOG);
  if (!sh) return;
  sh.appendRow([new Date(), action, msg]);
}
