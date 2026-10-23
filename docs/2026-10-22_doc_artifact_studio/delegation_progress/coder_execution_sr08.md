# SR-08 layanan compose (coder-execution)

Status: complete (gerbang D-133). Skills: backend-execution, dry-run-verify-fix.

Berkas BARU `src/lib/studio/services/compose/` (murni, tanpa Prisma; kecuali `register.ts`): `index.ts` (ekspor I45), `types.ts`, `structure.ts` (`validateStructure` §2.7), `merge.ts` (`mergeSubmission`, `emptyResolvedDoc`, `defaultMeta`), `snapshot.ts` (`composeV2`, `slotState`), `blocks.ts` + `inline.ts` + `front.ts` (pemetaan v2 -> internal v1), `hash.ts` (`scopeSha256`, `stripIds` struktural), `pids.ts`, `context.ts` (konteks compose ulang), `register.ts` (`setSnapshotRecomposer`, sisi server), `errors.ts`.

Bukti:
- `npx tsc --noEmit -p tsconfig.json`: 0 galat di `services/compose` dan `services/structure`; 155 galat di luar area (UI playground/section-composer/template-editor, revisions/v2 -> submit, templates/import; baris paralel).
- `npx eslint src/lib/studio/services/compose`: exit 0, 0 peringatan.
- Asap `npx tsx --tsconfig tsconfig.json <scratchpad>/sr08_recompose.ts`: 37/37 PASS. E1 -> 1.1.1 (pid klien `s1-tujuan-1`), 2.1.2 = Tabel 2.1, F:references/1, F:cover/F:controlSheet/F:signature (di unit F:controlSheet)/F:toc, A.1.1; baris M14/M15/M16/M17 = 7/3/3/8, `validateRows` 0 isu; sha deterministik; rekonstruksi baris -> `rebuildSource` -> compose ulang = sha sama (`23cdd2e0…c54bdc`), juga lewat recomposer terdaftar. E2 -> Gambar 3.1 di 3.2.3 (assetSha256), Tabel 3.1 di 3.3.2, Tabel 2.1 tetap; kiriman ulang identik unchanged; sunting -> pid diwarisi posisi, scope `chapter:3`. Label figur KUNCI/SUMBER = run pertama dibangkitkan dari medan `keyRow`/`source` (run konten "SUMBER" tidak dipindai); lebar figur 128 dari templat; profil kolom R-52 diterapkan. 10 negatif SLOT_* kode benar (UNKNOWN, REQUIRED_MISSING, DUPLICATE, POSITION_LOCKED, TYPE_MISMATCH, FORBIDDEN_FOR_TIER, INPUT_NOT_ACCEPTED, ITEMS_OUT_OF_RANGE, BLOCK_TYPE_NOT_ADMITTED, USE_CHAPTER_ENDPOINT) + CHAPTER_KEY_INVALID, PID_CONFLICT, isi ke slot OMIT.

Keputusan (perlu dicatat controller):
1. `validateStructure` menerima `SkeletonInput` (`StudioSkeletonV1` lengkap), bukan `NormSkeletonV2` (I45 tertulis): NormSlotV2 tanpa positionLocked/tiers/admits/maxItems. Opsi ke-4 `{checkOrder}`.
2. `mergeSubmission(current, sub, opts)` mendapat argumen ke-3 wajib (kerangka, tier, pid, aset) — penggabungan butuh pid §10.
3. Baris = `StructureRows` SR-10 lewat `rowsFromSource` (mediasi controller); `ComposeResult` + `structureSha256` (`computeStructureSha256`). Pid blok struktural = pid baris `F:` (bila slot terisi), selain itu `slot-<slotKey>[-n]`; tanpa `pids` pemanggil, baris F: memakai pid deterministik itu.
4. (+) `snapshot.compose` = konteks compose ulang (11 kunci parameter); file_requests SR-04.
5. Isi ke slot yang di-OMIT `structure` = 422 SLOT_UNKNOWN (`details.omitted: true`).
6. Label kotak samping bawaan per varian dari registri S11 (generic = "CATATAN", hipotesis). Kepala kolom daftar bertipe lembar kendali dibangkitkan mesin.
7. Teks `text` (md-lite) tidak dipecah glif oleh compose (pengurai mesin memegangnya); `runs` dipecah per R-40. keyRow/source figur selalu menjadi `runs` berlabel.

Permintaan lintas pemilik: 5 baris `file_requests.md` (SR-04 ratifikasi `compose`; SR-13 impor `compose/register` + pakai `prevRows`/rows apa adanya; engine label teks hanya v1; tabel DOCX runs tanpa PROVENANS; SR-16/17 jenis unit/blok baru). Semua non-blocking.
