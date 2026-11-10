// Tests Swahili, Arabic (right to left), Amharic and Tigrinya, plus three display fixes:
// empty sections stay hidden on the homepage, dark text in the newsletter box, readable language menu.
// Serve the theme folder first:  python3 -m http.server 8765   then:  node tests/browser-languages.js <screenshot folder>
const { chromium, devices } = require('playwright');
const base = 'http://127.0.0.1:8765/preview/', out = process.argv[2] || '.';
const results = []; const ok = (name, cond, info) => { results.push([cond ? 'PASS' : 'FAIL', name, info || '']); };
const LANGS = {
  sw: { dir: 'ltr', bubble: 'Uliza Kreislo', ticker: 'Kontena', faq: 'Ninalipaje?', add: 'Weka kwenye kikapu', title: 'Maswali na majibu',
        ask: ['naweza kuchukua wapi', /Gießen kwa miadi/], ask2: ['usafirishaji kwenda kenya ni bei gani', /ukubwa na uzito/] },
  ar: { dir: 'rtl', bubble: 'اسأل Kreislo', ticker: 'مومباسا', faq: 'كيف أدفع؟', add: 'أضف إلى السلة', title: 'أسئلة وأجوبة',
        ask: ['أين الاستلام', /غيسن بموعد/], ask2: ['تكلفة الشحن إلى كينيا', /الحجم والوزن/] },
  am: { dir: 'ltr', bubble: 'Kreislo ይጠይቁ', ticker: 'ሞምባሳ', faq: 'እንዴት እከፍላለሁ?', add: 'ወደ ጋሪ ጨምር', title: 'ጥያቄዎችና መልሶች',
        ask: ['የት መውሰድ', /በጊሰን በቀጠሮ/], ask2: ['ወደ ኬንያ መላክ ዋጋ', /በመጠኑ እና በክብደቱ/] },
  ti: { dir: 'ltr', bubble: 'Kreislo ሕተቱ', ticker: 'ሞምባሳ', faq: 'ብኸመይ እኸፍል?', add: 'ናብ ዘንቢል ወስኽ', title: 'ሕቶታትን መልስታትን',
        ask: ['ኣበይ ክወስድ', /ኣብ ጊሰን ብቖጸራ/], ask2: ['ናብ ኬንያ ምልኣኽ ዋጋ', /ኣብ ዓቐንን ክብደትን/] }
};
(async () => {
  const b = await chromium.launch();
  async function ctxFor(vp, lang) {
    const ctx = await b.newContext(vp);
    await ctx.route('https://script.google.com/**', r => r.fulfill({ status: 200, body: '{"ok":true}' }));
    await ctx.route(/youtube|ytimg/, r => r.fulfill({ status: 200, body: '' }));
    await ctx.route('**/feeds/posts/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"feed":{"entry":[]}}' }));
    if (lang) await ctx.addInitScript(l => { try { localStorage.setItem('shop-lang', l); } catch (e) {} }, lang);
    return ctx;
  }
  for (const [lang, L] of Object.entries(LANGS)) {
    for (const [label, vp] of [['iPhone 13', devices['iPhone 13']], ['desktop', { viewport: { width: 1366, height: 900 } }]]) {
      const ctx = await ctxFor(vp, lang); const p = await ctx.newPage(); const pe = [];
      p.on('pageerror', e => pe.push(e.message));
      await p.goto(base + 'home.html'); await p.waitForTimeout(500);
      const st = await p.evaluate(() => ({
        lang: document.documentElement.lang, dir: document.documentElement.dir,
        bubble: (document.querySelector('.shop-chat-bubble') || {}).textContent,
        ticker: (document.querySelector('.shop-ticker') || {}).textContent || '',
        faq: (document.querySelector('.shop-faq-item summary') || {}).textContent,
        faqTitle: (document.querySelector('#HTML19 h2.title') || {}).textContent,
        add: [...document.querySelectorAll('.shop-btn')].map(x => x.textContent).join(' | '),
        over: document.documentElement.scrollWidth - innerWidth,
        options: [...document.querySelectorAll('.shop-lang option')].map(o => o.textContent)
      }));
      const tag = `${lang} ${label}`;
      ok(`${tag}: page language and direction (${L.dir})`, st.lang === lang && st.dir === L.dir, JSON.stringify([st.lang, st.dir]));
      ok(`${tag}: chat bubble, ticker, FAQ and section title translated`, st.bubble === L.bubble && st.ticker.includes(L.ticker) && st.faq === L.faq && st.faqTitle === L.title,
        JSON.stringify([st.bubble, st.ticker.slice(0, 60), st.faq, st.faqTitle]));
      ok(`${tag}: shop buttons translated`, st.add.includes(L.add), st.add.slice(0, 160));
      ok(`${tag}: no sideways scrolling`, st.over <= 0, st.over + 'px');
      if (label === 'desktop') ok(`${tag}: language menu shows native names`, ['Kiswahili', 'العربية', 'አማርኛ', 'ትግርኛ'].every(n => st.options.includes(n)), st.options.join(', '));
      // chat: a suggestion, then two questions typed in the language
      await p.click('.shop-chat-bubble'); await p.waitForTimeout(100);
      await p.click('.shop-chat-chip >> nth=0'); await p.waitForTimeout(80);
      const ask = async q => { await p.fill('.shop-chat-input', q); await p.press('.shop-chat-input', 'Enter'); await p.waitForTimeout(80);
        return p.evaluate(() => [...document.querySelectorAll('.shop-chat-msg.is-bot')].pop().textContent); };
      const a1 = await ask(L.ask[0]), a2 = await ask(L.ask2[0]);
      ok(`${tag}: chat answers "${L.ask[0]}"`, L.ask[1].test(a1), a1.slice(0, 120));
      ok(`${tag}: chat answers "${L.ask2[0]}"`, L.ask2[1].test(a2), a2.slice(0, 120));
      if (label === 'iPhone 13' || lang === 'ar') {
        await p.keyboard.press('Escape'); await p.evaluate(() => scrollTo(0, 0));
        await p.screenshot({ path: `${out}/lang-${lang}-${label.replace(/\W/g, '')}.png` });
        await p.evaluate(() => document.querySelector('#faq').scrollIntoView()); await p.waitForTimeout(100);
        await p.screenshot({ path: `${out}/lang-${lang}-${label.replace(/\W/g, '')}-faq.png` });
      }
      ok(`${tag}: no script errors`, pe.length === 0, pe.join(' | '));
      await ctx.close();
    }
  }
  // product page and checkout in Arabic (right to left)
  {
    const ctx = await ctxFor(devices['iPhone 13'], 'ar'); const p = await ctx.newPage();
    await p.goto(base + 'post.html'); await p.waitForTimeout(400);
    const st = await p.evaluate(() => ({ over: document.documentElement.scrollWidth - innerWidth, btn: (document.querySelector('.shop-add') || document.querySelector('.shop-btn') || {}).textContent }));
    ok('ar product page: no sideways scrolling, buttons in Arabic', st.over <= 0 && /[؀-ۿ]/.test(st.btn || ''), JSON.stringify(st));
    await p.screenshot({ path: `${out}/lang-ar-post-phone.png`, fullPage: false });
    await ctx.close();
  }
  // display fixes
  {
    const ctx = await ctxFor({ viewport: { width: 1366, height: 900 } }); const p = await ctx.newPage();
    await p.route('**/preview/home.html', async r => { const res = await r.fetch(); let html = await res.text();
      html = html.replace(/<div class="shop-testimonials">[\s\S]*?<\/div><\/div>/, '<div class="shop-testimonials"># 5 | Only a note | Someone\n# another note</div></div>');
      r.fulfill({ response: res, body: html, headers: { 'content-type': 'text/html; charset=utf-8' } }); });
    await p.goto(base + 'home.html'); await p.waitForTimeout(400);
    const st = await p.evaluate(() => {
      const sec = document.querySelector('section.testimonials');
      const inp = document.querySelector('.shop-newsletter-row input');
      const opt = document.querySelector('.shop-lang option');
      return { hiddenAttr: sec.hidden, display: getComputedStyle(sec).display, shown: sec.offsetHeight,
        inputColor: inp && getComputedStyle(inp).color, inputBg: inp && getComputedStyle(inp).backgroundColor,
        optColor: opt && getComputedStyle(opt).color, optBg: opt && getComputedStyle(opt).backgroundColor };
    });
    ok('Reviews gadget with only # notes: section hidden on the homepage', st.hiddenAttr && st.display === 'none' && st.shown === 0, JSON.stringify(st));
    ok('Newsletter box: dark text on white', st.inputColor === 'rgb(17, 17, 17)' && st.inputBg === 'rgb(255, 255, 255)', JSON.stringify([st.inputColor, st.inputBg]));
    ok('Language menu options: dark on white', st.optColor === 'rgb(17, 17, 17)' && st.optBg === 'rgb(255, 255, 255)', JSON.stringify([st.optColor, st.optBg]));
    await p.fill('.shop-newsletter-row input', 'typing@example.com');
    await (await p.$('.newsletter')).screenshot({ path: `${out}/fix-newsletter.png` });
    await ctx.close();
  }
  // newsletter: always visible; with google_sheet it signs up through the sheet, without it by email/WhatsApp
  for (const withSheet of [true, false]) {
    const ctx = await ctxFor({ viewport: { width: 1366, height: 900 } }); const p = await ctx.newPage(); const posts = [];
    await ctx.unroute('https://script.google.com/**');
    await ctx.route('https://script.google.com/**', r => { posts.push(JSON.parse(r.request().postData())); r.fulfill({ status: 200, body: '{"ok":true}' }); });
    await p.addInitScript(() => { window.__nav = []; window.open = u => { window.__nav.push(u); return null; }; });
    if (!withSheet) await p.route('**/preview/home.html', async r => { const res = await r.fetch(); const html = (await res.text()).replace(/google_sheet: [^<]*<br\/>/, '');
      r.fulfill({ response: res, body: html, headers: { 'content-type': 'text/html; charset=utf-8' } }); });
    await p.goto(base + 'home.html'); await p.waitForTimeout(400);
    const vis = await p.evaluate(() => { const s = document.querySelector('section.newsletter'); return { shown: s.offsetHeight > 0, form: !!s.querySelector('.shop-newsletter-form') }; });
    ok(`Newsletter ${withSheet ? 'with' : 'without'} google_sheet: "Stay in the loop" is shown with its form`, vis.shown && vis.form, JSON.stringify(vis));
    let mailto = '';
    p.on('request', r => { if (r.url().startsWith('mailto:')) mailto = r.url(); });
    await p.fill('.shop-newsletter-row input', 'nina@example.com'); await p.check('.shop-newsletter-form input[name=consent]');
    if (!withSheet) await p.evaluate(() => { const real = Object.getOwnPropertyDescriptor(Location.prototype, 'href'); window.__href = ''; });
    await p.click('.shop-newsletter-form button'); await p.waitForTimeout(400);
    const after = await p.evaluate(() => ({ text: document.querySelector('section.newsletter').textContent, href: location.href }));
    if (withSheet) ok('Newsletter with google_sheet: sign-up goes to the sheet and asks to confirm by email', posts.some(x => x.kind === 'newsletter' && x.fields.Email === 'nina@example.com') && /confirm your subscription/.test(after.text), JSON.stringify(posts).slice(0, 120));
    else ok('Newsletter without google_sheet: sign-up opens an email to the shop (nothing lost)', /email app opened/.test(after.text) && posts.length === 0, after.text.slice(-120));
    await ctx.close();
  }
  await b.close();
  const fails = results.filter(r => r[0] === 'FAIL');
  results.forEach(r => console.log(r[0], r[1], r[0] === 'FAIL' ? '→ ' + r[2] : ''));
  console.log(`\n${results.length - fails.length}/${results.length} passed`);
})();
