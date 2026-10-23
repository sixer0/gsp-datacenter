# S32 coder-execution — engine/chart/core (I22)

Status: complete (2026-10-23). Area: `src/lib/studio/engine/chart/core/**` (14 berkas: index, svg, palette, scale, guards, apparatus, prepare, datum, gallery, families, lookup, canvas, composite, render).

## Isi
- Ekspor kontrak: `chartCanvas`, `renderChart(spec, tpl?)`, `renderComposite(spec, tpl?)`, `chartCore` (P-01, P-02, P-11, W-02). Helper bersama untuk S33-S43: `SvgDoc` (mm, font pt fisik, data-mark/series/index, data-axis, data-bg paper), palet + peran warna P7-07..12, `chartParam`/`paramEnum`, `niceDomain` (nol CH-01), `keyRow` (baris KUNCI), `figureApparatus` (caption + SUMBER), penjaga `assertChartSpec`/`requireCategorical`, `lintChartSvg`. Keluarga sebaiknya impor dari `core/svg`, `core/palette`, dst. (tanpa siklus dispatch).
- Gaya `datum` (default) = port DC bar/column/threshold; gaya `gallery` = panel Gambar 8.1/8.4 (P-11: garis batas hitam putus-putus, label batas di atas, label nilai di dalam batang; F-006).
- Komposit galeri: kisi 1-3 kolom, panel `<g data-panel>` lewat `CHART_RENDERERS` (dibaca di badan fungsi, S03), pita kode + nama, axisNote, lint per panel (aksen) dan per figur. `note` komposit = metadata, tidak digambar.
- Galat: kode tak dikenal CHART_KIND_UNKNOWN; drawn=false CHART_KIND_NOT_DRAWN + alternatives; kode tergambar tanpa renderer (S33-S43 belum) `StudioNotImplemented("engine/chart/<module>")`; penjaga BY_CONSTRUCTION_FAILED `details.checkId` (G2, N1, DATUM-10/26/30/33/36, DC-G1, DC-G5, CH-01, chart.kind.W-02.maxPeriods).
- Lint keluaran: DATUM-28 (pt fisik >= 5,5), DATUM-25 (keluarga warna, ramp tinta = 1, K-32), DATUM-33, G2, DATUM-27, DATUM-13 (+ aset hanya data:, D-38), DATUM-26, DATUM-36 REPORT, PARAM_IGNORED REPORT (D-58).
- D-58: `params` tak dikenal diabaikan; aksen via `params.accentPoint`/`accentGroup`/medan `accent` (string atau `{category|label|group}`).

## Keputusan / deviasi
1. Font ditulis pt fisik dalam satuan pengguna mm (F-007, N1); geometri DC px/3,7795 -> mm.
2. Gaya datum: `spec.heightMm` diabaikan (tinggi = `tinggi()` DC), REPORT `heightMm` bila beda.
3. P-01: default registri sort valueDesc + accent topBarOnly berlaku juga di datum; `valueLabel barEnd` di datum = kolom nilai tetap DC.
4. `sub` kolom aktif bila ada titik ber-sub (DC membaca `spec.sub` tingkat atas untuk tinggi).
5. Kapital sebelum escape (DC merusak `&amp;`); nilai negatif ditolak CH-01.
6. Panel komposit memakai cast `widthMm` (permintaan S03-d1).

## Bukti
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/engine/chart/core"` -> kosong (exit 1); total repo 23 galat, semua di luar area (orchestration, information-library, dispatch-kpi, user-access, propose, studio/artifacts/_lib/request.ts, components/studio/revision).
- `npx eslint src/lib/studio/engine/chart/core` -> exit 0.
- Paritas CA (compare.py --class CA, DC Rev L lawan Node, spec sama): P-01, P-02, P-11, W-02 verdict PASS (geometri maks 0,0013 mm, tag/warna/font/teks identik).
- Asap: 8 render (4 kode x 2 gaya) + komposit deterministik (SVG identik dua kali); 12 jalur galat sesuai; spec S94 bm-fig-17: penuh -> StudioNotImplemented family-p1 (benar), subset inti 3 panel dirender + raster 300 dpi diperiksa visual.

## Permintaan (file_requests.md)
S03-d1 ChartCanvas.widthMm number; S63/S65 fixture CA P-01 dan `sub`; S94 P-11 `chart.zeroBaseline=false`.
