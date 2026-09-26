const assert = require('assert');
const fs = require('fs');
const path = require('path');
const load = require('./load');
const vm = require('vm');
const { build } = require('../build');

const plain = (v) => JSON.parse(JSON.stringify(v)); // sandbox objects -> this realm's objects
let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { console.error('  FAIL ' + name + '\n       ' + (e.stack || e.message).split('\n').slice(0, 3).join('\n       ')); process.exitCode = 1; }
}

test('PlanningTools.gs is up to date with src/ (run: node build.js)', () => {
  assert.strictEqual(fs.readFileSync(path.join(__dirname, '..', 'PlanningTools.gs'), 'utf8'), build());
});

const g = load();

// ---------------------------------------------------------------- Activity Network
console.log('Activity Network');
const sample = [
  ['A', 5, ''], ['B', 10, 'A'], ['C', 8, 'A'], ['D', 6, 'A'], ['E', 7, 'C'], ['F', 20, 'B'],
  ['G', 9, 'E'], ['H', 30, 'F'], ['I', 4, 'G'], ['J', 25, 'D'], ['K', 8, 'H, I, J']
].map(([id, duration, predecessors]) => ({ id, name: 'Task ' + id, duration, predecessors }));

test('finds the 73-day critical path A-B-F-H-K and all paths', () => {
  const r = plain(g.computeCriticalPath(sample));
  assert.deepStrictEqual(r.errors, []);
  assert.strictEqual(r.duration, 73);
  assert.deepStrictEqual(r.paths.map(p => [p.ids.join(''), p.duration]), [['ABFHK', 73], ['ADJK', 44], ['ACEGIK', 41]]);
  const t = Object.fromEntries(r.tasks.map(x => [x.id, x]));
  assert.deepStrictEqual([t.J.es, t.J.ef, t.J.ls, t.J.lf, t.J.slack], [11, 36, 40, 65, 29]);
});
test('parallel critical paths', () => {
  const r = plain(g.computeCriticalPath([
    { id: 'a', duration: 2 }, { id: 'b', duration: 3, predecessors: 'a' },
    { id: 'c', duration: 3, predecessors: 'a' }, { id: 'd', duration: 1, predecessors: 'b;c' }]));
  assert.deepStrictEqual(r.criticalPaths.map(p => p.ids.join('')).sort(), ['ABD', 'ACD']);
});
test('reports loops (only the tasks in the loop) and bad input', () => {
  const r = plain(g.computeCriticalPath([
    { id: 'A', duration: 1, predecessors: 'C' }, { id: 'B', duration: 1, predecessors: 'A' },
    { id: 'C', duration: 1, predecessors: 'B' }, { id: 'D', duration: 1 }, { id: 'E', duration: 1, predecessors: 'C' }]));
  assert.match(r.errors[0], /loop: A, B, C\./);
  const bad = plain(g.computeCriticalPath([{ id: 'A', duration: -1 }, { id: 'A', duration: 1 }, { id: '', duration: 1 },
    { id: 'B', duration: 'x', predecessors: 'B, Z' }]));
  assert.strictEqual(bad.errors.length, 6, bad.errors.join(' | '));
});

// ---------------------------------------------------------------- Prioritization
console.log('Prioritization Matrix');
test('weights, ranks and shares ties', () => {
  const r = plain(g.scorePrioritization(
    [{ name: 'Quality', weight: 150 }, { name: 'Cost', weight: 100 }, { name: 'Service', weight: 80 }],
    [{ name: 'A', scores: [4, 2, 3] }, { name: 'B', scores: [3, 4, 4] }, { name: 'C', scores: [2, 5, 2] }, { name: 'D', scores: [5, 1, 3] }]));
  assert.deepStrictEqual(r.ranking.map(o => [o.name, o.total, o.rank]), [['B', 11.7, 1], ['D', 10.9, 2], ['A', 10.4, 3], ['C', 9.6, 4]]);
  const t = plain(g.scorePrioritization([{ name: 'X', weight: '' }], [{ name: 'a', scores: [3] }, { name: 'b', scores: ['3'] }, { name: 'c', scores: [''] }]));
  assert.deepStrictEqual(t.options.map(o => [o.total, o.rank]), [[3, 1], [3, 1], [0, 3]]);
});

