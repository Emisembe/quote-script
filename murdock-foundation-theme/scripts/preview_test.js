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
      if (page === 'post' && width === 1440) {
        await p.waitForTimeout(500);
        const rel = await p.evaluate(() => ({ hidden: document.querySelector('.related').hidden, n: document.querySelectorAll('.related-card').length }));
        ok(!rel.hidden && rel.n === 3, 'related stories load (current post excluded)', JSON.stringify(rel));
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
