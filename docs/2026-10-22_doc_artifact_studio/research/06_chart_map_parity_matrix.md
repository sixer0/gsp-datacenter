---
type: mixed
confidence: MEDIUM-HIGH
task_id: doc_artifact_studio_s02
date: 2026-10-22
agent: data-analyst
row: S02
---

# 06 Peta Kode Chart Manual ke Acuan Python dan Matriks Paritas

Tier naratif: 1 (5W1H) untuk keputusan ambang (bagian 6); tier 2 untuk temuan pemetaan. Setiap klaim membawa `path:baris`, keluaran alat, atau label "hipotesis".

Singkatan path (read-only):

- `HS` = `C:\Users\TRIAL\AppData\Local\hermes\skills\gsp\datum-house-style\` (Garis A, v2.6.0)
- `RL` = `C:\Users\TRIAL\AppData\Local\hermes\profiles\gspuser02\skills\datum-revl\` (Garis B, Rev L)
- `PC` = `HS\pustakachart.py` (1711 baris), `PCD` = `HS\pustakachart_data.py` (235 baris), `DC` = `RL\scripts\datumchart.py` (296 baris)
- `MT` = `C:\Users\TRIAL\AppData\Local\Temp\hq_v21_clone\datum_manual.txt` (pdftotext BM.pdf)
- `GBR` = `RL\assets\manual\gambar\` (24 PNG gambar manual, sumber gambar BM)

---

## 1. Source Tasks

| Unsur | Isi |
|---|---|
| Siapa (subjek) | Baris S02 blueprint rev 3, `identification/02_structured.md:150` |
| Pemangku kepentingan | S09 (registri chart), S33-S43 (keluarga chart), S63 (fixture), S65 (adapter acuan figur), S66 (pembanding), S94 (spec figur benchmark), S98 (benchmark), controller |
| Kapan | Gelombang GP-a (L0), sebelum S01/S03 (`02_structured.md:386-390`) |
| Lingkup | 58 kode manual, 18 jenis `drawn=false`, chart yang dipakai Manual 000, matriks paritas per format dan kelompok acuan, celah |
| Mengapa | D-04 (port Node wajib dibuktikan setara Python), D-10 (acuan Garis A + pelengkap Garis B), D-14 (figur benchmark dari spec), D-17 (ambang benchmark), D-22 KT-01 (58 jenis masuk v2.1), KT-02 (struktural untuk kode terpeta, lint untuk tanpa acuan), KT-08 (ramp heatmap putih ke signal), KT-12 (dot/flow map skematis di atas grid tile map) |
| Bagaimana | Baca langsung kode acuan (PC, PCD, DC), katalog research/01 §3.6, inventaris research/03 §3.10, §4.2, §7, tabel docx research/04 T056-T073, teks MT, dan lima PNG galeri `GBR\Gambar 8.1..8.5` (dilihat visual) |

Masukan yang dibaca utuh atau per bagian relevan: `delegation_progress/driver_rules.md`, `decisions/decisions.md` (D-01..D-22), `identification/02_structured.md` (baris S02, S09, S32-S43, S63-S67, S90-S99), `research/01_manual_parameter_catalog.md:470-589`, `research/03_datum_engine_inventory.md:1-130, 200-319, 418-628`, `research/04_manual_docx_tables.md:479-786`, `research/05_render_calibration.md` (SSIM/CAL), PC baris 1-1711 (registri 1463-1611, semua fungsi `v..`/`ap..`), PCD 1-235, DC 1-296, MT (caption Gambar dan footer `LEMBAR`).

## 2. Exploration and Collection Summary

- Katalog 58 kode dan 87 parameter khusus: research/01 §3.6.2 (`01_manual_parameter_catalog.md:517-578`), cocok dengan Tabel 8.1-8.5 docx asli (`04_manual_docx_tables.md:611-702`) dan `RL\tokens.json chart.catalogue_codes` (research/03 `:628`).
- Mesin Python chart: hanya `DC` menerima spec JSON (3 keluarga `bar|column|threshold`, `DC:22-25, 159-229`). `PC` adalah galeri berdata beku tanpa masukan (`PC:1613-1618`, data dari `PCD`, seed 42 `PCD:11-12`).
- Registri PC: 61 entri VC + 12 AP + 1 warisan (`PC:1463-1611`, `PC:1647-1663`). Daftar fungsi: Grep `^def ` pada PC (77 fungsi, termasuk 61 `v..` dan 12 `ap..`).
- Manual 000 memuat 24 gambar bercaption (Grep `G A M B A R` pada MT: 24 baris), sama dengan 24 PNG di `GBR` (Glob: 24 berkas).
- Dimensi riset eksternal 1-7: tidak dalam lingkup baris ini (tidak ada kueri eksternal).

## 3. Overview

Dari 58 kode manual: **4 kode beracuan `datumchart` (Rev L)**, **42 kode beracuan fungsi `pustakachart` (Garis A)**, **12 kode TANPA-ACUAN** (hipotesis "sekitar 12" di `02_structured.md:36` terkonfirmasi tepat 12). Dari 18 jenis `drawn=false`: 2 punya fungsi galeri (dendrogram `v36_dendro`, spline `v47_spline`), 16 sama sekali tanpa acuan.

Temuan terpenting untuk benchmark: **kelima gambar galeri Manual 000 (Gambar 8.1-8.5, halaman 35, 37, 38, 40, 42) memuat SEMUA 58 kode sebagai panel, tetapi tidak dihasilkan oleh `PC` di disk**. Data panel berbeda dari `PCD` (contoh P-01: Polri 42, TNI AL 31, Kemhan 24, BNPT 15, Kominfo 11, BIN 7; `PCD:15-16`: Kamera 4MP 412,5, NVR 24-ch 380,0, ...) dan 12 kode TANPA-ACUAN pun tergambar di galeri. Pembangun galeri tidak ditemukan di disk (bagian 7, F-S02-01). Akibatnya ada dua sasaran paritas yang berbeda dan tidak boleh dicampur:

1. **Paritas port (D-04)**: Node lawan acuan Python per kode (`DC` atau fungsi `PC` dengan data disuntik), bahan dari fixture S63.
2. **Paritas benchmark (D-14, D-17)**: komposit galeri Node lawan PNG Gambar 8.x di BM.pdf, dengan data ditranskripsi dari panel PNG, bukan dari `PCD`.

## 4. Requirements

| ID | Kebutuhan (turunan) | Dasar |
|---|---|---|
| R1 | Setiap kode dari 58 punya satu label acuan: `datumchart:<family>`, `pustakachart:<fungsi>`, atau `TANPA-ACUAN` | Brief S02, KT-02 |
| R2 | Kode `datumchart` diuji paritas struktural ketat; kode `pustakachart` struktural bertoleransi; `TANPA-ACUAN` lint saja | KT-02 (b)+(c), D-10 |
| R3 | 18 jenis `drawn=false` terdaftar di registri v2.1 dengan status dan alternatif | KT-01, S09 (`02_structured.md:157`) |
| R4 | Ambang angka per format: SVG, PNG, DOCX, PDF, ditambah diagram 9 keluarga dan simbol 41 | Brief S02, D-04, D-15 |
| R5 | Heatmap memakai ramp putih ke signal; dot map dan flow map skematis di atas grid tile map | KT-08, KT-12 |
| R6 | Figur benchmark dari spec dan dirender Node; SSIM figur hanya diagnosis | D-14, D-17 |

---

## 5. Isi wajib

### 5.1 Tabel 58 kode manual ke acuan Python

Kolom:
- **Acuan**: `datumchart:<family>` (`DC`, render `DC:135-243`); `pustakachart:<fungsi>` dengan baris `def` di PC; atau `TANPA-ACUAN`.
- **Bentuk**: `PENUH` = fungsi acuan menggambar bentuk yang sama dengan definisi katalog; `PARSIAL` = bentuk acuan menyimpang dari definisi katalog (detail di 5.1.2), sehingga hanya subset cek struktural yang berlaku.
- **Asal data acuan**: `spec` = spec JSON `DC` (`DC:246-262`); `PCD:<atribut>` = data sintetis seed 42 yang dibaca fungsi pada saat panggil lewat `D.<atribut>` (dapat ditimpa adapter); `LITERAL` = data ditulis di dalam fungsi atau dibangkitkan RNG internal (tidak dapat disuntik lewat `PCD`); `PARAM` = fungsi menerima data sebagai argumen.
- **Parameter khusus**: kunci dari research/01 §3.6.2 (`01_manual_parameter_catalog.md:519-576`); `-` = 0 parameter.

| Kode | Nama | Kelompok | Acuan Python | Bentuk | Asal data acuan | Parameter khusus (kunci) |
|---|---|---|---|---|---|---|
| P-01 | Bar urut | P perbandingan | datumchart:bar (`DC:159-202`); bantu `pustakachart:v01_bar_ranking` (`PC:191`, VC-01) | PENUH | spec; bantu PCD:PERANGKAT, HARGA | sort, accent, valueLabel |
| P-02 | Column | P perbandingan | datumchart:column (`DC:204-227`); bantu `pustakachart:v02_column_time` (`PC:205`, VC-02) | PENUH | spec; bantu PCD:TAHUN, VOLUME_PROYEK | - |
| P-03 | Grouped column | P perbandingan | pustakachart:v04_grouped_column (`PC:226`, VC-04) | PENUH | PCD:PERANGKAT, HARGA, HARGA_B | maxSeries, targetColour |
| P-04 | Lollipop | P perbandingan | pustakachart:v05_lollipop (`PC:238`, VC-05) | PENUH | PCD:PERANGKAT, HARGA | stemWeight, zeroBaseline, sort |
| P-05 | Dot plot | P perbandingan | pustakachart:v06_dotplot (`PC:251`, VC-06) | PARSIAL | PCD:MTBF, SITE (+ jitter RNG internal) | gridlines |
| P-06 | Dumbbell | P perbandingan | pustakachart:v07_dumbbell (`PC:268`, VC-07) | PENUH | PCD:AUDIT_OBJEK, AUDIT_H1, AUDIT_H2 | startColour, endColour, sort |
| P-07 | Range plot | P perbandingan | pustakachart:v09_range (`PC:282`, VC-09) | PENUH | LITERAL (`PC:284-287`: grup literal + RNG SEED+9) | - |
| P-08 | Slope | P perbandingan | pustakachart:v11_slope (`PC:299`, VC-11) | PENUH | PCD:AUDIT_OBJEK, AUDIT_H1, AUDIT_H2 | labelsBothSides, upColour, downColour |
| P-09 | Bullet | P perbandingan | pustakachart:v95_bullet (`PC:1214`, VC-95) | PARSIAL | PCD:BULLET (satu baris) | bandLevels, actualBar, targetLine |
| P-10 | Waterfall | P perbandingan | pustakachart:v91_waterfall (`PC:1175`, VC-91) | PENUH | PCD:WATERFALL | endsGroundedAtZero, signedDeltaLabels |
| P-11 | Threshold | P perbandingan | datumchart:threshold (`DC:159-202`, cek G5 `DC:119-121`); bantu `pustakachart:legacy_threshold` (`PC:1435`, opsional, butuh toolkit di luar skill `PC:1436-1438`) | PENUH | spec | limitLine.labelled (K), overLimitColour (K) |
| P-12 | Small multiples | P perbandingan | pustakachart:v13_small_multiples (`PC:329`, VC-13) | PENUH (maks 6 panel, kisi 2x3 tetap `PC:333`) | PCD:SM_MULT | sharedScale |
| P-13 | Quadrant | P perbandingan | pustakachart:v72_quadrant (`PC:1066`, VC-72) | PENUH | PCD:SCAT_X, SCAT_Y, SCAT_ANNOT (nama kuadran LITERAL `PC:1076-1081`) | dividerJustification, quadrantNames |
| P-14 | Arrow chart | P perbandingan | TANPA-ACUAN | - | - | - |
| P-15 | Table chart | P perbandingan | pustakachart:v15_table (`PC:354`, VC-15) | PENUH | PCD:TABLE_ROWS, TABLE_HEAD (aturan warna LITERAL `PC:364-371`) | colourRuleLegend |
| H-01 | Scatter | H hubungan | pustakachart:v66_scatter (`PC:992`, VC-66) | PENUH (trendLine=false) | PCD:SCAT_X, SCAT_Y, SCAT_ANNOT | xIsPresumedCause, trendLine |
| H-02 | Bubble | H hubungan | pustakachart:v67_bubble (`PC:1004`, VC-67) | PENUH | PCD:SCAT_X, SCAT_Y, SCAT_SIZE, SCAT_ANNOT | areaProportional, directLabels |
| H-03 | Heatmap | H hubungan | pustakachart:v73_heatmap (`PC:1087`, VC-73) | PARSIAL (ramp, lihat 5.1.2) | PCD:SKOR_M, FAKTOR, NAMA_SITE6 | ramp, scaleShown |
| H-04 | Connected scatter | H hubungan | pustakachart:v68_conn_scatter (`PC:1017`, VC-68) | PENUH | PCD:CS_X, CS_Y (anotasi LITERAL) | - |
| H-05 | Hexbin | H hubungan | pustakachart:v70_hexbin (`PC:1041`, VC-70) | PENUH | PCD:SCAT_X, SCAT_Y | - |
| H-06 | Contour | H hubungan | pustakachart:v71_contour (`PC:1053`, VC-71) | PENUH | PCD:medan_sinyal (fungsi, `PCD:179-182`); grid LITERAL | - |
| H-07 | Network | H hubungan | pustakachart:v79_network (`PC:1105`, VC-79) | PENUH | PCD:NET_NODES, NET_EDGES, NET_LINK_UTAMA | nodeSize, highlightBridges |
| H-08 | Arc diagram | H hubungan | TANPA-ACUAN | - | - | - |
| H-09 | Venn atau Euler | H hubungan | TANPA-ACUAN | - | - | maxSets |
| K-01 | Stacked bar | K komposisi | pustakachart:_stack_rows (`PC:406`, `total100=False`; bantu v20_stacked_column `PC:431`) | PENUH | PARAM (labels, parts, total100, lebar, tinggi) | - |
| K-02 | 100 % stacked bar | K komposisi | pustakachart:v19_stacked_bar (`PC:426`, VC-19, memanggil `_stack_rows(..., True, ...)`) | PENUH | LITERAL di v19 (`PC:427-428`); disuntik lewat panggilan langsung `_stack_rows` (PARAM) | maxSegments, keySegmentLeft |
| K-03 | Diverging bar | K komposisi | pustakachart:v21_diverging_bar (`PC:445`, VC-21) | PENUH | PCD:SURVEI_ASP, SETUJU, TIDAK_SETUJU | meaningfulMidpoint |
| K-04 | Population pyramid | K komposisi | pustakachart:v23_pyramid (`PC:470`, VC-23) | PENUH | PCD:JENJANG, FRONT_END, BACK_END | groups |
| K-05 | Donut | K komposisi | TANPA-ACUAN | - | - | maxSlices, startAngle, clockwise |
| K-06 | Pie | K komposisi | TANPA-ACUAN (rujukan lemah: `ap02_salah` `PC:1272` adalah anti-pola 8 iris, tidak dipakai paritas) | - | - | maxSlices, oneDominant |
| K-07 | Waffle | K komposisi | pustakachart:v24_waffle (`PC:483`, VC-24) | PENUH | PCD:WAFFLE_PARTS | grid |
| K-08 | Icon array | K komposisi | pustakachart:v26_icon_circles (`PC:524`, VC-26); bantu v25_square_area (`PC:502`) | PARSIAL | PCD:KAMERA_SITE | - |
| K-09 | Treemap | K komposisi | pustakachart:v32_treemap (`PC:577`, VC-32) | PENUH | PCD:TREEMAP | labelsInside, limitSmallBoxes |
| K-10 | Funnel | K komposisi | pustakachart:v37_funnel (`PC:655`, VC-37) | PENUH | PCD:FUNNEL | stageValues, conversionPercent |
| K-11 | Sankey | K komposisi | TANPA-ACUAN | - | - | maxLevels, maxEndNodes |
| K-12 | Marimekko | K komposisi | pustakachart:v31_marimekko (`PC:539`, VC-31) | PENUH | PCD:MARIMEKKO | - |
| W-01 | Line | W waktu | pustakachart:v41_line (`PC:697`, VC-41) | PENUH (2 seri tetap) | PCD:BITRATE_A, BITRATE_B | maxLines, labelAtLineEnd |
| W-02 | Column waktu | W waktu | datumchart:column (`DC:204-227`); bantu `pustakachart:v02_column_time` (`PC:205`) | PENUH | spec | maxPeriods |
| W-03 | Step line | W waktu | pustakachart:v48_step (`PC:769`, VC-48) | PENUH | LITERAL (`PC:771` tarif) + PCD:BULAN | - |
| W-04 | Area | W waktu | pustakachart:v42_area (`PC:711`, VC-42) | PENUH | PCD:BULAN, BEBAN_KW | zeroBaseline (K) |
| W-05 | Stacked area | W waktu | pustakachart:v43_stacked_area (`PC:720`, VC-43) | PENUH (3 lapis tetap) | PCD:BITRATE_A, BITRATE_B, BITRATE_C | largestAtBottom, maxLayers |
| W-06 | Bump | W waktu | pustakachart:v45_bump (`PC:732`, VC-45) | PENUH (4 periode tetap `PC:734`) | PCD:BUMP_SERI, BUMP_KV | - |
| W-07 | Gantt | W waktu | pustakachart:v94_gantt (`PC:1196`, VC-94) | PENUH (tanpa garis hari ini) | PCD:GANTT, GANTT_MILESTONE | rowPerTask, milestones, todayLine, rowsInProposal |
| W-08 | Barcode | W waktu | pustakachart:v60_barcode (`PC:938`, VC-60) | PARSIAL | PCD:PING_MS | rowPerEventType, riskyTypeColour |
| W-09 | Horizon | W waktu | TANPA-ACUAN | - | - | subtractBaseline, bands, fold, bandLegend |
| W-10 | Candlestick | W waktu | TANPA-ACUAN | - | - | - |
| S-01 | Histogram | S sebaran | pustakachart:v52_hist (`PC:844`, VC-52) | PARSIAL | PCD:LATENSI (bins=24 LITERAL `PC:846`) | bins, medianMarker |
| S-02 | Box plot | S sebaran | pustakachart:v54_box (`PC:871`, VC-54) | PENUH | PCD:MTBF, SITE | median, box50, outlierPoints |
| S-03 | Density | S sebaran | pustakachart:v53_density (`PC:859`, VC-53) | PENUH | PCD:LATENSI | - |
| S-04 | Violin | S sebaran | pustakachart:v55_violin (`PC:884`, VC-55) | PENUH (3 grup tetap `PC:893`) | PCD:MTBF, SITE | - |
| S-05 | Ridgeline | S sebaran | pustakachart:v59_ridge (`PC:920`, VC-59) | PENUH | PCD:MTBF, SITE | periodOrder, slightOverlap, sharedAxis, maxGroups |
| S-06 | Strip atau jitter | S sebaran | pustakachart:v57_jitter (`PC:909`, VC-57); bantu v56_strip (`PC:898`) | PENUH (3 grup tetap) | PCD:MTBF, SITE (+ jitter RNG internal seeded) | - |
| S-07 | Beeswarm | S sebaran | TANPA-ACUAN (rujukan lemah: v69_cat_scatter `PC:1029` adalah jitter acak, bukan susunan beeswarm) | - | - | columnPerGroup, medianMarker |
| S-08 | Radial histogram | S sebaran | TANPA-ACUAN (keluarga radial diharamkan putusan C2, `PC:1677-1680`) | - | - | northUp, clockwise, uniformSectors |
| G-01 | Tile map | G geospasial | pustakachart:v84_tilemap (`PC:1155`, VC-84) | PARSIAL | PCD:TILE_ROWS, TILE_COLS, TILE_SCORE, TILE_LABEL | standardAbbrev, singleRamp, valueInTile |
| G-02 | Dot map | G geospasial | TANPA-ACUAN (KT-12: skematis di atas grid G-01) | - | - | - |
| G-03 | Flow map | G geospasial | TANPA-ACUAN (KT-12: skematis di atas grid G-01) | - | - | - |
| G-04 | Flowchart | G proses | pustakachart:v81_flow (`PC:1123`, VC-81); paritas utama lewat keluarga diagram `flow` Garis A (S43, `02_structured.md:191`; matriks 6.2 baris DG) | PARSIAL (galeri); PENUH lewat diagram | PCD:FLOW (posisi 6 langkah LITERAL `PC:1125-1126`) | singleReadingDirection, standardShapes, maxSteps |

Jumlah per label (diverifikasi Grep di 8.1):

| Label | Kode | Jumlah |
|---|---|---|
| datumchart | P-01, P-02, P-11, W-02 | 4 |
| pustakachart | P-03..P-10 (8), P-12, P-13, P-15 (3), H-01..H-07 (7), K-01..K-04 (4), K-07..K-10 (4), K-12 (1), W-01, W-03..W-08 (7), S-01..S-06 (6), G-01, G-04 (2) | 42 |
| TANPA-ACUAN | P-14, H-08, H-09, K-05, K-06, K-11, W-09, W-10, S-07, S-08, G-02, G-03 | 12 |
| Total | | 58 |

Per kelompok: P 15 (3 DC, 11 PC, 1 TA), H 9 (0, 7, 2), K 12 (0, 9, 3), W 10 (1, 7, 2), S 8 (0, 6, 2), G 4 (0, 2, 2). Bentuk PARSIAL: P-05, P-09, H-03, K-08, W-08, S-01, G-01, G-04 (8 kode).

#### 5.1.1 Entri VC/AP yang tidak memetakan ke 58 kode

VC-03 grouped bar (varian P-03), VC-12 matrix, VC-16 pareto (dua sumbu Y, melanggar CH-06), VC-20 stacked column, VC-22 diverging column, VC-25 square area, VC-36 dendrogram (drawn=false), VC-40 org chart, VC-47 spline (drawn=false), VC-49 calendar heatmap, VC-50 fan, VC-51 sparkline, VC-56 strip, VC-61 heatmap 1-D, VC-63 ECDF, VC-65 error bar, VC-69 categorical scatter, VC-99 control chart, dan 12 AP. Sumber: `PC:1465-1611`. Tidak dipakai paritas kecuali sebagai rujukan bantu yang disebut di tabel.

#### 5.1.2 Alasan PARSIAL (bukti kode)

| Kode | Definisi katalog | Yang digambar acuan | Bukti |
|---|---|---|---|
| P-05 | Satu atau beberapa titik per kategori | Sebaran ulangan (80 titik per site) + rentang + rerata | `PC:251-266`, `PCD:41` |
| P-09 | Beberapa KPI, pita 3 tingkat | Satu baris; pita 0-60-80-100 literal | `PC:1214-1229`, `PCD:162` |
| H-03 | Ramp putih ke signal (KT-08, P7-27) | `RAMP` = paper, ink200, ink400, ink900 (abu-abu) | `PC:114`, `PC:1089`; KT-08 di D-22 |
| K-08 | Satu ikon satu unit | Lingkaran berluas proporsional | `PC:524-537` ("putusan C2: lingkaran luas proporsional", `PC:1505`) |
| W-08 | Satu baris per jenis kejadian | Satu baris 400 sampel RTT | `PC:938-950` |
| S-01 | 10-20 bin, penanda median | 24 bin, tanpa median | `PC:846` |
| G-01 | 38 provinsi, singkatan baku | Denah gudang 8x6 zona | `PC:1155-1172`, `PCD:135-141` |
| G-04 | Kotak dan panah ISO 5807 lewat mesin diagram (Bab 9) | Patch matplotlib, posisi 6 langkah literal | `PC:1123-1152`; Tabel 8.5 baris G-04 (`04_manual_docx_tables.md:700`) |

### 5.2 Delapan belas jenis `drawn=false`

Sumber daftar: research/01 `01_manual_parameter_catalog.md:580`; baris "-" di Tabel 8.1-8.5 (`04_manual_docx_tables.md:630, 646, 665, 682, 701`). Status v2.1 untuk semua: **masuk registri v2.1 sebagai entri `drawn=false`** (S09, `02_structured.md:157`); KT-01 memasukkan 58 jenis yang digambar, dan 18 ini tercatat tanpa digambar sesuai manual ("Baris bertanda - tercatat tetapi tidak digambar", `MT:1656`). Kolom alternatif dari kolom "Hindari bila" baris yang sama.

| ID | Jenis | Tabel asal | Acuan Python | Alternatif yang ditunjuk manual |
|---|---|---|---|---|
| DF-01 | Radar | 8.1 | TANPA-ACUAN | ganti bar (P-01) |
| DF-02 | Parallel coordinates | 8.1 | TANPA-ACUAN | ganti bar (P-01) |
| DF-03 | Nightingale | 8.1 | TANPA-ACUAN | ganti bar (P-01) |
| DF-04 | Radial bar | 8.1 | TANPA-ACUAN | ganti bar (P-01) |
| DF-05 | Word cloud | 8.1 | TANPA-ACUAN | ganti bar (P-01) |
| DF-06 | Chord diagram | 8.2 | TANPA-ACUAN | ganti heatmap (H-03) |
| DF-07 | Sunburst | 8.3 | TANPA-ACUAN (VC-35 sengaja tidak dirender, `PC:1677-1680`) | treemap (K-09) atau bullet (P-09) |
| DF-08 | Circle packing | 8.3 | TANPA-ACUAN | treemap (K-09) atau bullet (P-09) |
| DF-09 | Dendrogram | 8.3 | pustakachart:v36_dendro (`PC:630`, VC-36), data PCD:DENDRO_LEAF, DENDRO_TREE | treemap (K-09) atau bullet (P-09) |
| DF-10 | Gauge | 8.3 | TANPA-ACUAN | treemap (K-09) atau bullet (P-09) |
| DF-11 | Semicircle donut | 8.3 | TANPA-ACUAN | treemap (K-09) atau bullet (P-09) |
| DF-12 | Spline | 8.4 | pustakachart:v47_spline (`PC:754`, VC-47; sebenarnya moving average, `PC:767`) | line (W-01) |
| DF-13 | Stream graph | 8.4 | TANPA-ACUAN | line (W-01) |
| DF-14 | Spiral | 8.4 | TANPA-ACUAN | line (W-01) |
| DF-15 | OHLC | 8.4 | TANPA-ACUAN | line (W-01) |
| DF-16 | Choropleth | 8.5 | TANPA-ACUAN | tile map (G-01); bubble map untuk angka absolut tidak digambar |
| DF-17 | Bubble map | 8.5 | TANPA-ACUAN | dot map (G-02) |
| DF-18 | Heat map geospasial | 8.5 | TANPA-ACUAN | tile map (G-01) |

Jumlah: 18 (Tabel 8.1: 5, 8.2: 1, 8.3: 5, 8.4: 4, 8.5: 3). Sama sekali tanpa acuan: 16. Berfungsi galeri: 2 (DF-09, DF-12). Paritas: tidak berlaku (tidak dirender); uji = registri menolak render dengan menyebut alternatif (rekomendasi bagian 11).

### 5.3 Chart yang dipakai Manual 000 (prioritas benchmark)

Metode: Grep `G A M B A R` pada MT (24 caption), halaman = nomor `LEMBAR n DARI 102` pertama setelah baris caption (footer dicetak sesudah isi halaman). Penetapan halaman ini konsisten dengan daftar 18 halaman figur besar D-17 (9, 12, 19, 35, 37, 38, 40, 42, 50, 51, 54-61) untuk semua 24 gambar. Isi panel dicek visual pada `GBR\Gambar 8.1..8.5`.

**Bab 7 tidak punya gambar.** "Gambar 7.1" hanya muncul di dalam contoh kalimat caption (`MT:1402-1405`).

| Gambar | Halaman | Baris caption MT | Isi (kode chart) | Ukuran PNG sumber | Jalur paritas benchmark |
|---|---|---|---|---|---|
| 8.1 Perbandingan | 35 | 1591 | P-01..P-15 (15 panel, kisi 3 kolom) | 1960x2598 px = 166 x 220 mm pada 300 dpi | komposit galeri Node lawan PNG |
| 8.2 Hubungan | 37 | 1660 | H-01..H-09 (9 panel) | 1960x2078 px = 166 x 176 mm | idem |
| 8.3 Komposisi dan aliran | 38 | 1706 | K-01..K-12 (12 panel) | 1960x2078 px | idem |
| 8.4 Waktu | 40 | 1766 | W-01..W-10 (10 panel) | 1960x2078 px | idem |
| 8.5 Sebaran, geospasial, proses | 42 | 1817 | S-01..S-08, G-01..G-04 (12 panel) | 1960x2078 px | idem |

Total panel galeri: 15 + 9 + 12 + 10 + 12 = **58 kode, semuanya dipakai Manual 000**, termasuk 12 kode TANPA-ACUAN. Urutan prioritas paritas benchmark mengikuti halaman: 35, 37, 38, 40, 42.

Gambar non-chart (untuk kelengkapan S94, bukan bagian 58 kode):

| Gambar | Halaman | Jenis | Jalur yang disiratkan manual |
|---|---|---|---|
| 2.1, 3.1 | 9, 12 | diagram | dibangun dengan jalur mesin diagram + helper Word (`MT:2232-2233`) -> paritas diagram |
| 4.1 | 19 | render halaman spesimen | raster murni (aset, D-14) |
| 9.1, 9.2, 9.3 | 50, 50, 51 | diagram contoh dari Panduan Simbol (`MT:2249-2252, 2258-2268`) | raster (sumber eksternal) atau spec diagram; keputusan S94 |
| 10.1, 10.3, 10.4, 10.5 | 54, 55, 56, 56 | lembar simbol iec/isa/sec/mil | "dihasilkan langsung oleh datum_symbols.py --sheet" (`MT:2386, 2405, 2445, 2477, 2508`) -> paritas simbol |
| 10.2, 10.6-10.13 | 54, 57-61 | bentuk konvensional, ilustrasi, SLD, denah | raster atau spec; keputusan S94 |

Gaya panel galeri (pengamatan visual, untuk spec komposit S94): 3 kolom; tiap panel = plot tanpa judul, garis tipis ink200 di bawah, kode mono ink400 (mis. `P-01`) lalu nama berhuruf Plex Sans Condensed; label sumbu kecil "x ... / y ..." di pojok kanan atas; aksen signal tunggal per panel. P-11 diberi label "Threshold (mesin DATUM)" tetapi gambarnya tidak sama dengan keluaran `DC` (garis batas hitam putus-putus dengan label di atas dan label nilai di dalam batang; `DC:186-198` menggambar garis batas warna alert dengan label di bawah dasar dan label nilai di kolom kanan).

---

## 6. Matriks paritas

### 6.1 Definisi metode banding

**SVG struktur** (S66). Langkah normalisasi dilakukan di kedua sisi sebelum membandingkan:
- satuan ke mm (DC memakai px 96 dpi tanpa satuan, `DC:53, 147-148`; diagram memakai mm, research/03 `:206`);
- warna heks huruf besar; elemen latar `paper` dibuang;
- teks NFC dengan spasi dinormalkan;
- elemen non-data acuan PC dibuang: judul figur dan footer "CONTOH DATA SINTETIS ..." (`PC:141-149`).

Besaran yang dibandingkan:
- (a) jumlah tanda per jenis (rect, line, path, circle/marker, text);
- (b) himpunan warna isi dan garis;
- (c) sumbu: jumlah, orientasi, garis dasar nol, domain;
- (d) ukuran root mm;
- (e) ukuran font minimum dalam pt dan himpunan ukuran font;
- (f) himpunan teks label data.

**PNG**. Kedua sisi dirasterisasi dengan Chromium Playwright `set_content` pada 300 dpi (research/03 `:538`: `file://` gagal, `set_content` berhasil). Pengecualian: acuan PC sudah PNG Agg 300 dpi (`PC:66, 152`). Yang dilaporkan:
- SSIM abu-abu jendela 7x7 (metode CAL, research/05 `:23`) pada 300 dpi, plus nilai pada 72 dpi agar setara skala benchmark;
- diff piksel = persen piksel dengan selisih luminans lebih dari 32/255.

