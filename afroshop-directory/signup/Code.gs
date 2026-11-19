/**
 * AfroKauf – shop sign-ups (v2)
 * Receives the "List your shop" form from the website and:
 *   1. writes one row per sign-up into the "Sign-ups" sheet,
 *   2. saves the photos in a Google Drive folder (one folder per shop),
 *   3. finds the map position of the address,
 *   4. writes the ready-to-paste Blogger code for the shop page,
 *   5. emails you that a new sign-up arrived.
 *
 * v2 (ideas taken over from the Job Tracker script):
 *   - a Settings tab: your email, WhatsApp number, follow-up days and all message texts are edited there, not in the code
 *   - columns are found by their header name, so you can move columns or add your own; setup is safe to run again
 *   - "Status since" is stamped when you change the Status, and a "Follow-up" column shows ⚠ FOLLOW UP when a
 *     sign-up waits too long (default: New 2 days, Checking 3 days, Waiting for shop 7 days); those rows turn red
 *   - messages to the shop are created as Gmail DRAFTS (never sent by themselves), in the shop's language
 *     (English, Deutsch, Français), plus a ready WhatsApp link; every column is a {{Token}} in the texts
 *   - "Add a dated note" keeps a short contact log per shop
 *   - an optional daily email lists the sign-ups that need you
 *
 * Setup (once): see the guide "Shop sign-ups and shop pages", part 2.
 *   Google Sheet > Extensions > Apps Script > paste this file > Save > run "setup" > Deploy as web app.
 */

var SHEET = 'Sign-ups';
var SETTINGS_SHEET = 'Settings';
var PHOTO_FOLDER = 'AfroKauf shop photos';
var MAX_PER_HOUR = 40;   // stops spam floods; normal use is far below this

var COLS = ['Reference', 'Received', 'Status', 'Status since', 'Follow-up', 'New or update', 'Shop name', 'Categories',
  'Street', 'Postcode', 'City', 'Bundesland', 'Phone', 'WhatsApp', 'Email', 'Show email', 'Website', 'Social',
  'Opening hours', 'Sells', 'Products from', 'Services', 'About', 'Plan', 'Contact person', 'Contact number', 'Language',
  'Note', 'Existing page', 'Photos folder', 'Lat', 'Lng', 'Post title', 'Post labels', 'Post code (paste in HTML view)',
  'Shop page link', 'Done on', 'Last message', 'Your notes'];
var STATUSES = ['New', 'Checking', 'Waiting for shop', 'Live', 'Update done', 'Rejected', 'Spam'];
var CATEGORY_LABELS = ['Food', 'Hair & Beauty', 'Fashion', 'Restaurant', 'Services', 'Wholesale'];
var STATES = ['Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hessen', 'Mecklenburg-Vorpommern',
  'Niedersachsen', 'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland', 'Sachsen', 'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen'];
var LANGS = ['English', 'Deutsch', 'Français'];

