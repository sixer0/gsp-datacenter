---
task_id: 2026-10-22_doc_artifact_studio
task_slug: doc_artifact_studio
row: FIX-5
date: 2026-10-23
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/gateway_check/05_review_ui_harness.md (R03, R04, R20) + decisions D-118
status: complete
---

# Implementation Report: FIX-5 runner benchmark (mode resmi figur mesin, R03/R04/R20)

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Klaim path di `file_claims.md` (prefiks FIX-5) | complete | `benchmark/harness/run/**` + 2 berkas docs milik FIX-5 |
| 2 | Mode resmi bawaan + label DIAGNOSIS + vonis PASS-DEGRADED/FAIL (R03, D-118) | complete | `lib/config.ts`, `lib/report.ts` (`decideVerdict`) |
| 3 | Spec chart/diagram dibaca dari BERKAS spec S94 (id, path, sha256 dilaporkan) | complete | `lib/inputs.ts` |
| 4 | Pipeline memakai fungsi layanan render: `templateForDoc` (applyDocOverrides), `preloadAssetBytes`, `buildFigures`, `lintAfterRender` (R04) | complete | `lib/pipeline.ts`; orkestrator penuh tanpa DB diajukan ke FIX-1 |
| 5 | Laporan: BM1-BM4 resmi + seksi diagnosis raster terpisah opsional, BM4 terbagi, per figur sumber/spec/mm | complete | `run_benchmark.ts`, `lib/report.ts` |
| 6 | R20: env `STUDIO_HARNESS_PYTHON` | complete (sisi benchmark) | sisi paritas diajukan ke FIX-3 |
| 7 | Uji mandiri + alur pendek + uji negatif | complete | lihat Verification |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| benchmark/harness/run/lib/config.ts | modify | `RunKind` (OFFICIAL, DIAGNOSIS_RASTER, DIAGNOSIS_FALLBACK) + label; bawaan `--figures engine --figure-fallback none`; flag `--official`, `--diagnosis-raster`, `--with-diagnosis-raster`; `PYTHON_ENV = STUDIO_HARNESS_PYTHON`, `pythonSource`; `diagnosisConfig()`; HELP baru |
| benchmark/harness/run/lib/inputs.ts | modify | Substitusi chart/diagram memakai berkas `index.spec` (S94), bukan salinan spec di blok; `specId/specPath/specSha256` per substitusi; tanpa path spec = BLOCK_INVALID (tetap raster, terhitung degradasi) |
| benchmark/harness/run/lib/pipeline.ts | modify | `prepareRender` (job `RenderJobHandle` tanpa DB, `templateForDoc`, `preloadAssetBytes`), `stepFigures` lewat `buildFigures` layanan dengan atribusi galat per figur, langkah `lint` (`lintAfterRender`), `assetBytes` + templat ber-override ke `assembleDocx`, log job layanan dipindah ke `run_log.jsonl`, `trustedHarness: true` pada ingest (IP-31/F-042, D-98) |
| benchmark/harness/run/lib/report.ts | modify | Skema `s97.run-summary/v2`: `runKind/runLabel/official`, `decideVerdict` (PASS, PASS-DEGRADED, FAIL, INCOMPLETE; exit 0 hanya run resmi PASS), `bm4Split`, `figureSources`, `render`, `lint`, seksi diagnosis terpisah, tabel per figur (sumber, mode, spec, ukuran mm) |
| benchmark/harness/run/run_benchmark.ts | modify | `executeRun` dipakai run resmi + run diagnosis terpisah; dry-run mencetak jenis run, python + sumbernya, sumber per figur (spec id, path, sha256, mm) |
| benchmark/harness/run/selftest_verdict.ts | add | 13 kasus uji mandiri aturan vonis/exit dan bawaan CLI |
| benchmark/harness/run/README.md | modify | Jenis run, aturan vonis, langkah baru |
| docs/.../delegation_progress/file_requests.md | modify (append) | 4 permintaan: orkestrator murni tanpa DB + drift `chartSvg` komposit (FIX-1), env Python + `trustedHarness` runner paritas (FIX-3) |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | exit 0, 0 `error TS` (seluruh repo) | |
| Lint | `npx eslint benchmark/harness/run` | exit 0 | |
| Unit (mandiri) | `npx tsx benchmark/harness/run/selftest_verdict.ts` | 13/13 lulus, exit 0 | |
| Dry-run resmi | `npx tsx benchmark/harness/run/run_benchmark.ts --dry-run` | exit 0 | 15 SUBSTITUTED, sumber mesin 15 / raster 37, skema doc VALID |
| Alur pendek resmi | `... --skip-pdf --skip-compare --out <tmp>/run_pos` | exit 1 (INCOMPLETE, karena BM tidak dijalankan) | figur 15 ENGINE, 0 MISSING, 0 bukan-mesin |
| Negatif resmi | `... --figure-index <tmp>/neg/index.json --skip-pdf --skip-compare` | exit 1, vonis FAIL | bm-fig-06 MISSING |
| Negatif diagnosis | idem + `--figure-fallback raster` | exit 1, label DIAGNOSIS, bm-fig-06 FALLBACK_RASTER | |
| Diagnosis raster | `--diagnosis-raster --skip-pdf --skip-compare` | exit 1, 15 figur bukan dari mesin | |
| Resmi + diagnosis | `--official --with-diagnosis-raster --skip-pdf --skip-compare` | exit 1 (INCOMPLETE), seksi diagnosis terpisah tertulis | |

