---
task_id: FIG-03a
task_slug: doc_artifact_studio
row: FIG-03a
date: 2026-11-02
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/decisions/decisions.md (D-482 butir 2, D-495)
status: needs-review
---

# Laporan FIG-03a: medan maksud analitis opsional pada blok chart v2

## 1. Ringkasan

1. **Kontrak dan mesin selesai dan teruji.** Blok chart v2 kini menerima empat medan opsional:
   `orientation`, `sort`, `topN` (+ `otherLabel`), dan `labelShort`. Skema memvalidasinya secara
   ketat dengan `checkId: "CHART_INTENT"` dan pointer medan. Mesin chart menerapkannya sebagai
   transformasi data, dengan REPORT `INTENT_APPLIED` atau `HINT_IGNORED`.
2. **Tanpa medan baru, keluaran tetap byte-identik.** Jalur render tanpa `intent` adalah jalur lama
   apa adanya. Harness: 752/752 render chart non-G dan 24/24 render keluarga G identik dengan
   `fig02c/out`, sha gabungan sama. Fixture paritas: 116/118 identik dengan harness FIG-02c, dan 2
   sisanya (k08) identik dengan pohon dasar siklus 1 (§5). `convert_v2 --check` SAME x3. Tidak ada
   ParamDef baru.
3. **Perlu tindakan controller (alasan status needs-review): satu baris di luar lingkup tulis.**
   Perakit `src/lib/studio/services/compose/blocks.ts` belum meneruskan medan blok ke spec mesin.
   Brief membatasi tulisan ke `contract/**` dan `engine/chart/**`, jadi berkas itu tidak saya ubah.
   **Sebelum patch §8 diterapkan, kiriman v2 yang membawa medan ini lolos skema tetapi mesin tidak
   menerima medannya, sehingga medan diabaikan diam-diam.** Panduan agen sudah mendokumentasikan
   medan ini, jadi patch wajib mendarat sebelum uji Hermes.
4. **Demo pada 4 kasus harness padat** (lint geometri in-process, §6):
   - P-02 30 kategori + `topN: 8`: cacat render pertama 86 -> 0, tinggi 222 -> 46 mm, tanpa
     AUTO_ORIENT.
   - P-03 galeri label panjang 30 kategori + `topN: 8` + `labelShort`: cacat akhir 2 -> 0, cacat
     render pertama 253 -> 0.
   - P-02 label panjang + `orientation: "horizontal"` + `labelShort`: cacat render pertama 16 -> 0.
   - K-05 30 bagian: ditolak, dan pesannya kini menyarankan `topN: 4`. Dengan `topN: 4` gambar
     dirender tanpa cacat.

## 2. Rancangan

| Medan (blok `ChartV2`) | Skema | Mesin |
|---|---|---|
| `orientation` `auto`/`horizontal`/`vertical` | enum (E58) | Kode yang dapat ditukar: P-01 <-> P-02 dan W-02 -> P-01. Urutan data dipertahankan (P-01 `sort = natural`), dan kunci params kode lama dibuang, sama seperti AUTO_ORIENT. `vertical` pada P-02/W-02 mematikan AUTO_ORIENT. Arah yang sama dengan bawaan kode (P-03, K-01..K-04, dan seterusnya) tidak dilaporkan. Arah lain menghasilkan `HINT_IGNORED`. `auto` atau absen = perilaku lama. |
| `sort` `none`/`desc`/`asc` | enum (E59) | Urutan stabil menurut nilai. Data seri diurutkan menurut jumlah semua seri, kecuali K-02 yang memakai pangsa seri pertama. "Lainnya" selalu terakhir. P-01/P-04/P-06 mendapat `sort = natural`. Kode berurutan bermakna (waktu, tahap, kelompok umur: W-*, P-10, K-04, K-10, dst.) menghasilkan `HINT_IGNORED`. |
| `topN` 3..30 + `otherLabel` (1..40, hanya bersama `topN`) | integer + rentang + `dependentRequired` | N kategori dengan \|nilai\| terbesar (seri: jumlah \|nilai\|) dipertahankan dalam urutan agen. Sisanya menjadi `"<otherLabel ?? Lainnya> (k)"` dengan nilai = jumlah bertanda (seri: per seri; null dilewati, semua null -> null). REPORT memuat total. Tanpa `topN` tidak pernah ada agregasi (D-482 butir 1). Kode tak-aditif (P-09, P-10, P-11, K-02, K-04, K-10, P-06, P-14, W-*) menghasilkan `HINT_IGNORED`. Bila sisa < 2 kategori: `HINT_IGNORED`, gambar tidak berubah. |
| `labelShort` `[{label, short<=32}]` 1..200 | `$defs` `ChartLabelShortV2` | Label kategori di data render diganti `short`. Setiap `<text>` yang menampilkan `short` dibungkus `<g data-label-short="1"><title>label lengkap</title>…</g>`; `<title>` elipsis yang memuat `short` diganti label lengkap. Data blok tersimpan tidak berubah. Label tak dikenal, label ganda, atau dua kategori yang tampil sama -> `SCHEMA_INVALID` dengan `details.pointer` (mis. `/labelShort/1/label`). Bentuk tanpa sumbu kategori (xy, matrix, ...) -> `HINT_IGNORED`. |

