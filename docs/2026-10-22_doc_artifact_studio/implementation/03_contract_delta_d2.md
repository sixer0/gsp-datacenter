---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: INT-D (delta kontrak S03-d2; IP-07 + bagian kontrak/layanan IP-23; tambahan D-89)
date: 2026-10-23
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/masterplan/01_specs.md
status: complete
---

# Implementation Report: delta kontrak S03-d2 (INT-D)

Skills: backend-execution, dry-run-verify-fix (0 siklus perbaikan; satu skrip cek diulang karena resolusi path ESM Windows, bukan galat kode). Semua perubahan ADITIF: anggota union baru, medan opsional, ParamDef baru, ekspor baru. Tidak ada tipe/medan/kunci yang diganti nama atau dihapus. `CANONICAL_REQUIRED_BY_TIER` dipindah definisinya ke registri dan diekspor ulang dari `profile.ts` dengan nilai identik (impor lama tetap sah).

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Klaim path (`file_claims.md`, prefiks INT-D) | complete | tindakan pertama, append |
| 2 | Baseline: tsc, eslint, doc.json, template.json + registri, figur S94 (+ fixture S63 untuk D-89) | complete | cadangan berkas area di scratchpad |
| 3 | IP-07a ParamDef `lint.enforcementOverride` | complete | R-35, kelas K, `map`, default `{}` |
| 4 | IP-07b kode galat `FORBIDDEN` (403) | complete | S102 tidak disentuh (catatan untuk INT-E) |
| 5 | IP-23 `SectionPlan.order` + `CANONICAL_REQUIRED_BY_TIER` di registri | complete | + helper murni `orderedPlanSections` |
| 6 | Selaraskan `01_specs.md` §5.7, §6.3, §8.1, §8.2 I40 | complete | 4 blok "Revisi d1/d2", 0 baris lama diubah |
| 7 | D-89 (pesan controller): `sld?: { multiBus?: boolean }` di `studio.diagram/v1` | complete | tipe + skema |
| 8 | Seed kanonik | complete (tanpa tulis) | sudah sinkron: v3 dibuat seed INT-I setelah R-35 mendarat |
| 9 | Penjaga akhir | complete | lihat Test Results |

## Delta

| ID | Berkas | Perubahan |
|---|---|---|
| IP-07 / D-70 | `params/render.ts`, `params/index.ts` | R-35 `lint.enforcementOverride`: `type: "map"`, default `{}`, `class: "K"`, `chapter: "Bab 16"`, `namespace: "lint"`, `ruleRef: "D-34"`. Bentuk = yang dibaca S46 `engine/lint/structure/enforcement.ts:25,66-82` (`ENFORCEMENT_PARAM_KEY`, `{checkId: "block"\|"release"\|"report"\|"off"}`); mode di `classNote` (tanpa `enum`, agar editor S58 tetap memakai JsonControl, `param-control.tsx:341`). `PARAMS_RENDER_COUNT` = `RENDER_PARAM_COUNT` 34 -> 35 |
| IP-07 / D-72 | `contract/enums.ts`, `contract/errors.ts` | `FORBIDDEN` -> 403 (sesi sah, peran tidak berhak). 401 tetap `UNAUTHORIZED`; kelas K tetap `PARAM_CLASS_K_FORBIDDEN` |
| IP-23 / D-76 | `contract/types/params.ts` | `SectionPlan[tier].order?: readonly string[]` |
| IP-23 | `services/templates/profile.ts` | `validateSectionPlan` menerima `order`: kunci asing -> `PARAM_UNKNOWN_KEY`; bukan larik / ganda / tidak tercantum di required-optional-forbidden tier -> `SCHEMA_INVALID`; disimpan di rencana hasil. Simpan/muat: `composeVersion` menyimpan rencana tervalidasi (dengan `order`) ke `StudioTemplateVersion.sectionPlan`, muat apa adanya (index.ts tidak perlu diubah). Profil kanonik tidak mengisi `order` (digest kanonik tetap) |
| IP-23 | `registry/sections.ts` | `CANONICAL_REQUIRED_BY_TIER` (sumber tunggal; hanya `import type`, aman-klien) + `orderedPlanSections(entry)` (order lalu urutan registri). `profile.ts` mengekspor ulang. `SECTION_REGISTRY_VERSION` tidak diubah (isi 51 section tetap) |
| D-89 | `contract/types/diagram.ts`, `contract/schema/diagram.schema.ts` | `DiagramSldOptions { multiBus?: boolean }`; `StudioDiagramV1.sld?`; skema `sld: {type: object, properties: {multiBus: boolean}, additionalProperties: false}` (dibaca `engine/diagram/layout-c/sld.ts:41-44`) |

