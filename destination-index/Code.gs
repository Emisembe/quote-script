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
 *   4. Destination Index > 1. Build / repair the sheet  (approve permissions once).
 *   5. Read the "Guide" tab.
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

var EU_PORTAL = 'https://immigration-portal.ec.europa.eu/';
function dbLink_(code) { return 'https://ec.europa.eu/eurostat/databrowser/view/' + code + '/default/table'; }

// code, pillar, name, direction (+1 higher is better, -1 lower is better), unit, how, source, link
var INDICATORS = [
  ['A1', 'Access', 'Shortage-occupation / Blue Card pathway for your profession', 1, 'rating 0-10',
   'Manual - use Rubrics tab', 'EU Immigration Portal + national shortage lists', EU_PORTAL],
  ['A2', 'Access', 'EU Blue Card minimum gross salary', -1, 'EUR per year',
   'Manual', 'EU Immigration Portal (Blue Card page per country)', EU_PORTAL],
  ['A3', 'Access', 'Ease of recognising an African degree', 1, 'rating 0-10',
   'Manual - use Rubrics tab', 'ENIC-NARIC national recognition centres', 'https://www.enic-naric.net/'],
  ['F1', 'Fairness', 'Over-qualification gap: non-EU minus nationals, tertiary graduates', -1, 'percentage points',
   'Auto (Eurostat) or manual', 'Eurostat over-qualification rates (migrant integration)', 'https://ec.europa.eu/eurostat/web/migrant-integration/database'],
  ['F2', 'Fairness', 'Employment-rate gap: native-born minus non-EU-born, tertiary graduates', -1, 'percentage points',
   'Auto (Eurostat) or manual', 'Eurostat lfsa_ergaedcob', dbLink_('lfsa_ergaedcob')],
  ['F3', 'Fairness', 'Hiring discrimination ratio: native callbacks / African-origin callbacks (1.0 = fair)', -1, 'ratio',
   'Manual - from published CV field experiments', 'Field-experiment studies (e.g. GEMM project, national testing studies)', 'https://gemm2020.eu/'],
  ['R1', 'Reward', 'Median equivalised net income, purchasing-power adjusted', 1, 'PPS per year',
   'Auto (Eurostat) or manual', 'Eurostat ilc_di03', dbLink_('ilc_di03')],
  ['R2', 'Reward', 'Typical gross salary in YOUR profession (optional)', 1, 'EUR per year',
   'Manual', 'National salary surveys / statistics offices', ''],
  ['R3', 'Reward', 'Price level index (EU27 = 100)', -1, 'index',
   'Auto (Eurostat) or manual', 'Eurostat prc_ppp_ind', dbLink_('prc_ppp_ind')],
  ['S1', 'Settlement', 'Years to permanent residence (skilled-worker route)', -1, 'years',
   'Manual', 'National immigration authority', EU_PORTAL],
  ['S2', 'Settlement', 'Years to citizenship (standard route)', -1, 'years',
   'Manual', 'National citizenship law / authority', ''],
  ['S3', 'Settlement', 'Working-language accessibility (10 = English widely usable at work)', 1, 'rating 0-10',
   'Manual - use Rubrics tab', 'Job-board sample (see Rubrics)', ''],
  ['S4', 'Settlement', 'African-born population', 1, 'thousands',
   'Manual', 'UN DESA International Migrant Stock', 'https://www.un.org/development/desa/pd/content/international-migrant-stock']
];

