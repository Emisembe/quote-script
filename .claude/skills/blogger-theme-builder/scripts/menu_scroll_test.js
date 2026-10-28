// Usage: node menu_scroll_test.js <chromium-path> <project-root>
// Open the phone menu while scrolled down: the header + drawer must be on screen and closable.
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.argv[2] });
  const root = process.argv[3];
  const setups = [['desktop window 500px', { viewport: { width: 500, height: 760 } }], ['iPhone 13', devices['iPhone 13']], ['Pixel 7', devices['Pixel 7']]];
  for (const [name, opts] of setups) {
    for (const y of [600, 1500]) {
      const ctx = await b.newContext(opts); const p = await ctx.newPage();
      const errs = []; p.on('pageerror', e => errs.push(e.message));
      await p.goto('file://' + root + '/preview/home.html');
      await p.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), y); await p.waitForTimeout(300);
      const before = await p.evaluate(() => Math.round(document.getElementById('site-header').getBoundingClientRect().top));
      const press = async () => { const r = await p.evaluate(() => { const t = document.getElementById('nav-toggle').getBoundingClientRect(); return [t.left + t.width / 2, t.top + t.height / 2]; }); if (opts.hasTouch) await p.touchscreen.tap(r[0], r[1]); else await p.mouse.click(r[0], r[1]); };
      await press();
      await p.waitForTimeout(300);
      const st = await p.evaluate(() => {
        const h = document.getElementById('site-header').getBoundingClientRect();
        const d = document.getElementById('site-nav').getBoundingClientRect();
        const t = document.getElementById('nav-toggle').getBoundingClientRect();
        return { headerTop: Math.round(h.top), drawerTop: Math.round(d.top), drawerBottom: Math.round(d.bottom), closeVisible: t.top >= 0 && t.bottom <= innerHeight, y: Math.round(scrollY) };
      });
      // close with the X
      if (st.closeVisible) await press();
      await p.waitForTimeout(250);
      const closed = await p.evaluate(() => !document.getElementById('site-header').classList.contains('nav-open') && !document.documentElement.classList.contains('nav-locked'));
      const yAfter = await p.evaluate(() => Math.round(scrollY));
      console.log(`${name.padEnd(21)} scrolled ${String(y).padStart(4)} | header top before ${before}, after open ${st.headerTop} | menu ${st.drawerTop}-${st.drawerBottom}px | X on screen: ${st.closeVisible} | closed by X: ${closed} | scroll kept: ${yAfter === y} | errors: ${errs.length ? errs.join(';') : 'none'}`);
      await ctx.close();
    }
  }
  await b.close();
})();
