// Seekable page → MP4 with true shutter motion blur (classroom-lab, Canvas/WebGL/Three.js path).
// Not screen recording: the page must draw any time on demand. Contract:
//   window.DURATION = seconds; window.renderAt = async (t) => {...}; window.__ready = true
// Each output frame averages --samples renders spread over --shutter of the frame interval (0.5 = 180°).
//
//   NODE_PATH=<tools>/node_modules node render_web.mjs --root <lesson-dir> --page index.html --audio narration.wav --out 实验动画.mp4
//   node render_web.mjs --root <lesson-dir> --page index.html --stills 0,3,10 --outdir <lesson-dir>/画面检查
//   options: --fps 30 --samples 5 --shutter 0.5 --from 0 --to <duration> --crf 17 --scale 1
// Chrome: set CHROME=<path> if it is not at the default macOS/Linux location. Only render pages you wrote or reviewed.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {spawn} from 'node:child_process';
import puppeteer from 'puppeteer-core';

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const k = process.argv[i];
  if (k.startsWith('--')) { const v = process.argv[i + 1]; if (v === undefined || v.startsWith('--')) args[k.slice(2)] = true; else { args[k.slice(2)] = v; i++; } }
}
const root = path.resolve(args.root || process.cwd());
const fps = +(args.fps || 30), samples = +(args.samples || 4), shutter = +(args.shutter ?? 0.5), scale = +(args.scale || 1);
const MIME = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.wav': 'audio/wav', '.mp4': 'video/mp4', '.css': 'text/css', '.ttf': 'font/ttf', '.otf': 'font/otf'};
const server = http.createServer((req, res) => {
  let p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(root)) { res.statusCode = 403; return res.end(); }
  res.setHeader('Content-Type', MIME[path.extname(p)] || 'application/octet-stream');
  fs.createReadStream(p).on('error', () => { res.statusCode = 404; res.end(); }).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));

const browser = await puppeteer.launch({
  headless: true, executablePath: process.env.CHROME || [ '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium' ].find(p => fs.existsSync(p)),
  args: [...(process.platform === 'darwin' ? ['--use-angle=metal'] : []), '--enable-gpu', '--ignore-gpu-blocklist', '--hide-scrollbars', '--force-color-profile=srgb', '--autoplay-policy=no-user-gesture-required'],
  protocolTimeout: 600000,
});
const page = await browser.newPage();
await page.setViewport({width: 1920, height: 1080, deviceScaleFactor: scale});
page.on('pageerror', e => console.error('[page]', e.message));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.error('[console]', m.text()); });
await page.goto(`http://127.0.0.1:${server.address().port}/${args.page || 'index.html'}?render`);
await page.waitForFunction('window.__ready === true', {timeout: 600000});
const duration = await page.evaluate(() => window.DURATION);
const render = t => page.evaluate(t => window.renderAt(t), t);

if (args.stills) {
  const dir = args.outdir || 'out/stills'; fs.mkdirSync(dir, {recursive: true});
  for (const t of String(args.stills).split(',').map(Number)) {
    await render(t); await page.screenshot({path: `${dir}/still-${t.toFixed(2)}.png`}); console.log('still', t);
  }
} else {
  const from = +(args.from || 0), to = +(args.to || duration), frames = Math.round((to - from) * fps);
  const out = args.out || 'out/film.mp4';
  const enc = ['-c:v', 'libx264', '-preset', 'slow', '-crf', String(args.crf || 17), '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-tune', 'film'];
  const audio = args.audio ? ['-ss', String(from), '-t', String(to - from), '-i', args.audio] : [];
  const ff = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'warning',
    '-f', 'image2pipe', '-vcodec', 'mjpeg', '-framerate', String(fps * samples), '-i', '-', ...audio,
    '-vf', `tmix=frames=${samples},select='eq(mod(n\\,${samples})\\,${samples - 1})',setpts=N/${fps}/TB,scale=in_range=full:out_range=tv,format=yuv420p`, '-r', String(fps),
    ...enc, ...(args.audio ? ['-c:a', 'aac', '-b:a', '192k', '-ar', '48000'] : []), '-movflags', '+faststart', '-shortest', out],
    {stdio: ['pipe', 'inherit', 'inherit']});
  const done = new Promise((ok, fail) => ff.on('close', c => c ? fail(new Error('ffmpeg ' + c)) : ok()));
  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    for (let s = 0; s < samples; s++) {
      // Sub-frames end on the frame's own time so the sharp edge of the blur lands on t.
      const t = from + (f - shutter * (samples - 1 - s) / Math.max(1, samples - 1)) / fps;
      await render(Math.max(0, t));
      const buf = await page.screenshot({type: 'jpeg', quality: 95, optimizeForSpeed: true});
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    if (f % 90 === 0) { const el = (Date.now() - t0) / 1000; console.log(`frame ${f}/${frames}  ${el.toFixed(0)}s  eta ${(el / Math.max(1, f) * (frames - f) / 60).toFixed(1)}min`); }
  }
  ff.stdin.end(); await done; console.log('wrote', out);
}
await browser.close(); server.close();
