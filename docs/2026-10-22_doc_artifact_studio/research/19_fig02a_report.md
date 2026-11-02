---
task_id: FIG-02a
task_slug: doc_artifact_studio
row: FIG-02a
date: 2026-11-02
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/research/18_figure_layout_audit.md (§6) + decisions/decisions.md D-482
status: needs-review
---

# 19 — FIG-02a: textfit, lint geometri, dan tata letak otomatis grafik

Baris FIG-02a, keputusan D-482 (`decisions/decisions.md:487`). Dasar: audit `research/18_figure_layout_audit.md` §5-§8.
Kategori: Penyempurnaan (mesin grafik). Repo `C:\Users\TRIAL\gsp-swarm-hq-v2.1`, branch `v2.1`. Agen: `coder-execution`; skill: `tdd`, `diagnosing-bugs` (loop harness dulu), `dry-run-verify-fix`, `verification-before-completion`.
Lingkup: §6 butir P0-1, P0-2, P0-3, P1-4, P1-5, P1-6, P1-7, P1-8, dan P2-15 (caption/SUMBER grafik saja). Bukan butir 9 (agregasi) dan bukan medan kontrak §7.1 (FIG-03). `engine/diagram/**` tidak disentuh.
Tidak ada commit, push, migrasi, atau sentuhan DB.

## 1. Ringkasan

1. **Render bercacat grafik turun dari 422/776 (54 %) menjadi 82/776 (11 %)**, diukur ulang di Chromium dengan harness FIG-01 yang sama. Jumlah cacat terukur turun dari 23.090 menjadi 5.054. Teks keluar kanvas turun dari 1.446 menjadi 13. Pasangan teks bertumpuk turun dari 18.594 menjadi 3.258; 3.025 di antaranya dari tabel P-15 24x24.
2. **Pagar "aktif hanya bila cacat terdeteksi" terbukti.** Semua 391 render harness yang bersih menurut lint menghasilkan SVG byte-identik dengan HEAD. Pada fixture paritas, 168 dari 177 render identik. 9 render yang berubah semuanya bercacat terukur pada baseline (H-01, H-02, P-13, G-03), dan setelah perubahan tinggi kanvas serta multiset teksnya tetap sama (§5).
3. **Target audit tercapai sebagian.** longLegend 61 % -> 4 %. longTitle 100 % -> 9 %. longLabel 70 % -> 12 %; galeri saja 9 %. many 63 % -> 17 %. manyLong 86 % -> 20 %. normal 10 % -> 6 %. Target "normal 0" dan "longLabel/many < 10 %" **belum tercapai**. Sisa cacat dijelaskan per kode di §6: kapasitas P-15, label kontur H-06 (positif palsu audit), keluarga G, dan label nilai P-05/P-07/P-10.
4. **Gerbang hijau.** `tsc` 0 galat. `eslint` 0 masalah pada 49 berkas yang disentuh. Vitest studio: 173 berkas, 3.687 lulus, 1 dilewati, 0 gagal. `convert_v2 --check` SAME x3. Pin 136 ParamDef tidak berubah (tidak ada ParamDef baru). Dua generasi harness memberi sha gabungan identik (`f66e1ed6…7687`).
5. **Perlu keputusan controller (status needs-review).** (a) 4 fixture paritas berubah dengan alasan tercatat (§5), mirip deviasi yang diterima D-482 butir 3 untuk DG; perlu diterima atau ditolak. (b) Saran lint menyebut medan `orientation`/`labelShort`/`topN` sesuai audit §7.2, padahal medan itu baru ada setelah FIG-03. (c) Review kode direkomendasikan (§9).

## 2. Arsitektur yang dibangun

Alur `renderChart` (`engine/chart/core/render.ts:47-80`):

