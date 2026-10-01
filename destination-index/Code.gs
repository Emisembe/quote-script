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
var VERSION = '1.7.0';

// Where "Update code" downloads the newest version from (changeable in the menu).
var DEFAULT_UPDATE_URL =
  'https://raw.githubusercontent.com/emisembe/quote-script/claude/friendly-hopper-iizkrp/destination-index/Code.gs';
var BACKUP_SHEET = '_CodeBackup';

var SHEETS = {
  GUIDE: 'Guide',
  DASHBOARD: 'Dashboard',
  FINDINGS: 'Findings & Advice',
  DATA: 'Data',
  EVIDENCE: 'Evidence',
  WEIGHTS: 'Weights',
  SCORES: 'Scores',
  INDICATORS: 'Indicators',
  SOURCES: 'Sources',
  RUBRICS: 'Rubrics',
  PROFESSIONS: 'Professions',
  ORGS: 'Organisations',
  POLICIES: 'Policies',
  ACTIVITY: 'Policy Activity',
  POLICY_ANALYSIS: 'Policy Analysis',
  LOG: 'Log'
};
var SHEET_ORDER = ['GUIDE', 'DASHBOARD', 'FINDINGS', 'DATA', 'PROFESSIONS', 'ORGS', 'POLICY_ANALYSIS', 'POLICIES', 'ACTIVITY', 'EVIDENCE', 'WEIGHTS', 'SCORES',
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
    .addItem('Go to Findings & Advice', 'goFindings')
    .addItem('Go to Data', 'goData')
    .addItem('Go to Sources', 'goSources')
    .addItem('Go to Professions in demand', 'goProfessions')
    .addItem('Go to Organisations', 'goOrganisations')
    .addItem('Go to Policy Analysis', 'goPolicyAnalysis')
    .addItem('Go to Policies', 'goPolicies')
    .addItem('Go to Policy Activity', 'goActivity')
    .addSeparator()
    .addSubMenu(SpreadsheetApp.getUi().createMenu('Code updates')
      .addItem('Update code to the latest version', 'updateCode')
      .addItem('Restore previous code (undo last update)', 'restorePreviousCode')
      .addItem('Update settings (link / token)', 'updateSettings')
      .addItem('About / current version', 'showAbout'))
    .addSeparator()
    .addItem('Reset everything (deletes your data)', 'resetEverything')
    .addToUi();
}

function goGuide() { goTo_(SHEETS.GUIDE); }
function goDashboard() { goTo_(SHEETS.DASHBOARD); }
function goFindings() { goTo_(SHEETS.FINDINGS); }
function goData() { goTo_(SHEETS.DATA); }
function goSources() { goTo_(SHEETS.SOURCES); }
function goProfessions() { goTo_(SHEETS.PROFESSIONS); }
function goOrganisations() { goTo_(SHEETS.ORGS); }
function goPolicyAnalysis() { goTo_(SHEETS.POLICY_ANALYSIS); }
function goPolicies() { goTo_(SHEETS.POLICIES); }
function goActivity() { goTo_(SHEETS.ACTIVITY); }
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
  '<button class="btn sec" onclick="run(\'goFindings\')">Go to Findings &amp; Advice</button>' +
  '<button class="btn sec" onclick="run(\'goData\')">Go to Data</button>' +
  '<button class="btn sec" onclick="run(\'goSources\')">Go to Sources</button>' +
  '<button class="btn sec" onclick="run(\'goProfessions\')">Go to Professions in demand</button>' +
  '<button class="btn sec" onclick="run(\'goOrganisations\')">Go to Organisations</button>' +
  '<button class="btn sec" onclick="run(\'goPolicyAnalysis\')">Go to Policy Analysis</button>' +
  '<button class="btn sec" onclick="run(\'goPolicies\')">Go to Policies</button>' +
  '<button class="btn sec" onclick="run(\'goActivity\')">Go to Policy Activity</button>' +
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

  '<h3>Code updates</h3>' +
  '<button class="btn sec" onclick="run(\'updateCode\')">Update code to the latest version</button>' +
  '<button class="btn sec" onclick="run(\'restorePreviousCode\')">Restore previous code</button>' +
  '<div class="hint">Version ' + VERSION + '. After an update, reload the Sheet.</div>' +

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
  if (!ss.getSheetByName(SHEETS.PROFESSIONS)) buildProfessions_(ss);
  if (!ss.getSheetByName(SHEETS.ORGS)) buildOrganisations_(ss);
  if (!ss.getSheetByName(SHEETS.POLICIES)) buildPolicies_(ss);
  if (!ss.getSheetByName(SHEETS.ACTIVITY)) buildActivity_(ss);
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
  var lines = guideLines_();
  var st = {
    title: { size: 20, weight: 'bold', color: COLORS.title, bg: '#FFFFFF', family: 'Arial' },
    sub: { size: 10, weight: 'normal', color: '#555555', bg: '#FFFFFF', family: 'Arial' },
    h: { size: 12, weight: 'bold', color: COLORS.headerText, bg: COLORS.header, family: 'Arial' },
    h2: { size: 10, weight: 'bold', color: COLORS.title, bg: '#E8EEF5', family: 'Arial' },
    code: { size: 9, weight: 'normal', color: '#222222', bg: '#F4F4F4', family: 'Roboto Mono' },
    tip: { size: 10, weight: 'normal', color: '#222222', bg: '#FFF8E1', family: 'Arial' },
    warn: { size: 10, weight: 'normal', color: '#222222', bg: '#FDECEA', family: 'Arial' },
    text: { size: 10, weight: 'normal', color: '#222222', bg: '#FFFFFF', family: 'Arial' }
  };
  var fmt = lines.map(function (l) { return st[l[1]] || st.text; });
  var col = function (k) { return fmt.map(function (x) { return [x[k]]; }); };
  sh.getRange(1, 1, lines.length, 1)
    .setValues(lines.map(function (l) { return [l[0]]; }))
    .setWrap(true).setVerticalAlignment('top')
    .setFontSizes(col('size')).setFontWeights(col('weight')).setFontColors(col('color'))
    .setBackgrounds(col('bg')).setFontFamilies(col('family'))
    .setFontStyles(lines.map(function (l) { return [l[1] === 'sub' ? 'italic' : 'normal']; }));
  sh.setColumnWidth(1, 1000);
  sh.setHiddenGridlines(true);
  sh.setFrozenRows(1);
}

