---
task_id: FIX-W
task_slug: doc_artifact_studio
row: FIX-W (loop perbaikan siklus 2; D-257, D-261, tambahan D-268)
date: 2026-10-23
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/05_structural_sections_blueprint.md
status: complete
---

# Catatan coder-execution FIX-W: lebar figur turunan di kontrak, cadangan literal, grid diagram, Ajv bersama, kebijakan inline satu sumber, convert_v2 (D-247, D-268)

Status: complete. Skills: receiving-code-review, dry-run-verify-fix. Klaim FIX-W di `file_claims.md` (ditambah sebelum menulis). Semua suntingan ditulis atomik (berkas sementara lalu rename, skrip scratch `apply.mjs`); `convert_v2.ts` kini juga menulis keluarannya atomik. Cadangan pra-suntingan: scratchpad `fixw_backup/`.

## Berkas
| Berkas | Perubahan |
|---|---|
| `contract/types/chart.ts`, `contract/types/diagram.ts` | (1) `widthMm` / `width_mm`: `128 | 166` -> `number` + dok (anggota `grid.allowedFigureWidthsMm` turunan; ditegakkan mesin chart G2 / diagram `P1-width_mm`) |
| `contract/schema/chart.schema.ts:63`, `diagram.schema.ts:26` | (1) `enum [128, 166]` -> `{ type: "number", exclusiveMinimum: 0 }`. Kontrak v2 tidak diubah: DF tetap menolak `widthMm`/`width_mm`/`widthClass` di konten |
| `engine/docx/blocks/env.ts` | (2) BARU `BlockEnv.requiredNum(key)`: absen = log error + `BY_CONSTRUCTION_FAILED`; `rail()` kolom teks tanpa cadangan 128 |
| `engine/docx/blocks/structure.ts:98`, `primitives.ts:97` | (2) Datum Rule bab = `requiredNum("grid.textColumnMm")`; device datumRule = `d.widthMm ?? requiredNum("grid.fullSpanMm")` (cadangan 128/166 dihapus) |
| `engine/docx/tables/render.ts:159` | (2) `columnWidthSumMm(p)`: P5-14 absen = `BY_CONSTRUCTION_FAILED` (cadangan 128 dihapus) |
| `engine/docx/wrapper/render.ts:443` | (2) `datumRuleWidthMm`: kolom teks (lampiran) atau `cover.datumRule.widthMm` / `grid.fullSpanMm` (pembungkus); absen = `BY_CONSTRUCTION_FAILED` |
| `engine/html/blocks/device.ts:84,153` | (2) `datumRuleSvg` lebar tidak sah = log + `BY_CONSTRUCTION_FAILED` (bukan 166); device datumRule HTML = `cover.datumRule.widthMm` lalu `grid.fullSpanMm` (sama dengan DOCX), absen = galat |
| `engine/lint/scan/index.ts:120` | (2) G2 `totalMm` = P5-14 turunan, absen = lebar sah pertama turunan, lalu bawaan registri `tableGuards` (tanpa literal 128) |
| `engine/lint/render/index.ts:64` | (2) `RENDER_LINT_DEFAULTS.maxFigureHeightMm` = bawaan registri `grid.textBlockHeightMm` (`registryNumber`; registri rusak = `BY_CONSTRUCTION_FAILED`); nilai A4 tetap 247 |
| `services/render/artifact.ts:186,388` | (3) diagram artefak: `grid: figureGrid(tpl.params)` (templat artefak lewat `artifactTemplate`; jalur HTML artefak `baseTpl.params`) |
| `scripts/parity/run/lib/render.ts:870` | (3) CLI diagram: `grid: figureGrid(tpl.params)` bila templat ada; tanpa templat = grid A4 bawaan mesin |
| `services/templates/v2.ts:54`, `templates/profile.ts:342` | (4) SR-55 M8: `studioValidator(TEMPLATE_V2_SCHEMA_ID)`; skema RoleFormat lokal didaftarkan sekali ke `studioAjv()` lalu `studioValidator(ROLE_FORMAT_SCHEMA_ID)`. Grep `new Ajv2020` di `src/lib/studio` + `src/app/api/studio`: hanya instans bersama `services/ingest/validate.ts` |
| `services/render/common.ts:206-207` | (5) D-253: `inlineFormatPolicyOf(base.params)` dari `services/ingest/v2` (aturan kupas per kunci tetap milik render) |
| `benchmark/extract/convert_v2.ts` | (6) invarian `need(!("render" in doc))` (D-247) + dok kepala; tulis atomik; (D-268) `chartAxisValues()` membaca `axis` spec chart benchmark S94 (`figures/index.json` -> `specs/*.chart.json`; alias data `params.axis` atau kunci penuh) untuk P-13/P-14/S-01 dan menyetel `chart.kind.<KODE>.axis` HANYA bila tunggal per kode; konflik = tidak disetel + dicetak `chartAxis.conflicts`; entri `meta.intendedDelta` beralasan + bukti; `meta.decisions` + D-268 |
| `benchmark/manual000/doc.v2.json`, `datum-manual-000.preset.json` | regenerasi (lihat Bukti) |

