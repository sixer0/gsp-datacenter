---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: S47-S50 (phase B, runbook steps 8-11)
date: 2026-11-04
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/deploy/05_datum_rev_a_rollout_plan.md (sha256 5720b724186573ca591b411058c8961f5fb00b5d844c36bf620c077093eb8726, D-618)
authority: D-591 (autonomous), D-596 (G1/G2 approved), D-619 (GO), D-620 (phase A anchors)
status: complete
---

# Execution log: DATUM Rev A rollout, phase B (steps 8-11)

No secret or `DATABASE_URL` appears in this log. All runbook logs are under `$BK/logs/`.

- `$BK` = `C:/Users/TRIAL/gsp-backups/datum-rev-a-20261104-2230` (run id `20261104-2230`)
- Runner: every shell defines `bk_open` exactly as extracted from the runbook (sed range `bk_open() {` .. `}`), runs it (`tools_ok: 28 files checked, 0 mismatches`; `secrets loaded=yes exported=none`), then calls the runbook step functions.
- Gate tests (phase A, `$BK/logs/gate_*.txt`): step8_swap 12 checks, step9_launchers 6, step10_repoint 3, gw_one 1, step10_gate 8, step11_import 14, rb1_archive 5, rb2_code 3, rb2_config 3, rb2_gate 6: all `result=PASS`.
- Smoke range: the runbook's smoke (`tools/smoke_http.mjs`) defines S-1..S-9 and S-11 plus the template list and the old-code `latest` simulation; S-10 and S-12..S-14 are not defined in this runbook. "S-1..S-14 as the runbook defines" is therefore executed as exactly that set.

## Pre-flight, read-only dry-run (22:52-22:53 WIB)

Nothing changed in production. Purpose: prove the post-swap checks of step 8 that do not depend on the swap, before 9011 is touched.

| Check | Result |
|---|---|
| Inventory `procs_B_start.txt` (22:52:27) | 9011 PID 35600, 9041 PID 31428, 9031/9051 free; `OLD_MCP=5 R2_MCP=0 REPO_MCP=0 UNKNOWN_MCP=0` (gateway trees under 26576 gsp-worker, 28944 gsp-master01, 34228 gsp-worker-fast, 17624 gsp-thinker; non-gateway tree 15480 under `pythonw.exe` 19200, started 21:50:55) |
| `window_ok` | `window OK (Wed 22:52)` |
| `latest_unit_test` (R2 vitest S10) | `Tests 2 passed \| 30 skipped` |
| `prisma_r2 gsp_agent_hq migrate status` | `8 migrations found`, `Database schema is up to date!` |
| `smoke https://localhost:9011` (OLD) | S-1..S-9, S-11 ok, `fail 0`; S-5 n=7 (datum-gsp, datum-gsp-preset, datum-kanonik, datum-kanonik-preset, datum-manual-000, datum-manual-000-preset, laporan-kerja-agen); OLD-CODE-LATEST = datum-gsp |
| Production fingerprints | old templates = step 0 (`same_file`), the 10 slugs absent (`new10_zero`) |
| Anchors | `anchors_ok`, `export/SHA256SUMS`, `sql/SHA256SUMS_sql` verify; last anchors = D-620 (`SHA256SUMS 4897ee44...`, `export/SHA256SUMS d13be12c...`, `sql/SHA256SUMS_sql c0b20dda...`) |

## Step 8. Port swap, code before data (22:53:44-22:54:57 WIB)

Command: `window_ok` (`window OK (Wed 22:53)`), then `step8_swap` unchanged. Console `$BK/logs/step8_console.txt`.

