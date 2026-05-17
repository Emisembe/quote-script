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
      SpreadsheetApp.getUi().createMenu('Analyse')
        .addItem('Column Summary',       'runColumnSummary')
        .addItem('Frequency Table…',     'promptFrequencyTable')
        .addItem('Quick Stats Panel',    'runQuickStats')
        .addItem('Filter to New Sheet…', 'promptFilterToSheet')
    )
    .addSeparator()
    .addSubMenu(
      SpreadsheetApp.getUi().createMenu('Create Chart')
        .addItem('Bar Chart',       'createBarChart')
        .addItem('Line Chart',      'createLineChart')
        .addItem('Pie Chart',       'createPieChart')
        .addItem('Column Chart',    'createColumnChart')
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
// ANALYSE — COLUMN SUMMARY
// -----------------------------------------------------------

function runColumnSummary() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var src   = ss.getActiveSheet();
  var data  = src.getDataRange().getValues();
  if (data.length < 2) { SpreadsheetApp.getUi().alert('Sheet has no data rows.'); return; }

  var headers  = data[0];
  var rows     = data.slice(1);
  var numCols  = headers.length;

  var summary  = [['Column', 'Total Rows', 'Filled', 'Blanks', 'Unique Values', 'Detected Type', 'Min', 'Max']];

  for (var c = 0; c < numCols; c++) {
    var col      = rows.map(function(r) { return r[c]; });
    var filled   = col.filter(function(v) { return v !== '' && v !== null; });
    var blanks   = col.length - filled.length;
    var unique   = {};
    filled.forEach(function(v) { unique[v] = true; });
    var uniqueCount = Object.keys(unique).length;

    // Detect predominant type
    var numCount  = filled.filter(function(v) { return typeof v === 'number'; }).length;
    var dateCount = filled.filter(function(v) { return v instanceof Date; }).length;
    var type = dateCount > numCount && dateCount > filled.length / 2 ? 'Date'
             : numCount > filled.length / 2 ? 'Number'
             : 'Text';

    var min = '', max = '';
    if (type === 'Number') {
      var nums = filled.map(Number);
      min = Math.min.apply(null, nums);
      max = Math.max.apply(null, nums);
    } else if (type === 'Date') {
      var times = filled.map(function(v) { return v.getTime(); });
      min = new Date(Math.min.apply(null, times)).toLocaleDateString();
      max = new Date(Math.max.apply(null, times)).toLocaleDateString();
    }

    summary.push([headers[c], rows.length, filled.length, blanks, uniqueCount, type, min, max]);
  }

  var destName = src.getName() + '_summary';
  var dest = ss.getSheetByName(destName) || ss.insertSheet(destName);
  dest.clearContents();
  dest.getRange(1, 1, summary.length, summary[0].length).setValues(summary);

  // Style header row
  var hdr = dest.getRange(1, 1, 1, summary[0].length);
  hdr.setFontWeight('bold').setBackground('#4a86e8').setFontColor('#ffffff');
  for (var i = 1; i <= summary[0].length; i++) dest.autoResizeColumn(i);

  ss.setActiveSheet(dest);
  SpreadsheetApp.getUi().alert('Column summary written to sheet "' + destName + '".');
}


// -----------------------------------------------------------
// ANALYSE — FREQUENCY TABLE
// -----------------------------------------------------------

function promptFrequencyTable() {
  var ui      = SpreadsheetApp.getUi();
  var sheet   = SpreadsheetApp.getActiveSheet();
  var headers = sheet.getDataRange().getValues()[0];
  var names   = headers.join(', ');

  var response = ui.prompt(
    'Frequency Table',
    'Enter the column header name to count:\n(Available: ' + names + ')',
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() !== ui.Button.OK) return;

  var colName = response.getResponseText().trim();
  var colIdx  = headers.indexOf(colName);
  if (colIdx === -1) { ui.alert('Column "' + colName + '" not found.'); return; }

  var data    = sheet.getDataRange().getValues().slice(1);
  var counts  = {};
  data.forEach(function(row) {
    var val = String(row[colIdx]).trim();
    if (val === '') val = '(blank)';
    counts[val] = (counts[val] || 0) + 1;
  });

  var rows = Object.keys(counts).map(function(k) { return [k, counts[k]]; });
  rows.sort(function(a, b) { return b[1] - a[1]; }); // descending by count

  var total    = data.length;
  var tableData = [['Value', 'Count', '% of Total']].concat(
    rows.map(function(r) { return [r[0], r[1], (r[1] / total * 100).toFixed(1) + '%']; })
  );

  var ss       = SpreadsheetApp.getActiveSpreadsheet();
  var destName = sheet.getName() + '_freq_' + colName.replace(/\s+/g, '_');
  var dest     = ss.getSheetByName(destName) || ss.insertSheet(destName);
  dest.clearContents();
  dest.getRange(1, 1, tableData.length, 3).setValues(tableData);

  var hdr = dest.getRange(1, 1, 1, 3);
  hdr.setFontWeight('bold').setBackground('#6aa84f').setFontColor('#ffffff');
  [1, 2, 3].forEach(function(i) { dest.autoResizeColumn(i); });

  ss.setActiveSheet(dest);
  ui.alert('Frequency table for "' + colName + '" written to "' + destName + '".');
}


