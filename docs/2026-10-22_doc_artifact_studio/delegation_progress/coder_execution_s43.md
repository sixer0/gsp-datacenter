# S43 coder-execution — engine/chart/family-g (I33)

Status: complete (2026-10-23). Area: `src/lib/studio/engine/chart/family-g/**` (6 berkas: index, common, provinces, tile-map, dot-flow, flowchart). Skills: backend-execution, dry-run-verify-fix (2 siklus perbaikan: DATUM-24 label kosong, keterbacaan label/rute).

## Isi
- `chartFamilyG` = G-01 tile map, G-02 dot map, G-03 flow map, G-04 flowchart; terdaftar lewat `...chartFamilyG` di D01 (tanpa perubahan kontrak). Helper dari chart/core (SvgDoc mm, pt fisik, palet, aparatus, penjaga); gaya `datum` + `gallery`; deterministik (SVG identik dua kali).
- `provinces.ts`: grid tetap 38 provinsi 8x14 (posisi panel G-01 Gambar 8.5) + kode petak Studio terdokumentasi; singkatan ganda manual dipisah: KAUT, KATE (KALT), SUTE, SUTR (SULT), MAUT (MALU). Helper `indonesiaTiles(values)`.
- G-01: ramp tinta berkelas (<=4 nilai = kelas per nilai, selain itu 4 interval; kuantisasi ramp PC kontinu agar lint 25 <= 5); `standardAbbrev` (REPORT, tidak tolak), `singleRamp` (false = kelas teratas aksen), `valueInTile` (dicetak bila muat; datum tanpa nilai -> baris KUNCI). Label tak muat pada lantai dipadatkan `textLength` (REPORT).
- G-02/G-03 (KT-12): skematis di atas grid petak data, tanpa peta dasar/GeoJSON; akar `data-schematic="KT-12"` + REPORT KT-12. G-03 tebal linear menurut nilai, kurva + kepala panah, sisi label simpul menghindari kurva.
- G-04: `validateSpec` S26 -> `placeDiagram`+`layoutFlow` (per_row) -> `routePlaced` S30, dipetakan ke kanvas chart, digambar ulang dengan huruf pt fisik. Impor langsung build/place dan build/route (bukan indeks build) agar tidak menarik dispatcher D01. `maxSteps` tolak (BY_CONSTRUCTION_FAILED), `standardShapes`/`singleReadingDirection` REPORT.
- Aksen: medan `accent` > alias `accentPoint`/`accentGroup`; maks P7-06 (DATUM-26 lempar). Params tak dikenal = REPORT `PARAM_IGNORED` (D-58).

## Keputusan / deviasi
1. G-04: label konektor kosong diizinkan kecuali keluaran keputusan (ISO 5807); validasi Garis A memakai salinan berpenanda (deviasi DATUM-24, P3-diamond-exits tetap).
2. G-04: polyline rute Garis A dirapikan (titik kembar, taji bolak-balik stub jangkar, segaris) dan ujung pada belah ketupat dipotong ke tepi bentuk; sub/mark/tag simpul tidak digambar (REPORT).
3. Parameter registri berlaku penuh di kedua gaya (default registri = resep PC v84/v81).
4. Alias non-kontrak `accentDot`/`accentFlow` (spec S94) TIDAK dibaca: PARAM_IGNORED.

## Bukti
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/engine/chart/family-g"` -> kosong (exit 1).
- `npx eslint src/lib/studio/engine/chart/family-g` -> exit 0.
- Asap (tsx, scratchpad): bm-fig-21 penuh 12 panel 166x175,994 mm + subset G; 6 spec datum; semua det=true; raster 300 dpi diperiksa visual. Galat: bentuk salah SCHEMA_INVALID, maxSteps BY_CONSTRUCTION_FAILED, petak titik asing SCHEMA_INVALID, aksen ganda DATUM-26.
- Benchmark G-01 dirender apa adanya: REPORT `standardAbbrev` "label petak ganda: KALT x3, SULT x2, MALU x2" dan "SULT di luar kode"; `valueInTile` petak 3,7 mm terlalu kecil; 33 label dipadatkan.

## Permintaan (file_requests.md)
S94: kunci params pendek panel G -> `chart.kind.G-0x.<nama>`; `accentDot`/`accentFlow` -> medan `accent`; `singleRamp:false` bila kelas teratas signal dimaksud.

## Temuan
- S30 `routePlaced` (flow per_row) mengembalikan taji bolak-balik pada jangkar dan ujung di sudut kotak batas belah ketupat (mis. hash->analisis mulai (96, 34,9)); dirapikan lokal, belum dicek terhadap Python (untuk S84/S30).
- `layoutFlow` mengabaikan `class.col/row` dan membatasi per_row 4 -> 3 pada 128 mm; tata letak panel G-04 berbeda dari gambar manual (2 baris 3 simpul).
