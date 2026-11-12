// Code.gs v2: Settings tab (wins over the code, survives updates), Recipients tab, test mode, returning customers,
// payment reminder, daily and weekly reports, report triggers from Settings.
// node tests/inbox-reports.js <Code.gs> [out dir for the report HTML]
const fs = require('fs'), vm = require('vm');
const out = process.argv[3] || '.';
const results = []; const ok = (name, cond, info) => results.push([cond ? 'PASS' : 'FAIL', name, info || '']);
const sheets = {}, mails = [], triggers = [], validations = [];
function mkSheet(name, rows) { rows = rows || []; const sh = { rows, name, getName: () => sh.name, getLastRow: () => rows.length,
  getLastColumn: () => rows.reduce((m, r) => Math.max(m, r.length), 0), getMaxRows: () => Math.max(rows.length, 100), setColumnWidth() {},
  appendRow: r => rows.push(r.slice()), setFrozenRows() {}, clear() { rows.length = 0; }, setName(n) { delete sheets[sh.name]; sh.name = n; sheets[n] = sh; },
  getActiveRange: () => ({ getRow: () => sh.active || 2 }),
  getRange: (r, c, n, w) => { n = n || 1; w = w || 1; const rg = {
    getValues: () => { const o = []; for (let i = 0; i < n; i++) { const row = rows[r - 1 + i] || []; o.push(Array.from({ length: w }, (_, j) => row[c - 1 + j] === undefined ? '' : row[c - 1 + j])); } return o; },
    getValue: () => rg.getValues()[0][0],
    setValues: v => { v.forEach((x, i) => { rows[r - 1 + i] = rows[r - 1 + i] || []; x.forEach((y, j) => rows[r - 1 + i][c - 1 + j] = y); }); return rg; },
    setValue: x => rg.setValues([[x]]), setFontWeight() { return rg; }, setBackground() { return rg; }, setFontColor() { return rg; },
    setDataValidation(v) { validations.push([sh.name, c]); return rg; }, getRow: () => r, getColumn: () => c, getNumRows: () => n, getSheet: () => sh }; return rg; } }; return sh; }
const home = `<div class='shop-settings'>shop_name: Kreislo<br/>currency: EUR<br/>shipping: 4,90<br/>free_shipping_over: 50<br/>bank: Sparkasse Gießen, IBAN DE00 1234<br/>whatsapp: +49 157 0000000</div>
<div class='shop-delivery'>DHL | 4,90 up to 2 kg; 9,90 up to 10 kg | 2–4 working days | /p/delivery.html | Germany<br/>Pickup in Gießen | 0 | By appointment | /p/delivery.html | Germany</div>`;
const prod = (t, attrs) => ({ entry: { title: { $t: t }, link: [{ rel: 'alternate', href: 'https://x.blogspot.com/' + t + '.html' }], content: { $t: '<div class="product" ' + attrs + '>x</div>' } } });
const feed = { '111': prod('Washing machine', 'data-price="190" data-weight="70"'), '222': prod('Ebook', 'data-price="12,90" data-digital="yes"'), '333': prod('Fridge', 'data-price="240" data-weight="60"') };
const cache = {};
const pad = n => String(n).padStart(2, '0');
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const fmt = (d, tz, p) => p.replace(/yyyy/g, d.getFullYear()).replace(/yy/g, String(d.getFullYear()).slice(-2)).replace(/MMMM/g, MON[d.getMonth()] + 'uary'.slice(0, 0)).replace(/MMM/g, MON[d.getMonth()])
  .replace(/MM/g, pad(d.getMonth() + 1)).replace(/EEEE/g, DAY[d.getDay()]).replace(/dd/g, pad(d.getDate())).replace(/\bd\b/g, d.getDate()).replace(/HH/g, pad(d.getHours())).replace(/mm/g, pad(d.getMinutes())).replace(/ss/g, pad(d.getSeconds()));
