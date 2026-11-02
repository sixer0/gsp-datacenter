---
task_id: SEC-FIX2
task_slug: doc_artifact_studio
row: SEC-FIX2 (perbaikan keamanan siklus 2 dari 3, temuan M-1 kapasitas render figur; N-1, N-2, N-3)
date: 2026-11-02
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/decisions/decisions.md (D-506 "Fix all"); verification/11_figure_security_review.md bagian "Siklus 1"
status: complete
---

# Laporan Implementasi: SEC-FIX2 (N-2 High, N-1 Medium, N-3 Low)

Skill dimuat: `tdd` (uji merah lebih dulu, seam = validator skema, fungsi cek kapasitas, `renderArtifactImpl`), `verification-before-completion` (sebagai disiplin: bukti segar sebelum klaim).

Laporan ini ditulis bertahap (append).

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca review siklus 1, probe peninjau, laporan siklus 1, kode batas | complete | `11_figure_security_review.md` S1.4; probe `probe_secfix_b2e.ts`, `b2d.out`, `bypass.out` |
| 2 | Pindai maksimum nyata larik/string/ukuran figur di fixture | complete | scratchpad `secfix2/scan.ts` -> `scan.out` |
| 3 | Uji penelusuran skema (merah dulu) | complete | `secfix2-schema-walk.test.ts`: 43 larik tanpa `maxItems`, 11 string tanpa `maxLength`, 6 isi terbuka |
| 4 | Ukur biaya mesin diagram per larik dan per panjang string | complete | scratchpad `secfix2/measure_diag.out`, `measure_str.out`, `measure_len.out` |
| 5 | N-2: `maxItems`/`maxLength` di skema v1 (chart, diagram, blok figur dokumen v1) dan v2 (blok figur) | complete | satu sumber `contract/schema/figure-bounds.ts` |
| 6 | N-2: cek kapasitas meliputi SETIAP larik (eksplisit + generik), panjang teks, byte spec/blok | complete | `services/render/figure-limits.ts` |
| 7 | N-1: cek kapasitas di R09 `renderArtifactImpl` (sebelum job) dan artefak terbungkus HTML | complete | `services/render/artifact.ts` |
| 8 | N-3: sel matriks dihitung dari isi `values` | complete | `figure-limits.ts` `chartDataInto` |
| 9 | Uji baru + pindai fixture diperluas; probe peninjau diulang; gerbang | complete | lihat Test Results / Verification |
| 10 | Dokumentasi batas (`STUDIO-AGENT-GUIDE.md` §4.1.1) | complete | satu butir |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| `src/lib/studio/contract/schema/figure-bounds.ts` | add | `FIGURE_BOUNDS`: satu sumber batas figur untuk skema v1/v2 dan cek kapasitas (larik, teks diagram, teks data chart, run, params, byte, total elemen) |
| `src/lib/studio/contract/schema/diagram.schema.ts` | modify (batas saja) | `maxItems`: `sources` 12, `nodes` 24, `edges` 48, `zones` 24, `members` 24, `legend` 24, `notes` 24; `class.lane` `maxLength` 64; `maxLength` teks dari `FIGURE_BOUNDS.diagramText` (nilai sama dengan sebelumnya: 300/1000) |
| `src/lib/studio/contract/schema/chart.schema.ts` | modify (batas saja) | `ChartData` v1: semua larik `maxItems` = v2 (200/24/2000/400/50/5000/1000/16/256), `overlaps[].sets` 16, `matrix.values` 200x200; `ChartComposite.panels` 24; `shape` 32, `start`/`end`/`accent.point` 200 karakter; `params` -> `maxProperties` 256 + `$defs.ChartParamValue` rekursif (maks 256 butir, 256 kunci, 2000 karakter) menggantikan `ParamValue` bebas (common/v1 tidak berubah); impor `commonRef` yang tak terpakai dihapus |
| `src/lib/studio/contract/schema/doc.schema.ts` | modify (batas saja) | `ChartBlock`/`DiagramBlock` v1: `FIGURE_BOUNDED` (`$ref` + saudara 2020-12) membatasi `runs` 64 di caption/source/keyRow, `tabs` 20 di format paragraf + `fieldFormats`, `provenance` 4. Definisi bersama `Inline`/`Caption`/`SourceLine`/`ParaFormat` tidak berubah |
| `src/lib/studio/contract/schema/v2/common.schema.ts` | modify (batas saja) | `FIGURE_V2` (caption/source/keyRow semua blok figur): `$ref` + saudara membatasi `runs` 64 tanpa mengubah `InlineV2`/`CaptionV2`/`SourceV2` bersama (nama `$defs` untuk `forbidden.ts` tetap). `DiagramSpecV2` memakai larik v1 yang kini berbatas. `shape` 32, `start`/`end` 200, `overlaps[].sets` 16, `SourceV2.provenance` 4 (sudah tersirat `uniqueItems` + enum) |
| `src/lib/studio/services/render/figure-limits.ts` | modify | `FIGURE_LIMITS` = `FIGURE_BOUNDS` (+ `labelShort` 200, kedalaman 32). Diagram: zona, anggota per zona dan total, legenda, catatan, sumber (juga `source` larik lama), panjang judul/label/sub/tepi/zona/butir, total karakter sumber. Chart: panel <= 24, `labelShort`, `binEdges`, `overlaps[].sets`, sel matriks dari isi `values` (N-3), panjang string data. Generik iteratif: larik apa pun <= 5000, params (256 butir/kunci), string <= 2000, total elemen <= 30000, kedalaman <= 32, byte serial <= 1 MiB (metadata `x` objek dilewati kecuali byte). Baru: `figureBytesIssues`, `figureCapacityIssuesFor`, `assertFigureCapacity` |
| `src/lib/studio/services/render/figures.ts` | modify | `buildFigures` memakai `assertFigureCapacity` (spec + byte isi blok); `assertCapacity` lokal dihapus |
| `src/lib/studio/services/render/artifact.ts` | modify | N-1: `renderArtifactImpl` memanggil `assertFigureCapacity` untuk CHART/DIAGRAM SEBELUM `createRenderJob` (422 cepat); artefak HTML ber-sumber artefak memeriksa artefak terbungkus sebelum `chartSvg`/`buildDiagramSvg` |
| `src/app/api/studio/documents/[id]/figures/preview/_lib/figure.ts` | modify | `figureCapacityIssues` = byte blok + `figureCapacityIssuesFor` (semua batas baru) |
| `tests/unit/studio/contract/secfix2-schema-walk.test.ts` | add | penelusur skema (v1 chart/diagram, blok figur dok v1, blok figur v2; `$ref` diikuti, saudara `$ref` dihormati): gagal bila ada larik tanpa `maxItems`, string tanpa `maxLength`, atau isi terbuka di luar `ALLOW_OPEN`; plus 11 uji "batas diterapkan" (N lolos / N+1 ditolak validator nyata, N dibaca dari skema) |
| `tests/unit/studio/contract/secfix2-figure-bounds.test.ts` | add | skema v2 = cek kapasitas untuk larik diagram baru; skema v1 chart = cek kapasitas (data, panel, params); N-3; batas generik; teks diagram/data chart; pindai fixture JSON diperluas + templat artefak UI (76 kode + semua keluarga) + `SAMPLE_DOCUMENT` |
| `tests/unit/studio/api/secfix2-artifact-render.test.ts` | add | R09: CHART v1 3000 titik dan DIAGRAM 10000 zona -> `BY_CONSTRUCTION_FAILED` `FIGURE_CAPACITY` < 1 s tanpa job; artefak dalam batas sampai ke pembuatan job |
| `docs/STUDIO-AGENT-GUIDE.md` | modify | butir batas §4.1.1 diperbarui (D-506) |