// Eurostat auto-fetch defaults (editable later in the Sources tab).
// If "Filters B" is filled, the value written is A minus B (a gap), using the latest year both have.
var DEFAULT_SOURCES = [
  ['F1', 'lfsa_eoqgan', 'sex=T&age=Y20-64&citizen=NEU27_2020_FOR', 'sex=T&age=Y20-64&citizen=NAT', 2018, true,
   'By citizenship (proxy for country of birth). Verify codes in the Eurostat data browser.'],
  ['F2', 'lfsa_ergaedcob', 'sex=T&age=Y25-64&isced11=ED5-8&c_birth=NAT', 'sex=T&age=Y25-64&isced11=ED5-8&c_birth=NEU27_2020_FOR', 2018, true,
   'Native-born minus non-EU-born employment rate, tertiary educated.'],
  ['R1', 'ilc_di03', 'age=TOTAL&sex=T&indic_il=MED_E&unit=PPS', '', 2018, true,
   'Median equivalised net income in PPS.'],
  ['R3', 'prc_ppp_ind', 'na_item=PLI_EU27_2020&ppp_cat=GDP', '', 2018, true,
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
// MENU
// ============================================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(APP_NAME)
    .addItem('1. Build / repair the sheet', 'setupIndex')
    .addItem('2. Fetch Eurostat data', 'fetchEurostatData')
    .addItem('3. Refresh scores & dashboard', 'rebuildFormulas')
    .addSeparator()
    .addItem('Add a country', 'addCountry')
    .addItem('Open the Guide', 'showGuide')
    .addSeparator()
    .addItem('Reset everything (deletes your data)', 'resetEverything')
    .addToUi();
}

function showGuide() {
  var sh = SpreadsheetApp.getActive().getSheetByName(SHEETS.GUIDE);
  if (sh) SpreadsheetApp.getActive().setActiveSheet(sh);
  else setupIndex();
}

// ============================================================================
// SETUP
// ============================================================================

/**
 * Creates any missing tabs. Guide, Indicators, Rubrics, Scores and Dashboard
 * are always rebuilt; Data, Evidence, Weights and Sources are only created if
 * missing, so your own entries are never overwritten.
 */
function setupIndex() {
  var ss = SpreadsheetApp.getActive();

  buildGuide_(ss);
  buildIndicators_(ss);
  buildRubrics_(ss);
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
  ss.toast('Done. Start with the Guide tab.', APP_NAME, 6);
}

function resetEverything() {
  var ui = SpreadsheetApp.getUi();
  var r = ui.alert('Reset everything?',
    'This deletes ALL tool tabs including your Data and Evidence entries, then rebuilds them empty. Continue?',
    ui.ButtonSet.YES_NO);
  if (r !== ui.Button.YES) return;
  var ss = SpreadsheetApp.getActive();
  var keep = ss.insertSheet('tmp_' + Date.now()); // a spreadsheet must keep at least one sheet
  Object.keys(SHEETS).forEach(function (k) {
    var sh = ss.getSheetByName(SHEETS[k]);
    if (sh) ss.deleteSheet(sh);
  });
  setupIndex();
  ss.deleteSheet(keep);
}

// ---------------------------------------------------------------------------

function buildGuide_(ss) {
  var sh = freshSheet_(ss, SHEETS.GUIDE);
  var lines = [
    ['African Talent Destination Index', 'title'],
    ['Is this country a realistic destination for African university graduates? This sheet answers that with sourced data and a transparent formula.', 'text'],
    ['', ''],
    ['QUICK START', 'h'],
    ['1. Menu "Destination Index" > "2. Fetch Eurostat data". Fills the automatic indicators (F1, F2, R1, R3) and logs each value in Evidence.', 'text'],
    ['2. Open the Data tab. Fill the remaining yellow cells from the sources listed in the Indicators tab.', 'text'],
    ['3. For every value you type, add one row in the Evidence tab: country, indicator, value, year, source, link.', 'text'],
    ['4. For the 0-10 ratings (A1, A3, S3) use the Rubrics tab so every country is judged the same way.', 'text'],
    ['5. Adjust the Weights tab to your own priorities.', 'text'],
    ['6. Read the result in the Dashboard tab.', 'text'],
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
    ['Data - the only place you type numbers (yellow cells). Row 2 = direction, row 3 = description.', 'text'],
    ['Evidence - source log for every number. If it is not in Evidence, do not trust it.', 'text'],
    ['Weights - pillar weights and verdict thresholds.', 'text'],
    ['Scores - all calculations (green). Do not edit.', 'text'],
    ['Indicators - what each code means, direction, and where to get it.', 'text'],
    ['Sources - settings for the automatic Eurostat fetch. Edit filters here if a fetch fails.', 'text'],
    ['Rubrics - fixed rules for the 0-10 ratings.', 'text'],
    ['Log - what the script did and any errors.', 'text'],
    ['', ''],
    ['ADDING OR REMOVING COUNTRIES', 'h'],
    ['Add: menu > "Add a country" (e.g. Portugal, code PT). Remove: delete its row in Data, then menu > "3. Refresh scores & dashboard".', 'text'],
    ['Eurostat codes: DE, NL, FR, BE, IE, SE, ES, PT, IT, AT, DK, FI, PL, CZ, LU, NO, CH; Greece = EL.', 'text'],
    ['', ''],
    ['WHEN THE AUTO-FETCH FAILS', 'h'],
    ['Look at the Log tab and the "Last status" column in Sources. Usually a filter code is wrong.', 'text'],
    ['Open the dataset in the Eurostat data browser, check the dimension codes, fix Filters A/B in Sources, fetch again.', 'text'],
    ['Or simply copy the value by hand into Data and log it in Evidence.', 'text'],
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
    else if (l[1] === 'code') cell.setFontFamily('Roboto Mono');
  });
  sh.setColumnWidth(1, 900);
  sh.setHiddenGridlines(true);
}

