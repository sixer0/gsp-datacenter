---
task_slug: doc_artifact_studio
row: S19 (DATUM Rev A blueprint, regression gate for refactors + phase 0)
date: 2026-11-04
agent: test-expert
source_plan: docs/2026-10-22_doc_artifact_studio/identification/02_structured_datum_rev_a.md (row S19, line 135; AC-7 line 68; RQ-8 line 57)
skills_loaded: tdd
status: complete
---

# S19: Phase 0 regression gate

Repo `C:\Users\TRIAL\gsp-swarm-hq-v2.1`, branch v2.1, HEAD `3566486`, uncommitted work from S06-S18 in the working tree. Every command below was run fresh on 2026-11-04 between 19:28 and 19:42 (+0700). No production code was edited. Nothing was committed. No port was opened.

Implementer reports read (newest entry at the top of each): `delegation_progress/coder_execution_s06.md`, `coder_execution_s07_s08.md`, `coder_execution_s09_s11.md`, `coder_execution_s12.md`, `coder_execution_s13_s15.md`, `coder_execution_s16_s18.md`.

## 1. Verdict table

| # | Check (AC-7 / RQ-8) | Command | Result | Verdict |
|---|---|---|---|---|
| 1a | Full studio suite, Phase 0 scope (everything except datum-conformance) | `npx vitest run tests/unit/studio --exclude 'tests/unit/studio/datum-conformance/**'` | 239 files, 4418/4418 tests passed, exit 0 | PASS |
| 1b | Full studio suite, single run including datum-conformance | `npx vitest run tests/unit/studio` | 244/247 files, 4474/4562 tests passed; all 88 failures are in 3 in-flux datum-conformance files, exit 1 | PASS for Phase 0 (failures are in-flux, see §3) |
| 1c | datum-conformance suite on its own (in flux, not counted) | `npx vitest run tests/unit/studio/datum-conformance` | 9 files, 199/199 passed, exit 0 (the rule files were finished between run 1b and this run) | informational |
| 2 | Clean-SVG manifest | `npx vitest run tests/unit/studio/figures/clean-svg-manifest.test.ts` | 1 file, 4/4 passed, exit 0 | PASS |
| 3 | Manual 000 conversion | `npx tsx benchmark/extract/convert_v2.ts --check` | `SAME` x3, exit 0 | PASS |
| 4 | ID byte baseline (S05) | `npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root ... --compare ...` | `compare: 8/8 SAME`, exit 0 | PASS |
| 5a | Typecheck | `npx tsc --noEmit -p .` | 0 lines of output, exit 0 (run twice: 19:29 and 19:41) | PASS |
| 5b | Lint of every changed and untracked .ts | `npx eslint <82 files>` | 0 lines of output, exit 0 (run twice: 79 files, then 82 files) | PASS |
| 6 | No new slug/type branching (D-595; D-590 exception) | diff grep, §5 | 0 new branches. 2 old slug branches were removed and 1 was replaced by a registry lookup | PASS |
| 7 | Integration suite against `gsp_agent_hq_v21_uji` | `node tests/integration/studio/uji-run.mjs suite` | 23 passed, 2 failed, 1 skipped, exit 1 | FAIL, but both failures come from commits already in HEAD, not from Phase 0 (see §6) |

**Gate outcome for S19 (row criteria: studio suite and manifest green; convert_v2 SAME and ID hashes equal S05; 0 new slug/type branches):** all met. The two integration failures are out-of-date pins from before this round. They are listed in §6 for the controller and do not block the Phase 0 gate.

## 2. Commands and output

### 2.1 Full studio suite, single run (19:28:33)

```
$ npx vitest run tests/unit/studio
 ❯ tests/unit/studio/datum-conformance/structure-a.test.ts (42 tests | 42 failed) 174ms
 ❯ tests/unit/studio/datum-conformance/language.test.ts (38 tests | 37 failed) 128ms
 ❯ tests/unit/studio/datum-conformance/structure-b.test.ts (9 tests | 9 failed) 57ms
 Test Files  3 failed | 244 passed (247)
      Tests  88 failed | 4474 passed (4562)
   Start at  19:28:33
   Duration  295.65s
EXIT=1
```

Failure count per file (from the `FAIL` lines): language.test.ts 37, structure-a.test.ts 42, structure-b.test.ts 9. No failure was outside `tests/unit/studio/datum-conformance/`.

