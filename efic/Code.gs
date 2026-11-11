/*************************************************************************************************
 * EFIC — AUTOMATED FINANCIAL LEDGER & REPORTING SYSTEM  (v3, timeout-hardened)
 * -----------------------------------------------------------------------------------------------
 * Single-file Google Apps Script. Paste into your Sheet -> Extensions -> Apps Script.
 *
 * TIMEOUT FIXES APPLIED (v2 → v3)
 *   1. ensureConfig():  appendRow-per-row loop → one batched setValues() call.
 *   2. runAnnualReport(): fiscal-year gate — only runs on the first day of the FY start month.
 *   3. runQuarterlyReport(): quarter gate — only runs on the first day of each fiscal quarter.
 *   4. processPeriod_(): BCC email sending — all recipients receive one send instead of N sends.
 *   5. processPeriod_(): clock guard — exits gracefully at 5 min if the dataset is very large.
 *   6. Annual report: PDF attachment generated from a temporary Google Doc and sent inline.
 *   7. dispatchEmail_(): accepts optional extras object for attachments + BCC.
 *
 * DESIGN PHILOSOPHY
 *   - Everything changeable lives in the vertical "Settings" tab (Setting | Value | Description).
 *   - The Google-Form simplicity is preserved. An OPTIONAL "Chart_of_Accounts" tab can be filled
 *     in later to unlock liquidity / turnover ratios — no rewrite needed.
 *   - Emails contain NO <img> tags. Layout is pure inline CSS (banner + tables + typography).
 *
 * TABS USED
 *   Settings           key/value config (col A = Setting, col B = Value, col C = Description)
 *   Recipients         Email | Name | Active | Daily | Weekly | Monthly | Quarterly | Annual (Yes/No)
 *   Submissions        the ledger (Form responses). Header row scanned dynamically.
 *   Chart_of_Accounts  OPTIONAL. Account | Sub-type. Empty by default.
 *   Statutory          OPTIONAL. Item | Rate (%) | Base | Show (Yes/No)
 *
 * FIRST-TIME USE
 *   - Existing setup:  run  ensureConfig()      (non-destructive: adds missing settings/columns)
 *   - Fresh install:   run  buildEntireSystem() (creates Form + all tabs)
 *   - Then:            run  installTriggers()   (reads report times from Settings)
 *************************************************************************************************/

/*================================================================================================
 *  DEFAULTS & KEY NAMES
 *==============================================================================================*/
var TABS = {
  SETTINGS:   'Settings',
  RECIPIENTS: 'Recipients',
  LEDGER:     'Submissions',
  COA:        'Chart_of_Accounts',
  STATUTORY:  'Statutory',
  GUIDE:      'Guide'
};

var KEYS = {
  ORG_NAME:    'Organisation Name',
  TAGLINE:     'Organisation Tagline',
  CLIENT_PFX:  'Client Number Prefix',
  PRIMARY:     'Primary Color',
  ACCENT:      'Accent Color',
  LOGO_URL:    'Logo URL',
  LANG:        'Default Language',
  DAILY_TIME:  'Daily Report Time',
  WEEKLY_DAY:  'Weekly Report Day',
  WEEKLY_TIME: 'Weekly Report Time',
  TZ:          'Timezone',
  GDPR:        'GDPR Notice',
  FONT_FAMILY: 'Font Family',
  FONT_URL:    'Font URL',
  WEBSITE:     'Website URL',
  LINKEDIN:    'LinkedIn URL',
  FACEBOOK:    'Facebook URL',
  INSTAGRAM:   'Instagram URL',
  TWITTER:     'Twitter / X URL',
  WHATSAPP:    'WhatsApp Link',
  YOUTUBE:     'YouTube URL',
  FY_START:    'Financial Year Start Month',
  CURRENCY:    'Currency Symbol',
  LEDGER_TAB:  'Ledger Tab Name',
  FORM_TITLE:  'Form Title',
  FORM_URL:    'Form Edit URL',
  ATTACH_PDF:  'Attach PDF to Annual Report'   // Yes/No — new in v3
};

var RECIPIENT_COLS = ['Email Address', 'Name', 'Active (Yes/No)',
                      'Daily Report (Yes/No)', 'Weekly Report (Yes/No)',
                      'Monthly Report (Yes/No)', 'Quarterly Report (Yes/No)', 'Annual Report (Yes/No)'];

var CADENCE_COL = {
  Daily:     'Daily Report (Yes/No)',
  Weekly:    'Weekly Report (Yes/No)',
  Monthly:   'Monthly Report (Yes/No)',
  Quarterly: 'Quarterly Report (Yes/No)',
  Annual:    'Annual Report (Yes/No)'
};

var FALLBACK_PRIMARY = '#14213D';
var FALLBACK_ACCENT  = '#E7B165';
var COLOR_POSITIVE   = '#2ea44f';
var COLOR_NEGATIVE   = '#d9381e';

// Hard limit for a single processPeriod_ run — stop at 5 min to stay under the 6-min wall.
var MAX_RUN_MS = 5 * 60 * 1000;


/*================================================================================================
 *  CUSTOM MENU
 *==============================================================================================*/
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Financial Reports')
    .addItem('Setup / update config', 'ensureConfig')
    .addItem('Set up / align the form', 'setupOrAlignForm')
    .addItem('Seed demo data', 'seedDemoLedger')
    .addSeparator()
    .addItem('Preview annual report to me', 'previewAnnualToMe')
    .addSubMenu(ui.createMenu('Send a report now')
      .addItem('Daily',     'runDailyReport')
      .addItem('Weekly',    'runWeeklyReport')
      .addItem('Monthly',   'runMonthlyReport')
      .addItem('Quarterly', 'runQuarterlyReport')
      .addItem('Annual',    'runAnnualReport'))
    .addItem('Install / refresh automatic triggers', 'installTriggers')
    .addSeparator()
    .addItem('Open guide notes', 'openGuide')
    .addSubMenu(ui.createMenu('Advanced')
      .addItem('Rebuild guide notes tab', 'rebuildGuideNotes')
      .addItem('Build fresh system (empty workbook only)', 'buildEntireSystem'))
    .addToUi();
}

function openGuide() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureGuideTab_(ss, true);
  var g = ss.getSheetByName(TABS.GUIDE);
  if (g) { ss.setActiveSheet(g); }
}

function rebuildGuideNotes() {
  ensureGuideTab_(SpreadsheetApp.getActiveSpreadsheet(), true);
  SpreadsheetApp.getActive().toast('Guide notes rebuilt.', 'Guide', 5);
}

function ensureGuideTab_(ss, force) {
  var g = ss.getSheetByName(TABS.GUIDE);
  if (g && !force) { return; }
  if (!g) { g = ss.insertSheet(TABS.GUIDE); }
  g.clear();

  var rows = [
    ['Topic', 'Notes'],
    ['GETTING STARTED', ''],
    ['Run order', '1) Setup / update config   2) (optional) Seed demo data   3) Preview annual report to me   4) Install / refresh automatic triggers.'],
    ['The menu', 'Use the "Financial Reports" menu in the toolbar for everything. If it is missing, reload the Sheet.'],
    ['First run', 'The first time you run anything, approve the Google permission prompt. No data is sent anywhere except to the recipients you list.'],
    ['TABS', ''],
    ['Settings', 'Control panel. Edit column B only; never rename column A. Drives branding, schedule, timezone, financial-year start, currency and language.'],
    ['Recipients', 'Who receives which report. A person gets a report only when Active = Yes AND that cadence column = Yes.'],
    ['Submissions', 'The ledger. Google Form entries land here automatically. "Ledger Tab Name" in Settings sets which tab(s) are reported — one name, or several comma-separated to combine them.'],
    ['Chart_of_Accounts', 'OPTIONAL. Map each account to a sub-type (Cash, Inventory, Receivables, Current Liability…) to unlock liquidity and turnover ratios.'],
    ['Statutory', 'OPTIONAL. Add tax / statutory charges: Item, Rate (%), Base (Net Profit / Gross Profit / Revenue), Show (Yes/No). Appears in the annual report.'],
    ['Guide', 'This tab. Rebuild it anytime from Financial Reports ▸ Advanced ▸ Rebuild guide notes tab.'],
    ['ENTERING DATA', ''],
    ['Type', 'Income, COGS, OPEX, Assets, Liabilities, Equity. Singular or plural both work (Asset = Assets).'],
    ['Amount', 'Numbers only — no currency symbols or commas.'],
    ['Account', 'Choose from the standard list, or "Other" to write in a custom name.'],
    ['Notes', 'Fiscal-quarter tag: Q1, Q2, Q3 or Q4.'],
    ['REPORTS', ''],
    ['Cadences', 'Daily, Weekly, Monthly, Quarterly, Annual. Send any immediately from the menu, or let the triggers run them.'],
    ['Annual pack', 'Income statement, Statutory & Tax, Balance sheet, the full ratio set, and a PDF attachment (if enabled in Settings).'],
    ['Financial year', 'Set "Financial Year Start Month" in Settings — it drives the quarters and the annual period.'],
    ['Quarterly trigger', 'Fires on the 1st of each month but only sends when that day is the first day of a fiscal quarter. No duplicate sends mid-quarter.'],
    ['Annual trigger', 'Fires on the 1st of each month but only sends when that day is the first day of the financial year. One send per year.'],
    ['PDF attachment', 'Set "Attach PDF to Annual Report" = Yes in Settings. A formatted PDF is generated and attached to the annual email automatically.'],
    ['Languages', 'Set "Default Language" in Settings to EN, DE or SW. Emails translate; your account names stay as entered.'],
    ['LIMITS', ''],
    ['Email quota', 'Free Gmail sends to at most 100 recipients per day; Google Workspace 1,500. The script sends one BCC email to all recipients — quota cost is 1 regardless of recipient count.'],
    ['Execution', 'All Sheet I/O is batched. Reports complete in seconds for typical ledger sizes. The script stops safely at 5 minutes to stay under the 6-minute Apps Script limit.'],
    ['HELP', ''],
    ['Logs', 'In the Apps Script editor, open Executions to see exactly what each run did (recipients, rows, timing, any skips).'],
    ['Change wording / add a language', 'All report labels live in one place in the script (the i18n_ dictionary). Editing or adding a language is a small change there.']
  ];

  g.getRange(1, 1, rows.length, 2).setValues(rows);
  g.setColumnWidth(1, 220);
  g.setColumnWidth(2, 640);
  g.getRange(1, 2, rows.length, 1).setWrap(true);
  g.getRange(1, 1, rows.length, 1).setFontWeight('bold');
  g.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#14213D').setFontColor('#ffffff');
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][1] === '') {
      g.getRange(i + 1, 1, 1, 2).setBackground('#F2F1EC').setFontColor('#14213D');
    }
  }
  g.setFrozenRows(1);
}


/*================================================================================================
 *  CONFIG LAYER
 *==============================================================================================*/
function getConfig_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(TABS.SETTINGS);
  var cfg = {};
  if (sheet) {
    var values = sheet.getDataRange().getValues();  // one bulk read
    for (var i = 1; i < values.length; i++) {
      var key = String(values[i][0] || '').trim();
      if (key) { cfg[key] = values[i][1]; }
    }
  }
  cfg.get = function (key, fallback) {
    var v = this[key];
    if (v === undefined || v === null || String(v).trim() === '') { return fallback === undefined ? '' : fallback; }
    return v;
  };
  return cfg;
}

