---
task_id: FIX-X
task_slug: doc_artifact_studio
row: FIX-X (loop perbaikan siklus 2; D-271 butir a + c)
date: 2026-10-23
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/05_structural_sections_blueprint.md
status: needs-review
---

# Catatan coder-execution FIX-X: gerbang ukuran figur v1 saat ingest, sisa literal HTML 128/166/247, heightMm skema v1, cast specWidth

Status `needs-review`: kode selesai dan terverifikasi (bukti di bawah); satu hal untuk controller: perluasan area ke `services/ingest/v2.ts` yang JUGA diklaim FIX-Y (D-272) (lihat Keputusan 1). Skills: receiving-code-review, dry-run-verify-fix. Klaim di `file_claims.md` (baris FIX-X + perluasan). Semua suntingan kode ditulis atomik (berkas sementara lalu rename, skrip scratch `%TEMP%/fxx/apply.mjs`); cadangan pra-suntingan `%TEMP%/fxx/backup/`.

## Berkas

| Berkas | Perubahan |
|---|---|
| `services/ingest/by-construction.ts` | (a)+(c) BARU `v1FigureSizeIssues(doc, params, ptr)`: chart `spec.widthMm` anggota `grid.allowedFigureWidthsMm` (G2), chart `spec.heightMm` + `spec.composite.panels[].spec.heightMm` dalam (0, `grid.textBlockHeightMm`] (DATUM-33), diagram `spec.width_mm` anggota himpunan yang sama (P1-width_mm). Batas via `figureLimits` (nilai turunan templat; kunci absen = bawaan registri, pola FIX-FIG keputusan 3). Isu `keyword: "byConstruction"`, `message: "<checkId>: ..."`, `checkId` = bentuk penahan `runGate`. Rujukan artefak dan raster `image` tidak dinilai |
| `services/ingest/v2.ts` (perluasan) | `ingestDocV1Adapted`: panggil `v1FigureSizeIssues` sesudah `pinTemplate`, SEBELUM `adaptV1` -> `ctx.reject("BY_CONSTRUCTION_FAILED", "<n> pelanggaran by-construction", issues)` (dryRun = `valid:false`, selain itu 422; pesan = `byConstructionError`). 1 impor + 3 baris |
| `engine/html/blocks/text.ts:313` | (b) BARU `requiredParamMm(ctx, block, keys, what)` (log error + `BY_CONSTRUCTION_FAILED`); Datum Rule bab = `grid.textColumnMm` (sama dengan DOCX `structure.ts` requiredNum) |
| `engine/html/blocks/wrapper.ts:274,422` | (b) Datum Rule sampul/pembatas bagian = `cover.datumRule.widthMm` lalu `grid.fullSpanMm` (sama dengan DOCX `datumRuleWidthMm` dan HTML device); absen = galat. Label butir `"Datum Rule 166 mm"` TETAP: kosakata registri `cover.elementOrder` (`params/page.ts:359`, `registry/sections.ts:35`, DOCX `wrapper/pages.ts`), bukan nilai |
| `engine/html/base/params.ts` | (b) `GRID_FALLBACK` tanpa `text: 128` dan `textBlock: 247`; BARU `requiredGrid` (absen = `BY_CONSTRUCTION_FAILED`). Cadangan lain (inner 24, gutter 6, rail 32, outer 20, top 26, subcolumns 12) bukan literal lebar/tinggi figur A4, tidak disentuh |
| `contract/schema/chart.schema.ts:31` | (c) `heightMm` `{ type: number, exclusiveMinimum: 0 }` (tanpa `maximum: 247`) |
| `services/compose/blocks.ts` | (d) `specWidth<T>` dan dua cast dihapus (`width_mm: widthMm`, `widthMm`; tipe kontrak `number` sejak FIX-W) |

## Bukti (segar, 2026-10-23, diulang sesudah suntingan FIX-Y di v2.ts)

- Baseline sebelum: probe `%TEMP%/fxx/probe0.ts` v1 `doc_terbit_report` chart `widthMm` 150, A4, dryRun USER -> `valid true []`, `stripped.widthMm 6` (adaptor membuang lebar v1 diam-diam; gerbang snapshot tidak melihatnya).
- Probe gerbang `%TEMP%/fxx/probe1.ts` (templat luring `resolveProfileInMemory` kanonik; A4 [128,166]/247, A5 [66,104]/160, A3 [215,253]/370), FAIL 0:
  - A4 chart `spec.widthMm` 150 -> dryRun `valid:false`, isu `{"pointer":"/document/chapters/0/sections/0/blocks/2/spec/widthMm","keyword":"byConstruction","message":"G2: (tanpa nomor) — lebar 150 mm bukan 128 mm maupun 166 mm (grid.allowedFigureWidthsMm templat)","checkId":"G2"}`; bukan dryRun -> `StudioEngineError` `BY_CONSTRUCTION_FAILED` "1 pelanggaran by-construction" (dilempar sebelum penyimpanan).
  - A4 diagram `width_mm` 150 -> 2x `P1-width_mm`; A4 chart `heightMm` 250 -> `DATUM-33 ... di luar (0, 247] mm`; 247 -> lolos.
  - A5 lebar 104 (chart, diagram, lembar simbol) -> `valid true`, 0 isu; A5 lebar 128 -> G2 + 2x P1-width_mm "bukan 66 mm maupun 104 mm".
  - Skema chart v1 `heightMm` 300 -> 0 isu heightMm; 0 -> ditolak. A3 (blok 370) `heightMm` 300 -> tanpa DATUM-33, valid.
  - Kontrol: fixture A4 asli valid, 0 isu. `check_doc_fixtures.ts`: 22/22 lolos (v1 4, v2 4).