// ------------------------------------------------------------------ settings (the Settings tab)
var SETTING_DEFAULTS = [
  ['Notify email (new sign-ups go here)', ''],
  ['Your name (signs the messages)', 'Your AfroKauf team'],
  ['Your WhatsApp number (e.g. 4915112345678)', ''],
  ['"List your shop" page address', 'https://YOUR-BLOG.blogspot.com/p/list-your-shop.html'],
  ['Send daily summary email?', 'Yes'],
  ['Daily email time (hour 0-23)', 8],
  ['Follow up — New (days)', 2],
  ['Follow up — Checking (days)', 3],
  ['Follow up — Waiting for shop (days)', 7],
  ['— MESSAGES TO SHOPS: use {{Tokens}} — every column name without spaces works, e.g. {{ShopName}}, {{City}}, {{Reference}} —', ''],
  ['Page live subject (English)', 'Your shop is live on AfroKauf: {{ShopName}}'],
  ['Page live text (English)', '{{Greeting}}\n\nyour shop page on AfroKauf is live: {{ShopPageLink}}\n\nPlease check it and tell us if anything is wrong. Share the link with your customers, on your WhatsApp status and on Instagram.\n\nNeed a change later? Use the form again and choose "Change my existing shop page": {{FormLink}}\n\nThank you!\n{{YourName}}'],
  ['Page live subject (Deutsch)', 'Ihr Geschäft ist jetzt auf AfroKauf: {{ShopName}}'],
  ['Page live text (Deutsch)', '{{Greeting}}\n\nIhre Shop-Seite auf AfroKauf ist online: {{ShopPageLink}}\n\nBitte prüfen Sie die Angaben und sagen Sie uns, wenn etwas nicht stimmt. Teilen Sie den Link gerne mit Ihren Kunden, im WhatsApp-Status und auf Instagram.\n\nÄnderungen? Nutzen Sie einfach wieder das Formular und wählen Sie „Change my existing shop page“: {{FormLink}}\n\nVielen Dank!\n{{YourName}}'],
  ['Page live subject (Français)', 'Votre boutique est en ligne sur AfroKauf : {{ShopName}}'],
  ['Page live text (Français)', '{{Greeting}}\n\nla page de votre boutique sur AfroKauf est en ligne : {{ShopPageLink}}\n\nMerci de la vérifier et de nous dire si quelque chose n’est pas correct. Partagez le lien avec vos clients, dans votre statut WhatsApp et sur Instagram.\n\nUn changement plus tard ? Utilisez de nouveau le formulaire et choisissez « Change my existing shop page » : {{FormLink}}\n\nMerci !\n{{YourName}}'],
  ['Missing info subject (English)', 'Your AfroKauf listing: one question ({{Reference}})'],
  ['Missing info text (English)', '{{Greeting}}\n\nthank you for listing {{ShopName}} on AfroKauf. Before we publish your page we need one more thing:\n\n[write here what is missing]\n\nJust reply to this message.\n\nThank you!\n{{YourName}}'],
  ['Missing info subject (Deutsch)', 'Ihr AfroKauf-Eintrag: eine Rückfrage ({{Reference}})'],
  ['Missing info text (Deutsch)', '{{Greeting}}\n\nvielen Dank, dass Sie {{ShopName}} bei AfroKauf eintragen. Bevor wir Ihre Seite veröffentlichen, brauchen wir noch eine Angabe:\n\n[hier eintragen, was fehlt]\n\nAntworten Sie einfach auf diese Nachricht.\n\nVielen Dank!\n{{YourName}}'],
  ['Missing info subject (Français)', 'Votre inscription AfroKauf : une question ({{Reference}})'],
  ['Missing info text (Français)', '{{Greeting}}\n\nmerci d’avoir inscrit {{ShopName}} sur AfroKauf. Avant de publier votre page, il nous manque une information :\n\n[écrire ici ce qui manque]\n\nRépondez simplement à ce message.\n\nMerci !\n{{YourName}}']
];
function config_() {
  var sh = SpreadsheetApp.getActive().getSheetByName(SETTINGS_SHEET);
  var cfg = {};
  if (sh && sh.getLastRow() >= 2) {
    sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(function (r) { if (r[0]) cfg[String(r[0]).trim()] = r[1]; });
  }
  SETTING_DEFAULTS.forEach(function (d) { if (cfg[d[0]] === undefined || cfg[d[0]] === '') cfg[d[0]] = d[1]; });
  return cfg;
}
function cfgNum_(cfg, key, dflt) { var n = parseInt(cfg[key], 10); return isNaN(n) ? dflt : n; }
function cfgYes_(cfg, key) { return String(cfg[key] || '').trim().toLowerCase().charAt(0) === 'y'; }
function notifyTo_(cfg) {
  var to = String(cfg['Notify email (new sign-ups go here)'] || '').trim();
  if (!to) { try { to = Session.getEffectiveUser().getEmail(); } catch (e) {} }
  return to;
}

// ------------------------------------------------------------------ columns by header name
function colLetter_(n) { var s = ''; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
function headerMap_(sh) {
  var hdr = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0];
  var map = {};
  for (var i = 0; i < hdr.length; i++) { var h = String(hdr[i]).trim(); if (h && !map[h]) map[h] = i + 1; }
  return map;
}
function signupSheet_() {
  var sh = SpreadsheetApp.getActive().getSheetByName(SHEET);
  if (!sh) throw new Error('There is no "' + SHEET + '" tab yet. Run AfroKauf › Set up the sheet first.');
  return sh;
}

// ------------------------------------------------------------------ menu
function onOpen() {
  SpreadsheetApp.getUi().createMenu('AfroKauf')
    .addItem('Show post code for the selected row', 'showPostCode')
    .addItem('Remake post code for the selected row', 'remakeSelected')
    .addSeparator()
    .addItem('Message: page is live (selected row)', 'messageLive')
    .addItem('Message: missing information (selected row)', 'messageMissing')
    .addItem('Add a dated note (selected row)', 'addNote')
    .addSeparator()
    .addItem('What needs me today', 'showToday')
    .addItem('Email me the list now', 'emailNow')
    .addSeparator()
    .addItem('Set up the sheet (safe to run again)', 'setup')
    .addToUi();
}

