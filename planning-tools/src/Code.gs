/**
 * Apps Script entry points: menu, web app, Google Form brainstorm, and sheet storage.
 *
 * One spreadsheet = one project. Each tool keeps its data on its own tab, so the
 * sheet stays readable and editable by hand; the web app is a friendlier front end.
 */

/** Bump this when publishing a new version, so "Update" can tell what changed. */
var PT_VERSION = '1.4.0';

/**
 * Counts how many copies of this code are in the project. Apps Script runs every file,
 * so pasting the new version into a SECOND file (instead of replacing the old one) gives 2.
 */
var PT_COPIES = (typeof PT_COPIES === 'number' ? PT_COPIES : 0) + 1;
var VERSION_KEY = 'planningToolsVersion';

var SHEETS = {
  GUIDE: 'Guide',
  SETTINGS: 'Settings',
  AFFINITY: 'Affinity Diagram',
  RELATIONS: 'Interrelationship',
  MATRIX: 'Matrix Diagram',
  PRIORITIZATION: 'Prioritization Matrix',
  TREE: 'Tree Diagram',
  PDPC: 'PDPC',
  ACTIVITIES: 'Activity Network'
};

var HEADERS = {
  AFFINITY: ['Idea', 'Category', 'Source'],
  RELATIONS: ['ID', 'Idea', 'Causes (IDs)', 'Out', 'In', 'Role'],
  TREE: ['ID', 'Parent ID', 'Item', 'Level'],
  PDPC: ['ID', 'Parent ID', 'Task', 'Risks (what could go wrong?)', 'Countermeasures', 'Open risks'],
  ACTIVITIES: ['ID', 'Task', 'Duration', 'Predecessors', 'ES', 'EF', 'LS', 'LF', 'Slack', 'Critical']
};

var PM_WEIGHT_LABEL = 'Weight (%)';
var PM_RESULT_HEADERS = ['Weighted Total', 'Rank'];
var MATRIX_CORNER = 'Rows \\ Columns';
var MATRIX_TOTAL = 'Total';

var FILL = { header: '#e8eef7', critical: '#fde2e1', win: '#e3f4e8', driver: '#fff1d6', none: null };
var FORM_ID_KEY = 'brainstormFormId';
var FORM_IMPORTED_KEY = 'brainstormImportedUntil';
var FORM_SHEET_KEY = 'brainstormSpreadsheetId';

// ---------------------------------------------------------------- menu & web app

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Planning Tools')
    .addItem('Open planning app', 'openAppDialog')
    .addSeparator()
    .addSubMenu(ui.createMenu('Go to tool')
      .addItem('1. Affinity Diagram', 'goToAffinity')
      .addItem('2. Interrelationship Diagram', 'goToRelations')
      .addItem('3. Matrix Diagram', 'goToMatrix')
      .addItem('4. Prioritization Matrix', 'goToPrioritization')
      .addItem('5. Tree Diagram', 'goToTree')
      .addItem('6. PDPC (risks)', 'goToPdpc')
      .addItem('7. Activity Network', 'goToActivities'))
    .addSubMenu(ui.createMenu('Brainstorm form')
      .addItem('Create brainstorm form', 'menuCreateForm')
      .addItem('Import ideas from form', 'menuImportFormIdeas')
      .addItem('Show form link', 'menuShowForm'))
    .addItem('Recalculate all tabs', 'menuRecalculate')
    .addSeparator()
    .addItem('Guide', 'goToGuide')
    .addItem('Settings', 'goToSettings')
    .addItem('Set up / repair project tabs', 'menuSetup')
    .addSeparator()
    .addItem('Update after pasting new code', 'menuUpdate')
    .addToUi();

  // Nudge after a new version was pasted in. (A simple trigger may only show a toast.)
  try {
    var installed = PropertiesService.getDocumentProperties().getProperty(VERSION_KEY);
    if (PT_COPIES > 1) {
      SpreadsheetApp.getActiveSpreadsheet().toast('The Planning Tools code is pasted ' + PT_COPIES +
        ' times. Open Extensions → Apps Script and keep only one copy.', 'Planning Tools', 15);
    } else if (installed && installed !== PT_VERSION) {
      SpreadsheetApp.getActiveSpreadsheet().toast('New version ' + PT_VERSION +
        ' found. Run Planning Tools → Update after pasting new code.', 'Planning Tools', 15);
    }
  } catch (e) { /* no access yet, before the first authorization */ }
}

// ---------------------------------------------------------------- update after pasting new code

function menuUpdate() {
  var ui = SpreadsheetApp.getUi();
  if (PT_COPIES > 1) {
    ui.alert('The code is in this project ' + PT_COPIES + ' times.\n\n' +
      'Open Extensions → Apps Script, delete the older file(s) so only one copy is left, save, ' +
      'and run Update again. Nothing was changed.');
    return;
  }
  ui.alert(updateProject_().join('\n'));
}

