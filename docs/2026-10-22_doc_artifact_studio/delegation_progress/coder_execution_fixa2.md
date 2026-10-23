---
task_id: FIX-A2
task_slug: doc_artifact_studio
row: FIX-A2 (loop perbaikan siklus 3, D-281; SR-56b N1/N2/N3/N4/N6 + IP-72)
date: 2026-10-23
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/05_structural_sections_blueprint.md
status: complete
---

# Catatan coder-execution FIX-A2

Status: complete. Skills: receiving-code-review, dry-run-verify-fix. Klaim FIX-A2 di `file_claims.md` (append atomik).

## Executed Steps
| Step | Temuan | Status | Catatan |
|---|---|---|---|
| 1 | N3 (Medium) + IP-72 | complete | 3 ParamDef `chart.kind.{S-02,S-03,S-04}.axis` pola D-268; entri mati `axis` dibuang dari `CHART_DATA_HINT_KEYS` (P-13, P-14, S-01..S-04) |
| 2 | N2 | complete | R-65 `image.rasterDpi` rentang 150-600 (bawaan 150 tetap); lantai DATUM-39 DOCX kini membaca batas bawah R-65 (satu sumber) |
| 3 | N1 | complete | `raster-width.ts` dipindah ke `engine/tokens/raster-width.ts`; DOCX dan HTML mengimpor dari sana |
| 4 | N6 | complete | Mesin chart tanpa grid/templat: REPORT `FIGURE_LIMITS_DEFAULT` tercatat; bawaan argumen A4 implisit di kanvas/tata letak komposit dihapus |
| 5 | N4 | complete | CLI lembar simbol: lebar = `figureWidthMm("symbolSheet", tpl.params)` bila `--template`, kolom hanya bila spec membawanya, `fit` dari templat |

## Changes Made
| Berkas | Jenis | Deskripsi |
|---|---|---|
| `src/lib/studio/registry/charts.ts` | modify | +3 ParamDef petunjuk (hint, range, default null, grup P7X -> `section:chart` + `advanced`); pin `CHART_PARAMS_COUNT` 133 -> 136, `CHART_HINT_PARAMS_COUNT` 34 -> 37; komentar kepala |
| `src/lib/studio/params/index.ts` | modify | Pin `CATALOG_PARAM_COUNT` 719 -> 722; total **784 -> 787** (komentar) |
| `src/lib/studio/params/render.ts` | modify | R-65 `range.min` 72 -> 150 (+ komentar alasan, `source` D-281) |
| `src/lib/studio/engine/chart/core/params.ts` | modify | `CHART_DATA_HINT_KEYS`: P-13 `["divider"]`, P-14 `["accentCategory"]`, S-01 `["binEdges","medianLabel"]`, S-04 `["medianTick"]`; entri S-02/S-03 hilang (kosong) |
| `src/lib/studio/engine/chart/family-s1/{common,box,density,violin}.ts` | modify | Komentar saja (domain = ParamDef `chart.kind.<KODE>.axis`, alias `params.axis` dipindah resolver); logika `hintAxis` tidak berubah |
| `src/lib/studio/engine/tokens/raster-width.ts` | add (pindahan) | Isi = `engine/docx/figures/raster-width.ts` + `RASTER_DPI_FLOOR` (batas bawah R-65) |
| `src/lib/studio/engine/docx/figures/raster-width.ts` | delete (dipindah, diminta brief N1) | Tidak ada importir lain (grep src/tests/scripts/benchmark) |
| `src/lib/studio/engine/docx/figures/figure.ts` | modify | Impor dari `../../tokens/raster-width`; `MIN_RASTER_DPI = RASTER_DPI_FLOOR` (150) |
| `src/lib/studio/engine/html/tables/figure.ts` | modify | Impor dari `../../tokens/raster-width` (HTML tidak lagi mengimpor mesin DOCX untuk K-2) |
| `src/lib/studio/engine/chart/core/guards.ts` | modify (perluasan N6) | `FIGURE_LIMITS_DEFAULT_CHECK`, `figureLimitsDefaultedKeys`, `figureLimitsReport`; `lintChartSvg` tanpa `maxHeightMm` -> REPORT yang sama |
| `src/lib/studio/engine/chart/core/canvas.ts` | modify (perluasan N6) | `panelCanvas`/`chartCanvas`: batas wajib (bawaan `figureLimits(undefined)` dihapus); `finalizeChart` menggabung `figureLimitsReport(tpl.params)` |
| `src/lib/studio/engine/chart/core/composite.ts` | modify (perluasan N6) | `compositeLayout(spec, limits \| undefined)`: tanpa batas = taksiran tinggi saja (DATUM-33 dilewati, bukan A4); `renderComposite` menggabung `figureLimitsReport` |
| `scripts/parity/run/lib/render.ts` | modify | `renderFigure` lembar simbol (N4) + impor `figureWidthMm` |

