# Shot data — angka dan grafik sebagai adegan

Bacaan untuk segmen yang ceritanya ANGKA: watt, rupiah, tahun balik modal,
benchmark, jumlah pengguna, versi. Angka di sini harus menjadi kejadian yang
bisa ditonton, bukan teks yang ditulis di layar.

> Diadaptasi dari resep kategori *data* di
> [video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft)
> (Apache-2.0, `references/shots/data/`). Aslinya untuk Remotion/React dan
> dihitung dalam frame. Di sini resepnya ditulis ulang untuk GSAP + `tl.time()`
> dan dihitung dalam detik (30 fps → 1 f = 0,033 dtk). Parameter dari sumber
> dicatat sebagai **titik awal penyetelan**, bukan angka final. Sumbernya
> sendiri menyetel parameter itu di atas data contoh.

## 0. Aturan bersama (berlaku untuk semua shot di bawah)

1. **Konteks harus asli.** Pakai judul, label sumbu, satuan, dan angka asli
   dari sumber (Fact Sheet, hasil ukur sendiri). Di sumber, semua shot yang
   dicoba pakai batang abu-abu sebagai placeholder ditolak, lalu lolos setelah
   diisi data asli. Kalau angkanya belum ada, tunda shot data dan isi dulu
   naskahnya.
2. **Satu warna aksen = satu kejadian.** Bagian yang jadi poin cerita (lonjakan,
   selisih, angka yang menang) diberi warna aksen. Yang lain netral. Kalau
   semuanya diberi warna, penonton tidak tahu harus melihat ke mana.
3. **Ukuran untuk dibaca di HP.** Label minimal 32 px dan angka utama
   120–176 px di kanvas 1080 lebar. Grafiknya memenuhi frame, jangan diciutkan
   di dalam kartu.
4. **Ada diam total di akhir.** Setelah angka mendarat, tahan **≥ 1–1,2 dtk**
   tanpa gerak sama sekali, termasuk tanpa melayang atau "napas". Kalau grafik
   masih bergeser sedikit, terbaca seperti videonya belum selesai.
5. **Kejadian puncak hanya sekali.** Lonjakan, sumbu jebol, dan rem mendadak
   masing-masing paling banyak sekali per video. Kalau diulang, efeknya terasa
   murahan. Dalam satu video, paling banyak 2 shot data, dan letaknya tidak
   berdempetan.
6. **Deterministik.** Posisi, gelombang, dan blur dihitung dari waktu `t`,
   bukan dari `Math.random()` atau dari frame sebelumnya. Ini syarat supaya
   `snap.mjs` dan `export-mp4.mjs` memberi hasil yang sama. Untuk efek acak
   pakai noise ber-seed. Untuk kecepatan pakai selisih fungsi posisi (§0a).
7. **Suara (kalau ada musik/SFX).** Kejadian puncak diberi satu suara pendek
   (tick, whoosh, impact). Gerak lambat dibiarkan senyap.

### 0a. Blur dari kecepatan, tanpa keyframe manual

Blur yang di-keyframe manual hampir selalu tidak cocok dengan kecepatan
gerakannya. Hitung blur dari posisi frame ini dikurangi posisi frame sebelumnya:

```js
const FPS = 30;
const seg = (t, t0, dur, a, b, ease) => {           // posisi = fungsi murni waktu
  const u = gsap.utils.clamp(0, 1, (t - t0) / dur);
  return a + (b - a) * gsap.parseEase(ease)(u);
};
const yAt = t => seg(t, 2.0, 1.6, 0, -2400, 'expo.out');
// di render():
const t = tl.time(), y = yAt(t);
const v = Math.abs(y - yAt(t - 1 / FPS));           // px per frame
el.style.transform = `translateY(${y}px)`;
blur.setAttribute('stdDeviation', `0 ${Math.min(30, v * 0.32)}`); // feGaussianBlur berarah (techniques.md §2)
```