| Item | Result |
|---|---|
| Inventory before | `procs_08_before.txt`: `OLD_MCP=5 R2_MCP=0 REPO_MCP=0 UNKNOWN_MCP=0` |
| Pre-checks | `ok prod.9011_listening` (PID 35600), `ok smoke.before`, `ok port.9051_free` |
| Standby (OLD 3566486, `C:/Users/TRIAL/gsp-hq-prod-v21`) | `spawn_out start-hq2.sh $OLD ... 9051 127.0.0.1` `ReturnValue=0`; `/login` 200 after 1 s; `ok smoke.standby` (S-5 n=7); listener `127.0.0.1:9051` PID 27224; log `$ECO/hq-v21-standby-9051.log` (`HQ production: https://127.0.0.1:9051`) |
| Window | `ok window.ok` (`window OK (Wed 22:54)`) |
| Stop | `stop_listener 9011`: PID 35600 (`hq-server.mjs`, child of 27172) terminated 22:54:29, port free 22:54:30 |
| Start R2 | `spawn_out start-hq2.sh $R2 $ECO/hq-r2.log` `ReturnValue=0`; `/login` 200 after 1 s; `hq-r2.log`: `start-hq2: dir=/c/Users/TRIAL/gsp-hq-prod-v21-r2`, `HQ production: https://0.0.0.0:9011`, `RENDER_ENV_READY` |
| **Downtime** | **22:54:29.354 -> 22:54:32.503 = 3.15 s** (runbook.log: `step8 downtime ...; old pid 35600; 9011 now pid 30144`) |
| `/login` | 200 (`wait_http`, and S-1 `login 200, root 307`) |
| Smoke after (R2 on 9011) | S-1..S-9, S-11 all ok, `SUMMARY fail 0` (`smoke_08_after.txt`): S-4 52 section types, S-6 ready, S-7 valid=false (dry-run), S-8 404 ROUTE_NOT_FOUND, S-11 token 200 / no token 401 |
| Template list | `ok templates.same_7`: S-5 n=7, identical line before and after: datum-gsp, datum-gsp-preset, datum-kanonik, datum-kanonik-preset, datum-manual-000, datum-manual-000-preset, laporan-kerja-agen |
| Post-checks | `ok r2.latest_unit_test` (2 passed), `ok prod.templates_untouched` (= step 0), `ok prod.db_guard`, `ok prod.schema_up_to_date` (8 migrations, up to date), `ok r2.log_no_request_error` |
| Listeners after | 9011 PID 30144 (R2), 9051 PID 27224 (OLD standby, loopback), 9041 PID 31428 (untouched) |

Status: **complete** (`step8 swap ok`, rc 0).

## Step 9. Launchers to R2, out-of-app (22:55:22-22:55:27 WIB)

Command: `step9_launchers` unchanged. Console `$BK/logs/step9_console.txt`; logs `realcheck_09_before.txt`, `launcher_edit_r2.txt`, `realcheck_09_after.txt`.

| Item | Result |
|---|---|
| Real view before | `gsp-ecosystem-start.sh` sha `3fc38f68...`, `watchdog-webui-hq.py` sha `d84a5d71...` (= the pinned shas); 5 Hermes profiles `r2_refs=0 old_refs=3` |
| Edit (`launcher_edit_r2.py`, out-of-app, exact match) | plan start.sh 2 lines (LF 129), watchdog 1 line (CRLF 177/177); `edited ... gsp-ecosystem-start.sh sha256 3fc38f68108a365d -> 4de2dd0e04182de4`, `edited ... watchdog-webui-hq.py sha256 d84a5d7196264ddd -> adf3b3e089c6f6c9` |
| Backups | `gsp-ecosystem-start.sh.bak-20261104-datum-rev-a` sha `3fc38f68...`, `watchdog-webui-hq.py.bak-20261104-datum-rev-a` sha `d84a5d71...` (= originals) |
| Diff | start.sh line 120 (comment `hq_restart.mjs` path, F-3) and line 121 (`cd "C:/Users/TRIAL/gsp-hq-prod-v21-r2"`); watchdog line 124 (`cwd=r"C:\Users\TRIAL\gsp-hq-prod-v21-r2"`); EOL kept (LF / CRLF) |
| Checks | `ok launcher.start_edited`, `ok launcher.watchdog_edited`, `ok launcher.bash_n`, `ok launcher.compile`, `ok launcher.real_view_eq_app_view` (new shas `4de2dd0e...906b`, `adf3b3e0...9d7c`), `ok launcher.no_old_path_left` |
| Left unchanged on purpose | start.sh line 119 comment and watchdog line 123 comment name the old checkout without a runnable path (I-R4) |

