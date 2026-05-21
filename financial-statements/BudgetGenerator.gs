// ============================================================
// BUDGET GENERATOR
// Two functions:
//   createBudgetTemplate() — builds a pre-filled input sheet
//   generateBudgetVsActual() — compares budget to actuals
// ============================================================

// ── STEP 1: Create the budget template ────────────────────────

function createBudgetTemplate() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Ask which year this budget is for
  const yearResp = ui.prompt(
    '📅  Budget Year',
    'Enter the year this budget covers (e.g. 2025):',
    ui.ButtonSet.OK_CANCEL
  );
  if (yearResp.getSelectedButton() !== ui.Button.OK) return;

  const year = yearResp.getResponseText().trim();
  if (!/^\d{4}$/.test(year)) {
    ui.alert('Please enter a 4-digit year like 2025.');
    return;
  }

  const sheetName = 'Budget ' + year;

  // Warn if sheet already exists
  if (ss.getSheetByName(sheetName)) {
    const confirm = ui.alert(
      '"' + sheetName + '" already exists.',
      'Overwrite it with a fresh template?',
      ui.ButtonSet.YES_NO
    );
    if (confirm !== ui.Button.YES) return;
  }

  const sheet = getOrCreateSheet(ss, sheetName);

  // ── Column widths ────────────────────────────────────────
  sheet.setColumnWidth(1, 220);  // Account Type
  sheet.setColumnWidth(2, 220);  // Account Name
  sheet.setColumnWidth(3, 140);  // Annual Budget
  sheet.setColumnWidth(4, 260);  // Notes

  // ── Title ────────────────────────────────────────────────
  let r = 1;
  sheet.getRange(r, 1, 1, 4).merge()
    .setValue('ANNUAL BUDGET — ' + year)
    .setBackground('#16213e').setFontColor('#e2b96f')
    .setFontWeight('bold').setFontSize(14).setHorizontalAlignment('center');
  r++;
  sheet.getRange(r, 1, 1, 4).merge()
    .setValue('Fill in the "Annual Budget" column. Leave blank or enter 0 for accounts not budgeted.')
    .setBackground('#16213e').setFontColor('#aaaaaa')
    .setFontSize(9).setHorizontalAlignment('center');
  r++; r++;

  // ── Column headers ───────────────────────────────────────
  sheet.getRange(r, 1, 1, 4)
    .setValues([['Account Type', 'Account Name', 'Annual Budget', 'Notes']])
    .setBackground('#0d3b4f').setFontColor('#ffffff').setFontWeight('bold').setFontSize(10);
  sheet.setFrozenRows(r);
  r++;

  // ── Account rows grouped by P&L category ─────────────────
  const PL_ORDER  = ['REVENUE', 'COGS', 'OPEX', 'OTHER_INCOME', 'OTHER_EXPENSE'];
  const BS_ORDER  = ['CURRENT_ASSETS','FIXED_ASSETS','LONG_TERM_ASSETS',
                     'CURRENT_LIABILITIES','LONG_TERM_LIABILITIES','EQUITY'];

  const categoryBg = {
    REVENUE:              '#d4edda', COGS:                '#fde8d8',
    OPEX:                 '#dce4f5', OTHER_INCOME:         '#f5e6ff',
    OTHER_EXPENSE:        '#ffe0e0', CURRENT_ASSETS:       '#dbeafe',
    FIXED_ASSETS:         '#dbeafe', LONG_TERM_ASSETS:     '#dbeafe',
    CURRENT_LIABILITIES:  '#fde8e8', LONG_TERM_LIABILITIES:'#fde8e8',
    EQUITY:               '#d1fae5'
  };

  const sectionHeaders = {
    REVENUE: 'INCOME STATEMENT ACCOUNTS',
    CURRENT_ASSETS: 'BALANCE SHEET ACCOUNTS (optional — for capital budgeting)'
  };

  function writeSection(keys) {
    keys.forEach(key => {
      const cat = COA[key];
      const bg  = categoryBg[key] || '#f9f9f9';

      // Print a divider before the first item of a new top-level section
      if (sectionHeaders[key]) {
        sheet.getRange(r, 1, 1, 4).merge()
          .setValue(sectionHeaders[key])
          .setBackground('#2d3748').setFontColor('#ffffff')
          .setFontWeight('bold').setFontSize(10);
        r++;
      }

      // Category sub-header
      sheet.getRange(r, 1, 1, 4).merge()
        .setValue(cat.label.toUpperCase())
        .setBackground(bg).setFontWeight('bold').setFontSize(10)
        .setFontColor('#333333');
      r++;

      // One row per account name
      cat.names.forEach(name => {
        sheet.getRange(r, 1).setValue(cat.label).setBackground(bg).setFontColor('#555555').setFontSize(9);
        sheet.getRange(r, 2).setValue(name).setBackground(bg).setFontSize(10);
        sheet.getRange(r, 3).setValue(0).setBackground('#fffde7')
          .setNumberFormat('#,##0.00').setFontSize(10).setHorizontalAlignment('right');
        sheet.getRange(r, 4).setValue('').setBackground('#fafafa');
        r++;
      });

      // Subtotal row (formula)
      const dataStart = r - cat.names.length;
      const subtotalFormula = '=SUM(C' + dataStart + ':C' + (r - 1) + ')';
      sheet.getRange(r, 1, 1, 2).merge()
        .setValue('Total ' + cat.label)
        .setBackground(bg).setFontWeight('bold').setFontSize(10);
      sheet.getRange(r, 3)
        .setFormula(subtotalFormula)
        .setBackground(bg).setFontWeight('bold')
        .setNumberFormat('#,##0.00').setHorizontalAlignment('right');
      r++; r++;
    });
  }

  writeSection(PL_ORDER);
  writeSection(BS_ORDER);

  // ── Net Income Budget summary ─────────────────────────────
  // Find the Total Revenue, Total COGS, Total OPEX rows by searching
  // This is approximate — we just use SUM of revenue minus expenses
  sheet.getRange(r, 1, 1, 4).merge()
    .setValue('BUDGETED NET INCOME SUMMARY')
    .setBackground('#16213e').setFontColor('#e2b96f')
    .setFontWeight('bold').setFontSize(11);
  r++;
  sheet.getRange(r, 2).setValue('Total Budgeted Revenue')
    .setFontColor('#555555').setFontSize(10);
  sheet.getRange(r, 3).setValue('→ see Revenue subtotal above')
    .setFontColor('#999999').setFontStyle('italic').setFontSize(9);
  r++;
  sheet.getRange(r, 2).setValue('Total Budgeted Expenses')
    .setFontColor('#555555').setFontSize(10);
  sheet.getRange(r, 3).setValue('→ see COGS + OpEx subtotals above')
    .setFontColor('#999999').setFontStyle('italic').setFontSize(9);
  r++;

  ss.setActiveSheet(sheet);
  ui.alert(
    '✅ Budget template created: "' + sheetName + '"\n\n' +
    'Fill in the yellow Annual Budget cells.\n' +
    'Leave any account at 0 if you are not budgeting for it.\n\n' +
    'When ready, use:\n' +
    '📊 Financial Statements → Budget → Generate Budget vs Actual'
  );
}