// Safe to run again: it only adds what is missing. It never deletes or moves your rows, columns or settings.
function setup() {
  var ss = SpreadsheetApp.getActive();
  // Settings tab
  var st = ss.getSheetByName(SETTINGS_SHEET);
  if (!st) {
    st = ss.insertSheet(SETTINGS_SHEET);
    st.getRange(1, 1, 1, 2).setValues([['Setting', 'Value']]).setFontWeight('bold').setFontColor('#ffffff').setBackground('#1F4D3A');
    st.setFrozenRows(1); st.setColumnWidth(1, 330); st.setColumnWidth(2, 520);
  }
  var have = {};
  if (st.getLastRow() >= 2) st.getRange(2, 1, st.getLastRow() - 1, 1).getValues().forEach(function (r) { if (r[0]) have[String(r[0]).trim()] = true; });
  var me = ''; try { me = Session.getEffectiveUser().getEmail(); } catch (e) {}
  SETTING_DEFAULTS.forEach(function (d) {
    if (have[d[0]]) return;
    st.appendRow([d[0], d[0].indexOf('Notify email') === 0 ? me : d[1]]);
  });
  st.getRange(2, 2, st.getLastRow() - 1, 1).setWrap(true).setVerticalAlignment('top');

  // Sign-ups tab: add missing columns at the end
  var sh = ss.getSheetByName(SHEET) || ss.insertSheet(SHEET, 0);
  var map = sh.getLastColumn() ? headerMap_(sh) : {};
  COLS.forEach(function (name) {
    if (map[name]) return;
    var col = sh.getLastColumn() + 1;
    sh.getRange(1, col).setValue(name);
    map[name] = col;
  });
  var lastCol = sh.getLastColumn();
  sh.getRange(1, 1, 1, lastCol).setFontWeight('bold').setFontColor('#ffffff').setBackground('#1F4D3A').setWrap(true);
  sh.setFrozenRows(1);
  var rows = Math.max(sh.getMaxRows() - 1, 1);
  sh.getRange(2, map['Status'], rows, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).setAllowInvalid(false).build());
  sh.getRange(2, map['Language'], rows, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(LANGS, true).build());
  ['Status since', 'Done on', 'Last message'].forEach(function (n) {
    sh.getRange(2, map[n], rows, 1).setNumberFormat('dd.MM.yyyy')
      .setDataValidation(SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(true).build());
  });
  colourRules_(sh, map);
  photoFolder_();
  installTriggers_();
  SpreadsheetApp.getUi().alert('Ready',
    'The Sign-ups and Settings tabs are set up.\n\n1. Check the Settings tab (your email, WhatsApp number, page address).\n' +
    '2. If not done yet: Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone) and copy the address into the page code.\n\n' +
    'You can run this again at any time; it never deletes anything.', SpreadsheetApp.getUi().ButtonSet.OK);
}
function colourRules_(sh, map) {
  var range = sh.getRange('A2:' + colLetter_(sh.getLastColumn()) + '3000');
  var F = colLetter_(map['Follow-up']), S = colLetter_(map['Status']);
  var rule = function (formula, bg, fg) {
    var r = SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(formula).setRanges([range]);
    if (bg) r.setBackground(bg); if (fg) r.setFontColor(fg);
    return r.build();
  };
  sh.setConditionalFormatRules([
    rule('=LEFT($' + F + '2,1)="⚠"', '#F7D9CC'),
    rule('=OR($' + S + '2="Live",$' + S + '2="Update done")', '#DCEBE4'),
    rule('=OR($' + S + '2="Rejected",$' + S + '2="Spam")', null, '#9A9A9A')
  ]);
}
function installTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var f = t.getHandlerFunction();
    if (f === 'onStatusEdit' || f === 'sendDailySummary') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onStatusEdit').forSpreadsheet(SpreadsheetApp.getActive()).onEdit().create();
  var cfg = config_();
  if (cfgYes_(cfg, 'Send daily summary email?')) {
    var hour = cfgNum_(cfg, 'Daily email time (hour 0-23)', 8);
    ScriptApp.newTrigger('sendDailySummary').timeBased().everyDays(1).atHour(hour >= 0 && hour <= 23 ? hour : 8).create();
  }
}

