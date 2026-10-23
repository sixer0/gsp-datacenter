# S20 coder-execution: engine/docx/assemble (I09)

Status: complete (penjaga lolos; uji suite milik S72/S76 fase final).

Berkas (5, area eksklusif `src/lib/studio/engine/docx/assemble/`): index.ts (`assembleDocx` tanda tangan §8.2 tetap + `assembleDocxDetailed`), units.ts (validasi/kelompok unit), numbering.ts (penomoran §4.1), media.ts (media dedup + rId), xml.ts (akar dokumen + pemegang sectPr U11).

Alur: planUnits (urutan snapshot.units, blok per unitKey urut ordinal) -> computeNumbering (per bab: Tabel C.n bila caption, Gambar C.n bila caption, Turunan D-C.n atau id eksplisit; reset per bab/lampiran) -> DOCX_RENDERERS[block.type] (D01) dengan NormBlock.artifactLabel terisi dan snapshot.numbering tergabung -> buildSectionPackage(ctx,{firstRelId: FIRST_FREE_REL_ID}) -> paragraf pemegang sectPr (U11, bawaan kosong = BM/C10) di akhir tiap unit kecuali terakhir; sectPr unit terakhir di akhir body -> media (lihat keputusan 4) -> `wp:docPr/@id` 1..n -> planEmbeddedFonts (S15) -> buildDocxPackage (S14).

Bukti:
- `npx tsc --noEmit -p tsconfig.json | grep src/lib/studio/engine/docx/assemble` -> kosong (exit 1). Total repo 22: 21 pra-ada + 1 di `src/lib/studio/services/render/job.ts(208,54)` TS2352 (area S51, bukan S20).
- `npx eslint src/lib/studio/engine/docx/assemble` -> exit 0, tanpa keluaran.
- Smoke tsx (29 unit = 3 depan + 5 bagian + 17 bab + 4 lampiran, 3 blok image S19 + 2 device logo S16): sha256 c85a995a...4ad2 identik 2x; placeholder `{{media:...}}` S16 -> rId67 (1 media image1.png untuk 2 logo), sisa placeholder 0; docPr 1..5; 29 sectPr (28 pemegang `<w:p><w:pPr><w:sectPr>` + 1 body); penomoran {Gambar 3.1, Gambar 3.2, Gambar A.1}; 3 penempatan -> 1 media `fig-c414...png` relasi `rIdFigc414...`; docPr 1,2,3 (`Picture N`); jalur `svgFor` -> prepareFigureStore jalan; python-docx (VENV): 29 seksi, 3 inline shape.
- Negatif: jenis blok tanpa renderer -> BY_CONSTRUCTION_FAILED (dicatat ctx.log error); unitKey tak dikenal -> BY_CONSTRUCTION_FAILED; label snapshot berbeda -> label snapshot dipakai + 1 warn NUMBERING_MISMATCH.

Keputusan (untuk register controller):
1. Label artefak snapshot (`artifactLabel`/`numbering`) menang atas hasil hitung (konsisten dengan alamat route/HTML); selisih = warn NUMBERING_MISMATCH. Label dihitung hanya bila snapshot kosong.
2. Bookmark/properti alamat tidak ditulis: spesifikasi §3.9/§4 tidak memintanya (dan akan menggeser paritas XML).
3. Fragmen yang memuat w:sectPr/w:body/w:document ditolak (batas seksi milik perakit, KS-06/C10).
4. Media (D-47): figur S19 `fig-<sha32>` + `rIdFig<sha32>` dipertahankan lewat mergeFigureMedia/figureMediaRelId; media renderer lain dedup sha256 -> `imageN.ext` + rId numerik setelah relasi seksi; rujukan relasi tak terselesaikan = BY_CONSTRUCTION_FAILED. docPr id/nama dinomori 1..n urut dokumen (= nomor bm-fig-NN bila urutan C14).
4a. Placeholder S16 `r:embed="{{media:<nama>}}"` (D-49) diganti rId numerik; placeholder tersisa di luar atribut relasi = BY_CONSTRUCTION_FAILED. Isi identik dari kelas figur S19 dan kelas lain tetap dua bagian (kelas dipisah, tidak digabung).
4b. prepareFigureStore (D-47): dipanggil perakit bila `assembleDocxDetailed(ctx, { svgFor })`; `assembleDocx(ctx)` (tanda tangan kontrak) mengandalkan ctx.figures yang disiapkan S51.
5. Namespace akar = himpunan BM persis; prefiks dikenal (a, pic, a14, asvg, w15, wp15) ditambah hanya bila dipakai tanpa deklarasi lokal; prefiks tak dikenal = galat.
6. R-11 `render.section.breakPerUnit=false`: satu seksi memakai unit bab/lampiran pertama.
7. Perakit tidak menyintesis judul; blok struktural dari normalisasi (permintaan S48 di file_requests.md).
8. pPr pemegang U11 diserialisasi lokal (pPrInner/rPrXml S14 tidak diekspor indeks paket); usulan non-blocking: ekspor keduanya dari `engine/docx/package`.

Siaran D-44 (C1-C14), D-47 dan D-49 diterapkan. D-44: dipatuhi pada lapisan perakit (C10 pemegang kosong tanpa pPr, C14 urutan unit = snapshot.units); C1-C9, C11-C13 milik renderer S16-S19.
Status dispatch saat uji: docx belum terisi 26 kunci (S16/S17/S18); figur S19 sudah terisi.
