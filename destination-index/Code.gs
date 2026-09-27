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
var VERSION = '1.2.0';

// Where "Update code" downloads the newest version from (changeable in the menu).
var DEFAULT_UPDATE_URL =
  'https://raw.githubusercontent.com/emisembe/quote-script/claude/friendly-hopper-iizkrp/destination-index/Code.gs';
var BACKUP_SHEET = '_CodeBackup';

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
  var values = lines.map(function (l) { return [l[0]]; });
  sh.getRange(1, 1, values.length, 1).setValues(values).setWrap(true).setVerticalAlignment('top')
    .setFontSize(10).setFontFamily('Arial').setFontColor('#222222').setBackground(null).setFontWeight('normal');
  lines.forEach(function (l, i) {
    var cell = sh.getRange(i + 1, 1);
    switch (l[1]) {
      case 'title': cell.setFontSize(20).setFontWeight('bold').setFontColor(COLORS.title); break;
      case 'sub': cell.setFontStyle('italic').setFontColor('#555555'); break;
      case 'h': cell.setFontSize(12).setFontWeight('bold').setFontColor(COLORS.headerText).setBackground(COLORS.header); break;
      case 'h2': cell.setFontWeight('bold').setFontColor(COLORS.title).setBackground('#E8EEF5'); break;
      case 'code': cell.setFontFamily('Roboto Mono').setFontSize(9).setBackground('#F4F4F4'); break;
      case 'tip': cell.setBackground('#FFF8E1'); break;
      case 'warn': cell.setBackground('#FDECEA'); break;
    }
  });
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
    ['Version ' + VERSION + '. This tab explains everything: setup, every button, every tab, every indicator, the maths, adding your own links, updating the code, and fixing problems.', 'sub'],
    ['Contents: 1 What this tool is | 2 First-time setup | 3 Menu | 4 Control panel | 5 Recommended workflow | 6 The tabs | 7 The indicators | ' +
     '8 Source links (Eurostat & CSV) | 9 Adding indicators & countries | 10 How the score is calculated | 11 Weights & thresholds | ' +
     '12 Reading the Dashboard | 13 Evidence rules | 14 Updating the code | 15 Troubleshooting | 16 FAQ | 17 Glossary | 18 Limits', 'sub']
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
    ['Step 6 (optional, once). Set up automatic code updates - see section 14.', 'text'],
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
    ['Code updates > Update code to the latest version - downloads the newest code and installs it (section 14).', 'text'],
    ['Code updates > Restore previous code - puts back the code from before the last update.', 'text'],
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
    ['A fetched value OVERWRITES what is in that Data cell. If you prefer your manual value for a country, untick Enabled for that source after the first fetch, or fix the value afterwards.', 'warn']
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
    ['Thresholds (B5, B6) decide the verdict labels; B7 decides how much data is needed before any verdict is given.', 'text'],
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
    ['When the code is improved, you do not need to copy-paste again: Destination Index > Code updates > Update code to the latest version.', 'text'],
    ['What it does: downloads the newest Code.gs from the update link (GitHub), checks it is a valid version of this tool, saves your current code in the hidden _CodeBackup tab, installs the new code, and tells you the old and new version. Your data is not touched.', 'text'],
    ['After updating: reload the Sheet (F5), then click Build / repair the sheet once so new tabs/formulas appear.', 'text'],
    ['ONE-TIME SETUP (needed before the first update)', 'h2'],
    ['Google only lets a script rewrite its own code if you allow it. Do this once:', 'text'],
    ['a) Open https://script.google.com/home/usersettings and switch "Google Apps Script API" ON.', 'code'],
    ['b) In the Apps Script editor: Project Settings (gear icon) > tick "Show appsscript.json manifest file in editor".', 'code'],
    ['c) Open appsscript.json in the editor, replace its content with the appsscript.json provided with the code, Save.', 'code'],
    ['d) Run any menu item once and accept the new permission ("Create and update Google Apps Script projects").', 'code'],
    ['If the update button says "setup needed", one of these steps is missing - the message tells you which.', 'text'],
    ['Restore previous code: Code updates > Restore previous code puts back the version saved before the last update.', 'text'],
    ['Update settings: change the download link (e.g. to a different branch or your own copy) or add a GitHub token if the repository becomes private. The token is stored only for your Google account.', 'text'],
    ['Manual fallback (always works): open the update link in a browser, copy all, paste over Code.gs in the editor, Save, reload.', 'tip']
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
    ['Update says "setup needed" -> do the one-time setup in section 14. "HTTP 404" on update -> the update link is wrong; fix it in Update settings.', 'text'],
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
    (same ? 'Reinstall this version anyway?' : 'Install the new version? Your data stays as it is; the current code is backed up first.'),
    ui.ButtonSet.YES_NO);
  if (answer !== ui.Button.YES) return 'Update cancelled.';

  // 3. Read the current project, back it up, replace the code file
  var project = readProject_();
  if (!project.ok) { ui.alert('Setup needed', project.message, ui.ButtonSet.OK); return 'Update needs setup.'; }
  var target = findCodeFile_(project.files);
  backupCode_(target ? target.source : '', VERSION);

  var files = project.files.map(function (f) { return { name: f.name, type: f.type, source: f.source }; });
  if (target) files.forEach(function (f) { if (f.name === target.name && f.type === 'SERVER_JS') f.source = newCode; });
  else files.push({ name: 'Code', type: 'SERVER_JS', source: newCode });

  var result = writeProject_(files);
  if (!result.ok) { ui.alert('Update failed', result.message, ui.ButtonSet.OK); return 'Update failed.'; }

  log_('Update', 'Code updated from ' + VERSION + ' to ' + newVersion + ' (' + url + ').');
  ui.alert('Updated to ' + newVersion,
    'Done. Now:\n1. Reload this Sheet (F5).\n2. Destination Index > Build / repair the sheet.\n\nIf something is wrong: Code updates > Restore previous code.',
    ui.ButtonSet.OK);
  return 'Updated to ' + newVersion + '. Reload the Sheet, then Build / repair.';
}

