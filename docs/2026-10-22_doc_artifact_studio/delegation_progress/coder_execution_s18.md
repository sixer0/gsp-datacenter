# S18 coder-execution: DOCX halaman pembungkus (engine/docx/wrapper), G1b

Status: complete

Berkas (area eksklusif `src/lib/studio/engine/docx/wrapper/`): `index.ts` (I07 `docxWrapper` persis: cover, controlSheet, toc, partDivider, signatureBlock, appendix + ekspor pendukung), `pages.ts` (6 renderer, susun mode auto), `render.ts` (pembangun fragmen, perangkat seal band/logo/hairline/datum rule/spine/issue stamp, blok kendali, kolofon, tanda tangan, tabel halaman depan), `formats.ts` (nilai klaster BM per peran + resolusi peran), `media.ts` (logo, Datum Rule PNG 600 dpi, wp:inline), `xml.ts` (primitif OOXML). Total 2290 baris.

Penjaga:
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep "src/lib/studio/engine/docx/wrapper"` -> kosong (exit 1). Galat repo lain 26 (pra-ada 21 + `src/components/studio/revision/block-editor.tsx` 4, `inline-editor.tsx` 1; bukan area S18).
- `npx eslint src/lib/studio/engine/docx/wrapper` -> exit 0, tanpa keluaran.

Cek runtime (skrip scratchpad `s18_check.mts`, `cmp.py`, `rulecmp.py`, `det.mts`, `pyd.py`) atas `benchmark/manual000/doc.json`:
- Perbandingan struktural vs BM.docx seksi 1-4, 8, 12, 17, 22 (pPr, rPr, teks, tblGrid, tcW, tcBorders, tcMar, shd, extent gambar): 69 unsur, jumlah unsur sama di 8 unit. Tanpa roleFormats: cover 0 beda, lainnya 17 beda (lineTw/run dari turunan katalog S11 menimpa nilai BM, mis. part.title 400 vs 560). Dengan roleFormats tersimulasi (profil S95): 5 beda, semuanya nama wajah `type.face.condensed` = "IBM Plex Sans Condensed" vs BM "IBM Plex Sans Cond".
- Datum Rule yang dibangkitkan pixel-identik dengan BM image2.png (3921x57) dan image3.png (3024x57); tinggi 2,41316/2,41270 mm (EMU 86874/86857 = BM).
- Determinisme: sha256 xml+media dua kali render sama (cover, controlSheet, toc, partDivider). Isi salah bentuk -> StudioEngineError SCHEMA_INVALID.
- Paket uji dibuka python-docx: 11 drawing, 11 id docPr unik, semua r:embed terselesaikan; TOC medan 1 begin/1 end.

Keputusan (dicatat controller):
1. Urutan mengikuti konvensi S93 (D-44): C5 part = body[] -> label -> title -> lede -> daftar bab (teks kicker/judul bab, peran U46/U47); C6 toc = sealBand -> kicker -> title -> tabel -> note; C7 tanda tangan = peran, ruang (signRowFormat), pemegang (+ baris tanggal opsional).
2. Lapisan format: eksplisit > roleFormats templat (sub-objek utuh) > katalog S11 (per atribut) > nilai klaster BM (pengganti gaya Normal untuk peran pembungkus).
3. Media = konvensi S19: `fig-<sha256 32>.<png|jpg>`, relasi `rIdFig<sha256 32>`, docPr = 100000 + ordinal*16 + i; namespace wp/a/pic/r dideklarasikan lokal.
4. Aset `bm-fig-NN` (hanya sha256): dicari di workspace assets, tpl.assets, sha di tpl.assets/manifest S13, lalu ctx.figures. Logo bm-fig-01 terselesaikan lewat manifest S13. Datum Rule tak terselesaikan -> dibangkitkan (pixel setara) + log warn FILE_NOT_FOUND (6 kali pada BM sampai S94 menyediakan aset).
5. TOC: static = tabel T010; field = `TOC \o "1-2" \h \z \u` dengan cache entri (soffice tidak memperbarui medan).
6. `front.signature` ikut lembar kendali bila ada (`controlSheetIncludesSignature`); pembuka appendix = kicker + rule 128 + judul saja; paragraf pemegang sectPr (K-12) tidak ditulis (milik S20).
7. Logo hanya sekali dan hanya di unit sampul (P4V-04); cap terbit {KELAS} = huruf awal klasifikasi; spine auto memakai `caps`.

Permintaan lintas pemilik (tidak blocking): S20 pakai konvensi media/relasi di atas, jangan tempatkan signatureBlock terpisah saat controlSheet ada, tutup unit dengan pemegang sectPr; S95 isi roleFormats peran pembungkus (G-06) dan wajah condensed "IBM Plex Sans Cond"; S94 sediakan berkas aset bm-fig-02/03/09/14/40/45 bila byte PNG BM harus sama.

Temuan: md-lite lokal minimal (tebal/mono/miring) di pembungkus menduplikasi `parseMdLite` S16; mode auto pembatas menambah string punggung bila `device.spine.placements` memuat "pembatas" (default katalog), BM tidak; rotasi 90 derajat punggung tidak diwujudkan (paragraf mendatar seperti python-docx).
