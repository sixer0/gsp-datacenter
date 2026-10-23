---
task_id: 2026-10-22_doc_artifact_studio/S90
date: 2026-10-22
agent: data-collector
items_collected: 355
---

# Inventaris klaster format benchmark Manual DATUM 000 (S90)

## 1. Task Overview

Baris S90 blueprint (`identification/02_structured.md` baris S90): inventaris mekanis format langsung `BM.docx` (read-only) untuk S01, S93, S94, S95. Dokumen ini hanya mengumpulkan dan mengutip; tidak merancang, tidak menyimpulkan. Setiap kolom "dugaan" adalah label heuristik dari penulis inventaris, bukan fakta dokumen.

- Sumber: `C:\Users\TRIAL\workspace\Manual DATUM GSP\Manual_Komprehensif_DATUM_GSP_000-GSP-STD-X-2026_RevA.docx` (BM.docx), 4.378.605 byte, tidak diubah (dibaca in-memory dengan `zipfile` + `lxml`).
- Python: `C:\Users\TRIAL\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe -I -B`, cwd di luar folder skill. Skrip bantu (bukan di repo, bukan di folder BM): `C:\Users\TRIAL\AppData\Local\Temp\hq_v21_clone\scripts\` (`s90_core.py`, `s90_roles.py`, `s90_write.py`, `s90_verify.py`).
- Acuan silang: `research/04_manual_docx_tables.md` (teks 153 tabel, skala huruf Tabel 4.4 = T033, anatomi Tabel 4.7 = T037) dan `research/05_render_calibration.md` (hitungan dasar).

### 1.1 Konvensi dan definisi (berlaku di seluruh dokumen)

- **Paragraf badan** = elemen `w:p` anak langsung `w:body`, diindeks `p#0..p#747` menurut urutan dokumen (748). **Paragraf sel** = `w:p` anak langsung `w:tc` (termasuk sel pada 2 tabel bersarang), 4.159 buah; 748 + 4.159 = 4.907 = jumlah semua `w:p` di `document.xml`.
- **Tabel**: 153 elemen `w:tbl` = 151 tabel tingkat atas (ID `T001..T151`, urutan dokumen, sama dengan numerasi `research/04`) + 2 tabel bersarang (`N01` di dalam T034, `N02` di dalam T050).
- **Tanda tangan paragraf** = isi `w:pPr` selain `w:sectPr` dan `w:rPr` (spacing, jc, ind, keepNext, keepLines, pageBreakBefore, outlineLvl, tabs, pBdr, shd; yang tidak ada di dokumen tidak ditampilkan). `sectPr` dilaporkan terpisah (kolom "sectPr").
- **Tanda tangan run** (RS-nn) = `w:rPr` yang dinormalkan: wajah (`w:rFonts` ascii/hAnsi/cs/eastAsia; di seluruh dokumen keempatnya identik per run), `w:sz`, `w:color`, `w:b`, `w:i`, `w:caps`, `w:spacing w:val`. `b=1` berarti `<w:b/>` tanpa val; `b=0` berarti `w:val="0"`. `NORPR` = run tanpa `w:rPr` (run berisi gambar).
- **Run dominan** = tanda tangan run dengan jumlah karakter bukan-spasi terbanyak dalam paragraf (seri: run pertama dengan tanda tangan itu). Aturan ini dipilih karena aturan "karakter total" memecah judul seksi pendek (`4.3   Palet`) dari klasternya; hitungan ketiga aturan: 36 (bukan-spasi), 37 (karakter total), 36 (run teks pertama) klaster badan.
- **Klaster** = kunci `(jenis isi, tanda tangan paragraf, run dominan)`. Jenis isi: `T` teks, `G` ada gambar (`w:drawing`), `E` kosong (tanpa teks dan gambar). Varian run (non-dominan) dan pola urutan run dicatat per klaster dan tidak membelah klaster. ID klaster diberi urut kemunculan pertama di dokumen. Satuan: spacing/ind dalam twip (1/20 pt); `sp[b a l]` = before/after/line; `l270x=13.5pt` = `lineRule=exact`; `sz` dalam half-point (sz 19 = 9,5 pt); `w:spacing w:val` dalam 1/20 pt.
- Border: `sz` dalam 1/8 pt (sz 5 = 0,63 pt = 0,22 mm; sz 10 = 1,25 pt = 0,44 mm).

### 1.2 Ringkasan hitungan (dicetak dari skrip `s90_core.py`, bukan diketik)

| Butir | Nilai | Catatan |
|---|---|---|
| Paragraf badan | 748 | `w:body/w:p` |
| Paragraf sel tabel | 4159 | `w:tc/w:p` |
| Semua `w:p` di document.xml | 4907 | = 748 + 4159 |
| Tabel tingkat atas | 151 | + 2 bersarang = 153 `w:tbl` |
| Seksi (`w:sectPr`) | 29 | 28 di `w:pPr` paragraf badan + 1 `w:sectPr` akhir body |
| Penempatan gambar (`w:drawing`) | 52 | semuanya `wp:inline`, semuanya di badan; 0 di header/footer; 0 di tabel |
| Berkas media | 27 | `word/media/image1..27.png`, semuanya dipakai |
| Klaster paragraf badan (K-) | 36 | jumlah anggota 748 |
| Klaster paragraf sel (KT-) | 40 | jumlah anggota 4159 |
| Tanda tangan run (RS-) | 61 | seluruh badan + sel |
| Fon tertanam | 18 | `word/fonts/font1..18.odttf` |

## 2. Registri tanda tangan run (RS)

