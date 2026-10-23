# S13 coder-execution: salin aset acuan (G1a)

Status: complete

Area: src/lib/studio/assets/** (fonts/, base/, logo/, manifest.json). Sumber read-only, tidak diubah.

Angka: 25 berkas disalin (17 ttf RL: 16 IBM Plex + DejaVuSans; 1 Inter-Regular.ttf; 1 PASANG-DULU.txt; 1 base/default.docx; 5 logo png). Manifest: 25 entri, field count = 25.

Bukti: skrip scratchpad s13_copy.mjs (salin + manifest) dan s13_verify.mjs (hash ulang sumber, salinan, manifest; ukuran; hitung berkas disk vs entri). Hasil: 25 OK, mismatch 0, berkas disk 25 = entri 25.

Keputusan: D-22 KT-15 (a) salin ke repo. PASANG-DULU.txt ikut disalin (kind "note") sebagai satu-satunya pernyataan lisensi di sumber.

Temuan:
- Sumber RL fonts TIDAK memuat berkas lisensi OFL (hanya PASANG-DULU.txt yang menyebut SIL OFL). Berkas OFL.txt tidak dikarang. Lisensi lengkap perlu disertakan terpisah bila distribusi dibutuhkan.
- DejaVuSans.ttf: brief menyebut OFL, tetapi DejaVu berlisensi turunan Bitstream Vera (bebas pakai/salin, bukan SIL OFL). Dicatat apa adanya di manifest.
- Lisensi logo dicatat "milik GSP/DATUM (internal)" (asumsi, tidak ada berkas lisensi di sumber).
- Media raster Manual 000 bukan area S13 (milik S94).

Permintaan lintas pemilik: tidak ada.