## Dasar batas (diukur, mesin hanya dijalankan; probe scratchpad `secfix2/`)

Mesin ini juga menjalankan uji lain bersamaan; angka ms indikatif. Fixture = maksimum di 452 berkas JSON (`scan.out`).

| Larik / teks | Terbesar di fixture | Biaya pada batas | Biaya di atas batas | Batas |
|---|---|---|---|---|
| `zones` | 1 | 24 zona: graph 20 ms, keluarga lain <= 10 ms | 200: 76 ms; 2000: 1,37 s; 5000: 9,1 s; 10000: heap habis (peninjau) | 24 |
| `zones[].members` | 9 | 24: <= 5 ms | 1000 anggota: 5 ms (murah; dibatasi demi total) | 24 per zona, 96 total |
| `legend` | 10 | 24: <= 11 ms | 1000: <= 22 ms | 24 |
| `notes` | 5 | 24: <= 4 ms | 1000: <= 3 ms | 24 |
| `sources` (jumlah) | 1 | 12: 18 ms; 24: 7 ms | graph 100: 211 ms; **1000: 316 s** | 12 |
| Total teks `sources` | <= 150 karakter | 600: 28-33 ms; 1000: 0,2-0,4 s | 1200: 0,36-0,74 s; 2400: 3,1-5,8 s; 3600: 10,4-20,1 s (graph, graph_hops) | 1000 karakter (cek kapasitas) |
| Judul diagram | <= 150 | 300: <= 5 ms | graph 1000: 214-388 ms; 2000: 1,5 s | 300 (sama dengan skema v1; juga caption v2 yang menjadi judul) |
| Label simpul | <= 150 | 300: <= 32 ms per simpul; 24 simpul x 300: swimlane 1,29 s lalu ditolak mesin, keluarga lain ditolak mesin < 2 ms | 1 simpul 1000: 0,4-3,1 s | 300 (sama dengan skema v1) |
| Teks data chart | <= 150 | 200: semua 46 fixture paritas <= 29 ms | 2000: W-06 10,9 s; P-10 1,8 s; W-02 1,7 s | 200 (sama dengan skema v1/v2) |
| Run caption/sumber/baris kunci | 4 | - | - | 64 |
| Panel komposit v1 | 15 | (v2 sudah 24) | - | 24 |
| `params` v1 (larik / kunci) | 17 / ~20 | - | - | 256 / 256 |
| Byte spec/blok figur | 22,9 KB | - | probe 10000 zona = 524 KB | 1 MiB |
| Total elemen larik | 1856 | distribusi penuh 20000 + bin | komposit xy 16 x 2000 | 30000 |