- HTML render probe (`render_cli.ts --formats html`, v2 `doc_terbit_report`): A5 (profil `page.size: A5`) Datum Rule `width="66mm"` x4 (bab), `width="104mm"` x3 (sampul/bagian); grep `\b(128|166|247)(\.0+)?(mm|px)?\b` pada HTML A5 = 0 kemunculan; log error 0, BY_CONSTRUCTION 0. A4: `128mm` x4, `166mm` x3 (nilai sama dengan literal lama).
- Probe cadangan `%TEMP%/fxx/probe2.ts`, FAIL 0: `pageGeometry` A4/A5/Letter kolom teks 128/66/133,9 (turunan); tanpa `grid.textColumnMm` -> `BY_CONSTRUCTION_FAILED`; tanpa blok teks + margin bawah -> `BY_CONSTRUCTION_FAILED`; Datum Rule pembungkus tanpa kunci -> galat + log level error.
- Grep literal area (`engine/html/{blocks/text,blocks/wrapper,base/params}.ts`, `chart.schema.ts`, `compose/blocks.ts`, `by-construction.ts`): sisa hanya label registri `"Datum Rule 166 mm"` (2) dan teks komentar (D-166 = nomor keputusan; "A4 128/166" dok).
- DOCX v1 Manual 000: `render_cli.ts --doc benchmark/manual000/doc.json --template benchmark/manual000/template.json --formats docx` -> `53485ebc1eddd145ee6b67d8f2c68fbec040eae8b3c8ef6cf4e2f4f0c3969db6` (tetap).
- Run v2 Manual 000 (`run_benchmark.ts --schema v2 --out %TEMP%/fxx/bm`): semua langkah OK; BM1 PASS 100 % (4544/4544); BM2 PASS 101/102; BM3 FAIL 6/102; BM4 FAIL 0,7864 (= FIX-W / fixfig official2).
- `npx tsc --noEmit --incremental false -p tsconfig.json`: exit 0, 0 `error TS`.
- `npx eslint` 7 berkas (area + v2.ts): exit 0.
- `npx vitest run tests/unit/studio/api/ tests/unit/studio/api-structure tests/unit/studio/structure`: 25 berkas, 1035/1035 lulus.
- Tambahan `renderers engine-core fix1 figures security docx-fonts-*`: 21 gagal / 910 lulus = 20 baseline FIX-W (fix1 x14, diagram-bad-cases x4, asset-bytes, docx-determinism) + `chart-smoke` "130 ParamDef" (nyata 133 = pin FIX-A IP-59 registri chart, bukan baris ini). 0 kegagalan baru dari FIX-X.

## Keputusan / catatan untuk controller

| Butir | Keputusan / catatan |
|---|---|
| 1. Perluasan `ingest/v2.ts` + tabrakan FIX-Y | Lebar/tinggi v1 DIBUANG adaptor SR-09 sebelum gerbang snapshot (`stripped.widthMm`), jadi cek di `evaluateByConstruction` tidak dapat melihatnya; titik panggil wajib di `ingestDocV1Adapted` (sebelum `adaptV1`). FIX-Y (D-272) mengklaim `v2.ts` (baris klaim 952, `pinTemplate/V2Options`) dan menyunting berkas yang sama sesudah suntingan FIX-X; hunk terpisah, suntingan FIX-X utuh (grep `v1FigureSizeIssues` = 2), tsc 0 dan probe diulang sesudahnya. Ini pelanggaran satu-penulis oleh FIX-X (klaim perluasan ditambahkan sesudah klaim FIX-Y): mohon controller menetapkan FIX-Y pemilik akhir `v2.ts` dan meninjau hunk FIX-X (1 impor + 3 baris; tidak disentuh lagi) |
| 2. Lingkup cek | Medan spec v1 yang ditolak mesin saat render: chart widthMm (G2) / heightMm termasuk panel komposit (DATUM-33), diagram width_mm (P1-width_mm). Lebar tingkat blok v1 (`block.widthMm`, mesin DOCX hanya warn DATUM-31) dan `image` (raster K-2) tidak dinilai. Tidak diturunkan D-34 (cek terjadi sebelum gerbang kebijakan; mesin menolak spec yang sama tanpa pengecualian) |
| 3. Titik lain belum tercakup | (i) jalur `ingestDocumentV1Legacy` (hanya harness tepercaya `legacyV1`, `ingest/index.ts`) tetap mengandalkan mesin saat render; (ii) artefak R09 (`app/api/studio/artifacts/_lib/prepare.ts` `checkChart`) tidak mengetahui templat saat kirim; lebar non-anggota ditolak saat render artefak. Di luar area, tidak disentuh |
| 4. Label `"Datum Rule 166 mm"` | Kosakata registri `cover.elementOrder`; mengganti nama memutus templat tersimpan. Tidak diubah |

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Penulis ganda `ingest/v2.ts` (FIX-X + FIX-Y) | 0 (bukan perbaikan kode) | klaim FIX-Y lebih dulu; perluasan FIX-X dibutuhkan karena adaptor membuang lebar v1 | dilaporkan ke controller | tidak (hunk terpisah, terverifikasi) |

## Next Steps

- Controller: putuskan kepemilikan `v2.ts` (butir 1); butir 3 (legacy + R09) ke pemilik masing-masing bila diinginkan.
