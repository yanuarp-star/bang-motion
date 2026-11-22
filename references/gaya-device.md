# Gaya device — enam starter 9:16 untuk konten perangkat & homelab

Enam starter siap pakai di `assets/starter-device-*.html`. Semuanya:
1080×1920, palet dan huruf **gaya infografis v1** (kuning listrik `#F5C518`,
krem `#F4F1EA`, hijau uang `#1F8F63`, tinta `#15171C`; Space Grotesk + JetBrains
Mono), 100 % vektor, semua gerak dihitung dari `tl.time()`, `?clean=1` untuk
snap/export dan `?debug=1` untuk panel scrub. Latar bergerak pelan, lalu
melambat dan **berhenti total 1 detik sebelum akhir**. Frame terakhir identik.

Ide gayanya dipilih dari katalog gaya video Claude yang sedang tren. Kodenya
ditulis ulang dari nol untuk bang-motion, tanpa menyalin prompt aslinya.

| Starter | Dipakai untuk | Gerak khas | Yang diganti |
|---|---|---|---|
| `starter-device-terminal.html` | sesi homelab: ssh, `uptime`, `docker ps`, `htop` | perintah diketik per huruf, output per baris, bar htop terisi, stabilo kuning menyapu satu angka kunci + kamera dorong | `LINES`, `HI_T` |
| `starter-device-versus.html` | adu dua perangkat (PC bekas vs mini PC, SFF vs Mac) | dua belahan diagonal menghantam masuk, VS meletup + getar sekali, baris adu dibuka satu-satu, centang hijau + skor odometer | `NAMES`, `ROWS`, `VERDICT` |
| `starter-device-callout.html` | anotasi di atas **footage asli** (watt-meter, bongkar PC) | lingkaran spidol goyang, panah melengkung, label meletup, siku pembidik mengunci, stabilo | `FOOT_SRC` + koordinat di blok "urutan" |
| `starter-device-blueprint.html` | ukuran casing, muat di rak/laci, layout isi | garis cetak biru tergambar sendiri, garis ukur dengan angka berputar, acuan kuning putus-putus, badge volume | `DIM`, `RACK_CM`, `TITLE` |
| `starter-device-lineup.html` | perbandingan ukuran beberapa perangkat | perangkat tumbuh dari lantai, kamera meluncur & berhenti di tiap perangkat (zoom menyesuaikan), penggaris menghitung, lalu mundur memperlihatkan semua | `DEV` (cm asli) |
| `starter-device-exploded.html` | "isi PC bekas", komponen yang di-upgrade | casing isometrik, tutup terangkat, lapisan memisah ke atas berurutan dengan pegas, label penunjuk, satu komponen disorot | `PARTS` (kotak cm per lapisan) |

## Aturan pakai

1. **Angka dan output harus asli.** Semua isi demo ditandai CONTOH. Output
   terminal disalin dari sesi sendiri, ukuran dari penggaris sendiri, dan angka
   dari Fact Sheet. Jangan mengarang output perintah atau ukuran.
2. **Kuning hanya untuk satu hal per adegan**: angka kunci (terminal),
   acuan (blueprint), komponen kunci (exploded), coretan (callout). Kalau
   semuanya kuning, penonton tidak tahu harus melihat ke mana.
3. **Callout perlu footage yang diam di bagian yang dianotasi** (tripod).
   Anotasi ada di ruang layar dan tidak ikut goyangan kamera. Kalau footage
   goyang, stabilkan dulu di YNR Studio atau anotasi bagian yang diam saja.
   Untuk banyak klip, potong, atau perlambat, pakai helper `clip()` dari
   `starter-opener.html`.
4. **Satu starter = satu adegan 8–10 dtk.** Untuk video penuh, gabungkan
   adegannya ke satu `index.html` (pola `view` + `cut/whip` seperti
   explainer). Jangan memutar enam file berturut-turut.
5. **Versus maksimal 3–4 baris.** Lebih dari itu tidak terbaca di HP. Pecah
   jadi dua adegan.
6. **Lineup dengan beda ukuran ekstrem** (9 cm vs 40 cm) membuat overview
   akhir kecil. Itu memang poinnya. Biarkan judul yang membawa pesannya.
7. **Exploded tanpa Three.js** sengaja dipilih supaya ringan dirender dan sesuai
   gaya vektor v1. Kalau benar-benar perlu objek berputar 3D, pakai Three.js
   (`techniques.md`) dan terima konsekuensi render yang lebih berat.

## Cek setelah mengganti isi

```bash
URL="file://$PWD/index.html?clean=1" node <skill>/scripts/snap.mjs shots 1 3 5 7 <DUR-1> <DUR-0.05>
cmp shots/t<DUR-1>.png shots/t<DUR-0.05>.png   # harus identik: diam total di akhir
```
Periksa: teks tidak terpotong di tepi (label garis ukur, nama perangkat),
label tidak saling tumpuk, dan anotasi callout tepat di objek footage.
Export MP4: salin starter jadi `index.html` di folder proyek, lalu jalankan
`local/export-mp4.mjs <folder> <out.mp4>`.
