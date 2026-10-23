# Catatan coder-execution SR-20 (route dokumen + validasi)

Status: complete. Tanggal 2026-10-23.

Berkas (klaim SR-20 di `file_claims.md`):
- `src/app/api/studio/documents/route.ts`: R04 POST dispatch `$schema`. v2: skema ajv + `classifySchemaV2Errors` (400 DISPLAY_FIELD/V1_FIELD) -> `ingestDocument` SR-12 tingkat atas (kepercayaan, batas, compose, by-construction, simpan lewat `submitDocumentV2` SR-13) -> `result.submit` 201/200 unchanged; `renderRefused` ditambal bila absen (KD-27). v1: ingest adaptor + `completeness` (hasil ingest, cadangan kolom revisi) + `renderRefused` (dari ingest, revisi INCOMPLETE, atau render melempar DOCUMENT_INCOMPLETE). chapter/slot v2 -> 400 SCHEMA_INVALID `/$schema` + petunjuk R12/R13. GET `?docKey=` (missionDocKey) + per item `docKey`, `completeness {status, missingRequired}`.
- `src/app/api/studio/documents/[id]/route.ts`: R05 + `slots: SlotNodeV2[]` (M14-M17 + pid M18; urutan/state/label dari laporan kelengkapan, OMITTED ikut), `completeness` = `completenessReport` revisi; `tree` v1 tetap; revisi + `schemaId`, `changeScope`, `completeness`.
- `src/app/api/studio/validate/route.ts`: R08 v2 (tingkat atas atau `{schemaId, spec}`): skema v2 -> doc v2 dry-run ingest -> `completenessPreview`; bab/slot v2 = skema saja; v1 kini juga `completenessPreview`; pratinjau HTML snapshot norm/v2 -> `previewError PREVIEW_UNAVAILABLE` (SR-17).
- `src/app/api/studio/validate/_shared/v2-kit.ts` (baru): `schemaRootOf`, `validateV2`, `v2SchemaError`, `asCompletenessReport`, `completenessBrief`, `renderRefusedOf`.

Bukti:
- tsc seluruh repo: 5 galat, 0 di area (luar area: `src/components/studio/document-viewer/index.ts` x4, `benchmark/harness/run/lib/pipeline.ts` x1).
- `npx eslint <4 berkas>` -> exit 0, 0 peringatan.
- Asap handler (tsx, Request buatan, DB v21 baca saja, tanpa tulis): 14/14 PASS, antara lain R04/R05/R08 anonim 401; R08 E1 200 valid:true + completenessPreview; R04 v2+format 400 SCHEMA_INVALID DISPLAY_FIELD pointer `/sections/content/chapters/0/sections/0/blocks/0/format`; R08 E1+format 200 valid:false DISPLAY_FIELD; bentuk schemaId pointer `/spec/...`; R05 404 + dokumen v1 200 (slots 0, tree 29, completeness null); R04 GET docKey + completeness.

Keputusan untuk controller:
1. R04 v2 lewat ingest SR-12, yang menyimpan lewat `submitDocumentV2` SR-13 (by-construction dan batas hanya ada di ingest). Route tetap memvalidasi skema lebih dulu (urutan §11.1).
2. `checkRenderRate` dipanggil pada setiap POST R04. `assertRenderCapacity` untuk v2 hanya dipanggil bila `render` diisi.
3. Validasi bab/slot di R08 hanya memeriksa skema: dry-run ingest hanya menerima dokumen.

Permintaan: baris SR-20 terakhir di `file_requests.md` menggantikan dua baris sebelumnya. Dispatch tingkat atas sudah dipasang SR-12. Permintaan ke SR-13 batal.
Celah: R08 belum punya pratinjau kelengkapan pasca-gabung untuk bab/slot. Ini butuh dry-run gabung dari layanan.
