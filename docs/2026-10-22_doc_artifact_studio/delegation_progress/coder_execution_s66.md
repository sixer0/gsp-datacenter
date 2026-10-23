# S66 coder-execution: pembanding paritas Python (H04)

Status: complete. Skills: dry-run-verify-fix. Klaim: `S66 scripts/parity/compare/**` (file_claims.md).

Berkas (scripts/parity/compare/): `compare.py` (CLI H04), `ssim_cal.py` (SSIM CAL, antarmuka S96), `compare_pdf.py`, `compare_docx.py`, `compare_svg.py`, `svgnorm.py`, `compare_png.py`, `thresholds.py`, `common.py`, `__init__.py`.

Antarmuka S96: `sys.path.insert(0, <repo>/scripts/parity/compare)` lalu `from ssim_cal import ssim_pages, ssim_cal, page_gray, norm_text, compare_pdf_pages` (atau `from scripts.parity.compare.ssim_cal import ssim_pages` dengan akar repo di sys.path). `page_gray(page, dpi, clip=)` untuk SSIM per figur.

Penjaga: `VENV -I -B -m py_compile` 10 berkas lulus; `compare.py --help` exit 0; argumen kurang/kombinasi format-kelas salah/kunci ambang tak dikenal/berkas rusak = exit 2.

Kesetaraan port CAL: SSIM per halaman port lawan fungsi CAL atas pasangan yang sama, 102 halaman, max |selisih| = 0.0 (bit-identik).
- BM.pdf lawan `lo_calib\bench.pdf` (ada di disk): 102/102 hlm, teks 98/102, SSIM rata 0,9706, min 0,5788, 72 hlm >= 0,98 = angka konfigurasi C research/05, bukan B (CAL asli memberi angka sama atas berkas itu).
- BM.pdf lawan konversi segar BM.docx (soffice 24.2.3.2, profil sementara, timeout+taskkill /T): 102 hlm, teks 101/102, SSIM rata 0,9815, min 0,5341, 88 hlm >= 0,98 = konfigurasi B persis.
- Lantai derau N3 (BM.docx dikonversi dua kali): teks 102/102, SSIM rata 1,0, min 1,0 -> lantai >= 0,999, ambang PD tetap 0,99/0,97.

Uji asap (masukan nyata, keluaran di Temp\s66nf): DX BM.docx lawan dirinya/bench.docx PASS (4618 unit teks, 151+2 tabel bersarang, 52 gambar, 29 sectPr, 5296 run); mutasi 1 teks + 3 tebal -> FAIL textOrder, runProps 99,94 %. SVG CA datumchart threshold/column lawan varian Node sintetis (mm, data-mark, data-axis, pt fisik) PASS; DC lawan dirinya FAIL e.fontMinPt/e.fontSet (px fisik 4,7-5,1 pt, N1 bekerja). CB1 matplotlib bar: 4 tanda, 2 sumbu, nol OK. DG good_sld PASS; dasharray dimutasi FAIL. SY iec:breaker PASS. CC snapshot beda FAIL. PNG CA diri PASS; DG hlm 92 FAIL (SSIM 0,7459); HT/CB1 DIAGNOSIS.

Keputusan (perlu dicatat controller):
- K1 SSIM = port numpy CAL, bukan skimage (skimage: langkah 1 px, kovarians sampel, potong tepi -> tidak setara).
- K2 Tambahan CLI opsional `--threshold KUNCI=NILAI` (berulang) untuk kalibrasi ulang N3/tinggi CB1; tanpanya perilaku = §11 persis. Laporan tetap 6 kunci teratas; `metrics.checks` + `metrics.inputs` ditambahkan di dalam metrics. Berkas tak terbaca -> exit 2 + `<out>.error.json` berstruktur.
- K3 Kombinasi sah: docx=DX, pdf=PD, svg=CA/CB1/CB2/CC/DG/SY, png=CA/CB1/CB2/CC/DG/SY/HT. CC/HT: --ref = snapshot beku. PNG CB/CC/HT = DIAGNOSIS.
- K4 Klasifikasi tanda acuan tanpa `data-mark`: matplotlib berbasis id grup (HIPOTESIS, dilabeli di laporan) dan rect non-latar untuk datumchart. Nama fon PDF tanpa awalan subset. Gaya tabel/XOR toggle tidak dimodelkan pada run props. Batas maks warna DG tidak menghitung PAPER/putih.

Temuan: F1 `lo_calib\bench.pdf` bukan render konfigurasi B (cocok C); kalibrasi B tereproduksi dari konversi segar. F2 Klasifikasi matplotlib perlu dikonfirmasi pada SVG acuan S65 nyata. F3 CB1 tinggi +/-3 mm butuh `tinggi_mm` registri: berikan via `--threshold expectHeightMm=<n>` (S67).
Permintaan lintas pemilik: tidak ada. Review recommended (S86): scripts/parity/compare/**.
