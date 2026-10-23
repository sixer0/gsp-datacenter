# S19 coder-execution: DOCX figur dan turunan (engine/docx/figures)

Status: complete (penjaga lulus; uji unit milik S72, paritas BM milik fase final).

## Berkas (7, semua di `src/lib/studio/engine/docx/figures/`)
- `index.ts` `docxFigures` = { chart, diagram, image, symbolSheet, derivation } (I08) + ekspor pendukung S20.
- `figure.ts` caption (K-29, di atas, DT-15) -> paragraf `wp:inline` (K-32, sp b0 a48 line 240 auto + keepNext, melepas spasi tepat badan P9-51) -> KUNCI (K-33) -> SUMBER + PROVENANS (K-34, border atas ink200); lembar ganda `<label>#n`.
- `derivation.ts` `buildDerivationBlock` S12 (cacat register -> BY_CONSTRUCTION_FAILED); R-14 `nestedTable` (T034/N01: 1x1 7257 tw, garis kiri amber sz10, tcMar 147/255/147/0, bersarang 5216|1814, nilai + glif per baris, `<w:p/>`, penutup) atau `monoLines` (garis kiri amber per paragraf).
- `media.ts` sniff PNG/JPEG (+dpi), sha256, nama `fig-<sha32>.<png|jpg>`, relasi `rIdFig<sha32>`, `mergeFigureMedia`, aset raster dari doc.assets (base64 / `<root>/assets` berpenjaga) atau tpl.assets; sha256 wajib cocok.
- `store.ts` `prepareFigureStore` (rasterizeSvg S25, 300 dpi, berurutan; SVG disuntik agar tanpa siklus D01).
- `ooxml.ts` (EMU = mm x 36000, bentuk BM), `defaults.ts` (bawaan terukur BM di bawah katalog/templat), `log.ts` (ctx.log lalu StudioEngineError).

## Bukti
- `npx tsc --noEmit -p tsconfig.json | grep src/lib/studio/engine/docx/figures` -> kosong (exit 1); galat studio 0; total repo 22 (di luar Studio).
- `npx eslint src/lib/studio/engine/docx/figures` -> exit 0.
- Asap tsx (scratchpad): chart 166 mm -> extent 5976000 EMU (= BM); image 128 mm -> 4608000; render ulang identik; media dedup 3 fragmen -> 2; turunan cacat -> BY_CONSTRUCTION_FAILED + log; figur tanpa store -> galat + log; XML 24 p / 2 tbl / 2 inline well-formed (ElementTree VENV).

## Keputusan (untuk register)
1. Label aparatus tetap Indonesia dengan spasi BM di run label: "KUNCI  ", "SUMBER  ", "   PROVENANS "; teks SUMBER dipecah pada kata PROVENANS; `provenance[]` ditulis glif + nama bila teks tanpa PROVENANS.
2. Bawaan modul hanya mengisi atribut yang tidak diberi katalog; tanpa profil S95, caption memakai katalog (ink700 sz15, K-08), bukan nilai BM.
3. Pelanggaran lebar 128/166 (DATUM-31), tinggi > 247 (DATUM-33), dpi (DATUM-39), caption > 1 kalimat (DT-15) hanya dicatat warn; lint memutuskan.
4. Kunci FigureStore: artifactLabel > numbering[blockId] > blockId > alamat.

## Permintaan
- S20 (file_requests.md): prepareFigureStore, relasi media, penomoran ulang `wp:docPr` (basis 100000 + ordinal*16).
