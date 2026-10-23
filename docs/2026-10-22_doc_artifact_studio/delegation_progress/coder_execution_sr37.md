# SR-37 backfill struktur revisi lama (coder-execution)

Status: complete. Skills: backend-execution, dry-run-verify-fix.

Berkas BARU: `prisma/backfill-studio-structure.ts` (`npx tsx prisma/backfill-studio-structure.ts [--dry-run]`). Penjaga `current_database()` = `gsp_agent_hq_v21`/`_uji`. Log JSON ke stdout/stderr + JSONL `data/studio-workspace/logs/backfill/`. Snapshot dan kolom `StudioRevision`/`StudioDocument` tidak ditulis. `StudioBlock` (M06) tidak ditulis ganda (sudah ada untuk revisi lama).

Alur per revisi norm/v1 tanpa M14: `adaptV1(snapshot.doc, "strip")` (SR-09) -> kerangka implisit `getSkeleton(tv, tier dokumen)` (SR-06; M14 = slot wajib + slot berisi, opsional kosong = OMIT KD-08, `templateSlotId` null) -> pid adaptor dipertahankan, baris `F:` = blockId v1 beralamat sama, sisanya `dbPidAllocator`; revisi n>1 mewarisi pid bab/section -> `rowsFromSource` -> label artefak = snapshot v1 per alamat -> `writeRevisionRows(tx, ..., {onRetiredPid:"revive", dualWriteLegacy:false})` (SR-10) -> `verifyReconstruction` di dalam transaksi sebelum commit. Kunci advisory `studio-doc:<id>`; revisi berbaris dilewati (idempoten).

Bukti (v21):
- dry-run (rollback): 3 written, M14-M18 0 -> 0, exit 0.
- Jalan 1: StudioDocSection 0->9, StudioDocChapter 0->25, StudioDocSubsection 0->111, StudioDocBlock 0->311, StudioDocIdentity 0->447; `otherTablesChanged {}` (semua tabel public lain, termasuk StudioBlock 446, sama); exit 0.
- Jalan 2: 3 skipped-existing; 9/25/111/311/447 -> sama; `otherTablesChanged {}`; exit 0.
- Rekonstruksi = snapshotSha256 (kedua jalan): 001 rev1 9460d362...5f7b0 (M14 1/M15 2/M16 4/M17 19); 002 rev1 c4c413ba...918426 (2/2/5/24); 000 rev1 1521f7fc...8aa52 (6/21/102/268). Kelengkapan kolom/dokumen/dihitung dari baris = COMPLETE (KC-8).
- Hash snapshot sebelum = sesudah untuk 3 revisi (stored = canonicalSha256(snapshot)).
- Alamat C.S.P blok isi cocok 1:1 dengan snapshot v1 (labelFixes 0, addressesMissingInV1 0); alamat v1 tanpa baris M17 = blok judul bab/section/lampiran/partDivider (5/6/124), diwakili M15/M16.
- tsc seluruh repo: 6 galat, 0 di area (benchmark/extract/convert_v2.ts 1, benchmark/harness/run/lib/pipeline.ts 1, src/components/studio/document-viewer/index.ts 4). eslint skrip: exit 0.

Keputusan (perlu dicatat controller):
1. Rekonstruksi norm/v1 = "kesetaraan jalur lama": baris -> `rebuildSections` tanpa pid == `adaptV1(snapshot.doc)` tanpa pid DAN pid adaptor sama, lalu snapshot v1 tersimpan dikembalikan (dirender jalur lama, §2.8). Compose ulang byte-identik v1 mustahil (adaptor membuang spacer 178, device 16, entri toc 26, format inline pada 000). Recomposer ini lokal skrip (file_requests: runtime SR-08/SR-10).
2. Baris M14 hanya slot wajib + berisi (opsional absen = OMIT, KD-08).
3. 24 blok image 000 assetId null (M13 kosong); relink idempoten saat skrip dijalankan ulang setelah SR-38.
4. `structureSha256`/`completenessReport` revisi lama tidak diisi (kolom StudioRevision di luar area).

Permintaan: 3 baris non-blocking di file_requests.md (recomposer v1 runtime; SR-14 legacyRevision; relink aset setelah SR-38).
Temuan: SR-36 klaim aktif bersamaan; tidak ada perubahan tabel templat dalam jendela kedua jalan.