/** The Guide text. Each entry: [text, style]. Styles: title, sub, h, h2, text, code, tip, warn. */
function guideLines_() {
  var I = function (code) {
    for (var i = 0; i < DEFAULT_INDICATORS.length; i++) if (DEFAULT_INDICATORS[i][0] === code) return DEFAULT_INDICATORS[i];
    return ['', '', '', '', '', '', '', ''];
  };
  var ind = function (code, what, why, where, enter) {
    var x = I(code);
    return [
      [code + ' - ' + x[2] + '   [' + x[1] + ' | ' + x[3] + ' | unit: ' + x[4] + ']', 'h2'],
      ['What it measures: ' + what, 'text'],
      ['Why it matters: ' + why, 'text'],
      ['Where to find it: ' + where + (x[7] ? '   Link: ' + x[7] : ''), 'text'],
      ['How to enter it: ' + enter, 'text']
    ];
  };
  var L = [];
  var add = function (rows) { rows.forEach(function (r) { L.push(r); }); };
  var blank = function () { L.push(['', '']); };

  add([
    ['African Talent Destination Index - Guide', 'title'],
    ['THE QUESTION THIS TOOL ANSWERS: ' + THE_QUESTION, 'h2'],
    ['Version ' + VERSION + '. This tab explains everything: setup, every button, every tab, every indicator, the maths, adding your own links, updating the code, and fixing problems.', 'sub'],
    ['Contents: 1 What this tool is | 2 First-time setup | 3 Menu | 4 Control panel | 5 Recommended workflow | 6 The tabs | 7 The indicators | ' +
     '8 Source links (Eurostat & CSV) | 9 Adding indicators & countries | 10 How the score is calculated | 11 Weights & thresholds | ' +
     '12 Reading the Dashboard | 13 Evidence rules | 14 Updating the code | 15 Troubleshooting | 16 FAQ | 17 Glossary | 18 Limits | ' +
     '19 Professions in demand | 20 Organisations that influence policy | 21 Findings & Advice | 22 Policies & who drives them | 23 Policy Analysis', 'sub']
  ]); blank();

  // 1
  add([
    ['1. WHAT THIS TOOL IS', 'h'],
    ['The question: is a given European country a realistic destination for an African university graduate who wants a career that matches their skills?', 'text'],
    ['You cannot measure "meritocracy" directly. So the tool measures what a merit-based system should produce, and compares countries on it:', 'text'],
    ['   Access - can I legally get in and have my degree accepted?', 'text'],
    ['   Fairness - once there, are my skills used and rewarded like a local person\'s?', 'text'],
    ['   Reward - is it financially worth it after the cost of living?', 'text'],
    ['   Settlement - can I build a stable life (residence, citizenship, language, community)?', 'text'],
    ['Every number comes from a source you can check (Eurostat, OECD, government sites, published studies). Each country gets a score from 0 to 100 and a verdict.', 'text'],
    ['What it is NOT: a prediction of your personal success. It shows the terrain - your profession, language level and recognition status decide how you move on it.', 'warn']
  ]); blank();

  // 2
  add([
    ['2. FIRST-TIME SETUP', 'h'],
    ['Step 1. Create a new, empty Google Sheet (sheets.new).', 'text'],
    ['Step 2. Extensions > Apps Script. Delete everything in Code.gs, paste the full code, click Save (disk icon).', 'text'],
    ['Step 3. Go back to the Sheet and reload the page (F5). After a few seconds the menu "Destination Index" appears next to "Help".', 'text'],
    ['Step 4. Destination Index > Build / repair the sheet. Google asks for permission the first time:', 'text'],
    ['   Click Continue > choose your account > "Google hasn\'t verified this app" > Advanced > Go to (project name) > Allow.', 'code'],
    ['   This warning is normal for your own scripts. The script only works inside this Sheet and fetches data from the links in the Sources tab.', 'code'],
    ['Step 5. Destination Index > Open control panel (buttons). A panel opens on the right with all actions.', 'text'],
    ['Step 6. Later, when a new version is announced: Code updates > Update code to the latest version (section 14).', 'text'],
    ['Tip: if the menu does not appear, reload the Sheet again, or in Apps Script select the function "onOpen" and click Run once.', 'tip']
  ]); blank();

  // 3
  add([
    ['3. THE MENU "Destination Index"', 'h'],
    ['Open control panel (buttons) - opens the sidebar with buttons and forms (section 4).', 'text'],
    ['Build / repair the sheet - creates any missing tab, rebuilds Guide, Rubrics, Scores and Dashboard. It NEVER deletes your Data, Evidence, Weights, Indicators or Sources. Use it any time something looks broken.', 'text'],
    ['Fetch data from all sources - goes through every enabled row in Sources, downloads the data, writes the values into Data, adds a note on each cell and logs each value in Evidence.', 'text'],
    ['Refresh scores & dashboard - regenerates all formulas for the current list of countries and indicators. Use after adding/removing rows or columns by hand.', 'text'],
    ['Add a source link / Add an indicator / Add a country - open the control panel directly at that form.', 'text'],
    ['Go to Guide / Dashboard / Data / Sources - jump to that tab.', 'text'],
    ['Code updates > Update code to the latest version - downloads the newest code and opens a window to install it in 4 clicks (section 14).', 'text'],
    ['Code updates > Restore previous code - go back to an earlier version (section 14).', 'text'],
    ['Code updates > Update settings - change the download link, or add a GitHub token for a private repository.', 'text'],
    ['Code updates > About / current version - shows the installed version and the update link.', 'text'],
    ['Reset everything - deletes ALL tool tabs including your data and rebuilds them with defaults. Asks for confirmation. Use only to start over.', 'warn']
  ]); blank();

  // 4
  add([
    ['4. THE CONTROL PANEL (SIDEBAR)', 'h'],
    ['Actions: the same buttons as the menu. While a button is working, all buttons are greyed out; the result appears in the grey box at the bottom.', 'text'],
    ['Add a source link:', 'h2'],
    ['   Indicator - which indicator this link fills (A1, F2, ...).', 'text'],
    ['   Type - "Eurostat" or "CSV link" (section 8 explains both).', 'text'],
    ['   Link or dataset code - the link you copied, or a Eurostat code like ilc_di03.', 'text'],
    ['   Filters A / Filters B / Since year - Eurostat only. B is optional; when filled, the value written = A minus B.', 'text'],
    ['   CSV: country / value / year column - CSV only. Type the column header exactly as it appears in the file (upper/lower case does not matter).', 'text'],
    ['   Note - your own comment. "Fetch it now" - downloads immediately after saving.', 'text'],
    ['Add an indicator: code (short, unique, e.g. F4), pillar, name, direction (higher or lower is better), unit, source name and link.', 'text'],
    ['Add a country: name and Eurostat code (two letters, Greece = EL).', 'text'],
    ['Code updates: update / restore buttons, and the installed version number.', 'text']
  ]); blank();

  // 5
  add([
    ['5. RECOMMENDED WORKFLOW', 'h'],
    ['1) Decide your profile: which profession/level are you scoring for? Write it in the Data "Notes" column so the ratings stay consistent.', 'text'],
    ['2) Fetch data from all sources. Check the Sources "Last status" column: every row should say OK. Fix any ERROR (section 15).', 'text'],
    ['3) Fill the manual indicators country by country, using the links in the Indicators tab and the Rubrics tab for 0-10 ratings.', 'text'],
    ['4) Log every manual value in Evidence (section 13).', 'text'],
    ['5) Set your Weights (section 11).', 'text'],
    ['6) Read the Dashboard. Look at the pillar scores, not only the total: a country can be rich (Reward) but closed (Access).', 'text'],
    ['7) Repeat once a year: fetch again, update manual values, compare with last year.', 'text'],
    ['Tip: before changing anything big, make a copy of the whole Sheet (File > Make a copy) so you keep last year\'s result.', 'tip']
  ]); blank();

  // 6
  add([
    ['6. THE TABS IN DETAIL', 'h'],
    ['Guide - this page. Rebuilt on every "Build / repair", so do not write your own notes here.', 'text'],
    ['Dashboard - read-only. A ranked table (best first) with the Destination Score, the four pillar scores, data coverage and verdict, plus a bar chart. Countries with no score yet are listed underneath.', 'text'],
    ['Data - the only place for numbers.', 'text'],
    ['   Row 1 = indicator codes. Row 2 = direction (1 = higher is better, -1 = lower is better). Row 3 = description. Rows 2-3 are filled from the Indicators tab - edit them there, not here.', 'code'],
    ['   Column A = country name, column B = Eurostat code (used by the automatic fetch and CSV matching). Yellow cells = your input. Last column = Notes.', 'code'],
    ['   Rating columns (unit "rating 0-10") only accept numbers from 0 to 10. Hover over an auto-fetched cell to see its source and year.', 'code'],
    ['Evidence - one row per value: country, indicator code, value, data year, source title, link, date accessed, notes. Auto-fetched values are logged here automatically.', 'text'],
    ['Weights - row 2 = weight of each pillar. B5 = minimum score for "Destination", B6 = minimum for "Conditional", B7 = minimum share of indicators that must be filled before a verdict is given.', 'text'],
    ['Scores - calculations only (green cells). One column per indicator (0-100), then the four pillar scores, the Destination Score, coverage, verdict and rank. Do not type here; it is rebuilt on Refresh.', 'text'],
    ['Indicators - the list of indicators: code, pillar, name, direction, unit, how to get it, source, link. This tab is yours: edit names, directions or links, add rows. Then click Refresh.', 'text'],
    ['Sources - the links the script downloads from. One row per link. Columns: Indicator, Type, Link, Filters A, Filters B, Since year, CSV country/value/year column, Enabled (tick box), Note, Last status (written by the script).', 'text'],
    ['Rubrics - the fixed rules for 0-10 ratings (A1, A3, S3). Use them so every country is judged the same way.', 'text'],
    ['Policy Analysis - charts and findings on which policies help African talent uptake, who drives them and which barriers are neglected (section 23).', 'text'],
    ['Policies - tracker of policies with their barrier, effect, stage and a strength score (section 22). Policy Activity - your log of what organisations actually do.', 'text'],
    ['Findings & Advice - the answer in plain language: one-sentence answer, what it means, country-by-country advice and two charts (section 21).', 'text'],
    ['Professions - which professions are in shortage in each country, with links to the official lists (section 19).', 'text'],
    ['Organisations - bodies that shape migration, labour and anti-discrimination policy, and how to engage with them (section 20).', 'text'],
    ['Log - a diary of what the script did: setup, each fetch, errors, code updates.', 'text'],
    ['_CodeBackup (hidden) - copy of the code from before the last update. Used by "Restore previous code". Do not edit.', 'text']
  ]); blank();

  // 7
  L.push(['7. THE INDICATORS ONE BY ONE', 'h']);
  L.push(['Direction tells the maths which way is good. "Lower is better" means a smaller number gives a higher score (e.g. a smaller discrimination gap).', 'text']);
  add(ind('A1', 'whether there is a realistic legal route to work there in your profession.',
    'without a visa route, nothing else matters.',
    'EU Immigration Portal (country page > "EU Blue Card" and national work permits) and the national shortage-occupation list (Germany: Engpassberufe / make-it-in-germany.com; Netherlands: IND; France: "metiers en tension"; Ireland: Critical Skills Occupations List).',
    'rating 0-10 using the Rubrics tab. Log the page you used in Evidence.'));
  add(ind('A2', 'the minimum gross yearly salary an employer must pay for an EU Blue Card.',
    'a lower threshold means more employers can hire you. Lower is better.',
    'EU Immigration Portal > country > EU Blue Card. If there is a lower threshold for shortage occupations and you qualify, use the lower one and note it.',
    'number in EUR per year, e.g. 45300. Use the current year\'s figure.'));
  add(ind('A3', 'how hard it is to get an African degree accepted.',
    'without recognition you may be forced into lower-skilled work (over-qualification).',
    'the national ENIC-NARIC centre (Germany: anabin database + ZAB; Netherlands: Nuffic; France: ENIC-NARIC France; Ireland: QQI).',
    'rating 0-10 using the Rubrics tab. Regulated professions (medicine, nursing, law, teaching, engineering titles) usually score lower.'));
  add(ind('F1', 'how much more often non-EU workers with a degree end up in jobs below their level, compared with nationals.',
    'this is the clearest sign that foreign skills are wasted ("brain waste").',
    'Eurostat, over-qualification rates by citizenship or country of birth (migrant integration statistics). Filled automatically by the default Sources row.',
    'percentage points: non-EU rate minus national rate. Example: 38% - 20% = 18.'));
  add(ind('F2', 'the employment-rate difference between native-born and non-EU-born people with a degree (ISCED 5-8).',
    'shows whether graduates from outside the EU get jobs at all.',
    'Eurostat lfsa_ergaedcob. Filled automatically (A = native-born, B = non-EU-born, value = A - B).',
    'percentage points. Example: 88% - 72% = 16. Smaller gap = better.'));
  add(ind('F3', 'hiring discrimination: how many more call-backs a native applicant gets than an identical applicant with an African or minority-origin name.',
    'measures bias at the door, the stage where the evidence shows the biggest gap.',
    'published CV field experiments ("correspondence tests"), e.g. the GEMM project, national studies (Germany: SVR / DeZIM; France: DARES "testing"; Netherlands: SCP). Look for the call-back ratio or rates.',
    'ratio = native call-back rate / minority call-back rate. Example: 24% / 16% = 1.5. 1.0 = no difference. Leave empty if no study exists for that country - empty is skipped, not counted as 0.'));
  add(ind('R1', 'median disposable income per person, adjusted for prices (PPS = purchasing power standard).',
    'shows what money is actually worth there, so rich-but-expensive countries are compared fairly.',
    'Eurostat ilc_di03. Filled automatically.',
    'PPS per year, e.g. 23500.'));
  add(ind('R2', 'the typical gross yearly salary in YOUR profession.',
    'national averages hide big differences between professions.',
    'national statistics offices and salary surveys (Germany: Destatis / Entgeltatlas of the Bundesagentur fuer Arbeit; Netherlands: CBS; France: INSEE / APEC; Ireland: CSO).',
    'EUR per year. Optional: leave empty for all countries if you have no reliable figure (then it is simply ignored).'));
  add(ind('R3', 'overall price level compared with the EU average (EU27 = 100).',
    'the same salary buys less in an expensive country. Lower is better.',
    'Eurostat prc_ppp_ind. Filled automatically.',
    'index, e.g. 108.'));
  add(ind('S1', 'years of legal residence needed before permanent residence for a skilled worker (Blue Card routes are often shorter).',
    'permanent residence ends dependence on one employer.',
    'national immigration authority, EU Immigration Portal.',
    'years, e.g. 2 or 5. Use the fastest route you would realistically qualify for, and note which one.'));
  add(ind('S2', 'years of residence needed for citizenship under the standard route.',
    'citizenship means full rights and free movement in the EU.',
    'national citizenship law / authority website.',
    'years. Note if dual citizenship is allowed - relevant for many Africans.'));
  add(ind('S3', 'how usable English is at work before you master the local language.',
    'language is the biggest practical barrier in the first years.',
    'your own job-board sample (see Rubrics tab tip).',
    'rating 0-10 using the Rubrics tab.'));
  add(ind('S4', 'the size of the African-born population.',
    'a community means networks, information, food, churches/mosques, and less isolation.',
    'UN DESA International Migrant Stock (by destination and origin; sum the African countries of origin) or national statistics.',
    'thousands of people, e.g. 850.'));
  blank();

  // 8
  add([
    ['8. SOURCE LINKS - ADDING YOUR OWN', 'h'],
    ['A source is a row in the Sources tab that tells the script where to download values for one indicator. Add with the control panel ("Add a source link") or type a row directly. The Enabled tick box must be ticked.', 'text'],
    ['A) EUROSTAT', 'h2'],
    ['Paste any of these into "Link or dataset code":', 'text'],
    ['   Data-browser link:  https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en', 'code'],
    ['   API link:           https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/ilc_di03?unit=PPS&sex=T', 'code'],
    ['   Only the code:      ilc_di03', 'code'],
    ['How to find a dataset: go to ec.europa.eu/eurostat, search (e.g. "over-qualification country of birth"), open the table, copy the link from the address bar.', 'text'],
    ['Filters: a dataset has several "dimensions" (sex, age, unit, education...). You must choose ONE value for each, except country (geo) and year (time), which the script handles.', 'text'],
    ['   Write filters as  dimension=code  joined with &.  Example:  sex=T&age=Y25-64&isced11=ED5-8&c_birth=NAT', 'code'],
    ['   To find the codes: in the data browser click the settings/filter icon of each dimension, or download the table as CSV "with codes"; codes like T (total), Y25-64, ED5-8, PPS, NAT are shown there.', 'code'],
    ['   If you forget a dimension, the fetch still works but "Last status" warns "... has N categories, first one used - add a filter for it". Fix it, because the first category may be the wrong one.', 'code'],
    ['Filters B (gap): if you fill B, the script downloads A and B separately and writes A minus B, using the latest year both have. Used for F1 and F2 (e.g. A = native-born, B = non-EU-born).', 'text'],
    ['Since year: the earliest year to look at. The script always takes the LATEST year available per country, and writes that year in the cell note and Evidence.', 'text'],
    ['Country codes come from Data column B. Eurostat uses EL for Greece and two-letter codes for others.', 'text'],
    ['B) CSV LINK (any other source)', 'h2'],
    ['Any link that downloads a CSV file works: a statistics office "download CSV" link, an OECD CSV export, a GitHub "raw" file, or your own Google Sheet.', 'text'],
    ['To use your own Google Sheet as a source: put a table with at least a country column and a value column in a tab, then File > Share > Publish to web > choose that tab > "Comma-separated values (.csv)" > Publish, and copy the link.', 'text'],
    ['Fill: CSV country column = header of the column with countries; CSV value column = header of the column with numbers; CSV year column = optional header of the year column.', 'text'],
    ['   Countries are matched by code (DE) or name (Germany), and "DE:Germany" style values also work.', 'code'],
    ['   With a year column: the latest year per country is used. Without: the first row per country is used (and a warning shows if there were more).', 'code'],
    ['   Numbers like 1,234.5 / 1.234,5 / 12,5 / 45% are understood. Empty, ":" or ".." is treated as missing.', 'code'],
    ['   Separators , ; and tab are detected automatically.', 'code'],
    ['C) AFTER ADDING', 'h2'],
    ['Click Fetch data from all sources (or tick "Fetch it now"). Check "Last status": OK 2026-..: 7/7 countries means success; "No data: XX" lists countries the source does not cover.', 'text'],
    ['A fetch never overwrites a value you typed yourself: it only fills empty cells and cells it filled before (those have a "fetched" note). "Last status" lists the countries where your manual value was kept. To let the fetch replace a manual value, clear that cell first.', 'tip'],
    ['Evidence is kept tidy: when a value is fetched again, its earlier auto-fetched Evidence row is updated instead of adding a duplicate.', 'text']
  ]); blank();

  // 9
  add([
    ['9. ADDING / REMOVING INDICATORS AND COUNTRIES', 'h'],
    ['Add an indicator: control panel > "Add an indicator". A new row appears in Indicators and a new yellow column in Data (before Notes). The indicator is automatically part of its pillar\'s average.', 'text'],
    ['   Choose the direction carefully: "Higher is better" (income, employment) or "Lower is better" (gaps, costs, waiting years).', 'code'],
    ['Edit an indicator: change its row in the Indicators tab (name, pillar, direction, unit, links), then Refresh scores & dashboard.', 'text'],
    ['Remove an indicator: delete its row in Indicators AND its column in Data, then Refresh. (Its Sources rows can be deleted or unticked.)', 'text'],
    ['Add a country: control panel > "Add a country" (name + code). Then Fetch data to fill its automatic values.', 'text'],
    ['Remove a country: delete its row in Data (right-click the row number > Delete row), then Refresh. Do not leave an empty row in the middle - countries after an empty row are ignored.', 'text'],
    ['Changing the four pillars themselves requires editing the code (PILLARS and Weights) - ask for a code update instead.', 'tip']
  ]); blank();

  // 10
  add([
    ['10. HOW THE SCORE IS CALCULATED', 'h'],
    ['Step 1 - each indicator becomes a score from 0 to 100 by comparing the listed countries (min-max scaling):', 'text'],
    ['   Higher is better:  score = (value - lowest) / (highest - lowest) x 100', 'code'],
    ['   Lower is better:   score = (highest - value) / (highest - lowest) x 100', 'code'],
    ['   If all countries have the same value, everyone gets 100. Empty cells get no score (they are skipped).', 'code'],
    ['Step 2 - pillar score = average of that pillar\'s indicator scores (only the ones that have data).', 'text'],
    ['Step 3 - Destination Score = weighted average of the pillar scores, using the Weights tab. Pillars with no data are left out and the remaining weights are re-scaled.', 'text'],
    ['Step 4 - Data coverage = share of indicators filled for that country. Below the minimum (Weights B7, default 60%) the verdict is "Insufficient data".', 'text'],
    ['   Also "Insufficient data" when a pillar that has a weight has no data at all (Weights B8, ticked by default) - otherwise a country could look good just because its weak pillar is empty.', 'code'],
    ['Step 5 - verdict: score >= 70 Destination | 50 to 69 Conditional | below 50 Not recommended. Rank 1 = highest score.', 'text'],
    ['WORKED EXAMPLE (made-up numbers)', 'h2'],
    ['F2 employment gap (lower is better): Germany 16, Netherlands 10, Spain 22. Highest 22, lowest 10.', 'text'],
    ['   Germany = (22 - 16) / (22 - 10) x 100 = 50      Netherlands = (22 - 10) / 12 x 100 = 100      Spain = (22 - 22) / 12 x 100 = 0', 'code'],
    ['If Germany\'s Fairness indicators score 40 (F1), 50 (F2) and F3 is empty, Fairness = (40 + 50) / 2 = 45.', 'text'],
    ['With pillar scores Access 60, Fairness 45, Reward 80, Settlement 70 and weights 30/30/25/15:', 'text'],
    ['   (60x30 + 45x30 + 80x25 + 70x15) / 100 = (1800 + 1350 + 2000 + 1050) / 100 = 62  ->  Conditional', 'code'],
    ['Because scores are relative, "100" means best of the countries in this sheet, not perfect.', 'warn']
  ]); blank();

  // 11
  add([
    ['11. WEIGHTS AND THRESHOLDS', 'h'],
    ['Weights say how much each pillar counts. Default: Access 30, Fairness 30, Reward 25, Settlement 15. They do not have to add up to 100.', 'text'],
    ['Examples: career-first profile -> Fairness 40, Reward 30, Access 20, Settlement 10.  Family-first profile -> Settlement 30, Access 30, Fairness 25, Reward 15.', 'text'],
    ['Set a weight to 0 to ignore a pillar completely.', 'text'],
    ['Thresholds (B5, B6) decide the verdict labels; B7 decides how much data is needed before any verdict is given; B8 (tick box) requires at least one value in every weighted pillar.', 'text'],
    ['Good practice: decide the weights BEFORE looking at the results, and write your reason in the Weights tab, so you are not tempted to push a favourite country up.', 'tip']
  ]); blank();

  // 12
  add([
    ['12. READING THE DASHBOARD', 'h'],
    ['Destination (green) - strong on most pillars relative to the others: worth serious planning.', 'text'],
    ['Conditional (yellow) - possible, usually with conditions: language first, recognition first, or only in certain professions/cities. Look at which pillar is weak.', 'text'],
    ['Not recommended (red) - weaker than the alternatives in this comparison. Not "impossible" - just not the best use of your effort.', 'text'],
    ['Insufficient data (grey) - too many empty indicators to judge. Fill more data first.', 'text'],
    ['Always compare pillar scores: e.g. Reward 90 but Fairness 20 means good money for those who get skilled jobs, but many graduates end up below their level.', 'tip']
  ]); blank();

  // 13
  add([
    ['13. EVIDENCE RULES', 'h'],
    ['Every value in Data must be traceable. For manual values, add a row in Evidence: country, indicator code, value, the year the data refers to, source title, link, the date you looked, notes.', 'text'],
    ['Prefer official sources (Eurostat, OECD, national statistics, government) over blogs and news. For studies, cite the study, not an article about it.', 'text'],
    ['Write in Notes when a value is a proxy (e.g. "non-EU" instead of "African", "by citizenship" instead of "by country of birth").', 'text'],
    ['If sources disagree, use the official one and mention the other in Notes.', 'text']
  ]); blank();

  // 14
  add([
    ['14. UPDATING THE CODE', 'h'],
    ['Everything lives in this one code file. When a new version is published, you update from the menu: Destination Index > Code updates > Update code to the latest version (also in the control panel).', 'text'],
    ['What happens:', 'h2'],
    ['1) The script downloads the newest Code.gs from the update link (GitHub) and checks that it really is this tool (name, version, menu). If not, nothing changes.', 'text'],
    ['2) It shows the installed and the new version number and asks you to confirm.', 'text'],
    ['3) A window opens with 4 steps:', 'text'],
    ['   Step 1 - click "Copy code".   Step 2 - click "Open the Apps Script editor".', 'code'],
    ['   Step 3 - click inside Code.gs, press Ctrl+A then Ctrl+V (Mac: Cmd+A, Cmd+V), then Ctrl+S to save.', 'code'],
    ['   Step 4 - come back, reload the Sheet (F5), then Destination Index > Build / repair the sheet.', 'code'],
    ['   If "Copy code" does not copy (some browsers block it), the code is selected in the box - press Ctrl+C. Or use "Download Code.gs instead" and paste from the file.', 'code'],
    ['4) Your Data, Evidence, Weights, Indicators and Sources stay exactly as they are. New tabs or formulas appear after Build / repair.', 'text'],
    ['Check your version: Code updates > About / current version (also shown in the control panel).', 'text'],
    ['Going back to an older version: Code updates > Restore previous code. Every earlier version is kept on GitHub (the message shows the link): open the version, click "Raw", copy all, paste over Code.gs, save.', 'text'],
    ['Update settings: change the download link (e.g. to the "main" branch or your own copy) or add a GitHub token if the repository becomes private. The token is stored only for your Google account.', 'text'],
    ['OPTIONAL - fully automatic install (no copy-paste)', 'h2'],
    ['Google only allows a script to rewrite itself after an extra permission. If you want the button to install by itself and keep a backup in this Sheet, do this once:', 'text'],
    ['a) Open https://script.google.com/home/usersettings and switch "Google Apps Script API" ON.', 'code'],
    ['b) Apps Script editor > Project Settings (gear) > tick "Show appsscript.json manifest file in editor".', 'code'],
    ['c) Open appsscript.json, replace everything with the text on the next line, save:', 'code'],
    [OPTIONAL_MANIFEST, 'code'],
    ['d) Click Update again and accept the new permission. From then on the update installs by itself; if anything fails it falls back to the copy-paste window.', 'code'],
    ['You never need this optional part - the copy-paste update always works.', 'tip']
  ]); blank();

  // 15
  add([
    ['15. TROUBLESHOOTING', 'h'],
    ['Menu does not appear -> reload the Sheet; or in Apps Script run "onOpen" once.', 'text'],
    ['"Authorization required" / permission screen -> accept it (section 2). It appears again after an update that needs new permissions.', 'text'],
    ['Sources status "HTTP 400 ... " -> a filter code or dimension name is wrong. Check the codes in the Eurostat data browser.', 'text'],
    ['Sources status "HTTP 404" -> dataset code or link is wrong, or the dataset was renamed by Eurostat.', 'text'],
    ['Sources status "... has N categories, first one used" -> add a filter for that dimension.', 'text'],
    ['Sources status "No data: XX" -> that source has no value for those countries in the chosen years. Lower "Since year" or fill by hand.', 'text'],
    ['Sources status "Country column ... not found. Headers: ..." -> the CSV header is spelled differently; copy it exactly from the list shown.', 'text'],
    ['Sources status "indicator XX not found" -> the code in Sources does not exist in the Indicators tab.', 'text'],
    ['Scores all empty -> no numbers in Data yet, or the Data header codes do not match Indicators. Run Build / repair.', 'text'],
    ['Dashboard says "No scores yet" -> fill Data or fetch; also check Weights row 2 is not all zero.', 'text'],
    ['A country is missing from Scores -> there is an empty row above it in Data. Delete the empty row and Refresh.', 'text'],
    ['"Exceeded maximum execution time" -> too many sources at once. Untick some, fetch, then tick the rest and fetch again.', 'text'],
    ['Update: "Could not download (HTTP 404)" -> the update link is wrong; fix it in Code updates > Update settings. "HTTP 401/403" -> repository is private: add a GitHub token there.', 'text'],
    ['Update: after pasting, the menu is gone -> the paste was incomplete or the old code was not fully replaced. Open the editor, Ctrl+A, paste again, save, reload.', 'text'],
    ['Everything is broken -> Build / repair first. If still broken, File > Version history to go back, or Restore previous code.', 'text'],
    ['The Log tab records every action and error with a time stamp - check it first.', 'tip']
  ]); blank();

  // 16
  add([
    ['16. FAQ', 'h'],
    ['Can I score a specific profession? Yes: rate A1/A3/S3 for that profession, fill R2 with its salary, and write the profession in Data Notes. Make a copy of the Sheet per profession.', 'text'],
    ['Can I add non-EU countries (UK, Canada, Norway, Switzerland)? Yes, add them as countries. Eurostat covers Norway and Switzerland for many tables; for the UK or Canada use CSV links or manual values.', 'text'],
    ['Why does adding a country change the others\' scores? Scores are relative (min-max). A new best or worst country stretches the scale.', 'text'],
    ['Why "non-EU" and not "African"? Eurostat rarely publishes Africa-only breakdowns for these indicators. Where you find African-specific data, add it as a CSV source and note it.', 'text'],
    ['Is my data shared? No. It stays in your Sheet. The script only downloads from the links you list and from the update link.', 'text']
  ]); blank();

  // 17
  add([
    ['17. GLOSSARY', 'h'],
    ['Blue Card - EU residence and work permit for highly qualified non-EU workers with a job offer above a salary threshold.', 'text'],
    ['Over-qualification - having a degree but working in a job that does not need one.', 'text'],
    ['ISCED 5-8 - tertiary education: short-cycle, bachelor, master, doctorate.', 'text'],
    ['PPS (purchasing power standard) - an artificial currency that removes price differences between countries.', 'text'],
    ['Price level index - how expensive a country is compared with the EU average (100).', 'text'],
    ['Percentage points (pp) - the difference between two percentages (30% - 20% = 10 pp).', 'text'],
    ['Correspondence test / field experiment - researchers send identical CVs that differ only in name or origin and count the call-backs.', 'text'],
    ['Min-max scaling - turning values into 0-100 by comparing with the lowest and highest.', 'text'],
    ['Native-born / non-EU-born - born in the country / born outside the EU. Citizenship-based figures (nationals / non-EU citizens) are a close but different measure.', 'text'],
    ['JSON-stat / CSV - data formats the script can read from Eurostat and other sources.', 'text']
  ]); blank();

  // 18
  add([
    ['18. LIMITS - READ BEFORE USING THE RESULT', 'h'],
    ['- Scores are relative to the countries in the sheet.', 'text'],
    ['- National averages are not your personal outcome; profession, language and recognition status matter more.', 'text'],
    ['- Discrimination studies are few and use different methods; treat F3 as an approximate signal.', 'text'],
    ['- Data is one to three years old by the time it is published.', 'text'],
    ['- Ratings (0-10) contain your judgement - the Rubrics keep them consistent, not objective.', 'text'],
    ['- Use the result to decide where to look deeper, not as the final answer.', 'warn']
  ]); blank();

  // 19
  add([
    ['19. PROFESSIONS IN DEMAND (Professions tab)', 'h'],
    ['Purpose: see at a glance which professions each country officially needs. Shortage professions usually mean easier visas (lower Blue Card threshold, no labour-market test) and faster hiring.', 'text'],
    ['Layout:', 'h2'],
    ['   Rows = professions (column A), with ISCO-08 code (the international job classification), sector and whether the profession is regulated.', 'code'],
    ['   Columns = your countries - the same countries as the Data tab. Adding a country adds a column automatically (after Refresh).', 'code'],
    ['   Row 1 = link to each country\'s official shortage list (above the country name). For a country you add yourself, paste its link in row 1.', 'code'],
    ['   "Countries in shortage" = automatic count: Shortage = 1, Some shortage (regional) = 0.5.', 'code'],
    ['How to fill it:', 'h2'],
    ['1) Open the official list in row 1 for one country (and the yearly EU report on shortage occupations from the European Labour Authority, see Organisations).', 'text'],
    ['2) For each profession choose from the dropdown: Shortage | Some shortage (regional) | Balanced | Surplus | Unknown. Leave empty if you have not checked yet.', 'text'],
    ['3) Log where you found it in the Evidence tab (country, indicator code = the profession name, value = the status, year, link).', 'text'],
    ['4) Refresh scores & dashboard - the Dashboard then shows the 15 most-needed professions.', 'text'],
    ['Official lists used as starting links: Germany - Make it in Germany "professions in demand" (based on the Federal Employment Agency shortage analysis); Netherlands - UWV; France - Ministry of Labour "metiers en tension"; ' +
     'Belgium - regional lists (VDAB for Flanders, Actiris for Brussels, Le Forem for Wallonia); Ireland - Critical Skills Occupations List (Department of Enterprise); Sweden - Arbetsformedlingen occupational forecasts; Spain - SEPE "Catalogo de Ocupaciones de Dificil Cobertura".', 'text'],
    ['Add your own profession: type it in the first empty row under the list (column A), with its ISCO code if you know it. The dropdowns and the count are already there for 30 extra rows; click Refresh for more.', 'text'],
    ['Use the filter buttons in the header row to show only one sector, or sort by "Countries in shortage".', 'text'],
    ['Link to your score: if your own profession is in shortage in a country, give that country a higher A1 rating (Rubrics).', 'tip'],
    ['Regulated professions (health, teaching, law, some engineering) need recognition of your diploma before you can work - even when there is a shortage. Check A3 for that country.', 'warn']
  ]); blank();

  // 20
  add([
    ['20. ORGANISATIONS THAT INFLUENCE POLICY (Organisations tab)', 'h'],
    ['Purpose: know who shapes the rules on skilled migration, recognition of diplomas and discrimination - and where your voice, your data or a complaint can make a difference.', 'text'],
    ['Columns: Organisation | Level (EU, Europe, Global, Africa / AU, Country) | Country | Type | Policy area | How they influence policy | How you can engage | Website | Your status | Your notes.', 'text'],
    ['The list starts with about 30 real organisations: EU institutions and agencies, UN and intergovernmental bodies, think tanks, NGO networks, diaspora platforms, and the national equality bodies of the listed countries.', 'text'],
    ['Types of influence, from strongest to widest reach:', 'h2'],
    ['   EU institutions (Commission, Parliament) write the laws - respond to consultations on the "Have your say" portal and write to your MEPs.', 'code'],
    ['   Agencies and intergovernmental bodies (ELA, FRA, OECD, IOM, ILO, ICMPD) produce the data governments rely on - cite them, feed them evidence.', 'code'],
    ['   Think tanks (CGD, MPI, EPC, SVR, CIDOB) shape the ideas - share your findings with them, join their events.', 'code'],
    ['   NGO and diaspora networks (ENAR, PICUM, ADEPT) organise collective voice - join or partner.', 'code'],
    ['   Equality bodies take individual discrimination complaints - free of charge - and their case numbers feed policy.', 'code'],
    ['How to use the tab:', 'h2'],
    ['1) Filter by Level or Country to find the organisations relevant to your target country.', 'text'],
    ['2) Track your contact in "Your status" (Not contacted, Following, Contacted, In conversation, Partner) and write dates/names in "Your notes".', 'text'],
    ['3) Add your own rows at the bottom (diaspora associations, professional bodies, unions, local integration offices).', 'text'],
    ['4) Once your index has results, share them: a clear, sourced comparison is exactly the kind of evidence these organisations use.', 'text'],
    ['The list is a starting point written at the time of this version. Websites and names change - check each link before relying on it, and note the date in "Your notes".', 'warn']
  ]); blank();

  // 21
  add([
    ['21. FINDINGS & ADVICE (Findings & Advice tab)', 'h'],
    ['Purpose: turn the numbers into answers you can explain to a young African professional - in a conversation, a workshop, a video or a post.', 'text'],
    ['Everything on this tab is calculated automatically from Scores, Professions and your advice wording. Click Refresh scores & dashboard after changing data.', 'text'],
    ['What is on the tab, from top to bottom:', 'h2'],
    ['The question - the question the whole tool answers.', 'text'],
    ['Profession selector (cell B4) - choose the profession of the person you are advising (from the Professions tab list). The advice and the "Your profession here" column then adapt. Leave empty for general advice.', 'text'],
    ['The answer in one sentence - the top 3 countries with score and verdict (countries with insufficient data are left out).', 'text'],
    ['What this means - how many countries are Destination / Conditional / Not recommended; the most common weak point across all countries and what to do about it; the most-needed professions; where the chosen profession is in shortage.', 'text'],
    ['Country by country - for every country: score, verdict, strongest and weakest pillar, the status of the chosen profession, and written advice built from: verdict text + advice for the weakest pillar + profession status.', 'text'],
    ['Advice that holds for every country - six practical steps.', 'text'],
    ['Advice wording - the sentences used in the advice. Change the text in column B to your own words (for example in your voice, or in French or German). Your wording is kept when the tab is rebuilt. Do not change the keys in column A.', 'text'],
    ['Charts (right side) - "Where each country is strong or weak" (the four pillar scores per country) and "Overall Destination Score". They update automatically.', 'text'],
    ['How to use it when advising someone:', 'h2'],
    ['1) Choose their profession in B4.  2) Read the one-sentence answer and the country table together with them.  3) Look at the pillar chart: a country with a tall Reward bar but a short Fairness bar pays well but often under-uses foreign graduates.', 'text'],
    ['4) Agree on one or two target countries and the concrete next step from the advice (recognition, language level, shortage route, employer type).  5) Point them to the Organisations tab for help and rights.', 'text'],
    ['To share: File > Download > PDF (choose "Current sheet") gives a clean handout; or copy a chart (three dots on the chart > Copy chart) into a presentation or post.', 'tip'],
    ['Be honest about limits: national averages, relative scores, and data that is 1-3 years old. Use the tab to guide a decision, not to promise an outcome.', 'warn']
  ]); blank();

  // 22
  add([
    ['22. POLICIES & WHO DRIVES THEM (Policies and Policy Activity tabs)', 'h'],
    ['Second question of the tool: ' + POLICY_QUESTION, 'h2'],
    ['Policies tab - one row per policy or initiative. It starts with about 20 real examples: EU Blue Card and Single Permit, EU Talent Pool and Talent Partnerships, North-Africa mobility programmes, recognition conventions, ' +
     'EU anti-discrimination law, and national schemes (Germany Opportunity Card and citizenship reform, France Talent Passport, Netherlands skilled-migrant scheme and 30% ruling, Ireland Critical Skills permit, Sweden salary threshold, Spain reform).', 'text'],
    ['The starting list is written from general knowledge. Stages, dates and links change: check each row, then put the date in "Status checked on". The Notes column says "Check status and link" until you do.', 'warn'],
    ['Columns:', 'h2'],
    ['   Level / Country / Lead body (pick from the Organisations list or type a new one) / Type.', 'code'],
    ['   Barrier addressed = the pillar it acts on (Access, Fairness, Reward, Settlement) - the same pillars as the country index, so the two can be compared.', 'code'],
    ['   Effect on African talent = Opens (makes it easier), Mixed, or Restricts (makes it harder). Restrictive policies belong in the list too - they are part of the picture.', 'code'],
    ['   Stage = Idea, Proposed, Adopted, Implemented, Evaluated.', 'code'],
    ['   Africa relevance (0-3): 3 = designed for African countries, 2 = applies to all non-EU nationals incl. Africans, 1 = indirect, 0 = none.', 'code'],
    ['   Reach (0-3): 3 = EU-wide or global, 2 = several countries, 1 = one country, 0 = local / tiny pilot.', 'code'],
    ['   Evidence of impact (0-3) - YOU fill this: 0 = no data, 1 = anecdotes, 2 = official numbers (e.g. permits issued), 3 = independent evaluation.', 'code'],
    ['Policy strength (0-100, automatic) = stage (40%) + Africa relevance (25%) + reach (20%) + evidence of impact (15%). It measures how real and relevant a policy is - not whether it is good or bad; that is the Effect column.', 'text'],
    ['Policy Activity tab - your log of what bodies actually DO: one row per report, consultation answer, law, programme launch, funding, event, campaign, court case or evaluation, with date, organisation, related policy, pillar, outcome and link.', 'text'],
    ['This log is how "effort" becomes numbers: the Policy Analysis tab counts activities per organisation and per year. It starts empty on purpose - every entry should be a real, linked event.', 'tip'],
    ['Where to find activities: the "Have your say" portal (consultations), EUR-Lex (laws), press pages of the Commission and ministries, the reports pages of OECD, IOM, ILO, ICMPD, MPI, SVR, DeZIM, and the equality bodies\' annual reports.', 'text']
  ]); blank();

  // 23
  add([
    ['23. POLICY ANALYSIS (Policy Analysis tab)', 'h'],
    ['Automatic charts and findings from the Policies and Policy Activity tabs, linked to your country scores. Refresh scores & dashboard after changes.', 'text'],
    ['Key findings - number of policies by effect; which barrier gets the most opening policies; the most neglected barrier; the most active bodies; what is still in the pipeline; how many policies have evaluated impact.', 'text'],
    ['A. Which barriers do policies address - opening, mixed and restricting policies per pillar, with the average strength of the opening ones. Chart: stacked bars.', 'text'],
    ['B. Policy pipeline - how many policies are at each stage. Many "Proposed" = change is coming and advocacy still matters.', 'text'],
    ['C. Gap analysis - for each pillar: NEED (100 minus the average country score from your index) against ATTENTION (share of opening policies targeting it). The biggest positive gap is the barrier that hurts most and gets least policy support.', 'text'],
    ['   Example: if Fairness need is 60 but only 10% of opening policies address Fairness, the gap is 50 - a strong argument for anti-discrimination and recognition measures.', 'code'],
    ['D. Who is driving change - per organisation: policies it leads + activities you logged. Chart: top 15.', 'text'],
    ['E. Activity over time - activities logged per year, to see whether effort is growing or fading.', 'text'],
    ['How to use it: in advocacy (point to the neglected barrier with numbers), when choosing which organisations to contact (Organisations tab), and when advising young professionals (new opening policies = new routes, e.g. a Talent Partnership with their country).', 'text'],
    ['Limits: counting policies is not the same as measuring their effect. Use Evidence of impact and evaluations wherever they exist, and say clearly when a finding rests on counts only.', 'warn']
  ]);
  return L;
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
  ensureWeightsOptions_(sh);
  sh.getRange('A9').setValue('Weights do not have to add up to 100: the score divides by the weights of the pillars that have data.')
    .setFontStyle('italic');
  sh.setColumnWidth(1, 260);
}

