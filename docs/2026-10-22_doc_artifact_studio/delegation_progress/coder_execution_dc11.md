---
task_slug: doc_artifact_studio
row: DC-11
date: 2026-10-30
agent: coder-execution
status: complete
---

# DC-11 Kelengkapan dokumen ber-contractKind (05 §6.5, BA-11, KD-31)

## Berkas (kepemilikan)
| Berkas | Jenis | Isi |
|---|---|---|
| src/lib/studio/services/completeness/compute.ts | ubah | `contractRequiredChapterKeys(kind, slotKey, sectionType)` (CO wajib dari C58 `outline`, hanya slot berulang kerangka jenis C58); `expectedChapterKeys(..., requiredKeys?)` = CO ∪ outline dokumen (urut alami), sumber `outline`, outline null tidak menghapus CO; `chapterProgress(slot, requiredKeys?)`; `SlotStateInput.slotKey?/contractKind?`; `computeStructure` membaca `input.contractKind` |
| src/lib/studio/services/completeness/types.ts | ubah | `CompletenessInput.contractKind?: string \| null` |
| src/lib/studio/services/completeness/index.ts | ubah | ekspor `contractRequiredChapterKeys` |
| tests/unit/studio/completeness/dc11-contract-completeness.test.ts | baru | 12 uji §6.5 |

Tanpa `contractKind` (atau jenis tak terdaftar) jalurnya identik dengan sebelumnya; SL-08 `record` wajib sudah ditangani logika lama (baris kosong/absen -> EMPTY + `record`), kini dibuktikan uji.

## Bukti
| Cek | Perintah | Hasil |
|---|---|---|
| Uji kelengkapan | `npx vitest run tests/unit/studio/completeness tests/unit/studio/structure/completeness.test.ts tests/unit/studio/structure/completeness-shared.test.ts` | 3 berkas, 108/108 lulus (dc11 + uji lama) |
| Suite studio | `npx vitest run tests/unit/studio` | 121/121 berkas, 2910 lulus, 1 skip, 0 gagal |
| eslint | `npx eslint src/lib/studio/services/completeness tests/unit/studio/completeness` | exit 0 |
| tsc | `npx tsc --noEmit -p .` | exit 0 (repo penuh) |

Kasus terbukti: tanpa record -> EMPTY + `record`; tanpa bab 3 -> INCOMPLETE, `missingRequired = ["content:3"]`, `fullRenderAllowed=false` (dasar 409 DOCUMENT_INCOMPLETE R17); outline setOutline {6,7} ikut expected; outline absen/null/[] tetap menuntut 1..5; lengkap -> COMPLETE.

## Permintaan lintas pemilik (belum disunting; tanpa ini dokumen kontrak dihitung seperti non-kontrak)
| Pemilik | Berkas | Permintaan |
|---|---|---|
| DC-08 | services/ingest/v2.ts (`completenessInputOf` :621) dan ingest/repository.ts :280/:300 bila dipakai jalur kontrak | teruskan `contractKind` (sudah ada di scope :567) ke `CompletenessInput` |
| DC-09 | services/revisions/v2/commit.ts `completenessInput` :113/:224; services/submit/pipeline.ts :334 | teruskan `contractKind` (sudah dibaca :199 / :897) ke `CompletenessInput` |
| controller (compose/R05 tanpa pemilik aktif) | services/compose/snapshot.ts `slotState` :96; app/api/studio/documents/[id]/route.ts `fallbackState` :194 | teruskan `slotKey` + `contractKind` ke `slotStateOf`. Catatan: mengubah state snapshot dokumen kontrak (memengaruhi `snapshotSha256` dokumen kontrak saja; non-kontrak tidak berubah) |

## Isu & keputusan
| Isu / keputusan | Resolusi |
|---|---|
| Registri C58 tidak mengikat outline ke slot tertentu | CO diterapkan ke slot berulang kerangka jenis (cocok slotKey+sectionType = `content`/`chapter`); slot berulang lain tetap aturan lama |
| Jenis tak terdaftar | jatuh ke perilaku non-kontrak (layanan murni); penolakan 422 CONTRACT_KIND tetap di compose |
| 0 bab pada dokumen kontrak | `missingRequired` = `content:1..5` (konsisten dengan aturan outline lama), bukan `content` |
