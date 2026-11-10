// Browser checks for the preview pages: layout overflow, JS errors, menu, slider,
// lightbox, mobile centring, screenshots. Run: node scripts/preview_test.js <baseUrl> <outDir>
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:8765';
const out = process.argv[3] || 'shots';
const fs = require('fs');
fs.mkdirSync(out, { recursive: true });
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } : undefined;
const results = [];
const ok = (cond, label, detail) => { results.push((cond ? 'ok    ' : 'FAIL  ') + label + (cond || !detail ? '' : ' -- ' + detail)); };

(async () => {
  const browser = await chromium.launch({ proxy });
  for (const page of ['home', 'post', 'label', 'search', '404']) {
    for (const width of [1440, 1024, 820, 390, 320]) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
      // Blogger-hosted photos used in sample posts are served from the local placeholders
      await ctx.route('**/blogger.googleusercontent.com/**', route => {
        const m = route.request().url().match(/\/(ph-\d+)\//);
        const file = require('path').join(__dirname, '..', 'preview', 'img', (m ? m[1] : 'ph-1') + '.svg');
        route.fulfill({ status: 200, contentType: 'image/svg+xml', body: fs.readFileSync(file) });
      });
      const p = await ctx.newPage();
      const errors = [];
      p.on('pageerror', e => errors.push(e.message));
      p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
      await p.goto(`${base}/${page}.html`, { waitUntil: 'networkidle' });
      await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 110)); } window.scrollTo({ top: 0, behavior: 'instant' }); });
      await p.waitForTimeout(900);
      const sw = await p.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
      ok(sw[0] <= sw[1], `${page}@${width}: no horizontal scroll`, `scrollWidth ${sw[0]} > ${sw[1]}`);
      ok(errors.length === 0, `${page}@${width}: no JS errors`, errors.join(' | '));
      const h1 = await p.evaluate(() => [...document.querySelectorAll('h1')].filter(h => h.offsetParent !== null || h.classList.contains('sr-only')).filter(h => getComputedStyle(h).display !== 'none' && h.closest('[style*="display: none"]') === null).map(h => h.textContent.trim()));
      const visibleH1 = await p.evaluate(() => [...document.querySelectorAll('h1')].filter(h => { let e = h; while (e) { if (getComputedStyle(e).display === 'none') return false; e = e.parentElement; } return true; }).length);
      ok(visibleH1 === 1, `${page}@${width}: exactly one h1`, `found ${visibleH1}`);
      if (width >= 1100) {
        const wrap = await p.evaluate(() => {
          const inner = document.querySelector('.header-inner');
          const tall = [...document.querySelectorAll('.menu > li > a, .header-cta .btn')].filter(a => a.offsetParent && a.getBoundingClientRect().height > 50).map(a => a.textContent.trim());
          return { overflow: inner.scrollWidth > inner.clientWidth + 1, tall };
        });
        ok(!wrap.overflow && wrap.tall.length === 0, `${page}@${width}: header menu fits on one line`, JSON.stringify(wrap));
        if (page === 'home') {
          // A longer menu (like the live site: 9 items and a wide logo) must switch to the hamburger, not wrap
          const res = await p.evaluate(async () => {
            const menu = document.querySelector('.menu');
            ['Contact', 'The Emisembe Report', 'Volunteer opportunities'].forEach(t => { const li = document.createElement('li'); li.innerHTML = '<a href="#">' + t + '</a>'; menu.appendChild(li); });
            window.dispatchEvent(new Event('resize'));
            await new Promise(r => setTimeout(r, 300));
            const inner = document.querySelector('.header-inner');
            return { collapsed: document.documentElement.classList.contains('nav-collapse'), overflow: inner.scrollWidth > inner.clientWidth + 1,
                     toggle: getComputedStyle(document.getElementById('nav-toggle')).display };
          });
          ok(res.collapsed ? res.toggle !== 'none' && !res.overflow : !res.overflow, `home@${width}: long menu collapses to the hamburger instead of wrapping`, JSON.stringify(res));
          if (width === 1440) await p.screenshot({ path: `${out}/long-menu-1440.png`, clip: { x: 0, y: 0, width: 1440, height: 120 } });
          await p.reload({ waitUntil: 'networkidle' });
          await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 110)); } window.scrollTo({ top: 0, behavior: 'instant' }); });
          await p.waitForTimeout(600);
        }
      }
      // Photos are never cropped: every framed image uses object-fit: contain and fits inside its frame
      const crop = await p.evaluate(() => [...document.querySelectorAll('.fit-frame img, .post-body img.post-photo')]
        .filter(i => i.offsetParent && getComputedStyle(i).objectFit !== 'contain' && !i.classList.contains('post-photo'))
        .map(i => i.className || i.src.slice(-30)));
      ok(crop.length === 0, `${page}@${width}: framed photos show the whole picture`, crop.join(', '));
      if ([1440, 820, 390].includes(width)) {
        await p.screenshot({ path: `${out}/${page}-${width}.png`, fullPage: true });
      }
      if (page === 'home' && width <= 414) {
        const gaps = await p.evaluate(() => {
          const bad = [];
          document.querySelectorAll('.section-title, .hero-slides .widget.is-active .slide-title, .card-grid .widget, .btn-row, .footer-title, .post-card').forEach(e => {
            const r = e.getBoundingClientRect();
            if (!r.width || getComputedStyle(e).display === 'none') return;
            const st = getComputedStyle(e);
            const l = r.left, rr = window.innerWidth - r.right;
            if (Math.abs(l - rr) > 2) bad.push(`${e.className.split(' ')[0]} ${Math.round(l)}/${Math.round(rr)}`);
          });
          return bad;
        });
        ok(gaps.length === 0, `home@${width}: blocks are centred`, gaps.slice(0, 6).join(', '));
      }
      if (page === 'home' && width === 390) {
        // menu: open, Escape, link click, resize to desktop
        await p.click('#nav-toggle');
        await p.waitForTimeout(400);
        ok(await p.evaluate(() => document.getElementById('site-header').classList.contains('nav-open')), 'menu opens');
        await p.screenshot({ path: `${out}/menu-open-390.png` });
        const sub = await p.$('.menu .sub-toggle');
        ok(!!sub, 'Projects has a dropdown built from "_" items');
        if (sub) { await sub.click(); await p.waitForTimeout(200); await p.screenshot({ path: `${out}/submenu-open-390.png` }); ok(await p.evaluate(() => !!document.querySelector('.has-sub.sub-open')), 'submenu opens on tap'); }
        await p.keyboard.press('Escape');
        ok(!(await p.evaluate(() => document.getElementById('site-header').classList.contains('nav-open'))), 'Escape closes menu');
        await p.click('#nav-toggle');
        await p.evaluate(() => document.addEventListener('click', e => { if (e.target.closest('a')) e.preventDefault(); }));
        await p.click('.menu a[href="/#contact"]');
        ok(!(await p.evaluate(() => document.getElementById('site-header').classList.contains('nav-open'))), 'link click closes menu');
        await p.click('#nav-toggle');
        await p.setViewportSize({ width: 1280, height: 900 });
        await p.waitForTimeout(200);
        ok(!(await p.evaluate(() => document.getElementById('site-header').classList.contains('nav-open'))), 'resize to desktop closes menu');
      }
      if (page === 'home' && width === 1440) {
        const n = await p.evaluate(() => document.querySelectorAll('.hero-dot').length);
        ok(n === 5, 'slider has 5 dots', String(n));
        await p.click('.hero-arrow[aria-label="Next slide"]');
        await p.waitForTimeout(1200);
        ok(await p.evaluate(() => document.querySelectorAll('#main-slider > .widget')[1].classList.contains('is-active') && document.querySelectorAll('#main-slider-images > .widget')[1].classList.contains('is-active')), 'next arrow shows slide 2 (text and picture)');
        await p.screenshot({ path: `${out}/home-slide2-1440.png` });
        await p.click('.gallery-link');
        await p.waitForTimeout(400);
        ok(await p.evaluate(() => document.getElementById('lightbox').classList.contains('is-open')), 'gallery opens lightbox');
        await p.screenshot({ path: `${out}/lightbox-1440.png` });
        await p.keyboard.press('ArrowRight');
        await p.keyboard.press('Escape');
        ok(!(await p.evaluate(() => document.getElementById('lightbox').classList.contains('is-open'))), 'Escape closes lightbox');
        const posts = await p.evaluate(() => [...document.querySelectorAll('.post-card')].filter(c => getComputedStyle(c).display !== 'none').length);
        ok(posts === 6, 'homepage shows 6 stories', String(posts));
        const hover = await p.$('.menu .has-sub');
        await hover.hover();
        await p.waitForTimeout(300);
        await p.screenshot({ path: `${out}/dropdown-1440.png`, clip: { x: 0, y: 0, width: 1440, height: 320 } });
        const ex = await p.evaluate(() => document.querySelector('.post-card-excerpt').textContent);
        ok(ex.length > 40 && !/</.test(ex), 'story cards get a plain-text excerpt', ex.slice(0, 60));
        const bg = await p.evaluate(() => getComputedStyle(document.getElementById('get-involved')).backgroundImage);
        ok(/ph-/.test(bg), 'photo band takes its background from its Image gadget', bg.slice(0, 80));
      }
      if (page === 'home' && (width === 1440 || width === 390)) {
        // Language switcher: a stand-in for Google's hidden drop-down records what the buttons ask for
        await p.setViewportSize({ width, height: 900 });
        await p.reload({ waitUntil: 'networkidle' });
        await p.evaluate(() => {
          const s = document.createElement('select'); s.className = 'goog-te-combo';
          ['', 'en', 'sw', 'fr', 'ar', 'de'].forEach(v => { const o = document.createElement('option'); o.value = v; s.appendChild(o); });
          s.addEventListener('change', () => { document.documentElement.classList.remove('translated-ltr', 'translated-rtl'); document.documentElement.classList.add(s.value === 'ar' ? 'translated-rtl' : 'translated-ltr'); });
          document.body.appendChild(s);
        });
        const order = await p.evaluate(() => [...document.querySelectorAll('#lang-menu [data-lang]')].map(b => b.getAttribute('data-lang')).join(','));
        ok(order === 'en,sw,fr,ar,de', `languages in order (${width})`, order);
        const footerLangs = await p.evaluate(() => document.querySelectorAll('.footer-langs [data-lang]').length);
        ok(footerLangs === 5, `footer has the 5 language buttons (${width})`, String(footerLangs));
        if (width === 390) { await p.click('#nav-toggle'); await p.waitForTimeout(400); }
        else { await p.click('.lang-current'); await p.waitForTimeout(250); ok(await p.evaluate(() => document.getElementById('lang-switch').classList.contains('is-open')), 'globe button opens the language menu'); await p.screenshot({ path: `${out}/lang-menu-1440.png`, clip: { x: 700, y: 0, width: 740, height: 360 } }); }
        await p.click('#lang-menu [data-lang="fr"]');
        await p.waitForTimeout(200);
        const fr = await p.evaluate(() => ({ combo: document.querySelector('.goog-te-combo').value, cookie: document.cookie, active: document.querySelector('#lang-menu .is-active') && document.querySelector('#lang-menu .is-active').getAttribute('data-lang'), code: document.querySelector('.lang-code').textContent, dir: document.documentElement.dir }));
        ok(fr.combo === 'fr' && /googtrans=\/en\/fr/.test(fr.cookie) && fr.active === 'fr' && fr.code === 'FR' && fr.dir === 'ltr', `French button translates via Google and remembers the choice (${width})`, JSON.stringify(fr));
        if (width === 390 && await p.evaluate(() => !document.getElementById('site-header').classList.contains('nav-open'))) { await p.click('#nav-toggle'); await p.waitForTimeout(400); }
        if (width === 1440) { await p.click('.lang-current'); await p.waitForTimeout(250); }
        await p.click('#lang-menu [data-lang="ar"]');
        await p.waitForTimeout(400);
        const ar = await p.evaluate(() => ({ dir: document.documentElement.dir, sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
        ok(ar.dir === 'rtl' && ar.sw <= ar.iw, `Arabic switches the page to right-to-left without sideways scrolling (${width})`, JSON.stringify(ar));
        await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await p.screenshot({ path: `${out}/arabic-${width}.png`, fullPage: width === 390 ? false : false });
        // Reload keeps the language (Google's cookie), English clears it
        await p.reload({ waitUntil: 'networkidle' });
        ok(await p.evaluate(() => document.querySelector('.footer-langs .is-active').getAttribute('data-lang') === 'ar' && document.documentElement.dir === 'rtl'), `language survives a page load (${width})`);
        await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle' }), p.evaluate(() => document.querySelector('.footer-langs [data-lang="en"]').click())]);
        ok(await p.evaluate(() => !/googtrans=\/en\/[a-z]/.test(document.cookie) && document.documentElement.dir === 'ltr' && document.querySelector('.footer-langs .is-active').getAttribute('data-lang') === 'en'), `English restores the original page (${width})`);
      }
      // Quick contact buttons: WhatsApp, Telegram, phone; never on top of the back-to-top button
      const fc = await p.evaluate(async () => {
        window.scrollTo({ top: 1500, behavior: 'instant' }); await new Promise(r => setTimeout(r, 300));
        const links = [...document.querySelectorAll('#float-contact a')].filter(a => getComputedStyle(a).display !== 'none');
        const b = document.getElementById('back-to-top').getBoundingClientRect();
        const hit = links.some(a => { const r = a.getBoundingClientRect(); return !(r.right <= b.left || r.left >= b.right || r.bottom <= b.top || r.top >= b.bottom); });
        const kinds = links.map(a => a.getAttribute('href').startsWith('tel:') ? 'phone' : /t\.me/.test(a.href) ? 'telegram' : /whatsapp/.test(a.href) ? 'whatsapp' : 'other');
        window.scrollTo({ top: 0, behavior: 'instant' });
        return { kinds: kinds.join(','), hit };
      });
      ok(fc.kinds === 'whatsapp,telegram,phone' && !fc.hit, `${page}@${width}: quick contact buttons (WhatsApp, Telegram, Call)`, JSON.stringify(fc));
      if (page === 'post' && (width === 1440 || width === 390)) {
        // Open the menu after scrolling down (the live-site bug): the header (logo + close button) must stay on screen
        await p.setViewportSize({ width, height: 900 });
        await p.reload({ waitUntil: 'networkidle' });
        if (width === 1440) await p.evaluate(async () => {  // a long menu like the live one forces the menu button on a big screen
          const menu = document.querySelector('.menu');
          ['Contact', 'The Emisembe Report', 'Volunteer opportunities', 'Annual reports'].forEach(t => { const li = document.createElement('li'); li.innerHTML = '<a href="/x-' + t.length + '">' + t + '</a>'; menu.appendChild(li); });
          window.dispatchEvent(new Event('resize')); await new Promise(r => setTimeout(r, 300));
        });
        await p.evaluate(() => window.scrollTo({ top: 1600, behavior: 'instant' }));
        await p.waitForTimeout(300);
        await p.click('#nav-toggle');
        await p.waitForTimeout(400);
        const st = await p.evaluate(() => {
          const h = document.getElementById('site-header').getBoundingClientRect();
          const d = document.getElementById('site-nav').getBoundingClientRect();
          return { headerTop: Math.round(h.top), headerBottom: Math.round(h.bottom), drawerWidth: Math.round(d.width), drawerRight: Math.round(window.innerWidth - d.right) };
        });
        ok(st.headerTop === 0 && st.headerBottom > 40, `menu opened after scrolling keeps the header on screen (${width})`, JSON.stringify(st));
        if (width === 1440) ok(st.drawerWidth <= 460 && st.drawerRight === 0, 'on big screens the menu opens as a side panel, not full width', JSON.stringify(st));
        await p.screenshot({ path: `${out}/menu-scrolled-${width}.png` });
        if (width === 1440) {
          await p.evaluate(() => document.addEventListener('click', e => { if (e.target.closest('a')) e.preventDefault(); }));
          await p.mouse.click(200, 500);
          await p.waitForTimeout(300);
          ok(!(await p.evaluate(() => document.getElementById('site-header').classList.contains('nav-open'))), 'clicking beside the menu panel closes it');
        }
        await p.reload({ waitUntil: 'networkidle' });
      }
      if (page === 'post' && width === 1440) {
        await p.waitForTimeout(500);
        const rel = await p.evaluate(() => ({ hidden: document.querySelector('.related').hidden, n: document.querySelectorAll('.related-card').length }));
        ok(!rel.hidden && rel.n === 3, 'related stories load (current post excluded)', JSON.stringify(rel));
        const photo = await p.evaluate(() => { const i = document.querySelector('.post-body img.post-photo'); const c = document.querySelector('.post-body'); return i ? [Math.round(i.getBoundingClientRect().width), c.clientWidth, i.getAttribute('src')] : null; });
        ok(photo && photo[0] >= photo[1] - 2 && /\/s1600\//.test(photo[2]), 'photos in a post fill the column width (large copy loaded)', JSON.stringify(photo));
      }
      await ctx.close();
    }
  }
  await browser.close();
  console.log(results.join('\n'));
  const failed = results.filter(r => r.startsWith('FAIL')).length;
  console.log(`\n${results.length - failed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