const ctx = { JSON, Date, Math, String, Number, parseInt, parseFloat, isNaN, RegExp, Infinity, encodeURIComponent, Object, Array,
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: n => sheets[n], insertSheet: n => (sheets[n] = mkSheet(n)), getUrl: () => 'https://sheet.test/x' }),
    getActiveSheet: () => sheets['Orders'], getUi: () => ({ alert: m => ctx.__alerts.push(m), createMenu: () => ({ addItem() { return this; }, addSeparator() { return this; }, addToUi() {} }) }),
    newDataValidation: () => ({ requireValueInList(l) { this.list = l; return this; }, setAllowInvalid() { return this; }, build() { return { list: this.list }; } }) },
  __alerts: [],
  ScriptApp: { getProjectTriggers: () => triggers.slice(), deleteTrigger: t => triggers.splice(triggers.indexOf(t), 1), WeekDay: { MONDAY: 'MONDAY', FRIDAY: 'FRIDAY' },
    getService: () => ({ getUrl: () => 'https://script.google.com/macros/s/X/exec' }),
    newTrigger: f => { const t = { fn: f, getHandlerFunction: () => f }; const tb = { everyDays() { return tb; }, onWeekDay(d) { t.day = d; return tb; }, atHour(h) { t.hour = h; return tb; }, inTimezone(z) { t.tz = z; return tb; }, create: () => triggers.push(t) };
      return { forSpreadsheet: () => ({ onEdit: () => ({ create: () => triggers.push(t) }) }), timeBased: () => tb }; } },
  MailApp: { sendEmail: m => mails.push(m) }, Session: { getEffectiveUser: () => ({ getEmail: () => 'owner@kreislo.test' }), getScriptTimeZone: () => 'Europe/Berlin' },
  Utilities: { formatDate: fmt, getUuid: () => 'tok-' + Math.random().toString(36).slice(2).padEnd(30, '0') },
  CacheService: { getScriptCache: () => ({ get: k => cache[k] || null, put: (k, v) => cache[k] = v }) },
  UrlFetchApp: { fetch: u => { if (/feeds/.test(u)) { const id = u.match(/default\/(\d+)/)[1]; return { getResponseCode: () => feed[id] ? 200 : 404, getContentText: () => JSON.stringify(feed[id]) }; }
    return { getContentText: () => home, getResponseCode: () => 200 }; } },
  ContentService: { createTextOutput: s => ({ setMimeType: () => s }), MimeType: { JSON: 1 } }, Logger: { log: () => {} } };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(process.argv[2], 'utf8') + ";SETTINGS.BLOG_URL='https://x.blogspot.com';SETTINGS.OWNER_EMAIL='boss@kreislo.test';", ctx);
const post = o => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(o) } }));
const S = n => sheets[n], rowsOf = n => S(n).rows, col = (n, h) => rowsOf(n)[0].indexOf(h);

// 1. setup: Settings + Recipients tabs, code values copied into the tab, triggers, status dropdown
ctx.setup();
ok('setup creates Settings and Recipients tabs', !!S('Settings') && !!S('Recipients'), Object.keys(sheets).join(','));
const setting = label => { const r = rowsOf('Settings').find(r => r[0] === label); return r ? r[1] : undefined; };
const setSetting = (label, v) => { const r = rowsOf('Settings').find(r => r[0] === label); r[1] = v; ctx.settingsCache_ = null; };
ok('code SETTINGS copied into the tab once (blog, owner email, yes/no flags)', setting('Blog address') === 'https://x.blogspot.com' && setting('Owner email') === 'boss@kreislo.test' && setting('Email the buyer') === 'yes' && setting('Email me for chat orders') === 'no', JSON.stringify(rowsOf('Settings').slice(0, 5)));
ok('every setting row has an explanation', rowsOf('Settings').slice(1).every(r => r[2] && r[2].length > 8), JSON.stringify(rowsOf('Settings').filter(r => !r[2] || r[2].length <= 8)));
ok('Recipients seeded with the owner, all yes', rowsOf('Recipients')[1][0] === 'boss@kreislo.test' && rowsOf('Recipients')[1].slice(2).every(v => v === 'yes'), JSON.stringify(rowsOf('Recipients')));
ok('report triggers: daily 7:00 + weekly Monday 8:00 in Europe/Berlin', triggers.some(t => t.fn === 'sendDailyReport' && t.hour === 7 && t.tz === 'Europe/Berlin') && triggers.some(t => t.fn === 'sendWeeklyReport' && t.day === 'MONDAY' && t.hour === 8), JSON.stringify(triggers.map(t => [t.fn, t.hour, t.day])));
ok('Status column gets a dropdown', validations.some(v => v[0] === 'Orders' && v[1] === col('Orders', 'Status') + 1), JSON.stringify(validations));
ok('setup email goes to the owner from the tab', mails[0].to === 'boss@kreislo.test' && /Settings tab/.test(mails[0].body), mails[0].to);

