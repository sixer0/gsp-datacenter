# S78: Paritas diagram (9 keluarga) dan simbol (41) - Python Garis A lawan Node

- Baris: S78 (`identification/02_structured.md:226`, profil `:337`), fase G4 final. Agen: test-expert. Skill: tdd.
- Tanggal run: 2026-10-23 (cap waktu harness UTC 2026-10-22T18:49Z dan 18:52Z).
- Area tulis: laporan ini dan `tests/parity/out/s78/**`. Kode produksi, harness `scripts/parity/**`, dan korpus `tests/parity/fixtures/**` tidak diubah. `git status` setelah run tidak menunjukkan perubahan pada `src/lib/studio`, `scripts/parity`, atau `tests/parity/fixtures`. Tidak ada DB.
- Masukan yang dibaca: `02_structured.md` S78; `research/06_chart_map_parity_matrix.md` §6.2 baris DG/SY (`:258-259`) dan §6.4-N5 (`:313-316`); D-41, D-42, D-89, D-106, D-113; F-050, F-052; `coder_execution_{s30,s65,s66,int_j}.md`; kode harness `scripts/parity/run/**` dan `scripts/parity/compare/**`. Tidak ada berkas README di `scripts/parity/**`, jadi docstring modul dipakai sebagai acuan.

## Ringkasan

| Cakupan | Hasil mentah harness | Setelah penanganan F-050 (sisi pembanding) | Vonis S78 |
|---|---|---|---|
| Diagram, 10 fixture kontrak (9 keluarga) | SVG 4 PASS / 6 FAIL; PNG 10/10 PASS; 2 NODE_ERROR (salinan sumber `garis_a/`) | SVG 9 PASS / 1 FAIL (`b.colorMax`, positif palsu harness); 10/10 SVG byte-identik dengan Python | 9/10 PASS; 1 FAIL milik harness (F-S78-1), bukan cacat port |
| Simbol 41 | SVG 41/41 PASS, PNG 41/41 PASS | F-050 tidak berlaku (kelas SY tidak memakai `markCountDelta`) | 41/41 PASS; port 123/123 identik |
| Lembar simbol per dialek (4) | SVG 4/4 PASS, PNG 4/4 PASS, jumlah lembar 1/1 per dialek | - | 4/4 PASS |

Port Node setara dengan acuan Python Garis A untuk seluruh 9 keluarga diagram dan 41 simbol. Setelah atribut tanda Node dibuang, SVG diagram byte-identik dengan Python di 10/10 fixture, geometri maks 0,0 mm, dan laporan engine (`checks_run`, jumlah simpul, edge, hop, warna) identik di 10/10. Tiga cek gerbang masih gagal, dan ketiganya berasal dari harness:

- `markCount` (F-050);
- `colorMax` (F-S78-1);
- penemuan fixture `garis_a` (F-S78-2).

## 1. Strategi uji

- Acuan: Python VENV hermes 3.11.15 dengan `-I -B` (`scripts/parity/run/lib/python.ts:14, :69`). Skill DATUM dibaca saja: `find <HS> <RL> -newer harness_log.jsonl -type f` mengembalikan 0 berkas. Folder `__pycache__` di HS sudah ada sebelum run dan tidak berubah.
- Node: `buildDiagramSvg(spec, {release:false})` (`scripts/parity/run/lib/render.ts:675`), `symbolSvg` / `symbolSheetSvg` (`:685-691`). Rasterisasi Chromium 300 dpi.
- Pembanding: `compare.py` kelas DG/SY. Ambang dari `thresholds.py:65-83, :88-89`, sama dengan research/06 §6.2:

| Kelas | SVG | PNG |
|---|---|---|
| DG | tag delta 0, tanda delta 0, himpunan warna identik, warna maks 5, multiset dasharray identik, multiset teks identik, root +/-0,1 mm, geometri +/-0,1 mm | SSIM >= 0,99, diff <= 1 % |
| SY | tag delta 0, himpunan warna identik, multiset tebal garis identik, viewBox identik, root dan geometri +/-0,01 mm | SSIM >= 0,995, diff <= 0,5 % |

