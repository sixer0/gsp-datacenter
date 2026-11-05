---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: C20, C19 (blueprint identification/03_structured_datum_coverage_round.md:197-198)
date: 2026-11-05
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/03_structured_datum_coverage_round.md
binding: research/38 (R-74, R-75; §6.3 GF-02/GF-03, GF-06, GF-10/GF-11), research/35 §5 (C-3, C-9) and §7 GF-21/GF-24, D-631, D-635, D-639
status: complete
---

# Implementation Report: engine rows C20 (GF-24 reserved rail column) and C19 (GF-21 baseline rhythm)

Skills loaded: `tdd`, `dry-run-verify-fix`. Each row was test-first: the new tests were red, then the code, then green. Nothing committed. No DB writes by me, no ports. The studio suite gate itself writes and deletes temporary DEV fixtures (`tests/unit/studio/api-structure/_db.ts`), as in every earlier gate run.

## Design decisions (read first)

### C20: paragraph width, not section margins

The brief suggested "section page-margin or column geometry". The register that D-635 accepted rules that out:

- R-75 classNote (`src/lib/studio/params/render.ts:385-389`): "kolom rel 32 mm dicadangkan di setiap halaman interior (badan 128 mm) tanpa mengubah margin seksi".
- research/38 §6.3: "GF-02, GF-03: section margins stay 24/20 mm ... GF-24 reserves the rail through paragraph/table width, not `w:pgMar`".
- A Word `w:cols` geometry cannot give a single 128 mm column with an empty 38 mm strip. Two unequal columns would let text flow into the rail.

So the variant lives beside the framePr renderer in `blocks/rail.ts`. When R-75 is true and the rail is in K2 mode (mode A + `framePr`), every body paragraph of an **interior** unit is narrowed by the rail reserve (gutter 6 mm + rail 32 mm = `w:ind w:right="2154"`). This applies whether or not the paragraph has chips. Chip hosts and chips are unchanged. `w:pgMar` is byte-identical (tested), so the rail column stays empty on every interior page.

What is narrowed:
- paragraphs, lists and quotes (through `withRail`: no rail lines -> host variant `framePr`, which narrows without chips);
- source-register entries and slot placeholders (`source-register.ts`);
- chapter kicker, chapter title and section headings (`structure.ts`). The Datum Rule image is already `grid.textColumnMm` wide (128 mm);
- captions, KEY and SOURCE lines of figures and tables that are at most text-column wide (128 mm).

What is not narrowed, by design:
- **Tables and figures keep their widths (128 or 166 mm).** The manual allows 166 mm "only for maps, charts, and wide tables" (EN:2737), and no element may be wider than 166 mm (ID:2673-2675, EN:2741-2743). A full-span artefact and its own caption/source cross the rail column, as in the manual's own pages. Table width guards (G2 128/166, `table.columnWidthSumMm` 128) and figure widths (GF-10/GF-11) are untouched: `w:tblW`, `w:gridCol` and `wp:extent` are byte-identical to the default (tested).
- **Wrapper units** (cover, control sheet, TOC, part dividers; `WRAPPER_KINDS` in `package/section.ts`) are not changed. The appendix opener page is built by `engine/docx/wrapper/pages.ts`, which this row may not edit, so its two title lines stay full width. They are short.
- **`table3col` (Manual 000) and rail mode B / rail disabled** give byte-identical output with R-75 true (tested). In `table3col` the body roles already carry the 2154 reserve.

Gate G-RAIL-3 rev B (`assertRailK2`): with R-75 on, a narrowed paragraph without a chip is correct by design, so only that one check is skipped. The orphan-chip check still runs. The flag reaches the assert through `RailLayout.reserveColumn`. That field is written only when the flag is active, so `resolveRailLayout` gives the same object as before when it is off.

### C19: what is snapped, and how

