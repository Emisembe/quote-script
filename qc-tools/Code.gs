/**
 * QC TOOLS for Google Sheets + Forms + Web App
 * Five of the 7 QC tools: Check Sheet, Pareto Chart, Scatter Diagram,
 * Histogram, Control Chart.
 *
 * ONE-TIME SETUP (about 2 minutes)
 *   1. Create a blank Google Sheet  ->  Extensions  ->  Apps Script.
 *   2. Delete everything in Code.gs, paste this whole file, click Save.
 *   3. In the toolbar pick the function "setup" and click Run.
 *      Approve the permissions (Sheets, Forms, triggers).
 *   4. Go back to the Sheet and reload it: a "QC Tools" menu appears.
 *      QC Tools -> Open dashboard      (works right away inside the Sheet)
 *      QC Tools -> Load demo data      (optional: the toaster example)
 *   5. Optional, to open the dashboard on a phone or share it:
 *      Deploy -> New deployment -> type "Web app" -> Deploy, open the URL.
 *
 * THE DATABASE (sheet "Records") is one generic table. Every row is one
 * observation:  Date | Project | Area | Shift | Recorded By | Kind | Item | Value
 *   Kind = Count     -> a defect / event count        (Item = defect type)
 *   Kind = Measure   -> a measured number             (Item = what was measured)
 *   Kind = Inspected -> how many units were checked   (Item = "Units inspected")
 * Because every tool reads the same table and filters it by Project, Area,
 * Shift and dates, the same data serves every tool and any process: a
 * production line, a restaurant, a warehouse, a call centre, a clinic.
 * Change the "Lists" sheet (defect types, measurements, areas...) and use
 * QC Tools -> Rebuild form to adapt the check sheet to a new situation.
 */

// =====================================================================
// Configuration
// =====================================================================

var QC = {
  SHEETS: { RECORDS: 'Records', LISTS: 'Lists', SPECS: 'Specs', EVENTS: 'Events', HELP: 'How to use' },
  RECORD_HEADERS: ['Record ID', 'Timestamp', 'Date', 'Project', 'Area', 'Shift', 'Recorded By', 'Kind', 'Item', 'Value', 'Notes', 'Source'],
  LIST_HEADERS: ['Projects', 'Areas', 'Shifts', 'Defect Types', 'Measurements'],
  SPEC_HEADERS: ['Measurement', 'Unit', 'LSL', 'Target', 'USL'],
  EVENT_HEADERS: ['Date', 'Project', 'Label'],
  KIND: { COUNT: 'Count', MEASURE: 'Measure', INSPECTED: 'Inspected' },
  ALL_DEFECTS: 'All defects',
  UNITS_ITEM: 'Units inspected',
  DEFAULT_LISTS: {
    'Projects': ['General'],
    'Areas': ['Line 1', 'Line 2'],
    'Shifts': ['Day', 'Night'],
    'Defect Types': ['Scratch', 'Dent', 'Wrong part', 'Missing part', 'Other'],
    'Measurements': ['Temperature']
  },
  DEFAULT_SPECS: [['Temperature', '°C', 18, 21, 24]],
  DEMO: { PROJECT: 'Toaster final test', AREA: 'Final test', SOURCE: 'Demo' }
};

// =====================================================================
// Setup and admin actions (menu)
// =====================================================================

/** Run this once from the Apps Script editor. Safe to run again. */
function setup() {
  var props = PropertiesService.getScriptProperties();
  var bound = SpreadsheetApp.getActiveSpreadsheet();
  var ss = bound;
  if (!ss) {
    var id = props.getProperty('SPREADSHEET_ID');
    ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.create('QC Tools');
  }
  if (props.getProperty('OWNER')) assertOwner_();
  else props.setProperty('OWNER', Session.getEffectiveUser().getEmail());
  props.setProperty('SPREADSHEET_ID', ss.getId());

  ensureSheets_(ss);
  var form = buildForm_(ss);
  installTriggers_(ss, form, !bound);

  var msg = 'QC Tools is ready.\n' +
    'Data sheet: ' + ss.getUrl() + '\n' +
    'Check sheet form: ' + form.getPublishedUrl() + '\n' +
    'Reload the Sheet to see the "QC Tools" menu.';
  Logger.log(msg);
  try { ss.toast('Setup complete. Reload the Sheet to see the QC Tools menu.', 'QC Tools', 10); } catch (e) { /* no UI */ }
  return msg;
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('QC Tools')
    .addItem('Open dashboard', 'openDashboard')
    .addItem('Open check sheet form', 'showFormLink')
    .addSeparator()
    .addItem('Rebuild form from Lists', 'rebuildForm')
    .addItem('Import missing form responses', 'syncFormResponses')
    .addSeparator()
    .addItem('Load demo data (toaster example)', 'loadDemoData')
    .addItem('Remove demo data', 'removeDemoData')
    .addSeparator()
    .addItem('Run setup again', 'setup')
    .addToUi();
}

function openDashboard() {
  var html = HtmlService.createHtmlOutput(DASHBOARD_HTML_).setWidth(1200).setHeight(820);
  SpreadsheetApp.getUi().showModalDialog(html, 'QC Tools');
}

function showFormLink() {
  var url = PropertiesService.getScriptProperties().getProperty('FORM_URL');
  var body = url
    ? '<p style="font-family:sans-serif">Share this link with whoever collects data:</p>' +
      '<p style="font-family:sans-serif"><a target="_blank" href="' + url + '">' + url + '</a></p>'
    : '<p style="font-family:sans-serif">No form yet. Run QC Tools -> Run setup again.</p>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(body).setWidth(520).setHeight(160), 'Check sheet form');
}

/** Rebuild the Google Form after you edit the Lists sheet. */
function rebuildForm() {
  assertOwner_();
  var ss = getSpreadsheet_();
  var form = buildForm_(ss);
  ss.toast('Form rebuilt from the Lists sheet.', 'QC Tools', 6);
  return form.getPublishedUrl();
}

/** Copies any form responses that are not yet in Records (e.g. from before the trigger existed). */
function syncFormResponses() {
  assertOwner_();
  var ss = getSpreadsheet_();
  var form = getForm_();
  if (!form) throw new Error('No form found. Run setup first.');
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var have = {};
    readRecords_(ss).forEach(function (r) { have[String(r.id).split('#')[0]] = true; });
    var map = getFormMap_();
    var rows = [];
    form.getResponses().forEach(function (resp) {
      if (have[resp.getId()]) return;
      rows = rows.concat(answersToRecords_(responseToSubmission_(resp, ss), map));
    });
    appendRecords_(ss, rows);
    ss.toast(rows.length + ' record rows imported.', 'QC Tools', 6);
    return rows.length;
  } finally {
    lock.releaseLock();
  }
}

/** Adds 5 weeks of example data (the toaster story from the video). */
function loadDemoData() {
  assertOwner_();
  var ss = getSpreadsheet_();
  removeDemoRows_(ss);
  var today = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd');
  var demo = buildDemoRecords_(addDays_(today, -34));
  appendRecords_(ss, demo.rows);
  var ev = ss.getSheetByName(QC.SHEETS.EVENTS);
  demo.events.forEach(function (e) { ev.appendRow([e.day, e.project, e.label]); });
  var specs = ss.getSheetByName(QC.SHEETS.SPECS);
  var haveSpec = readSpecs_(ss)[demo.spec[0]];
  if (!haveSpec) specs.appendRow(demo.spec);
  ss.toast(demo.rows.length + ' demo rows added (project "' + QC.DEMO.PROJECT + '").', 'QC Tools', 8);
}

function removeDemoData() {
  assertOwner_();
  var ss = getSpreadsheet_();
  var n = removeDemoRows_(ss);
  ss.toast(n + ' demo rows removed.', 'QC Tools', 6);
}

// =====================================================================
// Web app + dashboard API (called from the page)
// =====================================================================

function doGet() {
  return HtmlService.createHtmlOutput(DASHBOARD_HTML_)
    .setTitle('QC Tools')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Everything the dashboard needs to build its menus. */
function apiMeta() {
  var ss = getSpreadsheet_();
  var lists = readLists_(ss);
  var recs = readRecords_(ss);
  var pick = function (field, extra) {
    return uniqSorted_((extra || []).concat(recs.map(function (r) { return r[field]; })).filter(Boolean));
  };
  var countItems = uniqSorted_(lists['Defect Types'].concat(
    recs.filter(function (r) { return r.kind === QC.KIND.COUNT; }).map(function (r) { return r.item; })));
  var measureItems = uniqSorted_(lists['Measurements'].concat(
    recs.filter(function (r) { return r.kind === QC.KIND.MEASURE; }).map(function (r) { return r.item; })));
  var days = recs.map(function (r) { return r.day; }).filter(Boolean).sort();
  var props = PropertiesService.getScriptProperties();
  return {
    projects: pick('project', lists['Projects']),
    areas: pick('area', lists['Areas']),
    shifts: pick('shift', lists['Shifts']),
    countSeries: [{ key: seriesKey_(QC.KIND.COUNT, QC.ALL_DEFECTS), label: QC.ALL_DEFECTS }].concat(
      countItems.map(function (i) { return { key: seriesKey_(QC.KIND.COUNT, i), label: 'Defects: ' + i }; })),
    measureSeries: measureItems.map(function (i) { return { key: seriesKey_(QC.KIND.MEASURE, i), label: 'Measure: ' + i }; }),
    firstDay: days[0] || '',
    lastDay: days[days.length - 1] || '',
    recordCount: recs.length,
    formUrl: props.getProperty('FORM_URL') || '',
    sheetUrl: ss.getUrl()
  };
}

/** Runs one tool on the filtered Records. filters = {project, area, shift, from, to}. */
function apiRun(tool, filters, opts) {
  var ss = getSpreadsheet_();
  var recs = filterRecords_(readRecords_(ss), filters);
  return runTool_(tool, recs, opts || {}, {
    specs: readSpecs_(ss),
    events: readEvents_(ss, filters && filters.project)
  });
}

// =====================================================================
// Form -> Records
// =====================================================================

/** Installable trigger target: turns one form submission into Records rows. */
function handleFormSubmit(e) {
  if (!e || !e.response || typeof e.response.getItemResponses !== 'function') return;
  var ss = getSpreadsheet_();
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    appendRecords_(ss, answersToRecords_(responseToSubmission_(e.response, ss), getFormMap_()));
  } finally {
    lock.releaseLock();
  }
}

