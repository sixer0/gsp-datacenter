# FIX-5 — catatan kerja coder-execution (runner benchmark, R03/R04/R20)

Area eksklusif: `benchmark/harness/run/**`. Path kerja sementara: `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/fix5/`.

## Log

- 2026-10-23 klaim path ditambahkan ke `file_claims.md` (prefiks FIX-5).
- Masukan dibaca: `gateway_check/05_review_ui_harness.md` R03/R04/R20; D-79, D-109, D-113, D-118; README runner; `figures/index.json` (52 figur: chart 5, diagram 6, symbolSheet 4, device 28, raster 9; spec blok S94 = berkas spec untuk 11 chart/diagram).
- Rencana: mode resmi bawaan (engine + fallback none), label DIAGNOSIS (raster acuan) untuk mode raster/pengganti, vonis PASS-DEGRADED/FAIL bila figur chart/diagram/simbol tidak dari mesin, run diagnosis raster opsional terpisah, figur lewat `buildFigures` produksi + `templateForDoc` (applyDocOverrides) + `preloadAssetBytes` + `lintAfterRender`, env `STUDIO_HARNESS_PYTHON`.
- Implementasi selesai: config/inputs/pipeline/report/run_benchmark + `selftest_verdict.ts` + README.
- Temuan saat uji: ingest menolak templat terbatas tanpa `trustedHarness` (D-98) -> runner menyetel `trustedHarness: true`.
- Bukti: tsc repo 0 galat; eslint area exit 0; selftest 13/13; dry-run exit 0 (15 figur mesin dari spec S94); alur pendek resmi 15 ENGINE; negatif (salinan spec bm-fig-06 dirusak) resmi FAIL exit 1, diagnosis FALLBACK_RASTER exit 1.
- Permintaan berkas: 2 ke FIX-1 (orkestrator murni, drift chartSvg komposit), 2 ke FIX-3 (env Python, trustedHarness paritas).
- Laporan baris: `implementation/fix5_benchmark_runner.md`. Status: complete.

---

# FIX-5 (D-229) — DISPLAY_FIELD medan tampilan chart & kelas lebar figur

Area eksklusif: `src/lib/studio/contract/schema/v2/forbidden.ts` (klaim prefiks FIX-5 di `file_claims.md`). Scratch: `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/fix5/` (`verify_d229.ts`, `d229_before.txt`, `d229_after.txt`, `d229_tsc.txt`, `d229_eslint.txt`, `d229_convert.txt`, `d229_dryrun.txt`).

## Log

- 2026-10-23 klaim ditambahkan; masukan dibaca: `document_specialist_doc1.md` (temuan 1), `coder_execution_rq11.md` (klasifikasi data vs tampilan), D-139, D-215, D-227, D-229, `forbidden.ts`, `common.schema.ts` (ChartV2/ChartPanelV2/CHART_DATA_V2/ImageV2/SymbolSheetV2).
- Garis dasar (sebelum ubah, `d229_before.txt`): 25 probe chart (5 medan x blok/panel/data blok/data panel/butir data) + `widthClass` di 4 figur -> SCHEMA_INVALID additionalProperties TANPA checkId, pointer = objek induk; `widthMm` sudah DISPLAY_FIELD (DF-21 global) di semua figur.
- Perubahan: konstanta `CHART_DISPLAY_HINTS` = axis, max, belowTargetColour, compassLabels, medianLabel; entri C30 baru DF-63 ChartV2, DF-64 ChartPanelV2, DF-65 ChartDataV2 (mencakup semua turunan `data`, mis. `data.points[i]`, lewat aturan `@same`), DF-66 ImageV2 widthClass, DF-67 SymbolSheetV2 widthClass, DF-68 ChartV2 widthClass, DF-69 DiagramV2 widthClass. Pesan issue tetap register §5.1 ("medan tampilan tidak diterima; tampilan diatur templat"); `reason` awam per entri. Pemeta dan skema tidak diubah; medan data sah (target, divider, binEdges, sectors, limit) tidak disentuh.
- KEPUTUSAN (perlu dikukuhkan controller): DF-68/DF-69 (`widthClass` di chart/diagram) melampaui brief (image/symbolSheet) — alasan sama, `chart.widthClass`/`diagram.widthClass` adalah parameter esensial templat (EK-chapter-04/05); hapus dua entri itu bila tidak dikehendaki.
- Hitungan entri DISPLAY_FIELD: 62 -> 69 (global 52 + lokasi 10 -> 17); nama unik 68 -> 74.

## Bukti (segar)

- `verify_d229.ts` (ajv `validateV2Against` = ajv + `classifySchemaV2Errors`): exit 0, 44/44 PASS — 25 probe chart + 8 probe figur -> tepat 1 issue `DISPLAY_FIELD` dengan pointer medan (mis. `/chapter/sections/0/blocks/2/data/points/0/max`); kontrol 0 isu: E1 doc/v2, E2 chapter/v2, komposit bm-fig-17 (15 panel), bm-fig-21 (12 panel), P-03, P-11 (limit), P-09 target + P-13 divider + S-01 binEdges + S-08 sectors, symbolSheet, diagram; medan asing tetap tanpa checkId; `accent` di data tetap V1_FIELD.
- `npx tsx benchmark/extract/convert_v2.ts --check` x3: SAME doc.v2 9c77439b…, template.v2 882057c5…, preset d181efb1… (ketiganya, tiap run).
- `run_benchmark.ts --schema v2 --dry-run`: exit 0, `{"id":"studio.doc/v2","valid":true,"issues":0}`.
- `npx tsc --noEmit -p tsconfig.json`: exit 0. `npx eslint forbidden.ts`: exit 0.

## Luar area (dilaporkan, tidak disentuh)

- Komentar "DF-01..DF-62" di `contract/schema/v2/common.schema.ts:11`, `contract/types/v2/doc.ts:6` -> sebaiknya "DF-01..DF-69" (kosmetik).
- Register `03_structural_sections_specs.md` §5 (C30) + panduan agen + API §12 perlu DF-63..DF-69 -> lanjutan DOC-1.

Status: complete.