Status: **complete** (`step9 launchers -> R2`, rc 0).

## Step 10. Hermes MCP repoint and gateway restarts (from 22:55:45 WIB)

### 10a. `step10_repoint` (22:55:45-22:58:55 WIB), with fix R-X3

| Item | Result |
|---|---|
| First run `step10_repoint` (22:55:45) | `oa_run hermes_repoint.sh` -> `STOP: no completion line ... after 60 s`, rc 1. The log shows `hermes_repoint.py` completed in full: 5 x `plan <p>: 3 replacements, CRLF=..., parsed entry OK`, 5 x `<p>: <sha16> -> <sha16> backup ...config.yaml.bak-datum-rev-a-20261104`, `repoint done: 5 profiles`; then `oa/hermes_repoint.sh: line 13: unexpected EOF while looking for matching ')'`, so the report block (counts, diffs, `end`) never ran and `wait_log` timed out |
| Diagnosis | Runbook bug, typo level: bash 5.3.15 (both the in-app bash and `C:\Program Files\Git\bin\bash.exe`) fails at run time when an ANSI-C string `$'\r$'` sits inside the second or later command substitution of one double-quoted word. Reproduced in a scratch sandbox: each substitution alone parses; any pair with the `$'...'` one fails; the gate tests and `bash -n` cannot see it (run-time parse). `grep "\$'"` over `oa/*.sh` and `tools/*.sh`: line 13 of `hermes_repoint.sh` is the only such construct (the rollback scripts `hermes_restore.sh` / `launcher_restore.sh` do not use it) |
| State at the failure | The 5 configs were already repointed with verified backups (`hermes_repoint.py` verifies all 5 files, then writes; it refuses a second run because the backups exist). Gateways not restarted yet; production data unchanged; 9011 = R2 |
| Fix R-X3 (trivially correct, guards unchanged) | `$BK/logs/step10_fix_R-X3.sh` (out-of-app via `oa_run`): `hermes_repoint.sh` verbatim except (1) the python call is replaced by a copy of that run's python output (it must not run twice), (2) line 13 computes the same five values (`r2_refs`, `old_refs`, `env_ref`, `crlf`, line count) as separate assignments, then prints the same line format. Sandbox-tested with Git Bash first. The continuation function runs the original `step10_repoint` checks verbatim (`five_backups` on `hermes_repoint.txt`, `five_refs` on the R-X3 report, realcheck, `real_view`, `gateway list`), plus one extra guard `hermes.python_completed`. Runbook file and extracted tools unchanged (D-618 anchor and `bk_open` hashes hold). Recorded in `runbook.log` |
| Continuation (22:58:46-22:58:55) | `ok hermes.python_completed`; report `hermes_repoint_rx3.txt`: 5 x `r2_refs=3 old_refs=0 env_ref=1`, CRLF kept (298/298, 338/338, 131/131, 133/133, 131/131); diff per profile = exactly the 2 `args` lines (cli.mjs, server.ts) and `NODE_EXTRA_CA_CERTS`; `ok hermes.five_backups`, `ok hermes.five_refs`; real view `realcheck_10_after_repoint.txt`: 5 x `r2_refs=3 old_refs=0` (config shas master01 `f556a17a...`, master `a8c9a888...`, thinker `aed60c94...`, worker `21c1f796...`, worker-fast `9ea085df...`); `ok hermes.real_view`; `step10 repoint ok` |
| Gateways before restarts (`gateway_list_10a.txt`) | gsp-master01 28944, gsp-thinker 17624, gsp-worker 26576, gsp-worker-fast 34228; gsp-master not running |

### 10b. Gateway restarts, D-589 order (22:59:22-23:00:15 WIB)

