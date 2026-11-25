/**
 * AfroKauf Verbund – shop sign-ups, emails, newsletters and announcements (v3)
 *
 * Receives the "List your shop" form from the website (no Google Form) and:
 *   1. writes one row per sign-up into the "Sign-ups" sheet, with a unique reference
 *      AK-<shop initials>-<date>-<time>-<milliseconds>, e.g. AK-MAF-20261121-015412-347,
 *   2. saves the photos in a Google Drive folder (one folder per shop),
 *   3. finds the map position of the address and writes the ready-to-paste Blogger code,
 *   4. emails you, and sends the shop a branded confirmation in its language.
 *
 * Emails use the AfroKauf Verbund design (logo, brand colours, footer with links, Impressum,
 * Datenschutz and an unsubscribe link). All colours, links and texts live on the Settings tab.
 *
 * Newsletters and announcements (tabs "Campaigns" and "Send log"):
 *   - Newsletter    -> only to shops that ticked the newsletter box AND confirmed it by email (double opt-in)
 *   - Announcement  -> to all listed (Live) shops, about their listing and the service; they can switch it off
 *   Send to everyone at once (bulk, safe to resume), to the selected shops, or as a Gmail draft for one shop.
 *
 * Setup (once): see the guide "Shop sign-ups and shop pages", part 2.
 */

var SHEET = 'Sign-ups';
var SETTINGS_SHEET = 'Settings';
var CAMPAIGNS = 'Campaigns';
var LOG = 'Send log';
var PHOTO_FOLDER = 'AfroKauf shop photos';
var MAX_PER_HOUR = 40;          // stops spam floods on the form; normal use is far below this
var SEND_TIME_LIMIT = 270000;   // stop a bulk send after 4.5 minutes (Google stops scripts at 6)
var TZ = 'Europe/Berlin';

var COLS = ['Reference', 'Received', 'Status', 'Status since', 'Follow-up', 'New or update', 'Shop name', 'Categories',
  'Street', 'Postcode', 'City', 'Bundesland', 'Phone', 'WhatsApp', 'Email', 'Show email', 'Website', 'Social',
  'Opening hours', 'Sells', 'Products from', 'Services', 'About', 'Plan', 'Contact person', 'Contact number', 'Language',
  'Newsletter', 'Newsletter consent', 'Announcements',
  'Note', 'Existing page', 'Photos folder', 'Lat', 'Lng', 'Post title', 'Post labels', 'Post code (paste in HTML view)',
  'Shop page link', 'Done on', 'Last message', 'Your notes'];
var CAMPAIGN_COLS = ['Campaign ID', 'Type', 'Status', 'Only Bundesland', 'Only city',
  'Subject (English)', 'Text (English)', 'Subject (Deutsch)', 'Text (Deutsch)', 'Subject (Français)', 'Text (Français)',
  'Picture link (optional)', 'Created', 'Sent', 'Last sent', 'Notes'];
var LOG_COLS = ['Sent at', 'Campaign ID', 'Reference', 'Shop name', 'Email', 'Language', 'How', 'Result'];
var ORDERS = 'Orders', SUBS = 'Subscribers', PRODUCTS = 'Products';
var ORDER_COLS = ['Order ID', 'Received', 'Status', 'Shop', 'Shop email', 'Customer', 'Phone', 'Email', 'Pick-up', 'Note',
  'Items', 'Total', 'Price check', 'Language', 'Page', 'Your notes'];
var ORDER_STATUSES = ['New', 'Confirmed', 'Ready', 'Collected', 'Cancelled'];
var SUB_COLS = ['Reference', 'Received', 'Email', 'Language', 'Newsletter', 'Newsletter consent', 'Source page'];
var PRODUCT_COLS = ['Product ID', 'Received', 'Status', 'Shop reference', 'Shop name', 'Product', 'Price', 'Old price', 'Unit',
  'Category', 'Offer until', 'Description', 'Photo', 'Post title', 'Post labels', 'Post code (paste in HTML view)', 'Product page link', 'Your notes'];
var STATUSES = ['New', 'Checking', 'Waiting for shop', 'Live', 'Update done', 'Rejected', 'Spam'];
var CATEGORY_LABELS = ['Food', 'Hair & Beauty', 'Fashion', 'Restaurant', 'Services', 'Wholesale'];
var STATES = ['Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hessen', 'Mecklenburg-Vorpommern',
  'Niedersachsen', 'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland', 'Sachsen', 'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen'];
var LANGS = ['English', 'Deutsch', 'Français'];

// ------------------------------------------------------------------ settings (the Settings tab)
var SITE = 'https://afrokauf.blogspot.com';
var SETTING_DEFAULTS = [
  ['Notify email (new sign-ups go here)', ''],
  ['Your name (signs the messages)', 'AfroKauf Verbund'],
  ['Your WhatsApp number (e.g. 4915112345678)', ''],
  ['"List your shop" page address', SITE + '/p/list-your-shop.html'],
  ['Web app address (ends with /exec)', ''],
  ['Send confirmation to the shop after sign-up?', 'Yes'],
  ['Send me a copy of every order?', 'Yes'],
  ['Send daily summary email?', 'Yes'],
  ['Daily email time (hour 0-23)', 8],
  ['Follow up — New (days)', 2],
  ['Follow up — Checking (days)', 3],
  ['Follow up — Waiting for shop (days)', 7],
  ['— EMAIL DESIGN —', ''],
  ['Sender name (shown in the inbox)', 'AfroKauf Verbund'],
  ['Brand name', 'AfroKauf Verbund'],
  ['Tagline (English)', 'African shops across Germany'],
  ['Tagline (Deutsch)', 'Afroshops in deiner Nähe'],
  ['Tagline (Français)', 'Les boutiques africaines près de chez vous'],
  ['Logo (link to the email logo PNG in Google Drive)', 'https://drive.google.com/file/d/1lZggCMxCtTSFjq3MzqT0rKuBXpPsSDP3/view'],
  ['Website', SITE],
  ['Contact email (replies go here)', ''],
  ['Phone (optional)', ''],
  ['Address (optional, for the footer)', ''],
  ['Primary colour', '#0E4D3A'],
  ['Accent colour', '#E9A23B'],
  ['Clay colour', '#C4552D'],
  ['Instagram link', ''],
  ['Facebook link', ''],
  ['YouTube link', ''],
  ['TikTok link', ''],
  ['LinkedIn link', ''],
  ['Seminars page', SITE + '/search/label/Events'],
  ['Contact page', SITE + '/p/contact.html'],
  ['Impressum page', SITE + '/p/impressum.html'],
  ['Datenschutz page', SITE + '/p/datenschutz.html'],
  ['— MESSAGES TO SHOPS: {{Tokens}} = any column name without spaces, e.g. {{ShopName}}, {{City}}, {{Reference}}. ' +
   'Format: empty line = new paragraph · **bold** · "- " = list · "## " = small heading · [Button text](https://link) on its own line = button —', ''],
  ['Confirmation subject (English)', 'We received your sign-up: {{ShopName}} ({{Reference}})'],
  ['Confirmation text (English)', '{{Greeting}}\n\nthank you for listing **{{ShopName}}** on AfroKauf. We have your details and are checking them now. Your shop page is usually live within **2 working days**, and we send you the link by email.\n\nPlease keep your reference number. It helps us find your sign-up quickly when you write to us.\n\nSee you soon!\n{{YourName}}'],
  ['Confirmation subject (Deutsch)', 'Ihre Anmeldung ist da: {{ShopName}} ({{Reference}})'],
  ['Confirmation text (Deutsch)', '{{Greeting}}\n\nvielen Dank, dass Sie **{{ShopName}}** bei AfroKauf eintragen. Ihre Angaben sind angekommen und wir prüfen sie jetzt. Ihre Shop-Seite ist meist innerhalb von **2 Werktagen** online. Den Link schicken wir Ihnen per E-Mail.\n\nBitte heben Sie Ihre Referenznummer auf. Damit finden wir Ihre Anmeldung schnell, wenn Sie uns schreiben.\n\nBis bald!\n{{YourName}}'],
  ['Confirmation subject (Français)', 'Nous avons reçu votre inscription : {{ShopName}} ({{Reference}})'],
  ['Confirmation text (Français)', '{{Greeting}}\n\nmerci d’avoir inscrit **{{ShopName}}** sur AfroKauf. Nous avons bien reçu vos informations et nous les vérifions. La page de votre boutique est en général en ligne sous **2 jours ouvrés**, et nous vous envoyons le lien par e-mail.\n\nGardez votre numéro de référence : il nous aide à retrouver votre inscription rapidement.\n\nÀ bientôt !\n{{YourName}}'],
  ['Page live subject (English)', 'Your shop is live on AfroKauf: {{ShopName}}'],
  ['Page live text (English)', '{{Greeting}}\n\ngood news: the page of **{{ShopName}}** on AfroKauf is now live.\n\n[Open my shop page]({{ShopPageLink}})\n\nPlease check it and tell us if anything is wrong. Then share the link with your customers, in your WhatsApp status and on Instagram.\n\nNeed a change later? Use the form again and choose "Change my existing shop page": {{FormLink}}\n\nThank you!\n{{YourName}}'],
  ['Page live subject (Deutsch)', 'Ihr Geschäft ist jetzt auf AfroKauf: {{ShopName}}'],
  ['Page live text (Deutsch)', '{{Greeting}}\n\ngute Nachrichten: Die Seite von **{{ShopName}}** auf AfroKauf ist jetzt online.\n\n[Meine Shop-Seite öffnen]({{ShopPageLink}})\n\nBitte prüfen Sie die Angaben und sagen Sie uns, wenn etwas nicht stimmt. Teilen Sie den Link dann mit Ihren Kunden, im WhatsApp-Status und auf Instagram.\n\nÄnderungen? Nutzen Sie wieder das Formular und wählen Sie „Change my existing shop page“: {{FormLink}}\n\nVielen Dank!\n{{YourName}}'],
  ['Page live subject (Français)', 'Votre boutique est en ligne sur AfroKauf : {{ShopName}}'],
  ['Page live text (Français)', '{{Greeting}}\n\nbonne nouvelle : la page de **{{ShopName}}** sur AfroKauf est en ligne.\n\n[Ouvrir la page de ma boutique]({{ShopPageLink}})\n\nMerci de la vérifier et de nous dire si quelque chose n’est pas correct. Partagez ensuite le lien avec vos clients, dans votre statut WhatsApp et sur Instagram.\n\nUn changement plus tard ? Utilisez de nouveau le formulaire et choisissez « Change my existing shop page » : {{FormLink}}\n\nMerci !\n{{YourName}}'],
  ['Missing info subject (English)', 'Your AfroKauf listing: one question ({{Reference}})'],
  ['Missing info text (English)', '{{Greeting}}\n\nthank you for listing **{{ShopName}}** on AfroKauf. Before we publish your page we need one more thing:\n\n[write here what is missing]\n\nJust reply to this email.\n\nThank you!\n{{YourName}}'],
  ['Missing info subject (Deutsch)', 'Ihr AfroKauf-Eintrag: eine Rückfrage ({{Reference}})'],
  ['Missing info text (Deutsch)', '{{Greeting}}\n\nvielen Dank, dass Sie **{{ShopName}}** bei AfroKauf eintragen. Bevor wir Ihre Seite veröffentlichen, brauchen wir noch eine Angabe:\n\n[hier eintragen, was fehlt]\n\nAntworten Sie einfach auf diese E-Mail.\n\nVielen Dank!\n{{YourName}}'],
  ['Missing info subject (Français)', 'Votre inscription AfroKauf : une question ({{Reference}})'],
  ['Missing info text (Français)', '{{Greeting}}\n\nmerci d’avoir inscrit **{{ShopName}}** sur AfroKauf. Avant de publier votre page, il nous manque une information :\n\n[écrire ici ce qui manque]\n\nRépondez simplement à cet e-mail.\n\nMerci !\n{{YourName}}']
];
// Texts from v2. If a Settings row still holds one of these unchanged, setup swaps in the new designed text.
var V2_TEXTS = {
  'Page live text (English)': '{{Greeting}}\n\nyour shop page on AfroKauf is live: {{ShopPageLink}}\n\nPlease check it and tell us if anything is wrong. Share the link with your customers, on your WhatsApp status and on Instagram.\n\nNeed a change later? Use the form again and choose "Change my existing shop page": {{FormLink}}\n\nThank you!\n{{YourName}}',
  'Page live text (Deutsch)': '{{Greeting}}\n\nIhre Shop-Seite auf AfroKauf ist online: {{ShopPageLink}}\n\nBitte prüfen Sie die Angaben und sagen Sie uns, wenn etwas nicht stimmt. Teilen Sie den Link gerne mit Ihren Kunden, im WhatsApp-Status und auf Instagram.\n\nÄnderungen? Nutzen Sie einfach wieder das Formular und wählen Sie „Change my existing shop page“: {{FormLink}}\n\nVielen Dank!\n{{YourName}}',
  'Page live text (Français)': '{{Greeting}}\n\nla page de votre boutique sur AfroKauf est en ligne : {{ShopPageLink}}\n\nMerci de la vérifier et de nous dire si quelque chose n’est pas correct. Partagez le lien avec vos clients, dans votre statut WhatsApp et sur Instagram.\n\nUn changement plus tard ? Utilisez de nouveau le formulaire et choisissez « Change my existing shop page » : {{FormLink}}\n\nMerci !\n{{YourName}}',
  'Missing info text (English)': '{{Greeting}}\n\nthank you for listing {{ShopName}} on AfroKauf. Before we publish your page we need one more thing:\n\n[write here what is missing]\n\nJust reply to this message.\n\nThank you!\n{{YourName}}',
  'Missing info text (Deutsch)': '{{Greeting}}\n\nvielen Dank, dass Sie {{ShopName}} bei AfroKauf eintragen. Bevor wir Ihre Seite veröffentlichen, brauchen wir noch eine Angabe:\n\n[hier eintragen, was fehlt]\n\nAntworten Sie einfach auf diese Nachricht.\n\nVielen Dank!\n{{YourName}}',
  'Missing info text (Français)': '{{Greeting}}\n\nmerci d’avoir inscrit {{ShopName}} sur AfroKauf. Avant de publier votre page, il nous manque une information :\n\n[écrire ici ce qui manque]\n\nRépondez simplement à ce message.\n\nMerci !\n{{YourName}}'
};