- Penanganan F-050 di sisi pembanding, tanpa mengubah harness:
  - Atribut tanda kontrak §3.5 milik Node dibuang dari SVG Node: `data-mark`, `data-series`, `data-index`, plus `data-axis|panel|role|symbol|dialect` bila ada.
  - `data-node` dipertahankan karena Python juga menulisnya.
  - Sesudah itu `compare.py --class DG` dijalankan ulang tanpa `--threshold`.
  - Opsi render `dataMarks:false` ada di core (`src/lib/studio/engine/diagram/core/svg.ts:53, :106`). Opsi itu tidak bisa dipakai lewat harness karena `buildDiagramSvg` hanya menerima `{release}` (`src/lib/studio/engine/diagram/build/index.ts:52`) dan runner tidak meneruskan opsi apa pun (`render.ts:675`). Itu sebabnya jalur strip yang dipakai.
- Cek tambahan untuk butir research/06 yang tidak dicakup `compare.py` (skrip uji di area keluaran, bukan harness):
  - DG: laporan engine Python `engineReport` lawan `DiagramBuildReport` Node, ditambah determinisme dua build (`diagram_report/report_check.ts`).
  - SY: port +/-0,01 mm, `ref_report.portsInMm` lawan `symbolPortsMm` (`symbol_ports/ports_check.ts`).
- Di luar lingkup: chart, dokumen, PDF (baris S76/S77/S79); fixture sumber `diagram/garis_a/*`, yang menurut manifest "bukan fixture kontrak"; versi kontraknya sudah tercakup oleh `dg_layered_good` dan `dg_sld_good`.

## 2. Berkas keluaran

| Path (di bawah `tests/parity/out/s78/`) | Isi |
|---|---|
| `diagram/` | run harness diagram: `summary.{json,md}`, `harness_log.jsonl`, per fixture `ref/`, `node/`, `cmp/{svg,png}.json` |
| `diagram_f050/` | `s78_f050.py` (strip dan banding ulang), per fixture `node_nomarks.svg` + `svg_f050.json`, `f050_summary.json` |
| `diagram_report/` | `report_check.ts`, `report_check.json` |
| `symbol/` | run harness simbol: 45 fixture (41 simbol + 4 lembar) |
| `symbol_ports/` | `ports_check.ts`, `ports_report.json` |

## 3. Perintah dan keluaran

### 3.1 Harness diagram

```
npx tsx scripts/parity/run/run_parity.ts --fixtures tests/parity/fixtures --out tests/parity/out/s78/diagram --only "diagram/**" --formats svg,png
```
```
run_parity: 12 fixture (dari 107; 1 berkas dilewati) -> ...\tests\parity\out\s78\diagram
  [1/12] FAIL          diagram/dg_flow svg=FAIL png=PASS
  [2/12] PASS          diagram/dg_flow_wrapped svg=PASS png=PASS
  [3/12] FAIL          diagram/dg_graph svg=FAIL png=PASS
  [4/12] FAIL          diagram/dg_layered_good svg=FAIL png=PASS
  [5/12] PASS          diagram/dg_rack svg=PASS png=PASS
  [6/12] PASS          diagram/dg_sequence svg=PASS png=PASS
  [7/12] FAIL          diagram/dg_sld_good svg=FAIL png=PASS
  [8/12] FAIL          diagram/dg_stack svg=FAIL png=PASS
  [9/12] PASS          diagram/dg_swimlane svg=PASS png=PASS
  [10/12] FAIL          diagram/dg_topology svg=FAIL png=PASS
  [11/12] NODE_ERROR    diagram/garis_a/good_layered svg=NODE_ERROR png=NODE_ERROR
  [12/12] NODE_ERROR    diagram/garis_a/good_sld svg=NODE_ERROR png=NODE_ERROR
run_parity: {"FAIL":6,"PASS":4,"NODE_ERROR":2} exit=1
real 0m36.778s
```
Gerbang SVG yang gagal (dari `cmp/svg.json`):
```
diagram_dg_flow         FAIL [('a.markCount', 6, 8)]
diagram_dg_graph        FAIL [('a.markCount', 6, 9)]
diagram_dg_layered_good FAIL [('a.markCount', 8, 7), ('b.colorMax', 6, 6)]
diagram_dg_sld_good     FAIL [('a.markCount', 6, 7)]
diagram_dg_stack        FAIL [('a.markCount', 8, 7)]
diagram_dg_topology     FAIL [('a.markCount', 9, 11)]
```
Contoh sumber tanda: `dg_flow_wrapped` lolos hanya karena kebetulan. Keluaran `'ref': {'count': 11, 'source': 'rect (heuristik datumchart)'}, 'node': {'count': 11, 'types': {'link': 5, 'node': 6}, 'source': 'data-mark'}` menunjukkan dua cara hitung yang berbeda menghasilkan angka sama. Ini F-050 yang terkonfirmasi.

