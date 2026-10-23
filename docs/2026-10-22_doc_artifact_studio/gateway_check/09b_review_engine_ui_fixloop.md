# SR-56b — Review ulang siklus perbaikan: mesin, UI, benchmark, CLI

- Baris: SR-56b (D-275); peninjau: senior-code-reviewer; skill: code-review-senior. REVIEW-ONLY: kode produksi tidak diubah. Siklus 1 tetap utuh di `gateway_check/09_review_structural_engine_ui.md`.
- Tanggal: 2026-10-23. Diff terhadap HEAD. Catatan yang dibaca: `coder_execution_{fixfig,fixb,fixa,fixc,fixu,fixl,fixx,fixw,fixv,fixy}.md` (bagian relevan) serta keputusan D-245, D-251, D-252, D-254, D-257, D-259, D-263, D-265, D-268, D-269, D-271, D-272, D-274, D-275.
- Cakupan: FIX-FIG (`compose/blocks.ts`, `engine/chart/core/**`, `engine/symbols/**`, `engine/docx/figures/**` termasuk `raster-width.ts`, `engine/docx/tables/{widths,guards}.ts`, `engine/docx/package/parts.ts`, `engine/html/**`, `engine/browser/{runtime,index}.ts`, `services/render/figures.ts`, R-65); FIX-B (`engine/diagram/**`, `benchmark/harness/run/lib/{inputs,pipeline}.ts`); FIX-A (`registry/charts.ts` + 3 pembaca chart); FIX-C (`scripts/parity/run/lib/render.ts`); FIX-U (rel, labels, `scripts/studio/glossary-check.ts`, penghapusan 18 berkas D-251); FIX-L (`engine/lint/**`); FIX-X (literal HTML); harness paritas SR-40/41.

## 1. Bukti segar

| Pemeriksaan | Perintah | Keluaran |
|---|---|---|
| tsc seluruh repo | `npx tsc --noEmit -p .` | exit 0 |
| eslint area siklus | `npx eslint src/lib/studio/engine src/lib/studio/services/compose/blocks.ts src/lib/studio/services/render/figures.ts src/lib/studio/services/render/pure src/components/studio src/app/studio scripts/studio scripts/parity/run benchmark/harness/run` | exit 0 |
| Suite figur + renderer | `npx vitest run tests/unit/studio/figures tests/unit/studio/renderers` | 14 berkas, 501/501 lulus |
| Selftest pembanding paritas | `python -I scripts/parity/compare/selftest_compare.py` | 28/28 lulus (termasuk `f056_pd_embedded_fonts_mismatch_is_diagnosis`) |
| Glosarium (gerbang A2) | `npx tsx scripts/studio/glossary-check.ts` | `files=125 texts_checked=2171 HITS_MAIN=0 excluded_infoteknis=5 excluded_admin=43`, exit 0 |
| Probe H1 ulang (scratch, baca-saja) | `npx tsx <scratchpad>/probe/paper2.ts`: `resolveParams` + `page.size` + `*.widthClass`, lalu `figureWidthMm` → `renderChart` (fixture `p01`), `buildDiagramSvg` + `figureGrid` (fixture `dg_flow`), `symbolSheetFigures` (iec) | Lebar akar SVG = lebar turunan pada semua 8 kombinasi, tanpa galat. A4 text/full: 128/166, lembar simbol 128x247 dan 166x247. A5: 66/104, lembar x160. Letter: 133,9/171,9, lembar x229,4. F4: 133/171, lembar x280. Siklus 1 menggambar spec chart pada 128 untuk semua kertas non-A4 |
| Literal A4 tersisa | `grep -rnE "\b(128\|166\|247)\b"` di area FIX-FIG/FIX-X (kecuali komentar) | Literal pemakaian hanya di `engine/diagram/core/tokens.ts:68-69,108` (grid A4 bawaan), `services/render/figures.ts:138` (`blockWidth ?? 128`), dan label perangkat `html/blocks/wrapper.ts:199,277` ("Datum Rule 166 mm", nama BM). `GRID_FALLBACK` HTML (`html/base/params.ts:66-73`) tinggal margin masukan, tidak lagi turunan kertas |

## 2. Vonis

**Keseluruhan: APPROVED WITH COMMENTS.** Dari 16 temuan siklus 1, 12 tertutup, 1 sebagian, dan 3 masih terbuka (M7 dokumen, L2, L6; ketiganya tidak ditugaskan ke siklus ini). Ada 9 temuan baru: 1 Medium, 8 Low. Tidak ada High maupun FAIL. H1 (ukuran kertas pada jalur figur) **TERTUTUP** dengan bukti probe.