- **Data negatif/divergen:** peringkat `topN` memakai besaran (\|nilai\|) agar nilai negatif besar
  tidak hilang ke "Lainnya". Nilai "Lainnya" tetap jumlah bertanda, sehingga total gambar = total
  data.
- **Grafik komposit:** maksud diabaikan dengan `HINT_IGNORED`. Panel tidak membawa `intent`
  (`ChartPanelSpec` meng-Omit `intent`; skema v1 hanya memasang `intent` di spec tingkat atas).
- **Penolakan kapasitas tetap ada.** Pesannya kini menyarankan tuas konten:
  - pie/donut `maxSlices`: "kirim \`topN: <maxSlices-1>\` …, pisah menjadi dua gambar, atau pakai
    stacked bar (K-01) / bar (P-01)";
  - DATUM-33 (tinggi melampaui blok teks): `capacityAdvice(kode)`. Saran `topN` hanya muncul untuk
    kode yang menerapkannya.
- **Saran lint (`suggest`):** kini memakai nama dan bentuk medan nyata, dan hanya untuk kode yang
  menerapkannya (`intentSupport`):
  - `pakai \`orientation: "horizontal"\` (P-02 -> P-01)` hanya untuk P-02/W-02;
  - `pakai \`topN: 8\`` hanya untuk kode `topN`;
  - `kirim \`labelShort: [{ "label": …, "short": … }]\`` hanya untuk data kategoris/seri.
  Saran P-15 kini menyatakan "\`topN\` tidak berlaku untuk tabel matriks P-15" (sebelumnya
  menyarankan `topN`, padahal medan itu tidak diterapkan ke matriks).

## 3. Perubahan per berkas

| Berkas | Jenis | Isi |
|---|---|---|
| `src/lib/studio/contract/enums.ts` | ubah (aditif) | E58 `CHART_INTENT_ORIENTATIONS`, E59 `CHART_INTENT_SORTS`, C61 `CHART_INTENT_LIMITS`, `CHART_INTENT_OTHER_LABEL` |
| `src/lib/studio/contract/types/chart.ts` | ubah (aditif) | `ChartIntent`, `ChartLabelShort`, `StudioChartV1.intent?`; `ChartPanelSpec` meng-Omit `intent` |
| `src/lib/studio/contract/types/v2/doc.ts` | ubah (aditif) | `ChartV2.orientation?/sort?/topN?/otherLabel?/labelShort?` |
| `src/lib/studio/contract/schema/v2/common.schema.ts` | ubah (aditif) | `CHART_INTENT_V2`, `$defs.ChartLabelShortV2`, `dependentRequired: { otherLabel: ["topN"] }` |
| `src/lib/studio/contract/schema/chart.schema.ts` | ubah (aditif) | properti `intent` di spec v1 tingkat atas (bukan panel) |
| `src/lib/studio/contract/schema/v2/forbidden.ts` | ubah (aditif) | lokasi `ChartV2.labelShort -> ChartLabelShortV2`; `chartIntentIssue` -> `checkId: "CHART_INTENT"` berpointer medan |
| `src/lib/studio/engine/chart/core/intent.ts` | baru | `chartIntentOf`, `intentSupport`, `orientationTarget`, `assertIntentShape`, `applyChartIntent`, `attachFullLabels`, `capacityAdvice` |
| `src/lib/studio/engine/chart/core/render.ts` | ubah | `renderChart`: tanpa `intent` -> `renderPreset` (badan lama apa adanya); dengan `intent` -> terapkan, render, `<title>`, gabung laporan; komposit + intent -> `HINT_IGNORED`; `estimateHeightMm` memakai spec terapan; pesan DATUM-33 memakai `capacityAdvice` |
| `src/lib/studio/engine/chart/core/autofit.ts` | ubah | `AutoFitRender.noAutoOrient?` (maksud `vertical`) |
| `src/lib/studio/engine/chart/core/geometry.ts` | ubah (teks laporan) | saran sadar-kode lewat `intentSupport`/`orientationTarget`; saran P-15 |
| `src/lib/studio/engine/chart/core/index.ts` | ubah | ekspor API `intent` |
| `src/lib/studio/engine/chart/family-k1/pie.ts` | ubah (teks galat) | pesan `maxSlices` menyarankan `topN` |
| `tests/unit/studio/contract/fig03a-chart-intent-schema.test.ts` | baru | 10 uji skema |
| `tests/unit/studio/figures/fig03a-chart-intent.test.ts` | baru | 22 uji mesin |
| `docs/STUDIO-AGENT-GUIDE.md` | ubah (aditif) | §4.1.1 baru (bagian chart): tabel medan, aturan, satu contoh JSON per medan |