## Verification (probe peninjau diulang)

Probe sesudah: scratchpad `secfix2/probe_secfix2_after.ts` -> `probe_secfix2_after.out` (rc 0, heap terpakai akhir 79 MB, tanpa OOM). Probe peninjau `probe_secfix_b2e.ts` diulang TANPA perubahan -> `secfix2/probe_secfix_b2e_after.out`. `probe_secfix_b2d.ts` memanggil `buildDiagramSvg` langsung (melewati semua gerbang), jadi tidak diulang; padanannya lewat jalur nyata = P2.

| Probe | Sebelum (peninjau, siklus 1) | Sesudah (segar) |
|---|---|---|
| P1 10000 zona, pratinjau inline v2 (`parsePreviewBody`) | skema OK, `zones` 10000 diteruskan ke mesin, `capacityIssues=0` -> akan dirender; mesin: 5000 zona 9,1 s, 10000 zona heap habis (rc 134) | `SCHEMA_INVALID /block/spec/zones maxItems` dalam 2,8 ms (5000: 214 ms termasuk kompilasi ajv pertama; 20000: 4,7 ms). `probe_secfix_b2e.ts` asli: 5000/10000/20000 -> `SCHEMA_INVALID /block/spec/zones maxItems must NOT have more than 24 items` |
| P2 zona TERSIMPAN (melewati skema) | `diagramCapacityIssues(zones 2000) = 0`; `buildFigures` tidak menghitung zona | rute pratinjau: 422 `FIGURE_CAPACITY` `/zones` dalam 15,5 ms; render dokumen penuh `buildFigures`: `svgs=0`, galat job `BY_CONSTRUCTION_FAILED ... /zones zona diagram: 10000 > batas 24` dalam 14,8 ms |
| P3 R09 v1 P-02 3000 titik | `validateSchema("studio.chart/v1")` 0 isu; `chartSvg` (jalur `artifact.ts:185`) 9202 ms, SVG 1,3 MB | buat: 1 isu `/data/points maxItems` dalam 4,7 ms; render: pra-cek `renderArtifactImpl` `BY_CONSTRUCTION_FAILED FIGURE_CAPACITY /data/points` dalam 1,1 ms; uji `secfix2-artifact-render`: tanpa job, < 1 s |
| P4 matriks `values` 200x200 di bawah `rows`/`cols` 10x10 | skema OK, dirender 1028 ms, SVG 7,0 MB | skema OK (v2 200x200 sah), pra-cek 422 `FIGURE_CAPACITY /data/values` "sel matriks (isi values / baris x kolom): 40000 > batas 5000" dalam 12,3 ms |