## Test Results
| Jenis | Perintah | Hasil |
|---|---|---|
| Verifikasi baris (scratch) | `npx tsx C:/Users/TRIAL/AppData/Local/Temp/claude/fixa2/verify_fixa2.ts` (keluaran `verify.txt`) | SEMUA LULUS (39 cek) |
| Jalur v1 sebelum/sesudah | `v1_snap.ts before` vs `after_all` (S-02/03/04 fixture tanpa/dengan `params.axis`, bm-fig-17, bm-fig-21) | SVG identik 8/8 (`V1_SVG_SAMA`) |
| DOCX v1 Manual 000 | `render_cli.ts --doc benchmark/manual000/doc.json --template benchmark/manual000/template.json --formats docx` | `53485ebc1eddd145…` (tetap); `FIGURE_LIMITS_DEFAULT` 0 di report/log |
| convert_v2 | `npx tsx benchmark/extract/convert_v2.ts --check` x3 | SAME x3: doc.v2 `79290e07…`, template.v2 `882057c5…`, preset `a951b149…` |
| Unit studio | `npx vitest run tests/unit/studio` | 58 berkas, 1975 lulus / 1 gagal: `figures/chart-smoke.test.ts` pin 133 (disengaja, lihat permintaan) |
| tsc repo | `npx tsc --noEmit -p .` | exit 0, 0 `error TS` (run akhir; run tengah sempat 149 galat hanya di `benchmark/out/fixb2/baseline_src/**` = salinan scratch FIX-B2, bukan baris ini) |
| eslint area | `npx eslint registry/charts.ts engine/chart/core engine/chart/family-s1 params engine/tokens engine/docx/figures engine/html scripts/parity/run/lib/render.ts` | exit 0 |

## Verification
- N3: ParamDef `P7X-S-02-axis`/`P7X-S-03-axis`/`P7X-S-04-axis` range, default null, scope `section:chart`, surface `advanced`. v2 = v1 IDENTIK: panel komposit bm-fig-21 (templat `chart.kind.S-0x.axis [0,100]` vs v1 `params.axis [0,100]`): S-02 `d9f9c41ef44e`, S-03 `0c2b8a0ac8d3`, S-04 `c479ddedf0a6`; chart tunggal fixture paritas (S-02/S-04 `[800,2400]`, S-03 `[0,70]`): `cb67c1d883c2`, `0b07777beb64`, `6575a2c0ae8e`; tiap kasus berbeda dari tanpa axis (parameter berpengaruh). Konten ber-`axis` (panel.axis, panel.data.axis, chart.axis) untuk ketiga kode -> `checkId: DISPLAY_FIELD` (9/9). `CHART_DATA_HINT_KEYS` tanpa `axis` (0 entri).
- Jalur v1: SVG identik sebelum/sesudah; laporan v1 ber-`params.axis` S-02..S-04 + bm-fig-21 bertambah 1 `PARAM_ALIAS` (perilaku resolver baku, sama dengan FIX-A D-268).
- N2: R-65 `{min:150,max:600}`, bawaan 150; 149 dan 72 ditolak ("di bawah minimum 150"), 150/600 diterima; K-2 tetap (600 px@150 = 101,6 mm; 1148/1654 px -> 166; 600 px@300 = 50,8). Tidak ada templat/preset/seed yang menyetel `image.rasterDpi` (grep).
- N1: grep `raster-width` = hanya `engine/tokens/raster-width.ts` + dua importir.
- N6: render tanpa templat -> 1 REPORT `FIGURE_LIMITS_DEFAULT` ("grid.allowedFigureWidthsMm, grid.textBlockHeightMm absen ...; bawaan registri dipakai (lebar sah 128 mm maupun 166 mm, tinggi maks 247 mm = profil kanonik A4)"); templat terselesaikan (`resolveParams`) -> 0; SVG sama (`7335d833c804`); komposit tanpa templat -> tepat 1.
- N4 (render_cli, `--formats svg`, lembar iec): tanpa `--template` sebelum = sesudah `4999b9c70477cd9d` 166x247 (cols 3 maupun tanpa cols). Dengan `--template datum-kanonik` atau `datum-manual-000` (profil `template.json`, tanpa `symbolSheet.widthClass`): sebelum 166 tertanam, sesudah turunan kelas `text` = 128x247 (`c266298d057e0483`) = lebar yang dipakai jalur layanan/compose untuk templat yang sama. Fixture paritas simbol tidak memakai templat dan membawa `cols: 3` -> tidak berubah.

