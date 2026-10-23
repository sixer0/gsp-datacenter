---
task_id: doc_artifact_studio_ip39a
task_slug: doc_artifact_studio
row: IP-39a
date: 2026-10-23
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/delegation_progress/integration_backlog.md
status: needs-review
---

# Implementation Report: IP-39a mesin chart (siklus perbaikan 1, dihentikan sebagian)

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | S84 #1 alias aksen satu resolver | complete | `core/params.ts` resolveAccent/accentOf; 12 pengurai lokal dihapus |
| 2 | S84 #8 API baca tunggal + linspace | complete | `core/read.ts`, `core/numeric.ts`, requireDistribution/midBaseline inti |
| 3 | S84 #4 karakter kendali XML (+ #3 komentar) | complete | `core/svg.ts` |
| 4 | S84 #5 lantai chart.minFontPt | complete | `SvgDoc` minFontPt di 18 titik |
| 5 | S79 E1-E6, L1 | not started | dihentikan instruksi controller |
| 6 | IP-39 / IP-40 | not started | dihentikan instruksi controller |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/lib/studio/engine/chart/core/params.ts | modify | resolveAccent, accentOf; resolver melipat semua alias aksen |
| src/lib/studio/engine/chart/core/read.ts | add | API baca parameter tunggal |
| src/lib/studio/engine/chart/core/numeric.ts | add | linspace, kde tunggal |
| src/lib/studio/engine/chart/core/{svg,palette,prepare,guards,apparatus,gallery,datum,composite,index}.ts | modify | escape XML, komentar, midBaseline, minFontPt, delegasi read.ts, requireDistribution, kode mati |
| src/lib/studio/engine/chart/family-*/** (11 keluarga) | modify | baca aksen via accentOf, parameter via read.ts, mid/linspace/kde/requireDistribution inti, SvgDoc minFontPt |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| typecheck | npx tsc --noEmit -p tsconfig.json | exit 0 | seluruh repo |
| lint | npx eslint <area IP-39a> | exit 0 | |
| unit | npx vitest run tests/unit/studio/figures | 355/362 (sebelum #4/#5) | tidak dijalankan ulang (instruksi tahan pengujian) |

## Verification
- Asap scratchpad sebelum berhenti: 58 kode x 2 gaya + 5 komposit SVG identik byte dengan garis dasar (templat bawaan); DATUM-28 dengan minFontPt 6,5: 125 -> 0.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Uji S73 chart-params:125 | 0 | perilaku baru disengaja | permintaan di file_requests | tidak |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 1 | Tingkat aksen tertinggi menang UTUH (bukan gabung per medan); `point`+`series` = titik dalam seri | perlu dikukuhkan controller |
| 2 | Pembaca palette paramBool/paramNum kini strict (tipe salah -> SCHEMA_INVALID) | perlu dikukuhkan controller |

## Next Steps
- Sisa di `delegation_progress/coder_execution_ip39a.md` §Sisa.
