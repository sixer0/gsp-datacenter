# SR-47: Jalankan ulang S78, paritas diagram (kelas D-242) dan simbol (paritas Python + fit IP-42)

- Baris: SR-47 (`identification/05_structural_sections_blueprint.md:788`, profil `:886`). Agen: test-expert. Skill: tdd. Tanggal run: 2026-10-23.
- Area tulis: laporan ini dan `tests/parity/out/sr47/**` (klaim `delegation_progress/file_claims.md`, baris SR-47). Kode produksi, harness `scripts/parity/**`, korpus `tests/parity/fixtures/**`, dan skill DATUM tidak diubah. Tidak ada DB. Satu Chromium pada satu waktu.
- Acuan keputusan: D-137 (kelas warna DATUM-25), D-154/D-156 (IP-42c/IP-42a), D-242 (paritas byte Python untuk diagram SENGAJA diputus), D-288/D-290/D-293 (aturan per famili), catatan `coder_execution_fixb.md` dan `coder_execution_fixb2.md`.

## Ringkasan

| Cakupan | Kelas vonis | Hasil |
|---|---|---|
| Diagram, 11 fixture kontrak (manifest `counts.diagram` 11; `dg_graph_hops` ditambahkan FIX-3) | D-242: (a) struktur/topologi, (b) lint DATUM, (c) beda geometri dijelaskan aturan | 9 PASS; 1 FAIL (b) pra-ada (`dg_rack`, F-SR47-1); 1 NODE_ERROR disengaja (`dg_layered_good`, DATUM-25 D-137) |
| Diagram sumber `garis_a/*` (2, dilewati penemuan harness sejak FIX-3) | probe mesin | `good_sld` OK, byte-identik dengan `dg_sld_good`; `good_layered` 422 DATUM-25 (D-137) |
| Simbol 41 + lembar per dialek 4 | paritas Python (ambang SY) | 45/45 PASS SVG dan PNG, deviasi geometri 0,0 mm, SSIM 1,0, port 41/41 (123 port) |
| Lembar simbol isi-pas IP-42 (`fit:true`), 4 dialek | tata letak lawan RL Garis B `datum_symbols.sheet()` | 4/4 tata letak aparatus identik; tinggi pita 108/75/75/48 = RL; deterministik |

Tidak ada beda geometri diagram yang tak terjelaskan. Seluruh selisih tinggi akar (−38,1 sampai −119,1 mm) terurai habis ke aturan D-242/D-288/D-290, dan geometri horizontal simpul identik dengan Python (Δx 0,0 mm). SVG Node 10/10 byte-identik dengan keadaan akhir FIX-B2 yang diterima di D-293 (`benchmark/out/fixb2/probe_step4`).

## 1. Strategi uji

- Harness: `scripts/parity/run/run_parity.ts`. Acuan Python Garis A (HS) diambil dari VENV hermes dengan `-I -B`; pembanding `compare.py` kelas DG/SY. Untuk diagram, harness masih menggerbang byte Python (root +/-0,1 mm, geometri +/-0,1 mm, PNG SSIM >= 0,99), jadi FAIL mentah DG memang diharapkan sesudah D-242. Vonis SR-47 diambil dari kelas D-242 berikut, bukan dari exit harness.
- Kelas D-242 (skrip uji di area keluaran: `tests/parity/out/sr47/diagram_d242/sr47_d242.py`). Elemen dipasangkan menurut urutan dokumen; jumlah tag identik di semua fixture.
  - (a) Struktur/topologi: urutan tag, urutan teks, urutan id simpul (`data-node`), gaya tepi (stroke, dasharray, marker), pasangan ujung tepi ke simpul terdekat, himpunan warna, dan laporan mesin (simpul, tepi, hop, `colour_values`, keluarga, aparatus).
  - (b) Lint DATUM: `checks_run` Node (20 cek, termasuk DATUM-24/25/26/27/28/32/33/34/35/37-lebar) sama dengan Python, build SUCCEEDED (setiap cek build gagal = BY_CONSTRUCTION_FAILED), dan lint artefak `render_report.json` (DATUM-25/28/32/33) tanpa FAIL.
  - (c) Geometri: Δx tepi kiri/kanan setiap simpul; tinggi simpul, celah antarbaris, serta margin atas/bawah dalam satuan baseline (L = 13,5 pt = 4,7625 mm). Selisih tinggi akar diurai menjadi Δmargin atas + Δbentang isi + Δmargin bawah, lalu tiap komponen dicocokkan ke aturan. Selain itu: perpindahan label tepi, tumpang tindih pita knockout label dengan simpul, dan tepi yang rute horizontalnya berubah.