### 3.2 Penanganan F-050 (strip tanda Node, banding ulang)

```
<VENV>\python.exe -I -B tests/parity/out/s78/diagram_f050/s78_f050.py tests/parity/out/s78/diagram tests/parity/out/s78/diagram_f050 .
```
Keluaran `compare.py` per fixture, ditambah cek byte-identik setelah komentar generator dibuang:

| Fixture | Keluarga | Atribut dibuang | Sebelum | Sesudah | Tanda ref/Node | Geometri maks dev mm | Byte-identik |
|---|---|---|---|---|---|---|---|
| dg_flow | flow | 20 | FAIL `a.markCount` | PASS | 6/6 | 0.0 | ya |
| dg_flow_wrapped | flow (bungkus) | 27 | PASS | PASS | 11/11 | 0.0 | ya |
| dg_graph | graph | 22 | FAIL `a.markCount` | PASS | 6/6 | 0.0 | ya |
| dg_layered_good | layered | 17 | FAIL `a.markCount`, `b.colorMax` | **FAIL `b.colorMax` (6, 6, ambang 5)** | 8/8 | 0.0 | ya |
| dg_rack | rack | 13 | PASS | PASS | 6/6 | 0.0 | ya |
| dg_sequence | sequence | 20 | PASS | PASS | 8/8 | 0.0 | ya |
| dg_sld_good | sld | 17 | FAIL `a.markCount` | PASS | 6/6 | 0.0 | ya |
| dg_stack | stack | 17 | FAIL `a.markCount` | PASS | 8/8 | 0.0 | ya |
| dg_swimlane | swimlane | 22 | PASS | PASS | 9/9 | 0.0 | ya |
| dg_topology | topology | 27 | FAIL `a.markCount` | PASS | 9/9 | 0.0 | ya |

Keluaran mentah, contoh: `{"format": "svg", "class": "DG", "verdict": "FAIL", "failedGates": ["b.colorMax"], "out": "...diagram_dg_layered_good\\svg_f050.json"}`. Sembilan baris lainnya `"verdict": "PASS", "failedGates": []`.

Upaya pertama sempat membuang semua `data-*`, termasuk `data-node`, dan hasilnya tidak byte-identik karena Python juga menulis `data-node`. Setelah strip dibatasi pada atribut tanda Node, 10/10 SVG byte-identik. Ini mengulang klaim S30 (D-106) di korpus S63.

### 3.3 Laporan engine diagram (cek tambahan)

