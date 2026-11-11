// Functional test harness: stubs Apps Script globals and exercises the pure logic in Code.gs.
var fs = require('fs');
var vm = require('vm');

var sent = [];
var logs = [];
var appended = [];
var setValuesCalls = [];

function mkSheet(name, values) {
  return {
    getName: function () { return name; },
    getDataRange: function () { return { getValues: function () { return values; } }; },
    getLastRow: function () { return values.length; },
    getLastColumn: function () { return values[0] ? values[0].length : 0; },
    getMaxRows: function () { return 100; },
    getRange: function (r, c, nr, nc) {
      return {
        getValues: function () { return values.slice(r - 1, r - 1 + (nr || 1)).map(function (row) { return row.slice(c - 1, c - 1 + (nc || 1)); }); },
        setValues: function (v) { setValuesCalls.push({ sheet: name, r: r, c: c, rows: v.length }); v.forEach(function (row) { values.push(row); }); return this; },
        setFontWeight: function () { return this; }, setBackground: function () { return this; },
        setFontColor: function () { return this; }, setWrap: function () { return this; },
        setDataValidation: function () { return this; }
      };
    },
    appendRow: function (row) { appended.push(row); values.push(row); },
    setFrozenRows: function () {}, setColumnWidth: function () {}, autoResizeColumns: function () {},
    clear: function () { values.length = 0; }, getFormUrl: function () { return null; }
  };
}

var ledger = [
  ['Timestamp','Date','Type','Account','Description','Amount','Tax Group','Reference','Notes'],
  [new Date(), new Date(2024, 1, 10), 'Income',      'Sales Revenue',    '', 50000, '', '', 'Q1'],
  [new Date(), new Date(2024, 4, 10), 'COGS',        'Cost of Goods Sold','', 18000, '', '', 'Q2'],
  [new Date(), new Date(2024, 7, 10), 'OPEX',        'Rent',             '', 12000, '', '', 'Q3'],
  [new Date(), new Date(2024, 9, 10), 'Assets',      'Cash',             '', 15000, '', '', 'Q4'],
  [new Date(), new Date(2024, 9, 10), 'Asset',       'Inventory',        '', 9000,  '', '', 'Q4'],
  [new Date(), new Date(2024, 9, 10), 'Liabilities', 'Accounts Payable', '', 6000,  '', '', 'Q4']
];
var settings = [
  ['Setting','Value','Description'],
  ['Organisation Name','EFIC Consultancy',''],
  ['Default Language','EN',''],
  ['Financial Year Start Month','January',''],
  ['Currency Symbol','KSh',''],
  ['Ledger Tab Name','Submissions',''],
  ['Attach PDF to Annual Report','Yes','']
];
var recipients = [
  ['Email Address','Name','Active (Yes/No)','Daily Report (Yes/No)','Weekly Report (Yes/No)','Monthly Report (Yes/No)','Quarterly Report (Yes/No)','Annual Report (Yes/No)'],
  ['a@x.com','A','Yes','Yes','Yes','Yes','Yes','Yes'],
  ['b@x.com','B','Yes','No','Yes','Yes','Yes','Yes'],
  ['c@x.com','C','No','Yes','Yes','Yes','Yes','Yes']
];
var coa = [['Account','Sub-type','Notes'],['Cash','Cash',''],['Inventory','Inventory',''],['Accounts Payable','Current Liability','']];
var statutory = [['Item','Rate (%)','Base','Show (Yes/No)'],['Corporate Tax',30,'Net Profit','Yes'],['VAT',16,'Revenue','No']];

var sheets = {
  Submissions: mkSheet('Submissions', ledger), Settings: mkSheet('Settings', settings),
  Recipients: mkSheet('Recipients', recipients), Chart_of_Accounts: mkSheet('Chart_of_Accounts', coa),
  Statutory: mkSheet('Statutory', statutory)
};
var ss = {
  getSheetByName: function (n) { return sheets[n] || null; },
  insertSheet: function (n) { sheets[n] = mkSheet(n, []); return sheets[n]; },
  getSheets: function () { return Object.keys(sheets).map(function (k) { return sheets[k]; }); },
  getId: function () { return 'ssid'; }
};

