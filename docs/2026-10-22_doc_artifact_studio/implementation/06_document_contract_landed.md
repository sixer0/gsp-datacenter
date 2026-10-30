---
task_slug: doc_artifact_studio
row: DC-05
date: 2026-10-30
agent: coder-execution
marker: kontrak document contract v2 mendarat (DC-06, DC-21, B3 boleh mulai)
source_register: masterplan/05_document_contract_specs.md (DC-02, D-363)
---

# Marker: delta kontrak document contract mendarat (DC-05)

`src/lib/studio/contract/**` diperluas secara ADITIF: v1/v2 lama tetap valid, ekspor lama tidak berubah. Semua nama mengikuti register 05. Impor tetap lewat `@/lib/studio/contract` (aman untuk klien). Kontrak kembali read-only; perubahan berikutnya lewat `delegation_progress/file_requests.md`.

## 1. Ekspor baru

### Enum (`src/lib/studio/contract/enums.ts`)
| ID | Konstanta / tipe |
|---|---|
| E44 | `CONTRACT_KINDS` / `ContractKind` (`agentWorkReport`) |
| E45 | `AGENT_WORK_REPORT_STATUSES` / `AgentWorkReportStatus` |
| E46 | `CONTRACT_ITEM_STATUSES` / `ContractItemStatus` |
| E47 | `CONTRACT_VERDICTS` / `ContractVerdict` |
| E48 | `CONTRACT_REF_RELS` / `ContractRefRel` |
| E49 | `CONTRACT_EVIDENCE_KINDS` / `ContractEvidenceKind` |
| E50 | `CONTRACT_OUTLINE_KEYS` / `ContractOutlineKey` |
| E51, E52 | `CHART_CUSTOM_MARKS` / `ChartCustomMark`, `CHART_CUSTOM_ORIENTATIONS` / `ChartCustomOrientation` |
| E53 | `QUOTA_BUCKETS` / `QuotaBucket` (urutan = seri QH-04) |
| E54 | `CONTRACT_WARNING_CODES` / `ContractWarningCode` |
| E55, E56 | `DRAFT_ISSUE_CODES` / `DraftIssueCode`, `DRAFT_LIMIT_REASONS` / `DraftLimitReason` |
| E57 | `FINAL_NAME_MODES` / `FinalNameMode` |
| AM-04 | `SCHEMA_V2_CHECK_IDS` 8 -> 14: `CONTRACT_ENUM`, `CONTRACT_PATTERN`, `CONTRACT_DATE`, `CONTRACT_REF_TARGET`, `CHART_CUSTOM_FORM`, `SKELETON_CONTRACT_RECORD` |
| AM-05 | `STUDIO_ERROR_CODES` 69 -> 73: `CONTRACT_REF_NOT_FOUND`, `CONTRACT_REF_PID_NOT_FOUND`, `CONTRACT_ITEM_KEY_DUPLICATE`, `CHART_CUSTOM_FORM_UNSUPPORTED` (semua 422 di `errors.ts` `STUDIO_ERROR_HTTP`) |

### Konstanta (`src/lib/studio/contract/env.ts`)
- C34-C45: `CARD_ID_PATTERN`, `CONTRACT_KEY_PATTERN`, `CONTRACT_ACTOR_PATTERN`, `CONTRACT_REPORTED_AT_PATTERN`, `CONTRACT_SHA_PREFIX_PATTERN`, `CONTRACT_LIMITS`, `CONTRACT_DEFAULT_RENDER_FORMATS`, `STUDIO_FTS_CONFIG`, `STUDIO_FTS_MAX_CHARS`, `SEARCH_LIMITS`, `SEARCH_SNIPPET_OPTIONS`, `CONTRACT_QUERY_LIMITS`.
- C48-C57: `STUDIO_QUOTA_REMAINING_HEADER`, `STUDIO_QUOTA_BUCKET_HEADER`, `STUDIO_FINAL_FILENAME_HEADER`, `FINAL_FILENAME_PATTERN`, `FINAL_DOC_NUMBER_MAX`, `FINAL_ARTIFACT_PREFIX`, `DRAFT_LIMITS`, `DRAFT_HEADER_KEYS`, `DRAFT_BASIS_PATTERN`, `DRAFT_ACCEPTED_SCHEMAS`.
- AM-06: `STUDIO_ROUTES.R21` `/api/studio/contracts`, `R22` `/api/studio/search`, `R23` `/api/studio/drafts/check`.
- BUKAN di sini (milik baris lain): C46/C47 (`L/http/quota.ts`, DC-19), C58 (`L/registry/contracts.ts`, DC-06), C59/C60 (`L/registry/charts.ts`, DC-26).

