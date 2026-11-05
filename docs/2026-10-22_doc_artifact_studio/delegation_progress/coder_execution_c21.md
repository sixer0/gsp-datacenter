---
task_id: C21
task_slug: doc_artifact_studio
row: C21 (coverage round, GF-08 mechanism M2)
date: 2026-11-05
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/03_structured_datum_coverage_round.md
status: complete
---

# Implementation Report: C21 generic derived-preset step in the seed helper (GF-08, M2)

Skills loaded: `backend-execution`, `tdd`, `dry-run-verify-fix`. Inputs: research/38 §4.4, research/35 §6 M2 (a)-(e), D-609, D-627, D-635, `prisma/seed-studio-templates.ts`, `prisma/seed-studio.ts`, `prisma/seed-doc-type-templates.ts` (read only).

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Read blueprint row, register, spike, decisions, seed helpers, template service, access rule | done | `access.ts:233-235` (derived = ADMIN on a preset only); `services/templates/index.ts:913-929` (a preset may reference a preset) |
| 2 | Read-only DEV probe of the current state | done | `datum-gsp-preset` v2 pins 7 / 6.5 / 7.5 / trackEm 0.0923 (same as research/38) |
| 3 | Red: `c21-derived-preset-seed.test.ts` (22 tests) | done | failed at import (modules missing) |
| 4 | Green: helper, spec module, wiring | done | 22/22 green; mutation check (pin 7.8 -> 7) gives 3 failures, then restored byte-identically |
| 5 | Table width guards G1-G3 at 7.8 pt | done | see Verification |
| 6 | Dry-runs on DEV (one at a time) + a rolled-back idempotency probe | done | 0 writes |
| 7 | tsc, eslint, full suite | done | see Test Results |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| `prisma/seed-studio-templates.ts` | modify | `ensureSkeletonVersion` takes an optional `isPreset` (creates the template with `isPreset`; an existing template must have the same preset status; when the field is absent, behaviour is as before). New `DerivedPresetSpec`, `derivedPresetPlan` (validates pins: known key, valid value, not empty, slug different from its base), `derivedPresetStoredIssues` (isPreset, archived, restricted, baseVersionId, skeletonSha256, pins kept in the stored effective values), `ensureDerivedPreset` (base = latest version of `baseSlug`, ADMIN caller, idempotent). `runGuardedTemplateTx` gets the options `presets` / `buildPreset`: preset slugs join the guard targets; presets are built before the templates in the same transaction; the guard also requires every preset to be `storedOk`; duplicate target slugs fail before the transaction; the log carries `presets` and `guard.targets`. The summary has a `presets` field only when presets are given, so the contract and S27 summaries are unchanged. |
| `prisma/seed-derived-presets.ts` | add | Data-only spec table `DERIVED_PRESET_SPECS` (one row: `datum-gsp-rev-a-preset`, "GSP DATUM Rev A", base `datum-gsp-preset`, the 7-slot preset skeleton, pins 7.8 / 6.8 / 7.6 + trackEm 0.09). `withDerivedPresets(opts)` adds the table as presets and adds a `derivedPresets` count. No slug branching. |
| `prisma/seed-studio.ts` | modify | `runDocTypeTemplates` runs `withDerivedPresets(docTypeTemplateTxOptions(...))`. Header doc item 8 is extended. `PRESET_MIGRATIONS` is not edited (M2 (e)). |
| `tests/unit/studio/seed/c21-derived-preset-seed.test.ts` | add | 22 tests: spec = register, base = latest gsp preset, ADMIN caller, idempotent, new base version gives a new preset version, error paths, guard red cases (another template changed, preset written but not a target, preset storedOk false, frozen section types, duplicate target), contract/S27 summary shape kept, G1-G3 at 7.8 pt, 0 slug branches |
| `delegation_progress/file_claims.md` | append | One C21 claim line (wave convention) |

Not edited: `prisma/seed-doc-type-templates.ts` (C23), `src/**`, `benchmark/**`, `tests/integration/studio/uji-run.mjs`.