Kalau benda berhenti, `v` jadi 0 dan blurnya hilang sendiri. Pola ini dipakai di
semua shot yang punya gerakan cepat.

## 1. Pilih shot dari ceritanya

| Cerita yang mau disampaikan | Shot | Durasi |
|---|---|---|
| "Angkanya hidup / real-time" (watt naik-turun, suhu, beban CPU) | **A. Garis osiloskop** | 5,5–6,5 dtk |
| "Tiap titik = satu unit" (jumlah PC, pengguna, bulan) | **B. Kawanan titik berkumpul** | 5,5–6,5 dtk |
| "Naiknya tidak muat di grafik" (lonjakan, hasil jauh di atas pembanding) | **C. Sumbu jebol & skala ulang** | 5,5–6,5 dtk |
| Beberapa metrik naik bersamaan (CPU / RAM / daya) | **D. Jarum sapu penuh** | ±4,7 dtk |
| Satu angka melompat jauh (25 W → 7 W, 1 thn → 40 thn) | **E. Pita skala, jarum diam** | ±5 dtk |
| Sebelum vs sesudah (setup lama vs baru, tanpa vs dengan tweak) | **F. Slider sebelum/sesudah** | 4–5 dtk |
| "Sudah banyak perubahan, yang ini paling besar" (daftar panjang) | **G. Gulir panjang lalu rem** | 4–5 dtk |
| Riwayat / tonggak (versi, tahun, upgrade bertahap) | **H. Perjalanan garis waktu** | 4–5 dtk |

Pembagian dengan teknik yang sudah ada: odometer angka (gaya v1) tetap dipakai
untuk angka satuan yang dibacakan. Shot di sini dipakai kalau **perbandingan
atau perubahan** angka itulah inti adegannya.

## 2. Resep

### A. Garis osiloskop (`oscilloscope-stream`)
Garis ditulis terus di ujung kanan, dan data lama mengalir keluar ke kiri.
Di tengah ada **satu lonjakan**: amplitudo sekitar 2,2×, angka di layar melompat
dan berubah ke warna aksen. Sebelum lonjakan ada gejala kecil, sesudahnya ada
getaran sisa. Setelah itu garis berhenti total, lalu kamera mendorong pelan ke
arah titik lonjakan.

- Kecepatan alir **8 px/frame** (240 px/dtk). 5,5 px/frame sudah terasa,
  8 px/frame lebih jelas.
- Gelombang = jumlah beberapa `sin` dari `x + t*240`, ditambah satu pulsa
  Gaussian untuk lonjakannya: `amp * exp(-((t-tS)/w)^2)`. Gejala dan getaran
  sisa dibuat dari pulsa yang lebih kecil sebelum dan sesudah `tS`.
- Path SVG digambar ulang di `render()` dari fungsi itu (sampel per 4 px).
- Cocok untuk watt-meter yang berdenyut saat PC idle lalu melonjak saat render.

### B. Kawanan titik berkumpul (`unit-dot-swarm-regroup`)
Sekumpulan titik yang sama berpindah tiga kali. Pertama tersebar acak, lalu
berkumpul jadi tiga kelompok berlabel, lalu berbaris jadi batang dengan label
sumbu, lalu membentuk **angka besar** dari susunan titik. Penonton bisa
mengikuti satu titik sampai ke tempat akhirnya.

- Sumber: 320 titik, diameter 20 px. Saat bergerak, titik memanjang jadi
  kapsul sesuai kecepatannya, paling panjang +20 px.
- Perpindahan tiap babak pakai pegas (stiffness 150, damping 13), dengan jeda
  antar titik 8 f (0,27 dtk). Di GSAP: `elastic.out(1, .55)` atau `back.out(1.4)`,
  stagger `{each: .0008, from: 'random'}` dengan seed tetap.
- Titik dalam kelompok disusun spiral bunga matahari (sudut emas 137,5°).
- Titik untuk angka di babak akhir dihitung dulu: gambar teks di canvas
  tersembunyi, ambil sampel piksel, lalu pilih tepat N titik. Jumlah titik
  harus sama dengan jumlah posisi supaya bentuknya rapi.
