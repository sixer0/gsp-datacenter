# S96 coder-execution: harness pembanding benchmark D-17 (H06)

- Status: complete. Skill: dry-run-verify-fix (1 siklus, 0 perbaikan gagal).
- Berkas (area eksklusif `benchmark/harness/compare/`): `bm_compare.py` (CLI H06), `docx_units.py` (unit teks + hitungan DOCX), `pdf_pages.py` (teks/raster/SSIM per halaman dan per figur), `ssim_seam.py` (impor SSIM S66 + fallback CAL lokal), `report_md.py` (laporan MD), `README.md`.
- Klaim: `file_claims.md` baris S96 (glob + 7 path persis).
- Metode: BM1 = LCS eksak (bit-parallel, diuji 2000 kasus acak vs DP: 0 selisih) atas unit (paragraf badan, sel tabel, caption, baris SUMBER/PROVENANS), pct = LCS / max(unit acuan, unit keluaran); diff per unit dari difflib + konteks. BM2 = toleransi floor(2 % acuan): halaman +/-2, bab 0, lampiran 0, tabel +/-3, gambar +/-1. BM3 = teks halaman ternormalisasi CAL, of = max halaman. BM4 = SSIM CAL, halaman hilang = 0; per figur = bbox gambar >= 20 pt di halaman acuan (diagnosis).
- SSIM: diimpor dari S66 `scripts/parity/compare/ssim_cal.py:ssim_cal` (lolos probe kesetaraan CAL 1e-9); fallback lokal tetap ada.
- Hitungan BM.docx terukur: bab 17, lampiran 4, tabel 151 (+2 bersarang), gambar 52, unit 4544 (sel 4055, paragraf 350, caption 115, sumber 24) — cocok research/07.

## Bukti penjaga
- `VENV -I -B -m py_compile benchmark/harness/compare/*.py` -> OK; `bm_compare.py --help` -> exit 0.
- BM vs BM: `verdict PASS | BM1 PASS 100.0% | BM2 PASS | BM3 PASS 102/102 | BM4 PASS ssimMean 1.0`, exit 0.
- bench.docx/bench.pdf (lo_calib) vs BM: `verdict FAIL | BM1 PASS 100.0% | BM2 PASS | BM3 FAIL 98/102 | BM4 PASS ssimMean 0.970602`, exit 1; halaman teks beda 18, 53, 54, 55. Identik dengan CAL langsung (`pages text identical: 98 / 102`, `SSIM ... mean 0.9706`).
- Mode parsial (`--pdf` saja) -> BM1/BM2 NOT-RUN, exit 1; berkas hilang -> exit 2 + `bm_error.json`.
- md5 BM.docx/BM.pdf sebelum dan sesudah: OK (read-only).

## Keputusan (untuk dicatat controller)
1. BM1 penyebut = max(unit acuan, unit keluaran) agar unit tambahan ikut menurunkan skor (lebih ketat dari "per unit acuan").
2. BM3/BM4 penyebut = max(jumlah halaman); halaman hilang = teks beda dan SSIM 0.
3. `--docx`/`--pdf` opsional (mode parsial, vonis INCOMPLETE/FAIL, exit 1) — tambahan atas §11 untuk kalibrasi PDF saja.
4. Galat input/internal: exit 2 (dalam kosakata §11) + `bm_error.json` di folder `--out`.

## Temuan
- F (info): bench.pdf lo_calib gagal BM3 (98/102) — lingkungan render, bukan harness; sejalan research/05 (kalibrasi terkunci dibutuhkan sebelum S98).
- Permintaan lintas pemilik: tidak ada.