// Fixed words in the email design, per language.
var WORDS = {
  English: { findShop: 'Find a shop', listShop: 'List your shop', seminars: 'Seminars', contact: 'Contact', follow: 'Follow us',
    ref: 'Your reference', shop: 'Shop', city: 'City', plan: 'Plan', status: 'Status', received: 'Sign-up received', live: 'Your page is live',
    question: 'One question', newsletter: 'Newsletter', announcement: 'Announcement', unsubscribe: 'Unsubscribe',
    whyTx: 'You get this email because you used the form on our website.',
    whyNL: 'You get this newsletter because you signed up for it.',
    whyAN: 'You get this message because your shop is listed on AfroKauf.',
    nlAsk: 'You asked for our newsletter for shop owners. Please confirm with one click:', nlBtn: 'Yes, send me the newsletter',
    hello: 'Hello', helloAll: 'Hello' },
  Deutsch: { findShop: 'Shop finden', listShop: 'Shop eintragen', seminars: 'Seminare', contact: 'Kontakt', follow: 'Folgen Sie uns',
    ref: 'Ihre Referenz', shop: 'Geschäft', city: 'Stadt', plan: 'Paket', status: 'Status', received: 'Anmeldung erhalten', live: 'Ihre Seite ist online',
    question: 'Eine Rückfrage', newsletter: 'Newsletter', announcement: 'Mitteilung', unsubscribe: 'Abmelden',
    whyTx: 'Sie erhalten diese E-Mail, weil Sie das Formular auf unserer Website genutzt haben.',
    whyNL: 'Sie erhalten diesen Newsletter, weil Sie ihn bestellt haben.',
    whyAN: 'Sie erhalten diese Nachricht, weil Ihr Geschäft bei AfroKauf eingetragen ist.',
    nlAsk: 'Sie möchten unseren Newsletter für Geschäftsinhaber. Bitte bestätigen Sie mit einem Klick:', nlBtn: 'Ja, Newsletter bestätigen',
    hello: 'Hallo', helloAll: 'Guten Tag' },
  'Français': { findShop: 'Trouver une boutique', listShop: 'Inscrire ma boutique', seminars: 'Séminaires', contact: 'Contact', follow: 'Suivez-nous',
    ref: 'Votre référence', shop: 'Boutique', city: 'Ville', plan: 'Formule', status: 'Statut', received: 'Inscription reçue', live: 'Votre page est en ligne',
    question: 'Une question', newsletter: 'Newsletter', announcement: 'Annonce', unsubscribe: 'Se désabonner',
    whyTx: 'Vous recevez cet e-mail parce que vous avez utilisé le formulaire de notre site.',
    whyNL: 'Vous recevez cette newsletter parce que vous vous y êtes inscrit(e).',
    whyAN: 'Vous recevez ce message parce que votre boutique est inscrite sur AfroKauf.',
    nlAsk: 'Vous avez demandé notre newsletter pour les commerçants. Merci de confirmer en un clic :', nlBtn: 'Oui, je veux la newsletter',
    hello: 'Bonjour', helloAll: 'Bonjour' }
};

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
function me_() { try { return Session.getEffectiveUser().getEmail(); } catch (e) { return ''; } }
function notifyTo_(cfg) { return String(cfg['Notify email (new sign-ups go here)'] || '').trim() || me_(); }
function lang_(v) { return LANGS.indexOf(String(v || '').trim()) > -1 ? String(v).trim() : 'English'; }
function stamp_(d, f) { return Utilities.formatDate(d || new Date(), TZ, f || 'dd.MM.yyyy'); }

// ------------------------------------------------------------------ sheets and columns (found by header name)
function colLetter_(n) { var s = ''; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
function headerMap_(sh) {
  var hdr = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0];
  var map = {};
  for (var i = 0; i < hdr.length; i++) { var h = String(hdr[i]).trim(); if (h && !map[h]) map[h] = i + 1; }
  return map;
}
function sheet_(name) {
  var sh = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sh) throw new Error('There is no "' + name + '" tab yet. Run AfroKauf › Set up the sheet first.');
  return sh;
}
// Adds missing columns at the end, styles the header. Never deletes or moves anything.
function ensureSheet_(name, cols, index) {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(name) || (index == null ? ss.insertSheet(name) : ss.insertSheet(name, index));
  var map = sh.getLastColumn() ? headerMap_(sh) : {};
  cols.forEach(function (c) {
    if (map[c]) return;
    var col = sh.getLastColumn() + 1;
    sh.getRange(1, col).setValue(c);
    map[c] = col;
  });
  sh.getRange(1, 1, 1, sh.getLastColumn()).setFontWeight('bold').setFontColor('#ffffff').setBackground('#0E4D3A').setWrap(true);
  sh.setFrozenRows(1);
  return { sh: sh, map: map };
}
function rowObjects_(sh) {
  var map = headerMap_(sh);
  if (sh.getLastRow() < 2) return { map: map, rows: [] };
  var data = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();   // one read, fast
  return { map: map, rows: data.map(function (v, i) {
    return { r: i + 2, v: v, get: function (n) { return map[n] ? v[map[n] - 1] : ''; } };
  }) };
}

// ------------------------------------------------------------------ menus
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('AfroKauf')
    .addItem('Show post code for the selected row', 'showPostCode')
    .addItem('Remake post code for the selected row', 'remakeSelected')
    .addItem('Show product post code (Products tab, selected row)', 'showProductCode')
    .addSeparator()
    .addItem('Message: page is live (selected row)', 'messageLive')
    .addItem('Message: missing information (selected row)', 'messageMissing')
    .addItem('Add a dated note (selected row)', 'addNote')
    .addSeparator()
    .addItem('What needs me today', 'showToday')
    .addItem('Email me the list now', 'emailNow')
    .addItem('Send me a sample of every email (design check)', 'sendDesignSamples')
    .addSeparator()
    .addItem('Set up the sheet (safe to run again)', 'setup')
    .addToUi();
  ui.createMenu('Newsletter & announcements')
    .addItem('New newsletter', 'newNewsletter')
    .addItem('New announcement', 'newAnnouncement')
    .addItem('New customer newsletter', 'newCustomerNewsletter')
    .addSeparator()
    .addItem('Preview the selected campaign (sends it to me)', 'previewCampaign')
    .addItem('Send the selected campaign to its whole list', 'sendCampaignBulk')
    .addSeparator()
    .addItem('Send a campaign to the selected shop(s)', 'sendCampaignToSelected')
    .addItem('Make a Gmail draft of a campaign for the selected shop', 'draftCampaignForSelected')
    .addSeparator()
    .addItem('How many emails can I still send today?', 'showQuota')
    .addToUi();
}

// Safe to run again: it only adds what is missing. It never deletes or moves your rows, columns or settings.
function setup() {
  var ss = SpreadsheetApp.getActive();
  // Settings
  var st = ss.getSheetByName(SETTINGS_SHEET);
  if (!st) {
    st = ss.insertSheet(SETTINGS_SHEET);
    st.getRange(1, 1, 1, 2).setValues([['Setting', 'Value']]);
    st.setColumnWidth(1, 340); st.setColumnWidth(2, 560);
  }
  st.getRange(1, 1, 1, 2).setFontWeight('bold').setFontColor('#ffffff').setBackground('#0E4D3A');
  st.setFrozenRows(1);
  var have = {};
  if (st.getLastRow() >= 2) {
    st.getRange(2, 1, st.getLastRow() - 1, 2).getValues().forEach(function (r, i) {
      var k = String(r[0]).trim();
      if (!k) return;
      have[k] = true;
      if (k === 'Your name (signs the messages)' && String(r[1]).trim() === 'Your AfroKauf team') st.getRange(i + 2, 2).setValue('AfroKauf Verbund');
      var old = V2_TEXTS[k];   // swap unchanged v2 texts for the new designed ones
      if (old && String(r[1]).replace(/\r\n/g, '\n').trim() === old.trim()) {
        st.getRange(i + 2, 2).setValue(SETTING_DEFAULTS.filter(function (d) { return d[0] === k; })[0][1]);
      }
    });
  }
  SETTING_DEFAULTS.forEach(function (d) {
    if (have[d[0]]) return;
    var v = d[1];
    if (d[0].indexOf('Notify email') === 0 || d[0].indexOf('Contact email') === 0) v = me_();
    if (d[0].indexOf('Web app address') === 0) { try { var u = ScriptApp.getService().getUrl(); if (/\/exec$/.test(u || '')) v = u; } catch (e) {} }
    st.appendRow([d[0], v]);
    if (/^—/.test(d[0])) st.getRange(st.getLastRow(), 1, 1, 2).setFontWeight('bold').setBackground('#FBF6EE');
  });
  st.getRange(2, 2, st.getLastRow() - 1, 1).setWrap(true).setVerticalAlignment('top');

  // Sign-ups
  var s = ensureSheet_(SHEET, COLS, 0);
  var sh = s.sh, map = s.map;
  var rows = Math.max(sh.getMaxRows() - 1, 1);
  var list = function (name, values, strict) {
    sh.getRange(2, map[name], rows, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(!strict).build());
  };
  list('Status', STATUSES, true);
  list('Language', LANGS, false);
  list('Announcements', ['On', 'Off'], false);
  ['Status since', 'Done on', 'Last message'].forEach(function (n) {
    sh.getRange(2, map[n], rows, 1).setNumberFormat('dd.MM.yyyy')
      .setDataValidation(SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(true).build());
  });
  colourRules_(sh, map);

  // Campaigns and Send log
  var c = ensureSheet_(CAMPAIGNS, CAMPAIGN_COLS);
  var crows = Math.max(c.sh.getMaxRows() - 1, 1);
  c.sh.getRange(2, c.map['Type'], crows, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Newsletter', 'Announcement', 'Customer newsletter'], true).build());
  c.sh.getRange(2, c.map['Status'], crows, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Draft', 'Sending', 'Sent'], true).build());
  [c.map['Text (English)'], c.map['Text (Deutsch)'], c.map['Text (Français)']].forEach(function (col) { c.sh.setColumnWidth(col, 360); });
  ensureSheet_(LOG, LOG_COLS);
  var o = ensureSheet_(ORDERS, ORDER_COLS);
  o.sh.getRange(2, o.map['Status'], Math.max(o.sh.getMaxRows() - 1, 1), 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(ORDER_STATUSES, true).build());
  ensureSheet_(SUBS, SUB_COLS);
  var pr = ensureSheet_(PRODUCTS, PRODUCT_COLS);
  pr.sh.getRange(2, pr.map['Status'], Math.max(pr.sh.getMaxRows() - 1, 1), 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['New', 'Published', 'Rejected'], true).build());

  photoFolder_();
  secret_();
  installTriggers_();
  SpreadsheetApp.getUi().alert('Ready',
    'The tabs Sign-ups, Settings, Campaigns and Send log are set up.\n\n' +
    '1. Check the Settings tab: your email, WhatsApp number, the logo link and the web app address.\n' +
    '2. If not done yet: Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone), copy the address ' +
    'into the page code (ENDPOINT) and into Settings ("Web app address").\n' +
    '3. AfroKauf › Send me a sample of every email, to see the design.\n\n' +
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

// ------------------------------------------------------------------ references
// AK-<initials>-<yyyyMMdd>-<HHmmss>-<milliseconds>, e.g. "Mama Ada Foods" -> AK-MAF-20261121-015412-347.
// Made inside the lock and checked against every reference in the sheet, so no two are ever the same.
var STOP_WORDS = ['THE', 'AND', 'UND', 'ET', 'LE', 'LA', 'LES', 'DER', 'DIE', 'DAS', 'DE', 'DU', 'DES', 'OF', 'VON', 'IN'];
function initials_(name) {
  var s = String(name || '').replace(/ß/g, 'SS');
  if (s.normalize) s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  var words = s.toUpperCase().split(/[^A-Z0-9]+/).filter(function (w) { return w && STOP_WORDS.indexOf(w) < 0; });
  if (!words.length) return 'SHOP';
  if (words.length === 1) return words[0].slice(0, 3);
  return words.slice(0, 3).map(function (w) { return w.charAt(0); }).join('');
}
function uniqueId_(prefix, existing, when) {
  var t = (when || new Date()).getTime();
  var id;
  do { id = prefix + '-' + Utilities.formatDate(new Date(t), TZ, 'yyyyMMdd-HHmmss-SSS'); t += 1; } while (existing[id]);
  existing[id] = true;
  return id;
}
function existingIds_(sh, col) {
  var set = {};
  var map = headerMap_(sh);
  if (map[col] && sh.getLastRow() >= 2) sh.getRange(2, map[col], sh.getLastRow() - 1, 1).getValues().forEach(function (r) { if (r[0]) set[String(r[0])] = true; });
  return set;
}
function newReference_(sh, shopName) { return uniqueId_('AK-' + initials_(shopName), existingIds_(sh, 'Reference')); }

// ------------------------------------------------------------------ web app: the form posts here
function doPost(e) {
  try {
    var d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.kind === 'order') return json_(handleOrder_(d));
    if (d.kind === 'subscribe') return json_(handleSubscribe_(d));
    if (d.kind === 'products') return json_(handleProducts_(d));
    if (d.company2) return json_({ ok: true, ref: 'AK-0' });            // bot filled the hidden field: pretend OK, store nothing
    var problem = validate_(d);
    if (problem) return json_({ ok: false, error: problem });
    if (!underLimit_()) return json_({ ok: false, error: 'Too many sign-ups right now. Please try again in an hour.' });
    var cfg = config_();
    var sh = sheet_(SHEET);

    // 1. reserve a unique reference and the row (short lock)
    var ref, lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      var map = headerMap_(sh);
      ref = newReference_(sh, d.name);
      var values = rowValues_(ref, d, '', null);
      var row = new Array(sh.getLastColumn());
      for (var i = 0; i < row.length; i++) row[i] = '';
      Object.keys(values).forEach(function (k) { if (map[k]) row[map[k] - 1] = safeCell_(values[k]); });
      sh.appendRow(row);
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }
    // 2. the slow parts, outside the lock
    var folderUrl = savePhotos_(ref, d);
    var pos = geocode_(d);
    var post = buildPost_(d, pos);
    var found = findRow_(sh, ref);
    if (found) {
      var m = headerMap_(sh);
      var put = { 'Photos folder': folderUrl, 'Lat': pos ? pos.lat : '', 'Lng': pos ? pos.lng : '', 'Post title': post.title,
        'Post labels': post.labels, 'Post code (paste in HTML view)': post.code };
      Object.keys(put).forEach(function (k) { if (m[k]) sh.getRange(found, m[k]).setValue(put[k]); });
      if (m['Follow-up']) sh.getRange(found, m['Follow-up']).setFormula(flagFormula_(m, found, cfg));
    }
    notifyAdmin_(cfg, ref, d, folderUrl);
    if (cfgYes_(cfg, 'Send confirmation to the shop after sign-up?')) sendConfirmation_(cfg, sh, ref);
    return json_({ ok: true, ref: ref });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'Server error.' });
  }
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function findRow_(sh, ref) {
  var map = headerMap_(sh);
  if (!map['Reference'] || sh.getLastRow() < 2) return 0;
  var refs = sh.getRange(2, map['Reference'], sh.getLastRow() - 1, 1).getValues();
  for (var i = refs.length - 1; i >= 0; i--) if (String(refs[i][0]) === String(ref)) return i + 2;
  return 0;
}

