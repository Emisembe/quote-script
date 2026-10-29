// Run: node blogger-theme/tests/statstest.js   (after: python3 scripts/build.py && python3 scripts/preview.py)
// Numbers band (Layout > Numbers band): placement, the four figures, widths, editing in Layout.
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node-tools/node_modules/playwright'); } })();
const path = require('path'), fs = require('fs');
const S = __dirname, PV = path.join(__dirname, '..', 'preview') + '/';
const FA = process.env.FA || S + '/fa';
const R = []; const ok = (c, m) => R.push((c ? 'PASS ' : 'FAIL ') + m);
const HOME = fs.readFileSync(PV + 'home.html', 'utf8'), POST = fs.readFileSync(PV + 'post.html', 'utf8');
const W = (id, title, content) => `<div id='${id}' class='widget HTML'><h2 class='title'>${title}</h2><div class='widget-content'>${content}</div></div>`;
const VARIANTS = {
  // as shipped: every gadget still holds the placeholder
  shipped: h => h.replace(/1,165|286\+|2,568|185\+/g, '[type the number, e.g. 250+]'),
  // one figure filled in, three still placeholders
  oneFilled: h => h.replace(/286\+|2,568|185\+/g, '[type the number, e.g. 250+]'),
  // a fifth figure added with Add a Gadget, typed with a <script> and two lines
  fifth: h => h.replace(/(id='stats'[^>]*>)/, '$1' + W('HTML40', 'Years of Experience', '15+<br>since 2011')).replace("<h2 class='title'>Happy Clients</h2><div class='widget-content'>2,568", "<h2 class='title'></h2><div class='widget-content'>2,568<br>&lt;img src=x onerror=alert(1)&gt;"),
  // the label typed as the second line instead of the title
  noTitle: h => h.replace("<h2 class='title'>Recognitions</h2><div class='widget-content'>185+", "<h2 class='title'></h2><div class='widget-content'>185+<br>Awards"),
};

