// Mobile menu: opens in view wherever the page is scrolled (it used to open off-screen with the page locked),
// links are tappable, the page behind does not scroll, closing keeps the scroll position; text partners not cut off.
// Serve the theme folder first:  python3 -m http.server 8765   then:  node tests/browser-menu.js <screenshot folder>
const { chromium, devices } = require('playwright');
const base = 'http://127.0.0.1:8765/preview/', out = process.argv[2] || '.';
const results = []; const ok = (name, cond, info) => results.push([cond ? 'PASS' : 'FAIL', name, info || '']);
(async () => {
  const b = await chromium.launch();
  for (const dev of ['Galaxy S9+', 'iPhone 13']) {
    const ctx = await b.newContext({ ...devices[dev] });
    await ctx.route('**/feeds/**', r => r.fulfill({ status: 200, body: '{"feed":{}}' }));
    const p = await ctx.newPage(); const pe = []; p.on('pageerror', e => pe.push(e.message));
    await p.goto(base + 'home.html'); await p.waitForTimeout(1000);
    const tap = async sel => { const bb = await (await p.$(sel)).boundingBox(); await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); };
    for (const scroll of [0, 4000]) {
      await p.evaluate(y => scrollTo(0, y), scroll); await p.waitForTimeout(400);
      const y0 = await p.evaluate(() => scrollY);
      await tap('#nav-toggle'); await p.waitForTimeout(500);
      const st = await p.evaluate(() => { const d = document.getElementById('site-nav').getBoundingClientRect(), h = document.getElementById('site-header').getBoundingClientRect();
        const a = document.querySelector('#site-nav a'), ar = a.getBoundingClientRect(), hit = document.elementFromPoint(ar.left + 5, ar.top + ar.height / 2);
        const bubble = document.querySelector('.shop-chat-bubble');
        return { y: scrollY, headerTop: Math.round(h.top), drawerTop: Math.round(d.top), drawerBottom: Math.round(d.bottom), vh: innerHeight,
          tappable: !!hit && (hit === a || a.contains(hit)), bubbleHidden: !bubble || getComputedStyle(bubble).display === 'none' }; });
      const tag = `${dev}, scrolled ${scroll ? 'halfway' : 'to the top'}`;
      ok(`${tag}: menu opens on screen right under the header`, st.drawerTop >= 0 && st.drawerTop === Math.round(st.headerTop + 70) && st.drawerBottom <= st.vh + 1 && st.y === y0, JSON.stringify(st));
      ok(`${tag}: first menu link is tappable, chat bubble hidden`, st.tappable && st.bubbleHidden, JSON.stringify(st));
      if (scroll) await p.screenshot({ path: `${out}/menu-${dev.replace(/\W/g, '')}.png` });
      await p.mouse.wheel(0, 400); await p.waitForTimeout(250);
      ok(`${tag}: page behind the open menu does not scroll`, (await p.evaluate(() => scrollY)) === y0, '');
      await tap('#nav-toggle'); await p.waitForTimeout(300);
      const c = await p.evaluate(() => ({ y: scrollY, open: document.getElementById('site-header').classList.contains('nav-open'), lock: document.documentElement.classList.contains('nav-locked') }));
      ok(`${tag}: closes, unlocks, stays at the same place`, !c.open && !c.lock && c.y === y0, JSON.stringify(c));
    }
    await p.evaluate(() => document.querySelector('.partners').scrollIntoView()); await p.waitForTimeout(300);
    const cut = await p.evaluate(() => [...document.querySelectorAll('.partners .shop-logo-name')].filter(n => n.scrollWidth > n.clientWidth + 1).map(n => n.textContent));
    ok(`${dev}: partner names shown in full`, cut.length === 0, cut.join(', '));
    ok(`${dev}: no script errors`, pe.length === 0, pe.join(' | '));
    await ctx.close();
  }
  const desk = await b.newContext({ viewport: { width: 1366, height: 900 } }); const dp = await desk.newPage();
  await desk.route('**/feeds/**', r => r.fulfill({ status: 200, body: '{"feed":{}}' }));
  await dp.goto(base + 'home.html'); await dp.waitForTimeout(600);
  const dn = await dp.evaluate(() => { const d = document.getElementById('site-nav'); return { pos: getComputedStyle(d).position, display: getComputedStyle(d).display, toggle: getComputedStyle(document.getElementById('nav-toggle')).display }; });
  ok('desktop: menu stays in the header bar (no fixed drawer)', dn.pos === 'static' && dn.toggle === 'none', JSON.stringify(dn));
  await b.close();
  const fails = results.filter(r => r[0] === 'FAIL');
  results.forEach(r => console.log(r[0], r[1], r[0] === 'FAIL' ? '→ ' + r[2] : ''));
  console.log(`\n${results.length - fails.length}/${results.length} passed`);
})();
