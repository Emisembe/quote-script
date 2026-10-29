// Run: node blogger-theme/tests/contacttest.js   (after: python3 scripts/build.py && python3 scripts/preview.py)
// Contact form prospect number. Blogger's own sending script only runs on blogspot.com,
// so a stand-in plays its part: on Send it checks the fields, shows "Sending...",
// then "Message sent." and clears the form, recording the message it would email.
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node-tools/node_modules/playwright'); } })();
const path = require('path'), fs = require('fs');
const S = __dirname, PV = path.join(__dirname, '..', 'preview') + '/';
const FA = process.env.FA || S + '/fa';
const R = []; const ok = (c, m) => R.push((c ? 'PASS ' : 'FAIL ') + m);
const HOME = fs.readFileSync(PV + 'home.html', 'utf8');

// Stand-in for Blogger's ContactForm script (a target-phase click handler on Send).
const BLOGGER = () => {
  const $ = s => document.getElementById('ContactForm1_contact-form-' + s);
  window.__sent = []; window.__fail = 0;
  $('submit').addEventListener('click', () => {
    const ok = $('success-message'), err = $('error-message');
    ok.innerHTML = ''; err.innerHTML = '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('email').value)) { err.innerHTML = "<div class='contact-form-error-message-with-border'>Email address is invalid.</div>"; return; }
    if (!$('email-message').value.trim()) { err.innerHTML = "<div class='contact-form-error-message-with-border'>Message is required.</div>"; return; }
    ok.innerHTML = "<div class='contact-form-success-message-with-border'>Sending...</div>";
    setTimeout(() => {
      if (window.__fail > 0) { window.__fail--; ok.innerHTML = ''; err.innerHTML = "<div class='contact-form-error-message-with-border'>Error sending message.</div>"; return; }
      window.__sent.push({name: $('name').value, email: $('email').value, message: $('email-message').value});
      ok.innerHTML = "<div class='contact-form-success-message-with-border'>Message sent.<img class='contact-form-cross' alt=''></div>";
      $('name').value = ''; $('email').value = ''; $('email-message').value = '';
    }, 150);
  });
};