- Kelompok yang jadi poin cerita diberi warna aksen.

### C. Sumbu jebol & skala ulang (`axis-rescale-shock`)
Garis naik normal, lalu nilai baru **menembus batas atas grafik** sampai sekitar
**226 px** di luarnya. Garisnya masuk ke area judul dan menabrak angka KPI.
Tahan setengah ketukan. Lalu sumbu y diskala ulang dengan tiga gerakan bersamaan:
label skala lama terbang keluar dan yang baru masuk, garis grid jadi lebih
rapat, dan garis lama tergencet jadi hampir datar. Nilai baru turun masuk ke
grafik dan labelnya muncul dengan pantulan.

- Batas atas diberi celah dan serpihan kecil saat ditembus. Layar bergetar
  sekitar 10 px, sekali saja.
- Versi 80 px di sumber kurang dramatis. Garisnya harus benar-benar masuk ke
  area judul supaya terasa ada yang jebol.
- Cocok untuk "tahun balik modal" (40 thn tidak muat di sumbu 0–10 thn).

### D. Jarum sapu penuh (`needle-sweep-selftest`)
Seperti cek otomatis panel mobil saat mesin dinyalakan. Tiga dial menyala,
jarumnya **menyapu sampai ujung busur 270°** (0,4 dtk, `power2.out`) sambil
menyalakan garis skala yang dilewati. Lalu jarum turun ke nilai asli dengan
pegas, lewat sedikit sekitar 8°, lalu menetap. Antar dial berjarak **4 f
(0,13 dtk)** supaya terlihat seperti gelombang. Begitu jarum diam, angka di
bawah dial muncul dengan pantulan.

```js
['#g1','#g2','#g3'].forEach((g, i) => {
  const at = T0 + i * 0.13;
  tl.to(`${g} .needle`, { rotation: 135, duration: .4, ease: 'power2.out' }, at)      // -135° → +135° (penuh)
    .to(`${g} .needle`, { rotation: VAL[i], duration: .9, ease: 'elastic.out(1,.45)' }, at + .4)
    .from(`${g} .readout`, { scale: .6, opacity: 0, duration: .35, ease: 'back.out(2.4)' }, at + .9);
});
```
- Kalau jarum langsung ke nilai asli, efek cek otomatisnya hilang. Kalau jarum
  berhenti tanpa lewat sedikit, kesannya seperti jam digital, bukan jarum
  mekanis.

### E. Pita skala, jarum diam (`tape-scroll-fixed-pointer`)
Seperti indikator kecepatan di kokpit pesawat. Jarum dan jendela angka
dikunci di tengah layar, dan **pita skala** setinggi layar yang bergulir
lewat di belakangnya. Mula-mula pita merayap pelan dan tertahan di garis batas
lama. Garis itu lalu putus, pita mundur sedikit sebagai ancang-ancang, lalu
**melesat** (0,73 dtk, puncak sekitar 100 px/frame, dengan blur vertikal dari
§0a). Pita direm dengan pegas, lewat sedikit, kembali, dan berhenti tepat di
nilai baru.

- Skala pita 5 px per satuan. Besarnya lompatan jadi jarak yang benar-benar
  terlihat di layar.
- Angka di jendela berubah mengikuti posisi pita (odometer gaya v1).

### F. Slider sebelum/sesudah (`before-after-slider-scrub`)
Dua versi gambar ditumpuk. Garis pemisah dengan pegangan bulat mula-mula diam
di 8%, mundur sedikit ke 6,5%, lalu **dilempar** ke 76% (0,4 dtk,
`power3.out`), memantul ke 70%, berhenti sekitar 0,6 dtk, lalu **digeser
pelan** ke 40% (1,6 dtk). Diam sampai akhir.

- Perbandingan kecepatan lempar dan geser pelan sekitar **1:5**. Kalau di
  bawah 1:3, kontras ritmenya tidak terasa.
