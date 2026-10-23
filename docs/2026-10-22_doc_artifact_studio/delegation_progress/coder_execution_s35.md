# S35 coder-execution — engine/chart/family-h1 (I25)

Status: complete (2026-10-23). Area: `src/lib/studio/engine/chart/family-h1/**` (7 berkas: index, common, axes, ramp, scatter, heatmap, hexbin; 1.235 baris).

## Isi
- `chartFamilyH1` = H-01 scatter, H-02 bubble, H-03 heatmap, H-04 connected scatter, H-05 hexbin; terdaftar lewat `...chartFamilyH1` di dispatcher D01 (tanpa impor dispatcher). Helper inti S32 dipakai (SvgDoc, palet, niceStep, aparatus, chartFloors, defect); tidak ada duplikasi.
- Gaya `datum` = port pustakachart v66/v67/v68/v70/v73; gaya `gallery` = panel Gambar 8.2. SVG mm, huruf pt fisik >= 6,0, `data-mark` point/line/cell + series/index, `data-axis`, deterministik (SVG identik dua kali, 10 render).
- Parameter: H-01 xIsPresumedCause (false -> REPORT), trendLine (OLS putus-putus); H-02 areaProportional, directLabels; H-03 ramp (pair/daftar/string "paper-signal", jatuh ke P7-27, "white" = kertas), scaleShown; global P7-16 gridlines, P7-25 denseScatterStrategy (> 1000 titik). Kunci tak dikenal -> REPORT PARAM_IGNORED (D-58).
- Hexbin = port `Axes.hexbin` matplotlib (round setengah-ke-genap, nonsingular, padding 1e-9). Bukti: data H-05 Gambar 8.2 (600 titik) -> gridsize 9: 53 sel, gridsize 16: 121 sel, urutan dan hitungan identik dengan matplotlib 3.11.1 (VENV).

## Keputusan / deviasi
1. Alias pendek `params.<nama>` diterima HANYA untuk ParamDef registri kode itu sendiri (spec galeri S94 memakai `trendLine`, `scaleShown`, `ramp`); kunci penuh menang.
2. Ramp H-03 dikelaskan (k <= 5, t = i/k, henti akhir murni tidak dipakai sel) karena lint 25 inti menghitung tiap rona sebagai keluarga; ramp tinta (abu-abu F-008) dibulatkan ke token tinta (1 keluarga). Galeri mencadangkan 1 keluarga aksen -> k = 4 (komposit 8.2 lolos DATUM-25).
3. Hexbin memakai ramp tinta ink100..ink900 5 kelas (acuan dan panel galeri abu-abu); gridsize datum 9 (acuan), galeri clamp(round(0,65 sqrt n), 9, 24).
4. Label titik bernama ink700 (acuan signal) kecuali titik beraksen; gelembung digambar terbesar dulu; tanda tidak keluar bingkai (jarak tepi = jari-jari).
5. H-04 gaya datum: label awal verd / akhir alert (anotasi acuan); tanda data = n titik + 1 garis.

## Bukti
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/engine/chart/family-h1"` -> kosong (exit 1); total repo 21 galat, semuanya di luar area.
- `npx eslint src/lib/studio/engine/chart/family-h1` -> exit 0.
- Asap tsx (renderChart, 5 kode x 2 gaya + komposit H-01..H-05 + varian): lint tanpa FAIL; 5 jalur galat (bentuk salah, H-04 < 2 titik, matrix tidak cocok, 2 aksen DATUM-26, henti ramp tak sah); raster 300 dpi diperiksa visual.

## Permintaan (file_requests.md)
S32 estimateHeightMm pakai `H1_REFERENCE_HEIGHT_MM` (66/66/72/60/64); S32 colorFamily: rona kertas -> X = keluarga X.

## Temuan
- Paritas CB1 (b) warna hexbin tidak dapat identik (acuan colormap kontinu 256 tingkat vs 5 kelas lint 25). Fixture S63 H-01..H-05 sebaiknya menyetel `heightMm` acuan.