**DOCX**: XML kanonik dari `document.xml`, `styles.xml`, `numbering.xml`, dan `sectPr`; urutan teks; grid tabel; properti run; himpunan fon tertanam. Byte ZIP tidak dibandingkan karena cap waktunya berbeda (D-13).

**PDF**: kedua sisi memakai soffice 24.2.3.2 dengan render-env yang sama (D-15, S91). Yang dibandingkan: jumlah halaman, teks per halaman, SSIM per halaman (CAL: abu-abu, 72 dpi, 7x7), dan fon tertanam.

### 6.2 Matriks per format dan per kelompok acuan (ambang usulan)

| Baris | Cakupan | Acuan | SVG struktur: ambang | PNG: ambang | Gerbang atau diagnosis |
|---|---|---|---|---|---|
| CA | 4 kode datumchart (P-01, P-02, P-11, W-02) | `DC:render` dengan spec yang sama | (a) selisih 0 per jenis; (b) himpunan identik; (c) identik, nol wajib; geometri per elemen +/- 0,05 mm; (d) +/- 0,01 mm; (e) himpunan identik setelah normalisasi 6.4-N1, Node min >= 5,5 pt; (f) multiset identik termasuk format angka `1.234,5` (`DC:62-65`) | SSIM >= 0,995; diff <= 0,5 % | Gerbang |
| CB1 | 34 kode pustakachart PENUH | fungsi PC, data disuntik (6.3) | (a) jumlah tanda DATA selisih 0 (= jumlah datum); (b) multiset warna tanda data identik, aksen signal <= 1; (c) jumlah dan orientasi sumbu identik, nol wajib untuk bar/column/area (CH-01), domain +/- 5 % rentang, jumlah tick +/- 2; (d) lebar = `lebar_mm` registri PC tepat 128/166, tinggi +/- 3 mm dari `tinggi_mm` registri; (e) Node >= 5,5 pt dan >= min acuan - 0,3 pt (acuan diukur `measure_min_pt`, `PC:156-165`); (f) himpunan label data identik (judul sumbu literal dikecualikan) | SSIM dan diff dilaporkan; bendera bila SSIM < 0,70 | (a), (b), (d), (e), (f) gerbang; (c) domain dan tick, serta PNG, diagnosis |
| CB2 | 8 kode pustakachart PARSIAL (P-05, P-09, H-03, K-08, W-08, S-01, G-01, G-04) | fungsi PC | Hanya (d) dan (e) dari CB1, ditambah cek per kode: P-09 per baris pita/batang/target; H-03 jumlah sel = baris x kolom dan ramp per KT-08 (bukan warna acuan); K-08 jumlah unit; W-08 jumlah garis = jumlah kejadian; S-01 jumlah batang = bins; G-01 jumlah ubin = jumlah wilayah; G-04 lihat baris DG. Sisanya lint seperti CC | Dilaporkan saja | Gerbang hanya pada cek yang disebut |
| CC | 12 kode TANPA-ACUAN | tidak ada | Lint saja (6.5) + snapshot diri (hash SVG Node beku sebagai regresi) | tidak berlaku | Lint gerbang; snapshot regresi |
| BG | Gambar 8.1-8.5 (komposit galeri, 58 panel) | PNG `GBR` / halaman BM.pdf 35, 37, 38, 40, 42 | Jumlah panel per gambar identik (15, 9, 12, 10, 12); urutan kode identik; teks kode dan nama panel identik | SSIM per figur pada 300 dpi dilaporkan, sasaran >= 0,90; SSIM per panel (potong kisi) dilaporkan | Diagnosis (D-17: figur di bawah ambang tidak menggagalkan); kontribusi ke SSIM rata-rata halaman >= 0,95 |
| DG | Diagram 9 keluarga (layered, topology, stack, flow, swimlane, sequence, sld, rack, graph) | `HS\datum_diagram.py build_svg` Garis A (`:1115`), fixture `good_layered.json`, `good_sld.json` + spec per keluarga S63 | jumlah simpul dan edge identik; bentuk per simpul identik; pola `stroke-dasharray` per jenis edge identik (Tabel 9.4, P9-27..31); himpunan warna identik (maks 5); multiset teks identik; root mm +/- 0,1 mm; kotak simpul +/- 0,1 mm; jumlah titik path rute identik, koordinat +/- 0,1 mm; jumlah hop identik (r 0,9 mm); daftar `checks_run` identik | SSIM >= 0,99; diff <= 1 % | Gerbang |
| SY | Simbol 41 (iec 16, isa 12, sec 7, mil 6) dan lembar per dialek | `HS\datumsimbol.py symbol_svg/sheet_svg` (`:297, :313`); `ports_in_mm` dari `RL\scripts\datum_symbols.py render` (`:577`) | jumlah dan jenis elemen identik; token numerik `d` dan atribut geometri +/- 0,01 mm; tebal garis identik; himpunan warna identik; viewBox identik; port +/- 0,01 mm; jumlah halaman lembar per dialek identik, blok <= 247 mm | SSIM >= 0,995; diff <= 0,5 % | Gerbang |
| DX | DOCX dokumen (JSON v1) | adapter S64 ke `DatumDocx` Garis A | urutan teks 100 % identik; jumlah paragraf, tabel, sel per tabel, gambar identik; `sectPr` (ukuran halaman, margin, kolom) identik dalam twip; properti run (wajah, ukuran half-point, tebal, warna, caps) cocok >= 98 % run setelah kanonikalisasi (default yang dihilangkan disetarakan); himpunan fon tertanam identik | tidak berlaku | Gerbang |
| PD | PDF dokumen | DOCX acuan Python lalu soffice, mesin sama dengan sisi Node (D-15) | jumlah halaman selisih 0; teks per halaman identik di 100 % halaman; himpunan fon tertanam identik | SSIM per halaman (CAL) rata-rata >= 0,99 dan minimum >= 0,97; ambang dikalibrasi ulang ke lantai derau (6.4-N3) | Gerbang |
| HT | HTML artifact | tidak ada acuan Python | lint + snapshot DOM; rujukan bantu `RL\scripts\datum_render.py check_page` (overflow LINT 37, research/03 `:536`) | tangkapan Chromium sebagai snapshot regresi | Lint gerbang |
| BM | Benchmark Manual 000 | BM.docx / BM.pdf | ambang D-17: >= 98 % unit teks identik berurutan; selisih jumlah per jenis <= 2 %; >= 100/102 halaman teks identik | SSIM rata-rata semua halaman >= 0,95 | Gerbang (D-17), bukan ambang usulan S02 |