### 2.2 Studio suite, Phase 0 scope (19:36:23)

```
$ npx vitest run tests/unit/studio --exclude 'tests/unit/studio/datum-conformance/**'
 Test Files  239 passed (239)
      Tests  4418 passed (4418)
   Start at  19:36:23
   Duration  271.70s
EXIT=0
```

There are 239 files here, against 247 - 9 = 238 in run 2.1. The extra file is `tests/unit/studio/seed/s26-doc-type-template-specs.test.ts` or `s27-doc-type-seed.test.ts`, which the concurrent S26/S27 agent added during the run. Both passed.

### 2.3 datum-conformance alone (after 2.2)

```
$ npx vitest run tests/unit/studio/datum-conformance
 Test Files  9 passed (9)
      Tests  199 passed (199)
EXIT=0
```

### 2.4 Clean-SVG manifest (19:28:37)

```
$ npx vitest run tests/unit/studio/figures/clean-svg-manifest.test.ts
 Test Files  1 passed (1)
      Tests  4 passed (4)
EXIT=0
```

### 2.5 convert_v2 --check

```
$ npx tsx benchmark/extract/convert_v2.ts --check
SAME benchmark/manual000/doc.v2.json sha256=79290e0732be7253ac0eb6ea3774e411f8e165049908da8595f4a22331c1ee15
SAME benchmark/manual000/template.v2.json sha256=882057c5743273fed1b444a47df64a5dcbe1331a4262f3d8d290a1c1be1c6ba2
SAME benchmark/manual000/datum-manual-000.preset.json sha256=a951b149180345951355c1935e42093334f19789a583e6c7b495cd6abb18804c
{"tables":94,"tablePresets":72,"glyphRuns":42, ... (summary JSON trimmed)}
EXIT=0
```

### 2.6 ID baseline compare (output folder `C:/tmp/bl_s19`, cleared before the run)

```
$ npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root C:/Users/TRIAL/gsp-swarm-hq-v2.1 --out C:/tmp/bl_s19 --inputs C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline/inputs --compare C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline
SAME a_terbit_datum_gsp DOCX baseline 633e583f59dee6c9bbd8544e60b4cc1538de58cf91a56ea16a284ca2efe9e6af now 633e583f59dee6c9bbd8544e60b4cc1538de58cf91a56ea16a284ca2efe9e6af
SAME a_terbit_datum_gsp HTML baseline 8fff270959d453895ea710c5ff2a23175c1ea2545e56c05d6959327a6a6ca06d now 8fff270959d453895ea710c5ff2a23175c1ea2545e56c05d6959327a6a6ca06d
SAME b_nota_datum_gsp DOCX baseline 5aeac7ccd1399fd38d8ba02c15b2db1dedc41ba7f79d1ef389ab9c53458c38dd now 5aeac7ccd1399fd38d8ba02c15b2db1dedc41ba7f79d1ef389ab9c53458c38dd
SAME b_nota_datum_gsp HTML baseline 50c46a6f6f1aa2c91fd8097db2dd083f31ded46e0edbb260e12d669d97048381 now 50c46a6f6f1aa2c91fd8097db2dd083f31ded46e0edbb260e12d669d97048381
SAME a_terbit_datum_kanonik DOCX baseline bbbfe86e278178e7dc46b108d0fa6f639c1a2b760514825346a8577fbbb171c3 now bbbfe86e278178e7dc46b108d0fa6f639c1a2b760514825346a8577fbbb171c3
SAME a_terbit_datum_kanonik HTML baseline 41c4a373cff853f8422f854efdf74ee1d70ab89f2369ab4b479f0c546c67afa2 now 41c4a373cff853f8422f854efdf74ee1d70ab89f2369ab4b479f0c546c67afa2
SAME b_nota_datum_kanonik DOCX baseline 3146b14cba5aeea578b8389353f24fc4d68720fb961c573925d93b9ecb0a2d85 now 3146b14cba5aeea578b8389353f24fc4d68720fb961c573925d93b9ecb0a2d85
SAME b_nota_datum_kanonik HTML baseline 030e1cda33e3736643fc2ac6f264280daeb9790fdf31496dd1303d2c0e21b288 now 030e1cda33e3736643fc2ac6f264280daeb9790fdf31496dd1303d2c0e21b288
compare: 8/8 SAME
EXIT=0
```

