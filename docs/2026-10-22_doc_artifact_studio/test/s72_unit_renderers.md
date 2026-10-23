# S72 Uji unit renderer DOCX, HTML, browser, soffice (test-expert)

Tanggal: 2026-10-23. Baris: S72 (fase final G3). Skills: tdd.
Status: needs-review: 135 lulus, 2 gagal. Kedua kegagalan adalah bug produksi (F1, F2). Ekspektasi tidak dilunakkan.

## 1. Strategi uji

- Seam yang diuji (ditetapkan brief controller): `assembleDocxDetailed`/`assembleDocx` (S20), `DOCX_RENDERERS` per jenis section (D01), `escapeXml`/`escapeXmlStrict`/`stripInvalidXmlChars` (`package/xml.ts`), paket fon DOCX keluaran, `assembleHtml`/`enforceStandalone` (S24), `docAssetBytes` (`engine/bind`), `rasterizeSvg`/`withPngDpi` (S25), `checkRenderEnvReadiness`/`convertDocxToPdf`/`safeBaseName` (S92), dan `render-env/manifest.json` serta `check_readiness.mjs` (S91, hanya baca).
- Sampel section: 4 fixture paritas S63 (`tests/parity/fixtures/doc/*.json`: NOTA memo, NOTA tabel, SERAH, TERBIT). Keempatnya bersama-sama memuat ke-29 jenis section DOCUMENT di registri. Hal ini dibuktikan oleh sebuah uji. Snapshot dibuat dengan `normalizeDocument` murni, dan templat kanonik serta profil benchmark di-resolve di memori. Uji ini tidak memakai DB, Prisma, maupun jaringan.
- Figur chart/diagram/lembar simbol memakai FigureStore stub (PNG 300 dpi sintetis, 166 x 60 mm). Jalur rasterisasi nyata diuji terpisah lewat Chromium.
- Ekspektasi bersumber independen. Pemeriksa XML 1.0, pembaca ZIP (local header APPNOTE), pembaca PNG/pHYs, pembaca tabel `name` OpenType, dan de-obfuscation odttf ECMA-376 ditulis ulang di `_kit.ts`, tidak memanggil kode produksi. Nilai literal yang dipakai: A4 = 11906 x 16838 twip, 36000 EMU/mm, 11811 px/m = 300 dpi, sha256 `e9d08818...` dari D-112. Pemeriksa XML juga punya kontrol negatif.
- Hal yang dikecualikan beserta alasannya:
  - Fidelitas visual PDF (SSIM/teks): wilayah S98/S76-S79.
  - Chart/diagram/simbol: wilayah S73.
  - Token/bind/lint: wilayah S71.
  - Layanan render S51 dan DB: brief menyatakan tanpa DB.
  - `measureLayout`/`previewHtml`: di luar daftar lingkup brief.
- Runner: vitest 4.1.11 (`vitest.config.ts`, `fileParallelism: false`, alias `@` = `src`). Tidak ada konfigurasi coverage di repo.
- Lingkungan smoke: `STUDIO_WORKSPACE_ROOT=C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/s72/ws`, `STUDIO_SOFFICE_MAX_INSTANCES=1`, `STUDIO_SOFFICE_TIMEOUT_MS=180000`. Env dikembalikan di `afterAll`.

## 2. Berkas uji

| Berkas | Isi | Uji | Lulus | Gagal |
|---|---|---|---|---|
| `tests/unit/studio/renderers/_kit.ts` | alat bersama (bukan suite) | - | - | - |
| `docx-sections.test.ts` | cakupan registri 29/29, OPC, sectPr A4, docPr, fragmen per jenis section, tabel tblGrid, figur EMU, teks | 52 | 52 | 0 |
| `docx-determinism.test.ts` | sha256 dua render, mtime ZIP = issueDate, jangkar D-112 | 10 | 10 | 0 |
| `docx-xml-escape.test.ts` | escape paket dan ketat, surrogate, C0, satu sumber escape, payload injeksi ujung-ke-ujung | 11 | 11 | 0 |
| `docx-fonts-embedded.test.ts` | odttf -> sfnt, nameID 1/16 = `w:font`, 4 slot Sans Cond benchmark, slot sesuai gaya run | 9 | 8 | 1 (F1) |
| `html-css-csp.test.ts` | sha256 dua render, CSP, tanpa skrip/URL eksternal, token `:root`, geometri A4, escape, `enforceStandalone` | 22 | 21 | 1 (F2) |
| `asset-bytes.test.ts` | urutan assetBytes -> dataBase64, galat lookup, hanya-assetBytes = dataBase64 (DOCX/HTML sha256), integritas sha256 | 12 | 12 | 0 |
| `soffice-render-env.test.ts` | manifest S91, readiness engine = skrip S91, validasi masukan, smoke PDF, HKCU tidak berubah | 14 | 14 | 0 |
| `browser-chromium.test.ts` | pHYs 300 dpi, ukuran D-94, determinisme PNG, tolak non-SVG, offline | 7 | 7 | 0 |
| Total | | 137 | 135 | 2 |

