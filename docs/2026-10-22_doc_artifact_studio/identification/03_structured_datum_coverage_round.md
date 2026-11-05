---
schema_version: 1.0
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
date: 2026-11-05
agent: task-architect
document: identification/03_structured_datum_coverage_round.md (blueprint for the "DATUM Rev A coverage engine round" plus the USER addendum "template editor Advanced form grouped by category". It does not replace 02_structured_datum_rev_a.md. The prefix 03 also exists as 03_blueprint_addendum.md; the name was set by the controller.)
scale_category: Enhancement (Penyempurnaan mesin), scale Besar; optional production phase gated separately
blueprint_state: grounded refinement. Research rows (design spike first), implementation, verification and an optional production phase, plus the Execution Profile. Paths were checked with Glob/Read in this session. Implementation rows assume the spike's preliminary reading in section 2. If C01/C02 refute it, the controller re-invokes task-architect before wave W3 (gate G-SPIKE).
binding_decisions: D-590, D-593, D-594 (U3), D-595 (U4), D-598, D-602, D-605, D-606, D-608, D-609, D-610, D-612, D-624, D-625
status: needs-review (waiting for USER approval in Plan Mode; 12 decisions listed in the last section)
---

# Blueprint: DATUM Rev A coverage engine round (DEV) + template-editor category grouping, with an optional production phase

Abbreviations: `<task>` = `docs/2026-10-22_doc_artifact_studio`. `L` = `src/lib/studio`. Repo = `C:\Users\TRIAL\gsp-swarm-hq-v2.1`, branch v2.1, HEAD 8c7c803. Production = `C:/Users/TRIAL/gsp-hq-prod-v21-r2` at 5fd72c5, port 9011, DB `gsp_agent_hq`. DEV = port 9021, DB `gsp_agent_hq_v21`. "Old templates" = the 7 templates that existed before Rev A, plus `datum-gsp-preset` and `datum-kanonik-preset`. "The 10" = `datum-proposal-teknis`, `datum-laporan`, `datum-laporan-verifikasi`, `datum-standar`, `datum-nota`, each also with `-en`. Pair types: ID T/S (PT, LAP, VER, STD), EN T/S, NOTA ID, NOTA EN.

## 0. Binding inputs

| Source | What it binds |
|---|---|
| D-625 (`decisions.md:631`) | This round: DEV only. Production needs separate USER approval; D-591's autonomy is not extended to this round |
| Constraint (a) | Old templates' ID output stays byte-identical: baseline compare 8/8 SAME (`verification/19` §4), `convert_v2 --check` SAME x3 |
| Constraint (b) / U3, D-594 | No new agent payload field unless USER relaxes U3 for a named field |
| Constraint (c) / U4, D-595 | No template-slug or type branching; behaviour comes from template data |
| Constraint (d) | Every change is opt-in through template data; only the 10 change output |
| D-608 | Release gate = measured score >= 85 %, 4/4 critical rules, 0 text clashes per pair. Point coverage is reported, not a gate |
| D-605 (1) | Template-level roleFormats were refused because the seed "unchanged" guard does not compare role formats |
| D-609 | GF-08 deferred: the Table 8.2 keys are derived and can only be pinned on a preset by ADMIN |
| `verification/22` §1, §3, §9 | Current coverage 39.2-46.8 % (display 39.3-46.9 % in D-613), the 33 in-scope points, and the 29 follow-up rows |
| USER addendum (via controller, 2026-11-05) | "tambahan di UI template editor bagian advance grouping formnya perlu diperbaiki, bukan per bab tapi per jenis/kategori saja" |

## 1. Architecture challenge (grounded in this session)

1. **85 % point coverage cannot be reached under the strict rule.** Even if (A) and every (B) option land, the projection is 78.1-84.4 % (section 4). D-608 already moved the release gate to the measured score. This round raises coverage. It does not claim the floor (decision Q1).
2. **Most §9 rows need a new registry param.** Last round refused them (D-606, D-608) for three reasons: canonical sync, AC-3 (old stored rows) and `paramsSha256`. Section 2 reads the code: an additive param is safe under six conditions. The design spike (C01 reading, C02 probe) confirms or refutes this before any engine row starts.
3. **Shared hot files.** `L/services/compose/front.ts` (CS-06, CS-11, CS-12), `L/engine/front/texts.ts` (text entries, CL-02, CV-15), `L/engine/docx/package/header-footer.ts` (GF-22, CL-02 NOTA, RB-08c) and the params registry (`L/params/*.ts`) each get one writer row per wave. Their writer rows are chained by B edges.
4. **Gate risk from layout features.** GF-24 narrows the body to 128 mm. GF-21 snaps vertical rhythm. Both can move clash and measured results on the 10. They are sized `M?`. Their own fixture check and the DEV gate (C32) catch regressions. A failure becomes a new row (G-FIX, at most 3 cycles).
5. **Scorer expectations.** The scorer may encode today's engine output where the manual says otherwise, for example control-sheet column headers. In that case CS-11/CS-12 would lower the measured score. C05 lists the rules expected to flip. C25 aligns a rule only with a manual citation and never loosens one.
6. **GF-19 depends on LibreOffice.** The PDF comes from DOCX through LibreOffice 24.2 (D-597). C03 probes whether `w:background` survives conversion before C13 is built.
7. **No MCP change in (A).** `scripts/studio/mcp/**` is not touched by any (A) row. CL-02 is judged like LB-07: when the agent sends `meta.number`, the explicit block replaces the auto block (`verification/22:130`). So production may need no Hermes repoint (C48 is conditional).
8. **Production is a new-version import, not an insert** (section 6). The 10 rows exist in production at v1, while DEV holds v2. Version numbers differ, so DEV rows are never copied. Rows are produced in a fresh production clone.
9. **UI addendum.** The template editor's `ParamEditor` groups by manual chapter, then namespace (`src/components/studio/template-editor/values.ts:93-117`, used at `param-editor.tsx:87`). `advanced-panel.tsx` renders it twice (`:112` Advanced, `:161` preset mode). The essentials surface does not use it. A second, duplicate chapter grouper lives in the preview pane inside the same editor page (`src/components/studio/template-preview/param-tools.ts:73-129`, used by `template-preview/index.tsx:49-50`, mounted by `template-editor.tsx:27`). That is decision Q9.
10. **No component-test library.** The repo has no testing-library or jsdom and no `.tsx` tests. UI tests are `.ts` tests of pure helpers (`tests/unit/studio/ui02/*`). So component tests will use `react-dom/server` `renderToStaticMarkup` (react-dom 19.2.3 is installed, `package.json:38`) plus a pure view-model for search. No new dependency.
11. **Admin-only UI and login.** Advanced settings are admin-only. Earlier UI rows could not capture admin surfaces, because agents may not create session cookies (`delegation_progress/coder_execution_ui_02.md:77,99`; `coder_execution_fix4b.md:65,70`). The screenshot needs a USER login in the browser preview (Q11). Otherwise the component tests carry the evidence.

## 2. Design spike: preliminary reading (to be confirmed by C01 and C02)

**Question.** Can a NEW registry param, whose default reproduces today's behaviour, be added without changing old templates' stored rows or versions, their resolved output, or the seed guard results?

**Preliminary answer: yes, if conditions P1-P6 hold.** P7 is open.

| # | Condition | Why (evidence read in this session) |
|---|---|---|
| P1 | Surface is not `essential`, and the key is in no `ESSENTIAL_KNOBS` entry | Seed knob extraction reads only `ESSENTIAL_KNOBS` (`prisma/seed-studio-templates.ts:76-90`). Skeleton versions are "unchanged" only if the stored `overrides` equal knob values + layer (`:164, :179`). An essential key would give datum-gsp, datum-kanonik, laporan-kerja-agen and the 10 new versions on the next seed |
| P2 | Not class T, and not surface `derived` (if templates must set it) | `checkTemplateWrite` step 4 rejects class T for everyone, and `derived` keys unless ADMIN on a preset (`L/services/skeleton/access.ts:230-239`) |
| P3 | The reader treats "absent" exactly like the default | Stored versions are frozen and are used as-is at render (`L/services/templates/index.ts:560-581`, `templates/profile.ts:830-838`), so old versions lack the key. Documents with `doc.overrides` re-resolve against the full registry (`L/services/ingest/index.ts:218-228`). So do the DB-less baseline renderer and `convert_v2` (`benchmark/extract/convert_v2.ts:371-381`). Both paths must give the same bytes |
| P4 | Key name outside the `color.interior.`, `color.wrapper.`, `color.brief.` and `color.role.` prefixes | HTML `:root` variables enumerate every resolved key with those prefixes (`L/engine/html/base/css.ts:141-155`). A new key there changes HTML bytes wherever it resolves (baseline fixture, override path). This matters for GF-22's colour params |
| P5 | Key not in `COMPOSE_PARAM_KEYS` | The compose context stores those keys in the snapshot (`L/services/compose/context.ts:45-49`). Adding one changes snapshot hashes |
| P6 | Enum additions keep default lists unchanged | Precedent: NDA added to `doc.typeCode` without changing the default (S11, blueprint 02 line 127) |
| P7 (open) | No new role key is emitted for every document, and no registry-wide count or hash is printed | Not yet proven. DOCX style emission over a role catalogue could change `styles.xml`. Tests only pin key uniqueness (`tests/unit/studio/structure/params-surface.test.ts:70`, `engine-core/tokens.test.ts:49`). C01 checks this |