Jumlah kode yang tercakup baris chart: CA 4 + CB1 34 + CB2 8 + CC 12 = 58.

### 6.3 Penyuntikan data ke fungsi galeri (adapter S65)

| Pola | Kode | Cara | Bukti |
|---|---|---|---|
| Timpa atribut `PCD` | 38 kode berasal data `PCD:` | Set `pustakachart_data.<ATTR>` (diimpor sebagai `D`, `PC:47`) sebelum memanggil fungsi; fungsi membaca `D.<ATTR>` saat dipanggil | contoh `PC:193-194` |
| Panggil helper ber-PARAM | K-01, K-02 | Panggil `_stack_rows(labels, parts, total100, width_mm, height_mm, out, title)` langsung | `PC:406` |
| LITERAL | P-07, W-03 (dan bagian literal dari P-13, P-15, H-04, H-06, G-04) | Data acuan tidak dapat diganti tanpa menyalin fungsi. Usulan: fixture S63 memakai data literal acuan apa adanya (`PC:284-287`, `PC:771`), sehingga Node yang diuji memakai data yang sama | `PC:282-297`, `PC:769-776` |

Penanganan wajib lain di adapter:
- Reset `fn_ax[0] = None; fn_grid[0] = None` sebelum setiap panggilan (`PC:176, 1627`).
- Lewatkan `title=""` dan netralkan footer `CAPTION_LABEL` (`PC:68, 147-149`). Bila tidak, tanda teks tambahan masuk perbandingan.
- Keluaran SVG: berikan path ber-ekstensi `.svg` agar matplotlib menulis SVG berteks nyata (`svg.fonttype none`, `PC:112`). Pemanggilan `savefig(..., metadata={"Software": None})` (`PC:152`) mungkin ditolak backend SVG karena kunci metadata tak dikenal (hipotesis, verifikasi di S65). Mitigasinya: pola spy `savefig` yang sudah dipakai `legacy_threshold` (`PC:1441-1456`).
- Klasifikasi tanda data di SVG matplotlib lewat id grup (`patch_N`, `line2d_N`, `PathCollection_N`, `text_N`) adalah hipotesis yang perlu diverifikasi S66. Sisi Node perlu atribut peran tanda (6.4-N2).

