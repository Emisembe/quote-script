// ============================================================
// UTILITIES
// ============================================================

// Column indices in the Form Responses sheet (1-based after timestamp)
const COL = {
  TIMESTAMP: 1,
  DATE: 2,
  TYPE: 3,
  ACCOUNT: 4,
  ACCOUNT_OTHER: 5,
  AMOUNT: 6,
  DIRECTION: 7,
  CASHFLOW: 8,
  VENDOR: 9,
  REFERENCE: 10,
  DESCRIPTION: 11
};

function getResponseSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // Form responses land in a sheet whose name starts with "Form Responses"
  const sheets = ss.getSheets();
  for (const sh of sheets) {
    if (sh.getName().startsWith('Form Responses')) return sh;
  }
  return null;
}

// Parse amount; positive = income/asset, negative = expense/liability depending on direction
function parseSignedAmount(rawAmount, direction) {
  const amt = parseFloat(String(rawAmount).replace(/[^0-9.\-]/g, '')) || 0;
  const isPositive = direction && direction.startsWith('Income');
  return isPositive ? Math.abs(amt) : -Math.abs(amt);
}

// Returns rows between startDate and endDate (inclusive), as objects
function getRowsInRange(startDate, endDate) {
  const sheet = getResponseSheet();
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const txDate = new Date(row[COL.DATE - 1]);
    if (isNaN(txDate)) continue;
    txDate.setHours(0, 0, 0, 0);
    if (txDate >= startDate && txDate <= endDate) {
      rows.push({
        timestamp:   row[COL.TIMESTAMP - 1],
        date:        txDate,
        type:        row[COL.TYPE - 1],
        account:     row[COL.ACCOUNT - 1] === 'Other (specify below)'
                       ? row[COL.ACCOUNT_OTHER - 1]
                       : row[COL.ACCOUNT - 1],
        amount:      parseFloat(String(row[COL.AMOUNT - 1]).replace(/[^0-9.\-]/g, '')) || 0,
        direction:   row[COL.DIRECTION - 1],
        cashflow:    row[COL.CASHFLOW - 1],
        vendor:      row[COL.VENDOR - 1],
        reference:   row[COL.REFERENCE - 1],
        description: row[COL.DESCRIPTION - 1]
      });
    }
  }
  return rows;
}

// Sums amounts for rows matching a category key
function sumByCategory(rows, categoryKey) {
  const lookup = buildAccountLookup();
  return rows
    .filter(r => lookup[r.account] === categoryKey || lookup[r.type] === categoryKey)
    .reduce((acc, r) => acc + r.amount, 0);
}

// Groups rows by account name within a category, returns [{name, total}]
function groupByAccount(rows, categoryKey) {
  const lookup = buildAccountLookup();
  const map = {};
  rows
    .filter(r => lookup[r.account] === categoryKey || lookup[r.type] === categoryKey)
    .forEach(r => {
      const key = r.account || r.type;
      map[key] = (map[key] || 0) + r.amount;
    });
  return Object.entries(map).map(([name, total]) => ({ name, total }));
}

// Date prompt dialog – returns {startDate, endDate} or null if cancelled
function promptDateRange() {
  const ui = SpreadsheetApp.getUi();
  const today = new Date();

  const startResp = ui.prompt(
    'Select Period – Start Date',
    'Enter start date (YYYY-MM-DD):',
    ui.ButtonSet.OK_CANCEL
  );
  if (startResp.getSelectedButton() !== ui.Button.OK) return null;

  const endResp = ui.prompt(
    'Select Period – End Date',
    'Enter end date (YYYY-MM-DD):',
    ui.ButtonSet.OK_CANCEL
  );
  if (endResp.getSelectedButton() !== ui.Button.OK) return null;

  const start = new Date(startResp.getResponseText().trim());
  const end   = new Date(endResp.getResponseText().trim());
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (isNaN(start) || isNaN(end)) {
    ui.alert('Invalid dates entered. Please use YYYY-MM-DD format.');
    return null;
  }
  return { startDate: start, endDate: end };
}

// Quick period helpers
function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { startDate: start, endDate: end };
}

function currentQuarterRange() {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3);
  const start = new Date(now.getFullYear(), q * 3, 1);
  const end   = new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59);
  return { startDate: start, endDate: end };
}

function currentYearRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const end   = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
  return { startDate: start, endDate: end };
}

function formatDate(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd MMM yyyy');
}

function fmtNum(n) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Write a styled section header row
function writeHeader(sheet, text, row, bgColor) {
  const range = sheet.getRange(row, 1, 1, 3);
  range.merge();
  range.setValue(text);
  range.setBackground(bgColor || '#1a1a2e');
  range.setFontColor('#ffffff');
  range.setFontWeight('bold');
  range.setFontSize(11);
}

// Write a data row: label | blank | amount
function writeRow(sheet, row, label, amount, indent, bold, bgColor) {
  const labelCell = sheet.getRange(row, 1);
  const amtCell   = sheet.getRange(row, 3);
  labelCell.setValue((indent ? '    ' : '') + label);
  amtCell.setValue(amount !== '' ? amount : '');
  if (bold) {
    sheet.getRange(row, 1, 1, 3).setFontWeight('bold');
  }
  if (bgColor) {
    sheet.getRange(row, 1, 1, 3).setBackground(bgColor);
  }
  if (typeof amount === 'number' && amount < 0) {
    amtCell.setFontColor('#c0392b');
  }
}

function writeDivider(sheet, row) {
  sheet.getRange(row, 1, 1, 3).setBorder(false, false, true, false, false, false, '#cccccc', SpreadsheetApp.BorderStyle.SOLID);
}

function getOrCreateSheet(ss, name) {
  let sh = ss.getSheetByName(name);
  if (sh) {
    sh.clearContents();
    sh.clearFormats();
  } else {
    sh = ss.insertSheet(name);
  }
  return sh;
}