## Bukti (segar, 2026-10-23)
- `tsc --noEmit --incremental false -p tsconfig.json`: 0 `error TS` (sebelum suntingan juga 0; galat `adapt-v1.test.ts:52` milik SR-44 sudah tidak ada).
- `eslint` 18 berkas area: exit 0.
- DOCX v1 Manual 000: `render_cli.ts --doc benchmark/manual000/doc.json --template benchmark/manual000/template.json --formats docx` -> `53485ebc1eddd145ee6b67d8f2c68fbec040eae8b3c8ef6cf4e2f4f0c3969db6` (tetap).
- `convert_v2.ts` tulis lalu `--check` x3: doc.v2.json SAME `79290e0732be7253ac0eb6ea3774e411f8e165049908da8595f4a22331c1ee15` (isi lama minus `render` identik JSON: true; kunci teratas `$schema, template, meta, sections, assets, x`), template.v2.json SAME `882057c5743273fed1b444a47df64a5dcbe1331a4262f3d8d290a1c1be1c6ba2` (tidak berubah), preset SAME `a951b149180345951355c1935e42093334f19789a583e6c7b495cd6abb18804c` (lama `d181efb1…`; beda = `overrides.chart.kind.P-13.axis {x:[0,10], y:[0,10]}`, `overrides.chart.kind.P-14.axis [15,95]`, `meta.decisions` + D-268, `meta.intendedDelta` + 2 entri axis).
- `verify_v2.ts`: G1_docSchemaV2, G2_templateSchemaV2, G3_textConservation, G4_effectiveValuesLegacy, G4_roleFormats, G4_slotsLayered PASS (exit 0).
- Run v2 Manual 000 (`run_benchmark.ts --schema v2`, keluaran scratch pendek `%TEMP%/fxw/bm_v2b`, berkas bawaan doc.v2 tanpa salinan): ingest OK, figur mesin 15, raster 37, hilang 0; BM1 PASS 100 % (4544/4544); BM2 PASS 101/102; BM3 FAIL 6/102; BM4 FAIL 0,7864 (= fixfig/official2; sama sebelum dan sesudah preset axis). Keluaran di jalur scratchpad panjang gagal di langkah compare (spawn python dengan `cwd` melewati batas Win32, ENOTCONN), bukan galat render.
- Probe A5 artefak diagram (komposisi `render/artifact.ts`: `resolveParams` kertas -> `figureGrid` -> `buildDiagramSvg`): A5 lebar sah [66, 104], topology/flow 104 mm (akar SVG = lebar turunan), maxH 160; Letter 171,9 (maxH 229,4); F4 171 (280); A4 166 (247). FAIL 0. CLI nyata `render_cli.ts` dengan profil `page.size: A5`: topology 104,0 mm, flow 104,0 mm dan 66,0 mm SUCCEEDED; kontrol templat A4 dengan lebar 104 -> `BY_CONSTRUCTION_FAILED` `P1-width_mm` (nasib A5 sebelum grid diteruskan).
- A4 identik: 11 fixture diagram, `buildDiagramSvg` tanpa grid vs `grid: figureGrid(A4)`: 11/11 identik (10 dirender; `dg_layered_good` galat DATUM-25 sama di keduanya, D-137).
- Probe skema/validator (scratch `probe_schema.ts`, FAIL 0): v1 diagram `width_mm` 128/166/104/66/171,9 lolos, 0/-5/"128" ditolak; v1 chart `widthMm` 128/104/133,9 lolos, 0/null ditolak; v2 `chart.widthMm`, `chart.widthClass`, `diagram.spec.width_mm`, `diagram.widthClass` di konten -> `DISPLAY_FIELD` (1 isu masing-masing); `parseTemplateV2(template.v2.json)` lolos, medan asing -> `SCHEMA_INVALID`; `validateRoleFormats` 70 peran template.json 0 isu, medan salah -> isu, panggilan ulang (cache) 0 isu; `inlineFormatPolicyOf` allow/reject/strip; `RENDER_LINT_DEFAULTS.maxFigureHeightMm` 247, blok teks 160 -> 160.
- Probe cadangan (scratch `probe_bc.ts`, FAIL 0): `datumRuleSvg` NaN -> `BY_CONSTRUCTION_FAILED`; `BlockEnv.requiredNum` absen -> `BY_CONSTRUCTION_FAILED`; `rail()` tanpa kolom -> `BY_CONSTRUCTION_FAILED`; galat tercatat di `ctx.log` level error.
- `npx vitest run tests/unit/studio/structure tests/unit/studio/figures`: 16 berkas, 4 gagal / 801 lulus; 4 gagal = `diagram-bad-cases.test.ts` (DATUM-33 247 mm dkk., D-242 K-1, file_request FIX-B, milik SR-42). Tambahan `engine-core + renderers + fix1 + docx-fonts`: 16 gagal / 472 lulus = 14 `fix1.test.ts` (D-247 R04 tanpa render, V1_FLAT_ADMIN_ONLY, dll.) + `asset-bytes` + `docx-determinism` (fixture SR-41). A/B dengan sumber pra-FIX-W (salinan sementara, sudah dihapus): `fix1` 14 gagal yang sama, figures 4 + renderers 2 yang sama -> 0 kegagalan baru dari FIX-W.

