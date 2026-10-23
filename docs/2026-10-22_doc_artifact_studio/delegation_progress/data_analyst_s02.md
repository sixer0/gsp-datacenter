# Catatan baris S02 (data-analyst)

**Status:** complete

**Berkas:**
- `research/06_chart_map_parity_matrix.md`
- catatan ini. Namanya `data_analyst_s02.md`, bukan `data-analyst_s02.md` seperti di brief, karena hook docs_accountability mewajibkan snake_case.

**Angka** (Grep count pada berkas research/06):
- 58 baris kode di tabel 5.1:
  - 4 datumchart: P-01, P-02, P-11, W-02;
  - 42 pustakachart;
  - 12 TANPA-ACUAN: P-14, H-08, H-09, K-05, K-06, K-11, W-09, W-10, S-07, S-08, G-02, G-03.
- 18 baris drawn=false (DF-01..DF-18): 2 punya fungsi galeri (v36_dendro, v47_spline), 16 tanpa acuan.
- Bentuk PARSIAL ada 8 kode: P-05, P-09, H-03, K-08, W-08, S-01, G-01, G-04.

**Chart yang dipakai Manual 000:**
- Ke-58 kode muncul sebagai panel di Gambar 8.1-8.5, halaman 35, 37, 38, 40, 42.
- Bab 7 tidak punya gambar.

**Ambang** (research/06 §6.2) — per kelompok acuan dan per format:
- CA (datumchart): ketat, SVG +/- 0,05 mm, PNG SSIM >= 0,995.
- CB1/CB2 (pustakachart): struktural bertoleransi; PNG hanya diagnosis.
- CC (TANPA-ACUAN): lint saja.
- BG (galeri benchmark): diagnosis, sasaran SSIM figur >= 0,90.
- DG (diagram): SSIM >= 0,99, +/- 0,1 mm.
- SY (simbol): SSIM >= 0,995, +/- 0,01 mm.
- DX (DOCX): teks 100 %, run >= 98 %.
- PD (PDF): halaman selisih 0, teks 100 %, SSIM rata-rata >= 0,99 dan minimum >= 0,97 (dikalibrasi ke lantai derau).
- HT (HTML): lint.

**Temuan untuk register** (detail di research/06 §7):
- F-S02-01: galeri Manual 000 bukan keluaran pustakachart di disk. Datanya beda dan pembangunnya tidak ditemukan. Teks S94 "data dari pustakachart_data.py" keliru.
- F-S02-02: panel P-11 manual tidak sama dengan keluaran datumchart.
- F-S02-03: font-size datumchart dalam px setara 4,5-5,25 pt, di bawah lantai 5,5 pt.
- F-S02-04: ramp heatmap pustakachart abu-abu, bertentangan dengan KT-08.

**Permintaan lintas pemilik** (dimediasi controller):
- S01/S03:
  - spec komposit galeri chart;
  - atribut peran tanda data;
  - entri drawn=false dengan alternatives[] dan kode galat render.
- S94: perbaiki sumber data galeri.
- S32: ukuran font fisik pt, plus opsi gaya threshold galeri.

**Belum dilakukan:** klaim di `file_claims.md` tidak ditambahkan. Agen ini tidak punya alat Edit aditif, dan menulis ulang berkas bersama itu melanggar aturan driver.
