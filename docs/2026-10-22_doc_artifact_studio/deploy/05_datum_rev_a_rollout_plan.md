---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: S37
date: 2026-11-04
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/02_structured_datum_rev_a.md
decisions: D-579..D-614 (authority D-591; Q-A..Q-H by D-596; runbook findings by D-612; security fixes by D-614)
revision: 3 (re-review fixes R-L1..R-L4 and I-R1, I-R3..I-R5 on top of revision 2 = sha 87da5dea...; revision 1 = 7d6f662e...)
status: needs-review (re-review PASS on revision 2; the revision-3 changes need a check of the changed blocks; nothing in it has been run against production)
---

# Runbook: DATUM Rev A production rollout (S41-S54, RB-0..RB-3)

Abbreviations. `<task>` = `docs/2026-10-22_doc_artifact_studio`. REPO = `C:/Users/TRIAL/gsp-swarm-hq-v2.1` (branch v2.1). OLD = `C:/Users/TRIAL/gsp-hq-prod-v21` (prod-v21 @ 3566486, serves 9011 today, becomes the rollback build). R2 = `C:/Users/TRIAL/gsp-hq-prod-v21-r2` (new checkout, D-596 Q-B). `$BK` = `C:/Users/TRIAL/gsp-backups/datum-rev-a-<ts>/`, `$WORK` = `$BK/work`. Database names are set once in `env.sh`: `PROD_DB=gsp_agent_hq`, `CLONE_DB=gsp_agent_hq_v21_seedtest` (allowed by the seed guard, `prisma/seed-studio.ts:150`), `MAINT_DB=postgres`.

## Summary

Every step is a bash function in `tools/steps.sh` (section A). Inside a step, every check is `chk <label> <predicate> || return 1` and every changing command is followed by `|| return 1`, so a failed check ends the step before anything after it runs, even when a whole block is pasted at once (M39-1). `tools/gate_tests.sh <step>` proves this for each step without side effects: it forces each check in turn to fail and verifies that no later command ran.

1. **Preparation, no production change (steps 0-7, RB-0).** Commit and tag locally (no push), build R2, take a verified dump, restore it into the clone, seed the 10 templates on the clone, rehearse out-of-app (R2 on 9031, the old build on 9051, both with temporary workspaces) including 10 renders + `latest` + B-FIX and RB-1, export only the rows the 10 templates own, then rehearse the import and the RB-3 restore on a fresh clone.
2. **Code before data (steps 8-10).** Swap 9011 to R2 (old build kept on loopback 9051), point the two launchers at R2 (3 lines, F-3), repoint the Hermes `studio` MCP in 5 profiles and restart the gateways. Hard gate before the import: `OLD_MCP=0` (no process runs the old MCP server; `latest` is computed in the MCP client, F-2).
3. **Data, then evidence (steps 11-13).** One-transaction import with in-transaction pre-checks and post-checks (counts and md5 row fingerprints must equal the export). Production smoke is ONE document (`datum-nota`, D-612), scored by S52 with the clone's B-FIX, then archived. `latest` in production is proven by `OLD_MCP=0` + datum-gsp present and active + the R2 unit test of the constant (no `latest` document). Full 10-template evidence comes from the rehearsal (S44/S45). S53 refreshes the Hermes skill.

Rollback: RB-1 (archive the 10 slugs, one transaction) always before RB-2 (code, launchers, Hermes config, gateways). RB-3 (full restore of the step-3 dump) is hard-gated: verified and hashed safety dump, all HQ and bridge processes stopped, zero other sessions, then `pg_restore --clean --single-transaction` (M39-3).

The security fixes are listed in section S, the re-review fixes in section R, both at the end. Before step 0 the controller records this file's sha256 in `decisions.md`; `bk_open` and `step0_preflight` refuse to run otherwise (L39-8, R-L3).

## 0. Production state when this runbook was written (read-only evidence)

All commands below were read-only (`default_transaction_read_only=on` for SQL; `netstat`, `Get-CimInstance Win32_Process`, file `sha256sum`). Secrets were loaded into variables and never printed. Re-checked 2026-11-04 ~21:50 WIB after the fixes: unchanged.

| Item | Command | Result (2026-11-04 ~20:30-21:50 WIB) |
|---|---|---|
| Listeners | `netstat -ano -p tcp` | 9011 PID 35600 (0.0.0.0), 9041 PID 31428 (127.0.0.1, gsp-datacenter standby, left alone except in RB-3), 9012 PID 19200, 9010 18068, 9021 10664 (DEV), 5433 6616. 9031 and 9051 free |
| HQ processes | `Get-CimInstance Win32_Process` | 35600 and 31428 = `node hq-server.mjs` |
| hermes-bridge | `bridge_pids` | node.exe PID 22680, command line exactly `"C:\Program Files\nodejs\node.exe" bridge.mjs`, parent 17248 `nohup.exe node bridge.mjs` (started by `gsp-ecosystem-start.sh` section 2; the watchdog also manages it). The working directory is not visible to a read-only process listing, so the bridge is identified by that exact command line |
| Old-checkout MCP servers | `procs_studio.sh` (R-L4 matcher) | 6 servers (each a `tsx\dist\cli.mjs` launcher plus a loader child): the gateways gsp-worker (26576), gsp-master01 (28944), gsp-worker-fast (34228), gsp-thinker (17624), and 2 Hermes sessions that are not gateways (parents `pythonw.exe` 19200 and `python.exe` 27528). `OLD_MCP=6 R2_MCP=0 REPO_MCP=0 UNKNOWN_MCP=0` at 22:4x. Steps 10-11 refuse until the 2 session servers have ended (do not kill USER processes, D-615) |
| DB identity | `db_guard gsp_agent_hq` | `gsp_agent_hq`, PostgreSQL 17.11, 26 MB; `DATABASE_URL` has no query string |
| Migrations | `select count(*), max(migration_name) from _prisma_migrations` | 8, `20261030220000_add_studio_contract`; REPO adds none |
| Studio rows | `sql/counts_all.sql` | StudioSectionType 52, StudioTemplate 7, StudioTemplateVersion 10, StudioTemplateSlot 43, StudioTemplateSlotParam 55, StudioTemplateSlotRoleFormat 0, StudioDocument 0, other Studio tables 0 |
| Templates | `sql/old_templates_fp.sql` | datum-gsp v2, datum-gsp-preset v1 (version `cmw1x5tcv000jv1ioogrvipe4`, paramsSha256 `0c4df1dd...`), datum-kanonik v2, datum-kanonik-preset v1, datum-manual-000 v2, datum-manual-000-preset v1, laporan-kerja-agen v1; none archived; datum-gsp active (`datum_gsp_active` passes) |
| The 10 new slugs | `sql/new10_fp.sql` | 0 rows in all 5 tables |
| Section types | `sql/sectiontypes_fp.sql` | 52 rows, md5 `6c51234e1fa241f159c75fe1afa0b99f`; `ruleIndex` exists |
| Triggers / generated columns on the 5 template tables | `pg_trigger`, `pg_attribute.attgenerated` | 0 / 0 |
| Clone DB | `pg_database` | absent |
| Launchers | `sha256sum`, `file` | `gsp-ecosystem-start.sh` LF, sha `3fc38f68...` (line 120 comment names `gsp-hq-prod-v21/scripts/hq_restart.mjs`, line 121 `cd "C:/Users/TRIAL/gsp-hq-prod-v21"`); `watchdog-webui-hq.py` CRLF, sha `d84a5d71...` (line 124 cwd) |
| Hermes configs | `hermes_repoint.py --check` | 5 profiles, CRLF, 3 old-checkout references each, `INTERNAL_API_SECRET: ${env:INTERNAL_API_SECRET}`; nothing else in Hermes references the old checkout |
| Hermes cron | `cron/jobs.json` | job `19ae9f96d588` "GSP Watchdog WebUI & HQ", `0 */3 * * *` |
| Installed skill | `sha256sum` | `howto-report.md` = repo; `SKILL.md` installed = "TERPASANG"; the repo copy is aligned by the controller (D-612 F-4) |
| Backup folder ACL | `icacls C:\Users\TRIAL\gsp-backups` | SYSTEM, Administrators, owner only (inherited by `$BK`) |
| Driver asset | `sha256sum` | `C:/Users/TRIAL/gsp-backups/datum-rev-a-rollout-assets/driver.ts` = `9bf43077...` (D-612) |

## 1. Conventions (apply to every step)

- **How to run.** Git Bash. In every new shell: define `bk_open` (step 0.3) and run it. It checks that this runbook's sha256 is recorded in `decisions.md`, re-hashes every extracted `$BK/tools`, `$BK/oa` and `$BK/sql` file against the section-A table, and only then sources `env.sh` and `steps.sh` (R-L3). Then call the step functions one at a time and read their output. A step prints `ok <label>` per passed check and ends with a `log` line; a failed check prints `STOP <label>` and the function returns 1. **Never continue after a non-zero return.**
- **Gate tests (M39-1).** Before running a step for real, run `GATE_SANDBOX_ROOT="$WORK" bash "$BK/tools/gate_tests.sh" <step>`; it must end `result=PASS`. It sources only `steps.sh`, replaces every command that could touch a database, process, git, npm, the network or a file outside its sandbox with a recorder, and forces each check to fail in turn (the `false` substitution); every forced failure must leave the record identical to the control run up to that check.
- **Secrets (L39-2).** `env.sh` keeps the DB credentials, `INTERNAL_API_SECRET` and `WEBUI_RBAC_TOKEN` in NON-exported shell variables, unexports any inherited secret names, and passes them only as a prefix to the one command that needs them (`pgx` for libpq tools, `db_url` for Prisma/seed, `smoke`, `rd`). `npm ci`, the build and tsc run after `no_secret_env` passes, so they see none. The MCP child of the driver gets the SDK default environment plus `NODE_EXTRA_CA_CERTS` and `INTERNAL_API_SECRET` only. No password appears on a command line; xtrace is refused.
- **Databases (L39-1).** `db_guard <db>`, `on_db <db> <cmd>` (guard, then the command with `PGDATABASE=<db>`), `psql_ro <db>` (guarded, `default_transaction_read_only=on`), `restore_into <db> <dump>` (guard and `-d` from the same variable), `db_url <db>`. Each database name exists once, in `env.sh`. Direct SQL writes to production happen only in step 11 (import), step 13 (archive the smoke document), RB-1 and RB-3; the only API write is the step-12 smoke document.
- **Secret scans (L39-3).** `secret_scan <paths>` checks every secret key present in the production `.env`, by key name (names matching SECRET/TOKEN/PASSWORD/KEY/PRIVATE/CREDENTIAL/AUTH, plus the password inside any `*_URL`/`DATABASE*`/`POSTGRES*` value); it prints key names and counts only. Used at steps 1 (staged diff), 6, 10, 12 and S54.
- **Out-of-app.** Production process starts, launcher edits, Hermes config edits, gateway restarts and skill copies go through `spawn_out "<script> <args>"` (WMI `Win32_Process.Create` of a hidden `bash -lc`, inline `-EncodedCommand`, no `-File`, execution policy untouched). L39-4: the argument must match `^[A-Za-z0-9_./:= -]+$`, and the WMI `ReturnValue` must be 0. Each launch goes through `oa_run <log> <seconds> "<script> <args>"` (R-L1): an existing log is moved aside (`.prev-<timestamp>`, nothing deleted), a fresh run id is passed as the script's last argument and written as its first log line (`run=<id>`), and `wait_log` accepts only a log that starts with that id and has a completion line; it fails on `STOP` or a non-zero `exit=`. `oa/realcheck.sh` shows the real (non-virtualized) AppData view.
- **Time window.** Every moment at which 9011 is empty (step 8 swap, RB-2, RB-3) is gated by `window_ok`: not :55-:05 around 00/03/06/09/12/15/18/21 (cron watchdog `0 */3`) and not Monday 04:00-05:59.
- **Work folders (L39-7).** Everything lives under `$BK` (owner-only ACL), including `$WORK` for clash.py and the gate-test sandboxes. Nothing uses `C:\tmp`. The rehearsal workspaces are `C:/Users/TRIAL/gsp-ws-gladi-*` (user profile, owner-only).
- **Integrity anchors (L39-8, R-L3).** The runbook sha256 is recorded in `decisions.md` and checked by `bk_open` in every shell and by step 0. The dump digest and the export/SQL manifest digests are written to `$BK/logs/anchors.txt` (outside the folders they protect, and copied into `runbook.log`); every check compares with the LAST digest recorded for its key (`anchor_is`), so a re-run of step 3 or 7 supersedes the earlier one. `show_anchors` prints the current anchors at the end of steps 3 and 7 and in RB-3; the controller copies them into `decisions.md`. `IMPORT_VARS.txt` is inside the hashed manifest.
- **Stop rule.** Before step 8 a stop leaves production unchanged (RB-0). From step 8 on, use section 14.

## Step 0. Files, environment, preflight (read-only)

```bash
# 0.1 run id + backup folder (once; a second run resumes the same folder)
TSF=/c/Users/TRIAL/gsp-backups/datum-rev-a.current
if [ ! -f "$TSF" ]; then date +%Y%m%d-%H%M > "$TSF"; fi && BK=/c/Users/TRIAL/gsp-backups/datum-rev-a-$(cat "$TSF") && mkdir -p "$BK" && echo "BK=$BK"
RUNBOOK=/c/Users/TRIAL/gsp-swarm-hq-v2.1/docs/2026-10-22_doc_artifact_studio/deploy/05_datum_rev_a_rollout_plan.md
PY=C:/Users/TRIAL/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe

# 0.2 extract the section-A files; verifies every sha256 first and writes nothing on any mismatch
"$PY" -I - "$RUNBOOK" "$BK" <<'PYX'
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
chmod +x "$BK"/oa/*.sh "$BK"/tools/*.sh

# 0.3 open the environment (R-L3): define bk_open once per shell, then run it; it verifies before it sources
bk_open() { # runbook sha recorded in decisions.md, every extracted file = section-A sha256, then env.sh + steps.sh
  local tsf=/c/Users/TRIAL/gsp-backups/datum-rev-a.current b
  local rb=/c/Users/TRIAL/gsp-swarm-hq-v2.1/docs/2026-10-22_doc_artifact_studio/deploy/05_datum_rev_a_rollout_plan.md
  local dec=/c/Users/TRIAL/gsp-swarm-hq-v2.1/docs/2026-10-22_doc_artifact_studio/decisions/decisions.md
  local pyb=C:/Users/TRIAL/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe
  [ -f "$tsf" ] || { echo "STOP: $tsf missing"; return 1; }
  b=/c/Users/TRIAL/gsp-backups/datum-rev-a-$(cat "$tsf")
  grep -qF "$(sha256sum < "$rb" | cut -c1-64)" "$dec" || { echo "STOP: runbook sha256 not recorded in decisions.md"; return 1; }
  "$pyb" -I -c 'import hashlib, pathlib, re, sys; md = open(sys.argv[1], encoding="utf-8").read(); bk = pathlib.Path(sys.argv[2]); want = dict(re.findall(r"^\| `([\w./-]+)` \| `([0-9a-f]{64})` \|$", md, re.M)); bad = [n for n, h in sorted(want.items()) if not (bk / n).is_file() or hashlib.sha256((bk / n).read_bytes()).hexdigest() != h]; print("tools_ok: %d files checked, %d mismatches %s" % (len(want), len(bad), " ".join(bad))); sys.exit(1 if bad or not want else 0)' "$rb" "$b" || { echo "STOP: extracted files differ from the runbook"; return 1; }
  source "$b/tools/env.sh" && source "$b/tools/steps.sh"
}
bk_open                  # Expect: tools_ok: 28 files checked, 0 mismatches; env OK ... secrets loaded=yes exported=none

# 0.4 gate tests of every step (no side effects; all must end result=PASS)
for s in step0_preflight step0_driver step1_commit step2_build step3_backup step4_clone step5_seed step6_rehearsal step7_export step7_import_rehearsal step8_swap step9_launchers step10_repoint step10_gate step11_import step12_smoke step13_skill step13_archive s54_secret_scan rb1_archive rb2_code rb2_config rb2_gate rb3_restore rb3_restart; do
  GATE_SANDBOX_ROOT="$WORK" bash "$BK/tools/gate_tests.sh" "$s" > "$BK/logs/gate_$s.txt" 2>&1; tail -1 "$BK/logs/gate_$s.txt"
done
GATE_SANDBOX_ROOT="$WORK" bash "$BK/tools/gate_tests.sh" gw_one gsp-worker 10 | tail -1

# 0.5 preflight and driver
step0_preflight          # runbook sha recorded in decisions.md, no exported secret, owner-only ACL, 9031/9051 free, R2 and clone absent, fingerprints, the 10 slugs absent
step0_driver             # copies the D-612 asset driver.ts (sha 9bf43077...) and derives rollout_driver.ts (sha d103ced3..., 16 replacements)
```

Expect: 28 extraction lines `OK`; `tools_ok: 28 files checked, 0 mismatches`; 26 gate-test lines `result=PASS`; `step0_preflight` and `step0_driver` end with their `log` line. If `clone.absent` stops, the clone may be dropped only with Q-9: `on_db "$MAINT_DB" psql -X -v ON_ERROR_STOP=1 -c "DROP DATABASE \"$CLONE_DB\""`.

## Step 1. Commit and local tag (S41; no push)

Preconditions: S38, S39 (re-review), S40 passed; D-612 F-4 applied by the controller (repo `SKILL.md` status = TERPASANG).

```bash
step1_commit
```

Checks, in order: `SKILL.md` has no `Status: DRAF` line; tag `prod-v2.1-datum-rev-a-20261104` absent; after `git add -A` (excluding `f070_backup`, F-8) the staged list is not empty, has no secret-like file (`.env`, `.pem`, `.key`, `.dump`, `.p12`, `.pfx`, `certs/`) and no `f070_backup`; `secret_scan` of the staged diff finds no secret value of any key. Only then `git commit` (message with the Co-Authored-By line) and `git tag`; afterwards the tag must point at the commit and `git status` may list only the untracked `f070_backup/`. Never `git push` (the remote `local-datacenter` must not receive anything either). If a check stops after `git add`, the files stay staged and nothing is committed (`git -C "$REPO" reset -q` unstages them).

## Step 2. R2 checkout and build (S42)

```bash
step2_build
```

Clone with `--no-hardlinks -c core.autocrlf=false`, branch `prod-v21-r2` at the tag; checks autocrlf=false and HEAD = tag; copies `.env` and certs without printing (checked with `cmp -s`), git status clean, `.env`/`certs/` ignored; `no_secret_env` again, then `npm ci`, `npm run build`, `tsc --noEmit` (each must exit 0). Production untouched.

## Step 3. Production backup (S43 part 1)

```bash
step3_backup
```

Owner-only ACL on `$BK`; `$DUMP` absent; `pg_dump` (guarded, custom format) to `$BK/gsp_agent_hq_$TS.dump`; `pg_restore --list` readable and its `TABLE DATA` count = the number of production tables; `SHA256SUMS`; the digest goes to `anchors.txt` and `show_anchors` prints it for `decisions.md`. This dump is the RB-3 point and the clone source. It is a full copy of production including personal data, OAuth tokens and password hashes: see section L for its handling.

## Step 4. Clone from the dump and migration status (S43 part 2)

```bash
step4_clone
```

Clone absent; dump sha ok; `CREATE DATABASE` via `on_db "$MAINT_DB"`; `restore_into "$CLONE_DB"`; Studio counts = dump; `prisma migrate status` from R2 with `DATABASE_URL` for the clone in that command only: must say "Database schema is up to date" and name the clone. **A pending migration stops the step** (non-zero exit). `migrate diff --from-schema-datasource` may only contain the 7 known hand-written statements (4 `ilsearchdoc_*` index drops, `StudioDocBlock_tsv_idx` drop, 2 `tsv` DROP DEFAULT); anything else stops.

## Step 5. Seed the 10 templates on the clone (S43 part 3)

```bash
step5_seed
```

The seed runs from R2 with tsx directly (no npx), `DATABASE_URL` for the clone and a temporary `STUDIO_WORKSPACE_ROOT` (F-10) in that command only; the seed guard rejects `gsp_agent_hq` regardless. Checks: clone templates and section types = production; dry-run, real run and re-run each pass `check_seed.mjs` (all rows name the clone, no error row, section types untouched (F-11), guard ok with no changed/added template and no touched section type, 10 x `created` / `created` / `unchanged` with `storedOk`); afterwards the 7 old templates are identical (md5 of every version, slot, param and role-format row), section types = production, and `new10_fp` shows 10 templates, 10 versions, 72 slots, params > 0. The recorded `new10_fp` is the export manifest.

## Step 6. Rehearsal on the clone, out-of-app (S44, then S45)

```bash
step6_rehearsal
```

R2 on 9031 and the old 3566486 build on loopback 9051, both on the clone with temporary workspaces (challenge 9). Checks: smoke on 9031 and 9051 with 17 templates; R2 MCP writes and renders the 10 templates plus `latest` (`check_render` 11/0, `latest` -> datum-gsp) and the 10 B-FIX fixtures; the old code writes and renders datum-gsp next to the new rows; RB-1 rehearsal (archive on the clone: old code lists 7 and its `latest` is datum-gsp, both by the read-only simulation and by a real old-MCP write); unarchive restores the exact seeded rows; both instances stopped; `secret_scan` of logs, renders and the two HQ logs.

Then **S45** (test-expert): conformance of the 10 rehearsal renders in `$BK/gladi/r2/out/` with `--spec $BK/gladi/r2/spec.json`, B-FIX from `$BK/gladi/r2/bfix/`, clash with `--docx` and `--work-dir "$WORK/clash-work"` (L39-7), coverage file `<task>/verification/coverage/datum_point_coverage.json`; report `<task>/verification/27_datum_conformance_rehearsal.md`. This is the full 10-template evidence (D-612). A failure enters G-FIX (max 3 cycles); production stays untouched (RB-0).

## Step 7. Export only the new rows, then rehearse the import and RB-3 (S46)

The tables owned by the 10 templates (`prisma/schema.prisma`): `StudioTemplate` (`:689`), `StudioTemplateVersion` (`templateId`, `:714`), `StudioTemplateSlot` (`templateVersionId`, cascade, `:1016`), `StudioTemplateSlotParam` (`slotId`, cascade, `:1046`) and `StudioTemplateSlotRoleFormat` (`slotId`, cascade, `:1061`; F-1). Rows that only reference them (`StudioDocument`, `StudioRevision`, `StudioArtifact`, the rehearsal documents) are not exported.

```bash
step7_export
step7_import_rehearsal
```

`step7_export`: export and import scripts built from the templates (no `@EXP@` left); `COPY TO` per table from the clone; manifest = seeded state and = the COPY counts; references reported; `StudioSectionType` clone = production; `IMPORT_VARS.txt` (counts and md5 only) checked against its expected shape; `export/SHA256SUMS` covers the 5 CSVs, the manifest and `IMPORT_VARS.txt`; `sql/SHA256SUMS_sql` covers the import, export and RB-1 scripts; both digests go to `anchors.txt` and `runbook.log` (L39-8).

`step7_import_rehearsal`: anchors and both manifests verified; no other session on the clone; the clone is dropped and recreated from the same dump (= production at dump time); the exact production import script commits with "post-checks ok: 17 templates (before 7 + 10)"; imported rows = export (counts and md5); old templates unchanged; a second run exits 3 with "STOP a slug already exists in target"; R2 serves 17 templates; then **RB-3 rehearsal**: `restore_into "$CLONE_DB" "$DUMP" --clean --if-exists --single-transaction --no-owner` (the RB-3 command) returns the clone to the dump state (10 slugs gone, old templates = production); the clone is dropped (Q-9).