// 2. the tab wins over the code; setup again keeps edited values and does not duplicate rows
setSetting('Owner email', 'inbox@kreislo.test'); setSetting('Payment reminder after (days)', '5');
const nRows = rowsOf('Settings').length; ctx.setup();
ok('setup again: no duplicate rows, edited values kept', rowsOf('Settings').length === nRows && setting('Owner email') === 'inbox@kreislo.test' && ctx.S_('REMINDER_DAYS') === 5, rowsOf('Settings').length + ' ' + setting('Owner email'));
ok('triggers replaced, not stacked (1 edit + 2 reports)', triggers.length === 3, String(triggers.length));
setSetting('Weekly report day', 'Friday'); setSetting('Daily report time', 'off'); ctx.setup();
ok('Settings change: daily "off", weekly on Friday', !triggers.some(t => t.fn === 'sendDailyReport') && triggers.some(t => t.fn === 'sendWeeklyReport' && t.day === 'FRIDAY'), JSON.stringify(triggers.map(t => [t.fn, t.day])));
setSetting('Daily report time', '07:00'); setSetting('Weekly report day', 'Monday'); ctx.setup();

// 3. recipients: orders to those who want order alerts; owner email no longer used when the tab has people
rowsOf('Recipients')[1][0] = 'inbox@kreislo.test';
S('Recipients').appendRow(['anna@kreislo.test', 'Anna', 'yes', 'yes', 'no', 'yes', 'no']);
S('Recipients').appendRow(['old@kreislo.test', 'Left', 'no', 'yes', 'yes', 'yes', 'yes']);
S('Recipients').appendRow(['ben@kreislo.test', 'Ben', 'yes', 'no', 'yes', 'no', 'yes']);
const cust = { name: 'Grace Wanjiru', phone: '+254 712 345678', email: 'grace@example.com', street: 'Moi Ave 1', postcode: '80100', city: 'Mombasa', country: 'Germany', delivery: 'DHL', payment: 'Bank transfer' };
mails.length = 0;
let r = post({ orderId: 'WAS-261110-100000', method: 'order', customer: cust, items: [{ id: '111', qty: 1 }] });
const ownerMail = mails.find(m => /New order/.test(m.subject));
ok('order alert goes to active recipients with "New orders = yes" only', r.ok && ownerMail.to === 'inbox@kreislo.test,anna@kreislo.test', ownerMail && ownerMail.to);
ok('first order: Customer column says New customer, no returning note', rowsOf('Orders')[1][col('Orders', 'Customer')] === 'New customer' && !/Returning customer/.test(ownerMail.htmlBody), rowsOf('Orders')[1][col('Orders', 'Customer')]);

// 4. returning customer by email, and by phone written differently
mails.length = 0;
r = post({ orderId: 'FRI-261111-100000', method: 'order', customer: Object.assign({}, cust, { email: 'GRACE@example.com', phone: '0712345678' }), items: [{ id: '333', qty: 1 }] });
const om2 = mails.find(m => /New order/.test(m.subject));
ok('2nd order (email in capitals): "2nd order · last WAS-…" in the sheet and the alert', /^2nd order · last WAS-261110-100000$/.test(rowsOf('Orders')[2][col('Orders', 'Customer')]) && /Returning customer: 2nd order/.test(om2.htmlBody), rowsOf('Orders')[2][col('Orders', 'Customer')]);
r = post({ orderId: 'EBO-261111-100001', method: 'order', customer: { name: 'G. Wanjiru', phone: '+254712345678', email: 'other@example.com' }, items: [{ id: '222', qty: 1 }] });
ok('3rd order matched by phone only (different email)', /^3rd order/.test(rowsOf('Orders')[3][col('Orders', 'Customer')]), rowsOf('Orders')[3][col('Orders', 'Customer')]);
r = post({ orderId: 'WAS-261111-100002', method: 'whatsapp', customer: { name: 'Peter', phone: '+49 170 1', email: 'peter@example.com', street: 'x', city: 'Gießen', country: 'Germany' }, items: [{ id: '111', qty: 1 }] });
ok('unknown customer stays New customer', rowsOf('Orders')[4][col('Orders', 'Customer')] === 'New customer', rowsOf('Orders')[4][col('Orders', 'Customer')]);

