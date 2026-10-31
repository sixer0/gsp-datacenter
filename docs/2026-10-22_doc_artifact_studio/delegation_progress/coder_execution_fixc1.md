---
task_slug: doc_artifact_studio
row: FIX-C1
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/gateway_check/11_contract_integration_gate.md (M1), decisions D-392
status: complete
---

# FIX-C1: urutan evaluasi kontrak (I54) sebelum cek lingkup/basis

## Akar masalah
Dibuktikan dengan uji merah sebelum perbaikan. Di `services/submit/pipeline.ts` `applyInLock`, I54 (`checkContractSource` lalu `checkContractTargets` -> `checkContractRecord`, `by-construction.ts:257`) dipanggil sesudah blok idempoten, `assertNoPatchedOverwrite` (FIX-H2) dan `checkBase` §9.2, yang semuanya merupakan langkah 7 dan menghasilkan 409 `SCOPE_CONFLICT`. Register 05 §5.6 (baris tabel "6b (struktur, murni, sebelum kunci) | I54") dan 03 §11.1 (langkah 7 "Di dalam kunci: lingkup dan pid (409 `SCOPE_CONFLICT` ...)", amandemen DOC-5 "langkah 2 menambah checkId CH-01..CH-05 ...; langkah 6b (murni, sebelum kunci) I54") menempatkan I54 sebelum langkah 7.

## Perubahan
| Berkas | Jenis | Uraian |
|---|---|---|
| src/lib/studio/services/submit/pipeline.ts | modify | Blok `skeletonContractKind` + `contractPointer` + `contractCheckError(checkContractSource(...))` dipindah dari sesudah `checkBase` ke tepat sesudah `mergeSubmission` (langkah 6), sebelum idempoten/FIX-H2/§9.2. Ini pemindahan, bukan penambahan. Komentar kepala diperbarui. Berlaku juga untuk R08 dry-run dan R04 bertarget (fungsi yang sama). |
| tests/unit/studio/api-structure/fixc1-contract-order.test.ts | add | 5 uji DB v21 nyata (harness SR-45, fixture 0 sisa) |

Yang tidak diubah:
- `services/ingest/by-construction.ts` tidak diubah. Gerbang tetap memanggil I54 di `evaluateByConstruction`, sama seperti sebelumnya (pre-existing, murni, hasil identik). Jumlah evaluasi I54 per kiriman tidak berubah.
- `services/revisions/v2/commit.ts` tidak diubah, karena urutan internalnya sudah sesuai §5.6: `validateStructure` (6) -> I54 (6b) -> compose -> I55 (9a) -> gerbang (9), tanpa cek lingkup di dalamnya.
- I55 tetap di 9a (di dalam tx, sebelum by-construction), sesuai baris §5.6 "9a (dalam transaksi, sebelum by-construction) | I55".
- R04 tanpa target (`ingest/v2.ts:574`) sudah menjalankan I54 sebelum merge dan tidak punya cek lingkup.

## Uji dan verifikasi
| Uji | Perintah | Hasil |
|---|---|---|
| Regresi sebelum perbaikan (pipeline.ts di-checkout) | `npx vitest run tests/unit/studio/api-structure/fixc1-contract-order.test.ts` | 3 gagal / 2 lulus (409 alih-alih 400/422; R08 SCOPE_CONFLICT) |
| Regresi sesudah perbaikan | sama | 5/5 lulus |
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | exit 0 |
| Lint berkas tersentuh | `npx eslint <pipeline.ts> <uji fixc1>` | exit 0 |
| Suite Studio | `npx vitest run tests/unit/studio` | 130 berkas lulus; 2964 lulus / 1 skip / 0 gagal |
| Asap :9021 doc A `cmvuz4mn70001v1jgoom5m4qw` (rev 7, base 6 basi, slot record) | curl POST /api/studio/slots | reportedAt 2026-02-30 -> 400 SCHEMA_INVALID checkId CONTRACT_DATE (cid ef221a58-4572-4230-8a2c-b2f190d89503); kunci ganda -> 422 CONTRACT_ITEM_KEY_DUPLICATE positions [1,2] (cid 1933ad74-d069-41bb-980e-e5f96d52f1c6); payload sah -> 409 SCOPE_CONFLICT changedInRevisionNo 7 (cid 77e3d680-adf3-4760-a060-11db881de821); R08 /validate reportedAt tak sah -> valid:false isu CONTRACT_DATE (cid c8a49882-a534-4777-96d9-89877916ecb3); revisionNo sesudah = 7 (0 tulis) |

Cakupan uji non-kontrak: dokumen `datum-gsp` dengan base basi dan bab berubah tetap menghasilkan 409 SCOPE_CONFLICT.

## Isu & keputusan
| Langkah | Isu / Keputusan | Resolusi |
|---|---|---|
| Penempatan | I54 diletakkan sebelum cek idempoten, karena 03 §11.1 memasukkan idempoten sha ke langkah 7. Untuk templat kontrak, jalur `unchanged` kini menjalankan 1 kueri MX08 (`skeletonContractKind`); non-kontrak tetap tanpa kueri. | Diterapkan |
| Sisa | `PID_CONFLICT` dari `mergeSubmission` (langkah 7) masih mendahului I54, karena merge menyatukan langkah 6 dan 7. Tidak tercakup M1. | Dicatat; tidak diubah |
| Sisa | R16/R06/R14: cek lingkup pid/struktur ada di `revisions/v2/service.ts` (di luar kepemilikan), sebelum `commitV2Revision`. §11.1 mengatur urutan kiriman, bukan sunting. | Dicatat untuk controller |

## Langkah berikut
- Review direkomendasikan untuk lingkup `pipeline.ts` `applyInLock`. Tidak ada commit.