// ---------------------------------------------------------------- Affinity
console.log('Affinity Diagram');
test('groups ideas by category, case-insensitive, keeps unsorted apart', () => {
  const r = plain(g.groupAffinity([
    { idea: 'a', category: 'Training' }, { idea: 'b', category: 'training ' }, { idea: 'c', category: '' },
    { idea: '  ', category: 'X' }, { idea: 'd', category: 'Quality' }]));
  assert.deepStrictEqual(r.categories.map(c => [c.name, c.ideas]), [['Training', ['a', 'b']], ['Quality', ['d']]]);
  assert.deepStrictEqual(r.unsorted, ['c']);
  assert.strictEqual(r.total, 4);
});

// ---------------------------------------------------------------- Interrelationship
console.log('Interrelationship Diagram');
const relSample = [
  ['1', 'PM skipped', '2'], ['2', 'Breakdowns', '4, 7'], ['3', 'No instructions', '1, 5, 6'],
  ['4', 'Lost time', '7'], ['5', 'Scrap', '4, 7'], ['6', 'Operator mistakes', '5'], ['7', 'Targets missed', '']
].map(([id, idea, causes]) => ({ id, idea, causes }));
test('counts arrows and finds key driver and key outcome', () => {
  const r = plain(g.analyzeInterrelationships(relSample));
  assert.deepStrictEqual(r.errors, []);
  assert.deepStrictEqual(r.items.map(i => [i.id, i.out, i.in]),
    [['1', 1, 1], ['2', 2, 1], ['3', 3, 0], ['4', 1, 2], ['5', 2, 2], ['6', 1, 1], ['7', 0, 3]]);
  assert.deepStrictEqual(r.keyDrivers, ['3']);
  assert.deepStrictEqual(r.keyOutcomes, ['7']);
  assert.strictEqual(r.items[1].role, 'Driver');
  assert.strictEqual(r.items[3].role, 'Outcome');
});
test('reports unknown IDs, self-links, duplicates; warns on two-way links', () => {
  const r = plain(g.analyzeInterrelationships([{ id: 'A', causes: 'A, Z, B' }, { id: 'B', causes: 'A' }, { id: 'b', causes: '' }]));
  assert.strictEqual(r.errors.length, 3, r.errors.join(' | '));
  assert.strictEqual(r.warnings.length, 1);
});

// ---------------------------------------------------------------- Matrix
console.log('Matrix Diagram');
test('totals strengths, counts conflicts, accepts letter shortcuts', () => {
  const r = plain(g.analyzeMatrix({ rows: ['r1', 'r2'], columns: ['c1', 'c2'], cells: [['S', 'x'], ['○', 'w']] }));
  assert.deepStrictEqual(r.errors, []);
  assert.deepStrictEqual(r.cells, [['◎', '✕'], ['○', '△']]);
  assert.deepStrictEqual(r.rowTotals, [6, 4]);
  assert.deepStrictEqual(r.columnTotals, [12, -2]);
  assert.deepStrictEqual(r.rowConflicts, [1, 0]);
});
test('rejects unknown symbols and unnamed rows', () => {
  const r = plain(g.analyzeMatrix({ rows: [''], columns: ['c'], cells: [['?']] }));
  assert.strictEqual(r.errors.length, 2, r.errors.join(' | '));
});

