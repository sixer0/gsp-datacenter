---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: C08, C09, C11, C12 (blueprint identification/03_structured_datum_coverage_round.md:186-190)
date: 2026-11-05
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/03_structured_datum_coverage_round.md
binding: research/38 (names register), research/35 §5 C-1..C-12 and §11 rec. 2, D-631, D-635 (2), delegation_progress/coder_execution_c06_c07.md
status: needs-review
---

# Implementation Report: engine wrapper opt-ins CS-12, CS-06, CV-20, CV-19 (engine A)

Status per row: **C08 complete, C09 complete, C11 complete, C12 needs-review** (renderer, predicate and dispatcher entry done and tested; the back-cover unit can only be *planned* in `docx/assemble/units.ts`, which this row may not edit; see Issues & Decisions).

Skills loaded: `tdd`, `dry-run-verify-fix`. Every row went red first (test seen failing for the expected reason), then green. Nothing committed, no DB writes, no ports.

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Read register research/38 (§1.2, §1.3, §3.1, §3.4, §4.1, §6.3), spike research/35 (§5, §7, §11), D-631, D-635, C06/C07 report, `texts.ts`, R-67/R-68/R-70 and the spine enum in params | done | Params and text entries exist; not re-added |
| 2 | C08 test red (2 fails: subtitle absent), then subtitle in `autoControlSheetItems` | done | green |
| 3 | C09 test red (4 fails: 1/2 columns instead of 3), then `filledSignature` in `signatureXml` | done | green |
| 4 | C11 test red (3 fails: no `w:right`), then `coverTitleIndentTw` applied in `roleFormat` for the two cover title roles | done | green |
| 5 | C12 test red (4 fails: `backCoverPlaced`/`renderBackCover` not functions), then predicate + renderer + `docxWrapper.backCover` | done | green; one vacuous assertion tightened (`typeof` check) |
| 6 | Gates: tsc, eslint, baseline compare, convert_v2 x3, clean-svg manifest, full studio suite, slug/type grep | done | see Test Results |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| `src/lib/studio/engine/docx/wrapper/pages.ts` | modify | C08: after the control-sheet title, `if pBool("controlSheet.subtitle.enabled", false)` push `paraItem("standfirst", WRAPPER_TEXT.controlSubtitle[lang])` (existing role `cover.standfirst`, register §1.3). C12: `spinePlacedIn(params, where)` (adds `"sampul belakang"` to the local vocabulary; `spinePlaced` delegates, unchanged behaviour); exported `backCoverPlaced(params)`; new `renderBackCover` block renderer (spine table via the same `spineXml` as cover/dividers, then one `spacer.generic` anchor paragraph; warns and skips the spine if the placement is absent) |
| `src/lib/studio/engine/docx/wrapper/render.ts` | modify | C09: `signatureXml` applies `filledSignature(block, lang)` only when `controlSheet.signatures.fillRoles` is true. `filledSignature`: payload roles whose label equals a `FRONT_PAYLOAD_LABELS.made/checked/approved` label (ID or EN, case-insensitive) take that column; other roles fill the first free column from the left; free columns get the document-language label and an empty holder (`{runs: []}`, the holder rule still drawn); 3+ roles unchanged; payload `colsTw` dropped when padded. Import of `FRONT_PAYLOAD_LABELS` |
| `src/lib/studio/engine/docx/wrapper/formats.ts` | modify | C11: exported `coverTitleIndentTw(params)` = `mmToTw(grid.fullSpanMm - cover.title.maxWidthMm)`; undefined when the value is absent/null or >= the span. `roleFormat` sets `para.indRightTw` to it for `cover.titleFirst` / `cover.titleLast` after the template/catalog layers (so a template `roleFormats` para cannot drop the opt-in) |
| `src/lib/studio/engine/docx/wrapper/index.ts` | modify | `docxWrapper.backCover = renderBackCover` (+ `DocxWrapperKey` union), re-export `backCoverPlaced` |
| `tests/unit/studio/renderers/c08-c12-wrapper-opt-ins.test.ts` | add | 23 tests (below) |

