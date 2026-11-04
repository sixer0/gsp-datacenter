---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: S51-S53 (phase C, runbook steps 12-13)
date: 2026-11-04
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/deploy/05_datum_rev_a_rollout_plan.md (sha256 5720b724186573ca591b411058c8961f5fb00b5d844c36bf620c077093eb8726, D-618)
authority: D-591 (autonomous), D-612 (one production smoke document), D-619 (GO), D-620..D-622 (phases A and B)
status: complete
---

# Execution log: DATUM Rev A rollout, phase C (steps 12-13)

No secret or `DATABASE_URL` appears in this log. All runbook logs are under `$BK/logs/`.

- `$BK` = `C:/Users/TRIAL/gsp-backups/datum-rev-a-20261104-2230` (run id `20261104-2230`)
- Runner: every shell defined `bk_open` exactly as extracted from the runbook (sed range `bk_open() {` .. `}`), ran it (`tools_ok: 28 files checked, 0 mismatches`; `secrets loaded=yes exported=none`), then called the runbook step functions.
- Runbook sha re-checked before the start: `5720b724...8726` (= D-618).
- S54 was **not** run. The controller dispatches the verifier.

## Pre-flight, read-only (23:24:55-23:25:30 WIB)

| Check | Result |
|---|---|
| `window_ok` | `window OK (Wed 23:24)` (not required by steps 12-13; recorded) |
| Gate tests (fresh, no side effects; `$BK/logs/gate_C_*.txt`) | `step12_smoke` 5 checks, `step13_skill` 6, `step13_archive` 2, `s54_secret_scan` 1: all `result=PASS` |
| Inventory `procs_C_start.txt` | `OLD_MCP=0 R2_MCP=5 REPO_MCP=0 UNKNOWN_MCP=0` |
| Listeners | 9011 PID 30144 (R2), 9051 PID 27224 (OLD standby, loopback), 9041 PID 31428, 9012 PID 32528 (WebUI) |
| Smoke 9011 (`smoke_C_start.txt`) | `SUMMARY fail 0`, S-5 n=17 |
| Production documents | `StudioDocument` 0 in total, 0 in the smoke mission |
| `datum_gsp_active` | ok |
| Skill sources | repo = R2 (`cmp`) for the 3 files: `SKILL.md` `f8245976f48c96e5`, `STUDIO-HOWTO-DOCUMENT.md` `174f74cf1cd37ad1`, `STUDIO-HOWTO-REPORT.md` `7c2b28aab864f268`; R2 `SKILL.md` line 19 `Status: TERPASANG (2026-11-04, ...)` (not DRAF) |
| `$BK/hermes_skill_before` | absent (as `skill_refresh.sh` requires) |

## Step 12. Production smoke: one document (S51, D-612) (23:25:51-23:26:10 WIB)

Command: `export RD_PAYLOAD_ID="$BK/gladi/payload/id.json"` (the D-607 ID gate payload, sha16 `9c607200108d09f4`, the same documented optional driver input as in phase A step 6), then `step12_smoke` unchanged. Console `$BK/logs/step12_console.txt`.

| Item | Result |
|---|---|
| `gate.old_mcp_zero` | ok (`procs_12_before.txt`) |
| `rd ... spec` | `{"schema":"datum-template-spec/v1","templates":10}`; `$BK/prod-smoke/spec.json` sha16 `27ea914b477bc958` (= rehearsal spec) |
| `rd ... write` (`RD_TARGETS=datum-nota`, R2 MCP `studio_write` against `https://localhost:9011`) | `isError=false`, document **`cmw2bw8460001v19c0j9jhgat`**, **`001/GSP/NOT/XI/2026`**, state `dibuat`, completeness `COMPLETE`, warning `FRONT_SLOTS_OMITTED` (same as the rehearsal write of datum-nota) |
| `rd ... render` | R08 valid (2 parts, no lint non-pass), render 200 `SUCCEEDED`, not partial; DOCX 453,750 bytes sha256 `4ac997bcc5b11831...` and PDF 55,401 bytes sha256 `16df26bc9a197f5c...`, each equal to the server sha and `x-studio-sha256-verified: true`; template `datum-nota` v1, NOT / NOTA / ID, revision 4 |
| `smoke.one_doc_rendered` | `CHECK_RENDER rows 1 fail 0` |
| `smoke.exactly_one_doc`, `smoke.doc_meta` | `001/GSP/NOT/XI/2026\|NOT\|NOTA\|ID\|f\|agent:hermes-datum-rollout` |
| `secrets.step12` | `secret_scan: keys=6 ... files=199 hits=0` |
| Result | `step12 production smoke: 1 document (datum-nota)`, rc 0 |

