---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: C17 (ST-01, incl. HTML side per D-631), C18 (TR-07), plus addendum "C12 planner wiring" (CV-19)
date: 2026-11-05
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/03_structured_datum_coverage_round.md
binding: research/37 (rule-index derivation), research/38 R-77/R-78 + §3.6, research/35 C-3, coder_execution_c06_c07.md, coder_execution_engine_a.md (C12), D-594 U3, D-595, D-631
status: complete
---

# Implementation Report: engine D (C17 rule index, C18 file-name form, C12 planner wiring)

Skills loaded: `tdd`, `dry-run-verify-fix`. All work was test-first: each new test was run and seen red for the right reason before the code was written. Nothing was committed, nothing was written to a DB, and no ports were opened.

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Read research/37, research/38 (R-77, R-78, §3.6, NOT/STD spec rows), C06/C07 report, units.ts, html/assemble, paths.ts, render.ts, manual Tabel 2.3 (ID:487-493, EN:518-523) | done | Manual form: "Nota Rencana Uji 2026-11-02.md" / "Test Plan Note 2026-11-02.md" = `<title> <YYYY-MM-DD>.<ext>`; date = `meta.issueDate` (register NOT row) |
| 2 | C17 builder test (red: module missing) -> `engine/front/rule-index.ts` | done | 18/18 green |
| 3 | C17 DOCX/HTML test (red: 6 fail; the 3 "off/absent" pins passed before the code) -> units.ts (c1), slots.ts `withRuleIndex`, 1-line hook in html/assemble/index.ts | done | 9/9 green |
| 4 | C18 test (red: `datumFileNameByForm is not a function`, render wiring gave today's name) -> paths.ts + render.ts | done | 6/6 green |
| 5 | Gates on C17/C18 | done | all pass (first run) |
| 6 | Addendum C12: test (red: 2 fail, last unit was appendix `A`, 7 vs 8 sectPr) -> units.ts (c3) | done | 5/5 green |
| 7 | Full gates re-run on the final tree | done | 1 repair cycle (test-file typing only), all pass |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| `src/lib/studio/engine/front/rule-index.ts` | add | The shared pure builder. `buildRuleIndex(snapshot)` -> `{entries, duplicates}`. Markers M1/M2/M3 per research/37 R2: the CODE/LEVEL grammar, `(PK)`, md-lite, U+00A0, and the M1 leading section number. Tables, aside, monoBlock, derivation, captions, SOURCE, chapter titles, the front matter and `x` are not scanned. Entries: code; first-sentence summary capped at 12 words with "…"; level verbatim; chapter = key, the outline label when source numbering is on, or "Lampiran A"/"Annex A". `compareRuleCodes` sorts in manual family order. First occurrence wins. Output helpers: `ruleIndexTable` (a v1 `ruleIndex` TableBlock with roles id/text/text/text, the header from `RULE_INDEX_TEXT.columns`, the SOURCE from `RULE_INDEX_TEXT.source`, no caption), `ruleIndexHeading`, `ruleIndexEmptyParagraph`. `expandRuleIndexMarker(marker, snapshot, {forced})` produces the replacement blocks plus `RULE_INDEX_DUPLICATE_CODE` (warn) / `RULE_INDEX_EMPTY` (info) logs. `PARAM_RULE_INDEX_FROM_MARKERS`. |
| `src/lib/studio/engine/docx/assemble/units.ts` | modify | **(c1) C17:** when R-77 is true for the slot (slot value, else document value), the AUTO marker is replaced by `section` heading + ruleIndex table, which routes through the existing `renderTableBlock`. With 0 entries the marker is left alone, so (c2) D-299 omits the optional slot exactly as today. The empty line appears only when the unit is forced (required slot, SLOT scope of that slot, or other blocks in the unit). **(c3) C12:** when `backCoverPlaced(params)` holds, the plan has a non-placeholder `cover` unit and the scope is DOCUMENT, a final unit `F:backCover` of kind `cover` is appended with one `backCover` block (`{mode:"auto"}`). It sorts last in (d) because it has no slot. Imports: `front/rule-index`, `wrapper/pages` (`backCoverPlaced`) |
| `src/lib/studio/engine/html/assemble/slots.ts` | modify | `withRuleIndex(ctx)` applies the same builder and the same rule at context level. With entries the marker is replaced, so the contract dispatch `HTML_RENDERERS.ruleIndex = renderTableBlock` renders a real table. With 0 entries on an optional, unforced slot the unit and its blocks are removed and `OPTIONAL_SLOT_EMPTY_OMITTED` is logged (same code/message as DOCX). If the flag is absent or false, or there is no marker, the same `ctx` object is returned. The existing `SLOT_BLOCK_RENDERERS.ruleIndex` is unchanged (see Issues & Decisions) |
| `src/lib/studio/engine/html/assemble/index.ts` | modify | **Ownership delta (2 lines + import):** `assembleDocument` now starts with `const ctx = withRuleIndex(docCtx)`. This is required because `assembleBody` groups `ctx.snapshot.blocks` by unit view: dropping only the view in slots.ts would turn the marker into an orphan section at the end of the document |
| `src/lib/studio/services/storage/paths.ts` | modify | `datumDateFileName(title, isoDate, ext)` gives `<Judul> <YYYY-MM-DD>.<ext>`, max 120 characters before the extension. It truncates the title and keeps the date intact, requires `ISSUE_DATE_RE`, and uses the same `datumClean`/`assertSafeSegment`. `datumFileNameByForm(form, {title, docNumber, rev, issueDate}, ext)`: `"judulTanggalIso"` gives the date form; any other value or none gives `datumFileName` (unchanged) |
| `src/lib/studio/services/render/pure/render.ts` | modify | `nameFor` only: `datumFileNameByForm(tpl.params["naming.file.form"], {..., issueDate: meta.issueDate}, ext)`. Local const `PARAM_NAMING_FILE_FORM`. The draft suffix and the `FILE_NAME_FALLBACK` path are unchanged |
| `tests/unit/studio/renderers/c17-rule-index-builder.test.ts` | add | 18 tests: M1/M2/M3, list items, separators/md-lite/NBSP, code shapes; rejections (no level, not leading, excluded prefixes, lower-case level, glued level, tables/aside/mono/derivation/caption/SOURCE/rail source+mark, chapter title, front matter); intro C.0.P; 12-word cut; appendix/outline/EN labels; sort order; duplicates (first wins, both addresses and levels); empty; determinism; table/heading/empty ID+EN content |
| `tests/unit/studio/renderers/c17-rule-index-render.test.ts` | add | 9 tests. DOCX: index section with heading, ID column heads, ordered rows, "SUMBER Blok aturan dokumen ini", duplicate warning, no `RULE_INDEX_MARKER_ONLY`; EN document; no markers gives omission (sectPr count unchanged, `OPTIONAL_SLOT_EMPTY_OMITTED`); forced gives the empty line + `RULE_INDEX_EMPTY`; absent and false give byte-identical DOCX. HTML: table cells equal the DOCX rows; no markers means no unit and no orphan section; SLOT scope gives the empty line; absent and false give identical HTML that still has today's `st-invalid` marker |
| `tests/unit/studio/render/c18-file-name-form.test.ts` | add | 6 tests: the Tabel 2.3 form; absent/default/other values = `datumFileName`; unsafe characters; truncation (date intact, ≤120); empty title; non-ISO date rejected; `renderSnapshot` wiring (date form from `meta.issueDate`, absent = explicit default = today's name) |
| `tests/unit/studio/renderers/c12-back-cover-planner.test.ts` | add | 5 tests. Planner: opt-in gives last unit `F:backCover`/`cover` with one `backCover` block; no cover unit (NOTA shape), SLOT/CHAPTER scope, or absent/default each leave the plan without it, and default equals absent. Full `renderSnapshot` DOCX: one extra section; the last section holds exactly one `tbRl` spine table whose text is `spineTextOf(meta, params)`; its header/footer parts (≥1 reference, asserted) contain no PAGE/NUMPAGES. NOTA shape with opt-in is byte-identical to without; absent and explicit default are byte-identical |

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | exit 0, no output | Final tree. Cycle 1 had 1 error in my new C12 test (`Record<string, unknown>` vs `ParamMap`), fixed |
| Lint | `npx eslint` on the 6 source + 4 test files | exit 0, 0 problems | Cycle 1 had 1 warning (unused eslint-disable in the C12 test), removed |
| Unit (studio) | `npx vitest run tests/unit/studio` | `Test Files 274 passed (274)`, `Tests 4935 passed (4935)`, exit 0 | Log `C:/tmp/eD_vitest2.txt`. No in-flight failures from other agents seen. The C12 test file got a type-only fix after this run started; re-run alone: `Tests 5 passed (5)`. As in C06, `api-structure/*` writes and deletes temporary DEV fixtures; that is how this gate always runs |
| New tests | `npx vitest run` on the 4 new files | 18 + 9 + 6 + 5 = 38 passed | Red evidence in Executed Steps |
| Baseline byte gate | `npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root C:/Users/TRIAL/gsp-swarm-hq-v2.1 --out C:/tmp/bl_eD --inputs C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline/inputs --compare C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline` | exit 0, `compare: 8/8 SAME`, exactly 4 `INFO compose snapshot` lines (a_terbit/b_nota x gsp/kanonik) | Final tree, log `C:/tmp/eD_baseline2.txt`. DOCX/HTML sha unchanged, e.g. a_terbit_datum_gsp DOCX `633e583f...`, b_nota_datum_kanonik HTML `030e1cda...` |
| convert_v2 | `npx tsx benchmark/extract/convert_v2.ts --check`, 3 runs | each exit 0, SAME x3: doc.v2 `79290e07...`, template.v2 `882057c5...`, preset `a951b149...` | Logs `C:/tmp/eD_conv2_{1,2,3}.txt` |
| Slug/type branching | `git diff -U0` on the 5 modified sources + grep of rule-index.ts for `slug\|tier\|NOTA\|TERBIT\|SERAH\|datum-standar\|STD\|typeCode\|docType` | 1 hit: the doc comment example "Nota Rencana Uji 2026-11-02.md" in paths.ts | 0 code branches. R-77 and R-78 are read only from template params, and C12 only from `device.spine.placements` + the presence of a cover unit |

## Verification

- **C17 markers -> index (DOCX and HTML, one builder):** the `c17-rule-index-render` DOCX and HTML tests assert the same 12 cells in the same order from `buildRuleIndex`. Neither renderer re-derives anything.
- **No section when there are no markers:** DOCX sectPr count equals the count without the slot, and `OPTIONAL_SLOT_EMPTY_OMITTED` is logged. HTML has no `data-slot-key="ruleIndex"` section and no orphan section.
- **Byte-identical with R-77 off:** absent vs `false` gives identical DOCX bytes and identical HTML strings with markers present. The baseline (no flag in any template) is 8/8 SAME.
- **No new payload field (U3):** no contract, schema, MCP-client or seed file is touched. The builder reads `snapshot.doc` / `snapshot.source.outline` only.
- **C18:** both forms are tested, the ISO date comes from `meta.issueDate` through `renderSnapshot`, and the existing `dc17-final-name` tests are unchanged and green.
- **C12 planner wiring:** a full pure-render DOCX ends with the back-cover section holding the rotated spine string, with no PAGE/NUMPAGES in its header/footer parts. NOTA shape gets no back page. Default is identical.

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| none | - | - | - | - |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| 3 | **Ownership delta:** `src/lib/studio/engine/html/assemble/index.ts` was edited (2 lines + import), though the brief named only slots.ts | It is necessary. `assembleBody` groups `ctx.snapshot.blocks` by the views from `unitViews`, so dropping only the view would render the ruleIndex block as an orphan section. Also, `HTML_RENDERERS.ruleIndex` (renderTableBlock) wins over `SLOT_BLOCK_RENDERERS`, so a block-level fix in slots.ts is unreachable. The logic lives in slots.ts (`withRuleIndex`), and index.ts only calls it. No other row claims this file in W5 (C09 compose, C16 NOTA number block, C23 seed). Controller: please record it in file ownership; C22 (W8) should know it exists |
| 3 | The brief described today's HTML as "empty div with a warning". In fact the contract table renderer handles the AUTO marker and emits `<div class="st-table st-invalid" data-address="F:ruleIndex">` plus the warn "isi blok ruleIndex tidak berbentuk TableBlock". `SLOT_BLOCK_RENDERERS.ruleIndex` is dead code | Left unchanged so R-77 off stays byte-identical, and pinned by a test. Removing the dead entry or emitting nothing by default would change HTML output, which is a separate decision |
| 2 | The builder reads `snapshot.doc` (chapters/appendices v1 structure) instead of `snapshot.blocks` (research/37 named blocks) | SLOT-scope renders arrive pre-filtered by `applyRenderScope`/`keepUnits` (blocks only, `doc` intact). Reading `doc` gives the real index in a SLOT preview instead of a false "empty". Order and addresses (`C.S`, `C.S.P`, intro `C.0.P`) are identical to block ordinals for document renders |
| 2 | Heading block = `section` with `number: ""`, `address: null`, `blockId <marker>:title`. The table keeps the marker blockId/address `F:ruleIndex` with ordinal + 0.5 | `section` uses the existing `section.heading` role in DOCX and HTML with no number and no TOC bookmark. The fractional ordinal keeps heading-before-table order in HTML's ordinal sort. The ruleIndex unit holds only its marker, and DOCX ordinal validation runs before the swap |
| 2 | "…" is added only when the 12-word cap cuts. The sentence terminator is dropped (the manual's summaries have none). The header row has no `repeatHeader` (left to `table.header.repeatEachPage`) | Per research/37 R3 |
| 2 | No caption, no page column, no extra "built" log code | research/37 R3/Risks (caption numbering in a slot unit, DT-15 known gap). Log codes limited to the register's `RULE_INDEX_DUPLICATE_CODE`/`RULE_INDEX_EMPTY`, plus the existing `OPTIONAL_SLOT_EMPTY_OMITTED` in HTML |
| 4 | Another caller of the filename builder: `benchmark/harness/run/lib/pipeline.ts:561-563` calls `datumFileName` directly | Not edited (benchmark/** is off-limits). It keeps today's form whatever R-78 says. That is harmless for the gates, but the harness will not show the NOTA date form; follow-up for the benchmark owner if wanted. `services/storage/index.ts` does not re-export the new helpers (not needed: render.ts imports paths.ts) |
| 4 | Invalid or missing `meta.issueDate` with R-78 = judulTanggalIso | The helper throws, and render.ts's existing catch falls back to `document.<ext>` with a `FILE_NAME_FALLBACK` warn, the same behaviour as a bad docNumber today |
| 6 | C12: the unit is planned only on the v2 path (`planUnitsV2`) | The v1 path is documented as unchanged since SR-16, and the v1 assembler keeps the original `snapshot.units`, so a synthetic v1 unit would have no setup lookup. All round templates are v2. `device.spine.placements` is read from document params (`opts.params`), the same context the slotless back-cover unit renders with |
| 6 | C12 HTML parity is not wired | HTML has no planner. A back page in HTML belongs to C22 (engine A already noted this) |

## Next Steps

- C22 (HTML parity): C12 back cover in HTML. `withRuleIndex` already exists for C17.
- Optional follow-up for the benchmark owner: route `benchmark/harness/run/lib/pipeline.ts` through `datumFileNameByForm` if the harness should show the TR-07 form.
- C23 sets R-77 = true on the STD layers and R-78 = "judulTanggalIso" on the NOT layer. No engine change is needed for that.
- Review recommended (scope: `engine/front/rule-index.ts`, `units.ts` (c1)/(c3), `slots.ts` `withRuleIndex`, the `html/assemble/index.ts` hook, `paths.ts` `datumDateFileName`). Security review C35 should look at `datumDateFileName` (it reuses `datumClean` + `assertSafeSegment`; unsafe-character and traversal cases are tested).