Commands: `gw_one gsp-worker 10 && gw_one gsp-worker-fast 10`, then `gw_one gsp-master01 10 && gw_one gsp-thinker 10` (runbook helper unchanged: `gateway status` recorded, `oa_run gw_restart2.sh` = `hermes -p <p> gateway restart` out-of-app, requires `Gateway started`, then `procs`). No active kanban session was known to the executor for any of the 4 profiles. gsp-master has no gateway and was not started. Consoles `$BK/logs/step10_gw_a_console.txt`, `step10_gw_b_console.txt`.

| Profile | Restart log | New gateway PIDs | Inventory after (`procs_10_<p>.txt`) |
|---|---|---|---|
| gsp-worker (15:59:26Z) | `Killed 1 gateway process(es)`, `Gateway stopped (drained cleanly)`, `Gateway started via direct spawn (PID 16208) (PID: 22780)`, `exit=0` | 16208 / 22780 | `OLD_MCP=3 R2_MCP=0` (the restart also stopped gsp-worker-fast, name-prefix match, as in D-589) |
| gsp-worker-fast (15:59:37Z) | `No gateway was running` (stopped by the previous restart), `Gateway started via direct spawn (PID 16600) (PID: 33380)`, `exit=0` | 16600 / 33380 | `OLD_MCP=3 R2_MCP=1` |
| gsp-master01 (15:59:57Z) | `Gateway stopped (drained cleanly)`, `Gateway started via direct spawn (PID 15332) (PID: 1036)`, `exit=0` | 15332 / 1036 | `OLD_MCP=2 R2_MCP=3` |
| gsp-thinker (16:00:08Z) | `Gateway stopped (drained cleanly)`, `Gateway started via direct spawn (PID 24768) (PID: 34540)`, `exit=0` | 24768 / 34540 | `OLD_MCP=1 R2_MCP=3` |

All 4 checks `ok gw.<p>.started`. Each restart printed `Config ref '${env:INTERNAL_API_SECRET}': INTERNAL_API_SECRET is not set ... keeping the literal placeholder`; D-589 established that this CLI-side warning has no effect, and the e2e below confirms it.

Inventory 20 s later (`procs_10_after_gw.txt`, 23:00:35): `OLD_MCP=1 R2_MCP=4 REPO_MCP=0 UNKNOWN_MCP=0`. R2 MCP trees under the 4 new gateways (22780, 33380, 1036, 34540). The one remaining OLD tree is the non-gateway Hermes session: MCP PID 15480, parent `pythonw.exe` 19200, started 21:50:55. It was not touched (USER process).

Early read-only e2e (dry run of one gate item, 23:00:55-23:01:05): `oa_run mcp_e2e2.sh $BK gsp-worker-fast 10pre` -> `STUDIO_E2E ok=true code=none`, `exit=0` (`mcp_e2e_10pre_gsp-worker-fast.log`).

### 10c. Gate wait (from 23:00:35 WIB; limit 120 min = 01:00:35)

`step10_gate` refuses at its first check (`gate.old_mcp_zero`) while the non-gateway session runs. Per the brief: no USER process is stopped; the gate's inventory (`procs`, R-L4 matcher, same line `old_mcp_zero` greps) is re-run every 5 minutes into `$BK/logs/procs_10_wait_<HHMMSS>.txt`, summary `$BK/logs/gate10_wait_summary.txt`. When the inventory shows `OLD_MCP=0 ... UNKNOWN_MCP=0`, the full `step10_gate` runs.

| Time | Inventory | Remaining OLD trees |
|---|---|---|
| 23:01:20 | `OLD_MCP=1 R2_MCP=4 REPO_MCP=0 UNKNOWN_MCP=0` (`procs_10_wait_230119.txt`) | MCP 15480, parent `pythonw.exe` 19200, start 21:50:55 |
| 23:06:21 | `OLD_MCP=1 R2_MCP=4 REPO_MCP=0 UNKNOWN_MCP=0` (`procs_10_wait_230620.txt`) | same |
| 23:11:22 | `OLD_MCP=1 R2_MCP=4 REPO_MCP=0 UNKNOWN_MCP=0` (`procs_10_wait_231121.txt`) | same |

