---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: S54
date: 2026-11-04 / 2026-11-05 (session 23:33-00:09 WIB)
agent: verifier
skills_loaded: verification-before-completion
source_plan: docs/2026-10-22_doc_artifact_studio/identification/02_structured_datum_rev_a.md (row S54)
runbook: docs/2026-10-22_doc_artifact_studio/deploy/05_datum_rev_a_rollout_plan.md (sha256 5720b724186573ca591b411058c8961f5fb00b5d844c36bf620c077093eb8726, D-618; sections S54, 14, L)
decisions_read: D-590..D-623
inputs_read: deploy/06, deploy/07, deploy/08, verification/26, verification/27, verification/28
verdict: PASS-WITH-NOTES. 11 ACs pass (5 of them with notes). AC-8 is only partly met: its coverage clause is NOT met (report-only per D-608). 0 High, 1 Medium, 8 Low.
status: complete
---

# S54: DATUM Rev A final verification (production)

## 1. Verification scope

- **What was checked:** AC-1..AC-12 in the production context, production health, Hermes wiring, rollback readiness, a 30-minute log observation, secret leakage, and U1-U4 traceability (D-592..D-595).
- **How:** everything is fresh evidence from this session (23:33-00:09 WIB). Every shell opened the runbook environment with `bk_open` (`tools_ok: 28 files checked, 0 mismatches`; `secrets loaded=yes exported=none`). All production SQL went through `psql_ro`, which runs the session with `default_transaction_read_only=on`. That was confirmed: `show default_transaction_read_only` returned `on`, and `CREATE TEMP TABLE` was refused with `cannot execute CREATE TABLE in a read-only transaction`.
- **Nothing in production was changed.** No process was started or stopped, no document was created, and no file in `$BK`, the launchers, Hermes or R2 was edited.
  - All outputs went to the session scratchpad, plus two temp folders: `C:/Users/TRIAL/AppData/Local/Temp/s54cmp` (AC-7 renders) and `.../Temp/s54gate` (gate-test sandboxes).
  - The AC-7 baseline render ran on the DEV repo tree. Its code equals commit `5fd72c5`; only docs differ. That run appended its usual `PROFILE_NORMALIZED` lines to `gsp-swarm-hq-v2.1/data/studio-workspace/logs` (DEV, as documented in `verification/19` §4).
- **Paths:** `$BK` = `C:/Users/TRIAL/gsp-backups/datum-rev-a-20261104-2230`; `$ECO` = `C:/Users/TRIAL/gsp-ecosystem`; R2 = `C:/Users/TRIAL/gsp-hq-prod-v21-r2`; OLD = `C:/Users/TRIAL/gsp-hq-prod-v21`.
- **Times:** WIB unless marked Z (UTC = WIB - 7 h).

## 2. Checks table

| Check | Result | Evidence |
|---|---|---|
| Intent alignment (AC-1..AC-12, U1-U4) | PASS-WITH-NOTES | Section 3 and section 9. AC-8's coverage clause is not met (report-only by D-608) |
| Syntax | PASS | R2 `git status --porcelain` = 0 lines at `5fd72c5`; R2 vitest S10 `Tests 2 passed \| 30 skipped`; the build is the one served (section 4) |
| Logic | PASS | Fresh re-score of the production document: `skor 90.9 % (30/33) \| kritis 4/4 \| bentrok 0` (= `verification/28`). AC-7 `compare: 8/8 SAME`, `convert_v2` SAME x3 |
| Integration | PASS | 9011 serves the R2 build `6xb9ugamWFD9_JCpImrdi`, 17 templates, smoke `fail 0`. `OLD_MCP=0` in 8/8 inventories. A live agent wrote and rendered a document on a new template during the window (section 6) |
| Regression | PASS | 7 old templates byte-identical to step 0 (sha256 `9025cc39...` on both files) at 23:37 and at 00:08; ID baseline 8/8 SAME; old build on 9051 healthy |
| Safety | PASS | `s54_secret_scan` hits=0. The extended scans (task docs, commit `5fd72c5` patch and tree, Hermes logs, ecosystem logs, workspace) also gave hits=0, and the positive control produced a HIT. No push: `git branch -r --contains 5fd72c5` = 0 lines |

## 3. Acceptance criteria (production context)

