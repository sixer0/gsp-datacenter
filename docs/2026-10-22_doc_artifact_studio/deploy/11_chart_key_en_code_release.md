---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: chart_key_en_release
date: 2026-11-05
agent: coder-execution
decisions: D-666 (USER "Commit and deploy"; commit 62fd22f, local tag prod-v2.1-chart-key-en-20261105); base runbook deploy/09 sha 762003a9 (D-658)
status: needs-review (written, not executed; the controller records this file's sha256 in decisions.md before step 0.3 can open)
---

# Runbook: chart key-row label follows document language, code-only release R3 -> R4 (deploy/11)

Abbreviations. REPO = `C:/Users/TRIAL/gsp-swarm-hq-v2.1`. R2 = `C:/Users/TRIAL/gsp-hq-prod-v21-r2` (5fd72c5, loopback standby on 9051, untouched here). R3 = `C:/Users/TRIAL/gsp-hq-prod-v21-r3` (3ebe486, production on 9011 since 2026-11-05 17:11, deploy/09 step 8). R4 = `C:/Users/TRIAL/gsp-hq-prod-v21-r4` (new checkout from tag `prod-v2.1-chart-key-en-20261105`, commit 62fd22f). `$BK` = `C:/Users/TRIAL/gsp-backups/datum-coverage-20261105-1636` (deploy/09 work folder; its `env.sh`, `steps.sh`, `sql/` and `oa/` are reused after their sha256 check). `$CK` = `C:/Users/TRIAL/gsp-backups/chart-key-en-<ts>` (this runbook's work folder, owner-only ACL inherited from `gsp-backups`).

## Summary

A code-only release: commit 62fd22f makes the chart key-row label follow the document language ("KEY" for EN documents; ID and callers without a language keep "KUNCI" byte-identical). The change touches 15 files: 9 code/test files under `src/` and `tests/`, 6 docs. None of them is in the Studio MCP server's import closure, so the Hermes profiles, the 11 gateways, their MCP servers and the installed skills stay on R3 and are not touched. No migration, no `prisma/` change, no template data, no skill or how-to change.

1. **Preparation (no production change):** `ck_open`, gate tests, `r4_preflight` (read-only), `r4_build` (R4 checkout, npm ci, build, tsc, the fix's unit test), `r4_render_check before` (read-only preview probe on R3, baseline).
2. **Swap:** `r4_swap` (9011 from R3 to R4; 9051 untouched; automatic return to R3 if anything fails after the stop), `r4_render_check after` (same probe on R4).
3. **Launchers and evidence:** `r4_launchers` (the two persistent launchers from r3 to r4, out-of-app, sha-pinned), `r4_final` (MCP inventory and secret scan).

Rollback RB-4: `rb4_code` (R3 back on 9011) and, if the launchers were already edited, `rb4_launchers`. No data step exists, so no data rollback is needed.

## Findings from the read-only preparation (2026-11-05 ~20:30-20:46 WIB)

| ID | Finding | Evidence | Effect |
|---|---|---|---|
| F-1 | Tag `prod-v2.1-chart-key-en-20261105` = 62fd22f, a child of 3ebe486; REPO HEAD = 62fd22f | `git rev-parse`, `git log --oneline -3` | `r4_preflight` checks descent and that REPO's code paths are clean at the tag |
| F-2 | `git diff --name-only 3ebe486 62fd22f` = 15 files: `figures/preview/route.ts`, `figures/preview/_lib/figure.ts`, `engine/chart/core/{apparatus,index,lang}.ts`, `family-p1/common.ts`, `family-w2/horizon.ts`, `services/render/figures.ts`, `services/render/pure/chart.ts`, `tests/unit/studio/figures/chart-key-label-en.test.ts`, 5 task docs (decisions.md, deploy/10 log, verification 38/39/45) | `git diff --name-only` | no `prisma/`, no secret-like file; the closure check runs on REPO (preflight) and on R4 (build) |
| F-3 | The 9011 listener's native modules come from `gsp-hq-prod-v21-r3` (`next-swc...node`, `.prisma\client\query_engine-windows.dll.node`); 9051's from `gsp-hq-prod-v21-r2` | `Get-Process -Id <pid>` module list (read-only) | `serves_from <port> <folder>` proves which checkout serves a port (used before and after the swap) |
| F-4 | The figure preview route is read-only: route.ts header "Tanpa tulis apa pun: tanpa job, berkas, atau baris DB (D-322)"; `_lib/load.ts` does two `findUnique` plus `resolveTemplate` (`findUnique` + version lookup); the render runs in memory; side effects are one in-memory render-rate hit and one JSONL api log line in the workspace log folder | code reading at the tag | `r4_render_check` is allowed; it creates no document |
| F-5 | Production has no EN document: all 11 documents are `language = ID` (2 archived) | read-only `StudioDocument` query | the EN probe is skipped with a note today. The ID probe proves the route works and that the ID output on R4 is byte-identical to R3's for the same document revision; the EN label itself is proven by the unit test in `r4_build` |
| F-6 | The probe block (P-03, 2 series, datum style) draws the key row: engine-only local run on REPO 62fd22f gives ID `>KUNCI<` true, EN `>KEY<` true, EN `>KUNCI<` false; `validateBlockV2` returns no issue | `pureChartSvg` with `tests/parity/fixtures/chart/p03.json` style datum (no server, no DB) | the `before` probe requires `>KUNCI<`, so a probe that draws no key row stops before the swap |
| F-7 | Launchers are in their deploy/09 step-9 state: `gsp-ecosystem-start.sh` sha `334d4d7d...` (lines 120-121 name r3), `watchdog-webui-hq.py` sha `efd3751d...` (line 124 names r3) | `sha256sum`, `grep -n`; `launcher_edit_r4.py --check`: lines [120, 121] LF 129, lines [124] CRLF 177/177, compile OK, nothing written | `r4_launchers` edits exactly those 3 lines |

## 1. Conventions

- **Open each shell with `ck_open`** (step 0.3). It checks that the sha256 of deploy/09 AND of this runbook are recorded in `decisions.md`, re-hashes deploy/09's 37 extracted files and this runbook's files (section A), then sources `$BK/tools/env.sh` (secrets in non-exported variables, `set -x` refused) and `$CK/tools/steps.sh` (which sources deploy/09's `steps.sh`).
- **Checks really stop:** every check is `chk <label> <predicate> || return 1`; `tools/gate_tests.sh` (byte-identical to deploy/09's harness, sha `09e57262...`) proves for every function that a failed check stops it before any later command. All must end `result=PASS` before the real run.
- **Out-of-app:** process starts (`spawn_out`, WMI) and the launcher edit/restore (`oa_run`, run id first line, completion line). AppData writes from inside the app are virtualized.
- **Time window:** the only moment 9011 is empty is inside `r4_swap` (and `rb4_code`); both are gated by `window_ok` (not :55-:05 around 00, 03, ..., 21; not Monday 04:00-05:59).
- **Never touched:** 9051 (R2 standby; `r4_swap` checks its PID is unchanged), 9041, 9012, 9021, the Hermes profiles, gateways, MCP servers and skills, the database (read-only queries only), R2 and R3 checkouts (R3 stays: the gateways' MCP servers run from it and it is the rollback target).
- **Stop rule:** before `r4_swap` a stop leaves production unchanged. A failure inside `r4_swap` after the 9011 stop puts R3 back on 9011 automatically and stops. After `r4_swap` use section 8.

## Step 0. Folder, files, environment, gate tests, preflight

```bash
# 0.1 run id + work folder (once; a second run resumes the same folder)
TSF4=/c/Users/TRIAL/gsp-backups/chart-key-en.current
if [ ! -f "$TSF4" ]; then date +%Y%m%d-%H%M > "$TSF4"; fi && CK=/c/Users/TRIAL/gsp-backups/chart-key-en-$(cat "$TSF4") && mkdir -p "$CK/logs" "$CK/work" && echo "CK=$CK"
RUNBOOK4=/c/Users/TRIAL/gsp-swarm-hq-v2.1/docs/2026-10-22_doc_artifact_studio/deploy/11_chart_key_en_code_release.md
PY=C:/Users/TRIAL/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe

# 0.2 extract the section-A files; verifies every sha256 first and writes nothing on any mismatch (deploy/09 0.2 extractor)
"$PY" -I - "$RUNBOOK4" "$CK" <<'PYX'
import hashlib, pathlib, re, sys
md = open(sys.argv[1], encoding="utf-8").read()
bk = pathlib.Path(sys.argv[2])
want = dict(re.findall(r"^\| `([\w./-]+)` \| `([0-9a-f]{64})` \|$", md, re.M))
files = re.findall(r"<!-- file: ([\w./-]+) -->\n```[a-z]*\n(.*?)\n```\n", md, re.S)
if len(files) != len(want) or not files:
    sys.exit("STOP: %d embedded files, %d sha256 rows" % (len(files), len(want)))
checked = []
for name, body in files:                       # verify everything first, write nothing on any mismatch
    data = (body + "\n").encode("utf-8")
    got = hashlib.sha256(data).hexdigest()
    if want.get(name) != got:
        sys.exit("STOP: sha256 mismatch for %s (nothing extracted)" % name)
    checked.append((name, data, got))
for name, data, got in checked:
    p = bk / name
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_bytes(data)
    print("OK", got[:16], name)
PYX
chmod +x "$CK"/oa/*.sh "$CK"/tools/*.sh

# 0.3 open the environment: define ck_open once per shell, then run it; it verifies before it sources
ck_open() { # deploy/09 and deploy/11 sha256 recorded in decisions.md; both extracted file sets = their section-A sha256; then env.sh + steps.sh
  local rb9=/c/Users/TRIAL/gsp-swarm-hq-v2.1/docs/2026-10-22_doc_artifact_studio/deploy/09_datum_coverage_round_rollout_plan.md
  local rb11=/c/Users/TRIAL/gsp-swarm-hq-v2.1/docs/2026-10-22_doc_artifact_studio/deploy/11_chart_key_en_code_release.md
  local dec=/c/Users/TRIAL/gsp-swarm-hq-v2.1/docs/2026-10-22_doc_artifact_studio/decisions/decisions.md
  local pyb=C:/Users/TRIAL/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe
  local b=/c/Users/TRIAL/gsp-backups/datum-coverage-20261105-1636 tsf4=/c/Users/TRIAL/gsp-backups/chart-key-en.current c r
  local v='import hashlib, pathlib, re, sys; md = open(sys.argv[1], encoding="utf-8").read(); bk = pathlib.Path(sys.argv[2]); want = dict(re.findall(r"^\| `([\w./-]+)` \| `([0-9a-f]{64})` \|$", md, re.M)); bad = [n for n, h in sorted(want.items()) if not (bk / n).is_file() or hashlib.sha256((bk / n).read_bytes()).hexdigest() != h]; print("tools_ok: %d files checked, %d mismatches %s" % (len(want), len(bad), " ".join(bad))); sys.exit(1 if bad or not want else 0)'
  [ -f "$tsf4" ] || { echo "STOP: $tsf4 missing"; return 1; }
  [ "$(cat /c/Users/TRIAL/gsp-backups/datum-coverage.current)" = 20261105-1636 ] || { echo "STOP: datum-coverage.current is not 20261105-1636"; return 1; }
  c=/c/Users/TRIAL/gsp-backups/chart-key-en-$(cat "$tsf4")
  for r in "$rb9" "$rb11"; do grep -qF "$(sha256sum < "$r" | cut -c1-64)" "$dec" || { echo "STOP: $(basename "$r") sha256 not recorded in decisions.md"; return 1; }; done
  "$pyb" -I -c "$v" "$rb9" "$b" || { echo "STOP: deploy/09 extracted files differ from deploy/09"; return 1; }
  "$pyb" -I -c "$v" "$rb11" "$c" || { echo "STOP: deploy/11 extracted files differ from this runbook"; return 1; }
  source "$b/tools/env.sh" && CK="$c" && source "$c/tools/steps.sh" && echo "ck_open OK: CK=$CK"
}
ck_open                  # Expect: tools_ok: 37 files checked, 0 mismatches; tools_ok: 6 files checked, 0 mismatches; env OK ... secrets loaded=yes exported=none; ck_open OK

# 0.4 gate tests of every function (no side effects; each must end result=PASS)
for s in r4_preflight r4_build r4_swap_core r4_restart_r3 r4_launchers r4_final rb4_code rb4_launchers; do
  GATE_SANDBOX_ROOT="$CK/work" bash "$CK/tools/gate_tests.sh" "$s" > "$CK/logs/gate_$s.txt" 2>&1; tail -1 "$CK/logs/gate_$s.txt"
done
GATE_SANDBOX_ROOT="$CK/work" bash "$CK/tools/gate_tests.sh" r4_render_check before | tail -1
GATE_SANDBOX_ROOT="$CK/work" bash "$CK/tools/gate_tests.sh" r4_render_check after | tail -1
GATE_SANDBOX_ROOT="$CK/work" bash "$CK/tools/gate_tests.sh" r4_probe_doc before ID cmw0000000000000000000000 | tail -1
GATE_SANDBOX_ROOT="$CK/work" bash "$CK/tools/gate_tests.sh" r4_probe_doc after ID cmw0000000000000000000000 3 | tail -1
GATE_SANDBOX_ROOT="$CK/work" bash "$CK/tools/gate_tests.sh" r4_probe_doc after EN cmw0000000000000000000000 3 | tail -1

# 0.5 preflight (read-only)
r4_preflight             # runbook sha recorded, no exported secret, owner-only ACL, 9011 serves r3, 9051 serves r2 and answers, R4 absent, tag descends from 3ebe486, no prisma/secret-like file, secret scan of the diff, REPO at the tag and clean in src/scripts/prisma, MCP closure untouched
```

Expect: 6 extraction lines; both `tools_ok` lines with 0 mismatches; 13 gate-test lines `result=PASS` (99 checks when this runbook was written); `r4 preflight ok: 15 files changed since r3, MCP closure 137 files, none changed`.

## Step 1. R4 checkout and build

```bash
r4_build
```

Clone with `--no-hardlinks -c core.autocrlf=false`, branch `prod-v21-r4` at the tag; autocrlf=false and HEAD = tag; `.env` and certs copied from R3 without printing (`cmp -s`); git status clean; `.env` and `certs/hq-key.pem` ignored (one path per `check-ignore -q`, R-X1); MCP closure of R4 has no changed file and its code equals R3's (`git diff --quiet 3ebe486 HEAD -- <closure>`); `npm ci`, `npm run build`, `tsc --noEmit` each exit 0; the fix's unit test file (`chart-key-label-en.test.ts`: ID unchanged, EN draws `>KEY<` and no `>KUNCI<` for every drawn chart code in datum and gallery style) and the `latest` constant test (`implw2-client.test.ts -t S10`, 2 passed) pass in R4. Expect `r4 built BUILD_ID=...`. Production unchanged.

## Step 2. Baseline probe on R3 (read-only)

```bash
r4_render_check before
```

9011 serves r3; picks the newest non-archived ID document on a `datum-*` template (and the newest EN one, if any); posts the P-03 probe block to the figure preview route with `svg: true`; requires HTTP 200, `rendered: true`, `>KUNCI<` present and `>KEY<` absent (on R3 an EN document also shows KUNCI: that is the bug). Writes `$CK/logs/probe_before_<ID|EN>.{json,svg}`; the `after` run reuses the same document ids and revision numbers. Today: ID only (F-5); expect the line `EN probe skipped (ID proof only)`.

## Step 3. Code swap on 9011

```bash
r4_swap
```

`r4_swap_core`: not run before (flag absent); R4 built; baseline present; 9011 serves r3; smoke before lists 18 templates; production old-template and heads fingerprints taken (`$BK/sql/old_templates_fp.sql`, `heads10_fp.sql`); `window_ok`; stop R3 on 9011 (command line checked by `stop_listener`); flag `r4_9011_stopped.flag`; start R4 out-of-app (`start-hq2.sh $R4 $ECO/hq-r4.log`); `/login` 200 (downtime logged); smoke after = same template list; 9011 serves r4; fingerprints unchanged; `db_guard`; `prisma migrate status` from R4 up to date; 9051 PID unchanged; no `request error` in `hq-r4.log`. Expect `r4 swap ok`.

If any check fails after the 9011 stop, the wrapper prints `STOP r4_swap failed after the 9011 stop: restoring R3 on 9011 now`, stops whatever listens on 9011 (only an `hq-server.mjs` process), runs `r4_restart_r3` (R3 out-of-app on 9011, smoke 18, serves r3) and stops with `production is back on R3`. A re-run needs the controller: move `r4_9011_stopped.flag` aside (rename with a timestamp, never delete) after the cause is understood.

## Step 4. Probe on R4 (read-only)

```bash
r4_render_check after
```

9011 serves r4; the same ID document and revision as the baseline: HTTP 200, `>KUNCI<` present, `>KEY<` absent, and the SVG byte-identical to the R3 baseline (`same_file probe_before_ID.svg probe_after_ID.svg`). If an EN document was probed in step 2: `>KEY<` present and `>KUNCI<` absent. A failure here: run `rb4_code` (the launchers are not edited yet).

## Step 5. Launchers to R4 (out-of-app)

```bash
r4_launchers
```

9011 serves r4; real view before = the r3 state (`334d4d7d...`, `efd3751d...`); `launcher_edit_r4.py` (sha-pinned, anchors exact once, changed lines exactly start.sh [120, 121] and watchdog [124], EOL kept, backups `.bak-20261105-chart-key-en`); `bash -n`, `compile()`; real view after = in-app view; no `gsp-hq-prod-v21-r3` left in the launcher lines; exactly 3 `gsp-hq-prod-v21-r4` lines; the 16 Hermes profiles still `r2_refs=0 r3_refs=3` (untouched). Expect `r4 launchers -> R4`.

## Step 6. Evidence

```bash
r4_final
```

MCP inventory `OLD_MCP=0 ... UNKNOWN_MCP=0` (R3 MCP servers remain: the gateways are not restarted and run R3's unchanged MCP code against R4's API); secret scan of `$CK/logs` and `hq-r4.log`.

## 7. Commands in order (for the controller)

```bash
# once: 0.1, 0.2, then in every shell: define ck_open (0.3) and run it
ck_open
# gate tests (0.4 block), then:
r4_preflight
r4_build
r4_render_check before
r4_swap                  # window_ok inside; automatic return to R3 on a failure after the stop
r4_render_check after    # on failure: rb4_code
r4_launchers             # on failure after an 'edited' line: rb4_launchers (and rb4_code if the code must go back too)
r4_final
```

## 8. Rollback (RB-4)

| Level | When | Commands | Effect |
|---|---|---|---|
| RB-0 | stop before `r4_swap` | none | Production unchanged; R4 checkout may stay (inert) |
| automatic | a check fails inside `r4_swap` after the 9011 stop | built into `r4_swap` | R3 back on 9011, STOP |
| RB-4 code | after `r4_swap` | `rb4_code` | `window_ok`; stop R4 on 9011; R3 on 9011 out-of-app; smoke 18; serves r3 |
| RB-4 launchers | after `r4_launchers` edited | `rb4_launchers` | both launchers restored from `.bak-20261105-chart-key-en` out-of-app; sha = `334d4d7d...` / `efd3751d...` |

No data rollback exists or is needed: this release writes nothing to the database. The deploy/09 rollback chain (RB-1v, RB-2 to R2, RB-3) stays valid unchanged; RB-2 assumes R3 on 9011, so run `rb4_code` before any deploy/09 RB-2.

## V. How this runbook was verified (2026-11-05, read-only towards production)

Nothing below started or stopped a process, wrote to a database, or edited a file outside `$CK` and this runbook. Read-only towards production: two `psql_ro` queries (document languages), the module lists of the 9011/9051 listener processes, `sha256sum`/`grep` of the launchers.

| Check | Command (summary) | Result |
|---|---|---|
| Embedded copies | step-0.2 extractor on this file | 6 files extracted to `C:/Users/TRIAL/gsp-backups/chart-key-en-20261105-2043` (owner-only ACL inherited from `gsp-backups`); `tools/gate_tests.sh` sha = deploy/09's `09e57262...` |
| Gate tests (13) | `gate_tests.sh` for every function, both `r4_render_check` phases and three `r4_probe_doc` cases | 13 x `result=PASS`, 99 checks: r4_preflight 17, r4_build 13, r4_swap_core 16, r4_restart_r3 4, r4_launchers 11, r4_final 2, rb4_code 5, rb4_launchers 3, r4_render_check before 7 / after 8, r4_probe_doc before ID 4 / after ID 5 / after EN 4. Each forced failure left the record identical to the control run up to that check; `stop_listener 9011` and the start of R4 appear in the control record only after `window.ok` |
| Syntax | `bash -n` (steps.sh, gate_tests.sh, both oa `.sh`, every bash block of this file), `node --check key_probe.mjs`, `compile()` of `launcher_edit_r4.py` | 12 bash blocks OK; `node --check` OK; `compile()` OK; `key_probe.mjs` refuses a base other than `https://localhost:9011`, a malformed id and a missing secret (exit 2) |
| Launcher editor | `launcher_edit_r4.py --check` (in-app view) | pins match; lines [120, 121] LF 129 and [124] CRLF 177/177; compile OK; nothing written |
| Listener checkout predicate | `listener_roots 9011`, `9051` | `gsp-hq-prod-v21-r3`, `gsp-hq-prod-v21-r2` |
| Preflight predicates, dry (env.sh + this steps.sh sourced by hand, no `ck_open`) | each `r4_preflight` predicate run once through `chk`, outputs in `$CK/work/` | all `ok` except `runbook4.sha_recorded_in_decisions` (STOP, expected until the controller records it): no exported secret, ACL owner-only, 9011 r3, 9051 r2 and `200 after 1s`, R4 absent, tag present and descends, 15 changed files, no secret-like or `prisma/` file, diff secret scan hits=0, REPO HEAD = tag, src/scripts/prisma clean, closure 137 files disjoint from the change; probe document query: ID `cmw3g3q55000zv18shwwmrndc` (007/GSP/LAP/XI/2026), EN none |
| Probe block | engine-only run of `pureChartSvg` (P-03 fixture, datum) and `validateBlockV2` in REPO 62fd22f | ID KUNCI true; EN KEY true, KUNCI false; 0 schema issues |
| Preview route read-only | code reading at the tag (`route.ts`, `_lib/load.ts`, `_lib/figure.ts`, `resolveTemplate`, `require-session.ts`, `render-guard.ts`) | no job, file or DB write; in-memory rate bucket and one api log line |
| Secret scan | `secret_scan` of this runbook (deploy/09 tool, every secret key of the production `.env` by name) | keys=6, hits=0 |

Not verified here (needs the recorded sha256, a write, a process start or production traffic): `ck_open` itself (the sha256 of this file is not yet in `decisions.md`), `r4_preflight` end to end, the R4 build, the HTTP probe against 9011, the swap, the out-of-app launcher edit, `r4_swap`'s automatic recovery path (the wrapper is not gate-testable because its recovery depends on the flag file; its two parts `r4_swap_core` and `r4_restart_r3` are), and the EN branch on real data (no EN document exists in production; its checks are gate-tested through `r4_probe_doc after EN`).

## A. Embedded files

Step 0.2 extracts every block below to `$CK/<path>` and refuses to continue (writing nothing) unless each sha256 equals this table; `ck_open` re-hashes the extracted files in every shell. `tools/gate_tests.sh` is byte-identical to deploy/09's harness. If any block changes, regenerate its row (sha256 of the block content plus one trailing newline) and record the new runbook sha256 in `decisions.md`.

| File | sha256 |
|---|---|
| `tools/steps.sh` | `93b5f2a699be72a2e633f3e79c3ceec4f2f1810532b75a97227f531457b542f3` |
| `tools/gate_tests.sh` | `09e572622f0e46c2ea80572c3091ade0dc841b8f65488a01d2cdfc3b7326df20` |
| `tools/key_probe.mjs` | `a68c5b1f494dfa1b527e9d75141238ade89a7c047d6a1054661a787e6735b9c6` |
| `oa/launcher_edit_r4.py` | `22189f44202b6c4ab8a52a2c76d6ce00513adb0e9e98c15619462e8e0da7cff9` |
| `oa/launcher_edit_r4.sh` | `30825ca7f932ef06164b00a8a5554dfd8d90c4ac8cb0027f3cae238d0244d0e8` |
| `oa/launcher_restore_r4.sh` | `cc043288214b7f89e17778d6a22fdadba321da88b8114c708009870620452be5` |

<!-- file: tools/steps.sh -->
```bash
# steps.sh : deploy/11 (chart key-row label follows document language, code-only release R3 -> R4) as bash functions.
# Sourced by ck_open AFTER deploy/09's $BK/tools/env.sh (secrets in non-exported variables, pgx/psql_ro/db_guard/smoke/
# spawn_out/oa_run/stop_listener/window_ok ...). It sources deploy/09's steps.sh for the read-only predicates (chk, eq,
# same_file, has_line, lacks_line, path_absent, file_present, port_free, smoke_to, smoke_n, backup_acl_ok, real_eq_app,
# tag_present ...). Same contract as deploy/05/09 (M39-1): every check is `chk <label> <predicate...> || return 1`, every
# command that changes something is followed by `|| return 1`; tools/gate_tests.sh (byte-identical to deploy/09's) proves it.
# Hermes profiles, gateways, MCP servers and skills are NOT touched: they stay on R3 (MCP import closure unchanged).

D09=/c/Users/TRIAL/gsp-backups/datum-coverage-20261105-1636   # deploy/09 work folder (env.sh, steps.sh, sql/, oa/)
# shellcheck source=/dev/null
source "$D09/tools/steps.sh"
R3=/c/Users/TRIAL/gsp-hq-prod-v21-r3                # production on 9011 since 2026-11-05 17:11 (deploy/09 step 8)
R4=/c/Users/TRIAL/gsp-hq-prod-v21-r4                # new checkout from TAG4
TAG4=prod-v2.1-chart-key-en-20261105
R3_COMMIT=3ebe486966089674c62e942a009121ffc9678988
RUNBOOK4=/c/Users/TRIAL/gsp-swarm-hq-v2.1/docs/2026-10-22_doc_artifact_studio/deploy/11_chart_key_en_code_release.md
START_SHA_R3=334d4d7d45e558016c6b6df7a55cc0a3e84f350ffc3828e87a6b723651c38ba1    # gsp-ecosystem-start.sh after deploy/09 step 9
WATCHDOG_SHA_R3=efd3751d5cbfd8b8977a86dd6cf9ec1c46052021691118fcfdfb8218dbc98aca # watchdog-webui-hq.py after deploy/09 step 9
: "${CK:=$BK/ck}"                                    # ck_open sets CK; the gate-test sandbox falls back to $BK/ck
mkdir -p "$CK/logs" "$CK/work"
log() { echo "[$(date '+%F %T')] $*" | tee -a "$CK/logs/runbook.log"; }   # deploy/11 log (overrides env.sh's)

# ---- read-only predicates and helpers ------------------------------------------------------------------------------------
runbook4_recorded() { grep -qF "$(sha256sum < "$RUNBOOK4" | cut -c1-64)" "$DECISIONS"; }
listener_roots() { # <port> : distinct gsp-hq-prod-v21* checkout folders of the native modules loaded by the listener process
  local pid; pid=$(listener_pid "$1"); [ -n "$pid" ] || return 1
  powershell -NoProfile -NonInteractive -Command "(Get-Process -Id $pid -ErrorAction Stop).Modules | ForEach-Object { \$_.FileName } | Select-String -Pattern 'gsp-hq-prod-v21(-r[0-9]+)?' | ForEach-Object { \$_.Matches[0].Value } | Sort-Object -Unique" | tr -d '\r'
}
serves_from() { eq "$(listener_roots "$1" | paste -sd' ')" "$2"; }   # <port> <checkout folder name>
tag4_descends_r3() { git -C "$REPO" merge-base --is-ancestor "$R3_COMMIT" "$TAG4^{commit}"; }
tag4_diff_secret_free() { git -C "$REPO" diff "$R3_COMMIT" "$TAG4^{commit}" | secret_scan -; }
repo_at_tag4() { eq "$(git -C "$REPO" rev-parse HEAD)" "$(git -C "$REPO" rev-parse "$TAG4^{commit}")"; }
repo_code_clean() { eq "$(git -C "$REPO" status --porcelain -- src scripts prisma)" ""; }
closure_disjoint() { # <closure file> <changed files> : no changed file is in the MCP import closure
  local both; both=$(comm -12 <(sort "$1") <(sort "$2")); [ -z "$both" ] || { echo "  in closure and changed: $both"; return 1; }
}
r4_closure_code_eq_r3() { git -C "$R4" diff --quiet "$R3_COMMIT" HEAD -- $(cat "$CK/logs/mcp_closure_r4.txt"); }
r4_certs_identical() { cmp -s "$R3/certs/hq-cert.pem" "$R4/certs/hq-cert.pem" && cmp -s "$R3/certs/hq-key.pem" "$R4/certs/hq-key.pem"; }
r4_env_ignored() { git -C "$R4" check-ignore -q .env && git -C "$R4" check-ignore -q certs/hq-key.pem; }   # R-X1
r4_unit_tests() { # the fix's own test file plus the `latest` constant test (deploy/09 S10), both in R4
  (cd "$R4" && node node_modules/vitest/vitest.mjs run tests/unit/studio/figures/chart-key-label-en.test.ts) > "$CK/logs/r4_unit_key.txt" 2>&1 \
    && grep -qE 'Test Files +1 passed' "$CK/logs/r4_unit_key.txt" && ! grep -qE '[0-9]+ failed' "$CK/logs/r4_unit_key.txt" \
    && (cd "$R4" && node node_modules/vitest/vitest.mjs run tests/unit/studio/mcp/implw2-client.test.ts -t S10) > "$CK/logs/r4_unit_latest.txt" 2>&1 \
    && grep -qE 'Tests +2 passed' "$CK/logs/r4_unit_latest.txt"
}
prisma_r4() { local db="$1"; shift; (cd "$R4" && DATABASE_URL="$(db_url "$db")" node node_modules/prisma/build/index.js "$@"); }
phase_ok() { case "$1" in before|after) return 0;; *) echo "  phase must be before or after"; return 1;; esac; }
probe_args_ok() { phase_ok "$1" && case "$2" in ID|EN) [[ $3 =~ ^[a-z0-9]{20,40}$ ]];; *) false;; esac; }
probe4() { # <documentId> <out prefix> [revisionNo] : read-only figure preview probe on 9011 (tools/key_probe.mjs)
  (cd "$CK/tools" && INTERNAL_API_SECRET="$_SECRET" NODE_EXTRA_CA_CERTS="$R3/certs/hq-cert.pem" node "$CK/tools/key_probe.mjs" https://localhost:9011 "$1" "$2" "${3:-}")
}
json_str() { grep -oE "\"$2\":\"[a-z0-9]+\"" "$1" 2>/dev/null | head -1 | cut -d'"' -f4; }   # <json file> <key>
json_num() { grep -oE "\"$2\":[0-9]+" "$1" 2>/dev/null | head -1 | cut -d: -f2; }
DOC_SQL="select d.id from \"StudioDocument\" d join \"StudioTemplate\" t on t.id = d.\"templateId\" where not d.archived and t.slug like 'datum-%' and d.language ="

# ---- preflight (read-only) -----------------------------------------------------------------------------------------------
r4_preflight() {
  log "r4 preflight start"
  chk runbook4.sha_recorded_in_decisions runbook4_recorded || return 1
  chk env.no_exported_secret no_secret_env || return 1
  chk ck.acl_owner_only backup_acl_ok "$CK" || return 1
  chk port.9011_serves_r3 serves_from 9011 gsp-hq-prod-v21-r3 || return 1
  chk port.9051_serves_r2 serves_from 9051 gsp-hq-prod-v21-r2 || return 1
  chk port.9051_answers wait_http https://127.0.0.1:9051/login 15 || return 1
  chk r4.absent path_absent "$R4" || return 1
  chk tag4.present tag_present "$TAG4" || return 1
  chk tag4.descends_from_r3 tag4_descends_r3 || return 1
  git -C "$REPO" diff --name-only "$R3_COMMIT" "$TAG4^{commit}" > "$CK/logs/tag4_changed_files.txt" || return 1
  chk tag4.changes_something file_present "$CK/logs/tag4_changed_files.txt" || return 1
  chk tag4.no_secret_files lacks_line "$CK/logs/tag4_changed_files.txt" '(^|/)\.env($|\.)|\.pem$|\.key$|\.dump$|\.p12$|\.pfx$|(^|/)certs/' || return 1
  chk tag4.no_migration_or_schema lacks_line "$CK/logs/tag4_changed_files.txt" '^prisma/' || return 1
  chk tag4.no_secret_values tag4_diff_secret_free || return 1
  chk repo.head_is_tag4 repo_at_tag4 || return 1
  chk repo.code_paths_clean repo_code_clean || return 1
  (cd "$REPO" && node "$BK/tools/mcp_closure.mjs" .) > "$CK/logs/mcp_closure_tag4.txt" || return 1
  chk mcp.closure_listed file_present "$CK/logs/mcp_closure_tag4.txt" || return 1
  chk mcp.closure_untouched_by_tag4 closure_disjoint "$CK/logs/mcp_closure_tag4.txt" "$CK/logs/tag4_changed_files.txt" || return 1
  procs "$CK/logs/procs_r4_00.txt" || return 1
  log "r4 preflight ok: $(grep -c . "$CK/logs/tag4_changed_files.txt") files changed since r3, MCP closure $(grep -c . "$CK/logs/mcp_closure_tag4.txt") files, none changed"
}

# ---- build (R4 checkout) -------------------------------------------------------------------------------------------------
r4_build() {
  local out head tagc
  chk r4.absent path_absent "$R4" || return 1
  chk env.no_exported_secret no_secret_env || return 1
  git clone --no-hardlinks -c core.autocrlf=false "$REPO" "$R4" > "$CK/logs/r4_clone.txt" 2>&1 || return 1
  git -C "$R4" checkout -b prod-v21-r4 "$TAG4" >> "$CK/logs/r4_clone.txt" 2>&1 || return 1
  out=$(git -C "$R4" config core.autocrlf) || return 1
  chk r4.autocrlf_false eq "$out" false || return 1
  head=$(git -C "$R4" rev-parse HEAD) || return 1
  tagc=$(git -C "$REPO" rev-parse "$TAG4^{commit}") || return 1
  chk r4.head_is_tag eq "$head" "$tagc" || return 1
  cp -p "$R3/.env" "$R4/.env" || return 1
  mkdir -p "$R4/certs" || return 1
  cp -p "$R3/certs/hq-key.pem" "$R3/certs/hq-cert.pem" "$R4/certs/" || return 1
  chk r4.env_identical cmp -s "$R3/.env" "$R4/.env" || return 1
  chk r4.certs_identical r4_certs_identical || return 1
  out=$(git -C "$R4" status --short) || return 1
  chk r4.status_clean eq "$out" "" || return 1
  chk r4.env_ignored r4_env_ignored || return 1
  (cd "$R4" && node "$BK/tools/mcp_closure.mjs" .) > "$CK/logs/mcp_closure_r4.txt" || return 1
  chk r4.closure_listed file_present "$CK/logs/mcp_closure_r4.txt" || return 1
  chk r4.closure_untouched_by_tag4 closure_disjoint "$CK/logs/mcp_closure_r4.txt" "$CK/logs/tag4_changed_files.txt" || return 1
  chk r4.closure_code_eq_r3 r4_closure_code_eq_r3 || return 1
  chk env.no_exported_secret_before_npm no_secret_env || return 1
  (cd "$R4" && npm ci) > "$CK/logs/r4_npm_ci.txt" 2>&1 || { tail -20 "$CK/logs/r4_npm_ci.txt"; echo "STOP npm ci"; return 1; }
  (cd "$R4" && npm run build) > "$CK/logs/r4_build.txt" 2>&1 || { tail -20 "$CK/logs/r4_build.txt"; echo "STOP build"; return 1; }
  (cd "$R4" && node node_modules/typescript/bin/tsc --noEmit) > "$CK/logs/r4_tsc.txt" 2>&1 || { tail -20 "$CK/logs/r4_tsc.txt"; echo "STOP tsc"; return 1; }
  chk r4.unit_tests r4_unit_tests || return 1
  log "r4 built BUILD_ID=$(cat "$R4/.next/BUILD_ID")"
}

# ---- read-only render proof through the figure preview route (no document, job, file or DB row is written) ----------------
r4_probe_doc() { # <before|after> <ID|EN> <documentId> [revisionNo]
  local ph="$1" lang="$2" id="$3" rev="${4:-}" P="$CK/logs/probe_$1_$2"
  chk "probe.$ph.$lang.args" probe_args_ok "$ph" "$lang" "$id" || return 1
  chk "probe.$ph.$lang.rendered" probe4 "$id" "$P" "$rev" || return 1
  case "$ph:$lang" in
    before:*)
      chk "probe.$ph.$lang.draws_kunci" has_line "$P.json" '"kunci":true' || return 1
      chk "probe.$ph.$lang.no_key" has_line "$P.json" '"key":false' || return 1;;
    after:ID)
      chk "probe.$ph.$lang.draws_kunci" has_line "$P.json" '"kunci":true' || return 1
      chk "probe.$ph.$lang.no_key" has_line "$P.json" '"key":false' || return 1
      chk "probe.$ph.$lang.svg_identical_to_r3" same_file "$CK/logs/probe_before_ID.svg" "$P.svg" || return 1;;
    after:EN)
      chk "probe.$ph.$lang.draws_key" has_line "$P.json" '"key":true' || return 1
      chk "probe.$ph.$lang.no_kunci" has_line "$P.json" '"kunci":false' || return 1;;
  esac
  log "probe $ph $lang ok (document $id)"
}
r4_render_check() { # <before|after> : before = R3 on 9011 (baseline), after = R4 on 9011; same documents and revisions
  local ph="$1" id="" en="" rid="" ren=""
  chk probe.phase_valid phase_ok "$ph" || return 1
  if [ "$ph" = before ]; then
    chk probe.9011_serves_r3 serves_from 9011 gsp-hq-prod-v21-r3 || return 1
    id=$(psql_ro "$PROD_DB" -c "$DOC_SQL 'ID' order by d.\"createdAt\" desc limit 1") || return 1
    en=$(psql_ro "$PROD_DB" -c "$DOC_SQL 'EN' order by d.\"createdAt\" desc limit 1") || return 1
  else
    chk probe.9011_serves_r4 serves_from 9011 gsp-hq-prod-v21-r4 || return 1
    id=$(json_str "$CK/logs/probe_before_ID.json" documentId); rid=$(json_num "$CK/logs/probe_before_ID.json" revisionNo)
    en=$(json_str "$CK/logs/probe_before_EN.json" documentId); ren=$(json_num "$CK/logs/probe_before_EN.json" revisionNo)
  fi
  chk probe.id_doc_found eq "${id:+found}" found || return 1
  r4_probe_doc "$ph" ID "$id" "$rid" || return 1
  if [ -z "$en" ]; then
    log "probe $ph: no non-archived EN production document on a datum template; EN probe skipped (ID proof only)"
  else
    r4_probe_doc "$ph" EN "$en" "$ren" || return 1
  fi
  log "r4_render_check $ph ok"
}

# ---- code swap on 9011 (9051 R2 standby untouched) -------------------------------------------------------------------------
r4_swap_core() {
  local old_pid standby t0 t1
  chk swap.not_run_before path_absent "$CK/logs/r4_9011_stopped.flag" || return 1
  chk r4.built file_present "$R4/.next/BUILD_ID" || return 1
  chk probe.baseline_present file_present "$CK/logs/probe_before_ID.json" || return 1
  chk port.9011_serves_r3 serves_from 9011 gsp-hq-prod-v21-r3 || return 1
  old_pid=$(listener_pid 9011); standby=$(listener_pid 9051)
  chk smoke.before smoke_to https://localhost:9011 "$CK/logs/smoke_r4_before.txt" || return 1
  chk smoke.before_18 smoke_n "$CK/logs/smoke_r4_before.txt" 18 || return 1
  psql_ro "$PROD_DB" -f "$BK/sql/old_templates_fp.sql" > "$CK/logs/prod_old_templates_r4a.txt" || return 1
  psql_ro "$PROD_DB" -f "$BK/sql/heads10_fp.sql" > "$CK/logs/prod_heads10_r4a.txt" || return 1
  chk window.ok window_ok || return 1
  t0=$(date '+%T.%N')
  stop_listener 9011 || return 1
  date '+%F %T' > "$CK/logs/r4_9011_stopped.flag" || return 1
  spawn_out "$BK/oa/start-hq2.sh $R4 $ECO/hq-r4.log - - - -" || { echo "STOP start of R4 failed"; return 1; }
  wait_http https://localhost:9011/login 90 || { echo "STOP no 200 from R4 on 9011"; return 1; }
  t1=$(date '+%T.%N'); log "r4 downtime $t0 -> $t1; old pid $old_pid; 9011 now pid $(listener_pid 9011)"
  chk smoke.after smoke_to https://localhost:9011 "$CK/logs/smoke_r4_after.txt" || return 1
  chk templates.same_list same_file <(grep '"S-5"' "$CK/logs/smoke_r4_before.txt") <(grep '"S-5"' "$CK/logs/smoke_r4_after.txt") || return 1
  chk port.9011_serves_r4 serves_from 9011 gsp-hq-prod-v21-r4 || return 1
  psql_ro "$PROD_DB" -f "$BK/sql/old_templates_fp.sql" > "$CK/logs/prod_old_templates_r4b.txt" || return 1
  psql_ro "$PROD_DB" -f "$BK/sql/heads10_fp.sql" > "$CK/logs/prod_heads10_r4b.txt" || return 1
  chk prod.templates_untouched same_file "$CK/logs/prod_old_templates_r4a.txt" "$CK/logs/prod_old_templates_r4b.txt" || return 1
  chk prod.heads_untouched same_file "$CK/logs/prod_heads10_r4a.txt" "$CK/logs/prod_heads10_r4b.txt" || return 1
  chk prod.db_guard db_guard "$PROD_DB" || return 1
  prisma_r4 "$PROD_DB" migrate status > "$CK/logs/prod_migrate_r4.txt" 2>&1 || { cat "$CK/logs/prod_migrate_r4.txt"; return 1; }
  chk prod.schema_up_to_date has_line "$CK/logs/prod_migrate_r4.txt" 'Database schema is up to date' || return 1
  chk standby.9051_untouched eq "$(listener_pid 9051)" "$standby" || return 1
  chk r4.log_no_request_error lacks_line "$ECO/hq-r4.log" 'request error' || return 1
  log "r4 swap ok"
}
r4_restart_r3() { # R3 back on 9011 (port must already be free); used by r4_swap's recovery and by rb4_code
  chk port.9011_free port_free 9011 || return 1
  spawn_out "$BK/oa/start-hq2.sh $R3 $ECO/hq-r3.log - - - -" || return 1
  wait_http https://localhost:9011/login 90 || return 1
  chk r3back.smoke smoke_to https://localhost:9011 "$CK/logs/smoke_r3_back.txt" || return 1
  chk r3back.smoke_18 smoke_n "$CK/logs/smoke_r3_back.txt" 18 || return 1
  chk r3back.serves_r3 serves_from 9011 gsp-hq-prod-v21-r3 || return 1
  log "R3 back on 9011 pid $(listener_pid 9011)"
}
r4_swap() { # wrapper: r4_swap_core; if it fails AFTER 9011 was stopped, R3 is put back on 9011 automatically, then STOP
  r4_swap_core && return 0
  if [ -f "$CK/logs/r4_9011_stopped.flag" ]; then
    echo "STOP r4_swap failed after the 9011 stop: restoring R3 on 9011 now"
    if stop_listener 9011 && r4_restart_r3; then echo "STOP: production is back on R3 (rb4_code done); do not continue"; else echo "STOP: R3 restore FAILED; run rb4_code manually"; fi
  fi
  return 1
}

# ---- launchers to R4 (out-of-app, sha-pinned to the deploy/09 r3 state) ----------------------------------------------------
r4_launchers() {
  local S=/c/Users/TRIAL/gsp-ecosystem/gsp-ecosystem-start.sh W=/c/Users/TRIAL/AppData/Local/hermes/scripts/watchdog-webui-hq.py
  chk port.9011_serves_r4 serves_from 9011 gsp-hq-prod-v21-r4 || return 1
  oa_run "$CK/logs/realcheck_r4_before.txt" 60 "$D09/oa/realcheck.sh $CK r4_before" || return 1
  chk launcher.start_at_r3_state has_line "$CK/logs/realcheck_r4_before.txt" "^$START_SHA_R3 " || return 1
  chk launcher.watchdog_at_r3_state has_line "$CK/logs/realcheck_r4_before.txt" "^$WATCHDOG_SHA_R3 " || return 1
  oa_run "$CK/logs/launcher_edit_r4.txt" 60 "$CK/oa/launcher_edit_r4.sh $CK" || return 1
  chk launcher.start_edited has_line "$CK/logs/launcher_edit_r4.txt" '^edited .*gsp-ecosystem-start\.sh ' || return 1
  chk launcher.watchdog_edited has_line "$CK/logs/launcher_edit_r4.txt" '^edited .*watchdog-webui-hq\.py ' || return 1
  chk launcher.bash_n has_line "$CK/logs/launcher_edit_r4.txt" '^bash -n start\.sh OK' || return 1
  chk launcher.compile has_line "$CK/logs/launcher_edit_r4.txt" '^watchdog compile OK' || return 1
  oa_run "$CK/logs/realcheck_r4_after.txt" 60 "$D09/oa/realcheck.sh $CK r4_after" || return 1
  REAL_VIEW="$CK/logs/realcheck_r4_after.txt"
  chk launcher.real_view_eq_app_view real_eq_app "$S" "$W" || return 1
  chk launcher.no_r3_path_left lacks_line "$REAL_VIEW" 'gsp-hq-prod-v21-r3' || return 1
  chk launcher.three_r4_lines eq "$(grep -c 'gsp-hq-prod-v21-r4' "$REAL_VIEW")" 3 || return 1
  chk launcher.hermes_still_r3 eq "$(grep -c 'r2_refs=0 r3_refs=3' "$REAL_VIEW")" 16 || return 1
  log "r4 launchers -> R4"
}
r4_final() { # evidence only: MCP inventory (gateways stay on R3), secret scan of the deploy/11 logs and hq-r4.log
  procs "$CK/logs/procs_r4_final.txt" || return 1
  chk mcp.no_old_or_unknown has_line "$CK/logs/procs_r4_final.txt" '^OLD_MCP=0 R2_MCP=[0-9]+ R3_MCP=[0-9]+ REPO_MCP=[0-9]+ UNKNOWN_MCP=0$' || return 1
  chk secrets.r4 secret_scan "$CK/logs" "$ECO/hq-r4.log" || return 1
  log "r4 final: $(tail -1 "$CK/logs/procs_r4_final.txt")"
}

# ---- rollback RB-4 -------------------------------------------------------------------------------------------------------
rb4_code() { # R4 off 9011, R3 back on 9011 (9051 untouched)
  chk window.ok window_ok || return 1
  stop_listener 9011 || return 1
  r4_restart_r3 || return 1
  log "RB-4 code: R3 on 9011"
}
rb4_launchers() { # launchers back to their deploy/09 r3 state from the .bak-20261105-chart-key-en files, out-of-app
  oa_run "$CK/logs/launcher_restore_r4.txt" 60 "$CK/oa/launcher_restore_r4.sh $CK" || return 1
  chk rb4.start_sha has_line "$CK/logs/launcher_restore_r4.txt" "^$START_SHA_R3 " || return 1
  chk rb4.watchdog_sha has_line "$CK/logs/launcher_restore_r4.txt" "^$WATCHDOG_SHA_R3 " || return 1
  oa_run "$CK/logs/realcheck_rb4.txt" 60 "$D09/oa/realcheck.sh $CK rb4" || return 1
  chk rb4.real_view_r3 has_line "$CK/logs/realcheck_rb4.txt" "^$START_SHA_R3 " || return 1
  log "RB-4 launchers restored (r3 state)"
}
```

<!-- file: tools/gate_tests.sh -->
```bash
#!/usr/bin/env bash
# gate_tests.sh <step function> [args...] : deploy/09 copy of the deploy/05 harness. M39-1 proof without side effects. Sources steps.sh in a subshell sandbox and
# replaces every command that could touch a database, a process, git, npm, the network or a file outside the sandbox
# with a recorder; `chk` is replaced by a version that records the label and fails only the label under test.
#   run 0 (control): every check passes, so the step's whole command sequence is recorded and the step returns 0;
#   run i: check i is forced to fail (as if `false` were its predicate); the record must equal the control record up to
#          and including that check, followed by RC 1, i.e. NO later command ran.
# Exit 0 = every check of the step stops it. Sandbox under ${GATE_SANDBOX_ROOT:-$HOME} (never C:\tmp, L39-7).
set -u
HERE=$(cd "$(dirname "$0")" && pwd)
STEP="$1"; shift
STEP_ARGS=("$@")
SB=$(mktemp -d "${GATE_SANDBOX_ROOT:-$HOME}/gate-test-$STEP.XXXXXX") || exit 2
STUBS="git npm npx node psql pg_dump pg_restore taskkill cp mkdir chmod sed sha256sum curl powershell icacls cmp sleep cygpath
  on_db psql_ro restore_into db_guard pgx spawn_out wait_http wait_log smoke rd procs stop_listener stop_bridge listener_pid
  bridge_pids secret_scan no_other_sessions latest_unit_test seed_run prisma_r3 hermes py cat write_import_vars oa_run show_anchors
  pin doc_id_in doc_pin heads_json rb1v_run"

run_case() { # <label to fail, or -> : writes $SB/rec.<n>
  local fail="$1" rec="$2"
  (
    BK="$SB/bk"; ECO="$SB/eco"; WORK="$BK/work"
    mkdir -p "$BK/logs" "$BK/sql" "$BK/oa" "$BK/tools" "$BK/export" "$BK/gladi/r2" "$BK/gladi/r3" "$BK/prod-smoke" "$WORK" "$ECO"
    REPO=/sandbox/repo OLD=/sandbox/old R2=/sandbox/r2 R3=/sandbox/r3 R2_COMMIT=0000000 ASSETS=/sandbox/assets DECISIONS=/sandbox/decisions.md RUNBOOK=/sandbox/rb.md
    PY=py HERMES=hermes TAG=tag-under-test PRESET_SLUG=datum-gsp-rev-a-preset SMOKE_MISSION=2026-11-05_datum-coverage-prod-smoke SMOKE_SLUG=datum-nota
    PROD_DB=gsp_agent_hq CLONE_DB=gsp_agent_hq_v21_seedtest MAINT_DB=postgres RWS_R3=/sandbox/w1 RWS_R2=/sandbox/w2 RWS_SEED=/sandbox/w3
    TS=test DUMP="$BK/dump.dump"
    # shellcheck source=/dev/null
    source "$HERE/steps.sh"
    REC="$rec"; : > "$REC"
    _rec() { echo "RAN $*" >> "$REC"; return 0; }
    for c in $STUBS; do eval "$c() { _rec $c \"\$@\"; }"; done
    cd() { _rec cd "$@"; }
    log() { echo "LOG $*" >> "$REC"; }
    window_ok() { _rec window_ok; }
    date() { echo 20261104-000000; }   # deterministic record (timestamps in file names and logs)
    chk() { local l="$1"; shift; echo "CHK $l" >> "$REC"; [ "$l" = "$fail" ] && return 1; return 0; }
    "$STEP" "${STEP_ARGS[@]}" > "$REC.out" 2>&1
    echo "RC $?" >> "$REC"
  )
}

run_case - "$SB/rec.0"
if ! tail -1 "$SB/rec.0" | grep -qx 'RC 0'; then echo "FAIL $STEP: control run did not reach the end"; tail -5 "$SB/rec.0"; exit 1; fi
mapfile -t LABELS < <(sed -n 's/^CHK //p' "$SB/rec.0")
[ "${#LABELS[@]}" -gt 0 ] || { echo "FAIL $STEP: no checks"; exit 1; }
bad=0; i=0
for l in "${LABELS[@]}"; do
  i=$((i + 1))
  run_case "$l" "$SB/rec.$i"
  n=$(grep -nx "CHK $l" "$SB/rec.0" | head -1 | cut -d: -f1)
  if diff -q <(head -n "$n" "$SB/rec.0"; echo "RC 1") "$SB/rec.$i" > /dev/null; then
    echo "pass $STEP: forced failure of [$l] stops the step ($(( $(wc -l < "$SB/rec.0") - n - 1 )) later commands/checks not run)"
  else
    echo "FAIL $STEP: forced failure of [$l] did not stop the step"; diff <(head -n "$n" "$SB/rec.0"; echo "RC 1") "$SB/rec.$i" | head -5; bad=1
  fi
done
echo "summary $STEP: ${#LABELS[@]} checks, control commands=$(grep -c '^RAN ' "$SB/rec.0"), result=$([ $bad = 0 ] && echo PASS || echo FAIL), sandbox=$SB"
exit $bad
```

<!-- file: tools/key_probe.mjs -->
```js
// key_probe.mjs <base> <documentId> <out prefix> [revisionNo] : deploy/11 read-only proof of the chart key-row label.
// POSTs one inline chart block (P-03, two series: the engine draws the KEY/KUNCI row) to the figure preview route
// FIG-03b `POST /api/studio/documents/<id>/figures/preview` with svg: true. The route writes no job, file or DB row
// (route.ts header, D-322; _lib/load.ts = two findUnique + resolveTemplate); it only counts one render-rate hit and writes
// one api log line. Output: <prefix>.svg (chart only) and <prefix>.json {documentId, status, rendered, revisionNo, code,
// kunci, key, svgBytes, svgSha256, error}. The secret comes from env INTERNAL_API_SECRET and is only sent as a header.
import crypto from "node:crypto";
import fs from "node:fs";
const [base, id, prefix, rev] = process.argv.slice(2);
if (base !== "https://localhost:9011") { console.error("refusing: base must be https://localhost:9011"); process.exit(2); }
if (!/^[a-z0-9]{20,40}$/.test(id ?? "") || !prefix) { console.error("usage: key_probe.mjs <base> <documentId> <out prefix> [revisionNo]"); process.exit(2); }
if (rev !== undefined && rev !== "" && !/^[1-9][0-9]{0,6}$/.test(rev)) { console.error("revisionNo must be a positive integer"); process.exit(2); }
const S = process.env.INTERNAL_API_SECRET ?? "";
if (S.trim() === "") { console.error("INTERNAL_API_SECRET missing"); process.exit(2); }
const block = {
  type: "chart", code: "P-03",
  data: { shape: "series", categories: ["Kamera", "Perekam", "Sakelar"], series: [{ name: "Penawaran A", values: [405.5, 372, 248.8] }, { name: "Penawaran B", values: [389, 398.5, 229.6] }] },
  caption: { text: "Probe baris kunci rilis" }, source: { text: "Uji rilis deploy/11, tidak disimpan" },
};
const body = { block, svg: true, ...(rev ? { revisionNo: Number(rev) } : {}) };
let status = 0, j = null;
try {
  const r = await fetch(`${base}/api/studio/documents/${id}/figures/preview`, { method: "POST", redirect: "manual", headers: { "x-internal-secret": S, "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(body) });
  status = r.status;
  try { j = JSON.parse(await r.text()); } catch { j = null; }
} catch (e) { console.error(`request failed: ${String(e).split(S).join("<redacted>")}`); }
const svg = typeof j?.figure?.svg === "string" ? j.figure.svg : "";
fs.writeFileSync(`${prefix}.svg`, svg);
const out = { documentId: id, status, rendered: j?.rendered === true, revisionNo: Number.isInteger(j?.revisionNo) ? j.revisionNo : null, code: j?.figure?.rendered?.code ?? null,
  kunci: svg.includes(">KUNCI<"), key: svg.includes(">KEY<"), svgBytes: Buffer.byteLength(svg, "utf8"), svgSha256: crypto.createHash("sha256").update(svg).digest("hex"), error: j?.error?.code ?? null };
fs.writeFileSync(`${prefix}.json`, JSON.stringify(out) + "\n");
console.log(JSON.stringify(out));
process.exit(status === 200 && out.rendered && svg.length > 0 ? 0 : 1);
```

<!-- file: oa/launcher_edit_r4.py -->
```python
# launcher_edit_r4.py [--check] : deploy/11 r4_launchers. Byte-exact edit of the two persistent HQ launchers from the r3
# checkout to the r4 checkout on exactly the lines deploy/09 step 9 changed: gsp-ecosystem-start.sh line 120
# (hq_restart.mjs comment) and line 121 (cd), watchdog-webui-hq.py line 124 (cwd). Each file is sha256-pinned to its state
# after deploy/09 step 9 and every anchor must match exactly once. Original EOL kept (start.sh LF, watchdog CRLF). Backup
# suffix .bak-20261105-chart-key-en. Everything is verified before anything is written; --check writes nothing.
# Run out-of-app (AppData writes from inside the Claude app are virtualized).
import hashlib, os, shutil, sys

CHECK = "--check" in sys.argv
TAG = ".bak-20261105-chart-key-en"
FILES = [
    (r"C:\Users\TRIAL\gsp-ecosystem\gsp-ecosystem-start.sh",
     "334d4d7d45e558016c6b6df7a55cc0a3e84f350ffc3828e87a6b723651c38ba1",
     [(b"  # JANGAN pakai gsp-datacenter/scripts/hq_restart.mjs (menghidupkan kode LAMA); pakai node C:/Users/TRIAL/gsp-hq-prod-v21-r3/scripts/hq_restart.mjs\n",
       b"  # JANGAN pakai gsp-datacenter/scripts/hq_restart.mjs (menghidupkan kode LAMA); pakai node C:/Users/TRIAL/gsp-hq-prod-v21-r4/scripts/hq_restart.mjs\n"),
      (b'  cd "C:/Users/TRIAL/gsp-hq-prod-v21-r3" || exit 1\n',
       b'  cd "C:/Users/TRIAL/gsp-hq-prod-v21-r4" || exit 1\n')]),
    (r"C:\Users\TRIAL\AppData\Local\hermes\scripts\watchdog-webui-hq.py",
     "efd3751d5cbfd8b8977a86dd6cf9ec1c46052021691118fcfdfb8218dbc98aca",
     [(b'        cwd=r"C:\\Users\\TRIAL\\gsp-hq-prod-v21-r3", stdout=logf, stderr=logf,\r\n',
       b'        cwd=r"C:\\Users\\TRIAL\\gsp-hq-prod-v21-r4", stdout=logf, stderr=logf,\r\n')]),
]
LINES = {0: [120, 121], 1: [124]}   # 1-based numbers of the lines that must be the changed ones


def sha(b):
    return hashlib.sha256(b).hexdigest()


plan = []
for i, (path, want, pairs) in enumerate(FILES):
    data = open(path, "rb").read()
    if sha(data) != want:
        sys.exit("STOP %s: sha256 %s != expected %s" % (path, sha(data), want))
    if os.path.exists(path + TAG):
        sys.exit("STOP %s already exists" % (path + TAG))
    out = data
    for old, new in pairs:
        if out.count(old) != 1:
            sys.exit("STOP %s: anchor count %d for %r" % (path, out.count(old), old[:60]))
        out = out.replace(old, new)
    changed = [n + 1 for n, (a, b) in enumerate(zip(data.split(b"\n"), out.split(b"\n"))) if a != b]
    if changed != LINES[i] or data.count(b"\n") != out.count(b"\n") or data.count(b"\r\n") != out.count(b"\r\n"):
        sys.exit("STOP %s: expected changed lines %s with EOL kept, got %s" % (path, LINES[i], changed))
    plan.append((path, data, out))
    print("plan %s: lines %s, CRLF=%d LF=%d" % (path, changed, out.count(b"\r\n"), out.count(b"\n")))
compile(plan[1][2].decode("utf-8"), plan[1][0], "exec")
print("compile check of the edited watchdog OK")
if CHECK:
    print("--check: nothing written")
    sys.exit(0)
for path, data, out in plan:
    shutil.copy2(path, path + TAG)
    if sha(open(path + TAG, "rb").read()) != sha(data):
        sys.exit("STOP backup mismatch " + path)
    with open(path, "wb") as fh:
        fh.write(out)
    print("edited %s sha256 %s -> %s backup %s" % (path, sha(data)[:16], sha(out)[:16], path + TAG))
```

<!-- file: oa/launcher_edit_r4.sh -->
```bash
#!/usr/bin/env bash
# launcher_edit_r4.sh <CK> <run id> : deploy/11 r4_launchers, run out-of-app via oa_run. Edits both launchers (python -I,
# byte-exact), then bash -n, a compile() check (no .pyc written), diffs and sha256. Output: $CK/logs/launcher_edit_r4.txt
set -u
CK="$1"; RID="$2"; OUT="$CK/logs/launcher_edit_r4.txt"; T=.bak-20261105-chart-key-en
PY="C:/Users/TRIAL/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe"
S=/c/Users/TRIAL/gsp-ecosystem/gsp-ecosystem-start.sh
W=/c/Users/TRIAL/AppData/Local/hermes/scripts/watchdog-webui-hq.py
{
  echo "run=$RID"
  echo "start $(date '+%F %T')"
  "$PY" -I "$CK/oa/launcher_edit_r4.py" || { echo "STOPPED (nothing written unless an 'edited' line is above)"; exit 1; }
  bash -n "$S" && echo "bash -n start.sh OK"
  "$PY" -I -c "import sys; compile(open(sys.argv[1], 'rb').read(), sys.argv[1], 'exec'); print('watchdog compile OK')" "$W"
  echo "== diff start.sh"; diff "$S$T" "$S"
  echo "== diff watchdog (CR stripped for display)"; diff --strip-trailing-cr "$W$T" "$W"
  echo "== EOL"; file "$S" "$W"
  sha256sum "$S" "$W" "$S$T" "$W$T"
  echo "end $(date '+%F %T')"
} > "$OUT" 2>&1
```

<!-- file: oa/launcher_restore_r4.sh -->
```bash
#!/usr/bin/env bash
# launcher_restore_r4.sh <CK> <run id> : deploy/11 rb4_launchers, run out-of-app via oa_run. Restores both launchers from
# .bak-20261105-chart-key-en (the deploy/09 r3 state) and shows sha256 (expected 334d4d7d... start.sh, efd3751d... watchdog).
set -u
CK="$1"; RID="$2"; OUT="$CK/logs/launcher_restore_r4.txt"; T=.bak-20261105-chart-key-en
S=/c/Users/TRIAL/gsp-ecosystem/gsp-ecosystem-start.sh
W=/c/Users/TRIAL/AppData/Local/hermes/scripts/watchdog-webui-hq.py
{
  echo "run=$RID"
  for f in "$S" "$W"; do
    [ -f "$f$T" ] || { echo "STOP missing $f$T"; exit 1; }
  done
  for f in "$S" "$W"; do cp -p "$f$T" "$f" && echo "restored $f"; done
  bash -n "$S" && echo "bash -n start.sh OK"
  sha256sum "$S" "$W"
  echo "done $(date '+%F %T')"
} > "$OUT" 2>&1
```
