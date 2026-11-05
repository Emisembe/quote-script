const { chromium } = require('playwright');
(async () => {
  const [html, pdf, png] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1123, height: 794 } });
  await p.goto('file://' + html, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: pdf, width: '297mm', height: '210mm', printBackground: true });
  const n = await p.$$eval('.page', x => x.length);
  for (let i = 0; i < n; i++) await p.locator('.page').nth(i).screenshot({ path: png.replace('#', String(i + 1).padStart(2, '0')) });
  await b.close(); console.log('pages', n);
})();
