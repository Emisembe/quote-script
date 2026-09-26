const test = require('node:test');
const assert = require('node:assert/strict');
const { Spreadsheet, createEnv } = require('./gas-mock');

const QC_TABS = ['QC Guide', 'QC Summary', 'QC Records', 'QC Lists', 'QC Specs', 'QC Events'];

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
  assert.match(String(ss.getSheetByName('QC Guide').get(12, 2)), /HYPERLINK\("https:\/\/docs.google.com\/forms\/d\/form1/);
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
  assert.deepEqual(ss.names(), ['QC Records', 'QC Lists', 'QC Specs', 'QC Events', 'QC Guide', 'QC Summary']);
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