function responseToSubmission_(resp, ss) {
  var answers = {};
  resp.getItemResponses().forEach(function (ir) { answers[String(ir.getItem().getId())] = ir.getResponse(); });
  var ts = resp.getTimestamp();
  return {
    responseId: resp.getId(),
    timestamp: ts,
    fallbackDay: Utilities.formatDate(ts, ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd'),
    answers: answers
  };
}

/**
 * Pure: converts one submission into Records rows.
 * map = { itemId: {role, name} }, role in date|project|area|shift|by|units|notes|count|measure.
 * Counts: if any count or "units inspected" is filled, every defect type is written
 * (blank = 0) so zero-defect checks are recorded as zero. Measurements: only filled ones.
 */
function answersToRecords_(sub, map) {
  var base = { day: sub.fallbackDay, project: '', area: '', shift: '', by: '', notes: '', units: null };
  var counts = [], measures = [];
  Object.keys(map).forEach(function (id) {
    var m = map[id];
    var raw = sub.answers[id];
    var val = raw == null ? '' : String(raw).trim();
    switch (m.role) {
      case 'date': if (val) base.day = normalizeDay_(val) || base.day; break;
      case 'project': base.project = val; break;
      case 'area': base.area = val; break;
      case 'shift': base.shift = val; break;
      case 'by': base.by = val; break;
      case 'notes': base.notes = val; break;
      case 'units': if (val !== '' && isFinite(Number(val))) base.units = Number(val); break;
      case 'count': counts.push({ name: m.name, val: val }); break;
      case 'measure': measures.push({ name: m.name, val: val }); break;
    }
  });
  var rows = [];
  var n = 0;
  var push = function (kind, item, value) {
    rows.push([sub.responseId + '#' + (n++), sub.timestamp, base.day, base.project, base.area, base.shift,
      base.by, kind, item, value, base.notes, 'Form']);
  };
  var anyCount = base.units !== null || counts.some(function (c) { return c.val !== ''; });
  if (base.units !== null) push(QC.KIND.INSPECTED, QC.UNITS_ITEM, base.units);
  if (anyCount) {
    counts.forEach(function (c) {
      var v = c.val === '' ? 0 : Number(c.val);
      push(QC.KIND.COUNT, c.name, isFinite(v) ? v : 0);
    });
  }
  measures.forEach(function (m) {
    if (m.val === '' || !isFinite(Number(m.val))) return;
    push(QC.KIND.MEASURE, m.name, Number(m.val));
  });
  return rows;
}

function buildForm_(ss) {
  var props = PropertiesService.getScriptProperties();
  var lists = readLists_(ss);
  var specs = readSpecs_(ss);
  var form = getForm_();
  if (!form) {
    form = FormApp.create('QC Check Sheet - ' + ss.getName());
    form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
    props.setProperty('FORM_ID', form.getId());
  }
  form.getItems().forEach(function (it) { form.deleteItem(it); });
  form.setTitle('QC Check Sheet - ' + ss.getName())
    .setDescription('Record what you checked. Who, when and where are saved with every entry.');

  var map = getFormMap_();
  var add = function (item, role, name) { map[String(item.getId())] = { role: role, name: name || '' }; return item; };
  var list = function (title, choices, role) {
    if (!choices.length) return;
    add(form.addListItem().setTitle(title).setChoiceValues(choices).setRequired(true), role);
  };
  var whole = FormApp.createTextValidation().setHelpText('Whole number, 0 or more')
    .requireTextMatchesPattern('^\\s*\\d+\\s*$').build();
  var number = FormApp.createTextValidation().setHelpText('Enter a number').requireNumber().build();

  add(form.addDateItem().setTitle('Date').setRequired(true), 'date');
  list('Project', lists['Projects'].length ? lists['Projects'] : ['General'], 'project');
  list('Area', lists['Areas'], 'area');
  list('Shift', lists['Shifts'], 'shift');
  add(form.addTextItem().setTitle('Recorded by').setRequired(true), 'by');

  if (lists['Defect Types'].length) {
    form.addSectionHeaderItem().setTitle('Check sheet - defect counts')
      .setHelpText('How many of each did you find? Leave blank or enter 0 for none.');
    add(form.addTextItem().setTitle(QC.UNITS_ITEM)
      .setHelpText('Optional: how many units did you check? Enables defect-rate charts.')
      .setValidation(whole), 'units');
    lists['Defect Types'].forEach(function (d) {
      add(form.addTextItem().setTitle(d).setValidation(whole), 'count', d);
    });
  }
  if (lists['Measurements'].length) {
    form.addSectionHeaderItem().setTitle('Measurements').setHelpText('Fill in only what you measured.');
    lists['Measurements'].forEach(function (m) {
      var unit = specs[m] && specs[m].unit ? ' (' + specs[m].unit + ')' : '';
      add(form.addTextItem().setTitle(m + unit).setValidation(number), 'measure', m);
    });
  }
  add(form.addParagraphTextItem().setTitle('Notes'), 'notes');

  props.setProperty('FORM_MAP', JSON.stringify(map));
  props.setProperty('FORM_URL', form.getPublishedUrl());
  return form;
}

function installTriggers_(ss, form, needOpenTrigger) {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var fn = t.getHandlerFunction();
    if (fn === 'handleFormSubmit' || (needOpenTrigger && fn === 'onOpen')) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('handleFormSubmit').forForm(form).onFormSubmit().create();
  if (needOpenTrigger) ScriptApp.newTrigger('onOpen').forSpreadsheet(ss).onOpen().create();
}

// =====================================================================
// Sheets: create, read, write
// =====================================================================

function ensureSheets_(ss) {
  var make = function (name, headers, seedRows) {
    var sh = ss.getSheetByName(name);
    var fresh = !sh;
    if (fresh) sh = ss.insertSheet(name);
    if (!sh.getRange(1, 1).getValue()) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#e8eefc');
      sh.setFrozenRows(1);
      if (seedRows && seedRows.length) sh.getRange(2, 1, seedRows.length, seedRows[0].length).setValues(seedRows);
    }
    return sh;
  };

  var rec = make(QC.SHEETS.RECORDS, QC.RECORD_HEADERS);
  rec.getRange('B:B').setNumberFormat('yyyy-mm-dd hh:mm');
  rec.getRange('C:C').setNumberFormat('yyyy-mm-dd');
  rec.getRange('B1:C1').setNumberFormat('@');
  var kindRule = SpreadsheetApp.newDataValidation()
    .requireValueInList([QC.KIND.COUNT, QC.KIND.MEASURE, QC.KIND.INSPECTED], true).setAllowInvalid(false).build();
  rec.getRange(2, 8, rec.getMaxRows() - 1, 1).setDataValidation(kindRule);

  var d = QC.DEFAULT_LISTS;
  var longest = Math.max.apply(null, QC.LIST_HEADERS.map(function (h) { return d[h].length; }));
  var listRows = [];
  for (var i = 0; i < longest; i++) listRows.push(QC.LIST_HEADERS.map(function (h) { return d[h][i] || ''; }));
  make(QC.SHEETS.LISTS, QC.LIST_HEADERS, listRows);
  make(QC.SHEETS.SPECS, QC.SPEC_HEADERS, QC.DEFAULT_SPECS);
  var ev = make(QC.SHEETS.EVENTS, QC.EVENT_HEADERS);
  ev.getRange('A:A').setNumberFormat('yyyy-mm-dd');
  ev.getRange('A1').setNumberFormat('@');

  var help = ss.getSheetByName(QC.SHEETS.HELP) || ss.insertSheet(QC.SHEETS.HELP);
  help.clear();
  var lines = [
    ['QC Tools - how to use'],
    [''],
    ['Records', 'The database. One row = one observation. Form entries land here automatically; you can also paste rows from other systems.'],
    ['', 'Kind = Count (defects/events), Measure (a measured number) or Inspected (units checked, Item = "Units inspected").'],
    ['Lists', 'Your projects, areas, shifts, defect types and measurements. Edit, then QC Tools -> Rebuild form.'],
    ['Specs', 'Spec limits (LSL / Target / USL) per measurement. Used by the histogram for capability.'],
    ['Events', 'Process changes (e.g. "Humidity control installed"). The control chart starts a new phase with new limits at each event.'],
    [''],
    ['Tools', 'Check Sheet: tally of counts by day/area/shift/person.'],
    ['', 'Pareto: which few categories cause most of the defects (80/20).'],
    ['', 'Scatter: does one thing move with another? Pairs two daily series, shows r.'],
    ['', 'Histogram: shape and spread of a measurement vs spec limits (Pp/Ppk).'],
    ['', 'Control Chart: is the process stable, and did a change work? (c, u or I-MR chart).'],
    [''],
    ['Reuse', 'Use Project/Area/Shift and the date filters to point every tool at a different process. New situation = new Project name + new Lists.']
  ];
  lines = lines.map(function (l) { return [l[0], l[1] || '']; });
  help.getRange(1, 1, lines.length, 2).setValues(lines);
  help.getRange('A1').setFontWeight('bold').setFontSize(14);
  help.getRange('A:A').setFontWeight('bold');
  help.setColumnWidth(1, 110);
  help.setColumnWidth(2, 760);

  var s1 = ss.getSheetByName('Sheet1');
  if (s1 && s1.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(s1);
}

function readRecords_(ss) {
  var sh = ss.getSheetByName(QC.SHEETS.RECORDS);
  if (!sh || sh.getLastRow() < 2) return [];
  var vals = sh.getRange(2, 1, sh.getLastRow() - 1, QC.RECORD_HEADERS.length).getValues();
  return rowsToRecords_(vals, ss.getSpreadsheetTimeZone());
}

/** Pure (apart from date formatting): sheet rows -> record objects. Invalid rows are skipped. */
function rowsToRecords_(vals, tz) {
  var kinds = {};
  kinds[QC.KIND.COUNT.toLowerCase()] = QC.KIND.COUNT;
  kinds[QC.KIND.MEASURE.toLowerCase()] = QC.KIND.MEASURE;
  kinds[QC.KIND.INSPECTED.toLowerCase()] = QC.KIND.INSPECTED;
  var out = [];
  vals.forEach(function (v) {
    var kind = kinds[String(v[7]).trim().toLowerCase()];
    var item = String(v[8]).trim();
    var value = typeof v[9] === 'number' ? v[9] : Number(String(v[9]).trim());
    var day = normalizeDay_(v[2], tz);
    if (!kind || !item || v[9] === '' || !isFinite(value) || !day) return;
    out.push({
      id: String(v[0]),
      ts: isDate_(v[1]) ? Utilities.formatDate(v[1], tz, 'yyyy-MM-dd HH:mm') : String(v[1] || ''),
      day: day,
      project: String(v[3]).trim(),
      area: String(v[4]).trim(),
      shift: String(v[5]).trim(),
      by: String(v[6]).trim(),
      kind: kind,
      item: item,
      value: value,
      notes: String(v[10] || ''),
      source: String(v[11] || '')
    });
  });
  return out;
}

function readLists_(ss) {
  var out = {};
  QC.LIST_HEADERS.forEach(function (h) { out[h] = []; });
  var sh = ss.getSheetByName(QC.SHEETS.LISTS);
  if (!sh || sh.getLastRow() < 1) return out;
  var vals = sh.getDataRange().getValues();
  var head = vals[0].map(function (h) { return String(h).trim(); });
  QC.LIST_HEADERS.forEach(function (h) {
    var c = head.indexOf(h);
    if (c < 0) return;
    for (var r = 1; r < vals.length; r++) {
      var s = String(vals[r][c]).trim();
      if (s && out[h].indexOf(s) < 0) out[h].push(s);
    }
  });
  return out;
}

function readSpecs_(ss) {
  var sh = ss.getSheetByName(QC.SHEETS.SPECS);
  var out = {};
  if (!sh || sh.getLastRow() < 2) return out;
  var num = function (x) { return x === '' || x === null || !isFinite(Number(x)) ? null : Number(x); };
  sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues().forEach(function (r) {
    var name = String(r[0]).trim();
    if (name) out[name] = { unit: String(r[1]).trim(), lsl: num(r[2]), target: num(r[3]), usl: num(r[4]) };
  });
  return out;
}

function readEvents_(ss, project) {
  var sh = ss.getSheetByName(QC.SHEETS.EVENTS);
  if (!sh || sh.getLastRow() < 2) return [];
  var tz = ss.getSpreadsheetTimeZone();
  return sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues()
    .map(function (r) { return { day: normalizeDay_(r[0], tz), project: String(r[1]).trim(), label: String(r[2]).trim() }; })
    .filter(function (e) { return e.day && (!project || !e.project || e.project === project); });
}

function appendRecords_(ss, rows) {
  if (!rows.length) return;
  var sh = ss.getSheetByName(QC.SHEETS.RECORDS);
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, QC.RECORD_HEADERS.length).setValues(rows);
}