function restorePreviousCode() {
  var ui = SpreadsheetApp.getUi();
  var backup = readBackup_();
  if (!backup) { ui.alert('No backup found. A backup is made automatically before each update.'); return 'No backup.'; }
  var ok = ui.alert('Restore previous code?', 'Restore version ' + backup.version + ' saved on ' + backup.date + '?', ui.ButtonSet.YES_NO);
  if (ok !== ui.Button.YES) return 'Restore cancelled.';

  var project = readProject_();
  if (!project.ok) { ui.alert('Setup needed', project.message, ui.ButtonSet.OK); return 'Restore needs setup.'; }
  var target = findCodeFile_(project.files);
  var files = project.files.map(function (f) { return { name: f.name, type: f.type, source: f.source }; });
  if (target) files.forEach(function (f) { if (f.name === target.name && f.type === 'SERVER_JS') f.source = backup.source; });
  else files.push({ name: 'Code', type: 'SERVER_JS', source: backup.source });

  var result = writeProject_(files);
  if (!result.ok) { ui.alert('Restore failed', result.message, ui.ButtonSet.OK); return 'Restore failed.'; }
  log_('Restore', 'Code restored to version ' + backup.version + '.');
  ui.alert('Restored', 'Version ' + backup.version + ' restored. Reload the Sheet (F5).', ui.ButtonSet.OK);
  return 'Restored ' + backup.version + '. Reload the Sheet.';
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

var SETUP_HELP =
  'One-time setup for code updates (see Guide, section 14):\n' +
  '1. Open script.google.com/home/usersettings and switch "Google Apps Script API" ON.\n' +
  '2. Apps Script editor > Project Settings > tick "Show appsscript.json manifest file in editor".\n' +
  '3. Replace appsscript.json with the provided appsscript.json and Save.\n' +
  '4. Run the update again and accept the new permission.\n\n' +
  'Manual alternative: open the update link, copy all, paste over Code.gs, Save, reload.';

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
  return 'Google refused the code change (HTTP ' + code + '): ' + String(detail).slice(0, 300) + '\n\n' + SETUP_HELP;
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
