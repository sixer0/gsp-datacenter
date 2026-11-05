---
task_id: GF08-GF21
task_slug: doc_artifact_studio
row: GF-08 + GF-21 follow-up (verification/22 revision 3 §9, C33 re-measure)
date: 2026-11-05
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/verification/22_datum_point_coverage.md (§9)
status: complete
---

# Implementation Report: GF-08 (Table 8.2 run sizes reach the DOCX) and GF-21 (rhythm side effects)

Skills loaded: `tdd`, `dry-run-verify-fix`. Inputs: verification/22 (revision 3 note, §9), `coder_execution_c21.md`, `coder_execution_c23.md`, `coder_execution_engine_e.md`, `engine/tokens/roles.ts`, `services/templates/index.ts:948-963`, `services/templates/profile.ts:583`, `benchmark/manual000/template.json` role formats, DEV role formats (read-only probe).

Nothing committed. No real DB writes: only `--dry-run` runs and one always-rolled-back probe on DEV `gsp_agent_hq_v21` (DB name asserted, counts checked after rollback).

## Summary

- **GF-08.** `datum-gsp-rev-a-preset` now carries its own role formats as data. The spec row has run-size patches for 6 roles: `caption`, `table.headerLeft`, `table.headerRight`, `controlTable.header`, `table.cellNumeralRight` and `table.cellMono`. The seed builds each role from the base preset's stored role format and replaces only the patched attributes.
  - The unchanged check now compares own role formats, and so does the stored-row check that feeds the guard.
  - **I found and fixed a stale-carry defect.** Derived templates are written without `roleFormats`. In that case the template service carries the previous version's own role formats over the new preset base, so the 10 templates would have kept the old sizes. I proved this against the real service with a rolled-back probe.
  - `datum-gsp-preset`, the other old templates and the Manual 000 import path are unchanged.
