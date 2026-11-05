---
task_slug: doc_artifact_studio
row: U06
agent: senior-code-reviewer
skill: code-review-senior
date: 2026-11-05
source_plan: identification/03_structured_datum_coverage_round.md (row U06)
inputs: decisions D-626, D-627, D-630; research/39_param_categories.md; delegation_progress/ui_param_categories.md
status: complete
verdict: APPROVED WITH COMMENTS
---

# 42 - UI/UX consistency review: parameter category grouping (U02-U04)

## Summary

Overall verdict: **APPROVED WITH COMMENTS**. There are 9 issues: 0 High, 1 Medium and 8 Low.

The change does what the USER asked for in D-626, "bukan per bab tapi per jenis/kategori saja". The chapter level is gone from both the template editor and the preview utilities. Both now use one pure, table-driven helper (`param-categories.ts`) that matches research/39 exactly:

- 15 categories, E01-E30, the R tables, sub-group labels and S1;
- the live-registry tests pin 788 keys and an empty Lainnya.

All existing behaviour is preserved: search auto-expand, `refFilter` and `?paramFilter=` sync, "n diubah", open/close state, `aria-expanded`, native button keyboard toggling and the global focus ring. The diff is UI-only. Nothing that was removed has a remaining caller.

The one Medium finding is about vocabulary. Four category labels mix in English or jargon ("grid", "chart", "Lint", "Renderer"), while the rest of Studio already uses Indonesian for the same ideas ("Kisi", "Grafik", "Pembuatan berkas"). These labels do match research/39 and the example list in D-626, so this is a decision for the controller or USER, not a defect against the spec.

## Fresh verification evidence (2026-11-05)

