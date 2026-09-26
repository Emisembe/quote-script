// In-memory stand-ins for SpreadsheetApp, PropertiesService, FormApp and HtmlService,
// enough to run PlanningTools.gs in Node (tests) and in a browser (preview).
function createFakeGoogle() {
  function toCell(v) {
    // Like Sheets: numeric text becomes a number.
    if (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v)) && /^-?[\d.]+$/.test(v.trim())) return Number(v);
    return v == null ? '' : v;
  }

  function Sheet(ss, name) {
    this.ss = ss; this.name = name; this.data = []; this.bg = {};
  }
  Sheet.prototype = {
    getName: function () { return this.name; },
    getLastRow: function () {
      for (var r = this.data.length; r > 0; r--) {
        if ((this.data[r - 1] || []).some(function (v) { return v !== '' && v != null; })) return r;
      }
      return 0;
    },
    getLastColumn: function () {
      return this.data.reduce(function (m, row) {
        for (var c = row.length; c > 0; c--) if (row[c - 1] !== '' && row[c - 1] != null) return Math.max(m, c);
        return m;
      }, 0);
    },
    getRange: function (r, c, nr, nc) { return new Range(this, r, c, nr || 1, nc || 1); },
    getDataRange: function () { return new Range(this, 1, 1, Math.max(this.getLastRow(), 1), Math.max(this.getLastColumn(), 1)); },
    clear: function () { this.data = []; this.bg = {}; return this; },
    getMaxRows: function () { return Math.max(this.data.length, 1000); },
    setFrozenRows: function () { return this; },
    setFrozenColumns: function () { return this; },
    autoResizeColumns: function () { return this; },
    setColumnWidth: function () { return this; },
    setHiddenGridlines: function () { return this; }
  };

  function Range(sheet, r, c, nr, nc) { this.s = sheet; this.r = r; this.c = c; this.nr = nr; this.nc = nc; }
  var chain = ['setFontWeight', 'setFontStyle', 'setFontSize', 'setHorizontalAlignment', 'setVerticalAlignment',
    'setWrap', 'merge', 'setDataValidation'];
  chain.forEach(function (m) { Range.prototype[m] = function () { return this; }; });
  Range.prototype.setValues = function (values) {
    if (values.length !== this.nr || values.some(function (row) { return row.length !== this.nc; }, this)) {
      throw new Error('setValues: data is ' + values.length + 'x' + (values[0] || []).length + ' but range is ' + this.nr + 'x' + this.nc);
    }
    for (var i = 0; i < this.nr; i++) {
      var row = this.s.data[this.r - 1 + i] = this.s.data[this.r - 1 + i] || [];
      for (var j = 0; j < this.nc; j++) row[this.c - 1 + j] = toCell(values[i][j]);
    }
    return this;
  };
  Range.prototype.setValue = function (v) { return this.setValues([[v]]); };
  Range.prototype.clear = function () {
    for (var i = 0; i < this.nr; i++) {
      var row = this.s.data[this.r - 1 + i];
      for (var j = 0; j < this.nc; j++) {
        if (row && this.c - 1 + j < row.length) row[this.c - 1 + j] = '';
        delete this.s.bg[(this.r + i) + ':' + (this.c + j)];
      }
    }
    return this;
  };
  Range.prototype.getValues = function () {
    var out = [];
    for (var i = 0; i < this.nr; i++) {
      var row = this.s.data[this.r - 1 + i] || [];
      var line = [];
      for (var j = 0; j < this.nc; j++) { var v = row[this.c - 1 + j]; line.push(v == null ? '' : v); }
      out.push(line);
    }
    return out;
  };
  Range.prototype.setBackground = function (color) {
    for (var i = 0; i < this.nr; i++) for (var j = 0; j < this.nc; j++) this.s.bg[(this.r + i) + ':' + (this.c + j)] = color;
    return this;
  };
  Range.prototype.setBackgrounds = function (colors) {
    if (colors.length !== this.nr) throw new Error('setBackgrounds: wrong row count');
    for (var i = 0; i < this.nr; i++) for (var j = 0; j < this.nc; j++) this.s.bg[(this.r + i) + ':' + (this.c + j)] = colors[i][j];
    return this;
  };

  var ss = {
    sheets: [], active: null,
    getName: function () { return 'Test project'; },
    getSheets: function () { return this.sheets.slice(); },
    getSheetByName: function (n) { return this.sheets.filter(function (s) { return s.name === n; })[0] || null; },
    insertSheet: function (n) { var s = new Sheet(this, n); this.sheets.push(s); return s; },
    deleteSheet: function (s) { this.sheets.splice(this.sheets.indexOf(s), 1); },
    setActiveSheet: function (s) { this.active = s; return s; },
    toasts: [],
    toast: function (msg) { this.toasts.push(msg); },
    moveActiveSheet: function (pos) {
      this.sheets.splice(this.sheets.indexOf(this.active), 1);
      this.sheets.splice(pos - 1, 0, this.active);
    }
  };
  ss.insertSheet('Sheet1');

  var alerts = [];
  var menus = [];
  function Menu(title) { this.title = title; this.items = []; }
  Menu.prototype.addItem = function (label, fn) { this.items.push([label, fn]); return this; };
  Menu.prototype.addSeparator = function () { return this; };
  Menu.prototype.addSubMenu = function (m) { this.items.push([m.title, m]); return this; };
  Menu.prototype.addToUi = function () { menus.push(this); };

  var props = {};
  var forms = {};
  var formCount = 0;

  function Form(title) {
    this.id = 'form' + (++formCount); this.title = title; this.items = []; this.responses = [];
    forms[this.id] = this;
  }
  ['setDescription', 'setCollectEmail', 'setProgressBar', 'setConfirmationMessage'].forEach(function (m) {
    Form.prototype[m] = function () { return this; };
  });
  function Item() {}
  ['setTitle', 'setHelpText', 'setRequired'].forEach(function (m) { Item.prototype[m] = function () { return this; }; });
  Form.prototype.addParagraphTextItem = function () { return new Item(); };
  Form.prototype.addTextItem = function () { return new Item(); };
  Form.prototype.getId = function () { return this.id; };
  Form.prototype.getTitle = function () { return this.title; };
  Form.prototype.getPublishedUrl = function () { return 'https://docs.google.com/forms/d/' + this.id + '/viewform'; };
  Form.prototype.getEditUrl = function () { return 'https://docs.google.com/forms/d/' + this.id + '/edit'; };
  Form.prototype.getResponses = function (since) {
    return this.responses.filter(function (r) { return !since || r.time >= since.getTime(); }).map(function (r) {
      return {
        getTimestamp: function () { return new Date(r.time); },
        getItemResponses: function () {
          return r.answers.map(function (a) { return { getResponse: function () { return a; } }; });
        }
      };
    });
  };
  /** Test helper: someone submits the form. */
  Form.prototype.submit = function (answers, time) { this.responses.push({ answers: answers, time: time || Date.now() }); };

  var driveFiles = [];
  var folders = [];
  function iter(list) { var i = 0; return { hasNext: function () { return i < list.length; }, next: function () { return list[i++]; } }; }
  function Folder(name) { this.name = name; }
  Folder.prototype.createFile = function (blob) {
    var f = { blob: blob, folder: this.name, getName: function () { return blob.name; }, getUrl: function () { return 'https://drive.google.com/file/' + driveFiles.length; } };
    driveFiles.push(f);
    return f;
  };

  return {
    ss: ss, alerts: alerts, menus: menus, forms: forms, props: props, driveFiles: driveFiles, folders: folders,
    globals: {
      DriveApp: {
        getFoldersByName: function (n) { return iter(folders.filter(function (f) { return f.name === n; })); },
        createFolder: function (n) { var f = new Folder(n); folders.push(f); return f; }
      },
      Utilities: {
        base64Decode: function (b64) { return typeof Buffer !== 'undefined' ? Array.from(Buffer.from(b64, 'base64')) : Array.from(atob(b64), function (c) { return c.charCodeAt(0); }); },
        newBlob: function (bytes, type, name) { return { bytes: bytes, type: type, name: name }; }
      },
      SpreadsheetApp: {
        getActiveSpreadsheet: function () { return ss; },
        getUi: function () {
          return {
            createMenu: function (t) { return new Menu(t); },
            alert: function (m) { alerts.push(m); },
            prompt: function () { return { getSelectedButton: function () { return 'OK'; }, getResponseText: function () { return ''; } }; },
            showModelessDialog: function () {},
            Button: { OK: 'OK' },
            ButtonSet: { OK_CANCEL: 'OK_CANCEL' }
          };
        },
        newDataValidation: function () {
          var b = { requireValueInList: function () { return b; }, build: function () { return {}; } };
          return b;
        }
      },
      PropertiesService: {
        getDocumentProperties: function () {
          return {
            getProperty: function (k) { return props.hasOwnProperty(k) ? props[k] : null; },
            setProperty: function (k, v) { props[k] = String(v); },
            setProperties: function (o) { Object.keys(o).forEach(function (k) { props[k] = String(o[k]); }); }
          };
        }
      },
      FormApp: {
        create: function (title) { return new Form(title); },
        openById: function (id) { if (!forms[id]) throw new Error('No form'); return forms[id]; }
      },
      HtmlService: {
        createHtmlOutput: function (html) {
          var o = { html: html };
          ['setTitle', 'addMetaTag', 'setWidth', 'setHeight'].forEach(function (m) { o[m] = function () { return o; }; });
          return o;
        }
      }
    }
  };
}

if (typeof module !== 'undefined') module.exports = createFakeGoogle;
