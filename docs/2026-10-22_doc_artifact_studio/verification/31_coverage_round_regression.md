---
task_slug: doc_artifact_studio
row: C29 (structured DATUM coverage round, regression gate after all engine, seed, scorer and UI rows)
date: 2026-11-05
agent: test-expert
source_plan: docs/2026-10-22_doc_artifact_studio/identification/03_structured_datum_coverage_round.md (row C29, line 207; AC-C1 line 131; AC-C4 line 134; U4 / D-595 line 25)
skills_loaded: tdd
status: complete
---

# C29: Coverage round regression gate

Repo `C:\Users\TRIAL\gsp-swarm-hq-v2.1`, branch v2.1, HEAD `8c7c803`. All coverage-round and UI work is uncommitted in the working tree: 58 tracked files changed plus 26 untracked .ts/.tsx files (84 .ts/.tsx in total). Every command below was run fresh on 2026-11-05, roughly between 12:45 and 13:00 (+0700). No production code was edited, nothing was committed, no port was opened, and no secret was printed. The only DB writes went to `gsp_agent_hq_v21_uji` (check 8). The DEV seed runs were dry-runs that rolled back their transactions.

No new tests were written in this row, because C29 is a gate run only. So the seam-agreement step from the `tdd` skill does not apply.

## 1. Verdict table

| # | Check | Command | Result | Verdict |
|---|---|---|---|---|
| 1 | Full studio suite | `npx vitest run tests/unit/studio` | 279/279 files, 5046/5046 tests passed, exit 0 (335 s) | PASS |
| 1b | Param category mapping (part of 1, run alone as evidence for the C05/C06 mapping rule) | `npx vitest run tests/unit/studio/ui-categories` | 5/5 files, 52/52 tests, exit 0 | PASS |
| 2 | Clean-SVG manifest | `npx vitest run tests/unit/studio/figures/clean-svg-manifest.test.ts` | 1 file, 4/4 tests, exit 0 | PASS |
| 3 | Manual 000 conversion | `npx tsx benchmark/extract/convert_v2.ts --check` | `SAME` x3, exit 0 | PASS |
| 4 | ID byte baseline (R1, D-631) | `npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root ... --out C:/tmp/bl_c29 --inputs ... --compare ...` | `compare: 8/8 SAME`; exactly 4 `INFO compose snapshot` lines (the 4 cases); exit 0 | PASS |
| 5a | Typecheck | `npx tsc --noEmit -p .` (incremental), then `npx tsc --noEmit -p . --incremental false` | 0 lines of output, exit 0 both times (6 s, then 22 s for the full run) | PASS |
| 5b | Lint of every changed and untracked .ts/.tsx | `npx eslint --max-warnings 0 <84 files>` | 0 lines of output, exit 0 | PASS |
| 6 | 0 new slug/type branches (U4, D-595, AC-C4) | diff grep, see §3 | 0 new branches on template slug or document type | PASS |
| 7a | Seed dry-run: presets and skeletons, DEV | `npx tsx prisma/seed-studio.ts --presets-and-skeletons --dry-run` | DB `gsp_agent_hq_v21`; guard `ok: true` for datum-kanonik and datum-gsp; all 4 outcomes `unchanged`; rolled back; exit 0 | PASS |
| 7b | Seed dry-run: contract templates, DEV | `npx tsx prisma/seed-studio.ts --contract-templates --dry-run` | guard `ok: true`, `changedTemplates: []`, `addedTemplates: []`; `laporan-kerja-agen` `unchanged` v1; "0 tulis"; exit 0 | PASS |
| 7c | Seed dry-run: doc-type templates, DEV | `npx tsx prisma/seed-studio.ts --doc-type-templates --dry-run` | guard `ok: true`, `changedTemplates: []`, `addedTemplates: []`, `sectionTypesTouched: []`; the 10 templates `unchanged` v3; `datum-gsp-rev-a-preset` `unchanged` v1 (base `datum-gsp-preset` v2); "0 tulis"; exit 0 | PASS |
| 8 | Integration suite on `_uji` | `node tests/integration/studio/uji-run.mjs whoami`, then `... suite` | `current_database() = gsp_agent_hq_v21_uji`; 1 file, 25 passed, 1 skipped (the inverse `skipIf(ACTIVE)` placeholder at `tests/integration/studio/studio-db.integration.test.ts:914`), exit 0 | PASS |
| 9a | Scorer suite | `npx vitest run tests/unit/studio/datum-conformance` | 12/12 files, 245/245 tests, exit 0 | PASS |
| 9b | Clash pytest | `.../hermes-agent/venv/Scripts/python.exe -I -B -m pytest -p no:cacheprovider benchmark/datum_conformance/clash/tests` | 44 passed in 10.33 s, exit 0 | PASS |