Each of the 8 hashes also appears exactly once in `verification/19_id_baseline_hashes.md` (`grep -c <hash>` = 1 for all 8).

### 2.7 tsc

```
$ npx tsc --noEmit -p .        # 19:29 and again 19:41
(no output)
TSC_EXIT=0
```

### 2.8 eslint

File list = `git diff --name-only HEAD` (.ts/.tsx) plus untracked .ts under src/, scripts/, prisma/, tests/ and benchmark/.

```
$ npx eslint <49 Phase 0 files>                       -> no output, EXIT_P0=0
$ npx eslint <30 in-flux datum-conformance files>     -> no output, EXIT_FLUX=0
$ npx eslint <82 files, re-run 19:41 incl. S26/S27>   -> no output, ESLINT_EXIT=0
```

Phase 0 files covered: `prisma/seed-studio.ts`, `prisma/seed-studio-templates.ts`, `scripts/studio/mcp/write-client{,-run}.ts`, `write-meta.ts`, `src/app/api/studio/validate/{route,_shared/preview-v2}.ts`, the 30 `src/lib/studio/**` files in `git status`, `benchmark/datum_conformance/baseline/render_id_samples.ts`, and the 14 new or changed Phase 0 test files. The 19:41 re-run also covered `prisma/seed-doc-type-templates.ts` and the S26/S27 tests.

## 3. In-flux datum-conformance failures (not counted against Phase 0)

During run 2.1, other agents were writing `benchmark/datum_conformance/rules/*.ts`: `structure_a.ts` (19:31:38), `language.ts` (19:35:21), `expect_language.ts` (19:35:36) and `expect_structure_b.ts` (19:31:33). The test files under `tests/unit/studio/datum-conformance/` were also changing.

| File | Failed in 2.1 | Main error messages (count) | Status in 2.3 |
|---|---|---|---|
| `tests/unit/studio/datum-conformance/structure-a.test.ts` | 42/42 | `Error: aturan CV-01/CV-02/CV-07/CV-08/CV-13/TR-01/TR-02 tidak ada di modul structure_a` (rule not yet present) | passed |
| `tests/unit/studio/datum-conformance/language.test.ts` | 37/38 | `expected 'not_implemented' to be 'fail'` (17), `expected 'unexercised' to be 'fail'` (17) | passed |
| `tests/unit/studio/datum-conformance/structure-b.test.ts` | 9/9 | catalog/rule set not yet complete (`expected [ …(32) ] to deeply equal []`) | passed |

These failures came from rules that were half-written at the time. None of them touches Phase 0 production code. The datum-conformance folder passed in full (199/199) once those writes finished.

## 4. Concurrency note

S26/S27 runs in the same wave (W7), and it changed `prisma/seed-studio.ts` (19:39:14) and `prisma/seed-studio-templates.ts` (19:38:55). It also added `prisma/seed-doc-type-templates.ts` and two seed tests during this gate. No file under `src/` or `scripts/` changed after 19:29, so the render-path checks (manifest, convert_v2, ID baseline) still hold for the final tree. tsc, eslint and the slug grep were re-run at 19:41 on the tree that included the S26/S27 changes, and the results did not change.

## 5. Slug/type branching grep (D-595, D-590)

Method: `git diff HEAD -U0 -- src scripts prisma`, plus `git diff --no-index` for each untracked .ts file under those folders. The added lines were extracted with file:line (1550 added lines in the final run). They were then searched for `slug`, `"datum-`, `typeCode`, `laporan-kerja-agen`, `contractKind`, `docType`, `=== "..."`, `case "`, `startsWith(`, `.includes("` and `.has(`.

### 5.1 Hits on slug / document type

