# IP-37 coder-execution: diagnosis BM4 halaman 26, 40, 87 (baca-saja), 2026-10-23

Status: complete (diagnosis; tidak ada berkas repo diubah selain catatan ini dan satu baris file_claims).

Masukan: keluaran INT-B yang masih ada `%TEMP%/intb/r5/out.docx` sha256 f697804e... (= DOCX garis dasar D-101), PDF 51cb1e00...; acuan = BM.docx 6f6f11d3... / BM.pdf ee0ed622.... Kerja di `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/ip37/` (png/: `p{26,40,87}_{ref,node,diff,probe_h1,diff_probe_h1}.png`; d26/d40/d87.txt = teks + bbox per baris; s/*.py skrip).

Sebab tunggal untuk ketiga halaman (TERBUKTI): semua teks `IBM Plex Sans Cond` Regular dirender dengan wajah SemiBold.
- Hitung fon PDF (s/fontuse.py): acuan IBMPlexSansCond-Regular 27.890 kar + SemiBold 14.306; Node Regular 0 + SemiBold 42.199. Wajah Regular hilang di seluruh dokumen.
- Mekanisme: fontTable node.docx menanam slot regular/italic "IBM Plex Sans Cond" dengan berkas kanonik (nameID1 "IBM Plex Sans Condensed", sha d3057856/be0b2f99), sedangkan slot bold/boldItalic memakai wajah relabel IP-20 (nameID1 "IBM Plex Sans Cond", 700). LibreOffice mencocokkan nama keluarga persis, jadi satu-satunya wajah "IBM Plex Sans Cond" yang ada adalah SemiBold berlabel Bold -> dipakai juga untuk teks reguler. Serif/Mono tidak kena (nama keluarga regular kanonik sudah sama dengan rFonts).
- Akar di kode: INT-B hanya menyalin 8 wajah bold/boldItalic dari set S99 `same` (17 wajah). Set itu juga memuat `IBMPlexSansCond-Regular.ttf` (cc28ffc6...) dan `-Italic.ttf` (125399c2...) berlabel "IBM Plex Sans Cond"; kalibrasi S99 (0,9999) memakai keempat slot. Area pemilik: `src/lib/studio/engine/docx/fonts/relabel.ts` (`RelabelSlot` = bold|boldItalic, tabel `RELABEL_FACES`), `fonts/plan.ts` `relabelled()` (keluar dini untuk slot selain bold), aset `src/lib/studio/assets/fonts/renamed/`.

Efek per halaman (bukti teks/bbox, peta selisih merah menyeluruh di bawah baris yang membungkus):
- Hlm 26 (SSIM 0,8568): catatan Turunan D-6.1 "PMK 131/2024 ..." (Sans Cond 7 pt) membungkus 2 -> 3 baris; sisa halaman turun 10 pt. Tanpa figur; tabel 6.3 ikut bergeser.
- Hlm 40 (0,6979): keterangan GAMBAR 8.4 (judul Sans Cond 7,5 pt) membungkus menjadi 2 baris ("komando."); figur 8.4 (raster 1960x2078, ukuran sama) turun 87,05 -> 98,05 pt (IoU 0,957), SUMBER dan TABEL 8.4 turun 11 pt. Figur/chart sendiri tidak salah.
- Hlm 87 (0,7466): baris SUMBER di bawah tabel langkah (Sans Cond 6,5 pt) membungkus ("3.1)."); 16.4, 16.5, TABEL 16.3 turun 9 pt.
- Semua halaman: kepala halaman berjalan (Sans Cond Regular 6,5 pt) tampil tebal (lebar 327,8 -> 335,0 pt) = penurunan kecil SSIM di 102 halaman.

Probe (tanpa ubah repo): salinan node.docx, slot font5/font7 (Sans Cond regular/italic) diganti wajah S99 `same` dengan fontKey asli -> `probe_h1.docx` sha 6dbddbe2...; soffice 1 instans, profil `ip37/prof`. Kontrol (node.docx dirender ulang sama): BM4 0,9809, hlm < 0,95 = [26, 40, 87] (reproduksi tepat). Probe: BM4 0,9992; hlm 26/40/87 = 1,0000/0,9999/1,0000; hlm >= 0,98 = 102/102 (kontrol 90); min 0,982 (hlm 1); BM1 100 %, BM3 101/102 tak berubah; hitung fon Sans Cond = acuan persis; piksel beda > 32 di 3 halaman: 41k/85k/67k -> 1/1/1.

Usulan perbaikan (pemilik engine/docx/fonts, INT-B/IP-20):
1. Tambah ke `RELABEL_FACES` slot regular + italic untuk "IBM Plex Sans Cond" (salin byte-identik 2 berkas S99 `same`, sha256 dikunci); perluas `RelabelSlot` dan `relabelled()` agar berlaku untuk slot mana pun bila nama keluarga berkas kanonik != nama rFonts. Perkiraan dampak = hasil probe (BM4 ~0,999); angka akhir hipotesis sampai engine merender ulang.
2. Penjaga regresi: uji `planEmbeddedFontsDetailed` bahwa tiap wajah tertanam punya nameID1/16 = nama keluarga diminta untuk semua slot (gagal sekarang untuk Sans Cond regular/italic); opsional cek benchmark "IBMPlexSansCond-Regular ada di PDF".
Sisa (hipotesis, di luar 3 halaman): hlm 1 0,982 = 2 karakter Inter tampil SegoeUI (Inter tidak tertanam di node maupun BM.docx); hlm 18 = F-033 (OpenSymbol 3 glif). Pesan stderr soffice "parser error: Document is empty" muncul saat konversi, PDF tetap utuh (tidak diselidiki).
Permintaan lintas pemilik: perbaikan 1-2 di `engine/docx/fonts/**` + `assets/fonts/renamed/` (bukan area figures/chart yang sedang disunting).