/** Adds settings introduced in later versions to an existing Weights tab. */
function ensureWeightsOptions_(sh) {
  if (String(sh.getRange('A8').getValue()).trim() === '') {
    sh.getRange('A8').setValue('Require data in every pillar for a verdict');
    sh.getRange('B8').insertCheckboxes().setValue(true);
  }
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
  if (ss.getSheetByName(SHEETS.WEIGHTS)) ensureWeightsOptions_(ss.getSheetByName(SHEETS.WEIGHTS));
  buildScores_(ss, n, indicators, map);
  var profCountCol = syncProfessions_(ss);
  buildDashboard_(ss, n, indicators.length, profCountCol);
  buildFindings_(ss, n, indicators.length, profCountCol);
  if (ss.getSheetByName(SHEETS.POLICIES) && ss.getSheetByName(SHEETS.ACTIVITY)) buildPolicyAnalysis_(ss, n, indicators.length);
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
    var gaps = PILLARS.map(function (p, k) {
      return 'IF(AND(' + wCells[k] + '>0,NOT(ISNUMBER(' + colLetter_(L.pillarStart + k) + r + '))),1,0)';
    }).join('+');
    row.push('=IF(OR(' + cv + '<' + W + '!$B$7,AND(' + W + '!$B$8=TRUE,(' + gaps + ')>0)),"Insufficient data",IF(' + t + '>=' + W + '!$B$5,"Destination",IF(' +
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

function buildDashboard_(ss, n, nI, profCountCol) {
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

  // Most-needed professions (from the Professions tab)
  var pRow = noteRow + 6;
  sh.getRange(pRow, 1).setValue('Most-needed professions (number of listed countries with a shortage)')
    .setFontSize(13).setFontWeight('bold').setFontColor(COLORS.title);
  sh.getRange(pRow + 1, 1, 1, 2).setValues([['Profession', 'Countries in shortage']]);
  styleHeader_(sh.getRange(pRow + 1, 1, 1, 2));
  if (profCountCol) {
    var P = SHEETS.PROFESSIONS, cc = colLetter_(profCountCol);
    sh.getRange(pRow + 2, 1).setFormula('=IFERROR(ARRAY_CONSTRAIN(SORT(FILTER({' + P + '!A' + PROF_FIRST_ROW + ':A,' +
      P + '!' + cc + PROF_FIRST_ROW + ':' + cc + '},ISNUMBER(' + P + '!' + cc + PROF_FIRST_ROW + ':' + cc + '),' +
      P + '!' + cc + PROF_FIRST_ROW + ':' + cc + '>0),2,FALSE),15,2),' +
      '"Mark shortages in the Professions tab to see the ranking here.")');
  }

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
  var written = 0, ok = 0, failed = 0, kept = 0, evidence = [];
  var lastSrc = src.getLastRow();
  var srcVals = lastSrc >= 2 ? src.getRange(2, 1, lastSrc - 1, SRC_HEAD.length).getValues() : [];

  rowNumbers.forEach(function (rowNum) {
    var s = srcVals[rowNum - 2];
    if (!s) return;
    var code = String(s[SRC.IND - 1]).trim(), link = String(s[SRC.LINK - 1]).trim();
    if (!code || !link || s[SRC.ENABLED - 1] !== true) return;
    var status = function (m) { src.getRange(rowNum, SRC.STATUS).setValue(m); };
    if (!map[code]) { status('ERROR: indicator ' + code + ' not found in Indicators tab.'); failed++; return; }

    try {
      var type = String(s[SRC.TYPE - 1]).trim() || 'Eurostat';
      var res = type === 'CSV link'
        ? fetchCsvSource_(link, s[SRC.CSV_COUNTRY - 1], s[SRC.CSV_VALUE - 1], s[SRC.CSV_YEAR - 1], countries)
        : fetchEurostatSource_(link, s[SRC.FILTER_A - 1], s[SRC.FILTER_B - 1], s[SRC.SINCE - 1], countries);

      var got = 0, missing = [], manual = [];
      var colRange = data.getRange(DATA_FIRST_ROW, map[code], n, 1);
      var curVals = colRange.getValues(), curNotes = colRange.getNotes();
      countries.forEach(function (c) {
        var hit = res.values[c.row];
        if (!hit) { missing.push(c.geo || c.name); return; }
        var i = c.row - DATA_FIRST_ROW;
        // never overwrite a value you typed yourself (manual cells have no "fetched" note)
        if (String(curVals[i][0]) !== '' && String(curNotes[i][0]).indexOf('fetched') < 0) { manual.push(c.geo || c.name); kept++; return; }
        var value = Math.round(hit.value * 100) / 100;
        data.getRange(c.row, map[code]).setValue(value)
          .setNote(res.label + (hit.year ? ', ' + hit.year : '') + ' (fetched ' + today + ')');
        evidence.push([c.name, code, value, hit.year || '', res.label, res.url, today, 'Auto-fetched']);
        got++; written++;
      });
      var m = 'OK ' + today + ': ' + got + '/' + countries.length + ' countries' +
        (missing.length ? '. No data: ' + missing.join(', ') : '') +
        (manual.length ? '. Kept your manual value: ' + manual.join(', ') : '') +
        (res.warnings.length ? '. Warning: ' + res.warnings.join('; ') : '');
      status(m); log_('Fetch ' + code, m); ok++;
    } catch (e) {
      status('ERROR ' + today + ': ' + e.message); log_('Fetch ' + code, 'ERROR: ' + e.message); failed++;
    }
  });

  if (evidence.length) writeEvidence_(ev, evidence);
  return written + ' values written from ' + ok + ' source(s)' + (kept ? ', ' + kept + ' manual values kept' : '') +
    (failed ? ', ' + failed + ' failed (see Sources "Last status")' : '') + '.';
}

/** Updates earlier auto-fetched rows (same country + indicator) instead of adding duplicates. */
function writeEvidence_(ev, rows) {
  var last = ev.getLastRow();
  var existing = last >= 2 ? ev.getRange(2, 1, last - 1, 8).getValues() : [];
  var index = {};
  existing.forEach(function (r, i) {
    if (String(r[7]) === 'Auto-fetched') index[String(r[0]).toLowerCase() + '|' + String(r[1])] = i + 2;
  });
  var append = [];
  rows.forEach(function (r) {
    var at = index[String(r[0]).toLowerCase() + '|' + String(r[1])];
    if (at) ev.getRange(at, 1, 1, 8).setValues([r]); else append.push(r);
  });
  if (append.length) ev.getRange(firstEmptyRow_(ev), 1, append.length, 8).setValues(append);
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
// PROFESSIONS IN DEMAND + ORGANISATIONS
// ============================================================================

var PROF_LINK_ROW = 1;         // links to the official shortage lists
var PROF_HEAD_ROW = 2;         // column headers (filter starts here)
var PROF_FIRST_ROW = 3;        // first profession
var PROF_FIRST_COUNTRY_COL = 5; // A Profession, B ISCO-08, C Sector, D Regulated?
var PROF_COUNT_HEAD = 'Countries in shortage';
var SHORTAGE_STATUS = ['Shortage', 'Some shortage (regional)', 'Balanced', 'Surplus', 'Unknown'];

// Official national shortage lists (row 1 of the Professions tab). Check them yearly.
var SHORTAGE_LISTS = {
  DE: 'https://www.make-it-in-germany.com/en/working-in-germany/professions-in-demand',
  NL: 'https://www.uwv.nl',
  FR: 'https://travail-emploi.gouv.fr',
  BE: 'https://www.vdab.be',
  IE: 'https://enterprise.gov.ie',
  SE: 'https://arbetsformedlingen.se',
  ES: 'https://www.sepe.es'
};

// Starting list: professions that EU labour-shortage reports mention often.
// Profession, ISCO-08 code, sector, regulated in most EU countries?
var DEFAULT_PROFESSIONS = [
  ['Nursing professionals', '2221', 'Health', 'Yes'],
  ['Medical doctors', '221', 'Health', 'Yes'],
  ['Pharmacists', '2262', 'Health', 'Yes'],
  ['Physiotherapists', '2264', 'Health', 'Yes'],
  ['Health care assistants', '5321', 'Care', 'Varies'],
  ['Software developers', '2512', 'ICT', 'No'],
  ['Systems analysts', '2511', 'ICT', 'No'],
  ['Database and network professionals', '252', 'ICT', 'No'],
  ['Civil engineers', '2142', 'Engineering', 'Varies'],
  ['Electrical engineers', '2151', 'Engineering', 'Varies'],
  ['Mechanical engineers', '2144', 'Engineering', 'Varies'],
  ['Building electricians', '7411', 'Skilled trades', 'Varies'],
  ['Plumbers and pipe fitters', '7126', 'Skilled trades', 'Varies'],
  ['Welders and flame cutters', '7212', 'Skilled trades', 'Varies'],
  ['Carpenters and joiners', '7115', 'Skilled trades', 'Varies'],
  ['Bricklayers', '7112', 'Construction', 'No'],
  ['Motor vehicle mechanics', '7231', 'Skilled trades', 'Varies'],
  ['Heavy truck and lorry drivers', '8332', 'Transport', 'Yes (licence)'],
  ['Primary school teachers', '2341', 'Education', 'Yes'],
  ['Secondary teachers (STEM)', '2330', 'Education', 'Yes'],
  ['Early childhood educators', '2342', 'Education', 'Yes'],
  ['Accountants', '2411', 'Business', 'Varies'],
  ['Cooks', '5120', 'Hospitality', 'No']
];

var ORG_HEAD = ['Organisation', 'Level', 'Country', 'Type', 'Policy area', 'How they influence policy',
                'How you can engage', 'Website', 'Your status', 'Your notes'];
var ORG_STATUS = ['Not contacted', 'Following', 'Contacted', 'In conversation', 'Partner'];

// Starting list of real organisations. Check each website; add your own rows.
var DEFAULT_ORGS = [
  ['European Commission - DG Migration and Home Affairs', 'EU', '', 'EU institution', 'Legal migration, EU Blue Card, EU Talent Pool, Talent Partnerships',
   'Proposes EU migration laws and programmes', 'Answer public consultations; follow Talent Partnership calls', 'https://home-affairs.ec.europa.eu'],
  ['EU "Have your say" portal', 'EU', '', 'Consultation portal', 'All EU laws in preparation',
   'Collects public feedback before the Commission finalises proposals', 'Submit feedback on migration and labour initiatives (anyone can)', 'https://ec.europa.eu/info/law/better-regulation/have-your-say'],
  ['European Parliament - LIBE Committee', 'EU', '', 'EU institution', 'Migration, civil liberties, anti-discrimination',
   'Amends and votes EU migration law', 'Write to MEPs of your country; EU petitions portal', 'https://www.europarl.europa.eu/committees/en/libe/home'],
  ['European Labour Authority (ELA) / EURES', 'EU', '', 'EU agency', 'Labour mobility, labour shortages',
   'Publishes the yearly EU report on shortage and surplus occupations', 'Use the data; talk to EURES advisers', 'https://www.ela.europa.eu'],
  ['EU Agency for Fundamental Rights (FRA)', 'EU', '', 'EU agency', 'Racism and discrimination ("Being Black in the EU" surveys)',
   'Provides evidence used for EU anti-racism policy', 'Cite its surveys; take part in its consultations', 'https://fra.europa.eu'],
  ['African Union - Citizens and Diaspora Directorate (CIDO)', 'Africa / AU', '', 'Intergovernmental', 'Diaspora engagement, AU-EU dialogue',
   'Represents diaspora interests in AU policy and AU-EU summits', 'Diaspora consultations and networks', 'https://au.int'],
  ['ADEPT - Africa-Europe Diaspora Development Platform', 'Europe', '', 'Diaspora network', 'African diaspora in Europe, development, AU-EU dialogue',
   'Brings African diaspora organisations into EU policy dialogues', 'Join as or through a member organisation', 'https://www.adept-platform.org'],
  ['International Organization for Migration (IOM)', 'Global', '', 'UN agency', 'Labour migration, skills mobility partnerships',
   'Advises governments and runs mobility programmes', 'Programmes, reports, events', 'https://www.iom.int'],
  ['International Labour Organization (ILO)', 'Global', '', 'UN agency', 'Fair recruitment, recognition of skills, migrant workers\' rights',
   'Sets international labour standards', 'Use its standards and reports in your advocacy', 'https://www.ilo.org'],
  ['OECD - International Migration Division', 'Global', '', 'Intergovernmental', 'Migration data, integration indicators, talent attractiveness',
   'Data and recommendations that governments act on', 'Cite its indicators ("Settling In", International Migration Outlook)', 'https://www.oecd.org/migration'],
  ['ICMPD - International Centre for Migration Policy Development', 'Europe', '', 'Intergovernmental', 'Migration policy, mobility partnerships with Africa',
   'Designs and runs migration partnerships for governments', 'Reports, events, programme calls', 'https://www.icmpd.org'],
  ['Center for Global Development', 'Global', '', 'Think tank', 'Global Skill Partnerships, labour mobility',
   'Designs policy models adopted by governments', 'Read and share its proposals; events', 'https://www.cgdev.org'],
  ['Migration Policy Institute (incl. MPI Europe)', 'Global / Europe', '', 'Think tank', 'Migration and integration policy',
   'Research used by policymakers', 'Research, webinars', 'https://www.migrationpolicy.org'],
  ['European Policy Centre (EPC)', 'Europe', '', 'Think tank', 'EU migration and diversity policy',
   'Brussels policy debates and papers', 'Events, papers', 'https://www.epc.eu'],
  ['European Network Against Racism (ENAR)', 'Europe', '', 'NGO network', 'Anti-racism, equality at work',
   'Advocacy towards EU institutions', 'Member organisations, campaigns', 'https://www.enar-eu.org'],
  ['PICUM', 'Europe', '', 'NGO network', 'Rights of undocumented migrants, labour exploitation',
   'Advocacy towards EU institutions', 'Reports, member organisations', 'https://picum.org'],
  ['Equinet - European Network of Equality Bodies', 'Europe', '', 'Network of equality bodies', 'Discrimination law and complaints',
   'Connects national equality bodies; advises EU', 'Find your national equality body', 'https://equineteurope.org'],
  ['Talent Beyond Boundaries', 'Global', '', 'NGO', 'Labour mobility for refugees',
   'Pilots skilled-migration pathways with governments', 'Programmes, partnerships', 'https://www.talentbeyondboundaries.org'],
  ['Expert Council on Integration and Migration (SVR)', 'Country', 'Germany', 'Expert council / research', 'Migration and integration policy',
   'Yearly reports to the federal government', 'Reports, public events', 'https://www.svr-migration.de'],
  ['DeZIM Institute', 'Country', 'Germany', 'Research institute', 'Migration, racism research (National Discrimination and Racism Monitor)',
   'Evidence for federal policy', 'Studies, events', 'https://www.dezim-institut.de'],
  ['Federal Anti-Discrimination Agency', 'Country', 'Germany', 'Equality body', 'Discrimination in work and daily life',
   'Advises parliament; publishes reports', 'Free advice; report discrimination cases', 'https://www.antidiskriminierungsstelle.de'],
  ['Make it in Germany', 'Country', 'Germany', 'Government portal', 'Skilled immigration, shortage professions',
   'Official information on the Skilled Immigration Act', 'Information and contact service', 'https://www.make-it-in-germany.com'],
  ['Netherlands Institute for Human Rights', 'Country', 'Netherlands', 'Equality body', 'Discrimination at work',
   'Rules on complaints; advises government', 'File a complaint (free)', 'https://www.mensenrechten.nl'],
  ['Defender of Rights (Defenseur des droits)', 'Country', 'France', 'Equality body', 'Discrimination, including in hiring',
   'Independent authority; recommendations to government', 'File a complaint (free)', 'https://www.defenseurdesdroits.fr'],
  ['Unia', 'Country', 'Belgium', 'Equality body', 'Discrimination and equal opportunities',
   'Advises governments; takes cases to court', 'Report discrimination', 'https://www.unia.be'],
  ['Myria - Federal Migration Centre', 'Country', 'Belgium', 'Public body', 'Migration and rights of foreigners',
   'Analysis and recommendations to government', 'Reports, questions', 'https://www.myria.be'],
  ['Migrant Rights Centre Ireland', 'Country', 'Ireland', 'NGO', 'Migrant workers\' rights, work permits',
   'Campaigns that changed Irish work-permit rules', 'Membership, campaigns, advice', 'https://www.mrci.ie'],
  ['Irish Human Rights and Equality Commission', 'Country', 'Ireland', 'Equality body', 'Equality and discrimination',
   'Advises government and parliament', 'Information and legal help', 'https://www.ihrec.ie'],
  ['Equality Ombudsman (Diskrimineringsombudsmannen)', 'Country', 'Sweden', 'Equality body', 'Discrimination',
   'Supervises the Discrimination Act', 'Report discrimination', 'https://www.do.se'],
  ['Delmi - Migration Studies Delegation', 'Country', 'Sweden', 'Government research body', 'Migration policy research',
   'Reports to the Swedish government', 'Reports, seminars', 'https://www.delmi.se'],
  ['CIDOB - Barcelona Centre for International Affairs', 'Country', 'Spain', 'Think tank', 'Migration and EU-Africa relations',
   'Research used in Spanish and EU debates', 'Publications, events', 'https://www.cidob.org']
];

function buildProfessions_(ss) {
  var sh = freshSheet_(ss, SHEETS.PROFESSIONS);
  sh.getRange(PROF_HEAD_ROW, 1, 1, 5).setValues([['Profession', 'ISCO-08 code', 'Sector', 'Regulated?', PROF_COUNT_HEAD]]);
  sh.getRange(PROF_HEAD_ROW, 6).setValue('Notes');
  styleHeader_(sh.getRange(PROF_HEAD_ROW, 1, 1, 6));
  sh.getRange(PROF_LINK_ROW, 1).setValue('Official shortage list (link) ->').setFontStyle('italic').setFontWeight('bold');
  sh.getRange(PROF_FIRST_ROW, 1, DEFAULT_PROFESSIONS.length, 4).setValues(DEFAULT_PROFESSIONS).setBackground(COLORS.input);
  sh.getRange(PROF_FIRST_ROW, 1, DEFAULT_PROFESSIONS.length, 1).setFontWeight('bold');
  sh.setFrozenRows(2); sh.setFrozenColumns(1);
  sh.setColumnWidth(1, 230); sh.setColumnWidth(2, 80); sh.setColumnWidth(3, 110); sh.setColumnWidth(4, 95);
}

/**
 * Keeps one column per Data country (inserted before "Countries in shortage"),
 * refreshes dropdowns, colours and the count formula. Returns the count column.
 */
function syncProfessions_(ss) {
  var sh = ss.getSheetByName(SHEETS.PROFESSIONS);
  var data = ss.getSheetByName(SHEETS.DATA);
  if (!sh || !data) return 0;
  var n = countryCount_(data);
  var countries = n ? data.getRange(DATA_FIRST_ROW, 1, n, 2).getValues() : [];

  var lastCol = sh.getLastColumn();
  var head = sh.getRange(PROF_HEAD_ROW, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim(); });
  var countCol = head.indexOf(PROF_COUNT_HEAD) + 1;
  if (!countCol) {
    countCol = lastCol + 1;
    sh.getRange(PROF_HEAD_ROW, countCol).setValue(PROF_COUNT_HEAD);
    styleHeader_(sh.getRange(PROF_HEAD_ROW, countCol));
    head.push(PROF_COUNT_HEAD);
  }
  countries.forEach(function (c) {
    var name = String(c[0]).trim(), code = String(c[1]).trim().toUpperCase();
    if (head.indexOf(name) >= 0) return;
    sh.insertColumnBefore(countCol);
    sh.getRange(PROF_HEAD_ROW, countCol).setValue(name);
    styleHeader_(sh.getRange(PROF_HEAD_ROW, countCol));
    if (SHORTAGE_LISTS[code]) sh.getRange(PROF_LINK_ROW, countCol).setValue(SHORTAGE_LISTS[code]);
    sh.setColumnWidth(countCol, 115);
    head.splice(countCol - 1, 0, name);
    countCol++;
  });

  var firstC = PROF_FIRST_COUNTRY_COL, nC = countCol - firstC;
  var lastRow = Math.max(lastFilledRow_(sh, 1), PROF_FIRST_ROW);
  var rows = lastRow - PROF_FIRST_ROW + 1;
  var extra = 30; // room for your own professions
  if (nC > 0) {
    var block = sh.getRange(PROF_FIRST_ROW, firstC, rows + extra, nC);
    block.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(SHORTAGE_STATUS, true)
      .setAllowInvalid(false).build()).setBackground(COLORS.input).setHorizontalAlignment('center');
    sh.getRange(PROF_LINK_ROW, firstC, 1, nC).setFontSize(8).setWrap(false).setFontColor('#1155CC');
    var mk = function (text, color) {
      return SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(text).setBackground(color).setRanges([block]).build();
    };
    sh.setConditionalFormatRules([mk('Shortage', '#B7E1CD'), mk('Some shortage (regional)', '#E2F3EA'),
      mk('Balanced', '#EEEEEE'), mk('Surplus', COLORS.bad)]);
  }
  sh.getRange(PROF_FIRST_ROW, 1, rows + extra, 4).setBackground(COLORS.input);
  var f = [];
  for (var r = PROF_FIRST_ROW; r < PROF_FIRST_ROW + rows + extra; r++) {
    f.push([nC > 0
      ? '=IF($A' + r + '="","",COUNTIF(' + colLetter_(firstC) + r + ':' + colLetter_(countCol - 1) + r + ',"Shortage")+0.5*COUNTIF(' +
        colLetter_(firstC) + r + ':' + colLetter_(countCol - 1) + r + ',"Some shortage (regional)"))'
      : '=""']);
  }
  sh.getRange(PROF_FIRST_ROW, countCol, f.length, 1).setFormulas(f).setBackground(COLORS.calc)
    .setFontWeight('bold').setHorizontalAlignment('center');
  sh.getRange(PROF_LINK_ROW, countCol).setValue('Shortage = 1, regional = 0.5').setFontSize(8).setFontStyle('italic');
  sh.setColumnWidth(countCol, 120);
  if (sh.getFilter()) sh.getFilter().remove();
  sh.getRange(PROF_HEAD_ROW, 1, rows + extra + 1, countCol + 1).createFilter();
  return countCol;
}

function buildOrganisations_(ss) {
  var sh = freshSheet_(ss, SHEETS.ORGS);
  var rows = DEFAULT_ORGS.map(function (o) { return o.concat(['Not contacted', '']); });
  writeTable_(sh, ORG_HEAD, rows);
  var extra = 50;
  sh.getRange(2, 1, rows.length + extra, ORG_HEAD.length).setBackground(COLORS.input);
  sh.getRange(2, 9, rows.length + extra, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(ORG_STATUS, true).build());
  sh.getRange(2, 2, rows.length + extra, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['EU', 'Europe', 'Global', 'Global / Europe', 'Africa / AU', 'Country'], true).build());
  [300, 90, 100, 150, 260, 300, 280, 280, 120, 250].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  sh.setFrozenColumns(1);
  sh.getRange(1, 1, rows.length + extra + 1, ORG_HEAD.length).createFilter();
}