## Hitungan registri

| Hitungan | Sebelum | Sesudah |
|---|---|---|
| Katalog / renderer kontrak | 673 / 34 | 673 / 35 |
| ALL_PARAMS / PARAMS_BY_KEY / id unik | 707 | 708 |
| resolvedParams kanonik (+1 turunan) | 708 | 709 |
| STUDIO_ERROR_CODES / peta HTTP | 40 / 40 | 41 / 41 |
| Default gagal validasi sendiri | 0 | 0 |
| ROLE_KEYS, SECTION_REGISTRY | 70, 51 | 70, 51 |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| src/lib/studio/params/render.ts | modify | R-35, komentar kepala, hitungan 35 |
| src/lib/studio/params/index.ts | modify | RENDER_PARAM_COUNT 35 |
| src/lib/studio/contract/enums.ts | modify | + `FORBIDDEN` |
| src/lib/studio/contract/errors.ts | modify | `FORBIDDEN: 403` |
| src/lib/studio/contract/types/params.ts | modify | `SectionPlan.order?` |
| src/lib/studio/contract/types/diagram.ts | modify | `DiagramSldOptions`, `sld?` (D-89) |
| src/lib/studio/contract/schema/diagram.schema.ts | modify | properti `sld` (D-89) |
| src/lib/studio/registry/sections.ts | modify | `CANONICAL_REQUIRED_BY_TIER`, `orderedPlanSections` |
| src/lib/studio/services/templates/profile.ts | modify | ekspor ulang daftar wajib; `order` di `validateSectionPlan` |
| docs/2026-10-22_doc_artifact_studio/masterplan/01_specs.md | modify | +52 baris, 0 baris lama berubah (diff vs cadangan: 0 `<`) |

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | sebelum 21 galat, 0 di `src/lib/studio`; sesudah 21 galat, 0 di `src/lib/studio` | 21 = pra-ada `src/app/*` (orchestration 9, information-library 5, dispatch-kpi 3, user-access 3, information-library/propose 1; IP-17) |
| Lint | `npx eslint src/lib/studio/contract src/lib/studio/params src/lib/studio/services/templates src/lib/studio/registry/sections.ts` | exit 0 (sebelum dan sesudah) | |
| doc.json | `npx tsx benchmark/extract/validate_doc.ts` | `VALID studio.doc/v1`, exit 0 | |
| template.json | skrip registri (scratch `check_template.ts`) | 82 override, 0 asing, 0 isu nilai, ADMIN 0 / USER 4 (K, sama dengan d1), roleFormats 70/70; `loadResolvedProfileFile` 709 kunci, 0 diabaikan | identik dengan baseline kecuali +1 kunci |
| Figur S94 | `npx tsx benchmark/manual000/figures/tools/validate_figures.ts` | exit 0, `LOLOS` (spec 20/20, blok 52/52) | |
| Fixture S63 | `npx tsx tests/parity/fixtures/src/validate_fixtures.ts` | `HASIL: LOLOS (0 kegagalan)` sebelum dan sesudah D-89 (diagram 10 spec) | |
| Delta d2 | skrip scratch `check_delta.ts` | 21/21 PASS | order sah/parsial/absen, asing, ganda, tak tercantum, bukan larik, medan asing lain tetap ditolak, simpan+muat lewat `composeVersion`, helper urutan, ekspor ulang identik, R-35 (K, map, `{DATUM-09: release}` sah, USER ditolak K, ADMIN sah), S46 `resolveEnforcement` membaca override profil, default `{}` = 0 override 0 penolakan, FORBIDDEN 403 |
| Skema sld (D-89) | skrip scratch `check_sld.ts` (ajv strict, `STUDIO_SCHEMA_LOAD_ORDER`) | 6/6 PASS | tanpa sld, `multiBus: true`, `{}` diterima; string, medan asing, bukan objek ditolak |
| Seed | `ensureCanonicalTemplate({ createdBy: "controller-int-d", syncRegistry: true })` | `{created:false, synced:false, stale:false, versionNo:3}` | lihat Verification |