- Simbol: kelas SY harness tidak berubah dari S78. Sejak FIX-3 gerbang port (F-S78-4) sudah ada di harness.
- Fit IP-42: `symbolSheetSvg(d, undefined, {fit:true})` dibandingkan dengan `datum_symbols.sheet(path, 166)` RL (skill dimuat lewat `scripts/parity/reference/fig/skills.py`, `-I -B`; `find <RL> -newer` = 0 berkas). Posisi teks aparatus lembar (kepala 2,7, label id 2,1, nama 2,2) dibandingkan relatif terhadap kepala dialek. Glif di dalam simbol tidak dibandingkan karena geometri simbol sengaja tetap HS (IP-42a keputusan 2).
- Di luar lingkup: chart (SR-48), DOCX (SR-46), PDF (SR-50); spec benchmark Manual 000 (S98/FIX-B2; dipakai hanya sebagai bukti pengganti famili layered).

## 2. Berkas keluaran (`tests/parity/out/sr47/`, gitignore)

| Path | Isi |
|---|---|
| `diagram/`, `diagram_stdout.txt` | run harness diagram (per fixture `ref/`, `node/`, `cmp/`) |
| `diagram_d242/sr47_d242.py`, `d242_summary.json` | penilaian kelas D-242 per fixture |
| `garis_a/probe_garis_a.ts`, `probe_garis_a.json`, `*.svg` | probe fixture sumber `garis_a/*` dan versi kontraknya |
| `symbol/`, `symbol_stdout.txt` | run harness simbol (45 fixture) |
| `symbol_fit/node_fit.ts`, `rl_sheet.py`, `fit_compare.py`, `node_fit_*.svg`, `rl_sheet.svg`, `fit_compare.json`, `node_fit.json` | paritas lembar isi-pas IP-42 |

## 3. Perintah dan keluaran

```
npx tsx scripts/parity/run/run_parity.ts --fixtures tests/parity/fixtures --out tests/parity/out/sr47/diagram --only "diagram/**" --formats svg,png
run_parity: 11 fixture (dari 110; 3 berkas dilewati)
  FAIL x9 (svg=FAIL png=FAIL: d.rootSize + geometry, sesuai D-242), dg_rack PASS, dg_layered_good NODE_ERROR
run_parity: {"FAIL":9,"NODE_ERROR":1,"PASS":1} exit=1   real 0m58.962s
```
Contoh gerbang (`diagram_dg_flow/cmp/svg.json`): `d.rootSize` ref [128.0, 223.837], node [128.0, 109.537]; `geometry` maks 114,3 mm. Tag, tanda, warna, fon, teks, dan `engineReport` lulus.

```
"<VENV>" -I -B tests/parity/out/sr47/diagram_d242/sr47_d242.py tests/parity/out/sr47/diagram tests/parity/out/sr47/diagram_d242/d242_summary.json
dg_flow: struct=True lint=True dW=0.0 dH=-114.3 maxDx=0.0 gapsL ref=[6.001,5.999,5.999] node=[2.001,2.001,1.999]
...
dg_rack: struct=True lint=False dW=0.0 dH=0.0 maxDx=0.0
dg_layered_good NO_SVG BY_CONSTRUCTION_FAILED "DATUM-25: 6 nilai warna dalam satu gambar, maksimum 5"
```

```
npx tsx tests/parity/out/sr47/garis_a/probe_garis_a.ts
{"fixture":"garis_a_good_layered","status":"ERROR","code":"BY_CONSTRUCTION_FAILED","message":"DATUM-25: 6 nilai warna ..."}
{"fixture":"garis_a_good_sld","status":"OK","widthMm":128,"heightMm":71.437}
cmp garis_a_good_sld.svg dg_sld_good.svg -> identik
```

```
npx tsx scripts/parity/run/run_parity.ts --fixtures tests/parity/fixtures --out tests/parity/out/sr47/symbol --only "symbol/**" --formats svg,png
run_parity: {"PASS":45} exit=0   real 3m37.692s
agregat: svgPASS 45, pngPASS 45, maxGeom 0, minSSIM 1.0, maxDiff 0.0; ports 41/41 pass, 123 port acuan
```

