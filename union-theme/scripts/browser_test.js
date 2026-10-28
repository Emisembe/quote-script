// Browser test for the preview pages (Playwright + Chromium, no network needed).
//
//   python3 scripts/build.py && python3 scripts/preview.py && node scripts/browser_test.js [outdir]
//
// Serves the project on localhost, answers /feeds/ requests with sample Blogger JSON,
// replaces remote images with placeholders, then for each page and width checks:
// no horizontal scroll, no JS errors, feeds rendered, menu behaviour, phone centring.
// Screenshots go to outdir (default: preview/screens).
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'preview', 'screens'));
fs.mkdirSync(OUT, { recursive: true });

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' };
const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end('not found'); return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

const COLORS = ['#3E5C76', '#8C2F39', '#2F4858', '#6B4E71', '#33658A', '#5C6B73', '#7D4E57', '#2E5266'];
function placeholder(url) {
  let h = 0;
  for (const ch of url) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const c = COLORS[h % COLORS.length];
  const logo = /logo/.test(url);
  const [w, hgt] = logo ? [304, 106] : [1600, 900];
  const text = logo ? 'UNION LOGO' : 'PHOTO';
  return `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${hgt}' viewBox='0 0 ${w} ${hgt}'>` +
    `<rect width='100%' height='100%' fill='${logo ? '#ffffff' : c}'/>` +
    `<text x='50%' y='54%' font-family='Arial' font-size='${logo ? 34 : 90}' font-weight='bold' fill='${logo ? '#13294B' : 'rgba(255,255,255,0.55)'}' text-anchor='middle'>${text}</text></svg>`;
}

const TITLES = [
  'Union signs new collective bargaining agreement with employers',
  'Know your rights: overtime, leave and casual contracts explained',
  'Annual delegates conference adopts eight resolutions',
  'Statement on the new minimum wage order',
  'Women committee launches mentorship programme',
  'Shop steward training held in three regions',
  'Pension scheme update for members',
  'Health and safety week: what employers must provide',
];
function feedJson(label, count) {
  const entries = [];
  for (let i = 0; i < count && i < 8; i++) {
    const n = (i + (label || 'x').length) % TITLES.length;
    entries.push({
      title: { $t: (label && label !== 'Branches' && label !== 'universities' ? '' : 'Branch ' + (i + 1) + ': ') + TITLES[n] },
      published: { $t: new Date(Date.UTC(2026, 9, 25 - i * 3, 9)).toISOString() },
      link: [{ rel: 'alternate', href: '/preview/kpuwu-post.html?p=' + n }],
      summary: { $t: 'The union has welcomed the outcome, saying it shows what workers can achieve when they organise. Members are invited to branch meetings to discuss the next steps and to share their views.' },
      media$thumbnail: i % 4 === 3 ? undefined : { url: `https://blogger.googleusercontent.com/img/b/feed/s72-c/${encodeURIComponent(label || 'all')}-${i}.jpg` },
    });
  }
  return { feed: { entry: entries } };
}
// Site map feeds: 180 labelled posts served 150 at a time, and the blog's static pages
const TOPICS = ['Campaigns and policy', 'Emerging Issues', 'Events', 'NHIF and NSSF', 'Publications'];
function allPostsJson(start, count) {
  const entries = [];
  for (let i = start - 1; i < Math.min(180, start - 1 + count); i++) {
    entries.push({
      title: { $t: `Article ${i + 1}: ${TITLES[i % TITLES.length]}` },
      published: { $t: new Date(Date.UTC(2026, 9, 25) - i * 86400000 * 3).toISOString() },
      link: [{ rel: 'alternate', href: `/preview/kpuwu-post.html?a=${i + 1}` }],
      category: i % 7 === 6 ? undefined : [{ term: TOPICS[i % TOPICS.length] }].concat(i % 3 === 0 ? [{ term: TOPICS[(i + 2) % TOPICS.length] }] : []),
    });
  }
  return { feed: { entry: entries } };
}
function pagesJson() {
  return { feed: { entry: ['About KPUWU', 'Who can join?', 'Benefits', 'FAQs', 'Sitemap'].map((title) => ({
    title: { $t: title },
    link: [{ rel: 'alternate', href: '/p/' + title.toLowerCase().replace(/[^a-z]+/g, '-').replace(/-$/, '') + '.html' }],
  })) } };
}

const PAGES = ['kpuwu-home', 'kpuwu-post', 'kpuwu-page', 'generic-home', 'generic-post', 'generic-page', 'generic-downloads', 'kpuwu-sitemap', 'generic-branches'];
const WIDTHS = [280, 320, 360, 375, 414, 480, 600, 768, 834, 1024, 1100, 1280, 1440, 1920];
const SHOTS = [280, 375, 768, 1100, 1440, 1920];
// QUICK=1 node scripts/browser_test.js : only 390 and 1440 in the page matrix (for fast iteration)
if (process.env.QUICK) WIDTHS.splice(0, WIDTHS.length, 390, 1440);
const failures = [];
const note = (ok, msg) => { if (!ok) failures.push(msg); console.log(`${ok ? 'ok  ' : 'FAIL'}  ${msg}`); };