**Overall: PASS.** All 9 checks pass. AC-C1 (8/8 SAME, SAME x3) and AC-C4 (0 new slug/type branches) hold at C29.

Not run, as instructed: `--import-manual000-v2` (it already failed at HEAD, D-631), and `tests/unit/agent-roster.test.ts` (it is outside `tests/unit/studio`, and D-644/D-645 track it separately). `src/lib/agent-roster.ts` and that test do show in the diff, but they are not coverage-round files.

## 2. Commands and outputs

The raw logs are in `C:/Users/TRIAL/AppData/Local/Temp/claude/c29/` (`01_studio.txt` to `09b_pytest.txt`). Trimmed copies follow.

### 2.1 Check 1: full studio suite

```
$ npx vitest run tests/unit/studio
 RUN  v4.1.11 C:/Users/TRIAL/gsp-swarm-hq-v2.1
 Test Files  279 passed (279)
      Tests  5046 passed (5046)
   Start at  12:53:06
   Duration  335.31s (transform 8.07s, setup 0ms, import 120.24s, tests 178.03s, environment 18ms)
EXIT=0
```

The suite has 279 test files under `tests/unit/studio`, counted with `find tests/unit/studio -name "*.test.ts" -o -name "*.test.tsx" | wc -l` = 279. So every file ran. The untracked coverage-round test files are among them: `tests/unit/studio/{compose/c10-*,compose/c15-c27-*,registry/c06-*,render/c18-*,renderers/c08-c12-*,c10-c15-c27-*,c12-*,c17-*,c22-*,c22b-*,engine-c-*,engine-e-*,rh03-*,seed/c21-*,ui-categories/*}`.

```
$ npx vitest run tests/unit/studio/ui-categories
 Test Files  5 passed (5)
      Tests  52 passed (52)
```

### 2.2 Check 2: clean-SVG manifest

```
$ npx vitest run tests/unit/studio/figures/clean-svg-manifest.test.ts
 Test Files  1 passed (1)
      Tests  4 passed (4)
   Duration  2.74s
EXIT=0
```

### 2.3 Check 3: convert_v2 --check

```
$ npx tsx benchmark/extract/convert_v2.ts --check
SAME benchmark/manual000/doc.v2.json sha256=79290e0732be7253ac0eb6ea3774e411f8e165049908da8595f4a22331c1ee15
SAME benchmark/manual000/template.v2.json sha256=882057c5743273fed1b444a47df64a5dcbe1331a4262f3d8d290a1c1be1c6ba2
SAME benchmark/manual000/datum-manual-000.preset.json sha256=a951b149180345951355c1935e42093334f19789a583e6c7b495cd6abb18804c
{"tables":94,"tablePresets":72,"glyphRuns":42, ... "chartAxis":{...,"absent":["S-01"]}}
EXIT=0
```

### 2.4 Check 4: ID baseline compare