```
npx tsx tests/parity/out/s78/diagram_report/report_check.ts tests/parity/out/s78/diagram
```
```
{"fixtures":10,"pass":10}
```
`checksRun`, `nNodes`, `nEdges`, `nHops`, `colourValues`, `nColour`, `apparatus`, `family`, dan determinisme bernilai `true` di 10/10 fixture. Contoh layered: py `{"nodes":4,"edges":3,"hops":0,"nColour":5,"checks":20}` = node `{"nodes":4,"edges":3,"hops":0,"nColour":5,"checks":20}`.

### 3.4 PNG diagram

| Fixture | Ukuran px sama | SSIM (asli 300 dpi) | diff % | Vonis (ambang DG: SSIM >= 0,99, diff <= 1 %) |
|---|---|---|---|---|
| dg_flow | ya | 0.9998 | 0.016 | PASS |
| dg_flow_wrapped | ya | 0.9998 | 0.017 | PASS |
| dg_graph | ya | 0.9999 | 0.005 | PASS |
| dg_layered_good | ya | 1.0 | 0.001 | PASS |
| dg_rack | ya | 1.0 | 0.0 | PASS |
| dg_sequence | ya | 0.9999 | 0.001 | PASS |
| dg_sld_good | ya | 0.9999 | 0.001 | PASS |
| dg_stack | ya | 1.0 | 0.001 | PASS |
| dg_swimlane | ya | 0.9999 | 0.001 | PASS |
| dg_topology | ya | 0.9999 | 0.019 | PASS |

`ssim72` (diagnosis, tidak digerbang) bernilai 0,71-0,91 walaupun gambarnya praktis identik. Itu artefak metadata DPI; lihat F-S78-3.

### 3.5 Harness simbol

```
npx tsx scripts/parity/run/run_parity.ts --fixtures tests/parity/fixtures --out tests/parity/out/s78/symbol --only "symbol/**" --formats svg,png
```
```
run_parity: 45 fixture (dari 107; 1 berkas dilewati) -> ...\tests\parity\out\s78\symbol
  [1/45] PASS          symbol/sheet_iec svg=PASS png=PASS
  ...
  [45/45] PASS          symbol/symbols#sec:reader svg=PASS png=PASS
run_parity: {"PASS":45} exit=0
real 2m40.132s
```
Agregat: SVG 45/45 PASS dengan geometri maks dev 0,0 mm. PNG 45/45 PASS dengan SSIM min 0,9977 (`iec:generator`, `iec:transformer`), diff maks 0,489 % (`mil:unknown`), dan ukuran px identik 45/45.

### 3.6 Port simbol (cek tambahan, research/06 SY "port +/- 0,01 mm")

```
npx tsx tests/parity/out/s78/symbol_ports/ports_check.ts tests/parity/out/s78/symbol
```
```
{"symbols":41,"pass":41,"fail":0,"maxDevMm":0,"tolMm":0.01}
```
Total 123 port acuan = 123 port Node, dan tidak ada simbol tanpa port.

## 4. Inventaris vonis

### 4.1 Diagram, per fixture terhadap ambang DG

| Fixture | Keluarga | SVG (setelah F-050) | PNG | Laporan engine | Vonis | Catatan |
|---|---|---|---|---|---|---|
| dg_flow | flow | PASS | PASS | PASS | **PASS** | - |
| dg_flow_wrapped | flow | PASS | PASS | PASS | **PASS** | - |
| dg_graph | graph | PASS | PASS | PASS | **PASS** | - |
| dg_layered_good | layered | FAIL `b.colorMax` | PASS | PASS | **FAIL (harness)** | ref = Node = 6 warna non-PAPER; engine Python `n_colour` 5; byte-identik. F-S78-1 |
| dg_rack | rack | PASS | PASS | PASS | **PASS** | - |
| dg_sequence | sequence | PASS | PASS | PASS | **PASS** | - |
| dg_sld_good | sld | PASS | PASS | PASS | **PASS** | sld 128 mm; batas 166 mm tetap F-052 (ditunda) |
| dg_stack | stack | PASS | PASS | PASS | **PASS** | - |
| dg_swimlane | swimlane | PASS | PASS | PASS | **PASS** | - |
| dg_topology | topology | PASS | PASS | PASS | **PASS** | - |
| garis_a/good_layered | (sumber) | NODE_ERROR | NODE_ERROR | - | tidak dinilai | salah deteksi "symbol". F-S78-2 |
| garis_a/good_sld | (sumber) | NODE_ERROR | NODE_ERROR | - | tidak dinilai | salah deteksi "symbol". F-S78-2 |