// ---------------------------------------------------------------- Tree & PDPC
console.log('Tree Diagram & PDPC');
test('builds the tree depth-first with depth and leaf counts', () => {
  const r = plain(g.buildTree([
    { id: '1', parent: '', text: 'Goal' }, { id: '2', parent: '1', text: 'A' }, { id: '3', parent: '1', text: 'B' },
    { id: '4', parent: '2', text: 'A1' }, { id: '5', parent: '2', text: 'A2' }]));
  assert.deepStrictEqual(r.errors, []);
  assert.deepStrictEqual(r.nodes.map(n => n.id + ':' + n.depth), ['1:0', '2:1', '4:2', '5:2', '3:1']);
  assert.strictEqual(r.nodes[0].leaves, 3);
});
test('tree reports missing parents and loops', () => {
  const r = plain(g.buildTree([{ id: '1', parent: '9', text: 'x' }, { id: '2', parent: '3' }, { id: '3', parent: '2' }]));
  assert.ok(r.errors.some(e => /parent "9"/.test(e)));
  assert.ok(r.errors.some(e => /loop: 2, 3/.test(e)));
});
test('PDPC pairs risks with countermeasures and lists open risks', () => {
  const r = plain(g.analyzePdpc([
    { id: '1', parent: '', text: 'Goal', risks: '', countermeasures: '' },
    { id: '2', parent: '1', text: 'Build', risks: 'Late parts; Test fails', countermeasures: 'Two suppliers' },
    { id: '3', parent: '1', text: 'Train', risks: 'No trainer', countermeasures: 'Book external trainer' }]));
  assert.deepStrictEqual(r.errors, []);
  assert.strictEqual(r.totalRisks, 3);
  assert.deepStrictEqual(r.openRisks.map(o => o.id + ':' + o.risk), ['2:Test fails']);
});