### 6.4 Normalisasi dan keputusan ambang (5W1H, tier 1)

**N1. Ukuran font datumchart**
- Apa: `DC` menulis `font-size` 6,0-7,0 dalam satuan pengguna SVG (`DC:126-132, 171-240`), dengan root dalam px 96 dpi (`DC:53, 147`). Bila disisipkan pada lebar nominal 128/166 mm, 6,8 px = 5,1 pt dan 6,0 px = 4,5 pt, di bawah lantai 5,5 pt (DATUM-28, P7-36).
- Siapa terdampak: S32, S66.
- Alasan: paritas ketat pada angka mentah akan memaksa Node mereproduksi pelanggaran lint.
- Keputusan usulan: pembanding menafsirkan angka `font-size` DC sebagai pt nominal dan membandingkan himpunan angka itu, sedangkan Node menulis ukuran yang benar secara fisik.
- Alternatif yang ditolak:
  - salin px apa adanya: melanggar DATUM-28;
  - kecualikan font dari banding: kehilangan cek.
- Asumsi: niat penulis DC adalah pt (hipotesis).
- Celah: belum diukur pada render nyata.
- Keyakinan: aritmetika HIGH, niat MEDIUM.

**N2. Tanda data Node**
- Apa: cek CB1 (a) dan (b) butuh pemisahan tanda data dari dekorasi.
- Siapa: S01/S03 (kontrak), S32 (inti chart).
- Usulan: setiap tanda data di SVG Node membawa atribut peran (mis. `data-role="mark"`, `data-series`). Nama atribut final ditetapkan S01.
- Alternatif: heuristik geometri, ditolak karena rapuh.