## Verification

- Seed: sha registri kini `b5d0d9256745c7e102b1cca472865a3533b12a124f8d95aa5b6c59bf443d853c` = `paramsSha256` datum-kanonik v3 (709 kunci, memuat `lint.enforcementOverride: {}`), provenans `registri params sha256:70ec99004c6ebe37` = `registryDigest()` kini. v3 dibuat `seed-studio` 2026-10-22T18:06:12Z (klaim INT-I atas `prisma/seed-studio.ts`), 68 detik setelah R-35 mendarat (render.ts 18:05:04Z), lalu dipin 1 revisi `int-a-smoke`. Tidak ada versi baru yang perlu ditulis; v1 (699, sha 3d6e5fba...) dan v2 (708, sha 854d3452...) tidak disentuh. Perubahan sesudah 18:06 (FORBIDDEN, order, daftar wajib, sld) tidak memengaruhi parameter maupun rencana kanonik.
- Aditif: diff terhadap cadangan hanya menghapus komentar, konstanta hitungan (dinaikkan), definisi konstanta yang dipindah (nilai identik, diekspor ulang), dan satu kondisi `f !== "requiredPresets"` yang diperluas.

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| - | - | - | tidak ada | tidak |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| 3 | Tempat ParamDef non-renderer | id R-35 (`origin: "contract"`, `group: "R"`, dihitung di renderer kontrak, D-24) dengan `chapter: "Bab 16"` agar editor S58 menampilkannya di bab gerbang rilis |
| 3 | `enum` pada tipe `map` | tidak dipasang: `validateParamValue` mengabaikan enum untuk map dan editor S58 memakai JsonControl; validasi mode tetap di S46 (`STRUCT-ENFORCEMENT`) |
| 4 | S102 masih 403 `UNAUTHORIZED` | tidak disunting (bukan area); dicatat untuk INT-E/IP-08 |
| 5 | Semantik `order` | urutan tampil saja; kunci daftar yang tidak disebut menyusul dalam urutan registri; kanonik tanpa `order` |
| 5 | Validasi route S54 (`templates/_lib/validate.ts`) | meloloskan `order` apa adanya (tidak menolak medan tambahan); validasi ketat di layanan S49 |
| 6 | §5.5 dan §3.6 tidak termasuk seksi yang boleh disunting | `order` dicatat di blok §8.1 (`ResolvedTemplate.sectionPlan`); `sld` (D-89) belum tercatat di §3.6 — controller memutuskan |
| 8 | Seed sinkron sebelum INT-D memanggilnya | panggilan INT-D idempoten, tanpa tulis |

## Next Steps

- S59 (`components/studio/section-composer/model.ts`): ganti cermin lokal dengan impor `CANONICAL_REQUIRED_BY_TIER` dari `@/lib/studio/registry/sections`, kirim `order` per tier, muat memakai `orderedPlanSections`.
- S58: baca `?paramFilter=` (bagian UI IP-23, bukan area INT-D).
- INT-E: R11 `render-env` refresh non-admin -> 403 `FORBIDDEN`.
- S95 (opsional): `lint.enforcementOverride: {"DATUM-09": "release"}` di `benchmark/manual000/template.json` (S46 `benchmarkSafetyOverrides`).
- Controller: §3.6 (`sld`) dan §5.5 (`order`) di `01_specs.md` bila ingin register lengkap.
