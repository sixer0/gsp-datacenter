---
task_slug: doc_artifact_studio
row: C52
agent: verifier
skill: verification-before-completion
date: 2026-11-05
window: 17:41:38 - 17:46:52 WIB (fresh evidence); swap 17:11:02; 30-minute mark 17:41:02
status: complete
verdict: PASS (with 3 Low findings, none blocking)
mode: report-only. No process was started or stopped, nothing was written to any database, and no file was edited except this report.
---

# C52: DATUM Rev A coverage round, final production verification

## 1. Verification scope

| Item | Value |
|---|---|
| Requirement source | Blueprint `identification/03_structured_datum_coverage_round.md` row C52 (line 230) and AC-C11 (line 141); runbook `deploy/09_datum_coverage_round_rollout_plan.md` step 13.3, last paragraph |
| Runbook integrity | `sha256sum deploy/09...md` = `762003a90ea591e1258f4dc7e797b12056cccb9d653cf4c15389b75d61126fce`, the value recorded once in `decisions.md` (D-658). The 37 extracted files under `$BK` match section A 37/37, so the `steps.sh` rollback functions read below are the reviewed code |
| Inputs read | `deploy/10_datum_coverage_round_rollout_log.md`; D-657..D-664; verification 38 (PASS 10/10), 39 (PASS), 43 (PASS 10/10), 44 (CAUTION, accepted by the USER in D-660) |
| BK | `C:/Users/TRIAL/gsp-backups/datum-coverage-20261105-1636` |
| DB access | `source $BK/tools/env.sh`, then `psql_ro gsp_agent_hq` only (db_guard + `PGOPTIONS=-c default_transaction_read_only=on`). In-session `current_setting('transaction_read_only')` = `on`. `no_secret_env` ok. No secret was printed |
| Report name | The blueprint names `40_coverage_round_final_verification.md`. Number 40 was never used, and the controller asked for 45. This is a naming deviation only |

## 2. Checks

