# S42 coder-execution — engine/chart/family-s2 (I32)

Status: complete (2026-10-23). Skills: backend-execution, dry-run-verify-fix. Area: `src/lib/studio/engine/chart/family-s2/**` (6 berkas: index, common, ridgeline, strip, beeswarm, radial; 1113 baris). Registrasi: `chartFamilyS2` {S-05, S-06, S-07, S-08}; `contract/dispatch.ts` sudah menyebarnya (tanpa sunting).

## Isi
- S-05 ridgeline: KDE Gauss Silverman per grup (= `_kde` PC:852), 160 titik, normal ke puncak. Datum = v59_ridge (isian ink100, garis ink900 1 pt, sumbu x mono + satuan); gallery = garis ink700, isian kertas, tanpa sumbu. Params periodOrder, slightOverlap, sharedAxis, maxGroups (> maks -> BY_CONSTRUCTION_FAILED `chart.kind.S-05.maxGroups`).
- S-06 strip/jitter: jitter mulberry32 dibenihi FNV-1a("S-06|gi|nama") XOR 42; petunjuk `jitter` (false = strip v56), `meanLine`.
- S-07 beeswarm: penempatan deterministik (urut nilai, kandidat singgung, |x| terkecil, seri diputus bergantian kanan/kiri, r dikecilkan maks 4x bila melebar); cek `S-07.noOverlap`; params columnPerGroup, medianMarker.
- S-08 radial: sektor seragam (petunjuk `sectors` 4..72, default 36), baji linier terhadap jumlah, lingkar = maks domain rapi; params northUp, clockwise, uniformSectors (false = REPORT); petunjuk `compassLabels`, `accentSectorDeg`; aksen angka = indeks sektor.
- Huruf pt fisik >= `chart.minFontPt`; tanda N2; aksen `spec.accent` > alias params; params tak dikenal + nama pendek bertipe salah -> REPORT `PARAM_IGNORED`.

## Keputusan / deviasi (untuk dicatat controller)
1. Subjek tanda chart sebaran = GRUP: titik membawa `data-index` = indeks grup + `data-obs` = indeks pengamatan, agar grup beraksen dihitung 1 subjek oleh lint 26 (bukan N titik). Radial: `data-index` = sektor.
2. Datum S-06/S-07: titik ink700 + hanya grup beraksen signal (acuan CAT_SERIES per grup melanggar DATUM-26/25), rerata ink900 bukan signal (seperti S33 P-05).
3. Nama pendek param (`slightOverlap`, `northUp`, ...) diterima sebagai alias kunci registri bila tipenya cocok (pola S34); `periodOrder: "atas ke bawah Mei..Okt"` (string, spec S94) -> diabaikan + PARAM_IGNORED, bukan ditolak.
4. Gaya datum S-05 `slightOverlap`: resep acuan 0,8 x jarak baris kecuali diset eksplisit (true -> 1,3); gallery 1,5.
5. Angka jitter tidak mereplikasi numpy PCG64 (paritas CB struktural, research/06 N4).

## Bukti
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/engine/chart/family-s2"` -> kosong (exit 1); total repo 21 galat, semua di luar area.
- `npx eslint src/lib/studio/engine/chart/family-s2` -> exit 0. `grep -rn "Math.random" src/lib/studio/engine/chart/family-s2` -> kosong (exit 1).
- Asap (tsx, scratchpad): 4 kode x 2 gaya + komposit 4 panel bm-fig-21 -> SVG identik dua kali, lint tanpa FAIL (hanya REPORT PARAM_IGNORED/DATUM-36); 8 jalur galat/param sesuai; raster 300 dpi diperiksa visual terhadap Gambar 8.5.

## Permintaan / temuan
- Tidak ada permintaan lintas pemilik. Info: lint 26 core menghitung subjek per `series#index`; keluarga sebaran lain (S41, P-05 S33) yang memberi `data-index` per pengamatan akan FAIL DATUM-26 bila satu grup beraksen.
