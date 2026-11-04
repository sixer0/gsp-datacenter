---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: S41-S46 (phase A, runbook steps 0-7)
date: 2026-11-04
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/deploy/05_datum_rev_a_rollout_plan.md (sha256 5720b724186573ca591b411058c8961f5fb00b5d844c36bf620c077093eb8726, D-618)
authority: D-591 (autonomous), D-619 (GO, phase A = steps 0-7 only)
status: complete
---

# Execution log: DATUM Rev A rollout, phase A (steps 0-7)

Phase A does not change the live production system: production is only read (preflight fingerprints, `pg_dump`, section-type fingerprint in step 7). No secret or `DATABASE_URL` appears in this log. All runbook logs are under `$BK/logs/`.

- `$BK` = `C:/Users/TRIAL/gsp-backups/datum-rev-a-20261104-2230` (run id file `C:/Users/TRIAL/gsp-backups/datum-rev-a.current` = `20261104-2230`)
- Runner: every shell defines `bk_open` exactly as extracted from the runbook (sed range `bk_open() {` .. `}`), runs it (tools_ok 28/0 each time), then calls one step function.

## Step 0. Files, environment, preflight (22:30-22:31 WIB)

| Item | Command (summary) | Result |
|---|---|---|
| Runbook sha | `sha256sum 05_datum_rev_a_rollout_plan.md` | `5720b724...8726`, 1987 lines; recorded in `decisions.md` D-618 |
| 0.1 run id | `datum-rev-a.current` created | `20261104-2230`, `$BK` created |
| 0.2 extraction | runbook extractor (verify all, then write) | 28 x `OK`; log `$BK/logs/step0_extract.txt` |
| 0.3 `bk_open` | sha recorded + re-hash 28 files, then source env.sh/steps.sh | `tools_ok: 28 files checked, 0 mismatches`; `secrets loaded=yes exported=none` |
| 0.4 gate tests | `gate_tests.sh` for 25 step functions + `gw_one gsp-worker 10` | 26 x `result=PASS`, 170 checks in total; logs `$BK/logs/gate_*.txt` |
| 0.5 `step0_preflight` | ACL, ports, R2/clone absent, prod fingerprints | all `ok`; ACL = SYSTEM, Administrators, TRIAL; 9031/9051 free; `OLD_MCP=6 R2_MCP=0 REPO_MCP=0 UNKNOWN_MCP=0`; prod new10 = 0 rows in all 5 tables; section types 52 / md5 `6c51234e1fa241f159c75fe1afa0b99f`; Studio counts = runbook section 0 |
| 0.5 `step0_driver` | copy D-612 asset, derive driver | `rollout_driver.ts` sha `d103ced3299113997f07de2a7e7ea3342d69c78dd6de9d2975592e25f3a7cf36`, 16 replacements |

Status: **complete**.

## Step 1. Commit and local tag (22:31 WIB)

