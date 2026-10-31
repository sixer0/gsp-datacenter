---
task_id: FIX-QB
task_slug: doc_artifact_studio
row: FIX-QB (FIX-R40-2 + FIX-R40-3 + FIX-R40-4; review DC-40 #2, #3, #4, #5)
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/gateway_check/12_review_document_contract.md (:57-:59); decisions D-373, D-375, D-386, D-399; register masterplan/05_document_contract_specs.md §5.6, §10 FN-02, AC-19
status: complete
---

# Implementation Report: FIX-QB konsolidasi kontrak (CW-01 R08, isCalendarDay, pemeta I54, SQL I61)

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| FIX-R40-2 | CW-01 ke respons R08 cabang `studio.doc/v2` | complete | Dokumen baru: `IngestResultV2.contractWarnings` kini dibaca `validateV2Submission`. Dokumen yang ada: `dry.result.warnings` disalin ke `contractWarnings`. Respons R08 mendapat `warnings?: SubmitWarningV2[]` (hanya bila tidak kosong; pointer diberi prefiks seperti isu). Medan `contractWarnings` DIPERTAHANKAN karena kini punya pembaca. |
| FIX-R40-3a | Satu `isCalendarDay` | complete | Definisi tunggal diekspor dari `services/contracts/dates.ts` (+ barrel). `import/contract/parse.ts` dan `render/final-name.ts` (validStamp) memakainya; `query/filters.ts isCalendarDate(s)` tetap (API publik, uji dc14) tetapi kini hanya regex + `isCalendarDay`. |
| FIX-R40-3b | Satu pemeta I54 + aturan EC27 | complete | `summarizeContractChecks` (berkas baru `services/contracts/issues.ts`, diekspor dari `index.ts`) dipakai `by-construction.ts checkContractTargets` dan `draft/contract-local.ts draftContractIssues`. Aturan tunggal = aturan gerbang: isu CH semua payload menekan EC27; EC27 hanya yang pertama. |
| FIX-R40-4 | `${FINAL_DOC_NUMBER_MAX}::int` + uji paritas | complete | `docNumberSafeSql(expr)` diekspor dari `query/contracts.ts`, dipakai `queryContracts`; C52 terparameter; langkah 5 I61 (kosong -> `DOC`) ditambahkan (`coalesce(nullif(...,''),'DOC')`). |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/lib/studio/services/ingest/v2.ts | modify | `contractWarnings` diisi juga di cabang dokumen yang ada; JSDoc pembaca |
| src/app/api/studio/validate/_shared/dry-run.ts | modify | `ValidateBody.warnings`; salin `result.contractWarnings` (prefiks pointer) |
| src/lib/studio/services/contracts/dates.ts | modify | `isCalendarDay` diekspor (sumber tunggal) |
| src/lib/studio/services/contracts/issues.ts | add | `summarizeContractChecks` (pemeta isu + aturan EC27 tunggal) |
| src/lib/studio/services/contracts/index.ts | modify | ekspor `isCalendarDay`, `summarizeContractChecks` + tipe |
| src/lib/studio/services/import/contract/parse.ts | modify | salinan `isCalendarDate` dihapus, impor `isCalendarDay` |
| src/lib/studio/services/query/filters.ts | modify | `isCalendarDate` memakai `isCalendarDay` |
| src/lib/studio/services/render/final-name.ts | modify | `validStamp` memakai `isCalendarDay` |
| src/lib/studio/services/ingest/by-construction.ts | modify | `checkContractTargets` lewat `summarizeContractChecks` |
| src/lib/studio/services/draft/contract-local.ts | modify | `draftContractIssues` lewat `summarizeContractChecks` |
| src/lib/studio/services/query/contracts.ts | modify | `docNumberSafeSql` terparameter + langkah 5; dipakai prafilter docNumber |
| tests/unit/studio/api/fixqb-r08-contract-warnings.test.ts | add | R08 doc/v2 baru + dokumen yang ada, CW-01 |
| tests/unit/studio/contracts/fixqb-contract-issues.test.ts | add | satu isCalendarDay, satu pemeta, lokal = gerbang (5 kasus dua payload) |
| tests/unit/studio/query/fixqb-docnumber-safe-sql.test.ts | add | parameter C52; paritas SQL = TS 14 fixture + `queryContracts` 10 dokumen, tx ROLLBACK di v21 |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| typecheck | `npx tsc --noEmit -p tsconfig.json` | exit 0 | repo penuh |
| lint | `npx eslint <11 berkas src + 3 uji>` | exit 0 | |
| uji baru | `npx vitest run tests/unit/studio/**/fixqb-*` | 3 berkas, 18/18 | uji R08 gagal 3/5 bila perubahan FIX-R40-2 dibalik (dicek dengan `git apply -R`, lalu dipulihkan) |
| terarah | dc05/dc07/dc08/dc09/dc14/dc15/dc17/dc21/dc22/dc23/dc24/fixc2/dcwire*/fixqb | 20 berkas, 309/309 | |
| penuh | `npx vitest run tests/unit/studio` (sekali) | 140 berkas lulus; 3144 lulus, 3 expected fail, 1 skip; exit 0 | 146 dtk |

## Verification
- R08 doc/v2 refs[].pid pensiun: `out.warnings[0].code === "CONTRACT_REF_PID_RETIRED"`, pointer `/sections/record/refs/0/pid` (prefix `/spec` -> `/spec/sections/...`); dokumen yang ada: `SubmitResultV2.warnings` muncul sebagai `warnings`; tanpa peringatan -> medan absen.
- grep `function isCalendar(Day|Date)` di src+scripts: hanya `contracts/dates.ts:22 isCalendarDay` (+ pembungkus string `query/filters.ts:111 isCalendarDate` yang memanggilnya). grep `ganda pada posisi`: hanya `contracts/issues.ts:37`. grep `contractWarnings`: penulis `ingest/v2.ts`, pembaca `dry-run.ts:255`.
- Paritas SQL = TS: 14/14 fixture (termasuk `---`, `''`, `...` -> `DOC`; 120 karakter; unicode/emoji; tab/baris baru), `queryContracts` menemukan 10/10 dokumen fixture lewat bentuk aman; `current_database() = gsp_agent_hq_v21`; satu transaksi dilempar ROLLBACK; sesudahnya 0 dokumen fixture, 0 tabel sementara. URL DB tidak dicetak.
- Asap :9021 AC-19 (next dev repo, kode baru): satu draf bab ke dokumen cmvuz5jlk0020v1jg9vekh7rp; CLI `--remote http://127.0.0.1:9021 --agent-id cod-fixqb --json` exit 0 vs R23 `{markdown, agentId:"cod-fixqb"}` HTTP 200 (cid 55fc0ea6-8c7e-4e3e-a6bc-bff367413667); medan jam (`lastFilledAt`, `at`, 7 kemunculan) disamarkan -> diff 0 baris; `lastFilledBy: agent:cod-fixqb` di keduanya. Rahasia hanya lewat substitusi shell, tidak dicetak.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| (tidak ada) | | | | |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| FIX-R40-2 | Medan `contractWarnings` dihapus atau dipakai? | Dipakai (kini dibaca R08 dan diisi kedua cabang); tidak dihapus. Respons R08 doc/v2 memakai medan tingkat atas `warnings` (bab/slot tetap `submitPreview.warnings`, AM-08) -> controller/DC-33: amandemen register 05 §5.6 (:422) dan §13 AM-08 untuk cabang dokumen. R23/CLI tidak meneruskan medan ini (keduanya sama; AC-19 tetap). |
| FIX-R40-3 | Berkas baru `services/contracts/issues.ts` (tidak tercantum eksplisit di kepemilikan) | Dibuat karena `index.ts` adalah barrel murni dan `validate.ts` di luar daftar; berkas baru tidak dimiliki agen lain. |
| FIX-R40-3 | Perubahan perilaku tepi | (a) Draf lokal: blok dengan > 1 payload kini mengikuti aturan gerbang (isu CH di payload mana pun menekan EC27; maksimal satu EC27) - disengaja, lokal = R08. (b) Impor `parse.ts` dan filter R21 kini menerima tahun 0000-0099 yang sah (dulu `Date.UTC` memetakan ke 1900-an dan menolaknya); kini sama dengan I54 `isContractDate`. |
| FIX-R40-4 | Langkah 5 I61 (kosong -> `DOC`) tidak ada di SQL lama | Ditambahkan agar paritas penuh; tanpa itu fixture `---`/`''`/`...` berbeda. |
| FIX-R40-4 | Uji DB di suite unit | Mengikuti pola SR-45 (`api-structure`): memeriksa `current_database()` lebih dulu, satu tx ROLLBACK, sisa 0. |

## Next Steps
- Controller: amandemen register 05 untuk R08 cabang dokumen `warnings` (lihat Issues & Decisions).
- Review direkomendasikan (lingkup: 11 berkas src di atas + 3 uji fixqb).
