// ============================================================
// CODE.GS – Entry point
// ============================================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📊 Financial Statements')
    .addItem('🛠  Setup: Create Data-Entry Form',  'createFinancialForm')
    .addSeparator()
    // ── Type-any-period actions (prompt: sheet + period) ──
    .addItem('📊 Generate All Statements…',         'generateAllPrompt')
    .addItem('     P&L Statement…',                 'generatePLPrompt')
    .addItem('     Balance Sheet…',                 'generateBSPrompt')
    .addItem('     Cash Flow Statement…',           'generateCFPrompt')
    .addItem('📈 Health Ratios…',                   'generateRatiosPrompt')
    .addSeparator()
    // ── Quick-access shortcuts (auto-detect sheet) ────────
    .addSubMenu(
      ui.createMenu('⚡ Quick – This Month')
        .addItem('All Statements',   'generateAllThisMonth')
        .addItem('P&L Only',         'generatePLThisMonth')
        .addItem('Balance Sheet',    'generateBSThisMonth')
        .addItem('Cash Flow',        'generateCFThisMonth')
        .addItem('Health Ratios',    'generateRatiosThisMonth')
    )
    .addSubMenu(
      ui.createMenu('⚡ Quick – This Quarter')
        .addItem('All Statements',   'generateAllThisQuarter')
        .addItem('P&L Only',         'generatePLThisQuarter')
        .addItem('Balance Sheet',    'generateBSThisQuarter')
        .addItem('Cash Flow',        'generateCFThisQuarter')
        .addItem('Health Ratios',    'generateRatiosThisQuarter')
    )
    .addSubMenu(
      ui.createMenu('⚡ Quick – This Year')
        .addItem('All Statements',   'generateAllThisYear')
        .addItem('P&L Only',         'generatePLThisYear')
        .addItem('Balance Sheet',    'generateBSThisYear')
        .addItem('Cash Flow',        'generateCFThisYear')
        .addItem('Health Ratios',    'generateRatiosThisYear')
    )
    .addSeparator()
    .addSubMenu(
      ui.createMenu('💰 Budget')
        .addItem('Create Budget Template (fill in targets)', 'createBudgetTemplate')
        .addItem('Generate Budget vs Actual Report',         'generateBudgetVsActual')
    )
    .addSeparator()
    .addItem('📋 View Chart of Accounts', 'showChartOfAccounts')
    .addItem('ℹ️  Help & Instructions',   'showHelp')
    .addToUi();
}

// ── Type-any-period actions ────────────────────────────────────
// Each shows: (1) sheet picker if needed, (2) free-text period input.

function generateAllPrompt() {
  const r = promptPeriodAndSheet();
  if (r) _generateAll(r);
}
function generatePLPrompt() {
  const r = promptPeriodAndSheet();
  if (r) generatePL(r);
}
function generateBSPrompt() {
  const r = promptPeriodAndSheet();
  if (r) generateBS(r, null);
}
function generateCFPrompt() {
  const r = promptPeriodAndSheet();
  if (r) generateCF(r, null);
}
function generateRatiosPrompt() {
  const r = promptPeriodAndSheet();
  if (r) generateRatios(r);
}

// ── Quick shortcuts (auto-detect sheet) ───────────────────────

function generateAllThisMonth()      { _generateAll(_quick(currentMonthRange())); }
function generateAllThisQuarter()    { _generateAll(_quick(currentQuarterRange())); }
function generateAllThisYear()       { _generateAll(_quick(currentYearRange())); }

function generatePLThisMonth()       { generatePL(_quick(currentMonthRange())); }
function generatePLThisQuarter()     { generatePL(_quick(currentQuarterRange())); }
function generatePLThisYear()        { generatePL(_quick(currentYearRange())); }

function generateBSThisMonth()       { generateBS(_quick(currentMonthRange()), null); }
function generateBSThisQuarter()     { generateBS(_quick(currentQuarterRange()), null); }
function generateBSThisYear()        { generateBS(_quick(currentYearRange()), null); }

function generateCFThisMonth()       { generateCF(_quick(currentMonthRange()), null); }
function generateCFThisQuarter()     { generateCF(_quick(currentQuarterRange()), null); }
function generateCFThisYear()        { generateCF(_quick(currentYearRange()), null); }

function generateRatiosThisMonth()   { generateRatios(_quick(currentMonthRange())); }
function generateRatiosThisQuarter() { generateRatios(_quick(currentQuarterRange())); }
function generateRatiosThisYear()    { generateRatios(_quick(currentYearRange())); }

// Asks for the sheet name then attaches it to the range object.
function _quick(range) {
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  const ui   = SpreadsheetApp.getUi();
  const name = pickDataSheet(ui, ss);
  if (!name) return null;
  return Object.assign({}, range, { sheetName: name });
}

// ── Core orchestrator ──────────────────────────────────────────

