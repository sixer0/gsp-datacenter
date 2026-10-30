---
task_slug: doc_artifact_studio
row: DC-WIRE (+ D-387)
date: 2026-10-30
agent: coder-execution
status: complete
---

# DC-WIRE: penerusan konteks kontrak (D-386, D-387; register 05 §6.5, AM-08, AM-09, KD-46)

## Berkas
| Berkas | Jenis | Isi |
|---|---|---|
| src/lib/studio/services/ingest/v2.ts | ubah | `computeCompleteness({...completenessInputOf(...), contractKind})` dengan contractKind yang sudah dibaca (:567; hanya bila kerangka memuat contractRecord) |
| src/lib/studio/services/revisions/v2/commit.ts | ubah | contractKind (langkah 2, `skeletonContractKind`) ke `CompletenessInput` |
| src/lib/studio/services/submit/pipeline.ts | ubah | `completenessOf(..., contractKind)`; jalur utama = contractKind yang sudah dibaca; jalur idempoten (`unchanged`, sebelum pembacaan MX08) = `document.contractKind` (cermin MX09 baris yang sudah terbaca) -> nol kueri baru |
| src/lib/studio/services/compose/snapshot.ts | ubah | `slotState(slot, payload, omitted, contractKind?)` meneruskan `slotKey` + `contractKind` (= `input.contractKind`) ke `slotStateOf` hanya bila ada |
| src/app/api/studio/documents/[id]/route.ts | ubah | `fallbackState` menerima `doc.contractKind` (MX09, baris sudah terbaca); D-387: findMany berkas keluaran `include: OUTPUT_FILE_OWNER_INCLUDE` (mapper `toOutputFileDto` sudah dipakai) |
| src/lib/studio/services/revisions/v2/service.ts | ubah | `PatchPidResult.warnings?` + `StructureResult.warnings?` (BARU, opsional, hanya bila tidak kosong; register tak punya medan ini di R16/R06/R14) dari `CommitOutput.warnings`. R06 ikut lewat spread `{...r}` di revisions/index.ts; route R16/R14 `json(result)` apa adanya |
| src/app/api/studio/validate/_shared/dry-run.ts | ubah | `SubmitPreview.warnings?` + `submitPreviewOf` menyalin `result.warnings` (AM-08) |
| tests/unit/studio/compose/dcwire-snapshot-state.test.ts | baru | 7 uji: sha E1/probe = nilai direkam SEBELUM perubahan; kontrak tanpa bab CO -> PARTIAL |
| tests/unit/studio/api/dcwire-wire.test.ts | baru | 5 uji: submitPreviewOf warnings; R05 cadangan kontrak PARTIAL / non-kontrak FILLED; include pemilik + finalFileName |

## Bukti
| Cek | Perintah | Hasil |
|---|---|---|
| tsc | `npx tsc --noEmit -p tsconfig.json` | exit 0 |
| eslint | `npx eslint <7 berkas> <2 uji>` | exit 0 |
| Uji baru | `npx vitest run tests/unit/studio/compose/dcwire-snapshot-state.test.ts tests/unit/studio/api/dcwire-wire.test.ts` | 7/7, 5/5 |
| Suite studio | `npx vitest run tests/unit/studio` | 125/125 berkas, 2945 lulus, 1 skip, 0 gagal |
| sha non-kontrak | baseline direkam sebelum suntingan (E1 `265cb783…`, probe `664c5576…`) vs sesudah | identik; kontrak `f661e308…` -> `f4b1c072…` (content FILLED -> PARTIAL) |
| Asap v21 (tx ROLLBACK) | berkas sementara `api-structure/dcwire-zz-smoke-temp.test.ts` (DIHAPUS), `@/lib/prisma` -> klien tx, `setReadOnly` dry-run no-op, pid identitas lain dipensiunkan di tx | lulus; `current_database()` = gsp_agent_hq_v21 |

Asap (keluaran dikutip): slot record laporan-kerja-agen -> 201, INCOMPLETE `content:1..5`, warnings `CONTRACT_REF_PID_RETIRED`; bab 1,2,4,5 lewat pipeline -> INCOMPLETE, `missingRequired ["content:3"]`, fullRenderAllowed false, kolom dokumen INCOMPLETE; R05 INCOMPLETE `content:3`, state content PARTIAL; R16/R06/R14 200 dengan `warnings ["CONTRACT_REF_PID_RETIRED"]`; R08 dry-run slot -> `submitPreview.warnings ["CONTRACT_REF_PID_RETIRED"]`, completenessPreview `content:3`. Hitungan 12 tabel sebelum = sesudah, smokeDocs 0, identitas pensiun 0 (diperiksa ulang sesudah).

## Issues & Decisions
| Langkah | Isu / keputusan | Resolusi |
|---|---|---|
| R16/R06/R14 | Register tidak punya medan `warnings` di respons ini | ditambah opsional (pola AM-08/KD-46: hanya bila tidak kosong) |
| Jalur idempoten pipeline | contractKind dibaca SESUDAH return idempoten | pakai `document.contractKind` (MX09) tanpa memindah/menambah kueri |
| D-387 AM-09 wajib | Uji coba `finalFileName: string` -> tsc gagal di `services/storage/files.ts:100` (mapper DC-18/20: spread bersyarat, `finalFileNameOfRow` dapat `undefined`) | DIBIARKAN OPSIONAL (api.ts dipulihkan apa adanya). Semua pengisi kini memuat pemilik (R17, R10, R09 artefak, R05), tetapi tipe mapper masih `string \| undefined`; pemilik files.ts perlu menjamin string sebelum medan dijadikan wajib |
| Lintas pemilik | `services/ingest/repository.ts:280/:300` menghitung ulang kelengkapan saat persist ingest dokumen TANPA contractKind (PreparedV2 tak membawanya) | tidak disunting (bukan milik); dokumen kontrak lewat ingest R04 tersimpan dengan kelengkapan non-kontrak sampai diteruskan |

## Next Steps
- Pemilik storage/files.ts: jamin `finalFileName` string -> jadikan AM-09 wajib.
- Pemilik ingest/repository.ts: teruskan contractKind (mis. lewat PreparedV2) ke dua `computeCompleteness`.
