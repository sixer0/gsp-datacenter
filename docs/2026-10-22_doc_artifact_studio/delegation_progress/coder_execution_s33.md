# S33 coder-execution — engine/chart/family-p1 (I23)

Status: complete (2026-10-23). Area: `src/lib/studio/engine/chart/family-p1/**` (8 berkas: index, common, grouped-column, lollipop, dot-plot, dumbbell, range-plot, slope).

## Isi
- `chartFamilyP1: ChartRendererMap` = P-03 grouped column, P-04 lollipop, P-05 dot plot, P-06 dumbbell, P-07 range plot, P-08 slope; registrasi lewat sebaran D01 `CHART_RENDERERS` (modul tidak mengimpor dispatch). Semua helper dari chart/core (SvgDoc mm + pt fisik, palet/peran, niceDomain, keyRow, aparatus, penjaga, figureLabel); tidak ada duplikasi.
- Gaya `gallery` = panel Gambar 8.1 (parameter registri penuh); gaya `datum` (default) = resep pustakachart v04/v05/v06/v07/v09/v11 (CB1/CB2), parameter warna/label/urutan registri hanya bila diset eksplisit (spec, atau templat beda dari default); struktural (maxSeries, gridlines, zeroBaseline) berlaku di kedua gaya.
- Aksen: `spec.accent` {point, group, series} > `params.accentPoint` (string | indeks | {series, category}) / `accentGroup` / `accentSeries`; `accent: true` per titik/seri; > maks -> DATUM-26; petunjuk tak cocok -> REPORT ACCENT_HINT. Kunci params tak dikenal -> REPORT PARAM_IGNORED. Huruf >= lantai P7-36 templat.
- `data-mark` N2: column, point, segment, line, interval, whisker; `data-series`/`data-index`; aksen tingkat seri diberi `data-accent="series"`.

## Keputusan / deviasi
1. P-08 dua orientasi data: tepat 2 kategori = galeri S94 (seri = objek); selain itu = adapter paritas (kategori = objek, 2 seri pertama = periode).
2. P-05/P-07 datum: rerata ink700/ink900, signal hanya grup beraksen (acuan memberi signal ke setiap grup, melanggar DATUM-26); jitter P-05 deterministik (rasio emas, tanpa RNG).
3. P-04 stemWeight thin 0,3 mm / regular 0,6 mm; datum tanpa set eksplisit = 1,2 pt acuan. P-03 nilai negatif ditolak CH-01; seri > maxSeries -> penjaga `chart.kind.P-03.maxSeries`.
4. P-06 sort galeri = default registri byDifference (manual tercetak urutan alami) -> permintaan ke S94.

## Bukti
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/engine/chart/family-p1"` -> kosong (exit 1); total repo 25 galat, semua di luar area.
- `npx eslint src/lib/studio/engine/chart/family-p1` -> exit 0.
- Asap bm-fig-17 (subset P-01..P-08; P-09+ = family-p2 belum terisi): komposit 166 x 166,43 mm deterministik; 6 kode x 2 gaya deterministik; raster 300 dpi diperiksa visual mirip panel manual. 14 kasus tepi: 9 render OK, 5 galat sesuai (maxSeries, CH-01, SCHEMA_INVALID bentuk/enum, DATUM-26, P-08.periods).

## Permintaan (file_requests.md, 4 baris S33)
S32: lint DATUM-26 hitung `data-accent="series"` satu subjek (kini P-06 default terlapor FAIL 5 subjek); `accentSeries` ke ACCENT_HINT_KEYS; `estimateHeightMm` pakai `P1_REFERENCE_HEIGHT_MM`. S94: P-06 `sort: natural`, kunci pendek -> kunci penuh.