/**
 * Brings this spreadsheet up to the pasted version without touching the user's work:
 *   - missing tabs are created, existing tabs are never deleted or duplicated
 *   - new settings are added, existing setting values are kept
 *   - the Guide is refreshed
 *   - every tool tab is recalculated from its own data (so new columns/formatting appear)
 * Safe to run any number of times.
 */
function updateProject_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var props = PropertiesService.getDocumentProperties();
  var from = props.getProperty(VERSION_KEY);
  var before = {};
  ss.getSheets().forEach(function (sh) { before[sh.getName()] = true; });

  var addedSettings = upgradeSettings_();
  setupSheets();
  var newTabs = Object.keys(SHEETS).map(function (k) { return SHEETS[k]; })
    .filter(function (name) { return !before[name]; });
  var problems = recalculateAll_();
  props.setProperty(VERSION_KEY, PT_VERSION);
  SpreadsheetApp.flush();

  var lines = [from && from !== PT_VERSION
    ? 'Updated from version ' + from + ' to ' + PT_VERSION + '.'
    : 'Planning Tools version ' + PT_VERSION + ' is up to date.'];
  lines.push(newTabs.length ? 'New tabs: ' + newTabs.join(', ') + '.' : 'No tabs added — all your tabs were kept.');
  lines.push(addedSettings.length ? 'New settings: ' + addedSettings.join(', ') + '.' : 'Your settings were kept.');
  lines.push('The Guide was refreshed.');
  if (problems.length) lines.push('', 'Please check these tabs:', problems.join('\n\n'));
  return lines;
}

/** Adds settings that are new in this version; never changes values the user already set. */
function upgradeSettings_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.SETTINGS);
  if (!sheet) return [];
  var last = sheet.getLastRow();
  var labels = last > 1 ? sheet.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return cleanText(r[0]); }) : [];
  var added = [];
  SETTINGS.forEach(function (s) {
    var row = labels.indexOf(s[1]);
    if (row === -1) {
      labels.push(s[1]);
      sheet.getRange(labels.length + 1, 1, 1, 3).setValues([[s[1], s[2], s[3]]]);
      sheet.getRange(labels.length + 1, 2).setBackground('#fffbe6').setFontWeight('bold');
      addChoices_(sheet, labels.length + 1, s);
      added.push(s[1]);
    } else {
      sheet.getRange(row + 2, 3).setValue(s[3]); // refresh the help text only
    }
  });
  return added;
}

function goToGuide() { goTo_(SHEETS.GUIDE); }
function goToSettings() { goTo_(SHEETS.SETTINGS); }
function goToAffinity() { goTo_(SHEETS.AFFINITY); }
function goToRelations() { goTo_(SHEETS.RELATIONS); }
function goToMatrix() { goTo_(SHEETS.MATRIX); }
function goToPrioritization() { goTo_(SHEETS.PRIORITIZATION); }
function goToTree() { goTo_(SHEETS.TREE); }
function goToPdpc() { goTo_(SHEETS.PDPC); }
function goToActivities() { goTo_(SHEETS.ACTIVITIES); }

function goTo_(name) {
  ensureSetup_();
  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(getSheet_(name));
}

function menuSetup() {
  setupSheets();
  SpreadsheetApp.getUi().alert('All tabs are in place. Missing tabs were created; existing tabs were not changed.');
}

function menuShowForm() {
  var form = formInfo_();
  SpreadsheetApp.getUi().alert(form
    ? 'Share this link with your team:\n\n' + form.url + '\n\nEdit the form:\n' + form.editUrl
    : 'No brainstorm form yet. Use Planning Tools → Brainstorm form → Create brainstorm form.');
}