- Versi "sesudah" ditampilkan dengan `clip-path: inset(0 ${100-x}% 0 0)` yang
  mengikuti posisi garis. Kalau batas potong dan posisi garis tidak sama,
  kesalahannya kelihatan.
- Pegangan memanjang sesuai kecepatan (`scaleX` paling besar 1,18) dan kembali
  normal saat diam.
- Kedua versi harus **satu layout dan satu sudut kamera**. Versi "sebelum"
  harus kondisi asli (foto atau hasil ukur sendiri), jangan dijelek-jelekkan.
  Geseran pelan berhenti di 40%, jangan sampai 0%, supaya versi "sesudah" masih
  terlihat di frame terakhir.

### G. Gulir panjang lalu rem (`scroll-brake-moves`)
Daftar panjang bergulir cepat sampai jadi pita warna buram, lalu melambat dan
**berhenti tepat** di baris tujuan di tengah layar. Baris itu sedikit terangkat
(scale 1,03, bayangan, garis tepi 2 px warna aksen), sedangkan baris lain
meredup ke opacity 0,38. Jangan sampai 0, supaya konteksnya tetap kelihatan.

- Varian dasar: geser ±2400 px dalam 1,67 dtk dengan
  `CustomEase`/`cubic-bezier(.45,0,.06,1)` (cepat di awal, lalu mengerem
  panjang). Blur dari §0a dikali 0,32, maksimal 30 px.
- Varian kunci target: daftar melewati tujuan +30 px lalu memantul kembali.
  **Di frame yang sama** saat daftar pertama kali berhenti, empat siku L
  terbang masuk dari luar layar (`back.out(2.4)`) dan mengunci baris tujuan.
  Kalau siku dan berhentinya daftar beda lebih dari 2 f, efeknya buyar.
- Tinggi baris divariasikan (72/94/116 px) supaya pita buramnya punya ritme.
  Baris yang lewat cepat cukup diisi balok abu-abu. Baris tujuan berisi teks
  asli.

### H. Perjalanan garis waktu (`timeline-travel`)
Kamera bergeser horizontal di sepanjang sumbu waktu dengan tiga tahap: mulai
pelan, melesat, lalu mengerem mendadak. Setiap tonggak memunculkan kartu yang
berdiri dengan pegas **0,2 dtk sebelum** kamera sampai di titiknya. Di titik
terakhir, kamera berhenti lalu mendorong masuk (scale 1 → 1,28 dalam 0,33 dtk,
`power3.out`), lalu diam ≥ 1 dtk.

- Kurva kecepatan (input → output): `[0, .15, .88, 1] → [0, .055, .9, 1]`.
  Fungsinya `camX(t)` dipakai juga untuk menghitung kapan tiap kartu mulai muncul.
- Selain 3–5 tonggak utama, tambahkan titik-titik kecil di sumbu. Titik itu
  jadi patokan yang membuat kecepatan kamera terasa.
- Jangan pakai G dan H berdampingan. G untuk daftar vertikal yang berhenti di
  yang terbaru, H untuk sejarah horizontal.

## 3. Contoh pemetaan untuk akun device budget

| Momen di naskah | Shot |
|---|---|
| PC idle 25 W, melonjak saat render | A |
| "Butuh ±40 tahun buat balik modal" | C (sumbu 0–10 thn jebol) atau E |
| CPU / RAM / daya saat homelab dinyalakan | D |
| Setup meja sebelum vs sesudah rapikan kabel | F (foto asli dua-duanya) |
| Riwayat upgrade PC bekas (RAM → SSD → GPU) | H |

## 4. Periksa dengan `snap.mjs`

Ambil potret di: sebelum puncak, **tepat di frame puncak** (lonjakan, jebol,
atau mulai rem), di tengah pendaratan, dan dua titik di masa diam akhir.
Kedua potret masa diam harus identik piksel per piksel
(`cmp a.png b.png`). Kalau beda, masih ada yang bergerak.