Tidak ada uji yang dilewati. soffice tersedia dan render-env siap. playwright-core 1.62.1 terpasang dan Chromium 1234 tersedia.

## 3. Inventaris kasus (ringkas per kelompok)

| Kasus | Kategori | Masukan | Harapan | Aktual | Status |
|---|---|---|---|---|---|
| 29 section DOCUMENT tercakup fixture | cakupan | 4 fixture | 0 jenis hilang; `dispatchCoverage()` kosong | sesuai | PASS |
| Paket OPC | struktur | 4 DOCX | semua bagian berisi XML yang rapi; setiap bagian punya tipe isi; setiap relasi menunjuk bagian yang ada | sesuai | PASS |
| sectPr | struktur | 4 DOCX | jumlah sectPr = jumlah unit; pgSz 11906 x 16838; header/footer ada | sesuai | PASS |
| Fragmen 30 jenis (29 + device) | struktur | 1 fragmen per blok | XML rapi, tanpa `w:sectPr`/`w:body`, penanda wajib (mis. `w:outlineLvl`, `w:tbl`, `wp:inline`) ada | sesuai | PASS |
| Tabel keluarga (11 jenis) | batas | semua tabel | jumlah sel per baris (dengan gridSpan) = jumlah gridCol; lebar grid <= 166 mm | sesuai | PASS |
| Figur | batas | chart/diagram/symbolSheet | `cx` = widthMm x 36000; `cy` mengikuti rasio | sesuai | PASS |
| Determinisme DOCX | determinisme | render 2x per fixture | sha256 sama; tanggal DOS = issueDate; `[Content_Types].xml` entri pertama | sesuai | PASS |
| Jangkar D-112 | regresi | fixture tabel | sha256 diawali `e9d08818` | `e9d08818...` | PASS |
| Escape paket dan ketat | validasi | `& < > " '`, C0, FFFE/FFFF, surrogate tunggal/pasangan | sesuai kontrak D-110/D-112 | sesuai | PASS |
| Satu sumber escape | regresi | scan `engine/docx/**` | hanya `package/xml.ts` | sesuai | PASS |
| Payload injeksi DOCX | adversarial | `</w:t>...<script>` + C0 + surrogate di paragraf dan judul | XML rapi, teks kembali persis, `dc:title` bersih | sesuai | PASS |
| Nama keluarga fon tertanam | fon | profil kanonik + benchmark | nameID 1/16 = `w:font/@w:name` di semua slot | sesuai | PASS |
| Sans Cond benchmark 4 slot | fon | profil benchmark | 4 slot, keluarga "IBM Plex Sans Cond" | sesuai | PASS |
| Slot fon sesuai gaya run | fon | profil kanonik | setiap keluarga+gaya yang dipakai run (w:b/w:i) punya slot tertanam | `IBM Plex Sans Condensed: w:embedBold` hilang | FAIL (F1) |
| Determinisme HTML | determinisme | render 2x per fixture | sha256 sama | sesuai | PASS |
| CSP / mandiri | keamanan | 4 HTML | meta CSP tunggal = `STUDIO_HTML_CSP` di awal head; tanpa script/iframe/link/on*; src/href/url hanya data: atau #; @font-face data: | sesuai | PASS |
| Token `:root` | CSS | kanonik | setiap `color.interior/wrapper/brief.*` -> var bernilai heks; 24+128+6+32+20 = 210 mm; 128+6+32 = 166 mm; override warna tercermin | sesuai | PASS |
| Payload injeksi HTML | adversarial | `<script>`, `onerror`, kutip, C0 di paragraf/judul/penulis | tanpa tag/atribut baru; tanpa C0 | kendali C0 lolos di `<title>` | FAIL (F2) |
| `enforceStandalone` | keamanan | HTML kotor (5 jenis) dan bersih | 5 jenis pelanggaran dinetralkan; HTML bersih tidak diubah | sesuai | PASS |
| `docAssetBytes` | resolusi | 7 kasus unit | urutan, warn `ASSET_BYTES_LOOKUP_FAILED`, `invalidBase64`, tanpa sha256 tidak memanggil assetBytes | sesuai | PASS |
| Hanya-assetBytes | resolusi | SERAH (logo + denah) | sha256 DOCX dan HTML identik dengan render dataBase64; byte media = aset | sesuai | PASS |
| Integritas aset | keamanan | byte salah untuk sha256 | `BY_CONSTRUCTION_FAILED` (logo dan denah) | sesuai | PASS |
| Manifest S91 | render-env | `render-env/manifest.json` | skema v1, soffice 24.2.3.2, entri fon sah, sha256 fon terpasang cocok | sesuai | PASS |
| Readiness engine vs skrip S91 | render-env | `--skip-session` | versi, manifestSha256, status per fon sama | sesuai | PASS |
| Validasi konversi | validasi | non-ZIP; jobId `../keluar`, `a/b`, spasi, kosong, 101 karakter | `PDF_CONVERT_FAILED` / `PATH_OUTSIDE_ROOT` tanpa spawn | sesuai | PASS |
| Smoke PDF | integrasi | fixture tabel, 1 instans | `%PDF-`, > 1 KB, halaman >= 1, `/BaseFont /XXXXXX+IBMPlex`, folder job bersih | sesuai (4.982 ms) | PASS |
| HKCU | larangan | `reg query HKCU\...\Fonts` sebelum/sesudah | identik | identik | PASS |
| Chromium | browser | SVG 128 x 40 mm | pHYs 11811; ukuran +-(1 px CSS + 1); deterministik; non-SVG INPUT_INVALID; offline | sesuai | PASS |

