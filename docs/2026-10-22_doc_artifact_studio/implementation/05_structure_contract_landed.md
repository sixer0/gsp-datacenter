---
task_slug: doc_artifact_studio
row: SR-04
date: 2026-10-23
agent: coder-execution
marker: kontrak struktur v2 mendarat (B2 boleh mulai)
source_register: masterplan/03_structural_sections_specs.md (SR-01, D-166)
---

# Marker: kontrak struktur v2 mendarat (SR-04)

Kontrak `src/lib/studio/contract/**` sudah diperluas secara ADITIF: v1 tetap valid dan semua ekspor lama tidak berubah. Semua nama mengikuti register SR-01. Nama tambahan yang tidak ada di register ditandai **(+)** dan alasannya ada di laporan `implementation/sr04_structure_contract.md`.

Impor tetap lewat `@/lib/studio/contract` (aman untuk klien). Kontrak sekarang read-only lagi; perubahan berikutnya lewat `delegation_progress/file_requests.md` (penulis tunggal SR-04).

## 1. Daftar ekspor baru

### Enum (`enums.ts`)
| ID | Konstanta / tipe |
|---|---|
| E26-E28 | `STUDIO_SLOT_CONTENT_MODES`/`StudioSlotContentMode`, `STUDIO_RENDER_SCOPE_KINDS`/`StudioRenderScopeKind`, `STUDIO_COMPLETENESS_STATUSES`/`StudioCompleteness` |
| E29-E37 | `STUDIO_SLOT_STATES`/`StudioSlotState`, `STUDIO_IDENTITY_KINDS`/`StudioIdentityKind`, `PARAM_SURFACES`/`ParamSurface`, `PARAM_SCOPE_KINDS`/`ParamScopeKind`, `STRUCTURE_OPS`/`StructureOp`, `PID_OPS`/`PidOp`, `INLINE_FORMAT_POLICIES`/`InlineFormatPolicy`, `PARAGRAPH_ROLES_V2`/`ParagraphRoleV2`, `RUN_MARKS_V2`/`RunMarkV2` |
| E38-E43 | `PAPER_SIZES`/`PaperSize` + `PAPER_SIZE_MM` (F4 = 215 × 330), `PAGE_ORIENTATIONS`/`PageOrientation`, `RENDER_SCOPE_NAMES`/`RenderScopeName`, `SCHEMA_V2_CHECK_IDS`/`SchemaV2CheckId` (+tipe), `CHAPTER_EXPECTED_SOURCES`/`ChapterExpectedSource` (+tipe), `MARGIN_DENSITIES`/`MarginDensity` |
| EC01-EC24 | 24 kode baru di `STUDIO_ERROR_CODES` (44 → **68**) dan `STUDIO_ERROR_HTTP` (HTTP sesuai §11.2; `ASSET_NOT_FOUND` = 422, KD-24) |

### Konstanta (`env.ts`)
- C18-C28: `SLOT_KEY_PATTERN`, `PID_PATTERN`, `PID_GENERATED_PREFIX`, `PID_ALPHABET`, `PID_RANDOM_LENGTH`, `DOC_KEY_PATTERN`, `STUDIO_LOCK_DOC_PREFIX`, `STUDIO_LOCK_MISSION_DOC_PREFIX`, `ASSET_KEY_PATTERN`, `ASSET_REF_PATTERN`, `STUDIO_SUBMIT_TX_TIMEOUT_MS`.
- C32, C33a-C33c: `STUDIO_COMMON_V2_SCHEMA_ID`, `CHAPTER_KEY_NUMERIC_PATTERN`, `CHAPTER_KEY_LETTER_PATTERN`, `STUDIO_ASSET_REL_DIR`.
- C16 `STUDIO_ROUTES` + R12-R20 (20 route). `studioRoutePath(id, { id?, address?, pid? })`.
- C17 `STUDIO_SCHEMA_IDS` + `studio.doc/v2`, `studio.chapter/v2`, `studio.slot/v2`, `studio.template/v2`, `studio.skeleton/v1` (5 → 10).
- C32a `SHARED_PARAM_GROUP_MEMBERS` dan C33 `SLOT_SECTION_TYPES` **bukan** milik kontrak; keduanya milik `L/registry/slots.ts` (SR-05).

### Medan terlarang (`schema/v2/forbidden.ts`)
- C29 `DISPLAY_FIELDS_GLOBAL` (52), C30 `DISPLAY_FIELDS_BY_LOCATION` (10, DF-53..DF-62), C31 `V1_FIELD_RENAMES` (14).
- (+) `classifySchemaV2Errors(rootId, data, ajvErrors, prefix?) → ValidationIssue[]`: satu-satunya pemeta galat ajv v2 ke issue ber-`checkId` `V1_FIELD` / `DISPLAY_FIELD`. V1_FIELD diperiksa lebih dulu. Pesan DISPLAY_FIELD apa adanya: `medan tampilan tidak diterima; tampilan diatur templat`. Pointer issue menunjuk medan yang ditolak. SR-12, SR-20, dan SR-31 wajib memakainya; jangan menulis ulang.
- (+) `locateSchemaV2Object`, `AjvErrorLike`, `SchemaV2RootId`, `DisplayFieldLocationRule`, `V1FieldRename`.

