---
task_id: DC-23
task_slug: doc_artifact_studio
row: DC-23
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/07_document_contract_blueprint.md
status: complete
---

# Implementation Report: R23 POST /api/studio/drafts/check (+ D-375 I54 di CLI, + D-378 glue R08 bersama)

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca register §9/§9.3/§9.6/§11, D-369/D-372/D-373, CLI DC-22, R08, pola R21/import | complete | |
| 2 | Logika bersama CLI/R23 `services/draft/check.ts` (fungsi baru) | complete | DC-21 extract/json-locate tidak diubah; `index.ts` hanya ditambah ekspor |
| 3 | Route R23 + `_lib/dry-run.ts` | complete | |
| 4 | CLI diselaraskan ke orkestrasi bersama (AC-19) | complete | perilaku remote/emit/CLI sama |
| 5 | D-375: cek lokal `items[].key` -> I54 (`services/draft/contract-local.ts`), posisi berbasis 1 | complete | |
| 6 | D-378 (1): uji "langkah 6b" di `dc22-draft-check.test.ts` ke posisi berbasis 1 | complete | input uji ikut disahkan (status, reportedAt, item lengkap): dengan payload minimal lama I54 melapor isu CH lebih dulu sehingga EC27 tidak tercapai; hanya uji itu yang disentuh |
| 7 | D-378 (2): glue dry-run R08 diekstrak ke `src/app/api/studio/validate/_shared/dry-run.ts`, dipakai R08 dan R23 | complete | dipindah apa adanya; R08 hanya kehilangan definisi dan mendapat impor |
| 8 | Uji, tsc, eslint, asap :9021 ulang | complete | |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/app/api/studio/drafts/check/route.ts | add | R23: 401 -> 415/413(DR-09 bodyBytes)/400 -> 413 DR-09/DR-10 -> 429 (validate, 1 tagihan per blok yang di-dry-run, semua sebelum dry-run) -> 200 T2-70; `withQuotaHeaders`, `failFrom`, x-correlation-id, log `DRAFT_CHECK` |
| src/app/api/studio/drafts/check/_lib/dry-run.ts | add | cabang badan v2 tingkat atas R08 memakai glue bersama; galat yang di R08 menjadi HTTP 4xx (403, kedalaman >64, P2002) -> isu blok; `currentRevisionNoOf` (findUnique baca saja) |
| src/app/api/studio/validate/_shared/dry-run.ts | add | dipindah dari R08: `HARD_CODES`, `isUserError`, `SubmitPreview`, `ValidateBody`, `draftRoleFormats`, `withoutDraftFields`, `buildPreviewV2`, `attachPreview`, `rebaseIssues`, `submitPreviewOf`, `validatePartialV2`, `validateV2Submission`, `v2RoleFormatsIssue`, `draftTemplateMisplaced` |
| src/app/api/studio/validate/route.ts | modify | definisi di atas dihapus dan diimpor dari `_shared/dry-run`; handler, `validateDocument`, dan jalur v1 tidak berubah (diff tanpa baris impor = 0) |
| src/lib/studio/services/draft/check.ts | add | `prepareDraftCheck`, `completeDraftCheck`, `staleBasisIssue`, `rejectedDryRun`, `applyDryRun`, `finalizeDraftResult`, `draftLimitMessage` |
| src/lib/studio/services/draft/contract-local.ts | add | `draftContractIssues` = I54 (isu CH dulu, lalu EC27 positions 1-based); `LOCAL_CONTRACT_KIND` |
| src/lib/studio/services/draft/index.ts | modify | ekspor tambahan saja |
| scripts/studio/draft-check.ts | modify | `checkDraftRemote` lewat `completeDraftCheck`; `contractStructureIssues` = `draftContractIssues` (TODO(DC-07) hilang); pesan 413 bersama |
| tests/unit/studio/api/dc23-drafts-check-route.test.ts | add | 18 uji (galat, 413 x3, 429 tanpa dry-run, kuota, DR-08, FORBIDDEN, 0 tulis DB, 7 kasus AC-19 dengan handler R08 asli, 2 uji I54) |
| tests/unit/studio/draft/dc22-draft-check.test.ts | modify | uji "langkah 6b" saja: positions [1, 3] |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| R08/validate + R23 + draft | `npx vitest run` atas 9 berkas yang mengimpor `validate/route`/`validate/_shared`, + `tests/unit/studio/draft` + dc23 | 11 berkas, 430/430 | |
| api + dryrun + import | `npx vitest run tests/unit/studio/api tests/unit/studio/api-structure/dryrun.test.ts tests/unit/studio/import` | 38 berkas, 916/916 | |
| Typecheck | `npx tsc --noEmit -p .` | berkas DC-23: 0 | total 2 galat, keduanya di `tests/unit/studio/renderers/dc12-contract-record-html.test.ts` (agen paralel) |
| Lint | `npx eslint src/app/api/studio/drafts src/app/api/studio/validate src/lib/studio/services/draft scripts/studio/draft-check.ts tests/unit/studio/api/dc23-drafts-check-route.test.ts tests/unit/studio/draft` | exit 0 | |

