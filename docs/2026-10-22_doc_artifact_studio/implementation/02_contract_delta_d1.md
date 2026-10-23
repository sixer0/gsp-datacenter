---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: S03-d1 + R01
date: 2026-10-23
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/masterplan/01_specs.md
status: complete
---

# Implementation Report: delta kontrak S03-d1 + R01 (F-023)

Skills: backend-execution, dry-run-verify-fix (1 siklus perbaikan: skrip sunting regex lewat berkas karena escape backslash di heredoc). Semua perubahan ADITIF: anggota union/enum baru, medan opsional, `$defs` baru, ParamDef baru. Tidak ada tipe/medan yang diganti nama atau dihapus. Satu pelebaran tipe atas perintah controller (D-63: `ChartCanvas.widthMm` 128|166 -> number).

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Klaim path di `file_claims.md` (prefiks S03-d1) | complete | + `params/index.ts` (T34 milik S03) dan `params/apparatus.ts` P5-03 (S95-C13) |
| 2 | Baseline: tsc, eslint, validate_doc, cek registri + template.json | complete | cadangan kontrak/params sebelum di scratchpad |
| 3 | Delta 1-6 + tambahan D-51, D-52, D-54, D-58, D-63 | complete | lihat tabel delta |
| 4 | R01: 8 default F-023 | complete | default findings 8 -> 0 |
| 5 | Seed kanonik | complete (jalur D-62) | `--refresh-v1` ditolak (v1 dipin 1 revisi) -> v2 lewat `ensureCanonicalTemplate` S49 |
| 6 | Penjaga | complete | lihat Test Results |

## Delta (ID, berkas, perubahan)

