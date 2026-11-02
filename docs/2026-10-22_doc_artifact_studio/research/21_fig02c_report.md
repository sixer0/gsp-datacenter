---
task_id: FIG-02c
task_slug: doc_artifact_studio
row: FIG-02c
date: 2026-11-02
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/research/19_fig02a_report.md (§6) + decisions/decisions.md D-482, D-485
status: needs-review
---

# 21 — FIG-02c: siklus perbaikan grafik 2 dari 3 (label nilai, talang, radial, Venn, halo)

Baris FIG-02c, keputusan D-485 (`decisions/decisions.md:490`). Dasar: laporan siklus 1 `research/19_fig02a_report.md` §6 dan audit `research/18_figure_layout_audit.md`.
Kategori: Penyempurnaan (mesin grafik). Repo `C:\Users\TRIAL\gsp-swarm-hq-v2.1`, branch `v2.1`. Agen: `coder-execution`; skill: `tdd`, `diagnosing-bugs` (loop harness dulu), `verification-before-completion`.
Lingkup: butir 1-8 brief (sisa §6 laporan 19 tanpa keluarga G). `chart/family-g/**`, `engine/diagram/**`, `scripts/studio/**` tidak disentuh. Tidak ada commit, push, migrasi, atau sentuhan DB.

## 1. Ringkasan

1. **Target audit tercapai untuk lingkup baris ini.** Diukur di Chromium dengan harness FIG-01 (`OUT=fig02c/out`):
   - normal 7/116 -> 6/116 (mentah) dan 5/116 dengan catatan halo. Kelima sisa semuanya keluarga G (G-02, G-03 x2, G-04 x2), milik FIG-02b. **Di luar keluarga G: 0.**
   - longLabel 12 % -> 8 % (mentah) / 7 % (catatan halo).
   - many 17 % -> 9 %.
   - manyLong 20 % -> 10 %.
   - Total grafik bercacat 82/776 -> 50/776 (47 dengan catatan halo). Teks keluar kanvas 13 -> 0.
2. **Pagar "aktif hanya bila cacat terdeteksi" tetap terbukti.** Semua 356 render harness yang lint-bersih pada render pertama byte-identik dengan baseline maupun siklus 1. Fixture paritas: 174/177 identik dengan siklus 1, dan 3 render berubah (§5). Diagram 55/55 identik dengan `out_after`. Dua generasi harness memberi sha gabungan identik (`1652fac7…e140c`).
3. **Gerbang hijau.** `tsc` exit 0. `eslint` exit 0 pada 15 berkas. Vitest studio: 175 berkas, 3.711 lulus, 1 dilewati, 0 gagal. `convert_v2 --check` SAME x3. Tidak ada ParamDef baru (pin 136 lulus di suite studio).
4. **Perlu keputusan controller (status needs-review):**
   - (a) Satu fixture paritas BARU berubah: `extra:S-08@datum`. Cacatnya terukur (lint 1 -> 0) dan tinggi tetap 44 mm, tetapi **multiset teks berkurang satu**: label lingkar "5" disembunyikan (§5). Aturan D-482 butir 3 menyebut multiset teks sama, jadi ini perlu diterima atau ditolak secara eksplisit.
   - (b) Penipisan label nilai pada 30 kategori cukup agresif: P-05/P-07/P-10 datum menyembunyikan 10-14 dari 30 label nilai, dengan REPORT `LABEL_DROPPED` (§6).
   - (c) Review kode direkomendasikan (§10).

## 2. Arsitektur

Jalur `renderChart` dari siklus 1 dipakai apa adanya: render pertama, lint, lalu `autoFitChart` hanya bila skor > 0. Siklus 2 hanya menambah:

- **Opsi lint chart-scoped.** `lintChartGeometry(svg, opts?)` sekarang menerima `LintOptions` (`core/geometry.ts:520`). Mesin chart memakai `CHART_LINT_OPTIONS = { haloExempt: true }` (`:529`), di `core/render.ts:71` dan `core/autofit.ts:88`.
  - Tanpa opsi, perilaku sama persis dengan FIG-02a. Pemanggil lain, termasuk diagram FIG-02b dan uji fig02a, tidak terdampak.
  - Pengecualian ini hanya melonggarkan. Render yang bersih tetap bersih, sehingga tidak ada render bersih baru yang masuk fit.
