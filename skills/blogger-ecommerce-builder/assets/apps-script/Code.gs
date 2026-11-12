/**
 * Order inbox for a Blogger shop: Google Apps Script web app + Google Sheet.
 *
 * What it does
 *   - Every order lands in the "Orders" tab (one row per order) and "Order lines" (one row per product),
 *     whichever way the buyer ordered: the shop's own Place order button, WhatsApp, Telegram, email or PayPal.
 *   - Direct orders: branded HTML emails to you and to the buyer.
 *   - Optional: an instant Telegram message to you for every order (see TELEGRAM_* below).
 *   - Digital products: put each product's download link in the "Downloads" tab once. When you set an order's
 *     Status to "Paid", the buyer gets the download links by email (or use the menu Shop -> Send download links).
 *   - Request forms (fulfilment quotes, Kenya shipments …) land in "Requests" and are emailed to you.
 *   - Newsletter sign-ups land in "Newsletter" with double opt-in: the subscriber confirms by email.
 *   - Delivery partners: the buyer's choice (DHL, pickup …) and the parcel weight are checked against the blog's
 *     "Delivery options" gadget, so the shipping fee can't be changed in the browser either.
 *   - The browser's prices are never trusted: every price is re-read from the public Blogger feed of that post,
 *     and shipping, bank details and shop name are read from the blog's own "Shop settings" gadget.
 *   - "Settings" tab in the sheet: your blog address, email, Telegram, report times. It survives script updates.
 *   - "Recipients" tab: who gets order alerts, request alerts, the daily and the weekly report.
 *   - Test mode: fill in "Test mode: send every email to" in Settings and every email goes there instead.
 *   - Returning customers are marked in the Orders tab (same email or phone as an earlier order).
 *   - Menu Shop -> Send payment reminder: a friendly reminder with the bank details for an unpaid order.
 *   - Daily report (yesterday's orders, unpaid orders, new requests, sign-ups, unanswered chat questions) and
 *     weekly report (revenue, top products, countries, methods). Times in Settings; setup makes the triggers.
 *
 * Setup (5 minutes) — full steps with pictures-free wording in the theme's GUIDE.md
 *   1. sheets.new -> Extensions -> Apps Script -> paste this file -> Save.
 *   2. Run "setup" once (Run button) and allow the permissions. It creates the tabs (including Settings and
 *      Recipients), the triggers, and sends you a test email. Then fill in the Settings tab: at least the blog
 *      address. (Run setup again after updating this file or changing the report times.)
 *   3. Deploy -> New deployment -> type "Web app" -> Execute as: Me, Who has access: Anyone -> Deploy.
 *   4. Copy the /exec URL into the blog: Layout -> Shop settings ->  google_sheet: https://script.google.com/macros/s/.../exec
 *   After ANY code change: Deploy -> Manage deployments -> Edit (pencil) -> Version: New version -> Deploy.
 */
// Defaults. The "Settings" tab in the sheet wins over these, so you never have to edit this file again:
// run setup once, then fill in the Settings tab. (Values typed here are copied into the tab the first time.)
var SETTINGS = {
  BLOG_URL: 'https://YOURBLOG.blogspot.com', // the shop's address
  OWNER_EMAIL: '',                          // where new orders are sent (blank = the Google account running this)
  EMAIL_BUYER: true,                        // send the buyer a confirmation for direct orders
  EMAIL_OWNER_FOR_CHAT_ORDERS: false,       // also email you WhatsApp/Telegram/email/PayPal orders (they reach you in the chat anyway)
  TELEGRAM_BOT_TOKEN: '',                   // optional: from @BotFather, e.g. 123456:ABC-DEF...
  TELEGRAM_CHAT_ID: '',                     // optional: run "telegramFindChatId" after messaging your bot
  TEST_EMAIL: '',                           // test mode: while filled in, EVERY email goes to this address instead
  REPORT_DAILY: '07:00',                    // daily report time ('off' = none)
  REPORT_WEEKLY_DAY: 'Monday',              // weekly report day ('off' = none)
  REPORT_WEEKLY: '08:00',                   // weekly report time
  TIMEZONE: '',                             // blank = the script's time zone (File > Project settings)
  REMINDER_DAYS: 3,                         // unpaid orders older than this are listed in the daily report
  // Used only if the blog's Shop settings can't be read:
  SHOP_NAME: 'My Shop',
  CURRENCY: 'EUR',
  COLOR_DARK: '#111111',
  COLOR_ACCENT: '#FF3300'
};
// The Settings tab: [key, label shown in the tab, explanation]. Values are read by label, so the order can change.
var SETTING_ROWS = [
  ['BLOG_URL', 'Blog address', 'Your shop, e.g. https://yourshop.blogspot.com (needed)'],
  ['OWNER_EMAIL', 'Owner email', 'Your address. Blank = the Google account that runs this script. See the Recipients tab for more people'],
  ['EMAIL_BUYER', 'Email the buyer', 'yes / no: buyers get a confirmation email for website orders'],
  ['EMAIL_OWNER_FOR_CHAT_ORDERS', 'Email me for chat orders', 'yes / no: also email WhatsApp, Telegram, email and PayPal orders (they reach you in the chat anyway)'],
  ['TELEGRAM_BOT_TOKEN', 'Telegram bot token', 'Optional. From @BotFather, e.g. 123456:ABC-DEF…'],
  ['TELEGRAM_CHAT_ID', 'Telegram chat id', 'Optional. Message your bot, then run telegramFindChatId in the script editor'],
  ['TEST_EMAIL', 'Test mode: send every email to', 'While this has an address, EVERY email (buyers, alerts, reports) goes there instead; the real recipient is shown in the subject. Clear it to go live'],
  ['REPORT_DAILY', 'Daily report time', 'e.g. 07:00 (whole hours are used); write off for no daily report. Run setup after changing'],
  ['REPORT_WEEKLY_DAY', 'Weekly report day', 'Monday … Sunday; write off for no weekly report. Run setup after changing'],
  ['REPORT_WEEKLY', 'Weekly report time', 'e.g. 08:00 (whole hours are used)'],
  ['TIMEZONE', 'Time zone', 'e.g. Europe/Berlin or Africa/Nairobi. Blank = the script\'s time zone'],
  ['REMINDER_DAYS', 'Payment reminder after (days)', 'Unpaid bank-transfer / PayPal orders older than this are listed in the daily report. Send the reminder from the Shop menu'],
  ['SHOP_NAME', 'Shop name (fallback)', 'Only used if the blog\'s Shop settings can\'t be read'],
  ['CURRENCY', 'Currency (fallback)', 'Only used if the blog\'s Shop settings can\'t be read'],
  ['COLOR_DARK', 'Email colour: dark', 'Hex colour for email headers, e.g. #111111'],
  ['COLOR_ACCENT', 'Email colour: accent', 'Hex colour for buttons and highlights, e.g. #FF3300']
];
var SETTINGS_HEADERS = ['Setting', 'Value', 'What it does'];
var RECIPIENT_HEADERS = ['Email', 'Name', 'Active (yes/no)', 'New orders (yes/no)', 'New requests (yes/no)', 'Daily report (yes/no)', 'Weekly report (yes/no)'];
var ORDER_STATUSES = ['New', 'Paid', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];

// New columns are only ever added at the end, so an existing sheet is extended instead of replaced.
var ORDER_HEADERS = ['Order ID', 'Received', 'Status', 'Method', 'Payment', 'Name', 'Phone', 'Email', 'Street', 'Postcode', 'City',
                     'Country', 'Note', 'Items', 'Subtotal', 'Shipping', 'Total', 'Currency', 'Language', 'Page',
                     'Delivery', 'Delivery time', 'Weight (kg)', 'Downloads sent', 'Customer', 'Reminder sent'];