Tidak diubah: `core/textfit.ts`, `family-g/**`, `engine/diagram/**`, MCP, `decisions.md`, `file_claims.md`.
Tidak ada migrasi DB (blok disimpan sebagai JSON). Tidak ada ParamDef baru.

## 4. Uji baru (merah-hijau)

Catatan jujur: implementasi skema ditulis lebih dulu, lalu uji skema langsung hijau pada run
pertama (10/10). Dua uji mesin merah pada run pertama karena ekspektasinya salah: taksiran tinggi
P-02 memang tidak bergantung pada jumlah kategori, dan label kolom inti ditulis kapital. Ekspektasi
diperbaiki, bukan kodenya. Tidak ada uji yang melemahkan perilaku.

- **Skema** (`fig03a-chart-intent-schema.test.ts`, 10):
  - terima: tanpa medan, semua medan, nilai batas;
  - tolak dengan `CHART_INTENT` + pointer: enum `orientation`/`sort`; `topN` 2/31/8,5/"8";
    `otherLabel` tanpa `topN` atau > 40; `labelShort` tanpa `short`, `short` > 32, tanpa `label`,
    medan ekstra, larik kosong, objek;
  - `heightMm`/`params` tetap `DISPLAY_FIELD`; `labelWrap`/`legendPosition`/`labelPosition`/
    `maxCategories` tetap ditolak tanpa `CHART_INTENT`;
  - skema v1 `intent` terima/tolak.
- **Mesin** (`fig03a-chart-intent.test.ts`, 22):
  - paritas `intent: {}` dan `orientation: "auto"` = SVG identik untuk SEMUA fixture;
  - `chartIntentOf`;
  - `topN`: total rekonsiliasi, urutan agen, "Lainnya (22)", tinggi turun; negatif (|nilai| +
    jumlah bertanda); seri K-01 (null); `HINT_IGNORED` (P-10, sisa < 2, xy);
  - `sort`: desc/asc stabil, none = identik, seri menurut jumlah, P-01 natural, P-01 `topN` tanpa
    `sort` = valueDesc + Lainnya terakhir, W-01 `HINT_IGNORED`;
  - `orientation`: P-02 -> P-01 = SVG P-01 natural; P-01 -> P-02; W-02 -> P-01; `vertical`
    mematikan AUTO_ORIENT; P-03/K-01/K-05 `HINT_IGNORED` dengan SVG tetap; arah bawaan tanpa
    laporan;
  - `labelShort`: teks sumbu singkat + `<title>` lengkap, masukan tidak dimutasi, label lain tanpa
    pembungkus, kategori seri; label tak dikenal/ganda/tabrakan -> `SCHEMA_INVALID` + pointer; xy
    `HINT_IGNORED`;
  - komposit `HINT_IGNORED`;
  - pie 9 bagian: pesan `topN: 4`, lalu lolos dengan `topN: 4`;
  - saran lint sadar-kode.

## 5. Bukti byte-identik dan paritas

