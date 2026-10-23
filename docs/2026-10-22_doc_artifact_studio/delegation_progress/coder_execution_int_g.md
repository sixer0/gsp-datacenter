# INT-G coder-execution: IP-27 (ukuran PNG) + IP-05 bagian browser

Status: complete (2026-10-23). Skills: backend-execution, dry-run-verify-fix, diagnosing-bugs. Klaim: `INT-G src/lib/studio/engine/browser/**`.

Berkas: `src/lib/studio/engine/browser/index.ts` (rasterizeSvg ditulis ulang, `rasterGeometry`, `svgRootCssSize` baru), `runtime.ts` (StudioBrowserError subkelas StudioEngineError).

Diagnosis IP-27 (loop: SVG sama -> raster.py VENV lawan rasterizeSvg Node, baca IHDR):
- Node S25 dan RL `datum_render.py` sama: DSF 1, viewport = round(mm/25,4 x 300). raster.py S65 lain: DSF 300/96, viewport ceil(px CSS), klip px CSS pecahan; Chromium memotong klip ke px CSS bulat lalu menskalakan (128 mm = 483,78 -> 483 x 3,125 = 1509). Angka `widthPx` di ref_report S65 adalah rumus (1512), bukan PNG nyata (1509).
- Sebab kedua (runner): pembangun diagram memberi heightMm 233,36249999 (px CSS 881,99999, Chromium membulatkan ke 882 -> 2756), sedangkan root SVG "233.362mm" (881,998 -> 2753); acuan membaca atribut root.
Rumus baru (sama dengan acuan): css = ukuran root SVG absolut bila selisih dengan argumen <= 0,05 mm, selain itu mm x 96/25,4; DSF = dpi/96; viewport = ceil(css); klip {0,0,cssW,cssH} skala device; body margin 0, latar #FFFFFF, svg display:block di body. Cek pasca-render: toleransi 1 px CSS terhadap round(mm/25,4 x dpi). pHYs 300 tetap.

Cek data (SVG Node yang sama, cwd `C:\Users\TRIAL\AppData\Local\Temp\intg`):
- P-01 CA: ref 1509x578, Node 1509x578 (sebelum: 1512x581). compare.py png CA PASS, ssim 1.0, diff 0,001 %.
- dg_layered_good DG: ref 1959x2753, Node 1959x2753. DG PASS, ssim 1.0.
- iec:breaker SY: ref 281x281, Node 281x281 (sebelum 283). SY PASS, ssim 0,9996. Baseline lama SY: FAIL [size, pixelDiffPct].
- run_parity `--formats png`: diagram/dg_layered_good PASS (sebelum perbaikan root: FAIL size 2756/2753); chart/p01 size identik tetapi FAIL ssim 0,9723 / diff 0,979 % = beda isi SVG Node lawan datumchart Python (bukan raster). Runner simbol tidak jalan: media.ts baris lain sedang disunting (esbuild TransformError).

IP-05: LAUNCH_FAILED/RENDER_FAILED -> `BROWSER_UNAVAILABLE` (503), INPUT_INVALID -> `BY_CONSTRUCTION_FAILED` (422), timeout tetap RENDER_TIMEOUT (504); `details {reason, op}`. Bukti: path Chromium salah -> studioErrorFrom 503 BROWSER_UNAVAILABLE; masukan bukan SVG -> 422. Pesan 503 tidak memuat path server (path hanya di log). Warn "disconnected" hanya bila tak terduga.

Penjaga: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/engine/browser"` kosong (exit 1; 1 galat repo = media.ts(114) milik baris lain); `npx eslint src/lib/studio/engine/browser` exit 0.

Keputusan untuk controller: K1 membalik D-38 butir 1 (DSF 1 -> DSF 300/96 sesuai acuan); PNG produksi 0,1-0,8 % lebih kecil dari round(mm) (128 mm 1509 px = 299,4 dpi). Alternatif tidak dipilih: ubah raster.py S65 ke aturan RL (DSF 1, round) agar acuan = RL. K2 ukuran root SVG menang atas argumen dalam toleransi 0,05 mm.
Temuan: T1 DATUM-39 figure.ts (toleransi 1 %) bisa memicu warn untuk figur selebar < ~27 mm (kasus terburuk kehilangan 3,125 px; simbol 24 mm = 297,4 dpi, masih lolos tipis). T2 PNG acuan tanpa pHYs 300 (dibaca 96 dpi; bukan gerbang). T3 P-01 SSIM 0,9723 = isi chart (pemilik engine/chart). Review recommended: engine/browser.