function tzOf_(cfg)         { return String(cfg.get(KEYS.TZ, Session.getScriptTimeZone() || 'Europe/Berlin')); }
function curOf_(cfg)        { return String(cfg.get(KEYS.CURRENCY, '')); }
function attachPdf_(cfg)    { return String(cfg.get(KEYS.ATTACH_PDF, 'No')).trim().toLowerCase() === 'yes'; }

function fyStartMonth_(cfg) {
  var name = String(cfg.get(KEYS.FY_START, 'January')).trim().toLowerCase();
  var months = ['january','february','march','april','may','june',
                'july','august','september','october','november','december'];
  var idx = months.indexOf(name);
  if (idx !== -1) { return idx; }
  var n = parseInt(name, 10);
  if (!isNaN(n) && n >= 1 && n <= 12) { return n - 1; }
  return 0;
}


/*================================================================================================
 *  PHASE 1A — NON-DESTRUCTIVE UPGRADE (ensureConfig)
 *
 *  FIX (v3): replaced per-row appendRow() calls with a single batched setValues() write.
 *  Before: N round-trips to Sheets for N missing settings.
 *  After:  1 round-trip regardless of how many settings are added.
 *==============================================================================================*/
function ensureConfig() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    var sSheet = ss.getSheetByName(TABS.SETTINGS) || ss.insertSheet(TABS.SETTINGS);
    if (sSheet.getLastRow() === 0) {
      sSheet.getRange(1, 1, 1, 3).setValues([['Setting', 'Value', 'Description']]).setFontWeight('bold');
    }

    // One bulk read of existing keys.
    var existingKeys = sSheet.getLastRow() > 1
      ? sSheet.getRange(2, 1, sSheet.getLastRow() - 1, 1).getValues()
              .map(function (r) { return String(r[0]).trim(); })
      : [];

    var needed = [
      [KEYS.FY_START,   'January',       'Month your financial year starts: January | April | July | any month name'],
      [KEYS.CURRENCY,   '',              'Currency symbol shown in reports, e.g. $  €  KSh  (leave blank for none)'],
      [KEYS.LEDGER_TAB, TABS.LEDGER,     'Ledger tab(s) to report on. One name, or several comma-separated, e.g. Submissions, sample_ledger_2024'],
      [KEYS.FORM_TITLE, 'Financial Ledger Entry Form', 'Title of the Google Form (applied when you run "Set up / align the form")'],
      [KEYS.FORM_URL,   '',              'Optional: the form\'s EDIT url. Only needed if the aligner cannot find your form automatically.'],
      [KEYS.ATTACH_PDF, 'No',            'Attach a PDF to the annual report email? Yes | No']
    ];

    // TIMEOUT FIX: collect all missing rows, then write them all in ONE setValues() call.
    var toAdd = needed.filter(function (row) {
      return existingKeys.indexOf(row[0]) === -1;
    });
    if (toAdd.length) {
      var nextRow = sSheet.getLastRow() + 1;
      sSheet.getRange(nextRow, 1, toAdd.length, 3).setValues(toAdd);
    }

    // Recipients tab.
    var rSheet = ss.getSheetByName(TABS.RECIPIENTS) || ss.insertSheet(TABS.RECIPIENTS);
    if (rSheet.getLastRow() === 0) {
      rSheet.getRange(1, 1, 1, RECIPIENT_COLS.length).setValues([RECIPIENT_COLS]).setFontWeight('bold');
    } else {
      var width = Math.max(rSheet.getLastColumn(), RECIPIENT_COLS.length);
      var header = rSheet.getRange(1, 1, 1, width).getValues()[0]
                         .map(function (h) { return String(h).trim(); });
      var dirty = false;
      RECIPIENT_COLS.forEach(function (colName, i) {
        if (header.indexOf(colName) === -1) { header[i] = colName; dirty = true; }
      });
      if (dirty) { rSheet.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold'); }
    }
    applyYesNoValidation_(rSheet);
    rSheet.setFrozenRows(1);

    ensureChartOfAccountsTemplate_(ss);
    ensureStatutoryTemplate_(ss);
    ensureGuideTab_(ss);

    SpreadsheetApp.getActive().toast('Config ensured. Settings + Recipients are ready.', 'ensureConfig', 6);
    Logger.log('ensureConfig complete. Added ' + toAdd.length + ' new setting row(s).');
  } catch (err) {
    Logger.log('ERROR in ensureConfig: ' + err.message + '\n' + (err.stack || ''));
    throw err;
  }
}

function applyYesNoValidation_(rSheet) {
  var header = rSheet.getRange(1, 1, 1, rSheet.getLastColumn() || RECIPIENT_COLS.length)
                     .getValues()[0].map(function (h) { return String(h).trim(); });
  var yesNo = SpreadsheetApp.newDataValidation()
                .requireValueInList(['Yes', 'No'], true).setAllowInvalid(false).build();
  ['Active (Yes/No)'].concat(Object.keys(CADENCE_COL).map(function (k) { return CADENCE_COL[k]; }))
    .forEach(function (colName) {
      var c = header.indexOf(colName);
      if (c !== -1) {
        rSheet.getRange(2, c + 1, Math.max(rSheet.getMaxRows() - 1, 50), 1).setDataValidation(yesNo);
      }
    });
}

function ensureChartOfAccountsTemplate_(ss) {
  if (ss.getSheetByName(TABS.COA)) { return; }
  var coa = ss.insertSheet(TABS.COA);
  coa.getRange(1, 1, 1, 3).setValues([['Account', 'Sub-type', 'Notes']]).setFontWeight('bold');
  coa.getRange(2, 1, 6, 3).setValues([
    ['Cash',                'Cash',              'OPTIONAL. Fill in to unlock liquidity ratios.'],
    ['Bank',                'Cash',              ''],
    ['Inventory',           'Inventory',         'Unlocks inventory turnover.'],
    ['Accounts Receivable', 'Receivables',       'Unlocks receivables turnover.'],
    ['Accounts Payable',    'Current Liability', 'Unlocks current ratio.'],
    ['Equipment',           'Non-current Asset', '']
  ]);
  var subTypes = ['Cash','Receivables','Inventory','Current Asset','Non-current Asset',
                  'Current Liability','Non-current Liability'];
  coa.getRange(2, 2, Math.max(coa.getMaxRows() - 1, 50), 1)
     .setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(subTypes, true).setAllowInvalid(true).build());
  coa.setFrozenRows(1);
}

function ensureStatutoryTemplate_(ss) {
  if (ss.getSheetByName(TABS.STATUTORY)) { return; }
  var st = ss.insertSheet(TABS.STATUTORY);
  st.getRange(1, 1, 1, 4).setValues([['Item', 'Rate (%)', 'Base', 'Show (Yes/No)']]).setFontWeight('bold');
  st.getRange(2, 1, 2, 4).setValues([
    ['Corporate Tax',         30, 'Net Profit', 'Yes'],
    ['VAT (output, approx.)', 16, 'Revenue',    'No']
  ]);
  var bases = ['Net Profit', 'Gross Profit', 'Revenue'];
  st.getRange(2, 3, Math.max(st.getMaxRows() - 1, 50), 1)
    .setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(bases, true).setAllowInvalid(true).build());
  st.getRange(2, 4, Math.max(st.getMaxRows() - 1, 50), 1)
    .setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Yes', 'No'], true).setAllowInvalid(false).build());
  st.setFrozenRows(1);
  st.autoResizeColumns(1, 4);
}

function readStatutory_(ss, m) {
  var out = { items: [], total: 0, netAfter: m.netProfit };
  var t = readTable_(ss, TABS.STATUTORY);
  if (!t) { return out; }
  var h = t.header.map(function (x) { return String(x).trim().toLowerCase(); });
  var ci = h.indexOf('item'), cr = h.indexOf('rate (%)'), cb = h.indexOf('base'), cs = h.indexOf('show (yes/no)');
  if (ci === -1 || cr === -1) { return out; }
  t.rows.forEach(function (r) {
    var name = String(r[ci] || '').trim();
    if (!name) { return; }
    if (cs !== -1 && String(r[cs] || '').trim().toLowerCase() !== 'yes') { return; }
    var rate    = toNumber_(r[cr]);
    var baseName = cb !== -1 ? String(r[cb] || '').trim().toLowerCase() : 'net profit';
    var baseVal  = (baseName === 'revenue') ? m.revenues
                 : (baseName === 'gross profit') ? m.grossProfit
                 : m.netProfit;
    var amount = baseVal * rate / 100;
    out.items.push({ name: name, rate: rate, base: (cb !== -1 ? r[cb] : 'Net Profit'), amount: amount });
    out.total += amount;
  });
  out.netAfter = m.netProfit - out.total;
  return out;
}


/*================================================================================================
 *  PHASE 1B — FULL FRESH INSTALL
 *==============================================================================================*/
function buildEntireSystem() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) { throw new Error('Open a Google Sheet and run this from its bound script.'); }

    try {
      if (ss.getSheetByName(TABS.SETTINGS) || ss.getSheetByName(TABS.RECIPIENTS)) {
        var uiB = SpreadsheetApp.getUi();
        var ans = uiB.alert('Build fresh system?',
          'This creates a new Form and resets the Settings and Recipients tabs to defaults. ' +
          'Your ledger data is NOT touched. Continue?', uiB.ButtonSet.YES_NO);
        if (ans !== uiB.Button.YES) { Logger.log('buildEntireSystem cancelled.'); return; }
      }
    } catch (noUi) {}

    var form = FormApp.create('Financial Ledger Entry Form');
    form.setDescription('Record one financial transaction per submission.');
    form.addDateItem().setTitle('Date').setHelpText('The date the transaction actually happened.').setRequired(true);
    form.addListItem().setTitle('Type')
        .setHelpText('Income · COGS · OPEX · Assets · Liabilities · Equity')
        .setChoiceValues(['Income','COGS','OPEX','Assets','Liabilities','Equity']).setRequired(true);
    form.addMultipleChoiceItem().setTitle('Account')
        .setHelpText('Pick the account. Choose "Other" for a custom name.')
        .setChoiceValues([
          'Sales Revenue','Service Revenue','Other Income',
          'Cost of Goods Sold','Purchases',
          'Rent','Salaries & Wages','Utilities','Marketing','Insurance',
          'Office Supplies','Transport','Repairs & Maintenance','Bank Charges','Professional Fees',
          'Cash','Bank','Accounts Receivable','Inventory','Equipment',
          'Accounts Payable','Bank Loan','Tax Payable'
        ]).showOtherOption(true);
    form.addParagraphTextItem().setTitle('Description').setHelpText('Optional. A short note.');
    form.addTextItem().setTitle('Amount')
        .setHelpText('Numbers only — no currency symbols or commas.')
        .setValidation(FormApp.createTextValidation().requireNumber().build()).setRequired(true);
    form.addListItem().setTitle('Tax Group').setChoiceValues(['Standard','Exempt','Zero-Rated']);
    form.addTextItem().setTitle('Reference').setHelpText('Optional. Invoice or receipt number.');
    form.addListItem().setTitle('Notes').setHelpText('Fiscal quarter tag.')
        .setChoiceValues(['Q1','Q2','Q3','Q4']);

    var before = ss.getSheets().map(function (s) { return s.getName(); });
    form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
    Utilities.sleep(2000); SpreadsheetApp.flush();

    var ss2 = SpreadsheetApp.openById(ss.getId());
    var newSheet = null;
    ss2.getSheets().forEach(function (s) { if (before.indexOf(s.getName()) === -1) { newSheet = s; } });
    if (!newSheet) { newSheet = ss2.getSheetByName('Form Responses 1') || ss2.getSheetByName('Form responses 1'); }
    if (!newSheet) { throw new Error('Could not locate the linked Form responses sheet.'); }
    newSheet.setName(TABS.LEDGER);
    newSheet.getRange(1, 1, 1, 9).setValues([[
      'Timestamp','Date','Type','Account','Description','Amount','Tax Group','Reference','Notes'
    ]]).setFontWeight('bold');
    newSheet.setFrozenRows(1);

    buildSettingsTab_(ss2);

    var rSheet = ss2.getSheetByName(TABS.RECIPIENTS) || ss2.insertSheet(TABS.RECIPIENTS);
    rSheet.clear();
    rSheet.getRange(1, 1, 1, RECIPIENT_COLS.length).setValues([RECIPIENT_COLS]).setFontWeight('bold');
    rSheet.getRange(2, 1, 1, RECIPIENT_COLS.length).setValues([[
      Session.getActiveUser().getEmail() || 'you@example.com', 'Owner', 'Yes', 'Yes','Yes','Yes','Yes','Yes'
    ]]);
    applyYesNoValidation_(rSheet);
    rSheet.setFrozenRows(1);

    ensureChartOfAccountsTemplate_(ss2);
    ensureStatutoryTemplate_(ss2);
    ensureGuideTab_(ss2);

    Logger.log('buildEntireSystem complete. Form URL: ' + form.getPublishedUrl());
    SpreadsheetApp.getActive().toast('System built. Ledger tab: ' + TABS.LEDGER, 'Done', 8);
  } catch (err) {
    Logger.log('ERROR in buildEntireSystem: ' + err.message + '\n' + (err.stack || ''));
    throw err;
  }
}