- **Harness lengkap** (`fig_audit/gen.ts`, `OUT=fig03a/out`; pembanding `fig02c/out` = keadaan
  sesudah perbaikan grafik D-491; skrip `fig03a/cmp.py`, sha256 per SVG). Keluaran nyata:
  `{'both_not_ok': 178, 'diff_diagram': 34, 'same_G': 24, 'same_chart': 752, 'same_chart_normal': 108, 'same_chart_longLabel': 106, 'same_chart_many': 94, 'same_chart_manyLong': 90, 'same_chart_extreme': 102, 'same_chart_negative': 60, 'same_chart_longLegend': 84, 'same_chart_longTitle': 108, 'same_diagram': 21}`,
  `status changed: []`, dan sha gabungan chart non-G
  `58487eef7a666502fbc52fa79540f6684772cf6c5d0f5e3e8134ea8ca2af5d47` sama di kedua sisi.
  - Semua render chart (752 non-G + 24 G) byte-identik, dan status ok/ditolak tidak berubah.
  - 34 render diagram berbeda, tetapi semuanya di `engine/diagram/**` milik FIG-02b1 yang sedang
    berjalan. Baris ini tidak menyentuh berkas diagram, jadi perbedaan itu di luar lingkup dan
    bukan regresi FIG-03a.
- **Fixture paritas** (`fig03a/parity.ts`: 59 fixture chart + panel ekstra x gaya datum/galeri,
  dirender apa adanya dengan pohon kerja, dibandingkan dengan SVG harness FIG-02c kasus `normal`):
  `{ fixtures: 59, renders: 118, same: 116, diff: 2, noBaseInHarness: 0, rejected: 0, aggregateSha: '6d245a94befe1b8bbff59ee0da9ba18f485f81856473dbc5a5cc8452f735cb5d' }`.
  - Dua "diff" adalah `k08.json@datum/gallery`. Harness kasus `normal` K-08 memakai spec panel
    ekstra (menimpa fixture k08 di `chartSpecsByCode`), jadi pembandingnya bukan fixture yang sama.
  - Pemeriksaan langsung terhadap pohon dasar siklus 1 (`fig02c/base`; k08 tidak berubah di
    FIG-02c menurut laporan 21 §5) dengan `fig03a/k08.ts`: `k08.json@bawaan c803fb85da28 SAMA`,
    `@datum c803fb85da28 SAMA`, `@gallery 8699cd5c8133 SAMA`. Jadi 118/118 identik.
- **Penjaga di suite:** `fig03a-chart-intent.test.ts` merender setiap fixture dengan `intent: {}`
  dan `orientation: "auto"`, dan SVG-nya sama dengan render tanpa intent (jalur terapan = identitas).
- **Determinisme:** gen.ts dijalankan dua kali (`fig03a/out`, `fig03a/outspec`); sha gabungan chart
  diperiksa di run pertama, dan run kedua hanya untuk spec demo.
- **`convert_v2 --check`:** SAME untuk `doc.v2.json` (79290e07…), `template.v2.json` (882057c5…),
  dan `datum-manual-000.preset.json` (a951b149…).
- **Pin 136 ParamDef:** tidak ada ParamDef baru. Medan maksud adalah medan kontrak, bukan ParamDef;
  `chart-smoke.test.ts` lulus di suite studio (§7).

## 6. Demo sebelum/sesudah (kasus harness padat)

Skrip `fig_audit/fig03a/demo.ts`; spec harness dari `fig03a/outspec/spec` (`DUMPSPEC=1`); SVG di
`fig03a/demo/`. Metrik: lint geometri chart in-process (`lintChartGeometry` + `CHART_LINT_OPTIONS`,
sama dengan `quick.ts` FIG-02c), bukan Chromium. "Render pertama" = skor dari laporan `AUTO_FIT`
(0 bila tidak ada `AUTO_FIT`, artinya render pertama sudah bersih); "akhir" = skor lint SVG
keluaran. Label singkat demo dibuat otomatis (kata pertama + nomor), menirukan revisi agen.