| AC | Fresh evidence | Verdict |
|---|---|---|
| **AC-1** seed flag `--doc-type-templates` | `check_seed.mjs` re-run over the step-5 production-clone logs: `{"mode":"dry","rows":4,"fail":0}`, `{"mode":"real","rows":3,"fail":0}`, `{"mode":"rerun","rows":3,"fail":0}`. The real log has 10 x `"outcome":"created"`, the rerun 10 x `"outcome":"unchanged"`. Negative control: checking the rerun log as `real` gives `fail 1`. Production itself is never seeded: it receives the import, and the seed guard rejects `gsp_agent_hq` | PASS |
| **AC-2** new rows: not restricted, `contractKind` null, not archived, base = latest `datum-gsp-preset` | `psql_ro` on production, all 10 slugs: `archived f`, `isPreset f`, `contractKind NULL`, `latestVersionNo 1`, 1 version each, and `bool_and(baseVersionId = latest datum-gsp-preset version) = t`. `restricted` is derived, not a column (`prisma/seed-studio-templates.ts:241`). It was proven by `storedOk` on the clone, and the production rows are md5-identical to the clone rows (AC-3) | PASS |
| **AC-3** 7 old templates identical; the 10 new = export manifest | `old_templates_fp.sql` on production at 23:37 and again at 00:08 is byte-identical to `$BK/logs/prod_old_templates_00.txt` (step 0). `new10_fp.sql` is byte-identical to `$BK/export/MANIFEST_new10_fp.txt`: StudioTemplate 10 `efbcc086...`, Version 10 `2293a669...`, Slot 72 `7a86770d...`, SlotParam 170 `0b8c9357...`, RoleFormat 0 `d41d8cd9...`. Section types 52, md5 `6c51234e...` (= step 0). DEV and clone parts: `verification/26` AC-3, `deploy/06` step 5 | PASS |
| **AC-4** `latest` = `datum-gsp` | R2 vitest S10: `Tests 2 passed`. R2 client probe: `{"latest":"datum-gsp","constant":"datum-gsp","passthrough":"datum-nota"}`. `datum_gsp_active` ok at 00:08. `OLD_MCP=0` in all 8 inventories. Production document list: no `latest` document (D-612) | PASS-WITH-NOTE (L-3) |
| **AC-5** sample per template valid under R08, DOCX and PDF rendered | `check_render.mjs` re-run: rehearsal `{"rows":11,"fail":0}` (10 templates + `latest` -> datum-gsp KT); production `{"rows":1,"fail":0}`. I hashed all 22 rehearsal files independently: 0 mismatches against the recorded and server sha. Production smoke DOCX `4ac997bc...` and PDF `16df26bc...` equal the stored files in `gsp-studio-workspace-prod/.../001-GSP-NOT-XI-2026/rev-4/`, and the DOCX equals the rehearsal `datum-nota.docx` | PASS |
| **AC-6** EN renders free of the ID strings; `1,250,000.5` and IDR | Fresh text-run scan of document, header and footer XML in the 5 rehearsal EN renders and the 5 EN B-FIX files: 0 hits for the 11 AC-6 strings. Each EN B-FIX has `1,250,000.5` x1 and `IDR` x1. Positive control: ID `datum-laporan.docx` gives 17 hits. The S40 notes still hold: chart-internal labels and alt text stay ID (D-601(5)) | PASS-WITH-NOTE |
| **AC-7** ID output byte-identical | `render_id_samples.ts --compare` (tree code = `5fd72c5`): `compare: 8/8 SAME`, rc 0. `convert_v2.ts --check`: SAME x3, rc 0. Reinterpreted by D-610: holds for uppercase classification input | PASS-WITH-NOTE |
| **AC-8** conformance: score >= 85 %, 4/4 critical, coverage >= 85 %, 0 clashes | Fresh re-score of the production document (server PDF, `--no-convert`): `clash: 0 clashes on 2 pages`; `skor 90.9 % (30/33) \| kritis 4/4 \| cakupan 40.6 \| bentrok 0`. The rehearsal (S45, `verification/27`) had 10/10 pairs at 90.9-94.2 %, 4/4, 0 clashes. **The coverage clause is NOT met: 40.6 % in production and 39.3-46.9 % across the 10 pairs, against the 85 % that AC-8 and D-593 require.** D-608 made coverage report-only | **PARTLY MET**: D-608 gate PASS; coverage clause FAIL as written (M-1) |
| **AC-9** usage parity | Rehearsal MCP request payloads diffed per language. ID (5 templates + `latest`): the differing paths are `['/docKey', '/template']`. EN (5 templates): the same | PASS-WITH-NOTE (`/docKey` differs, as recorded in S40) |
| **AC-10** code review and security review | `verification/24:20-22`: APPROVED WITH COMMENTS, U4 blocker check PASS, 0 blockers. `verification/25` §10 (`:217-223`): delta check of sha `5720b724...` = the executed runbook: PASS, 0 new findings | PASS-WITH-NOTE (L-6) |
| **AC-11** doc slug tables = register; installed skill = repo | R2 `docs/STUDIO-HOWTO-DOCUMENT.md` table and `SKILL.md` table give the same 10 slugs, codes, tiers and kickers as the production spec (`$BK/prod-smoke/spec.json`, sha `27ea914b...` = rehearsal spec). Installed skill sha256: `SKILL.md` `f8245976...`, `references/howto-document.md` `174f74cf...`, `references/howto-report.md` `7c2b28aa...`. Each one is equal in 4 places: installed copy, repo working tree, R2, and `git show 5fd72c5:<path>` | PASS |
| **AC-12** backup verified, one-transaction import, delta = export, RB-1/RB-2 ready, RB-1 rehearsed | See section 3.1 | PASS |