## Flag choice (justification)
I wired the preset into the existing `--doc-type-templates` flag instead of adding a new one:
1. C23 switches the 10 to this preset. `ensureDerivedTemplate` needs the preset to exist inside the same transaction.
2. research/35 §6 M2 (b) says the preset slug must be a target of the guarded transaction, otherwise `addedTemplates` fails. A separate flag would need two transactions in a fixed order.
3. C24's `uji-run.mjs` keeps working without edits. It reads `context.templates` only; presets are in their own `context.presets` field.
4. A re-run stays one command and idempotent.

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Unit (row) | `npx vitest run tests/unit/studio/seed/c21-derived-preset-seed.test.ts` | 22 passed | red first: import failure before the modules existed |
| Unit (seed dir) | `npx vitest run tests/unit/studio/seed/` | 6 files, 72 passed | s09/s26/s27 unchanged and green |
| Mutation | pin `tableNumerals.size` 7.8 -> 7, re-run | 3 failed / 19 passed | file restored, `diff` identical |
| Typecheck | `npx tsc --noEmit -p .` | exit 0 | tsconfig includes `**/*.ts` (prisma + tests) |
| Lint | `npx eslint prisma/seed-studio.ts prisma/seed-studio-templates.ts prisma/seed-derived-presets.ts prisma/seed-doc-type-templates.ts tests/unit/studio/seed/` | exit 0 | `npx eslint prisma/` shows 10 old `no-explicit-any` errors in `prisma/seed.ts`. That file is unmodified against HEAD and not owned by this row. |
| Full suite | `npx vitest run` (run 2) | 6 failed / 5086 passed / 26 skipped (287 files) | 4 = `tests/unit/agent-roster.test.ts` (reads real agent profiles on disk; untouched). 2 = `tests/unit/studio/renderers/engine-e-coverage-round.test.ts` (untracked file of a parallel row; passes alone and together with the seed dir: 7 files, 96 passed). Neither touches the seed files. |

## Verification

**DEV dry-run `npx tsx prisma/seed-studio.ts --doc-type-templates --dry-run`** (DB `gsp_agent_hq_v21`): exit 0, empty stderr, 0 secrets in the output (grep for `postgres://` / `password` = 0).
- Preset: `datum-gsp-rev-a-preset` outcome `created`, `isPreset` true, versionNo 1, storedOk true, storedIssues [].
  - Base: `datum-gsp-preset` v2 (`cmvue8kfk0001v1usfrh1fb94`) = the latest version.
  - Stored effective pins: 7.8 / 6.8 / 7.6 / 0.09. The base has 7 / 6.5 / 7.5 / 0.0923. So the derived pins survive resolution in the real service.
  - All 4 pins are on the advanced layer. `skeletonSha256` is `3fab117d…`, the same as `datum-gsp-preset` and `datum-kanonik-preset`.
- The 10 doc-type templates: all `unchanged`, versionNo 2, storedOk, preset still `datum-gsp-preset` v2 (switching is C23).
- Guard: `ok` true. Targets = the preset + the 10. `otherTemplates` 7, `changedTemplates` [], `addedTemplates` [], `sectionTypesTouched` [].
- Section types: create 0 / update 0 / unchanged 52.
- The 7 other rows have the same latest version, paramsSha256 and skeletonSha256 as recorded in `otherTemplatesBefore`. Examples: `datum-gsp-preset` v2 `21f4e1e7…`; `laporan-kerja-agen` v1 `8f98fb0f…`.
- Counts inside the transaction: templates 18, derivedPresets 1. After rollback, "Hitungan DB": 17 templates, preset absent, so 0 writes.
- The only warning is the known canonical `registryInSync` false (research/38 §8, line 408).

**Idempotency against the real service** (a rolled-back probe on DEV with an explicit DB check; nothing committed): `ensureDerivedPreset` twice in one transaction gives run1 `created`, then run2 `unchanged`. Both storedOk, versionNo 1/1, same paramsSha256. Templates 17 before and after, 0 preset rows after.

