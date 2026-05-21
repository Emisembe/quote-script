// ============================================================
// STATEMENT GENERATOR
// Produces P&L, Balance Sheet, and Cash Flow Statement sheets.
// ============================================================

// ── PROFIT & LOSS ────────────────────────────────────────────

function generatePL(range) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet(ss, 'P&L');
  const rows  = getRowsInRange(range.startDate, range.endDate, range.sheetName);
  const period = formatDate(range.startDate) + ' – ' + formatDate(range.endDate);

  sheet.setColumnWidth(1, 320);
  sheet.setColumnWidth(2, 20);
  sheet.setColumnWidth(3, 160);

  let r = 1;

  // Title
  sheet.getRange(r, 1, 1, 3).merge().setValue('PROFIT & LOSS STATEMENT')
    .setBackground('#16213e').setFontColor('#e2b96f').setFontWeight('bold').setFontSize(14);
  r++;
  sheet.getRange(r, 1, 1, 3).merge().setValue(period)
    .setBackground('#16213e').setFontColor('#ffffff').setFontSize(10);
  r++; r++;

  // Revenue
  writeHeader(sheet, 'REVENUE', r, '#1e4d2b'); r++;
  const revItems = groupByAccount(rows, 'REVENUE');
  revItems.forEach(item => { writeRow(sheet, r, item.name, item.total, true, false); r++; });
  const totalRevenue = revItems.reduce((s, i) => s + i.total, 0);
  writeRow(sheet, r, 'Total Revenue', totalRevenue, false, true, '#d4edda'); r++;
  writeDivider(sheet, r - 1);
  r++;

  // COGS
  writeHeader(sheet, 'COST OF GOODS SOLD', r, '#5a2d0c'); r++;
  const cogsItems = groupByAccount(rows, 'COGS');
  cogsItems.forEach(item => { writeRow(sheet, r, item.name, item.total, true, false); r++; });
  const totalCOGS = cogsItems.reduce((s, i) => s + i.total, 0);
  writeRow(sheet, r, 'Total COGS', totalCOGS, false, true, '#fde8d8'); r++;
  writeDivider(sheet, r - 1);
  r++;

  // Gross Profit
  const grossProfit = totalRevenue - totalCOGS;
  writeRow(sheet, r, 'GROSS PROFIT', grossProfit, false, true, '#fff3cd');
  sheet.getRange(r, 1, 1, 3).setBackground('#fff3cd').setFontSize(11); r++;
  const grossMargin = totalRevenue !== 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) + '%' : '—';
  sheet.getRange(r, 1).setValue('    Gross Margin').setFontColor('#555555');
  sheet.getRange(r, 3).setValue(grossMargin).setFontColor('#555555');
  r++; r++;

  // Operating Expenses
  writeHeader(sheet, 'OPERATING EXPENSES', r, '#1a1a5e'); r++;
  const opexItems = groupByAccount(rows, 'OPEX');
  opexItems.forEach(item => { writeRow(sheet, r, item.name, item.total, true, false); r++; });
  const totalOpex = opexItems.reduce((s, i) => s + i.total, 0);
  writeRow(sheet, r, 'Total Operating Expenses', totalOpex, false, true, '#dce4f5'); r++;
  writeDivider(sheet, r - 1);
  r++;

  // Net Operating Income
  const netOpIncome = grossProfit - totalOpex;
  writeRow(sheet, r, 'NET OPERATING INCOME', netOpIncome, false, true, '#e8f4fd');
  sheet.getRange(r, 1, 1, 3).setBackground('#e8f4fd').setFontSize(11); r++; r++;

  // Other Income / Expense
  writeHeader(sheet, 'OTHER INCOME & EXPENSES', r, '#4a235a'); r++;
  const otherIncItems = groupByAccount(rows, 'OTHER_INCOME');
  otherIncItems.forEach(item => { writeRow(sheet, r, item.name, item.total, true, false); r++; });
  const totalOtherInc = otherIncItems.reduce((s, i) => s + i.total, 0);

  const otherExpItems = groupByAccount(rows, 'OTHER_EXPENSE');
  otherExpItems.forEach(item => { writeRow(sheet, r, item.name, -item.total, true, false); r++; });
  const totalOtherExp = otherExpItems.reduce((s, i) => s + i.total, 0);

  writeRow(sheet, r, 'Net Other Income', totalOtherInc - totalOtherExp, false, true, '#f5e6ff'); r++;
  writeDivider(sheet, r - 1);
  r++;

  // Net Income
  const netIncome = netOpIncome + totalOtherInc - totalOtherExp;
  sheet.getRange(r, 1, 1, 3).merge().setValue('NET INCOME')
    .setBackground(netIncome >= 0 ? '#1e4d2b' : '#7b2d2d')
    .setFontColor('#ffffff').setFontWeight('bold').setFontSize(13);
  r++;
  sheet.getRange(r, 1, 1, 3).merge().setValue(fmtNum(netIncome))
    .setBackground(netIncome >= 0 ? '#1e4d2b' : '#7b2d2d')
    .setFontColor('#ffffff').setFontWeight('bold').setFontSize(13)
    .setHorizontalAlignment('right');
  r++;

  sheet.getRange(1, 3, r, 1).setNumberFormat('#,##0.00');

  ss.setActiveSheet(sheet);
  return netIncome;
}

