---
task_id: DC-09
task_slug: doc_artifact_studio
row: DC-09
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/masterplan/05_document_contract_specs.md
status: complete
---

# Implementation Report: Persistensi kontrak M19-M21 + MX09 + baris M17 butir (DC-09; + D-382, D-383)

## Deklarasi berkas (ditulis sebelum kode)
- src/lib/studio/services/structure/rows.ts (modify)
- src/lib/studio/services/structure/contract.ts (BARU; sengaja TIDAK diekspor dari barrel `structure/index.ts` agar barrel tidak memuat klien Prisma lewat `contracts/prisma-reader`)
- src/lib/studio/services/revisions/v2/commit.ts (modify)
- src/lib/studio/services/submit/pipeline.ts (modify: HANYA contractKind ke composeV2)
- tests/unit/studio/structure/dc09-contract-rows.test.ts (BARU)
- `structure/index.ts` tidak disentuh.

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca register 05 §2 KD-34, §5.7, §7.1-§7.2, §7.6, §15, BA-09; 03 §4.6, §9.1, §10; laporan DC-07/DC-10; D-365/D-375/D-376 | complete | |
| 2 | rows.ts: `F:<slot>` contractRecord (textPlain I57) + `F:<slot>/<n>` contractItem per butir (isi = butir, textPlain I58); pid butir per `key` (`inheritItemPids`) | complete | butir hilang: pid tidak ada di baris n+1 -> dipensiunkan `syncIdentities` repositori (03 §10) |
| 3 | structure/contract.ts: `templateContractKind` (MX08) + `writeContractRows` (I55 di tx, I56, `studioContractRecord.create` + createMany butir/rujukan, kembalikan cermin MX09) | complete | log tahan lama `structureLog`/`logStructureError` (sink struktur) |
| 4 | commit.ts: contractKind -> composeV2; `writeContractRows` sesudah cek rekonstruksi; cermin digabung ke `updateMany` dokumen (satu pembaruan, penjaga optimis tetap) | complete | |
| 5 | pipeline.ts: contractKind -> composeV2 saja | complete | |
| 6 | Uji unit + asap transaksi-rollback v21 + suite | complete | |
| 7 | D-382 di pipeline.ts dan commit.ts: (1) `checkContractSource` + `contractCheckError` sebelum compose; (2) `await assertByConstructionAsync({..., contractKind, contractPointer, contractRefs: createPrismaContractRefReader({ db: tx, correlationId })})`; (3) `gate.contract.warnings` -> `TxOutcome.warnings` -> `SubmitResultV2.warnings` (nyata dan dry-run) / `CommitOutput.warnings`; (4) `withChartCustomPointer` atas galat compose (dan rethrow gerbang non-BY_CONSTRUCTION di pipeline) | complete | semua helper diekspor `by-construction.ts`; tidak ada permintaan ekspor |
| 8 | D-383: `writeContractRows` di pipeline sesudah `assertRevisionReconstructs`; `mirror` digabung ke `studioDocument.update` | complete | rujukan dari gerbang 9a (`resolvedRefs: gate.contract.refs`), jadi tidak ada kueri I55 kedua; sama di commit.ts |
| 9 | Nol kueri baru untuk dokumen non-kontrak: `skeletonContractKind` hanya mengkueri MX08 bila kerangka memuat slot contractRecord | complete | sebelumnya `templateContractKind` dikueri tanpa syarat (diperbaiki) |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/lib/studio/services/structure/rows.ts | modify | cabang `contractRecord` di `rowsFromSource`; `inheritItemPids`, `CONTRACT_ITEM_ROW_TYPE` (ekspor); `freshItemPid` (allocator deterministik berbasis alamat tidak boleh menggandakan pid warisan); `contractTextPlain` (payload belum lolos I54 jatuh ke `plainText`, pemetaan tetap total) |
| src/lib/studio/services/structure/contract.ts | add | MX08 reader + tulis M19-M21 + cermin MX09; non-kontrak = `mirror: null` tanpa akses DB; record kosong = cermin `contractKind` saja |
| src/lib/studio/services/revisions/v2/commit.ts | modify | lihat step 4 |
| src/lib/studio/services/submit/pipeline.ts | modify | contractKind (bersyarat kerangka) -> compose; 6b sebelum compose; gerbang async + reader tx; EC28 pointer; warnings; tulis M19-M21 + MX09 (D-383). Pointer kontrak: kiriman slot `/payload`, selain itu `/sections/<slot>` |
| tests/unit/studio/structure/dc09-contract-rows.test.ts | add | 10 uji (termasuk nol akses DB untuk kerangka non-kontrak) |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | exit 0, 0 baris | se-repo |
| Lint | `npx eslint src/lib/studio/services/structure src/lib/studio/services/revisions/v2/commit.ts src/lib/studio/services/submit/pipeline.ts tests/unit/studio/structure/dc09-contract-rows.test.ts` | exit 0 | |
| Unit DC-09 | `npx vitest run tests/unit/studio/structure/dc09-contract-rows.test.ts` | 10/10 | |
| Suite studio (sesudah D-382/D-383) | `npx vitest run tests/unit/studio` | 120 berkas lulus; 2898 lulus, 1 skip, 0 gagal | |
| Typecheck ulang | `npx tsc --noEmit -p tsconfig.json` | exit 0, 0 baris | galat `dc12-contract-record-html.test.ts:85` yang disebut controller tidak muncul lagi; DC-09 tidak mengubah tipe `NormBlock` |
| Asap pipeline | berkas sementara `dc09-zz-pipeline-smoke-temp.test.ts` (DIHAPUS), satu tx v21 lalu ROLLBACK; `$transaction` pipeline dijalankan di tx yang sama; `SET TRANSACTION READ ONLY` dry-run dibuat no-op | lulus | |
| Asap DB | berkas sementara `tests/unit/studio/structure/dc09-zz-db-smoke-temp.test.ts` (DIHAPUS sesudah jalan), satu `$transaction` v21 lalu `throw` ROLLBACK | lulus | `current_database()` = `gsp_agent_hq_v21`; `@/lib/prisma` diarahkan ke klien tx selama asap agar `resolveTemplateVersion` melihat fixture tx |