| File:line (current tree) | Added text (short) | Class | Notes |
|---|---|---|---|
| `scripts/studio/mcp/write-client-run.ts:30` | `export const DEFAULT_CLIENT_TEMPLATE_SLUG = "datum-gsp"` | data constant | The allowed D-590 exception |
| `scripts/studio/mcp/write-client-run.ts:34` | `template === "latest" ? DEFAULT_CLIENT_TEMPLATE_SLUG : template` | use of the D-590 constant | Compares the input token `latest` with the alias, not with a template slug. It replaces the removed heuristic at HEAD `write-client-run.ts:29` (`t.slug.startsWith("datum-") ... updatedAt`) |
| `scripts/studio/mcp/write-client-run.ts:38` | `CONTRACT_TEMPLATE_SLUGS = new Set(CONTRACT_KIND_DEFS.map((d) => d.templateSlug))` | data (registry-derived) | |
| `scripts/studio/mcp/write-client-run.ts:259` | `if (CONTRACT_TEMPLATE_SLUGS.has(template)) throw ...` | replaced an old branch (not new) | Replaces HEAD `write-client-run.ts:204` `if (template === "laporan-kerja-agen")`. The set is built from the C58 registry, with no hard-coded slug. Flagged for S38 to confirm |
| `scripts/studio/mcp/write-client-run.ts:52,54,60,87,89,298-307,351-357` | `templateShape(ctx, slug, ...)`, `omittedWarning(..., slug, tier)` | data flow (slug passed as an argument or route id) | No comparison |
| `prisma/seed-studio-templates.ts:172` | `p.contractKind !== undefined && (t.contractKind ?? null) !== p.contractKind` | integrity guard, moved | Moved from HEAD `seed-studio.ts` (`p.contractKind !== undefined && t.contractKind !== p.contractKind`), now null-safe. Compares stored data with expected data, not with a literal type |
| `prisma/seed-studio-templates.ts:236` | `(i.template.contractKind ?? null) !== (i.contractKind ?? null)` | integrity guard, moved/generalised | Generalises HEAD `t.contractKind === spec.kind` |
| `prisma/seed-studio-templates.ts:264` | `const ch06 = contractRecordSkeletonIssues(plan.slots, spec.contractKind)` | no branch | S27 removed the earlier `spec.contractKind !== null ? ... : []` ternary, so CH-06 now runs for every spec |
| `prisma/seed-studio-templates.ts:406-407` | slug-keyed before/after snapshot diff | data, moved verbatim | From HEAD `seed-studio.ts` |
| `prisma/seed-doc-type-templates.ts:23` | `DOC_TYPE_PRESET_SLUG = "datum-gsp-preset"` | data constant | S27 spec table (out of S19 scope, recorded for S38) |
| `prisma/seed-doc-type-templates.ts:62-66,82,89` | spec rows `{ slugBase: "datum-...", typeCode: "PT" ... }`, `slugSuffix` | data (one spec table, RQ-8) | The only comparison in the file is `slotKey === extra.insertBefore` (:110), which is a slot key, not a slug or type |
| `src/lib/studio/engine/bind/register.ts:11`, `prisma/seed-studio-templates.ts:6-7`, `prisma/seed-studio.ts` header | comments that mention "slug/jenis" | comment | |

Removed slug branches (net improvement): HEAD `scripts/studio/mcp/write-client-run.ts:29` `startsWith("datum-")` and HEAD `:204` `=== "laporan-kerja-agen"`. HEAD `:249` `template === "latest"` (TEMPLATE_RESOLVED warning, now `:322`) existed before this round and is not new.

**New slug/type branches: 0.**

### 5.2 Other literal comparisons in the added lines (informational, for S38)

About 20 added lines compare a language value, for example `meta.language === "EN" ? "EN" : "ID"` (`front/texts.ts:58`, `bind/format.ts:63`, `docx/package/header-footer.ts:91,267`, `html/base/markup.ts:145`, `write-client.ts:158`). Others take an ID shortcut, such as `if (lang === "ID") return ...` (`front/texts.ts:374,384,399`, `docx/tables/render.ts:281,285,395`, `html/tables/apparatus.ts:27`, `html/blocks/device.ts:151`, `html/tables/derivation.ts:134`, `docx/figures/figure.ts:177`). These branch on the document's language, not on its slug or type. D-595 sends language differences through a language-keyed text table, which these sites read. The ID shortcuts keep the ID bytes unchanged (check 4). There are also structural comparisons (`unit.kind === "appendix"`, `knob.scope !== scope`), which are not on type.

## 6. Integration suite (`gsp_agent_hq_v21_uji`)

Safety review before running:
- `tests/integration/studio/_env.ts:15-23`: `ujiActive()` is true only when `STUDIO_IT_DB` and the DATABASE_URL path are both `gsp_agent_hq_v21_uji`. Otherwise the suite skips.
- `uji-run.mjs`: the source DB must be in `{gsp_agent_hq_v21, gsp_agent_hq_v21_uji}`. The DB name is rewritten to `_uji` only in the child environment. Output is redacted.
- `v21-legacy-templates.mjs`: opens v21 READ ONLY (SELECT only) and writes only to `_uji`.
- `seed-studio.ts:141`: `ALLOWED_DATABASES` contains no production DB.
- `tests/integration/studio/out/` is gitignored (`.gitignore:75`).
- No row in the blueprint or `file_claims.md` gives `_uji` to another agent in W7 (S28 owns it in a later wave).

