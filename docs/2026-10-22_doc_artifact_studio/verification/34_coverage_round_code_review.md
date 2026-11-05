---
task_slug: doc_artifact_studio
row: C34 (structured DATUM coverage round, senior code review)
date: 2026-11-05
agent: senior-code-reviewer
source_plan: docs/2026-10-22_doc_artifact_studio/identification/03_structured_datum_coverage_round.md (row C34, line 212; constraints (a)-(d) lines 22-26; AC-C1..AC-C10 lines 128-140)
skills_loaded: code-review-senior
status: complete
---

# C34: Coverage round senior code review

Repo `C:\Users\TRIAL\gsp-swarm-hq-v2.1`, branch v2.1, HEAD `8c7c803`. Everything reviewed is uncommitted: 67 tracked files changed (`git diff HEAD --stat`, 2878+/566-) and 26 untracked non-doc files (6 source + 20 test). No production code was changed by this row and nothing was committed.

Scope reviewed: (1) the DATUM Rev A coverage round (params R-67..R-80 and enums, texts, DOCX wrapper/package/blocks/figures/tables/assemble, compose, HTML, rule-index, storage paths, seed, scorer rules, clash.py), (2) the template-editor category grouping UI, (3) the agent-roster change. Context read: D-625..D-647, implementer reports (`ui_param_categories.md`, `coder_execution_c06_c07.md`, `engine_c`, `engine_e`, `c22`, `c23`), the C29 gate `verification/31_coverage_round_regression.md`, research/35 §5 (C-1..C-12) and research/38.

## 1. Verdict

**Overall: APPROVED WITH COMMENTS. 0 blockers, 0 High, 5 Medium, 14 Low (19 issues).**

| Domain | Verdict | High | Medium | Low |
|---|---|---|---|---|
| U4 production blocker (slug/type branching, per-template code, copy-paste seed) | **PASS** | 0 | 0 | 0 |
| Byte identity of old templates (constraint (a), AC-C1) | **PASS** | 0 | 0 | 0 |
| Structure | PASS | 0 | 0 | 2 |
| Dependency Impact | PASS | 0 | 0 | 0 |
| Duplication | CAUTION | 0 | 2 | 2 |
| Maintainability | PASS | 0 | 0 | 3 |
| Reference Integrity (workflow / DOCX-HTML parity) | CAUTION | 0 | 1 | 0 |
| Correctness (C10-C27 behaviours) | CAUTION | 0 | 1 | 4 |
| Tests | CAUTION | 0 | 1 | 1 |
| UI (D-633, D-637) | PASS | 0 | 0 | 2 |

## 2. Fresh verification (run in this row, 2026-11-05 ~13:00-13:10)

Logs are in `C:/Users/TRIAL/AppData/Local/Temp/claude/c34/`.

| # | Command | Result |
|---|---|---|
| 1 | `npx vitest run tests/unit` | `Test Files 284 passed (284)`, `Tests 5087 passed (5087)`, EXIT=0 (311.5 s). This includes `tests/unit/agent-roster.test.ts` |
| 2 | `npx tsx benchmark/extract/convert_v2.ts --check` | `SAME` x3 (doc.v2 `79290e07...`, template.v2 `882057c5...`, preset `a951b149...`), EXIT=0 |
| 3 | `npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root ... --out C:/tmp/bl_c34 --inputs .../datum-rev-a-baseline/inputs --compare .../datum-rev-a-baseline` | 8 `SAME` lines (DOCX + HTML for a_terbit/b_nota x datum_gsp/datum_kanonik, hashes equal to C29), exactly 4 `INFO compose snapshot` lines, `compare: 8/8 SAME`, EXIT=0 |
| 4 | `npx tsc --noEmit -p . --incremental false` | 0 lines of output, EXIT=0 |
| 5 | `npx eslint --max-warnings 0 <84 changed + untracked .ts/.tsx>` | 0 lines of output, EXIT=0 |
| 6 | Independent U4 grep over added lines (`git diff HEAD -U0 -- src prisma benchmark scripts`) plus the 6 untracked source files, for a conditional on the same line as `slug|typeCode|docType|defaultTier|tier|"NOT"|"STD"|"NOTA"|"TERBIT"|"SERAH"|datum-` | 6 hits, all in `prisma/seed-studio-templates.ts` `derivedPresetPlan` / runner: the self-reference guard and error messages that interpolate `${spec.slug}`. 0 behaviour branches |

