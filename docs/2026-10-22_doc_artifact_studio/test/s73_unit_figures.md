# S73 Uji unit figures (diagram, simbol, chart)

Baris: S73 (fase final G3). Agen: test-expert. Skills: tdd. Tanggal: 2026-10-23.
Status: complete. Hasil: 361 lulus, 0 gagal, 0 dilewati di 6 berkas.

## 1. Strategi uji

- Lingkup:
  - `src/lib/studio/engine/diagram/**`: core S26, layout-a/b/c S27-S29, build S30.
  - `src/lib/studio/engine/symbols/**` (S31).
  - `src/lib/studio/engine/chart/**`: core S32, keluarga S33-S43, dan resolver IP-25.
  - `src/lib/studio/registry/charts.ts`.
- Pengecualian:
  - Paritas byte terhadap Python. Ini milik S76-S79, dan suite ini tidak menjalankan VENV.
  - Komposit bm-fig-17..21. IP-02 sedang mengubah spec-nya.
  - DB, jaringan, dan soffice. Tidak dipakai sama sekali.
- Runner: Vitest 4.1.11. Konfigurasi `vitest.config.ts` (include `tests/**/*.test.ts`, environment node, alias `@` ke `src`). Tidak ada konfigurasi cakupan di repo, jadi cakupan baris tidak diukur.
- Fixture:
  - Spec diagram 9 keluarga dan spec chart 46 kode diambil dari `tests/parity/fixtures/{diagram,chart}` milik S63. Berkas ini hanya dibaca.
  - `fixtures/bad_cases.json` adalah salinan HS `fixtures_diagram/bad_cases.json`. Hash sha256 `281e29f9...0051` identik dengan acuan, dan penjaga drift mengujinya ulang setiap kali berjalan.
  - `fixtures/chart_extra_panels.json` adalah salinan beku 13 panel galeri S94 dari bm-fig-17..21 per 2026-10-23. Panel ini mengisi 12 kode yang tidak punya fixture paritas, ditambah K-08 (lihat F-S73-1).
- Klaim berkas: `delegation_progress/file_claims.md` mendapat 2 baris S73. Penambahan ini aditif.

## 2. Berkas uji (`tests/unit/studio/figures/`)

| Berkas | Isi | Lulus | Gagal |
|---|---|---|---|
| `diagram-bad-cases.test.ts` | 17 bad_cases Garis A: build release=true, pesan memuat `expect`, checkId dipatok, selisih prefiks E-17, tahap spek vs build, tanpa mutasi, deterministik, penjaga drift HS | 40 | 0 |
| `diagram-families.test.ts` | 9 keluarga (10 spec): build sah, aparatus, jumlah `data-mark`, determinisme, hop persilangan (unit + build), gerbang rilis labels_verified, Mermaid DATUM-31, JSON_MALFORMED, edges hilang, multi-bus sld (D-89) | 26 | 0 |
| `symbols.test.ts` | 41 simbol: render, viewBox `0 0 24 24`, 24 mm, `data-symbol`, determinisme, keunikan, port 0..24 mm, alias Rev F dan huruf besar, SCHEMA_INVALID, lembar 4 dialek (166 x 247), cols tidak sah | 104 | 0 |
| `chart-params.test.ts` | Resolver D-87/D-108: kunci penuh menang, PARAM_ALIAS, PARAM_IGNORED (nilai buruk, null, kode lain, asing), accent.* dilipat, petunjuk data per kode, bentuk alternatif, integrasi renderChart | 21 | 0 |
| `chart-lint.test.ts` | DATUM-28 (toleransi 1e-3 pt), DATUM-25 (keluarga warna dan rona), DATUM-26 (kunci subjek group/series/index/rule), tinggi acuan 22 kode, penjaga titik panggil (G2, N1, DATUM-10/30/33/36, dec), CHART_KIND_UNKNOWN, 18 kode CHART_KIND_NOT_DRAWN | 50 | 0 |
| `chart-smoke.test.ts` | Registri 76/58/18 dan 99 ParamDef (87+12); asap 58 kode tergambar x 2 gaya (datum, gallery): 0 FAIL, deterministik, akar dan lebar sesuai, XML berimbang, 7 cek lint dijalankan; fixture paritas k08 ditolak | 120 | 0 |
| `_helpers.ts`, `fixtures/*.json` | Pemuat fixture, pemeriksa keseimbangan XML, `catchErr`/`checkIdOf` | - | - |

