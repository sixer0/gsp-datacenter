---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: C06, C07 (blueprint identification/03_structured_datum_coverage_round.md:184-185)
date: 2026-11-05
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/03_structured_datum_coverage_round.md
binding: research/38 (names register), research/35 §5 C-1..C-12, verification/30 R1/R2, D-631, D-635
status: complete
---

# Implementation Report: C06 registry params + enum additions + category rows; C07 text-table entries

Skills loaded: `tdd`, `dry-run-verify-fix`. All work was test-first: the new tests were run and seen red before the code, then green. Nothing was committed and nothing was written to the DB (the seed runs were dry-runs, rolled back). No ports were opened.

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Read register research/38, spike research/35 §5, probe verification/30 R1/R2, D-631, D-635, research/39 rules | done | Register is the only source of names, defaults and texts |
| 2 | Pre-state baseline compare | done | `compare: 8/8 SAME`, 0 INFO lines |
| 3 | C06 test written (red: 20 of 21 failed) | done | `tests/unit/studio/registry/c06-coverage-round-params.test.ts` |
| 4 | R-67..R-80 in `render.ts`, counts, advanced surface IDs, the two enum edits | done | Test green, 21/21 |
| 5 | Count pin (fixtl) and canonical sha pin (s11) | done | sha recomputed: `dcb7166b...`. The DEV seed dry-run printed the same value independently |
| 6 | U02/UX pins updated first (red: 9 failed), then the 7 mapping rows | done | Lainnya 0; 52/52 green |
| 7 | C07 tests in the parity file (red: 9 failed), then the `texts.ts` entries | done | 39/39 green (parity + s13) |
| 8 | Gates: tsc, eslint, studio suite, baseline, convert_v2 x3, three seed dry-runs | done | All pass (section Test Results) |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| `src/lib/studio/params/render.ts` | modify | Appended R-67..R-80 exactly as research/38 §1.2: class B (the `r()` default), no `derive`, explicit `namespace`, plus enum/range, classNote, ruleRef and source from §1.2. Header comment. `PARAMS_RENDER_COUNT` 45 -> 59 |
| `src/lib/studio/params/index.ts` | modify | `RENDER_PARAM_COUNT` 45 -> 59 (`ALL_PARAM_COUNT` 802; `CATALOG_PARAM_COUNT` stays 722) |
| `src/lib/studio/registry/essentials.ts` | modify | `...ids("R-", [67, 80])` appended to `PARAM_SURFACE_LISTS.advanced` (C-1) |
| `src/lib/studio/params/page.ts` | modify | `device.spine.placements` enum + `"sampul belakang"` (default unchanged). New `COVER_CONTROL_FIELD_ENUM = [...COVER_CONTROL_FIELDS, "KLASIFIKASI"]` used as the P4V-12 enum, so `COVER_CONTROL_FIELDS` stays the default (C-6 split) |
| `src/components/studio/template-editor/param-categories.ts` | modify | 7 rows (D-635 (1), research/38 §1.4): R namespaces `controlSheet`->lembar-kendali, `cover`->sampul, `device`->kepala-kaki, `naming`->penomoran-klasifikasi; `render.<seg>` `rhythm`->halaman-grid, `nota`/`ruleIndex`->penomoran-klasifikasi. Sub-group labels not relabelled (the relabel in the register is optional) |
| `src/lib/studio/engine/front/texts.ts` | modify | C07 entries (research/38 §3): `WRAPPER_TEXT.controlSubtitle`; `CONTROL_SHEET_COLUMN_LABELS` (13 identifiers); `CONTROL_SHEET_STATUS_TEXT` (current/superseded); `CONTROL_FIELD_LABELS.KLASIFIKASI` = reference to `FRONT_PAYLOAD_LABELS.classification` (that const moved above `CONTROL_FIELD_LABELS`, unchanged content); `CLASSIFICATION_LINE_SEPARATOR` {ID `" : "`, EN `": "`} + pure helper `classificationLineText`; `RULE_INDEX_TEXT` (title/columns/source/empty). C-6 companion: the `controlBlockRowsText` fallback (was `texts.ts:259`, `Object.keys(CONTROL_FIELD_LABELS)`) now reads the registry default list `CONTROL_FIELDS_DEFAULT` through `registryDefault(...)`, **before** the KLASIFIKASI label was added. No caller of any new entry |
| `tests/unit/studio/registry/c06-coverage-round-params.test.ts` | add | 21 tests: per key id/type/default/enum/range/class B/no derive/group/origin/namespace/scope/advanced/not in knobs/no C-4 prefix; C-8 default and opt-in values validate, out-of-range rejected; absent vs explicit default resolve to identical param maps; none in `COMPOSE_PARAM_KEYS` (R-69 joins it in C10); counts 59/802/722; enum additions with defaults unchanged and constant split |
| `tests/unit/studio/registry/s11-doc-typecode-nda.test.ts` | modify | Canonical sha pin `a18d36ea...` -> `dcb7166bc12ab7d6c34906b376a7da6d7562f0d8c1d70ea81a3fd4b396a5dfd9` (R2), with history comment |
| `tests/unit/studio/renderers/fixtl-toc-levels-roles.test.ts` | modify | Count pin 45/788 -> 59/802 (CRLF file, endings kept) |
| `tests/unit/studio/renderers/fix2-wrapper-text-parity.test.ts` | modify | `WRAPPER_TEXT` key pin + `controlSubtitle`; new describe "C07 tabel teks ronde cakupan" (9 tests: every entry equals the register literally; column labels cover the registry `controlSheet.*.columns` defaults; KLASIFIKASI is the same object as the payload label; C-6 absent path unchanged and still without a classification row; classification line ID/EN; rule-index labels; language safety §3.8) |
| `tests/unit/studio/ui-categories/param-categories.test.ts` | modify | Per-category counts (research/38 §1.4 totals), 802 total, advanced 380, surfaces [21, 380, 72, 329], R keys 66 -> 80, sub-group counts; new test for the 7 rows and the 14 key categories |
| `tests/unit/studio/ui-categories/preview-param-tools-categories.test.ts` | modify | 788 -> 802; Sampul search 22 -> 24 |
| `tests/unit/studio/ui-categories/ux-simplification.test.ts` | modify | `penomoran-klasifikasi` advanced `flat` true -> false (see Issues & Decisions) |