function doGet() {
  return HtmlService.createHtmlOutput(APP_HTML)
    .setTitle('Planning Tools')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Opens the same UI as the web app, inside the spreadsheet (no deployment needed). */
function openAppDialog() {
  var html = HtmlService.createHtmlOutput(APP_HTML).setWidth(1200).setHeight(780);
  SpreadsheetApp.getUi().showModelessDialog(html, readSettings_().projectName || 'Planning Tools');
}

function menuCreateForm() {
  var ui = SpreadsheetApp.getUi();
  var question = readSettings_().formQuestion;
  var answer = ui.prompt('Brainstorm form',
    'What problem or question should people give ideas for?\n(Leave empty to use: "' + question + '")',
    ui.ButtonSet.OK_CANCEL);
  if (answer.getSelectedButton() !== ui.Button.OK) return;
  var form = apiCreateForm(answer.getResponseText() || question);
  ui.alert('Form ready. Share this link with your team:\n\n' + form.url);
}

function menuImportFormIdeas() {
  var result = apiImportFormIdeas();
  SpreadsheetApp.getUi().alert(result.message);
}

/** Recomputes every tool from what is currently typed in the tabs. */
function menuRecalculate() {
  ensureSetup_();
  var problems = recalculateAll_();
  SpreadsheetApp.getUi().alert(problems.length ? 'Please fix:\n\n' + problems.join('\n\n') : 'All tabs recalculated.');
}

/** Re-reads every tool tab and writes it back with fresh results. Returns problems found. */
function recalculateAll_() {
  return withLock_(function () {
    var problems = [];
    function check(name, result) {
      if (result.errors.length) problems.push(name + ':\n  ' + result.errors.join('\n  '));
    }
    check(SHEETS.AFFINITY, saveAffinity_(readAffinity_()));
    check(SHEETS.RELATIONS, saveRelations_(readRelations_()));
    check(SHEETS.MATRIX, saveMatrix_(readMatrix_()));
    check(SHEETS.PRIORITIZATION, savePrioritization_(readPrioritization_()));
    check(SHEETS.TREE, saveTree_(readTree_()));
    check(SHEETS.PDPC, savePdpc_(readPdpc_()));
    check(SHEETS.ACTIVITIES, saveActivities_(readActivities_()));
    return problems;
  });
}

// ---------------------------------------------------------------- API used by the web app

/** Everything the app needs, in one round trip. */
function apiGetAll() {
  ensureSetup_();
  var aff = readAffinity_(), rel = readRelations_(), mx = readMatrix_(), p = readPrioritization_();
  var tree = readTree_(), pdpc = readPdpc_(), an = readActivities_();
  return {
    affinity: withInput_(groupAffinity(aff), aff),
    relations: withInput_(analyzeInterrelationships(rel), rel),
    matrix: withInput_(analyzeMatrix(mx), mx),
    prioritization: withInput_(scorePrioritization(p.criteria, p.options), p),
    tree: withInput_(buildTree(tree), tree),
    pdpc: withInput_(analyzePdpc(pdpc), pdpc),
    activities: withInput_(computeCriticalPath(an), an),
    form: formInfo_(),
    settings: readSettings_(),
    guide: GUIDE
  };
}

/**
 * Runs a change while holding the document lock, so two people saving at the same
 * moment cannot overwrite each other half-way.
 */
function withLock_(fn) {
  var lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

/**
 * Adds the rows exactly as they are in the tab (or as the app sent them) to a result.
 * The app edits these, not the cleaned-up result, so a row with a mistake is shown
 * (and can be fixed) instead of silently disappearing on the next save.
 */
function withInput_(result, input) {
  result.input = input;
  return result;
}

function apiSaveAffinity(ideas) {
  return withLock_(function () { return saveAffinity_(ideas); });
}

function saveAffinity_(ideas) {
  var result = groupAffinity(ideas);
  writeTable_(SHEETS.AFFINITY, HEADERS.AFFINITY, result.ideas.map(function (i) {
    return [i.idea, i.category, i.source];
  }));
  return withInput_(result, ideas);
}

function apiSaveRelations(rows) {
  return withLock_(function () { return saveRelations_(rows); });
}

function saveRelations_(rows) {
  var result = analyzeInterrelationships(rows);
  var byId = {};
  result.items.forEach(function (i) { byId[i.id] = i; });
  var ok = !result.errors.length;
  var fills = [];
  var values = rows.filter(hasContent_).map(function (r) {
    var i = byId[cleanText(r.id).toUpperCase()];
    fills.push(ok && i && i.role.indexOf('Key') === 0 ? FILL.driver : FILL.none);
    return [cleanText(r.id).toUpperCase(), r.idea, parseIdList(r.causes).join(', ')]
      .concat(ok && i ? [i.out, i['in'], i.role] : ['', '', '']);
  });
  writeTable_(SHEETS.RELATIONS, HEADERS.RELATIONS, values, fills, [1, 3]);
  return withInput_(result, rows);
}

function apiSaveMatrix(data) {
  return withLock_(function () { return saveMatrix_(data); });
}

function saveMatrix_(data) {
  var result = analyzeMatrix(data);
  writeMatrix_(data, result);
  return withInput_(result, data);
}

function apiSavePrioritization(data) {
  return withLock_(function () { return savePrioritization_(data); });
}

function savePrioritization_(data) {
  var result = scorePrioritization(data.criteria, data.options);
  writePrioritization_(data, result);
  return withInput_(result, data);
}

function apiSaveTree(rows) {
  return withLock_(function () { return saveTree_(rows); });
}

function saveTree_(rows) {
  var result = buildTree(rows);
  var depth = {};
  if (!result.errors.length) result.nodes.forEach(function (n) { depth[n.id] = n.depth + 1; });
  writeTable_(SHEETS.TREE, HEADERS.TREE, rows.filter(hasContent_).map(function (r) {
    var id = cleanText(r.id).toUpperCase();
    return [id, cleanText(r.parent).toUpperCase(), r.text, depth[id] || ''];
  }), null, [1, 2]);
  return withInput_(result, rows);
}

function apiSavePdpc(rows) {
  return withLock_(function () { return savePdpc_(rows); });
}

function savePdpc_(rows) {
  var result = analyzePdpc(rows);
  var open = {};
  result.openRisks.forEach(function (o) { open[o.id] = (open[o.id] || 0) + 1; });
  var fills = [];
  var values = rows.filter(hasContent_).map(function (r) {
    var id = cleanText(r.id).toUpperCase();
    fills.push(open[id] ? FILL.critical : FILL.none);
    return [id, cleanText(r.parent).toUpperCase(), r.text, r.risks, r.countermeasures, open[id] || ''];
  });
  writeTable_(SHEETS.PDPC, HEADERS.PDPC, values, fills, [1, 2]);
  return withInput_(result, rows);
}

function apiSaveActivities(tasks) {
  return withLock_(function () { return saveActivities_(tasks); });
}

function saveActivities_(tasks) {
  var result = computeCriticalPath(tasks);
  var computed = {};
  if (!result.errors.length) result.tasks.forEach(function (t) { computed[t.id] = t; });
  var fills = [];
  var values = tasks.filter(hasContent_).map(function (t) {
    var c = computed[normalizeTaskId(t.id)];
    fills.push(c && c.critical ? FILL.critical : FILL.none);
    return [normalizeTaskId(t.id), t.name, t.duration, parsePredecessors(t.predecessors).join(', ')]
      .concat(c ? [c.es, c.ef, c.ls, c.lf, c.slack, c.critical ? 'YES' : ''] : ['', '', '', '', '', '']);
  });
  var header = HEADERS.ACTIVITIES.slice();
  header[2] = 'Duration (' + readSettings_().timeUnit + ')';
  writeTable_(SHEETS.ACTIVITIES, header, values, fills, [1, 4]);
  return withInput_(result, tasks);
}

// ---------------------------------------------------------------- chart export

var CHART_FOLDER = 'Planning Tools charts';

/** Saves a chart image (a data: URL from the app) to a "Planning Tools charts" folder in Drive. */
function apiSaveChartToDrive(fileName, dataUrl) {
  var match = /^data:(image\/(?:png|svg\+xml));base64,(.+)$/.exec(String(dataUrl));
  if (!match) throw new Error('Not an image.');
  var folders = DriveApp.getFoldersByName(CHART_FOLDER);
  var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(CHART_FOLDER);
  var blob = Utilities.newBlob(Utilities.base64Decode(match[2]), match[1], cleanText(fileName) || 'chart');
  var file = folder.createFile(blob);
  return { name: file.getName(), url: file.getUrl() };
}

// ---------------------------------------------------------------- Google Form brainstorm

function apiCreateForm(question) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var settings = readSettings_();
  question = cleanText(question) || settings.formQuestion;
  var form = FormApp.create('Brainstorm — ' + (settings.projectName || ss.getName()))
    .setDescription(question)
    .setCollectEmail(false)
    .setProgressBar(false)
    .setConfirmationMessage('Thanks! Your idea was added.');
  form.addParagraphTextItem().setTitle('Your idea').setHelpText('One idea per answer. Submit the form again for more ideas.').setRequired(true);
  form.addTextItem().setTitle('Your name (optional)');
  var props = {};
  props[FORM_ID_KEY] = form.getId();
  props[FORM_IMPORTED_KEY] = String(Date.now());
  props[FORM_SHEET_KEY] = ss.getId();
  PropertiesService.getDocumentProperties().setProperties(props);
  return formInfo_();
}

/** Copies form answers submitted since the last import into the Affinity tab as unsorted ideas. */
function apiImportFormIdeas() {
  return withLock_(importFormIdeas_);
}

function importFormIdeas_() {
  var props = PropertiesService.getDocumentProperties();
  var id = formId_();
  if (!id) return { imported: 0, message: 'Create a brainstorm form first.', affinity: null };

  var form;
  try {
    form = FormApp.openById(id);
  } catch (e) {
    return { imported: 0, message: 'The brainstorm form was deleted or you have no access to it. Create a new one.', affinity: null };
  }
  var since = new Date(Number(props.getProperty(FORM_IMPORTED_KEY) || 0));
  var responses = form.getResponses(since);
  var ideas = readAffinity_();
  var newest = since.getTime();
  var added = 0;
  responses.forEach(function (response) {
    if (response.getTimestamp().getTime() <= since.getTime()) return;
    newest = Math.max(newest, response.getTimestamp().getTime());
    var answers = response.getItemResponses();
    var idea = cleanText(answers[0] && answers[0].getResponse());
    var name = cleanText(answers[1] && answers[1].getResponse());
    if (!idea) return;
    ideas.push({ idea: idea, category: '', source: name ? 'Form: ' + name : 'Form' });
    added += 1;
  });
  props.setProperty(FORM_IMPORTED_KEY, String(newest));
  var affinity = saveAffinity_(ideas);
  return {
    imported: added,
    message: added ? added + ' new idea' + (added === 1 ? '' : 's') + ' added to the Affinity Diagram.' : 'No new ideas yet.',
    affinity: affinity
  };
}

/**
 * The brainstorm form of THIS spreadsheet. A copy made with File → Make a copy keeps the
 * stored form id, so the spreadsheet id is checked too; a copy starts without a form.
 */
function formId_() {
  var props = PropertiesService.getDocumentProperties();
  var id = props.getProperty(FORM_ID_KEY);
  var owner = props.getProperty(FORM_SHEET_KEY);
  if (!id || (owner && owner !== SpreadsheetApp.getActiveSpreadsheet().getId())) return null;
  return id;
}

function formInfo_() {
  var id = formId_();
  if (!id) return null;
  try {
    var form = FormApp.openById(id);
    return { url: form.getPublishedUrl(), editUrl: form.getEditUrl(), title: form.getTitle() };
  } catch (e) {
    return null; // form was deleted
  }
}

// ---------------------------------------------------------------- setup & example data

function ensureSetup_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var missing = Object.keys(SHEETS).some(function (k) { return !ss.getSheetByName(SHEETS[k]); });
  if (missing) setupSheets();
}

