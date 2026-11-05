// node preview.js page.html format "t1,t2,..." outprefix  -> contact sheet frames at 1x
const { chromium } = require('playwright');
(async () => {
  const [page, format, times, out] = process.argv.slice(2);
  const mobile = format === 'mobile';
  const b = await chromium.launch(); const p = await b.newPage({ viewport: mobile ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('file://' + require('path').resolve(page) + '?format=' + format);
  await p.waitForFunction(() => window.__ready === true);
  for (const t of times.split(',').map(Number)) {
    await p.evaluate(t => window.renderFrame(t), t);
    await p.screenshot({ path: `${out}-${String(t).replace('.', '_')}.png` });
  }
  if (errs.length) console.log('ERRORS', errs);
  await b.close();
})();