function buildSettingsTab_(ss) {
  var sheet = ss.getSheetByName(TABS.SETTINGS) || ss.insertSheet(TABS.SETTINGS);
  sheet.clear();
  var rows = [
    ['Setting', 'Value', 'Description'],
    [KEYS.ORG_NAME,    'EFIC Consultancy',   'Name shown on form header and emails'],
    [KEYS.TAGLINE,     'Driving Efficacy and Effective Solutions.', 'Short tagline shown below org name'],
    [KEYS.CLIENT_PFX,  'EFIC',               'Prefix for client IDs — e.g. EFIC-2026-00001'],
    [KEYS.PRIMARY,     FALLBACK_PRIMARY,     'Main brand colour (hex) — email header background'],
    [KEYS.ACCENT,      FALLBACK_ACCENT,      'Accent colour (hex) — headings / highlights'],
    [KEYS.LOGO_URL,    '',                   'Optional logo URL. Leave blank to use a text wordmark.'],
    [KEYS.LANG,        'EN',                 'Default language: EN | DE | SW'],
    [KEYS.DAILY_TIME,  '7:00',               'Time to send daily report — 24h e.g. 07:00'],
    [KEYS.WEEKLY_DAY,  'Monday',             'Day to send weekly report: Monday–Sunday'],
    [KEYS.WEEKLY_TIME, '8:00',               'Time to send weekly report — 24h'],
    [KEYS.TZ,          'Europe/Berlin',      'Timezone for triggers e.g. Europe/Berlin | Africa/Nairobi | UTC'],
    [KEYS.FY_START,    'January',            'Month your financial year starts (drives quarters + annual report)'],
    [KEYS.CURRENCY,    '',                   'Currency symbol in reports e.g. $  €  KSh (blank = none)'],
    [KEYS.GDPR,        'Your data is processed in accordance with our privacy policy.', 'Consent text shown at the bottom of emails/form'],
    [KEYS.FONT_FAMILY, '',                   'Google Font name e.g. Montserrat | Roboto (blank = system font)'],
    [KEYS.FONT_URL,    '',                   'Google Fonts CSS @import URL'],
    [KEYS.WEBSITE,     '',                   'Your website e.g. https://efic.com'],
    [KEYS.LINKEDIN,    '',                   'LinkedIn URL'],
    [KEYS.FACEBOOK,    '',                   'Facebook URL'],
    [KEYS.INSTAGRAM,   '',                   'Instagram URL'],
    [KEYS.TWITTER,     '',                   'Twitter / X URL'],
    [KEYS.WHATSAPP,    '',                   'WhatsApp click-to-chat link'],
    [KEYS.YOUTUBE,     '',                   'YouTube channel URL'],
    [KEYS.LEDGER_TAB,  TABS.LEDGER,          'Ledger tab(s) to report on — one, or several comma-separated to combine'],
    [KEYS.FORM_TITLE,  'Financial Ledger Entry Form', 'Title of the Google Form (applied on create / align)'],
    [KEYS.FORM_URL,    '',                   'Optional: the form\'s EDIT url (for aligning an existing form)'],
    [KEYS.ATTACH_PDF,  'No',                 'Attach a PDF to the annual report email? Yes | No']
  ];
  sheet.getRange(1, 1, rows.length, 3).setValues(rows);  // one write
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold');
  sheet.getRange(2, 1, rows.length - 1, 1).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, 3);
}


/*================================================================================================
 *  FORM SETUP & ALIGNMENT
 *==============================================================================================*/
var FORM_SPEC = [
  { title:'Date',         kind:'date',      required:true,  help:'The date the transaction actually happened.' },
  { title:'Type',         kind:'list',      required:true,  help:'Income · COGS · OPEX · Assets · Liabilities · Equity',
                          choices:['Income','COGS','OPEX','Assets','Liabilities','Equity'] },
  { title:'Account',      kind:'choice',    required:false, other:true, help:'Pick the account. Choose "Other" for a custom name.',
                          choices:['Sales Revenue','Service Revenue','Other Income','Cost of Goods Sold','Purchases',
                                   'Rent','Salaries & Wages','Utilities','Marketing','Insurance','Office Supplies','Transport',
                                   'Repairs & Maintenance','Bank Charges','Professional Fees','Cash','Bank','Accounts Receivable',
                                   'Inventory','Equipment','Accounts Payable','Bank Loan','Tax Payable'] },
  { title:'Description',  kind:'paragraph', required:false, help:'Optional. A short note about this transaction.' },
  { title:'Amount',       kind:'number',    required:true,  help:'The value of this entry, e.g. 1500 or 249.99. Numbers only.' },
  { title:'Tax Group',    kind:'list',      required:false, help:'VAT treatment.', choices:['Standard','Exempt','Zero-Rated'] },
  { title:'Reference',    kind:'text',      required:false, help:'Optional. Invoice or receipt number.' },
  { title:'Notes',        kind:'list',      required:false, help:'Tag the fiscal quarter.', choices:['Q1','Q2','Q3','Q4'] }
];

function addFormItem_(form, q) {
  var item;
  if (q.kind === 'date')           { item = form.addDateItem(); }
  else if (q.kind === 'paragraph') { item = form.addParagraphTextItem(); }
  else if (q.kind === 'list')      { item = form.addListItem().setChoiceValues(q.choices); }
  else if (q.kind === 'choice')    { item = form.addMultipleChoiceItem().setChoiceValues(q.choices); if (q.other) { item.showOtherOption(true); } }
  else if (q.kind === 'number')    { item = form.addTextItem().setValidation(FormApp.createTextValidation().requireNumber().build()); }
  else                             { item = form.addTextItem(); }
  item.setTitle(q.title);
  if (q.help)     { item.setHelpText(q.help); }
  if (q.required && item.setRequired) { item.setRequired(true); }
  return item;
}

function createLedgerForm_(title) {
  var form = FormApp.create(String(title || 'Financial Ledger Entry Form'));
  form.setDescription('Record one financial transaction per submission.');
  FORM_SPEC.forEach(function (q) { addFormItem_(form, q); });
  return form;
}

function findLinkedForm_(ss, cfg) {
  var url = String(cfg.get(KEYS.FORM_URL, '')).trim();
  if (url) { try { return FormApp.openByUrl(url); } catch (e) { Logger.log('Form Edit URL invalid: ' + e.message); } }
  var names = ledgerTabNames_(cfg);
  for (var i = 0; i < names.length; i++) {
    var ls = ss.getSheetByName(names[i]);
    if (ls) { var fu = ls.getFormUrl(); if (fu) { try { return FormApp.openByUrl(fu); } catch (e) {} } }
  }
  var found = null;
  ss.getSheets().forEach(function (s) {
    if (found) { return; }
    var u = s.getFormUrl();
    if (u) { try { found = FormApp.openByUrl(u); } catch (e) {} }
  });
  return found;
}

function alignForm_(form, title) {
  var changes = [];
  if (title && String(form.getTitle()).trim() !== String(title).trim()) {
    form.setTitle(String(title));
    changes.push('Set form title to: ' + title);
  }
  var byTitle = {};
  form.getItems().forEach(function (it) { byTitle[String(it.getTitle()).trim().toLowerCase()] = it; });

  FORM_SPEC.forEach(function (q) {
    var it = byTitle[q.title.toLowerCase()];
    if (!it) { addFormItem_(form, q); changes.push('Added missing question: ' + q.title); return; }
    var t = it.getType();
    if (q.kind === 'list' || q.kind === 'choice') {
      if (t === FormApp.ItemType.LIST) {
        it.asListItem().setChoiceValues(q.choices);
        if (q.required) { it.asListItem().setRequired(true); }
      } else if (t === FormApp.ItemType.MULTIPLE_CHOICE) {
        var mc = it.asMultipleChoiceItem().setChoiceValues(q.choices);
        if (q.other) { mc.showOtherOption(true); }
        if (q.required) { mc.setRequired(true); }
      }
      if (q.help) { it.setHelpText(q.help); }
      changes.push('Refreshed options: ' + q.title);
    } else if (q.kind === 'number' && t === FormApp.ItemType.TEXT) {
      try { it.asTextItem().setValidation(FormApp.createTextValidation().requireNumber().build()).setRequired(true); } catch (e) {}
      changes.push('Confirmed numeric validation: ' + q.title);
    } else {
      if (q.help) { it.setHelpText(q.help); }
    }
  });
  if (!changes.length) { changes.push('Form already matches — no changes needed.'); }
  return changes;
}

function reportForm_(msg) {
  Logger.log(msg);
  try { SpreadsheetApp.getUi().alert('Form setup', msg, SpreadsheetApp.getUi().ButtonSet.OK); }
  catch (e) { try { SpreadsheetApp.getActive().toast(msg.substring(0, 180), 'Form setup', 8); } catch (e2) {} }
}

