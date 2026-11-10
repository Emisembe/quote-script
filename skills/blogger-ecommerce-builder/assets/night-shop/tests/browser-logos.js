// Partner logos: every logo fits the same tile (wide, tall, square, lots of white space), the whole tile is a link,
// a broken picture link falls back to the name, # lines are notes, text-only partners stay badges.
// Default look: one row, no boxes, grey until hover. Options: grey: no, style: tiles.
// node tests/browser-logos.js <folder with wide.png tall.png square.png padded.png> <screenshot folder>
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path');
const base = 'http://127.0.0.1:8765/preview/', logos = process.argv[2], out = process.argv[3] || '.';
const results = []; const ok = (name, cond, info) => { results.push([cond ? 'PASS' : 'FAIL', name, info || '']); };
const LINES = ['# One partner per line: Name | logo picture link | website',
  'Green Courier | https://logos.test/wide.png | https://greencourier.example',
  'TÜV Hessen | https://logos.test/tall.png | https://tuev.example',
  'DHL | https://logos.test/square.png | /p/delivery.html',
  'IHK Gießen | https://logos.test/padded.png',
  'Broken Logo GmbH | https://logos.test/missing.png | https://broken.example',
  'Atelier Nord | | /p/contact.html'].join('\n');
(async () => {
  const b = await chromium.launch();
  for (const [mode, extra] of [['row', ''], ['tiles', '\nstyle: tiles\ngrey: no']])
  for (const [label0, vp] of [['desktop', { viewport: { width: 1366, height: 900 } }], ['iPhone 13', devices['iPhone 13']]]) {
    const label = label0 + ' ' + mode;
    const ctx = await b.newContext(vp); const p = await ctx.newPage(); const pe = [];
    p.on('pageerror', e => pe.push(e.message));
    await ctx.route('**/feeds/**', r => r.fulfill({ status: 200, body: '{"feed":{}}' }));
    await ctx.route('https://logos.test/**', r => { const f = path.join(logos, path.basename(new URL(r.request().url()).pathname));
      fs.existsSync(f) ? r.fulfill({ status: 200, contentType: 'image/png', body: fs.readFileSync(f) }) : r.fulfill({ status: 404, body: '' }); });
    await p.route('**/preview/home.html', async r => { const res = await r.fetch(); const html = (await res.text())
      .replace(/<div class="shop-logos">Atelier Nord[\s\S]*?<\/div>/, '<div class="shop-logos">' + LINES + extra + '</div>');
      r.fulfill({ response: res, body: html, headers: { 'content-type': 'text/html; charset=utf-8' } }); });
    await p.goto(base + 'home.html'); await p.waitForTimeout(300);
    await p.evaluate(() => document.querySelector('.partners').scrollIntoView()); await p.waitForTimeout(900);
    const st = await p.evaluate(() => {
      const box = document.querySelector('.partners .shop-logos');
      const tiles = [...box.querySelectorAll('.shop-logo')].map(li => {
        const t = li.querySelector('.shop-logo-tile'), img = li.querySelector('img'), r = t.getBoundingClientRect(), ir = img && img.getBoundingClientRect();
        return { text: li.classList.contains('is-text'), tag: t.tagName, href: t.getAttribute('href'), target: t.getAttribute('target'),
          w: Math.round(r.width), h: Math.round(r.height), img: !!img,
          fits: !ir || (ir.left >= r.left - 0.5 && ir.right <= r.right + 0.5 && ir.top >= r.top - 0.5 && ir.bottom <= r.bottom + 0.5),
          ratio: img && img.naturalWidth ? Math.abs((ir.width / ir.height) - (img.naturalWidth / img.naturalHeight)) < 0.03 : true,
          name: li.textContent.trim() };
      });
      const t0 = box.querySelector('.shop-logo:not(.is-text) .shop-logo-tile'), cs = getComputedStyle(t0), img0 = t0.querySelector('img');
      const look = { grey: /grayscale/.test(getComputedStyle(img0).filter), boxed: cs.backgroundColor === 'rgb(255, 255, 255)' && cs.borderTopWidth !== '0px' };
      return { look, tiles, notes: /One partner per line/.test(box.textContent), over: document.documentElement.scrollWidth - innerWidth };
    });
    const T = st.tiles, pics = T.filter(x => !x.text);
    ok(`${label}: 6 partners, # note not shown`, T.length === 6 && !st.notes, JSON.stringify(T.map(x => x.name || 'logo')));
    ok(`${label}: 4 logos in tiles of the same size`, pics.length === 4 && pics.every(x => x.w === pics[0].w && x.h === pics[0].h), JSON.stringify(pics.map(x => [x.w, x.h])));
    ok(`${label}: every logo fits inside its tile, not stretched`, pics.every(x => x.fits && x.ratio), JSON.stringify(pics.map(x => [x.fits, x.ratio])));
    ok(`${label}: logos are clickable (outside sites open in a new tab)`, T[0].tag === 'A' && T[0].href === 'https://greencourier.example' && T[0].target === '_blank' && T[2].href === '/p/delivery.html' && !T[2].target, JSON.stringify(T.slice(0, 3).map(x => [x.tag, x.href, x.target])));
    ok(`${label}: logo without a website is shown but not a link`, T[3].tag === 'SPAN', T[3].tag);
    ok(`${label}: broken picture link falls back to the name, still clickable`, T[4].text && /Broken Logo GmbH/.test(T[4].name) && T[4].tag === 'A', JSON.stringify(T[4]));
    ok(`${label}: partner without logo stays a name badge`, T[5].text && /Atelier Nord/.test(T[5].name), JSON.stringify(T[5]));
    ok(`${label}: look = ${mode === 'row' ? 'no boxes, grey' : 'white boxes, in colour'}`, mode === 'row' ? (!st.look.boxed && st.look.grey) : (st.look.boxed && !st.look.grey), JSON.stringify(st.look));
    if (mode === 'row') { const sum = pics.map(x => x.h); ok(`${label}: logos line up in one row (same box height)`, sum.every(h => h === sum[0]), JSON.stringify(sum)); }
    ok(`${label}: no sideways scrolling, no script errors`, st.over <= 0 && pe.length === 0, st.over + ' ' + pe.join('|'));
    await (await p.$('.partners')).screenshot({ path: `${out}/logos-${label.replace(/\W/g, '')}.png` });
    if (mode === 'row' && label0 === 'desktop') { await p.evaluate(() => document.querySelector('.footer-badges').scrollIntoView()); await p.waitForTimeout(300); await (await p.$('.footer-badges')).screenshot({ path: `${out}/logos-footer.png` }); }
    await ctx.close();
  }
  await b.close();
  const fails = results.filter(r => r[0] === 'FAIL');
  results.forEach(r => console.log(r[0], r[1], r[0] === 'FAIL' ? '→ ' + r[2] : ''));
  console.log(`\n${results.length - fails.length}/${results.length} passed`);
})();
