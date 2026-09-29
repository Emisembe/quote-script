/**
 * Minimal in-memory mock of the Apps Script services used by Code.gs.
 * Every mock object is wrapped in a Proxy that only allows methods that exist in the real
 * Apps Script API (listed in REAL below). Calling anything else throws, so a typo or an
 * invented method fails the test instead of failing later in Google Sheets.
 *
 * Sheet formulas are NOT evaluated (a formula cell reads back as ''). They are collected so
 * the tests can check brackets, quotes, sheet names and named ranges.
 */
'use strict';

// Real Apps Script methods / properties per class (subset used by Code.gs).
const REAL = {
  SpreadsheetApp: ['getActive', 'getActiveSpreadsheet', 'getUi', 'newTextStyle', 'newRichTextValue', 'newDataValidation',
    'newConditionalFormatRule', 'WrapStrategy', 'BorderStyle', 'GroupControlTogglePosition'],
  Spreadsheet: ['getSheetByName', 'insertSheet', 'setActiveSheet', 'moveActiveSheet', 'deleteSheet', 'getSheets', 'toast',
    'getRangeByName', 'setNamedRange', 'removeNamedRange', 'getName'],
  Sheet: ['getRange', 'getMaxRows', 'getMaxColumns', 'getLastRow', 'getLastColumn', 'insertRowsAfter', 'setColumnWidth',
    'setRowHeight', 'setRowHeights', 'setFrozenRows', 'setFrozenColumns', 'setHiddenGridlines', 'setTabColor', 'getCharts',
    'removeChart', 'insertChart', 'newChart', 'clear', 'clearConditionalFormatRules', 'setConditionalFormatRules',
    'getRowGroup', 'setRowGroupControlPosition', 'activate', 'getName'],
  Range: ['setValue', 'setValues', 'getValue', 'getValues', 'getDisplayValues', 'setFormula', 'setFormulas', 'setNote', 'setNotes',
    'clearNote', 'setBackground', 'setFontWeight', 'setFontColor', 'setFontSize', 'setFontStyle', 'setWrap', 'setWrapStrategy',
    'setHorizontalAlignment', 'setVerticalAlignment', 'setNumberFormat', 'merge', 'breakApart', 'clear', 'clearContent',
    'clearDataValidations', 'setDataValidation', 'insertCheckboxes', 'setBorder', 'setRichTextValue', 'shiftRowGroupDepth',
    'getA1Notation', 'activate', 'getRow', 'getColumn', 'getNumRows', 'getNumColumns', 'getSheet'],
  RowGroup: ['remove'],
  Ui: ['createMenu', 'alert', 'prompt', 'ButtonSet', 'Button'],
  Menu: ['addItem', 'addSeparator', 'addToUi'],
  PromptResponse: ['getResponseText', 'getSelectedButton'],
  TextStyleBuilder: ['setBold', 'setItalic', 'setFontSize', 'setForegroundColor', 'build'],
  RichTextValueBuilder: ['setText', 'setTextStyle', 'build'],
  DataValidationBuilder: ['requireValueInList', 'setAllowInvalid', 'build'],
  ConditionalFormatRuleBuilder: ['setGradientMaxpoint', 'setGradientMinpoint', 'setRanges', 'whenFormulaSatisfied',
    'whenTextStartsWith', 'whenTextEqualTo', 'setBackground', 'setFontColor', 'build'],
  EmbeddedChartBuilder: ['setChartType', 'addRange', 'setNumHeaders', 'setOption', 'setPosition', 'build'],
  PropertiesService: ['getDocumentProperties'],
  Properties: ['getProperty', 'setProperty', 'deleteProperty'],
  ScriptApp: ['newTrigger', 'getProjectTriggers', 'deleteTrigger'],
  TriggerBuilder: ['timeBased'],
  ClockTriggerBuilder: ['after', 'onMonthDay', 'atHour', 'create'],
  Trigger: ['getHandlerFunction'],
  UrlFetchApp: ['fetch'],
  HTTPResponse: ['getResponseCode', 'getContentText'],
  Utilities: ['formatDate', 'sleep'],
  Session: ['getScriptTimeZone'],
  Charts: ['ChartType'],
};

const calls = {}; // class.method → count (for the report)