function setupOrAlignForm() {
  try {
    var ss  = SpreadsheetApp.getActiveSpreadsheet();
    var cfg = getConfig_();
    var title = String(cfg.get(KEYS.FORM_TITLE, 'Financial Ledger Entry Form'));
    var form  = findLinkedForm_(ss, cfg);

    if (form) {
      var changes = alignForm_(form, title);
      reportForm_('Existing form aligned.\n\n• ' + changes.join('\n• ') +
                  '\n\nForm (edit): ' + form.getEditUrl());
      return;
    }

    form = createLedgerForm_(title);
    var desiredTab = ledgerTabNames_(cfg)[0] || TABS.LEDGER;
    var before = ss.getSheets().map(function (s) { return s.getName(); });
    form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
    Utilities.sleep(2000); SpreadsheetApp.flush();

    var ss2 = SpreadsheetApp.openById(ss.getId());
    var newSheet = null;
    ss2.getSheets().forEach(function (s) { if (before.indexOf(s.getName()) === -1) { newSheet = s; } });
    if (newSheet && !ss2.getSheetByName(desiredTab)) { newSheet.setName(desiredTab); }
    var tabName = newSheet ? newSheet.getName() : '(new responses tab)';
    reportForm_('No form was linked — a new one was created.\n\n' +
                'Set "Ledger Tab Name" in Settings to: ' + tabName + '\n' +
                'Form (edit): ' + form.getEditUrl());
  } catch (err) {
    Logger.log('ERROR setupOrAlignForm: ' + err.message);
    reportForm_('Could not finish: ' + err.message);
  }
}


/*================================================================================================
 *  PHASE 2 — DYNAMIC HEADER RESOLUTION
 *==============================================================================================*/
function resolveHeaderMap(headerRow) {
  var n = headerRow.map(function (h) { return String(h).trim().toLowerCase(); });
  function f(label) { return n.indexOf(String(label).trim().toLowerCase()); }
  return { date: f('Date'), type: f('Type'), account: f('Account'), amount: f('Amount'), notes: f('Notes') };
}


/*================================================================================================
 *  PHASE 3 — TRIGGER ENTRY POINTS
 *
 *  FIX (v3): runAnnualReport and runQuarterlyReport now contain a fiscal-calendar gate.
 *  The triggers still fire on the 1st of every month (Apps Script limitation), but the
 *  gate exits immediately if today is NOT the right day for that cadence. Result:
 *    - Annual: runs ONCE per year, on the first day of the fiscal year start month.
 *    - Quarterly: runs FOUR times per year, on the first day of each fiscal quarter.
 *    - Monthly: unchanged — fires every month, correct as-is.
 *==============================================================================================*/
function runDailyReport()   { processPeriod_('Daily'); }
function runWeeklyReport()  { processPeriod_('Weekly'); }
function runMonthlyReport() { processPeriod_('Monthly'); }

function runQuarterlyReport() {
  var cfg    = getConfig_();
  var now    = new Date();
  var fyMo   = fyStartMonth_(cfg);
  // Only run when today (day 1) falls on a fiscal-quarter start month.
  var monthsIn = ((now.getMonth() - fyMo) + 12) % 12;
  if (now.getDate() !== 1 || monthsIn % 3 !== 0) {
    Logger.log('runQuarterlyReport: skipped (not the first day of a fiscal quarter). Today: ' +
               Utilities.formatDate(now, tzOf_(cfg), 'yyyy-MM-dd'));
    return;
  }
  processPeriod_('Quarterly');
}

function runAnnualReport() {
  var cfg  = getConfig_();
  var now  = new Date();
  var fyMo = fyStartMonth_(cfg);
  // Only run when today is the first day of the fiscal year start month.
  if (now.getDate() !== 1 || now.getMonth() !== fyMo) {
    Logger.log('runAnnualReport: skipped (not the first day of the financial year). Today: ' +
               Utilities.formatDate(now, tzOf_(cfg), 'yyyy-MM-dd') +
               '  FY start month index: ' + fyMo);
    return;
  }
  processPeriod_('Annual');
}


/*================================================================================================
 *  PROCESS PERIOD — CORE DISPATCH
 *
 *  FIX (v3):
 *    a. Clock guard: a start time is captured; if ledger reading + compute runs long,
 *       the email send is still attempted but a warning is logged.
 *    b. BCC email sending: all recipients receive ONE GmailApp call rather than N calls.
 *       Quota cost = 1 regardless of recipient count. This avoids per-recipient timeout.
 *    c. PDF attachment: for the Annual cadence, a PDF is generated (if enabled in Settings)
 *       and attached to the BCC send via the attachments option.
 *==============================================================================================*/
function processPeriod_(cadence) {
  var START = Date.now();
  try {
    var ss  = SpreadsheetApp.getActiveSpreadsheet();
    var cfg = getConfig_();

    // 1. Resolve recipients.
    var recips = readTable_(ss, TABS.RECIPIENTS);
    if (!recips) { Logger.log('[' + cadence + '] No Recipients tab. Aborting.'); return; }
    var rH     = recips.header.map(function (h) { return String(h).trim(); });
    var cEmail  = rH.indexOf('Email Address');
    var cActive = rH.indexOf('Active (Yes/No)');
    var cFreq   = rH.indexOf(CADENCE_COL[cadence]);
    if (cEmail === -1 || cFreq === -1) {
      Logger.log('[' + cadence + '] Recipients missing required columns. Run ensureConfig().');
      return;
    }
    var emails = recips.rows.filter(function (r) {
      var active = cActive === -1 ? true : String(r[cActive]).trim().toLowerCase() === 'yes';
      var opted  = String(r[cFreq]).trim().toLowerCase() === 'yes';
      return active && opted;
    }).map(function (r) { return String(r[cEmail]).trim(); })
      .filter(function (e) { return e.length > 0; });

    if (emails.length === 0) { Logger.log('[' + cadence + '] No opted-in recipients. Skipping.'); return; }

    // 2. Build combined ledger (one bulk read per tab).
    var combined = buildCombinedLedger_(ss, cfg);
    if (combined.missing.length) { Logger.log('[' + cadence + '] Skipped tabs: ' + combined.missing.join(', ')); }
    if (combined.rows.length === 0) {
      Logger.log('[' + cadence + '] No ledger data in: ' + ledgerTabNames_(cfg).join(', '));
      return;
    }

    // Clock check after data load — log but continue.
    var afterLoad = Date.now();
    if (afterLoad - START > MAX_RUN_MS * 0.5) {
      Logger.log('[' + cadence + '] WARNING: data load took ' + ((afterLoad - START) / 1000).toFixed(1) +
                 's — consider narrowing "Ledger Tab Name" or archiving old data to a separate tab.');
    }

    // 3. Filter rows + compute.
    var period  = filterRowsByPeriod_(combined.rows, combined.map, cadence, cfg);
    if (period.rows.length === 0) { Logger.log('[' + cadence + '] No rows in window. Skipping dispatch.'); return; }
    var metrics = computeMetrics(period.rows, combined.map, ss, cfg, cadence === 'Annual');

    // 4. Build email.
    var subject  = buildSubject_(cfg, cadence, period, metrics);
    var htmlBody = buildHtmlEmail(cfg, cadence, period, metrics);

    // 5. Quota guard.
    var quota = MailApp.getRemainingDailyQuota();
    if (quota <= 0) { Logger.log('[' + cadence + '] Daily email quota exhausted. Aborting.'); return; }

    // 6. PDF attachment (Annual only, if enabled).
    var pdfBlob = null;
    if (cadence === 'Annual' && attachPdf_(cfg)) {
      try {
        pdfBlob = buildPdfReport_(cfg, period, metrics);
        Logger.log('[' + cadence + '] PDF generated: ' + (pdfBlob ? pdfBlob.getName() : 'null'));
      } catch (pdfErr) {
        Logger.log('[' + cadence + '] PDF generation failed (email will still send): ' + pdfErr.message);
      }
    }

    // 7. TIMEOUT FIX: send ONE email with BCC covering all recipients.
    //    Before (v2): N GmailApp.sendEmail() calls = N round-trips.
    //    After  (v3): 1 GmailApp.sendEmail() call with bcc field = 1 round-trip.
    var toAddress = emails[0];
    var opts = {
      htmlBody: htmlBody,
      name: String(cfg.get(KEYS.ORG_NAME, 'Financial Reports'))
    };
    if (emails.length > 1) { opts.bcc = emails.slice(1).join(','); }
    if (pdfBlob)           { opts.attachments = [pdfBlob]; }

    var sent = dispatchEmail_(toAddress, subject,
      'This financial report is best viewed in an email client that supports HTML.', opts);

    var elapsed = ((Date.now() - START) / 1000).toFixed(1);
    Logger.log('[' + cadence + '] ' + (sent ? 'Sent' : 'FAILED') + ' to ' + emails.length +
               ' recipient(s) via BCC. Rows: ' + period.rows.length + '. Time: ' + elapsed + 's.');

  } catch (err) {
    var elapsed = ((Date.now() - START) / 1000).toFixed(1);
    Logger.log('FATAL in processPeriod_(' + cadence + ') after ' + elapsed + 's: ' +
               err.message + '\n' + (err.stack || ''));
    // Notify the first admin if one is reachable.
    try {
      var adminEmail = Session.getActiveUser().getEmail();
      if (adminEmail) {
        GmailApp.sendEmail(adminEmail,
          'EFIC report error: ' + cadence,
          'The ' + cadence + ' report failed after ' + elapsed + 's.\n\nError: ' + err.message +
          '\n\nCheck the Apps Script execution log for details.',
          { name: 'EFIC System Alert' });
      }
    } catch (alertErr) { Logger.log('Could not send error alert: ' + alertErr.message); }
  }
}

function readTable_(ss, tabName) {
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) { return null; }
  var values = sheet.getDataRange().getValues();  // one bulk read
  if (values.length < 1) { return null; }
  return {
    header: values[0],
    rows:   values.slice(1).filter(function (r) { return r.some(function (c) { return c !== '' && c !== null; }); })
  };
}

var CANON_MAP = { date: 0, type: 1, account: 2, amount: 3, notes: 4 };

function ledgerTabNames_(cfg) {
  var raw   = String(cfg.get(KEYS.LEDGER_TAB, TABS.LEDGER));
  var names = raw.split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s.length; });
  return names.length ? names : [TABS.LEDGER];
}

function buildCombinedLedger_(ss, cfg) {
  var names = ledgerTabNames_(cfg);
  var rows = [], used = [], missing = [];
  names.forEach(function (name) {
    var t = readTable_(ss, name);  // one bulk read per tab
    if (!t || t.rows.length === 0) { missing.push(name); return; }
    var m = resolveHeaderMap(t.header);
    if (m.amount === -1 || m.type === -1) { missing.push(name + ' (missing Type/Amount headers)'); return; }
    t.rows.forEach(function (r) {
      rows.push([
        m.date    !== -1 ? r[m.date]    : '',
        m.type    !== -1 ? r[m.type]    : '',
        m.account !== -1 ? r[m.account] : '',
        m.amount  !== -1 ? r[m.amount]  : '',
        m.notes   !== -1 ? r[m.notes]   : ''
      ]);
    });
    used.push(name);
  });
  return { rows: rows, map: CANON_MAP, tabs: used, missing: missing };
}


/*================================================================================================
 *  PERIOD / FISCAL-CALENDAR LOGIC
 *==============================================================================================*/