| ID | Berkas | Perubahan |
|---|---|---|
| S25 / D-38 | `contract/enums.ts`, `contract/errors.ts` | kode `BROWSER_UNAVAILABLE` (503) |
| S24 / D-45 | sama | kode `HTML_RENDER_FAILED` (500) untuk `HtmlAssembleError` |
| S51 / D-52 | sama | kode `RENDER_FAILED` (500), `STORAGE_WRITE_FAILED` (500); `PARTIAL` sudah ada di `STUDIO_RENDER_JOB_STATUSES` (tanpa perubahan) |
| S14 / D-39 | `params/render.ts` | R-26 `runningHead.docLabel` string "" (kosong = meta.subject lalu meta.title, = cadangan `header-footer.ts:108`); R-27 `org.shortName` "GSP" (= cadangan `header-footer.ts:152`). `type.face.<role>` SUDAH ADA di katalog (P4T-01..05, `params/color-type.ts:126-132`) -> tidak ditambah (kunci ganda akan merusak `PARAMS_BY_KEY`) |
| S28 | `contract/engine.ts` | `LayoutResult` + `family?`, `laneOrder?`, `gutterMm?`, `lifelines?`, `msgY?`, `msgStep?`, `msgEnd?` |
| S22 / D-46 | `types/common.ts`, `schema/common.schema.ts` | `RunProps.smallCaps?: boolean` (berlaku juga di `Run`) |
| G-01 / S95-C14 | `types/doc.ts`, `schema/doc.schema.ts`, `params/render.ts` | `Section.numberSeparator?` (maks 8) + R-33 `render.section.numberSeparator` "   " (= `SECTION_NUMBER_GAP` S16) |
| G-02 | doc | `PartSpec.order?: ("body"|"label"|"title"|"lede"|"chapterList")[]` (unik) |
| G-03 | doc | `SignatureBlock.rowOrder?: ("role"|"sign"|"holder"|"date")[]` |
| G-04 | common schema + doc | `Cell.nestedIndex?` (int >= 0; hanya `Cell`, tidak di `CellLeaf`) = jumlah paragraf sebelum tabel bersarang |
| G-05 | - | tanpa delta kontrak: pemetaan KT-34 ke `derivation.closing` (D-44) sudah sah di skema |
| G-06 | common + doc | `$defs FieldFormats` (nama medan -> ParaFormat, maks 20) di `Chapter`, `PartSpec`, `TocSpec`, dan `BlockCommon` (11 blok non-tabel: label aside/mono/turunan, keyRow figur) |
| G-07 / S95-C10 | common schema, doc, render | `styleId?` (pStyle) di varian header/footer empty, runningHead, registerBlock, custom; R-30 `render.docx.headerFooterStyles` (default = gaya yang kini ditulis S14 `parts.ts:142-145`: tabs 4680 center + 9360 right, after 0, line 240 auto) |
| G-08 / S95-C09 | common schema, doc, render | registerBlock + `colsTw?`, `cellFormats?: CellFormat[]`, `trailingFormat?`; R-29 `render.section.registerBlockLayout` {} |
| S95-C01 | engine, doc | `RoleFormat.rightCell?`; `DeviceBlock.cellFormats?` |
| S95-C02 | engine, doc | `RoleFormat.firstRowCell?`; `ControlBlock.firstRowCell?`, `rowCell?` |
| S95-C03 | engine, doc | `RoleFormat.signatureCell?`; `SignatureBlock.cellFormats? {role, sign, holder, date}` |
| S95-C04 | engine | `RoleFormat.labelRunByMark?` |
| S95-C05 | render | R-32 `render.runningHead.runProps` {} (`{left?, right?: RunProps}`, mis. spacingTw 12) |
| S95-C06 | doc | `TocSpec.colsTw?` |
| S95-C07 | doc | `DeviceBlock.colsTw?`, `Colophon.colsTw?`, `Colophon.cellFormats?` |
| S95-C08 | render | R-28 `render.derivation.nestedColsTw` null (= diturunkan renderer, `docx/figures/derivation.ts:119-122`) |
| S95-C11 | render | R-31 `render.docx.settingsExtras` (map) {} |
| S95-C12 | - | tanpa delta (usulan S95 sendiri) |
| S95-C13 | `params/apparatus.ts` | P5-03 `enum` ["bottom"] -> ["bottom", "top"] (default tetap "bottom") |
| S95-C15 | engine, render | tipe `EmbedFontFamilyEntry` (family?/role?, slots, boldFace?, files?, `forceEmbed?`); classNote R-08 diperbarui |
| bersama | common + schema | tipe/`$defs CellFormat` {para, borders, marginsTw, shading, vAlign, widthTw} |
| D-51 (S17) | render | R-34 `render.specTable.conditionIndentMm` mm 0 (BM T039 tidak menjorok; katalog P5-27 tanpa besar = celah). Preset tabel: kontrak tidak punya enum preset (`preset: string`) -> tidak ada yang ditambah |
| D-54 (S50) | `types/api.ts` | `RerenderRevisionFn` (argumen ke-4 `caller?: StudioCaller`) |
| D-58 (S94) | `types/chart.ts`, `schema/chart.schema.ts` | `StudioChartV1.accent?: ChartAccent {point?: string|number, group?, series?}` (minProperties 1; ikut di panel komposit); alias `CHART_ACCENT_PARAM_ALIASES` = params `accentPoint`/`accentGroup`/`accentSeries`, `accent` menang |
| D-63 (S32) | engine | `ChartCanvas.widthMm: number` |
| D-63 (S48) | engine | `RenderContext.assetBytes?: (sha256, key?) => Uint8Array \| undefined` (sinkron, renderer blok sinkron) |
| D-63 (S48) / R01 | `params/governance-language.ts` | default P3-20 + "STD" |

### R01 (F-023), 8 entri

| ID | Kunci | Perbaikan |
|---|---|---|
| P1-04 | `content.authorClaimMarks` | type enum -> list (+enum = multi-pilih, sudah didukung `validateParamValue`) |
| P3-20 | `doc.typeCode` | enum -> list; default + STD (D-63) |
| P15-28 | `brief.slidePatterns` | enum -> list |
| P5-48 | `derivation.id.pattern` | `pattern` kini memvalidasi templat: `^D-(\{bab\}|[0-9]+)\.(\{urut\}|[0-9]+)[a-z]?$`; regex ID hasil dipindah ke classNote |
| P5-63 | `assumption.id.pattern` | `^ASM-(\{domain\}|[A-Z][A-Z0-9]*)-(\{nn\}|[0-9]{2})$` |
| P5-65 | `requirement.id.pattern` | `^REQ-(\{subsistem\}|[A-Z][A-Z0-9]*)-(\{nn\}|[0-9]{2})$` |
| P9-02 | `diagram.id` | pola `^([0-9]+\.[0-9]+)?$` (kosong = belum dinomori) |
| P10-34 | `lineWeight.thinThickRatio` | "1:2" -> "1/2" (bentuk rasio sah; katalog di classNote) |