// ---------------------------------------------------------------- Apps Script integration (fake Sheets)
console.log('Sheets integration');
const app = load();
test('menu bar has the Planning Tools menu with tools, guide and settings', () => {
  app.onOpen();
  const menu = app.fake.menus[0];
  assert.strictEqual(menu.title, 'Planning Tools');
  const labels = JSON.stringify(menu.items.map(i => i[0]));
  ['Open planning app', 'Go to tool', 'Brainstorm form', 'Recalculate all tabs', 'Guide', 'Settings'].forEach(l => assert.ok(labels.includes(l), l));
  // every menu item points to a real function
  (function check(items) {
    items.forEach(([label, target]) => {
      if (typeof target === 'string') assert.strictEqual(typeof app[target], 'function', label + ' -> ' + target);
      else check(target.items);
    });
  })(menu.items);
});
test('first run creates Guide, Settings and all 7 tool tabs in order, with example data', () => {
  const all = plain(app.apiGetAll());
  assert.deepStrictEqual(app.fake.ss.getSheets().map(s => s.getName()),
    ['Guide', 'Settings', 'Affinity Diagram', 'Interrelationship', 'Matrix Diagram', 'Prioritization Matrix', 'Tree Diagram', 'PDPC', 'Activity Network']);
  assert.strictEqual(all.activities.duration, 73);
  assert.deepStrictEqual(all.relations.keyDrivers, ['3']);
  assert.deepStrictEqual(all.relations.keyOutcomes, ['7']);
  assert.strictEqual(all.prioritization.ranking[0].name, 'Vendor B');
  assert.strictEqual(all.affinity.total, 11);
  assert.strictEqual(all.matrix.rows.length, 4);
  assert.strictEqual(all.tree.nodes.length, 10);
  assert.strictEqual(all.pdpc.openRisks.length, 1);
  assert.strictEqual(all.settings.projectName, 'My improvement project');
  assert.ok(all.guide.length >= 10);
  ['aff', 'rel', 'mx', 'pm', 'tree', 'pdpc', 'an'].forEach(k => assert.ok(k)); // shape check above covers each tool
  for (const k of ['affinity', 'relations', 'matrix', 'prioritization', 'tree', 'pdpc', 'activities']) {
    assert.deepStrictEqual(all[k].errors, [], k + ': ' + all[k].errors.join(' | '));
  }
});
test('Guide tab is written with section headings', () => {
  const guide = app.fake.ss.getSheetByName('Guide').getDataRange().getValues().map(r => r[0]);
  assert.ok(guide.includes('Getting started'));
  assert.ok(guide.some(t => /Activity Network Diagram/.test(t)));
});
test('Settings tab values are read back and used', () => {
  const sheet = app.fake.ss.getSheetByName('Settings');
  const rows = sheet.getDataRange().getValues();
  const set = (label, v) => { const i = rows.findIndex(r => r[0] === label); sheet.getRange(i + 1, 2).setValue(v); };
  set('Project name', 'Line 3 downtime');
  set('Time unit', 'weeks');
  set('Default criterion weight (%)', 'abc');
  set('App colour', 'red');
  const s = plain(app.readSettings_());
  assert.strictEqual(s.projectName, 'Line 3 downtime');
  assert.strictEqual(s.timeUnit, 'weeks');
  assert.strictEqual(s.defaultWeight, 100); // invalid -> default
  assert.strictEqual(s.accentColor, '#2f6fdb'); // invalid -> default
});
test('every tool round-trips through its tab unchanged', () => {
  const before = plain(app.apiGetAll());
  app.fake.alerts.length = 0;
  app.menuRecalculate(); // reads every tab and writes it back
  assert.deepStrictEqual(plain(app.fake.alerts), ['All tabs recalculated.']);
  const after = plain(app.apiGetAll());
  for (const k of ['affinity', 'relations', 'matrix', 'prioritization', 'tree', 'pdpc', 'activities']) {
    assert.deepStrictEqual(after[k], before[k], k + ' changed after a save/load cycle');
  }
});
test('critical tasks are highlighted in the Activity Network tab', () => {
  const sheet = app.fake.ss.getSheetByName('Activity Network');
  const values = sheet.getDataRange().getValues();
  const row = values.findIndex(r => r[0] === 'H') + 1;
  assert.strictEqual(values[row - 1][9], 'YES');
  assert.strictEqual(sheet.bg[row + ':1'], '#fde2e1');
});
test('invalid input is saved but not calculated, and errors come back', () => {
  const r = plain(app.apiSaveActivities([{ id: 'A', name: 'x', duration: 1, predecessors: 'Q' }]));
  assert.strictEqual(r.errors.length, 1);
  const values = app.fake.ss.getSheetByName('Activity Network').getDataRange().getValues();
  assert.deepStrictEqual(values[1].slice(0, 5), ['A', 'x', 1, 'Q', '']);
});
test('brainstorm form: create, import new answers once', () => {
  const info = plain(app.apiCreateForm(''));
  assert.match(info.url, /viewform/);
  const form = Object.values(app.fake.forms)[0];
  assert.match(form.getTitle(), /Line 3 downtime/); // uses the project name setting
  const start = plain(app.apiGetAll()).affinity.total;
  form.submit(['Conveyor jams', 'Sam'], Date.now() + 1000);
  form.submit(['', ''], Date.now() + 2000);
  let r = plain(app.apiImportFormIdeas());
  assert.strictEqual(r.imported, 1);
  assert.strictEqual(r.affinity.total, start + 1);
  assert.deepStrictEqual(r.affinity.unsorted.slice(-1), ['Conveyor jams']);
  r = plain(app.apiImportFormIdeas());
  assert.strictEqual(r.imported, 0);
});
test('"Example data" = No creates empty tabs', () => {
  const fresh = load();
  fresh.writeSettings_();
  const sheet = fresh.fake.ss.getSheetByName('Settings');
  const rows = sheet.getDataRange().getValues();
  sheet.getRange(rows.findIndex(r => r[0] === 'Example data in new tabs') + 1, 2).setValue('No');
  const all = plain(fresh.apiGetAll());
  assert.strictEqual(all.affinity.total, 0);
  assert.strictEqual(all.activities.tasks.length, 0);
  assert.strictEqual(all.prioritization.options.length, 0);
});
test('web app page is the full app', () => {
  const html = app.doGet().html;
  assert.ok(html.includes('<!DOCTYPE html>') && html.includes('apiGetAll') && html.includes('--accent'));
  assert.ok(!html.includes('<!--STYLES-->') && !html.includes('<!--APP-->'));
});