```
$ npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root C:/Users/TRIAL/gsp-swarm-hq-v2.1 --out C:/tmp/bl_c29 --inputs C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline/inputs --compare C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline
SAME a_terbit_datum_gsp DOCX baseline 633e583f59dee6c9bbd8544e60b4cc1538de58cf91a56ea16a284ca2efe9e6af now 633e583f59dee6c9bbd8544e60b4cc1538de58cf91a56ea16a284ca2efe9e6af
SAME a_terbit_datum_gsp HTML baseline 8fff270959d453895ea710c5ff2a23175c1ea2545e56c05d6959327a6a6ca06d now 8fff270959d453895ea710c5ff2a23175c1ea2545e56c05d6959327a6a6ca06d
SAME b_nota_datum_gsp DOCX baseline 5aeac7ccd1399fd38d8ba02c15b2db1dedc41ba7f79d1ef389ab9c53458c38dd now 5aeac7ccd1399fd38d8ba02c15b2db1dedc41ba7f79d1ef389ab9c53458c38dd
SAME b_nota_datum_gsp HTML baseline 50c46a6f6f1aa2c91fd8097db2dd083f31ded46e0edbb260e12d669d97048381 now 50c46a6f6f1aa2c91fd8097db2dd083f31ded46e0edbb260e12d669d97048381
SAME a_terbit_datum_kanonik DOCX baseline bbbfe86e278178e7dc46b108d0fa6f639c1a2b760514825346a8577fbbb171c3 now bbbfe86e278178e7dc46b108d0fa6f639c1a2b760514825346a8577fbbb171c3
SAME a_terbit_datum_kanonik HTML baseline 41c4a373cff853f8422f854efdf74ee1d70ab89f2369ab4b479f0c546c67afa2 now 41c4a373cff853f8422f854efdf74ee1d70ab89f2369ab4b479f0c546c67afa2
SAME b_nota_datum_kanonik DOCX baseline 3146b14cba5aeea578b8389353f24fc4d68720fb961c573925d93b9ecb0a2d85 now 3146b14cba5aeea578b8389353f24fc4d68720fb961c573925d93b9ecb0a2d85
SAME b_nota_datum_kanonik HTML baseline 030e1cda33e3736643fc2ac6f264280daeb9790fdf31496dd1303d2c0e21b288 now 030e1cda33e3736643fc2ac6f264280daeb9790fdf31496dd1303d2c0e21b288
INFO compose snapshot a_terbit_datum_gsp baseline 7d34d7ccb77a448a0d7e798c4c4bc4c5db7ea91520e8c347becb5d43c862bf2b now c85bc73d269b16e3f0c4f3e7490d71b66819ca819eda1fb45bdc0a8b6bf2eb87
INFO compose snapshot b_nota_datum_gsp baseline cade0fd5e8fef990f2e98e7224befd797b05704e4fca31a0857911dba0e465a8 now fe66034feffe2787243db8fc2cd31595f2e374b42622ed5556daaffc1ba3dcbe
INFO compose snapshot a_terbit_datum_kanonik baseline 04287bf80df3f1d6dce0e67572387505f7fadd9fe4bc41c884a0ff48d87ad37f now d3d863129ce29bff6e5fe444272798fcb45302418daeed14553dca8991227f7f
INFO compose snapshot b_nota_datum_kanonik baseline 5c0b2c6cfbbfc240b52d136fdd89bc02cc0580d7d16c6fce51d6a1aa1d24c45f now cc7b511814997fa6856579425966ec1514261b59b89ed74842957f9b38cf0628
compare: 8/8 SAME
EXIT=0
```

The full 64-character hashes are in `04_baseline.txt` and in `C:/tmp/bl_c29/hashes.sha256`. There are exactly 4 `INFO compose snapshot` lines, one per case, as R1/D-631 expects: the snapshot JSON may move, but the rendered bytes may not.

### 2.5 Check 5: tsc and eslint

```
$ npx tsc --noEmit -p .
EXIT=0                      (0 lines of output, 6.1 s, incremental via tsconfig.tsbuildinfo)
$ npx tsc --noEmit -p . --incremental false
EXIT=0                      (0 lines of output, 22.5 s, full non-incremental check)
```

The first run uses `"incremental": true` (tsconfig.json:19), so I ran it a second time with the incremental cache turned off. That rules out a stale-cache pass.

```
$ { git diff HEAD --name-only --diff-filter=ACMR; git ls-files --others --exclude-standard; } | grep -E '\.(ts|tsx)$' | sort -u   -> 84 files (58 tracked + 26 untracked)
$ npx eslint --max-warnings 0 $(cat lint_files.txt)
EXIT=0                      (0 lines of output)
```

`--max-warnings 0` would also fail on a "File ignored" warning, so all 84 files were really linted, `benchmark/datum_conformance/rules/*.ts` included. The file list is in `C:/Users/TRIAL/AppData/Local/Temp/claude/c29/lint_files.txt`.

### 2.6 Check 7: seed dry-runs on DEV `gsp_agent_hq_v21`

All three runs logged `"database":"gsp_agent_hq_v21"` and `"dryRun":true`, and all exited 0. Each run also printed one `warn`, "Profil kanonik berkerangka berbeda dari registri saat ini; sinkron otomatis dihentikan" (`canonical.outcome: preset-managed`, v6, `registryInSync: false`). That is the existing preset-managed state of datum-kanonik, not a write.