The baseline is `type.baselinePt` (13.5 pt = 270 tw), with the registry default as fallback. The rule follows the brief ("round before/after spacing and exact line heights where the engine emits them") with one safety change:
- line heights with `exact`/`atLeast` are rounded **up** to a multiple of 270 tw, so glyphs are never clipped (chapter title 400 -> 540, kicker 180 -> 270). `auto` lines are left alone;
- before/after spacing is rounded to the **nearest** multiple (half up). Absent values are not written; they inherit the Normal style, which is after 0 / line 270 in both DATUM profiles;
- figure and Datum Rule images are not rescaled, because widths must stay 128/166 mm. The image paragraph's after-spacing is padded so that image height + before + after ends on a multiple of 270 tw;
- table rows of top-level table-family tables get `<w:trHeight w:val="k*270" w:hRule="atLeast"/>`. k*270 is the single-line row estimate (cell margins + spacing + first-paragraph line height), rounded up. The source row (`lastRowMerged`) is included. Cell XML is unchanged (tested). Nested tables are not changed;
- table captions, table source-below paragraphs, figure captions, KEY and SOURCE lines are snapped like headings;
- body paragraphs are **not** touched (GF-06: 9.5/13.5 pt, line 270 exact, tested identical).

Element order in `w:trPr` stays cantSplit, trHeight, tblHeader. With the flag off the bytes are the same as before.

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Read blueprint rows C19/C20, register research/38 (R-74, R-75, §6.3), spike research/35 (C-3, C-9, GF-21/GF-24), D-631, D-635, D-639, engine C report, rail/section/table/figure code, manual ID:2670-2711, EN:2731-2766 | done | |
| 2 | Pre-state baseline | done | `compare: 8/8 SAME` + 4 INFO (`C:/tmp/eE/baseline_pre.txt`) |
| 3 | C20 tests red (5 failed), code, green; then figure-caption test red (2 failed), code, green; table-caption test red, code, green | done | |
| 4 | C19 tests red (6 failed), code, green | done | |
| 5 | XML inspection of opt-in DATUM samples (a_terbit, b_nota; ID and EN long-prose variants) | done | Section below |
| 6 | PDF (soffice through clash.py, work dir `C:/tmp/eE/work`) + clash checker on 14 DOCX | done | 0 clashes on all |
| 7 | DATUM-15 line length at 128 mm | done | Median 76 (ID) / 77 (EN) chars |
| 8 | Gates: tsc, eslint, studio suite, clean-svg manifest, baseline, convert_v2 x3, branching grep | done | All pass |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| `src/lib/studio/engine/docx/blocks/rail.ts` | modify | `PARAM_RAIL_RESERVE_COLUMN`; `resolveRailLayout` sets `reserveColumn: true` only for K2 + R-75 true; `reservedColumnTw(env)` / `reservedColumnTwOf(param, unitKind)` (interior units only); `apparatusReserveTw` (artefact <= text column); `reserveRight`, `withReservedColumn`, `plainHostVariant`; `withRail` uses `plainHostVariant` for paragraphs without rail; `assertRailK2` skips the "narrowed without chip" check when `reserveColumn` is set |
| `src/lib/studio/engine/docx/blocks/env.ts` | modify | `RailLayout.reserveColumn?: true` (one optional field, declared) |
| `src/lib/studio/engine/docx/blocks/rhythm.ts` | add | `PARAM_SNAP_TO_BASELINE`, `baselineSnapTw`, `snapUpTw`, `snapNearTw`, `snapParaToBaseline`, `snapDrawingPara`, `rowSingleLineTw` |
| `src/lib/studio/engine/docx/blocks/structure.ts` | modify | Kicker, chapter title, section heading: `withReservedColumn` (C20) + `onBaseline` (C19); Datum Rule paragraph: `ruleOnBaseline` (image padding) and snapped fallback border paragraph (declared) |
| `src/lib/studio/engine/docx/blocks/source-register.ts` | modify | `bodyFormat` uses `plainHostVariant(env)` (C20) (declared) |
| `src/lib/studio/engine/docx/tables/render.ts` | modify | `Env.unitKind` (from the NormBlock in `renderTableBlock`); `apparatusAdjust` (C20 reserve + C19 snap) for the caption and the source-below paragraph; `rhythmBaseTw` + per-row `w:trHeight atLeast` (C19) for body rows and the merged source row; depth 0 only |
| `src/lib/studio/engine/docx/figures/figure.ts` | modify | Optional `adjust` argument on the exported `captionXml`, `keyRowXml`, `sourceLineXml` (absent = old bytes); `apparatusAdjust` (C20 for figures <= 128 mm + C19); picture paragraph `snapDrawingPara` (C19) (declared) |
| `tests/unit/studio/renderers/engine-e-coverage-round.test.ts` | add | 24 tests: ID and EN on `doc_terbit_report` (canonical) + v2 E1 on datum-gsp (framePr) and Manual 000 (table3col). Covers XML inspection, sha256 byte identity for absent = false, wrapper sections, pgMar/tblW/gridCol/extent unchanged, captions, G-RAIL-3, row heights, figure blocks, unchanged body, and C19 + C20 together |

