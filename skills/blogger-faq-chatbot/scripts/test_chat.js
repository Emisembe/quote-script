// Browser test for the FAQ chat on any page (Playwright + Chromium).
//
//   node scripts/test_chat.js path/to/page.html [more pages...]
//
// Serves each page's folder on localhost, answers Blogger /feeds/ requests with sample articles,
// and checks on a phone (390px, touch) and a computer (1440px):
//   launcher present, opens with welcome + popular questions, a typo of the page's own first
//   question is suggested, a question is answered with the page's answer, an unknown question
//   falls back to articles + WhatsApp/Call with the question typed, Escape closes, the
//   conversation survives a reload, and the phone does not zoom out (nothing wider than the screen).
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const pages = process.argv.slice(2);
if (!pages.length) { console.error('usage: node test_chat.js page.html [...]'); process.exit(2); }
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript' };
let failures = 0;
const note = (ok, msg) => { if (!ok) failures++; console.log(`${ok ? 'ok  ' : 'FAIL'}  ${msg}`); };

function serve(dir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://x');
      if (u.pathname.startsWith('/feeds/')) {
        const entries = [1, 2, 3].map((i) => ({ title: { $t: `Sample article ${i}` }, link: [{ rel: 'alternate', href: `/2026/01/sample-${i}.html` }] }));
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        return res.end(`${u.searchParams.get('callback')}(${JSON.stringify({ feed: { entry: entries } })});`);
      }
      const file = path.join(dir, decodeURIComponent(u.pathname));
      if (!file.startsWith(dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, () => resolve(server));
  });
}

(async () => {
  const browser = await chromium.launch();
  for (const pagePath of pages) {
    const abs = path.resolve(pagePath);
    const server = await serve(path.dirname(abs));
    const url = `http://localhost:${server.address().port}/${path.basename(abs)}`;
    for (const [width, mobile] of [[390, true], [1440, false]]) {
      const tag = `${path.basename(abs)} @${width}`;
      const ctx = await browser.newContext({ viewport: { width, height: 760 }, isMobile: mobile, hasTouch: mobile });
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.route('**/*', (r) => r.request().url().startsWith(url.split('/').slice(0, 3).join('/')) ? r.continue() : r.abort());
      await page.goto(url);
      await page.waitForTimeout(300);
      const btn = await page.$('.qc-ask, .chat-launcher');
      note(!!btn, `${tag}: Ask button present`);
      if (!btn) { await ctx.close(); continue; }
      // the page's own first question and answer, read the same way a visitor's browser would
      const faq = await page.evaluate(() => {
        const t = document.querySelector('.chat-data .widget-content').textContent;
        const q = (t.match(/^\s*Q\s*:\s*(.+)$/mi) || [])[1];
        const a = (t.match(/^\s*A\s*:\s*(.+)$/mi) || [])[1];
        return { q: q && q.trim(), a: a && a.trim() };
      });
      await btn.click();
      await page.waitForTimeout(200);
      let r = await page.evaluate(() => ({ open: !document.querySelector('.chat-panel').hidden, focus: document.activeElement === document.querySelector('.chat-input'),
        chips: document.querySelectorAll('.chat-log .chat-chip').length, rect: document.querySelector('.chat-panel').getBoundingClientRect().toJSON() }));
      note(r.open && r.focus && r.chips >= 1, `${tag}: opens with welcome and ${r.chips} popular question(s), cursor in the box`);
      note(mobile ? Math.round(r.rect.width) === width : r.rect.width <= 420, `${tag}: ${mobile ? 'full screen' : 'corner window'} (${Math.round(r.rect.width)}px)`);
      // typo: swap two letters of the longest word of the first question
      const word = faq.q.toLowerCase().replace(/[^a-z ]/g, ' ').split(' ').sort((x, y) => y.length - x.length)[0];
      const typo = word.length > 3 ? word.slice(0, 1) + word.charAt(2) + word.charAt(1) + word.slice(3) : word;
      await page.fill('.chat-input', typo);
      await page.waitForTimeout(150);
      const live = await page.evaluate(() => [...document.querySelectorAll('.chat-suggest .chat-chip')].map((c) => c.textContent));
      note(live.includes(faq.q), `${tag}: typing "${typo}" suggests "${faq.q}"`);
      await page.fill('.chat-input', faq.q);
      await page.press('.chat-input', 'Enter');
      await page.waitForTimeout(600);
      const answer = await page.evaluate(() => { const b = [...document.querySelectorAll('.chat-log .chat-bot .chat-bubble')]; return b[b.length - 1].textContent; });
      const firstWords = faq.a.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').split(' ').slice(0, 4).join(' ');
      note(answer.includes(firstWords), `${tag}: answers from the list ("${answer.slice(0, 50)}...")`);
      await page.fill('.chat-input', 'xylophone quantum zebra');
      await page.press('.chat-input', 'Enter');
      await page.waitForTimeout(900);
      r = await page.evaluate(() => { const b = [...document.querySelectorAll('.chat-log .chat-bot')]; const last = b[b.length - 1];
        return { articles: last.querySelectorAll('.chat-links a').length, wa: (last.querySelector('.chat-wa') || {}).href || '' }; });
      note(r.articles > 0, `${tag}: unknown question -> website articles (${r.articles})`);
      note(!r.wa || /\?text=Hello%2C%20I%20have%20a%20question%3A%20xylophone/.test(r.wa), `${tag}: WhatsApp hand-over carries the question${r.wa ? '' : ' (no WhatsApp number configured)'}`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
      note(await page.evaluate(() => document.querySelector('.chat-panel').hidden), `${tag}: Escape closes`);
      await page.reload();
      await page.waitForTimeout(300);
      await page.click('.qc-ask, .chat-launcher');
      await page.waitForTimeout(200);
      note((await page.evaluate(() => document.querySelectorAll('.chat-log .chat-user').length)) === 2, `${tag}: conversation kept after a reload`);
      const fit = await page.evaluate((w) => innerWidth === w && document.documentElement.scrollWidth <= innerWidth, width);
      note(fit, `${tag}: page fits the screen (no zoom-out, no sideways scroll)`);
      note(!errors.length, `${tag}: no JavaScript errors ${errors.join(' | ')}`);
      await ctx.close();
    }
    server.close();
  }
  await browser.close();
  console.log(`\n${failures} failed`);
  process.exit(failures ? 1 : 0);
})();