## Verification (asap, keluaran dikutip)
- Fixture di tx: section type `contractRecord` (belum di-seed di v21), templat `dc09-smoke-*` contractKind `agentWorkReport` + kerangka SL-08..SL-10 via `writeSkeleton`, dokumen + revisi 1 kosong; revisi 2-4 lewat `commitV2Revision`.
- Rev 2 (contoh §5.8): M19 1 (`status complete`, `reportedAt 2026-10-30T12:30:00.000Z`, `itemCount 2`, `cardIds ["t_249c6b84"]`); M20 `[[1,"t_5943d415","p-4ncf4a9gt9","done"],[2,"DC-03","p-nfh2rnwjjg","ready"]]` = pid baris M17 `F:record/1`, `F:record/2`; M21 `[[1,"basis","cmvui0qun000qv11gtygb1mk9","p-8rj0w4aw6r"]]`; MX09 `{kind agentWorkReport, status complete, owner data-analyst, taskRef DC-02, due null, cards ["t_249c6b84","t_5943d415"]}`; `assertRevisionReconstructs` (03 §4.6, di dalam commit dan diulang eksplisit) lulus.
- Rev 3 (DC-03 pindah ke posisi 1, t_5943d415 hilang, DC-04 baru): DC-03 tetap `p-nfh2rnwjjg`; DC-04 `p-fhxjadwpke` baru; identitas pid t_5943d415 `retiredRevisionNo = 3`; MX09 status `partial`, cards `["t_249c6b84"]`.
- Rev 4 (slot record dikosongkan): M19 0; MX09 `{kind agentWorkReport, status/owner/taskRef/due null, cards []}`.
- Hitungan: sebelum `{m19 0, m20 0, m21 0, docs 6, revs 38, tpl 6, identities 598, blocks 2251, sectionTypes 51}`; dalam tx `{2, 4, 2, 7, 42, 7, 605, 2260, 52}`; sesudah ROLLBACK identik dengan sebelum + `smokeTpl 0, smokeDocs 0, smokeRevs 0` -> 0 baris tersisa.
- Non-kontrak: `writeContractRows` dengan contractKind null/undefined = `mirror null` tanpa satu pun akses DB (uji Proxy pelempar); compose tanpa contractKind -> konteks snapshot tidak berubah (spread kondisional).