## 3. Mandatory check results

### 3.1 U4 (blocker check): PASS

- No new branch on template slug or document type anywhere in `src`, `prisma`, `benchmark`, `scripts` (check 6 above; matches C29 §3). `scripts/studio/mcp/**` is unchanged (`git diff HEAD --stat` lists no file there), so AC-C3 also holds.
- No per-template functions. Template behaviour comes from one spec table: `prisma/seed-doc-type-templates.ts:72-82` (`SHARED_OPT_INS`), `:150` (NOTA type layer), `:175` / `:193` (language layers), merged generically at `:219`. Derived presets come from one data table `prisma/seed-derived-presets.ts` (`DERIVED_PRESET_SPECS`, one row), iterated by the generic `ensureDerivedPreset` (`prisma/seed-studio-templates.ts`). No seed block is copy-pasted.
- C12 "never NOTA" is driven by data, not type: the planner requires a non-placeholder `cover` unit (`src/lib/studio/engine/docx/assemble/units.ts:390-397`, HTML `src/lib/studio/engine/html/assemble/back-cover.ts:24-27`). NOTA has no cover slot, so no back cover.
- **Judgement item 1, `render.nota.classificationLine` (`src/lib/studio/params/render.ts:390`): not a U4 violation.** No code path reads tier or type. The DOCX reader (`header-footer.ts:393-411`) and the HTML reader (`shell.ts:223-234`) act only on the param value and on whether the register cell pattern contains `{nomor}`. Any template can opt in. The key name does tie a generic feature to one family, which is a naming debt (issue #6). It should be decided before production, because after release the key is stored in template data.
- **Judgement item 2, `spec.slug === spec.baseSlug` (`prisma/seed-studio-templates.ts`, `derivedPresetPlan`): not a U4 violation.** It is input validation on a spec row (a preset may not derive from itself). It has no literal, compares two fields of the same row, and behaves the same for every row.

### 3.2 Byte identity (constraint (a), (d)): PASS

Re-run: 8/8 SAME with the 4 expected INFO lines, `convert_v2 --check` SAME x3 (section 2). Beyond the baseline, I traced each new reader for an activation path that does not need a new non-default value:

| Change | Activation | Old-template effect |
|---|---|---|
| RH-03 override `header-footer.ts:92-95, 181-187` | R-72 valid hex **and** different from the registry default `C3CBD1` | None. Absent or default keeps the old precedence (the preset border wins). `runningHeadFormat` falls back to `INK200` = `"C3CBD1"` (`header-footer.ts:53`), the same as the R-72 default, so a resolved map that carries the default gives the same bytes |
| R-73 register top rule `header-footer.ts:422` | `normalizeHex(p[R-73]) ?? INK900` | None: R-73 default `101418` = `INK900` (`header-footer.ts:51`) |
| GF-22 HTML override `shell.ts:160-163, 303-308` | non-default hex only | None. No CSS is emitted for absent or default |
| Compose C-5 elision `compose/context.ts:40-66` | only the two new keys, elided when absent / null / default | None. Slot maps are stored whole and are not inherited (`composeContextOf`, `paramsOf` `snapshot.ts:168`), so a slot-level default that is elided cannot fall back to a non-default document value on re-compose |
| `controlBlockRowsText` fallback `texts.ts` (`CONTROL_FIELDS_DEFAULT`) | always | None: the registry default `params/page.ts:369-378` has the same 8 keys in the same order as the old `Object.keys(CONTROL_FIELD_LABELS)` (`git show HEAD:.../texts.ts:203-212`) |
| Table `trPr` reorder `tables/render.ts:646-648`; source row `:461-463` | always | None: with `rowHeight` = `""` the output is `cantSplit` then `tblHeader`, as before |
| HTML `withRuleIndex` / `withBackCover` (`html/assemble/index.ts:263-266`) | flag true / placement enum value | They return the same `ctx` object when not activated (`slots.ts:248, 288`; `back-cover.ts:22-27`) |
| HTML apparatus `apparatus.ts:30-32, 545, 560, 574` | `base` defined (R-74) | None: `snapped(x, undefined)` returns `x`, and the old margin strings are kept |

I found no parameter combination that changes old-template bytes. The opt-in semantics of R-72 have one quirk, issue #10.

### 3.3 Single sources

| Required single source | Status | Evidence |
|---|---|---|
| Texts in `texts.ts` | OK | New document strings live only in `texts.ts` (`controlSubtitle`, `CONTROL_SHEET_COLUMN_LABELS`, `CONTROL_SHEET_STATUS_TEXT`, `CLASSIFICATION_LINE_SEPARATOR` / `classificationLineText`, `RULE_INDEX_TEXT`, `KLASIFIKASI` references `FRONT_PAYLOAD_LABELS.classification`). The MCP client still takes `PENYUSUN` from `CONTROL_FIELD_LABELS` (`scripts/studio/mcp/write-client.ts:133`), which C27's `PREPARER_LABELS` (`compose/front.ts:75`) also reads. The scorer keeps its own manual-sourced expectations (`expect_structure_a.ts` `manualColumns`). That is deliberate oracle independence, not duplication |
| Rule-index builder shared by DOCX and HTML | OK (builder); duplicate predicate | `front/rule-index.ts` `buildRuleIndex` / `expandRuleIndexMarker`, used by `docx/assemble/units.ts:353-365` and `html/assemble/slots.ts:247-281`. The AUTO-marker predicate and the omission rule are duplicated, issue #1 |
| Signature fill shared | OK | `filledSignature` `docx/wrapper/render.ts:527`, imported by `html/blocks/wrapper.ts:390` |
| Snap functions shared | OK | `docx/blocks/rhythm.ts`, imported by `html/blocks/text.ts:326`, `html/tables/apparatus.ts:517`, `html/tables/figure.ts:584`, `html/tables/table.ts:615` |
| Category mapping shared by editor and preview | OK | `template-editor/param-categories.ts` `groupByCategory`, used by `param-editor.tsx:396` and `template-preview/param-tools.ts:107-118`. The preview side has no rendering consumer, issue #16 |
| Back-cover predicate and title indent | OK | `backCoverPlaced` (`docx/wrapper/pages.ts`) and `coverTitleIndentTw` (`docx/wrapper/formats.ts`) are imported by HTML |

Duplicates that slipped in: issues #1, #2, #9, #10.

### 3.4 Correctness

| Item | Finding |
|---|---|
| C26 sheet numbering | One `w:pgNumType w:start="1"` on the first `kind === "chapter"` unit (`header-footer.ts:616, 646-650`), CT_SectPr order respected (`section.ts`, after `pgMar`, before `cols`). Absent / `dokumen` / unknown = no element. The LibreOffice +1 is documented and accepted (D-639). The total is the whole document's page count (wrapper pages included), so the last sheet always shows less than N (issue #7). **HTML print does not implement R-80 at all** (issue #3) |
| C16 NOTA line and warning path | The line is a footer paragraph after the register table, indented to the text edge of the `{nomor}` cell. The register cells are unchanged, so RB-03/RB-04 still hold. Warning `CLASSIFICATION_LINE_NO_NUMBER` for explicit cells or a pattern without `{nomor}` (`header-footer.ts:396-404`). HTML skips silently (`shell.ts:227`). The warning path has no test (issue #4) and is logged once per interior unit. An empty classification prints the label alone (issue #14) |
| C27 preparer substitution | Done at compose time on output rows only (`compose/front.ts:83-91, 108-114`). `meta.author`, the signature block and the revision rows are untouched. The payload stored by the MCP client is unchanged (`write-meta.ts` is not in the diff). R-79 is in `COMPOSE_PARAM_KEYS` with C-5 elision. Tested at `compose/c15-c27-cover-control-block.test.ts:82-114`. OK |
| C10 STATUS | `revisionStatusText(i === rows.length - 1, lang)` (`compose/front.ts:139`) assumes the latest revision comes last. That matches how the MCP client appends rows (`scripts/studio/mcp/write-meta.ts:188-194`). It is not stated in the payload docs (`resources.ts:90`). No tier branch. OK |
| C12 back-cover planner | DOCUMENT scope + `backCoverPlaced` + non-placeholder cover unit, in both DOCX (`units.ts:390-397`) and HTML (`back-cover.ts:22-27`). Never NOTA by data. Tested at `c12-back-cover-planner.test.ts:37, 92`. OK |
| C17 marker false positives | The grammar is anchored at the start, case-sensitive, has a closed code-family list, needs a level word, and has a lookahead terminator (`rule-index.ts` `MARKER_RE`). Tables, aside, monoBlock, derivation, caption, SOURCE and chapter titles are not scanned. Negative cases are tested (`c17-rule-index-builder.test.ts:84-127`). The remaining inherent ambiguity: a prose sentence that starts with `DT-05 WAJIB ...` as a cross-reference is indexed as a home. That is acceptable under research/37 |
| C18 filename | `datumFileNameByForm` (`storage/paths.ts:227-234`): the date comes from `meta.issueDate`, is validated by `ISSUE_DATE_RE` (format only, `^\d{4}-\d{2}-\d{2}$`), and the title goes through `datumClean` + `clip` + `assertSafeSegment`. On error it falls back to `document.<ext>` with a `FILE_NAME_FALLBACK` warning (`render/pure/render.ts:375-379`). Path-safe. Issue #19 covers collisions and calendar validation |
| C19/C20 rail reserve | `reserveColumn` is set only for mode A + framePr + R-75 true (`rail.ts:75-76`), and G-RAIL-3 is skipped only when that flag is set (`rail.ts:283`). The skip is document-wide (issue #13). Rhythm rounding: lines are rounded up, spacing to the nearest multiple. That collapses small gaps to 0 (issue #5) |
| C21 derived-preset guard | Targets = preset slugs + template slugs, duplicate check, base preset not a target so it must stay unchanged, `isPreset` enforced, pins re-checked in stored effective params (`seed-studio-templates.ts`, `runGuardedTemplateTx`, `derivedPresetStoredIssues`). Red-guard cases tested (`c21-derived-preset-seed.test.ts:360-408`). OK |
| C23 layer merging | `{ ...SHARED_LAYER, ...type.layer, ...lang.layer, doc.* }` (`seed-doc-type-templates.ts:219`). Disjointness is tested (`s26-doc-type-template-specs.test.ts`, "tiap kunci di satu lapis saja"). `device.spine.placements` adds `pembatas` on top of the preset pin. That is intended per DT-13f and register §4.1 (`research/38:249`), not a side effect. OK |

### 3.5 UI (D-633, D-637): PASS

- Navigation is accordion-only. No chip code is left: `grep -rni "chip|scrollIntoView|scroll-m|prefers-reduced|jumpTo"` under `template-editor`, `template-preview` and the UI tests hits only comments and the absence test (`param-editor-layout.test.ts:94`). The helpers removed with the chips are not exported (same test). `values.ts` `groupParams` and `param-tools.ts` `chapterRank` / `groupParams` / `ParamChapterGroup` were removed and have no consumer in `src` or `tests`.
- Labels are plain (D-633) and the jargon test exists (`ux-simplification.test.ts:32`).
- Accessibility: each category is a `section` with `aria-labelledby`, and its header button is inside an `h2`/`h3` (`param-editor.tsx:252-264`) with `aria-expanded`, `aria-controls`, a name from title + count and a description from the help line. Panels use `hidden`. The "Saringan lain" disclosure is a button with `aria-expanded` / `aria-controls` and a `hidden` panel (`:158-193`). The class select has an `aria-label`. The checkboxes are wrapped in labels. The result count is `aria-live="polite"`.
- "Saringan lain" holds the class filter and "Tampilkan yang nonaktif". The latter is offered only when the registry has inactive keys (`:112, 187`). The active-filter badge comes from `extraFilterCount`.

### 3.6 Tests

The new tests mostly guard behaviour: byte-identity sha checks for absent / false / default on every opt-in, red-guard seed cases, and rule-index negatives. Weak points: issues #4 and #17.

### 3.7 Dependency impact: PASS

| Changed contract | Callers | Status |
|---|---|---|
| `buildRoster(profilesDir, opts = {})` (`agent-roster.ts:165-168`), optional second arg | `getRoster` `agent-roster.ts:229`; tests | Backward compatible |
| `sectPrXml(s, rel, opts = {})` (`section.ts`) | `header-footer.ts:646`; `package/index.ts` re-export keeps 2 args | Compatible |
| `captionXml` / `keyRowXml` / `sourceLineXml` (figure), trailing optional `adjust` | `figure.ts:481-484` only | Compatible |
| `coverFront(..., params?)` | `compose/snapshot.ts:417` only | Compatible |
| `registerBody(spec, ctx, unit, setup, pStyle)` (module-private) | `header-footer.ts:523` | OK |
| `signatureXml(b, block)` (param rename) | `pages.ts:606`, `render.ts:651` | OK |
| Filename builder: `datumFileName` unchanged; new `datumFileNameByForm` | `render/pure/render.ts:369` (the only caller; `storage/index.ts:20` re-exports `datumFileName`) | OK |
| `auditText`, `sealBandTextsOf` | Not changed in this diff (`git diff HEAD --stat -- src/lib/studio/engine/bind` is empty; the `texts.ts` hunks do not touch `sealBandTextsOf` at `texts.ts:398`) | n/a |
| Preview barrel `groupParams` -> `groupParamsByCategory`, `searchParams` `chapter` -> `category` | No consumer in `src` or `tests` (grep), as `ui_param_categories.md:162` records | OK |
| `NORM_COMPOSE_PARAM_KEYS` / `COMPOSE_PARAM_KEYS` (+2, same order) | Parity tested (`c10-control-sheet-manual-columns.test.ts:48`) | OK |

## 4. Issues

| # | Severity | Domain | File:Line | Description | Recommendation |
|---|---|---|---|---|---|
| 1 | Medium | Duplication | `src/lib/studio/engine/front/rule-index.ts:254-258` vs `src/lib/studio/engine/docx/assemble/units.ts:191-195`; `units.ts:361` vs `src/lib/studio/engine/html/assemble/slots.ts:260` | The new `isRuleIndexAutoMarker` is an exact copy of the existing private `isEmptyRuleIndexMarker`, and `units.ts` already imports from `rule-index.ts`. The "omitted" rule is also written twice with a divergence: DOCX excludes `sectionType === "signatureBlock"`, HTML does not. DOCX also expands only the first marker per plan (`findIndex`), HTML all markers | Delete `isEmptyRuleIndexMarker` and import the shared predicate. Move the omission predicate (`required`, scoped slot, all-markers, signatureBlock) into `rule-index.ts` so both engines call one function |
| 2 | Medium | Duplication | `src/lib/studio/engine/docx/figures/figure.ts:63, 427, 434-445` vs `src/lib/studio/engine/docx/tables/render.ts:92, 105-114` | `ParaAdjust` is declared twice. The `apparatusAdjust` closure (`reserveRight` then `snapParaToBaseline`) is structurally identical in both renderers. `mmToTwFig` re-implements `mmToTw` from `engine/tokens` (already used by `rail.ts`) | Export one `apparatusParaAdjust(param, unitKind, widthTw)` from `blocks/rail.ts` or `blocks/rhythm.ts`, and import `mmToTw` from tokens |
| 3 | Medium | Reference Integrity | `src/lib/studio/engine/html/base/shell.ts:10-11` (register `counter(page)` / `counter(pages)`); seed `prisma/seed-doc-type-templates.ts:175` | R-80 `bab1` is seeded in the 5 ID templates, but HTML print still numbers sheets from document page 1. The HTML preview and the DOCX/PDF disagree on "LEMBAR n" for those templates. C22's scope (blueprint line 200) did not include C26, and no report records this as a known limitation (`coder_execution_c22.md` §limitations lists only R-74 rows/images) | Record it as a known limitation in the controller report before production approval, or add a C22c row that resets an `@page` counter on the first chapter unit when R-80 = `bab1` |
| 4 | Medium | Tests | `src/lib/studio/engine/docx/package/header-footer.ts:396-404`; `src/lib/studio/engine/html/base/shell.ts:227` | The C16 warning path `CLASSIFICATION_LINE_NO_NUMBER` (explicit `spec.cells` or a pattern without `{nomor}`) has no test: `grep -rln CLASSIFICATION_LINE_NO_NUMBER tests/unit/studio` returns nothing. The HTML silent-skip branch is also untested. The warning is emitted once per interior unit, so a long NOTA logs N identical warnings | Add one DOCX test (explicit cells -> warning, no line, footer bytes = default) and one HTML test (no `{nomor}` -> no `.reg-cls`). Consider de-duplicating the warning per document |
| 5 | Medium | Correctness (design) | `src/lib/studio/engine/docx/blocks/rhythm.ts:44-46` (`snapNearTw`); evidence `delegation_progress/coder_execution_engine_e.md:112, 114` | Rounding spacing to the nearest multiple of 270 tw collapses every gap under 135 tw to 0. Measured: section-heading after 80 -> 0, so headings sit flush on the body. Single-line table rows go 350 -> 540 tw (+54 %). This follows DT-10b literally and is opt-in, but `ENGINE_E_LAYOUT_OPT_INS = true` (`seed-doc-type-templates.ts:54`) turns it on for all 10 templates. D-642 records clash and line-length evidence only, with no visual sign-off | Get a USER visual check of one PT and one STD PDF before production. If the heading-body gap matters, round non-zero spacing up to at least one baseline (`snapUpTw` for values > 0). The single constant already allows switching it off |
| 6 | Low | Maintainability | `src/lib/studio/params/render.ts:390` | The generic "classification line under the document number" feature is named after one family (`render.nota.*`) and is categorised under "Penomoran & klasifikasi" through the `nota` segment (`param-categories.ts:180`). Not a U4 violation (section 3.1) | Before production, rename to a family-neutral key, e.g. `device.registerBlock.classificationLine`. That fits the register namespace and the "Header & footer" category, and at this point only 2 DEV templates at v3 store the key |
| 7 | Low | Correctness | `src/lib/studio/engine/docx/package/header-footer.ts:612-616` | With `bab1`, n restarts at Chapter 1 but N = NUMPAGES = all pages including the cover, control sheet and TOC. The last sheet therefore always reads below N, by the number of wrapper pages, plus the LibreOffice +1 on even starts (a_terbit: `LEMBAR 1..4 DARI 8`, `coder_execution_engine_c.md:77`). D-639 calls it "+1", but the example it accepted shows the full gap | At production approval, state it explicitly: "the last sheet = chapter pages, N = PDF pages (+1 in LibreOffice)". No code change needed if USER confirms |
| 8 | Low | Structure | `src/lib/studio/engine/front/texts.ts:77, 130, 261, 468` | Four comments still say "Belum ada pemanggil" (no caller yet). Callers now exist (`pages.ts:303`, `compose/front.ts:29-30`, `header-footer.ts:407`, `shell.ts:229`, `rule-index.ts:234-248`) | Remove the stale sentences |
| 9 | Low | Duplication | `src/lib/studio/engine/docx/package/header-footer.ts:405-408`; `src/lib/studio/engine/html/base/shell.ts:228-233` | Both engines get the label part by slicing `classificationLineText(...)` by the length of the value. The decomposition is repeated, and it breaks silently if the text shape changes | Export `classificationLineLabel(lang)` from `texts.ts` and build the full text from it |
| 10 | Low | Duplication | `header-footer.ts:92-95` vs `shell.ts:160-163` | `runningHeadRuleOverride` and `ruleColourOverride` are near-copies (normalise, then compare to the registry default). Semantic quirk: an author who explicitly sets R-72 to the registry default `C3CBD1` cannot override a preset's different border colour, so the editor shows a value that is not rendered | Share one `nonDefaultHex(params, key)` helper in `front/`. Note the quirk in the R-72 `classNote` |
| 11 | Low | Structure | `src/lib/studio/engine/docx/blocks/structure.ts:30-41` | `onBaseline` / `ruleOnBaseline` were inserted between import statements. `import { structuralFor } from "./text"` now comes after two function declarations | Move the helpers below the import block |
| 12 | Low | Maintainability | `src/lib/studio/engine/docx/figures/figure.ts:436` | `ctx.snapshot.units.find(...)` runs for every figure even with both opt-ins off, and has no optional chaining. The table renderers guard it (`tables/render.ts` `ctx.snapshot?.units?.find`, HTML `table.ts:664`) | Compute `kind` only when `reserve` can apply, and use the same defensive access as the tables |
| 13 | Low | Correctness | `src/lib/studio/engine/docx/blocks/rail.ts:283` | Under R-75 the G-RAIL-3 "narrowed without chip" check is skipped for the whole document, including wrapper units where no reservation applies. A wrongly narrowed cover or control-sheet paragraph would go unnoticed | Skip only paragraphs whose unit is interior, or check that narrowed wrapper paragraphs are absent |
| 14 | Low | Correctness | `header-footer.ts:405-411`; `shell.ts:228-233` | With an empty `meta.classification`, the footer line prints "Klasifikasi : " with no value. The cover control-block path skips empty values (`texts.ts`, the `KLASIFIKASI` value) | Skip the line, or warn, when `classificationMarkText(...)` is empty |
| 15 | Low | UI | `src/components/studio/template-editor/param-categories.ts:162` | R-71 `render.docx.pageBackground` falls into "Pembuatan file & ekspor" through the `render.docx` segment, while the "Warna" category help promises "latar halaman" (`param-categories.ts` `PARAM_CATEGORIES`, subgroup `page: Latar halaman`) | Add an `R_EXACT_OVERRIDES` entry mapping R-71 to `warna` |
| 16 | Low | UI | `src/components/studio/template-preview/param-tools.ts:107-118`; barrel `template-preview/index.tsx:49` | `groupParamsByCategory` has no rendering consumer (as `ui_param_categories.md:115` records), so the USER's "Preview pane grouping" addendum (D-627) exists only as an exported API. `ParamNamespaceGroup.namespace` now holds a subgroup key (`chart.kind`, `type.scale`), which `searchParams({ namespace })` (`param-tools.ts:59`) never matches | Tell USER plainly that the preview pane has no grouped list to change. Rename the field to `subgroupKey`, or document the mismatch |
| 17 | Low | Tests | `tests/unit/studio/seed/s26-doc-type-template-specs.test.ts:310`; `tests/unit/studio/seed/c21-derived-preset-seed.test.ts:462`; `tests/unit/studio/ui-categories/param-editor-layout.test.ts:94`; `tests/unit/agent-roster.test.ts:76, 83, 112, 180` | Several tests check source text, not behaviour: a literal-occurrence count, a regex for "no slug branch", and the absence of exported names. The UI tests are SSR markup only, with no click or keyboard interaction (toggle, "Saringan lain", Buka/Tutup semua); the pure helpers are tested instead. The roster real-disk count test repeats the implementation's own counting. Fixture tests at lines 76, 83 and 112 call `buildRoster(fixtureProfiles)` without `controllerRosterFile`, so they still read this machine's controller file (no assertion depends on it, but the header comment says otherwise) | Keep the grep tests as tripwires, but do not count them as behaviour evidence. Add one interaction test with a DOM renderer for the accordion and the disclosure. Pass `controllerRosterFile` in every fixture test |
| 18 | Low | Maintainability | `src/lib/agent-roster.ts:42` | All three `CONTROLLER_FALLBACK` entries have a `PROFILE_META` entry (`agent-roster.ts:62, 104, 106`), and meta wins over the controller set. The fallback list therefore never changes any output, and the test at `agent-roster.test.ts:102` only checks a non-member | Either delete the fallback or list profiles that lack meta. Out of studio scope; track with the D-647 leftovers |
| 19 | Low | Correctness | `src/lib/studio/services/storage/paths.ts:215-224` | `judulTanggalIso` drops the number and revision, so two revisions of the same NOTA title issued on the same day get the same file name (D-642's Tabel 2.3 form). `ISSUE_DATE_RE` checks the format only (`2026-13-45` passes) | Acceptable per the manual. If downloads can be bundled across revisions, add a collision suffix there. Optionally validate the calendar date |

## 5. Key challenges

1. **Is the rule-index omission rule really "shared"?** The builder is shared, but the decision about when a unit disappears is not (issue #1). The next change to D-299 semantics must be made in two places, and the two already disagree on `signatureBlock`.
2. **Should R-74 ship on by default for all 10 templates?** One constant turns it on for every template. The rounding policy removes the heading-body gap and makes single-line table rows 54 % taller (issue #5). The evidence so far is clash-free and within line length, which is not the same as reading well.
3. **DOCX/HTML parity is now asymmetric for R-80** (issue #3), while R-74 rows/images and R-71 are documented gaps. The reviewer of a template in the Studio preview will see different sheet numbers than in the PDF.
4. **Family-named keys age badly** (issue #6). The behaviour is generic. Renaming now is nearly free; after production it is a data migration.
5. **C26 "of N" semantics** (issue #7): the accepted wording ("+1") understates the gap a reader will see on the last page.

## 6. Positive findings

- U4 discipline is consistent: every opt-in reads only template params; "never NOTA" falls out of the plan having no cover; the derived preset and the 10 templates come from data tables with generic runners.
- Byte identity is designed in, not just measured: fallbacks to the registry default, constants equal to the defaults, compose C-5 elision, early `return ctx` in the HTML context transforms, and sha-equality tests for absent / false / default on each opt-in.
- C27 respects the payload boundary. The substitution happens at compose output, the reasoning against substituting in the client is documented (D-639 (2)), and a test proves the signature and revision rows stay with `meta.author`.
- The seed runner guard was extended with care: preset targets come first, there is a duplicate-target check, the base preset must stay unchanged, `isPreset` is enforced, and pins are re-verified in stored effective params. Red cases are tested.
- clash.py G-06 is relaxed narrowly: the allowed line must be the next baseline, aligned to the number cell, match the text pattern, match the DOCX footer paragraph when available, and stay in the text column. A third line is still flagged.
- The UI refactor removed the chapter path completely, kept one category helper, and moved the layout logic into pure, tested helpers. Accessibility attributes are applied consistently.
- The agent-roster test now uses its own fixture controller file through a backward-compatible option, and fixes a real gap: the three consolidated workers had fallen into the unrendered `general` group.

## 7. Files reviewed

Diffs read in full (`git diff HEAD`):
- `src/lib/studio/params/render.ts`, `params/page.ts`, `params/index.ts`, `registry/essentials.ts`, `contract/types/v2/norm.ts`
- `engine/front/texts.ts`
- `engine/docx/wrapper/{formats,index,pages,render}.ts`
- `engine/docx/package/{header-footer,index,parts,section}.ts`
- `engine/docx/blocks/{env,rail,source-register,structure}.ts`, `engine/docx/figures/figure.ts`, `engine/docx/tables/render.ts`, `engine/docx/assemble/units.ts`
- `engine/html/assemble/{index,slots}.ts`, `engine/html/base/shell.ts`, `engine/html/blocks/{index,text,wrapper}.ts`, `engine/html/tables/{apparatus,figure,table}.ts`
- `services/compose/{context,front,snapshot}.ts`, `services/render/pure/render.ts`, `services/storage/paths.ts`
- `prisma/seed-doc-type-templates.ts`, `prisma/seed-studio-templates.ts`, `prisma/seed-studio.ts`
- `benchmark/datum_conformance/rules/{language,structure_a,expect_language,expect_structure_a}.ts`, `benchmark/datum_conformance/clash/clash.py`
- `src/components/studio/template-editor/{advanced-panel.tsx,param-labels.ts,template-editor.tsx,values.ts}`, `src/components/studio/template-preview/{index.tsx,param-tools.ts}`
- `src/lib/agent-roster.ts`, `tests/unit/agent-roster.test.ts`

Untracked files read in full:
- `src/lib/studio/engine/front/rule-index.ts`, `engine/docx/blocks/rhythm.ts`, `engine/html/assemble/back-cover.ts`
- `prisma/seed-derived-presets.ts`
- `src/components/studio/template-editor/{param-categories.ts,param-editor-state.ts}`
- `src/components/studio/template-editor/param-editor.tsx` (whole file)

Affected files and callers checked:
- `scripts/studio/mcp/{write-client,write-meta,resources}.ts`
- `src/app/agents/page.tsx:262`, `src/app/orchestration/page.tsx:157-160`
- `src/lib/studio/services/storage/index.ts`, `src/lib/studio/contract/dispatch.ts`, `src/lib/studio/contract/types/model.ts`
- `src/lib/studio/engine/front/texts.ts:62-69, 398`
- `src/lib/studio/engine/bind/*` (unchanged)

Tests inspected:
- `tests/unit/studio/renderers/{c12-back-cover-planner,c17-rule-index-builder,engine-c-coverage-round,rh03-rule-colour-precedence}.test.ts`
- `tests/unit/studio/compose/{c10-control-sheet-manual-columns,c15-c27-cover-control-block}.test.ts`
- `tests/unit/studio/render/c18-file-name-form.test.ts`
- `tests/unit/studio/seed/{s26-doc-type-template-specs,c21-derived-preset-seed}.test.ts`
- `tests/unit/studio/ui-categories/*.test.ts`

Docs read:
- `decisions/decisions.md` (D-625..D-647)
- `identification/03_structured_datum_coverage_round.md` (lines 18-32, 128-140, 182-212)
- `research/35_registry_param_safety_spike.md` §5, `research/38_coverage_round_names_register.md` (spine and category rows)
- `verification/31_coverage_round_regression.md`
- `delegation_progress/{ui_param_categories,coder_execution_c06_c07,coder_execution_engine_c,coder_execution_engine_e,coder_execution_c22,coder_execution_c23}.md` (relevant sections)