function removeDemoRows_(ss) {
  var removed = 0;
  var prune = function (sheetName, col, value) {
    var sh = ss.getSheetByName(sheetName);
    if (!sh || sh.getLastRow() < 2) return;
    var width = sh.getLastColumn();
    var vals = sh.getRange(2, 1, sh.getLastRow() - 1, width).getValues();
    var keep = vals.filter(function (r) { return String(r[col]) !== value; });
    if (keep.length === vals.length) return;
    removed += vals.length - keep.length;
    sh.getRange(2, 1, vals.length, width).clearContent();
    if (keep.length) sh.getRange(2, 1, keep.length, width).setValues(keep);
  };
  prune(QC.SHEETS.RECORDS, 11, QC.DEMO.SOURCE);
  prune(QC.SHEETS.EVENTS, 1, QC.DEMO.PROJECT);
  return removed;
}

// =====================================================================
// Helpers
// =====================================================================

function getSpreadsheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) return ss;
  throw new Error('QC Tools is not set up yet. Run the "setup" function first.');
}

function getForm_() {
  var id = PropertiesService.getScriptProperties().getProperty('FORM_ID');
  if (!id) return null;
  try { return FormApp.openById(id); } catch (e) { return null; }
}

/** Item-id map is kept across rebuilds so older responses can still be imported. */
function getFormMap_() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('FORM_MAP') || '{}'); } catch (e) { return {}; }
}

/** Admin actions are limited to the person who ran setup. */
function assertOwner_() {
  var owner = PropertiesService.getScriptProperties().getProperty('OWNER');
  var me = Session.getActiveUser().getEmail();
  if (owner && me !== owner) throw new Error('Only the owner (' + owner + ') can run this action.');
}

function isDate_(v) { return Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime()); }

function pad2_(n) { n = String(n); return n.length < 2 ? '0' + n : n; }

