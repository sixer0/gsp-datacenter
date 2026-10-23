---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: S03
date: 2026-10-23
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/masterplan/01_specs.md
status: complete
---

# Marker: kontrak Studio mendarat (S03, Gelombang 0)

Sejak berkas ini ada, `src/lib/studio/contract/**` read-only (perubahan lewat `delegation_progress/file_requests.md`). Stub modul menjadi milik baris pengisinya.

## 1. Registri section

Perintah: `npx tsx <scratch>/s03_runtime_check.ts` (impor `src/lib/studio/registry/index.ts`).

```
SECTION_REGISTRY.length = 51 SECTION_REGISTRY_COUNT = 51 groups = {"DOCUMENT":29,"PAGE_DEVICE":7,"CHANNEL":15}
unique keys = 51 unique catalogIds = 51
renderable=false = C01,C02,C03,C04,C05,C06,C07,C08,C09,C10,C11,C12,C13,C14,C15
```

## 2. Berkas (81 = 30 lengkap + 51 stub)

### 2.1 Lengkap (30, §12.1 T08-T37)

| ID | Path |
|---|---|
| T08 | `src/lib/studio/contract/index.ts` |
| T09 | `src/lib/studio/contract/types/common.ts` |
| T10 | `src/lib/studio/contract/types/doc.ts` |
| T11 | `src/lib/studio/contract/types/chart.ts` |
| T12 | `src/lib/studio/contract/types/diagram.ts` |
| T13 | `src/lib/studio/contract/types/image.ts` |
| T14 | `src/lib/studio/contract/types/html.ts` |
| T15 | `src/lib/studio/contract/types/model.ts` |
| T16 | `src/lib/studio/contract/types/params.ts` |
| T17 | `src/lib/studio/contract/types/api.ts` |
| T18 | `src/lib/studio/contract/enums.ts` |
| T19 | `src/lib/studio/contract/schema/common.schema.ts` |
| T20 | `src/lib/studio/contract/schema/doc.schema.ts` |
| T21 | `src/lib/studio/contract/schema/chart.schema.ts` |
| T22 | `src/lib/studio/contract/schema/diagram.schema.ts` |
| T23 | `src/lib/studio/contract/schema/image.schema.ts` |
| T24 | `src/lib/studio/contract/schema/html.schema.ts` |
| T25 | `src/lib/studio/contract/address.ts` |
| T26 | `src/lib/studio/contract/env.ts` |
| T27 | `src/lib/studio/contract/errors.ts` |
| T28 | `src/lib/studio/contract/auth.ts` |
| T29 | `src/lib/studio/contract/engine.ts` |
| T30 | `src/lib/studio/contract/render-env.ts` |
| T31 | `src/lib/studio/contract/ui.ts` |
| T32 | `src/lib/studio/contract/dispatch.ts` |
| T33 | `src/lib/studio/params/render.ts` |
| T34 | `src/lib/studio/params/index.ts` |
| T35 | `src/lib/studio/registry/sections.ts` |
| T36 | `src/lib/studio/registry/index.ts` |
| T37 | `prisma/migrations/20261022120000_add_studio/migration.sql` |

### 2.2 Stub (51, §12.2)

