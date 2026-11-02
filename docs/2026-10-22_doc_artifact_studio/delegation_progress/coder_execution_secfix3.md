---
task_id: SEC-FIX3
task_slug: doc_artifact_studio
row: SEC-FIX3 (temuan Low siklus 2: N-4, N-5; pindai baca-saja DB DEV v2.1)
date: 2026-11-03
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/decisions/decisions.md (D-508); verification/11_figure_security_review.md bagian "Siklus 2"
status: complete
---

# Laporan Implementasi: SEC-FIX3 (N-4, N-5, pindai DB DEV)

Skill dimuat: `tdd` (uji merah lebih dulu; seam = `chartCapacityIssues`, validator v2 bersama), `verification-before-completion` (disiplin bukti segar).

Laporan ini ditulis bertahap (append). Bukti mentah di scratchpad sesi: `.../scratchpad/secfix3/`.

## Log bertahap

### N-4 (selesai)

- Uji merah lebih dulu: `tests/unit/studio/contract/secfix3-table-rows.test.ts`. Perintah: `npx vitest run tests/unit/studio/contract/secfix3-table-rows.test.ts`. Hasil merah: `Tests  4 failed | 1 passed (5)` (170x170 `tableRows` lolos, baris > 200 lolos, kepala lebar lolos, panel komposit lolos; hanya kasus sah yang lulus). Bukti: `scratchpad/secfix3/n4_red.txt`.
- Perbaikan: `figure-limits.ts` `tableParamsInto` dipanggil untuk `spec.params` dan `composite.panels[].spec.params`. Baris `tableRows` <= `items` (200), kolom per baris <= 200, sel = baris x maks(kolom `tableHead`, isi baris terlebar) <= `matrixCells` (5000). Nilainya dari `FIGURE_BOUNDS`, tanpa angka baru.
- Hijau: `Tests  5 passed (5)`. Bukti: `scratchpad/secfix3/n4_green.txt`.
- Petunjuk params tabular lain: sudah ditelusuri `CHART_DATA_HINT_KEYS` (`engine/chart/core/params.ts:68-84`). Hanya `tableRows` yang berbentuk 2-D. Kisi K-07/K-08 dibatasi mesin pada 1..40 (`family-k2/common.ts:157`), dan P-12 `grid` pada 1..6 (`family-p2/small-multiples.ts:39`). Petunjuk lain berupa larik datar yang sudah dibatasi `paramItems` 256.

### N-5 (selesai)

- Lokasi pemeriksaan: setiap jalur kiriman v2 memakai pola `v(data) ? [] : classifySchemaV2Errors(..., v.errors)` atas validator ajv bersama, yaitu `ingest/validate.ts` `studioValidator` dan `getValidator`. Pemanggilnya: R12/R13 `chapters/_shared/submit-kit.ts:61`, R08 `validate/_shared/v2-kit.ts:47`, R16/R06 `revisions/v2/body.ts:84`, R14 `structure/_lib/patch-body.ts:74`, importer `import/validate.ts:21`, dan R04 `validateV2Against`. Kait di satu titik itu (lingkup tulis `ingest/**`) menjangkau semua jalur tanpa menyunting route atau `revisions/**`.
- Uji merah lebih dulu: `tests/unit/studio/contract/secfix3-figure-text.test.ts`. Hasil merah: `Tests  6 failed | 2 passed (8)`. Yang lulus hanya kasus tabel dan `artifactId` (perilaku yang memang tidak berubah). Bukti: `scratchpad/secfix3/n5_red.txt`.
- Perbaikan:
  - `contract/schema/v2/figure-text.ts` (baru): `figureTextErrorsV2` menelusuri data v2 apa pun (dokumen, kiriman bab/slot, bab, blok), meniru pemetaan compose (`compose/blocks.ts:391-461`, `diagramSpec:267-286`), dan menilai dengan `FIGURE_BOUNDS` (tanpa angka baru):
    - diagram: caption <= `diagramText.title` 300; source <= `diagramText.source` 1000; total `sources` terkomposisi <= `diagramText.sourcesTotal` 1000;
    - chart: caption/source <= `stringChars` 2000; data `steps` (juga panel) memakai batas diagram;
    - `artifactId` dilewati.
    - `figureInlinePlain` = compose `inlineV2Plain`, dikunci uji paritas.
  - `contract/schema/v2/forbidden.ts` `classifySchemaV2Errors`: keyword semu `figureTextLength` -> issue `keyword: "maxLength"`, `checkId: "FIGURE_TEXT"`, pesan ber-petunjuk, mis. "caption diagram menjadi judul gambar: 301 karakter > batas 300; persingkat caption diagram maks 300 karakter".
  - `contract/index.ts`: ekspor modul baru.
  - `services/ingest/validate.ts`: `withFigureText` membungkus validator rujukan v2 (`studio.doc|chapter|slot/v2`, `common/v2`). Galat semu ditambahkan sesudah ajv, juga bila ajv gagal, sehingga semua perbaikan tampil sekaligus. Caption tabel tidak tersentuh: hanya blok `type` chart/diagram yang dinilai.