Independent verification of both files (PyMuPDF / zipfile, read-only, from the hermes venv):

- DOCX: the zip test passes (34 entries). `word/footer1.xml` and `word/footer2.xml` carry `001/GSP/NOT/XI/2026` and `TERBATAS`, and the headers carry `TERBATAS`.
- PDF: 2 pages, PDF 1.7, producer LibreOffice 24.2. The text contains `001/GSP/NOT/XI/2026` and `TERBATAS`. Each page has a one-line running head: `PT GEMILANG SATRIA PERKASA · KAJIAN DESAIN KEAMANAN SISTEM INFORMASI MANAJEMEN ASET… · BAB n. ...`, which ends on a whole word (G-2).
- Rehearsal comparison: the DOCX is byte-identical to the S45 `datum-nota` DOCX (`4ac997bc...`). The PDF text and the word boxes are identical to S45 on both pages. Only the PDF `creationDate` differs (23:26:08 against 22:39:14).

`latest` through the R2 client (read-only, no `latest` document written, D-612):

| Item | Result |
|---|---|
| Probe `$WORK/latest-probe/probe_latest_c.ts` (tsx from R2 imports `scripts/studio/mcp/write-client-run.ts`) | `{"latest":"datum-gsp","constant":"datum-gsp","passthrough":"datum-nota"}` (`$BK/logs/latest_probe_C.txt`) |
| `latest_unit_test` (R2 vitest S10) | `Tests 2 passed \| 30 skipped (32)` |
| `datum_gsp_active` | ok (datum-gsp present, not archived, not preset, no contract kind) |
| `old_mcp_zero` (`procs_12_after.txt`) | `OLD_MCP=0 R2_MCP=6 REPO_MCP=0 UNKNOWN_MCP=0` |
| Production documents by template (`prod_docs_by_template_12.txt`) | `datum-nota\|1` only: there is no `latest` / datum-gsp document |

Status: **complete**.

## Step 13.1. S52 production conformance (23:27:15-23:27:3x WIB)

Command: the runbook 13.1 block unchanged (clash.py `--docx` with LibreOffice conversion, work dir `$WORK/clash-work`, then score.ts with the full rule set, `--spec $BK/prod-smoke/spec.json`, the clone B-FIX `$BK/gladi/r2/bfix/datum-nota.docx` and the coverage JSON). Console `$BK/logs/s52_console.txt`. Report: `verification/28_datum_conformance_prod.md`.

| Item | Result |
|---|---|
| Preservation | The runbook writes `$WORK/clash/datum-nota.json`, the same path as the S45 clash report. That report was copied to `$WORK/clash/s45_datum-nota.json` before the run (copy only; recorded in `runbook.log`) |
| clash.py | `clash: 0 clashes on 2 pages` |
| score.ts | `datum-nota_ID: FAIL \| skor 90.9 % (30/33) \| kritis 4/4 \| cakupan 40.6 \| bentrok 0`; only reason `cakupan butir 40.6 % < 85 %` (coverage is reported, not a gate, D-608); rc 1 from that verdict |
| **D-608 gate** | score 90.9 % >= 85 %, 4/4 critical, 0 clashes: **PASS** |
| Failing rules | RH-03, RB-05, GF-13 (known engine deviations, as in S36/S45) |
| Supplementary (S45 method) | clash.py `--no-convert` on the server PDF: 0 clashes; score 90.9 % (30/33), 4/4, 0 clashes (`$BK/logs/s52_serverpdf_console.txt`) |
| Same as S45 | ordered outcomes of the 81 rules equal S45 for both production score reports |

Status: **complete**.

## Step 13.2. S53 Hermes skill refresh, out-of-app (23:28:01-23:28:13 WIB)

Commands: `oa_run ... realcheck.sh $BK 13_before_skill` (read-only real view, added to record the before state), then `step13_skill` unchanged. Consoles `$BK/logs/realcheck_13_before_skill.txt`, `$BK/logs/step13_skill_console.txt`; logs `skill_refresh.txt`, `realcheck_13_after_skill.txt`.