**DEV `--contract-templates --dry-run`**: exit 0, guard ok. `laporan-kerja-agen` unchanged v1 `8f98fb0f…`, otherTemplates 16, changed/added [], section types unchanged 52. The plan has no `presets` field (same shape as before). 17 templates after.

**DEV `--presets-and-skeletons --dry-run`**: exit 0, both guards ok. `datum-kanonik-preset` unchanged v1, `datum-kanonik` unchanged v6, `datum-gsp-preset` unchanged v2 `21f4e1e7…`, `datum-gsp` unchanged v3. 17 templates after.

**Not run**: `--doc-type-templates` without `--dry-run` (the controller does the DEV reseed) and `--import-manual000-v2`. No commits.

**Table width guards G1-G3 at 7.8 pt** (`engine/docx/tables/render.ts:188`, `guards.ts`, `widths.ts`, `lint/scan/index.ts:119`):
- G1 (cell count per row) and G2 (sum of explicit widths = an allowed width) do not read the numeral size.
- G3 width cap: `guardWidthsMm` calls `solveWidthsImpl(matrix, rem)` without a numeral size, so it uses `DEFAULT_NUMERALS_PT` = 7.8. The renderer solves with the template value (`render.ts:188`).
  - Today the presets use 7, so the renderer and guard widths can differ.
  - At 7.8 they are the same. Test: `solveWidthsImpl(m, 128|166, 7.8)` equals the default call.
- G4 (sub-check of G3): the floor grows linearly with the size (0.6 em per character + 2 mm; 1.651 mm per character at 7.8 against 1.482 at 7).
  - The solver raises numeral columns to the same floor, and the lint passes the same param to `tableGuards`, so the check stays consistent.
  - 7.8 is also the registry default and what the `datum-kanonik` family resolves today.
  - Test: a dot-grouped financial table at 128 and 166 mm gives G1, G2 and G3 PASS, and the G4 floors are met.
- Conclusion: 7.8 pt keeps G1-G3 valid.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| `tests/unit/agent-roster.test.ts` 4 failures | 0 (out of scope) | reads the real agent profile directory on this machine (environment drift) | open, not owned by C21 | no |
| `prisma/seed.ts` 10 eslint `no-explicit-any` | 0 (out of scope) | old code, unmodified against HEAD | open, not owned by C21 | no |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| Wiring | New flag or `--doc-type-templates` | `--doc-type-templates` (see "Flag choice"): same transaction, preset first, C24 needs no change |
| Spec | trackEm 0.09 is "recommended" in research/38 | pinned, per D-635 ("+ tracking kepala tabel 0,09") |
| Skeleton | Derived preset skeleton source | spec `slots` = `DATUM_SKELETON_SLOTS` without knobs (the same source as `datum-gsp-preset`); the sha is equal on DEV |
| Reuse | Separate preset writer or reuse | reused `ensureSkeletonVersion` with an optional `isPreset`; existing callers are unaffected (field absent) |
| Brief vs blueprint DB | Blueprint row says `gsp_agent_hq_v21_uji`; the brief says DEV `gsp_agent_hq_v21` | followed the brief (DEV, dry-run only); the uji fresh-seed is C24 |
| Evidence | Re-run idempotency cannot be shown by a dry-run alone | a rolled-back probe on DEV (2 calls in one transaction, always rolled back, DB name checked): created then unchanged, 0 rows after |

## Next Steps
- C23: set `presetSlug` of the 10 to `datum-gsp-rev-a-preset` (spec table only). The guard and ordering are already in place. The expected dry-run is 10 new versions + 1 preset created.
- C24: the fresh-seed on uji should show the preset `created` then `unchanged`. `uji-run.mjs` needs no change: it checks `context.templates`, and presets are logged under `context.presets`.
- Review recommended (scope: the `runGuardedTemplateTx` target set and `ensureSkeletonVersion` `isPreset`).