function lastFilledRow_(sh, col) {
  var last = sh.getLastRow();
  if (last < 1) return 0;
  var vals = sh.getRange(1, col, last, 1).getValues();
  for (var i = vals.length - 1; i >= 0; i--) if (String(vals[i][0]).trim() !== '') return i + 1;
  return 0;
}

// ============================================================================
// FINDINGS & ADVICE (plain-language results for advising young professionals)
// ============================================================================

var THE_QUESTION = 'Which of these European countries gives an African university graduate the best realistic chance ' +
  'of building a career that matches their skills - and what should they do to get there?';
var ADVICE_KEY_HEAD = 'Advice key';

// Default advice wording. You can edit the wording in the Findings & Advice tab; your edits are kept.
var DEFAULT_ADVICE = [
  ['Destination', 'Strong option compared with the others: worth serious planning.'],
  ['Conditional', 'Possible, but only with preparation - fix the weak point below before moving.'],
  ['Not recommended', 'Weaker than the alternatives in this comparison - only if you have a specific job offer or a strong personal reason.'],
  ['Insufficient data', 'Not enough data yet to judge - fill in more of the Data tab.'],
  ['Weak_Access', 'Main barrier: getting in. Target shortage professions and employers that sponsor the EU Blue Card, and start the degree recognition before you apply.'],
  ['Weak_Fairness', 'Main risk: your skills being under-used. Get your diploma officially recognised first, target international employers, keep proof of all experience, and know the national equality body.'],
  ['Weak_Reward', 'Money goes less far here. Compare net salary after rent and living costs, and negotiate using official salary data for your profession.'],
  ['Weak_Settlement', 'Building a life takes longer here. Start the local language early (aim for B1-B2), connect with the African community, and plan the permanent-residence timeline.'],
  ['Prof_Shortage', 'Your profession is officially in shortage here - a strong entry route.'],
  ['Prof_Some', 'Your profession is in shortage in some regions - look at those regions first.'],
  ['Prof_Surplus', 'Your profession is in surplus here - consider related shortage roles or another country.']
];