| Domain | Vonis | Catatan |
|---|---|---|
| Structure | CAUTION | M3b sisa, N1 |
| Dependency Impact | PASS | H1, M2 tertutup; probe 8/8 |
| Duplication | PASS | L6 (Low) masih terbuka |
| Maintainability | CAUTION | N5, N6, N8 |
| Reference Integrity | CAUTION | N3 (Medium), M7, L2, N2 |

## 3. Status temuan siklus 1

| # | Tingkat asal | Status | Bukti | Pemilik |
|---|---|---|---|---|
| H1 ukuran kertas jalur figur | High | **TERTUTUP** | Clamp compose hilang: `compose/blocks.ts:100-111` (lebar turunan; absen → `BY_CONSTRUCTION_FAILED`), `:271` (`width_mm: widthMm`). Chart memakai `figureLimits(tpl.params)` (`chart/core/guards.ts:56-71`, `canvas.ts:48-52`, `render.ts:44,57`, `composite.ts:132`), komposit diberi batas dokumen (`services/render/pure/chart.ts:27-33`). Diagram memakai grid turunan di ketiga pemanggil produksi (`render/figures.ts:189`, `render/artifact.ts:189,391`). Lembar simbol: lebar blok + `grid.textBlockHeightMm` (`render/figures.ts:122-140`). DOCX: `allowedFigureWidths`/`maxFigureHeight` turunan (`docx/figures/figure.ts:76-97,343-345`). G2 tabel: `okWidthsMm` turunan (`tables/widths.ts:18-32`, diteruskan `lint/scan/index.ts:122-127`). Probe §1 8/8 | FIX-FIG, FIX-B, FIX-W, FIX-X |
| M1 tab Header/Footer | Medium | **TERTUTUP** | `docx/package/parts.ts:35-60,198-203` membaca R-30 efektif (yang diskalakan SR-60), registri sebagai bawaan, tidak terbaca → `BY_CONSTRUCTION_FAILED`; `val` di-escape | FIX-FIG |
| M2 CLI tanpa `slotParams` | Medium | **TERTUTUP** | `scripts/parity/run/lib/render.ts:75,80` impor statis bertipe (seam dinamis terhapus), `:700-716` `resolveSkeletonSlots` murni berlapis, `:767-768,805` `composeV2({ ..., slotParams })` | FIX-C |
| M3 benchmark v2 kerangka + orkestrasi | Medium | **SEBAGIAN** | (a) TERTUTUP: `pipeline.ts:230` meneruskan `skeleton`; `services/ingest/v2.ts:262` mengembalikan `slotParams` murni pada jalur kerangka eksplisit (FIX-Y). (b) TERBUKA (diturunkan ke Low): pipeline masih merakit sendiri lewat `assembleDocx` (`pipeline.ts:570-592`), bukan `services/render/pure.renderSnapshot` yang kini dipakai CLI (sisa S86 R04) | SR-34 → siklus berikut |
| M4 IP-57 adaptor rel | Medium | **TERTUTUP** | `toRailSummary` di penampil terhapus (`doc-model.ts:197`). Rel membaca `chapters` kontrak; medan `content` dihapus. Sisa berkas identitas tanpa pemakai → N5 | FIX-U |
| M5 pratinjau templat v1 | Medium | **TERTUTUP** | `template-editor.tsx:666-672` meneruskan `draftTemplate`; `template-preview/index.tsx:164-172` + `api.ts:121-124` mengirim `studio.doc/v2` contoh + draf templat ke R08 (FIX-V). Jalur v1 tetap hanya sebagai cadangan bila kerangka belum terbaca; `draftOverrides` @deprecated di kontrak (FIX-Y) | FIX-U, FIX-V, FIX-Y |
| M6 IP-59 axis P-13/P-14/S-01 | Medium | **TERTUTUP** | ParamDef di `registry/charts.ts:613-640`; pembaca kunci penuh lalu petunjuk di `family-p2/quadrant.ts:93`, `family-p2/arrow.ts:68`, `family-s1/common.ts:157-158`. Kode saudara yang belum dicakup → N3 | FIX-A |
| M7 IP-65 dokumen target R04 | Medium | TERBUKA | `docs/STUDIO-AGENT-GUIDE.md:125-127` masih "Kiriman bab dan slot memilih dokumen lewat `target`"; `docs/API-REFERENCE.md:305` (R04 POST) tanpa `target`/`SCOPE_CONFLICT`. Dijadwalkan DOC-2 (D-275) | IP-65 / DOC-2 |
| L1 IP-56 kode mati | Low | **TERTUTUP** | 18 berkas terhapus atas persetujuan user (D-251); `ls revision/` = api, diff-view, labels, text-diff; `document-viewer/` tanpa api/feedback/labels/index; `shared/index.ts` hilang | Controller (D-251) |
| L2 `actual` galat fon DOCX | Low | TERBUKA | `engine/docx/fonts/catalog.ts:96`, `relabel.ts:245,252`. Tidak ditugaskan D-245 | IP-43d lanjutan; informasikan SR-57 |
| L3 duplikasi `svgSizeMm`/fit CLI | Low | **TERTUTUP** | `render.ts:75` impor dari layanan; lembar simbol lewat `symbolSheetFigures` (`:897`). Sisa lebar/kolom literal → N4 | FIX-C |
| L4 `PAPER_MM` UI | Low | **TERTUTUP** | `style-picker.tsx:13,22` = `PAPER_SIZE_MM` kontrak | FIX-U |
| L5 duplikasi label kekurangan | Low | **TERTUTUP** | Satu `missingLabel(s)` di `shared/labels.ts:216,231`; `describeMissing` mendelegasikan (`completeness-rail.tsx:117-119`) | FIX-U |
| L6 bawaan placeholder/draf DOCX vs HTML | Low | TERBUKA | HTML `assemble/slots.ts:59-60,97-98,122` vs DOCX `assemble/index.ts:304` dan `units.ts`. Tidak ditugaskan D-245 | SR-16/SR-17 → siklus berikut |
| L7 IP-58 skrip glosarium | Low | **TERTUTUP** | `scripts/studio/glossary-check.ts` (parse AST, teks JSX multi-baris, pengecualian InfoTeknis/ADMIN); jalan ulang HITS_MAIN=0. Belum menjadi gerbang otomatis → N8 | FIX-U |
| L8 IP-63 DF panel/limit | Low | **TERTUTUP** | `contract/schema/v2/forbidden.ts:124-126` DF-70 (`ChartPanelV2.widthClass`) + DF-71 | FIX-S |