function buildIndicators_(ss) {
  var sh = freshSheet_(ss, SHEETS.INDICATORS);
  var head = ['Code', 'Pillar', 'Indicator', 'Direction', 'Unit', 'How to get it', 'Source', 'Link'];
  var rows = INDICATORS.map(function (x) {
    return [x[0], x[1], x[2], x[3] === 1 ? 'Higher is better' : 'Lower is better', x[4], x[5], x[6], x[7]];
  });
  writeTable_(sh, head, rows);
  [7, 12, 50, 16, 16, 28, 42, 55].forEach(function (w, i) { sh.setColumnWidth(i + 1, w * 7); });
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
  var nI = INDICATORS.length;
  var head = ['Country', 'Eurostat code'].concat(INDICATORS.map(function (x) { return x[0]; })).concat(['Notes']);
  sh.getRange(1, 1, 1, head.length).setValues([head]);
  styleHeader_(sh.getRange(1, 1, 1, head.length));

  var dir = ['Direction (+1 higher better, -1 lower better)', ''].concat(INDICATORS.map(function (x) { return x[3]; })).concat(['']);
  var desc = ['Indicator', ''].concat(INDICATORS.map(function (x) { return x[2] + ' (' + x[4] + ')'; })).concat(['']);
  sh.getRange(2, 1, 1, head.length).setValues([dir]).setFontStyle('italic').setFontColor('#666666');
  sh.getRange(3, 1, 1, head.length).setValues([desc]).setWrap(true).setVerticalAlignment('top').setFontSize(9);
  sh.setRowHeight(3, 110);

  var rows = DEFAULT_COUNTRIES.map(function (c) { return [c[0], c[1]]; });
  sh.getRange(DATA_FIRST_ROW, 1, rows.length, 2).setValues(rows);
  sh.getRange(DATA_FIRST_ROW, 1, rows.length, 1).setFontWeight('bold');
  formatDataRows_(sh, DATA_FIRST_ROW, rows.length);

  sh.setFrozenRows(3); sh.setFrozenColumns(2);
  sh.setColumnWidth(1, 140); sh.setColumnWidth(2, 90);
  for (var c = DATA_FIRST_COL; c < DATA_FIRST_COL + nI; c++) sh.setColumnWidth(c, 110);
  sh.setColumnWidth(DATA_FIRST_COL + nI, 250);
}

/** Yellow input colour + 0-10 validation for rating columns. */
function formatDataRows_(sh, firstRow, n) {
  var nI = INDICATORS.length;
  sh.getRange(firstRow, DATA_FIRST_COL, n, nI).setBackground(COLORS.input);
  sh.getRange(firstRow, 2, n, 1).setBackground(COLORS.input);
  var rule = SpreadsheetApp.newDataValidation().requireNumberBetween(0, 10).setAllowInvalid(false)
    .setHelpText('Rating 0-10, see Rubrics tab').build();
  INDICATORS.forEach(function (x, i) {
    if (x[4] === 'rating 0-10') sh.getRange(firstRow, DATA_FIRST_COL + i, n, 1).setDataValidation(rule);
  });
}

