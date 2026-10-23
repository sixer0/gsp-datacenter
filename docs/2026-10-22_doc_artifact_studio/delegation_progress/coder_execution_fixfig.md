# FIX-FIG coder-execution: lebar figur turunan (D-245 H1), tab R-30 (M1), aturan ukuran asli raster (K-2 D-242), grid diagram (D-252)

Status: complete (2026-10-23) setelah putusan D-257 (opsi b, lihat bagian D-257 di bawah); bagian K-2 300 dpi di bawah = riwayat sebelum putusan. Skills: receiving-code-review, dry-run-verify-fix.

## Berkas
- `services/compose/blocks.ts`: paksaan `widthMm === 166 ? 166 : 128` dihapus (chart :385, diagram :281); lebar turunan diteruskan apa adanya lewat cast terdokumentasi `specWidth` (tipe kontrak masih 128|166, permintaan ke pemilik kontrak); `figureWidthMm` tanpa cadangan literal 128 -> `BY_CONSTRUCTION_FAILED` (checkId FIGURE_WIDTH).
- `engine/chart/core/{guards,canvas,render,composite,index}.ts`: `figureLimits(params)` = `grid.allowedFigureWidthsMm` + `grid.textBlockHeightMm` (absen di templat -> bawaan registri, pola palet; tak terbaca -> BY_CONSTRUCTION_FAILED); G2/DATUM-33 penjaga spec, kanvas, lint, komposit membaca batas turunan; konstanta `MAX_FIGURE_HEIGHT_MM`/`CHART_MEASURES_MM` dihapus; `figureGrid(params)` (bentuk `DiagramGrid`) untuk pemanggil diagram.
- `engine/chart/family-g/flowchart.ts` (D-252): `validateSpec(..., { grid })` + `Sheet` kisi X turunan.
- `services/render/pure/chart.ts`: `compositeTemplateFor(docTpl)` = templat komposit bawaan + HANYA dua kunci batas figur dokumen (palet/lantai tetap bawaan D-134).
- `engine/symbols/{index,sheet-fit}.ts`: `SHEET_W/H`, `RL_WIDTH` dihapus; `SymbolSheetOptions.widthMm/heightMm` (bawaan registri `grid.fullSpanMm`/`grid.textBlockHeightMm`); tata letak HS/RL dihitung pada lebar nyata (kolom muat, bungkus catatan proporsional; A4 identik).
- `services/render/figures.ts`: lembar simbol lebar blok + blok teks efektif; diagram `grid: figureGrid(tpl.params)` (D-252).
- `engine/docx/figures/figure.ts`: `FIGURE_WIDTHS_MM`/`DEFAULT_MAX_HEIGHT_MM` -> turunan (`grid.allowedFigureWidthsMm`, `diagram.maxHeightMm`/`grid.textBlockHeightMm`; absen = BY_CONSTRUCTION_FAILED); K-2 untuk image snapshot v2. BARU `figures/raster-width.ts` (aturan K-2 bersama DOCX/HTML). `figures/derivation.ts`: cadangan kolom teks 128 -> BY_CONSTRUCTION_FAILED.
- `engine/docx/tables/{widths,guards,index}.ts`: `OK_WIDTHS_MM` -> `okWidthsMm()` turunan; G2 + `totalMm` bawaan dari lebar sah; `engine/lint/scan/index.ts` meneruskan `okWidthsMm` efektif.
- `engine/docx/package/parts.ts` (M1): pPr gaya Header/Footer dari R-30 `render.docx.headerFooterStyles` efektif (tab berskala bentang SR-60).
- `engine/html/tables/figure.ts`: K-2 untuk image v2; `symbolSheetSvg` dengan ukuran turunan + `symbol.sheet.fit` (sama dengan layanan).