## 4. Temuan baru

| # | Tingkat | Domain | Berkas:baris | Deskripsi dan bukti | Pemilik | Usulan |
|---|---|---|---|---|---|---|
| N3 | Medium | Reference Integrity | `engine/chart/core/params.ts:79-81` (`CHART_DATA_HINT_KEYS` S-02/S-03/S-04 `axis`); pembaca bersama `engine/chart/family-s1/common.ts:157-158`; `registry/charts.ts` (ParamDef `axis` hanya P-13/P-14/S-01 di `:613-640`, tidak ada `["S-02"\|"S-03"\|"S-04", "axis"]`) | Pola IP-59 hanya ditutup untuk tiga kode benchmark. Keluarga S1 lainnya (S-02 box, S-03/S-04) membaca domain sumbu lewat pembaca yang sama (`kindValue(ctx, "axis")`), tetapi tidak punya ParamDef templat. Di v2, `axis` dalam konten ditolak DISPLAY_FIELD (DF-63..65, D-229), jadi domain sumbu ketiga kode itu tidak dapat diatur dari mana pun di v2. Di v1 masih bisa lewat petunjuk data | FIX-A lanjutan (gabung IP-72) | Tambah ParamDef `chart.kind.{S-02,S-03,S-04}.axis` dengan pola yang sama, atau putuskan eksplisit bahwa domain otomatis adalah perilaku v2 untuk kode itu. Sekalian bersihkan entri mati `axis` di `CHART_DATA_HINT_KEYS` (IP-72) |
| N1 | Low | Structure | `engine/html/tables/figure.ts:31` mengimpor `classDerivedWidth, rasterPlacedWidthMm` dari `../../docx/figures/raster-width` | Mesin HTML bergantung pada modul di dalam mesin DOCX. Aturan K-2 bersifat lintas perakit, tetapi tinggal di folder milik DOCX, sehingga perubahan DOCX dapat merambat ke HTML tanpa batas modul yang jelas | FIX-FIG | Pindahkan `raster-width.ts` ke modul netral (mis. `engine/bind` atau `engine/figures`); kedua perakit mengimpor dari sana |
| N2 | Low | Reference Integrity | `params/render.ts:310-311` (R-65 `image.rasterDpi` rentang `min: 72`); `engine/docx/figures/figure.ts:66,353` (`MIN_RASTER_DPI = 150` literal untuk DATUM-39) | R-65 boleh diset 72-149, padahal classNote-nya sendiri menyebut 150 sebagai lantai mutu DATUM-39. Dengan nilai di bawah 150, K-2 menempatkan gambar pada lebar asli resolusi rendah, lalu DATUM-39 memperingatkan dpi efektif < 150 untuk gambar yang sama. Lantai DATUM-39 juga literal, bukan parameter | FIX-FIG | Naikkan `range.min` R-65 ke 150 (selaras DATUM-39), atau jadikan lantai DATUM-39 parameter dan validasi `image.rasterDpi >= lantai` |
| N4 | Low | Dependency Impact | `scripts/parity/run/lib/render.ts:896-897` | Lembar simbol mandiri di CLI memakai `widthMm: 166` literal dan `cols = 3` bawaan walaupun `--template` diberikan. Kertas non-A4 dan kelas lebar templat diabaikan. `fit: true` dipaksa 3 kolom, sedangkan layanan memakai bawaan mesin (6) saat `cols` tidak ada (`render/figures.ts:136`) | FIX-C / SR-33 | Bila `tpl` ada: `widthMm = figureWidthMm("symbolSheet", tpl.params)`, dan `cols` hanya diteruskan bila spec membawanya |
| N5 | Low | Maintainability | `src/components/studio/playground/rail-summary.ts:1-17` | Fungsi identitas `@deprecated` tanpa importir (`grep toRailSummary` = hanya definisi dan komentar `doc-model.ts:197`). Tidak masuk daftar 18 berkas D-251 | FIX-U; keputusan user (garis merah) | Ajukan penghapusan ke user bersama sisa kode mati berikutnya; jangan hapus tanpa persetujuan |
| N6 | Low | Maintainability | `engine/diagram/core/grid.ts:27-31,41` (`resolveDiagramGrid(undefined)` → `DIAGRAM_GRID_A4`); `engine/chart/core/guards.ts:56-59` (`figureLimits` → bawaan registri A4); `canvas.ts:23,48`, `guards.ts:338` (`figureLimits(undefined)` sebagai bawaan argumen) | API mesin masih punya bawaan A4 implisit bila pemanggil tidak meneruskan grid atau templat. Ini bertentangan dengan arah D-245 ("cadangan literal → `BY_CONSTRUCTION_FAILED`"). Semua pemanggil produksi meneruskannya (dicek: `render/figures.ts:189`, `render/artifact.ts:189,391`, `pure/chart.ts:51`), jadi risikonya laten: pemanggil baru yang lupa akan diam-diam mendapat A4. Pemakai sah tanpa templat: CLI figur mandiri (`render.ts:872`), `benchmark/manual000/figures/tools/validate_figures.ts:114` | FIX-B, FIX-FIG | Jadikan `grid`/`tpl` wajib di tanda tangan mesin, dan sediakan `DIAGRAM_GRID_A4`/templat A4 eksplisit untuk alat benchmark dan CLI tanpa templat |
| N7 | Low (hipotesis) | Dependency Impact | `benchmark/manual000/datum-manual-000.preset.json` (`render.table.layout.widthTw` 9412 + `render.table.columnProfiles` twip BM); `engine/docx/tables/render.ts:165` (`layout.widthTw` menang atas turunan) | Preset Manual 000 menyematkan lebar tabel absolut A4 dalam twip. Bila templat berpreset ini memilih kertas lain, tabel tetap 166 mm dan G2 tabel (jumlah kolom eksplisit terhadap lebar sah turunan) diperkirakan FAIL. Belum dijalankan, jadi berstatus hipotesis. Preset ini terbatas (ADMIN/benchmark) | SR-32 / convert_v2 (preset) | Catat di `meta` preset bahwa preset hanya untuk A4, atau tolak `page.size` non-A4 untuk preset ini di layanan templat; uji satu kali dengan Letter |
| N8 | Low | Maintainability | `scripts/studio/glossary-check.ts` (tidak dirujuk `package.json` maupun `tests/**`: `grep glossary` = 0) | Gerbang A2 kini akurat, tetapi hanya dijalankan manual. Regresi glosarium tidak akan tertangkap oleh vitest/CI | FIX-U | Bungkus sebagai uji vitest (`tests/unit/studio/ui/glossary.test.ts` memanggil fungsi pemindai) atau skrip npm yang dijalankan gerbang |
| N9 | Low | Reference Integrity | `delegation_progress/integration_backlog.md:62-64,69` | Status IP-56, IP-57, IP-58, IP-63 masih "terbuka" walau D-251/D-252/D-261 menutupnya. Berkas ini milik controller | Controller | Mutakhirkan status agar SR-58 tidak menghitung butir yang sudah tertutup |