## 4. Kegagalan = bug produksi (dipetakan ke pemilik)

F1: profil kanonik tidak menanam wajah tebal untuk keluarga condensed yang benar-benar dipakai teks.
- Bukti: `docx-fonts-embedded.test.ts:134` menerima `["IBM Plex Sans Condensed: w:embedBold"]`. Probe 4 fixture menunjukkan 365 run `IBM Plex Sans Condensed` tebal. Rencana fon hanya menanam regular dan italic untuk keluarga ini; bold dan boldItalic dilewati dengan alasan "wajah slot tidak tersedia".
- Sebab:
  - `src/lib/studio/params/color-type.ts:127` menetapkan `type.face.condensed` = "IBM Plex Sans Condensed".
  - `src/lib/studio/params/render.ts:74` mengisi R-08 dengan keluarga "IBM Plex Sans Cond".
  - Wajah SemiBold kanonik bernama "IBM Plex Sans Condensed SemiBold" tanpa nameID 16, sehingga `pickFace` tidak menemukan kandidat.
  - Tabel relabel `src/lib/studio/engine/docx/fonts/relabel.ts:97-122` hanya mencakup "IBM Plex Sans Cond". Akibatnya slot dilewati di `src/lib/studio/engine/docx/fonts/plan.ts:305`.
- Akibat: teks tebal condensed pada profil kanonik dirender dengan fon terpasang di mesin. Ini bertentangan dengan pernyataan D-109 bahwa profil kanonik memakai SemiBold tertanam dan dokumen mandiri dari fon terpasang. Profil benchmark tidak terdampak.
- Pemilik: area `engine/docx/fonts/**` (S15, terakhir INT-S), bersama pemilik parameter (S04-S08 untuk `color-type.ts`; pemilik `render.ts`). Controller memutuskan mana yang menyelaraskan nama keluarga.

F2: escape HTML dasar tidak membuang kendali C0.
- Bukti: `html-css-csp.test.ts:135` menemukan `ctl\u0001\b\u000b\u001fend</title>`.
- Sebab: `src/lib/studio/engine/html/base/markup.ts:19-20` `esc` hanya meng-escape `& < > " '`. Escape ini dipakai `src/lib/studio/engine/html/base/shell.ts:298` (`<title>`) dan `:290-293` (meta). Bandingkan dengan `engine/html/blocks/escape.ts:21`, yang membuang C0 sesuai kebijakan S22.
- Keterjangkauan: skema `contract/schema/doc.schema.ts:176` (`title`, maxLength 300) tidak membatasi karakter kendali, jadi masukan seperti ini lolos ingest.
- Dampak: rendah, karena tidak ada injeksi markup (teks tetap ter-escape). Namun dua sumber escape HTML berperilaku berbeda.
- Pemilik: S21 (`engine/html/base`).

## 5. Analisis cakupan dan celah

- Repo tidak punya alat coverage, jadi tidak ada angka coverage.
- Cakupan fungsional:
  - 29/29 jenis section DOCUMENT dirender DOCX dan diperiksa strukturnya.
  - HTML dirakit dari keempat fixture.
  - PAGE_DEVICE diuji tidak langsung: running head dan register lewat header/footer, `device` lewat fragmen.