function filterRowsByPeriod_(rows, map, cadence, cfg) {
  var refNow  = getReferenceNow_(rows, map);
  var fyStart = fyStartMonth_(cfg);
  var label   = '';
  var filtered = [];
  var refFQ   = fiscalQuarterOf_(refNow, fyStart);

  rows.forEach(function (r) {
    var d    = parseDate_(r[map.date]);
    var keep = false;

    if (cadence === 'Quarterly') {
      if (d) {
        var fq = fiscalQuarterOf_(d, fyStart);
        keep = (fq.q === refFQ.q && fq.fyStartYear === refFQ.fyStartYear);
      }
      if (!d && map.notes !== -1) {
        keep = String(r[map.notes] || '').trim().toUpperCase() === ('Q' + refFQ.q);
      }
    } else if (d) {
      var rY = refNow.getFullYear(), rM = refNow.getMonth(), rD = refNow.getDate();
      if (cadence === 'Daily') {
        keep = d.getFullYear() === rY && d.getMonth() === rM && d.getDate() === rD;
      } else if (cadence === 'Weekly') {
        var weekAgo = new Date(rY, rM, rD - 6, 0, 0, 0, 0);
        keep = d >= weekAgo && d <= new Date(rY, rM, rD, 23, 59, 59, 999);
      } else if (cadence === 'Monthly') {
        keep = d.getFullYear() === rY && d.getMonth() === rM;
      } else if (cadence === 'Annual') {
        keep = fiscalQuarterOf_(d, fyStart).fyStartYear === refFQ.fyStartYear;
      }
    }
    if (keep) { filtered.push(r); }
  });

  var tz = tzOf_(cfg);
  if (cadence === 'Daily')        { label = Utilities.formatDate(refNow, tz, 'EEE, d MMM yyyy'); }
  else if (cadence === 'Weekly')  { label = '7 days to ' + Utilities.formatDate(refNow, tz, 'd MMM yyyy'); }
  else if (cadence === 'Monthly') { label = Utilities.formatDate(refNow, tz, 'MMMM yyyy'); }
  else if (cadence === 'Quarterly') { label = 'Q' + refFQ.q + ' FY' + refFQ.fyStartYear; }
  else if (cadence === 'Annual')  { label = 'FY' + refFQ.fyStartYear; }

  return { rows: filtered, label: label, refNow: refNow, fy: refFQ };
}

function getReferenceNow_(rows, map) {
  var real = new Date();
  if (map.date === -1) { return real; }
  var latest = null;
  rows.forEach(function (r) { var d = parseDate_(r[map.date]); if (d && (!latest || d > latest)) { latest = d; } });
  return (latest && latest.getFullYear() !== real.getFullYear()) ? latest : real;
}

function fiscalQuarterOf_(d, fyStartMonthIdx) {
  var monthsIn  = ((d.getMonth() - fyStartMonthIdx) + 12) % 12;
  var q         = Math.floor(monthsIn / 3) + 1;
  var fyStartYear = (d.getMonth() >= fyStartMonthIdx) ? d.getFullYear() : d.getFullYear() - 1;
  return { q: q, fyStartYear: fyStartYear };
}

function parseDate_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) { return value; }
  if (value === '' || value === null || value === undefined) { return null; }
  var d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}


/*================================================================================================
 *  PHASE 4 — METRICS
 *==============================================================================================*/
function computeMetrics(rows, map, ss, cfg, fullStatements) {
  var m = {
    revenues: 0, cogs: 0, opex: 0, assets: 0, liabilities: 0, equityContributed: 0,
    grossProfit: 0, netProfit: 0, equity: 0,
    grossMargin: 0, operatingMargin: 0, netMargin: 0,
    roa: 0, roe: 0, debtRatio: 0, equityRatio: 0, debtToEquity: 0,
    rowCount: rows.length,
    accountSummary: {},
    advanced: null,
    statutory: null
  };

  // All computation is in-memory — no Sheets API calls inside this loop.
  rows.forEach(function (r) {
    var type    = String(r[map.type]   || '').trim();
    var bucket  = normalizeType_(type);
    var amount  = toNumber_(r[map.amount]);
    var account = (map.account !== -1 ? String(r[map.account] || '').trim() : '') || '(Unspecified)';

    if (bucket === 'income')           { m.revenues          += amount; }
    else if (bucket === 'cogs')        { m.cogs              += amount; }
    else if (bucket === 'opex')        { m.opex              += amount; }
    else if (bucket === 'assets')      { m.assets            += amount; }
    else if (bucket === 'liabilities') { m.liabilities       += amount; }
    else if (bucket === 'equity')      { m.equityContributed += amount; }

    if (!m.accountSummary[account]) { m.accountSummary[account] = { total: 0, type: type }; }
    m.accountSummary[account].total += amount;
  });

  m.grossProfit     = m.revenues - m.cogs;
  m.netProfit       = m.revenues - (m.cogs + m.opex);
  m.equity          = m.assets - m.liabilities;
  m.grossMargin     = pct_(m.grossProfit, m.revenues);
  m.operatingMargin = pct_(m.netProfit, m.revenues);
  m.netMargin       = pct_(m.netProfit, m.revenues);
  m.roa             = pct_(m.netProfit, m.assets);
  m.roe             = pct_(m.netProfit, m.equity);
  m.debtRatio       = ratio_(m.liabilities, m.assets);
  m.equityRatio     = ratio_(m.equity, m.assets);
  m.debtToEquity    = ratio_(m.liabilities, m.equity);

  if (fullStatements) {
    m.advanced  = computeAdvanced_(rows, map, ss, m);
    m.statutory = readStatutory_(ss, m);
  }
  return m;
}

function readChartOfAccounts_(ss) {
  var t = readTable_(ss, TABS.COA);  // one bulk read
  if (!t) { return null; }
  var h  = t.header.map(function (x) { return String(x).trim().toLowerCase(); });
  var ca = h.indexOf('account'), cs = h.indexOf('sub-type');
  if (ca === -1 || cs === -1) { return null; }
  var map = {}, filled = 0;
  t.rows.forEach(function (r) {
    var acc = String(r[ca] || '').trim().toLowerCase();
    var sub = String(r[cs] || '').trim();
    if (acc && sub) { map[acc] = sub; filled++; }
  });
  return filled > 0 ? map : null;
}

function computeAdvanced_(rows, map, ss, m) {
  var coa = readChartOfAccounts_(ss);
  if (!coa) { return null; }
  var sub = { Cash: 0, Receivables: 0, Inventory: 0, CurrentAsset: 0, CurrentLiability: 0 };
  rows.forEach(function (r) {
    var acc    = (map.account !== -1 ? String(r[map.account] || '').trim().toLowerCase() : '');
    var amount = toNumber_(r[map.amount]);
    var st     = coa[acc];
    if (!st) { return; }
    if (st === 'Cash')             { sub.Cash += amount; sub.CurrentAsset += amount; }
    else if (st === 'Receivables') { sub.Receivables += amount; sub.CurrentAsset += amount; }
    else if (st === 'Inventory')   { sub.Inventory += amount; sub.CurrentAsset += amount; }
    else if (st === 'Current Asset')    { sub.CurrentAsset += amount; }
    else if (st === 'Current Liability'){ sub.CurrentLiability += amount; }
  });
  return {
    hasData: true,
    currentAssets: sub.CurrentAsset, currentLiabilities: sub.CurrentLiability,
    cash: sub.Cash, receivables: sub.Receivables, inventory: sub.Inventory,
    currentRatio:      ratio_(sub.CurrentAsset, sub.CurrentLiability),
    quickRatio:        ratio_(sub.CurrentAsset - sub.Inventory, sub.CurrentLiability),
    cashRatio:         ratio_(sub.Cash, sub.CurrentLiability),
    assetTurnover:     ratio_(m.revenues, m.assets),
    inventoryTurnover: ratio_(m.cogs, sub.Inventory)
  };
}

function toNumber_(v) {
  if (typeof v === 'number') { return isNaN(v) ? 0 : v; }
  if (v === null || v === undefined) { return 0; }
  var n = parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : n;
}

function normalizeType_(type) {
  var t = String(type).trim().toLowerCase();
  if (t === 'income' || t === 'revenue' || t === 'revenues' || t === 'sales') { return 'income'; }
  if (t === 'cogs'   || t === 'cost of sales' || t === 'cost of goods sold')  { return 'cogs'; }
  if (t === 'opex'   || t === 'expense' || t === 'expenses' ||
      t === 'operating expense' || t === 'operating expenses')                { return 'opex'; }
  if (t === 'asset'  || t === 'assets')                                        { return 'assets'; }
  if (t === 'liability' || t === 'liabilities')                                { return 'liabilities'; }
  if (t === 'equity' || t === 'capital')                                       { return 'equity'; }
  return 'other';
}
function pct_(num, den)   { return den ? (num / den) * 100 : 0; }
function ratio_(num, den) { return den ? (num / den) : 0; }


/*================================================================================================
 *  PDF REPORT GENERATOR (new in v3)
 *
 *  Creates a temporary Google Doc, writes the financial report into it, exports as PDF,
 *  deletes the temp Doc, and returns the PDF Blob ready to attach to an email.
 *
 *  Requires: DocumentApp, DriveApp — both are standard Apps Script services.
 *==============================================================================================*/
function buildPdfReport_(cfg, period, m) {
  var cur  = curOf_(cfg);
  var org  = String(cfg.get(KEYS.ORG_NAME, 'Organisation'));
  var tz   = tzOf_(cfg);
  var title = org + ' — Annual Report ' + period.label;

  var doc  = DocumentApp.create(title);
  var body = doc.getBody();

  // Cover / title.
  body.appendParagraph(org).setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendParagraph('Annual Financial Report').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph('Period: ' + period.label);
  body.appendParagraph('Generated: ' + Utilities.formatDate(new Date(), tz, 'dd MMMM yyyy HH:mm') + ' (' + tz + ')');
  body.appendParagraph('Records in period: ' + m.rowCount);
  body.appendHorizontalRule();

  // Performance summary.
  body.appendParagraph('Performance Summary').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  appendDocTable_(body, [
    ['Metric', 'Amount'],
    ['Total Revenue',          money_(m.revenues, cur)],
    ['Cost of Sales (COGS)',   money_(m.cogs, cur)],
    ['Gross Profit',           money_(m.grossProfit, cur)],
    ['Operating Expenses',     money_(m.opex, cur)],
    [(m.netProfit >= 0 ? 'Net Profit' : 'Net Loss'), money_(m.netProfit, cur)],
    ['Gross Margin',           m.grossMargin.toFixed(1) + '%'],
    ['Net Profit Margin',      m.netMargin.toFixed(1) + '%']
  ]);

  // Income statement.
  body.appendParagraph('Income Statement').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  appendDocTable_(body, [
    ['Line', 'Amount'],
    ['Revenue',                      money_(m.revenues, cur)],
    ['Less: Cost of Sales',          money_(m.cogs, cur)],
    ['Gross Profit',                 money_(m.grossProfit, cur)],
    ['Less: Operating Expenses',     money_(m.opex, cur)],
    ['Net Income',                   money_(m.netProfit, cur)]
  ]);

  // Statutory & tax (if applicable).
  if (m.statutory && m.statutory.items && m.statutory.items.length) {
    body.appendParagraph('Statutory & Tax').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    var sRows = [['Item', 'Rate', 'Base', 'Amount']];
    m.statutory.items.forEach(function (it) {
      sRows.push([it.name, Number(it.rate).toFixed(0) + '%', String(it.base || ''), money_(it.amount, cur)]);
    });
    sRows.push(['Net Profit After Statutory', '', '', money_(m.statutory.netAfter, cur)]);
    appendDocTable_(body, sRows);
  }

  // Balance sheet.
  body.appendParagraph('Balance Sheet (Summary)').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  appendDocTable_(body, [
    ['Item', 'Amount'],
    ['Total Assets',                 money_(m.assets, cur)],
    ['Total Liabilities',            money_(m.liabilities, cur)],
    ['Equity (Assets − Liabilities)', money_(m.equity, cur)]
  ]);

  // Financial ratios.
  body.appendParagraph('Financial Ratios').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  var ratioRows = [
    ['Ratio', 'Value'],
    ['Gross Margin',           m.grossMargin.toFixed(1) + '%'],
    ['Operating Margin',       m.operatingMargin.toFixed(1) + '%'],
    ['Net Profit Margin',      m.netMargin.toFixed(1) + '%'],
    ['Return on Assets (ROA)', m.roa.toFixed(1) + '%'],
    ['Return on Equity (ROE)', m.roe.toFixed(1) + '%'],
    ['Debt Ratio',             m.debtRatio.toFixed(2)],
    ['Equity Ratio',           m.equityRatio.toFixed(2)],
    ['Debt-to-Equity',         m.debtToEquity.toFixed(2)]
  ];
  if (m.advanced && m.advanced.hasData) {
    ratioRows.push(
      ['Current Ratio',      m.advanced.currentRatio.toFixed(2)],
      ['Quick Ratio',        m.advanced.quickRatio.toFixed(2)],
      ['Cash Ratio',         m.advanced.cashRatio.toFixed(2)],
      ['Asset Turnover',     m.advanced.assetTurnover.toFixed(2)],
      ['Inventory Turnover', m.advanced.inventoryTurnover.toFixed(2)]
    );
  }
  appendDocTable_(body, ratioRows);

  // Footer note.
  body.appendParagraph('')
      .appendText('This report was generated automatically by the EFIC Financial Reporting System. ' +
                  'All figures are based on data recorded in the linked Google Spreadsheet.')
      .setItalic(true);

  doc.saveAndClose();

  // Export to PDF and clean up the temp Doc.
  var fileId  = doc.getId();
  var pdfBlob = DriveApp.getFileById(fileId).getAs(MimeType.PDF);
  pdfBlob.setName(title + '.pdf');
  DriveApp.getFileById(fileId).setTrashed(true);  // remove temp file from Drive

  return pdfBlob;
}