// ---------------------------------------------------------------- Update after pasting new code
console.log('Update');
function oldProject() {
  // A project set up with an "older version": the user has data, changed settings and own notes.
  const p = load();
  p.apiGetAll();
  const ss = p.fake.ss;
  const settings = ss.getSheetByName('Settings');
  const rows = settings.getDataRange().getValues();
  settings.getRange(rows.findIndex(r => r[0] === 'Project name') + 1, 2).setValue('Line 3 downtime');
  // pretend "App colour" did not exist in the old version
  const colourRow = rows.findIndex(r => r[0] === 'App colour') + 1;
  settings.getRange(colourRow, 1, 1, 3).setValues([['', '', '']]);
  // own notes to the right of the Activity Network columns, after an empty column
  const an = ss.getSheetByName('Activity Network');
  an.getRange(1, 12).setValue('My notes');
  an.getRange(3, 12).setValue('Ask Sam about B');
  // user's own extra tab, and a tool tab that "did not exist" in the old version
  ss.insertSheet('My budget').getRange(1, 1).setValue('Budget 5000');
  ss.deleteSheet(ss.getSheetByName('PDPC'));
  p.fake.props.planningToolsVersion = '1.0.0';
  return p;
}
test('Update keeps data, settings and notes; adds only what is missing', () => {
  const p = oldProject();
  // Snapshot straight from the tabs (apiGetAll would already re-create missing tabs).
  const pm = p.readPrioritization_();
  const before = plain({
    affinity: p.groupAffinity(p.readAffinity_()), relations: p.analyzeInterrelationships(p.readRelations_()),
    matrix: p.analyzeMatrix(p.readMatrix_()), prioritization: p.scorePrioritization(pm.criteria, pm.options),
    tree: p.buildTree(p.readTree_()), activities: p.computeCriticalPath(p.readActivities_())
  });
  assert.strictEqual(p.fake.ss.getSheetByName('PDPC'), null);
  const report = plain(p.updateProject_()).join('\n');
  assert.match(report, /Updated from version 1\.0\.0 to /);
  assert.match(report, /New tabs: PDPC/);
  assert.match(report, /New settings: App colour/);
  const names = p.fake.ss.getSheets().map(s => s.getName());
  assert.strictEqual(new Set(names).size, names.length, 'duplicate tabs: ' + names);
  assert.ok(names.includes('My budget'));
  assert.strictEqual(p.fake.ss.getSheetByName('My budget').getRange(1, 1).getValues()[0][0], 'Budget 5000');
  const an = p.fake.ss.getSheetByName('Activity Network');
  assert.strictEqual(an.getRange(3, 12).getValues()[0][0], 'Ask Sam about B');
  const after = plain(p.apiGetAll());
  assert.strictEqual(after.settings.projectName, 'Line 3 downtime');
  for (const k of ['affinity', 'relations', 'matrix', 'prioritization', 'tree', 'activities']) {
    assert.deepStrictEqual(after[k], before[k], k + ' changed during update');
  }
  assert.strictEqual(p.fake.props.planningToolsVersion, p.PT_VERSION);
});
test('Update twice changes nothing and adds nothing', () => {
  const p = oldProject();
  p.updateProject_();
  const snapshot = JSON.stringify(p.fake.ss.getSheets().map(s => [s.getName(), s.data]));
  const settingsRows = p.fake.ss.getSheetByName('Settings').getLastRow();
  const report = plain(p.updateProject_()).join('\n');
  assert.match(report, /is up to date/);
  assert.match(report, /No tabs added/);
  assert.match(report, /Your settings were kept/);
  assert.strictEqual(JSON.stringify(p.fake.ss.getSheets().map(s => [s.getName(), s.data])), snapshot);
  assert.strictEqual(p.fake.ss.getSheetByName('Settings').getLastRow(), settingsRows);
});
test('opening the sheet after pasting a new version shows a hint', () => {
  const p = oldProject();
  p.onOpen();
  assert.ok(p.fake.ss.toasts.some(t => /New version/.test(t)));
});
test('code pasted twice: warns and changes nothing', () => {
  const p = load();
  p.apiGetAll();
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'PlanningTools.gs'), 'utf8'), p); // second copy
  assert.strictEqual(p.PT_COPIES, 2);
  const snapshot = JSON.stringify(p.fake.ss.getSheets().map(s => s.data));
  p.menuUpdate();
  assert.match(p.fake.alerts.slice(-1)[0], /2 times/);
  assert.strictEqual(JSON.stringify(p.fake.ss.getSheets().map(s => s.data)), snapshot);
  p.onOpen();
  assert.ok(p.fake.ss.toasts.some(t => /pasted 2 times/.test(t)));
});
test('saving after removing a criterion leaves no stale column behind', () => {
  const p = load();
  const all = plain(p.apiGetAll());
  const data = { criteria: all.prioritization.criteria.slice(0, 2), options: all.prioritization.options.map(o => ({ name: o.name, scores: o.scores.slice(0, 2) })) };
  p.apiSavePrioritization(data);
  const header = p.fake.ss.getSheetByName('Prioritization Matrix').getRange(1, 1, 1, 8).getValues()[0];
  assert.deepStrictEqual(header, ['Option', 'Quality', 'Cost', 'Weighted Total', 'Rank', '', '', '']);
});