Catatan tanpa temuan:
- Determinisme rasterisasi (`engine/browser/runtime.ts:113-121`, `index.ts:54-55,270-280`) aman terhadap sandbox (flag tidak termasuk daftar yang dilarang). Kriteria "dua tangkapan berturut identik" tidak menjamin varian kanonik lintas proses, tetapi `--disable-gpu` + satu thread raster dan bukti 225/225 (D-265) memadai. Biaya minimal +0,5 s per raster dinilai SR-54.
- FIX-L `STAMP_DASH` (`engine/lint/scan/checks.ts:110`) sempit: butuh awalan `//` dan token `TERBITAN`. Pengecualian kolom "Salah" memakai `TextSegment.role` (`:124`), bukan pencocokan teks bebas. Ini presisi, bukan pelonggaran, sesuai D-263/D-269.
- Harness paritas: gerbang `a.markCount`/`b.markColors` hanya bila sumber klasifikasi sama (`compare_svg.py:668-704`), dan `embeddedFonts` DX/PD berstatus diagnosis (`thresholds.py:117,126`). S86 R01/R02 tertutup.

## 5. Tantangan

1. **N3 menunjukkan pola penutupan "sebatas benchmark".** IP-59 ditutup untuk tiga kode yang dipakai Manual 000, padahal pembaca dan petunjuk data untuk S-02..S-04 sama persis. Kriteria penutupan sebaiknya berbasis kelas (setiap petunjuk yang dibuang D-227 punya pengganti templat atau putusan eksplisit), bukan berbasis fixture.
2. **Bawaan A4 implisit di API mesin (N6)** adalah sisa terakhir dari H1. Hari ini aman karena semua pemanggil produksi patuh, tetapi kontrak "tanpa cadangan A4" belum ditegakkan oleh tipe.