Not touched: compose/engine readers, `COMPOSE_PARAM_KEYS` / `NORM_COMPOSE_PARAM_KEYS`, `SECTION_REGISTRY`, `prisma/seed-doc-type-templates.ts`, `scripts/studio/mcp/**`, the plan, `decisions.md`.

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | exit 0, no output | |
| Lint | `npx eslint` on the 13 changed source/test files | exit 0 | |
| Unit | `npx vitest run tests/unit/studio` | `Test Files 265 passed (265)`, `Tests 4820 passed (4820)`, exit 0 | Log `C:/tmp/c06_vitest.txt`. Note: this suite includes `api-structure/*`, which writes temporary fixtures to DEV `gsp_agent_hq_v21` and deletes them again (`tests/unit/studio/api-structure/_db.ts:1-5`). This is how the gate has always run (D-636 ran it the same way) |
| Baseline byte gate | `npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root C:/Users/TRIAL/gsp-swarm-hq-v2.1 --out C:/tmp/bl_c06 --inputs .../datum-rev-a-baseline/inputs --compare C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline` | exit 0, `compare: 8/8 SAME`, exactly 4 `INFO compose snapshot` lines (`a_terbit_datum_gsp`, `b_nota_datum_gsp`, `a_terbit_datum_kanonik`, `b_nota_datum_kanonik`) | Log `C:/tmp/c06_baseline.txt`. R1 cause confirmed: `render_report.json` kanonik `versionId` = `file:dcb7166bc12ab7d6:fe847233` = the first 16 hex of the new canonical sha (gsp `file:91452c267a0e050e:fe847233`) |
| convert_v2 | `npx tsx benchmark/extract/convert_v2.ts --check`, run 3 times | each exit 0, SAME x3: doc.v2 `79290e07...`, template.v2 `882057c5...`, preset `a951b149...` | Logs `C:/tmp/c06_conv_{1,2,3}.txt` |
| Seed dry-run | `npx tsx prisma/seed-studio.ts --presets-and-skeletons --dry-run` | exit 0, "Dry-run preset/kerangka selesai; transaksi di-rollback"; datum-kanonik preset v1 / template v6 unchanged, guard.ok true; datum-gsp preset v2 / template v3 unchanged, guard.ok true | |
| Seed dry-run | `... --contract-templates --dry-run` | exit 0, "... (0 tulis)"; laporan-kerja-agen v1 unchanged; guard.ok true, changed [], added [], sectionTypesTouched [] | |
| Seed dry-run | `... --doc-type-templates --dry-run` | exit 0, "... (0 tulis)"; all 10 unchanged v2, storedOk, skeleton match; guard.ok true, changed [], added [] | |
| Seed compare | Field-by-field diff of my three summaries against the C02 "before" summaries (`gsp-backups/c02-registry-probe/before/`, same extractor) | **1 differing field per run**: `$.canonicalWarn.registryParamsSha256` `a18d36ea...` -> `dcb7166b...`. `registryInSync` stays false. Section-type plan, warnings and per-template sha are identical (no new default-validation warning, C-8) | Logs and summaries `C:/tmp/c06_seed/`. `--import-manual000-v2` was **not** run |