The import script (section A, `sql/import_new10.sql.tpl`) runs in one transaction: db_guard inside the transaction, `LOCK TABLE "StudioTemplate" IN SHARE ROW EXCLUSIVE MODE`, staging tables `LIKE` the target with `HEADER MATCH`, pre-checks (staging counts and md5 = export, exactly the 10 slugs, flags, no slug or id in the target, rows closed over the 10 templates, every `baseVersionId` = the target's current latest `datum-gsp-preset` version, every `sectionTypeKey` exists), inserts in FK order, post-checks (target counts and md5 = export; total = before + 10). Any failure raises and rolls back everything.

## Step 8. Port swap, code before data (S47)

Precondition: G2 (D-591/D-596).

```bash
step8_swap
```

Process inventory; 9011 listening and its smoke recorded; old build standby on loopback 9051 against production (smoke ok); `window_ok`; stop 9011 (command line checked); start R2 on 9011 out-of-app; `/login` 200 (downtime logged). Checks after: smoke ok with the same 7 templates as before, R2 unit test of the `latest` constant (2 tests), production templates untouched, `migrate status` up to date, no `request error` in `hq-r2.log`. If the start or a check fails after the stop: RB-2 short form `rb2_code` (no data changed yet).

## Step 9. Launchers to R2 (S48, D-612 F-3), out-of-app

```bash
step9_launchers
```

`launcher_edit_r2.py` (sha-pinned files, every anchor exact-match once, EOL preserved, backups `.bak-20261104-datum-rev-a`, nothing written unless everything verifies): `gsp-ecosystem-start.sh` line 120 (the `hq_restart.mjs` comment, F-3) and line 121 (`cd`), `watchdog-webui-hq.py` line 124 (cwd). Checks: both files edited, `bash -n` ok, `compile()` ok (py_compile without writing a `.pyc` into AppData), the real (out-of-app) sha256 equals the in-app view, no old checkout path left in either launcher. Comment line 119 of `gsp-ecosystem-start.sh` ("HQ produksi = checkout gsp-hq-prod-v21.") is deliberately left unchanged (I-R4): the script does not edit it, and it names no runnable path.

## Step 10. Hermes MCP repoint and gateway restarts (S49), out-of-app

```bash
step10_repoint
gw_one gsp-worker 10        # D-589: this also stops gsp-worker-fast (name-prefix match); restart it next
gw_one gsp-worker-fast 10
gw_one gsp-master01 10
gw_one gsp-thinker 10       # gsp-master has no gateway running: do not start one
step10_gate                 # HARD GATE: OLD_MCP=0, R2_MCP>=4, studio_contracts_query ok in all 5 profiles, secret scan
```

`step10_gate` counts old servers with the R-L4 matcher: every `node.exe` whose command line names `gsp-hq-prod-v21[\/]scripts[\/]studio[\/]mcp[\/]server.ts` (any case, either slash, any loader), one per process tree; a server from an unrecognized root (`UNKNOWN_MCP`) also stops the gate. `step10_repoint`: 5 profiles repointed (3 references each, `${env:INTERNAL_API_SECRET}` reference asserted unchanged, CRLF kept, backups `config.yaml.bak-datum-rev-a-20261104`), real view shows `r2_refs=3 old_refs=0` for all 5. `gw_one`: prints `hermes -p <p> gateway status`, restarts out-of-app, requires "Gateway started", records processes. `gateway status` does not show active sessions, and a busy session cannot be detected from a read-only process listing; `restart` drains (D-589 "drained cleanly"). If the controller knows of an active kanban session for a profile, wait before that `gw_one` (D-589 waited for gsp-thinker). Never import while `step10_gate` has not passed.

## Step 11. Import into production, one transaction (S50)

```bash
step11_import
```

Gates, in order, before the import: `OLD_MCP=0`; datum-gsp present, active, not preset, not a contract template; R2 unit test of the `latest` constant; anchors match; `export/SHA256SUMS` and `sql/SHA256SUMS_sql` verify; production counts and fingerprints recorded; the 10 slugs absent. Then the guarded one-transaction import. After it: "post-checks ok: 17 templates (before 7 + 10)"; 7 old templates identical (AC-3); imported rows = export (counts and md5); 17 templates; smoke shows 17; `OLD_MCP=0` still. A failed import wrote nothing (one transaction). A failed check after the commit prints "run rb1_archive".

`latest` in production (D-612): proven by the `OLD_MCP=0` gate (only R2 MCP code runs, which returns the constant), datum-gsp present and active, and the unit test; no `latest` document is written.

## Step 12. Production smoke: one document (S51, D-612)

```bash
step12_smoke
```

`OLD_MCP=0`; R2 MCP against `https://localhost:9011`, mission `2026-11-04_datum-rev-a-prod-smoke`, agent `hermes-datum-rollout`, `RD_TARGETS=datum-nota` only (the derived driver refuses any other target list and any B-FIX run on 9011). Checks: `check_render` 1/0 (R08 valid, DOCX and PDF rendered and sha-verified, NOT/NOTA/ID = spec); exactly one document in the mission with `NOT|NOTA|ID|f|agent:hermes-datum-rollout`; secret scan of the smoke folder and logs. This uses production register number NOT 001/2026 only (F-6).

## Step 13. Conformance (S52), Hermes skill refresh (S53), archive the smoke document (Q-D)

13.1 **S52** (test-expert) scores only the production document (D-612), with the clone's B-FIX for CR-3 (the production template rows equal the clone rows by md5, step 11):

```bash
V=$PY; D=$BK/prod-smoke/out; mkdir -p "$WORK/clash" "$WORK/clash-work" "$WORK/score"
(cd "$R2" && "$V" -I -B benchmark/datum_conformance/clash/clash.py --pdf "$WORK/clash/datum-nota.pdf" --docx "$D/datum-nota.docx" --out "$WORK/clash/datum-nota.json" --work-dir "$WORK/clash-work") \
 && (cd "$R2" && node node_modules/tsx/dist/cli.mjs benchmark/datum_conformance/score.ts --docx "$D/datum-nota.docx" --template datum-nota --language ID --tier NOTA \
      --produced-by mcp --spec "$BK/prod-smoke/spec.json" --bfix "$BK/gladi/r2/bfix/datum-nota.docx" --clash "$WORK/clash/datum-nota.json" \
      --coverage "$REPO/docs/2026-10-22_doc_artifact_studio/verification/coverage/datum_point_coverage.json" --out "$WORK/score/datum-nota")
```

Report `<task>/verification/28_datum_conformance_prod.md`; gate as in S45 for this one pair.

13.2 **S53** and 13.3 **archive** (after S52 has read the document):

```bash
step13_skill        # source SKILL.md not DRAF; out-of-app backup + copy of SKILL.md and 2 references from R2; 3 x SAME; repo = R2; real view = repo
step13_archive      # exactly 1 document in the mission; guarded UPDATE archived=true (never delete); output row |t|agent:hermes-datum-rollout
s54_secret_scan     # used by S54: logs, prod-smoke, gladi, export and the HQ logs
```

There is no API that sets `StudioDocument.archived` (`prisma/schema.prisma:780`); R04 `?archived=0`, `studio_search` and `studio_contracts_query` hide archived documents. `sql/archive_smoke_docs.sql` refuses another mission, another count or a document not created by `agent:hermes-datum-rollout`.

S54 (verifier) then checks AC-1..AC-12, the rollback artefacts listed in section 14, 30 minutes of `$ECO/hq-r2.log` (`grep -c 'request error'`), `s54_secret_scan`, and section L.

## 14. Rollback

| Level | When | Effect |
|---|---|---|
| RB-0 | stop before step 8 | Production unchanged (only the dump, R2 checkout, clone, temporary workspaces). Nothing to do; optionally drop the clone (Q-9) |
| RB-1 | after step 11 | `rb1_archive`: archive the 10 slugs (data only, reversible) |
| RB-2 | after step 8 | `rb2_code`, `rb2_config`, `gw_one <p> RB2` x4, `rb2_gate`; refuses unless the 10 rows are absent or archived (RB-1 first) |
| RB-3 | last resort, controller/USER decision | `rb3_restore`, then `rb3_restart`; every write since the dump is lost |

```bash
# RB-1 (one transaction)
rb1_archive          # sql sha ok; guarded UPDATE of exactly the 10 slugs; 10 rows archived = t; smoke lists 7; old-code latest = datum-gsp

# RB-2 (RB-1 first when step 11 ran)
rb2_code             # 10 rows not active (else STOP: run rb1_archive); window_ok; stop R2 on 9011; start OLD on 9011 out-of-app; smoke; stop 9051
rb2_config           # launchers restored (sha 3fc38f68... / d84a5d71...); 5 Hermes configs restored (old_refs=3 r2_refs=0)
gw_one gsp-worker RB2; gw_one gsp-worker-fast RB2; gw_one gsp-master01 RB2; gw_one gsp-thinker RB2
rb2_gate             # R2_MCP=0; studio_contracts_query ok in 5 profiles

# RB-3 (last resort)
rb3_restore          # see below
rb3_restart          # gsp-ecosystem-start.sh out-of-app (HQ from the launcher folder, bridge if missing); smoke; bridge running; 9041 standby restarted
```

`rb3_restore` (M39-3, order per R-L2), each line gated by the one before: `window_ok`; step-3 dump sha verified and equal to its LAST anchor; the unique safety-dump name `pre_rb3_<YYYYMMDD-HHMMSS>.dump` (no glob) checked absent; **`window_ok` again immediately before stopping**; the writers are stopped: `stop_listener 9011`, `stop_listener 9051`, `stop_listener 9041` (the gsp-datacenter standby holds connections too, so RB-3 is the one place it is stopped; `rb3_restart` starts it again), `stop_bridge` (node.exe from `C:\Program Files\nodejs` with the exact command line `node.exe" bridge.mjs`; its parent command line is logged; the working directory is not readable from a read-only listing, see section 0); `no_other_sessions "$PROD_DB"` must see 0 other sessions in `pg_stat_activity` (polled up to 60 s, queried from the `postgres` database); **then** the safety dump of the quiesced database: `pg_dump` exit 0, `pg_restore --list` readable with `TABLE DATA` count = table count, `SHA256SUMS_rb3_<stamp>` written, verified, appended to `anchors.txt`, checked as the last anchor and printed by `show_anchors`; zero other sessions confirmed once more; only then `restore_into "$PROD_DB" "$DUMP" --clean --if-exists --single-transaction --no-owner` (the same command rehearsed on the clone in step 7); finally the Studio counts must equal the dump. A failed restore leaves production unchanged (single transaction); run `rb3_restart`. The installed skill (S53) is restored, if needed, by copying `$BK/hermes_skill_before/` back inside a spawn_out script.

## F. Findings and decisions (D-612)

| ID | Finding | Decision / effect |
|---|---|---|
| F-1 | `StudioTemplateSlotRoleFormat` also holds template-owned rows (`schema.prisma:1061`, `skeleton/repository.ts:381-401`) | Exported, fingerprinted and imported with the other 4 tables (accepted) |
| F-2 | `latest` is resolved in the MCP client; the 4 running gateways hold old-checkout MCP children; the old rule picks `datum-nota-en` on DEV | Hard gate `OLD_MCP=0` before step 11; RB-1 before RB-2 (accepted) |
| F-3 | Comment line 120 of `gsp-ecosystem-start.sh` named the old `hq_restart.mjs` | Edited as a second line in step 9 (accepted, sha-pinned exact match) |
| F-4 | Repo `SKILL.md` had the DRAF status lines | Aligned with the installed copy by the controller (D-612); step 1 and S53 refuse a DRAF source |
| F-5/F-6 | Smoke documents burn production register numbers; `latest` is a client constant | Production smoke = one `datum-nota` document, archived afterwards; `latest` proven by `OLD_MCP=0` + datum-gsp active + unit test; 10-template evidence from S44/S45 (D-612) |
| F-7 | CR-3 needs B-FIX evidence | S52 uses the clone B-FIX fixture (accepted) |
| F-8 | Two 6 MB `f070_backup` files | Not committed, stay untracked (accepted) |
| F-9 | Production `datum-gsp-preset` v1 vs DEV v2 | S45 on the production clone is the deciding gate (accepted) |
| F-10 | The seed writes template logs to the workspace even in dry-run | Temporary `STUDIO_WORKSPACE_ROOT` for every seed run |
| F-11 | Without `--dry-run` the section types are seeded before the guarded transaction | `check_seed.mjs` stops unless the dry-run section-type plan is empty |
| F-12 | Earlier runbooks put DB URLs on command lines | `PG*` per command via `pgx`, `-d`/`PGDATABASE` names only, Prisma URL as a per-command env var |

## L. Sensitive data and retention (L39-6)

The step-3 dump, the RB-3 safety dump (if any) and the clone are full copies of production: personal data (`User` name/email), OAuth tokens (`Account`) and password hashes (`WebUiUser.passwordHash`). The export CSVs hold template rows only.

- They stay under `C:/Users/TRIAL/gsp-backups/datum-rev-a-<ts>/`, whose ACL is owner, SYSTEM and Administrators only; `step0_preflight` and `step3_backup` refuse to run if `icacls` shows Everyone, Authenticated Users or Users.
- The clone is dropped in step 7.
- **Retention note for the USER (not automated):** delete `$BK/gsp_agent_hq_<ts>.dump` and any `$BK/pre_rb3_*.dump` 14 days after S54 passes and the rollback window is closed (RB-3 is no longer an option), and record the deletion in `decisions.md`. Until then, keep the volume encrypted (BitLocker) or move the dumps into an encrypted archive if the machine is shared. The temporary workspaces `C:/Users/TRIAL/gsp-ws-gladi-*` hold only rehearsal renders and may be removed with the dumps.

## V. How this runbook was verified (revision 2, 2026-11-04, read-only towards production)

Nothing below wrote to `gsp_agent_hq` or `gsp_agent_hq_v21`, touched a Hermes or launcher file, or started or stopped a process. Test work folders were under `C:/Users/TRIAL/gsp-s37-selftest` (owner-only), not `C:\tmp`.

| Check | Command (summary) | Result |
|---|---|---|
| Gate tests, all 26 step functions (M39-1) | `gate_tests.sh <step>` for step0_preflight ... rb3_restart and `gw_one` | 26 x `result=PASS`: for each of the 167 checks, forcing it to fail left the record identical to the control run up to that check (no later command ran). Control records contain the critical commands (`git ... commit`, the production `on_db gsp_agent_hq psql ... import_new10.sql`, `restore_into gsp_agent_hq ... --clean`) only after all their gates |
| `env.sh` (sandbox copy, BK/TS redirected) | sourced; helper calls | secrets loaded, `exported=none`; a child shell sees no `PGPASSWORD`, `_PGPW` or `_SECRET`; `db_guard gsp_agent_hq` OK; `db_guard` of the absent clone and of a wrong name -> STOP; `psql_ro` refuses `CREATE TABLE`; `no_other_sessions` OK on an unused name; `bridge_pids` = 22680; `window_ok` OK |
| `spawn_out` (L39-4) | allow-list cases; `powershell` replaced by a stub printing a ReturnValue | `x; echo pwned`, `a|b`, `a$(id)` refused; `ReturnValue=9` -> STOP; `ReturnValue=0 ProcessId=1234` -> ok. Encoded PowerShell parse check from revision 1 unchanged |
| `wait_log` | STOP log, `exit=0`, `exit=1` | rc 1, 0, 1 |
| Predicates (read-only) | `backup_acl_ok`, `clone_absent`, `port_free`, `tag_absent`, `drift_known`, `new10_zero`, `new10_shape`, `datum_gsp_active`, `old_mcp_zero` | pass where expected; existing tag, busy 9011, an unknown drift statement, DEV rows, DEV's 20 versions and today's `OLD_MCP=4` each -> STOP |
| `secret_scan.py` (L39-3) | tools folder, S35 responses; values piped in memory | keys found by name: CRON_SECRET, DATABASE_URL (password), INTERNAL_API_SECRET, NEXTAUTH_SECRET, POSTGRES_URL (password), WEBUI_RBAC_TOKEN; 0 hits on the files; a piped secret value and a piped DB password -> HIT, exit 1; values never printed |
| `check_seed.mjs` | S34 DEV logs (dry, real, rerun) | 3 x pass; wrong mode or wrong database -> STOP |
| SQL on DEV (read-only sessions, through the env.sh wrappers) | export, import pre/post blocks, RB-1, smoke archive | export `COPY 10/20/144/340/0` = manifest; import post-checks `17 templates (before 7 + 10)`; pre-checks stop at `a slug already exists`; production name in `expect_db` -> db_guard STOP; wrong md5 -> STOP; RB-1 and archive reach the UPDATE and are refused by the read-only session; archive with `exp_docs=1` and 0 documents -> STOP |
| Production fingerprints (read-only) | `old_templates_fp`, `sectiontypes_fp`, `counts_all` | unchanged from section 0 |
| `launcher_edit_r2.py --check`, `hermes_repoint.py --check` | in-app read of the real files | start.sh 2 lines (F-3 comment + cd), LF 129 kept; watchdog 1 line, CRLF 177/177; compile OK; Hermes 5 profiles, 3 replacements, CRLF kept, parsed entry OK |
| Driver | `derive_driver.mjs` on the D-612 asset | 16 replacements, sha `d103ced3...`; on 9011 it refuses any target list other than `datum-nota`, an empty list and B-FIX; with a DEV allow-list copy, the `list` phase spawned the MCP child with the reduced environment and got 6 tools and 17 templates |
| `check_render.mjs` | S35 DEV output | rows 12, fail 0 |
| R2 `latest` unit test | `vitest run tests/unit/studio/mcp/implw2-client.test.ts -t S10` in REPO | 2 passed |
| Syntax | `bash -n` (all `.sh` and every bash block of this file), `py_compile` (all `.py`), `node --check` (all `.mjs`) | all OK |
| Embedded copies | step-0.2 extractor on this file; tampered copy | 28 files byte-identical to the tested files; one changed byte -> `STOP ... (nothing extracted)` |

Not verified here, because it needs a write and is therefore executed inside the runbook before production: the CSV round trip and inserts of the import and the RB-3 `pg_restore --clean` (both rehearsed on the fresh clone in step 7), out-of-app process starts, launcher/Hermes edits (`--check` passed), gateway restarts, and the seed on the production clone.

## A. Embedded files

Step 0.2 extracts every block below to `$BK/<path>` and refuses to continue (writing nothing) unless each sha256 equals this table. If any block is edited after the security re-review, regenerate its row (sha256 of the block content plus one trailing newline), have the change re-reviewed, and record the new runbook sha256 in `decisions.md`.

| File | sha256 |
|---|---|
| `tools/env.sh` | `d652ff4bea83bfddf6e88a0c25fb935d71fc7e3d9c35dc1e34caee0a93fc9e8f` |
| `tools/steps.sh` | `c836b8b2adfcf7f7d948ff3a59b529aeb41e64f81e89e46eb65c8fc0f95b34da` |
| `tools/gate_tests.sh` | `01e59e5c0730c45408f354856b68f0364ff39c99d3adbb72f6f108433a07fd67` |
| `tools/secret_scan.py` | `3e754101a19f7fb398d31b582a121556a3aa4b91dcda3f8501cff3e87401fdfd` |
| `tools/procs_studio.sh` | `ab47601a852ed9ca2e94bbfb447b3a772e44496f47a02e65a381cc36b6dbbb49` |
| `tools/smoke_http.mjs` | `c530aa785e6269222c91673ac7dcaf540aeab550849a8031a569887aefad059e` |
| `tools/check_render.mjs` | `d1a29a4550538091209825adc2f574f6a3d89b989ce37361bae2ef610556b294` |
| `tools/check_seed.mjs` | `91193e50da6aed3f3e3876b95925a20cb0f3ad9cf49080a1c34813ba0a591871` |
| `tools/derive_driver.mjs` | `f15ead61fcf16d6808dfb9f04db9d8312bb7c9e6ebf9fbeeefc8ea4070086d2a` |
| `sql/counts_all.sql` | `f37f65372518df5620c2bb063a514eec9f892c4488370b03d9f1e6867445ee4a` |
| `sql/sectiontypes_fp.sql` | `59c112a8cc7f22a5de4da8c5367bbbc2c0014ad3970af6a46dcf895ff8116c0a` |
| `sql/old_templates_fp.sql` | `6241dc4116c43953c96800a1f3dceee1c7fbd312d26b3d59673a5d47aeec0db5` |
| `sql/new10_fp.sql` | `3978cec317869add7bd5671ee5bdeb739fb4c382aa9b7171943894b5587c184b` |
| `sql/export_new10.sql.tpl` | `b47a43b887c551c310c0744eee4f9d0515700a2c4f195a3bd72a333218c6dcf1` |
| `sql/import_new10.sql.tpl` | `267f00c2aacf2ea1bed21dcb625ba6f37794f36759b8262768a2fd140d535a1d` |
| `sql/rb1_set_archived.sql.tpl` | `99f8b6a201be3e361c3928a53f97a3774413ce2d5fd087eae31a27f697a8e2e6` |
| `sql/archive_smoke_docs.sql` | `624672c707621545c7e305d3145af2e7b05ef712793421c915e8557af2e92ded` |
| `oa/start-hq2.sh` | `2ff5a4d350cc71c0bf14b9830beb952ec592b0ef05e35237015b9b2f424d296d` |
| `oa/launcher_edit_r2.py` | `aa9850971b27c0216d1697602352e66038d3f654b36f31998b8be94b635351ff` |
| `oa/launcher_edit_r2.sh` | `07d0ea7b964eec7281b159f1ce7ad126b943b835935819447795a6eff74abd9c` |
| `oa/launcher_restore.sh` | `4ae41b9772b570d6f1b92d300267031329bb5a3dcf21d49dbb4da5173e33d68e` |
| `oa/hermes_repoint.py` | `ba5142e6035111903e18a02de3ed09d7fcea4526c8ae1d77e73b559cd957baa0` |
| `oa/hermes_repoint.sh` | `cf0d3d0dfffee404627aeb0e8cadbf8da3911280a4684a991c573ce11db95bdd` |
| `oa/hermes_restore.sh` | `87b0dd387603a3e797e945484126191f3b8754d40b8fbd2d5307b6b69140290f` |
| `oa/gw_restart2.sh` | `b67311c973da06764e797ae1b36de0e281052abc8a9fe008ce08aa3ea7b59403` |
| `oa/mcp_e2e2.sh` | `8c64f85fe59a922ecc6d2a2a4ad32eabe9d37100af0b9933946ed4541483cd0a` |
| `oa/skill_refresh.sh` | `f6a2efb5a06f6eae6fd9e428e05bab6185ba70c932bfab322af0b0186a908db9` |
| `oa/realcheck.sh` | `a0b55dfabffbe4328340e3ed6d9265193285600059b7ee57852d3c3f4b09d072` |

<!-- file: tools/env.sh -->
```bash
# env.sh : S37 runbook environment, revision after the S39 security review. `source` it in every Git Bash shell used
# for the runbook, then `source "$BK/tools/steps.sh"`. It defines variables and helpers only (plus the $BK folders).
# Secrets live in NON-exported shell variables (_PGHOST/_PGPORT/_PGUSER/_PGPW, _SECRET, _RBAC, _URL_BASE) and reach a
# child process only as a per-command prefix inside pgx/db_url/smoke/rd (L39-2). xtrace is refused (it would print them).
case "$-" in *x*) echo "STOP: disable set -x before sourcing env.sh"; return 1 2>/dev/null || exit 1;; esac
set -o pipefail
export PATH="/c/Program Files/PostgreSQL/17/bin:$PATH"
REPO=/c/Users/TRIAL/gsp-swarm-hq-v2.1
OLD=/c/Users/TRIAL/gsp-hq-prod-v21                  # prod-v21 @ 3566486 (current 9011; rollback build)
R2=/c/Users/TRIAL/gsp-hq-prod-v21-r2                # new checkout (D-596 Q-B)
ECO=/c/Users/TRIAL/gsp-ecosystem
ASSETS=/c/Users/TRIAL/gsp-backups/datum-rev-a-rollout-assets   # D-612: S35 driver copy (sha256 9bf43077...)
DECISIONS=$REPO/docs/2026-10-22_doc_artifact_studio/decisions/decisions.md
RUNBOOK=$REPO/docs/2026-10-22_doc_artifact_studio/deploy/05_datum_rev_a_rollout_plan.md
PY=C:/Users/TRIAL/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe
HERMES=/c/Users/TRIAL/AppData/Local/hermes/bin/hermes.exe
TAG=prod-v2.1-datum-rev-a-20261104
SMOKE_MISSION=2026-11-04_datum-rev-a-prod-smoke
SMOKE_SLUG=datum-nota                               # D-612: the ONLY production smoke document
PROD_DB=gsp_agent_hq                                # L39-1: each database is named once, here
CLONE_DB=gsp_agent_hq_v21_seedtest
MAINT_DB=postgres
RWS_R2=C:/Users/TRIAL/gsp-ws-gladi-r2               # TEMPORARY workspaces for the clone runs (challenge 9)
RWS_OLD=C:/Users/TRIAL/gsp-ws-gladi-old
RWS_SEED=C:/Users/TRIAL/gsp-ws-gladi-seed
TSF=/c/Users/TRIAL/gsp-backups/datum-rev-a.current  # $TS is fixed once in step 0
[ -f "$TSF" ] || { echo "STOP: $TSF missing (step 0.1 creates it)"; return 1 2>/dev/null || exit 1; }
TS=$(cat "$TSF")
BK="/c/Users/TRIAL/gsp-backups/datum-rev-a-$TS"
WORK="$BK/work"                                     # L39-7: every work folder is under the owner-only backup tree
DUMP="$BK/gsp_agent_hq_$TS.dump"
mkdir -p "$BK/logs" "$BK/sql" "$BK/oa" "$BK/tools" "$BK/export" "$BK/gladi" "$BK/prod-smoke" "$WORK"
dotenv_get() { # <file> <NAME> : dotenv semantics (first match, wrapping quotes and CR stripped); prints the value
  grep -E "^$2=" "$1" | head -1 | cut -d= -f2- | sed -E "s/^[\"']//; s/[\"']\$//" | tr -d '\r'
}
_url=$(dotenv_get "$OLD/.env" DATABASE_URL)
case "$_url" in *\?*) unset _url; echo "STOP: DATABASE_URL has a query string"; return 1 2>/dev/null || exit 1;; esac
[ "${_url##*/}" = "$PROD_DB" ] || { unset _url; echo "STOP: production .env does not name $PROD_DB"; return 1 2>/dev/null || exit 1; }
_URL_BASE=${_url%/*}
eval "$(U="$_url" node -e 'const u = new URL(process.env.U); const Q = String.fromCharCode(39); const q = (s) => Q + s.split(Q).join(Q + String.fromCharCode(92) + Q + Q) + Q; console.log("_PGHOST=" + q(u.hostname) + " _PGPORT=" + q(u.port || "5432") + " _PGUSER=" + q(decodeURIComponent(u.username)) + " _PGPW=" + q(decodeURIComponent(u.password)));')"
unset _url
_SECRET=$(dotenv_get "$OLD/.env" INTERNAL_API_SECRET)
_RBAC=$(dotenv_get "$OLD/.env" WEBUI_RBAC_TOKEN)
for _n in PGPASSWORD PGHOST PGPORT PGUSER PGDATABASE INTERNAL_API_SECRET WEBUI_RBAC_TOKEN DATABASE_URL PROD_DB_URL CLONE_DB_URL NEXTAUTH_SECRET CRON_SECRET GOOGLE_CLIENT_SECRET POSTGRES_URL; do
  export -n "$_n" 2>/dev/null; unset "$_n"
done; unset _n
no_secret_env() { # true when no secret-bearing name is exported to child processes
  ! env | cut -d= -f1 | grep -qxE 'PGPASSWORD|INTERNAL_API_SECRET|WEBUI_RBAC_TOKEN|DATABASE_URL|PROD_DB_URL|CLONE_DB_URL|NEXTAUTH_SECRET|CRON_SECRET|GOOGLE_CLIENT_SECRET|POSTGRES_URL|_PGPW|_SECRET|_RBAC|_URL_BASE'
}
pgx() { # <libpq command...> : the DB credentials exist only in this one command's environment
  PGHOST="$_PGHOST" PGPORT="$_PGPORT" PGUSER="$_PGUSER" PGPASSWORD="$_PGPW" "$@"
}
db_url() { # <db> : URL for tools that read DATABASE_URL; use only as a per-command prefix, never export it
  printf '%s/%s' "$_URL_BASE" "$1"
}
db_guard() { # <db> : that database answers and select current_database() returns exactly <db>
  local got; got=$(PGDATABASE="$1" pgx psql -X -At -c "select current_database();") || { echo "STOP: DB $1 connection failed"; return 1; }
  if [ "$got" = "$1" ]; then echo "db_guard OK: $got"; else echo "STOP: connected to $got, expected $1"; return 1; fi
}
on_db() { # <db> <command...> : db_guard, then the command with PGDATABASE=<db> (commands take no -d of their own)
  local db="$1"; shift
  db_guard "$db" || return 1
  PGDATABASE="$db" pgx "$@"
}
psql_ro() { # <db> <psql args...> : guarded read-only psql session (-X -At -F'|')
  local db="$1"; shift
  db_guard "$db" >/dev/null || { echo "STOP: db_guard $db"; return 1; }
  PGDATABASE="$db" PGOPTIONS='-c default_transaction_read_only=on' pgx psql -X -At -F'|' "$@"
}
restore_into() { # <db> <dump> [pg_restore options...] : guarded pg_restore whose target is the same <db> variable
  local db="$1" dump="$2"; shift 2
  db_guard "$db" || return 1
  pgx pg_restore "$@" -d "$db" "$dump"
}
no_other_sessions() { # <db> : waits up to 60 s until no session other than ours is connected to <db>
  local i n; for i in $(seq 1 60); do
    n=$(PGDATABASE="$MAINT_DB" pgx psql -X -At -c "select count(*) from pg_stat_activity where datname = '$1' and pid <> pg_backend_pid();") || return 1
    [ "$n" = 0 ] && { echo "no other sessions on $1"; return 0; }; sleep 1
  done
  PGDATABASE="$MAINT_DB" pgx psql -X -At -F'|' -c "select pid, application_name, client_addr, state from pg_stat_activity where datname = '$1';"
  echo "STOP: $n other sessions on $1"; return 1
}
secret_scan() { # <paths...|-> : scans for every secret value of the production .env, by key name; prints names and counts only
  "$PY" -I "$BK/tools/secret_scan.py" "$OLD/.env" -- "$@"
}
listener_pid() { # <port> : Windows PID listening on the port (empty if none)
  netstat -ano -p tcp | grep -E ":$1\s.*LISTENING" | awk '{print $NF}' | head -1
}
stop_listener() { # <port> : taskkill the hq-server.mjs process listening on <port> after checking its command line
  local pid cl i; pid=$(listener_pid "$1"); [ -n "$pid" ] || { echo "no listener on $1"; return 0; }
  cl=$(powershell -NoProfile -NonInteractive -Command "(Get-CimInstance Win32_Process -Filter 'ProcessId=$pid').CommandLine")
  case "$cl" in *hq-server.mjs*) ;; *) echo "STOP: PID $pid on port $1 is not hq-server.mjs"; return 1;; esac
  log "stop_listener port=$1 pid=$pid"; taskkill //PID "$pid" //T //F || return 1
  for i in $(seq 1 20); do [ -z "$(listener_pid "$1")" ] && { log "port $1 free"; return 0; }; sleep 1; done
  echo "STOP: port $1 still listening"; return 1
}
bridge_pids() { # PIDs of hermes-bridge: node.exe from C:\Program Files\nodejs whose command line is exactly
  # `node.exe" bridge.mjs` (I-R5). Its working directory is not readable from a read-only process listing.
  powershell -NoProfile -NonInteractive -Command "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { \$_.ExecutablePath -eq 'C:\Program Files\nodejs\node.exe' -and \$_.CommandLine -match 'node\.exe.?\s+bridge\.mjs\s*\$' } | ForEach-Object { \$_.ProcessId }" | tr -d '\r'
}
stop_bridge() { # stops hermes-bridge (started by gsp-ecosystem-start.sh / watchdog as `nohup node bridge.mjs`)
  local p i pp; for p in $(bridge_pids); do
    pp=$(powershell -NoProfile -NonInteractive -Command "\$c = Get-CimInstance Win32_Process -Filter 'ProcessId=$p'; (Get-CimInstance Win32_Process -Filter ('ProcessId=' + \$c.ParentProcessId)).CommandLine" | tr -d '\r')
    log "stop_bridge pid=$p parent=[$pp]"; taskkill //PID "$p" //T //F || return 1
  done
  for i in $(seq 1 20); do [ -z "$(bridge_pids)" ] && { echo "bridge stopped"; return 0; }; sleep 1; done
  echo "STOP: bridge still running"; return 1
}
procs() { # <outfile> : process inventory (tools/procs_studio.sh); last line OLD_MCP=<n> R2_MCP=<n>
  bash "$BK/tools/procs_studio.sh" "$1"
}
wait_http() { # <url> <seconds> : poll until HTTP 200
  local i code; for i in $(seq 1 "$2"); do code=$(curl -sk -o /dev/null -w '%{http_code}' "$1"); [ "$code" = 200 ] && { echo "200 after ${i}s"; return 0; }; sleep 1; done; echo "STOP: no 200 from $1 (last $code)"; return 1
}
wait_log() { # <logfile> <seconds> <run id> : wait until THIS run's script (first line run=<id>) wrote its completion line,
  # then print the log; returns 1 on timeout, on another run's log, or when the completion line is a STOP (R-L1)
  local i; for i in $(seq 1 "$2"); do
    if [ -f "$1" ] && [ "$(head -1 "$1" | tr -d '\r')" = "run=$3" ] && grep -qE '^(done|end|exit=|STOP)' "$1"; then
      cat "$1"; ! grep -qE '^STOP|^exit=[1-9]' "$1"; return
    fi; sleep 1
  done; echo "STOP: no completion line for run $3 in $1 after $2 s"; return 1
}
oa_run() { # <logfile> <seconds> "<script> <args>" : out-of-app run with a fresh run id passed as the last argument; any
  # existing log is moved aside (timestamped, nothing deleted) before the launch, and wait_log accepts only this run (R-L1)
  local logf="$1" secs="$2" cmd="$3" rid
  rid="r$(date +%Y%m%d%H%M%S)$RANDOM"
  if [ -e "$logf" ]; then mv "$logf" "$logf.prev-$(date +%Y%m%d-%H%M%S)-$RANDOM" || return 1; fi
  spawn_out "$cmd $rid" || return 1
  wait_log "$logf" "$secs" "$rid"
}
log() { echo "[$(date '+%F %T')] $*" | tee -a "$BK/logs/runbook.log"; }
window_ok() { # refuses the Hermes watchdog window (cron 0 */3: :55-:05 around 00,03,..,21) and Monday 04:00-05:59
  local h m d; h=$((10#$(date +%H))); m=$((10#$(date +%M))); d=$(date +%u)
  if [ $((h % 3)) -eq 0 ] && [ "$m" -le 5 ]; then echo "STOP: watchdog window (:00-:05 on a 3-hour mark)"; return 1; fi
  if [ $(((h + 1) % 3)) -eq 0 ] && [ "$m" -ge 55 ]; then echo "STOP: watchdog window (:55-:59 before a 3-hour mark)"; return 1; fi
  if [ "$d" = 1 ] && [ "$h" -ge 4 ] && [ "$h" -le 5 ]; then echo "STOP: Monday 04:00-05:59 weekly restart window"; return 1; fi
  echo "window OK ($(date '+%a %H:%M'))"
}
spawn_out() { # "<script> <args>" : run `bash -lc` hidden via WMI Win32_Process.Create, outside the Claude app process
  # tree and package (inline -EncodedCommand, no -File, execution policy untouched). L39-4: character allow-list and a
  # checked WMI ReturnValue. The spawned process gets the user's default environment, not this shell's variables.
  local cmd="$1" out re='^[A-Za-z0-9_./:= -]+$'
  [[ $cmd =~ $re ]] || { echo "STOP: spawn_out argument has a character outside [A-Za-z0-9_./:= -]"; return 1; }
  local ps="\$si = New-CimInstance -ClassName Win32_ProcessStartup -ClientOnly -Property @{ ShowWindow = [uint16]0 }; \$c = '\"C:\\Program Files\\Git\\bin\\bash.exe\" -lc \"$cmd\"'; \$r = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = \$c; CurrentDirectory = 'C:\\Users\\TRIAL'; ProcessStartupInformation = \$si }; 'ReturnValue=' + \$r.ReturnValue + ' ProcessId=' + \$r.ProcessId"
  out=$(powershell -NoProfile -NonInteractive -EncodedCommand "$(printf '%s' "$ps" | iconv -f UTF-8 -t UTF-16LE | base64 -w0)") || { echo "STOP: powershell failed"; return 1; }
  echo "$out"
  case "$out" in "ReturnValue=0 ProcessId="[0-9]*) return 0;; *) echo "STOP: WMI Win32_Process.Create did not return 0"; return 1;; esac
}
smoke() { # <base> : read-only HTTP smoke (tools/smoke_http.mjs); the secrets exist only in this command's environment
  (cd "$R2" && INTERNAL_API_SECRET="$_SECRET" WEBUI_RBAC_TOKEN="$_RBAC" NODE_EXTRA_CA_CERTS="$R2/certs/hq-cert.pem" node "$BK/tools/smoke_http.mjs" "$1")
}
rd() { # <repo whose MCP server/SDK is used> <base> <out dir> <mission> <phase> : MCP driver run with tsx directly (no npx);
  # optional env RD_TARGETS, RD_PAYLOAD_ID, RD_PAYLOAD_EN. The MCP child gets an explicit env allow-list (derive_driver.mjs).
  (cd "$R2" && INTERNAL_API_SECRET="$_SECRET" RD_REPO="$1" RD_BASE="$2" RD_ROOT="$3" RD_MISSION="$4" RD_SAMPLE_DOC="$R2/docs/STUDIO-HOWTO-DOCUMENT.md" \
     NODE_EXTRA_CA_CERTS="$R2/certs/hq-cert.pem" node "$R2/node_modules/tsx/dist/cli.mjs" "$BK/tools/rollout_driver.ts" "$5")
}
echo "env OK: BK=$BK TS=$TS secrets loaded=$( [ -n "$_SECRET" ] && [ -n "$_PGPW" ] && echo yes || echo NO ) exported=$(no_secret_env && echo none || echo YES-STOP)"
```

<!-- file: tools/steps.sh -->
```bash
# steps.sh : S37 runbook steps as bash functions (M39-1). Source after env.sh. Every check is `chk <label> <predicate...>`
# and is followed by `|| return 1`; every command that changes something is followed by `|| return 1` too. So a failed
# check returns from the step before any later command runs, even when a whole block is pasted at once.
# tools/gate_tests.sh proves this per step without side effects (each check forced to fail in turn).
# Only predicates run inside chk; they read, they never write.