| # | Check | Result | Evidence (fresh unless stated otherwise) |
|---|---|---|---|
| 1a | 9011 is served by node `hq-server.mjs` from R3 | PASS | `netstat -ano`: `0.0.0.0:9011 LISTENING 11980`. WMI: PID 11980 `node.exe hq-server.mjs`, created 2026-11-05 17:11:01, parent `nohup.exe node hq-server.mjs`. The command line is relative, so the checkout comes from the loaded modules: `C:\Users\TRIAL\gsp-hq-prod-v21-r3\node_modules\.prisma\client\query_engine-windows.dll.node` and `...-r3\node_modules\@next\swc-win32-x64-msvc\...`. `hq-r3.log` line 1: `start-hq2: dir=/c/Users/TRIAL/gsp-hq-prod-v21-r3` at 17:11:01 |
| 1b | R3 is at 3ebe486, the tag, with a clean tree | PASS | `git -C r3 rev-parse HEAD` = `3ebe486966089674c62e942a009121ffc9678988`; `describe --exact-match` = `prod-v2.1-datum-coverage-20261105`; the repo tag resolves to the same sha; `status --porcelain` = 0 lines. R2 `.env` and R3 `.env` are byte-identical (`cmp`) |
| 1c | 9051 is a loopback listener from R2 (5fd72c5) | PASS | `127.0.0.1:9051 LISTENING 34036`; PID 34036 `node.exe hq-server.mjs`, created 17:10:36, loads `C:\Users\TRIAL\gsp-hq-prod-v21-r2\node_modules\.prisma\...`; R2 HEAD `5fd72c50ce42...` (tag `prod-v2.1-datum-rev-a-20261104`), clean; `hq-r2-standby-9051.log`: `port=9051 hosts=127.0.0.1`, 0 `request error`, 0 error level |
| 1d | 9041 and 9012 are untouched | PASS | 9041 PID 31428 (created 2026-11-04 16:58:55, loads `C:\Users\TRIAL\gsp-datacenter\...`) and 9012 PID 25480 (created 2026-11-05 08:25:45, `gsp-brahma\server.py`) are the same PIDs as the start state in deploy/10 line 13. 9021 PID 10664 is also unchanged |
| 1e | `/login` on 9011 returns 200 | PASS | `curl -k https://127.0.0.1:9011/login` -> `200` (17:41 and again at 17:46:52). 9051 -> `200`. Plain http gets no response (TLS only, as designed) |
| 2a | 18 StudioTemplate rows | PASS | `templates_total|18`, all `archived=f` |
| 2b | The 10 are at latestVersionNo 2 and derive from `datum-gsp-rev-a-preset` | PASS | 10 rows `ten|<slug>|2|2|datum-gsp-rev-a-preset@1|2` (latest = 2, latest version row = 2, its `baseVersionId` -> preset v1, 2 versions each). Preset: `datum-gsp-rev-a-preset|isPreset=t|archived=f|latest 1|base datum-gsp-preset@1`. `heads10_fp.sql` now equals `logs/prod_heads10_11_after.txt` (diff empty) and `logs/clone_heads10_post.txt` |
| 2c | The 7 old templates are unchanged against the step-0 fingerprints | PASS | `psql_ro ... -f sql/old_templates_fp.sql` (template row md5, version/slot/param/role-format md5s, paramsSha256, skeletonSha256, version count) `diff` against `$BK/logs/prod_old_templates_00.txt`: IDENTICAL, 7 lines |
| 2d | The 3 live agent documents are still on their v1 template versions | PASS | `001/GSP/STD/XI/2026` datum-standar current rev 20 -> template version 1; `002/GSP/LAP/XI/2026` datum-laporan rev 18 -> v1; `004/GSP/LAP/XI/2026` datum-laporan rev 16 -> v1. The revision numbers equal G-7 in the runbook (20/18/16), so no edit happened after the import. The only document with any revision on v2 is the smoke document (`doc_any_rev_on_v2|002/GSP/NOT/XI/2026|4`) |
| 2e | Smoke document `002/GSP/NOT/XI/2026` is archived | PASS | `doc|002/GSP/NOT/XI/2026|datum-nota|4|4|2|t|agent:hermes-datum-rollout`, archived, on v2, not deleted. StudioDocument = 9 |
| 2f | Production delta since step 11 is fully explained | PASS | `counts_all.sql` against `logs/prod_counts_11_after.txt`: only Document +1, Revision +4, OutputFile +2, RenderJob +2 and the Doc* content tables changed, which matches the 1 smoke document with 4 revisions on v2. Template tables are unchanged since step 11 (Template 18, Version 31, Slot 194, Param 395, RoleFormat 0, SectionType 52) |
| 3 | `hq-r3.log`: at least 30 minutes after the swap with no errors | PASS | Observed at 17:41:38 and 17:46:52, so 35 min 50 s after 17:11:02. 41 lines (16517 bytes, last write 17:34:56). `request error` 0, `"level":"error|fatal"` 0, `unhandled|uncaught` 0, stack/`Error:` lines 0. Levels: 37 info, 2 warn. Both warns are the smoke's intentional 404 probe `GET /api/studio/tidak-ada` (status 404). Limitation: traffic in the window was light (the step-12 smoke ran 10:18-10:20Z, then render-env at 10:34:56Z) |
| 4a | Launcher `.bak-20261105-datum-coverage` backups exist and hold the r2 references | PASS | `gsp-ecosystem-start.sh.bak-...` sha `4de2dd0e04182de4...` (r2=2, r3=0; line 121 `cd "C:/Users/TRIAL/gsp-hq-prod-v21-r2"`). `watchdog-webui-hq.py.bak-...` sha `adf3b3e089c6f6c9...` (r2=1, r3=0; line 124 `cwd=r"C:\Users\TRIAL\gsp-hq-prod-v21-r2"`, CRLF). These are exactly the shas `rb2_config` requires. The live files are `334d4d7d...` / `efd3751d...` (r2=0); diff = lines 120-121 / line 124 only |
| 4b | 16 `config.yaml.bak-datum-coverage-20261105` files exist and hold r2 | PASS | 16/16 present, each `r2=3 r3=0`. Their sha256 prefixes equal the pre-repoint r2 shas recorded out-of-app in `logs/realcheck_09_after.txt` (16/16) |
| 4c | The dump exists with the recorded sha under an owner-only ACL | PASS | `gsp_agent_hq_20261105-1636.dump` 4423956 bytes, sha256 `f6287d14f8ed4db1ba91cb5759c85b0478e5136e82f2782e647cae5d6219ed24` (= `SHA256SUMS`; SUMS digest `91f71ac8...` = `logs/anchors.txt`). `pg_restore --list` reads it: 56 TABLE DATA. `icacls` on the dump and on `$BK`: SYSTEM, Administrators, TRIAL only. That satisfies `backup_acl_ok` (no Everyone, Authenticated Users or Users) |
| 4d | RB-1v and RB-2 functions are present in the extracted `steps.sh`, with their dependencies | PASS | `steps.sh`: `rb1v_back` :559, `rb1v_forward` :569, `rb2_code` :577, `rb2_config` :587, `rb2_gate` :595, `rb3_restore` :604, `rb3_restart` :632, `gw_one` :405, `rb1v_run` :289, `GATEWAYS` :9. Dependencies are present and non-empty: `oa/launcher_restore.sh`, `oa/hermes_restore.sh`, `oa/start-hq2.sh`, `oa/gw_restart2.sh`, `oa/mcp_e2e2.sh`, `sql/rb1v_set_latest.sql`, `logs/clone_heads10_pre.txt` (= prod step-0 heads), `logs/clone_heads10_post.txt` (= prod heads now, so the RB-1v starting-head guard would accept). `sha256sum -c` passes for `sql/SHA256SUMS_sql` and `export/SHA256SUMS`, and their digests `ac1ea888...` / `62e54aa9...` equal the last anchors per key |
| 4e | Their gate tests passed | PASS (with Low L-2) | `logs/gate_*.txt`: 27 files, all `result=PASS`, 200 checks, including `rb1v_back` (4), `rb1v_forward` (3), `rb2_code` (3), `rb2_config` (3), `rb2_gate` (6), `rb3_restore` (10), `rb3_restart` (2). The 5 auxiliary gate tests (gw_one, force_r2_mcp, restart_webui_9012, step13_skill_fallback, step13_fleet_fallback; together the remaining 12 of the 212 checks) have sandboxes under `work/gate-test-*` but no summary file. I checked `gate-test-gw_one.*` by hand: `rec.1` = `rec.0` through `CHK gw.gsp-worker.started`, then `RC 1`, which is the harness's pass condition |
| 4f | RB-1v was rehearsed (AC-C11) | PASS | `logs/clone2_heads_rb1v_back.txt` = `clone_heads10_pre.txt`; `clone2_heads_rb1v_forward.txt` = `clone_heads10_post.txt`; `clone2_rb1v_back_archive.txt` ends with `datum-gsp-rev-a-preset|1|2026-11-05T09:57:26.552|t`; RB-3 rehearsal `clone_rb3_heads.txt` = `prod_heads10_00.txt` |
| 4g | The 9051 standby answers | PASS | `/login` 200 at 17:41 and 17:46:52; R2 build (see 1c) |
| 5a | Hermes skill update: logs and report | PASS | `logs/skill_verify.txt` (out-of-app run `r2026110517315227731`, 17:31:52-17:31:58): `SAME` x3 (SKILL.md `3463eff5...`, howto-document `6cf12a6b...`, howto-report `7c2b28aa...`), `GRANT yes` for gsp-thinker, gsp-worker, gsp-worker-fast, gsp-master01 and gsp-master, `GRANT_LINKS 5`, `FLEET r2=0 r3=2`. `hermes_skill_update_report.md` (97 lines) ends with `HASIL: SELESAI`. Fresh in-app shas of the installed files equal the R3 sources (`docs/hermes-skills/gsp-studio-write/SKILL.md`, `docs/STUDIO-HOWTO-DOCUMENT.md`, `docs/STUDIO-HOWTO-REPORT.md`). Fleet skill is now `da419bb3...`, r2=0 r3=2 (not run: `oa/skill_verify.sh`, as instructed) |
| 5b | 16 profiles reference r3 only | PASS | `grep` over `C:/Users/TRIAL/AppData/Local/hermes/profiles/*/config.yaml`: 16 profiles with `gsp-hq-prod-v21-r2` = 0 and `-r3` = 3 each, pre-r2 path 0, `${env:INTERNAL_API_SECRET}` reference 1 each. Total r2 references across all live configs = 0. The 2 other profiles (`jurytest1`, `ujic`) have no Studio entry and no backup, which is expected. **View:** in-app (Claude app process). The in-app sha256 prefixes equal the out-of-app real-view record `logs/realcheck_10_after_repoint.txt` for 16/16 profiles, and the launcher watchdog under AppData equals `realcheck_09_after.txt`, so for these paths the in-app view is not virtualized |
| 5c | Gateways and MCP inventory | PASS | Fresh `tools/procs_studio.sh` (read-only): `OLD_MCP=0 R2_MCP=3 R3_MCP=11 REPO_MCP=0 UNKNOWN_MCP=0`, the same as the step-10 gate (`logs/procs_10_final.txt`). The 3 R2 roots are exactly the informational PIDs in D-663: 12604 (parent 22892 Hermes CLI), 35736 (parent 11724 gsp-brahma), 32592 (parent 25480 WebUI 9012). The M-1 force path was not used: there are no force/webui logs and 0 `force_r2_mcp|restart_webui` entries in `runbook.log` (D-660 mitigation honoured) |
| 6a | `s52_secret_scan` hits = 0 | PASS (with Low L-1) | The original result is in the execution log and D-664 only (`files=338 hits=0`). The function prints to the console and does not `log`, so no file persisted it. A fresh re-run of the same scope (`$BK/logs`, `prod-smoke`, `gladi`, `export`, `hq-r3.log`, `hq-r3-gladi.log`, `hq-r2-gladi.log`, `hq-r2-standby-9051.log`) gave `secret_scan: keys=6 (CRON_SECRET,DATABASE_URL,INTERNAL_API_SECRET,NEXTAUTH_SECRET,POSTGRES_URL,WEBUI_RBAC_TOKEN) files=338 hits=0`. An extra scan of the Hermes report, deploy/09, deploy/10, decisions.md and verification 38/39/43/44 gave `files=8 hits=0` |
| 6b | Section L retention note | PASS | Runbook section L: the dump and any `pre_rb3_*.dump` stay under owner-only `$BK` (verified in 4c); the clone is dropped (deploy/10 lines 33 and 54). Retention for the USER, not automated: delete `$BK/gsp_agent_hq_20261105-1636.dump` (and any `pre_rb3_*.dump`) 14 days after C52 passes and the rollback window closes, and record the deletion in `decisions.md`. If C52 passes today, the earliest date is 2026-11-19, the same date the Rev A dump `datum-rev-a-20261104-2230/...dump` falls due (D-624). No `pre_rb3_*` dump exists (RB-3 was never run) |