- Hijau: `Test Files  2 passed (2)`, `Tests  14 passed (14)` (N-4 + N-5, termasuk uji paritas teks polos). Bukti: `scratchpad/secfix3/n5_green.txt`.
- Fixture/seed: pindai scratchpad `secfix3/fixture_scan.ts` -> `fixture_scan.out`. Hasil: `json files with chart/diagram parsed: 1621; figure type occurrences: 286; hits: 0; SAMPLE_DOCUMENT hits: 0`. Seed TS dengan blok figur sebaris (`scripts/studio/mcp/smoke-figures.ts`) memiliki baris caption <= 226 karakter seluruhnya. Tidak ada fixture/seed nyata yang kini ditolak.
- Dampak perilaku: dokumen tersimpan tidak diperiksa ulang pada PATCH yang tidak menyentuh blok itu, karena validator hanya menilai fragmen yang dikirim. Kiriman ulang bab yang memuat caption terlalu panjang kini ditolak 400. Pratinjau figur (`figures/preview`, `validateBlockV2`) kini menolak lebih awal: 400 menggantikan 422 `FIGURE_CAPACITY`.

### Pindai baca-saja DB DEV v2.1 (selesai)

- Skrip: `scripts/studio/scan-figure-limits.ts`.
  - Memakai klien Prisma yang ada dan fungsi cek yang sama dengan render: `figureCapacityIssuesFor` dan `figureBytesIssues` atas blok figur `snapshot.blocks` revisi terkini (rujukan `artifactId` diselesaikan ke spec artefak). Juga `figureTextErrorsV2` atas `snapshot.source` v2, dan cek kapasitas atas artefak CHART/DIAGRAM.
  - Pengaman:
    - nama basis data dari DATABASE_URL diperiksa SEBELUM koneksi;
    - `current_database()` diperiksa lagi sesudah koneksi;
    - semua kueri berjalan dalam transaksi `SET TRANSACTION READ ONLY`, hanya SELECT;
    - URL dan rahasia tidak dicetak; galat hanya mencetak nama kelas dan kode.
- Uji negatif pengaman: `DATABASE_URL` palsu bernama `gsp_agent_hq` (kredensial palsu, tanpa koneksi) -> `exit=2`, `ABORT: basis data target bukan gsp_agent_hq_v21 (nama dari koneksi: gsp_agent_hq); tidak ada koneksi dibuka.` Bukti: `scratchpad/secfix3/scan_guard_neg.txt`.
- Run nyata, sekali: `env -u DATABASE_URL npx tsx scripts/studio/scan-figure-limits.ts` (memakai `.env` repo, tidak dicetak). `exit=0`. Bukti: `scratchpad/secfix3/scan_dev.txt`.
  - `database confirmed: gsp_agent_hq_v21 (transaction READ ONLY)`
  - Dipindai: 84 dokumen, 6 blok figur di revisi terkini, 82 sumber v2, 0 artefak CHART/DIAGRAM, 0 rujukan artefak tak terselesaikan.
  - Melampaui batas: **0 temuan** (blok 0, teks sumber v2 0, artefak 0). `documentIds: []`, `artifactIds: []`.
- DB produksi `gsp_agent_hq` tidak disentuh. Tidak ada tulis, migrasi, atau `db push`.

### Dokumentasi (selesai)