- **GF-21 (a).** Under R-74, captions, KEY lines and SOURCE lines keep their own exact leading: caption 220 tw = 11 pt. Only before/after move, so a one-line block ends on the 270 tw grid: caption 120/48/220 becomes 0/50/220. The DOCX tables, DOCX figures and the HTML apparatus share one function.
- **GF-21 (b).** Under R-74, the row's `trHeight atLeast` now covers the estimated wrapped lines, not just one line. The estimate uses the existing `textfit` widths and is built as a lower bound, so it never adds empty height.
  - Mono and Condensed cells are measured almost exactly.
  - Serif cells are a lower bound. A Serif row that wraps only slightly can still be missed and then grows off-grid, as before this change.

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Read evidence, seed helper, service role-format rule, engine role resolution, rhythm and apparatus code | done | |
| 2 | DEV read-only probe of stored role formats | done | `datum-gsp-preset` v2, `datum-gsp-rev-a-preset` v1 and `datum-laporan` v3 all carry caption run 15 / label 14, header 13, numeral-right 15, mono 14 (= `template.json`) |
| 3 | Red: `gf08-rev-a-role-formats.test.ts` | done | 10 of 12 failed before the code |
| 4 | Green: helper (`derivedPresetRoleFormats`, `ownRoleFormats` option, stored-row checks), spec data | done | 14/14. The C21 stub was extended to model role formats like the service |
| 5 | Red: `gf08-gf21-rev-a-render.test.ts` GF-21 (a) | done | 3 failed (DOCX table caption, figure apparatus, HTML caption) |
| 6 | Green: `snapApparatusPara` in DOCX tables, DOCX figures and HTML apparatus | done | Old engine-E / C22b expectations updated to the new rule (see Decisions) |
| 7 | Red: GF-21 (b) row test | done | `[540, 540, 540]` against the expected `[540, 810, 810]` |
| 8 | Green: `rowWrappedTw` | done | |
| 9 | Mutation checks | done | see Test Results |
| 10 | Gates: DEV dry-runs, rolled-back probe, baseline, convert_v2 x3, clash, suite, tsc, eslint | done | |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| `prisma/seed-derived-presets.ts` | modify | Rev A row: `roleFormatOverrides` (data only). caption `run`/`labelRun` szHalfPt 15; the three header roles szHalfPt 14 + spacingTw 12; `table.cellNumeralRight` and `table.cellMono` szHalfPt 16. The comment documents the rounding |
| `prisma/seed-studio-templates.ts` | modify | Types `RoleFormatPatch` and `DerivedPresetSpec.roleFormatOverrides?`.<br>`derivedPresetRoleFormats` (pure): base role + patched sub-objects. It rejects:<br>- an unknown role;<br>- a role or sub-object missing in the base;<br>- a role with no difference from the base;<br>- a patched `szHalfPt` that differs from the `catalogRoleFormat` size of that role at base values + pins (data cannot drift from the pins).<br>`ensureSkeletonVersion` option `ownRoleFormats`: when given, the definition always carries `roleFormats` (an empty map too) and the unchanged check compares own roles. When absent, behaviour is as before.<br>`ensureDerivedPreset` passes the planned own roles (or `{}`). `ensureDerivedTemplate` passes `{}` (no stale carry).<br>Stored-row issue `roleFormats` added to the preset check (own = plan) and the template check (own = none).<br>The preset report gains `roleFormatOverrides` and `roleSizes` (stored vs base `w:sz` per sub-object) |
| `src/lib/studio/engine/docx/blocks/rhythm.ts` | modify | `snapApparatusPara` (leading kept, before nearest, after padded to the grid); `rowWrappedTw` (wrapped-line row estimate, lower bound); header doc updated. `snapParaToBaseline` (headings) is unchanged |
| `src/lib/studio/engine/docx/tables/render.ts` | modify | The table caption and source-below use `snapApparatusPara`; row height uses `rowWrappedTw` (both only under R-74, depth 0) |
| `src/lib/studio/engine/docx/figures/figure.ts` | modify | 1 import + 1 call: figure caption/KEY/SOURCE use `snapApparatusPara`. **Outside the brief's file list**, see Decisions |
| `src/lib/studio/engine/html/tables/apparatus.ts` | modify | `snapped()` uses `snapApparatusPara`, so the HTML matches the DOCX |
| `tests/unit/studio/seed/gf08-rev-a-role-formats.test.ts` | add | 14 tests: spec, plan, catalog agreement, errors, created/unchanged/new-version, stored-row checks, no stale carry on derived templates |
| `tests/unit/studio/renderers/gf08-gf21-rev-a-render.test.ts` | add | 9 tests: GF-08 DOCX run sizes (with a control), GF-21 (a) DOCX table/figure + HTML, byte identity with R-74 off, GF-21 (b) wrapped rows |
| `tests/unit/studio/seed/c21-derived-preset-seed.test.ts` | modify | Stub: the base preset carries the Manual 000 role formats (as on DEV), and the fake service applies the service's role rule. No assertion changed |
| `tests/unit/studio/renderers/engine-e-coverage-round.test.ts` | modify | Figure apparatus expectation: before on the grid, one-line block on the grid, line = R-74-off line (was: line snapped to 270) |
| `tests/unit/studio/renderers/c22b-html-rail-rhythm.test.ts` | modify | HTML caption expectation 0/0/270 changed to 0/50/220 (`margin-bottom:2.5pt;line-height:11pt`) |
| `delegation_progress/file_claims.md` | append | One GF08-GF21 claim line |

