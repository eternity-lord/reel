#!/usr/bin/env node
// Deterministic HTML -> MP4 renderer (1080x1920).
// Usage:
//   node tools/render.mjs <index.html> --dur 16 --fps 30 --out output/x/final.mp4 [--audio music.mp3]
//   node tools/render.mjs <index.html> --still 4.5 --out output/x/still.png     (single frame preview)
// Env: CHROME_PATH=/path/to/chrome  (use system Chrome if Playwright's Chromium can't be downloaded)
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const html = args[0];
const opt = (k, d) => { const i = args.indexOf('--' + k); return i > -1 ? args[i + 1] : d; };
if (!html) { console.error('usage: render.mjs <index.html> [--dur s] [--fps n] [--out file] [--audio file] [--still s]'); process.exit(1); }

const W = 1080, H = 1920;
const fps = +opt('fps', 30), dur = +opt('dur', 16);
const still = opt('still');
const out = opt('out', still !== undefined ? 'output/still.png' : 'output/final.mp4');
const audio = opt('audio');

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.resolve(html)).href + '?render=1');
await page.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
});

// Seek every CSS/WAAPI animation to an exact time (ms since start, delay included).
const seek = t => page.evaluate(ms => {
  document.getAnimations().forEach(a => { a.pause(); a.currentTime = ms; });
}, t * 1000);

mkdirSync(path.dirname(out), { recursive: true });

if (still !== undefined) {
  await seek(+still);
  await page.screenshot({ path: out });
  await browser.close();
  console.log('still ->', out);
  process.exit(0);
}

const ff = ['-loglevel', 'warning', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-'];
if (audio) ff.push('-i', audio, '-af', `afade=t=out:st=${Math.max(dur - 1, 0)}:d=1`);
ff.push('-t', String(dur), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-r', String(fps));
if (audio) ff.push('-c:a', 'aac', '-b:a', '192k');
ff.push('-movflags', '+faststart', out);

const proc = spawn('ffmpeg', ff, { stdio: ['pipe', 'inherit', 'inherit'] });
const frames = Math.round(dur * fps);
for (let i = 0; i < frames; i++) {
  await seek(i / fps);
  const buf = await page.screenshot({ type: 'png' });
  if (!proc.stdin.write(buf)) await new Promise(r => proc.stdin.once('drain', r));
  if (i % fps === 0) process.stdout.write(`\r${i}/${frames} frames`);
}
proc.stdin.end();
await new Promise(r => proc.on('close', r));
await browser.close();
console.log('\nvideo ->', out);
