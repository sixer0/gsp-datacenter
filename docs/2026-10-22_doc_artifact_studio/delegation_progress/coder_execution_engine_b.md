---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: C10 (CS-11), C15 (CL-02 T/S), C27 (CV-15) (blueprint identification/03_structured_datum_coverage_round.md:188, 193, 205)
date: 2026-11-05
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/03_structured_datum_coverage_round.md
binding: research/38 §3.2, §3.3, §3.5, K-6, K-10; research/35 C-5, C-6; D-627 Q2; D-635 (3)(4); coder_execution_c06_c07.md
status: needs-review
---

# Implementation Report: engine wave B, rows C10 / C15 / C27

Skills loaded: `tdd` and `dry-run-verify-fix`. Each row went red, then green. Nothing was committed. No DB, no ports. `scripts/studio/mcp/**` was not edited.

**Why needs-review:** C27's explicit MCP cover path deviates from the brief. The brief asked for the unit to be substituted in `write-client.ts`. I made the substitution in compose instead. The literal brief option breaks `studio_edit` meta round-trips, and a probe confirmed it (see Issues & Decisions, row 1). Every gate is green. The controller needs to accept the deviation or choose option B.

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Read register §3.2/§3.3/§3.5, spike C-5/C-6, D-627, D-635, the C06/C07 report, and the code (`compose/front.ts`, `context.ts`, `snapshot.ts`, `contract/types/v2/norm.ts`, `texts.ts`, `write-client*.ts`, `write-meta.ts`) | done | R-69, R-79, the KLASIFIKASI enum value and the C07 text entries exist. None was re-added |
| 2 | C10 test written: red (5 of 8 failed) | done | `tests/unit/studio/compose/c10-control-sheet-manual-columns.test.ts` |
| 3 | C10 implemented: R-69 added to both key lists with default elision, plus the manual-form tables. Green | done | 9/9, together with the DC-WIRE sha test |
| 4 | C15 and C27 tests written: red (7 of 11 failed) | done | `tests/unit/studio/compose/c15-c27-cover-control-block.test.ts` |
| 5 | C15 and C27 auto block (`texts.ts`) and C27 explicit block (compose). Green | done | 11/11 |
| 6 | Pre-C15 pins adjusted (c06 "C-5" assertion; one line of fix2 parity) | done | See Changes |
| 7 | Render dry-run test (DOCX and HTML, canonical template, ID/EN/default) | done | Written after the implementation, as dry-run evidence (not red-first) |
| 8 | Gates: tsc, eslint, studio suite, baseline x2, convert_v2 x3, slug/type grep | done | All pass |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| `src/lib/studio/services/compose/context.ts` | modify | Appended `controlSheet.columns.form` (R-69) and `cover.controlBlock.preparerUnit` (R-79) to `COMPOSE_PARAM_KEYS`. Added `ELIDED_WHEN_DEFAULT` and `elided()`: `pick` drops these two keys when they are absent, `null`, or equal to the registry default (read from `PARAMS_BY_KEY`) (C-5) |
| `src/lib/studio/contract/types/v2/norm.ts` | modify | The same 2 keys appended to `NORM_COMPOSE_PARAM_KEYS` in the same order; header comment updated. The brief called this file `compose/norm.ts`. The list actually lives here (register §1.3 R-69 row: `L/contract/types/v2/norm.ts:58-74`) |
| `src/lib/studio/services/compose/front.ts` | modify | C10: in `controlSheetFront`, when `ctx.params["controlSheet.columns.form"] === "manual"`, the tables are revision `[rev, date, by, what, STATUS]`, verification `[layer, "", "", ""]` and distribution `[copy, holder, "", ""]`. Heads come from `CONTROL_SHEET_COLUMN_LABELS`, via the `MANUAL_COLUMNS` identifiers (pinned to the registry defaults by a test) and exported `manualControlSheetColumnHeads(kind, lang)`. STATUS: the last row is `current`, earlier rows `superseded` (`CONTROL_SHEET_STATUS_TEXT`). C27: `coverFront(..., params?)` replaces the text value next to a `Penyusun`/`Prepared by` label (`CONTROL_FIELD_LABELS.PENYUSUN`) in explicit control rows with `coverPreparerUnit(params)`. This follows the `markClassificationPairs` pattern. A TableV2 sent by an agent is passed through unchanged |
| `src/lib/studio/services/compose/snapshot.ts` | modify | One line: `coverFront(..., paramsOf(k))` |
| `src/lib/studio/engine/front/texts.ts` | modify | Control-block builder and preparer only. New `coverPreparerUnit(params)`: R-79 as a non-blank string, otherwise undefined. `PENYUSUN` = the unit, else `meta.author`. `KLASIFIKASI` = `classificationMarkText(meta.classification)`, printed only when the template lists the field (the default list is unchanged, C-6) |
| `tests/unit/studio/compose/c10-control-sheet-manual-columns.test.ts` | add | 9 tests: absent output has sha = the pre-C10 E1 value `265cb783...` and the key is not stored; `"mesin"`/`null` give byte-identical snapshots; compose list = norm list; ID and EN manual columns and STATUS; two-row STATUS (ID/EN); re-compose from the stored context gives the same sha; identifiers = registry defaults; agent TableV2 untouched |
| `tests/unit/studio/compose/c15-c27-cover-control-block.test.ts` | add | 11 tests: C15 default (O-3 rows), ID/EN KLASIFIKASI row in row 2 under the number, blank classification skipped. C27 auto: absent/""/blank/null give `meta.author`; ID/EN unit. C27 explicit (compose): absent/"" byte-identical and not stored; ID unit replaced while signature holder, revision `by` and stored source payload keep the author; EN plus re-compose; other labels untouched |
| `tests/unit/studio/renderers/c10-c15-c27-render.test.ts` | add | 3 real renders (DOCX and HTML) on the canonical template: ID, EN, default |
| `tests/unit/studio/registry/c06-coverage-round-params.test.ts` | modify | The one "C-5" assertion now allows exactly R-69 and R-79 in `COMPOSE_PARAM_KEYS` |
| `tests/unit/studio/renderers/fix2-wrapper-text-parity.test.ts` | modify | **One line outside the brief's list.** C07 pinned "a KLASIFIKASI-only list prints no row until C15" (`toBeUndefined`). C15 delivers that value by design, so the pin is now `[['Klasifikasi', 'TERBATAS', '', '']]`. The rest of the C-6 test (absent path has no classification row) is unchanged and green |

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | exit 0 (final run) | An earlier run showed 8 errors only in other agents' in-flight files (`renderers/c17-rule-index-builder.test.ts`, `renderers/engine-c-coverage-round.test.ts`). They were gone at the final run |
| Lint | `npx eslint` on all changed source and test files | exit 0, 0 problems | |
| Unit (final) | `npx vitest run tests/unit/studio` | exit 0, `Test Files 273 passed (273)`, `Tests 4930 passed (4930)` | Log `C:/tmp/engB_vitest2.txt`; includes `tests/unit/studio/mcp`. An earlier run (`C:/tmp/engB_vitest.txt`) had 1 failing file, `c17-rule-index-builder.test.ts`: "Cannot find package '@/lib/studio/engine/front/rule-index'". That is another agent's in-flight work and was not touched; it passes in the final run |
| Baseline (run 1 and final run 2) | `npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root C:/Users/TRIAL/gsp-swarm-hq-v2.1 --out C:/tmp/bl_eB --inputs C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline/inputs --compare C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline` | exit 0, `compare: 8/8 SAME` (DOCX + HTML x 4 cases), exactly 4 `INFO compose snapshot` lines (a_terbit/b_nota x gsp/kanonik) | Logs `C:/tmp/engB_baseline.txt`, `C:/tmp/engB_baseline2.txt`. The 4 INFO `now` shas are **identical** to the post-C06 run (`C:/tmp/c06_baseline.txt`, `diff` empty). So the compose snapshot, `compose.params` included, did not change with C10/C27 (R1 holds) |
| convert_v2 | `npx tsx benchmark/extract/convert_v2.ts --check` x3 | each exit 0, SAME x3: doc.v2 `79290e07...`, template.v2 `882057c5...`, preset `a951b149...` | Logs `C:/tmp/engB_conv_{1,2,3}.txt` |
| Slug/type branching | `git diff -U0` on the changed sources, `+` lines grepped for slug, datum-, typeCode, docType, tier literals, `.tier` | 0 hits | |
| MCP payload | `git status --short scripts/studio/mcp` | empty (no change) | The payload schema diff is empty by construction |