**Seed guards.**
- **Presets.** `computePresetLayer` pins only keys present in the legacy baseline (`prisma/seed-studio.ts:635-657`). `ensurePreset` compares layer, roleFormats and skeleton (`:683`). Result: unchanged.
- **Guarded transactions** (`--contract-templates`, `--doc-type-templates`). The snapshot compares stored columns only (`seed-studio-templates.ts:333-342, 401-420`). Result: unchanged.
- **Canonical sync.** `datum-kanonik` is skeleton-managed, so `describeCanonical("preset-managed")` runs (`seed-studio.ts:1274-1288`) and never writes. But `registryInSync` compares the stored sha with a fresh registry payload (`:1186-1199`). It turns false and logs a warning once any key is added. That is the only observable seed difference. It is a report, not a write and not a guard failure. C02 records the value before and after, and C01 confirms that no test or gate asserts it is true. The brief's line range (~1370-1384) refers to an older layout; the file has 1339 lines at HEAD.
- **Fresh DB** (`uji-run`). Old templates' v1 rows there include the key at its default, so their `paramsSha256` differs from DEV. The guards compare within one DB, so this is the same as earlier registry growth (D-258 N2).
- **`paramsSha256`.** Stored values do not change. The integrity check recomputes only over stored params (`templates/index.ts:561-571`).

**Mechanism verdict (preliminary).**
- **M1, additive opt-in registry param:** the primary mechanism for every (A) engine feature, including CV-20.
- **M2, Rev A preset derived from `datum-gsp-preset`:** only for GF-08. The Table 8.2 sizes are `derived` (D-609; `access.ts:235`), and the table width guards read the param (`L/engine/docx/tables/render.ts:188`). A role-format overlay would change the runs but not the guards.
- **M3, template-level roleFormats with a role-format comparison in the seed guard:** not adopted. `ensureSkeletonVersion` ignores roleFormats in its unchanged check (`seed-studio-templates.ts:179`), and stored skeleton roleFormats may be folded (`seed-studio.ts:618, 682`). Fixing that changes a shared helper used by the contract and preset paths. D-605 (1) stands.

## 3. (A)/(B)/(C) classification of the 29 rows in §9

Scoring: C = 1, P = 0.5, N = 0. A gain of +0.5 is worth +1.72 pp on 29-point pairs, +1.79 pp on 28 and +3.13 pp on 16. Gains are given per pair type: ID T/S / EN T/S / NOTA ID / NOTA EN. "-" = not applicable.

| Class | Point | Change (mechanism) | Now -> best | Gain per pair type | Row |
|---|---|---|---|---|---|
| A | CS-12 | Subtitle from the text table, opt-in flag (M1) | N -> C | +1 / +1 / - / - | C07, C08 |
| A | CS-06 | Always three signature columns, opt-in flag (M1) | P -> C | +0.5 / +0.5 / - / - | C09 |
| A | CS-11 | Manual control-sheet columns behind an opt-in; STATUS derived (M1) | N -> C | +1 / +1 / - / - | C10 |
| A | CV-20 | Cover title max width 150 mm -> right indent (M1) | N -> C | +1 / +1 / - / - | C11 |
| A | CV-19 | Back-cover page plus divider placement (M1 + enum value) | P -> C | +0.5 / +0.5 / - / - | C12 |
| A | GF-19 | DOCX `w:background`, opt-in (M1); only if C03 shows the PDF keeps it | P -> C (conditional) | +0.5 all four | C03, C13 |
| A | GF-22 | Header rule and register top-rule colour params, default = today (M1, P4 naming) | P -> C | +0.5 / +0.5 / - / - | C14 |
| A | GF-21 | Vertical-rhythm snapping, opt-in (M1) | P -> C | +0.5 all four | C19 |
| A | GF-24 | DOCX reserved 32 mm rail mode, opt-in (M1) | P -> C | +0.5 all four | C20 |
| A | CL-02 | KLASIFIKASI cover field (enum + text) for T/S; NOTA classification line, opt-in | T/S P -> C; NOTA N -> C | +0.5 / +0.5 / +1 / +1 | C15, C16 |
| A | ST-01 | Rule index derived from content markers (C04) | P -> C | STD and STD-en only: +0.5 | C04, C17 |
| A | TR-07 | NOTA file name = title + ISO date, new non-T naming param | P -> C | - / - / +0.5 / +0.5 | C18 |
| A | GF-08 | Rev A preset pins Table 8.2 sizes (M2) | P -> C | +0.5 all four | C21, C23 |
| B | CV-15 | PENYUSUN from a template preparer-unit value, not `meta.author` (Q2) | N -> C | +1 / +1 / - / - | C27 (conditional) |
| B | CV-21 | Seal-colour logo asset from the brand owner (Q3); never fabricated | ID N -> C | +1 / 0 / - / - | C28 (conditional) |
| B | RB-08c | Manual-owner reading (Q4). Literal: opt-in restart at Chapter 1. Practice: reclassify only | P -> C | +0.5 / - / - / - | C26 (conditional) |
| B | NU-06 + LB-12 | Bilingual pair link and prevailing-version statement (product; the pair declaration is agent input). LB-12 is not fixed by the manual: tender, contract and ministry cases differ (`EN:415-418`) | N -> P each | +1 all four (+0.5 more if LB-12 is judged C) | new task (Q6) |
| B | NU-08 | Draft states in the server revision model (product) | P -> C | +0.5 all four | new task (Q6) |
| B | NU-09 | Number reservation with an XXX hold (product, production numbering) | P -> C | +0.5 / +0.5 / - / - | new task (Q6) |
| B | CL-03 | Per-recipient scheme, lifting D-590 | P -> P | 0 | none (Q7) |
| B | NC-07 | Binding-sum marker (U3 relaxation) + number-to-words generator | ID T/S P -> P; others N -> P | 0 / +0.5 / +0.5 / +0.5 | none (Q8) |
| B | NC-05 | Annex-language flag (U3 relaxation) | N -> P | +0.5 / - / +0.5 / - | none (Q8) |
| B | CS-08 | V1 human record (U3 relaxation); V2/V3 can be machine-filled | P -> P | 0 | none (Q8) |
| C | GF-20 | Lint only ("<= 2 meaning colours per page") | P -> P | 0 | none |
| C | NC-06 | Lint only (one money form per file) | P -> P | 0 | none |
| C | TR-05 | SERAH obligations are agent content; lints only report | P -> P | 0 | none |
| C | CS-09 | Method statement is agent content; enforcement still needs it | P -> P | 0 | none |
| C | CV-14 | HALAMAN/VERIFIKASI can be engine fields, but the geodetic datum is project input | P -> P | 0 | none |

Already covered and unchanged: GF-17, GF-23, LB-07 (EN T/S), LB-08 (EN).

## 4. Coverage projection per pair (hypothesis; truncated to one decimal, `research/31:257`)

| Pair | Now | (A) | (A) if GF-19 fails in PDF | +Q2 CV-15 | +Q3 CV-21 | +Q4 RB-08c | +NU-06/LB-12 | +NU-08 | +NU-09 | +NC-07 | +NC-05 | +CL-03 or CS-08 | (A) + recommended (Q2, Q3, Q4) | (A) + every (B) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PT (29) | 39.6 | 63.7 | 62.0 | 67.2 | 67.2 | 65.5 | 67.2 | 65.5 | 65.5 | 63.7 | 65.5 | 63.7 | 72.4 | 81.0 |
| PT-en (29) | 46.5 | 70.6 | 68.9 | 74.1 | 70.6 | 70.6 | 74.1 | 72.4 | 72.4 | 72.4 | 70.6 | 70.6 | 74.1 | 82.7 |
| LAP, VER (28) | 39.2 | 64.2 | 62.5 | 67.8 | 67.8 | 66.0 | 67.8 | 66.0 | 66.0 | 64.2 | 66.0 | 64.2 | 73.2 | 82.1 |
| LAP-en, VER-en (28) | 46.4 | 71.4 | 69.6 | 75.0 | 71.4 | 71.4 | 75.0 | 73.2 | 73.2 | 73.2 | 71.4 | 71.4 | 75.0 | 83.9 |
| STD (29) | 39.6 | 65.5 | 63.7 | 68.9 | 68.9 | 67.2 | 68.9 | 67.2 | 67.2 | 65.5 | 67.2 | 65.5 | 74.1 | 82.7 |
| STD-en (29) | 46.5 | 72.4 | 70.6 | 75.8 | 72.4 | 72.4 | 75.8 | 74.1 | 74.1 | 74.1 | 72.4 | 72.4 | 75.8 | 84.4 |
| NOT (16) | 40.6 | 62.5 | 59.3 | 62.5 | 62.5 | 62.5 | 68.7 | 65.6 | 62.5 | 65.6 | 65.6 | 62.5 | 62.5 | 78.1 |
| NOT-en (16) | 46.8 | 68.7 | 65.6 | 68.7 | 68.7 | 68.7 | 75.0 | 71.8 | 68.7 | 71.8 | 68.7 | 68.7 | 68.7 | 81.2 |