// 5. requests go to "New requests = yes" recipients
mails.length = 0;
post({ type: 'lead', kind: 'kenya', consent: true, lang: 'en', page: 'p', fields: { Name: 'Esther', 'Phone / WhatsApp': '+254 700 1', 'City in Kenya': 'Nairobi', 'What do you need?': 'Fridge' } });
ok('request alert goes to "New requests = yes" recipients', mails[0] && mails[0].to === 'inbox@kreislo.test,ben@kreislo.test', mails[0] && mails[0].to);

// 6. test mode: everything to one address, real recipient in the subject
setSetting('Test mode: send every email to', 'me@kreislo.test'); mails.length = 0;
post({ orderId: 'WAS-261111-100003', method: 'order', customer: Object.assign({}, cust, { email: 'nina@example.com', phone: '+49 1' }), items: [{ id: '111', qty: 1 }] });
ok('test mode: both emails redirected, subject names the real recipient', mails.length === 2 && mails.every(m => m.to === 'me@kreislo.test') && mails.some(m => /^\[TEST → nina@example\.com\]/.test(m.subject)) && mails.some(m => /^\[TEST → inbox@kreislo\.test,anna@kreislo\.test\]/.test(m.subject)), mails.map(m => m.to + ' | ' + m.subject).join(' ; '));
setSetting('Test mode: send every email to', '');
rowsOf('Orders').splice(5, 1); // drop that test order again