function buildEvidence_(ss) {
  var sh = freshSheet_(ss, SHEETS.EVIDENCE);
  writeTable_(sh, ['Country', 'Indicator code', 'Value', 'Data year', 'Source (title)', 'Link', 'Date accessed', 'Notes'], []);
  sh.getRange(2, 1, 200, 8).setBackground(COLORS.input);
  [110, 90, 80, 75, 260, 380, 100, 260].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  sh.setFrozenRows(1);
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
  var head = ['Indicator', 'Eurostat dataset', 'Filters A', 'Filters B (optional: value = A - B)', 'Since year', 'Enabled', 'Note', 'Last status'];
  var rows = DEFAULT_SOURCES.map(function (s) { return s.concat(['']); });
  writeTable_(sh, head, rows);
  var n = rows.length;
  sh.getRange(2, 2, n, 5).setBackground(COLORS.input);
  sh.getRange(2, 6, n, 1).insertCheckboxes();
  sh.getRange(2, 6, n, 1).setValues(DEFAULT_SOURCES.map(function (s) { return [s[5]]; }));
  [80, 120, 330, 330, 80, 70, 380, 380].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  sh.getRange(n + 3, 1).setValue('Filters use Eurostat dimension codes, joined with "&". Country filter is added automatically from the Data tab.')
    .setFontStyle('italic');
  sh.getRange(n + 4, 1).setValue('API used: ' + EUROSTAT_API + '<dataset>?<filters>&geo=..&sinceTimePeriod=..')
    .setFontStyle('italic');
}

function buildLog_(ss) {
  var sh = freshSheet_(ss, SHEETS.LOG);
  writeTable_(sh, ['Time', 'Action', 'Message'], []);
  sh.setColumnWidth(1, 150); sh.setColumnWidth(2, 120); sh.setColumnWidth(3, 800);
  sh.setFrozenRows(1);
}

// ============================================================================
// SCORES + DASHBOARD (formulas, regenerated for the current list of countries)
// ============================================================================