## Bukti
- A4 v1: `render_cli.ts --doc doc.json --template template.json --formats docx` -> `53485ebc1eddd145…` (= baseline, byte-identik).
- A4 v2 (`doc.v2.json` tanpa medan `render`, sha 79290e07 = keluaran convert_v2 kini): 115 part, hanya `word/document.xml` beda dan hanya `wp:extent` 17 gambar raster (K-2); teks/XML lain identik setelah extent dibuang. Run resmi: 15 SVG figur mesin byte-identik dengan `fixb/official2` (chart, komposit, diagram ber-grid, lembar simbol); BM1 4544/4544.
- Probe kertas (scratch `probe_paper.ts`, A4/A5/Letter/F4 x kelas text/full): chart, diagram topology+flow, lembar simbol HS+fit, tabel G2, tab styles: FAIL 0. Contoh A5 full: chart/diagram/lembar 104 mm (akar SVG = blok, skala 1,00), lembar 104 x 160, huruf min chart 6,20 pt / diagram 5,90 pt >= 5,5 (DATUM-28), tab [2932, 5864] <= bentang 5896 tw. Letter 171,9 / F4 171 serupa.
- DOCX probe `render_cli` fixture v2 `doc_terbit_report` per kertas: extent figur = turunan (A5 104/66, Letter 171,9/133,9, F4 171/133), lembar simbol 104x160 / 171,9x229,4 / 171x280, log DATUM-31/33/P1-width/G2/BY_CONSTRUCTION = 0 di keempat kertas.
- Run resmi `run_benchmark.ts --schema v2 --official --doc <scratch doc.v2 sha 79290e07> --out benchmark/out/fixfig/official`: BM1 PASS 100 % (4544/4544); BM2 PASS halaman 100/102 (official2 101/102); BM3 FAIL 6/102 (sama); BM4 FAIL 0,7628 (official2 0,7864). Penurunan = K-2 (lihat Keputusan 1).
- `convert_v2.ts --check` x3: template.v2.json SAME 882057c5…, preset SAME d181efb1…, doc.v2.json DIFF 79290e07… (x3 deterministik) = hanya `render` dibuang D-247 (adapt-v1/index.ts 08:34, bukan baris ini; convert_v2 tidak mengimpor berkas FIX-FIG).
- `tsc --noEmit --incremental false` repo: 1 galat di `tests/unit/studio/structure/adapt-v1.test.ts:52` (medan `render` D-247, bukan baris ini); 0 di berkas FIX-FIG. eslint area: exit 0.
- vitest `tests/unit/studio`: 33 gagal / 1813 lulus (sebelum: 29/1736 pada himpunan uji lebih kecil); 14 gagal baru semuanya `api/ingest`, `api-structure/submit`, `structure/{adapt-v1,display-field}`, `renderers/asset-bytes` (fixture) = D-247/IP-63/SR-41 baris lain; 0 di figures/chart/symbols/docx.

## Lebar raster (K-2, resolusi templat = `render.png.dpi` R-25 = 300 dpi, toleransi rasterisasi DATUM-39)
- bm-fig-11: 140,04 mm (BM 128; v2 sebelumnya 166) -> selisih dikenal tetap (1654 px / 300 dpi).
- 8 raster lain (BM 166): bm-fig-28 94,74; bm-fig-32..36 97,20; bm-fig-37 94,57; bm-fig-39 94,91 mm (aset 1117-1148 px). Tidak dipaksa kembali.
- Pada dokumen v2 penuh (raster aset untuk diagram/lembar simbol, render_cli): 17 gambar menyusut; 5 pustaka chart 1960 px tetap 166 (toleransi).

## Keputusan untuk controller
1. K-2 resolusi: dipakai parameter ADA `render.png.dpi` (300, kelas K: dpi keluaran raster templat = defaultImageDpi Word Manual 000), tanpa parameter baru. Akibat: 8 raster BM bergeser 166 -> ~95-97 mm, halaman 101 -> 100, BM4 turun 0,024; bm-fig-11 tidak menjadi 128 pada dpi wajar mana pun (128 mm = 328 dpi). Alternatif: (a) pertahankan 300 dpi (aturan harfiah); (b) parameter lanjutan baru `image.rasterDpi` bawaan 150 (= lantai DATUM-39 raster) -> 9 raster tetap 166 (aturan inert pada BM), bm-fig-25 aset 657 px menjadi 111 mm; (c) nonaktif sampai user memilih.
2. K-2 hanya untuk snapshot `studio.norm/v2` (lebar dari kelas templat); dokumen v1 membawa `widthMm` eksplisit -> tidak disentuh (DOCX v1 tetap 53485ebc).
3. Mesin chart/simbol mandiri tanpa templat memakai bawaan REGISTRI (profil kanonik) bila kunci turunan absen, bukan literal; perakit DOCX (figure, derivation) melempar BY_CONSTRUCTION_FAILED bila parameter absen.
4. `cols` lembar simbol melebihi kolom yang muat pada lebar turunan dibatasi ke kolom muat (A4 = 6 = batas lama, perilaku tetap).
5. Perluasan area (diklaim): `services/render/figures.ts`, `services/render/pure/chart.ts`, `engine/chart/family-g/flowchart.ts`, `engine/lint/scan/index.ts` (satu baris G2).
6. Sisa: lembar simbol pada slot lanskap memakai blok teks tingkat dokumen (FigureStore dibangun dengan templat dokumen).