**N3. Lantai derau PDF**
- Apa: ambang PD (rata-rata 0,99 dan minimum 0,97) diturunkan dari kalibrasi research/05. Kalibrasi itu lintas lingkungan (BM Linux lawan lokal: rata-rata 0,9815, minimum 0,534 pada halaman 92); paritas PD sama-lingkungan seharusnya jauh lebih rapat (hipotesis).
- Metodologi wajib S66: konversi DOCX yang sama dua kali, ukur SSIM.
- Bila lantai derau di bawah 0,999: ambang = lantai - 0,01 untuk rata-rata, dan lantai minimum - 0,02 untuk minimum.
- Alternatif: memakai D-17 0,95. Ditolak karena D-17 adalah ambang benchmark lintas lingkungan, terlalu longgar untuk mendeteksi selisih DOCX.

**N4. Mengapa CA ketat dan CB bertoleransi**
- CA: DC adalah SVG deterministik dari spec, dan Node adalah port langsungnya. Satu-satunya derau adalah pembulatan float (`:.2f`, `DC:131`), sehingga 0,05 mm (sekitar 0,19 px) cukup.
- CB: acuan dirender matplotlib (tata letak otomatis, tick otomatis, `bbox_inches="tight"` mengubah ukuran kanvas, `PC:152`), dan Node menggambar SVG asli. Geometri dan piksel karena itu tidak dapat disamakan. Yang setara adalah data, warna, sumbu, dan teks data (KT-02 b).
- Ambang PNG CB hanya diagnosis. Rasterisator berbeda (Agg lawan Skia), sehingga SSIM tidak mengukur kebenaran port.
- Bendera 0,70: nilai empiris belum ada (celah). S66 menetapkan ulang setelah run pertama.