## Verification

- 14 keys with the exact ID, type, default, enum/range, namespace, scope and surface of research/38 §1.2: `c06-coverage-round-params.test.ts` 21/21 green (it was red before the code).
- `ALL_PARAMS.length` = 802 and Lainnya = 0: `param-categories.test.ts` green. The per-category totals equal research/38 §1.4 (10/24/25/57/40/50; advanced 380).
- Absent ≡ default at resolution: `resolveParams` with no overrides equals `resolveParams` with all 14 defaults explicit (whole map `toEqual`). Absent ≡ today's bytes: baseline 8/8 SAME (DOCX + HTML).
- Enum additions keep the defaults: tested, and the canonical sha (which hashes defaults) agrees between the pin and the seed.
- C07 strings equal research/38 §3 byte for byte: the parity test's literal tables. Entries have no caller, so the baseline is SAME and the absent-path control block is pinned unchanged.
- Old templates unchanged in all three DEV dry-runs; the only differing field is `registryParamsSha256`.

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| none | - | - | - | - |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| 6 | The advanced Penomoran & klasifikasi category grows 8 -> 11 settings across several sub-groups (`naming`, `render`, ...). Under the unchanged D-632 rule (`showSubgroups`: >1 sub-group and > `SUBGROUP_FLAT_MAX_SETTINGS` = 8) it now shows its sub-group level in the advanced view, where before it was flat | Pin updated to `false` with a comment. The rule was not changed. **Controller note:** this is a visible UI consequence of D-635 (1). If a flat view is wanted, raising the threshold is a UI decision, not part of this row |
| 6 | Optional sub-group relabels in research/38 §1.4 (`render` in Halaman & grid and Penomoran) | Not applied. The labels are the UX workstream's final D-632/D-633 wording; the new keys sit under the existing labels. Easy follow-up if wanted |
| 7 | KLASIFIKASI label added in C07 (brief), although the blueprint lists the label for C15 too | The C-6 fallback switch landed first (registry default list), so the absent path cannot pick the label up. Until C15 adds the value, a template that lists KLASIFIKASI still prints no row (tested). C15 now only needs the value entry and its test |
| 7 | `FRONT_PAYLOAD_LABELS` moved above `CONTROL_FIELD_LABELS` | Needed for the by-reference entry (TDZ). Content unchanged; `write-client.ts` imports by name and is unaffected |
| 7 | NOTA line in helper form `classificationLineText(classification, lang)` next to the separator constant | Register §3.7 defines the composition; a pure helper keeps C16 from re-deriving it. No caller |
| - | R-69 is compose-read (C-5) but not added to `COMPOSE_PARAM_KEYS` / `NORM_COMPOSE_PARAM_KEYS` | Per the brief ("nothing reads them yet", no reader edits), and research/38 §9 leaves it to C06 or C10. My test checks none of the 14 is in the list today. C10 must add R-69 to both lists and adjust that one assertion in `c06-coverage-round-params.test.ts` ("C-5" test) |

## Next Steps

- C08-C28 readers per the register. C10: R-69 into both compose key lists, plus the one-line test adjustment noted above.
- Review recommended (scope: `render.ts` R-67..R-80, `page.ts` enum split, `texts.ts` C07 block, `param-categories.ts` rows), together with the round's other engine rows.