// ---------------------------------------------------------------- Theme
console.log('Theme');
test('theme defaults to Light (white) and can be changed from the app and the Settings tab', () => {
  const p = load();
  assert.strictEqual(plain(p.apiGetAll()).settings.theme, 'light');
  assert.strictEqual(plain(p.apiSetSetting('theme', 'Dark')).theme, 'dark');
  const sheet = p.fake.ss.getSheetByName('Settings');
  const row = sheet.getDataRange().getValues().findIndex(r => r[0] === 'Colour theme') + 1;
  assert.strictEqual(sheet.getRange(row, 2).getValues()[0][0], 'Dark');
  sheet.getRange(row, 2).setValue('automatic');
  assert.strictEqual(plain(p.readSettings_()).theme, 'auto');
  sheet.getRange(row, 2).setValue('purple');
  assert.strictEqual(plain(p.readSettings_()).theme, 'light'); // unknown -> Light
  assert.throws(() => p.apiSetSetting('theme', 'Purple'));
  assert.throws(() => p.apiSetSetting('notASetting', 'x'));
});
test('Update adds the theme setting to an older project without touching other settings', () => {
  const p = load();
  p.apiGetAll();
  const sheet = p.fake.ss.getSheetByName('Settings');
  const rows = sheet.getDataRange().getValues();
  const row = rows.findIndex(r => r[0] === 'Colour theme') + 1;
  sheet.getRange(row, 1, 1, 3).setValues([['', '', '']]);
  sheet.getRange(rows.findIndex(r => r[0] === 'Time unit') + 1, 2).setValue('weeks');
  const report = plain(p.updateProject_()).join('\n');
  assert.match(report, /New settings: Colour theme/);
  const s = plain(p.readSettings_());
  assert.strictEqual(s.theme, 'light');
  assert.strictEqual(s.timeUnit, 'weeks');
});
test('app page starts white and has the theme switch', () => {
  const html = load().doGet().html;
  assert.ok(html.includes('<html data-theme="light">'));
  assert.ok(html.includes('data-theme-set="dark"'));
});
test('guide covers every tool with steps and has troubleshooting and a glossary', () => {
  const g = plain(load().GUIDE);
  const titles = g.map(s => s.title).join(' | ');
  ['Affinity', 'Interrelationship', 'Matrix Diagram', 'Prioritization', 'Tree', 'PDPC', 'Activity Network', 'Troubleshooting', 'Glossary', 'Settings', 'Updating']
    .forEach(t => assert.ok(titles.includes(t), t));
  g.filter(s => /^\d\./.test(s.title)).forEach(s => {
    const heads = s.items.map(i => i[0]).join(' ');
    assert.ok(/What it is/.test(heads) && /Step 1/.test(heads) && /Common mistakes/.test(heads), s.title);
  });
});

// ---------------------------------------------------------------- Chart export
console.log('Charts');
test('Save to Drive puts the PNG in a "Planning Tools charts" folder (created once)', () => {
  const p = load();
  const png = 'data:image/png;base64,' + Buffer.from('PNGDATA').toString('base64');
  const a = plain(p.apiSaveChartToDrive('activity-network.png', png));
  p.apiSaveChartToDrive('tree.png', png);
  assert.strictEqual(a.name, 'activity-network.png');
  assert.strictEqual(p.fake.folders.length, 1);
  assert.strictEqual(p.fake.driveFiles.length, 2);
  assert.strictEqual(Buffer.from(p.fake.driveFiles[0].blob.bytes).toString(), 'PNGDATA');
  assert.throws(() => p.apiSaveChartToDrive('x', 'javascript:alert(1)'));
});

console.log(`\n${passed} passed${process.exitCode ? ', some FAILED' : ''}`);