Kesembilan keluarga tercakup (layered, topology, stack, flow, swimlane, sequence, sld, rack, graph).

### 4.2 Simbol, per simbol terhadap ambang SY

| # | Simbol | SVG | maks dev mm | PNG SSIM | diff % | Port (ref/Node, maks dev) | Vonis |
|---|---|---|---|---|---|---|---|
| 1 | `iec:arrester` | PASS | 0.0 | 1.0 | 0.003 | 2/2, 0 | PASS |
| 2 | `iec:battery` | PASS | 0.0 | 0.9987 | 0.006 | 2/2, 0 | PASS |
| 3 | `iec:breaker` | PASS | 0.0 | 0.9996 | 0.06 | 2/2, 0 | PASS |
| 4 | `iec:busbar` | PASS | 0.0 | 1.0 | 0.0 | 2/2, 0 | PASS |
| 5 | `iec:changeover` | PASS | 0.0 | 0.9998 | 0.035 | 4/4, 0 | PASS |
| 6 | `iec:contactor` | PASS | 0.0 | 0.9995 | 0.058 | 2/2, 0 | PASS |
| 7 | `iec:ct` | PASS | 0.0 | 0.9981 | 0.184 | 4/4, 0 | PASS |
| 8 | `iec:disconnector` | PASS | 0.0 | 0.9996 | 0.052 | 2/2, 0 | PASS |
| 9 | `iec:earth` | PASS | 0.0 | 0.9998 | 0.005 | 1/1, 0 | PASS |
| 10 | `iec:enclosure` | PASS | 0.0 | 1.0 | 0.003 | 2/2, 0 | PASS |
| 11 | `iec:fuse` | PASS | 0.0 | 1.0 | 0.003 | 2/2, 0 | PASS |
| 12 | `iec:generator` | PASS | 0.0 | 0.9977 | 0.265 | 2/2, 0 | PASS |
| 13 | `iec:lamp` | PASS | 0.0 | 0.998 | 0.19 | 2/2, 0 | PASS |
| 14 | `iec:motor` | PASS | 0.0 | 0.9979 | 0.244 | 2/2, 0 | PASS |
| 15 | `iec:switch` | PASS | 0.0 | 0.9996 | 0.057 | 2/2, 0 | PASS |
| 16 | `iec:transformer` | PASS | 0.0 | 0.9977 | 0.319 | 2/2, 0 | PASS |
| 17 | `isa:auxiliary` | PASS | 0.0 | 0.999 | 0.242 | 4/4, 0 | PASS |
| 18 | `isa:computer` | PASS | 0.0 | 0.9998 | 0.001 | 4/4, 0 | PASS |
| 19 | `isa:field` | PASS | 0.0 | 0.999 | 0.244 | 4/4, 0 | PASS |
| 20 | `isa:inaccessible` | PASS | 0.0 | 0.9991 | 0.227 | 4/4, 0 | PASS |
| 21 | `isa:plc` | PASS | 0.0 | 0.999 | 0.247 | 4/4, 0 | PASS |
| 22 | `isa:primary` | PASS | 0.0 | 0.9991 | 0.228 | 4/4, 0 | PASS |
| 23 | `isa:shared-field` | PASS | 0.0 | 0.9993 | 0.168 | 4/4, 0 | PASS |
| 24 | `isa:shared` | PASS | 0.0 | 0.9993 | 0.186 | 4/4, 0 | PASS |
| 25 | `isa:valve-diaphragm` | PASS | 0.0 | 0.9994 | 0.054 | 2/2, 0 | PASS |
| 26 | `isa:valve-motor` | PASS | 0.0 | 0.9993 | 0.079 | 2/2, 0 | PASS |
| 27 | `isa:valve-solenoid` | PASS | 0.0 | 0.9997 | 0.01 | 2/2, 0 | PASS |
| 28 | `isa:valve` | PASS | 0.0 | 0.9997 | 0.008 | 2/2, 0 | PASS |
| 29 | `mil:friend-air` | PASS | 0.0 | 0.9996 | 0.054 | 4/4, 0 | PASS |
| 30 | `mil:friend` | PASS | 0.0 | 1.0 | 0.003 | 4/4, 0 | PASS |
| 31 | `mil:hostile-air` | PASS | 0.0 | 0.9986 | 0.277 | 4/4, 0 | PASS |
| 32 | `mil:hostile` | PASS | 0.0 | 0.9997 | 0.001 | 4/4, 0 | PASS |
| 33 | `mil:neutral` | PASS | 0.0 | 0.9999 | 0.005 | 4/4, 0 | PASS |
| 34 | `mil:unknown` | PASS | 0.0 | 0.9982 | 0.489 | 4/4, 0 | PASS (margin 0,011 pp, F-S78-6) |
| 35 | `sec:barrier` | PASS | 0.0 | 0.9999 | 0.003 | 2/2, 0 | PASS |
| 36 | `sec:camera` | PASS | 0.0 | 0.9996 | 0.042 | 4/4, 0 | PASS |
| 37 | `sec:fence` | PASS | 0.0 | 0.9999 | 0.005 | 2/2, 0 | PASS |
| 38 | `sec:mast` | PASS | 0.0 | 0.9996 | 0.01 | 4/4, 0 | PASS |
| 39 | `sec:pir` | PASS | 0.0 | 0.9996 | 0.066 | 4/4, 0 | PASS |
| 40 | `sec:ptz` | PASS | 0.0 | 0.9996 | 0.038 | 4/4, 0 | PASS |
| 41 | `sec:reader` | PASS | 0.0 | 0.9998 | 0.003 | 4/4, 0 | PASS |