// ── BALANCE SHEET ────────────────────────────────────────────

function generateBS(range, retainedEarnings) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet(ss, 'Balance Sheet');
  // Balance Sheet uses ALL transactions up to end date (not just the period)
  const allStart = new Date(2000, 0, 1);
  const rows  = getRowsInRange(allStart, range.endDate, range.sheetName);
  const asOf  = 'As of ' + formatDate(range.endDate);

  sheet.setColumnWidth(1, 320);
  sheet.setColumnWidth(2, 20);
  sheet.setColumnWidth(3, 160);

  let r = 1;
  sheet.getRange(r, 1, 1, 3).merge().setValue('BALANCE SHEET')
    .setBackground('#16213e').setFontColor('#e2b96f').setFontWeight('bold').setFontSize(14);
  r++;
  sheet.getRange(r, 1, 1, 3).merge().setValue(asOf)
    .setBackground('#16213e').setFontColor('#ffffff').setFontSize(10);
  r++; r++;

  function bsSection(categoryKey, label, headerColor, subtotalColor) {
    writeHeader(sheet, label, r, headerColor); r++;
    const items = groupByAccount(rows, categoryKey);
    items.forEach(item => { writeRow(sheet, r, item.name, item.total, true, false); r++; });
    const total = items.reduce((s, i) => s + i.total, 0);
    writeRow(sheet, r, 'Total ' + label, total, false, true, subtotalColor); r++;
    writeDivider(sheet, r - 1);
    r++;
    return total;
  }

  // ASSETS
  writeHeader(sheet, 'ASSETS', r, '#0d3b4f'); r++;
  const currAssets  = bsSection('CURRENT_ASSETS',   'Current Assets',   '#1565a0', '#dbeafe');
  const fixedAssets = bsSection('FIXED_ASSETS',     'Fixed Assets',     '#1565a0', '#dbeafe');
  const ltAssets    = bsSection('LONG_TERM_ASSETS',  'Long Term Assets', '#1565a0', '#dbeafe');
  const totalAssets = currAssets + fixedAssets + ltAssets;
  writeRow(sheet, r, 'TOTAL ASSETS', totalAssets, false, true, '#bfdbfe');
  sheet.getRange(r, 1, 1, 3).setFontSize(11); r++; r++;

  // LIABILITIES
  writeHeader(sheet, 'LIABILITIES', r, '#4d0e0e'); r++;
  const currLiab = bsSection('CURRENT_LIABILITIES',   'Current Liabilities',    '#b71c1c', '#fde8e8');
  const ltLiab   = bsSection('LONG_TERM_LIABILITIES',  'Long Term Liabilities',  '#b71c1c', '#fde8e8');
  const totalLiab = currLiab + ltLiab;
  writeRow(sheet, r, 'TOTAL LIABILITIES', totalLiab, false, true, '#fca5a5');
  sheet.getRange(r, 1, 1, 3).setFontSize(11); r++; r++;

  // EQUITY
  writeHeader(sheet, 'OWNERS EQUITY', r, '#1a4731'); r++;
  const equityItems = groupByAccount(rows, 'EQUITY');
  equityItems.forEach(item => { writeRow(sheet, r, item.name, item.total, true, false); r++; });
  // Add retained earnings from P&L
  writeRow(sheet, r, 'Retained Earnings (period)', retainedEarnings || 0, true, false); r++;
  const totalEquityBase = equityItems.reduce((s, i) => s + i.total, 0);
  const totalEquity = totalEquityBase + (retainedEarnings || 0);
  writeRow(sheet, r, 'TOTAL EQUITY', totalEquity, false, true, '#bbf7d0'); r++;
  writeDivider(sheet, r - 1); r++;

  // Total Liabilities + Equity
  const totalLiabEquity = totalLiab + totalEquity;
  writeRow(sheet, r, 'TOTAL LIABILITIES & EQUITY', totalLiabEquity, false, true, '#e2b96f');
  sheet.getRange(r, 1, 1, 3).setBackground('#16213e').setFontColor('#e2b96f').setFontSize(11);
  r++;

  // Balance check
  const balanced = Math.abs(totalAssets - totalLiabEquity) < 0.01;
  r++;
  sheet.getRange(r, 1, 1, 3).merge()
    .setValue(balanced ? '✓ Balance Sheet is balanced' : '⚠ Balance Sheet out of balance by ' + fmtNum(totalAssets - totalLiabEquity))
    .setFontColor(balanced ? '#1e4d2b' : '#c0392b')
    .setFontWeight('bold');

  sheet.getRange(1, 3, r, 1).setNumberFormat('#,##0.00');
  ss.setActiveSheet(sheet);
}