**N5. Diagram dan simbol ketat**
- Port tata letak Garis A deterministik dan berbasis stdlib (research/03 `:207`), dan keduanya dirasterisasi Chromium yang sama, sehingga SSIM >= 0,99 masuk akal.
- Toleransi 0,1 mm (diagram) dan 0,01 mm (simbol) mengikuti grid kisi `10,667 x 4,7625 mm` (P9-38) dan geometri simbol berdasar mm.
- Asumsi: aritmetika float JS dan Python setara sampai 1e-9.

**N6. BG hanya diagnosis**
- D-17 menyatakan figur di bawah ambang adalah diagnosis.
- Data panel harus ditranskripsi dari PNG. Sebagian nilai terbaca dari label (P-01, P-02, P-10, K-02, K-10, K-11, W-02), sebagian hanya bisa ditaksir (scatter, hexbin, horizon, beeswarm), sehingga SSIM 1,0 mustahil.
- Sasaran >= 0,90 per figur adalah usulan, tanpa data empiris (celah).

### 6.5 Perlakuan TANPA-ACUAN (lint saja)

Cek umum (semua 12):
- lebar 128/166 mm (P7-20);
- maks 5 warna (P7-17);
- aksen <= 1 (P7-06);
- font >= 5,5 pt (P7-36);
- tanpa judul di plot (P7-14);
- tanpa kotak legenda, legenda hanya baris KUNCI (P7-13);
- tanpa efek terlarang (P7-15);
- tinggi <= 247 mm;
- garis dasar nol bila berlaku (P7-04).

