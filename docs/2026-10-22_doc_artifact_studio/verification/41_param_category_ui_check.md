# U05 - Pemeriksaan tampilan pengelompokan kategori pengaturan (DEV 9021)

Tanggal: 2026-11-05. Pelaksana: controller, di panel peramban aplikasi dengan sesi login USER (agen tidak menangani kredensial atau cookie). Halaman: editor templat `Laporan (DATUM Rev A)` (`/studio/templates/cmw24tskp001wv1gw88kn9eo0`), panel Pengaturan lanjutan. Keputusan terkait: D-626, D-627, D-630, D-632, D-633, D-634.

## Hasil

| Cek | Hasil |
|---|---|
| Pengelompokan per kategori, tanpa tingkat bab | Lulus: Warna, Tipografi, Halaman & grid, Sampul, Lembar kendali, Header & footer, Tabel, Gambar & chart, Diagram & simbol, Bukti, angka & satuan, Penomoran & klasifikasi, Pembuatan file & ekspor (kategori kosong pada permukaan lanjutan disembunyikan) |
| Istilah umum (D-633) | Lulus: label dan deskripsi memakai kata sehari-hari; saringan "Semua pengaturan (366)"; ringkasan "Menampilkan 366 pengaturan · nilai asal: gaya bawaan" |
| Deskripsi kategori terlihat | Lulus: satu kalimat di bawah judul tiap kategori |
| Toolbar lengket + chip kategori | Lulus: toolbar tetap di atas saat menggulir (lebar desktop) |
| Klik chip membuka dan menggulir | Lulus saat halaman terlihat: klik "Gambar & chart" -> `aria-expanded=true`, kontainer `main` menggulir ke 1928, judul kategori di 220 px (tepat di bawah toolbar, `scroll-margin-top` 220px). Saat panel peramban tersembunyi (`visibilityState=hidden`) peramban tidak menjalankan gulir; ini perilaku peramban, bukan cacat |
| Sub-kelompok berlabel, nesting berkurang | Lulus: mis. Tabel -> Garis, isian, dan kepala tabel (8), Baris sumber (1), Tabel spesifikasi (2), Tabel di file Word (4) |
| Galat konsol | 0 |
| Lebar 375 px (mobile) | Lulus: `document.scrollWidth` = 375 (tanpa gulir horizontal halaman), strip chip menggulir sendiri (`overflow-x: auto`, 1522/301 px), toolbar bertumpuk rapi, deskripsi membungkus |

Tangkapan layar diambil di panel peramban (desktop: panel lanjutan, kategori Tipografi terbuka, gulir chip Gambar & chart; mobile 375x812). Viewport dikembalikan ke desktop sesudah uji.
