---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: DC-28 (+ temuan DC-29/30: AM-13, urutan galat R02/R19)
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/07_document_contract_blueprint.md
status: needs-review
---

# Implementation Report: R03 kind=contracts + AM-07 + AM-13 + urutan galat templat

Status `needs-review` hanya karena asap R03 di :9021 terhalang server dev basi (lihat Persistent Issues); kode, tsc, eslint, dan uji hijau.

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | AM-07 `RegistryKind` + `REGISTRY_KINDS` + `contracts` | complete | `types/api.ts` (hanya union, larik, komentar) |
| 2 | Penangan R03 `?kind=contracts` | complete | `contractsPayload`: `CONTRACT_KIND_DEFS` berstatus `active` apa adanya (C58, baca saja); parameter selain `kind` -> 400 SCHEMA_INVALID `/query/<nama>` (register 05 §9.4); cache privat 300 dtk seperti kind statis lain; komentar kepala diperbarui (tanpa `*/` di dalam JSDoc) |
| 3 | AM-13 `TemplateSummary.contractKind` | complete | Tipe kini wajib `string \| null` (register AM-13); `toSummary` memetakan `t.contractKind ?? null` |
| 4 | Urutan galat R02 400 -> 404 | complete | `createTemplateVersionV2Core`: templat dibaca tanpa melempar (`findTemplateOrNull`), CH-06 + SR-06 dinilai, baru `TEMPLATE_NOT_FOUND`. Templat tidak ada: isu CH-06 `dependentRequired` (bergantung sumber daya) tidak dinilai; `maxContains`/`const` (badan murni) tetap 400 |
| 5 | R19 | complete (tanpa perubahan) | Route R19 tidak diubah DC-29; urutannya sama dengan sebelum DC-29: bentuk `studio.skeleton/v1` 400 di route -> `getTemplateV2` 404 -> aturan SR-06/CH-06 layanan. Dipatok uji |
| 6 | SECTION_REGISTRY_VERSION | dinilai, tidak diubah | Pemakai: `prisma/seed-studio.ts:211,1458,1485` (nilai kolom informatif `registryVersion`) dan R03 `sections` `meta.version` (informatif). Tidak ada pembanding versi, invalidasi cache, atau kontrak register yang mewajibkan kenaikan (register 05 tidak memuat `registryVersion`); menaikkan akan menulis ulang 51 baris section type lama (D-385/DC-29) |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| C:\Users\TRIAL\gsp-swarm-hq-v2.1\src\lib\studio\contract\types\api.ts | modify | AM-07 `contracts`; AM-13 `contractKind: string \| null` (wajib) |
| C:\Users\TRIAL\gsp-swarm-hq-v2.1\src\app\api\studio\registry\route.ts | modify | `contractsPayload` + case `contracts` + `ListKind` + komentar kepala |
| C:\Users\TRIAL\gsp-swarm-hq-v2.1\src\lib\studio\services\templates\index.ts | modify | `toSummary` contractKind; `findTemplateOrNull`/`templateNotFound` (findTemplate memakainya, pesan sama); `assertContractRecordSkeleton`/`assertTemplateV2Skeleton` parameter `templateKnown`; urutan di `createTemplateVersionV2Core` |
| C:\Users\TRIAL\gsp-swarm-hq-v2.1\tests\unit\studio\api\dc28-registry-contracts.test.ts | add | 14 uji: AM-07, R03 200/400/401, set register, AM-13 R01, urutan R02/R19 |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| typecheck | `npx tsc --noEmit -p .` | exit 0, 0 baris | dijalankan sesudah setiap suntingan |
| lint | `npx eslint <4 berkas di atas>` | exit 0 | |
| unit baru | `npx vitest run tests/unit/studio/api/dc28-registry-contracts.test.ts` | 14/14 | |
| unit area | `npx vitest run tests/unit/studio/api tests/unit/studio/api-structure tests/unit/studio/seed/dc29-ch06-template-save.test.ts` | 34 berkas, 831/831 | |
| unit studio penuh | `npx vitest run tests/unit/studio` | 123 berkas, 2933 lulus / 1 skip / 0 gagal | |

## Verification
- Asap :9021 GET templates (x-internal-secret lewat substitusi shell): 200, `laporan-kerja-agen` -> `agentWorkReport`, enam templat lain -> null (cid 4cbba7ee-5d91-4168-8f35-6efcc7107595).
- Asap :9021 kind tak dikenal `?kind=nope`: 400 REGISTRY_KIND_UNKNOWN (cid fca0c903-0e99-4360-97d3-598ddc485bc5); anonim 401.
- Asap :9021 `?kind=contracts`: BELUM LULUS — server menjawab 400 dengan daftar kind lama (cid 6a7ff726-2d01-4a39-abfe-ec0deec42baf), padahal chunk Turbopack hasil kompilasi (`.next/dev/server/chunks/[root-of-the-server]__6f4469b2._.js`) sudah memuat `"contracts"` dan `contractsPayload`. Modul route di memori proses dev basi; `touch` tidak memicu muat ulang. Perilaku yang sama dibuktikan di uji handler (200, 1 jenis, set status E45).

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| R03 kind=contracts di :9021 masih kode lama | 2 (tunggu 5 dtk; touch berkas) | Proses `next dev` (PID induk milik controller) tidak memuat ulang modul route registri; hasil kompilasi di disk sudah benar | Perlu restart DEV 9021 oleh controller lalu ulang asap | Ya untuk asap AC-21, tidak untuk kode |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 2 | Bentuk 200 register `{ kind, items }`; route lain `{ kind, count, items, meta }` | Ikut pola route (superset): `count` + `meta.kinds`/`meta.templateSlugs` |
| 3 | `contractKind` dijadikan wajib (register AM-13) | tsc 0; fixture lama tanpa kolom aman karena `?? null` |
| 4 | Templat tidak ada + slot contractRecord tunggal | 404 (syarat contractKind tidak dapat dinilai tanpa templat); dua slot/berulang tetap 400 |
| 5 | R19 SR-06 semantik tetap sesudah 404 (pra-DC-29) | Tidak diubah; bila controller ingin 400 SR-06 sebelum 404 di R19 juga, itu perubahan perilaku baru (bukan pemulihan) |

## Next Steps
- Controller: restart DEV 9021, lalu `GET /api/studio/registry?kind=contracts` (harap 200, items[0].kind agentWorkReport, statuses draft/complete/partial/blocked/needs-review). Review recommended: diff `services/templates/index.ts` (urutan R02).