// 7. payment reminder: unpaid bank-transfer order, 4 days old
const O = rowsOf('Orders'), c = h => col('Orders', h);
const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(10, 0, 0, 0); return d; };
O[1][c('Received')] = daysAgo(4); O[2][c('Received')] = daysAgo(1); O[3][c('Received')] = daysAgo(1); O[3][c('Status')] = 'Paid'; O[4][c('Received')] = daysAgo(1);
S('Order lines').rows.forEach((l, i) => { if (i && l[0] === 'FRI-261111-100000') l[1] = daysAgo(1); if (i && l[0] === 'WAS-261110-100000') l[1] = daysAgo(4); });
mails.length = 0; S('Orders').active = 2; ctx.menuSendReminder();
const rem = mails[0];
ok('reminder: sent to the buyer with order, amount, bank details and reference', rem && rem.to === 'grace@example.com' && /reminder for order #WAS-261110-100000/.test(rem.subject) && /Sparkasse Gießen/.test(rem.htmlBody) && /WAS-261110-100000/.test(rem.htmlBody) && /190,00 €/.test(rem.htmlBody) && /4 days ago/.test(rem.htmlBody), rem && rem.subject);
ok('reminder: "Reminder sent" cell filled, menu confirms', O[1][c('Reminder sent')] instanceof Date && /Reminder for order WAS-261110-100000 sent/.test(ctx.__alerts[ctx.__alerts.length - 1]), String(O[1][c('Reminder sent')]));
S('Orders').active = 4; mails.length = 0; ctx.menuSendReminder();
ok('reminder refused for a paid order', mails.length === 0 && /already paid/.test(ctx.__alerts[ctx.__alerts.length - 1]), ctx.__alerts[ctx.__alerts.length - 1]);
fs.writeFileSync(out + '/r5-reminder.html', rem.htmlBody);

// 8. daily report: yesterday's orders, unpaid list, requests, questions
S('Requests').rows[1][0] = daysAgo(1);
S('Questions') || (sheets['Questions'] = mkSheet('Questions', [['Received', 'Question', 'Language', 'Page', 'Added to the assistant?']]));
S('Questions').appendRow([daysAgo(2), 'Do you ship to Uganda?', 'en', 'p', 'No']);
S('Newsletter').appendRow([daysAgo(1), 'sub@example.com', 'Subscribed', daysAgo(1), 'en', 'p', 'tok']);
setSetting('Payment reminder after (days)', '3');
mails.length = 0; const dres = ctx.sendDailyReport(); const daily = mails[0];
ok('daily report goes to "Daily report = yes" recipients', daily.to === 'inbox@kreislo.test,anna@kreislo.test', daily.to);
ok('daily: 2 website orders yesterday (paid ebook + fridge), revenue 252,90 €, WhatsApp order flagged', /2 orders, 252,90 €/.test(daily.subject) && /FRI-261111-100000/.test(daily.htmlBody) && /EBO-261111-100001/.test(daily.htmlBody) && /1 order started on WhatsApp/.test(daily.htmlBody), daily.subject);
ok('daily: returning customer marked on the card', /↩︎ 2nd order/.test(daily.htmlBody), '');
ok('daily: unpaid 3+ days lists WAS-261110 with "reminded", 1 unpaid in subject', /Unpaid for 3\+ days/.test(daily.htmlBody) && /WAS-261110-100000/.test(daily.htmlBody) && /reminded/.test(daily.htmlBody) && /1 unpaid/.test(daily.subject), '');
ok('daily: request, newsletter total and open chat question', /Kenya shipment/.test(daily.htmlBody) && /1 new sign-up, 1 subscribed in total/.test(daily.htmlBody) && /without an answer: 1 \(latest: “Do you ship to Uganda\?”\)/.test(daily.htmlBody), '');
fs.writeFileSync(out + '/r5-daily.html', daily.htmlBody);

// 9. weekly report: this week vs last, top products, countries
O.push(['OLD-261101-1', daysAgo(10), 'Paid', 'Website', 'PayPal', 'Old', "'+49 2", 'old@example.com', 's', 'pc', 'Berlin', 'Germany', '', '1 x Fridge @ 240.00', 240, 0, 240, 'EUR', 'de', 'p', 'DHL', '', 60, 'n/a', 'New customer', '']);
S('Order lines').appendRow(['OLD-261101-1', daysAgo(10), 'Fridge', '', 1, 240, 240, "'333", 'u', 'Physical']);
mails.length = 0; ctx.sendWeeklyReport(); const weekly = mails[0];
ok('weekly report goes to "Weekly report = yes" recipients', weekly.to === 'inbox@kreislo.test,ben@kreislo.test', weekly.to);
ok('weekly: revenue 442,90 € from 3 orders, +85% vs last week (240)', /442,90 € from 3 orders \(\+85%\)/.test(weekly.subject), weekly.subject);
ok('weekly: top products, country revenue, methods, languages, payment', /Top products/.test(weekly.htmlBody) && /Washing machine/.test(weekly.htmlBody) && /Revenue by country/.test(weekly.htmlBody) && /How people ordered/.test(weekly.htmlBody) && /WhatsApp/.test(weekly.htmlBody) && /Shop language/.test(weekly.htmlBody) && /Payment/.test(weekly.htmlBody), '');
ok('weekly: 2 returning customers and unpaid warning', /2 returning/.test(weekly.htmlBody) && /still unpaid for 3\+ days/.test(weekly.htmlBody), '');
fs.writeFileSync(out + '/r5-weekly.html', weekly.htmlBody);

// 10. an old sheet without Recipients/Settings tabs still works (owner fallback, defaults)
delete sheets['Recipients']; delete sheets['Settings']; ctx.settingsCache_ = null; mails.length = 0;
post({ orderId: 'WAS-261111-100009', method: 'order', customer: Object.assign({}, cust, { email: 'zoe@example.com', phone: '+49 9' }), items: [{ id: '111', qty: 1 }] });
ok('no Recipients/Settings tabs: alert falls back to the owner from the code, order still saved', mails.some(m => m.to === 'boss@kreislo.test' && /New order/.test(m.subject)), mails.map(m => m.to).join(','));

const fails = results.filter(r => r[0] === 'FAIL');
results.forEach(r => console.log(r[0], r[1], r[0] === 'FAIL' ? '→ ' + r[2] : ''));
console.log(`\n${results.length - fails.length}/${results.length} passed`);
process.exit(fails.length ? 1 : 0);