DATABASE_URL was never printed.

```
$ node tests/integration/studio/uji-run.mjs whoami
current_database() = gsp_agent_hq_v21_uji
$ node tests/integration/studio/uji-run.mjs suite        # reset _uji, then vitest tests/integration/studio
 FAIL ... > F0 penjaga DB dan migrasi > koneksi Prisma uji = gsp_agent_hq_v21_uji; 7 migrasi selesai; tabel struktur ada
AssertionError: expected [ …(8) ] to have a length of 7 but got 8
 ❯ tests/integration/studio/studio-db.integration.test.ts:176:19
 FAIL ... > F2 seed preset + kerangka (nilai efektif sama) > verifikasi independen: proyeksi resolvedParams versi baru ke kunci versi lama = versi lama (di luar Δ)
AssertionError: expected [ 'render.rail.renderer' ] to deeply equal []
 ❯ tests/integration/studio/studio-db.integration.test.ts:349:36
 Test Files  1 failed (1)
      Tests  2 failed | 23 passed | 1 skipped (26)
   Duration  132.69s
EXIT=1
```

### 6.1 Failure analysis and minimal reproductions

| # | Failure | Minimal reproduction | Cause | Phase 0? |
|---|---|---|---|---|
| I-1 | `studio-db.integration.test.ts:176` `expect(mig).toHaveLength(7)` | `ls prisma/migrations` lists 8 folders. The 8th is `20261030220000_add_studio_contract`, added in commit `2a6f78e`/`c2620b3` (2026-10-30), which is already in HEAD. `git status --short prisma/migrations` is empty | Out-of-date test pin. The last green suite log (`tests/integration/studio/out/00_suite_run.log`, 2026-10-23, 25 passed) predates that migration | No. `prisma/migrations` is untouched in the working tree |
| I-2 | `studio-db.integration.test.ts:349` `gsp.diffOutsideDelta` = `['render.rail.renderer']` | `git log -G'render\.rail\.renderer' -- src/lib/studio/params` shows the last change in `9c35679` (2026-11-01), already in HEAD. In the Phase 0 diff, `src/lib/studio/params` contains only `governance-language.ts` (+NDA, 2 insertions/1 deletion), and no added or removed line contains `render.rail` | The datum-gsp projection guard was not updated after the R-12 renderer parameter change of 2026-11-01. This is an inference: I did not re-run the suite at HEAD, because stash or checkout would disturb the shared working tree | No (inferred, strongly supported) |

These are test-pin or guard updates for earlier commits. Neither is a product regression from S06-S18. Both test files belong to earlier rows, so the controller should route the fix to a separate row (for example the SR-49 harness owner). S28 depends on this harness.

## 7. Known limitations

- Runs 2.1 and 2.2/2.3 are consecutive, not one combined green run. Together they cover the same 248 test files.
- I-2 being pre-existing is inferred from git history and the diff scope. It was not proven with a run at HEAD.
- The slug grep is lexical. It catches literal comparisons and set membership on slug or type. An indirect branch through a renamed variable would be missed; S38 does the semantic review.

## 8. Recommendations

1. Controller: open a small row to refresh the two SR-49 integration pins (I-1 migration count 7 -> 8; I-2 add `render.rail.renderer` to the datum-gsp delta, or rebaseline). Do this before S28, which runs fresh-seed on the same harness.
2. S38: confirm the `CONTRACT_TEMPLATE_SLUGS.has(template)` replacement at `write-client-run.ts:259`. It is registry-derived, not new, but it is still a guard keyed on slug.
3. Re-run check 1 (full suite in one run) once W7 writers are idle, to get a single combined record before S29/S33/S34 rely on this gate.

## Check 7 follow-up

Date 2026-11-04, 19:43-19:50 (+0700). Agent: test-expert. The only file edited was `tests/integration/studio/studio-db.integration.test.ts` (+6/-3). No production code was changed. `uji-run.mjs` and `prisma/seed*.ts` were not touched. Nothing was committed.

