# S39 coder-execution — engine/chart/family-w1 (I29)

Status: complete (2026-10-23). Skills: backend-execution, dry-run-verify-fix (2 siklus perbaikan visual: pemilihan tick x, pita label x/kanan).
Berkas (area eksklusif): `src/lib/studio/engine/chart/family-w1/` index.ts, render.ts, frame.ts, timeaxis.ts, params.ts.

## Isi
- `chartFamilyW1` = W-01 line, W-03 step line (post, PC:772), W-04 area, W-05 stacked area. W-02 TIDAK disentuh (registri memetakan ke core/S32).
- Gaya `datum` (default, kerangka pustakachart PC:105-139: spine ink400 0,6 pt, grid y ink200, tick 6,5 pt, angka Plex Mono, label sumbu y = `unit`) dan `gallery` (panel Gambar 8.4: sumbu rambut textAxis + tick mark, konteks ink200, aksen signal, tanpa grid).
- Parameter registri: W-01 maxLines (defect `chart.kind.W-01.maxLines`), labelAtLineEnd (false -> baris KUNCI); W-04 zeroBaseline (K; false -> domain dipotong + REPORT CH-01; cadangan P7-04); W-05 largestAtBottom, maxLayers (defect). Tipe salah / di luar range -> SCHEMA_INVALID.
- Aksen: `series[].accent`/`points[].accent`, medan `accent` {series, group, point} atau alias params; subjek > maks -> DATUM-26; petunjuk tak cocok -> REPORT ACCENT_IGNORED. Params tak dikenal -> REPORT PARAM_IGNORED.
- Sumbu waktu: kategori `YYYY-MM-DD` (posisi proporsional hari) / `YYYY-MM` -> nama bulan Indonesia singkat (Jan..Agu..Des) + baris tahun pada tick pertama dan pergantian tahun; kategori angka -> tick rapi; lainnya ordinal. Angka DATUM `fmt` (1.500, 2,5).
- Null: garis terputus (W-01/W-03); W-05 null dibaca 0 + REPORT W-05-NULL; negatif W-05 -> CH-01. Font pt fisik (SvgDoc), min = maks(nilai gaya, chart.minFontPt); garis >= 0,18 mm.
- Helper inti diimpor dari berkas inti (`../core/svg|palette|scale|guards|apparatus|prepare`), bukan `../core` (hindari siklus dispatch). Registrasi lewat `chartFamilyW1` (D01 sudah mengimpornya).

## Keputusan / deviasi (untuk dicatat controller)
1. Alias pendek params (`labelAtLineEnd`, `zeroBaseline`, `largestAtBottom`, `maxLayers`, `maxLines`) diterima untuk kode itu (spec galeri S94 memakainya); kunci penuh `chart.kind.*` menang. `step`, `axis`, `transcription`, `seriesNames` = PARAM_IGNORED.
2. W-03 tanpa ParamDef: batas 3 garis (defect DATUM-25) selaras W-01.
3. W-05 gaya gallery: label lapisan hanya bila kanvas >= 100 mm (panel 8.4 tanpa label); gaya datum selalu berlabel langsung.
4. Aksen titik pada seri yang sudah beraksen: hanya label nilai (tanpa penanda kedua) agar lint DATUM-26 tetap 1 subjek.

## Bukti
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/engine/chart/family-w1"` -> kosong (exit 1).
- `npx eslint src/lib/studio/engine/chart/family-w1` -> exit 0.
- Asap (skrip scratchpad, renderChart): 9 spec x 2 gaya = 18 render, semua deterministik (SVG identik 2x), 0 FAIL lint; komposit bm-fig-20 (panel W-01..W-05) 0 FAIL; 7 jalur galat sesuai (maxLines, DATUM-26, shape, panjang seri, CH-01, maxLayers, tipe param). Raster 300 dpi diperiksa visual terhadap PNG Gambar 8.4.

## Permintaan / temuan
- Tidak ada permintaan lintas pemilik. Info: `ACCENT_HINT_KEYS` inti (prepare.ts) tidak memuat `accentSeries`, sehingga inti melaporkan alias itu sebagai PARAM_IGNORED (milik S32, tidak diubah).
