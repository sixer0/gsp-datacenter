# S25 coder-execution: layanan browser (engine/browser, I14)

Status: complete (2026-10-23). Skills: backend-execution, dry-run-verify-fix.

Berkas (4, 1018 baris): `src/lib/studio/engine/browser/{index.ts 358, runtime.ts 293, measure.ts 279, png.ts 88}`.

Isi: tanda tangan kontrak §8.2 tetap (`getBrowser`, `rasterizeSvg`, `measureLayout`, `closeBrowser`); tambahan `previewHtml` (PNG per halaman), `setBrowserLogSink` (S51 menyambungkan log job durable), `StudioBrowserError`, `readPngSize`/`withPngDpi`, tipe `MeasuredLayout`/`MeasuredElement` (subtipe `LayoutMetrics`; kind page, document, overflow, clip, text, figure, svgText, image, table). `measureLayout` menerima argumen opsional kedua `MeasureOptions`.

Sandbox: executablePath `getStudioEnv().chromiumPath` (C03, cek ada sebelum launch), instans tunggal di globalThis + semafor 1 FIFO, context baru per operasi (`javaScriptEnabled:false`, `offline:true`, serviceWorkers block, acceptDownloads false), rute `**/*` abort, hanya `setContent`, batas waktu C07 per operasi (timeout -> context ditutup, `StudioEngineError RENDER_TIMEOUT`), `closeBrowser` menunggu semafor, idempoten.

Smoke nyata (tsx, scratchpad `s25_smoke.ts`, Chromium 151.0.7922.34):
- raster 128x40 mm -> 1512x472 px, 166x60 -> 1961x709, tanpa viewBox -> 1512x472; pHYs ada; dua render identik byte (deterministik); 3 panggilan paralel diserialkan, satu instans.
- measureLayout paged: pageCount 2 (elements), blocked 1, kinds page 2, overflow 5, clip 2, text 6, figure 1, svgText 1 (1,5 uu pada 128 mm = 4,25 pt), image 2, table 1; `<script>` tidak jalan; p 128 mm 10 pt = 6 baris, 76,8 karakter/baris.
- dokumen alir: pageCount 7 lewat PDF cetak. previewHtml paged 2 PNG 793x1122 (96 dpi); alir 150 dpi maxPages 2 -> truncated.
- timeoutMs 1 -> RENDER_TIMEOUT; operasi berikutnya sukses. Masukan salah -> INPUT_INVALID. `file://` gambar nyata tidak termuat (naturalWidth 0). Tidak ada proses chromium-1234 tersisa setelah close.

Penjaga: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/engine/browser"` -> kosong (exit 1); total repo 21 galat pra-ada di luar Studio. `npx eslint src/lib/studio/engine/browser` -> exit 0.

Keputusan:
1. Raster pakai DSF 1 + viewport = piksel target (DSF 300/96 membulatkan klip: probe 1509 vs 1512 px). SVG tanpa viewBox diberi viewBox dari width/height.
2. Skrip ukur ditulis sebagai string statis (`measure.ts`) agar helper transpiler (`__name` esbuild/tsx) tidak masuk ke halaman; argumen hanya angka JSON. Bukan eval masukan user.
3. Pratinjau memakai klip DSF; tepi bisa 1 px kurang (793 vs 794) karena pembulatan Chromium; diterima untuk pratinjau.
4. Tanpa sink, entri warn/error ditulis JSON satu baris ke stderr; persistensi durable lewat sink S51.

Permintaan (file_requests.md, tidak blocking): kode kontrak `BROWSER_UNAVAILABLE`; konvensi markup untuk S21/S22 (`.page`, `.body`, `.reg`, `data-address`, `data-figure`, aset data: URI).

Temuan: `<image href="http://...">` di SVG menghasilkan ikon gambar rusak di PNG (request diblokir, dicatat warn); S30/S32 wajib menanam aset sebagai data: URI. `next.config.ts serverExternalPackages` tetap milik S69.
