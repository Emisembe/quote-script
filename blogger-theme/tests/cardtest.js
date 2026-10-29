// Run: node blogger-theme/tests/cardtest.js   (after: python3 scripts/build.py && python3 scripts/preview.py)
// Post cards (Our Work & Insights): picture or video from each post, videos play in the
// card, no broken images. The blog feed and post pages are stand-ins served by the test.
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node-tools/node_modules/playwright'); } })();
const path = require('path'), fs = require('fs');
const S = __dirname, PV = path.join(__dirname, '..', 'preview') + '/';
const FA = process.env.FA || S + '/fa';
const R = []; const ok = (c, m) => R.push((c ? 'PASS ' : 'FAIL ') + m);
const NTH = 'https://3.bp.blogspot.com/-Yw8BIuvwoSQ/VsjkCIMoltI/AAAAAAAAC4c/s55PW6xEKn0/s1600-r/nth.png';
const GU = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/';
// What the theme puts on each card (Blogger's firstImageUrl or the template placeholder)
const CARDS = [
  ['/2026/01/team.html', GU + 'AAA/s72-c/team.jpg'],                    // picture post
  ['/2026/02/youtube.html', 'https://i.ytimg.com/vi/2bjBiOVQrUs/default.jpg'], // YouTube embed
  ['/2026/03/uploaded.html', NTH],                                      // video uploaded in Blogger (YouTube-backed)
  ['/2026/04/blogger-video.html', NTH],                                 // old Blogger video player
  ['/2026/05/text-only.html', 'undefined'],                             // no media: the old template bug
  ['/2026/06/not-in-feed.html', NTH],                                   // missing from the feed: read the post page
];
const CONTENT = {
  '/2026/01/team.html': `<p>Intro</p><img src="https://www.blogger.com/img/icon18_edit_allbkg.gif" width="18" height="18"><a href="${GU}AAA/s1600/team.jpg"><img src="${GU}AAA/s320/team.jpg" width="320" height="213"></a>`,
  '/2026/02/youtube.html': `<p><img src="${GU}CCC/s320/cover.jpg" width="320" height="200"></p><iframe width="560" height="315" src="https://www.youtube.com/embed/2bjBiOVQrUs" allowfullscreen></iframe>`,
  '/2026/03/uploaded.html': `<p>Watch:</p><iframe class="BLOG_video_class" allowfullscreen="" youtube-src-id="d64ou1T0ftk" width="320" height="266" src="https://www.youtube.com/embed/d64ou1T0ftk"></iframe>`,
  '/2026/04/blogger-video.html': `<iframe allowfullscreen class="b-hbp-video b-uploaded" frameborder="0" height="266" src="https://www.blogger.com/video.g?token=AD6v5dTEST" width="320"></iframe>`,
  '/2026/05/text-only.html': `<p>Only words here. <img src="https://example.com/pixel.gif" width="1" height="1"></p>`,
  '/2026/07/more.html': `<p><a href="https://youtu.be/pgP-KicwOqQ">Our latest video</a></p>`,
};
const FEED = {feed: {entry: Object.keys(CONTENT).map(p => ({link: [{rel: 'alternate', href: 'https://eficc.blogspot.com' + p}], content: {$t: CONTENT[p]}}))}};
FEED.feed.entry.push({link: [{rel: 'alternate', href: 'https://eficc.blogspot.com/2026/06/not-in-feed.html'}], summary: {$t: 'short feed'}});
const PAGE = `<html><body><div class="post-body entry-content"><p>Plant visit</p><img src="${GU}BBB/w640-h400-rw/plant.jpg" width="640" height="400"></div></body></html>`;

let HOME = fs.readFileSync(PV + 'home.html', 'utf8');
let n = 0;
HOME = HOME.replace(/<a class='thumb' href='post\.html'><img alt='' src='[^']*'\/><\/a>(<font class='retitle'><span class='post-retitle'><h2 class='post-title entry-title'>)<a href='post\.html'>/g,
  (m, mid) => { const [href, src] = CARDS[n++] || CARDS[0]; return `<a class='thumb' href='${href}'><img alt='Card ${n}' src='${src}'/></a>${mid}<a href='${href}'>`; });

