---
task_id: C34-RFb
task_slug: doc_artifact_studio
row: review follow-ups #2 and #5 (verification/34_coverage_round_code_review.md, D-650)
date: 2026-11-05
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/verification/34_coverage_round_code_review.md
status: complete
---

# Implementation Report: review #2 (apparatus duplication) and #5 (rhythm rounding)

Skills loaded: `receiving-code-review`, `tdd`, `dry-run-verify-fix`. Inputs: verification/34 §3.4 and §4 rows 2 and 5, `coder_execution_engine_e.md`, `coder_execution_gf08_gf21.md`, the rhythm, apparatus, table and figure code. Nothing committed.

## Summary

- **#2 is fixed with byte-identical output.** One shared `apparatusParaAdjust(param, unitKind, widthTw)` and one `ParaAdjust` type now live in the new module `engine/docx/blocks/apparatus.ts`. The DOCX table and figure renderers both call it. `mmToTwFig` is gone: `figure.ts` uses `mmToTw` from `engine/tokens`, the same function `rail.ts` uses.
- **#5 is fixed.** Under R-74, a non-zero spacing never rounds to 0. The rule is: round to the nearest multiple of the baseline (270 tw), with a minimum of one baseline. Zero stays zero, and an absent value stays absent.
  - Blocks that are padded to the grid keep their own trailing spacing and pad it up to the next grid line, instead of rounding it first. These are caption/KEY/SOURCE paragraphs with an exact line, and drawing paragraphs.
  - The HTML preview uses the same shared functions, so it follows the rule automatically. Only its comments changed.
- **Visible effect in the gate-like samples.** Section heading after 0 -> 270, kicker after 0 -> 270, table caption before 0 -> 270.
  - In the PDF, the gap from heading baseline to body baseline is now 27 pt; it was 13.5 pt, with the heading flush on the body.
  - The caption stays 2.5 pt above its table.
- **Gates:**
  - baseline compare 8/8 SAME with the 4 INFO lines;
  - convert_v2 SAME x3;
  - studio suite green: 289 files, 5124 tests;
  - tsc and eslint clean;
  - clash 0 on all 4 samples;
  - PNGs are in `C:/tmp/rf5/png/`.

## Rounding rule (#5): choice and reasons

| Option | 80 | 120 | 280 | 300 | 410 |
|---|---|---|---|---|---|
| Old: nearest | 0 | 0 | 270 | 270 | 540 |
| (a) always up, minimum 1 | 270 | 270 | **540** | **540** | 540 |
| **(b) nearest, minimum 1 (chosen)** | 270 | 270 | 270 | 270 | 540 |

**Why (b).** Both options fix the collapse the same way, because every gap under one baseline becomes exactly one baseline. They differ only above one baseline:
- (a) can add almost a full extra baseline (280 -> 540 doubles the gap), which opens holes in the page.
- (b) moves any gap by at most half a baseline.

So (b) is the calmer page.

**Padded blocks.** These blocks already end on the grid through padding (GF-21), so their trailing spacing is padded, not rounded first. The values below are tw.

| Block | Raw (before / line / after) | Old result | New result | Comment |
|---|---|---|---|---|
| Caption | 120 / 220 / 48 | 0 / 220 / 50 | 270 / 220 / 50 | Block = 540 tw (2 baselines) |
| Caption, if 48 were rounded first | | | 270 / 220 / 320 | Rejected: the caption would sit further from its table than from the text above |
| Datum Rule paragraph (137 tw image) | – / – / 80 | after 133 | after 133 | Unchanged |

Under the new rule the trailing gap is never smaller than authored.

**What does not change:**
- line heights (exact/atLeast rounded up, as before);
- the GF-21 (a) caption leading;
- row heights;
- the body.