// ------------------------------------------------------------------ follow-up flag
function flagFormula_(map, row, cfg) {
  var S = colLetter_(map['Status']) + row, D = colLetter_(map['Status since']) + row;
  var t = [['New', cfgNum_(cfg, 'Follow up — New (days)', 2)], ['Checking', cfgNum_(cfg, 'Follow up — Checking (days)', 3)],
    ['Waiting for shop', cfgNum_(cfg, 'Follow up — Waiting for shop (days)', 7)]];
  var f = '""';
  for (var i = t.length - 1; i >= 0; i--) f = 'IF(AND(' + S + '="' + t[i][0] + '",TODAY()-' + D + '>=' + t[i][1] + '),"⚠ FOLLOW UP",' + f + ')';
  return '=IF(' + D + '="","",' + f + ')';
}
// Runs when you edit the sheet: changing the Status stamps "Status since" and refreshes the flag.
function onStatusEdit(e) {
  try {
    if (!e || !e.range) return;
    var sh = e.range.getSheet();
    if (sh.getName() !== SHEET || e.range.getRow() < 2) return;
    var map = headerMap_(sh);
    var c = map['Status'];
    if (!c || e.range.getColumn() > c || e.range.getLastColumn() < c) return;
    var cfg = config_();
    for (var r = e.range.getRow(); r <= e.range.getLastRow(); r++) {
      if (map['Status since']) sh.getRange(r, map['Status since']).setValue(new Date());
      if (map['Follow-up']) sh.getRange(r, map['Follow-up']).setFormula(flagFormula_(map, r, cfg));
      var st = sh.getRange(r, c).getValue();
      if ((st === 'Live' || st === 'Update done') && map['Done on'] && !sh.getRange(r, map['Done on']).getValue()) {
        sh.getRange(r, map['Done on']).setValue(new Date());
      }
    }
  } catch (err) {
    console.error(err);
  }
}

// ------------------------------------------------------------------ web app
function doGet() {
  return ContentService.createTextOutput('AfroKauf sign-up form is connected. Send the form from the website.');
}

function doPost(e) {
  try {
    var d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.company2) return json_({ ok: true, ref: 'AK-0' });            // bot filled the hidden field: pretend OK, store nothing
    var problem = validate_(d);
    if (problem) return json_({ ok: false, error: problem });
    if (!underLimit_()) return json_({ ok: false, error: 'Too many sign-ups right now. Please try again in an hour.' });

    var ref = 'AK-' + Utilities.formatDate(new Date(), 'Europe/Berlin', 'yyMMdd') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    var folderUrl = savePhotos_(ref, d);
    var pos = geocode_(d);
    var cfg = config_();
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      var sh = signupSheet_();
      var map = headerMap_(sh);
      var values = rowValues_(ref, d, folderUrl, pos);
      var row = new Array(sh.getLastColumn());
      for (var i = 0; i < row.length; i++) row[i] = '';
      Object.keys(values).forEach(function (k) { if (map[k]) row[map[k] - 1] = safeCell_(values[k]); });
      sh.appendRow(row);
      var r = sh.getLastRow();
      if (map['Follow-up']) sh.getRange(r, map['Follow-up']).setFormula(flagFormula_(map, r, cfg));
    } finally {
      lock.releaseLock();
    }
    notify_(cfg, ref, d, folderUrl);
    return json_({ ok: true, ref: ref });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'Server error.' });
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// ------------------------------------------------------------------ checks
function clean_(s, max) {
  return String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max || 300);
}
function validate_(d) {
  var upd = d.kind === 'update';
  if (!clean_(d.name)) return 'Shop name is missing.';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean_(d.email))) return 'Email address is not valid.';
  if (!clean_(d.person)) return 'Your name is missing.';
  if (!upd) {
    if (!clean_(d.street) || !clean_(d.city)) return 'Address is missing.';
    if (!/^\d{5}$/.test(clean_(d.zip))) return 'Postcode is not valid.';
    if (STATES.indexOf(clean_(d.state)) < 0) return 'Bundesland is missing.';
    if (!clean_(d.phone)) return 'Phone is missing.';
  }
  if (d.photos && (!Array.isArray(d.photos) || d.photos.length > 4)) return 'Too many photos.';
  return '';
}
function underLimit_() {
  var cache = CacheService.getScriptCache();
  var key = 'n' + Utilities.formatDate(new Date(), 'Europe/Berlin', 'yyMMddHH');
  var n = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(n), 3700);
  return n <= MAX_PER_HOUR;
}
// A cell that starts with = + - @ would run as a formula in the sheet: store it as text.
function safeCell_(v) {
  return (typeof v === 'string' && /^[=+\-@]/.test(v)) ? "'" + v : v;
}

