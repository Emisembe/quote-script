// Run: node blogger-theme/tests/<file>.js   (after: python3 scripts/build.py && python3 scripts/preview.py)
// Needs Playwright + Chromium. Font Awesome 4.7 is optional: set FA=/path/to/font-awesome/package for icons in screenshots.
// Slideshow (Layout > Slideshow) on the EFIC theme previews.
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node-tools/node_modules/playwright'); } })();
const path = require('path'), fs = require('fs');
const S = __dirname;
const FA = process.env.FA || S + '/fa', PV = require('path').join(__dirname, '..', 'preview') + '/';
const R = []; const ok = (c, m) => R.push((c ? 'PASS ' : 'FAIL ') + m);
const HOME = fs.readFileSync(PV + 'home.html', 'utf8'), POST = fs.readFileSync(PV + 'post.html', 'utf8');
const EXTRA = "<div class='widget Image' id='Image2'><h2>Blogger photo</h2><div class='widget-content'><img id='Image2_img' alt='' src='https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEtest/s640/photo.jpg'/><br/><span class='caption'>Uploaded in Layout</span></div></div>"
  + "<div class='widget HTML' id='HTML11'><h2 class='title'>Plain photo link</h2><div class='widget-content'>https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEtest2/w640-h360/team.jpg</div></div>"
  + "<div class='widget HTML' id='HTML12'><h2 class='title'>Short video</h2><div class='widget-content'><a href='https://youtu.be/HHP_3h1BjhA?si=x'>Watch</a></div></div>";

