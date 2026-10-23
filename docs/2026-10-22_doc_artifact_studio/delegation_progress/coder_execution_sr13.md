# SR-13 layanan kiriman parsial (coder-execution)

Status: complete (gerbang D-133). Skills: backend-execution, dry-run-verify-fix.

Berkas BARU `src/lib/studio/services/submit/`: `index.ts` (I49 `submitChapter`, `submitSlot`, `submitDocumentV2`, ekspor `withDocumentLock`), `pipeline.ts` (alur: templat + aset di luar transaksi; di dalam kunci: buat-atau-revisi, `mergeSubmission` SR-08, idempoten, cek dasar per lingkup, `composeV2`, `carryFillStamps` + `writeRevisionRows` SR-10, kelengkapan SR-11; sesudah commit `renderScope` SR-15 / `renderRefused`), `lock.ts` (`pg_advisory_xact_lock` `studio-mdoc` -> `studio-docno` -> `studio-doc`, P2002 pembuatan diulang sekali), `target.ts` (tepat satu cara, `docKey` bawaan = slug templat), `change.ts` (changeScope §9.5, change otomatis KC-2), `docnumber.ts` (sekuens KD-04), `meta.ts`, `log.ts` (JSONL `logs/submit`).

Bukti:
- `npx tsc --noEmit -p tsconfig.json`: 0 galat di `services/submit`; 41 galat di luar area (template-editor 31, document-viewer 6, section-composer 2, ingest/v2.ts 1, studio/templates/[id]/page.tsx 1; baris paralel).
- `npx eslint src/lib/studio/services/submit`: exit 0.
- Asap `npx tsx --tsconfig tsconfig.json <scratchpad>/sr13_smoke.ts`: 29/29 PASS. current_database = gsp_agent_hq_v21. Bab 1 membuat dokumen (rev 1 `create;chapter:1`, pid bab-1, 1.1.1); bab 3 + bab 5 dari dua transaksi bersamaan (base 1) keduanya diterima: rev 2/3, yang kedua `rebased` base 1 -> applied 2; ulang identik bab 3 = `unchanged` rev 3, pid sama, jumlah revisi tetap 3; bab 3 berubah = pid posisi diwarisi + blok baru pid baru; base lama lingkup sama = 409 SCOPE_CONFLICT (changedInRevisionNo 4), lingkup lain = rebased; DOC_TARGET_AMBIGUOUS, META_REQUIRED_FOR_CREATE, SLOT_USE_CHAPTER_ENDPOINT, META_CONFLICT; slot references diterima lalu ulang unchanged; balapan pembuatan misi baru = 1 dokumen, 1 created, tanpa 409; M15 cap pengisi, M06 = M17, structureSha256 + completenessReport terisi. 0 baris tersisa (11 tabel sama sebelum/sesudah).

Keputusan (perlu dicatat controller):
1. Asap bukan rollback murni: transaksi paralel harus commit agar yang kedua melihat yang pertama; dokumen uji dihapus (cascade) lalu hitungan dibandingkan.
2. Pencocokan pid §10 dan meta bawaan memakai compose SR-08 (`mergeSubmission`, `defaultMeta`); `submit/pids.ts` sementara dihapus (duplikat).
3. Target misi tanpa `docKey` dan tanpa templat: satu-satunya dokumen v2 misi itu, selain itu 400 DOC_TARGET_AMBIGUOUS.
4. `baseRevisionNo` > n atau tak ada = 404 REVISION_NOT_FOUND. Revisi terbaru v1 tanpa baris v2 = 409 VERSION_CONFLICT (menunggu backfill SR-37).
5. Galat render sesudah commit (429/503/404) dilempar; kiriman sudah tersimpan dan kirim ulang identik = unchanged + job revisi sama (§9.3).
6. Cap pengisi `by` = agentId badan, lalu caller.agentId, lalu requester.

Temuan: jalur render sesudah commit tidak dijalankan di asap (menulis berkas); aset base64 disimpan sebelum transaksi (dedupe sha, tetap ada bila transaksi gagal). `nextDocNumber` memakai ekspor `docNumberPattern`/`formatDocNumber` milik ingest (SR-12).