## Hitungan registri baru

| Hitungan | Sebelum | Sesudah |
|---|---|---|
| Parameter katalog (`CATALOG_PARAM_COUNT`) | 673 | 673 |
| Parameter renderer (`PARAMS_RENDER_COUNT` = `RENDER_PARAM_COUNT`) | 25 | 34 (R-26..R-34) |
| ALL_PARAMS / PARAMS_BY_KEY / id unik | 698 | 707 |
| resolvedParams kanonik (+1 turunan) | 699 | 708 |
| STUDIO_ERROR_CODES / peta HTTP | 36 / 36 | 40 / 40 |
| Default gagal validasi sendiri | 8 | 0 |
| ROLE_KEYS, SECTION_REGISTRY | 70, 51 | 70, 51 (tidak berubah) |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| src/lib/studio/contract/enums.ts | modify | +4 kode galat |
| src/lib/studio/contract/errors.ts | modify | +4 status HTTP |
| src/lib/studio/contract/engine.ts | modify | RoleFormat +4 opsional, RenderContext.assetBytes, LayoutResult +7, EmbedFontFamilyEntry, ChartCanvas.widthMm number |
| src/lib/studio/contract/types/common.ts | modify | smallCaps, CellFormat, FieldFormats |
| src/lib/studio/contract/types/doc.ts | modify | medan opsional G-01..G-08, C01-C07 |
| src/lib/studio/contract/types/chart.ts | modify | ChartAccent + alias |
| src/lib/studio/contract/types/api.ts | modify | RerenderRevisionFn |
| src/lib/studio/contract/schema/common.schema.ts | modify | smallCaps, styleId, registerBlock, nestedIndex, $defs CellFormat/FieldFormats |
| src/lib/studio/contract/schema/doc.schema.ts | modify | padanan skema medan doc baru |
| src/lib/studio/contract/schema/chart.schema.ts | modify | accent |
| src/lib/studio/params/render.ts | modify | R-26..R-34, classNote R-08, hitungan 34 |
| src/lib/studio/params/index.ts | modify | RENDER_PARAM_COUNT 34 |
| src/lib/studio/params/governance-language.ts | modify | R01 P1-04, P3-20 (+STD), P15-28 |
| src/lib/studio/params/apparatus.ts | modify | R01 P5-48, P5-63, P5-65; S95-C13 P5-03 |
| src/lib/studio/params/figure.ts | modify | R01 P9-02, P10-34 |
| DB gsp_agent_hq_v21 | data | `StudioTemplateVersion` datum-kanonik v2 baru (v1 tidak disentuh) |

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | sebelum 48 galat (27 di src/lib/studio, semua `engine/diagram/build` S30 yang sedang jalan); sesudah 26 galat, 0 di `src/lib/studio`, 0 di contract/params | 21 sisa pra-ada di `src/app/*`; 5 di `src/components/studio/revision/*` = berkas baru baris lain (ditulis 00:45-00:49): TS2352 `inline-editor.tsx:118` terbukti identik terhadap kontrak SEBELUM delta (uji tsc terpisah, keluaran sama), `block-editor.tsx` role/rail tidak menyentuh tipe yang diubah |
| Lint | `npx eslint src/lib/studio/contract src/lib/studio/params` | exit 0 | |
| doc.json | `npx tsx benchmark/extract/validate_doc.ts` | `VALID studio.doc/v1`, exit 0 | |
| template.json | skrip registri (resolveParams, checkOverrideRights, validateParamValue, ROLE_KEYS) | 82 override, 0 asing, 0 isu resolve, 0 isu nilai, ADMIN 0 / USER 4 (K, sama dengan S95), roleFormats 70/70 | |
| Figur S94 | `npx tsx benchmark/manual000/figures/tools/validate_figures.ts` | exit 0, `LOLOS` (spec 20/20, blok 52/52) | |
| Skema delta | skrip 21 kasus (terima/tolak) | 21/21 PASS | medan baru diterima; kunci FieldFormats rusak, order asing, styleId rusak, styleId pada inherit, nestedIndex di sel daun, accent kosong/asing ditolak |
| Registri | skrip tsx | 6 skema terkompilasi ajv strict; angka di tabel hitungan | |
| Seed | `npx tsx prisma/seed-studio.ts --refresh-v1` | exit 1: "Versi datum-kanonik v1 berbeda dari registri (sha DB 3d6e5fba4a11 vs 854d345208bf); dipin 1 revisi/artefak, buat versi baru lewat layanan templat" | tanpa baris warn default -> 0 temuan F-023 |
| Seed jalur D-62 | `ensureCanonicalTemplate({ createdBy: "controller-s03-d1", syncRegistry: true })` | `TEMPLATE_CANONICAL_SYNCED` versionNo 2; v1 699 kunci sha 3d6e5fba... 1 revisi; v2 708 kunci sha `854d345208bf730301559547e98d3dcb4edc6b7f129ca88071104e80cf49e762` 0 revisi | sha v2 = sha yang dihitung seed S70 |