### Tipe (`src/lib/studio/contract/types/v2/contract.ts`, BARU; diekspor lewat `types/v2/index.ts`)
T2-61 `ContractRecordPayloadV2`, T2-62 `ContractItemV2`, T2-63 `ContractRefV2`, T2-64 `ContractEvidenceV2`, T2-65 `ContractPhaseV2`, T2-66 `ChartCustomFormV2`, T2-67 `SubmitWarningV2`, T2-68 `ContractSummaryV2`, T2-69 `SearchHitV2`, T2-70 `DraftCheckResultV2`, T2-71 `DraftBlockResultV2`, T2-72 `DraftIssueV2`, T2-73 `ContractKindDefV2` (bentuk entri C58 untuk DC-06: `labels` = `{ fields, itemColumns, evidenceColumns, refColumns }`, `aliases` = `{ headings, lineLabels, headerKeys, statuses, itemStatuses, verdicts }`), T2-74 `FinalFileNameParts`.

Amandemen tipe: AM-02 `SlotPayloadV2` + `ContractRecordPayloadV2` (`types/v2/slot.ts`); AM-03 `ChartV2.form?: ChartCustomFormV2` (`types/v2/doc.ts`); AM-08 `SubmitResultV2.warnings?` (`types/v2/api.ts`); AM-09 `OutputFileDto.finalFileName?` dan AM-13 `TemplateSummary.contractKind?` (`types/api.ts`).

### JSON Schema (`src/lib/studio/contract/schema/v2/common.schema.ts`)
- `$defs` baru: `ContractRecordPayloadV2`, `ContractPhaseV2`, `ContractRefV2`, `ContractEvidenceV2`, `ContractItemV2`, `ChartCustomFormV2` (semua `additionalProperties: false`; tanpa medan `kind`, KD-30).
- `SLOT_PAYLOAD_V2_DEFS` 6 -> 7 (union `SlotPayloadV2` dan `DocSectionPayloadV2` menerima `contractRecord`).
- `ChartV2.code` menerima `"custom"`; `form` wajib bila `custom` (bersama `data`), terlarang selain itu.

### Pemeta galat (`src/lib/studio/contract/schema/v2/forbidden.ts`)
- C30 `DISPLAY_FIELDS_BY_LOCATION` + `DF-72` (lokasi `ContractRecordPayloadV2`, `alsoAt` item/bukti/rujukan) dan `DF-73` (`ChartCustomFormV2`): total DF 71 -> 73. `DisplayFieldLocationRule.alsoAt?` baru.
- `classifySchemaV2Errors` memancarkan CH-01..CH-05 untuk payload kontrak dan chart.custom (pointer per medan).

## 2. Catatan untuk baris pemakai
- DC-07 (I54): CH-03 kalender (mis. `2026-02-30`, NV-05) TIDAK dicek skema; pemeriksaan murni pasca-ajv milik I54. NV-10..NV-12 lolos skema (422 layanan).
- DC-06: CH-06 `SKELETON_CONTRACT_RECORD` hanya didaftarkan; pemancarnya validator kerangka (registri slot).
- DC-27/DC-10: union TS `ChartV2.code` BELUM dilebarkan ke `"custom"` (skema sudah menerima): `services/compose/blocks.ts:400` menyalin `code` ke `StudioChartV1.kind` sehingga pelebaran memecah tsc. Ajukan via `file_requests.md` saat pemetaan custom dikerjakan.
- DC-28: AM-07 (`RegistryKind`/`REGISTRY_KINDS` + `contracts`) BELUM diterapkan: `registry/route.ts:327` `listPayload` switch tidak menangani `contracts` (TS2366) dan R03 akan menerima kind tanpa penangan. Terapkan bersama DC-28 (file request).
- DC-20 / route templat: `finalFileName` dan `contractKind` sementara opsional; diketatkan menjadi wajib setelah pengisinya mendarat.