1. Render spec apa adanya (`renderOnce`), persis seperti sebelum FIG-02a.
2. Lint geometri tanpa browser `lintChartGeometry(svg)` (`render.ts:71`). Bila skor 0, hasil dikembalikan apa adanya. Inilah jaminan byte-identik untuk masukan bersih: tidak ada pembantu baru yang berjalan.
3. Bila ada cacat, `autoFitChart` (`core/autofit.ts:123`) merender ulang di dalam `withFit(...)` (`core/fit.ts:47`). Hanya di dalam status ini `fitActive()` benar, dan pembantu sadar-fit boleh mengubah keluaran. Setiap pembantu juga berpagar ukurannya sendiri: ia hanya mengubah unsur yang memang tidak muat menurut `textfit`.
4. Kandidat dicoba berurutan dari perubahan terkecil:
   - fit pada tinggi bawaan;
   - tangga tinggi kanvas (P0-3);
   - orientasi horizontal otomatis (P1-4).

   Pemenangnya kandidat dengan skor lint terkecil (seri: kandidat lebih awal). Kandidat yang tidak lebih baik dari render pertama tidak pernah dipakai.
5. Laporan bertambah REPORT (tidak pernah FAIL):
   - `AUTO_FIT` (skor sebelum/sesudah + tindakan);
   - catatan pembantu: `CAPTION_WRAP`, `CAPTION_TRUNCATED`, `AXIS_LABEL_WRAP`, `AXIS_LABEL_ROTATE`, `LABEL_GUTTER`, `LEGEND_WRAP`, `AUTO_ORIENT`, `LABEL_DROPPED`;
   - sisa cacat `GEOM_TEXT_OVERLAP`, `GEOM_TEXT_OUTSIDE`, `GEOM_TEXT_MARK`, `GEOM_LINE_TEXT`, masing-masing dengan medan `suggest`.

Komposit (`renderComposite`) tidak melewati jalur ini. Panel komposit tidak berubah.

## 3. Perubahan per berkas (file:baris)

### 3.1 Modul baru (`engine/chart/core/`)

| Berkas | Isi |
|---|---|
| `textfit.ts` (baru) | Modul bersama untuk FIG-02b. Tanpa impor apa pun. `measure` (`:106`) memakai tabel lebar glif IBM Plex Sans Condensed 400/600: 211 glif, diukur di Chromium dari berkas fon terpasang, harness `fig02a/glyphs.mjs`. Mono = 0,6 em. Juga `wrap` (`:152`, jumlah baris paling sedikit, lalu baris terlebar minimum lewat DP), `ellipsize` (`:205`), `wrapEllipsize` (`:225`), `fitWithinSpan` (`:263`), `firstBaseline` (`:297`), `tspanLines` (`:324`), `titleSvg` (`:330`). API lengkap di §8. |
| `geometry.ts` (baru) | `lintChartGeometry` (`:514`): port metrik harness §2.3 tanpa browser. Memahami kotak teks (anchor, rotasi, baris tspan), rect/circle/line/path (M L H V C S Q T A Z, busur dan kurva diratakan), dan aturan isian nonzero. Juga `geometryIssues` (`:619`, REPORT + `suggest`), `hintCtxFromSpec` (`:635`), dan `pathPolylines` (`:175`). |
| `fit.ts` (baru) | Status fit modul: `withFit` (`:47`), `fitActive` (`:31`), `fitState` (`:36`), `fitNote` (`:41`). |
| `labelfit.ts` (baru) | Pembantu sadar-fit: `gutterPlan`/`drawGutterLabel` (`:40`, `:73`, P1-5); `categoryAxisPlan`/`drawCategoryLabel` (`:101`, `:147`, P1-4: muat -> bungkus 2-3 baris -> rotasi -45 derajat dengan pita dinamis -> tipiskan; slot pertama/terakhir dijaga di kanvas, P1-6); `legendRows` (`:194`, P1-7); `placePointLabels` (`:277`, P1-8: 8 posisi, lalu cincin kedua dengan garis penunjuk, lalu `LABEL_DROPPED`); `spreadPositions` (`:234`). |
| `autofit.ts` (baru) | `autoFitChart` (`:123`). Tangga tinggi x1,25..5. Kanvas lebih tinggi dipakai hanya bila skor turun >= 50 %. Di atas 3x hanya bila skor menjadi 0. Faktor maksimum 1,25 / 2 / 5 untuk 1-2 / 3-9 / >= 10 cacat, supaya gambar tidak membengkak demi satu sentuhan label. AUTO_ORIENT P-02/W-02 -> P-01 (`sort = natural`, urutan agen D-368) hanya bila label kolom lebih lebar dari slotnya (`columnLabelsTooWide`). |

### 3.2 Berkas inti yang diubah

