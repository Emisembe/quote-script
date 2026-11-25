// Test every built overlay in dist/: JS errors, parts off-screen, see-through background (lower thirds),
// ticker moving, QR codes readable (decoded with jsQR), text not clipped. Screenshots go to OUTDIR.
//   npm i jsqr            (once, in a scratch folder; Playwright is used as installed)
//   node test_overlays.js /path/to/dist OUTDIR
const { chromium } = require('playwright');
const jsQR = require('jsqr');
const fs = require('fs');
const path = require('path');
const DIST = path.resolve(process.argv[2]);
const OUT = path.resolve(process.argv[3] || '.');
const SIZES = [[1920, 1080], [1280, 720], [1080, 1920], [720, 1280]];
(async () => {
  const b = await chromium.launch();
  let bad = 0;
  for (const f of fs.readdirSync(DIST).filter(x => x.endsWith('.html'))) {
    for (const [w, h] of SIZES) {
      const p = await b.newPage({ viewport: { width: w, height: h } });
      const errs = [];
      p.on('pageerror', e => errs.push(e.message));
      await p.goto('file://' + path.join(DIST, f));
      await p.waitForTimeout(1500);
      const r = await p.evaluate(() => {
        const W = innerWidth, H = innerHeight;
        const off = [...document.querySelectorAll('.part')].filter(e => { const r = e.getBoundingClientRect(); return r.left < -1 || r.right > W + 1 || r.top < -1 || r.bottom > H + 1; }).map(e => e.className);
        const clipped = [...document.querySelectorAll('.heading, .sub, .p-title, .p-text, .headline span, .title span')]
          .filter(e => e.scrollHeight > e.parentElement.clientHeight + 2).map(e => e.className || e.parentElement.className);
        const track = document.querySelector('.track');
        const qrs = [...document.querySelectorAll('canvas')].filter(c => c.offsetParent).map(c => {
          const o = document.createElement('canvas'); o.width = o.height = c.width + 16;
          const g = o.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, o.width, o.height); g.drawImage(c, 8, 8);
          return { w: o.width, d: Array.from(g.getImageData(0, 0, o.width, o.width).data) };
        });
        return { off, clipped, bg: getComputedStyle(document.body).backgroundColor, t1: track && track.style.transform, qrs };
      });
      await p.waitForTimeout(400);
      const t2 = await p.evaluate(() => { const t = document.querySelector('.track'); return t && t.style.transform; });
      const codes = r.qrs.map(q => { const c = jsQR(Uint8ClampedArray.from(q.d), q.w, q.w); return c ? c.data : 'NOT READABLE'; });
      const problems = [];
      if (errs.length) problems.push('JS: ' + errs.join(' / '));
      if (r.off.length) problems.push('off-screen: ' + r.off.join(', '));
      if (r.clipped.length) problems.push('clipped: ' + r.clipped.join(', '));
      if (r.t1 != null && r.t1 === t2) problems.push('ticker not moving');
      if (codes.includes('NOT READABLE')) problems.push('QR not readable');
      if (/news-bar|lower/i.test(f) && r.bg !== 'rgba(0, 0, 0, 0)') problems.push('background not see-through: ' + r.bg);
      const tag = `${f} @${w}x${h}`;
      console.log((problems.length ? 'FAIL ' : 'ok   ') + tag + (codes.length ? ' | QR: ' + [...new Set(codes)].join(', ') : '') + (problems.length ? ' | ' + problems.join(' | ') : ''));
      bad += problems.length ? 1 : 0;
      await p.screenshot({ path: path.join(OUT, `${f.replace(/\.html$/, '')} ${w}x${h}.png`) });
      await p.close();
    }
  }
  await b.close();
  console.log(bad ? `${bad} problem(s)` : 'all passed');
  process.exit(bad ? 1 : 0);
})();