Bukti lain:

- Uji penelusuran skema MERAH dulu (sebelum suntingan skema; `secfix2/walk_red.out`): `Tests 14 failed | 1 passed (15)`. Larik tanpa `maxItems` yang ditemukan (43): chart v1 `ChartData` semua bentuk (`points` x3, `categories`, `series`, `series[].values`, `rows`, `cols`, `values`, `values[]`, `items`, `nodes`, `links`, `groups`, `groups[].values`, `tiles`, `flows`, `dots`, `sets`, `overlaps`, `overlaps[].sets`), `ChartComposite.panels`, `common/v1 ParamValue`; diagram v1 `sources`, `nodes`, `edges`, `zones`, `zones[].members`, `legend`, `notes`; common v1 `ParaFormat.tabs`, `Inline.runs`, `SourceLine.provenance`; v2 `ChartDataV2 overlaps[].sets`, `DiagramSpecV2` `sources`/`zones`/`members`/`legend`/`notes`, `CaptionV2.runs`, `SourceV2.runs`, `SourceV2.provenance`, `InlineV2.runs`. String tanpa `maxLength` (11): `ChartData.shape` v1/v2, `intervals start/end` v1/v2, `class.lane` v1/v2, `ParamValue`, `accent.point` (spec + panel). Isi terbuka (6): `params` v1 (spec + panel) tanpa `maxProperties`, `ParamValue`, `x` (panel v1, blok chart/diagram dok v1). Sesudah: hijau 15/15.
- Uji R09 MERAH dulu (cek di `renderArtifactImpl` dilepas sementara lalu dipulihkan, `cmp` sama): `Tests 2 failed | 1 passed (3)` (`secfix2/artifact_red.out`); sesudah: 3/3.
- `secfix2-figure-bounds.test.ts` ditulis bersama implementasi (tidak dijalankan merah terpisah); perilaku "sebelum" dibuktikan oleh probe peninjau di atas.