| Kasus | Maksud | Render pertama | Akhir | Tinggi | Laporan |
|---|---|---|---|---|---|
| P-02 datum many (30 kategori) | sebelum | 86 | 0 | 222 mm | AUTO_FIT, AUTO_ORIENT |
| | `topN: 8` | **0** | 0 | **46 mm** | INTENT_APPLIED |
| P-02 datum manyLong | sebelum | 397 | 0 | 222 mm | AUTO_FIT, AUTO_ORIENT |
| | `topN: 8, sort: "desc"` | 33 | 0 | 70,8 mm | AUTO_FIT, AUTO_ORIENT, INTENT_APPLIED |
| P-03 galeri manyLong | sebelum | 253 | **2** (GEOM_TEXT_MARK) | 58 mm | AUTO_FIT, GEOM_TEXT_MARK |
| | `topN: 8` | 22 | 0 | 58 mm | AUTO_FIT, INTENT_APPLIED |
| | `topN: 8` + `labelShort` | **0** | 0 | 58 mm | INTENT_APPLIED |
| P-03 datum longLabel | sebelum | 6 | 0 | 58 mm | AUTO_FIT |
| | `labelShort` | 0 | 0 | 58 mm | INTENT_APPLIED |
| P-02 datum longLabel | sebelum | 16 | 0 | 49,2 mm | AUTO_FIT, AUTO_ORIENT |
| | `orientation: "horizontal"` | 6 | 0 | 49,2 mm | AUTO_FIT, INTENT_APPLIED |
| | `orientation: "horizontal"` + `labelShort` | **0** | 0 | 49,2 mm | INTENT_APPLIED |
| K-05 datum (30 bagian) | sebelum | DITOLAK `chart.kind.K-05.maxSlices`: "30 bagian > 5; kirim \`topN: 4\` (sisanya digabung menjadi "Lainnya"), pisah menjadi dua gambar, atau pakai stacked bar (K-01) / bar (P-01)" | | | |
| | `topN: 4` | 0 | 0 | 44 mm | INTENT_APPLIED |

Pembacaan:

- Tata letak otomatis FIG-02 sudah menolkan cacat akhir pada sebagian besar kasus, tetapi dengan
  biaya: tinggi 222 mm, orientasi diputar mesin, atau label yang dipotong/ditipiskan.
- Medan maksud memberi agen tuas yang menghasilkan render pertama bersih (tanpa fit) dan gambar
  lebih ringkas.
- Satu run demo pertama juga membuktikan penjaga `labelShort`. Singkatan otomatis yang terpotong
  membuat dua kategori berlabel sama, dan mesin menolaknya dengan
  `SCHEMA_INVALID CHART_INTENT labelShort[10].short … membuat dua kategori berlabel sama di sumbu`.

## 7. Gerbang (keluaran segar)

| Gerbang | Perintah | Hasil |
|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | `tsc rc=0`, 0 baris `error TS`. Run awal sempat melaporkan galat di `figures/preview/_lib/figure.ts`, `engine/diagram/fit/labels.ts`, dan `mcp-fig03b-figure-tools.test.ts` (berkas FIG-03b/FIG-02b1 yang sedang ditulis); run akhir bersih. |
| Lint | `npx eslint` pada 12 berkas sumber yang disentuh + 2 uji baru | `eslint rc=0` |
| Uji baru + penjaga terkait | `npx vitest run fig03a-chart-intent.test.ts fig03a-chart-intent-schema.test.ts chart-smoke.test.ts fig02a-geometry-lint.test.ts fig02c-labelfit.test.ts` | Test Files 5 passed (5); Tests 184 passed (184) |
| Suite figur + kontrak (pertengahan kerja) | `npx vitest run tests/unit/studio/figures tests/unit/studio/contract` | Test Files 25 passed (25); Tests 700 passed (700) |
| Uji studio | `npx vitest run tests/unit/studio` (log `fig_audit/fig03a/vitest_studio.log`) | Test Files 3 failed / 179 passed (182); Tests **6 failed** / 3789 passed / 1 skipped (3796); 197,92 s. Keenam kegagalan di luar lingkup (§8): 4 di `tests/unit/studio/mcp/**` (FIG-03b) dan 2 di `figures/diagram-keyrow-page.test.ts` (tinggi diagram, `engine/diagram/**` milik FIG-02b1). Semua uji chart, kontrak, dan fig03a lulus, termasuk pin 136 di `chart-smoke.test.ts`. |
| convert_v2 | `npx tsx benchmark/extract/convert_v2.ts --check` | SAME x3 (doc.v2 79290e07…, template.v2 882057c5…, preset a951b149…) |
| Byte-identik harness | `fig03a/cmp.py` | chart 752/752 + G 24/24 identik; status tidak berubah; sha gabungan sama |
| Paritas fixture | `fig03a/parity.ts` + `fig03a/k08.ts` | 118/118 identik |
| Skema contoh panduan | 4 contoh §4.1.1 divalidasi `validateV2Against('studio.chapter/v2')` (+ caption/source) | `[]` x4 |

