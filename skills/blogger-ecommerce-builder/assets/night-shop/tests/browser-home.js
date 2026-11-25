// Homepage blocks from the zooplus review: benefit strip, category tiles, campaign band, product rows, guides row,
// header search. Uses a fake blog feed (products with sale prices, sold-out and digital items, guide posts).
// Serve the theme folder first:  python3 -m http.server 8765   then:  node tests/browser-home.js <screenshot folder>
const { chromium, devices } = require('playwright');
const zlib = require('zlib');
const base = 'http://127.0.0.1:8765/preview/', out = process.argv[2] || '.';
const results = []; const ok = (name, cond, info) => results.push([cond ? 'PASS' : 'FAIL', name, info || '']);

// a small solid PNG for every picture
function png(r, g, b) {
  const w = 8, h = 8, raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; for (let x = 0; x < w; x++) raw.set([r, g, b], y * (w * 3 + 1) + 1 + x * 3); }
  const crc = buf => { let c, n, t = []; for (n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    let x = 0xffffffff; for (const v of buf) x = t[(x ^ v) & 0xff] ^ (x >>> 8); return (x ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const P = (title, label, price, extra) => ({ title, labels: [label], price, ...(extra || {}) });
const PRODUCTS = [
  P('Washing machine Bosch 7 kg', 'Appliances', 190, { old: 240 }), P('Fridge-freezer Liebherr', 'Appliances', 240),
  P('Microwave 800 W', 'Appliances', 45, { old: 60 }), P('Kettle, stainless', 'Appliances', 15), P('Vacuum cleaner Miele', 'Appliances', 75, { stock: 0 }),
  P('Home starter kit', 'Kits', 690, { old: 760 }), P('Small workshop kit', 'Kits', 420), P('Angle grinder 230 mm', 'Tools', 38),
  P('Cordless drill 18 V', 'Tools', 55), P('Sofa, 3 seats', 'Furniture', 120), P('Winter jacket', 'Clothes', 25, { old: 40 }),
  P('Kenya shipping guide (PDF)', 'Digital', 9.9, { digital: true }), P('Bicycle, 28 inch', 'Bikes', 85)
];
const GUIDES = [['How shipping to Kenya works', 'From the request to pickup in Mombasa: dates, packing, customs and the one price you pay before we ship.'],
  ['What we test before we sell', 'Every appliance runs a full programme, every tool runs under load. Here is our checklist, step by step.'],
  ['Buying a used washing machine', 'Drum, bearings, pump and seals: the five checks that tell a good used machine from a bad one.']];
const host = 'http://127.0.0.1:8765';
function entry(x, i) {
  const html = x.guide ? `<img src="https://img.test/g${i}.png"><p>${x.text}</p>`
    : `<div class="product" data-price="${String(x.price).replace('.', ',')}"${x.old ? ` data-old-price="${x.old}"` : ''}${x.stock === 0 ? ' data-stock="0"' : ''}${x.digital ? ' data-digital="yes"' : ''}>Price: ${x.price} EUR</div><p>Tested and cleaned.</p>`;
  return { title: { $t: x.title }, link: [{ rel: 'alternate', href: `${host}/p${i}.html` }], content: { $t: html },
    category: x.labels.map(term => ({ term })), media$thumbnail: { url: `https://img.test/p${i}.png` } };
}
function feed(url) {
  const m = /\/feeds\/posts\/default(?:\/-\/([^?]+))?/.exec(url), label = m && m[1] ? decodeURIComponent(m[1]) : '';
  if (label === 'Guide') return { feed: { entry: GUIDES.map((g, i) => entry({ title: g[0], text: g[1], labels: ['Guide'], guide: true }, 100 + i)) } };
  const list = PRODUCTS.map((x, i) => [x, i]).filter(([x]) => !label || x.labels.includes(label) || (label === 'Sale' && x.old));
  return { feed: { entry: list.map(([x, i]) => entry(x, i)) } };
}

(async () => {
  const b = await chromium.launch();
  async function open(vp, opts) {
    opts = opts || {};
    const ctx = await b.newContext(vp);
    if (opts.lang) await ctx.addInitScript(l => { try { localStorage.setItem('shop-lang', l); } catch (e) {} }, opts.lang);
    await ctx.route('https://img.test/**', r => { const n = Number((/(\d+)\.png/.exec(r.request().url()) || [0, 0])[1]); r.fulfill({ status: 200, contentType: 'image/png', body: png(60 + (n * 37) % 180, 90 + (n * 53) % 140, 120) }); });
    await ctx.route('**/feeds/**', r => opts.noFeed ? r.abort() : r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(feed(r.request().url())) }));
    await ctx.route(/youtube|ytimg|script\.google/, r => r.fulfill({ status: 200, body: '' }));
    const p = await ctx.newPage(); p.errors = []; p.on('pageerror', e => p.errors.push(e.message));
    await p.route('**/preview/home.html', async r => { const res = await r.fetch(); let html = await res.text();
      html = html.replace('until: 2026-11-30', 'until: ' + (opts.until || '2099-12-31'));
      if (opts.extraRow) html = html.replace('<div data-lang="en">\n# One row per line', '<div data-lang="en">\nNothing here | NoSuchLabel<br/>\n# One row per line');
      if (opts.campaignLabel) html = html.replace('label: Sale<br/>', 'label: ' + opts.campaignLabel + '<br/>');
      r.fulfill({ response: res, body: html, headers: { 'content-type': 'text/html; charset=utf-8' } }); });
    await p.goto(base + 'home.html'); await p.waitForTimeout(900);
    return { ctx, p };
  }
  const state = p => p.evaluate(() => {
    const vis = n => !!n && n.offsetParent !== null && getComputedStyle(n).visibility !== 'hidden';
    const sec = id => document.getElementById(id);
    const rows = [...document.querySelectorAll('.shop-rows .shop-lane')].map(r => ({
      title: (r.querySelector('.shop-lane-title') || {}).textContent, more: (r.querySelector('.shop-lane-more') || {}).textContent,
      href: (r.querySelector('.shop-lane-more') || {}).getAttribute && r.querySelector('.shop-lane-more').getAttribute('href'),
      cards: [...r.querySelectorAll('.shop-pcard')].map(c => ({ t: c.querySelector('.shop-pcard-title').textContent, price: (c.querySelector('.shop-price') || {}).textContent || '', badge: (c.querySelector('.shop-pcard-badge') || {}).textContent || '' })),
      loading: r.querySelectorAll('.is-loading').length,
      overflow: r.querySelector('.shop-lane-track').scrollWidth > r.querySelector('.shop-lane-track').clientWidth + 2,
      nextVisible: vis(r.querySelector('.shop-lane-arrow.is-next')) }));
    const camp = sec('deals');
    return {
      benefits: vis(sec('benefits')) ? [...document.querySelectorAll('.shop-benefit strong')].map(s => s.textContent) : null,
      benefitsTop: sec('benefits').getBoundingClientRect().top < sec('categories').getBoundingClientRect().top,
      tiles: [...document.querySelectorAll('.shop-cat-name')].map(n => n.textContent), labelListHidden: [...document.querySelectorAll('#categories .widget.Label')].every(w => !vis(w)),
      tilesLinks: [...document.querySelectorAll('.shop-cat-tile')].map(a => a.getAttribute('href')),
      campaign: vis(camp) ? { cls: camp.className, title: (camp.querySelector('.shop-campaign-title') || {}).textContent, btn: (camp.querySelector('.shop-campaign-btn') || {}).getAttribute && camp.querySelector('.shop-campaign-btn').getAttribute('href'),
        btnText: (camp.querySelector('.shop-campaign-btn') || {}).textContent, cards: [...camp.querySelectorAll('.shop-pcard')].map(c => (c.querySelector('.shop-pcard-badge') || {}).textContent || '') } : null,
      rows, rowsVisible: vis(sec('products')),
      guides: vis(sec('guides')) ? [...document.querySelectorAll('.shop-pcard.is-guide')].map(c => ({ t: c.querySelector('.shop-pcard-title').textContent, text: (c.querySelector('.shop-pcard-text') || {}).textContent || '', more: (c.querySelector('.shop-pcard-more') || {}).textContent })) : null,
      overflowX: document.documentElement.scrollWidth - innerWidth, dir: document.documentElement.dir
    };
  });

  for (const [label, vp] of [['desktop', { viewport: { width: 1366, height: 900 } }], ['iPhone 13', devices['iPhone 13']]]) {
    const { ctx, p } = await open(vp);
    await p.evaluate(() => document.getElementById('products').scrollIntoView()); await p.waitForTimeout(400);
    const s = await state(p);
    ok(`${label}: benefit strip shows the trust row promises, above the categories`, s.benefits && s.benefits.length === 4 && /Free shipping/.test(s.benefits[0]) && s.benefitsTop, JSON.stringify(s.benefits));
    ok(`${label}: 7 category tiles, plain label list hidden, tiles link to labels and the Kenya page`, s.tiles.length === 7 && s.tiles[0] === 'Appliances' && s.labelListHidden && s.tilesLinks.includes('/search/label/Appliances') && s.tilesLinks.includes('/p/kenya.html'), JSON.stringify(s.tiles));
    ok(`${label}: campaign band shows Black Friday on dark, only reduced products (all with a −% badge)`, s.campaign && /is-dark/.test(s.campaign.cls) && s.campaign.title === 'Black Friday' && s.campaign.cards.length === 4 && s.campaign.cards.every(x => /^−\d+ %$/.test(x)) && s.campaign.btn === '/search/label/Sale' && s.campaign.btnText === 'See all deals', JSON.stringify(s.campaign));
    const R = Object.fromEntries(s.rows.map(r => [r.title, r]));
    ok(`${label}: 4 product rows in the gadget order`, s.rows.map(r => r.title).join('|') === 'New in|Kits for a fresh start|Appliances, tested|Under 50 €', s.rows.map(r => r.title).join('|'));
    ok(`${label}: "New in" = 10 newest, sold-out item left out, no placeholders left`, R['New in'].cards.length === 10 && !R['New in'].cards.some(c => /Vacuum/.test(c.t)) && s.rows.every(r => r.loading === 0), JSON.stringify(R['New in'].cards.map(c => c.t)));
    ok(`${label}: "Kits" row has both kits, sale badge on the reduced one, "See all" links to the label`, R['Kits for a fresh start'].cards.length === 2 && R['Kits for a fresh start'].cards[0].badge === '−9 %' && R['Kits for a fresh start'].href === '/search/label/Kits' && /See all/.test(R['Kits for a fresh start'].more), JSON.stringify(R['Kits for a fresh start']));
    ok(`${label}: "Under 50 €" shows only prices up to 50 €`, R['Under 50 €'].cards.length > 0 && R['Under 50 €'].cards.every(c => { const n = parseFloat((c.price.match(/[\d.,]+(?=\s*€)/g) || ['999']).pop().replace('.', '').replace(',', '.')); return n <= 50; }), JSON.stringify(R['Under 50 €'].cards.map(c => c.price)));
    ok(`${label}: guides row shows 3 articles with text and "Learn more"`, s.guides && s.guides.length === 3 && s.guides.every(g => g.text.length > 30 && /Learn more/.test(g.more)), JSON.stringify(s.guides && s.guides.map(g => g.t)));
    if (label === 'desktop') {
      const r0 = s.rows[0];
      ok('desktop: rows with more than 4 products get a "next" arrow', r0.overflow && r0.nextVisible, JSON.stringify([r0.overflow, r0.nextVisible]));
      const before = await p.evaluate(() => document.querySelector('.shop-rows .shop-lane-track').scrollLeft);
      await p.click('.shop-rows .shop-lane .shop-lane-arrow.is-next'); await p.waitForTimeout(700);
      const after = await p.evaluate(() => document.querySelector('.shop-rows .shop-lane-track').scrollLeft);
      ok('desktop: the arrow scrolls the row', after > before + 100, `${before} → ${after}`);
    } else {
      ok('iPhone 13: rows swipe sideways (no arrows), page itself does not scroll sideways', s.rows[0].overflow && !s.rows[0].nextVisible && s.overflowX <= 0, JSON.stringify([s.rows[0].overflow, s.rows[0].nextVisible, s.overflowX]));
    }
    // header search
    const bb = await (await p.$('#search-toggle')).boundingBox();
    await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(200);
    const srch = await p.evaluate(() => ({ open: !document.getElementById('header-search').hidden, focused: document.activeElement && document.activeElement.name === 'q', box: document.getElementById('header-search').getBoundingClientRect().top }));
    ok(`${label}: search icon opens the search box under the header, cursor in the field`, srch.open && srch.focused && srch.box >= 0 && srch.box < 200, JSON.stringify(srch));
    await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    ok(`${label}: empty search is not sent`, /home\.html/.test(p.url()), p.url());
    let searched = '';
    await p.route('**/search?**', r => { searched = r.request().url(); r.fulfill({ status: 200, contentType: 'text/html', body: '<p>results</p>' }); });
    await p.fill('#header-search input', 'washing machine'); await p.keyboard.press('Enter'); await p.waitForTimeout(500);
    ok(`${label}: search sends the words to Blogger's search`, /\/search\?q=washing\+machine/.test(searched), searched);
    ok(`${label}: no script errors`, p.errors.length === 0, p.errors.join(' | '));
    await ctx.close();
  }
  // screenshots for the owner
  for (const [label, vp] of [['desktop', { viewport: { width: 1366, height: 900 } }], ['phone', devices['iPhone 13']]]) {
    const { ctx, p } = await open(vp);
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300);
    const top = await p.evaluate(() => document.getElementById('categories').getBoundingClientRect().bottom + scrollY);
    await p.evaluate(() => document.getElementById('benefits').scrollIntoView()); await p.waitForTimeout(400);
    await p.screenshot({ path: `${out}/home-${label}-1.png` });
    await p.evaluate(() => document.getElementById('deals').scrollIntoView()); await p.waitForTimeout(400);
    await p.screenshot({ path: `${out}/home-${label}-2.png` });
    await p.evaluate(() => document.getElementById('products').scrollIntoView()); await p.waitForTimeout(400);
    await p.screenshot({ path: `${out}/home-${label}-3.png` });
    await p.evaluate(() => document.getElementById('guides').scrollIntoView()); await p.waitForTimeout(400);
    await p.screenshot({ path: `${out}/home-${label}-4.png` });
    await ctx.close();
  }
  // German, Arabic (right to left)
  {
    const { ctx, p } = await open({ viewport: { width: 1366, height: 900 } }, { lang: 'de' });
    const s = await state(p);
    ok('German: rows, tiles, campaign and "see all" in German', s.rows[0].title === 'Neu eingetroffen' && /Alle ansehen/.test(s.rows[0].more) && s.tiles[0] === 'Geräte' && s.campaign && s.campaign.btnText === 'Alle Angebote', JSON.stringify([s.rows[0].title, s.rows[0].more, s.tiles[0], s.campaign && s.campaign.btnText]));
    await ctx.close();
  }
  {
    const { ctx, p } = await open(devices['iPhone 13'], { lang: 'ar' });
    const s = await state(p);
    ok('Arabic (right to left), phone: rows and tiles in Arabic, no sideways page scroll', s.dir === 'rtl' && s.rows[0].title === 'وصل حديثًا' && s.tiles[0] === 'أجهزة منزلية' && s.overflowX <= 0 && p.errors.length === 0, JSON.stringify([s.dir, s.rows[0].title, s.tiles[0], s.overflowX, p.errors]));
    await p.evaluate(() => document.getElementById('products').scrollIntoView()); await p.waitForTimeout(300);
    await p.screenshot({ path: `${out}/home-ar-phone.png` });
    await ctx.close();
  }
  // switches
  {
    const { ctx, p } = await open({ viewport: { width: 1366, height: 900 } }, { until: '2020-01-01' });
    const s = await state(p);
    ok('campaign ends by itself after its "until" date', s.campaign === null && s.rows.length === 4, JSON.stringify(s.campaign));
    await ctx.close();
  }
  {
    const { ctx, p } = await open({ viewport: { width: 1366, height: 900 } }, { campaignLabel: 'NoSuchLabel', extraRow: true });
    const s = await state(p);
    ok('campaign without matching products stays hidden (no empty promises)', s.campaign === null, JSON.stringify(s.campaign));
    ok('a row whose label has no products removes itself', !s.rows.some(r => r.title === 'Nothing here') && s.rows.length === 4, s.rows.map(r => r.title).join('|'));
    await ctx.close();
  }
  {
    const { ctx, p } = await open({ viewport: { width: 1366, height: 900 } }, { noFeed: true });
    await p.waitForTimeout(500);
    const s = await state(p);
    ok('feed unreachable: rows, campaign and guides hide, tiles and strip still show, no errors', !s.rowsVisible && s.campaign === null && s.guides === null && s.tiles.length === 7 && s.benefits && p.errors.length === 0, JSON.stringify([s.rowsVisible, s.campaign, s.guides, p.errors]));
    await ctx.close();
  }
  await b.close();
  const fails = results.filter(r => r[0] === 'FAIL');
  results.forEach(r => console.log(r[0], r[1], r[0] === 'FAIL' ? '→ ' + r[2] : ''));
  console.log(`\n${results.length - fails.length}/${results.length} passed`);
})();