// ── CASH FLOW STATEMENT ──────────────────────────────────────

function generateCF(range, netIncome) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet(ss, 'Cash Flow');
  const rows  = getRowsInRange(range.startDate, range.endDate, range.sheetName);
  const period = formatDate(range.startDate) + ' – ' + formatDate(range.endDate);

  sheet.setColumnWidth(1, 320);
  sheet.setColumnWidth(2, 20);
  sheet.setColumnWidth(3, 160);

  let r = 1;
  sheet.getRange(r, 1, 1, 3).merge().setValue('CASH FLOW STATEMENT')
    .setBackground('#16213e').setFontColor('#e2b96f').setFontWeight('bold').setFontSize(14);
  r++;
  sheet.getRange(r, 1, 1, 3).merge().setValue(period)
    .setBackground('#16213e').setFontColor('#ffffff').setFontSize(10);
  r++; r++;

  function cfSection(label, cfType, headerColor, subtotalColor) {
    writeHeader(sheet, label, r, headerColor); r++;
    const sectionRows = rows.filter(rx => rx.cashflow === cfType);
    const grouped = {};
    sectionRows.forEach(rx => {
      const key = rx.account || rx.type || 'Other';
      const signed = rx.direction && rx.direction.startsWith('Income') ? rx.amount : -rx.amount;
      grouped[key] = (grouped[key] || 0) + signed;
    });
    let total = 0;
    Object.entries(grouped).forEach(([name, amt]) => {
      writeRow(sheet, r, name, amt, true, false); r++;
      total += amt;
    });
    writeRow(sheet, r, 'Net Cash – ' + label, total, false, true, subtotalColor);
    writeDivider(sheet, r); r++; r++;
    return total;
  }

  // Operating starts with net income then adjustments
  writeHeader(sheet, 'CASH FROM OPERATING ACTIVITIES', r, '#1e4d2b'); r++;
  writeRow(sheet, r, 'Net Income', netIncome || 0, true, false); r++;
  const opRows = rows.filter(rx => rx.cashflow === 'Operating Activities');
  const opGrouped = {};
  opRows.forEach(rx => {
    const key = rx.account || rx.type || 'Other';
    const signed = rx.direction && rx.direction.startsWith('Income') ? rx.amount : -rx.amount;
    opGrouped[key] = (opGrouped[key] || 0) + signed;
  });
  let opAdjustments = 0;
  Object.entries(opGrouped).forEach(([name, amt]) => {
    writeRow(sheet, r, name, amt, true, false); r++;
    opAdjustments += amt;
  });
  const totalOp = (netIncome || 0) + opAdjustments;
  writeRow(sheet, r, 'Net Cash from Operating Activities', totalOp, false, true, '#d4edda');
  writeDivider(sheet, r); r++; r++;

  const totalInv = cfSection('CASH FROM INVESTING ACTIVITIES', 'Investing Activities', '#1565a0', '#dbeafe');
  const totalFin = cfSection('CASH FROM FINANCING ACTIVITIES', 'Financing Activities', '#5a2d0c', '#fde8d8');

  // Net Change in Cash
  const netCash = totalOp + totalInv + totalFin;
  writeRow(sheet, r, 'NET CHANGE IN CASH', netCash, false, true, '#fff3cd');
  sheet.getRange(r, 1, 1, 3).setBackground('#fff3cd').setFontSize(11); r++;

  // Beginning / Ending Cash (user fills manually or from BS)
  r++;
  sheet.getRange(r, 1).setValue('Beginning Cash Balance').setFontColor('#555555');
  sheet.getRange(r, 3).setValue('← enter manually').setFontColor('#999999').setFontStyle('italic');
  r++;
  sheet.getRange(r, 1).setValue('Ending Cash Balance').setFontWeight('bold');
  sheet.getRange(r, 3).setValue('= Beginning + Net Change').setFontColor('#999999').setFontStyle('italic');

  sheet.getRange(1, 3, r, 1).setNumberFormat('#,##0.00');
  ss.setActiveSheet(sheet);
}
