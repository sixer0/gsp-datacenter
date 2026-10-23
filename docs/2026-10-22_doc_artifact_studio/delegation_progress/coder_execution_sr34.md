# coder-execution SR-34: runner benchmark v2

Status: complete (gerbang ringan D-133). Skills: backend-execution, dry-run-verify-fix.

Berkas (area `benchmark/harness/run/**`): `lib/config.ts`, `lib/inputs.ts`, `lib/pipeline.ts`, `lib/report.ts`, `run_benchmark.ts`, `selftest_verdict.ts`, `README.md` (ubah); `lib/schema.ts` (baru). Klaim di `file_claims.md` (prefiks SR-34).

Perilaku:
- `--schema auto|v1|v2` (bawaan auto). auto = `doc.v2.json` + `template.v2.json` bila KEDUA ada; selain itu jatuh ke v1 dengan PERINGATAN (stderr lewat RunLog, kode log `SCHEMA_V2_FALLBACK_V1`, dry-run, `run_summary.json`, `run_report.md`). v2 tanpa berkas bawaan = UsageError exit 2. v1 = jalur lama.
- `--doc`/`--template` menerima v1 atau v2; versi dideteksi dari isi (`$schema` doc; `schema: "studio.template/v2"` templat). `--schema v1|v2` + isi beda versi = FATAL exit 2; auto + versi campuran = peringatan.
- Ringkasan `s97.run-summary/v3` = v2 + `inputSchema` (requested, defaults, doc/template + versi, asal, fallbackWarning, notReady); kepala `run_report.md` mencatat skema.
- Seam v2 belum ada -> ingest NOT_READY (exit 1, `SCHEMA_V2_NOT_READY`), tidak pernah diam-diam jalur v1: skema `studio.doc/v2` di `STUDIO_JSON_SCHEMAS` (SR-04/SR-12) dan ekspor `loadResolvedTemplateV2File` services/templates (SR-07).
- Substitusi figur v2: hanya medan isi (`id`, `caption`, `source`, `keyRow`, `spec`/`dialect`), tanpa `x`/tampilan; figur dipetakan lewat pid blok.

Bukti (2026-10-23):
- `npx tsc --noEmit -p tsconfig.json`: exit 0, 0 `error TS` seluruh repo.
- `npx eslint benchmark/harness/run`: exit 0.
- `npx tsx benchmark/harness/run/selftest_verdict.ts`: 21/21 lulus (13 lama + 8 SR-34), exit 0.
- `--help` exit 0, memuat `--schema auto|v1|v2`, `benchmark/manual000/doc.v2.json`, `benchmark/manual000/template.v2.json`, `studio.doc/v2`, `studio.template/v2`.
- `--dry-run` (auto, berkas v2 belum ada): exit 0, "skema doc studio.doc/v1, templat template-profile/v1 (--schema auto; berkas bawaan v1)" + PERINGATAN jatuh ke v1; aset 79/79, skema v1 VALID.
- v2 sintetis di scratchpad (`--schema v2 --doc/--template`): dry-run exit 1 dengan 2 NOT_READY v2; run `--skip-pdf --skip-compare` exit 1, ingest NOT_READY, summary `s97.run-summary/v3` dengan `inputSchema` v2.
- Penjaga beda versi: `--schema v1 --doc <doc v2>` -> FATAL, exit 2.
- Regresi v1 `--skip-pdf --skip-compare`: figur mesin 15, raster 37, hilang 0; load/ingest/figures/docx/lint OK (INCOMPLETE exit 1 karena BM tidak dijalankan; sama dengan FIX-5).

Permintaan (`file_requests.md`, 3 baris SR-34): SR-07 ekspor `loadResolvedTemplateV2File`; SR-04/SR-12 opsi ingest + pid di norm/v2; SR-32 bentuk blok figur di doc.v2.json.

Keputusan untuk controller:
- Nama seam pemuat templat v2 ditetapkan runner (`loadResolvedTemplateV2File`); controller dapat menggantinya bila SR-07 memilih nama lain (satu konstanta di `lib/schema.ts`).
- Bentuk chart v2 (`code`+`data`) belum dipetakan: runner membawa spec S94 apa adanya di `spec`; menunggu kontrak SR-04/SR-32.
- Run v2 nyata baru mungkin setelah SR-04, SR-07, SR-12, SR-32 (dan SR-16 untuk perakitan); SR-51 bergantung pada ini.

Temuan: tidak ada di luar area. Review direkomendasikan (lingkup `benchmark/harness/run/**`) di fase akhir.
