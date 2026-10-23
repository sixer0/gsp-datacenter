# S38 coder-execution — chart K-07..K-12 (family-k2)

Status: complete. Skills: backend-execution, dry-run-verify-fix.

Berkas (semua baru di `src/lib/studio/engine/chart/family-k2/`, 1388 baris): `index.ts` (isi stub S03: `chartFamilyK2` 6 kode; registrasi lewat `CHART_RENDERERS` D01 yang sudah mengimpor peta ini), `common.ts`, `waffle.ts`, `icon-array.ts`, `treemap.ts`, `funnel.ts`, `sankey.ts`, `marimekko.ts`. Helper inti diimpor per berkas core (tanpa duplikasi, tanpa siklus dispatch).

Penjaga: `npx tsc --noEmit -p tsconfig.json | grep family-k2` kosong (grep exit 1); `npx eslint src/lib/studio/engine/chart/family-k2` exit 0.
Asap (tsx, scratchpad): 6 panel bm-fig-19 x 2 gaya = 12 OK, deterministik (2 render identik), lint inti 0 FAIL; komposit 6 panel K: 6 `data-panel`, 0 FAIL; 10 kasus galat menghasilkan kode yang diharapkan (SCHEMA_INVALID, DATUM-26, K-08, K-11 siklus, `chart.kind.K-11.maxLevels`). PNG 300 dpi diperiksa visual terhadap image9 (Gambar 8.3).

Keputusan (perlu dicatat controller):
1. Parameter: kunci penuh `chart.kind.<KODE>.<nama>` menang; nama pendek di `spec.params` diterima sebagai alias kunci registri kode itu (spec galeri S94 memakai `grid`, `labelsInside`, `stageValues`, `conversionPercent`). Kunci lokal tanpa ParamDef: K-08 `grid`/`icon`/`caption`, K-11 `accentLink`, K-12 `widths`. Selain itu `PARAM_IGNORED` REPORT.
2. K-07 `grid` menerima "RxC" (registri) dan [R, C] (galeri). Kotak = sisa terbesar; tidak bulat -> REPORT K-07.
3. K-08 satu ikon satu unit (katalog), bukan lingkaran proporsional acuan PARSIAL; nilai non-bulat atau > 100 unit -> defect K-08. Ikon primitif SVG person/circle/square.
4. K-09 gaya datum = squarified (Bruls 2000) dua tingkat, urut nilai menurun; gaya gallery = kolom per grup + tumpuk urutan data (susunan panel Gambar 8.3). Acuan PC slice-dice: beda geometri, cek CB1 (jumlah/warna/label) tidak terpengaruh.
5. K-10 gaya datum: tanpa aksen eksplisit, tahap terakhir beraksen (PC:661).
6. K-11 tata letak: Kahn (indeks terkecil), tingkat jalur terpanjang, kolom berjarak sama, k = min per kolom, pita Bezier kubik; pita ink200/signal `fill-opacity` 0,55 (bukan gradien).
7. K-12 `data-index` = indeks SERI (+ `data-category`) agar aksen seri = 1 subjek di lint 26 inti.

Temuan:
- F-S38-01 (K-11 benchmark): RAB tercetak 100, cabang 16+30+50 = 96. Digambar apa adanya (simpul RAB 100, ruang kosong 4 di bawah pita), REPORT `K-11.balance`: "simpul RAB: nilai 100, aliran keluar 96 (selisih 4); total per tingkat T0 100, T1 96". Tidak dinormalisasi.
- F-S38-02 (info, area S32): lint 26 inti menghitung subjek per `series#index`; keluarga dengan aksen seri lintas kategori (mis. P-03 di S33) akan FAIL DATUM-26 palsu. Saran: lint menghitung seri penuh sebagai satu subjek. Bukan penghalang.
- Kunci metadata spec galeri (`transcription`, `valueLabel`, `fillOrder`, `groupNote`, `labelNote`, `seriesNames`) dilaporkan `PARAM_IGNORED` sesuai D-58.

Permintaan lintas pemilik: tidak ada.
