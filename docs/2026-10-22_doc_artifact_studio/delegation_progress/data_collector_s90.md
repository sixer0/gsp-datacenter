# data-collector S90: inventaris klaster format benchmark Manual 000

Status: complete
Skills_to_Load: none. Tier naratif: 2. Model: sonnet (baris D, tanpa eskalasi).
Catatan nama berkas: brief meminta `data-collector_s90.md`; hook `docs_accountability` menolak nama berhubung-hubung (harus snake_case) dan menyarankan `data_collector_s90.md`. Nama yang dipakai: `data_collector_s90.md`.

## Berkas
- NEW `docs/2026-10-22_doc_artifact_studio/research/07_benchmark_inventory.md` (1.051 baris, 12 bagian).
- NEW `docs/2026-10-22_doc_artifact_studio/delegation_progress/data_collector_s90.md` (catatan ini).
- Diubah (aditif): `delegation_progress/file_claims.md` (3 baris S90; baris ke-2 memuat nama lama `data-collector_s90.md` yang ditolak hook, baris ke-3 nama yang benar; tool Edit tidak tersedia, ditambahkan lewat `printf >>`).
- Skrip di luar repo: `C:\Users\TRIAL\AppData\Local\Temp\hq_v21_clone\scripts\s90_core.py, s90_roles.py, s90_write.py, s90_verify.py` (+ `s90_data.json`, `s90_verify_out.txt`). BM.docx/BM.pdf hanya dibaca; ukuran dan mtime tidak berubah.

## Angka (dicetak skrip)
- Paragraf badan 748 -> 36 klaster K- (jumlah anggota 748, tiap p# tepat satu klaster, peta lengkap di 3.1).
- Paragraf sel 4.159 (748 + 4.159 = 4.907 = semua `w:p`) -> 40 klaster KT-. Run signature RS: 61.
- Tabel 153 `w:tbl` = 151 tingkat atas (16 tabel 1x1, 33 satu-baris banyak kolom, 102 lebih dari 1 baris) + 2 bersarang. Seksi 29. Penempatan 52 (semua `wp:inline`, semua di badan; 0 header/footer, 0 dalam tabel). Media 27 (PNG, semua dipakai, 0 duplikat sha256). Fon tertanam 18.

## Keputusan metodologi (controller mencatat)
- Run dominan = karakter bukan-spasi terbanyak; aturan karakter-total memecah judul seksi pendek (37 vs 36 klaster). Kunci klaster = (jenis isi T/G/E, pPr tanpa sectPr, run dominan); varian run dicatat tanpa membelah klaster.
- Label "dugaan peran" adalah heuristik saya (acuan T033/T037 research/04), bukan fakta dokumen.

## Temuan (tidak menghentikan pekerjaan, D-19)
- Semua paragraf bergaya Normal tanpa `w:pStyle`; Normal = IBM Plex Serif sz19 #2B3640 spacing after0 line270 exact; docDefaults memakai tema dan sz22.
- Setiap `tblPr` memuat dua `tblW` dan dua `tblLayout`; setiap `tcPr` dua `tcW`, 795 sel nilai berbeda (detail 5.2). Semua tabel tanpa border tingkat tabel; border per sel (TCP). `cantSplit` pada 1.221 baris, `tblHeader` pada 91 tabel, tanpa `trHeight`.
- Tanpa `lastRenderedPageBreak`, `w:br`, `pageBreakBefore`, field TOC/REF, bookmark, hyperlink, footnote, `w:sym`. Pemenggalan halaman hanya lewat 29 sectPr (tipe default nextPage, tanpa titlePg, A4 potret, margin identik). Field hanya PAGE dan NUMPAGES (21 footer).
- Slot `embedBold` keluarga IBM Plex di fontTable berisi wajah SemiBold (OS/2 weight 600), terbukti dari deobfuscation (relevan R4/research/05).
- Halaman awal seksi dari BM.pdf cocok dengan nomor halaman Peta Isi (Bab 1-17, Lampiran A-D).

## Permintaan lintas pemilik
- Tidak ada. (Opsional untuk controller: catat penyimpangan nama berkas catatan di register.)