Benchmark penuh resmi TIDAK dijalankan (itu S98, setelah RT-01).

## Verification
- Figur mesin dipakai: `run_pos/run_summary.json` `figureSources` = mesin 15, raster 37, hilang 0; tiap figur chart/diagram membawa `specPath` berkas S94 dan berkas SVG/PNG di `run_pos/figures/` (30 berkas).
- Fallback/figur gagal tidak pernah PASS: uji negatif memakai salinan sementara indeks + spec bm-fig-06 dirusak (sisi ke simpul `simpul_tidak_ada_fix5`), berkas asli tidak disentuh. Resmi: `vonis FAIL ... exit 1`, alasan "1 figur mesin gagal dirender tanpa pengganti"; galat mesin "konektor merujuk simpul tak dikenal". Diagnosis pengganti: bm-fig-06 `FALLBACK_RASTER`, exit 1. Kasus PASS-DEGRADED (kriteria lulus + fallback) dibuktikan `selftest_verdict.ts` karena alur pendek tidak menjalankan bm_compare.
- R04: `run_log.jsonl` memuat entri `ASSETS_PRELOADED` dan `LINT_DONE`; laporan "Render layanan (R04)": 0 override, tier TERBIT, lint FAIL 44 dari 208 cek (informatif, tidak menahan berkas, sama dengan produksi).
- R20: dry-run mencetak `python ... (sumber default; env STUDIO_HARNESS_PYTHON)`; selftest memeriksa urutan arg > env > bawaan.
- Bukti dan berkas kerja: `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/fix5/` (`dryrun_official.txt`, `run_pos*`, `run_neg_none*`, `run_neg_fb*`, `run_diag*`, `run_both*`, `tsc.txt`).

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Ukuran figur mesin jauh dari BM: diagram bm-fig-06 195,3 vs 125,7 mm, bm-fig-08 100,0 vs 44,8, bm-fig-23 242,9 vs 110,3, bm-fig-24 161,9 vs 79,0, bm-fig-25 186,0 vs 112,9, bm-fig-38 142,1 vs 101,4; 4 lembar simbol 247 vs 44,8-100,7 mm; 5 chart cocok (selisih < 0,1 mm) | 0 (di luar area) | Hipotesis: rasio aspek SVG diagram/lembar simbol dari mesin berbeda dari PNG BM; lembar simbol mungkin memakai ukuran lembar bawaan (`svgSizeMm`). Perilaku ini sama dengan runner S97 lama, bukan regresi FIX-5 | Dilaporkan; S98 resmi kemungkinan besar terdampak di BM2/BM3/BM4 | Tidak untuk FIX-5; risiko untuk S98 |
| Peringatan `rule128` aset tidak ada saat merakit DOCX | 0 | Kemungkinan doc.json/template.json sedang diubah RT-01 (konten-saja) | Di luar area | Tidak |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 2 | Lembar simbol (4) tidak punya berkas spec | Tetap dirender mesin dari dialek (D-14, praktik S97) dan dilaporkan `dialect:<d>`; hanya foto/logo/ilustrasi/perangkat dari raster. Controller dapat membalik bila D-118 dimaksudkan lain |
| 2 | Run diagnosis yang lulus kriteria | Vonis paling tinggi PASS-DEGRADED, exit selalu 1 (hanya run resmi boleh exit 0) |
| 2 | Figur chart/diagram yang gagal disubstitusi (NOT_FOUND/BLOCK_INVALID) | Tetap raster dan dihitung "bukan dari mesin" -> PASS-DEGRADED; dry-run memberi PERINGATAN |
| 4 | Orkestrator produksi butuh `RenderJobHandle` | Runner membuat handle dari baris sintetis (konstruktor hanya menyalin medan; `persist`/DB tidak dipanggil) dan memakai `buildFigures` apa adanya; orkestrator murni diajukan ke FIX-1 |
| 4 | Drift: layanan merender komposit tanpa templat (`chartSvg`), runner lama dengan templat | Benchmark kini mengikuti produksi; keputusan benar/salah diajukan ke FIX-1 |
| 4 | Ingest kini menolak templat terbatas untuk pemanggil tidak tepercaya (D-98) | Runner (CLI server) menyetel `trustedHarness: true` sesuai kontrak IP-31; runner paritas perlu hal sama (diajukan ke FIX-3) |
| 6 | Konstanta Python bersama lintas area | Benchmark membaca `STUDIO_HARNESS_PYTHON`; satu konstanta bersama diajukan ke FIX-3 |

## Next Steps
- FIX-1: orkestrator render murni tanpa DB dan keputusan `chartSvg` komposit (`file_requests.md`).
- FIX-3: `STUDIO_HARNESS_PYTHON` dan `trustedHarness` di runner paritas.
- S98: jalankan `--official --with-diagnosis-raster` setelah RT-01; perhatikan selisih ukuran figur diagram/simbol di atas.
- Review direkomendasikan (lingkup: `benchmark/harness/run/**`).