(async () => {
  ok(n === 6, 'test page: six cards prepared (' + n + ')');
  const b = await chromium.launch({executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', proxy: process.env.HTTPS_PROXY ? {server: process.env.HTTPS_PROXY} : undefined});
  async function open(w, opts = {}) {
    const c = await b.newContext({viewport: {width: w, height: 900}, ignoreHTTPSErrors: true});
    const asked = [];
    await c.route(/font-awesome\.min\.css/, r => fs.existsSync(FA) ? r.fulfill({path: path.join(FA, 'css/font-awesome.min.css'), contentType: 'text/css'}) : r.fulfill({body: ''}));
    await c.route(/\/fonts\/fontawesome-webfont/, r => fs.existsSync(FA) ? r.fulfill({path: path.join(FA, 'fonts', new URL(r.request().url()).pathname.split('/').pop())}) : r.fulfill({body: ''}));
    await c.route(/youtube\.com\/embed|youtube-nocookie\.com|blogger\.com\/video\.g|google\.com\/maps|translate\.google/, r => r.fulfill({body: '<html><body>player</body></html>', contentType: 'text/html'}));
    await c.route(/i\.ytimg\.com|googleusercontent\.com\/img/, r => {
      const u = r.request().url(); asked.push(u);
      if (opts.broken && opts.broken.test(u)) return r.fulfill({status: 404, body: ''});
      return r.fulfill({path: S + '/fixtures/ytthumb.jpg', contentType: 'image/jpeg'});
    });
    await c.route(/bp\.blogspot\.com|blogger\.com\/img|example\.com/, r => r.fulfill({status: 404, body: ''}));
    await c.route(/^https:\/\/eficc\.blogspot\.com\//, r => {
      const u = new URL(r.request().url());
      if (u.pathname.startsWith('/feeds/posts/default')) return opts.noFeed ? r.fulfill({status: 404, body: ''}) : r.fulfill({contentType: 'application/json', body: JSON.stringify(FEED)});
      if (u.pathname === '/2026/06/not-in-feed.html' && r.request().resourceType() === 'fetch') return r.fulfill({contentType: 'text/html', body: PAGE});
      if (r.request().resourceType() === 'document') return r.fulfill({contentType: 'text/html', body: u.pathname === '/' ? HOME : '<html><body>post page</body></html>'});
      return r.fulfill({status: 404, body: ''});
    });
    const p = await c.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('https://eficc.blogspot.com/', {waitUntil: 'networkidle'});
    await p.waitForTimeout(500);
    return {c, p, errs, asked};
  }
  // The cards float, so their wrapper has no height: photograph the area they cover.
  const shotCards = async (p, file) => {
    const r = await p.evaluate(() => { const rs = [...document.querySelectorAll('.block-image')].map(e => e.getBoundingClientRect());
      const x = Math.min(...rs.map(q => q.left)), y = Math.min(...rs.map(q => q.top)) + scrollY;
      return {x: Math.max(0, x - 10), y: Math.max(0, y - 10), width: Math.max(...rs.map(q => q.right)) - x + 20, height: Math.max(...rs.map(q => q.bottom)) + scrollY - y + 20}; });
    await p.screenshot({path: file, clip: r, fullPage: true});
  };
  const cards = p => p.evaluate(() => [...document.querySelectorAll('.block-image')].map(b => {
    const img = b.querySelector('.thumb img');
    return {src: img.getAttribute('src'), loaded: img.complete && img.naturalWidth > 1, empty: b.classList.contains('pc-empty'),
      imgShown: getComputedStyle(img).visibility !== 'hidden', play: !!b.querySelector('.pc-play'), h: Math.round(b.querySelector('.thumb').getBoundingClientRect().height)};
  }));

  // 1. What each card shows
  {
    const {c, p, errs} = await open(1440);
    const k = await cards(p);
    ok(/\/AAA\/w800\/team\.jpg$/.test(k[0].src) && k[0].loaded && !k[0].play, 'picture post: the post\'s picture, asked for at card size (w800): ' + k[0].src);
    ok(/i\.ytimg\.com\/vi\/2bjBiOVQrUs\/hqdefault\.jpg$/.test(k[1].src) && k[1].loaded && k[1].play, 'YouTube post: the video picture with a play button (the video wins over the picture above it)');
    ok(/vi\/d64ou1T0ftk\//.test(k[2].src) && k[2].play && !k[2].empty, 'video uploaded in Blogger: its picture and a play button');
    ok(k[3].play && k[3].empty, 'old Blogger video player: navy card with a play button (no picture available)');
    ok(k[4].empty && !k[4].imgShown && !k[4].play && k[4].src === 'undefined', 'no picture or video: a clean navy card, the broken image is hidden (tiny pixels ignored)');
    ok(/\/BBB\/w800\/plant\.jpg$/.test(k[5].src) && k[5].loaded, 'post missing from the feed: the picture is read from the post page');
    ok(k.every(x => x.h === k[0].h && x.h >= 250), 'every card is the same height (' + k.map(x => x.h).join(', ') + ')');
    const broken = await p.evaluate(() => [...document.querySelectorAll('.block-image .thumb img')].filter(i => getComputedStyle(i).visibility !== 'hidden' && !(i.complete && i.naturalWidth > 1)).length);
    ok(broken === 0, 'no broken image or alt text shows on any card');
    ok(!errs.length, 'no JS errors: ' + (errs.join('; ') || 'none'));
    await shotCards(p, S + '/shots/cards-1440.png');

    // 2. Playing: inside the card, without opening the post; one at a time; close and Escape
    const url = p.url();
    await p.click('.block-image >> nth=1 >> .pc-play');
    await p.waitForTimeout(300);
    let st = await p.evaluate(() => [...document.querySelectorAll('.block-image')].map(b => { const f = b.querySelector('.pc-player'); return f ? f.getAttribute('src') : ''; }));
    ok(p.url() === url && /^https:\/\/www\.youtube-nocookie\.com\/embed\/2bjBiOVQrUs\?autoplay=1/.test(st[1]), 'Play: the video plays inside the card and the post does not open');
    const fit = await p.evaluate(() => { const b = document.querySelectorAll('.block-image')[1], f = b.querySelector('.pc-player').getBoundingClientRect(), t = b.querySelector('.thumb').getBoundingClientRect(); const r = b.querySelector('.retitle');
      return {same: Math.abs(f.width - t.width) < 2 && Math.abs(f.height - t.height) < 2, title: getComputedStyle(r).display, focus: document.activeElement.className}; });
    ok(fit.same && fit.title === 'none' && fit.focus === 'pc-close', 'the player fills the card, the title steps aside, focus moves to the close button');
    await shotCards(p, S + '/shots/cards-playing.png');
    await p.click('.block-image >> nth=2 >> .pc-play');
    await p.waitForTimeout(200);
    st = await p.evaluate(() => [...document.querySelectorAll('.pc-player')].map(f => f.getAttribute('src')));
    ok(st.length === 1 && /embed\/d64ou1T0ftk/.test(st[0]), 'starting another video stops the first (one at a time)');
    await p.click('.pc-close');
    ok(await p.evaluate(() => !document.querySelector('.pc-player') && document.activeElement.classList.contains('pc-play') && getComputedStyle(document.querySelectorAll('.block-image')[2].querySelector('.retitle')).display !== 'none'), 'close: the card is back as it was, focus returns to its play button');
    await p.click('.block-image >> nth=3 >> .pc-play');
    st = await p.evaluate(() => (document.querySelector('.pc-player') || {}).src);
    ok(/blogger\.com\/video\.g\?token=AD6v5dTEST/.test(st), 'old Blogger video player plays in the card too');
    await p.keyboard.press('Escape');
    ok(await p.evaluate(() => !document.querySelector('.pc-player')), 'Escape closes the video');
    await p.keyboard.press('Enter');
    ok(await p.evaluate(() => !!document.querySelector('.pc-player')), 'the play button works from the keyboard (Enter)');
    await p.keyboard.press('Escape');

    // 3. Cards added later (the Learn More button)
    await p.evaluate(() => {
      const g = document.querySelector('.blog-posts .post-grid'), d = document.createElement('div');
      d.className = 'post-grid-item';
      d.innerHTML = "<div class='post-outer'><div class='post'><div class='block-image'><a class='thumb' href='/2026/07/more.html'><img alt='More' src='https://3.bp.blogspot.com/-Yw8BIuvwoSQ/VsjkCIMoltI/AAAAAAAAC4c/s55PW6xEKn0/s1600-r/nth.png'/></a><font class='retitle'><span class='post-retitle'><h2 class='post-title entry-title'><a href='/2026/07/more.html'>More</a></h2></span></font></div></div></div>";
      g.appendChild(d);
    });
    await p.waitForTimeout(500);
    const last = (await cards(p)).pop();
    ok(last.play && /vi\/pgP-KicwOqQ\//.test(last.src), 'cards loaded later (Learn More) are handled too; a linked YouTube video counts');
    await c.close();
  }

  // 4. A picture that fails to load falls back to Blogger's own, then to the navy card
  {
    const {c, p} = await open(1440, {broken: /\/w800\/team\.jpg/});
    const k = await cards(p);
    ok(/AAA\/s(72-c|1600)\/team\.jpg$/.test(k[0].src) && k[0].loaded && !k[0].empty, 'the larger picture fails: the card keeps Blogger\'s own picture: ' + k[0].src);
    await c.close();
  }
  {
    const {c, p} = await open(1440, {broken: /team\.jpg/});
    const k = await cards(p);
    ok(k[0].empty && !k[0].imgShown, 'no picture loads at all: a clean navy card');
    await c.close();
  }

  // 5. Feed switched off: every post is read from its own page; nothing breaks
  {
    const {c, p, errs} = await open(1440, {noFeed: true});
    const k = await cards(p);
    ok(/BBB\/w800\/plant\.jpg$/.test(k[5].src) && !errs.length && k.filter(x => x.empty).length >= 3, 'no feed: posts are read from their pages; others stay clean (no JS errors)');
    await c.close();
  }

  // 6. Phones
  for (const w of [390, 320]) {
    const {c, p, errs} = await open(w);
    await p.click('.block-image >> nth=1 >> .pc-play');
    await p.waitForTimeout(200);
    const m = await p.evaluate(() => { const f = document.querySelector('.pc-player').getBoundingClientRect(); return {l: f.left, r: f.right, iw: innerWidth, sw: document.documentElement.scrollWidth}; });
    ok(m.l >= 0 && m.r <= m.iw + 1 && m.sw <= m.iw && !errs.length, `@${w}: the video plays inside the card, on screen, no sideways scroll`);
    if (w === 390) await p.locator('.block-image >> nth=1').screenshot({path: S + '/shots/cards-390-playing.png'});
    await c.close();
  }

  await b.close();
  console.log(R.join('\n')); console.log(R.filter(r => r.startsWith('PASS')).length + '/' + R.length + ' passed');
  process.exit(R.some(r => r.startsWith('FAIL')) ? 1 : 0);
})().catch(e => { console.log(R.join('\n')); console.error(e); process.exit(1); });
