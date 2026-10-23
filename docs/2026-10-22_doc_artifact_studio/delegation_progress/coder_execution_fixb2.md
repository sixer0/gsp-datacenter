# coder-execution FIX-B2: tinggi diagram bm-fig-38 (sld), bm-fig-06 (layered), bm-fig-08 (graph) ke ukuran BM (D-277, D-242)

Status: complete (2026-10-23), sisa terbuka bm-fig-08 (+21,9 mm, butuh keputusan; lihat Sisa). Skill: diagnosing-bugs, dry-run-verify-fix. Klaim: baris FIX-B2 di `file_claims.md`. Salinan sumber garis dasar dipindah ke luar repo (`C:/Users/TRIAL/AppData/Local/Temp/fxb2/baseline_src/`, mediasi D-284).

## Diagnosis

| Figur | Akar | Bukti |
|---|---|---|
| bm-fig-38 sld 61,9 mm (BM 101,4) | Bukan salah terap K-1 pada geometri rel: rel tetap `2 x LATTICE_Y`, langkah cabang 2 baseline. Nilai 100,013 mm sebelum K-1 adalah kebetulan: spec IP-42c DISETEL ke kuirk lama (catatan spec lama "tinggi 109,537 -> 100,013 mm"). Spec 4 simpul, 2 tingkat (rel + 1 baris) TIDAK setia isi BM: raster acuan memuat 13 elemen dalam sekitar 8 tingkat, termasuk rel hilir UPS -U1 dengan 3 pengumpan (-Q3 ke Kamera, -Q4 ke Radar, -Q5 ke Radio) yang dibuang IP-02 (catatan spec lama sendiri mendaftar elemen yang dibuang). Spec dengan rel hilir ditolak mesin `E-17/MULTI-BUS` karena kontrak v2 membuang `sld.multiBus` (DiagramSpecV2, `contract/schema/v2/common.schema.ts:149`), dan rute simpul -> rel terbalik (warisan Python `_side_of` :869-870). | `assets/image26__simbol12.png`; catatan IP-02/IP-42c spec garis dasar |
| bm-fig-06 layered -25,7 | Jarak antartingkat mesin 2 baseline; BM (digambar `datum_diagram.py keluarga layered`) 280 px = 5 baseline = rem pita 1 + koridor label 3 (169 px di antara garis pita) + rem pita 1, sama di kedua celah. | `assets/image4__g21.png` 1961 px = 166 mm, 1 baseline = 56,3 px; simpul tingkat 0 y 55..338, tingkat 1 y 618..900; garis pita y 393/562/955/1125 |
| bm-fig-08 graph +26,7 | Simpul label + sub mesin 4 baseline, BM 3 (168-169 px); koridor antarbaris mesin 2 baseline, BM 3 (169 px). Sisa: tepi atas lembar 2 baseline + tepi bawah 2 baseline + baris KEY dalam SVG = 23,8 mm; BM tanpa tepi dan tanpa KEY dalam gambar. | `assets/image5__g31.png` tinggi 529 px; baris 0 y 0..168, baris 1 y 337..506 |

## Perubahan (aturan per JENIS, tanpa pengecualian per figur, D-139)

| Berkas | Ubah | Isi |
|---|---|---|
| `src/lib/studio/engine/diagram/core/geometry.ts` | modify | `nodeSize(n, L, tierNodes?, padUnits = NODE_PAD_UNITS)`; bawaan 2 = aturan K-1 tidak berubah |
| `src/lib/studio/engine/diagram/layout-c/graph.ts` | modify | `GRAPH_NODE_PAD_UNITS = 1` (simpul = baris teks + 1 baseline), `GRAPH_ROW_GAP_BASELINES = 3` (koridor antarbaris) |
| `src/lib/studio/engine/diagram/layout-a/layered.ts` | modify | `LAYERED_TIER_GAP_BASELINES = 5` hanya keluarga `layered`; topology/stack (berbagi mesin, tanpa pita tingkat) tetap 2 |
| `src/lib/studio/engine/diagram/layout-c/sld.ts`, `layout-c/index.ts` | modify | rel tambahan yang SEMUANYA rel hilir (dicatu edge `cabang -> rel` dari cabang rel berindeks lebih kecil) ditumpuk dengan rumus multi-rel D-89 tanpa opt-in; rel tak tercatu tetap `E-17/MULTI-BUS` (pesan menyebut rel); satu rel = jalur lama bit-identik |
| `src/lib/studio/engine/diagram/build/route.ts` | modify | `sideOf`: edge simpul -> rel keluar dari sisi simpul yang menghadap rel (perbaikan pembalikan warisan Python) |
| `benchmark/manual000/figures/specs/bm-fig-38.diagram.json` | modify | D-137 opsi D: 8 simpul (rel MDP + -F1 SPD, -Q2 ke UPS -U1 / sub "blok fungsi", -Q6 penerangan; rel hilir UPS -U1 + -Q3 ke Kamera, -Q4 ke Radar, -Q5 ke Radio), 7 edge, `width_mm` 166 (= BM, B-2), label = teks acuan satu baris; catatan selisih tersisa (rantai PLN/G/-Q0/-Q1 tetap tag rel; -Q2 + UPS satu simpul; jalur cadangan G tidak tergambar) |
| `benchmark/out/fixb2/{probe_all,raster,probe_paper}.ts` | add | probe tinggi + SVG, raster inspeksi, probe grid kertas (salinan FIX-B) |

