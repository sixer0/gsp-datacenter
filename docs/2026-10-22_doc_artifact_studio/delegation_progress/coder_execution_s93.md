# S93 coder-execution: ekstraksi Manual DATUM 000 ke studio.doc/v1

- Status: complete. Skill: dry-run-verify-fix (2 siklus; perbaikan: urutan indeks paragraf sel research/07 = paragraf sel lalu sel tabel bersarang).
- Berkas (area eksklusif): `benchmark/extract/{extract_manual000.py, docx_read.py, doc_text_model.py, verify_manual000.py, validate_doc.ts, README.md}`, `benchmark/extract/out/{manual000_trace.json, verify_report.json}`, `benchmark/manual000/doc.json` (4.338.456 byte, sha256 3967f050..., deterministik).
- Pilihan: Python VENV `-I -B` + lxml (fidelitas OOXML penuh, indeks sama dengan S90/S96, aturan unit S96 dipakai ulang); ajv lewat `npx tsx` (`STUDIO_SCHEMA_LOAD_ORDER` + `STUDIO_AJV_OPTIONS`).
- Isi: 29 unit/sectPr (sampul dan lembar kendali explicit, toc static, 5 bagian, 17 bab, 4 lampiran) dengan setup + header/footer per unit; runs[] eksplisit apa adanya + RunProps per run, ParaFormat per paragraf/sel, border/margin/shading/lebar per sel.
- 151 tabel atas: sealBand 8, controlBlock 1, colophon 1, tabel lembar kendali 3, signatureBlock 1, toc 1, daftar bab bagian 5 (diturunkan), rel 24, data 91 (90 table + 1 checklist), aside 10, derivation 2 (2 bersarang = baris turunan), monoBlock 4.
- Figur: id `bm-fig-01..52` (urutan penempatan = docPr id); 31 rujukan eksplisit (logo, 6 datumRule 166, 24 image + x.figureRef) + 21 rule bab diturunkan; `x.figures` 52 entri + sha256 media.

## Bukti penjaga
- `npx tsx benchmark/extract/validate_doc.ts` -> `VALID studio.doc/v1`, exit 0 (mutasi uji: medan asing -> INVALID additionalProperties berpointer, exit 1).
- `VENV -I -B benchmark/extract/verify_manual000.py` -> verdict PASS, exit 0: V1 kerangka ketat 899/899 simpul; V2 748/748 paragraf badan + 4159/4159 paragraf sel teks mentah identik; V3 header/footer 29/29; V4 unit S96 4544/4544 identik berurutan (paragraf 350, caption 115, sumber 24, sel 4055); V5 bab 17, lampiran 4, tabel 151 + 2 bersarang, rujukan figur 52; V6 0 paragraf tak terpetakan, semua pointer jejak terselesaikan; V7 sha256 media cocok. Mutasi uji: satu huruf diubah -> V1/V2/V4 FAIL, exit 1.
- `py_compile` OK; `--help` exit 0 (extract, verify); `tsc` grep `benchmark/extract` kosong; `eslint benchmark/extract` exit 0; md5 BM.docx sebelum = sesudah (628f5237...).

## Keputusan (untuk dicatat controller)
1. Konvensi renderer C1-C14 tertulis di `doc.json x.benchmark.conventions` (runs verbatim tanpa prefiks, caption label+separator+inline, urutan bagian/toc/tanda tangan/turunan/rel, urutan unit).
2. KT-34 dipetakan ke `derivation.closing` (posisi BM sesudah tabel baris), menyimpang dari §13.2 (intro).
3. Lebar sel/tabel = `tcW`/`tblW` TERAKHIR (GS-01); keduanya ada di jejak.
4. Slug templat `datum-manual-000`; varian aside dari label (doctrine/ifInDoubt/quickCheck/generic).

## Permintaan (file_requests.md, 10 baris S93)
- G-01..G-08 celah skema/urutan; skema id figur untuk S94 (blocking S94); slug untuk S95/S97.

## Temuan
- Info: 42 run field footer tanpa rFonts eastAsia (ascii dipakai). `__pycache__` di `benchmark/harness/compare/` (milik S96, cache) ikut terhapus saat pembersihan; dapat dibuat ulang.
