/**
 * AfroKauf – shop sign-ups
 * Receives the "List your shop" form from the website and:
 *   1. writes one row per sign-up into the "Sign-ups" sheet,
 *   2. saves the photos in a Google Drive folder (one folder per shop),
 *   3. finds the map position of the address,
 *   4. writes the ready-to-paste Blogger code for the shop page,
 *   5. emails you that a new sign-up arrived.
 *
 * Setup (once): see the guide "Shop sign-ups and shop pages", part 2.
 *   Google Sheet > Extensions > Apps Script > paste this file > Save > run "setup" > Deploy as web app.
 */

var SETTINGS = {
  NOTIFY_EMAIL: '',                     // empty = the Google account that owns the script
  PHOTO_FOLDER: 'AfroKauf shop photos', // Drive folder for photos (made by setup)
  SHEET: 'Sign-ups',
  MAX_PER_HOUR: 40                      // stops spam floods; normal use is far below this
};

var COLS = ['Reference', 'Received', 'Status', 'New or update', 'Shop name', 'Categories', 'Street', 'Postcode', 'City', 'Bundesland',
  'Phone', 'WhatsApp', 'Email', 'Show email', 'Website', 'Social', 'Opening hours', 'Sells', 'Products from', 'Services', 'About',
  'Plan', 'Contact person', 'Contact number', 'Note', 'Existing page', 'Photos folder', 'Lat', 'Lng',
  'Post title', 'Post labels', 'Post code (paste in HTML view)', 'Shop page link', 'Done on', 'Your notes'];
var STATUSES = ['New', 'Checking', 'Waiting for shop', 'Live', 'Update done', 'Rejected', 'Spam'];
var CATEGORY_LABELS = ['Food', 'Hair & Beauty', 'Fashion', 'Restaurant', 'Services', 'Wholesale'];
var STATES = ['Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hessen', 'Mecklenburg-Vorpommern',
  'Niedersachsen', 'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland', 'Sachsen', 'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen'];

// ------------------------------------------------------------------ menu
function onOpen() {
  SpreadsheetApp.getUi().createMenu('AfroKauf')
    .addItem('Show post code for the selected row', 'showPostCode')
    .addItem('Remake post code for the selected row', 'remakeSelected')
    .addSeparator()
    .addItem('Set up the sheet (run once)', 'setup')
    .addToUi();
}

function setup() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(SETTINGS.SHEET) || ss.insertSheet(SETTINGS.SHEET, 0);
  sh.getRange(1, 1, 1, COLS.length).setValues([COLS]).setFontWeight('bold').setFontColor('#ffffff').setBackground('#1F4D3A').setWrap(true);
  sh.setFrozenRows(1);
  sh.setFrozenColumns(5);
  sh.getRange(2, 3, sh.getMaxRows() - 1, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).setAllowInvalid(false).build());
  var widths = { 1: 130, 2: 140, 3: 120, 5: 200, 7: 180, 18: 260, 21: 260, 32: 320, 33: 220, 35: 220 };
  for (var c in widths) sh.setColumnWidth(+c, widths[c]);
  photoFolder_();
  SpreadsheetApp.getUi().alert('Ready. Now: Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone). ' +
    'Copy the web app address into the page code (ENDPOINT).');
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

    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      var ref = 'AK-' + Utilities.formatDate(new Date(), 'Europe/Berlin', 'yyMMdd') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
      var folderUrl = savePhotos_(ref, d);
      var pos = geocode_(d);
      var row = buildRow_(ref, d, folderUrl, pos);
      var sh = SpreadsheetApp.getActive().getSheetByName(SETTINGS.SHEET);
      if (!sh) throw new Error('Run setup first.');
      sh.appendRow(row.map(safeCell_));
    } finally {
      lock.releaseLock();
    }
    notify_(ref, d, folderUrl);
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
  return n <= SETTINGS.MAX_PER_HOUR;
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
  var f = DriveApp.createFolder(SETTINGS.PHOTO_FOLDER);
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
function buildRow_(ref, d, folderUrl, pos) {
  var post = buildPost_(d, pos);
  return [ref, new Date(), 'New', d.kind === 'update' ? 'Update' : 'New',
    clean_(d.name, 120), (d.categories || []).join(', '), clean_(d.street), clean_(d.zip, 5), clean_(d.city, 60), clean_(d.state, 40),
    clean_(d.phone, 30), clean_(d.whatsapp, 30), clean_(d.email, 120), d.showEmail ? 'yes' : 'no', clean_(d.website, 200), clean_(d.social, 200),
    clean_(d.hours, 200), clean_(d.sells, 1500), clean_(d.origin, 200), (d.services || []).join(', '), clean_(d.about, 800),
    clean_(d.plan, 40), clean_(d.person, 80), clean_(d.mobile, 30), clean_(d.note, 800), clean_(d.page, 300), folderUrl,
    pos ? pos.lat : '', pos ? pos.lng : '', post.title, post.labels, post.code, '', '', ''];
}

