// Run: node blogger-theme/tests/featuretest.js   (after: python3 scripts/build.py && python3 scripts/preview.py)
// Technology tile, Message & Video block, Newsletter sign-up, Certifications row (EFIC theme previews).
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node-tools/node_modules/playwright'); } })();
const path = require('path'), fs = require('fs');
const S = __dirname, PV = path.join(__dirname, '..', 'preview') + '/';
const FA = process.env.FA || S + '/fa';
const R = []; const ok = (c, m) => R.push((c ? 'PASS ' : 'FAIL ') + m);
const HOME = fs.readFileSync(PV + 'home.html', 'utf8'), POST = fs.readFileSync(PV + 'post.html', 'utf8');
const SIG = "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27300%27 height=%2790%27%3E%3Cpath d=%27M10 60 C60 0 90 90 140 30 S240 60 290 40%27 stroke=%27black%27 fill=%27none%27 stroke-width=%274%27/%3E%3C/svg%3E";
const VARIANTS = {
  textOnly: h => h.replace(/<div id='HTML11' class='widget HTML'>[\s\S]*?<\/div><\/div>/, ''),
  signature: h => h.replace(/<div id='HTML10' class='widget HTML'>[\s\S]*?<\/div><\/div>/,
      "<div id='Text5' class='widget Text'><h2 class='title'>A word from our director</h2><div class='widget-content'>Building better businesses together<br>We work alongside your team, not above it.<br>We measure success by your results.<br>— Jane Doe, Managing Director<br><img src=\"" + SIG + "\" alt=''></div></div>")
    .replace(/<div id='HTML11' class='widget HTML'>[\s\S]*?<\/div><\/div>/,
      "<div class='widget Image' id='Image20'><h2>Our services</h2><div class='widget-content'><a href='/p/our-services.html'><img id='Image20_img' alt='' src='https://blogger.googleusercontent.com/img/b/x/s1600/team.jpg'/></a><br/><span class='caption'>What we do</span></div></div>"),
  gforms: h => h.replace('askeficc@gmail.com</div>', 'https://docs.google.com/forms/d/e/1FAIpQLSdTEST/formResponse?entry.123456</div>'),
  mailchimp: h => h.replace('askeficc@gmail.com</div>', 'https://efic.us21.list-manage.com/subscribe/post?u=abc&amp;id=def</div>'),
  mailerlite: h => h.replace('askeficc@gmail.com</div>', 'https://assets.mailerlite.com/jsonp/12345/forms/67890/subscribe</div>'),
  noCerts: h => h.replace(/(id='footer-certifications'[^>]*>)[\s\S]*?(<\/div>\s*<\/div>\s*<div style='clear:both'>)/, '$1$2'),
  empty: h => h.replace(/(id='feature-story'[^>]*>)[\s\S]*?(<\/div>\s*<\/div>\s*<div class='insta-wrap')/, '$1$2'),
};

