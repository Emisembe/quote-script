// Turn guidelines/efic-logo-guidelines.html into the PDF and a preview picture.
//   python3 tools/build_logo.py        (writes the HTML first)
//   node tools/render_guidelines.js    (needs Playwright: npm i playwright)
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const dir = path.join(__dirname, '..', 'guidelines');
  const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
  await page.goto('file://' + path.join(dir, 'efic-logo-guidelines.html'), { waitUntil: 'networkidle' }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: path.join(dir, 'efic-logo-guidelines.pdf'), preferCSSPageSize: true, printBackground: true });
  const sheets = await page.$$('.sheet');
  for (let i = 0; i < sheets.length; i++) {
    await sheets[i].screenshot({ path: path.join(dir, 'preview', 'page-' + (i + 1) + '.png') });
  }
  console.log(sheets.length + ' pages');
  await browser.close();
})();