```
npx tsx tests/parity/out/sr47/symbol_fit/node_fit.ts
{"iec":{"sheets":1,"deterministic":true,"viewBox":"0 0 178 108","height":"100.7191mm"},"isa":{... "0 0 178 75" ...},"sec":{... "0 0 178 75" ...},"mil":{... "0 0 178 48","height":"44.764mm"}}
"<VENV>" -I -B tests/parity/out/sr47/symbol_fit/rl_sheet.py      -> rl_sheet.svg, 41 simbol; kepala y 10/118/193/268, tinggi 310
"<VENV>" -I -B tests/parity/out/sr47/symbol_fit/fit_compare.py   -> iec 33/33, isa 25/25, sec 15/15, mil 13/13 identicalRelLayout True
```

Cek pendukung:
- SVG Node harness lawan `benchmark/out/fixb2/probe_step4/diagram_*.svg` (`cmp`): SAME 10/10.
- `npx vitest run tests/unit/studio/figures`: 8 berkas, 376/376 lulus.

## 4. Inventaris vonis diagram (kelas D-242)

Satuan: L = 1 baseline = 4,7625 mm. Py = Python Garis A, N = Node. Kolom tinggi memakai mm.

| Fixture | Famili | (a) | (b) | Tinggi Py → N | Beda tinggi | Δx simpul | Uraian selisih (aturan penjelas) | Vonis |
|---|---|---|---|---|---|---|---|---|
| dg_flow | flow | PASS | PASS | 223,837 → 109,537 | −114,300 (−24 L) | 0,0 | 4 simpul 6 L → 3 L (K-1, −12 L); 3 celah 6 L → 2 L (`flow.ts:14` 2 baseline, −12 L); margin sama. Label NILAI geser 3,55 mm (`labelPos`) | PASS |
| dg_flow_wrapped | flow | PASS | PASS | 109,537 → 61,912 | −47,625 (−10 L) | 0,0 | 2 baris 6 → 3 L (−6 L); 1 celah 6 → 2 L (−4 L). Label HARGA geser 32,0 mm (`labelPos`) | PASS |
| dg_graph | graph | PASS | PASS | 100,012 → 57,150 | −42,862 (−9 L) | 0,0 | Simpul 6 → 2 L (graph pad 1, D-288); koridor baris 2 → 3 L (D-288); bentang −7 L; margin atas dan bawah masing-masing −1 L (kotak pembatas + 1 L, D-290) | PASS |
| dg_graph_hops | graph | PASS | PASS | 176,212 → 104,775 | −71,437 (−15 L) | 0,0 | Bentang 30 L → 17 L (simpul 6 → 2 L, celah 2 → 3 L, baris kosong 10 → 8 L); margin −2 L (D-290); hop tetap (laporan mesin sama) | PASS |
| dg_layered_good | layered | - | FAIL DATUM-25 | - | - | - | Build 422, 6 warna > 5 (D-137 butir 2, disengaja); lihat §6 | NODE_ERROR disengaja |
| dg_rack | rack | PASS | **FAIL** lint artefak DATUM-32 | 109,537 → 109,537 | 0,000 | 0,0 | Satuan U rak tidak berubah oleh D-242. Harness SVG/PNG PASS (byte Python). DATUM-32 artefak FAIL pra-ada, F-SR47-1 | FAIL (b) pra-ada |
| dg_sequence | sequence | PASS | PASS | 209,550 → 90,487 | −119,063 (−25 L) | 0,0 | Kepala aktor 6 → 3 L (−3 L); `msgY` 6 → 2 L (−4 L); 3 langkah pesan 9 → 3 L (`sequence.ts:86-87`, −18 L) | PASS |
| dg_sld_good | sld | PASS | PASS | 109,537 → 71,437 | −38,100 (−8 L) | 0,0 | Rel → baris cabang 6 → 2 L (`sld.ts:90`, −4 L); simpul cabang tertinggi 8 → 4 L (−4 L); rel 128 mm tetap (B-2). Label DAYA UTAMA dan SIRKUIT KONTROL geser −13,34 mm (`labelPos`) | PASS |
| dg_stack | stack | PASS | PASS | 223,837 → 109,537 | −114,300 (−24 L) | 0,0 | 4 simpul 6 → 3 L; 3 celah 6 → 2 L (stack tetap 2 baseline, `layered.ts:48`). 3 label menempel simpul 0,43-0,44 mm (F-SR47-2) | PASS |
| dg_swimlane | swimlane | PASS | PASS | 138,112 → 76,200 | −61,912 (−13 L) | 0,0 | 3 lajur 6 → 3 L (−9 L); 2 langkah lajur 3 → 1 L (`swimlane.ts:59`, −4 L). 1 tepi berganti rute horizontal karena koridor lajur 1 L; DATUM-32 PASS | PASS |
| dg_topology | topology | PASS | PASS | 176,212 → 90,487 | −85,725 (−18 L) | 0,0 (pusat) | Tingkat 8/6/6 L → 4/3/3 L (−10 L); 2 celah 6 → 2 L (−8 L). Lingkaran s1/s2 r 14,29 → 7,14 (lebar ikut tinggi simpul; cx sama). Label REPLIKASI HARIAN geser −2,95 mm | PASS |