Cek khusus per kode (dari parameter katalog):

| Kode | Cek khusus |
|---|---|
| P-14 | panah per kategori = 2 titik berpasangan; arah sesuai tanda selisih |
| H-08 | simpul segaris; jumlah busur = jumlah relasi |
| H-09 | jumlah himpunan <= 3 (maxSets) |
| K-05 | iris <= 5; mulai jam 12; searah jarum jam; angka kunci di tengah |
| K-06 | iris <= 5; satu iris dominan |
| K-11 | tingkat <= 3; simpul akhir <= 12; total tiap tingkat sama |
| W-09 | pita 2-3; legenda pita wajib |
| W-10 | OHLC lengkap per titik; naik dan turun dibedakan dengan posisi, bukan warna saja |
| S-07 | titik tidak bertumpuk; satu kolom per grup; median ditandai |
| S-08 | utara di atas; searah jarum jam; sektor seragam |
| G-02, G-03 | digambar di atas grid G-01 (KT-12); label "wilayah ilustrasi" bila skematis; ketebalan panah sebanding volume (G-03) |

Lint gerbang menentukan status rilis, bukan pencegahan pembuatan berkas (A10, `02_structured.md:58`).

---

## 7. Key Findings

| ID | Temuan | Keyakinan | Bukti | Implikasi |
|---|---|---|---|---|
| F-S02-01 | Galeri Manual 000 (Gambar 8.1-8.5) tidak dihasilkan `PC` di disk: data berbeda dari `PCD`, 12 kode TANPA-ACUAN tergambar, dan gaya panel (kisi 3 kolom, kode mono di bawah garis) tidak ada di PC. Caption mengklaim "SUMBER pustakachart.py" (`MT:1593`). Grep frasa panel ("Tile map 38 provinsi", "Pie, maks. 5 bagian") pada `C:\Users\TRIAL\workspace` (*.py), `hermes\skills`, dan `profiles\gspuser02\skills`: tidak ada berkas. Grep `"TNI AL"` di workspace (*.py, json, js, ts): hanya JSON snapshot IL, tidak ada pembangun | HIGH (beda data); MEDIUM (pembangun tidak ada di disk; hipotesis: ada di repo `gsp-datacenter` yang tidak terjangkau, KT-15) | `GBR\Gambar 8.1..8.5` (dilihat); `PCD:15-16`; `PC:1465-1611` | S94 tidak boleh mengambil data galeri dari `PCD` (bertentangan dengan teks baris S94 `02_structured.md:242`); data ditranskripsi dari PNG. Butuh spec komposit galeri |
| F-S02-02 | Panel P-11 "Threshold (mesin DATUM)" di Gambar 8.1 berbeda dari keluaran `DC` (warna dan letak garis batas, letak label nilai) | HIGH | gambar 8.1 panel P-11; `DC:170-198` | Paritas port P-11 (lawan DC) dan paritas benchmark P-11 (lawan PNG) menuntut tampilan berbeda; spec chart perlu opsi gaya, atau benchmark menerima deviasi sebagai diagnosis |
| F-S02-03 | Font `DC` dalam px menghasilkan 4,5-5,25 pt fisik | HIGH (aritmetika) | `DC:53, 126-132, 147` | Normalisasi N1; catat sebagai temuan register |
| F-S02-04 | Heatmap acuan memakai ramp abu-abu, bertentangan dengan KT-08 | HIGH | `PC:114, 1089`; D-22 KT-08; panel H-03 manual ber-ramp putih ke signal (dilihat) | H-03 PARSIAL; warna diuji lewat lint KT-08, bukan lawan acuan |
| F-S02-05 | 8 kode berbentuk PARSIAL di acuan | HIGH | 5.1.2 | Hanya subset cek struktural; sisanya lint |
| F-S02-06 | Fungsi PC tidak berparameter; 38 kode dapat disuntik lewat atribut `PCD`, 2 lewat helper ber-PARAM, 2 berdata LITERAL | HIGH | 6.3 | Adapter S65 butuh monkeypatch modul; fixture S63 memakai data literal untuk P-07, W-03 |
| F-S02-07 | Acuan PC menulis PNG dengan judul dan footer di dalam figur serta kanvas `bbox_inches="tight"` | HIGH | `PC:141-153` | Ukuran dibandingkan lawan `lebar_mm`/`tinggi_mm` registri, bukan ukuran PNG; teks judul/footer dikecualikan |
| F-S02-08 | Wajah default teks PC = `IBM Plex Sans` (workbook_ui), bukan Condensed seperti DC | HIGH | `PC:94, 106`; `HS\tokens.json:51` | Himpunan fon tidak dijadikan gerbang untuk CB; untuk CA wajib identik |
| F-S02-09 | Dari 18 `drawn=false`, 2 punya fungsi galeri (VC-36, VC-47) | HIGH | `PC:630, 754` | Bila kelak digambar, acuan tersedia hanya untuk dua |
| F-S02-10 | Bab 7 tanpa gambar; seluruh chart manual ada di 5 gambar galeri di halaman 35, 37, 38, 40, 42 | HIGH | Grep MT `G A M B A R` (24 baris) dan footer `LEMBAR` | Prioritas benchmark chart = 5 figur ini |