### Tipe v2 (`types/v2/*`, diekspor ulang dari index)
- `common.ts`: T2-01..T2-12 `RunV2`, `InlineV2`, `CaptionV2`, `SourceV2`, `RailLineV2`, `AssetInputV2`, `DocMetaV2`, `DocTargetV2`, `ChangeV2`, `RenderRequestV2`, `OutlineEntryV2`, `PartV2`.
- `doc.ts`: T2-13..T2-32 `ParagraphV2`, `ListV2`, `AsideV2`, `MonoBlockV2`, `AssumptionInlineV2`, `TableV2`, `ColumnV2` (hanya `role`/`unit`, KC-6), `RowV2`, `CellV2`, `DerivationV2`, `ChartV2`, `ChartDataV2`, `ChartPanelV2`, `DiagramV2`, `DiagramSpecV2`, `ImageV2`, `SymbolSheetV2`, `BlockV2`, `ChapterV2`, `SectionV2`; T2-46 `StudioDocV2`; T2-49 `StudioDocV2Resolved`.
- `chapter.ts`: T2-47 `StudioChapterV2`. `slot.ts`: T2-33..T2-45 (`CoverPayloadV2` … `RepeatableSlotMetaV2`, `SlotPayloadV2`), T2-48 `StudioSlotV2`.
- `template.ts`: T2-56..T2-59 `TemplateSlotDef`, `StudioSkeletonV1`, `StudioTemplateV2`, `EssentialKnobDef` (control + `multiEnum` atas permintaan SR-05); (+) `SlotSetup` = nilai `slot.setup` (R-41 + KT-10 `startOnNewPage`/`runningHead`).
- `norm.ts`: T2-50..T2-55 `NormSlotV2`, `NormSkeletonV2`, `NormUnitV2`, `NormBlockV2` (membawa `pid`, permintaan SR-34), `NormDocSnapshotV2`, `PidAllocator`; `AnyNormSnapshot`; (+) `isNormSnapshotV2`.
- `completeness.ts`: T2-60/60a/60b `CompletenessReportV2`, `SlotStatusV2`, `ChapterProgressV2` (`chapters.<slotKey>`, KD-15). **`CompletenessSummary`** (D-163/D-164, rel kelengkapan FIX-4a) beserta `CompletenessSlotSummary` dan `ChapterProgressSummary`. `CompletenessReportV2` dapat ditetapkan langsung ke `CompletenessSummary`; ini dijaga tipe `_CompletenessReportIsSummary`.
- `api.ts`: T2-60c `SubmitResultV2`, `AssetDtoV2` (R18), `SlotNodeV2` (R05), `AdaptReportV1` (§14.3, LD-03).

### Skema JSON (`schema/v2/*`)
| Id | Konstanta | `$id` |
|---|---|---|
| common/v2 | `commonV2Schema`, `COMMON_V2_SCHEMA_ID`, `commonV2Ref`, `docV1Ref`, `BLOCK_V2_DEFS`, `SLOT_PAYLOAD_V2_DEFS` | `…/common/v2.json` |
| SID01 | `docV2Schema`, `DOC_V2_SCHEMA_ID` | `…/studio.doc/v2.json` |
| SID02 | `chapterV2Schema`, `CHAPTER_V2_SCHEMA_ID` | `…/studio.chapter/v2.json` |
| SID03 | `slotV2Schema`, `SLOT_V2_SCHEMA_ID` | `…/studio.slot/v2.json` |
| SID04 | `templateV2Schema`, `TEMPLATE_V2_SCHEMA_ID`, `templateV2Ref` | `…/studio.template/v2.json` |
| SID05 | `skeletonV1Schema`, `SKELETON_V1_SCHEMA_ID` | `…/studio.skeleton/v1.json` |

`STUDIO_JSON_SCHEMAS` memuat SID01-SID05. `STUDIO_SCHEMA_LOAD_ORDER` menambahkan, setelah 6 skema v1: common/v2, doc/v2, chapter/v2, slot/v2, template/v2, skeleton/v1. Opsi ajv `STUDIO_AJV_OPTIONS` tetap sama.

Nama `$defs` di `common/v2` sama dengan nama tipe TS. Contoh: `#/$defs/BlockV2`, `#/$defs/ChangeV2`, `#/$defs/SlotPayloadV2`, `#/$defs/DocSectionPayloadV2`.

