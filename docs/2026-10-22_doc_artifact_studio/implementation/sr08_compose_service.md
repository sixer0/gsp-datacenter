---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: SR-08
date: 2026-10-23
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/05_structural_sections_blueprint.md
status: complete
---

# Implementation Report: Layanan compose (murni)

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Klaim `file_claims.md` (prefiks SR-08) | complete | 3 baris |
| 2 | Validasi struktur §2.7 | complete | `structure.ts` |
| 3 | Pemetaan v2 -> internal (penanda makna, glif R-40, figur tanpa ukuran, label aparatus struktural, profil kolom KC-6) | complete | `inline.ts`, `blocks.ts`, `front.ts` |
| 4 | Snapshot norm/v2 (alamat, pid, penomoran per kunci bab) + baris SR-10 | complete | `snapshot.ts` |
| 5 | Penggabungan kiriman doc/bab/slot, sha lingkup | complete | `merge.ts`, `hash.ts` |
| 6 | Mediasi SR-10: `StructureRows` SR-10, `stripIds` struktural, `setSnapshotRecomposer` | complete | `register.ts`, `context.ts` |
| 7 | Gerbang D-133 | complete | tsc area 0, eslint 0, asap 37/37 |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/lib/studio/services/compose/index.ts | add | Ekspor I45 |
| src/lib/studio/services/compose/types.ts | add | `SkeletonInput`, `StructureInput`, `ComposeInput/Result`, `MergeOptions/Result`, `EmptyDocInput` |
| src/lib/studio/services/compose/structure.ts | add | `validateStructure`, `slotLayout`, `defaultChapterSlot` |
| src/lib/studio/services/compose/merge.ts | add | `mergeSubmission`, `emptyResolvedDoc`, `defaultMeta` |
| src/lib/studio/services/compose/snapshot.ts | add | `composeV2`, `slotState`, `expectedChapterKeys` |
| src/lib/studio/services/compose/blocks.ts | add | Blok v2 -> v1 |
| src/lib/studio/services/compose/inline.ts | add | Run/Inline v2 -> v1, pemecahan glif, label aparatus |
| src/lib/studio/services/compose/front.ts | add | Payload slot -> halaman depan v1 |
| src/lib/studio/services/compose/hash.ts | add | `scopeSha256`, `stripIds` |
| src/lib/studio/services/compose/pids.ts | add | Pembangkit berbenih, pid bab/slot/bagian |
| src/lib/studio/services/compose/context.ts | add | Konteks compose ulang (+) |
| src/lib/studio/services/compose/register.ts | add | Recomposer repositori struktur |
| src/lib/studio/services/compose/errors.ts | add | `composeFail` |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | 0 galat di area | 155 galat di luar area (baris paralel UI/revisions/templates) |
| Lint | `npx eslint src/lib/studio/services/compose` | exit 0, 0 peringatan | |
| Asap | `npx tsx --tsconfig tsconfig.json <scratchpad>/sr08_recompose.ts` | 37/37 PASS | tanpa suite uji (D-133) |

## Verification
- E1 -> alamat 1.1.1, `Tabel 2.1` di 2.1.2, `F:references/1` (PASS).
- 10 kasus negatif SLOT_* memberi kode benar (PASS 10/10), + CHAPTER_KEY_INVALID, PID_CONFLICT, isi slot OMIT.
- Label figur KUNCI/SUMBER dibangkitkan dari `keyRow`/`source` (run pertama), run konten "SUMBER" tidak dipindai (PASS).
- Rekonstruksi baris -> sumber -> compose ulang: sha sama, juga lewat recomposer terdaftar (PASS).

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Mesin masih menata run konten "SUMBER"/"KUNCI" sebagai label | 0 (di luar area) | deteksi teks `isLabelRun` (engine) | file_requests | tidak |
| Sumber tabel DOCX berbentuk runs tanpa PROVENANS | 0 (di luar area) | `sourceRuns` cabang runs | file_requests | tidak |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 2 | I45 `validateStructure(NormSkeletonV2, …)` tidak membawa positionLocked/tiers/admits/maxItems | Menerima `SkeletonInput` (StudioSkeletonV1 lengkap) |
| 5 | I45 `mergeSubmission(current, sub)` tanpa pembangkit pid | Argumen ke-3 `MergeOptions` |
| 4 | Snapshot perlu konteks untuk compose ulang tanpa DB | (+) `snapshot.compose`, file_requests SR-04 |
| 2 | Isi ke slot OMIT | 422 SLOT_UNKNOWN `details.omitted: true` |
| 3 | Label aside bawaan | Registri S11; generic "CATATAN" hipotesis |

## Next Steps
- SR-13 mengimpor `compose/register` dan menulis `result.rows` apa adanya; SR-16/17 merender unit `slot` dan blok `sourceRegisterEntry`/`ruleIndex`/`slotPlaceholder`.
