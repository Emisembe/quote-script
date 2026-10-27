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

const PAGES = ['kpuwu-home', 'kpuwu-post', 'kpuwu-page', 'generic-home', 'generic-post', 'generic-page'];
const WIDTHS = [1440, 1024, 820, 390, 320];
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
        const body = `${u.searchParams.get('callback')}(${JSON.stringify(feedJson(label, +u.searchParams.get('max-results')))});`;
        return route.fulfill({ status: 200, contentType: 'application/javascript', body });
      }
      if (url.startsWith(base)) return route.continue();
      if (/googleusercontent\.com|blogspot\.com/.test(url)) {
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
        const share = await page.evaluate(() => [...document.querySelectorAll('.post-share .share-btn')].map((b) => b.className.split(' ')[1]));
        const want = ['share-whatsapp', 'share-facebook', 'share-x', 'share-linkedin', 'share-telegram', 'share-reddit', 'share-pinterest', 'share-email', 'share-copy', 'share-print'];
        note(want.every((w) => share.includes(w)), `${name} @${width}: share bar has all networks + copy + print (${share.length})`);
      }
      const credit = await page.evaluate(() => { const c = document.querySelector('.Attribution'); return !c || !c.offsetHeight; });
      note(credit, `${name} @${width}: "Powered by Blogger" hidden`);
      await page.screenshot({ path: path.join(OUT, `${name}-${width}.png`), fullPage: true });
      await page.close();
    }
  }

  // Share links are encoded; Print calls window.print(); print layout shows only the article
  for (const name of ['kpuwu-post', 'generic-page']) {
    const { page } = await open(name, 1024);
    const hrefs = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('.post-share a.share-btn')].map((a) => [a.className.split(' ')[1], a.getAttribute('href')])));
    note(/^https:\/\/api\.whatsapp\.com\/send\?text=[^ ]+%20https%3A%2F%2Fexample\.org/.test(hrefs['share-whatsapp']), `${name}: WhatsApp link carries encoded title + URL`);
    note(/x\.com\/intent\/tweet\?url=https%3A%2F%2Fexample\.org%2F.+&text=/.test(hrefs['share-x']), `${name}: X link encoded`);
    note(/pinterest\.com\/pin\/create\/button\/\?url=https%3A/.test(hrefs['share-pinterest']), `${name}: Pinterest link encoded`);
    note(/^mailto:\?subject=.+&body=/.test(hrefs['share-email']), `${name}: email link has subject and body`);
    await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
    await page.click('.share-print');
    note((await page.evaluate(() => window.__printed)) === 1, `${name}: Print button opens the print dialog`);
    await page.emulateMedia({ media: 'print' });
    const vis = await page.evaluate(() => {
      const shown = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none'; };
      return { header: shown('.site-header'), sidebar: shown('.sidebar'), footer: shown('.site-footer'), share: shown('.post-share'), body: shown('.post-body'), source: shown('.print-source') };
    });
    note(!vis.header && !vis.sidebar && !vis.footer && !vis.share && vis.body && vis.source, `${name}: print layout shows only the article + source line ${JSON.stringify(vis)}`);
    await page.pdf({ path: path.join(OUT, `${name}-print.pdf`), format: 'A4' });
    await page.screenshot({ path: path.join(OUT, `${name}-print.png`), fullPage: true });
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
