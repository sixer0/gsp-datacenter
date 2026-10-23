# S40 coder-execution — engine/chart/family-w2 (I30)

Status: complete (2026-10-23). Skills: backend-execution, dry-run-verify-fix (3 siklus perbaikan visual: tumpang milestone/label rentang Gantt datum, posisi legenda horizon, label tick tepi barcode).

## Berkas (area eksklusif `src/lib/studio/engine/chart/family-w2/`, 8 berkas, 1158 baris)
index.ts (peta `chartFamilyW2` W-06..W-10 + PARAM_IGNORED + `W2_REFERENCE_HEIGHT_MM`), common.ts (kerangka, aksen, kunci tertunda), time.ts (sumbu waktu Indonesia), bump.ts, gantt.ts, barcode.ts, horizon.ts, candlestick.ts. Registrasi: `dispatch.ts` sudah menyebar `chartFamilyW2`; `dispatchCoverage().charts` W-06..W-10 kosong.

## Keputusan
1. Helper inti S32 dipakai (SvgDoc, palet/peran, keyRow, aparatus, guards, niceDomain, ignoredParamKeys, tintHex S11); tidak ada duplikasi.
2. `data-index` = indeks SUBJEK (seri/tugas/jenis kejadian/titik OHLC); posisi dalam subjek di `data-period`/`data-event`/`data-band`, agar lint DATUM-26 (`series#index`) menghitung 1 subjek per seri beraksen (sejalan masalah yang dilaporkan S37).
3. Aksen: medan `accent {point, group, series}` menang, lalu alias `accentPoint/accentGroup/accentSeries`, lalu flag data; > maks -> DATUM-26.
4. Kunci pendek params diabaikan + PARAM_IGNORED (preseden S32/D-63). Kunci tertunda `chart.kind.W-07.todayAt|todayLabel`, `chart.kind.W-08.riskyTypes|highlightWindow` dibaca dan tidak dilaporkan (diminta ke S09).
5. W-06: nilai bukan peringkat unik -> diubah ke peringkat (REPORT `W-06.rank`); datum tanpa aksen = urutan CAT_SERIES PC.
6. W-07: datum = acuan PC (ink900, label mono "M<a>-<b>", grid x, milestone signal di baris sendiri); gallery = milestone di baris tugas sebelumnya (Gambar 8.4). Warna grup ink400/ink700/ink900/ink200. Baris > `rowsInProposal` atas -> REPORT. Angka vs tanggal ISO dicampur -> SCHEMA_INVALID.
7. W-08: median signal hanya datum satu baris (PC); `riskyTypeColour` registri dipakai untuk `riskyTypes`.
8. W-09: baseline = rerata; bh = maks|v|/bands bersama; titik potong disisipkan di tiap batas pita; fold false = offset gantung; negatif = rona limitExceeded; `bands` rentang -> batas bawah; luar 2..3 dan bandLegend false -> REPORT.
9. W-10: OHLC tak lengkap/tak konsisten -> BY_CONSTRUCTION_FAILED `W-10.ohlc`; datum naik berongga/turun penuh (terbaca tanpa warna); y tidak dipaksa nol.

## Bukti
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/engine/chart/family-w2"` -> kosong (exit 1); total repo 21 galat, semua di luar area.
- `npx eslint src/lib/studio/engine/chart/family-w2` -> exit 0.
- Asap (skrip scratchpad, `renderChart`): 14 render (komposit galeri 5 panel bm-fig-20, 5 datum, data PC W-06/07/08, tanggal ISO W-07/W-10, risky W-08, 3 pita offset W-09, nilai mentah W-06) semua deterministik (SVG identik 2x) dan 0 FAIL lint; 4 jalur galat sesuai (W-10.ohlc, SCHEMA_INVALID campuran, SCHEMA_INVALID bentuk, DATUM-26). Raster diperiksa visual.

## Permintaan (file_requests.md, 4 baris S40)
S09 ParamDef kunci tertunda; S32 tinggi acuan W-06/07/08 + alias `accentSeries`/`accent.point` di inti; S94 kunci pendek bm-fig-20 -> kunci registri + aksen Gantt.

## Temuan
- Rona (tint) dihitung keluarga warna sendiri oleh lint (lihat permintaan S35); horizon 4 pita + label aksen dapat mencapai 6 keluarga (lint DATUM-25 akan melaporkan).
- Tanpa `heightMm`, tinggi W-06..W-08 = lebar x 0,5 sampai permintaan S32 diterapkan (CB1 (d)).