var docParas = [], docTables = [];
var ctx = {
  SpreadsheetApp: {
    getActiveSpreadsheet: function () { return ss; },
    getActive: function () { return { toast: function () {} }; },
    newDataValidation: function () { var b = { requireValueInList: function () { return b; }, setAllowInvalid: function () { return b; }, build: function () { return {}; } }; return b; },
    getUi: function () { throw new Error('no ui'); }
  },
  Session: { getScriptTimeZone: function () { return 'UTC'; }, getActiveUser: function () { return { getEmail: function () { return 'me@x.com'; } }; } },
  Utilities: { formatDate: function (d, tz, f) { return d.toISOString().slice(0, 10) + '[' + f + ']'; }, sleep: function () {} },
  Logger: { log: function (s) { logs.push(String(s)); } },
  MailApp: { getRemainingDailyQuota: function () { return 50; } },
  GmailApp: { sendEmail: function (to, subj, body, opts) { sent.push({ to: to, subject: subj, opts: opts }); } },
  MimeType: { PDF: 'application/pdf' },
  DocumentApp: {
    ParagraphHeading: { TITLE: 'T', HEADING1: 'H1', HEADING2: 'H2' },
    create: function (title) {
      var body = {
        appendParagraph: function (t) { docParas.push(t); var p = { setHeading: function () { return p; }, appendText: function () { return { setItalic: function () {} }; } }; return p; },
        appendHorizontalRule: function () {},
        appendTable: function (d) { docTables.push(d); return { getRow: function () { return { getCell: function () { return { editAsText: function () { return { setBold: function () {} }; } }; } }; } }; }
      };
      return { getBody: function () { return body; }, saveAndClose: function () {}, getId: function () { return 'docid'; } };
    }
  },
  DriveApp: { getFileById: function () { return { getAs: function () { return { setName: function (n) { this._n = n; }, getName: function () { return this._n; } }; }, setTrashed: function () {} }; } },
  ScriptApp: { WeekDay: {} },
  Date: Date, Math: Math, String: String, Number: Number, Object: Object, Array: Array, parseInt: parseInt, parseFloat: parseFloat, isNaN: isNaN, Error: Error, console: console
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(process.argv[2], 'utf8'), ctx);

var fails = 0;
function check(name, cond, info) { if (cond) { console.log('PASS ' + name); } else { fails++; console.log('FAIL ' + name + (info ? ' — ' + info : '')); } }

// 1. ensureConfig batches: zero appendRow calls, one setValues on Settings for missing keys.
setValuesCalls.length = 0; appended.length = 0;
ctx.ensureConfig();
var settingsWrites = setValuesCalls.filter(function (c) { return c.sheet === 'Settings'; });
check('ensureConfig uses no appendRow', appended.length === 0, 'appendRow called ' + appended.length + 'x');
check('ensureConfig writes missing settings in ONE setValues', settingsWrites.length === 1 && settingsWrites[0].rows === 2, JSON.stringify(settingsWrites));

// 2. Fiscal quarter math.
var fq = ctx.fiscalQuarterOf_(new Date(2024, 4, 15), 3); // May, FY starts April -> Q1 FY2024
check('fiscalQuarterOf_ April-start FY', fq.q === 1 && fq.fyStartYear === 2024, JSON.stringify(fq));
fq = ctx.fiscalQuarterOf_(new Date(2024, 1, 15), 3); // Feb, FY starts April -> Q4 FY2023
check('fiscalQuarterOf_ wraps year', fq.q === 4 && fq.fyStartYear === 2023, JSON.stringify(fq));

