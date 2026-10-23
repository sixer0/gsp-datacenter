# FIX-C2 — catatan coder-execution (loop perbaikan siklus 3, D-296: H-06 + S-03)

Status: complete. Skills: diagnosing-bugs, dry-run-verify-fix. Klaim: `file_claims.md` prefiks FIX-C2. Tanggal: 2026-10-23. Tulis atomik (tmp lalu rename).

## Berkas (ubah)
- `src/lib/studio/engine/chart/family-h2/contour.ts` (H-06): `inlineLabel` tidak lagi membuang tingkat. Bila polyline terpanjang < `INLINE_MIN_GAPS` (3) x celah label, garis TIDAK diputus dan label cadangan dipasang di titik tengah busur dengan halo kertas (`stroke="#<paper>" stroke-width="0.6" paint-order="stroke"`, preseden `family-s2/radial.ts:180`), dijepit ke dalam bidang plot (busur pendek di sudut). Satu REPORT `H-06-LABEL` mendaftar tingkat beserta panjang garis vs batas. Jalur label sela normal tidak berubah. Acuan: PC `v71_contour` `ax.clabel(cs, ...)` melabel kedelapan tingkat (SR-48 `ref.svg` text_16..23) -> setiap tingkat yang tergambar berlabel.
- `src/lib/studio/engine/chart/family-s1/density.ts` (S-03): gaya datum mengikuti acuan PC `v53_density` `ax.set_xticks([]); ax.set_yticks([])` (`pustakachart.py:865`, dibaca saja): tanpa grup `data-axis` dan tanpa label tick x; domain x = rentang kurva (atau `chart.kind.S-03.axis` bila ada) sehingga kurva mengisi lebar plot; satuan tetap sebagai judul sumbu x. Gaya gallery tidak berubah (sumbu x bertick). S-02 (`v54_box`) dan S-04 (`v55_violin`) acuannya bertick -> tidak disentuh. Pembanding tidak diubah (D-296 (2)).

## Bukti
- Paritas chart penuh: `npx tsx scripts/parity/run/run_parity.ts --fixtures tests/parity/fixtures --out tests/parity/out/fixc2/main --only "chart/**" --formats svg,png` -> `{"DIAGNOSIS":42,"FAIL":4}` (SR-48: 40/6). H-06 SVG FAIL (`f.labels`) -> PASS; S-03 SVG FAIL (`c.axisCount`, `c.axisOrientation`) -> PASS (sumbu Node 0 = acuan 0; `c.zeroBaseline` lulus). 4 FAIL sisa = PNG CA P-01, P-02, P-11, W-02 (R5/N1, milik FIX-H, bukan mesin). Stdout: `tests/parity/out/fixc2/run_main_stdout.txt`.
- sha256 SVG Node fixc2 vs sr48: 46/46 dibandingkan, 44 identik, beda hanya `chart_h06` dan `chart_s03`. Verdik kode lain sama dengan SR-48.
- Snapshot langsung `renderChart` (skrip scratchpad, 97 baris: bm-fig-17..21 + semua fixture chart gaya datum dan gallery): sebelum vs sesudah beda hanya `fx-h06 datum` (`9df7b061…` -> `70306ff9…`, + REPORT `H-06-LABEL`) dan `fx-s03 datum` (`3baefdbd…` -> `3a34c085…`). bm-fig-17 `d4500e03…`, bm-fig-18 `e3921758…` (H-06 gallery), bm-fig-19 `94bf2858…`, bm-fig-20 `f826540b…`, bm-fig-21 `66d2dec0…` (S-03 gallery) SAMA.
- REPORT H-06: `garis kontur terlalu pendek untuk label sela pada tingkat -84 (10,4 mm < 3 x 5,5 mm), -42 (10,4 mm < 3 x 5,5 mm); label cadangan ...`. PNG Node diperiksa visual: -42 (di atas isian ink400) dan -84 terbaca dengan halo, di dalam bidang plot.
- DOCX v1 Manual 000 (`render_cli.ts --doc benchmark/manual000/doc.json --template benchmark/manual000/template.json --formats docx`): `53485ebc1eddd145ee6b67d8f2c68fbec040eae8b3c8ef6cf4e2f4f0c3969db6` (tetap).
- `npx vitest run tests/unit/studio/figures`: 8 berkas, 376/376 lulus.
- `npx tsc --noEmit -p .`: 0 galat. `npx eslint src/lib/studio/engine/chart/family-h2/contour.ts src/lib/studio/engine/chart/family-s1/`: exit 0.

## Keputusan / catatan
- S-03 tanpa tick hanya untuk gaya datum (gaya acuan PC). Gallery mengikuti panel galeri (bukan skrip Python) dan dipakai bm-fig-21 -> dibiarkan bertick agar konten benchmark tidak berubah.
- ~~S-03 datum tanpa garis dasar~~ DITOLAK oleh D-300. Lihat bagian "Lanjutan D-300".
- Gaya gallery H-06 tidak berlabel (panel Gambar 8.2), jadi tidak terdampak.

## Lanjutan D-300 (spine S-03)
- `density.ts` gaya datum kini menggambar spine kiri dan spine bawah (garis dasar) tanpa tick, seperti acuan `patch_3`/`patch_4` (ink400 #6B7783, 0,6 pt = 0,21167 mm). Spine digambar di atas isian dan di bawah kurva. Masing-masing berada dalam grup `data-axis="y|x" data-spine="1"` tanpa teks tick, sebagai pengait FIX-H. Geometri: kiri x=1, y 4,40..50,00; bawah y=50,00, x 1..127 (kanvas 128 x 54).
- Bukti: snapshot `renderChart` 97 baris lawan garis dasar. Beda hanya `fx-h06 datum` (`70306ff9…`) dan `fx-s03 datum` (`9573bb7e…`). bm-fig-17..21 sha tetap. vitest figures 376/376. tsc 0. eslint area exit 0.
- Paritas `--only "chart/s03"` (`tests/parity/out/fixc2/s03_spine`): FAIL `c.axisCount`/`c.axisOrientation` (Node 2 grup ticks 0, acuan 0). Ini memang diharapkan sampai FIX-H membuat pembanding memperlakukan spine tanpa tick secara simetris (D-300). Mesin tidak disesuaikan dengan heuristik pembanding. Hasil H-06 PASS dan run penuh `fixc2/main` untuk kode lain tetap berlaku.

Review direkomendasikan (lingkup: `contour.ts` label cadangan, `density.ts` cabang datum).
