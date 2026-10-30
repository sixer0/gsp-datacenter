---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: FIX-H8
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/decisions/decisions.md (D-321, D-322)
status: needs-review
---

# FIX-H8: nama/alt figur dari caption + tinggi minimum chart batang sedikit kategori

Skill: accessibility-review (WCAG 1.1.1 teks alternatif), dry-run-verify-fix. Klaim: baris `FIX-H8` di `file_claims.md`.
Semua penulisan lewat berkas sementara `.fixh8tmp` lalu `mv`, kecuali tiga suntingan kecil lewat alat Edit (alt-text.ts `stripSourceLabel`, dua baris figure.ts); 0 sisa `.fixh8tmp`.
Status `needs-review` karena dua hal di luar area (bagian Lanjutan), bukan karena verifikasi gagal.

## Perubahan

| Berkas | Jenis | Isi |
|---|---|---|
| `src/lib/studio/engine/docx/figures/alt-text.ts` | baru | Modul murni `figureAltText`: `name` = `title` = "<label> — <caption>" dipendekkan di batas kata (maks 80 karakter, elipsis); `descr` = label + caption utuh + "Sumber: <sumber>" (EN: "Source:"). Caption kosong menghasilkan subjek dari jenis figur: "Grafik P-01", "Diagram", "Gambar <berkas>" (kunci sha disembunyikan), "Lembar simbol HS". Figur berlembar banyak diberi akhiran "(lembar i/n)". `stripSourceLabel` membuang label SUMBER di depan |
| `src/lib/studio/engine/docx/figures/figure.ts` | ubah | `renderFigure`: `wp:docPr` diisi `figureAltText` per lembar, tidak lagi "Picture n" |
| `src/lib/studio/engine/docx/figures/ooxml.ts` | ubah | `InlineDrawing.title` ditambahkan dan diserialkan sebagai `wp:docPr/@title` |
| `src/lib/studio/engine/docx/figures/index.ts` | ubah | Ekspor alt-text |
| `src/lib/studio/engine/html/tables/figure.ts` | ubah (hanya alt/aria) | `alt` pada `img` dan `aria-label` pada SVG = `descr` yang sama dengan DOCX (satu sumber); lembar simbol per lembar |
| `src/lib/studio/engine/chart/core/datum.ts` | ubah | Aturan tinggi minimum keluarga batang (lihat di bawah); `dcHeightMm` = rumus DC tanpa batas bawah |
| `src/lib/studio/engine/chart/core/families.ts` | ubah | Gaya datum memakai `datumHeightMm` (dengan batas bawah); gaya gallery tetap `spec.heightMm ?? dcHeightMm` |
| `src/lib/studio/engine/chart/core/index.ts` | ubah | Ekspor `barRows`, `BAR_MIN_BODY_MM`, `BAR_MAX_THICK_MM`, `DC_BAR_ROWS`, `dcHeightMm` |
| `tests/unit/studio/figures/fixh8-figure-alt.test.ts` | baru | 7 uji: modul murni (pemendekan, cadangan per jenis, EN, lembar) + render DOCX/HTML fixture `doc_terbit_report` |
| `tests/unit/studio/figures/fixh8-chart-min-height.test.ts` | baru | 7 uji: ambang, n>=4 = DC, n=1/2/3, P-11, kolom/gallery tetap, panel komposit pendek tanpa luapan |

`services/render/figures.ts` tidak perlu diubah.

## Aturan tinggi minimum chart (P-01 bar, P-11 threshold, gaya datum)

- DC `tinggi()` = `n x 7,2 + 6` mm dan tidak punya batas bawah. Pada kasus Hermes (2 batang) hasilnya 20,4 mm pada lebar 128 mm.
- Badan minimum `BAR_MIN_BODY_MM` = 32 mm. Angka ini sama dengan `PANEL_DEFAULT_PLOT_MM` Manual 000 (tinggi plot panel Gambar 8.1); kesamaan dijaga uji karena konstanta tidak diimpor (menghindari siklus impor).
- Aturan hanya aktif bila `n x 7,2 + 6 < 32`, artinya n <= 3. Jarak antarbaris menjadi `26/n`. Tebal batang mengikuti rasio token DC (4,4/7,2) dengan batas 2 x 4,4 = 8,8 mm, dan batang ditaruh di tengah slot. Garis dasar label = tengah batang + selisih yang sama dengan DC.
- Pita tambahan tetap: catatan +6, threshold +5, aparatus figure +22.
- REPORT `BAR_MIN_HEIGHT` dicatat di laporan chart.
- Pita diperbesar hanya bila kanvas memang setinggi itu. Panel komposit yang lebih pendek tetap memakai geometri DC, jadi tidak ada luapan.
- Tidak berubah: n >= 4 (rumus DC persis), kolom P-02/W-02 (badan tetap 46 mm), dan gaya gallery.
- Kasus Hermes sesudah perubahan: 128 x 32 mm, jarak 13,00 mm, tebal 7,94 mm. Tangkapan raster diperiksa; label tegak di tengah batang.

Dampak terhadap harness: tidak ada fixture chart paritas, fixture lint, atau spec Manual 000 yang memuat P-01/P-11 dengan n <= 3 (dipindai: `tests/parity/fixtures/chart`, `tests/parity/out/s79/lint_fixtures`, `benchmark/manual000/figures/specs`). bm-fig-17..21 semuanya komposit gallery.

## Bukti