### 3.1 AC-12 detail

| Item | Fresh evidence |
|---|---|
| Dump sha256 = D-620 anchor | `sha256sum gsp_agent_hq_20261104-2230.dump` = `1f5703cac26ca46473ae1862abff815decee009da0b1a85b5bf0e4ee726c71fe` (= D-620). `sha256sum -c SHA256SUMS` OK. `SHA256SUMS` = `4897ee44...` and `export/SHA256SUMS` = `d13be12c...` (all 7 entries OK). `sql/SHA256SUMS_sql` = `c0b20dda...` (3 entries OK). `logs/anchors.txt` holds exactly these 3 digests (= D-620) |
| `pg_restore --list` reads it | rc 0. Header `Archive created at 2026-11-04 22:34:32`, `dbname: gsp_agent_hq`, `TOC Entries: 380`, `Format: CUSTOM`, PostgreSQL 17.11. 56 `TABLE DATA` entries, including the 5 template tables. The listing is byte-identical to the step-3 `logs/dump_list.txt` |
| Dump protection (section L) | `icacls`: the folder and the dump allow only `NT AUTHORITY\SYSTEM`, `BUILTIN\Administrators` and `DESKTOP-BR2DLT9\TRIAL` |
| One transaction | `step11_import` runs psql with `--single-transaction -v ON_ERROR_STOP=1` (runbook `:927`). `logs/prod_import.txt` shows `LOCK TABLE` succeeding, which PostgreSQL allows only inside a transaction block. The pre-checks, inserts and post-checks are in one run: `NOTICE: pre-checks ok: counts {10,10,72,170,0} fingerprints match` ... `NOTICE: post-checks ok: 17 templates (before 7 + 10)` |
| Count delta = export | `diff prod_counts_11_before.txt prod_counts_11_after.txt` changes only StudioTemplate 7->17, StudioTemplateVersion 10->20, StudioTemplateSlot 43->115, StudioTemplateSlotParam 55->225. That is +10/+10/+72/+170 (RoleFormat 0, unchanged), equal to `COPY 10/10/72/170/0` and the manifest. Fresh production counts at 23:37 equal `prod_counts_13_after_archive.txt` |
| RB-1/RB-2 commands present | `tools/steps.sh` defines `rb1_archive`, `rb2_code`, `rb2_config`, `rb2_gate`, `rb3_restore`, `rb3_restart` once each, and the extracted tools match the runbook hashes (28/0). `sql/rb1_archive.sql` is sha-verified. Fresh `gate_tests.sh` with a sandbox outside `$BK`: rb1_archive 5 checks, rb2_code 3, rb2_config 3, rb2_gate 6, rb3_restore 10, rb3_restart 2, `gw_one gsp-worker RB2` 1: all `result=PASS` |
| RB-1 rehearsed on the clone | `logs/step6_console.txt`: `ok smoke.old_archived`, `ok smoke.old_archived_7`, `ok smoke.old_code_latest_datum_gsp`, `ok gladi.old_mcp_latest_is_datum_gsp`, `ok clone.unarchive_restores_seeded_rows` |