// ------------------------------------------------------------------ email to you
function notify_(ref, d, folderUrl) {
  try {
    var to = SETTINGS.NOTIFY_EMAIL || Session.getEffectiveUser().getEmail();
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

// ------------------------------------------------------------------ menu actions
function selectedRow_() {
  var sh = SpreadsheetApp.getActiveSheet();
  if (sh.getName() !== SETTINGS.SHEET) throw new Error('Open the "' + SETTINGS.SHEET + '" sheet and click a row first.');
  var r = sh.getActiveRange().getRow();
  if (r < 2) throw new Error('Click a sign-up row first (not the header).');
  return { sh: sh, r: r };
}
function showPostCode() {
  var s = selectedRow_();
  var v = s.sh.getRange(s.r, 1, 1, COLS.length).getValues()[0];
  var col = function (name) { return v[COLS.indexOf(name)]; };
  var html = '<style>body{font:14px system-ui,sans-serif}textarea{width:100%;font:12px monospace}b{display:block;margin:12px 0 4px}</style>' +
    '<b>1. Title</b><textarea rows="1" onclick="this.select()">' + text_(col('Post title')) + '</textarea>' +
    '<b>2. Labels (comma separated)</b><textarea rows="1" onclick="this.select()">' + text_(col('Post labels')) + '</textarea>' +
    '<b>3. Post code: paste in HTML view</b><textarea rows="16" onclick="this.select()">' + text_(col('Post code (paste in HTML view)')) + '</textarea>' +
    (col('Photos folder') ? '<b>4. Photos</b><a href="' + attr_(col('Photos folder')) + '" target="_blank">Open the photos folder</a>' : '') +
    (col('Lat') ? '' : '<p style="color:#a33">No map position found: add data-lat and data-lng from Google Maps.</p>');
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(720).setHeight(620), 'Blogger post for ' + col('Shop name'));
}
// After you correct a cell (e.g. hours or the address), rebuild the post code from the row.
function remakeSelected() {
  var s = selectedRow_();
  var range = s.sh.getRange(s.r, 1, 1, COLS.length);
  var v = range.getValues()[0];
  var col = function (name) { return v[COLS.indexOf(name)]; };
  var d = {
    name: col('Shop name'), categories: String(col('Categories')).split(/,\s*/), street: col('Street'), zip: col('Postcode'),
    city: col('City'), state: col('Bundesland'), phone: col('Phone'), whatsapp: col('WhatsApp'), email: col('Email'),
    showEmail: col('Show email') === 'yes', website: col('Website'), social: col('Social'), hours: col('Opening hours'),
    sells: col('Sells'), origin: col('Products from'), services: String(col('Services')).split(/,\s*/).filter(String), about: col('About')
  };
  var pos = col('Lat') && col('Lng') ? { lat: col('Lat'), lng: col('Lng') } : geocode_(d);
  var post = buildPost_(d, pos);
  s.sh.getRange(s.r, COLS.indexOf('Lat') + 1, 1, 5).setValues([[pos ? pos.lat : '', pos ? pos.lng : '', post.title, post.labels, post.code]]);
  showPostCode();
}