| Cek | Perintah | Hasil |
|---|---|---|
| Sapuan paritas chart | `npx tsx scripts/parity/run/run_parity.ts --fixtures tests/parity/fixtures --out tests/parity/out/fixh8/chart --only "chart/**" --formats svg,png` | `{"DIAGNOSIS":46}` exit 0, sama dengan FIX-H `chart_final` (sebelum). Vonis per fixture: diff baris kosong. SVG Node 46/46 byte-identik dengan `fixh/chart_final` (sha P-01 `3adf00c0f954b25c`, P-11 `df15876e55edfc58`) |
| Manual 000 v2 sebelum/sesudah, host sama | Worktree bersih HEAD `904f992` (`run_benchmark.ts --schema v2 --official`), lalu worktree + 8 berkas FIX-H8 saja | DOCX sebelum `091fe912f37870ae…`, sesudah `09f42b0f9501aeee8ed2611342c2c0b15772926d2c6d78be2a7daa93397b9bd3`. Diff: 115/115 part, urutan sama, hanya `word/document.xml` berbeda; identik setelah atribut name/descr/title `wp:docPr` dinetralkan; 24/52 docPr berubah; teks `w:t` identik (184.429 karakter); BM1 PASS 4544/4544 di kedua run. Run repo utama = `09f42b0f…` (sama) |
| Selisih terhadap official3 `952f65d6…` | Pembanding docPr terhadap `tests/parity/out/fix2/official_c2` | Selain docPr, 15 PNG figur mesin berbeda, padahal SVG figur 15/15 byte-identik. HEAD bersih tanpa FIX-H8 juga menghasilkan `091fe912` != `952f65d6`. Hipotesis: rasterisasi Chromium memakai fon cadangan karena 17 fon per-pengguna belum dimuat sesi Windows (render-env `ready=false`, "sign in again", C1/D-322). Bukan akibat FIX-H8 |
| BM2-BM4 | idem | NOT-RUN: `pdf:NOT_READY` (render-env), sama di sebelum/sesudah. Perubahan hanya pada atribut `wp:docPr`, tidak menyentuh unit, halaman, atau visual |
| Unit studio | `npx vitest run tests/unit/studio` | 77 berkas lulus, 2155 uji lulus, 1 dilewati. 1 berkas gagal: `zz-fixh4-probe.test.ts` milik FIX-H4, berkas transien yang hilang di tengah run ("No test files found"). Run sebelumnya: 2134 lulus, 1 berkas gagal `import/md-v1.test.ts` (FIX-H7 sebelum modulnya ada) |
| Figur | `npx vitest run tests/unit/studio/figures` | 11 berkas, 393/393 lulus |
| tsc | `npx tsc --noEmit -p tsconfig.json` | exit 0 |
| eslint area | `npx eslint src/lib/studio/engine/docx/figures src/lib/studio/engine/chart/core src/lib/studio/engine/html/tables/figure.ts tests/unit/studio/figures/fixh8-*.test.ts` | exit 0 |

Keluaran (gitignore): `tests/parity/out/fixh8/**`, `benchmark/out/fixh8/**` (`wt/before`, `wt/after`, `official`). Worktree sementara `Temp/fixh8_wt` sudah dihapus (junction node_modules dilepas lebih dulu; node_modules utama utuh, 452 entri).

## Persistent Issues

| Isu | Percobaan | Akar | Status | Memblokir? |
|---|---|---|---|---|
| Sha official3 + docPr tidak dapat direproduksi di host ini | 1 (bukti worktree) | Raster PNG figur bergantung pada fon sesi Windows (render-env) | Ulangi `run_benchmark.ts --schema v2 --official` setelah USER keluar-masuk sesi; harapannya = official3 kecuali `wp:docPr` 24 objek | Tidak untuk kode, ya untuk sha final |
| Benchmark v1 (`--schema v1`) gagal di sebelum DAN sesudah | 1 | "3 figur mesin gagal dirender tanpa pengganti", pra-ada (v1 `53485ebc` tidak dapat dibandingkan sekarang) | Dicatat | Tidak |

## Issues & Decisions

| Langkah | Isu / keputusan | Resolusi |
|---|---|---|
| Alt | 28/52 `wp:docPr` Manual 000 dan "Picture 1, 2, 3, 5" pada DOCX Hermes adalah gambar aparatus non-figur (logo sampul, Datum Rule bab, pita) dari `engine/docx/blocks/media.ts:118` dan `engine/docx/wrapper/media.ts:328`. Itu di luar area; FIX-H4 sedang menyunting `engine/docx/blocks`/`wrapper` | needs-review: baris lanjutan menandai gambar dekoratif (`descr=""` + ekstensi `a16:decorative`/`adec:decorative`, atau nama bermakna "Logo", "Datum Rule"). `assemble/media.ts:148` hanya menomori ulang nama "Picture N", sehingga nama baru tidak tersentuh |
| Alt | Pemisah "—" (em dash) mengikuti contoh brief | Bila kebijakan em dash melarang, cukup ubah `FIGURE_NAME_SEPARATOR` |
| Chart | Ambang 32 mm diturunkan dari acuan Manual 000 (plot panel Gambar 8.1), bukan angka baru; tebal maks 2 x token | Penyimpangan dari Python hanya untuk n <= 3; tidak ada kasus itu di harness; dijelaskan di komentar `datum.ts` |
| Chart | Pengamatan pra-ada: label kategori panjang terpotong di kiri (kolom label DC tetap `kiri = 22 mm`), terlihat pada label Hermes | Di luar lingkup H8 (paritas DC); kandidat backlog |

## Lanjutan

- Controller: putuskan pemilik untuk penandaan gambar dekoratif (blocks/wrapper media).
- Setelah render-env sehat: run resmi Manual 000 untuk sha final dan BM2-BM4.
- Review direkomendasikan (alt-text.ts, datum.ts).