/**
 * Creates any missing tab. Existing tabs are never touched, except the Guide, which is
 * always rewritten so it matches this version of the tool.
 */
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var has = function (name) { return !!ss.getSheetByName(name); };

  var props = PropertiesService.getDocumentProperties();
  var firstRun = !props.getProperty(VERSION_KEY);
  writeGuide_();
  if (!has(SHEETS.SETTINGS)) writeSettings_();
  if (firstRun) props.setProperty(VERSION_KEY, PT_VERSION);

  var examples = readSettings_().includeExamples;
  var rows = function (keys, list) {
    return (examples ? list : []).map(function (r) {
      var o = {};
      keys.forEach(function (k, i) { o[k] = r[i]; });
      return o;
    });
  };

  if (!has(SHEETS.AFFINITY)) saveAffinity_(rows(['idea', 'category', 'source'], [
    ['Machines break down during shifts', 'Maintenance', 'Example'],
    ['Preventive maintenance is often skipped', 'Maintenance', 'Example'],
    ['Spare parts are not in stock', 'Maintenance', 'Example'],
    ['New operators learn on the job only', 'Training', 'Example'],
    ['No standard work instructions', 'Training', 'Example'],
    ['Too much scrap at final inspection', 'Quality', 'Example'],
    ['Rework takes up the last hour of the shift', 'Quality', 'Example'],
    ['Material travels far between stations', 'Layout', 'Example'],
    ['Forklifts block the aisle', 'Layout', 'Example'],
    ['Old press runs slower than rated', 'Equipment', 'Example'],
    ['Changeovers take over an hour', '', 'Example']
  ]));

  if (!has(SHEETS.RELATIONS)) saveRelations_(rows(['id', 'idea', 'causes'], [
    ['1', 'Preventive maintenance skipped', '2'],
    ['2', 'Machines break down', '4, 7'],
    ['3', 'No standard work instructions', '1, 5, 6'],
    ['4', 'Lost production time', '7'],
    ['5', 'Scrap and rework', '4, 7'],
    ['6', 'New operators make mistakes', '5'],
    ['7', 'Production targets missed', '']
  ]));

  if (!has(SHEETS.MATRIX)) saveMatrix_(!examples ? { rows: [], columns: [], cells: [] } : {
    rows: ['Easy to carry', 'Long battery life', 'Low price', 'Durable'],
    columns: ['Weight', 'Battery capacity', 'Housing material', 'Part count'],
    cells: [
      ['◎', '✕', '○', ''],
      ['', '◎', '', ''],
      ['', '✕', '✕', '◎'],
      ['✕', '', '◎', '○']
    ]
  });

  if (!has(SHEETS.PRIORITIZATION)) savePrioritization_(!examples ? { criteria: [], options: [] } : {
    criteria: [{ name: 'Quality', weight: 150 }, { name: 'Cost', weight: 100 }, { name: 'Service', weight: 80 }],
    options: [
      { name: 'Vendor A', scores: [4, 2, 3] },
      { name: 'Vendor B', scores: [3, 4, 4] },
      { name: 'Vendor C', scores: [2, 5, 2] },
      { name: 'Vendor D', scores: [5, 1, 3] }
    ]
  });

  var treeRows = [
    ['1', '', 'Launch new product'],
    ['2', '1', 'Design product'],
    ['3', '1', 'Set up production'],
    ['4', '1', 'Marketing'],
    ['5', '2', 'Define requirements'],
    ['6', '2', 'Build prototype'],
    ['7', '3', 'Select supplier'],
    ['8', '3', 'Train operators'],
    ['9', '4', 'Build website'],
    ['10', '4', 'Social media plan']
  ];
  if (!has(SHEETS.TREE)) saveTree_(rows(['id', 'parent', 'text'], treeRows));

  if (!has(SHEETS.PDPC)) {
    var risks = {
      6: ['Prototype fails testing; Parts arrive late', 'Plan a second design loop; Order parts from two suppliers'],
      7: ['Supplier cannot meet volume', 'Qualify a backup supplier'],
      8: ['Trainer not available', ''],
      9: ['Website not ready for launch', 'Start from a ready-made template']
    };
    savePdpc_(rows(['id', 'parent', 'text', 'risks', 'countermeasures'], treeRows.map(function (r) {
      return r.concat(risks[r[0]] || ['', '']);
    })));
  }

  if (!has(SHEETS.ACTIVITIES)) saveActivities_(rows(['id', 'name', 'duration', 'predecessors'], [
    ['A', 'Define scope', 5, ''],
    ['B', 'Design solution', 10, 'A'],
    ['C', 'Order materials', 8, 'A'],
    ['D', 'Write procedures', 6, 'A'],
    ['E', 'Receive materials', 7, 'C'],
    ['F', 'Build prototype', 20, 'B'],
    ['G', 'Inspect materials', 9, 'E'],
    ['H', 'Validate prototype', 30, 'F'],
    ['I', 'Stock line', 4, 'G'],
    ['J', 'Train operators', 25, 'D'],
    ['K', 'Go live', 8, 'H, I, J']
  ]));

  // Keep tabs in workflow order: Guide, Settings, then the tools. (Not possible from the
  // web app, where there is no open spreadsheet window; the order is then left as it is.)
  try {
    Object.keys(SHEETS).forEach(function (k, i) {
      ss.setActiveSheet(ss.getSheetByName(SHEETS[k]));
      ss.moveActiveSheet(i + 1);
    });
    ss.setActiveSheet(ss.getSheetByName(SHEETS.GUIDE));
  } catch (e) { /* no UI */ }

  // A brand-new spreadsheet starts with one empty tab ("Sheet1", "Tabellenblatt1", "Feuille 1"…
  // depending on language). Remove it on the very first setup only, and only if it is empty.
  if (firstRun) {
    var ours = {};
    Object.keys(SHEETS).forEach(function (k) { ours[SHEETS[k]] = true; });
    ss.getSheets().forEach(function (sh) {
      if (!ours[sh.getName()] && sh.getLastRow() === 0 && sh.getLastColumn() === 0 && ss.getSheets().length > 1) {
        ss.deleteSheet(sh);
      }
    });
  }
}

