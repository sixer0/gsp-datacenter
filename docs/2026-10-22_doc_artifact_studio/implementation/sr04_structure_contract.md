---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: SR-04
date: 2026-10-23
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/05_structural_sections_blueprint.md (baris SR-04); register masterplan/03_structural_sections_specs.md
status: complete
---

# Implementation Report: Kontrak struktur v2 (SR-04, penulis tunggal contract/**)

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Klaim path di `file_claims.md` (prefiks SR-04) | complete | 5 baris |
| 2 | Enum E26-E43 + 24 kode galat + peta HTTP | complete | `STUDIO_ERROR_CODES` 44 → 68 |
| 3 | Konstanta C18-C28, C32, C33a-c; route R12-R20; id skema SID01-SID05 | complete | `studioRoutePath` + `pid` |
| 4 | Alamat `F:<slotKey>[/n]`, `ParamDef.surface/scope`, DeriveFnId, `NormUnitKind` + slot, `RenderContext` slot/scope/draft, `RegistryKind` | complete | aditif |
| 5 | Tipe `types/v2/*` T2-01..T2-60c + `CompletenessSummary` | complete | 9 berkas |
| 6 | JSON Schema `schema/v2/*` common/v2 + SID01-SID05 | complete | strict ajv |
| 7 | Medan terlarang C29-C31 + pemeta `classifySchemaV2Errors` | complete | lokasi dari struktur kiriman |
| 8 | Verifikasi + tanggapan `file_requests.md` + marker | complete | |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/lib/studio/contract/enums.ts | modify | E26-E43; 24 kode EC01-EC24 |
| src/lib/studio/contract/errors.ts | modify | HTTP EC01-EC24 |
| src/lib/studio/contract/env.ts | modify | C18-C28, C32, C33a-c; R12-R20; `studioRoutePath` pid; `STUDIO_SCHEMA_IDS` 10 |
| src/lib/studio/contract/address.ts | modify | `F:` slotKey (C18); `FrontSlotKey`, `FRONT_PAGE_KEYS`, `isFrontPageKey` |
| src/lib/studio/contract/engine.ts | modify | `RenderContext.slots/scope/draft`; `RenderScope`; `ResolvedSlot` |
| src/lib/studio/contract/types/params.ts | modify | `ParamDef.surface?`, `scope?`; 12 DeriveFnId |
| src/lib/studio/contract/types/model.ts | modify | `NormUnitKind` + `"slot"` |
| src/lib/studio/contract/types/api.ts | modify | `RegistryKind` + presets/essentials/slots/paramScopes |
| src/lib/studio/contract/index.ts | modify | ekspor v2; `STUDIO_JSON_SCHEMAS` + 5; `STUDIO_SCHEMA_LOAD_ORDER` + 6 |
| src/lib/studio/contract/types/v2/{common,doc,chapter,slot,template,norm,completeness,api,index}.ts | add | tipe kontrak v2 |
| src/lib/studio/contract/schema/v2/{common,doc,chapter,slot,template,skeleton}.schema.ts | add | JSON Schema v2 |
| src/lib/studio/contract/schema/v2/forbidden.ts | add | C29-C31 + `classifySchemaV2Errors` |
| docs/…/implementation/05_structure_contract_landed.md | add | marker (daftar ekspor + contoh) |
| docs/…/delegation_progress/coder_execution_sr04.md | add | catatan baris |
| docs/…/delegation_progress/file_claims.md, file_requests.md | modify (append) | klaim; 6 baris tanggapan/permintaan |

`contract/schema/chart.schema.ts` tidak disentuh. Medan `x` tetap milik IP-41d.

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | exit 0 | seluruh repo, 0 galat |
| Lint | `npx eslint src/lib/studio/contract` | exit 0 | |
| Skrip ajv | `npx tsx <scratchpad>/verify_sr04.ts` | 54 PASS, "SEMUA LULUS", exit 0 | lihat Verification |
| Unit (terdampak) | `npx vitest run tests/unit/studio/api/http-errors.test.ts` | 111/112 lulus; 1 gagal | patok 41 kode sudah usang sejak FIX-1 (44); dirutekan ke SR-42 |

