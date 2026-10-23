# SR-22: route R14 structure (GET, PATCH) dan R15 completeness (GET)

Status: complete (route ditulis terhadap register; PATCH bergantung pada `patchStructure` SR-14 lewat seam).

## Berkas (baru)
- `src/app/api/studio/documents/[id]/structure/route.ts`: GET proyeksi snapshot norm/v2 (skeleton, order, outlines, meta, templateVersion, completeness); PATCH validasi bentuk lalu `patchStructure`.
- `src/app/api/studio/documents/[id]/structure/_lib/patch-body.ts`: bentuk 7 op E33, medan per op wajib/dilarang, fragmen `DocMetaV2`/`OutlineEntryV2`/`RenderRequestV2` via `$defs` common/v2 + `classifySchemaV2Errors`.
- `src/app/api/studio/documents/[id]/structure/_lib/service.ts`: seam I50 `patchStructure` (dicari saat dipanggil; belum ada = `StudioNotImplemented`, 500).
- `src/app/api/studio/documents/[id]/structure/_lib/revision.ts`: `loadRevision` (+404), `completenessOf` (kolom `completenessReport` MX04; v1 = laporan COMPLETE tanpa slot).
- `src/app/api/studio/documents/[id]/completeness/route.ts`: R15 GET `{ documentId, completeness }`.

## Penjaga (D-133)
- `npx tsc --noEmit -p tsconfig.json`: 0 galat di area SR-22. Galat repo (5, di luar area, baris paralel menunggu layanan): `chapters/_shared/submit-kit.ts:39` (services/submit), `[id]/content/route.ts:19` (services/structure), `[id]/paragraphs/[pid]/route.ts:36,37` (`patchPid`, `pidHistory`, services/structure).
- `npx eslint <area>`: exit 0, tanpa keluaran.
- Asap handler (tsx; SR-14 diganti stub yang menerapkan aturan positionLocked §6.1):
  - PATCH reorder `[toc, cover, ...]` -> `422 {"code":"SLOT_POSITION_LOCKED","details":{"slotKey":"cover","expectedBefore":[],"actualBefore":["toc"]}}`
  - GET completeness tanpa sesi -> `401 {"error":"Unauthorized"}`
  - Tambahan: tanpa change 400 CHANGE_FIELDS_REQUIRED; renumber non-ADMIN 403 FORBIDDEN; `meta.format` 400 SCHEMA_INVALID checkId DISPLAY_FIELD; medan op lain 400; GET structure tanpa sesi 401; DB v21 (baca saja) GET completeness/structure dokumen v1 200; id tak dikenal 404 DOCUMENT_NOT_FOUND; seam tanpa stub 500 (MODULE_NOT_IMPLEMENTED di log).

## Keputusan (untuk dicatat controller)
1. R14 GET pada revisi v1 (tanpa kerangka tersimpan): `skeleton: null`, `order: []`, `outlines: {}` (register mengetik NormSkeletonV2; tidak ada skeleton v1 tanpa SR-06).
2. R15 membaca `StudioRevision.completenessReport`, tidak menghitung ulang (laporan ditulis di dalam kunci oleh layanan tulis). Revisi INCOMPLETE tanpa laporan = cacat data: log warn + laporan minimal.
3. Rate limit FIX-1 + kapasitas antrean hanya bila `render` diisi (KD-27); 403 renumber dicek di route sebelum layanan.

## Permintaan / temuan
- SR-14: ekspor `patchStructure(caller, documentId, body: StructurePatchInput)` dengan hasil `{ revision, addressMap?, completeness }`; badan yang diteruskan sudah tervalidasi bentuk (lihat `patch-body.ts`). Setelah mendarat, seam boleh diganti impor langsung (opsional).
- SR-14/SR-08: aturan 422 `SLOT_*`, `CHAPTER_KEY_INVALID`, 409 `SCOPE_CONFLICT` sepenuhnya di layanan; asap 422 di atas memakai stub, ulangi terhadap layanan nyata di fase uji.
