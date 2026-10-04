const test = require('node:test');
const assert = require('node:assert/strict');
const { Spreadsheet, createEnv, fakeResponse } = require('./gas-mock');

const QC_TABS = ['QC Guide', 'QC Settings', 'QC Summary', 'QC Records', 'QC Lists', 'QC Specs', 'QC Events'];

test('setup adds the QC tabs to the current Sheet and leaves your tabs alone', () => {
  const ss = new Spreadsheet('ss1', 'My business');
  const mine = ss.addSheet('My data', [['Customer', 'Amount'], ['ACME', 12]]);
  ss.addSheet('Sheet1');
  const env = createEnv(ss);
  env.ctx.setup();

  assert.deepEqual(ss.names(), ['My data', 'Sheet1'].concat(QC_TABS));
  assert.equal(mine.get(2, 1), 'ACME');
  assert.equal(ss.getSheetByName('QC Records').get(1, 8), 'Kind');
  assert.equal(ss.getSheetByName('QC Lists').get(2, 4), 'Scratch');
  assert.equal(ss.getSheetByName('QC Summary').charts.length, 2);
  assert.match(String(ss.getSheetByName('QC Summary').get(13, 1)), /^=IFERROR\(QUERY\('QC Records'!A1:L/);
  const guide = ss.getSheetByName('QC Guide');
  let formRow = 0;
  for (let r = 1; r <= guide.getLastRow(); r++) if (guide.get(r, 1) === 'Check sheet form') formRow = r;
  assert.match(String(guide.get(formRow, 2)), /HYPERLINK\("https:\/\/docs.google.com\/forms\/d\/form1/);
  assert.equal(ss.active, 'QC Guide');
  assert.equal(env.formsCreated, 1);
  assert.equal(env.forms.form1.dest, null, 'form must not add a Form Responses tab');
  assert.deepEqual(env.triggers.map(t => t.getHandlerFunction()), ['handleFormSubmit']);
  assert.equal(env.props.SPREADSHEET_ID, 'ss1');
});

test('running setup again duplicates nothing and keeps data', () => {
  const ss = new Spreadsheet('ss1', 'My business');
  const env = createEnv(ss);
  env.ctx.setup();
  env.ctx.loadDemoData();
  const rec = ss.getSheetByName('QC Records');
  const rows = rec.getLastRow();
  assert.equal(rows, 1 + 35 * 2 * 11);
  ss.getSheetByName('QC Lists').set(2, 4, 'My own defect');

  env.ctx.setup();
  env.ctx.setup();
  assert.deepEqual(ss.names(), QC_TABS);
  assert.equal(rec.getLastRow(), rows);
  assert.equal(ss.getSheetByName('QC Lists').get(2, 4), 'My own defect');
  assert.equal(ss.getSheetByName('QC Summary').charts.length, 2);
  assert.equal(env.formsCreated, 1);
  assert.equal(env.triggers.length, 1);
  assert.equal(ss.getSheetByName('QC Events').getLastRow(), 2);

  env.ctx.removeDemoData();
  assert.equal(rec.getLastRow(), 1);
  assert.equal(ss.getSheetByName('QC Events').getLastRow(), 1);
});

test('upgrading from the first version renames its tabs and removes the Form Responses copy', () => {
  const ss = new Spreadsheet('ss1', 'Old install');
  const env = createEnv(ss);
  const QC = env.ctx.QC;
  const oldRec = ss.addSheet('Records', [QC.RECORD_HEADERS, ['r1#0', '', '2026-09-01', 'P', 'A', 'Day', 'X', 'Count', 'Dent', 2, '', 'Form']]);
  ss.addSheet('Lists', [QC.LIST_HEADERS, ['P', 'A', 'Day', 'Dent', '']]);
  ss.addSheet('Specs', [QC.SPEC_HEADERS]);
  ss.addSheet('Events', [QC.EVENT_HEADERS]);
  ss.addSheet('How to use', [['QC Tools - how to use']]);
  const form = env.newForm();
  form.setDestination('SPREADSHEET', 'ss1');
  env.props.FORM_ID = form.getId();
  env.props.SPREADSHEET_ID = 'ss1';
  env.props.OWNER = 'owner@example.com';
  env.triggers.push({ getHandlerFunction: () => 'onOpen' });
  assert.ok(ss.names().includes('Form Responses 1'));

  env.ctx.setup();
  assert.deepEqual(ss.names(), ['QC Records', 'QC Lists', 'QC Specs', 'QC Events', 'QC Guide', 'QC Settings', 'QC Summary']);
  assert.equal(ss.getSheetByName('QC Records'), oldRec);
  assert.equal(oldRec.get(2, 9), 'Dent');
  assert.equal(ss.getSheetByName('QC Lists').get(2, 4), 'Dent');
  assert.equal(form.dest, null);
  assert.equal(env.formsCreated, 1, 'the existing form is reused');
  assert.deepEqual(env.triggers.map(t => t.getHandlerFunction()), ['handleFormSubmit']);
});

test('a tab of yours that happens to be called "Events" is never renamed or overwritten', () => {
  const ss = new Spreadsheet('ss1', 'Mixed');
  const yours = ss.addSheet('Events', [['Meeting', 'Room'], ['Kickoff', '2B']]);
  const env = createEnv(ss);
  env.ctx.setup();
  assert.equal(ss.getSheetByName('Events'), yours);
  assert.equal(yours.get(2, 1), 'Kickoff');
  assert.ok(ss.getSheetByName('QC Events'));
});

test('a copied Sheet gets its own form instead of reusing the original one', () => {
  const ss = new Spreadsheet('copy1', 'Copy of My business');
  const env = createEnv(ss);
  const original = env.newForm();
  Object.assign(env.props, { SPREADSHEET_ID: 'orig', FORM_ID: original.getId(), OWNER: 'someone-else@example.com' });
  env.ctx.setup();
  assert.equal(env.formsCreated, 2);
  assert.notEqual(env.props.FORM_ID, original.getId());
  assert.equal(env.props.SPREADSHEET_ID, 'copy1');
  assert.equal(env.props.OWNER, 'owner@example.com');
});

test('setup outside a Sheet explains what to do and creates nothing', () => {
  const ss = new Spreadsheet('ss1', 'x');
  const env = createEnv(ss);
  env.active = null;
  assert.throws(() => env.ctx.setup(), /Open the Google Sheet you want to use/);
  assert.equal(env.formsCreated, 0);
});

const settingsRow = (ss, key) => {
  const sh = ss.getSheetByName('QC Settings');
  for (let r = 2; r <= sh.getLastRow(); r++) if (sh.get(r, 4) === key) return r;
  return -1;
};
const setSetting = (ss, key, value) => ss.getSheetByName('QC Settings').set(settingsRow(ss, key), 2, value);

test('QC Settings is created with defaults and the Sheet name as organisation', () => {
  const ss = new Spreadsheet('ss1', 'Bakery Nord');
  const env = createEnv(ss);
  env.ctx.setup();
  const form = env.forms.form1;
  assert.equal(ss.getSheetByName('QC Settings').get(settingsRow(ss, 'org'), 2), 'Bakery Nord');
  assert.equal(form.title, 'Bakery Nord - QC Check Sheet');
  assert.equal(env.driveNames.form1, 'Bakery Nord - QC Check Sheet');
  assert.equal(form.accepting, true);
  assert.equal(form.titles()[1], 'Project');
  assert.equal(ss.getSheetByName('QC Guide').get(1, 1), 'Bakery Nord - QC Tools');
  assert.equal(ss.getSheetByName('QC Summary').get(1, 1), 'Bakery Nord - QC Summary');
});

test('Apply settings renames the form, questions, guide and summary in place', () => {
  const ss = new Spreadsheet('ss1', 'Bakery Nord');
  const env = createEnv(ss);
  env.ctx.setup();
  const form = env.forms.form1;
  const idsBefore = form.items.map(i => i.getId());
  const scratchId = form.items.find(i => i.getTitle() === 'Scratch').getId();

  setSetting(ss, 'org', 'ACME GmbH');
  setSetting(ss, 'formTitle', '{org} Daily Inspection');
  setSetting(ss, 'labelProject', 'Customer');
  setSetting(ss, 'labelArea', 'Department');
  setSetting(ss, 'formOpen', 'No');
  setSetting(ss, 'menuName', 'ACME Quality');
  const lists = ss.getSheetByName('QC Lists');
  lists.set(3, 4, 'Burnt');          // rename "Dent" -> "Burnt"
  lists.set(7, 4, 'Too small');      // add a defect type
  env.ctx.applySettings();

  assert.equal(env.formsCreated, 1, 'same form, no new one');
  assert.equal(form.title, 'ACME GmbH Daily Inspection');
  assert.equal(env.driveNames.form1, 'ACME GmbH Daily Inspection');
  assert.equal(form.accepting, false);
  const titles = form.titles();
  assert.deepEqual(titles.slice(0, 5), ['Date', 'Customer', 'Department', 'Shift', 'Recorded by']);
  assert.ok(titles.includes('Burnt') && titles.includes('Too small') && !titles.includes('Dent'));
  assert.equal(form.items.find(i => i.getTitle() === 'Scratch').getId(), scratchId, 'unchanged questions keep their id');
  assert.equal(titles[titles.length - 1], 'Notes');
  assert.ok(idsBefore.filter(id => form.items.some(i => i.getId() === id)).length >= idsBefore.length - 1);
  assert.equal(ss.getSheetByName('QC Guide').get(1, 1), 'ACME GmbH - QC Tools');
  assert.equal(ss.getSheetByName('QC Summary').get(1, 1), 'ACME GmbH - QC Summary');
  assert.equal(env.ctx.apiMeta().labels.project, 'Customer');
  assert.equal(env.ctx.apiMeta().title, 'ACME GmbH - QC Dashboard');
  assert.equal(ss.getSheetByName('QC Settings').get(settingsRow(ss, 'labelArea'), 2), 'Department', 'your values are kept');

  // A blank value falls back to the default
  setSetting(ss, 'labelProject', '');
  env.ctx.applySettings();
  assert.equal(form.titles()[1], 'Project');
});

test('the form map still identifies renamed questions when answers arrive', () => {
  const ss = new Spreadsheet('ss1', 'Shop');
  const env = createEnv(ss);
  env.ctx.setup();
  setSetting(ss, 'labelProject', 'Customer');
  env.ctx.applySettings();
  const form = env.forms.form1;
  const byTitle = t => form.items.find(i => i.getTitle() === t).getId();
  const rows = env.ctx.answersToRecords_({ responseId: 'R', timestamp: 'T', fallbackDay: '2026-09-26',
    answers: { [byTitle('Customer')]: 'General', [byTitle('Scratch')]: '4' } }, JSON.parse(env.props.FORM_MAP));
  const scratch = rows.find(r => r[8] === 'Scratch');
  assert.equal(scratch[3], 'General');
  assert.equal(scratch[9], 4);
});

test('an existing install gets QC Settings placed right after QC Guide', () => {
  const ss = new Spreadsheet('ss1', 'Old');
  const env = createEnv(ss);
  env.ctx.setup();
  ss.sheets = ss.sheets.filter(s => s.getName() !== 'QC Settings');
  env.ctx.setup();
  assert.deepEqual(ss.names(), QC_TABS);
});

test('setup and Apply settings do not re-insert the summary charts every time', () => {
  const ss = new Spreadsheet('ss1', 'Speed');
  const env = createEnv(ss);
  env.ctx.setup();
  assert.equal(ss.chartInserts, 2);
  env.ctx.setup();
  env.ctx.setup();
  assert.equal(ss.chartInserts, 2, 'setup reuses existing charts');
  env.ctx.applySettings();
  assert.equal(ss.chartInserts, 4, 'Apply settings refreshes them once');
  assert.equal(ss.getSheetByName('QC Summary').charts.length, 2);
});

test('Import missing form responses only adds what is missing, and resumes after a time stop', () => {
  const ss = new Spreadsheet('ss1', 'Sync');
  const env = createEnv(ss);
  env.ctx.setup();
  const form = env.forms.form1;
  for (let i = 1; i <= 5; i++) {
    form.responses.push(fakeResponse(form, 'resp' + i, { 'Date': '2026-10-0' + i, 'Project': 'General', 'Recorded by': 'Ann', 'Scratch': String(i) }));
  }
  const rec = ss.getSheetByName('QC Records');

  // A zero time budget stops before importing anything, and says there is more.
  const first = env.ctx.syncResponses_(ss, form, -1);
  assert.equal(first.rows, 0);
  assert.equal(first.more, true);

  assert.equal(env.ctx.syncFormResponses(), 25, '5 answers x 5 defect types');
  const n = rec.getLastRow();
  assert.equal(env.ctx.syncFormResponses(), 0, 'nothing imported twice');
  assert.equal(rec.getLastRow(), n);
  const recs = env.ctx.readRecords_(ss);
  assert.equal(recs.filter(r => r.item === 'Scratch').reduce((a, r) => a + r.value, 0), 15);
});