function normalizeDay_(v, tz) {
  if (isDate_(v)) return Utilities.formatDate(v, tz || Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var m = String(v == null ? '' : v).trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  return m ? m[1] + '-' + pad2_(m[2]) + '-' + pad2_(m[3]) : '';
}

function addDays_(day, n) {
  var p = day.split('-').map(Number);
  return new Date(Date.UTC(p[0], p[1] - 1, p[2] + n)).toISOString().slice(0, 10);
}

// =====================================================================
// The five tools (pure functions: records in, results out)
// =====================================================================

function runTool_(tool, recs, opts, ctx) {
  switch (tool) {
    case 'check': return checkSheet_(recs, opts.columnsBy);
    case 'pareto': return pareto_(recs, opts.groupBy, opts.threshold);
    case 'scatter': return scatter_(recs, opts.x, opts.y);
    case 'histogram': {
      var s = parseSeriesKey_(opts.series || '');
      return histogram_(recs, opts.series, (ctx.specs || {})[s.item] || null, Number(opts.bins) || 0);
    }
    case 'control': return controlChart_(recs, opts.series, opts.type, ctx.events || []);
    default: throw new Error('Unknown tool: ' + tool);
  }
}

function round_(x, d) {
  if (x === null || x === undefined || !isFinite(x)) return null;
  var f = Math.pow(10, d === undefined ? 3 : d);
  return Math.round(x * f) / f;
}
function sum_(a) { return a.reduce(function (s, v) { return s + v; }, 0); }
function mean_(a) { return a.length ? sum_(a) / a.length : NaN; }
function stdev_(a) {
  if (a.length < 2) return NaN;
  var m = mean_(a);
  return Math.sqrt(a.reduce(function (s, v) { return s + (v - m) * (v - m); }, 0) / (a.length - 1));
}
function uniqSorted_(a) {
  var seen = {}, out = [];
  a.forEach(function (x) { if (!seen[x]) { seen[x] = true; out.push(x); } });
  return out.sort();
}
function seriesKey_(kind, item) { return kind + '|' + item; }
function parseSeriesKey_(key) {
  var i = String(key).indexOf('|');
  return i < 0 ? { kind: '', item: String(key) } : { kind: key.slice(0, i), item: key.slice(i + 1) };
}
function matchesSeries_(r, s) {
  if (s.kind === QC.KIND.COUNT) return r.kind === QC.KIND.COUNT && (s.item === QC.ALL_DEFECTS || r.item === s.item);
  return r.kind === s.kind && r.item === s.item;
}
function seriesLabel_(key) {
  var s = parseSeriesKey_(key);
  return s.kind === QC.KIND.COUNT && s.item !== QC.ALL_DEFECTS ? 'Defects: ' + s.item : s.item;
}

function filterRecords_(records, f) {
  f = f || {};
  return records.filter(function (r) {
    return (!f.project || r.project === f.project) &&
      (!f.area || r.area === f.area) &&
      (!f.shift || r.shift === f.shift) &&
      (!f.from || r.day >= f.from) &&
      (!f.to || r.day <= f.to);
  });
}

/** One value per day: counts are summed, measurements averaged. */
function dailySeries_(records, key) {
  var s = parseSeriesKey_(key);
  var by = {};
  records.forEach(function (r) {
    if (!matchesSeries_(r, s)) return;
    (by[r.day] = by[r.day] || []).push(r.value);
  });
  var days = Object.keys(by).sort();
  var agg = s.kind === QC.KIND.MEASURE ? mean_ : sum_;
  return { key: key, kind: s.kind, item: s.item, days: days, values: days.map(function (d) { return agg(by[d]); }) };
}

// ---- 1. Check sheet ---------------------------------------------------

function checkSheet_(records, columnsBy) {
  var dim = ['day', 'area', 'shift', 'by'].indexOf(columnsBy) >= 0 ? columnsBy : 'day';
  var colOf = function (r) { return r[dim] || '(blank)'; };
  var counts = records.filter(function (r) { return r.kind === QC.KIND.COUNT; });
  var cols = uniqSorted_(counts.map(colOf));
  var table = {};
  counts.forEach(function (r) {
    var t = table[r.item] = table[r.item] || {};
    t[colOf(r)] = (t[colOf(r)] || 0) + r.value;
  });
  var rows = Object.keys(table).map(function (item) {
    var cells = cols.map(function (c) { return table[item][c] || 0; });
    return { item: item, cells: cells, total: sum_(cells) };
  }).sort(function (a, b) { return b.total - a.total || (a.item < b.item ? -1 : 1); });
  var colTotals = cols.map(function (c, i) { return sum_(rows.map(function (r) { return r.cells[i]; })); });
  var recordedBy = cols.map(function (c) {
    return uniqSorted_(records.filter(function (r) { return colOf(r) === c && r.by; }).map(function (r) { return r.by; })).join(', ');
  });
  var units = cols.map(function (c) {
    return sum_(records.filter(function (r) { return r.kind === QC.KIND.INSPECTED && colOf(r) === c; }).map(function (r) { return r.value; }));
  });
  var days = uniqSorted_(counts.map(function (r) { return r.day; }));
  var grand = sum_(colTotals);
  return {
    tool: 'check', columnsBy: dim, columns: cols, rows: rows, colTotals: colTotals, grandTotal: grand,
    recordedBy: recordedBy, unitsInspected: units, dayCount: days.length,
    avgPerDay: days.length ? round_(grand / days.length, 2) : 0,
    from: days[0] || null, to: days[days.length - 1] || null
  };
}

// ---- 2. Pareto ------------------------------------------------------------

function pareto_(records, groupBy, threshold) {
  var dim = ['item', 'area', 'shift', 'project', 'by'].indexOf(groupBy) >= 0 ? groupBy : 'item';
  var t = Number(threshold) > 0 && Number(threshold) < 100 ? Number(threshold) : 80;
  var totals = {};
  records.forEach(function (r) {
    if (r.kind !== QC.KIND.COUNT) return;
    var k = r[dim] || '(blank)';
    totals[k] = (totals[k] || 0) + r.value;
  });
  var total = sum_(Object.keys(totals).map(function (k) { return totals[k]; }));
  var cum = 0;
  var rows = Object.keys(totals)
    .map(function (k) { return { label: k, count: totals[k] }; })
    .filter(function (r) { return r.count > 0; })
    .sort(function (a, b) { return b.count - a.count || (a.label < b.label ? -1 : 1); })
    .map(function (r) {
      var before = total ? (cum / total) * 100 : 0;
      cum += r.count;
      return {
        label: r.label, count: r.count,
        pct: round_(total ? (r.count / total) * 100 : 0, 1),
        cumPct: round_(total ? (cum / total) * 100 : 0, 1),
        vital: before < t
      };
    });
  var vital = rows.filter(function (r) { return r.vital; });
  return {
    tool: 'pareto', groupBy: dim, threshold: t, total: total, rows: rows,
    vitalFew: vital.map(function (r) { return r.label; }),
    vitalPct: vital.length ? vital[vital.length - 1].cumPct : 0
  };
}

// ---- 3. Scatter -----------------------------------------------------------

function linearFit_(xs, ys) {
  var n = xs.length;
  if (n < 3) return null;
  var mx = mean_(xs), my = mean_(ys), sxx = 0, syy = 0, sxy = 0;
  for (var i = 0; i < n; i++) {
    sxx += (xs[i] - mx) * (xs[i] - mx);
    syy += (ys[i] - my) * (ys[i] - my);
    sxy += (xs[i] - mx) * (ys[i] - my);
  }
  if (sxx === 0 || syy === 0) return null;
  var slope = sxy / sxx;
  return { r: sxy / Math.sqrt(sxx * syy), slope: slope, intercept: my - slope * mx };
}

function describeR_(r) {
  if (r === null || !isFinite(r)) return 'Not enough data: need at least 3 paired days, and both series must vary.';
  var a = Math.abs(r);
  if (a < 0.2) return 'No meaningful linear relationship';
  var s = a >= 0.8 ? 'Very strong' : a >= 0.6 ? 'Strong' : a >= 0.4 ? 'Moderate' : 'Weak';
  return s + (r > 0 ? ' positive' : ' negative') + ' relationship';
}

function scatter_(records, xKey, yKey) {
  var X = dailySeries_(records, xKey), Y = dailySeries_(records, yKey);
  var ym = {};
  Y.days.forEach(function (d, i) { ym[d] = Y.values[i]; });
  var pts = [];
  X.days.forEach(function (d, i) { if (d in ym) pts.push({ day: d, x: X.values[i], y: ym[d] }); });
  var fit = linearFit_(pts.map(function (p) { return p.x; }), pts.map(function (p) { return p.y; }));
  return {
    tool: 'scatter', xLabel: seriesLabel_(xKey), yLabel: seriesLabel_(yKey),
    points: pts.map(function (p) { return { day: p.day, x: round_(p.x, 3), y: round_(p.y, 3) }; }),
    n: pts.length,
    r: fit ? round_(fit.r, 3) : null,
    r2: fit ? round_(fit.r * fit.r, 3) : null,
    slope: fit ? round_(fit.slope, 4) : null,
    intercept: fit ? round_(fit.intercept, 4) : null,
    strength: describeR_(fit ? fit.r : null)
  };
}

// ---- 4. Histogram ---------------------------------------------------------

function histogram_(records, key, spec, binsWanted) {
  var s = parseSeriesKey_(key);
  var values = s.kind === QC.KIND.MEASURE
    ? records.filter(function (r) { return matchesSeries_(r, s); }).map(function (r) { return r.value; })
    : dailySeries_(records, key).values;
  var res = { tool: 'histogram', label: seriesLabel_(key), basis: s.kind === QC.KIND.MEASURE ? 'readings' : 'daily totals', n: values.length, spec: spec };
  if (!values.length) return res;

  var min = Math.min.apply(null, values), max = Math.max.apply(null, values);
  var allInt = values.every(function (v) { return Math.round(v) === v; });
  var k, start, w;
  if (binsWanted > 0) {
    k = Math.min(60, Math.round(binsWanted));
    w = (max - min) / k || 1;
    start = max === min ? min - 0.5 : min;
  } else if (allInt && max - min <= 30) {
    // Whole numbers with a small range: one bar per value.
    k = max - min + 1; w = 1; start = min - 0.5;
  } else {
    k = Math.min(30, Math.max(5, Math.ceil(Math.log(values.length) / Math.LN2 + 1))); // Sturges
    w = (max - min) / k || 1;
    start = max === min ? min - 0.5 : min;
  }
  var bins = [];
  for (var i = 0; i < k; i++) bins.push({ from: round_(start + i * w, 4), to: round_(start + (i + 1) * w, 4), count: 0 });
  values.forEach(function (v) {
    var b = Math.floor((v - start) / w);
    bins[Math.max(0, Math.min(k - 1, b))].count++;
  });

  var m = mean_(values), sd = stdev_(values);
  var lsl = spec ? spec.lsl : null, usl = spec ? spec.usl : null;
  var pp = null, ppk = null;
  if (sd > 0) {
    if (lsl !== null && usl !== null) pp = (usl - lsl) / (6 * sd);
    var sides = [];
    if (usl !== null) sides.push((usl - m) / (3 * sd));
    if (lsl !== null) sides.push((m - lsl) / (3 * sd));
    if (sides.length) ppk = Math.min.apply(null, sides);
  }
  var out = values.filter(function (v) { return (lsl !== null && v < lsl) || (usl !== null && v > usl); }).length;

  var lo = Math.min(start, lsl === null ? start : lsl - w), hi = Math.max(start + k * w, usl === null ? start + k * w : usl + w);
  var curve = [];
  if (sd > 0) {
    for (var j = 0; j <= 60; j++) {
      var x = lo + (hi - lo) * j / 60;
      var z = (x - m) / sd;
      curve.push({ x: round_(x, 4), y: round_(values.length * w * Math.exp(-0.5 * z * z) / (sd * Math.sqrt(2 * Math.PI)), 4) });
    }
  }
  res.bins = bins; res.binWidth = round_(w, 4);
  res.axisMin = round_(lo, 4); res.axisMax = round_(hi, 4);
  res.mean = round_(m, 3); res.sd = round_(sd, 3);
  res.min = round_(min, 3); res.max = round_(max, 3);
  res.pp = round_(pp, 2); res.ppk = round_(ppk, 2);
  res.outOfSpec = out; res.outOfSpecPct = round_(out / values.length * 100, 1);
  res.curve = curve;
  return res;
}

// ---- 5. Control chart -----------------------------------------------------

var RULES_ = {
  1: 'Point outside the control limits',
  2: '8 points in a row on one side of the center line',
  3: '6 points in a row steadily rising or falling'
};

/**
 * Measurements -> I-MR chart (every reading). Counts -> c chart (defects per day)
 * or u chart (defects per unit, when "Units inspected" exists for every day).
 * Each event in the Events sheet starts a new phase with its own limits.
 */
function controlChart_(records, key, type, events) {
  var s = parseSeriesKey_(key);
  var pts, chartType, note = '';
  if (s.kind === QC.KIND.MEASURE) {
    chartType = 'I-MR';
    pts = records.filter(function (r) { return matchesSeries_(r, s); })
      .sort(function (a, b) { return a.day < b.day ? -1 : a.day > b.day ? 1 : (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0); })
      .map(function (r) { return { day: r.day, label: r.ts || r.day, value: r.value }; });
  } else {
    var d = dailySeries_(records, key);
    var um = {};
    var u = dailySeries_(records, seriesKey_(QC.KIND.INSPECTED, QC.UNITS_ITEM));
    u.days.forEach(function (day, i) { um[day] = u.values[i]; });
    var hasUnits = d.days.length > 0 && d.days.every(function (day) { return um[day] > 0; });
    if (type === 'u' && !hasUnits) note = 'u chart needs "Units inspected" for every day, so a c chart is shown.';
    chartType = (type === 'u' || !type || type === 'auto') && hasUnits ? 'u' : 'c';
    pts = d.days.map(function (day, i) {
      return { day: day, label: day, defects: d.values[i], n: um[day] || null,
        value: chartType === 'u' ? d.values[i] / um[day] : d.values[i] };
    });
  }

  var evs = (events || []).filter(function (e) { return e.day; }).sort(function (a, b) { return a.day < b.day ? -1 : 1; });
  pts.forEach(function (p) { p.phase = evs.filter(function (e) { return e.day <= p.day; }).length; });

  var phases = [];
  var groups = {};
  pts.forEach(function (p, i) { (groups[p.phase] = groups[p.phase] || []).push(i); });
  Object.keys(groups).map(Number).sort(function (a, b) { return a - b; }).forEach(function (ph) {
    var idx = groups[ph];
    var vals = idx.map(function (i) { return pts[i].value; });
    var info = { name: ph === 0 ? 'Baseline' : evs[ph - 1].label, from: pts[idx[0]].day, to: pts[idx[idx.length - 1]].day, n: idx.length };
    if (chartType === 'I-MR') {
      var mrs = [];
      idx.forEach(function (i, j) {
        pts[i].mr = j === 0 ? null : Math.abs(pts[i].value - pts[idx[j - 1]].value);
        if (j > 0) mrs.push(pts[i].mr);
      });
      var xbar = mean_(vals), mrbar = mrs.length ? mean_(mrs) : NaN;
      idx.forEach(function (i) {
        var p = pts[i];
        p.center = xbar;
        p.ucl = isFinite(mrbar) ? xbar + 2.66 * mrbar : null;
        p.lcl = isFinite(mrbar) ? xbar - 2.66 * mrbar : null;
        p.mrCenter = isFinite(mrbar) ? mrbar : null;
        p.mrUcl = isFinite(mrbar) ? 3.267 * mrbar : null;
      });
      info.center = xbar; info.ucl = pts[idx[0]].ucl; info.lcl = pts[idx[0]].lcl; info.mrBar = mrbar;
    } else if (chartType === 'c') {
      var cbar = mean_(vals);
      idx.forEach(function (i) {
        pts[i].center = cbar;
        pts[i].ucl = cbar + 3 * Math.sqrt(cbar);
        pts[i].lcl = Math.max(0, cbar - 3 * Math.sqrt(cbar));
      });
      info.center = cbar; info.ucl = pts[idx[0]].ucl; info.lcl = pts[idx[0]].lcl;
    } else {
      var ubar = sum_(idx.map(function (i) { return pts[i].defects; })) / sum_(idx.map(function (i) { return pts[i].n; }));
      idx.forEach(function (i) {
        var sig = 3 * Math.sqrt(ubar / pts[i].n);
        pts[i].center = ubar; pts[i].ucl = ubar + sig; pts[i].lcl = Math.max(0, ubar - sig);
      });
      info.center = ubar; info.ucl = null; info.lcl = null; // limits vary with daily volume
    }
    applyRules_(pts, idx);
    phases.push(info);
  });

  var signals = [];
  pts.forEach(function (p) { if (p.rules.length) signals.push({ label: p.label, value: round_(p.value, 4), rules: p.rules }); });
  var change = phases.length > 1 && phases[0].center
    ? round_((phases[phases.length - 1].center - phases[0].center) / Math.abs(phases[0].center) * 100, 1) : null;

  return {
    tool: 'control', chartType: chartType, label: seriesLabel_(key), note: note, rules: RULES_,
    points: pts.map(function (p) {
      return {
        label: p.label, day: p.day, phase: p.phase, value: round_(p.value, 4),
        center: round_(p.center, 4), ucl: round_(p.ucl, 4), lcl: round_(p.lcl, 4),
        mr: p.mr === undefined ? undefined : round_(p.mr, 4),
        mrCenter: round_(p.mrCenter, 4), mrUcl: round_(p.mrUcl, 4), rules: p.rules
      };
    }),
    phases: phases.map(function (ph) {
      return { name: ph.name, from: ph.from, to: ph.to, n: ph.n, center: round_(ph.center, 4),
        ucl: round_(ph.ucl, 4), lcl: round_(ph.lcl, 4), mrBar: round_(ph.mrBar, 4) };
    }),
    signals: signals,
    changePct: change
  };
}

/** Western Electric style rules 1-3, applied within one phase. */
function applyRules_(pts, idx) {
  var side = 0, run = 0, dir = 0, trend = 1;
  idx.forEach(function (i, j) {
    var p = pts[i];
    p.rules = [];
    if ((p.ucl !== null && p.value > p.ucl + 1e-9) || (p.lcl !== null && p.value < p.lcl - 1e-9)) p.rules.push(1);

    var sd = p.value > p.center + 1e-9 ? 1 : p.value < p.center - 1e-9 ? -1 : 0;
    run = sd !== 0 && sd === side ? run + 1 : (sd !== 0 ? 1 : 0);
    side = sd;
    if (run >= 8) p.rules.push(2);

    if (j > 0) {
      var prev = pts[idx[j - 1]].value;
      var dd = p.value > prev ? 1 : p.value < prev ? -1 : 0;
      trend = dd !== 0 && dd === dir ? trend + 1 : (dd !== 0 ? 2 : 1);
      dir = dd;
      if (trend >= 6) p.rules.push(3);
    }
  });
}

// =====================================================================
// Demo data: the toaster example from the video
// =====================================================================

function buildDemoRecords_(startDay) {
  var seed = 20240601;
  var rnd = function () { // mulberry32: repeatable pseudo-random numbers
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  var normal = function () { return Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd()); };
  var poisson = function (lam) {
    var L = Math.exp(-lam), k = 0, p = 1;
    do { k++; p *= rnd(); } while (p > L);
    return k - 1;
  };
  var others = [['Heating element', 2.4], ['Timer', 1.9], ['Lever / spring', 1.6], ['Crumb tray', 1.1],
    ['Cord / plug', 0.9], ['Housing damage', 0.8], ['Label / marking', 0.5]];
  var rows = [];
  for (var d = 0; d < 35; d++) {
    var day = addDays_(startDay, d);
    var controlled = d >= 8;          // humidity control installed on day 9
    var wet = d >= 3;                 // rainstorm raises humidity from day 4
    var base = controlled ? 20 : wet ? 47 : 18;
    var hums = [0, 6, 12, 18].map(function (h) { return { h: h, v: round_(base + normal() * (controlled ? 1.5 : 4), 1) }; });
    var pcbPerDay = Math.max(0.2, (mean_(hums.map(function (x) { return x.v; })) - 12) * 0.3);
    [['Day', 'Operator A', [6, 12]], ['Night', 'Operator B', [18, 0]]].forEach(function (sh) {
      var id = 'demo-' + day + '-' + sh[0], n = 0;
      var stamp = day + (sh[0] === 'Day' ? ' 14:00' : ' 22:00');
      var push = function (kind, item, value, ts) {
        rows.push([id + '#' + (n++), ts || stamp, day, QC.DEMO.PROJECT, QC.DEMO.AREA, sh[0], sh[1], kind, item, value, '', QC.DEMO.SOURCE]);
      };
      push(QC.KIND.INSPECTED, QC.UNITS_ITEM, 95 + Math.floor(rnd() * 15));
      push(QC.KIND.COUNT, 'Control PCB', poisson(pcbPerDay / 2));
      others.forEach(function (o) { push(QC.KIND.COUNT, o[0], poisson(o[1] / 2)); });
      hums.filter(function (x) { return sh[2].indexOf(x.h) >= 0; }).forEach(function (x) {
        push(QC.KIND.MEASURE, 'Humidity', x.v, day + ' ' + pad2_(x.h) + ':00');
      });
    });
  }
  return {
    rows: rows,
    events: [{ day: addDays_(startDay, 8), project: QC.DEMO.PROJECT, label: 'Humidity control installed' }],
    spec: ['Humidity', '%RH', 10, 20, 35]
  };
}

// =====================================================================
// Dashboard page (served by doGet and by QC Tools -> Open dashboard)
// =====================================================================

var DASHBOARD_HTML_ = String.raw`<!DOCTYPE html>
<html>
<head>
<base target="_top">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>QC Tools</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<style>
  :root { --bg:#f6f7fb; --card:#fff; --ink:#1d2433; --muted:#5b6475; --line:#dde2ec; --accent:#2f5fd0; --accent-soft:#e8eefc; --bad:#c62828; --good:#2e7d32; color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font:14px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  header { display:flex; flex-wrap:wrap; gap:8px 16px; align-items:center; justify-content:space-between; padding:14px 16px; background:var(--card); border-bottom:1px solid var(--line); }
  header h1 { margin:0; font-size:18px; }
  header a { color:var(--accent); text-decoration:none; margin-left:14px; }
  nav { display:flex; gap:6px; overflow-x:auto; padding:10px 16px 0; }
  nav button { border:1px solid var(--line); background:var(--card); color:var(--ink); border-radius:8px 8px 0 0; padding:8px 14px; cursor:pointer; white-space:nowrap; font:inherit; }
  nav button.on { background:var(--accent); color:#fff; border-color:var(--accent); }
  .bar { display:flex; flex-wrap:wrap; gap:10px 14px; align-items:flex-end; padding:12px 16px; background:var(--card); border-top:1px solid var(--line); border-bottom:1px solid var(--line); }
  .bar label { display:flex; flex-direction:column; font-size:12px; color:var(--muted); gap:3px; }
  .bar select, .bar input { font:inherit; padding:6px 8px; border:1px solid var(--line); border-radius:6px; background:#fff; color:var(--ink); min-width:120px; max-width:260px; }
  .bar input[type=number] { min-width:80px; width:90px; }
  .bar button { font:inherit; padding:7px 14px; border:0; border-radius:6px; background:var(--accent); color:#fff; cursor:pointer; }
  .opts { background:var(--accent-soft); }
  main { padding:16px; max-width:1200px; margin:0 auto; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:14px 16px; margin-bottom:14px; }
  .insight h2 { margin:0 0 6px; font-size:16px; }
  .insight p { margin:4px 0; }
  .stats { display:flex; flex-wrap:wrap; gap:10px; margin-top:8px; }
  .stat { background:var(--bg); border-radius:8px; padding:8px 12px; min-width:110px; }
  .stat b { display:block; font-size:18px; }
  .stat span { font-size:12px; color:var(--muted); }
  .chartbox { position:relative; height:380px; }
  .chartbox.small { height:220px; }
  .scroll { overflow-x:auto; }
  table { border-collapse:collapse; width:100%; font-size:13px; }
  th, td { border:1px solid var(--line); padding:5px 8px; text-align:right; white-space:nowrap; }
  th:first-child, td:first-child { text-align:left; }
  thead th { background:var(--accent-soft); position:sticky; top:0; }
  tr.total td { font-weight:bold; background:var(--bg); }
  tr.vital td { background:#fff4e5; }
  td.hot { background:#fde2e1; }
  .muted { color:var(--muted); font-size:12px; }
  .bad { color:var(--bad); font-weight:600; }
  .good { color:var(--good); font-weight:600; }
  #status { min-height:20px; color:var(--muted); }
  [hidden] { display:none !important; }
  @media (max-width:600px) { .chartbox { height:300px; } header a { margin-left:0; margin-right:14px; } }
</style>
</head>
<body>
<header>
  <h1>QC Tools</h1>
  <div><a id="formLink" target="_blank" hidden>Check sheet form</a><a id="sheetLink" target="_blank" hidden>Data sheet</a></div>
</header>
<nav id="tabs">
  <button data-tool="check" class="on">1 · Check Sheet</button>
  <button data-tool="pareto">2 · Pareto</button>
  <button data-tool="scatter">3 · Scatter</button>
  <button data-tool="histogram">4 · Histogram</button>
  <button data-tool="control">5 · Control Chart</button>
</nav>
<div class="bar">
  <label>Project<select id="fProject"></select></label>
  <label>Area<select id="fArea"></select></label>
  <label>Shift<select id="fShift"></select></label>
  <label>From<input type="date" id="fFrom"></label>
  <label>To<input type="date" id="fTo"></label>
  <button id="refresh">Update</button>
</div>
<div class="bar opts">
  <label data-for="check">Columns<select id="oColumns"><option value="day">Day</option><option value="area">Area</option><option value="shift">Shift</option><option value="by">Recorded by</option></select></label>
  <label data-for="check">Target reduction %<input type="number" id="oTarget" value="25" min="1" max="99"></label>
  <label data-for="pareto">Group by<select id="oGroup"><option value="item">Defect type</option><option value="area">Area</option><option value="shift">Shift</option><option value="project">Project</option><option value="by">Recorded by</option></select></label>
  <label data-for="pareto">Vital-few cut-off %<input type="number" id="oThreshold" value="80" min="1" max="99"></label>
  <label data-for="scatter">X (cause, independent)<select id="oX"></select></label>
  <label data-for="scatter">Y (effect, response)<select id="oY"></select></label>
  <label data-for="histogram">Data<select id="oHist"></select></label>
  <label data-for="histogram">Bins (blank = auto)<input type="number" id="oBins" min="1" max="60"></label>
  <label data-for="control">Data<select id="oCtrl"></select></label>
  <label data-for="control">Chart type<select id="oType"><option value="auto">Auto</option><option value="c">c chart (defects per day)</option><option value="u">u chart (defects per unit)</option></select></label>
</div>
<main>
  <div id="status">Loading…</div>
  <div class="card insight" id="insight" hidden></div>
  <div class="card" id="chartCard" hidden><div class="chartbox"><canvas id="chart1"></canvas></div></div>
  <div class="card" id="chartCard2" hidden><div class="chartbox small"><canvas id="chart2"></canvas></div></div>
  <div class="card scroll" id="tableCard" hidden></div>
</main>
<script>
var META = null, TOOL = 'check', CHARTS = [];
var C = { bar:'#4a78e0', line:'#e07a1f', ucl:'#c62828', center:'#2e7d32', spec:'#8e24aa', point:'#1d2433', bad:'#c62828', soft:'rgba(74,120,224,.25)' };

function $(id) { return document.getElementById(id); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
function fmt(x, d) { if (x === null || x === undefined || !isFinite(x)) return '–'; var f = Math.pow(10, d === undefined ? 2 : d); return String(Math.round(x * f) / f); }
function stat(label, value) { return '<div class="stat"><b>' + esc(value) + '</b><span>' + esc(label) + '</span></div>'; }
function weekday(day) { var d = new Date(day + 'T12:00:00'); return isNaN(d) ? '' : d.toLocaleDateString(undefined, { weekday: 'short' }); }

function call(fn, args, ok) {
  $('status').textContent = 'Loading…';
  var runner = google.script.run
    .withSuccessHandler(function (res) { $('status').textContent = ''; ok(res); })
    .withFailureHandler(function (err) { $('status').innerHTML = '<span class="bad">Error: ' + esc(err && err.message ? err.message : err) + '</span>'; });
  runner[fn].apply(runner, args);
}

function fillSelect(el, items, allLabel) {
  var html = allLabel ? '<option value="">' + esc(allLabel) + '</option>' : '';
  items.forEach(function (it) {
    var v = typeof it === 'string' ? it : it.key, l = typeof it === 'string' ? it : it.label;
    html += '<option value="' + esc(v) + '">' + esc(l) + '</option>';
  });
  el.innerHTML = html;
}

function filters() {
  return { project: $('fProject').value, area: $('fArea').value, shift: $('fShift').value, from: $('fFrom').value, to: $('fTo').value };
}

function options() {
  switch (TOOL) {
    case 'check': return { columnsBy: $('oColumns').value };
    case 'pareto': return { groupBy: $('oGroup').value, threshold: Number($('oThreshold').value) };
    case 'scatter': return { x: $('oX').value, y: $('oY').value };
    case 'histogram': return { series: $('oHist').value, bins: $('oBins').value };
    case 'control': return { series: $('oCtrl').value, type: $('oType').value };
  }
}

function setTool(t) {
  TOOL = t;
  Array.prototype.forEach.call(document.querySelectorAll('#tabs button'), function (b) { b.className = b.getAttribute('data-tool') === t ? 'on' : ''; });
  Array.prototype.forEach.call(document.querySelectorAll('[data-for]'), function (el) { el.hidden = el.getAttribute('data-for') !== t; });
  run();
}

function run() { call('apiRun', [TOOL, filters(), options()], render); }

function reset() {
  CHARTS.forEach(function (c) { c.destroy(); });
  CHARTS = [];
  ['insight', 'chartCard', 'chartCard2', 'tableCard'].forEach(function (id) { $(id).hidden = true; });
}

function show(id, html) { var el = $(id); if (html !== undefined) el.innerHTML = html; el.hidden = false; }

function chart(canvasId, cfg) {
  cfg.options = cfg.options || {};
  cfg.options.responsive = true;
  cfg.options.maintainAspectRatio = false;
  cfg.options.animation = false;
  var c = new Chart($(canvasId), cfg);
  CHARTS.push(c);
  return c;
}

function empty(msg) { show('insight', '<h2>No data</h2><p>' + esc(msg) + '</p>'); }

function render(res) {
  reset();
  ({ check: renderCheck, pareto: renderPareto, scatter: renderScatter, histogram: renderHistogram, control: renderControl })[res.tool](res);
}

// ---- 1. Check sheet ----
function renderCheck(r) {
  if (!r.rows.length) return empty('No defect counts match these filters. Submit the check sheet form or load the demo data.');
  var target = Number($('oTarget').value) || 25;
  var cut = r.avgPerDay * target / 100;
  show('insight', '<h2>Check sheet</h2>' +
    '<p><b>' + r.grandTotal + '</b> defects recorded over <b>' + r.dayCount + '</b> day(s), ' + esc(r.from) + ' to ' + esc(r.to) + '.</p>' +
    '<p>Target: reduce by ' + target + '% = about <b>' + fmt(cut, 1) + '</b> fewer defects per day, i.e. aim for <b>' + fmt(r.avgPerDay - cut, 1) + '</b> per day or less.</p>' +
    '<div class="stats">' + stat('Total defects', r.grandTotal) + stat('Average per day', fmt(r.avgPerDay, 1)) + stat('Target per day', fmt(r.avgPerDay - cut, 1)) + stat('Defect types', r.rows.length) + '</div>');
  var max = 0;
  r.rows.forEach(function (row) { row.cells.forEach(function (v) { if (v > max) max = v; }); });
  var head = '<tr><th>Defect type</th>' + r.columns.map(function (c) {
    return '<th>' + esc(c) + (r.columnsBy === 'day' ? '<br><span class="muted">' + weekday(c) + '</span>' : '') + '</th>';
  }).join('') + '<th>Total</th></tr>';
  var body = r.rows.map(function (row) {
    return '<tr><td>' + esc(row.item) + '</td>' + row.cells.map(function (v) {
      return '<td' + (max && v >= max * 0.6 && v > 0 ? ' class="hot"' : '') + '>' + (v || '') + '</td>';
    }).join('') + '<td><b>' + row.total + '</b></td></tr>';
  }).join('');
  var foot = '<tr class="total"><td>Total</td>' + r.colTotals.map(function (v) { return '<td>' + v + '</td>'; }).join('') + '<td>' + r.grandTotal + '</td></tr>' +
    '<tr><td class="muted">Units inspected</td>' + r.unitsInspected.map(function (v) { return '<td class="muted">' + (v || '') + '</td>'; }).join('') + '<td class="muted">' + r.unitsInspected.reduce(function (a, b) { return a + b; }, 0) + '</td></tr>' +
    '<tr><td class="muted">Recorded by</td>' + r.recordedBy.map(function (v) { return '<td class="muted" style="white-space:normal;min-width:80px">' + esc(v) + '</td>'; }).join('') + '<td></td></tr>';
  show('tableCard', '<table><thead>' + head + '</thead><tbody>' + body + foot + '</tbody></table>');
  show('chartCard');
  chart('chart1', {
    type: 'bar',
    data: { labels: r.columns, datasets: r.rows.map(function (row, i) {
      return { label: row.item, data: row.cells, backgroundColor: 'hsl(' + ((i * 47 + 215) % 360) + ',60%,' + (48 + (i % 3) * 8) + '%)' };
    }) },
    options: { scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Defects' } } }, plugins: { legend: { position: 'bottom' } } }
  });
}

// ---- 2. Pareto ----
function renderPareto(r) {
  if (!r.rows.length) return empty('No defect counts match these filters.');
  var top = r.rows[0];
  show('insight', '<h2>Pareto analysis</h2>' +
    '<p><b>' + esc(top.label) + '</b> alone causes <b>' + top.pct + '%</b> of ' + r.total + ' defects.</p>' +
    '<p>The vital few (' + r.vitalFew.length + ' of ' + r.rows.length + ' categories): <b>' + r.vitalFew.map(esc).join(', ') + '</b> together cause ' + r.vitalPct + '%. Focus the root-cause work (fishbone) here first.</p>');
  show('chartCard');
  chart('chart1', {
    type: 'bar',
    data: { labels: r.rows.map(function (x) { return x.label; }), datasets: [
      { type: 'line', label: 'Cumulative %', data: r.rows.map(function (x) { return x.cumPct; }), borderColor: C.line, backgroundColor: C.line, yAxisID: 'y2', tension: 0, order: 0 },
      { type: 'line', label: r.threshold + '% line', data: r.rows.map(function () { return r.threshold; }), borderColor: '#999', borderDash: [6, 4], pointRadius: 0, yAxisID: 'y2', order: 1 },
      { label: 'Count', data: r.rows.map(function (x) { return x.count; }), backgroundColor: r.rows.map(function (x) { return x.vital ? C.bar : '#a9bde9'; }), order: 2 }
    ] },
    options: { scales: { y: { beginAtZero: true, title: { display: true, text: 'Count' } }, y2: { position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false }, ticks: { callback: function (v) { return v + '%'; } } } }, plugins: { legend: { position: 'bottom' } } }
  });
  show('tableCard', '<table><thead><tr><th>' + esc($('oGroup').selectedOptions[0].text) + '</th><th>Count</th><th>%</th><th>Cumulative %</th></tr></thead><tbody>' +
    r.rows.map(function (x) { return '<tr' + (x.vital ? ' class="vital"' : '') + '><td>' + esc(x.label) + (x.vital ? ' <span class="muted">vital few</span>' : '') + '</td><td>' + x.count + '</td><td>' + x.pct + '</td><td>' + x.cumPct + '</td></tr>'; }).join('') +
    '<tr class="total"><td>Total</td><td>' + r.total + '</td><td>100</td><td></td></tr></tbody></table>');
}

// ---- 3. Scatter ----
function renderScatter(r) {
  if (!r.n) return empty('No days have data for both series. Record both on the same days, or pick other series.');
  var eq = r.slope === null ? '' : '<p>Trend line: Y = ' + fmt(r.slope, 3) + ' × X ' + (r.intercept < 0 ? '− ' : '+ ') + fmt(Math.abs(r.intercept), 2) + '. Use it to pick an X setting that keeps Y at target.</p>';
  show('insight', '<h2>Scatter diagram</h2>' +
    '<p><b>' + esc(r.strength) + '</b> between ' + esc(r.xLabel) + ' and ' + esc(r.yLabel) + ' (' + r.n + ' paired days).</p>' + eq +
    '<div class="stats">' + stat('Pearson r', fmt(r.r, 2)) + stat('R²', r.r2 === null ? '–' : fmt(r.r2 * 100, 0) + '%') + stat('Paired days', r.n) + '</div>' +
    '<p class="muted">Correlation is not causation. Confirm the cause with a test or experiment before you change the process.</p>');
  var xs = r.points.map(function (p) { return p.x; });
  var lo = Math.min.apply(null, xs), hi = Math.max.apply(null, xs);
  var ds = [{ type: 'scatter', label: 'Days', data: r.points, backgroundColor: C.bar, pointRadius: 5 }];
  if (r.slope !== null) ds.push({ type: 'line', label: 'Trend line', data: [{ x: lo, y: r.intercept + r.slope * lo }, { x: hi, y: r.intercept + r.slope * hi }], borderColor: C.line, pointRadius: 0 });
  show('chartCard');
  chart('chart1', {
    type: 'scatter', data: { datasets: ds },
    options: {
      scales: { x: { type: 'linear', title: { display: true, text: r.xLabel } }, y: { title: { display: true, text: r.yLabel } } },
      plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: function (ctx) { var p = ctx.raw; return (p.day ? p.day + ': ' : '') + 'X ' + fmt(p.x, 2) + ', Y ' + fmt(p.y, 2); } } } }
    }
  });
  show('tableCard', '<table><thead><tr><th>Day</th><th>' + esc(r.xLabel) + '</th><th>' + esc(r.yLabel) + '</th></tr></thead><tbody>' +
    r.points.map(function (p) { return '<tr><td>' + esc(p.day) + ' <span class="muted">' + weekday(p.day) + '</span></td><td>' + fmt(p.x, 2) + '</td><td>' + fmt(p.y, 2) + '</td></tr>'; }).join('') + '</tbody></table>');
}

// ---- 4. Histogram ----
function renderHistogram(r) {
  if (!r.n) return empty('No values for this series in the selected filters.');
  var sp = r.spec || {};
  var cap = r.ppk === null ? 'Add LSL/USL for this measurement in the Specs sheet to see capability.' :
    (r.ppk >= 1.33 ? '<span class="good">Capable</span> (Ppk ≥ 1.33).' : r.ppk >= 1 ? '<span class="bad">Marginal</span> (1.0 ≤ Ppk < 1.33).' : '<span class="bad">Not capable</span> (Ppk < 1.0): the process spread does not fit inside the spec.');
  show('insight', '<h2>Histogram · ' + esc(r.label) + '</h2>' +
    '<p>' + r.n + ' ' + esc(r.basis) + '. Mean ' + fmt(r.mean, 2) + (sp.unit ? ' ' + esc(sp.unit) : '') + ', standard deviation ' + fmt(r.sd, 2) + '. ' + cap + '</p>' +
    '<div class="stats">' + stat('n', r.n) + stat('Mean', fmt(r.mean, 2)) + stat('Std dev', fmt(r.sd, 2)) + stat('Min / Max', fmt(r.min, 2) + ' / ' + fmt(r.max, 2)) +
    (sp.lsl !== null && sp.lsl !== undefined ? stat('LSL', sp.lsl) : '') + (sp.usl !== null && sp.usl !== undefined ? stat('USL', sp.usl) : '') +
    stat('Pp', fmt(r.pp, 2)) + stat('Ppk', fmt(r.ppk, 2)) + (r.spec ? stat('Out of spec', r.outOfSpec + ' (' + r.outOfSpecPct + '%)') : '') + '</div>' +
    '<p class="muted">Look at the shape: one peak (normal), skewed, two peaks (two sources mixed, e.g. two shifts or before/after a change), or cut off. Pp/Ppk use the overall standard deviation.</p>');
  var ymax = Math.ceil(Math.max.apply(null, r.bins.map(function (b) { return b.count; })) * 1.15) || 1;
  var ds = [{ type: 'bar', label: 'Frequency', data: r.bins.map(function (b) { return { x: (b.from + b.to) / 2, y: b.count }; }), backgroundColor: C.bar, borderColor: '#fff', borderWidth: 1, barPercentage: 1, categoryPercentage: 1, order: 3 }];
  if (r.curve && r.curve.length) ds.push({ type: 'line', label: 'Normal curve', data: r.curve, borderColor: C.line, pointRadius: 0, tension: 0.3, order: 1 });
  function vline(x, label, color) { ds.push({ type: 'line', label: label + ' ' + x, data: [{ x: x, y: 0 }, { x: x, y: ymax }], borderColor: color, borderDash: [6, 4], pointRadius: 0, order: 0 }); }
  if (sp.lsl !== null && sp.lsl !== undefined) vline(sp.lsl, 'LSL', C.ucl);
  if (sp.target !== null && sp.target !== undefined) vline(sp.target, 'Target', C.center);
  if (sp.usl !== null && sp.usl !== undefined) vline(sp.usl, 'USL', C.ucl);
  show('chartCard');
  chart('chart1', {
    type: 'bar', data: { datasets: ds },
    options: { scales: { x: { type: 'linear', min: r.axisMin, max: r.axisMax, title: { display: true, text: r.label + (sp.unit ? ' (' + sp.unit + ')' : '') } }, y: { beginAtZero: true, max: ymax, title: { display: true, text: 'Frequency' } } }, plugins: { legend: { position: 'bottom' } } }
  });
  show('tableCard', '<table><thead><tr><th>Bin</th><th>Count</th></tr></thead><tbody>' +
    r.bins.map(function (b) { return '<tr><td>' + fmt(b.from, 2) + ' to ' + fmt(b.to, 2) + '</td><td>' + b.count + '</td></tr>'; }).join('') + '</tbody></table>');
}

// ---- 5. Control chart ----
function renderControl(r) {
  if (!r.points.length) return empty('No data for this series in the selected filters.');
  var names = { 'I-MR': 'Individuals (I-MR) chart', c: 'c chart: defects per day', u: 'u chart: defects per unit inspected' };
  var d = r.chartType === 'u' ? 4 : 2;
  var last = r.phases[r.phases.length - 1];
  var change = r.changePct === null ? '' : '<p>Average moved from <b>' + fmt(r.phases[0].center, d) + '</b> (' + esc(r.phases[0].name) + ') to <b>' + fmt(last.center, d) + '</b> (' + esc(last.name) + '): <span class="' + (r.changePct < 0 ? 'good' : 'bad') + '">' + (r.changePct > 0 ? '+' : '') + r.changePct + '%</span>.</p>';
  var sig = r.signals.length
    ? '<p class="bad">' + r.signals.length + ' out-of-control signal(s): investigate these points for a special cause.</p>'
    : '<p class="good">No out-of-control signals: only normal (common-cause) variation.</p>';
  show('insight', '<h2>' + esc(names[r.chartType]) + ' · ' + esc(r.label) + '</h2>' + (r.note ? '<p class="muted">' + esc(r.note) + '</p>' : '') + change + sig +
    '<p class="muted">Phases come from the Events sheet: add a row (date + label) whenever you change the process, and the chart recalculates the limits from that day.</p>');

  var labels = r.points.map(function (p) { return r.chartType === 'I-MR' ? p.label : p.day; });
  var colors = r.points.map(function (p) { return p.rules.length ? C.bad : C.point; });
  function limit(key, label, color, dash) { return { label: label, data: r.points.map(function (p) { return p[key]; }), borderColor: color, borderDash: dash || [], pointRadius: 0, borderWidth: 1.5, stepped: 'middle', spanGaps: false }; }
  show('chartCard');
  chart('chart1', {
    type: 'line',
    data: { labels: labels, datasets: [
      { label: r.label, data: r.points.map(function (p) { return p.value; }), borderColor: '#7a8499', pointBackgroundColor: colors, pointBorderColor: colors, pointRadius: r.points.map(function (p) { return p.rules.length ? 5 : 3; }), borderWidth: 1 },
      limit('ucl', 'UCL', C.ucl, [6, 4]), limit('center', 'Center line', C.center), limit('lcl', 'LCL', C.ucl, [6, 4])
    ] },
    options: { scales: { x: { ticks: { maxRotation: 60, autoSkip: true } }, y: { beginAtZero: r.chartType !== 'I-MR' } }, plugins: { legend: { position: 'bottom' } } }
  });
  if (r.chartType === 'I-MR') {
    show('chartCard2');
    chart('chart2', {
      type: 'line',
      data: { labels: labels, datasets: [
        { label: 'Moving range', data: r.points.map(function (p) { return p.mr; }), borderColor: '#7a8499', pointRadius: 2, borderWidth: 1, spanGaps: false },
        limit('mrUcl', 'MR UCL', C.ucl, [6, 4]), limit('mrCenter', 'MR center', C.center)
      ] },
      options: { scales: { x: { ticks: { display: false } }, y: { beginAtZero: true } }, plugins: { legend: { position: 'bottom' } } }
    });
  }
  var ph = '<table><thead><tr><th>Phase</th><th>From</th><th>To</th><th>Points</th><th>Center</th><th>UCL</th><th>LCL</th></tr></thead><tbody>' +
    r.phases.map(function (p) { return '<tr><td>' + esc(p.name) + '</td><td>' + esc(p.from) + '</td><td>' + esc(p.to) + '</td><td>' + p.n + '</td><td>' + fmt(p.center, d) + '</td><td>' + (p.ucl === null ? 'varies' : fmt(p.ucl, d)) + '</td><td>' + (p.lcl === null ? 'varies' : fmt(p.lcl, d)) + '</td></tr>'; }).join('') + '</tbody></table>';
  var sg = r.signals.length ? '<h3>Signals</h3><table><thead><tr><th>Point</th><th>Value</th><th>Rule</th></tr></thead><tbody>' +
    r.signals.map(function (s) { return '<tr><td>' + esc(s.label) + '</td><td>' + fmt(s.value, d) + '</td><td style="text-align:left;white-space:normal">' + s.rules.map(function (k) { return esc(r.rules[k]); }).join('; ') + '</td></tr>'; }).join('') + '</tbody></table>' : '';
  show('tableCard', ph + sg);
}

function init(meta) {
  META = meta;
  if (meta.formUrl) { $('formLink').href = meta.formUrl; $('formLink').hidden = false; }
  if (meta.sheetUrl) { $('sheetLink').href = meta.sheetUrl; $('sheetLink').hidden = false; }
  fillSelect($('fProject'), meta.projects, 'All projects');
  fillSelect($('fArea'), meta.areas, 'All areas');
  fillSelect($('fShift'), meta.shifts, 'All shifts');
  var all = meta.measureSeries.concat(meta.countSeries);
  fillSelect($('oX'), all);
  fillSelect($('oY'), meta.countSeries.concat(meta.measureSeries));
  fillSelect($('oHist'), all);
  fillSelect($('oCtrl'), meta.countSeries.concat(meta.measureSeries));
  if (!meta.recordCount) $('status').innerHTML = 'No records yet. Use the check sheet form, paste rows into the Records sheet, or run QC Tools → Load demo data.';
  setTool('check');
}

document.getElementById('tabs').addEventListener('click', function (e) { var t = e.target.getAttribute('data-tool'); if (t) setTool(t); });
$('refresh').addEventListener('click', run);
['fProject', 'fArea', 'fShift', 'oColumns', 'oGroup', 'oX', 'oY', 'oHist', 'oCtrl', 'oType'].forEach(function (id) { $(id).addEventListener('change', run); });
['oTarget', 'oThreshold', 'oBins', 'fFrom', 'fTo'].forEach(function (id) { $(id).addEventListener('change', run); });
call('apiMeta', [], init);
</script>
</body>
</html>`;