Raw points with (A): PT 18.5, PT-en 20.5, LAP 18, LAP-en 20, STD 19, STD-en 21, NOT 10, NOT-en 11. (A) adds 7.0 points per T/S pair (+0.5 more on STD) and 3.5 per NOTA pair. Upside: if LB-12 is judged C with the pair link, every pair gains +0.5 more, so LAP-en reaches 85.7 % and STD-en 86.2 %; the rest stay below 85 %. Side effect on the measured score: GF-22 should turn the known failures RH-03 and RB-05 into passes on the 10. SB-02 and GF-13 stay.

## 5. Acceptance criteria for this round

| ID | Criterion (measured) |
|---|---|
| AC-C1 | After every engine row and at C29: baseline 8/8 SAME and `convert_v2 --check` SAME x3 |
| AC-C2 | Old templates' snapshot (slug, latestVersionNo, updatedAt, paramsSha256, skeletonSha256, version count) is identical before and after the DEV reseed. Presets and contract dry-runs report unchanged |
| AC-C3 | U3: no new payload field. MCP payload schema diff is empty; `scripts/studio/mcp/**` is unchanged unless Q2 picks the payload variant |
| AC-C4 | U4: 0 new slug or type branches (grep + C34 blocker) |
| AC-C5 | Opt-in: every new param satisfies P1-P6. Absent = default = today, proven by a unit test. Only the spec table of the 10 sets values |
| AC-C6 | DEV gate per pair: score >= 85 %, 4/4 critical, 0 clashes |
| AC-C7 | Coverage re-measured per pair with evidence, and compared with section 4 |
| AC-C8 | Full studio suite, clean-SVG manifest, tsc and eslint green |
| AC-C9 | Security review PASS, or CAUTION decided by USER |
| AC-C10 | UI: every registry key is in exactly one non-"Lainnya" category. No chapter level. Search, refFilter, changed counts, open state and aria-expanded are kept. No server, registry or output diff |
| AC-C11 | Production (optional): the 10 get latestVersionNo +1 (and the Rev A preset is inserted). The 7 old templates are identical. Existing documents keep their pinned version. RB-1v is rehearsed |

## 6. Production phase design: new-version import (differences from deploy/05)

| Aspect | Previous round (insert) | This round (new version) |
|---|---|---|
| StudioTemplate rows | 10 inserted | Exist; only `latestVersionNo` and `updatedAt` are updated for the 10 |
| Version rows | v1 inserted | v(prod latest + 1) inserted, computed in a fresh clone of production (prod v1 -> v2; DEV is v3, so DEV rows are never copied). `baseVersionId` = the Rev A preset version (M2) |
| Rev A preset (M2) | none | 1 StudioTemplate (isPreset) + version + slots inserted |
| Export filter | slug only | slug AND versionNo > production latest, plus the preset slug |
| Import pre-check | slugs absent | per slug: latestVersionNo and latest-version md5 equal the clone's pre-seed values; preset slug absent; `datum-gsp-preset` latest id equals the clone's base |
| Existing documents | none | They stay pinned to v1 (D-06). C38 checks whether `studio_edit` re-pins to latest and records it as a risk |
| Order | code -> MCP -> data (latest hijack) | code -> data. `latest` is a client constant (D-612 F-2). The Hermes repoint runs only if the `scripts/studio/mcp` closure differs between r2 and r3 |
| Rollback | RB-1 archive | RB-1v: one transaction reverting `latestVersionNo`/`updatedAt` for the 10. Version rows stay (immutable). Documents made on the new version keep rendering. Then RB-2 (r2 at 9011), then RB-3 (pg_restore) |
| Smoke | 1 document (D-612) | 1 document on one updated template, archived, no deletion |

## 7. UI workstream design (USER addendum)

- **Categories.** One mapping table with Indonesian labels and a fixed order. Target set: Warna; Tipografi; Halaman & grid; Sampul; Lembar kendali; Kepala & kaki halaman / register; Tabel; Gambar & chart; Diagram/simbol; Penomoran & klasifikasi; Bahasa; Lint & pemeriksaan; Renderer & ekspor; plus the fallback "Lainnya", which a test asserts stays empty. The mapping is keyed on `ParamDef.group` (`L/contract/types/params.ts:32-60`), with explicit namespace exceptions where a group spans categories. U01 sets the final table by reading `L/params/*.ts` and `research/01`.
- **Levels.** Category -> namespace sub-group -> rows. The chapter level is removed. Recommended option: show namespace sub-groups in every category. That keeps today's second level, the `ns:` open-state ids and the counts logic, and categories mix several namespaces. The other option, sub-groups only above N keys, adds a second rendering mode for little gain.
- **Kept behaviour.** Search (SEARCH_LIMIT, all groups open while searching), refFilter chips and `?paramFilter=` sync, class and "changed only" filters, "n diubah" pills, open/close state, `aria-expanded` buttons and keyboard use.
- **Scope.** `src/components/studio/template-editor/**`, plus the preview pane if Q9 says yes. No server, registry, contract or output change. Every new coverage param from C06 must land in a category: C05 assigns one, and C29's full suite runs the mapping test.

## 8. Gates and rollback

| Gate | When | Content |
|---|---|---|
| G0 | before W1 | USER approves this blueprint in Plan Mode and answers Q1-Q11; the controller records them |
| G-SPIKE | after C01, C02, C05 | The controller checks the verdict. If P1-P7 fail or M1 is unsafe, task-architect is re-invoked before W3 (W1-W2 and the UI rows continue) |
| G-FIX | C29, C32, C44, C51 fail | New S/M fix rows per finding, at most 3 cycles per criterion, then escalate to USER |
| G-SEC | C35, C39 CAUTION/FAIL | Shown to USER via AskUserQuestion; FAIL is never overridden |
| G-PROD | after C39 | USER approves production changes: commit/tag, r3 checkout, backup, clone, rehearsal, export, import, 1 smoke document |
| G-RESTART | after C45 | USER approves the port swap, launchers and conditional Hermes repoint |

## Structured Task Breakdown