// ------------------------------------------------------------------ photos and map
function photoFolder_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('PHOTO_FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var f = DriveApp.createFolder(PHOTO_FOLDER);
  props.setProperty('PHOTO_FOLDER_ID', f.getId());
  return f;
}
function savePhotos_(ref, d) {
  var list = (d.photos || []).filter(function (p) { return p && p.data; }).slice(0, 4);
  if (!list.length) return '';
  var folder = photoFolder_().createFolder(ref + ' ' + clean_(d.name, 60));
  list.forEach(function (p, i) {
    var bytes = Utilities.base64Decode(String(p.data));
    if (bytes.length > 4 * 1024 * 1024) return;                 // skip anything over 4 MB
    folder.createFile(Utilities.newBlob(bytes, 'image/jpeg', (i + 1) + '.jpg'));
  });
  return folder.getUrl();
}
function geocode_(d) {
  try {
    if (!clean_(d.street)) return null;
    var r = Maps.newGeocoder().setRegion('de').setLanguage('de')
      .geocode([clean_(d.street), clean_(d.zip) + ' ' + clean_(d.city), 'Deutschland'].join(', '));
    if (r.status !== 'OK' || !r.results.length) return null;
    var loc = r.results[0].geometry.location;
    return { lat: Math.round(loc.lat * 1e5) / 1e5, lng: Math.round(loc.lng * 1e5) / 1e5 };
  } catch (e) {
    return null;
  }
}

