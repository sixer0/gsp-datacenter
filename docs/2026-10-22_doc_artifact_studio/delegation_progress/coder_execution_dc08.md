---
task_id: DC-08
task_slug: doc_artifact_studio
row: DC-08
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/07_document_contract_blueprint.md
status: needs-review
---

# Implementation Report: validasi kontrak di gerbang by-construction (DC-08)

## Deklarasi berkas
- src/lib/studio/services/ingest/by-construction.ts (modify)
- src/lib/studio/services/ingest/v2.ts (modify: D-376 contractKind ke compose, langkah 6b sebelum compose, I55 di dry-run/pembuatan R04, pointer EC28)
- tests/unit/studio/ingest/dc08-contract-gate.test.ts (BARU)
- Tidak menyentuh: compose/**, submit/pipeline.ts, revisions/v2/commit.ts (milik DC-09), services/contracts (baca saja). Tanpa tulis DB.

Catatan urutan: v2.ts ditulis sebelum laporan ini dibuat. Deklarasinya baru tercatat di sini, tidak sebelum menulis.

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca alur gerbang, pemanggil (v2.ts, pipeline.ts, commit.ts), pemetaan isu R08 (`issuesFromError`), register §5.6/§13/§17.1, laporan DC-07/DC-10 | complete | |
| 2 | Gerbang: target kontrak, I54 (6b), I55 async (9a), urutan 6b -> 9a -> 9 | complete | `assertByConstruction` sinkron kini juga menegakkan 6b |
| 3 | Langkah 6b sebelum compose (`checkContractSource`) | complete | compose DC-10 melempar galat tanpa pointer untuk tanggal tak sah ("jalankan validasi kontrak sebelum compose") |
| 4 | v2.ts: contractKind MX08 (D-376), 6b sebelum compose, I55 (reader Prisma baca saja), pointer EC28 | complete | |
| 5 | Uji dc08 + suite studio + tsc + eslint | complete | |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/lib/studio/services/ingest/by-construction.ts | modify | `ByConstructionInput.contractKind?`, `contractPointer?`; `ByConstructionResult.contract`; `contractKindOfSnapshot`, `contractRecordTargets`, `checkContractSource` (sebelum compose), `checkContractTargets`, `contractCheckError`, `resolveContractTargetRefs`, `assertByConstructionAsync`, `withChartCustomPointer` (EC28). Hanya slot kerangka bertipe `contractRecord` yang terisi pada templat ber-contractKind (MX08, konteks compose, lalu C58 per slug) yang menjadi target |
| src/lib/studio/services/ingest/v2.ts | modify | `templateContractKind` (StudioTemplate.contractKind, dibaca hanya bila kerangka memuat slot contractRecord dan templat bukan di memori) diteruskan ke `composeV2` dan ke gerbang; 6b sebelum compose; I55 lewat `createPrismaContractRefReader` setelah gerbang; `rejectWithDetails` (dry-run: isu ber-checkId dengan `details`; simpan: galat asli dengan details register); EC28 pointer dari kiriman; `IngestResultV2.contractWarnings` (CW-01) |
| tests/unit/studio/ingest/dc08-contract-gate.test.ts | add | 24 uji |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | 0 galat di berkas DC-08 (`grep services/ingest\|tests/unit/studio/ingest` = 0) | Repo: 2 galat di `tests/unit/studio/renderers/dc12-contract-record-html.test.ts:85` (berkas agen lain, `NormBlock.pid`) |
| Lint | `npx eslint src/lib/studio/services/ingest tests/unit/studio/ingest` | exit 0 | |
| Unit DC-08 | `npx vitest run tests/unit/studio/ingest` | 24/24 lulus | |
| Suite studio | `npx vitest run tests/unit/studio` | 118/118 berkas; 2873 lulus, 1 skip, 0 gagal | uji ingest/R08 lama tetap hijau; 2 kegagalan dikenal D-371 tidak muncul lagi pada run ini |

## Verification
- Asap R08 dry-run (`ingestDocument` dryRun, jalur `validateDocument`; Prisma tiruan, `dbWrites()` = []):
  - status `running`: `valid:false`, isu `CONTRACT_ENUM` di `/document/sections/record/status`;
  - `reportedAt 2026-02-30`: isu `CONTRACT_DATE` di `/document/sections/record/reportedAt` (lolos skema, ditahan 6b sebelum compose);
  - pid tidak ada: isu `CONTRACT_REF_PID_NOT_FOUND` di `.../refs/0/pid` dengan `details {pointer, documentId, pid}`;
  - dokumen tidak ada: `CONTRACT_REF_NOT_FOUND` dengan `reason DOCUMENT`;
  - pid pensiun: tanpa isu kontrak, `contractWarnings` = CW-01.
  - Bukan dry-run: EC26 422 dilempar dengan details register.
- Gerbang murni: NV-01 400, NV-05 400, NV-10 422 EC27 `positions [1,2]`, NV-11 EC25, NV-12 EC26; urutan 6b mendahului 9a (reader tidak dipanggil).
- Non-kontrak (E1 DATUM): `contract` kosong, reader tidak dipanggil, hasil async = sinkron.
- EC28: `details.pointer` = `/document/sections/content/chapters/0/sections/0/blocks/2`, `form/dataShape/supported` tetap utuh.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| I55 (EC25/EC26), 6b sebelum compose, dan pointer EC28 belum berlaku di R12, R13, R16, R06, R14, R04 bertarget/misi, maupun dry-run slot/bab R08 | 0 (di luar kepemilikan) | Gerbang sinkron dan dipanggil dari pipeline.ts/commit.ts (milik DC-09). I/O I55 butuh `await` di pemanggil | Saat ini jalur tersebut hanya mendapat 6b pasca-compose lewat `assertByConstruction` | ya, untuk cakupan penuh baris |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 2 | Isu I54 = 400 `SCHEMA_INVALID` (`keyword` = checkId, sama dengan DC-23). EC27/25/26 dilempar sebagai `StudioEngineError` dengan details register | Ikut register §5.6 |
| 3 | 6b dijalankan sebelum compose. Alasannya: compose kontrak DC-10 mengandaikan payload sudah valid | `checkContractSource` publik untuk dipakai pemanggil compose |
| 4 | I55 di v2.ts memakai prisma global, baca saja, di luar transaksi. Jalur yang dipakai: R04 pembuatan dan dry-run R08 dokumen baru | Penulisan tetap digerbang ulang di pipeline (DC-09) |
| 4 | CW-01 R04/R08 dokumen baru diletakkan di `IngestResultV2.contractWarnings` | Route validate belum meneruskannya ke `submitPreview.warnings`. Medan itu ada di jalur parsial/pipeline |

## Next Steps
- Permintaan ke DC-09 untuk pipeline.ts `applyInLock` dan commit.ts `commitV2Revision`:
  - (a) panggil `checkContractSource(mergedSource, skeleton.slots, { contractKind, contractPointer })` dan `contractCheckError` sebelum `composeV2`;
  - (b) ganti `assertByConstruction(...)` dengan `await assertByConstructionAsync({ ...sama, contractKind, contractPointer, contractRefs: createPrismaContractRefReader({ db: tx, correlationId }) })`. Untuk kiriman slot, `contractPointer: (k) => k === plan.slotKey ? "/payload" : "/sections/" + k`;
  - (c) teruskan `gate.contract.warnings` ke `warnings` respons dan ke `submitPreview.warnings` R08;
  - (d) bungkus galat compose dengan `withChartCustomPointer(err, mergedDoc)` untuk pointer EC28.
- Review recommended: by-construction.ts dan v2.ts, khususnya urutan galat dan ketiadaan perubahan pada dokumen non-kontrak.
