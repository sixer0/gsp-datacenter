---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: C02
date: 2026-11-05
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/03_structured_datum_coverage_round.md
status: complete
---

# C02: Registry-param probe (empirical check of the C01 spike)

## 0. Verdict

**C01 is confirmed: M1 GO.** An advanced class-B param with default `false`, plus an enum-only value, leaves every byte output, every guarded seed dry-run and every stored row unchanged. Two C01 statements need a correction. Neither one changes the verdict.

| # | C01 statement | Probe result | Effect |
|---|---|---|---|
| R1 | §4.6 / C-5: "C-5 also keeps the INFO line stable" | **Refuted for the DB-less baseline.** All 4 cases print `INFO compose snapshot`. The only changed field is `skeleton.templateVersionId` (and its copy in `compose.skeleton`). In DB-less mode that ID is synthetic: `file:<paramsSha256[0:16]>:<skeletonSha[0:8]>` (`src/lib/studio/services/templates/import.ts:219`). It moves with every registry addition. `compose.params` is unchanged, so C-5 itself holds | Expected INFO, not a byte change. DOCX/HTML 8/8 SAME. In DB mode the version ID is the stored row ID, so old templates do not drift. C06/C30 gates must accept these 4 INFO lines |
| R2 | §4.3: "No test asserts it" | `registryInSync` is not asserted (true). But `tests/unit/studio/registry/s11-doc-typecode-nda.test.ts:31` pins `canonicalVersionPayload().paramsSha256` to `a18d36ea…`, the same value as the seed's `registryParamsSha256` | Every new param with a default breaks this pin, just as it breaks the count pins. C06 must update it (`01e30534…` for this dummy). Enum-only additions do not move it (proved, §5.3) |

The other predictions match: P8 holds (and it **already fails at HEAD**), P6 holds for `device.spine.placements` (no C-6 split needed), P7 holds, and C-8 holds (no new default-validation warning).

## 1. Worktree (throwaway, outside the repo)

| Step | Command | Result |
|---|---|---|
| Create | `git -c core.autocrlf=false worktree add --detach C:/Users/TRIAL/wt-c02-probe 8c7c803` | `HEAD is now at 8c7c803`. LF check: `benchmark/manual000/doc.v2.json` sha256 `79290e07…` = the S05 baseline value |
| node_modules | `cmd /c mklink /J <wt>\node_modules <main>\node_modules` | Junction, used read-only. No install |
| Assets | `cp -r <main>/data/studio-workspace/assets <wt>/data/studio-workspace/` | 81 files |
| DEV env | `cp <main>/.env <wt>/.env` (never printed; only the masked DB name was checked: `localhost:5433/gsp_agent_hq_v21`) | Seed `assertDatabase` reported `gsp_agent_hq_v21` in every run |
| Remove | `cmd /c rmdir <wt>\node_modules` (junction only), `git worktree remove --force C:/Users/TRIAL/wt-c02-probe`, `git worktree prune -v` | `git worktree list` → `C:/Users/TRIAL/gsp-swarm-hq-v2.1 8c7c803 [v2.1]` only. Folder gone. Main `node_modules` still has 505 entries before and after |

The "before" pass ran in the same worktree **before** the edits, at the same commit as the main tree's HEAD. This kept the main tree untouched while another agent edits `src/components/studio/**` there, and those UI files are not imported by any of the checks. This is a deliberate deviation from "before = main tree"; the code under test is identical.

## 2. Probe edits (worktree only; diff kept at `C:\Users\TRIAL\gsp-backups\c02-registry-probe\probe.diff`)