- `docs/STUDIO-AGENT-GUIDE.md` §4.1.1: butir batas kapasitas diperbarui (D-508). Tambahan: tabel P-15 `params.tableRows` maks 200 baris / 5.000 sel. Teks figur v2 dinilai saat kirim: caption diagram (juga chart `steps`) maks 300, sumber diagram maks 1.000, caption/sumber chart maks 2.000, galat `400 SCHEMA_INVALID` `checkId: "FIGURE_TEXT"` ber-pointer. Caption tabel tetap maks 20.000.

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | `tsc_exit=0`, 0 baris galat | tsconfig mencakup `**/*.ts` (termasuk `scripts/` dan `tests/`). Bukti `scratchpad/secfix3/tsc.txt` |
| Lint | `npx eslint` atas 8 berkas tersentuh (`figure-limits.ts`, `figure-text.ts`, `forbidden.ts`, `contract/index.ts`, `ingest/validate.ts`, `scan-figure-limits.ts`, 2 uji `secfix3-*`) | `eslint_exit=0`, tanpa keluaran | Bukti `scratchpad/secfix3/eslint.txt` |
| Benchmark | `npx tsx benchmark/extract/convert_v2.ts --check` | `convert_exit=0`; 3 baris `SAME` (doc.v2, template.v2, preset), 0 DIFF | Bukti `scratchpad/secfix3/convert_v2.txt` |
| Uji baru | `npx vitest run tests/unit/studio/contract/secfix3-figure-text.test.ts tests/unit/studio/contract/secfix3-table-rows.test.ts` | `Test Files 2 passed (2)`, `Tests 14 passed (14)` | Merah lebih dulu: N-4 4 gagal / 1 lulus, N-5 6 gagal / 2 lulus |
| Unit studio penuh | `npx vitest run tests/unit/studio` | `Test Files  199 passed (199)`, `Tests  3936 passed \| 1 skipped (3937)`, `vitest_exit=0` (193,7 s) | Mencakup `figures/clean-svg-manifest.test.ts`, dijalankan juga terpisah: `Tests 4 passed (4)` (mesin tidak disunting), `secfix-*`, `secfix2-*`, MCP. Bukti `scratchpad/secfix3/vitest_studio.txt` |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| `src/lib/studio/services/render/figure-limits.ts` | modify | N-4: `tableParamsInto` untuk `params.tableRows` spec dan panel komposit (baris <= 200, kolom per baris <= 200, sel <= 5000) |
| `src/lib/studio/contract/schema/v2/figure-text.ts` | add | N-5: `figureTextErrorsV2`, `figureInlinePlain`, `FIGURE_TEXT_KEYWORD`/`FIGURE_TEXT_CHECK_ID`; batas dari `FIGURE_BOUNDS` |
| `src/lib/studio/contract/schema/v2/forbidden.ts` | modify | `classifySchemaV2Errors`: keyword semu -> `checkId: "FIGURE_TEXT"`, `keyword: "maxLength"`; docstring diperbarui |
| `src/lib/studio/contract/index.ts` | modify | ekspor `schema/v2/figure-text` |
| `src/lib/studio/services/ingest/validate.ts` | modify | `withFigureText` membungkus validator v2 (`studioValidator` dan `getValidator`; doc/chapter/slot v2 dan `common/v2`) |
| `tests/unit/studio/contract/secfix3-table-rows.test.ts` | add | 5 uji N-4 |
| `tests/unit/studio/contract/secfix3-figure-text.test.ts` | add | 9 uji N-5 (R12, tabel, R08, R04, R16 blok/bab, sumber, chart/steps, artifactId, paritas teks polos) |
| `scripts/studio/scan-figure-limits.ts` | add | pindai baca-saja DB DEV v2.1 (pengaman nama DB sebelum dan sesudah koneksi, transaksi READ ONLY) |
| `docs/STUDIO-AGENT-GUIDE.md` | modify | butir batas §4.1.1 (D-508) |

## Verification

- N-4: `170x170 lewat tableRows ditolak cepat` -> isu `/params/tableRows` sel 28900 > 5000, < 1 s (uji). Sebelumnya lolos cek kapasitas dan render 56,7 s (review S2.4).
- N-5: caption diagram 301 -> `FIGURE_TEXT` di R12 (`/chapter/sections/0/blocks/0/caption`), R08 (`/spec/...` dan dokumen), R04, dan R16 (`/block/caption`, `/chapter/...`). Caption 300 lolos. Caption tabel 301 dan 5000 lolos (tidak berubah).
- Pindai DB DEV: `gsp_agent_hq_v21` terkonfirmasi; 0 figur melampaui batas.
- `convert_v2 --check` SAME; manifest SVG bersih hijau; tsc 0; eslint 0.

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| - | - | - | Tidak ada | Tidak |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| N-5 lokasi | Semua jalur kiriman memvalidasi lewat `v(data) ? [] : classifySchemaV2Errors(...)` di route dan di `revisions/**`, yang berada di luar lingkup tulis | Kait di validator bersama `ingest/validate.ts` (galat semu bentuk ajv) + pemeta kontrak. Satu titik menjangkau R04/R08/R12/R13/R16/R06/R14/importer tanpa menyunting route. Skema JSON tidak diubah (tanpa keyword kustom, sehingga validator luar dan skema terbit tidak terpengaruh) |
| N-5 kode | Gerbang by-construction (422) dipertimbangkan, tetapi menilai seluruh dokumen tergabung (figur lama akan memblok PATCH lain) dan tidak memberi pointer badan | Dipilih 400 `SCHEMA_INVALID` `FIGURE_TEXT` ber-pointer, sesuai remediasi review S2.4 |
| N-5 cakupan | Chart: caption/sumber menjadi `title`/`source` spec (batas generik 2000); chart `steps` dan panel `steps` memakai batas diagram; rujukan `artifactId` dilewati | Sesuai pemetaan compose; paritas teks polos dikunci uji |
| Perilaku | Pratinjau figur (`validateBlockV2`) kini menolak caption diagram > 300 dengan 400, bukan 422 `FIGURE_CAPACITY` | Lebih awal dan ber-pointer; uji `fig03b`/`secfix-figure-preview` tetap hijau |
| Fixture/seed | Tidak ada fixture/seed nyata yang kini ditolak (1621 JSON, 286 figur, `SAMPLE_DOCUMENT`: 0) | Lanjut tanpa berhenti |

## Next Steps

- Review direkomendasikan (lingkup: `ingest/validate.ts` `withFigureText`, `figure-text.ts`, `figure-limits.ts` `tableParamsInto`) oleh `security-review` / `senior-code-reviewer` untuk re-cek siklus 3.
- Controller mencatat D-508 tuntas di `decisions.md`, bila disetujui.
