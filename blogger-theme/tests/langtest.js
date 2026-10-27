// Run: node blogger-theme/tests/<file>.js   (after: python3 scripts/build.py && python3 scripts/preview.py)
// Needs Playwright + Chromium. Font Awesome 4.7 is optional: set FA=/path/to/font-awesome/package for icons in screenshots.
// Language switcher + office contact cards on the EFIC theme previews.
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node-tools/node_modules/playwright'); } })();
const path = require('path'), fs = require('fs');
const S = __dirname;
const FA = process.env.FA || S + '/fa', PV = require('path').join(__dirname, '..', 'preview') + '/';
const R = []; const ok = (c, m) => R.push((c ? 'PASS ' : 'FAIL ') + m);
const HOME = fs.readFileSync(PV + 'home.html', 'utf8'), POST = fs.readFileSync(PV + 'post.html', 'utf8');
// Stand-in for Google's element.js: translates per the googtrans cookie, like the real one.
const FAKE = `window.google={translate:{TranslateElement:function(o,id){window.__opts=o;var m=document.cookie.match(/googtrans=\\/en\\/([a-z-]+)/);if(!m)return;
 var l=m[1];document.documentElement.classList.add(l==='ar'?'translated-rtl':'translated-ltr');window.__to=l;
 document.querySelectorAll('.contact-title h4, #office-contacts h2.title, .office-dir').forEach(function(e){if(!e.closest('.notranslate'))e.textContent='['+l+'] '+e.textContent;});}}};
 setTimeout(function(){window.googleTranslateElementInit();},0);`;

