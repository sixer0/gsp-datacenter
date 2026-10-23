# render-env (S91): lingkungan render terkunci, konfigurasi B

Mengunci konfigurasi B dari `docs/2026-10-22_doc_artifact_studio/research/05_render_calibration.md`
secara reproducible. Kontrak: `01_specs.md` §8.4, tipe `src/lib/studio/contract/render-env.ts`.
Subfolder `semibold-bundle/` milik S99, bukan bagian dari berkas di sini; keluarannya (`out/`, `fonts/`)
di-gitignore karena dapat dibangun ulang (`build_bundle.py`, `calibrate_bundle.mjs`).

| Berkas | Fungsi |
|---|---|
| `manifest.json` | `RenderEnvManifest`: soffice 24.2.3.2, Chromium 1234, 22 fon per-user (path, sha256, nama nilai HKCU), angka kalibrasi |
| `check_readiness.mjs` | Cek kesiapan, hanya membaca. JSON `RenderEnvReadiness` di stdout; exit 0 siap, 3 tidak siap, 2 salah pakai |
| `calibrate.mjs` | BM.docx -> soffice (profil sementara, batas waktu, tree-kill) -> `out/bm_config_b.pdf` -> `out/calibration.json` |
| `compare_cal.py` | Pembanding metode CAL; mengimpor `scripts/parity/compare/ssim_cal.py` (S66), tidak menyalin |
| `build_manifest.mjs` | Menyusun ulang `manifest.json` dari lingkungan terpasang + `out/calibration.json` |
| `lib.mjs` | Fungsi bersama: sha256, `reg.exe query`, nama fon dari tabel `name`, enumerasi keluarga fon sesi |

## Pemakaian

```
node render-env/check_readiness.mjs [--manifest <path>] [--skip-session]
node render-env/calibrate.mjs [--docx <BM.docx>] [--ref-pdf <BM.pdf>] [--timeout-ms 300000]
node render-env/build_manifest.mjs [--calibration render-env/out/calibration.json]
```

Variabel opsional: `SOFFICE_PATH`, `STUDIO_CHROMIUM_PATH`, `STUDIO_RENDER_ENV_PYTHON` (default venv hermes; dijalankan `-I -B`).

## Isi cek kesiapan

Definisi "siap" ada di satu modul, `src/lib/studio/engine/soffice/readiness-rules.mjs` (`evaluateReadiness`),
yang dipakai skrip ini DAN layanan `engine/soffice` (route R11, gerbang konversi PDF). Keduanya hanya
mengumpulkan fakta; penilaiannya sama (FIX-8, temuan M8).

1. Manifest sah (skema `studio.render-env/v1`, `soffice.version` = `24.2.3.2`); `soffice.com` ada dan `--version`
   memuat `24.2.3.2`.
2. Setiap fon `required`: berkas ada, sha256 cocok, nilai HKCU bernama `hkcuValueName` (tanpa beda huruf besar/kecil,
   REG_SZ/REG_EXPAND_SZ) menunjuk berkas itu (data absolut dibandingkan utuh; nama berkas saja dibandingkan ke basename).
3. Keluarga GDI fon (nameID 1, dipotong 31 karakter) muncul di enumerasi `InstalledFontCollection` sesi.
   `--skip-session` melewati enumerasi untuk diagnosis cepat, tetapi hasilnya selalu `ready=false` (exit 3).
4. Chromium hanya dilaporkan (`chromium.found`); kesiapan PDF tidak bergantung padanya.

`errors` tidak memuat path absolut (berkas disebut lewat basename; bisa sampai ke API). Path lengkap dicetak
skrip sebagai baris `rincian:` di stderr dan dicatat layanan di log soffice.
Biner sistem (`reg.exe`, `taskkill.exe`, `powershell.exe`) dipanggil dengan path absolut `%SystemRoot%\System32\...`,
tanpa shell (L-03).

Larangan yang ditaati semua skrip: tidak menulis HKCU, tidak memuat fon, tidak memakai profil default LibreOffice.
Bila fon belum termuat di sesi, logon ulang (Windows memuat fon per-user saat logon); skrip tidak memperbaikinya.

## Fon

16 Plex dari `datum-revl/assets/fonts`, `DejaVuSans.ttf`, `Inter-Regular.ttf`, ditambah empat wajah Bold lama
(`IBMPlexMono-Bold`, `IBMPlexSerif-Bold`, `IBMPlexSerif-BoldItalic`, `IBMPlexSansCondensed-Bold`) yang menjadi
bagian konfigurasi B (tanpanya = konfigurasi C). Hash di manifest adalah hash berkas TERPASANG; lima berkas
terpasang berbeda dari berkas di `datum-revl/assets/fonts` (IBMPlexSans-Regular, IBMPlexSerif-Regular, -Italic,
-SemiBold, -SemiBoldItalic), dan konfigurasi B diukur dengan berkas terpasang itu.
