---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: C22 (blueprint identification/03_structured_datum_coverage_round.md:200, profile :263)
date: 2026-11-05
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/03_structured_datum_coverage_round.md
binding: research/38 (R-67, R-68, R-70, R-72, R-73, R-76, spine enum, §3.1-§3.7, §4.1), D-638, D-639, delegation_progress/coder_execution_engine_{a,b,c,d}.md; C22b: R-74, R-75, delegation_progress/coder_execution_engine_e.md
status: complete
---

# Implementation Report: C22 HTML preview parity for the coverage-round opt-ins

Skills loaded: `tdd`, `dry-run-verify-fix`. Each new HTML behaviour was test-first: the test was run and seen red for the expected reason, then the code was written, then green. The CS-11 / CL-02 T/S / CV-15 confirmation tests pin behaviour that already reaches HTML through compose and the shared texts. They passed on the first run by nature (see Issues & Decisions). Nothing was committed, nothing was written to a DB, and no ports were opened.

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Read row C22, engine reports A/B/C/D, register research/38, D-638/D-639; mapped the HTML wrapper, shell, markup and assembler | done | The seams were fixed by the brief: `assembleHtml` output, ID/EN, opt-in on vs off |
| 2 | CS-12: test red (2 failed: no subtitle), then code in `renderControlSheet`, then green | done | |
| 3 | CS-06: test red (3 failed: 1 or 2 columns instead of 3), then `effectiveSignature` using DOCX `filledSignature`, then green | done | |
| 4 | CV-20: checked engine A's claim (probe), test red (3 failed: no h1 indent), then code, then green | done | Claim holds only partly; see Issues & Decisions |
| 5 | CV-19: test red (3 failed: 7 units instead of 8, `htmlBlocks.backCover` undefined), then renderer + `assemble/back-cover.ts` + one call in `index.ts`, then green | done | |
| 6 | GF-22: test red (3 failed: no rule colour CSS), then `ruleColourOverride` in `pageFurnitureCss`, then green | done | |
| 7 | CL-02 NOTA: test red (4 failed), then screen line + print margin-box line in `shell.ts`, then green | done | 2 of the 4 failures after the code was in place were a test-regex bug (`content:none` matched); fixed the regex, not the code |
| 8 | CS-11 and CL-02 T/S + CV-15: HTML confirmation tests | done | Green on first run (existing behaviour) |
| 9 | Gates: tsc, eslint, studio suite (x2), baseline (x2), convert_v2 x3, slug/type grep | done | 0 repair cycles on owned code |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| `src/lib/studio/engine/html/blocks/wrapper.ts` | modify | **CS-12:** after the control-sheet title, when `controlSheet.subtitle.enabled` is true, adds `<p class="st-p st-cover-standfirst" data-role="cover.standfirst">` with `WRAPPER_TEXT.controlSubtitle[lang]`. **CS-06:** new `effectiveSignature(ctx, s)`. When `controlSheet.signatures.fillRoles` is true it applies DOCX `filledSignature` (imported from `docx/wrapper/render`, single source); role labels that are not Inline are treated as unknown labels. It is used by `renderSignatureBlock` (before the empty-roles check, so a zero-role block gives three default columns like DOCX) and by explicit-body `signatureBlock` items. **CV-20:** in the auto cover `judul` case, when `coverTitleIndentTw(params)` (DOCX `formats.ts`) is defined, the `<h1>` gets `style="margin-right:<pt>"` and the title-line spans get `format: { indRightTw: undefined }`. **CV-19:** new `renderBackCover` HTML renderer: spine string (same `spineStringHtml`, role `cover.identityString`, class `st-cover-identity` as on the front cover) when DOCX `backCoverPlaced(params)` holds, else a warn log `BY_CONSTRUCTION_FAILED`; wrapped in `<section class="st-cover" data-wrapper="backCover">` |
| `src/lib/studio/engine/html/blocks/index.ts` | modify | Registers `backCover: renderBackCover` in `htmlBlocks` (key union + `"backCover"`), so `HTML_RENDERERS = {...htmlBlocks, ...htmlTables}` resolves it like DOCX `docxWrapper.backCover`. No contract edit |
| `src/lib/studio/engine/html/assemble/back-cover.ts` | add | `withBackCover(ctx)`, the HTML equivalent of DOCX planner (c3). It applies only on a v2 snapshot, DOCUMENT scope (absent or `DOCUMENT`), with `backCoverPlaced(ctx.tpl.params)` and a non-placeholder `cover` unit. It appends unit `F:backCover` (kind `cover`, `slotKey: ""` = document context, header/footer `inherit`) and one `backCover` block (`{mode:"auto"}`, address `F:backCover`). Key collisions get `#2`, `#3` like DOCX. Otherwise it returns the same `ctx` |
| `src/lib/studio/engine/html/assemble/index.ts` | modify | **Ownership delta, minimal:** 1 import + `const ctx = withBackCover(withRuleIndex(docCtx))` (engine D's `withRuleIndex` call kept intact, wrapped). Needed because HTML has no planner: the unit must exist before `unitViews`/`assembleBody` |
| `src/lib/studio/engine/html/base/shell.ts` | modify | **GF-22:** `ruleColourOverride(tpl, key)` = normalised hex that differs from the registry default. `pageFurnitureCss` appends `.runhead{border-bottom-color:#X}` (R-72) / `.reg{border-top-color:#X}` (R-73) only then. **CL-02 NOTA:** `classificationLine(tpl, meta)` (R-76 true + a register cell with `{nomor}`; text from `classificationLineText` / `classificationMarkText` / `wrapperLangOf`, same as DOCX C16). Screen: `<div class="reg-cls st-screen"><div>Klasifikasi : <b>TERBATAS</b></div></div>` right after each `.reg.st-screen`, with opt-in-only CSS (same 4-column grid as `.reg`, column = number cell, padding 0 / 2.5 mm = DOCX 0 / 141 tw, value `color.wrapper.seal` bold, positioned at the register's lower edge, shown only on screen). Print: the `@page` margin box holding the number cell gets `"\A" "<line>"` and `white-space:pre`. `boxDecl` got an optional `pre` flag (default false = same bytes) |
| `tests/unit/studio/renderers/c22-html-preview-parity.test.ts` | add | 34 tests (below) |

Not touched: `engine/docx/**`, `compose/**`, params, `prisma/**`, `benchmark/**`, `engine/html/assemble/slots.ts`, ST-01 (engine D, left as is), GF-19 (skipped per brief).

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| New tests | `npx vitest run tests/unit/studio/renderers/c22-html-preview-parity.test.ts` | `Tests 34 passed (34)` | Red evidence per slice: CS-12 2 failed (`expected [] to have a length of 1`); CS-06 3 failed (`expected [ 'Disusun' ] to deeply equal [ 'Disusun', 'Diperiksa', 'Disetujui' ]`); CV-20 3 failed (`expected undefined to be 'margin-right:45.35pt'`); CV-19 3 failed (`expected 7 to be 8`, `expected 'undefined' to be 'function'`); GF-22 3 failed (no `.runhead{border-bottom-color:#6E1420}`); CL-02 4 failed (no `reg-cls`, no `"\A"` line) |
| Studio suite, run 1 | `npx vitest run tests/unit/studio` | exit 1, `Test Files 1 failed / 277 passed (278)`, `Tests 8 failed / 5023 passed` | All 8 failures in `tests/unit/studio/renderers/engine-e-coverage-round.test.ts` (untracked, C19 GF-21, DOCX only, imports `assembleDocxDetailed`, with new untracked `docx/blocks/rhythm.ts`): another agent's in-flight work. Re-run alone right after: `Tests 24 passed (24)`. Log `C:/tmp/c22_vitest.txt` |
| Studio suite, run 2 (final tree) | `npx vitest run tests/unit/studio` | exit 0, `Test Files 278 passed (278)`, `Tests 5031 passed (5031)` | Log `C:/tmp/c22_vitest2.txt` |
| Baseline byte gate (run 1 and final run 2) | `npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root C:/Users/TRIAL/gsp-swarm-hq-v2.1 --out C:/tmp/bl_c22 --inputs C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline/inputs --compare C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline` | exit 0, `compare: 8/8 SAME`, 8 `SAME` lines (4 DOCX + 4 HTML), exactly 4 `INFO compose snapshot` lines (a_terbit/b_nota x datum_gsp/datum_kanonik) | HTML sha unchanged, e.g. a_terbit_datum_gsp HTML `8fff2709...`, b_nota_datum_kanonik HTML `030e1cda...`. Logs `C:/tmp/c22_baseline.txt`, `C:/tmp/c22_baseline2.txt` |
| convert_v2 | `npx tsx benchmark/extract/convert_v2.ts --check`, 3 runs | each exit 0, SAME x3: doc.v2 `79290e07...`, template.v2 `882057c5...`, preset `a951b149...` | Logs `C:/tmp/c22_conv_{1,2,3}.txt` |
| Typecheck | `npx tsc --noEmit -p .` | exit 0, no output (run before and after the final suite) | `C:/tmp/c22_tsc.txt`, `C:/tmp/c22_tsc2.txt` |
| Lint | `npx eslint src/lib/studio/engine/html/ tests/unit/studio/renderers/c22-html-preview-parity.test.ts` | exit 0, 0 problems | |
| Slug/type branching | `git diff -U0` on `html/blocks`, `html/base`, `html/assemble/index.ts` (+ lines) plus `back-cover.ts`, grep `slug\|typeCode\|docType\|tier\|NOTA\|TERBIT\|SERAH\|datum-\|=== "EN"\|=== "ID"` | 7 hits: comments, plus the registry key literal `"render.nota.classificationLine"` | 0 code branches. Every opt-in reads only template params; the back cover also reads the scope and the presence of a cover unit |

## Verification

- **CS-12 (R-67):** ID and EN with the opt-in: the subtitle text (`Kendali dokumen, riwayat revisi, dan pernyataan verifikasi` / `Document control, revision history and verification statement`) appears once in the control-sheet unit, right after the `front.pageTitle` element, with `data-role="cover.standfirst"`. Absent vs `false`: identical HTML sha256; text absent.
- **CS-06 (R-68):** ID, 1 role: heads `[Disusun, Diperiksa, Disetujui]`, space row `['', '', '']`, holder `[Penyusun laporan, '', '']`, date `[2026-10-20, '', '']`. ID `[Disusun, Disetujui]` + `colsTw`: approver in column 3, `<col>` count 0 (payload widths dropped). EN: `Prepared by / Reviewed by / Approved by`. Absent vs `false` (1 role): identical sha, still 1 column. 3 roles with the opt-in: identical sha to absent.
- **CV-20 (R-70):** ID and EN, 150 mm: `<h1 class="st-h st-cover-title" style="margin-right:45.35pt">` (907 tw / 20; register "150 -> 16 mm = 907 tw"), and no title-line span carries `margin-right`. 120 mm: `margin-right:130.4pt` (2608 tw), derived from `grid.fullSpanMm`. Absent vs `null`: identical sha; h1 without a style attribute.
- **CV-19 (back cover):** ID and EN, with the opt-in and a cover slot: one extra `st-unit`, the last one, `data-unit="cover" data-unit-key="F:backCover"`. It holds exactly one `st-spine` element with `data-role="cover.identityString"` whose text equals `spineTextOf(meta, params)`. No `.reg`/`.runhead` screen furniture, and its `@page st-u-<n>` rule has no `counter(page`. NOTA shape (no cover slot) with the opt-in: identical sha to without. SLOT and CHAPTER scope: no `F:backCover`. Absent vs explicit default placement list: identical sha. Direct renderer call without the placement: no spine, warn `BY_CONSTRUCTION_FAILED`.
- **GF-22 (R-72/R-73):** ID and EN with both = 6E1420: pages CSS has `.runhead{border-bottom-color:#6E1420}` and `.reg{border-top-color:#6E1420}`. Each param works alone; `#6e1420` is normalised. Absent = explicit registry defaults (`C3CBD1`/`101418`) = invalid values (`'merah'`, `12`): identical sha.
- **CL-02 NOTA (R-76):** `doc_nota_memo`, classification `terbatas`, ID and EN: after every `.reg.st-screen` there is exactly one `.reg-cls.st-screen` with text `Klasifikasi : TERBATAS` / `Classification: TERBATAS`, value in `<b>`, CSS `.reg-cls b{color:#6E1420;font-weight:600}`, number cell = cell 1, so `grid-column:1;padding-left:0`. The `.reg` markup is identical to without the opt-in. Print: every non-empty `@bottom-left` box holds `001/GSP/KT/X/2026` then `"\A" "Klasifikasi : TERBATAS"`, with `white-space:pre`. Register cells without `{nomor}`: identical sha to without (no line). Absent vs `false`: identical sha, no `reg-cls`.
- **CS-11 (confirmation):** compose with `controlSheet.columns.form = manual`, ID and EN. HTML control-sheet table heads are `[Rev, Tanggal, Penyusun, Perubahan, Status]`, `[Lapis, Metode, Objek, Hasil]`, `[Salinan, Pemegang, Media, Kembali]` (EN: `Rev/Date/Prepared by/Change/Status`, `Layer/Method/Object/Result`, `Copy/Holder/Medium/Return`), and the last revision row's STATUS is `Berlaku` / `In force`. Absent = `mesin` = `null`: identical HTML.
- **CL-02 T/S + CV-15 (confirmation):** with the 8-field list and `preparerUnit`, the HTML cover control block row 2 starts with `[Klasifikasi, TERBATAS]` / `[Classification, TERBATAS]`, and the `Penyusun` / `Prepared by` pair holds the unit. Default: no classification row, no unit; `preparerUnit = ""` gives identical HTML to absent.
- **Byte identity for existing templates:** baseline 8/8 SAME, HTML hashes included, both runs; convert_v2 SAME x3.

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Suite run 1 failed in `engine-e-coverage-round.test.ts` | 0 (not my file) | Another agent's C19 DOCX work in flight during the run | Passed alone (24/24) and in the final full run (278/278) | No |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| 4 | **CV-20: engine A's claim holds only at style level.** With R-70 = 150 the shared `roleFormat` does reach HTML, but as `margin-right:45.35pt` on the two inline `<span>` title lines inside the `<h1>`. A right margin on an inline element does not narrow the line box, so the title was not width-limited in the HTML preview (probe output in Executed Steps 4) | When `coverTitleIndentTw` is defined, the indent goes on the block-level `<h1>` (same value, through `paraDecl`), and the span-level indent is cleared so the last line of each span is not narrowed twice. Absent/`null`: unchanged bytes (tested). The explicit-cover path renders title roles as `<p>` blocks, where the shared `roleFormat` margin already works, so it needed no change |
| 3 | CS-06 reuses DOCX `filledSignature` (`docx/wrapper/render.ts`) instead of a copy | Single source, as the brief asks for parity. HTML already imports from `docx/**` (`docx/blocks/rail`, `docx/wrapper/toc-refs`, `docx/wrapper/formats`). The HTML engine is server-only (`html/base/fonts.ts` uses `node:crypto`; used from API routes), so the heavier import graph is acceptable. No boundary rule forbids it (searched tests and eslint config) |
| 5 | **Ownership delta: `engine/html/assemble/index.ts`**, 1 import + 1 changed line (`withBackCover(withRuleIndex(docCtx))`) | Strictly needed: HTML has no planner, and `assembleBody` groups blocks by `unitViews`, so the unit must exist on the context before that. Engine D's code is unchanged. The logic lives in the new owned file `assemble/back-cover.ts` |
| 5 | Back cover only on v2 snapshots | Same as DOCX (engine D: planner c3 is v2 only; v1 assembler keeps `snapshot.units`) |
| 5 | Back-cover unit header/footer `inherit`, no slot | `scanUnits` resolves `inherit` for wrapper kind `cover` to the template's `render.section.wrapper` modes (default empty), the same path as the front cover and as DOCX `resolveUnitSetup` for kind `cover`. Tested: no register, no running head, no `counter(page)` |
| 6 | **GF-22 explicit default = no CSS.** The canonical profile carries every registry default, so `C3CBD1` / `101418` are present in kanonik templates. Emitting CSS whenever the value is valid would break the HTML baseline | Override only when the normalised hex differs from the registry default (`PARAMS_BY_KEY`). Known pre-existing divergence, not changed: HTML's default rules follow tokens (`--rule-hair-c` from `rules.hair.colour`, `--ink900`), DOCX uses the constants INK200/INK900. A template that changes `rules.hair.colour` and explicitly sets R-72 = `C3CBD1` would get the token colour in HTML |
| 6 | GF-22 in print | The `@page` margin boxes (print running head/register) draw no rules at all today, so there is nothing to colour. Only the screen furniture (`.runhead`, `.reg`) draws these rules |
| 7 | CL-02 NOTA in HTML: screen and print | The HTML register shows the NOTA number in both the screen furniture and the print margin box, so the line is added to both. Screen: a separate element under `.reg` (adding a child inside `.reg` would shift its `:last-child` classification styling). Print: the line is a second line of the margin box that holds the number; one style for the whole box, so the value colour/bold applies on screen only |
| 7 | CL-02 with no `{nomor}` cell: HTML prints no line and does not log | The HTML shell (`buildHtmlShell`) has no log channel, and adding one needs a call change in `index.ts` beyond the strict minimum. DOCX logs the same condition (`CLASSIFICATION_LINE_NO_NUMBER`) from the same template params. Follow-up if the controller wants an HTML-side log: pass `ctx.log` into `htmlShell` |
| 8 | CS-11 / CL-02 T/S / CV-15 tests were not red-first | By design: these pin behaviour that already reaches HTML through compose (`controlSheetFront`) and `controlBlockRowsText`. No HTML engine change was needed. The default-case test asserts absence and the opt-in tests assert presence, so they are not vacuous |
| - | The C22 profile row names only `html/blocks/wrapper.ts` as EXISTS; other HTML files were "executor declares" | Declared: `html/blocks/index.ts`, `html/base/shell.ts`, `html/assemble/back-cover.ts` (new), `html/assemble/index.ts` (call only) |

## Next Steps

- Controller: record the `html/assemble/index.ts` call delta in file ownership (both C17 and C22 now hook `assembleDocument`).
- Optional follow-up: an HTML-side log for CL-02 when no register cell has `{nomor}` (pass `ctx.log` to `htmlShell`).
- C29 regression gate: the new test file is `tests/unit/studio/renderers/c22-html-preview-parity.test.ts`.
- Review recommended (scope: `html/blocks/wrapper.ts` CS-12/CS-06/CV-20/CV-19 hunks, `html/blocks/index.ts`, `html/assemble/back-cover.ts`, the `html/assemble/index.ts` hook, `html/base/shell.ts` GF-22/CL-02 hunks, the new test).

---

# C22b rail/rhythm

Follow-up brief from the coordinator: HTML parity for engine E's C20 (GF-24, R-75 `render.rail.reserveColumn`) and C19 (GF-21, R-74 `render.rhythm.snapToBaseline`); source `delegation_progress/coder_execution_engine_e.md`. Status: **complete**. R-75 is implemented in full. R-74 is a light equivalent with two documented limits (table-row heights, figure/Datum Rule image padding). Skills: `tdd`, `dry-run-verify-fix`. Each behaviour went red first, then green. Nothing committed, no DB, no ports.

## Executed Steps (C22b)

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Read engine E report, DOCX `blocks/rail.ts` (C20 helpers), `blocks/rhythm.ts`, `structure.ts` hooks; mapped HTML K2 (`RAIL_K2_CSS`, body `st-rail-k2`), mode A `max-width:var(--col)`, chapter/section/caption renderers | done | Probe: canonical template = K2 in HTML (`st-doc st-rail-a st-rail-k2`); benchmark = `table3col` (no K2) |
| 2 | R-75 tests red (3 failed: no reserve rule, no table marker), then shell CSS + table marker, then green | done | One debug cycle: `attr()` drops empty values, so the marker became `data-rail-reserve="true"`; one test literal fixed (7257 tw renders `width:128.005mm`) |
| 3 | R-74 tests red (3 failed: unsnapped kicker/title/section/caption), then code, then green | done | The patch script hit a CRLF file (`blocks/text.ts`); the helper was made EOL-aware. A scan confirmed no mixed line endings in any `engine/html` file or the new tests |
| 4 | Gates | done | All pass, first run |

## Changes Made (C22b)

| File | Change Type | Description |
|---|---|---|
| `src/lib/studio/engine/html/base/shell.ts` | modify | New `RAIL_RESERVE_CSS`, emitted after `RAIL_K2_CSS` only when `k2 && params["render.rail.reserveColumn"] === true` (k2 = HTML rail mode A + DOCX `railK2ReserveOf`, i.e. framePr). Rule 1: `body.st-rail-k2.st-rail-a .st-unit:not(.st-unit-cover,.st-unit-controlSheet,.st-unit-toc,.st-unit-part) :is(.st-p,.st-list,.st-asm,.st-srcreg-entry,.st-placeholder,.st-chapter-kicker,.st-chapter-title,.st-section-heading):not(.st-railhost *,.st-aside *,.st-monoblock *,.st-table *,.st-figure *,.st-appendix-head *){max-width:var(--col)}`. Its specificity is higher than `RAIL_K2_CSS`, so it wins. Rule 2: `body.st-rail-k2.st-rail-a .st-table[data-rail-reserve] > :is(.st-caption,.st-source){max-width:var(--col)}`. Imports `PARAM_RAIL_RESERVE_COLUMN` from DOCX `rail.ts` |
| `src/lib/studio/engine/html/tables/table.ts` | modify | `railReserved(ctx, block, depth, widthTw)`: top-level tables only. It takes the unit kind from `ctx.snapshot.units` by `block.unitKey` and applies the DOCX predicate `apparatusReserveTw` (K2 + R-75 + interior unit + width <= `grid.textColumnMm` + 4 tw). The width is the HTML table width: `layout.widthTw`, else the sum of explicit column widths. When true, the wrapper gets `data-rail-reserve="true"`. **R-74:** `rhythmBase = depth 0 ? baselineSnapTw(params) : undefined` is passed to `captionHtml` and the paragraph-below `sourceParagraphHtml` |
| `src/lib/studio/engine/html/tables/apparatus.ts` | modify | `captionHtml`, `sourceParagraphHtml` and `keyRowHtml` take an optional `base` (twip). With `base`, the format goes through DOCX `snapParaToBaseline`, and the HTML-only fixed margins (caption `margin-bottom:2.2mm`, SUMBER `margin-top:2.2mm`, KUNCI `margin-top:1.6mm`) are not emitted. The SUMBER hairline rule and its 1.6 mm padding stay. Without `base` the output is unchanged |
| `src/lib/studio/engine/html/tables/figure.ts` | modify | R-74: `base = baselineSnapTw(params)` is passed to the figure caption, KUNCI and SUMBER (= DOCX figure.ts `apparatusAdjust`) |
| `src/lib/studio/engine/html/blocks/text.ts` | modify | R-74: `onBaseline(ctx, para)` = DOCX `baselineSnapTw` + `snapParaToBaseline`, or undefined when off. Chapter kicker and chapter title get the snapped role para (chapters only; the appendix opener is not snapped, as DOCX `wrapper/pages.ts` was not changed by engine E). Section heading gets the snapped `mergePara(role, headingFormat)`, the same input as DOCX `structure.ts` |
| `tests/unit/studio/renderers/c22b-html-rail-rhythm.test.ts` | add | 9 tests (below) |

Untouched: `engine/docx/**` (reads `rail.ts`/`rhythm.ts` only), `engine/html/assemble/index.ts` and `slots.ts` (no new hook needed), compose, params, prisma, benchmark. Engine D's and my earlier C22 hooks are unchanged.

## Test Results (C22b)

| Test Type | Command | Result | Notes |
|---|---|---|---|
| New tests | `npx vitest run tests/unit/studio/renderers/c22b-html-rail-rhythm.test.ts` | `Tests 9 passed (9)` | Red: R-75 3 failed (`expected undefined to be defined`, `expected [] to have a length of 1`); R-74 3 failed (`expected 'margin-top:0pt;margin-bottom:4pt;line…' to be 'margin-top:0pt;margin-bottom:0pt;line…'`, caption `margin-top:6pt;margin-bottom:2.4pt;…`) |
| Studio suite | `npx vitest run tests/unit/studio` | exit 0, `Test Files 279 passed (279)`, `Tests 5046 passed (5046)` | `C:/tmp/c22b_vitest.txt` |
| Baseline | `npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root C:/Users/TRIAL/gsp-swarm-hq-v2.1 --out C:/tmp/bl_c22b --inputs C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline/inputs --compare C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline` | exit 0, `compare: 8/8 SAME` (8 SAME lines, HTML hashes `8fff2709…`, `50c46a6f…`, `41c4a373…`, `030e1cda…` unchanged), exactly 4 `INFO compose snapshot` lines | `C:/tmp/c22b_baseline.txt` |
| convert_v2 | `npx tsx benchmark/extract/convert_v2.ts --check` x3 | each exit 0, SAME x3: doc.v2 `79290e07…`, template.v2 `882057c5…`, preset `a951b149…` | `C:/tmp/c22b_conv_{1,2,3}.txt` |
| Typecheck | `npx tsc --noEmit -p .` | exit 0 | `C:/tmp/c22b_tsc.txt` |
| Lint | `npx eslint src/lib/studio/engine/html/ <both C22 test files>` | exit 0 | |
| Slug/type branching | `git diff -U0` of `blocks/text.ts`, `tables/`, `base/shell.ts`, + lines grepped as before | 0 new hits (only the earlier C22 comments / R-76 key name) | Rules depend only on params, rail mode and unit kind (the same `WRAPPER_KINDS` set as DOCX) |

## Verification (C22b)

- **R-75, ID and EN** (canonical template = K2): body class `st-rail-k2`. The pages CSS has the reserve rule. It targets only interior units (`.st-unit:not(.st-unit-cover,.st-unit-controlSheet,.st-unit-toc,.st-unit-part)`) and covers `.st-p`, `.st-list`, `.st-asm`, `.st-srcreg-entry`, `.st-placeholder`, `.st-chapter-kicker`, `.st-chapter-title`, `.st-section-heading`. It excludes descendants of `.st-aside`, `.st-monoblock`, `.st-table`, `.st-figure`, `.st-railhost` and `.st-appendix-head`, and `.st-aside` is not in the `:is()` list.
- **R-75 tables/figures:** of a 128 mm table (`layout.widthTw` 7257) and a 166 mm table (9412), only the 128 mm one carries `data-rail-reserve`. The caption/source rule exists. All table `st-table-grid` styles and all figure styles are identical to without the opt-in, so widths are unchanged.
- **R-75 byte identity:** absent = `false`, identical sha. `table3col` (benchmark) with R-75 = without; `layout.railMode = B` with R-75 = without.
- **R-74, ID and EN** (datum-gsp = benchmark + framePr), values from engine E's a_terbit XML:
  - chapter kicker `margin-top:0pt;margin-bottom:0pt;line-height:13.5pt` (180 -> 270 tw, after 80 -> 0);
  - chapter title `margin-top:0pt;margin-bottom:13.5pt;line-height:27pt` (400 -> 540, after 140 -> 270);
  - section heading `margin-top:13.5pt;margin-bottom:0pt;line-height:13.5pt` (after 80 -> 0);
  - caption `margin-top:0pt;margin-bottom:0pt;line-height:13.5pt` (120/48/220 -> 0/0/270) and no `2.2mm`;
  - every `st-key` / `st-source` paragraph without the fixed `margin-top:2.2mm|1.6mm`.
- **R-74 body untouched:** all `st-p` style attributes are identical with and without the opt-in (GF-06).
- **R-74 byte identity:** absent = `false`, identical sha on datum-gsp and the canonical template.

## Persistent Issues (C22b)

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| R-74 table-row heights are not snapped in HTML | 0 (documented by brief option) | DOCX derives `w:trHeight atLeast` from the cell XML it has just written (tcMar + spacing + first-line height, `rowSingleLineTw`). HTML cells use CSS padding and line-heights from different sources, so the same estimate would be invented, not mirrored | Documented limitation | No |
| R-74 figure / Datum Rule image padding not applied in HTML | 0 | DOCX pads the image paragraph's after-spacing by image height mod 270 tw. HTML figure heights are often unknown (`height:auto`, SVG scaled to width), and the HTML preview is not laid out on a page baseline grid | Documented limitation | No |

## Issues & Decisions (C22b)

| Step | Issue / Decision | Resolution |
|---|---|---|
| 2 | R-75 at document level in HTML | R-74/R-75 are document-level keys (register research/38; no slot scope). The shell reads the document params, the same source as K2 detection. The table marker reads the block's effective params, so it uses DOCX's own predicate |
| 2 | What R-75 narrows in HTML | Exactly the DOCX set (engine E report, "What is narrowed"): paragraphs, lists, assumption-inline (`withRail`), source-register entries and slot placeholders (`plainHostVariant`), chapter kicker/title and section headings (`withReservedColumn`). Not narrowed: asides and monoBlocks (no DOCX change), table/figure content, chip hosts (already a text-column + rail grid), appendix opener (DOCX `wrapper/pages.ts` unchanged), wrapper units |
| 2 | Table caption/source under R-75 | Uses the HTML table width. Tables without explicit widths render `width:100%` (full span) in HTML today, while DOCX falls back to `table.columnWidthSumMm` (128 mm). This HTML/DOCX table-width difference is pre-existing and not changed here. Such tables count as full span in HTML, so their captions stay full width, consistent with the table as rendered |
| 2 | Figures under R-75 | No change needed: the HTML `<figure>` already carries `max-width: <figure width>`, so the caption/KUNCI/SUMBER of a 128 mm figure are at most 128 mm and those of a 166 mm figure follow it (tested: figure styles identical) |
| 3 | R-74 apparatus margins | HTML adds fixed mm margins to captions/KUNCI/SUMBER that override the ParaFormat spacing. Under R-74 they are dropped so the snapped DOCX spacing applies. The SUMBER hairline and its 1.6 mm padding stay (visual rule, also present in DOCX as a border with space) |
| 3 | R-74 scope | Same as DOCX: chapter kicker/title (chapters, not the appendix opener), section headings, captions/KUNCI/SUMBER of top-level tables and figures; body untouched. HTML is a flowing preview with no page baseline grid, so this is the light equivalent the brief allowed. Table rows and image padding are documented above |

## Next Steps (C22b)

- C29: add `tests/unit/studio/renderers/c22b-html-rail-rhythm.test.ts` to the regression scope.
- Optional follow-up (separate decision): give HTML tables without explicit widths the DOCX default width (`table.columnWidthSumMm`). That would change default HTML output, so it is out of scope for an opt-in row.
- Review recommended (scope: `html/base/shell.ts` `RAIL_RESERVE_CSS`, `html/tables/table.ts` `railReserved` + `rhythmBase`, `html/tables/apparatus.ts` `base` option, `html/tables/figure.ts`, `html/blocks/text.ts` `onBaseline`, the new test).
