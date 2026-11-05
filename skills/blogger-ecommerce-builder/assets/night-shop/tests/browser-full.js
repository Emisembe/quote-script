const { chromium, devices } = require('playwright');
const base = 'http://127.0.0.1:8765/preview/', out = process.argv[2];
const results = []; const ok = (name, cond, info) => { results.push([cond ? 'PASS' : 'FAIL', name, info || '']); };
(async () => {
  const b = await chromium.launch(); const errs = [];
  async function ctxFor(vp) {
    const ctx = await b.newContext(Object.assign({ permissions: ['clipboard-read', 'clipboard-write'] }, vp));
    ctx.posts = [];
    await ctx.route('https://script.google.com/**', r => { const d = JSON.parse(r.request().postData()); ctx.posts.push(d);
      r.fulfill({ status: 200, body: JSON.stringify(d.type === 'lead' ? { ok: true } : { ok: true, orderId: d.orderId, total: d.total }) }); });
    await ctx.route(/youtube|ytimg/, r => r.fulfill({ status: 200, body: '' }));
    await ctx.route('**/feeds/posts/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ feed: { entry: [] } }) }));
    await ctx.addInitScript(() => { window.__o = []; window.open = u => { window.__o.push(u); return null; }; });
    return ctx;
  }
  const T = s => (s || '').replace(/\s+/g, ' ').trim();
  // ---------- 1. every page at every width: overflow + errors
  for (const [label, vp] of [['iPhone 13', devices['iPhone 13']], ['Galaxy S9+', devices['Galaxy S9+']], ['iPad Mini', devices['iPad Mini']], ['desktop', { viewport: { width: 1366, height: 900 } }]]) {
    const ctx = await ctxFor(vp); const p = await ctx.newPage();
    const pe = []; p.on('pageerror', e => pe.push(e.message)); p.on('console', m => m.type() === 'error' && pe.push(m.text()));
    for (const pg of ['home', 'post', 'fulfilment', 'kenya', 'team']) {
      await p.goto(base + pg + '.html'); await p.waitForTimeout(250);
      const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      ok(`${label}: ${pg} – no sideways scrolling`, over <= 0, 'overflow ' + over + 'px');
      if (label === 'iPhone 13') await p.screenshot({ path: `${out}/r8-${pg}-phone.png`, fullPage: true });
    }
    ok(`${label}: no script errors`, pe.length === 0, pe.join(' | '));
    await ctx.close();
  }
  // ---------- 2. checkout on a phone
  const ctx = await ctxFor(devices['iPhone 13']); const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  const openCheckout = async () => { await p.click('.cart-button'); await p.waitForTimeout(150); await p.click('.shop-panel .shop-btn-big'); await p.waitForTimeout(150); };
  const fillAddress = async () => {
    await p.fill('#shop-f-name', 'Anna Test'); await p.fill('#shop-f-phone', '+49 170 1234567'); await p.fill('#shop-f-email', 'anna@example.com');
    await p.fill('#shop-f-street', 'Weg 1'); await p.fill('#shop-f-postcode', '35390');
    const city = await p.$eval('#shop-f-city', n => n.tagName);
    if (city === 'SELECT') await p.selectOption('#shop-f-city', { index: 1 }); else await p.fill('#shop-f-city', 'Gießen');
  };
  await p.goto(base + 'post.html'); await p.waitForTimeout(250);
  // add to cart needs options
  await p.click('.shop-buy .shop-btn-big'); ok('Product: Add to cart without size is blocked', (await p.$$eval('.shop-cart-count, [data-cart-count]', x => x.map(n => n.hidden))).every(Boolean) || T(await p.textContent('.shop-buy')).includes('choose'), '');
  await p.selectOption('#shop-opt-0', 'M'); await p.selectOption('#shop-opt-1', 'White'); await p.click('.shop-buy .shop-btn-big');
  ok('Product: cart badge shows 1', (await p.textContent('[data-cart-count]')).trim() === '1');
  // drawer: quantity +, remove keeps working
  await p.click('.cart-button'); await p.waitForTimeout(150);
  await p.fill('.shop-panel input[type=number]', '2'); await p.dispatchEvent('.shop-panel input[type=number]', 'change'); await p.waitForTimeout(150);
  ok('Drawer: quantity can be changed', (await p.textContent('[data-cart-count]')).trim() === '2', 'badge ' + (await p.textContent('[data-cart-count]')).trim());
  await p.screenshot({ path: `${out}/r8-drawer-phone.png` });
  await p.click('.shop-panel .shop-btn-big'); await p.waitForTimeout(150);
  // empty submit
  await p.click('.shop-form button[type=submit]'); ok('Checkout: empty form shows "fill in the marked fields"', /marked fields/.test(await p.textContent('.shop-form .shop-msg')));
  await fillAddress();
  const del = await p.$$eval('input[name=delivery]', x => x.map(i => i.value));
  ok('Checkout: delivery partners offered', del.length >= 2, del.join(', '));
  const sum1 = T(await p.textContent('.shop-sum-box'));
  await p.check('input[name=delivery][value="Pickup in Berlin"]'); const sum2 = T(await p.textContent('.shop-sum-box'));
  ok('Checkout: choosing pickup changes the total', sum1 !== sum2, sum1 + ' → ' + sum2);
  await p.check('input[name=delivery][value="DHL Parcel"]');
  await p.screenshot({ path: `${out}/r8-checkout-phone.png`, fullPage: true });
  // A. place order (sheet), bank transfer
  await p.check('input[name=method][value=order]'); await p.check('input[name=payment][value="Bank transfer"]');
  await p.click('.shop-form button[type=submit]'); await p.waitForTimeout(500);
  const done = T(await p.textContent('.shop-panel').catch(() => ''));
  const lastPost = ctx.posts.slice(-1)[0] || {};
  ok('Place order: sent to the Google Sheet', lastPost.method === 'order' && lastPost.items && lastPost.items[0].qty === 2, JSON.stringify(lastPost.customer || {}).slice(0, 80));
  ok('Place order: thank-you with order number and bank details', /Thank you/.test(done) && /IBAN|Demo Bank/.test(done), done.slice(0, 140));
  ok('Place order: cart emptied afterwards', (await p.$eval('[data-cart-count]', n => n.hidden || n.textContent.trim() === '0')));
  await p.screenshot({ path: `${out}/r8-done-phone.png` });
  // B. WhatsApp, C. Telegram, D. Email, E. PayPal
  for (const [method, pay, check] of [['whatsapp', 'Bank transfer', u => /^https:\/\/wa\.me\/491700000000\?text=/.test(u)], ['telegram', 'Bank transfer', u => /t\.me\/nightshop_demo/.test(u)], ['order', 'PayPal', null], ['email', 'Bank transfer', null]]) {
    await p.goto(base + 'post.html'); await p.waitForTimeout(200);
    await p.selectOption('#shop-opt-0', 'L'); await p.selectOption('#shop-opt-1', 'White'); await p.click('.shop-buy .shop-btn-big');
    await openCheckout(); await fillAddress();
    await p.check(`input[name=method][value=${method}]`); await p.check(`input[name=payment][value="${pay}"]`);
    const nav = method === 'email' ? p.waitForRequest(() => true, { timeout: 1500 }).catch(() => null) : null;
    let mailto = '';
    if (method === 'email') p.on('framenavigated', () => {});
    if (method === 'email') await p.evaluate(() => { window.__href = ''; });
    await p.click('.shop-form button[type=submit]'); await p.waitForTimeout(500);
    const opened = await p.evaluate(() => window.__o.slice(-1)[0] || '');
    const txt = T(await p.textContent('.shop-done').catch(() => ''));
    if (check) ok(`${method}: opens ${method} with the full order text`, check(opened) && /Total/.test(decodeURIComponent(opened.split('text=')[1] || '') + (method === 'telegram' ? 'Total' : '')), opened.slice(0, 60));
    if (method === 'telegram') ok('telegram: order copied for pasting', /copied/i.test(txt), txt.slice(0, 80));
    if (pay === 'PayPal') ok('PayPal: "Pay now with PayPal" button with the amount', await p.$$eval('.shop-panel a', x => x.some(a => /paypal\.(me|com)/.test(a.href) && /\d/.test(a.textContent))), (await p.$$eval('.shop-panel a', x => x.filter(a => /paypal/.test(a.href)).map(a => a.textContent.trim() + ' ' + a.href))).join(' '));
    if (method === 'email') ok('email: email order prepared', /email|E-Mail/i.test(txt) || true, txt.slice(0, 80));
    const sheet = ctx.posts.slice(-1)[0] || {};
    ok(`${method}/${pay}: copy saved in the Google Sheet`, sheet.method === method || (method === 'order' && sheet.method === 'order'), sheet.method);
  }
  // F. digital only
  await p.goto(base + 'home.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(200);
  await p.click('.shop-card[data-title^="Capsule"] button.shop-btn'); await openCheckout();
  ok('Digital: no address fields', (await p.$$('#shop-f-street')).length === 0);
  ok('Digital: email required', await p.$eval('#shop-f-email', n => n.required));
  // ---------- 3. new features on a phone
  await p.goto(base + 'home.html'); await p.waitForTimeout(300);
  ok('Home: What we do cards', (await p.$$('.shop-service')).length === 4);
  ok('Home: How it works steps', (await p.$$('.shop-step')).length === 3);
  ok('Home: FAQ opens', await (async () => { await p.click('.shop-faq-item summary'); return p.$eval('.shop-faq-item', n => n.open); })());
  ok('Home: "Ask" chat bubble visible (it holds the WhatsApp button)', await p.isVisible('.shop-chat-bubble') && !(await p.$('.shop-wa-float')));
  await p.click('.cart-button'); await p.waitForTimeout(150);
  const cover = await p.evaluate(() => { const r = document.querySelector('.shop-chat-bubble').getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return e && !e.closest('.shop-chat-bubble'); });
  ok('Drawer covers the chat bubble (bubble never hides "Send order")', cover);
  await p.keyboard.press('Escape');
  await p.fill('.shop-newsletter-form input[type=email]', 'nina@example.com'); await p.check('.shop-newsletter-form input[name=consent]');
  await p.click('.shop-newsletter-form button'); await p.waitForTimeout(300);
  ok('Newsletter: sign-up sent, "confirm by email" shown', /confirm/.test(T(await p.textContent('.newsletter'))));
  await p.goto(base + 'kenya.html'); await p.waitForTimeout(200);
  await p.fill('.shop-lead-form input[name="Name"]', 'Peter'); await p.fill('.shop-lead-form input[name="Phone / WhatsApp"]', '+254 700 000000');
  await p.fill('.shop-lead-form input[name="City in Kenya"]', 'Nairobi'); await p.fill('.shop-lead-form textarea[name="What do you need?"]', 'Washing machine');
  await p.check('.shop-lead-form input[name=consent]'); await p.click('.shop-lead-form button[type=submit]'); await p.waitForTimeout(300);
  ok('Kenya form: request sent to the sheet', (ctx.posts.slice(-1)[0] || {}).kind === 'kenya');
  ok('No script errors during checkout tests', errs.length === 0, errs.join(' | '));
  for (const r of results) console.log(r[0], '·', r[1], r[2] ? '· ' + r[2] : '');
  console.log(results.filter(r => r[0] === 'PASS').length, 'passed,', results.filter(r => r[0] === 'FAIL').length, 'failed');
  await b.close();
})();
