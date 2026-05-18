// ============================================================
// CODE.GS – Entry point
// This is the first file Apps Script loads. It wires up the
// custom menu and all top-level menu actions.
// ============================================================

// Runs automatically every time the spreadsheet is opened.
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📊 Financial Statements')
    .addItem('🛠  Setup: Create Data-Entry Form', 'createFinancialForm')
    .addSeparator()
    .addSubMenu(
      SpreadsheetApp.getUi().createMenu('Generate – This Month')
        .addItem('All Three Statements', 'generateAllThisMonth')
        .addItem('P&L Only',             'generatePLThisMonth')
        .addItem('Balance Sheet Only',   'generateBSThisMonth')
        .addItem('Cash Flow Only',       'generateCFThisMonth')
    )
    .addSubMenu(
      SpreadsheetApp.getUi().createMenu('Generate – This Quarter')
        .addItem('All Three Statements', 'generateAllThisQuarter')
        .addItem('P&L Only',             'generatePLThisQuarter')
        .addItem('Balance Sheet Only',   'generateBSThisQuarter')
        .addItem('Cash Flow Only',       'generateCFThisQuarter')
    )
    .addSubMenu(
      SpreadsheetApp.getUi().createMenu('Generate – This Year')
        .addItem('All Three Statements', 'generateAllThisYear')
        .addItem('P&L Only',             'generatePLThisYear')
        .addItem('Balance Sheet Only',   'generateBSThisYear')
        .addItem('Cash Flow Only',       'generateCFThisYear')
    )
    .addSubMenu(
      SpreadsheetApp.getUi().createMenu('Generate – Custom Date Range')
        .addItem('All Three Statements', 'generateAllCustom')
        .addItem('P&L Only',             'generatePLCustom')
        .addItem('Balance Sheet Only',   'generateBSCustom')
        .addItem('Cash Flow Only',       'generateCFCustom')
    )
    .addSubMenu(
      SpreadsheetApp.getUi().createMenu('Health Ratios')
        .addItem('This Month',        'generateRatiosThisMonth')
        .addItem('This Quarter',      'generateRatiosThisQuarter')
        .addItem('This Year',         'generateRatiosThisYear')
        .addItem('Custom Date Range', 'generateRatiosCustom')
    )
    .addSeparator()
    .addItem('📋 View Chart of Accounts', 'showChartOfAccounts')
    .addItem('ℹ️  Help & Instructions',   'showHelp')
    .addToUi();
}

// ── "All Three" helpers ──────────────────────────────────────

function generateAllThisMonth()    { _generateAll(currentMonthRange()); }
function generateAllThisQuarter()  { _generateAll(currentQuarterRange()); }
function generateAllThisYear()     { _generateAll(currentYearRange()); }
function generateAllCustom() {
  const range = promptDateRange();
  if (range) _generateAll(range);
}

function _generateAll(range) {
  const netIncome = generatePL(range);
  generateBS(range, netIncome);
  generateCF(range, netIncome);
  generateRatios(range);
  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName('P&L')
  );
  SpreadsheetApp.getUi().alert(
    '✅ All statements generated!\n\n' +
    'Check tabs: P&L | Balance Sheet | Cash Flow | Financial Ratios'
  );
}

// ── P&L shortcuts ────────────────────────────────────────────

function generatePLThisMonth()   { generatePL(currentMonthRange()); }
function generatePLThisQuarter() { generatePL(currentQuarterRange()); }
function generatePLThisYear()    { generatePL(currentYearRange()); }
function generatePLCustom() {
  const range = promptDateRange();
  if (range) generatePL(range);
}

// ── Balance Sheet shortcuts ──────────────────────────────────

function generateBSThisMonth()   { generateBS(currentMonthRange(), null); }
function generateBSThisQuarter() { generateBS(currentQuarterRange(), null); }
function generateBSThisYear()    { generateBS(currentYearRange(), null); }
function generateBSCustom() {
  const range = promptDateRange();
  if (range) generateBS(range, null);
}

// ── Ratios shortcuts ─────────────────────────────────────────

function generateRatiosThisMonth()   { generateRatios(currentMonthRange()); }
function generateRatiosThisQuarter() { generateRatios(currentQuarterRange()); }
function generateRatiosThisYear()    { generateRatios(currentYearRange()); }
function generateRatiosCustom() {
  const range = promptDateRange();
  if (range) generateRatios(range);
}

// ── Cash Flow shortcuts ──────────────────────────────────────