// ── STEP 2: Budget vs Actual report ───────────────────────────

function generateBudgetVsActual() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ── Ask for budget sheet ────────────────────────────────
  const allSheets = ss.getSheets().map(s => s.getName());
  const budgetResp = ui.prompt(
    '📋  Budget Sheet Name',
    'Available sheets:\n\n' +
    allSheets.map((n, i) => '  ' + (i + 1) + '.  ' + n).join('\n') +
    '\n\nType the name of your BUDGET sheet (e.g. "Budget 2025"):',
    ui.ButtonSet.OK_CANCEL
  );
  if (budgetResp.getSelectedButton() !== ui.Button.OK) return;
  const budgetSheetName = budgetResp.getResponseText().trim();
  if (!allSheets.includes(budgetSheetName)) {
    ui.alert('"' + budgetSheetName + '" not found. Check the spelling.');
    return;
  }

  // ── Ask for actuals sheet + period ──────────────────────
  const r = promptPeriodAndSheet();
  if (!r) return;

  // ── Read budget figures ─────────────────────────────────
  const budget = readBudgetSheet(ss.getSheetByName(budgetSheetName));

  // ── Read actual transactions ────────────────────────────
  const rows = getRowsInRange(r.startDate, r.endDate, r.sheetName);

  // ── Render comparison ───────────────────────────────────
  renderBudgetVsActual(ss, budget, rows, r);
}