// ---------------------------------------------------------------- Settings tab

/** key, label, default, help, [allowed values]. Values live in column B of the Settings tab. */
var SETTINGS = [
  ['theme', 'Colour theme', 'Light', 'How the app looks. Light = white background. Dark = dark background. Automatic = follows your phone or computer.', ['Light', 'Dark', 'Automatic']],
  ['projectName', 'Project name', 'My improvement project', 'Shown as the app title and on the brainstorm form.'],
  ['team', 'Company / team', '', 'Optional. Shown under the project name.'],
  ['timeUnit', 'Time unit', 'days', 'Unit for task durations in the Activity Network (days, weeks, hours…).'],
  ['defaultWeight', 'Default criterion weight (%)', 100, 'Weight given to a new criterion in the Prioritization Matrix.'],
  ['scoreScale', 'Score scale', '1–5 (higher is better)', 'Reminder shown above the Prioritization Matrix.'],
  ['formQuestion', 'Brainstorm question', 'What stops us from reaching our goal?', 'Default question for a new brainstorm form.'],
  ['accentColor', 'App colour', '#2f6fdb', 'Main colour of the app, as a hex code like #2f6fdb.'],
  ['includeExamples', 'Example data in new tabs', 'Yes', 'Yes = new tabs start with example data. No = start empty.', ['Yes', 'No']]
];