(async () => {
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}`;
  const browser = await chromium.launch();

  async function open(name, width) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|Failed to load resource/.test(m.text())) errors.push(m.text()); });
    await page.route('**/*', (route) => {
      const url = route.request().url();
      if (url.startsWith(base + '/feeds/')) {
        const u = new URL(url);
        const m = u.pathname.match(/\/-\/(.+)$/);
        const label = m ? decodeURIComponent(m[1]) : '';
        const max = +u.searchParams.get('max-results');
        const data = u.pathname.startsWith('/feeds/pages/') ? pagesJson()
          : max === 150 && !label ? allPostsJson(+(u.searchParams.get('start-index') || 1), max) : feedJson(label, max);
        const body = `${u.searchParams.get('callback')}(${JSON.stringify(data)});`;
        return route.fulfill({ status: 200, contentType: 'application/javascript', body });
      }
      if (url.startsWith(base)) return route.continue();
      if (/googleusercontent\.com|blogspot\.com|ytimg\.com/.test(url)) {
        return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: placeholder(url) });
      }
      return route.abort();
    });
    await page.goto(`${base}/preview/${name}.html`, { waitUntil: 'load' });
    await page.waitForTimeout(400);
    // Scroll through the page so lazy images load before measuring and screenshots
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(800);
    return { page, errors };
  }

  for (const name of PAGES) {
    for (const width of WIDTHS) {
      const { page, errors } = await open(name, width);
      const m = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        inner: window.innerWidth,
        loading: document.querySelectorAll('.feed-status').length,
        feeds: document.querySelectorAll('.feed-featured, .feed-message, .feed-tile, .feed-card').length,
        ticker: document.querySelectorAll('.ticker-list li').length,
        related: !document.querySelector('.related') || !document.querySelector('.related').hidden,
        icons: document.querySelectorAll('.topbar-social svg.social-icon').length,
      }));
      note(m.scroll <= m.inner, `${name} @${width}: no horizontal scroll (${m.scroll} <= ${m.inner})`);
      note(errors.length === 0, `${name} @${width}: no JS errors ${errors.length ? JSON.stringify(errors) : ''}`);
      note(m.icons > 0, `${name} @${width}: social icons rendered (${m.icons})`);
      if (name.endsWith('home')) {
        note(m.loading === 0 && m.feeds > 10, `${name} @${width}: label feeds rendered (${m.feeds} items, ${m.loading} still loading)`);
        note(m.ticker > 0, `${name} @${width}: ticker filled (${m.ticker})`);
      } else {
        if (name.endsWith('post')) note(m.related, `${name} @${width}: related posts shown`);
        const share = await page.evaluate(() => [...document.querySelectorAll('.u-share .u-share-btn')].map((b) => b.className.split(' ')[1]));
        const want = ['u-share-whatsapp', 'u-share-facebook', 'u-share-x', 'u-share-linkedin', 'u-share-telegram', 'u-share-reddit', 'u-share-pinterest', 'u-share-email', 'u-share-copy', 'u-share-print'];
        note(want.every((w) => share.includes(w)), `${name} @${width}: share bar has all networks + copy + print (${share.length})`);
      }
      const credit = await page.evaluate(() => { const c = document.querySelector('.Attribution'); return !c || !c.offsetHeight; });
      note(credit, `${name} @${width}: "Powered by Blogger" hidden`);
      if (name.endsWith('post')) {
        const stress = await page.evaluate(() => {
          const body = document.querySelector('.post-body').getBoundingClientRect();
          const wider = [...document.querySelectorAll('.post-body > *, .post-body img, .post-body iframe')]
            .filter((e) => !e.matches('table.stress-table, pre') && e.getBoundingClientRect().width > body.width + 1)
            .map((e) => e.tagName + '.' + e.className);
          const v = document.querySelector('.stress-video').getBoundingClientRect();
          const cap = document.querySelector('.tr-caption-container img').getBoundingClientRect();
          return { wider, ratio: v.width / v.height, videoFits: v.width <= body.width + 1, capFits: cap.width <= body.width + 1 };
        });
        note(stress.wider.length === 0, `${name} @${width}: long URLs/words, wide image and caption stay inside the article ${stress.wider.join(',')}`);
        note(stress.videoFits && Math.abs(stress.ratio - 16 / 9) < 0.05, `${name} @${width}: embedded video fits and keeps 16:9 (${stress.ratio.toFixed(2)})`);
        note(stress.capFits, `${name} @${width}: captioned image fits`);
        const narrowest = await page.evaluate(() => Math.min(...[...document.querySelectorAll('.stress-table th')].map((c) => c.getBoundingClientRect().width)));
        note(narrowest >= 50, `${name} @${width}: wide table scrolls instead of squashing (narrowest column ${Math.round(narrowest)}px)`);
      }
      if (SHOTS.includes(width)) await page.screenshot({ path: path.join(OUT, `${name}-${width}.png`), fullPage: true });
      await page.close();
    }
  }

  // Touch screens (phone emulation): finger-sized tap targets in the top bar, header, share bar, slideshow
  for (const [name, width] of [['kpuwu-home', 320], ['generic-home', 390], ['kpuwu-post', 390], ['generic-page', 360]]) {
    const ctx = await browser.newContext({ viewport: { width, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.route('**/*', (route) => route.request().url().startsWith(base) ? route.continue()
      : /googleusercontent/.test(route.request().url()) ? route.fulfill({ status: 200, contentType: 'image/svg+xml', body: placeholder(route.request().url()) }) : route.abort());
    await page.goto(`${base}/preview/${name}.html`);
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      const coarse = matchMedia('(pointer: coarse)').matches;
      const sel = '.topbar a, .topbar button, .nav-toggle, .header-cta a, .u-share .u-share-btn, .slide-btn, .hero-actions a, .btn';
      const small = [...document.querySelectorAll(sel)].filter((e) => e.offsetWidth).map((e) => {
        const b = e.getBoundingClientRect();
        return [e.className || e.tagName, Math.round(Math.min(b.width, b.height))];
      }).filter((x) => x[1] < 34);
      return { coarse, small, scroll: document.documentElement.scrollWidth, inner: innerWidth };
    });
    note(r.coarse, `touch ${name} @${width}: phone emulation reports a coarse pointer`);
    note(r.small.length === 0, `touch ${name} @${width}: every tap target is at least 34px ${JSON.stringify(r.small)}`);
    note(r.scroll <= r.inner, `touch ${name} @${width}: no horizontal scroll`);
    await page.screenshot({ path: path.join(OUT, `touch-${name}-${width}.png`) });
    await ctx.close();
  }

  // Phones held sideways: compact header, menu still reachable to the last item
  for (const [w, h] of [[844, 390], [740, 360], [667, 375]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.route('**/*', (route) => route.request().url().startsWith(base) ? route.continue() : route.abort());
    await page.goto(`${base}/preview/kpuwu-home.html`);
    await page.waitForTimeout(300);
    const hh = await page.evaluate(() => document.querySelector('.site-header').offsetHeight);
    note(hh <= 70, `landscape ${w}x${h}: header is compact (${hh}px)`);
    await page.click('#nav-toggle');
    const reach = await page.evaluate(() => {
      const d = document.getElementById('site-nav');
      d.scrollTop = d.scrollHeight;
      const last = document.querySelector('.header-cta a').getBoundingClientRect();
      return { bottom: Math.round(last.bottom), h: innerHeight, scroll: document.documentElement.scrollWidth, inner: innerWidth };
    });
    note(reach.bottom <= reach.h, `landscape ${w}x${h}: menu scrolls down to the Join button (${reach.bottom} <= ${reach.h})`);
    note(reach.scroll <= reach.inner, `landscape ${w}x${h}: no horizontal scroll`);
    await page.screenshot({ path: path.join(OUT, `landscape-${w}x${h}-menu.png`) });
    await ctx.close();
  }

  // Share links are encoded; Print calls window.print(); print layout shows only the article
  for (const name of ['kpuwu-post', 'generic-page']) {
    const { page } = await open(name, 1024);
    const hrefs = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('.u-share a.u-share-btn')].map((a) => [a.className.split(' ')[1], a.getAttribute('href')])));
    note(/^https:\/\/api\.whatsapp\.com\/send\?text=[^ ]+%20https%3A%2F%2Fexample\.org/.test(hrefs['u-share-whatsapp']), `${name}: WhatsApp link carries encoded title + URL`);
    note(/x\.com\/intent\/tweet\?url=https%3A%2F%2Fexample\.org%2F.+&text=/.test(hrefs['u-share-x']), `${name}: X link encoded`);
    note(/pinterest\.com\/pin\/create\/button\/\?url=https%3A/.test(hrefs['u-share-pinterest']), `${name}: Pinterest link encoded`);
    note(/^mailto:\?subject=.+&body=/.test(hrefs['u-share-email']), `${name}: email link has subject and body`);
    await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
    await page.click('.u-share-print');
    note((await page.evaluate(() => window.__printed)) === 1, `${name}: Print button opens the print dialog`);
    await page.emulateMedia({ media: 'print' });
    const vis = await page.evaluate(() => {
      const shown = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none'; };
      return { header: shown('.site-header'), sidebar: shown('.sidebar'), footer: shown('.site-footer'), share: shown('.u-share'), body: shown('.post-body'), source: shown('.print-source') };
    });
    note(!vis.header && !vis.sidebar && !vis.footer && !vis.share && vis.body && vis.source, `${name}: print layout shows only the article + source line ${JSON.stringify(vis)}`);
    await page.pdf({ path: path.join(OUT, `${name}-print.pdf`), format: 'A4' });
    await page.screenshot({ path: path.join(OUT, `${name}-print.png`), fullPage: true });
    await page.close();
  }

  // Fixes from the live site: share bar stays in place despite Blogger's own .share-buttons CSS,
  // pasted fonts/colours are overridden, logos are not cropped, certifications strip, "Unknown" author
  for (const width of [1440, 390]) {
    for (const name of ['kpuwu-post', 'generic-page']) {
      const { page } = await open(name, width);
      const r = await page.evaluate(() => {
        const list = document.querySelector('.u-share-list');
        const lb = list.getBoundingClientRect();
        const body = document.querySelector('.post-body').getBoundingClientRect();
        const bar = document.querySelector('.u-share').getBoundingClientRect();
        return { pos: getComputedStyle(list).position, below: lb.top >= body.bottom - 1, inside: lb.top >= bar.top - 1 && lb.bottom <= bar.bottom + 1, n: list.children.length };
      });
      note(r.pos === 'static' && r.below && r.inside && r.n >= 10, `${name} @${width}: share buttons sit in the share bar under the article ${JSON.stringify(r)}`);
      if (name === 'kpuwu-post') {
        const t = await page.evaluate(() => {
          const cs = (s) => getComputedStyle(document.querySelector(s));
          const p = cs('p.MsoNormal'), messy = cs('.stress-messy'), font = cs('.stress-font'), h = cs('.post-body h2 span'), h2 = cs('.post-body h2');
          return { same: [messy, font].every((c) => c.fontFamily === p.fontFamily && c.fontSize === p.fontSize && c.color === p.color),
                   bg: messy.backgroundColor, heading: h.fontSize === h2.fontSize && h.fontFamily === h2.fontFamily && h.color === h2.color,
                   bold: cs('.stress-font + b').fontWeight >= 600,
                   author: [...document.querySelectorAll('.post-meta *')].filter((e) => e.offsetWidth && e.textContent.trim() === 'Unknown').length };
        });
        note(t.same, `${name} @${width}: text pasted with other fonts/sizes/colours shows in the theme's style`);
        note(t.bg === 'rgba(0, 0, 0, 0)', `${name} @${width}: pasted highlight colour removed (${t.bg})`);
        note(t.heading, `${name} @${width}: a pasted heading uses the theme's heading style`);
        note(t.bold, `${name} @${width}: bold text stays bold`);
        note(t.author === 0, `${name} @${width}: "Unknown" author hidden`);
      }
      await page.close();
    }
  }
  for (const [name, certs] of [['kpuwu-home', false], ['generic-home', true]]) {
    const { page } = await open(name, 1440);
    const r = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll('.post-card-media img')];
      return { logo: imgs.filter((i) => /logo/.test(i.src)).every((i) => i.classList.contains('fit-contain')),
               photo: imgs.filter((i) => !/logo/.test(i.src)).every((i) => !i.classList.contains('fit-contain')),
               certs: !!document.querySelector('.footer-certs').offsetHeight, n: document.querySelectorAll('.cert-list li').length };
    });
    note(r.logo && r.photo, `${name}: logos shown whole, photos fill their frame`);
    note(r.certs === certs, `${name}: certifications strip ${certs ? 'shown with ' + r.n + ' items' : 'hidden while empty'}`);
    if (certs) await page.locator('.footer-certs').screenshot({ path: path.join(OUT, `${name}-certs.png`) });
    await page.close();
  }

  // Important documents: homepage cards, Downloads page, Google Drive / Docs links
  {
    let { page } = await open('generic-home', 1440);
    let r = await page.evaluate(() => ({ cards: document.querySelectorAll('.band-downloads .doc-card').length,
      more: (document.querySelector('.doc-more a') || {}).textContent, visible: !!document.querySelector('.band-downloads').offsetHeight }));
    note(r.visible && r.cards === 6 && /All documents \(9\)/.test(r.more), `generic-home: 6 document cards + "All documents (9)" link ${JSON.stringify(r)}`);
    await page.locator('.band-downloads').screenshot({ path: path.join(OUT, 'downloads-home-1440.png') });
    await page.close();
    ({ page } = await open('kpuwu-home', 1440));
    note(!(await page.evaluate(() => document.querySelector('.band-downloads').offsetHeight)), 'kpuwu-home: documents section hidden while the list is empty');
    await page.close();
    ({ page } = await open('generic-downloads', 390));
    r = await page.evaluate(() => {
      const card = (t) => [...document.querySelectorAll('.u-downloads .doc-card')].find((c) => c.querySelector('.doc-title').textContent.includes(t));
      const info = (c) => ({ cls: c.className, dl: c.querySelector('.doc-download').getAttribute('href'), view: c.querySelector('.doc-view') && c.querySelector('.doc-view').getAttribute('href'),
        icon: getComputedStyle(c.querySelector('.doc-icon')).backgroundColor, btnFont: getComputedStyle(c.querySelector('.doc-download')).fontFamily });
      return { n: document.querySelectorAll('.u-downloads .doc-card').length, drive: info(card('Drive file')), sheet: info(card('Google Sheet')),
        pdf: info(card('constitution')), word: info(card('Membership')), ppt: info(card('AGM')) };
    });
    note(r.n === 9, `downloads page lists every document (${r.n})`);
    note(r.drive.dl === 'https://drive.google.com/uc?export=download&id=1AbCdEfGh_ijk-LMN' && /\/file\/d\/1AbCdEfGh_ijk-LMN\/view$/.test(r.drive.view), `Drive link: Download = direct download, View = Drive viewer ${JSON.stringify(r.drive)}`);
    note(/doc-excel/.test(r.sheet.cls) && /\/export\?format=xlsx$/.test(r.sheet.dl), `Google Sheet downloads as Excel ${JSON.stringify(r.sheet)}`);
    note(/doc-pdf/.test(r.pdf.cls) && !r.pdf.view && /doc-word/.test(r.word.cls) && /doc-powerpoint/.test(r.ppt.cls), 'file types detected from the link (PDF, Word, PowerPoint)');
    note(r.pdf.icon === 'rgb(200, 16, 46)' && r.word.icon === 'rgb(43, 87, 154)', `file icons keep their colours inside a page (${r.pdf.icon}, ${r.word.icon})`);
    note(/Oswald/.test(r.pdf.btnFont), 'Download buttons keep the theme font inside a page');
    await page.screenshot({ path: path.join(OUT, 'downloads-page-390.png'), fullPage: true });
    await page.close();
    ({ page } = await open('kpuwu-downloads', 1024));
    note(/No documents have been added yet/.test(await page.textContent('.u-downloads')), 'kpuwu downloads page: friendly message while empty');
    await page.close();
  }

  // HTML site map page: every page and article, grouped by topic, fetched 150 at a time
  for (const width of [1440, 390]) {
    const { page } = await open('kpuwu-sitemap', width);
    await page.waitForFunction(() => document.querySelector('.sitemap-summary'), null, { timeout: 8000 }).catch(() => {});
    const r = await page.evaluate(() => {
      const box = document.querySelector('.u-sitemap');
      const links = [...box.querySelectorAll('.sitemap-list a')].map((a) => a.getAttribute('href'));
      return { summary: (box.querySelector('.sitemap-summary') || {}).textContent, topics: box.querySelectorAll('.sitemap-topics a').length,
        unique: new Set(links.filter((h) => /a=\d+/.test(h))).size, pages: [...box.querySelectorAll('#topic-pages + ul a')].map((a) => a.textContent),
        other: !!document.getElementById('topic-other-articles'), bullet: getComputedStyle(box.querySelector('.sitemap-list')).listStyleType,
        scroll: document.documentElement.scrollWidth, inner: innerWidth };
    });
    note(/180 articles in 6 topics, and 4 pages/.test(r.summary), `sitemap @${width}: summary "${r.summary}"`);
    note(r.unique === 180 && r.topics === 6 && r.other, `sitemap @${width}: all 180 articles (both batches) under 6 topics incl. "Other articles"`);
    note(r.pages.length === 4 && !r.pages.includes('Sitemap'), `sitemap @${width}: static pages listed, the sitemap page itself left out ${JSON.stringify(r.pages)}`);
    note(r.bullet === 'none' && r.scroll <= r.inner, `sitemap @${width}: clean list, no horizontal scroll`);
    await page.screenshot({ path: path.join(OUT, `sitemap-${width}.png`) });
    await page.close();
  }

  // Structured data (schema.org JSON-LD) for Google
  for (const [name, person] of [['kpuwu-post', 'Jane Wanjiku'], ['generic-post', 'Peter Otieno'], ['kpuwu-home', null]]) {
    const { page } = await open(name, 1024);
    const g = await page.evaluate(() => {
      const s = [...document.querySelectorAll('script[type="application/ld+json"]')].map((x) => JSON.parse(x.textContent));
      const graph = s.length === 1 ? s[0]['@graph'] : [];
      const by = (t) => graph.find((n) => n['@type'] === t);
      return { count: s.length, org: by('WorkersUnion'), site: by('WebSite'), news: by('NewsArticle'), crumbs: by('BreadcrumbList'),
        h1: (document.querySelector('.post-title') || {}).textContent };
    });
    note(g.count === 1 && g.org && g.site && g.org.sameAs && g.org.sameAs.length >= 4, `${name}: Organization (WorkersUnion) + WebSite structured data, ${g.org && g.org.sameAs ? g.org.sameAs.length : 0} social profiles`);
    if (name.endsWith('post')) {
      note(g.news && g.news.headline === g.h1.trim() && g.news.datePublished && g.news.image && g.news.image.length === 1, `${name}: NewsArticle with headline, date and image`);
      note(person ? g.news.author.name === person : g.news.author['@id'] === g.org['@id'], `${name}: author is ${person || 'the union (author "Unknown")'}`);
      note(g.crumbs && g.crumbs.itemListElement.length === 3, `${name}: breadcrumb Home > topic > article`);
    } else {
      note(!g.news, `${name}: no article markup on the homepage`);
    }
    await page.close();
  }

  // Writer credit ("Written by:" lines), writer labels, reading time, intro paragraph, contents box, pull quotes
  for (const width of [1440, 390]) {
    for (const [name, who, role, photo] of [['kpuwu-post', 'Jane Wanjiku', 'Shop steward, KCA University branch', true], ['generic-post', 'Peter Otieno', 'Branch Secretary', false]]) {
      const { page } = await open(name, width);
      const r = await page.evaluate(() => {
        const q = (s) => document.querySelector(s);
        const body = q('.post-body');
        const box = q('.author-box');
        return {
          leftover: /Written by|About the author:|Author photo/.test(body.textContent),
          bodyPhoto: !!body.querySelector('img[src*="jane-photo"]'),
          byline: q('.guest-byline') ? q('.guest-byline').textContent.replace(/\s+/g, ' ').trim() : '',
          bylineHref: q('.guest-byline a') ? q('.guest-byline a').getAttribute('href') : null,
          box: box ? { name: box.querySelector('.author-name').textContent, role: (box.querySelector('.author-role') || {}).textContent,
            bio: (box.querySelector('.author-bio') || {}).textContent, img: (box.querySelector('img.author-photo') || {}).src || '',
            initials: (box.querySelector('.author-initials') || {}).textContent, more: !!box.querySelector('.author-more') } : null,
          reading: (q('.reading-time') || {}).textContent,
          lead: q('.lead-para') ? getComputedStyle(q('.lead-para')).fontSize : null,
          toc: [...document.querySelectorAll('.toc-list a')].map((a) => ({ text: a.textContent, ok: !!document.getElementById(a.getAttribute('href').slice(1)) })),
          crumbs: [...document.querySelectorAll('.breadcrumb .crumb-label')].map((a) => a.textContent),
          tags: [...document.querySelectorAll('.post-tags a')].map((a) => a.textContent),
          sideWriter: [...document.querySelectorAll('.Label li')].some((li) => /Writer:/.test(li.textContent)),
          quote: getComputedStyle(q('.post-body blockquote')).fontFamily,
          scroll: document.documentElement.scrollWidth, inner: innerWidth,
        };
      });
      note(!r.leftover && !r.bodyPhoto, `${name} @${width}: "Written by" / photo / bio lines taken out of the article text`);
      note(r.byline.startsWith('By ' + who) && r.byline.includes(role), `${name} @${width}: byline "${r.byline}"`);
      note(photo ? /Writer/.test(decodeURIComponent(r.bylineHref || '')) : true, `${name} @${width}: byline links to the writer's page when a Writer label exists`);
      note(r.box && r.box.name === who && r.box.role === role && /\S/.test(r.box.bio || ''), `${name} @${width}: About-the-author box with name, role and bio`);
      note(photo ? /jane-photo/.test(r.box.img) && r.box.more : r.box.initials === 'PO' && !r.box.more, `${name} @${width}: ${photo ? 'photo from the line after "Author photo:" + "More articles" link' : 'initials when there is no photo'}`);
      note(/^\d+ min read$/.test(r.reading || ''), `${name} @${width}: reading time "${r.reading}"`);
      note(parseFloat(r.lead) >= 18, `${name} @${width}: first paragraph shown larger (${r.lead})`);
      note(r.toc.length >= 3 && r.toc.every((x) => x.ok), `${name} @${width}: "In this article" box with ${r.toc.length} working links`);
      note(r.crumbs[0] === 'Campaigns' && !r.tags.some((x) => /Writer/.test(x)) && !r.sideWriter, `${name} @${width}: writer labels kept out of breadcrumb, tags and topic list`);
      note(/Oswald/.test(r.quote), `${name} @${width}: pull quote in the display font`);
      note(r.scroll <= r.inner, `${name} @${width}: no horizontal scroll`);
      if (width === 1440 && name === 'kpuwu-post') {
        await page.locator('.post-head').screenshot({ path: path.join(OUT, 'article-head-1440.png') });
        await page.locator('.author-box').screenshot({ path: path.join(OUT, 'author-box-1440.png') });
      }
      if (width === 390 && name === 'generic-post') await page.locator('.author-box').screenshot({ path: path.join(OUT, 'author-box-390.png') });
      await page.close();
    }
  }
  {
    const { page } = await open('kpuwu-home', 1440);
    const first = await page.evaluate(() => [...document.querySelectorAll('.post-card')][0].querySelector('.post-card-labels a').textContent);
    note(!/Writer/.test(first), `news cards show the topic, not the writer label (first card: "${first}")`);
    await page.close();
  }

  // Branch offices: cards, search, region filter, buttons, structured data
  for (const width of [1440, 390]) {
    const { page } = await open('generic-branches', width);
    const r = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.u-branches .branch-card')];
      const head = cards[0];
      const href = (c, s) => (c.querySelector(s) || {}).getAttribute ? c.querySelector(s).getAttribute('href') : null;
      const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((x) => JSON.parse(x.textContent))[0]['@graph'][0];
      return { n: cards.length, name: head.querySelector('.branch-name').textContent, region: (head.querySelector('.branch-region') || {}).textContent,
        call: href(head, '.branch-call'), mail: href(head, '.branch-email'), wa: href(head, '.branch-whatsapp'), map: href(head, '.branch-map'),
        notes: [...document.querySelectorAll('.branch-notes')].map((p) => p.textContent), count: (document.querySelector('.branch-count') || {}).textContent,
        options: [...document.querySelectorAll('.branch-region-select option')].map((o) => o.textContent),
        subs: (ld.subOrganization || []).length, scroll: document.documentElement.scrollWidth, inner: innerWidth };
    });
    note(r.n === 5 && r.name === 'Head office' && r.region === 'Capital', `branches @${width}: 5 branch cards, first "${r.name}" (${r.region})`);
    note(r.call === 'tel:+000700000001' && r.mail === 'mailto:info@example.org' && r.wa === 'https://wa.me/000700000001' &&
      /google\.com\/maps\/search\/\?api=1&query=Head%20office%2C%20Union%20House/.test(r.map), `branches @${width}: Call / Email / WhatsApp / Directions links ${JSON.stringify([r.call, r.mail, r.wa])}`);
    note(r.notes.length === 1 && /appointment/.test(r.notes[0]), `branches @${width}: notes shown`);
    note(r.options.join('|') === 'All regions|Capital|Coast|North|West' && r.count === '5 branches', `branches @${width}: region filter + count`);
    await page.fill('.branch-search', 'harbour');
    const afterSearch = await page.evaluate(() => [...document.querySelectorAll('.branch-card')].filter((c) => !c.hidden).map((c) => c.querySelector('.branch-name').textContent));
    note(afterSearch.length === 1 && afterSearch[0] === 'Coast branch', `branches @${width}: search "harbour" finds the Coast branch`);
    await page.fill('.branch-search', '');
    await page.selectOption('.branch-region-select', 'Capital');
    const afterRegion = await page.evaluate(() => ({ shown: [...document.querySelectorAll('.branch-card')].filter((c) => !c.hidden).length, count: document.querySelector('.branch-count').textContent }));
    note(afterRegion.shown === 2 && afterRegion.count === 'Showing 2 of 5 branches', `branches @${width}: region "Capital" shows 2 (${afterRegion.count})`);
    note(r.subs === 5, `branches @${width}: branches in Google structured data (${r.subs})`);
    note(r.scroll <= r.inner, `branches @${width}: no horizontal scroll`);
    await page.selectOption('.branch-region-select', '');
    await page.screenshot({ path: path.join(OUT, `branches-${width}.png`), fullPage: true });
    await page.close();
  }
  {
    const { page } = await open('kpuwu-branches', 1024);
    note(/added here soon/.test(await page.textContent('.u-branches')), 'kpuwu branches: friendly message while no branch is listed');
    await page.close();
  }

  // Videos fill the empty space under short articles, never more; phones show one; related articles always there
  for (const [name, width, expect] of [['generic-page', 1440, 'fill'], ['generic-page', 1280, 'fill'], ['generic-page', 1024, 'fill'],
                                       ['kpuwu-post', 1440, 'any'], ['generic-page', 390, 'one'], ['kpuwu-post', 390, 'one'], ['generic-post', 768, 'one']]) {
    const { page } = await open(name, width);
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const box = document.querySelector('.video-fill');
      const cards = box && !box.hidden ? box.querySelectorAll('.video-card').length : 0;
      const main = [...document.querySelector('.main-col').children].filter((c) => !c.hidden).reduce((m, c) => Math.max(m, c.getBoundingClientRect().bottom), 0);
      const side = document.querySelector('.sidebar .sidebar-section').getBoundingClientRect().bottom;
      const rel = document.querySelector('.related');
      return { cards, total: 7, mainBottom: Math.round(main), sideBottom: Math.round(side), related: rel ? !rel.hidden && rel.querySelectorAll('.feed-card').length : null,
        scroll: document.documentElement.scrollWidth, inner: innerWidth };
    });
    if (expect === 'fill') {
      note(r.cards >= 1 && r.mainBottom <= r.sideBottom + 2, `videos ${name} @${width}: ${r.cards} video(s) fill the space, article column ends at ${r.mainBottom} <= sidebar ${r.sideBottom}`);
      // one more video would have overflowed (or all were used)
      const more = await page.evaluate(() => {
        const box = document.querySelector('.video-fill'); const grid = box.querySelector('.video-grid');
        const n = grid.children.length; if (n >= 7) return 'all';
        const clone = grid.children[0].cloneNode(true); grid.appendChild(clone);
        const cloneRow = !grid.children[n - 1] || clone.getBoundingClientRect().top > grid.children[n - 1].getBoundingClientRect().top + 1;
        const bottom = [...document.querySelector('.main-col').children].filter((c) => !c.hidden).reduce((m, c) => Math.max(m, c.getBoundingClientRect().bottom), 0);
        grid.removeChild(clone);
        return bottom > document.querySelector('.sidebar .sidebar-section').getBoundingClientRect().bottom + 2 ? 'would overflow' : (cloneRow ? 'fits' : 'same row');
      });
      note(more !== 'fits', `videos ${name} @${width}: as many as fit (next one: ${more})`);
    } else if (expect === 'one') {
      note(r.cards === 1, `videos ${name} @${width}: one video under the article on phones/tablets (${r.cards})`);
    } else {
      note(r.mainBottom <= r.sideBottom + 2 || r.cards === 0, `videos ${name} @${width}: long article: ${r.cards} video(s), no extra length`);
    }
    if (name.endsWith('post')) note(r.related === 3, `related ${name} @${width}: related articles shown (${r.related})`);
    note(r.scroll <= r.inner, `videos ${name} @${width}: no horizontal scroll`);
    if (name === 'generic-page' && (width === 1440 || width === 390)) await page.screenshot({ path: path.join(OUT, `videos-${width}.png`), fullPage: true });
    if (name === 'generic-page' && width === 1440) {
      await page.click('.video-thumb');
      const frame = await page.evaluate(() => (document.querySelector('.video-frame iframe') || {}).src || '');
      note(/youtube-nocookie\.com\/embed\/TestVideo01\?autoplay=1/.test(frame), `videos: clicking plays the video (${frame})`);
      await page.setViewportSize({ width: 1100, height: 900 });
      await page.waitForTimeout(300);
      note(await page.evaluate(() => !!document.querySelector('.video-frame iframe')), 'videos: a playing video is not interrupted by resizing');
    }
    await page.close();
  }
  {
    const { page } = await open('kpuwu-home', 1440);
    note(!(await page.evaluate(() => document.querySelector('.video-fill'))), 'videos: none on the homepage');
    await page.close();
  }

  // Language picker: opens, marks English, choosing Kiswahili stores Google's googtrans cookie
  for (const width of [1440, 390]) {
    const { page } = await open('kpuwu-home', width);
    if (width === 1440) {
      const gap = await page.evaluate(() => document.querySelector('.topbar-search').getBoundingClientRect().left - document.querySelector('.lang-picker').getBoundingClientRect().right);
      note(gap >= 0 && gap <= 30, `language @${width}: picker sits next to the search box (gap ${Math.round(gap)}px)`);
    }
    const label = await page.textContent('.lang-current');
    note(/English/.test(label), `language @${width}: current language shown (${label.trim()})`);
    await page.click('.lang-toggle');
    note(await page.locator('.lang-menu').isVisible(), `language @${width}: menu opens`);
    await page.screenshot({ path: path.join(OUT, `language-${width}.png`) });
    await Promise.all([page.waitForNavigation(), page.click('.lang-menu a[data-lang="sw"]')]);
    const cookies = await page.context().cookies();
    const g = cookies.find((c) => c.name === 'googtrans');
    note(g && g.value === '/en/sw', `language @${width}: choosing Kiswahili sets googtrans=/en/sw (${g && g.value})`);
    const now = await page.textContent('.lang-current');
    note(/Kiswahili/.test(now), `language @${width}: after reload the picker shows Kiswahili`);
    await page.click('.lang-toggle');
    await Promise.all([page.waitForNavigation(), page.click('.lang-menu a[data-lang="en"]')]);
    const back = (await page.context().cookies()).find((c) => c.name === 'googtrans');
    note(!back || !back.value, `language @${width}: choosing English clears the cookie`);
    await page.close();
  }

  // Menu behaviour on a phone, and dropdowns on desktop
  for (const name of ['kpuwu-home', 'generic-home']) {
    const { page } = await open(name, 390);
    const drawer = page.locator('#site-nav');
    note(!(await drawer.isVisible()), `${name}: drawer closed on load`);
    await page.click('#nav-toggle');
    note(await drawer.isVisible(), `${name}: hamburger opens the drawer`);
    note((await page.getAttribute('#nav-toggle', 'aria-expanded')) === 'true', `${name}: aria-expanded=true when open`);
    const firstSub = page.locator('.site-nav li.has-sub').first();
    await firstSub.locator('> a').click();
    note(await firstSub.locator('> ul').isVisible(), `${name}: tapping a "#" parent opens its submenu`);
    await page.screenshot({ path: path.join(OUT, `${name}-menu-390.png`) });
    await page.keyboard.press('Escape');
    note(!(await drawer.isVisible()), `${name}: Escape closes the drawer`);
    await page.click('#nav-toggle');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(150);
    note(!(await page.evaluate(() => document.documentElement.classList.contains('nav-locked'))), `${name}: resizing to desktop unlocks the page`);
    await page.hover('.site-nav li.has-sub >> nth=0');
    await page.waitForTimeout(300);
    note(await page.locator('.site-nav li.has-sub >> nth=0').locator('> ul').isVisible(), `${name}: desktop dropdown opens on hover`);
    await page.screenshot({ path: path.join(OUT, `${name}-dropdown-1440.png`) });
    await page.close();
  }

  // Opening the menu after scrolling down (phones, tablets): header stays on screen, menu directly
  // under it, page does not scroll behind the menu, and closing returns to the same place
  for (const [width, mobile] of [[320, true], [390, true], [622, false], [834, true], [1024, false]]) {
    for (const name of ['kpuwu-post', 'generic-home']) {
      const ctx = await browser.newContext({ viewport: { width, height: 760 }, isMobile: mobile, hasTouch: mobile });
      const page = await ctx.newPage();
      await page.route('**/*', (route) => route.request().url().startsWith(base) ? route.continue() : route.abort());
      await page.goto(`${base}/preview/${name}.html`);
      await page.evaluate(() => window.scrollTo(0, 2200));
      await page.waitForTimeout(250);
      await page.click('#nav-toggle');
      await page.waitForTimeout(250);
      const open = await page.evaluate(() => {
        const h = document.getElementById('site-header').getBoundingClientRect(), d = document.getElementById('site-nav').getBoundingClientRect();
        return { headerTop: Math.round(h.top), headerBottom: Math.round(h.bottom), drawerTop: Math.round(d.top), y: Math.round(scrollY) };
      });
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(250);
      const yAfterWheel = await page.evaluate(() => Math.round(scrollY));
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
      const yClosed = await page.evaluate(() => Math.round(scrollY));
      note(open.headerTop === 0 && Math.abs(open.drawerTop - open.headerBottom) <= 1,
        `menu after scrolling ${name} @${width}: header stays on screen, menu right under it ${JSON.stringify(open)}`);
      note(yAfterWheel === open.y && yClosed === open.y, `menu after scrolling ${name} @${width}: page stays put while the menu is open and after closing (${open.y} / ${yAfterWheel} / ${yClosed})`);
      if (name === 'kpuwu-post' && width === 390) {
        await page.click('#nav-toggle');
        await page.waitForTimeout(200);
        await page.screenshot({ path: path.join(OUT, 'menu-after-scroll-390.png') });
      }
      await ctx.close();
    }
  }

  // Every desktop dropdown opens fully on screen
  for (const width of [1100, 1280, 1440]) {
    for (const name of ['kpuwu-home', 'generic-home']) {
      const { page } = await open(name, width);
      const n = await page.locator('.site-nav .widget-content > ul > li.has-sub').count();
      const off = [];
      for (let i = 0; i < n; i++) {
        const li = page.locator('.site-nav .widget-content > ul > li.has-sub').nth(i);
        await li.hover();
        await page.waitForTimeout(250);
        const r = await li.evaluate((e) => { const b = e.querySelector('ul').getBoundingClientRect(); return [Math.round(b.left), Math.round(b.right), innerWidth]; });
        if (r[0] < 0 || r[1] > r[2]) off.push(r);
      }
      note(off.length === 0, `${name} @${width}: all ${n} dropdowns open on screen ${JSON.stringify(off)}`);
      await page.close();
    }
  }

  // Phone centring: left gap == right gap for centred elements
  for (const width of [320, 360, 375, 390, 414]) {
    const { page } = await open('kpuwu-home', width);
    const gaps = await page.evaluate(() => {
      const sel = ['.hero-title', '.hero-actions li a', '.band-services h2.title', '.cta-title', '.cta-body li a', '.copyright', '.band-stats h2.title'];
      const out = [];
      for (const s of sel) {
        const e = document.querySelector(s);
        if (!e || !e.offsetWidth) continue;
        const r = e.getBoundingClientRect();
        const parent = e.closest('.container').getBoundingClientRect();
        let left = r.left - parent.left, right = parent.right - r.right;
        if (getComputedStyle(e).textAlign === 'center' && e.tagName !== 'A') {
          const range = document.createRange(); range.selectNodeContents(e);
          const tr = range.getBoundingClientRect(); left = tr.left - parent.left; right = parent.right - tr.right;
        }
        out.push([s, Math.round(left), Math.round(right)]);
      }
      return out;
    });
    for (const [s, l, r] of gaps) note(Math.abs(l - r) <= 2, `centring @${width}: ${s} (left ${l}, right ${r})`);
    await page.close();
  }

  await browser.close();
  server.close();
  console.log(`\n${failures.length} failed`);
  process.exit(failures.length ? 1 : 0);
})();