(async () => {
  const b = await chromium.launch({executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', proxy: {server: process.env.HTTPS_PROXY}});
  async function open(w, opts = {}) {
    const c = await b.newContext({viewport: {width: w, height: opts.h || 800}, ignoreHTTPSErrors: true, hasTouch: !!opts.touch, reducedMotion: opts.reduce ? 'reduce' : 'no-preference'});
    await c.route(/font-awesome\.min\.css/, r => fs.existsSync(FA) ? r.fulfill({path: path.join(FA, 'css/font-awesome.min.css'), contentType: 'text/css'}) : r.fulfill({body: ''}));
    await c.route(/\/fonts\/fontawesome-webfont/, r => fs.existsSync(FA) ? r.fulfill({path: path.join(FA, 'fonts', new URL(r.request().url()).pathname.split('/').pop())}) : r.fulfill({body: ''}));
    await c.route(/youtube\.com\/embed|google\.com\/maps|translate\.google/, r => r.fulfill({body: '', contentType: 'text/html'}));
    await c.route(/youtube-nocookie\.com/, r => r.fulfill({body: '<html><body style="background:#000">video</body></html>', contentType: 'text/html'}));
    await c.route(/i\.ytimg\.com/, r => r.fulfill({path: S + '/fixtures' + (/maxresdefault/.test(r.request().url()) && opts.noMaxres ? '/ytmissing.jpg' : '/ytthumb.jpg'), contentType: 'image/jpeg'}));
    await c.route(/googleusercontent\.com\/img/, r => r.fulfill({path: S + '/fixtures/bigphoto.jpg', contentType: 'image/jpeg'}));
    await c.route(/^https:\/\/eficc\.blogspot\.com\//, r => {
      if (r.request().resourceType() !== 'document') return r.fulfill({body: ''});
      const u = new URL(r.request().url());
      let html = u.pathname.length > 1 ? POST : HOME;
      if (opts.extra) html = html.replace("<div class='widget Text' id='Text2'>", EXTRA + "<div class='widget Text' id='Text2'>");
      if (opts.empty) html = html.replace(/(id='slideshow'[^>]*>)[\s\S]*?(<\/div>\s*<\/div>\s*<div id='header-wrapper'>)/, '$1$2');
      return r.fulfill({contentType: 'text/html', body: html});
    });
    const p = await c.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message));
    if (opts.clock) await p.clock.install();
    await p.goto(opts.url || 'https://eficc.blogspot.com/', {waitUntil: 'networkidle'});
    await p.waitForTimeout(300);
    return {c, p, errs};
  }
  const active = p => p.evaluate(() => [...document.querySelectorAll('.es-slide')].findIndex(s => s.classList.contains('is-active')));

  // 1. Slides from gadgets
  {
    const {c, p, errs} = await open(1440);
    const s = await p.evaluate(() => [...document.querySelectorAll('.es-slide')].map(x => ({cls: x.className, h: (x.querySelector('h3') || {}).textContent, cap: (x.querySelector('.es-caption p') || {}).textContent,
      img: (x.querySelector('img') || {}).getAttribute && x.querySelector('img').getAttribute('src').slice(0, 40), link: (x.querySelector('a.es-media') || {}).getAttribute && x.querySelector('a.es-media').getAttribute('href'),
      label: x.getAttribute('aria-label')})));
    ok(s.length === 3, '3 gadgets -> 3 slides');
    ok(s[0] && /^data:image\/svg/.test(s[0].img) && s[0].h === 'ISO 9001 Readiness Workshops' && s[0].cap === 'Practical certification support for growing businesses' && /#section-2$/.test(s[0].link), 'Image gadget -> photo slide with title, caption and link ' + JSON.stringify(s[0]));
    ok(s[1] && /is-video/.test(s[1].cls) && s[1].img.startsWith('https://i.ytimg.com/vi/2bjBiOVQrUs/maxre') && s[1].h === 'EFIC in 90 seconds' && !s[1].cap, 'YouTube link in an HTML gadget -> video slide with thumbnail ' + JSON.stringify(s[1]));
    ok(s[2] && /is-text/.test(s[2].cls) && s[2].h === 'Now serving Mombasa', 'text-only gadget -> text slide');
    ok(s.every((x, i) => x.label.startsWith((i + 1) + ' / 3')), 'slides are labelled "1 / 3" ... for screen readers');
    const lay = await p.evaluate(() => {
      const bar = document.querySelector('.tm-menu').getBoundingClientRect(), sl = document.querySelector('.efic-slider').getBoundingClientRect(), hero = document.querySelector('#header-wrapper').getBoundingClientRect();
      return {barBg: getComputedStyle(document.querySelector('.tm-menu')).backgroundColor, barBottom: bar.bottom, slTop: sl.top, slW: sl.width, slH: Math.round(sl.height), heroTop: Math.round(hero.top), heroH: Math.round(hero.height), section: getComputedStyle(document.getElementById('slideshow')).display};
    });
    ok(/rgba?\(20, 33, 61/.test(lay.barBg) && Math.abs(lay.slTop - lay.barBottom) <= 2 && lay.slW === 1440 && lay.section === 'none', 'slideshow sits just below a solid menu bar, full width ' + JSON.stringify(lay));
    const heroVis = await p.evaluate(() => { const t = document.querySelector('#header h1'); t.scrollIntoView({block: 'center', behavior: 'instant'}); const r = t.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); const btn = document.querySelector('.hero-cta .efic-btn-gold'), br = btn.getBoundingClientRect();
      return {title: !!top && (top === t || t.contains(top)), btn: document.elementFromPoint(br.left + br.width / 2, br.top + br.height / 2) === btn}; });
    await p.evaluate(() => window.scrollTo({top: 0, behavior: 'instant'}));
    ok(heroVis.title && heroVis.btn, 'company title and Get in Touch button are on top, not under the navy tint ' + JSON.stringify(heroVis));
    ok(lay.slH === Math.min(Math.round(1440 * 9 / 16), Math.round(0.78 * 800)) && lay.heroTop >= lay.slTop + lay.slH - 1 && lay.heroH < 800, 'then the compact title band (not a second full-screen hero)');
    await p.screenshot({path: S + '/shots/slider-1440.png'});
    ok(!errs.length, 'no JS errors ' + errs.join('; '));
    await c.close();
  }
  // 2. Moving: auto-advance, pause on hover, pause button, arrows, dots, keyboard
  {
    const {c, p, errs} = await open(1440, {clock: true});
    await p.mouse.move(5, 790);
    await p.clock.runFor(6500); const a1 = await active(p);
    await p.clock.runFor(6500); const a2 = await active(p);
    ok(a1 === 1 && a2 === 2, `moves on every 6 s (${a1}, ${a2})`);
    await p.hover('.efic-slider'); await p.clock.runFor(13000);
    ok(await active(p) === 2, 'stops while the mouse is over it');
    await p.mouse.move(5, 790);
    await p.click('.es-pause');
    ok(await p.getAttribute('.es-pause', 'aria-label') === 'Play slideshow', 'pause button');
    await p.mouse.move(5, 790); await p.clock.runFor(20000);
    ok(await active(p) === 2, 'stays paused');
    await p.click('.es-next'); ok(await active(p) === 0, 'next arrow wraps round to the first slide');
    await p.click('.es-prev'); ok(await active(p) === 2, 'previous arrow');
    await p.click('.es-dot >> nth=1'); ok(await active(p) === 1 && await p.getAttribute('.es-dot >> nth=1', 'aria-current') === 'true', 'dots');
    await p.focus('.es-dot >> nth=1'); await p.keyboard.press('ArrowRight'); ok(await active(p) === 2, 'keyboard arrows');
    ok(await p.evaluate(() => [...document.querySelectorAll('.es-slide:not(.is-active) a, .es-slide:not(.is-active) button')].every(e => e.tabIndex === -1)), 'hidden slides are skipped by Tab');
    ok(!errs.length, 'no JS errors ' + errs.join('; '));
    await c.close();
  }
  // 3. Video: plays only when pressed, stops the slideshow, stops when leaving the slide
  {
    const {c, p, errs} = await open(1440, {clock: true});
    await p.click('.es-dot >> nth=1');
    const before = await p.evaluate(() => document.querySelectorAll('iframe[src*="youtube-nocookie"]').length);
    await p.click('.es-slide.is-active .es-video');
    const v = await p.evaluate(() => { const f = document.querySelector('.es-slide.is-active iframe'); return {src: f && f.src, playing: document.querySelector('.efic-slider').classList.contains('is-playing'), cap: getComputedStyle(document.querySelector('.es-slide.is-active .es-caption')).display, dots: getComputedStyle(document.querySelector('.es-dots')).display}; });
    ok(before === 0 && v.src === 'https://www.youtube-nocookie.com/embed/2bjBiOVQrUs?autoplay=1&rel=0&playsinline=1', 'video loads only when Play is pressed (privacy-friendly youtube-nocookie) ' + v.src);
    ok(v.playing && v.cap === 'none' && v.dots === 'none', 'caption and dots move out of the way of the video controls');
    await p.mouse.move(5, 790); await p.clock.runFor(30000);
    ok(await active(p) === 1, 'slideshow waits while the video plays');
    await p.screenshot({path: S + '/shots/slider-video-playing.png'});
    await p.click('.es-next');
    ok(await p.evaluate(() => !document.querySelector('.efic-slider iframe') && !!document.querySelectorAll('.es-slide')[1].querySelector('.es-video') && !document.querySelector('.efic-slider').classList.contains('is-playing')), 'moving on stops the video and puts the thumbnail back');
    ok(!errs.length, 'no JS errors ' + errs.join('; '));
    await c.close();
  }
  // 4. Other gadget formats and image sharpness
  {
    const {c, p} = await open(1440, {extra: true, noMaxres: true});
    const s = await p.evaluate(() => [...document.querySelectorAll('.es-slide')].map(x => ({h: (x.querySelector('h3') || {}).textContent, img: x.querySelector('img') && x.querySelector('img').src, video: x.classList.contains('is-video')})));
    const by = h => s.find(x => x.h === h) || {};
    ok(/\/s1920\/photo\.jpg$/.test(by('Blogger photo').img), 'Image gadget photos are requested at 1920 px for sharp slides: ' + by('Blogger photo').img);
    ok(/\/s1920\/team\.jpg$/.test(by('Plain photo link').img), 'a photo link pasted in an HTML gadget becomes a photo slide: ' + by('Plain photo link').img);
    ok(by('Short video').video, 'youtu.be links work too');
    await p.waitForTimeout(500);
    ok(await p.evaluate(() => [...document.querySelectorAll('.es-video img')].every(i => /hqdefault/.test(i.src))), 'videos without a HD thumbnail fall back to the standard one');
    await c.close();
  }
  // 5. Phones and tablets
  for (const w of [320, 390, 768, 1024]) {
    const {c, p, errs} = await open(w, {touch: true, h: 740});
    const m = await p.evaluate(() => {
      const sl = document.querySelector('.efic-slider').getBoundingClientRect(), cap = document.querySelector('.es-slide.is-active .es-caption').getBoundingClientRect();
      const arrow = document.querySelector('.es-next'), bar = document.querySelector('.tm-menu').getBoundingClientRect();
      return {sw: document.documentElement.scrollWidth, iw: innerWidth, w: sl.width, h: Math.round(sl.height), top: Math.round(sl.top), bar: Math.round(bar.bottom), capIn: cap.bottom <= sl.bottom + 1 && cap.left >= sl.left - 1 && cap.right <= sl.right + 1, arrows: getComputedStyle(arrow).display};
    });
    const ratio = w <= 600 ? 3 / 4 : 9 / 16;
    ok(m.sw <= m.iw && m.w === w && Math.abs(m.h - Math.round(w * ratio)) <= 1 && Math.abs(m.top - m.bar) <= 2 && m.capIn && (w <= 600 ? m.arrows === 'none' : m.arrows !== 'none'),
      `@${w}: full width, ${w <= 600 ? '4:3' : '16:9'}, below the bar, caption inside, ${w <= 600 ? 'swipe instead of arrows' : 'arrows'} ${JSON.stringify(m)}`);
    const before = await active(p);
    await p.evaluate(() => {
      const t = document.querySelector('.efic-slider'), mk = (x) => new Touch({identifier: 1, target: t, clientX: x, clientY: 200});
      t.dispatchEvent(new TouchEvent('touchstart', {touches: [mk(300)], changedTouches: [mk(300)], bubbles: true}));
      t.dispatchEvent(new TouchEvent('touchend', {touches: [], changedTouches: [mk(120)], bubbles: true}));
    });
    ok(await active(p) === (before + 1) % 3, `@${w}: swipe left shows the next slide`);
    if (w === 390) await p.screenshot({path: S + '/shots/slider-390.png'});
    ok(!errs.length, `@${w}: no JS errors ${errs.join('; ')}`);
    await c.close();
  }
  // 6. Where it shows, and when it doesn't
  {
    const {c, p} = await open(1440, {url: 'https://eficc.blogspot.com/2026/03/iso-9001.html'});
    ok(await p.evaluate(() => getComputedStyle(document.querySelector('.efic-slider-wrap')).display === 'none'), 'posts and pages: no slideshow (homepage only)');
    await c.close();
  }
  {
    const {c, p, errs} = await open(1440, {empty: true});
    const m = await p.evaluate(() => ({slider: !!document.querySelector('.efic-slider'), bar: getComputedStyle(document.querySelector('.tm-menu')).backgroundColor, hero: Math.round(document.querySelector('#header-wrapper').getBoundingClientRect().height)}));
    ok(!m.slider && m.bar === 'rgba(0, 0, 0, 0)' && m.hero === 800, 'empty Slideshow section: homepage exactly as before (see-through bar, full-screen hero) ' + JSON.stringify(m));
    ok(!errs.length, 'no JS errors ' + errs.join('; '));
    await c.close();
  }
  {
    const {c, p} = await open(1440, {clock: true, reduce: true});
    await p.mouse.move(5, 790); await p.clock.runFor(20000);
    ok(await active(p) === 0 && await p.getAttribute('.es-pause', 'aria-label') === 'Play slideshow', 'visitors who turn off motion: no automatic movement');
    await c.close();
  }
  // 7. Layout editor
  {
    const c = await b.newContext({viewport: {width: 1440, height: 900}}); const p = await c.newPage();
    await p.goto('file://' + PV + 'layout.html', {waitUntil: 'networkidle'});
    const l = await p.evaluate(() => { const s = document.querySelector('#slideshow'); return s && {vis: s.offsetHeight > 0, head: s.querySelector('h4').textContent, add: !!s.querySelector('.add_widget'), first: s.getBoundingClientRect().top < document.querySelector('#header').getBoundingClientRect().top}; });
    ok(l && l.vis && l.head === 'Slideshow (homepage, below the menu)' && l.add && l.first, 'Layout: "Slideshow" section with Add a Gadget, above the title ' + JSON.stringify(l));
    await p.screenshot({path: S + '/shots/layout-top.png', clip: {x: 0, y: 0, width: 1440, height: 500}});
    await c.close();
  }
  await b.close();
  console.log(R.join('\n')); console.log(R.filter(r => r.startsWith('PASS')).length + '/' + R.length + ' passed');
})().catch(e => { console.log(R.join('\n')); console.error(e); process.exit(1); });