var GENERAL_STEPS = [
  '1. Choose the country by its weakest pillar, not by salary alone. A high Reward score means little if Access or Fairness is low.',
  '2. Start the recognition of your diploma BEFORE you move. It takes months and decides which jobs you can do.',
  '3. Learn the local language to at least B1 before arriving, B2 for regulated professions. English is rarely enough long-term outside tech.',
  '4. Use the fast lanes: shortage professions and the EU Blue Card. Check the Professions tab for where your profession is needed.',
  '5. Know your rights and your network: the national equality body (free complaints) and diaspora organisations (see the Organisations tab).',
  '6. Plan for the first 2-3 years: savings, housing, and a realistic first job. Many graduates start below their level - have a plan to move up.'
];

function buildFindings_(ss, n, nI, profCountCol) {
  // keep the user's selected profession and advice wording across rebuilds
  var old = ss.getSheetByName(SHEETS.FINDINGS);
  var keptProfession = '', keptAdvice = {};
  if (old && old.getLastRow() > 0) {
    var vals = old.getRange(1, 1, old.getLastRow(), 2).getValues();
    keptProfession = String(vals.length >= 4 ? vals[3][1] : '').trim();
    var at = -1;
    for (var i = 0; i < vals.length; i++) if (String(vals[i][0]).trim() === ADVICE_KEY_HEAD) { at = i; break; }
    if (at >= 0) for (var j = at + 1; j < vals.length && String(vals[j][0]).trim(); j++) keptAdvice[String(vals[j][0]).trim()] = vals[j][1];
  }

  var sh = freshSheet_(ss, SHEETS.FINDINGS);
  sh.getRange(1, 1, Math.max(sh.getMaxRows(), 1), Math.max(sh.getMaxColumns(), 1)).clearDataValidations();
  var L = scoreLayout_(nI), S = SHEETS.SCORES, P = SHEETS.PROFESSIONS;
  var f = DATA_FIRST_ROW, l = DATA_FIRST_ROW + Math.max(n, 1) - 1;
  var sc = function (c) { return S + '!$' + colLetter_(c) + '$' + f + ':$' + colLetter_(c) + '$' + l; };
  var countries = sc(1), totals = sc(L.total), verdicts = sc(L.verdict);

  // --- header, question, profession selector
  sh.getRange('A1').setValue('Findings & Advice').setFontSize(20).setFontWeight('bold').setFontColor(COLORS.title);
  sh.getRange('A2').setValue('THE QUESTION: ' + THE_QUESTION).setFontStyle('italic').setFontColor('#333333');
  sh.getRange('A4').setValue('Advising someone in this profession:').setFontWeight('bold');
  sh.getRange('B4').setValue(keptProfession).setBackground(COLORS.input).setFontWeight('bold');
  sh.getRange('C4').setValue('<- choose from the list (Professions tab). Leave empty for general advice.').setFontStyle('italic').setFontColor('#666666');
  if (ss.getSheetByName(P)) {
    sh.getRange('B4').setDataValidation(SpreadsheetApp.newDataValidation()
      .requireValueInRange(ss.getSheetByName(P).getRange('A' + PROF_FIRST_ROW + ':A'), true).setAllowInvalid(true).build());
  }

  // Row positions
  var tHead = 18, tFirst = 19, tLast = tFirst + Math.max(n, 1) - 1;
  var advFirstRow = tLast + 12 + GENERAL_STEPS.length;   // advice-wording table (header row)
  var adv = '$A$' + (advFirstRow + 1) + ':$B$' + (advFirstRow + DEFAULT_ADVICE.length);
  // advice lookup; keyExpr is a formula expression, e.g. '"Prof_Shortage"' or 'C19'
  var A = function (keyExpr) { return 'IFERROR(VLOOKUP(' + keyExpr + ',' + adv + ',2,FALSE),"")'; };
  var weakCol = 'E' + tFirst + ':E' + tLast, profStatusCol = 'F' + tFirst + ':F' + tLast;

  // --- one-sentence answer
  section_(sh, 6, 'THE ANSWER IN ONE SENTENCE');
  sh.getRange('A7').setFormula('=IFERROR(IF(COUNT(' + totals + ')=0,"No results yet - fill the Data tab (or Fetch data from all sources), then Refresh.",' +
    '"Top of this comparison: "&TEXTJOIN(",  ",TRUE,ARRAY_CONSTRAIN(SORT(FILTER(ARRAYFORMULA(' + countries + '&" ("&ROUND(' + totals + ')&", "&' + verdicts + '&")"),' +
    'ISNUMBER(' + totals + '),' + verdicts + '<>"Insufficient data"),FILTER(' + totals + ',ISNUMBER(' + totals + '),' + verdicts + '<>"Insufficient data"),FALSE),3,1))&"."),' +
    '"Not enough data for a verdict yet - check Data coverage on the Dashboard.")').setFontSize(13).setFontWeight('bold');

  // --- what it means
  section_(sh, 9, 'WHAT THIS MEANS FOR YOUNG AFRICAN PROFESSIONALS');
  var pillarsArr = '{"Access","Fairness","Reward","Settlement"}';
  var lines = [
    '="Countries compared: "&COUNTA(' + countries + ')&".   Destination: "&COUNTIF(' + verdicts + ',"Destination")&"   |   Conditional: "&COUNTIF(' + verdicts +
      ',"Conditional")&"   |   Not recommended: "&COUNTIF(' + verdicts + ',"Not recommended")&"   |   Insufficient data: "&COUNTIF(' + verdicts + ',"Insufficient data")&"."',
    '=IFERROR(IF(MAX(ARRAYFORMULA(COUNTIF(' + weakCol + ',' + pillarsArr + ')))=0,"The most common weak point will appear here once scores exist.",' +
      '"Most common weak point across these countries: "&UPPER(INDEX(' + pillarsArr + ',MATCH(MAX(ARRAYFORMULA(COUNTIF(' + weakCol + ',' + pillarsArr + '))),ARRAYFORMULA(COUNTIF(' + weakCol + ',' + pillarsArr + ')),0)))&' +
      '" - "&VLOOKUP("Weak_"&INDEX(' + pillarsArr + ',MATCH(MAX(ARRAYFORMULA(COUNTIF(' + weakCol + ',' + pillarsArr + '))),ARRAYFORMULA(COUNTIF(' + weakCol + ',' + pillarsArr + ')),0)),' + adv + ',2,FALSE)),"")',
    profCountCol
      ? '=IFERROR("Most-needed professions across these countries: "&TEXTJOIN(", ",TRUE,ARRAY_CONSTRAIN(SORT(FILTER(' + P + '!$A$' + PROF_FIRST_ROW + ':$A,ISNUMBER(' + P + '!$' + colLetter_(profCountCol) + '$' + PROF_FIRST_ROW + ':$' + colLetter_(profCountCol) + '),' +
        P + '!$' + colLetter_(profCountCol) + '$' + PROF_FIRST_ROW + ':$' + colLetter_(profCountCol) + '>0),FILTER(' + P + '!$' + colLetter_(profCountCol) + '$' + PROF_FIRST_ROW + ':$' + colLetter_(profCountCol) + ',ISNUMBER(' +
        P + '!$' + colLetter_(profCountCol) + '$' + PROF_FIRST_ROW + ':$' + colLetter_(profCountCol) + '),' + P + '!$' + colLetter_(profCountCol) + '$' + PROF_FIRST_ROW + ':$' + colLetter_(profCountCol) + '>0),FALSE),5,1))&".",' +
        '"No shortages marked yet in the Professions tab.")'
      : '="Add the Professions tab (Build / repair) to see the most-needed professions."',
    profCountCol
      ? '=IF($B$4="","Choose a profession in B4 to see where it is needed.",IFERROR("For "&$B$4&": in shortage in "&TEXTJOIN(", ",TRUE,FILTER(' + P + '!$' + colLetter_(PROF_FIRST_COUNTRY_COL) + '$' + PROF_HEAD_ROW + ':$' + colLetter_(profCountCol - 1) + '$' + PROF_HEAD_ROW + ',' +
        '(INDEX(' + P + '!$' + colLetter_(PROF_FIRST_COUNTRY_COL) + '$' + PROF_FIRST_ROW + ':$' + colLetter_(profCountCol - 1) + ',MATCH($B$4,' + P + '!$A$' + PROF_FIRST_ROW + ':$A,0),0)="Shortage")+' +
        '(INDEX(' + P + '!$' + colLetter_(PROF_FIRST_COUNTRY_COL) + '$' + PROF_FIRST_ROW + ':$' + colLetter_(profCountCol - 1) + ',MATCH($B$4,' + P + '!$A$' + PROF_FIRST_ROW + ':$A,0),0)="Some shortage (regional)")))&' +
        '". Start with the country that is both on this list and high in the ranking.","For "&$B$4&": no shortage marked in the listed countries yet (fill the Professions tab)."))'
      : '=""',
    '="How to read the scores: 100 = best of the countries in this sheet, 0 = weakest. They compare countries with each other - they are not a guarantee for one person."'
  ];
  lines.forEach(function (fm, k) { sh.getRange(10 + k, 1).setFormula(fm); });

  // --- country table
  section_(sh, 16, 'COUNTRY BY COUNTRY');
  sh.getRange(17, 1).setValue('Strongest / weakest = the pillar where the country scores best / worst compared with the others.')
    .setFontStyle('italic').setFontColor('#666666');
  var head = ['Country', 'Score', 'Verdict', 'Strongest pillar', 'Weakest pillar', 'Your profession here', 'Advice'];
  sh.getRange(tHead, 1, 1, head.length).setValues([head]);
  styleHeader_(sh.getRange(tHead, 1, 1, head.length));
  var rows = [];
  for (var k2 = 0; k2 < Math.max(n, 1); k2++) {
    var r = DATA_FIRST_ROW + k2, tr = tFirst + k2;
    var pil = S + '!' + colLetter_(L.pillarStart) + r + ':' + colLetter_(L.pillarStart + 3) + r;
    rows.push([
      '=IF(' + S + '!A' + r + '="","",' + S + '!A' + r + ')',
      '=IFERROR(' + S + '!' + colLetter_(L.total) + r + '*1,"")',
      '=IFERROR(' + S + '!' + colLetter_(L.verdict) + r + '&"","")',
      '=IF(COUNT(' + pil + ')=0,"",INDEX(' + pillarsArr + ',MATCH(MAX(' + pil + '),' + pil + ',0)))',
      '=IF(COUNT(' + pil + ')<2,"",INDEX(' + pillarsArr + ',MATCH(MIN(' + pil + '),' + pil + ',0)))',
      profCountCol
        ? '=IF(OR($B$4="",A' + tr + '=""),"",IFERROR(INDEX(' + P + '!$A:$' + colLetter_(profCountCol) + ',MATCH($B$4,' + P + '!$A:$A,0),MATCH(A' + tr + ',' + P + '!$' + PROF_HEAD_ROW + ':$' + PROF_HEAD_ROW + ',0))&"",""))'
        : '=""',
      '=IF(A' + tr + '="","",TRIM(' + A('C' + tr) + '&" "&IF(E' + tr + '="","",' + A('"Weak_"&E' + tr) + ')&" "&' +
        'IF(F' + tr + '="Shortage",' + A('"Prof_Shortage"') + ',IF(F' + tr + '="Some shortage (regional)",' + A('"Prof_Some"') +
        ',IF(F' + tr + '="Surplus",' + A('"Prof_Surplus"') + ',"")))))'
    ]);
  }
  sh.getRange(tFirst, 1, rows.length, head.length).setFormulas(rows);
  sh.getRange(tFirst, 1, rows.length, 1).setFontWeight('bold');
  sh.getRange(tFirst, 2, rows.length, 1).setNumberFormat('0').setFontWeight('bold').setHorizontalAlignment('center');
  sh.getRange(tFirst, 7, rows.length, 1).setWrap(true);
  sh.getRange(tFirst, 1, rows.length, head.length).setVerticalAlignment('top');
  sh.setConditionalFormatRules(verdictRules_(sh.getRange(tFirst, 3, rows.length, 1)).concat([
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Shortage').setBackground('#B7E1CD').setRanges([sh.getRange(profStatusCol)]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Surplus').setBackground(COLORS.bad).setRanges([sh.getRange(profStatusCol)]).build()
  ]));

  // --- general steps
  var gRow = tLast + 3;
  section_(sh, gRow, 'ADVICE THAT HOLDS FOR EVERY COUNTRY');
  sh.getRange(gRow + 1, 1, GENERAL_STEPS.length, 1).setValues(GENERAL_STEPS.map(function (t) { return [t]; }));
  sh.getRange(gRow + GENERAL_STEPS.length + 2, 1)
    .setValue('This tab summarises national data. It is a starting point for a conversation, not a personal guarantee or legal advice. Always check the current rules on official government sites.')
    .setFontStyle('italic').setFontColor('#9C1C1C');

  // --- advice wording (editable, kept across rebuilds)
  section_(sh, advFirstRow - 1, 'ADVICE WORDING - edit column B to change the advice text (kept when you Refresh)');
  sh.getRange(advFirstRow, 1, 1, 2).setValues([[ADVICE_KEY_HEAD, 'Text used in the advice']]);
  styleHeader_(sh.getRange(advFirstRow, 1, 1, 2));
  var advRows = DEFAULT_ADVICE.map(function (a) { return [a[0], keptAdvice[a[0]] !== undefined && keptAdvice[a[0]] !== '' ? keptAdvice[a[0]] : a[1]]; });
  sh.getRange(advFirstRow + 1, 1, advRows.length, 2).setValues(advRows);
  sh.getRange(advFirstRow + 1, 2, advRows.length, 1).setBackground(COLORS.input).setWrap(true);

  // --- chart data (right side) + charts
  var cdHead = 18, cdCol = 10; // column J
  sh.getRange(cdHead, cdCol, 1, 6).setValues([['Country', 'Access', 'Fairness', 'Reward', 'Settlement', 'Score']]);
  styleHeader_(sh.getRange(cdHead, cdCol, 1, 6));
  var cd = [];
  for (var m = 0; m < Math.max(n, 1); m++) {
    var rr = DATA_FIRST_ROW + m, row = ['=' + S + '!A' + rr];
    // missing values become #N/A so the charts show a gap instead of a misleading 0
    for (var q = 0; q < 4; q++) { var pc = S + '!' + colLetter_(L.pillarStart + q) + rr; row.push('=IF(ISNUMBER(' + pc + '),' + pc + ',NA())'); }
    var tc = S + '!' + colLetter_(L.total) + rr; row.push('=IF(ISNUMBER(' + tc + '),' + tc + ',NA())');
    cd.push(row);
  }
  sh.getRange(cdHead + 1, cdCol, cd.length, 6).setFormulas(cd).setNumberFormat('0').setFontColor('#888888');
  sh.getRange(cdHead - 1, cdCol).setValue('Chart data (automatic)').setFontStyle('italic').setFontColor('#888888');

  if (n > 0) {
    sh.insertChart(sh.newChart().setChartType(Charts.ChartType.COLUMN)
      .addRange(sh.getRange(cdHead, cdCol, n + 1, 5))
      .setPosition(1, cdCol, 0, 0)
      .setOption('title', 'Where each country is strong or weak (pillar scores 0-100)')
      .setOption('vAxis', { minValue: 0, maxValue: 100 })
      .setOption('legend', { position: 'top' })
      .setOption('colors', ['#1F4E78', '#2E86AB', '#F2A541', '#6A994E'])
      .setOption('width', 640).setOption('height', 320).build());
    sh.insertChart(sh.newChart().setChartType(Charts.ChartType.BAR)
      .addRange(sh.getRange(cdHead, cdCol, n + 1, 1))
      .addRange(sh.getRange(cdHead, cdCol + 5, n + 1, 1))
      .setPosition(cdHead + n + 3, cdCol, 0, 0)
      .setOption('title', 'Overall Destination Score (0-100)')
      .setOption('legend', { position: 'none' })
      .setOption('hAxis', { minValue: 0, maxValue: 100 })
      .setOption('colors', ['#1F4E78'])
      .setOption('width', 640).setOption('height', 300).build());
  }

  [190, 70, 130, 120, 120, 150, 560].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  sh.setColumnWidth(8, 30); sh.setColumnWidth(9, 30);
  sh.setHiddenGridlines(true);
}