| Item | Result |
|---|---|
| Real view before (out-of-app) | installed `SKILL.md` `31a3d69624e9dcdf...`, `references/howto-document.md` `ee0456af86457ef4...`, `references/howto-report.md` `7c2b28aab864f268...` (the last one already = repo) |
| `skill.source_not_draft` | ok |
| `skill_refresh.sh` (spawn_out WMI, out-of-app) | `backup OK $BK/hermes_skill_before: references SKILL.md ... howto-document.md howto-report.md`; `SAME SKILL.md f8245976f48c96e5`, `SAME references/howto-document.md 174f74cf1cd37ad1`, `SAME references/howto-report.md 7c2b28aab864f268`; `done 2026-11-04 23:28:10` |
| Backup content | `$BK/hermes_skill_before/SKILL.md` `31a3d696...`, `references/howto-document.md` `ee0456af...`, `references/howto-report.md` `7c2b28aa...` (= the real view before) |
| Checks | `ok skill.three_same`, `ok skill.repo_eq_r2.SKILL.md`, `ok skill.repo_eq_r2.STUDIO-HOWTO-DOCUMENT.md`, `ok skill.repo_eq_r2.STUDIO-HOWTO-REPORT.md`, `ok skill.real_view_eq_repo` |
| Result | `step13 skill refreshed`, rc 0 |

sha256 comparison, out-of-app real view after the refresh against the repo source:

| Installed file (real view, `realcheck_13_after_skill.txt`) | Repo source | sha256 (both) | Equal |
|---|---|---|---|
| `skills/gsp/gsp-studio-write/SKILL.md` | `docs/hermes-skills/gsp-studio-write/SKILL.md` | `f8245976f48c96e50762d27a03eba9db6dc85bf7e4c42dec1432ef47ca778f6e` | yes |
| `skills/gsp/gsp-studio-write/references/howto-document.md` | `docs/STUDIO-HOWTO-DOCUMENT.md` | `174f74cf1cd37ad112afc729ca797ec8fee14886c0a537b6623efd99f95e1d9b` | yes |
| `skills/gsp/gsp-studio-write/references/howto-report.md` | `docs/STUDIO-HOWTO-REPORT.md` | `7c2b28aab864f26820b57ec5cc6f84f338800a3325ec87375b6289ad18b7f440` | yes |

The same real view shows the launchers and the Hermes configs unchanged since phase B (start.sh `4de2dd0e...`, watchdog `adf3b3e0...`, 5 profiles `r2_refs=3 old_refs=0` with the phase-B shas).

Status: **complete**.

## Step 13.3. Archive the smoke document (Q-D) (23:28:28-23:28:29 WIB)

Command: `step13_archive` unchanged (guarded `sql/archive_smoke_docs.sql`, `-v exp_docs=1`, one transaction). Console `$BK/logs/step13_archive_console.txt`; output `$BK/logs/prod_smoke_archive.txt`.

| Item | Result |
|---|---|
| `smoke.exactly_one_doc` | ok (1 document in the mission) |
| Guarded UPDATE | `db_guard OK: gsp_agent_hq`; mission, count (= 1) and creator guards passed; output row `001/GSP/NOT/XI/2026\|t\|agent:hermes-datum-rollout` |
| `smoke.archived` | ok |
| After (`prod_docs_13_after_archive.txt`) | `cmw2bw8460001v19c0j9jhgat\|001/GSP/NOT/XI/2026\|t\|agent:hermes-datum-rollout\|2026-11-04_datum-rev-a-prod-smoke` |
| Nothing deleted | `counts_all` before and after the archive are identical (`prod_counts_13_before_archive.txt` = `prod_counts_13_after_archive.txt`). Against step 11, only the rows of the one smoke document were added: StudioDocument 1, StudioRevision 4, StudioDocIdentity 10, StudioDocSection 12, StudioDocSubsection 5, StudioDocChapter 5, StudioDocBlock 14, StudioBlock 14, StudioRenderJob 2, StudioOutputFile 2 |

Status: **complete**.

## Secret scan (23:29:11 WIB)