| ID | Path | Pengisi |
|---|---|---|
| T01 | `src/lib/studio/params/governance-language.ts` | S04 |
| T02 | `src/lib/studio/params/color-type.ts` | S05 |
| T03 | `src/lib/studio/params/page.ts` | S06 |
| T04 | `src/lib/studio/params/apparatus.ts` | S07 |
| T05 | `src/lib/studio/params/figure.ts` | S08 |
| T06 | `src/lib/studio/registry/charts.ts` | S09 |
| T07 | `src/lib/studio/registry/lint.ts` | S10 |
| T38 | `src/lib/studio/engine/tokens/index.ts` | S11 |
| T39 | `src/lib/studio/engine/bind/index.ts` | S12 |
| T40 | `src/lib/studio/engine/docx/package/index.ts` | S14 |
| T41 | `src/lib/studio/engine/docx/fonts/index.ts` | S15 |
| T42 | `src/lib/studio/engine/docx/blocks/index.ts` | S16 |
| T43 | `src/lib/studio/engine/docx/tables/index.ts` | S17 |
| T44 | `src/lib/studio/engine/docx/wrapper/index.ts` | S18 |
| T45 | `src/lib/studio/engine/docx/figures/index.ts` | S19 |
| T46 | `src/lib/studio/engine/docx/assemble/index.ts` | S20 |
| T47 | `src/lib/studio/engine/html/base/index.ts` | S21 |
| T48 | `src/lib/studio/engine/html/blocks/index.ts` | S22 |
| T49 | `src/lib/studio/engine/html/tables/index.ts` | S23 |
| T50 | `src/lib/studio/engine/html/assemble/index.ts` | S24 |
| T51 | `src/lib/studio/engine/browser/index.ts` | S25 |
| T52 | `src/lib/studio/engine/soffice/index.ts` | S92 |
| T53 | `src/lib/studio/engine/diagram/core/index.ts` | S26 |
| T54 | `src/lib/studio/engine/diagram/layout-a/index.ts` | S27 |
| T55 | `src/lib/studio/engine/diagram/layout-b/index.ts` | S28 |
| T56 | `src/lib/studio/engine/diagram/layout-c/index.ts` | S29 |
| T57 | `src/lib/studio/engine/diagram/build/index.ts` | S30 |
| T58 | `src/lib/studio/engine/symbols/index.ts` | S31 |
| T59 | `src/lib/studio/engine/chart/core/index.ts` | S32 |
| T60 | `src/lib/studio/engine/chart/family-p1/index.ts` | S33 |
| T61 | `src/lib/studio/engine/chart/family-p2/index.ts` | S34 |
| T62 | `src/lib/studio/engine/chart/family-h1/index.ts` | S35 |
| T63 | `src/lib/studio/engine/chart/family-h2/index.ts` | S36 |
| T64 | `src/lib/studio/engine/chart/family-k1/index.ts` | S37 |
| T65 | `src/lib/studio/engine/chart/family-k2/index.ts` | S38 |
| T66 | `src/lib/studio/engine/chart/family-w1/index.ts` | S39 |
| T67 | `src/lib/studio/engine/chart/family-w2/index.ts` | S40 |
| T68 | `src/lib/studio/engine/chart/family-s1/index.ts` | S41 |
| T69 | `src/lib/studio/engine/chart/family-s2/index.ts` | S42 |
| T70 | `src/lib/studio/engine/chart/family-g/index.ts` | S43 |
| T71 | `src/lib/studio/engine/lint/scan/index.ts` | S44 |
| T72 | `src/lib/studio/engine/lint/render/index.ts` | S45 |
| T73 | `src/lib/studio/engine/lint/structure/index.ts` | S46 |
| T74 | `src/lib/studio/engine/lint/language/index.ts` | S47 |
| T75 | `src/lib/studio/services/ingest/index.ts` | S48 |
| T76 | `src/lib/studio/services/templates/index.ts` | S49 |
| T77 | `src/lib/studio/services/revisions/index.ts` | S50 |
| T78 | `src/lib/studio/services/render/index.ts` | S51 |
| T79 | `src/lib/studio/services/storage/index.ts` | S52 |
| T80 | `src/lib/studio/services/images/index.ts` | S53 |
| T81 | `src/components/studio/template-preview/index.tsx` | S101 |

Bukti keberadaan: `find src/lib/studio src/components/studio -type f` = 80 berkas, semuanya tidak kosong; ditambah `migration.sql` = 81.

## 3. Migrasi (§2, D-21, D-24 butir 4-5)

- Nama: `prisma/migrations/20261022120000_add_studio/migration.sql`
- sha256: `c5b6b2fcf98bb6f85ac5520764663074874b75e7897a759a6d070f6ae202bc6a` (12521 byte)
- Shadow DB: `gsp_agent_hq_v21_shadow` di localhost:5433 (dibuat `CREATE DATABASE`, dibiarkan ada untuk delta S03-dN).
- Baseline (sebelum sunting schema) = 5 pernyataan drift IlSearchDoc: 4x `DROP INDEX` (`ilsearchdoc_source_idx`, `ilsearchdoc_trgm_body`, `ilsearchdoc_trgm_title`, `ilsearchdoc_tsv_gin`) + `ALTER TABLE "IlSearchDoc" ALTER COLUMN "tsv" DROP DEFAULT`. Penuh = 71 pernyataan; `baseline_subset True`; migrasi = 66 pernyataan.

Langkah 6 (penjaga isi):
```
6a DROP=0 6d CREATE TABLE=9 CREATE TYPE=11 INDEX=32 ALTER=14 nonStudio=0
(REFERENCES ke tabel non-Studio: 0)
```

Langkah 8 `npx prisma migrate deploy`:
```
Datasource "db": PostgreSQL database "gsp_agent_hq_v21", schema "public" at "localhost:5433"
5 migrations found in prisma/migrations
Applying migration `20261022120000_add_studio`
All migrations have been successfully applied.
```

Langkah 9 `npx prisma migrate status`:
```
Datasource "db": PostgreSQL database "gsp_agent_hq_v21", schema "public" at "localhost:5433"
5 migrations found in prisma/migrations
Database schema is up to date!
```

`\dt "Studio"*` = 9 baris: StudioArtifact, StudioBlock, StudioDocument, StudioOutputFile, StudioRenderJob, StudioRevision, StudioSectionType, StudioTemplate, StudioTemplateVersion. `pg_type` enum `Studio%` = 11. Tabel public: 35 -> 44.