## 4. Production health

| Item | Fresh evidence | Result |
|---|---|---|
| 9011 serves R2 at `5fd72c5` | Listener 9011 = PID 30144 (`node.exe hq-server.mjs`, started 22:54:30, parent `nohup.exe node hq-server.mjs`). `hq-r2.log` line 1: `start-hq2: dir=/c/Users/TRIAL/gsp-hq-prod-v21-r2`. R2 `.next/BUILD_ID` = `6xb9ugamWFD9_JCpImrdi`, and that ID is embedded in the HTML served by `https://localhost:9011/login`. The old build ID `fzDk38CCDe9s5uz60zImC` is absent. R2 HEAD = `5fd72c50ce4269b0fe785b5df920507ac26a02ba`, tag `prod-v2.1-datum-rev-a-20261104`, working tree clean | PASS |
| `/login` 200 | 200 in all 7 samples (23:36-00:07), and in smoke S-1 (`login 200, root 307`) | PASS |
| Template list = 17 | Runbook smoke at 23:35:31: `{"id":"S-5","ok":true,"status":200,"n":17,...}` with the 17 slugs, `{"id":"SUMMARY","fail":0}`. SQL `count(*) StudioTemplate` = 17 at 00:08 | PASS |
| 0 new `request error` | `grep -c 'request error'`: `hq-r2.log` 0 (all 7 samples and at the start), `hq-v21-standby-9051.log` 0, `hq-9041.log` 0. Workspace request logs (`gsp-studio-workspace-prod/logs/*/…-2026-11-04.jsonl`) since the swap (15:54:30Z): 0 `error`. The only warns are 7 `ROUTE_NOT_FOUND` on `/api/studio/tidak-ada`, the deliberate smoke S-8 probe (one is mine, 23:35). The 2 soffice errors on 2026-11-04 are at 09:35Z/09:50Z, before this rollout | PASS |
| Render duration: production smoke vs DEV | Production `hq-r2.log`: `PDF_CONVERTED durationMs 7062`, `inputBytes 453750`, `queueWaitMs 0` (16:26:09Z). Same-size documents elsewhere: DEV (`.next/dev/logs/next-development.log`, nota-size ~452-454 KB) 3304 / 3439 / 3573 / 3628 ms; rehearsal (`hq-r2-gladi.log`, the byte-identical DOCX) 2855 ms. The production DOCX+PDF job ran in about 8.6 s (last earlier event 16:26:00.83Z -> render reply 16:26:09.39Z) | Observation: about 2x DEV, 2.5x rehearsal (L-1) |

## 5. Hermes

| Item | Fresh evidence | Result |
|---|---|---|
| 5 profiles point at R2 | `config.yaml` per profile, counted in-app (no content printed): gsp-master01, gsp-master, gsp-thinker, gsp-worker and gsp-worker-fast each have `r2_lines=3 old_lines=0 envref=1`. Config sha16 `f556a17a`, `a8c9a888`, `aed60c94`, `21c1f796`, `9ea085df` equal the out-of-app real view after the repoint (`deploy/07` 10a). An AppData shadow copy would be older than the out-of-app write, so the in-app view equalling the new shas shows it is the real file | PASS |
| `OLD_MCP=0` | `procs_studio.sh` via `bk_open`, 8 inventories (23:3x and samples 0-6): `OLD_MCP=0 ... UNKNOWN_MCP=0` every time; `R2_MCP` 5-7. 4 trees belong to the restarted gateways (parents 22780, 33380, 1036, 34540); the rest are R2 Hermes sessions | PASS |
| Installed skill sha256 = repo | See AC-11 (4-way equal for all 3 files). Backup of the previous copy: `$BK/hermes_skill_before/` (`31a3d696...`, `ee0456af...`, `7c2b28aa...`) | PASS |
| Gateway MCP health | `mcp-stderr.log` since 22:59: `studio-mcp` warn/error or `ok:false` = 0 in all 5 profiles before the window. During the window there was 1 `ok:false` (section 6). Unrelated: `BlenderMCPServer` connection errors in gsp-master (23:17) | PASS |

## 6. 30-minute log observation (23:36:26 - 00:07:24, 7 samples, ~5 min 10 s apart)

