# UT-01 coder-execution: templat datum-gsp + sampel dokumen (status: complete)

Skills: backend-execution. Berkas: `prisma/seed-studio.ts` (area eksklusif, klaim UT-01). DB: hanya `gsp_agent_hq_v21` (dicek `current_database()` oleh seed dan skrip bukti). Tidak ada perubahan IL/HKCU/port 9011.

## --import-datum-gsp
- `datum-gsp` "DATUM GSP (profil Manual DATUM 2.6.0)", DOCUMENT, dari `benchmark/manual000/template.json` (sha 76b2e5ed...) lewat `importTemplateProfile` (ADMIN_SESSION; validasi kunci/nilai + hak K; versi berversi). Run 1 `created` v1 (paramsSha256 f7767a75...), run 2 dan 3 `unchanged`.
- Dibuang: override `lint.enforcementOverride` (melepas DATUM-04/09/G3 khusus doc.json benchmark; membuat templat TERBATAS, D-98/D-102); meta benchmark `slug, name, kind, owner, ownerCallerKind, profileOf` (path lokal BM.docx), `measuredFrom, row, date, gaps, clusters` (register ukur S95). Dipertahankan: 83 override visual, 70 roleFormats, `meta.decisions/notes/classKOverrides`; meta baru `derivedFrom` + `stripped`. sectionPlan = rencana dasar kanonik (profil tanpa sectionPlan), identik dengan datum-manual-000 v2.
- Seed menghitung ulang status terbatas sesudah impor (galat bila terbatas).

## Bukti datum-gsp (skrip scratch, Document/Revision 0/0 sebelum = sesudah)
- listTemplates: datum-gsp v1 restricted=false; datum-kanonik v4 false; datum-manual-000 v2 true [DATUM-04, DATUM-09, G3].
- ADMIN: 0 isu kunci, 0 roleFormats, 0 sectionPlan, 0 hak override; nilai efektif 0 isu (1 kunci turunan `grid.marginBottomMm` di luar registri, sama di kanonik v4); overrides = m000 v2 minus enforcementOverride.
- USER: `resolveTemplateFor(datum-gsp)` lolos v1 (m000 = 403 FORBIDDEN); kelas K terkunci: `createTemplateVersion` render.png.dpi -> PARAM_CLASS_K_FORBIDDEN, tidak ada versi baru.
- dryRun USER datum-gsp: memo valid, tables valid; serah 422 (DATUM-20 x2 sel gabungan menutup kolom numeral, DATUM-22 register tanpa Admiralty), terbit 422 (DATUM-22, DATUM-23 simpul stadium bukan terminator). Gagal identik pada datum-kanonik v1 dan v4 = isi fixture, bukan templat. Aturan tidak dilonggarkan.

## --import-samples (ADMIN_SESSION requester `seed-studio-sampel-uji`; ingest normal + renderRevision DOCX/PDF/HTML)
- Membaca berkas sumber saat dijalankan. Sampel non-benchmark: `x.benchmark/enforcement/lintEnforcement` dibuang, `mission` dilepas (opsional I42; folder fixture ilustratif tidak ada). Tidak ada kontrak/task IL dibuat.
- Kunci idempoten: judul + templat kandidat; ada + render lengkap = unchanged; isi berkas berubah (inputSha256 beda) = `stale` (warn, tidak ditimpa); ditolak semua templat = `rejected`.
- cmvjwkilc0001v1cgo9fzklem 001/GSP/KT/X/2026 NOTA datum-gsp v1, 24 blok/2 bab, job SUCCEEDED, DOCX/PDF/HTML disk sha = DB.
- cmvjwkogg0011v1cgk6lnj26m 002/GSP/STD/X/2026 NOTA datum-gsp v1, 30 blok/2 bab, SUCCEEDED, 3 berkas cocok.
- cmvjwkth00027v1cgd8wn9y7h 000/GSP/STD/X/2026 TERBIT datum-manual-000 v2 (doc.json LAMA, sebelum koreksi RT-01; dibiarkan), 392 blok/27 kunci bab, SUCCEEDED, DOCX sha 6515797f... = garis dasar D-109, HTML 54095e22... = INT-M.
- Hitungan: Document 3, Revision 3, Block 446, RenderJob 3, OutputFile 9. Run 2: semua `unchanged`/`rejected`, exit 0.

## Penjaga
- `npx tsc --noEmit -p tsconfig.json` exit 0, 0 galat; `npx eslint prisma/seed-studio.ts` exit 0.

## Temuan
1. Run 1 sampel menggantung setelah selesai (Chromium playwright menahan proses); proses milik sendiri di-tree-kill; diperbaiki `closeBrowser()` di finally. Run 2 keluar bersih, tetapi tanpa render (jalur render + tutup belum terbukti ulang).
2. Setelah RT-01, run ulang memberi `stale` untuk manual-000 (nomor 000 unik); penggantian dokumen lama perlu putusan controller.
3. releaseStatus NOT_RUN untuk dua sampel NOTA (lint pasca-render tidak dijalankan untuk NOTA?) - perlu dicek baris pemilik render.
