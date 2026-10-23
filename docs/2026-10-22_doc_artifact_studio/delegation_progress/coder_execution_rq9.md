# Catatan coder-execution RQ-9 (sisa SR-32/IP-53; D-216, D-217)

Status: complete (sisa 1 isu skema = batas kontrak panels > 12, diajukan). Tanggal 2026-10-23. Skills: backend-execution, dry-run-verify-fix.

## Berkas (area `benchmark/harness/run/**`; klaim RQ-9 di `file_claims.md`)
- `lib/figures_v2.ts` (baru): `mapFigureSpecToV2(kind, spec)` memetakan spec S94 ke isi `ChartV2` (`code`, `data`|`panels`, `highlight`, `unit`, `dec`, `limit`, `note`) / `DiagramV2.spec` (`DiagramSpecV2`) dengan memanggil adaptor murni `services/adapt-v1` (`adaptV1`, kebijakan `strip`, tepercaya) pada amplop v1 satu-blok. Satu sumber pemetaan dengan ingest v1->v2 (register 03 §14.3:1038); tanpa duplikasi aturan. Jejak `stripped`/`renamed` dikurangi kontribusi amplop pengisi.
- `lib/inputs.ts`: substitusi v2 memakai pemetaan (bukan spec mentah); caption/sumber/kunci tetap konten blok doc; tanpa medan ukuran (lebar dari kenop templat `chart.output.widthMm`/`diagram.widthMm`; kelas lebar image/symbolSheet milik RQ-8). Gagal petakan -> `BLOCK_INVALID` + peringatan (tidak diam). `Substitution.v2Mapping` (stripped/renamed per figur) masuk `run_summary.json`. Jalur v1 tidak berubah.
- `selftest_verdict.ts`: +3 kasus RQ-9 (komposit, tunggal + limit, diagram dengan `u` D-172).
- `README.md`: paragraf RQ-9.

## Bukti (2026-10-23)
- `npx tsx benchmark/harness/run/run_benchmark.ts --schema v2 --dry-run`: exit 0; "skema doc sesudah substitusi" studio.doc/v2 valid=false issues **60 -> 1**; satu-satunya isu `/sections/content/chapters/7/sections/1/blocks/0/panels` maxItems ("must NOT have more than 12 items", bm-fig-17 15 panel). 15 figur mesin tersubstitusi.
- `--schema v1 --dry-run`: exit 0; studio.doc/v1 valid=true issues 0; 15 figur mesin (tanpa regresi).
- `npx tsx benchmark/harness/run/selftest_verdict.ts`: 24/24 lulus.
- `npx tsc --noEmit -p tsconfig.json`: exit 0, 0 `error TS` seluruh repo.
- `npx eslint benchmark/harness/run`: exit 0.
- Jejak per figur (skrip scratch): diagram buang `id`/`title`/`width_mm`/`apparatus` (`$schema` dikonsumsi adaptor); chart buang `id`, `title`, `source`, `widthMm`, `heightMm`, `apparatus`, `inDocument`, `style`, `params`, `columns`, `gapMm`, `x` panel; `accent->highlight` 11/2/11/6/8 (bm-fig-17..21).

## Diagnosis panels > 12 (TIDAK diubah; diajukan di `file_requests.md`)
Sumber tunggal: `src/lib/studio/contract/schema/v2/common.schema.ts:466` `ChartV2.panels maxItems: 12`. Tidak ada di register T2-23 (`03:324`), skema v1 (`chart.schema.ts:223-238`), maupun mesin (`engine/chart/core/composite.ts:67-79`). Sama dengan sebab `ADAPT_V1_SCHEMA_INVALID` jalur v1 (IP-53 temuan 2). Usul: `maxItems: 24` (>= 15).

## Temuan untuk controller
1. Permintaan 2 (`file_requests.md`): `ChartPanelV2` tanpa `limit` -> ambang panel bm-fig-17 P-11 (55,0 dB(A)) hilang diam-diam; usul tambah `limit?` panel + adaptor. Juga `params` panel berisi data (P-09 targets, P-13 divider/quadrantNames, S-01 binEdges, S-08 sectors) dibuang; `accent {point,series}` P-03 menjadi dua highlight lepas; `params.accentCategory` P-14 tidak terpetakan (bersinggungan IP-41e/D-215).
2. Keputusan: pemetaan lewat `adaptV1` (bukan salinan lokal) agar runner mengikuti perubahan adaptor (RQ-10 dsb.) otomatis.

Review direkomendasikan (lingkup `benchmark/harness/run/lib/{figures_v2,inputs}.ts`).