// ── Budget sheet reader ────────────────────────────────────────

// Reads the budget sheet and returns a map: { accountName → budgetAmount }
function readBudgetSheet(sheet) {
  const data   = sheet.getDataRange().getValues();
  const budget = {};
  for (let i = 1; i < data.length; i++) {
    const accountName = String(data[i][1]).trim();   // column B
    const amount      = parseFloat(data[i][2]) || 0; // column C
    if (accountName && accountName !== '' && !accountName.startsWith('Total')) {
      budget[accountName] = amount;
    }
  }
  return budget;
}

// ── Report renderer ────────────────────────────────────────────

function renderBudgetVsActual(ss, budget, actualRows, range) {
  const sheet  = getOrCreateSheet(ss, 'Budget vs Actual');
  const period = formatDate(range.startDate) + ' – ' + formatDate(range.endDate);

  // Column widths
  sheet.setColumnWidth(1, 240);  // Account name
  sheet.setColumnWidth(2, 130);  // Budget
  sheet.setColumnWidth(3, 130);  // Actual
  sheet.setColumnWidth(4, 130);  // Variance £
  sheet.setColumnWidth(5, 110);  // Variance %
  sheet.setColumnWidth(6, 120);  // Status

  let r = 1;

  // Title
  sheet.getRange(r, 1, 1, 6).merge()
    .setValue('BUDGET vs ACTUAL')
    .setBackground('#16213e').setFontColor('#e2b96f')
    .setFontWeight('bold').setFontSize(14).setHorizontalAlignment('center');
  r++;
  sheet.getRange(r, 1, 1, 6).merge()
    .setValue('Period: ' + period + '   |   Source: ' + range.sheetName)
    .setBackground('#16213e').setFontColor('#aaaaaa')
    .setFontSize(9).setHorizontalAlignment('center');
  r++; r++;

  // Column headers
  sheet.getRange(r, 1, 1, 6)
    .setValues([['Account', 'Annual Budget', 'Actual (Period)', 'Variance', 'Variance %', 'Status']])
    .setBackground('#0d3b4f').setFontColor('#ffffff').setFontWeight('bold').setFontSize(10);
  sheet.setFrozenRows(r);
  r++;

  // Helper: sum actuals for a category
  function actualForCategory(categoryKey) {
    return groupByAccount(actualRows, categoryKey);
  }

  // Helper: write one account row
  function writeAccountRow(accountName, budgetAmt, actualAmt, isRevenue, bg) {
    // For revenue: positive variance = good (actual > budget)
    // For expenses: positive variance = bad (actual > budget = overspend)
    const variance    = actualAmt - budgetAmt;
    const variancePct = budgetAmt !== 0 ? (variance / Math.abs(budgetAmt)) * 100 : null;
    const isOver      = isRevenue ? variance < 0 : variance > 0;
    const isNeutral   = Math.abs(variance) < 0.01;

    const statusLabel = isNeutral   ? '✓  On target'
                      : isOver      ? '✗  ' + (isRevenue ? 'Under' : 'Over')
                      :               '↑  ' + (isRevenue ? 'Above' : 'Under');
    const statusBg    = isNeutral   ? '#1e4d2b'
                      : isOver      ? '#7b2d2d'
                      :               '#1a4d3a';

    sheet.getRange(r, 1).setValue('    ' + accountName).setBackground(bg).setFontSize(10);
    sheet.getRange(r, 2).setValue(budgetAmt).setBackground(bg)
      .setNumberFormat('#,##0.00').setHorizontalAlignment('right');
    sheet.getRange(r, 3).setValue(actualAmt).setBackground(bg)
      .setNumberFormat('#,##0.00').setHorizontalAlignment('right')
      .setFontColor(actualAmt < 0 ? '#c0392b' : 'black');
    sheet.getRange(r, 4).setValue(variance).setBackground(bg)
      .setNumberFormat('#,##0.00').setHorizontalAlignment('right')
      .setFontColor(isOver ? '#c0392b' : '#1e7e34');
    sheet.getRange(r, 5)
      .setValue(variancePct !== null ? variancePct / 100 : '')
      .setBackground(bg).setNumberFormat('0.0%').setHorizontalAlignment('right')
      .setFontColor(isOver ? '#c0392b' : '#1e7e34');
    sheet.getRange(r, 6).setValue(statusLabel)
      .setBackground(statusBg).setFontColor('#ffffff')
      .setFontWeight('bold').setFontSize(9).setHorizontalAlignment('center');
    r++;

    return { budget: budgetAmt, actual: actualAmt, variance };
  }

  // Helper: write a category section
  function writeCategory(categoryKey, label, headerColor, subtotalColor, isRevenue) {
    sheet.getRange(r, 1, 1, 6).merge()
      .setValue(label)
      .setBackground(headerColor).setFontColor('#ffffff')
      .setFontWeight('bold').setFontSize(10);
    r++;

    const actualItems = actualForCategory(categoryKey);
    const actualMap   = {};
    actualItems.forEach(item => { actualMap[item.name] = item.total; });

    // Union of budget + actual account names
    const budgetAccounts  = (COA[categoryKey] ? COA[categoryKey].names : []);
    const actualAccounts  = actualItems.map(i => i.name);
    const allAccounts     = [...new Set([...budgetAccounts, ...actualAccounts])];

    let totalBudget = 0, totalActual = 0;
    const bg = ['#f8f9fa', '#ffffff'];

    allAccounts.forEach((name, i) => {
      const b = budget[name] || 0;
      const a = actualMap[name] || 0;
      if (b === 0 && a === 0) return; // skip empty rows
      const res = writeAccountRow(name, b, a, isRevenue, bg[i % 2]);
      totalBudget += res.budget;
      totalActual += res.actual;
    });

    // Subtotal row
    const totalVariance    = totalActual - totalBudget;
    const totalVariancePct = totalBudget !== 0 ? (totalVariance / Math.abs(totalBudget)) * 100 : null;
    sheet.getRange(r, 1).setValue('Total ' + label).setBackground(subtotalColor).setFontWeight('bold');
    sheet.getRange(r, 2).setValue(totalBudget).setBackground(subtotalColor)
      .setNumberFormat('#,##0.00').setFontWeight('bold').setHorizontalAlignment('right');
    sheet.getRange(r, 3).setValue(totalActual).setBackground(subtotalColor)
      .setNumberFormat('#,##0.00').setFontWeight('bold').setHorizontalAlignment('right');
    sheet.getRange(r, 4).setValue(totalVariance).setBackground(subtotalColor)
      .setNumberFormat('#,##0.00').setFontWeight('bold').setHorizontalAlignment('right')
      .setFontColor(isRevenue ? (totalVariance < 0 ? '#c0392b' : '#1e7e34')
                              : (totalVariance > 0 ? '#c0392b' : '#1e7e34'));
    sheet.getRange(r, 5)
      .setValue(totalVariancePct !== null ? totalVariancePct / 100 : '')
      .setBackground(subtotalColor).setNumberFormat('0.0%')
      .setFontWeight('bold').setHorizontalAlignment('right');
    sheet.getRange(r, 6).setValue('').setBackground(subtotalColor);
    r++; r++;

    return { budget: totalBudget, actual: totalActual };
  }

  // ── Render each P&L category ──────────────────────────────
  const rev  = writeCategory('REVENUE',       'REVENUE',            '#1e4d2b', '#d4edda', true);
  const cogs = writeCategory('COGS',          'COST OF GOODS SOLD', '#5a2d0c', '#fde8d8', false);

  // Gross Profit summary row
  const gpBudget = rev.budget - cogs.budget;
  const gpActual = rev.actual - cogs.actual;
  writeSummaryRow(sheet, r, 'GROSS PROFIT', gpBudget, gpActual, '#fff3cd', true); r++; r++;

  const opex = writeCategory('OPEX',         'OPERATING EXPENSES', '#1a1a5e', '#dce4f5', false);

  // Net Operating Income
  const noiBudget = gpBudget - opex.budget;
  const noiActual = gpActual - opex.actual;
  writeSummaryRow(sheet, r, 'NET OPERATING INCOME', noiBudget, noiActual, '#e8f4fd', true); r++; r++;

  const oi  = writeCategory('OTHER_INCOME',  'OTHER INCOME',       '#4a235a', '#f5e6ff', true);
  const oe  = writeCategory('OTHER_EXPENSE', 'OTHER EXPENSES',     '#5a1a00', '#ffe0e0', false);

  // Net Income
  const niBudget = noiBudget + oi.budget - oe.budget;
  const niActual = noiActual + oi.actual - oe.actual;
  r++;
  writeSummaryRow(sheet, r, 'NET INCOME', niBudget, niActual, null, true, true); r++;

  // ── Overall scorecard ─────────────────────────────────────
  r += 2;
  const niVariance    = niActual - niBudget;
  const niVariancePct = niBudget !== 0 ? ((niVariance / Math.abs(niBudget)) * 100).toFixed(1) : '—';
  const onTrack       = niVariance >= 0;
  sheet.getRange(r, 1, 1, 6).merge()
    .setValue(
      onTrack
        ? '✓  On track — Net Income ' + (niVariance >= 0 ? '+' : '') + fmtNum(niVariance) + ' vs budget (' + niVariancePct + '%)'
        : '✗  Behind — Net Income ' + fmtNum(niVariance) + ' vs budget (' + niVariancePct + '%)'
    )
    .setBackground(onTrack ? '#1e4d2b' : '#7b2d2d')
    .setFontColor('#ffffff').setFontWeight('bold').setFontSize(11)
    .setHorizontalAlignment('center');

  ss.setActiveSheet(sheet);
}

