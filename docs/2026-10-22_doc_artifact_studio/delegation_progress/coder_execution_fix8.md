# FIX-8 coder-execution: keamanan runtime (M-01, L-03, M8, M9, L13), 2026-10-23

Status: complete. Skills: backend-execution, dry-run-verify-fix. Klaim: `file_claims.md` prefiks FIX-8.
Laporan baris: `implementation/fix8_runtime_security.md`. Path kerja: `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/fix8/`.

## Perubahan
- M-01 `engine/browser/runtime.ts`: `chromiumSandbox: true` + `ignoreDefaultArgs: ["--no-sandbox"]`; penjaga `assertSandboxedArgs` (tolak `--no-sandbox`, `--disable-gpu-sandbox`, `--single-process`, `--disable-features=*sandbox*`, dll.); bukti sandbox `verifySandbox`: instans probe berumur pendek (opsi identik) membuka `chrome://sandbox`, `judgeSandboxRows` mensyaratkan semua Renderer = Lockdown; gagal = `StudioBrowserError` reason `SANDBOX_UNAVAILABLE` -> `BROWSER_UNAVAILABLE` (503), instans ditutup, tanpa fallback. Instans render diluncurkan bersih SETELAH probe (probe di instans render menggeser 1 tingkat warna pada 104 piksel PNG G-02; diukur, lihat laporan). Jaringan diblokir, JS mati, `setContent` saja: tidak berubah.
- L13 browser: pesan `RENDER_FAILED` tidak lagi memuat pesan mentah Playwright (rincian tetap di log).
- L-03: modul bersama `engine/soffice/readiness-rules.mjs` (`systemBinary`, `regExePath`, `taskkillExePath`, `powershellExePath` = `%SystemRoot%\System32\...`, SystemRoot non-absolut diabaikan). Dipakai `soffice/process.ts` (taskkill), `soffice/readiness.ts` (reg, powershell), `render-env/lib.mjs` (taskkill, reg, powershell). Semua `shell: false`, argumen array.
- M8: SATU definisi siap = `evaluateReadiness` di `readiness-rules.mjs` (+ `readiness-rules.d.mts`), dipakai layanan dan `render-env/check_readiness.mjs`. Layanan kini juga mensyaratkan data HKCU MENUNJUK berkas (D-36) dan keluarga GDI termuat di sesi (D-35/F2); `--skip-session` skrip = selalu tidak siap (exit 3). Pengurai registri/nama fon/sesi juga dari modul itu.
- L13 soffice: `errors` kesiapan tanpa path absolut (basename saja), path lengkap ke `details` log; `soffice could not be started (<errno>)`; ekor stderr di `details` lewat `redactServerPaths`.
- M9 `.gitignore`: `/render-env/semibold-bundle/out/` dan `/render-env/semibold-bundle/fonts/` (berkas tetap di disk).
- README render-env diperbarui.

## Bukti singkat
- Probe beku (HTML benchmark 9,95 MB + chart G-02, chart P-01, diagram layered; `probe.ts`): 8/8 sha256 sesudah = sebelum, 2 run (`before/sums.txt` = `after/sums.txt` = `after2/sums.txt`).
- Proses Chromium saat halaman aktif: 13 proses (termasuk 2 renderer), 0 `--no-sandbox` (sebelum: 8 kemunculan).
- Instans `chromiumSandbox:false` -> `verifySandbox` menolak `BROWSER_UNAVAILABLE/SANDBOX_UNAVAILABLE`; `true` -> lolos.
- `npx vitest run browser-chromium + soffice-render-env`: 21/21 (smoke PDF jalan, 4,8 s). Seluruh `tests/unit/studio/renderers`: 135/137, 2 gagal di luar area (docx-determinism, html-css-csp: engine docx/html sedang diubah RT-01).
- `npx tsc --noEmit -p tsconfig.json` exit 0; `npx eslint` browser+soffice+render-env exit 0; `node render-env/check_readiness.mjs` exit 0 (ready=true, 22/22 terdaftar).

## Lanjutan: M-03 antrean berbatas (mediasi controller), 2026-10-23
- `engine/soffice/service.ts`: semafor berbatas panjang (`STUDIO_SOFFICE_MAX_QUEUED`, bawaan 4) dan lama tunggu (`STUDIO_SOFFICE_QUEUE_WAIT_MS`, bawaan 2 x timeout); penuh/kelamaan -> `RENDER_QUEUE_FULL` (kode kontrak FIX-1 yang sudah ada, 503) + `details.retryAfterSec` (`STUDIO_RENDER_QUEUE_RETRY_AFTER_SEC`, bawaan 30), soffice tidak dijalankan; penunggu kedaluwarsa dikeluarkan dari antrean. Ekspor `sofficeQueueLimits`, `sofficeQueueState.maxQueued`.
- `engine/browser/runtime.ts` `withLock`: batas penunggu (`STUDIO_CHROMIUM_MAX_QUEUED`, bawaan 16) dan lama tunggu (`STUDIO_CHROMIUM_QUEUE_WAIT_MS`, bawaan 120 s) -> `RENDER_QUEUE_FULL`; giliran penunggu kedaluwarsa tetap dilepas (rantai tidak macet); `shutdownBrowser` tidak dibatasi. Ekspor `browserQueueLimits`, `browserQueueState`.
- Rate limit per pemanggil tetap milik FIX-1 (`services/render/admission.ts`); batas engine ini lapisan kedua. Tidak ada permintaan `file_requests.md` (kode sudah ada).
- Uji beban (`fix8/load_test.ts`) sempat dijalankan sekali sebelum instruksi user "tahan semua pengujian": Chromium 4 diterima/5 ditolak `queue_full` dalam 0-2 ms, `wait_timeout` 506 ms, antrean lanjut; soffice 3 diterima/5 ditolak `queue_full` (356 ms = cek kesiapan bersama, bukan menunggu slot), `wait_timeout` 1005 ms, antrean kosong di akhir. Daftar proses sesudah: 6 chrome sementara yang hilang pada kueri berikut, tanpa soffice. Pengujian dihentikan sesuai instruksi.
- Bukti akhir sesuai instruksi: `npx tsc --noEmit -p tsconfig.json` exit 0; `npx eslint src/lib/studio/engine/browser src/lib/studio/engine/soffice render-env` exit 0.