### Asap pipeline (D-382/D-383), keluaran dikutip
- `submitSlot` §5.8 (membuat dokumen, revisi 1): M19 1; M20 `[[1,"t_5943d415","p-g5kdf2pgpv"],[2,"DC-03","p-6k084bgksf"]]` = pid baris M17 `F:record/1`, `F:record/2`; M21 `[[1,"basis","cmvui0qun000qv11gtygb1mk9","p-8rj0w4aw6r"]]`; MX09 `{agentWorkReport, complete, data-analyst, DC-02, due null, ["t_249c6b84","t_5943d415"]}`; `warnings` absen.
- `submitChapter` (revisi 2): salinan penuh M19 1 dengan pid butir sama, refs 1.
- Gerbang: dry-run status `running` -> isu `CONTRACT_ENUM` `/payload/status`; kiriman nyata -> `SCHEMA_INVALID` 400. Dry-run pid `p-zzzzzzzzzz` -> isu `CONTRACT_REF_PID_NOT_FOUND` `/payload/refs/0/pid`; kiriman nyata -> `CONTRACT_REF_PID_NOT_FOUND` 422 (pointer sama). Dokumen tetap di revisi 2.
- Hitungan: sebelum `{m19 0, m20 0, m21 0, docs 6, revs 38, tpl 7, identities 598, blocks 2251, sectionTypes 52}`; dalam tx `{2, 4, 2, 7, 40, 8, 604, 2258, 52}`; sesudah ROLLBACK identik dengan sebelum + `smokeTpl/smokeDocs/smokeRevs 0`. Catatan: `tpl 7`/`sectionTypes 52` di awal menandakan templat dan section type kontrak kini sudah di-seed agen lain.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Asap pertama: hitungan global `revs`/`blocks` berubah | 1 | harness SR-45 agen paralel (`agent:sr45-agen-01-*`) menulis+membersihkan fixture bersamaan | asap ulang memakai penanda asap + tabel kontrak; jalan terakhir tanpa aktivitas paralel: semua hitungan identik | Tidak |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 1 | Jalur kiriman pipeline belum menulis M19-M21 (brief awal) | Diselesaikan D-383: `writeContractRows` dipasang di pipeline; dry-run berhenti sebelum tulis |
| 7 | `CommitOutput.warnings` (R16/R06/R14) belum diteruskan ke respons route, karena `revisions/v2/service.ts` bukan milik DC-09 | Permintaan: service.ts meneruskan `out.warnings` ke respons |
| 7 | R08 `submitPreviewOf` (`app/api/studio/validate/_shared/dry-run.ts`) belum menyalin `result.warnings` ke `submitPreview.warnings` (AM-08) | Permintaan ke pemilik route validate; pipeline sudah mengisi `SubmitResultV2.warnings` pada dry-run |
| 2 | Baris `F:record` tetap ada bersama baris butir (tabel §5.7 memuat keduanya) | |
| 3 | Rujukan di-resolve ulang di commit (I55, `pointer /sections/<slot>/refs`) karena M21 butuh `targetDocumentId`; galat EC25/EC26 menahan tulis; peringatan CW-01 hanya dihitung di log (CommitOutput tidak membawa `warnings`) | |
| 3 | Cermin MX09 digabung ke `updateMany` penjaga optimis yang sudah ada, bukan update kedua | |

## Next Steps
- Pemilik `revisions/v2/service.ts` dan route validate: teruskan `warnings` (lihat Issues 7).
- Review disarankan: `structure/rows.ts` cabang contractRecord dan `structure/contract.ts`.