Spec bm-fig-06 dan bm-fig-08 TIDAK diubah: isi (simpul, tingkat/baris) sama dengan BM.

## Tinggi 6 diagram Manual 000 (166 mm; `npx tsx benchmark/out/fixb2/probe_all.ts`)

| Figur | Keluarga | BM | Sebelum (Δ) | Sesudah (Δ) |
|---|---|---|---|---|
| bm-fig-06 | layered | 125,706 | 100,013 (-25,7) | 128,587 (+2,9) |
| bm-fig-08 | graph | 44,780 | 71,437 (+26,7) | 66,675 (+21,9) |
| bm-fig-23 | topology | 110,329 | 119,062 (+8,7) | 119,062 (+8,7), SVG byte-identik |
| bm-fig-24 | swimlane | 78,951 | 85,725 (+6,8) | 85,725 (+6,8), SVG byte-identik |
| bm-fig-25 | rack | 112,938 | 123,825 (+10,9) | 123,825 (+10,9), SVG byte-identik |
| bm-fig-38 | sld | 101,358 | 61,912 (-39,4) | 104,775 (+3,4) |
| jumlah abs Δ | | | 118,2 | 54,6 |

## Paritas fixture diagram (SVG Node, `probe_before` vs `probe_step2`, `cmp`)

SAME 9: dg_flow, dg_flow_wrapped, dg_rack, dg_sequence, dg_sld_good, dg_stack, dg_swimlane, dg_topology, garis_a/good_sld. BERUBAH 2 (D-242 + aturan graph dari BM g31): dg_graph 71,437 -> 66,675; dg_graph_hops 119,062 -> 114,300. dg_layered_good dan garis_a/good_layered: NODE_ERROR DATUM-25 pra-ada, sebelum = sesudah (D-137). doc_serah_handover (sld satu rel, tanpa edge simpul -> rel): jalur tidak berubah.

## Run resmi `benchmark/out/fixb2/official`

Perintah: `run_benchmark.ts --schema v2 --official --with-diagnosis-raster --out benchmark/out/fixb2/official` (konsol `official_console.log`).

- Vonis FAIL exit 1; langkah semua OK; figur mesin 15, raster 37, hilang 0; durasi 66 s; DOCX `0bd13ade…`.
- BM1 PASS 100 % (4544/4544); BM2 PASS halaman **102/102** (bab 17/17, lampiran 4/4, tabel 151/151, gambar 52/52); BM3 FAIL **97/102** (beda hlm 12, 13 = bm-fig-08; 18 = F-033; 19, 20 = K-2); BM4 **PASS 0,9639** (min 0,6354; sebelumnya FAIL 0,7864).
- Diagnosis raster: BM2 102/102, BM3 99/102 (18, 19, 20), BM4 0,9929.
- Hlm 9/10 (bm-fig-06) dan hlm 60-102 (bm-fig-38, offset +1) pulih.

## Verifikasi