Jumlah per dialek: iec 16, isa 12, mil 6, sec 7 = 41. Ini sama dengan `tests/parity/fixtures/symbol/symbols.json` (`counts`) dan D-42.

### 4.3 Lembar simbol per dialek

| Lembar | Jumlah lembar ref/Node | SVG | maks dev mm | root mm Node | PNG SSIM | diff % |
|---|---|---|---|---|---|---|
| `symbol/sheet_iec` | 1/1 | PASS | 0.0 | 166.0 x 247.0 | 0.9998 | 0.021 |
| `symbol/sheet_isa` | 1/1 | PASS | 0.0 | 166.0 x 247.0 | 0.9999 | 0.024 |
| `symbol/sheet_mil` | 1/1 | PASS | 0.0 | 166.0 x 247.0 | 0.9999 | 0.011 |
| `symbol/sheet_sec` | 1/1 | PASS | 0.0 | 166.0 x 247.0 | 0.9999 | 0.004 |

Tinggi blok 247,0 mm, tepat di batas research/06 SY (blok <= 247 mm).

## 5. Temuan (kegagalan dan celah dipetakan ke berkas:baris dan baris pemilik)

| Id | Keparahan | Berkas:baris | Bukti | Pemilik | Usulan (tidak diterapkan; S78 tidak mengubah harness) |
|---|---|---|---|---|---|
| F-050 (terkonfirmasi) | MINOR (harness) | `scripts/parity/compare/compare_svg.py:63-70` (`marks_of`: ref tanpa `data-mark` turun ke heuristik `rect`), `:243-245` (gerbang `a.markCount`); `scripts/parity/run/run_parity.ts:313` (DG dibandingkan tanpa opsi); `render.ts:675` dan `diagram/build/index.ts:52` (`dataMarks` tidak diteruskan) | 6/10 FAIL `a.markCount` mentah, 0/10 setelah strip; 10/10 byte-identik | S66 (compare), S67 (runner) | Untuk kelas DG: buang atribut tanda Node sebelum menghitung, atau hitung tanda dengan heuristik yang sama di kedua sisi. Alternatif: runner merender DG dengan `dataMarks:false` (butuh `buildDiagramSvg` meneruskan opsi; pemilik S30). Usul status F-050: SELESAI-SEBAGIAN (ditangani di S78, perbaikan harness tetap terbuka) |
| F-S78-1 | MINOR (harness, positif palsu) | `compare_svg.py:31` (`PAPER_COLORS`), `:250-253` (`b.colorMax` menghitung semua fill/stroke non-PAPER); `thresholds.py:69` | `dg_layered_good`: ref 6 = Node 6 > 5. Warna ke-6 adalah `#C3CBD1` = token `ink200` (`src/lib/studio/engine/diagram/core/tokens.ts:34`). Engine Python `colour_values` hanya 5 (`n_colour 5`), dan lint Node DATUM-25 PASS ("maks 4 nilai warna ... ramp tinta = 1 keluarga") | S66 | Samakan definisi hitung `colorMax` dengan DATUM-25 / `colour_values` engine (ramp tinta dan `ink200` dihitung satu keluarga), atau gerbangkan `n_colour` dari laporan engine. Selama belum diperbaiki, vonis layered = FAIL harness, bukan cacat port |
| F-S78-2 | MINOR (harness/korpus) | `scripts/parity/run/lib/fixtures.ts:42-44` (`walk` hanya melewati `_`/`.`); `scripts/parity/run/lib/render.ts:246-248` (`detectKind`: objek tanpa `$schema` dengan `id` string dianggap simbol) | `diagram/garis_a/good_layered` dan `good_sld` (manifest `sources`: "bukan fixture kontrak") menjadi `kind: symbol`, `code 4.2/4.3`; ref `SYMBOL_UNKNOWN`, Node `SCHEMA_INVALID`; run `diagram/**` exit 1 | S67 (runner) atau S63 (korpus: pindah ke `_garis_a/`) | Kecualikan berkas yang tercantum di `manifest.sources`, atau ganti nama folder berawalan `_`. Cakupan tidak hilang karena versi kontrak keduanya sudah dinilai |
| F-S78-3 | INFO (diagnosis) | `scripts/parity/compare/compare_png.py:37-42` (turun-sampel 72 dpi memakai DPI metadata per berkas); `scripts/parity/reference/fig/raster.py:84` (screenshot tanpa pHYs 300 dpi) | `dpi: ref 96.0, node 300.0` dengan ukuran px identik, sehingga `ssim72` 0,71-0,91 untuk gambar dengan SSIM asli >= 0,9998 | S65 / S66 | Tulis pHYs 300 dpi di raster acuan, atau pakai DPI sasaran bila ukuran px sama. Tidak menggagalkan gerbang |
| F-S78-4 | MINOR (celah cakupan) | `thresholds.py:76-83` (SY tanpa kunci port); `compare_svg.py` tidak membaca `portsInMm` | research/06 SY menuntut "port +/- 0,01 mm"; ditutup oleh cek tambahan: 123/123 port, dev 0 | S66 | Tambahkan cek port SY di harness (memakai `ref_report.portsInMm` dan `symbolPortsMm`) |
| F-S78-5 | MINOR (celah cakupan) | Korpus `tests/parity/fixtures/diagram/*.json` (S63); harness DG tanpa cek `checks_run`/`n_hops` | `n_hops = 0` di 10/10 fixture, jadi hop persilangan (r 0,9 mm) tidak teruji di korpus. `checks_run` identik 10/10 lewat cek tambahan | S63 (korpus), S66 (cek laporan engine) | Tambahkan fixture graph/topology dengan persilangan (S30 punya spec sintetis 5 hop); bandingkan `engineReport` di harness |
| F-S78-6 | INFO (risiko flaky) | `thresholds.py:89` (SY `diffPctMax 0.5`) | `mil:unknown` diff 0,489 % (margin 0,011 pp). SVG setara: selisihnya hanya format angka `24.0` lawan `24` dan atribut `data-*`, geometri dev 0. Selisih piksel berasal dari jalur rasterisasi (Python `page.set_content` lawan Node `rasterizeSvg`) | S66 (pantau) | Pantau di run berikutnya. Bila berfluktuasi, kalibrasi lantai derau SY dengan merasterisasi SVG yang sama dua kali (pola N3) |