- Celah dan remediasinya:
  - Fidelitas PDF per halaman: S98.
  - `measureLayout`/`previewHtml`: belum diuji, kandidat S75.
  - Struktur HTML per jenis section: hanya diperiksa lewat perakitan penuh dan determinisme, belum ada penanda per jenis.
  - Profil kanonik tanpa aset Datum Rule (`rule128`/`rule166`): setiap render mencatat warn FILE_NOT_FOUND lalu memakai garis bangkitan. Ini sudah diterima di D-101 dan tidak diuji sebagai galat.

## 6. Cara menjalankan

```
cd C:\Users\TRIAL\gsp-swarm-hq-v2.1
npx vitest run tests/unit/studio/renderers
npx vitest run tests/unit/studio/renderers --reporter=verbose   # per kasus
```

Keluaran segar, run kedua (dikutip dari `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/s72/run_final2.txt`):

```
 ❯ tests/unit/studio/renderers/html-css-csp.test.ts (22 tests | 1 failed) 859ms
 ❯ tests/unit/studio/renderers/docx-fonts-embedded.test.ts (9 tests | 1 failed) 462ms
 FAIL  ... docx-fonts-embedded.test.ts > fon tertanam DOCX, profil kanonik > setiap kombinasi keluarga+gaya yang dipakai run (w:b/w:i) punya slot tertanam yang sesuai, untuk keluarga yang ditanam
+   "IBM Plex Sans Condensed: w:embedBold",
 FAIL  ... html-css-csp.test.ts > escape HTML masukan adversarial > payload di paragraf, judul dan nomor dokumen ter-escape; tidak ada tag/atribut baru; kendali C0 dibuang
+   "\"&quot;x&quot; &#39; &amp; &lt;/p&gt; ctl\\u0001\\b\\u000b\\u001fend</title>\"",
 Test Files  2 failed | 6 passed (8)
      Tests  2 failed | 135 passed (137)
   Duration  17.12s
```

Run pertama dengan `--reporter=verbose` (`run_final.txt`) memberi hasil yang sama: 135 lulus, 2 gagal, 16,80 s. Smoke PDF selesai dalam 4.982 ms.

## 7. Catatan CI

- Tidak ada uji flaky yang teramati dalam 2 run berturut-turut dengan hasil identik.
- Suite bergantung pada Windows untuk dua hal, dan keduanya dilewati dengan alasan tercetak bila tidak tersedia:
  - soffice 24.2.3.2 dan fon HKCU untuk smoke PDF (`ctx.skip` dengan `readiness.errors`);
  - `reg.exe` untuk cek HKCU.
- Chromium dilewati bila playwright-core atau binernya tidak ada.
- Waktu total sekitar 17 s. soffice dibatasi 1 instans dan timeout 180 s.
- Peringatan Vite `configLoader: 'native'` berasal dari `vitest.config.ts` dan tidak memengaruhi hasil.

## 8. Batasan dan rekomendasi

- Batasan:
  - FigureStore stub menguji tata letak figur, bukan isi chart.
  - Jangkar sha256 `e9d08818` hanya berlaku untuk fixture tabel (tanpa figur) dengan templat kanonik dan aset kanonik saat ini. Bila aset fon berubah, jangkar perlu diperbarui lewat keputusan controller.
  - `tsc`/`eslint` tidak dijalankan karena brief hanya mengizinkan `npx vitest run tests/unit/studio/renderers`.
- Rekomendasi:
  1. Perbaiki F1 dengan menyelaraskan keluarga condensed kanonik dan menambah relabel atau R-08 untuk keluarga yang dipakai, lalu jalankan ulang `docx-fonts-embedded.test.ts`.
  2. Perbaiki F2 dengan membuat `markup.ts` `esc` memakai `escapeHtml` S22 atau membuang C0.
  3. Pertimbangkan `pattern` tanpa kendali C0 di `doc.schema.ts` untuk medan meta.
- Pengamatan (bukan kegagalan):
  - `textPlain` hasil normalisasi S48 masih memuat penanda md-lite `**` (teks cari).
  - Ada proses Chromium Playwright yang hidup dari proses tsx lain, bukan dari S72: induk PID 2172 `scratchpad/intu_verify.ts` dan PID 25072 `prisma/seed-studio.ts`. Uji S72 menutup browser-nya di `afterAll`.

Berkas yang ditulis: `tests/unit/studio/renderers/{_kit.ts, docx-sections, docx-determinism, docx-xml-escape, docx-fonts-embedded, html-css-csp, asset-bytes, soffice-render-env, browser-chromium}.test.ts`, laporan ini, dan satu blok klaim aditif di `delegation_progress/file_claims.md`. Kode produksi tidak diubah.
