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
        .addItem('Smart Chart (Auto-detect)', 'smartChart')
        .addSeparator()
        .addItem('Bar Chart',       'createBarChart')
        .addItem('Line Chart',      'createLineChart')
        .addItem('Pie Chart',       'createPieChartSafe')
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
// SMART CHART — auto-detects the best chart type
// -----------------------------------------------------------

var GEO_KEYWORDS  = ['country', 'region', 'state', 'province', 'city', 'location', 'place', 'territory', 'area', 'nation'];
var DATE_KEYWORDS = ['date', 'time', 'year', 'month', 'day', 'week', 'period', 'quarter'];

// Broad list of recognised country/territory names for geo detection
var COUNTRY_NAMES = [
  'afghanistan','albania','algeria','angola','argentina','australia','austria','bangladesh',
  'belgium','bolivia','brazil','bulgaria','cambodia','cameroon','canada','chile','china',
  'colombia','congo','croatia','cuba','czech republic','denmark','ecuador','egypt',
  'ethiopia','finland','france','germany','ghana','greece','guatemala','hungary','india',
  'indonesia','iran','iraq','ireland','israel','italy','japan','jordan','kenya','malaysia',
  'mexico','morocco','mozambique','myanmar','nepal','netherlands','new zealand','nigeria',
  'norway','pakistan','peru','philippines','poland','portugal','romania','russia','saudi arabia',
  'senegal','serbia','singapore','somalia','south africa','south korea','spain','sri lanka',
  'sudan','sweden','switzerland','syria','taiwan','tanzania','thailand','turkey','uganda',
  'ukraine','united kingdom','united states','uruguay','venezuela','vietnam','zambia','zimbabwe'
];

function detectColumnProfile(headers, rows) {
  return headers.map(function(h, c) {
    var vals   = rows.map(function(r) { return r[c]; }).filter(function(v) { return v !== '' && v !== null; });
    var nums   = vals.filter(function(v) { return typeof v === 'number'; });
    var dates  = vals.filter(function(v) { return v instanceof Date; });
    var unique = {};
    vals.forEach(function(v) { unique[String(v).toLowerCase()] = true; });
    var uniqueKeys = Object.keys(unique);

    var type = dates.length  > vals.length * 0.5 ? 'date'
             : nums.length   > vals.length * 0.5 ? 'number'
             : 'text';

    // Geo: header keyword OR >40% of sample values are known country names
    var headerLow = String(h).toLowerCase();
    var headerIsGeo = GEO_KEYWORDS.some(function(k) { return headerLow.indexOf(k) !== -1; });
    var sampleGeoHits = uniqueKeys.slice(0, 30).filter(function(v) { return COUNTRY_NAMES.indexOf(v) !== -1; }).length;
    var isGeo = type === 'text' && (headerIsGeo || sampleGeoHits / Math.min(uniqueKeys.length, 30) > 0.4);

    // Date: header keyword OR actual Date objects
    var isDate = type === 'date' || DATE_KEYWORDS.some(function(k) { return headerLow.indexOf(k) !== -1; });

    return { header: h, type: type, uniqueCount: uniqueKeys.length, filled: vals.length, isGeo: isGeo, isDate: isDate };
  });
}