GLADI_TARGETS="datum-proposal-teknis,datum-proposal-teknis-en,datum-laporan,datum-laporan-en,datum-laporan-verifikasi,datum-laporan-verifikasi-en,datum-standar,datum-standar-en,datum-nota,datum-nota-en,latest"
SLUGS_SQL="'{datum-proposal-teknis,datum-proposal-teknis-en,datum-laporan,datum-laporan-en,datum-laporan-verifikasi,datum-laporan-verifikasi-en,datum-standar,datum-standar-en,datum-nota,datum-nota-en}'::text[]"
DRIVER_SHA=d103ced3299113997f07de2a7e7ea3342d69c78dd6de9d2975592e25f3a7cf36

# ---- check runner and read-only predicates ------------------------------------------------------------------------------
chk() { local label="$1"; shift; if "$@"; then echo "ok   $label"; else echo "STOP $label"; return 1; fi; }
same_file() { diff -q -- "$1" "$2" >/dev/null || { diff -- "$1" "$2" | head -20; return 1; }; }
has_line() { grep -qE -- "$2" "$1"; }
lacks_line() { ! grep -qE -- "$2" "$1"; }
eq() { [ "$1" = "$2" ] || { echo "  got [$1] want [$2]"; return 1; }; }
ge() { [ "$1" -ge "$2" ] 2>/dev/null || { echo "  got [$1] want >= $2"; return 1; }; }
sha_ok() { (cd "$1" && sha256sum -c --quiet "$2"); }
port_free() { [ -z "$(listener_pid "$1")" ]; }
path_absent() { [ ! -e "$1" ]; }
file_present() { [ -s "$1" ]; }
clone_absent() { eq "$(psql_ro "$MAINT_DB" -c "select count(*) from pg_database where datname = '$CLONE_DB'")" 0; }
new10_zero() { awk -F'|' 'NF < 3 || $2 != 0 { bad = 1 } END { exit (bad || NR != 5) }' "$1"; }
new10_shape() { awk -F'|' '{ n[$1] = $2 } END { exit !(n["StudioTemplate"] == 10 && n["StudioTemplateVersion"] == 10 && n["StudioTemplateSlot"] == 72 && n["StudioTemplateSlotParam"] > 0 && NR == 5) }' "$1"; }
studio_counts_same() { same_file <(grep '^Studio' "$1") <(grep '^Studio' "$2"); }
copy_counts_match() { eq "$(grep -oE '^COPY [0-9]+' "$1" | awk '{print $2}' | paste -sd, -)" "$(awk -F'|' '{print $2}' "$2" | paste -sd, -)"; }
tag_absent() { ! git -C "$REPO" rev-parse -q --verify "refs/tags/$1" >/dev/null; }
runbook_recorded() { grep -qF "$(sha256sum < "$RUNBOOK" | cut -c1-64)" "$DECISIONS"; }
backup_acl_ok() { local a; a=$(icacls "$(cygpath -w "$1")") || return 1; echo "$a" | head -6; ! echo "$a" | grep -qiE 'Everyone|Authenticated Users|BUILTIN\\Users|\\Users:'; }
drift_known() { ! awk 'NF && !/^--/' "$1" | grep -vxE 'DROP INDEX "(ilsearchdoc_source_idx|ilsearchdoc_trgm_body|ilsearchdoc_trgm_title|ilsearchdoc_tsv_gin|StudioDocBlock_tsv_idx)";|ALTER TABLE "(IlSearchDoc|StudioDocBlock)" ALTER COLUMN "tsv" DROP DEFAULT;' | grep -q .; }
old_mcp_zero() { procs "$1" >/dev/null; grep -qxE 'OLD_MCP=0 R2_MCP=[0-9]+ REPO_MCP=[0-9]+ UNKNOWN_MCP=0' "$1"; }   # R-L4
r2_mcp_zero() { procs "$1" >/dev/null; grep -qxE 'OLD_MCP=[0-9]+ R2_MCP=0 REPO_MCP=[0-9]+ UNKNOWN_MCP=0' "$1"; }
smoke_to() { smoke "$1" > "$2"; }
datum_gsp_active() { eq "$(psql_ro "$PROD_DB" -c "select count(*) from \"StudioTemplate\" where slug = 'datum-gsp' and not archived and not \"isPreset\" and \"contractKind\" is null")" 1; }
latest_unit_test() { (cd "$R2" && node node_modules/vitest/vitest.mjs run tests/unit/studio/mcp/implw2-client.test.ts -t S10) > "$BK/logs/r2_latest_unit_test.txt" 2>&1 && grep -qE 'Tests +2 passed' "$BK/logs/r2_latest_unit_test.txt"; }
new10_not_active() { eq "$(psql_ro "$PROD_DB" -c "select count(*) from \"StudioTemplate\" where slug = any($SLUGS_SQL) and not archived")" 0; }
anchor_is() { # <key> <file> : the LAST digest recorded for <key> in anchors.txt equals the file's sha256 (R-L3)
  local last; last=$(grep "^$1 " "$BK/logs/anchors.txt" | tail -1 | cut -d" " -f2)
  [ -n "$last" ] && [ "$last" = "$(sha256sum < "$2" | cut -c1-64)" ] || { echo "  anchor $1: last recorded [$last] differs from $2"; return 1; }
}
anchors_ok() { anchor_is export/SHA256SUMS "$BK/export/SHA256SUMS" && anchor_is sql/SHA256SUMS_sql "$BK/sql/SHA256SUMS_sql"; }
show_anchors() { # prints the last digest per key, for the controller to copy into decisions.md (R-L3)
  echo "== anchors to record in decisions.md (last per key):"; awk '{ last[$1] = $2; order[$1] = NR } END { for (k in last) print order[k], k, last[k] }' "$BK/logs/anchors.txt" | sort -n | cut -d" " -f2-
}
real_eq_app() { local f; for f in "$@"; do grep -qF "$(sha256sum "$f" | cut -c1-64)" "$REAL_VIEW" || { echo "  real view differs for $f"; return 1; }; done; }
dump_list_matches() { eq "$(grep -c 'TABLE DATA' "$1")" "$(grep -c . "$2")"; }
seed_run() { # <seed-studio.ts args...> : seed from R2 against the clone, temporary workspace, no npx
  (cd "$R2" && DATABASE_URL="$(db_url "$CLONE_DB")" STUDIO_WORKSPACE_ROOT="$RWS_SEED" node node_modules/tsx/dist/cli.mjs prisma/seed-studio.ts "$@")
}
prisma_r2() { # <db> <prisma args...> : Prisma CLI from R2 with DATABASE_URL for <db> in this command only
  local db="$1"; shift
  (cd "$R2" && DATABASE_URL="$(db_url "$db")" node node_modules/prisma/build/index.js "$@")
}

# ---- step 0 ---------------------------------------------------------------------------------------------------------------
step0_preflight() {
  log "step0 preflight start"
  chk runbook.sha_recorded_in_decisions runbook_recorded || return 1
  chk env.no_exported_secret no_secret_env || return 1
  chk backup.acl_owner_only backup_acl_ok "$BK" || return 1
  procs "$BK/logs/procs_00_before.txt" || return 1
  chk port.9031_free port_free 9031 || return 1
  chk port.9051_free port_free 9051 || return 1
  chk r2.absent path_absent "$R2" || return 1
  chk clone.absent clone_absent || return 1
  psql_ro "$PROD_DB" -f "$BK/sql/counts_all.sql" > "$BK/logs/prod_counts_00.txt" || return 1
  psql_ro "$PROD_DB" -f "$BK/sql/old_templates_fp.sql" > "$BK/logs/prod_old_templates_00.txt" || return 1
  psql_ro "$PROD_DB" -f "$BK/sql/new10_fp.sql" > "$BK/logs/prod_new10_00.txt" || return 1
  psql_ro "$PROD_DB" -f "$BK/sql/sectiontypes_fp.sql" > "$BK/logs/prod_sectiontypes_00.txt" || return 1
  chk prod.new10_absent new10_zero "$BK/logs/prod_new10_00.txt" || return 1
  log "step0 preflight ok"
}
step0_driver() {
  chk driver.asset_present file_present "$ASSETS/driver.ts" || return 1
  cp -p "$ASSETS/driver.ts" "$BK/tools/s35_driver.ts" || return 1
  node "$BK/tools/derive_driver.mjs" "$BK/tools/s35_driver.ts" "$BK/tools/rollout_driver.ts" > "$BK/logs/derive_driver.txt" 2>&1 || { cat "$BK/logs/derive_driver.txt"; echo "STOP derive_driver"; return 1; }
  chk driver.derived_sha has_line "$BK/logs/derive_driver.txt" "sha256 $DRIVER_SHA replacements 16" || return 1
  log "step0 driver derived"
}