| Berkas | Perubahan |
|---|---|
| `core/render.ts:47-80` | `renderOnce` + lint + `autoFitChart`. Laporan digabung lewat `mergeReports`. `estimateHeightMm` (`:44`) memakai `figureFootMm`. |
| `core/svg.ts` | `SvgDoc.text` (`:221-235`): hanya saat fit, teks horizontal yang keluar tepi kiri/kanan dijaga di dalam lewat `fitWithinSpan` (geser label tengah; bungkus label rata kiri/kanan maks 2 baris; blok dijaga di dalam tinggi kanvas). `SvgDoc.textLines` (`:252`): satu `<text>` dengan `<tspan>`, plus `<g data-fit="ellipsis"><title>` untuk label terpotong. |
| `core/apparatus.ts` | Caption/SUMBER berbungkus (P2-15): `apparatusLines` (`:45`), `figureExtraMm` (`:66`), `figureFootMm` (`:72`), `figureCaptionTopMm` (`:77`), `figureApparatus` dengan jalur multi-baris. KUNCI multi-baris (P1-7): `keyLayout` (`:117`), `keyRowExtraMm` (`:129`), `keyRow` jalur multi-baris. |
| `core/datum.ts` | Talang terukur + bungkus P-01/P-11 menggantikan `kiri = 22` saat fit (P1-5). `dcHeightMm` + `figureExtraMm`. Catatan dinaikkan di atas caption saat fit (DC menaruh catatan dan SUMBER sama-sama di H - 1,6). |
| `core/gallery.ts` | Talang terukur batang dan threshold saat fit (P1-5); `figureFootMm`. |

### 3.3 Keluarga yang diubah (pemakaian pembantu)

- **`FIGURE_APPARATUS_BAND_MM` -> `figureFootMm(spec)`** (sama persis di luar fit): `family-g/common`, `family-h1/{common,heatmap,hexbin,scatter}`, `family-h2/shared`, `family-k1/{common,diverging,pie,stack}`, `family-k2/common`, `family-p1/common`, `family-p2/common`, `family-s1/common`, `family-s2/common`, `family-w1/frame`, `family-w2/common`.
- **Label sumbu kategori bertingkat (P1-4):**
  - `family-s1/common` (`groupAxisPlan`, `groupLabel`), `family-s1/{box,violin}`;
  - `family-s2/common` (`columnFrame.labelPlan`, `columnLabel`), `family-s2/{strip,beeswarm}`;
  - `family-p1/{grouped-column,dot-plot,range-plot}`;
  - `family-p2/waterfall`, `family-k2/marimekko`, `family-w2/bump`, `family-h2/arc`;
  - `family-p2/small-multiples` (tick kategori dipotong ke jarak tick).
- **Talang terukur (P1-5):** `family-p2/bullet`, `family-p2/table` (kolom label dijepit 40 %, label dibungkus/dipotong, kepala kolom dipotong).
- **KUNCI multi-baris (P1-7):** `family-k1/{stack,diverging}`, `family-k2/{waffle,icon-array,marimekko,treemap}`.
- **Penghindar tabrakan label titik (P1-8):**
  - `family-h1/scatter` (`fitPointLabels`, H-01/H-02);
  - `family-p2/quadrant` (P-13), `family-h2/network` (H-07);
  - `family-s1/density` (label puncak S-03);
  - `family-p2/bullet` (label nilai ke ujung batang saat baris rapat).

### 3.4 Uji baru

- `tests/unit/studio/figures/fig02a-textfit.test.ts` — 19 uji. Acuan lebar independen dari Chromium: "Pengadaan perangkat" = 8,805 em (400) / 9,175 em (600). Uji juga mencakup sifat bungkus (baris <= maxW, kata utuh berurutan, jumlah baris minimum, tidak lebih lebar dari bungkus rakus), elipsis, `fitWithinSpan`, dan `tspanLines`.
- `tests/unit/studio/figures/fig02a-geometry-lint.test.ts` — 16 uji. Lint pada SVG buatan tangan: bersih, tumpuk, keluar + sisi, potong tanda vs di dalam tanda, dekorasi diabaikan, garis menembus, baris tspan, rotasi, path busur. Juga REPORT bersaran, `hintCtxFromSpec`, dan uji ujung-ke-ujung:
  - fixture lint-bersih tanpa isu `AUTO_FIT`/`GEOM_*` (> 40 fixture);
  - P-02 label panjang -> `AUTO_ORIENT`, lint 0, deterministik;
  - caption figure panjang -> `CAPTION_WRAP` + tspan + 0 teks keluar.