- **Pembantu baru di `core/labelfit.ts`** (semua berpagar `fitActive()`):
  - `placeValueLabels` (`:416`): kandidat berurutan dari pemanggil, `cands[0]` = posisi lama. Mengembalikan `null` bila fit tidak aktif atau semua posisi lama sudah bebas. Penempatan rakus menurut prioritas, lalu `VALUE_LABEL_MOVED` / `LABEL_DROPPED`.
  - `placePointLabels` (`:316`) mendapat dua tambahan opsional: `prefer` per titik dan `segments` (rintangan segmen lewat `segmentHitsBox`, Liang-Barsky, `:280`). Tanda tangan lama tetap sah.
- **`xAxis` keluarga p2** (`family-p2/common.ts:208-213`) mendapat medan opsional `labelTitle` dan `labelAt`. Tanpa medan itu jalurnya tetap lama.
- **Pembantu keluarga** memakai jalur fit hanya di dalam `withFit`. Di luar fit, urutan elemen SVG dan semua angka dijaga sama. Contoh: posisi irisan Venn dihitung lebih dulu tetapi tetap digambar sesudah label himpunan, seperti semula.

`textfit.ts` tidak diubah. Perubahan `geometry.ts` bersifat aditif:

- opsi lint;
- medan opsional `TextBox.halo` dan `GeometryHintCtx` (`widthMm`, `unit`, `nRows`, `nCols`, `maxValueChars`);
- teks saran.

API yang diimpor FIG-02b tetap kompatibel.

## 3. Perubahan per berkas

| Berkas | Butir | Isi |
|---|---|---|
| `core/geometry.ts` | 7, 8 | Opsi `haloExempt`: teks berhalo kertas (`stroke` + `paint-order="stroke"`) tidak dihitung `lineThroughText` dan tidak dihitung `textStraddleMark` terhadap tanda `area` (`:566-572`). Isian batang, baji, dan titik tetap dihitung. Saran konkret untuk P-15 (`tableColumnCapacity`, `:628`) dan untuk satuan panjang (`suggestFor`, `:636`). `hintCtxFromSpec` (`:692`) mengisi medan opsional hanya bila ada. |
| `core/render.ts`, `core/autofit.ts` | 7 | Lint memakai `CHART_LINT_OPTIONS`. |
| `core/labelfit.ts` | 1, 5 | `placeValueLabels`, `segmentHitsBox`, `prefer` + `segments` pada `placePointLabels`. |
| `family-p1/dot-plot.ts` (P-05 datum) | 1 | Label "maks": kandidat kanan/kiri/atas, lalu naik satu baris. Rintangan: titik, kumis, segmen rerata, satuan. |
| `family-p1/range-plot.ts` (P-07 datum) | 1 | Label rentang dengan pola yang sama. Rintangan: titik, kotak rerata, garis interval. |
| `family-p2/waterfall.ts` (P-10) | 1 | Label delta di atas batang, naik 1-2 baris secara berselang, atau di bawah batang turun. Total didahulukan. Rintangan: semua batang. |
| `family-p2/arrow.ts` (P-14) | 2 (+) | `gutterPlan` untuk label baris. Tambahan: nilai di luar `params.axis` membuat panah keluar kanvas (P-14 many/extreme/negative), jadi saat fit domain diperlebar agar memuat data, dengan REPORT `AXIS_WIDENED`. Data tidak pernah dipotong. |
| `family-s2/radial.ts` (S-08 datum) | 3 | Label lingkar dicoba pada 8 sinar (utara kanan/kiri, selatan, timur, barat). Model potong baji dibuat per baji, sama dengan lint. Label yang tetap memotong di sinar terbaik disembunyikan (`LABEL_DROPPED`); label terluar selalu dipertahankan. |
| `family-h2/venn.ts` (H-09) | 4 | Nama himpunan yang lebih lebar dari 1,6 R dibungkus <= 3 baris (elipsis + `<title>`). Blok digeser menjauh dari irisan sampai tidak menutup angka wilayah (`VENN_LABEL_WRAP`). |
| `family-h1/scatter.ts` (H-04) | 5 | Label ujung/aksen lewat `placePointLabels` dengan offset anotasi acuan sebagai `prefer`, segmen jalur sebagai rintangan, dan titik sebagai rintangan. |
| `family-p2/small-multiples.ts` (P-12), `family-p2/common.ts` | 6 | Elipsis tick memakai huruf tick sebenarnya. Mono datum menggantikan struct, yang merupakan sumber sisa tumpuk siklus 1. Tick dijarangkan bila ruang < "Abc…" (`AXIS_TICK_THIN`). Label dijepit di dalam sel panel, dan teks lengkap ada di `<title>` lewat `xAxis.labelTitle`. |
| `family-h2/contour.ts` (H-06 datum) | 7 | Saat fit:<br>- semua label tingkat diberi halo kertas (`LABEL_HALO`);<br>- label bertumpuk digeser sepanjang busur atau ke polyline lain (`CONTOUR_LABEL_MOVED`);<br>- tick baris dijepit 30 % lebar, tick kolom dipotong ke selnya (`<title>`). |
| `tests/unit/studio/figures/fig02c-labelfit.test.ts` (baru) | semua | 15 uji (§7). |

