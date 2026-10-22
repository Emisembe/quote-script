// Browser tests for the EFIC Letter Generator.
// Usage: node test_letter.js path/to/efic-letter-generator.html WORKDIR
// (run setup_test_env.sh WORKDIR first). Writes screenshots to WORKDIR/shots and exits 1 on any failure.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const FILE = path.resolve(process.argv[2] || 'efic-letter-generator.html');
const W = path.resolve(process.argv[3] || './letter-test');
const NM = path.join(W, 'node_modules'), SHOTS = path.join(W, 'shots');
fs.mkdirSync(SHOTS, {recursive: true});
function need(m) { for (const p of [path.join(NM, m), m, '/opt/node-tools/node_modules/' + m]) { try { return require(p); } catch (e) {} } throw new Error('missing ' + m + ': run setup_test_env.sh ' + W); }
const { chromium } = need('playwright'), jsQR = need('jsqr');
const has = c => { try { cp.execSync('command -v ' + c, {stdio: 'ignore'}); return true; } catch (e) { return false; } };
const R = []; const ok = (c, m) => { R.push((c ? 'PASS ' : 'FAIL ') + m); };
const skip = m => R.push('SKIP ' + m);
const PX = 96 / 25.4, mmOf = v => Math.round(v / PX * 100) / 100, near = (a, x, t = 0.6) => Math.abs(a - x) <= t;