Langkah 10: diff ulang setelah deploy (`after.sql`) identik dengan `baseline.sql` (`diff` -> `AFTER_EQUALS_BASELINE`); residu Studio = 0.

Langkah 11: `npx prisma generate` exit 0.

Langkah 12 (hitungan baris sebelum deploy = sesudah status; `diff` -> `COUNTS_IDENTICAL`):
```
AgentRequest 757
HermesTask 2680
IlSearchDoc 18186
WorkerTrace 1488
HermesMemory 878
WebUiUser 9
OrchestrationRecord 681
```

`git diff --numstat prisma/schema.prisma` = `320 0` (aditif murni, CRLF dipertahankan).

## 4. Dependensi npm (§10)

`npm ls ajv fflate playwright-core fast-uri`:
```
+-- ajv@8.20.0
| `-- fast-uri@3.1.8 overridden
+-- eslint@9.39.2 (ajv@6.15.0 bersarang)
+-- fflate@0.8.3
`-- playwright-core@1.62.1
```
Tanggal rilis (`npm view <pkg> time`): ajv 8.20.0 2026-04-24, fflate 0.8.3 2026-05-16, playwright-core 1.62.1 2026-07-30, ajv 6.15.0 (eslint, bersarang) 2026-04-23, fast-uri 3.1.8 2026-09-15, json-schema-traverse 1.0.0 2020-12-13, require-from-string 2.0.2 2018-04-09. `package.json`: ketiganya versi tepat tanpa `^`; `db:migrate` -> `prisma migrate deploy` (F-009).

## 5. tsc

`npx tsc --noEmit -p tsconfig.json 2>&1 | grep "src/lib/studio"` -> kosong (grep exit 1, 0 baris). Total galat repo 21, semuanya pra-ada di luar area Studio (6 berkas: `src/app/orchestration/page.tsx` 9, `src/app/information-library/page.tsx` 5, `src/app/dispatch-kpi/page.tsx` 3, `src/app/api/user-access/route.ts` 2, `src/app/api/user-access/[id]/route.ts` 1, `src/app/api/information-library/propose/route.ts` 1). Tidak diperbaiki (di luar area S03).

`npx eslint src/lib/studio src/components/studio` -> exit 0, tanpa keluaran.

## 6. prisma validate

`npx prisma validate` -> `The schema at prisma\schema.prisma is valid`, exit 0.

## 7. Parameter renderer

```
PARAMS_RENDER.length = 25 RENDER_PARAM_COUNT = 25 CATALOG_PARAM_COUNT = 673 unique ids = 25 all contract/R = true class T with derive = R-13:railColsTw
```

Pemeriksaan tambahan (skrip yang sama): ROLE_KEYS 70, CHART_CODES 76 (58 + 18 DF), STUDIO_ERROR_CODES 36, BLOCK_TYPES 23 (21 + spacer, device), STUDIO_NAV 6; `parseAddress`/`formatAddress` pulang-pergi 16 contoh benar, 9 alamat tak sah ditolak; `dispatchCoverage()` belum terisi docx 31 / html 31 / chart 58 (benar untuk stub); penjaga `STORAGE_ROOT_FORBIDDEN` terpicu bila akar Studio di dalam `SHARED_WORKSPACE` luar `data/`, lolos bila `SHARED_WORKSPACE` = `data/` repo. Skema JSON: keenam skema terkompilasi ajv 2020 dengan `{ strict: true, allErrors: true, discriminator: true, allowUnionTypes: true }`; dokumen contoh lolos, dokumen rusak ditolak berpointer (`/chapters/0/sections/0/blocks/0 oneOf`, `... discriminator`, tabel bersarang kedalaman 2 `additionalProperties`).

## 8. Deviasi dari spesifikasi