Not touched: `texts.ts` (read only), `compose/**`, `docx/package/**`, `docx/assemble/**`, `html/**`, params, `prisma/**`, `scripts/**`, `benchmark/**`.

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| New tests | `npx vitest run tests/unit/studio/renderers/c08-c12-wrapper-opt-ins.test.ts` | `Tests 23 passed (23)` | Red evidence per row: C08 2 failed (`expected [] to have a length of 1`), C09 4 failed (`expected 1 to be 3`, `expected 2 to be 3`), C11 3 failed (no `w:right="907"`), C12 4 failed (`backCoverPlaced is not a function`) |
| Baseline byte gate | `npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root C:/Users/TRIAL/gsp-swarm-hq-v2.1 --out C:/tmp/bl_eA --inputs C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline/inputs --compare C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline` | exit 0, `compare: 8/8 SAME` (4 DOCX + 4 HTML), exactly 4 `INFO compose snapshot` lines (a_terbit/b_nota x datum_gsp/datum_kanonik) | Log `C:/tmp/eA_baseline.txt`. The INFO lines are the expected R1 lines (snapshot hashes now differ from the C06 run because other agents' compose rows are in flight; INFO only) |
| convert_v2 | `npx tsx benchmark/extract/convert_v2.ts --check` x3 | each exit 0, SAME x3: doc.v2 `79290e07...`, template.v2 `882057c5...`, preset `a951b149...` | Logs `C:/tmp/eA_conv_{1,2,3}.txt` |
| Clean-SVG manifest | `npx vitest run tests/unit/studio/figures/clean-svg-manifest.test.ts` | `Tests 4 passed (4)` | |
| Studio suite | `npx vitest run tests/unit/studio` | `Test Files 1 failed / 269 passed (270)`, `Tests 4886 passed (4886)` | Log `C:/tmp/eA_vitest.txt`. The 1 failed file = `tests/unit/studio/renderers/c17-rule-index-builder.test.ts`, import error `Cannot find package '@/lib/studio/engine/front/rule-index'`: another agent's C17 in flight (module not yet on disk when the suite loaded it). Re-run alone afterwards: `Tests 18 passed (18)`. Not my file; not fixed |
| Typecheck | `npx tsc --noEmit -p .` | exit 2, 15 errors, **0 in my files** | All 15 in other agents' in-flight tests: `tests/unit/studio/compose/c10-control-sheet-manual-columns.test.ts` (3), `tests/unit/studio/compose/c15-c27-cover-control-block.test.ts` (11), `tests/unit/studio/renderers/engine-c-coverage-round.test.ts` (1, TS2542 writing a readonly params map). Log `C:/tmp/eA_tsc.txt`. Reported, not fixed |
| Lint | `npx eslint` on the 4 wrapper files + the new test | exit 0 | |
| Slug/type branching | `git diff -U0 src/lib/studio/engine/docx/wrapper/ \| grep '^+' \| grep -iE 'slug\|typeCode\|tier\|NOTA\|TERBIT\|datum-'` | 1 hit, a comment (the register §4.1 NOTA example in the `backCoverPlaced` doc comment) | 0 code branches |

## Verification

- **C08 (CS-12).** ID and EN with R-67 true: the subtitle (`WRAPPER_TEXT.controlSubtitle[lang]`, verbatim ID:25 / EN:25) appears exactly once, in the paragraph immediately after the control-sheet title "Kendali dokumen" (CS-02 order kept), italic (`cover.standfirst`). Absent vs `false`: identical DOCX sha256, and the text is absent.
- **C09 (CS-06).** ID 1 role: grid 3 columns; role row `[Disusun, Diperiksa, Disetujui]`; signing-space row `['', '', '']` (LB-06/TR-03); holder row `[Penyusun laporan, '', '']`; date row kept for the payload column only. ID 2 roles `[made, approved]` (the MCP client shape without a checker, `write-client.ts:220-226`): the approver lands in column 3, not 2. EN: labels `Prepared by / Reviewed by / Approved by`. Unknown label "Author": takes column 1, the rest default. Absent vs `false` (1 role): identical sha, still 1 column. 3-role payload with R-68 true: identical sha to absent (no-op). Uses `FRONT_PAYLOAD_LABELS`, not `controlSheet.signatures.roles` (register §5.1: `DISAHKAN` fails LB-06).
- **C11 (CV-20).** ID and EN with R-70 = 150: both cover title paragraphs carry `<w:ind ... w:right="907"/>` (166 - 150 = 16 mm, `mmToTw` = 907, matching AC "907 tw at 150 mm"). R-70 = 120: `w:right="2608"` (46 mm), proving the width is derived from `grid.fullSpanMm`. Absent vs `null`: identical sha; no `w:right` on the title paragraphs.
- **C12 (CV-19).** `backCoverPlaced`: false for `{}` and the registry default list, true with `sampul belakang` (alone or with the two defaults), false when `device.spine.enabled` is false. `renderBackCover` (ID and EN): exactly one `tbRl` spine table, document text = `spineTextOf(meta, params)` and nothing else (register §3.4), `w:caps` like the cover spine, no `PAGE`/`NUMPAGES`/`w:sectPr`, ends with a paragraph. Without the placement: no spine, one warn log. Full document with the explicit default list = identical sha to absent. **Not verified (not wired):** a full-document render with a back-cover page; see Issues & Decisions.
- Byte identity for old templates: baseline 8/8 SAME (DOCX and HTML) and convert_v2 SAME x3.

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| C12 back-cover page is not yet emitted in a full render | 0 (out of ownership, not attempted) | A page at the end of the document in its own section needs a planned unit; units, section breaks and sectPr belong to the assembler (`docx/assemble/units.ts`, `index.ts`; K-12 forbids wrapper renderers writing sectPr). The brief restricts this row to `docx/wrapper/**` | Renderer, predicate and dispatcher entry are ready; wiring needs an owner | Yes for AC "back cover present only with the value" at document level; no for the byte gates |
| Other agents' in-flight files fail tsc (15 errors) | - | `c10-control-sheet-manual-columns.test.ts`, `c15-c27-cover-control-block.test.ts`, `engine-c-coverage-round.test.ts` | Reported, not fixed (not my files) | Not for this row |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| 5 | **C12 wiring needs the assembler (controller decision).** Proposed minimal change for the `docx/assemble/**` owner: in `planUnitsV2` (and v1 if wanted), after step (c2) and before ordering, when `backCoverPlaced(params)` and the plan contains a non-placeholder unit of kind `cover`, and the scope is DOCUMENT, append a synthetic unit `{ kind: "cover", key: "F:backCover", setup: { header: { mode: "inherit" }, footer: { mode: "inherit" } } }` with one block `syntheticBlock(key, ..., "backCover", { mode: "auto" }, seq++)`. Kind `cover` is a wrapper kind, so `resolveUnitSetup` gives empty header/footer (no PAGE, no register: RB-07/RB-08/SB-01); the cover-unit condition keeps NOTA free of a back page (TR-02, register §4.1). `DOCX_RENDERERS` already resolves `backCover` through `...docxWrapper`. The unit must sort last (a slotless unit sorts at `MAX_SAFE_INTEGER` in step (d)); the rail gate already skips kind `cover`. HTML needs the same page in C22 | Options: (a) assign the planner change to the assemble owner as a follow-up of C12 (recommended); (b) extend this row's ownership to `docx/assemble/units.ts` and re-dispatch; (c) accept the renderer-only state until C22 |
| 2 | C08 subtitle only in auto-mode control sheets | Compose always emits `mode: "auto"` (`controlSheetFront`, `compose/front.ts`; line moves while C10 edits the file); an explicit `body` is authored content and stays untouched |
| 2 | Subtitle role | Existing `cover.standfirst` through `ParagraphRole "standfirst"` (no new RoleKey, C-12) |
| 3 | Column assignment by label, not position | The MCP client sends `[made, approved]` when there is no checker; positional padding would put the approver under "Diperiksa". Labels match in either language so an ID payload rendered as EN still lands correctly |
| 3 | Zero-role block with R-68 true renders three default columns | Opt-in means "always three columns"; without R-68 the old warn-and-skip stays |
| 4 | Indent applied in `roleFormat`, after the template layer | A template `roleFormats` para for the title roles would otherwise drop the opt-in. Side effect: the HTML engine reads the same `roleFormat` (`html/blocks/style.ts:22, 83, 189`), so with R-70 set the HTML cover title also gets the right indent. Absent = unchanged (baseline HTML SAME). C22 should confirm rather than re-implement |
| 4 | Width basis = `grid.fullSpanMm` | Register: "bentang penuh - nilai". `roleFormat` has no unit, so the cover text width is taken from the registry span (166 mm in the 10) |
| 5 | Spine clash zone (D-599) | The back cover reuses `spineXml` (same outer-margin band, rotation 90), so the narrow D-599 allowance applies as on cover and dividers once the page is wired; to be checked at C32 |

## Next Steps

- Controller: decide the C12 wiring owner (options above). After wiring: a full-document test (back cover present only with the value, absent on a document without a cover unit), baseline/convert_v2 again.
- C22: HTML parity for CS-12 subtitle, CS-06 three columns, CV-19 back cover; CV-20 already flows through the shared `roleFormat` (verify only).
- Review recommended (scope: the four wrapper files and the new test), together with the round's other engine rows.