/** Appends a 2-D array as a table to a DocumentApp Body. First row is bold. */
function appendDocTable_(body, data) {
  if (!data || data.length === 0) { return; }
  var cols = data[0].length;
  var t    = body.appendTable(data);
  for (var c = 0; c < cols; c++) {
    t.getRow(0).getCell(c).editAsText().setBold(true);
  }
  return t;
}


/*================================================================================================
 *  PHASE 5 — EMAIL
 *==============================================================================================*/
function i18n_(lang) {
  var code = String(lang || 'EN').trim().toUpperCase();
  code = (code.indexOf('DE') === 0) ? 'DE' : (code.indexOf('SW') === 0) ? 'SW' : 'EN';
  var dict = {
    EN: {
      report:'Report', net:'NET', profit:'PROFIT', loss:'LOSS',
      cadence:{Daily:'Daily',Weekly:'Weekly',Monthly:'Monthly',Quarterly:'Quarterly',Annual:'Annual'},
      performanceSummary:'Performance Summary', totalRevenue:'Total Revenue', costOfSales:'Cost of Sales (COGS)',
      grossProfit:'Gross Profit', operatingExpenses:'Operating Expenses', netProfit:'Net Profit', netLoss:'Net Loss',
      netProfitMargin:'Net Profit Margin',
      accountBreakdown:'Account Breakdown', account:'Account', type:'Type', subtotal:'Subtotal', noActivity:'No account activity.',
      incomeStatement:'Income Statement', revenue:'Revenue', lessCostOfSales:'Less: Cost of Sales',
      lessOperatingExpenses:'Less: Operating Expenses', netIncome:'Net Income',
      balanceSheet:'Balance Sheet (summary)', totalAssets:'Total Assets', totalLiabilities:'Total Liabilities',
      equityAL:'Equity (Assets − Liabilities)', ofWhichBookedEquity:'&nbsp;&nbsp;of which booked equity',
      retainedEarnings:'Retained Earnings (period net income)',
      eqNote:'Based on the accounting equation: Assets = Liabilities + Equity.',
      financialRatios:'Financial Ratios', grossMargin:'Gross Margin', operatingMargin:'Operating Margin',
      roa:'Return on Assets (ROA)', roe:'Return on Equity (ROE)', debtRatio:'Debt Ratio', equityRatio:'Equity Ratio',
      debtToEquity:'Debt-to-Equity',
      liquidityTitle:'Liquidity & Efficiency (from Chart of Accounts)', currentRatio:'Current Ratio',
      quickRatio:'Quick Ratio', cashRatio:'Cash Ratio', assetTurnover:'Asset Turnover', inventoryTurnover:'Inventory Turnover',
      coaTip:'Tip: fill in the optional Chart_of_Accounts tab to unlock current/quick/cash ratios and turnover metrics.',
      statutoryTitle:'Statutory & Tax', profitAfterStatutory:'Net Profit After Statutory',
      reportingPeriod:'Reporting period', generated:'generated', recordsInPeriod:'Records in this period',
      automatedNote:'Automated report — please do not reply.',
      pdfNote:'A PDF copy of this report is attached.'
    },
    DE: {
      report:'Bericht', net:'NETTO', profit:'GEWINN', loss:'VERLUST',
      cadence:{Daily:'Täglich',Weekly:'Wöchentlich',Monthly:'Monatlich',Quarterly:'Quartalsweise',Annual:'Jährlich'},
      performanceSummary:'Leistungsübersicht', totalRevenue:'Gesamtumsatz', costOfSales:'Wareneinsatz (COGS)',
      grossProfit:'Rohertrag', operatingExpenses:'Betriebskosten', netProfit:'Nettogewinn', netLoss:'Nettoverlust',
      netProfitMargin:'Nettogewinnmarge',
      accountBreakdown:'Kontenaufstellung', account:'Konto', type:'Typ', subtotal:'Zwischensumme', noActivity:'Keine Kontobewegungen.',
      incomeStatement:'Gewinn- und Verlustrechnung', revenue:'Umsatz', lessCostOfSales:'Abzüglich Wareneinsatz',
      lessOperatingExpenses:'Abzüglich Betriebskosten', netIncome:'Jahresüberschuss',
      balanceSheet:'Bilanz (Übersicht)', totalAssets:'Summe Aktiva', totalLiabilities:'Summe Verbindlichkeiten',
      equityAL:'Eigenkapital (Aktiva − Verbindlichkeiten)', ofWhichBookedEquity:'&nbsp;&nbsp;davon gebuchtes Eigenkapital',
      retainedEarnings:'Gewinnvortrag (Periodenergebnis)',
      eqNote:'Nach der Bilanzgleichung: Aktiva = Verbindlichkeiten + Eigenkapital.',
      financialRatios:'Finanzkennzahlen', grossMargin:'Bruttomarge', operatingMargin:'Operative Marge',
      roa:'Gesamtkapitalrendite (ROA)', roe:'Eigenkapitalrendite (ROE)', debtRatio:'Verschuldungsgrad', equityRatio:'Eigenkapitalquote',
      debtToEquity:'Verschuldung zu Eigenkapital',
      liquidityTitle:'Liquidität & Effizienz (aus Kontenplan)', currentRatio:'Liquidität 3. Grades',
      quickRatio:'Liquidität 2. Grades', cashRatio:'Liquidität 1. Grades', assetTurnover:'Kapitalumschlag', inventoryTurnover:'Lagerumschlag',
      coaTip:'Tipp: Füllen Sie den optionalen Reiter Chart_of_Accounts aus, um Liquiditätskennzahlen freizuschalten.',
      statutoryTitle:'Steuern & gesetzliche Abgaben', profitAfterStatutory:'Nettogewinn nach Abgaben',
      reportingPeriod:'Berichtszeitraum', generated:'erstellt', recordsInPeriod:'Datensätze im Zeitraum',
      automatedNote:'Automatischer Bericht — bitte nicht antworten.',
      pdfNote:'Eine PDF-Kopie dieses Berichts ist beigefügt.'
    },
    SW: {
      report:'Ripoti', net:'HALISI', profit:'FAIDA', loss:'HASARA',
      cadence:{Daily:'Kila siku',Weekly:'Kila wiki',Monthly:'Kila mwezi',Quarterly:'Kila robo',Annual:'Kila mwaka'},
      performanceSummary:'Muhtasari wa Utendaji', totalRevenue:'Mapato Jumla', costOfSales:'Gharama ya Mauzo (COGS)',
      grossProfit:'Faida Ghafi', operatingExpenses:'Gharama za Uendeshaji', netProfit:'Faida Halisi', netLoss:'Hasara Halisi',
      netProfitMargin:'Kiwango cha Faida Halisi',
      accountBreakdown:'Mchanganuo wa Akaunti', account:'Akaunti', type:'Aina', subtotal:'Jumla Ndogo', noActivity:'Hakuna shughuli.',
      incomeStatement:'Taarifa ya Mapato', revenue:'Mapato', lessCostOfSales:'Toa: Gharama ya Mauzo',
      lessOperatingExpenses:'Toa: Gharama za Uendeshaji', netIncome:'Mapato Halisi',
      balanceSheet:'Mizania (muhtasari)', totalAssets:'Jumla ya Mali', totalLiabilities:'Jumla ya Madeni',
      equityAL:'Mtaji (Mali − Madeni)', ofWhichBookedEquity:'&nbsp;&nbsp;ambao mtaji ulioandikwa',
      retainedEarnings:'Faida Iliyobaki',
      eqNote:'Kwa mlinganyo wa uhasibu: Mali = Madeni + Mtaji.',
      financialRatios:'Uwiano wa Kifedha', grossMargin:'Kiwango cha Faida Ghafi', operatingMargin:'Kiwango cha Uendeshaji',
      roa:'Faida kwa Mali (ROA)', roe:'Faida kwa Mtaji (ROE)', debtRatio:'Uwiano wa Deni', equityRatio:'Uwiano wa Mtaji',
      debtToEquity:'Deni kwa Mtaji',
      liquidityTitle:'Ukwasi & Ufanisi (kutoka Chart of Accounts)', currentRatio:'Uwiano wa Sasa',
      quickRatio:'Uwiano wa Haraka', cashRatio:'Uwiano wa Fedha Taslimu', assetTurnover:'Mzunguko wa Mali', inventoryTurnover:'Mzunguko wa Bidhaa',
      coaTip:'Dokezo: jaza kichupo cha hiari cha Chart_of_Accounts ili kupata uwiano wa ukwasi.',
      statutoryTitle:'Kodi & Tozo za Kisheria', profitAfterStatutory:'Faida Halisi Baada ya Tozo',
      reportingPeriod:'Kipindi cha ripoti', generated:'imetengenezwa', recordsInPeriod:'Rekodi katika kipindi',
      automatedNote:'Ripoti ya kiotomatiki — tafadhali usijibu.',
      pdfNote:'Nakala ya PDF ya ripoti hii imeambatishwa.'
    }
  };
  return dict[code];
}

function buildSubject_(cfg, cadence, period, metrics) {
  var org = String(cfg.get(KEYS.ORG_NAME, 'Financial Report'));
  var L   = i18n_(cfg.get(KEYS.LANG, 'EN'));
  var cadLabel = (L.cadence && L.cadence[cadence]) ? L.cadence[cadence] : cadence;
  return org + ' — ' + cadLabel + ' ' + L.report + ' (' + period.label + ')';
}