R-74 off is still byte-identical.

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Read review rows, context reports, code | done | Both items verified against the code: the duplicate closures are identical in structure, and `snapNearTw(80, 270) = 0` |
| 2 | Before snapshot | done | Temporary probe test: sha256 of DOCX + HTML for `doc_terbit_report` (4+ figures, tables), ID/EN x {none, R-75, R-74, both} on datum-gsp framePr. Run twice = deterministic. Plus render_cli DOCX of 4 gate-like samples with Rev A + R-74 + R-75 (`C:/tmp/rf5/before`) |
| 3 | #2: `blocks/apparatus.ts`, figure.ts and render.ts call it, `mmToTw` from tokens | done | All 16 probe hashes identical; all 4 sample DOCX files sha-identical. Probe file deleted afterwards |
| 4 | #5 red | done | `c34b-rhythm-min-baseline.test.ts`: 9 of 10 failed for the expected reason (`after: 0`, `before: 0`, `margin-bottom:0pt`) |
| 5 | #5 green: `snapSpacingTw`, `padToGrid` in rhythm.ts | done | 10/10 |
| 6 | Update old expectations | done | 5 assertions in 2 files (see Decisions) |
| 7 | Gates, samples, PDF, PNG, clash | done | See below |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| `src/lib/studio/engine/docx/blocks/apparatus.ts` | add | `ParaAdjust` type and `apparatusParaAdjust(param, unitKind, widthTw)` (C20 reserve, then C19 `snapApparatusPara`; both off = undefined) |
| `src/lib/studio/engine/docx/figures/figure.ts` | modify | `ParaAdjust` re-exported from the shared module (it is the type of the exported `captionXml`/`keyRowXml`/`sourceLineXml` argument). `apparatusAdjust` delegates to the shared function. `mmToTwFig` removed, `mmToTw` from `../../tokens` used for sheet width and height |
| `src/lib/studio/engine/docx/tables/render.ts` | modify | Local `ParaAdjust` removed. `apparatusAdjust` = depth-0 guard + the shared function. Unused `apparatusReserveTw`/`reserveRight`/`snapApparatusPara` imports dropped |
| `src/lib/studio/engine/docx/blocks/rhythm.ts` | modify | `snapSpacingTw` (nearest, minimum one baseline; 0 stays 0); internal `padToGrid`. `snapParaToBaseline` uses `snapSpacingTw`. `snapApparatusPara`: before via `snapSpacingTw`, the authored after padded. `snapDrawingPara`: before/line as before, the authored after padded. Header and function docs updated with the reasoning. `snapNearTw` kept (exported, used by `snapSpacingTw`) |
| `src/lib/studio/engine/html/blocks/text.ts` | modify | Comment only: the rule description of `onBaseline` |
| `src/lib/studio/engine/html/tables/apparatus.ts` | modify | Comment only: `snapped()` rule and the reference to `apparatusParaAdjust` |
| `tests/unit/studio/renderers/c34b-rhythm-min-baseline.test.ts` | add | 10 tests:<br>- pure rule: heading paragraph, zero and absent values, apparatus, drawing;<br>- DOCX ID/EN: section heading 270/270/270, table caption 270/50/220;<br>- HTML ID/EN: kicker, section heading and caption margins |
| `tests/unit/studio/renderers/c22b-html-rail-rhythm.test.ts` | modify | Kicker `margin-bottom` 0 -> 13.5 pt, section heading `margin-bottom` 0 -> 13.5 pt, caption `margin-top` 0 -> 13.5 pt, with comments and titles |
| `tests/unit/studio/renderers/gf08-gf21-rev-a-render.test.ts` | modify | DOCX table caption before 0 -> 270; HTML caption `margin-top` 0 -> 13.5 pt, with comments |
| `delegation_progress/file_claims.md` | append | C34-RFb claim line |