### Summary by category

| Category | Result | Basis |
|---|---|---|
| Intent alignment (AC-C11) | Pass | 2b (10 at v2, from the preset), 2a/2b (preset inserted), 2c (7 old templates identical), 2d (live documents pinned to v1), 4f (RB-1v rehearsed) |
| Syntax / integrity | Pass | Runbook sha = D-658; 37/37 extracted files match section A; manifests `sha256sum -c` OK |
| Logic | Pass | RB-1v starting-head precondition holds now (prod heads = `clone_heads10_post.txt`); `rb2_config` sha expectations equal the existing `.bak` files |
| Integration | Pass | 9011 R3 / 9051 R2 / Hermes 16 profiles on r3 / 11 gateway MCP roots on R3 / skill SAME x3 |
| Regression | Pass | Old templates identical to step 0; 9041, 9012 and 9021 PIDs unchanged; 0 errors in `hq-r3.log` and `hq-r2-standby-9051.log` |
| Safety | Pass | Secret scan 0 hits (338 + 8 files); dump owner-only; no secret printed in this session |

## 3. Issues found

### High
None.

### Medium
None.

### Low

| ID | Finding | Evidence | Impact |
|---|---|---|---|
| L-1 | The `s52_secret_scan` result is not persisted. The function in `steps.sh:554-556` only `chk`s (console) and writes no `log` line, and deploy/10 line 94 cites evidence "-". | `grep -c secrets.c52 $BK/logs/runbook.log` finds nothing; only `gate_s52_secret_scan.txt` (the gate test) matches | The C52 claim depends on the console transcript. Mitigated: the fresh re-run reproduces `files=338 hits=0` |
| L-2 | No summary files for 5 of the 32 gate tests (gw_one, force_r2_mcp, restart_webui_9012, step13_skill_fallback, step13_fleet_fallback). The 212-check total cannot be recomputed from `logs/` (27 files = 200 checks). | `ls logs/gate_*.txt` = 27; sandboxes `work/gate-test-<name>.*` exist for all 32 | gw_one is part of RB-2. Its sandbox records satisfy the pass rule, and it also ran for real 11 times with exit 0 in step 10. The other 4 are optional or fallback paths that were not used |
| L-3 | The archive UPDATE writes `"updatedAt" = now()` in the session time zone. The DB `TimeZone` is `Asia/Bangkok`, and the column is `timestamp without time zone`, while Prisma writes UTC. | `sql/archive_smoke_docs.sql` UPDATE line; `002/GSP/NOT/XI/2026` createdAt `2026-11-05 10:20:15.902` (UTC) vs updatedAt `2026-11-05 17:33:43.603` (local, 7 h ahead). The Rev A smoke `001/GSP/NOT/XI/2026` shows the same pattern (23:28:29) | Cosmetic. Both documents are archived; "last updated" display and ordering are off by 7 h. No functional effect |