## Test Results (segar, 2026-11-02)

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | rc 0, 0 keluaran | sesudah semua suntingan |
| Lint | `npx eslint` pada 14 berkas tersentuh (5 skema + `figure-bounds.ts`, `figure-limits.ts`, `artifact.ts`, `figures.ts`, rute `_lib/figure.ts`, `_lib/limits.ts`, `route.ts`, 3 uji baru) | rc 0, 0 masalah | |
| Uji penelusuran skema (merah) | `npx vitest run tests/unit/studio/contract/secfix2-schema-walk.test.ts` sebelum suntingan skema | `Tests 14 failed / 1 passed (15)` | daftar larik/string/isi terbuka di Verification |
| Uji R09 (merah) | `npx vitest run tests/unit/studio/api/secfix2-artifact-render.test.ts` dengan cek dilepas sementara | `Tests 2 failed / 1 passed (3)` | dipulihkan, `cmp` sama |
| Uji baru + manifest SVG bersih | `npx vitest run tests/unit/studio/figures/clean-svg-manifest.test.ts tests/unit/studio/contract/secfix2-schema-walk.test.ts tests/unit/studio/contract/secfix2-figure-bounds.test.ts tests/unit/studio/api/secfix2-artifact-render.test.ts` | `Test Files 4 passed (4)`, `Tests 43 passed (43)` | mesin (`src/lib/studio/engine/**`) tidak disunting |
| Studio penuh | `npx vitest run tests/unit/studio` | `Test Files 196 passed (196)`, `Tests 3920 passed / 1 skipped (3921)`, 213 s, rc 0 | termasuk uji siklus 1 (`secfix-*`), klasifikasi `forbidden.ts`, manifest SVG bersih |
| Konversi benchmark | `npx tsx --tsconfig tsconfig.json benchmark/extract/convert_v2.ts --check` | rc 0; `SAME` doc.v2.json, template.v2.json, datum-manual-000.preset.json | |
| Pindai fixture | dalam `secfix2-figure-bounds.test.ts` | 0 pelanggaran (skema v1/v2 `maxItems`/`maxLength`/`maxProperties` + cek kapasitas + byte blok) | direktori: `tests/parity/fixtures`, `benchmark` (seluruhnya), `tests/perf`, `tests/fixtures`, `prisma`, `tests/unit/studio`, `tests/e2e`, `scripts/studio`; plus `chartTemplate` 76 kode, `diagramTemplate` semua keluarga, `SAMPLE_DOCUMENT` |

## Per temuan