**Method.** `observe.sh` (scratchpad) took a line-count baseline after my smoke run. Each sample then recorded:

- `/login` on 9011, 9051 and 9041;
- the listener PIDs;
- `procs` (via `bk_open`);
- the `request error` total in `hq-r2.log`;
- per file: new lines, and new lines matching `error|warn|exception|traceback|fail`, plus the subset that also mentions `studio|mcp|template`.

The files sampled:

- `$ECO/hq-r2.log`, `hq-v21-standby-9051.log`, `watchdog.log`, `webui.log` and `bridge.log`;
- for the 5 Hermes profiles, `logs/gateway.log`, `errors.log`, `mcp-stderr.log` and `gateway-stdio.log`;
- the workspace request logs, compared before and after the window.

No document was created by the verifier. The sampled new lines passed `secret_scan` (27 files, hits=0).

| # | Time | /login 9011 / 9051 / 9041 | Listener PIDs (9011/9051/9041/9012) | OLD_MCP / R2_MCP | `request error` (hq-r2.log) | New hq-r2.log lines (err/warn match) | Studio/MCP/template err-warn (all files, cumulative) | Other new err/warn (cumulative) |
|---|---|---|---|---|---|---|---|---|
| 0 | 23:36:26 | 200 / 200 / 200 | 30144 / 27224 / 31428 / 32528 | 0 / 6 | 0 | 0 (0) | 0 | thinker 2 |
| 1 | 23:41:37 | 200 / 200 / 200 | same | 0 / 5 | 0 | 0 (0) | 0 | worker 4, thinker 4, bridge 11 |
| 2 | 23:46:47 | 200 / 200 / 200 | same | 0 / 5 | 0 | 0 (0) | 0 | worker 4, thinker 4, bridge 21 |
| 3 | 23:51:55 | 200 / 200 / 200 | same | 0 / 7 | 0 | 0 (0) | 0 | worker 15, thinker 4, worker-fast 3, bridge 31 |
| 4 | 23:57:06 | 200 / 200 / 200 | same | 0 / 7 | 0 | 114 (1, false positive) | 1 (worker-fast `studio_write` `CONTENT_INVALID`, 23:52:29) | worker 17, thinker 4, worker-fast 4, bridge 42 |
| 5 | 00:02:15 | 200 / 200 / 200 | same | 0 / 5 | 0 | 114 (1, false positive) | 1 | worker 19, thinker 7, worker-fast 6, bridge 52; watchdog 3 lines, 0 err |
| 6 | 00:07:24 | 200 / 200 / 200 | same | 0 / 5 | 0 | 114 (1, false positive) | 1 | worker 19, thinker 7, worker-fast 6, bridge 62 |

**Findings.**

1. **Live production traffic on a new template.** Between samples 3 and 4, the Hermes profile `gsp-worker-fast` used Studio through the R2 MCP. This was not a verifier action.
   - Its first `studio_write` at 23:52:29 was rejected with `CONTENT_INVALID`. The server logged 14 x `SCHEMA_INVALID` (`studio.slot/v2` and `studio.chapter/v2`, at `info` level).
   - 24 s later the retry succeeded (`studio_write ok:true`, 2840 ms; `studio_edit ok:true`). It created production document `cmw2cuu4n000zv19c6errlq3t`, **`001/GSP/STD/XI/2026`, template `datum-standar` v1, STD/TERBIT/ID**, by `agent:hermes-gsp-worker-fast`, not archived.
   - Two DOCX renders followed, both `SUCCEEDED` (511,161 and 511,260 bytes).
   - The rejection reason is not visible: the server's `SCHEMA_INVALID` context holds only issue counts, and the MCP log holds only the code. Whether it is agent content or something specific to the template cannot be told from the logs (hypothesis: agent content; it self-corrected). See L-2.
2. **`hq-r2.log` error/warn match = false positive.** The one match is `RENDER_ENV_READY` with `"errors":[]`. 0 `request error`, 0 `level":"error"`, 0 `level":"warn"` in the 114 new lines. The workspace request logs added 53 api, 35 submit and 20 structure lines in the window, with 0 warn/error.
3. **Not related to Studio, MCP or templates:**
   - `bridge.log` `kanban list failed: Unterminated string in JSON` is 62 in the window. It has run at a steady 120 per hour since at least 06Z (13:00 WIB), long before the rollout, and the first occurrence is 2026-08-24.
   - Gateway `errors.log` warnings: `_check_kanban_orchestrator_mode returned False`, `check_bfl_requirements returned False`, `Hermes Relay drained ... orphaned scope(s)`, a `search_files` path-not-found, and a `terminal` command blocked by the safety filter.