Tidak ada cacat produk (port) yang ditemukan. F-052 (sld 166 mm) tidak teruji di sini karena fixture sld memakai 128 mm; statusnya tetap DITUNDA.

## 6. Cara menjalankan ulang

Dari akar repo `C:\Users\TRIAL\gsp-swarm-hq-v2.1`, dengan VENV = `C:\Users\TRIAL\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe`:
```
npx tsx scripts/parity/run/run_parity.ts --fixtures tests/parity/fixtures --out tests/parity/out/s78/diagram --only "diagram/**" --formats svg,png
"<VENV>" -I -B tests/parity/out/s78/diagram_f050/s78_f050.py tests/parity/out/s78/diagram tests/parity/out/s78/diagram_f050 .
npx tsx tests/parity/out/s78/diagram_report/report_check.ts tests/parity/out/s78/diagram
npx tsx scripts/parity/run/run_parity.ts --fixtures tests/parity/fixtures --out tests/parity/out/s78/symbol --only "symbol/**" --formats svg,png
npx tsx tests/parity/out/s78/symbol_ports/ports_check.ts tests/parity/out/s78/symbol
```
Durasi: diagram sekitar 37 detik, simbol sekitar 2 menit 40 detik. Run memakai satu Chromium pada satu waktu (batas host G4: maks 3).