`section.ts` was **not** edited: the reserve does not go through section geometry (see the C20 decision). `WRAPPER_KINDS` is imported from it read-only. Not touched: `engine/html/**`, `engine/docx/wrapper/**`, `compose/**`, params, `prisma/**`, `benchmark/**`, `assemble/**`, `text.ts`.

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| New tests | `npx vitest run tests/unit/studio/renderers/engine-e-coverage-round.test.ts` | `Tests 24 passed (24)` | Red first: C20 5 failed, figure captions 2 failed, table caption 1 failed; C19 6 failed |
| Renderer folder | `npx vitest run tests/unit/studio/renderers` | `Test Files 45 passed (45)`, `Tests 534 passed (534)` (after C20) | fixr1/fixh4/fixtq/fixt2 rail tests green |
| Studio suite | `npx vitest run tests/unit/studio` | exit 0, `Test Files 278 passed (278)`, `Tests 5031 passed (5031)` | `C:/tmp/eE/gate_vitest.txt`; includes `tests/unit/studio/figures/clean-svg-manifest.test.ts`; that test alone: `Tests 4 passed (4)` |
| Typecheck | `npx tsc --noEmit -p .` | exit 0 | `C:/tmp/eE/tsc.txt` |
| Lint | `npx eslint <7 source files> tests/unit/studio/renderers/engine-e-coverage-round.test.ts` | exit 0, 0 problems | Two unused-var warnings in the test were fixed |
| Baseline | `npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root C:/Users/TRIAL/gsp-swarm-hq-v2.1 --out C:/tmp/bl_eE --inputs C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline/inputs --compare C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline` | exit 0, `compare: 8/8 SAME`, exactly the 4 `INFO compose snapshot` lines (a_terbit/b_nota x gsp/kanonik) | `C:/tmp/eE/gate_baseline.txt` |
| convert_v2 | `npx tsx benchmark/extract/convert_v2.ts --check`, 3 runs | each exit 0, SAME x3: doc.v2 `79290e07...`, template.v2 `882057c5...`, preset `a951b149...` | `C:/tmp/eE/gate_conv_{1,2,3}.txt` |
| No branching | `git diff -U0` of the 6 modified files + `rhythm.ts`, grep `slug\|typeCode\|tier\|NOTA\|TERBIT\|SERAH\|language ===\|=== "EN"\|=== "ID"\|doc.type` | no match (grep exit 1) | Only unit kind (`WRAPPER_KINDS`, the existing section rule) |

## Verification

Opt-in samples: rendered with `scripts/parity/run/render_cli.ts` from the baseline inputs. The datum-gsp template.v2 had `essentials` + R-75 / R-74 / both (`C:/tmp/eE/in/`, outputs `C:/tmp/eE/s/`, copies `C:/tmp/eE/d/`). There are also long-prose ID and EN variants (3 extra body paragraphs, `meta.language` and `doc.language` EN) for line length.

**C20 XML (a_terbit_datum_gsp, R-75 on, vs baseline DOCX; `C:/tmp/eE/inspect.py`):** pgMar same, tblW same, wp:extent same. 13 paragraphs changed, all of them by `<w:ind w:right="2154"/>` only: kicker, chapter title, section heading, body, list items, source register. b_nota is the same pattern.

**C20 PDF geometry (PyMuPDF, `C:/tmp/eE/measure.py`):** the right edge of body text is at 152.8 mm from the left page edge with R-75, against 190.8 mm in the baseline. That is 24 + 128 mm and 24 + 166 mm, plus the same 0.8 mm glyph-box overshoot in both. No body text enters the rail.