| Item | Result |
|---|---|
| Checks | `skill.not_draft`, `tag.absent`, `staged.not_empty` (172 paths), `staged.no_secret_files`, `staged.no_f070`, `staged.no_secret_values` (secret_scan keys=6, hits=0), `tag.points_to_commit`, `status.only_f070_untracked`: all `ok` |
| Commit | `5fd72c50ce4269b0fe785b5df920507ac26a02ba` on branch `v2.1`; message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` (already in the runbook's message, nothing added) |
| Tag | `prod-v2.1-datum-rev-a-20261104` -> `5fd72c50...` (local; no push; remote `local-datacenter` untouched) |
| Excluded | the two `f070_backup/*.json` files stay untracked (D-612 F-8); no other scratch or evidence was outside the intended set (the untracked set was reviewed before the commit: benchmark scorer, tests, task docs, coverage JSON, `dev_gate_r2/`) |
| Logs | `$BK/logs/step1_console.txt`, `git_staged.txt`, `commit_msg.txt`, `git_status_after_commit.txt` |

Status: **complete**.

## Step 2. R2 checkout and build (22:31-22:33 WIB)

| Item | Result |
|---|---|
| First run `step2_build` (22:31:56) | `ok` r2.absent, env.no_exported_secret, r2.autocrlf_false, r2.head_is_tag, r2.env_identical, r2.certs_identical, r2.status_clean; then **`STOP r2.env_ignored`** with `fatal: --quiet is only valid with a single pathname`. Nothing after the check ran (no npm). Log `$BK/logs/step2_console.txt` |
| Diagnosis | Runbook bug, typo level: `git check-ignore -q` accepts one path only, so `git -C "$R2" check-ignore -q .env certs/hq-key.pem` can never pass. The gate tests stub `git`, so they could not see it. The condition itself holds: `check-ignore -q .env` rc 0 and `check-ignore -q certs/hq-key.pem` rc 0 (`.gitignore:34 .env`, `.gitignore:56 /certs/`) |
| Fix R-X1 (trivially correct, guard unchanged) | Continuation function `$BK/logs/step2_fix_R-X1.sh`: lines 130-135 of `tools/steps.sh` verbatim, except the one check, which runs the same two paths as two one-path `check-ignore -q` calls inside the same `chk r2.env_ignored` label. The runbook file and the extracted `steps.sh` were NOT edited, so the D-618 sha anchor and `bk_open` hashes still hold. Recorded in `runbook.log`. The same check sits only in step 2 (`grep check-ignore` over tools/oa) |
| Continuation (22:32:54-22:33:58) | `ok r2.env_ignored`, `ok env.no_exported_secret_before_npm`; `npm ci` exit 0, `npm run build` (`prisma generate && next build`) exit 0, `tsc --noEmit` exit 0 (empty output); `BUILD_ID=6xb9ugamWFD9_JCpImrdi` |
| R2 | `C:/Users/TRIAL/gsp-hq-prod-v21-r2`, branch `prod-v21-r2` at `5fd72c5`, `git status` clean, `.env`/certs copied without printing (`cmp -s` identical) |
| Observation (non-blocking) | `npm ci` warned that the npm `allowScripts` policy skipped 6 install scripts (`@prisma/client`, `@prisma/engines`, `esbuild`, `prisma`, `sharp`, `unrs-resolver`). The build's own `prisma generate` produced the client; `query_engine-windows.dll.node` and `schema-engine-windows.exe` are present; tsx/esbuild run (`@esbuild/win32-x64`). Steps 4-7 exercise Prisma CLI, tsx and the server |
| Logs | `$BK/logs/r2_clone.txt`, `r2_npm_ci.txt`, `r2_build.txt`, `r2_tsc.txt`, `step2b_console.txt` |

Status: **complete** (after fix R-X1).

## Step 3. Production backup (22:34 WIB, read-only towards production)

| Item | Result |
|---|---|
| Checks | `backup.acl_owner_only` (SYSTEM, Administrators, TRIAL), `dump.absent`, `db_guard OK: gsp_agent_hq`, `dump.table_data_count` (56 `TABLE DATA` entries = 56 public tables) |
| Dump | `$BK/gsp_agent_hq_20261104-2230.dump`, custom format, 2,766,935 bytes, sha256 `1f5703cac26ca46473ae1862abff815decee009da0b1a85b5bf0e4ee726c71fe`; file ACL SYSTEM/Administrators/TRIAL only |
| `pg_restore --list` | readable, `$BK/logs/dump_list.txt` |
| Studio counts at dump | identical to step 0 (`prod_counts_03_dump.txt`) |

`show_anchors` output after step 3:

```
== anchors to record in decisions.md (last per key):
SHA256SUMS 4897ee44a8afbbed43256c472a5e4d1f8e936d64efe91f73f7f369391dea2aa3
```

Status: **complete**.

## Step 4. Clone from the dump, migration status (22:34:49-22:34:54 WIB)

| Item | Result |
|---|---|
| Checks | `clone.absent`, `dump.sha`, `CREATE DATABASE` (via `postgres`), restore `--no-owner` ok, `clone.studio_counts_eq_dump`, `clone.db_guard`, `clone.schema_up_to_date`, `clone.migrate_datasource`, `clone.drift_only_known`: all `ok` |
| `migrate status` (R2) | `Datasource "db": PostgreSQL database "gsp_agent_hq_v21_seedtest"`, `8 migrations found`, `Database schema is up to date!`: **no pending migration** |
| Drift | exactly the 7 known statements (4 `ilsearchdoc_*` drops, `StudioDocBlock_tsv_idx` drop, 2 `tsv` DROP DEFAULT) |
| Logs | `$BK/logs/clone_restore.txt`, `clone_migrate_status.txt`, `clone_drift.sql`, `step4_console.txt` |

Status: **complete**.

## Step 5. Seed the 10 templates on the clone (22:35:02-22:35:12 WIB)

| Item | Result |
|---|---|
| Pre | `clone.old_templates_eq_prod`, `clone.sectiontypes_eq_prod` |
| Dry-run | `CHECK_SEED mode=dry rows=4 fail=0` |
| Real run | `CHECK_SEED mode=real rows=3 fail=0` |
| Re-run | `CHECK_SEED mode=rerun rows=3 fail=0` (10 x unchanged) |
| Post | `clone.old_templates_unchanged` (the 7 old templates identical, md5 of every version, slot, param and role-format row), `clone.sectiontypes_eq_prod_after`, `clone.new10_shape` |
| `new10_fp` (clone) | StudioTemplate 10 `efbcc086e377a154cdb0970c45b138a8`; StudioTemplateVersion 10 `2293a66925f31add5857e4238e2f50b9`; StudioTemplateSlot 72 `7a86770d1e6000ac6e26c7a040e0422b`; StudioTemplateSlotParam 170 `0b8c9357c0159c7048ac1c96b6d82c2e`; StudioTemplateSlotRoleFormat 0 `d41d8cd98f00b204e9800998ecf8427e` |
| Logs | `$BK/logs/seed_1_dry.log`, `seed_2_real.log`, `seed_3_rerun.log`, `clone_new10_05.txt`, `step5_console.txt`; temporary workspace `C:/Users/TRIAL/gsp-ws-gladi-seed` |

Status: **complete**.

## Step 6. Rehearsal on the clone, out-of-app (22:35:24-22:42:39 WIB), then S45 (22:45 WIB)

Input: `step6_rehearsal` unchanged, with the documented optional driver inputs `RD_PAYLOAD_ID` / `RD_PAYLOAD_EN` pointing at copies of the D-607 gate payloads (`$BK/gladi/payload/id.json` sha16 `9c607200108d09f4`, `en.json` sha16 `f849b1700cc7ae79`). D-607 requires realistic payloads for S36/S45/S52, and only a realistic title exercises the running-head fit (G-2).

| Check | Result |
|---|---|
| `port.9031_free`, `port.9051_free` | ok |
| R2 on 9031 (spawn_out WMI `ReturnValue=0`) | `/login` 200 after 1 s; `smoke.r2_9031`, `smoke.r2_9031_17` ok |
| R2 MCP spec, write, render, bfix | `gladi.r2_render_11`: `CHECK_RENDER rows 11 fail 0`; `latest` -> `datum-gsp`; 10 B-FIX fixtures `r08:true COMPLETE` |
| Old 3566486 build on loopback 9051 | `/login` 200 after 2 s; `smoke.old_9051`, `smoke.old_9051_17` ok; `gladi.old_code_datum_gsp` (`CHECK_RENDER rows 1 fail 0`) |
| RB-1 rehearsal | `smoke.old_archived`, `smoke.old_archived_7`, `smoke.old_code_latest_datum_gsp`, `gladi.old_mcp_latest_is_datum_gsp`, `clone.unarchive_restores_seeded_rows`: all ok |
| Stop | `stop_listener 9031` (pid 32048 tree), `stop_listener 9051` (pid 15344 tree); both ports free. 9011 PID 35600 and 9041 PID 31428 unchanged |
| Secret scan | keys=6, files=183, hits=0 (`secrets.step6` ok) |
| Process inventory after | `OLD_MCP=5 R2_MCP=0 REPO_MCP=0 UNKNOWN_MCP=0` (was 6 at step 0: one USER Hermes session ended on its own; phase A stopped no USER process) |

**S45 conformance** (`$BK/gladi/score_all_gladi.sh` = `C:/tmp/s36r2/score_all.sh` adapted: clash.py `--docx ... --no-convert --work-dir $WORK/clash-work`, then score.ts full rule set with `--spec`, `--bfix` and the coverage JSON). Report: `verification/27_datum_conformance_rehearsal.md`.

| Pair | Tier | Score (n/N) | Critical | Clash | Coverage (reported) | D-608 gate |
|---|---|---|---|---|---|---|
| datum-proposal-teknis / ID | SERAH | 94.0 % (63/67) | 4/4 | 0 | 39.7 % | PASS |
| datum-proposal-teknis-en / EN | SERAH | 94.2 % (65/69) | 4/4 | 0 | 46.6 % | PASS |
| datum-laporan / ID | TERBIT | 94.0 % (63/67) | 4/4 | 0 | 39.3 % | PASS |
| datum-laporan-en / EN | TERBIT | 94.2 % (65/69) | 4/4 | 0 | 46.4 % | PASS |
| datum-laporan-verifikasi / ID | TERBIT | 94.0 % (63/67) | 4/4 | 0 | 39.3 % | PASS |
| datum-laporan-verifikasi-en / EN | TERBIT | 94.2 % (65/69) | 4/4 | 0 | 46.4 % | PASS |
| datum-standar / ID | TERBIT | 94.0 % (63/67) | 4/4 | 0 | 39.7 % | PASS |
| datum-standar-en / EN | TERBIT | 94.2 % (65/69) | 4/4 | 0 | 46.6 % | PASS |
| datum-nota / ID | NOTA | 90.9 % (30/33) | 4/4 | 0 | 40.6 % | PASS |
| datum-nota-en / EN | NOTA | 91.1 % (31/34) | 4/4 | 0 | 46.9 % | PASS |

The outcomes per rule equal the DEV gate r2 on 10/10 pairs. G-2: all 20 interior running heads are one line, and the shortened titles end on a whole word (`... MANAJEMEN ASET…`, `... MANAGEMENT…`; the DEV r2 PDFs cut inside a word: `ASET PEL…`, `MANAGEMENT IN…`).

Status: **complete** (step 6 and S45, 10/10 PASS).

## Step 7. Export the new rows, rehearse the import and RB-3 (22:45:55-22:47:00 WIB)

| Item | Result |
|---|---|
| First run `step7_export` (22:45:55) | `ok sql.export_no_placeholder`, `ok sql.import_no_placeholder`, then `psql: ... export_new10.sql:5: error: /c/Users/TRIAL/gsp-backups/.../export/StudioTemplate.csv: No such file or directory`, return 1. No CSV, no manifest, no anchor was written |
| Diagnosis | Runbook bug, typo level: `sed "s#@EXP@#$BK/export#g"` writes the MSYS form `/c/Users/...` into the `\copy` filename; Windows `psql` does not translate paths inside a SQL file and reads it as `C:\c\Users\...` (that folder chain does not exist below `C:\c\Users\TRIAL`, so nothing was written elsewhere). Reproduced beforehand with a read-only `\copy (select 1)` |
| Fix R-X2 (trivially correct, guard unchanged) | `$BK/logs/step7_fix_R-X2.sh`: `step7_export` verbatim except the two `sed` lines, which substitute the same folder in mixed Windows form, `$(cygpath -m "$BK")/export` (= `C:/Users/TRIAL/gsp-backups/datum-rev-a-20261104-2230/export`). `diff` against `tools/steps.sh` shows only those 2 lines. Runbook and extracted `steps.sh` unchanged (D-618 anchor holds). The generated `import_new10.sql` (5 `\copy` lines with the Windows path) is what step 11 will run; it is covered by `sql/SHA256SUMS_sql` |
| Re-run (22:46:15) | `ok` sql.export_no_placeholder, sql.import_no_placeholder, export.manifest_eq_seeded, export.copy_counts_eq_manifest, sectiontypes.clone_eq_prod, export.import_vars_shape |
| COPY counts | `COPY 10`, `COPY 10`, `COPY 72`, `COPY 170`, `COPY 0` = manifest |
| Manifest (counts + md5) | StudioTemplate 10 `efbcc086e377a154cdb0970c45b138a8`; StudioTemplateVersion 10 `2293a66925f31add5857e4238e2f50b9`; StudioTemplateSlot 72 `7a86770d1e6000ac6e26c7a040e0422b`; StudioTemplateSlotParam 170 `0b8c9357c0159c7048ac1c96b6d82c2e`; StudioTemplateSlotRoleFormat 0 `d41d8cd98f00b204e9800998ecf8427e` |
| Export sha256 (`export/SHA256SUMS`) | StudioTemplate.csv `0cf99517...ed5b5`; StudioTemplateVersion.csv `8af81483...8ddca`; StudioTemplateSlot.csv `ef744362...e2475`; StudioTemplateSlotParam.csv `5cf0990c...cbbdf`; StudioTemplateSlotRoleFormat.csv `0bbd7b8b...fe266`; MANIFEST_new10_fp.txt `eb55729b...6bc9`; IMPORT_VARS.txt `a72e8315...c78e` |
| SQL sha256 (`sql/SHA256SUMS_sql`) | import_new10.sql `6d457c3f...7726`; export_new10.sql `f2599a77...e5fb`; rb1_archive.sql `1a3d76d0...eaca` |
| References (not exported) | artifacts 0, revisions 118, documents 20 (the rehearsal documents on the clone) |
| Section types | clone = production (`sectiontypes.clone_eq_prod`: 52 rows, md5 `6c51234e1fa241f159c75fe1afa0b99f`) |
| `step7_import_rehearsal` (22:46:28-22:47:00) | `ok` port.9031_free, anchors.match, export.sha, sql.sha, clone.no_other_sessions_drop; clone dropped and recreated from the same dump; import: `NOTICE pre-checks ok: counts {10,10,72,170,0} fingerprints match`, `NOTICE post-checks ok: 17 templates (before 7 + 10)`; `ok` import.post_checks, import.rows_eq_export, import.old_unchanged; **second run refused**: exit 3, `ERROR: STOP a slug already exists in target` (`import.second_run_refused`, `import.second_run_reason`); R2 on 9031 served 17 templates (`smoke.r2_imported_17`), stopped; RB-3 rehearsal `pg_restore --clean --if-exists --single-transaction --no-owner`: `rb3_rehearsal.new_rows_gone`, `rb3_rehearsal.old_eq_prod`; `clone.no_other_sessions_final`; clone dropped |

`show_anchors` output after step 7:

```
== anchors to record in decisions.md (last per key):
SHA256SUMS 4897ee44a8afbbed43256c472a5e4d1f8e936d64efe91f73f7f369391dea2aa3
export/SHA256SUMS d13be12cbaa5414f7d01ac35e2fa2d82f1bc8f23c624b7eebcd46b4b0803158e
sql/SHA256SUMS_sql c0b20dda6c64f39d3601163998aa63cb0a5dbadfa58daaad1e97865fa6099e65
```

Status: **complete** (after fix R-X2).

## End of phase A (22:47:16 WIB): production unchanged

Read-only re-check through the runbook helpers (`psql_ro`, `chk`): Studio counts = step 0, every other table count = step 0, the 7 old templates identical (`old_templates_fp`), the 10 slugs absent (0 rows in 5 tables), section types identical, clone absent. Listeners: 9011 PID 35600 and 9041 PID 31428 (both since 16:5x, untouched); 9031 and 9051 free. `OLD_MCP=5 R2_MCP=0 REPO_MCP=0 UNKNOWN_MCP=0`. Nothing was pushed. Steps 8+ were not run.

## Runbook bugs fixed at execution time (for the controller to record)

| ID | Step | Bug | Fix | Guard |
|---|---|---|---|---|
| R-X1 | 2 | `git check-ignore -q` with two paths always fails (`--quiet is only valid with a single pathname`) | same two paths as two one-path calls in the same `chk r2.env_ignored` (`$BK/logs/step2_fix_R-X1.sh`) | unchanged (both paths must be ignored) |
| R-X2 | 7 | `\copy` filename in the generated SQL used the MSYS path `/c/...`, which Windows psql reads as `C:\c\...` | `@EXP@` = `$(cygpath -m "$BK")/export`, same folder (`$BK/logs/step7_fix_R-X2.sh`) | unchanged (all 6 checks verbatim) |

Neither fix edited the runbook file or the extracted tools, so `bk_open` (28 hashes) and the D-618 sha still verify. The gate tests could not catch either bug because they replace `git` and `psql` with recorders. If the controller wants the runbook text corrected, that changes its sha (new anchor and a delta review).

## Phase B: open items

- `OLD_MCP=5` now (4 gateways + 1 non-gateway Hermes session). Step 10 restarts the 4 gateways; `step10_gate` and step 11 still refuse until the USER session ends (D-615: do not kill USER processes).
- Steps 8-13 are untested against real `git`/`psql`/PowerShell behaviour in the same way as R-X1/R-X2 (the gate tests stub them). Step 11 runs the already generated and anchored `import_new10.sql` (Windows paths, proven on the clone), so R-X2 does not recur there.
- Retention (section L): the dump `$BK/gsp_agent_hq_20261104-2230.dump` holds personal data, OAuth tokens and password hashes. USER deletes it 14 days after S54.