## 8. Verifikasi (bukti segar)

### 8.1 Hitungan

Grep (mode count) dijalankan pada berkas ini setelah ditulis. Kolom ke-3 tabel 5.1 adalah kelompok, kolom ke-4 adalah acuan.

| Pola | Hasil | Arti |
|---|---|---|
| `^\| [PHKWSG]-\d\d \|[^|]*\| [PHKWSG] (perbandingan\|hubungan\|komposisi\|waktu\|sebaran\|geospasial\|proses) \|` | **58** | baris tabel 5.1 |
| `^\| DF-\d\d \|` | **18** | baris tabel 5.2 |
| `^\| [PHKWSG]-\d\d \|[^|]*\|[^|]*\| TANPA-ACUAN` | **12** | kolom acuan = TANPA-ACUAN |
| `^\| [PHKWSG]-\d\d \|[^|]*\|[^|]*\| (datumchart\|pustakachart):` | **46** | kolom acuan berlabel |

12 + 46 = 58: setiap kode punya acuan atau label TANPA-ACUAN. Catatan: pola longgar `^\| [PHKWSG]-\d\d \|` memberi 76, karena ikut menghitung 8 baris tabel 5.1.2 dan 10 baris tabel 6.5 (58 + 8 + 10 = 76).

### 8.2 Ambang per format

Ambang tercantum di 6.2 untuk:
- SVG: baris CA, CB1, CB2, DG, SY;
- PNG: baris CA, DG, SY (gerbang), CB, BG (diagnosis);
- DOCX: baris DX;
- PDF: baris PD;
- HTML: baris HT (lint);
- benchmark: baris BM (D-17).

## 9. Files/Modules Involved

| Konsumen | Pakai bagian |
|---|---|
| S09 registri chart | 5.1 (acuan, bentuk, parameter), 5.2 (DF-01..DF-18 + alternatif) |
| S32-S43 keluarga chart | 5.1, 5.1.2, 6.5 (cek khusus), N1, N2 |
| S63 fixture | 5.1 asal data, 6.3 (data literal P-07, W-03) |
| S65 adapter figur | 6.3 (penyuntikan, reset global, SVG, spy savefig) |
| S66 pembanding | 6.1, 6.2, 6.4 |
| S94 spec figur benchmark | 5.3, F-S02-01, F-S02-02 |
| S96/S98 benchmark | baris BG dan BM |

## 10. Risks

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Data galeri tidak terbaca persis dari PNG | SSIM BG rendah | Diagnosis saja (D-17); prioritaskan panel berlabel angka |
| Spec komposit galeri tidak ada di kontrak | S94 tidak dapat mengekspresikan Gambar 8.x selain sebagai raster | Permintaan kontrak (bagian 11, butir 1) |
| Klasifikasi tanda matplotlib meleset | CB1 (a) palsu gagal | S66 memverifikasi pada 3 fungsi lebih dulu; fallback cek (a) jadi diagnosis |
| Backend SVG menolak `metadata` | Adapter gagal | Spy `savefig` (`PC:1441-1456`) |
| Ambang usulan belum dikalibrasi empiris | Gerbang terlalu ketat atau longgar | S66 run pertama melaporkan distribusi; maks 3 siklus penyesuaian dicatat controller |

## 11. Recommendations dan Acceptance Criteria

Rekomendasi (untuk controller, dimediasi ke pemilik):

1. **Kontrak (S01/S03)**:
   - tambah komposit galeri chart (`panels[]`, `columns`, `code`, `name`, `panelHeightMm`);
   - tambah atribut peran tanda data (N2);
   - tambah registri `drawn=false` dengan `alternatives[]` dan kode galat render (mis. `CHART_NOT_DRAWN`; nama final oleh S01).
2. **S94**: ganti "data dari pustakachart_data.py bila berasal dari galeri" menjadi "data ditranskripsi dari panel PNG Gambar 8.x". Tandai nilai taksiran dengan provenans ASUMSI.
3. **S32**: tulis ukuran font fisik pt (N1). Sediakan opsi gaya threshold "galeri" (F-S02-02) atau terima deviasi P-11 di benchmark.
4. **Register temuan**: F-S02-01..F-S02-04 dicatat controller.

Acceptance criteria baris S02:

- 58 kode dan 18 `drawn=false` terhitung (8.1);
- setiap kode berlabel acuan atau TANPA-ACUAN (5.1);
- ambang per format tercantum (6.2).

Plan draft `masterplan/02_plan_draft.md`: **dilewati**. Baris ini riset murni; rencana implementasi sudah ada di blueprint (D-22).
