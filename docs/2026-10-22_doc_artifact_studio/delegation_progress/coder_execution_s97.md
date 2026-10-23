# S97 coder-execution: runner benchmark (H07) tanpa DB

Status: complete (penjaga lulus; benchmark penuh TIDAK dijalankan, itu S98).

Berkas (semua baru, area eksklusif `benchmark/harness/run/**`):
- `run_benchmark.ts` (CLI H07: `--help`, `--dry-run`, `--json`, exit 0/1/2), `README.md`
- `lib/config.ts` (argumen, bawaan VENV/BM/indeks), `lib/inputs.ts` (muat + sha256 + substitusi figur), `lib/pipeline.ts` (ingest, figur, DOCX, PDF, bm_compare), `lib/report.ts` (run_summary.json + run_report.md), `lib/runlog.ts` (run_log.jsonl tahan lama)

Alur: doc.json + `loadResolvedProfileFile` (S49, memori) + indeks S94 (sha256 79/79 berkas) -> 15 blok `image` figur mesin (5 chart, 6 diagram, 4 symbolSheet) diganti blok S94 ber-spec, caption/sumber/kunci/format doc.json dipertahankan verbatim (C1) -> `ingestDocument` dryRun `enforcement:"report"` + `template` (D-55) -> byte aset ke snapshot sebagai dataBase64 (tanpa tulis workspace) -> SVG mesin -> PNG 300 dpi (`rasterizeSvg`) -> `assembleDocx` -> `checkRenderEnvReadiness`+`convertDocxToPdf` (S92, jobId = run-id) -> `VENV -I -B bm_compare.py` (argumen larik, cwd `<out>/compare`, batas waktu + taskkill /T /F) -> laporan per kriteria D-17, per halaman, per paragraf (BM1 diff), per figur 18 halaman besar, daftar NOT_READY.

Keputusan (perlu dicatat controller):
- K1: CLI S67 (H01) belum ada -> mesin dipanggil langsung lewat kontrak §8.2 (urutan = S51 tanpa Prisma). Bila S67 siap, runner tetap sah (tidak bergantung H01).
- K2: figur mesin yang gagal (stub/keluarga chart kosong/browser) memakai raster asli bertanda `FALLBACK_RASTER` agar DOCX tetap terbit (renderer S19 melempar bila figur hilang); `--figure-fallback none` untuk mode ketat; `--figures raster` = garis dasar diagnosis.
- K3: `StudioNotImplemented`, `StudioBrowserError`, `PDF_ENGINE_UNAVAILABLE`, env pembanding hilang -> NOT_READY; galat lain FAILED; tidak ada crash.
- K4: `--out` harus baru/kosong; bawaan `benchmark/out/bm-<UTC>-<acak>`; dry-run tidak menulis apa pun.

Bukti penjaga (2026-10-23):
- `npx tsc --noEmit -p tsconfig.json | grep benchmark/harness/run` -> kosong
- `npx eslint benchmark/harness/run` -> exit 0
- `npx tsx benchmark/harness/run/run_benchmark.ts --help` -> exit 0
- `--dry-run` -> exit 0: aset sha256 cocok 79/79; skema studio.doc/v1 sesudah substitusi valid (0 isu); 15/15 SUBSTITUTED; preflight VENV/bm_compare/BM.docx/BM.pdf/soffice/manifest/chromium ada; perkiraan NOT_READY chart bm-fig-18..21 (panel H-06..09, K-07..12, W-01/03..10, S-01..08, G-01..04 belum terisi saat dry-run); `benchmark/out` tidak dibuat.

Permintaan lintas pemilik: tidak ada (`.gitignore:71 /benchmark/out/` sudah ditambahkan S69).
Temuan: dispatchCoverage berubah selama run paralel (P-09..P-15 terisi di antara dua dry-run); perkiraan NOT_READY bersifat sesaat.