(async () => {
  const b = await chromium.launch({executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', proxy: process.env.HTTPS_PROXY ? {server: process.env.HTTPS_PROXY} : undefined});
  async function open(w, opts = {}) {
    const c = await b.newContext({viewport: {width: w, height: 900}, ignoreHTTPSErrors: true});
    await c.route(/font-awesome\.min\.css/, r => fs.existsSync(FA) ? r.fulfill({path: path.join(FA, 'css/font-awesome.min.css'), contentType: 'text/css'}) : r.fulfill({body: ''}));
    await c.route(/\/fonts\/fontawesome-webfont/, r => fs.existsSync(FA) ? r.fulfill({path: path.join(FA, 'fonts', new URL(r.request().url()).pathname.split('/').pop())}) : r.fulfill({body: ''}));
    await c.route(/youtube\.com\/embed|google\.com\/maps|translate\.google|youtube-nocookie\.com/, r => r.fulfill({body: '<html><body>video</body></html>', contentType: 'text/html'}));
    await c.route(/i\.ytimg\.com|googleusercontent\.com\/img/, r => r.fulfill({path: S + '/fixtures/ytthumb.jpg', contentType: 'image/jpeg'}));
    await c.route(/^https:\/\/eficc\.blogspot\.com\//, r => {
      if (r.request().resourceType() !== 'document') return r.fulfill({body: ''});
      let html = new URL(r.request().url()).pathname.length > 1 ? POST : HOME;
      (opts.variants || []).forEach(v => { html = (typeof v === 'function' ? v : VARIANTS[v])(html); });
      return r.fulfill({contentType: 'text/html', body: html});
    });
    const p = await c.newPage(), errs = [], dialogs = [];
    p.on('pageerror', e => errs.push(e.message));
    p.on('dialog', d => { dialogs.push(d.message()); d.dismiss(); });
    await p.goto(opts.url || 'https://eficc.blogspot.com/', {waitUntil: 'networkidle'});
    await p.waitForTimeout(400);
    return {c, p, errs, dialogs};
  }
  const items = p => p.evaluate(() => [...document.querySelectorAll('.efic-stats li')].map(li => {
    const r = li.getBoundingClientRect();
    return {n: (li.querySelector('.es-number') || {}).textContent, l: (li.querySelector('.es-label') || {}).textContent || '', top: Math.round(r.top + scrollY), left: r.left, right: r.right};
  }));
  const rows = list => [...new Set(list.map(i => i.top))].length;

  // 1. Homepage: under the expertise tiles, before Message & Video, brand colours
  {
    const {c, p, errs} = await open(1440);
    const it = await items(p);
    ok(it.map(i => i.n + ' ' + i.l).join(' | ') === '1,165 Projects Executed | 286+ Global Presence | 2,568 Happy Clients | 185+ Recognitions', 'shows the four figures with their labels: ' + it.map(i => i.n + ' ' + i.l).join(' | '));
    ok(rows(it) === 1, '1440 px: all four in one row');
    const pos = await p.evaluate(() => {
      const w = document.querySelector('.efic-stats-wrap'), prev = w.previousElementSibling, next = w.nextElementSibling;
      const cs = e => getComputedStyle(e);
      return {prev: prev && prev.id, next: next && next.className, bg: cs(w).backgroundColor, num: cs(document.querySelector('.es-number')).color,
        label: cs(document.querySelector('.es-label')).color, font: cs(document.querySelector('.es-number')).fontFamily, section: cs(document.getElementById('stats')).display};
    });
    ok(pos.prev === 'section-2' && /efic-feature-wrap/.test(pos.next), `sits right under "Our Areas of Expertise", before Message & Video (${pos.prev} / ${pos.next})`);
    ok(pos.bg === 'rgb(20, 33, 61)' && pos.num === 'rgb(255, 255, 255)' && pos.label === 'rgb(231, 177, 101)' && /Montserrat/.test(pos.font), `navy band, white numbers, gold labels, Montserrat (${pos.bg}, ${pos.num}, ${pos.label})`);
    ok(pos.section === 'none', 'the raw gadgets are hidden (only the band shows)');
    ok(!errs.length, 'no JS errors: ' + (errs.join('; ') || 'none'));
    await p.locator('.efic-stats-wrap').screenshot({path: S + '/shots/stats-1440.png'});
    await c.close();
  }

  // 2. Every width: two per row on tablets and phones, nothing cut off, no sideways scroll
  for (const [w, want] of [[1920, 1], [1024, 1], [900, 2], [768, 2], [390, 2], [320, 2]]) {
    const {c, p, errs} = await open(w);
    const it = await items(p);
    const m = await p.evaluate(() => {
      const bad = [...document.querySelectorAll('.efic-stats, .efic-stats *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1); });
      const over = [...document.querySelectorAll('.es-number, .es-label')].filter(e => e.scrollWidth > e.clientWidth + 1);
      return {sw: document.documentElement.scrollWidth, iw: innerWidth, bad: bad.length, over: over.length};
    });
    ok(it.length === 4 && rows(it) === want && m.sw <= m.iw && !m.bad && !m.over && !errs.length, `@${w}: ${rows(it)} row(s) (want ${want}), nothing cut off or overflowing, no sideways scroll, no JS errors`);
    if (w === 390 || w === 320) await p.locator('.efic-stats-wrap').screenshot({path: S + `/shots/stats-${w}.png`});
    await c.close();
  }

  // 3. As shipped (placeholders): the band does not appear at all
  {
    const {c, p, errs} = await open(1440, {variants: ['shipped']});
    const r = await p.evaluate(() => ({items: document.querySelectorAll('.efic-stats li').length, wrap: getComputedStyle(document.querySelector('.efic-stats-wrap')).display}));
    ok(r.items === 0 && r.wrap === 'none' && !errs.length, 'as shipped with placeholders: no band, so no made-up figures go live');
    await c.close();
  }
  {
    const {c, p} = await open(1440, {variants: ['oneFilled']});
    const it = await items(p);
    ok(it.length === 1 && it[0].n === '1,165', 'only the gadgets with a number typed in are shown');
    await c.close();
  }

  // 4. Fifth figure (Add a Gadget), typed HTML stays text, label from the second line
  {
    const {c, p, errs, dialogs} = await open(1440, {variants: ['fifth', 'noTitle']});
    const it = await items(p);
    ok(it.length === 5 && it[0].n === '15+' && it[0].l === 'Years of Experience', 'a fifth gadget adds a fifth figure (first line = number)');
    ok(rows(it) === 2, '5 figures: 3 + 2 rows, centred');
    ok(!dialogs.length && !(await p.$('.efic-stats img')) && !errs.length && it.some(i => i.l === '<img src=x onerror=alert(1)>'), 'typed HTML is shown as text and never runs');
    const long = await open(1440, {variants: [h => h.replace('2,568', 'Over two thousand five hundred')]});
    ok((await items(long.p)).length === 3, 'a line that is not a number (too long) is skipped, not squeezed into the band');
    await long.c.close();
    ok(it.some(i => i.n === '185+' && i.l === 'Awards'), 'no title: the second line becomes the label');
    await p.locator('.efic-stats-wrap').screenshot({path: S + '/shots/stats-five.png'});
    await c.close();
  }

  // 5. Posts and pages: not shown (homepage only)
  {
    const {c, p} = await open(1440, {url: 'https://eficc.blogspot.com/2026/01/sample-post.html'});
    ok(await p.evaluate(() => getComputedStyle(document.querySelector('.efic-stats-wrap')).display === 'none'), 'posts and pages: not shown (homepage only)');
    await c.close();
  }

  // 6. Layout editor: the section, its four gadgets and Add a Gadget
  {
    const c = await b.newContext({viewport: {width: 1440, height: 900}}); const p = await c.newPage();
    await p.goto('file://' + PV + 'layout.html', {waitUntil: 'networkidle'});
    const l = await p.evaluate(() => { const s = document.getElementById('stats'); return s && {vis: s.offsetHeight > 0, head: s.querySelector('h4').textContent, add: !!s.querySelector('.add_widget'),
      gadgets: [...s.querySelectorAll('.layout-title')].map(t => t.textContent)}; });
    ok(l && l.vis && l.add && l.head === 'Numbers band (homepage)' && l.gadgets.join(' | ') === 'Projects Executed | Global Presence | Happy Clients | Recognitions',
      'Layout shows "Numbers band (homepage)" with its four gadgets and Add a Gadget ' + JSON.stringify(l));
    await c.close();
  }
  await b.close();
  console.log(R.join('\n')); console.log(R.filter(r => r.startsWith('PASS')).length + '/' + R.length + ' passed');
  process.exit(R.some(r => r.startsWith('FAIL')) ? 1 : 0);
})().catch(e => { console.log(R.join('\n')); console.error(e); process.exit(1); });
