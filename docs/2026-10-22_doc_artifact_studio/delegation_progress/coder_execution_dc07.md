---
task_id: DC-07
task_slug: doc_artifact_studio
row: DC-07
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/masterplan/05_document_contract_specs.md
status: complete
---

# Implementation Report: Layanan kontrak (DC-07)

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca baris DC-07, register 05 §2, §4, §5, §7, §13-§15, §17.1, laporan DC-05, registri C58, D-367/D-371 | complete | |
| 2 | I54 `checkContractRecord` (`validate.ts`, lokasi register §15) | complete | CH-01..CH-04 terhadap set jenis C58 + kalender; EC27 positions 1-based |
| 3 | I55 `resolveContractRefs` + `ContractRefReader` + reader Prisma baca-saja | complete | EC25 DOCUMENT/REVISION, EC26, CW-01 |
| 4 | I56 `projectContractRows`, I57/I58 teks polos | complete | murni, deterministik |
| 5 | Uji murni dc07 + asap reader Prisma baca-saja | complete | berkas asap sementara dihapus setelah dijalankan |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/lib/studio/services/contracts/validate.ts | add | I54 |
| src/lib/studio/services/contracts/refs.ts | add | I55 + antarmuka reader (batch, tanpa N+1) |
| src/lib/studio/services/contracts/prisma-reader.ts | add | reader Prisma: StudioDocument + StudioDocIdentity, klien boleh disuntik (transaksi 9a / R08 READ ONLY); galat DB dicatat ke log tahan lama lalu dilempar ulang |
| src/lib/studio/services/contracts/project.ts | add | I56: baris M19/M20/M21 (tanpa id/recordId/createdAt) + cermin MX09 |
| src/lib/studio/services/contracts/text.ts | add | I57/I58 |
| src/lib/studio/services/contracts/dates.ts | add | cek kalender + normalisasi UTC manual (C37, isoDate) |
| src/lib/studio/services/contracts/log.ts | add | JSONL harian `logs/contracts/` via `http/jsonl` (pola services/query/log.ts) |
| src/lib/studio/services/contracts/index.ts | add | barrel murni (reader Prisma diimpor langsung) |
| tests/unit/studio/contracts/dc07-contract-service.test.ts | add | 28 uji |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | exit 0, 0 baris | seluruh repo, termasuk berkas agen paralel saat itu |
| Lint | `npx eslint src/lib/studio/services/contracts tests/unit/studio/contracts` | exit 0 | |
| Unit DC-07 | `npx vitest run tests/unit/studio/contracts` | 28/28 lulus | |
| Suite studio | `npx vitest run tests/unit/studio` | 110 berkas; 2744 lulus, 1 skip, 2 gagal | 2 gagal = `docx-sections.test.ts` (dikenal D-371), bukan regresi DC-07 |
| Asap DB baca-saja | uji sementara `dc07-db-smoke-temp.test.ts` (dihapus) ke `gsp_agent_hq_v21` | lulus | `resolved=2 warnings=[] errs=["CONTRACT_REF_PID_NOT_FOUND/422/-","CONTRACT_REF_NOT_FOUND/422/DOCUMENT","CONTRACT_REF_NOT_FOUND/422/REVISION"]`; hanya findFirst/findMany/findUnique |

## Verification
- §5.8 contoh: skema `[]`, I54 `{ issues: [] }`, I55 resolved 1 tanpa peringatan.
- NV-01..04, 06..08: skema dan I54 sama-sama memberi tepat satu isu dengan checkId + pointer register. NV-09: DISPLAY_FIELD dari skema, I54 tanpa isu. NV-05: lolos skema, I54 `CONTRACT_DATE /payload/reportedAt`. NV-10: 422 EC27 `positions [1, 2]`. NV-11: 422 EC25 `reason DOCUMENT` pointer `/payload/refs/0`. NV-12: 422 EC26 pointer `/payload/refs/0/pid`.
- I56: dua proyeksi atas masukan yang diklon sama (`toEqual`); `reportedAt` `2026-10-30T19:30+07:00` jadi `2026-10-30T12:30:00.000Z`; `contractCardIds` `['t_249c6b84','t_5943d415']` (DC-03 tidak cocok C34).

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| none | - | - | - | - |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 2 | "Dependensi butir": register tidak punya kode untuk ketergantungan pada diri sendiri maupun siklus, dan contoh §5.8 bergantung pada kunci di luar payload (`DC-02`) | Hanya pola C35 per `dependsOn[j]` yang dicek (CONTRACT_PATTERN). Siklus atau ketergantungan pada diri sendiri tidak ditegakkan; kode baru butuh entri register (usulan untuk CQ) |
| 2 | I54 mendapat argumen ketiga opsional `{ pointer }` (bawaan `/payload`) dan `message` per isu, di atas tanda tangan register | Tetap kompatibel dengan register; dibutuhkan untuk bentuk `studio.doc/v2` (`/sections/<slot>`) di DC-08/DC-22 |
| 2 | Pointer `line`/`exitCode` pada jenis bukti yang salah = medan pelanggar (`/evidence/i/exitCode`) | Disamakan dengan pemeta skema DC-05, bukan `/evidence/i` |
| 3 | EC25 `REVISION`: pointer `/payload/refs/n/revisionNo` dan details menambah `revisionNo`, `currentRevisionNo`; I55 menerima argumen ketiga opsional `{ pointer }` | Register hanya memberi contoh untuk DOCUMENT |
| 3 | `position` M21 dibuat 1-based | Disamakan dengan M20 (register tidak menyebut basis untuk M21) |
| 4 | I57: `phase` tanpa `from` ditulis `to` saja; `reportedAt` ditulis `toISOString()` (UTC dengan milidetik) | Register: "medan kosong dilewati" |
| - | Untuk DC-22: `scripts/studio/draft-check.ts` `contractStructureIssues` memakai `positions` 0-based, sedangkan register/I54 1-based. TODO(DC-07) di berkas itu sekarang bisa diganti dengan I54 | Bukan berkas DC-07; diserahkan ke pemilik DC-22 |

## Next Steps
- DC-08: panggil I54 setelah skema (isu dulu, baru EC27) lalu I55 dengan `createPrismaContractRefReader({ db: tx })`; teruskan `warnings`.
- DC-09: tulis `projectContractRows(...)` (`record` + `items`/`refs` nested atau set `recordId`) + `mirror` ke StudioDocument.
- Review disarankan: `validate.ts` (urutan isu dan tumpang tindih dengan skema), `dates.ts`.
