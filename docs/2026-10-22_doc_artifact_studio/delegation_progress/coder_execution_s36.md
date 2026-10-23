# S36 coder-execution — engine/chart/family-h2 (I26)

Status: complete (2026-10-23). Area: `src/lib/studio/engine/chart/family-h2/**` (6 berkas, 1342 baris: index, shared, contour, network, arc, venn). Registrasi: `chartFamilyH2` = {H-06, H-07, H-08, H-09} dibaca D01 (`...chartFamilyH2`); helper hanya dari `../core/*` (tanpa impor dispatch).

## Isi
- H-06 contour: marching squares deterministik (titik potong per sisi kanonik, pelana diputus rerata pusat, rangkai via kunci sisi). Datum = isian ramp ink100/200/400 + garis ink700 + label inline (garis diputus, tanpa kotak P7-15) + sumbu L bertick; galeri = garis ink400 tanpa isian + sumbu L. Params pendek `levels` (1..12, bawaan 6, jarak sama; atau daftar), `accentLevel`, `rowOrder` ("atas ke bawah" | "bawah ke atas").
- H-07 network: `params.positions` 0..1 y ke atas (terverifikasi pada PNG galeri), tak lengkap -> BFS bertingkat (akar derajat maks, seri indeks) + REPORT; `nodeSize` degree/uniform, `highlightBridges` = simpul betweenness tertinggi (Brandes) bila tanpa aksen eksplisit; `accentLink`; `labels` all/accent/none.
- H-08 arc: simpul segaris, satu path busur per tautan (jumlah busur = jumlah relasi), pipih seragam bila tidak muat (REPORT H-08-FLATTEN); `order` data/degree.
- H-09 Venn/Euler: 2..`maxSets` himpunan (registri, alias pendek), luas lingkaran = ukuran, jarak pasangan bisection eksak luas lensa; tiga himpunan = segitiga jarak, irisan tiga tidak dikendalikan (REPORT H-09-AREA); `regionLabels` eksklusif/total; `accentSet`.
- Umum: gaya datum/gallery, huruf pt fisik >= lantai `chart.minFontPt`, aksen via medan `accent` {point, group, series} + alias params + `group:"aksen"`; aksen > maks -> DATUM-26; params tak dikenal -> REPORT PARAM_IGNORED (kunci pendek yang dibaca dikecualikan).

## Keputusan / deviasi
1. Isian kontur datum memangkas ramp PC (sampai ink900) ke ink100..ink400 agar label terbaca dan keluarga warna tetap 1.
2. Alias pendek param registri (`nodeSize`, `highlightBridges`, `maxSets`) dibaca karena spec galeri S94 memakainya; kunci `chart.kind.H-0x.*` menang.
3. Ukuran huruf tepat di lantai dinaikkan 0,005 pt (lihat temuan 1).

## Bukti
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/engine/chart/family-h2"` -> kosong (grep exit 1).
- `npx eslint src/lib/studio/engine/chart/family-h2` -> exit 0.
- Asap (`npx tsx` scratch, renderChart): 16 render det=true (SVG identik dua kali), termasuk komposit galeri bm-fig-18 panel H-06..H-09 dan datum/gallery per kode; 5 jalur galat sesuai (DATUM-26, maxSets x2, SCHEMA_INVALID). Raster PyMuPDF diperiksa visual (angka Venn 3 himpunan 38/25/20/12/7/5/3 benar).

## Temuan
1. (S32, core) `lintChartSvg` DATUM-28 toleransi 1e-6 pt, sedangkan `SvgDoc.text` menulis font-size mm 5 desimal: ukuran TEPAT di lantai (mis. `chart.minFontPt` 7) terbaca 6,99999 pt -> FAIL palsu. Usulan: toleransi 1e-4 pt atau bulatkan font-size ke atas.

## Permintaan
Tidak ada.