var LINE_HEADERS = ['Order ID', 'Received', 'Product', 'Options', 'Qty', 'Price', 'Line total', 'Post ID', 'Link', 'Type'];
var DOWNLOAD_HEADERS = ['Product', 'Post ID', 'Download link', 'Message to the buyer (optional)'];
var PAID = /^(paid|bezahlt|payé|paye|pagado)$/i;
var REQUEST_HEADERS = ['Received', 'Type', 'Name', 'Email', 'Phone', 'Company', 'Details', 'Status', 'Language', 'Page'];
var NEWS_HEADERS = ['Received', 'Email', 'Status', 'Confirmed', 'Language', 'Page', 'Token'];
var QUESTION_HEADERS = ['Received', 'Question', 'Language', 'Page', 'Added to the assistant?'];
var LEAD_NAMES = { quote: 'Fulfilment quote', kenya: 'Kenya shipment', newsletter: 'Newsletter', request: 'Request' };
var METHOD_NAMES = { order: 'Website', whatsapp: 'WhatsApp', telegram: 'Telegram', email: 'Email', paypal: 'PayPal' };

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var order = JSON.parse(e.postData.contents);
    if (order.type === 'lead') return lead_(order);
    var method = METHOD_NAMES[order.method] ? order.method : 'order';
    var c = order.customer || {};
    if (!c.name || !c.phone) return reply_({ ok: false, error: 'missing customer details' });
    if (!order.items || !order.items.length || order.items.length > 50) return reply_({ ok: false, error: 'empty cart' });

    var shop = shopSettings_();
    var lines = order.items.map(function (item) {
      var product = productById_(String(item.id));
      if (!product) throw new Error('Product not found: ' + item.title);
      if (!isNaN(product.stock) && product.stock <= 0) throw new Error('Out of stock: ' + product.title);
      var qty = Math.max(1, Math.min(99, parseInt(item.qty, 10) || 1));
      return { id: String(item.id), title: product.title, chosen: (item.chosen || []).map(String).slice(0, 6),
               qty: qty, price: product.price, total: product.price * qty, url: product.url,
               digital: !!product.digital, weight: product.weight || 0 };
    });
    var physical = lines.some(function (l) { return !l.digital; });
    var digital = lines.some(function (l) { return l.digital; });
    if (physical && !(c.street || c.address)) return reply_({ ok: false, error: 'missing delivery address' });
    if (digital && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email || '')) return reply_({ ok: false, error: 'email needed for the download link' });
    var sub = lines.reduce(function (s, l) { return s + l.total; }, 0);
    var weight = lines.reduce(function (s, l) { return s + (l.digital ? 0 : l.weight * l.qty); }, 0);
    var fee = 0, option = null;
    if (physical && shop.delivery.length) {
      var opts = deliveriesFor_(shop, c.country, weight);
      // The buyer's choice, checked for this weight; the first option that fits otherwise.
      // A country written differently on the blog (e.g. "Deutschland") falls back to the chosen option's name.
      var want = String(c.country || '').toLowerCase();
      var known = shop.delivery.some(function (d) { return d.countries.some(function (n) { return n.toLowerCase() === want; }); });
      option = opts.filter(function (d) { return d.name === c.delivery; })[0] ||
        (known ? null : shop.delivery.filter(function (d) { return d.name === c.delivery && !isNaN(feeFor_(d, weight)); })[0]) || opts[0];
      if (!option) return reply_({ ok: false, error: 'no delivery option for ' + (c.country || 'this country') + ' at ' + weight + ' kg' });
      fee = feeFor_(option, weight);
    } else if (physical) {
      fee = shippingFor_(shop, c.country);
    }
    var ship = fee && !(shop.freeOver && sub >= shop.freeOver) ? fee : 0;
    sub = Math.round(sub * 100) / 100;
    var total = Math.round((sub + ship) * 100) / 100;
    var now = new Date();
    var status = method === 'order' ? 'New' : 'Sent via ' + METHOD_NAMES[method] + ' – check the chat';
    var summary = lines.map(function (l) {
      return l.qty + ' x ' + l.title + (l.chosen.length ? ' (' + l.chosen.join(', ') + ')' : '') + (l.digital ? ' [digital]' : '') + ' @ ' + l.price.toFixed(2);
    }).join('\n');

    lock.waitLock(20000);
    var book = SpreadsheetApp.getActiveSpreadsheet();
    var orders = sheet_(book, 'Orders', ORDER_HEADERS);
    var id = uniqueId_(orders, order.orderId, now);
    var returning = returning_(orders, c);
    // A leading apostrophe keeps phone numbers and postcodes as text (no lost leading zeros).
    orders.appendRow([id, now, status, METHOD_NAMES[method], text_(c.payment), text_(c.name), "'" + c.phone, text_(c.email),
                      text_(c.street || c.address), "'" + (c.postcode || ''), text_(c.city), text_(c.country), text_(c.note),
                      text_(summary), sub, ship, total, shop.currency, text_(order.lang), text_(order.page),
                      option ? text_(option.name) : '', option ? text_(option.time) : '', physical && weight ? Math.round(weight * 1000) / 1000 : '',
                      digital ? '' : 'n/a', returning.label, '']);
    var linesSheet = sheet_(book, 'Order lines', LINE_HEADERS);
    linesSheet.getRange(linesSheet.getLastRow() + 1, 1, lines.length, LINE_HEADERS.length).setValues(lines.map(function (l) {
      return [id, now, text_(l.title), text_(l.chosen.join(', ')), l.qty, l.price, l.total, "'" + l.id, l.url, l.digital ? 'Digital' : 'Physical'];
    }));
    if (digital) downloadRows_(book, lines);
    lock.releaseLock();

    var o = { id: id, method: method, customer: c, lines: lines, sub: sub, ship: ship, total: total, shop: shop,
              option: option, weight: weight, physical: physical, digital: digital, returning: returning };
    if (method === 'order' || S_('EMAIL_OWNER_FOR_CHAT_ORDERS')) {
      mail_({
        to: recipients_('orders'),
        replyTo: c.email || undefined,
        subject: '🛍️ New order #' + id + ' · ' + money_(total, shop.currency) + ' · ' + c.name + ' (' + METHOD_NAMES[method] + ')',
        body: plainText_(o),
        htmlBody: ownerEmail_(o),
        name: shop.name
      });
    }
    if (method === 'order' && S_('EMAIL_BUYER') && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email || '')) {
      mail_({
        to: c.email,
        subject: shop.name + ': order #' + id + ' received',
        body: plainText_(o),
        htmlBody: buyerEmail_(o),
        name: shop.name
      });
    }
    telegram_(o);
    return reply_({ ok: true, orderId: id, total: total });
  } catch (err) {
    return reply_({ ok: false, error: String(err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

/**
 * Order number from the shop: product initials + date + time to the second (BRA-261104-153012).
 * Anything else gets one made here; a number already in the sheet gets -2, -3 ….
 */
function uniqueId_(orders, wanted, now) {
  var id = /^[A-Z0-9]{1,4}-\d{6}-\d{6}(-\d{1,3})?$/.test(wanted || '') || /^O\d{6}-[A-Z0-9]{4}$/.test(wanted || '') ? wanted
    : 'NS-' + Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyMMdd-HHmmss');
  var used = {};
  if (orders.getLastRow() > 1) {
    orders.getRange(2, 1, orders.getLastRow() - 1, 1).getValues().forEach(function (r) { used[String(r[0])] = true; });
  }
  var base = /^[A-Z0-9]{1,4}-\d{6}-\d{6}-\d+$/.test(id) ? id.replace(/-\d+$/, '') : id;
  for (var n = 2; used[id]; n++) id = base + '-' + n;
  return id;
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.confirm || p.unsubscribe) return newsletterLink_(p.confirm ? 'confirm' : 'unsubscribe', String(p.confirm || p.unsubscribe));
  return reply_({ ok: true, shop: shopSettings_().name });
}

// ---------------------------------------------------------------- requests and newsletter

/** A request form (quote, Kenya shipment …) or a newsletter sign-up from the website. */
function lead_(data) {
  var kind = String(data.kind || 'request').replace(/[^\w-]/g, '').slice(0, 30) || 'request';
  var fields = {}, n = 0;
  Object.keys(data.fields || {}).forEach(function (k) { if (n++ < 25) fields[String(k).slice(0, 60)] = String(data.fields[k] || '').slice(0, 2000); });
  if (kind === 'question') return question_(fields, data);
  if (!data.consent) return reply_({ ok: false, error: 'consent missing' });
  var find = function (re) { var k = Object.keys(fields).filter(function (x) { return re.test(x); })[0]; return k ? fields[k] : ''; };
  var email = find(/e-?mail/i).trim(), phone = find(/phone|telefon|whatsapp|mobil/i), name = find(/^(full )?name$|^name|vorname|nom/i);
  var shop = shopSettings_(), now = new Date();
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var book = SpreadsheetApp.getActiveSpreadsheet();
    if (kind === 'newsletter') {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return reply_({ ok: false, error: 'invalid email' });
      var news = sheet_(book, 'Newsletter', NEWS_HEADERS);
      var rows = news.getLastRow() > 1 ? news.getRange(2, 1, news.getLastRow() - 1, NEWS_HEADERS.length).getValues() : [];
      var known = rows.filter(function (r) { return String(r[1]).toLowerCase() === email.toLowerCase() && r[2] === 'Subscribed'; })[0];
      if (known) return reply_({ ok: true, already: true });
      var token = Utilities.getUuid();
      news.appendRow([now, text_(email), 'Waiting for confirmation', '', text_(data.lang), text_(data.page), token]);
      lock.releaseLock();
      var url = ScriptApp.getService().getUrl();
      var b = { name: shop.name, dark: S_('COLOR_DARK'), accent: S_('COLOR_ACCENT'), site: blog_() };
      var body = '<div class="email-body" style="padding:26px 32px;">' +
        '<p style="font-size:15px;color:#222222;line-height:1.7;margin:0 0 14px;">Hello,</p>' +
        '<p style="font-size:15px;color:#222222;line-height:1.7;margin:0 0 6px;">please confirm that you want to receive news and offers from ' + esc_(shop.name) + ' by email.</p>' +
        button_(url + '?confirm=' + token, 'Yes, subscribe me', b) +
        '<p style="font-size:12px;color:#777777;line-height:1.7;margin:18px 0 0;">If you did not sign up, just ignore this email; you will not hear from us. ' +
        'You can unsubscribe at any time: <a href="' + esc_(url + '?unsubscribe=' + token) + '" style="color:#777777;">unsubscribe</a>.</p></div>';
      mail_({ to: email, subject: shop.name + ': please confirm your subscription', name: shop.name,
        body: 'Please confirm your subscription: ' + url + '?confirm=' + token,
        htmlBody: wrapEmail_(banner_('Newsletter', 'Please confirm', b, true) + body, b) });
      return reply_({ ok: true });
    }
    if (!email && !phone) return reply_({ ok: false, error: 'email or phone needed' });
    var company = find(/company|firma|business|unternehmen|société/i);
    var used = [name, email, phone, company];
    var details = Object.keys(fields).filter(function (k) { return fields[k] && used.indexOf(fields[k]) === -1; })
      .map(function (k) { return k + ': ' + fields[k]; }).join('\n');
    var type = LEAD_NAMES[kind] || kind;
    sheet_(book, 'Requests', REQUEST_HEADERS).appendRow([now, type, text_(name), text_(email), "'" + phone, text_(company),
      text_(details), 'New', text_(data.lang), text_(data.page)]);
    lock.releaseLock();
    var b2 = { name: shop.name, dark: S_('COLOR_DARK'), accent: S_('COLOR_ACCENT'), site: blog_() };
    var pairs = Object.keys(fields).filter(function (k) { return fields[k]; }).map(function (k) { return [k, fields[k]]; });
    var tel = String(phone).replace(/[^\d+]/g, '');
    var reply = /^(\+|00)\d{7,}$/.test(tel) ? button_('https://wa.me/' + tel.replace(/^\+|^00/, ''), 'Reply on WhatsApp', b2)
      : (email ? button_('mailto:' + email + '?subject=' + encodeURIComponent(shop.name + ': ' + type), 'Reply by email', b2) : '');
    mail_({ to: recipients_('requests'), replyTo: email || undefined, name: shop.name,
      subject: '📩 New request: ' + type + ' · ' + (company || name || email || phone),
      body: type + '\n\n' + pairs.map(function (x) { return x[0] + ': ' + x[1]; }).join('\n'),
      htmlBody: wrapEmail_(banner_('New request', type, b2, false) + '<div class="email-body" style="padding:26px 32px;">' +
        detailsTable_(pairs, b2) + reply + '</div>', b2) });
    if (S_('TELEGRAM_BOT_TOKEN') && S_('TELEGRAM_CHAT_ID')) {
      try {
        UrlFetchApp.fetch('https://api.telegram.org/bot' + S_('TELEGRAM_BOT_TOKEN') + '/sendMessage', { method: 'post', muteHttpExceptions: true,
          payload: { chat_id: S_('TELEGRAM_CHAT_ID'), text: '📩 ' + type + '\n' + pairs.map(function (x) { return x[0] + ': ' + x[1]; }).join('\n') } });
      } catch (x) { /* the sheet row and email are what count */ }
    }
    return reply_({ ok: true });
  } catch (err) {
    return reply_({ ok: false, error: String(err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

/** The confirm / unsubscribe links in newsletter emails. */
function newsletterLink_(action, token) {
  var shop = shopSettings_(), ok = false;
  if (/^[\w-]{20,60}$/.test(token)) {
    var news = sheet_(SpreadsheetApp.getActiveSpreadsheet(), 'Newsletter', NEWS_HEADERS);
    if (news.getLastRow() > 1) {
      var rows = news.getRange(2, 1, news.getLastRow() - 1, NEWS_HEADERS.length).getValues();
      for (var i = 0; i < rows.length; i++) {
        if (String(rows[i][6]) !== token) continue;
        news.getRange(i + 2, 3, 1, 2).setValues([[action === 'confirm' ? 'Subscribed' : 'Unsubscribed', new Date()]]);
        ok = true; break;
      }
    }
  }
  var msg = !ok ? 'This link is not valid any more.' : (action === 'confirm' ? 'Thank you! You are now subscribed.' : 'You are unsubscribed. You will not get any more emails.');
  var html = '<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc_(shop.name) + '</title></head>' +
    '<body style="margin:0;font-family:Arial,Helvetica,sans-serif;background:#f4f4f4;"><div style="max-width:520px;margin:60px auto;background:#fff;border-top:6px solid ' +
    S_('COLOR_ACCENT') + ';padding:36px 30px;text-align:center;"><h1 style="margin:0 0 12px;font-size:24px;">' + esc_(shop.name) + '</h1>' +
    '<p style="font-size:16px;color:#333;line-height:1.6;">' + esc_(msg) + '</p><p style="margin-top:26px;"><a href="' + esc_(blog_()) +
    '" style="background:' + S_('COLOR_ACCENT') + ';color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:bold;">Back to the shop</a></p></div></body></html>';
  return HtmlService.createHtmlOutput(html).setTitle(shop.name);
}

/** The blog address from SETTINGS, without a trailing slash. */
function blog_() {
  return String(S_('BLOG_URL') || '').trim().replace(/\/+$/, '');
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Customer text is stored as text: a leading = + - @ would otherwise run as a spreadsheet formula. */
function text_(v) {
  var s = String(v === undefined || v === null ? '' : v).slice(0, 2000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function sheet_(book, name, headers) {
  var sheet = book.getSheetByName(name) || book.insertSheet(name);
  if (sheet.getLastRow() > 0) {
    // A tab made by an older or different script: fix an empty one, move a used one aside as "(old)".
    var first = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0].map(String);
    while (first.length && first[first.length - 1] === '') first.pop();
    if (first.length < headers.length && first.join('|') === headers.slice(0, first.length).join('|')) {
      // An older version of this script: add the new columns at the end and keep every order.
      var extra = headers.slice(first.length);
      sheet.getRange(1, first.length + 1, 1, extra.length).setValues([extra])
        .setFontWeight('bold').setBackground('#111111').setFontColor('#ffffff');
      first = headers.slice();
    }
    if (first.join('|') !== headers.join('|')) {
      if (sheet.getLastRow() === 1) {
        sheet.clear();
      } else {
        sheet.setName(name + ' (old ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm') + ')');
        sheet = book.insertSheet(name);
      }
    }
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#111111').setFontColor('#ffffff');
  }
  return sheet;
}

// ---------------------------------------------------------------- blog data

/** The blog's "Shop settings" gadget, read from the homepage (cached 10 minutes). */
function shopSettings_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('shop-settings-3');
  var raw = hit ? JSON.parse(hit) : null;
  if (!raw) {
    raw = { lines: [], delivery: [], contact: [] };
    try {
      var html = UrlFetchApp.fetch(blog_() + '/', { muteHttpExceptions: true }).getContentText();
      raw.lines = gadget_(html, 'shop-settings');
      raw.delivery = gadget_(html, 'shop-delivery');
      raw.contact = gadget_(html, 'shop-contact');
    } catch (x) { /* fall back to SETTINGS */ }
    cache.put('shop-settings-3', JSON.stringify(raw), 600);
  }
  var s = {}, shipTo = [];
  raw.lines.forEach(function (line) {
    var m = /^\s*([A-Za-z][\w \-]*?)\s*[:=]\s*(.*?)\s*$/.exec(line);
    if (!m) return;
    var key = m[1].toLowerCase().replace(/[\s\-]+/g, '_');
    if (key === 'ship_to') {
      var d = /^([^=(]+?)\s*(?:\(([^)]*)\))?\s*(?:=.*)?$/.exec(m[2]);
      if (d) shipTo.push({ country: d[1].trim(), fee: num_(d[2]) });
    } else {
      s[key] = m[2];
    }
  });
  // WhatsApp/Telegram from the "Talk to us" gadget when Shop settings has none.
  (raw.contact || []).forEach(function (line) {
    var m = /^\s*(whatsapp|telegram)\s*:\s*([^|]+)/i.exec(line);
    if (m && !s[m[1].toLowerCase()]) s[m[1].toLowerCase()] = m[2].trim();
  });
  return {
    name: s.shop_name || S_('SHOP_NAME'),
    currency: (s.currency || S_('CURRENCY')).toUpperCase(),
    shipping: num_(s.shipping) || 0,
    freeOver: num_(s.free_shipping_over) || 0,
    shipTo: shipTo,
    delivery: deliveryOptions_(raw.delivery || []),
    bank: s.bank || '',
    whatsapp: (s.whatsapp || '').replace(/[^\d]/g, ''),
    telegram: (s.telegram || '').replace(/^https?:\/\/(www\.)?t\.me\//i, '').replace(/^@/, ''),
    email: s.email || '',
    paypalMe: /@/.test(s.paypal || '') ? '' : (s.paypal || '').replace(/^https?:\/\/(www\.)?(paypal\.me|paypal\.com\/paypalme)\//i, '').split(/[/?#\s]/)[0],
    labelPrices: /^(yes|true|on|1|ja|oui)$/i.test(s.label_prices || '')
  };
}

/** The text lines of the gadget whose box has this class (e.g. <div class='shop-settings'>…</div>). */
function gadget_(html, cls) {
  var m = new RegExp('class=["\']' + cls + '["\'][^>]*>([\\s\\S]*?)<\\/div>', 'i').exec(html);
  if (!m) return [];
  return m[1].replace(/<br\s*\/?>|<\/p>|<\/div>|<\/li>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"').split(/\r?\n/);
}

/** Same rules as shop.js: "DHL | 4,90 up to 2 kg; 6,99 up to 5 kg | 2–4 working days | /p/delivery.html | Germany, Austria". */
function deliveryOptions_(lines) {
  return lines.map(function (line) {
    var parts = line.split('|').map(function (x) { return x.trim(); });
    if (parts.length < 2 || !parts[0]) return null;
    var tiers = parts[1].split(';').map(function (seg) {
      var m = /^\s*([\d.,]+)\s*(?:€|eur|chf|\$|£)?\s*(?:(?:up to|bis|jusqu'?à|max\.?|<=?)\s*([\d.,]+)\s*kg)?\s*$/i.exec(seg);
      return m ? { fee: num_(m[1]), max: m[2] ? num_(m[2]) : Infinity } : null;
    }).filter(function (x) { return x && !isNaN(x.fee); });
    if (!tiers.length) return null;
    var countries = [];
    parts.slice(3).forEach(function (x) {
      if (x && !/^(https:\/\/|\/)/.test(x)) countries = x.split(',').map(function (c) { return c.trim(); }).filter(Boolean);
    });
    return { name: parts[0], tiers: tiers, time: parts[2] || '', countries: countries };
  }).filter(Boolean);
}

function feeFor_(option, weight) {
  for (var i = 0; i < option.tiers.length; i++) if (weight <= option.tiers[i].max) return option.tiers[i].fee;
  return NaN;
}

function deliveriesFor_(shop, country, weight) {
  return shop.delivery.filter(function (d) {
    var want = String(country || '').toLowerCase();
    return (!d.countries.length || !want || d.countries.some(function (n) { return n.toLowerCase() === want || n.length === 2; })) &&
      !isNaN(feeFor_(d, weight));
  });
}

function shippingFor_(shop, country) {
  var dest = shop.shipTo.filter(function (d) { return d.country === country; })[0];
  return dest && !isNaN(dest.fee) ? dest.fee : shop.shipping;
}

/** Reads the product block (or price labels) from the post's public feed. Cached 10 minutes. */
function productById_(postId) {
  if (!/^\d+$/.test(postId)) return null;
  var cache = CacheService.getScriptCache();
  var hit = cache.get('p' + postId);
  if (hit) { var p = JSON.parse(hit); if (p.price === null) p.price = NaN; if (p.stock === null) p.stock = NaN; return p; }
  var res = UrlFetchApp.fetch(blog_() + '/feeds/posts/default/' + postId + '?alt=json', { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return null;
  var entry = JSON.parse(res.getContentText()).entry;
  var html = (entry.content && entry.content.$t) || '';
  var link = (entry.link || []).filter(function (l) { return l.rel === 'alternate'; })[0];
  var product = { title: entry.title.$t, price: NaN, stock: NaN, url: link ? link.href : '', digital: false, weight: 0 };
  var tag = /<[a-z]+\b[^>]*class=["'][^"']*\bproduct\b[^"']*["'][^>]*>/i.exec(html);
  if (tag) {
    product.price = num_(attr_(tag[0], 'data-price'));
    product.stock = num_(attr_(tag[0], 'data-stock'));
    product.digital = /^(yes|true|1|digital|ja|oui)$/i.test(attr_(tag[0], 'data-digital').trim());
    var w = attr_(tag[0], 'data-weight'), kg = num_(w);
    product.weight = isNaN(kg) || kg < 0 ? 0 : (/\d\s*g\b/i.test(w) && !/kg/i.test(w) ? kg / 1000 : kg);
  }
  if (isNaN(product.price) && shopSettings_().labelPrices) {
    (entry.category || []).forEach(function (cat) {
      var m = /^([_!])(\d[\d.,]*)$/.exec(cat.term);
      if (m && m[1] === '_') product.price = num_(m[2]);
      if (m && m[1] === '!') product.stock = num_(m[2]);
    });
  }
  if (isNaN(product.price)) return null;
  cache.put('p' + postId, JSON.stringify(product), 600);
  return product;
}

function attr_(tag, name) {
  var m = new RegExp(name + '\\s*=\\s*["\']([^"\']*)["\']', 'i').exec(tag);
  return m ? m[1] : '';
}

/** Same number rules as shop.js: "39,90", "1.299,50" and "1,299.50" all work. */
function num_(v) {
  if (v === undefined || v === null || v === '') return NaN;
  var s = String(v).replace(/[^\d.,-]/g, '');
  if (s.indexOf(',') > -1 && s.indexOf('.') > -1) {
    s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else {
    s = s.replace(',', '.');
  }
  return parseFloat(s);
}

function money_(n, currency) {
  var symbols = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF ', XAF: 'FCFA ', NGN: '₦', GHS: 'GH₵', KES: 'KSh ' };
  var value = (Math.round(n * 100) / 100).toFixed(2);
  if (currency === 'EUR') return value.replace('.', ',') + ' €';
  return (symbols[currency] || currency + ' ') + value;
}

// ---------------------------------------------------------------- messages

function esc_(v) {
  return String(v === undefined || v === null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function plainText_(o) {
  var c = o.customer, cur = o.shop.currency;
  var out = ['Order #' + o.id + ' (' + METHOD_NAMES[o.method] + ')', ''];
  o.lines.forEach(function (l) {
    out.push(l.qty + ' x ' + l.title + (l.chosen.length ? ' (' + l.chosen.join(', ') + ')' : '') + ' = ' + money_(l.total, cur));
  });
  out.push('', 'Subtotal: ' + money_(o.sub, cur), 'Shipping' + (o.option ? ' (' + o.option.name + ')' : '') + ': ' + money_(o.ship, cur), 'Total: ' + money_(o.total, cur));
  if (c.payment) out.push('Payment: ' + c.payment);
  if (o.option) out.push('Delivery: ' + o.option.name + (o.option.time ? ' · ' + o.option.time : ''));
  if (o.physical && o.weight) out.push('Parcel weight: ' + (Math.round(o.weight * 1000) / 1000) + ' kg');
  if (o.digital) out.push('Digital products: the download link is emailed after payment.');
  out.push('', c.name, c.phone, c.email || '');
  if (o.physical) out.push(c.street || c.address || '', (c.postcode || '') + ' ' + (c.city || ''), c.country || '');
  if (c.note) out.push('', 'Note: ' + c.note);
  if (o.shop.bank && payBank_(c.payment)) out.push('', 'Bank transfer: ' + o.shop.bank, 'Reference: ' + o.id);
  return out.join('\n');
}

function payBank_(payment) { return !payment || /bank|transfer|überweis|virement/i.test(payment); }
function payPal_(payment) { return /paypal/i.test(payment || ''); }

function brand_(o) {
  return { name: o.shop.name, dark: S_('COLOR_DARK'), accent: S_('COLOR_ACCENT'), site: blog_() };
}

function wrapEmail_(inner, b) {
  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">' +
    '<style>body{margin:0;padding:0;background:#ffffff;-webkit-text-size-adjust:100%;}table{border-collapse:collapse;}' +
    '@media only screen and (max-width:600px){.email-body{padding:20px 16px!important;}}</style></head><body style="margin:0;padding:0;background:#f0f0f0;">' +
    '<div style="width:100%;background:#f0f0f0;padding:16px 0;">' +
    '<div style="max-width:600px;width:100%;margin:0 auto;background:#ffffff;border:1px solid #ECECEE;font-family:Arial,Helvetica,sans-serif;">' +
    '<div style="background:' + b.dark + ';padding:26px 24px;text-align:center;">' +
    '<h1 style="color:#ffffff;margin:0;font-size:24px;line-height:1.3;font-family:Arial,Helvetica,sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;">' +
    esc_(b.name) + '<span style="color:' + b.accent + ';">.</span></h1></div>' +
    '<div style="height:4px;background:' + b.accent + ';"></div>' +
    inner +
    '<div style="background:#F7F7F9;padding:22px 20px;text-align:center;border-top:1px solid #ECECEE;">' +
    '<p style="font-size:11px;color:#9A9AA2;margin:0 0 6px;line-height:1.8;"><a href="' + esc_(b.site) + '" style="color:#9A9AA2;text-decoration:none;">' +
    esc_(b.site.replace(/^https?:\/\//, '')) + '</a></p>' +
    '<p style="font-size:11px;color:#9A9AA2;margin:0;">© ' + new Date().getFullYear() + ' ' + esc_(b.name) + '</p></div>' +
    '</div></div></body></html>';
}

function banner_(label, title, b, positive) {
  var bg = positive ? b.accent : b.dark;
  return '<div style="background:' + bg + ';padding:20px 32px;text-align:center;">' +
    '<div style="width:44px;height:44px;border-radius:50%;border:3px solid #ffffff;margin:0 auto 10px;text-align:center;line-height:38px;font-size:24px;font-weight:900;color:#ffffff;">' +
    (positive ? '&#10003;' : '&#9679;') + '</div>' +
    '<p style="font-size:11px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:1.2px;margin:0 0 4px;opacity:0.8;">' + esc_(label) + '</p>' +
    '<p style="font-size:24px;font-weight:700;color:#ffffff;margin:0;">' + esc_(title) + '</p></div>';
}

function section_(title, b) {
  return '<p style="font-size:11px;font-weight:700;color:' + b.dark + ';text-transform:uppercase;letter-spacing:1.2px;margin:26px 0 12px;border-bottom:2px solid ' +
    b.accent + ';padding-bottom:6px;">' + esc_(title) + '</p>';
}

function itemsTable_(o, b) {
  var cur = o.shop.currency;
  var td = 'padding:10px 8px;border-bottom:1px solid #ECECEE;font-size:14px;color:#222222;vertical-align:top;';
  var rows = o.lines.map(function (l) {
    return '<tr><td style="' + td + '"><a href="' + esc_(l.url) + '" style="color:#222222;font-weight:700;text-decoration:none;">' + esc_(l.title) + '</a>' +
      (l.chosen.length ? '<br><span style="font-size:12px;color:#777777;">' + esc_(l.chosen.join(' · ')) + '</span>' : '') +
      (l.digital ? '<br><span style="font-size:12px;color:#2f6f5e;font-weight:700;">Digital download</span>' : '') + '</td>' +
      '<td style="' + td + 'text-align:center;white-space:nowrap;">' + l.qty + ' ×</td>' +
      '<td style="' + td + 'text-align:right;white-space:nowrap;">' + esc_(money_(l.total, cur)) + '</td></tr>';
  }).join('');
  var sum = function (label, value, strong) {
    return '<tr><td colspan="2" style="padding:6px 8px;text-align:right;font-size:' + (strong ? '16px;font-weight:700;' : '14px;') + 'color:#222222;">' + esc_(label) +
      '</td><td style="padding:6px 8px;text-align:right;white-space:nowrap;font-size:' + (strong ? '16px;font-weight:700;color:' + b.accent : '14px;color:#222222') + ';">' + esc_(value) + '</td></tr>';
  };
  return '<table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:8px;">' + rows +
    sum('Subtotal', money_(o.sub, cur)) +
    (o.physical === false ? '' : sum('Shipping' + (o.option ? ' · ' + o.option.name : ''), o.ship ? money_(o.ship, cur) : 'Free')) +
    sum('Total', money_(o.total, cur), true) + '</table>';
}

function detailsTable_(pairs, b) {
  return '<table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:12px;font-size:14px;">' +
    pairs.filter(function (p) { return p[1]; }).map(function (p) {
      return '<tr><td style="padding:9px 12px;border-bottom:1px solid #ECECEE;font-weight:700;color:' + b.dark + ';width:34%;background:#F7F9FB;">' + esc_(p[0]) +
        '</td><td style="padding:9px 12px;border-bottom:1px solid #ECECEE;color:#444444;">' + esc_(p[1]) + '</td></tr>';
    }).join('') + '</table>';
}

function button_(href, label, b) {
  return '<div style="text-align:center;margin:22px 0 6px;"><a href="' + esc_(href) + '" style="display:inline-block;background:' + b.accent +
    ';color:#ffffff;padding:13px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:15px;">' + esc_(label) + '</a></div>';
}

function address_(c) {
  return [c.street || c.address, ((c.postcode || '') + ' ' + (c.city || '')).trim(), c.country].filter(Boolean).join(', ');
}

function payment_(o, b) {
  var pay = o.customer.payment || '';
  if (payPal_(pay) && o.shop.paypalMe) {
    var link = 'https://www.paypal.com/paypalme/' + encodeURIComponent(o.shop.paypalMe) + '/' + o.total.toFixed(2) + o.shop.currency;
    return section_('Payment', b) + '<p style="font-size:14px;color:#444444;line-height:1.7;margin:0;">Please pay ' + esc_(money_(o.total, o.shop.currency)) +
      ' with PayPal and add your order number <strong>' + esc_(o.id) + '</strong> as a note.</p>' + button_(link, 'Pay now with PayPal', b);
  }
  if (o.shop.bank && payBank_(pay)) {
    return section_('Payment', b) + detailsTable_([['Bank transfer', o.shop.bank], ['Amount', money_(o.total, o.shop.currency)], ['Reference', o.id]], b);
  }
  return pay ? section_('Payment', b) + detailsTable_([['Payment', pay]], b) : '';
}

function ownerEmail_(o) {
  var b = brand_(o), c = o.customer;
  var phone = String(c.phone || '').replace(/[^\d+]/g, '');
  var wa = /^(\+|00)\d{7,}$/.test(phone) ? 'https://wa.me/' + phone.replace(/^\+|^00/, '') : '';
  var body = '<div class="email-body" style="padding:26px 32px;">' +
    '<p style="font-size:15px;color:#222222;line-height:1.7;margin:0 0 6px;">Order <strong>#' + esc_(o.id) + '</strong> via ' + esc_(METHOD_NAMES[o.method]) +
    ' · ' + esc_(Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm')) + '</p>' +
    (o.method === 'order' ? '' : '<p style="font-size:13px;color:#7A5800;background:#FFF3CD;padding:10px 12px;margin:10px 0 0;">The buyer was sent to ' +
      esc_(METHOD_NAMES[o.method]) + ' to finish the order. Check that the message arrived.</p>') +
    (o.returning && o.returning.count ? '<p style="font-size:13px;color:#1f4d40;background:#EEF6F3;padding:10px 12px;margin:10px 0 0;">↩︎ Returning customer: ' +
      esc_(o.returning.label) + '</p>' : '') +
    section_('Products', b) + itemsTable_(o, b) +
    section_('Customer', b) + detailsTable_([['Name', c.name], ['Phone', c.phone], ['Email', c.email], ['Address', o.physical ? address_(c) : ''],
      ['Payment', c.payment], ['Delivery', o.option ? o.option.name + (o.option.time ? ' · ' + o.option.time : '') : ''],
      ['Parcel weight', o.physical && o.weight ? (Math.round(o.weight * 1000) / 1000) + ' kg' : ''], ['Note', c.note]], b) +
    (o.digital ? '<p style="font-size:13px;color:#1f4d40;background:#EEF6F3;padding:10px 12px;margin:10px 0 0;">Digital products: once paid, set the Status of order ' +
      esc_(o.id) + ' to <strong>Paid</strong> in the sheet and the download links go to ' + esc_(c.email) + ' automatically.</p>' : '') +
    (wa ? button_(wa, 'Reply on WhatsApp', b) : (c.email ? button_('mailto:' + c.email + '?subject=' + encodeURIComponent('Your order #' + o.id), 'Reply by email', b) : '')) +
    '</div>';
  return wrapEmail_(banner_('New order', money_(o.total, o.shop.currency), b, false) + body, b);
}

function buyerEmail_(o) {
  var b = brand_(o), c = o.customer;
  var contact = [];
  if (o.shop.whatsapp) contact.push(['WhatsApp', 'https://wa.me/' + o.shop.whatsapp]);
  if (o.shop.telegram) contact.push(['Telegram', 'https://t.me/' + o.shop.telegram]);
  var body = '<div class="email-body" style="padding:26px 32px;">' +
    '<p style="font-size:15px;color:#222222;line-height:1.7;margin:0 0 14px;">Hello ' + esc_(c.name) + ',</p>' +
    '<p style="font-size:15px;color:#222222;line-height:1.7;margin:0 0 14px;">thank you for your order. We have received it and will confirm it personally, usually within one working day.</p>' +
    section_('Your order #' + o.id, b) + itemsTable_(o, b) +
    payment_(o, b) +
    (o.physical ? section_('Delivery to', b) + detailsTable_([['Name', c.name], ['Address', address_(c)], ['Phone', c.phone],
      ['Delivery', o.option ? o.option.name : ''], ['Estimated delivery', o.option ? o.option.time : '']], b) : '') +
    (o.digital ? section_('Your download', b) + '<p style="font-size:14px;color:#444444;line-height:1.7;margin:0;">We send the download link to <strong>' +
      esc_(c.email) + '</strong> as soon as your payment has arrived.</p>' : '') +
    (contact.length ? '<p style="font-size:14px;color:#444444;line-height:1.7;margin:18px 0 0;text-align:center;">Questions? ' +
      contact.map(function (x) { return '<a href="' + esc_(x[1]) + '" style="color:' + b.accent + ';font-weight:700;text-decoration:none;">' + x[0] + '</a>'; }).join(' &nbsp;·&nbsp; ') + '</p>' : '') +
    '</div>';
  return wrapEmail_(banner_('Thank you', 'Order received', b, true) + body, b);
}

// ---------------------------------------------------------------- digital products

/** Adds a row to "Downloads" for each digital product that has none yet, so you only paste the link. */
function downloadRows_(book, lines) {
  var sheet = sheet_(book, 'Downloads', DOWNLOAD_HEADERS);
  var known = downloadMap_(sheet);
  lines.forEach(function (l) {
    if (!l.digital || known[l.id]) return;
    sheet.appendRow([text_(l.title), "'" + l.id, '', '']);
    known[l.id] = { link: '' };
  });
}

/** Post ID -> { link, message } from the "Downloads" tab. */
function downloadMap_(sheet) {
  var map = {};
  if (sheet.getLastRow() < 2) return map;
  sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues().forEach(function (r) {
    var id = String(r[1]).replace(/\D/g, '');
    if (id) map[id] = { title: String(r[0]), link: String(r[2]).trim(), message: String(r[3]).trim() };
  });
  return map;
}

/**
 * Emails the download links of one order (its row in "Orders"). Returns a short result text.
 * Called when you set Status to "Paid", or from the menu Shop -> Send download links.
 */
function sendDownloads_(row, force) {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var orders = sheet_(book, 'Orders', ORDER_HEADERS);
  var col = function (name) { return ORDER_HEADERS.indexOf(name); };
  var r = orders.getRange(row, 1, 1, ORDER_HEADERS.length).getValues()[0];
  var id = String(r[col('Order ID')]), email = String(r[col('Email')]).trim(), sentCell = orders.getRange(row, col('Downloads sent') + 1);
  if (!id) return 'No order in row ' + row + '.';
  if (/^n\/a$/i.test(String(r[col('Downloads sent')]))) return 'Order ' + id + ' has no digital products.';
  if (r[col('Downloads sent')] instanceof Date && !force) return 'The links for order ' + id + ' were already sent on ' + r[col('Downloads sent')] + '.';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { sentCell.setValue('No email address'); return 'Order ' + id + ' has no valid email address.'; }

  var lineSheet = sheet_(book, 'Order lines', LINE_HEADERS);
  var items = lineSheet.getLastRow() < 2 ? [] : lineSheet.getRange(2, 1, lineSheet.getLastRow() - 1, LINE_HEADERS.length).getValues()
    .filter(function (l) { return String(l[0]) === id && l[9] === 'Digital'; })
    .map(function (l) { return { title: String(l[2]), postId: String(l[7]).replace(/\D/g, ''), url: String(l[8]) }; });
  if (!items.length) { sentCell.setValue('n/a'); return 'Order ' + id + ' has no digital products.'; }
  var links = downloadMap_(sheet_(book, 'Downloads', DOWNLOAD_HEADERS));
  var missing = items.filter(function (it) { return !/^https:\/\//.test((links[it.postId] || {}).link || ''); });
  if (missing.length) {
    sentCell.setValue('Missing link: ' + missing.map(function (m) { return m.title; }).join(', '));
    return 'Add the download link (https://…) for ' + missing.map(function (m) { return m.title; }).join(', ') + ' in the "Downloads" tab, then try again.';
  }

  var shop = shopSettings_();
  var b = { name: shop.name, dark: S_('COLOR_DARK'), accent: S_('COLOR_ACCENT'), site: blog_() };
  var name = String(r[col('Name')]);
  var body = '<div class="email-body" style="padding:26px 32px;">' +
    '<p style="font-size:15px;color:#222222;line-height:1.7;margin:0 0 14px;">Hello ' + esc_(name) + ',</p>' +
    '<p style="font-size:15px;color:#222222;line-height:1.7;margin:0 0 6px;">thank you, your payment for order <strong>#' + esc_(id) +
    '</strong> has arrived. Here is your download:</p>' +
    items.map(function (it) {
      var d = links[it.postId];
      return section_(it.title, b) + (d.message ? '<p style="font-size:14px;color:#444444;line-height:1.7;margin:0;">' + esc_(d.message) + '</p>' : '') +
        button_(d.link, 'Download ' + it.title, b) +
        '<p style="font-size:12px;color:#777777;text-align:center;margin:4px 0 0;word-break:break-all;">' + esc_(d.link) + '</p>';
    }).join('') +
    '<p style="font-size:13px;color:#666666;line-height:1.7;margin:22px 0 0;">Please keep this email. If a link does not open, just reply to it.</p>' +
    '</div>';
  var text = 'Hello ' + name + ',\n\nyour payment for order #' + id + ' has arrived. Your download:\n\n' +
    items.map(function (it) { return it.title + ': ' + links[it.postId].link + (links[it.postId].message ? '\n' + links[it.postId].message : ''); }).join('\n\n');
  mail_({ to: email, subject: shop.name + ': your download for order #' + id, body: text,
    htmlBody: wrapEmail_(banner_('Payment received', 'Your download', b, true) + body, b), name: shop.name,
    replyTo: S_('OWNER_EMAIL') || undefined });
  sentCell.setValue(new Date());
  return 'Download links for order ' + id + ' sent to ' + email + '.';
}

/** Installable "on edit" trigger (made by setup): Status set to Paid -> send the download links. */
function onOrderEdit(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  if (sheet.getName() !== 'Orders' || e.range.getRow() < 2 || e.range.getColumn() !== ORDER_HEADERS.indexOf('Status') + 1) return;
  for (var i = 0; i < e.range.getNumRows(); i++) {
    var row = e.range.getRow() + i;
    if (PAID.test(String(sheet.getRange(row, e.range.getColumn()).getValue()).trim())) {
      try { sendDownloads_(row, false); } catch (err) { sheet.getRange(row, ORDER_HEADERS.indexOf('Downloads sent') + 1).setValue('Error: ' + err.message); }
    }
  }
}

/** Adds the "Shop" menu to the sheet. */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Shop')
    .addItem('Send payment reminder for the selected order', 'menuSendReminder')
    .addItem('Send download links for the selected order', 'menuSendDownloads')
    .addSeparator()
    .addItem('Send the daily report now', 'sendDailyReport')
    .addItem('Send the weekly report now', 'sendWeeklyReport')
    .addSeparator()
    .addItem('Set up / update (after editing Settings or the script)', 'setup')
    .addToUi();
}

function menuSendDownloads() {
  var sheet = SpreadsheetApp.getActiveSheet(), ui = SpreadsheetApp.getUi();
  if (sheet.getName() !== 'Orders') { ui.alert('Click a row in the "Orders" tab first.'); return; }
  var row = sheet.getActiveRange().getRow();
  if (row < 2) { ui.alert('Click the row of the order first.'); return; }
  ui.alert(sendDownloads_(row, true));
}

/** Instant alert in Telegram (optional). */
function telegram_(o) {
  if (!S_('TELEGRAM_BOT_TOKEN') || !S_('TELEGRAM_CHAT_ID')) return;
  try {
    UrlFetchApp.fetch('https://api.telegram.org/bot' + S_('TELEGRAM_BOT_TOKEN') + '/sendMessage', {
      method: 'post', muteHttpExceptions: true,
      payload: { chat_id: S_('TELEGRAM_CHAT_ID'), text: '🛍️ ' + plainText_(o) }
    });
  } catch (x) { /* the sheet row and email are what count */ }
}

/** Questions the "Ask" chat assistant could not answer: anonymous, one row each, at most 300 a day (no emails). */
function question_(fields, data) {
  var q = String(fields.Question || fields.question || '').replace(/\s+/g, ' ').trim().slice(0, 300);
  if (!q) return reply_({ ok: false, error: 'empty question' });
  var cache = CacheService.getScriptCache(), key = 'questions-' + Utilities.formatDate(new Date(), 'UTC', 'yyyyMMdd');
  var count = Number(cache.get(key) || 0);
  if (count >= 300) return reply_({ ok: true, skipped: true });
  cache.put(key, String(count + 1), 21600);
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    sheet_(SpreadsheetApp.getActiveSpreadsheet(), 'Questions', QUESTION_HEADERS)
      .appendRow([new Date(), text_(q), text_(data.lang), text_(data.page), 'No']);
    return reply_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

// ---------------------------------------------------------------- settings, recipients, test mode

var settingsCache_ = null;
/** A setting: the Settings tab wins, then the SETTINGS defaults. Typed like the default (yes/no -> true/false, numbers). */
function S_(key) {
  if (settingsCache_ === null) {
    settingsCache_ = {};
    try {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Settings');
      if (sheet && sheet.getLastRow() > 1) {
        var byLabel = {};
        SETTING_ROWS.forEach(function (r) { byLabel[r[1].toLowerCase()] = r[0]; });
        sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues().forEach(function (r) {
          var k = byLabel[String(r[0]).trim().toLowerCase()];
          if (k && String(r[1]).trim() !== '') settingsCache_[k] = r[1];
        });
      }
    } catch (x) { /* no sheet context (e.g. a test): defaults only */ }
  }
  var def = SETTINGS[key], v = settingsCache_[key];
  if (v === undefined) return def;
  if (typeof def === 'boolean') return /^(yes|true|on|1|ja|oui|sí|si)$/i.test(String(v).trim());
  if (typeof def === 'number') { var n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? def : n; }
  if (v instanceof Date) return Utilities.formatDate(v, tz_(), 'HH:mm');
  return String(v).trim();
}

function tz_() { return S_('TIMEZONE') || Session.getScriptTimeZone(); }
function ownerAddress_() { return S_('OWNER_EMAIL') || Session.getEffectiveUser().getEmail(); }

/** Creates the Settings tab or adds missing rows; copies values typed into SETTINGS (code) into empty cells once. */
function settingsSheet_(book) {
  var sheet = book.getSheetByName('Settings');
  if (!sheet) {
    sheet = book.insertSheet('Settings');
    sheet.appendRow(SETTINGS_HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#111111').setFontColor('#ffffff');
  }
  var rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues() : [];
  var have = {};
  rows.forEach(function (r, i) { have[String(r[0]).trim().toLowerCase()] = i + 2; });
  var placeholder = { BLOG_URL: 'https://YOURBLOG.blogspot.com' };
  SETTING_ROWS.forEach(function (def) {
    var key = def[0], label = def[1], help = def[2], codeValue = SETTINGS[key];
    var typed = typeof codeValue === 'boolean' ? (codeValue ? 'yes' : 'no') : String(codeValue === undefined ? '' : codeValue);
    if (placeholder[key] === typed) typed = '';
    var row = have[label.toLowerCase()];
    if (!row) {
      sheet.appendRow([label, typed, help]);
    } else if (typed && String(rows[row - 2][1]).trim() === '') {
      sheet.getRange(row, 2).setValue(typed);
    }
  });
  try { sheet.setColumnWidth(1, 240); sheet.setColumnWidth(2, 320); sheet.setColumnWidth(3, 560); } catch (x) {}
  settingsCache_ = null;
  return sheet;
}

/** Creates the Recipients tab with the owner as the first recipient. */
function recipientsSheet_(book) {
  var sheet = book.getSheetByName('Recipients');
  var fresh = !sheet;
  sheet = sheet_(book, 'Recipients', RECIPIENT_HEADERS);
  if (fresh || sheet.getLastRow() < 2) sheet.appendRow([ownerAddress_(), 'Owner', 'yes', 'yes', 'yes', 'yes', 'yes']);
  return sheet;
}

/** Comma-separated emails for one kind: 'orders', 'requests', 'daily', 'weekly'. Falls back to the owner. */
function recipients_(kind) {
  var col = { orders: 3, requests: 4, daily: 5, weekly: 6 }[kind];
  var out = [];
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Recipients');
    if (sheet && sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, RECIPIENT_HEADERS.length).getValues().forEach(function (r) {
        var yes = function (v) { return /^(yes|true|on|1|ja|oui|sí|si|x)$/i.test(String(v).trim()); };
        if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(r[0]).trim()) && yes(r[2]) && yes(r[col])) out.push(String(r[0]).trim());
      });
    }
  } catch (x) { /* fall back to the owner */ }
  return (out.length ? out : [ownerAddress_()]).join(',');
}

/** Every email goes through here: test mode redirects it and names the real recipient in the subject. */
function mail_(m) {
  var test = S_('TEST_EMAIL');
  if (test && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(test)) {
    m = JSON.parse(JSON.stringify(m));
    m.subject = '[TEST → ' + m.to + '] ' + m.subject;
    m.to = test;
    delete m.cc; delete m.bcc;
  }
  MailApp.sendEmail(m);
}

// ---------------------------------------------------------------- returning customers, reminders

/** Earlier orders by the same email or phone: { count, last, label }. */
function returning_(orders, c) {
  var email = String(c.email || '').trim().toLowerCase(), phone = String(c.phone || '').replace(/\D/g, '').replace(/^0+/, '');
  var res = { count: 0, last: '', label: 'New customer' };
  if (orders.getLastRow() < 2 || (!email && phone.length < 6)) return res;
  var iE = ORDER_HEADERS.indexOf('Email'), iP = ORDER_HEADERS.indexOf('Phone'), iS = ORDER_HEADERS.indexOf('Status');
  var width = Math.min(orders.getLastColumn(), ORDER_HEADERS.length);
  orders.getRange(2, 1, orders.getLastRow() - 1, width).getValues().forEach(function (r) {
    var e = String(r[iE] || '').trim().toLowerCase(), p = String(r[iP] || '').replace(/\D/g, '').replace(/^0+/, '');
    var same = (email && e === email) || (phone.length >= 6 && p && (p === phone || p.slice(-9) === phone.slice(-9)));
    if (same && !/cancel|refund/i.test(String(r[iS] || ''))) { res.count++; res.last = String(r[0]); }
  });
  if (res.count) {
    var n = res.count + 1, suffix = n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
    res.label = n + suffix + ' order · last ' + res.last;
  }
  return res;
}

/** Rebuilds an order object from its row in Orders (+ Order lines), for reminders and reports. */
function orderFromRow_(book, row) {
  var orders = sheet_(book, 'Orders', ORDER_HEADERS);
  var col = function (name) { return ORDER_HEADERS.indexOf(name); };
  var r = orders.getRange(row, 1, 1, ORDER_HEADERS.length).getValues()[0];
  var id = String(r[col('Order ID')]);
  if (!id) return null;
  var lineSheet = sheet_(book, 'Order lines', LINE_HEADERS);
  var lines = lineSheet.getLastRow() < 2 ? [] : lineSheet.getRange(2, 1, lineSheet.getLastRow() - 1, LINE_HEADERS.length).getValues()
    .filter(function (l) { return String(l[0]) === id; })
    .map(function (l) { return { title: String(l[2]), chosen: String(l[3] || '').split(', ').filter(Boolean), qty: Number(l[4]) || 1,
      price: Number(l[5]) || 0, total: Number(l[6]) || 0, url: String(l[8] || ''), digital: l[9] === 'Digital', weight: 0 }; });
  var shop = shopSettings_();
  var sub = Number(r[col('Subtotal')]) || 0, ship = Number(r[col('Shipping')]) || 0, total = Number(r[col('Total')]) || sub + ship;
  var methodName = String(r[col('Method')] || 'Website'), method = 'order';
  Object.keys(METHOD_NAMES).forEach(function (k) { if (METHOD_NAMES[k] === methodName) method = k; });
  return {
    id: id, row: row, method: method, status: String(r[col('Status')] || ''), received: r[col('Received')], lines: lines,
    customer: { name: String(r[col('Name')] || ''), phone: String(r[col('Phone')] || ''), email: String(r[col('Email')] || '').trim(),
      street: String(r[col('Street')] || ''), postcode: String(r[col('Postcode')] || ''), city: String(r[col('City')] || ''),
      country: String(r[col('Country')] || ''), note: String(r[col('Note')] || ''), payment: String(r[col('Payment')] || '') },
    sub: sub, ship: ship, total: total, shop: shop,
    option: r[col('Delivery')] ? { name: String(r[col('Delivery')]), time: String(r[col('Delivery time')] || '') } : null,
    physical: lines.some(function (l) { return !l.digital; }) || !lines.length, digital: lines.some(function (l) { return l.digital; }),
    weight: Number(r[col('Weight (kg)')]) || 0, reminded: r[col('Reminder sent')]
  };
}

/** Unpaid website orders (bank transfer or PayPal) older than REMINDER_DAYS. */
function unpaidOrders_(book, days) {
  var orders = sheet_(book, 'Orders', ORDER_HEADERS);
  if (orders.getLastRow() < 2) return [];
  var col = function (name) { return ORDER_HEADERS.indexOf(name); };
  var limit = new Date(); limit.setDate(limit.getDate() - days);
  var out = [];
  orders.getRange(2, 1, orders.getLastRow() - 1, ORDER_HEADERS.length).getValues().forEach(function (r, i) {
    var status = String(r[col('Status')] || ''), received = r[col('Received')] instanceof Date ? r[col('Received')] : new Date(r[col('Received')]);
    if (!/^new$/i.test(status) || r[col('Method')] !== 'Website') return;
    if (!(payBank_(String(r[col('Payment')])) || payPal_(String(r[col('Payment')])))) return;
    if (isNaN(received) || received > limit) return;
    out.push({ row: i + 2, id: String(r[0]), name: String(r[col('Name')]), email: String(r[col('Email')]), total: Number(r[col('Total')]) || 0,
      currency: String(r[col('Currency')] || ''), received: received, reminded: r[col('Reminder sent')] });
  });
  return out;
}

/** Emails a friendly payment reminder for one order row. Returns a short result text. */
function sendReminder_(row) {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var o = orderFromRow_(book, row);
  if (!o) return 'No order in row ' + row + '.';
  if (PAID.test(o.status)) return 'Order ' + o.id + ' is already paid.';
  if (/cancel|refund/i.test(o.status)) return 'Order ' + o.id + ' is ' + o.status + '.';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(o.customer.email)) return 'Order ' + o.id + ' has no valid email address. Remind the customer on WhatsApp instead.';
  var b = brand_(o), c = o.customer, days = Math.max(0, Math.round((new Date() - new Date(o.received)) / 86400000));
  var contact = [];
  if (o.shop.whatsapp) contact.push(['WhatsApp', 'https://wa.me/' + o.shop.whatsapp]);
  if (o.shop.email) contact.push(['Email', 'mailto:' + o.shop.email]);
  var body = '<div class="email-body" style="padding:26px 32px;">' +
    '<p style="font-size:15px;color:#222222;line-height:1.7;margin:0 0 14px;">Hello ' + esc_(c.name) + ',</p>' +
    '<p style="font-size:15px;color:#222222;line-height:1.7;margin:0 0 14px;">a quick reminder about your order <strong>#' + esc_(o.id) + '</strong> from ' +
    (days ? days + ' day' + (days === 1 ? '' : 's') + ' ago' : 'today') + ': we have not seen your payment yet. ' +
    'As soon as it arrives we ' + (o.digital && !o.physical ? 'send your download' : 'pack your order') + '. If you have already paid, please ignore this email, thank you!</p>' +
    section_('Your order #' + o.id, b) + itemsTable_(o, b) + payment_(o, b) +
    '<p style="font-size:14px;color:#444444;line-height:1.7;margin:18px 0 0;">Changed your mind or need more time? Just reply to this email' +
    (contact.length ? ' or write to us on ' + contact.map(function (x) { return '<a href="' + esc_(x[1]) + '" style="color:' + b.accent + ';font-weight:700;text-decoration:none;">' + x[0] + '</a>'; }).join(' / ') : '') +
    '. We keep the order for you for a few more days.</p></div>';
  mail_({ to: c.email, subject: shop_(o) + ': reminder for order #' + o.id, name: shop_(o), replyTo: ownerAddress_(),
    body: 'Hello ' + c.name + ',\n\na quick reminder: we have not seen the payment for order #' + o.id + ' (' + money_(o.total, o.shop.currency) + ') yet.\n\n' +
      (o.shop.bank && payBank_(c.payment) ? 'Bank transfer: ' + o.shop.bank + '\nReference: ' + o.id + '\n\n' : '') + 'If you have already paid, please ignore this email.',
    htmlBody: wrapEmail_(banner_('Reminder', 'Order #' + o.id, b, false) + body, b) });
  sheet_(book, 'Orders', ORDER_HEADERS).getRange(row, ORDER_HEADERS.indexOf('Reminder sent') + 1).setValue(new Date());
  return 'Reminder for order ' + o.id + ' sent to ' + c.email + '.';
}
function shop_(o) { return o.shop.name; }

function menuSendReminder() {
  var sheet = SpreadsheetApp.getActiveSheet(), ui = SpreadsheetApp.getUi();
  if (sheet.getName() !== 'Orders') { ui.alert('Click a row in the "Orders" tab first.'); return; }
  var row = sheet.getActiveRange().getRow();
  if (row < 2) { ui.alert('Click the row of the order first.'); return; }
  ui.alert(sendReminder_(row));
}

// ---------------------------------------------------------------- daily and weekly reports

/** Rows of a tab as objects by header name, with a Date in `when` (column named `dateCol`). */
function rowsOf_(book, name, headers, dateCol) {
  var sheet = book.getSheetByName(name);
  if (!sheet || sheet.getLastRow() < 2) return [];
  var width = Math.min(sheet.getLastColumn(), headers.length);
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getValues().map(function (r, i) {
    var o = { row: i + 2 };
    headers.forEach(function (h, j) { o[h] = j < width ? r[j] : ''; });
    var d = o[dateCol] instanceof Date ? o[dateCol] : new Date(o[dateCol]);
    o.when = isNaN(d) ? null : d;
    return o;
  });
}
function between_(list, from, to) { return list.filter(function (x) { return x.when && x.when >= from && x.when < to; }); }
function dayStart_(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function countBy_(list, fn) {
  var m = {};
  list.forEach(function (x) { var k = fn(x) || '—'; m[k] = (m[k] || 0) + 1; });
  return Object.keys(m).map(function (k) { return [k, m[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
}
function sumBy_(list, keyFn, valFn) {
  var m = {};
  list.forEach(function (x) { var k = keyFn(x) || '—'; m[k] = (m[k] || 0) + (Number(valFn(x)) || 0); });
  return Object.keys(m).map(function (k) { return [k, m[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
}
function isSale_(o) { return o.Method === 'Website' && !/cancel|refund/i.test(String(o.Status || '')); }
function revenue_(list) { return list.filter(isSale_).reduce(function (s, o) { return s + (Number(o.Total) || 0); }, 0); }

function kpis_(cells, b) {
  var td = function (c, i) {
    var bg = i === 0 ? b.dark : i === 1 ? '#2A2A2A' : b.accent, fg = i === 2 ? b.dark : '#ffffff';
    return '<td style="width:33%;background:' + bg + ';padding:18px 8px;text-align:center;vertical-align:top;">' +
      '<div style="font-size:30px;font-weight:700;color:' + (i === 1 ? '#ffffff' : i === 0 ? b.accent : fg) + ';line-height:1.1;">' + esc_(c[0]) + '</div>' +
      '<div style="font-size:11px;color:' + (i === 2 ? b.dark : '#C9C9C9') + ';margin-top:6px;text-transform:uppercase;letter-spacing:1px;">' + esc_(c[1]) + '</div></td>';
  };
  return '<table role="presentation" style="width:100%;border-collapse:collapse;"><tr>' + cells.map(td).join('') + '</tr></table>';
}
function countTable_(title, pairs, b, fmt) {
  if (!pairs.length) return '';
  return section_(title, b) + '<table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;">' +
    pairs.slice(0, 10).map(function (p) {
      return '<tr><td style="padding:7px 10px;border-bottom:1px solid #ECECEE;color:#333333;">' + esc_(p[0]) +
        '</td><td style="padding:7px 10px;border-bottom:1px solid #ECECEE;text-align:right;font-weight:700;color:' + b.dark + ';white-space:nowrap;">' + esc_(fmt ? fmt(p[1]) : p[1]) + '</td></tr>';
    }).join('') + '</table>';
}
function orderCards_(list, b, cur) {
  return list.map(function (o) {
    return '<div style="border:1px solid #ECECEE;border-radius:6px;padding:10px 14px;margin:0 0 8px;font-size:13px;line-height:1.7;color:#444444;">' +
      '<strong style="color:' + b.dark + ';">#' + esc_(o['Order ID']) + '</strong> · ' + esc_(o.Method) + ' · <strong>' + esc_(money_(Number(o.Total) || 0, o.Currency || cur)) + '</strong>' +
      ' <span style="background:#F0F0F0;border-radius:10px;padding:1px 8px;font-size:11px;">' + esc_(o.Status) + '</span>' +
      (o.Customer && !/^new customer$/i.test(String(o.Customer)) ? ' <span style="color:#1f4d40;font-size:11px;">↩︎ ' + esc_(o.Customer) + '</span>' : '') +
      '<br>' + esc_(o.Name) + (o.City ? ' · ' + esc_(o.City) : '') + (o.Country ? ', ' + esc_(o.Country) : '') +
      '<br><span style="color:#777777;">' + esc_(String(o.Items || '').split('\n').join(' · ')) + '</span></div>';
  }).join('');
}

/** Yesterday's orders and revenue, unpaid orders, new requests, sign-ups, unanswered questions. */
function sendDailyReport() {
  var book = SpreadsheetApp.getActiveSpreadsheet(), shop = shopSettings_(), tz = tz_();
  var b = { name: shop.name, dark: S_('COLOR_DARK'), accent: S_('COLOR_ACCENT'), site: blog_() }, cur = shop.currency;
  var today = dayStart_(new Date()), yday = new Date(today); yday.setDate(today.getDate() - 1);
  var label = Utilities.formatDate(yday, tz, 'EEEE, d MMMM yyyy');
  var orders = rowsOf_(book, 'Orders', ORDER_HEADERS, 'Received'), requests = rowsOf_(book, 'Requests', REQUEST_HEADERS, 'Received');
  var news = rowsOf_(book, 'Newsletter', NEWS_HEADERS, 'Received'), questions = rowsOf_(book, 'Questions', QUESTION_HEADERS, 'Received');
  var dayOrders = between_(orders, yday, today), dayReq = between_(requests, yday, today), daySubs = between_(news, yday, today);
  var unpaid = unpaidOrders_(book, S_('REMINDER_DAYS'));
  var openQ = questions.filter(function (q) { return !/^(yes|ja|oui|done)$/i.test(String(q['Added to the assistant?'] || '')); });
  var started = dayOrders.filter(function (o) { return o.Method !== 'Website'; }).length;
  var body = '<div class="email-body" style="padding:22px 32px 26px;">' +
    '<p style="font-size:13px;color:#777777;margin:0 0 12px;">' + esc_(label) + '</p>' +
    kpis_([[String(dayOrders.filter(isSale_).length), 'website orders'], [money_(revenue_(dayOrders), cur), 'revenue'], [String(dayReq.length), 'new requests']], b) +
    (dayOrders.length ? section_('Orders yesterday', b) + orderCards_(dayOrders, b, cur) : section_('Orders yesterday', b) + '<p style="font-size:14px;color:#777777;margin:0;">None.</p>') +
    (started ? '<p style="font-size:12px;color:#7A5800;background:#FFF3CD;padding:8px 12px;margin:8px 0 0;">' + started + ' order' + (started === 1 ? '' : 's') +
      ' started on WhatsApp/Telegram/email: check that the message arrived and reply.</p>' : '') +
    (unpaid.length ? section_('Unpaid for ' + S_('REMINDER_DAYS') + '+ days', b) + '<table role="presentation" style="width:100%;border-collapse:collapse;font-size:13px;">' +
      unpaid.map(function (u) {
        return '<tr><td style="padding:6px 8px;border-bottom:1px solid #ECECEE;"><strong>#' + esc_(u.id) + '</strong> · ' + esc_(u.name) +
          '</td><td style="padding:6px 8px;border-bottom:1px solid #ECECEE;white-space:nowrap;">' + esc_(money_(u.total, u.currency || cur)) +
          '</td><td style="padding:6px 8px;border-bottom:1px solid #ECECEE;text-align:right;color:#777777;white-space:nowrap;">' +
          (u.reminded instanceof Date ? 'reminded ' + esc_(Utilities.formatDate(u.reminded, tz, 'd MMM')) : 'since ' + esc_(Utilities.formatDate(u.received, tz, 'd MMM'))) + '</td></tr>';
      }).join('') + '</table><p style="font-size:12px;color:#777777;margin:8px 0 0;">Sheet → click the order → menu Shop → Send payment reminder.</p>' : '') +
    (dayReq.length ? section_('New requests', b) + dayReq.map(function (r) {
      return '<div style="border:1px solid #ECECEE;border-radius:6px;padding:10px 14px;margin:0 0 8px;font-size:13px;line-height:1.7;color:#444444;"><strong style="color:' + b.dark + ';">' +
        esc_(r.Type) + '</strong> · ' + esc_(r.Name || r.Company || r.Email || r.Phone) + '<br><span style="color:#777777;">' + esc_(String(r.Details || '').slice(0, 220)) + '</span></div>';
    }).join('') : '') +
    section_('Also', b) + '<p style="font-size:14px;color:#444444;line-height:1.8;margin:0;">' +
    'Newsletter: ' + daySubs.length + ' new sign-up' + (daySubs.length === 1 ? '' : 's') + ', ' + news.filter(function (n) { return n.Status === 'Subscribed'; }).length + ' subscribed in total.<br>' +
    'Chat questions without an answer: ' + openQ.length + (openQ.length ? ' (latest: “' + esc_(String(openQ[openQ.length - 1].Question || '')) + '”). Add answers in Layout → Ask assistant.' : '.') +
    '</p>' + button_(book.getUrl(), 'Open the sheet', b) + '</div>';
  mail_({ to: recipients_('daily'), name: shop.name,
    subject: '📊 ' + shop.name + ' daily: ' + dayOrders.filter(isSale_).length + ' orders, ' + money_(revenue_(dayOrders), cur) + (unpaid.length ? ', ' + unpaid.length + ' unpaid' : ''),
    body: label + '\nOrders: ' + dayOrders.length + '\nRevenue: ' + money_(revenue_(dayOrders), cur) + '\nRequests: ' + dayReq.length + '\nUnpaid: ' + unpaid.length + '\n' + book.getUrl(),
    htmlBody: wrapEmail_(banner_('Daily report', money_(revenue_(dayOrders), cur), b, revenue_(dayOrders) > 0) + body, b) });
  return 'Daily report sent to ' + recipients_('daily');
}

/** Last 7 days against the 7 before: revenue, orders, top products, countries, methods, languages, requests, newsletter. */
function sendWeeklyReport() {
  var book = SpreadsheetApp.getActiveSpreadsheet(), shop = shopSettings_(), tz = tz_();
  var b = { name: shop.name, dark: S_('COLOR_DARK'), accent: S_('COLOR_ACCENT'), site: blog_() }, cur = shop.currency;
  var today = dayStart_(new Date()), from = new Date(today); from.setDate(today.getDate() - 7);
  var prevFrom = new Date(from); prevFrom.setDate(from.getDate() - 7);
  var orders = rowsOf_(book, 'Orders', ORDER_HEADERS, 'Received'), lines = rowsOf_(book, 'Order lines', LINE_HEADERS, 'Received');
  var requests = rowsOf_(book, 'Requests', REQUEST_HEADERS, 'Received'), news = rowsOf_(book, 'Newsletter', NEWS_HEADERS, 'Received');
  var questions = rowsOf_(book, 'Questions', QUESTION_HEADERS, 'Received');
  var week = between_(orders, from, today), prev = between_(orders, prevFrom, from), sales = week.filter(isSale_);
  var ids = {}; sales.forEach(function (o) { ids[String(o['Order ID'])] = true; });
  var weekLines = lines.filter(function (l) { return ids[String(l['Order ID'])]; });
  var rev = revenue_(week), prevRev = revenue_(prev);
  var change = prevRev ? Math.round((rev - prevRev) / prevRev * 100) : (rev ? 100 : 0);
  var range = Utilities.formatDate(from, tz, 'd MMM') + ' – ' + Utilities.formatDate(new Date(today - 1), tz, 'd MMM yyyy');
  var returning = sales.filter(function (o) { return o.Customer && !/^new customer$/i.test(String(o.Customer)); }).length;
  var body = '<div class="email-body" style="padding:22px 32px 26px;">' +
    '<p style="font-size:13px;color:#777777;margin:0 0 12px;">' + esc_(range) + '</p>' +
    kpis_([[money_(rev, cur), 'revenue (' + (change >= 0 ? '+' : '') + change + '% vs last week)'], [String(sales.length), 'website orders' + (returning ? ' · ' + returning + ' returning' : '')],
      [sales.length ? money_(rev / sales.length, cur) : '–', 'average order']], b) +
    countTable_('Top products', sumBy_(weekLines, function (l) { return l.Product; }, function (l) { return l.Qty; }), b, function (v) { return v + ' sold'; }) +
    countTable_('Revenue by country', sumBy_(sales, function (o) { return o.Country; }, function (o) { return o.Total; }), b, function (v) { return money_(v, cur); }) +
    countTable_('How people ordered', countBy_(week, function (o) { return o.Method; }), b) +
    countTable_('Shop language', countBy_(week, function (o) { return String(o.Language || '').toUpperCase(); }), b) +
    countTable_('Payment', countBy_(sales, function (o) { return o.Payment; }), b) +
    countTable_('Requests this week', countBy_(between_(requests, from, today), function (r) { return r.Type; }), b) +
    section_('Newsletter and chat', b) + '<p style="font-size:14px;color:#444444;line-height:1.8;margin:0;">' +
    between_(news, from, today).length + ' new sign-ups this week, ' + news.filter(function (n) { return n.Status === 'Subscribed'; }).length + ' subscribed in total.<br>' +
    between_(questions, from, today).length + ' chat questions the assistant could not answer this week.</p>' +
    (unpaidOrders_(book, S_('REMINDER_DAYS')).length ? '<p style="font-size:13px;color:#7A5800;background:#FFF3CD;padding:8px 12px;margin:14px 0 0;">' +
      unpaidOrders_(book, S_('REMINDER_DAYS')).length + ' order(s) still unpaid for ' + S_('REMINDER_DAYS') + '+ days: see the daily report or the Orders tab.</p>' : '') +
    button_(book.getUrl(), 'Open the sheet', b) + '</div>';
  mail_({ to: recipients_('weekly'), name: shop.name,
    subject: '📈 ' + shop.name + ' weekly: ' + money_(rev, cur) + ' from ' + sales.length + ' orders (' + (change >= 0 ? '+' : '') + change + '%)',
    body: range + '\nRevenue: ' + money_(rev, cur) + ' (' + change + '% vs last week)\nOrders: ' + sales.length + '\n' + book.getUrl(),
    htmlBody: wrapEmail_(banner_('Weekly report', money_(rev, cur), b, change >= 0) + body, b) });
  return 'Weekly report sent to ' + recipients_('weekly');
}

/** Replaces the report triggers according to Settings. Returns a short description. */
function reportTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (/^send(Daily|Weekly)Report$/.test(t.getHandlerFunction())) ScriptApp.deleteTrigger(t);
  });
  var tz = tz_(), out = [];
  var hour = function (v) { var m = /^\s*(\d{1,2})/.exec(String(v || '')); return m ? Math.min(23, Math.max(0, parseInt(m[1], 10))) : NaN; };
  var dh = hour(S_('REPORT_DAILY'));
  if (!isNaN(dh)) { ScriptApp.newTrigger('sendDailyReport').timeBased().everyDays(1).atHour(dh).inTimezone(tz).create(); out.push('daily at ' + dh + ':00'); }
  var days = { monday: 'MONDAY', tuesday: 'TUESDAY', wednesday: 'WEDNESDAY', thursday: 'THURSDAY', friday: 'FRIDAY', saturday: 'SATURDAY', sunday: 'SUNDAY',
    montag: 'MONDAY', dienstag: 'TUESDAY', mittwoch: 'WEDNESDAY', donnerstag: 'THURSDAY', freitag: 'FRIDAY', samstag: 'SATURDAY', sonntag: 'SUNDAY' };
  var wd = days[String(S_('REPORT_WEEKLY_DAY') || '').trim().toLowerCase()], wh = hour(S_('REPORT_WEEKLY'));
  if (wd && !isNaN(wh)) { ScriptApp.newTrigger('sendWeeklyReport').timeBased().onWeekDay(ScriptApp.WeekDay[wd]).atHour(wh).inTimezone(tz).create(); out.push('weekly on ' + wd.toLowerCase() + ' at ' + wh + ':00'); }
  return out.length ? out.join(', ') + ' (' + tz + ')' : 'off';
}

// ---------------------------------------------------------------- run these from the editor

/** Run once: creates the tabs, asks for permissions and emails you a test. */
function setup() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  settingsSheet_(book);
  recipientsSheet_(book);
  var orders = sheet_(book, 'Orders', ORDER_HEADERS);
  sheet_(book, 'Order lines', LINE_HEADERS);
  sheet_(book, 'Downloads', DOWNLOAD_HEADERS);
  sheet_(book, 'Requests', REQUEST_HEADERS);
  sheet_(book, 'Newsletter', NEWS_HEADERS);
  sheet_(book, 'Questions', QUESTION_HEADERS);
  // Status dropdown (other texts such as "Sent via WhatsApp – check the chat" stay allowed).
  try {
    orders.getRange(2, ORDER_HEADERS.indexOf('Status') + 1, Math.max(orders.getMaxRows() - 1, 1), 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(ORDER_STATUSES, true).setAllowInvalid(true).build());
  } catch (x) { /* cosmetic */ }
  var has = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'onOrderEdit'; });
  if (!has) ScriptApp.newTrigger('onOrderEdit').forSpreadsheet(book).onEdit().create();
  var reports = reportTriggers_();
  var shop = shopSettings_();
  mail_({ to: ownerAddress_(),
    subject: '✅ ' + shop.name + ' order inbox is ready',
    body: 'Orders from ' + blog_() + ' will arrive in this sheet: ' + book.getUrl() + '\n\n' +
      'Settings tab: blog address, emails, Telegram, report times, test mode.\nRecipients tab: who gets alerts and reports.\n' +
      'Reports: ' + reports + '\n\nRun setup again after changing the report times.' });
  Logger.log('Shop settings read from the blog: ' + JSON.stringify(shop));
}

/** After sending /start to your bot in Telegram, run this and copy the chat id from the log. */
function telegramFindChatId() {
  var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + S_('TELEGRAM_BOT_TOKEN') + '/getUpdates', { muteHttpExceptions: true });
  var data = JSON.parse(res.getContentText());
  (data.result || []).forEach(function (u) {
    var chat = (u.message || u.channel_post || {}).chat;
    if (chat) Logger.log('chat id: ' + chat.id + '  (' + (chat.username || chat.title || chat.first_name) + ')');
  });
}

/** Check the feed lookup for one product (copy a post id from Blogger's edit URL: ...postID=1234567890). */
function testProduct() {
  Logger.log(productById_('PASTE_A_POST_ID'));
}
