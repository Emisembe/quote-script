/**
 * Order inbox for a Blogger shop: Google Apps Script web app + Google Sheet.
 *
 * Setup (5 minutes):
 *   1. sheets.new -> Extensions -> Apps Script -> paste this file -> fill in SETTINGS.
 *   2. Deploy -> New deployment -> Web app -> Execute as: Me, Who has access: Anyone.
 *   3. Copy the /exec URL into the blog's "Shop settings" gadget:  order_endpoint: https://script.google.com/macros/s/.../exec
 *   After any code change: Deploy -> Manage deployments -> Edit -> Version: New version.
 *
 * The browser's cart is never trusted: every price is re-read from the public
 * Blogger feed of that post, so an edited cart cannot change the total.
 */
var SETTINGS = {
  BLOG_URL: 'https://YOURBLOG.blogspot.com',  // the shop's address, no trailing slash
  OWNER_EMAIL: '',                           // where new orders are sent (blank = the script owner)
  SHOP_NAME: 'My Shop',
  CURRENCY: 'EUR',
  SHIPPING: 0,                               // flat shipping; must match the blog's Shop settings
  FREE_SHIPPING_OVER: 0,                     // 0 = never free
  LABEL_PRICES: false,                       // true if products use SpotCommerce-style labels (_39 -49 !0)
  EMAIL_BUYER: true,
  BANK_DETAILS: ''                           // shown in the buyer's email when set
};

var ORDER_HEADERS = ['Order ID', 'Received', 'Status', 'Name', 'Phone', 'Email', 'Address', 'Note',
                     'Items', 'Subtotal', 'Shipping', 'Total', 'Currency', 'Page'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var order = JSON.parse(e.postData.contents);
    var c = order.customer || {};
    if (!c.name || !c.phone || !c.address) return reply({ ok: false, error: 'missing customer details' });
    if (!order.items || !order.items.length || order.items.length > 50) return reply({ ok: false, error: 'empty cart' });

    var lines = [];
    var sub = 0;
    order.items.forEach(function (item) {
      var product = productById(String(item.id));
      if (!product) throw new Error('Product not found: ' + item.title);
      if (!isNaN(product.stock) && product.stock <= 0) throw new Error('Out of stock: ' + product.title);
      var qty = Math.max(1, Math.min(99, parseInt(item.qty, 10) || 1));
      sub += product.price * qty;
      lines.push(qty + ' x ' + product.title + (item.chosen && item.chosen.length ? ' (' + item.chosen.join(', ') + ')' : '') +
                 ' @ ' + product.price.toFixed(2));
    });
    var ship = SETTINGS.SHIPPING && !(SETTINGS.FREE_SHIPPING_OVER && sub >= SETTINGS.FREE_SHIPPING_OVER) ? SETTINGS.SHIPPING : 0;
    var total = sub + ship;
    var id = /^O\d{6}-[A-Z0-9]{4}$/.test(order.orderId) ? order.orderId : 'O' + Date.now();

    lock.waitLock(20000);
    var sheet = ordersSheet();
    sheet.appendRow([id, new Date(), 'New', c.name, "'" + c.phone, c.email || '', c.address, c.note || '',
                     lines.join('\n'), sub, ship, total, SETTINGS.CURRENCY, order.page || '']);
    lock.releaseLock();

    var text = lines.join('\n') + '\n\nSubtotal: ' + sub.toFixed(2) + '\nShipping: ' + ship.toFixed(2) +
               '\nTotal: ' + total.toFixed(2) + ' ' + SETTINGS.CURRENCY;
    MailApp.sendEmail({
      to: SETTINGS.OWNER_EMAIL || Session.getEffectiveUser().getEmail(),
      replyTo: c.email || undefined,
      subject: 'New order ' + id + ' - ' + c.name,
      body: text + '\n\n' + c.name + '\n' + c.phone + '\n' + (c.email || '') + '\n' + c.address + '\n\n' + (c.note || '')
    });
    if (SETTINGS.EMAIL_BUYER && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email || '')) {
      MailApp.sendEmail({
        to: c.email,
        subject: SETTINGS.SHOP_NAME + ': order ' + id + ' received',
        body: 'Hello ' + c.name + ',\n\nthank you for your order. We will confirm it shortly.\n\n' + text +
              (SETTINGS.BANK_DETAILS ? '\n\nBank transfer: ' + SETTINGS.BANK_DETAILS + '\nReference: ' + id : '') +
              '\n\n' + SETTINGS.SHOP_NAME
      });
    }
    return reply({ ok: true, orderId: id, total: total });
  } catch (err) {
    return reply({ ok: false, error: String(err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function doGet() {
  return reply({ ok: true, shop: SETTINGS.SHOP_NAME });
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function ordersSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Orders') || ss.insertSheet('Orders');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(ORDER_HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, ORDER_HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

/** Reads the product block (or price labels) from the post's public feed. Cached 10 minutes. */
function productById(postId) {
  if (!/^\d+$/.test(postId)) return null;
  var cache = CacheService.getScriptCache();
  var hit = cache.get('p' + postId);
  if (hit) return JSON.parse(hit);
  var res = UrlFetchApp.fetch(SETTINGS.BLOG_URL + '/feeds/posts/default/' + postId + '?alt=json', { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return null;
  var entry = JSON.parse(res.getContentText()).entry;
  var html = (entry.content && entry.content.$t) || '';
  var product = { title: entry.title.$t, price: NaN, stock: NaN };
  var tag = /<[a-z]+\b[^>]*class=["'][^"']*\bproduct\b[^"']*["'][^>]*>/i.exec(html);
  if (tag) {
    product.price = num(attr(tag[0], 'data-price'));
    product.stock = num(attr(tag[0], 'data-stock'));
  }
  if (isNaN(product.price) && SETTINGS.LABEL_PRICES) {
    (entry.category || []).forEach(function (cat) {
      var m = /^([_!])(\d[\d.,]*)$/.exec(cat.term);
      if (m && m[1] === '_') product.price = num(m[2]);
      if (m && m[1] === '!') product.stock = num(m[2]);
    });
  }
  if (isNaN(product.price)) return null;
  cache.put('p' + postId, JSON.stringify(product), 600);
  return product;
}

function attr(tag, name) {
  var m = new RegExp(name + '\\s*=\\s*["\']([^"\']*)["\']', 'i').exec(tag);
  return m ? m[1] : '';
}

/** Same number rules as shop.js: "39,90", "1.299,50" and "1,299.50" all work. */
function num(v) {
  if (v === undefined || v === null || v === '') return NaN;
  var s = String(v).replace(/[^\d.,-]/g, '');
  if (s.indexOf(',') > -1 && s.indexOf('.') > -1) {
    s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else {
    s = s.replace(',', '.');
  }
  return parseFloat(s);
}

/** Run once from the editor to check the feed lookup for one product (copy a post id from Blogger's edit URL). */
function testProduct() {
  Logger.log(productById('PASTE_A_POST_ID'));
}
