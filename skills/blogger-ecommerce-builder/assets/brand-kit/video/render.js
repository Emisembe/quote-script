// Renders one animation to video, frame by frame, at 4K.
// node render.js <intro.html|outro.html> <desktop|mobile> <out.mp4> [audio.wav] [fps]
// Needs: Node + Playwright (Chromium) + ffmpeg. Frames are piped straight into ffmpeg (no temp files).
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
(async () => {
  const [page, format, out, audio, fpsArg] = process.argv.slice(2);
  const fps = Number(fpsArg || 30);
  const mobile = format === 'mobile';
  const viewport = mobile ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 };
  const b = await chromium.launch();
  const p = await b.newPage({ viewport, deviceScaleFactor: 2 });   // 2x = 3840x2160 / 2160x3840
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(page) + '?format=' + format);
  await p.waitForFunction(() => window.__ready === true);
  const duration = await p.evaluate(() => CONFIG.duration);
  const frames = Math.round(duration * fps);
  const args = ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-'];
  if (audio) args.push('-i', audio);
  args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', String(fps),
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709');
  if (audio) args.push('-c:a', 'aac', '-b:a', '192k', '-shortest'); else args.push('-an');
  args.push('-movflags', '+faststart', out);
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'ignore', 'pipe'] });
  let ffErr = ''; ff.stderr.on('data', d => { ffErr = (ffErr + d).slice(-3000); });
  const t0 = Date.now();
  for (let i = 0; i < frames; i++) {
    await p.evaluate(t => window.renderFrame(t), i / fps);
    const buf = await p.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 60 === 0) process.stdout.write(`${path.basename(out)} ${i}/${frames} (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
  }
  ff.stdin.end();
  const code = await new Promise(r => ff.on('close', r));
  await b.close();
  if (errs.length) console.log('PAGE ERRORS', errs);
  if (code !== 0) { console.log('FFMPEG FAILED', ffErr); process.exit(1); }
  console.log('done', out, frames, 'frames in', ((Date.now() - t0) / 1000).toFixed(0) + 's');
})();