- Vitest `tests/unit/studio/figures tests/unit/studio/engine-core`: 673 lulus / 1 gagal (`chart-smoke`, registri chart 136 vs 133, luar area); termasuk uji D-89 `E-17/MULTI-BUS` dan semua `diagram-bad-cases`. `tests/unit/studio/renderers`: 143/143.
- Probe grid kertas `benchmark/out/fixb2/probe_paper.txt` vs `benchmark/out/fixb/probe_paper.txt`: A4/A5/Letter himpunan OK/DEFECT sama, hanya tinggi bm-fig-06/08/38 berubah; DATUM-28 berjalan, huruf min 5,90 pt; non-A4 tanpa grid tetap ditolak P1-width_mm.
- `npx tsx benchmark/manual000/figures/tools/validate_figures.ts`: build 11/11 (bm-fig-38 pada 166); 3 gagal PARAM_ALIAS chart bm-fig-17/21 (luar area).
- DOCX v1 `render_cli.ts --doc doc.json --template template.json --formats docx` -> `53485ebc1eddd145…` tetap.
- `npx tsc --noEmit -p tsconfig.json` exit 0, 0 galat (repo). `npx eslint src/lib/studio/engine/diagram benchmark/out/fixb2/probe_all.ts benchmark/out/fixb2/raster.ts` exit 0.
- Aturan DATUM tidak diubah (DATUM-25/32/33/37 utuh).

## Sisa dan permintaan

| Isu | Akar | Status |
|---|---|---|
| bm-fig-08 +21,9 mm (hlm 12/13 BM3) | tepi lembar 2 + 2 baseline dan baris KEY SVG = 23,8 mm, semua konvensi lintas keluarga; BM g31/g21 tanpa tepi atas dan tanpa KEY dalam gambar | butuh keputusan controller: (a) KEY ganda: halaman mencetak keyRow "KUNCI" DAN SVG mencetak "KEY" untuk bm-fig-06/08 (blok doc.v2 punya keyRow, spec punya legend); mesin tidak tahu apakah halaman mencetak keyRow (milik compose/render, luar area); bila KEY SVG dibuang saat keyRow ada: bm-fig-08 61,9, bm-fig-06 123,8; (b) tepi atas lembar 0 untuk graph: -9,5 mm, tetapi zona P5 (y - 2 baseline) keluar lembar, jadi tidak dikerjakan |
| `benchmark/manual000/figures/tools/diagrams.py` `g1012` dan `blocks/bm-fig-38.block.json` (spec tertanam 4 simpul, widthMm 128) usang terhadap spec baru | generator/blok luar area | permintaan ke pemilik generator S94/IP-45 agar diselaraskan (runner v2 membaca `specs/` lewat `index.json`; run tidak terdampak) |
| BM3 tetap < 100/102 walau bm-fig-08 pulih | F-033 + K-2 (D-277 KONFLIK BM3) | keputusan user tertunda |

Review direkomendasikan: `engine/diagram/layout-c/sld.ts` (rel hilir tanpa opt-in = perluasan D-89), `build/route.ts` (sideOf), konstanta keluarga graph/layered.

## Lanjutan D-288: baris KUNCI satu aparatus (2026-10-23)

Aturan umum: bila compose mencetak keyRow halaman untuk figur diagram, mesin tidak menggambar baris KEY di dalam SVG; legenda tetap di spec (DATUM-34 membacanya). Tanpa keyRow halaman = perilaku lama.

| Berkas | Ubah | Isi |
|---|---|---|
| `src/lib/studio/services/compose/blocks.ts` | modify | `diagram()`: blok ber-`keyRow` (spec inline, bukan artifactId) -> spec terkomposisi `keyRowOnPage: true` |
| `src/lib/studio/engine/diagram/core/sheet.ts`, `core/index.ts` | modify | `DiagramPageKeySignal`, `keyRowOnPage()`, `drawsSvgKeyRow()`; `footLines` memakainya |
| `src/lib/studio/engine/diagram/core/colour.ts`, `build/svg.ts` | modify | warna kaki dan baris KEY dari `drawsSvgKeyRow` (estimate = build) |
| `tests/unit/studio/figures/diagram-keyrow-page.test.ts` | add | 5 uji: tanda compose ada/tidak; tanpa keyRow KEY tetap digambar; dengan keyRow KEY hilang dan tinggi -1 baseline; estimate = build; apparatus figure |

Catatan kontrak: `keyRowOnPage` di luar skema `studio.diagram/v1` (additionalProperties false); hanya dipasang compose pada spec internal, tidak pernah dari agen, dan tidak divalidasi ulang di jalur render (run resmi ingest -> compose -> render OK). Permintaan ke pemilik kontrak: tambahkan medan opsional ini ke `contract/types/diagram.ts` + `schema/diagram.schema.ts` bila spec terkomposisi kelak divalidasi.

