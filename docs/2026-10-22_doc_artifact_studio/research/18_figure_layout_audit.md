# 18 — Audit tata letak mesin grafik dan diagram Studio (FIG-01)

Baris FIG-01, pemicu keputusan USER D-477 (`decisions/decisions.md:482`): "sering terjadi penimpaan label / crossing yang mengganggu pada kasus text panjang / diagram kompleks".
Kategori: Riset/Debug (audit + diagnosis). Repo `C:\Users\TRIAL\gsp-swarm-hq-v2.1` branch `v2.1`. Agen: `test-expert`; skill: `diagnosing-bugs` (loop umpan balik dulu, baru hipotesis), `webapp-testing` (Chromium headless lewat playwright-core).
Kode produksi TIDAK diubah. Satu-satunya berkas yang ditulis di repo adalah dokumen ini. Harness dan bukti ada di `C:\Users\TRIAL\AppData\Local\Temp\fig_audit\`.

## 1. Ringkasan

1. **Keluhan USER terbukti dan bisa diulang secara mekanis.** Dari 831 render yang berhasil (776 grafik, 55 diagram), **468 (56 %) punya minimal satu cacat geometris terukur**: teks bertumpuk, teks keluar viewBox, teks memotong tanda, label lebih lebar dari simpulnya, tepi bersilangan, atau tepi berimpit. Mesin hanya melaporkan FAIL pada 2 di antaranya (`W-07` many, DATUM-26 aksen). Lint keluaran tidak memeriksa geometri teks maupun tepi sama sekali (`engine/chart/core/guards.ts:362-408`).
2. **Masukan normal hampir bersih, tekanan langsung pecah.** Gaya `datum` (bawaan v2 untuk blok chart tunggal): normal 8/58 cacat, label panjang 44/57, kategori banyak 33/47, banyak+panjang 41/45, legenda panjang 30/42. Diagram: semua keluarga yang menerima 15-24 simpul cacat (24/24 render), dan sebagian besar keluarga menolak kasus itu dengan DATUM-37 atau DATUM-33.
3. **Tiga akar dominan menjelaskan sebagian besar cacat.** (a) Tinggi kanvas tidak bergantung isi: hanya P-01/P-11 yang tumbuh mengikuti jumlah kategori (`chart/core/render.ts:38-43`). (b) Label selalu satu baris: tidak ada bungkus, potong, atau rotasi otomatis. Bungkus 2 baris hanya ada di G-04 (`family-g/flowchart.ts:214`); rotasi tetap -15 derajat hanya di P-10 datum (`family-p2/waterfall.ts:147`). (c) Diagram tanpa tata letak berbasis graf: posisi simpul ditentukan agen lewat `class.row/col/tier/lane`, lebar simpul dibagi rata per tingkat tanpa melihat label (`diagram/layout-a/layered.ts:53-54`, `layout-a/flow.ts:28-31`), tidak ada pengurang persilangan, dan label tepi tanpa penghindar tabrakan (`diagram/build/svg.ts:121-136, 307-316`).
4. **Agen v2 praktis tidak punya tuas revisi.** `heightMm`, `params`, `style`, `layout`, dan `widthMm` ditolak sebagai medan tampilan (`contract/schema/v2/forbidden.ts:43,61,68`). Satu-satunya tuas tata letak adalah `chart.custom` `form.orientation` untuk batang (CU-01/CU-02/CU-04). Eksperimen membuktikan tinggi dinamis menghapus cacat (K-01 30 kategori: 96 cacat pada 50 mm menjadi 0 pada 160 mm). Jadi perbaikan paling murah ada di **mesin otomatis**, bukan di parameter agen.
5. **Risiko paritas terkendali bila perbaikan berpagar.** `convert_v2 --check` hanya membandingkan JSON doc.v2/template.v2 (`benchmark/extract/convert_v2.ts:34,536`), jadi tidak terdampak oleh perubahan geometri SVG. Paritas SVG kelas CA/DG (geomTol 0,05/0,1 mm, multiset teks identik) dan pin jumlah ParamDef (136, `tests/unit/studio/figures/chart-smoke.test.ts`) yang akan terdampak. Aturannya: ubah perilaku hanya bila cacat terdeteksi.

## 2. Metodologi (loop umpan balik)

### 2.1 Harness (semua di `C:\Users\TRIAL\AppData\Local\Temp\fig_audit\`)

| Berkas | Fungsi |
|---|---|
| `gen.ts` | Mengimpor mesin in-process seperti uji `tests/unit/studio/figures/chart-smoke.test.ts` (`renderChart`, `buildDiagramSvg(spec, { release: true })`) dan merender setiap kode tergambar x gaya x kasus. Spec dasar: fixture paritas `tests/parity/fixtures/chart/*.json` + `tests/unit/studio/figures/fixtures/chart_extra_panels.json`; diagram: `tests/parity/fixtures/diagram/dg_*.json` + generator tekanan. Keluaran: `out/svg/*.svg`, `out/manifest.json` (status ok/rejected + checkId), `out/dgspec_*.json`. |
| `measure.mjs` | Chromium `ms-playwright/chromium-1234` (playwright-core 1.62.1). Memuat setiap SVG pada 4 px/mm dengan @font-face IBM Plex (terpasang; `out/fontcheck.json`: condOk/monoOk true, lebar berbeda dari fallback) lalu mengukur dengan `getBBox` + `getScreenCTM` (rotasi ikut dihitung) dan `isPointInFill`/`isPointInStroke`. Keluaran: `out/results.json`, PNG berlapis cacat di `out/png/*.png` (merah = teks bertumpuk, magenta = keluar viewBox, oranye = teks memotong tanda, biru = garis menembus teks, lingkaran merah = persilangan tepi). |
| `summarize.mjs` | Agregat: `out/summary_total.json`, `summary_per_case.json`, `summary_per_code.json`, `summary_est.json`. |
| `exp.ts` | Eksperimen tuas yang ada (heightMm, chart.custom orientation): `out/manifest_exp.json`, `out/results_exp.json`. |

Perintah (dijalankan, keluaran nyata):

```
cd C:/Users/TRIAL/AppData/Local/Temp/fig_audit
C:/Users/TRIAL/gsp-swarm-hq-v2.1/node_modules/.bin/tsx gen.ts      -> total 1009 ok 831 rejected 94 na 84
node measure.mjs                                                    -> measured 831   (58,5 s)
node summarize.mjs                                                  -> total { renders: 831, defective: 468, ... }
MANIFEST=out/manifest_exp.json RESULTS=out/results_exp.json node measure.mjs
```

Determinisme: `gen.ts` dijalankan dua kali, sha256 gabungan semua SVG identik (`743f4a57...ec57`).

### 2.2 Kasus uji

- **Grafik** (58 kode tergambar dari registri; 76 entri = 58 tergambar + 18 `drawn=false`. Brief menyebut "83 entri", tetapi `CHART_REGISTRY.length` = 76) x gaya `datum`/`gallery` x 8 kasus:
  - `normal`: fixture apa adanya;
  - `longLabel`: label kategori/simpul/grup/sel 52-65 karakter bahasa Indonesia, mis. "Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Bandung Barat";
  - `many`: 30 kategori/kategori seri, 40 titik xy, matriks 24x24, 25 simpul graf, 20 grup distribusi, 60 OHLC;
  - `manyLong`: `many` + label panjang;
  - `extreme`: 0,004 sampai 987.654.321;
  - `negative`: tanda campur;
  - `longLegend`: nama seri/grup 60-66 karakter;
  - `longTitle`: apparatus `figure` + judul 150 karakter + SUMBER + catatan panjang.

  Kasus yang tidak berlaku untuk bentuk data ditandai `na` (84).
- **Diagram** (9 keluarga) x 9 kasus:
  - `normal` (fixture), `longLabel`, dan `longTitle` (apparatus figure);
  - `many15`/`many24` dengan label pendek dan panjang (tepi bersilang acak, 2 jenis tepi agar tidak melewati DATUM-25);
  - `fit16`/`fit16long`: varian dipersempit (graph 4 kolom, tingkat 3 simpul, swimlane 3 simpul per lajur) supaya lolos batas lebar dan persilangan tetap bisa diukur.

### 2.3 Metrik mekanis (per render)

| Metrik | Definisi | Ambang |
|---|---|---|
| `textOverlap` | Luas irisan poligon (Sutherland-Hodgman) antar dua kotak teks (em box disusutkan 12 % atas/bawah ke tinggi tinta) | > 0,2 mm² dan > 8 % luas kotak terkecil; dihitung per **pasangan** |
| `textOutside` | Sudut kotak teks di luar `[0,W]x[0,H]` viewBox | > 0,3 mm |
| `textStraddleMark` | 21 titik sampel dalam kotak teks; sebagian (bukan semua) jatuh di isian tanda `[data-mark]` berisi | 0 < masuk < 21. Label yang seluruhnya di dalam batang/ubin dianggap sengaja. |
| `lineThroughText` | Sampel teks kena goresan tanda garis/tautan; label diagram dengan pita knockout dikecualikan | >= 1 sampel |
| `textExceedsNode` | Teks yang pusatnya di dalam simpul `[data-node]` tetapi lebih lebar dari simpul itu | > 0,3 mm |
| `textOverNode` | Teks kena garis tepi simpul | >= 1 sampel |
| `edgeCross` | Perpotongan sejati segmen tautan polilinear (`M/L`) antar tepi berbeda; di luar 0,6 mm dari ujung tepi | per titik |
| `edgeCollinear` | Dua tepi berimpit pada segmen yang sama lebih dari 1 mm (batang bersama yang ambigu) | per pasangan segmen |
| `edgeThroughNode` | Segmen tepi menembus interior simpul bukan-ujung (susut 0,3 mm) | per pasangan |

Keterbatasan dan positif palsu yang diketahui:
- Label kontur H-06 berhalo memicu `textStraddleMark`/`lineThroughText` (dibuktikan visual: `out/png/H-06__datum__normal.png` terbaca baik).
- Sentuhan tipis label titik scatter dengan titik tetangga (H-01/H-02 normal, 2/21 sampel) bersifat minor.
- Tepi yang menempel menyusuri garis tepi simpul tidak dihitung `edgeThroughNode` karena susut 0,3 mm. Kasus ini terlihat visual di `DG-graph__normal.png` dan `DG-flow__fit16long.png`.
- Kurva (sankey, busur arc) tidak dihitung persilangannya.

## 3. Peta tata letak (di mana label diposisikan dan diukur)

### 3.1 Pengukuran teks

- Grafik: `textWidthMm` = jumlah karakter x em rata-rata (struct 0,5; data/mono 0,6) x ukuran pt (`chart/core/svg.ts:27-29, 77-80`). Tidak ada metrik fon atau kerning.
- Diagram: `estTextPt` = karakter x pt2mm x 0,56 untuk semua peran (`diagram/core/tokens.ts:252-258`).
- Akurasi terukur di Chromium (`out/summary_est.json`, rasio lebar nyata/taksiran, teks >= 6 karakter):

| Kelompok | n | p10 | p50 | p90 | maks | % taksiran terlalu kecil (> 5 %) |
|---|---|---|---|---|---|---|
| struct-chart (Plex Sans Condensed) | 5955 | 0,80 | 0,85 | 0,94 | 1,07 | 0,4 |
| struct-diagram | 746 | 0,72 | 0,80 | 0,83 | 1,12 | 1,1 |
| mono-chart (Plex Mono) | 1048 | 1,00 | 1,00 | 1,00 | 1,00 | 0 |
| mono-diagram (label tepi `evidence_rail`) | 408 | 1,07 | 1,07 | 1,07 | 1,07 | **100** |

Kesimpulan: pengukuran berbasis karakter **tidak** menjadi akar utama. Untuk struct taksirannya justru konservatif (lebih lebar 15-20 %). Pengecualian: taksiran label tepi diagram mono selalu 7 % terlalu kecil (0,56 vs em Plex Mono 0,6), sehingga pita knockout (`diagram/core/svg.ts:319-330`) lebih sempit dari teksnya. Akar sebenarnya: hasil ukur dipakai untuk menjepit (clamp), bukan untuk memutuskan bungkus, rotasi, atau menambah ruang.

### 3.2 Grafik — label, margin, tinggi

| Unsur | Lokasi kode | Perilaku saat teks panjang/banyak |
|---|---|---|
| Tinggi kanvas | `chart/core/render.ts:38-43` (`spec.heightMm` -> `CHART_REFERENCE_HEIGHT_MM` (`core/heights.ts`) -> lebar x 0,5) | Tetap, tidak bergantung jumlah kategori atau panjang label. Tumbuh hanya pada inti P-01/P-11 (`core/datum.ts:63-82`, n x 7,2 mm). Terukur: semua kode lain sama tingginya antara normal dan 30 kategori (mis. P-03 58 mm, K-01 50 mm, S-02 56 mm). |
| Talang label kategori batang datum (P-01/P-11) | `core/datum.ts:117, 143` (`kiri = 22` tetap, teks `anchor end` di x 19,8) | Tidak diukur; label panjang terpotong di tepi kiri (6/6 label keluar viewBox). |
| Kolom nilai batang datum | `core/datum.ts:151` (x = W - 1,5 tetap) | Aman. |
| Label kategori kolom datum (P-02/W-02) | `core/datum.ts:204` (tengah, KAPITAL, satu baris) | Tidak dibungkus/rotasi; label panjang saling timpa jadi satu pita tak terbaca dan keluar kiri-kanan (`out/png/P-02__datum__longLabel.png`). |
| Talang label batang gallery/P1 | `core/gallery.ts:49-50`, `family-p1/common.ts:372-375` (`labelGutter`, plafon 42 % lebar) | Diukur, tetapi dijepit 42 %; label melewati plafon terpotong kiri (P-01 gallery 128 mm: 6/6). Pada 166 mm label 63 karakter muat (eksperimen `EXP-P01-long-gallery`: 0 cacat). |
| Label kategori sumbu-x distribusi | `family-s1/common.ts:263-266` (`groupLabel`), `family-s2/common.ts:365-370` (`columnLabel`) | Tengah, satu baris, tanpa ukur jarak antar kolom: S-02/S-04/S-06/S-07 tumpuk pada 20 grup. |
| Label kategori waterfall datum | `family-p2/waterfall.ts:102, 147` | Satu-satunya rotasi (-15 derajat tetap, pita label maks 14 mm). Pada 30 kategori tetap tumpuk (P-10 many: 43 pasangan). |
| Label langsung seri kolom grup | `family-p1/grouped-column.ts:166-178` (`directLabels`) | Penghindar sederhana: naik 2,6 mm sekali bila bertabrakan dengan label sebelumnya; tidak berulang. |
| Penyebar label | `family-p1/common.ts:381-397` (`spreadLabels`) | Ada penyebar 1-D (jarak minimal + jepit), tetapi tidak dipakai oleh keluarga yang paling tumpuk (s1/s2/w2/h1/h2). |
| Label titik scatter | `family-h1/scatter.ts:55-59` (`pointLabel`) | Kanan, atau dibalik ke kiri bila melewati tepi; tanpa cek tabrakan antar label atau dengan titik. |
| Label simpul network / arc | `family-h2/network.ts:264-265`; `family-h2/arc.ts:53-58` | Network: kanan/kiri simpul tanpa cek tabrakan. Arc: jarak simpul = lebar/(n-1) tanpa melihat lebar label (H-08 many: 24 pasangan tumpuk). |
| Tabel P-15 | `family-p2/table.ts:175-195` (`rowH = min(avail/n, 5,4)`) | Baris dipadatkan ke tinggi tetap. 24 baris: tinggi baris di bawah tinggi huruf, semua teks bertumpuk (P-15 manyLong: 5017 pasangan). |
| Label ubin peta | `family-g/tile-map.ts:124-140` | Susut huruf bila >= 70 % muat, selain itu tetap digambar meluap ubin. |
| Baris KUNCI (legenda) | `chart/core/apparatus.ts:46-60` (`keyRow`), `family-p1/common.ts:399-403` (`keyRowWidth`) | Satu baris tanpa bungkus dan tanpa cek lebar. Item yang lewat W jatuh di luar kanvas; seri ke-3 K-01 hilang dari pandangan (`out/png/K-01__datum__longLegend.png`). |
| Caption + SUMBER (apparatus figure) | `chart/core/apparatus.ts:27-30` | Satu baris; judul 150 karakter keluar kanan di 116/116 render (SUMBER 78/116). Di v2 blok chart tunggal memakai apparatus `page` (caption dicetak dokumen), jadi dampaknya pada komposit/ekspor SVG mandiri. |
| Catatan (`note`) | `chart/core/apparatus.ts:33-35` | Satu baris di tengah; 130 karakter masih muat pada 128 mm (tidak ada cacat terukur). |
| Label nilai di dalam tanda | mis. `core/datum.ts:147`, `family-k1/stack.ts:161,201`, `family-k1/pie.ts:140`, `family-k2/treemap.ts:226-227` | Uji muat lalu tempatkan di dalam atau di luar; tidak ada garis penunjuk. Segmen tumpukan tipis membuat label nilai melintasi batas segmen (K-02: 342 kejadian). |

### 3.3 Diagram — simpul, tepi, label

| Unsur | Lokasi kode | Perilaku |
|---|---|---|
| Posisi simpul | Ditentukan agen: `class.row/col/tier/lane` (`contract/types/v2/doc.ts:108-118`, `DiagramSpecV2`); `per_row` hanya untuk flow | Tidak ada tata letak otomatis berbasis graf (tidak ada penetapan lapis, pengurutan barycenter/median, atau transpose). |
| Lebar simpul layered/topology/stack | `diagram/layout-a/layered.ts:50-64` | Lebar = (W - celah)/m dijepit [3, 10] kisi, **sama untuk semua simpul setingkat, tanpa melihat label**. `nodeSize` hanya dipakai untuk tinggi. Label panjang meluap kotak dan menimpa simpul tetangga. |
| Lebar simpul flow `per_row` | `layout-a/flow.ts:18-50` | Sama seperti layered. Tanpa `per_row`: lebar = label (+60 % untuk diamond, `flow.ts:59`), sehingga label panjang ditolak DATUM-37 (simpul diamond -10,7..128 mm). |
| Kolom graph | `layout-c/graph.ts:62-80` (pitch 4 kisi, rapat-lebar, ROWPACK) | 5 kolom di 166 mm ditolak (simpul jatuh di x 170,7 mm, lebar 0); 4 kolom dengan label panjang ditolak DATUM-37. |
| Swimlane | `layout-b/swimlane.ts:61-76` | Simpul diletakkan berurutan kiri-ke-kanan per lajur tanpa kolom waktu bersama. Kapasitas sekitar 3 simpul per lajur di 166 mm; lebih dari itu DATUM-37. |
| Jepit lebar lembar | `core/sheet.ts:136-153` (`snapToLattice`) | Lebar simpul dijepit ke sisa lembar tanpa menyesuaikan teks; simpul lebar 0 di luar lembar memicu DATUM-37. |
| Teks simpul | `core/svg.ts:209-221` (`nodeSvg`) | Satu baris di pusat simpul; tanpa bungkus, potong, atau susut. |
| Rute tepi | `build/route.ts:155-198` (`routePlaced`), `:98-141` (`detour`) | Sisi dipilih dari arah pusat ke pusat, jangkar dikipas per sisi, jalur ortogonal 3 segmen dengan `midy`/`midx` tunggal. Detur maksimal 6 percobaan mengelilingi kotak penghalang (gagal = DATUM-32). **Tidak ada pengurang persilangan dan tidak ada pemisahan jalur**: tepi dengan `midy` sama berimpit (291 segmen berimpit). |
| Persilangan | `build/route.ts:205-228` (`crossingHops`) | Persilangan tidak dikurangi, hanya diberi busur lompat r 0,9 mm. |
| Label tepi | `build/svg.ts:121-136` (`labelPos`), `:307-316` | Titik tengah segmen terpanjang yang tidak di dalam simpul. Bila semua bertabrakan, jatuh ke titik tengah segmen terpanjang meski di dalam simpul. Tidak ada cek tabrakan antar label tepi, dengan teks simpul, atau dengan baris SUMBER/KEY. |
| KEY/caption/SUMBER | `build/svg.ts:318-343` | Satu baris; caption panjang keluar kanan (9/9 longTitle). |
| Grafik G-04 (flowchart family-g) | `chart/family-g/flowchart.ts:205-220` | Satu-satunya pembungkus 2 baris (memilih belahan kata dengan baris terlebar minimum). Tetap meluap pada 3+ baris yang dibutuhkan (G-04 longLabel: label melebihi simpul). |

## 4. Hasil uji tekanan

### 4.1 Frekuensi per kasus (render bercacat / render; lalu jumlah render per jenis cacat)

Grafik gaya `datum` (bawaan v2 blok tunggal):

| Kasus | Bercacat | tumpuk | keluar | potong tanda | garis tembus | lebih lebar dari simpul | tepi simpul | silang |
|---|---|---|---|---|---|---|---|---|
| normal | 8/58 | 0 | 1 | 6 | 2 | 1 | 1 | 0 |
| longLabel | 44/57 | 21 | 35 | 6 | 4 | 1 | 1 | 0 |
| many | 33/47 | 31 | 6 | 12 | 4 | 0 | 0 | 1 |
| manyLong | 41/45 | 33 | 32 | 12 | 5 | 0 | 1 | 1 |
| extreme | 13/51 | 6 | 6 | 3 | 1 | 0 | 0 | 0 |
| negative | 6/30 | 3 | 1 | 3 | 2 | 0 | 0 | 0 |
| longLegend | 30/42 | 11 | 27 | 3 | 0 | 0 | 0 | 0 |
| longTitle (apparatus figure) | 58/58 | 6 | 58 | 7 | 2 | 1 | 1 | 0 |

Grafik gaya `gallery` (komposit): normal 4/58, longLabel 36/57, many 26/47, manyLong 36/45, extreme 6/51, negative 2/30, longLegend 21/42, longTitle 58/58.

Diagram (render yang lolos mesin):

| Kasus | Bercacat | tumpuk | keluar | garis tembus | lebih lebar dari simpul | tepi simpul | silang | berimpit |
|---|---|---|---|---|---|---|---|---|
| normal (fixture) | 5/9 | 3 | 1 | 1 | 1 | 3 | 0 | 0 |
| longLabel | 5/7 | 4 | 4 | 2 | 4 | 3 | 0 | 0 |
| longTitle | 9/9 | 3 | 9 | 1 | 1 | 3 | 0 | 0 |
| many15 / many24 | 8/8 | 4 | 0 | 2 | 0 | 3 | 6 | 6 |
| many15long / many24long | 8/8 | 6 | 6 | 8 | 6 | 6 | 6 | 6 |
| fit16 / fit16long | 11/14 | 7 | 4 | 5 | 5 | 6 | 5 | 8 |

Jumlah mentah (grafik tanpa longTitle): 18.550 pasangan tumpuk (9.987 di antaranya dari P-15 tabel), 1.250 teks keluar, 2.793 teks memotong tanda, 141 garis menembus teks, 68 persilangan (H-07). Diagram: 291 pasangan tumpuk, 185 label lebih lebar dari simpul, 82 persilangan, 291 segmen berimpit, 0 tepi menembus interior simpul (DATUM-32 bekerja; yang lolos adalah tepi yang menyusuri garis tepi simpul).

### 4.2 Tabel kegagalan per modul/kode (tanpa longTitle; data lengkap per kode di `out/summary_per_code.json`)

| Modul (kode) | Bercacat | Jenis dominan | Contoh terburuk (PNG di `C:\Users\TRIAL\AppData\Local\Temp\fig_audit\out\png\`) |
|---|---|---|---|
| core (P-01, P-02, P-11, W-02) | 24/44 | P-01/P-11: label keluar kiri (talang tetap 22 mm). P-02/W-02: label kolom saling timpa. | `P-01__datum__longLabel.png`, `P-02__datum__longLabel.png`, `P-02__datum__manyLong.png` |
| family-p1 (P-03..P-08) | 42/82 | Tumpuk label sumbu-x 30 kategori; legenda keluar kanan; label kiri terpotong pada plafon 42 % | `P-03__datum__manyLong.png`, `P-03__datum__longLegend.png`, `P-08__gallery__many.png` |
| family-p2 (P-09..P-15) | 50/80 | P-15 baris tabel dipadatkan; P-10 rotasi -15 derajat tak cukup; P-13 label titik; P-14 garis menembus label | `P-15__datum__manyLong.png`, `P-10__datum__many.png`, `P-13__datum__manyLong.png` |
| family-h1 (H-01..H-05) | 26/68 | Label titik scatter/bubble tumpuk dan menimpa titik (H-02 many: 34 pasangan + 30 potong tanda). H-03 heatmap dan H-05 hexbin hanya cacat longTitle (pola baik). | `H-02__datum__manyLong.png`, `H-01__datum__manyLong.png` |
| family-h2 (H-06..H-09) | 19/38 | H-07 network: 17 persilangan (many) + label tumpuk segaris. H-08 arc: label tumpuk. H-06: positif palsu label kontur. | `H-07__datum__manyLong.png`, `H-08__datum__manyLong.png` |
| family-k1 (K-01..K-06) | 30/64 | Label nilai memotong batas segmen tumpukan; label kategori keluar kiri; legenda keluar kanan | `K-02__datum__manyLong.png`, `K-01__datum__longLegend.png` |
| family-k2 (K-07..K-12) | 19/56 | K-12 marimekko: label kategori tumpuk/keluar; K-10 funnel: label panjang keluar | `K-12__gallery__manyLong.png`, `K-10__datum__manyLong.png` |
| family-w1 (W-01, W-03..W-05) | 18/54 | Hanya label tepi sumbu-x terpotong kiri/kanan (tick sudah dijarangkan, pola baik) | `W-01__datum__longLabel.png` |
| family-w2 (W-06..W-10) | 20/56 | W-06 bump: label ujung tumpuk (30 kategori: 29 pasangan); W-07 gantt: label kiri terpotong; W-08 barcode | `W-06__datum__manyLong.png`, `W-07__datum__manyLong.png` |
| family-s1 (S-01..S-04) | 20/52 | Label grup sumbu-x tumpuk (20 grup); S-03 density: label menimpa kurva | `S-03__datum__manyLong.png`, `S-02__datum__manyLong.png` |
| family-s2 (S-05..S-08) | 27/50 | Label kolom grup tumpuk/keluar | `S-06__datum__manyLong.png`, `S-07__datum__manyLong.png` |
| family-g (G-01..G-04) | 11/16 | G-01 label ubin meluap/tumpuk; G-03 garis aliran menembus nama kota; G-04 label melebihi simpul | `G-01__datum__longLabel.png`, `G-04__datum__longLabel.png` |
| DG-flow | 7/7 | Lebar simpul rata (`per_row`): label meluap; label tepi jatuh di dalam simpul; tepi menyusuri tepi simpul | `DG-flow__fit16long.png`, `DG-flow__many24long.png` |
| DG-graph | 2/2 lolos (6 ditolak) | Silang + berimpit; tepi menyusuri sisi simpul; busur silinder menimpa label | `DG-graph__normal.png`, `DG-graph__fit16.png` |
| DG-layered | 6/8 | Paling dekat keluhan USER: label meluap, label tepi bertumpuk 3-4 lapis, 14 persilangan, 38 berimpit (many24) | `DG-layered__many24long.png`, `DG-layered__fit16long.png` |
| DG-topology | 8/8 | Sama dengan layered; label zona keluar kiri 4,3 mm bahkan pada fixture | `DG-topology__many24long.png`, `DG-topology__normal.png` |
| DG-swimlane | 2/3 lolos (5 ditolak) | Label meluap simpul | `DG-swimlane__longLabel.png` |
| DG-sequence | 2/4 lolos (4 ditolak DATUM-33) | Label peserta meluap kotak | `DG-sequence__longLabel.png` |
| DG-stack | 0/4 lolos (4 ditolak DATUM-33) | Hanya longTitle | — |
| DG-rack | 8/8 | Label tepi menimpa label perangkat (fixture pun) | `DG-rack__normal.png`, `DG-rack__longLabel.png` |
| DG-sld | 2/2 lolos (6 ditolak) | Fixture: label tepi "KE BEBAN" dan jalurnya menimpa baris SUMBER; label rel dicoret batang rel | `DG-sld__normal.png` |

### 4.3 Penolakan (kapasitas tata letak; `out/manifest.json`)

- Grafik (68 ditolak):
  - CH-01 negatif pada P-01/P-02/P-03/P-09/P-11/K-01/K-02/K-04/W-02/W-05 (benar secara semantik; pesan galat menyarankan K-03/P-10);
  - plafon kategori `maxSlices` K-05/K-06 (> 5), `maxPeriods` W-02 (> 12), `maxGroups` S-05 (> 12), `maxLevels` K-11 (> 3), DATUM-25 K-07 (30 bagian), K-08 (> 100 ikon).

  Semua plafon menolak (422), tidak ada yang mengagregasi menjadi "lainnya".
- Diagram (26 ditolak): DATUM-37 graph (>= 5 kolom, atau 4 kolom berlabel panjang), swimlane (> 3 simpul per lajur), sld (> 3 per tingkat), flow longLabel (diamond); DATUM-33 sequence (> 12 pesan) dan stack (> 8 tingkat).
- Kesenjangan perilaku: keluarga yang **menolak** (graph/swimlane) aman tetapi tidak membantu agen. Keluarga yang **menerima** (layered/topology/flow per_row) menghasilkan gambar rusak tanpa satu pun FAIL.

### 4.4 Eksperimen tuas yang ada (`out/results_exp.json`)

| Eksperimen | Tinggi | Cacat |
|---|---|---|
| K-01, 30 kategori, tinggi bawaan | 50 mm | 58 tumpuk + 38 potong tanda |
| K-01, 30 kategori, `heightMm: 160` | 160 mm | 0 |
| P-04, 30 kategori, bawaan / `heightMm: 160` | 58 / 160 mm | 29 / 0 |
| P-02 label panjang (kolom) | 46 mm | 9 tumpuk + 2 keluar |
| Sama via `chart.custom` CU-01 horizontal (P-01 datum) | 49,2 mm | 6 keluar (talang tetap 22 mm) |
| P-01 gallery label panjang pada 166 mm | 49,2 mm | 0 |

Makna: tinggi dinamis dan orientasi horizontal dengan talang terukur menghapus cacat. Agen v2 tidak dapat mengirim `heightMm` (DF-22), dan CU-01 jatuh ke P-01 gaya datum yang talangnya tetap. Jadi tuas yang tersedia tidak menolong.

## 5. Akar per jenis kegagalan

| Jenis | Akar (file:baris) | Bukti |
|---|---|---|
| A. Tumpuk vertikal (banyak kategori/baris) | Tinggi tidak bergantung isi: `chart/core/render.ts:38-43`, `core/heights.ts`; tabel `family-p2/table.ts:180` | Tinggi sama antara normal dan many untuk semua kode yang merender kasus many kecuali P-01/P-11 (§3.2); eksperimen `heightMm` 160 menjadi 0 cacat |
| B. Tumpuk horizontal label sumbu-x | Label tengah satu baris tanpa ukur jarak slot: `core/datum.ts:204`, `family-s1/common.ts:263-266`, `family-s2/common.ts:365-370`, P1/P2/K2 sejenis; rotasi hanya `family-p2/waterfall.ts:147` | P-02/P-03/S-02/S-06/K-12 many/longLabel |
| C. Label terpotong kiri (talang) | Talang tetap `core/datum.ts:117`; plafon 42 % `core/gallery.ts:50`, `family-p1/common.ts:372-375`; label ujung sumbu-x tanpa jepit di w1/w2 | P-01/P-11/K-01/K-02/W-01/W-07 longLabel |
| D. Legenda keluar kanan / item hilang | `chart/core/apparatus.ts:46-60` satu baris tanpa bungkus | longLegend: 27/42 keluar (datum) |
| E. Label nilai memotong tanda | Uji muat biner tanpa garis penunjuk/penghindar: `family-k1/stack.ts:161,201`, `family-k1/pie.ts:140` | K-01/K-02 342 kejadian |
| F. Label titik/simpul bertabrakan | Tanpa penghindar tabrakan: `family-h1/scatter.ts:55-59`, `family-h2/network.ts:264`, `family-h2/arc.ts:53-58`; `spreadLabels` (`family-p1/common.ts:381`) tidak dipakai di sana | H-01/H-02/H-07/H-08/W-06 many |
| G. Caption/SUMBER keluar (apparatus figure) | Satu baris: `chart/core/apparatus.ts:27-30`; `diagram/build/svg.ts:318-343` | 116/116 grafik, 9/9 diagram longTitle |
| H. Label simpul meluap kotak | Lebar dibagi rata tanpa label: `diagram/layout-a/layered.ts:53-54`, `layout-a/flow.ts:28-31`; jepit lebar `core/sheet.ts:143-146`; teks satu baris `core/svg.ts:215` | 185 kejadian; `DG-layered__many24long.png` |
| I. Label tepi bertumpuk/di dalam simpul/menimpa SUMBER | `diagram/build/svg.ts:121-136` (fallback ke titik tengah meski di simpul; tanpa cek antar label), knockout 7 % terlalu sempit untuk mono (`core/tokens.ts:252-253` vs Plex Mono) | `DG-flow__fit16long.png`, `DG-sld__normal.png`, `DG-rack__normal.png` |
| J. Persilangan dan tepi berimpit | Urutan simpul dari agen (tanpa pengurutan barycenter); rute 3 segmen dengan `midy`/`midx` tunggal tanpa pemisahan jalur: `build/route.ts:182-193`; persilangan hanya diberi lompatan: `route.ts:205-228` | 82 silang, 291 berimpit |
| K. Kapasitas: penolakan alih-alih adaptasi | `layout-c/graph.ts:62-80`, `layout-b/swimlane.ts:65-71`, plafon `maxSlices`/`maxPeriods`/`maxGroups` (registri) | 94 penolakan (§4.3) |
| L. Tidak ada gerbang geometri | `chart/core/guards.ts:362-408` (lint: huruf, warna, lebar, tinggi, garis, aksen, raster saja); diagram `build/svg.ts` hanya DATUM-32/33/37/25 | 466 dari 468 render bercacat tanpa FAIL |

## 6. Usulan perbaikan berprioritas (untuk FIG-02/FIG-03)

Prinsip: mesin memutuskan tata letak secara otomatis (sesuai prinsip konten-saja v2: agen mengirim isi, templat + mesin memiliki keluaran). Setiap perbaikan **aktif hanya bila cacat terdeteksi**, sehingga masukan normal tetap byte-identik (lihat §8).

### P0 — gerbang dan fondasi

1. **Lint geometri teks (FIG-03, sekaligus alat ukur perbaikan).** Port metrik §2.3 ke Node tanpa browser: kotak teks dari lebar taksiran (struct x 0,85 terkalibrasi, mono x 1,0) + anchor + rotasi; irisan, luar viewBox, potong tanda (rect/circle), garis menembus teks (segmen line/polyline), persilangan dan berimpit untuk `data-mark="link"`. Laporan REPORT, bukan FAIL, dengan `suggest` (lihat §7). Harness ini menjadi uji regresi: `out/results.json` adalah garis dasar merah.
2. **Satu modul `textfit` bersama** (`chart/core/textfit.ts`) dipakai grafik dan diagram:
   - `measure(s, pt, face)` dengan em terkalibrasi (struct 0,425 em efektif, mono 0,6);
   - `wrap(s, maxW, maxLines)` memecah di batas kata dengan baris terlebar minimum (generalisasi `family-g/flowchart.ts:205-220`) dan menghasilkan `<tspan>` dalam satu `<text>` agar multiset teks tetap sama;
   - `ellipsize(s, maxW)` sebagai jalan terakhir dengan teks lengkap di `<title>`.
3. **Tinggi kanvas bergantung isi** di `estimateHeightMm` (`chart/core/render.ts:38-43`): untuk keluarga baris (K-01..K-04, P-04, P-06, P-07, P-09, P-14, P-15, W-07, S-05) tinggi = max(acuan, n x pitch minimum + pita), dijepit `maxHeightMm`. Untuk P-15, `rowH` minimum = 1,35 x tinggi huruf. Aktif hanya bila `n x pitch > tinggi acuan`.

### P1 — label grafik

4. **Strategi label sumbu kategori bertingkat** (satu fungsi untuk core/p1/p2/s1/s2/k2/w2): muat satu baris -> bungkus 2-3 baris dalam lebar slot -> rotasi -45 derajat dengan pita dinamis -> tipiskan (tampilkan tiap k) -> **orientasi horizontal otomatis** untuk keluarga batang/kolom kategoris (P-02 -> tata letak P-01, P-03 -> batang grup horizontal) bila label terpanjang lebih dari 1,5 x lebar slot atau n > ambang. Laporkan REPORT `AUTO_ORIENT`.
5. **Talang kiri terukur dengan bungkus** untuk P-01/P-11 datum: ganti `kiri = 22` dengan talang terukur yang dijepit `W x 0,42`. Label melebihi talang dibungkus 2 baris (baris batang 7,2 mm cukup untuk 2 baris 6,6 pt). Penting juga untuk `chart.custom` CU-01.
6. **Margin dinamis untuk label ujung sumbu-x** (w1/w2/S): jepit `anchor` ke start/end di slot pertama/terakhir atau tambahkan margin.
7. **Legenda berbungkus**: `keyRow` -> `keyRows(items, maxW)` multi-baris, lalu tinggi bertambah KEY_ROW_HEIGHT per baris. Item yang lebih panjang dari W dibungkus. Bila seri > 4 atau nama panjang, pindahkan legenda ke bawah plot atau gunakan label langsung di ujung garis (sudah ada `labelAtLineEnd` W-01).
8. **Penghindar tabrakan label nilai/titik + garis penunjuk**: generalisasi `spreadLabels` (1-D) untuk label ujung (W-06 bump, P-08 slope, S-03 density) dan penempatan greedy 8-posisi di sekitar titik untuk scatter/network (H-01/H-02/H-07/P-13). Label yang tidak muat diberi garis penunjuk atau disembunyikan dengan REPORT `LABEL_DROPPED`. Label nilai segmen tumpuk yang tidak muat dipindah ke luar dengan penunjuk atau dihilangkan bila v < ambang.
9. **Pengelompokan "lainnya"/top-N** sebagai alternatif penolakan: K-05/K-06 (> 5 iris), K-07, W-02 (> 12 periode dialihkan ke W-01 bila diminta), S-05 (> 12 grup). Gabungkan ekor menjadi "Lainnya (k)" dan laporkan REPORT `AGGREGATED`. Perilaku penolakan lama dipertahankan sebagai bawaan bila tim memilih ketat (keputusan USER, lihat §7).

### P1 — diagram

10. **Lebar simpul berbasis label + bungkus teks simpul**: layered/topology/flow `per_row`. Lebar = max(lebar terukur label yang dibungkus ke <= 3 baris, 3 kisi). Bila jumlah lebar tingkat > W, bungkus dulu lalu pecah tingkat ke 2 baris. Tinggi simpul bertambah per baris (`nodeSize` units). Teks simpul memakai `<tspan>` (`core/svg.ts:215`).
11. **Tata letak berlapis gaya Sugiyama untuk graph/layered/topology/flow (opt-in otomatis bila agen tidak memberi `col`/`row`, atau bila hasil pengukuran > 0 persilangan)**:
    - penetapan lapis dari tepi (longest-path), atau pakai `tier` agen sebagai lapis tetap;
    - pengurutan dalam lapis dengan barycenter/median 2-arah 4-8 putaran + transpose lokal untuk meminimalkan persilangan;
    - koordinat x Brandes-Köpf sederhana atau pusat-median yang dikunci kisi.

    Urutan `class.col` agen dipakai sebagai urutan awal, sehingga masukan yang sudah tanpa silang tidak berubah.
12. **Rute ortogonal dengan pemisahan jalur**: `midy` per pasangan tepi dipisahkan dalam kanal antar-lapis (offset kisi 0,5-1 baseline per tepi, diurutkan menurut x tujuan) agar tidak berimpit. Opsional: A* pada kisi visibilitas dengan biaya belokan + silang + kedekatan simpul sebagai pengganti `detour` 6 percobaan.
13. **Penempatan label tepi tanpa tabrakan**:
    - kandidat sepanjang setiap segmen (tengah, 1/4, 3/4) diberi skor oleh irisan dengan semua kotak teks/simpul/label lain + baris kaki;
    - fallback ke penunjuk atau label bernomor dengan daftar di KEY bila tidak ada yang bebas;
    - knockout memakai lebar mono 0,6 em.
14. **Kapasitas yang membantu**: swimlane memakai kolom waktu bersama (urutan topologis tepi) lalu membungkus ke baris kedua dalam lajur, bukan DATUM-37. Graph >= 5 kolom memadatkan pitch dan membungkus label sebelum menolak. Pesan galat menyebut aksi konkret (mis. "maks 4 kolom pada 166 mm; bagi menjadi dua gambar atau pakai layered").

### P2

15. Caption/SUMBER berbungkus (apparatus figure grafik/diagram): bungkus ke W dan tambahkan pita.
16. Label zona diagram dijepit ke dalam lembar (`build/svg.ts:296-304`). Label rel bus dipindah dari atas batang rel (sld).
17. Kalibrasi `textWidthMm` dengan tabel lebar glif Plex sebenarnya (AFM ringkas, 95 glif ASCII + diakritik umum). Hanya perlu bila lint P0 menunjukkan positif palsu akibat taksiran lebar konservatif.

## 7. Opsi revisi yang mudah bagi agen

Kendala kontrak: v2 menolak `params`/`heightMm`/`layout`/`style` (DF-22/40/19/47). Usulan dibagi dua lapis agar tidak melanggar prinsip konten-saja.

### 7.1 Medan maksud analitis (konten, bukan tampilan) — usulan tambahan kontrak blok chart

Pola `form.orientation` pada `chart.custom` (`docs/STUDIO-AGENT-GUIDE.md` §17.12) sudah menjadi preseden.

| Medan (blok chart) | Nilai | Makna | Bawaan bila absen |
|---|---|---|---|
| `orientation` | `auto` / `horizontal` / `vertical` | Arah pembacaan kategori (batang/kolom, grup, tumpuk) | `auto` (aturan §6 butir 4) |
| `sort` | `none` / `desc` / `asc` | Urutan kategori (sekarang hanya P-01/P-04/P-06 lewat params templat) | `none` (D-368: urutan agen) |
| `topN` | 3..30 | Pertahankan N teratas, gabungkan sisanya menjadi "Lainnya" (+ label agen opsional `otherLabel`) | absen = tanpa agregasi (atau agregasi otomatis bila plafon terlampaui, keputusan USER) |
| `labelShort` | per titik/kategori: `{ label, short }` | Label singkat untuk sumbu; label lengkap tetap di tabel/alt teks | absen = mesin membungkus |

Medan tampilan murni (`labelWrap`, `labelPosition`, `legendPosition`, `maxCategories`) **tidak** disarankan masuk kontrak agen. Mesin memutuskannya otomatis (§6) dan templat dapat mengunci kebijakannya (ParamDef templat, bukan agen). Bila USER tetap ingin agen bisa memaksa, tambahkan sebagai `presentationHint` terpisah yang selalu bisa diabaikan mesin, dengan REPORT `HINT_IGNORED`.

### 7.2 Lint gambar yang memberi saran parameter (FIG-03, keluaran `report.issues` + respons MCP)

| Temuan lint | Saran yang dikembalikan ke agen |
|---|---|
| Label kategori tumpuk/terpotong, label terpanjang > 1,5 x slot | "pakai `orientation: "horizontal"`" atau "kirim `labelShort` (maks ~24 karakter)" |
| n kategori > kapasitas (tinggi > blok teks atau plafon kode) | "pakai `topN: 8`" atau "pisah menjadi dua gambar" atau kode alternatif (K-05 -> P-01) |
| Legenda > 1 baris / nama seri > 40 karakter | "persingkat nama seri" (mesin tetap membungkus) |
| Diagram: persilangan > 0 setelah tata letak otomatis, atau berimpit > 0 | "hapus `class.col` agar mesin menata ulang", "pecah menjadi 2 diagram (maks ~12 simpul per tingkat 166 mm)" |
| Label simpul > 3 baris setelah bungkus | "persingkat label simpul (maks ~40 karakter); detail ke `sub`" |
| Label tepi tidak mendapat posisi bebas | "persingkat label tepi (maks ~20 karakter)" |

Pasangkan dengan alat MCP revisi satu gambar (rencana D-477): pratinjau satu figur (SVG + laporan lint) dan patch medan konten figur per pid tanpa mengirim ulang bab.

## 8. Risiko paritas preset

| Pagar | Apa yang dibandingkan | Dampak perubahan FIG-02 | Mitigasi |
|---|---|---|---|
| `convert_v2 --check` Manual 000 (`benchmark/extract/convert_v2.ts:34`) | Regenerasi JSON doc.v2/template.v2 di memori; DIFF bila berkas berbeda (`:536`) | Tidak terdampak perubahan geometri SVG. **Terdampak** bila ParamDef templat baru dikonversi/ditulis ke template.v2 (mis. kebijakan `chart.labelPolicy`) atau bila spec benchmark bm-fig-17..21 (`figures/index.json`) disentuh. | Tambah ParamDef templat hanya dengan bawaan registri (tidak diemit converter), atau perbarui converter + tetapkan ulang SAME x3 dalam baris yang sama. |
| Pin registri `tests/unit/studio/figures/chart-smoke.test.ts` (136 ParamDef, 76 entri, 58 tergambar) | Jumlah | Medan maksud baru (§7.1) di kontrak v2 tidak menambah ParamDef; ParamDef templat baru menaikkan pin. | Perbarui pin dengan catatan keputusan. |
| Paritas SVG kelas CA (P-01, P-02, P-11, W-02 datum; `scripts/parity/compare/thresholds.py:21-33`) | tagCountDelta 0, geomTol 0,05 mm, multiset teks identik | Bungkus memakai `<tspan>` mengubah jumlah tag dan multiset teks bila dipecah menjadi `<text>` terpisah. Talang terukur menggeser geometri. Tinggi dinamis mengubah akar SVG. | Aktif hanya bila cacat terdeteksi (label > talang 22 mm, n > ambang). Fixture paritas berlabel pendek, jadi tetap byte-identik. Uji regresi: render fixture S63 sebelum/sesudah = sha identik. |
| Kelas CB1 (pustakachart PENUH; heightTol +/- 3 mm, labelSetIdentical) | Tinggi acuan dan himpunan label | Tinggi dinamis melampaui +/- 3 mm hanya bila n > acuan; agregasi "Lainnya" mengubah himpunan label. | Sama: ambang aktivasi di atas isi fixture; agregasi tidak pernah aktif tanpa `topN` atau plafon terlampaui. |
| Kelas DG diagram (`thresholds.py:71-88`: engineReportIdentical termasuk n_hops, multiset teks, geomTol 0,1 mm, kelas D-242) | Laporan mesin dan geometri | Sugiyama/pemisahan jalur mengubah posisi dan n_hops. Bungkus label simpul mengubah tinggi simpul. | Tata letak otomatis hanya bila (a) agen tidak memberi `col`/`row`, atau (b) jumlah persilangan/berimpit terukur > 0. Fixture dg_* sebagian sudah berimpit/menimpa (sld, rack, graph), jadi cabang (b) **akan** mengubah fixture itu. Butuh keputusan USER: terima deviasi tercatat (seperti D-137/D-242) atau batasi ke cabang (a). |
| Uji asap `chart-smoke.test.ts` (0 FAIL lint, determinisme) | Lint | Lint geometri baru harus REPORT, bukan FAIL, agar asap tetap hijau. Fixture normal punya 8 render bercacat. | Mulai sebagai REPORT; naikkan ke FAIL hanya untuk kelas cacat yang sudah diperbaiki. |

## 9. Celah dan langkah lanjut

- **Tidak diuji**: komposit (`renderComposite`) dengan panel berlabel panjang; templat selain A4; DOCX/HTML hasil akhir (hanya SVG mesin). Kelas cacat DOCX (penskalaan gambar) di luar cakupan.
- **Positif palsu detektor**: H-06 label kontur berhalo; sentuhan minor label scatter. Tepi menyusuri garis tepi simpul tidak terhitung (hanya terlihat visual). Lint FIG-03 perlu metrik "jarak tepi ke batas simpul < 0,5 mm".
- **Hipotesis (belum diuji)**: lebar 128 mm (kolom teks) akan memperparah semua angka kasus label panjang. Beberapa kode diuji pada lebar fixture (128 atau 166 mm) tanpa variasi lebar.
- **Rekomendasi urutan FIG-02**: P0-1 (lint = loop merah) -> P0-2/P0-3 -> P1-4/5/7 (sebagian besar cacat grafik) -> P1-10/13 (diagram, keluhan utama) -> P1-11/12 (Sugiyama + jalur) -> P1-8/9 -> P2. Jalankan ulang `gen.ts` + `measure.mjs` setelah setiap langkah. Target: kasus normal 0 cacat, longLabel/many < 10 % render bercacat, diagram fit16long 0 tumpuk dan 0 berimpit.
- Keputusan yang perlu dibawa controller ke USER: (1) agregasi otomatis "Lainnya" vs tetap menolak; (2) medan maksud baru di kontrak v2 (`orientation`/`sort`/`topN`/`labelShort`); (3) deviasi paritas DG untuk fixture yang memang cacat.
