// Renders the jobs in jobs.json: SVG -> PNG (transparent) or PDF (vector). Usage: node render_all.js <jobs.json>
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const { jobs, gf } = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const b = await chromium.launch(); const p = await b.newPage();
  for (const j of jobs) {
    const svg = fs.readFileSync(j.src, 'utf8');
    const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg); const w0 = +m[1], h0 = +m[2];
    const head = j.fonts ? gf : '';
    if (j.kind === 'png') {
      const w = j.width ? j.width : Math.round(j.height * w0 / h0), h = j.height ? j.height : Math.round(w * h0 / w0);
      await p.setViewportSize({ width: w, height: h });
      const s = svg.replace(/(<svg[^>]*?) width="[^"]+" height="[^"]+"/, `$1 width="${w}" height="${h}"`);
      await p.setContent(`<html><head>${head}</head><body style="margin:0;background:transparent">${s}</body></html>`, { waitUntil: 'networkidle' });
      await p.evaluate(() => document.fonts.ready);
      await p.screenshot({ path: j.out, omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
    } else {
      const W = j.unit === 'mm' ? j.w + 'mm' : w0 + 'px', H = j.unit === 'mm' ? j.h + 'mm' : h0 + 'px';
      const s = svg.replace(/(<svg[^>]*?) width="[^"]+" height="[^"]+"/, `$1 width="100%" height="100%"`);
      await p.setContent(`<html><head>${head}<style>@page{size:${W} ${H};margin:0}html,body{margin:0;width:${W};height:${H};overflow:hidden}svg{display:block}</style></head><body>${s}</body></html>`, { waitUntil: 'networkidle' });
      await p.evaluate(() => document.fonts.ready);
      await p.pdf({ path: j.out, width: W, height: H, printBackground: true, pageRanges: '1' });
    }
  }
  await b.close(); console.log('rendered', jobs.length);
})();