(async () => {
  const b = await chromium.launch({executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', proxy: {server: process.env.HTTPS_PROXY}});
  async function ctx(w, opts = {}) {
    const c = await b.newContext({viewport: {width: w, height: 800}, ignoreHTTPSErrors: true});
    const reqs = [];
    c.on('request', r => reqs.push(r.url()));
    await c.route(/font-awesome\.min\.css/, r => fs.existsSync(FA) ? r.fulfill({path: path.join(FA, 'css/font-awesome.min.css'), contentType: 'text/css'}) : r.fulfill({body: ''}));
    await c.route(/\/fonts\/fontawesome-webfont/, r => fs.existsSync(FA) ? r.fulfill({path: path.join(FA, 'fonts', new URL(r.request().url()).pathname.split('/').pop())}) : r.fulfill({body: ''}));
    await c.route(/youtube\.com|google\.com\/maps|googleusercontent|fonts\.googleapis\.com\/css2\?family=Cairo/, r => r.fulfill({body: '', contentType: 'text/css'}));
    await c.route(/translate\.google\.com\/translate_a\/element\.js/, r => opts.blockGoogle ? r.abort() : r.fulfill({body: FAKE, contentType: 'application/javascript'}));
    await c.route(/^https:\/\/[^/]*(blogspot\.com|translate\.goog)\//, r => {
      const u = new URL(r.request().url());
      if (r.request().resourceType() !== 'document') return r.fulfill({body: ''});
      return r.fulfill({contentType: 'text/html', body: u.pathname.length > 1 ? POST : HOME});
    });
    const p = await c.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message));
    return {c, p, errs, reqs};
  }
  const settle = p => p.waitForLoadState('networkidle').then(() => p.waitForTimeout(400));
  const pick = async (p, l) => { await Promise.all([p.waitForNavigation({timeout: 20000}).catch(() => {}), p.selectOption('#lang-select', l)]); await settle(p); };

  // 1. Placement at every width: visible, inside the bar, no overlap with logo or hamburger
  for (const w of [320, 360, 390, 768, 1024, 1180, 1200, 1280, 1366, 1440, 1920]) {
    const {c, p, errs} = await ctx(w);
    await p.goto('https://eficc.blogspot.com/', {waitUntil: 'networkidle'}); await p.waitForTimeout(400);
    const m = await p.evaluate(() => {
      const r = e => e && e.getBoundingClientRect(), hit = (a, b) => a && b && b.width > 0 && !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
      const sw = r(document.querySelector('.lang-switch select')), bar = r(document.querySelector('.tm-menu'));
      const logo = r(document.querySelector('#menu-logo img')), burger = r(document.querySelector('.tm-menu .slicknav_btn'));
      const items = [...document.querySelectorAll('#nav1 > li')].filter(li => li.offsetParent).map(li => Math.round(li.getBoundingClientRect().top));
      const lastItem = r([...document.querySelectorAll('#nav1 > li')].filter(li => li.offsetParent).pop());
      return {sw: document.documentElement.scrollWidth, iw: innerWidth, vis: sw.width > 40, inBar: sw.top >= bar.top && sw.bottom <= bar.bottom,
        logo: hit(sw, logo), burger: hit(sw, burger), menu: hit(sw, lastItem), oneRow: new Set(items).size <= 1, right: Math.round(sw.right)};
    });
    ok(m.sw <= m.iw && m.vis && m.inBar && !m.logo && !m.burger && !m.menu && m.oneRow && !errs.length,
      `@${w}: switcher visible in the bar, clear of logo/menu/hamburger, menu on one row, no sideways scroll (${m.sw}/${m.iw}) ${JSON.stringify(m)} ${errs.join(';')}`);
    if (w === 390 || w === 1440 || w === 320) await p.screenshot({path: `${S}/shots/lang-bar-${w}.png`, clip: {x: 0, y: 0, width: w, height: 80}});
    await c.close();
  }

  // 2. Translation via Google's script (stand-in), cookie persistence, Arabic RTL, back to English
  {
    const {c, p, errs, reqs} = await ctx(1440);
    await p.goto('https://eficc.blogspot.com/', {waitUntil: 'networkidle'}); await p.waitForTimeout(300);
    ok(await p.inputValue('#lang-select') === 'en' && !reqs.some(u => /translate_a\/element/.test(u)), 'English visitors: Google script not loaded at all');
    await pick(p, 'sw');
    const sw = await p.evaluate(() => ({cls: document.documentElement.className, to: window.__to, inc: window.__opts && window.__opts.includedLanguages, val: document.getElementById('lang-select').value,
      title: document.querySelector('.contact-title h4').textContent, name: document.querySelector('#header h1').className, addr: document.querySelector('.office-address .notranslate').textContent}));
    ok(sw.to === 'sw' && /translated-ltr/.test(sw.cls) && sw.val === 'sw' && sw.inc === 'en,sw,de,fr,ar', 'Kiswahili: page translated, switcher shows Kiswahili ' + JSON.stringify({to: sw.to, inc: sw.inc}));
    ok(/^\[sw\]/.test(sw.title) && /notranslate/.test(sw.name) && !/^\[/.test(sw.addr), 'headings translated; company name and addresses kept as written');
    await p.goto('https://eficc.blogspot.com/2026/03/iso-9001.html', {waitUntil: 'networkidle'}); await p.waitForTimeout(400);
    ok(await p.evaluate(() => window.__to) === 'sw' && await p.inputValue('#lang-select') === 'sw', 'choice is remembered on the next page');
    await pick(p, 'ar');
    const ar = await p.evaluate(() => ({cls: document.documentElement.className, dir: getComputedStyle(document.querySelector('.post-body')).direction,
      align: getComputedStyle(document.querySelector('.post-body')).textAlign, font: !!document.querySelector('link[href*="family=Cairo"]'),
      sw: document.documentElement.scrollWidth, iw: innerWidth}));
    ok(/efic-rtl/.test(ar.cls) && /translated-rtl/.test(ar.cls) && ar.dir === 'rtl' && ar.align === 'right' && ar.font && ar.sw <= ar.iw, 'Arabic: right-to-left text, Arabic font loaded, no sideways scroll ' + JSON.stringify(ar));
    await p.screenshot({path: `${S}/shots/lang-arabic-post.png`});
    const before = reqs.length;
    await pick(p, 'en');
    const en = await p.evaluate(() => ({cls: document.documentElement.className, cookie: document.cookie, val: document.getElementById('lang-select').value}));
    ok(!/translated|efic-rtl/.test(en.cls) && !/googtrans=\/en/.test(en.cookie) && en.val === 'en' && !reqs.slice(before).some(u => /translate_a\/element/.test(u)), 'back to English: original page, cookie cleared, no Google script');
    ok(!errs.length, 'no JS errors: ' + (errs.join('; ') || 'none'));
    await c.close();
  }

  // 3. Google script unavailable -> same page through translate.goog, and back
  {
    const {c, p, errs} = await ctx(1440, {blockGoogle: true});
    await p.goto('https://eficc.blogspot.com/2026/03/iso-9001.html?m=1', {waitUntil: 'networkidle'}); await p.waitForTimeout(300);
    await p.selectOption('#lang-select', 'de');
    await p.waitForURL(/translate\.goog/, {timeout: 20000}); await settle(p);
    const u1 = p.url();
    ok(u1 === 'https://eficc-blogspot-com.translate.goog/2026/03/iso-9001.html?m=1&_x_tr_sl=en&_x_tr_tl=de&_x_tr_hl=de', 'fallback opens the same page through Google Translate: ' + u1);
    ok(await p.inputValue('#lang-select') === 'de', 'switcher shows Deutsch on the translated page');
    await pick(p, 'fr');
    ok(p.url() === 'https://eficc-blogspot-com.translate.goog/2026/03/iso-9001.html?m=1&_x_tr_sl=en&_x_tr_tl=fr&_x_tr_hl=fr', 'switching language there stays on translate.goog: ' + p.url());
    await pick(p, 'en');
    ok(p.url() === 'https://eficc.blogspot.com/2026/03/iso-9001.html?m=1', 'English returns to the blog itself: ' + p.url());
    await p.selectOption('#lang-select', 'sw');
    await p.waitForURL(/translate\.goog/, {timeout: 20000});
    ok(/_x_tr_tl=sw/.test(p.url()), 'after one failure, later choices go straight to translate.goog');
    ok(!errs.length, 'fallback: no JS errors ' + errs.join('; '));
    await c.close();
  }
  // Blog addresses with hyphens are encoded the way translate.goog expects
  {
    const {c, p} = await ctx(1440, {blockGoogle: true});
    await p.goto('https://my-efic.blogspot.com/', {waitUntil: 'networkidle'});
    await p.selectOption('#lang-select', 'fr'); await p.waitForURL(/translate\.goog/, {timeout: 20000}); await settle(p);
    ok(p.url().startsWith('https://my--efic-blogspot-com.translate.goog/?_x_tr_sl=en&_x_tr_tl=fr'), 'hyphenated blog address: ' + p.url());
    await pick(p, 'en');
    ok(p.url() === 'https://my-efic.blogspot.com/', 'and back: ' + p.url());
    await c.close();
  }

  // 4. Office contact cards
  for (const w of [1440, 390, 320]) {
    const {c, p, errs} = await ctx(w);
    await p.goto('https://eficc.blogspot.com/', {waitUntil: 'networkidle'}); await p.waitForTimeout(300);
    const cards = await p.evaluate(() => [...document.querySelectorAll('#office-contacts .office-card')].map(cd => ({
      title: cd.querySelector('h2.title').textContent, rows: [...cd.querySelectorAll('.office-row')].map(r => r.className.replace('office-row ', '').replace(' notranslate', '')),
      links: [...cd.querySelectorAll('a')].map(a => a.getAttribute('href')), keep: [...cd.querySelectorAll('.office-email, .office-phone, .office-whatsapp, .office-address .notranslate')].every(e => /notranslate/.test(e.className)),
      box: (r => ({l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width)}))(cd.getBoundingClientRect())})));
    const sw = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (w === 1440) {
      const [h, m] = cards;
      ok(h && h.title === 'Head Office' && h.rows.join() === 'office-address,office-email,office-whatsapp' && h.links.includes('mailto:askeficc@gmail.com') && h.links.includes('https://wa.me/491233547892')
        && h.links.some(x => x.startsWith('https://www.google.com/maps/search/?api=1&query=Tubman%20St.')), 'Head Office card: address + directions, email link, WhatsApp link ' + JSON.stringify(h));
      ok(m && m.rows.join() === 'office-address,office-email,office-phone,office-hours' && m.links.includes('tel:+254700000000') && m.links.includes('mailto:mombasa@example.com'), 'branch added as a Text gadget: address, email, click-to-call, hours ' + JSON.stringify(m));
      ok(cards.every(x => x.keep), 'addresses, emails and phone numbers are never translated');
      ok(h.box.t === m.box.t && h.box.l < m.box.l, 'two offices side by side on desktop');
      await p.locator('.office-contacts-wrap').screenshot({path: `${S}/shots/offices-1440.png`});
    } else {
      ok(sw <= 0 && cards[0].box.t < cards[1].box.t && cards.every(x => x.box.w <= w - 30), `@${w}: offices stacked, no sideways scroll`);
      if (w === 390) await p.locator('.office-contacts-wrap').screenshot({path: `${S}/shots/offices-390.png`});
    }
    ok(!errs.length, `cards @${w}: no JS errors ${errs.join('; ')}`);
    await c.close();
  }
  // A gadget with a map or image is left exactly as typed
  {
    const {c, p} = await ctx(1440);
    await c.route(/^https:\/\/eficc\.blogspot\.com\/$/, r => r.fulfill({contentType: 'text/html', body: HOME.replace("Mombasa Branch (sample)</h2><div class='widget-content'>", "Mombasa Branch (sample)</h2><div class='widget-content'><img alt='map' src='data:image/gif;base64,R0lGODlhAQABAAAAACw='>")}));
    await p.goto('https://eficc.blogspot.com/', {waitUntil: 'networkidle'});
    ok(await p.evaluate(() => !!document.querySelector('#Text1 img') && !document.querySelector('#Text1 .office-row')), 'gadget with an image is left as typed');
    await c.close();
  }
  // 5. Layout: the new section can be edited
  {
    const {c, p} = await ctx(1440);
    await p.goto('file://' + PV + 'layout.html', {waitUntil: 'networkidle'});
    const l = await p.evaluate(() => { const s = document.querySelector('#office-contacts'); return s && {vis: s.offsetHeight > 0, head: s.querySelector('h4').textContent, gadget: s.querySelector('.layout-title').textContent, add: !!s.querySelector('.add_widget')}; });
    ok(l && l.vis && l.head === 'Office Contacts' && l.gadget === 'Head Office' && l.add, 'Layout shows "Office Contacts" with the Head Office gadget and Add a Gadget ' + JSON.stringify(l));
    await p.locator('#office-contacts').screenshot({path: `${S}/shots/layout-offices.png`});
    await c.close();
  }
  await b.close();
  console.log(R.join('\n')); console.log(R.filter(r => r.startsWith('PASS')).length + '/' + R.length + ' passed');
})().catch(e => { console.log(R.join('\n')); console.error(e); process.exit(1); });