(async () => {
  const b = await chromium.launch({executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', proxy: process.env.HTTPS_PROXY ? {server: process.env.HTTPS_PROXY} : undefined});
  async function open(w, time) {
    const c = await b.newContext({viewport: {width: w, height: 900}, ignoreHTTPSErrors: true});
    await c.route(/font-awesome\.min\.css/, r => fs.existsSync(FA) ? r.fulfill({path: path.join(FA, 'css/font-awesome.min.css'), contentType: 'text/css'}) : r.fulfill({body: ''}));
    await c.route(/\/fonts\/fontawesome-webfont/, r => fs.existsSync(FA) ? r.fulfill({path: path.join(FA, 'fonts', new URL(r.request().url()).pathname.split('/').pop())}) : r.fulfill({body: ''}));
    await c.route(/youtube\.com\/embed|google\.com\/maps|translate\.google|youtube-nocookie\.com/, r => r.fulfill({body: '<html><body>map</body></html>', contentType: 'text/html'}));
    await c.route(/i\.ytimg\.com|googleusercontent\.com\/img/, r => r.fulfill({path: S + '/fixtures/ytthumb.jpg', contentType: 'image/jpeg'}));
    await c.route(/^https:\/\/eficc\.blogspot\.com\//, r => r.request().resourceType() === 'document' ? r.fulfill({contentType: 'text/html', body: HOME}) : r.fulfill({body: ''}));
    const p = await c.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.clock.install({time: new Date(time || '2026-10-29T14:35:22')});
    await p.goto('https://eficc.blogspot.com/', {waitUntil: 'networkidle'});
    await p.evaluate(BLOGGER);
    return {c, p, errs};
  }
  const fill = async (p, name, email, message) => {
    await p.fill('#ContactForm1_contact-form-name', name);
    await p.fill('#ContactForm1_contact-form-email', email);
    await p.fill('#ContactForm1_contact-form-email-message', message);
  };
  const send = async p => { await p.click('#ContactForm1_contact-form-submit'); await p.clock.runFor(400); };
  const shown = p => p.evaluate(() => { const r = document.querySelector('.cf-ref'); return r ? r.textContent : ''; });
  const sent = p => p.evaluate(() => window.__sent);

  // 1. A normal message
  {
    const {c, p, errs} = await open(1440);
    await fill(p, 'Jane Doe', 'jane@example.com', 'Hello,\nwe need ISO 9001 support.');
    await send(p);
    const s = await sent(p);
    const num = ((s[0] && s[0].message.match(/^Prospect no\.: (P-JD-20261029-1435\d\d)\n\n/)) || [])[1];
    ok(s.length === 1 && num && s[0].message === 'Prospect no.: ' + num + '\n\nHello,\nwe need ISO 9001 support.', 'the emailed message starts with the prospect number, then the visitor\'s text unchanged: ' + JSON.stringify(s[0] && s[0].message));
    const t = await shown(p);
    ok(t === 'Your reference: ' + num + '. Please quote it when you contact us.', 'the visitor sees their reference under "Message sent": ' + t);
    ok(await p.evaluate(() => document.querySelector('.cf-ref').closest('#ContactForm1_contact-form-success-message') !== null), 'the reference sits inside the success message box');
    ok(!errs.length, 'no JS errors: ' + (errs.join('; ') || 'none'));
    await p.locator('#ContactForm1_contact-form-success-message').scrollIntoViewIfNeeded();
    await p.locator('#sora_blogger_cntct_form').screenshot({path: S + '/shots/contact-reference.png'});

    // a second message later gets a new number
    await p.clock.runFor(65000);
    await fill(p, 'Amina Wanjiru Otieno Kamau', 'amina@example.com', 'Quote for training, please.');
    await send(p);
    const s2 = await sent(p);
    ok(s2.length === 2 && /^Prospect no\.: P-AWO-20261029-1436\d\d\n\n/.test(s2[1].message) && s2[1].message.slice(14, 35) !== num && (await shown(p)).includes(s2[1].message.slice(14, 35)), 'a second message gets its own number (first 3 initials): ' + JSON.stringify(s2[1] && s2[1].message.split('\n')[0]));
    await c.close();
  }

  // 2. Refused or failed sends: no number on refused forms, the same number on retry, never two lines
  {
    const {c, p} = await open(1440);
    await fill(p, 'Jane Doe', 'not-an-email', 'Hello');
    await send(p);
    ok(await p.inputValue('#ContactForm1_contact-form-email-message') === 'Hello' && !(await shown(p)), 'invalid email: Blogger refuses it and the message is left untouched');
    await fill(p, 'Jane Doe', 'jane@example.com', '   ');
    await send(p);
    ok((await p.inputValue('#ContactForm1_contact-form-email-message')).trim() === '' && !(await shown(p)), 'empty message: nothing added');
    await p.evaluate(() => { window.__fail = 1; });
    await fill(p, 'Jane Doe', 'jane@example.com', 'Please call me.');
    await send(p);
    const after = await p.inputValue('#ContactForm1_contact-form-email-message');
    const first = (after.match(/^Prospect no\.: (P-JD-20261029-1435\d\d)\n\nPlease call me\.$/) || [])[1];
    ok(first && !(await shown(p)), 'sending failed: no reference shown, the number stays at the top of the message');
    await p.clock.runFor(30000);
    await send(p);
    const s = await sent(p);
    ok(s.length === 1 && s[0].message === 'Prospect no.: ' + first + '\n\nPlease call me.' && (await shown(p)).includes(first), 'the retry keeps the same number and never adds a second line');
    await c.close();
  }

  // 3. Names: none, accents, hyphens, other scripts
  for (const [name, want] of [['', 'P-WEB-'], ['Émile Zola-Ndegwa', 'P-EZN-'], ['  müller  ', 'P-M-'], ['王小明', 'P-WEB-'], ['O\'Brien & Sons Ltd', 'P-OBS-']]) {
    const {c, p} = await open(390);
    await fill(p, name, 'x@example.com', 'Hi');
    await send(p);
    const s = await sent(p);
    ok(s.length === 1 && new RegExp('^Prospect no\\.: ' + want + '20261029-1435\\d\\d\\n\\nHi$').test(s[0].message), `name "${name}" -> ${s[0] && s[0].message.split('\n')[0]}`);
    if (!name) {
      const box = await p.evaluate(() => { const r = document.querySelector('.cf-ref').getBoundingClientRect(); return {l: r.left, r: r.right, w: innerWidth, sw: document.documentElement.scrollWidth}; });
      ok(box.l >= 0 && box.r <= box.w && box.sw <= box.w, '390 px phone: the reference fits on screen, no sideways scroll');
      await p.locator('#sora_blogger_cntct_form').screenshot({path: S + '/shots/contact-reference-390.png'});
    }
    await c.close();
  }

  await b.close();
  console.log(R.join('\n')); console.log(R.filter(r => r.startsWith('PASS')).length + '/' + R.length + ' passed');
  process.exit(R.some(r => r.startsWith('FAIL')) ? 1 : 0);
})().catch(e => { console.log(R.join('\n')); console.error(e); process.exit(1); });
