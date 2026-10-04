// A small in-memory imitation of the Apps Script services setup() uses, so setup can run in Node.
// Unknown methods on ranges, builders and items are chainable no-ops.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function chain(target) {
  const p = new Proxy(target, { get(t, k) { return k in t ? t[k] : () => p; } });
  return p;
}

function colNum(s) { let n = 0; for (const ch of s) n = n * 26 + ch.charCodeAt(0) - 64; return n; }
function parseA1(a1) {
  const m = a1.match(/^([A-Z]+)(\d*)(?::([A-Z]+)(\d*))?$/);
  const r1 = m[2] ? +m[2] : 1, c1 = colNum(m[1]);
  const c2 = m[3] ? colNum(m[3]) : c1;
  const r2 = m[3] ? (m[4] ? +m[4] : 1000) : (m[2] ? r1 : 1000);
  return [r1, c1, r2 - r1 + 1, c2 - c1 + 1];
}

let nextId = 1;
class Sheet {
  constructor(ss, name) { this.ss = ss; this.name = name; this.id = nextId++; this.cells = new Map(); this.charts = []; this.formUrl = null; }
  key(r, c) { return r + ',' + c; }
  get(r, c) { return this.cells.has(this.key(r, c)) ? this.cells.get(this.key(r, c)) : ''; }
  set(r, c, v) { if (v === '' || v == null) this.cells.delete(this.key(r, c)); else this.cells.set(this.key(r, c), v); }
  getName() { return this.name; }
  setName(n) { this.name = n; return chain(this); }
  getSheetId() { return this.id; }
  getIndex() { return this.ss.sheets.findIndex(x => x.getSheetId() === this.id) + 1; }
  getFormUrl() { return this.formUrl; }
  getLastRow() { let m = 0; for (const k of this.cells.keys()) m = Math.max(m, +k.split(',')[0]); return m; }
  getLastColumn() { let m = 0; for (const k of this.cells.keys()) m = Math.max(m, +k.split(',')[1]); return m; }
  getMaxRows() { return 1000; }
  clear() { this.cells.clear(); return chain(this); }
  appendRow(row) { const r = this.getLastRow() + 1; row.forEach((v, i) => this.set(r, i + 1, v)); return chain(this); }
  getCharts() { return this.charts.slice(); }
  removeChart(c) { this.charts = this.charts.filter(x => x !== c); }
  insertChart(c) { this.charts.push(c); this.ss.chartInserts = (this.ss.chartInserts || 0) + 1; }
  newChart() { return chain({ build: () => ({ chart: true }) }); }
  getDataRange() { return this.getRange(1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn())); }
  getRange(a, b, c, d) {
    let [r, col, nr, nc] = typeof a === 'string' ? parseA1(a) : [a, b, c || 1, d || 1];
    const sh = this;
    return chain({
      getValue: () => sh.get(r, col),
      getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => sh.get(r + i, col + j))),
      setValues(v) { v.forEach((row, i) => row.forEach((x, j) => sh.set(r + i, col + j, x))); return this; },
      setValue(v) { sh.set(r, col, v); return this; },
      setFormula(f) { sh.set(r, col, f); return this; },
      clearContent() { for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) sh.set(r + i, col + j, ''); return this; }
    });
  }
}

class Spreadsheet {
  constructor(id, name) { this.id = id; this.name = name; this.sheets = []; this.toasts = []; }
  getId() { return this.id; }
  getName() { return this.name; }
  getUrl() { return 'https://docs.google.com/spreadsheets/d/' + this.id; }
  getSpreadsheetTimeZone() { return 'UTC'; }
  getSheets() { return this.sheets.slice(); }
  getSheetByName(n) { return this.sheets.find(s => s.name === n) || null; }
  insertSheet(name, idx) {
    if (this.getSheetByName(name)) throw new Error('A sheet with the name "' + name + '" already exists');
    const s = chain(new Sheet(this, name));
    this.sheets.splice(idx === undefined ? this.sheets.length : idx, 0, s);
    return s;
  }
  deleteSheet(s) {
    const real = this.sheets.find(x => x.getSheetId() === s.getSheetId());
    if (real.formUrl) throw new Error('Cannot delete a sheet that is linked to a form');
    this.sheets = this.sheets.filter(x => x !== real);
  }
  toast(m) { this.toasts.push(m); }
  setActiveSheet(s) { this.active = s && s.getName(); }
  addSheet(name, rows) { const s = chain(new Sheet(this, name)); this.sheets.push(s); (rows || []).forEach(r => s.appendRow(r)); return s; }
  names() { return this.sheets.map(s => s.name); }
}