Not touched: `prisma/seed-doc-type-templates.ts` (the controller's D-650 removal of `sheetNumbering` "bab1" is kept as is), `prisma/seed-studio.ts`, `datum-gsp-preset` data, `benchmark/**`, `PRESET_MIGRATIONS`.

## Rounding decision (half-points, GF-08)
`w:sz` holds half-points, so 7.6, 6.8 and 7.8 pt cannot be written exactly. I used the nearest half-point. That is the same rule as the catalog (`scaleRun`: `Math.round(size*2)`, `engine/tokens/roles.ts`) and the scorer (GF-07: kicker 6.8 pt = sz 14 +-1, `benchmark/datum_conformance/rules/expect_structure_b.ts:127`). The scorer has no automated GF-08 rule: GF-08 is a coverage item (`catalog.ts:161`).

| Table 8.2 | x2 | w:sz | printed | was (inherited) |
|---|---|---|---|---|
| caption 7.6 pt (text and identifier) | 15.2 | 15 | 7.5 pt | text 15, identifier **14** |
| header 6.8 pt Cond 600 caps | 13.6 | 14 | 7.0 pt | **13** |
| header tracking 0.09 em x 6.8 pt | 12.24 tw | 12 | | 12 (unchanged) |
| numerals 7.8 pt Mono (right + mono cells) | 15.6 | 16 | 8.0 pt | **15** / **14** |

The caption text run was already 15, so the visible caption change is the identifier: 7 pt becomes 7.5 pt. The catalog also gives the identifier the caption size (`ROLE_SPECS.caption.label`).

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Seed (row, red then green) | `npx vitest run tests/unit/studio/seed/gf08-rev-a-role-formats.test.ts` | 10 failed, then 14 passed | |
| Render (row, red then green) | `npx vitest run tests/unit/studio/renderers/gf08-gf21-rev-a-render.test.ts` | 3 failed, then 1 failed (rows), then 9 passed | |
| Seed dir | `npx vitest run tests/unit/studio/seed/` | 7 files, 92 passed | |
| Mutation A | table apparatus back to `snapParaToBaseline`, row estimate back to `rowSingleLineTw` | 2 failed (caption, rows) | file restored, `cmp` identical |
| Mutation B | `ownRoleFormats: {}` removed from `ensureDerivedTemplate` | 2 failed (stale carry) | restored, `cmp` identical |
| Full suite | `npx vitest run` | exit 0, `Test Files 292 passed / 1 skipped (293)`, `Tests 5155 passed / 26 skipped (5181)` | `C:/tmp/gf08/suite2.txt`. An earlier run showed 3 transient s26 failures from the controller's concurrent D-650 edit (files stamped 13:24:52); a re-run of the seed dir and the final full run are green |
| Typecheck | `npx tsc --noEmit -p .` | exit 0 | |
| Lint | `npx eslint <6 source files> <5 test files>` | exit 0 | |
| Branch grep | `git diff -U0 <6 files> \| grep slug===/typeCode===/language===/NOTA/TERBIT/SERAH` | 1 hit | The hit is C21's existing `spec.slug === spec.baseSlug` self-base check, not a slug literal |
| Baseline | `npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root C:/Users/TRIAL/gsp-swarm-hq-v2.1 --out C:/tmp/bl_gf08 --inputs .../inputs --compare C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline` | exit 0, `compare: 8/8 SAME`, exactly the 4 `INFO compose snapshot` lines | `C:/tmp/gf08/gate_baseline.txt` |
| convert_v2 | `npx tsx benchmark/extract/convert_v2.ts --check`, 3 runs | each exit 0, SAME x3 (doc.v2 `79290e07…`, template.v2 `882057c5…`, preset `a951b149…`) | `C:/tmp/gf08/gate_conv_{1,2,3}.txt` |

## Verification

**DEV `--doc-type-templates --dry-run`** (run again after D-650; `C:/tmp/gf08/dry_doctype2.out`): exit 0, empty stderr, 0 hits for `postgres://` and `password`.
- Preset `datum-gsp-rev-a-preset`: **new-version v2**, storedOk true, storedIssues [], base `datum-gsp-preset` v2.
  - Own roles = the 6 roles.
  - `roleSizes`, stored vs base: caption run 15/15, label 15/14; controlTable.header 14/13; headerLeft 14/13; headerRight 14/13; cellNumeralRight 16/15; cellMono 16/14.
  - Pins 7.8 / 6.8 / 7.6 / 0.09.
- The 10 templates: all **new-version v4**, storedOk true, storedIssues []. That includes the new role check: no own roles, so they hold the preset's new sizes. Preset = Rev A v2.
- Guard ok: 11 targets, 7 others, changed [], added [], section types touched []. Section types: 0 created / 0 updated / 52 unchanged.
- Counts inside the transaction: templates 18, docTypeTemplates 10, derivedPresets 1.
- After rollback ("Hitungan DB"): 18 templates, preset still v1, the 10 still v3. **0 writes.**
- Only the known `registryInSync` warning.

**DEV `--contract-templates --dry-run`**: exit 0, `laporan-kerja-agen` unchanged v1, storedOk true (the role check passes), guard ok, 0 writes.

**Rolled-back probe against the real template service** (DB asserted `gsp_agent_hq_v21`, always rolled back):
- Inside the transaction the Rev A preset became v2 with header 14.
- A `datum-nota` version written **without** `roleFormats` (the old seed path) on that preset got header **13** and mono **14**: stale carry.
- The fixed seed path (`ensureDerivedTemplate`) on `datum-laporan` got header **14** and mono **16**, storedOk true.
- After rollback: `datum-nota` v3, preset v1, 18 templates.
- This confirms the defect and the fix outside the stub.

**DOCX check of the rendered gate samples** (`render_cli`; baseline `a_terbit`/`b_nota` doc inputs; datum-gsp preset + Rev A pins/role formats from `derivedPresetRoleFormats` + R-74 + R-75; inputs in `C:/tmp/gf08/in`, outputs in `C:/tmp/gf08/out`):
- caption `w:before="0" w:after="50" w:line="220" w:lineRule="exact"`, runs sz 15/15;
- header runs sz 14;
- numeral Mono runs sz 16.

**Clash check** (`clash.py --docx … --work-dir C:/tmp/gf08`, hermes venv python `-I -B`):

| Sample | Clashes | Pages |
|---|---|---|
| a_terbit Rev A + R-74 + R-75 | 0 | 7 |
| b_nota Rev A + R-74 + R-75 | 0 | 4 |

Page counts are the same as engine E's runs.
- Extra sample: the parity fixture `doc_terbit_report` on the framePr rail shows 1 rail-chip overlap ("2026" against "TERUKUR ■", page 5).
- That overlap is pre-existing: the same clash appears with **no** opt-ins and **no** Rev A role formats (`C:/tmp/gf08/s/c_gsp_none.clash.json`), and with R-75 only, R-74 only and both.
- So it is not caused by this change. It is a fixture rail-stacking issue, listed under Persistent Issues.

**GF-21 (b) in the PDF** (`C:/tmp/gf08/s/revA_ID_wrap.pdf`, LibreOffice). Rule table with a 2-line Mono cell and a 2-line Serif cell; baselines:

| From | To | Pitch | Rows |
|---|---|---|---|
| header 359.5 | row 1 386.7 | 27.2 pt | 540 tw |
| row 1 386.7 | row 2 427.0 | 40.3 pt | 810 tw (2 lines) |
| row 2 427.0 | source 466.7 | 39.7 pt | 810 tw |

Before this change the wrapped rows were 610 tw = 30.5 pt, off the grid. LibreOffice broke the Mono cell after a hyphen ("SU-" / "03 SU-04"). That is consistent with the estimate allowing a break after "-" (lower bound).

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Serif cells that wrap only slightly can be missed by the row estimate | 0 (by design) | `textfit` has no IBM Plex Serif width table. Condensed widths are a lower bound: Serif is about 17 % wider on average and at least 0.96x per glyph, measured with PyMuPDF from `render-env/semibold-bundle/fonts/same`. Adding a Serif table would add new measurement data outside "existing measurement" | Such rows grow off-grid as before; rows are never over-padded. GF-21 is improved but **still partial** for this case | No |
| A caption that wraps to n lines ends (n-1) x 50 tw before the grid | 0 | `snapApparatusPara` does not know the line count (the adjust callback gets the format only) | Documented in code | No |
| Rail-chip overlap on page 5 of the parity fixture `doc_terbit_report` (framePr) | 0 | Pre-existing; present with every opt-in off and without Rev A roles | Not in this row's scope | No |
| HTML table rows are not snapped (C22b never snapped them) | 0 | Out of scope; the brief asks for HTML parity of the caption exclusion only | Unchanged | No |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| GF-08 path | Derive role-format sizes from `type.scale.*`, or write explicit preset role formats | Explicit role formats in the derived preset (safe path). Deriving would change the old templates, whose role formats pin explicit sizes. The plan step still checks that every patched size equals the catalog size of the pins |
| GF-08 data form | Full role objects, or attribute patches | Patches over the base's stored roles: only `szHalfPt` (+ the header tracking, equal to the base) is data. If a patched sub-object were missing in the base it would drop attributes, so that case is an error |
| GF-08 roles | Which roles | The verification/22 §9 list: caption, `table.headerLeft/Right`, `controlTable.header`, `table.cellNumeralRight`, `table.cellMono`. Not changed: `aside.label`, `table.groupBand`, `derivation.value`, TOC/part page numbers (they use the same scale elements but are not Table 8.2 table runs). Candidate for a later review |
| GF-08 caption identifier | Inherited 7 pt (sz 14) | 7.5 pt (sz 15) = Table 8.2 caption size, as the catalog derives it |
| Unchanged check scope | Compare role formats everywhere or only for derived rows | Only when `ownRoleFormats` is given (derived preset + derived templates). The Manual 000 import path keeps the old uncompared `roleFormats`, so its behaviour does not change. Candidate follow-up |
| Stale carry (found during the work) | The service carries a version's own roles over a new base when the definition has no `roleFormats` | Derived templates always send `roleFormats: {}`. Proven with the stub (service rule cited) and the real-service rolled-back probe |
| GF-21 (a) rounding | Pad before or after | Before to the nearest multiple, after padded up (the block ends on the grid). Lines other than `exact` keep the old rule |
| GF-21 (a) test updates | Engine E and C22b tests asserted caption/KEY/SOURCE line = 270 | Updated to the new requirement (brief: keep the 11 pt leading). Comments cite Table 8.2 ID:2635 |
| Ownership | `engine/docx/figures/figure.ts` is not in the brief's file list | Edited minimally (1 import + 1 call) so DOCX figure captions/KEY/SOURCE follow the same rule as DOCX tables and the HTML (DOCX/HTML agreement was required). No active claim on the file (`file_claims.md`); declared in my claim line. **The controller should confirm or revert** |
| Pending review item (D-650 note: small gaps rounded to 0, headings flush) | Does this change affect it? | **Headings: not affected.** `snapParaToBaseline` and `structure.ts` are unchanged. **Captions use the same nearest rounding for `before`** (caption 120 tw goes to 0 as before; after 48 goes to 0, then the pad of 50). If the review changes `snapNearTw`, captions change with it. Not changed now |
| D-650 | The controller removed `sheetNumbering` "bab1" from the ID layer | Not reintroduced; `seed-doc-type-templates.ts` was not touched; the second dry-run ran after the change |

## Next Steps
- Controller: reseed DEV `--doc-type-templates`. Expected: preset v2 new-version, the 10 at v4 new-version; a re-run is then unchanged.
- C24 / uji: a fresh seed should show the preset `created` with the 6 own roles, then `unchanged`.
- Re-score GF-08 and GF-21 on a new C32-style run:
  - GF-08 can move to C (half-point caveat).
  - GF-21 is still P only for slightly wrapping Serif rows and multi-line captions.
- Review recommended. Scope: `ensureSkeletonVersion` `ownRoleFormats` semantics and the derived-template `{}` choice; `rowWrappedTw` lower-bound design; the `figure.ts` ownership exception.