# ---- step 1 (S41) ---------------------------------------------------------------------------------------------------------
only_f070_untracked() { ! grep -v '^?? docs/2026-10-22_doc_artifact_studio/delegation_progress/f070_backup/' "$1" | grep -q .; }
staged_secret_free() { git -C "$REPO" diff --cached | secret_scan -; }
step1_commit() {
  local sha
  chk skill.not_draft lacks_line "$REPO/docs/hermes-skills/gsp-studio-write/SKILL.md" '^Status: DRAF' || return 1
  chk tag.absent tag_absent "$TAG" || return 1
  git -C "$REPO" status --short > "$BK/logs/git_status_before_commit.txt" || return 1
  git -C "$REPO" add -A -- . ':(exclude)docs/2026-10-22_doc_artifact_studio/delegation_progress/f070_backup' || return 1
  git -C "$REPO" diff --cached --name-only > "$BK/logs/git_staged.txt" || return 1
  chk staged.not_empty file_present "$BK/logs/git_staged.txt" || return 1
  chk staged.no_secret_files lacks_line "$BK/logs/git_staged.txt" '(^|/)\.env($|\.)|\.pem$|\.key$|\.dump$|\.p12$|\.pfx$|(^|/)certs/' || return 1
  chk staged.no_f070 lacks_line "$BK/logs/git_staged.txt" 'f070_backup' || return 1
  chk staged.no_secret_values staged_secret_free || return 1
  printf '%s\n' "feat(studio): DATUM Rev A doc-type templates (ID/EN), language-aware wrapper text and numbers, conformance scorer" "" \
    "- --doc-type-templates seeds 10 templates (PT, LAP, VER, STD, NOT x ID/EN) from one spec table (D-590, D-595)" \
    "- latest is pinned to datum-gsp in the MCP client (D-590 P0-1); NDA added to doc.typeCode" \
    "- EN wrapper texts and register-bound EN numbers; ID output byte-identical (S05/S19)" \
    "- benchmark/datum_conformance scorer, clash checker and tests (D-592, D-593)" "" \
    "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" > "$BK/logs/commit_msg.txt" || return 1
  git -C "$REPO" commit -F "$BK/logs/commit_msg.txt" > "$BK/logs/commit.txt" 2>&1 || { cat "$BK/logs/commit.txt"; echo "STOP git commit"; return 1; }
  sha=$(git -C "$REPO" rev-parse HEAD) || return 1
  git -C "$REPO" tag "$TAG" "$sha" || return 1
  chk tag.points_to_commit eq "$(git -C "$REPO" rev-parse "$TAG^{commit}")" "$sha" || return 1
  git -C "$REPO" status --short > "$BK/logs/git_status_after_commit.txt" || return 1
  chk status.only_f070_untracked only_f070_untracked "$BK/logs/git_status_after_commit.txt" || return 1
  log "step1 commit $sha tag $TAG (local only; never git push)"
}

# ---- step 2 (S42) ---------------------------------------------------------------------------------------------------------
certs_identical() { cmp -s "$OLD/certs/hq-cert.pem" "$R2/certs/hq-cert.pem" && cmp -s "$OLD/certs/hq-key.pem" "$R2/certs/hq-key.pem"; }
step2_build() {
  local out head tagc
  chk r2.absent path_absent "$R2" || return 1
  chk env.no_exported_secret no_secret_env || return 1
  git clone --no-hardlinks -c core.autocrlf=false "$REPO" "$R2" > "$BK/logs/r2_clone.txt" 2>&1 || return 1
  git -C "$R2" checkout -b prod-v21-r2 "$TAG" >> "$BK/logs/r2_clone.txt" 2>&1 || return 1
  out=$(git -C "$R2" config core.autocrlf) || return 1
  chk r2.autocrlf_false eq "$out" false || return 1
  head=$(git -C "$R2" rev-parse HEAD) || return 1
  tagc=$(git -C "$REPO" rev-parse "$TAG^{commit}") || return 1
  chk r2.head_is_tag eq "$head" "$tagc" || return 1
  cp -p "$OLD/.env" "$R2/.env" || return 1
  mkdir -p "$R2/certs" || return 1
  cp -p "$OLD/certs/hq-key.pem" "$OLD/certs/hq-cert.pem" "$R2/certs/" || return 1
  chk r2.env_identical cmp -s "$OLD/.env" "$R2/.env" || return 1
  chk r2.certs_identical certs_identical || return 1
  out=$(git -C "$R2" status --short) || return 1
  chk r2.status_clean eq "$out" "" || return 1
  chk r2.env_ignored git -C "$R2" check-ignore -q .env certs/hq-key.pem || return 1
  chk env.no_exported_secret_before_npm no_secret_env || return 1
  (cd "$R2" && npm ci) > "$BK/logs/r2_npm_ci.txt" 2>&1 || { tail -20 "$BK/logs/r2_npm_ci.txt"; echo "STOP npm ci"; return 1; }
  (cd "$R2" && npm run build) > "$BK/logs/r2_build.txt" 2>&1 || { tail -20 "$BK/logs/r2_build.txt"; echo "STOP build"; return 1; }
  (cd "$R2" && node node_modules/typescript/bin/tsc --noEmit) > "$BK/logs/r2_tsc.txt" 2>&1 || { tail -20 "$BK/logs/r2_tsc.txt"; echo "STOP tsc"; return 1; }
  log "step2 R2 built BUILD_ID=$(cat "$R2/.next/BUILD_ID")"
}

# ---- step 3 (S43 part 1) ----------------------------------------------------------------------------------------------------
step3_backup() {
  chk backup.acl_owner_only backup_acl_ok "$BK" || return 1
  chk dump.absent path_absent "$DUMP" || return 1
  on_db "$PROD_DB" pg_dump --format=custom --file="$DUMP" || { echo "STOP pg_dump"; return 1; }
  pg_restore --list "$DUMP" > "$BK/logs/dump_list.txt" || { echo "STOP pg_restore --list"; return 1; }
  psql_ro "$PROD_DB" -f "$BK/sql/counts_all.sql" > "$BK/logs/prod_counts_03_dump.txt" || return 1
  chk dump.table_data_count dump_list_matches "$BK/logs/dump_list.txt" "$BK/logs/prod_counts_03_dump.txt" || return 1
  (cd "$BK" && sha256sum "$(basename "$DUMP")" > SHA256SUMS) || return 1
  echo "SHA256SUMS $(sha256sum < "$BK/SHA256SUMS" | cut -c1-64)" >> "$BK/logs/anchors.txt" || return 1
  show_anchors
  log "step3 dump $(cut -c1-16 "$BK/SHA256SUMS") (full production copy; retention per section L)"
}

# ---- step 4 (S43 part 2) ----------------------------------------------------------------------------------------------------
step4_clone() {
  chk clone.absent clone_absent || return 1
  chk dump.sha sha_ok "$BK" SHA256SUMS || return 1
  on_db "$MAINT_DB" psql -X -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"$CLONE_DB\"" || return 1
  restore_into "$CLONE_DB" "$DUMP" --no-owner > "$BK/logs/clone_restore.txt" 2>&1 || { cat "$BK/logs/clone_restore.txt"; echo "STOP restore"; return 1; }
  psql_ro "$CLONE_DB" -f "$BK/sql/counts_all.sql" > "$BK/logs/clone_counts_04.txt" || return 1
  chk clone.studio_counts_eq_dump studio_counts_same "$BK/logs/prod_counts_03_dump.txt" "$BK/logs/clone_counts_04.txt" || return 1
  chk clone.db_guard db_guard "$CLONE_DB" || return 1
  prisma_r2 "$CLONE_DB" migrate status > "$BK/logs/clone_migrate_status.txt" 2>&1 || { cat "$BK/logs/clone_migrate_status.txt"; echo "STOP migrate status (pending migration or error)"; return 1; }
  chk clone.schema_up_to_date has_line "$BK/logs/clone_migrate_status.txt" 'Database schema is up to date' || return 1
  chk clone.migrate_datasource has_line "$BK/logs/clone_migrate_status.txt" "$CLONE_DB" || return 1
  prisma_r2 "$CLONE_DB" migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script > "$BK/logs/clone_drift.sql" 2>&1 || return 1
  chk clone.drift_only_known drift_known "$BK/logs/clone_drift.sql" || return 1
  log "step4 clone ready"
}

# ---- step 5 (S43 part 3) ----------------------------------------------------------------------------------------------------
step5_seed() {
  psql_ro "$CLONE_DB" -f "$BK/sql/old_templates_fp.sql" > "$BK/logs/clone_old_templates_05a.txt" || return 1
  psql_ro "$CLONE_DB" -f "$BK/sql/sectiontypes_fp.sql" > "$BK/logs/clone_sectiontypes_05a.txt" || return 1
  chk clone.old_templates_eq_prod same_file "$BK/logs/prod_old_templates_00.txt" "$BK/logs/clone_old_templates_05a.txt" || return 1
  chk clone.sectiontypes_eq_prod same_file "$BK/logs/prod_sectiontypes_00.txt" "$BK/logs/clone_sectiontypes_05a.txt" || return 1
  mkdir -p "$RWS_SEED" || return 1
  chk clone.db_guard_dry db_guard "$CLONE_DB" || return 1
  seed_run --doc-type-templates --dry-run > "$BK/logs/seed_1_dry.log" 2>&1 || { tail -5 "$BK/logs/seed_1_dry.log"; echo "STOP seed dry-run"; return 1; }
  chk seed.dry_ok node "$BK/tools/check_seed.mjs" "$BK/logs/seed_1_dry.log" dry "$CLONE_DB" || return 1
  chk clone.db_guard_real db_guard "$CLONE_DB" || return 1
  seed_run --doc-type-templates > "$BK/logs/seed_2_real.log" 2>&1 || { tail -5 "$BK/logs/seed_2_real.log"; echo "STOP seed"; return 1; }
  chk seed.real_ok node "$BK/tools/check_seed.mjs" "$BK/logs/seed_2_real.log" real "$CLONE_DB" || return 1
  seed_run --doc-type-templates > "$BK/logs/seed_3_rerun.log" 2>&1 || { tail -5 "$BK/logs/seed_3_rerun.log"; echo "STOP seed rerun"; return 1; }
  chk seed.rerun_ok node "$BK/tools/check_seed.mjs" "$BK/logs/seed_3_rerun.log" rerun "$CLONE_DB" || return 1
  psql_ro "$CLONE_DB" -f "$BK/sql/old_templates_fp.sql" > "$BK/logs/clone_old_templates_05b.txt" || return 1
  psql_ro "$CLONE_DB" -f "$BK/sql/sectiontypes_fp.sql" > "$BK/logs/clone_sectiontypes_05b.txt" || return 1
  psql_ro "$CLONE_DB" -f "$BK/sql/new10_fp.sql" > "$BK/logs/clone_new10_05.txt" || return 1
  chk clone.old_templates_unchanged same_file "$BK/logs/clone_old_templates_05a.txt" "$BK/logs/clone_old_templates_05b.txt" || return 1
  chk clone.sectiontypes_eq_prod_after same_file "$BK/logs/prod_sectiontypes_00.txt" "$BK/logs/clone_sectiontypes_05b.txt" || return 1
  chk clone.new10_shape new10_shape "$BK/logs/clone_new10_05.txt" || return 1
  log "step5 seeded on clone: $(paste -sd' ' "$BK/logs/clone_new10_05.txt" | cut -c1-200)"
}

# ---- step 6 (S44) -----------------------------------------------------------------------------------------------------------
step6_rehearsal() {
  local G="$BK/gladi/r2" n
  chk port.9031_free port_free 9031 || return 1
  chk port.9051_free port_free 9051 || return 1
  spawn_out "$BK/oa/start-hq2.sh $R2 $ECO/hq-r2-gladi.log 9031 127.0.0.1 $CLONE_DB $RWS_R2" || return 1
  wait_http https://127.0.0.1:9031/login 90 || return 1
  chk smoke.r2_9031 smoke_to https://127.0.0.1:9031 "$BK/logs/smoke_06_r2_9031.txt" || return 1
  chk smoke.r2_9031_17 has_line "$BK/logs/smoke_06_r2_9031.txt" '"id":"S-5","ok":true,"status":200,"n":17,' || return 1
  rd "$R2" https://127.0.0.1:9031 "$G" 2026-11-04_datum-rev-a-gladi-r2 spec > "$BK/logs/gladi_r2_spec.txt" 2>&1 || return 1
  RD_TARGETS="$GLADI_TARGETS" rd "$R2" https://127.0.0.1:9031 "$G" 2026-11-04_datum-rev-a-gladi-r2 write > "$BK/logs/gladi_r2_write.txt" 2>&1 || return 1
  RD_TARGETS="$GLADI_TARGETS" rd "$R2" https://127.0.0.1:9031 "$G" 2026-11-04_datum-rev-a-gladi-r2 render > "$BK/logs/gladi_r2_render.txt" 2>&1 || return 1
  rd "$R2" https://127.0.0.1:9031 "$G" 2026-11-04_datum-rev-a-gladi-r2 bfix > "$BK/logs/gladi_r2_bfix.txt" 2>&1 || return 1
  chk gladi.r2_render_11 node "$BK/tools/check_render.mjs" "$G" 11 || return 1
  spawn_out "$BK/oa/start-hq2.sh $OLD $ECO/hq-old-gladi.log 9051 127.0.0.1 $CLONE_DB $RWS_OLD" || return 1
  wait_http https://127.0.0.1:9051/login 90 || return 1
  chk smoke.old_9051 smoke_to https://127.0.0.1:9051 "$BK/logs/smoke_06_old_9051.txt" || return 1
  chk smoke.old_9051_17 has_line "$BK/logs/smoke_06_old_9051.txt" '"id":"S-5","ok":true,"status":200,"n":17,' || return 1
  mkdir -p "$BK/gladi/old-a" || return 1
  cp -p "$G/spec.json" "$BK/gladi/old-a/spec.json" || return 1
  RD_TARGETS=datum-gsp rd "$OLD" https://127.0.0.1:9051 "$BK/gladi/old-a" 2026-11-04_datum-rev-a-gladi-old-a write > "$BK/logs/gladi_old_a.txt" 2>&1 || return 1
  RD_TARGETS=datum-gsp rd "$OLD" https://127.0.0.1:9051 "$BK/gladi/old-a" 2026-11-04_datum-rev-a-gladi-old-a render >> "$BK/logs/gladi_old_a.txt" 2>&1 || return 1
  chk gladi.old_code_datum_gsp node "$BK/tools/check_render.mjs" "$BK/gladi/old-a" 1 || return 1
  sed 's/@VALUE@/true/g' "$BK/sql/rb1_set_archived.sql.tpl" > "$BK/sql/rb1_archive.sql" || return 1
  sed 's/@VALUE@/false/g' "$BK/sql/rb1_set_archived.sql.tpl" > "$BK/sql/rb1_unarchive_clone_only.sql" || return 1
  on_db "$CLONE_DB" psql -X -At -F'|' -q -v ON_ERROR_STOP=1 --single-transaction -v expect_db="$CLONE_DB" -f "$BK/sql/rb1_archive.sql" > "$BK/logs/gladi_rb1_archive.txt" 2>&1 || { cat "$BK/logs/gladi_rb1_archive.txt"; return 1; }
  chk smoke.old_archived smoke_to https://127.0.0.1:9051 "$BK/logs/smoke_06_old_archived.txt" || return 1
  chk smoke.old_archived_7 has_line "$BK/logs/smoke_06_old_archived.txt" '"id":"S-5","ok":true,"status":200,"n":7,' || return 1
  chk smoke.old_code_latest_datum_gsp has_line "$BK/logs/smoke_06_old_archived.txt" '"id":"OLD-CODE-LATEST","slug":"datum-gsp"' || return 1
  RD_TARGETS=latest rd "$OLD" https://127.0.0.1:9051 "$BK/gladi/old-b" 2026-11-04_datum-rev-a-gladi-old-b write > "$BK/logs/gladi_old_b.txt" 2>&1 || return 1
  n=$(psql_ro "$CLONE_DB" -c "select t.slug from \"StudioDocument\" d join \"StudioTemplate\" t on t.id = d.\"templateId\" where d.\"missionFolder\" = '2026-11-04_datum-rev-a-gladi-old-b'")
  chk gladi.old_mcp_latest_is_datum_gsp eq "$n" datum-gsp || return 1
  on_db "$CLONE_DB" psql -X -At -F'|' -q -v ON_ERROR_STOP=1 --single-transaction -v expect_db="$CLONE_DB" -f "$BK/sql/rb1_unarchive_clone_only.sql" > "$BK/logs/gladi_rb1_unarchive.txt" 2>&1 || { cat "$BK/logs/gladi_rb1_unarchive.txt"; return 1; }
  psql_ro "$CLONE_DB" -f "$BK/sql/new10_fp.sql" > "$BK/logs/clone_new10_06.txt" || return 1
  chk clone.unarchive_restores_seeded_rows same_file "$BK/logs/clone_new10_05.txt" "$BK/logs/clone_new10_06.txt" || return 1
  stop_listener 9031 || return 1
  stop_listener 9051 || return 1
  procs "$BK/logs/procs_06_after.txt" || return 1
  chk secrets.step6 secret_scan "$BK/logs" "$BK/gladi" "$ECO/hq-r2-gladi.log" "$ECO/hq-old-gladi.log" || return 1
  log "step6 rehearsal ok (S45 next: score $G/out with B-FIX $G/bfix)"
}

# ---- step 7 (S46) -----------------------------------------------------------------------------------------------------------
write_import_vars() { # manifest -> psql -v list (counts and md5 only)
  awk -F'|' 'BEGIN { split("t v s p r", k, " ") } { c[NR] = $2; f[NR] = $3 } END { if (NR != 5) exit 1; for (i = 1; i <= 5; i++) printf "-v exp_%s=%s ", k[i], c[i]; for (i = 1; i <= 5; i++) printf "-v fp_%s=%s ", k[i], f[i]; printf "\n" }' "$1"
}
step7_export() {
  sed "s#@EXP@#$BK/export#g" "$BK/sql/export_new10.sql.tpl" > "$BK/sql/export_new10.sql" || return 1
  sed "s#@EXP@#$BK/export#g" "$BK/sql/import_new10.sql.tpl" > "$BK/sql/import_new10.sql" || return 1
  chk sql.export_no_placeholder lacks_line "$BK/sql/export_new10.sql" '@EXP@' || return 1
  chk sql.import_no_placeholder lacks_line "$BK/sql/import_new10.sql" '@EXP@' || return 1
  psql_ro "$CLONE_DB" -v ON_ERROR_STOP=1 -f "$BK/sql/export_new10.sql" > "$BK/logs/export_copy.txt" || return 1
  psql_ro "$CLONE_DB" -f "$BK/sql/new10_fp.sql" > "$BK/export/MANIFEST_new10_fp.txt" || return 1
  chk export.manifest_eq_seeded same_file "$BK/logs/clone_new10_06.txt" "$BK/export/MANIFEST_new10_fp.txt" || return 1
  chk export.copy_counts_eq_manifest copy_counts_match "$BK/logs/export_copy.txt" "$BK/export/MANIFEST_new10_fp.txt" || return 1
  psql_ro "$CLONE_DB" -c "with v as (select v.id from \"StudioTemplateVersion\" v join \"StudioTemplate\" t on t.id = v.\"templateId\" where t.slug = any($SLUGS_SQL)) select (select count(*) from \"StudioArtifact\" where \"templateVersionId\" in (select id from v)) as artifacts, (select count(*) from \"StudioRevision\" where \"templateVersionId\" in (select id from v)) as revisions, (select count(*) from \"StudioDocument\" where \"templateId\" in (select id from \"StudioTemplate\" where slug = any($SLUGS_SQL))) as documents" > "$BK/logs/export_refs.txt" || return 1
  psql_ro "$CLONE_DB" -f "$BK/sql/sectiontypes_fp.sql" > "$BK/logs/clone_sectiontypes_07.txt" || return 1
  psql_ro "$PROD_DB" -f "$BK/sql/sectiontypes_fp.sql" > "$BK/logs/prod_sectiontypes_07.txt" || return 1
  chk sectiontypes.clone_eq_prod same_file "$BK/logs/clone_sectiontypes_07.txt" "$BK/logs/prod_sectiontypes_07.txt" || return 1
  write_import_vars "$BK/export/MANIFEST_new10_fp.txt" > "$BK/export/IMPORT_VARS.txt" || return 1
  chk export.import_vars_shape has_line "$BK/export/IMPORT_VARS.txt" '^-v exp_t=10 -v exp_v=10 -v exp_s=72 -v exp_p=[0-9]+ -v exp_r=[0-9]+ (-v fp_[tvspr]=[0-9a-f]{32} ){5}$' || return 1
  (cd "$BK/export" && sha256sum StudioTemplate.csv StudioTemplateVersion.csv StudioTemplateSlot.csv StudioTemplateSlotParam.csv StudioTemplateSlotRoleFormat.csv MANIFEST_new10_fp.txt IMPORT_VARS.txt > SHA256SUMS) || return 1
  (cd "$BK/sql" && sha256sum import_new10.sql export_new10.sql rb1_archive.sql > SHA256SUMS_sql) || return 1
  { echo "export/SHA256SUMS $(sha256sum < "$BK/export/SHA256SUMS" | cut -c1-64)"; echo "sql/SHA256SUMS_sql $(sha256sum < "$BK/sql/SHA256SUMS_sql" | cut -c1-64)"; } >> "$BK/logs/anchors.txt" || return 1
  cat "$BK/export/SHA256SUMS" "$BK/sql/SHA256SUMS_sql" >> "$BK/logs/runbook.log" || return 1
  show_anchors
  log "step7 export done; anchors in $BK/logs/anchors.txt and runbook.log"
}
step7_import_rehearsal() {
  local rc
  chk port.9031_free port_free 9031 || return 1
  chk anchors.match anchors_ok || return 1
  chk export.sha sha_ok "$BK/export" SHA256SUMS || return 1
  chk sql.sha sha_ok "$BK/sql" SHA256SUMS_sql || return 1
  chk clone.no_other_sessions_drop no_other_sessions "$CLONE_DB" || return 1
  on_db "$MAINT_DB" psql -X -v ON_ERROR_STOP=1 -c "DROP DATABASE \"$CLONE_DB\"" || return 1
  on_db "$MAINT_DB" psql -X -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"$CLONE_DB\"" || return 1
  restore_into "$CLONE_DB" "$DUMP" --no-owner > "$BK/logs/clone2_restore.txt" 2>&1 || { cat "$BK/logs/clone2_restore.txt"; return 1; }
  psql_ro "$CLONE_DB" -f "$BK/sql/old_templates_fp.sql" > "$BK/logs/clone2_old_templates_before.txt" || return 1
  on_db "$CLONE_DB" psql -X -v ON_ERROR_STOP=1 --single-transaction -v expect_db="$CLONE_DB" $(cat "$BK/export/IMPORT_VARS.txt") -f "$BK/sql/import_new10.sql" > "$BK/logs/clone2_import.txt" 2>&1 || { cat "$BK/logs/clone2_import.txt"; echo "STOP rehearsal import"; return 1; }
  chk import.post_checks has_line "$BK/logs/clone2_import.txt" 'post-checks ok: 17 templates \(before 7 \+ 10\)' || return 1
  psql_ro "$CLONE_DB" -f "$BK/sql/new10_fp.sql" > "$BK/logs/clone2_new10_after.txt" || return 1
  psql_ro "$CLONE_DB" -f "$BK/sql/old_templates_fp.sql" > "$BK/logs/clone2_old_templates_after.txt" || return 1
  chk import.rows_eq_export same_file "$BK/export/MANIFEST_new10_fp.txt" "$BK/logs/clone2_new10_after.txt" || return 1
  chk import.old_unchanged same_file "$BK/logs/clone2_old_templates_before.txt" "$BK/logs/clone2_old_templates_after.txt" || return 1
  on_db "$CLONE_DB" psql -X -v ON_ERROR_STOP=1 --single-transaction -v expect_db="$CLONE_DB" $(cat "$BK/export/IMPORT_VARS.txt") -f "$BK/sql/import_new10.sql" > "$BK/logs/clone2_import_again.txt" 2>&1; rc=$?
  chk import.second_run_refused eq "$rc" 3 || return 1
  chk import.second_run_reason has_line "$BK/logs/clone2_import_again.txt" 'STOP a slug already exists in target' || return 1
  spawn_out "$BK/oa/start-hq2.sh $R2 $ECO/hq-r2-gladi.log 9031 127.0.0.1 $CLONE_DB $RWS_R2" || return 1
  wait_http https://127.0.0.1:9031/login 90 || return 1
  chk smoke.r2_imported smoke_to https://127.0.0.1:9031 "$BK/logs/smoke_07_r2_imported.txt" || return 1
  chk smoke.r2_imported_17 has_line "$BK/logs/smoke_07_r2_imported.txt" '"id":"S-5","ok":true,"status":200,"n":17,' || return 1
  stop_listener 9031 || return 1
  # RB-3 rehearsal: the restore command RB-3 uses, onto the clone (10 rows present -> back to the dump state)
  chk clone.no_other_sessions_rb3 no_other_sessions "$CLONE_DB" || return 1
  restore_into "$CLONE_DB" "$DUMP" --clean --if-exists --single-transaction --no-owner > "$BK/logs/clone_rb3_rehearsal.txt" 2>&1 || { cat "$BK/logs/clone_rb3_rehearsal.txt"; echo "STOP RB-3 rehearsal"; return 1; }
  psql_ro "$CLONE_DB" -f "$BK/sql/new10_fp.sql" > "$BK/logs/clone_rb3_new10.txt" || return 1
  psql_ro "$CLONE_DB" -f "$BK/sql/old_templates_fp.sql" > "$BK/logs/clone_rb3_old_templates.txt" || return 1
  chk rb3_rehearsal.new_rows_gone new10_zero "$BK/logs/clone_rb3_new10.txt" || return 1
  chk rb3_rehearsal.old_eq_prod same_file "$BK/logs/prod_old_templates_00.txt" "$BK/logs/clone_rb3_old_templates.txt" || return 1
  chk clone.no_other_sessions_final no_other_sessions "$CLONE_DB" || return 1
  on_db "$MAINT_DB" psql -X -v ON_ERROR_STOP=1 -c "DROP DATABASE \"$CLONE_DB\"" || return 1
  log "step7 import rehearsal + RB-3 rehearsal ok; clone dropped"
}