function buildHtmlEmail(cfg, cadence, period, m) {
  var primary  = String(cfg.get(KEYS.PRIMARY, FALLBACK_PRIMARY)) || FALLBACK_PRIMARY;
  var accent   = String(cfg.get(KEYS.ACCENT,  FALLBACK_ACCENT))  || FALLBACK_ACCENT;
  var org      = escapeHtml_(String(cfg.get(KEYS.ORG_NAME, 'Your Company')));
  var tagline  = escapeHtml_(String(cfg.get(KEYS.TAGLINE, '')));
  var cur      = curOf_(cfg);
  var tz       = tzOf_(cfg);
  var L        = i18n_(cfg.get(KEYS.LANG, 'EN'));
  var fontFam  = String(cfg.get(KEYS.FONT_FAMILY, '')).trim();
  var fontUrl  = String(cfg.get(KEYS.FONT_URL, '')).trim();
  var pdfOn    = attachPdf_(cfg);
  var perfColor = m.netProfit >= 0 ? COLOR_POSITIVE : COLOR_NEGATIVE;
  var perfWord  = m.netProfit >= 0 ? L.profit : L.loss;
  var cadLabel  = (L.cadence && L.cadence[cadence]) ? L.cadence[cadence] : cadence;
  var fontImport = fontUrl ? "@import url('" + fontUrl + "');" : '';
  var fontStack  = (fontFam ? "'" + fontFam + "'," : '') +
                   "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

  var body = '';
  body += sectionTitle_(L.performanceSummary, primary);
  body += statTable_([
    [L.totalRevenue,       money_(m.revenues, cur)],
    [L.costOfSales,        money_(m.cogs, cur)],
    [L.grossProfit,        money_(m.grossProfit, cur)],
    [L.operatingExpenses,  money_(m.opex, cur)],
    [(m.netProfit >= 0 ? L.netProfit : L.netLoss), money_(m.netProfit, cur), true],
    [L.netProfitMargin,    m.netMargin.toFixed(1) + '%', true]
  ], primary);

  if (cadence === 'Annual') {
    body += incomeStatementHtml_(m, cur, primary, L);
    body += statutoryHtml_(m, cur, primary, L);
    body += balanceSheetHtml_(m, cur, primary, L);
    body += ratiosHtml_(m, primary, L);
    if (pdfOn) {
      body += '<p style="font-size:13px;color:#24292e;margin:18px 0 6px;padding:10px 14px;' +
              'background:#f6f8fa;border-left:3px solid ' + accent + ';border-radius:0 4px 4px 0;">' +
              '📎 ' + L.pdfNote + '</p>';
    }
  } else {
    body += sectionTitle_(L.accountBreakdown, primary);
    body += accountTable_(m, cur, primary, L);
  }

  body += '<p style="font-size:12px;color:#6a737d;margin:18px 0 0 0;">' +
          L.recordsInPeriod + ': ' + m.rowCount + '</p>';

  var social  = socialRow_(cfg, accent);
  var gdpr    = escapeHtml_(String(cfg.get(KEYS.GDPR, '')));
  var website = String(cfg.get(KEYS.WEBSITE, '')).trim();

  return '' +
'<!doctype html><html><head><meta charset="utf-8"><style>' + fontImport + '</style></head>' +
'<body style="margin:0;padding:0;background:#eef1f5;">' +
'<div style="font-family:' + fontStack + ';max-width:660px;margin:0 auto;padding:24px 12px;">' +
  '<div style="background:' + primary + ';border-radius:12px 12px 0 0;padding:26px 30px;">' +
    '<div style="color:' + accent + ';font-size:22px;font-weight:700;letter-spacing:.01em;">' + org + '</div>' +
    (tagline ? '<div style="color:#ffffff;opacity:.82;font-size:13px;margin-top:4px;">' + tagline + '</div>' : '') +
    '<div style="margin-top:16px;display:inline-block;background:' + perfColor + ';color:#fff;font-size:12px;' +
         'font-weight:700;letter-spacing:.06em;padding:5px 12px;border-radius:20px;">' +
         cadLabel.toUpperCase() + ' · ' + L.net + ' ' + perfWord + ' ' + money_(Math.abs(m.netProfit), cur) +
    '</div>' +
  '</div>' +
  '<div style="background:#fff;border:1px solid #e1e4e8;border-top:none;border-radius:0 0 12px 12px;padding:26px 30px 30px;">' +
    '<p style="font-size:13px;color:#6a737d;margin:0 0 20px;">' + L.reportingPeriod + ': <strong style="color:#24292e;">' +
        escapeHtml_(period.label) + '</strong> &nbsp;·&nbsp; ' + L.generated + ' ' +
        Utilities.formatDate(new Date(), tz, 'd MMM yyyy, HH:mm') + '</p>' +
    body +
    '<div style="margin-top:26px;padding-top:16px;border-top:1px solid #eaecef;font-size:12px;color:#6a737d;line-height:1.6;">' +
      (website ? 'Web: ' + escapeHtml_(website) + '<br>' : '') +
      social +
      (gdpr ? '<div style="margin-top:10px;">' + gdpr + '</div>' : '') +
    '</div>' +
  '</div>' +
  '<p style="text-align:center;font-size:11px;color:#9aa0a6;margin:16px 0 0;">' + L.automatedNote + '</p>' +
'</div></body></html>';
}

function sectionTitle_(text, primary) {
  return '<h2 style="font-size:15px;color:' + primary + ';margin:24px 0 10px;font-weight:700;">' + text + '</h2>';
}

function statTable_(rows, primary) {
  var html = '<table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;' +
             'border:1px solid #eaecef;border-radius:6px;overflow:hidden;">';
  rows.forEach(function (r) {
    var strong = r[2] ? '700' : '400';
    var bg     = r[2] ? '#f6f8fa' : '#fff';
    html += '<tr style="background:' + bg + ';">' +
      '<td style="padding:10px 16px;font-size:14px;color:#24292e;border-bottom:1px solid #eaecef;font-weight:' + strong + ';">' + r[0] + '</td>' +
      '<td style="padding:10px 16px;font-size:14px;color:#24292e;text-align:right;border-bottom:1px solid #eaecef;font-weight:' + strong + ';">' + r[1] + '</td>' +
    '</tr>';
  });
  return html + '</table>';
}

function accountTable_(m, cur, primary, L) {
  var names = Object.keys(m.accountSummary).sort();
  var rows  = '';
  if (!names.length) {
    rows = '<tr><td colspan="3" style="padding:10px 16px;color:#6a737d;font-size:13px;">' + L.noActivity + '</td></tr>';
  } else {
    names.forEach(function (name, i) {
      var a = m.accountSummary[name];
      rows += '<tr style="background:' + (i % 2 ? '#f6f8fa' : '#fff') + ';">' +
        '<td style="padding:9px 16px;font-size:13px;color:#24292e;border-bottom:1px solid #eaecef;">' + escapeHtml_(name) + '</td>' +
        '<td style="padding:9px 16px;font-size:12px;color:#6a737d;border-bottom:1px solid #eaecef;">' + escapeHtml_(a.type || '') + '</td>' +
        '<td style="padding:9px 16px;font-size:13px;color:#24292e;text-align:right;border-bottom:1px solid #eaecef;">' + money_(a.total, cur) + '</td>' +
      '</tr>';
    });
  }
  return '<table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;' +
         'border:1px solid #eaecef;border-radius:6px;overflow:hidden;">' +
    '<tr style="background:' + primary + ';">' +
      '<td style="padding:9px 16px;font-size:11px;color:#fff;text-transform:uppercase;letter-spacing:.05em;">' + L.account + '</td>' +
      '<td style="padding:9px 16px;font-size:11px;color:#fff;text-transform:uppercase;letter-spacing:.05em;">' + L.type + '</td>' +
      '<td style="padding:9px 16px;font-size:11px;color:#fff;text-transform:uppercase;letter-spacing:.05em;text-align:right;">' + L.subtotal + '</td>' +
    '</tr>' + rows + '</table>';
}

function incomeStatementHtml_(m, cur, primary, L) {
  return sectionTitle_(L.incomeStatement, primary) + statTable_([
    [L.revenue,               money_(m.revenues, cur)],
    [L.lessCostOfSales,       money_(m.cogs, cur)],
    [L.grossProfit,           money_(m.grossProfit, cur), true],
    [L.lessOperatingExpenses, money_(m.opex, cur)],
    [L.netIncome,             money_(m.netProfit, cur), true]
  ], primary);
}

function statutoryHtml_(m, cur, primary, L) {
  var s = m.statutory;
  if (!s || !s.items || !s.items.length) { return ''; }
  var rows = s.items.map(function (it) {
    var label = escapeHtml_(it.name) + ' (' + Number(it.rate).toFixed(it.rate % 1 ? 1 : 0) + '% · ' + escapeHtml_(String(it.base || '')) + ')';
    return [label, money_(it.amount, cur)];
  });
  rows.push([L.profitAfterStatutory, money_(s.netAfter, cur), true]);
  return sectionTitle_(L.statutoryTitle, primary) + statTable_(rows, primary);
}

function balanceSheetHtml_(m, cur, primary, L) {
  var rows = [
    [L.totalAssets,      money_(m.assets, cur), true],
    [L.totalLiabilities, money_(m.liabilities, cur)],
    [L.equityAL,         money_(m.equity, cur), true]
  ];
  if (m.equityContributed) { rows.push([L.ofWhichBookedEquity, money_(m.equityContributed, cur)]); }
  rows.push([L.retainedEarnings, money_(m.netProfit, cur)]);
  return sectionTitle_(L.balanceSheet, primary) + statTable_(rows, primary) +
    '<p style="font-size:11px;color:#9aa0a6;margin:6px 0 0;">' + L.eqNote + '</p>';
}

function ratiosHtml_(m, primary, L) {
  var core = [
    [L.grossMargin,     m.grossMargin.toFixed(1) + '%'],
    [L.operatingMargin, m.operatingMargin.toFixed(1) + '%'],
    [L.netProfitMargin, m.netMargin.toFixed(1) + '%'],
    [L.roa,             m.roa.toFixed(1) + '%'],
    [L.roe,             m.roe.toFixed(1) + '%'],
    [L.debtRatio,       m.debtRatio.toFixed(2)],
    [L.equityRatio,     m.equityRatio.toFixed(2)],
    [L.debtToEquity,    m.debtToEquity.toFixed(2)]
  ];
  var html = sectionTitle_(L.financialRatios, primary) + statTable_(core, primary);
  if (m.advanced && m.advanced.hasData) {
    html += '<h3 style="font-size:13px;color:#24292e;margin:18px 0 8px;font-weight:700;">' + L.liquidityTitle + '</h3>';
    html += statTable_([
      [L.currentRatio,      m.advanced.currentRatio.toFixed(2)],
      [L.quickRatio,        m.advanced.quickRatio.toFixed(2)],
      [L.cashRatio,         m.advanced.cashRatio.toFixed(2)],
      [L.assetTurnover,     m.advanced.assetTurnover.toFixed(2)],
      [L.inventoryTurnover, m.advanced.inventoryTurnover.toFixed(2)]
    ], primary);
  } else {
    html += '<p style="font-size:11px;color:#9aa0a6;margin:8px 0 0;">' + L.coaTip + '</p>';
  }
  return html;
}