## 3. Inventaris kasus

### 3.1 17 bad_cases

Semua kasus dibangun dengan release=true. Semua melempar `BY_CONSTRUCTION_FAILED`, dan setiap pesan memuat `expect`.

| # | Kasus | expect | checkId aktual | Tahap |
|---|---|---|---|---|
| 1 | width_mm 150 | width_mm | P1-width_mm | spek |
| 2 | title tanpa titik | title | P1-title | spek |
| 3 | konektor tanpa label | DATUM-24 | DATUM-24 | spek |
| 4 | dua aksen | DATUM-26 | DATUM-26 | spek |
| 5 | glif tanpa KUNCI | DATUM-34 | DATUM-34 | spek |
| 6 | dua dialek | DATUM-35 | DATUM-35 | spek |
| 7 | sld tanpa bus | E-17 | E-17 (berprefiks, lihat 7) | build |
| 8 | keluarga mindmap | family | P1-family | spek |
| 9 | sumber kosong | sumber | P1-sources | spek |
| 10 | simpul tak dikenal | tak dikenal | DATUM-24 | spek |
| 11 | diamond buntu | keluaran berlabel | P3-diamond-exits | spek |
| 12 | 6 warna | DATUM-25 | DATUM-25 | build |
| 13 | tinggi 323,85 mm | DATUM-33 | DATUM-33 | build |
| 14 | col 20 | DATUM-37 | DATUM-37-lebar | build |
| 15 | dinding | DATUM-32 | DATUM-32 | build |
| 16 | bentuk star | bentuk | P1-nodes+P3-shapes | spek |
| 17 | jenis telepathy | jenis konektor | DATUM-24 | spek |

Tahap: 12 kasus ditolak `validateSpec` (FAIL pertama = checkId di atas, pesan = pesan `assertValidSpec`). 5 kasus lolos validasi spek (14 cek `ran`) lalu ditolak saat build.

### 3.2 Keluarga diagram

flow (2 spec), graph, layered, rack, sequence, sld, stack, swimlane, topology: semua build berhasil dengan release=true dan `issues` kosong. Hasil pengecekan per spec:
- `widthMm` sama dengan `width_mm`.
- Tinggi tidak melebihi 247 mm.
- `data-mark="node"` = jumlah simpul dan `data-mark="link"` = jumlah konektor.
- Aparatus page memuat `DATUM-APPARATUS-REQUIRED`; aparatus figure memuat SUMBER.

Hop: spec graph 4 simpul menghasilkan `nHops` = 1 dan tepat satu busur `A 0.9 0.9 0 0 1`.

### 3.3 Chart asap

58 kode x 2 gaya = 116 render, 0 FAIL, semuanya deterministik (SVG dan laporan identik pada render kedua). REPORT yang muncul:
- DATUM-36 (aparatus page), di semua render.
- PARAM_ALIAS (K-12).
- K-11.balance.
- H-08-FLATTEN.
- `chart.kind.W-09.bandLegend`.
- `chart.kind.G-01.standardAbbrev`.
- KT-12 (G-02, G-03).

## 4. Cakupan dan celah

- Tertutup: 17/17 bad_cases, 9/9 keluarga, 41/41 simbol dan 4/4 lembar dialek, 58/58 kode tergambar, 18/18 kode tidak tergambar, 22/22 entri tinggi acuan.
- Celah 1: cakupan baris tidak diukur karena repo tidak punya `@vitest/coverage-*`. Remediasi: tambahkan penyedia cakupan lewat pemilik `package.json`.
- Celah 2: komposit (`renderComposite`) hanya teruji tidak langsung. Remediasi: uji komposit setelah IP-02 selesai menormalisasi bm-fig-17..21.
- Celah 3: spec galeri dibekukan, jadi perubahan IP-02 tidak tercermin di sini. Hal ini disengaja demi stabilitas.

## 5. Cara menjalankan

```
npx vitest run tests/unit/studio/figures
```

Keluaran segar (2026-10-23 01:53), tiga kali berturut-turut dengan hasil sama:

```
 RUN  v4.1.11 C:/Users/TRIAL/gsp-swarm-hq-v2.1
 Test Files  6 passed (6)
      Tests  361 passed (361)
   Duration  5.64s (transform 1.83s, setup 0ms, import 4.13s, tests 425ms, environment 1ms)
```

Hitungan per berkas (`--reporter=json`): `total 361 passed 361 failed 0 success true`. Rinciannya: chart-lint 50, chart-params 21, chart-smoke 120, diagram-bad-cases 40, diagram-families 26, symbols 104 (semua 0 gagal, 0 dilewati).

Penjaga tambahan:
- `npx eslint tests/unit/studio/figures` menghasilkan exit 0.
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep tests/unit/studio/figures` kosong (exit 1). tsconfig mencakup `**/*.ts`.

## 6. Catatan CI

- Tidak ada uji flaky: tanpa jam, acak, jaringan, atau DB. Determinisme diuji eksplisit.
- Penjaga drift HS (`it.skipIf`) dilewati otomatis bila folder HS tidak ada di mesin CI. Uji lain tidak bergantung pada HS.
- Suite membaca `tests/parity/fixtures/**` (milik S63). Bila korpus itu berubah, kegagalan di sini adalah sinyal yang disengaja.
- Saat run pertama, 2 asersi yang salah ditulis di sisi uji sudah diperbaiki:
  - Pembagian spek/build yang benar adalah 12/5, bukan 11/6.
  - Pola kunci ParamDef ternyata memuat nama bertitik dan berangka (`limitLine.labelled`, `box50`).

  Keduanya bukan bug produksi.

## 7. Temuan (D-19, tidak menghentikan)

- F-S73-1 (fixture, bukan bug produksi): `tests/parity/fixtures/chart/k08.json` berisi 400+170+90+28 = 688 unit. Renderer menolaknya dengan `BY_CONSTRUCTION_FAILED` checkId K-08 di `src/lib/studio/engine/chart/family-k2/icon-array.ts:61-62` (`MAX_ICON_UNITS` = 100, baris 36). Penolakan ini sesuai katalog: K-08 "hindari jumlah besar" dan menyarankan K-07.
  - Akibatnya, fixture ini tidak bisa dirender TS dan akan gagal di paritas CB2.
  - Pemilik: S63 (korpus) dan S78 (paritas chart). Saran: kecilkan data ke 100 unit atau kurang.
  - Uji `chart-smoke` mematok penolakan ini. Asap K-08 memakai panel galeri bm-fig-19 (10 unit).
- F-S73-2 (selisih diketahui, D-106): kasus E-17 dilempar `src/lib/studio/engine/diagram/layout-c/sld.ts:105-107` lewat `diagramDefect()` di `layout-c/geometry.ts:30-31` (pemilik S29).
  - Bedanya dengan 16 kasus lain: pesan berprefiks `DIAGRAM DEFECT: `, dan kelas galat `StudioEngineError` biasa, bukan `DiagramDefect`. `checkId` tetap ada di `details`.
  - Substring `expect` tetap cocok. Uji mematok bahwa hanya kasus ini yang berprefiks.
- Bug produksi baru: tidak ada.

## 8. Rekomendasi

1. Selaraskan `k08.json` (F-S73-1) sebelum S78 menjalankan paritas CB2.
2. Bila prefiks layout-c diseragamkan dengan `DiagramDefect`, ubah asersi `KNOWN_PREFIX_CASE` di `diagram-bad-cases.test.ts` menjadi daftar kosong.
3. Tambahkan uji komposit setelah IP-02 selesai.

## Berkas yang ditulis S73

- `tests/unit/studio/figures/{_helpers.ts, diagram-bad-cases.test.ts, diagram-families.test.ts, symbols.test.ts, chart-params.test.ts, chart-lint.test.ts, chart-smoke.test.ts}`
- `tests/unit/studio/figures/fixtures/{bad_cases.json, chart_extra_panels.json}`
- `docs/2026-10-22_doc_artifact_studio/test/s73_unit_figures.md` (berkas ini)
- `docs/2026-10-22_doc_artifact_studio/delegation_progress/file_claims.md`: 2 baris aditif

Kode produksi dan `benchmark/manual000/figures/**` tidak diubah. Benchmark hanya dibaca satu kali untuk membekukan 13 panel.