// ── Summary row helper ─────────────────────────────────────────

function writeSummaryRow(sheet, r, label, budgetAmt, actualAmt, bg, isRevenue, large) {
  const variance    = actualAmt - budgetAmt;
  const variancePct = budgetAmt !== 0 ? (variance / Math.abs(budgetAmt)) * 100 : null;
  const good        = isRevenue ? variance >= 0 : variance <= 0;
  const bgColor     = bg || (good ? '#d4edda' : '#fde8e8');
  const fontSize    = large ? 11 : 10;

  sheet.getRange(r, 1).setValue(label).setBackground(bgColor)
    .setFontWeight('bold').setFontSize(fontSize);
  sheet.getRange(r, 2).setValue(budgetAmt).setBackground(bgColor)
    .setNumberFormat('#,##0.00').setFontWeight('bold').setHorizontalAlignment('right').setFontSize(fontSize);
  sheet.getRange(r, 3).setValue(actualAmt).setBackground(bgColor)
    .setNumberFormat('#,##0.00').setFontWeight('bold').setHorizontalAlignment('right').setFontSize(fontSize)
    .setFontColor(actualAmt < 0 ? '#c0392b' : 'black');
  sheet.getRange(r, 4).setValue(variance).setBackground(bgColor)
    .setNumberFormat('#,##0.00').setFontWeight('bold').setHorizontalAlignment('right').setFontSize(fontSize)
    .setFontColor(good ? '#1e7e34' : '#c0392b');
  sheet.getRange(r, 5)
    .setValue(variancePct !== null ? variancePct / 100 : '')
    .setBackground(bgColor).setNumberFormat('0.0%')
    .setFontWeight('bold').setHorizontalAlignment('right').setFontSize(fontSize)
    .setFontColor(good ? '#1e7e34' : '#c0392b');
  sheet.getRange(r, 6).setValue('').setBackground(bgColor);
}
