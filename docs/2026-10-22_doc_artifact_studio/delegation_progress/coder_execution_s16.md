# S16 blok teks DOCX (engine/docx/blocks), coder-execution, 2026-10-23

Status: complete

Berkas (area eksklusif `src/lib/studio/engine/docx/blocks/`, 12 berkas): `index.ts` (tanda tangan I05: `docxBlocks` 9 kunci, `runsXml`, `parseMdLite`; ekstra `MEDIA_REL_PLACEHOLDER_RE`, `mediaRelPlaceholder`, `SECTION_NUMBER_GAP`, `escapeXml`), `env.ts` (resolusi peran, parameter, kolom rel, kuantisasi garis, log), `props.ts` (pPr/rPr urutan skema), `runs.ts` (run apa adanya + md-lite), `text.ts` (paragraph, list, assumptionInline), `structure.ts` (chapter, section), `boxes.ts` (aside, monoBlock), `rail.ts` (rel moda A framePr/table3col, moda B), `primitives.ts` (spacer, device 6 jenis), `media.ts` (wp:inline), `table.ts` (tabel bingkai 1 baris), `xml.ts`.

Penjaga:
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/engine/docx/blocks"` -> kosong (grep exit 1)
- `npx eslint src/lib/studio/engine/docx/blocks` -> exit 0, tanpa keluaran
- Smoke (scratch, bukan uji): render seluruh bab `benchmark/manual000/doc.json` dengan profil kanonik, dua perender rel: 0 galat; 17 chapter, 98 section, 124 paragraph, 161 spacer, 14 list, 10 aside, 4 monoBlock, 5 device; XML well-formed (ElementTree), pStyle 0; 749/749 teks run masukan muncul verbatim di `w:t` (table3col dan framePr); 4 log warn (aset logo/datumRule doc.json tanpa data).

Keputusan (dicatat controller):
1. Prioritas format: eksplisit blok/butir/run > roleFormats templat > katalog S11 > Normal; bawaan struktural modul (keepNext/outlineLvl judul, gantung daftar 283/397 twip) hanya bila templat tidak menulis `para` peran itu.
2. Konvensi D-44 C1-C4/C9/C10/C12 dipatuhi: runs verbatim tanpa awalan; seksi = run nomor + runs judul tanpa pemisah; pemisah BM "   " hanya untuk judul `text`; daftar = penanda + `w:tab` dalam run penanda + runs.
3. md-lite (Garis A) untuk prosa `text` (paragraph, butir list, badan aside, assumptionInline); judul, kicker, label, baris monoBlock verbatim. Tanda baca ujung URL yang dibuang Python ditulis ulang sebagai run biasa (teks utuh); URL = run mono bergaris bawah (Run tanpa hyperlink).
4. Rel: moda dari `layout.railMode` + panjang R-13; A framePr = inang `ind right` gutter+rel + chip framePr bentuk RAIL_FRAMEPR_POST; A table3col = tabel 1x3 (prosa, `<w:p/>`, rel); B = baris rel sebagai paragraf di bawah inang. Tanda: glif (`glyphRun` atau symbolGlyph + `marks.*.colour`) + run label " <label>".
5. assumptionInline = paragraf badan + rel [ASUMSI, asmId, "Dampak bila salah: " + impact] (pola BM T017); awalan tidak ditambah bila impact sudah diawali "Dampak"/"Impact".
6. Datum Rule bab = aset templat `rule<kolom teks mm>` (rule128); tinggi dari rasio PNG; aset tidak ada -> garis bawah paragraf + log warn. Kicker pola `chapter.kicker.pattern`, lampiran "LAMPIRAN/Lampiran {n}" bila `appendix.kicker.pattern` tidak ada.
7. Format sel aside/monoBlock/sealBand dari `RoleFormat.cell`; cadangan dari parameter garis + margin terukur BM (TCP-18, TCP-21, TCP-01/02).
8. Galat isi -> `ctx.log` level error + `StudioEngineError` SCHEMA_INVALID; aset hilang -> warn + cadangan.

Permintaan lintas pemilik (file_requests.md, tidak blocking): S20 placeholder media `{{media:<nama>}}` + penomoran docPr; S48 bentuk content chapter/section dan ketersediaan data aset gambar.

Temuan: (a) doc.json benchmark: aset `bm-fig-*` hanya sha256/ukuran, tanpa data/path -> logo dan Datum Rule 166 jatuh ke cadangan sampai S94/S48 menyediakan data. (b) Catatan S11: numberRun katalog seksi mewarisi tebal dan ukuran judul (22) karena unsur sectionNumber tanpa ukuran; profil S95 menimpa.
