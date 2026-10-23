# IP-41a coder-execution — sisa S79 di mesin chart (D-136)

Status: complete. Skills: backend-execution, dry-run-verify-fix. Area: src/lib/studio/engine/chart/** (klaim prefiks IP-41a di file_claims.md).

## Berkas diubah
- family-p2/waterfall.ts — E1: label kategori dan nilai gaya datum 6,0/6,4 -> 6,5 pt (PC:136 `style_ax`). E3: batang naik gaya datum = token signal (PC:1178) + `data-rule="sign"` (lint 26 melewatinya seperti P-15); bila ada aksen eksplisit, naik = improving (verd). Galeri tidak berubah.
- family-k2/waffle.ts — E2: KUNCI dan catatan "1 kotak" gaya datum 6,2/6,0 -> 6,5 pt (PC:496). E3: giliran datum improving (verd), signal, ink200, ink400, ink700 (PC:486); dengan aksen eksplisit signal dikeluarkan dari giliran. Galeri tidak berubah.
- family-k2/treemap.ts — E3: gaya datum + label dalam: ink900/ink700/ink400/ink200 bergiliran per peringkat nilai menurun seluruh butir (PC:597-602 `shades[i % 4]`); tanpa label dalam tetap per grup (KUNCI grup). Galeri tidak berubah.
- family-h2/network.ts — E3: gaya datum simpul ink100 bergaris ink400 0,6 pt, simpul `group` core/inti = ink900 (padanan "Core*" PC:1112), semua tautan non-aksen ink400. Galeri tidak berubah.
- family-w2/gantt.ts — E4: label tugas dibungkus `<g data-axis="y">` (kedua gaya; tanpa perubahan visual).
- family-h2/contour.ts + core/numeric.ts (`maxNLocatorTicks`, port MaxNLocator matplotlib) — E6: `levels` bilangan bulat N gaya datum = MaxNLocator(N + 1, min_n_ticks 1) di dalam (min, maks), bawaan N = 8 (PC:1057). Galeri tetap berjarak sama, bawaan 6 (spec S94 menyetel levels 6).

## Bukti (segar, 2026-10-23)
- `npx tsc --noEmit -p tsconfig.json`: exit 2, 4 galat semuanya di luar area: `benchmark/harness/run/run_benchmark.ts(170,..)` TS18047 'inputs.template' is possibly 'null'. Area chart 0 galat.
- `npx eslint src/lib/studio/engine/chart`: exit 0.
- Asap (scratch `ip41a_smoke.ts`, spec = fixture paritas S63 + panel galeri, sama dengan chart-smoke S73): "kode tergambar 58; render 116; OK 116; masalah 0" (deterministik 2 run, 0 FAIL lint, tanpa NaN).
- Sasaran: P-10 datum min 6,500 pt, kolom signal x3 (= acuan) + data-rule 3; K-07 datum min 6,500 pt, sel verd 60 / signal 25 / ink200 15 (= acuan); K-09 datum ink900 3, ink700 2, ink400 2, ink200 2 (= acuan); H-07 datum simpul ink100 x7 bergaris ink400, tautan ink400 x5 + aksen 1; W-07 data-axis [y, x] kedua gaya; H-06 datum level [-84..-42 langkah 6] (= analisis D-136).

## Keputusan untuk dikukuhkan controller
1. Perubahan S79 berlaku untuk gaya datum (acuan PC); gaya galeri tetap mengikuti panel galeri (kecuali grup sumbu W-07 yang struktural).
2. Batang naik signal P-10 ditandai `data-rule="sign"` agar lint 26 (subjek aksen) tidak menghitungnya; signal tidak dipakai bila ada aksen eksplisit.
3. Simpul inti H-07 hanya lewat `group` "core"/"inti" (bukan heuristik nama/derajat); fixture paritas tanpa group = semua ink100, sama dengan acuan (label "Inti" tidak berawalan "Core").
4. H-06 datum: semantik `levels` bilangan bulat berubah dari "N garis berjarak sama" ke aturan matplotlib (jumlah aktual bisa berbeda dari N).

## Permintaan / temuan
- Tidak ada file_requests. Galat tsc benchmark/harness milik baris lain (dicatat saja).
- Tidak ada DB, HKCU, port, suite uji, atau paritas yang dijalankan (D-133).
