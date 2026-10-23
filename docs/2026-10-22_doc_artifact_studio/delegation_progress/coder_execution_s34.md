# S34 coder-execution — engine/chart/family-p2 (I24)

Status: complete (2026-10-23). Area: `src/lib/studio/engine/chart/family-p2/**` (8 berkas, 1553 baris: index, common, bullet, waterfall, small-multiples, quadrant, arrow, table).

## Isi
- `chartFamilyP2` = P-09, P-10, P-12, P-13, P-14, P-15 (registrasi lewat peta kontrak yang disebar `CHART_RENDERERS`; dispatch melaporkan keenamnya `function`). Impor hanya berkas helper core (svg, palette, scale, guards, apparatus, prepare), tanpa core/index/dispatch.
- Gaya `datum` = port pustakachart (v95_bullet, v91_waterfall, v13_small_multiples, v72_quadrant, v15_table; P-14 tanpa acuan); gaya `gallery` = panel Gambar 8.1 (diperiksa visual terhadap image7 PNG).
- Parameter registri dibaca (`chart.kind.<KODE>.*`; nama pendek di spec = alias), petunjuk data per kode (P-09 target/targets/max/belowTargetColour, P-12 grid, P-13 axis/divider, P-14 axis/accentCategory, P-15 colourRule/tableRows/tableHead) dibaca; kunci lain REPORT `PARAM_IGNORED` (D-58). Aksen: medan `accent` + alias params; maks `chart.accent.maxSubjects`.
- Font pt fisik dijepit `chart.minFontPt`; garis >= 0,18 mm; tanpa acak/waktu.

## Keputusan / deviasi
1. P-10 naik = verd (PC: SIGNAL) dan P-12 titik ujung warna garis tanpa data-mark (PC: SIGNAL x6) agar aksen tetap 1 subjek.
2. P-09 tick target = garis acuan tanpa data-mark (`data-target`), seperti garis batas P-11. `targetLine` tanpa target = BY_CONSTRUCTION_FAILED.
3. P-13 subjek aksen dihitung per grup/kuadran (galeri: 2 titik "kejar" = 1 subjek); pembagi eksplisit tanpa `dividerJustification` = REPORT, median = alasan bawaan.
4. P-15 aturan tanpa keterangan (`colourRuleLegend=false`) = REPORT; P-12 > 6 seri = cacat `CHART_DATA_CONSTRAINTS.P-12`; P-10 total != kumulatif = REPORT.

## Temuan (untuk S32/core, bukan area S34)
- F1: lint DATUM-26 menghitung subjek `series#index`, sehingga galeri P-13 (2 titik satu kuadran) dan P-15 (5 sel aturan signal) FAIL. Usul: hormati `data-accent-group` (sudah dipancarkan P-13) dan lewati tanda ber-`data-rule` (P-15).
- F2: lint DATUM-28 toleransi 1e-6 pt vs pembulatan font-size 5 desimal mm: `chart.minFontPt=7` -> 6,99998 pt FAIL (berlaku juga untuk core). Usul: toleransi 1e-3 pt.

## Bukti
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/engine/chart/family-p2"` -> kosong (exit 1); total repo 21 galat di luar area.
- `npx eslint src/lib/studio/engine/chart/family-p2` -> exit 0.
- Asap: komposit 7 panel bm-fig-17 (P-09..P-15) + 6 render datum 166 mm: SVG identik dua kali; raster 250 dpi diperiksa visual; 15 kasus tepi/galat sesuai (lihat laporan akhir).