## Persistent Issues
| Issue | Attempts | Root Cause | Status | Blocking? |
|---|---|---|---|---|
| Pin uji `chart-smoke.test.ts:34-43` (133/34) gagal | 0 (bukan area) | Pin parameter naik 133 -> 136 / 34 -> 37 (disengaja) | Terbuka, milik SR-42 | Tidak |

## Issues & Decisions
| Langkah | Keputusan / temuan | Resolusi |
|---|---|---|
| N3 | Semantik domain S-02/S-03/S-04 = mesin v1 (data di luar memperluas + REPORT AXIS_HINT; S-03 kurva dipotong ke rentang) | classNote per kode; tanpa penyeragaman agar v1 byte-identik |
| N3 | Preset Manual 000 TIDAK perlu `chart.kind.S-03.axis`: panel S-03 bm-fig-21 (v1 `axis [0,70]`) memberi SVG sama dengan tanpa axis (`bf500fe5b58d`), S-02/S-04 bm-fig-21 tanpa axis | Preset tidak diubah |
| N2 | Lantai DATUM-39 DOCX dihubungkan ke batas bawah R-65 (`RASTER_DPI_FLOOR`), bukan parameter baru | Satu sumber; nilai tetap 150 |
| N1 | Lokasi bersama = `engine/tokens/` (modul turunan parameter murni) | Berkas lama dihapus sebagai bagian pemindahan yang diminta brief |
| N6 | "Peringatan tercatat" = REPORT di `SvgResult.report` (mesin murni, tanpa I/O); layanan meneruskan report ke log render | Bawaan registri tetap untuk render mandiri (CLI/galeri/benchmark), tidak diam-diam |
| N6 | Perluasan area di luar brief: `engine/chart/core/{guards,canvas,composite}.ts` (pemilik FIX-FIG selesai, tanpa klaim aktif) | Diklaim; perlu dikukuhkan controller |
| N4 | Perubahan perilaku CLI: `--template` kanonik/manual-000 kini 128 mm (turunan) alih-alih 166 tertanam | Sesuai brief; dicatat |

## Permintaan / temuan luar area (tidak disentuh)
1. SR-42: `tests/unit/studio/figures/chart-smoke.test.ts:34-43` pin 133 -> 136, petunjuk 34 -> 37, sertakan S-02/S-03/S-04 di daftar `axis`.
2. Register/panduan (DOC/SR-05): +3 ParamDef (total 787), R-65 rentang 150-600, REPORT `FIGURE_LIMITS_DEFAULT`, modul `engine/tokens/raster-width`.
3. Sisa ketergantungan HTML -> DOCX di luar N1: `engine/html/blocks/semantic.ts:19` mengimpor `../../docx/blocks/semantic` (pemilik SR-17/SR-16).
4. N6 diagram (`engine/diagram/core/grid.ts` bawaan `DIAGRAM_GRID_A4`) = FIX-B2, tidak disentuh.
5. Review direkomendasikan (lingkup: `engine/chart/core/{guards,canvas,composite}.ts` N6, `scripts/parity/run/lib/render.ts` N4).

## Next Steps
- none (baris ini); pin uji ke SR-42.
