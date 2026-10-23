---
task_id: RT-01
task_slug: doc_artifact_studio
row: RT-01
date: 2026-10-23
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/decisions/decisions.md (D-119)
status: needs-review
---

# Implementation Report: RT-01 doc.json benchmark konten-saja, tampilan milik templat

Rincian lengkap: `delegation_progress/coder_execution_rt01.md`.

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Salin doc.json -> doc.verbatim.json | complete | sha256 3967f050... (sama S93) |
| 2 | Ekstraktor konten-saja | complete | content_only.py + --out/--verbatim-out |
| 3 | Tampilan ke template.json | complete | R-36/R-37, spacer otomatis, mode auto, tanpa nilai per bab |
| 4 | Mesin menerapkan templat | complete (DOCX) / partial (HTML) | HTML paritas run semantik diajukan FIX-2 |
| 5 | Benchmark D-17 | needs-review | dihentikan atas instruksi user; ukuran terakhir BM3 99/102 sebelum perbaikan R-37 |
| 6 | Bukti konten-saja | complete | setup/format/layout/style = 0 |
| 7 | Rekomendasi kebijakan kontrak | complete | strip + REPORT, param K ingest.inlineFormat, deprecated |
| 8 | Pindai fixture/UI | complete | skeleton.ts:195, 3 fixture parity |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| benchmark/manual000/doc.json | modify | konten-saja 1.135.884 byte |
| benchmark/manual000/doc.verbatim.json | add | salinan verbatim (diagnosis) |
| benchmark/manual000/template.json | modify | 87 override; R-36/R-37, autoMode, cover auto, entityName, glyphRun methodStatement |
| benchmark/extract/content_only.py | add | reduksi verbatim -> konten-saja + penghitung kunci |
| benchmark/extract/extract_manual000.py | modify | tulis konten-saja + verbatim |
| benchmark/extract/verify_manual000.py | modify | bawaan --doc = doc.verbatim.json |
| src/lib/studio/engine/docx/assemble/index.ts | modify | spacer otomatis peran, pengikatan run |
| src/lib/studio/engine/docx/assemble/bind.ts | add | faceRole/simbol -> templat untuk tabel/figur/turunan |
| src/lib/studio/engine/docx/blocks/semantic.ts | add | aturan run semantik (strong, glyphRun, simbol) |
| src/lib/studio/engine/docx/blocks/{env,text,boxes,rail}.ts | modify | peran inang run, label tanda dari glyphRun |
| src/lib/studio/engine/docx/wrapper/{xml,render,formats}.ts | modify | face XOR faceRole, glif symbolGlyph, setup templat |
| src/lib/studio/params/render.ts | modify | R-36 render.run.strong, R-37 render.run.symbolGlyphByRole |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| typecheck | npx tsc --noEmit -p tsconfig.json | exit 0 | repo penuh |
| lint | npx eslint (area docx assemble/blocks/wrapper, html/assemble, params/render.ts) | exit 0 | |
| schema | npx tsx benchmark/extract/validate_doc.ts benchmark/manual000/doc.json | VALID | |
| smoke | render_cli doc.json + template.json --formats docx | SUCCEEDED, 0 error | sha da8b7275... |
| compat | render_cli doc.verbatim.json + template.json | body/header/footer/media byte-identik D-109 | beda hanya docProps/app.xml Company |
| unit tests | tests/unit/studio/{renderers,engine-core}, docx-fonts-family | not run | ditahan instruksi user |

## Verification
- Kunci tampilan doc.json = 0 (script count_display_keys); bab 1 vs bab 2 kunci identik.
- BM terakhir (co4, keadaan kode lebih awal): BM1 100 %, BM2 PASS, BM3 99/102 (18, 93, 94), BM4 0,987382.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| BM3 hlm 93-94 | 1 | glif sebaris seukuran inang membungkus sel E-32 | R-37 diterapkan, belum diukur ulang | ya untuk gerbang D-17 |
| Label SUMBER/KUNCI tanpa spacingTw 12 | 0 | renderer tabel/figur memakai runs apa adanya | diajukan FIX-2 | tidak (BM3 tidak terdampak pada co4) |
| Paritas HTML run semantik | 0 | di luar cakupan waktu | diajukan FIX-2 | tidak |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 3 | K1-K5 (lihat catatan) | untuk dicatat controller |
| 4 | labelRunByMark ditolak validator profil | warna dari glyphRun; permintaan FIX-1 |

## Next Steps
- Ukur ulang D-17 (render_cli docx,pdf + bm_compare) pada keadaan kode akhir; jalankan uji unit renderers/engine-core/docx-fonts-family.
- FIX-2: hapus solusi sementara assemble/bind.ts setelah serializer paket menghormati face XOR faceRole.
