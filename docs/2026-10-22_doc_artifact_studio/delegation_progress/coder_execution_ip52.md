# IP-52 rekomposer norm/v1 runtime + sunting v1 ber-baris (coder-execution)

Status: needs-review (semua bukti area PASS; satu perbaikan satu baris di luar area wajib: `submit/pipeline.ts`). Skills: backend-execution, dry-run-verify-fix. Temuan SR-37 / D-209; D-196, D-199.

Berkas:
- BARU `src/lib/studio/services/structure/legacy-v1.ts`: `adaptLegacySnapshot`, `sectionsShaWithoutPids`, `adaptorPidMismatches`, `checkLegacyReconstruction` (logika `legacyRecomposer` skrip SR-37 dipindah, satu sumber, murni).
- UBAH `structure/snapshot.ts`: `verifyReconstruction` menangani norm/v1 sendiri (cek baris vs `adaptV1(snapshot.doc)` lalu snapshot v1 tersimpan; recomposer terdaftar hanya untuk norm/v2; skema lain = StructureIntegrityError); laporan + `legacyV1`, `source`; `rebuildSnapshot` -> `Promise<AnyNormSnapshot>`; BARU `reconstructSource` (konten v2 berpid tercek). `structure/index.ts` ekspor.
- UBAH `revisions/v2/service.ts` `lockAndLoad`: jalur v1 ber-baris (sudah ada sejak D-199) kini digerbang `checkLegacyReconstruction` (baris menyimpang = StructureIntegrityError 500, tidak bermigrasi). `revisions/index.ts` `listRevisions` + `completeness`, `changeScope`, `schemaId` per revisi (tipe `RevisionListItem`, aditif; R07 register 03 §12; permintaan SR-30).
- UBAH `prisma/backfill-studio-structure.ts`: recomposer lokal + `setSnapshotRecomposer` dihapus; impor `adaptLegacySnapshot` dari `services/structure`.

Bukti (v21, `current_database()` = gsp_agent_hq_v21; asap transaksi-rollback `npx tsx --tsconfig tsconfig.json <scratchpad>/ip52/smoke.ts`, compose/register diimpor): 21/21 PASS.
- Sebelum ubahan (probe): `rebuildSnapshot` 001/002/000 GAGAL "tidak menyimpan konteks compose (snapshot studio.norm/v1)".
- `rebuildSnapshot` 001 sha 9460d3629447.. = stored; 002 c4c413ba7c37.. = stored; 000 1521f7fc514f.. = stored; schema norm/v1; `legacyV1.matches` true, pidMismatches 0 (ketiganya); `reconstructSource` = studio.doc/v2 (slot 001 [content]; 002 [content, appendices]; 000 6 slot).
- PATCH pid `b-b991d4a22ce1a22f` (paragraf 001, alamat 1.0.1) -> rev 2, schemaId `studio.doc/v2`, snapshot norm/v2, pid + alamat 1.0.1 tetap (respons + baris M17), isi berubah; `rebuildSnapshot` rev 2 (norm/v2) OK.
- v1 TANPA baris (baris 002 dihapus di dalam tx) -> SCHEMA_INVALID http 400 keyword `legacyRevision`.
- Baris dirusak (isi M17 001 diubah di dalam tx) -> `rebuildSnapshot` dan PATCH ditolak StructureIntegrityError.
- `listRevisions(001)` item: `{revisionNo:1, completeness:"COMPLETE", changeScope:null, schemaId:"studio.doc/v1", releaseStatus:"NOT_RUN"}` (baca saja).
- Hitungan 8 tabel sebelum = sesudah (revisi 3, dokumen 3, M14 9, M15 25, M16 111, M17 311, M18 447, StudioBlock 446).
- Backfill `npx tsx prisma/backfill-studio-structure.ts --dry-run`: exit 0; 3x `skipped-existing`; structureCounts tetap; otherTablesChanged {}; failed 0.
- `npx eslint src/lib/studio/services/structure src/lib/studio/services/revisions prisma/backfill-studio-structure.ts`: exit 0.
- `npx tsc --noEmit -p tsconfig.json`: 2 galat, 0 di area: `services/submit/pipeline.ts(215)` TS2339 `.source` pada `AnyNormSnapshot` (AKIBAT ubahan tipe `rebuildSnapshot`; file_requests IP-52, perbaikan satu baris `reconstructSource`), `engine/docx/assemble/index.ts(285)` (baris paralel, bukan IP-52).

Keputusan (perlu dicatat controller):
1. norm/v1 ditangani di `verifyReconstruction` (bukan lewat seam `setSnapshotRecomposer`): rekomposer compose terdaftar global tidak dapat menangani v1, dan skrip tidak perlu lagi mendaftar recomposer.
2. `rebuildSnapshot` mengembalikan `AnyNormSnapshot` (sha = `snapshotSha256` menuntut snapshot v1 tersimpan); konten v2 lewat `reconstructSource` baru.
3. Sunting v1 ber-baris kini menuntut baris mereproduksi `adaptV1(snapshot v1)` sebelum migrasi ke studio.doc/v2 (gerbang integritas, satu sumber dengan `rebuildSnapshot`).
4. Temuan (2) D-209 ternyata sudah terpenuhi sejak D-199 (asap probe: PATCH 001 berhasil sebelum ubahan); IP-52 menambah gerbang integritas + bukti pada data backfill nyata.

Permintaan lintas pemilik: 1 baris `file_requests.md` (SR-13 `submit/pipeline.ts` -> `reconstructSource`; blocking tsc build). Review direkomendasikan (lingkup: `structure/legacy-v1.ts`, `structure/snapshot.ts`, `lockAndLoad`, `listRevisions`).