## Permintaan (file_requests.md, 4 baris FIX-FIG)
Pelebaran tipe/skema `widthMm`/`width_mm` kontrak; sisa cadangan literal di luar area (blocks/env, structure, primitives, tables/render, wrapper/render, html/device, lint/scan totalMm, lint/render 247); grid diagram di `artifact.ts` dan CLI `lib/render.ts:870`; regenerasi `doc.v2.json` (D-247).

## D-257 (putusan controller: opsi b) — `image.rasterDpi`
- `params/render.ts` BARU R-65 `image.rasterDpi` (int, bawaan 150 = lantai DATUM-39, rentang 72-600, kelas B, lapis advanced via `registry/essentials.ts`, cakupan document); `PARAMS_RENDER_COUNT` 43 -> 44; `params/index.ts` pin `RENDER_PARAM_COUNT` 44, total registri 780 -> 781. `raster-width.ts` membaca `image.rasterDpi` (bukan `render.png.dpi`).
- Probe `probe_k2.ts`: registri 781 = pin, id/kunci unik 781/781, R-65 bawaan 150 advanced 72-600; raster 600 px @150 dpi kelas 166 -> 101,6 mm; 1148 px -> 166; bm-fig-11 1654 px -> 166; `image.rasterDpi` 300 mengabaikan `render.png.dpi`: 600 px -> 50,8 mm. FAIL 0.
- A4 v1 DOCX `53485ebc…` tetap. v2 render_cli: hanya bm-fig-25 (aset 657 px) 166 -> 111,25 mm; sisa XML identik.
- Run resmi `benchmark/out/fixfig/official2` (doc tanpa `render`, sha 79290e07): BM1 PASS 100 % (4544/4544); BM2 PASS halaman 101/102; BM3 FAIL 6/102; BM4 FAIL 0,7864 (= fixb/official2). 9 raster: bm-fig-11 dan 8 lainnya (Gambar 4.1, 10.2, 10.6-10.11, 10.13) semua 166,00 mm; document.xml identik dengan fixb/official2 kecuali nama media (2 PNG berbeda beberapa byte dari SVG identik).
- bm-fig-11 = selisih dikenal (BM 128, v2 166). tsc: 0 galat di berkas FIX-FIG (repo 1, `adapt-v1.test.ts:52` D-247); eslint area 0. Grep `tests/unit/studio` untuk pin 780: 0 hit.

## D-259 — rasterisasi deterministik (SR-49 N4)
- Diagnosis: PNG berbeda bukan metadata/zlib (chunk sama: IHDR, pHYs, IDAT; IDAT terdekompresi beda) melainkan PIKSEL: 6 px +-1-2 (bm-fig-21, baris 295-296) dan 52-79 px pada satu glif (lembar simbol bm-fig-27/29). Eksperimen flag (`exp_flags.ts`, 10-12 tangkapan per varian): GPU = beda tiap tangkapan; `--disable-gpu` = tangkapan pertama beda; `--disable-gpu --num-raster-threads=1` stabil untuk komposit tetapi lembar simbol tetap bimodal; fon web tertanam juga tetap bimodal (bukan muat fon); `--disable-partial-raster`, `--disable-lcd-text`, `--disable-font-subpixel-positioning`, `--disable-skia-runtime-opts` tidak membantu. Penentu: tangkapan yang diambil segera sesudah `load` mengunci varian antialias; jeda sebelum tangkapan pertama menghilangkannya.
- Perbaikan: `engine/browser/runtime.ts` LAUNCH_ARGS + `--disable-gpu`, `--num-raster-threads=1` (bukan flag sandbox; uji `browser-chromium.test.ts` 7/7); `engine/browser/index.ts` `rasterizeSvg`: jeda 500 ms sebelum tangkapan pertama, lalu tangkap ulang tiap 150 ms sampai dua tangkapan identik byte (maks 12, selain itu RENDER_FAILED tercatat).
- Bukti: 15 SVG figur Manual 000 x5 tangkapan x3 proses = 225/225 identik, nilai sama antar proses. Run harness resmi Manual 000 v2 (doc tanpa `render`, tanpa PDF/compare) x3: DOCX `4ca75f016bb816ec` x3. Fixture v2 `doc_terbit_report` (chart, 2 diagram, lembar simbol) render_cli x3: `7f5f9c87856358b3` x3. DOCX v1 `53485ebc…` tetap (v1 tanpa PNG hasil rasterisasi). tsc repo 0; eslint `engine/browser` 0. PNG figur berubah sekali (deterministik) terhadap run sebelumnya karena jalur raster kini CPU.
- `render-twice.ts` di DB uji (SR-49, penulis tunggal DB uji) tidak dijalankan baris ini; SR-49 F5 diharapkan PASS ulang.
