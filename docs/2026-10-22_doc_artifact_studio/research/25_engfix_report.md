---
task_id: ENG-FIX
task_slug: doc_artifact_studio
row: ENG-FIX
date: 2026-11-02
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/verification/10_round4_code_review.md (temuan #1-#5, #7, #9); decisions D-502, D-503
status: complete
---

# 25 — ENG-FIX: siklus perbaikan 1 atas review mesin ronde 4 + penyesuaian FIG-02b2

## 1. Ringkasan

- Tujuh butir brief dikerjakan semuanya. Status per temuan ada di §8.
- Render lint-bersih tetap byte-identik:
  - harness: 356/356 grafik dan 43/43 diagram (Node lint);
  - fixture paritas: 92/92 render bersih (86 grafik, 6 diagram).
- Satu render fixture paritas berubah, dan itu render fit: `chart/p13.json@datum` (§5).
- Penjaga byte-identik kini ada di repo:
  - manifes sha256 `tests/unit/studio/figures/__fixtures__/clean-svg-manifest.json` (92 render bersih + 22 render fit);
  - uji `clean-svg-manifest.test.ts`.
- Lint grafik dan diagram kini memakai satu modul primitif `chart/core/svgscan.ts`.
  - Drift `unesc` adalah bug di sisi grafik: spasi beruntun tidak diringkas seperti di peramban.
  - Perbaikannya tidak mengubah satu pun render bersih.
- Penalti label tersembunyi/terpotong:
  - bersama #1 mengubah 102 dari 776 render grafik harness (14 karena penalti, 1 render pertama dipertahankan, 87 karena #1);
  - semuanya render fit; tidak ada render bersih yang berubah (§4).
- D-503:
  - HOP_SPEC diganti graf K3,3. Usulan K2,2 di D-503 ternyata planar dan selalu dirute tanpa persilangan (§6).
  - Dari 9 diagram adaptasi kapasitas, **4 lolos gerbang** dan **5 kembali ditolak** dengan kode lama dan saran aksi.
- Gerbang: lihat §7.

## 2. Perubahan per berkas

| Berkas | Jenis | Isi |
|---|---|---|
| `engine/chart/core/svgscan.ts` | baru | Primitif bersama lint grafik/diagram: `MM_PER_PT`, `INK_SHRINK`, `OVERLAP_MIN_MM2`, `OVERLAP_MIN_FRAC`, `OUTSIDE_MIN_MM`, `Pt`, `Box`, `attrsOf`, `unescXml`, `bboxOf`, `segDist`, `inkSamples` (sampel 7 x 3), `boxQuad`, `pathPolylines` (+ `arcPoints`). Tanpa dependensi. |
| `engine/chart/core/geometry.ts` | ubah | Salinan primitif dihapus dan diganti impor dari `svgscan`. `pathPolylines` diekspor ulang agar pemanggil lama tetap jalan. |
| `engine/diagram/fit/lint.ts` | ubah | Konstanta, `attrsOf`, `unesc`, `bboxOf`, `segDist`, dan sampel kini diimpor dari `svgscan`. `samplesOf(b)` = `inkSamples(boxQuad(b))`, identik bit per bit dengan rumus lama. `Box` diekspor ulang. |
| `engine/chart/core/textfit.ts` | ubah | `fitWithinSpan(..., edge?)`: batas "keluar" terpisah dari rentang penempatan. Tanpa `edge` perilakunya sama seperti dulu. |
| `engine/chart/core/svg.ts` | ubah | `SvgDoc.text` di dalam fit memanggil `fitWithinSpan` dengan `edge = [-0,3, W + 0,3]` mm (tepi kanvas nyata + `OUTSIDE_MIN_MM`). Margin 0,4 mm hanya dipakai saat menempatkan ulang teks yang memang keluar. |
| `engine/chart/core/autofit.ts` | ubah | (a) `attempt()` hanya menelan `StudioEngineError`; galat lain dilempar ulang. (b) `candidateScore` = cacat + 1 x label data disembunyikan + 0,5 x label elipsis. (c) `settled()` = 0 cacat dan 0 label disembunyikan. (d) Aturan tangga tinggi memakai skor pilihan; syarat "turun >= 50 %" boleh dipenuhi skor pilihan ATAU cacat mentah. (e) Render pertama dinilai dengan aturan yang sama. (f) `AUTO_FIT` menyebut skor pilihan bila ada penalti. |
| `engine/chart/core/fit.ts` | ubah | `FitState.hidden?` dan `fitHidden(n)`: jumlah label data yang disembunyikan, tanpa ringkasan per detail. |
| `engine/chart/core/labelfit.ts` | ubah | `placePointLabels` dan `placeValueLabels` memanggil `fitHidden(dropped)`. `spreadPositions` (kode mati, salinan `family-p1/common.ts spreadLabels`) dihapus beserta baris docstring-nya. |
| `engine/chart/core/intent.ts` | ubah | `attachFullLabels` hanya mencocokkan teks label kategori: `<text>` ber-`data-label` (value/total/point/series/key) dan teks angka dilewati. Unescape memakai `unescXml` bersama, sehingga `XML_ENTITIES`/`unescapeXml` lokal hilang. |
| `engine/diagram/build/capacity.ts` | ubah | `CAPACITY_MAX_ROUTE_DEFECTS = 3` dan `capacityAcceptable(g)`. `capacityRetry` hanya memakai hasil yang lolos; bila tidak ada yang lolos, penolakan asli dilempar dengan saran aksi. `AUTO_FIT` mencatat varian yang ditolak gerbang. |
| `tests/unit/studio/figures/engfix-core.test.ts` | baru | 12 uji: #1 (4), #2 (2), #4 (3), #9 (3). |
| `tests/unit/studio/figures/engfix-diagram.test.ts` | baru | 5 uji: gerbang kapasitas (3), primitif bersama/`unesc` (2). |
| `tests/unit/studio/figures/_svgManifest.ts` | baru | Daftar render fixture paritas (grafik datum/gallery, diagram rilis/draf) dan definisi "bersih". |
| `tests/unit/studio/figures/clean-svg-manifest.test.ts` | baru | Penjaga sha256: render bersih wajib identik dan masih bersih; render fit terkunci; render baru wajib masuk manifes secara eksplisit. Mode pembaruan: `UPDATE_CLEAN_SVG_MANIFEST=1`. |
| `tests/unit/studio/figures/__fixtures__/clean-svg-manifest.json` | baru | 92 sha render bersih + 22 sha render fit. |
| `tests/unit/studio/figures/fig02a-geometry-lint.test.ts` | ubah | Uji "byte-identik" yang tidak membandingkan apa pun diganti dengan perbandingan sha256 fixture bersih (datum) terhadap manifes. |
| `tests/unit/studio/figures/diagram-families.test.ts` | ubah | `HOP_SPEC` = K3,3. Uji memeriksa `nHops >= 1`, jumlah busur r 0,9 = `nHops`, dan determinisme. |

Tidak disentuh:
- `src/app/api/studio/documents/[id]/figures/**`, `scripts/studio/mcp/**`, `contract/schema/v2/common.schema.ts` (milik SEC-FIX);
- `decisions.md`, `file_claims.md`;
- ParamDef (pin 136).

`family-s2/radial.ts` sempat diberi `fitHidden` lalu dikembalikan. Hasil `cmp` terhadap salinan sebelum baris ini: identik (lihat §10).

## 3. Keputusan desain per temuan

### #1 Penjaga tepi kanvas
- "Keluar" kini diukur terhadap tepi kanvas nyata `[0, W]`.
  - Teks yang muat (mis. caption rata kiri di x=0) tidak diubah: anchor tetap `start`, x tetap 0. Ada ujinya.
  - Margin 0,4 mm hanya dipakai saat menempatkan ulang teks yang memang keluar.
- Percobaan pertama memakai toleransi lint (`[-0,3, W+0,3]`). Chromium lalu mengukur 20 angka tabel P-15 gallery manyLong 0,38 mm di luar tepi kanan (0 -> 20 `textOutside`). Toleransi itu dibuang; dengan `[0, W]` regresi itu hilang.

### #2 `attempt()`
- Hanya `StudioEngineError` (DATUM-33 dan sejenisnya) yang membuat kandidat diabaikan.
- `TypeError`/`RangeError` dari pembantu fit kini dilempar ulang. Uji memakai pengganti render yang melempar `TypeError`, dan galat itu harus sampai ke pemanggil.
- Harness: 0 render berganti status. Tidak ada pembantu fit yang ternyata melempar galat non-mesin.

### #4 Skor kandidat
- `skor = cacat lint + 1 x teks keluar kanvas (tambahan) + 1 x label data disembunyikan + 0,5 x label elipsis`.
- Alasan bobot:
  - label disembunyikan = 1, sehingga menyembunyikan label tidak pernah menang atas satu tumpuk kecil hanya karena jumlah mentahnya lebih kecil (seri -> kandidat lebih awal / render pertama);
  - elipsis = 0,5, karena teks lengkap tetap ada di `<title>`;
  - teks keluar kanvas = 2, karena bagian yang keluar terpotong tanpa jejak dan lebih buruk dari label yang disembunyikan dengan REPORT. Ini mengikuti urutan review: keluar > tumpuk > label hilang.
- Bobot "keluar = 2" ditambahkan setelah pengukuran:
  - tanpa bobot itu, H-04 datum longLabel mempertahankan render pertama yang labelnya keluar 49,3 mm (Chromium);
  - dengan bobot itu, kandidat yang menyembunyikan 1 label dipilih lagi (sama dengan sebelum baris ini).
- Hanya label DATA yang dihitung (`placePointLabels`, `placeValueLabels`).
  - Label lingkar kisi S-08 (`radial.ts`) dan tick yang dijarangkan tidak dihitung, karena skalanya tetap tergambar.
  - Bila dihitung, fixture S-08 datum kembali ke render pertama yang bercacat (1 label skala memotong baji), dan uji FIG-02c gagal.
- `settled()` = 0 cacat dan 0 label disembunyikan. Elipsis tidak menghalangi, karena kanvas lebih tinggi tidak memperlebar talang. Dipakai untuk:
  - berhenti di tangga;
  - syarat tinggi > 3x;
  - syarat mencoba AUTO_ORIENT.
- Tangga tinggi: kandidat lebih tinggi dipakai bila skor pilihan turun tegas DAN (skor pilihan atau cacat mentah turun >= 50 %).
  - Dengan skor pilihan saja, penalti elipsis yang sama di kedua kandidat menghalangi kanvas yang sebenarnya menghapus separuh cacat.
  - Terukur (lint Node, run antara): K-10 manyLong 0 -> 68 cacat dan H-07 manyLong 3 -> 6. Keduanya kembali ke angka lama setelah aturan ini.

### #5 Satu modul lint bersama
- `chart/core/svgscan.ts` tanpa dependensi.
- Diagram dulu mengimpor `pathPolylines` dari `geometry.ts`; kini keduanya mengimpor `svgscan`.
- Drift `unesc` adalah **bug di sisi grafik**:
  - lint grafik tidak meringkas spasi beruntun, padahal Chromium meringkasnya (mesin tidak memancarkan `xml:space`);
  - akibatnya teks seperti `SUMBER  Laporan ...` (dua spasi, 45 render harness grafik) diukur terlalu lebar.
- Versi bersama:
  - meringkas spasi seperti diagram;
  - memahami `&apos;`, `&#39;`, dan entitas numerik dalam satu lintasan (`&amp;lt;` tetap `&lt;`).
- Dampak terukur: 0 render bersih berubah (grafik 356/356, diagram 43/43, fixture 92/92).
- Diagram tidak berubah sama sekali: 59/59 render diagram yang tetap lolos identik. Mesin tidak pernah memancarkan entitas yang baru dipahami.

### #6 Low
- `attachFullLabels`:
  - `<text>` ber-`data-label` (value, total, point, series, key) dan teks angka (tick sumbu nilai) tidak pernah dicocokkan;
  - konsekuensi yang dicatat: label singkat yang berupa angka murni (mis. "2020") tidak mendapat `<title>`. Label lengkap tetap ada di data blok (REPORT `INTENT_APPLIED`). Tidak ada perubahan SVG pada render tanpa `labelShort` (fungsi langsung kembali bila peta kosong).
- `spreadPositions` dihapus (0 pemanggil; grep `src`/`tests`).

### #7 Diagram (D-503)
- (a) HOP_SPEC: lihat §6.
- (b) `capacityAcceptable`: tanpa teks bertumpuk dan persilangan + berimpit <= 3. Varian yang gagal gerbang dicatat di `AUTO_FIT` ("ditolak: ..."). Bila tidak ada varian yang lolos, penolakan asli (kelas, kode, checkId, pointer) dilempar dengan saran aksi.

## 4. Harness sebelum/sesudah

Perintah (`C:\Users\TRIAL\AppData\Local\Temp\fig_audit\`, keluaran nyata):

```
OUT=engfix/base     npx tsx fig02b/gen_sub.ts   -> total 1009 ok 840 rejected 85 na 84   (pohon kerja sebelum ENG-FIX)
OUT=engfix/out      npx tsx fig02b/gen_sub.ts   -> total 1009 ok 835 rejected 90 na 84
OUT=engfix/out_det  npx tsx fig02b/gen_sub.ts   -> sha per berkas identik dengan out ("DETERMINISTIC"); sha daftar sha = a7e55519516df462...
OUT=engfix/out      node measure.mjs            -> measured 835
A=engfix/base B=engfix/out npx tsx engfix/dev/cmp.ts
node engfix/dev/ctab.mjs fig02b/out2 engfix/out ; node fig02b/table.mjs fig02b/out2 engfix/out
```

- `engfix/base` identik byte per byte dengan `fig02b/out2` (840/840 SVG). Karena itu `results.json` Chromium milik `fig02b/out2` sah dipakai sebagai "sebelum".
- Salinan mesin sebelum baris ini (`engfix/basesrc`) merender ulang 840/840 SVG harness secara identik. Salinan ini dipakai untuk paritas fixture (§5).

### 4.1 Byte-identik dan perubahan (lint Node, `engfix/out_cmp.log`)

| Himpunan | Identik | Berubah | Lint-bersih di "sebelum" | Lint-bersih yang berubah | Ganti status |
|---|---|---|---|---|---|
| Grafik (776 render) | 674 | 102 | 356 | **0** | 0 |
| Diagram (64 render "sebelum") | 59 | 0 | 43 | **0** | 5 render -> ditolak lagi (§6) |

Rincian 102 render grafik yang berubah (semuanya render fit, `AUTO_FIT` di keduanya):

| Kelompok | Jumlah | Penyebab | Lint Node |
|---|---|---|---|
| Teks di dalam kanvas tidak lagi digeser 0,4 mm (tick/caption/SUMBER di tepi) | 85 | #1 | sama; tinggi dan catatan sama |
| Caption tidak lagi dipotong elipsis (P-04 datum/gallery longTitle: elipsis 1 -> 0) | 2 | #1 | sama |
| Kanvas lebih tinggi dipilih, lebih sedikit label disembunyikan | 14 | #4 | 0 -> 0 |
| Render pertama dipertahankan alih-alih menyembunyikan 2 label (H-04 gallery manyLong) | 1 | #4 | 0 -> 1 (`GEOM_LINE_TEXT` dilaporkan) |

Label data yang disembunyikan pada 15 render kelompok #4 turun dari **221 menjadi 179** (`engfix/dev/hidden.ts`, baca jumlah di REPORT `LABEL_DROPPED`):
- turun ke 0: H-01 datum many 3 -> 0, H-01 gallery many 1 -> 0, H-04 gallery manyLong 2 -> 0;
- tinggi 14 render naik satu anak tangga (1,25x): mis. H-01/H-02 66 -> 82,5 mm, P-13 manyLong 70 -> 87,5 mm.

### 4.2 Grafik, Chromium (`fig02b/out2` -> `engfix/out`)

| Kasus | n | bercacat | tumpuk | keluar | memotong tanda | garis tembus | tinggi rerata mm |
|---|---|---|---|---|---|---|---|
| normal | 116 -> 116 | 4 -> 4 | 0 -> 0 | 0 -> 0 | 10 -> 10 | 10 -> 10 | 55.8 -> 55.8 |
| longLabel | 114 -> 114 | 7 -> 7 | 75 -> 75 | 0 -> 0 | 61 -> 61 | 7 -> 7 | 57.1 -> 57.3 |
| many | 94 -> 94 | 6 -> 6 | 1914 -> 1914 | 0 -> 0 | 330 -> 330 | 16 -> 16 | 76.3 -> 77.4 |
| manyLong | 90 -> 90 | 8 -> 9 | 1114 -> 1114 | 0 -> 0 | 1164 -> 1164 | 15 -> 16 | 90.5 -> 91.7 |
| longLegend | 84 -> 84 | 3 -> 3 | 3 -> 3 | 0 -> 0 | 1 -> 1 | 0 -> 0 | 57.9 -> 57.9 |
| longTitle | 116 -> 116 | 8 -> 8 | 22 -> 22 | 0 -> 0 | 13 -> 13 | 9 -> 9 | 80.1 -> 80.1 |
| extreme | 102 -> 102 | 4 -> 4 | 5 -> 5 | 0 -> 0 | 6 -> 6 | 6 -> 6 | 55.8 -> 55.8 |
| negative | 60 -> 60 | 1 -> 1 | 1 -> 1 | 0 -> 0 | 9 -> 9 | 8 -> 8 | 58.6 -> 58.6 |
| **Total** | 776 -> 776 | 41 -> 42 | 3134 -> 3134 | 0 -> 0 | 1594 -> 1594 | 71 -> 72 | 66.6 -> 66.9 |

- Satu-satunya render yang bertambah cacat: H-04 gallery manyLong, garis menembus satu label. Ini konsekuensi kebijakan D-482 butir 1: dulu 2 label titik disembunyikan.
- Rerata tinggi naik 0,3 mm karena 14 render memilih kanvas lebih tinggi daripada menyembunyikan label.

### 4.3 Diagram, Chromium (`fig02b/out2` -> `engfix/out`)

| Himpunan | n | ditolak | bercacat | tumpuk | keluar | garis tembus | silang | berimpit |
|---|---|---|---|---|---|---|---|---|
| Semua kasus | 64 -> 59 | 17 -> 22 | 21 -> 16 | 5 -> 1 | 0 -> 0 | 1 -> 1 | 102 -> 29 | 43 -> 14 |
| 55 render lama (FIG-02b1) | 55 -> 55 | - | 13 -> 13 | 1 -> 1 | 0 -> 0 | 1 -> 1 | 23 -> 23 | 11 -> 11 |

- 55 render lama identik byte per byte (59 identik = 55 lama + 4 render adaptasi yang lolos gerbang).
- Seluruh penurunan cacat berasal dari 5 render adaptasi yang kembali ditolak (§6).

## 5. Fixture paritas dan manifes byte-identik

Pembanding: `engfix/basesrc`. Ini salinan `src/lib/studio` dengan berkas yang disentuh baris ini dikembalikan ke isi sebelum ENG-FIX:
- dari `fig02b/base2` untuk berkas yang tidak diubah FIG-02b2 (`diff` menunjukkan hanya perubahan ENG-FIX);
- `capacity.ts` dikembalikan dengan menghapus gerbang;
- `svgscan.ts` dihapus.

Bukti kesetaraan salinan: 840/840 SVG harness identik dengan `engfix/base`.

Skrip `engfix/dev/parity.ts` merender daftar yang sama dengan `_svgManifest.ts`:
- 46 fixture grafik x datum/gallery;
- 13 fixture diagram x rilis/draf.

```
{ same: 113, cleanSame: 92, cleanChanged: 0, bothErr: 4, changedOrOther: 1 }
```

- 92/92 render bersih identik (86 grafik, 6 diagram).
- 4 penolakan sama di kedua mesin: `dg_layered_good` dan `garis_a/good_layered` (rilis/draf), DATUM-25 sesuai D-137.
- Satu render fit berubah:

| Render | sha lama -> baru (16 hex) | Lint lama -> baru | Isi perubahan | Pembenaran |
|---|---|---|---|---|
| `chart/p13.json@datum` | 5c9e52d8851d1a75 -> 3a396125e75e14d7 | 0 -> 0 | Tick sumbu x "175" di x 163,5362 -> 163,6362. Teks itu di dalam kanvas, tetapi dulu didorong 0,1 mm ke margin 0,4 mm. | #1: teks yang sudah muat tidak lagi digeser (kontrak docstring "hanya teks yang keluar tepi") |

Manifes `tests/unit/studio/figures/__fixtures__/clean-svg-manifest.json`:
- `renders`: 92 sha render bersih, wajib identik dan wajib tetap bersih;
- `fitted`: 22 sha render fit (6 grafik, 16 diagram), terkunci juga, sehingga perubahan fit di masa depan harus tampak di diff manifes;
- render bersih/fit baru yang tidak ada di manifes membuat uji gagal;
- pembaruan sah: `UPDATE_CLEAN_SVG_MANIFEST=1 npx vitest run tests/unit/studio/figures/clean-svg-manifest.test.ts`.

Manifes ditulis dari pohon kerja ENG-FIX. Paritas di atas membuktikan semua entri `renders` sama dengan mesin sebelum baris ini. Satu-satunya sha `fitted` yang berbeda dari mesin lama adalah p13 datum (tabel di atas).

## 6. Diagram (D-503)

### 6.1 HOP_SPEC
- Usulan D-503 (dua simpul per baris, keempat tepi antarbaris = K2,2) diukur lebih dulu (`engfix/dev/hop3.ts`):
  - 16 varian kolom (0/1, 0/2, 0/3, 1/2) x baris (1, 2) x urutan tepi;
  - semuanya `nHops = 0`, lint 0;
  - render pertama bercacat (6 = berimpit/silang), tetapi rute ulang FIG-02b2 menarik a->d dan b->c keluar lewat sisi simpul (x 79,7 dan 80,3 mm), sehingga tidak ada persilangan sejati.
  - K2,2 memang planar, jadi pengurutan + rute ulang selalu bisa menghapus persilangannya, dan uji busur tidak mungkin lulus.
- Dipakai K3,3: tiga simpul per baris, kesembilan tepi antarbaris. Graf ini tidak planar, jadi gambar apa pun memuat persilangan.
  - Terukur: `nHops = 4`, 4 busur `A 0.9 0.9 0 0 1`, lint `edgeCross` 10.
  - Uji: `nHops >= 1`, jumlah busur = `nHops`, rakitan kedua identik. Pengurutan tidak dimatikan.
- Catatan pengamatan (di luar lingkup, tidak diubah): pada K2,2 dua konektor bersentuhan di sudut (79,7..80,3 mm pada y 33,34). Tumpang 0,6 mm < ambang `edgeCollinear` 1 mm dan bukan perpotongan sejati, sehingga lint tidak menghitungnya.

### 6.2 Gerbang adaptasi kapasitas
Sembilan diagram yang di FIG-02b2 berubah dari ditolak menjadi dirender (lint Node `engfix/dev/cap.ts`, hasil `engfix/out`):

| Render | Hasil | Lint render adaptasi | Pesan |
|---|---|---|---|
| DG-graph longLabel | **dirender** | 0 cacat | - |
| DG-graph many15 | **dirender** | 3 silang | - |
| DG-graph many15long | **dirender** | 3 silang | - |
| DG-graph fit16long | **dirender** | 3 berimpit | - |
| DG-graph many24 | ditolak DATUM-37-lebar | > 3 (FIG-02b2: 8 silang + 5 berimpit) | `...; saran: maks 5 kolom pada 166 mm; bagi menjadi dua gambar atau pakai layered` |
| DG-graph many24long | ditolak DATUM-37-lebar | > 3, + tumpuk | sama |
| DG-swimlane many15 | ditolak DATUM-37-lebar | 28 silang + 9 berimpit | `...; saran: kurangi simpul per lajur, bagi lajur, atau pecah menjadi 2 diagram (lebar 166 mm)` |
| DG-swimlane many15long | ditolak DATUM-37-lebar | sama | sama |
| DG-swimlane fit16long | ditolak DATUM-37-lebar | 3 tumpuk | sama |

- **4 dari 9 lolos**; 5 kembali ke penolakan lama.
  - Kode (`DATUM-37-lebar`), kelas, checkId, dan pointer sama seperti sebelum FIG-02b2. Pesannya membawa saran aksi konkret.
- Penolakan total harness diagram: 17 -> 22.

## 7. Gerbang (keluaran segar, sesudah perubahan terakhir)

| Gerbang | Perintah | Hasil |
|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | exit 0, log 0 bita (`engfix/tsc_final.log`) |
| Lint | `npx eslint` 10 berkas mesin + 6 berkas uji yang disentuh/baru | exit 0, log 0 bita (`engfix/eslint_final.log`) |
| Uji studio | `npx vitest run tests/unit/studio` (latar belakang) | **Test Files 192 passed (192); Tests 3879 passed, 1 skipped (3880)**; 196,30 s; exit 0 (`engfix/vitest_final.log`) |
| HOP_SPEC | `diagram-families.test.ts` "build graph bersilang tak terhindarkan (K3,3) ..." | lulus |
| Manifes | `clean-svg-manifest.test.ts` (4 uji) | lulus |
| Uji baru | `engfix-core` (12), `engfix-diagram` (5), `clean-svg-manifest` (4) | lulus |
| Uji figures | `npx vitest run tests/unit/studio/figures` | 26 berkas, 560 lulus |
| convert_v2 | `npx tsx benchmark/extract/convert_v2.ts --check` | SAME x3: doc.v2 79290e07..., template.v2 882057c5..., preset a951b149... |
| Pin registri | `chart-smoke.test.ts` (136 ParamDef) di run penuh | lulus; tidak ada ParamDef baru |
| Determinisme | `gen_sub.ts` ke `engfix/out` dan `engfix/out_det` | sha per berkas identik (835 SVG) |
| Byte-identik | `engfix/dev/cmp.ts`, `engfix/dev/parity.ts` | 356/356 grafik dan 43/43 diagram harness lint-bersih; 92/92 fixture bersih |

Riwayat run (jujur):
- Uji baru ditulis dulu. Run pertama `engfix-core`: 4 gagal / 2 lulus (impor `candidateScore`/`fitHidden` belum ada, `TypeError` tertelan, edge belum ada).
- Run penuh pertama (versi toleransi 0,3 mm): 1 berkas gagal, `tests/unit/studio/api/secfix-figure-preview.test.ts` (10 uji). Itu berkas milik SEC-FIX yang sedang disunting bersamaan, bukan berkas baris ini. Di run akhir berkas itu lulus.
- Uji FIG-02c S-08 sempat gagal karena label lingkar kisi ikut dihitung penalti; aturan diperbaiki (§3 #4).
- Run harness: base, run1..run6, out, out_det. Penyesuaian terukur di §3 (tangga, `settled`, edge `[0, W]`, bobot keluar).

## 8. Status per temuan

| Butir brief | Temuan review | Status | Bukti |
|---|---|---|---|
| 1 Penjaga tepi kanvas | #1 | **diperbaiki** | `svg.ts`, `textfit.ts`; uji `engfix-core` #1 (4); 85+2 render fit berubah tanpa beda lint; 0 teks keluar kanvas (Chromium) |
| 2 `attempt()` | #2 | **diperbaiki** | `autofit.ts`; uji `TypeError` diteruskan, `StudioEngineError` ditelan |
| 3 Penjaga byte-identik di repo | #3 | **diperbaiki** | manifes + `clean-svg-manifest.test.ts`; uji "byte-identik" FIG-02a kini membandingkan sha dengan manifes |
| 4 Penalti label tersembunyi | #4 | **diperbaiki** | `autofit.ts` `candidateScore`/`settled`; 3 uji; harness 102 render fit berubah, 0 render bersih; label disembunyikan 221 -> 179 pada 15 render |
| 5 Satu modul lint | #5 | **diperbaiki** | `svgscan.ts`; drift `unesc` = bug grafik (spasi beruntun); 0 render bersih berubah; uji drift |
| 6a `attachFullLabels` | #9 | **diperbaiki** | `intent.ts`; 3 uji |
| 6b `spreadPositions` | #7 | **diperbaiki** (dihapus) | grep 0 pemanggil; tsc 0 |
| 7a HOP_SPEC | D-503 (1) | **diperbaiki dengan deviasi** | K3,3, bukan K2,2 (K2,2 planar, 16 varian 0 lompatan) |
| 7b Gerbang kapasitas | D-503 (3) | **diperbaiki** | `capacity.ts`; 4/9 lolos, 5 ditolak lagi dengan kode lama + saran; 3 uji |

Tidak dikerjakan (bukan lingkup ENG-FIX menurut brief; milik SEC-FIX atau Low lain): #6, #8, #10-#18.
- Catatan #13 (parser `Z`/`E`): primitif `pathPolylines` dipindah apa adanya; perilakunya tidak diubah.

## 9. Persistent Issues

| Isu | Percobaan | Akar | Status | Memblokir? |
|---|---|---|---|---|
| H-04 gallery manyLong: 1 garis menembus label (dulu 2 label disembunyikan) | 1 (bobot keluar kanvas hanya berlaku untuk `textOutside`) | Kebijakan #4: menyembunyikan 2 label tidak boleh menang atas 1 cacat kecil | Dilaporkan sebagai `GEOM_LINE_TEXT` dengan saran; perilaku sesuai brief | Tidak |
| Label angka murni dari `labelShort` (mis. "2020") tidak mendapat `<title>` | 0 | Tanpa penanda renderer, teks kategori angka tidak bisa dibedakan dari tick angka | Dicatat di docstring; label lengkap tetap di data blok | Tidak |
| K2,2 tidak bisa menguji busur lompatan | 1 (16 varian) | Graf planar; rute ulang menghapus persilangan | Diganti K3,3 | Tidak |

## 10. Issues & Decisions

| Langkah | Isu / keputusan | Penyelesaian |
|---|---|---|
| #1 | Batas keluar = toleransi lint (0,3 mm) atau tepi kanvas nyata? | Tepi nyata `[0, W]`. Toleransi 0,3 mm menghasilkan 20 teks keluar 0,38 mm (Chromium, P-15). |
| #4 | Bobot penalti | Disembunyikan 1, elipsis 0,5, keluar kanvas +1. Semua diukur ulang di harness (run1..run6). |
| #4 | Label skala (lingkar kisi S-08, tick dijarangkan) ikut dihitung? | Tidak; hanya label data. Bila dihitung, S-08 kembali bercacat. |
| #4 | Syarat 50 % tangga tinggi dengan skor berpenalti | Turun 50 % boleh lewat skor pilihan ATAU cacat mentah, plus skor pilihan wajib turun tegas. Tanpa itu K-10/H-07 memburuk. |
| #4 | "Tuntas" (berhenti/tinggi > 3x/AUTO_ORIENT) | `settled()` = 0 cacat dan 0 label disembunyikan; elipsis tidak menghalangi. |
| #5 | Arah perbaikan drift `unesc` | Perilaku diagram (ringkas spasi) dianggap benar karena sesuai Chromium. Grafik memiliki bug, dan perbaikannya tidak mengubah render bersih. |
| #5 | Letak modul bersama | `chart/core/svgscan.ts` (diagram sudah mengimpor dari `chart/core`). `geometry.ts` mengekspor ulang `pathPolylines`. |
| #3 | Cakupan manifes | Render bersih (wajib identik) + render fit (terkunci) dari fixture paritas. Render baru wajib eksplisit. |
| 7a | **Deviasi dari D-503 (1)**: K2,2 -> K3,3 | Bukti §6.1. Pengurutan tetap aktif. **Perlu dicatat controller.** |
| 7b | Ambang gerbang | Sesuai D-503: tanpa tumpuk teks, silang + berimpit <= 3. Cacat lain (garis tembus, label lebar) tidak menggugurkan dan dilaporkan `GEOM_*`. |
| Paritas | Satu render fit fixture berubah (p13 datum) | Dicantumkan dengan sha lama/baru (§5); dibenarkan #1. |
| Kebersihan | `radial.ts` sempat diubah lalu dikembalikan | `cmp` dengan `fig02b/base2/.../radial.ts`: IDENTICAL. |

## 11. Langkah berikut

- Controller mencatat:
  - deviasi HOP_SPEC (K3,3);
  - bobot penalti #4 (termasuk keluar kanvas = 2);
  - hasil gerbang kapasitas (4/9 lolos).
- Review direkomendasikan (`senior-code-reviewer`), fokus:
  - `chart/core/autofit.ts` (aturan tangga dengan skor berpenalti, `settled`);
  - `chart/core/svgscan.ts` + `diagram/fit/lint.ts` (kesetaraan primitif);
  - `diagram/build/capacity.ts`;
  - `tests/unit/studio/figures/clean-svg-manifest.test.ts` (cara pembaruan manifes).
- Artefak harness: `C:\Users\TRIAL\AppData\Local\Temp\fig_audit\engfix\` (`out/`, `out_det/`, `base/`, `basesrc/`, `dev/*.ts`, log). `basesrc/node_modules` adalah junction ke `node_modules` repo, bukan salinan; hapus junction-nya saja bila membersihkan.