function section_(sh, row, title) {
  sh.getRange(row, 1, 1, 7).setBackground(COLORS.header);
  sh.getRange(row, 1).setValue(title).setFontWeight('bold').setFontColor(COLORS.headerText);
}

// ============================================================================
// POLICIES, POLICY ACTIVITY, POLICY ANALYSIS
// ============================================================================

var POLICY_QUESTION = 'Which policies help - or hold back - the uptake of African talent in Europe, ' +
  'who is driving them, and which barriers are still neglected?';

var POL_HEAD = ['ID', 'Policy / initiative', 'Level', 'Country', 'Lead body', 'Type', 'Barrier addressed (pillar)',
  'Effect on African talent', 'Year', 'Stage', 'Africa relevance (0-3)', 'Reach (0-3)', 'Evidence of impact (0-3)',
  'Policy strength (0-100)', 'What it does', 'Link', 'Status checked on', 'Notes'];
var POL = { ID: 1, NAME: 2, LEVEL: 3, COUNTRY: 4, BODY: 5, TYPE: 6, PILLAR: 7, EFFECT: 8, YEAR: 9, STAGE: 10,
  REL: 11, REACH: 12, EVID: 13, STRENGTH: 14, WHAT: 15, LINK: 16, CHECKED: 17, NOTES: 18 };
var POL_STAGES = ['Idea', 'Proposed', 'Adopted', 'Implemented', 'Evaluated'];
var POL_EFFECTS = ['Opens', 'Mixed', 'Restricts'];
var POL_LEVELS = ['EU', 'Africa-EU', 'Global', 'Africa', 'Country'];
var POL_TYPES = ['Law / directive', 'Regulation', 'Residence permit', 'Bilateral agreement', 'Programme', 'Action plan',
  'Convention', 'Dialogue process', 'Tax measure', 'Pilot project', 'Proposal'];

// Starting list (written from general knowledge; check each status and link - see "Status checked on").
// ID, name, level, country, lead body, type, pillar, effect, year, stage, Africa relevance, reach, what it does, link
var DEFAULT_POLICIES = [
  ['P01', 'EU Blue Card Directive (recast, Directive 2021/1883)', 'EU', '', 'European Commission - DG Migration and Home Affairs', 'Law / directive', 'Access', 'Opens', 2021, 'Implemented', 2, 3,
   'Lower salary thresholds, shorter contracts accepted, easier moves between EU countries, faster family reunification.', 'https://eur-lex.europa.eu/eli/dir/2021/1883/oj'],
  ['P02', 'Single Permit Directive (recast, Directive 2024/1233)', 'EU', '', 'European Commission - DG Migration and Home Affairs', 'Law / directive', 'Access', 'Opens', 2024, 'Adopted', 2, 3,
   'One procedure for work and residence permit; right to change employer; equal treatment at work.', 'https://eur-lex.europa.eu/eli/dir/2024/1233/oj'],
  ['P03', 'EU Talent Pool (EU-wide job-matching platform)', 'EU', '', 'European Commission - DG Migration and Home Affairs', 'Proposal', 'Access', 'Opens', 2023, 'Proposed', 2, 3,
   'Platform to match non-EU jobseekers with EU employers in shortage occupations. Check current negotiation status.', 'https://home-affairs.ec.europa.eu'],
  ['P04', 'EU Talent Partnerships (incl. Morocco, Tunisia, Egypt)', 'Africa-EU', '', 'European Commission - DG Migration and Home Affairs', 'Programme', 'Access', 'Opens', 2021, 'Implemented', 3, 2,
   'Mobility schemes for work, study and training combined with skills development in partner countries.', 'https://home-affairs.ec.europa.eu'],
  ['P05', 'THAMM - labour migration and mobility in North Africa', 'Africa-EU', '', 'International Labour Organization (ILO)', 'Programme', 'Access', 'Opens', 2019, 'Implemented', 3, 2,
   'EU-funded programme (ILO, IOM, GIZ, Enabel) supporting legal labour mobility from Morocco, Tunisia and Egypt.', 'https://www.ilo.org'],
  ['P06', 'Joint Valletta Action Plan (legal migration and mobility pillar)', 'Africa-EU', '', 'African Union - Citizens and Diaspora Directorate (CIDO)', 'Action plan', 'Access', 'Opens', 2015, 'Implemented', 3, 3,
   'Africa-EU commitments incl. legal pathways and mobility; followed up in the Rabat and Khartoum processes.', 'https://www.rabat-process.org'],
  ['P07', 'UNESCO Global Convention on Recognition of Higher Education Qualifications', 'Global', '', 'UNESCO', 'Convention', 'Access', 'Opens', 2019, 'Implemented', 2, 3,
   'Right to a fair assessment of foreign higher-education qualifications in ratifying states.', 'https://www.unesco.org'],
  ['P08', 'Addis Recognition Convention (Africa)', 'Africa', '', 'UNESCO', 'Convention', 'Access', 'Opens', 2014, 'Implemented', 3, 2,
   'African regional convention on recognition of higher-education qualifications - makes African degrees easier to compare.', 'https://www.unesco.org'],
  ['P09', 'Racial Equality Directive (2000/43/EC)', 'EU', '', 'European Commission - DG Migration and Home Affairs', 'Law / directive', 'Fairness', 'Opens', 2000, 'Implemented', 2, 3,
   'Bans discrimination on grounds of racial or ethnic origin, including in hiring; requires national equality bodies.', 'https://eur-lex.europa.eu/eli/dir/2000/43/oj'],
  ['P10', 'EU Anti-racism Action Plan 2020-2025', 'EU', '', 'European Commission - DG Migration and Home Affairs', 'Action plan', 'Fairness', 'Opens', 2020, 'Implemented', 2, 3,
   'EU strategy against structural racism, including in employment. Check whether a follow-up plan exists.', 'https://commission.europa.eu'],
  ['P11', 'Germany - Skilled Immigration Act reform incl. Opportunity Card', 'Country', 'Germany', 'Make it in Germany', 'Law / directive', 'Access', 'Opens', 2023, 'Implemented', 2, 1,
   'Points-based Opportunity Card to look for work, lower Blue Card thresholds, recognition partly after arrival.', 'https://www.make-it-in-germany.com'],
  ['P12', 'Germany - Recognition Act (Anerkennungsgesetz)', 'Country', 'Germany', 'Make it in Germany', 'Law / directive', 'Access', 'Opens', 2012, 'Implemented', 2, 1,
   'Legal right to have foreign professional qualifications assessed against German standards.', 'https://www.anerkennung-in-deutschland.de'],
  ['P13', 'Germany - Kenya migration and mobility agreement', 'Country', 'Germany', 'Make it in Germany', 'Bilateral agreement', 'Access', 'Opens', 2024, 'Adopted', 3, 1,
   'Bilateral framework for skilled-worker mobility from Kenya. Check implementation status.', 'https://www.make-it-in-germany.com'],
  ['P14', 'Germany - Citizenship modernisation (5 years, dual citizenship)', 'Country', 'Germany', '', 'Law / directive', 'Settlement', 'Opens', 2024, 'Implemented', 2, 1,
   'Shorter residence requirement for naturalisation and general acceptance of dual citizenship.', ''],
  ['P15', 'France - Talent Passport (passeport talent)', 'Country', 'France', '', 'Residence permit', 'Access', 'Opens', 2016, 'Implemented', 2, 1,
   'Multi-year residence permit for skilled workers, researchers, founders and their families.', 'https://france-visas.gouv.fr'],
  ['P16', 'Netherlands - Highly Skilled Migrant scheme', 'Country', 'Netherlands', '', 'Residence permit', 'Access', 'Opens', 2004, 'Implemented', 2, 1,
   'Fast-track permit via recognised sponsor employers above a salary threshold.', 'https://ind.nl'],
  ['P17', 'Netherlands - 30% ruling (tax facility for skilled migrants)', 'Country', 'Netherlands', '', 'Tax measure', 'Reward', 'Mixed', 2012, 'Implemented', 2, 1,
   'Tax-free allowance for recruited skilled migrants; has been reduced in recent reforms - check the current rate.', ''],
  ['P18', 'Ireland - Critical Skills Employment Permit', 'Country', 'Ireland', '', 'Residence permit', 'Access', 'Opens', 2014, 'Implemented', 2, 1,
   'Permit for occupations on the critical skills list, with a faster route to longer-term residence.', 'https://enterprise.gov.ie'],
  ['P19', 'Sweden - higher salary threshold for work permits', 'Country', 'Sweden', '', 'Law / directive', 'Access', 'Restricts', 2023, 'Implemented', 2, 1,
   'Minimum salary for work permits raised to a share of the median wage - harder entry for early-career graduates.', ''],
  ['P20', 'Spain - immigration regulation reform (Reglamento de Extranjeria)', 'Country', 'Spain', '', 'Regulation', 'Settlement', 'Opens', 2024, 'Implemented', 2, 1,
   'Wider routes to regularise and settle (arraigo), job-search visas. Check details and dates.', ''],
  ['P21', 'Belgium-Morocco ICT mobility pilot (PALIM)', 'Africa-EU', 'Belgium', 'Enabel (Belgian development agency)', 'Pilot project', 'Access', 'Opens', 2019, 'Evaluated', 3, 1,
   'Pilot training Moroccan ICT graduates for jobs in Belgium; an early test of skills partnerships.', ''],
  ['P22', 'Rabat Process (Euro-African dialogue on migration and development)', 'Africa-EU', '', 'ICMPD - International Centre for Migration Policy Development', 'Dialogue process', 'Access', 'Mixed', 2006, 'Implemented', 3, 3,
   'Intergovernmental dialogue between European and African states; covers legal migration but also border control.', 'https://www.rabat-process.org']
];