Not touched: `rule-index.ts`, `docx/assemble/units.ts`, `html/assemble/slots.ts`, `docx/package/header-footer.ts`, `html/base/shell.ts`, `template-preview/**`, `prisma/**`, `rail.ts`. `rail.ts` is only imported, read-only.

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Byte identity #2 (probe) | temporary vitest probe, before vs after | 16/16 sha256 identical (`C:/tmp/rf5/hash_before.json` = `hash_after2.json`) | DOCX + HTML, ID/EN, 4 opt-in states, figure-bearing fixture |
| Byte identity #2 (samples) | `render_cli` x4 + zip part compare | 4/4 SAME, whole-file sha equal (e.g. gate_id `2047b862…`) | `C:/tmp/rf5/before` vs `after2` |
| New tests red | `npx vitest run tests/unit/studio/renderers/c34b-rhythm-min-baseline.test.ts` | 9 failed / 1 passed | expected failures |
| New tests green | same | 10 passed | |
| Rhythm files | `npx vitest run` c22b, gf08-gf21, c34b, engine-e | 4 files, 52 passed | |
| Studio suite | `npx vitest run tests/unit/studio` | exit 0, `Test Files 289 passed (289)`, `Tests 5124 passed (5124)` | `C:/tmp/rf5/suite2.txt`. The first run (`suite1.txt`) failed exactly the 5 old rhythm assertions listed above, and nothing else |
| Typecheck | `npx tsc --noEmit -p .` | exit 0 | An earlier run showed 2 errors in `tests/unit/studio/ui-categories/preview-param-groups.test.ts` (another agent's file, C34-RF). They were gone at the final run |
| Lint | `npx eslint` on the 6 source + 3 test files | exit 0 | |
| Baseline | `npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root C:/Users/TRIAL/gsp-swarm-hq-v2.1 --out C:/tmp/bl_rf5 --inputs C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline/inputs --compare C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline` | exit 0, `compare: 8/8 SAME`, exactly 4 `INFO compose snapshot` lines | `C:/tmp/rf5/gate_baseline.txt` |
| convert_v2 | `npx tsx benchmark/extract/convert_v2.ts --check` x3 | each exit 0, SAME x3 (doc.v2 `79290e07…`, template.v2 `882057c5…`, preset `a951b149…`) | `C:/tmp/rf5/gate_conv_{1,2,3}.txt` |

## Verification

**Samples.** Rendered as in `coder_execution_gf08_gf21.md`, with `render_cli`, the Rev A preset (`C:/tmp/gf08/in/datum-gsp.preset.json`: pins and Rev A role formats), R-74 and R-75. Inputs are in `C:/tmp/rf5/in`, the script is `C:/tmp/rf5/render.sh`.
- `gate_id` / `gate_en`: the ID and EN gate documents from `C:/tmp/rh_gate`, with the template set to Rev A + R-74 + R-75.
- `a_terbit` / `b_nota`: the baseline gate inputs.

**Clash.** Command: `clash.py --docx … --pdf … --work-dir C:/tmp/rf5/cw`, hermes venv `-I -B`.

| Sample | After (`C:/tmp/rf5/after5`) | Before (`C:/tmp/rf5/before`) |
|---|---|---|
| gate_id | 0 clashes, 5 pages | 0, 5 |
| gate_en | 0 clashes, 5 pages | 0, 5 |
| a_terbit | 0 clashes, 7 pages | 0, 7 |
| b_nota | 0 clashes, 4 pages | 0, 4 |

Page counts did not change.

**DOCX change set.** `C:/tmp/rf5/spdiff.py`, before vs after. Only `word/document.xml` differs, and only these spacing values:
- section headings `after 0 -> 270` (gate_id 1x; a_terbit and b_nota 3x each, including the appendix A.1 heading);
- kickers "BAB n" `after 0 -> 270` (a_terbit, b_nota 2x);
- table captions `before 0 -> 270`.

Nothing else moved: Datum Rule paragraph, chapter title, rows, body.

**PDF rhythm.** `C:/tmp/rf5/base.py`, gate_id:
- Page 4: section heading baseline 144.00 to first body baseline 171.00 = **27.00 pt** (before: 157.50 = 13.50 pt, flush). Body lines stay 13.50 pt apart.
- Page 5: body to caption 25.00 pt (before 18.25 pt). Caption to table header 18.25 pt, unchanged: the caption stays with its table.

**PNG files** (PyMuPDF 120 dpi, 2 interior pages each, `C:/tmp/rf5/png/`):

| Sample | After | Before (for comparison) |
|---|---|---|
| gate_id | `C:/tmp/rf5/png/gate_id_p4.png`, `C:/tmp/rf5/png/gate_id_p5.png` | `C:/tmp/rf5/png/before_gate_id_p4.png`, `C:/tmp/rf5/png/before_gate_id_p5.png` |
| gate_en | `C:/tmp/rf5/png/gate_en_p4.png`, `C:/tmp/rf5/png/gate_en_p5.png` | `C:/tmp/rf5/png/before_gate_en_p4.png`, `C:/tmp/rf5/png/before_gate_en_p5.png` |
| a_terbit (kicker case) | `C:/tmp/rf5/png/a_terbit_p4.png`, `C:/tmp/rf5/png/a_terbit_p5.png` | `C:/tmp/rf5/png/before_a_terbit_p4.png`, `C:/tmp/rf5/png/before_a_terbit_p5.png` |

Page 4 is chapter 1 with a section heading; page 5 is a chapter with a captioned table.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| In the LibreOffice PDF, body text after a captioned table now sits half a baseline (6.75 pt) off the page grid. Before this change it was on the grid | 0 (outside ownership) | LibreOffice applied max(after, before) between paragraphs here: caption before 0 -> 270 moved the caption by only 135 tw. Body after = 135 and `spacer.afterBlock` = 135 exact are half-baseline values, which GF-06 and the engine E persistent issue left unsnapped. Before, the two 135s cancelled by accident; now the caption's 270 absorbs the first one. If spacing is added instead (Word), the page stays on the grid both before and after; not checked in Word | The blocks themselves (caption block, rows) end on the grid. The fix is to snap the spacer role, the body after, or both, in `docx/assemble/index.ts` and the role data. Not mine; candidate follow-up | No |
| Section headings are now equidistant: about 13.5 pt of space above (max of body after 135 and heading before 270) and 13.5 pt below | 0 | The heading's authored before is 270 = one baseline, so after 80 -> 270 matches it | A larger heading before (540) would restore proximity. That is a role/data decision, not part of this rule | No |
| Kicker -> Datum Rule gap grows by one baseline (kicker after 80 -> 270) | 0 | DT-10b wants heading spacing on multiples, and the rule forbids 0 | Visible in `a_terbit_p4.png`; it reads clearly | No |
| `mmToTw` (tokens) multiplies by the constant `1440/25.4`; the old `mmToTwFig` computed `(mm*1440)/25.4` | 0 | Floating point | 6,000,001 values tested (a 0.0001 mm grid to 300 mm plus 3M random values): 0 differences. They differ only at the ulp of an exact half-twip boundary (e.g. 0.02645833… mm), and no figure size hit that in the probes or samples | No |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| #2 placement | rail.ts or rhythm.ts (review) vs a new module | New `blocks/apparatus.ts`. `rail.ts` is outside my ownership and is being edited by EN-PROV. Putting the helper in `rhythm.ts` would make it depend on `rail.ts`. The new module imports both one way |
| #2 table depth guard | Inside or outside the helper | Outside: tables keep `env.depth === 0 ? … : undefined`, because figures have no depth. Same result as before |
| #2 review #12 (eager `units.find` in figure.ts) | Not in this brief | Left as is (same evaluation as before, byte-identical); still open |
| #5 rule | (a) always up vs (b) nearest with a minimum of one | (b); reasons in the rounding section |
| #5 padded trailing spacing | Round the after, then pad; or pad the authored after | Pad the authored after: never smaller than authored, never rounded up to a whole baseline first, block still ends on the grid. Same as before for the Datum Rule paragraph |
| Test updates | Old assertions of 0 where the authored value is non-zero | 5 assertions updated:<br>- `c22b-html-rail-rhythm.test.ts`: kicker 0 -> 13.5 pt, section heading 0 -> 13.5 pt, caption top 0 -> 13.5 pt;<br>- `gf08-gf21-rev-a-render.test.ts`: DOCX caption before 0 -> 270, HTML caption top 0 -> 13.5 pt.<br>Each one is a gap the new rule legitimately changes (authored 80 or 120 tw). No other expectation changed; the engine E grid-property tests pass unchanged |
| HTML parity | Separate HTML code or shared | Shared: `html/blocks/text.ts` and `html/tables/apparatus.ts` already call `snapParaToBaseline` / `snapApparatusPara`, so the preview changes with the DOCX (HTML tests ID/EN). HTML figures have no drawing-paragraph snap, as before |

## Next Steps
- Controller: visual check of the PNGs (USER visual sign-off was asked for in review #5).
- Candidate follow-up: snap `spacer.afterBlock` and the body after to whole baselines, so the LibreOffice page grid holds after captioned tables.
- Review recommended. Scope: `docx/blocks/apparatus.ts`, `docx/blocks/rhythm.ts` (`snapSpacingTw`, `padToGrid`), and the 3 test files.
- EN-PROV may now edit the caller lines in `figure.ts`, `render.ts`, `text.ts` and `apparatus.ts` (its claim waits for this report).
