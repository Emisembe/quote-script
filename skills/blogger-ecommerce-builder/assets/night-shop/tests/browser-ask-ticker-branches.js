// Tests the news ticker, the branches section and the "Ask" chat assistant on four screen sizes.
// Serve the theme folder first:  python3 -m http.server 8765   (from the folder that has preview/ and dist/)
// Run:  node tests/browser-ask-ticker-branches.js <screenshot folder>
const { chromium, devices } = require('playwright');
const base = 'http://127.0.0.1:8765/preview/', out = process.argv[2] || '.';
const results = []; const ok = (name, cond, info) => { results.push([cond ? 'PASS' : 'FAIL', name, info || '']); };
(async () => {
  const b = await chromium.launch();
  async function ctxFor(vp, extra) {
    const ctx = await b.newContext(Object.assign({}, vp, extra || {}));
    ctx.posts = [];
    await ctx.route('https://script.google.com/**', r => { const d = JSON.parse(r.request().postData()); ctx.posts.push(d);
      r.fulfill({ status: 200, body: JSON.stringify({ ok: true }) }); });
    await ctx.route(/youtube|ytimg/, r => r.fulfill({ status: 200, body: '' }));
    await ctx.route('**/feeds/posts/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ feed: { entry: [] } }) }));
    return ctx;
  }
  const sizes = [['iPhone 13', devices['iPhone 13']], ['Galaxy S9+', devices['Galaxy S9+']], ['iPad Mini', devices['iPad Mini']], ['desktop', { viewport: { width: 1366, height: 900 } }]];
  for (const [label, vp] of sizes) {
    const ctx = await ctxFor(vp); const p = await ctx.newPage(); const pe = [];
    p.on('pageerror', e => pe.push(e.message)); p.on('console', m => m.type() === 'error' && pe.push(m.text()));
    await p.goto(base + 'home.html'); await p.waitForTimeout(400);
    // ---- ticker
    const tk = await p.evaluate(() => {
      const box = document.querySelector('.shop-ticker'), track = box && box.querySelector('.shop-ticker-track');
      const lists = track ? track.querySelectorAll('.shop-ticker-list') : [];
      return { ready: !!box && box.classList.contains('is-ready'), moving: box.classList.contains('is-moving'), label: (box.querySelector('.shop-ticker-label') || {}).textContent,
        lists: lists.length, copyHidden: lists[1] && lists[1].getAttribute('aria-hidden'), anim: getComputedStyle(track).animationName,
        noHashLines: !/#/.test(box.textContent), strong: !!box.querySelector('strong'), x0: track.getBoundingClientRect().x,
        h2hidden: getComputedStyle(document.querySelector('#HTML21 h2.title')).display === 'none' || document.querySelector('#HTML21 h2.title').hidden };
    });
    ok(`${label}: ticker built, label "${tk.label}", moving`, tk.ready && tk.moving && tk.label === 'News' && tk.anim === 'shop-ticker-run', JSON.stringify(tk));
    ok(`${label}: ticker has a hidden copy for the loop, # lines not shown, *figure* highlighted`, tk.lists === 2 && tk.copyHidden === 'true' && tk.noHashLines && tk.strong);
    await p.waitForTimeout(700);
    const x1 = await p.evaluate(() => document.querySelector('.shop-ticker-track').getBoundingClientRect().x);
    ok(`${label}: ticker moves`, x1 < tk.x0, `${tk.x0} -> ${x1}`);
    await p.click('.shop-ticker-toggle'); await p.mouse.move(0, 0); await p.waitForTimeout(150);
    const xa = await p.evaluate(() => document.querySelector('.shop-ticker-track').getBoundingClientRect().x);
    await p.waitForTimeout(500);
    const xb = await p.evaluate(() => document.querySelector('.shop-ticker-track').getBoundingClientRect().x);
    const pressed = await p.getAttribute('.shop-ticker-toggle', 'aria-pressed');
    ok(`${label}: pause button stops it`, Math.abs(xa - xb) < 1 && pressed === 'true', `${xa} vs ${xb}, pressed ${pressed}`);
    // ---- branches
    const br = await p.evaluate(() => {
      const cards = [...document.querySelectorAll('.shop-branch')];
      const c = cards[0];
      const lds = [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => JSON.parse(s.textContent)).filter(j => j['@type'] === 'LocalBusiness');
      return { n: cards.length, name: c && c.querySelector('h3').textContent, call: c && (c.querySelector('.shop-branch-call') || {}).href,
        wa: c && (c.querySelector('.shop-branch-wa') || {}).href, map: c && (c.querySelector('.shop-branch-map') || {}).href,
        lines: c && c.querySelectorAll('.shop-branch-line').length, ld: lds.length, ldName: lds[0] && lds[0].name, ldTel: lds[0] && lds[0].telephone };
    });
    ok(`${label}: one branch card (example lines with # hidden)`, br.n === 1 && /Gießen/.test(br.name), JSON.stringify(br));
    ok(`${label}: Call, WhatsApp and Directions buttons`, br.call === 'tel:+491570000000' && /^https:\/\/wa\.me\/491570000000\?text=/.test(br.wa) &&
      /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=Musterstra/.test(br.map), `${br.call} | ${br.wa} | ${br.map}`);
    ok(`${label}: LocalBusiness data for Google`, br.ld === 1 && /Gießen/.test(br.ldName) && br.ldTel === '+49 157 0000000', JSON.stringify(br));
    // ---- assistant
    const hasWaFloat = await p.$('.shop-wa-float');
    ok(`${label}: chat bubble shown, separate WhatsApp button not shown`, !!(await p.$('.shop-chat-bubble')) && !hasWaFloat);
    await p.click('.shop-chat-bubble'); await p.waitForTimeout(150);
    const open = await p.evaluate(() => { const pn = document.querySelector('.shop-chat-panel'), r = pn.getBoundingClientRect();
      return { visible: !pn.hidden, inView: r.left >= 0 && r.right <= innerWidth + 1 && r.top >= 0 && r.bottom <= innerHeight + 1, chips: pn.querySelectorAll('.shop-chat-chip').length,
        greet: pn.querySelector('.shop-chat-msg').textContent, focus: document.activeElement.className, bubbleHidden: getComputedStyle(document.querySelector('.shop-chat-bubble')).display === 'none' }; });
    ok(`${label}: chat window opens inside the screen with greeting and 4 suggestions`, open.visible && open.inView && open.chips === 4 && /Kreislo helper/.test(open.greet) && open.focus === 'shop-chat-input', JSON.stringify(open));
    if (label === 'iPhone 13' || label === 'desktop') await p.screenshot({ path: `${out}/ask-open-${label.replace(/\W/g, '')}.png` });
    // tap a suggestion
    await p.click('.shop-chat-chip >> nth=1'); await p.waitForTimeout(100);
    const a1 = await p.evaluate(() => [...document.querySelectorAll('.shop-chat-msg.is-bot')].pop().textContent);
    ok(`${label}: suggestion "Do you ship to Kenya?" answered from the FAQ`, /next shipping date/.test(a1), a1.slice(0, 90));
    // typed questions in other words
    const ask = async q => { await p.fill('.shop-chat-input', q); await p.press('.shop-chat-input', 'Enter'); await p.waitForTimeout(100);
      return p.evaluate(() => { const m = [...document.querySelectorAll('.shop-chat-msg.is-bot')]; return m.slice(-2).map(x => x.textContent).join(' || '); }); };
    const cases = [
      ['can i pay with paypal', /bank transfer, PayPal/i], ['where can I collect my washing machine?', /Pickup is in Gießen/],
      ['when are you open', /Monday to Friday/], ['is the fridge working properly', /checked, cleaned and tested/],
      ['how much is freight to nairobi', /depends on size and weight/], ['I want to return something', /within 14 days/],
      ['where is my parcel', /order number by email/]];
    for (const [q, re] of cases) { const a = await ask(q); ok(`${label}: "${q}"`, re.test(a), a.slice(0, 110)); }
    const linkOk = await p.evaluate(() => [...document.querySelectorAll('.shop-chat-msg a')].some(a => a.getAttribute('href') === '/p/kenya.html'));
    ok(`${label}: /p/kenya.html in an answer becomes a link`, linkOk);
    const none = await ask('do you repair bicycles');
    const waBtn = await p.evaluate(() => { const a = [...document.querySelectorAll('.shop-chat-wa-btn')].pop(); return a && decodeURIComponent(a.href); });
    ok(`${label}: unknown question → WhatsApp with the question typed in`, /do not have an answer/.test(none) && /my question: do you repair bicycles/.test(waBtn || ''), (waBtn || '').slice(0, 120));
    const logged = ctx.posts.filter(x => x.kind === 'question');
    ok(`${label}: unanswered question logged once (no consent, no personal data)`, logged.length === 1 && logged[0].fields.Question === 'do you repair bicycles' && !logged[0].consent, JSON.stringify(logged));
    await ask('do you repair bicycles');
    ok(`${label}: same question not logged twice`, ctx.posts.filter(x => x.kind === 'question').length === 1);
    const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(`${label}: no sideways scrolling with chat open`, over <= 0, over + 'px');
    if (label === 'iPhone 13' || label === 'desktop') await p.screenshot({ path: `${out}/ask-chat-${label.replace(/\W/g, '')}.png` });
    await p.keyboard.press('Escape'); await p.waitForTimeout(100);
    const closed = await p.evaluate(() => ({ hidden: document.querySelector('.shop-chat-panel').hidden, focus: document.activeElement.className }));
    ok(`${label}: Escape closes, focus back on the bubble`, closed.hidden && /shop-chat-bubble/.test(closed.focus), JSON.stringify(closed));
    if (label === 'iPhone 13' || label === 'desktop') {
      await p.evaluate(() => scrollTo(0, 0));
      await p.screenshot({ path: `${out}/ticker-${label.replace(/\W/g, '')}.png` });
      await p.evaluate(() => document.querySelector('#branches').scrollIntoView());
      await p.screenshot({ path: `${out}/branches-${label.replace(/\W/g, '')}.png` });
    }
    // other pages: bubble everywhere, ticker and branches only on the homepage
    for (const pg of ['post', 'kenya', 'team', 'fulfilment']) {
      await p.goto(base + pg + '.html'); await p.waitForTimeout(200);
      const st = await p.evaluate(() => ({ bubble: !!document.querySelector('.shop-chat-bubble'), ticker: !!document.querySelector('.ticker'),
        over: document.documentElement.scrollWidth - innerWidth }));
      ok(`${label}: ${pg} – chat bubble, no ticker, no sideways scrolling`, st.bubble && !st.ticker && st.over <= 0, JSON.stringify(st));
    }
    ok(`${label}: no script errors`, pe.length === 0, pe.join(' | '));
    await ctx.close();
  }
  // German page: German questions, German answers
  {
    const ctx = await ctxFor({ viewport: { width: 1366, height: 900 } }, { locale: 'de-DE' }); const p = await ctx.newPage();
    await p.addInitScript(() => { try { localStorage.setItem('shop-lang', 'de'); } catch (e) {} });
    await p.goto(base + 'home.html'); await p.waitForTimeout(300);
    const de = await p.evaluate(() => ({ bubble: document.querySelector('.shop-chat-bubble').textContent, ticker: document.querySelector('.shop-ticker').textContent,
      branch: (document.querySelector('.shop-branch-call') || {}).textContent }));
    ok('German: bubble, ticker and branch buttons in German', /Fragen Sie Kreislo/.test(de.bubble) && /Waschmaschinen/.test(de.ticker) && /Anrufen/.test(de.branch), JSON.stringify(de).slice(0, 200));
    await p.click('.shop-chat-bubble'); await p.fill('.shop-chat-input', 'kann ich mit paypal zahlen'); await p.press('.shop-chat-input', 'Enter'); await p.waitForTimeout(100);
    const a = await p.evaluate(() => [...document.querySelectorAll('.shop-chat-msg.is-bot')].pop().textContent);
    ok('German: "kann ich mit paypal zahlen" answered in German', /Überweisung, PayPal/.test(a), a.slice(0, 100));
    await ctx.close();
  }
  // Reduced motion: ticker stands still and can be scrolled by hand
  {
    const ctx = await ctxFor({ viewport: { width: 390, height: 844 } }, { reducedMotion: 'reduce' }); const p = await ctx.newPage();
    await p.goto(base + 'home.html'); await p.waitForTimeout(300);
    const st = await p.evaluate(() => { const box = document.querySelector('.shop-ticker'); return { still: box.classList.contains('is-still'), moving: box.classList.contains('is-moving'),
      toggle: getComputedStyle(box.querySelector('.shop-ticker-toggle')).display, scroll: getComputedStyle(box.querySelector('.shop-ticker-view')).overflowX }; });
    ok('Reduce motion: ticker does not move, no pause button, can be swiped', st.still && !st.moving && st.toggle === 'none' && st.scroll === 'auto', JSON.stringify(st));
    await ctx.close();
  }
  // Empty gadgets: sections hide, and without a Q&A list the old WhatsApp button comes back
  {
    const ctx = await ctxFor({ viewport: { width: 1366, height: 900 } }); const p = await ctx.newPage();
    await p.route('**/preview/home.html', async r => { const res = await r.fetch(); let html = await res.text();
      html = html.replace(/<div class="shop-ticker">[\s\S]*?<\/div><\/div><\/div><\/section>/, '<div class="shop-ticker"></div></div></div></section>')
        .replace(/<div class="shop-branches">[\s\S]*?<\/div>\]?\]?<\/div><\/div><\/div><\/div><\/section>/, '<div class="shop-branches"></div></div></div></div></section>')
        .replace(/<div class='shop-assistant'>[\s\S]*?<\/div><\/div><\/div>\n/, "<div class='shop-assistant'></div></div>\n")
        .replace(/<div class="shop-faq">[\s\S]*?<\/div>\n<\/div><\/div><\/div><\/div><\/section>/, '<div class="shop-faq"></div></div></div></div></section>');
      r.fulfill({ response: res, body: html, headers: { 'content-type': 'text/html; charset=utf-8' } }); });
    await p.goto(base + 'home.html'); await p.waitForTimeout(300);
    const st = await p.evaluate(() => ({ ticker: document.querySelector('.ticker').hidden, branches: document.querySelector('.branches').hidden,
      bubble: !!document.querySelector('.shop-chat-bubble'), wa: !!document.querySelector('.shop-wa-float') }));
    ok('Empty gadgets: ticker and branches hidden, no chat bubble, WhatsApp button back', st.ticker && st.branches && !st.bubble && st.wa, JSON.stringify(st));
    await ctx.close();
  }
  await b.close();
  const fails = results.filter(r => r[0] === 'FAIL');
  results.forEach(r => console.log(r[0], r[1], r[0] === 'FAIL' ? '→ ' + r[2] : ''));
  console.log(`\n${results.length - fails.length}/${results.length} passed`);
})();