# ---- step 8 (S47) -----------------------------------------------------------------------------------------------------------
step8_swap() {
  local old_pid t0 t1
  procs "$BK/logs/procs_08_before.txt" || return 1
  old_pid=$(listener_pid 9011)
  chk prod.9011_listening eq "${old_pid:+y}" y || return 1
  chk smoke.before smoke_to https://localhost:9011 "$BK/logs/smoke_08_before.txt" || return 1
  chk port.9051_free port_free 9051 || return 1
  spawn_out "$BK/oa/start-hq2.sh $OLD $ECO/hq-v21-standby-9051.log 9051 127.0.0.1 - -" || return 1
  wait_http https://127.0.0.1:9051/login 90 || return 1
  chk smoke.standby smoke_to https://127.0.0.1:9051 "$BK/logs/smoke_08_standby.txt" || return 1
  chk window.ok window_ok || return 1
  t0=$(date '+%T.%N')
  stop_listener 9011 || return 1
  spawn_out "$BK/oa/start-hq2.sh $R2 $ECO/hq-r2.log - - - -" || { echo "STOP start failed: run rb2_code"; return 1; }
  wait_http https://localhost:9011/login 90 || { echo "STOP no 200: run rb2_code"; return 1; }
  t1=$(date '+%T.%N'); log "step8 downtime $t0 -> $t1; old pid $old_pid; 9011 now pid $(listener_pid 9011)"
  chk smoke.after smoke_to https://localhost:9011 "$BK/logs/smoke_08_after.txt" || return 1
  chk templates.same_7 same_file <(grep '"S-5"' "$BK/logs/smoke_08_before.txt") <(grep '"S-5"' "$BK/logs/smoke_08_after.txt") || return 1
  chk r2.latest_unit_test latest_unit_test || return 1
  psql_ro "$PROD_DB" -f "$BK/sql/old_templates_fp.sql" > "$BK/logs/prod_old_templates_08.txt" || return 1
  chk prod.templates_untouched same_file "$BK/logs/prod_old_templates_00.txt" "$BK/logs/prod_old_templates_08.txt" || return 1
  chk prod.db_guard db_guard "$PROD_DB" || return 1
  prisma_r2 "$PROD_DB" migrate status > "$BK/logs/prod_migrate_08.txt" 2>&1 || { cat "$BK/logs/prod_migrate_08.txt"; return 1; }
  chk prod.schema_up_to_date has_line "$BK/logs/prod_migrate_08.txt" 'Database schema is up to date' || return 1
  chk r2.log_no_request_error lacks_line "$ECO/hq-r2.log" 'request error' || return 1
  log "step8 swap ok"
}

# ---- step 9 (S48) -----------------------------------------------------------------------------------------------------------
step9_launchers() {
  local S=/c/Users/TRIAL/gsp-ecosystem/gsp-ecosystem-start.sh W=/c/Users/TRIAL/AppData/Local/hermes/scripts/watchdog-webui-hq.py
  oa_run "$BK/logs/realcheck_09_before.txt" 60 "$BK/oa/realcheck.sh $BK 09_before" || return 1
  oa_run "$BK/logs/launcher_edit_r2.txt" 60 "$BK/oa/launcher_edit_r2.sh $BK" || return 1
  chk launcher.start_edited has_line "$BK/logs/launcher_edit_r2.txt" '^edited .*gsp-ecosystem-start\.sh ' || return 1
  chk launcher.watchdog_edited has_line "$BK/logs/launcher_edit_r2.txt" '^edited .*watchdog-webui-hq\.py ' || return 1
  chk launcher.bash_n has_line "$BK/logs/launcher_edit_r2.txt" '^bash -n start\.sh OK' || return 1
  chk launcher.compile has_line "$BK/logs/launcher_edit_r2.txt" '^watchdog compile OK' || return 1
  oa_run "$BK/logs/realcheck_09_after.txt" 60 "$BK/oa/realcheck.sh $BK 09_after" || return 1
  REAL_VIEW="$BK/logs/realcheck_09_after.txt"
  chk launcher.real_view_eq_app_view real_eq_app "$S" "$W" || return 1
  chk launcher.no_old_path_left lacks_line "$REAL_VIEW" 'gsp-hq-prod-v21[\\/"]' || return 1
  log "step9 launchers -> R2"
}

# ---- step 10 (S49) ----------------------------------------------------------------------------------------------------------
step10_repoint() {
  oa_run "$BK/logs/hermes_repoint.txt" 60 "$BK/oa/hermes_repoint.sh $BK" || return 1
  chk hermes.five_backups eq "$(grep -cE '^gsp-[a-z0-9-]+: [0-9a-f]{16} -> [0-9a-f]{16} backup ' "$BK/logs/hermes_repoint.txt")" 5 || return 1
  chk hermes.five_refs eq "$(grep -c 'r2_refs=3 old_refs=0 env_ref=1' "$BK/logs/hermes_repoint.txt")" 5 || return 1
  oa_run "$BK/logs/realcheck_10_after_repoint.txt" 60 "$BK/oa/realcheck.sh $BK 10_after_repoint" || return 1
  chk hermes.real_view eq "$(grep -c 'r2_refs=3 old_refs=0' "$BK/logs/realcheck_10_after_repoint.txt")" 5 || return 1
  hermes gateway list > "$BK/logs/gateway_list_10a.txt" 2>&1
  log "step10 repoint ok"
}
hermes() { "$HERMES" "$@"; }
gw_one() { # <profile> <tag> : out-of-app restart of one gateway (D-589: run gsp-worker, then gsp-worker-fast, master01, thinker)
  local p="$1" t="$2"
  hermes -p "$p" gateway status > "$BK/logs/gw_status_${t}_$p.txt" 2>&1
  oa_run "$BK/logs/gw_restart_${t}_$p.log" 180 "$BK/oa/gw_restart2.sh $BK $p $t" || return 1
  chk "gw.$p.started" has_line "$BK/logs/gw_restart_${t}_$p.log" 'Gateway started' || return 1
  procs "$BK/logs/procs_${t}_$p.txt" || return 1
  log "gateway $p restarted ($t)"
}
step10_gate() {
  local p
  hermes gateway list > "$BK/logs/gateway_list_10b.txt" 2>&1
  chk gate.old_mcp_zero old_mcp_zero "$BK/logs/procs_10_final.txt" || return 1
  chk gate.r2_mcp_four ge "$(sed -nE 's/^OLD_MCP=0 R2_MCP=([0-9]+) .*$/\1/p' "$BK/logs/procs_10_final.txt")" 4 || return 1
  for p in gsp-master01 gsp-master gsp-thinker gsp-worker gsp-worker-fast; do
    oa_run "$BK/logs/mcp_e2e_10_$p.log" 300 "$BK/oa/mcp_e2e2.sh $BK $p 10" || return 1
    chk "e2e.$p" has_line "$BK/logs/mcp_e2e_10_$p.log" 'STUDIO_E2E ok=true' || return 1
  done
  chk secrets.step10 secret_scan "$BK/logs" || return 1
  log "step10 gate ok: OLD_MCP=0"
}

# ---- step 11 (S50) ----------------------------------------------------------------------------------------------------------
step11_import() {
  chk gate.old_mcp_zero old_mcp_zero "$BK/logs/procs_11_before.txt" || return 1
  chk gate.datum_gsp_active datum_gsp_active || return 1
  chk gate.latest_unit_test latest_unit_test || return 1
  chk anchors.match anchors_ok || return 1
  chk export.sha sha_ok "$BK/export" SHA256SUMS || return 1
  chk sql.sha sha_ok "$BK/sql" SHA256SUMS_sql || return 1
  psql_ro "$PROD_DB" -f "$BK/sql/counts_all.sql" > "$BK/logs/prod_counts_11_before.txt" || return 1
  psql_ro "$PROD_DB" -f "$BK/sql/old_templates_fp.sql" > "$BK/logs/prod_old_templates_11_before.txt" || return 1
  psql_ro "$PROD_DB" -f "$BK/sql/new10_fp.sql" > "$BK/logs/prod_new10_11_before.txt" || return 1
  chk prod.new10_absent new10_zero "$BK/logs/prod_new10_11_before.txt" || return 1
  on_db "$PROD_DB" psql -X -v ON_ERROR_STOP=1 --single-transaction -v expect_db="$PROD_DB" $(cat "$BK/export/IMPORT_VARS.txt") -f "$BK/sql/import_new10.sql" > "$BK/logs/prod_import.txt" 2>&1 || { cat "$BK/logs/prod_import.txt"; echo "STOP import failed: one transaction, nothing written"; return 1; }
  chk import.post_checks has_line "$BK/logs/prod_import.txt" 'post-checks ok: 17 templates \(before 7 \+ 10\)' || { echo "STOP: run rb1_archive"; return 1; }
  psql_ro "$PROD_DB" -f "$BK/sql/counts_all.sql" > "$BK/logs/prod_counts_11_after.txt" || return 1
  psql_ro "$PROD_DB" -f "$BK/sql/old_templates_fp.sql" > "$BK/logs/prod_old_templates_11_after.txt" || return 1
  psql_ro "$PROD_DB" -f "$BK/sql/new10_fp.sql" > "$BK/logs/prod_new10_11_after.txt" || return 1
  chk prod.old_templates_identical same_file "$BK/logs/prod_old_templates_11_before.txt" "$BK/logs/prod_old_templates_11_after.txt" || { echo "STOP: run rb1_archive"; return 1; }
  chk prod.rows_eq_export same_file "$BK/export/MANIFEST_new10_fp.txt" "$BK/logs/prod_new10_11_after.txt" || { echo "STOP: run rb1_archive"; return 1; }
  chk prod.total_17 eq "$(psql_ro "$PROD_DB" -c 'select count(*) from "StudioTemplate"')" 17 || { echo "STOP: run rb1_archive"; return 1; }
  chk smoke.after_import smoke_to https://localhost:9011 "$BK/logs/smoke_11_after.txt" || return 1
  chk smoke.after_import_17 has_line "$BK/logs/smoke_11_after.txt" '"id":"S-5","ok":true,"status":200,"n":17,' || return 1
  chk gate.old_mcp_zero_after old_mcp_zero "$BK/logs/procs_11_after.txt" || return 1
  log "step11 import committed and verified"
}

# ---- step 12 (S51, D-612: one document) --------------------------------------------------------------------------------------
step12_smoke() {
  local P="$BK/prod-smoke"
  chk gate.old_mcp_zero old_mcp_zero "$BK/logs/procs_12_before.txt" || return 1
  rd "$R2" https://localhost:9011 "$P" "$SMOKE_MISSION" spec > "$BK/logs/prod_smoke_spec.txt" 2>&1 || return 1
  RD_TARGETS="$SMOKE_SLUG" rd "$R2" https://localhost:9011 "$P" "$SMOKE_MISSION" write > "$BK/logs/prod_smoke_write.txt" 2>&1 || return 1
  RD_TARGETS="$SMOKE_SLUG" rd "$R2" https://localhost:9011 "$P" "$SMOKE_MISSION" render > "$BK/logs/prod_smoke_render.txt" 2>&1 || return 1
  chk smoke.one_doc_rendered node "$BK/tools/check_render.mjs" "$P" 1 || return 1
  psql_ro "$PROD_DB" -c "select \"docNumber\", \"typeCode\", tier, language, archived, \"createdBy\" from \"StudioDocument\" where \"missionFolder\" = '$SMOKE_MISSION' order by \"docNumber\"" > "$BK/logs/prod_smoke_docs.txt" || return 1
  chk smoke.exactly_one_doc eq "$(grep -c . "$BK/logs/prod_smoke_docs.txt")" 1 || return 1
  chk smoke.doc_meta has_line "$BK/logs/prod_smoke_docs.txt" '\|NOT\|NOTA\|ID\|f\|agent:hermes-datum-rollout$' || return 1
  chk secrets.step12 secret_scan "$P" "$BK/logs" || return 1
  log "step12 production smoke: 1 document ($SMOKE_SLUG)"
}

# ---- step 13 (S53, Q-D) -----------------------------------------------------------------------------------------------------
step13_skill() {
  local f
  chk skill.source_not_draft lacks_line "$R2/docs/hermes-skills/gsp-studio-write/SKILL.md" '^Status: DRAF' || return 1
  oa_run "$BK/logs/skill_refresh.txt" 60 "$BK/oa/skill_refresh.sh $BK $R2" || return 1
  chk skill.three_same eq "$(grep -c '^SAME ' "$BK/logs/skill_refresh.txt")" 3 || return 1
  for f in docs/hermes-skills/gsp-studio-write/SKILL.md docs/STUDIO-HOWTO-DOCUMENT.md docs/STUDIO-HOWTO-REPORT.md; do
    chk "skill.repo_eq_r2.$(basename "$f")" cmp -s "$REPO/$f" "$R2/$f" || return 1
  done
  oa_run "$BK/logs/realcheck_13_after_skill.txt" 60 "$BK/oa/realcheck.sh $BK 13_after_skill" || return 1
  REAL_VIEW="$BK/logs/realcheck_13_after_skill.txt"
  chk skill.real_view_eq_repo real_eq_app "$R2/docs/hermes-skills/gsp-studio-write/SKILL.md" "$R2/docs/STUDIO-HOWTO-DOCUMENT.md" "$R2/docs/STUDIO-HOWTO-REPORT.md" || return 1
  log "step13 skill refreshed"
}
step13_archive() {
  chk smoke.exactly_one_doc eq "$(psql_ro "$PROD_DB" -c "select count(*) from \"StudioDocument\" where \"missionFolder\" = '$SMOKE_MISSION'")" 1 || return 1
  on_db "$PROD_DB" psql -X -At -F'|' -q -v ON_ERROR_STOP=1 --single-transaction -v expect_db="$PROD_DB" -v mission="$SMOKE_MISSION" -v exp_docs=1 -f "$BK/sql/archive_smoke_docs.sql" > "$BK/logs/prod_smoke_archive.txt" 2>&1 || { cat "$BK/logs/prod_smoke_archive.txt"; return 1; }
  chk smoke.archived has_line "$BK/logs/prod_smoke_archive.txt" '\|t\|agent:hermes-datum-rollout$' || return 1
  log "step13 smoke document archived"
}
s54_secret_scan() {
  chk secrets.s54 secret_scan "$BK/logs" "$BK/prod-smoke" "$BK/gladi" "$BK/export" "$ECO/hq-r2.log" "$ECO/hq-r2-gladi.log" "$ECO/hq-old-gladi.log" "$ECO/hq-v21-standby-9051.log" || return 1
}

# ---- rollback -----------------------------------------------------------------------------------------------------------------
rb1_archive() {
  chk sql.sha sha_ok "$BK/sql" SHA256SUMS_sql || return 1
  on_db "$PROD_DB" psql -X -At -F'|' -q -v ON_ERROR_STOP=1 --single-transaction -v expect_db="$PROD_DB" -f "$BK/sql/rb1_archive.sql" > "$BK/logs/RB1_archive.txt" 2>&1 || { cat "$BK/logs/RB1_archive.txt"; return 1; }
  chk rb1.ten_archived eq "$(grep -cE '^datum-[a-z-]+\|t$' "$BK/logs/RB1_archive.txt")" 10 || return 1
  chk rb1.smoke smoke_to https://localhost:9011 "$BK/logs/smoke_RB1.txt" || return 1
  chk rb1.list_7 has_line "$BK/logs/smoke_RB1.txt" '"id":"S-5","ok":true,"status":200,"n":7,' || return 1
  chk rb1.old_code_latest has_line "$BK/logs/smoke_RB1.txt" '"id":"OLD-CODE-LATEST","slug":"datum-gsp"' || return 1
  log "RB-1 done"
}
rb2_code() {
  chk rb2.new_rows_not_active new10_not_active || { echo "STOP: run rb1_archive first"; return 1; }
  chk window.ok window_ok || return 1
  stop_listener 9011 || return 1
  spawn_out "$BK/oa/start-hq2.sh $OLD $ECO/hq-v21.log - - - -" || return 1
  wait_http https://localhost:9011/login 90 || return 1
  chk rb2.smoke smoke_to https://localhost:9011 "$BK/logs/smoke_RB2.txt" || return 1
  stop_listener 9051 || return 1
  log "RB-2 code: OLD on 9011"
}
rb2_config() {
  oa_run "$BK/logs/launcher_restore.txt" 60 "$BK/oa/launcher_restore.sh $BK" || return 1
  chk rb2.launcher_start_sha has_line "$BK/logs/launcher_restore.txt" '^3fc38f68108a365da194d89e79fbd8b6476b92198dc870559d74f0ba3c4aeb8f ' || return 1
  chk rb2.launcher_watchdog_sha has_line "$BK/logs/launcher_restore.txt" '^d84a5d7196264ddd5cd1d787c79b2e6239da21817a1d360a8a75d8daaf14da2d ' || return 1
  oa_run "$BK/logs/hermes_restore.txt" 60 "$BK/oa/hermes_restore.sh $BK" || return 1
  chk rb2.hermes_restored eq "$(grep -c 'old_refs=3 r2_refs=0' "$BK/logs/hermes_restore.txt")" 5 || return 1
  log "RB-2 config restored (now gw_one <p> RB2 for gsp-worker, gsp-worker-fast, gsp-master01, gsp-thinker; then rb2_gate)"
}
rb2_gate() {
  local p
  chk rb2.r2_mcp_zero r2_mcp_zero "$BK/logs/procs_RB2_final.txt" || return 1
  for p in gsp-master01 gsp-master gsp-thinker gsp-worker gsp-worker-fast; do
    oa_run "$BK/logs/mcp_e2e_RB2_$p.log" 300 "$BK/oa/mcp_e2e2.sh $BK $p RB2" || return 1
    chk "rb2.e2e.$p" has_line "$BK/logs/mcp_e2e_RB2_$p.log" 'STUDIO_E2E ok=true' || return 1
  done
  log "RB-2 done"
}
rb3_restore() { # last resort: full restore of the step-3 dump; hard-gated (M39-3), writers stopped before the safety dump (R-L2)
  local stamp safe
  chk window.ok window_ok || return 1
  chk dump.sha sha_ok "$BK" SHA256SUMS || return 1
  chk anchors.dump anchor_is SHA256SUMS "$BK/SHA256SUMS" || return 1
  stamp=$(date +%Y%m%d-%H%M%S); safe="$BK/pre_rb3_$stamp.dump"
  chk safety.name_unique path_absent "$safe" || return 1
  chk window.ok_before_stop window_ok || return 1
  stop_listener 9011 || return 1
  stop_listener 9051 || return 1
  stop_listener 9041 || return 1
  stop_bridge || return 1
  chk db.no_other_sessions no_other_sessions "$PROD_DB" || return 1
  on_db "$PROD_DB" pg_dump --format=custom --file="$safe" || { echo "STOP safety dump failed; run rb3_restart"; return 1; }
  pg_restore --list "$safe" > "$BK/logs/pre_rb3_$stamp.list" || { echo "STOP safety dump unreadable; run rb3_restart"; return 1; }
  psql_ro "$PROD_DB" -f "$BK/sql/counts_all.sql" > "$BK/logs/prod_counts_pre_rb3_$stamp.txt" || return 1
  chk safety.table_data_count dump_list_matches "$BK/logs/pre_rb3_$stamp.list" "$BK/logs/prod_counts_pre_rb3_$stamp.txt" || return 1
  (cd "$BK" && sha256sum "pre_rb3_$stamp.dump" > "SHA256SUMS_rb3_$stamp" && sha256sum -c --quiet "SHA256SUMS_rb3_$stamp") || { echo "STOP safety dump sha"; return 1; }
  echo "SHA256SUMS_rb3_$stamp $(sha256sum < "$BK/SHA256SUMS_rb3_$stamp" | cut -c1-64)" >> "$BK/logs/anchors.txt" || return 1
  chk safety.anchored anchor_is "SHA256SUMS_rb3_$stamp" "$BK/SHA256SUMS_rb3_$stamp" || return 1
  show_anchors
  log "RB-3 safety dump $safe verified (writers stopped first)"
  chk db.no_other_sessions_before_restore no_other_sessions "$PROD_DB" || return 1
  restore_into "$PROD_DB" "$DUMP" --clean --if-exists --single-transaction --no-owner > "$BK/logs/RB3_restore.txt" 2>&1 || { cat "$BK/logs/RB3_restore.txt"; echo "STOP restore failed (single transaction: production unchanged); run rb3_restart"; return 1; }
  psql_ro "$PROD_DB" -f "$BK/sql/counts_all.sql" > "$BK/logs/prod_counts_RB3.txt" || return 1
  chk rb3.studio_counts_eq_dump studio_counts_same "$BK/logs/prod_counts_03_dump.txt" "$BK/logs/prod_counts_RB3.txt" || return 1
  log "RB-3 restore done (safety dump $safe)"
}
rb3_restart() { # brings HQ, bridge and the 9041 standby back after RB-3
  spawn_out /c/Users/TRIAL/gsp-ecosystem/gsp-ecosystem-start.sh || return 1
  wait_http https://localhost:9011/login 120 || return 1
  chk rb3.smoke smoke_to https://localhost:9011 "$BK/logs/smoke_RB3.txt" || return 1
  chk rb3.bridge_running eq "$( [ -n "$(bridge_pids)" ] && echo y)" y || return 1
  spawn_out "$BK/oa/start-hq2.sh /c/Users/TRIAL/gsp-datacenter $ECO/hq-9041.log 9041 127.0.0.1 - -" || return 1
  wait_http https://127.0.0.1:9041/login 90 || return 1
  log "RB-3 restart done"
}
```

<!-- file: tools/gate_tests.sh -->
```bash
#!/usr/bin/env bash
# gate_tests.sh <step function> [args...] : M39-1 proof without side effects. Sources steps.sh in a subshell sandbox and
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
  bridge_pids secret_scan no_other_sessions latest_unit_test seed_run prisma_r2 hermes py cat write_import_vars oa_run show_anchors"