| Figur | BM | FIX-B2 | D-288 | KEY SVG |
|---|---|---|---|---|
| bm-fig-06 | 125,706 | 128,587 (+2,9) | 123,825 (-1,9) | tidak (keyRow halaman) |
| bm-fig-08 | 44,780 | 66,675 (+21,9) | 61,912 (+17,1) | tidak (keyRow halaman) |
| bm-fig-23 / 38 | 110,329 / 101,358 | 119,062 / 104,775 | sama | ya (tanpa keyRow halaman) |
| bm-fig-24 / 25 | | | sama | tanpa legenda |

- Paritas fixture diagram (`probe_step2` vs `probe_step3`, `cmp`): SAME 17/17 (fixture mentah tanpa sinyal compose).
- Run resmi `benchmark/out/fixb2/official2`: BM1 PASS 100 % (4544/4544); BM2 PASS halaman 102/102; BM3 FAIL 97/102 (beda hlm 12, 13 = bm-fig-08 +17,1; 18 = F-033; 19, 20 = K-2); BM4 PASS 0,9641. Diagnosis raster: BM3 99/102, BM4 0,9929.
- DOCX v1 `53485ebc1eddd145…` tetap; `npx vitest run tests/unit/studio` 1981 lulus / 0 gagal (304 suite); tsc repo 0; eslint area + compose + uji 0.
- Sisa bm-fig-08 +17,1 mm = tepi lembar 2 + 2 baseline (margin atas 0 DITOLAK D-288); hlm 12/13 tetap beda.

## Siklus 3 D-290: lembar graph = kotak pembatas semua unsur + 1 baseline (2026-10-23)

- `build/svg.ts`: `graphFit` (keluarga graph saja): kotak pembatas vertikal simpul, titik rute, pita knockout label (`labelPos`), zona (+/- 2 kisi); isi digeser kelipatan kisi agar tepi atas = `GRAPH_SHEET_PAD_BASELINES` (1) baseline (geser negatif = turun bila zona di atas); H = tepi bawah isi (snapCeil kisi) + kaki aparatus + 1 baseline; baris kaki dari tepi isi (= posisi Garis A). Cek otomatis `assertInsideSheet`: semua y/y1/y2/cy, tepi bawah rect, dan titik M/L jalur di SVG keluaran berada di [0, H], selain itu `DATUM-37-tinggi` BY_CONSTRUCTION_FAILED. `core/sheet.ts`: `Sheet.fixHeight` (akar SVG = H pas). Keluarga lain tidak berubah.
- Uji `tests/unit/studio/figures/diagram-keyrow-page.test.ts` +3 (tepi atas 1 baseline + tinggi akar; zona baris teratas di dalam lembar; topology tetap 2 kisi); estimate = build kini diuji pada topology (estimate tidak merute, jadi tidak memodelkan penyesuaian graph).

| Figur | BM | D-288 (official2) | D-290 (official3) |
|---|---|---|---|
| bm-fig-08 graph | 44,780 | 61,912 (+17,1) | 52,387 (+7,6) |
| bm-fig-06 layered | 125,706 | 123,825 | 123,825 |
| bm-fig-23 topology | 110,329 | 119,062 | 119,062 |
| bm-fig-24 swimlane | 78,951 | 85,725 | 85,725 |

- Paritas fixture (`probe_step3` vs `probe_step4`): SAME 14; BERUBAH 3, semua graph (D-242/D-290): bm-fig-08 (probe tanpa keyRow) 66,675 -> 57,150; dg_graph 66,675 -> 57,150; dg_graph_hops 114,300 -> 104,775 (aparatus figure, caption/KEY/SUMBER di dalam lembar, raster diperiksa).
- Run resmi `benchmark/out/fixb2/official3`: BM1 PASS 100 % (4544/4544); BM2 PASS halaman 102/102; **BM3 99/102** (gagal hanya hlm 18 F-033, 19, 20 K-2; **hlm 12-13 lulus**); BM4 PASS 0,9671. Diagnosis raster: BM3 99/102, BM4 0,9929.
- DOCX v1 `53485ebc1eddd145…` tetap; tsc repo 0; eslint (diagram, compose/blocks.ts, uji) 0; `npx vitest run tests/unit/studio` 1986 lulus / 1 gagal = `figures/diagram-keyrow-schema.test.ts` milik FIX-Z (baru, paralel): `studioValidator` untuk `studio.doc/v2.json#/$defs/DiagramSpecV2` "is not registered in ajv" (rujukan skema di uji itu, bukan mesin diagram).