// ------------------------------------------------------------------ the Blogger code
function attr_(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function text_(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
// The city label must match the "Shops by city" tiles: "Frankfurt am Main" -> "Frankfurt".
function cityLabel_(city) {
  return clean_(city).replace(/\s+am Main$/i, '').replace(/\s*\(Saale\)$/i, '').replace(/\s+im Breisgau$/i, '');
}
function socialUrl_(s) {
  s = clean_(s, 200);
  if (!s) return { insta: '', other: '' };
  if (/^@?[\w.]{2,30}$/.test(s)) return { insta: 'https://www.instagram.com/' + s.replace(/^@/, '') + '/', other: '' };
  if (/^https?:\/\/([\w-]+\.)*instagram\.com\//i.test(s)) return { insta: s, other: '' };
  return { insta: '', other: /^https?:\/\//i.test(s) ? s : '' };   // only real web links become a link
}
function buildPost_(d, pos) {
  var cats = (d.categories || []).filter(function (c) { return CATEGORY_LABELS.indexOf(c) > -1; });
  var labels = ['Shop'].concat(cats, [cityLabel_(d.city), clean_(d.state)]).filter(String);
  var address = clean_(d.street) + ', ' + clean_(d.zip) + ' ' + clean_(d.city);
  var soc = socialUrl_(d.social);
  var services = (d.services || []).map(function (s) { return clean_(s, 40); }).join(', ');
  var lines = [
    '<div class="shop-info"',
    '  data-city="' + attr_(clean_(d.city)) + '"',
    '  data-state="' + attr_(clean_(d.state)) + '"',
    '  data-address="' + attr_(address) + '"',
    '  data-lat="' + (pos ? pos.lat : '') + '" data-lng="' + (pos ? pos.lng : '') + '"',
    '  data-phone="' + attr_(clean_(d.phone, 30)) + '"',
    '  data-whatsapp="' + attr_(clean_(d.whatsapp, 30)) + '"',
    '  data-hours="' + attr_(clean_(d.hours, 200)) + '"',
    '  data-sells="' + attr_(clean_(d.sells, 1500)) + '"',
    '  data-origin="' + attr_(clean_(d.origin, 200)) + '"',
    '  data-services="' + attr_(services) + '"',
    '  data-website="' + attr_(/^https?:\/\//i.test(clean_(d.website)) ? clean_(d.website, 200) : '') + '" data-instagram="' + attr_(soc.insta) + '">',
    text_(address) + ' · ' + text_(clean_(d.hours, 200)) + ' · Tel. ' + text_(clean_(d.phone, 30)),
    '</div>'
  ];
  var about = clean_(d.about, 800);
  if (about) lines.push('', '<p>' + text_(about).replace(/\n+/g, '</p>\n<p>') + '</p>');
  if (d.showEmail && clean_(d.email)) lines.push('', '<p>Email: <a href="mailto:' + attr_(clean_(d.email)) + '">' + text_(clean_(d.email)) + '</a></p>');
  if (soc.other) lines.push('', '<p>Follow us: <a href="' + attr_(soc.other) + '">' + text_(soc.other) + '</a></p>');
  lines.push('', '<!-- Photos: add them below this line with the picture button. The first photo is the card picture. -->');
  return { title: clean_(d.name, 120), labels: labels.join(', '), code: lines.join('\n') };
}
function rowValues_(ref, d, folderUrl, pos) {
  var post = buildPost_(d, pos);
  var lang = LANGS.indexOf(clean_(d.language)) > -1 ? clean_(d.language) : 'English';
  return {
    'Reference': ref, 'Received': new Date(), 'Status': 'New', 'Status since': new Date(),
    'New or update': d.kind === 'update' ? 'Update' : 'New', 'Shop name': clean_(d.name, 120), 'Categories': (d.categories || []).join(', '),
    'Street': clean_(d.street), 'Postcode': clean_(d.zip, 5), 'City': clean_(d.city, 60), 'Bundesland': clean_(d.state, 40),
    'Phone': clean_(d.phone, 30), 'WhatsApp': clean_(d.whatsapp, 30), 'Email': clean_(d.email, 120), 'Show email': d.showEmail ? 'yes' : 'no',
    'Website': clean_(d.website, 200), 'Social': clean_(d.social, 200), 'Opening hours': clean_(d.hours, 200), 'Sells': clean_(d.sells, 1500),
    'Products from': clean_(d.origin, 200), 'Services': (d.services || []).join(', '), 'About': clean_(d.about, 800), 'Plan': clean_(d.plan, 40),
    'Contact person': clean_(d.person, 80), 'Contact number': clean_(d.mobile, 30), 'Language': lang, 'Note': clean_(d.note, 800),
    'Existing page': clean_(d.page, 300), 'Photos folder': folderUrl, 'Lat': pos ? pos.lat : '', 'Lng': pos ? pos.lng : '',
    'Post title': post.title, 'Post labels': post.labels, 'Post code (paste in HTML view)': post.code
  };
}

// ------------------------------------------------------------------ email to you
function notify_(cfg, ref, d, folderUrl) {
  try {
    var to = notifyTo_(cfg);
    if (!to) return;
    var body = [
      (d.kind === 'update' ? 'Change request for: ' : 'New shop: ') + clean_(d.name),
      'Reference: ' + ref,
      'City: ' + clean_(d.city) + ' (' + clean_(d.state) + ')',
      'Plan: ' + clean_(d.plan),
      'Contact: ' + clean_(d.person) + ' · ' + (clean_(d.mobile) || clean_(d.phone)) + ' · ' + clean_(d.email),
      d.page ? 'Existing page: ' + clean_(d.page) : '',
      folderUrl ? 'Photos: ' + folderUrl : 'No photos sent.',
      '',
      'Open the sheet: ' + SpreadsheetApp.getActive().getUrl()
    ].filter(String).join('\n');
    MailApp.sendEmail({ to: to, subject: 'AfroKauf sign-up: ' + clean_(d.name, 80) + ' (' + ref + ')', body: body, name: 'AfroKauf website' });
  } catch (e) {
    console.error('mail failed', e);
  }
}

// ------------------------------------------------------------------ the selected row
function selected_() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getActiveSheet();
  if (sh.getName() !== SHEET) throw new Error('Open the "' + SHEET + '" tab and click a row first.');
  var r = sh.getActiveRange().getRow();
  if (r < 2) throw new Error('Click a sign-up row first (not the header).');
  var map = headerMap_(sh);
  var v = sh.getRange(r, 1, 1, sh.getLastColumn()).getValues()[0];
  var get = function (name) { return map[name] ? v[map[name] - 1] : ''; };
  return { sh: sh, r: r, map: map, v: v, get: get };
}
function run_(fn) {
  try { fn(); } catch (err) {
    SpreadsheetApp.getUi().alert('Could not do this', String(err && err.message ? err.message : err) +
      '\n\nNothing in your sheet was changed.', SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function showPostCode() { run_(function () { showPostCode_(selected_()); }); }
function showPostCode_(s) {
  var html = '<style>body{font:14px system-ui,sans-serif}textarea{width:100%;font:12px monospace}b{display:block;margin:12px 0 4px}</style>' +
    '<b>1. Title</b><textarea rows="1" onclick="this.select()">' + text_(s.get('Post title')) + '</textarea>' +
    '<b>2. Labels (comma separated)</b><textarea rows="1" onclick="this.select()">' + text_(s.get('Post labels')) + '</textarea>' +
    '<b>3. Post code: paste in HTML view</b><textarea rows="16" onclick="this.select()">' + text_(s.get('Post code (paste in HTML view)')) + '</textarea>' +
    (s.get('Photos folder') ? '<b>4. Photos</b><a href="' + attr_(s.get('Photos folder')) + '" target="_blank">Open the photos folder</a>' : '') +
    (s.get('Lat') ? '' : '<p style="color:#a33">No map position found: add data-lat and data-lng from Google Maps.</p>');
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(720).setHeight(620), 'Blogger post for ' + s.get('Shop name'));
}
// After you correct a cell (e.g. hours or the address), rebuild the post code from the row.
function remakeSelected() {
  run_(function () {
    var s = selected_();
    var d = {
      name: s.get('Shop name'), categories: String(s.get('Categories')).split(/,\s*/), street: s.get('Street'), zip: s.get('Postcode'),
      city: s.get('City'), state: s.get('Bundesland'), phone: s.get('Phone'), whatsapp: s.get('WhatsApp'), email: s.get('Email'),
      showEmail: s.get('Show email') === 'yes', website: s.get('Website'), social: s.get('Social'), hours: s.get('Opening hours'),
      sells: s.get('Sells'), origin: s.get('Products from'), services: String(s.get('Services')).split(/,\s*/).filter(String), about: s.get('About')
    };
    var pos = s.get('Lat') && s.get('Lng') ? { lat: s.get('Lat'), lng: s.get('Lng') } : geocode_(d);
    var post = buildPost_(d, pos);
    var put = { 'Lat': pos ? pos.lat : '', 'Lng': pos ? pos.lng : '', 'Post title': post.title, 'Post labels': post.labels, 'Post code (paste in HTML view)': post.code };
    Object.keys(put).forEach(function (k) { if (s.map[k]) s.sh.getRange(s.r, s.map[k]).setValue(put[k]); });
    showPostCode_(selected_());
  });
}

// ------------------------------------------------------------------ messages to the shop (drafts only)
// Every column becomes a token named after its header without spaces or punctuation: "Shop name" -> {{ShopName}}.
function tokens_(s, cfg) {
  var map = {};
  Object.keys(s.map).forEach(function (h) {
    var v = s.v[s.map[h] - 1];
    if (v instanceof Date) v = Utilities.formatDate(v, 'Europe/Berlin', 'dd.MM.yyyy');
    map[h.replace(/\(.*?\)/g, '').split(/[^A-Za-z0-9]+/).filter(String).map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join('')] = String(v == null ? '' : v);
  });
  var first = String(s.get('Contact person') || '').trim().split(/\s+/)[0];
  var lang = s.get('Language') || 'English';
  map.Greeting = lang === 'Deutsch' ? (first ? 'Hallo ' + first + ',' : 'Guten Tag,')
    : lang === 'Français' ? (first ? 'Bonjour ' + first + ',' : 'Bonjour,') : (first ? 'Hello ' + first + ',' : 'Hello,');
  map.YourName = String(cfg['Your name (signs the messages)'] || '');
  map.FormLink = String(cfg['"List your shop" page address'] || '');
  return map;
}
function fill_(t, map) {
  return String(t == null ? '' : t).replace(/\{\{(\w+)\}\}/g, function (_, k) { return map[k] != null ? map[k] : ''; });
}
function waNumber_(n) {
  var d = String(n || '').replace(/[^\d+]/g, '');
  if (d.indexOf('+') === 0) return d.slice(1);
  if (d.indexOf('00') === 0) return d.slice(2);
  if (d.indexOf('0') === 0) return '49' + d.slice(1);
  return d;
}
function message_(kind) {
  run_(function () {
    var s = selected_();
    var cfg = config_();
    if (kind === 'Page live' && !s.get('Shop page link')) throw new Error('Paste the shop page address into "Shop page link" first.');
    var lang = LANGS.indexOf(s.get('Language')) > -1 ? s.get('Language') : 'English';
    var map = tokens_(s, cfg);
    var subject = fill_(cfg[kind + ' subject (' + lang + ')'], map);
    var body = fill_(cfg[kind + ' text (' + lang + ')'], map);
    var email = String(s.get('Email') || '').trim();
    var parts = [];
    if (email) {
      GmailApp.createDraft(email, subject, body, { name: map.YourName || 'AfroKauf' });
      parts.push('<p>✓ A <b>draft</b> to ' + text_(email) + ' is in your Gmail Drafts. Open Gmail, check it and press Send.</p>');
    }
    var wa = waNumber_(s.get('WhatsApp') || s.get('Contact number'));
    if (wa) parts.push('<p><a target="_blank" href="https://wa.me/' + attr_(wa) + '?text=' + encodeURIComponent(body) + '">Open the same message in WhatsApp</a></p>');
    if (!parts.length) throw new Error('This row has no email and no WhatsApp number.');
    if (s.map['Last message']) s.sh.getRange(s.r, s.map['Last message']).setValue(new Date());
    if (s.map['Your notes']) {
      var cell = s.sh.getRange(s.r, s.map['Your notes']);
      var old = String(cell.getValue() || '').trim();
      var line = Utilities.formatDate(new Date(), 'Europe/Berlin', 'dd.MM.yyyy') + ': message "' + kind + '" prepared';
      cell.setValue(old ? line + '\n' + old : line);
    }
    SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput('<div style="font:14px system-ui,sans-serif">' + parts.join('') +
      '<p style="color:#666">Nothing was sent automatically.</p></div>').setWidth(460).setHeight(200), kind + ': ' + s.get('Shop name'));
  });
}
function messageLive() { message_('Page live'); }
function messageMissing() { message_('Missing info'); }

// Adds a dated line at the TOP of "Your notes": a small contact log per shop.
function addNote() {
  run_(function () {
    var s = selected_();
    if (!s.map['Your notes']) throw new Error('Run AfroKauf › Set up the sheet once, so the "Your notes" column exists.');
    var ui = SpreadsheetApp.getUi();
    var r = ui.prompt('Add a dated note', 'Type the note. It gets today\'s date and goes to the top of "Your notes":', ui.ButtonSet.OK_CANCEL);
    if (r.getSelectedButton() !== ui.Button.OK || !r.getResponseText().trim()) return;
    var cell = s.sh.getRange(s.r, s.map['Your notes']);
    var old = String(cell.getValue() || '').trim();
    var line = Utilities.formatDate(new Date(), 'Europe/Berlin', 'dd.MM.yyyy') + ': ' + r.getResponseText().trim();
    cell.setValue(old ? line + '\n' + old : line);
  });
}

// ------------------------------------------------------------------ what needs you
function openItems_() {
  var sh = signupSheet_();
  var map = headerMap_(sh);
  if (sh.getLastRow() < 2) return [];
  var data = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();   // one read, fast
  var g = function (row, name) { return map[name] ? row[map[name] - 1] : ''; };
  var out = [];
  data.forEach(function (row, i) {
    var st = g(row, 'Status');
    if (['New', 'Checking', 'Waiting for shop'].indexOf(st) < 0) return;
    var since = g(row, 'Status since');
    var days = since instanceof Date ? Math.floor((new Date() - since) / 864e5) : '';
    out.push({ row: i + 2, name: g(row, 'Shop name'), city: g(row, 'City'), status: st, days: days,
      flag: String(g(row, 'Follow-up')).charAt(0) === '⚠', kind: g(row, 'New or update'), plan: g(row, 'Plan') });
  });
  out.sort(function (a, b) { return (b.flag - a.flag) || ((b.days || 0) - (a.days || 0)); });
  return out;
}
function listText_(items) {
  return items.map(function (x) {
    return (x.flag ? '⚠ ' : '• ') + x.name + ' (' + x.city + ') – ' + x.status + (x.days !== '' ? ', ' + x.days + ' days' : '') +
      (x.kind === 'Update' ? ' – change request' : '') + (/Premium/.test(x.plan) ? ' – wants Premium' : '') + '  [row ' + x.row + ']';
  }).join('\n');
}
function showToday() {
  run_(function () {
    var items = openItems_();
    SpreadsheetApp.getUi().alert('What needs you today', items.length ? listText_(items) : 'Nothing open. Well done!', SpreadsheetApp.getUi().ButtonSet.OK);
  });
}
// Daily email (Settings: "Send daily summary email?"). Sent only when something is open.
function sendDailySummary() {
  var cfg = config_();
  var items = openItems_();
  if (!items.length) return;
  var to = notifyTo_(cfg);
  if (!to) return;
  var flagged = items.filter(function (x) { return x.flag; }).length;
  MailApp.sendEmail({
    to: to, name: 'AfroKauf website',
    subject: 'AfroKauf: ' + items.length + ' sign-up' + (items.length === 1 ? '' : 's') + ' open' + (flagged ? ', ' + flagged + ' overdue' : ''),
    body: 'Sign-ups waiting for you (overdue first):\n\n' + listText_(items) + '\n\nOpen the sheet: ' + SpreadsheetApp.getActive().getUrl()
  });
}
function emailNow() {
  run_(function () {
    var n = openItems_().length;
    sendDailySummary();
    SpreadsheetApp.getUi().alert(n ? 'Sent: ' + n + ' open sign-up' + (n === 1 ? '' : 's') + ' to ' + notifyTo_(config_()) + '.' : 'Nothing open, so no email was sent.');
  });
}