Dipakai klaster di bagian 3 dan 4. `runs` = jumlah `w:r` dengan tanda tangan itu, `kar` = jumlah karakter teksnya. Kolom "pertama" = konteks (B badan p#, C sel paragraf-sel ke-n menurut urutan dokumen) dan teks.

| RS | Wajah (ascii=hAnsi=cs=eastAsia) | sz (half-pt) | pt | warna | b | i | caps | spc | runs | kar | pertama |
|---|---|---|---|---|---|---|---|---|---|---|---|
| RS01 | (tanpa rPr, run gambar) | - | - | - | - | - | - | - | 52 | 0 | B0 |
| RS02 | IBM Plex Sans Cond | 14 | 7 | 7A756E | 0 | 0 | - | - | 2 | 361 | B1 Divisi Engineering & Technical Intell... |
| RS03 | IBM Plex Sans Cond | 14 | 7 | 6E1420 | 1 | 0 | 1 | 30 | 8 | 123 | B4 Standar · Manual Komprehensif · Pandu... |
| RS04 | IBM Plex Sans Cond | 50 | 25 | 14110F | 1 | 0 | - | - | 2 | 63 | B5 Manual Komprehensif DATUM GSP |
| RS05 | IBM Plex Serif | 21 | 10.5 | 33302C | 0 | 1 | - | - | 6 | 1024 | B7 Satu kitab kerja untuk tim GSP: gaya ... |
| RS06 | IBM Plex Sans Cond | 15 | 7.5 | 7A756E | 0 | 0 | - | - | 1 | 154 | B8 Menyatukan DATUM House Style Explaine... |
| RS07 | IBM Plex Mono | 12 | 6 | 7A756E | 0 | 0 | - | 24 | 1 | 46 | B10 MANUAL · DATUM TERPADU · ID · REV A ·... |
| RS08 | IBM Plex Sans Cond | 32 | 16 | 14110F | 1 | 0 | - | - | 2 | 73 | B13 Kendali Dokumen, Riwayat Revisi, dan ... |
| RS09 | IBM Plex Sans Cond | 18 | 9 | 14110F | 1 | 0 | - | - | 4 | 85 | B14 A · Riwayat revisi |
| RS10 | IBM Plex Serif | 17 | 8.5 | 33302C | 0 | 0 | - | - | 2 | 400 | B19 Setiap aturan dalam manual ini dikuti... |
| RS11 | DejaVu Sans | 15 | 7.5 | 33302C | 0 | 0 | - | - | 1 | 1 | B19 △ |
| RS12 | IBM Plex Sans Cond | 48 | 24 | 14110F | 1 | 0 | - | - | 5 | 49 | B30 Fondasi |
| RS13 | IBM Plex Sans Cond | 13 | 6.5 | B45309 | 1 | 0 | 1 | 28 | 21 | 133 | B33 Bab 1 |
| RS14 | IBM Plex Sans Cond | 32 | 16 | 101418 | 1 | 0 | - | - | 21 | 645 | B35 Identitas, Peta, dan Cara Memakai Manual |
| RS15 | IBM Plex Mono | 16 | 8 | 6B7783 | 0 | 0 | - | - | 98 | 626 | B36 1.1 |
| RS16 | IBM Plex Sans Cond | 22 | 11 | 101418 | 1 | 0 | - | - | 98 | 2726 | B36 Dokumen ini dan kebutuhan yang melahi... |
| RS17 | IBM Plex Serif | 19 | 9.5 | 2B3640 | 0 | 0 | - | - | 210 | 46158 | B38 Manual ini menyatukan keempatnya ke d... |
| RS18 | IBM Plex Serif | 19 | 9.5 | 101418 | 1 | 0 | - | - | 53 | 883 | B38 bentuk |
| RS19 | IBM Plex Sans Cond | 14 | 7 | 101418 | 1 | 0 | 1 | 16 | 115 | 1461 | B41 Tabel 1.1 |
| RS20 | IBM Plex Sans Cond | 15 | 7.5 | 2B3640 | 0 | 0 | - | - | 115 | 6436 | B41 Peta sumber ke bab manual, per berkas... |
| RS21 | IBM Plex Serif | 19 | 9.5 | 6B7783 | 0 | 0 | - | - | 52 | 52 | B51 – |
| RS22 | DejaVu Sans | 17 | 8.5 | 2B3640 | 0 | 0 | - | - | 3 | 3 | B53 ■ |
| RS23 | IBM Plex Sans Cond | 13 | 6.5 | 6B7783 | 1 | 0 | - | 12 | 141 | 1246 | B78 KUNCI |
| RS24 | IBM Plex Sans Cond | 13 | 6.5 | 6B7783 | 0 | 0 | - | - | 161 | 12068 | B78 garis penuh isi · putus-putus keputus... |
| RS25 | IBM Plex Mono | 16 | 8 | B45309 | 1 | 0 | - | - | 28 | 28 | B84 1 |
| RS26 | IBM Plex Sans Cond | 19 | 9.5 | 101418 | 1 | 0 | - | - | 11 | 427 | B255 Langkah 1. Tulis pertanyaannya dalam ... |
| RS27 | IBM Plex Sans Cond | 12 | 6 | F6E9E9 | 1 | 0 | 1 | 26 | 16 | 488 | C0 KLASIFIKASI · TERBATAS |
| RS28 | IBM Plex Sans Cond | 12 | 6 | 7A756E | 1 | 0 | 1 | 14 | 8 | 67 | C2 Nomor dokumen |
| RS29 | IBM Plex Mono | 14 | 7 | 14110F | 0 | 0 | - | - | 36 | 193 | C3 000/GSP/STD/X/2026 |
| RS30 | IBM Plex Mono | 12 | 6 | 7A756E | 0 | 0 | - | - | 1 | 46 | C18 PT GEMILANG SATRIA PERKASA · NIB 9120... |
| RS31 | IBM Plex Mono | 12 | 6 | 6E1420 | 1 | 0 | - | - | 1 | 29 | C19 // 20261008 ID T — TERBITAN 1 |
| RS32 | IBM Plex Sans Cond | 13 | 6.5 | 7A756E | 1 | 0 | 1 | 12 | 16 | 105 | C22 Rev |
| RS33 | IBM Plex Serif | 16 | 8 | 33302C | 0 | 0 | - | - | 46 | 1267 | C28 08-X-2026 |
| RS34 | IBM Plex Sans Cond | 13 | 6.5 | 6E1420 | 1 | 0 | 1 | 18 | 5 | 44 | C75 Bagian I |
| RS35 | IBM Plex Sans Cond | 17 | 8.5 | 14110F | 1 | 0 | - | - | 5 | 49 | C76 Fondasi |
| RS36 | IBM Plex Mono | 14 | 7 | 14110F | 1 | 0 | - | - | 5 | 9 | C77 4 |
| RS37 | IBM Plex Mono | 14 | 7 | 7A756E | 0 | 0 | - | - | 38 | 226 | C78 Bab 1 |
| RS38 | IBM Plex Sans Cond | 18 | 9 | 14110F | 0 | 0 | - | - | 17 | 543 | C156 Identitas, Peta, dan Cara Memakai Manual |
| RS39 | DejaVu Sans | 10 | 5 | 101418 | 1 | 0 | 1 | - | 18 | 18 | C163 ■ |
| RS40 | IBM Plex Mono | 11 | 5.5 | 101418 | 1 | 0 | 1 | - | 18 | 144 | C163 TERUKUR |
| RS41 | IBM Plex Mono | 11 | 5.5 | 6B7783 | 0 | 0 | 1 | - | 40 | 349 | C164 SUMBER LAMPIRAN D |
| RS42 | IBM Plex Sans Cond | 12 | 6 | 6B7783 | 0 | 0 | - | - | 3 | 111 | C165 Empat dokumen sumber, 8 Oktober 2026. |
| RS43 | IBM Plex Sans Cond | 13 | 6.5 | 6B7783 | 1 | 0 | 1 | 12 | 321 | 3147 | C166 No |
| RS44 | IBM Plex Mono | 14 | 7 | 101418 | 0 | 0 | - | - | 945 | 7037 | C170 1 |
| RS45 | IBM Plex Serif | 16 | 8 | 2B3640 | 0 | 0 | - | - | 2284 | 90942 | C171 Panduan DATUM |
| RS46 | DejaVu Sans | 12 | 6 | 6B7783 | 0 | 0 | - | - | 20 | 20 | C190 ■ |
| RS47 | IBM Plex Mono | 15 | 7.5 | 101418 | 0 | 0 | - | - | 163 | 348 | C215 44 |
| RS48 | DejaVu Sans | 10 | 5 | 9B1C1C | 1 | 0 | 1 | - | 1 | 1 | C231 △ |
| RS49 | IBM Plex Mono | 11 | 5.5 | 9B1C1C | 1 | 0 | 1 | - | 1 | 7 | C231 ASUMSI |
| RS50 | IBM Plex Sans Cond | 14 | 7 | 101418 | 1 | 0 | 1 | 18 | 10 | 323 | C254 Diktum manual ini |
| RS51 | IBM Plex Serif | 17 | 8.5 | 2B3640 | 0 | 0 | - | - | 22 | 2207 | C255 Tulis dan gambar hanya yang bisa dibu... |
| RS52 | IBM Plex Sans Cond | 14 | 7 | 101418 | 1 | 0 | 1 | 14 | 3 | 57 | C377 Pembungkus |
| RS53 | IBM Plex Sans Cond | 13 | 6.5 | B45309 | 1 | 0 | 1 | 22 | 2 | 91 | C531 Turunan D-4.1 · Grid A4 menutup dan s... |
| RS54 | IBM Plex Sans Cond | 14 | 7 | 6B7783 | 0 | 0 | - | - | 2 | 489 | C533 Setiap simpul diagram, tinggi gambar,... |
| RS55 | DejaVu Sans | 13 | 6.5 | 101418 | 0 | 0 | - | - | 14 | 14 | C535 ■ |
| RS56 | DejaVu Sans | 12 | 6 | 101418 | 0 | 0 | - | - | 25 | 25 | C704 ■ |
| RS57 | DejaVu Sans | 10 | 5 | B45309 | 1 | 0 | 1 | - | 5 | 5 | C723 ◈ |
| RS58 | IBM Plex Mono | 11 | 5.5 | B45309 | 1 | 0 | 1 | - | 5 | 55 | C723 DITURUNKAN |
| RS59 | IBM Plex Sans Cond | 13 | 6.5 | 6B7783 | 1 | 0 | 1 | 22 | 4 | 123 | C726 Pola pengikatan, datumbind.py |
| RS60 | DejaVu Sans | 14 | 7 | 2B3640 | 0 | 0 | - | - | 17 | 17 | C2007 ○ |
| RS61 | IBM Plex Serif | 17 | 8.5 | 101418 | 1 | 0 | - | - | 18 | 36 | C2228 1. |

## 3. Klaster paragraf badan (K-), 36 klaster, 748 paragraf

Kolom "pola run" = urutan RS dalam paragraf beserta jumlah paragraf; "varian" = RS non-dominan beserta jumlah run dan contoh teks. "idx" = paragraf pertama..terakhir (p#). "sectPr" = jumlah anggota yang memegang `w:sectPr` di `w:pPr`; "tab" = jumlah anggota yang memuat `w:tab` tingkat run. Tidak ada klaster yang memakai `keepLines`, `pageBreakBefore`, `shd` paragraf, atau `w:tabs` selain yang tertulis di kolom format.

| ID | n | isi | format paragraf | dominan | idx | sectPr | tab | pola run | varian run | contoh teks (<=80 kar.) | dugaan peran |
|---|---|---|---|---|---|---|---|---|---|---|---|
| K-01 | 1 | G | sp[b360 a0 l240auto] | RS01 | 0..0 | 0 | 0 | RS01 x1 | - | (tanpa teks) | dugaan: logo sampul (paragraf gambar gsp-tinta.png) |
| K-02 | 1 | T | sp[b100 a80 l210x=10.5pt] | RS02 | 1..1 | 0 | 0 | RS02 x1 | - | "Divisi Engineering & Technical Intelligence · Jl. Bangka Raya No. 27, Pela Ma..." | dugaan: baris alamat kop sampul |
| K-03 | 1 | E | sp[b0 a800 l120x=6.0pt];pBdr(bottom[color=C4BEB4,space=1,sz=5,val=single]) | NO-RUN | 2..2 | 0 | 0 | (tanpa run) x1 | - | (tanpa teks) | dugaan: garis rambut kop sampul (paragraf kosong dengan border bawah C4BEB4) |
| K-04 | 6 | G | sp[b0 a140 l240auto] | RS01 | 3..612 | 0 | 0 | RS01 x6 | - | (tanpa teks) | dugaan: paragraf gambar Datum Rule 166 mm: sampul dan 5 pembatas bagian |
| K-05 | 6 | T | sp[b0 a160 l220x=11.0pt] | RS03 | 4..613 | 0 | 0 | RS03 x6 | - | "Standar · Manual Komprehensif · Panduan Skill DATUM GSP" / "Bagian III" / "Bagian V" | dugaan: kicker sampul dan kicker pembatas bagian (Cond kapital, marun 6E1420) |
| K-06 | 1 | T | sp[b0 a0 l580x=29.0pt] | RS04 | 5..5 | 0 | 0 | RS04 x1 | - | "Manual Komprehensif DATUM GSP" | dugaan: judul sampul, baris 1 |
| K-07 | 1 | T | sp[b0 a180 l580x=29.0pt] | RS04 | 6..6 | 0 | 0 | RS04 x1 | - | "Bentuk, Visual, Simbol, dan Bahasa" | dugaan: judul sampul, baris 2 |
| K-08 | 1 | T | sp[b0 a120 l300x=15.0pt];ind[right=1701] | RS05 | 7..7 | 0 | 0 | RS05 x1 | - | "Satu kitab kerja untuk tim GSP: gaya rumah DATUM, pustaka chart, simbol engin..." | dugaan: lede sampul (Serif miring 10,5 pt) |
| K-09 | 1 | T | sp[b0 a520 l240x=12.0pt];ind[right=1134] | RS06 | 8..8 | 0 | 0 | RS06 x1 | - | "Menyatukan DATUM House Style Explained Rev A · Panduan Jenis Chart v1.1 · Pan..." | dugaan: daftar dokumen sumber di sampul (Cond 7,5 pt) |
| K-10 | 1 | E | sp[b280 a0 l120x=6.0pt] | NO-RUN | 9..9 | 0 | 0 | (tanpa run) x1 | - | (tanpa teks) | dugaan: spasi kosong sampul |
| K-11 | 1 | T | sp[b200 a0 l180x=9.0pt] | RS07 | 10..10 | 0 | 0 | RS07 x1 | - | "MANUAL · DATUM TERPADU · ID · REV A · X · 2026" | dugaan: string identitas dokumen di sampul (Mono 6 pt, spasi huruf +1,2 pt) |
| K-12 | 28 | E | (none) | NO-RUN | 11..740 | 28 | 0 | (tanpa run) x28 | - | (tanpa teks) | dugaan: pemegang sectPr: paragraf kosong tanpa properti lain, satu per akhir seksi 1-28 |
| K-13 | 2 | T | sp[b360 a120 l220x=11.0pt] | RS03 | 12..23 | 0 | 0 | RS03 x2 | - | "Lembar Kendali" / "Daftar Isi" | dugaan: kicker halaman Lembar Kendali dan Daftar Isi |
| K-14 | 1 | T | sp[b0 a200 l400x=20.0pt] | RS08 | 13..13 | 0 | 0 | RS08 x1 | - | "Kendali Dokumen, Riwayat Revisi, dan Pernyataan Verifikasi" | dugaan: judul halaman Lembar Kendali (Cond 16 pt) |
| K-15 | 4 | T | sp[b0 a60 l240x=12.0pt] | RS09 | 14..20 | 0 | 0 | RS09 x4 | - | "A · Riwayat revisi" / "C · Pernyataan metode" / "D · Distribusi terkendali" | dugaan: judul blok Lembar Kendali (Cond 9 pt tebal) |
| K-16 | 3 | E | sp[b0 a0 l160x=8.0pt] | NO-RUN | 15..21 | 0 | 0 | (tanpa run) x3 | - | (tanpa teks) | dugaan: spasi kosong Lembar Kendali |
| K-17 | 1 | T | sp[b0 a160 l250x=12.5pt];jc=both;ind[right=1701] | RS10 | 19..19 | 0 | 0 | RS10 RS11 RS10 x1 | RS11 x1 "△" | "Setiap aturan dalam manual ini dikutip atau diringkas dari empat dokumen sumb..." | dugaan: pernyataan metode Lembar Kendali (Serif 8,5 pt, glif DejaVu) |
| K-18 | 1 | T | sp[b0 a160 l400x=20.0pt] | RS08 | 24..24 | 0 | 0 | RS08 x1 | - | "Peta Isi Manual" | dugaan: judul halaman Daftar Isi (Cond 16 pt) |
| K-19 | 1 | T | sp[b160 a0 l200x=10.0pt];ind[right=1701] | RS02 | 25..25 | 0 | 0 | RS02 x1 | - | "Nomor halaman dicetak dari render PDF terbitan ini. Word dapat memaginasi sed..." | dugaan: catatan kaki Daftar Isi (Cond 7 pt abu) |
| K-20 | 5 | E | sp[b1400 a0 l120x=6.0pt] | NO-RUN | 27..611 | 0 | 0 | (tanpa run) x5 | - | (tanpa teks) | dugaan: spasi kosong di atas judul pembatas bagian (before 1400) |
| K-21 | 5 | T | sp[b0 a180 l560x=28.0pt];outlineLvl=0 | RS12 | 30..614 | 0 | 0 | RS12 x5 | - | "Fondasi" / "Visual" / "Penjaminan dan Pemakaian" | dugaan: judul pembatas bagian (Cond 24 pt, outlineLvl 0) |
| K-22 | 5 | T | sp[b0 a360 l300x=15.0pt];ind[right=2154] | RS05 | 31..615 | 0 | 0 | RS05 x5 | - | "Apa manual ini, prinsip yang mengikat seluruh isinya, siapa pemilik setiap ke..." / "Kapan memakai chart dan chart yang mana, pustaka 58 jenis chart dalam palet D..." / "Workbook dan command brief, satu gerbang rilis yang menyatukan lint DATUM den..." | dugaan: lede pembatas bagian (Serif miring 10,5 pt) |
| K-23 | 21 | T | sp[b0 a80 l180x=9.0pt];keepNext=1 | RS13 | 33..741 | 0 | 0 | RS13 x21 | - | "Bab 1" / "Bab 11" / "Lampiran D" | dugaan: kicker bab dan lampiran (Cond 6,5 pt kapital, amber B45309) |
| K-24 | 21 | G | sp[b0 a80 l240auto];keepNext=1 | RS01 | 34..742 | 0 | 0 | RS01 x21 | - | (tanpa teks) | dugaan: paragraf gambar Datum Rule 128 mm di atas judul bab/lampiran |
| K-25 | 21 | T | sp[b0 a140 l400x=20.0pt];keepNext=1;outlineLvl=0 | RS14 | 35..743 | 0 | 0 | RS14 x21 | - | "Identitas, Peta, dan Cara Memakai Manual" / "Gaya Bahasa Ahli: Tujuh Lapis" / "Register Sumber" | dugaan: judul bab dan lampiran (Cond 16 pt, outlineLvl 0) |
| K-26 | 98 | T | sp[b270 a80 l270x=13.5pt];keepNext=1;outlineLvl=1 | RS16 | 36..702 | 0 | 0 | RS15 RS16 x98 | RS15 x98 "1.1" | "1.1 Dokumen ini dan kebutuhan yang melahirkannya" / "8.2 Galeri dan katalog per kelompok" / "17.5 Risiko tersisa dan yang belum saya pastikan" | dugaan: judul seksi: nomor Mono 8 pt abu + judul Cond 11 pt (outlineLvl 1) |
| K-27 | 155 | E | sp[b0 a0 l135x=6.75pt] | NO-RUN | 37..747 | 0 | 0 | (tanpa run) x155 | - | (tanpa teks) | dugaan: paragraf kosong pemisah (tinggi tetap 6,75 pt) |
| K-28 | 85 | T | sp[b0 a135 l270x=13.5pt];jc=both;ind[right=2154] | RS17 | 38..729 | 0 | 0 | RS17 x81; RS17 RS18 RS17 RS18 RS17 RS18 RS17 RS18 RS17 x2; RS17 RS18 RS17 RS18 RS17 RS18 RS17 x1; RS17 RS18 RS17 RS18 RS17 RS18 RS17 RS18 RS17 RS18 RS17 x1 | RS18 x16 "bentuk" | "Manual ini menyatukan keempatnya ke dalam satu urutan keputusan yang dihadapi..." / "Untuk dashboard, prinsip Holistics berlaku dengan satu batas DATUM. Kenali au..." / "Cetak halaman ini, centang secara fisik pada naskah terakhir, dan arsipkan be..." | dugaan: badan: Serif 9,5/13,5 pt ink700, rata kiri-kanan, indent kanan 38 mm (kolom rel bukti) |
| K-29 | 115 | T | sp[b120 a48 l220x=11.0pt];keepNext=1 | RS20 | 41..746 | 0 | 0 | RS19 RS20 x115 | RS19 x115 "Tabel 1.1" | "Tabel 1.1 Peta sumber ke bab manual, per berkas yang diterima pada 8 Oktober ..." / "Gambar 10.3 Pustaka DATUM isa: dua belas simbol instrumentasi." / "Tabel D.2 Sumber eksternal yang dikutip lewat dokumen sumber." | dugaan: caption Tabel/Gambar: label Cond kapital tebal + teks Cond 7,5 pt, keepNext |
| K-30 | 52 | T | sp[b0 a60 l270x=13.5pt];jc=left;ind[hang=283,left=283,right=2154];tabs(tab[pos=283,val=left]) | RS17 | 51..710 | 0 | 52 | RS21 RS17 x38; RS21 RS18 RS17 x13; RS21 RS18 RS17 RS22 RS17 RS22 RS17 RS22 RS17 x1 | RS21 x52 "–"; RS18 x14 "Bahasa."; RS22 x3 "■" | "– Bahasa. Bahasa Indonesia baku. Istilah teknis Inggris dipertahankan tanpa h..." / "– Urutan bermakna: urut nilai, atau urutan alami." / "– Chart galeri memakai data ilustrasi. Tidak satu pun angka di Bab 8 boleh di..." | dugaan: butir daftar berpenanda en dash (tab + hanging 5 mm) |
| K-31 | 14 | E | sp[b0 a0 l68x=3.4pt] | NO-RUN | 56..711 | 0 | 0 | (tanpa run) x14 | - | (tanpa teks) | dugaan: paragraf kosong penutup (tinggi tetap 3,4 pt), sesudah blok |
| K-32 | 24 | G | sp[b0 a48 l240auto];keepNext=1 | RS01 | 77..487 | 0 | 0 | RS01 x24 | - | (tanpa teks) | dugaan: paragraf gambar figur badan (keepNext) |
| K-33 | 2 | T | sp[b0 a20 l180x=9.0pt];keepNext=1 | RS24 | 78..114 | 0 | 0 | RS23 RS24 x2 | RS23 x2 "KUNCI" | "KUNCI garis penuh isi · putus-putus keputusan · titik-titik rekam · amber jal..." / "KUNCI stadion mulai dan selesai · segi enam gerbang · garis merah putus-putus..." | dugaan: baris KUNCI legenda gambar (Cond 6,5 pt abu) |
| K-34 | 24 | T | sp[b0 a0 l180x=9.0pt];pBdr(top[color=C3CBD1,space=1,sz=5,val=single]) | RS24 | 79..488 | 0 | 0 | RS23 RS24 RS23 RS24 x24 | RS23 x48 "SUMBER" | "SUMBER SKILL.md DATUM §15 · STD-GAYA-AHLI-001 Bab 6 · digambar dengan datum_d..." / "SUMBER Panduan Simbol Engineering GSP v1.0 Gambar 5.2. PROVENANS bentuk konve..." / "SUMBER Panduan Simbol Engineering GSP v1.0 Gambar 6.2. Kerucut pandang harus ..." | dugaan: baris SUMBER/PROVENANS di bawah figur (border atas C3CBD1) |
| K-35 | 28 | T | sp[b0 a60 l270x=13.5pt];ind[hang=397,left=397,right=2154];tabs(tab[pos=397,val=left]) | RS17 | 84..700 | 0 | 28 | RS25 RS18 RS17 x21; RS25 RS17 x7 | RS25 x28 "1"; RS18 x21 "Regulasi dan kontrak." | "1 Regulasi dan kontrak. Peraturan yang berlaku, KAK, dan kontrak klien mengal..." / "5 Penilaian juri buta. Cuplikan 150 sampai 600 kata tanpa alamat berkas, nama..." / "4 Fase 3, kemampuan baru: C-01, P-02 sampai P-12, masing-masing diuji pada sa..." | dugaan: butir daftar bernomor (angka Mono amber + tab + hanging 7 mm) |
| K-36 | 11 | T | sp[b180 a20 l270x=13.5pt];keepNext=1 | RS26 | 255..464 | 0 | 0 | RS26 x11 | - | "Langkah 1. Tulis pertanyaannya dalam satu kalimat" / "Listrik dan daya, IEC 60617" / "Topologi jaringan, jenis garis, rak, dan rambu" | dugaan: sub-judul langkah/kelompok (Cond 9,5 pt tebal, keepNext) |

Dominan terbaca: RS02 = Cond 7pt #7A756E; RS03 = Cond 7pt #6E1420 B+CAPS spc30(1.5pt); RS04 = Cond 25pt #14110F B; RS05 = Serif 10.5pt #33302C I; RS06 = Cond 7.5pt #7A756E; RS07 = Mono 6pt #7A756E spc24(1.2pt); RS08 = Cond 16pt #14110F B; RS09 = Cond 9pt #14110F B; RS10 = Serif 8.5pt #33302C; RS12 = Cond 24pt #14110F B; RS13 = Cond 6.5pt #B45309 B+CAPS spc28(1.4pt); RS14 = Cond 16pt #101418 B; RS16 = Cond 11pt #101418 B; RS17 = Serif 9.5pt #2B3640; RS20 = Cond 7.5pt #2B3640; RS24 = Cond 6.5pt #6B7783; RS26 = Cond 9.5pt #101418 B.

Jumlah anggota klaster badan: 1 + 1 + 1 + 6 + 6 + 1 + 1 + 1 + 1 + 1 + 1 + 28 + 2 + 1 + 4 + 3 + 1 + 1 + 1 + 5 + 5 + 5 + 21 + 21 + 21 + 98 + 155 + 85 + 115 + 52 + 14 + 24 + 2 + 24 + 28 + 11 = **748**.

### 3.1 Peta paragraf badan -> klaster (lengkap, urut p#0..p#747)

Setiap p# muncul tepat satu kali; satu baris = 25 paragraf.

```
p#000-024: 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 15 16 15 17 15 16 12 13 18
p#025-049: 19 12 20 04 05 21 22 12 23 24 25 26 27 28 26 28 29 27 26 29 27 26 28 29 27
p#050-074: 26 30 30 30 30 30 31 26 27 28 12 23 24 25 26 27 28 26 28 29 27 27 26 28 26
p#075-099: 28 29 32 33 34 27 28 26 28 35 35 35 35 35 31 12 23 24 25 26 27 29 27 28 27
p#100-124: 26 28 30 30 30 30 31 26 29 27 26 28 29 32 33 34 27 26 27 29 27 28 26 28 12
p#125-149: 20 04 05 21 22 12 23 24 25 26 28 29 27 26 27 26 29 27 28 26 29 27 28 26 29
p#150-174: 27 26 28 27 29 27 26 29 27 28 26 28 28 29 32 34 27 29 27 12 23 24 25 26 29
p#175-199: 27 26 28 28 26 28 29 27 26 27 27 26 29 27 27 26 28 27 28 26 28 26 28 29 27
p#200-224: 28 26 28 29 27 12 23 24 25 26 27 29 27 30 30 30 30 30 30 31 26 29 27 28 26
p#225-249: 28 28 26 28 27 28 26 29 27 28 26 27 12 20 04 05 21 22 12 23 24 25 26 27 28
p#250-274: 26 29 27 26 28 36 29 27 36 30 30 30 30 31 36 29 27 36 30 30 30 30 31 36 28
p#275-299: 29 27 28 26 27 29 27 26 28 26 29 27 26 30 30 30 30 30 30 31 28 26 29 27 12
p#300-324: 23 24 25 26 27 28 26 29 32 34 27 29 27 29 32 34 27 29 27 29 32 34 27 29 27
p#325-349: 29 32 34 27 29 27 29 32 34 27 29 27 26 28 29 27 26 29 27 29 27 26 28 26 29
p#350-374: 27 12 23 24 25 26 27 26 28 29 27 28 26 29 27 29 27 29 27 28 26 28 26 28 26
p#375-399: 28 29 32 34 27 29 32 34 27 29 32 34 27 12 23 24 25 26 27 28 26 28 29 27 26
p#400-424: 35 35 35 35 35 31 27 26 28 36 28 29 32 34 27 29 32 34 27 29 27 36 28 29 32
p#425-449: 34 27 29 27 36 28 29 32 34 27 29 27 36 28 29 32 34 27 29 32 34 27 29 27 36
p#450-474: 29 32 34 27 29 32 34 27 29 32 34 27 29 27 36 29 32 34 27 29 32 34 27 30 30
p#475-499: 30 30 30 31 26 27 26 29 32 34 27 29 32 34 27 26 29 27 29 27 12 20 04 05 21
p#500-524: 22 12 23 24 25 26 27 28 26 28 29 27 26 28 26 29 27 26 28 29 27 12 23 24 25
p#525-549: 26 28 29 27 29 27 27 26 28 29 27 29 27 27 26 28 29 27 28 29 27 29 27 27 12
p#550-574: 23 24 25 26 28 29 27 29 27 29 27 27 26 28 29 27 29 27 27 26 28 29 27 29 27
p#575-599: 29 27 27 12 23 24 25 26 28 27 26 29 27 26 29 27 26 28 29 27 28 27 26 27 26
p#600-624: 35 35 35 35 35 35 35 31 27 28 12 20 04 05 21 22 12 23 24 25 26 27 29 27 29
p#625-649: 27 28 27 28 26 27 29 27 28 12 23 24 25 26 27 29 27 26 28 26 28 29 27 26 30
p#650-674: 30 30 30 30 30 30 30 30 30 31 26 29 27 26 28 35 35 35 35 35 35 35 31 28 26
p#675-699: 27 29 27 12 23 24 25 26 27 28 29 27 26 28 29 27 26 29 27 26 29 27 35 35 35
p#700-724: 35 31 26 30 30 30 30 30 30 30 30 31 12 23 24 25 28 29 27 29 27 29 27 29 27
p#725-747: 12 23 24 25 28 29 27 12 23 24 25 29 27 29 27 12 23 24 25 29 27 29 27
```

(Angka = nomor klaster K-nn.)

## 4. Klaster paragraf di dalam sel tabel (KT-), 40 klaster, 4159 paragraf

Kolom "tabel" = jumlah tabel yang memuat klaster (contoh ID tabel).

| ID | n | isi | format paragraf | dominan | pola run | varian run | contoh teks (<=80 kar.) | tabel | dugaan peran |
|---|---|---|---|---|---|---|---|---|---|
| KT-01 | 8 | T | sp[b0 a0 l180x=9.0pt];jc=left | RS27 | RS27 x8 | - | "KLASIFIKASI · TERBATAS" | 8 (T001, T004, T009, T011, ...) | dugaan: strip klasifikasi sampul/pembatas, sel kiri (teks terang di atas shading marun) |
| KT-02 | 8 | T | sp[b0 a0 l180x=9.0pt];jc=right | RS27 | RS27 x8 | - | "SALINAN INDUK · PENGGUNAAN INTERNAL GSP" | 8 (T001, T004, T009, T011, ...) | dugaan: strip klasifikasi sampul/pembatas, sel kanan |
| KT-03 | 8 | T | sp[b0 a0 l220x=11.0pt] | RS28 | RS28 x8 | - | "Nomor dokumen" / "Ditujukan kepada" / "Bahasa" | 1 (T002) | dugaan: label sel metadata dokumen (Cond 6 pt kapital abu) |
| KT-04 | 15 | T | sp[b0 a0 l220x=11.0pt] | RS29 | RS29 x15 | - | "000/GSP/STD/X/2026" / "Indonesia" / "03" | 4 (T002, T005, T006, T007) | dugaan: nilai sel metadata dan sel tanda tangan/distribusi (Mono 7 pt) |
| KT-05 | 1 | T | sp[b0 a0 l180x=9.0pt];jc=left | RS30 | RS30 x1 | - | "PT GEMILANG SATRIA PERKASA · NIB 9120208940517" | 1 (T003) | dugaan: cap penerbit sampul, sel kiri (Mono 6 pt) |
| KT-06 | 1 | T | sp[b0 a0 l180x=9.0pt];jc=right | RS31 | RS31 x1 | - | "// 20261008 ID T — TERBITAN 1" | 1 (T003) | dugaan: cap terbit sampul, sel kanan (Mono 6 pt marun tebal) |
| KT-07 | 16 | T | sp[b0 a0 l180x=9.0pt] | RS32 | RS32 x16 | - | "Rev" / "Hasil" / "Disahkan" | 4 (T005, T006, T007, T008) | dugaan: kepala kolom tabel Lembar Kendali (Cond 6,5 pt kapital) |
| KT-08 | 25 | T | sp[b0 a0 l220x=11.0pt] | RS33 | RS33 x25 | - | "08-X-2026" / "Lihat Bab 16.6" / "Direktur Utama" | 4 (T005, T006, T007, T008) | dugaan: sel isi tabel Lembar Kendali (Serif 8 pt) |
| KT-09 | 3 | E | sp[b0 a0 l680x=34.0pt] | NO-RUN | (tanpa run) x3 | - | (tanpa teks) | 1 (T008) | dugaan: sel kosong ruang tanda tangan (tinggi baris 34 pt) |
| KT-10 | 5 | T | sp[b0 a0 l200x=10.0pt] | RS34 | RS34 x5 | - | "Bagian I" / "Bagian III" / "Bagian V" | 1 (T010) | dugaan: sel kicker Bagian di Peta Isi |
| KT-11 | 5 | T | sp[b0 a0 l200x=10.0pt] | RS35 | RS35 x5 | - | "Fondasi" / "Visual" / "Penjaminan dan Pemakaian" | 1 (T010) | dugaan: sel judul Bagian di Peta Isi (Cond 8,5 pt tebal) |
| KT-12 | 5 | T | sp[b0 a0 l200x=10.0pt];jc=right | RS36 | RS36 x5 | - | "4" / "28" / "82" | 1 (T010) | dugaan: sel nomor halaman Bagian di Peta Isi (Mono tebal rata kanan) |
| KT-13 | 21 | T | sp[b0 a0 l200x=10.0pt] | RS37 | RS37 x21 | - | "Bab 1" / "Bab 11" / "Lampiran D" | 1 (T010) | dugaan: sel nomor Bab/Lampiran di Peta Isi (Mono abu) |
| KT-14 | 21 | T | sp[b0 a0 l200x=10.0pt] | RS33 | RS33 x21 | - | "Identitas, Peta, dan Cara Memakai Manual" / "Gaya Bahasa Ahli: Tujuh Lapis" / "Register Sumber" | 1 (T010) | dugaan: sel judul Bab/Lampiran di Peta Isi (Serif 8 pt) |
| KT-15 | 21 | T | sp[b0 a0 l200x=10.0pt];jc=right | RS29 | RS29 x21 | - | "5" / "64" / "102" | 1 (T010) | dugaan: sel nomor halaman Bab/Lampiran di Peta Isi (Mono rata kanan) |
| KT-16 | 17 | T | sp[b0 a0 l220x=11.0pt] | RS37 | RS37 x17 | - | "Bab 1" / "Bab 9" / "Bab 17" | 5 (T012, T028, T054, T091, ...) | dugaan: sel nomor Bab pada daftar bab pembatas bagian (Mono abu) |
| KT-17 | 17 | T | sp[b0 a0 l220x=11.0pt] | RS38 | RS38 x17 | - | "Identitas, Peta, dan Cara Memakai Manual" / "Diagram dan Mesin Gambar" / "Rekonsiliasi Antar-Sumber dan Program Perbaikan" | 5 (T012, T028, T054, T091, ...) | dugaan: sel judul Bab pada daftar bab pembatas bagian (Cond 9 pt) |
| KT-18 | 24 | T | sp[b0 a0 l270x=13.5pt];jc=both | RS17 | RS17 x23; RS17 RS18 RS17 RS18 RS17 x1 | RS18 x2 "bukti" | "Manual ini adalah standar kerja internal PT Gemilang Satria Perkasa yang disu..." / "Pustaka ini adalah lembar galeri 58 jenis chart yang digambar ulang dalam pal..." / "Empat sumber manual ini sepakat pada hampir seluruh prinsip, tetapi berselisi..." | 24 (T013, T017, T018, T021, ...) | dugaan: prosa kotak 1x3 (kolom prosa dengan rel bukti di kanan) |
| KT-19 | 26 | E | (none) | NO-RUN | (tanpa run) x26 | - | (tanpa teks) | 26 (T013, T017, T018, T021, ...) | dugaan: sel kosong tanpa pPr (kolom penyela kotak 1x3 dan sel kosong tabel) |
| KT-20 | 18 | T | sp[b0 a0 l168x=8.4pt] | RS40 | RS39 RS40 x18 | RS39 x18 "■" | "■ TERUKUR" | 18 (T013, T018, T021, T025, ...) | dugaan: rel bukti: tanda glif + label provenans (mis. TERUKUR) |
| KT-21 | 40 | T | sp[b0 a0 l168x=8.4pt] | RS41 | RS41 x40 | - | "SUMBER LAMPIRAN D" / "PUSTAKACHART.PY" / "HIERARKI 2.5" | 24 (T013, T017, T018, T021, ...) | dugaan: rel bukti: baris SUMBER/ID rujukan (Mono 5,5 pt kapital) |
| KT-22 | 3 | T | sp[b30 a0 l168x=8.4pt] | RS42 | RS42 x3 | - | "Empat dokumen sumber, 8 Oktober 2026." / "Dampak bila salah: Bab 8 kurang satu sumber." / "Dibangun ulang 8 Oktober 2026." | 3 (T013, T017, T064) | dugaan: rel bukti: catatan bebas (Cond 6 pt) |
| KT-23 | 306 | T | sp[b0 a0 l180x=9.0pt];jc=left | RS43 | RS43 x306 | - | "No" / "Penjelasan" / "Dipakai untuk" | 91 (T014, T015, T016, T019, ...) | dugaan: kepala kolom tabel data rata kiri (Cond 6,5 pt kapital tebal) |
| KT-24 | 897 | T | sp[b0 a0 l210x=10.5pt] | RS44 | RS44 x896; RS44 RS56 RS44 x1 | RS56 x1 "σ" | "1" / "C-27" / "–" | 58 (T014, T016, T022, T024, ...) | dugaan: sel numeral/ID tabel data (Mono 7 pt) |
| KT-25 | 2270 | T | sp[b0 a0 l220x=11.0pt] | RS45 | RS45 x2261; RS45 RS60 RS45 RS60 RS45 x3; RS45 RS60 RS45 x2; +3 pola lain | RS60 x17 "○" | "Panduan DATUM" / "Legenda rumah tanpa legenda" / "Kebutuhan BPMN dan UML" | 91 (T014, T015, T016, T019, ...) | dugaan: sel badan tabel data (Serif 8 pt ink700) |
| KT-26 | 91 | T | sp[b0 a0 l180x=9.0pt] | RS24 | RS23 RS24 x71; RS23 RS24 RS46 RS24 x20 | RS23 x91 "SUMBER"; RS46 x20 "■" | "SUMBER Berkas unggahan permintaan penyusunan. PROVENANS ■ TERUKUR. Pokok 4: b..." / "SUMBER Panduan Simbol Engineering GSP v1.0 5.3 · references/09 §6 · putusan R..." / "SUMBER Panduan Jenis Chart Bab 11 dan Panduan Simbol Bab 11. Tidak diperiksa ..." | 91 (T014, T015, T016, T019, ...) | dugaan: baris SUMBER/PROVENANS di dalam tabel (sel gabung di baris terakhir) |
| KT-27 | 15 | T | sp[b0 a0 l180x=9.0pt];jc=right | RS43 | RS43 x15 | - | "Jumlah" / "Sebelum" / "Langkah" | 12 (T016, T035, T037, T039, ...) | dugaan: kepala kolom tabel data rata kanan |
| KT-28 | 163 | T | sp[b0 a0 l220x=11.0pt];jc=right | RS47 | RS47 x163 | - | "44" / "40 %" / "10" | 12 (T016, T035, T037, T039, ...) | dugaan: sel numeral rata kanan (Mono 7,5 pt) |
| KT-29 | 1 | T | sp[b0 a0 l168x=8.4pt] | RS49 | RS48 RS49 x1 | RS48 x1 "△" | "△ ASUMSI" | 1 (T017) | dugaan: rel bukti: tanda ASUMSI (alert 9B1C1C) |
| KT-30 | 10 | T | sp[b0 a30 l200x=10.0pt] | RS50 | RS50 x10 | - | "Diktum manual ini" / "Tiga cek tercepat sebelum badan ditulis, lapis L1" / "Tiga cek tercepat sebelum mengirim, lapis L5" | 10 (T020, T023, T041, T081, ...) | dugaan: label aside (Cond 7 pt kapital tebal) |
| KT-31 | 10 | T | sp[b0 a0 l250x=12.5pt];jc=left | RS51 | RS61 RS51 RS61 RS51 RS61 RS51 x6; RS51 x4 | RS61 x18 "1." | "Tulis dan gambar hanya yang bisa dibuktikan, tempatkan setiap bukti di medium..." / "1. Dasar, kewenangan, atau pembatas klaim mendahului isi teknis pada dokumen ..." / "1. Setiap klaim beban keputusan menyebut kelas asalnya di badan teks. 2. Seti..." | 10 (T020, T023, T041, T081, ...) | dugaan: prosa aside (Serif 8,5 pt) |
| KT-32 | 3 | T | sp[b0 a0 l200x=10.0pt] | RS52 | RS52 x3 | - | "Pembungkus" / "Interior" / "Command brief gelap, hanya bila diminta" | 1 (T031) | dugaan: pita kelompok tabel (Cond 7 pt kapital tebal) |
| KT-33 | 2 | T | sp[b0 a40 l180x=9.0pt] | RS53 | RS53 x2 | - | "Turunan D-4.1 · Grid A4 menutup dan satuan kisinya" / "Turunan D-6.1 · PPN dengan DPP nilai lain" | 2 (T034, T050) | dugaan: label blok turunan (Cond 6,5 pt kapital amber) |
| KT-34 | 2 | T | sp[b40 a0 l200x=10.0pt] | RS54 | RS54 x2 | - | "Setiap simpul diagram, tinggi gambar, dan baris tabel DATUM adalah kelipatan ..." / "PMK 131/2024 menetapkan DPP nilai lain sebesar 11/12 harga untuk barang non-m..." | 2 (T034, T050) | dugaan: prosa blok turunan (Cond 7 pt abu) |
| KT-35 | 33 | T | sp[b0 a0 l220x=11.0pt] | RS44 | RS44 x33 | - | "margin dalam" / "DPP nilai lain = 11/12 × subtotal" / "vonis =IF(ABS(Cn)<0.5,"LULUS","GAGAL")" | 6 (N01, N02, T044, T121, ...) | dugaan: sel aritmetika/kode mono pada blok turunan dan blok kode |
| KT-36 | 14 | T | sp[b0 a0 l220x=11.0pt];jc=right | RS44 | RS44 RS55 x14 | RS55 x14 "■" | "24 mm ■" / "10,6667 mm ◈" / "11 % ◈" | 2 (N01, N02) | dugaan: sel numeral + tanda provenans rata kanan (pada tabel bersarang N01/N02) |
| KT-37 | 1 | E | sp[b0 a0 l220x=11.0pt] | NO-RUN | (tanpa run) x1 | - | (tanpa teks) | 1 (T039) | dugaan: sel kosong (satu kasus, T039) |
| KT-38 | 24 | T | sp[b0 a0 l210x=10.5pt] | RS56 | RS56 x24 | - | "■" / "☐" | 2 (T042, T147) | dugaan: sel penanda centang/tanda tunggal (glif DejaVu) |
| KT-39 | 5 | T | sp[b0 a0 l168x=8.4pt] | RS58 | RS57 RS58 x5 | RS57 x5 "◈" | "◈ DITURUNKAN" | 5 (T043, T060, T064, T136, ...) | dugaan: rel bukti: tanda DITURUNKAN (amber) |
| KT-40 | 4 | T | sp[b0 a40 l180x=9.0pt] | RS59 | RS59 x4 | - | "Pola pengikatan, datumbind.py" / "Perintah alat mutu standar induk" / "Bendera induk KENDALI, references/04 §4" | 4 (T044, T121, T123, T129) | dugaan: label blok kode/pola (Cond 6,5 pt kapital abu) |

Dominan terbaca: RS17 = Serif 9.5pt #2B3640; RS24 = Cond 6.5pt #6B7783; RS27 = Cond 6pt #F6E9E9 B+CAPS spc26(1.3pt); RS28 = Cond 6pt #7A756E B+CAPS spc14(0.7pt); RS29 = Mono 7pt #14110F; RS30 = Mono 6pt #7A756E; RS31 = Mono 6pt #6E1420 B; RS32 = Cond 6.5pt #7A756E B+CAPS spc12(0.6pt); RS33 = Serif 8pt #33302C; RS34 = Cond 6.5pt #6E1420 B+CAPS spc18(0.9pt); RS35 = Cond 8.5pt #14110F B; RS36 = Mono 7pt #14110F B; RS37 = Mono 7pt #7A756E; RS38 = Cond 9pt #14110F; RS40 = Mono 5.5pt #101418 B+CAPS; RS41 = Mono 5.5pt #6B7783 CAPS; RS42 = Cond 6pt #6B7783; RS43 = Cond 6.5pt #6B7783 B+CAPS spc12(0.6pt); RS44 = Mono 7pt #101418; RS45 = Serif 8pt #2B3640; RS47 = Mono 7.5pt #101418; RS49 = Mono 5.5pt #9B1C1C B+CAPS; RS50 = Cond 7pt #101418 B+CAPS spc18(0.9pt); RS51 = Serif 8.5pt #2B3640; RS52 = Cond 7pt #101418 B+CAPS spc14(0.7pt); RS53 = Cond 6.5pt #B45309 B+CAPS spc22(1.1pt); RS54 = Cond 7pt #6B7783; RS56 = DejaVu 6pt #101418; RS58 = Mono 5.5pt #B45309 B+CAPS; RS59 = Cond 6.5pt #6B7783 B+CAPS spc22(1.1pt).

Jumlah anggota klaster sel: 8 + 8 + 8 + 15 + 1 + 1 + 16 + 25 + 3 + 5 + 5 + 5 + 21 + 21 + 21 + 17 + 17 + 24 + 26 + 18 + 40 + 3 + 306 + 897 + 2270 + 91 + 15 + 163 + 1 + 10 + 10 + 3 + 2 + 2 + 33 + 14 + 1 + 24 + 5 + 4 = **4159**.

Cek per tabel: jumlah paragraf sel per tabel dijumlah = 4159 (kolom "KT" bagian 5.5 memuat hitungan per klaster per tabel).

## 5. Tabel: properti (153 `w:tbl`: 151 tingkat atas + 2 bersarang)

### 5.1 Bentuk dan kelas

- Tabel 1 baris x 1 kolom ("kotak/bingkai"): **16** (T020, T023, T034, T041, T044, T050, T081, T098, T101, T105, T109, T112, T116, T121, T123, T129).
- Tabel 1 baris x banyak kolom: **33** (1x2: 9, 1x3: 24) (T001, T003, T004, T009, T011, T013, T017, T018, T021, T025, T027, T030, T040, T043, T047, T052, T053, T055, T060, T064, T074, T079, T087, T090, T092, T117, T122, T124, T126, T130, T132, T136, T138).
- Tabel lebih dari 1 baris (tabel data dan daftar): **104**.
- Tingkat atas: 16 (1x1) + 33 (1 baris banyak kolom) + 102 (lebih dari 1 baris) = **151** (= 151). Ditambah 2 tabel bersarang (lebih dari 1 baris) = 153 `w:tbl`.
- Tabel bersarang: N01 (di T034, 9x2), N02 (di T050, 5x2).

### 5.2 Properti tingkat tabel (`w:tblPr`) - registri TP

| TP | n | tblBorders | tblCellMar | tabel (contoh) |
|---|---|---|---|---|
| TP-01 | 135 | top:none/0/auto left:none/0/auto bottom:none/0/auto right:none/0/auto insideH:none/0/auto insideV:none/0/auto | left:0 right:0 | T001, T002, T003, T004, T005, T006, ... |
| TP-02 | 16 | top:none/0/auto left:none/0/auto bottom:none/0/auto right:none/0/auto insideH:none/0/auto insideV:none/0/auto | left:0 right:0 | T020, T023, T034, T041, T044, T050, ... |
| TP-03 | 2 | top:none/0/auto left:none/0/auto bottom:none/0/auto right:none/0/auto insideH:none/0/auto insideV:none/0/auto | left:0 right:0 | N01, N02 |

Isi `tblPr` lengkap (kanonik) untuk TP-01: `tblPr(tblW[type=auto,w=0];tblLayout[type=fixed];tblLook[firstColumn=1,firstRow=1,lastColumn=0,lastRow=0,noHBand=0,noVBand=1,val=04A0];tblBorders(top[color=auto,space=0,sz=0,val=none];left[color=auto,space=0,sz=0,val=none];bottom[color=auto,space=0,sz=0,val=none];right[color=auto,space=0,sz=0,val=none];insideH[color=auto,space=0,sz=0,val=none];insideV[color=auto,space=0,sz=0,val=none]);tblLayout[type=fixed];tblW[type=dxa,w=9412];tblInd[type=dxa,w=0];tblCellMar(left[type=dxa,w=0];right[type=dxa,w=0]))`

Pembeda TP-02 dan TP-03 terhadap TP-01 hanya `tblW` kedua: TP-01 `dxa 9412`, TP-02 `dxa 7257`, TP-03 `dxa 7030` (tabel bersarang).

Observasi struktur (bukan penilaian): setiap `w:tblPr` memuat **dua** `w:tblW` (`auto/0` lalu `dxa/N`) dan **dua** `w:tblLayout` (`fixed`): 153 dari 153 `tblPr`. Setiap `w:tcPr` memuat **dua** `w:tcW`: 4083 dari 4083 `tcPr`; pada 795 sel nilai `w:w` kedua `tcW` berbeda dari yang pertama (jenis `dxa` keduanya). Pasangan `tblW`: {(('auto', '0'), ('dxa', '9412')): 135, (('auto', '0'), ('dxa', '7257')): 16, (('auto', '0'), ('dxa', '7030')): 2}.

Kecocokan `tcW` terhadap jumlah `gridCol` yang dibentang sel (dihitung): kedua cocok 3288 sel; hanya `tcW` pertama cocok 56; hanya `tcW` kedua cocok 701; tak satu pun cocok 38 (total 4083 sel).

Properti baris (`w:trPr`): seluruh baris memuat `cantSplit w:val=1` (1221 baris); `tblHeader w:val=1` pada 91 tabel (baris indeks 0); `w:trHeight`: tidak ada di dokumen (0 baris); tinggi baris ditentukan `w:spacing line` exact + `tcMar`.
Tidak ada `w:vMerge`, `w:vAlign`, `w:jc` tabel, `w:tblStyle`; `w:gridSpan` pada 94 sel di 91 tabel; `w:tblInd` = `dxa 0` di semua tabel; `w:tblLook val=04A0` di semua tabel.

### 5.3 Properti tingkat sel (`w:tcPr` tanpa `tcW`/`gridSpan`) - registri TCP

Border per sisi ditulis `sisi:val/sz/warna`; margin sel `tcMar` dalam twip dan mm (kolom terpisah); `sz` border juga dalam mm.

| TCP | sel | tabel | tcBorders | tcMar (twip) | tcMar mm | shd | vAlign |
|---|---|---|---|---|---|---|---|
| TCP-01 | 8 | 8 | - | top:85 left:141 bottom:85 right:141 | top:1.5 left:2.49 bottom:1.5 right:2.49 | fill=6E1420 val=clear | - |
| TCP-02 | 8 | 8 | - | top:85 left:0 bottom:85 right:141 | top:1.5 left:0.0 bottom:1.5 right:2.49 | fill=6E1420 val=clear | - |
| TCP-03 | 4 | 1 | top:single/sz10(0.44mm)/14110F bottom:single/sz5(0.22mm)/C4BEB4 | top:85 left:0 bottom:85 right:170 | top:1.5 left:0.0 bottom:1.5 right:3.0 | - | - |
| TCP-04 | 12 | 1 | bottom:single/sz5(0.22mm)/C4BEB4 | top:85 left:0 bottom:85 right:170 | top:1.5 left:0.0 bottom:1.5 right:3.0 | - | - |
| TCP-05 | 2 | 1 | top:single/sz5(0.22mm)/C4BEB4 | top:102 left:0 bottom:0 right:0 | top:1.8 left:0.0 bottom:0.0 right:0.0 | - | - |
| TCP-06 | 13 | 3 | top:single/sz10(0.44mm)/14110F bottom:single/sz6(0.26mm)/7A756E | top:85 left:0 bottom:85 right:141 | top:1.5 left:0.0 bottom:1.5 right:2.49 | - | - |
| TCP-07 | 29 | 3 | bottom:single/sz5(0.22mm)/C4BEB4 | top:79 left:0 bottom:79 right:141 | top:1.39 left:0.0 bottom:1.39 right:2.49 | - | - |
| TCP-08 | 3 | 1 | - | top:113 left:0 bottom:0 right:226 | top:1.99 left:0.0 bottom:0.0 right:3.99 | - | - |
| TCP-09 | 3 | 1 | - | top:0 left:0 bottom:0 right:226 | top:0.0 left:0.0 bottom:0.0 right:3.99 | - | - |
| TCP-10 | 3 | 1 | top:single/sz5(0.22mm)/C4BEB4 | top:79 left:0 bottom:0 right:226 | top:1.39 left:0.0 bottom:0.0 right:3.99 | - | - |
| TCP-11 | 15 | 1 | bottom:single/sz8(0.35mm)/14110F | top:124 left:0 bottom:62 right:113 | top:2.19 left:0.0 bottom:1.09 right:1.99 | - | - |
| TCP-12 | 63 | 1 | bottom:single/sz5(0.22mm)/C4BEB4 | top:62 left:0 bottom:62 right:113 | top:1.09 left:0.0 bottom:1.09 right:1.99 | - | - |
| TCP-13 | 34 | 5 | bottom:single/sz5(0.22mm)/C4BEB4 | top:79 left:0 bottom:79 right:113 | top:1.39 left:0.0 bottom:1.39 right:1.99 | - | - |
| TCP-14 | 100 | 26 | - | - | - | - | - |
| TCP-15 | 321 | 91 | top:single/sz10(0.44mm)/101418 bottom:single/sz6(0.26mm)/6B7783 | top:102 left:0 bottom:102 right:141 | top:1.8 left:0.0 bottom:1.8 right:2.49 | - | - |
| TCP-16 | 3355 | 91 | bottom:single/sz5(0.22mm)/C3CBD1 | top:85 left:0 bottom:85 right:141 | top:1.5 left:0.0 bottom:1.5 right:2.49 | - | - |
| TCP-17 | 91 | 91 | top:single/sz5(0.22mm)/C3CBD1 | top:102 left:0 bottom:0 right:0 | top:1.8 left:0.0 bottom:0.0 right:0.0 | - | - |
| TCP-18 | 10 | 10 | top:single/sz10(0.44mm)/101418 bottom:single/sz5(0.22mm)/C3CBD1 | top:124 left:0 bottom:136 right:0 | top:2.19 left:0.0 bottom:2.4 right:0.0 | - | - |
| TCP-19 | 3 | 1 | bottom:single/sz5(0.22mm)/C3CBD1 | top:192 left:0 bottom:68 right:0 | top:3.39 left:0.0 bottom:1.2 right:0.0 | - | - |
| TCP-20 | 2 | 2 | left:single/sz10(0.44mm)/B45309 | top:147 left:255 bottom:147 right:0 | top:2.59 left:4.5 bottom:2.59 right:0.0 | - | - |
| TCP-21 | 4 | 4 | left:single/sz10(0.44mm)/6B7783 | top:136 left:255 bottom:136 right:0 | top:2.4 left:4.5 bottom:2.4 right:0.0 | - | - |

Shading: hanya `w:shd` pada `w:tcPr` (16 sel = TCP-01 8 + TCP-02 8, `fill=6E1420`, `val=clear`); tidak ada `w:shd` pada `w:pPr` atau `w:rPr`.

### 5.4 Daftar tabel (struktur)

"setelah" = indeks paragraf badan yang mendahului tabel (- = tidak didahului paragraf badan: awal body atau didahului tabel; untuk tabel bersarang = paragraf sebelum tabel induk); "seksi" = seksi yang memuat; kolom `gridCol` dalam twip dan jumlahnya dalam mm; TP = registri 5.2; "hdr" = baris `tblHeader`; "cs" = jumlah baris `cantSplit`/jumlah baris; "dugaan" = peran.

| Tabel | setelah p# | seksi | baris x kolom | gridCol (twip) | jumlah (mm) | TP | hdr | cs | dugaan peran |
|---|---|---|---|---|---|---|---|---|---|
| T001 | - | 1 | 1x2 | 4706 4706 | 9412 (166.02) | TP-01 | - | 1/1 | dugaan: strip klasifikasi |
| T002 | 8 | 1 | 4x4 | 1814 3175 1474 2948 | 9411 (166.00) | TP-01 | - | 4/4 | dugaan: blok metadata sampul |
| T003 | 9 | 1 | 1x2 | 4706 4706 | 9412 (166.02) | TP-01 | - | 1/1 | dugaan: cap penerbit/terbit sampul |
| T004 | 11 | 2 | 1x2 | 4706 4706 | 9412 (166.02) | TP-01 | - | 1/1 | dugaan: strip klasifikasi |
| T005 | 14 | 2 | 2x5 | 567 1134 1587 5216 907 | 9411 (166.00) | TP-01 | - | 2/2 | dugaan: tabel Lembar Kendali |
| T006 | 16 | 2 | 4x4 | 680 1927 4762 2041 | 9410 (165.98) | TP-01 | - | 4/4 | dugaan: tabel Lembar Kendali |
| T007 | 20 | 2 | 4x4 | 907 3969 2835 1701 | 9412 (166.02) | TP-01 | - | 4/4 | dugaan: tabel Lembar Kendali |
| T008 | 21 | 2 | 3x3 | 3118 3175 3118 | 9411 (166.00) | TP-01 | - | 3/3 | dugaan: tabel Lembar Kendali |
| T009 | 22 | 3 | 1x2 | 4706 4706 | 9412 (166.02) | TP-01 | - | 1/1 | dugaan: strip klasifikasi |
| T010 | 24 | 3 | 26x3 | 1474 7144 793 | 9411 (166.00) | TP-01 | - | 26/26 | dugaan: Peta Isi (daftar isi statis) |
| T011 | 26 | 4 | 1x2 | 4706 4706 | 9412 (166.02) | TP-01 | - | 1/1 | dugaan: strip klasifikasi |
| T012 | 31 | 4 | 3x2 | 907 8505 | 9412 (166.02) | TP-01 | - | 3/3 | dugaan: daftar bab pembatas bagian |
| T013 | 36 | 5 | 1x3 | 7257 340 1814 | 9411 (166.00) | TP-01 | - | 1/1 | dugaan: kotak prosa 1x3 + rel bukti |
| T014 | 41 | 5 | 7x4 | 567 2381 3515 2948 | 9411 (166.00) | TP-01 | 0 | 7/7 | dugaan: tabel data |
| T015 | 44 | 5 | 5x4 | 1360 2268 2948 2835 | 9411 (166.00) | TP-01 | 0 | 5/5 | dugaan: tabel data |
| T016 | 48 | 5 | 6x4 | 1020 3628 3628 1134 | 9410 (165.98) | TP-01 | 0 | 6/6 | dugaan: tabel data |
| T017 | 57 | 5 | 1x3 | 7257 340 1814 | 9411 (166.00) | TP-01 | - | 1/1 | dugaan: kotak prosa 1x3 + rel bukti |
| T018 | 64 | 6 | 1x3 | 7257 340 1814 | 9411 (166.00) | TP-01 | - | 1/1 | dugaan: kotak prosa 1x3 + rel bukti |
| T019 | 69 | 6 | 6x3 | 2041 3685 3685 | 9411 (166.00) | TP-01 | 0 | 6/6 | dugaan: tabel data |
| T020 | 70 | 6 | 1x1 | 7257 | 7257 (128.01) | TP-02 | - | 1/1 | dugaan: aside 1x1 |
| T021 | 94 | 7 | 1x3 | 7257 340 1814 | 9411 (166.00) | TP-01 | - | 1/1 | dugaan: kotak prosa 1x3 + rel bukti |
| T022 | 96 | 7 | 5x4 | 1020 2835 2608 2948 | 9411 (166.00) | TP-01 | 0 | 5/5 | dugaan: tabel data |
| T023 | 98 | 7 | 1x1 | 7257 | 7257 (128.01) | TP-02 | - | 1/1 | dugaan: aside 1x1 |
| T024 | 108 | 7 | 11x3 | 1701 2268 5443 | 9412 (166.02) | TP-01 | 0 | 11/11 | dugaan: tabel data |
| T025 | 117 | 7 | 1x3 | 7257 340 1814 | 9411 (166.00) | TP-01 | - | 1/1 | dugaan: kotak prosa 1x3 + rel bukti |
| T026 | 119 | 7 | 8x4 | 1474 2721 2948 2268 | 9411 (166.00) | TP-01 | 0 | 8/8 | dugaan: tabel data |
| T027 | 124 | 8 | 1x2 | 4706 4706 | 9412 (166.02) | TP-01 | - | 1/1 | dugaan: strip klasifikasi |
| T028 | 129 | 8 | 3x2 | 907 8505 | 9412 (166.02) | TP-01 | - | 3/3 | dugaan: daftar bab pembatas bagian |
| T029 | 136 | 9 | 6x3 | 1701 3855 3855 | 9411 (166.00) | TP-01 | 0 | 6/6 | dugaan: tabel data |
| T030 | 138 | 9 | 1x3 | 7257 340 1814 | 9411 (166.00) | TP-01 | - | 1/1 | dugaan: kotak prosa 1x3 + rel bukti |
| T031 | 141 | 9 | 22x4 | 1474 1247 1247 5443 | 9411 (166.00) | TP-01 | 0 | 22/22 | dugaan: tabel data |
| T032 | 145 | 9 | 7x4 | 1360 2494 3515 2041 | 9410 (165.98) | TP-01 | 0 | 7/7 | dugaan: tabel data |
| T033 | 149 | 9 | 15x4 | 2494 2381 2494 2041 | 9410 (165.98) | TP-01 | 0 | 15/15 | dugaan: tabel data |
| T034 | 152 | 9 | 1x1 | 7257 | 7257 (128.01) | TP-02 | - | 1/1 | dugaan: blok turunan 1x1 |
| N01 (di T034) | 152 | 9 | 9x2 | 5216 1814 | 7030 (124.00) | TP-03 | - | 9/9 | dugaan: tabel bersarang |
| T035 | 154 | 9 | 7x4 | 4876 1360 1134 2041 | 9411 (166.00) | TP-01 | 0 | 7/7 | dugaan: tabel data |
| T036 | 157 | 9 | 8x3 | 1701 4876 2835 | 9412 (166.02) | TP-01 | 0 | 8/8 | dugaan: tabel data |
| T037 | 167 | 9 | 16x3 | 680 2041 6690 | 9411 (166.00) | TP-01 | 0 | 16/16 | dugaan: tabel data |
| T038 | 174 | 10 | 12x2 | 2835 6577 | 9412 (166.02) | TP-01 | 0 | 12/12 | dugaan: tabel data |
| T039 | 181 | 10 | 7x4 | 2494 4309 1474 1134 | 9411 (166.00) | TP-01 | 0 | 7/7 | dugaan: tabel data |
| T040 | 183 | 10 | 1x3 | 7257 340 1814 | 9411 (166.00) | TP-01 | - | 1/1 | dugaan: kotak prosa 1x3 + rel bukti |
| T041 | 184 | 10 | 1x1 | 7257 | 7257 (128.01) | TP-02 | - | 1/1 | dugaan: aside 1x1 |
| T042 | 187 | 10 | 6x4 | 793 1474 5556 1587 | 9410 (165.98) | TP-01 | 0 | 6/6 | dugaan: tabel data |
| T043 | 188 | 10 | 1x3 | 7257 340 1814 | 9411 (166.00) | TP-01 | - | 1/1 | dugaan: kotak prosa 1x3 + rel bukti |
| T044 | 191 | 10 | 1x1 | 7257 | 7257 (128.01) | TP-02 | - | 1/1 | dugaan: blok kode/pola 1x1 |
| T045 | 198 | 10 | 8x4 | 680 4025 680 4025 | 9410 (165.98) | TP-01 | 0 | 8/8 | dugaan: tabel data |
| T046 | 203 | 10 | 4x4 | 1474 2835 2835 2268 | 9412 (166.02) | TP-01 | 0 | 4/4 | dugaan: tabel data |
| T047 | 209 | 11 | 1x3 | 7257 340 1814 | 9411 (166.00) | TP-01 | - | 1/1 | dugaan: kotak prosa 1x3 + rel bukti |
| T048 | 211 | 11 | 5x3 | 2494 3402 3515 | 9411 (166.00) | TP-01 | 0 | 5/5 | dugaan: tabel data |
| T049 | 221 | 11 | 10x3 | 2268 3402 3742 | 9412 (166.02) | TP-01 | 0 | 10/10 | dugaan: tabel data |
| T050 | 228 | 11 | 1x1 | 7257 | 7257 (128.01) | TP-02 | - | 1/1 | dugaan: blok turunan 1x1 |
| N02 (di T050) | 228 | 11 | 5x2 | 5216 1814 | 7030 (124.00) | TP-03 | - | 5/5 | dugaan: tabel bersarang |
| T051 | 232 | 11 | 9x3 | 3515 2948 2948 | 9411 (166.00) | TP-01 | 0 | 9/9 | dugaan: tabel data |
| T052 | 235 | 11 | 1x3 | 7257 340 1814 | 9411 (166.00) | TP-01 | - | 1/1 | dugaan: kotak prosa 1x3 + rel bukti |
| T053 | 237 | 12 | 1x2 | 4706 4706 | 9412 (166.02) | TP-01 | - | 1/1 | dugaan: strip klasifikasi |
| T054 | 242 | 12 | 4x2 | 907 8505 | 9412 (166.02) | TP-01 | - | 4/4 | dugaan: daftar bab pembatas bagian |
| T055 | 247 | 13 | 1x3 | 7257 340 1814 | 9411 (166.00) | TP-01 | - | 1/1 | dugaan: kotak prosa 1x3 + rel bukti |
| T056 | 251 | 13 | 14x2 | 2381 7030 | 9411 (166.00) | TP-01 | 0 | 14/14 | dugaan: tabel data |
| T057 | 256 | 13 | 10x3 | 3628 2268 3515 | 9411 (166.00) | TP-01 | 0 | 10/10 | dugaan: tabel data |
| T058 | 265 | 13 | 8x2 | 2948 6463 | 9411 (166.00) | TP-01 | 0 | 8/8 | dugaan: tabel data |
| T059 | 275 | 13 | 8x3 | 907 3175 5329 | 9411 (166.00) | TP-01 | 0 | 8/8 | dugaan: tabel data |
| T060 | 278 | 13 | 1x3 | 7257 340 1814 | 9411 (166.00) | TP-01 | - | 1/1 | dugaan: kotak prosa 1x3 + rel bukti |
| T061 | 280 | 13 | 8x4 | 1927 1360 1247 4876 | 9410 (165.98) | TP-01 | 0 | 8/8 | dugaan: tabel data |
| T062 | 285 | 13 | 21x4 | 2154 1927 2721 2608 | 9410 (165.98) | TP-01 | 0 | 21/21 | dugaan: tabel data |
| T063 | 297 | 13 | 12x3 | 3175 3061 3175 | 9411 (166.00) | TP-01 | 0 | 12/12 | dugaan: tabel data |
| T064 | 303 | 14 | 1x3 | 7257 340 1814 | 9411 (166.00) | TP-01 | - | 1/1 | dugaan: kotak prosa 1x3 + rel bukti |
| T065 | 311 | 14 | 18x5 | 793 1701 2381 2381 2154 | 9410 (165.98) | TP-01 | 0 | 18/18 | dugaan: tabel data |
| T066 | 317 | 14 | 12x5 | 793 1701 2381 2381 2154 | 9410 (165.98) | TP-01 | 0 | 12/12 | dugaan: tabel data |
| T067 | 323 | 14 | 15x5 | 793 1701 2381 2381 2154 | 9410 (165.98) | TP-01 | 0 | 15/15 | dugaan: tabel data |
| T068 | 329 | 14 | 13x5 | 793 1701 2381 2381 2154 | 9410 (165.98) | TP-01 | 0 | 13/13 | dugaan: tabel data |
| T069 | 335 | 14 | 15x5 | 793 1701 2381 2381 2154 | 9410 (165.98) | TP-01 | 0 | 15/15 | dugaan: tabel data |
| T070 | 339 | 14 | 32x5 | 510 2835 907 2948 2211 | 9411 (166.00) | TP-01 | 0 | 32/32 | dugaan: tabel data |
| T071 | 342 | 14 | 13x4 | 1701 793 5443 1474 | 9411 (166.00) | TP-01 | 0 | 13/13 | dugaan: tabel data |
| T072 | 344 | 14 | 9x3 | 2041 4536 2835 | 9412 (166.02) | TP-01 | 0 | 9/9 | dugaan: tabel data |
| T073 | 349 | 14 | 14x3 | 567 7371 1474 | 9412 (166.02) | TP-01 | 0 | 14/14 | dugaan: tabel data |
| T074 | 355 | 15 | 1x3 | 7257 340 1814 | 9411 (166.00) | TP-01 | - | 1/1 | dugaan: kotak prosa 1x3 + rel bukti |
| T075 | 359 | 15 | 12x2 | 1927 7484 | 9411 (166.00) | TP-01 | 0 | 12/12 | dugaan: tabel data |
| T076 | 363 | 15 | 11x3 | 1474 5443 2494 | 9411 (166.00) | TP-01 | 0 | 11/11 | dugaan: tabel data |
| T077 | 365 | 15 | 12x3 | 1701 4876 2835 | 9412 (166.02) | TP-01 | 0 | 12/12 | dugaan: tabel data |
| T078 | 367 | 15 | 8x4 | 1134 2608 1247 4422 | 9411 (166.00) | TP-01 | 0 | 8/8 | dugaan: tabel data |
| T079 | 392 | 16 | 1x3 | 7257 340 1814 | 9411 (166.00) | TP-01 | - | 1/1 | dugaan: kotak prosa 1x3 + rel bukti |
| T080 | 397 | 16 | 18x5 | 1701 1701 2608 2154 1247 | 9411 (166.00) | TP-01 | 0 | 18/18 | dugaan: tabel data |
| T081 | 405 | 16 | 1x1 | 7257 | 7257 (128.01) | TP-02 | - | 1/1 | dugaan: aside 1x1 |
| T082 | 419 | 16 | 7x2 | 2154 7257 | 9411 (166.00) | TP-01 | 0 | 7/7 | dugaan: tabel data |
| T083 | 427 | 16 | 6x2 | 2154 7257 | 9411 (166.00) | TP-01 | 0 | 6/6 | dugaan: tabel data |
| T084 | 435 | 16 | 7x2 | 2154 7257 | 9411 (166.00) | TP-01 | 0 | 7/7 | dugaan: tabel data |
| T085 | 447 | 16 | 6x2 | 2154 7257 | 9411 (166.00) | TP-01 | 0 | 6/6 | dugaan: tabel data |
| T086 | 462 | 16 | 8x2 | 1701 7711 | 9412 (166.02) | TP-01 | 0 | 8/8 | dugaan: tabel data |
| T087 | 479 | 16 | 1x3 | 7257 340 1814 | 9411 (166.00) | TP-01 | - | 1/1 | dugaan: kotak prosa 1x3 + rel bukti |
| T088 | 491 | 16 | 10x2 | 1814 7597 | 9411 (166.00) | TP-01 | 0 | 10/10 | dugaan: tabel data |
| T089 | 493 | 16 | 12x3 | 3515 2835 3061 | 9411 (166.00) | TP-01 | 0 | 12/12 | dugaan: tabel data |
| T090 | 495 | 17 | 1x2 | 4706 4706 | 9412 (166.02) | TP-01 | - | 1/1 | dugaan: strip klasifikasi |
| T091 | 500 | 17 | 4x2 | 907 8505 | 9412 (166.02) | TP-01 | - | 4/4 | dugaan: daftar bab pembatas bagian |
| T092 | 505 | 18 | 1x3 | 7257 340 1814 | 9411 (166.00) | TP-01 | - | 1/1 | dugaan: kotak prosa 1x3 + rel bukti |
| T093 | 510 | 18 | 9x5 | 793 1927 4536 907 1247 | 9410 (165.98) | TP-01 | 0 | 9/9 | dugaan: tabel data |
| T094 | 515 | 18 | 6x4 | 2154 2608 1927 2721 | 9410 (165.98) | TP-01 | 0 | 6/6 | dugaan: tabel data |
| T095 | 519 | 18 | 10x4 | 1927 1587 1701 4195 | 9410 (165.98) | TP-01 | 0 | 10/10 | dugaan: tabel data |
| T096 | 527 | 19 | 7x4 | 1020 4082 2948 1360 | 9410 (165.98) | TP-01 | 0 | 7/7 | dugaan: tabel data |
| T097 | 529 | 19 | 5x3 | 1020 4195 4195 | 9410 (165.98) | TP-01 | 0 | 5/5 | dugaan: tabel data |
| T098 | 530 | 19 | 1x1 | 7257 | 7257 (128.01) | TP-02 | - | 1/1 | dugaan: aside 1x1 |
| T099 | 534 | 19 | 12x4 | 1020 4082 2948 1360 | 9410 (165.98) | TP-01 | 0 | 12/12 | dugaan: tabel data |
| T100 | 536 | 19 | 6x3 | 1020 4195 4195 | 9410 (165.98) | TP-01 | 0 | 6/6 | dugaan: tabel data |
| T101 | 537 | 19 | 1x1 | 7257 | 7257 (128.01) | TP-02 | - | 1/1 | dugaan: aside 1x1 |
| T102 | 541 | 19 | 11x4 | 1020 4082 2948 1360 | 9410 (165.98) | TP-01 | 0 | 11/11 | dugaan: tabel data |
| T103 | 544 | 19 | 5x4 | 2948 1247 1247 3969 | 9411 (166.00) | TP-01 | 0 | 5/5 | dugaan: tabel data |
| T104 | 546 | 19 | 6x3 | 1020 4195 4195 | 9410 (165.98) | TP-01 | 0 | 6/6 | dugaan: tabel data |
| T105 | 547 | 19 | 1x1 | 7257 | 7257 (128.01) | TP-02 | - | 1/1 | dugaan: aside 1x1 |
| T106 | 555 | 20 | 11x4 | 1020 4082 2948 1360 | 9410 (165.98) | TP-01 | 0 | 11/11 | dugaan: tabel data |
| T107 | 557 | 20 | 6x4 | 3969 1701 1701 2041 | 9412 (166.02) | TP-01 | 0 | 6/6 | dugaan: tabel data |
| T108 | 559 | 20 | 6x3 | 1020 4195 4195 | 9410 (165.98) | TP-01 | 0 | 6/6 | dugaan: tabel data |
| T109 | 560 | 20 | 1x1 | 7257 | 7257 (128.01) | TP-02 | - | 1/1 | dugaan: aside 1x1 |
| T110 | 564 | 20 | 12x4 | 1020 4082 2948 1360 | 9410 (165.98) | TP-01 | 0 | 12/12 | dugaan: tabel data |
| T111 | 566 | 20 | 6x3 | 1020 4195 4195 | 9410 (165.98) | TP-01 | 0 | 6/6 | dugaan: tabel data |
| T112 | 567 | 20 | 1x1 | 7257 | 7257 (128.01) | TP-02 | - | 1/1 | dugaan: aside 1x1 |
| T113 | 571 | 20 | 11x4 | 1020 4082 2948 1360 | 9410 (165.98) | TP-01 | 0 | 11/11 | dugaan: tabel data |
| T114 | 573 | 20 | 9x3 | 2268 3969 3175 | 9412 (166.02) | TP-01 | 0 | 9/9 | dugaan: tabel data |
| T115 | 575 | 20 | 6x3 | 1020 4195 4195 | 9410 (165.98) | TP-01 | 0 | 6/6 | dugaan: tabel data |
| T116 | 576 | 20 | 1x1 | 7257 | 7257 (128.01) | TP-02 | - | 1/1 | dugaan: aside 1x1 |
| T117 | 583 | 21 | 1x3 | 7257 340 1814 | 9411 (166.00) | TP-01 | - | 1/1 | dugaan: kotak prosa 1x3 + rel bukti |
| T118 | 586 | 21 | 18x4 | 1020 4082 2948 1360 | 9410 (165.98) | TP-01 | 0 | 18/18 | dugaan: tabel data |
| T119 | 589 | 21 | 14x6 | 2041 1360 793 1247 2948 1020 | 9409 (165.96) | TP-01 | 0 | 14/14 | dugaan: tabel data |
| T120 | 593 | 21 | 4x3 | 1247 4762 3402 | 9411 (166.00) | TP-01 | 0 | 4/4 | dugaan: tabel data |
| T121 | 595 | 21 | 1x1 | 7257 | 7257 (128.01) | TP-02 | - | 1/1 | dugaan: blok kode/pola 1x1 |
| T122 | 597 | 21 | 1x3 | 7257 340 1814 | 9411 (166.00) | TP-01 | - | 1/1 | dugaan: kotak prosa 1x3 + rel bukti |
| T123 | 607 | 21 | 1x1 | 7257 | 7257 (128.01) | TP-02 | - | 1/1 | dugaan: blok kode/pola 1x1 |
| T124 | 610 | 22 | 1x2 | 4706 4706 | 9412 (166.02) | TP-01 | - | 1/1 | dugaan: strip klasifikasi |
| T125 | 615 | 22 | 3x2 | 907 8505 | 9412 (166.02) | TP-01 | - | 3/3 | dugaan: daftar bab pembatas bagian |
| T126 | 620 | 23 | 1x3 | 7257 340 1814 | 9411 (166.00) | TP-01 | - | 1/1 | dugaan: kotak prosa 1x3 + rel bukti |
| T127 | 622 | 23 | 10x3 | 2268 1701 5443 | 9412 (166.02) | TP-01 | 0 | 10/10 | dugaan: tabel data |
| T128 | 624 | 23 | 6x3 | 1927 3742 3742 | 9411 (166.00) | TP-01 | 0 | 6/6 | dugaan: tabel data |
| T129 | 626 | 23 | 1x1 | 7257 | 7257 (128.01) | TP-02 | - | 1/1 | dugaan: blok kode/pola 1x1 |
| T130 | 629 | 23 | 1x3 | 7257 340 1814 | 9411 (166.00) | TP-01 | - | 1/1 | dugaan: kotak prosa 1x3 + rel bukti |
| T131 | 631 | 23 | 5x2 | 6577 2835 | 9412 (166.02) | TP-01 | 0 | 5/5 | dugaan: tabel data |
| T132 | 638 | 24 | 1x3 | 7257 340 1814 | 9411 (166.00) | TP-01 | - | 1/1 | dugaan: kotak prosa 1x3 + rel bukti |
| T133 | 640 | 24 | 40x4 | 680 6350 1247 1134 | 9411 (166.00) | TP-01 | 0 | 40/40 | dugaan: tabel data |
| T134 | 646 | 24 | 12x5 | 793 2608 2154 2835 1020 | 9410 (165.98) | TP-01 | 0 | 12/12 | dugaan: tabel data |
| T135 | 661 | 24 | 10x4 | 1474 3288 2041 2608 | 9411 (166.00) | TP-01 | 0 | 10/10 | dugaan: tabel data |
| T136 | 674 | 24 | 1x3 | 7257 340 1814 | 9411 (166.00) | TP-01 | - | 1/1 | dugaan: kotak prosa 1x3 + rel bukti |
| T137 | 676 | 24 | 12x3 | 2268 2608 4536 | 9412 (166.02) | TP-01 | 0 | 12/12 | dugaan: tabel data |
| T138 | 682 | 25 | 1x3 | 7257 340 1814 | 9411 (166.00) | TP-01 | - | 1/1 | dugaan: kotak prosa 1x3 + rel bukti |
| T139 | 685 | 25 | 22x6 | 680 1247 1927 1814 2494 1247 | 9409 (165.96) | TP-01 | 0 | 22/22 | dugaan: tabel data |
| T140 | 689 | 25 | 36x5 | 680 793 3742 2494 1701 | 9410 (165.98) | TP-01 | 0 | 36/36 | dugaan: tabel data |
| T141 | 692 | 25 | 10x4 | 1474 2041 2948 2948 | 9411 (166.00) | TP-01 | 0 | 10/10 | dugaan: tabel data |
| T142 | 695 | 25 | 14x4 | 793 2608 5103 907 | 9411 (166.00) | TP-01 | 0 | 14/14 | dugaan: tabel data |
| T143 | 717 | 26 | 46x3 | 1020 7030 1360 | 9410 (165.98) | TP-01 | 0 | 46/46 | dugaan: tabel data |
| T144 | 719 | 26 | 16x3 | 1020 7030 1360 | 9410 (165.98) | TP-01 | 0 | 16/16 | dugaan: tabel data |
| T145 | 721 | 26 | 14x3 | 1020 7030 1360 | 9410 (165.98) | TP-01 | 0 | 14/14 | dugaan: tabel data |
| T146 | 723 | 26 | 70x3 | 1020 7030 1360 | 9410 (165.98) | TP-01 | 0 | 70/70 | dugaan: tabel data |
| T147 | 730 | 27 | 22x3 | 680 7030 1701 | 9411 (166.00) | TP-01 | 0 | 22/22 | dugaan: tabel data |
| T148 | 736 | 28 | 8x3 | 2494 3175 3742 | 9411 (166.00) | TP-01 | 0 | 8/8 | dugaan: tabel data |
| T149 | 738 | 28 | 17x3 | 2041 6010 1360 | 9411 (166.00) | TP-01 | 0 | 17/17 | dugaan: tabel data |
| T150 | 744 | 29 | 7x5 | 2948 1927 1474 1247 1814 | 9410 (165.98) | TP-01 | 0 | 7/7 | dugaan: tabel data |
| T151 | 746 | 29 | 12x2 | 5443 3969 | 9412 (166.02) | TP-01 | 0 | 12/12 | dugaan: tabel data |

### 5.5 Daftar tabel (isi: TCP, shading, KT, caption sebelumnya)

"KT" = hitungan paragraf per klaster sel dalam tabel itu; "sebelum" = teks paragraf badan sebelum tabel (caption bila ada).

| Tabel | TCP dipakai | shd fill | KT (klaster:jumlah) | sebelum (<=50 kar.) |
|---|---|---|---|---|
| T001 | 01 02 | 6E1420 x2 | 01:1 02:1 | - |
| T002 | 03 04 | - | 03:8 04:8 | Menyatukan DATUM House Style Explained Rev A · Pan |
| T003 | 05 | - | 05:1 06:1 | - |
| T004 | 01 02 | 6E1420 x2 | 01:1 02:1 | - |
| T005 | 06 07 | - | 04:1 07:5 08:4 | A · Riwayat revisi |
| T006 | 06 07 | - | 04:3 07:4 08:9 | B · Rantai verifikasi |
| T007 | 06 07 | - | 04:3 07:4 08:9 | D · Distribusi terkendali |
| T008 | 08 09 10 | - | 07:3 08:3 09:3 | - |
| T009 | 01 02 | 6E1420 x2 | 01:1 02:1 | - |
| T010 | 11 12 | - | 10:5 11:5 12:5 13:21 14:21 15:21 | Peta Isi Manual |
| T011 | 01 02 | 6E1420 x2 | 01:1 02:1 | - |
| T012 | 13 | - | 16:3 17:3 | Apa manual ini, prinsip yang mengikat seluruh isin |
| T013 | 14 | - | 18:1 19:1 20:1 21:1 22:1 | 1.1 Dokumen ini dan kebutuhan yang melahirkannya |
| T014 | 15 16 17 | - | 23:4 24:5 25:15 26:1 | Tabel 1.1 Peta sumber ke bab manual, per berkas ya |
| T015 | 15 16 17 | - | 23:4 25:12 26:1 | Tabel 1.2 Tiga cara memakai manual dan hasil yang  |
| T016 | 15 16 17 | - | 23:3 24:4 25:8 26:1 27:1 28:4 | Tabel 1.3 Empat awalan nomor aturan dan cakupannya |
| T017 | 14 | - | 18:1 19:1 21:1 22:1 29:1 | 1.6 Batas cakupan |
| T018 | 14 | - | 18:1 19:1 20:1 21:1 | 2.1 Aturan pengatur: bukti atau aparatus pembuktin |
| T019 | 15 16 17 | - | 23:3 25:12 26:1 | Tabel 2.1 Aturan pengatur DATUM dan diktum M-4 seb |
| T020 | 18 | - | 30:1 31:1 | - |
| T021 | 14 | - | 18:1 19:1 20:1 21:1 | 3.1 Tiga tier artefak |
| T022 | 15 16 17 | - | 23:4 24:3 25:9 26:1 | Tabel 3.1 Tiga tier artefak dan apa yang dilepas m |
| T023 | 18 | - | 30:1 31:1 | Ujinya satu kalimat: dapatkah Anda menyebut seseor |
| T024 | 15 16 17 | - | 23:3 24:9 25:18 26:1 | Tabel 3.2 Pembangun resmi untuk setiap format kelu |
| T025 | 14 | - | 18:1 19:1 20:1 21:2 | 3.5 Penamaan tanpa garis bawah |
| T026 | 15 16 17 | - | 23:4 24:12 25:12 26:1 | Tabel 3.3 Aturan penamaan dengan contoh benar dan  |
| T027 | 01 02 | 6E1420 x2 | 01:1 02:1 | - |
| T028 | 13 | - | 16:3 17:3 | Warna, huruf, grid, perangkat halaman, tabel, apar |
| T029 | 15 16 17 | - | 23:3 25:12 26:1 | Tabel 4.1 Dua register dokumen DATUM. |
| T030 | 14 | - | 18:1 19:1 20:1 21:2 | 4.2 Latar putih sebagai default |
| T031 | 15 16 17 19 | - | 23:4 24:34 25:34 26:1 32:3 | Tabel 4.2 Setiap token warna DATUM dan satu tugasn |
| T032 | 15 16 17 | - | 23:4 25:20 26:1 | Tabel 4.3 Tumpukan ganda IBM Plex dan cadangannya. |
| T033 | 15 16 17 | - | 23:4 24:26 25:26 26:1 | Tabel 4.4 Skala huruf pada garis dasar 13,5 pt. |
| T034 | 20 | - | 19:1 33:1 34:1 | Semua unsur mengunci ke grid A4: margin dalam 24 m |
| N01 | 14 | - | 35:9 36:9 | Semua unsur mengunci ke grid A4: margin dalam 24 m |
| T035 | 15 16 17 | - | 23:3 24:5 25:10 26:1 27:1 28:5 | Tabel 4.5 Tebal garis dan warnanya. |
| T036 | 15 16 17 | - | 23:3 25:18 26:1 | Tabel 4.6 Enam perangkat tanda tangan DATUM dan te |
| T037 | 15 16 17 | - | 23:2 25:28 26:1 27:1 28:14 | Tabel 4.7 Kunci Gambar 4.1: setiap unsur dan atura |
| T038 | 15 16 17 | - | 23:2 25:20 26:1 | Tabel 5.1 Tata bahasa tabel: hanya garis mendatar, |
| T039 | 15 16 17 | - | 23:3 25:14 26:1 27:1 28:5 37:1 | Tabel 5.2 Contoh tabel spesifikasi: cuplikan data  |
| T040 | 14 | - | 18:1 19:1 20:1 21:2 | 5.4 Aside menggantikan kotak callout |
| T041 | 18 | - | 30:1 31:1 | - |
| T042 | 15 16 17 | - | 23:4 24:8 25:4 26:1 38:4 | Tabel 5.3 Empat tanda provenans dan warnanya. |
| T043 | 14 | - | 18:1 19:1 21:2 39:1 | - |
| T044 | 21 | - | 35:6 40:1 | Sejak Revisi I, setiap angka beban keputusan dalam |
| T045 | 15 16 17 | - | 23:4 24:12 25:12 26:1 | Tabel 5.4 Skala Admiralty untuk keandalan sumber d |
| T046 | 15 16 17 | - | 23:4 24:2 25:6 26:1 | Tabel 5.5 Contoh register asumsi, format wajib. |
| T047 | 14 | - | 18:1 19:1 20:1 21:2 | 6.1 Klasifikasi ditentukan penerima |
| T048 | 15 16 17 | - | 23:3 25:9 26:1 | Tabel 6.1 Skema klasifikasi menurut penerima. |
| T049 | 15 16 17 | - | 23:3 25:24 26:1 | Tabel 6.2 Regulasi yang wajib dikutip dan yang sud |
| T050 | 20 | - | 19:1 33:1 34:1 | Lembar AHS mengikuti Permen PUPR No. 8 Tahun 2023: |
| N02 | 14 | - | 35:5 36:5 | Lembar AHS mengikuti Permen PUPR No. 8 Tahun 2023: |
| T051 | 15 16 17 | - | 23:3 24:7 25:14 26:1 | Tabel 6.3 Aturan satuan dan ketidakpastian menurut |
| T052 | 14 | - | 18:1 19:1 20:1 21:2 | 6.6 Bertahan di mesin fotokopi |
| T053 | 01 02 | 6E1420 x2 | 01:1 02:1 | - |
| T054 | 13 | - | 16:4 17:4 | Kapan memakai chart dan chart yang mana, pustaka 5 |
| T055 | 14 | - | 18:1 19:1 20:1 21:1 | 7.1 Keputusan dalam satu paragraf |
| T056 | 15 16 17 | - | 23:2 25:24 26:1 | Tabel 7.1 Istilah dasar chart yang dipakai di Bab  |
| T057 | 15 16 17 | - | 23:3 25:24 26:1 | Tabel 7.2 Kata kunci pertanyaan menentukan kelompo |
| T058 | 15 16 17 | - | 23:2 25:12 26:1 | Tabel 7.3 Jumlah kategori dan seri menentukan pili |
| T059 | 15 16 17 | - | 23:3 24:6 25:12 26:1 | Tabel 7.4 Enam aturan uji chart dan pelaksanaannya |
| T060 | 14 | - | 18:1 19:1 21:3 39:1 | 7.4 Warna chart dalam palet DATUM |
| T061 | 15 16 17 | - | 23:4 24:12 25:12 26:1 | Tabel 7.5 Peran warna pada chart GSP. |
| T062 | 15 16 17 | - | 23:4 25:76 26:1 | Tabel 7.6 Tabel pemilihan cepat: tujuan, chart uta |
| T063 | 15 16 17 | - | 23:3 25:30 26:1 | Tabel 7.7 Sepuluh kesalahan chart yang paling seri |
| T064 | 14 | - | 18:1 19:1 21:1 22:1 39:1 | 8.1 Fungsi pustaka |
| T065 | 15 16 17 | - | 23:5 24:16 25:64 26:1 | Tabel 8.1 Katalog perbandingan: fungsi, kapan dipa |
| T066 | 15 16 17 | - | 23:5 24:10 25:40 26:1 | Tabel 8.2 Katalog hubungan: fungsi, kapan dipakai, |
| T067 | 15 16 17 | - | 23:5 24:13 25:52 26:1 | Tabel 8.3 Katalog komposisi dan aliran: fungsi, ka |
| T068 | 15 16 17 | - | 23:5 24:11 25:44 26:1 | Tabel 8.4 Katalog waktu: fungsi, kapan dipakai, da |
| T069 | 15 16 17 | - | 23:5 24:13 25:52 26:1 | Tabel 8.5 Katalog sebaran, geospasial, dan proses: |
| T070 | 15 16 17 | - | 23:4 24:30 25:90 26:1 27:1 28:30 | Tabel 8.6 Tiga puluh contoh terapan: pertanyaan, c |
| T071 | 15 16 17 | - | 23:4 24:11 25:33 26:1 | Tabel 8.7 Chart tambahan yang paling relevan untuk |
| T072 | 15 16 17 | - | 23:3 25:21 26:1 | Tabel 8.8 Chart yang disarankan dan dihindari per  |
| T073 | 15 16 17 | - | 23:2 24:12 25:12 26:1 27:1 28:12 | Tabel 8.9 Dua belas butir periksa chart. |
| T074 | 14 | - | 18:1 19:1 20:1 21:1 | 9.1 Gambar menyatakan fakta |
| T075 | 15 16 17 | - | 23:2 24:10 25:10 26:1 | Tabel 9.1 Isi minimum sebuah spec gambar. |
| T076 | 15 16 17 | - | 23:3 24:18 25:9 26:1 | Tabel 9.2 Keluarga diagram, kapan digambar, dan me |
| T077 | 15 16 17 | - | 23:3 24:10 25:20 26:1 | Tabel 9.3 Bentuk simpul dan artinya, satu notasi p |
| T078 | 15 16 17 | - | 23:4 24:12 25:12 26:1 | Tabel 9.4 Jenis penghubung: makna dibawa pola gari |
| T079 | 14 | - | 18:1 19:1 20:1 21:2 | 10.1 Aturan yang mengatur setiap simbol |
| T080 | 15 16 17 | - | 23:5 24:16 25:64 26:1 | Tabel 10.1 Jenis gambar GSP dan standar simbolnya, |
| T081 | 18 | - | 30:1 31:1 | - |
| T082 | 15 16 17 | - | 23:2 25:10 26:1 | Tabel 10.2 Aturan dialek IEC 60617. |
| T083 | 15 16 17 | - | 23:2 25:8 26:1 | Tabel 10.3 Aturan dialek ISA-5.1. |
| T084 | 15 16 17 | - | 23:2 25:10 26:1 | Tabel 10.4 Aturan legenda rumah keamanan. |
| T085 | 15 16 17 | - | 23:2 25:8 26:1 | Tabel 10.5 Aturan dialek militer. |
| T086 | 15 16 17 | - | 23:2 25:12 26:1 | Tabel 10.6 Aturan notasi proses dan arsitektur. |
| T087 | 14 | - | 18:1 19:1 20:1 21:2 | 10.5 Penandaan acuan IEC 81346 |
| T088 | 15 16 17 | - | 23:2 25:16 26:1 | Tabel 10.7 Aturan lembar gambar. |
| T089 | 15 16 17 | - | 23:3 25:30 26:1 | Tabel 10.8 Sepuluh kesalahan simbol yang paling se |
| T090 | 01 02 | 6E1420 x2 | 01:1 02:1 | - |
| T091 | 13 | - | 16:4 17:4 | Enam puluh delapan aturan gaya bahasa ahli dalam t |
| T092 | 14 | - | 18:1 19:1 20:1 21:2 | 11.1 Apa yang diatur dan mengapa |
| T093 | 15 16 17 | - | 23:4 24:7 25:21 26:1 27:1 28:7 | Tabel 11.1 Tujuh lapis gaya bahasa, cakupan, dan r |
| T094 | 15 16 17 | - | 23:4 24:4 25:12 26:1 | Tabel 11.2 Peta keluhan: gejala yang paling sering |
| T095 | 15 16 17 | - | 23:4 24:16 25:16 26:1 | Tabel 11.3 Aturan Gaya Ahli yang bertemu aturan DA |
| T096 | 15 16 17 | - | 23:4 24:5 25:15 26:1 | Tabel 12.1 Lima aturan lapis L0, orientasi pembaca |
| T097 | 15 16 17 | - | 23:3 24:3 25:6 26:1 | Tabel 12.2 Contoh salah dan benar lapis L0. |
| T098 | 18 | - | 30:1 31:1 | - |
| T099 | 15 16 17 | - | 23:4 24:10 25:30 26:1 | Tabel 12.3 Sepuluh aturan lapis L1, arsitektur dok |
| T100 | 15 16 17 | - | 23:3 24:4 25:8 26:1 | Tabel 12.4 Contoh salah dan benar lapis L1. |
| T101 | 18 | - | 30:1 31:1 | - |
| T102 | 15 16 17 | - | 23:4 24:9 25:27 26:1 | Tabel 12.5 Sembilan aturan lapis L2, paragraf. |
| T103 | 15 16 17 | - | 23:2 25:6 26:1 27:2 28:6 | Tabel 12.6 Densitas pemisah sebelum dan sesudah pe |
| T104 | 15 16 17 | - | 23:3 24:4 25:8 26:1 | Tabel 12.7 Contoh salah dan benar lapis L2. |
| T105 | 18 | - | 30:1 31:1 | - |
| T106 | 15 16 17 | - | 23:4 24:9 25:27 26:1 | Tabel 13.1 Sembilan aturan lapis L3, kalimat. |
| T107 | 15 16 17 | - | 23:2 25:8 26:1 27:2 28:8 | Tabel 13.2 Ritme satu surat niaga sebelum dan sesu |
| T108 | 15 16 17 | - | 23:3 24:4 25:8 26:1 | Tabel 13.3 Contoh salah dan benar lapis L3. |
| T109 | 18 | - | 30:1 31:1 | - |
| T110 | 15 16 17 | - | 23:4 24:10 25:30 26:1 | Tabel 13.4 Sepuluh aturan lapis L4, kata dan ident |
| T111 | 15 16 17 | - | 23:3 24:4 25:8 26:1 | Tabel 13.5 Contoh salah dan benar lapis L4. |
| T112 | 18 | - | 30:1 31:1 | - |
| T113 | 15 16 17 | - | 23:4 24:9 25:27 26:1 | Tabel 13.6 Sembilan aturan lapis L5, suara ahli. |
| T114 | 15 16 17 | - | 23:3 25:21 26:1 | Tabel 13.7 Sistem sapaan kanal resmi berbahasa Ind |
| T115 | 15 16 17 | - | 23:3 24:4 25:8 26:1 | Tabel 13.8 Contoh salah dan benar lapis L5. |
| T116 | 18 | - | 30:1 31:1 | - |
| T117 | 14 | - | 18:1 19:1 20:1 21:2 | Lapis sebelumnya mengatur apa yang ditulis, sedang |
| T118 | 15 16 17 | - | 23:4 24:16 25:48 26:1 | Tabel 14.1 Enam belas aturan lapis L6, mesin perik |
| T119 | 15 16 17 | - | 23:4 24:12 25:36 26:1 27:2 28:24 | Tabel 14.2 Ambang periksa lapis L6 per kanal, kali |
| T120 | 15 16 17 | - | 23:3 24:2 25:4 26:1 | Tabel 14.3 Dua ambang agregasi yang tidak boleh te |
| T121 | 21 | - | 35:6 40:1 | Status tinjau berlaku bila selisih antar-juri dua  |
| T122 | 14 | - | 18:1 19:1 20:1 21:1 | 14.5 Tiga tangan terpisah |
| T123 | 21 | - | 35:4 40:1 | - |
| T124 | 01 02 | 6E1420 x2 | 01:1 02:1 | - |
| T125 | 13 | - | 16:3 17:3 | Workbook dan command brief, satu gerbang rilis yan |
| T126 | 14 | - | 18:1 19:1 20:1 21:2 | 15.1 Standar workbook |
| T127 | 15 16 17 | - | 23:3 24:8 25:16 26:1 | Tabel 15.1 Kelas sheet workbook DATUM. |
| T128 | 15 16 17 | - | 23:3 25:12 26:1 | Tabel 15.2 Warna numeral di workbook adalah proven |
| T129 | 21 | - | 35:3 40:1 | PETUNJUK punya tiga bagian wajib: kunci warna deng |
| T130 | 14 | - | 18:1 19:1 20:1 21:2 | 15.2 Standar command brief |
| T131 | 15 16 17 | - | 23:2 25:6 26:1 | Tabel 15.3 Headline adalah klaim, bukan topik. |
| T132 | 14 | - | 18:1 19:1 20:1 21:2 | 16.1 Lint DATUM: 38 pemeriksaan dalam tiga tahap |
| T133 | 15 16 17 | - | 23:3 24:38 25:76 26:1 27:1 28:38 | Tabel 16.1 Seluruh baterai lint: 38 pemeriksaan, b |
| T134 | 15 16 17 | - | 23:4 24:10 25:30 26:1 27:1 28:10 | Tabel 16.2 Satu gerbang rilis: urutan pemeriksaan  |
| T135 | 15 16 17 | - | 23:4 25:32 26:1 | Tabel 16.3 Rute harian: kanal keluaran menentukan  |
| T136 | 14 | - | 18:1 19:1 21:2 39:1 | 16.7 Hasil gerbang pada manual ini |
| T137 | 15 16 17 | - | 23:3 25:30 26:1 | Tabel 16.4 Hasil gerbang rilis pada berkas Word ma |
| T138 | 14 | - | 18:1 19:1 21:1 39:1 | 17.1 Keputusan |
| T139 | 15 16 17 | - | 23:6 24:20 25:100 26:1 | Tabel 17.1 Register rekonsiliasi: setiap tabrakan  |
| T140 | 15 16 17 | - | 23:5 24:34 25:136 26:1 | Tabel 17.2 Register temuan: 32 temuan DATUM Explai |
| T141 | 15 16 17 | - | 23:4 25:32 26:1 | Tabel 17.3 Usulan pembaruan pustaka simbol DATUM d |
| T142 | 15 16 17 | - | 23:4 24:12 25:36 26:1 | Tabel 17.4 Usulan peningkatan yang menaikkan otori |
| T143 | 15 16 17 | - | 23:3 24:88 25:44 26:1 | Tabel A.1 Aturan bentuk DATUM, awalan DT. |
| T144 | 15 16 17 | - | 23:3 24:28 25:14 26:1 | Tabel A.2 Aturan chart, awalan CH. |
| T145 | 15 16 17 | - | 23:3 24:24 25:12 26:1 | Tabel A.3 Aturan simbol, awalan SM. |
| T146 | 15 16 17 | - | 23:3 24:136 25:68 26:1 | Tabel A.4 Aturan gaya bahasa, awalan SG, dengan ju |
| T147 | 15 16 17 | - | 23:3 24:20 25:20 26:1 38:20 | Tabel B.1 Dua puluh butir periksa pra-serah terpad |
| T148 | 15 16 17 | - | 23:3 25:18 26:1 | Tabel C.1 Glosarium kendali: nasib istilah asing. |
| T149 | 15 16 17 | - | 23:3 24:15 25:30 26:1 | Tabel C.2 Istilah kunci manual ini. |
| T150 | 15 16 17 | - | 23:5 24:5 25:20 26:1 | Tabel D.1 Dokumen sumber manual ini. |
| T151 | 15 16 17 | - | 23:2 25:20 26:1 | Tabel D.2 Sumber eksternal yang dikutip lewat doku |

(KT dan TCP ditulis tanpa awalan; angka = nomor klaster.)

Jumlah semua nilai KT pada daftar di atas = **4159** (harus sama dengan 4159 paragraf sel).

## 6. sectPr: 29 seksi

Semua seksi memiliki nilai halaman yang **identik**: 1 kombinasi unik dari 29 seksi.

| Properti | Nilai (twip) | mm | Catatan |
|---|---|---|---|
| `w:pgSz` | w=11906 h=16838 | 210.0 x 297.0 | tanpa atribut `w:orient` (potret); A4 |
| `w:pgMar` atas | 1474 | 26.00 | |
| `w:pgMar` bawah | 1361 | 24.01 | |
| `w:pgMar` kiri | 1361 | 24.01 | |
| `w:pgMar` kanan | 1134 | 20.00 | |
| `w:pgMar` header | 737 | 13.00 | |
| `w:pgMar` footer | 737 | 13.00 | |
| `w:pgMar` gutter | 0 | 0.00 | |
| `w:cols` | space=720, tanpa `w:num` | 12.70 | satu kolom |
| `w:docGrid` | linePitch=360 | | |
| `w:titlePg` | tidak ada di semua seksi | | `first` header/footer tidak dirujuk |
| `w:type` (jenis break) | tidak ada di semua seksi | | bawaan OOXML = nextPage |
| `w:pgNumType` | tidak ada | | nomor halaman tidak diulang per seksi |
| Lebar teks (pgSz.w - kiri - kanan) | 9411 | 166.00 | |
| Tinggi teks (pgSz.h - atas - bawah) | 14003 | 247.00 | |

Verifikasi identik: seluruh 29 `w:sectPr` memiliki `headerReference`/`footerReference` bertipe `default` saja (29 + 29 = 58 referensi; tipe `first`/`even`: 0). `evenAndOddHeaders` di settings.xml: tidak ada.

### 6.1 Per seksi (urut dokumen)

"anak body" = indeks anak `w:body` (paragraf + tabel + sectPr akhir) dari..sampai (inklusif); "p#" = paragraf badan; #tbl, #gbr = tabel dan `w:drawing` di rentang itu; lrpb/br/pbb = `lastRenderedPageBreak`, `w:br`, `pageBreakBefore` (semua 0, lihat bagian 8); "hal. PDF" = halaman PDF acuan tempat seksi mulai..berakhir (pencocokan teks mekanis dua paragraf badan pertama seksi terhadap `BM.pdf`, 102 hlm; untuk Bab 1..17 dan Lampiran A..D cocok dengan nomor halaman Peta Isi T010 di research/04); "pemegang" = tempat `w:sectPr` ditulis.

| Seksi | pemegang sectPr | anak body | p# | #tbl | #gbr | lrpb/br/pbb | hal. PDF | dugaan | teks pertama |
|---|---|---|---|---|---|---|---|---|---|
| 1 | pPr di paragraf badan #11 | 0..14 | 0..11 (12) | 3 | 2 | 0/0/0 | 1-1 | sampul | [tabel] KLASIFIKASI · TERBATASSALINAN INDUK · PENGGUNAAN ... |
| 2 | pPr di paragraf badan #22 | 15..30 | 12..22 (11) | 5 | 0 | 0/0/0 | 2-2 | Lembar Kendali | [tabel] KLASIFIKASI · TERBATASSALINAN INDUK · PENGGUNAAN ... |
| 3 | pPr di paragraf badan #26 | 31..36 | 23..26 (4) | 2 | 0 | 0/0/0 | 3-3 | Daftar Isi | [tabel] KLASIFIKASI · TERBATASSALINAN INDUK · PENGGUNAAN ... |
| 4 | pPr di paragraf badan #32 | 37..44 | 27..32 (6) | 2 | 1 | 0/0/0 | 4-4 | pembatas bagian | [tabel] KLASIFIKASI · TERBATASSALINAN INDUK · PENGGUNAAN ... |
| 5 | pPr di paragraf badan #60 | 45..77 | 33..60 (28) | 5 | 1 | 0/0/0 | 5-7 | bab/lampiran | Bab 1 |
| 6 | pPr di paragraf badan #90 | 78..110 | 61..90 (30) | 3 | 2 | 0/0/0 | 8-10 | bab/lampiran | Bab 2 |
| 7 | pPr di paragraf badan #124 | 111..150 | 91..124 (34) | 6 | 2 | 0/0/0 | 11-13 | bab/lampiran | Bab 3 |
| 8 | pPr di paragraf badan #130 | 151..158 | 125..130 (6) | 2 | 1 | 0/0/0 | 14-14 | pembatas bagian | [tabel] KLASIFIKASI · TERBATASSALINAN INDUK · PENGGUNAAN ... |
| 9 | pPr di paragraf badan #169 | 159..206 | 131..169 (39) | 9 | 2 | 0/0/0 | 15-20 | bab/lampiran | Bab 4 |
| 10 | pPr di paragraf badan #205 | 207..251 | 170..205 (36) | 9 | 1 | 0/0/0 | 21-24 | bab/lampiran | Bab 5 |
| 11 | pPr di paragraf badan #237 | 252..289 | 206..237 (32) | 6 | 1 | 0/0/0 | 25-27 | bab/lampiran | Bab 6 |
| 12 | pPr di paragraf badan #243 | 290..297 | 238..243 (6) | 2 | 1 | 0/0/0 | 28-28 | pembatas bagian | [tabel] KLASIFIKASI · TERBATASSALINAN INDUK · PENGGUNAAN ... |
| 13 | pPr di paragraf badan #299 | 298..362 | 244..299 (56) | 9 | 1 | 0/0/0 | 29-33 | bab/lampiran | Bab 7 |
| 14 | pPr di paragraf badan #351 | 363..424 | 300..351 (52) | 10 | 6 | 0/0/0 | 34-46 | bab/lampiran | Bab 8 |
| 15 | pPr di paragraf badan #388 | 425..466 | 352..388 (37) | 5 | 4 | 0/0/0 | 47-51 | bab/lampiran | Bab 9 |
| 16 | pPr di paragraf badan #495 | 467..584 | 389..495 (107) | 11 | 14 | 0/0/0 | 52-62 | bab/lampiran | Bab 10 |
| 17 | pPr di paragraf badan #501 | 585..592 | 496..501 (6) | 2 | 1 | 0/0/0 | 63-63 | pembatas bagian | [tabel] KLASIFIKASI · TERBATASSALINAN INDUK · PENGGUNAAN ... |
| 18 | pPr di paragraf badan #521 | 593..616 | 502..521 (20) | 4 | 1 | 0/0/0 | 64-65 | bab/lampiran | Bab 11 |
| 19 | pPr di paragraf badan #549 | 617..654 | 522..549 (28) | 10 | 1 | 0/0/0 | 66-70 | bab/lampiran | Bab 12 |
| 20 | pPr di paragraf badan #578 | 655..694 | 550..578 (29) | 11 | 1 | 0/0/0 | 71-76 | bab/lampiran | Bab 13 |
| 21 | pPr di paragraf badan #610 | 695..733 | 579..610 (32) | 7 | 1 | 0/0/0 | 77-81 | bab/lampiran | Bab 14 |
| 22 | pPr di paragraf badan #616 | 734..741 | 611..616 (6) | 2 | 1 | 0/0/0 | 82-82 | pembatas bagian | [tabel] KLASIFIKASI · TERBATASSALINAN INDUK · PENGGUNAAN ... |
| 23 | pPr di paragraf badan #634 | 742..765 | 617..634 (18) | 6 | 1 | 0/0/0 | 83-84 | bab/lampiran | Bab 15 |
| 24 | pPr di paragraf badan #678 | 766..815 | 635..678 (44) | 6 | 1 | 0/0/0 | 85-89 | bab/lampiran | Bab 16 |
| 25 | pPr di paragraf badan #712 | 816..854 | 679..712 (34) | 5 | 1 | 0/0/0 | 90-94 | bab/lampiran | Bab 17 |
| 26 | pPr di paragraf badan #725 | 855..871 | 713..725 (13) | 4 | 1 | 0/0/0 | 95-99 | bab/lampiran | Lampiran A |
| 27 | pPr di paragraf badan #732 | 872..879 | 726..732 (7) | 1 | 1 | 0/0/0 | 100-100 | bab/lampiran | Lampiran B |
| 28 | pPr di paragraf badan #740 | 880..889 | 733..740 (8) | 2 | 1 | 0/0/0 | 101-101 | bab/lampiran | Lampiran C |
| 29 | sectPr akhir body | 890..899 | 741..747 (7) | 2 | 1 | 0/0/0 | 102-102 | bab/lampiran | Lampiran D |

### 6.2 Header/footer yang dirujuk per seksi

Semua referensi bertipe `default`. "ringkasan" = teks (TAB = `w:tab` tingkat run), field, jumlah gambar/tabel di part; ukuran part dalam byte.

| Seksi | header part (rId) | ukuran | ringkasan header | footer part (rId) | ukuran | ringkasan footer |
|---|---|---|---|---|---|---|
| 1 | header1.xml (rId9) | 1361 | (paragraf kosong); gbr 0 | footer1.xml (rId10) | 1361 | (paragraf kosong); tabel 0, gbr 0 |
| 2 | header2.xml (rId13) | 1361 | (paragraf kosong); gbr 0 | footer2.xml (rId14) | 1361 | (paragraf kosong); tabel 0, gbr 0 |
| 3 | header3.xml (rId15) | 1361 | (paragraf kosong); gbr 0 | footer3.xml (rId16) | 1361 | (paragraf kosong); tabel 0, gbr 0 |
| 4 | header4.xml (rId17) | 1361 | (paragraf kosong); gbr 0 | footer4.xml (rId18) | 1361 | (paragraf kosong); tabel 0, gbr 0 |
| 5 | header5.xml (rId19) | 2138 | PT Gemilang Satria Perkasa · Manual DATUM · Bab 1 · Identitas, Peta, dan Cara Memakai Manual <TAB> TERBATAS; gbr 0 | footer5.xml (rId20) | 6895 | GSP · 000/GSP/STD/X/2026 \| REV A · 08-X-2026 \| LEMBAR 1 DARI 1 \| TERBATAS \| fields: PAGE,NUMPAGES; tabel 1, gbr 0 |
| 6 | header6.xml (rId22) | 2135 | PT Gemilang Satria Perkasa · Manual DATUM · Bab 2 · Prinsip Induk dan Hierarki Kewenangan <TAB> TERBATAS; gbr 0 | footer6.xml (rId23) | 6895 | GSP · 000/GSP/STD/X/2026 \| REV A · 08-X-2026 \| LEMBAR 1 DARI 1 \| TERBATAS \| fields: PAGE,NUMPAGES; tabel 1, gbr 0 |
| 7 | header7.xml (rId25) | 2129 | PT Gemilang Satria Perkasa · Manual DATUM · Bab 3 · Tier, Alur Bangun, dan Penamaan <TAB> TERBATAS; gbr 0 | footer7.xml (rId26) | 6895 | GSP · 000/GSP/STD/X/2026 \| REV A · 08-X-2026 \| LEMBAR 1 DARI 1 \| TERBATAS \| fields: PAGE,NUMPAGES; tabel 1, gbr 0 |
| 8 | header8.xml (rId28) | 1361 | (paragraf kosong); gbr 0 | footer8.xml (rId29) | 1361 | (paragraf kosong); tabel 0, gbr 0 |
| 9 | header9.xml (rId30) | 2143 | PT Gemilang Satria Perkasa · Manual DATUM · Bab 4 · Warna, Tipografi, Grid, dan Perangkat Halaman <TAB> TERBATAS; gbr 0 | footer9.xml (rId31) | 6895 | GSP · 000/GSP/STD/X/2026 \| REV A · 08-X-2026 \| LEMBAR 1 DARI 1 \| TERBATAS \| fields: PAGE,NUMPAGES; tabel 1, gbr 0 |
| 10 | header10.xml (rId33) | 2122 | PT Gemilang Satria Perkasa · Manual DATUM · Bab 5 · Tabel dan Aparatus Bukti <TAB> TERBATAS; gbr 0 | footer10.xml (rId34) | 6895 | GSP · 000/GSP/STD/X/2026 \| REV A · 08-X-2026 \| LEMBAR 1 DARI 1 \| TERBATAS \| fields: PAGE,NUMPAGES; tabel 1, gbr 0 |
| 11 | header11.xml (rId35) | 2131 | PT Gemilang Satria Perkasa · Manual DATUM · Bab 6 · Kepatuhan, Satuan, dan Reproduksi <TAB> TERBATAS; gbr 0 | footer11.xml (rId36) | 6895 | GSP · 000/GSP/STD/X/2026 \| REV A · 08-X-2026 \| LEMBAR 1 DARI 1 \| TERBATAS \| fields: PAGE,NUMPAGES; tabel 1, gbr 0 |
| 12 | header12.xml (rId37) | 1361 | (paragraf kosong); gbr 0 | footer12.xml (rId38) | 1361 | (paragraf kosong); tabel 0, gbr 0 |
| 13 | header13.xml (rId39) | 2123 | PT Gemilang Satria Perkasa · Manual DATUM · Bab 7 · Memilih dan Membuat Chart <TAB> TERBATAS; gbr 0 | footer13.xml (rId40) | 6895 | GSP · 000/GSP/STD/X/2026 \| REV A · 08-X-2026 \| LEMBAR 1 DARI 1 \| TERBATAS \| fields: PAGE,NUMPAGES; tabel 1, gbr 0 |
| 14 | header14.xml (rId41) | 2115 | PT Gemilang Satria Perkasa · Manual DATUM · Bab 8 · Pustaka Chart GSP <TAB> TERBATAS; gbr 0 | footer14.xml (rId42) | 6895 | GSP · 000/GSP/STD/X/2026 \| REV A · 08-X-2026 \| LEMBAR 1 DARI 1 \| TERBATAS \| fields: PAGE,NUMPAGES; tabel 1, gbr 0 |
| 15 | header15.xml (rId48) | 2122 | PT Gemilang Satria Perkasa · Manual DATUM · Bab 9 · Diagram dan Mesin Gambar <TAB> TERBATAS; gbr 0 | footer15.xml (rId49) | 6895 | GSP · 000/GSP/STD/X/2026 \| REV A · 08-X-2026 \| LEMBAR 1 DARI 1 \| TERBATAS \| fields: PAGE,NUMPAGES; tabel 1, gbr 0 |
| 16 | header16.xml (rId53) | 2117 | PT Gemilang Satria Perkasa · Manual DATUM · Bab 10 · Simbol Engineering <TAB> TERBATAS; gbr 0 | footer16.xml (rId54) | 6895 | GSP · 000/GSP/STD/X/2026 \| REV A · 08-X-2026 \| LEMBAR 1 DARI 1 \| TERBATAS \| fields: PAGE,NUMPAGES; tabel 1, gbr 0 |
| 17 | header17.xml (rId68) | 1361 | (paragraf kosong); gbr 0 | footer17.xml (rId69) | 1361 | (paragraf kosong); tabel 0, gbr 0 |
| 18 | header18.xml (rId70) | 2128 | PT Gemilang Satria Perkasa · Manual DATUM · Bab 11 · Gaya Bahasa Ahli: Tujuh Lapis <TAB> TERBATAS; gbr 0 | footer18.xml (rId71) | 6895 | GSP · 000/GSP/STD/X/2026 \| REV A · 08-X-2026 \| LEMBAR 1 DARI 1 \| TERBATAS \| fields: PAGE,NUMPAGES; tabel 1, gbr 0 |
| 19 | header19.xml (rId72) | 2150 | PT Gemilang Satria Perkasa · Manual DATUM · Bab 12 · Lapis L0 sampai L2: Orientasi, Arsitektur, Paragraf <TAB> TERBATAS; gbr 0 | footer19.xml (rId73) | 6895 | GSP · 000/GSP/STD/X/2026 \| REV A · 08-X-2026 \| LEMBAR 1 DARI 1 \| TERBATAS \| fields: PAGE,NUMPAGES; tabel 1, gbr 0 |
| 20 | header20.xml (rId74) | 2139 | PT Gemilang Satria Perkasa · Manual DATUM · Bab 13 · Lapis L3 sampai L5: Kalimat, Kata, Suara <TAB> TERBATAS; gbr 0 | footer20.xml (rId75) | 6895 | GSP · 000/GSP/STD/X/2026 \| REV A · 08-X-2026 \| LEMBAR 1 DARI 1 \| TERBATAS \| fields: PAGE,NUMPAGES; tabel 1, gbr 0 |
| 21 | header21.xml (rId76) | 2134 | PT Gemilang Satria Perkasa · Manual DATUM · Bab 14 · Lapis L6: Mesin Periksa dan Penilai <TAB> TERBATAS; gbr 0 | footer21.xml (rId77) | 6895 | GSP · 000/GSP/STD/X/2026 \| REV A · 08-X-2026 \| LEMBAR 1 DARI 1 \| TERBATAS \| fields: PAGE,NUMPAGES; tabel 1, gbr 0 |
| 22 | header22.xml (rId78) | 1361 | (paragraf kosong); gbr 0 | footer22.xml (rId79) | 1361 | (paragraf kosong); tabel 0, gbr 0 |
| 23 | header23.xml (rId80) | 2125 | PT Gemilang Satria Perkasa · Manual DATUM · Bab 15 · Workbook dan Command Brief <TAB> TERBATAS; gbr 0 | footer23.xml (rId81) | 6895 | GSP · 000/GSP/STD/X/2026 \| REV A · 08-X-2026 \| LEMBAR 1 DARI 1 \| TERBATAS \| fields: PAGE,NUMPAGES; tabel 1, gbr 0 |
| 24 | header24.xml (rId82) | 2120 | PT Gemilang Satria Perkasa · Manual DATUM · Bab 16 · Gerbang Rilis Terpadu <TAB> TERBATAS; gbr 0 | footer24.xml (rId83) | 6895 | GSP · 000/GSP/STD/X/2026 \| REV A · 08-X-2026 \| LEMBAR 1 DARI 1 \| TERBATAS \| fields: PAGE,NUMPAGES; tabel 1, gbr 0 |
| 25 | header25.xml (rId84) | 2146 | PT Gemilang Satria Perkasa · Manual DATUM · Bab 17 · Rekonsiliasi Antar-Sumber dan Program Perbaikan <TAB> TERBATAS; gbr 0 | footer25.xml (rId85) | 6895 | GSP · 000/GSP/STD/X/2026 \| REV A · 08-X-2026 \| LEMBAR 1 DARI 1 \| TERBATAS \| fields: PAGE,NUMPAGES; tabel 1, gbr 0 |
| 26 | header26.xml (rId86) | 2124 | PT Gemilang Satria Perkasa · Manual DATUM · Lampiran A · Indeks Aturan Terpadu <TAB> TERBATAS; gbr 0 | footer26.xml (rId87) | 6895 | GSP · 000/GSP/STD/X/2026 \| REV A · 08-X-2026 \| LEMBAR 1 DARI 1 \| TERBATAS \| fields: PAGE,NUMPAGES; tabel 1, gbr 0 |
| 27 | header27.xml (rId88) | 2140 | PT Gemilang Satria Perkasa · Manual DATUM · Lampiran B · Daftar Periksa Pra-Serah Satu Halaman <TAB> TERBATAS; gbr 0 | footer27.xml (rId89) | 6895 | GSP · 000/GSP/STD/X/2026 \| REV A · 08-X-2026 \| LEMBAR 1 DARI 1 \| TERBATAS \| fields: PAGE,NUMPAGES; tabel 1, gbr 0 |
| 28 | header28.xml (rId90) | 2132 | PT Gemilang Satria Perkasa · Manual DATUM · Lampiran C · Glosarium Kendali dan Istilah <TAB> TERBATAS; gbr 0 | footer28.xml (rId91) | 6895 | GSP · 000/GSP/STD/X/2026 \| REV A · 08-X-2026 \| LEMBAR 1 DARI 1 \| TERBATAS \| fields: PAGE,NUMPAGES; tabel 1, gbr 0 |
| 29 | header29.xml (rId92) | 2118 | PT Gemilang Satria Perkasa · Manual DATUM · Lampiran D · Register Sumber <TAB> TERBATAS; gbr 0 | footer29.xml (rId93) | 6895 | GSP · 000/GSP/STD/X/2026 \| REV A · 08-X-2026 \| LEMBAR 1 DARI 1 \| TERBATAS \| fields: PAGE,NUMPAGES; tabel 1, gbr 0 |

Seksi dengan header dan footer kosong (part 1.361 byte, satu paragraf `w:pStyle Header/Footer`): 1, 2, 3, 4, 8, 12, 17, 22 (8 seksi). Seksi dengan header teks + footer blok register: 21 seksi. Gambar di header/footer: 0; berkas `word/_rels/header*.xml.rels` dan `footer*.xml.rels`: 0.

Pengelompokan part header/footer menurut struktur (teks dikosongkan): 
- header struktur cb03d094eb: 8 part (1, 2, 3, 4, 8, 12, 17, 22)
- header struktur c7b1d2342e: 21 part (5, 6, 7, 9, 10, 11, 13, 14, 15, 16, 18, 19, 20, 21, 23, 24, 25, 26, 27, 28, 29)
- footer struktur 1b47f567f9: 8 part (1, 2, 3, 4, 8, 12, 17, 22)
- footer struktur d140d1bfa8: 21 part (5, 6, 7, 9, 10, 11, 13, 14, 15, 16, 18, 19, 20, 21, 23, 24, 25, 26, 27, 28, 29)

Isi mentah (namespace dihapus) contoh header kosong, header bertulis, footer kosong, dan footer blok register:

`word/header1.xml`:

```xml
<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<w:hdr><w:p><w:pPr><w:pStyle w:val="Header"/><w:spacing w:before="0" w:after="0" w:line="40" w:lineRule="exact"/></w:pPr></w:p></w:hdr>
```

`word/header5.xml`:

```xml
<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<w:hdr><w:p><w:pPr><w:pStyle w:val="Header"/><w:tabs><w:tab w:pos="9411" w:val="right"/></w:tabs><w:spacing w:before="0" w:after="0" w:line="180" w:lineRule="exact"/><w:pBdr><w:bottom w:val="single" w:sz="5" w:space="1" w:color="C3CBD1"/></w:pBdr></w:pPr><w:r><w:rPr><w:b w:val="0"/><w:i w:val="0"/><w:caps/><w:color w:val="6B7783"/><w:sz w:val="13"/><w:rFonts w:ascii="IBM Plex Sans Cond" w:hAnsi="IBM Plex Sans Cond" w:cs="IBM Plex Sans Cond" w:eastAsia="IBM Plex Sans Cond"/><w:spacing w:val="12"/></w:rPr><w:t>PT Gemilang Satria Perkasa · Manual DATUM · Bab 1 · Identitas, Peta, dan Cara Memakai Manual</w:t></w:r><w:r><w:rPr><w:b/><w:i w:val="0"/><w:caps/><w:color w:val="101418"/><w:sz w:val="13"/><w:rFonts w:ascii="IBM Plex Sans Cond" w:hAnsi="IBM Plex Sans Cond" w:cs="IBM Plex Sans Cond" w:eastAsia="IBM Plex Sans Cond"/><w:spacing w:val="12"/></w:rPr><w:tab/><w:t>TERBATAS</w:t></w:r></w:p></w:hdr>
```

`word/footer1.xml`:

```xml
<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<w:ftr><w:p><w:pPr><w:pStyle w:val="Footer"/><w:spacing w:before="0" w:after="0" w:line="40" w:lineRule="exact"/></w:pPr></w:p></w:ftr>
```

`word/footer5.xml`:

```xml
<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<w:ftr><w:tbl><w:tblPr><w:tblW w:type="auto" w:w="0"/><w:tblLayout w:type="fixed"/><w:tblLook w:firstColumn="1" w:firstRow="1" w:lastColumn="0" w:lastRow="0" w:noHBand="0" w:noVBand="1" w:val="04A0"/><w:tblBorders><w:top w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:left w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:bottom w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:right w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:insideH w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:insideV w:val="none" w:sz="0" w:space="0" w:color="auto"/></w:tblBorders><w:tblLayout w:type="fixed"/><w:tblW w:w="9412" w:type="dxa"/><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:left w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid><w:gridCol w:w="2948"/><w:gridCol w:w="2381"/><w:gridCol w:w="2381"/><w:gridCol w:w="1701"/></w:tblGrid><w:tr><w:trPr><w:cantSplit w:val="1"/></w:trPr><w:tc><w:tcPr><w:tcW w:type="dxa" w:w="2948"/><w:tcW w:w="2948" w:type="dxa"/><w:tcMar><w:top w:w="90" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:bottom w:w="79" w:type="dxa"/><w:right w:w="141" w:type="dxa"/></w:tcMar><w:tcBorders><w:top w:val="single" w:sz="8" w:space="0" w:color="101418"/><w:bottom w:val="single" w:sz="5" w:space="0" w:color="C3CBD1"/><w:right w:val="single" w:sz="5" w:space="0" w:color="C3CBD1"/></w:tcBorders></w:tcPr><w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="168" w:lineRule="exact"/><w:jc w:val="left"/></w:pPr><w:r><w:rPr><w:b w:val="0"/><w:i w:val="0"/><w:color w:val="6B7783"/><w:sz w:val="12"/><w:rFonts w:ascii="IBM Plex Mono" w:hAnsi="IBM Plex Mono" w:cs="IBM Plex Mono" w:eastAsia="IBM Plex Mono"/></w:rPr><w:t xml:space="preserve">GSP · </w:t></w:r><w:r><w:rPr><w:b/><w:i w:val="0"/><w:color w:val="101418"/><w:sz w:val="12"/><w:rFonts w:ascii="IBM Plex Mono" w:hAnsi="IBM Plex Mono" w:cs="IBM Plex Mono" w:eastAsia="IBM Plex Mono"/></w:rPr><w:t>000/GSP/STD/X/2026</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:type="dxa" w:w="2381"/><w:tcW w:w="2381" w:type="dxa"/><w:tcMar><w:top w:w="90" w:type="dxa"/><w:left w:w="141" w:type="dxa"/><w:bottom w:w="79" w:type="dxa"/><w:right w:w="141" w:type="dxa"/></w:tcMar><w:tcBorders><w:top w:val="single" w:sz="8" w:space="0" w:color="101418"/><w:bottom w:val="single" w:sz="5" w:space="0" w:color="C3CBD1"/><w:right w:val="single" w:sz="5" w:space="0" w:color="C3CBD1"/></w:tcBorders></w:tcPr><w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="168" w:lineRule="exact"/><w:jc w:val="left"/></w:pPr><w:r><w:rPr><w:b w:val="0"/><w:i w:val="0"/><w:color w:val="6B7783"/><w:sz w:val="12"/><w:rFonts w:ascii="IBM Plex Mono" w:hAnsi="IBM Plex Mono" w:cs="IBM Plex Mono" w:eastAsia="IBM Plex Mono"/></w:rPr><w:t xml:space="preserve">REV </w:t></w:r><w:r><w:rPr><w:b/><w:i w:val="0"/><w:color w:val="101418"/><w:sz w:val="12"/><w:rFonts w:ascii="IBM Plex Mono" w:hAnsi="IBM Plex Mono" w:cs="IBM Plex Mono" w:eastAsia="IBM Plex Mono"/></w:rPr><w:t>A</w:t></w:r><w:r><w:rPr><w:b w:val="0"/><w:i w:val="0"/><w:color w:val="6B7783"/><w:sz w:val="12"/><w:rFonts w:ascii="IBM Plex Mono" w:hAnsi="IBM Plex Mono" w:cs="IBM Plex Mono" w:eastAsia="IBM Plex Mono"/></w:rPr><w:t xml:space="preserve"> · 08-X-2026</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:type="dxa" w:w="2381"/><w:tcW w:w="2381" w:type="dxa"/><w:tcMar><w:top w:w="90" w:type="dxa"/><w:left w:w="141" w:type="dxa"/><w:bottom w:w="79" w:type="dxa"/><w:right w:w="141" w:type="dxa"/></w:tcMar><w:tcBorders><w:top w:val="single" w:sz="8" w:space="0" w:color="101418"/><w:bottom w:val="single" w:sz="5" w:space="0" w:color="C3CBD1"/><w:right w:val="single" w:sz="5" w:space="0" w:color="C3CBD1"/></w:tcBorders></w:tcPr><w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="168" w:lineRule="exact"/><w:jc w:val="left"/></w:pPr><w:r><w:rPr><w:b w:val="0"/><w:i w:val="0"/><w:color w:val="6B7783"/><w:sz w:val="12"/><w:rFonts w:ascii="IBM Plex Mono" w:hAnsi="IBM Plex Mono" w:cs="IBM Plex Mono" w:eastAsia="IBM Plex Mono"/></w:rPr><w:t xml:space="preserve">LEMBAR </w:t></w:r><w:fldSimple w:instr=" PAGE "><w:r><w:rPr><w:rFonts w:ascii="IBM Plex Mono" w:hAnsi="IBM Plex Mono" w:cs="IBM Plex Mono"/><w:b/><w:color w:val="101418"/><w:sz w:val="12"/><w:szCs w:val="12"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple><w:r><w:rPr><w:b w:val="0"/><w:i w:val="0"/><w:color w:val="6B7783"/><w:sz w:val="12"/><w:rFonts w:ascii="IBM Plex Mono" w:hAnsi="IBM Plex Mono" w:cs="IBM Plex Mono" w:eastAsia="IBM Plex Mono"/></w:rPr><w:t xml:space="preserve"> DARI </w:t></w:r><w:fldSimple w:instr=" NUMPAGES "><w:r><w:rPr><w:rFonts w:ascii="IBM Plex Mono" w:hAnsi="IBM Plex Mono" w:cs="IBM Plex Mono"/><w:b/><w:color w:val="101418"/><w:sz w:val="12"/><w:szCs w:val="12"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple></w:p></w:tc><w:tc><w:tcPr><w:tcW w:type="dxa" w:w="1701"/><w:tcW w:w="1701" w:type="dxa"/><w:tcMar><w:top w:w="90" w:type="dxa"/><w:left w:w="141" w:type="dxa"/><w:bottom w:w="79" w:type="dxa"/><w:right w:w="141" w:type="dxa"/></w:tcMar><w:tcBorders><w:top w:val="single" w:sz="8" w:space="0" w:color="101418"/><w:bottom w:val="single" w:sz="5" w:space="0" w:color="C3CBD1"/></w:tcBorders></w:tcPr><w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="168" w:lineRule="exact"/><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:b/><w:i w:val="0"/><w:color w:val="101418"/><w:sz w:val="12"/><w:rFonts w:ascii="IBM Plex Mono" w:hAnsi="IBM Plex Mono" w:cs="IBM Plex Mono" w:eastAsia="IBM Plex Mono"/></w:rPr><w:t>TERBATAS</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p><w:pPr><w:pStyle w:val="Footer"/><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/></w:pPr></w:p></w:ftr>
```

## 7. Gambar: 52 penempatan dan 27 berkas media

Kolom "lokasi": semua 52 berada di badan (`w:body/w:p/w:r/w:drawing`); 0 di tabel; 0 di header/footer. Semua `wp:inline` (anchor: 0; `wp:anchor`: 0). EMU -> mm = EMU/36000. "sebelum"/"sesudah" = elemen anak body tepat sebelum/sesudah paragraf gambar. "caption" = apakah paragraf sebelum berawalan `Gambar ` (caption di atas gambar).

| # | p# | seksi | klaster | cx x cy (EMU) | mm | rId -> media | nama gambar (pic:cNvPr) | docPr (id/name/descr) | sebelum | sesudah | caption |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 0 | 1 | K-01 | 1584000 x 851649 | 44.00 x 23.66 | rId11 -> image1.png | gsp-tinta.png | 1/Picture 1/None | tabel T001: KLASIFIKASI · TERBATASSALINAN INDUK · PENGGUNAA... | p#1: Divisi Engineering & Technical Intelligence · Jl. Bangka ... | tidak |
| 2 | 3 | 1 | K-04 | 5976000 x 86874 | 166.00 x 2.41 | rId12 -> image2.png | datum-w166.png | 2/Picture 2/None | p#2: (kosong/gambar) | p#4: Standar · Manual Komprehensif · Panduan Skill DATUM GSP | tidak |
| 3 | 28 | 4 | K-04 | 5976000 x 86874 | 166.00 x 2.41 | rId12 -> image2.png | datum-w166.png | 3/Picture 3/None | p#27: (kosong/gambar) | p#29: Bagian I | tidak |
| 4 | 34 | 5 | K-24 | 4608000 x 86857 | 128.00 x 2.41 | rId21 -> image3.png | datum-128.png | 4/Picture 4/None | p#33: Bab 1 | p#35: Identitas, Peta, dan Cara Memakai Manual | tidak |
| 5 | 62 | 6 | K-24 | 4608000 x 86857 | 128.00 x 2.41 | rId21 -> image3.png | datum-128.png | 5/Picture 5/None | p#61: Bab 2 | p#63: Prinsip Induk dan Hierarki Kewenangan | tidak |
| 6 | 77 | 6 | K-32 | 5976000 x 4525426 | 166.00 x 125.71 | rId24 -> image4.png | g21.png | 6/Picture 6/None | p#76: Gambar 2.1 Pembagian pemilik dari isi sampai berkas terbi... | p#78: KUNCI garis penuh isi · putus-putus keputusan · titik-tit... | ya |
| 7 | 92 | 7 | K-24 | 4608000 x 86857 | 128.00 x 2.41 | rId21 -> image3.png | datum-128.png | 7/Picture 7/None | p#91: Bab 3 | p#93: Tier, Alur Bangun, dan Penamaan | tidak |
| 8 | 113 | 7 | K-32 | 5976000 x 1612088 | 166.00 x 44.78 | rId27 -> image5.png | g31.png | 8/Picture 8/None | p#112: Gambar 3.1 Urutan membangun dokumen DATUM dari nomor samp... | p#114: KUNCI stadion mulai dan selesai · segi enam gerbang · gar... | ya |
| 9 | 126 | 8 | K-04 | 5976000 x 86874 | 166.00 x 2.41 | rId12 -> image2.png | datum-w166.png | 9/Picture 9/None | p#125: (kosong/gambar) | p#127: Bagian II | tidak |
| 10 | 132 | 9 | K-24 | 4608000 x 86857 | 128.00 x 2.41 | rId21 -> image3.png | datum-128.png | 10/Picture 10/None | p#131: Bab 4 | p#133: Warna, Tipografi, Grid, dan Perangkat Halaman | tidak |
| 11 | 164 | 9 | K-32 | 4608000 x 6516392 | 128.00 x 181.01 | rId32 -> image6.png | anatomi.png | 11/Picture 11/None | p#163: Gambar 4.1 Anatomi halaman interior DATUM: halaman 7 spes... | p#165: SUMBER Proposal Teknis Spesimen UPK-70 000-GSP-PT-X-2026 ... | ya |
| 12 | 171 | 10 | K-24 | 4608000 x 86857 | 128.00 x 2.41 | rId21 -> image3.png | datum-128.png | 12/Picture 12/None | p#170: Bab 5 | p#172: Tabel dan Aparatus Bukti | tidak |
| 13 | 207 | 11 | K-24 | 4608000 x 86857 | 128.00 x 2.41 | rId21 -> image3.png | datum-128.png | 13/Picture 13/None | p#206: Bab 6 | p#208: Kepatuhan, Satuan, dan Reproduksi | tidak |
| 14 | 239 | 12 | K-04 | 5976000 x 86874 | 166.00 x 2.41 | rId12 -> image2.png | datum-w166.png | 14/Picture 14/None | p#238: (kosong/gambar) | p#240: Bagian III | tidak |
| 15 | 245 | 13 | K-24 | 4608000 x 86857 | 128.00 x 2.41 | rId21 -> image3.png | datum-128.png | 15/Picture 15/None | p#244: Bab 7 | p#246: Memilih dan Membuat Chart | tidak |
| 16 | 301 | 14 | K-24 | 4608000 x 86857 | 128.00 x 2.41 | rId21 -> image3.png | datum-128.png | 16/Picture 16/None | p#300: Bab 8 | p#302: Pustaka Chart GSP | tidak |
| 17 | 308 | 14 | K-32 | 5976000 x 7921249 | 166.00 x 220.03 | rId43 -> image7.png | Pustaka Chart Lembar 1.png | 17/Picture 17/None | p#307: Gambar 8.1 Perbandingan: bar urut tetap default, dan thre... | p#309: SUMBER pustakachart.py, data ilustrasi · katalog Panduan ... | ya |
| 18 | 314 | 14 | K-32 | 5976000 x 4753359 | 166.00 x 132.04 | rId44 -> image8.png | Pustaka Chart Lembar 2.png | 18/Picture 18/None | p#313: Gambar 8.2 Hubungan: scatter adalah langkah pertama, seda... | p#315: SUMBER pustakachart.py, data ilustrasi · katalog Panduan ... | ya |
| 19 | 320 | 14 | K-32 | 5976000 x 6335780 | 166.00 x 175.99 | rId45 -> image9.png | Pustaka Chart Lembar 3.png | 19/Picture 19/None | p#319: Gambar 8.3 Komposisi dan aliran: stacked bar default, pie... | p#321: SUMBER pustakachart.py, data ilustrasi · katalog Panduan ... | ya |
| 20 | 326 | 14 | K-32 | 5976000 x 6335780 | 166.00 x 175.99 | rId46 -> image10.png | Pustaka Chart Lembar 4.png | 20/Picture 20/None | p#325: Gambar 8.4 Waktu: line default dengan label langsung, sed... | p#327: SUMBER pustakachart.py, data ilustrasi · katalog Panduan ... | ya |
| 21 | 332 | 14 | K-32 | 5976000 x 6335780 | 166.00 x 175.99 | rId47 -> image11.png | Pustaka Chart Lembar 5.png | 21/Picture 21/None | p#331: Gambar 8.5 Sebaran, geospasial, dan proses: beeswarm dan ... | p#333: SUMBER pustakachart.py, data ilustrasi · katalog Panduan ... | ya |
| 22 | 353 | 15 | K-24 | 4608000 x 86857 | 128.00 x 2.41 | rId21 -> image3.png | datum-128.png | 22/Picture 22/None | p#352: Bab 9 | p#354: Diagram dan Mesin Gambar | tidak |
| 23 | 377 | 15 | K-32 | 5976000 x 3971854 | 166.00 x 110.33 | rId50 -> image12.png | simbol14.png | 23/Picture 23/None | p#376: Gambar 9.1 Topologi jaringan pengawasan bertingkat dengan... | p#378: SUMBER Panduan Simbol Engineering GSP v1.0 Gambar 6.3. PR... | ya |
| 24 | 381 | 15 | K-32 | 5976000 x 2842244 | 166.00 x 78.95 | rId51 -> image13.png | simbol15.png | 24/Picture 24/None | p#380: Gambar 9.2 Penanganan alarm perimeter dalam BPMN 2.0.2: s... | p#382: SUMBER Panduan Simbol Engineering GSP v1.0 Gambar 6.4. PR... | ya |
| 25 | 385 | 15 | K-32 | 3600000 x 4065753 | 100.00 x 112.94 | rId52 -> image14.png | simbol16.png | 25/Picture 25/None | p#384: Gambar 9.3 Elevasi rak 24U dengan nomor U dari bawah, kon... | p#386: SUMBER Panduan Simbol Engineering GSP v1.0 Gambar 6.5. Un... | ya |
| 26 | 390 | 16 | K-24 | 4608000 x 86857 | 128.00 x 2.41 | rId21 -> image3.png | datum-128.png | 26/Picture 26/None | p#389: Bab 10 | p#391: Simbol Engineering | tidak |
| 27 | 412 | 16 | K-32 | 5976000 x 3625440 | 166.00 x 100.71 | rId55 -> image15.png | simbol1.png | 27/Picture 27/None | p#411: Gambar 10.1 Pustaka DATUM iec: enam belas simbol listrik. | p#413: SUMBER datum_symbols.py --sheet, via Panduan Simbol Engin... | ya |
| 28 | 416 | 16 | K-32 | 5976000 x 1372504 | 166.00 x 38.13 | rId56 -> image16.png | simbol2.png | 28/Picture 28/None | p#415: Gambar 10.2 Bentuk konvensional tambahan untuk proyek kom... | p#417: SUMBER Panduan Simbol Engineering GSP v1.0 Gambar 5.2. PR... | ya |
| 29 | 424 | 16 | K-32 | 5976000 x 2517888 | 166.00 x 69.94 | rId57 -> image17.png | simbol3.png | 29/Picture 29/None | p#423: Gambar 10.3 Pustaka DATUM isa: dua belas simbol instrumen... | p#425: SUMBER datum_symbols.py --sheet, via Panduan Simbol Engin... | ya |
| 30 | 432 | 16 | K-32 | 5976000 x 2517888 | 166.00 x 69.94 | rId58 -> image18.png | simbol4.png | 30/Picture 30/None | p#431: Gambar 10.4 Pustaka DATUM sec: legenda rumah GSP, bukan s... | p#433: SUMBER datum_symbols.py --sheet, via Panduan Simbol Engin... | ya |
| 31 | 440 | 16 | K-32 | 5976000 x 1613520 | 166.00 x 44.82 | rId59 -> image19.png | simbol5.png | 31/Picture 31/None | p#439: Gambar 10.5 Pustaka DATUM mil: bingkai identitas. | p#441: SUMBER datum_symbols.py --sheet, via Panduan Simbol Engin... | ya |
| 32 | 444 | 16 | K-32 | 5976000 x 1738662 | 166.00 x 48.30 | rId60 -> image20.png | simbol6.png | 32/Picture 32/None | p#443: Gambar 10.6 Anatomi simbol satuan: bingkai, ikon fungsi, ... | p#445: SUMBER Panduan Simbol Engineering GSP v1.0 Gambar 5.6. PR... | ya |
| 33 | 451 | 16 | K-32 | 5976000 x 1473178 | 166.00 x 40.92 | rId61 -> image21.png | simbol7.png | 33/Picture 33/None | p#450: Gambar 10.7 Delapan simbol ISO 5807 yang paling sering di... | p#452: SUMBER Panduan Simbol Engineering GSP v1.0 Gambar 5.7. PR... | ya |
| 34 | 455 | 16 | K-32 | 5976000 x 2123875 | 166.00 x 59.00 | rId62 -> image22.png | simbol8.png | 34/Picture 34/None | p#454: Gambar 10.8 Elemen inti BPMN: peristiwa, tugas, gerbang, ... | p#456: SUMBER Panduan Simbol Engineering GSP v1.0 Gambar 5.8. PR... | ya |
| 35 | 459 | 16 | K-32 | 5976000 x 2196753 | 166.00 x 61.02 | rId63 -> image23.png | simbol9.png | 35/Picture 35/None | p#458: Gambar 10.9 Simbol DFD, UML, dan contoh tingkat Kontainer... | p#460: SUMBER Panduan Simbol Engineering GSP v1.0 Gambar 5.9. PR... | ya |
| 36 | 466 | 16 | K-32 | 5976000 x 1910446 | 166.00 x 53.07 | rId64 -> image24.png | simbol10.png | 36/Picture 36/None | p#465: Gambar 10.10 Usulan legenda rumah GSP untuk topologi jari... | p#467: SUMBER Panduan Simbol Engineering GSP v1.0 Gambar 5.10. P... | ya |
| 37 | 470 | 16 | K-32 | 5976000 x 1786915 | 166.00 x 49.64 | rId65 -> image25.png | simbol11.png | 37/Picture 37/None | p#469: Gambar 10.11 Lima jenis garis ISO 128-2:2022 yang dipakai... | p#471: SUMBER Panduan Simbol Engineering GSP v1.0 Gambar 5.11 · ... | ya |
| 38 | 483 | 16 | K-32 | 5976000 x 3648881 | 166.00 x 101.36 | rId66 -> image26.png | simbol12.png | 38/Picture 38/None | p#482: Gambar 10.12 Diagram satu garis catu daya pos perimeter d... | p#484: SUMBER Panduan Simbol Engineering GSP v1.0 Gambar 6.1. AT... | ya |
| 39 | 487 | 16 | K-32 | 5976000 x 3784978 | 166.00 x 105.14 | rId67 -> image27.png | simbol13.png | 39/Picture 39/None | p#486: Gambar 10.13 Denah perimeter dengan legenda rumah: kamera... | p#488: SUMBER Panduan Simbol Engineering GSP v1.0 Gambar 6.2. Ke... | ya |
| 40 | 497 | 17 | K-04 | 5976000 x 86874 | 166.00 x 2.41 | rId12 -> image2.png | datum-w166.png | 40/Picture 40/None | p#496: (kosong/gambar) | p#498: Bagian IV | tidak |
| 41 | 503 | 18 | K-24 | 4608000 x 86857 | 128.00 x 2.41 | rId21 -> image3.png | datum-128.png | 41/Picture 41/None | p#502: Bab 11 | p#504: Gaya Bahasa Ahli: Tujuh Lapis | tidak |
| 42 | 523 | 19 | K-24 | 4608000 x 86857 | 128.00 x 2.41 | rId21 -> image3.png | datum-128.png | 42/Picture 42/None | p#522: Bab 12 | p#524: Lapis L0 sampai L2: Orientasi, Arsitektur, Paragraf | tidak |
| 43 | 551 | 20 | K-24 | 4608000 x 86857 | 128.00 x 2.41 | rId21 -> image3.png | datum-128.png | 43/Picture 43/None | p#550: Bab 13 | p#552: Lapis L3 sampai L5: Kalimat, Kata, Suara | tidak |
| 44 | 580 | 21 | K-24 | 4608000 x 86857 | 128.00 x 2.41 | rId21 -> image3.png | datum-128.png | 44/Picture 44/None | p#579: Bab 14 | p#581: Lapis L6: Mesin Periksa dan Penilai | tidak |
| 45 | 612 | 22 | K-04 | 5976000 x 86874 | 166.00 x 2.41 | rId12 -> image2.png | datum-w166.png | 45/Picture 45/None | p#611: (kosong/gambar) | p#613: Bagian V | tidak |
| 46 | 618 | 23 | K-24 | 4608000 x 86857 | 128.00 x 2.41 | rId21 -> image3.png | datum-128.png | 46/Picture 46/None | p#617: Bab 15 | p#619: Workbook dan Command Brief | tidak |
| 47 | 636 | 24 | K-24 | 4608000 x 86857 | 128.00 x 2.41 | rId21 -> image3.png | datum-128.png | 47/Picture 47/None | p#635: Bab 16 | p#637: Gerbang Rilis Terpadu | tidak |
| 48 | 680 | 25 | K-24 | 4608000 x 86857 | 128.00 x 2.41 | rId21 -> image3.png | datum-128.png | 48/Picture 48/None | p#679: Bab 17 | p#681: Rekonsiliasi Antar-Sumber dan Program Perbaikan | tidak |
| 49 | 714 | 26 | K-24 | 4608000 x 86857 | 128.00 x 2.41 | rId21 -> image3.png | datum-128.png | 49/Picture 49/None | p#713: Lampiran A | p#715: Indeks Aturan Terpadu | tidak |
| 50 | 727 | 27 | K-24 | 4608000 x 86857 | 128.00 x 2.41 | rId21 -> image3.png | datum-128.png | 50/Picture 50/None | p#726: Lampiran B | p#728: Daftar Periksa Pra-Serah Satu Halaman | tidak |
| 51 | 734 | 28 | K-24 | 4608000 x 86857 | 128.00 x 2.41 | rId21 -> image3.png | datum-128.png | 51/Picture 51/None | p#733: Lampiran C | p#735: Glosarium Kendali dan Istilah | tidak |
| 52 | 742 | 29 | K-24 | 4608000 x 86857 | 128.00 x 2.41 | rId21 -> image3.png | datum-128.png | 52/Picture 52/None | p#741: Lampiran D | p#743: Register Sumber | tidak |

Penempatan per klaster paragraf: K-01=1, K-04=6, K-24=21, K-32=24 (jumlah 52).
Penempatan per ukuran (mm): 44.0 x 23.66: 1, 100.0 x 112.94: 1, 128.0 x 2.41: 21, 128.0 x 181.01: 1, 166.0 x 2.41: 6, 166.0 x 38.13: 1, 166.0 x 40.92: 1, 166.0 x 44.78: 1, 166.0 x 44.82: 1, 166.0 x 48.3: 1, 166.0 x 49.64: 1, 166.0 x 53.07: 1, 166.0 x 59.0: 1, 166.0 x 61.02: 1, 166.0 x 69.94: 2, 166.0 x 78.95: 1, 166.0 x 100.71: 1, 166.0 x 101.36: 1, 166.0 x 105.14: 1, 166.0 x 110.33: 1, 166.0 x 125.71: 1, 166.0 x 132.04: 1, 166.0 x 175.99: 3, 166.0 x 220.03: 1.

### 7.1 Berkas media (27)

Semua bertipe PNG (magic `89504E47`). `warna` = PNG colortype (2 = RGB, 6 = RGBA) / kedalaman bit. `dpi` dari chunk `pHYs` (kosong bila chunk tidak ada). "dipakai" = nomor penempatan (kolom # bagian 7).

| Media | byte | sha256 | tipe | piksel | dpi (pHYs) | dpi efektif | warna | rId | dipakai (jumlah) | penempatan # |
|---|---|---|---|---|---|---|---|---|---|---|
| media/image1.png | 36661 | 69636059ddc4155c66430007d9c8bf280ce44090f408b5ab557f5efd0962111e | png | 2390 x 1285 | - | 1379.7 | 6/8 | rId11 | 1 | 1 |
| media/image2.png | 1107 | c6ec4793fb47c142de2ac5f7dd247248c46987eeae6e379ff11a719ded6be8af | png | 3921 x 57 | - | 600.0 | 6/8 | rId12 | 6 | 2,3,9,14,40,45 |
| media/image3.png | 898 | d9866bd403569564ebec953d3190af21c1bd10496df9650be7047b01e48a8aa3 | png | 3024 x 57 | - | 600.1 | 6/8 | rId21 | 21 | 4,5,7,10,12,13,15,16,22,26,41,42,43,44,46,47,48,49,50,51,52 |
| media/image4.png | 126487 | 518c12f8c0ad232b2ccf1a280e5291fe20dbaa2f56d47c26db25b20949c047f1 | png | 1961 x 1485 | - | 300.1 | 6/8 | rId24 | 1 | 6 |
| media/image5.png | 96233 | 3f4a2d08a9aef65852c34372f2ac66df380dd679c9f1f44759ba4179c30da202 | png | 1961 x 529 | - | 300.1 | 6/8 | rId27 | 1 | 8 |
| media/image6.png | 303185 | d1aaab28ca48c94b400b1ad31933661f63c09157d8442c59bcc6abe9b1c027d2 | png | 1654 x 2339 | - | 328.2 | 2/8 | rId32 | 1 | 11 |
| media/image7.png | 326843 | 72e9561b25b18294c491edd6a930025d5e09f5b8eb35a37f2397039373548a67 | png | 1960 x 2598 | 300 x 300 | 299.9 | 6/8 | rId43 | 1 | 17 |
| media/image8.png | 320176 | ceec705a95d99047a82dcc2bcc3354e6a2da4cae308f15033e310968669279aa | png | 1960 x 1559 | 300 x 300 | 299.9 | 6/8 | rId44 | 1 | 18 |
| media/image9.png | 228027 | ef0bf75af8b49deddea3fa07fc10b89b7af4e4c96e98258892a6b53316f2ad10 | png | 1960 x 2078 | 300 x 300 | 299.9 | 6/8 | rId45 | 1 | 19 |
| media/image10.png | 268199 | 389f31b324d377b1eb0859c3aff6cbdade7cf1a85a47739649b3cdc2e659862c | png | 1960 x 2078 | 300 x 300 | 299.9 | 6/8 | rId46 | 1 | 20 |
| media/image11.png | 373910 | 48faf5e6357f9702c1dcd863de6eac4e3f3a2e614375d681a5a8df5e639af188 | png | 1960 x 2078 | 300 x 300 | 299.9 | 6/8 | rId47 | 1 | 21 |
| media/image12.png | 123901 | 7fe6dc2de2cd906b2601c0c44cc84385d96acbbf2214de6e9d311c0613655ccc | png | 1148 x 763 | 200 x 200 | 175.7 | 6/8 | rId50 | 1 | 23 |
| media/image13.png | 68549 | a578eacaa131a47a24190f31ba1b30b03afebe7a6451e59eae6499b4af7d7589 | png | 1148 x 546 | 200 x 200 | 175.7 | 6/8 | rId51 | 1 | 24 |
| media/image14.png | 71465 | 332b628130e2404ab1f712e1cea88668461f569176e5441e6f5c6440b30d2926 | png | 657 x 742 | 200 x 200 | 166.9 | 6/8 | rId52 | 1 | 25 |
| media/image15.png | 96514 | bfe5a2602bb3747d358621b2b53d10b8a98e7fd5f9d23ea51707996d0d62b8c1 | png | 1500 x 910 | - | 229.5 | 2/8 | rId55 | 1 | 27 |
| media/image16.png | 42545 | b393b274b93a3f742c504019497f87f96250622def008e3b3d9a663ed99c048d | png | 1119 x 257 | 200 x 200 | 171.2 | 6/8 | rId56 | 1 | 28 |
| media/image17.png | 98141 | aef2c2e00147dcc24af602a3b379d591ff33b762d91bc3673200ac36ed9d245c | png | 1500 x 632 | - | 229.5 | 2/8 | rId57 | 1 | 29 |
| media/image18.png | 58297 | cd3515aab307ce7b566fec289a4adb901f71b96e04e357338edf9375aaf95de9 | png | 1500 x 632 | - | 229.5 | 2/8 | rId58 | 1 | 30 |
| media/image19.png | 45900 | 10be9a7eb32d5e0764e4da5abc852c556c0180c0756c6347ed826687e88641e5 | png | 1500 x 405 | - | 229.5 | 2/8 | rId59 | 1 | 31 |
| media/image20.png | 80457 | d72633e73a80bccf5e908e7b61d11942d7da7b0866b7499b6ae7a0f5182f5579 | png | 1148 x 334 | 200 x 200 | 175.7 | 6/8 | rId60 | 1 | 32 |
| media/image21.png | 55237 | 51c58562498899b841f867f9ae226a321b8f869d2d3a32122ea79b8bfdc249d8 | png | 1148 x 283 | 200 x 200 | 175.7 | 6/8 | rId61 | 1 | 33 |
| media/image22.png | 69339 | 86de00e9483a041e7955b773dd47e0ed2c311dbf6cd488b7279e6e939658e583 | png | 1148 x 408 | 200 x 200 | 175.7 | 6/8 | rId62 | 1 | 34 |
| media/image23.png | 103680 | e7a57a9d52dfded2ec878114c6157ed132e95b239a1b20632d2fa5981d05d21e | png | 1148 x 422 | 200 x 200 | 175.7 | 6/8 | rId63 | 1 | 35 |
| media/image24.png | 61321 | a71c2a15e72b65e92ae51658379987146424d04162e304a6f89b1babe3a5611c | png | 1148 x 367 | 200 x 200 | 175.7 | 6/8 | rId64 | 1 | 36 |
| media/image25.png | 60318 | d0967bd8fb38d77605f3493a2626faa2b0bf974d82a7d627aaa813b976a5f190 | png | 1117 x 334 | 200 x 200 | 170.9 | 6/8 | rId65 | 1 | 37 |
| media/image26.png | 74640 | ba1cd64251fe54039e97598b07bbd56e663d75ee83ad69d39b54f22f7f666c62 | png | 1171 x 715 | 200 x 200 | 179.2 | 6/8 | rId66 | 1 | 38 |
| media/image27.png | 93182 | 71cc747dd71618a38963c915e52ce5f461d3baeff835c063fa94ef16367a6c1c | png | 1121 x 710 | 200 x 200 | 171.5 | 6/8 | rId67 | 1 | 39 |

Duplikat isi (sha256 sama di berkas berbeda): 0. Total penempatan = 52 (jumlah kolom "dipakai" = 52). Media yang punya relasi tetapi tidak dipakai: 0.
Media dengan pemakaian ganda: image2.png x6; image3.png x21.

"dpi efektif" = lebar piksel / (lebar terpasang mm / 25,4), dihitung dari penempatan pertama media itu (penempatan ganda memakai ukuran terpasang yang sama).

## 8. Field dan unsur khusus

| Unsur | document.xml | 29 header | 29 footer | Catatan |
|---|---|---|---|---|
| fldSimple | 0 | 0 | 42 | PAGE dan NUMPAGES di footer register (21 footer x 2); nilai cache "1" |
| fldChar | 0 | 0 | 0 |  |
| bookmarkStart | 0 | 0 | 0 | tanpa bookmark/REF |
| hyperlink | 0 | 0 | 0 |  |
| footnoteReference | 0 | 0 | 0 | tanpa footnotes.xml |
| sym | 0 | 0 | 0 | tanpa `w:sym`; simbol ditulis sebagai karakter Unicode berfon DejaVu Sans (RS11,22,39,46,48,55,56,57,60) |
| tab_run | 80 | 21 | 0 | run-level `w:tab`: 80 di document.xml = K-30 (52) + K-35 (28); header 21 (satu per header bertulis) |
| tab_stop | 80 | 21 | 0 | `w:tabs/w:tab` (tab stop): 80 paragraf badan = K-30 pos=283 left, K-35 pos=397 left; header 21 pos=9411 right |
| br | 0 | 0 | 0 | tanpa pemenggalan halaman manual |
| lastRenderedPageBreak | 0 | 0 | 0 | tidak ada (berkas dibuat python-docx, bukan disimpan Word) |
| pageBreakBefore | 0 | 0 | 0 |  |
| sdt | 0 | 0 | 0 | tanpa kontrol konten: daftar isi bukan field TOC |
| pStyle | 0 | 29 | 29 | hanya Header/Footer di part header/footer; paragraf badan: 0 |
| drawing | 52 | 0 | 0 | semua `wp:inline` |

Instruksi field yang ada (seluruh part): `NUMPAGES`, `PAGE`. Instruksi TOC/REF/PAGEREF/HYPERLINK: tidak ada. Part tambahan footnotes/endnotes/comments/glossary di paket: tidak ada.

`lastRenderedPageBreak` per seksi: 0 di seluruh 29 seksi (kolom lrpb pada 6.1). Pemenggalan halaman di BM.docx hanya terjadi lewat 28 `w:sectPr` di `w:pPr` (K-12) + `sectPr` akhir; jenis break bawaan (nextPage). `keepNext`: 313 paragraf badan (K-23, K-24, K-25, K-26, K-29, K-32, K-33, K-36); `keepLines` 0; `widowControl` tidak ditulis.

## 9. docDefaults, styles.xml, settings.xml, fontTable.xml

### 9.1 docDefaults dan gaya Normal

- `w:docDefaults` (styles.xml): `docDefaults(rPrDefault(rPr(rFonts[asciiTheme=minorHAnsi,cstheme=minorBidi,eastAsiaTheme=minorEastAsia,hAnsiTheme=minorHAnsi];sz[val=22];szCs[val=22];lang[bidi=ar-SA,eastAsia=en-US,val=en-US]));pPrDefault(pPr(spacing[after=200,line=276,lineRule=auto])))`
- Gaya `Normal`: `style[default=1,styleId=Normal,type=paragraph](name[val=Normal];qFormat;rsid[val=00FC693F];pPr(spacing[after=0,line=270,lineRule=exact]);rPr(color[val=2B3640];sz[val=19];rFonts[ascii=IBM Plex Serif,cs=IBM Plex Serif,eastAsia=IBM Plex Serif,hAnsi=IBM Plex Serif];lang[val=id-ID]))`
- Gaya `Header`: `style[styleId=Header,type=paragraph](name[val=header];basedOn[val=Normal];link[val=HeaderChar];uiPriority[val=99];unhideWhenUsed;rsid[val=00E618BF];pPr(tabs(tab[pos=4680,val=center];tab[pos=9360,val=right]);spacing[after=0,line=240,lineRule=auto]))`
- Gaya `Footer`: `style[styleId=Footer,type=paragraph](name[val=footer];basedOn[val=Normal];link[val=FooterChar];uiPriority[val=99];unhideWhenUsed;rsid[val=00E618BF];pPr(tabs(tab[pos=4680,val=center];tab[pos=9360,val=right]);spacing[after=0,line=240,lineRule=auto]))`
- Gaya `TableNormal`: `style[default=1,styleId=TableNormal,type=table](name[val=Normal Table];uiPriority[val=99];semiHidden;unhideWhenUsed;tblPr(tblInd[type=dxa,w=0];tblCellMar(top[type=dxa,w=0];left[type=dxa,w=108];bottom[type=dxa,w=0];right[type=dxa,w=108])))`
- Semua paragraf badan dan sel bergaya Normal (tanpa `w:pStyle`; `pStyle` di document.xml: 0). Normal membawa: Serif `IBM Plex Serif`, `sz=19`, warna `2B3640`, `spacing after=0 line=270 exact`, `lang id-ID`. Perbedaan Normal terhadap docDefaults dicatat di atas; format langsung paragraf/run menimpa keduanya.
- Tema (`theme1.xml`): fon mayor latin = `Calibri`, fon minor latin = `Cambria`; docDefaults merujuk atribut tema `minorHAnsi/minorBidi/minorEastAsia`, namun Normal menimpa dengan `IBM Plex Serif`.

### 9.2 Gaya yang ada di styles.xml (164 gaya; ukuran berkas 349721 byte; stylesWithEffects.xml: 160 gaya)

Per jenis: paragraph 36, character 27, table 100, numbering 1. `w:latentStyles`: atribut `count=276`, `defLockedState=0`, `defUIPriority=99`, `defSemiHidden=1`, `defUnhideWhenUsed=1`, `defQFormat=0`; elemen `w:lsdException` ada 137.

- paragraph: Normal(Normal), Header(header), Footer(footer), Heading1(heading 1), Heading2(heading 2), Heading3(heading 3), Heading4(heading 4), Heading5(heading 5), Heading6(heading 6), Heading7(heading 7), Heading8(heading 8), Heading9(heading 9), NoSpacing(No Spacing), Title(Title), Subtitle(Subtitle), ListParagraph(List Paragraph), BodyText(Body Text), BodyText2(Body Text 2), BodyText3(Body Text 3), List(List), List2(List 2), List3(List 3), ListBullet(List Bullet), ListBullet2(List Bullet 2), ListBullet3(List Bullet 3), ListNumber(List Number), ListNumber2(List Number 2), ListNumber3(List Number 3), ListContinue(List Continue), ListContinue2(List Continue 2), ListContinue3(List Continue 3), MacroText(macro), Quote(Quote), Caption(caption), IntenseQuote(Intense Quote), TOCHeading(TOC Heading)
- character: HeaderChar(Header Char), FooterChar(Footer Char), DefaultParagraphFont(Default Paragraph Font), Heading1Char(Heading 1 Char), Heading2Char(Heading 2 Char), Heading3Char(Heading 3 Char), TitleChar(Title Char), SubtitleChar(Subtitle Char), BodyTextChar(Body Text Char), BodyText2Char(Body Text 2 Char), BodyText3Char(Body Text 3 Char), MacroTextChar(Macro Text Char), QuoteChar(Quote Char), Heading4Char(Heading 4 Char), Heading5Char(Heading 5 Char), Heading6Char(Heading 6 Char), Heading7Char(Heading 7 Char), Heading8Char(Heading 8 Char), Heading9Char(Heading 9 Char), Strong(Strong), Emphasis(Emphasis), IntenseQuoteChar(Intense Quote Char), SubtleEmphasis(Subtle Emphasis), IntenseEmphasis(Intense Emphasis), SubtleReference(Subtle Reference), IntenseReference(Intense Reference), BookTitle(Book Title)
- numbering: NoList(No List)
- table (100): TableNormal, TableGrid, LightShading, LightShading-Accent1, LightShading-Accent2, LightShading-Accent3, LightShading-Accent4, LightShading-Accent5, LightShading-Accent6, LightList, LightList-Accent1, LightList-Accent2, LightList-Accent3, LightList-Accent4, LightList-Accent5, LightList-Accent6, LightGrid, LightGrid-Accent1, LightGrid-Accent2, LightGrid-Accent3, LightGrid-Accent4, LightGrid-Accent5, LightGrid-Accent6, MediumShading1, MediumShading1-Accent1, MediumShading1-Accent2, MediumShading1-Accent3, MediumShading1-Accent4, MediumShading1-Accent5, MediumShading1-Accent6, MediumShading2, MediumShading2-Accent1, MediumShading2-Accent2, MediumShading2-Accent3, MediumShading2-Accent4, MediumShading2-Accent5, MediumShading2-Accent6, MediumList1, MediumList1-Accent1, MediumList1-Accent2, MediumList1-Accent3, MediumList1-Accent4, MediumList1-Accent5, MediumList1-Accent6, MediumList2, MediumList2-Accent1, MediumList2-Accent2, MediumList2-Accent3, MediumList2-Accent4, MediumList2-Accent5, MediumList2-Accent6, MediumGrid1, MediumGrid1-Accent1, MediumGrid1-Accent2, MediumGrid1-Accent3, MediumGrid1-Accent4, MediumGrid1-Accent5, MediumGrid1-Accent6, MediumGrid2, MediumGrid2-Accent1, MediumGrid2-Accent2, MediumGrid2-Accent3, MediumGrid2-Accent4, MediumGrid2-Accent5, MediumGrid2-Accent6, MediumGrid3, MediumGrid3-Accent1, MediumGrid3-Accent2, MediumGrid3-Accent3, MediumGrid3-Accent4, MediumGrid3-Accent5, MediumGrid3-Accent6, DarkList, DarkList-Accent1, DarkList-Accent2, DarkList-Accent3, DarkList-Accent4, DarkList-Accent5, DarkList-Accent6, ColorfulShading, ColorfulShading-Accent1, ColorfulShading-Accent2, ColorfulShading-Accent3, ColorfulShading-Accent4, ColorfulShading-Accent5, ColorfulShading-Accent6, ColorfulList, ColorfulList-Accent1, ColorfulList-Accent2, ColorfulList-Accent3, ColorfulList-Accent4, ColorfulList-Accent5, ColorfulList-Accent6, ColorfulGrid, ColorfulGrid-Accent1, ColorfulGrid-Accent2, ColorfulGrid-Accent3, ColorfulGrid-Accent4, ColorfulGrid-Accent5, ColorfulGrid-Accent6

Gaya yang dirujuk di seluruh part (document + header + footer): pStyle=Footer x29, pStyle=Header x29. `w:rStyle`/`w:tblStyle`: 0.

### 9.3 settings.xml

| Elemen | Ada | Nilai |
|---|---|---|
| `embedTrueTypeFonts` | ya | (tanpa atribut) |
| `saveSubsetFonts` | ya | w:val="false" |
| `updateFields` | tidak | - |
| `evenAndOddHeaders` | tidak | - |
| `mirrorMargins` | tidak | - |
| `defaultTabStop` | ya | w:val="720" |
| `compat` | ya | (tanpa atribut) |
| `compatSetting` | ya | w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="14" |
| `characterSpacingControl` | ya | w:val="doNotCompress" |
| `zoom` | ya | w:val="bestFit" |
| `doNotAutoCompressPictures` | ya | (tanpa atribut) |
| `savePreviewPicture` | ya | (tanpa atribut) |
| `themeFontLang` | ya | w:val="en-US" w:eastAsia="ja-JP" |
| `decimalSymbol` | ya | w:val="." |
| `listSeparator` | ya | w:val="," |
| `trackRevisions` | tidak | - |
| `defaultImageDpi` | ya | w14:val="300" |
| `useFELayout` | ya | (tanpa atribut) |
| `footnotePr` | tidak | - |
| `endnotePr` | tidak | - |

Entri `w:compatSetting`: compatibilityMode=14; overrideTableStyleFontSizeAndJustification=1; enableOpenTypeFeatures=1; doNotFlipMirrorIndents=1.

Isi settings.xml mentah (2592 byte):

```xml
<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<w:settings mc:Ignorable="w14"><w:saveSubsetFonts w:val="false"/><w:embedTrueTypeFonts/><w:zoom w:val="bestFit"/><w:proofState w:spelling="clean" w:grammar="clean"/><w:defaultTabStop w:val="720"/><w:characterSpacingControl w:val="doNotCompress"/><w:savePreviewPicture/><w:compat><w:useFELayout/><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="14"/><w:compatSetting w:name="overrideTableStyleFontSizeAndJustification" w:uri="http://schemas.microsoft.com/office/word" w:val="1"/><w:compatSetting w:name="enableOpenTypeFeatures" w:uri="http://schemas.microsoft.com/office/word" w:val="1"/><w:compatSetting w:name="doNotFlipMirrorIndents" w:uri="http://schemas.microsoft.com/office/word" w:val="1"/></w:compat><w:rsids><w:rsidRoot w:val="00B47730"/><w:rsid w:val="00034616"/><w:rsid w:val="0006063C"/><w:rsid w:val="0015074B"/><w:rsid w:val="0029639D"/><w:rsid w:val="00326F90"/><w:rsid w:val="00AA1D8D"/><w:rsid w:val="00B47730"/><w:rsid w:val="00CB0664"/><w:rsid w:val="00FC693F"/></w:rsids><m:mathPr><m:mathFont m:val="Cambria Math"/><m:brkBin m:val="before"/><m:brkBinSub m:val="--"/><m:smallFrac m:val="0"/><m:dispDef/><m:lMargin m:val="0"/><m:rMargin m:val="0"/><m:defJc m:val="centerGroup"/><m:wrapIndent m:val="1440"/><m:intLim m:val="subSup"/><m:naryLim m:val="undOvr"/></m:mathPr><w:themeFontLang w:val="en-US" w:eastAsia="ja-JP"/><w:clrSchemeMapping w:bg1="light1" w:t1="dark1" w:bg2="light2" w:t2="dark2" w:accent1="accent1" w:accent2="accent2" w:accent3="accent3" w:accent4="accent4" w:accent5="accent5" w:accent6="accent6" w:hyperlink="hyperlink" w:followedHyperlink="followedHyperlink"/><w:doNotAutoCompressPictures/><w:shapeDefaults><o:shapedefaults v:ext="edit" spidmax="1027"/><o:shapelayout v:ext="edit"><o:idmap v:ext="edit" data="1"/></o:shapelayout></w:shapeDefaults><w:decimalSymbol w:val="."/><w:listSeparator w:val=","/><w14:docId w14:val="24062061"/><w14:defaultImageDpi w14:val="300"/></w:settings>
```

### 9.4 fontTable.xml: 13 entri (8 tanpa tanam + 5 keluarga bertanam, 18 berkas)

Entri tanpa tanam: Symbol (charset 02, family auto, pitch variable); Times New Roman (charset 00, family auto, pitch variable); Cambria (charset 00, family auto, pitch variable); ＭＳ 明朝 (charset 80, family roman, pitch fixed, notTrueType); Calibri (charset 00, family auto, pitch variable); ＭＳ ゴシック (charset 80, family modern, pitch fixed, notTrueType); Courier (charset 00, family auto, pitch variable); Arial (charset 00, family auto, pitch variable).

Fon tertanam. Kunci obfuscation = atribut `w:fontKey` (GUID; XOR 32 byte pertama dengan byte GUID terbalik). Kolom "wajah sebenarnya" dibaca dari tabel `name`/`OS/2` setelah deobfuscation di memori (fontTools); `w:embedBold` pada keluarga IBM Plex menunjuk wajah SemiBold (bobot 600).

| Keluarga di fontTable | slot | rId | part | byte | w:fontKey | subsetted | sha256 (odttf) | wajah sebenarnya (family / subfamily / PS name) | usWeightClass | fsType | charset |
|---|---|---|---|---|---|---|---|---|---|---|---|
| IBM Plex Serif | Regular | rId1 | fonts/font1.odttf | 39008 | {C6CC77DE-3BD8-4067-90A0-488FA962A0C0} | 0 | 6d96874aa4cf03eb5cbae86b4c28b3d5f2825b60e6f9268e1092a9ac88b9157e | IBM Plex Serif / Regular / IBMPlexSerif-Regular | 400 | 0 | 00 |
| IBM Plex Serif | Bold | rId2 | fonts/font2.odttf | 39392 | {C5B2BA1A-089D-42FF-B699-B9F00DDE6168} | 0 | 5454b7012e54343c6527f4d2db31cebd94d65ed2302f333bf8b7fbc815fa3bd4 | IBM Plex Serif SemiBold / Regular / IBMPlexSerif-SemiBold | 600 | 0 | 00 |
| IBM Plex Serif | Italic | rId3 | fonts/font3.odttf | 41772 | {38E899C8-DB14-42EA-9B9D-53EBD74055C2} | 0 | e86809cbd6e883180d2f3374a032c903cdb85f1b1c6a693e494264bffb071cfc | IBM Plex Serif / Italic / IBMPlexSerif-Italic | 400 | 0 | 00 |
| IBM Plex Serif | BoldItalic | rId4 | fonts/font4.odttf | 41960 | {2010E995-449E-4A63-93F3-34E4210567E5} | 0 | b33b30cac9b86d49d6120b4bdb563d693bed6dd56f4b689c2fa747ddd9a84b7d | IBM Plex Serif SemiBold / Italic / IBMPlexSerif-SemiBoldItalic | 600 | 0 | 00 |
| IBM Plex Sans Cond | Regular | rId5 | fonts/font5.odttf | 36556 | {25F25E37-8368-4D93-B0B3-686C3A88E1D1} | 0 | 3ea7dea6a5d781da34df2108d6d72ba2cdf95e0c04653a272af2e2bbf682fe00 | IBM Plex Sans Condensed / Regular / IBMPlexSansCond-Regular | 400 | 0 | 00 |
| IBM Plex Sans Cond | Bold | rId6 | fonts/font6.odttf | 36436 | {457F17D0-357E-4AAB-B5DE-00A50F0FD9F6} | 0 | 6961505f01f9c0667c6af2db036907808cd08313408019275105be873e93af0a | IBM Plex Sans Condensed SemiBold / Regular / IBMPlexSansCond-SemiBold | 600 | 0 | 00 |
| IBM Plex Sans Cond | Italic | rId7 | fonts/font7.odttf | 39948 | {3DBC1EA0-D62A-4528-AD49-EB859BFC4915} | 0 | 97d167b3cf6b551c5b6375495c0a0e2124432535c07aa050e38537a733d97415 | IBM Plex Sans Condensed / Italic / IBMPlexSansCond-Italic | 400 | 0 | 00 |
| IBM Plex Sans Cond | BoldItalic | rId8 | fonts/font8.odttf | 39588 | {486CAD9B-76F3-432D-B515-14D4FD7C32CE} | 0 | ce8aa29716f6ae803503360e88c9a21a51830fd6409c5dc675a5d9ac31b3ad99 | IBM Plex Sans Condensed SemiBold / Italic / IBMPlexSansCond-SemiBoldItalic | 600 | 0 | 00 |
| IBM Plex Mono | Regular | rId9 | fonts/font9.odttf | 23976 | {3C79ABA9-FC29-4534-AFB9-FBE1F80FE2FA} | 0 | 6eeec9e47e147722cc1e77d68fc351f96d91e195e8b8d8c986e9324eb4b6a15c | IBM Plex Mono / Regular / IBMPlexMono-Regular | 400 | 0 | 00 |
| IBM Plex Mono | Bold | rId10 | fonts/font10.odttf | 23828 | {7E8DEF44-357E-4D8A-BC58-C54BEB1DB405} | 0 | 0ed0b9ee48e6b1959d481f7f551afe4c41a2979ea1a38f772fcd830ff5772690 | IBM Plex Mono SemiBold / Regular / IBMPlexMono-SemiBold | 600 | 0 | 00 |
| IBM Plex Mono | Italic | rId11 | fonts/font11.odttf | 27096 | {E3A2314E-B322-4406-8535-C9631280923D} | 0 | 39e02b12f4fe02c495171d1a71c34901ca77009778e7d5a6896878b02810cb57 | IBM Plex Mono / Italic / IBMPlexMono-Italic | 400 | 0 | 00 |
| IBM Plex Mono | BoldItalic | rId12 | fonts/font12.odttf | 26700 | {08FFA428-1CB0-4852-8CE2-28C3B2DB66D8} | 0 | e969aa16587e8921fd8e53b92121c3ab25ec516fccdf4068e2511cdaaab5c87f | IBM Plex Mono SemiBold / Italic / IBMPlexMono-SemiBoldItalic | 600 | 0 | 00 |
| IBM Plex Sans | Regular | rId13 | fonts/font13.odttf | 46220 | {4FA0B1A1-1334-4836-A087-23D2512268BC} | 0 | 26c6023d492d4c450b05ee0c1e2ec47c5aeae3c8f38c4985668df1097c90fe8a | IBM Plex Sans / Regular / IBMPlexSans-Regular | 400 | 0 | 00 |
| IBM Plex Sans | Bold | rId14 | fonts/font14.odttf | 46228 | {4E48F254-DCAD-4702-B10F-917A38A37C05} | 0 | 720591bff0ff023f277007ebb0214ff6fc679cd8cd22ad57550069a63161828c | IBM Plex Sans SemiBold / Regular / IBMPlexSans-SemiBold | 600 | 0 | 00 |
| IBM Plex Sans | Italic | rId15 | fonts/font15.odttf | 49552 | {7F58280B-77AA-41C4-8D97-9B5B4E84B34D} | 0 | c5aab028a7ee0ee947a32a14381beb2295d413f798843e2da40dec35aff399d9 | IBM Plex Sans / Italic / IBMPlexSans-Italic | 400 | 0 | 00 |
| IBM Plex Sans | BoldItalic | rId16 | fonts/font16.odttf | 49724 | {6B43B69F-A814-4C02-B8D1-09D770927D15} | 0 | 0823c93c1bfab2d4a6abdffda6092facb8e1e1e2b3cee1f5dd4247bb445f2cd3 | IBM Plex Sans SemiBold / Italic / IBMPlexSans-SemiBoldItalic | 600 | 0 | 00 |
| DejaVu Sans | Regular | rId17 | fonts/font17.odttf | 759720 | {68D6DDA9-B6FA-41A8-9F4B-883D407962B2} | 0 | 8cf10771b97c69d5c5e965809380379ec2ea7aa61ffba26729afc1bfbbc6a018 | DejaVu Sans / Book / DejaVuSans | 400 | 0 | 00 |
| DejaVu Sans | Bold | rId18 | fonts/font18.odttf | 708920 | {3E889C93-6B81-4F9C-AD43-E7A5F93F107F} | 0 | 65d4ec76f9a66722b9137c56404e539bfa091df6b3f51b9aa47928879228303d | DejaVu Sans / Bold / DejaVuSans-Bold | 700 | 0 | 00 |

Jumlah berkas tertanam: 18. Magic setelah deobfuscation: 00010000. Atribut keluarga IBM Plex: `charset 00`, `family auto`, `pitch variable`, tanpa `panose1`/`sig`.

Pemakaian wajah (`w:rFonts w:ascii`) per part, dihitung dari seluruh `word/*.xml`:

| Wajah | total | per part |
|---|---|---|
| IBM Plex Serif | 2694 | document.xml=2693, styles.xml=1 |
| IBM Plex Mono | 1590 | document.xml=1380, footerN.xml=210 |
| IBM Plex Sans Cond | 1161 | document.xml=1119, headerN.xml=42 |
| DejaVu Sans | 104 | document.xml=104 |
| Courier | 4 | styles.xml=2, stylesWithEffects.xml=2 |
| Symbol | 4 | numbering.xml=4 |

(Bandingkan research/05: Serif 2.694, Mono 1.590, Cond 1.161, DejaVu 104, Courier 4, Symbol 4.)

numbering.xml: 9 `abstractNum`, 9 `num`; `w:numPr` di document.xml: 0 (daftar di badan memakai penanda ketikan + tab, bukan penomoran Word).

Part lain di paket: `docProps/core.xml` (creator `python-docx`, dibuat/diubah 2013-12-23), `docProps/app.xml` (`Application` Microsoft Macintosh Word, `Pages` 1, `AppVersion` 14.0000), `docProps/thumbnail.jpeg` (8.324 byte), `customXml/item1.xml`, `word/webSettings.xml`, `word/theme/theme1.xml`, `word/stylesWithEffects.xml`.

## 10. Verifikasi (perintah dan keluaran)

Perintah 1 (ekstraksi dan hitungan, cwd di luar folder skill dan folder BM):

```
C:\Users\TRIAL\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe -I -B C:\Users\TRIAL\AppData\Local\Temp\hq_v21_clone\scripts\s90_core.py
body paras 748 cell paras 4159 sum 4907
klaster badan 36 klaster sel 40
body total 748 cell total 4159
run signatures 61
sections 29
placements 52
media 27 used 27
ditulis C:\Users\TRIAL\AppData\Local\Temp\hq_v21_clone\scripts\s90_data.json 1575661
```

Perintah 2 (hitung ulang independen: python-docx + regex atas XML mentah + penegasan assert):

```
C:\Users\TRIAL\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe -I -B C:\Users\TRIAL\AppData\Local\Temp\hq_v21_clone\scripts\s90_verify.py
python-docx: paragraf badan = 748 | tabel badan = 151 (len(d.tables) = 151 ) | seksi = 29
regex mentah document.xml: <w:sectPr = 29 | <w:drawing> = 52 | <wp:inline = 52 | <wp:anchor = 0 | <w:tbl> = 153 | <w:p ...> atau <w:p/> = 4907
regex mentah: <w:br = 0 | lastRenderedPageBreak = 0 | pageBreakBefore = 0 | fldChar/fldSimple/instrText = 0 | hyperlink = 0 | bookmarkStart = 0 | <w:sym = 0 | footnoteReference = 0
media di zip = 27 | relasi image di document.xml.rels = 27 | a:blip r:embed = 52 | rId media unik yang dipakai = 27
fonts di zip = 18
header*.xml = 29 | footer*.xml = 29 | headerReference = 29 | footerReference = 29 | titlePg = 0

klaster badan: len(body_assign) = 748 | None = 0 | klaster unik = 36 | jumlah anggota = 748
   n per klaster di tabel == hitungan dari peta: OK; jumlah n = 748 (tepat satu klaster per paragraf: len(peta) == 748 == n_p 748)
klaster sel: len(cell_assign) = 4159 | klaster unik = 40 | jumlah anggota = 4159
semua w:p di document.xml (termasuk <w:p/> kosong: 26) = 4907 == badan + sel = 4907
klaster total: badan 36 + sel 40 = 76

seksi di data = 29 | penempatan di data = 52 | media di data = 27 | tabel di data = 153 (top-level 151 + bersarang 2) | run signature = 61
ASSERT semua lulus: 748 paragraf (satu klaster masing-masing), 4159 paragraf sel, 151 tabel, 29 seksi, 52 penempatan, 27 media
```

Catatan: regex `<w:p[ >]` (tanpa `/`) menghasilkan 4.881; selisih 26 adalah `<w:p/>` kosong tanpa pPr (KT-19, n=26), bukan paragraf hilang. Pola `<w:p[ >/]` = 4.907 = 748 + 4.159.

Penegasan tambahan di `s90_write.py` (lulus saat dokumen ini dibangun): `vMerge`, `vAlign`, `trHeight`, `keepLines`, `pageBreakBefore`, `w:tblStyle`, `w:pStyle`, `w:rStyle`, `w:numPr`, `w:smallCaps`, `w:szCs` tidak muncul di document.xml; semua `tblPr` tanpa `w:jc`; `w:shd` tepat 16 dan seluruhnya di `w:tcPr`; jumlah anggota klaster sama dengan n yang dicatat di peran.


## 11. Collection Log

- Dibaca: `delegation_progress/driver_rules.md`, baris S90 di `identification/02_structured.md` (baris 238 dan 349), `research/04_manual_docx_tables.md` (1-465 dari 1815 baris; sisanya teks tabel, tidak diperlukan untuk format), `research/05_render_calibration.md`.
- Skrip: `s90_core.py` (ekstraksi), `s90_roles.py` (label dugaan), `s90_write.py` (penulis dokumen ini), `s90_verify.py` (hitung ulang independen). Semua di `C:\Users\TRIAL\AppData\Local\Temp\hq_v21_clone\scripts\`; keluaran perantara `s90_data.json` di folder yang sama.
- BM.docx dan BM.pdf hanya dibaca (BM.pdf: pencocokan halaman awal seksi dengan `pymupdf`, hanya teks). Tidak ada soffice dijalankan, tidak ada berkas ditulis di folder BM.
- Tidak ada penyuntingan di `decisions/`, `status_tasks.md`, `findings/`, `README.md`.

## 12. Gaps & Needs More Data

- Tidak ada peta langsung dari 4.159 paragraf sel ke posisi (baris, sel) di dokumen ini; yang dilaporkan: hitungan KT per tabel (5.5) dan klaster per kelas. Peta lengkap (tabel, baris, kolom, paragraf-dalam-sel -> KT) ada di `s90_data.json` (`cell_assign`) di folder skrip, di luar repo. Bila S93 membutuhkannya di repo, S93 dapat menjalankan ulang `s90_core.py`.
- Teks tabel penuh tidak diulang; sumbernya `research/04_manual_docx_tables.md`.
- Label "dugaan peran" bersifat heuristik penulis inventaris (berdasar skala huruf Tabel 4.4 = T033 dan anatomi T037 di research/04); tidak diverifikasi oleh pemilik dokumen.
- Halaman awal seksi (6.1) dari pencocokan teks `BM.pdf`; seksi dengan "tidak cocok" (jika ada) memerlukan penelusuran manual. `lastRenderedPageBreak` = 0, sehingga pemenggalan halaman dalam DOCX tidak tersedia kecuali lewat render.
- Ukuran gambar di header/footer: tidak berlaku (0 gambar). Citra perangkat halaman (rule/logo) yang disebut R9 (2.754 objek gambar di `BM.pdf`) bukan penempatan di DOCX; yang ada di DOCX adalah penempatan datum-w166 (6x) dan datum-128 (21x) di badan.
- Dimensi piksel dibaca dari header PNG (IHDR); `pHYs` tidak ada pada beberapa media (kolom dpi `-`).
