---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: C34 follow-ups #1, #4, #16 (D-650) + addendum "EN preview sample"
date: 2026-11-05
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/verification/34_coverage_round_code_review.md (issues #1, #4, #16); decisions/decisions.md D-650, D-627, D-633, D-637
skills_loaded: receiving-code-review, tdd, dry-run-verify-fix
status: complete
---

# Implementation Report: C34 review follow-ups #1, #4, #16 and the EN preview sample

Repo `C:\Users\TRIAL\gsp-swarm-hq-v2.1`, uncommitted tree. Nothing committed. No browser opened (the controller checks the preview pane in the logged-in browser).

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| #1 | One shared AUTO-marker predicate + one D-299 "drop empty optional unit" rule for DOCX and HTML | complete | Red test first (HTML dropped a signatureBlock unit), then the helper |
| #4 | `CLASSIFICATION_LINE_NO_NUMBER` logged at most once per document; tests for DOCX warning, no line, HTML silent skip | complete | Red test first (2 warnings for 2 interior units) |
| #16 | Grouped (category accordion) list rendered in the template preview pane | complete | Red tests first (pane had no list) |
| EN | English preview sample chosen by the template's `doc.language` | complete | Red tests first (modules absent), ID hash pins taken from the code before the change |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| `src/lib/studio/engine/front/rule-index.ts` | modify | New `emptyOptionalUnitOmitted(slot, unitBlocks, { scoped })`: the one D-299 rule (optional, not scoped to that slot, only AUTO markers or no blocks, never `signatureBlock`). `isRuleIndexAutoMarker` stays the single marker predicate |
| `src/lib/studio/engine/docx/assemble/units.ts` | modify | Private `isEmptyRuleIndexMarker` deleted; (c1) and (c2) both call `isRuleIndexAutoMarker` / `emptyOptionalUnitOmitted` (logic unchanged, placeholder check stays at the caller) |
| `src/lib/studio/engine/html/assemble/slots.ts` | modify | `withRuleIndex` uses `emptyOptionalUnitOmitted`, so HTML now also keeps signatureBlock slots |
| `src/lib/studio/engine/docx/package/header-footer.ts` | modify (C16 warning only) | `CLASSIFICATION_LINE_NO_NUMBER` constant; optional `warned: Set<string>` threaded `buildSectionPackage` -> `headerFooterXml` -> `registerBody` -> `classificationLineXml`; one set per document, so the warning is logged once. Direct callers without a set keep logging per call |
| `src/components/studio/template-preview/param-groups.tsx` | add | `PreviewParamGroups` (read-only category accordion, editor style) + pure `previewParamDefs` |
| `src/components/studio/template-preview/preview-language.ts` | add | `previewLanguageOf(draftLayers, resolved)`: draft `doc.language` wins, then resolved version value, then ID |
| `src/components/studio/template-preview/sample-document.ts` | modify | `SAMPLE_DOCUMENT_EN` (v1, faithful EN translation) + `sampleDocumentFor(lang)`; `SAMPLE_DOCUMENT` untouched |
| `src/components/studio/template-preview/sample-document-v2.ts` | modify | EN payload set + optional `language` input; ID payloads untouched (byte-identical output) |
| `src/components/studio/template-preview/api.ts` | modify | `fetchTemplateRef` also returns `version.resolvedParams["doc.language"]` |
| `src/components/studio/template-preview/index.tsx` | modify | Picks the sample by language; loads the param registry once (or takes optional `paramRegistry`), renders `PreviewParamGroups` below the PDF note with an inline `ErrorView` + retry on registry failure; barrel exports the new helpers |
| `tests/unit/studio/renderers/c34-rule-index-omission-shared.test.ts` | add | Marker predicate, shared rule (all branches incl. signatureBlock), HTML integration (signatureBlock unit with only a marker is kept, empty line, no `OPTIONAL_SLOT_EMPTY_OMITTED`) |
| `tests/unit/studio/renderers/c34-classification-line-no-number.test.ts` | add | DOCX: one warning per document with >1 register footer, no line, footers equal to opt-in off; control with `{nomor}`. HTML: no `.reg-cls`, output equal to opt-in off; control emits `.reg-cls` |
| `tests/unit/studio/ui-categories/preview-param-groups.test.ts` | add | SSR (`react-dom/server`): categories present in shared-helper order, plain labels + one-line help + counts, all closed, no chips, no chapter headings ("Bab n"), rows only when open, empty -> nothing; mounted in `TemplatePreviewPane` (v1 values and v2 `draftTemplate` values), pane unchanged without registry |
| `tests/unit/studio/template-preview/en-preview-sample.test.ts` | add | Language selection; ID hash pins (v1, v2); EN sample free of AC-6 and ID sample strings with EN numbers; label tripwires vs `FRONT_PAYLOAD_LABELS` / `CONTROL_SHEET_COLUMNS`; HTML render through the server path for an EN and an ID seed template |
| `delegation_progress/file_claims.md` | modify (append) | Claim row C34-RF |

`src/lib/studio/engine/html/base/shell.ts` was not changed: its `classificationLine` comment already states that HTML has no log channel; the new test covers that branch.

## Decision #1: signature-block slots

The DOCX behaviour is the correct one and both renderers now follow it. A `signatureBlock` slot's presence is decided by the R-42 placement rule (`slot.placement`: inside the control sheet or standalone, DOCX `units.ts` step (c)); the D-299 empty-optional rule must not override it. In DOCX the exclusion was already in both (c1) and (c2); HTML lacked it, so an optional signature slot whose unit held only an AUTO rule-index marker was silently removed in HTML but kept in DOCX. No current template has such a unit, which is why the baseline is unchanged.

Not changed (outside the three items): DOCX expands only the first AUTO marker per unit (`findIndex`), HTML expands every marker. No current template has two markers in one unit. Recorded here for a later row.

## #16 design (preview pane)

The pane had no parameter list at all, so a list was added rather than regrouped: "Pengaturan yang dipakai pratinjau: N pengaturan, per kategori." It shows the draft settings that the preview sends (v2: `draftTemplate.essentials` + `advanced`; v1: `essentials` + `advanced` + `draftOverrides`), restricted to registry keys, grouped by `groupParamsByCategory` (the shared `groupByCategory` mapping). Same style as the editor: category accordion is the only navigation (h3 > button with `aria-expanded` / `aria-controls`, chevron, title, one-line help, "n pengaturan"), panels `hidden`, all categories closed at start, small categories flat, large ones with plain subgroup captions (no nested accordion, no chapter headings), plain labels via `paramDisplayLabel`, values via the editor's `ReadonlyValue`. Read only; editing stays in the settings panel. The template editor (`template-editor/**`, not mine) needs no change: the pane fetches the registry itself (`GET /api/studio/registry?kind=params`, once per mount).

Curl-first: DEV 9021 and prod 9011 both answered `401 {"error":"Unauthorized"}` for `/api/studio/registry?kind=params` and `/api/studio/templates` (no session in this agent). Shapes were confirmed from the route source instead: registry `200 { kind, count, items: ParamDef[], meta }` (`src/app/api/studio/registry/route.ts:173-186`), template detail keeps `version.resolvedParams` for every role (`src/app/api/studio/templates/[id]/route.ts:5-10`). The live check against the running backend is the controller's browser check.

## EN preview sample

- **Selection:** `previewLanguageOf([previewValues], ref.language)`: the draft's `doc.language` (essential knob EK-G06) wins, else the version's resolved `doc.language`, else ID. Data only, no slug or type branch. A caller-supplied `sampleDocument` still wins.
- **ID unchanged:** `SAMPLE_DOCUMENT` and the ID v2 payloads are untouched. Hash pins computed from the code before the change: v1 `84c59459...e794`, v2 `f939b44d...162e` (fixed 7-slot list); both still match, and the request body for an ID template is identical.
- **EN sample:** same structure, plain UK English, EN numbers (6,546.2 m, 3,120.0, 3,426.2, 185,000), "October 2026", "Engineering Division, PT GSP", IDR instead of Rp in the v1 register.
- **Front-matter labels (item 3):** I chose to leave labels out wherever the engine has a language-aware default, and to keep literals only where the payload requires them:
  - control-sheet title omitted (engine default = the template's slot label, "Control Sheet" for EN templates);
  - revision history sent in list form, so the column heads come from `controlSheetColumnHeads` (EN: Rev, Date, Prepared by, Change, Status in the manual form);
  - v1: control-sheet kicker, TOC title and chapter kickers omitted;
  - signature roles are required payload text with no engine default, so the EN sample carries "Prepared by / Reviewed by / Approved by" (D-590). A test pins them to `FRONT_PAYLOAD_LABELS.*.EN`, and the ID literals to the `.ID` entries and `CONTROL_SHEET_COLUMNS.revision.ID`.
  - `texts.ts` is not imported into the client sample, because it imports the full parameter registry (`PARAMS_BY_KEY`) and would pull it into the editor bundle.
- **Render evidence:** the EN seed template (from `DOC_TYPE_TEMPLATE_SPECS`, picked by data: language EN with cover and control sheet) rendered through schema check -> `defaultMeta` -> `mergeSubmission` -> `composeV2` -> `assembleHtml`. The visible text has none of the 11 AC-6 strings and none of the 38 ID sample strings (word-boundary match), and it contains "6,546.2 m", "3,120.0", "3,426.2", "Scope of work", "Prepared by".
- **Remaining Indonesian in the EN render (not sample data, outside my ownership):**
  1. `TERBATAS` (cover control block, seal band, register): from the template param `classification.level` (`compose/merge.ts:86`); the EN seed layer has no EN classification value. Fix belongs in `prisma/seed-doc-type-templates.ts` (EN layer), which I may not edit.
  2. `TERUKUR` (rail provenance mark) and `Tier SERAH` (cover control block): enum codes printed as-is by the engine in EN. A language-aware label belongs in the engine text table / block renderers (`html/blocks/text.ts` is owned by another agent now).

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| New + touched suites | `npx vitest run tests/unit/studio/renderers/c34-rule-index-omission-shared.test.ts tests/unit/studio/renderers/c17-rule-index-render.test.ts tests/unit/studio/renderers/c17-rule-index-builder.test.ts` | 3 files, 32 tests passed | |
| | `npx vitest run tests/unit/studio/renderers/c34-classification-line-no-number.test.ts tests/unit/studio/renderers/engine-c-coverage-round.test.ts` | 2 files, 35 tests passed | |
| | `npx vitest run tests/unit/studio/ui-categories/ tests/unit/studio/template-preview/ tests/unit/studio/ui02` | 9 files, 94 tests passed | |
| Studio suite | `npx vitest run tests/unit/studio` | `Test Files 289 passed (289)`, `Tests 5115 passed (5115)`, EXIT=0 (462 s) | includes the other agent's in-flight `c34b-rhythm-min-baseline` test present in the tree |
| Typecheck | `npx tsc --noEmit -p . --incremental false` | 0 lines, EXIT=0 | after fixing one test typing error (`indexOf` on `ScopedParamDef`) |
| Lint | `npx eslint --max-warnings 0 <11 changed source files + 4 new tests>` | 0 lines, EXIT=0 | |
| Baseline | `npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root C:/Users/TRIAL/gsp-swarm-hq-v2.1 --out C:/tmp/bl_rf1 --inputs .../datum-rev-a-baseline/inputs --compare C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline` | 8 SAME lines (hashes equal to baseline), exactly 4 `INFO compose snapshot` lines, `compare: 8/8 SAME`, EXIT=0 | HTML byte-identical for current templates |
| Convert | `npx tsx benchmark/extract/convert_v2.ts --check` | SAME x3 (doc.v2 `79290e07...`, template.v2 `882057c5...`, preset `a951b149...`), EXIT=0 | |
| U4 | grep of added lines in my files for a conditional on slug/typeCode/docType/tier/type literals/`datum-` | 2 hits, neither a branch (`defaultTier ?? ...` default, `slug: ref.slug` argument) | 0 behaviour branches |

## Verification

- #1 one helper: `grep -rn "isEmptyRuleIndexMarker" src` returns nothing; DOCX (c1), (c2) and HTML `withRuleIndex` call `emptyOptionalUnitOmitted`. HTML signatureBlock parity proven by the integration test; old C17 DOCX/HTML tests still pass; baseline 8/8 SAME.
- #4 once per document: the test document has more than one register footer and exactly 1 warning; footers equal to opt-in off (no line); HTML skip covered; control cases print the line / emit `.reg-cls`.
- #16 grouped list in the pane: SSR tests of the component and of `TemplatePreviewPane` (categories present, no chapter headings, no chips, closed by default); existing preview behaviour text and placeholder still render; without a registry the pane renders as before.
- EN sample: see section above; ID hash pins hold.

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| EN render still shows `TERBATAS`, `TERUKUR`, `SERAH` | 0 (outside ownership) | Template classification value and engine enum-code printing, not the sample | Reported for a seed / engine row | No (sample itself is clean) |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| #1 | Which signature-block behaviour is correct | DOCX: signature slots are governed by R-42 placement, never dropped by D-299. HTML now matches |
| #1 | DOCX expands the first marker per unit, HTML all markers | Left as is (outside the three items, no current template affected); noted for a later row |
| #4 | How to de-duplicate | Per-document `Set` threaded from `buildSectionPackage`; no module state, `RenderContext` identity untouched |
| #16 | No param list existed in the pane | Added a read-only "settings used by this preview" list; the pane fetches the registry itself so `template-editor/**` stays untouched |
| #16 | Live endpoint check impossible (401 without session) | Shapes confirmed from route source; controller's browser check is the live integration check |
| EN | Labels from `texts.ts` vs leaving them out | Left out where the engine has a language default; required signature roles kept as literals with a tripwire test; `texts.ts` not imported client-side (bundle) |
| EN | Template-level Indonesian in EN preview (`TERBATAS`, enum codes) | Not masked in the sample; reported as follow-ups (seed EN layer `classification.level`; engine labels for provenance marks and tier) |
| Review side note | `ParamNamespaceGroup.namespace` holds a subgroup key (review #16 second half) | Not renamed (public type, not in the asked scope); used only as `data-subgroup` |

## Next Steps

- Controller: browser check of the preview pane on DEV (EN template sample text, grouped list, registry error state).
- Follow-ups for other rows: EN classification value in the EN seed layer; EN labels for provenance marks and tier codes; DOCX/HTML multi-marker expansion parity.
- Review recommended (scope: the four new/changed template-preview files and the two engine helpers).