## Verification
- **Kompilasi strict:** 10/10 id skema terkompilasi dengan `STUDIO_AJV_OPTIONS` (v1 tetap lulus).
- **Contoh valid (ajv):** E0 `studio.doc/v2` (dokumen kosong), E1 (7 slot GSP DATUM), E2 `studio.chapter/v2` (bab 3, image, table, assetRef 64 heksa), E3a `studio.chapter/v2` (bab 5, `baseRevisionNo` 4), E3c `block`/`change`/`render` (lewat `$defs` BlockV2, ChangeV2, RenderRequestV2), slot controlSheet `studio.slot/v2`, templat SL-01..SL-07 `studio.template/v2`, `studio.skeleton/v1`: semua PASS.
- **Varian E1 bermedan `format`:** `{"pointer":"/sections/content/chapters/0/sections/0/blocks/0/format","keyword":"additionalProperties","checkId":"DISPLAY_FIELD","message":"medan tampilan tidak diterima; tampilan diatur templat"}`.
- **Varian `blockId`:** `checkId:"V1_FIELD"`, `"medan v1 tidak diterima di v2; pakai id"`. Juga PASS: `run.b` → V1 (strong), `cover.kicker` → V1 (tagline), `front` → V1, `caption.label` → DF-53, blok `spacer` → DF-60, role `kicker` → DF-61, `overrides` → DF-41, `image.widthMm` → DF-21.
- **Sapuan DF-01..DF-62:** 62/62 menghasilkan DISPLAY_FIELD (bukti awal PT-01; uji penuh tetap milik SR-44).
- **parseAddress round-trip PASS:** `F:cover`, `F:controlSheet`, `F:toc`, `F:signature`, `F:cover/2`, `F:references`, `F:references/1`, `F:appendices`, `3.2.3`, `Tabel 2.1`, `A.1.1`. Ditolak: `F:References`, `F:references/0`, `F:`, `F:a-b`.
- **Hitungan:** `STUDIO_ERROR_CODES` 68; `STUDIO_ERROR_HTTP` 68 kunci dan EC01-EC24 sesuai §11.2; `STUDIO_ROUTES` 20; `STUDIO_SCHEMA_IDS` 10; DF 52 + 10; VF 14.
- **Pindai statis PT-02/PT-06** (SID01-SID03 + common/v2): satu-satunya temuan adalah `u` di `DiagramSpecV2.nodes[]` (lihat Issues). Tidak ada `params`, `overrides`, `essentials`, `advanced`, `roleFormats`, atau nama berpola kunci parameter.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| `http-errors.test.ts:84,86` mematok 41 kode | 0 (bukan berkas SR-04) | Uji usang sejak FIX-1 (enum 44); SR-04 menaikkan ke 68 | Dirutekan ke SR-42 via file_requests | Tidak |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 6 | Register bertentangan dengan dirinya sendiri: T2-27 mempertahankan `nodes` diagram apa adanya, termasuk `u` (unit rak, dibaca `engine/diagram/layout-c/rack.ts:24`), tetapi DF-08 `u` bersifat global (PT-02) | `u` DIPERTAHANKAN di `DiagramSpecV2` agar isi diagram rak tidak hilang. **needs-review** controller/SR-55: kecualikan `DiagramSpecV2.nodes[].u` dari PT-02, atau ganti nama (butuh SR-01) |
| 6 | `sld` (D-89, opt-in tata letak) tidak ada dalam daftar sisa T2-27 | Dikeluarkan dari `DiagramSpecV2` (ikut register; tata letak = templat) |
| 7 | `schemaPath` ajv tidak memuat nama `$defs` untuk `$ref` yang dikompilasi terpisah (probe: `#/additionalProperties`) | `classifySchemaV2Errors` menentukan lokasi dari struktur kiriman (`locateSchemaV2Object`) |
| 6 | Pola kunci bab C33a/C33b, target tepat-satu-cara, duplikat `structure.order`, dan aturan SKELETON_* | Sengaja tidak ada di skema, agar kode galat register (422 / 400 `DOC_TARGET_AMBIGUOUS` / checkId SKELETON_*) keluar dari layanan |
| 4 | Nama DeriveFnId: register DV-01 `pageSizeFromPaper` vs research/09 `pageSizeFromKnob` | Keduanya ada di union. SR-60 sudah memakai keduanya; permintaan SR-05 untuk membuang `pageSizeFromKnob` ditolak (tsc). Penyatuan = putusan controller |
| 5 | Nama tambahan di luar register (+): `CompletenessSummary` (+ 2 subtipe, diminta brief D-163/D-164), `SlotSetup` dan `multiEnum` (diminta SR-05), `classifySchemaV2Errors`/`locateSchemaV2Object`/`AjvErrorLike`/`SchemaV2RootId`/`DisplayFieldLocationRule`/`V1FieldRename`, `FrontSlotKey`/`FRONT_PAGE_KEYS`/`isFrontPageKey`, `isNormSnapshotV2`, konstanta skema `*_V2_SCHEMA_ID`/`*V2Schema`/`commonV2Ref`/`docV1Ref`/`templateV2Ref`/`BLOCK_V2_DEFS`/`SLOT_PAYLOAD_V2_DEFS` | Perlu ratifikasi controller (gaya S03-d1); semua tercantum di marker |
| 5 | `CompletenessSummary` memakai `chapters.<slotKey>` (KD-15), sedangkan tipe lokal FIX-4a memakai `content` | FIX-4a/SR-30 menyelaraskan `buildRailSegments` |
| 3 | Registrasi `"studio.doc/v2"` membuat runner SR-34 menganggap kontrak siap | Ingest v2 tetap SR-12. Dicatat di marker |

## Next Steps
- Controller: ratifikasi nama (+); putuskan pengecualian `u` (PT-02) dan penyatuan `pageSizeFromKnob`/`pageSizeFromPaper`.
- SR-27: tambahkan `common/v2` ke dokumen skema R03. SR-42: perbarui patok 41 → 68.
- Review recommended: `senior-code-reviewer` atas `src/lib/studio/contract/schema/v2/**` dan `types/v2/**` (kontrak bersama, 32 baris hilir).
