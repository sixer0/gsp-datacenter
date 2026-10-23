---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: FIX-6
date: 2026-10-23
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/masterplan/
status: needs-review
---

# Implementation Report: FIX-6 (F-059, F-058, F-S71-2)

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Klaim path, baseline benchmark | complete | DOCX 6515797f (2x) dari salinan awal doc/template |
| 2 | F-058 status rilis saat modul crash | complete | lint-runner-fault.test.ts:68 hijau tanpa diubah |
| 3 | F-S71-2 derive 3 kunci T | complete | butuh delta kontrak aditif DeriveFnId (ratifikasi) |
| 4 | F-059 alias relabel + R-08 kanonik | complete | docx-fonts-embedded 9/9 |
| 5 | Verifikasi | complete | lihat Test Results |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/lib/studio/engine/docx/fonts/rename.ts | add | renameFontFamily (aturan relabel S99, tabel name saja) |
| src/lib/studio/engine/docx/fonts/relabel.ts | modify | RELABEL_ALIAS_FACES (sha terkunci), findRelabelAlias, relabelAliasSource, cache |
| src/lib/studio/engine/docx/fonts/plan.ts | modify | relabelled() memakai alias bila tidak ada nama persis |
| src/lib/studio/engine/docx/fonts/index.ts | modify | ekspor baru |
| src/lib/studio/params/render.ts | modify | R-08 kanonik "IBM Plex Sans Condensed" |
| src/lib/studio/engine/lint/scan/runner.ts | modify | faultedModulesFor; releaseStatusFor tidak PASS bila modul crash; banner |
| src/lib/studio/engine/tokens/grid.ts | modify | 3 DERIVERS diagram; KEYED_DERIVERS hanya D-33 |
| src/lib/studio/params/figure.ts | modify | derive P9-04/38/51 |
| src/lib/studio/contract/types/params.ts | modify (di luar area) | DeriveFnId + 3 id aditif |
| tests/unit/studio/docx-fonts-alias.test.ts | add | 4 uji alias |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| unit | npx vitest run tests/unit/studio/engine-core tests/unit/studio/renderers tests/unit/studio/docx-fonts-family.test.ts tests/unit/studio/docx-fonts-alias.test.ts | 421/425 | 4 gagal di luar kendali/diharapkan, lihat Persistent Issues |
| unit (terisolasi) | npx vitest run soffice-render-env, docx-fonts-embedded, lint-runner-fault | 26/26 | |
| typecheck | npx tsc --noEmit -p tsconfig.json | 11 galat | semua benchmark/harness/run/selftest_verdict.ts (FIX-5) |
| lint | npx eslint (area FIX-6 + uji baru) | exit 0 | |
| benchmark | render_cli docx x2 sebelum/sesudah | 6515797f identik | |
| fixture | render_cli 4 fixture kanonik docx,pdf,html | 4/4 SUCCEEDED | PDF SemiBold tertanam |

## Verification
- Lihat `delegation_progress/coder_execution_fix6.md` (angka karakter per fon PDF sebelum/sesudah, fontTable, sha).

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| tokens.test.ts:35 merah | 0 (bukan area) | uji mengunci daftar 3 kunci tanpa derive; kini [] | file_requests ke pemilik S71 | tidak |
| docx-determinism jangkar e9d08818 | 0 (bukan area) | fon (FIX-6) + document.xml (baris lain) | file_requests | tidak |
| html-css-csp C0 | 0 | F-S72-2, FIX-2 | di luar lingkup | tidak |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 4 | Alias vs ganti nama kanonik | Alias (D-31 tetap); R-08 kanonik diselaraskan ke type.face.condensed |
| 4 | Wajah alias butuh berkas di disk (paket membaca absPath) | Cache sha-terkunci di tmp/STUDIO_FONT_CACHE_DIR |
| 3 | DeriveFnId di contract (read-only) | Delta aditif diterapkan, ratifikasi diminta |

## Next Steps
- Controller: ratifikasi delta kontrak; mutakhirkan 2 uji (S71/S72) via file_requests; review recommended `engine/docx/fonts/**`, `engine/lint/scan/runner.ts`.