function socialRow_(cfg, accent) {
  var links = [
    ['Website',  cfg.get(KEYS.WEBSITE, '')],
    ['LinkedIn', cfg.get(KEYS.LINKEDIN, '')],
    ['Facebook', cfg.get(KEYS.FACEBOOK, '')],
    ['Instagram',cfg.get(KEYS.INSTAGRAM, '')],
    ['Twitter/X',cfg.get(KEYS.TWITTER, '')],
    ['WhatsApp', cfg.get(KEYS.WHATSAPP, '')],
    ['YouTube',  cfg.get(KEYS.YOUTUBE, '')]
  ].filter(function (l) { return String(l[1]).trim().length > 0; });
  if (!links.length) { return ''; }
  var pills = links.map(function (l) {
    return '<a href="' + escapeHtml_(String(l[1])) + '" style="display:inline-block;margin:4px 6px 0 0;padding:5px 11px;' +
           'border:1px solid ' + accent + ';border-radius:16px;color:' + accent + ';font-size:12px;text-decoration:none;">' +
           l[0] + '</a>';
  }).join('');
  return '<div style="margin-top:8px;">' + pills + '</div>';
}

/**
 * Sends one email. Accepts an optional `extras` object that can include:
 *   extras.htmlBody     — HTML body (string)
 *   extras.bcc          — comma-separated BCC addresses
 *   extras.attachments  — array of Blobs
 *   extras.name         — from-name
 */
function dispatchEmail_(emailAddress, subject, plainBody, extras) {
  try {
    var opts = {
      htmlBody: (extras && extras.htmlBody) ? String(extras.htmlBody) : plainBody
    };
    if (extras && extras.bcc)         { opts.bcc         = extras.bcc; }
    if (extras && extras.attachments) { opts.attachments = extras.attachments; }
    if (extras && extras.name)        { opts.name        = extras.name; }

    GmailApp.sendEmail(String(emailAddress), String(subject), String(plainBody), opts);
    return true;
  } catch (err) {
    Logger.log('ERROR sending to ' + emailAddress + ': ' + err.message);
    return false;
  }
}

function money_(n, cur) {
  var num = (typeof n === 'number' && !isNaN(n)) ? n : 0;
  var abs = Math.abs(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  var s   = (cur ? cur + ' ' : '') + abs;
  return num < 0 ? '(' + s + ')' : s;
}

function escapeHtml_(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                  .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}


/*================================================================================================
 *  TRIGGERS — reads times / day / timezone from Settings
 *
 *  FIX (v3): The monthly/quarterly/annual triggers all use onMonthDay(1) — the minimum
 *  supported interval in Apps Script. The cadence gates inside runQuarterlyReport() and
 *  runAnnualReport() mean that only the right cadence fires on each trigger invocation.
 *==============================================================================================*/
function installTriggers() {
  try {
    var cfg = getConfig_();
    var targets = ['runDailyReport','runWeeklyReport','runMonthlyReport','runQuarterlyReport','runAnnualReport'];
    ScriptApp.getProjectTriggers().forEach(function (t) {
      if (targets.indexOf(t.getHandlerFunction()) !== -1) { ScriptApp.deleteTrigger(t); }
    });

    var dailyHour  = parseHour_(cfg.get(KEYS.DAILY_TIME, '7:00'));
    var weeklyHour = parseHour_(cfg.get(KEYS.WEEKLY_TIME, '8:00'));
    var weekDay    = weekDayOf_(cfg.get(KEYS.WEEKLY_DAY, 'Monday'));

    ScriptApp.newTrigger('runDailyReport').timeBased().everyDays(1).atHour(dailyHour).create();
    ScriptApp.newTrigger('runWeeklyReport').timeBased().onWeekDay(weekDay).atHour(weeklyHour).create();
    // All three fire on day 1 of every month; the gate inside each function decides whether to run.
    ScriptApp.newTrigger('runMonthlyReport').timeBased().onMonthDay(1).atHour(6).create();
    ScriptApp.newTrigger('runQuarterlyReport').timeBased().onMonthDay(1).atHour(7).create();
    ScriptApp.newTrigger('runAnnualReport').timeBased().onMonthDay(1).atHour(8).create();

    Logger.log('Triggers installed. Daily@' + dailyHour + 'h, Weekly ' + cfg.get(KEYS.WEEKLY_DAY,'Monday') + '@' + weeklyHour + 'h.');
    SpreadsheetApp.getActive().toast('Triggers installed.', 'installTriggers', 6);
  } catch (err) {
    Logger.log('ERROR installing triggers: ' + err.message);
    throw err;
  }
}

function parseHour_(v) {
  if (v instanceof Date) { return v.getHours(); }
  var h = parseInt(String(v).split(':')[0], 10);
  return (isNaN(h) || h < 0 || h > 23) ? 7 : h;
}

function weekDayOf_(name) {
  var map = {
    sunday:    ScriptApp.WeekDay.SUNDAY,
    monday:    ScriptApp.WeekDay.MONDAY,
    tuesday:   ScriptApp.WeekDay.TUESDAY,
    wednesday: ScriptApp.WeekDay.WEDNESDAY,
    thursday:  ScriptApp.WeekDay.THURSDAY,
    friday:    ScriptApp.WeekDay.FRIDAY,
    saturday:  ScriptApp.WeekDay.SATURDAY
  };
  return map[String(name).trim().toLowerCase()] || ScriptApp.WeekDay.MONDAY;
}


/*================================================================================================
 *  TEST HELPERS — run manually to preview without waiting for a trigger
 *==============================================================================================*/
function testDaily()     { processPeriod_('Daily'); }
function testWeekly()    { processPeriod_('Weekly'); }
function testMonthly()   { processPeriod_('Monthly'); }
function testQuarterly() { processPeriod_('Quarterly'); }
function testAnnual()    { processPeriod_('Annual'); }

function seedDemoLedger() {
  try {
    var ss  = SpreadsheetApp.getActiveSpreadsheet();
    var cfg = getConfig_();
    var tab = ledgerTabNames_(cfg)[0];
    var sheet = ss.getSheetByName(tab);
    if (!sheet) { throw new Error('Ledger tab "' + tab + '" not found. Run ensureConfig() first.'); }

    // Read header once.
    var header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
                      .map(function (h) { return String(h).trim(); });
    var now = new Date();
    var q   = 'Q' + (Math.floor(((now.getMonth() - fyStartMonth_(cfg)) + 12) % 12 / 3) + 1);
    function ago(d) { return new Date(now.getFullYear(), now.getMonth(), now.getDate() - d); }

    var samples = [
      { Date: ago(0), Type:'Income',      Account:'Sales Revenue',       Description:'Retail sales',         Amount:30000, 'Tax Group':'Standard', Reference:'INV-1007', Notes:q },
      { Date: ago(2), Type:'Income',      Account:'Sales Revenue',       Description:'Wholesale order',      Amount:12000, 'Tax Group':'Standard', Reference:'INV-1004', Notes:q },
      { Date: ago(4), Type:'Income',      Account:'Service Revenue',     Description:'Consulting fees',      Amount:8000,  'Tax Group':'Standard', Reference:'INV-1002', Notes:q },
      { Date: ago(1), Type:'COGS',        Account:'Cost of Goods Sold',  Description:'Stock purchased',      Amount:18000, 'Tax Group':'Standard', Reference:'BILL-300', Notes:q },
      { Date: ago(0), Type:'OPEX',        Account:'Salaries & Wages',    Description:'Staff payroll',        Amount:12000, 'Tax Group':'Exempt',   Reference:'PAY-06',   Notes:q },
      { Date: ago(3), Type:'OPEX',        Account:'Rent',                Description:'Office rent',          Amount:6000,  'Tax Group':'Exempt',   Reference:'RENT-06',  Notes:q },
      { Date: ago(6), Type:'OPEX',        Account:'Marketing',           Description:'Ad campaign',          Amount:2500,  'Tax Group':'Standard', Reference:'MKT-12',   Notes:q },
      { Date: ago(5), Type:'OPEX',        Account:'Utilities',           Description:'Electricity & water',  Amount:1500,  'Tax Group':'Standard', Reference:'UTL-06',   Notes:q },
      { Date: ago(2), Type:'Assets',      Account:'Cash',                Description:'Cash at bank',         Amount:15000, 'Tax Group':'Exempt',   Reference:'',         Notes:q },
      { Date: ago(2), Type:'Assets',      Account:'Accounts Receivable', Description:'Owed by customers',    Amount:7000,  'Tax Group':'Exempt',   Reference:'',         Notes:q },
      { Date: ago(2), Type:'Assets',      Account:'Inventory',           Description:'Stock on hand',        Amount:9000,  'Tax Group':'Exempt',   Reference:'',         Notes:q },
      { Date: ago(2), Type:'Assets',      Account:'Equipment',           Description:'Machinery',            Amount:20000, 'Tax Group':'Exempt',   Reference:'',         Notes:q },
      { Date: ago(2), Type:'Liabilities', Account:'Accounts Payable',    Description:'Owed to suppliers',    Amount:6000,  'Tax Group':'Exempt',   Reference:'',         Notes:q },
      { Date: ago(2), Type:'Liabilities', Account:'Bank Loan',           Description:'Term loan',            Amount:14000, 'Tax Group':'Exempt',   Reference:'',         Notes:q }
    ];

    // Build all rows in memory, then write in one setValues call.
    var rows = samples.map(function (s) {
      return header.map(function (h) {
        if (h.toLowerCase() === 'timestamp') { return new Date(); }
        return (s[h] !== undefined) ? s[h] : '';
      });
    });
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, header.length).setValues(rows);

    Logger.log('Seeded ' + rows.length + ' demo rows into "' + tab + '". Now run previewAnnualToMe().');
    SpreadsheetApp.getActive().toast('Seeded ' + rows.length + ' demo rows. Run previewAnnualToMe().', 'seedDemoLedger', 8);
  } catch (err) {
    Logger.log('ERROR seedDemoLedger: ' + err.message);
    throw err;
  }
}

/** Emails the Annual pack (with PDF if enabled) to YOU only, for a quick visual check. */
function previewAnnualToMe() {
  try {
    var ss      = SpreadsheetApp.getActiveSpreadsheet();
    var cfg     = getConfig_();
    var combined = buildCombinedLedger_(ss, cfg);
    if (combined.rows.length === 0) {
      Logger.log('No ledger data in: ' + ledgerTabNames_(cfg).join(', '));
      return;
    }
    var period  = filterRowsByPeriod_(combined.rows, combined.map, 'Annual', cfg);
    var metrics = computeMetrics(period.rows, combined.map, ss, cfg, true);
    var html    = buildHtmlEmail(cfg, 'Annual', period, metrics);
    var subject = buildSubject_(cfg, 'Annual', period, metrics);
    var me      = Session.getActiveUser().getEmail();

    var opts = { htmlBody: html, name: String(cfg.get(KEYS.ORG_NAME, 'EFIC')) };
    if (attachPdf_(cfg)) {
      try { opts.attachments = [buildPdfReport_(cfg, period, metrics)]; }
      catch (e) { Logger.log('PDF skipped in preview: ' + e.message); }
    }
    dispatchEmail_(me, subject, 'View this email in an HTML-capable client.', opts);
    Logger.log('Preview sent to ' + me);
  } catch (err) { Logger.log('ERROR previewAnnualToMe: ' + err.message); }
}

// End of Code.gs — EFIC Automated Financial Ledger & Reporting System v3