// -----------------------------------------------------------
// ANALYSE — QUICK STATS PANEL
// -----------------------------------------------------------

function runQuickStats() {
  var ui      = SpreadsheetApp.getUi();
  var sheet   = SpreadsheetApp.getActiveSheet();
  var data    = sheet.getDataRange().getValues();
  if (data.length < 2) { ui.alert('Sheet has no data rows.'); return; }

  var headers = data[0];
  var rows    = data.slice(1);

  // Collect only numeric columns
  var numericCols = [];
  headers.forEach(function(h, c) {
    var nums = rows.map(function(r) { return r[c]; }).filter(function(v) { return typeof v === 'number'; });
    if (nums.length > 0) numericCols.push({ name: h, values: nums });
  });

  if (numericCols.length === 0) { ui.alert('No numeric columns found.'); return; }

  var statRows = [['Column', 'Count', 'Sum', 'Mean', 'Median', 'Std Dev', 'Min', 'Max']];

  numericCols.forEach(function(col) {
    var n    = col.values.length;
    var sum  = col.values.reduce(function(a, b) { return a + b; }, 0);
    var mean = sum / n;

    var sorted = col.values.slice().sort(function(a, b) { return a - b; });
    var median = n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];

    var variance = col.values.reduce(function(acc, v) { return acc + Math.pow(v - mean, 2); }, 0) / n;
    var stddev   = Math.sqrt(variance);

    statRows.push([
      col.name,
      n,
      +sum.toFixed(2),
      +mean.toFixed(2),
      +median.toFixed(2),
      +stddev.toFixed(2),
      sorted[0],
      sorted[n - 1]
    ]);
  });

  var ss       = SpreadsheetApp.getActiveSpreadsheet();
  var destName = sheet.getName() + '_stats';
  var dest     = ss.getSheetByName(destName) || ss.insertSheet(destName);
  dest.clearContents();
  dest.getRange(1, 1, statRows.length, statRows[0].length).setValues(statRows);

  var hdr = dest.getRange(1, 1, 1, statRows[0].length);
  hdr.setFontWeight('bold').setBackground('#e69138').setFontColor('#ffffff');
  for (var i = 1; i <= statRows[0].length; i++) dest.autoResizeColumn(i);

  ss.setActiveSheet(dest);
  ui.alert('Quick stats written to "' + destName + '".');
}


// -----------------------------------------------------------
// ANALYSE — FILTER TO NEW SHEET
// -----------------------------------------------------------

function promptFilterToSheet() {
  var ui      = SpreadsheetApp.getUi();
  var sheet   = SpreadsheetApp.getActiveSheet();
  var headers = sheet.getDataRange().getValues()[0];
  var names   = headers.join(', ');

  var colResp = ui.prompt(
    'Filter to New Sheet (1 of 2)',
    'Column to filter on:\n(Available: ' + names + ')',
    ui.ButtonSet.OK_CANCEL
  );
  if (colResp.getSelectedButton() !== ui.Button.OK) return;
  var colName = colResp.getResponseText().trim();
  var colIdx  = headers.indexOf(colName);
  if (colIdx === -1) { ui.alert('Column "' + colName + '" not found.'); return; }

  var valResp = ui.prompt(
    'Filter to New Sheet (2 of 2)',
    'Show rows where "' + colName + '" equals:',
    ui.ButtonSet.OK_CANCEL
  );
  if (valResp.getSelectedButton() !== ui.Button.OK) return;
  var filterVal = valResp.getResponseText().trim();

  var allRows   = sheet.getDataRange().getValues();
  var header    = allRows[0];
  var matched   = allRows.slice(1).filter(function(row) {
    return String(row[colIdx]).trim() === filterVal;
  });

  if (matched.length === 0) {
    ui.alert('No rows found where "' + colName + '" = "' + filterVal + '".');
    return;
  }

  var ss       = SpreadsheetApp.getActiveSpreadsheet();
  var destName = sheet.getName() + '_' + colName.replace(/\s+/g, '_') + '_' + filterVal.replace(/\s+/g, '_');
  destName     = destName.substring(0, 100); // sheet name length limit
  var dest     = ss.getSheetByName(destName) || ss.insertSheet(destName);
  dest.clearContents();

  var output = [header].concat(matched);
  dest.getRange(1, 1, output.length, output[0].length).setValues(output);

  var hdr = dest.getRange(1, 1, 1, header.length);
  hdr.setFontWeight('bold').setBackground('#674ea7').setFontColor('#ffffff');
  for (var i = 1; i <= header.length; i++) dest.autoResizeColumn(i);

  ss.setActiveSheet(dest);
  ui.alert(matched.length + ' rows written to "' + destName + '".');
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