function generateCFThisMonth()   { generateCF(currentMonthRange(), null); }
function generateCFThisQuarter() { generateCF(currentQuarterRange(), null); }
function generateCFThisYear()    { generateCF(currentYearRange(), null); }
function generateCFCustom() {
  const range = promptDateRange();
  if (range) generateCF(range, null);
}

// ── Chart of Accounts viewer ─────────────────────────────────

function showChartOfAccounts() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet(ss, 'Chart of Accounts');
  sheet.setColumnWidth(1, 80);
  sheet.setColumnWidth(2, 200);
  sheet.setColumnWidth(3, 220);
  sheet.setColumnWidth(4, 180);

  let r = 1;
  sheet.getRange(r, 1, 1, 4).setValues([['Code', 'Account Name', 'Category', 'Statement']])
    .setBackground('#16213e').setFontColor('#ffffff').setFontWeight('bold');
  r++;

  const sectionColors = {
    'Revenue': '#d4edda', 'COGS': '#fde8d8', 'Expenses': '#dce4f5',
    'OtherIncome': '#f5e6ff', 'OtherExpense': '#ffe0e0',
    'Assets': '#dbeafe', 'Liabilities': '#fde8e8', 'Equity': '#d1fae5'
  };

  Object.keys(COA).forEach(key => {
    const cat = COA[key];
    const bg  = sectionColors[cat.group] || '#ffffff';
    cat.codes.forEach((code, i) => {
      const stmt = cat.section === 'PL' ? 'Income Statement (P&L)' : 'Balance Sheet';
      sheet.getRange(r, 1, 1, 4)
        .setValues([[code, cat.names[i] || '', cat.label, stmt]])
        .setBackground(bg);
      r++;
    });
  });

  sheet.setFrozenRows(1);
  ss.setActiveSheet(sheet);
}

// ── Help dialog ──────────────────────────────────────────────

function showHelp() {
  const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial, sans-serif; font-size: 13px; padding: 16px; }
      h2   { color: #16213e; }
      h3   { color: #1a1a5e; margin-top: 18px; }
      li   { margin: 6px 0; }
      code { background: #f0f0f0; padding: 2px 5px; border-radius: 3px; }
    </style>
    <h2>📊 Financial Statements – Help</h2>

    <h3>Getting Started</h3>
    <ol>
      <li>Click <b>Financial Statements → Setup: Create Data-Entry Form</b>.</li>
      <li>Share the generated Google Form URL with anyone who needs to enter transactions.</li>
      <li>All responses appear automatically in the <b>Form Responses 1</b> tab.</li>
    </ol>

    <h3>Entering Transactions</h3>
    <ul>
      <li><b>Transaction Date</b> – the actual date of the transaction (not today's date).</li>
      <li><b>Account Type</b> – pick the broad category (Revenue, COGS, Operating Expense, etc.).</li>
      <li><b>Account Name</b> – the specific account from the Chart of Accounts.</li>
      <li><b>Amount</b> – positive number, no currency symbol.</li>
      <li><b>Direction</b> – Income/Asset Increase for money coming in; Expense/Asset Decrease for money going out.</li>
      <li><b>Cash Flow Category</b> – tag the transaction for the Cash Flow Statement.</li>
    </ul>

    <h3>Generating Statements</h3>
    <ul>
      <li>Use the <b>Generate</b> submenus to pick a period (month / quarter / year / custom).</li>
      <li><b>All Three Statements</b> generates P&L, Balance Sheet, and Cash Flow at once.</li>
      <li>Each statement opens in its own sheet tab and is refreshed every time.</li>
    </ul>

    <h3>Financial Statement Logic</h3>
    <ul>
      <li><b>P&L</b>: Revenue − COGS = Gross Profit − OpEx = Net Operating Income ± Other = Net Income.</li>
      <li><b>Balance Sheet</b>: Assets = Liabilities + Equity. Uses ALL data up to the end date.</li>
      <li><b>Cash Flow</b>: Groups transactions by the Cash Flow Category you tagged on entry.</li>
    </ul>

    <h3>Tips</h3>
    <ul>
      <li>Add custom accounts by editing <code>ChartOfAccounts.gs</code>.</li>
      <li>The Balance Sheet "Beginning Cash Balance" cell must be filled in manually.</li>
      <li>Negative numbers on the Balance Sheet usually mean an opening balance is missing.</li>
    </ul>
  `).setWidth(560).setHeight(520);
  SpreadsheetApp.getUi().showModalDialog(html, 'Help & Instructions');
}
