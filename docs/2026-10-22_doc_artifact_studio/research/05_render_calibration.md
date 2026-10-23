# Kalibrasi lingkungan render terhadap benchmark (controller, 2026-10-22)

Tujuan: sebelum kode ditulis, buktikan mesin ini mampu mereproduksi PDF acuan benchmark (D-12/D-13)
dari DOCX acuannya sendiri. Bila DOCX asli pun tidak bisa direproduksi, keluaran aplikasi juga tidak.

## Acuan

| Butir | Nilai | Bukti |
|---|---|---|
| PDF acuan | `workspace\Manual DATUM GSP\Manual_Komprehensif_DATUM_GSP_000-GSP-STD-X-2026_RevA.pdf`, 102 hlm, 210 x 297 mm | pymupdf `page_count`, `rect` |
| Pembuat PDF acuan | `LibreOffice 24.2 Writer` (metadata producer) | pymupdf `metadata` |
| DOCX acuan | 29 seksi Word, 151 tabel, 52 penempatan gambar (27 media), 748 paragraf, semua gaya `Normal` (format langsung), 18 fon tertanam `word/fonts/*.odttf` | `scripts/inventory.py`, `zipfile` |
| Fon diminta DOCX (`w:ascii`) | IBM Plex Serif 2.694 · IBM Plex Mono 1.590 · IBM Plex Sans Cond 1.161 · DejaVu Sans 104 · Courier 4 · Symbol 4 | regex atas `word/*.xml` |

## Lingkungan yang dipasang

- LibreOffice **24.2.3.2** via winget (`TheDocumentFoundation.LibreOffice`), `C:\Program Files\LibreOffice\program\soffice.com`. Folder fon LibreOffice tidak dapat ditulis tanpa admin.
- Fon per-user ditambahkan dari `hermes\profiles\gspuser02\skills\datum-revl\assets\fonts` (IBM Plex 16 TTF + DejaVuSans) dan `Inter-Regular.ttf` (salinan dari `code\worldmonitor\blog-site\scripts\fonts\inter-regular.ttf`, lisensi OFL), terdaftar di `HKCU\...\Fonts` dengan path absolut. Fon per-user baru baru aktif setelah logon; untuk sesi ini dimuat lewat `AddFontResourceW` + `WM_FONTCHANGE`.
- Insiden kecil yang sudah diperbaiki: skrip pendaftaran pertama memberi semua fon baru satu label registri yang sama (`DejaVu Sans Book (TrueType)`); dikoreksi menjadi label unik per file dan entri DejaVu dikembalikan ke `DejaVuSans.ttf`.

## Hasil (DOCX acuan → `soffice --headless --convert-to pdf` → bandingkan ke PDF acuan)

Pembanding: `C:\Users\TRIAL\AppData\Local\Temp\hq_v21_clone\scripts\calib_compare.py` (teks per halaman dinormalisasi spasi; SSIM 7x7 pada render abu-abu 72 dpi).

| Konfigurasi | Halaman | Teks per halaman identik | SSIM rata-rata | Halaman SSIM >= 0,98 |
|---|---|---|---|---|
| A. Sebelum fon dimuat ke sesi | 103 | 8 / 102 | 0,8900 | 19 |
| **B. Fon per-user dimuat ke sesi (konfigurasi aktif)** | **102** | **101 / 102** | **0,9815** | **88** |
| C. B tanpa wajah Bold lama (uji) | 102 | 98 / 102 | 0,9706 | 72 |

Sisa selisih konfigurasi B:
- PDF acuan menanam `IBMPlexSansCond-SemiBold`, `IBMPlexMono-SemiBold`, `IBMPlexSerif-SemiBold`; render lokal menanam varian **Bold**. Pembuat acuan memetakan permintaan tebal ke SemiBold (perilaku khas fontconfig Linux saat bobot 700 tidak ada). Di Windows/GDI, menghapus Bold justru memicu tebal sintetis (konfigurasi C) — jadi solusinya bukan menghapus Bold.
- `Inter-Regular` di acuan tidak muncul di render lokal; `OpenSymbol` dan `SegoeUI` muncul sebagai pengganti glif tertentu.
- Halaman dengan SSIM rendah di B: 92 (0,534), 93 (0,550), 91 (0,903) — teks identik, selisih visual (kemungkinan gambar/glif); halaman 18 satu-satunya yang teksnya berbeda.

## Implikasi untuk blueprint (diteruskan ke task-architect)

1. Perlu baris **lingkungan render terkunci**: bundel fon render khusus (fontTools 4.63.0 tersedia) di mana wajah SemiBold Plex dipetakan sebagai gaya tebal keluarga yang diminta DOCX (`IBM Plex Sans Cond`, `IBM Plex Mono`, `IBM Plex Serif`), plus Inter; dimuat oleh worker render (bukan bergantung pada fon sesi user). Target kalibrasi: DOCX acuan → PDF lokal mencapai 102/102 teks identik dan SSIM >= 0,98 di setiap halaman SEBELUM keluaran aplikasi dinilai.
2. Ambang D-13(4) (SSIM >= 0,98 per halaman) hanya bermakna setelah butir 1; kalibrasi B menjadi garis dasar lingkungan.
3. Fon sesi kembali ke konfigurasi B (Bold dimuat ulang). Setelah logon ulang, fon per-user dimuat otomatis oleh Windows.