// ------------------------------------------------------------------ web app: links in emails (newsletter yes / unsubscribe)
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (!p.a) return ContentService.createTextOutput('AfroKauf sign-up form is connected. Send the form from the website.');
  var cfg = config_();
  var lang = lang_(p.l);
  var T = PAGE_WORDS[lang];
  if (['nl', 'unsub-nl', 'unsub-an'].indexOf(p.a) < 0 || !p.r || p.s !== sig_(p.a, p.r)) return page_(cfg, T.badTitle, T.badText, T.back);
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = sheet_(/^SUB-/.test(p.r) ? SUBS : SHEET);
    var row = findRow_(sh, p.r);
    if (!row) return page_(cfg, T.badTitle, T.badText, T.back);
    var map = headerMap_(sh);
    var now = stamp_(new Date(), 'dd.MM.yyyy HH:mm');
    if (p.a === 'nl') {
      sh.getRange(row, map['Newsletter']).setValue('Confirmed ' + now);
      var c = sh.getRange(row, map['Newsletter consent']);
      c.setValue(String(c.getValue() || '') + ' · confirmed by email link ' + now);
      return page_(cfg, T.nlTitle, T.nlText, T.back);
    }
    if (p.a === 'unsub-nl') { sh.getRange(row, map['Newsletter']).setValue('Unsubscribed ' + now); return page_(cfg, T.unTitle, T.unNlText, T.back); }
    sh.getRange(row, map['Announcements']).setValue('Off');
    if (map['Your notes']) {
      var n = sh.getRange(row, map['Your notes']);
      n.setValue(stamp_() + ': switched off announcements by email link' + (n.getValue() ? '\n' + n.getValue() : ''));
    }
    return page_(cfg, T.unTitle, T.unAnText, T.back);
  } finally {
    lock.releaseLock();
  }
}
var PAGE_WORDS = {
  English: { nlTitle: 'Thank you!', nlText: 'Your newsletter is confirmed. You can unsubscribe at any time with the link in every email.',
    unTitle: 'Done', unNlText: 'You will not get our newsletter any more.', unAnText: 'You will not get our announcements any more. Your shop page stays online.',
    badTitle: 'This link does not work', badText: 'Please reply to one of our emails and we will help you.', back: 'Back to the website' },
  Deutsch: { nlTitle: 'Vielen Dank!', nlText: 'Ihr Newsletter ist bestätigt. Abmelden können Sie sich jederzeit über den Link in jeder E-Mail.',
    unTitle: 'Erledigt', unNlText: 'Sie erhalten unseren Newsletter nicht mehr.', unAnText: 'Sie erhalten unsere Mitteilungen nicht mehr. Ihre Shop-Seite bleibt online.',
    badTitle: 'Dieser Link funktioniert nicht', badText: 'Antworten Sie bitte auf eine unserer E-Mails, wir helfen Ihnen.', back: 'Zur Website' },
  'Français': { nlTitle: 'Merci !', nlText: 'Votre newsletter est confirmée. Vous pouvez vous désabonner à tout moment avec le lien présent dans chaque e-mail.',
    unTitle: 'C’est fait', unNlText: 'Vous ne recevrez plus notre newsletter.', unAnText: 'Vous ne recevrez plus nos annonces. La page de votre boutique reste en ligne.',
    badTitle: 'Ce lien ne fonctionne pas', badText: 'Répondez à l’un de nos e-mails et nous vous aiderons.', back: 'Retour au site' }
};
function page_(cfg, title, text, back) {
  var b = brand_(cfg, 'English');
  var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
    '<body style="margin:0;background:#FBF6EE;font-family:Arial,Helvetica,sans-serif;">' +
    '<div style="max-width:520px;margin:40px auto;background:#fff;border:1px solid #ECECEE;border-radius:10px;overflow:hidden;">' +
    '<div style="background:' + b.primary + ';padding:22px 24px;text-align:center;"><div style="color:#fff;font-size:22px;font-weight:700;">' + esc_(b.name) + '</div></div>' +
    stripe_(b) +
    '<div style="padding:28px 28px 32px;text-align:center;"><h1 style="font-size:22px;color:' + b.primary + ';margin:0 0 10px;">' + esc_(title) + '</h1>' +
    '<p style="font-size:15px;color:#222;line-height:1.6;margin:0 0 22px;">' + esc_(text) + '</p>' +
    (b.website ? '<a href="' + esc_(b.website) + '" style="display:inline-block;background:' + b.accent + ';color:#1F2420;padding:12px 26px;border-radius:6px;text-decoration:none;font-weight:700;">' + esc_(back || b.name) + '</a>' : '') +
    '</div></div></body></html>';
  return HtmlService.createHtmlOutput(html).setTitle(String(title)).addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
function secret_() {
  var props = PropertiesService.getScriptProperties();
  var s = props.getProperty('SIGN_SECRET');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); props.setProperty('SIGN_SECRET', s); }
  return s;
}
function sig_(action, ref) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(action + '|' + ref, secret_())).replace(/=+$/, '').slice(0, 22);
}
function link_(cfg, action, ref, lang) {
  var base = String(cfg['Web app address (ends with /exec)'] || '').trim();
  if (!/^https:\/\/script\.google\.com\/.+\/exec$/.test(base)) return '';
  return base + '?a=' + action + '&r=' + encodeURIComponent(ref) + '&l=' + encodeURIComponent(lang) + '&s=' + sig_(action, ref);
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
  var key = 'n' + Utilities.formatDate(new Date(), TZ, 'yyMMddHH');
  var n = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(n), 3700);
  return n <= MAX_PER_HOUR;
}
// A cell that starts with = + - @ would run as a formula in the sheet: store it as text.
function safeCell_(v) { return (typeof v === 'string' && /^[=+\-@]/.test(v)) ? "'" + v : v; }

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
function attr_(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function text_(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
var esc_ = attr_;
// The city label must match the "Shops by city" tiles: "Frankfurt am Main" -> "Frankfurt".
function cityLabel_(city) { return clean_(city).replace(/\s+am Main$/i, '').replace(/\s*\(Saale\)$/i, '').replace(/\s+im Breisgau$/i, ''); }
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
  var nl = d.newsletter === true || d.newsletter === 'yes';
  var now = new Date();
  return {
    'Reference': ref, 'Received': now, 'Status': 'New', 'Status since': now,
    'New or update': d.kind === 'update' ? 'Update' : 'New', 'Shop name': clean_(d.name, 120), 'Categories': (d.categories || []).join(', '),
    'Street': clean_(d.street), 'Postcode': clean_(d.zip, 5), 'City': clean_(d.city, 60), 'Bundesland': clean_(d.state, 40),
    'Phone': clean_(d.phone, 30), 'WhatsApp': clean_(d.whatsapp, 30), 'Email': clean_(d.email, 120), 'Show email': d.showEmail ? 'yes' : 'no',
    'Website': clean_(d.website, 200), 'Social': clean_(d.social, 200), 'Opening hours': clean_(d.hours, 200), 'Sells': clean_(d.sells, 1500),
    'Products from': clean_(d.origin, 200), 'Services': (d.services || []).join(', '), 'About': clean_(d.about, 800), 'Plan': clean_(d.plan, 40),
    'Contact person': clean_(d.person, 80), 'Contact number': clean_(d.mobile, 30), 'Language': lang_(clean_(d.language)),
    'Newsletter': nl ? 'Waiting for confirmation' : 'No',
    'Newsletter consent': nl ? 'Box ticked on the form ' + stamp_(now, 'dd.MM.yyyy HH:mm') + ' (' + clean_(d.page_url, 200) + ')' : '',
    'Announcements': 'On', 'Note': clean_(d.note, 800), 'Existing page': clean_(d.page, 300), 'Photos folder': folderUrl,
    'Lat': pos ? pos.lat : '', 'Lng': pos ? pos.lng : '',
    'Post title': post.title, 'Post labels': post.labels, 'Post code (paste in HTML view)': post.code
  };
}

// ================================================================== EMAIL DESIGN
// Gmail-safe: tables, inline styles, Arial, max 600px. Colours, logo and links come from Settings.
function brand_(cfg, lang) {
  var site = String(cfg['Website'] || '').trim().replace(/\/$/, '');
  var hex = function (v, d) { v = String(v || '').trim(); return /^#[0-9a-f]{6}$/i.test(v) ? v : d; };
  var W = WORDS[lang_(lang)];
  var social = [['Instagram', cfg['Instagram link']], ['Facebook', cfg['Facebook link']], ['YouTube', cfg['YouTube link']],
    ['TikTok', cfg['TikTok link']], ['LinkedIn', cfg['LinkedIn link']]]
    .filter(function (s) { return /^https?:\/\//.test(String(s[1] || '')); }).map(function (s) { return { label: s[0], url: String(s[1]) }; });
  var nav = [[W.findShop, site], [W.listShop, cfg['"List your shop" page address']], [W.seminars, cfg['Seminars page']], [W.contact, cfg['Contact page']]]
    .filter(function (n) { return /^https?:\/\//.test(String(n[1] || '')); }).map(function (n) { return { label: n[0], url: String(n[1]) }; });
  return {
    name: String(cfg['Brand name'] || 'AfroKauf Verbund'), sender: String(cfg['Sender name (shown in the inbox)'] || cfg['Brand name'] || 'AfroKauf Verbund'),
    tagline: String(cfg['Tagline (' + lang_(lang) + ')'] || cfg['Tagline (English)'] || ''),
    website: site, email: String(cfg['Contact email (replies go here)'] || '').trim() || me_(),
    phone: String(cfg['Phone (optional)'] || ''), address: String(cfg['Address (optional, for the footer)'] || ''),
    whatsapp: waNumber_(cfg['Your WhatsApp number (e.g. 4915112345678)']),
    primary: hex(cfg['Primary colour'], '#0E4D3A'), accent: hex(cfg['Accent colour'], '#E9A23B'), clay: hex(cfg['Clay colour'], '#C4552D'),
    impressum: String(cfg['Impressum page'] || ''), datenschutz: String(cfg['Datenschutz page'] || ''),
    social: social, nav: nav, words: W, logo: logoBlob_(cfg)
  };
}
var LOGO_CACHE_ = {};
function logoBlob_(cfg) {
  var raw = String(cfg['Logo (link to the email logo PNG in Google Drive)'] || '').trim();
  var m = raw.match(/[-\w]{25,}/);
  if (!m) return null;
  if (LOGO_CACHE_[m[0]] !== undefined) return LOGO_CACHE_[m[0]];
  try { LOGO_CACHE_[m[0]] = DriveApp.getFileById(m[0]).getBlob().setName('afrokauf-logo.png'); } catch (e) { LOGO_CACHE_[m[0]] = null; }
  return LOGO_CACHE_[m[0]];
}
var F_ = 'font-family:Arial,Helvetica,sans-serif;';
function stripe_(b) {   // the AfroKauf stripe under the header: gold, clay, green, sand
  var cols = [b.accent, b.clay, '#17644D', '#F3E3C3'], cells = '';
  for (var i = 0; i < 12; i++) cells += '<td style="height:6px;line-height:6px;font-size:0;background:' + cols[i % 4] + ';">&nbsp;</td>';
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>' + cells + '</tr></table>';
}
function header_(b) {
  var contact = [b.website ? '<a href="' + esc_(b.website) + '" style="color:#CFE0D8;text-decoration:none;">' + esc_(b.website.replace(/^https?:\/\//, '')) + '</a>' : '',
    b.phone ? esc_(b.phone) : ''].filter(String).join(' &nbsp;·&nbsp; ');
  var mark = b.logo
    ? '<img src="cid:aklogo" width="260" alt="' + esc_(b.name) + '" style="display:block;margin:0 auto 10px;width:260px;max-width:80%;height:auto;border:0;">'
    : '<h1 style="' + F_ + 'color:#ffffff;margin:0 0 6px;font-size:24px;line-height:1.3;font-weight:700;">' + esc_(b.name) + '</h1>';
  return '<div style="background:' + b.primary + ';padding:26px 24px 22px;text-align:center;">' + mark +
    (b.tagline ? '<p style="' + F_ + 'color:' + b.accent + ';margin:0 0 6px;font-size:13px;letter-spacing:.5px;">' + esc_(b.tagline) + '</p>' : '') +
    (contact ? '<p style="' + F_ + 'color:#CFE0D8;margin:0;font-size:11px;">' + contact + '</p>' : '') +
    '</div>' + stripe_(b);
}
// kind: ok (gold, tick) · warn (amber, !) · info (green, dot)
function banner_(b, kind, label, title) {
  var bg = kind === 'ok' ? b.accent : kind === 'warn' ? '#FFF3CD' : '#17644D';
  var fg = kind === 'ok' ? '#1F2420' : kind === 'warn' ? '#7A5800' : '#ffffff';
  var icon = kind === 'ok' ? '&#10003;' : kind === 'warn' ? '!' : '&#9679;';
  return '<div style="background:' + bg + ';padding:20px 32px;text-align:center;">' +
    '<div style="width:44px;height:44px;border-radius:50%;border:3px solid ' + fg + ';margin:0 auto 10px;text-align:center;line-height:' + (kind === 'info' ? 42 : 38) + 'px;font-size:' + (kind === 'info' ? 18 : 24) + 'px;font-weight:900;color:' + fg + ';' + F_ + '">' + icon + '</div>' +
    '<p style="' + F_ + 'font-size:11px;font-weight:700;color:' + fg + ';text-transform:uppercase;letter-spacing:1.2px;margin:0 0 4px;opacity:0.8;">' + esc_(label) + '</p>' +
    '<p style="' + F_ + 'font-size:24px;font-weight:700;color:' + fg + ';margin:0;">' + esc_(title) + '</p></div>';
}
function detailsTable_(b, rows) {
  rows = rows.filter(function (r) { return r[1]; });
  if (!rows.length) return '';
  return '<table role="presentation" style="width:100%;border-collapse:collapse;margin:4px 0 22px;font-size:14px;' + F_ + '">' +
    rows.map(function (r, i) {
      var line = i < rows.length - 1 ? 'border-bottom:1px solid #ECECEE;' : '';
      return '<tr><td style="padding:9px 12px;' + line + 'font-weight:700;color:' + b.primary + ';width:38%;background:#FBF6EE;">' + esc_(r[0]) + '</td>' +
        '<td style="padding:9px 12px;' + line + 'color:#444444;">' + (r[2] ? r[1] : esc_(r[1])) + '</td></tr>';
    }).join('') + '</table>';
}
function button_(b, label, url) {
  return '<div style="text-align:center;margin:22px 0 22px;"><a href="' + esc_(url) + '" style="display:inline-block;background:' + b.accent +
    ';color:#1F2420;padding:13px 30px;border-radius:6px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:.3px;' + F_ + '">' + esc_(label) + '</a></div>';
}
function sectionLabel_(b, text) {
  return '<p style="' + F_ + 'font-size:11px;font-weight:700;color:' + b.primary + ';text-transform:uppercase;letter-spacing:1.2px;margin:24px 0 14px;border-bottom:2px solid ' + b.accent + ';padding-bottom:6px;">' + esc_(text) + '</p>';
}
// Settings texts and campaign texts: a small, easy format -> email HTML and plain text.
function renderText_(text, b) {
  var html = [], plain = [];
  var inline = function (s) {
    var keep = [];
    s = esc_(s).replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, function (_, t, u) {
      keep.push('<a href="' + u + '" style="color:' + b.primary + ';font-weight:700;text-decoration:underline;">' + t + '</a>');
      return '\u0000' + (keep.length - 1) + '\u0000';
    });
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(https?:\/\/[^\s<\u0000]+)/g, function (u) {
      var clean = u.replace(/[.,;:!?)]+$/, ''), tail = u.slice(clean.length);
      return '<a href="' + clean + '" style="color:' + b.primary + ';text-decoration:underline;">' + clean + '</a>' + tail;
    });
    return s.replace(/\u0000(\d+)\u0000/g, function (_, i) { return keep[+i]; });
  };
  var flat = function (s) { return String(s).replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '$1: $2').replace(/\*\*(.+?)\*\*/g, '$1'); };
  String(text || '').replace(/\r\n/g, '\n').split(/\n\s*\n/).forEach(function (block) {
    block = block.replace(/^\n+|\n+$/g, '');
    if (!block.trim()) return;
    var lines = block.split('\n');
    while (lines.length && /^#{1,2}\s+/.test(lines[0])) {   // headings, also when text follows on the next line
      var hl = lines.shift();
      if (/^##\s+/.test(hl)) { var sl = hl.replace(/^##\s+/, ''); html.push(sectionLabel_(b, flat(sl))); plain.push(flat(sl).toUpperCase()); }
      else { var h = hl.replace(/^#\s+/, ''); html.push('<h2 style="' + F_ + 'font-size:22px;color:' + b.primary + ';margin:0 0 16px;line-height:1.3;">' + inline(h) + '</h2>'); plain.push(flat(h).toUpperCase()); }
    }
    if (!lines.length) return;
    block = lines.join('\n');
    var btn = block.trim().match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
    if (btn) { html.push(button_(b, btn[1], btn[2])); plain.push(btn[1] + ': ' + btn[2]); return; }
    if (lines.every(function (l) { return /^\s*[-•]\s+/.test(l); })) {
      html.push('<ul style="' + F_ + 'margin:0 0 16px;padding-left:22px;color:#222222;font-size:15px;line-height:1.7;">' +
        lines.map(function (l) { return '<li style="margin:0 0 6px;">' + inline(l.replace(/^\s*[-•]\s+/, '')) + '</li>'; }).join('') + '</ul>');
      plain.push(lines.map(function (l) { return '- ' + flat(l.replace(/^\s*[-•]\s+/, '')); }).join('\n')); return;
    }
    html.push('<p style="' + F_ + 'font-size:15px;color:#222222;line-height:1.7;margin:0 0 14px;">' + lines.map(inline).join('<br>') + '</p>');
    plain.push(lines.map(flat).join('\n'));
  });
  return { html: html.join('\n'), plain: plain.join('\n\n') };
}
function footer_(b, o) {
  var W = b.words, a = function (url, label, color) { return '<a href="' + esc_(url) + '" style="color:' + (color || '#9A9AA2') + ';text-decoration:none;">' + esc_(label) + '</a>'; };
  var out = '';
  if (b.social.length) {
    out += '<p style="' + F_ + 'font-size:11px;color:#9A9AA2;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px;">' + esc_(W.follow) + '</p>' +
      '<p style="' + F_ + 'font-size:13px;margin:0 0 14px;">' + b.social.map(function (s) {
        return '<a href="' + esc_(s.url) + '" style="display:inline-block;margin:0 4px 6px;padding:6px 12px;border:1px solid #DDD6C8;border-radius:14px;color:' + b.primary + ';text-decoration:none;font-weight:700;font-size:12px;">' + esc_(s.label) + '</a>';
      }).join('') + '</p>';
  }
  if (b.nav.length) out += '<p style="' + F_ + 'font-size:12px;margin:0 0 12px;">' + b.nav.map(function (n) { return a(n.url, n.label, b.primary); }).join(' &nbsp;·&nbsp; ') + '</p>';
  var contact = [b.address ? esc_(b.address) : '', b.phone ? a('tel:' + b.phone.replace(/[^\d+]/g, ''), b.phone) : '',
    b.email ? a('mailto:' + b.email, b.email) : '', b.website ? a(b.website, b.website.replace(/^https?:\/\//, '')) : '',
    b.whatsapp ? a('https://wa.me/' + b.whatsapp, 'WhatsApp') : ''].filter(String);
  if (contact.length) out += '<p style="' + F_ + 'font-size:10px;color:#9A9AA2;margin:0 0 8px;line-height:1.8;">' + contact.join(' &nbsp;·&nbsp; ') + '</p>';
  var legal = [b.impressum ? a(b.impressum, 'Impressum') : '', b.datenschutz ? a(b.datenschutz, 'Datenschutz') : ''].filter(String);
  if (legal.length) out += '<p style="' + F_ + 'font-size:10px;color:#9A9AA2;margin:0 0 8px;">' + legal.join(' &nbsp;·&nbsp; ') + '</p>';
  if (o.why) {
    var unsub = o.unsubscribe ? ' ' + a(o.unsubscribe, W.unsubscribe, '#7A7A82').replace('text-decoration:none', 'text-decoration:underline') : '';
    out += '<p style="' + F_ + 'font-size:10px;color:#9A9AA2;margin:0 0 6px;line-height:1.6;">' + esc_(o.why) + unsub + '</p>';
  }
  if (o.ref) out += '<p style="' + F_ + 'font-size:10px;color:#9A9AA2;margin:0 0 6px;">' + esc_(W.ref) + ': <strong style="color:#7A7A82;">' + esc_(o.ref) + '</strong></p>';
  out += '<p style="' + F_ + 'font-size:10px;color:#BBBBBB;margin:4px 0 0;">© ' + new Date().getFullYear() + ' ' + esc_(b.name) + '</p>';
  return '<div style="background:#F7F7F9;padding:24px 20px;text-align:center;border-top:1px solid #ECECEE;">' + out + '</div>';
}
// The whole email. o: { banner:[kind,label,title], body (html), preheader, why, unsubscribe, ref, lang }
function wrapEmail_(b, o) {
  return '<!DOCTYPE html><html lang="' + ({ Deutsch: 'de', 'Français': 'fr' }[o.lang] || 'en') + '"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="X-UA-Compatible" content="IE=edge">' +
    '<style>body{margin:0;padding:0;background:#ffffff;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}' +
    'table{border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;}img{border:0;height:auto;line-height:100%;outline:none;text-decoration:none;}' +
    '@media only screen and (max-width:600px){.ak-body{padding:20px 16px !important;}.ak-box{border-left:none !important;border-right:none !important;}}</style></head>' +
    '<body style="margin:0;padding:0;background:#ffffff;">' +
    (o.preheader ? '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#ffffff;font-size:1px;">' + esc_(o.preheader) + '</div>' : '') +
    '<div style="width:100%;background:#ffffff;padding:0;"><div class="ak-box" style="max-width:600px;width:100%;margin:0 auto;background:#ffffff;border:1px solid #ECECEE;overflow:hidden;' + F_ + '">' +
    header_(b) + (o.banner ? banner_(b, o.banner[0], o.banner[1], o.banner[2]) : '') +
    '<div class="ak-body" style="padding:28px 32px;">' + o.body + '</div>' +
    footer_(b, o) + '</div></div></body></html>';
}
function mailOptions_(b, html, extra) {
  var o = { htmlBody: html, name: b.sender };
  if (b.email) o.replyTo = b.email;
  if (b.logo) o.inlineImages = { aklogo: b.logo };
  for (var k in (extra || {})) o[k] = extra[k];
  return o;
}
function send_(to, subject, plain, b, html) {
  var o = mailOptions_(b, html, { to: to, subject: subject, body: plain });
  MailApp.sendEmail(o);
}
function draft_(to, subject, plain, b, html) {
  GmailApp.createDraft(to, subject, plain, mailOptions_(b, html));
}

// ------------------------------------------------------------------ tokens
// Every column becomes a token named after its header without spaces or punctuation: "Shop name" -> {{ShopName}}.
function tokens_(map, v, cfg, lang) {
  var t = {};
  Object.keys(map).forEach(function (h) {
    var x = v[map[h] - 1];
    if (x instanceof Date) x = stamp_(x);
    t[h.replace(/\(.*?\)/g, '').split(/[^A-Za-z0-9]+/).filter(String).map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join('')] = String(x == null ? '' : x);
  });
  var W = WORDS[lang_(lang)];
  var first = String(t.ContactPerson || '').trim().split(/\s+/)[0];
  t.Greeting = first ? W.hello + ' ' + first + ',' : W.helloAll + ',';
  t.YourName = String(cfg['Your name (signs the messages)'] || '');
  t.FormLink = String(cfg['"List your shop" page address'] || '');
  t.BrandName = String(cfg['Brand name'] || '');
  t.Website = String(cfg['Website'] || '');
  return t;
}
function fill_(s, t) { return String(s == null ? '' : s).replace(/\{\{(\w+)\}\}/g, function (_, k) { return t[k] != null ? t[k] : ''; }); }
function waNumber_(n) {
  var d = String(n || '').replace(/[^\d+]/g, '');
  if (d.indexOf('+') === 0) return d.slice(1);
  if (d.indexOf('00') === 0) return d.slice(2);
  if (d.indexOf('0') === 0) return '49' + d.slice(1);
  return d;
}

// ------------------------------------------------------------------ transactional emails
// After a sign-up: confirmation to the shop, in its language (with the newsletter confirm button if they asked for it).
function sendConfirmation_(cfg, sh, ref) {
  try {
    var row = findRow_(sh, ref);
    if (!row) return;
    var map = headerMap_(sh), v = sh.getRange(row, 1, 1, sh.getLastColumn()).getValues()[0];
    var get = function (n) { return map[n] ? v[map[n] - 1] : ''; };
    var mail = buildShopMessage_(cfg, map, v, 'Confirmation');
    if (!mail) return;
    send_(get('Email'), mail.subject, mail.plain, mail.brand, mail.html);
    if (map['Last message']) sh.getRange(row, map['Last message']).setValue(new Date());
  } catch (e) {
    console.error('confirmation failed', e);
  }
}
// Builds "Confirmation", "Page live" or "Missing info" for one row. Returns { subject, html, plain, brand }.
function buildShopMessage_(cfg, map, v, kind) {
  var get = function (n) { return map[n] ? v[map[n] - 1] : ''; };
  var lang = lang_(get('Language'));
  var b = brand_(cfg, lang), W = b.words, t = tokens_(map, v, cfg, lang);
  var subject = fill_(cfg[kind + ' subject (' + lang + ')'] || cfg[kind + ' subject (English)'], t);
  var body = renderText_(fill_(cfg[kind + ' text (' + lang + ')'] || cfg[kind + ' text (English)'], t), b);
  if (!subject || !body.html) return null;
  var ref = String(get('Reference'));
  var details = detailsTable_(b, [[W.shop, get('Shop name')], [W.city, get('City')], [W.plan, get('Plan')], [W.ref, ref]]);
  var extraHtml = '', extraPlain = '';
  if (kind === 'Confirmation' && /^Waiting/.test(String(get('Newsletter')))) {
    var nl = link_(cfg, 'nl', ref, lang);
    if (nl) {
      extraHtml = sectionLabel_(b, W.newsletter) + '<p style="' + F_ + 'font-size:15px;color:#222222;line-height:1.7;margin:0 0 6px;">' + esc_(W.nlAsk) + '</p>' + button_(b, W.nlBtn, nl);
      extraPlain = '\n\n' + W.nlAsk + '\n' + nl;
    }
  }
  var banner = kind === 'Page live' ? ['ok', b.name, W.live] : kind === 'Missing info' ? ['warn', b.name, W.question] : ['info', b.name, W.received];
  var html = wrapEmail_(b, { lang: lang, banner: banner, preheader: subject, ref: ref, why: W.whyTx,
    body: body.html + (kind === 'Page live' ? '' : details) + extraHtml });
  return { subject: subject, html: html, plain: body.plain + extraPlain + '\n\n' + W.ref + ': ' + ref, brand: b };
}

// New sign-up: email to you (English), with the details and a button to the sheet.
function notifyAdmin_(cfg, ref, d, folderUrl) {
  try {
    var to = notifyTo_(cfg);
    if (!to) return;
    var b = brand_(cfg, 'English');
    var url = SpreadsheetApp.getActive().getUrl();
    var rows = [['Reference', ref], ['Shop', clean_(d.name)], ['Kind', (d.categories || []).join(', ')],
      ['City', clean_(d.city) + (d.state ? ' (' + clean_(d.state) + ')' : '')], ['Plan', clean_(d.plan)], ['Language', lang_(d.language)],
      ['Contact', clean_(d.person) + ' · ' + (clean_(d.mobile) || clean_(d.phone))], ['Email', clean_(d.email)],
      ['Newsletter', d.newsletter ? 'Ticked (waits for email confirmation)' : 'No'],
      ['Existing page', clean_(d.page)], ['Photos', folderUrl ? '<a href="' + esc_(folderUrl) + '" style="color:' + b.primary + ';">Open folder</a>' : 'No photos', !!folderUrl]];
    var title = d.kind === 'update' ? 'Change request' : 'New shop';
    var html = wrapEmail_(b, { lang: 'English', banner: ['info', 'Sign-up', title], ref: ref,
      body: '<p style="' + F_ + 'font-size:15px;color:#222222;line-height:1.7;margin:0 0 14px;">' + esc_(title) + ': <strong>' + esc_(clean_(d.name)) + '</strong></p>' +
        detailsTable_(b, rows) + button_(b, 'Open the sheet', url) });
    send_(to, 'AfroKauf sign-up: ' + clean_(d.name, 80) + ' (' + ref + ')', rows.map(function (r) { return r[0] + ': ' + String(r[1]).replace(/<[^>]+>/g, ''); }).join('\n') + '\n\n' + url, b, html);
  } catch (e) {
    console.error('mail failed', e);
  }
}

// ------------------------------------------------------------------ the selected row
function selected_() {
  var sh = SpreadsheetApp.getActive().getActiveSheet();
  if (sh.getName() !== SHEET) throw new Error('Open the "' + SHEET + '" tab and click a row first.');
  var r = sh.getActiveRange().getRow();
  if (r < 2) throw new Error('Click a sign-up row first (not the header).');
  var map = headerMap_(sh);
  var v = sh.getRange(r, 1, 1, sh.getLastColumn()).getValues()[0];
  return { sh: sh, r: r, map: map, v: v, get: function (name) { return map[name] ? v[map[name] - 1] : ''; } };
}
function selectedRows_() {
  var sh = SpreadsheetApp.getActive().getActiveSheet();
  if (sh.getName() !== SHEET) throw new Error('Open the "' + SHEET + '" tab and select the shop row(s) first.');
  var rows = {};
  sh.getActiveRangeList().getRanges().forEach(function (rg) { for (var r = rg.getRow(); r <= rg.getLastRow(); r++) if (r >= 2) rows[r] = true; });
  var list = Object.keys(rows).map(Number).sort(function (a, b) { return a - b; });
  if (!list.length) throw new Error('Select one or more shop rows (not the header).');
  return { sh: sh, rows: list };
}
function run_(fn) {
  try { fn(); } catch (err) {
    SpreadsheetApp.getUi().alert('Could not do this', String(err && err.message ? err.message : err), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}
function note_(sh, map, r, text) {
  if (!map['Your notes']) return;
  var cell = sh.getRange(r, map['Your notes']);
  var old = String(cell.getValue() || '').trim();
  cell.setValue(stamp_() + ': ' + text + (old ? '\n' + old : ''));
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

// Messages to one shop: a designed Gmail DRAFT (you check it and press Send) plus the same text for WhatsApp.
function message_(kind) {
  run_(function () {
    var s = selected_(), cfg = config_();
    if (kind === 'Page live' && !s.get('Shop page link')) throw new Error('Paste the shop page address into "Shop page link" first.');
    var mail = buildShopMessage_(cfg, s.map, s.v, kind);
    if (!mail) throw new Error('The "' + kind + '" text on the Settings tab is empty.');
    var email = String(s.get('Email') || '').trim(), parts = [];
    if (email) {
      draft_(email, mail.subject, mail.plain, mail.brand, mail.html);
      parts.push('<p>✓ A designed <b>draft</b> to ' + text_(email) + ' is in your Gmail Drafts. Open Gmail, check it and press Send.</p>');
    }
    var wa = waNumber_(s.get('WhatsApp') || s.get('Contact number'));
    if (wa) parts.push('<p><a target="_blank" href="https://wa.me/' + attr_(wa) + '?text=' + encodeURIComponent(mail.plain) + '">Open the same message in WhatsApp</a></p>');
    if (!parts.length) throw new Error('This row has no email and no WhatsApp number.');
    if (s.map['Last message']) s.sh.getRange(s.r, s.map['Last message']).setValue(new Date());
    note_(s.sh, s.map, s.r, 'message "' + kind + '" prepared');
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
    note_(s.sh, s.map, s.r, r.getResponseText().trim());
  });
}

// ================================================================== NEWSLETTERS AND ANNOUNCEMENTS
var EXAMPLE = {
  Newsletter: ['AfroKauf news for shop owners', '# News from AfroKauf\n\n{{Greeting}}\n\nhere is what is new this month.\n\n## Next seminar\n' +
    '**More customers with your phone**, Saturday 10:00–13:00 in Frankfurt.\n\n[Book my seat](' + SITE + '/search/label/Events)\n\n## Good to know\n' +
    '- First point\n- Second point\n\nSee you soon!\n{{YourName}}'],
  'Customer newsletter': ['New offers in African shops near you', '# This month at AfroKauf\n\n{{Greeting}}\n\nhere are the best offers from our member shops.\n\n' +
    '[See the deals](' + SITE + '/search/label/Product)\n\n## New shops\n- First new shop\n- Second new shop\n\n## Recipe of the month\nWrite a short intro and link the article.\n\nSee you soon!\n{{YourName}}'],
  Announcement: ['Important information about your AfroKauf page', '# A short update\n\n{{Greeting}}\n\nwrite your announcement here.\n\n' +
    '[Open my shop page]({{ShopPageLink}})\n\nThank you!\n{{YourName}}']
};
function newNewsletter() { run_(function () { newCampaign_('Newsletter'); }); }
function newAnnouncement() { run_(function () { newCampaign_('Announcement'); }); }
function newCustomerNewsletter() { run_(function () { newCampaign_('Customer newsletter'); }); }
function newCampaign_(type) {
  var c = ensureSheet_(CAMPAIGNS, CAMPAIGN_COLS);
  var id = uniqueId_(type === 'Newsletter' ? 'NL' : type === 'Customer newsletter' ? 'CN' : 'AN', existingIds_(c.sh, 'Campaign ID'));
  var vals = { 'Campaign ID': id, 'Type': type, 'Status': 'Draft', 'Subject (English)': EXAMPLE[type][0], 'Text (English)': EXAMPLE[type][1],
    'Created': new Date(), 'Sent': 0 };
  var row = new Array(c.sh.getLastColumn());
  for (var i = 0; i < row.length; i++) row[i] = '';
  Object.keys(vals).forEach(function (k) { if (c.map[k]) row[c.map[k] - 1] = vals[k]; });
  c.sh.appendRow(row);
  var r = c.sh.getLastRow();
  c.sh.getRange(r, 1, 1, c.sh.getLastColumn()).setWrap(true).setVerticalAlignment('top');
  SpreadsheetApp.getActive().setActiveSheet(c.sh);
  c.sh.setActiveSelection(c.sh.getRange(r, 1));
  SpreadsheetApp.getUi().alert(type + ' ' + id + ' created',
    'Write the subject and the text in row ' + r + ' (English; add Deutsch and Français if you like: shops get their own language, or English when that text is empty).\n\n' +
    (type === 'Newsletter' ? 'Goes to: shops that ticked the newsletter box and confirmed it by email.\n' :
     type === 'Customer newsletter' ? 'Goes to: customers who signed up in the website footer and confirmed by email (Subscribers tab).\n' :
     'Goes to: all listed (Live) shops that did not switch announcements off.\n') +
    'Optional: "Only Bundesland" or "Only city" to send to one area.\n\nThen: Preview (sends it to you) › Send.', SpreadsheetApp.getUi().ButtonSet.OK);
}
function campaignRow_(id) {
  var c = rowObjects_(sheet_(CAMPAIGNS));
  if (!id) {   // the selected row on the Campaigns tab
    var sh = SpreadsheetApp.getActive().getActiveSheet();
    if (sh.getName() !== CAMPAIGNS) throw new Error('Open the "' + CAMPAIGNS + '" tab and click the campaign row first.');
    var r = sh.getActiveRange().getRow();
    var hit = c.rows.filter(function (x) { return x.r === r; })[0];
    if (!hit || !hit.get('Campaign ID')) throw new Error('Click a campaign row first (not the header).');
    return { c: c, row: hit };
  }
  var found = c.rows.filter(function (x) { return String(x.get('Campaign ID')) === String(id).trim(); })[0];
  if (!found) throw new Error('No campaign with the ID ' + id + '.');
  return { c: c, row: found };
}
function campaignType_(row) { var t = String(row.get('Type')); return t === 'Newsletter' || t === 'Customer newsletter' ? t : 'Announcement'; }
// Who may get this campaign: newsletter = confirmed subscribers only; announcement = live shops that did not switch it off.
function allowed_(type, get) {
  if (!/@/.test(String(get('Email')))) return 'no email';
  if (type === 'Customer newsletter' && !/^SUB-/.test(String(get('Reference')))) return 'not a customer subscriber';
  if (type !== 'Announcement') return /^Confirmed/.test(String(get('Newsletter'))) ? '' : 'no confirmed newsletter consent';
  if (['Live', 'Update done'].indexOf(String(get('Status'))) < 0) return 'shop not live';
  return String(get('Announcements')) === 'Off' ? 'switched announcements off' : '';
}
function audience_(camp) {
  var type = campaignType_(camp);
  var onlyState = String(camp.get('Only Bundesland') || '').trim().toLowerCase(), onlyCity = String(camp.get('Only city') || '').trim().toLowerCase();
  var s = rowObjects_(sheet_(type === 'Customer newsletter' ? SUBS : SHEET));
  if (type === 'Customer newsletter') onlyState = onlyCity = '';
  var seen = {};
  return { map: s.map, rows: s.rows.filter(function (x) {
    if (allowed_(type, x.get)) return false;
    if (onlyState && String(x.get('Bundesland')).trim().toLowerCase() !== onlyState) return false;
    if (onlyCity && String(x.get('City')).trim().toLowerCase().indexOf(onlyCity) !== 0) return false;
    var mail = String(x.get('Email')).trim().toLowerCase();   // one email per address, even if a shop signed up twice
    if (seen[mail]) return false;
    seen[mail] = true;
    return true;
  }) };
}
function buildCampaign_(cfg, camp, map, v) {
  var get = function (n) { return map[n] ? v[map[n] - 1] : ''; };
  var type = campaignType_(camp);
  var lang = lang_(get('Language'));
  var subjectT = camp.get('Subject (' + lang + ')') || camp.get('Subject (English)');
  var textT = camp.get('Text (' + lang + ')') || camp.get('Text (English)');
  if (!String(subjectT).trim() || !String(textT).trim()) throw new Error('Campaign ' + camp.get('Campaign ID') + ' has no English subject or text.');
  var useLang = camp.get('Subject (' + lang + ')') ? lang : 'English';
  var b = brand_(cfg, useLang), W = b.words, t = tokens_(map, v, cfg, useLang), ref = String(get('Reference'));
  var body = renderText_(fill_(textT, t), b);
  var pic = String(camp.get('Picture link (optional)') || '').trim();
  var picHtml = /^https:\/\//.test(pic) ? '<img src="' + esc_(pic) + '" width="536" alt="" style="display:block;width:100%;max-width:536px;height:auto;border-radius:8px;margin:0 0 20px;">' : '';
  var unsub = link_(cfg, type !== 'Announcement' ? 'unsub-nl' : 'unsub-an', ref, useLang) ||
    (b.email ? 'mailto:' + b.email + '?subject=' + encodeURIComponent(W.unsubscribe + ' ' + ref) : '');
  var html = wrapEmail_(b, { lang: useLang, preheader: fill_(subjectT, t), ref: ref, unsubscribe: unsub,
    why: type !== 'Announcement' ? W.whyNL : W.whyAN,
    body: sectionLabel_(b, (type !== 'Announcement' ? W.newsletter : W.announcement) + ' · ' + stamp_(new Date(), 'dd.MM.yyyy')).replace('margin:24px 0 14px', 'margin:0 0 18px') + picHtml + body.html });
  return { to: String(get('Email')).trim(), subject: fill_(subjectT, t), html: html, brand: b, lang: useLang,
    plain: body.plain + '\n\n' + (type !== 'Announcement' ? W.whyNL : W.whyAN) + (unsub ? '\n' + W.unsubscribe + ': ' + unsub : '') };
}
function sentSet_(id) {
  var set = {};
  rowObjects_(sheet_(LOG)).rows.forEach(function (x) {
    if (String(x.get('Campaign ID')) === String(id) && /^Sent/.test(String(x.get('Result')))) set[String(x.get('Reference'))] = true;
  });
  return set;
}
function logRows_(rows) {
  if (!rows.length) return;
  var sh = sheet_(LOG), map = headerMap_(sh);
  var out = rows.map(function (o) {
    var r = new Array(sh.getLastColumn());
    for (var i = 0; i < r.length; i++) r[i] = '';
    Object.keys(o).forEach(function (k) { if (map[k]) r[map[k] - 1] = o[k]; });
    return r;
  });
  sh.getRange(sh.getLastRow() + 1, 1, out.length, out[0].length).setValues(out);
}
// status: 'Sent', 'Sending', or null to leave it as it is (used for single shops)
function updateCampaign_(camp, sentNow, status) {
  var sh = sheet_(CAMPAIGNS), map = headerMap_(sh), r = camp.r;
  if (map['Sent']) sh.getRange(r, map['Sent']).setValue(Number(camp.get('Sent') || 0) + sentNow);
  if (map['Last sent'] && sentNow) sh.getRange(r, map['Last sent']).setValue(new Date());
  if (map['Status'] && status) sh.getRange(r, map['Status']).setValue(status);
}

// Preview: the selected campaign, filled with the first shop of its list (or sample data), sent to you.
function previewCampaign() {
  run_(function () {
    var cfg = config_(), cr = campaignRow_(), camp = cr.row;
    var aud = audience_(camp);
    var sample = aud.rows[0];
    var map = aud.map, v = sample ? sample.v : null;
    if (!sample) {   // nobody on the list yet: use made-up data
      map = {}; COLS.forEach(function (c, i) { map[c] = i + 1; });
      var demo = { 'Reference': 'AK-SAM-20261121-120000-000', 'Shop name': 'Sample Shop', 'City': 'Frankfurt am Main', 'Contact person': 'Ada', 'Shop page link': SITE, 'Email': notifyTo_(cfg) };
      v = COLS.map(function (c) { return demo[c] || ''; });
    }
    var m = buildCampaign_(cfg, camp, map, v);
    send_(notifyTo_(cfg), '[PREVIEW] ' + m.subject, m.plain, m.brand, m.html);
    SpreadsheetApp.getUi().alert('Preview sent', 'Sent to ' + notifyTo_(cfg) + (sample ? ', filled in for ' + sample.get('Shop name') + ' (' + m.lang + ').' : ' with sample data (the list is still empty).') +
      '\n\nThis campaign would go to ' + aud.rows.length + ' shop(s) right now.', SpreadsheetApp.getUi().ButtonSet.OK);
  });
}

// Bulk: to the whole list. Safe to run again: shops in the Send log for this campaign are skipped.
function sendCampaignBulk() {
  run_(function () {
    var ui = SpreadsheetApp.getUi(), cfg = config_(), cr = campaignRow_(), camp = cr.row;
    var id = String(camp.get('Campaign ID'));
    var done = sentSet_(id);
    var aud = audience_(camp);
    var todo = aud.rows.filter(function (x) { return !done[String(x.get('Reference'))]; });
    var quota = MailApp.getRemainingDailyQuota();
    if (!todo.length) { updateCampaign_(camp, 0, 'Sent'); ui.alert('Nothing to send', 'Everyone on the list already got ' + id + '.', ui.ButtonSet.OK); return; }
    var ok = ui.alert('Send ' + campaignType_(camp).toLowerCase() + ' ' + id + '?',
      'Subject: ' + camp.get('Subject (English)') + '\n\nTo: ' + todo.length + ' shop(s)' + (Object.keys(done).length ? ' (' + Object.keys(done).length + ' already got it)' : '') +
      '\nEmails you can still send today: ' + quota +
      (quota < todo.length ? '\n\nToday only ' + quota + ' can go out. Run Send again tomorrow for the rest: nobody gets it twice.' : '') +
      '\n\nDid you check the preview?', ui.ButtonSet.YES_NO);
    if (ok !== ui.Button.YES) return;
    var res = sendTo_(cfg, camp, todo, 'Bulk', aud.map);
    updateCampaign_(camp, res.sent, res.sent === todo.length && !res.stopped ? 'Sent' : 'Sending');
    ui.alert('Sent ' + res.sent + ' of ' + todo.length, (res.failed ? res.failed + ' failed (see Send log). ' : '') +
      (res.stopped ? res.stopped + '\nRun "Send the selected campaign" again to continue: nobody gets it twice.' : 'Done.'), ui.ButtonSet.OK);
  });
}
function sendTo_(cfg, camp, rows, how, map) {
  var start = Date.now(), log = [], sent = 0, failed = 0, stopped = '';
  map = map || headerMap_(sheet_(SHEET));
  for (var i = 0; i < rows.length; i++) {
    if (Date.now() - start > SEND_TIME_LIMIT) { stopped = 'Stopped after ' + sent + ' emails to stay inside Google\'s time limit.'; break; }
    if (MailApp.getRemainingDailyQuota() < 1) { stopped = 'Today\'s email limit is reached.'; break; }
    var x = rows[i];
    var entry = { 'Sent at': new Date(), 'Campaign ID': camp.get('Campaign ID'), 'Reference': x.get('Reference'), 'Shop name': x.get('Shop name'),
      'Email': x.get('Email'), 'Language': lang_(x.get('Language')), 'How': how };
    try {
      var m = buildCampaign_(cfg, camp, map, x.v);
      send_(m.to, m.subject, m.plain, m.brand, m.html);
      entry['Result'] = 'Sent'; sent++;
    } catch (e) {
      entry['Result'] = 'Failed: ' + (e && e.message ? e.message : e); failed++;
    }
    log.push(entry);
    if (log.length >= 20) { logRows_(log); log = []; }
  }
  logRows_(log);
  return { sent: sent, failed: failed, stopped: stopped };
}
function askCampaignId_() {
  var ui = SpreadsheetApp.getUi();
  var list = rowObjects_(sheet_(CAMPAIGNS)).rows.filter(function (x) { return x.get('Campaign ID'); }).slice(-6).reverse();
  if (!list.length) throw new Error('There is no campaign yet. Use "New newsletter" or "New announcement" first.');
  var r = ui.prompt('Which campaign?', 'Type the Campaign ID, or leave empty for the newest one:\n\n' +
    list.map(function (x) { return x.get('Campaign ID') + '  ·  ' + x.get('Type') + '  ·  ' + x.get('Subject (English)'); }).join('\n'), ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return null;
  return r.getResponseText().trim() || String(list[0].get('Campaign ID'));
}
// Individually: to the shop row(s) you selected on the Sign-ups tab.
function sendCampaignToSelected() {
  run_(function () {
    var sel = selectedRows_(), cfg = config_();
    var id = askCampaignId_(); if (!id) return;
    var camp = campaignRow_(id).row, type = campaignType_(camp), done = sentSet_(id);
    var all = rowObjects_(sel.sh).rows, skipped = [];
    var rows = all.filter(function (x) {
      if (sel.rows.indexOf(x.r) < 0) return false;
      var why = allowed_(type, x.get) || (done[String(x.get('Reference'))] ? 'already got it' : '');
      if (why) skipped.push(x.get('Shop name') + ': ' + why);
      return !why;
    });
    var res = sendTo_(cfg, camp, rows, 'Selected', headerMap_(sel.sh));
    if (res.sent) updateCampaign_(camp, res.sent, null);
    SpreadsheetApp.getUi().alert('Sent ' + res.sent + ' of ' + sel.rows.length, (skipped.length ? 'Skipped:\n' + skipped.join('\n') + '\n\n' : '') +
      (res.stopped || '') + (res.failed ? '\n' + res.failed + ' failed (see Send log).' : ''), SpreadsheetApp.getUi().ButtonSet.OK);
  });
}
// One shop, as a Gmail draft you can edit before sending.
function draftCampaignForSelected() {
  run_(function () {
    var s = selected_(), cfg = config_();
    var id = askCampaignId_(); if (!id) return;
    var camp = campaignRow_(id).row, why = allowed_(campaignType_(camp), s.get);
    if (why) throw new Error(s.get('Shop name') + ': ' + why + '. No draft was made.');
    var m = buildCampaign_(cfg, camp, s.map, s.v);
    draft_(m.to, m.subject, m.plain, m.brand, m.html);
    logRows_([{ 'Sent at': new Date(), 'Campaign ID': id, 'Reference': s.get('Reference'), 'Shop name': s.get('Shop name'), 'Email': m.to,
      'Language': m.lang, 'How': 'Gmail draft', 'Result': 'Draft made' }]);
    SpreadsheetApp.getUi().alert('Draft ready', 'A designed draft to ' + m.to + ' is in your Gmail Drafts. Check it and press Send there.', SpreadsheetApp.getUi().ButtonSet.OK);
  });
}
function showQuota() {
  SpreadsheetApp.getUi().alert('Emails left today: ' + MailApp.getRemainingDailyQuota(),
    'A free Gmail account can send to about 100 people a day from a script; Google Workspace about 1,500. ' +
    'Bulk sends stop before the limit and continue when you run them again.', SpreadsheetApp.getUi().ButtonSet.OK);
}

// One sample of every designed email, to you, so you can check the look in Gmail.
function sendDesignSamples() {
  run_(function () {
    var cfg = config_(), to = notifyTo_(cfg);
    var map = {}; COLS.forEach(function (c, i) { map[c] = i + 1; });
    var sample = { 'Reference': 'AK-MAF-20261121-120000-123', 'Shop name': 'Mama Ada Foods', 'City': 'Frankfurt am Main', 'Plan': 'Premium (19 € / month)',
      'Contact person': 'Ada Obi', 'Email': to, 'Shop page link': SITE, 'Language': 'English', 'Newsletter': 'Waiting for confirmation' };
    var v = COLS.map(function (c) { return sample[c] || ''; });
    ['Confirmation', 'Page live', 'Missing info'].forEach(function (k) {
      var m = buildShopMessage_(cfg, map, v, k);
      if (m) send_(to, '[SAMPLE] ' + m.subject, m.plain, m.brand, m.html);
    });
    SpreadsheetApp.getUi().alert('Samples sent', '3 sample emails went to ' + to + '. For a newsletter or announcement, use Preview on the Campaigns tab.', SpreadsheetApp.getUi().ButtonSet.OK);
  });
}

// ================================================================== YOUR DAILY LIST
function openItems_() {
  var s = rowObjects_(sheet_(SHEET));
  var out = [];
  s.rows.forEach(function (x) {
    var st = x.get('Status');
    if (['New', 'Checking', 'Waiting for shop'].indexOf(st) < 0) return;
    var since = x.get('Status since');
    var days = since instanceof Date ? Math.floor((new Date() - since) / 864e5) : '';
    out.push({ row: x.r, name: x.get('Shop name'), city: x.get('City'), status: st, days: days, ref: x.get('Reference'),
      flag: String(x.get('Follow-up')).charAt(0) === '⚠', kind: x.get('New or update'), plan: x.get('Plan') });
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
  var cfg = config_(), items = openItems_();
  if (!items.length) return;
  var to = notifyTo_(cfg);
  if (!to) return;
  var b = brand_(cfg, 'English'), url = SpreadsheetApp.getActive().getUrl();
  var flagged = items.filter(function (x) { return x.flag; }).length;
  var th = 'style="' + F_ + 'text-align:left;padding:8px 10px;background:#FBF6EE;color:' + b.primary + ';font-size:11px;text-transform:uppercase;letter-spacing:.04em;"';
  var td = function (s, extra) { return '<td style="' + F_ + 'padding:8px 10px;border-bottom:1px solid #ECECEE;font-size:13px;color:#222;' + (extra || '') + '">' + s + '</td>'; };
  var table = '<table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 18px;"><tr><th ' + th + '>Shop</th><th ' + th + '>Status</th><th ' + th + '>Days</th></tr>' +
    items.map(function (x) {
      return '<tr' + (x.flag ? ' style="background:#FFF3CD;"' : '') + '>' + td((x.flag ? '⚠ ' : '') + '<strong>' + esc_(x.name) + '</strong><br><span style="color:#9A9AA2;font-size:11px;">' +
        esc_(x.city) + ' · ' + esc_(x.ref) + (/Premium/.test(x.plan) ? ' · wants Premium' : '') + (x.kind === 'Update' ? ' · change request' : '') + '</span>') +
        td(esc_(x.status)) + td(esc_(x.days), 'text-align:center;') + '</tr>';
    }).join('') + '</table>';
  var html = wrapEmail_(b, { lang: 'English', banner: [flagged ? 'warn' : 'info', 'Daily list', items.length + ' sign-up' + (items.length === 1 ? '' : 's') + ' open'],
    body: table + button_(b, 'Open the sheet', url) });
  send_(to, 'AfroKauf: ' + items.length + ' sign-up' + (items.length === 1 ? '' : 's') + ' open' + (flagged ? ', ' + flagged + ' overdue' : ''),
    'Sign-ups waiting for you (overdue first):\n\n' + listText_(items) + '\n\nOpen the sheet: ' + url, b, html);
}
function emailNow() {
  run_(function () {
    var n = openItems_().length;
    sendDailySummary();
    SpreadsheetApp.getUi().alert(n ? 'Sent: ' + n + ' open sign-up' + (n === 1 ? '' : 's') + ' to ' + notifyTo_(config_()) + '.' : 'Nothing open, so no email was sent.');
  });
}

// ================================================================== ORDERS FROM THE WEBSITE SHOP
// One order = one shop. Every price is read again from the blog's own feed, so a changed cart cannot change the total.
// The shop gets a designed email (you get a copy), the customer gets a confirmation. Pay and pick up in the shop.
var ORDER_WORDS = {
  English: { newOrder: 'New order', customer: 'Customer', phone: 'Phone', pickup: 'Pick-up', note: 'Note', total: 'Total', product: 'Product',
    qty: 'Qty', price: 'Price', reply: 'Reply on WhatsApp', call: 'Call the customer', sent: 'Order request sent', order: 'Order',
    shopIntro: 'A customer ordered through AfroKauf. Please confirm the order with the customer by WhatsApp or phone, and get it ready for pick-up. The customer pays in your shop.',
    custIntro: 'thank you for your order request. {{shop}} confirms it soon by phone or WhatsApp. You pay when you pick it up.',
    subjShop: 'New order {{ref}}: {{total}}', subjCust: 'Your order request at {{shop}} ({{ref}})',
    why: 'You get this email because you sent an order on our website.', whyShop: 'You get this email because your shop is listed on AfroKauf.',
    note2: 'Prices incl. VAT. Pay and pick up in the shop.', hello: 'Hello' },
  Deutsch: { newOrder: 'Neue Bestellung', customer: 'Kunde', phone: 'Telefon', pickup: 'Abholung', note: 'Hinweis', total: 'Summe', product: 'Produkt',
    qty: 'Menge', price: 'Preis', reply: 'Auf WhatsApp antworten', call: 'Kunden anrufen', sent: 'Bestellanfrage gesendet', order: 'Bestellung',
    shopIntro: 'Ein Kunde hat über AfroKauf bestellt. Bitte bestätigen Sie die Bestellung per WhatsApp oder Telefon und legen Sie die Ware zur Abholung bereit. Der Kunde bezahlt bei Ihnen im Geschäft.',
    custIntro: 'vielen Dank für Ihre Bestellanfrage. {{shop}} bestätigt sie bald per Telefon oder WhatsApp. Sie bezahlen bei der Abholung.',
    subjShop: 'Neue Bestellung {{ref}}: {{total}}', subjCust: 'Ihre Bestellanfrage bei {{shop}} ({{ref}})',
    why: 'Sie erhalten diese E-Mail, weil Sie auf unserer Website bestellt haben.', whyShop: 'Sie erhalten diese E-Mail, weil Ihr Geschäft bei AfroKauf eingetragen ist.',
    note2: 'Preise inkl. MwSt. Bezahlung und Abholung im Geschäft.', hello: 'Hallo' },
  'Français': { newOrder: 'Nouvelle commande', customer: 'Client', phone: 'Téléphone', pickup: 'Retrait', note: 'Remarque', total: 'Total', product: 'Produit',
    qty: 'Qté', price: 'Prix', reply: 'Répondre sur WhatsApp', call: 'Appeler le client', sent: 'Demande de commande envoyée', order: 'Commande',
    shopIntro: 'Un client a commandé via AfroKauf. Merci de confirmer la commande par WhatsApp ou téléphone et de la préparer pour le retrait. Le client paie dans votre boutique.',
    custIntro: 'merci pour votre demande de commande. {{shop}} la confirme bientôt par téléphone ou WhatsApp. Vous payez au retrait.',
    subjShop: 'Nouvelle commande {{ref}} : {{total}}', subjCust: 'Votre demande de commande chez {{shop}} ({{ref}})',
    why: 'Vous recevez cet e-mail parce que vous avez commandé sur notre site.', whyShop: 'Vous recevez cet e-mail parce que votre boutique est inscrite sur AfroKauf.',
    note2: 'Prix TTC. Paiement et retrait en boutique.', hello: 'Bonjour' }
};
function langFromCode_(code) { return /^de/i.test(code || '') ? 'Deutsch' : /^fr/i.test(code || '') ? 'Français' : lang_(code); }
function euro_(n) { return (Math.round(n * 100) / 100).toFixed(2).replace('.', ',') + ' €'; }
function num_(v) {
  if (v === undefined || v === null || v === '') return NaN;
  var s = String(v).replace(/[^\d.,-]/g, '');
  if (s.indexOf(',') > -1 && s.indexOf('.') > -1) s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  else s = s.replace(',', '.');
  return parseFloat(s);
}
function decode_(s) { return String(s || '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'); }
function attrOf_(tag, name) { var m = new RegExp('data-' + name + '\\s*=\\s*"([^"]*)"', 'i').exec(tag) || new RegExp('data-' + name + "\\s*=\\s*'([^']*)'", 'i').exec(tag); return m ? decode_(m[1]).trim() : ''; }
// Reads one product from the blog's public feed (Settings › Website). Cached 10 minutes.
function productFromFeed_(cfg, id) {
  if (!/^\d{5,25}$/.test(String(id || ''))) return null;
  var cache = CacheService.getScriptCache(), hit = cache.get('p' + id);
  if (hit) return JSON.parse(hit);
  var site = String(cfg['Website'] || '').replace(/\/$/, '');
  var res = UrlFetchApp.fetch(site + '/feeds/posts/default/' + id + '?alt=json', { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return null;
  var entry = JSON.parse(res.getContentText()).entry;
  var html = (entry.content && entry.content.$t) || '';
  var tag = /<[a-z]+\b[^>]*class=["'][^"']*\bproduct-info\b[^"']*["'][^>]*>/i.exec(html);
  if (!tag) return null;
  var link = (entry.link || []).filter(function (l) { return l.rel === 'alternate'; })[0];
  var p = { title: entry.title.$t, url: link ? link.href : '', price: num_(attrOf_(tag[0], 'price')), unit: attrOf_(tag[0], 'unit'),
    shop: attrOf_(tag[0], 'shop'), shopPage: attrOf_(tag[0], 'shop-page'), whatsapp: attrOf_(tag[0], 'whatsapp'),
    inStock: !/^(no|0|sold ?out|nein|ausverkauft)$/i.test(attrOf_(tag[0], 'stock')), payLink: attrOf_(tag[0], 'pay-link') };
  if (!(p.price >= 0)) return null;
  cache.put('p' + id, JSON.stringify(p), 600);
  return p;
}
function shopRow_(shopName, shopPage) {
  var s = rowObjects_(sheet_(SHEET)), n = String(shopName || '').trim().toLowerCase(), page = String(shopPage || '').trim();
  var hit = null;
  s.rows.forEach(function (x) {
    if (['Live', 'Update done'].indexOf(String(x.get('Status'))) < 0) return;
    if ((page && String(x.get('Shop page link')).trim() === page) || String(x.get('Shop name')).trim().toLowerCase() === n) hit = x;
  });
  return hit;
}
function handleOrder_(d) {
  if (d.company2) return { ok: true, ref: 'OR-0', total: 0 };
  if (!clean_(d.name)) return { ok: false, error: 'Name is missing.' };
  if (clean_(d.phone).replace(/\D/g, '').length < 6) return { ok: false, error: 'Phone number is missing.' };
  if (clean_(d.email) && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean_(d.email))) return { ok: false, error: 'Email address is not valid.' };
  if (d.consent !== true) return { ok: false, error: 'Please agree to the privacy note.' };
  if (!Array.isArray(d.items) || !d.items.length || d.items.length > 50) return { ok: false, error: 'The order is empty.' };
  if (!underLimit_()) return { ok: false, error: 'Too many orders right now. Please try again later or use WhatsApp.' };
  var cfg = config_(), lines = [], total = 0, changed = false, shop = null;
  for (var i = 0; i < d.items.length; i++) {
    var it = d.items[i], p = productFromFeed_(cfg, it.id);
    if (!p || p.payLink) return { ok: false, error: '"' + clean_(it.title, 80) + '" is no longer available.' };
    if (!p.inStock) return { ok: false, error: '"' + p.title + '" is sold out.' };
    if (shop === null) shop = { name: p.shop, page: p.shopPage, whatsapp: p.whatsapp };
    else if (String(p.shop).toLowerCase() !== String(shop.name).toLowerCase()) return { ok: false, error: 'One order can only contain products from one shop.' };
    var qty = Math.max(1, Math.min(99, parseInt(it.qty, 10) || 1));
    if (Math.abs(num_(it.price) - p.price) > 0.005) changed = true;
    total += p.price * qty;
    lines.push({ title: p.title, unit: p.unit, qty: qty, price: p.price, url: p.url });
  }
  total = Math.round(total * 100) / 100;
  var sr = shopRow_(shop.name, shop.page);
  var shopEmail = sr ? String(sr.get('Email') || '').trim() : '';
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  var ref;
  try {
    var o = ensureSheet_(ORDERS, ORDER_COLS);
    ref = uniqueId_('OR-' + initials_(shop.name), existingIds_(o.sh, 'Order ID'));
    var vals = { 'Order ID': ref, 'Received': new Date(), 'Status': 'New', 'Shop': shop.name, 'Shop email': shopEmail || '(none: forward on WhatsApp)',
      'Customer': clean_(d.name, 80), 'Phone': clean_(d.phone, 30), 'Email': clean_(d.email, 120), 'Pick-up': clean_(d.pickup, 120), 'Note': clean_(d.note, 500),
      'Items': lines.map(function (l) { return l.qty + ' × ' + l.title + ' à ' + euro_(l.price); }).join('\n'), 'Total': total,
      'Price check': changed ? 'Prices updated from the shop page' : 'OK', 'Language': langFromCode_(d.language), 'Page': clean_(d.page_url, 200) };
    var row = new Array(o.sh.getLastColumn());
    for (var k = 0; k < row.length; k++) row[k] = '';
    Object.keys(vals).forEach(function (h) { if (o.map[h]) row[o.map[h] - 1] = safeCell_(vals[h]); });
    o.sh.appendRow(row);
  } finally {
    lock.releaseLock();
  }
  try { orderEmails_(cfg, ref, d, lines, total, shop, sr, shopEmail); } catch (e) { console.error('order mail failed', e); }
  return { ok: true, ref: ref, total: total, changed: changed };
}
function itemsTable_(b, lines, OW, total) {
  var th = function (align) { return 'style="' + F_ + 'text-align:' + align + ';padding:8px 10px;background:#FBF6EE;color:' + b.primary + ';font-size:11px;text-transform:uppercase;letter-spacing:.04em;"'; };
  var td = function (s, x) { return '<td style="' + F_ + 'padding:9px 10px;border-bottom:1px solid #ECECEE;font-size:14px;color:#222;' + (x || '') + '">' + s + '</td>'; };
  return '<table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 6px;"><tr><th ' + th('left') + '>' + esc_(OW.product) + '</th><th ' + th('center') +
    '>' + esc_(OW.qty) + '</th><th ' + th('right') + '>' + esc_(OW.price) + '</th></tr>' +
    lines.map(function (l) {
      return '<tr>' + td('<strong>' + esc_(l.title) + '</strong>' + (l.unit ? '<br><span style="color:#9A9AA2;font-size:12px;">' + esc_(l.unit) + '</span>' : '')) +
        td(String(l.qty), 'text-align:center;') + td(euro_(l.price * l.qty), 'text-align:right;white-space:nowrap;') + '</tr>';
    }).join('') +
    '<tr>' + td('<strong>' + esc_(OW.total) + '</strong>', 'border-bottom:0;') + td('', 'border-bottom:0;') + td('<strong>' + euro_(total) + '</strong>', 'text-align:right;border-bottom:0;font-size:16px;') + '</tr></table>' +
    '<p style="' + F_ + 'font-size:12px;color:#9A9AA2;margin:0 0 18px;">' + esc_(OW.note2) + '</p>';
}
function orderEmails_(cfg, ref, d, lines, total, shop, sr, shopEmail) {
  var copy = cfgYes_(cfg, 'Send me a copy of every order?') ? notifyTo_(cfg) : '';
  // to the shop (in the shop's language)
  var sLang = sr ? lang_(sr.get('Language')) : 'English';
  var b = brand_(cfg, sLang), OW = ORDER_WORDS[sLang];
  var wa = waNumber_(d.phone);
  var custRows = [[OW.customer, clean_(d.name)], [OW.phone, '<a href="tel:' + esc_(clean_(d.phone).replace(/[^\d+]/g, '')) + '" style="color:' + b.primary + ';">' + esc_(clean_(d.phone)) + '</a>', true],
    ['Email', clean_(d.email)], [OW.pickup, clean_(d.pickup)], [OW.note, clean_(d.note)], [OW.order, ref]];
  var shopBody = '<p style="' + F_ + 'font-size:15px;color:#222222;line-height:1.7;margin:0 0 16px;">' + esc_(OW.shopIntro) + '</p>' +
    itemsTable_(b, lines, OW, total) + detailsTable_(b, custRows) +
    (wa ? button_(b, OW.reply, 'https://wa.me/' + wa + '?text=' + encodeURIComponent(OW.hello + ' ' + clean_(d.name) + ', ' + shop.name + ' – ' + OW.order + ' ' + ref)) : '');
  var subject = OW.subjShop.replace('{{ref}}', ref).replace('{{total}}', euro_(total));
  var plain = lines.map(function (l) { return l.qty + ' x ' + l.title + ' = ' + euro_(l.price * l.qty); }).join('\n') + '\n' + OW.total + ': ' + euro_(total) +
    '\n\n' + OW.customer + ': ' + clean_(d.name) + ' · ' + clean_(d.phone) + (d.pickup ? '\n' + OW.pickup + ': ' + clean_(d.pickup) : '') + (d.note ? '\n' + OW.note + ': ' + clean_(d.note) : '');
  var html = wrapEmail_(b, { lang: sLang, banner: ['ok', shop.name, OW.newOrder], body: shopBody, ref: ref, why: OW.whyShop, preheader: subject });
  if (shopEmail) {
    var o = mailOptions_(b, html, { to: shopEmail, subject: subject, body: plain });
    if (copy && copy !== shopEmail) o.bcc = copy;
    MailApp.sendEmail(o);
  } else if (copy) {
    var waShop = waNumber_(shop.whatsapp);
    var note = '<p style="' + F_ + 'font-size:14px;background:#FFF3CD;color:#7A5800;padding:10px 12px;border-radius:6px;margin:0 0 16px;">This shop has no email in the sheet. ' +
      (waShop ? 'Forward the order on WhatsApp: <a href="https://wa.me/' + waShop + '?text=' + encodeURIComponent(plain) + '">open WhatsApp</a>' : 'Call the shop.') + '</p>';
    MailApp.sendEmail(mailOptions_(b, html.replace('<div class="ak-body" style="padding:28px 32px;">', '<div class="ak-body" style="padding:28px 32px;">' + note),
      { to: copy, subject: '[No shop email] ' + subject, body: plain }));
  }
  // to the customer (optional email)
  if (/@/.test(clean_(d.email))) {
    var cLang = langFromCode_(d.language), cb = brand_(cfg, cLang), CW = ORDER_WORDS[cLang];
    var first = clean_(d.name).split(/\s+/)[0];
    var cBody = '<p style="' + F_ + 'font-size:15px;color:#222222;line-height:1.7;margin:0 0 14px;">' + esc_(CW.hello + ' ' + first + ',') + '</p>' +
      '<p style="' + F_ + 'font-size:15px;color:#222222;line-height:1.7;margin:0 0 18px;">' + esc_(CW.custIntro.replace('{{shop}}', shop.name)) + '</p>' +
      itemsTable_(cb, lines, CW, total) + detailsTable_(cb, [[CW.order, ref], [CW.pickup, clean_(d.pickup)], ['', '']]) +
      (shop.page ? button_(cb, shop.name, shop.page) : '');
    var cSubj = CW.subjCust.replace('{{shop}}', shop.name).replace('{{ref}}', ref);
    MailApp.sendEmail(mailOptions_(cb, wrapEmail_(cb, { lang: cLang, banner: ['info', shop.name, CW.sent], body: cBody, ref: ref, why: CW.why, preheader: cSubj }),
      { to: clean_(d.email), subject: cSubj, body: CW.hello + ' ' + first + ',\n\n' + CW.custIntro.replace('{{shop}}', shop.name) + '\n\n' + plain }));
  }
}

// ================================================================== CUSTOMER NEWSLETTER (footer form, double opt-in)
function handleSubscribe_(d) {
  if (d.company2) return { ok: true };
  var mail = clean_(d.email, 120).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) return { ok: false, error: 'Email address is not valid.' };
  if (!underLimit_()) return { ok: false, error: 'Please try again later.' };
  var cfg = config_(), lang = lang_(d.language);
  var s = ensureSheet_(SUBS, SUB_COLS);
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  var ref, existing = null;
  try {
    rowObjects_(s.sh).rows.forEach(function (x) { if (String(x.get('Email')).toLowerCase() === mail) existing = x; });
    if (existing && /^Confirmed/.test(String(existing.get('Newsletter')))) return { ok: true };   // already in: say nothing more
    if (existing) {
      ref = String(existing.get('Reference'));
      s.sh.getRange(existing.r, s.map['Newsletter']).setValue('Waiting for confirmation');
    } else {
      ref = uniqueId_('SUB-' + initials_(mail.split('@')[0].replace(/[._-]+/g, ' ')), existingIds_(s.sh, 'Reference'));
      var now = new Date();
      var vals = { 'Reference': ref, 'Received': now, 'Email': mail, 'Language': lang, 'Newsletter': 'Waiting for confirmation',
        'Newsletter consent': 'Box ticked in the website footer ' + stamp_(now, 'dd.MM.yyyy HH:mm'), 'Source page': clean_(d.page_url, 200) };
      var row = new Array(s.sh.getLastColumn());
      for (var i = 0; i < row.length; i++) row[i] = '';
      Object.keys(vals).forEach(function (h) { if (s.map[h]) row[s.map[h] - 1] = safeCell_(vals[h]); });
      s.sh.appendRow(row);
    }
  } finally {
    lock.releaseLock();
  }
  var nl = link_(cfg, 'nl', ref, lang);
  if (!nl) return { ok: false, error: 'Newsletter sign-up is not set up yet.' };
  var b = brand_(cfg, lang), W = b.words;
  var body = '<p style="' + F_ + 'font-size:15px;color:#222222;line-height:1.7;margin:0 0 6px;">' + esc_(W.helloAll + ',') + '</p>' +
    '<p style="' + F_ + 'font-size:15px;color:#222222;line-height:1.7;margin:0 0 6px;">' + esc_(W.nlAsk.replace(/ für Geschäftsinhaber| for shop owners| pour les commerçants/, '')) + '</p>' + button_(b, W.nlBtn, nl);
  MailApp.sendEmail(mailOptions_(b, wrapEmail_(b, { lang: lang, banner: ['info', b.name, W.newsletter], body: body, ref: ref, why: W.whyTx }),
    { to: mail, subject: b.name + ': ' + W.nlBtn, body: W.nlAsk + '\n' + nl }));
  return { ok: true };
}

// ================================================================== PRODUCTS FROM SHOPS ("Add products" page)
// A listed shop sends products with its reference (AK-…) and its email. You check them and publish them as posts.
function handleProducts_(d) {
  if (d.company2) return { ok: true, count: 0 };
  if (!underLimit_()) return { ok: false, error: 'Please try again later.' };
  var ref = clean_(d.ref, 60), mail = clean_(d.email, 120).toLowerCase();
  var s = rowObjects_(sheet_(SHEET)), shop = null;
  s.rows.forEach(function (x) { if (String(x.get('Reference')).trim().toUpperCase() === ref.toUpperCase() && String(x.get('Email')).trim().toLowerCase() === mail) shop = x; });
  if (!shop) return { ok: false, error: 'We could not find a shop with this reference and email. Use the reference from your sign-up email.' };
  if (['Live', 'Update done'].indexOf(String(shop.get('Status'))) < 0) return { ok: false, error: 'Your shop page is not live yet. You can add products once it is online.' };
  var list = (Array.isArray(d.products) ? d.products : []).slice(0, 10).filter(function (p) { return clean_(p.name) && num_(p.price) > 0; });
  if (!list.length) return { ok: false, error: 'Please add at least one product with a name and a price.' };
  if (d.confirm !== true) return { ok: false, error: 'Please confirm the two boxes.' };
  var cfg = config_(), pr = ensureSheet_(PRODUCTS, PRODUCT_COLS);
  var shopName = String(shop.get('Shop name')), page = String(shop.get('Shop page link') || ''), city = cityLabel_(shop.get('City'));
  var whats = String(shop.get('WhatsApp') || shop.get('Phone') || '').replace(/^'/, '');
  var lock = LockService.getScriptLock();
  lock.waitLock(25000);
  var ids = [];
  try {
    var existing = existingIds_(pr.sh, 'Product ID');
    list.forEach(function (p) {
      var id = uniqueId_('PR-' + initials_(shopName), existing);
      var photo = '';
      if (p.photo && p.photo.data) {
        var bytes = Utilities.base64Decode(String(p.photo.data));
        if (bytes.length <= 4 * 1024 * 1024) photo = photoFolder_().createFile(Utilities.newBlob(bytes, 'image/jpeg', id + '.jpg')).getUrl();
      }
      var price = num_(p.price), old = num_(p.old_price), cat = CATEGORY_LABELS.indexOf(clean_(p.category)) > -1 ? clean_(p.category) : '';
      var until = /^\d{4}-\d{2}-\d{2}$/.test(clean_(p.until)) ? clean_(p.until) : '';
      var a = { price: price.toFixed(2), unit: clean_(p.unit, 40), shop: shopName, 'shop-page': page, whatsapp: whats, city: city };
      if (old > price) a['old-price'] = old.toFixed(2);
      if (until && old > price) a.until = until;
      var code = '<div class="product-info"\n' + Object.keys(a).map(function (k) { return '  data-' + k + '="' + attr_(a[k]) + '"'; }).join('\n') + '>\n' +
        text_(euro_(price) + (a.unit ? ' · ' + a.unit : '') + ' · ' + shopName) + '\n</div>\n' +
        (clean_(p.description, 600) ? '\n<p>' + text_(clean_(p.description, 600)) + '</p>\n' : '') +
        '\n<!-- Photo: add it below this line with the picture button. -->';
      var vals = { 'Product ID': id, 'Received': new Date(), 'Status': 'New', 'Shop reference': ref, 'Shop name': shopName, 'Product': clean_(p.name, 120),
        'Price': price, 'Old price': old > price ? old : '', 'Unit': clean_(p.unit, 40), 'Category': cat, 'Offer until': until,
        'Description': clean_(p.description, 600), 'Photo': photo, 'Post title': clean_(p.name, 120),
        'Post labels': ['Product', cat, city].filter(String).join(', '), 'Post code (paste in HTML view)': code };
      var row = new Array(pr.sh.getLastColumn());
      for (var i = 0; i < row.length; i++) row[i] = '';
      Object.keys(vals).forEach(function (h) { if (pr.map[h]) row[pr.map[h] - 1] = safeCell_(vals[h]); });
      pr.sh.appendRow(row);
      ids.push(id);
    });
  } finally {
    lock.releaseLock();
  }
  try {
    var b = brand_(cfg, 'English');
    var html = wrapEmail_(b, { lang: 'English', banner: ['info', 'Products', list.length + ' new product' + (list.length === 1 ? '' : 's')], ref: ref,
      body: '<p style="' + F_ + 'font-size:15px;color:#222;line-height:1.7;">' + esc_(shopName) + ' sent products. Check them on the Products tab, then publish them as posts.</p>' +
        detailsTable_(b, list.map(function (p, i) { return [ids[i], clean_(p.name) + ' · ' + euro_(num_(p.price)) + (p.unit ? ' · ' + clean_(p.unit) : '')]; })) +
        button_(b, 'Open the sheet', SpreadsheetApp.getActive().getUrl()) });
    send_(notifyTo_(cfg), 'AfroKauf: ' + list.length + ' new product(s) from ' + shopName, ids.join(', '), b, html);
  } catch (e) { console.error(e); }
  return { ok: true, count: list.length };
}
function showProductCode() {
  run_(function () {
    var sh = SpreadsheetApp.getActive().getActiveSheet();
    if (sh.getName() !== PRODUCTS) throw new Error('Open the "' + PRODUCTS + '" tab and click a product row first.');
    var r = sh.getActiveRange().getRow();
    if (r < 2) throw new Error('Click a product row first (not the header).');
    var map = headerMap_(sh), v = sh.getRange(r, 1, 1, sh.getLastColumn()).getValues()[0];
    var g = function (n) { return map[n] ? v[map[n] - 1] : ''; };
    var html = '<style>body{font:14px system-ui,sans-serif}textarea{width:100%;font:12px monospace}b{display:block;margin:12px 0 4px}</style>' +
      '<b>1. Title</b><textarea rows="1" onclick="this.select()">' + text_(g('Post title')) + '</textarea>' +
      '<b>2. Labels</b><textarea rows="1" onclick="this.select()">' + text_(g('Post labels')) + '</textarea>' +
      '<b>3. Post code: paste in HTML view</b><textarea rows="14" onclick="this.select()">' + text_(g('Post code (paste in HTML view)')) + '</textarea>' +
      (g('Photo') ? '<b>4. Photo</b><a href="' + attr_(g('Photo')) + '" target="_blank">Open the photo</a>' : '');
    SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(720).setHeight(600), 'Product post: ' + g('Product'));
  });
}