4. **Watchdog cron at 00:00 behaved correctly after the launcher change:** `[00:00:28] webui OK`, `[00:00:32] hq OK`, `[00:00:32] bridge OK`. 9011 stayed PID 30144, so the watchdog did not restart HQ.
5. **End state unchanged for templates (00:08):** the old-7 fingerprint still equals step 0, the new-10 fingerprint still equals the export manifest, 17 templates, `datum_gsp_active` ok. The document tables grew only by the live agent document (StudioDocument 1 -> 2, StudioRevision 4 -> 24, ...).

**Observation verdict:** 0 new `request error`, 0 server errors, 0 Studio/MCP/template server faults. There was 1 client-side `CONTENT_INVALID` on a first agent attempt, recovered in 24 s.

## 7. Rollback readiness

| Item | Fresh evidence | Result |
|---|---|---|
| RB-1/RB-2 commands exist and stop correctly | Section 3.1 (functions present, extracted tools 28/0, gate tests PASS) | PASS |
| Launcher `.bak` | `gsp-ecosystem-start.sh.bak-20261104-datum-rev-a` = `3fc38f68108a365da194d89e79fbd8b6476b92198dc870559d74f0ba3c4aeb8f` and `watchdog-webui-hq.py.bak-20261104-datum-rev-a` = `d84a5d7196264ddd5cd1d787c79b2e6239da21817a1d360a8a75d8daaf14da2d`. These are exactly the shas `rb2_config` requires (runbook `:1002-1003`). The current launchers are `4de2dd0e...` / `adf3b3e0...`, with no runnable old path | PASS |
| Hermes `.bak` | `config.yaml.bak-datum-rev-a-20261104` is present for all 5 profiles. Each has `old_lines=3`, `r2_lines=0`, which is what `hermes_restore.sh`/`rb2_config` expect (`old_refs=3 r2_refs=0`) | PASS |
| Skill backup | `$BK/hermes_skill_before/` holds the 3 files with the pre-refresh shas | PASS |
| Old build on 9051 responds | Listener `127.0.0.1:9051` = PID 27224 (`node.exe hq-server.mjs`, 22:54:06; log `dir=/c/Users/TRIAL/gsp-hq-prod-v21`). `/login` 200 in all 7 samples. The served HTML carries the old build ID `fzDk38CCDe9s5uz60zImC`. OLD HEAD `3566486`. Smoke on 9051: `fail 0` | PASS |
| 9041 untouched | Listener `127.0.0.1:9041` = PID 31428, started 16:58:55 (before the 22:30 start of this run); `hq-9041.log` last written 16:58; `/login` 200 in all 7 samples | PASS |
| RB-3 point | Dump verified (section 3.1); `rb3_restore` gate test PASS | PASS |
| Ordering guard | 9051 reads the same DB and lists 17 templates, and old code would resolve `latest` to `datum-nota-en` (smoke `OLD-CODE-LATEST = datum-nota-en`). So RB-2 without RB-1 would be wrong. `rb2_code` refuses unless `new10_not_active` holds (runbook `:991`), so RB-1 is enforced first | PASS (guard in place) |

## 8. Secret leakage

| Scan (`secret_scan.py`: 6 keys from the production `.env`, names only) | Result |
|---|---|
| `s54_secret_scan` (runbook: `$BK/logs`, `prod-smoke`, `gladi`, `export`, `$ECO/hq-r2.log`, `hq-r2-gladi.log`, `hq-old-gladi.log`, `hq-v21-standby-9051.log`) | `keys=6 ... files=328 hits=0`, `ok secrets.s54` |
| `docs/2026-10-22_doc_artifact_studio/**` | `files=583 hits=0` |
| Commit `5fd72c5`, full patch (`git show`, 2,475,335 bytes) | `hits=0` |
| Commit `5fd72c5`, full tree (`git archive`, 44,667,593 bytes) | `hits=0` |
| Hermes logs of the 5 profiles (`logs/`) | `files=118 hits=0` |
| `$ECO` watchdog, webui, bridge, hq-v21, hq-9041 logs | `files=7 hits=0` |
| Production workspace smoke folder, `$BK/work`, `hermes_skill_before`, `oa`, `tools`, `sql` | `files=594 hits=0` |
| Observation deltas (sample folders) | `files=27 hits=0` |
| Positive control (value piped in memory, never printed) | `HIT key=INTERNAL_API_SECRET`; DB password -> `HIT key=DATABASE_URL`, `HIT key=POSTGRES_URL` |