var ACT_HEAD = ['Date', 'Organisation', 'Related policy', 'Activity type', 'Barrier (pillar)', 'What happened / outcome', 'Link', 'Notes'];
var ACT_TYPES = ['Report / study', 'Consultation response', 'Law / decision', 'Programme launch', 'Funding', 'Event',
  'Statement / campaign', 'Complaint / court case', 'Evaluation'];

function buildPolicies_(ss) {
  var sh = freshSheet_(ss, SHEETS.POLICIES);
  var rows = DEFAULT_POLICIES.map(function (p) {
    // ID..Year, Stage, relevance, reach, evidence (yours), strength (formula later), what, link, checked, notes
    var body = p[4] || (p[3] ? 'Government of ' + p[3] : '');
    return [p[0], p[1], p[2], p[3], body, p[5], p[6], p[7], p[8], p[9], p[10], p[11], '', '', p[12], p[13], '', 'Check status and link'];
  });
  writeTable_(sh, POL_HEAD, rows);
  formatPolicyRows_(ss, sh, 2, rows.length + 60);
  [45, 300, 85, 95, 230, 120, 110, 95, 55, 95, 80, 70, 85, 85, 380, 230, 95, 160].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  sh.setFrozenColumns(2);
  sh.getRange(1, 1, rows.length + 61, POL_HEAD.length).createFilter();
}

function formatPolicyRows_(ss, sh, first, n) {
  var list = function (col, values) {
    sh.getRange(first, col, n, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(values, true).build());
  };
  list(POL.LEVEL, POL_LEVELS); list(POL.TYPE, POL_TYPES); list(POL.PILLAR, PILLARS);
  list(POL.EFFECT, POL_EFFECTS); list(POL.STAGE, POL_STAGES);
  [POL.REL, POL.REACH, POL.EVID].forEach(function (c) {
    sh.getRange(first, c, n, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireNumberBetween(0, 3).setAllowInvalid(false).build());
  });
  var orgs = ss.getSheetByName(SHEETS.ORGS);
  if (orgs) sh.getRange(first, POL.BODY, n, 1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInRange(orgs.getRange('A2:A'), true).setAllowInvalid(true).build());
  sh.getRange(first, POL.CHECKED, n, 1).setNumberFormat('yyyy-mm-dd');
  sh.getRange(first, 1, n, POL_HEAD.length).setBackground(COLORS.input).setVerticalAlignment('top');
  sh.getRange(first, POL.WHAT, n, 1).setWrap(true);

  var f = [];
  for (var r = first; r < first + n; r++) {
    f.push(['=IF($B' + r + '="","",ROUND(IFERROR(MATCH($J' + r + ',{"Idea","Proposed","Adopted","Implemented","Evaluated"},0)-1,0)/4*40+' +
      'N($K' + r + ')/3*25+N($L' + r + ')/3*20+N($M' + r + ')/3*15,0))']);
  }
  sh.getRange(first, POL.STRENGTH, n, 1).setFormulas(f).setBackground(COLORS.calc).setFontWeight('bold').setHorizontalAlignment('center');
  sh.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Opens').setBackground('#B7E1CD').setRanges([sh.getRange(first, POL.EFFECT, n, 1)]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Mixed').setBackground(COLORS.mid).setRanges([sh.getRange(first, POL.EFFECT, n, 1)]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Restricts').setBackground(COLORS.bad).setRanges([sh.getRange(first, POL.EFFECT, n, 1)]).build()
  ]);
}

function buildActivity_(ss) {
  var sh = freshSheet_(ss, SHEETS.ACTIVITY);
  writeTable_(sh, ACT_HEAD, []);
  var n = 300;
  sh.getRange(2, 1, n, ACT_HEAD.length).setBackground(COLORS.input).setVerticalAlignment('top');
  sh.getRange(2, 1, n, 1).setNumberFormat('yyyy-mm-dd')
    .setDataValidation(SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(false).setHelpText('Enter a date').build());
  var orgs = ss.getSheetByName(SHEETS.ORGS), pols = ss.getSheetByName(SHEETS.POLICIES);
  if (orgs) sh.getRange(2, 2, n, 1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInRange(orgs.getRange('A2:A'), true).setAllowInvalid(true).build());
  if (pols) sh.getRange(2, 3, n, 1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInRange(pols.getRange('B2:B'), true).setAllowInvalid(true).build());
  sh.getRange(2, 4, n, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(ACT_TYPES, true).build());
  sh.getRange(2, 5, n, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(PILLARS, true).build());
  sh.getRange(2, 6, n, 1).setWrap(true);
  [95, 280, 280, 150, 110, 380, 230, 200].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
}

function buildPolicyAnalysis_(ss, n, nI) {
  var sh = freshSheet_(ss, SHEETS.POLICY_ANALYSIS);
  var P = SHEETS.POLICIES, Aq = "'" + SHEETS.ACTIVITY + "'", S = SHEETS.SCORES, L = scoreLayout_(nI);
  var pc = function (col) { return P + '!$' + colLetter_(col) + '$2:$' + colLetter_(col); };
  var pillarR = pc(POL.PILLAR), effectR = pc(POL.EFFECT), stageR = pc(POL.STAGE), strengthR = pc(POL.STRENGTH),
      bodyR = pc(POL.BODY), nameR = pc(POL.NAME);
  var actOrg = Aq + '!$B$2:$B', actDate = Aq + '!$A$2:$A';

  sh.getRange('A1').setValue('Policy Analysis').setFontSize(20).setFontWeight('bold').setFontColor(COLORS.title);
  sh.getRange('A2').setValue('THE QUESTION: ' + POLICY_QUESTION).setFontStyle('italic');

  // --- A. barriers addressed
  section_(sh, 11, 'A. WHICH BARRIERS DO POLICIES ADDRESS?');
  sh.getRange(12, 1, 1, 5).setValues([['Pillar', 'Opens', 'Mixed', 'Restricts', 'Avg strength of opening policies']]);
  styleHeader_(sh.getRange(12, 1, 1, 5));
  var a = PILLARS.map(function (p, k) {
    var r = 13 + k;
    return [p,
      '=COUNTIFS(' + pillarR + ',$A' + r + ',' + effectR + ',"Opens")',
      '=COUNTIFS(' + pillarR + ',$A' + r + ',' + effectR + ',"Mixed")',
      '=COUNTIFS(' + pillarR + ',$A' + r + ',' + effectR + ',"Restricts")',
      '=IFERROR(ROUND(AVERAGEIFS(' + strengthR + ',' + pillarR + ',$A' + r + ',' + effectR + ',"Opens"),0),"")'];
  });
  sh.getRange(13, 1, 4, 5).setValues(a.map(function (x) { return [x[0], '', '', '', '']; }));
  sh.getRange(13, 2, 4, 4).setFormulas(a.map(function (x) { return x.slice(1); }));

  // --- B. pipeline
  section_(sh, 18, 'B. POLICY PIPELINE - HOW FAR ALONG ARE THEY?');
  sh.getRange(19, 1, 1, 2).setValues([['Stage', 'Number of policies']]);
  styleHeader_(sh.getRange(19, 1, 1, 2));
  sh.getRange(20, 1, POL_STAGES.length, 1).setValues(POL_STAGES.map(function (s) { return [s]; }));
  sh.getRange(20, 2, POL_STAGES.length, 1).setFormulas(POL_STAGES.map(function (s, k) {
    return ['=COUNTIF(' + stageR + ',$A' + (20 + k) + ')'];
  }));

  // --- C. gap analysis
  section_(sh, 26, 'C. GAP ANALYSIS - WHERE COUNTRIES ARE WEAK vs WHERE POLICIES FOCUS');
  sh.getRange(27, 1, 1, 4).setValues([['Pillar', 'Need (100 - average country score)', 'Policy attention (% of opening policies)', 'Gap (need - attention)']]);
  styleHeader_(sh.getRange(27, 1, 1, 4));
  var c = PILLARS.map(function (p, k) {
    var r = 28 + k;
    var col = colLetter_(L.pillarStart + k);
    var rng = S + '!$' + col + '$' + DATA_FIRST_ROW + ':$' + col + '$' + (DATA_FIRST_ROW + Math.max(n, 1) - 1);
    return ['=IF(COUNT(' + rng + ')=0,"",ROUND(100-AVERAGE(' + rng + '),0))',
            '=IF(COUNTIF(' + effectR + ',"Opens")=0,"",ROUND(COUNTIFS(' + pillarR + ',$A' + r + ',' + effectR + ',"Opens")/COUNTIF(' + effectR + ',"Opens")*100,0))',
            '=IF(OR(B' + r + '="",C' + r + '=""),"",B' + r + '-C' + r + ')'];
  });
  sh.getRange(28, 1, 4, 1).setValues(PILLARS.map(function (p) { return [p]; }));
  sh.getRange(28, 2, 4, 3).setFormulas(c);
  sh.getRange(32, 1).setValue('Need comes from the Scores tab (low country scores = high need). Attention = share of all "Opens" policies that target this pillar. A large positive gap = a neglected barrier.')
    .setFontStyle('italic').setFontColor('#666666');

  // --- D. effort by body
  section_(sh, 34, 'D. WHO IS DRIVING CHANGE? (policies led + activities logged)');
  sh.getRange(35, 1, 1, 4).setValues([['Organisation / body', 'Policies led', 'Activities logged', 'Total']]);
  styleHeader_(sh.getRange(35, 1, 1, 4));
  sh.getRange(36, 1).setFormula('=IFERROR(ARRAY_CONSTRAIN(ARRAYFORMULA(LET(' +
    'all,{' + bodyR + ';' + actOrg + '},' +
    'u,UNIQUE(FILTER(all,all<>"")),' +
    'p,COUNTIF(' + bodyR + ',u),' +
    'a,COUNTIF(' + actOrg + ',u),' +
    'SORT({u,p,a,p+a},4,FALSE))),15,4),' +
    '"Fill Lead body in Policies or log activities in Policy Activity to see who drives change.")');

  // --- E. activity over time
  section_(sh, 53, 'E. ACTIVITY OVER TIME (from the Policy Activity log)');
  sh.getRange(54, 1, 1, 2).setValues([['Year', 'Activities logged']]);
  styleHeader_(sh.getRange(54, 1, 1, 2));
  var thisYear = new Date().getFullYear(), years = [];
  for (var y = 2015; y <= thisYear + 1; y++) years.push(y);
  sh.getRange(55, 1, years.length, 1).setValues(years.map(function (v) { return [v]; })).setNumberFormat('0');
  sh.getRange(55, 2, years.length, 1).setFormulas(years.map(function (v, k) {
    var r = 55 + k;
    return ['=COUNTIFS(' + actDate + ',">="&DATE($A' + r + ',1,1),' + actDate + ',"<"&DATE($A' + r + '+1,1,1))'];
  }));

  // --- key findings (top, uses the tables above)
  section_(sh, 4, 'KEY FINDINGS');
  var findings = [
    '="Policies tracked: "&COUNTA(' + nameR + ')&".   Opening doors: "&COUNTIF(' + effectR + ',"Opens")&"   |   Mixed: "&COUNTIF(' + effectR +
      ',"Mixed")&"   |   Restricting: "&COUNTIF(' + effectR + ',"Restricts")&"."',
    '=IF(MAX(B13:B16)=0,"Most policy attention will appear here once policies are marked.","Most opening policies target: "&UPPER(INDEX(A13:A16,MATCH(MAX(B13:B16),B13:B16,0)))&" ("&MAX(B13:B16)&" policies).")',
    '=IF(COUNT(D28:D31)=0,"The biggest neglected barrier appears here once the Data tab has scores.","Most neglected barrier: "&UPPER(INDEX(A28:A31,MATCH(MAX(D28:D31),D28:D31,0)))&" - countries score weakest there relative to the policy attention it gets (gap "&MAX(D28:D31)&").")',
    '=IFERROR(IF(A36="","","Most active bodies: "&TEXTJOIN(", ",TRUE,ARRAY_CONSTRAIN(A36:A50,3,1))&"."),"")',
    '="In the pipeline (proposed or adopted, not yet in force): "&(COUNTIF(' + stageR + ',"Proposed")+COUNTIF(' + stageR + ',"Adopted"))&" - these are the ones where consultations and advocacy can still change the outcome."',
    '="Policies with evaluated impact: "&COUNTIF(' + stageR + ',"Evaluated")&". Few evaluations means effort is visible, but results are not yet proven - fill Evidence of impact (0-3) as you find evaluations."'
  ];
  sh.getRange(5, 1, findings.length, 1).setFormulas(findings.map(function (x) { return [x]; }));

  // --- charts (right side)
  var cc = 7; // column G
  var chart = function (type, ranges, row, title, opts) {
    var b = sh.newChart().setChartType(type).setPosition(row, cc, 0, 0).setOption('title', title)
      .setOption('width', 560).setOption('height', 300);
    ranges.forEach(function (r) { b.addRange(r); });
    Object.keys(opts || {}).forEach(function (k) { b.setOption(k, opts[k]); });
    sh.insertChart(b.build());
  };
  chart(Charts.ChartType.BAR, [sh.getRange(12, 1, 5, 4)], 1, 'Policies by barrier and effect',
    { isStacked: true, colors: ['#6A994E', '#F2A541', '#C0392B'], legend: { position: 'top' } });
  chart(Charts.ChartType.COLUMN, [sh.getRange(19, 1, POL_STAGES.length + 1, 2)], 17, 'Policy pipeline (number of policies per stage)',
    { colors: ['#1F4E78'], legend: { position: 'none' } });
  chart(Charts.ChartType.COLUMN, [sh.getRange(27, 1, 5, 3)], 33, 'Need vs policy attention per barrier (0-100)',
    { colors: ['#C0392B', '#2E86AB'], legend: { position: 'top' }, vAxis: { minValue: 0, maxValue: 100 } });
  chart(Charts.ChartType.BAR, [sh.getRange(35, 1, 16, 3)], 49, 'Who is driving change (top 15)',
    { isStacked: true, colors: ['#1F4E78', '#F2A541'], legend: { position: 'top' } });
  chart(Charts.ChartType.LINE, [sh.getRange(54, 1, years.length + 1, 2)], 65, 'Policy activity logged per year',
    { colors: ['#1F4E78'], legend: { position: 'none' } });

  [210, 90, 90, 90, 120, 30].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  sh.setHiddenGridlines(true);
}