## 7. Catatan CI

- `tests/parity/out/` di-gitignore (`.gitignore:70`). Skrip cek tambahan di `out/s78/` tidak ter-commit. Bila cek itu ingin dipertahankan, pindahkan ke harness lewat pemilik S66/S67.
- Exit run diagram = 1 selama F-050, F-S78-1, dan F-S78-2 belum diperbaiki di harness. Exit run simbol = 0.
- Kandidat flaky: `mil:unknown` PNG (F-S78-6). Tidak ada kegagalan intermiten yang teramati dalam run ini (satu run per set).

## 8. Keterbatasan

- Setiap set dijalankan satu kali. Determinisme diukur hanya untuk build SVG Node (2 build identik, 10/10), bukan untuk rasterisasi PNG.
- `garis_a/*` tidak dinilai sebagai fixture terpisah (F-S78-2). Keduanya byte-sumber Python yang versi kontraknya dinilai.
- Opsi `dataMarks:false` tidak diuji lewat API build karena tidak diekspos. Ekuivalensinya ditunjukkan secara tidak langsung: SVG Node yang tanda-tandanya dibuang byte-identik dengan Python.

## 9. Rekomendasi

1. S66: perbaiki F-050 dan F-S78-1 di `compare_svg.py`, lalu jalankan ulang run diagram. Hasil yang diharapkan: 10/10 PASS tanpa langkah pasca-proses.
2. S67/S63: kecualikan `manifest.sources` dari penemuan fixture (F-S78-2).
3. S63: tambahkan fixture dengan hop persilangan (F-S78-5).
4. S66: tambahkan cek port SY dan cek `engineReport` DG ke harness (F-S78-4, F-S78-5).
5. Controller: catat F-S78-1..6 di `findings_register.md` dan perbarui F-050 menjadi SELESAI-SEBAGIAN.