## 6. Temuan positif

- H1 ditutup menyeluruh, dari compose sampai mesin, penjaga DOCX, G2 lint, dan tab gaya. Bentuknya "turunan atau `BY_CONSTRUCTION_FAILED`", dan A4 tetap byte-identik (DOCX v1 `53485ebc…`, D-257/D-271).
- FIX-C menghapus seam dinamis beserta salinan antarmukanya. CLI kini setara dengan jalur layanan pada sha DOCX dan snapshot (D-254).
- Penghapusan IP-56 dilakukan setelah persetujuan user dan verifikasi importir ulang (D-251), sesuai garis merah.
- Skrip glosarium berbasis AST menutup batas metode siklus 1 (teks JSX multi-baris).
- tsc repo 0, eslint area 0, figures + renderers 501/501, selftest pembanding 28/28.

## 7. Berkas yang dibaca

`services/compose/blocks.ts:95-115,264-275,385-460`; `engine/chart/core/{guards.ts:25-110,330-345, canvas.ts}`; `engine/chart/core/params.ts:60-85`; `engine/chart/family-{p2/quadrant,p2/arrow,s1/common}.ts` (baris pembaca); `services/render/pure/chart.ts`; `engine/diagram/core/grid.ts:20-60`; pemanggil `buildDiagramSvg` (grep repo); `services/render/figures.ts:90-190`; `engine/docx/figures/{figure.ts:55-100,340-355, raster-width.ts}`; `engine/docx/tables/{widths.ts, guards.ts:60-110, render.ts:150-165}`; `engine/lint/scan/index.ts:120-128`; `engine/docx/package/parts.ts:14-60`; `engine/html/{base/params.ts:60-200, assemble/slots.ts:55-125, tables/figure.ts:31}`; `engine/browser/index.ts:250-290`, `runtime.ts:110-125`; `engine/lint/scan/checks.ts:95-175`; `params/render.ts:305-318`; `registry/charts.ts:600-640`; `scripts/parity/run/lib/render.ts:690-730,850-905` (+ grep impor); `benchmark/harness/run/lib/{pipeline.ts, inputs.ts}` (grep kerangka); `services/ingest/v2.ts:255-280`; `components/studio/{playground/rail-summary.ts, shared/completeness-rail.tsx:110-130, template-preview/{index.tsx, api.ts}, template-editor/{template-editor.tsx:655-675, style-picker.tsx:13-25}}`; daftar berkas `revision/`, `document-viewer/`, `shared/`; `scripts/studio/glossary-check.ts:1-45`; `scripts/parity/compare/{compare_svg.py:660-705, thresholds.py:110-127, compare_docx.py:485-490}`; `docs/STUDIO-AGENT-GUIDE.md:118-130`, `docs/API-REFERENCE.md:305`; `contract/schema/v2/forbidden.ts:94-126`; `engine/docx/fonts/{catalog.ts:90-98, relabel.ts:240-255}`; `delegation_progress/integration_backlog.md`.
