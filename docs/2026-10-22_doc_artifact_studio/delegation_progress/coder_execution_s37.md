# S37 coder-execution — engine/chart/family-k1 (I27)

Status: complete (2026-10-23). Area: `src/lib/studio/engine/chart/family-k1/**` (6 berkas: index, common, stack, diverging, arc, pie).

## Isi
- `chartFamilyK1` = K-01..K-06; terdaftar lewat spread kontrak `CHART_RENDERERS` (dispatch.ts D01, tanpa suntingan kontrak). Helper inti diimpor per berkas (`core/svg`, `palette`, `guards`, `scale`, `apparatus`, `prepare`), tanpa duplikasi.
- Gaya datum = port PC (CB1): `_stack_rows` CAT_SERIES, v21 VERD/ALERT + garis tengah, v23 INK900/INK400; grid x, KUNCI. K-05/K-06 (CC) lingkaran + kolom label langsung. Gaya gallery = Gambar 8.3 (diperiksa visual terhadap image9: aksen + ramp tinta, total K-01, persen K-02, nama sisi K-03/K-04, tick mutlak 10 5 0 5 10, "68 %" di tengah donut, "58 %" di iris pie).
- Parameter registri: K-02 maxSegments (throw) + keySegmentLeft; K-03 meaningfulMidpoint (false -> REPORT); K-04 groups (throw); K-05 maxSlices/startAngle/clockwise; K-06 maxSlices/oneDominant (FAIL bila terbesar < 1,5 x kedua). Rentang ParamDef dicek (SCHEMA_INVALID).
- Aksen: `accent.series`/`accent.point` (S03-d1) + alias params; params tak dikenal dan `chart.kind.<kode lain>.*` -> REPORT PARAM_IGNORED.
- Busur deterministik (arc.ts): sudut dari jumlah kumulatif, sin/cos eksak di kelipatan 90 deg, num() 4 desimal, iris 360 deg dipecah 2 busur, persen label sisa terbesar (jumlah 100).

## Keputusan / deviasi
1. K-01 datum: label segmen tanpa "%" (PC menempel "%" pada nilai mentah); label hanya bila > 9 (PC) DAN muat.
2. K-03 tak bertanda: tepat 2 seri (seri 0 kanan, 1 kiri); bertanda: sisi menurut tanda; seri campur hanya bila satu seri (neto).
3. Gaya datum K-01..K-04 mengabaikan aksen seri (palet PC), REPORT ACCENT_HINT.
4. Ekspor `K1_REFERENCE_HEIGHT_MM` (tinggi PC) untuk estimateHeightMm inti.

## Bukti
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/engine/chart/family-k1"` -> kosong (exit 1); total repo 21 galat di luar area.
- `npx eslint src/lib/studio/engine/chart/family-k1` -> exit 0, 0 temuan.
- Asap tsx (6 kode x 2 gaya + komposit 6 panel bm-fig-19): semua dirender 2x identik; 6 jalur galat sesuai (maxSegments, maxSlices, groups, CH-01, rentang, bentuk data); raster sharp diperiksa visual.

## Permintaan (file_requests.md)
S32 guards.ts: DATUM-26 hitung aksen tingkat seri (kini FAIL palsu K-01..K-04 gallery). S32 render.ts: tinggi acuan K1. (S33 sudah meminta alias `accentSeries`.)
