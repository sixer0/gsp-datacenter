---
task_id: DC-05
task_slug: doc_artifact_studio
row: DC-05
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/masterplan/05_document_contract_specs.md
status: complete
---

# Implementation Report: Delta kontrak v2 document contract (DC-05)

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Enum E44-E57, CH-01..CH-06, EC25-EC28 + HTTP | complete | `enums.ts`, `errors.ts` |
| 2 | Konstanta C34-C45, C48-C57, route R21-R23 | complete | `env.ts` |
| 3 | Tipe T2-61..T2-74 + AM-02/03/08/09/13 | complete | AM-03 union TS, AM-09/AM-13 opsional (lihat keputusan) |
| 4 | JSON Schema `$defs` kontrak + ChartV2 custom | complete | `common.schema.ts` |
| 5 | DF-72/DF-73 + pemeta checkId kontrak | complete | `forbidden.ts` |
| 6 | Uji baru + pin uji lama | complete | 64 uji baru |
| 7 | Marker landing | complete | `implementation/06_document_contract_landed.md` |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/lib/studio/contract/enums.ts | modify | E44-E57; SCHEMA_V2_CHECK_IDS 8->14; STUDIO_ERROR_CODES 69->73 |
| src/lib/studio/contract/errors.ts | modify | EC25-EC28 -> 422 |
| src/lib/studio/contract/env.ts | modify | C34-C45, C48-C57; STUDIO_ROUTES R21-R23 |
| src/lib/studio/contract/types/v2/contract.ts | add | T2-61..T2-74 |
| src/lib/studio/contract/types/v2/{index,slot,doc,api}.ts | modify | ekspor; AM-02; AM-03 `form?`; AM-08 `warnings?` |
| src/lib/studio/contract/types/api.ts | modify | AM-09 `finalFileName?`, AM-13 `contractKind?` |
| src/lib/studio/contract/schema/v2/common.schema.ts | modify | 6 `$defs` baru; union slot; ChartV2 custom |
| src/lib/studio/contract/schema/v2/forbidden.ts | modify | DF-72/73 (`alsoAt`), peta lokasi kontrak, classifier CH-01..CH-05 |
| tests/unit/studio/contract/dc05-contract-delta.test.ts | add | 64 uji |
| tests/unit/studio/api/http-errors.test.ts | modify | pin 69->73 + 4 baris SPEC_HTTP EC25-EC28 |
| tests/unit/studio/structure/display-field.test.ts | modify | pin 19->21 entri; DF-72/73 dikecualikan dari iterasi probe doc |
| docs/.../implementation/06_document_contract_landed.md | add | marker |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | exit 0, 0 baris keluaran | termasuk berkas agen paralel saat itu |
| Lint | `npx eslint src/lib/studio/contract tests/unit/studio/contract` | exit 0 | `http-errors.test.ts` 3 galat `no-explicit-any` sudah ada di HEAD (:138, :172), bukan dari delta |
| Unit baru | `npx vitest run tests/unit/studio/contract` | 64/64 lulus | |
| Suite studio | `npx vitest run tests/unit/studio` | 100 berkas, 2564 lulus, 1 skip, 0 gagal | |

## Verification
- Contoh register §5.8 (slot `record` + bab 1) lolos ajv strict: `validateV2Against` = `[]`.
- Varian bermedan tampilan (label/columns/order/heading x payload/item/bukti/rujukan; form palette..legend) -> `DISPLAY_FIELD` berpointer tepat.
- NV-01,02,03,04,06,07,08,09 -> checkId + pointer register, tepat satu isu; NV-05, NV-10..12 lolos skema (layanan, §5.6).
- Jumlah kode galat 73 (`STUDIO_ERROR_CODES` = kunci `STUDIO_ERROR_HTTP`); DF total 73; checkId 14.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| none | - | - | - | - |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 3 | AM-03: melebarkan union TS `ChartV2.code` ke `"custom"` memecah tsc di `services/compose/blocks.ts:400` (bukan milik DC-05) | Skema menerima `custom`; union TS ditunda ke DC-27/DC-10 via file request (dicatat di JSDoc + marker) |
| 3 | AM-07: `RegistryKind` + `contracts` memecah `registry/route.ts:327` (TS2366) dan membuat R03 menerima kind tanpa penangan | Tidak diterapkan; diterapkan bersama DC-28 via file request |
| 3 | AM-09 `finalFileName`, AM-13 `contractKind` wajib di register akan memecah pemeta yang ada | Dibuat opsional sampai DC-20 / route templat mengisinya |
| 5 | Calendar check CH-03 (NV-05) tidak bisa dicek skema | Diserahkan ke I54 (DC-07); tidak ada helper baru di kontrak |
| 5 | Enum `form.mark`/`orientation` di luar E51/E52 | Dipetakan ke `CHART_CUSTOM_FORM` (register tidak menyebut; pilihan terdekat) |
| 5 | Nama tambahan di luar register: `DisplayFieldLocationRule.alsoAt` (properti antarmuka untuk DF-72 empat lokasi) | Dipakai; satu-satunya nama baru |
| 6 | Uji lama `display-field.test.ts` mengiterasi semua entri C30 terhadap probe doc tanpa slot kontrak | Perubahan melebihi angka: filter DF-72/73 (diuji di dc05). Berkas diklaim di file_claims |

## Next Steps
- Controller: setujui atau rutekan tiga penundaan (AM-03 union TS, AM-07, opsional AM-09/AM-13).
- Review recommended: `forbidden.ts` classifier + `common.schema.ts` ChartV2 `allOf`.
