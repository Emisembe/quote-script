// ============================================================
//  DATA TOOLS — Google Apps Script
//  Adds a "Data Tools" menu with cleaning, sorting,
//  chart creation, and sheet-copy utilities.
// ============================================================

// -----------------------------------------------------------
// MENU
// -----------------------------------------------------------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Data Tools')
    .addItem('Clean & Sort Sheet…', 'promptCleanSheet')
    .addSeparator()
    .addSubMenu(
      SpreadsheetApp.getUi().createMenu('Create Chart')
        .addItem('Bar Chart',     'createBarChart')
        .addItem('Line Chart',    'createLineChart')
        .addItem('Pie Chart',     'createPieChart')
        .addItem('Column Chart',  'createColumnChart')
        .addItem('Map / Geo Chart', 'createGeoChart')
    )
    .addSeparator()
    .addSubMenu(
      SpreadsheetApp.getUi().createMenu('Copy Sheet')
        .addItem('Duplicate in this Spreadsheet', 'duplicateActiveSheet')
        .addItem('Copy to Another Spreadsheet…',  'copySheetToOther')
    )
    .addToUi();
}


// -----------------------------------------------------------
// CLEAN & SORT
// -----------------------------------------------------------

function promptCleanSheet() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Build a list of available sheet names for the prompt
  var names = ss.getSheets().map(function(s) { return s.getName(); }).join(', ');

  var response = ui.prompt(
    'Clean & Sort Sheet',
    'Enter the sheet name to clean:\n(Available: ' + names + ')',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  var sheetName = response.getResponseText().trim();
  if (!sheetName) { ui.alert('No sheet name entered.'); return; }

  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) { ui.alert('Sheet "' + sheetName + '" not found.'); return; }

  cleanAndSortSheet(sheet);
  ui.alert('Done! "' + sheetName + '" has been cleaned and sorted.');
}

function cleanAndSortSheet(sheet) {
  var range = sheet.getDataRange();
  var values = range.getValues();

  if (values.length < 2) return; // nothing to clean

  // Step 1 — trim whitespace in every string cell
  var cleaned = values.map(function(row) {
    return row.map(function(cell) {
      return (typeof cell === 'string') ? cell.trim() : cell;
    });
  });

  // Step 2 — remove fully empty rows (skip header row 0)
  var header = cleaned[0];
  var dataRows = cleaned.slice(1).filter(function(row) {
    return row.some(function(cell) { return cell !== '' && cell !== null; });
  });

  // Step 3 — remove duplicate rows (compare stringified rows)
  var seen = {};
  var unique = dataRows.filter(function(row) {
    var key = JSON.stringify(row);
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });

  // Step 4 — sort by the first column (ascending)
  unique.sort(function(a, b) {
    var va = a[0], vb = b[0];
    if (va < vb) return -1;
    if (va > vb) return  1;
    return 0;
  });

  // Write back
  var result = [header].concat(unique);
  sheet.clearContents();
  sheet.getRange(1, 1, result.length, result[0].length).setValues(result);

  // Auto-resize columns for readability
  for (var c = 1; c <= result[0].length; c++) {
    sheet.autoResizeColumn(c);
  }
}


// -----------------------------------------------------------
// CHART HELPERS
// -----------------------------------------------------------

function getActiveSheetDataRange() {
  var sheet = SpreadsheetApp.getActiveSheet();
  return { sheet: sheet, range: sheet.getDataRange() };
}

function insertChart(chartBuilder) {
  var sheet = SpreadsheetApp.getActiveSheet();
  sheet.insertChart(chartBuilder.setPosition(3, 2, 0, 0).build());
}

function createBarChart() {
  var ctx = getActiveSheetDataRange();
  var chart = ctx.sheet.newChart()
    .setChartType(Charts.ChartType.BAR)
    .addRange(ctx.range)
    .setOption('title', ctx.sheet.getName() + ' — Bar Chart')
    .setOption('legend', { position: 'bottom' });
  insertChart(chart);
  SpreadsheetApp.getUi().alert('Bar chart created on "' + ctx.sheet.getName() + '".');
}

function createLineChart() {
  var ctx = getActiveSheetDataRange();
  var chart = ctx.sheet.newChart()
    .setChartType(Charts.ChartType.LINE)
    .addRange(ctx.range)
    .setOption('title', ctx.sheet.getName() + ' — Line Chart')
    .setOption('legend', { position: 'bottom' });
  insertChart(chart);
  SpreadsheetApp.getUi().alert('Line chart created on "' + ctx.sheet.getName() + '".');
}

function createPieChart() {
  var ctx = getActiveSheetDataRange();
  // Pie chart uses only the first two columns (label, value)
  var twoColRange = ctx.sheet.getRange(1, 1, ctx.sheet.getLastRow(), 2);
  var chart = ctx.sheet.newChart()
    .setChartType(Charts.ChartType.PIE)
    .addRange(twoColRange)
    .setOption('title', ctx.sheet.getName() + ' — Pie Chart')
    .setOption('pieHole', 0.3);
  insertChart(chart);
  SpreadsheetApp.getUi().alert('Pie chart created on "' + ctx.sheet.getName() + '".');
}

function createColumnChart() {
  var ctx = getActiveSheetDataRange();
  var chart = ctx.sheet.newChart()
    .setChartType(Charts.ChartType.COLUMN)
    .addRange(ctx.range)
    .setOption('title', ctx.sheet.getName() + ' — Column Chart')
    .setOption('legend', { position: 'bottom' });
  insertChart(chart);
  SpreadsheetApp.getUi().alert('Column chart created on "' + ctx.sheet.getName() + '".');
}

function createGeoChart() {
  // Geo/Map chart — expects column A = location name (country or region),
  // column B = numeric value to shade the map.
  var ctx = getActiveSheetDataRange();
  var chart = ctx.sheet.newChart()
    .setChartType(Charts.ChartType.GEO)
    .addRange(ctx.range)
    .setOption('title', ctx.sheet.getName() + ' — Map View')
    .setOption('displayMode', 'regions'); // 'markers' for point data
  insertChart(chart);
  SpreadsheetApp.getUi().alert(
    'Map chart created on "' + ctx.sheet.getName() + '".\n\n' +
    'Tip: Column A should contain location names (countries, regions, or cities) ' +
    'and Column B a numeric value.'
  );
}


// -----------------------------------------------------------
// COPY SHEET
// -----------------------------------------------------------

function duplicateActiveSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var source = ss.getActiveSheet();
  var copy = source.copyTo(ss);
  copy.setName(source.getName() + '_copy');
  ss.setActiveSheet(copy);
  SpreadsheetApp.getUi().alert(
    'Sheet duplicated as "' + copy.getName() + '" in this spreadsheet.'
  );
}

function copySheetToOther() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt(
    'Copy to Another Spreadsheet',
    'Paste the destination Spreadsheet URL or ID:',
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() !== ui.Button.OK) return;

  var input = response.getResponseText().trim();
  if (!input) { ui.alert('No destination provided.'); return; }

  // Accept either a full URL or a bare spreadsheet ID
  var destId = input;
  var urlMatch = input.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (urlMatch) destId = urlMatch[1];

  try {
    var dest = SpreadsheetApp.openById(destId);
    var source = SpreadsheetApp.getActiveSheet();
    source.copyTo(dest);
    ui.alert('Sheet "' + source.getName() + '" copied to:\n' + dest.getName());
  } catch (e) {
    ui.alert('Could not open the destination spreadsheet.\n\nError: ' + e.message);
  }
}
