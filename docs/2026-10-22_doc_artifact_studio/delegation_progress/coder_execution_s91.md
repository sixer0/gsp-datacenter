# S91 coder-execution: kunci lingkungan render (konfigurasi B)

Status: complete. Skills: dry-run-verify-fix. Klaim: baris `S91 ...` di file_claims.md (nama skrip dikoreksi ke snake_case, §8.4).

Berkas (render-env/): `manifest.json`, `check_readiness.mjs`, `calibrate.mjs`, `build_manifest.mjs`, `compare_cal.py`, `lib.mjs`, `README.md`; artefak run `out/bm_config_b.pdf` (5,5 MB), `out/calibration.json`.

Manifest: schema studio.render-env/v1, config B; soffice `C:\Program Files\LibreOffice\program\soffice.com` 24.2.3.2 (`--version`: "LibreOffice 24.2.3.2 433d9c2..."); chromium 1234 / 151.0.7922.34; 22 fon per-user (sha256 + nama nilai HKCU, semua required); calibration {pages 102, textIdenticalPages 101, ssimMean 0.98150, pagesSsimGe098 88}.

Kalibrasi ulang (`node render-env/calibrate.mjs`, exit 0, konversi 8,5 s, profil sementara + timeout + taskkill /T /F): halaman ref=102 lokal=102, teks identik 101/102 (beda hlm 18), SSIM rata 0,9815, min 0,5341, 88 hlm >= 0,98. Target S91 lulus, sama dengan research/05 dan S66.

Cek kesiapan (`node render-env/check_readiness.mjs`, exit 0): ready true, soffice found/versionOk, chromium found, 22/22 fon fileExists+sha256Ok+registered, errors []. Uji negatif (manifest salinan di Temp): sha diubah, nama HKCU salah, soffice hilang, fon tak termuat di sesi (KaTeX_AMS) -> exit 3 dengan pesan; manifest hilang -> 3; argumen salah -> 2. HKCU sebelum/sesudah: hash `reg query` identik. Profil default LibreOffice (`%APPDATA%\LibreOffice`) tetap tidak ada.

Penjaga: `npx eslint render-env` exit 0, 0 masalah; `node --check` 4 .mjs lulus; `VENV -I -B -m py_compile compare_cal.py` lulus; `compare_cal.py --help` exit 0; tsc: tidak ada berkas .ts di area (grep render-env kosong).

Keputusan (dicatat controller):
- K1 Manifest memuat 22 fon: 16 Plex + DejaVuSans + Inter + 4 wajah Bold lama (Mono-Bold, Serif-Bold, Serif-BoldItalic, SansCondensed-Bold), karena konfigurasi B bergantung pada Bold (tanpanya = konfigurasi C, research/05:33).
- K2 `family`/`style` manifest = nama tipografis (nameID 16/17, jatuh ke 1/2); cek sesi memakai keluarga GDI nameID 1 yang dibaca dari berkas (dipotong 31 karakter), tanpa menambah field kontrak.
- K3 Chromium hanya dilaporkan; `ready` mengikuti §8.4 (soffice + fon). Kegagalan fon tak termuat di sesi masuk `errors[]` (tanpa field baru).
- K4 Data HKCU berupa nama berkas saja (entri Bold lama, Serif Regular/Italic, Mono Regular, Sans SemiBold, SansCond Regular) diterima bila sama dengan basename.

Temuan:
- F1 Lima fon terpasang BERBEDA hash dari `datum-revl/assets/fonts` (IBMPlexSans-Regular, IBMPlexSerif-Regular, -Italic, -SemiBold, -SemiBoldItalic); research/05 menyebut sumbernya datum-revl. Manifest mengunci berkas terpasang (yang diukur konfigurasi B). Relevan untuk S99/reproduksi di mesin lain.
- F2 Nilai HKCU berupa nama berkas saja (bukan path absolut) menunjuk berkas di folder fon per-user; tidak ada di C:\Windows\Fonts. Saat ini termuat di sesi; belum dibuktikan bertahan setelah logon ulang (hipotesis: Windows menyelesaikannya; bila tidak, cek kesiapan akan gagal dengan pesan jelas).
- F3 `OpenSymbol` terpasang sistem (keluarga GDI ada di sesi).

Permintaan lintas pemilik: `.gitignore` tambah `render-env/out/` (file_requests.md, tidak blocking).
Review recommended (S83, S87): render-env/**.
