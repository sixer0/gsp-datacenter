# S48 coder-execution: services/ingest

- Status: complete (penjaga tsc/eslint bersih; cek data benchmark dry-run lolos). Uji unit/integrasi milik S74/S75.
- Berkas (9, semua di `src/lib/studio/services/ingest/`): `index.ts` (ingestDocument, normalize, validateSchema, applyDocOverrides), `validate.ts` (ajv dari STUDIO_SCHEMA_LOAD_ORDER + STUDIO_AJV_OPTIONS, batas C11-C14), `normalize.ts`, `checks.ts` (G1, DATUM-10, bind DATUM-11/D03), `gate.ts` (A10 + D-34), `assets.ts`, `repository.ts` (Prisma), `log.ts` (JSONL `logs/ingest/`), `util.ts`.
- Penjaga: `npx tsc --noEmit -p tsconfig.json | grep src/lib/studio/services/ingest` -> 0 baris; `npx eslint src/lib/studio/services/ingest` -> exit 0.
- Cek data `benchmark/manual000/doc.json` (dryRun, templat = profil `template.json` di-resolve lokal karena slug `datum-manual-000` belum ada di DB v21; indeks aset S94): skema 0 isu; 29 unit (3 depan + 5 part + 17 bab + 4 lampiran, urutan C14); 561 NormBlock, 392 beralamat; label 91 Tabel + 24 Gambar + 2 Turunan; valid=true, releaseStatus FAIL; D-34 menurunkan DATUM-04@2.4, DATUM-04@11.1, G3@13.2.2, G3@13.3.2. Tanpa penanda `x.benchmark` -> 422 BY_CONSTRUCTION_FAILED (4 isu, DATUM-04/G3).

## Keputusan
1. Penanda benchmark D-34 = `doc.x.benchmark` (objek/true) atau `doc.x.enforcement="report"` atau opsi `enforcement:"report"` (meta tidak menerima medan tambahan).
2. Penahan 422 = FAIL ber-`blocksIngest` dan tier dokumen; G1 dan DATUM-11 menahan di semua tier. Modul lint gagal/stub -> NOT_RUN di banner, tidak menahan (A10).
3. dryRun tidak pernah melempar (R08 200 valid:false); bukan dryRun melempar StudioEngineError kode §6.3, `details` = ValidationIssue[]; pointer relatif badan (`/document/...`).
4. Render tidak dijalankan ingest: `outputs=[]`, `job=null`; S55 memanggil `renderRevision` sesudahnya.
5. Bentuk NormBlock mengikuti S16/S20/S22 (D-49/D-50): body cover/controlSheet tidak dipecah; chapter/section = kepala saja; tanda tangan `F:signature` di unit controlSheet (atau cover / unit terakhir).
6. blockId absen ditulis balik ke `snapshot.doc` (seed `docNumber|ordinal`, tabrakan diberi akhiran) agar stabil untuk S50; baris StudioBlock memakai `blockRowsFromSnapshot` S50 (D-54).
7. Aset: byte dari dataBase64 / `assets/` / indeks (kandidat yang sha256-nya cocok), disimpan beralamat-isi, AssetRef snapshot dinormalkan (tanpa path/dataBase64). Rujukan `image.asset`/`device.asset` tak dikenal = 400.
8. P3-20 (typeCode tertutup dari param templat) = 400 biasa; mode report -> temuan status rilis.
9. Opsi tambahan `template` (templat pra-resolusi, harness tanpa DB), `assetSources`, `assetIndexPath`, `correlationId`.

## Permintaan / temuan
- file_requests: RenderContext tanpa medan byte aset (tidak blocking).
- Temuan: profil S95 `doc.typeCode` = daftar default tanpa `STD` (benchmark typeCode STD); tanpa D-34 benchmark ditolak P3-20. S95 perlu menambah STD (ada di enum ARSIP).
- Temuan: templat `datum-manual-000` belum di DB v21 (S70/S95) -> ingest nyata benchmark 404 sampai seed.
- Untuk S51: pakai `applyDocOverrides(tpl, snapshot.doc)` agar parameter render sama dengan ingest.
