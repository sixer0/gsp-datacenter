# SR-15 coder-execution: layanan render berlingkup

Status: complete (gerbang D-133). Tanggal 2026-10-23. Skills: backend-execution, dry-run-verify-fix.

Berkas (semua di `src/lib/studio/services/render/`):
- BARU `scope.ts`: `renderScope` (I51), `prepareScopeRender` (muat + gerbang COMPLETE + validasi lingkup + templat + `resolveSlotsForVersion` SR-06, tanpa tulis), `revisionCompleteness`, `documentIncompleteError`, `scopeRelDir`; serah draf ke `rev-<n>/bab-<k>|lamp-<k>|slot-<slotKey>/`, `StudioOutputFile.scopeKind/scopeKey/draft`, job `scopeKind/scopeKey`.
- BARU `db.ts` (Prisma malas, D-155); BARU `pure/scope.ts` (filter lingkup, placeholder slot wajib kosong, numbering seluruh dokumen dipertahankan).
- UBAH `pure/render.ts` + `pure/index.ts` (KC-10: `AnyNormSnapshot`, opsi `scope/draft/slots/pidSeed/assetLookup`, nama DATUM + ` Bab <k>`), `revision.ts` (lewat `renderSnapshot` IP-43a + gerbang 409 INCOMPLETE), `job.ts` (Prisma malas, kolom lingkup, penjaga RENDER_IN_PROGRESS per lingkup), `figures.ts` (`chartSvg` -> `pureChartSvg`, `SymbolSheetFn`/cast dihapus, `SymbolSheetOptions` mesin diekspor ulang, D-156), `artifact.ts` (Prisma malas; snapshot v2), `common.ts` (`asAnySnapshot`, `engineSnapshot`, aset D-175: path -> `StudioAsset.relPath` -> datar lama), `naming.ts` (nama/direktori draf), `index.ts` (ekspor).
- `slots.ts` yang diklaim TIDAK dibuat: SR-06 sudah menyediakan `resolveSlotsForVersion`.

Bukti:
- `npx tsc --noEmit -p tsconfig.json`: 40 galat, 0 di `services/render` (semua di baris paralel: playground 28, templates 4+2 route, submit/paragraphs/documents route, compose/snapshot.ts 1, revisions/v2/ops.ts 1).
- `npx eslint src/lib/studio/services/render`: exit 0.
- Asap tsx transaksi-rollback (`current_database() = gsp_agent_hq_v21`; dokumen + revisi E2 dibangun `composeV2` SR-08 + `computeCompleteness` SR-11 di dalam transaksi): render penuh INCOMPLETE -> `DOCUMENT_INCOMPLETE 409`, details `{completeness INCOMPLETE, missingRequired [controlSheet, content:1, content:2], allowedScopes [chapter, slot], forwardToController ...}`, 0 job dibuat; bab 9 -> `ADDRESS_NOT_FOUND 404`; slot `nope` -> `SLOT_UNKNOWN 422`; render bab 3 -> SUCCEEDED, draft true, relDir `docs/2026-10-23_misi_a/studio/997-GSP-LAP-X-2026/rev-1/bab-3`, berkas `Laporan Survei Gardu Induk Cikupa 997-GSP-LAP-X-2026 RevA Bab 3.docx`, DOCX memuat "Gambar 3.1" dan "Tabel 3.1"; rollback, sisa baris 0.

Keputusan (dicatat controller):
1. Gerbang COMPLETE membaca `StudioRevision.completeness` (status) + `completenessReport` (rincian) yang ditulis saat revisi dibuat; revisi lama tanpa laporan mendapat laporan ringkas dari kolom.
2. `renderRevision` (render penuh, R07/ingest/patch) juga ditolak 409 untuk revisi INCOMPLETE (KC-8); pemanggil yang ada sudah menangkap galat.
3. Filter lingkup di orkestrator murni (sebelum figur/perakit/lint): render bab hanya memuat unit bab itu; `scopePlans` SR-16 jadi idempoten.
4. Slot opsional kosong pada lingkup SLOT -> 404 ADDRESS_NOT_FOUND (tidak ada isi); slot wajib kosong -> unit placeholder (register §4.6). Tanda tangan `inControlSheet` -> unit lembar kendali.
5. Status rilis revisi hanya diperbarui render penuh; draf tidak menimpa lint revisi.

Temuan / permintaan (file_requests.md, 4 baris SR-15): penanda "DRAF" belum ada di DOCX (SR-16, KC-4); lebarkan `RenderContext.snapshot` (SR-04); info renderScope untuk SR-13/SR-14/SR-20/SR-24. Sisa D-155: impor `services/render/pure` masih memuat `@prisma/client` (probe: DATABASE_URL terisi pasca-impor) lewat `services/storage/{files,mission}.ts`, `services/ingest/repository.ts`, `images/store.ts -> storage` (milik baris lain; permintaan IP-43a baris 131 masih terbuka). Modul render sendiri: 0 impor Prisma statis.