class Form {
  constructor(env, id) { this.env = env; this.id = id; this.items = []; this.dest = null; this.responses = []; this.nextItem = 1; }
  getId() { return this.id; }
  getPublishedUrl() { return 'https://docs.google.com/forms/d/' + this.id + '/viewform'; }
  getItems() { return this.items.slice(); }
  deleteItem(it) { this.items = this.items.filter(x => x !== it); }
  getResponses() { return this.responses; }
  setDestination(type, ssId) { this.dest = ssId; const ss = this.env.sheetsById[ssId]; const s = ss.addSheet('Form Responses 1'); s.formUrl = 'https://docs.google.com/forms/d/' + this.id + '/edit'; return this; }
  getDestinationId() { if (!this.dest) throw new Error('No destination'); return this.dest; }
  removeDestination() {
    const ss = this.env.sheetsById[this.dest];
    ss.sheets.forEach(s => { if (s.formUrl && s.formUrl.includes(this.id)) s.formUrl = null; });
    this.dest = null; return this;
  }
}
const ITEM_TYPES = { addDateItem: 'DATE', addListItem: 'LIST', addTextItem: 'TEXT', addParagraphTextItem: 'PARAGRAPH_TEXT', addSectionHeaderItem: 'SECTION_HEADER' };
Object.keys(ITEM_TYPES).forEach(m => {
  Form.prototype[m] = function () {
    const form = this, id = this.id + '-' + this.nextItem++;
    const item = { id, type: ITEM_TYPES[m], title: '', help: '', choices: null, required: false };
    const api = chain({
      getId: () => id,
      getType: () => item.type,
      getIndex: () => form.items.findIndex(x => x.getId() === id),
      getTitle: () => item.title,
      setTitle(t) { item.title = t; return api; },
      setHelpText(t) { item.help = t; return api; },
      setChoiceValues(c) { item.choices = c.slice(); return api; },
      setRequired(r) { item.required = r; return api; },
      asDateItem: () => api, asListItem: () => api, asTextItem: () => api, asParagraphTextItem: () => api, asSectionHeaderItem: () => api,
      _item: item
    });
    this.items.push(api);
    return api;
  };
});
Form.prototype.moveItem = function (from, to) { const [it] = this.items.splice(from, 1); this.items.splice(to, 0, it); };
Form.prototype.setConfirmationMessage = function (m) { this.confirmation = m; return this; };
Form.prototype.setAcceptingResponses = function (b) { this.accepting = b; return this; };
Form.prototype.titles = function () { return this.items.map(i => i.getTitle()); };
Form.prototype.setTitle = function (t) { this.title = t; return this; };
Form.prototype.setDescription = function (d) { this.description = d; return this; };

function createEnv(ss) {
  const env = { props: {}, triggers: [], forms: {}, formsCreated: 0, driveNames: {}, sheetsById: { [ss.getId()]: ss }, user: 'owner@example.com' };
  const ctx = {
    console, Logger: { log() {} },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => env.active === undefined ? ss : env.active,
      openById: id => env.sheetsById[id],
      create: () => { throw new Error('setup must not create a new spreadsheet'); },
      flush() {},
      newDataValidation: () => chain({})
    },
    FormApp: {
      create: () => { const id = 'form' + (++env.formsCreated); env.forms[id] = new Form(env, id); return env.forms[id]; },
      openById: id => { if (!env.forms[id]) throw new Error('no form'); return env.forms[id]; },
      createTextValidation: () => chain({}),
      DestinationType: { SPREADSHEET: 'SPREADSHEET' },
      ItemType: { DATE: 'DATE', LIST: 'LIST', TEXT: 'TEXT', PARAGRAPH_TEXT: 'PARAGRAPH_TEXT', SECTION_HEADER: 'SECTION_HEADER' }
    },
    ScriptApp: {
      getProjectTriggers: () => env.triggers.slice(),
      deleteTrigger: t => { env.triggers = env.triggers.filter(x => x !== t); },
      newTrigger: fn => chain({ create: () => { const t = { getHandlerFunction: () => fn }; env.triggers.push(t); return t; } })
    },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: k => (k in env.props ? env.props[k] : null),
      setProperty: (k, v) => { env.props[k] = String(v); },
      deleteProperty: k => { delete env.props[k]; }
    }) },
    Session: { getEffectiveUser: () => ({ getEmail: () => env.user }), getActiveUser: () => ({ getEmail: () => env.user }), getScriptTimeZone: () => 'UTC' },
    DriveApp: { getFileById: id => ({ getName: () => env.driveNames[id] || '', setName: n => { env.driveNames[id] = n; } }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Utilities: { formatDate: (d, tz, p) => p === 'yyyy-MM-dd' ? d.toISOString().slice(0, 10) : d.toISOString().slice(0, 16).replace('T', ' ') }
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'Code.gs'), 'utf8'), ctx, { filename: 'Code.gs' });
  env.ctx = ctx;
  env.newForm = () => ctx.FormApp.create();
  return env;
}

// A fake form answer: answers = { itemTitle: value }
function fakeResponse(form, id, answers, when) {
  return {
    getId: () => id,
    getTimestamp: () => when || new Date(Date.UTC(2026, 9, 1, 8)),
    getItemResponses: () => Object.keys(answers).map(title => {
      const item = form.items.find(i => i.getTitle() === title);
      return { getItem: () => item, getResponse: () => answers[title] };
    })
  };
}

module.exports = { Spreadsheet, createEnv, fakeResponse };
