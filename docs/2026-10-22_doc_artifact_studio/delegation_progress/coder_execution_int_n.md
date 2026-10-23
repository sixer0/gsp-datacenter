# INT-N coder-execution — IP-25 (chart core + registri)

Status: complete (2026-10-23). Skills: backend-execution, dry-run-verify-fix. Area: `src/lib/studio/engine/chart/**`, `src/lib/studio/registry/charts.ts`.

## Isi
1. Resolver tunggal `core/params.ts` (D-87): kunci penuh dipakai; alias pendek = nama ParamDef kode sama -> dipindah ke kunci penuh + REPORT `PARAM_ALIAS` (kunci penuh menang bila keduanya ada); alias bernilai tidak sah (validateParamValue + bentuk alternatif yang sudah dibaca keluarga, `CHART_PARAM_ALT_FORMS`) -> dibuang + `PARAM_IGNORED` beralasan; `accent.point|group|series` di params dilipat ke medan `accent`; petunjuk data per kode = satu tabel `CHART_DATA_HINT_KEYS`; `chart.kind.<kode lain>.*` dan sisanya -> `PARAM_IGNORED` (dibuang). Dipanggil sekali di `renderChart` dan per panel `renderComposite` (`runChartRenderer`). Resolver lokal + PARAM_IGNORED lokal dihapus di core dan 11 keluarga (p1, p2, h1, h2, k1, k2, s1, s2, w1, w2, g).
2. Lint 26: subjek = `data-accent-group` > `data-accent="series"` > `data-series#data-index`; tanda `data-rule` dilewati (`accentSubjectKey`). P-05/P-07 kini `data-index` grup + `data-obs`; K-01..K-04 seri berwarna aksen bertanda `data-accent="series"`. `ACCENT_HINT_KEYS` = accentPoint/Group/Series; inti membaca `accent.point` (label/indeks), aksen seri pada kode inti -> REPORT `ACCENT_HINT`.
3. Lint 28 toleransi `FONT_PT_TOLERANCE` 1e-3 pt; kenaikan +0,005 pt family-h2 dihapus (`Math.max(pt, minPt)`).
4. Registri: 12 ParamDef mesin (S-02 whisker; S-03/S-04 bandwidth; K-08 grid/icon/caption; K-11 accentLink; K-12 widths; W-07 todayAt/todayLabel; W-08 riskyTypes/highlightWindow). CHART_PARAMS 87 -> 99 (`CHART_CATALOG_PARAMS_COUNT` 87, `CHART_ENGINE_PARAMS_COUNT` 12); keluarga membacanya lewat `chartParam` kunci penuh (kunci tertunda W2 dihapus).
5. `core/heights.ts` `CHART_REFERENCE_HEIGHT_MM` = sebaran P1/K1/H1/S1/W2 (22 kode); `estimateHeightMm` tanpa `heightMm` memakai tabel ini lalu lebar x 0,5.
6. `colorFamily`: rona kertas/putih -> warna palet/peran = keluarga warna itu; rona tinta = "ink". `colorFamilyExact` (aturan lama) hanya untuk pemilih kelas H-03 agar D-82 (galeri k = 4) tidak berubah.

## Keputusan (untuk controller)
- K1: origin parameter mesin tetap "catalog" (kontrak hanya catalog|contract), asal di `source` "mesin ..."; permintaan ke pemilik params/index.ts (file_requests INT-N).
- K2: alias tidak sah tidak ditolak (spec S94 tetap dirender); bentuk alternatif: P-09 bandLevels daftar, P-13 quadrantNames objek, H-03 ramp daftar/string, K-07/K-08 grid pair/"RxC", S-01 bins int, S-03/S-04 bandwidth silverman|scott, W-07 todayAt string, W-09 bands int.
- K3: keluarga yang dulu mengabaikan alias (core, P1, K1, W2, G) kini menerimanya: panel galeri berubah sesuai alias sah (mis. G-01 valueInTile=false, W-08 riskyTypes, W-09 bandLegend=false).

## Bukti
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/(engine/chart|registry/charts)"` -> kosong (exit 1); total repo 0 galat TS. `npx eslint src/lib/studio/engine/chart src/lib/studio/registry/charts.ts` -> exit 0.
- Asap: 58 kode x 2 gaya (spec panel S94 apa adanya) 116 render 0 galat 0 FAIL, 66 PARAM_ALIAS; 5 komposit bm-fig-17..21 0 FAIL, deterministik; 0 isu DATUM-25/26/28 di 353 render (sebelum: 35 render FAIL DATUM-26). Kunci penuh h70: 105/116 SVG identik dengan kode lama, 9 hanya atribut subjek, 2 W-08 karena alias kunci baru.
- 46 fixture chart paritas: SVG kode lama vs baru identik (selain atribut subjek). run_parity subset CA+5 CB1 (svg): CA 4 PASS; CB1 p03/k03/h01/s02/w06 FAIL pada a/b/c/f (sudah ada sebelumnya), (d) tinggi lolos semua.