R2 `.env` is byte-identical to OLD `.env`, so the scanned keys cover R2. **Locations with a hit: none.** Scope limit (L-7): only secret values present in the production `.env` (8 characters or longer) are searched.

## 9. U1-U4 traceability (production evidence)

| User requirement | Decision | Status | Production evidence | Shortfall |
|---|---|---|---|---|
| U1 "target kecocokan dengan datum minimal 85%" | D-592 | **Met** | Fresh production re-score: 90.9 % (30/33), 4/4 critical, 0 clashes. Rehearsal on the production clone with the same code and md5-identical rows: 10/10 pairs at 90.9-94.2 %, 4/4 (`verification/27`) | 3 known engine deviations fail in production (RH-03, RB-05, GF-13; SB-02 n/a for NOTA). They were kept so ID output stays byte-identical (D-598, D-602, D-605) |
| U2 "kalau tidak bisa diukur, cek dengan point coverage dan tidak ada bentrok text" | D-593, made report-only by D-608 | **Partly met** | Point coverage was done and reported per pair: 40.6 % for the production document, 39.3-46.9 % across the 10 pairs (`verification/22`, `/27`). 0 clashes in production (fresh) and on 10/10 rehearsal pairs | **Point coverage is 39.3-46.9 %, below the controller's own 85 % floor (D-593), on every pair. It was made report-only by D-608, a controller decision, not a USER decision.** The USER's words set no number, so "check with point coverage and no text clash" as worded is done. The 85 % floor that D-593 set is not met, and this release must not be reported as meeting it. Causes (D-606, D-608, D-609): points that need agent content, registry parameters the code never reads, engine features that do not exist, and deviations kept for ID byte identity. A follow-up engine round is proposed |
| U3 "metode penggunaannya gunakan cara global yang sama, metadata dan json data seperti template laporan dan dokumen kajian yang sudah ada" | D-594 | **Met** | Rehearsal payload diff: only `/template` (+ `/docKey`) differs, per language. Production: a real Hermes agent wrote `datum-standar` with the standard `studio_write`/`studio_edit` tools (no new tool or field); the document is COMPLETE, rendered `SUCCEEDED` | Its first attempt was rejected (`CONTENT_INVALID`) and the cause is not logged (L-2). Not shown to be template-specific |
| U4 "sweep code agar reuseable dengan berbagai template kecuali memang harus ada fungsi yang benar2 berbeda" | D-595 | **Met** | The code in production is `5fd72c5`, the commit S38 reviewed (`verification/24:22`: U4 blocker check PASS, 0 blockers). The 10 templates in production are pure data rows (md5 = export of the single spec table) | None found |

## 10. Issues found

**High:** none.

**Medium**

- **M-1 AC-8 coverage clause not met.** Point coverage is 40.6 % in production and 39.3-46.9 % on all 10 pairs, against the 85 % in AC-8 and D-593. It is report-only only because of controller decision D-608. The USER has not been asked to accept this. Evidence: fresh score line `cakupan 40.6`; `verification/27`; D-608 (`decisions.md:614`).

**Low**