Rincian (a): pada 10 fixture yang dirender, urutan tag, teks, id simpul, gaya tepi, pasangan ujung tepi ke simpul, himpunan warna, dan 7 medan laporan mesin semuanya sama. Baris KEY tetap tergambar di SVG pada semua fixture karena fixture mentah tidak membawa sinyal compose `keyRowOnPage`. Ini sesuai D-288.

Rincian (c): untuk setiap fixture, Δtinggi akar = Δmargin atas + Δbentang + Δmargin bawah (dari `d242_summary.json`), dan setiap komponen cocok dengan aturan famili. Ringkasnya:
- tinggi simpul (3 + sub + tag) L, graph (2 + sub + tag) L, sedangkan Python dua kali lipat;
- jarak 2 L untuk flow/stack/topology/sld, 5 L untuk layered, 3 L untuk koridor graph, 1 L untuk lajur swimlane, 2 L/3 L untuk sequence. Python memakai BASELINE_PT x k yang dibaca sebagai mm (6/14/2/3/6/9 L);
- graph memakai kotak pembatas + 1 L (D-290); rack tidak berubah.

Lebar akar Δ 0. Perpindahan label dan satu rute swimlane berasal dari aturan yang tidak berubah (`build/svg.ts:121-136` `labelPos`, route) yang kini bekerja pada geometri vertikal baru. Tidak ada selisih yang tak terjelaskan.

Famili layered (tanpa fixture paritas positif): bukti pengganti diambil dari `benchmark/out/fixb2/probe_step4/bm-fig-06.svg` (166 x 128,587): 3 baris, celah 5,002/4,999 L (`LAYERED_TIER_GAP_BASELINES` 5), simpul 4,0 L (3 + sub), margin 2/3 L.

## 5. Inventaris vonis simbol

| Set | SVG | Geometri maks | PNG | Port | Vonis |
|---|---|---|---|---|---|
| 41 simbol (iec 16, isa 12, mil 6, sec 7) | 41/41 PASS | 0,0 mm | 41/41 PASS, SSIM 1,0, diff 0,0 %, ukuran px identik | 41/41 (123/123, tol 0,01 mm) | 41/41 PASS |
| Lembar HS `sheet_{iec,isa,mil,sec}` (fit false) | 4/4 PASS | 0,0 mm | 4/4 PASS | - | 4/4 PASS (166 x 247,0) |
| Lembar isi-pas IP-42 (fit true) | tata letak aparatus = RL 4/4 (86 teks) | relatif 0,0 mm | tidak dirasterkan (RL tanpa jalur raster per pita) | - | 4/4 PASS; tinggi pita 108/75/75/48 = selisih kepala RL (118−10, 193−118, 268−193, 310−262) |

F-S78-6 (`mil:unknown` diff 0,489 % pada S78) kini 0,0 % dengan SSIM CAL. Risiko flaky tidak terlihat pada run ini.

## 6. Kegagalan dan celah, dipetakan ke pemilik