| File | Edit |
|---|---|
| `src/lib/studio/params/render.ts` | Appended `r(67, "render.probe.noop", "Probe no-op (C02)", "bool", false, {…})`; `PARAMS_RENDER_COUNT` 45 → 46 |
| `src/lib/studio/params/index.ts` | `RENDER_PARAM_COUNT` 45 → 46 (`ALL_PARAM_COUNT` 788 → 789; `CATALOG_PARAM_COUNT` stays 722) |
| `src/lib/studio/registry/essentials.ts` | `...ids("R-", 67)` appended to `PARAM_SURFACE_LISTS.advanced` |
| `src/lib/studio/params/page.ts:332` | `device.spine.placements` enum + `"sampul belakang"`. Default (`:328`) unchanged. Default and enum are separate literals, so no C-6 split was needed |
| Later, for §5.3 only | Pins updated: `fixtl-toc-levels-roles.test.ts` 45/788 → 46/789; `s11-doc-typecode-nda.test.ts` sha → `01e30534…` (`probe_with_pins.diff`) |

All edited files were checked LF (0 CR bytes, counted with node) before every measured run.

Properties of the dummy param, checked in the worktree (`after_param_props.json`):

| Check (C-n) | Value |
|---|---|
| C-1 surface / knobs | `advanced`; not in `ESSENTIAL_KNOBS` |
| C-2 class / derive | `B`; no `derive` |
| C-4 prefix | `render.` (not `color.`, `type.face`, `chart.kind.`) |
| C-5 compose | not in `COMPOSE_PARAM_KEYS` |
| C-8 default valid | `validateParamValue` → ok |
| C-11 id / namespace | `R-67`, namespace `render`, scope `document` |
| Spine enum | default `["margin luar sampul","pembatas"]`; enum + `sampul belakang`; `["sampul belakang"]` validates |
| Counts | `ALL_PARAMS.length` 789 = `ALL_PARAM_COUNT`; `RENDER_PARAM_COUNT` 46 |

## 3. Before/after table

| Check | Before (clean 8c7c803) | After (dummy param + enum) | Same? |
|---|---|---|---|
| Baseline `render_id_samples --compare` | `compare: 8/8 SAME`, no INFO | `compare: 8/8 SAME`, 4 × `INFO compose snapshot` (R1) | Bytes SAME |
| `convert_v2 --check` | SAME × 3 files, exit 0 | 3 runs, each SAME × 3 files, exit 0 | Yes |
| `--presets-and-skeletons --dry-run` | exit 0; datum-kanonik preset v1 / template v6 `unchanged`, guard.ok true; datum-gsp preset v2 / template v3 `unchanged`, guard.ok true; rollback | identical | Yes (only `registryParamsSha256` differs) |
| `--contract-templates --dry-run` | exit 0; laporan-kerja-agen v1 `unchanged`; guard.ok true, changed [], added [], sectionTypesTouched []; "0 tulis" | identical | Yes |
| `--doc-type-templates --dry-run` | exit 0; the 10 all `unchanged` v2, storedOk, skeleton match; guard.ok true, otherTemplates 7, changed [], added []; "0 tulis" | identical | Yes |
| `--import-manual000-v2 --dry-run` | **exit 1** (already fails); guard.ok false; drift = S-02/S-03/S-04 axis + `toc.levels`; diffOutsideDelta [`toc.levels`] | exit 1; drift + `render.probe.noop` (`fileMode false`, `registryDefault false`); diffOutsideDelta [`render.probe.noop`, `toc.levels`] | Fails both times (P8) |
| Canonical `registryInSync` | `false` (preset-managed, stored v6 sha `7abfc5f7…`) | `false` | Yes |
| Canonical `registryParamsSha256` | `a18d36eafa6bdabe9035d1a68b410c439177c33c342937a281205ed5ac517a9f` | `01e30534a3c17b809f1d6e60801646978750f5086f2b12d6376b8a7ea32b3be9` | Changes (expected, report only) |
| Section-type plan | create 0 / update 0 / unchanged 52 | same | Yes |
| Seed warnings | only the canonical-not-in-sync warning | same (no new default-validation warning, C-8) | Yes |
| DB rows (`Hitungan DB`, 17 templates: slug, versions, latest, keys, paramsSha256) | fingerprint `a72e953b128e4513` | `a72e953b128e4513` | Yes: 0 writes |
| Unit subset (pins unchanged) | 101 files / 2147 tests passed | 2 failed / 2145 passed (count pin; S11 canonical sha pin) | Expected test edits |
| Unit subset (pins updated) | n/a | 101 files / 2147 tests passed | Yes |
| `tsc --noEmit -p tsconfig.json` | n/a | exit 0 | n/a |
| `eslint` on the 4 edited files | n/a | exit 0 | n/a |