## 8. Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Medan blok tidak diteruskan ke mesin oleh perakit | 0 (sengaja tidak diubah) | `services/compose/blocks.ts` (`chart()`) menyalin medan blok satu per satu ke draf; berkas di luar lingkup tulis brief | Menunggu controller. Patch siap di bawah. | **Ya, untuk fungsi ujung-ke-ujung dan uji Hermes.** Tidak memblokir paritas. |
| Pointer `labelShort` tak dikenal tidak berprefiks blok | 0 | Galat mesin dilempar dari compose tanpa pointer blok (pola sama dengan EC28 sebelum D-382); `details.pointer` relatif blok (`/labelShort/1/label`) | Opsional: tambah pelengkap pointer seperti `withChartCustomPointer` di `services/ingest/by-construction.ts` | Tidak |
| 4 uji MCP gagal | — | Pekerjaan FIG-03b sedang berjalan (`scripts/studio/mcp/**`) | Di luar lingkup | Tidak (milik FIG-03b) |
| 2 uji `diagram-keyrow-page` gagal; 34 SVG diagram harness berubah | — | Pekerjaan FIG-02b1 sedang berjalan (`engine/diagram/build/autofit.ts` baru, dll.) | Di luar lingkup | Tidak (milik FIG-02b1) |

Patch perakit yang diusulkan (dua baris + impor) untuk `src/lib/studio/services/compose/blocks.ts`:

```ts
import { chartIntentOf } from "../../engine/chart/core/intent";
// di chart(), tepat sebelum `spec = chartSpecFromDraft(s, b.form);`
    const intent = chartIntentOf(b);
    if (intent) s.intent = intent;
```

`chartIntentOf` mengembalikan `undefined` bila blok tidak membawa medan maksud, sehingga spec (dan
SVG) blok lama tidak berubah. Spec `custom` membawa `intent` lewat `resolveCustomChart`, yang
menyalin semua medan. Patch belum diterapkan dan belum diuji ujung-ke-ujung lewat compose.

## 9. Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| Bentuk `labelShort` | Larik `[{ label, short }]` di tingkat blok, bukan medan per titik | Satu bentuk untuk `categorical` dan `series` (kategori seri tidak punya objek per titik); kunci dicek mesin dengan pointer |
| Letak di spec mesin | `StudioChartV1.intent` (dikelompokkan); medan v2 tetap datar di blok | Jalur tanpa `intent` dipisah total (byte-identik); panel komposit tidak membawanya |
| Pemeriksaan kecocokan label | Tidak bisa di JSON Schema; dilakukan mesin (`SCHEMA_INVALID`, `checkId: "CHART_INTENT"`, `details.pointer`) | Tanpa kode galat baru (menghindari pin matriks kode galat dc35) |
| Cakupan `orientation` | Hanya P-01/P-02/W-02 yang punya pasangan kode; grouped (P-03) dan stacked (K-01/K-02) tidak punya varian arah lain di mesin | `HINT_IGNORED`. Varian grouped horizontal/stacked vertikal butuh perender baru (di luar baris ini). |
| Cakupan `topN` | Hanya kode bernilai aditif; P-06/P-14/K-02/P-09/P-11/P-10/W-*/K-04/K-10 tidak | `HINT_IGNORED` dengan alasan; perlu konfirmasi controller bila ingin diperluas |
| `topN` dengan sisa 1 kategori | Menggabung 1 kategori menjadi "Lainnya (1)" menghapus labelnya tanpa manfaat | `HINT_IGNORED`, gambar tidak berubah |
| Laporan penerapan | REPORT `INTENT_APPLIED` (tambahan di luar brief) | Agar agregasi tidak pernah diam-diam (D-482 butir 1) dan agen melihat total |
| Saran P-15 | Uji fig02c mewajibkan teks `topN` di saran P-15, padahal `topN` tidak berlaku untuk matriks | Saran menyebut "\`topN\` tidak berlaku untuk tabel matriks P-15" (akurat, uji lama tetap hijau) |
| Panduan agen | §4.1.1 ditulis sekarang sesuai brief | Medan baru efektif hanya setelah patch §8. Controller sebaiknya menahan rilis panduan/uji Hermes sampai patch mendarat. |

## 10. Langkah berikut

- Controller: terapkan atau otorisasi patch perakit §8, lalu tambahkan satu uji compose ujung-ke-ujung
  (kiriman v2 `topN` -> SVG berisi "Lainnya (k)").
- Opsional: pelengkap pointer blok untuk `CHART_INTENT` (pola D-382).
- Review direkomendasikan, cakupan: `engine/chart/core/intent.ts`, `render.ts`/`autofit.ts`,
  `contract/schema/v2/forbidden.ts` (`chartIntentIssue`), dan skema v2/v1 `intent`.
