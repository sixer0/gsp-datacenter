---
task_id: DC-06
task_slug: doc_artifact_studio
row: DC-06
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/07_document_contract_blueprint.md (register masterplan/05_document_contract_specs.md)
status: needs-review
---

# Implementation Report: DC-06 registri kontrak

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Section type `contractRecord` S30 + pin 51->52, DOCUMENT 29->30 (05 §6.1, AM-10) | complete | satu deviasi `activeTiers` (lihat Issues) |
| 2 | Jenis slot `contractRecord` (AM-01 8->9, AM-11) | complete | |
| 3 | Registri baru C58 `registry/contracts.ts`, 1 entri `agentWorkReport` | complete | `satisfies Record<ContractKind, ...>`: anggota E44 tanpa entri = tsc gagal (05 §1.3) |
| 4 | Validator CH-06 `contractRecordSkeletonIssues` (slots.ts) | complete | murni; belum dikaitkan ke simpan templat (bukan berkas DC-06) |
| 5 | Barel `registry/index.ts` (+ contracts; D-368 chart.custom eksplisit) | complete | charts.ts tidak disentuh |
| 6 | Uji `tests/unit/studio/registry/dc06-contract-registry.test.ts` | complete | 29 uji |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/lib/studio/registry/contracts.ts | add | C58 `CONTRACT_KIND_DEFS`, `CONTRACT_KIND_DEF_BY_KIND`, `isContractKind`, `getContractKindDef`, `requiredOutlineChapterKeys`, `CONTRACT_RECORD_SECTION_TYPE`; alias GA 54 / GL 11 / GF 12 / GS 9 / GI 12 / GV 5 |
| src/lib/studio/registry/sections.ts | modify | entri S30 + pin 52 / DOCUMENT 30 |
| src/lib/studio/registry/slots.ts | modify | `contractRecord` di C33 + SLOT_KINDS; `contractRecordSkeletonIssues`, `CONTRACT_SKELETON_POINTER_BASE` |
| src/lib/studio/registry/index.ts | modify | `export * from "./contracts"`; ekspor bernama chart.custom (D-368) |
| tests/unit/studio/registry/dc06-contract-registry.test.ts | add | ekspektasi literal register |
| tests/unit/studio/renderers/docx-sections.test.ts | modify | HANYA patok 29 -> 30 (baris 60) |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| typecheck | `npx tsc --noEmit` | 0 galat pada berkas DC-06 | run akhir exit 2 karena berkas agen lain: `tests/unit/studio/draft/dc22-draft-check.test.ts` (TS2741 x4) dan `tests/unit/studio/figures/dc27-chart-custom.test.ts:190` (TS2322); run sebelum berkas itu muncul exit 0 |
| lint | `npx eslint src/lib/studio/registry <2 uji>` | exit 0 | |
| unit DC-06 | `npx vitest run tests/unit/studio/registry` | 2 berkas, 53/53 lulus | termasuk dc26 |
| unit studio | `npx vitest run tests/unit/studio` | 105 berkas: 2658 lulus / 1 skip / 2 GAGAL | baseline sebelum edit: 100 berkas 2564 lulus / 0 gagal |

## Verification
- Pin = panjang array: SECTION_REGISTRY 52, DOCUMENT 30 / PAGE_DEVICE 7 / CHANNEL 15 (uji dc06 "pin ...").
- agentWorkReport berkerangka SL-08..SL-10, outline CO-01..CO-05, status persis E45 `draft, complete, partial, blocked, needs-review` + label CS (uji dc06).
- CH-06: tanpa contractKind / kind tak terdaftar / ganda / repeatable -> isu `SKELETON_CONTRACT_RECORD` di `/template/skeleton/slots/<i>`.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| `docx-sections.test.ts` 2 uji gagal: `DOCX_RENDERERS.contractRecord` tidak ada (baris 62) dan 4 fixture tidak memuat `contractRecord` (baris 68) | 1 | uji mematok "setiap section DOCUMENT punya perender DOCX + tercakup fixture"; bukan angka patok, di luar izin edit | terbuka; perlu perender/fixture (DC-10/DC-13) atau pengecualian di uji (pemilik uji) | ya untuk "suite hijau" |
| Skrip `tests/parity/fixtures/src/validate_fixtures.ts:349` akan melaporkan `contractRecord` tidak tercakup | 0 (tidak dijalankan) | sama | terbuka | tidak (skrip, bukan vitest) |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 1 | Register §6.1 `activeTiers` = semua tier memecah 95 uji (R04/R08/R09/revisions/fix1): `canonicalSectionPlan` (templates/profile.ts:153) menjadikan contractRecord opsional -> `implicitSkeleton` menambah slot `record` di templat non-kontrak -> compose `snapshot.ts:454` "Jenis slot contractRecord tidak dikenal" | DEVIASI: `activeTiers: []` (terlarang di rencana kanonik, sesuai CH-06). Opsi user/controller: (a) terima deviasi; (b) kembalikan semua tier + pemilik profile.ts/skeleton.ts mengecualikan contractRecord dari rencana kanonik/kerangka implisit |
| 4 | CH-06 belum dipancarkan jalur simpan templat (`services/skeleton/skeleton.ts` / R19 / seed tidak dimiliki DC-06) | permintaan: pemilik baris itu memanggil `contractRecordSkeletonIssues(slots, template.contractKind)` dan melempar 400 SCHEMA_INVALID. SKELETON_SECTION_TYPE/REPEATABLE lama sudah menahan ganda/berulang |
| 4 | contractKind tidak terdaftar diperlakukan = tanpa contractKind | tafsir; dicatat |
| 3 | Nama di luar register: `CONTRACT_KIND_DEF_BY_KIND`, `isContractKind`, `getContractKindDef`, `requiredOutlineChapterKeys`, `CONTRACT_RECORD_SECTION_TYPE`, `contractRecordSkeletonIssues`, `CONTRACT_SKELETON_POINTER_BASE`; tata bahasa tujuan alias `content:<n>` / `references` / medan / `a+b` | dicatat untuk register (DC-32) |
| 1 | `SECTION_REGISTRY_VERSION` tidak dinaikkan | keputusan seed milik DC-29 |

## Next Steps
- Keputusan deviasi `activeTiers` (a/b); nasib 2 uji docx-sections; pengaitan CH-06 ke simpan templat. Review recommended: registry/** delta DC-06.