```
--presets-and-skeletons --dry-run
  Preset + kerangka datum-kanonik  guard.ok=true  projectedExactMatch=true  delta=[]  diffOutsideDelta=[]  newKeysNonDefault=[]
     preset datum-kanonik-preset unchanged v1 ; template unchanged v6
  Preset + kerangka datum-gsp      guard.ok=true  delta: 4 entries, all matchesDecision=true (D-151/D-165/D-162/D-327, against legacy v1)
     deltaValueMismatch=[]  diffOutsideDelta=[]  newFullParamsSha256=21f4e1e7... (= DB datum-gsp v3 paramsSha256)
     preset datum-gsp-preset unchanged v2 ; template unchanged v3
  "Dry-run preset/kerangka selesai; transaksi di-rollback"
--contract-templates --dry-run
  guard {ok:true, targets:[laporan-kerja-agen], otherTemplates:17, changedTemplates:[], addedTemplates:[], sectionTypesTouched:[]}
  laporan-kerja-agen unchanged v1 (agentWorkReport); sectionTypes 52 unchanged
  "Dry-run templat jenis kontrak selesai; transaksi di-rollback (0 tulis)"
--doc-type-templates --dry-run
  guard {ok:true, targets:[datum-gsp-rev-a-preset + 10 templates], otherTemplates:7, changedTemplates:[], addedTemplates:[], sectionTypesTouched:[]}
  presets: datum-gsp-rev-a-preset unchanged v1 (base datum-gsp-preset v2)
  templates: datum-proposal-teknis(-en), datum-laporan(-en), datum-laporan-verifikasi(-en), datum-standar(-en), datum-nota(-en): all unchanged v3
  counts {sectionTypes:52, docTypeTemplates:10, templates:18, derivedPresets:1, guardOk:true}
  "Dry-run templat jenis dokumen selesai; transaksi di-rollback (0 tulis)"
DB counts (all three runs identical): datum-gsp@v3, datum-gsp-preset@v2, datum-gsp-rev-a-preset@v1, datum-kanonik@v6,
  datum-kanonik-preset@v1, datum-laporan(-en)@v3, datum-laporan-verifikasi(-en)@v3, datum-manual-000@v4,
  datum-manual-000-preset@v2, datum-nota(-en)@v3, datum-proposal-teknis(-en)@v3, datum-standar(-en)@v3, laporan-kerja-agen@v1
```

`--import-manual000-v2` was not run (D-631).

### 2.7 Check 8: `_uji` integration suite

```
$ node tests/integration/studio/uji-run.mjs whoami
current_database() = gsp_agent_hq_v21_uji
$ node tests/integration/studio/uji-run.mjs suite
Datasource "db": PostgreSQL database "gsp_agent_hq_v21_uji", schema "public" at "localhost:5433"
All migrations have been successfully applied.  /  Database schema is up to date!
{"source":"gsp_agent_hq_v21","readOnly":true,"templates":[datum-gsp v1, datum-kanonik v1-v5, datum-manual-000 v1-v2]}
{"copiedTo":"gsp_agent_hq_v21_uji","templates":3,"versions":8}
 Test Files  1 passed (1)
      Tests  25 passed | 1 skipped (26)
   Duration  136.38s
EXIT=0
```

DEV was read-only (`readOnly: true`). The writes went to `_uji` only. The 1 skipped test is the `describe.skipIf(ACTIVE)` placeholder block, which is skipped by design whenever the uji DB is active.

### 2.8 Check 9: scorer and clash

```
$ npx vitest run tests/unit/studio/datum-conformance
 Test Files  12 passed (12)
      Tests  245 passed (245)
EXIT=0
$ C:/Users/TRIAL/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe -I -B -m pytest -p no:cacheprovider benchmark/datum_conformance/clash/tests
collected 44 items
benchmark\datum_conformance\clash\tests\test_clash.py ............................................ [100%]
============================= 44 passed in 10.33s =============================
EXIT=0
```

## 3. Check 6: slug/type branching grep (U4)

Scope: `git diff HEAD -- src scripts prisma` (3688 diff lines) plus the 6 untracked files under those paths: `prisma/seed-derived-presets.ts`, `src/components/studio/template-editor/param-categories.ts`, `src/components/studio/template-editor/param-editor-state.ts`, `src/lib/studio/engine/docx/blocks/rhythm.ts`, `src/lib/studio/engine/front/rule-index.ts` and `src/lib/studio/engine/html/assemble/back-cover.ts`.