## 4. Commands and key outputs

All commands ran from `C:/Users/TRIAL/wt-c02-probe`. Full logs: `C:\Users\TRIAL\gsp-backups\c02-registry-probe\{before,after}\`.

### 4.1 Baseline compare (after)

```
npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root C:/Users/TRIAL/wt-c02-probe --out C:/tmp/c02_bl --inputs C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline/inputs --compare C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline
exit=0
SAME a_terbit_datum_gsp DOCX ... 633e583f…   SAME a_terbit_datum_gsp HTML ... 8fff2709…
SAME b_nota_datum_gsp DOCX ... 5aeac7cc…     SAME b_nota_datum_gsp HTML ... 50c46a6f…
SAME a_terbit_datum_kanonik DOCX ... bbbfe86e…  SAME a_terbit_datum_kanonik HTML ... 41c4a373…
SAME b_nota_datum_kanonik DOCX ... 3146b14c…    SAME b_nota_datum_kanonik HTML ... 030e1cda…
INFO compose snapshot a_terbit_datum_gsp baseline 7d34d7cc… now f2734b80…
INFO compose snapshot b_nota_datum_gsp baseline cade0fd5… now 493a3818…
INFO compose snapshot a_terbit_datum_kanonik baseline 04287bf8… now 97e8c479…
INFO compose snapshot b_nota_datum_kanonik baseline 5c0b2c6c… now 602f4dcb…
compare: 8/8 SAME
```

The before run (`--out C:/tmp/c02_bl_before`) printed the same 8 SAME lines and no INFO line.

### 4.2 Why the INFO lines appear (R1)

`render_report.json` per case: `template.versionId` before `file:a18d36eafa6bdabe:fe847233` (kanonik) / `file:0c4df1dd0ea6e0c1:fe847233` (gsp); after `file:01e30534a3c17b80:fe847233` / `file:999664cdb49ade29:fe847233`. The kanonik prefix equals the first 16 hex digits of `registryParamsSha256`, before and after.

To prove nothing else changed, a worktree-only, env-gated line dumped `composed.snapshot` from `scripts/parity/run/lib/render.ts` (removed and restored from git before the seed runs). `render_cli.ts` ran for `a_terbit_datum_kanonik` and `a_terbit_datum_gsp` with the frozen inputs and pid seed, before and after. A structural JSON diff (`c02_jsondiff.mjs`) shows only:

```
$.skeleton.templateVersionId          file:a18d36eafa6bdabe:fe847233 -> file:01e30534a3c17b80:fe847233
$.compose.skeleton.templateVersionId  file:a18d36eafa6bdabe:fe847233 -> file:01e30534a3c17b80:fe847233
```

(gsp: the same two paths, `0c4df1dd…` → `999664cd…`.) `compose.params`, units, blocks, numbering and register are equal. The snapshot itself is built at `src/lib/studio/services/compose/snapshot.ts:545-563`. The skeleton input carries `templateVersionId: t.versionId` (`snapshot.ts:690-692`), and `composeContextOf` stores `skeleton: input.skeleton` (`src/lib/studio/services/compose/context.ts:53`).

### 4.3 convert_v2 (after, 3 runs)

```
npx tsx benchmark/extract/convert_v2.ts --check     (run 1, 2, 3: exit 0)
SAME benchmark/manual000/doc.v2.json sha256=79290e0732be7253ac0eb6ea3774e411f8e165049908da8595f4a22331c1ee15
SAME benchmark/manual000/template.v2.json sha256=882057c5743273fed1b444a47df64a5dcbe1331a4262f3d8d290a1c1be1c6ba2
SAME benchmark/manual000/datum-manual-000.preset.json sha256=a951b149180345951355c1935e42093334f19789a583e6c7b495cd6abb18804c
```

### 4.4 Seed dry-runs (DEV `gsp_agent_hq_v21`, run one at a time)

```
npx tsx prisma/seed-studio.ts --presets-and-skeletons --dry-run   exit 0  "Dry-run preset/kerangka selesai; transaksi di-rollback"
npx tsx prisma/seed-studio.ts --contract-templates --dry-run      exit 0  "Dry-run templat jenis kontrak selesai; transaksi di-rollback (0 tulis)"
npx tsx prisma/seed-studio.ts --doc-type-templates --dry-run      exit 0  "Dry-run templat jenis dokumen selesai; transaksi di-rollback (0 tulis)"
npx tsx prisma/seed-studio.ts --import-manual000-v2 --dry-run     exit 1  "Penjaga paramsSha256 terproyeksi gagal untuk datum-manual-000; transaksi di-rollback (tidak ada yang ditulis)"
```

`--import-manual000-v2` has a dry-run mode (`prisma/seed-studio.ts:1244-1246`, rollback at `:1068`), so it was run in that mode only. The field-by-field before/after comparison (`seed_before_after_compare.txt`, produced by `c02_cmp.mjs` over `summary_*.json`):

```
== presets-and-skeletons: 1 differing fields
  $.canonicalWarn.registryParamsSha256: "a18d36ea…" -> "01e30534…"