## Keputusan / catatan untuk controller
| Butir | Keputusan / catatan |
|---|---|
| Titik penegakan lebar v1 | Skema v1 kini menerima lebar angka positif apa pun; lebar non-anggota himpunan turunan (mis. 150 pada A4) tidak lagi 400 di ingest, tetapi ditolak saat render/build oleh mesin (`BY_CONSTRUCTION_FAILED` G2 chart / `P1-width_mm` diagram). Ingest dan gerbang by-construction tidak membangun figur (grep: 0 pemanggil mesin chart/diagram di `services/ingest`, `submit`, `compose`). Usul ke pemilik ingest/by-construction (FIX-S): cek keanggotaan `grid.allowedFigureWidthsMm` untuk spec chart/diagram v1 dan artefak R09 agar penolakan tetap dini |
| Mesin mandiri vs perakit | Pola FIX-FIG keputusan 3: perakit DOCX/HTML melempar `BY_CONSTRUCTION_FAILED` bila parameter absen; evaluator lint (scan G2, render DATUM-33) memakai nilai turunan lalu bawaan REGISTRI (bukan literal), karena galat di lint akan menggagalkan ingest |
| D-268 axis | Sumber nilai = spec chart benchmark S94 (`figures/specs/bm-fig-17.chart.json`), bukan `doc.json` (doc.json memuat figur sebagai image ber-aset, 0 kemunculan `axis`). P-13 = `{x:[0,10], y:[0,10]}` (1/1 figur; spec mencatat `x.scaleNote` "0-10 = kotak plot (ASUMSI)", bukti ditulis apa adanya), P-14 = `[15,95]` (1/1). S-01: TIDAK ADA `axis` di spec benchmark (panel S-01 bm-fig-21) -> tidak disetel (bawaan null), sejalan catatan FIX-A. Konflik antar figur: 0. Kunci axis lain di spec (P-04/05/06/11, H-05, W-01/03/08/10 kunci penuh; S-03 alias) di luar lingkup D-268, tidak disentuh |
| Seed DB | Preset di DB dev v21 (seed SR-38/FIX-SEED) belum memuat axis; berkas preset berubah -> seed ulang oleh pemilik seed bila diperlukan (penjaga seed membaca `meta.intendedDelta`, kini + 2 kunci) |

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Benchmark ke scratchpad panjang gagal di compare | 1 | `spawn` python dengan `cwd` jalur melewati batas Win32 | Diulang ke `%TEMP%/fxw` (pendek): semua langkah OK | tidak |

## Sisa (luar area, tidak disentuh)
1. `services/compose/blocks.ts` (FIX-FIG): cast `specWidth<...>` kini tidak perlu (tipe kontrak `number`); boleh disederhanakan.
2. Cadangan literal di luar daftar FIX-FIG: `engine/html/blocks/text.ts:313` (`datumRuleHtml(ctx, "chapter.datumRule", 128)` literal), `engine/html/blocks/wrapper.ts:274,422` (`paramNum(ctx, "cover.datumRule.widthMm", 166)`), `engine/html/base/params.ts` `GRID_FALLBACK` (text 128, textBlock 247), `contract/schema/chart.schema.ts:31` `heightMm maximum: 247` (kunci tinggi A4 di skema v1; kertas dengan blok teks lebih tinggi, mis. A3, ditolak skema) -> pemilik SR-17 / kontrak SR-04.
3. `engine/diagram/core/tokens.ts:180` teks aturan `width_mm: "128 atau 166, jangan di antaranya"` (FIX-B) masih teks A4.

## Next Steps
- none di area FIX-W; butir "Sisa" ke pemilik masing-masing.