I ran two passes. Pass A was a broad grep over added lines for `slug|docType|doc_type|documentType|typeCode|TypeCode|templateKey|DOC_TYPE|TEMPLATE_SLUG|datum-|nda|kontrak|contract-|manual-|kind ===|\.type ==|type ===`. Pass B was a narrow grep for the identifiers `(slug|typeCode|docType|templateId|defaultTier|tier|"NOT"|"STD"|"NDA"|NOTA|nota|kanonik|datum-gsp|DEFAULT_CLIENT_TEMPLATE_SLUG|CONTRACT_TEMPLATE_SLUGS|PRESET_SLUG)` on the same line as a conditional `(if (|?|===|!==|==|!=|switch|case|.includes(|.has(|.startsWith(|.endsWith(|match(|.test()`. In the untracked files, Pass B returned 0 hits.

| Hit (file, added content) | Class | Note |
|---|---|---|
| `prisma/seed-doc-type-templates.ts:33` `export const DOC_TYPE_PRESET_SLUG = "datum-gsp-rev-a-preset"` | data constant | Preset slug constant in seed data (allowed). It is only used as `presetSlug:` (line 217) and in a log message (line 223) |
| `prisma/seed-doc-type-templates.ts` spec rows `slugBase: "datum-standar"`, `typeCode: "STD"`, `tier: "TERBIT"` / `slugBase: "datum-nota"`, `typeCode: "NOT"`, `tier: "NOTA"`, `layer: { "render.nota.classificationLine": true, "naming.file.form": "judulTanggalIso" }` | data constant | Rows of the single spec table (U4, file_claims line 314). Behaviour enters through layer param values, not through code |
| `prisma/seed-doc-type-templates.ts` `layer: { ...SHARED_LAYER, ...type.layer, ...lang.layer, "doc.defaultTypeCode": type.typeCode, ... }` | data constant | Spread and merge of layers. No conditional |
| `prisma/seed-derived-presets.ts:25,28` `slug: "datum-gsp-rev-a-preset"`, `baseSlug: "datum-gsp-preset"` | data constant | Preset slug constants in seed data (allowed) |
| `prisma/seed-derived-presets.ts:50` `count({ where: { slug: { in: specs.map(...) } } })` | data query | Counts the spec-table targets. No behaviour branch |
| `prisma/seed-studio-templates.ts` `if (spec.slug === spec.baseSlug) throw ...` | generic guard | Rejects self-referencing preset specs. No slug literal, and the comparison is the same for every slug. Not a per-template branch |
| `prisma/seed-studio-templates.ts` `if (p.isPreset !== undefined && t.isPreset !== p.isPreset) throw ...`, `t.isPreset ? "preset" : "non-preset"` | generic guard | Compares the `isPreset` flag with the spec. Not a slug/type branch |
| `prisma/seed-studio-templates.ts` `if (keys.length === 0)`, `if (!def)`, `if (bad !== null)` with `${spec.slug}` in the error text | generic guard | The slug appears only in error messages |
| `prisma/seed-studio-templates.ts` `findUnique({ where: { slug: spec.baseSlug } })`, `targets = [...presetSpecs.map((s) => s.slug), ...]`, duplicate-target check | data lookup / generic guard | Lookups by spec value. The duplicate check works the same for every slug |
| `src/lib/studio/engine/docx/package/header-footer.ts` `const PARAM_CLASSIFICATION_LINE = "render.nota.classificationLine"`; `src/lib/studio/engine/html/base/shell.ts` `const P_CLASSIFICATION_LINE = "render.nota.classificationLine"`; `src/lib/studio/params/render.ts` `r(76, "render.nota.classificationLine", ..., "bool", false, ...)` | data constant | A registry param key that happens to contain "nota". The engine is gated by the param value (R-76 opt-in, default false), not by tier or type. The NOTA templates opt in through their seed layer |
| `src/lib/studio/services/compose/front.ts` comment "Tidak bercabang per tier: ..." (`revisionStatusText(latest, lang)`) | comment | The function only branches on `latest`. It has no tier argument |
| `src/components/studio/template-editor/param-editor.tsx` `<option value="K">Standar DATUM, khusus admin</option>`, "pengaturan Standar DATUM hanya dapat diubah admin" | UI copy | A param-class (B/K/T) filter label. Not a doc type |
| `src/components/studio/template-editor/param-categories.ts` `"lembar-kendali"`, `"halaman-grid"` and similar | data constant | Category ids. They only matched "nda" inside "kendali"/"tanda" |
| `docx/assemble/units.ts` `scope?.kind === "SLOT"`, `scope.kind === "DOCUMENT"`, `p.unit.kind === "cover"`; `docx/blocks/rail.ts` `WRAPPER_KINDS.has(unitKind)`; `docx/package/header-footer.ts` `u.kind === "chapter"`; `html/assemble/slots.ts` `ctx.scope?.kind === "SLOT"`; `html/blocks/text.ts` `kind === "chapter"`; `html/blocks/wrapper.ts` `type === "signatureBlock"`; `html/assemble/back-cover.ts:24,27` `scope.kind === "DOCUMENT"`, `u.kind === "cover"`; `front/rule-index.ts:165,181` `block.type === "paragraph"` / `"list"` | out of U4 scope (structural dispatch) | These branch on render-scope kind, unit kind (cover/chapter) or content block type, which are parts of every document. None of them reads a template slug or a document type code. This is the dispatch that existed before the round |
| `src/lib/agent-roster.ts` `"gsp-thinker"`, `"gsp-worker"` roster entries | n/a | Agent roster data (D-644/D-645). Not studio |