| ID | Status | Ringkas |
|---|---|---|
| N-2 (High) | **fixed** | Semua larik figur di skema v1 (chart, diagram, blok chart/diagram dok v1) dan v2 (blok figur) ber-`maxItems`, string ber-`maxLength`, dikunci uji penelusuran; cek kapasitas menghitung zona/anggota/legenda/catatan/sumber + batas generik setiap larik, panjang teks, byte. Probe 10000 zona: 400 skema 2,8 ms (inline) / 422 15 ms (tersimpan), tanpa OOM |
| N-1 (Medium) | **fixed** (render) / bounded (pembuatan) | `renderArtifactImpl` pra-cek sebelum job; artefak terbungkus HTML dicek sebelum mesin. Pembuatan R09 (`prepareArtifact` -> `validateSchema` v1) kini dibatasi `maxItems`/`maxLength` v1. Batas produk/total (sel matriks, total sumber, byte) tidak dicek saat pembuatan karena `artifacts/_lib/prepare.ts` di luar lingkup tulis; artefak seperti itu ditolak 422 saat render |
| N-3 (Low) | **fixed** | sel = maks(isi `values`, `rows` x `cols`) <= 5000; tiap baris `values` <= 200. Probe B3b: 422 12 ms (sebelumnya 1,03 s, 7 MB) |

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Batas produk/total tidak dicek saat PEMBUATAN artefak R09 | 0 (di luar lingkup tulis) | `src/app/api/studio/artifacts/_lib/prepare.ts` milik baris lain | Skema v1 berbatas menahan larik; produk (sel matriks dari `values`, total teks sumber, byte) ditolak di render (422 sebelum job). Saran: panggil `figureCapacityIssuesFor` di `prepareArtifact` | Tidak |
| Artefak HTML ber-sumber artefak dicek di dalam job, bukan sebelum job | 0 | gerbang pra-job `gateHtmlArtifact` tidak membaca artefak terbungkus (juga dipakai `prepareArtifact`) | Mesin tidak dipanggil; job berakhir galat `BY_CONSTRUCTION_FAILED` | Tidak |
| Mesin tetap sinkron; biaya terburuk pada batas | 0 | sama dengan siklus 1 | Terburuk terukur pada batas: graph 24 simpul ~1,5 s (siklus 1), swimlane 24 simpul x label 300 1,29 s, total sumber 1000 0,2-0,4 s, data chart 200 karakter <= 29 ms | Tidak |
| Batas judul/sumber/catatan CHART (generik 2000 karakter) hanya diukur pada P-02 (judul 5 ms, sumber 1 ms, catatan 132 ms) | 0 | waktu | Teks data chart (yang paling mahal) dibatasi 200 dan diukur pada 46 fixture | Tidak |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| 5 | Satu sumber batas: skema kontrak tidak boleh mengimpor dari `services/` | `FIGURE_BOUNDS` di `contract/schema/figure-bounds.ts`; `figure-limits.ts` mengimpornya. Literal `maxItems` v2 dari siklus 1 dibiarkan (nilai sama, dikunci uji `secfix-chart-maxitems`) |
| 5 | `runs`/`tabs` di `InlineV2`/`CaptionV2`/`SourceV2` (v2) dan `Inline`/`Caption`/`SourceLine`/`ParaFormat` (v1) dipakai bersama paragraf/tabel | Dibatasi HANYA pada blok figur lewat `$ref` + saudara (`type`/`properties`/`additionalProperties`) JSON Schema 2020-12; definisi bersama dan nama `$defs` (klasifikasi `forbidden.ts`) tidak berubah. Paragraf/tabel tidak terpengaruh |
| 5 | `params` chart v1 merujuk `ParamValue` bersama (juga dipakai templat/override dokumen) | `ChartParamValue` lokal di skema chart (bentuk sama, berbatas, rekursif); `ParamValue` common/v1 tidak berubah |
| 5 | Isi terbuka yang sengaja diizinkan | `x` chart v1 (spec + panel) dan `x` blok chart/diagram dok v1: metadata yang tidak dibaca mesin; dicakup batas byte (spec 1 MiB; blok 1 MiB di rute pratinjau dan `buildFigures`). Dicatat di `ALLOW_OPEN` uji penelusuran beserta alasannya |
| 6 | Perubahan perilaku: judul diagram = teks caption blok v2; caption diagram > 300 karakter, total teks sumber diagram > 1000 karakter, atau string data chart > 200 karakter pada spec TERSIMPAN kini 422 `FIGURE_CAPACITY` | Diukur super-linear (lihat Dasar batas). Tidak ada fixture/seed yang terkena (maks <= 150 karakter). Caption v2 tetap boleh sampai 20000 karakter di skema (dipakai bersama tabel), jadi penolakan terjadi di pratinjau/render, bukan di ingest. Perlu diketahui controller/Hermes |
| 6 | Batas total elemen 30000 (bukan 25000) | 25000 akan memberi isu ganda pada uji siklus 1 (5 grup x 5000 nilai harus satu pesan "total nilai distribusi"); 30000 tetap menolak komposit xy 16 x 2000 |
| 6 | `CapacityIssue.keyword` diperluas: `maxItems` / `maxLength` / `maxBytes` / `maxDepth` | Konsumen hanya meneruskan larik `issues` ke `details` 422; tidak ada pencocokan nilai keyword |
| 9 | Pindai fixture: instruksi "perluas uji pindai yang ada" vs lingkup tulis hanya uji baru `secfix2-*` | Uji siklus 1 dibiarkan; pindai yang diperluas ada di `secfix2-figure-bounds.test.ts` (direktori lebih luas, validasi skema v1/v2 + kapasitas + byte, templat UI, dokumen contoh) |

## Next Steps

- Review recommended (lingkup: `contract/schema/{figure-bounds,chart,diagram,doc}.schema.ts`, `contract/schema/v2/common.schema.ts`, `services/render/{figure-limits,artifact,figures}.ts`, rute pratinjau `_lib/figure.ts`): re-cek siklus 2 oleh `security-review` dengan probe `secfix2/probe_secfix2_after.ts` dan `probe_secfix_b2e.ts`.
- Opsional (baris lain): `figureCapacityIssuesFor` di `artifacts/_lib/prepare.ts` agar artefak di atas batas produk ditolak saat dibuat.