function _generateAll(range) {
  if (!range) return;
  const netIncome = generatePL(range);
  generateBS(range, netIncome);
  generateCF(range, netIncome);
  generateRatios(range);
  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName('P&L')
  );
  SpreadsheetApp.getUi().alert(
    '✅ Done!\n\n' +
    'Period:  ' + formatDate(range.startDate) + ' – ' + formatDate(range.endDate) + '\n' +
    'Source:  ' + (range.sheetName || 'Form Responses') + '\n\n' +
    'Tabs updated:  P&L  |  Balance Sheet  |  Cash Flow  |  Financial Ratios'
  );
}

// ── Chart of Accounts viewer ───────────────────────────────────

function showChartOfAccounts() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet(ss, 'Chart of Accounts');
  sheet.setColumnWidth(1, 80);
  sheet.setColumnWidth(2, 200);
  sheet.setColumnWidth(3, 220);
  sheet.setColumnWidth(4, 180);

  let r = 1;
  sheet.getRange(r, 1, 1, 4)
    .setValues([['Code', 'Account Name', 'Category', 'Statement']])
    .setBackground('#16213e').setFontColor('#ffffff').setFontWeight('bold');
  r++;

  const sectionColors = {
    Revenue: '#d4edda', COGS: '#fde8d8', Expenses: '#dce4f5',
    OtherIncome: '#f5e6ff', OtherExpense: '#ffe0e0',
    Assets: '#dbeafe', Liabilities: '#fde8e8', Equity: '#d1fae5'
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

// ── Help dialog ────────────────────────────────────────────────

function showHelp() {
  const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial, sans-serif; font-size: 13px; padding: 16px; line-height: 1.6; }
      h2   { color: #16213e; }
      h3   { color: #1a1a5e; margin-top: 18px; }
      li   { margin: 5px 0; }
      code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-size: 12px; }
      table { border-collapse: collapse; width: 100%; margin-top: 8px; }
      td, th { border: 1px solid #ddd; padding: 5px 8px; font-size: 12px; }
      th { background: #16213e; color: #fff; }
    </style>
    <h2>📊 Financial Statements – Help</h2>

    <h3>How to Generate Statements</h3>
    <p>Click <b>Generate All Statements…</b> — you will be asked:</p>
    <ol>
      <li>Which data sheet to use (auto-skipped if only one exists).</li>
      <li>What period you want — type it in plain language:</li>
    </ol>
    <table>
      <tr><th>What you type</th><th>What it means</th></tr>
      <tr><td><code>Q1 2025</code></td><td>1 Jan – 31 Mar 2025</td></tr>
      <tr><td><code>Q3</code></td><td>Q3 of the current year</td></tr>
      <tr><td><code>H1 2024</code></td><td>1 Jan – 30 Jun 2024</td></tr>
      <tr><td><code>January 2025</code></td><td>1 Jan – 31 Jan 2025</td></tr>
      <tr><td><code>March</code></td><td>March of the current year</td></tr>
      <tr><td><code>2024</code></td><td>Full calendar year 2024</td></tr>
      <tr><td><code>last month</code></td><td>Previous calendar month</td></tr>
      <tr><td><code>last quarter</code></td><td>Previous calendar quarter</td></tr>
      <tr><td><code>last year</code></td><td>Previous calendar year</td></tr>
      <tr><td><code>Jan to Mar 2025</code></td><td>1 Jan – 31 Mar 2025</td></tr>
      <tr><td><code>January 2024 to June 2024</code></td><td>1 Jan – 30 Jun 2024</td></tr>
      <tr><td><code>Q1 to Q3 2024</code></td><td>1 Jan – 30 Sep 2024</td></tr>
      <tr><td><code>2025-01-01 to 2025-06-30</code></td><td>Exact dates</td></tr>
    </table>

    <h3>Quick Shortcuts</h3>
    <p>Use the <b>⚡ Quick</b> submenus to jump straight to this month, quarter, or year
    without typing anything.</p>

    <h3>Entering Transactions</h3>
    <ul>
      <li><b>Transaction Date</b> – the actual date (not today).</li>
      <li><b>Account Type</b> – the broad category (Revenue, COGS, Operating Expense…).</li>
      <li><b>Amount</b> – positive number only, no £ or $.</li>
      <li><b>Direction</b> – Income/Asset Increase = money in; Expense/Asset Decrease = money out.</li>
      <li><b>Cash Flow Category</b> – Operating / Investing / Financing / Non-cash.</li>
    </ul>

    <h3>Tips</h3>
    <ul>
      <li>Run <b>All Three Statements</b> together so the Balance Sheet and Cash Flow link to the P&amp;L net income.</li>
      <li>Customise accounts in <code>ChartOfAccounts.gs</code>, then re-run Setup to regenerate the form.</li>
      <li>Duplicate statement tabs before re-running to keep historical copies.</li>
    </ul>
  `).setWidth(600).setHeight(560);
  SpreadsheetApp.getUi().showModalDialog(html, 'Help & Instructions');
}