| Id | Keparahan | Bukti | Pemilik | Status |
|---|---|---|---|---|
| dg_layered_good + garis_a/good_layered | disengaja (bukan cacat) | `BY_CONSTRUCTION_FAILED DATUM-25: 6 nilai warna ... maksimum 5`; D-137 butir 2; diuji sebagai negatif di SR-42 (`test/11_rerun_s71_s73.md:46`) | Korpus S63/FIX-3 (`delegation_progress/file_requests.md:112`: ubah `cloud shadowed` → `box` atau edge `verify` → `control`/`data`) | Terbuka: famili layered tanpa fixture paritas positif. Celah cakupan ditutup sementara oleh bm-fig-06 (§4) |
| F-SR47-1 (baru) | MINOR | `dg_rack` lint artefak DATUM-32 FAIL "konektor #0 melewati simpul tak terkait 'srv' sepanjang 9.1 mm", sedangkan DATUM-32 build PASS. Rute sw→srv pada rak tanpa celah berbentuk zig-zag degeneratif `M 64 28.57 L 64 33.34 L 64 28.57 L 64 23.81 L 64 28.57` dan masuk ke kedua simpul. Pra-ada: FAIL yang sama di `tests/parity/out/s78/diagram/diagram_dg_rack/node/render_report.json`; SVG byte Python | Diagnosis: lint DATUM-32 (`engine/lint/render/svg.ts`, pemilik IP-41b) bila positif palsu; rute rak (`engine/diagram/**`, FIX-B2) bila rute cacat | Terbuka, tidak terkait D-242 |
| F-SR47-2 (baru) | INFO/MINOR (mutu visual) | 6 pita knockout label di 4 fixture menumpangi kotak simpul 0,43-0,44 mm (flow TIKET; flow_wrapped HARGA; stack PERINTAH, TULIS DERET, BERKAS; swimlane PERINTAH KERJA); Python 0. Akar: koridor 2 L (D-242) membuat semua kandidat `labelPos` bertabrakan, lalu jatuh ke `midLabel` (`build/svg.ts:121-136`). Simpul digambar sesudah pita, jadi garis tepi tetap utuh; lint PASS | `engine/diagram/**` (FIX-B2), untuk keputusan review akhir | Terbuka, bukan pelanggaran DATUM |
| Harness DG | MINOR (harness) | `compare.py` kelas DG masih menggerbang byte Python, sehingga exit 1 untuk 9 fixture sesudah D-242 | S66/S67 (pembanding/runner); `file_requests.md:221` | Terbuka; vonis SR-47 memakai skrip kelas D-242 di area keluaran |

## 7. Cara menjalankan ulang (akar repo, VENV = `C:\Users\TRIAL\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe`)

```
npx tsx scripts/parity/run/run_parity.ts --fixtures tests/parity/fixtures --out tests/parity/out/sr47/diagram --only "diagram/**" --formats svg,png
"<VENV>" -I -B tests/parity/out/sr47/diagram_d242/sr47_d242.py tests/parity/out/sr47/diagram tests/parity/out/sr47/diagram_d242/d242_summary.json
npx tsx tests/parity/out/sr47/garis_a/probe_garis_a.ts
npx tsx scripts/parity/run/run_parity.ts --fixtures tests/parity/fixtures --out tests/parity/out/sr47/symbol --only "symbol/**" --formats svg,png
npx tsx tests/parity/out/sr47/symbol_fit/node_fit.ts
"<VENV>" -I -B tests/parity/out/sr47/symbol_fit/rl_sheet.py
cd tests/parity/out/sr47/symbol_fit && "<VENV>" -I -B fit_compare.py
```
Durasi: diagram sekitar 59 detik, simbol sekitar 3 menit 38 detik.

## 8. Catatan CI, keterbatasan, rekomendasi

- `tests/parity/out/` di-gitignore, jadi skrip kelas D-242 dan fit tidak ter-commit. Exit run diagram = 1 (byte Python) sampai harness DG mengadopsi kelas D-242; exit run simbol = 0.
- Keterbatasan:
  - satu run per set;
  - pemasangan elemen menurut urutan dokumen;
  - bbox silinder memakai titik akhir busur, sehingga tinggi silinder graph/topology hanya bersifat indikatif dan tidak dipakai untuk vonis;
  - lembar fit tidak dirasterkan;
  - layered dinilai hanya lewat bm-fig-06 (tanpa acuan Python D-242).
- Rekomendasi:
  1. S63/FIX-3: ubah fixture layered sesuai `file_requests.md:112` agar famili layered punya fixture paritas positif.
  2. IP-41b/FIX-B2: diagnosis F-SR47-1.
  3. Review akhir: putuskan F-SR47-2 (jarak label minimum dalam koridor 2 L).
  4. S66/S67: pindahkan kelas D-242 (`sr47_d242.py`) ke `compare.py` kelas DG.