### Informational (not findings against C52)
- I-1: Blueprint C52 names report 40. This is report 45 at the controller's direction.
- I-2: Hermes's conversion of 5 archived role-grant folders to junctions is outside C52. It is recorded in deploy/10 line 87 and was decided by the USER in D-664 ("Keep the links").
- I-3: The rollback chain is now r3 -> r2 only. The 3566486 standby was retired in step 8 (runbook "Standby port"). The RB-2 gate is strict (`R3_MCP=0`), so RB-2 needs the 11 `gw_one <p> RB2` restarts.
- I-4: The 30-minute observation saw light traffic. Absence of errors was confirmed, but not under agent load.

## 4. Remediation notes (for the runbook owner; no action taken here)
- L-1: Make `s52_secret_scan` (and every `secret_scan` gate) tee its output into `$BK/logs/` and `log` the summary line.
- L-2: Run the auxiliary gate tests with output redirected to `logs/gate_<name>.txt` like the 27 step tests.
- L-3: Use `now() at time zone 'UTC'` in `archive_smoke_docs.sql` (and any direct-SQL `updatedAt` write) to match Prisma.
- D-662's note still applies: the next runbook should set `RD_PAYLOAD_ID/EN` inside `step6_rehearsal`/`step12_smoke`.

## 5. Next steps
1. Controller: record C52 PASS in `decisions.md` and decide whether L-1..L-3 become fix rows for the next runbook or are accepted as notes.
2. Keep RB-1v / RB-2 available until the rollback window closes. All artefacts are verified in place (section 2, rows 4a-4g).
3. USER retention: on or after 2026-11-19 (14 days after this PASS, if the window is closed), delete `$BK/gsp_agent_hq_20261105-1636.dump` and record it in `decisions.md`. The Rev A dump is due on the same date.