### I-1: migration count 7 -> 8 (stale pin, refreshed)

- `git log --oneline -- prisma/migrations` shows `2a6f78e feat(studio): agent work report contracts (JSON document contract, stage 1)` as the newest migration commit. Its message names "Migration 20261030220000_add_studio_contract (additive)". The commit date is 2026-10-30 20:02 +0700.
- `git merge-base --is-ancestor 2a6f78e HEAD` returns true, so the commit is in HEAD. `git status --short prisma/migrations` is empty. The SQL header says DC-04, additive only, and gives its rollback script (`prisma/rollback/03_rollback_studio_contract_delta.sql`).
- Edit: the test title now says "8 migrasi". Line 177 is now `expect(mig).toHaveLength(8)`, with a comment that cites 2a6f78e.

### I-2: datum-gsp `render.rail.renderer` (intended change, pin refreshed)

- Observed value from the previous run's `out/evidence.json`: `render.rail.renderer` was `table3col` in old v1 (the v21 legacy copy) and is `framePr` in the new seeded version.
- The suspected commit `9c35679` (2026-11-01) is NOT the cause. Its diff to `src/lib/studio/params/render.ts` changes only the label ("Perender rel bukti" -> "Perender kolom catatan bukti"). The registry default stays `"framePr"` and the enum stays `["framePr","table3col"]`.
- The actual source is commit `c2620b3` (2026-10-30 17:59, "datum-gsp v3 rail K2 ..."), which is in HEAD. In `prisma/seed-studio.ts` it adds `RAIL_RENDERER_KEY = "render.rail.renderer"` and adds `[RAIL_RENDERER_KEY]: "framePr"` to the `datum-gsp-preset` `decided` map. It also adds an explicit `delta` entry: "D-327 (FIX-H4 C4, Hermes): ... HS rev B / G-RAIL rev B = chip rel w:framePr; baseline v1 table3col warisan profil Manual 000 ... Manual 000 tetap table3col". The seed's own §8.2 guard comment was updated to list `render.rail.renderer` as a justified GSP delta outside the baseline.
- Decision record: `decisions.md` D-327 (2026-10-30) at HEAD says "PUTUSAN controller (opsi a): templat GSP mengikuti HS rev B ... `render.rail.renderer: "framePr"`; Manual 000 TETAP `table3col`".
- The working-tree seed (being edited by another agent) still carries this decided value and delta entry (`seed-studio.ts:506,560,570`). The working-tree diff does not touch those lines.
- Verdict: intended. This is a deliberate preset value change, made by decision and recorded in the seed's own delta list, and the integration pin missed it. It is not a regression. Edit: `deltaBySlug['datum-gsp']` now lists `['device.registerBlock.boldFields', 'render.rail.renderer']`, with a comment that cites D-327 and c2620b3. The other datum-gsp assertions are unchanged (`missing` = [], projection sha new == old).
- Correction to §6.1 I-2: the change came from c2620b3 (seed preset, D-327), not from the 9c35679 param change. 9c35679 only renamed the label.

### Run (DB `gsp_agent_hq_v21_uji`)

Before running, I checked that no other uji-run, vitest or seed node process was active. DATABASE_URL was never printed, and the log contains 0 URL matches.

```
$ node tests/integration/studio/uji-run.mjs whoami
current_database() = gsp_agent_hq_v21_uji
$ node tests/integration/studio/uji-run.mjs suite        # 19:46:11 -> 19:48:12
8 migrations found in prisma/migrations
{"copiedTo":"gsp_agent_hq_v21_uji","templates":3,"versions":8}
 Test Files  1 passed (1)
      Tests  25 passed | 1 skipped (26)
   Duration  115.84s
EXIT=0
$ npx eslint tests/integration/studio/studio-db.integration.test.ts
ESLINT_EXIT=0
```

Fresh `out/evidence.json`: `database = gsp_agent_hq_v21_uji`, 8 migrations, the last is `20261030220000_add_studio_contract:applied`. For datum-gsp, `diffOutsideDelta = []` and `projectedOutsideDelta.old == new` (`8f4423d5...d433`). The 1 skip is by design: it is the `describe.skipIf(ACTIVE)` placeholder at `studio-db.integration.test.ts:914`, which runs only when the DB is not active.

Check 7 status: PASS (25 passed, 1 skipped, 0 failed).