**DATUM-15 (66-80 chars) at 128 mm,** median characters per full body line:
- ID: 76 (min 69, max 78, n 10). Baseline at 166 mm: 94.
- EN: 77 (min 70, max 84, n 10). Baseline at 166 mm: 107.

The 128 mm measure brings the line length into range; at 166 mm it is out of range.

**C19 XML (a_terbit, R-74 on):**
- BAB kicker: line 180 -> 270, after 80 -> 0.
- Datum Rule paragraph: after 80 -> 133 (pad for a 137 tw image to 270).
- Chapter title: line 400 -> 540, after 140 -> 270.
- Section heading: before 270, after 80 -> 0, line 270.
- Table caption: 120/48/220 -> 0/0/270.
- 5 rows of Tabel 2.1 got `trHeight 540 atLeast`. A single-line row was 85 + 85 + 180 = 350 tw.
- Body unchanged. pgMar, tblW and extent are the same.

**C19 PDF rhythm (a_snap page 4/5, `C:/tmp/eE/rhythm.py`):**
- Section heading baseline -> first body baseline = 13.50 pt.
- Body lines 13.50 pt apart.
- Table row pitch 26.85-27.00 pt (2 x 13.5).

**Clash checker** (`clash.py --docx ... --work-dir C:/tmp/eE/work`), clashes and pages per sample:

| Sample | Clashes | Pages |
|---|---|---|
| a base | 0 | 7 |
| a rail | 0 | 7 |
| a snap | 0 | 7 |
| a both | 0 | 7 |
| b base | 0 | 4 |
| b rail | 0 | 4 |
| b snap | 0 | 4 |
| b both | 0 | 4 |
| long ID off | 0 | 7 |
| long ID rail | 0 | 7 |
| long ID both | 0 | 7 |
| long EN off | 0 | 7 |
| long EN rail | 0 | 7 |
| long EN both | 0 | 7 |

JSON in `C:/tmp/eE/cl/`. Page counts did not change.

**Byte identity:**
- absent = false = current output, by sha256 for both params, ID and EN.
- R-75 with `table3col` or with the rail disabled gives the same bytes.
- The baseline is 8/8 SAME (none of the 8 cases sets either param).

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| The page is not on one global 13.5 pt grid even with R-74 on. Body paragraphs keep after = 135 tw (half a baseline), and device boxes (derivation/aside, `boxes.ts`) are not snapped | 0 (out of scope by brief) | The brief limits C19 to headings, table rows and figure blocks; GF-06 keeps the body as is | Documented; snapped elements are on multiples of 13.5 pt | No |
| Multi-line table rows grow past the snapped minimum, so they are not guaranteed multiples | 0 | `atLeast` from a single-line estimate; exact heights would clip multi-line cells | Documented | No |
| Appendix opener title (wrapper/pages.ts) is not narrowed under R-75 | 0 | File outside this row's ownership | Documented; short lines | No |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| C20 | Section margins/columns vs paragraph width | Paragraph width (R-75 classNote "tanpa mengubah margin seksi"; research/38 §6.3 GF-02/GF-03); `section.ts` not edited |
| C20 | Tables and figures under a reserved rail | Keep 128/166 mm (EN:2737, ID:2673-2675); apparatus follows its artefact (narrowed only when the artefact is <= 128 mm) |
| C20 | Renderers covered | K2 only (mode A + framePr), as the brief's "variant beside the framePr renderer"; table3col and mode B unchanged |
| C20 | G-RAIL-3 rev B | "Narrowed without chip" check skipped only under R-75; orphan-chip check kept |
| C19 | Rounding rule | Lines up (no clipping), spacing nearest, images padded not scaled, rows `trHeight atLeast` rounded up; body untouched |
| C19/C20 | HTML parity (C22, other agent) | HTML must honour R-75 (K2 HTML today sets `max-width:none` on body under `st-rail-k2`, `engine/html/base/shell.ts`) and R-74; not done here (`engine/html/**` excluded) |

## Next Steps

- Controller: C22 HTML parity for R-74/R-75 (see the last decision row).
- C23 may set R-74/R-75 true on the 10 templates: one fixture run is clean (0 clashes, same page counts); C32 remains the gate.
- Review recommended (scope: the 7 source files above + the new test).