function readSettings_() {
  var out = {};
  SETTINGS.forEach(function (s) { out[s[0]] = s[2]; });
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.SETTINGS);
  if (sheet && sheet.getLastRow() > 1) {
    var byLabel = {};
    cellValues_(sheet.getRange(2, 1, sheet.getLastRow() - 1, 2)).forEach(function (r) {
      byLabel[cleanText(r[0])] = r[1];
    });
    SETTINGS.forEach(function (s) {
      if (byLabel.hasOwnProperty(s[1]) && cleanText(byLabel[s[1]]) !== '') out[s[0]] = byLabel[s[1]];
    });
  }
  out.defaultWeight = Number(out.defaultWeight) >= 0 ? Number(out.defaultWeight) : 100;
  out.includeExamples = !/^(no|false|0|n)$/i.test(cleanText(out.includeExamples));
  out.accentColor = /^#[0-9a-f]{3,8}$/i.test(cleanText(out.accentColor)) ? cleanText(out.accentColor) : '#2f6fdb';
  var theme = cleanText(out.theme).toLowerCase();
  out.theme = theme === 'dark' ? 'dark' : /^auto/.test(theme) ? 'auto' : 'light';
  return out;
}

/** Gives a setting with fixed choices a drop-down in the Settings tab. */
function addChoices_(sheet, row, setting) {
  if (!setting[4]) return;
  sheet.getRange(row, 2).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(setting[4], true).build());
}

/** Lets the app change a setting (e.g. the theme switch). Only known settings, only allowed values. */
function apiSetSetting(key, value) {
  var setting = SETTINGS.filter(function (s) { return s[0] === key; })[0];
  if (!setting) throw new Error('Unknown setting: ' + key);
  if (setting[4] && setting[4].indexOf(value) === -1) throw new Error('Not allowed: ' + value);
  ensureSetup_();
  upgradeSettings_();
  var sheet = getSheet_(SHEETS.SETTINGS);
  var labels = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().map(function (r) { return cleanText(r[0]); });
  sheet.getRange(labels.indexOf(setting[1]) + 2, 2).setValue(value);
  return readSettings_();
}