// ============================================================================
// CODE UPDATES (self-update through the Apps Script API)
// ============================================================================

var SCRIPT_API = 'https://script.googleapis.com/v1/projects/';
var CODE_MARKER = /var APP_NAME = 'Destination Index';/;

function getUpdateUrl_() {
  return PropertiesService.getDocumentProperties().getProperty('UPDATE_URL') || DEFAULT_UPDATE_URL;
}

function showAbout() {
  var msg = APP_NAME + '\nInstalled version: ' + VERSION + '\nUpdate link: ' + getUpdateUrl_() +
    '\nGitHub token set: ' + (PropertiesService.getUserProperties().getProperty('GITHUB_TOKEN') ? 'yes' : 'no');
  SpreadsheetApp.getUi().alert('About', msg, SpreadsheetApp.getUi().ButtonSet.OK);
  return msg;
}

function updateSettings() {
  var ui = SpreadsheetApp.getUi();
  var r = ui.prompt('Update link',
    'Current link:\n' + getUpdateUrl_() + '\n\nPaste a new raw link to Code.gs, type "default" to reset, or leave empty to keep it.',
    ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return 'Cancelled.';
  var url = r.getResponseText().trim();
  var props = PropertiesService.getDocumentProperties();
  if (url.toLowerCase() === 'default') props.deleteProperty('UPDATE_URL');
  else if (url) {
    if (!/^https:\/\//i.test(url)) { ui.alert('The link must start with https://'); return 'Invalid link.'; }
    props.setProperty('UPDATE_URL', toRawGithubUrl_(url));
  }
  var t = ui.prompt('GitHub token (optional)',
    'Only needed if the repository is private. Paste a token with read access, type "clear" to remove it, or leave empty to keep the current setting.',
    ui.ButtonSet.OK_CANCEL);
  if (t.getSelectedButton() === ui.Button.OK) {
    var tok = t.getResponseText().trim(), up = PropertiesService.getUserProperties();
    if (tok.toLowerCase() === 'clear') up.deleteProperty('GITHUB_TOKEN');
    else if (tok) up.setProperty('GITHUB_TOKEN', tok);
  }
  log_('Update settings', 'Update link: ' + getUpdateUrl_());
  return 'Saved. Update link: ' + getUpdateUrl_();
}

/** Turns a normal GitHub file link (github.com/.../blob/...) into its raw link. */
function toRawGithubUrl_(url) {
  var m = String(url).match(/^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/(.+)$/i);
  return m ? 'https://raw.githubusercontent.com/' + m[1] + '/' + m[2] + '/' + m[3] : url;
}

function updateCode() {
  var ui = SpreadsheetApp.getUi();
  var url = getUpdateUrl_();

  // 1. Download the new code
  var headers = {};
  var tok = PropertiesService.getUserProperties().getProperty('GITHUB_TOKEN');
  if (tok) headers.Authorization = 'token ' + tok;
  var resp = UrlFetchApp.fetch(url + (url.indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now(),
    { muteHttpExceptions: true, headers: headers, followRedirects: true });
  if (resp.getResponseCode() !== 200) {
    var m1 = 'Could not download the new code (HTTP ' + resp.getResponseCode() + ').\nLink: ' + url +
      '\n\nCheck the link in Code updates > Update settings. If the repository is private, add a GitHub token there.';
    ui.alert('Update failed', m1, ui.ButtonSet.OK); log_('Update', 'ERROR download HTTP ' + resp.getResponseCode());
    return 'Update failed: download error.';
  }
  var newCode = resp.getContentText();
  var check = validateCode_(newCode);
  if (!check.ok) {
    ui.alert('Update stopped', 'The downloaded file does not look like this tool (' + check.reason + '). Nothing was changed.', ui.ButtonSet.OK);
    log_('Update', 'ERROR invalid code: ' + check.reason);
    return 'Update stopped: invalid code.';
  }
  var newVersion = check.version;

  // 2. Confirm
  var same = newVersion === VERSION;
  var answer = ui.alert(same ? 'Already up to date' : 'Update available',
    'Installed: ' + VERSION + '\nAvailable: ' + newVersion + '\n\n' +
    (same ? 'Install this version again anyway?' : 'Install the new version? Your data stays as it is.'),
    ui.ButtonSet.YES_NO);
  if (answer !== ui.Button.YES) return 'Update cancelled.';

  // 3a. Automatic install - only possible if the optional permission is set up (Guide section 14)
  var project = readProject_();
  if (project.ok) {
    var target = findCodeFile_(project.files);
    backupCode_(target ? target.source : '', VERSION);
    var files = project.files.map(function (f) { return { name: f.name, type: f.type, source: f.source }; });
    if (target) files.forEach(function (f) { if (f.name === target.name && f.type === 'SERVER_JS') f.source = newCode; });
    else files.push({ name: 'Code', type: 'SERVER_JS', source: newCode });
    var result = writeProject_(files);
    if (result.ok) {
      log_('Update', 'Code updated automatically from ' + VERSION + ' to ' + newVersion + ' (' + url + ').');
      ui.alert('Updated to ' + newVersion,
        'Done. Now:\n1. Reload this Sheet (F5).\n2. Destination Index > Build / repair the sheet.\n\nIf something is wrong: Code updates > Restore previous code.',
        ui.ButtonSet.OK);
      return 'Updated to ' + newVersion + '. Reload the Sheet, then Build / repair.';
    }
  }

  // 3b. Copy-paste install (works with the single code file, no extra setup)
  log_('Update', 'Showing version ' + newVersion + ' for copy-paste install (installed: ' + VERSION + ').');
  showInstallDialog_(newCode, 'Install version ' + newVersion,
    'Installed: ' + VERSION + '  ->  new: ' + newVersion);
  return 'Version ' + newVersion + ' is ready - follow the 4 steps in the window.';
}

function restorePreviousCode() {
  var ui = SpreadsheetApp.getUi();
  var backup = readBackup_();
  if (!backup) {
    var hist = githubHistoryUrl_(getUpdateUrl_());
    ui.alert('No backup in this Sheet',
      'Backups are only saved by the automatic install (Guide section 14).\n\n' +
      'Every earlier version is kept on GitHub' + (hist ? ':\n' + hist : '.') +
      '\nOpen it, pick the version, click "Raw", copy all and paste it over Code.gs.', ui.ButtonSet.OK);
    return 'No backup in this Sheet - see GitHub history.';
  }
  var ok = ui.alert('Restore previous code?', 'Restore version ' + backup.version + ' saved on ' + backup.date + '?', ui.ButtonSet.YES_NO);
  if (ok !== ui.Button.YES) return 'Restore cancelled.';

  var project = readProject_();
  if (project.ok) {
    var target = findCodeFile_(project.files);
    var files = project.files.map(function (f) { return { name: f.name, type: f.type, source: f.source }; });
    if (target) files.forEach(function (f) { if (f.name === target.name && f.type === 'SERVER_JS') f.source = backup.source; });
    else files.push({ name: 'Code', type: 'SERVER_JS', source: backup.source });
    if (writeProject_(files).ok) {
      log_('Restore', 'Code restored to version ' + backup.version + '.');
      ui.alert('Restored', 'Version ' + backup.version + ' restored. Reload the Sheet (F5).', ui.ButtonSet.OK);
      return 'Restored ' + backup.version + '. Reload the Sheet.';
    }
  }
  showInstallDialog_(backup.source, 'Restore version ' + backup.version, 'Backup saved on ' + backup.date);
  return 'Backup ' + backup.version + ' ready - follow the steps in the window.';
}

/** raw.githubusercontent.com/o/r/branch/path -> github.com/o/r/commits/branch/path */
function githubHistoryUrl_(rawUrl) {
  var m = String(rawUrl).match(/^https:\/\/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/(.+)$/i);
  return m ? 'https://github.com/' + m[1] + '/' + m[2] + '/commits/' + m[3] : '';
}

/** Window with the code, a Copy button, a link to the editor and the paste steps. */
function showInstallDialog_(code, title, subtitle) {
  var editor = 'https://script.google.com/home/projects/' + ScriptApp.getScriptId() + '/edit';
  // Embed the code safely inside a <script> block
  var safe = JSON.stringify(code).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  var html = '<!DOCTYPE html><html><head><base target="_blank"><style>' +
    'body{font-family:Arial,sans-serif;font-size:13px;margin:12px;color:#222}' +
    '.sub{color:#555;margin-bottom:10px}ol{padding-left:20px;margin:6px 0 10px}li{margin:6px 0}' +
    'button,a.btn{display:inline-block;padding:8px 14px;margin:2px 6px 2px 0;border:0;border-radius:4px;background:#1F4E78;color:#fff;font-size:13px;cursor:pointer;text-decoration:none}' +
    'a.btn.sec,button.sec{background:#e8eef5;color:#1F4E78}' +
    'kbd{background:#eee;border:1px solid #ccc;border-radius:3px;padding:0 4px;font-size:12px}' +
    'textarea{width:100%;height:170px;font-family:monospace;font-size:11px;margin-top:8px}' +
    '#st{margin-left:6px;font-weight:bold;color:#1a7f37}' +
    '</style></head><body>' +
    '<div class="sub">' + escapeHtml_(subtitle) + ' - your data is not touched.</div>' +
    '<ol>' +
    '<li><button onclick="copyCode()">1. Copy code</button><span id="st"></span></li>' +
    '<li><a class="btn" href="' + editor + '">2. Open the Apps Script editor</a> (or Extensions &gt; Apps Script)</li>' +
    '<li>3. Click inside <b>Code.gs</b>, press <kbd>Ctrl</kbd>+<kbd>A</kbd> then <kbd>Ctrl</kbd>+<kbd>V</kbd> ' +
    '(Mac: <kbd>Cmd</kbd>), then save with <kbd>Ctrl</kbd>+<kbd>S</kbd>.</li>' +
    '<li>4. Come back here, reload the Sheet (<kbd>F5</kbd>), then <b>Destination Index &gt; Build / repair the sheet</b>.</li>' +
    '</ol>' +
    '<button class="sec" onclick="download()">Download Code.gs instead</button>' +
    '<button class="sec" onclick="google.script.host.close()">Close</button>' +
    '<textarea id="code" readonly></textarea>' +
    '<script>' +
    'var CODE=' + safe + ';var ta=document.getElementById("code");ta.value=CODE;' +
    'function ok(t){document.getElementById("st").textContent=t;}' +
    'function copyCode(){' +
    ' var fallback=function(){ta.focus();ta.select();var done=false;try{done=document.execCommand("copy");}catch(e){}' +
    '  ok(done?"Copied!":"Code selected below - press Ctrl+C (Cmd+C) now.");};' +
    ' if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(CODE).then(function(){ok("Copied!");},fallback);}else{fallback();}' +
    '}' +
    'function download(){var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([CODE],{type:"text/plain"}));' +
    ' a.download="Code.gs";document.body.appendChild(a);a.click();a.remove();}' +
    '</script></body></html>';
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(760).setHeight(520), title);
}

function escapeHtml_(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Pure check (testable): is this text a version of this tool? */
function validateCode_(code) {
  if (!code || code.length < 5000) return { ok: false, reason: 'file too small' };
  if (!CODE_MARKER.test(code)) return { ok: false, reason: 'tool name marker missing' };
  if (!/function onOpen\s*\(/.test(code)) return { ok: false, reason: 'onOpen missing' };
  if (/^\s*</.test(code)) return { ok: false, reason: 'looks like a web page, not code' };
  var v = code.match(/var VERSION = '([^']+)'/);
  if (!v) return { ok: false, reason: 'VERSION missing' };
  return { ok: true, version: v[1] };
}

/** Picks the project file that holds this tool (so other script files are left alone). */
function findCodeFile_(files) {
  var js = files.filter(function (f) { return f.type === 'SERVER_JS'; });
  for (var i = 0; i < js.length; i++) if (CODE_MARKER.test(js[i].source || '')) return js[i];
  for (var j = 0; j < js.length; j++) if (js[j].name === 'Code') return js[j];
  return null;
}

// Optional: paste this into appsscript.json to let "Update code" install automatically (Guide section 14).
var OPTIONAL_MANIFEST = JSON.stringify({
  timeZone: 'Europe/Berlin', dependencies: {}, exceptionLogging: 'STACKDRIVER', runtimeVersion: 'V8',
  oauthScopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/script.container.ui',
    'https://www.googleapis.com/auth/script.external_request',
    'https://www.googleapis.com/auth/script.projects'
  ]
});

function readProject_() {
  var resp = UrlFetchApp.fetch(SCRIPT_API + ScriptApp.getScriptId() + '/content', {
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true
  });
  if (resp.getResponseCode() !== 200) return { ok: false, message: apiError_(resp) };
  return { ok: true, files: JSON.parse(resp.getContentText()).files || [] };
}

function writeProject_(files) {
  var resp = UrlFetchApp.fetch(SCRIPT_API + ScriptApp.getScriptId() + '/content', {
    method: 'put', contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    payload: JSON.stringify({ files: files }), muteHttpExceptions: true
  });
  if (resp.getResponseCode() !== 200) return { ok: false, message: apiError_(resp) };
  return { ok: true };
}

function apiError_(resp) {
  var code = resp.getResponseCode(), text = resp.getContentText(), detail = text;
  try { detail = JSON.parse(text).error.message; } catch (ignore) {}
  log_('Update', 'Apps Script API HTTP ' + code + ': ' + String(detail).slice(0, 300));
  return 'Google refused the code change (HTTP ' + code + '): ' + String(detail).slice(0, 300);
}

/** Stores code in a hidden tab, in chunks (a cell holds max 50,000 characters). */
function backupCode_(source, version) {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(BACKUP_SHEET) || ss.insertSheet(BACKUP_SHEET);
  sh.clear();
  var chunks = [];
  // "|" prefix keeps Sheets from reading a chunk that starts with = + - @ as a formula
  for (var i = 0; i < source.length; i += 40000) chunks.push(['|' + source.substr(i, 40000)]);
  sh.getRange(1, 1, 1, 3).setValues([[version, new Date(), chunks.length]]);
  if (chunks.length) sh.getRange(3, 1, chunks.length, 1).setNumberFormat('@').setValues(chunks);
  sh.hideSheet();
}

function readBackup_() {
  var sh = SpreadsheetApp.getActive().getSheetByName(BACKUP_SHEET);
  if (!sh || sh.getLastRow() < 3) return null;
  var head = sh.getRange(1, 1, 1, 3).getValues()[0];
  var n = Number(head[2]) || 0;
  if (!n) return null;
  var source = sh.getRange(3, 1, n, 1).getValues().map(function (r) { return String(r[0]).substr(1); }).join('');
  if (!validateCode_(source).ok) return null;
  return { version: String(head[0]), date: String(head[1]), source: source };
}

// ============================================================================
// HELPERS
// ============================================================================

function freshSheet_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (sh) {
    if (sh.getFilter()) sh.getFilter().remove();
    sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).clearDataValidations();
    sh.clear(); sh.clearConditionalFormatRules();
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