## Verification

- Pin v1 diperiksa sebelum seed (query tsx, DB `gsp_agent_hq_v21`): v1 dipin 1 revisi, 0 artefak -> `--refresh-v1` tidak boleh menulis; jalur v2 dipakai.
- Aditif: diff terhadap cadangan sebelum delta hanya menambah anggota/medan; tidak ada kunci ParamDef, medan tipe, atau `$defs` yang dihapus/diganti nama.

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| `prisma/seed-studio.ts` (S70) kini selalu exit 1 | 0 (bukan berkas saya) | seed membandingkan v1 saja; v1 dipin 1 revisi dan beda dari registri | terbuka; usul: seed membandingkan versi terbaru atau melewati bila latest = registri | tidak |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| 3 | Penyunting di luar 8 entri R01 | `params/apparatus.ts` P5-03 (brief butir 6 menyebut `top` P5-03) dan `params/index.ts` (T34 milik S03; seed memeriksa `RENDER_PARAM_COUNT`), keduanya diklaim |
| 3 | Celah sebagai medan dokumen vs parameter templat | celah per-dokumen (urutan, lebar kolom tabel perangkat/TOC, format sel) = medan doc opsional; celah per-profil = ParamDef R-26..R-34 atau RoleFormat opsional; ROLE_KEYS tidak ditambah (70/70 profil S95 tetap utuh) |
| 3 | Default ParamDef baru = perilaku renderer saat ini | profil kanonik tidak berubah makna; nilai Manual 000 dicatat di classNote untuk S95 |
| 4 | Pola `*.id.pattern` | `pattern` = validator NILAI parameter (templat), ID hasil di classNote; konsisten dengan `naming.*.pattern` lain |
| 5 | v1 dipin | v2 via S49 sesuai D-62 |

## Next Steps

- Konsumen membaca medan/parameter baru (tidak dikerjakan di sini): S14/S18 (styleId, R-29, R-30, R-31, R-32, registerBlock), S15 (`forceEmbed`), S16 (R-33/numberSeparator, fieldFormats, nestedIndex, R-28), S17 (R-34, firstRowCell, cellFormats tanda tangan/kolofon, P5-03 top), S21-S24 (smallCaps, `HTML_RENDER_FAILED`), S25 (`BROWSER_UNAVAILABLE`), S30 (LayoutResult), S32/S94 (`accent`), S48/S51 (`assetBytes`, `RENDER_FAILED`, `STORAGE_WRITE_FAILED`; S51 beralih dari `BY_CONSTRUCTION_FAILED`/`FILE_MISSING_ON_DISK`), S95 (opsional: isi R-28..R-32 dan RoleFormat baru di template.json).
- Controller/S01: sinkronkan teks `masterplan/01_specs.md` §5.7 (R-26..R-34), §6.3 (4 kode), §8.2 I40 (argumen `caller`), §8.1 (`assetBytes`, `ChartCanvas.widthMm`).
- Info (di luar area): `type.face.condensed` katalog = "IBM Plex Sans Condensed", cadangan mesin = "IBM Plex Sans Cond" (D-31).