- **L-1 Render duration.** The production smoke PDF conversion took 7062 ms. Same-size documents took 3304-3628 ms on DEV and 2855 ms in the rehearsal (byte-identical DOCX), so about 2x-2.5x. This is one sample, and it was the first conversion of the new process. Hypothesis: a cold LibreOffice start and/or host load (4 gateways, USER pytest runs); not proven. No threshold is defined. The production document renders in the window were DOCX-only, so there is no second PDF sample.
- **L-2 Agent rejection cause not observable.** The `CONTENT_INVALID` / 14 x `SCHEMA_INVALID` on the live agent's first `datum-standar` write (23:52:29) is logged at `info` level with issue counts only. Production triage cannot tell agent error from template friction.
- **L-3 AC-4 "sesi Hermes nyata" not exercised for `latest` in production.** This is by design (D-612). The proof is the client constant, the unit test, `datum_gsp_active` and `OLD_MCP=0`. The live agent session used an explicit slug.
- **L-4 Rollback now affects live data.** A real agent document (`001/GSP/STD/XI/2026` on `datum-standar`) exists in production since 23:52. RB-1 would archive its template under it. Whether such documents can still be edited or rendered after RB-1 is not verified. RB-3 would delete it, together with every other write since 22:34.
- **L-5 Stale status lines in governing docs.** `identification/02_structured_datum_rev_a.md` front matter still says `status: needs-review (menunggu persetujuan USER lewat Plan Mode ...)`, although D-596 approved it. The runbook front matter (`deploy/05:10`) still says `needs-review ... nothing in it has been run against production`. Editing the runbook would change its anchored sha.
- **L-6 L4 review approval path.** `verification/25` asks for USER approval of its L4 verdicts through the controller. The final verdicts are PASS (§9, §10), and D-591/D-596 record the USER's autonomous authorization, but no USER acknowledgement of the security verdicts is recorded.
- **L-7 Secret-scan scope.** The scanner covers the 6 secret keys of the production `.env` only. Other credentials (for example Hermes `auth.json`, OAuth tokens in the DB) are outside its key set.
- **L-8 Runbook text has 3 known execution bugs.** R-X1 (step 2), R-X2 (step 7) and R-X3 (step 10, bash 5.3.15) were worked around with continuation scripts in `$BK/logs/`. The runbook text was not corrected, so a reuse of this runbook would hit them again (`deploy/06`, `deploy/07`).

## 11. Remediation notes (nothing was fixed by the verifier)

| Item | Proposed action | Owner |
|---|---|---|
| M-1 | Present the coverage shortfall to the USER plainly: accept D-608 as a recorded decision, or schedule the follow-up engine round from D-608/D-609 | controller -> USER |
| L-1 | Read the next production PDF render duration from `hq-r2.log` (`PDF_CONVERTED durationMs`). If it stays above about 2x DEV, investigate soffice start-up and host load | controller / coder-execution |
| L-2 | Consider logging the first issue code/path for `SCHEMA_INVALID` (no content) | next round |
| L-4 | Add a note to runbook section 14 that live documents now exist on the new templates (RB-1 effect on them; RB-3 data loss) | controller |
| L-5, L-8 | Refresh the status lines and fix R-X1..R-X3 in the runbook text in a new revision (new sha, delta review) if the runbook will be reused | controller |
| L-6 | Record the USER's acknowledgement of the security verdicts, or record that D-591 covers it | controller |

## 12. Open items for the USER

1. **Delete the production dump 14 days after this verification** (runbook section L, L39-6, D-617). That means `C:/Users/TRIAL/gsp-backups/datum-rev-a-20261104-2230/gsp_agent_hq_20261104-2230.dump`, and any `pre_rb3_*.dump` (none exist), **on or after 2026-11-19**. It holds personal data, OAuth tokens and password hashes. Until then, keep the volume encrypted. Record the deletion in `decisions.md`. Deleting it ends RB-3 as an option. The temporary workspaces `C:/Users/TRIAL/gsp-ws-gladi-*` may be removed at the same time.
2. **Retire the 9051 standby later.** The old build `3566486` still runs on `127.0.0.1:9051` (PID 27224) for RB-2 and reads the production DB. When the rollback window is closed, stop it. It is not started by any launcher, so it will not come back after a reboot.
3. **Point coverage 39.3-46.9 % (M-1).** Decide whether to accept D-608's report-only treatment or to schedule the follow-up engine round (control-sheet columns and verification chain, 150 mm title, control-sheet subtitle, seal logo, bilingual pairs, EN spelled-out amounts, a Rev A preset for GF-08).
4. **Live use has started.** `gsp-worker-fast` produced `001/GSP/STD/XI/2026` on `datum-standar` at 23:52. Rollback now affects real documents (L-4).
5. **Future MCP repoints must include a WebUI restart** (`deploy/07` observation): the WebUI caches its MCP config.

## 13. Next steps

- Controller: record S54 and its verdict in `decisions.md` and `status_tasks.md`; present M-1 (and L-6) to the USER; schedule the dump deletion reminder for 2026-11-19.
- No further production change is required for this release.