run_case() { # <label to fail, or -> : writes $SB/rec.<n>
  local fail="$1" rec="$2"
  (
    BK="$SB/bk"; ECO="$SB/eco"; WORK="$BK/work"
    mkdir -p "$BK/logs" "$BK/sql" "$BK/oa" "$BK/tools" "$BK/export" "$BK/gladi/r2" "$BK/gladi/old-a" "$BK/prod-smoke" "$WORK" "$ECO"
    REPO=/sandbox/repo OLD=/sandbox/old R2=/sandbox/r2 ASSETS=/sandbox/assets DECISIONS=/sandbox/decisions.md RUNBOOK=/sandbox/rb.md
    PY=py HERMES=hermes TAG=tag-under-test SMOKE_MISSION=2026-11-04_datum-rev-a-prod-smoke SMOKE_SLUG=datum-nota
    PROD_DB=gsp_agent_hq CLONE_DB=gsp_agent_hq_v21_seedtest MAINT_DB=postgres RWS_R2=/sandbox/w1 RWS_OLD=/sandbox/w2 RWS_SEED=/sandbox/w3
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

<!-- file: tools/secret_scan.py -->
```python
# secret_scan.py <env file>... -- <path|->... : L39-3. Scans files, directories (recursive) or stdin ("-") for every
# secret value of the given .env files. A key is secret when its NAME matches SECRET|TOKEN|PASSWORD|PASSWD|KEY|PRIVATE|
# CREDENTIAL|AUTH; for URL-valued keys (*_URL, DATABASE*, POSTGRES*) the password component is the secret (and the whole
# URL when it carries one). Values shorter than 8 characters are ignored. Prints key NAMES and hit counts only, never a
# value. Exit 0 = no hit, 1 = at least one hit, 2 = usage error. *.dump files are skipped (full DB copies, see L39-6).
import os, re, sys
from urllib.parse import unquote, urlsplit

NAME_RE = re.compile(r"SECRET|TOKEN|PASSWORD|PASSWD|KEY|PRIVATE|CREDENTIAL|AUTH", re.I)
URL_RE = re.compile(r"_URL$|^DATABASE|^POSTGRES", re.I)


def dotenv(path):
    out = {}
    for raw in open(path, encoding="utf-8", errors="replace"):
        line = raw.rstrip("\r\n")
        m = re.match(r"^([A-Za-z_][A-Za-z0-9_]*)=(.*)$", line)
        if not m or m.group(1) in out:
            continue
        v = m.group(2)
        if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
            v = v[1:-1]
        out[m.group(1)] = v
    return out


def needles(envs):
    found = {}
    for env in envs:
        for k, v in env.items():
            vals = []
            if URL_RE.search(k) and "://" in v:
                pw = urlsplit(v).password
                if pw:
                    vals += [v, pw, unquote(pw)]
            elif NAME_RE.search(k):
                vals.append(v)
            for x in vals:
                if len(x) >= 8:
                    found.setdefault(k, set()).add(x.encode("utf-8"))
    return found


def targets(paths):
    for p in paths:
        if p == "-":
            yield "<stdin>", sys.stdin.buffer.read()
        elif os.path.isdir(p):
            for root, _dirs, files in os.walk(p):
                for f in files:
                    if not f.endswith(".dump"):
                        fp = os.path.join(root, f)
                        with open(fp, "rb") as fh:
                            yield fp, fh.read()
        elif os.path.isfile(p):
            if not p.endswith(".dump"):
                with open(p, "rb") as fh:
                    yield p, fh.read()


def main(argv):
    if "--" not in argv:
        print("usage: secret_scan.py <env file>... -- <path|->...", file=sys.stderr)
        return 2
    i = argv.index("--")
    envs, paths = argv[:i], argv[i + 1:]
    if not envs or not paths:
        print("usage: secret_scan.py <env file>... -- <path|->...", file=sys.stderr)
        return 2
    keys = needles([dotenv(e) for e in envs])
    hits, nfiles = {}, 0
    for name, data in targets(paths):
        nfiles += 1
        for k, vals in keys.items():
            n = sum(data.count(v) for v in vals)
            if n:
                hits.setdefault(k, []).append((name, n))
    for k in sorted(hits):
        print("secret_scan: HIT key=%s files=%d occurrences=%d first=%s" % (k, len(hits[k]), sum(n for _f, n in hits[k]), hits[k][0][0]))
    print("secret_scan: keys=%d (%s) files=%d hits=%d" % (len(keys), ",".join(sorted(keys)), nfiles, sum(len(v) for v in hits.values())))
    return 1 if hits else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
```

<!-- file: tools/procs_studio.sh -->
```bash
#!/usr/bin/env bash
# procs_studio.sh <outfile> : read-only process inventory (safe in-app). R-L4: every node.exe whose command line mentions
# studio/mcp/server.ts (case-insensitive, either slash direction, any loader: tsx cli, node --import, npx, ...) is classified
# by checkout: OLD = gsp-hq-prod-v21, R2 = gsp-hq-prod-v21-r2, REPO = gsp-swarm-hq-v2.1, UNKNOWN = anything else (also a
# relative path). A server is counted once per process tree (a launcher and its loader child = 1). Also lists HQ listeners,
# hq-server.mjs, bridge.mjs and Hermes gateways. Last line: OLD_MCP=<n> R2_MCP=<n> REPO_MCP=<n> UNKNOWN_MCP=<n>
OUT="$1"
read -r -d '' PS <<'PSEOF'
$ProgressPreference = 'SilentlyContinue'
$all = @(Get-CimInstance Win32_Process)
$byId = @{}; foreach ($p in $all) { $byId[[int]$p.ProcessId] = $p }
$mcp = @($all | Where-Object { $_.Name -ieq 'node.exe' -and $_.CommandLine -match '(?i)studio[\\/]+mcp[\\/]+server\.ts' })
$ids = @{}; foreach ($p in $mcp) { $ids[[int]$p.ProcessId] = 1 }
$n = @{ OLD = 0; R2 = 0; REPO = 0; UNKNOWN = 0 }
foreach ($p in $mcp) {
  $cl = [string]$p.CommandLine
  if ($cl -match '(?i)gsp-hq-prod-v21-r2[\\/]+scripts[\\/]+studio[\\/]+mcp[\\/]+server\.ts') { $k = 'R2' }
  elseif ($cl -match '(?i)gsp-hq-prod-v21[\\/]+scripts[\\/]+studio[\\/]+mcp[\\/]+server\.ts') { $k = 'OLD' }
  elseif ($cl -match '(?i)gsp-swarm-hq-v2\.1[\\/]+scripts[\\/]+studio[\\/]+mcp[\\/]+server\.ts') { $k = 'REPO' }
  else { $k = 'UNKNOWN' }
  $root = -not $ids.ContainsKey([int]$p.ParentProcessId)
  $par = $byId[[int]$p.ParentProcessId]
  'MCP|{0}|pid={1}|ppid={2}|{3}|root={4}|parent={5}|{6}' -f $k, $p.ProcessId, $p.ParentProcessId, $p.CreationDate.ToString('s'), $root, $par.Name, $cl
  if ($root) { $n[$k]++ }
}
$all | Where-Object { ($_.Name -ieq 'node.exe' -or $_.Name -ieq 'python.exe') -and ($_.CommandLine -like '*gateway run*' -or $_.CommandLine -like '*hq-server.mjs*' -or $_.CommandLine -like '*bridge.mjs*') } |
  ForEach-Object { 'PROC|pid={0}|ppid={1}|{2}|{3}' -f $_.ProcessId, $_.ParentProcessId, $_.CreationDate.ToString('s'), $_.CommandLine }
'OLD_MCP={0} R2_MCP={1} REPO_MCP={2} UNKNOWN_MCP={3}' -f $n.OLD, $n.R2, $n.REPO, $n.UNKNOWN
PSEOF
R=$(powershell -NoProfile -NonInteractive -EncodedCommand "$(printf '%s' "$PS" | iconv -f UTF-8 -t UTF-16LE | base64 -w0)" 2>/dev/null | tr -d '\r')
{
  echo "== $(date '+%F %T') listeners"
  netstat -ano -p tcp | grep -E ':(9011|9031|9041|9051)\s.*LISTENING'
  echo "== processes"
  echo "$R" | grep -v '^OLD_MCP=' | grep -v '^\s*$'
  echo "$R" | grep -E '^OLD_MCP=[0-9]+ R2_MCP=[0-9]+ REPO_MCP=[0-9]+ UNKNOWN_MCP=[0-9]+$' || echo "OLD_MCP=? R2_MCP=? REPO_MCP=? UNKNOWN_MCP=? (inventory failed)"
} > "$OUT" 2>&1
tail -1 "$OUT"
```

<!-- file: tools/smoke_http.mjs -->
```js
// smoke_http.mjs <base> : read-only HTTP smoke (S-1..S-9, S-11) + active template list + old-code `latest` simulation.
// Secrets come from env INTERNAL_API_SECRET / WEBUI_RBAC_TOKEN and are only sent as request headers, never printed
// and never on a command line. TLS: run with NODE_EXTRA_CA_CERTS=<checkout>/certs/hq-cert.pem. S-7 is the R08
// dry-run (validate route writes nothing). Exit 0 = all checks pass.
const base = process.argv[2];
const ALLOWED = ["https://127.0.0.1:9031", "https://127.0.0.1:9051", "https://localhost:9011"];
if (!ALLOWED.includes(base)) { console.error("refusing: base not in allow-list"); process.exit(2); }
const S = process.env.INTERNAL_API_SECRET ?? "";
if (S.trim() === "") { console.error("INTERNAL_API_SECRET missing"); process.exit(2); }
const RB = process.env.WEBUI_RBAC_TOKEN ?? "";
let fail = 0;
async function req(path, headers = {}, init = {}) {
  const r = await fetch(base + path, { redirect: "manual", ...init, headers });
  const t = await r.text();
  let j = null;
  try { j = JSON.parse(t); } catch { j = null; }
  return { s: r.status, j, n: t.length };
}
function check(id, ok, detail) {
  if (!ok) fail++;
  console.log(JSON.stringify({ id, ok, ...detail }));
}
const H = { "x-internal-secret": S };
const a = await req("/login");
const b = await req("/");
check("S-1", a.s === 200 && (b.s === 200 || b.s === 307), { login: a.s, root: b.s });
const h = await req("/api/brahma/health", H);
check("S-2", h.s === 200, { status: h.s });
const ag = await req("/api/agents", H);
check("S-3", ag.s === 200, { status: ag.s });
const rg = await req("/api/studio/registry?kind=sections", H);
const cnt = rg.j?.count ?? null;
check("S-4", rg.s === 200 && cnt === 52, { status: rg.s, count: cnt });
const tl = await req("/api/studio/templates", H);
const list = tl.j?.templates ?? [];
check("S-5", tl.s === 200, { status: tl.s, n: list.length, slugs: list.map((t) => t.slug).sort() });
const re = await req("/api/studio/render-env", H);
check("S-6", re.s === 200 && re.j?.readiness?.ready === true, { status: re.s, ready: re.j?.readiness?.ready ?? null });
const v = await req("/api/studio/validate", { ...H, "content-type": "application/json" }, { method: "POST", body: JSON.stringify({ schemaId: "studio.chart/v1", spec: {} }) });
check("S-7", v.s === 200 && v.j?.valid === false, { status: v.s, valid: v.j?.valid ?? null });
const nf = await req("/api/studio/tidak-ada", H);
const nfCode = nf.j?.code ?? nf.j?.error?.code ?? null;
check("S-8", nf.s === 404 && nfCode === "ROUTE_NOT_FOUND", { status: nf.s, code: nfCode });
const il = await req("/api/information-library?q=test", H);
check("S-9", il.s === 200, { status: il.s, bytes: il.n });
if (RB.trim() !== "") {
  const r1 = await req("/api/brahma/rbac", { "x-rbac-token": RB });
  const r0 = await req("/api/brahma/rbac");
  check("S-11", r1.s === 200 && r0.s === 401, { withToken: r1.s, withoutToken: r0.s });
}
// What the OLD MCP client (3566486 write-client-run.ts resolveTemplate) would pick for template "latest".
const cand = list
  .filter((t) => typeof t.slug === "string" && t.slug.startsWith("datum-") && t.isPreset !== true && t.restricted !== true && (t.contractKind ?? null) === null && t.archived !== true)
  .sort((x, y) => String(y.updatedAt ?? "").localeCompare(String(x.updatedAt ?? "")) || Number(y.latestVersionNo ?? 0) - Number(x.latestVersionNo ?? 0));
console.log(JSON.stringify({ id: "OLD-CODE-LATEST", slug: cand[0]?.slug ?? null }));
console.log(JSON.stringify({ id: "SUMMARY", fail }));
process.exit(fail ? 1 : 0);
```

<!-- file: tools/check_render.mjs -->
```js
// check_render.mjs <driver root> <expected doc count> : asserts a rollout_driver write+render run (read-only, local files).
// Each of the 10 slugs: R08 parts all valid, render 200 with DOCX + PDF downloaded and server-sha verified, typeCode / tier /
// language = template spec (spec.json from the driver `spec` phase). Target `latest` (if present) must resolve to datum-gsp.
import fs from "node:fs";
const [dir, nRaw] = process.argv.slice(2);
if (!dir || !nRaw) { console.error("usage: check_render.mjs <driver root> <expected doc count>"); process.exit(2); }
const rows = JSON.parse(fs.readFileSync(`${dir}/resp/_render_summary.json`, "utf8"));
const spec = JSON.parse(fs.readFileSync(`${dir}/spec.json`, "utf8"));
const bySlug = new Map(spec.templates.map((t) => [t.slug, t.params]));
let fail = 0;
const bad = (target, why) => { fail++; console.log(JSON.stringify({ target, ok: false, why })); };
if (rows.length !== Number(nRaw)) bad("*", `doc count ${rows.length} != ${nRaw}`);
for (const r of rows) {
  if (r.error) { bad(r.target, r.error); continue; }
  const f = r.files ?? {};
  const okFiles = ["docx", "pdf"].every((k) => f[k] && !f[k].error && f[k].bytes > 0 && f[k].sha256 === f[k].serverSha && String(f[k].verified) === "true");
  if (!(r.r08?.allValid === true && r.r08?.parts > 0)) bad(r.target, "R08 not all valid");
  if (r.render?.status !== 200 || (r.render?.failedFormats ?? []).length > 0) bad(r.target, `render ${r.render?.status} failed=${JSON.stringify(r.render?.failedFormats)}`);
  if (!okFiles) bad(r.target, "docx/pdf missing or sha not verified");
  if (r.target === "latest") {
    if (r.templateSlug !== "datum-gsp") bad(r.target, `latest resolved to ${r.templateSlug}`);
  } else if (bySlug.has(r.target)) {
    const p = bySlug.get(r.target);
    if (r.templateSlug !== r.target) bad(r.target, `template ${r.templateSlug}`);
    if (r.typeCode !== p["doc.defaultTypeCode"] || r.tier !== p["doc.defaultTier"] || r.language !== p["doc.language"]) {
      bad(r.target, `meta ${r.typeCode}/${r.tier}/${r.language} != spec ${p["doc.defaultTypeCode"]}/${p["doc.defaultTier"]}/${p["doc.language"]}`);
    }
  }
  console.log(JSON.stringify({ target: r.target, documentId: r.documentId, docNumber: r.docNumber, template: r.templateSlug, meta: `${r.typeCode}/${r.tier}/${r.language}`, docx: f.docx?.bytes ?? null, pdf: f.pdf?.bytes ?? null }));
}
console.log(JSON.stringify({ id: "CHECK_RENDER", rows: rows.length, fail }));
process.exit(fail ? 1 : 0);
```

<!-- file: tools/check_seed.mjs -->
```js
// check_seed.mjs <log> <dry|real|rerun> <database> : asserts one `seed-studio.ts --doc-type-templates` run from its JSON log.
// All rows name <database>; no error row; section types untouched (dry-run plan create/update empty, real runs created/updated
// empty); guard ok with no changed/added other template and no touched section type; 10 templates created (dry, real) or
// unchanged (rerun), storedOk true. Exit 0 = pass.
import fs from "node:fs";
const [file, mode, db] = process.argv.slice(2);
if (!file || !["dry", "real", "rerun"].includes(mode) || !db) { console.error("usage: check_seed.mjs <log> <dry|real|rerun> <database>"); process.exit(2); }
const rows = fs.readFileSync(file, "utf8").split(/\r?\n/).filter((l) => l.startsWith("{")).map((l) => JSON.parse(l)).filter((r) => r.source === "prisma/seed-studio.ts");
const fails = [];
const ctxDbs = rows.map((r) => r.context?.database).filter((d) => d !== undefined);
if (ctxDbs.length === 0 || ctxDbs.some((d) => d !== db)) fails.push(`database in log: ${[...new Set(ctxDbs)].join(",")} (expected ${db})`);
if (rows.some((r) => r.level === "error")) fails.push("error row present");
const done = rows.find((r) => r.message === "Seed Studio selesai");
const st = done?.context?.sectionTypes;
if (!st) fails.push("no 'Seed Studio selesai' row");
else if (mode === "dry" ? !(st.plan && st.plan.create.length === 0 && st.plan.update.length === 0) : !(Array.isArray(st.created) && st.created.length === 0 && st.updated.length === 0)) fails.push(`section types would be written: ${JSON.stringify(st)}`);
const tx = rows.find((r) => r.context?.guard);
const g = tx?.context?.guard;
if (!g) fails.push("no guarded transaction row");
else {
  if (!(g.ok === true && g.changedTemplates.length === 0 && g.addedTemplates.length === 0 && g.sectionTypesTouched.length === 0)) fails.push(`guard ${JSON.stringify({ ok: g.ok, changed: g.changedTemplates, added: g.addedTemplates, touched: g.sectionTypesTouched })}`);
  const tpl = tx.context.templates ?? [];
  const want = mode === "rerun" ? "unchanged" : "created";
  if (tpl.length !== 10 || tpl.some((t) => t.outcome !== want || t.storedOk !== true)) fails.push(`templates ${tpl.map((t) => `${t.slug}:${t.outcome}:${t.storedOk}`).join(",")} (expected 10 x ${want}:true)`);
}
if (mode === "dry" && !rows.some((r) => /Dry-run .*di-rollback/.test(r.message) && r.context?.plan?.guardOk === true)) fails.push("no dry-run rollback row with guardOk");
for (const f of fails) console.log(`STOP check_seed ${mode}: ${f}`);
console.log(JSON.stringify({ id: "CHECK_SEED", mode, rows: rows.length, fail: fails.length }));
process.exit(fails.length ? 1 : 0);
```

<!-- file: tools/derive_driver.mjs -->
```js
// derive_driver.mjs <src driver.ts> <out rollout_driver.ts>  (src = gsp-backups/datum-rev-a-rollout-assets/driver.ts, D-612)
// Derives the S37 rollout driver from the S35 DEV driver by exact, count-checked string replacements.
// Every replacement must match exactly once; otherwise nothing is written (exit 1).
import fs from "node:fs";
import crypto from "node:crypto";
const [src, out] = process.argv.slice(2);
if (!src || !out) { console.error("usage: derive_driver.mjs <src> <out>"); process.exit(2); }
const raw = fs.readFileSync(src);
const SRC_SHA = "9bf43077225dd886aacb3b82be3ccfc3f8268a2218abb77ade99fa205b1c0dc7"; // S35 driver (D-612 asset copy has the same sha256)
if (crypto.createHash("sha256").update(raw).digest("hex") !== SRC_SHA) { console.error("STOP: source driver sha256 differs from S35"); process.exit(1); }
let s = raw.toString("utf8").replace(/\r\n/g, "\n");
const R = [
  [' * S35 DEV smoke driver (DATUM Rev A). Runs from the repo root with `npx tsx C:/tmp/s35/driver.ts <phase>`.\n * Phases: write | list | render | bfix | spec. DEV only (base URL forced to localhost:9021).',
   ' * S37 rollout driver (DATUM Rev A), derived from the S35 DEV driver by derive_driver.mjs. Run: `npx tsx <BK>/rollout_driver.ts <phase>`.\n * Phases: write | list | render | bfix | spec. Base URL from RD_BASE, allow-list 127.0.0.1:9031 / 127.0.0.1:9051 / localhost:9011.'],
  ['const REPO = "C:/Users/TRIAL/gsp-swarm-hq-v2.1";',
   'const need = (k: string): string => { const v = process.env[k]; if (!v) { console.error(`missing env ${k}`); process.exit(2); } return v; };\nconst REPO = need("RD_REPO");'],
  ['const BASE = "http://localhost:9021";',
   'const BASE = need("RD_BASE");\nconst ALLOWED_BASES = ["https://127.0.0.1:9031", "https://127.0.0.1:9051", "https://localhost:9011"];\nif (!ALLOWED_BASES.includes(BASE)) { console.error("refusing: RD_BASE not in allow-list"); process.exit(2); }'],
  ['const ROOT = "C:/tmp/s35";',
   'const ROOT = need("RD_ROOT");\nfor (const d of ["req", "resp", "out", "bfix"]) fs.mkdirSync(path.join(ROOT, d), { recursive: true });'],
  ['const MISSION = "2026-11-04_datum-rev-a-dev-smoke";', 'const MISSION = need("RD_MISSION");'],
  ['const BFIX_MISSION = "2026-11-04_datum-rev-a-dev-bfix";', 'const BFIX_MISSION = `${MISSION}-bfix`;'],
  ['const AGENT = "hermes-datum-smoke";', 'const AGENT = process.env.RD_AGENT ?? "hermes-datum-rollout";'],
  ['const TARGETS = [...SLUGS, "datum-gsp", "latest"];',
   '// S37: targets are explicit (RD_TARGETS, comma list); production (9011) accepts only the D-612 single document.\n' +
   'const TARGETS = (process.env.RD_TARGETS ?? "").split(",").filter((t) => t !== "");\n' +
   'const PROD_BASE = "https://localhost:9011";\n' +
   'const PROD_ONLY_TARGETS = ["datum-nota"];'],
  ['async function phaseWrite() {',
   'async function phaseWrite() {\n' +
   '  if (TARGETS.length === 0) { console.error("refusing: RD_TARGETS is empty"); process.exit(2); }\n' +
   '  if (BASE === PROD_BASE && JSON.stringify(TARGETS) !== JSON.stringify(PROD_ONLY_TARGETS)) { console.error("refusing: production smoke is datum-nota only (D-612)"); process.exit(2); }'],
  ['async function phaseBfix() {',
   'async function phaseBfix() {\n' +
   '  if (BASE === PROD_BASE) { console.error("refusing: no B-FIX documents in production (D-612)"); process.exit(2); }'],
  ['const { StdioClientTransport } = req("@modelcontextprotocol/sdk/client/stdio.js");',
   'const { StdioClientTransport, getDefaultEnvironment } = req("@modelcontextprotocol/sdk/client/stdio.js");\n' +
   '/** L39-2: the MCP child gets the SDK default environment plus only the variables it needs, not this process env. */\n' +
   'const pickEnv = (keys: string[]): Record<string, string> => Object.fromEntries(keys.filter((k) => process.env[k] !== undefined).map((k) => [k, process.env[k] as string]));'],
  ['    env: { ...(process.env as Record<string, string>), STUDIO_BASE_URL: BASE, STUDIO_AGENT_ID: AGENT, STUDIO_MCP_TOOLSETS: toolsets, STUDIO_MCP_FILE_ROOTS: ROOT },',
   '    env: { ...getDefaultEnvironment(), ...pickEnv(["NODE_EXTRA_CA_CERTS", "INTERNAL_API_SECRET"]), STUDIO_BASE_URL: BASE, STUDIO_AGENT_ID: AGENT, STUDIO_MCP_TOOLSETS: toolsets, STUDIO_MCP_FILE_ROOTS: ROOT },'],
  ['if (process.env.STUDIO_BASE_URL && process.env.STUDIO_BASE_URL !== BASE) { console.error("refusing: STUDIO_BASE_URL is not DEV 9021"); process.exit(2); }',
   '// S37: base allow-list is checked at BASE above; the MCP child always gets STUDIO_BASE_URL = BASE.'],
  ['fs.readFileSync(path.join(REPO, "docs", "STUDIO-HOWTO-DOCUMENT.md"), "utf8")',
   'fs.readFileSync(process.env.RD_SAMPLE_DOC ?? path.join(REPO, "docs", "STUDIO-HOWTO-DOCUMENT.md"), "utf8")'],
  ['type Payload = { meta: Record<string, string>; sections: Array<{ heading: string; blocks: unknown[] }> };',
   'type Payload = { meta: Record<string, string>; sections: Array<{ heading: string; blocks: unknown[] }> };\n' +
   '/** S37 (D-607): optional per-language payload files {meta, sections}; unset = the S35 how-to sample for every target. */\n' +
   'function langPayload(t: string, fallback: Payload): Payload {\n' +
   '  const f = t.endsWith("-en") ? process.env.RD_PAYLOAD_EN : process.env.RD_PAYLOAD_ID;\n' +
   '  if (!f) return fallback;\n' +
   '  const p = JSON.parse(fs.readFileSync(f, "utf8")) as Payload;\n' +
   '  return { meta: p.meta, sections: p.sections };\n' +
   '}'],
  ['const args = { mission: MISSION, docKey: `smoke-${nameOf(t)}`, template: t, meta: payload.meta, sections: payload.sections };',
   'const lp = langPayload(t, payload);\n    const args = { mission: MISSION, docKey: `smoke-${nameOf(t)}`, template: t, meta: lp.meta, sections: lp.sections };'],
];
for (const [a, b] of R) {
  const n = s.split(a).length - 1;
  if (n !== 1) { console.error(`STOP: anchor matched ${n}x: ${a.slice(0, 70)}`); process.exit(1); }
  s = s.replace(a, () => b);
}
if (/localhost:9021|C:\/tmp\/s35/.test(s)) { console.error("STOP: DEV literal left"); process.exit(1); }
fs.writeFileSync(out, s);
console.log(`derived ${out} sha256 ${crypto.createHash("sha256").update(s).digest("hex")} replacements ${R.length}`);
```

<!-- file: sql/counts_all.sql -->
```sql
-- counts_all.sql: exact row count of every public base table (read-only).
select table_name, (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', table_schema, table_name), false, true, '')))[1]::text::bigint as n
from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name;
```

<!-- file: sql/sectiontypes_fp.sql -->
```sql
-- sectiontypes_fp.sql: StudioSectionType count + md5 over full rows (read-only).
select 'StudioSectionType' tbl, count(*) n, md5(coalesce(string_agg(x::text, E'\n' order by x.key), '')) fp from "StudioSectionType" x;
```

<!-- file: sql/old_templates_fp.sql -->
```sql
-- old_templates_fp.sql: per-template snapshot of every template NOT in the 10 slugs (AC-3), read-only.
select set_config('rollout.slugs', '{datum-proposal-teknis,datum-proposal-teknis-en,datum-laporan,datum-laporan-en,datum-laporan-verifikasi,datum-laporan-verifikasi-en,datum-standar,datum-standar-en,datum-nota,datum-nota-en}', false) as slugs_set \gset
select t.slug, t."latestVersionNo", t."updatedAt", t.archived, t."isPreset", coalesce(t."contractKind", '-') ck,
  lv."paramsSha256", coalesce(lv."skeletonSha256", '-') sk,
  (select count(*) from "StudioTemplateVersion" v where v."templateId" = t.id) versions,
  md5(t::text) trow,
  (select md5(coalesce(string_agg(v::text, E'\n' order by v.id), '')) from "StudioTemplateVersion" v where v."templateId" = t.id) vrows,
  (select md5(coalesce(string_agg(s::text, E'\n' order by s.id), '')) from "StudioTemplateSlot" s join "StudioTemplateVersion" v on v.id = s."templateVersionId" where v."templateId" = t.id) srows,
  (select md5(coalesce(string_agg(p::text, E'\n' order by p.id), '')) from "StudioTemplateSlotParam" p join "StudioTemplateSlot" s on s.id = p."slotId" join "StudioTemplateVersion" v on v.id = s."templateVersionId" where v."templateId" = t.id) prows,
  (select md5(coalesce(string_agg(r::text, E'\n' order by r.id), '')) from "StudioTemplateSlotRoleFormat" r join "StudioTemplateSlot" s on s.id = r."slotId" join "StudioTemplateVersion" v on v.id = s."templateVersionId" where v."templateId" = t.id) rrows
from "StudioTemplate" t join "StudioTemplateVersion" lv on lv."templateId" = t.id and lv."versionNo" = t."latestVersionNo"
where not (t.slug = any(current_setting('rollout.slugs')::text[]))
order by t.slug;
```

<!-- file: sql/new10_fp.sql -->
```sql
-- new10_fp.sql: counts + md5 row fingerprints of every row owned by the 10 slugs (read-only).
select set_config('rollout.slugs', '{datum-proposal-teknis,datum-proposal-teknis-en,datum-laporan,datum-laporan-en,datum-laporan-verifikasi,datum-laporan-verifikasi-en,datum-standar,datum-standar-en,datum-nota,datum-nota-en}', false) as slugs_set \gset
with t as (select * from "StudioTemplate" where slug = any(current_setting('rollout.slugs')::text[])),
v as (select * from "StudioTemplateVersion" where "templateId" in (select id from t)),
s as (select * from "StudioTemplateSlot" where "templateVersionId" in (select id from v)),
p as (select * from "StudioTemplateSlotParam" where "slotId" in (select id from s)),
r as (select * from "StudioTemplateSlotRoleFormat" where "slotId" in (select id from s))
select 'StudioTemplate' tbl, count(*) n, md5(coalesce(string_agg(t::text, E'\n' order by t.id), '')) fp from t
union all select 'StudioTemplateVersion', count(*), md5(coalesce(string_agg(v::text, E'\n' order by v.id), '')) from v
union all select 'StudioTemplateSlot', count(*), md5(coalesce(string_agg(s::text, E'\n' order by s.id), '')) from s
union all select 'StudioTemplateSlotParam', count(*), md5(coalesce(string_agg(p::text, E'\n' order by p.id), '')) from p
union all select 'StudioTemplateSlotRoleFormat', count(*), md5(coalesce(string_agg(r::text, E'\n' order by r.id), '')) from r;
```

<!-- file: sql/export_new10.sql.tpl -->
```sql
-- export_new10.sql: \copy of only the rows owned by the 10 slugs, one CSV per table (COPY TO = read-only).
-- template: @EXP@ is replaced by the export directory with sed before running (psql \copy does not interpolate variables).
\set ON_ERROR_STOP on
select set_config('rollout.slugs', '{datum-proposal-teknis,datum-proposal-teknis-en,datum-laporan,datum-laporan-en,datum-laporan-verifikasi,datum-laporan-verifikasi-en,datum-standar,datum-standar-en,datum-nota,datum-nota-en}', false) as slugs_set \gset
\copy (select x.* from "StudioTemplate" x where x.slug = any(current_setting('rollout.slugs')::text[]) order by x.id) to '@EXP@/StudioTemplate.csv' with (format csv, header true)
\copy (select x.* from "StudioTemplateVersion" x where x."templateId" in (select id from "StudioTemplate" where slug = any(current_setting('rollout.slugs')::text[])) order by x.id) to '@EXP@/StudioTemplateVersion.csv' with (format csv, header true)
\copy (select x.* from "StudioTemplateSlot" x where x."templateVersionId" in (select v.id from "StudioTemplateVersion" v join "StudioTemplate" t on t.id = v."templateId" where t.slug = any(current_setting('rollout.slugs')::text[])) order by x.id) to '@EXP@/StudioTemplateSlot.csv' with (format csv, header true)
\copy (select x.* from "StudioTemplateSlotParam" x where x."slotId" in (select s.id from "StudioTemplateSlot" s join "StudioTemplateVersion" v on v.id = s."templateVersionId" join "StudioTemplate" t on t.id = v."templateId" where t.slug = any(current_setting('rollout.slugs')::text[])) order by x.id) to '@EXP@/StudioTemplateSlotParam.csv' with (format csv, header true)
\copy (select x.* from "StudioTemplateSlotRoleFormat" x where x."slotId" in (select s.id from "StudioTemplateSlot" s join "StudioTemplateVersion" v on v.id = s."templateVersionId" join "StudioTemplate" t on t.id = v."templateId" where t.slug = any(current_setting('rollout.slugs')::text[])) order by x.id) to '@EXP@/StudioTemplateSlotRoleFormat.csv' with (format csv, header true)
```

<!-- file: sql/import_new10.sql.tpl -->
```sql
-- import_new10.sql (template; @EXP@ = export dir, replaced with sed). ONE transaction. Run with:
--   psql "$URL" -X -v ON_ERROR_STOP=1 --single-transaction -v expect_db=<db> \
--        -v exp_t=.. -v exp_v=.. -v exp_s=.. -v exp_p=.. -v exp_r=.. -v fp_t=.. -v fp_v=.. -v fp_s=.. -v fp_p=.. -v fp_r=.. -f import_new10.sql
-- Any failed check raises an exception -> ON_ERROR_STOP -> the whole transaction rolls back (nothing written).
\set ON_ERROR_STOP on
select set_config('rollout.slugs', '{datum-proposal-teknis,datum-proposal-teknis-en,datum-laporan,datum-laporan-en,datum-laporan-verifikasi,datum-laporan-verifikasi-en,datum-standar,datum-standar-en,datum-nota,datum-nota-en}', true) as s0,
       set_config('rollout.expect_db', :'expect_db', true) as s1,
       set_config('rollout.exp', concat_ws(',', :'exp_t', :'exp_v', :'exp_s', :'exp_p', :'exp_r'), true) as s2,
       set_config('rollout.fp', concat_ws(',', :'fp_t', :'fp_v', :'fp_s', :'fp_p', :'fp_r'), true) as s3 \gset
-- 0. db_guard inside the transaction
DO $$ BEGIN
  IF current_database() <> current_setting('rollout.expect_db') THEN
    RAISE EXCEPTION 'STOP db_guard: connected to %, expected %', current_database(), current_setting('rollout.expect_db');
  END IF;
END $$;
-- 1. keep template writers out while we check and insert (reads stay allowed)
LOCK TABLE "StudioTemplate" IN SHARE ROW EXCLUSIVE MODE;
select set_config('rollout.before_total', (select count(*)::text from "StudioTemplate"), true) as s4 \gset
-- 2. staging tables with the target's own column order (HEADER MATCH rejects a column-name/order mismatch)
CREATE TEMP TABLE st_t (LIKE "StudioTemplate") ON COMMIT DROP;
CREATE TEMP TABLE st_v (LIKE "StudioTemplateVersion") ON COMMIT DROP;
CREATE TEMP TABLE st_s (LIKE "StudioTemplateSlot") ON COMMIT DROP;
CREATE TEMP TABLE st_p (LIKE "StudioTemplateSlotParam") ON COMMIT DROP;
CREATE TEMP TABLE st_r (LIKE "StudioTemplateSlotRoleFormat") ON COMMIT DROP;
\copy st_t from '@EXP@/StudioTemplate.csv' with (format csv, header match)
\copy st_v from '@EXP@/StudioTemplateVersion.csv' with (format csv, header match)
\copy st_s from '@EXP@/StudioTemplateSlot.csv' with (format csv, header match)
\copy st_p from '@EXP@/StudioTemplateSlotParam.csv' with (format csv, header match)
\copy st_r from '@EXP@/StudioTemplateSlotRoleFormat.csv' with (format csv, header match)
-- 3. pre-checks
DO $$
DECLARE
  slugs text[] := current_setting('rollout.slugs')::text[];
  e int[] := string_to_array(current_setting('rollout.exp'), ',')::int[];
  f text[] := string_to_array(current_setting('rollout.fp'), ',');
  got int[]; gfp text[];
BEGIN
  got := array[(select count(*) from st_t), (select count(*) from st_v), (select count(*) from st_s), (select count(*) from st_p), (select count(*) from st_r)]::int[];
  IF got <> e THEN RAISE EXCEPTION 'STOP staging counts % <> export counts %', got, e; END IF;
  gfp := array[(select md5(coalesce(string_agg(x::text, E'\n' order by x.id), '')) from st_t x),
               (select md5(coalesce(string_agg(x::text, E'\n' order by x.id), '')) from st_v x),
               (select md5(coalesce(string_agg(x::text, E'\n' order by x.id), '')) from st_s x),
               (select md5(coalesce(string_agg(x::text, E'\n' order by x.id), '')) from st_p x),
               (select md5(coalesce(string_agg(x::text, E'\n' order by x.id), '')) from st_r x)];
  IF gfp <> f THEN RAISE EXCEPTION 'STOP staging fingerprints % <> export fingerprints %', gfp, f; END IF;
  IF (select count(*) from st_t) <> 10 OR (select count(*) from st_t where slug = any(slugs)) <> 10 OR (select count(distinct slug) from st_t) <> 10 THEN
    RAISE EXCEPTION 'STOP staging StudioTemplate is not exactly the 10 slugs'; END IF;
  IF EXISTS (select 1 from st_t where archived OR "isPreset" OR "contractKind" is not null OR kind <> 'DOCUMENT') THEN
    RAISE EXCEPTION 'STOP staging template flags (archived/isPreset/contractKind/kind) unexpected'; END IF;
  IF EXISTS (select 1 from "StudioTemplate" where slug = any(slugs)) THEN RAISE EXCEPTION 'STOP a slug already exists in target'; END IF;
  IF EXISTS (select 1 from "StudioTemplate" x join st_t using (id)) OR EXISTS (select 1 from "StudioTemplateVersion" x join st_v using (id))
     OR EXISTS (select 1 from "StudioTemplateSlot" x join st_s using (id)) OR EXISTS (select 1 from "StudioTemplateSlotParam" x join st_p using (id))
     OR EXISTS (select 1 from "StudioTemplateSlotRoleFormat" x join st_r using (id)) THEN RAISE EXCEPTION 'STOP an id already exists in target'; END IF;
  IF EXISTS (select 1 from st_v where "templateId" not in (select id from st_t)) OR EXISTS (select 1 from st_s where "templateVersionId" not in (select id from st_v))
     OR EXISTS (select 1 from st_p where "slotId" not in (select id from st_s)) OR EXISTS (select 1 from st_r where "slotId" not in (select id from st_s)) THEN
    RAISE EXCEPTION 'STOP staging rows not closed over the 10 templates'; END IF;
  -- preset version FK: every new version derives from the CURRENT latest version of datum-gsp-preset in the target
  IF EXISTS (select 1 from st_v where "baseVersionId" is null OR "baseVersionId" not in (
       select v.id from "StudioTemplateVersion" v join "StudioTemplate" t on t.id = v."templateId" and v."versionNo" = t."latestVersionNo" where t.slug = 'datum-gsp-preset')) THEN
    RAISE EXCEPTION 'STOP baseVersionId is not the latest datum-gsp-preset version in target'; END IF;
  IF EXISTS (select 1 from st_s where "sectionTypeKey" not in (select key from "StudioSectionType")) THEN
    RAISE EXCEPTION 'STOP slot sectionTypeKey missing in target StudioSectionType'; END IF;
  RAISE NOTICE 'pre-checks ok: counts % fingerprints match', got;
END $$;
-- 4. insert in FK order
INSERT INTO "StudioTemplate" SELECT * FROM st_t;
INSERT INTO "StudioTemplateVersion" SELECT * FROM st_v;
INSERT INTO "StudioTemplateSlot" SELECT * FROM st_s;
INSERT INTO "StudioTemplateSlotParam" SELECT * FROM st_p;
INSERT INTO "StudioTemplateSlotRoleFormat" SELECT * FROM st_r;
-- 5. post-checks (still inside the transaction)
DO $$
DECLARE
  slugs text[] := current_setting('rollout.slugs')::text[];
  e int[] := string_to_array(current_setting('rollout.exp'), ',')::int[];
  f text[] := string_to_array(current_setting('rollout.fp'), ',');
  got int[]; gfp text[];
BEGIN
  WITH t as (select * from "StudioTemplate" where slug = any(slugs)),
  v as (select * from "StudioTemplateVersion" where "templateId" in (select id from t)),
  s as (select * from "StudioTemplateSlot" where "templateVersionId" in (select id from v)),
  p as (select * from "StudioTemplateSlotParam" where "slotId" in (select id from s)),
  r as (select * from "StudioTemplateSlotRoleFormat" where "slotId" in (select id from s))
  select array[(select count(*) from t), (select count(*) from v), (select count(*) from s), (select count(*) from p), (select count(*) from r)]::int[],
         array[(select md5(coalesce(string_agg(x::text, E'\n' order by x.id), '')) from t x), (select md5(coalesce(string_agg(x::text, E'\n' order by x.id), '')) from v x),
               (select md5(coalesce(string_agg(x::text, E'\n' order by x.id), '')) from s x), (select md5(coalesce(string_agg(x::text, E'\n' order by x.id), '')) from p x),
               (select md5(coalesce(string_agg(x::text, E'\n' order by x.id), '')) from r x)]
    into got, gfp;
  IF got <> e THEN RAISE EXCEPTION 'STOP target counts after insert % <> export %', got, e; END IF;
  IF gfp <> f THEN RAISE EXCEPTION 'STOP target fingerprints after insert % <> export %', gfp, f; END IF;
  IF (select count(*) from "StudioTemplate") <> current_setting('rollout.before_total')::int + 10 THEN
    RAISE EXCEPTION 'STOP template total is not before + 10'; END IF;
  RAISE NOTICE 'post-checks ok: % templates (before % + 10)', (select count(*) from "StudioTemplate"), current_setting('rollout.before_total');
END $$;
```

<!-- file: sql/rb1_set_archived.sql.tpl -->
```sql
-- rb1_set_archived.sql (template; @VALUE@ = true for RB-1 archive, false only for the clone rehearsal unarchive).
-- Flips StudioTemplate.archived on exactly the 10 slugs in ONE transaction. Reversible; no row is deleted; updatedAt untouched.
-- run: psql "$URL" -X -v ON_ERROR_STOP=1 --single-transaction -v expect_db=<db> -f rb1_archive.sql
\set ON_ERROR_STOP on
select set_config('rollout.expect_db', :'expect_db', true) as s1,
       set_config('rollout.slugs', '{datum-proposal-teknis,datum-proposal-teknis-en,datum-laporan,datum-laporan-en,datum-laporan-verifikasi,datum-laporan-verifikasi-en,datum-standar,datum-standar-en,datum-nota,datum-nota-en}', true) as s2 \gset
DO $$ BEGIN
  IF current_database() <> current_setting('rollout.expect_db') THEN RAISE EXCEPTION 'STOP db_guard: % <> %', current_database(), current_setting('rollout.expect_db'); END IF;
  IF (select count(*) from "StudioTemplate" where slug = any(current_setting('rollout.slugs')::text[])) <> 10 THEN RAISE EXCEPTION 'STOP: the 10 slugs are not all present'; END IF;
END $$;
UPDATE "StudioTemplate" SET archived = @VALUE@ WHERE slug = any(current_setting('rollout.slugs')::text[]);
DO $$ BEGIN
  IF (select count(*) from "StudioTemplate" where archived = @VALUE@ and slug = any(current_setting('rollout.slugs')::text[])) <> 10 THEN RAISE EXCEPTION 'STOP: flag not set on all 10'; END IF;
  IF EXISTS (select 1 from "StudioTemplate" where archived and not (slug = any(current_setting('rollout.slugs')::text[]))) THEN RAISE EXCEPTION 'STOP: another template is archived'; END IF;
END $$;
select slug, archived from "StudioTemplate" order by slug;
```

<!-- file: sql/archive_smoke_docs.sql -->
```sql
-- archive_smoke_docs.sql (Q-D, D-596): archives, never deletes, the production smoke documents of one mission.
-- There is no API that sets StudioDocument.archived (schema.prisma:780); read paths hide archived documents
-- (R04 ?archived=0, studio_search, studio_contracts_query). Rendered files in the workspace stay on disk.
-- run: psql "$PROD_DB_URL" -X -v ON_ERROR_STOP=1 --single-transaction -v expect_db=gsp_agent_hq -v mission=<mission> -v exp_docs=<n> -f archive_smoke_docs.sql
\set ON_ERROR_STOP on
select set_config('rollout.expect_db', :'expect_db', true) as s1,
       set_config('rollout.mission', :'mission', true) as s2,
       set_config('rollout.exp_docs', :'exp_docs', true) as s3 \gset
DO $$ BEGIN
  IF current_database() <> current_setting('rollout.expect_db') THEN RAISE EXCEPTION 'STOP db_guard: % <> %', current_database(), current_setting('rollout.expect_db'); END IF;
  IF current_setting('rollout.mission') <> '2026-11-04_datum-rev-a-prod-smoke' THEN RAISE EXCEPTION 'STOP: mission is not the production smoke mission'; END IF;
  IF (select count(*) from "StudioDocument" where "missionFolder" = current_setting('rollout.mission')) <> current_setting('rollout.exp_docs')::int THEN
    RAISE EXCEPTION 'STOP: document count for the mission <> %', current_setting('rollout.exp_docs'); END IF;
  IF EXISTS (select 1 from "StudioDocument" where "missionFolder" = current_setting('rollout.mission') and "createdBy" <> 'agent:hermes-datum-rollout') THEN
    RAISE EXCEPTION 'STOP: a document in the mission was not created by the rollout agent'; END IF;
END $$;
UPDATE "StudioDocument" SET archived = true, "updatedAt" = now() WHERE "missionFolder" = current_setting('rollout.mission') AND archived = false;
select "docNumber", archived, "createdBy" from "StudioDocument" where "missionFolder" = current_setting('rollout.mission') order by "docNumber";
```

<!-- file: oa/start-hq2.sh -->
```bash
#!/usr/bin/env bash
# start-hq2.sh <dir> <logfile> <port|-> <hosts|-> <dbname|-> <workspace|->
# S37 (DATUM Rev A). Same as deploy-v21 start-hq.sh (nohup node hq-server.mjs, like autostart), plus an
# optional STUDIO_WORKSPACE_ROOT override. The DB URL is derived from the target folder's .env and never
# appears on a command line. Run it out-of-app through spawn_out (WMI), never from the agent shell.
set -u
DIR="$1"; LOGF="$2"; P="${3:--}"; H="${4:--}"; DBN="${5:--}"; WS="${6:--}"
cd "$DIR" || exit 1
if [ "$P" != "-" ]; then export HQ_PORT="$P"; fi
if [ "$H" != "-" ]; then export HQ_HOSTS="$H"; fi
if [ "$DBN" != "-" ]; then
  U=$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d= -f2- | sed -E "s/^[\"']//; s/[\"']\$//" | tr -d '\r')
  export DATABASE_URL="${U%/*}/$DBN"
fi
if [ "$WS" != "-" ]; then mkdir -p "$WS" || exit 1; export STUDIO_WORKSPACE_ROOT="$WS"; fi
echo "[$(date '+%F %T')] start-hq2: dir=$DIR port=$P hosts=$H db=$DBN workspace=$WS" >> "$LOGF"
nohup node hq-server.mjs >> "$LOGF" 2>&1 &
```

<!-- file: oa/launcher_edit_r2.py -->
```python
# launcher_edit_r2.py <BK> [--check] : S37 step 9 (S48, D-612 F-3). Byte-exact edit of the two persistent HQ launchers
# from gsp-hq-prod-v21 to gsp-hq-prod-v21-r2: gsp-ecosystem-start.sh line 120 (the hq_restart.mjs comment) and line 121
# (cd), watchdog-webui-hq.py line 124 (cwd). Each file is sha256-pinned and every anchor must match exactly once.
# Original EOL kept (start.sh LF, watchdog CRLF). Backup suffix .bak-20261104-datum-rev-a. Everything is verified before
# anything is written; --check writes nothing. Run out-of-app (AppData writes from inside the Claude app are virtualized).
import hashlib, os, shutil, sys

CHECK = "--check" in sys.argv
TAG = ".bak-20261104-datum-rev-a"
FILES = [
    (r"C:\Users\TRIAL\gsp-ecosystem\gsp-ecosystem-start.sh",
     "3fc38f68108a365da194d89e79fbd8b6476b92198dc870559d74f0ba3c4aeb8f",
     [(b"  # JANGAN pakai gsp-datacenter/scripts/hq_restart.mjs (menghidupkan kode LAMA); pakai node C:/Users/TRIAL/gsp-hq-prod-v21/scripts/hq_restart.mjs\n",
       b"  # JANGAN pakai gsp-datacenter/scripts/hq_restart.mjs (menghidupkan kode LAMA); pakai node C:/Users/TRIAL/gsp-hq-prod-v21-r2/scripts/hq_restart.mjs\n"),
      (b'  cd "C:/Users/TRIAL/gsp-hq-prod-v21" || exit 1\n',
       b'  cd "C:/Users/TRIAL/gsp-hq-prod-v21-r2" || exit 1\n')]),
    (r"C:\Users\TRIAL\AppData\Local\hermes\scripts\watchdog-webui-hq.py",
     "d84a5d7196264ddd5cd1d787c79b2e6239da21817a1d360a8a75d8daaf14da2d",
     [(b'        cwd=r"C:\\Users\\TRIAL\\gsp-hq-prod-v21", stdout=logf, stderr=logf,\r\n',
       b'        cwd=r"C:\\Users\\TRIAL\\gsp-hq-prod-v21-r2", stdout=logf, stderr=logf,\r\n')]),
]


def sha(b):
    return hashlib.sha256(b).hexdigest()


plan = []
for path, want, pairs in FILES:
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
    changed = sum(1 for a, b in zip(data.split(b"\n"), out.split(b"\n")) if a != b)
    if changed != len(pairs) or data.count(b"\n") != out.count(b"\n") or data.count(b"\r\n") != out.count(b"\r\n"):
        sys.exit("STOP %s: expected exactly %d changed lines with EOL kept, got %d" % (path, len(pairs), changed))
    plan.append((path, data, out))
    print("plan %s: %d line(s), CRLF=%d LF=%d" % (path, changed, out.count(b"\r\n"), out.count(b"\n")))
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

<!-- file: oa/launcher_edit_r2.sh -->
```bash
#!/usr/bin/env bash
# launcher_edit_r2.sh <BK> <run id> : S37 step 9, run out-of-app with spawn_out. Edits both launchers (python -I, byte-exact),
# then bash -n, a compile() check (no .pyc written), diffs and sha256. Output: $BK/logs/launcher_edit_r2.txt
set -u
BK="$1"; RID="$2"; OUT="$BK/logs/launcher_edit_r2.txt"; T=.bak-20261104-datum-rev-a
PY="C:/Users/TRIAL/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe"
S=/c/Users/TRIAL/gsp-ecosystem/gsp-ecosystem-start.sh
W=/c/Users/TRIAL/AppData/Local/hermes/scripts/watchdog-webui-hq.py
{
  echo "run=$RID"
  echo "start $(date '+%F %T')"
  "$PY" -I "$BK/oa/launcher_edit_r2.py" || { echo "STOPPED (nothing written unless an 'edited' line is above)"; exit 1; }
  bash -n "$S" && echo "bash -n start.sh OK"
  "$PY" -I -c "import sys; compile(open(sys.argv[1], 'rb').read(), sys.argv[1], 'exec'); print('watchdog compile OK')" "$W"
  echo "== diff start.sh"; diff "$S$T" "$S"
  echo "== diff watchdog (CR stripped for display)"; diff --strip-trailing-cr "$W$T" "$W"
  echo "== EOL"; file "$S" "$W"
  sha256sum "$S" "$W" "$S$T" "$W$T"
  echo "end $(date '+%F %T')"
} > "$OUT" 2>&1
```

<!-- file: oa/launcher_restore.sh -->
```bash
#!/usr/bin/env bash
# launcher_restore.sh <BK> <run id> : RB-2, run out-of-app with spawn_out. Restores both launchers from
# .bak-20261104-datum-rev-a and shows sha256 (expected 3fc38f68... start.sh, d84a5d71... watchdog).
set -u
BK="$1"; RID="$2"; OUT="$BK/logs/launcher_restore.txt"; T=.bak-20261104-datum-rev-a
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

<!-- file: oa/hermes_repoint.py -->
```python
# hermes_repoint.py [--check] : S37 step 10 (S49). Repoints the `studio` MCP entry of the 5 Hermes profiles from
# gsp-hq-prod-v21 to gsp-hq-prod-v21-r2 (cli.mjs, server.ts, NODE_EXTRA_CA_CERTS). Byte-exact, CRLF kept, backup
# config.yaml.bak-datum-rev-a-20261104. All 5 files are verified (counts, EOL, YAML parse, parsed entry) before any
# write. Secret VALUES are never read: config.yaml holds only the ${env:INTERNAL_API_SECRET} reference, which is
# asserted unchanged. --check verifies and writes nothing. Run out-of-app (AppData is virtualized in-app).
import hashlib, os, shutil, sys
import yaml

CHECK = "--check" in sys.argv
H = r"C:\Users\TRIAL\AppData\Local\hermes\profiles"
PROFILES = ["gsp-master01", "gsp-master", "gsp-thinker", "gsp-worker", "gsp-worker-fast"]
TAG = ".bak-datum-rev-a-20261104"
OLD_ROOT = r"C:\Users\TRIAL\gsp-hq-prod-v21"
NEW_ROOT = r"C:\Users\TRIAL\gsp-hq-prod-v21-r2"
REPL = [(b"\\gsp-hq-prod-v21\\", b"\\gsp-hq-prod-v21-r2\\", 2), (b"/gsp-hq-prod-v21/", b"/gsp-hq-prod-v21-r2/", 1)]


def sha(b):
    return hashlib.sha256(b).hexdigest()


def entry_ok(raw, root, cert_root, profile):
    st = yaml.safe_load(raw.decode("utf-8"))["mcp_servers"]["studio"]
    env = st.get("env") or {}
    return (st.get("args") == [root + r"\node_modules\tsx\dist\cli.mjs", root + r"\scripts\studio\mcp\server.ts"]
            and env.get("NODE_EXTRA_CA_CERTS") == cert_root + "/certs/hq-cert.pem"
            and env.get("INTERNAL_API_SECRET") == "${env:INTERNAL_API_SECRET}"
            and env.get("STUDIO_BASE_URL") == "https://localhost:9011"
            and env.get("STUDIO_AGENT_ID") == "hermes-" + profile
            and env.get("STUDIO_MCP_TOOLSETS") == "write"
            and st.get("enabled") is True)


plan = []
for p in PROFILES:
    path = os.path.join(H, p, "config.yaml")
    data = open(path, "rb").read()
    if os.path.exists(path + TAG):
        sys.exit("STOP backup exists " + path + TAG)
    if not entry_ok(data, OLD_ROOT, "C:/Users/TRIAL/gsp-hq-prod-v21", p):
        sys.exit("STOP %s: current studio entry is not the expected gsp-hq-prod-v21 entry" % p)
    out = data
    for old, new, n in REPL:
        if out.count(old) != n:
            sys.exit("STOP %s: %r count %d != %d" % (p, old, out.count(old), n))
        out = out.replace(old, new)
    if b"gsp-hq-prod-v21\\" in out or b"gsp-hq-prod-v21/" in out:
        sys.exit("STOP %s: old checkout path left" % p)
    if out.count(b"\r\n") != data.count(b"\r\n") or out.count(b"\n") != data.count(b"\n"):
        sys.exit("STOP %s: EOL changed" % p)
    if not entry_ok(out, NEW_ROOT, "C:/Users/TRIAL/gsp-hq-prod-v21-r2", p):
        sys.exit("STOP %s: edited studio entry does not parse to the r2 entry" % p)
    plan.append((p, path, data, out))
    print("plan %s: 3 replacements, CRLF=%d, parsed entry OK" % (p, out.count(b"\r\n")))
if CHECK:
    print("--check: nothing written")
    sys.exit(0)
for p, path, data, out in plan:
    shutil.copy2(path, path + TAG)
    if sha(open(path + TAG, "rb").read()) != sha(data):
        sys.exit("STOP backup mismatch " + p)
    with open(path, "wb") as fh:
        fh.write(out)
    print("%s: %s -> %s backup %s" % (p, sha(data)[:16], sha(out)[:16], path + TAG))
print("repoint done: 5 profiles")
```

<!-- file: oa/hermes_repoint.sh -->
```bash
#!/usr/bin/env bash
# hermes_repoint.sh <BK> <run id> : S37 step 10, run out-of-app with spawn_out. Output: $BK/logs/hermes_repoint.txt
set -u
BK="$1"; RID="$2"; OUT="$BK/logs/hermes_repoint.txt"
PY="C:/Users/TRIAL/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe"
H=/c/Users/TRIAL/AppData/Local/hermes/profiles
{
  echo "run=$RID"
  echo "start $(date '+%F %T')"
  "$PY" -I "$BK/oa/hermes_repoint.py" || { echo "STOPPED"; exit 1; }
  for p in gsp-master01 gsp-master gsp-thinker gsp-worker gsp-worker-fast; do
    c="$H/$p/config.yaml"
    echo "== $p r2_refs=$(grep -c 'gsp-hq-prod-v21-r2' "$c") old_refs=$(grep -cE 'gsp-hq-prod-v21[\\/]' "$c") env_ref=$(grep -c 'INTERNAL_API_SECRET: \${env:INTERNAL_API_SECRET}' "$c") crlf=$(grep -c $'\r$' "$c")/$(wc -l < "$c")"
    diff --strip-trailing-cr "$c.bak-datum-rev-a-20261104" "$c"
  done
  echo "end $(date '+%F %T')"
} > "$OUT" 2>&1
```

<!-- file: oa/hermes_restore.sh -->
```bash
#!/usr/bin/env bash
# hermes_restore.sh <BK> <run id> : RB-2, run out-of-app with spawn_out. Restores the 5 profile config.yaml files from
# config.yaml.bak-datum-rev-a-20261104 and checks that each restored file equals its backup.
set -u
BK="$1"; RID="$2"; OUT="$BK/logs/hermes_restore.txt"; T=.bak-datum-rev-a-20261104
H=/c/Users/TRIAL/AppData/Local/hermes/profiles
{
  echo "run=$RID"
  for p in gsp-master01 gsp-master gsp-thinker gsp-worker gsp-worker-fast; do
    [ -f "$H/$p/config.yaml$T" ] || { echo "STOP missing $H/$p/config.yaml$T"; exit 1; }
  done
  for p in gsp-master01 gsp-master gsp-thinker gsp-worker gsp-worker-fast; do
    c="$H/$p/config.yaml"
    cp -p "$c$T" "$c" && cmp -s "$c$T" "$c" && echo "restored $p old_refs=$(grep -cE 'gsp-hq-prod-v21[\\/]' "$c") r2_refs=$(grep -c 'gsp-hq-prod-v21-r2' "$c")"
  done
  echo "done $(date '+%F %T')"
} > "$OUT" 2>&1
```

<!-- file: oa/gw_restart2.sh -->
```bash
#!/usr/bin/env bash
# gw_restart2.sh <BK> <profile> <tag> <run id> : restart one Hermes gateway (D-589 pattern), out-of-app with spawn_out.
set -u
BK="$1"; p="$2"; L="$BK/logs/gw_restart_$3_$p.log"
echo "run=$4" > "$L"
echo "start $(date -u +%FT%TZ)" >> "$L"
"/c/Users/TRIAL/AppData/Local/hermes/bin/hermes.exe" -p "$p" gateway restart >> "$L" 2>&1
echo "exit=$? $(date -u +%FT%TZ)" >> "$L"
```

<!-- file: oa/mcp_e2e2.sh -->
```bash
#!/usr/bin/env bash
# mcp_e2e2.sh <BK> <profile> <tag> <run id> : one-shot Hermes session that calls only the read tool studio_contracts_query
# (D-588/D-589 pattern), out-of-app with spawn_out. Nothing is written to Studio.
set -u
BK="$1"; p="$2"; L="$BK/logs/mcp_e2e_$3_$p.log"
echo "run=$4" > "$L"
echo "start $(date -u +%FT%TZ)" >> "$L"
"/c/Users/TRIAL/AppData/Local/hermes/bin/hermes.exe" -p "$p" -z "Uji koneksi singkat dari operator. Panggil alat MCP studio_contracts_query dengan argumen {\"mission\": \"2026-11-04_datum-rev-a-mcp-check\"}. Jangan memanggil alat lain dan jangan menulis apa pun. Balas satu baris: STUDIO_E2E ok=<true|false> code=<kode atau none>." >> "$L" 2>&1
echo "exit=$? $(date -u +%FT%TZ)" >> "$L"
```

<!-- file: oa/skill_refresh.sh -->
```bash
#!/usr/bin/env bash
# skill_refresh.sh <BK> <src checkout> <run id> : S53, out-of-app with spawn_out. Backs up the installed gsp-studio-write skill
# to $BK/hermes_skill_before/, copies SKILL.md + 2 references from the src checkout, and compares sha256.
set -u
BK="$1"; SRC="$2"; RID="$3"; OUT="$BK/logs/skill_refresh.txt"
D=/c/Users/TRIAL/AppData/Local/hermes/skills/gsp/gsp-studio-write
{
  echo "run=$RID"
  [ -e "$BK/hermes_skill_before" ] && { echo "STOP $BK/hermes_skill_before exists"; exit 1; }
  grep -qE '^Status: DRAF' "$SRC/docs/hermes-skills/gsp-studio-write/SKILL.md" && { echo "STOP source SKILL.md still has the DRAF status line (finding F-4)"; exit 1; }
  mkdir -p "$BK/hermes_skill_before" && cp -rp "$D/." "$BK/hermes_skill_before/" && echo "backup OK $(ls -R "$BK/hermes_skill_before" | tr '\n' ' ')"
  cp -p "$SRC/docs/hermes-skills/gsp-studio-write/SKILL.md" "$D/SKILL.md"
  cp -p "$SRC/docs/STUDIO-HOWTO-DOCUMENT.md" "$D/references/howto-document.md"
  cp -p "$SRC/docs/STUDIO-HOWTO-REPORT.md" "$D/references/howto-report.md"
  for pair in "docs/hermes-skills/gsp-studio-write/SKILL.md:SKILL.md" "docs/STUDIO-HOWTO-DOCUMENT.md:references/howto-document.md" "docs/STUDIO-HOWTO-REPORT.md:references/howto-report.md"; do
    a="$SRC/${pair%%:*}"; b="$D/${pair#*:}"
    if [ "$(sha256sum < "$a")" = "$(sha256sum < "$b")" ]; then echo "SAME ${pair#*:} $(sha256sum < "$b" | cut -c1-16)"; else echo "DIFF ${pair#*:}"; fi
  done
  echo "done $(date '+%F %T')"
} > "$OUT" 2>&1
```

<!-- file: oa/realcheck.sh -->
```bash
#!/usr/bin/env bash
# realcheck.sh <BK> <label> <run id> : out-of-app (real, non-virtualized) view of the launchers, the 5 Hermes configs and the
# installed skill: sha256 and path-reference counts only, no file content. Output: $BK/logs/realcheck_<label>.txt
set -u
BK="$1"; LBL="$2"; RID="$3"; OUT="$BK/logs/realcheck_$LBL.txt"
H=/c/Users/TRIAL/AppData/Local/hermes
{
  echo "run=$RID"
  echo "== $(date '+%F %T') label=$LBL"
  sha256sum /c/Users/TRIAL/gsp-ecosystem/gsp-ecosystem-start.sh "$H/scripts/watchdog-webui-hq.py"
  grep -n 'gsp-hq-prod-v21' /c/Users/TRIAL/gsp-ecosystem/gsp-ecosystem-start.sh "$H/scripts/watchdog-webui-hq.py" | cut -c1-400
  for p in gsp-master01 gsp-master gsp-thinker gsp-worker gsp-worker-fast; do
    c="$H/profiles/$p/config.yaml"
    echo "$p $(sha256sum < "$c" | cut -c1-16) r2_refs=$(grep -c 'gsp-hq-prod-v21-r2' "$c") old_refs=$(grep -cE 'gsp-hq-prod-v21[\\/]' "$c")"
  done
  sha256sum "$H/skills/gsp/gsp-studio-write/SKILL.md" "$H/skills/gsp/gsp-studio-write/references/"*.md
  echo "done $(date '+%F %T')"
} > "$OUT" 2>&1
```

## S. Security fixes (S39 review `verification/25_datum_rev_a_security_review.md`, D-614: fix all, accept none)

Reviewed baseline: sha256 `7d6f662e7c8df28f6b30676ff3d98b4d46bf1bf4c691efdd486273c3ce56ffb5`. In revision 2, of the 24 previously reviewed blocks 19 were byte-identical, 5 changed (`env.sh`, `procs_studio.sh`, `derive_driver.mjs`, `launcher_edit_r2.py`, `realcheck.sh`) and 4 were new (`steps.sh`, `gate_tests.sh`, `secret_scan.py`, `check_seed.mjs`), 28 in total (I-R3 correction).

| Finding | Fix | Where |
|---|---|---|
| M39-1 STOP checks only printed | Every step is a function in `tools/steps.sh`; every check is `chk <label> <predicate> \|\| return 1` and every changing command is followed by `\|\| return 1`. The step-1 commit, the step-11 production import and the RB-3 `pg_restore --clean` run only after all their gates. `tools/gate_tests.sh` forces each check to fail in turn (the `false` substitution) and proves that no later command runs: 26 step functions, 167 checks, all PASS. Section 1 and step 0.4 run it before every real run | `tools/steps.sh`, `tools/gate_tests.sh`, steps 0-14 |
| M39-2 D-612 not implemented | Production smoke = one `datum-nota` document in mission `2026-11-04_datum-rev-a-prod-smoke` (`check_render ... 1`, exactly one row, archived with `exp_docs=1`); the derived driver refuses any other target list or B-FIX on 9011. `latest` = `OLD_MCP=0` + `datum_gsp_active` + R2 unit test (no `latest` document). S52 scores only that document with the clone B-FIX; the 10-template evidence is S44/S45. F-3 second line (`hq_restart.mjs` comment) added to `launcher_edit_r2.py`, sha-pinned, exact match. Step 0 copies the driver from `C:/Users/TRIAL/gsp-backups/datum-rev-a-rollout-assets/driver.ts` (sha `9bf43077...`) | `step12_smoke`, `step13_archive`, `step11_import`, `oa/launcher_edit_r2.py`, `step0_driver`, `tools/derive_driver.mjs`, step 13.1 |
| M39-3 RB-3 weakly gated | `rb3_restore`: window; dump sha and anchor; safety dump to a unique timestamped name (absent check, no glob); `pg_dump` exit, `pg_restore --list` with the table count, `SHA256SUMS_rb3_<stamp>` written, verified and anchored; explicit `stop_listener` 9011/9051/9041 and `stop_bridge` (bridge identified by its exact command line; its working directory is not visible to a read-only listing); `no_other_sessions` must see 0 other sessions; only then the restore. The same restore command is rehearsed on the clone in step 7 | `rb3_restore`, `rb3_restart`, `stop_bridge`, `bridge_pids`, `no_other_sessions`, `step7_import_rehearsal` |
| L39-1 guard not bound to the command | Database names set once (`PROD_DB`, `CLONE_DB`, `MAINT_DB`); `db_guard <db>`, `on_db <db> <cmd>` (guard + `PGDATABASE`), `psql_ro <db>`, `restore_into <db>` (guard and `-d` from one variable), `db_url <db>`; no command carries its own `-d` literal | `tools/env.sh`, all steps |
| L39-2 secrets exported to every child | Credentials and tokens in non-exported variables, inherited secret names unexported, per-command prefixes (`pgx`, `db_url`, `smoke`, `rd`); `no_secret_env` checked before `npm ci`; tsx and Prisma run directly (no npx); the MCP child gets `getDefaultEnvironment()` + `NODE_EXTRA_CA_CERTS` + `INTERNAL_API_SECRET` only | `tools/env.sh`, `step2_build`, `tools/derive_driver.mjs` |
| L39-3 narrow secret scans | `tools/secret_scan.py`: every secret key of the production `.env` by name (and URL passwords), names and counts only; used at steps 1, 6, 10, 12 and S54 | `tools/secret_scan.py`, `secret_scan`, `s54_secret_scan` |
| L39-4 spawn_out filter and ReturnValue | Character allow-list `^[A-Za-z0-9_./:= -]+$`; non-zero WMI `ReturnValue` -> STOP | `spawn_out` in `tools/env.sh` |
| L39-6 dump retention | Section L: sensitivity, owner-only ACL check (`backup_acl_ok` in steps 0 and 3), retention note for the USER (delete 14 days after S54 and the end of the rollback window, record in decisions.md; not automated) | section L, `step0_preflight`, `step3_backup` |
| L39-7 C:\tmp work folders | Driver from the gsp-backups asset; clash.py `--work-dir "$WORK/clash-work"`; gate-test sandboxes under `$WORK`; no `C:\tmp` path is used | step 0, step 13.1, `tools/gate_tests.sh` |
| L39-8 anchors next to what they protect | Runbook sha checked against `decisions.md` in step 0; dump, export and SQL manifest digests in `$BK/logs/anchors.txt` and `runbook.log`, re-checked in steps 7 and 11 and RB-3; `IMPORT_VARS.txt` inside the hashed export manifest | `runbook_recorded`, `anchors_ok`, `step7_export` |

L39-5 (scorer attribute regex) and I39-1 (replacer function) are code changes outside this runbook (D-614).

## R. Re-review fixes (re-review of sha `87da5dea...`, `verification/25_datum_rev_a_security_review.md` section 9; controller: fix all 4 Lows and the cheap Info items)

| Finding | Fix | Where |
|---|---|---|
| R-L1 `wait_log` could accept a previous run's log | `oa_run <log> <seconds> "<script> <args>"` moves an existing log aside (`<log>.prev-<timestamp>-<random>`, nothing deleted), passes a fresh run id (`r<YYYYMMDDHHMMSS><random>`) as the script's last argument and calls `wait_log <log> <seconds> <run id>`. Every out-of-app script that writes a log now writes `run=<id>` as its first line, and `wait_log` accepts only a log whose first line is exactly that id and that has a completion line (still failing on `STOP` or `exit=<non-zero>`). All 12 former `spawn_out` + `wait_log` pairs use `oa_run` | `tools/env.sh` (`oa_run`, `wait_log`), `tools/steps.sh`, `oa/realcheck.sh`, `oa/launcher_edit_r2.sh`, `oa/launcher_restore.sh`, `oa/hermes_repoint.sh`, `oa/hermes_restore.sh`, `oa/skill_refresh.sh`, `oa/gw_restart2.sh`, `oa/mcp_e2e2.sh` |
| R-L2 RB-3 order | `rb3_restore` now runs: window check, dump sha and last anchor, unique safety-dump name absent, window check again immediately before stopping, stop 9011, 9051, 9041 and the bridge, zero other sessions, safety dump of the quiesced database (exit code, `pg_restore --list` count, `SHA256SUMS_rb3_<stamp>` verified, anchored, checked as the last anchor, printed), zero other sessions again, restore | `rb3_restore` in `tools/steps.sh`, section 14 |
| R-L3 anchors: any recorded digest accepted; scripts sourced without re-check | `anchor_is <key> <file>` compares with the LAST line recorded for the key; used for the dump (RB-3), the export and SQL manifests (steps 7 and 11) and the RB-3 safety dump. `show_anchors` prints the last digest per key at the end of steps 3 and 7 and in RB-3, for the controller to copy into `decisions.md`. `bk_open` (step 0.3, every new shell) checks the runbook sha in `decisions.md`, then re-hashes all 28 extracted files against the section-A table and sources `env.sh`/`steps.sh` only if all match | `tools/steps.sh` (`anchor_is`, `anchors_ok`, `show_anchors`), step 0.3 |
| R-L4 `OLD_MCP` matched one launcher form only | `procs_studio.sh` classifies every `node.exe` whose command line matches `studio[\/]+mcp[\/]+server\.ts` (case-insensitive, either slash, any loader) by checkout: OLD (`gsp-hq-prod-v21[\/]+scripts...`), R2 (`-r2`), REPO (`gsp-swarm-hq-v2.1`), otherwise UNKNOWN (including relative paths). It counts one server per process tree. The gate `old_mcp_zero` requires `OLD_MCP=0` AND `UNKNOWN_MCP=0`. Live read-only run: `OLD_MCP=6 R2_MCP=0 REPO_MCP=0 UNKNOWN_MCP=0` (the 4 gateways plus 2 non-gateway Hermes sessions, as the review counted). A synthetic test classified 8 of 8 command lines correctly (backslash, forward slash, mixed and doubled slashes, upper case, `node --import`, npx, a loader child, R2, REPO, a relative path, another root) | `tools/procs_studio.sh`, `old_mcp_zero`, `r2_mcp_zero`, `step10_gate` |
| I-R1 step-2 checks passing on an empty result | `git config`, `git rev-parse` (both) and `git status` outputs are captured first with `\|\| return 1`, then compared | `step2_build` |
| I-R3 wording | Step 0 expects 28 extraction lines; section S states 19 identical, 5 changed, 4 new | step 0, section S |
| I-R4 launcher line 119 | Not edited: `launcher_edit_r2.py` does not touch that comment, and it names no runnable path (left as is, documented in step 9) | step 9 |
| I-R5 bridge matcher | `bridge_pids` additionally requires `ExecutablePath = C:\Program Files\nodejs\node.exe`; `stop_bridge` logs the parent command line before the kill. The working directory cannot be read from a read-only process listing, so it is not required (documented) | `tools/env.sh` |

Not changed: I-R2 (operational: steps 10-11 wait until the 2 non-gateway old MCP servers end) and I-R6 (`clash.py` default, code outside the runbook; the runbook always passes `--work-dir "$WORK/clash-work"`).
