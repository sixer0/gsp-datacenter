# RQ-6 — Blok register footer dari parameter templat (coder-execution)

Status: complete. Masukan: file_requests.md RT-01 (header-footer.ts:153-166), D-138, D-141.

## Berkas
- `src/lib/studio/engine/docx/package/header-footer.ts` (modify): `registerDefaultCells` kini membaca pola `device.registerBlock.cells` (P4S-11) dan pemisah `device.registerBlock.separator` (P4S-12, bawaan NBSP); ekspor baru `registerCellPatterns`, `REGISTER_CELLS_FALLBACK`.

## Perilaku
- Medan `{org}` (org.shortName), `{nomor}`, `{rev}`, `{tanggal}`, `{n}`=PAGE, `{N}`=NUMPAGES, `{kelas}`; spasi ASCII literal -> pemisah; "REV" tanpa `{rev}` disisipi revisi (aturan sama engine/html); run teks bersebelahan berformat sama digabung.
- Tebal: semua medan kecuali `{org}`/`{tanggal}` (aturan BM, bukan P4S-13). EN: LEMBAR->SHEET, DARI->OF (perilaku lama).
- Kompatibilitas: pola persis "GSP · {nomor}" dibaca "{org} · {nomor}" agar org.shortName tetap berlaku sampai registri memakai `{org}`.

## Bukti (2026-10-23)
- `npx tsc --noEmit -p tsconfig.json` -> exit 0, 0 baris galat (seluruh repo).
- `npx eslint src/lib/studio/engine/docx/package/header-footer.ts` -> exit 0.
- Asap (tsx, skrip scratchpad `rq6_smoke.ts`, params = bawaan registri + overrides benchmark/manual000/template.json, meta doc.json):
  runs `-[GSP<NBSP>·<NBSP>] B[000/GSP/STD/X/2026] -[REV<NBSP>] B[A] -[<NBSP>·<NBSP>08-X-2026] -[LEMBAR<NBSP>] B[PAGE] -[<NBSP>DARI<NBSP>] B[NUMPAGES] B[TERBATAS]`, 8 NBSP;
  XML sel 1: `<w:t xml:space="preserve">GSP&#160;·&#160;</w:t>`.
- Footer bawaan dari parameter === footer dari spec `cells` verbatim BM (doc.verbatim.json): `true 6282 6282` (byte-identik).
- Variasi: separator " " -> spasi biasa; org.shortName "ACME" -> "ACME<NBSP>·<NBSP>"; EN -> SHEET/OF; pola kustom `{n}/{N}` OK.

## Permintaan lintas pemilik
- file_requests.md (RQ-6): default P4S-11 `{org}`, paritas HTML separator+{org}, ketidakcocokan P4S-13 boldFields vs BM.

## Temuan
- P4S-13 boldFields bawaan tidak mencerminkan BM (rev, NUMPAGES, klasifikasi juga tebal); DOCX tidak memakainya.