function writeSettings_() {
  var sheet = writeTable_(SHEETS.SETTINGS, ['Setting', 'Value', 'What it does'],
    SETTINGS.map(function (s) { return [s[1], s[2], s[3]]; }));
  sheet.getRange(2, 2, SETTINGS.length, 1).setBackground('#fffbe6').setFontWeight('bold');
  SETTINGS.forEach(function (s, i) { addChoices_(sheet, i + 2, s); });
  sheet.setColumnWidth(2, 260);
  sheet.setColumnWidth(3, 460);
}

function writeGuide_() {
  var sheet = getSheet_(SHEETS.GUIDE);
  sheet.getRange(1, 1, sheet.getMaxRows(), 2).breakApart();
  sheet.clear();
  var rows = [];
  var styles = [];
  GUIDE.forEach(function (section) {
    rows.push([section.title, '']);
    styles.push('h');
    section.items.forEach(function (item) {
      rows.push([item[0], item[1]]);
      styles.push('p');
    });
    rows.push(['', '']);
    styles.push('');
  });
  var range = sheet.getRange(1, 1, rows.length, 2);
  range.setValues(rows.map(function (r) { return r.map(safeCell_); })).setVerticalAlignment('top').setWrap(true);
  // One call per formatting type (fast), then merge the heading rows.
  range.setFontWeights(styles.map(function (s) { return [s ? 'bold' : 'normal', 'normal']; }));
  range.setFontSizes(styles.map(function (s) { return s === 'h' ? [13, 13] : [10, 10]; }));
  range.setBackgrounds(styles.map(function (s) { return s === 'h' ? [FILL.header, FILL.header] : [null, null]; }));
  styles.forEach(function (s, i) { if (s === 'h') sheet.getRange(i + 1, 1, 1, 2).merge(); });
  sheet.setColumnWidth(1, 220);
  sheet.setColumnWidth(2, 720);
  sheet.setHiddenGridlines(true);
}

// ---------------------------------------------------------------- reading tabs

function readAffinity_() {
  return readTable_(SHEETS.AFFINITY, ['idea', 'category', 'source']);
}

function readRelations_() {
  return readTable_(SHEETS.RELATIONS, ['id', 'idea', 'causes']);
}

function readTree_() {
  return readTable_(SHEETS.TREE, ['id', 'parent', 'text']);
}

function readPdpc_() {
  return readTable_(SHEETS.PDPC, ['id', 'parent', 'text', 'risks', 'countermeasures']);
}

function readActivities_() {
  return readTable_(SHEETS.ACTIVITIES, ['id', 'name', 'duration', 'predecessors']);
}

/**
 * Prioritization tab:
 *   Row 1: Option     | Criterion 1 | Criterion 2 | ... | Weighted Total | Rank
 *   Row 2: Weight (%) | 150         | 100         | ...
 *   Row 3+: option name and its scores
 */
function readPrioritization_() {
  var values = cellValues_(getSheet_(SHEETS.PRIORITIZATION).getDataRange());
  if (values.length < 2) return { criteria: [], options: [] };
  var header = values[0];
  var end = header.indexOf(PM_RESULT_HEADERS[0]);
  if (end === -1) end = header.length;
  var cols = [];
  for (var c = 1; c < end; c++) if (cleanText(header[c])) cols.push(c);
  return {
    criteria: cols.map(function (c) { return { name: header[c], weight: values[1][c] }; }),
    options: values.slice(2)
      .filter(function (row) { return cleanText(row[0]); })
      .map(function (row) { return { name: row[0], scores: cols.map(function (c) { return row[c]; }) }; })
  };
}

/**
 * Matrix tab:
 *   Row 1: Rows \ Columns | Column 1 | Column 2 | ... | Total
 *   Row 2+: row name | symbols ...                   | total
 *   Last row: Total (written by the tool)
 */
function readMatrix_() {
  var values = cellValues_(getSheet_(SHEETS.MATRIX).getDataRange());
  if (!values.length) return { rows: [], columns: [], cells: [] };
  var header = values[0];
  var end = header.indexOf(MATRIX_TOTAL);
  if (end === -1) end = header.length;
  var cols = [];
  for (var c = 1; c < end; c++) if (cleanText(header[c])) cols.push(c);
  // Rows end at the Total line; the legend written below it is not data.
  var body = [];
  for (var r = 1; r < values.length && cleanText(values[r][0]) !== MATRIX_TOTAL; r++) {
    if (cleanText(values[r][0])) body.push(values[r]);
  }
  return {
    rows: body.map(function (row) { return row[0]; }),
    columns: cols.map(function (c) { return header[c]; }),
    cells: body.map(function (row) { return cols.map(function (c) { return row[c]; }); })
  };
}

// ---------------------------------------------------------------- writing tabs