(async () => {
  const b = await chromium.launch({executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', proxy: process.env.HTTPS_PROXY ? {server: process.env.HTTPS_PROXY} : undefined});
  async function open(w, opts = {}) {
    const c = await b.newContext({viewport: {width: w, height: 900}, ignoreHTTPSErrors: true});
    const posts = [];
    await c.route(/font-awesome\.min\.css/, r => fs.existsSync(FA) ? r.fulfill({path: path.join(FA, 'css/font-awesome.min.css'), contentType: 'text/css'}) : r.fulfill({body: ''}));
    await c.route(/\/fonts\/fontawesome-webfont/, r => fs.existsSync(FA) ? r.fulfill({path: path.join(FA, 'fonts', new URL(r.request().url()).pathname.split('/').pop())}) : r.fulfill({body: ''}));
    await c.route(/youtube\.com\/embed|google\.com\/maps|translate\.google|youtube-nocookie\.com/, r => r.fulfill({body: '<html><body>video</body></html>', contentType: 'text/html'}));
    await c.route(/i\.ytimg\.com|googleusercontent\.com\/img/, r => r.fulfill({path: S + '/fixtures/ytthumb.jpg', contentType: 'image/jpeg'}));
    await c.route(/docs\.google\.com|list-manage\.com|mailerlite\.com/, r => { posts.push({url: r.request().url(), method: r.request().method(), body: r.request().postData() || ''}); return r.fulfill({body: '<html><body>Thanks</body></html>', contentType: 'text/html'}); });
    await c.route(/^https:\/\/eficc\.blogspot\.com\//, r => {
      if (r.request().resourceType() !== 'document') return r.fulfill({body: ''});
      let html = new URL(r.request().url()).pathname.length > 1 ? POST : HOME;
      (opts.variants || []).forEach(v => { html = VARIANTS[v](html); });
      return r.fulfill({contentType: 'text/html', body: html});
    });
    const p = await c.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(opts.url || 'https://eficc.blogspot.com/', {waitUntil: 'networkidle'});
    await p.waitForTimeout(400);
    return {c, p, errs, posts};
  }
  const box = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return {l: r.left, r: r.right, t: r.top + scrollY, b: r.bottom + scrollY, w: r.width, cx: (r.left + r.right) / 2}; }, sel);

  // 1. Every width: nothing cut off at the sides, no sideways scroll, no JS errors
  for (const w of [320, 390, 768, 1024, 1440, 1920]) {
    const {c, p, errs} = await open(w);
    const m = await p.evaluate(() => {
      const bad = [...document.querySelectorAll('.special-wrap *, .efic-feature *, .efic-newsletter *, #jugas_footer *, #office-contacts *')].filter(e => {
        if (!e.getClientRects().length || getComputedStyle(e).visibility === 'hidden' || e.closest('.en-trap') || e.classList.contains('en-trap')) return false;
        const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1);
      }).map(e => (e.className || e.tagName) + ':' + Math.round(e.getBoundingClientRect().left) + '-' + Math.round(e.getBoundingClientRect().right));
      return {sw: document.documentElement.scrollWidth, iw: innerWidth, bad: bad.slice(0, 5)};
    });
    ok(m.sw <= m.iw && !m.bad.length && !errs.length, `@${w}: nothing cut off at the sides (${m.bad.join(', ') || 'none'}), no sideways scroll, JS errors: ${errs.join('; ') || 'none'}`);
    await c.close();
  }

  // 2. Areas of Expertise: Technology tile, last row centred
  {
    const {c, p} = await open(1440);
    const t = await p.evaluate(() => { const tiles = [...document.querySelectorAll('.special-tiles-link')]; const last = tiles[tiles.length - 1];
      return {n: tiles.length, last: last.querySelector('.special-heading').textContent, icon: !!last.querySelector('.fa-microchip'), href: last.getAttribute('href')}; });
    const wrap = await box(p, '.special-wrap'), last = await box(p, '.special-tiles-link:last-of-type');
    ok(t.n === 7 && t.last === 'Technology' && t.icon && t.href === '/p/our-services.html', 'seventh tile "Technology" with a microchip icon, linking to Our Services');
    ok(Math.abs(last.cx - wrap.cx) <= 2, 'the single tile on the last row is centred');
    await c.close();
    const m = await open(390);
    const rows = await m.p.evaluate(() => [...document.querySelectorAll('.special-tiles-link')].map(a => Math.round(a.getBoundingClientRect().width)));
    ok(rows.every(x => x >= 350), 'phones: one tile per row');
    await m.c.close();
  }

  // 3. Message & Video block
  {
    const {c, p, errs} = await open(1440);
    const f = await p.evaluate(() => ({after: (n => n && /efic-stats-wrap/.test(n.className) ? n.nextElementSibling : n)(document.getElementById('section-2').nextElementSibling).className, kicker: (document.querySelector('.ef-kicker') || {}).textContent,
      head: (document.querySelector('.ef-headline') || {}).textContent, mk: (document.querySelector('.ef-media-kicker') || {}).textContent, mt: (document.querySelector('.ef-media-title') || {}).textContent,
      img: (document.querySelector('.ef-media-img') || {}).src, section: getComputedStyle(document.getElementById('feature-story')).display}));
    ok(/efic-feature-wrap has-feature/.test(f.after) && f.section === 'none', 'sits right under "Our Areas of Expertise" (after the Numbers band, when it has figures)');
    ok(f.kicker === 'Who we are' && f.head === 'Driving Efficacy & Effective Solutions' && f.mk === 'See how we work' && f.mt === 'EFIC in action' && /i\.ytimg\.com\/vi\/2bjBiOVQrUs\//.test(f.img), 'text side and video card built from the two gadgets ' + JSON.stringify(f));
    const tx = await box(p, '.ef-text'), md = await box(p, '.ef-media');
    ok(tx.r < md.l && md.t < tx.b, 'desktop: text on the left, video card on the right');
    await p.click('.ef-play');
    const d = await p.evaluate(() => { const lb = document.querySelector('.ef-lightbox'); return lb && {role: lb.getAttribute('role'), modal: lb.getAttribute('aria-modal'), src: lb.querySelector('iframe').src,
      focus: document.activeElement.className, lock: document.documentElement.classList.contains('ef-noscroll')}; });
    ok(d && d.role === 'dialog' && d.modal === 'true' && d.src === 'https://www.youtube-nocookie.com/embed/2bjBiOVQrUs?autoplay=1&rel=0&playsinline=1' && /ef-close/.test(d.focus) && d.lock, 'Play video opens the video in a pop-up (loads only now), focus on Close, page scroll locked ' + JSON.stringify(d));
    await p.screenshot({path: S + '/shots/feature-video-open.png'});
    await p.keyboard.press('Tab');
    ok(await p.evaluate(() => /ef-close/.test(document.activeElement.className)), 'Tab stays inside the pop-up');
    await p.keyboard.press('Escape');
    ok(await p.evaluate(() => !document.querySelector('.ef-lightbox') && /ef-play/.test(document.activeElement.className) && !document.documentElement.classList.contains('ef-noscroll')), 'Escape closes it, stops the video and returns focus to Play');
    await p.click('.ef-play'); await p.mouse.click(5, 450);
    ok(await p.evaluate(() => !document.querySelector('.ef-lightbox')), 'clicking outside the video closes it');
    await p.click('.ef-play'); await p.click('.ef-close');
    ok(await p.evaluate(() => !document.querySelector('.ef-lightbox')), 'the Close button closes it');
    await p.locator('.efic-feature-wrap').screenshot({path: S + '/shots/feature-1440.png'});
    ok(!errs.length, 'no JS errors ' + errs.join('; '));
    await c.close();
  }
  {
    const {c, p} = await open(390);
    const tx = await box(p, '.ef-text'), md = await box(p, '.ef-media');
    ok(tx.b <= md.t && md.w >= 350, 'phones: text first, then a full-width video card');
    await p.locator('.efic-feature-wrap').screenshot({path: S + '/shots/feature-390.png'});
    await c.close();
  }
  {
    const {c, p} = await open(1440, {variants: ['signature']});
    const s = await p.evaluate(() => ({kicker: document.querySelector('.ef-kicker').textContent, name: (document.querySelector('.ef-name') || {}).textContent,
      body: document.querySelectorAll('.ef-body').length, sig: !!document.querySelector('.ef-text img.ef-signature'), more: (document.querySelector('.ef-media a.efic-btn') || {}).textContent,
      moreHref: (document.querySelector('.ef-media a.efic-btn') || {}).href, mk: (document.querySelector('.ef-media-kicker') || {}).textContent, play: !!document.querySelector('.ef-play')}));
    ok(s.kicker === 'A word from our director' && s.name === 'Jane Doe, Managing Director' && s.body === 2 && s.sig, 'Text gadget: "— Name, title" line and signature image (not mistaken for the photo card) ' + JSON.stringify(s));
    ok(s.more === 'Learn more' && /\/p\/our-services\.html$/.test(s.moreHref) && s.mk === 'What we do' && !s.play, 'Image gadget with a page link: photo card with a Learn more button');
    await p.locator('.efic-feature-wrap').screenshot({path: S + '/shots/feature-signature.png'});
    await c.close();
  }
  {
    const {c, p} = await open(1440, {variants: ['textOnly']});
    ok(await p.evaluate(() => document.querySelector('.efic-feature').classList.contains('is-single') && !document.querySelector('.ef-media')), 'only a text gadget: a single centred column');
    await c.close();
  }
  {
    const {c, p} = await open(1440, {variants: ['empty']});
    ok(await p.evaluate(() => !document.querySelector('.efic-feature') && getComputedStyle(document.querySelector('.efic-feature-wrap')).display === 'none'), 'no gadgets: the block does not appear');
    await c.close();
  }
  {
    const {c, p} = await open(1440, {url: 'https://eficc.blogspot.com/2026/03/iso-9001.html'});
    ok(await p.evaluate(() => getComputedStyle(document.querySelector('.efic-feature-wrap')).display === 'none'), 'posts and pages: not shown (homepage only)');
    ok(await p.evaluate(() => getComputedStyle(document.querySelector('.efic-newsletter-wrap')).display === 'block'), 'newsletter band shows on posts too');
    await c.close();
  }

  // 4. Newsletter sign-up
  {
    const {c, p, errs} = await open(1440);
    const n = await p.evaluate(() => ({title: document.querySelector('.en-title').textContent, text: document.querySelector('.en-text').textContent, consent: document.querySelector('.en-consent').textContent.trim(),
      emailShown: document.querySelector('.efic-newsletter').textContent.includes('askeficc@gmail.com')}));
    ok(n.title === 'Stay informed' && /^Practical insights/.test(n.text) && n.consent === 'I agree to receive emails from Efic Consultancy Ltd. I can unsubscribe at any time.' && !n.emailShown, 'band built from the gadget; the receiving address is not shown ' + JSON.stringify(n));
    const msg = () => p.evaluate(() => ({t: document.querySelector('.en-msg').textContent, err: document.querySelector('.en-msg').classList.contains('is-error'), href: (document.querySelector('.en-msg a') || {}).href}));
    await p.click('.en-submit'); let m = await msg();
    ok(m.err && /valid email/.test(m.t), 'empty email: asks for a valid address');
    await p.fill('.en-email', 'test@example.com'); await p.click('.en-submit'); m = await msg();
    ok(m.err && /tick the box/.test(m.t), 'no consent tick: asks for it');
    await p.check('.en-consent input'); await p.click('.en-submit'); m = await msg();
    ok(!m.err && /Thank you/.test(m.t) && m.href === 'mailto:askeficc@gmail.com?subject=Newsletter%20sign-up&body=Please%20add%20test%40example.com%20to%20your%20newsletter.', 'no list set up yet: the sign-up is emailed to askeficc@gmail.com ' + m.href);
    await p.locator('.efic-newsletter-wrap').screenshot({path: S + '/shots/newsletter-1440.png'});
    ok(!errs.length, 'no JS errors ' + errs.join('; '));
    await c.close();
  }
  {
    const {c, p} = await open(1440);
    await p.evaluate(() => { document.querySelector('.en-trap').value = 'bot'; });
    await p.fill('.en-email', 'bot@example.com'); await p.check('.en-consent input'); await p.click('.en-submit');
    ok(await p.evaluate(() => document.querySelector('.en-msg').textContent === ''), 'spam bots that fill the hidden field are ignored');
    await c.close();
  }
  for (const [v, field, host] of [['gforms', 'entry.123456', /docs\.google\.com\/forms\/d\/e\/1FAIpQLSdTEST\/formResponse$/], ['mailchimp', 'EMAIL', /list-manage\.com\/subscribe\/post\?u=abc&id=def$/], ['mailerlite', 'fields%5Bemail%5D', /mailerlite\.com\/jsonp\/12345\/forms\/67890\/subscribe$/]]) {
    const {c, p, posts} = await open(1440, {variants: [v]});
    await p.fill('.en-email', 'test@example.com'); await p.check('.en-consent input');
    const [tab] = await Promise.all([c.waitForEvent('page', {timeout: 10000}), p.click('.en-submit')]);
    await tab.waitForLoadState().catch(() => {}); await p.waitForTimeout(300);
    const sent = posts[0] || {};
    ok(sent.method === 'POST' && host.test(sent.url) && sent.body === field + '=test%40example.com' && (v === 'gforms' ? /now on our mailing list/ : /check your inbox/).test(await p.textContent('.en-msg')), `${v}: email posted to the list in a new tab (${sent.url} ${sent.body})`);
    await c.close();
  }
  {
    const {c, p} = await open(390);
    const i = await box(p, '.en-email'), s = await box(p, '.en-submit');
    ok(s.t >= i.b && Math.abs(s.w - i.w) <= 1, 'phones: email box and Subscribe button stacked, full width');
    await p.locator('.efic-newsletter-wrap').screenshot({path: S + '/shots/newsletter-390.png'});
    await c.close();
  }

  // 5. Certifications & Memberships (footer)
  {
    const {c, p, errs} = await open(1440);
    const cert = await p.evaluate(() => ({head: (document.querySelector('.cert-head') || {}).textContent, items: [...document.querySelectorAll('.cert-list li')].map(li => ({img: !!li.querySelector('img'), cap: (li.querySelector('.cert-caption') || {}).textContent,
      text: li.querySelector('.cert-badge.is-text') ? li.textContent : '', target: (li.querySelector('a') || {}).target}))}));
    ok(cert.head === 'Certifications & Memberships' && cert.items.length === 3 && cert.items[0].img && cert.items[0].cap === 'Sample badge A' && cert.items[0].target === '_blank' && cert.items[2].text === 'Member: Sample Association (sample)',
      'footer row: badges from Image gadgets (with captions, links open in a new tab) and a text badge ' + JSON.stringify(cert));
    const soc = await box(p, '.foot-social'), cr = await box(p, '.foot-certs'), cp = await box(p, '.jugas_footer_copyright');
    ok(soc.b <= cr.t + 1 && cr.b <= cp.t + 1, 'placed between the social icons and the copyright line');
    await p.locator('#jugas_footer').screenshot({path: S + '/shots/footer-1440.png'});
    ok(!errs.length, 'no JS errors ' + errs.join('; '));
    await c.close();
  }
  {
    const {c, p} = await open(1440, {variants: ['noCerts']});
    ok(await p.evaluate(() => !document.querySelector('.cert-list') && getComputedStyle(document.querySelector('.foot-certs')).display === 'none'), 'no badge gadgets: no row, no heading');
    await c.close();
  }
  {
    const {c, p} = await open(320);
    await p.locator('#jugas_footer').screenshot({path: S + '/shots/footer-320.png'});
    const icons = await p.evaluate(() => [...document.querySelectorAll('#jugas_footer ul#social li')].filter(l => l.offsetWidth).every(l => { const r = l.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; }));
    ok(icons, '320 px: every footer social icon is fully on screen (they wrap)');
    await c.close();
  }

  // 6. Layout editor: the three new sections can be edited
  {
    const c = await b.newContext({viewport: {width: 1440, height: 900}}); const p = await c.newPage();
    await p.goto('file://' + PV + 'layout.html', {waitUntil: 'networkidle'});
    const l = await p.evaluate(() => ['feature-story', 'newsletter', 'footer-certifications'].map(id => { const s = document.getElementById(id); return s && {id, vis: s.offsetHeight > 0, head: s.querySelector('h4').textContent, add: !!s.querySelector('.add_widget')}; }));
    ok(l.every(x => x && x.vis && x.add) && l.map(x => x.head).join(' | ') === 'Message & Video (homepage) | Newsletter sign-up | Certifications & Memberships (footer)', 'Layout shows all three new sections with Add a Gadget ' + JSON.stringify(l));
    await c.close();
  }
  await b.close();
  console.log(R.join('\n')); console.log(R.filter(r => r.startsWith('PASS')).length + '/' + R.length + ' passed');
  process.exit(R.some(r => r.startsWith('FAIL')) ? 1 : 0);
})().catch(e => { console.log(R.join('\n')); console.error(e); process.exit(1); });
