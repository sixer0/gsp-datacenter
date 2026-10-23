# S92 Layanan soffice (coder-execution, 2026-10-23)

Status: complete. Area: `src/lib/studio/engine/soffice/**` (5 berkas, klaim di `file_claims.md`).

## Berkas
- `index.ts` - ekspor kontrak I15 persis (`checkRenderEnvReadiness`, `convertDocxToPdf`) + aditif `sofficeQueueState`, `safeBaseName`, `resetReadinessCache`, `setSofficeLogSink`.
- `process.ts` - `runBounded` (spawn argumen array, `shell:false`, `windowsHide`, ekor 2 KB) + `killTree` (`taskkill /PID /T /F`, pola bridge.mjs:60-98).
- `readiness.ts` - manifest S91 (sha256, validasi bentuk), `--version` dgn profil sementara sendiri, fon: ada + sha256 + nama nilai di `reg.exe query HKCU\...\Fonts` (baca saja), cache C15, cek bersamaan berbagi satu janji.
- `service.ts` - semafor FIFO (C06, maks 2), profil `-env:UserInstallation=file:///<root>/tmp/<jobId>/lo-profile`, batas waktu C05 -> `RENDER_TIMEOUT`, validasi `%PDF-`, `tmp/<jobId>` dihapus di `finally`.
- `log.ts` - log JSONL terstruktur (timestamp, level, source, message, code, correlationId=jobId, stack_trace, context) ke `<STUDIO_WORKSPACE_ROOT>/logs/soffice/soffice-YYYY-MM-DD.jsonl` + console; sink dapat diganti S51.

## Bukti
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/engine/soffice"` -> kosong (exit 1). `npx eslint src/lib/studio/engine/soffice` -> exit 0.
- Smoke `npx tsx` (root uji di %TEMP% pendek, dihapus): READY true, versi 24.2.3.2, fon 22/22 ok; 3 job paralel -> antrean `{"active":2,"queued":1,"max":2}`, ketiganya PDF 1433 byte berawalan `%PDF-` (~4 s); timeout 300 ms -> `RENDER_TIMEOUT`, tanpa soffice.bin tersisa (tasklist); manifest tak ada -> `PDF_ENGINE_UNAVAILABLE`; jobId `../x`, `a/b`, kosong -> `PATH_OUTSIDE_ROOT`; bukan ZIP -> `PDF_CONVERT_FAILED`; `tmp/` kosong setelah job.

## Keputusan
1. Path soffice: `SOFFICE_PATH` eksplisit > `manifest.soffice.path` > C01. Fon relatif: folder manifest lalu akar repo (manifest S91 kini absolut).
2. jobId wajib `[A-Za-z0-9_-]{1,100}` (selain itu `PATH_OUTSIDE_ROOT`); jobId ganda yang sedang aktif -> `RENDER_IN_PROGRESS`; spawn gagal -> `PDF_ENGINE_UNAVAILABLE` + cache kesiapan direset; galat I/O lain -> `PDF_CONVERT_FAILED`.
3. Chromium dilaporkan (`chromium.found`) tetapi tidak memengaruhi `ready` (§8.4 tidak mencantumkannya).
4. Proses anak tanpa `cwd` job: direktori kerja Win32 dibatasi MAX_PATH (terbukti gagal ENOTCONN pada akar panjang); path dikirim absolut.

## Temuan / permintaan
- F: sink log durable default menulis `data/studio-workspace/logs/soffice/` (di luar tata letak §7.2 S52); S51 disarankan memanggil `setSofficeLogSink` ke tabel/log job. `data/` belum di `.gitignore` (milik S69).
- F: path workspace sangat panjang (> ~200 char) berisiko bagi profil LibreOffice; akar default repo aman.
- Tanpa permintaan lintas pemilik.
