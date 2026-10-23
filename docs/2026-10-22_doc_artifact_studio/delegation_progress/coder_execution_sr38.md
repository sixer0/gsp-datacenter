# SR-38 coder-execution: impor Manual 000 v2 di v21 + aset + revisi baru 000 + render

Status: complete (2026-10-23). Skill: dry-run-verify-fix. Putusan tengah baris: D-228 opsi (a) (backfill tulis-ulang; `legacy-v1.ts` tidak disentuh).

## Berkas
- `prisma/seed-studio.ts` (4dfb1c38… -> 2d36d8e0…): `intendedDeltaOf(preset, file)` membaca Δ penjaga dari `meta.intendedDelta` profil preset (entri `{key}` wajib kunci registri; kosong/tak sah = galat), menggantikan `[REGISTER_BOLD_KEY]` tertanam di `importManual000V2`; komentar kepala butir 6.
- `prisma/backfill-studio-structure.ts` (e8895f8d… -> f88a2b30…; kepemilikan D-228): flag `--rewrite-v1-rows` (bawaan mati, dukung `--dry-run`) -> `rewriteRevision`: hanya norm/v1 berbaris; lewati bila ada revisi lain sesudahnya atau identitas M18 dibuat sesudahnya/pensiun (`skipped-built-upon`); sudah cocok = `unchanged`; isi = adaptor terkini, pid bab/section/blok disalin dari baris lama per posisi (bentuk wajib identik), pid intro/F: lewat `prev` = baris lama, permintaan pid baru / beda peta pid / identitas berubah = `skipped-pid-mismatch` (rollback, tidak dipaksa); hapus M14 (kaskade M15-M17) + `writeRevisionRows` lalu `verifyReconstruction` di dalam transaksi sebelum commit; snapshot tidak disentuh. Refaktor kecil: `finishLegacyRows` + `previousRows` dipakai bersama tulis-awal (perilaku sama).
- Skrip scratch (bukan berkas repo; layanan resmi): `assets.ts` (`storeAsset`), `revise000.ts` (R14 `patchStructure` op templateVersion), `render000.ts` (`renderRevision`), `state.ts`/`readold.ts`/`diag*.ts` (baca-saja).

## Bukti (DB `gsp_agent_hq_v21` via `current_database()`)
- Seed dry-run exit 0 (rollback); jalan 1 exit 0: preset `datum-manual-000-preset` v1 created, restricted true; `datum-manual-000` v3 new-version (params a48db5ca… = mode berkas; kerangka 280a288a… = berkas; esensial templat 7, slot 6, esensial slot 15, lanjutan 0). Penjaga ok: 721 kunci lama, proyeksi di luar Δ a3dafa51… kedua sisi, Δ = 10 kunci intendedDelta, diffOutsideDelta 0. Jalan 2: preset dan templat unchanged.
- Aset `storeAsset`: jalan 1 created 26 (26 sha unik), jalan 2 deduped 26.
- Backfill relink (sebelum tulis-ulang): 000 rev 1 linked 24, jalan 2 linked 0.
- Tulis-ulang: dry-run exit 0 (001 unchanged, 002 unchanged, 000 rewritten). Jalan 1 exit 0: 000 rewritten, 115 blok berubah (label SUMBER/KUNCI), identitas created/retired/revived 0/0/0, baris 6/21/102/268 = sama, sections e938fb18… (= adaptor); verifikasi 001 9460d362, 002 c4c413ba, 000 1521f7fc semua cocok. Jalan 2: ketiganya unchanged. Backfill biasa exit 0 (3 cocok, failed 0). Sesudah rev 2: tulis-ulang dry-run -> 000 `skipped-built-upon` (syarat bekerja).
- Revisi baru: R14 dry-run (tx rollback) OK, lalu nyata exit 0: dokumen 000 rev 2, schema studio.doc/v2, templat datum-manual-000 v3, snapshot c0709a66…, scope structure:templateVersion, kelengkapan COMPLETE (fullRenderAllowed), 24/24 blok image tertaut.
- Render rev 2 (DOCX+HTML+PDF): job cmvk8a3lq0001v138675vu9x6 SUCCEEDED, errors 0; DOCX 52f684c2a94948b8fbb1a4f856d3a8672657065374ccd0d9a96428c2ecf65c9a, PDF c5cb40ccd01c6925aee21c4317305cc5de8033f87022eb6f487da538528b53a7, HTML 4e2836a97a1d8854a412af4c88add6854e27940269316fced708d0528ef4afd7 (sha disk = DB). releaseStatus FAIL = sama dengan rev 1 (tidak diselidiki).
- Revisi lama: projectContent rev 1 OK (6 slot, 17 bab + 4 lampiran), snapshotSha256 1521f7fc… tetap, 24/24 image tertaut.
- Hitungan awal -> akhir: StudioTemplate 5->6, Version 12->14, Slot 28->40, StudioAsset 0->26, M14 9->15, M15 25->46, M16 111->213, M17 311->579, M18 447->447, StudioBlock 446->714, StudioRevision 3->4, StudioRenderJob 3->4.
- `tsc --noEmit --incremental false` seluruh repo exit 0 (0 galat); eslint 2 berkas exit 0.