The wait loop was stopped at about 23:12 on the controller's course correction (below).

### 10d. Forced update on USER order, D-621 (23:12-23:16:45 WIB)

Authorization: the USER told the controller: **"force update saja agar cepat selesai"** (decision D-621, recorded by the controller in `decisions.md`). For this case only, D-621 lifts the rule against stopping USER processes: (1) stop only the old MCP tree; (2) if the WebUI respawns an MCP from its cached old config, restart the WebUI process 19200 only (not the watchdog, the gateways, HQ, the bridge or 9041) and make sure the relaunch uses r2; (3) then the gate and step 11. Accepted consequence (D-621): the open WebUI chat session loses its Studio tools until it reconnects. A second controller note relayed the USER's "persiapkan dulu studio yang baru agar downtimenya lebih pendek" (prepare the new Studio first to shorten the downtime). It arrived after the first kill (23:12:30). The preparation was then applied before the WebUI restart.

| Time | Action | Evidence |
|---|---|---|
| 23:12:06 | Read-only inventory (`procs_10_force_0_before.txt`, `force_10_parents.txt`) | `OLD_MCP=1`. Old tree = MCP 15480 (`node.exe ...gsp-hq-prod-v21\node_modules\tsx\dist\cli.mjs ...gsp-hq-prod-v21\scripts\studio\mcp\server.ts`, start 21:50:55), child 21248 (tsx loader), conhost 10004. Parent 19200 = `C:\Users\TRIAL\AppData\Roaming\uv\python\cpython-3.11-windows-x86_64-none\pythonw.exe server.py`, start 19:33:44, listens on 9012 (Hermes/Brahma WebUI). Its parent 28732 = `C:/Users/TRIAL/AppData/Local/hermes/hermes-agent/venv/Scripts/pythonw.exe server.py`, start 19:33:44, parent 3368 (gone). **Correction to the controller's hypothesis:** 28732 is the venv `pythonw.exe` launcher shim of the WebUI, not the watchdog. `watchdog-webui-hq.py` is a cron job (`0 */3`) and does not run between runs. 19200 had another child: bash 21008, a pytest run in `gsp-brahma/.worktrees/dup-9032` (a USER agent task) |
| 23:12:30 | **Minimal force:** command line re-checked (old-checkout MCP, not r2), then `taskkill /PID 15480 /T /F` | `SUCCESS` for 10004, 21248, 15480; 19200, 28732 and the pytest bash still alive; 9012 still served by 19200 |
| 23:12:46 | Read-only config check | Only the 5 repointed profiles hold the `studio` MCP entry, all `old=0 r2=3`; the default `hermes/config.yaml` has no studio reference (the out-of-app real view `realcheck_10_after_repoint.txt` agrees) |
| 23:14:56 | Re-inventory after 90 s+ (`procs_10_force_1_after.txt`) | **New old-checkout MCP PID 14304 under 19200, start 23:14:56**: the WebUI respawned it from its in-memory (cached) config. `OLD_MCP=1`. 19200 now also had a new child bash 25812 (start 23:12:45, another pytest run in `gsp-brahma/.worktrees/imp30-basal-ga`) |
| 23:15:47 | Preparation (second controller note) | r2 on 9011: `/login` 200 after 1 s, `smoke_10_prep_force.txt` S-1..S-9, S-11 `fail 0`, S-5 n=7. The r2 MCP was already warm: 4 gateway r2 MCP servers had run since 22:59-23:00, and the early e2e (23:00:55) answered `studio_contracts_query` ok in about 8 s, so no separate warm-up process was started. WebUI health `https://127.0.0.1:9012/health` 200. Relaunch command ready: the watchdog itself (`python.exe watchdog-webui-hq.py`; for a down WebUI it runs `python.exe bootstrap.py --no-browser --foreground --host 0.0.0.0 9012` in `C:\Users\TRIAL\gsp-brahma` with `gsp-brahma\.env`, DETACHED, then waits for health). Its cron interval is 3 h, so it was run at once through `spawn_out` instead of waiting |
| 23:16:28.771 | WebUI restart: command lines re-checked (19200 = `pythonw server.py` on 9012, 14304 = old MCP); `taskkill /PID 19200 /F` (process only, **no `/T`**, so the USER's running pytest bash 25812 was left alone); `taskkill /PID 14304 /T /F` | `SUCCESS` for 19200; 14304 `not found` (it had already exited with its parent); 28732 exited on its own (launcher shim); 9012 free at 23:16:29.277 |
| 23:16:29 | Relaunch: `spawn_out "C:/Users/TRIAL/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe C:/Users/TRIAL/AppData/Local/hermes/scripts/watchdog-webui-hq.py"` | WMI `ReturnValue=0`; `watchdog.log`: `23:16:34 webui DOWN -> restart`, `23:16:41 webui pulih`, `23:16:45 hq OK`, `23:16:45 bridge OK` |
| 23:16:41.351 | WebUI health 200 | new WebUI PID 32528 (`pythonw.exe C:\Users\TRIAL\gsp-brahma\server.py`, start 23:16:35) on 9012 |
| 23:16:5x | Inventory (`procs_10_force_2_after_webui.txt`) | **`OLD_MCP=0 R2_MCP=4 REPO_MCP=0 UNKNOWN_MCP=0`**; 19200, 28732, 14304 gone; 25812 (USER pytest) alive |

Measured gaps:

- **WebUI process gap: 23:16:28.771 -> 23:16:41.351 = 12.6 s** (from the kill of 19200 until `/health` 200 on the relaunched WebUI).
- WebUI Studio tools: the WebUI's old MCP was down from 23:12:30 until the WebUI respawned it at 23:14:56 (2 min 26 s, old code). Since 23:16:28 the WebUI has had no Studio MCP server. It starts one lazily on the next chat use, from the on-disk config, which points at r2 (the 5 profiles; nothing else references Studio). At 23:19:51 no MCP server ran under 32528 yet. The existing chat session had to reconnect, as D-621 accepted.
- HQ 9011, 9041, the bridge and the 4 gateways were not touched in 10d.

### 10e. `step10_gate` (23:16:56-23:18:21 WIB)

Command: `step10_gate` unchanged. Console `$BK/logs/step10_gate_console.txt`.

| Check | Result |
|---|---|
| `gate.old_mcp_zero` | ok: `procs_10_final.txt` = `OLD_MCP=0 R2_MCP=4 REPO_MCP=0 UNKNOWN_MCP=0` |
| `gate.r2_mcp_four` | ok (4) |
| `studio_contracts_query` e2e, 5 profiles (`mcp_e2e_10_<p>.log`) | gsp-master01 `STUDIO_E2E ok=true code=none` (16:17:21Z), gsp-master ok (16:17:51Z), gsp-thinker ok (16:18:02Z), gsp-worker ok (16:18:12Z), gsp-worker-fast ok (16:18:20Z); all `exit=0` |
| `secrets.step10` | `secret_scan: keys=6 ... files=166 hits=0` |
| Result | `step10 gate ok: OLD_MCP=0` |

**OLD_MCP history:** 6 (step 0, 22:4x) -> 5 (end of step 6: one USER session ended on its own) -> 5 (phase B start, 22:52) -> 3 (after the gsp-worker restart, which also stopped gsp-worker-fast) -> 3 -> 2 -> 1 (after the 4 gateway restarts, 23:00:15) -> 1 at 23:01, 23:06 and 23:11 (WebUI session only) -> 1 after the 15480 kill (the WebUI respawned the old MCP as 14304 at 23:14:56) -> **0** after the WebUI restart (23:16:5x) -> 0 at the gate (23:16:56), before and after step 11 (23:18:30, 23:18:58), and at the end (23:19:51).

Status step 10: **complete** (after fix R-X3 and the D-621 forced update).

## Step 11. Import into production, one transaction (23:18:30-23:18:58 WIB)

Command: `step11_import` unchanged, right after the gate. Console `$BK/logs/step11_console.txt`; import output `$BK/logs/prod_import.txt`. It runs the step-7 artefacts: `sql/import_new10.sql` (Windows `\copy` paths, R-X2) with `export/IMPORT_VARS.txt`, both covered by the anchored manifests.

| Check | Result |
|---|---|
| Gates before the import | `ok gate.old_mcp_zero` (`procs_11_before.txt` `OLD_MCP=0 R2_MCP=4 REPO_MCP=0 UNKNOWN_MCP=0`), `ok gate.datum_gsp_active`, `ok gate.latest_unit_test`, `ok anchors.match` (`export/SHA256SUMS d13be12c...158e`, `sql/SHA256SUMS_sql c0b20dda...9e65` = D-620), `ok export.sha`, `ok sql.sha`, `ok prod.new10_absent` |
| Import (one transaction, `--single-transaction`, `ON_ERROR_STOP`) | `db_guard OK: gsp_agent_hq`; `LOCK TABLE`; 5 staging tables; `COPY 10`, `COPY 10`, `COPY 72`, `COPY 170`, `COPY 0`; **`NOTICE: pre-checks ok: counts {10,10,72,170,0} fingerprints match`**; `INSERT 0 10`, `INSERT 0 10`, `INSERT 0 72`, `INSERT 0 170`, `INSERT 0 0`; **`NOTICE: post-checks ok: 17 templates (before 7 + 10)`**; commit |
| Post-checks | `ok import.post_checks`, `ok prod.old_templates_identical`, `ok prod.rows_eq_export`, `ok prod.total_17`, `ok smoke.after_import`, `ok smoke.after_import_17`, `ok gate.old_mcp_zero_after` (`procs_11_after.txt` `OLD_MCP=0`) -> `step11 import committed and verified` |

Extra verification (read-only, 23:19):

| Item | Result |
|---|---|
| 7 old templates identical | `prod_old_templates_11_before.txt` = `prod_old_templates_11_after.txt` = `prod_old_templates_00.txt` (step 0): every version, slot, param and role-format row of datum-gsp, datum-gsp-preset, datum-kanonik, datum-kanonik-preset, datum-manual-000, datum-manual-000-preset, laporan-kerja-agen |
| Count delta = export | StudioTemplate 7 -> 17 (+10); StudioTemplateVersion 10 -> 20 (+10); StudioTemplateSlot 43 -> 115 (+72); StudioTemplateSlotParam 55 -> 225 (+170); StudioTemplateSlotRoleFormat 0 -> 0 (+0); every other Studio table and every non-Studio table unchanged (StudioSectionType 52, StudioDocument 0) |
| Imported rows = export | `prod_new10_11_after.txt` byte-identical to `export/MANIFEST_new10_fp.txt`: StudioTemplate 10 `efbcc086e377a154cdb0970c45b138a8`; StudioTemplateVersion 10 `2293a66925f31add5857e4238e2f50b9`; StudioTemplateSlot 72 `7a86770d1e6000ac6e26c7a040e0422b`; StudioTemplateSlotParam 170 `0b8c9357c0159c7048ac1c96b6d82c2e`; StudioTemplateSlotRoleFormat 0 `d41d8cd98f00b204e9800998ecf8427e` |
| Total templates | 17 (SQL count, and smoke S-5 `n=17`: datum-gsp, datum-gsp-preset, datum-kanonik, datum-kanonik-preset, datum-laporan, datum-laporan-en, datum-laporan-verifikasi, datum-laporan-verifikasi-en, datum-manual-000, datum-manual-000-preset, datum-nota, datum-nota-en, datum-proposal-teknis, datum-proposal-teknis-en, datum-standar, datum-standar-en, laporan-kerja-agen); smoke `SUMMARY fail 0` |
| MCP `latest` through the r2 client | Read-only probe in R2 (tsx imports `scripts/studio/mcp/write-client-run.ts`; no document written, D-612): `{"latest":"datum-gsp","constant":"datum-gsp","passthrough":"datum-nota"}`, so `resolveTemplate("latest")` = `DEFAULT_CLIENT_TEMPLATE_SLUG` = datum-gsp. Production row datum-gsp: `archived f`, `isPreset f`, no contract kind (`datum_gsp_active` ok); R2 unit test S10: 2 passed; only r2 MCP code runs (`OLD_MCP=0`) |
| Why the gate matters (F-2) | The smoke's old-code simulation now returns `OLD-CODE-LATEST = datum-nota-en`: an old-checkout MCP would resolve `latest` to a new template. No old MCP runs |

Status: **complete**.

## End of phase B (23:19:51 WIB): production state

- 9011: R2 (`C:/Users/TRIAL/gsp-hq-prod-v21-r2`, tag `prod-v2.1-datum-rev-a-20261104` = `5fd72c5`), PID 30144, 17 templates, `request error` count in `hq-r2.log`: 0.
- 9051: OLD rollback build (3566486), loopback only, PID 27224 (kept for RB-2).
- 9041: gsp-datacenter standby, PID 31428 (untouched). 9012: Hermes WebUI, PID 32528 (relaunched 23:16:35, health 200).
- Launchers point at R2 (start.sh sha `4de2dd0e...`, watchdog sha `adf3b3e0...`; the `.bak-20261104-datum-rev-a` backups = the originals).
- Hermes: 5 profiles point at R2 (backups `config.yaml.bak-datum-rev-a-20261104`). Gateways: gsp-worker 16208/22780, gsp-worker-fast 16600/33380, gsp-master01 15332/1036, gsp-thinker 24768/34540. Inventory: `OLD_MCP=0 R2_MCP=4 REPO_MCP=0 UNKNOWN_MCP=0`.
- Anchors unchanged (`show_anchors`): `SHA256SUMS 4897ee44...a2aa3`, `export/SHA256SUMS d13be12c...158e`, `sql/SHA256SUMS_sql c0b20dda...9e65`.
- Rollback available: RB-1 (`rb1_archive`), then RB-2 (`rb2_code`, `rb2_config`, `gw_one <p> RB2` x4, `rb2_gate`). Not needed: nothing failed after the swap.
- Steps 12 and later were **not** run (no production smoke document, no skill refresh, no archive).

## Runbook bugs fixed at execution time (for the controller to record)

| ID | Step | Bug | Fix | Guard |
|---|---|---|---|---|
| R-X3 | 10 (`oa/hermes_repoint.sh` line 13) | bash 5.3.15 run-time parse error (`unexpected EOF while looking for matching ')'`) for an ANSI-C string (dollar-quoted CR pattern) inside the second or later command substitution of one double-quoted word. The repoint itself (python) completed; the report block and the completion line never ran, so `wait_log` timed out | Continuation `$BK/logs/step10_fix_R-X3.sh`: the same report, with the five values computed as separate assignments; python not re-run (it had completed, and it refuses a second run) | unchanged (`five_backups`, `five_refs`, realcheck `real_view` verbatim, plus `hermes.python_completed`) |

The runbook file and the extracted tools were not edited, so the D-618 sha and the 28 `bk_open` hashes still verify. The gate tests stub the out-of-app scripts, so they could not catch R-X3. If the runbook text is corrected, its sha changes and needs a new anchor.

## Observations for the controller

- The WebUI caches the MCP config in memory. Killing only its MCP child is not enough, because it respawns from the old config (14304). Any future repoint must include a WebUI restart, or wait for its sessions to end.
- `watchdog-webui-hq.py` runs only on cron (every 3 h). 28732 was the venv launcher of the WebUI, not a watchdog.
- USER agent work under the WebUI (pytest in `gsp-brahma/.worktrees/imp30-basal-ga`, bash 25812) was deliberately left running when 19200 was stopped (no `/T`). Its parent process is gone, so its final `| tail -3` output had no reader; its junit XML is unaffected. An earlier pytest bash (21008) under 19200 had already ended before 23:14:56.
- Retention (section L): the step-3 dump holds personal data; the USER deletes it 14 days after S54.