| # | Deviasi | Alasan |
|---|---|---|
| 1 | `FrontItem` juga memuat `SpacerBlock` dan `DeviceBlock` | §13 (K-01, K-04, K-10, K-16, K-20) menaruh device/spacer di `front.*.body[]` dan `parts[].body[]`; tanpa ini AC-4 gagal |
| 2 | `studioError` mengembalikan `Response.json` standar (bukan `NextResponse.json`); ditambah `studioErrorFrom(e)` | `errors.ts` dan `env.ts` tetap aman diimpor komponen klien (`next/server` menarik `after`/`connection` server); bentuk kawat identik |
| 3 | `contract/index.ts` tidak mengekspor nilai `auth.ts` dan `dispatch.ts` (hanya `type StudioCaller`) | Keduanya khusus server (next-auth, node:crypto, modul mesin); diimpor dari path-nya |
| 4 | Stub `TemplatePreviewPane` merender placeholder, tidak melempar | Lemparan saat render merusak halaman S58 sebelum S101 |
| 5 | Tipe pendukung yang dirujuk tanda tangan §8.2 tetapi tidak dinamai spesifikasi ditetapkan di kontrak: `ParamIssue`, `RegisterApi`, `AuditFinding`, `DocxPackageInput`, `EmbeddedFontPlan`, `BrowserHandle`, `LayoutMetrics`, `DiagramSheet`, `DiagramBox`, `LayoutResult`, `LayoutFn`, `RoutedEdge`, `ChartCanvas`, `ChartRenderer`, `ChartRendererMap`, `RenderLogEntry`; DTO tambahan di `types/api.ts` (`TemplateDetail`, `TemplateVersionDto`, `CreateTemplateInput`, `CreateTemplateVersionInput`, `TemplateListQuery`, `BlockDto`, `RerenderResult`, `WriteOutputInput`, `StudioOutputFileDto` = alias `OutputFileDto`, dll.) | Tanda tangan §8.2 harus bertipe penuh |
| 6 | Tipe registri (`SectionTypeDef`, `SectionPlan`, `ChartDef`, `LintDef`) tinggal di `contract/types/params.ts`; `sections.ts`/`charts.ts`/`lint.ts` mengekspor ulang | Stub registri milik baris lain; tipe tetap kontrak |
| 7 | Peta dispatcher dibangun malas lewat Proxy hanya-baca | Siklus impor `chart/core` <-> `dispatch` (I22 memakai D01) aman di ESM dan CJS |
| 8 | `env.ts` memakai `process.getBuiltinModule("node:path")` saat dipanggil, bukan impor statis | Konstanta C07-C17 aman untuk klien |
| 9 | Aturan isi tidak di skema: pola nomor dokumen dilonggarkan (`^[0-9A-Za-z][0-9A-Za-z/._-]*$`), `typeCode` `^[A-Z]{2,4}$` (daftar tertutup P3-20 kelas K ditegakkan layanan), judul berakhiran titik dan id diagram `\d+\.\d+` ditegakkan validateSpec/lint; jumlah sel = kolom tetap 422 by-construction. Kedalaman tabel bersarang 1 ditegakkan `$defs` tambahan `CellLeaf`/`RowLeaf`/`TableBlockLeaf`; `$defs` tambahan lain: `Tw`, `HalfPt`, `Eighth`, `ProvenanceMark`, `ParamValue`, `BorderSides`, `Shading`, `TabStop`, `CellParagraph` | Nilai bergantung parameter templat kelas K; skema tetap struktural |
| 10 | `package.json` `overrides: { "fast-uri": "3.1.8" }` | Transitif ajv 8.20.0; npm memilih fast-uri 3.1.9 (rilis 2026-10-19, < 14 hari). 3.1.8 (2026-09-15) `npm audit` 0 kerentanan. Ajv 6 eslint bersarang ikut naik 6.12.6 -> 6.15.0 (2026-04-23) |
| 11 | Registri section: `partDivider.paramRefs` verbatim (`Datum Rule`, `string punggung`); `appendix.paramRefs` disalin dari `chapter` ("sama dengan chapter"); unsur F1-F7 diturunkan dari nama perangkat (katalog tidak punya kolom unsur); C07-C14 unsur "struktur lembar kerja menurut P15-01" | Katalog research/01 §4.2-4.3 tidak memuat medan tersebut |
| 12 | R-17 `borders: "none"`; R-21 warna `B45309` (RS25, research/07:74); R-09/R-10 tanpa margin (diturunkan grid P4G) | Spesifikasi menulis "none"/"amber"/"margin dari grid" tanpa nilai literal |
| 13 | Stub meneruskan argumen ke `new StudioNotImplemented("<modul>", ...args)` (hanya dihitung) | Menghindari peringatan eslint no-unused-vars; bentuk spesifikasi tetap sah |
| 14 | Kode HTTP untuk kode dalam-job: `PDF_ENGINE_UNAVAILABLE` 503, `PDF_CONVERT_FAILED` 500, `RENDER_TIMEOUT` 504, `STORAGE_ROOT_FORBIDDEN` 500 | §6.3 hanya menyebut "(dalam job)" |
| 15 | Ekspor tambahan: `CHART_REGISTRY_COUNT` 76, `CHART_PARAMS_COUNT` 87, `LINT_REGISTRY_COUNT` 99, `SYMBOL_IDS_COUNT` 41, `CATALOG_PARAMS`, `PARAMS_BY_KEY`, `STUDIO_JSON_SCHEMAS`, `STUDIO_SCHEMA_LOAD_ORDER`, `STUDIO_AJV_OPTIONS`, `studioRoutePath`, `resetStudioEnvCache`, `isPathInside`, `SECTION_REGISTRY_GROUP_COUNTS`, `getSectionType` | Penjaga hitungan untuk baris pengisi dan uji |
