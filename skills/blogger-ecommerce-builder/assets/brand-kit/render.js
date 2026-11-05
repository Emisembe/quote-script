// Render SVG files to PNG at given widths. Usage: node render.js <svgdir> <pngdir> <name>:<width>,<width> ...
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const [svgDir, pngDir, ...jobs] = process.argv.slice(2);
  fs.mkdirSync(pngDir, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const job of jobs) {
    const [name, widths] = job.split(':');
    const svg = fs.readFileSync(path.join(svgDir, name + '.svg'), 'utf8');
    const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
    const w0 = +m[1], h0 = +m[2];
    for (const w of widths.split(',').map(Number)) {
      const h = Math.round(w * h0 / w0);
      await p.setViewportSize({ width: w, height: h });
      await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace(/width="[\d.]+" height="[\d.]+"/, `width="${w}" height="${h}"`)}</body></html>`);
      await p.screenshot({ path: path.join(pngDir, `${name}-${w}px.png`), omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
    }
  }
  await b.close();
})();