## Verification

- C10 ID/EN columns and STATUS: `c10-control-sheet-manual-columns.test.ts` (red before the code, 5 failed; now green) and the render test, which finds Penyusun/Perubahan/Status/Berlaku/Metode/Objek/Hasil/Media/Kembali in both DOCX and HTML, and the EN equivalents with "In force".
- C10 default is byte-identical: E1 snapshot sha = `265cb783...`, recorded before DC-WIRE/C10. `"mesin"`/`null` give the same sha as absent. Baseline 8/8 SAME, and the INFO shas are unchanged against post-C06.
- C-5: R-69 and R-79 are in both lists in the same order (tested). `pick` drops them at the default (tested). Re-compose from `snapshot.compose.params` reproduces the sha (tested, manual and EN unit cases).
- C15: the KLASIFIKASI row gets the capitalised value in row 2 under the number with the D-635 (3) 8-field list (ID/EN tested). The default field list is unchanged (O-3 pin and the C-6 test green).
- C27: the auto block shows the unit when R-79 is non-blank (ID `Divisi Engineering PT GSP`, EN `Engineering Division, PT GSP`). In the explicit MCP block, compose substitutes at render. The signature holder, the revision `by` and the stored payload keep `meta.author` (tested; the render test also finds "A. Pratama" in both formats).

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| none in owned files | - | - | - | - |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| 5 | **C27 explicit path: compose instead of `write-client.ts` (deviation from the brief).** If the MCP client writes the unit into the stored cover pair `[Penyusun, <unit>]`, `write-meta.ts` `serverClientMeta` reads that pair back as `meta.author`: the cover loop overwrites `content.meta.author` (`write-meta.ts:36-44`). A later `studio_edit` with `meta.date` then calls `setSig(made, merged.author)` (`write-meta.ts:209`), and a new revision row takes `by = merged.author` (`:187`). The unit would leak into the signature block and the revision table, which contradicts D-627 Q2. Probe `scratchpad/k6_probe.ts` (frontSlots, then the pair replaced, then serverClientMeta) printed `author read back: Divisi Engineering PT GSP` | Implemented the register K-6 recommendation instead ("engine-side, with no MCP change"): compose substitutes the value at render; the stored payload keeps the author. This covers MCP-built blocks, `write-meta`-rebuilt blocks and older documents, and the MCP payload is unchanged. Cost: R-79 is also compose-read, so C-5 applies (added to both lists with elision; snapshots unchanged, as proven). **Controller decision needed:** accept this, or option B (literal brief: the client substitutes from R02 `resolvedParams`). Option B also needs `write-meta.ts` (another owner) to stop reading the cover's Penyusun value as author |
| 3 | Manual columns use the registry default identifiers of `controlSheet.*.columns`. Template values of those 3 params are **not** read | Reading them would make 3 more keys compose-read (C-5, list and object deep-equal elision). The brief named only R-69. A test pins `MANUAL_COLUMNS` to the registry defaults, so the two sources cannot drift. Follow-up row if per-template column lists are wanted |
| 3 | STATUS "derived from tier and revision": the last revision row is `current` (Berlaku / In force), earlier rows `superseded` (Diganti / Superseded) | Register §3.2 defines "latest revision row". The text table has only these two values, and the control-sheet slot is active only on tiers whose skeleton includes it. So there is no tier branch, which also keeps the "no type branching" rule. "Diganti" stays the register's hypothesis (no manual line) |
| 3 | Product trade-off (register §3.2, K-10): in manual form, checker and approver names (and roles and dates) leave the verification table, which prints `[layer, "", "", ""]`. METODE/OBJEK/HASIL have no payload source (U3; CS-08 V1 out of scope, D-627 Q8) | Recorded and accepted per the register. Names remain in the revision PENYUSUN column (`by`) and in the signature block |
| 5 | C27 explicit substitution matches only the current labels `Penyusun` / `Prepared by`. The legacy EN label `Author` (`LEGACY_EN_LABELS`) is not matched | Old EN documents with an `Author` pair keep the name. Narrow by intent; easy to extend |
| 6 | `fix2-wrapper-text-parity.test.ts` is not in the brief's file list | One line changed: it was C07's explicit "until C15" pin. Reported here |
| - | Stale comments in C07's `texts.ts` block ("Belum ada pemanggil" on `CONTROL_SHEET_COLUMN_LABELS` / `CONTROL_SHEET_STATUS_TEXT`) | Not edited: outside my `texts.ts` scope (control-block builder and preparer only). Cosmetic follow-up |
| - | Scorer impact (register §6, K-3): CS-11 manual form flips CS-04, LB-10 and LB-11 for templates that opt in | No template opts in yet (seeding is another row). C25 aligns them |

## Next Steps

- Controller: accept the C27 compose path, or choose option B (above).
- Seed rows: set `controlSheet.columns.form = "manual"`, `cover.controlBlock.fields` (8 fields incl. KLASIFIKASI) and `cover.controlBlock.preparerUnit` (ID/EN values from research/38 §4) on the 10 Rev A templates.
- Review recommended (scope: `compose/front.ts` C10/C27, `compose/context.ts` elision, `contract/types/v2/norm.ts`, `texts.ts` `controlBlockRowsText`/`coverPreparerUnit`).