| Check | Command | Result |
|---|---|---|
| Unit + Studio suite | `npx vitest run tests/unit/studio/ui-categories tests/unit/studio` | `Test Files 262 passed (262)`, `Tests 4764 passed (4764)`, exit 0, 289.5 s |
| Typecheck | `npx tsc --noEmit -p .` | exit 0, no output |
| Lint (changed files) | `npx eslint <param-categories.ts, param-editor.tsx, values.ts, param-tools.ts, template-preview/index.tsx> tests/unit/studio/ui-categories/` | exit 0, no output |
| Removed-symbol grep (whole repo, excl. node_modules/.next/.git/docs) | `grep -rn -E "\b(groupParams\|chapterRank\|ParamChapterGroup)\b" .` (excluding `groupParamsByCategory`) | Hits only in `tests/unit/studio/ui-categories/preview-param-tools-categories.test.ts:3,56-64`, which assert absence. 0 hits in `src/`, `scripts/` or other tests. |
| `searchParams(` callers | grep over `src tests scripts` | Only the definition, `param-tools.ts:52`. The removed `chapter` option has no caller. |
| Scope | `git status --short` (non-docs) | Modified: `param-editor.tsx`, `values.ts`, `template-preview/index.tsx`, `param-tools.ts`. New: `param-categories.ts`, `tests/unit/studio/ui-categories/`. `package.json` and the lockfile are unchanged. No change under `src/lib/**`, `src/app/**`, `prisma/**` or `scripts/**`. |
| Runtime robustness probe (scratch test outside the repo, run with a scratch vitest config rooted at the repo, no repo file written) | registry plus `R zzzNew.thing`, `render.zzzSeg.thing`, group `P99` | `groupByCategory` returns Lainnya last (3 keys). `ParamEditor` server-renders `data-category="lainnya"` without throwing. `groupParamsByCategory(...).at(-1)` is Lainnya. A raw namespace label (`zzzNew`) is shown only for the unknown namespace. |
| Label probe (same scratch test) | live `ALL_PARAMS` | 0 sub-groups fall back to a raw key. 2 sub-groups repeat their category label (see #3). A prototype-named group (`"constructor"`) makes `categoryOf` return the `Object` function, and the param is dropped (see #7). |

The `?paramFilter=` route compile and the browser screenshots belong to U05 (`verification/41_param_category_ui_check.md`). They were not repeated here.

## Verdict per domain

Standard code-review domains:

| Domain | Verdict | Issues |
|---|---|---|
| Structure | PASS | 2 Low (#6, #9) |
| Dependency Impact | PASS | 0 |
| Duplication | PASS | 0 |
| Maintainability | CAUTION | 1 Medium (#1), 3 Low (#2, #3, #8) |
| Reference Integrity | PASS | 0 |

U06 check areas:

| Check area | Verdict | Issues |
|---|---|---|
| 1. Labels and order | CAUTION | 1 Medium (#1), 2 Low (#2, #3) |
| 2. Behaviour preserved | PASS | 0 |
| 3. Accessibility | PASS | 2 Low (#4 new, #5 pre-existing) |
| 4. Consistency with the essentials panel and the UI kit | PASS | 0 (pre-existing gap noted in #5) |
| 5. Scope (UI-only, removed symbols, no dependency) | PASS | 0 |
| 6. Test quality | PASS | 1 Low (#8) |
| 7. Robustness (unknown key -> Lainnya, no crash) | PASS | 1 Low (#7) |

## Issues

| # | Severity | Domain | File:Line | Description | Recommendation |
|---|---|---|---|---|---|
| 1 | Medium | Labels / Maintainability | `src/components/studio/template-editor/param-categories.ts:50, 55, 60, 61` | Four category labels contain English or jargon: "Halaman & grid", "Gambar & chart", "Lint & pemeriksaan" and "Renderer & ekspor". Studio already uses Indonesian for the same ideas: `grid: "Kisi dan margin"` (`param-labels.ts:74`), `chart: "Grafik"` (`param-labels.ts:103`, `shared/labels.ts:173`) and `render: "Pembuatan berkas"` (`param-labels.ts:107`). The same module's sub-labels also say "Kisi dan margin" (`:243`), "Aturan grafik umum" (`:279`) and "Perender ..." (`:250, :276`), so the user sees "Gambar & chart" above "Aturan grafik umum". The labels do match research/39 (`:71, :76, :81, :82`) and the D-626 example list, so this is a design question, not a spec breach. | The controller or USER should decide. Candidate labels: "Halaman & kisi", "Gambar & grafik", "Pemeriksaan & lint" or "Pemeriksaan mutu", and "Pembuatan berkas & ekspor". Keep the slug IDs (`halaman-grid`, `gambar-chart` and so on) so open-state IDs and tests stay stable. Update research/39 and the label assertions in `param-editor-categories.test.ts:57` together. |
| 2 | Low | Labels | `param-categories.ts:239, 336, 359, 360, 371` | Some sub-group labels still read as developer jargon: "Format run dan penanda butir (DOCX)", "Tier dokumen", "Penegakan lint", "Lint dan rekonsiliasi per tier" and "Kiriman konten v1". These sit mostly in preset mode (admin). Only `:239` is on the advanced surface (Tipografi, 3 keys). | Optional wording pass, for example "Format teks per potongan dan penanda butir (DOCX)" for `:239` and "Format kiriman konten (v1)" for `:371`. Low priority. |
| 3 | Low | Labels | `param-categories.ts:259` (`controlSheet` "Lembar kendali" in category "Lembar kendali"), `:271` (`table` "Tabel" in category "Tabel") | A sub-group repeats its category label, which gives a "Lembar kendali > Lembar kendali" or "Tabel > Tabel" hierarchy. The label probe confirmed these are the only two cases. | Give these two sub-groups distinct labels, for example "Isi lembar kendali" and "Garis, zebra, dan kepala tabel". |
| 4 | Low | Accessibility | `src/components/studio/template-editor/param-editor.tsx:177` | The category help line is new content, but it is shown only through `title` on a non-focusable `<span>` inside the toggle button. A descendant's `title` does not add to the button's accessible name or description, so keyboard and screen-reader users never get the help text. Mouse hover is the only way to see it. | Expose the help through `aria-describedby` on the button, pointing at an `sr-only` span (or a muted visible line under the header when it is open). |
| 5 | Low (pre-existing, not introduced) | Accessibility / Consistency | `param-editor.tsx:167, 168, 175, 196`; `template-editor.tsx:376, 640-641` | Three gaps carried over unchanged from the chapter version. (a) The category `<section>` has no `aria-labelledby`, although the essentials panel names its sections (`template-editor.tsx:640-641`). (b) In preset mode the heading order jumps from h1 (`:376`) straight to the category h3 with no h2. (c) Both toggle levels are `disabled` while searching, which takes them out of the tab order even though `aria-expanded="true"`. | Out of U03 scope; recorded only. In a later a11y pass, add `aria-labelledby` to the h3 id as the essentials panel does, and consider `aria-disabled` instead of `disabled` while searching. |
| 6 | Low | Structure (dead code) | `param-categories.ts:445-447` | `paramCategory()` is exported but has no caller in `src/`, `tests/` or `scripts/`. It also relies on a non-null assertion. | Remove it, or use it and cover it with a test. |
| 7 | Low | Robustness | `param-categories.ts:215` (and `:427-429`); pre-existing twin at `param-labels.ts:115-116` | The R path guards every table lookup with `hasOwnKey` (`:197-208`), but the catalog path reads `GROUP_DEFAULT_CATEGORY[group]` without that guard. A group named after an `Object.prototype` member makes `categoryOf` return the `Object` function, and `groupByCategory` then drops the param silently. The probe showed 0 groups and a total of 0 for one input key. Real input is a server-controlled registry typed as `ParamGroup`, so this is hardening, not a live defect. Nothing crashes in any case. | Use `hasOwnKey(GROUP_DEFAULT_CATEGORY, group)` and, optionally, a dev-only assertion that the sum of `total` equals `defs.length`. |
| 8 | Low | Test quality | `tests/unit/studio/ui-categories/param-editor-categories.test.ts:50-93`; `param-categories.test.ts:244` | The tests leave four gaps. (a) No test renders `ParamEditor` with a non-empty Lainnya. The runtime path works (probe), but only because `lainnya` is in `PARAM_CATEGORIES` (`param-categories.ts:62`), and no test pins that. (b) The "n diubah" test covers only "draft adds a key". It does not check that a draft equal to the loaded value is not counted, or that a removed key is counted. (c) Nothing asserts `type="button"` or that toggles are enabled outside search mode, so keyboard operability rests on markup that is not tested. (d) `param-categories.test.ts:244` is tautological (`s.label === subgroupLabel(...)`). This one is harmless, because the exact per-sub-group key sets (`:226-227, :250-268`) already ensure no live label falls back. | Add one render test with an injected unknown R key, expecting `data-category="lainnya"`. Extend the changed-count test with the equal and removed cases. Assert `type="button"` and no `disabled` on the category buttons when not searching. |
| 9 | Low | Structure | `src/components/studio/template-preview/param-tools.ts:10, 79-80` | The preview module now imports from the sibling component directory `template-editor/`, and `template-editor/template-editor.tsx` already imports the `template-preview` barrel. That is a two-way coupling at directory level. It is not a module cycle: `param-categories` depends only on `param-labels` and registry types. Separately, `ParamNamespaceGroup.namespace` can now hold `chart.kind` or `type.scale`, which are not namespaces. The doc comment explains this, but the field name misleads. | Later refactor: move `param-categories.ts` (with the `namespaceLabel` dependency) to `src/components/studio/shared/`. Consider renaming the field to `subgroup` when the preview pane gets a consumer. |

## Check-by-check evidence

### 1. Labels and order

- All 15 category labels and help lines are character-identical to research/39 "Category list" (`param-categories.ts:48-62` vs `research/39:69-83`). The one intended difference is the Lainnya help, which is now user-facing ("Parameter yang belum berkategori", `:62`) instead of a developer note. That change is justified, and Lainnya is never shown while empty.
- All 14 sub-group label tables match research/39 "Sub-group labels" (`:231-377` vs `research/39:249-262`), including the S1 entries accepted in D-630 (`:237-238, :279-280`).
- The category order is fixed by array position (`:46-64`) and pinned at `param-categories.test.ts:77-78`. The sub-group order follows the label-table rank, with unlisted keys sorted alphabetically (`:431-432`). Reversed input gives the same order (`param-categories.test.ts:187-189`).
- The alphabetical fallback differs from research/39's "first-appearance" rule. The deviation is reported and justified (stable against input order), and no unlisted sub-group exists today.
- Raw namespace leaks: none on live data. The probe found 0 sub-groups whose label equals the key. The fallback `namespaceLabel` -> raw key applies only to unknown future namespaces, and the key also stays in `title` (`param-editor.tsx:199`).
- Findings: #1, #2, #3.

### 2. Behaviour preserved

| Behaviour | Evidence | Status |
|---|---|---|
| Search auto-expands categories and sub-groups | `param-editor.tsx:75` (`searching` includes query, only-changed and refFilter), `:283, :286` (`open: s.searching \|\| ...`); test `param-editor-categories.test.ts:99-109, 75-83` | Preserved |
| `refFilter` chips and `?paramFilter=` sync | `:60-68`, `:129-157`, `:311-321` unchanged by the diff (`git diff` touches only the import block, `filtered`/`groups` memo, the render map and the new pure exports) | Preserved |
| `SEARCH_LIMIT` slice before grouping | `:78` (slice as before), `:216-220` | Preserved |
| "n diubah" per category | `:285` (same `isChanged` predicate, `:323-327`), `:182`; test `:85-93` | Preserved (now memoized with correct deps `[filtered, searching, open, p.draft, p.loaded]`, `:79`) |
| Open/close state | `:59, :87-93`, IDs `cat:<id>` / `ns:<cat>:<sub>` (`param-categories.ts:434, 439`); test `param-editor-categories.test.ts:111-123`. The state is in-memory `useState`, so the dropped `ch:` IDs cannot leave stale persisted state. | Preserved |
| `aria-expanded` on both levels | `param-editor.tsx:172, 194`; test `:58-59, :78` | Preserved |
| Keyboard toggling | Native `<button type="button">` (`:169-170, :191-192`), so Enter and Space work natively | Preserved |
| Focus styles | Global ring `:where(a, button, ...):focus-visible` at `src/app/globals.css:333-337` applies to both toggles; the classes are unchanged from the chapter version | Preserved |
| Empty categories hidden | `param-categories.ts:428-429`; tests `param-categories.test.ts:193-201`, `param-editor-categories.test.ts:66-73` | Preserved (R5) |

### 3. Accessibility

- Headings: the category toggle is a `<button>` inside an `<h3>` (`param-editor.tsx:168-186`), the same disclosure pattern as before. The sub-group toggles are plain buttons with no heading, also unchanged.
- Button semantics: correct (`type="button"`, `aria-expanded`). The icons are `aria-hidden` (`:178, :198`).
- Region labels: the `<section>` elements are unnamed (pre-existing, #5). The refFilter chip group keeps `role="group"` with an `aria-label` (`:130`).
- New issue: #4 (help text reachable only on mouse hover).

### 4. Consistency with the essentials panel and the UI kit

- Classes, tokens and spacing are byte-identical to the chapter version, as the diff of `param-editor.tsx` shows. The only additions are `data-category` (`:173`) and `title` (`:177`). `Pill` still comes from `@/components/ui/kit` (`:15`), and the design tokens are unchanged (`var(--line)`, `var(--text-3)`, `var(--surface-1)`). There is no ad-hoc styling.
- The essentials panel (`template-editor.tsx:634-660`) has its own `KNOB_GROUPS` ("Halaman", "Tampilan", "Isi", `model.ts:86-90`). It does not group through `groupParams`, so D-626's "permukaan dasar bila memakai fungsi yang sama" correctly leaves it alone.
- One vocabulary point for later: the essentials panel says "Halaman" and the advanced panel says "Halaman & grid". Both are acceptable, but #1 would align "grid" with "Kisi".

### 5. Scope

- Only UI files changed (see the evidence table). There is no server, registry, data or document-output change, and no new dependency.
- Removed `groupParams` (editor `values.ts`), `chapterRank` (both copies) and `ParamChapterGroup` have no caller left anywhere in the repo. That includes `scripts/` and `tests/`, apart from the absence assertions.
- The barrel change (`template-preview/index.tsx:46-58`) has no consumer outside the tests. The `ParamNamespaceGroup` change (new required `id` and `label`) has no external constructor.
- Other untracked items in the worktree belong to the coverage-round rows, not this UI diff: `research/35-37` and `delegation_progress/f070_backup/*.json`.

### 6. Test quality

The tests guard the mapping strongly:

- live `ALL_PARAMS` with 788 keys, Lainnya `[]` (`param-categories.test.ts:90-97`);
- per-category and per-surface counts (`:99-112`);
- the "group + key only" rule (`:114-121`);
- no dead exception or R rows, and exact overrides catching exactly one key each (`:123-172`);
- exact sub-group key sets and counts for all 14 categories (`:226-227, :247-269`). Any new or unlabeled sub-group fails the test.

Rendering is guarded by `renderToStaticMarkup` tests:

- order;
- no "Bab";
- `aria-expanded` state;
- hidden empty categories;
- refFilter auto-expand with category-scoped labels;
- the per-category changed pill.

The gaps are listed in #8.

### 7. Robustness

- An unknown R namespace or render segment resolves to `lainnya` (`param-categories.ts:207-208`). The U02 test then fails on purpose (`param-categories.test.ts:93-94`, `:174-180`).
- At runtime, Lainnya is a normal member of `PARAM_CATEGORIES` (`:62`), so `groupByCategory` emits it last when it is non-empty (`:427-440`). The probe confirmed that `ParamEditor` renders it without error and that the preview adapter returns it too. The UI cannot crash on an unknown key.
- One hardening gap: #7.

## Key Challenges

1. **Vocabulary versus spec.** The spec (research/39) and D-626 approved labels that contain "grid", "chart", "Lint" and "Renderer". The implementer followed the spec correctly. Is that what the USER wants on screen, given that the same module already renders "Grafik" and "Kisi" one level down? This review cannot settle it. The controller should ask the USER or accept the labels explicitly.
2. **Where should a shared helper live?** D-630 asked for one helper for the editor and the preview. Putting it in `template-editor/` makes `template-preview` depend on a sibling feature folder (#9). `components/studio/shared/` already exists and would be the neutral home.
3. **Help text accessibility.** The category help line is the main way users find out what a category holds, for example why table line weights live in "Halaman & grid" (D1). It is new UX content, yet only mouse users can reach it (#4).

## Positive Findings

- One pure, table-driven module that exactly mirrors research/39, so the editor and the preview cannot drift (D-630). Each table cites its research row or table.
- The mapping reads only `group` and `key`, and a test feeds deliberately false `chapter`, `namespace` and `surface` values to prove it (`param-categories.test.ts:114-121`).
- Order is deterministic: the alphabetical fallback is pinned with reversed input, which is a sensible deviation from "first-appearance".
- The prototype-safe `hasOwnKey` lookups on the R path; only the catalog default path lacks one (#7).
- Testability without a new dependency: the pure `filterParamDefs` and `paramEditorView` were extracted, and the component is tested through `renderToStaticMarkup`.
- The "n diubah" count is now memoized with correct dependencies instead of being recomputed inline on every render.
- The help line for an empty Lainnya was rewritten from a developer note into user-facing text.
- TDD red/green was recorded per row, and the implementer report lists every deviation with its reason.

## Files reviewed

Modified or new:

- `src/components/studio/template-editor/param-categories.ts` (full)
- `src/components/studio/template-editor/param-editor.tsx` (full, plus diff)
- `src/components/studio/template-editor/values.ts` (diff)
- `src/components/studio/template-preview/param-tools.ts` (full, plus diff)
- `src/components/studio/template-preview/index.tsx` (diff)
- `tests/unit/studio/ui-categories/param-categories.test.ts`
- `tests/unit/studio/ui-categories/param-editor-categories.test.ts`
- `tests/unit/studio/ui-categories/preview-param-tools-categories.test.ts`

Affected (callers, callees and context):

- `src/components/studio/template-editor/advanced-panel.tsx:60-200` (both `ParamEditor` mounts)
- `src/components/studio/template-editor/template-editor.tsx:370-380, 420-445, 495-515, 610-680` (heading context, essentials panel)
- `src/components/studio/template-editor/model.ts:86-103` (`KNOB_GROUPS`, `groupKnobs`)
- `src/components/studio/template-editor/param-labels.ts:45-117` (`namespaceLabel`)
- `src/components/studio/template-editor/api.ts:182-185` and `src/components/studio/template-preview/api.ts:130-134` (registry fetch; `items` are full `ParamDef` including `group`)
- `src/app/api/studio/registry/route.ts:175-200` (the params payload returns `ALL_PARAMS` items unmodified)
- `src/components/studio/shared/labels.ts:160-185`
- `src/app/globals.css:325-337` (focus ring)
- `vitest.config.ts`

Documents:

- `identification/03_structured_datum_coverage_round.md` (rows U01-U06, Execution Profile)
- `decisions/decisions.md` (D-626 to D-630)
- `research/39_param_categories.md`
- `delegation_progress/ui_param_categories.md`

No production code was changed. The probes ran from a scratch test and a scratch config in the session scratchpad, outside the repo.
