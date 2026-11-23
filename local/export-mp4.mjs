/* Export frame-by-frame ke MP4 untuk rasio apa pun (W/H dibaca dari window.OPENER).
   Frame dialirkan langsung ke ffmpeg (tanpa ribuan file).
   Pakai: node export-mp4.mjs <folder-berisi-index.html> <out.mp4>
   env: FPS (30), CRF (14), PRESET (medium), WORKERS (bawaan: setengah core, maks 6; 1 = cara lama)

   Kenapa paralel (diukur 22 Nov 2026, 1080x1920): screenshot Chrome ~70-88 ms/frame + seek
   ~28 ms/frame, sedangkan encode x264 cuma ~11 ms/frame dan berjalan bersamaan. Yang lambat
   Chrome, bukan ffmpeg; JPEG juga tidak lebih cepat (dan merusak warna flat). Timeline semua
   komposisi = fungsi murni waktu, jadi beberapa browser bisa memotret bagian berbeda sekaligus.

   Kenapa potongan BERURUTAN, bukan frame selang-seling: Chrome menyimpan raster elemen
   berdasarkan riwayat frame yang pernah digambar, sehingga dua browser bisa beda ~1 px di tepi
   anti-aliasing walau state animasinya identik. Selang-seling = tiap frame ganti browser =
   tepi bergetar tipis dan bagian akhir yang wajib diam bisa berkedip. Potongan berurutan: riwayat
   tetap utuh di dalam potongan, dan potongan terakhir selalu memuat seluruh ekor diam (>= 2 dtk).
   Tiap potongan di-encode jadi segmen sendiri lalu disambung tanpa encode ulang (-c copy). */
import puppeteer from 'puppeteer';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const [dir, out] = process.argv.slice(2);
if (!dir || !out) { console.error('pakai: node export-mp4.mjs <folder-berisi-index.html> <out.mp4>'); process.exit(2); }
const FPS = Number(process.env.FPS || 30), CRF = process.env.CRF || '14', PRESET = process.env.PRESET || 'medium';
const WANT = Math.max(1, Number(process.env.WORKERS || Math.min(6, Math.floor(os.cpus().length / 2))));
const url = pathToFileURL(path.resolve(dir, 'index.html')).href + '?clean=1';
const t0 = Date.now();

function ffmpeg(args) {
  const p = spawn('ffmpeg', ['-loglevel', 'error', '-y', ...args], { stdio: ['pipe', 'inherit', 'inherit'] });
  p.done = new Promise((res, rej) => p.on('close', c => c === 0 ? res() : rej(new Error(`ffmpeg gagal (kode ${c})`))));
  return p;
}
async function openPage() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.OPENER && window.OPENER.ready', { timeout: 60000 });
  const meta = await page.evaluate(() => ({ W: OPENER.W, H: OPENER.H, DUR: OPENER.DURATION }));
  await page.setViewport({ width: meta.W, height: meta.H, deviceScaleFactor: 1 });
  await page.evaluate(() => document.fonts.ready);
  return { browser, page, ...meta };
}

const first = await openPage();
const { W, H, DUR } = first;
const total = Math.round(DUR * FPS);
// Potongan dibagi rata; yang terakhir minimal 1.7 dtk supaya seluruh ekor diam (latar starter
// mulai melambat di DUR-1.6, diam total >= 1 dtk) dipotret satu browser. Potongan lain >= 1 dtk.
const K = Math.max(1, Math.min(WANT, Math.floor(total / FPS)));
const tail = Math.min(total, Math.max(Math.ceil(total / K), Math.ceil(1.7 * FPS)));
const bounds = [0];
for (let k = 1; k < K; k++) bounds.push(Math.round(k * (total - tail) / (K - 1)));
bounds.push(total);
const workers = [first, ...await Promise.all(Array.from({ length: K - 1 }, openPage))];

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bm-export-'));
const encArgs = ['-c:v', 'libx264', '-preset', PRESET, '-crf', CRF, '-pix_fmt', 'yuv420p'];
let doneFrames = 0;
async function run({ page }, k) {
  const [a, b] = [bounds[k], bounds[k + 1]];
  const seg = path.join(tmp, `seg${k}.mp4`);
  const ff = ffmpeg(['-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', ...encArgs,
    ...(K === 1 ? ['-movflags', '+faststart', out] : [seg])]);
  for (let i = a; i < b; i++) {
    await page.evaluate(async t => { OPENER.seek(t); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); OPENER.seek(t); }, i / FPS);
    const buf = await page.screenshot({ type: 'png', optimizeForSpeed: true, clip: { x: 0, y: 0, width: W, height: H } });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (++doneFrames % FPS === 0) process.stdout.write(`\r${doneFrames}/${total}`);
  }
  ff.stdin.end();
  await ff.done;
  return seg;
}
try {
  const segs = await Promise.all(workers.map(run));
  if (K > 1) {
    const list = path.join(tmp, 'list.txt');
    fs.writeFileSync(list, segs.map(s => `file '${s}'`).join('\n'));
    await ffmpeg(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', out]).done;
  }
} finally {
  await Promise.all(workers.map(w => w.browser.close()));
  fs.rmSync(tmp, { recursive: true, force: true });
}
console.log(`\nselesai: ${out}  (${total} frame, ${K} worker, ${((Date.now() - t0) / 1000).toFixed(1)} dtk)`);