Uji fig02a tidak perlu diubah: lint bawaan tidak berubah.

## 4. Hasil sebelum/sesudah (Chromium, harness FIG-01)

Perintah (dijalankan, keluaran nyata, `C:\Users\TRIAL\AppData\Local\Temp\fig_audit\`):

```
OUT=.../fig02c/out  tsx gen.ts          -> total 1009 ok 831 rejected 94 na 84
OUT=.../fig02c/out2 tsx gen.ts          -> total 1009 ok 831 rejected 94 na 84
OUT=.../fig02c/out  node fig02c/measure.mjs -> measured 831
OUT=.../fig02c/out  node summarize.mjs  -> exit 0
node fig02c/table.mjs                   -> fig02c/table_c2.txt
```

`fig02c/measure.mjs` adalah salinan `measure.mjs` dengan catatan metrik halo. Hitungan mentah (`counts`) tidak berubah. Ada tambahan `countsHalo`, yang mengecualikan `lineThroughText` dan potong tanda `area` untuk teks berhalo, padanan pengecualian lint.

Grafik, kedua gaya (render bercacat; jumlah cacat mentah):

| Kasus | n | Baseline | Siklus 1 | Siklus 2 mentah | Siklus 2 catatan halo | Cacat B / S1 / S2 |
|---|---|---|---|---|---|---|
| normal | 116 | 12 (10 %) | 7 (6 %) | 6 (5 %) | 5 (4 %) | 36 / 27 / 26 |
| longLabel | 114 | 80 (70 %) | 14 (12 %) | 9 (8 %) | 8 (7 %) | 667 / 169 / 150 |
| many | 94 | 59 (63 %) | 16 (17 %) | 8 (9 %) | 8 (9 %) | 5.517 / 2.313 / 2.294 |
| manyLong | 90 | 77 (86 %) | 18 (20 %) | 9 (10 %) | 9 (10 %) | 16.238 / 2.424 / 2.327 |
| longLegend | 84 | 51 (61 %) | 3 (4 %) | 3 (4 %) | 3 (4 %) | 280 / 4 / 4 |
| longTitle | 116 | 116 (100 %) | 11 (9 %) | 10 (9 %) | 9 (8 %) | 269 / 50 / 49 |
| extreme | 102 | 19 (19 %) | 8 (8 %) | 4 (4 %) | 4 (4 %) | 41 / 28 / 17 |
| negative | 60 | 8 (13 %) | 5 (8 %) | 1 (2 %) | 1 (2 %) | 42 / 39 / 18 |

Gaya `datum`: normal 5/58 -> 4/58 (3 dengan catatan halo, semuanya G); longLabel 9 -> 5 (4); many 10 -> 4.

Per jenis cacat (grafik, baseline / S1 / S2):

| Jenis | Baseline | S1 | S2 |
|---|---|---|---|
| textOverlap | 18.594 | 3.258 | 3.134 |
| textOutside | 1.446 | 13 | 0 |
| textStraddleMark | 2.808 | 1.612 | 1.594 |
| lineThroughText | 150 | 85 | 71 |
| edgeCross | 68 | 68 | 68 |

Total grafik bercacat: 422 -> 82 -> 50 (47 dengan catatan halo). Diagram bercacat 46 -> 46 -> 46.

Per kelas kasus lingkup (lint tanpa browser, skor S1 -> S2, `fig02c/quick.ts`):

| Butir | Render | Skor |
|---|---|---|
| 1 P-05 | datum many / manyLong / extreme | 7->0, 18->0, 1->0 |
| 1 P-07 | datum many / manyLong / extreme / negative | 2->0, 4->0, 1->0, 1->0 |
| 1 P-10 | datum many / manyLong; gallery many / manyLong | 3->0, 5->0, 2->0, 3->0 |
| 2 P-14 | datum many / manyLong / extreme / negative; gallery extreme / negative | 1->0, 30->0, 6->1, 12->0, 4->0, 4->0 |
| 3 S-08 | datum normal, longLabel, many, manyLong, extreme, negative, longTitle | 1/1/1/1/2/3/1 -> 0 semua |
| 4 H-09 | datum / gallery longLabel | 3->0, 3->0 |
| 5 H-04 | datum longLabel / many / manyLong; gallery many / manyLong | 1->0, 2->0, 1->0, 1->0, 1->0 |
| 6 P-12 | datum longLabel / manyLong | 2->0, 18->0 |
| 7 H-06 | datum normal / longLabel / many / manyLong / extreme / negative / longTitle | 6->0, 16->0, 14->1, 26->1, 8->2, 10->1, 6->0 |

Tindakan otomatis baru (render ulang dari spec harness, `fig02c/drops.ts`):

| Tindakan | Jumlah |
|---|---|
| `LABEL_DROPPED` | 17 render |
| `VALUE_LABEL_MOVED` | 9 |
| `AXIS_WIDENED` | 8 |
| `LABEL_HALO` | 7 |
| `CONTOUR_LABEL_MOVED` | 4 |
| `VENN_LABEL_WRAP` | 2 |
| `RADIAL_LABEL_MOVED` | 2 |

## 5. Bukti byte-identik dan paritas

- **Render yang lint-bersih pada render pertama: 356/356 byte-identik** dengan baseline (HEAD) dan dengan siklus 1 (`out_after`).
  - Keluaran `fig02c/quick.ts`: `{ baselineClean: 356, identicalToBaselineAndC1: 356, changed: 0 }`.
  - Dengan lint bawaan maupun opsi halo, jumlah baseline-bersih sama (356, `fig02c/cnt.ts`).
  - Laporan 19 menyebut 391. Angka hitung ulang hari ini 356 dengan lint yang sekarang; selisihnya tidak diselidiki lebih jauh.
- **Harness vs siklus 1:** `{ same: 732, changedDef: 40, changedClean: 4, statusChanged: 0 }`.
  - Ke-40 render yang berubah bercacat di siklus 1 dan semua skornya turun (tabel §4).
  - 4 render (P-14 datum/gallery longLabel, gallery many, gallery manyLong) sudah dipasang fit pada siklus 1 dengan skor 0, dan tetap 0. Perubahannya: talang terukur menggantikan bungkus penjaga tepi, dan domain diperlebar untuk nilai di luar `axis`. Render pertama keempatnya bercacat, jadi bukan render bersih.
  - Tidak ada render yang memburuk; skrip menyaring `NOT-IMPROVED` hanya menemukan keempat 0 -> 0 tadi.
- **Diagram:** 55/55 identik dengan `out_after`.
- **Determinisme:** sha gabungan `out` = `out2` = `1652fac7c1104372ff5fef70bf3adbf0c718ecf60dd286c87a37a2f4e78e140c`.
- **Fixture paritas** (`fig02c/parity.ts`). Pembanding: salinan pohon kerja siklus 1 `fig02c/base` (diambil sebelum perubahan apa pun, 11:14). Hasil: `{ renders: 177, same: 174, diff: 3, bothRejected: 0 }`.

| Render | sha siklus 1 -> siklus 2 | Lint (opsi chart) | Tinggi | Multiset teks |
|---|---|---|---|---|
| h06.json (bawaan) | 70306ff90ae5 -> dae6c1fe6a09 | 6 -> 0 | 64 -> 64 | sama |
| h06.json@datum | 70306ff90ae5 -> dae6c1fe6a09 | 6 -> 0 | 64 -> 64 | sama |
| extra:S-08@datum | ca65e00fd107 -> a4d7b7f44e88 | 1 -> 0 | 44 -> 44 | **beda: label lingkar "5" hilang** (`fig02c/tcmp.ts`: `missing in new: ["5"]`) |

  - h06 adalah fixture baru yang berubah. Cacatnya terukur (8 label kontur memotong pita/garis), dan setelah perubahan hanya halo dan posisi label yang berubah. Tinggi dan himpunan teks sama (kelas CB1 terpenuhi).
  - S-08 perlu keputusan controller (§1 butir 4a). Lingkar kisinya tetap tergambar. Alternatifnya: label tetap ditampilkan dan sisa 1 cacat diterima.
  - Keempat fixture yang diterima D-485 (h01, h02, p13, G-03) identik dengan siklus 1.
  - Catatan pengukuran: kolom "multiset teks" pertama di `parity.ts` keliru karena regex rusak oleh escaping shell (selalu "sama"). Pemeriksaan ulang yang benar ada di `tcmp.ts`, dan angkanya yang dipakai di atas.
- **`convert_v2 --check`:** SAME untuk `doc.v2.json` (79290e07…), `template.v2.json` (882057c5…), dan `datum-manual-000.preset.json` (a951b149…).

## 6. Sisa cacat dan alasannya

| Kode / kasus | Sisa | Alasan | Langkah lanjut |
|---|---|---|---|
| Keluarga G (G-01..G-04; 5 di normal) | Label ubin, garis aliran, simpul | Milik FIG-02b | FIG-02b |
| P-15 many/manyLong (4 render) | ~3.000 pasangan | Kapasitas: 24 kolom angka di 128/166 mm. REPORT sekarang konkret: "tabel 24 x 24 melebihi kapasitas pada 128 mm (muat ~10 kolom angka): pakai `topN: 8`, pisah menjadi 3 tabel/gambar, atau kirim sebagai blok tabel dokumen". | FIG-03 (`topN`) |
| H-07 many/manyLong (4) | 17 persilangan tepi | Tata letak simpul network, bukan label | — |
| H-06 many/manyLong/extreme/negative | 1-2 tumpuk label tingkat (lint) | Dua tingkat berdesakan di busur pendek yang sama; tidak ada posisi bebas di semua polyline. Label tidak dibuang karena kontrak keluarga mewajibkan setiap tingkat berlabel (docstring `contour.ts`, D-296). | Penunjuk (leader) atau tinggi; siklus 3 |
| S-03 many/manyLong (4) | Label puncak density di atas area/garis | Di luar butir brief | Siklus 3 |
| P-03 gallery many/manyLong (2) | Label seri langsung memotong kolom | Di luar butir brief | Siklus 3 |
| W-09 longLabel/manyLong, K-05 gallery longLabel | 1 cacat masing-masing | Di luar butir brief | Siklus 3 |
| longTitle P-11/K-05/K-06 datum | Label nilai + satuan 32-35 karakter | Tidak ada perbaikan tata letak yang diharapkan. REPORT sekarang: "persingkat `unit` (33 karakter, ditempel pada setiap label nilai) menjadi <= 12 karakter …". | Agen menyingkat `unit` |
| longTitle P-02/W-02 datum | SUMBER 2 baris menimpa label kategori | Pita caption DC inti (`core/datum.ts`) tidak memberi ruang untuk SUMBER multi-baris; di luar butir brief | Siklus 3 |
| P-14 datum extreme | 1 tumpuk tick sumbu ("800.000.000" x "1.000.000.000") | Label tick lebar; di luar butir brief | Siklus 3 |

Penipisan label nilai (butir 1) pada 30 kategori menyembunyikan sebagian label:

| Render | Label disembunyikan |
|---|---|
| P-05 datum many/manyLong | 11 dari 30 |
| P-07 datum many/manyLong | 14 dari 30 |
| P-10 datum many/manyLong | 11 / 10 dari 31 |
| P-10 gallery many/manyLong | 2 / 4 |
| H-04 datum/gallery manyLong | 2 label ujung |

Semua dilaporkan `LABEL_DROPPED`, dan nilainya tetap ada di data spec dan teks alternatif. Ini perilaku yang diminta brief. Batas penempatan dibuat ketat (kotak tinta tanpa ambang luas lint), jadi label dibuang hanya bila tidak ada kandidat bebas. Penyangga "biarkan di posisi lama" sempat dicoba, tetapi mengembalikan 4-5 cacat P-05, jadi tidak dipakai.

## 7. Gerbang (keluaran segar)

| Gerbang | Perintah | Hasil |
|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | `tsc exit 0`, tanpa keluaran. Run sebelumnya sempat galat di `engine/diagram/fit/lint.ts` (berkas FIG-02b yang sedang ditulis, di luar lingkup); run akhir bersih. |
| Lint | `npx eslint <14 berkas chart yang disentuh + uji fig02c>` | `eslint exit 0` |
| Uji baru | `npx vitest run tests/unit/studio/figures/fig02c-labelfit.test.ts` | Test Files 1 passed (1); Tests 15 passed (15) |
| Uji studio | `npx vitest run tests/unit/studio` | Test Files 175 passed (175); Tests 3711 passed, 1 skipped (3712); 189,09 s; exit 0 (`fig02c/vitest_studio.log`) |
| Pin registri | `chart-smoke.test.ts` (di dalam suite studio) | lulus; tidak ada ParamDef baru |
| convert_v2 | `npx tsx benchmark/extract/convert_v2.ts --check` | SAME x3 |
| Determinisme | gen.ts x2 | sha gabungan identik |
| Byte-identik | `fig02c/quick.ts` (BASE=`out_after`) | 356/356 baseline-bersih identik; 0 status berubah |
| Paritas | `fig02c/parity.ts` + `tcmp.ts` | 174/177 identik; 3 berubah tercatat (§5) |

Isi uji baru (15):

- pengecualian halo: bawaan tidak berubah, opsi chart mengecualikan, batang tetap dihitung;
- `placeValueLabels`: di luar fit `null`, bersih `null`, selang naik, drop + catatan, prioritas;
- `segmentHitsBox` dan `prefer`/`segments`;
- saran P-15 dan saran satuan;
- ujung-ke-ujung H-06 datum (deterministik, lint 0), S-08 datum (lint 0 + `LABEL_DROPPED`), P-05 20 grup (tanpa tumpuk "maks", tanpa FAIL), dan H-09 nama panjang (`VENN_LABEL_WRAP`, 0 tumpuk).

## 8. Persistent Issues

| Isu | Percobaan | Akar | Status | Memblokir? |
|---|---|---|---|---|
| H-06 tumpuk label tingkat berdesakan | 2 (pecahan busur, lalu polyline lain) | Busur pendek berdekatan; kontrak "setiap tingkat berlabel" | 1-2 sisa pada 4 render | Tidak |
| Watchdog stream (2x) saat perintah panjang tanpa keluaran | — | Perintah foreground lama | Run panjang dipindah ke latar belakang | Tidak |

## 9. Issues & Decisions

| Langkah | Isu / keputusan | Penyelesaian |
|---|---|---|
| Halo | `geometry.ts` dibaca FIG-02b; pengecualian tidak boleh mengubah diagram | Opt-in `LintOptions.haloExempt`, chart-scoped lewat `CHART_LINT_OPTIONS`; bawaan tidak berubah. |
| Cakupan halo | Halo membuat teks terbaca di atas garis dan pita muda, tetapi tidak menolong teks abu di atas baji abu solid | Pengecualian hanya `lineThroughText` + potong tanda `area`. Batang/baji tetap dihitung, sehingga S-08 tetap diperbaiki lewat penempatan. |
| H-06 label sela | Label sela (tanpa halo) duduk di batas pita isian | Saat fit semua label tingkat berhalo kertas; tetap berpagar cacat. |
| P-14 `axis` | Nilai di luar `params.axis` digambar di x > W | Saat fit domain diperlebar + REPORT `AXIS_WIDENED`; data tidak dipotong. Di luar fit perilaku lama. |
| S-08 | Label lingkar dekat pusat memotong beberapa baji di semua sinar | Disembunyikan + `LABEL_DROPPED`. Multiset teks fixture extra S-08 berubah, jadi diajukan ke controller. |
| Byte-identik | Kriteria "lint-bersih" | Diterapkan pada render pertama (baseline): 356/356 identik. Render yang sudah dipasang fit di siklus 1 boleh berubah hanya bila skor tidak naik (40 turun, 4 tetap 0). |
| P-02/W-02 longTitle | Cacat nyata tetapi di luar butir | Tidak diubah (aturan brief: tanpa perubahan mesin di luar lingkup). |

## 10. Langkah berikut

- Controller memutuskan fixture `extra:S-08@datum` (multiset teks -1) dan menilai tingkat penipisan label nilai.
- Review kode direkomendasikan (`senior-code-reviewer`). Lingkup:
  - `core/labelfit.ts` (`placeValueLabels`, segmen);
  - `core/geometry.ts` (opsi halo, saran);
  - `family-h2/contour.ts`, `family-h2/venn.ts`, `family-s2/radial.ts`, `family-p2/arrow.ts` (`AXIS_WIDENED`).
- Siklus 3: S-03, P-03 gallery, W-09, K-05, P-02/W-02 longTitle, sisa H-06, dan tick lebar P-14 extreme.
- Harness: `C:\Users\TRIAL\AppData\Local\Temp\fig_audit\fig02c\` (`quick.ts`, `table.mjs`, `measure.mjs` dengan catatan halo, `parity.ts`, `tcmp.ts`, `drops.ts`, `out/`, `out2/`, `out_c1/`, `base/`).