== contract-templates: 1 differing fields   (same field)
== doc-type-templates: 1 differing fields   (same field)
== import-manual000-v2: 8 differing fields
  $.presets.datum-manual-000.template.fileModeParamsSha256: "70b37ee6…" -> "c5202b07…"
  $.presets.datum-manual-000.template.registryDriftAdded: + {"key":"render.probe.noop","fileMode":false,"registryDefault":false}
  $.presets.datum-manual-000.guard.diffOutsideDelta: ["toc.levels"] -> ["render.probe.noop","toc.levels"]
```

Old templates in the guarded runs, after: datum-kanonik(-preset), datum-gsp(-preset), laporan-kerja-agen and all 10 (datum-proposal-teknis(-en), datum-laporan(-en), datum-laporan-verifikasi(-en), datum-standar(-en), datum-nota(-en)) are `unchanged` with the same version numbers, paramsSha256 and skeletonSha256 as before.

**P8 detail.** At HEAD, `datum-manual-000` v4 already has `equalsFileMode false`, with `registryDrift.addedSinceVersion` = `chart.kind.S-02.axis`, `chart.kind.S-03.axis`, `chart.kind.S-04.axis` (null/null) and `toc.levels` (2/2), and `equalsFileModeOnStoredKeys true`. So the flag fails on DEV today (stored keys 784 vs registry 788), as C01 suspected. Any addition adds one more drift key. The stored rows are not affected.

### 4.5 Unit tests (DB isolated)

The subset: `tests/unit/studio/{registry,structure,seed,contract,contracts,engine-core,renderers,compose,render,ui02,ui04}`, `figures/chart-params.test.ts`, `api/templates.test.ts` and `api/http-errors.test.ts`. That covers all 22 test files referencing `ALL_PARAMS`, `PARAMS_BY_KEY`, `PARAM_SURFACE`, `ESSENTIAL_KNOBS`, `COMPOSE_PARAM_KEYS`, `PARAMS_RENDER`, `device.spine` or `canonicalVersionPayload`, except `api-structure/templates.test.ts`. That file writes fixtures to the real DEV DB (`tests/unit/studio/api-structure/_db.ts:1-5`), so it was excluded. Each run moved `.env` out of the worktree and set `DATABASE_URL` to an unreachable host, so no test could reach a database.

```
before                         Test Files 101 passed (101) | Tests 2147 passed (2147)
after, pins unchanged          Test Files 2 failed | 99 passed (101) | Tests 2 failed | 2145 passed (2147)
  FAIL registry/s11-doc-typecode-nda.test.ts > paramsSha256 kanonik tidak berubah
       expected '01e30534a3c17b809f1d6e60801646978750f…' to be 'a18d36eafa6bdabe9035d1a68b410c439177c…'
  FAIL renderers/fixtl-toc-levels-roles.test.ts > pin hitungan … : expected 46 to be 45
