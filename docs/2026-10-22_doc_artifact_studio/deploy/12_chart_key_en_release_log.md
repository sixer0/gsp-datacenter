---
task_slug: doc_artifact_studio
agent: coder-execution
date: 2026-11-05
runbook: docs/2026-10-22_doc_artifact_studio/deploy/11_chart_key_en_code_release.md (sha256 df766c7448d9f9504ca6d474ff55512f05eb07abbc6138138c2a6f89b3ddcd85, D-667)
scope: deploy/11 complete execution (R3 -> R4 on 9011, launchers to R4); Hermes, gateways, MCP servers, skills and 9051 untouched
---

# Chart key-row EN release (deploy/11), execution log

CK = `C:/Users/TRIAL/gsp-backups/chart-key-en-20261105-2043` (owner-only ACL). BK (deploy/09, reused tools) = `C:/Users/TRIAL/gsp-backups/datum-coverage-20261105-1636`. Evidence paths are relative to CK unless absolute.

## deploy/11 execution

| Time | Step | Command | Result line | Evidence |
|---|---|---|---|---|
| 20:48 | 0.1-0.2 | work folder, extractor | `CK=/c/Users/TRIAL/gsp-backups/chart-key-en-20261105-2043`; 6 `OK <sha16> <file>` lines (steps.sh 93b5f2a6, gate_tests.sh 09e57262 = deploy/09, key_probe.mjs a68c5b1f, launcher_edit_r4.py 22189f44, launcher_edit_r4.sh 30825ca7, launcher_restore_r4.sh cc043288) | tools/, oa/ |
| 20:48 | 0.3 | `ck_open` | `tools_ok: 37 files checked, 0 mismatches`; `tools_ok: 6 files checked, 0 mismatches`; `env OK ... secrets loaded=yes exported=none`; `ck_open OK` | - |
| 20:48 | 0.4 | `gate_tests.sh` x 13 | 13 x `result=PASS`, 99 checks (r4_preflight 17, r4_build 13, r4_swap_core 16, r4_restart_r3 4, r4_launchers 11, r4_final 2, rb4_code 5, rb4_launchers 3, r4_render_check before 7 / after 8, r4_probe_doc before ID 4 / after ID 5 / after EN 4) | logs/gate_*.txt, work/gate-test-* |
| 20:48 | 0.5 | `r4_preflight` | 17 `ok`; diff secret_scan hits=0; procs `OLD_MCP=0 R2_MCP=3 R3_MCP=12 REPO_MCP=0 UNKNOWN_MCP=0`; `r4 preflight ok: 15 files changed since r3, MCP closure 137 files, none changed` | logs/tag4_changed_files.txt, mcp_closure_tag4.txt, procs_r4_00.txt |
| 20:49-20:50 | 1 | `r4_build` | 13 `ok` (clone at tag, autocrlf false, HEAD = tag, .env/certs identical to R3, status clean, env ignored, R4 closure untouched and code = R3, npm ci / build / tsc, unit tests: chart-key-label-en file passed, implw2 S10 2 passed); `r4 built BUILD_ID=isdKYfzlhYAATb0tKH_ED` | logs/r4_build_console.txt, r4_clone.txt, r4_npm_ci.txt, r4_build.txt, r4_tsc.txt, r4_unit_key.txt, r4_unit_latest.txt, mcp_closure_r4.txt |
| 20:50 | 2 | `r4_render_check before` (R3) | 7 `ok`; ID document `cmw3g3q55000zv18shwwmrndc` (007/GSP/LAP/XI/2026) revision 9: HTTP 200, rendered, P-03, `kunci:true key:false`, svg 3694 bytes sha256 `b412b033cb2147f69b54a3d11f4ab5681daf20928cbd0a0efe19bb688ef51a84`; `no non-archived EN production document on a datum template; EN probe skipped (ID proof only)` | logs/probe_before_ID.json, probe_before_ID.svg |
| 20:50-20:51 | 3 | `r4_swap` | 16 `ok`; smoke before 18; `window OK (Thu 20:51)`; `stop_listener port=9011 pid=11980`; R4 started out-of-app; `r4 downtime 20:51:08.436 -> 20:51:12.020` (about 3.6 s); 9011 now PID 16076, serves `gsp-hq-prod-v21-r4` (62fd22f); same template list; old templates and heads untouched; migrate status up to date; 9051 PID unchanged (34036); no `request error` in hq-r4.log; `r4 swap ok` | logs/r4_swap_console.txt, smoke_r4_*.txt, prod_*_r4a/b.txt, prod_migrate_r4.txt, r4_9011_stopped.flag; C:/Users/TRIAL/gsp-ecosystem/hq-r4.log |
| 20:51 | 4 | `r4_render_check after` (R4) | 8 `ok`; same document and revision 9: HTTP 200, rendered, `kunci:true key:false`, svg sha256 `b412b033...` = R3 baseline (`ok probe.after.ID.svg_identical_to_r3`); EN probe skipped (no EN document) | logs/probe_after_ID.json, probe_after_ID.svg |
| 20:52 | 5 | `r4_launchers` (oa_run x3) | 11 `ok`; real view before = r3 state (334d4d7d..., efd3751d...); `gsp-ecosystem-start.sh` -> `ed216873d990935d166095603838a4829585b19f223841476d9d042177b1f8cd` (lines 120-121), `watchdog-webui-hq.py` -> `ae15c6bdc6c7bc28e5f50f260c516e7af791b408ebf3853ba72340b7988d8107` (line 124, CRLF 177/177); backups `.bak-20261105-chart-key-en` = 334d4d7d... / efd3751d...; bash -n and compile OK; real view = app view; no r3 path left, 3 r4 lines; 16 Hermes profiles still `r2_refs=0 r3_refs=3`; `r4 launchers -> R4` | logs/r4_launchers_console.txt, realcheck_r4_before.txt, launcher_edit_r4.txt, realcheck_r4_after.txt |
| 20:52 | 6 | `r4_final` | `OLD_MCP=0 R2_MCP=3 R3_MCP=12 REPO_MCP=0 UNKNOWN_MCP=0`; `ok mcp.no_old_or_unknown`; secret_scan files=39 hits=0; `ok secrets.r4` | logs/procs_r4_final.txt |

State after deploy/11: 9011 PID 16076 (R4, commit 62fd22f), 9051 PID 34036 (R2 standby, untouched), 9041 PID 31428, 9021 PID 10664. Rollback: `rb4_code` (R3 back on 9011), then `rb4_launchers` if needed.

Informational:
- `stop_listener 9011` (the runbook's own `taskkill /T` of the hq-server tree) also ended a Playwright `chrome.exe` (PID 18020). It was a child process of the old R3 server PID 11980.
- The 9012 WebUI is now PID 26068, started 2026-11-05 18:10:10, before this run; this run did not touch it.
- An R2 MCP root PID 20836 (parent 28420, pythonw, started 18:01:50, after the deploy/09 repoint) was already present at preflight. The other R2 roots are 12604 (parent 22892) and 35736 (parent 11724).