### Perluasan berkas v1 (aditif)
- `address.ts`: `front = "F:" slotKey ["/" posint]` (C18). Empat kunci lama tetap sah. `ParsedAddress.front.page` bertipe `FrontSlotKey` (= `FrontPageKey | string`). (+) `FRONT_PAGE_KEYS` dan `isFrontPageKey`.
- `engine.ts`: `RenderContext.slots?`, `.scope?`, `.draft?`; `RenderScope`, `ResolvedSlot` (§15.1).
- `types/params.ts`: `ParamDef.surface?: ParamSurface` dan `ParamDef.scope?: string`. `DeriveFnId` mendapat DV-01..DV-04 (`pageSizeFromPaper`, `textColumnFromPage`, `marginsFromDensity`, `typeScaleFromBase`) dan delapan nama research/09 §6.2 (`pageSizeFromKnob`, `textBlockFromPage`, `baselineFromBodyLeading`, `figureWidthFromClass`, `figureMaxHeightFromBlock`, `sectionSetupFromGrid`, `headerFooterTabsFromSpan`, `colorLiterals`).
- `types/model.ts`: `NormUnitKind` mendapat `"slot"`.
- `types/api.ts`: `RegistryKind` / `REGISTRY_KINDS` mendapat `presets`, `essentials`, `slots`, `paramScopes`.

## 2. Contoh pemakaian

```ts
import Ajv2020 from "ajv/dist/2020";
import { STUDIO_AJV_OPTIONS, STUDIO_SCHEMA_LOAD_ORDER, STUDIO_SCHEMA_BASE_URL, classifySchemaV2Errors } from "@/lib/studio/contract";

const ajv = new Ajv2020({ ...STUDIO_AJV_OPTIONS });
for (const s of STUDIO_SCHEMA_LOAD_ORDER) ajv.addSchema(s);
const v = ajv.getSchema(`${STUDIO_SCHEMA_BASE_URL}/studio.doc/v2.json`)!;
if (!v(body)) {
  const issues = classifySchemaV2Errors("studio.doc/v2", body, v.errors);
  // -> studioError("SCHEMA_INVALID", "Kiriman tidak sesuai studio.doc/v2", { issues })
}
```

Fragmen bersama dapat divalidasi lewat `$defs`. Contoh: blok PATCH R16 memakai `${COMMON_V2_SCHEMA_ID}#/$defs/BlockV2`.

**E0** (dokumen kosong berkerangka) lolos `studio.doc/v2`:
```json
{ "$schema": "studio.doc/v2", "template": { "slug": "datum-gsp" },
  "mission": { "folder": "2026-10-23_misi_a", "hermesTaskId": "ht_7f3a" },
  "docKey": "laporan-survei", "meta": { "title": "Laporan Survei Gardu Induk Cikupa" } }
```

E1 (blueprint §2.4, 7 slot) dan E2 (§2.5, bab 3 dengan `image` + `table`) lolos apa adanya. E2 memakai `assetRef` 64 heksa penuh (C27).

**Varian E1 dengan `format`** pada paragraf → `SCHEMA_INVALID`:
```json
{ "pointer": "/sections/content/chapters/0/sections/0/blocks/0/format", "keyword": "additionalProperties",
  "checkId": "DISPLAY_FIELD", "message": "medan tampilan tidak diterima; tampilan diatur templat" }
```

**Varian dengan `blockId`** → `{ "checkId": "V1_FIELD", "message": "medan v1 tidak diterima di v2; pakai id" }`.

Alamat: `parseAddress("F:references/1")` → `{ kind: "front", page: "references", n: 1 }`. Round-trip `formatAddress` identik.

## 3. Catatan untuk baris hilir
- **SR-12 / SR-20:** validasi v2 = ajv + `classifySchemaV2Errors`. Aturan struktur (422 `SLOT_*`, `CHAPTER_KEY_INVALID` dengan pola C33a/C33b, `DOC_TARGET_AMBIGUOUS`, `META_REQUIRED_FOR_CREATE`) **tidak** ada di skema; aturan itu milik compose/submit.
- **SR-06:** skema templat/kerangka hanya menegakkan bentuk (enum `contentMode`, `tiers`, dan `admits` ⊆ `CONTENT_BLOCK_TYPES`). Cek SKELETON_* (posisi kontigu, sectionType ∈ C33, berulang, mode per sectionType) milik layanan kerangka.
- **SR-26 (R19 POST):** badan = `StudioSkeletonV1 & { baseVersionNo, changeNote, expertMode? }`. Pisahkan tiga medan itu sebelum validasi `studio.skeleton/v1` (`additionalProperties: false`).
- **SR-27 (R03):** `SCHEMA_DOCS` route baru memuat `common/v1`. Tambahkan `"common/v2": commonV2Schema` agar `$ref` skema v2 dapat diselesaikan klien.
- **SR-34 / runner:** kunci `"studio.doc/v2"` sekarang ada di `STUDIO_JSON_SCHEMAS`. Runner menganggap kontrak siap, tetapi ingest v2 tetap menunggu SR-12.
- **SR-42 (uji usang):** `tests/unit/studio/api/http-errors.test.ts:84,86` mematok 41 kode galat. Patokan itu sudah gagal sebelum SR-04, karena enum sudah 44 sejak FIX-1. Nilai yang benar sekarang 68.