/** Writes what the user entered; totals and ranks only when everything is valid. */
function writePrioritization_(data, result) {
  var withResults = !result.errors.length;
  var criteria = data.criteria || [];
  var header = ['Option'].concat(criteria.map(function (c) { return c.name; }), PM_RESULT_HEADERS);
  var weights = [PM_WEIGHT_LABEL].concat(criteria.map(function (c) { return c.weight; }), ['', '']);
  var fills = [FILL.none];
  var rows = (data.options || []).map(function (o, i) {
    var scored = result.options[i];
    fills.push(withResults && scored.rank === 1 ? FILL.win : FILL.none);
    var scores = criteria.map(function (c, j) { return o.scores ? o.scores[j] : ''; });
    return [o.name].concat(scores, withResults ? [scored.total, scored.rank] : ['', '']);
  });
  var sheet = writeTable_(SHEETS.PRIORITIZATION, header, [weights].concat(rows), fills);
  sheet.getRange(2, 1, 1, header.length).setFontStyle('italic');
  sheet.setFrozenRows(2);
}

function writeMatrix_(data, result) {
  var ok = !result.errors.length;
  var cells = ok ? result.cells : (data.cells || []);
  var header = [MATRIX_CORNER].concat(data.columns || [], [MATRIX_TOTAL]);
  var rows = (data.rows || []).map(function (r, i) {
    var line = result.columns.map(function (c, j) { return cells[i] ? cells[i][j] || '' : ''; });
    return [r].concat(line, [ok ? result.rowTotals[i] : '']);
  });
  rows.push([MATRIX_TOTAL].concat(result.columns.map(function (c, j) { return ok ? result.columnTotals[j] : ''; }), ['']));
  var sheet = writeTable_(SHEETS.MATRIX, header, rows);
  sheet.getRange(1, 2, rows.length + 1, result.columns.length).setHorizontalAlignment('center');
  sheet.getRange(rows.length + 1, 1, 1, header.length).setFontWeight('bold');
  sheet.setFrozenColumns(1);
  var legend = 'Legend: ' + result.symbols.map(function (s) { return s.symbol + ' ' + s.label + ' (' + s.value + ')'; }).join('   ');
  sheet.getRange(rows.length + 3, 1).setValue(legend).setFontStyle('italic');
}

/**
 * Clears the tool's columns and writes a header plus rows.
 * fills: optional background colour per data row.
 * textCols: 1-based columns kept as plain text (IDs and ID lists), so Sheets does not turn
 * "1.1" into a date or "4, 7" into a number.
 */
function writeTable_(name, header, rows, fills, textCols) {
  var sheet = getSheet_(name);
  var width = header.length;
  var all = [header].concat(rows.map(function (r) {
    var line = r.slice(0, width).map(safeCell_);
    while (line.length < width) line.push('');
    return line;
  }));
  // Clear only the tool's own columns (plus any it used before), so notes the user keeps
  // in columns further right, after an empty column, survive every save and update.
  var used = 0;
  var lastCol = sheet.getLastColumn();
  if (lastCol) {
    var top = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    while (used < top.length && cleanText(top[used])) used++;
  }
  sheet.getRange(1, 1, sheet.getMaxRows(), Math.max(width, used)).clear();
  (textCols || []).forEach(function (c) {
    sheet.getRange(2, c, sheet.getMaxRows() - 1, 1).setNumberFormat('@');
  });
  sheet.getRange(1, 1, all.length, width).setValues(all);
  sheet.getRange(1, 1, 1, width).setFontWeight('bold').setBackground(FILL.header);
  if (fills && rows.length) {
    sheet.getRange(2, 1, rows.length, width).setBackgrounds(rows.map(function (r, i) {
      var color = fills[i] || null;
      return header.map(function () { return color; });
    }));
  }
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, width);
  return sheet;
}

/**
 * Cell values with dates turned into the text shown in the cell. (Sheets turns some typed
 * text into dates, e.g. "1.2" in many countries, and dates cannot be sent to the app.)
 */
function cellValues_(range) {
  var values = range.getValues();
  var display = null;
  return values.map(function (row, i) {
    return row.map(function (v, j) {
      if (Object.prototype.toString.call(v) !== '[object Date]') return v;
      display = display || range.getDisplayValues();
      return display[i][j];
    });
  });
}

function readTable_(name, keys) {
  var sheet = getSheet_(name);
  var last = sheet.getLastRow();
  if (last < 2) return [];
  return cellValues_(sheet.getRange(2, 1, last - 1, keys.length))
    .map(function (row) {
      var o = {};
      keys.forEach(function (k, i) { o[k] = row[i]; });
      return o;
    })
    .filter(hasContent_);
}

/**
 * Text that starts with = + - or @ would be read by Sheets as a formula ("=more training"
 * gives an error). A leading apostrophe keeps it as text; Sheets does not show it.
 */
function safeCell_(v) {
  if (typeof v !== 'string' || !/^[=+\-@]/.test(v) || /^[-+]?\d+([.,]\d+)?$/.test(v.trim())) return v;
  return "'" + v;
}

function hasContent_(obj) {
  return Object.keys(obj).some(function (k) { return cleanText(obj[k]); });
}

function getSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}