enum-only (param edits reverted)  s11 + fixtl + fixf-spine-text + fixf-device-placement-parity: 4 files / 29 tests passed
after, pins updated            Test Files 101 passed (101) | Tests 2147 passed (2147)
```

## 5. Verification against the C02 acceptance checks

| Acceptance (blueprint row C02) | Evidence | Result |
|---|---|---|
| Baseline 8/8 SAME with the dummy param | §4.1 `compare: 8/8 SAME`, exit 0 | PASS (INFO lines explained, R1) |
| convert_v2 SAME × 3 | §4.3, 3 runs | PASS |
| Dry-runs 0 writes, old templates unchanged | §4.4; rollback messages; DB fingerprint equal; every template `unchanged` | PASS |
| registryInSync before/after recorded | §3: false/false; sha `a18d36ea…` → `01e30534…` | PASS |
| `git worktree list` shows only the main tree | §1 Remove | PASS |

## 6. Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| `--import-manual000-v2` guard fails on DEV | 2 dry-runs (before, after) | P8: stored v4 lacks keys added since (4 at HEAD, 5 with the dummy) | Pre-existing; needs a controller decision (new version or accept) before C30 uses the flag | No for C02; yes for any C30 use of the flag |
| Baseline prints 4 INFO lines after any registry addition | 1 diagnosis | DB-less synthetic version ID includes the full-registry paramsSha256 (`import.ts:219`) | Explained; byte outputs SAME | No; gates must treat it as expected |

## 7. Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| Before pass | Measured in the clean worktree pre-edit instead of the main tree | Same commit; keeps the main tree (live UI edits by another agent) untouched |
| Snapshot diagnosis | `git checkout -- <files>` under the global `core.autocrlf=true` turned 4 restored files into CRLF | Detected by a CR byte count. Those files were restored with `-c core.autocrlf=false`, and the "before" snapshot dump was re-run on LF files. All gate runs (§4.1, §4.3-§4.5) were on LF files |
| Snapshot diagnosis | A `git config core.autocrlf false` run inside the worktree wrote `core.autocrlf=false` into the shared repo config `.git/config` (worktrees share it) | Reverted within about a minute with `git config --local --unset core.autocrlf`. The earlier in-worktree `git config --get core.autocrlf` printed `true`, which proves the key was absent before. The effective value is back to the system `true`. No checkout or other git operation ran in the main tree in that window, so it saw no effect |
| Tests | `api-structure/*` writes to the DEV DB | Excluded; DB made unreachable during test runs |
| Dummy names | `render.probe.noop` R-67 and `sampul belakang` exist only in the deleted worktree | No change in the main tree |

## 8. Next Steps (for the controller, G-SPIKE)

- C06 must update three pins with each param batch: `RENDER_PARAM_COUNT`/`ALL_PARAM_COUNT` in `fixtl-toc-levels-roles.test.ts`, **and** the canonical sha in `s11-doc-typecode-nda.test.ts:31`. Recompute the sha; do not reuse the probe value.
- The C06/C23/C30 baseline gates should state that the `INFO compose snapshot` lines are expected after registry additions (DB-less version ID), while the 8 byte hashes must stay SAME.
- Decide P8 (new datum-manual-000 version or record acceptance) before any `--import-manual000-v2` run. It already fails at HEAD.
- Review recommended: none needed for this probe (no code landed).

Evidence folder: `C:\Users\TRIAL\gsp-backups\c02-registry-probe\` (logs, summaries, diffs, snapshot dumps, comparison scripts) and `C:\tmp\c02_bl`, `C:\tmp\c02_bl_before`.