function smartChart() {
  var ui    = SpreadsheetApp.getUi();
  var sheet = SpreadsheetApp.getActiveSheet();
  var data  = sheet.getDataRange().getValues();

  if (data.length < 2) { ui.alert('Not enough data to chart.'); return; }

  var headers = data[0];
  var rows    = data.slice(1);
  var cols    = detectColumnProfile(headers, rows);

  var geoCols  = cols.filter(function(c) { return c.isGeo; });
  var dateCols = cols.filter(function(c) { return c.isDate; });
  var numCols  = cols.filter(function(c) { return c.type === 'number'; });
  var textCols = cols.filter(function(c) { return c.type === 'text' && !c.isGeo; });

  var chartType, reason, warning = '';

  if (geoCols.length > 0 && numCols.length > 0) {
    chartType = Charts.ChartType.GEO;
    reason    = 'Geographic column "' + geoCols[0].header + '" detected with numeric data — a Map chart shows regional distribution best.';

  } else if (dateCols.length > 0 && numCols.length > 0) {
    chartType = Charts.ChartType.LINE;
    reason    = 'Date/time column "' + dateCols[0].header + '" detected — a Line chart shows trends over time best.';

  } else if (numCols.length >= 2 && textCols.length === 0) {
    chartType = Charts.ChartType.SCATTER;
    reason    = 'Two or more numeric columns with no categories — a Scatter chart reveals the relationship between them.';

  } else if (textCols.length > 0 && numCols.length > 0) {
    var cat = textCols[0];
    if (cat.uniqueCount <= 7 && numCols.length === 1) {
      chartType = Charts.ChartType.PIE;
      reason    = '"' + cat.header + '" has only ' + cat.uniqueCount + ' categories — a Pie chart works well for part-to-whole comparison.';
    } else if (cat.uniqueCount > 20) {
      chartType = Charts.ChartType.BAR;
      reason    = '"' + cat.header + '" has ' + cat.uniqueCount + ' categories — a horizontal Bar chart handles many labels without crowding.';
    } else {
      chartType = Charts.ChartType.COLUMN;
      reason    = '"' + cat.header + '" has ' + cat.uniqueCount + ' categories — a Column chart is best for comparing across them.';
    }
    if (numCols.length > 1) {
      warning = '\n\nNote: multiple numeric columns found — all will be included as separate series.';
    }

  } else {
    chartType = Charts.ChartType.COLUMN;
    reason    = 'No clear pattern detected — defaulting to a Column chart.';
  }

  var confirmed = ui.alert(
    'Smart Chart',
    'Recommended: ' + chartTypeName(chartType) + '\n\nReason: ' + reason + warning + '\n\nCreate this chart?',
    ui.ButtonSet.YES_NO
  );
  if (confirmed !== ui.Button.YES) return;

  var range = sheet.getDataRange();
  var builder = sheet.newChart()
    .setChartType(chartType)
    .addRange(range)
    .setOption('title', sheet.getName())
    .setOption('legend', { position: 'bottom' })
    .setPosition(3, 2, 0, 0);

  if (chartType === Charts.ChartType.GEO)     builder.setOption('displayMode', 'regions');
  if (chartType === Charts.ChartType.PIE)      builder.setOption('pieHole', 0.3);

  sheet.insertChart(builder.build());
  ui.alert(chartTypeName(chartType) + ' created on "' + sheet.getName() + '".');
}

function chartTypeName(type) {
  var map = {};
  map[Charts.ChartType.PIE]     = 'Pie Chart';
  map[Charts.ChartType.BAR]     = 'Bar Chart';
  map[Charts.ChartType.LINE]    = 'Line Chart';
  map[Charts.ChartType.COLUMN]  = 'Column Chart';
  map[Charts.ChartType.GEO]     = 'Map / Geo Chart';
  map[Charts.ChartType.SCATTER] = 'Scatter Chart';
  return map[type] || 'Chart';
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

function createPieChartSafe() {
  var ui    = SpreadsheetApp.getUi();
  var sheet = SpreadsheetApp.getActiveSheet();
  var data  = sheet.getDataRange().getValues();
  if (data.length < 2) { ui.alert('Not enough data.'); return; }

  var rows     = data.slice(1);
  var firstCol = rows.map(function(r) { return r[0]; }).filter(function(v) { return v !== '' && v !== null; });
  var unique   = {};
  firstCol.forEach(function(v) { unique[v] = true; });
  var catCount = Object.keys(unique).length;

  if (catCount > 7) {
    var proceed = ui.alert(
      'Pie Chart Warning',
      '"' + data[0][0] + '" has ' + catCount + ' unique values — pie charts become hard to read above 7 slices.\n\n' +
      'A Column or Bar chart would communicate this data more clearly.\n\nCreate the pie chart anyway?',
      ui.ButtonSet.YES_NO
    );
    if (proceed !== ui.Button.YES) return;
  }

  var ctx        = getActiveSheetDataRange();
  var twoColRange = ctx.sheet.getRange(1, 1, ctx.sheet.getLastRow(), 2);
  var chart = ctx.sheet.newChart()
    .setChartType(Charts.ChartType.PIE)
    .addRange(twoColRange)
    .setOption('title', ctx.sheet.getName() + ' — Pie Chart')
    .setOption('pieHole', 0.3);
  insertChart(chart);
  ui.alert('Pie chart created on "' + ctx.sheet.getName() + '".');
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