function strict(kind, target) {
  const allowed = new Set(REAL[kind]);
  return new Proxy(target, {
    get(t, prop) {
      if (typeof prop === 'symbol' || prop === 'then' || prop === 'toJSON' || prop === 'inspect') return t[prop];
      if (prop === '__raw') return t;
      if (String(prop).startsWith('__')) return t[prop]; // mock-internal fields, never used by Code.gs
      if (!allowed.has(prop)) throw new Error(`Not a real Apps Script member (or not whitelisted): ${kind}.${String(prop)}`);
      if (!(prop in t)) throw new Error(`Mock does not implement ${kind}.${String(prop)}`);
      calls[`${kind}.${prop}`] = (calls[`${kind}.${prop}`] || 0) + 1;
      return t[prop];
    },
  });
}

function colLetter(n) {
  let s = '';
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

function createEnv(opts) {
  opts = opts || {};
  const state = {
    sheets: [], named: {}, props: {}, triggers: [], toasts: [], alerts: [], formulas: [], texts: [],
    menus: [], clock: 0, fetchLog: [], chartsBuilt: 0,
    confirmAnswer: true, promptAnswer: '', fetchHandler: null,
  };

  function sheetObj(name) {
    const sh = { name, cells: new Map(), maxRows: 1000, maxCols: 26, charts: [], frozen: 0, groups: 0 };
    const api = {};
    const key = (r, c) => r + ',' + c;
    const rangeObj = (r, c, nr, nc) => {
      if (!(r >= 1 && c >= 1 && nr >= 1 && nc >= 1)) throw new Error(`Bad range on ${name}: ${r},${c},${nr},${nc}`);
      if (r + nr - 1 > sh.maxRows || c + nc - 1 > sh.maxCols) {
        throw new Error(`Range outside the sheet ${name}: rows ${r}-${r + nr - 1} of ${sh.maxRows}, cols ${c}-${c + nc - 1} of ${sh.maxCols}`);
      }
      const R = {};
      const each = fn => { for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) fn(r + i, c + j, i, j); };
      const put = (rr, cc, v) => {
        if (v === undefined) throw new Error(`undefined written to ${name}!${colLetter(cc)}${rr}`);
        if (typeof v === 'number' && !isFinite(v)) throw new Error(`Non-finite number written to ${name}!${colLetter(cc)}${rr}`);
        if (typeof v === 'string' && v.charAt(0) === '=') state.formulas.push({ sheet: name, cell: colLetter(cc) + rr, f: v });
        else if (typeof v === 'string' && v) state.texts.push({ sheet: name, cell: colLetter(cc) + rr, t: v });
        if (v === '' || v === null) sh.cells.delete(key(rr, cc)); else sh.cells.set(key(rr, cc), v);
      };
      const read = (rr, cc) => {
        const v = sh.cells.get(key(rr, cc));
        if (v === undefined) return '';
        if (typeof v === 'string' && v.charAt(0) === '=') return '';
        return v;
      };
      const self = () => proxy;
      R.setValue = v => { put(r, c, v); return self(); };
      R.setValues = vals => {
        if (!Array.isArray(vals) || vals.length !== nr) throw new Error(`setValues: ${vals && vals.length} rows for a ${nr}-row range on ${name}`);
        vals.forEach((row, i) => {
          if (row.length !== nc) throw new Error(`setValues: row ${i} has ${row.length} cells for a ${nc}-column range on ${name}`);
        });
        each((rr, cc, i, j) => put(rr, cc, vals[i][j]));
        return self();
      };
      R.setFormula = f => {
        if (typeof f !== 'string' || f.charAt(0) !== '=') throw new Error(`setFormula without "=": ${f}`);
        put(r, c, f); return self();
      };
      R.setFormulas = fs => { each((rr, cc, i, j) => put(rr, cc, fs[i][j])); return self(); };
      R.getValue = () => read(r, c);
      R.getValues = () => { const out = []; for (let i = 0; i < nr; i++) { const row = []; for (let j = 0; j < nc; j++) row.push(read(r + i, c + j)); out.push(row); } return out; };
      R.getDisplayValues = () => R.getValues().map(row => row.map(v => String(v)));
      R.setNote = n => { if (n) state.texts.push({ sheet: name, cell: 'note', t: String(n) }); return self(); };
      R.setNotes = ns => {
        if (ns.length !== nr || ns[0].length !== nc) throw new Error(`setNotes size mismatch on ${name}: ${ns.length}x${ns[0].length} vs ${nr}x${nc}`);
        ns.forEach(row => row.forEach(n => { if (n) state.texts.push({ sheet: name, cell: 'note', t: String(n) }); }));
        return self();
      };
      ['clearNote', 'setBackground', 'setFontWeight', 'setFontColor', 'setFontSize', 'setFontStyle', 'setWrap', 'setWrapStrategy',
        'setHorizontalAlignment', 'setVerticalAlignment', 'setNumberFormat', 'merge', 'breakApart', 'clearDataValidations',
        'setDataValidation', 'setBorder', 'activate'].forEach(m => { R[m] = () => self(); });
      R.shiftRowGroupDepth = () => { sh.groups++; return self(); };
      R.clear = () => { each((rr, cc) => sh.cells.delete(key(rr, cc))); return self(); };
      R.clearContent = R.clear;
      R.insertCheckboxes = () => { each((rr, cc) => { const v = sh.cells.get(key(rr, cc)); if (v === undefined || v === '') sh.cells.set(key(rr, cc), false); }); return self(); };
      R.setRichTextValue = rt => { put(r, c, rt.text); return self(); };
      R.getA1Notation = () => (nr === 1 && nc === 1 ? colLetter(c) + r : `${colLetter(c)}${r}:${colLetter(c + nc - 1)}${r + nr - 1}`);
      R.getRow = () => r; R.getColumn = () => c; R.getNumRows = () => nr; R.getNumColumns = () => nc;
      R.getSheet = () => proxy_sheet;
      R.__pos = { sheet: name, r, c, nr, nc };
      const proxy = strict('Range', R);
      return proxy;
    };
    api.getRange = (r, c, nr, nc) => {
      if (typeof r === 'string') throw new Error('getRange(A1 string) not used by the mock');
      return rangeObj(r, c, nr || 1, nc || 1);
    };
    api.getMaxRows = () => sh.maxRows;
    api.getMaxColumns = () => sh.maxCols;
    api.getLastRow = () => { let m = 0; sh.cells.forEach((v, k) => { const rr = Number(k.split(',')[0]); if (rr > m) m = rr; }); return m; };
    api.getLastColumn = () => { let m = 0; sh.cells.forEach((v, k) => { const cc = Number(k.split(',')[1]); if (cc > m) m = cc; }); return m; };
    api.insertRowsAfter = (after, n) => { if (after !== sh.maxRows) throw new Error('insertRowsAfter only at the end in the mock'); sh.maxRows += n; return proxy_sheet; };
    ['setColumnWidth', 'setRowHeight', 'setRowHeights', 'setFrozenColumns', 'setHiddenGridlines', 'setTabColor',
      'clearConditionalFormatRules', 'setConditionalFormatRules', 'setRowGroupControlPosition'].forEach(m => { api[m] = () => proxy_sheet; });
    api.setFrozenRows = n => { sh.frozen = n; return proxy_sheet; };
    api.getCharts = () => sh.charts.slice();
    api.removeChart = ch => { sh.charts = sh.charts.filter(x => x !== ch); };
    api.insertChart = ch => { if (!ch || !ch.__chart) throw new Error('insertChart needs a built chart'); sh.charts.push(ch); state.chartsBuilt++; };
    api.newChart = () => chartBuilder(name);
    api.clear = () => { sh.cells.clear(); return proxy_sheet; };
    api.getRowGroup = () => { if (sh.groups > 0) { return strict('RowGroup', { remove: () => { sh.groups = 0; } }); } return null; };
    api.activate = () => { state.active = name; return proxy_sheet; };
    api.getName = () => sh.name;
    api.__sh = sh;
    const proxy_sheet = strict('Sheet', api);
    return proxy_sheet;
  }

  function chartBuilder(sheetName) {
    const c = { ranges: [], options: {}, type: null, pos: null };
    const b = {};
    b.setChartType = t => { if (!t) throw new Error('chart type undefined'); c.type = t; return proxy; };
    b.addRange = r => { if (!r || !r.__pos) throw new Error('addRange needs a Range'); c.ranges.push(r.__pos); return proxy; };
    b.setNumHeaders = () => proxy;
    b.setOption = (k, v) => { if (v === undefined) throw new Error(`chart option ${k} undefined`); c.options[k] = v; return proxy; };
    b.setPosition = (r, col) => { c.pos = [r, col]; return proxy; };
    b.build = () => {
      if (!c.type || !c.ranges.length || !c.pos) throw new Error(`Incomplete chart on ${sheetName}`);
      c.ranges.forEach(p => { if (p.sheet !== sheetName) throw new Error(`Chart on ${sheetName} uses data from ${p.sheet}`); });
      return { __chart: true, sheet: sheetName, spec: c };
    };
    const proxy = strict('EmbeddedChartBuilder', b);
    return proxy;
  }

  const ss = {};
  const findSheet = n => state.sheets.find(s => s.getName() === n) || null;
  ss.getSheetByName = n => findSheet(n);
  ss.insertSheet = (n, i) => {
    if (findSheet(n)) throw new Error('Sheet exists: ' + n);
    const s = sheetObj(n);
    if (i === undefined) state.sheets.push(s); else state.sheets.splice(i, 0, s);
    return s;
  };
  ss.setActiveSheet = s => { state.active = s.getName(); return s; };
  ss.moveActiveSheet = pos => {
    const i = state.sheets.findIndex(s => s.getName() === state.active);
    const [s] = state.sheets.splice(i, 1);
    state.sheets.splice(pos - 1, 0, s);
  };
  ss.deleteSheet = s => { state.sheets = state.sheets.filter(x => x !== s); };
  ss.getSheets = () => state.sheets.slice();
  ss.toast = (msg, title) => { state.toasts.push(`${title}: ${msg}`); };
  ss.getRangeByName = n => {
    const p = state.named[n];
    if (!p) return null;
    const s = findSheet(p.sheet);
    return s ? s.getRange(p.r, p.c, p.nr, p.nc) : null;
  };
  ss.setNamedRange = (n, range) => {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(n)) throw new Error('Bad named range ' + n);
    state.named[n] = Object.assign({}, range.__pos);
  };
  ss.removeNamedRange = n => { if (!state.named[n]) throw new Error('No named range ' + n); delete state.named[n]; };
  ss.getName = () => 'Test workbook';
  const ssProxy = strict('Spreadsheet', ss);
  state.sheets.push(sheetObj('Sheet1'));

  const text = () => {
    const st = {};
    const b = {};
    ['setBold', 'setItalic', 'setFontSize', 'setForegroundColor'].forEach(m => { b[m] = () => proxy; });
    b.build = () => ({ __style: true });
    const proxy = strict('TextStyleBuilder', b);
    return proxy;
  };
  const rich = () => {
    const v = {};
    const b = {};
    b.setText = t => { v.text = t; return proxy; };
    b.setTextStyle = (s, e, style) => {
      if (!(s >= 0 && e <= v.text.length && s <= e) || !style.__style) throw new Error(`Bad text style range ${s}-${e} of ${v.text.length}`);
      return proxy;
    };
    b.build = () => ({ text: v.text });
    const proxy = strict('RichTextValueBuilder', b);
    return proxy;
  };
  const validation = () => {
    const b = {};
    b.requireValueInList = (list) => {
      if (!Array.isArray(list) || !list.length) throw new Error('empty dropdown list');
      if (list.length > 500) throw new Error('dropdown list over 500 items');
      list.forEach(x => { if (typeof x !== 'string') throw new Error('dropdown values must be strings'); });
      return proxy;
    };
    b.setAllowInvalid = () => proxy;
    b.build = () => ({});
    const proxy = strict('DataValidationBuilder', b);
    return proxy;
  };
  const cfRule = () => {
    const b = {};
    ['setGradientMaxpoint', 'setGradientMinpoint', 'setBackground', 'setFontColor', 'whenTextStartsWith', 'whenTextEqualTo']
      .forEach(m => { b[m] = () => proxy; });
    b.whenFormulaSatisfied = f => { state.formulas.push({ sheet: '(conditional format)', cell: '', f }); return proxy; };
    b.setRanges = rs => { rs.forEach(r => { if (!r.__pos) throw new Error('setRanges needs Ranges'); }); return proxy; };
    b.build = () => ({});
    const proxy = strict('ConditionalFormatRuleBuilder', b);
    return proxy;
  };

  const Button = { YES: 'YES', NO: 'NO', OK: 'OK', CANCEL: 'CANCEL' };
  const ui = strict('Ui', {
    createMenu: title => {
      const items = [];
      const m = strict('Menu', {
        addItem: (label, fn) => { items.push([label, fn]); return m; },
        addSeparator: () => m,
        addToUi: () => { state.menus.push({ title, items }); },
      });
      return m;
    },
    alert: (a, b, c) => {
      if (c !== undefined) { state.alerts.push(`[confirm] ${a}: ${b}`); return state.confirmAnswer ? Button.YES : Button.NO; }
      state.alerts.push(String(a)); return Button.OK;
    },
    prompt: (title, msg) => {
      state.alerts.push(`[prompt] ${title}: ${msg}`);
      return strict('PromptResponse', { getResponseText: () => state.promptAnswer, getSelectedButton: () => Button.OK });
    },
    ButtonSet: { YES_NO: 'YES_NO', OK_CANCEL: 'OK_CANCEL' },
    Button,
  });

  const SpreadsheetApp = strict('SpreadsheetApp', {
    getActive: () => ssProxy,
    getActiveSpreadsheet: () => ssProxy,
    getUi: () => { if (state.noUi) throw new Error('Cannot call SpreadsheetApp.getUi() from this context.'); return ui; },
    newTextStyle: text,
    newRichTextValue: rich,
    newDataValidation: validation,
    newConditionalFormatRule: cfRule,
    WrapStrategy: { OVERFLOW: 'OVERFLOW', WRAP: 'WRAP', CLIP: 'CLIP' },
    BorderStyle: { SOLID: 'SOLID' },
    GroupControlTogglePosition: { BEFORE: 'BEFORE', AFTER: 'AFTER' },
  });

  const props = strict('Properties', {
    getProperty: k => (k in state.props ? state.props[k] : null),
    setProperty: (k, v) => { state.props[k] = String(v); return props; },
    deleteProperty: k => { delete state.props[k]; return props; },
  });
  const PropertiesService = strict('PropertiesService', { getDocumentProperties: () => props });

  const ScriptApp = strict('ScriptApp', {
    newTrigger: handler => strict('TriggerBuilder', {
      timeBased: () => {
        const t = { handler };
        const cb = strict('ClockTriggerBuilder', {
          after: ms => { t.after = ms; return cb; },
          onMonthDay: d => { t.monthDay = d; return cb; },
          atHour: h => { t.hour = h; return cb; },
          create: () => {
            const trig = strict('Trigger', { getHandlerFunction: () => handler });
            trig.__raw.spec = t;
            state.triggers.push(trig);
            return trig;
          },
        });
        return cb;
      },
    }),
    getProjectTriggers: () => state.triggers.slice(),
    deleteTrigger: t => { state.triggers = state.triggers.filter(x => x !== t); },
  });

  const UrlFetchApp = strict('UrlFetchApp', {
    fetch: (url, o) => {
      state.fetchLog.push(url);
      if (!state.fetchHandler) throw new Error('No network in tests: ' + url);
      const res = state.fetchHandler(url, o || {});
      return strict('HTTPResponse', { getResponseCode: () => res.code, getContentText: () => res.body });
    },
  });

  const pad = n => String(n).padStart(2, '0');
  const Utilities = strict('Utilities', {
    formatDate: (d, tz, fmt) => fmt.replace('yyyy', d.getFullYear()).replace('MM', pad(d.getMonth() + 1)).replace('dd', pad(d.getDate()))
      .replace('HH', pad(d.getHours())).replace('mm', pad(d.getMinutes())),
    sleep: ms => { state.clock += ms * (opts.sleepScale || 1); },
  });
  const Session = strict('Session', { getScriptTimeZone: () => 'Europe/Berlin' });
  const Charts = strict('Charts', { ChartType: { PIE: 'PIE', BAR: 'BAR', COLUMN: 'COLUMN', SCATTER: 'SCATTER' } });

  // Date.now follows the fake clock so the Comtrade time budget can be tested.
  const RealDate = Date;
  class FakeDate extends RealDate {
    constructor(...a) { if (a.length) super(...a); else super(RealDate.UTC(2026, 8, 28, 10, 0, 0) + state.clock); }
    static now() { return RealDate.UTC(2026, 8, 28, 10, 0, 0) + state.clock; }
  }

  const globals = { SpreadsheetApp, PropertiesService, ScriptApp, UrlFetchApp, Utilities, Session, Charts, Date: FakeDate,
    console: { log: m => state.alerts.push('[log] ' + m) } };
  return { state, globals, sheet: n => ssProxy.getSheetByName(n), ss: ssProxy };
}

module.exports = { createEnv, calls, REAL, colLetter };
