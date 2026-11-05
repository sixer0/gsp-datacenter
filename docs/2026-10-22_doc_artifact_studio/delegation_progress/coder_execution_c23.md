---
task_id: C23
task_slug: doc_artifact_studio
row: C23 (coverage round, spec-table opt-ins + Rev A base preset)
date: 2026-11-05
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/03_structured_datum_coverage_round.md
status: needs-review
---

# Implementation Report: C23 spec-table opt-ins (research/38 §4) and Rev A base preset

Skills loaded: `backend-execution`, `tdd`, `dry-run-verify-fix`. Inputs: research/38 §1.2, §3.5, §4.1-§4.4; D-606, D-627, D-635, D-639, D-640; `coder_execution_c21.md`; `coder_execution_engine_{a,b,c,d}.md`; `prisma/seed-doc-type-templates.ts`, `prisma/seed-derived-presets.ts`, `prisma/seed-studio-templates.ts`, `src/lib/studio/params/{page,render}.ts` (read only).

Status note: everything in this row is done and verified. One test owned by C21 fails on purpose: `c21-derived-preset-seed.test.ts`, "templat jenis dokumen belum dialihkan ke preset Rev A (itu C23)". C21 wrote it as a placeholder for this switch. The file is outside my ownership, so I did not edit it. The controller needs to flip that line (see Issues & Decisions).

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Read register §4, decisions, C21 and engine reports, registry defs | done | All 14 keys and both enum values (`sampul belakang`, `KLASIFIKASI`) exist in the registry (C06) |
| 2 | Claim paths in `file_claims.md` | done | one C23 line |
| 3 | Red: s26 test extended (6 new tests, first test's expected layer + preset updated) | done | 7 failed before the seed edit, for the expected reasons (missing export, old preset, missing keys) |
| 4 | Green: data-only edit of `prisma/seed-doc-type-templates.ts` | done | s26 16/16 |
| 5 | Mutation check | done | EN layer given `bab1` + DASAR swapped into the field list: 4 s26 tests fail. File restored byte-identically (`cp` back) |
| 6 | S29 usage parity | done | 2 expected detector failures (compose-stored template params), fixed by a TEMPLATE_OWNED rule. Preset modelling made faithful (Rev A pins); 3 new assertions |
| 7 | tsc, eslint, slug-branch grep, DEV dry-run, full suite | done | see below |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| `prisma/seed-doc-type-templates.ts` | modify | `DOC_TYPE_PRESET_SLUG` changed to `"datum-gsp-rev-a-preset"` (the C21 `DERIVED_PRESET_SPECS` row; every spec reads it as `presetSlug`). New exported constant `ENGINE_E_LAYOUT_OPT_INS = true`, which gates `render.rhythm.snapToBaseline` and `render.rail.reserveColumn` together through one conditional spread. When false, both keys are absent, so the registry default `false` applies. New `SHARED_OPT_INS` (spread into `SHARED_LAYER`) holds the register §4.1 values. Optional data field `layer?: ParamRecord` added to `DocTypeLayer` and `LanguageLayer`. STD layer: `render.ruleIndex.fromMarkers` true. NOT layer: `render.nota.classificationLine` true and `naming.file.form` "judulTanggalIso". ID language layer: preparer unit "Divisi Engineering PT GSP" and `device.registerBlock.sheetNumbering` "bab1". EN language layer: preparer unit "Engineering Division, PT GSP". `composeSpec` merges `{...SHARED_LAYER, ...type.layer, ...lang.layer, identity keys}`. No key is in two layers. No slug or type branching. Docblocks cite manual lines and decisions |
| `tests/unit/studio/seed/s26-doc-type-template-specs.test.ts` | modify | Literal register expectations (`SHARED_EXPECTED`, `TYPE_EXPECTED`, `LANG_EXPECTED`). The first test now expects the Rev A preset and the full layer. The AC-6 EN test now ignores enum-valued params: `KLASIFIKASI` is a field identifier, and its printed label comes from `CONTROL_FIELD_LABELS` per language. New describe "C23" with 6 tests: base preset = C21 row (base `datum-gsp-preset`); scoping (NOTA-only, STD-only, ID-only, all-10); type/language values live in the layer data fields, each key in one layer; one engine-E constant, both keys written once; no layer value equal to what the template resolves without it (Rev A preset effective, else registry default), except the two D-606 keys; register opt-ins survive `derivedTemplatePlan` into the stored overrides |
| `tests/unit/studio/compose/s29-usage-parity.test.ts` | modify | See "S29 changes" |
| `delegation_progress/file_claims.md` | append | one C23 claim line (status selesai) |

Not edited: `src/**`, other `prisma/**` files, `benchmark/**`, `tests/unit/studio/seed/c21-derived-preset-seed.test.ts`.

### S29 changes (each explained)
1. **Preset modelling (`presetParamsOf`).** The test used to resolve every template over the GSP DATUM profile, whatever its `presetSlug` was. It now adds the C21 pins when `spec.presetSlug` is a `DERIVED_PRESET_SPECS` row based on `datum-gsp-preset`. This is a data lookup, not a slug branch. Without it, the 10 would be checked against a base they no longer use. The `datum-gsp` comparator is unchanged (no pins).
2. **TEMPLATE_OWNED rule.** `/compose/(params|slotParams/<slot>)/(controlSheet.columns.form|cover.controlBlock.preparerUnit)` is now template-owned. These are the two C-5 compose keys (R-69, R-79; `COMPOSE_PARAM_KEYS`, D-639 (2)). Compose stores them in the snapshot only when they differ from the registry default. They are template parameters, not content. This was the only foreign-diff change: 16 paths per template, all these two keys. The content sha is still byte-identical to the comparator and to `datum-gsp` TERBIT.
3. **New assertions** in "keluaran milik templat": the 10 resolve `type.scale.tableNumerals.size` = 7.8 (Rev A) while the comparator stays at 7. The compose snapshot carries `controlSheet.columns.form` = manual and the per-language preparer unit. The comparator has no `controlSheet.columns.form` (C-5).

Not changed: issues, client warnings, lint findings, blocking, completeness and release status are still equal to the comparator for all 10. The DOCX render test (TOC field, logs equal to the comparator) and the seal-band colour test pass without edits.

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Unit (row, red) | `npx vitest run tests/unit/studio/seed/s26-doc-type-template-specs.test.ts` | 7 failed / 9 passed | before the seed edit |
| Unit (row, green) | same | 16 passed | |
| Mutation | EN `bab1` + DASAR in the list, re-run s26 | 4 failed / 12 passed | restored |
| S29 | `npx vitest run tests/unit/studio/compose/s29-usage-parity.test.ts` | 14 passed | first run after the seed edit: 2 failed (detector, explained above) |
| Seed dir + S29 + pair register | `npx vitest run tests/unit/studio/compose/s29-usage-parity.test.ts tests/unit/studio/seed/ tests/unit/studio/datum-conformance/pair-register-vs-seed.test.ts` | 93 passed / 1 failed | the 1 = C21 placeholder (by design). s27 slug-branch test green |
| Typecheck | `npx tsc --noEmit -p .` | exit 0 | |
| Lint | `npx eslint prisma/seed-doc-type-templates.ts tests/unit/studio/seed/s26-doc-type-template-specs.test.ts tests/unit/studio/compose/s29-usage-parity.test.ts` | exit 0 | |
| Slug/type branch grep | `grep -nE "slug\s*===\|slugBase\s*===\|typeCode\s*===\|language\s*===\|\.startsWith\(\|\.endsWith\(\|switch\s*\(" prisma/seed-doc-type-templates.ts` | 0 hits (exit 1) | |
| Full suite | `npx vitest run` | 5 failed / 5093 passed / 26 skipped (288 files) | 4 = `tests/unit/agent-roster.test.ts`: reads the real agent profiles on disk; failed before this row (also in the C21 report). 1 = the C21 placeholder. Also one file-level FAIL for `tests/unit/studio/renderers/zz-c22b-probe.test.ts`: a parallel row's transient probe that was gone after the run (`ls`: no such file) |

## Verification

**DEV dry-run** `npx tsx prisma/seed-studio.ts --doc-type-templates --dry-run` (DB `gsp_agent_hq_v21`): exit 0, empty stderr. Grep of stdout/stderr for `postgres://` and `password`: 0 each. Raw log was kept in the session scratchpad and is not committed.
- Preset `datum-gsp-rev-a-preset`: `created`, isPreset true, v1, storedOk true, storedIssues []. Base `datum-gsp-preset` v2 (`cmvue8kfk0001v1usfrh1fb94`). Pins 7.8 / 6.8 / 7.6 / 0.09 against base 7 / 6.5 / 7.5 / 0.0923. `skeletonShaMatchesSeed` true.
- The 10: all `new-version`, **v3**, storedOk true, storedIssues []. Each preset = `datum-gsp-rev-a-preset` v1 (the version created in the same transaction). storedOk checks that every layer key is kept in the stored effective params, so all opt-ins persist through the real template service.
- Guard: ok true. Targets = preset + the 10. otherTemplates 7, changedTemplates [], addedTemplates [], sectionTypesTouched []. The 7 others (`datum-gsp` v3, `datum-gsp-preset` v2, `datum-kanonik` v6, `datum-kanonik-preset` v1, `datum-manual-000` v4, `datum-manual-000-preset` v2, `laporan-kerja-agen` v1) are unchanged.
- Section types: create 0 / update 0 / unchanged 52.
- Counts inside the transaction: templates 18, docTypeTemplates 10, derivedPresets 1. The "Hitungan DB" after rollback has 17 templates, the 10 still at latestVersionNo 2, and no preset row, so **0 writes**. The final message is "Dry-run templat jenis dokumen selesai; transaksi di-rollback (0 tulis)", guardOk true.
- The only warning is the known canonical `registryInSync` false (research/38 §8; also in the C21 report).

**Acceptance checks:**
- Values equal the register: s26 first test (literal register objects, every slug) plus "opt-in register = nilai tersimpan rencana seed".
- NOTA/STD/ID-only scoping: s26 "lingkup" test (exact owner lists).
- No slug branching: grep 0 hits, s27 source test green, values only in data fields (s26 "medan data lapis").
- Base is the Rev A preset: s26 first test and "basis preset"; DEV dry-run shows preset v1 as base for all 10.
- Engine-E constant: s26 test (constant true, both keys true on all 10, each key literal written once, conditional spread on the constant).
- S29: valid, no new issues, only template-owned differences.

**Not run** (per the brief): `--doc-type-templates` without `--dry-run`, and `--import-manual000-v2`. No commits.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| `c21-derived-preset-seed.test.ts` placeholder "belum dialihkan ke preset Rev A (itu C23)" fails | 0 (not my file) | C21 pinned the pre-C23 state on purpose | open: controller to flip, see below | yes for "suite green"; no for the row's own gates |
| `tests/unit/agent-roster.test.ts` 4 failures | 0 (out of scope) | reads the real agent profile directory (environment drift) | open, not owned by C23 | no |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| C21 placeholder | The switch makes the C21 test at `tests/unit/studio/seed/c21-derived-preset-seed.test.ts:117-119` fail | **Needs controller action.** Proposed one-line flip (test title + value): `it('templat jenis dokumen dialihkan ke preset Rev A (C23)', () => { for (const s of DOC_TYPE_TEMPLATE_SPECS) expect(s.presetSlug).toBe(REV_A_SLUG); });` (`REV_A_SLUG` is already declared in that file at line 60). Either the controller applies it or authorises me to |
| "Remove shared-layer values that duplicate the preset or registry default" | Checked every layer value against what the template resolves without it (Rev A preset effective, else registry default; s26 test). None of the new C23 values is a duplicate. Only `layout.railMode` A and `table.zebra.minRows` 1000 equal the preset. They equalled it before this round too, and D-606 (b) / G-FIX1 kept them on purpose ("tuntutan manual menjadi data templat sendiri, tidak bergantung pada versi preset") | **Kept**, so a recorded decision is not reversed silently. The s26 test lists them as the only allowed exceptions (`D606_KEPT_EQUAL_TO_PRESET`). Controller option: remove both. That is output-neutral: the paramsSha changes, the resolved output does not. Then empty the exception list in s26. `org.entityName` equals the registry default, but it overrides the preset's mixed case, so it is not a duplicate. The identity keys `doc.language` / `doc.defaultTier` equal the default on some rows, but they are per-template NU-03 evidence and are outside the shared layer |
| Engine-E gate | One named constant was requested | `ENGINE_E_LAYOUT_OPT_INS` in `prisma/seed-doc-type-templates.ts`. Setting it to false removes both keys (absent = registry default false = pre-round output). After that edit, the s26 constant test must be updated |
| Field list | 8 or 9 fields | 8 fields with KLASIFIKASI third, without DASAR (D-635 (3), brief) |
| Spine placements | Preset pins `["margin luar sampul"]` | the 10 set `["margin luar sampul", "pembatas", "sampul belakang"]`, which keeps the registry's two placements and adds the back cover (brief, register §4.1) |
| Preset selection "as data" | Import `DERIVED_PRESET_SPECS` into the spec module, or a literal | Literal constant `DOC_TYPE_PRESET_SLUG`, cross-checked by s26 against the C21 row (`baseSlug` `datum-gsp-preset`). This keeps the spec module independent of the preset table's array order |
| AC-6 EN test | `cover.controlBlock.fields` contains the identifier `KLASIFIKASI` in EN templates | Enum-valued params are excluded from the "printed strings" scan with a stated reason: they are machine vocabulary, and the label comes from `CONTROL_FIELD_LABELS[...][lang]`. The registry default list already contains ID identifiers in EN templates |
| S29 scope | The brief allows expectation updates | I also changed how the preset is modelled (`presetParamsOf`) so the 10 are tested over their real base. Explained under "S29 changes" |

## Next Steps
- Controller: flip the C21 placeholder test (above); then reseed DEV (`--doc-type-templates`, expected: preset created, 10 x v3).
- C24: the fresh seed on uji should show the preset `created` then `unchanged`, and the 10 at v1 then unchanged.
- If engine E (C19/C20) reports layout problems: set `ENGINE_E_LAYOUT_OPT_INS = false` and update the s26 constant test.
- Review recommended (scope: `prisma/seed-doc-type-templates.ts` layer merge, s29 `presetParamsOf` and the new TEMPLATE_OWNED rule).