// 3. Annual run end-to-end: BCC send, PDF attached, metrics correct.
sent.length = 0; logs.length = 0;
ctx.processPeriod_('Annual');
check('Annual sends exactly ONE email', sent.length === 1, sent.length + ' sends');
check('Annual To = first active recipient', sent[0] && sent[0].to === 'a@x.com');
check('Annual BCC = other active+opted recipients only', sent[0] && sent[0].opts.bcc === 'b@x.com', sent[0] && sent[0].opts.bcc);
check('Annual has PDF attachment', sent[0] && sent[0].opts.attachments && sent[0].opts.attachments.length === 1);
check('PDF doc got Statutory table', docTables.some(function (t) { return t[0][0] === 'Item' && t[0][3] === 'Amount'; }));
var html = sent[0].opts.htmlBody;
check('Net profit = 50000-18000-12000 = 20000', html.indexOf('KSh 20,000.00') !== -1);
check('Singular "Asset" normalised (assets=24000)', html.indexOf('KSh 24,000.00') !== -1);
check('Corporate tax 30% of 20000 = 6000 shown', html.indexOf('KSh 6,000.00') !== -1);
check('VAT Show=No excluded', html.indexOf('VAT') === -1);
check('Liquidity ratios unlocked via CoA', html.indexOf('Current Ratio') !== -1);
check('PDF note shown in email', html.indexOf('PDF copy') !== -1);
check('Timing logged', logs.some(function (l) { return /Time: [\d.]+s/.test(l); }));

// 4. Daily: ledger is historical so refNow anchors to 2024-10-10 (3 rows). c inactive, b opted out -> only a, no BCC.
sent.length = 0;
ctx.processPeriod_('Daily');
check('Daily anchors to latest ledger date and sends', sent.length === 1);
check('Daily To = a@x.com only, no BCC', sent[0] && sent[0].to === 'a@x.com' && !sent[0].opts.bcc, sent[0] && JSON.stringify(sent[0].opts.bcc));
check('Daily has no PDF', sent[0] && !sent[0].opts.attachments);
check('Daily rows = 3', logs.some(function (l) { return l.indexOf('[Daily] Sent to 1 recipient(s) via BCC. Rows: 3.') !== -1; }));

// 5. Cadence gates.
var realDate = ctx.Date;
function withDate(y, m, d, fn) {
  var F = function (a, b, c) { if (arguments.length === 0) { return new realDate(y, m, d); } return new realDate(a, b, c); };
  F.prototype = realDate.prototype; F.now = realDate.now; ctx.Date = F; try { fn(); } finally { ctx.Date = realDate; }
}
sent.length = 0; withDate(2025, 5, 1, function () { ctx.runAnnualReport(); });     // 1 June, FY Jan -> skip
check('Annual gate skips on 1 June', sent.length === 0);
sent.length = 0; logs.length = 0; withDate(2025, 0, 1, function () { ctx.runAnnualReport(); });     // 1 Jan -> gate passes -> sends
check('Annual gate passes on 1 Jan', sent.length === 1 && !logs.some(function (l) { return l.indexOf('skipped') !== -1; }));
logs.length = 0; sent.length = 0; withDate(2025, 1, 1, function () { ctx.runQuarterlyReport(); }); // 1 Feb -> skip
check('Quarterly gate skips on 1 Feb', logs.some(function (l) { return l.indexOf('skipped') !== -1; }));
logs.length = 0; withDate(2025, 3, 1, function () { ctx.runQuarterlyReport(); }); // 1 Apr -> Q2 start -> run
check('Quarterly gate passes on 1 Apr', !logs.some(function (l) { return l.indexOf('skipped') !== -1; }));

// 6. Utilities.
check('money_ negative in parentheses', ctx.money_(-1234.5, '€') === '(€ 1,234.50)', ctx.money_(-1234.5, '€'));
check('toNumber_ strips symbols', ctx.toNumber_('KSh 1,500.75') === 1500.75);
check('i18n_ DE', ctx.i18n_('DE').netIncome === 'Jahresüberschuss');
check('i18n_ unknown -> EN', ctx.i18n_('FR').report === 'Report');

// 7. Every function referenced by the menu / triggers exists.
['ensureConfig','setupOrAlignForm','seedDemoLedger','previewAnnualToMe','runDailyReport','runWeeklyReport',
 'runMonthlyReport','runQuarterlyReport','runAnnualReport','installTriggers','openGuide','rebuildGuideNotes','buildEntireSystem']
 .forEach(function (f) { check('menu fn exists: ' + f, typeof ctx[f] === 'function'); });

console.log(fails ? ('\n' + fails + ' FAILED') : '\nALL PASSED');
process.exit(fails ? 1 : 0);