function rebuildFormulas() {
  var ss = SpreadsheetApp.getActive();
  var data = ss.getSheetByName(SHEETS.DATA);
  if (!data) { setupIndex(); return; }
  var n = countryCount_(data);
  buildScores_(ss, n);
  buildDashboard_(ss, n);
  ss.toast('Scores and dashboard refreshed for ' + n + ' countries.', APP_NAME, 4);
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
function scoreLayout_() {
  var nI = INDICATORS.length;
  var pillarStart = 2 + nI;                 // after Country + indicator scores
  var total = pillarStart + PILLARS.length;
  return { nI: nI, pillarStart: pillarStart, total: total, coverage: total + 1, verdict: total + 2, rank: total + 3 };
}

function buildScores_(ss, n) {
  var sh = freshSheet_(ss, SHEETS.SCORES);
  var L = scoreLayout_();
  var head = ['Country'].concat(INDICATORS.map(function (x) { return x[0]; }))
    .concat(PILLARS.map(function (p) { return p + ' score'; }))
    .concat(['Destination Score', 'Data coverage', 'Verdict', 'Rank']);
  sh.getRange(1, 1, 1, head.length).setValues([head]);
  styleHeader_(sh.getRange(1, 1, 1, head.length));
  sh.getRange(2, 1).setValue('Indicator scores 0-100 (100 = best of the listed countries). Calculated - do not edit.')
    .setFontStyle('italic');
  if (n === 0) return;

  var first = DATA_FIRST_ROW, last = DATA_FIRST_ROW + n - 1;
  var D = SHEETS.DATA;
  var formulas = [];
  for (var r = first; r <= last; r++) {
    var row = ['=' + D + '!A' + r];

    // Indicator scores (min-max across countries, direction from Data row 2)
    for (var i = 0; i < L.nI; i++) {
      var c = colLetter_(DATA_FIRST_COL + i);
      var v = D + '!' + c + r;
      var rng = D + '!' + c + '$' + first + ':' + c + '$' + last;
      row.push('=IFERROR(IF(OR(' + v + '="",COUNT(' + rng + ')=0),"",IF(MAX(' + rng + ')=MIN(' + rng + '),100,' +
        'IF(' + D + '!' + c + '$2=1,(' + v + '-MIN(' + rng + '))/(MAX(' + rng + ')-MIN(' + rng + ')),' +
        '(MAX(' + rng + ')-' + v + ')/(MAX(' + rng + ')-MIN(' + rng + ')))*100)),"")');
    }

    // Pillar scores = average of the pillar's indicator scores
    PILLARS.forEach(function (p) {
      var cols = [];
      INDICATORS.forEach(function (x, i) { if (x[1] === p) cols.push(colLetter_(2 + i)); });
      row.push('=IFERROR(AVERAGE(' + cols[0] + r + ':' + cols[cols.length - 1] + r + '),"")');
    });

    // Weighted total over pillars that have data
    var wCells = ['$B$2', '$C$2', '$D$2', '$E$2'].map(function (a) { return SHEETS.WEIGHTS + '!' + a; });
    var num = [], den = [];
    PILLARS.forEach(function (p, k) {
      var a = colLetter_(L.pillarStart + k) + r;
      num.push('IF(ISNUMBER(' + a + '),' + a + '*' + wCells[k] + ',0)');
      den.push('IF(ISNUMBER(' + a + '),' + wCells[k] + ',0)');
    });
    row.push('=IF((' + den.join('+') + ')=0,"",(' + num.join('+') + ')/(' + den.join('+') + '))');

    var dFirst = colLetter_(DATA_FIRST_COL), dLast = colLetter_(DATA_FIRST_COL + L.nI - 1);
    row.push('=COUNT(' + D + '!' + dFirst + r + ':' + dLast + r + ')/' + L.nI);

    var t = colLetter_(L.total) + r, cv = colLetter_(L.coverage) + r, W = SHEETS.WEIGHTS;
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

function buildDashboard_(ss, n) {
  var sh = freshSheet_(ss, SHEETS.DASHBOARD);
  sh.getCharts().forEach(function (c) { sh.removeChart(c); });
  var L = scoreLayout_();
  sh.getRange('A1').setValue('Destination ranking').setFontSize(16).setFontWeight('bold').setFontColor(COLORS.title);
  var head = ['Country', 'Destination Score', 'Access', 'Fairness', 'Reward', 'Settlement', 'Data coverage', 'Verdict'];
  sh.getRange(3, 1, 1, head.length).setValues([head]);
  styleHeader_(sh.getRange(3, 1, 1, head.length));
  if (n === 0) { sh.getRange('A4').setValue('Add countries in the Data tab.'); return; }

  var S = SHEETS.SCORES, f = DATA_FIRST_ROW, l = DATA_FIRST_ROW + n - 1;
  var col = function (c) { return S + '!' + colLetter_(c) + f + ':' + colLetter_(c) + l; };
  var pill = S + '!' + colLetter_(L.pillarStart) + f + ':' + colLetter_(L.pillarStart + 3) + l;
  // Ranked list of countries that have a score, best first
  sh.getRange('A4').setFormula('=IFERROR(SORT(FILTER({' + col(1) + ',' + col(L.total) + ',' + pill + ',' +
    col(L.coverage) + ',' + col(L.verdict) + '},' + col(L.total) + '<>""),2,FALSE),"No scores yet - fill the Data tab or run Fetch Eurostat data.")');
  sh.getRange(4, 2, n, 5).setNumberFormat('0');
  sh.getRange(4, 7, n, 1).setNumberFormat('0%');
  sh.getRange(4, 1, n, 1).setFontWeight('bold');
  sh.setConditionalFormatRules(verdictRules_(sh.getRange(4, 8, n, 1)));

  var noteRow = 4 + n + 1;
  sh.getRange(noteRow, 1).setValue('Countries without any score yet:').setFontWeight('bold');
  sh.getRange(noteRow + 1, 1).setFormula('=IFERROR(TEXTJOIN(", ",TRUE,FILTER(' + col(1) + ',' + col(L.total) + '="")),"")');
  sh.getRange(noteRow + 3, 1).setValue('Legend: >= 70 Destination | 50-69 Conditional | < 50 Not recommended | coverage below minimum = Insufficient data. ' +
    'Scores are relative to the listed countries.').setFontStyle('italic').setWrap(false);

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
// ADD COUNTRY
// ============================================================================

function addCountry() {
  var ui = SpreadsheetApp.getUi();
  var res = ui.prompt('Add a country', 'Type: Country name, Eurostat code   (example: Portugal, PT   - Greece uses EL)',
    ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  var parts = res.getResponseText().split(',');
  var name = (parts[0] || '').trim(), code = (parts[1] || '').trim().toUpperCase();
  if (!name) { ui.alert('No country name given.'); return; }

  var ss = SpreadsheetApp.getActive();
  var data = ss.getSheetByName(SHEETS.DATA);
  var n = countryCount_(data);
  var row = DATA_FIRST_ROW + n;
  data.getRange(row, 1, 1, 2).setValues([[name, code]]);
  data.getRange(row, 1).setFontWeight('bold');
  formatDataRows_(data, row, 1);
  rebuildFormulas();
  log_('Add country', name + ' (' + code + ') added in Data row ' + row + '.');
}

// ============================================================================
// EUROSTAT FETCH
// ============================================================================

function fetchEurostatData() {
  var ss = SpreadsheetApp.getActive();
  var data = ss.getSheetByName(SHEETS.DATA);
  var src = ss.getSheetByName(SHEETS.SOURCES);
  var ev = ss.getSheetByName(SHEETS.EVIDENCE);
  if (!data || !src || !ev) { setupIndex(); return; }

  var n = countryCount_(data);
  if (n === 0) { SpreadsheetApp.getUi().alert('No countries in the Data tab.'); return; }
  var countries = data.getRange(DATA_FIRST_ROW, 1, n, 2).getValues()
    .map(function (r, i) { return { name: r[0], geo: String(r[1]).trim().toUpperCase(), row: DATA_FIRST_ROW + i }; })
    .filter(function (c) { return c.geo; });
  var geos = countries.map(function (c) { return c.geo; });

  var srcRows = src.getLastRow() > 1 ? src.getRange(2, 1, src.getLastRow() - 1, 8).getValues() : [];
  var today = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd');
  var written = 0, evidence = [];

  srcRows.forEach(function (s, i) {
    var code = String(s[0]).trim(), dataset = String(s[1]).trim();
    if (!code || !dataset || s[5] !== true) return;
    var colIdx = indicatorIndex_(code);
    if (colIdx < 0) { setStatus_(src, i, 'Unknown indicator code ' + code); return; }
    var since = Number(s[4]) || 2015;

    try {
      var a = fetchSeries_(dataset, String(s[2]).trim(), geos, since);
      var b = String(s[3]).trim() ? fetchSeries_(dataset, String(s[3]).trim(), geos, since) : null;
      var got = 0, missing = [];

      countries.forEach(function (c) {
        var res = b ? latestGap_(a.series[c.geo], b.series[c.geo]) : latestValue_(a.series[c.geo]);
        if (!res) { missing.push(c.geo); return; }
        var value = Math.round(res.value * 100) / 100;
        var cell = data.getRange(c.row, DATA_FIRST_COL + colIdx);
        cell.setValue(value).setNote('Eurostat ' + dataset + ', ' + res.year + ' (fetched ' + today + ')');
        evidence.push([c.name, code, value, res.year, 'Eurostat ' + dataset + (b ? ' (A - B gap)' : ''),
                       a.url + (b ? '  |  B: ' + b.url : ''), today, 'Auto-fetched']);
        got++; written++;
      });

      var msg = 'OK ' + today + ': ' + got + '/' + countries.length + ' countries' +
        (missing.length ? '. No data: ' + missing.join(', ') : '') +
        (a.warnings.length ? '. Warning: ' + a.warnings.join('; ') : '');
      setStatus_(src, i, msg);
      log_('Fetch ' + code, msg);
    } catch (e) {
      setStatus_(src, i, 'ERROR ' + today + ': ' + e.message);
      log_('Fetch ' + code, 'ERROR: ' + e.message);
    }
  });

  if (evidence.length) {
    ev.getRange(firstEmptyRow_(ev), 1, evidence.length, 8).setValues(evidence);
  }
  ss.toast(written + ' values written. See the Sources "Last status" column and the Log tab.', APP_NAME, 8);
}

/**
 * Calls the Eurostat JSON-stat API and returns
 * { url, series: { GEO: { year: value } }, warnings: [] }.
 */
function fetchSeries_(dataset, filters, geos, since) {
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
 * Any dimension other than geo/time should be filtered to one category; if not,
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
      warnings.push('dimension "' + id + '" has ' + sizes[k] + ' categories, using the first - add a filter for it');
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

  // strides for row-major flattening
  var strides = [], acc = 1;
  for (var k = ids.length - 1; k >= 0; k--) { strides[k] = acc; acc *= sizes[k]; }

  var series = {};
  for (var g = 0; g < sizes[gi]; g++) {
    for (var t = 0; t < sizes[ti]; t++) {
      var flat = g * strides[gi] + t * strides[ti];   // other dims at position 0
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

function indicatorIndex_(code) {
  for (var i = 0; i < INDICATORS.length; i++) if (INDICATORS[i][0] === code) return i;
  return -1;
}

function setStatus_(src, i, msg) { src.getRange(2 + i, 8).setValue(msg); }

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