## Catatan untuk controller
1. Isi rev 2 = isi rev 1 (adaptor dari doc.json LAMA, tampilan dikupas), BUKAN `doc.v2.json`; maksud D-126 "dari doc.json konten-saja" butuh kiriman isi tambahan (bab/slot) bila diinginkan.
2. warn seed: datum-kanonik v6 berbeda dari registri (kunci RQ-8) — D-213(2), di luar baris.
3. Catatan proses (putaran 1): satu grep menampilkan baris DATABASE_URL dengan kata sandi disamarkan; tidak diulang.
4. Baris SR-38 di `file_requests.md` sudah dikerjakan sesuai D-228 (putusan dicatat controller).

## D-231 (isi dari doc.v2.json) — needs-review
- `submitDocumentV2(ADMIN, doc.v2.json utuh)` -> 422 `DOC_NUMBER_EXISTS` ("Nomor dokumen 000/GSP/STD/X/2026 sudah dipakai"); 0 baris berubah (hitungan semua tabel sama sebelum/sesudah; StudioDocument 3 -> 3). Sebab (kode): `resolveDocTarget` (`services/submit/target.ts:61`) tanpa `mission.folder` = selalu dokumen BARU; dokumen 000 tanpa misi (missionFolder null), jadi R04 tidak dapat merevisi dokumen yang ada. JANGAN kirim tanpa `meta.docNumber`: itu membuat dokumen baru bernomor urut.
- Banding baca-saja rev 2 vs doc.v2.json (tanpa pid): cover/controlSheet/signature/toc beda, 17/17 bab + 4/4 lampiran beda -> bukan `unchanged`.
- Opsi: (a) jalur resmi per lingkup ke `target.documentId`: `submitSlot` (cover, controlSheet, signature; toc AUTO) + `submitChapter` ×21 = sampai ±24 revisi (rev 3..), tanpa ubah kode; (b) ubah kode R04/pipeline agar `studio.doc/v2` dapat menarget dokumen yang ada (documentId/docNumber) = satu rev 3 — di luar area (services/submit), perlu baris baru.

## D-232/D-237 (isi doc.v2.json lewat SUB-1) — SELESAI
- `submitDocumentV2(ADMIN, doc.v2.json, {target:{documentId:000}, baseRevisionNo:2})` -> 409 `META_CONFLICT` (subject: dokumen null, kiriman "Manual DATUM"); 0 tulis. Sesuai arahan SUB-1: R14 `setMeta {subject}` (dry-run tx rollback, lalu nyata) -> rev 3 (scope meta, snapshot c6a3d257…, isi tidak berubah).
- Kiriman utuh base 3 -> 201 rev 4 (snapshot 5ef49008…, `document;slot:cover;slot:controlSheet;slot:signature;slot:toc;slot:content;chapter:1..17;chapter:A..D`, COMPLETE). Kirim ulang identik -> `unchanged` rev 4 (0 baris berubah).
- Beda rev 3 -> rev 4: baris 6/21/102/268 -> 6/21/102/269; pid baru 1 (BLOCK p-31hqrzpk1b, createdRevisionNo 4), pid pensiun 0; blok isi berubah 145, sama 123; image tertaut 24/24.
- Render rev 4 DOCX+HTML+PDF: job cmvk96mog0001v100xgm1pmul SUCCEEDED, errors 0; DOCX 61059eb99ae73a885d0d0a91e24ff064ec4a724207a5ed65c7a3df44ddc7592f, PDF 365a3868832b07c2567e11ac96be3b2a5f1e4313be68654719b1aeab5ee624af, HTML 4c03f4e03378b3294f6154527d06ad2baee50523ee43a43f9368d21471004ea2 (disk = DB). releaseStatus FAIL (F-062, tidak diselidiki).
- Rev 1..4 terbaca: projectContent 6 slot/17 bab tiap revisi; verifyReconstruction cocok ke-4 revisi; rev 1 1521f7fc…, rev 2 c0709a66… tetap.
- Hitungan sesudah rev 2 -> akhir: M14 15->27, M15 46->88, M16 213->417, M17 579->1116, M18 447->448, StudioBlock 714->1251, StudioRevision 4->6, StudioRenderJob 3->5 (render rev 2 + rev 4), StudioOutputFile 9->15. tsc repo 0; eslint 2 berkas 0.
- Catatan: alur ini menghasilkan DUA revisi (rev 3 setMeta + rev 4 isi), bukan satu rev 3, karena meta.subject wajib disamakan lebih dulu (META_CONFLICT).