## 4. Hasil sebelum/sesudah (Chromium, harness FIG-01)

Perintah (dijalankan, keluaran nyata, `C:\Users\TRIAL\AppData\Local\Temp\fig_audit\`):

```
cp out/*.json out_baseline/ ; cp -r out/svg out_baseline/svg        # garis dasar FIG-01
OUT=.../out_after tsx gen.ts      -> total 1009 ok 831 rejected 94 na 84
OUT=.../out_after node measure.mjs -> measured 831
node fig02a/table.mjs             -> fig02a/table_after.txt
```

Grafik, kedua gaya (render bercacat / render; jumlah cacat):

| Kasus | n | Sebelum | % | Sesudah | % | Cacat sebelum | Cacat sesudah |
|---|---|---|---|---|---|---|---|
| normal | 116 | 12 | 10 % | 7 | 6 % | 36 | 27 |
| longLabel | 114 | 80 | 70 % | 14 | 12 % | 667 | 169 |
| many | 94 | 59 | 63 % | 16 | 17 % | 5.517 | 2.313 |
| manyLong | 90 | 77 | 86 % | 18 | 20 % | 16.238 | 2.424 |
| longLegend | 84 | 51 | 61 % | 3 | 4 % | 280 | 4 |
| longTitle | 116 | 116 | 100 % | 11 | 9 % | 269 | 50 |
| extreme | 102 | 19 | 19 % | 8 | 8 % | 41 | 28 |
| negative | 60 | 8 | 13 % | 5 | 8 % | 42 | 39 |

Gaya `datum` (bawaan v2 blok tunggal):

| Kasus | Sebelum | Sesudah |
|---|---|---|
| normal | 8/58 | 5/58 |
| longLabel | 44/57 | 9/57 (16 %) |
| many | 33/47 | 10/47 (21 %) |
| manyLong | 41/45 | 12/45 |
| longLegend | 30/42 | 0/42 |
| longTitle | 58/58 | 9/58 |

Gaya `gallery`:

| Kasus | Sebelum | Sesudah |
|---|---|---|
| normal | 4/58 | 2/58 |
| longLabel | 36/57 | 5/57 (9 %) |
| many | 26/47 | 6/47 (13 %) |
| manyLong | 36/45 | 6/45 |
| longLegend | 21/42 | 3/42 |
| longTitle | 58/58 | 2/58 |

Per jenis cacat (grafik):

| Jenis | Sebelum | Sesudah |
|---|---|---|
| textOverlap | 18.594 | 3.258 |
| textOutside | 1.446 | 13 |
| textStraddleMark | 2.808 | 1.612 |
| lineThroughText | 150 | 85 |
| edgeCross (H-07) | 68 | 68 |

Diagram: 46 -> 46 render bercacat. 55 SVG diagram byte-identik (tidak disentuh). Status render tidak berubah (0 penolakan baru). FAIL tetap hanya W-07 many/manyLong DATUM-26, yang sudah ada di baseline.

Tindakan otomatis yang muncul:

| Tindakan | Jumlah / contoh |
|---|---|
| `AUTO_FIT` | 385 render |
| `AUTO_ORIENT` | 12 render (P-02 dan W-02, label panjang/banyak) |
| `LABEL_DROPPED` | 20 render (scatter/bubble/quadrant/network/density padat) |
| Tinggi kanvas bertambah | 193 render: 116 longTitle (pita caption), sisanya many/manyLong. Contoh: P-02 30 kategori -> P-01 222 mm = 30 x 7,2 + 6, rumus DC; K-01 manyLong 50 -> 200 mm. |

Validitas lint tanpa browser terhadap Chromium pada 776 SVG baseline:

| Hasil | Jumlah |
|---|---|
| Positif benar | 418 |
| Positif palsu | 2 (K-10 galeri many/manyLong; jarak baris 2,0 mm untuk huruf 6,4 pt) |
| Negatif palsu | 2 (G-03 galeri normal, G-04 galeri longLabel) |
| Negatif benar | 354 |

Waktu lint: 363 ms untuk 776 SVG.

## 5. Bukti paritas

Pembanding: salinan `git archive HEAD src/lib/studio` di `fig_audit/fig02a/base`, dengan tsconfig alias + junction node_modules. Skrip: `fig02a/parity.ts`, `fig02a/parity2.ts`.

- **Fixture paritas** (`tests/parity/fixtures/chart/*.json` + `chart_extra_panels.json`, masing-masing gaya bawaan/datum/gallery): 177 render, **168 sha identik, 9 berubah, 0 penolakan berubah**. Yang berubah:

| Render | sha lama -> baru | Cacat baseline (lint / Chromium) | Sesudah | Tinggi | Multiset teks |
|---|---|---|---|---|---|
| h01 (bawaan & @datum) | 6ed76cd1e85d -> 8824bc8ce40c | 1 label menyentuh titik | 0 | 66 -> 66 | sama |
| h01@gallery | 459673573a79 -> 65178ab905b0 | 1 label menyentuh titik | 0 | 66 -> 66 | sama |
| h02 (bawaan & @datum) | 89d33327b0a0 -> c332d58acb53 | 1 label memotong gelembung | 0 | 66 -> 66 | sama |
| p13 (bawaan & @datum) | bac8a8fcecb6 -> 5c9e52d8851d | 1 label keluar kanvas | 0 | 70 -> 70 | sama |
| p13@gallery | 6183e5b76a02 -> 29cee16bf34e | 1 label keluar kanvas | 0 | 70 -> 70 | sama |
| extra G-03@datum | 93a08cdc9460 -> 85d41550cf7e | 5 potong tanda + 3 garis | 1 + 3 | 44 -> 55 | sama |

  CA (P-01, P-02, P-11, W-02 datum) identik. h01/h02/p13 (kelas CB1: heightTol +/- 3 mm, labelSetIdentical) tetap memenuhi tinggi dan himpunan label. Hanya posisi label titik yang berubah.
- **Kasus normal harness:** 110/116 identik. 6 berubah: G-03 datum, H-01 datum/gallery, H-02 datum, P-13 datum/gallery. Keenamnya bercacat di baseline Chromium.
- **Semua render harness yang lint-bersih di baseline:** 391/391 identik (`fig02a/quick.ts`, `changedClean: 0`).
- **`convert_v2 --check`:** SAME untuk `doc.v2.json` (79290e07…), `template.v2.json` (882057c5…), dan `datum-manual-000.preset.json` (a951b149…).
- **Determinisme:** `gen.ts` ke `out_after` dan `out_det` memberi sha gabungan identik `f66e1ed6c8cd2e498ba0b15c985a6fba29ba5e17d3032c30589f5f9a6ecf7687`. Uji unit P-02 juga merender dua kali dan membandingkan string SVG.

## 6. Sisa cacat dan alasannya

| Kode / kasus | Sisa | Alasan | Langkah lanjut |
|---|---|---|---|
| P-15 many/manyLong (4 render, ~3.000 pasangan) | Angka kolom bertumpuk | Kapasitas: 24 kolom mono 6,8 pt di 128/166 mm (kolom ~4 mm, angka "410,0" ~7 mm). Tinggi dan bungkus tidak menolong lebar. | REPORT menyarankan `topN`/pisah gambar. Agregasi = FIG-03 (D-482 butir 1). |
| H-06 (normal..manyLong datum) | Potong tanda/garis | Positif palsu yang sudah dicatat audit: label kontur berhalo terbaca baik (audit §2.3). | Pengecualian halo di lint FIG-03. |
| G-01/G-02/G-03/G-04 | Label ubin, garis aliran, simpul flowchart | Keluarga G di luar daftar butir FIG-02a (G-04 setara diagram, FIG-02b). | FIG-02b/FIG-03. |
| S-08 datum (semua kasus) | 1 label menyentuh batang radial | 1 cacat: tangga tinggi dibatasi 1,25x (kebijakan anti-membengkak), dan tidak cukup. | Penempatan label radial khusus. |
| P-05 / P-07 / P-10 many | 2-12 label nilai bertumpuk ("maks …", rentang, delta waterfall) | Label nilai bertetangga di kolom rapat; belum ada penipisan label nilai. | Generalisasi `placePointLabels`/thinning untuk label nilai kolom. |
| P-12 datum longLabel/manyLong | Tick kategori panel kecil | Elipsis ke jarak tick menolong longLabel (88 -> 1); manyLong masih 17. | Tick kategori dengan rotasi pada panel. |
| P-14 manyLong datum | 29 tumpuk + 1 garis | Label baris panjang pada pita sempit (panah). | `gutterPlan` untuk P-14. |
| H-04 | 1-2 garis jalur menembus label ujung | Label anotasi ujung (datum) memakai offset tetap. | `placePointLabels` dengan rintangan segmen. |
| H-07 many | 17 persilangan tepi | Tata letak simpul network, bukan label (di luar lingkup label). | — |
| H-09 longLabel | 3 tumpuk nama himpunan x angka irisan | Venn: nama panjang menimpa angka. | Bungkus nama himpunan. |
| W-09 longLabel | 1 tumpuk | Label pita horizon. | — |
| longTitle (9 datum) | Label nilai + satuan sangat panjang ("40 kW (juta rupiah per satuan kerja)") | Satuan kasus uji 35 karakter menempel pada setiap nilai. | REPORT; agen menyingkat `unit`. |

Batas teknis yang perlu diketahui:

- `SvgDoc.text` saat fit hanya menjaga tepi kanvas. Ia tidak tahu tetangganya, jadi lint memutuskan apakah kandidat lebih baik.
- Tangga tinggi tidak mengubah tinggi kode inti P-02 kolom datum (DC badan tetap 46 mm); di sana AUTO_ORIENT yang bekerja.
- Elipsis tick `P-12` tidak membawa `<title>`, karena pembantu `xAxis` keluarga p2 hanya menerima string. Teks lengkap tetap ada di data spec.

## 7. Gerbang (keluaran segar)

| Gerbang | Perintah | Hasil |
|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | exit 0, tanpa keluaran |
| Lint | `npx eslint <49 berkas: diff chart + berkas baru chart + 2 uji>` | exit 0, 0 masalah (`fig02a/eslint.log` kosong) |
| Uji studio | `npx vitest run tests/unit/studio` | Test Files 173 passed (173); Tests 3687 passed, 1 skipped (3688); 178,99 s |
| Uji figur | `npx vitest run tests/unit/studio/figures` | 15 berkas, 454 lulus |
| Pin registri | `chart-smoke.test.ts` (136 ParamDef, 76 entri, 58 tergambar) | lulus; tidak ada ParamDef baru |
| convert_v2 | `npx tsx benchmark/extract/convert_v2.ts --check` | SAME x3 |
| Determinisme | gen.ts x2 | sha gabungan identik |
| Paritas | `fig02a/parity.ts` | 168/177 identik; 9 berubah tercatat (§5) |

Catatan: pada run vitest pertama (sebelum uji baru ditambahkan), 15 uji di `tests/unit/studio/mcp/mcp-d4-security.test.ts` gagal. Berkas itu milik pekerjaan MCP agen lain yang berjalan bersamaan, tidak terkait grafik. Run akhir di atas: 0 gagal.

## 8. API `textfit` yang diekspor (untuk FIG-02b)

Impor: `import { … } from "../../chart/core/textfit";` dari `engine/diagram/**`. Modul tanpa dependensi, aman dari siklus.

```ts
export type TextFace = "struct" | "data";
export interface FitFont { pt: number; face?: TextFace; bold?: boolean; trackMm?: number; caps?: boolean }
export const LINE_HEIGHT_EM = 1.2;
export const FONT_ASCENT_EM = 1.025;
export const FONT_DESCENT_EM = 0.275;
export const MONO_EM = 0.6;
export const FALLBACK_EM = 0.5;
export const ELLIPSIS = "…";

export function measureEm(s: string, face?: TextFace, bold?: boolean): number;
export function measure(s: string, pt: number, face?: TextFace, o?: { bold?: boolean; trackMm?: number; caps?: boolean }): number; // mm
export function measureFont(s: string, font: FitFont): number; // mm
export function lineHeightMm(font: Pick<FitFont, "pt">, em?: number): number;

export interface WrapResult { lines: string[]; widthMm: number; fits: boolean }
export function wrap(s: string, maxW: number, maxLines: number, font: FitFont): WrapResult;
export function ellipsize(s: string, maxW: number, font: FitFont): { text: string; truncated: boolean };
export function wrapEllipsize(s: string, maxW: number, maxLines: number, font: FitFont): WrapResult & { truncated: boolean };

export interface SpanFit { x: number; anchor: "start" | "middle" | "end"; lines: string[]; title?: string }
export function fitWithinSpan(s: string, x: number, anchor: "start" | "middle" | "end", lo: number, hi: number, font: FitFont, maxLines?: number): SpanFit | null;

export function firstBaseline(y: number, nLines: number, lineMm: number, align?: "top" | "middle" | "bottom"): number;
export function tspanLines(lines: readonly string[], x: number, lineMm: number): string; // isi <text>; 1 baris = teks polos ter-escape
export function titleSvg(full: string): string; // <title>…</title>
```

Catatan untuk FIG-02b:

- Diagram memakai `estTextPt` 0,56 em (`diagram/core/tokens.ts:252`). `measure(…, "data")` memberi 0,6 em, lebar Plex Mono nyata, yang menutup celah knockout 7 % (audit §3.1).
- Lint geometri (`core/geometry.ts`) memahami `data-node` (dilewati untuk potong tanda) dan `data-mark="link"` (garis). Metrik tepi (silang/berimpit) belum di-port.

## 9. Persistent Issues

| Isu | Percobaan | Akar | Status | Memblokir? |
|---|---|---|---|---|
| Target "normal 0 cacat" | 3 siklus (fit, batas tangga, catatan datum) | H-06 positif palsu; G-02/G-03/G-04/S-08 di luar butir FIG-02a | 7/116 tersisa (dari 12) | Tidak |
| Target longLabel/many < 10 % | > 3 siklus pembantu per keluarga | P-15 kapasitas; label nilai kolom; keluarga G | 12 % / 17 % (galeri 9 % / 13 %) | Tidak; perlu FIG-03 (topN) + pekerjaan label nilai |

## 10. Issues & Decisions

| Langkah | Isu / keputusan | Penyelesaian |
|---|---|---|
| Pagar aktivasi | Kapan pembantu baru boleh mengubah SVG | Dua pagar: lint render pertama > 0 (global) dan unsur tidak muat (lokal). Render bersih tidak pernah masuk fit. |
| LintIssue `suggest` | `contract/engine.ts` (di luar kepemilikan) tidak punya medan `suggest` | Tipe `GeometryIssue = LintIssue & { suggest }` di `geometry.ts`; saran juga ditulis di `detail` ("saran: …"). Kontrak tidak diubah. |
| Kalibrasi ukuran | Audit menyarankan em efektif 0,425 | Dipakai tabel glif nyata per karakter (lebih akurat untuk kapital); lint cocok dengan Chromium 418/422. |
| Tangga tinggi | Satu cacat kecil sempat menggandakan tinggi (S-08 44 -> 132 mm) | Faktor maksimum menurut jumlah cacat (1,25/2/5), > 3x hanya bila skor 0, gain >= 50 %. |
| AUTO_ORIENT | Sempat terpicu oleh caption panjang (bukan label) | Syarat tambahan: label kolom lebih lebar dari slot. |
| Paritas | 4 fixture berubah (h01, h02, p13, extra G-03) | Diajukan ke controller (needs-review); bukti cacat baseline + tinggi/teks sama di §5. |
| Saran medan FIG-03 | Saran menyebut `orientation`/`labelShort`/`topN` (audit §7.2) sebelum medan itu ada | Diajukan ke controller: pertahankan (FIG-03 menyusul, D-482 butir 2) atau tunda kata-katanya sampai FIG-03. |

## 11. Langkah berikut

- Controller memutuskan penerimaan 4 fixture paritas yang berubah dan kata-kata saran.
- Review kode direkomendasikan (`senior-code-reviewer`). Fokus:
  - `core/autofit.ts` (kebijakan kandidat);
  - `core/svg.ts:221-235` (penjaga tepi global saat fit);
  - `core/geometry.ts` (parser SVG terbatas);
  - pagar byte-identik.
- FIG-02b memakai `textfit` (§8). FIG-03 menambah `topN`/`labelShort`/`orientation` dan pengecualian halo H-06 di lint.
- Sisa per kode di §6 (label nilai kolom, P-14 talang, radial S-08, Venn H-09).