Allowed constants check: the added lines contain 0 new references to `DEFAULT_CLIENT_TEMPLATE_SLUG` or `CONTRACT_TEMPLATE_SLUGS`. `DOC_TYPE_PRESET_SLUG` and the preset slugs in `seed-derived-presets.ts` are seed-data preset constants of the allowed kind.

**Result: 0 new branches on template slug or document type.** I am handing two items to C34 (senior review) for confirmation, because they are a matter of interpretation rather than a grep result:
1. The `render.nota.*` key name ties a param to one document family by name. Its behaviour is param-driven and opt-in, so it is not a branch.
2. The generic `spec.slug === spec.baseSlug` self-reference guard.

## 4. Coverage and limitations

- This gate checks behaviour at the existing seams: the unit suites, byte baselines, conversion check, seed dry-runs and integration suite. I did not measure line coverage. No coverage tool is part of the C29 acceptance, and a separate rerun with coverage was not asked for.
- The tsc and eslint results cover the working tree at the time of the run. A later edit by another writer would need these commands run again.
- The baseline compare proves byte identity for the 4 ID cases only (2 GSP, 2 kanonik, TERBIT and NOTA). New opt-in params are covered by the new unit tests (C08-C27 files), not by the byte baseline. That is by design: the opt-ins are absent from the baseline templates.
- The seed dry-runs write info lines to `data/studio-workspace/logs/templates/` on DEV, even though the DB is rolled back. This is known behaviour from `implementation/datum_rev_a_dev_seed.md:31`.
- Side outputs of this run: `C:/tmp/bl_c29/` (baseline render) and the log directory `C:/Users/TRIAL/AppData/Local/Temp/claude/c29/`.

## 5. How to rerun

```
cd C:/Users/TRIAL/gsp-swarm-hq-v2.1
npx vitest run tests/unit/studio
npx vitest run tests/unit/studio/figures/clean-svg-manifest.test.ts
npx tsx benchmark/extract/convert_v2.ts --check
npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root C:/Users/TRIAL/gsp-swarm-hq-v2.1 --out C:/tmp/bl_c29 --inputs C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline/inputs --compare C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline
npx tsc --noEmit -p . --incremental false
npx eslint --max-warnings 0 $({ git diff HEAD --name-only --diff-filter=ACMR; git ls-files --others --exclude-standard; } | grep -E '\.(ts|tsx)$' | sort -u)
npx tsx prisma/seed-studio.ts --presets-and-skeletons --dry-run
npx tsx prisma/seed-studio.ts --contract-templates --dry-run
npx tsx prisma/seed-studio.ts --doc-type-templates --dry-run
node tests/integration/studio/uji-run.mjs whoami && node tests/integration/studio/uji-run.mjs suite
npx vitest run tests/unit/studio/datum-conformance
C:/Users/TRIAL/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe -I -B -m pytest -p no:cacheprovider benchmark/datum_conformance/clash/tests
```

CI notes: the full studio suite takes about 5.5 minutes on this host and the uji suite about 2.3 minutes. No flaky test was seen in this run. The vitest "configLoader native" warning (ESM `vitest.config.ts` loaded as CommonJS) is cosmetic and appears on every run.

## 6. Recommendations

- C30 (DEV reseed) can rely on these dry-runs: they show DEV already at the C30 target state (10 templates at v3, Rev A preset at v1), with 0 planned writes.
- C34 should confirm the two interpretation items in §3.