## Verification
- Asap :9021 sesudah ekstraksi (rahasia lewat substitusi shell; nilai rahasia muncul 0 kali di keluaran): tanpa rahasia 401. Draf ke `cmvuiisx200abv11g8zv2x1ue` (rev 9): d1 valid 200 `valid:true` (cid 59fabcee-9bbd-4469-830b-012ea6d5a355); d2 JSON rusak 200 DR-03 baris 7 (cid de481536-2ee6-4174-9fd9-4003cb390fb1); d3 basis @rev3 200 DR-08 baris 4 (cid 9dc9b135-f276-443a-af05-c71b64d6029c). CLI `--remote --json` exit 0/1/0.
- diff R23 vs CLI: mentah 4 baris berbeda per draf, hanya `lastFilledAt`/`at` (jam dry-run; dua panggilan R08 langsung juga berbeda, 11:50:08.127Z vs 11:50:09.235Z). Dengan jam disamarkan: 0 baris untuk ketiga draf.
- R08 langsung sesudah ekstraksi: kunci respons `valid, issues, lint, completenessPreview, submitPreview`, `submitPreview.revisionNo` 10 (sama seperti sebelumnya).
- Hitungan 21 tabel Studio* sebelum = sesudah (asap pertama dan ulang).

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| tsc 2 galat di `dc12-contract-record-html.test.ts` | 0 | agen paralel | dicatat | tidak |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 3 | Tagihan KD-43: "per blok berisi JSON sintaksis sah" vs D-373 "hanya blok tanpa galat ekstraksi di-dry-run" | ditagih per blok yang DI-DRY-RUN (alasan KD-43 "setiap blok = satu dry-run R08"); draf tanpa blok sah tanpa tagihan/header kuota |
| 3 | Identitas per blok | caller dry-run = agentId blok (seperti R08 lewat CLI), cadangan agentId badan R23; bucket pakai identitas terautentikasi |
| 3 | 413 badan > bodyBytes terjadi sebelum parse (400) | tak terhindarkan; 400 bentuk mendahului 413 maxChars/maxBlocks dan 429 |
| 5 | Jenis kontrak mode lokal tanpa DB | `CONTRACT_KINDS[0]` (agentWorkReport, satu-satunya jenis tahap 1); ditinjau bila jenis kedua didaftarkan |
| 5 | EC27 pada R23 | R23 = dry-run R08; posisi 1-based mengikuti I54 begitu DC-08 memasang I54 di gerbang |
| 7 | Lokasi glue bersama | `validate/_shared/dry-run.ts` (bersebelahan `error-issues`, `v2-kit`, `template-draft`); `isPrismaUniqueOn` tetap salinan kecil di R23 karena `route-kit` tidak mengekspornya |

## Next Steps
- Review recommended: R23 + `validate/_shared/dry-run.ts` (ekstraksi R08) + `services/draft/{check,contract-local}.ts`.