| Scan | Result |
|---|---|
| `secrets.step12` (in step 12: `$BK/prod-smoke`, `$BK/logs`) | `keys=6 files=199 hits=0` |
| `s54_secret_scan` (runbook definition: `$BK/logs`, `$BK/prod-smoke`, `$BK/gladi`, `$BK/export`, `$ECO/hq-r2.log`, `$ECO/hq-r2-gladi.log`, `$ECO/hq-old-gladi.log`, `$ECO/hq-v21-standby-9051.log`) | `keys=6 (CRON_SECRET,DATABASE_URL,INTERNAL_API_SECRET,NEXTAUTH_SECRET,POSTGRES_URL,WEBUI_RBAC_TOKEN) files=327 hits=0`, `ok secrets.s54` (console `$BK/logs/s54_secret_scan_C_console.txt`) |
| This log, `verification/28` and `$WORK/latest-probe` (23:31 WIB) | `keys=6 files=3 hits=0`, `ok secrets.phase_c_docs` |

## End of phase C (23:29 WIB): production state

- 9011: R2 (`C:/Users/TRIAL/gsp-hq-prod-v21-r2`, tag `prod-v2.1-datum-rev-a-20261104` = `5fd72c5`), PID 30144; smoke `smoke_C_end.txt` `SUMMARY fail 0`, S-5 n=17; `request error` count in `$ECO/hq-r2.log`: 0.
- 9051: OLD rollback build (3566486), loopback, PID 27224 (kept for RB-2). 9041: PID 31428 (untouched). 9012: WebUI PID 32528.
- Templates: 17. The 7 old templates are identical to step 0 (`prod.old_templates_identical_end`). The 10 new templates are identical to the export (`prod.new10_eq_export_end`, = `prod_new10_11_after.txt`).
- Studio documents: 1, the archived smoke document `001/GSP/NOT/XI/2026` (production register number NOT 001/2026 used, F-6).
- `latest` = datum-gsp: shown by the R2 client probe, the unit test, `datum_gsp_active` and `OLD_MCP=0`.
- Inventory `procs_C_end.txt`: `OLD_MCP=0 R2_MCP=6 REPO_MCP=0 UNKNOWN_MCP=0`. 4 of the R2 trees belong to the gateways restarted in phase B (parents 22780, 33380, 1036, 34540). The 2 others are Hermes sessions that started at 23:23:31 (parent 33828) and 23:26:33 (parent 804). Both are `python.exe` processes, not this executor's driver, which closes its MCP child. They run r2 code, as intended.
- Launchers and the 5 Hermes configs point at R2 (unchanged since phase B). The installed skill equals the repo, and its old copy is in `$BK/hermes_skill_before/`.
- Anchors unchanged (`show_anchors`): `SHA256SUMS 4897ee44...a2aa3`, `export/SHA256SUMS d13be12c...158e`, `sql/SHA256SUMS_sql c0b20dda...9e65`.
- Rollback was not needed. RB-1/RB-2 are still available. To restore the skill if needed, copy `$BK/hermes_skill_before/` back inside a spawn_out script (runbook section 14).
- No USER process was stopped in phase C. No process was started except the out-of-app helper shells (`oa_run`) and the driver's own MCP child.

## Runbook bugs fixed at execution time

None. Steps 12 and 13 ran unchanged. The runbook file and the extracted tools were not edited (`bk_open` 28/0 in every shell). Additions, none of which changes a guard:

| Item | What | Why |
|---|---|---|
| A-1 | `RD_PAYLOAD_ID` exported for `step12_smoke` | documented optional driver input (`rd`); D-607 requires the ID gate payload; same as phase A step 6 |
| A-2 | `$WORK/clash/datum-nota.json` (S45) copied to `$WORK/clash/s45_datum-nota.json` before 13.1 | the runbook 13.1 output path equals the S45 path; this keeps the rehearsal evidence |
| A-3 | Supplementary S45-method clash and score on the server PDF (`--no-convert`), into separate paths | to compare with S45, which used `--no-convert`; both methods give 0 clashes |
| A-4 | `realcheck.sh ... 13_before_skill` before `step13_skill` | read-only real view of the before state of the installed skill |
| A-5 | Read-only `latest` probe and extra end checks (old templates, new10, smoke) | requested by the brief (confirm `latest` through the R2 client) and to record the end state |

## Open items for the controller

- S54 (verifier): AC-1..AC-12, the rollback artefacts, 30 minutes of `$ECO/hq-r2.log`, `s54_secret_scan`, section L.
- Retention (section L): the USER deletes `$BK/gsp_agent_hq_20261104-2230.dump` 14 days after S54 passes.
- Phase B observation still holds: a future MCP repoint must include a WebUI restart.
