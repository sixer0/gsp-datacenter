# S17 keluarga tabel DOCX (engine/docx/tables), coder-execution, 2026-10-23

Status: complete

Berkas (area eksklusif `src/lib/studio/engine/docx/tables/`, 1.520 baris): `index.ts` (I06 persis: `docxTables` 11 jenis, `solveWidths`, `tableGuards`; ekstra `renderTableXml`, `REGISTER_TABLE_PRESETS`, `FINANCIAL_TABLE_PRESETS`, `numFloorMm`), `render.ts` (caption, tbl, baris/sel, gridSpan/vMerge, bersarang 1 tingkat, SUMBER+PROVENANS, zebra), `style.ts` (parameter efektif, format peran KT-xx, border/margin TCP), `widths.ts` (port solve_widths/num_floor_mm), `guards.ts` (G1-G3, G4 sub G3), `presets.ts`, `model.ts`, `ooxml.ts`.

Penjaga:
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/engine/docx/tables"` -> kosong (exit 1). Repo 22 galat di luar area (21 pra-ada + diagram/build 5, services/render/job 1; bukan milik S17).
- `npx eslint src/lib/studio/engine/docx/tables` -> exit 0, tanpa keluaran.
- Cek runtime (skrip scratch, tsx + VENV -I -B): 94/94 tabel `benchmark/manual000/doc.json` dirender, 97/97 potongan XML terurai; 1.108 baris, cantSplit 1.108, tblHeader 91 (= BM 91), SUMBER 91. Perbandingan per sel terhadap BM document.xml (multiset node, tcW/tblW terakhir GS-01): tblPr 94/94, tblGrid 94/94, trPr semua sama, sel 3.721/3.721 identik; 91 sel SUMBER beda hanya tcW (lihat temuan 1). `solveWidths` == Python `solve_widths` (3 kasus x 128/166 mm, True); `numFloorMm('335.029.109.47')` = 25,114.

Keputusan (dicatat controller):
1. Urutan resolusi: format eksplisit > `roleFormats[peran]` > katalog S11 > Tabel 5.1/nilai terukur BM (tcMar TCP-15..19, spasi KT-23..28) hanya bila templat tidak membawa peran itu. `Cell.borders`/`Cell.marginsTw` eksplisit mengganti utuh (C12, aturan sub-objek S11); RunProps digabung per atribut; ParaFormat sel digabung di atas format peran.
2. Tanpa border tingkat tabel (tblBorders none, TP-01); sisi `layout.borders` yang tak dinyatakan = none. tcPr tanpa `szCs` (BM tidak menulisnya).
3. C1 (D-44): `SourceLine.inline.runs` ditulis apa adanya; label "SUMBER"/"PROVENANS + glif" hanya ditambahkan untuk `inline.text` (Garis A, pola datum_docx.table).
4. Caption: pemisah ikut run label berprops label (pola run K-29 "RS19 RS20"); label = penomoran (`artifactLabel`/`numbering`) > `caption.label`, beda = log warn.
5. Nama preset: registerTable `assumption, reconciliation, finding, regulation, standardEdition, improvement, revisionHistory, distribution`; financialTable `boq, ahs, recap`. Preset hanya mengisi peran kolom kosong dan kepala bawaan dari parameter (P5-26, P5-62, PD-01, P6-30); AHS: baris berformula `ahs.rows` (D, F) bergaya total.
6. Zebra opt-in lewat token preset `zebra` (mis. `"assumption+zebra"`), karena skema tidak punya medan zebra dan BM T031 (22 baris) tanpa zebra; syarat > `table.zebra.minRows`, BoQ cetak ditolak (P5-09), warna tokenRef `table.zebra.colour` -> zebra15 (D-31).
7. Kolom tanpa `role`: inferensi numeral Python (_NUM_RE >= 70 %); glif tunggal (U+25A0-25FF, U+2610-2612) -> peran `table.cellGlyph`. Rata desimal (P5-04) ditulis jc right. vAlign kepala P5-03 hanya dalam mode katalog.
8. Tabel bersarang: urutan sel = paragraf, tabel bersarang, `<w:p/>` penutup (celah G-04); lebar = lebar sel - margin bila kolom tanpa lebar. md-lite sel lewat S16 `parseMdLite`, cadangan lokal selama S16 stub. Spacer otomatis R-18/R-19 bukan tugas renderer tabel (S20/S16).
9. Serialisasi OOXML lokal (`ooxml.ts`) duplikasi sebagian `package/xml.ts` S14 agar bebas tanda tangan internal baris paralel; kandidat konsolidasi (review recommended).

Temuan: (1) GS-01/F-010: BM menulis tcW terakhir sel SUMBER bergabung = lebar kolom pertama (567/1360/...), renderer menulis lebar total (9412); `SourceLine` tidak punya medan lebar. Diagnosis S98 bila memengaruhi BM-3/BM-4. (2) P5-27 `specTable.condition.style` {indented:true, ruled:false} TIDAK diterapkan: katalog tidak memberi besar jorokan dan BM T039 (jenis `table` di doc.json) tidak menjorok dan bergaris; jorokan dinyatakan lewat `format.indLeftTw` sel. Celah parameter (besar jorokan) untuk S01/S95.

Permintaan lintas pemilik: tidak ada yang blocking.