// Simulate Blogger's save (non-ASCII -> &#N;) and build a bare page plus a mock of the EFIC theme's page layout.
const src = fs.readFileSync(FILE, 'utf8');
const saved = src.replace(/[^\x00-\x7f]/gu, ch => '&#' + ch.codePointAt(0) + ';');
const theme = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>html{overflow-x:hidden}body{margin:0;font-family:Arial}#header-wrapper{height:90px;background:#14213D;color:#fff}.tm-menu{height:40px;background:#0F1A30}
#content-wrapper{max-width:1180px;margin:30px auto;padding:20px}#main-wrapper{float:left;width:68%;padding:20px}#sidebar-wrapper{float:right;width:28%}
.post-body{padding:15px;font-size:15px;line-height:1.7}.post-body img{padding:10px 0}.post-body h2{margin:28px 0 12px}#jugas_footer{clear:both;height:120px;background:#0F1A30}</style></head><body>
<div id="outer-wrapper"><div id="header-wrapper">EFIC header</div><div class="tm-menu">Menu</div><div id="content-wrapper"><div id="main-wrapper"><div class="main section" id="main">
<div class="widget Blog" id="Blog1"><div class="post hentry"><div class="post-header"><h1 class="post-title">Letter Generator</h1></div>
<div class="post-body entry-content">${saved}</div><div class="post-footer"><div class="share-box">Share: WhatsApp Telegram Print</div></div></div>
<div class="comments" id="comments"><h4>2 comments:</h4></div></div><div class="widget HTML" id="HTML5"><div class="widget-content"><p>HTML gadget</p></div></div></div></div>
<div id="sidebar-wrapper"><div class="widget">Sidebar gadget</div></div></div><div id="jugas_footer">Footer</div></div></body></html>`;
fs.writeFileSync(path.join(W, 'harness-theme.html'), theme);
fs.writeFileSync(path.join(W, 'harness-bare.html'), `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${saved}</body></html>`);

const LONG = Array.from({length: 9}, (_, i) => `Paragraph ${i + 1}. ` + 'We are pleased to confirm the scope of the quality management review, including document control, internal audits, supplier evaluation and the management review meeting. '.repeat(4).trim()).join('\n\n');

(async () => {
  let b;
  try { b = await chromium.launch(); } catch (e) {
    const exe = process.env.CHROMIUM || (fs.existsSync('/opt/pw-browsers') ? fs.readdirSync('/opt/pw-browsers').filter(d => d.startsWith('chromium-')).map(d => `/opt/pw-browsers/${d}/chrome-linux/chrome`).find(fs.existsSync) : null);
    if (!exe) throw e; b = await chromium.launch({executablePath: exe});
  }
  async function open(file, w, h = 900) {
    const c = await b.newContext({viewport: {width: w, height: h}, acceptDownloads: true});
    const p = await c.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message));
    p.on('dialog', d => d.type() === 'prompt' ? d.accept('Test save') : d.accept());
    await p.route(/^https?:\/\//, r => r.fulfill({body: '', contentType: 'text/plain'}));
    await p.route(/html2canvas\.min\.js/, r => r.fulfill({path: path.join(NM, 'html2canvas/dist/html2canvas.min.js'), contentType: 'application/javascript'}));
    await p.route(/jspdf\.umd\.min\.js/, r => r.fulfill({path: path.join(NM, 'jspdf/dist/jspdf.umd.min.js'), contentType: 'application/javascript'}));
    await p.route(/qrcode\.min\.js/, r => r.fulfill({path: path.join(NM, 'qrcode-generator/qrcode.js'), contentType: 'application/javascript'}));
    await p.goto('file://' + path.join(W, file), {waitUntil: 'networkidle', timeout: 60000});
    await p.waitForTimeout(500);
    return {c, p, errs};
  }
  const settle = p => p.waitForTimeout(350);

  // 1. Full page and responsive
  for (const file of ['harness-theme.html', 'harness-bare.html']) for (const w of [1440, 1024, 820, 390, 320]) {
    const {c, p, errs} = await open(file, w);
    const m = await p.evaluate(() => {
      const panel = document.querySelector('.ldg-panel').getBoundingClientRect(), app = document.getElementById('ldg-app');
      const over = [...document.querySelectorAll('.ldg-panel input,.ldg-panel select,.ldg-panel textarea')].filter(i => { const r = i.getBoundingClientRect(); return r.width > 0 && (r.right > panel.right + .5 || r.left < panel.left - .5); }).map(i => i.id);
      const outside = [];
      document.querySelectorAll('body *').forEach(e => { if (app.contains(e) || e.contains(app) || !e.getClientRects().length) return; const t = [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(''); if (t) outside.push(t.slice(0, 30)); });
      const a = app.getBoundingClientRect();
      return {sw: document.documentElement.scrollWidth, iw: innerWidth, over, outside, x: a.left, y: a.top, w: a.width};
    });
    ok(m.sw <= m.iw && !m.over.length && !errs.length, `${file}@${w}: no sideways scroll (${m.sw}/${m.iw}), fields inside the panel${m.over.length ? ' (overflow: ' + m.over + ')' : ''}, JS errors: ${errs.length ? errs : 'none'}`);
    if (file === 'harness-theme.html') ok(!m.outside.length && Math.abs(m.x) < 1 && Math.abs(m.w - m.iw) < 1 && m.y < 2, `full page in the theme @${w}: nothing of the theme visible (${m.outside.join(', ') || 'none'}), tool at x=${m.x} y=${m.y} w=${m.w}`);
    if (w === 1440 || w === 390) await p.screenshot({path: path.join(SHOTS, `${file.replace('.html', '')}-${w}.png`)});
    await c.close();
  }

  const {c, p, errs} = await open('harness-theme.html', 1440);
  const S = (sel, i = 0) => p.evaluate(([sel, i]) => { const sh = document.querySelectorAll('#ldgPages .ldg-sheet')[i], e = sh && (sel === ':scope' ? sh : sh.querySelector(sel)); if (!e) return null; const a = sh.getBoundingClientRect(), r = e.getBoundingClientRect(), f = a.width / sh.offsetWidth; return {top: (r.top - a.top) / f, left: (r.left - a.left) / f, w: r.width / f, h: r.height / f, text: e.innerText}; }, [sel, i]);
  const sheets = () => p.locator('#ldgPages .ldg-sheet').count();
  const marks = () => p.evaluate(() => [...document.querySelectorAll('#ldgPages .ldg-sheet')[0].querySelectorAll('.lt-mark')].map(m => m.offsetTop));
  ok(!(await p.locator('#logoClear').isVisible()) && !(await p.locator('#sigClear').isVisible()), 'Remove buttons hidden until an image is uploaded');

  // 2. DIN 5008
  const sh0 = await p.evaluate(() => { const s = document.querySelector('#ldgPages .ldg-sheet'); return {w: s.offsetWidth, h: s.offsetHeight}; });
  ok(near(mmOf(sh0.w), 210, 0.3) && near(mmOf(sh0.h), 297, 0.3), `sheet is A4: ${mmOf(sh0.w)} x ${mmOf(sh0.h)} mm`);
  const ad = await S('.lt-address'), an = await S('.lt-anschrift'), inf = await S('.lt-info'), fl = await S('.lt-flow'), mk = (await marks()).map(mmOf);
  const din = {addrTop: mmOf(ad.top), addrLeft: mmOf(ad.left), addrW: mmOf(ad.w), addrH: mmOf(ad.h), ansTop: mmOf(an.top), infoTop: mmOf(inf.top), infoLeft: mmOf(inf.left), bodyTop: mmOf(fl.top), bodyLeft: mmOf(fl.left), bodyRight: mmOf(sh0.w - fl.left - fl.w), marks: mk};
  ok(near(din.addrTop, 45) && near(din.addrLeft, 25) && near(din.addrW, 80, 1) && near(din.addrH, 45, 1) && near(din.ansTop, 62.7, 1) && near(din.infoTop, 50) && near(din.infoLeft, 125) && near(din.bodyTop, 98.46, 1) && near(din.bodyLeft, 25) && near(din.bodyRight, 20) && near(mk[0], 105) && near(mk[1], 210) && near(mk[2], 148.5), 'DIN 5008 Form B (mm): ' + JSON.stringify(din));
  await p.selectOption('#layout', 'A'); await settle(p);
  const ga = {addr: mmOf((await S('.lt-address')).top), info: mmOf((await S('.lt-info')).top), body: mmOf((await S('.lt-flow')).top), marks: (await marks()).map(mmOf)};
  ok(near(ga.addr, 27) && near(ga.info, 32) && near(ga.body, 80.46, 1) && near(ga.marks[0], 87) && near(ga.marks[1], 192), 'DIN 5008 Form A (mm): ' + JSON.stringify(ga));
  await p.selectOption('#layout', 'B'); await settle(p);

  // 3. Wording
  await p.fill('#recFirst', 'Erika'); await p.fill('#recLast', 'Musterfrau'); await p.selectOption('#recTitle', 'ms'); await p.fill('#recAcad', ''); await settle(p);
  let t = (await S('.lt-flow')).text;
  ok(/Dear Ms Musterfrau,/.test(t) && /Yours sincerely/.test(t), 'English with a name: "Dear Ms Musterfrau," / "Yours sincerely"');
  await p.fill('#recLast', ''); await p.fill('#recFirst', ''); await p.selectOption('#recTitle', ''); await settle(p);
  t = (await S('.lt-flow')).text;
  ok(/Dear Sir or Madam,/.test(t) && /Yours faithfully/.test(t), 'English without a name: "Dear Sir or Madam," / "Yours faithfully"');
  await p.fill('#recFirst', 'Max'); await p.fill('#recLast', 'Mustermann'); await p.selectOption('#recTitle', 'mr'); await p.fill('#recAcad', 'Dr.');
  await p.selectOption('#lang', 'de'); await settle(p);
  const deAddr = (await S('.lt-anschrift')).text.split('\n'), deFlow = (await S('.lt-flow')).text;
  ok(deAddr.includes('Herrn Dr. Max Mustermann') && /Sehr geehrter Herr Dr\. Mustermann,/.test(deFlow) && /Mit freundlichen Grüßen/.test(deFlow) && !/Grüßen,/.test(deFlow), 'German: "Herrn", "Sehr geehrter Herr Dr. Mustermann,", closing without comma');
  for (const l of ['fr', 'sw', 'zh']) { await p.selectOption('#lang', l); await settle(p); const f = (await S('.lt-flow')).text + await p.locator('.ldg-panel').innerText(); ok(f.length > 40 && !/&#\d+;|\\u[0-9a-f]{4}/.test(f), `${l}: no broken characters after Blogger's save`); }
  await p.selectOption('#lang', 'en'); await settle(p);

  // 4. Long letter
  await p.fill('#body', LONG); await p.fill('#encl', 'Proposal\nPrice list'); await p.fill('#cc', 'Finance Department'); await p.fill('#sigName', 'Efic Musembe'); await p.fill('#sigTitle', 'Director'); await settle(p);
  const n = await sheets();
  const lay = await p.evaluate(() => [...document.querySelectorAll('#ldgPages .ldg-sheet')].map(sh => { const f = sh.querySelector('.lt-flow'), ft = sh.querySelector('.lt-footer'); return {flowBottom: f.offsetTop + f.offsetHeight, footTop: ft.offsetTop, pageno: sh.querySelector('.lt-pageno').textContent, cont: !!sh.querySelector('.lt-cont'), h: sh.offsetHeight, sh: sh.scrollHeight}; }));
  ok(n >= 2 && lay.every((s, i) => s.pageno === `Page ${i + 1} of ${n}`), `long letter: ${n} pages, "Page X of ${n}" on each`);
  ok(lay.every(s => s.flowBottom <= s.footTop - 5 * PX + 1 && s.sh <= s.h + 1), 'text never runs into the footer or off the page');
  ok(lay.slice(1).every(s => s.cont) && !lay[0].cont, 'pages 2+ have the continuation header');
  const all = (await p.locator('#ldgPages').innerText()).replace(/\s+/g, ' ');
  ok([1, 2, 3, 4, 5, 6, 7, 8, 9].every(i => all.includes(`Paragraph ${i}.`)) && /Finance Department/.test(all) && /Price list/.test(all) && /Efic Musembe/.test(all), 'no text lost across pages');
  await p.screenshot({path: path.join(SHOTS, 'long-letter.png')});

  // 5. Safety
  await p.fill('#subject', '<img src=x onerror="window.__xss=1">Offer & terms'); await settle(p);
  ok(!(await p.evaluate(() => window.__xss)) && (await S('.lt-subject')).text.startsWith('<img'), 'typed HTML is shown as text, not run');
  await p.fill('#subject', 'Offer for ISO 9001 readiness support'); await settle(p);

  // 6. Our reference
  const ref = async () => (await S('.lt-info')).text.split('\n').find(l => /^Our ref/.test(l)).split('\t').pop().trim();
  await p.fill('#ourRef', ''); await p.fill('#recCompany', 'Musterfirma AG'); await settle(p);
  const r0 = await ref(), stampPart = r0.slice(-15);
  ok(/^MUS-\d{8}-\d{6}$/.test(r0) && (await p.getAttribute('#ourRef', 'placeholder')) === r0, 'automatic reference: ' + r0);
  const cases = [['Kenya Power and Lighting Company PLC', 'KPLC'], ['Equity Bank Kenya Limited', 'EBK'], ['Safaricom PLC', 'SAF'], ['KCB', 'KCB'], ['Ministry of Health', 'MH'], ['Société Générale S.A.', 'SG'], ['Müller & Söhne GmbH', 'MS'], ['华为', 'MM'], ['', 'MM']];
  for (const [name, want] of cases) { await p.fill('#recCompany', name); await settle(p); const r = await ref(); ok(r === want + '-' + stampPart, `reference for "${name || '(no company)'}": ${r}`); }
  await p.fill('#recFirst', ''); await p.fill('#recLast', ''); await settle(p);
  ok((await ref()).startsWith('LTR-'), 'no company and no name: ' + await ref());
  await p.fill('#recFirst', 'Max'); await p.fill('#recLast', 'Mustermann'); await p.fill('#recCompany', 'Kenya Power and Lighting Company PLC');
  await p.fill('#ourRef', 'EFIC/2026/017'); await settle(p);
  ok(await ref() === 'EFIC/2026/017', 'a typed reference replaces the automatic one');
  await p.fill('#ourRef', ''); await settle(p);

  // 7. Update button
  const btn = p.locator('#ldgUpdateBtn');
  await p.fill('#sigTitle', 'Managing Director'); await btn.click();
  ok(/Managing Director/.test(await p.locator('#ldgPages').innerText()) && /updated/i.test(await btn.innerText()), 'Update button redraws at once and says "Updated"');
  await p.waitForTimeout(1700);
  ok(/update/i.test(await btn.innerText()) && !/updated/i.test(await btn.innerText()), 'then returns to "Update"');

  // 8. Footer columns
  const colsN = () => p.locator('#fcols .fcol').count(), before = await colsN();
  await p.locator('#fcols .fcol').last().locator('button').first().click(); await settle(p);
  const afterRm = await colsN();
  while (await colsN() < 4) { await p.click('#addCol'); await settle(p); }
  ok(afterRm === before - 1 && await p.locator('#addCol').isDisabled(), `footer columns: remove (${afterRm}) then add up to 4, button then disabled`);
  await p.locator('#fcols .fcol').last().locator('button').first().click(); await settle(p);

  // 9. GiroCode
  const readQR = async () => { const img = await p.evaluate(async () => { const im = document.querySelector('#ldgPages .lt-qr img'); if (!im) return null; await im.decode(); const cv = document.createElement('canvas'); cv.width = im.naturalWidth; cv.height = im.naturalHeight; const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, cv.width, cv.height); x.drawImage(im, 0, 0); return {w: cv.width, h: cv.height, d: Array.from(x.getImageData(0, 0, cv.width, cv.height).data)}; }); const d = img && jsQR(Uint8ClampedArray.from(img.d), img.w, img.h); return d && d.data; };
  await p.check('#qrOn'); await p.fill('#qrIban', 'DE89 3704 0044 0532 0130 01'); await settle(p);
  ok(await p.locator('#ibanWarn').isVisible() && !(await p.locator('#ldgPages .lt-qr').count()), 'invalid IBAN: warning, no QR code');
  await p.fill('#qrIban', 'DE89 3704 0044 0532 0130 00'); await p.fill('#qrBic', 'COBADEFFXXX'); await p.fill('#qrAmt', '1250,50'); await p.fill('#qrRef', 'Invoice 2026-001'); await settle(p);
  const org = await p.inputValue('#orgName');
  const q1 = await readQR();
  ok(q1 === `BCD\n002\n1\nSCT\nCOBADEFFXXX\n${org}\nDE89370400440532013000\nEUR1250.50\n\n\nInvoice 2026-001`, 'GiroCode reads back as a valid EPC payload: ' + JSON.stringify(q1));
  await p.fill('#qrAmt', ''); await settle(p);
  const q2 = await readQR();
  ok(q2 && q2.split('\n')[7] === '' && !/EUR0\.00/.test(q2), 'no amount: amount field left empty');
  await p.fill('#qrAmt', '250'); await settle(p);

  // 10. Save / load / new
  const auto = await ref();
  await p.click('button[onclick="ldgSave()"]'); await settle(p);
  await p.click('button[onclick="ldgNew()"]'); await settle(p);
  await p.fill('#recCompany', 'Kenya Power and Lighting Company PLC'); await settle(p);
  ok(await ref() !== auto, 'New starts a new reference time: ' + auto + ' -> ' + await ref());
  await p.click('#ldgLoadBtn'); await p.locator('.ldg-saved-open').last().click(); await settle(p);
  ok(await ref() === auto && (await p.inputValue('#body')).startsWith('Paragraph 1.') && await sheets() === n, 'loading restores the letter and its reference');
  const p2 = await c.newPage(); await p2.route(/^https?:\/\//, r => r.fulfill({body: ''})); await p2.route(/qrcode\.min\.js/, r => r.fulfill({path: path.join(NM, 'qrcode-generator/qrcode.js'), contentType: 'application/javascript'}));
  await p2.goto('file://' + path.join(W, 'harness-theme.html'), {waitUntil: 'networkidle'}); await p2.waitForTimeout(500);
  ok(await p2.isChecked('#qrOn') && await p2.locator('#fcols .fcol').count() === 3, 'letterhead remembered after reload');
  await p2.close();

  // 11. Print
  if (has('pdfinfo') && has('pdftotext')) {
    await p.evaluate(() => window.dispatchEvent(new Event('beforeprint'))); await p.emulateMedia({media: 'print'});
    const pp = path.join(W, 'print.pdf'); await p.pdf({path: pp, preferCSSPageSize: true, printBackground: true});
    await p.emulateMedia({media: 'screen'}); await p.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    const info = cp.execSync(`pdfinfo "${pp}"`).toString(), pages = +info.match(/Pages:\s+(\d+)/)[1], txt = cp.execSync(`pdftotext "${pp}" -`).toString();
    ok(pages === n && /Paragraph 9\./.test(txt) && !/Live preview/.test(txt) && !/EFIC header/.test(txt), `print: ${pages} pages (preview ${n}), searchable text, no panel or theme`);
    ok(await p.evaluate(() => document.getElementById('ldg-app').parentNode.classList.contains('post-body')), 'tool moved back into the page after printing');
  } else skip('print check (poppler-utils not installed)');

  // 12. PDF
  const [dl] = await Promise.all([p.waitForEvent('download', {timeout: 90000}), p.click('button[onclick="ldgPdf()"]')]);
  const fp = path.join(W, dl.suggestedFilename()); await dl.saveAs(fp);
  ok(dl.suggestedFilename().startsWith(auto), 'PDF named after the reference: ' + dl.suggestedFilename());
  if (has('pdfimages')) {
    const imgs = cp.execSync(`pdfimages -list "${fp}"`).toString().split('\n').slice(2).filter(Boolean).map(l => l.trim().split(/\s+/));
    ok(imgs.length === n && imgs.every(r => +r[12] >= 299), `PDF: ${imgs.length} pages at ${imgs.map(r => r[12]).join('/')} dpi, ${Math.round(fs.statSync(fp).size / 1024)} KB`);
  } else skip('PDF dpi check (poppler-utils not installed)');
  await p.keyboard.press('Escape');
  ok(!errs.length, 'no JS errors during the run: ' + (errs.join('; ') || 'none'));
  await c.close(); await b.close();
  console.log(R.join('\n'));
  const fails = R.filter(r => r.startsWith('FAIL')).length;
  console.log(`${R.filter(r => r.startsWith('PASS')).length} passed, ${fails} failed, ${R.filter(r => r.startsWith('SKIP')).length} skipped. Screenshots: ${SHOTS}`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log(R.join('\n')); console.error(e); process.exit(1); });
