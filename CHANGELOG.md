# Changelog

## 1.21.1 — 2026-11-24

**Export MP4 lebih cepat**
- `local/export-mp4.mjs` sekarang masuk repo dan memotret frame dengan beberapa browser paralel
  (bawaan setengah core, maks 6; `WORKERS=1` = cara lama). Diukur dulu: yang lambat screenshot
  Chrome (~70-88 ms/frame), bukan encode x264 (~11 ms/frame), jadi JPEG/VAAPI tidak membantu.
  Exploded 82 → 15 dtk, Versus 33 → 9 dtk (1080×1920, 30 fps).
- Tiap browser memotret potongan berurutan (bukan frame selang-seling, karena raster Chrome
  bergantung riwayat frame dan tepi elemen bisa bergeser ~1 px). Potongan terakhir selalu memuat
  seluruh ekor diam (≥ 1.7 dtk); segmen disambung `-c copy`.
- `optimizeForSpeed` pada screenshot, preset x264 `medium` (SSIM setara `slow`), env `PRESET`.

## 1.21.0 — 2026-11-22

**Gaya device (9:16)**
- Enam starter baru `assets/starter-device-*.html` dengan palet gaya infografis v1: terminal
  (perintah diketik + stabilo), versus split (belahan diagonal + skor odometer), callout kit
  (coretan spidol di atas footage asli, sinkron frame), blueprint (garis tergambar + garis ukur),
  size lineup (kamera meluncur antar perangkat), exploded view isometrik (tanpa Three.js).
- Panduan pemilihan dan aturan pakai di `references/gaya-device.md`.
- Latar bernapas melambat dan berhenti 1 dtk sebelum akhir sehingga frame penutup identik.

## 1.20.0 — 2026-11-22

**Shot data**
- `references/data-shots.md`: delapan resep shot untuk segmen angka/grafik (osiloskop, kawanan
  titik, sumbu jebol, jarum sapu, pita skala, slider sebelum/sesudah, gulir-rem, garis waktu),
  diadaptasi dari kategori *data* video-shotcraft (Apache-2.0) ke GSAP + detik.
- Aturan bersama: konteks data asli, satu aksen = satu kejadian, diam total ≥ 1 dtk di akhir,
  blur dihitung dari selisih posisi (deterministik).

## 1.19.0 — 2026-09-15

**Ukuran shot — kamera ke elemen**
- "Zoom in-out" dirumuskan sebagai pergantian ukuran shot (wide ↔ medium close-up ↔ close-up) ke
  elemen yang sedang bercerita, bukan napas kamera beberapa persen yang hampir tak terlihat.
- Panduan memilih target dan waktu, dua tempo gerak, rig kamera dengan skala dari ukuran elemen
  dan klem tepi dunia, label di lapisan layar (`references/techniques.md` §3b).

## 1.18.0 — 2026-09-15

**Video sebagai layer footage**
- Semua starter membawa helper `clip(el, {at, in, out, rate, hold})`: klip video mengikuti jam
  timeline — sinkron saat diputar, tepat saat scrub — dan bisa dipotong, diperlambat, ditahan,
  di-mask, serta dianimasikan bersama elemen lain.
- `scripts/snap.mjs` dan `scripts/export-frames.mjs` menunggu frame klip siap, sehingga ekspor MP4
  tetap presisi frame.
- Panduan pemakaian, sumber klip (file sendiri, generate lewat MCP, stok berlisensi), format, dan
  pola layout di `references/techniques.md` §9b.
- Deliverable tetap `index.html` (+ `assets/` bila memakai klip atau audio), tanpa file peluncur.

## 1.17.0 — 2026-09-14

**Opener dan promo**
- Kerangka dipilih, bukan diwarisi: tiga kandidat konsep dari menu 19 konsep, sidik jari
  struktur yang dibandingkan dengan proyek sebelumnya, komponen kanonik paling banyak dua,
  dan starter opener tanpa urutan adegan contoh (`references/opener-konsep.md`,
  `assets/starter-opener.html`).
- Contoh urutan tiap konsep adalah prinsip, bukan naskah: pembuka/penutup dan momen khas
  tidak disalin; palet, bentuk, dan properti diturunkan dari brand, tiap warna menyebut
  sumbernya.
- Panduan animasi UI untuk app/SaaS, kamera yang mengikuti klik penting, dan foto dalam
  opener (foto user, generate lewat MCP, atau stok berlisensi).

**Tipografi, latar, render**
- Sorotan kata opsional; judul dan klaim tanpa titik otomatis.
- Latar tidak pernah statis; warna latar boleh berganti kapan dibutuhkan dengan pemicu
  terlihat. Grainy gradient dengan jaga-jaga encode. Menu gaya render objek.

**Explainer**
- Enam gaya: aksi kontinu, kartun kolase, jurnalisme visual, katalog putih, sketsa vintage,
  dan kartun panggung (`references/explainer.md`, `references/kartun-panggung.md`).

**After Effects**
- Dibangun langsung lewat bridge/MCP Higgsfield (`references/ae-bridge-higgsfield.md`,
  `scripts/ae/bridge/`).

**Alat kerja**
- Verifikasi visual per detik kunci (`scripts/snap.mjs`), ekspor MP4
  (`scripts/export-frames.mjs`), pemotong jeda VO (`scripts/vo-pauses.html`).