| Step | Task Description | Agent_to_Invoke | Skills_to_Load | Expected Output | Depends On | Verification | Phase |
|---|---|---|---|---|---|---|---|
| C01 | Design spike by code reading (read-only): decide whether a new registry param with a current-behaviour default leaves old templates' stored rows and versions, their resolved output, and the seed guard results (presets dry-run, canonical registryInSync, contract and doc-type guards) unchanged; confirm or refute P1-P7 of section 2; compare M1, M2 and M3 and assign one to every (A) point | data-analyst | - | NEW <task>/research/35_registry_param_safety_spike.md | none | every verdict cites file:line at HEAD; P1-P7 each confirmed or refuted with evidence; every (A) point has M1, M2 or "not feasible" with reason | research |
| C02 | Empirical probe of the spike in a throwaway LF worktree outside the repo: add one dummy advanced no-op param and one dummy enum value, then run the baseline compare, convert_v2 --check and the three seed dry-runs against DEV (0 writes), record registryInSync before and after, remove the worktree | coder-execution | using-git-worktrees, dry-run-verify-fix | NEW <task>/verification/30_registry_param_probe.md | C01 | baseline 8/8 SAME and convert_v2 SAME x3 with the dummy param; dry-runs 0 writes with old templates unchanged and registryInSync before/after recorded; git worktree list shows only the main tree | research |
| C03 | GF-19 probe: convert a minimal DOCX carrying w:background and w:displayBackgroundShape with the installed LibreOffice 24.2 and sample page pixels with PyMuPDF from the hermes venv; install nothing | coder-execution | dry-run-verify-fix | NEW <task>/research/36_docx_background_pdf_probe.md | none | commands and outputs recorded; sampled RGB of an empty page area compared with FCFCFB and FBFAF7; verdict "honours" or "ignores" | research |
| C04 | ST-01 research: define how the STD rule index is derived from existing content with no new input (rule markers per ID:235, ID:4517, EN:240, EN:4441; which existing blocks carry them; empty-index behaviour) | data-analyst | - | NEW <task>/research/37_rule_index_derivation.md | none | every claim cites a manual line or file:line; derivation uses the existing payload only (U3); empty-content behaviour defined | research |
| C05 | Names-and-constants register for the round: every new param (key, file, default = today, class, surface, scope, UI category from research/39), enum additions, ID/EN text entries with manual citations, opt-in values for the 10, Rev A preset slug and Table 8.2 values, mechanism per point, expected coverage cells, scorer rules expected to flip, gate thresholds | data-analyst | - | NEW <task>/research/38_coverage_round_names_register.md | C01, C02, C03, C04, U01 | every value cites a manual line, a decision or C01 evidence; every new key meets P1-P6; projection equals section 4 or the deviation is explained | research |
| C06 | Contract: land every new registry param and enum value from research/38 in L/params (defaults = today's behaviour, advanced or internal surface, outside ESSENTIAL_KNOBS, COMPOSE_PARAM_KEYS and the HTML colour prefixes); no reader yet | coder-execution | tdd, dry-run-verify-fix | edited L/params/*.ts + NEW unit test | C05 | new test red then green for default, surface, class, prefix and knob checks; baseline 8/8 SAME and convert_v2 SAME; DEV seed dry-runs show old templates unchanged and registryInSync as in C02 | implementation |
| C07 | Add the ID/EN text-table entries from research/38 to texts.ts (control-sheet subtitle, manual column headers, KLASIFIKASI label, back-cover text); no caller yet | coder-execution | tdd, dry-run-verify-fix | edited L/engine/front/texts.ts + parity test | C05, C06 | fix2-wrapper-text-parity green; entries equal research/38; baseline 8/8 SAME | implementation |
| C08 | CS-12: print the control-sheet subtitle from the text table under the control-sheet title when the opt-in param is set | coder-execution | tdd, dry-run-verify-fix | edited L/services/compose/front.ts + NEW test | C06, C07 | new test red then green (flag on ID/EN, flag absent); baseline 8/8 SAME and convert_v2 SAME; compose suite green | implementation |
| C09 | CS-06: when the opt-in param is set, render three signature columns with empty holder lines for roles the payload omits | coder-execution | tdd, dry-run-verify-fix | edited L/services/compose/front.ts + NEW test | C08 | new test red then green for 1, 2 and 3 roles; baseline 8/8 SAME and convert_v2 SAME; compose suite green | implementation |
| C10 | CS-11: when the opt-in param is set, render the manual control-sheet columns (STATUS derived from tier and revision; METODE/OBJEK/HASIL; MEDIA/KEMBALI) from the existing controlSheet.*.columns params | coder-execution | tdd, dry-run-verify-fix | edited L/services/compose/front.ts + NEW test | C09, C07 | new test red then green for ID/EN columns and STATUS; baseline 8/8 SAME and convert_v2 SAME; MCP payload schema diff empty (U3) | implementation |
| C11 | CV-20: cover title roles get a right indent from the opt-in title max-width param (150 mm in the 10; absent = no indent) | coder-execution | tdd, dry-run-verify-fix | edited L/engine/docx/wrapper/formats.ts + NEW test | C06 | new test red then green (907 tw at 150 mm, none when absent); baseline 8/8 SAME and convert_v2 SAME | implementation |
| C12 | CV-19: opt-in back-cover page carrying the spine string, driven by the new back-cover value in device.spine.placements | coder-execution | tdd, dry-run-verify-fix | edited L/engine/docx/wrapper/pages.ts + NEW test | C06, C07 | new test red then green (back cover present only with the value); baseline 8/8 SAME and convert_v2 SAME; clash zone rule D-599 still applies to the back cover | implementation |
| C13 | GF-19: opt-in DOCX page background from color.interior.paper (w:background and displayBackgroundShape); skip if C03 shows the PDF ignores it | coder-execution | tdd, dry-run-verify-fix | edited DOCX package part files + NEW test | C06, C03 | new test red then green on document.xml and settings.xml; baseline 8/8 SAME and convert_v2 SAME; PDF of one opt-in fixture samples the paper colour | implementation |
| C14 | GF-22: header rule and register top-rule colours from the new opt-in params (absent = today's INK200 and ink900) | coder-execution | tdd, dry-run-verify-fix | edited L/engine/docx/package/header-footer.ts + NEW test | C06 | new test red then green; baseline 8/8 SAME and convert_v2 SAME; opt-in fixture DOCX carries 6E1420 on both rules | implementation |
| C15 | CL-02 T/S: KLASIFIKASI row in the auto cover control block when the template lists it in cover.controlBlock.fields (value = meta.classification in capitals) | coder-execution | tdd, dry-run-verify-fix | edited L/engine/front/texts.ts + NEW test | C07, C06 | new test red then green ID/EN; baseline 8/8 SAME and convert_v2 SAME; default field list unchanged | implementation |
| C16 | CL-02 NOTA: opt-in "Klasifikasi:" line under the document number on NOTA documents | coder-execution | tdd, dry-run-verify-fix | edited NOTA number-block renderer + NEW test | C14 | new test red then green ID/EN; baseline 8/8 SAME (NOTA cases) and convert_v2 SAME | implementation |
| C17 | ST-01: build the STD rule-index section from the content markers defined in research/37 (AUTO slot; defined empty behaviour) | coder-execution | tdd, dry-run-verify-fix | edited L/engine/docx/assemble/units.ts + rule-index builder + NEW test | C04, C06 | new test red then green (markers -> index, empty content); baseline 8/8 SAME and convert_v2 SAME; no new payload field (U3) | implementation |
| C18 | TR-07: opt-in NOTA file-name form "title + ISO date" through the new naming param (absent = today's "<title> <number> Rev<r>") | coder-execution | tdd, dry-run-verify-fix | edited L/services/storage/paths.ts, L/services/render/pure/render.ts + NEW test | C06 | new test red then green incl. unsafe characters; existing file-name tests unchanged; baseline 8/8 SAME | implementation |
| C19 | GF-21: opt-in vertical-rhythm snapping of heading, table-row and figure heights to multiples of the 13.5 pt baseline | coder-execution | tdd, dry-run-verify-fix | edited DOCX spacing code (executor declares) + NEW test | C20 | new test red then green; baseline 8/8 SAME and convert_v2 SAME; DATUM-15 and clash.py unchanged on one opt-in fixture | implementation |
| C20 | GF-24: opt-in DOCX rail mode that reserves the outer 32 mm column on every interior page (128 mm body) beside the framePr renderer | coder-execution | tdd, dry-run-verify-fix | edited L/engine/docx/blocks/rail.ts, L/engine/docx/package/section.ts + NEW test | C06 | new test red then green; baseline 8/8 SAME and convert_v2 SAME; opt-in fixture has a 128 mm body and table width guards pass | implementation |
| C21 | GF-08 mechanism (M2): generic derived-preset step in the seed helper (preset spec table, base = latest datum-gsp-preset version, ADMIN pin of the Table 8.2 sizes) and guarded-transaction support for preset targets; datum-gsp-preset untouched | coder-execution | backend-execution, tdd, dry-run-verify-fix | edited prisma/seed-studio-templates.ts, prisma/seed-studio.ts + tests | C05 | seed tests red then green; dry-run on gsp_agent_hq_v21_uji with a test spec creates the preset with 0 writes; guard shows datum-gsp-preset and old templates unchanged | implementation |
| C22 | HTML preview parity for the opt-in wrapper features (CS-12 subtitle, CV-20 width, CV-19 back cover, GF-22 rule colours) where the HTML wrapper renders the same element | coder-execution | tdd, dry-run-verify-fix | edited L/engine/html files + NEW test | C08, C11, C12, C13, C14 | new HTML tests red then green; baseline 8/8 SAME (HTML hashes included); absent params give identical HTML | implementation |
| C23 | Spec table: set the opt-in values from research/38 in the shared, type and language layers of the 10 and switch their base preset to the Rev A preset (M2); no slug branching | coder-execution | backend-execution, tdd, dry-run-verify-fix | edited prisma/seed-doc-type-templates.ts + spec test | C06, C21 | s26 spec test green; DEV --doc-type-templates --dry-run plans 10 new versions + 1 preset with 0 writes and other templates unchanged; 0 slug branches (grep) | implementation |
| C24 | Run the fresh-seed path on gsp_agent_hq_v21_uji with the new seed (add the preset step to uji-run.mjs only if C21 requires it) and record both runs | coder-execution | dry-run-verify-fix | edited tests/integration/studio/uji-run.mjs if needed + run log | C23 | fresh-seed passes; second run unchanged | test |
| C25 | Scorer alignment: change a scorer expectation only where research/38 shows it encodes engine output that the manual contradicts (manual line cited); complete without change if none | coder-execution | tdd, dry-run-verify-fix | edited benchmark/datum_conformance/rules/expect_*.ts or none | C05 | scorer tests green; Manual 000 and datum-gsp calibration scores unchanged except the cited rules; deliberate mutants still fail | implementation |
| C26 | RB-08c (conditional on Q4 = literal reading): opt-in sheet numbering that restarts at page 1 of Chapter 1 (cover, control sheet and dividers unnumbered) for the ID templates | coder-execution | tdd, dry-run-verify-fix | edited L/engine/docx/package/section.ts and register page fields + NEW test | C20, C16 | new test red then green; baseline 8/8 SAME and convert_v2 SAME; register block SHEET/OF values consistent on one fixture | implementation |
| C27 | CV-15 (conditional on Q2 = yes): PENYUSUN prints the opt-in preparer-unit value (ID/EN from research/38) instead of meta.author; meta.author stays in signatures | coder-execution | tdd, dry-run-verify-fix | edited L/engine/front/texts.ts + NEW test | C15 | new test red then green; baseline 8/8 SAME; MCP payload schema diff empty | implementation |
| C28 | CV-21 (conditional on Q3 asset delivered): add the seal-colour logo to the asset manifest and select it through an opt-in logo param for the ID templates | coder-execution | tdd, dry-run-verify-fix | edited L/assets/manifest.json, L/engine/docx/wrapper/media.ts + asset + NEW test | C06 | asset sha256 and brand-owner provenance recorded; new test red then green; baseline 8/8 SAME | implementation |
| C29 | Regression gate after all engine, seed, scorer and UI rows: full studio suite, clean-SVG manifest, baseline compare, convert_v2 --check, tsc, eslint, grep for slug/type branching | test-expert | tdd | NEW <task>/verification/31_coverage_round_regression.md | C08, C09, C10, C11, C12, C13, C14, C15, C16, C17, C18, C19, C20, C21, C22, C23, C24, C25, C26, C27, C28, U03, U04 | full suite and manifest green; baseline 8/8 SAME and convert_v2 SAME x3; tsc and eslint 0 with 0 new slug/type branches | test |
| C30 | DEV reseed on gsp_agent_hq_v21: presets, contract and doc-type dry-runs, real --doc-type-templates run, rerun; snapshot of other templates before and after; canonical describe recorded | coder-execution | dry-run-verify-fix | NEW <task>/implementation/datum_coverage_round_dev_seed.md | C29 | dry-runs 0 writes with presets and contract unchanged; 10 new versions + Rev A preset, then rerun unchanged; old-template snapshot identical (AC-C2) | implementation |
| C31 | DEV render of the 10 on 9021 with the realistic ID/EN payloads of verification/23 r2 (driver from gsp-backups): DOCX and PDF, B-FIX fixtures, spec JSON; confirm 9021 serves the current tree first | coder-execution | dry-run-verify-fix | NEW <task>/implementation/datum_coverage_round_dev_render.md + artifacts | C30 | 10 documents valid and rendered on the new versions; payload diff within each language = template field only; spec JSON regenerated from the new spec table | test |
| C32 | DEV conformance gate per pair: scorer full rule set, clash.py with --docx, coverage file from C33 | test-expert | tdd | NEW <task>/verification/32_coverage_round_conformance_dev.md | C31, C25, C33 | score >= 85 % on every pair; 4/4 critical on every pair; 0 clashes on every pair | verification |
| C33 | Re-measure point coverage per pair under the strict rule against the new code, the new DEV versions and the C31 PDFs; compare with section 4 | data-analyst | - | NEW <task>/verification/33_datum_point_coverage_r3.md + NEW <task>/verification/coverage/datum_point_coverage_r3.json | C31 | every changed cell cites file:line or PDF evidence; per-pair coverage truncated to one decimal; deviations from section 4 explained | verification |
| C34 | Senior code review of all engine, seed and scorer changes, with U4 as a blocker and constraints (a)-(d) checked | senior-code-reviewer | code-review-senior | NEW <task>/verification/34_coverage_round_code_review.md | C29 | verdict with file:line; any slug/type branch or non-opt-in default flagged as a blocker; byte-identity claims checked against C29 evidence | verification |
| C35 | Security review: validation of new param values written into XML attributes and file names, TR-07 file-name sanitising, seed guard and preset-target changes, CV-21 asset intake, DB writes limited to ALLOWED_DATABASES | security-review | security-review-gate | NEW <task>/verification/35_coverage_round_security_review.md | C29 | PASS/CAUTION/FAIL verdict; every finding cites file:line; CAUTION/FAIL flagged for USER | verification |
| C36 | DEV final verification: AC-C1..AC-C10 against fresh evidence, constraints (a)-(d), coverage result vs section 4, UI workstream evidence | verifier | verification-before-completion | NEW <task>/verification/36_coverage_round_dev_verification.md | C32, C33, C34, C35, U05, U06 | every AC has command or file evidence; constraints (a)-(d) each proven; gaps reported as proposed new rows | verification |
| C37 | Round report, Summary then Details: per-pair coverage before and after, measured score, rows run and skipped, agents and skills used, open USER decisions | data-analyst | - | NEW <task>/report/datum_coverage_round_report.md | C36 | numbers equal the C32 and C33 files; every claim cites a verification file; no controller-owned file edited | report |
| C38 | Optional production phase: runbook for a template-version update reusing the deploy/05 pattern (section 6): commit/tag, r3 checkout, backup, clone, seed clone, rehearsal with r3 and r2, export of new-version rows, port swap, conditional Hermes repoint, one-transaction import, smoke, RB-1v/RB-2/RB-3 | coder-execution | dry-run-verify-fix | NEW <task>/deploy/09_datum_coverage_round_rollout_plan.md | C36 | every step has STOP checks and gate tests as in deploy/05; import pre-checks latestVersionNo and latest md5 per slug and the absent preset slug; RB-1v before RB-2 written and rehearsable | masterplan |
| C39 | Security review of the runbook delta against deploy/05 (new-version import SQL, RB-1v, secret handling, out-of-app process launches) | security-review | security-review-gate | NEW <task>/verification/37_coverage_round_runbook_security_review.md | C38 | PASS/CAUTION/FAIL verdict; every finding cites a runbook line; CAUTION/FAIL flagged for USER | verification |
| C40 | After G-PROD: commit to v2.1 and local tag prod-v2.1-datum-coverage-<date>, no push | git-specialist | finishing-a-development-branch | commit and tag in repo v2.1 | C39 | git status clean; tag points at the new commit; no push | initialization |
| C41 | Production checkout C:/Users/TRIAL/gsp-hq-prod-v21-r3 from the tag: clone --no-hardlinks, .env and certs copied from r2 without printing, npm ci, build, tsc | coder-execution | dry-run-verify-fix | NEW C:/Users/TRIAL/gsp-hq-prod-v21-r3 | C40 | build exit 0 with BUILD_ID recorded; tsc 0; git status clean with .env/certs ignored | initialization |
| C42 | Fresh production pg_dump with db_guard, restore to gsp_agent_hq_v21_seedtest, migrate status, then --doc-type-templates dry-run, run and rerun from r3 on the clone | coder-execution | dry-run-verify-fix | NEW backup folder under C:/Users/TRIAL/gsp-backups + seeded clone | C41 | dump readable (pg_restore --list) with sha recorded; migrate status up to date; clone rerun unchanged with old templates identical and the 10 at prod latest + 1 | implementation |
| C43 | Rehearsal on the clone, out-of-app, with a temporary STUDIO_WORKSPACE_ROOT: r3 on 9031 renders the 10; r2 against the clone renders a document pinned to a new version without error; RB-1v rehearsed | coder-execution | dry-run-verify-fix | NEW rehearsal logs and renders in the backup folder | C42 | 10 renders OK with latest = datum-gsp; r2 renders the new-version document without error; RB-1v restores the previous latestVersionNo | gateway_check |
| C44 | Rehearsal conformance for the 10 rehearsal renders | test-expert | tdd | NEW <task>/verification/38_coverage_round_conformance_rehearsal.md | C43 | score >= 85 % on every pair; 4/4 critical; 0 clashes | gateway_check |
| C45 | Export only the new rows from the clone (versions above production latest for the 10, their slots, slot params and role formats, plus the Rev A preset rows) with sha256 and counts; drop the clone after verification | coder-execution | dry-run-verify-fix | NEW export files and SHA256SUMS in the backup folder | C44 | counts per table recorded and every row belongs to the 10 or the preset; section types in the clone equal production; clone dropped only after the sha check | implementation |
| C46 | After G-RESTART: port swap code before data; r2 at 9011 stopped, r3 started out-of-app, r2 kept as loopback standby | coder-execution | dry-run-verify-fix | r3 process at 9011 + swap log | C45 | /login 200 with downtime recorded; smoke S-1..S-14 pass; template list = 17 and latest = datum-gsp | implementation |
| C47 | Launchers to r3 out-of-app: cd line in gsp-ecosystem-start.sh and the HQ cwd in the watchdog, with .bak copies and original EOL | coder-execution | dry-run-verify-fix | edited 2 launcher files | C46 | diff = 1 line per file with EOL intact; bash -n and py_compile OK; .bak files exist | implementation |
| C48 | Hermes MCP repoint to r3, conditional on the runbook's diff of scripts/studio/mcp and its imports between r2 and r3 being non-empty; one gateway at a time (D-589) | coder-execution | dry-run-verify-fix | edited Hermes MCP configs or a recorded skip | C46 | diff result recorded; if repointed, all profiles reference r3 and secrets stay env references; studio_contracts_query ok on each running gateway | implementation |
| C49 | Import the new rows into production in one transaction: pre-check expected latestVersionNo and latest md5 per slug and the absent preset slug, insert, update latestVersionNo/updatedAt, post-check | coder-execution | dry-run-verify-fix | 10 new template versions + Rev A preset in gsp_agent_hq | C45, C46, C48 | old templates identical (AC-C2); delta per table = C45 export; existing documents keep their pinned version | implementation |
| C50 | Production smoke: one document on one updated template (D-612 pattern), DOCX/PDF verified by the server, then archived without deletion | coder-execution | dry-run-verify-fix | NEW <task>/implementation/datum_coverage_round_prod_smoke.md | C49 | document valid on the new version; DOCX bytes equal the C43 rehearsal render for the same payload; archived=t with no deletion | test |
| C51 | Production conformance for the smoke render, with rehearsal results as the 10-pair evidence | test-expert | tdd | NEW <task>/verification/39_coverage_round_conformance_prod.md | C50 | score >= 85 %; 4/4 critical; 0 clashes | verification |
| C52 | Final production verification: AC-C11, rollback readiness (RB-1v/RB-2 commands, .bak files, r2 standby runnable), 30-minute log observation, no secrets in logs or reports | verifier | verification-before-completion | NEW <task>/verification/40_coverage_round_final_verification.md | C47, C51 | every AC has fresh evidence; rollback artefacts and commands verified; 0 new request errors and 0 secrets | verification |
| U01 | Category mapping design for the parameter editor: read every ParamDef (group, namespace, chapter) in L/params and research/01, define ONE mapping table (ParamGroup with namespace exceptions -> the 13 Indonesian categories + fallback Lainnya) with stable order and per-category counts, and confirm the namespace sub-group recommendation | data-analyst | - | NEW <task>/research/39_param_category_mapping.md | none | every registry key counted exactly once (total = ALL_PARAMS length); Lainnya = 0; order, labels and sub-group rule listed | research |
| U02 | Mapping module: one category table and pure helpers (categoryOf, groupByCategory with namespace sub-groups) from research/39 | coder-execution | tdd, dry-run-verify-fix | NEW module under src/components/studio/template-editor/ + NEW unit test | U01 | test red then green: every ALL_PARAMS key maps to a non-Lainnya category; category order pinned; tsc and eslint 0 | implementation |
| U03 | ParamEditor grouped by category (chapter level removed, namespace sub-groups inside), keeping search, refFilter, changed counts, open/close state, aria-expanded and keyboard; replace values.ts groupParams | coder-execution | tdd, dry-run-verify-fix | edited src/components/studio/template-editor/param-editor.tsx, values.ts + NEW tests | U02 | view-model and renderToStaticMarkup tests red then green (category order, search opens all, changed counts, aria-expanded); tsc and eslint 0; diff limited to template-editor and tests | implementation |
| U04 | Preview pane (conditional on Q9 = yes): group the template-preview parameter list by the same category mapping and remove its chapter grouping | coder-execution | tdd, dry-run-verify-fix | edited src/components/studio/template-preview/param-tools.ts, index.tsx + NEW test | U02 | new test red then green; tsc and eslint 0; 0 chapterRank left in template-preview (grep) | implementation |
| U05 | UI check on DEV 9021 in the browser: template editor Advanced panel and preset mode, screenshots; legitimate admin session only (USER login, Q11), no credential or cookie handling by agents; otherwise record why and rely on U03 tests | test-expert | webapp-testing | NEW <task>/verification/41_param_category_ui_check.md + screenshots | U03, U04 | screenshots of both surfaces show categories and no Bab headings, or a recorded reason; search and one ?paramFilter= link checked; no credential printed | verification |
| U06 | UI/UX consistency review of U02-U04: labels, order, accessibility, consistency with the essentials panel and UI kit, scope (no server, registry or output change) | senior-code-reviewer | code-review-senior | NEW <task>/verification/42_param_category_ui_review.md | U03, U04 | verdict with file:line; aria-expanded and keyboard confirmed; diff confirmed UI-only | verification |

## Execution Profile

| Step | Ownership area (exact paths) | Size | Dep kind | Model | Checks | Review |
|---|---|---|---|---|---|---|
| C01 | docs only: NEW under <task>/research/ (verified parent); read-only on code | M | none | inherit | 3 | batched |
| C02 | docs only: NEW under <task>/verification/ (verified); temp worktree outside the repo (UNKNOWN - executor declares path); DEV DB dry-run only | M | C01:C | inherit | 3 | batched |
| C03 | docs only: NEW under <task>/research/ (verified); temp files under a short C:/tmp path (executor declares) | S | none | inherit | 3 | batched |
| C04 | docs only: NEW under <task>/research/ (verified) | S | none | inherit | 3 | batched |
| C05 | docs only: NEW under <task>/research/ (verified); names register, sole source of names for C06-C28 | M | C01:B, C02:B, C03:C, C04:C, U01:C | inherit | 3 | batched |
| C06 | registry contract: EXISTS: src/lib/studio/params/page.ts, color-type.ts, render.ts, apparatus.ts, governance-language.ts (sole writer of L/params this round); NEW test under tests/unit/studio/ (verified parent) | M | C05:B | inherit | 3 | gate |
| C07 | EXISTS: src/lib/studio/engine/front/texts.ts; EXISTS: tests/unit/studio/renderers/fix2-wrapper-text-parity.test.ts | S | C05:B, C06:C | inherit | 3 | gate |
| C08 | EXISTS: src/lib/studio/services/compose/front.ts; own NEW test | S | C06:B, C07:B | inherit | 3 | gate |
| C09 | EXISTS: src/lib/studio/services/compose/front.ts; own NEW test | S | C08:B | inherit | 3 | gate |
| C10 | EXISTS: src/lib/studio/services/compose/front.ts; own NEW test | M | C09:B, C07:B | inherit | 3 | gate |
| C11 | EXISTS: src/lib/studio/engine/docx/wrapper/formats.ts; own NEW test | S | C06:B | inherit | 2 | gate |
| C12 | EXISTS: src/lib/studio/engine/docx/wrapper/pages.ts; own NEW test | M | C06:B, C07:B | inherit | 3 | gate |
| C13 | UNKNOWN - executor declares (part files inside src/lib/studio/engine/docx/package/, excluding section.ts and header-footer.ts) | S | C06:B, C03:B | inherit | 3 | gate |
| C14 | EXISTS: src/lib/studio/engine/docx/package/header-footer.ts; own NEW test | S | C06:B | inherit | 3 | gate |
| C15 | EXISTS: src/lib/studio/engine/front/texts.ts (control-block row builder); own NEW test | S | C07:B, C06:B | inherit | 3 | gate |
| C16 | UNKNOWN - executor declares (NOTA number-block renderer; if header-footer.ts, serialized after C14) | S | C14:B | inherit | 2 | gate |
| C17 | EXISTS: src/lib/studio/engine/docx/assemble/units.ts; rule-index builder: UNKNOWN - executor declares (not compose/front.ts) | M? | C04:B, C06:B | inherit | 3 | gate |
| C18 | EXISTS: src/lib/studio/services/storage/paths.ts; EXISTS: src/lib/studio/services/render/pure/render.ts | S | C06:B | inherit | 3 | gate |
| C19 | UNKNOWN - executor declares (DOCX block and table spacing; may include EXISTS: src/lib/studio/engine/docx/tables/render.ts after C20) | M? | C20:B | inherit | 3 | gate |
| C20 | EXISTS: src/lib/studio/engine/docx/blocks/rail.ts; EXISTS: src/lib/studio/engine/docx/package/section.ts; EXISTS: src/lib/studio/engine/docx/tables/render.ts if needed | M? | C06:B | inherit | 3 | gate |
| C21 | EXISTS: prisma/seed-studio-templates.ts; EXISTS: prisma/seed-studio.ts; EXISTS: tests/unit/studio/seed/s09-seed-template-helpers.test.ts; DB gsp_agent_hq_v21_uji (dry-run) | M | C05:B | inherit | 3 | gate |
| C22 | EXISTS: src/lib/studio/engine/html/blocks/wrapper.ts; other HTML files: UNKNOWN - executor declares (inside src/lib/studio/engine/html/) | M | C08:B, C11:B, C12:B, C13:B, C14:B | inherit | 3 | gate |
| C23 | EXISTS: prisma/seed-doc-type-templates.ts; EXISTS: tests/unit/studio/seed/s26-doc-type-template-specs.test.ts; DEV DB dry-run only | M | C06:B, C21:B | inherit | 3 | gate |
| C24 | EXISTS: tests/integration/studio/uji-run.mjs; DB gsp_agent_hq_v21_uji (sole user this wave) | S | C23:B | sonnet (run fresh-seed, report) | 2 | batched |
| C25 | EXISTS: benchmark/datum_conformance/rules/expect_structure_a.ts, expect_structure_b.ts, expect_language.ts (sole writer of scorer rules) | S | C05:B | inherit | 3 | gate |
| C26 | EXISTS: src/lib/studio/engine/docx/package/section.ts (after C20); register page fields in EXISTS: src/lib/studio/engine/docx/package/header-footer.ts (after C16) | S | C20:B, C16:B | inherit | 3 | gate |
| C27 | EXISTS: src/lib/studio/engine/front/texts.ts (after C15) | S | C15:B | inherit | 3 | gate |
| C28 | EXISTS: src/lib/studio/assets/manifest.json; EXISTS: src/lib/studio/engine/docx/wrapper/media.ts; asset file: UNKNOWN - executor declares | S | C06:B | inherit | 3 | gate |
| C29 | docs only: NEW under <task>/verification/ (verified); runs suites, edits no code | M | C08:B, C09:B, C10:B, C11:B, C12:B, C13:B, C14:B, C15:B, C16:B, C17:B, C18:B, C19:B, C20:B, C21:B, C22:B, C23:B, C24:B, C25:B, C26:B, C27:B, C28:B, U03:B, U04:B | inherit (verification agent) | 3; gate flows: suite, manifest, baseline, convert_v2 | n/a |
| C30 | docs only: NEW under <task>/implementation/ (verified); DB gsp_agent_hq_v21 (sole writer this wave) | S | C29:B | inherit | 3 | batched |
| C31 | docs only: NEW under <task>/implementation/; DEV documents via MCP 9021; DEV server 9021 (sole user this wave); artifacts under a short C:/tmp path | M | C30:B | inherit | 3; gate flows: 10 renders + B-FIX | batched |
| C32 | docs only: NEW under <task>/verification/ (verified) | M | C31:B, C25:B, C33:C | inherit (verification agent) | 3 | n/a |
| C33 | docs only: NEW under <task>/verification/ and NEW under <task>/verification/coverage/ (verified) | M | C31:B | inherit | 3 | batched |
| C34 | docs only: NEW under <task>/verification/ (verified) | M | C29:B | inherit (verification agent) | 3 | n/a |
| C35 | docs only: NEW under <task>/verification/ (verified) | M | C29:B | inherit (verification agent) | 3 | n/a |
| C36 | docs only: NEW under <task>/verification/ (verified) | M | C32:B, C33:B, C34:B, C35:B, U05:B, U06:B | inherit (verification agent) | 3 | n/a |
| C37 | docs only: NEW under <task>/report/ (verified parent; report.md stays controller-owned) | S | C36:B | inherit | 3 | batched |
| C38 | docs only: NEW under <task>/deploy/ (verified); read-only towards production | M | C36:B | inherit | 3 | batched |
| C39 | docs only: NEW under <task>/verification/ (verified) | M | C38:B | inherit (verification agent) | 3 | n/a |
| C40 | git: index, commit and tag of repo v2.1 (sole writer) | S | C39:B | sonnet (mechanical commit and tag) | 3 | batched |
| C41 | NEW under C:/Users/TRIAL (verified parent; gsp-hq-prod-v21-r3 confirmed absent) | S | C40:B | sonnet (run build, report output) | 3 | batched |
| C42 | NEW under C:/Users/TRIAL/gsp-backups (verified parent): backup folder; DB clone gsp_agent_hq_v21_seedtest (sole writer); production dump read-only | M | C41:B | inherit | 3 | batched |
| C43 | NEW under the C42 backup folder: logs and renders; ports 9031 and the r2 rehearsal port; DB clone | M | C42:B | inherit | 3 | batched |
| C44 | docs only: NEW under <task>/verification/ (verified) | S | C43:B | inherit (verification agent) | 3 | n/a |
| C45 | NEW under the C42 backup folder: export files; DB clone (export, then drop) | S | C44:B | inherit | 3 | batched |
| C46 | runtime: port 9011 and the r2 standby port; no repo file edits | M | C45:B | inherit | 3 | batched |
| C47 | EXISTS: C:/Users/TRIAL/gsp-ecosystem/gsp-ecosystem-start.sh; watchdog file: UNKNOWN - executor declares (AppData, viewed out-of-app) | S | C46:B | inherit | 3 | batched |
| C48 | UNKNOWN - executor declares: Hermes profile MCP configs (AppData, out-of-app); gateways | M | C46:B | inherit | 3 | batched |
| C49 | runtime: DB gsp_agent_hq (sole writer); imports the C45 rows | M | C45:B, C46:B, C48:B | inherit | 3 | batched |
| C50 | docs only: NEW under <task>/implementation/; one production document via 9011 | S | C49:B | inherit | 3 | batched |
| C51 | docs only: NEW under <task>/verification/ (verified) | M | C50:B | inherit (verification agent) | 3 | n/a |
| C52 | docs only: NEW under <task>/verification/ (verified) | M | C47:B, C51:B | inherit (verification agent) | 3 | n/a |
| U01 | docs only: NEW under <task>/research/ (verified); read-only on L/params | M | none | inherit | 3 | batched |
| U02 | NEW under src/components/studio/template-editor/ (verified parent): category module; NEW test under tests/unit/studio/ | S | U01:B | inherit | 3 | gate |
| U03 | EXISTS: src/components/studio/template-editor/param-editor.tsx; EXISTS: src/components/studio/template-editor/values.ts; own NEW tests | M | U02:B | inherit | 3 | gate |
| U04 | EXISTS: src/components/studio/template-preview/param-tools.ts; EXISTS: src/components/studio/template-preview/index.tsx; own NEW test | S | U02:B | inherit | 3 | gate |
| U05 | docs only: NEW under <task>/verification/ (verified) + screenshots; DEV server 9021 (sole user this wave) | S | U03:B, U04:B | inherit (verification agent) | 3 | n/a |
| U06 | docs only: NEW under <task>/verification/ (verified) | S | U03:B, U04:B | inherit (verification agent) | 3 | n/a |

### Shared resources

| Resource | Only writer (per wave) | Note |
|---|---|---|
| src/lib/studio/params/*.ts (registry) | C06 (W3) | Conditional B params (Q2, Q3, Q4) go into C06 only if answered at G0; otherwise a new small contract row |
| src/lib/studio/engine/front/texts.ts | C07 (W3), C15 (W7), C27 (W9) | B chain C07 -> C15 -> C27 |
| tests/unit/studio/renderers/fix2-wrapper-text-parity.test.ts | C07 | Other rows write their own test files |
| src/lib/studio/services/compose/front.ts | C08 (W4), C09 (W5), C10 (W6) | B chain |
| src/lib/studio/engine/docx/package/header-footer.ts | C14 (W4), C16 (W5) if it is the NOTA block, C26 (W8) | B chain C14 -> C16 -> C26 |
| src/lib/studio/engine/docx/package/section.ts | C20 (W4), C26 (W8) | C13 must not touch it |
| src/lib/studio/engine/docx/tables/render.ts | C20 (W4), C19 (W7) if needed | C19 depends on C20 (B) |
| src/lib/studio/engine/html/** | C22 (W8) | Only HTML writer |
| prisma/seed-studio.ts, prisma/seed-studio-templates.ts | C21 (W3) | |
| prisma/seed-doc-type-templates.ts | C23 (W5) | Single spec table (U4) |
| benchmark/datum_conformance/rules/* | C25 (W8) | |
| src/components/studio/template-editor/** | U02 (W2), U03 (W3) | |
| src/components/studio/template-preview/** | U04 (W4) | |
| DB gsp_agent_hq_v21 (DEV) | dry-runs C02 (W1), C06 (W3), C23 (W5); writes C30 (W11), C31 (W12) | Dry-runs roll back; the controller runs them one at a time |
| DB gsp_agent_hq_v21_uji | C21 (W3), C24 (W7) | |
| DEV server 9021 | U05 (W8), C31 (W12) | Each confirms 9021 serves the current tree; DEV restart out-of-app if needed |
| Git metadata repo v2.1 | C02 (temp worktree, W1), C40 (commit/tag) | Rows do not commit |
| Production DB gsp_agent_hq | C42 (dump read), C49 (import), C50 (smoke document) | Ordered by B edges |
| DB clone gsp_agent_hq_v21_seedtest | C42, C43, C45 | |
| Ports 9031, 9011, r2 standby port | C43 (9031), C46 (9011 + standby) | Free ports checked at run time |
| Launchers, Hermes MCP configs and gateways | C47, C48 | Out-of-app via WMI (deploy/04) |
| package.json and package-lock.json | none | No new dependency; a need becomes needs-review and a USER decision |
| Controller-owned files (status_tasks.md, README.md, decisions/decisions.md, implementation/99_implementation_report.md, report/report.md) | controller | Not owned by any row |

### Waves (from B edges, ceiling 4)

| Wave | Rows |
|---|---|
| G0 | USER approval and answers Q1-Q11 |
| W1 | C01, C02, C03, U01 |
| W2 | C04, C05, U02 |
| G-SPIKE | controller check of the C01/C02/C05 verdict |
| W3 | C06, C07, C21, U03 |
| W4 | C08, C14, C20, U04 (conditional) |
| W5 | C09, C16, C17, C23 |
| W6 | C10, C11, C12, C13 |
| W7 | C15, C18, C19, C24 |
| W8 | C22, C25, C26 (conditional), U05 |
| W9 | C27 (conditional), C28 (conditional), U06 |
| W10 | C29 |
| W11 | C30, C34, C35 |
| W12 | C31 |
| W13 | C32, C33 |
| W14 | C36 |
| W15 | C37, C38 (optional phase starts) |
| W16 | C39 |
| G-PROD | USER approval of production changes |
| W17-W22 | C40, C41, C42, C43, C44, C45 (in order) |
| G-RESTART | USER approval of the restart |
| W23 | C46 |
| W24 | C47, C48 (conditional) |
| W25 | C49 |
| W26 | C50 |
| W27 | C51 |
| W28 | C52 |

**Relaxed C edges.** C02 runs beside C01, but its verdict is read only after C01. C05 runs once C01/C02 are done, and its UI-category and ST-01/GF-19 cells are filled when U01, C04 and C03 land. C07 starts with C06 because it needs only the names. C32 runs beside C33 and takes the coverage JSON when it lands; coverage is not a gate criterion (D-608).

**Reasons for B edges into gates.**
- C30 -> C29: the DEV DB changes only after byte identity is proven (same rule as S34 last round).
- C36 -> C34, C35, U05, U06: DEV sign-off needs both reviews and the UI evidence.
- C40 -> C39: production needs the reviewed runbook and G-PROD.
- C46 -> C45: the swap happens only after rehearsal and export pass, so a failed rehearsal leaves production untouched.
- C49 -> C48: data comes after the MCP state is consistent, whether repointed or skipped.

### Cost statement (estimates, labelled as estimates)

- **Rows:** 58 = 52 coverage + 6 UI. Sizes: 28 S, 30 M (3 of them M?: C17, C19, C20). 0 rows of size L. 0 rows with more than 3 checks. 5 conditional rows (C26, C27, C28, C48, U04).
- **Model:** 3 sonnet (C24, C40, C41) and 55 inherit. Every entry and verification agent is inherit.
- **Waves:** 28 execution waves plus 4 gates (G0, G-SPIKE, G-PROD, G-RESTART). Widest 4. DEV ends at W14, the report at W15; production is W15-W28.
- **Critical path (DEV):** C01 -> C05 -> C06 -> C14 -> C16 -> C26 -> C29 -> C30 -> C31 -> C32/C33 -> C36 -> C37. The compose chain C08 -> C09 -> C10 runs in parallel with 0-1 wave of slack. By dependency depth C29 could run at W7; the ceiling of 4 pushes it to W10.
- **What shortens it:**
  - Raise the ceiling to 5-6 for W4-W8. The areas are disjoint and single-writer files are chained, so the `wave_and_mediation.md` conditions hold. Saves about 2 waves.
  - Answer Q2-Q4 "no" or "practice" to drop C26-C28 and W9.
  - Let the UI workstream (U01-U06) sign off on its own if USER wants it shipped earlier.
- **Three most expensive rows:** C20 (GF-24 reserved rail, layout and gate risk), C19 (GF-21 rhythm snapping), C17 (ST-01 rule index). In production, C43 (rehearsal with two instances).
- **Rough effort:** about 20-24 agent-hours for DEV and 6-8 for production, plus USER wait time and G-FIX loops. About 9-11 million tokens.
- **Grounding:** EXISTS = 24 rows, every path checked with Glob/Read in this session (params/page.ts, color-type.ts, render.ts, apparatus.ts, governance-language.ts, texts.ts, fix2 test, compose/front.ts, wrapper/formats.ts, wrapper/pages.ts, wrapper/media.ts, package/header-footer.ts, package/section.ts, blocks/rail.ts, assemble/units.ts, tables/render.ts, storage/paths.ts, render/pure/render.ts, html/blocks/wrapper.ts, seed-studio.ts, seed-studio-templates.ts, seed-doc-type-templates.ts, s09 and s26 seed tests, uji-run.mjs, expect_structure_a/b.ts, expect_language.ts, assets/manifest.json, param-editor.tsx, values.ts, param-tools.ts, template-preview/index.tsx, gsp-ecosystem-start.sh). NEW-under = 5 (U02, C41, C42, C43, C45). UNKNOWN = 4 full (C13, C16, C19, C48) + 6 partial (C02 worktree, C17 builder, C22 other HTML, C28 asset, C47 watchdog, C03 temp). The rest are docs only or runtime.

## Recommendation & Next-Plan Summary

**Recommended order.**
1. W1-W2: the spike (C01, C02), the GF-19 probe and ST-01 research, then the names register. The UI mapping runs alongside.
2. G-SPIKE: the controller checks the verdict.
3. W3: the contract, text entries, preset mechanism and ParamEditor regroup.
4. W4-W9: engine features, one writer per hot file, then HTML parity, the spec table, scorer alignment and conditional B rows. The UI check and review run in W8-W9.
5. W10-W14: the regression gate, DEV reseed, render, conformance gate, coverage re-measure, code and security reviews, and DEV verification.
6. W15: the report, with production prepared only if USER asks (runbook + security review). G-PROD and G-RESTART are separate USER approvals.

**Key risks.**
1. The spike refutes P1-P7, for example a role catalogue emitted into styles.xml (P7). Mitigation: G-SPIKE stops engine rows before W3, and a refinement pass follows.
2. GF-24 or GF-21 cause clashes or measured failures on the 10. Mitigation: per-row fixture checks, the C32 gate, G-FIX at most 3 cycles. The feature can stay off in the spec table, which drops its +0.5.
3. The scorer encodes engine output (CS-11 headers). Mitigation: C05 lists the flips; C25 aligns only with manual citations.
4. LibreOffice ignores w:background (GF-19). Mitigation: C03 first; projection without GF-19 is in section 4.
5. registryInSync turns false. This is expected and only reported; C01 confirms nothing asserts it.
6. Production: version-number drift between DEV (v3) and production (v1). Mitigation: rows computed in the clone, expected-latest pre-check, RB-1v.
7. Existing production documents re-pinning on edit (unknown). Mitigation: C38 checks and records it.
8. UI admin surfaces cannot be captured without a USER login. Mitigation: Q11; otherwise the component tests are the evidence.
9. New coverage params land in UI category "Lainnya". Mitigation: C05 assigns categories; C29 runs the mapping test.

**What needs USER approval.** G0 (this blueprint and Q1-Q11), G-SEC findings, G-PROD and G-RESTART (production phase, optional), and any new dependency.

**Pending decisions (recommended option first).**

| ID | Question | Recommendation |
|---|---|---|
| Q1 | Do you accept that point coverage stays informational (D-608), since the strict-rule ceiling is 78-84 % even with every option? | Yes. Gate = measured score; report coverage with its gaps |
| Q2 | CV-15: may PENYUSUN in the Rev A templates print a template-fixed unit ("Divisi Engineering PT GSP" / "Engineering Division, PT GSP") instead of `meta.author`, which stays in the signatures? | Yes, as template data only. The payload does not change, but the meaning of `meta.author` on the cover does. +1 point on 8 pairs |
| Q3 | CV-21: will the brand owner supply the official seal-colour (6E1420) GSP logo file? | Yes, supply the official asset. Agents will not recolour the black logo. Until it arrives, C28 waits and CV-21 ID stays N |
| Q4 | RB-08c: should Rev A ID templates restart sheet numbering at Chapter 1 (literal ID:2510-2511), or count from page 1 (practice, ID:304)? | Literal, as an opt-in in the ID templates (D-590: each edition follows its own text). Both answers give +0.5 on ID T/S |
| Q5 | GF-08: accept a new style preset "GSP DATUM Rev A" (visible in preset lists, one extra production row) to apply the Table 8.2 sizes? | Yes. +0.5 on all 10 pairs; datum-gsp-preset is untouched |
| Q6 | NU-06 + LB-12 (bilingual pair), NU-08 (draft states), NU-09 (number reservation): include them? | Defer to a separate product task. They need a data model, production numbering and a pair declaration from agents |
| Q7 | CL-03: lift D-590's ANRI-only rule for per-recipient schemes? | No. 0 coverage gain under the strict rule |
| Q8 | Relax U3 for the NC-07 binding-sum marker, the NC-05 annex flag or the CS-08 V1 record? | No for this round. NC-07 gives +0.5 on EN and NOTA only; CS-08 gives 0 |
| Q9 | UI: apply the same category grouping to the preview pane's parameter list in the same editor page (`template-preview/param-tools.ts`)? | Yes, one mapping and no leftover chapter grouping (row U04) |
| Q10 | UI: namespace sub-groups inside every category, or only in large ones? | Every category (keeps today's second level, open state and counts) |
| Q11 | UI: will you log in to DEV 9021 in the browser preview so the admin screenshots can be taken? Agents never handle credentials | Yes. Otherwise U05 records the reason and the component tests carry the evidence |
| Q12 (later, at G-PROD) | Production rollout of this round, and the standby: r2 on loopback after retiring the 3566486 standby on 9051 (D-624 open item 3)? | Decide at G-PROD with the reviewed runbook |
