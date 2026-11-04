---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: S39
date: 2026-11-04
agent: security-review
skills: security-review-gate
source_plan: docs/2026-10-22_doc_artifact_studio/identification/02_structured_datum_rev_a.md
status: needs-review (verdict CAUTION, L4: the controller presents it to the USER, G-SEC)
---

# S39 Security review: DATUM Rev A (rollout runbook, code changes, privacy)

## 1. Summary

**Overall verdict: CAUTION.** 0 High, 3 Medium, 8 Low, 1 Info.

| Area | Verdict | Findings |
|---|---|---|
| A. Rollout runbook `deploy/05_datum_rev_a_rollout_plan.md` (24 embedded files, steps 0-14, RB-0..RB-3) | **CAUTION** | M39-1, M39-2, M39-3; L39-1, L39-2, L39-3, L39-4, L39-7, L39-8 |
| B1. Seed guard (`seed-studio.ts`, `seed-studio-templates.ts`, `seed-doc-type-templates.ts`) | PASS | none |
| B2. MCP client (`scripts/studio/mcp/*`) | PASS | none (M16-2 and M16-3 are no worse) |
| B3. Scorer and clash checker reading untrusted DOCX/PDF | PASS (with a Low) | L39-5 |
| B4. D01 lint regexes (ReDoS) | PASS | none (measured linear) |
| B5. Text-table and renderer markup injection | PASS | Info I39-1 (existed before this round, no worse) |
| C. Data privacy (docs, verification reports, benchmark, `docs/STUDIO-*.md`) | PASS (with a Low on backups) | L39-6 |

- **Review level:** L4, full audit. This is a production deployment runbook, so the USER must approve the verdict through the controller.
- **GDPR non-compliances:** none in the code. One Low gap: the rollout's production dump has no retention rule (L39-6).
- **ISO 27001 control gaps:** A.12.1 change management (M39-2), A.12.1/A.12.3 operating procedure and backup gating (M39-1, M39-3), A.9 least privilege for secrets in process environments (L39-2).
- **Skipped dimensions:**
  - GDPR Art. 7, 15-17, 20, 30, 33 and 35, and the ISO 27701 PIMS roles: N/A. This round adds no new processing of personal data (no new PII fields, consumers or purposes). It only copies the existing production DB for backup and rehearsal, which is covered under Art. 5/32 (L39-6).
  - ISO A.16 incident management: N/A for this change. The runbook's stop rule and rollback ladder serve as the change-level incident path.
- **Reviewed baseline:** the runbook's sha256 is `7d6f662e7c8df28f6b30676ff3d98b4d46bf1bf4c691efdd486273c3ce56ffb5` (LF, 1385 lines). Independent re-extraction (hashing only, nothing written) found 24 embedded blocks, 24 table rows, 0 mismatches, and no `..` or absolute names. Any edit after this review changes this hash. Only the changed blocks need re-review (runbook line 605).
- **Decision D-612 is not reflected in the runbook yet.** The runbook (mtime 21:17:37) predates D-612 (decisions.md mtime 21:19:00). See M39-2.

## 2. Issues

| ID | Severity | Type | Location | Description | Remediation |
|---|---|---|---|---|---|
| M39-1 | Medium | CWE-754 (unchecked condition); ISO A.12.1.1 | Runbook :127, :130, :131-135 then :146-147; :418, :419 then :427; :516 then :517; :542, :543, :545 then :551 | Most STOP checks are `... \|\| echo "STOP ..."` or `&& echo "STOP ..."`. They print a message but do not stop the next command. If a block is pasted or run as one unit (likely when an agent runs it through one Bash call), then: (a) step 1 commits and tags even when a secret-like file is staged or a secret value appears in the staged diff (:130, :133, :135 only print); (b) step 11 runs the **production import** even when the hard gate `OLD_MCP=0` fails (:418) or the export/SQL sha check fails (:419); (c) RB-3 runs `pg_restore --clean` on production even when the dump sha check (:543) or the safety dump (:545) failed. Only step 8.2 (:351) chains its guard correctly. | Make every gate control flow. Wrap each step in a function and end every guard with `\|\| return 1`, for example `step11() { gate_old_mcp \|\| return 1; (cd "$BK/export" && sha256sum -c SHA256SUMS) \|\| return 1; ...; }`. Alternatively chain with `&&` as at :351. In step 1, make the staged-hit loop count hits and refuse `git commit` when the total is above 0. In RB-3, chain :543, :545 and a writer-quiescence check onto :551 (see M39-3). |
| M39-2 | Medium | ISO A.12.1.2 change management; A.14.2.2 | Runbook :22, :449, :456, :462, :480 (11 or 10 production documents); :101 (driver source `C:/tmp/s35`); :379, :568 and the embedded `oa/launcher_edit_r2.py` :1124-1133 (one anchor per file) | The runbook does not implement D-612. As written, step 12 creates 11 production smoke documents and burns 6 production register numbers (PT, LAP, VER, STD, NOT and KT 001, F-6) instead of D-612's single `datum-nota` document. The `check_render` count (11) and the archive count (`N`) follow the same default. The F-3 second-line edit that D-612 accepted is not in `launcher_edit_r2.py`. Step 0.4 still copies the driver from `C:/tmp/s35`, not the D-612 asset `C:/Users/TRIAL/gsp-backups/datum-rev-a-rollout-assets/driver.ts` (same sha `9bf43077...`, checked). | Update steps 12 and 13 to `RD_TARGETS=datum-nota`, `check_render ... 1`, and archive `exp_docs=1`. Add the comment-line anchor (start.sh line 120) to `launcher_edit_r2.py` and to the step-9 expectations. Point 0.4 at the gsp-backups asset. Regenerate the section-A sha rows and have the changed blocks re-reviewed (runbook :605). Record the new runbook sha256 in decisions.md. |
| M39-3 | Medium | Destructive-operation gating (gate check 2); CWE-754; ISO A.12.3 | Runbook :543-551 (RB-3) | RB-3 runs `pg_restore --clean --if-exists --single-transaction` on production. Its safeguards are weak. (1) The safety dump (:545) is not hard-chained to the restore, is not sha-recorded, and is not compared with the live table count. Its `"$BK"/pre_rb3_*.dump` glob matches several files on a second run, and `pg_restore --list` then fails. (2) Writer quiescence is not enforced. "stop the bridge" (:547) has no command, and the `pg_stat_activity` query (:549) is informational only, so a live writer can block the restore or write between the safety dump and the restore. (3) The dump sha check (:543) is not chained. Effect: an irreversible overwrite could proceed without a confirmed undo point. | Use one function. (a) Write the safety dump to a fixed name, `pre_rb3_$(date ...).dump`, captured in a variable. (b) Check its exit code, `pg_restore --list` count and sha256, and write them to `SHA256SUMS_rb3`. (c) Add an explicit bridge stop command and a loop that requires 0 other client sessions on `gsp_agent_hq` (optionally `REVOKE CONNECT` or `ALTER DATABASE ... ALLOW_CONNECTIONS false` for the window, restored afterwards). (d) Run `pg_restore` only when (a) to (c) succeed. Optionally rehearse RB-3 once on the clone in step 7.5. |
| L39-1 | Low | CWE-693 (weak guard); gate check 2 | Runbook :667-670 (`db_guard`), all `db_guard X X && <cmd> -d X` lines | `db_guard <db> <expected>` connects to `-d $1` and compares the result with `$2`. Both arguments are the same literal, and the next command names its own `-d`, so the guard is not bound to the command it protects. A typo in the command (`db_guard clone clone && psql -d gsp_agent_hq`) would not be caught. Writes are still protected where it matters: in-session `expect_db` checks (:965-969, :1059-1062, :1081-1083), `url_guard` bound to the same variable (:674-679), and the seed's `ALLOWED_DATABASES` (`seed-studio.ts:150`, `assertDatabase` :211-216, `assertTxDatabase` `seed-studio-templates.ts:345-348`). `pg_dump`, `pg_restore --clean` and `DROP DATABASE` rely on literal names only. | Replace with a wrapper that takes the DB once and runs the command, for example `on_db() { local db=$1; shift; db_guard "$db" "$db" && PGDATABASE="$db" "$@"; }`, and drop `-d` from the wrapped commands. |
| L39-2 | Low | CWE-526 / least privilege; ISO A.9.4 | Runbook env.sh :659-666; :166-168 (`npm ci`, `npm run build`, `npx tsc`); S35 driver `driver.ts:60` (`...process.env` to the MCP child) | `PROD_DB_URL`, `CLONE_DB_URL`, `PGPASSWORD`, `INTERNAL_API_SECRET` and `WEBUI_RBAC_TOKEN` are exported to every child of the runbook shell. That includes npm lifecycle (install) scripts of all dependencies during `npm ci` and the MCP child process, which needs only `INTERNAL_API_SECRET`. Nothing is printed and nothing is on a command line, so this is exposure, not a leak. `package.json` and the lockfile are unchanged since 3566486, which limits the risk. | Run step 2 in a clean environment, for example `env -u PGPASSWORD -u PROD_DB_URL -u CLONE_DB_URL -u INTERNAL_API_SECRET -u WEBUI_RBAC_TOKEN npm ci` (and the same for build and tsc). Export `PG*` only in the `psql`/`pg_*` wrappers (`PGPASSWORD=... psql` inside the function). Pass the MCP child an explicit env allow-list. |
| L39-3 | Low | Gate check 1 (credential leak verification) | Runbook :409, :458; S54 ":486" | The post-run secret scans cover only `INTERNAL_API_SECRET`. The DB password, `WEBUI_RBAC_TOKEN`, `NEXTAUTH_SECRET` and `CRON_SECRET` are not scanned in `$BK/logs`, the `$ECO/hq-*.log` files or `$BK/prod-smoke`. S54's "absence of secrets in `$BK`" has no command. | Reuse the step-1 loop (:131-135) as a `secret_scan <paths...>` helper covering all five names plus `PGPASSWORD`, and call it at steps 6, 10, 12 and S54. |
| L39-4 | Low | CWE-78 hardening (gate check 4) | Runbook env.sh :688-694 (`spawn_out`) | The filter (:691) refuses quotes, `$` and backticks, which is enough for the PowerShell single-quoted literal and the Win32 quoting. It still passes `; & \| < > ( ) \` and newline into `bash -lc`. Every current argument is a runbook constant (paths without spaces, profile names), so there is no exploit path today. The WMI `ReturnValue` is printed but not checked; `wait_log`/`wait_http` cover this indirectly. `-EncodedCommand` with `-NoProfile -NonInteractive` and no `-File` or `-ExecutionPolicy` is confirmed. The spawned process does not inherit the shell's secrets (WMI uses the user's default environment), which is good. | Change the filter to an allow-list (`[[ $cmd =~ ^[A-Za-z0-9_./:\ -]+$ ]] \|\| return 1`) and fail when `ReturnValue` is not 0. |
| L39-5 | Low | CWE-1333 (inefficient regex), DoS on untrusted input | `benchmark/datum_conformance/lib/xml.ts:45` (`ATTR_RE`), `parseAttrs` :47-55 | `ATTR_RE` scans each start offset of a tag's attribute text with `[^\s=/>]+` before failing on `=`, which is quadratic. Measured with the repo module: a 20k-character tag took 258 ms and an 80k-character tag took 4,097 ms (about n²). The part limit is 64 MB, so a crafted DOCX with a multi-megabyte tag hangs the scorer for hours. The impact is limited to the offline scorer CLI (S45/S52); the HQ server does not use it. The ZIP-bomb limits, DOCTYPE refusal and in-memory-only extraction are all correct. | Parse attributes with a linear hand scanner, or use a sticky regex (`y` flag) that skips whitespace manually. Also refuse tags longer than a bound such as 1 MB. Add a unit test: an 80k-character tag parses in under 50 ms. |
| L39-6 | Low | GDPR Art. 5(1)(e), Art. 32; ISO A.12.3.1, A.10.1 | Runbook :177 (dump), :190-191 / :313 (clone), :289-296 (export), `C:/Users/TRIAL/gsp-ws-gladi-*` (:61); `prisma/schema.prisma:37-40` (User name/email), `Account` token columns, :592 (`WebUiUser.passwordHash`) | The step-3 dump is a full copy of production, including personal data, OAuth tokens and password hashes. It is stored unencrypted under `C:/Users/TRIAL/gsp-backups` and kept with no retention or purge rule. The ACL is good: only the owner, SYSTEM and Administrators have access (icacls checked). The clone DB is dropped at :331, which is good. | Record a retention date for `$BK` dumps and CSVs in decisions.md (for example, delete after the rollback window closes, and log the deletion). Optionally encrypt the dump at rest (BitLocker volume or an encrypted archive) while it is kept. |
| L39-7 | Low | CWE-379 (temp dir in shared location); ISO A.14.2.5 | Runbook :101; `clash/clash.py:76` (`DEFAULT_WORK_DIR = "C:/tmp/dc_clash"`) | `C:\tmp` grants `NT AUTHORITY\Authenticated Users:(M)` (icacls), so any local account can modify `C:/tmp/s35/driver.ts` or plant files in the clash work dir. The driver tampering risk is closed by the sha pin (`derive_driver.mjs:851-852` refuses), so this fails closed. clash.py writes to a random uuid subfolder with fixed inner names. | Move both to a user-profile path, for example the gsp-backups asset (as in D-612) and `C:/Users/TRIAL/dc_clash`, keeping it short for soffice. |
| L39-8 | Low | Integrity anchoring; ISO A.12.1.2 | Runbook :605 (section A table in the same file), :296-297 vs :308-309 and :420 | The integrity anchors sit next to what they protect. The section-A sha table is in the same file as the blocks, and the export `SHA256SUMS` is in the export folder. `IMPORT_VARS.txt`, which the production import reads at :420, is written after `SHA256SUMS` (:296) and is not hashed. These checks catch accidental edits, not deliberate ones. The real backstop is the in-transaction fingerprint check, which compares the staging tables with `IMPORT_VARS`. | Record the runbook sha256 (this report, section 1) and the export `SHA256SUMS` digest in decisions.md, and check both before step 0 and step 11. Add `IMPORT_VARS.txt` to `SHA256SUMS` (create it before :296, or hash it separately). |
| I39-1 | Info | CWE-20 (text integrity, not markup) | `src/lib/studio/engine/front/texts.ts:325` (`.replace(/\{kelas\}/g, classificationMarkText(...))`) | `String.prototype.replace` treats `$&`, `` $` `` and `$'` in the replacement string as patterns. A classification such as `` A$`B `` would copy template text into the seal band. The output is still escaped (`escapeXml` in `docx/figures/ooxml.ts:32-34`; `esc`/`runsHtml` in HTML), so there is no injection. This behavior predates the round: HEAD `docx/wrapper/render.ts:325` had the same call. It is not raised as a finding. | Optional: use a replacer function, `.replace(/\{kelas\}/g, () => classificationMarkText(...))`. |

## 3. Gate results (security-review-gate, 5 checks)

| Check | Result | Details |
|---|---|---|
| 1. Credential leak | **PASS** | Exact-value scan of 648 files (all modified and untracked files, plus `docs/2026-10-22_doc_artifact_studio/**`, `benchmark/datum_conformance/**`, `docs/STUDIO-*.md`, `docs/hermes-skills/**`) against 12 real secret values from both `.env` files (DB URLs and passwords, `INTERNAL_API_SECRET`, `WEBUI_RBAC_TOKEN`, `NEXTAUTH_SECRET`, `CRON_SECRET`): **0 hits**. There are 2 `postgresql://user:pw@` strings, at `delegation_progress/coder_execution_fixsec.md:70` and `verification/04_final_verification.md:122`. Both have a 1-character password that does not match either real password, and both were tracked before this round. Test secrets in `tests/unit/studio/**/_env.ts` are fixtures (0 real-value hits). The 5 Hermes `config.yaml` files hold 0 secret values and 1 `${env:INTERNAL_API_SECRET}` reference each. The only email in the changed files is the attribution `noreply@anthropic.com` (runbook :144). The runbook design keeps secrets off command lines (`PG*` env vars, `-d <dbname>`, `grep -F -f <(printf ...)`, `url_guard` as a shell function, start-hq2 reads `.env` itself) and refuses `set -x` (:639). Residual items are L39-2 and L39-3. |
| 2. Destructive operation | **CAUTION** | Import (embedded `import_new10.sql.tpl` :955-1048): one transaction (`--single-transaction` plus `ON_ERROR_STOP`), in-session db_guard, `LOCK TABLE ... SHARE ROW EXCLUSIVE`, staging tables with `HEADER MATCH`, pre-checks (counts, md5, exactly 10 slugs, flags, no existing slug or id, closure, latest preset base, section types) and post-checks (counts, md5, total = before + 10). Any failure raises and rolls back. There is no DROP, TRUNCATE or DELETE; only `ON COMMIT DROP` temp tables. If run without `--single-transaction`, the `set_config(...,true)` settings disappear and the first `DO` block fails before any write (fails closed). The second run refuses (rehearsed at :324). RB-1 (:1052-1068) and the smoke archive (:1072-1090) use guarded `UPDATE` only (mission literal, count, `createdBy`, expect_db), with no delete. Launcher and Hermes edits are byte-exact, sha-pinned (launchers re-checked today: `3fc38f68...` and `d84a5d71...` match), backed up, refuse an existing backup, and verify before writing. CAUTION for M39-1 (advisory gates before the production import and commit) and M39-3 (RB-3 gating). Dry runs exist and are used (seed `--dry-run`, `--check` for both editors, step-7.5 import rehearsal on a fresh clone). |
| 3. External call | **PASS** | All HTTP calls go to allow-listed `https://localhost:9011`, `https://127.0.0.1:9031` and `https://127.0.0.1:9051` (`smoke_http.mjs` :751-752, derived driver allow-list :860). TLS is verified with `NODE_EXTRA_CA_CERTS` (no `rejectUnauthorized:false`). `curl -k` in `wait_http` sends no secret. There is no third-party destination and no `git push` (:152). |
| 4. Injection | **PASS** | SQL values reach the scripts as psql variables with `:'var'` quoting (:961-963, :1057, :1078-1080). `$IMPORT_VARS` comes from the sha-checked manifest (counts and hex). `sed` substitution uses `$BK` (no `#`, `&` or `'`). Every `spawn_out` argument is a runbook constant (hardening in L39-4). In code: the MCP `template` argument is schema-pinned to `^(latest\|[a-z0-9][a-z0-9-]{0,63})$` (`write-tools.ts:83`) and URL-encoded (`contract/env.ts:86-91`). clash.py calls soffice through an argv list with no shell and a fixed copied file name (`clash.py:684-687`). Renderer sinks escape every new label and classification text (`escapeXml` `docx/figures/ooxml.ts:34`; `escText`/`esc` `html/base/markup.ts:25-31`; seal band through `inlineHtml`). Regexes built from labels use constant tables only (`front/texts.ts:416-421`). |
| 5. Permission escalation | **PASS** | No ACL, role or permission rule changes. The Hermes edit repoints an existing `studio` MCP entry to a new checkout. No new server is added, the `${env:...}` reference is asserted unchanged (`hermes_repoint.py` :1234-1243), and `enabled`/toolsets stay pinned. `C:/Users/TRIAL/gsp-backups` is owner-only. |

**Overall gate: CAUTION** (check 2). By the L4 rule, the controller must get the USER's decision.

## 4. GDPR / ISO 27701 assessment

| Article / control | Status | Finding | Remediation |
|---|---|---|---|
| GDPR Art. 5(1)(c) minimization | OK | The export copies only the 10 templates' rows. Rehearsal documents are not exported (:285). | none |
| GDPR Art. 5(1)(e) storage limitation | PARTIAL | The production dump has no retention rule (L39-6). The clone is dropped (:331). | Retention date and deletion record |
| GDPR Art. 7, 15-17, 20 | N/A | No new personal-data processing or consumer this round | none |
| GDPR Art. 25 privacy by design | OK | Smoke documents carry only the agent id (`agent:hermes-datum-rollout`) and sample how-to content. D-612 reduces production smoke to one document. | none |
| GDPR Art. 30 records | N/A | No new processing activity | none |
| GDPR Art. 32 security of processing | PARTIAL | The dump is protected by an owner-only ACL but is not encrypted (L39-6). Secrets are kept out of logs (gate check 1). | Optional encryption at rest while kept |
| GDPR Art. 33 / 35 | N/A | No new high-risk processing | none |
| PII inventory | OK | Existing PII lives in `User` (`schema.prisma:37-40`), `Account` tokens and `WebUiUser.passwordHash` (:592). No new PII fields were added (no schema or migration change; runbook :38). New docs and benchmark files hold no personal data (only the attribution email). | none |
| ISO 27701 PIMS | N/A | No change to roles or controller/processor duties | none |
| ISO 27001 A.18.1.4 | OK | As above | none |

## 5. ISO 27001 Annex A mapping

| Control | Status | Finding | Remediation |
|---|---|---|---|
| A.9 access control | PARTIAL | Secrets are exported to all child processes, including npm install scripts (L39-2). HQ rehearsal instances are bound to loopback (`127.0.0.1`). | Scope the environment per command |
| A.10 cryptography | OK / PARTIAL | TLS 1.2+ on HQ with a pinned CA. The TLS key is copied owner-only to R2 (:162-165, git-ignored, checked). The dump is not encrypted (L39-6). | See L39-6 |
| A.12.1 operational procedures, change management | GAP | The runbook does not reflect D-612 (M39-2). STOP lines are advisory (M39-1). | Update, re-hash, re-review; make gates control flow |
| A.12.3 backup | PARTIAL | The step-3 dump is verified (list, sha, counts). The RB-3 safety dump is not verified or chained (M39-3). | See M39-3 |
| A.12.4 logging | OK | Every step logs to `$BK/logs` and `runbook.log`. Secrets are kept out of logs. Scan coverage is narrow (L39-3). | Widen the scan |
| A.12.6 technical vulnerability management | OK | No dependency change (package.json and lockfile unchanged). LibreOffice and pymupdf parse untrusted files in the offline tool only; keep them patched. | none |
| A.13 communications | OK | Loopback/localhost HTTPS with an allow-list. No external transfer. | none |
| A.14.2 secure development | OK / PARTIAL | Seed guard, CH-06 and frozen section types are in place. Untrusted-DOCX limits are in place, with one ReDoS (L39-5). Escaping is preserved. | L39-5 |
| A.16 incident management | N/A | The change-level stop rule and RB-0..RB-3 serve as the incident path | none |
| A.18 compliance | OK | Decisions and USER gates are recorded (D-591, D-612, G-SEC) | none |

## 6. Remediation priorities

1. **Before step 1 (S41), because the commit gate depends on it:** fix M39-1 for step 1 at least, so that a staged secret or a DRAF `SKILL.md` refuses the commit.
2. **Before any production change (step 8):**
   - M39-2: implement D-612, regenerate the section-A rows, re-review the changed blocks, and record the new runbook sha.
   - M39-1 for step 11: hard-gate `OLD_MCP=0` and the sha checks before the import.
   - M39-3: RB-3 gating, which must be in place before RB-3 could be needed (from step 8 on).
3. **Before the runbook runs (cheap hardening):** L39-1 (`on_db` wrapper), L39-2 (scoped environment for `npm ci` and the MCP child), L39-3 (wider secret scan), L39-4 (spawn_out allow-list), L39-7 (no `C:\tmp`), L39-8 (anchor the hashes in decisions.md).
4. **Before or with S45/S52 (scorer runs):** L39-5 (linear attribute parser), or confirm that the scorer only reads engine-produced DOCX.
5. **Close after the rollback window:** L39-6 (retention and deletion of the dump, CSVs and gladi workspaces).

Code areas B1-B5 need no change before production.

## 7. Evidence (commands run, all read-only)

- `git rev-parse --short HEAD`: 3566486, branch v2.1. `git status --short` and `git diff HEAD --stat`: 52 files changed, plus untracked files.
- Section-A integrity: the step-0.2 regexes, run with hashing only (`python -I`), found 24 blocks, 24 rows, 0 mismatches. Runbook sha256 is `7d6f662e...ffb5`.
- D-612 drift: file mtimes (runbook 21:17:37, decisions 21:19:00). Grepping the runbook for a one-document smoke run finds nothing. Driver assets `C:/tmp/s35/driver.ts` and `gsp-backups/datum-rev-a-rollout-assets/driver.ts` both have sha `9bf43077...`.
- Launchers: `sha256sum` gives `3fc38f68...` and `d84a5d71...`, equal to the pins. Hermes configs: 3 old-checkout references and 0 secret values per profile (counts only).
- Seed guard: `ALLOWED_DATABASES` is identical at HEAD (:124) and in the working tree (:150). `assertDatabase` is called before any write (:1259). The runner calls `assertTxDatabase` in the transaction. `freezeSectionTypes: true` (`seed-doc-type-templates.ts:198`, guard `seed-studio-templates.ts:419`). CH-06 runs for every spec (`seed-studio-templates.ts:265-268`).
- MCP: `resolveTemplate` returns the constant `datum-gsp` (`write-client-run.ts`, D-590). New warnings embed only `tok()`-filtered tokens (`SAFE_TOKEN` `tool-kit.ts:358`). No new echo of another writer's text, so M16-2 and M16-3 are unchanged.
- ReDoS timing: `npx tsx` against the repo modules (`structuralNumberSpans`, `bindNumberPatternSource` ID/EN, `parseXml`) with adversarial inputs of 5k, 20k and 80k characters. The D01 and number patterns took 0.0-1.6 ms at every size. `parseXml` attributes took 15 ms, 258 ms and 4,097 ms.
- Scorer/clash: fflate `unzipSync` filter with declared-size limits and a post-check (`lib/docx.ts:172-199`). DOCTYPE is refused (`lib/xml.ts:83-85`). clash.py uses bounded stream reads, refuses DTD/ENTITY including UTF-16 (`clash.py:279-323`), and calls soffice through an argv list with a timeout and tree kill (`:672-702`).
- ACLs: `icacls C:\tmp` (Authenticated Users: M) and `icacls C:\Users\TRIAL\gsp-backups` (owner, SYSTEM, Administrators).
- Privacy: email, phone, 16-digit and secret-assignment pattern scans of the changed files (redacted output). The exact-value scan is in gate check 1.

## 8. Security review log

| # | Timestamp (WIB) | Scope | Level | Result | Decision | Reviewer |
|---|---|---|---|---|---|---|
| 1 | 2026-11-04 ~21:30-22:15 | Runbook `deploy/05` (sha `7d6f662e...`), 24 embedded files, steps 0-14, RB-0..RB-3 | L4 | CAUTION (M39-1, M39-2, M39-3; Lows) | Pending USER decision through the controller (fix / accept the recorded risk / change scope) | security-review agent |
| 2 | 2026-11-04 | Code: seed guard, MCP client, scorer/clash, D01 regexes, renderers | L3 | PASS (L39-5 Low, I39-1 Info) | none needed | security-review agent |
| 3 | 2026-11-04 | Privacy and secrets in docs, benchmark and `docs/STUDIO-*.md` | L2 | PASS (L39-6 Low on backups) | none needed | security-review agent |

No secret value was printed, logged or written during this review. The runbook was not run, and no database was touched (only read-only `git`, `sha256sum`, `grep` and `icacls`, plus in-process regex timing in the scratchpad).

---

## 9. Re-review (runbook sha 87da5dea...)

- **Date:** 2026-11-04, about 22:30-23:30 WIB.
- **Reviewer:** security-review agent (security-review-gate). **Level:** L4.
- **Scope:** runbook `deploy/05_datum_rev_a_rollout_plan.md`, sha256 `87da5dea580b56eb914f2ba5dc85c82c9886cb9fab6624d9a4d75d08da316e7e` (1912 lines, LF; recorded in D-615); the code fixes for L39-5 and I39-1; the new running-head width fit (`front/running-head-fit.ts`, `docx/package/header-footer.ts`).
- **Nothing was run against production.** No DB writes, no process starts or stops, no launcher or Hermes edits. The gate tests and my own fault-injection harness ran in an isolated scratchpad sandbox (`env -i`, sandbox root outside `$BK`).

### 9.1 Overall verdict: **PASS** (0 High, 0 Medium, 4 Low, 6 Info)

All 3 Medium and all 8 Low findings from the first review are closed, and so is I39-1. The new issues are Low or Info and are listed in 9.4. Because this is an L4 review, the USER's approval is still required through the controller, whatever the verdict (security-review-gate rule).

### 9.2 Per-finding status

| ID | Status | Evidence |
|---|---|---|
| M39-1 | **CLOSED** | Every step is a function in `tools/steps.sh` (runbook :516-1022). Every check is `chk ... \|\| return 1` and every changing command is `... \|\| return 1`. **(1) I ran the embedded `tools/gate_tests.sh` myself** for all 25 steps plus `gw_one`: 26 of 26 `result=PASS`, 167 checks, each forced failure leaving no later command. **(2) My own command-level harness** went further than the shipped one: it forced each recorded *command* (not only `chk`) to fail in turn, in all 24 changing steps. Every failure either returns 1 at once or feeds a `chk` whose real predicate then fails on the empty result. The only extra recorded action after a failure is a diagnostic `cat` of a log before `return 1`. In the control runs, the step-1 `git commit`, the step-11 production import (:895) and the RB-3 `pg_restore --clean` (:1009) run only after all their gates. Two harmless gaps are noted as I-R1. |
| M39-2 | **CLOSED** | D-612 is implemented. Production smoke is `RD_TARGETS=datum-nota` (:914-915). `check_render ... 1` (:916), exactly one row with `NOT\|NOTA\|ID\|f\|agent:hermes-datum-rollout` (:918-919), archived with `exp_docs=1` (:942). The derived driver refuses any other target list and any B-FIX on 9011 (:1352-1363). The F-3 comment anchor is in `launcher_edit_r2.py` (:1630-1633); a read-only byte count on the live `gsp-ecosystem-start.sh` (sha `3fc38f68...` still matches) finds each anchor exactly once. The driver is copied from `gsp-backups/datum-rev-a-rollout-assets/driver.ts` (:582-585, sha pin `derive_driver.mjs:1337`). |
| M39-3 | **CLOSED** (residual Low R-L2) | `rb3_restore` (:990-1013) chains, in order: window check; dump sha and anchor; safety dump to a unique `pre_rb3_<YYYYMMDD-HHMMSS>.dump` (absent check, no glob); `pg_dump` exit code; `pg_restore --list` table count equal to the live count; `SHA256SUMS_rb3_<stamp>` written and verified, then anchored; `stop_listener` 9011, 9051 and 9041; `stop_bridge`; `no_other_sessions` returning 0; only then the restore; counts equal to the dump afterwards. The same restore command is rehearsed on the clone (:789). **9041:** the deploy-04 log (:147, :164) shows the standby was started from `C:\Users\TRIAL\gsp-datacenter` on loopback against the production DB (the `.env` names `gsp_agent_hq`). Stopping it is therefore necessary, and `rb3_restart` (:1019) restarts it exactly as it was started. **Bridge:** the `bridge_pids` regex (:466) matches exactly one live process today (PID 22680, `node.exe" bridge.mjs`; parent `nohup` 17248). |
| L39-1 | **CLOSED** | Database names exist once (`PROD_DB`, `CLONE_DB`, `MAINT_DB`, :388-390). `on_db` / `psql_ro` / `restore_into` take the name once and set `PGDATABASE` or `-d` from the same variable (:424-442). No step carries its own `-d` literal. |
| L39-2 | **CLOSED** | Credentials and tokens sit in non-exported variables (`_PGPW`, `_SECRET`, `_RBAC`, `_URL_BASE`). Inherited secret names are unexported and unset (:412-414). Secrets reach a process only as a per-command prefix: `pgx` (:418-420), `db_url` in `DATABASE_URL="$(db_url ...)"` (:556, :560), `smoke` and `rd` (:503-510). I checked that `pgx`/`on_db` only ever wrap external binaries (`psql`, `pg_dump`, `pg_restore`), never a shell function, so bash cannot export the prefix further down. `no_secret_env` is checked right before `npm ci` (:634). The MCP child gets `getDefaultEnvironment()` plus `NODE_EXTRA_CA_CERTS` and `INTERNAL_API_SECRET` only (:1364-1369). If an `allexport` (`set -a`) profile were active, `no_secret_env` would catch it (it checks the `_PGPW`/`_SECRET` names too) and step 0 and step 2 would stop. |
| L39-3 | **CLOSED** | `tools/secret_scan.py` (:1087-1174) builds its search list from every secret-named key of the production `.env`, plus URL passwords, and prints names and counts only. My run over the task docs, benchmark, Hermes skills and the 28 extracted files found keys=6, files=601, **hits=0**. A positive control (DATABASE_URL piped on stdin) gave HIT and exit 1, with no value printed. It is used at steps 1, 6, 10 and 12 and in S54. |
| L39-4 | **CLOSED** | `spawn_out` (:493-502) uses the allow-list `^[A-Za-z0-9_./:= -]+$`, which excludes quotes, `$`, backtick, backslash, `;&\|<>()*?[]~%` and newline, so nothing can break out of the PowerShell literal, the Win32 quoting or `bash -lc`. It requires `ReturnValue=0 ProcessId=<n>` and still has no `-File` and no execution-policy flag. Every current caller's argument fits the allow-list. |
| L39-5 | **CLOSED** | `benchmark/datum_conformance/lib/xml.ts:44-82` is a sticky-regex scanner that jumps past a failed name. Measured with the repo module: an 80k-character tag now takes 1.2 ms (was 4,097 ms); 8M characters take 26-228 ms across hostile shapes (long name, name and space, `x = ` without a quote, slash runs; unclosed quotes are rejected by the tag scanner). Attribute output is unchanged (`a`, `b` with entity decoding, `c` with spaces round `=`, `bad` skipped, `d`). Test: `tests/unit/studio/datum-conformance/xml.test.ts`. |
| L39-6 | **CLOSED (procedural)** | Section L (:300-306) states the data sensitivity. `backup_acl_ok` (:544) refuses Everyone, Authenticated Users and Users in steps 0 and 3. The retention rule (delete 14 days after S54 and the end of the rollback window, and record it in decisions.md) is a USER action and is not automated, so the controller should track it as an open item. |
| L39-7 | **CLOSED** (runbook) | No `C:\tmp` path remains in the runbook. clash.py gets `--work-dir "$WORK/clash-work"` (:238), and the gate-test sandboxes go under `$WORK`. The code default `clash.py:76` (`C:/tmp/dc_clash`) is unchanged but overridden here (I-R6). |
| L39-8 | **CLOSED** (residual Low R-L3) | `runbook_recorded` (:543) requires the runbook sha in decisions.md (D-615 has `87da5dea...`, checked). Dump, export and SQL digests go to `$BK/logs/anchors.txt` and `runbook.log` and are re-checked at steps 7 and 11 and in RB-3. `IMPORT_VARS.txt` is inside `export/SHA256SUMS` (:756), and its shape is checked (:755). |
| I39-1 | **CLOSED** | `src/lib/studio/engine/front/texts.ts:325-327` uses a replacer function (`() => kelas`), so `$&` and `$'` patterns are no longer expanded. Test: `tests/unit/studio/renderers/i39-seal-band-literal.test.ts`. |

### 9.3 New code since the first review

| Area | Verdict | Evidence |
|---|---|---|
| Running-head width fit (`front/running-head-fit.ts`, 74 lines, new; `docx/package/header-footer.ts`) | **PASS** | Pure string transform on plain text, done **before** escaping. The result goes out as `{ t }` runs through `hfRunsXml` and then `textEl`/`textXml`, which call `escapeXml` (`docx/package/xml.ts:357-366`, `:380`). The classification is measured, never cut, and passed through `classificationMarkText`. Termination is guaranteed: a finite segment list, each step shortens or drops one segment, and `ellipsize` is a binary search (`chart/core/textfit.ts:205-219`). A negative width only drops segments. No regex is built from input. `TRAILING_SEPARATORS` is a single anchored character class (linear). No HTML sink uses it yet. |
| Files changed since the first review (mtime) | as expected | `header-footer.ts`, `running-head-fit.ts`, `texts.ts`, `lib/xml.ts`, and 3 tests. Nothing else in `src`, `benchmark`, `prisma`, `scripts` or `tests` changed. |

### 9.4 New or remaining findings

| ID | Severity | Type | Location | Description | Remediation |
|---|---|---|---|---|---|
| R-L1 | Low | CWE-367 (stale-state race); ISO A.12.1.1 | `wait_log` :479-484; callers :832-840, :850-854, :863-865, :875-877, :929-935, :972-976, :985-986; log names fixed in `oa/*.sh` | `spawn_out` returns as soon as WMI creates the process, and `wait_log` checks the log at once. When a step is **re-run**, it can read the completed log of the previous run (same fixed name, before the new script truncates it) and pass `Gateway started`, `STUDIO_E2E ok=true`, `edited ...` or a stale real view. A first run is not affected. The data gates are not affected either: `OLD_MCP=0` is re-inventoried fresh (`old_mcp_zero` runs `procs`), and the DB predicates query live. | Before each `spawn_out`, move any existing log aside (for example `mv "$L" "$L.prev-$(date +%H%M%S)"`, nothing deleted). Or pass a nonce argument that the script writes as its first line and that `wait_log` requires. |
| R-L2 | Low | Destructive-operation ordering (gate check 2) | `rb3_restore` :992, :997-1007 | (a) The safety dump is taken **before** the writers are stopped. Anything written in the seconds between the dump and `stop_listener`/`stop_bridge` is in neither dump, so RB-3 cannot be fully undone for those rows. (b) `window_ok` is checked only at the start. A long run (the safety dump plus up to 60 s of `no_other_sessions`) can cross into the watchdog window. The result fails closed (`no_other_sessions` stops with HQ down, then `rb3_restart`) but adds downtime. | Reorder: `window_ok`, stop 9011/9051/9041 and the bridge, `no_other_sessions`, safety dump and verification, restore. Re-check `window_ok` right before the writers are stopped. |
| R-L3 | Low | Integrity anchoring; ISO A.12.1.2 | `anchors_ok` :552, `anchors.dump` :994; appends at :650, :758, :1002; section 1 "How to run" :56 | (a) `anchors.txt` is append-only, and the checks accept **any** line ever recorded for a key. After a re-run of step 3 or step 7, an earlier export or dump still passes. (b) The anchors and the extracted `$BK/tools`/`oa` scripts live in the same owner-only `$BK` tree. Each new shell re-sources `$BK/tools/*.sh` without re-checking them against the section-A table. The risk is limited to the same user, given the owner-only ACL. | Compare with the **last** line per key (`grep "^export/SHA256SUMS " anchors.txt \| tail -1`). Have the controller copy each new `anchors.txt` line into decisions.md at steps 3 and 7. Add a `tools_ok` check that re-hashes `$BK/tools/*` and `$BK/oa/*` against the runbook's section-A table before sourcing. |
| R-L4 | Low | Gate robustness (F-2 hard gate) | `tools/procs_studio.sh` :1190-1191 | `OLD_MCP` counts only processes whose command line holds `tsx\dist\cli.mjs` **and** the backslash path `gsp-hq-prod-v21\scripts\studio\mcp\server.ts`. Live check today: correct. There are 6 old servers, each a `cli.mjs` launcher with a loader child: gateways gsp-worker, gsp-master01, gsp-worker-fast and gsp-thinker, plus **2 Hermes sessions that aren't gateways** (parents `python.exe`/`pythonw.exe`). An old server started any other way (forward-slash path, `node --import tsx`, npx) would not be counted, and the hard gate would pass while old `latest` code runs. | Count every `node.exe` whose command line matches `gsp-hq-prod-v21[\\/]scripts[\\/]studio[\\/]mcp[\\/]server\.ts` case-insensitively (excluding `-r2`). Also stop if any `studio\mcp\server.ts` comes from an unrecognized root. |
| I-R1 | Info | Check that passes on an empty result | `step2_build` :626, :632 | `r2.status_clean` passes if `git status` itself fails (empty equals empty). `r2.head_is_tag` passes if both `rev-parse` calls fail. Both are sanity checks on a fresh clone; the `.env`/certs ignore check follows. | `out=$(git -C "$R2" status --short) \|\| return 1` before the `eq`; the same for the two `rev-parse` calls. |
| I-R2 | Info | Operational state | process inventory (read-only) | Today `OLD_MCP=6`, not the 4 in section 0 or the 5 in D-615. Two old-checkout MCP servers belong to Hermes sessions that aren't gateways, so `step10_gate` and `step11_import` will (correctly) refuse until those sessions end. Do not kill USER processes (D-615). | Controller: schedule step 10 once those sessions have finished. |
| I-R3 | Info | Documentation accuracy | :114; :1897 | Step 0 expects "24 extraction lines OK"; there are 28. Section S says "every embedded block changed". In fact 19 of the 24 previously reviewed blocks are byte-identical (same sha256: the SQL files, `smoke_http.mjs`, `check_render.mjs`, `start-hq2.sh`, `hermes_*`, `gw_restart2.sh`, `mcp_e2e2.sh`, `skill_refresh.sh`, `launcher_edit_r2.sh`, `launcher_restore.sh`). 5 changed (`env.sh`, `procs_studio.sh`, `derive_driver.mjs`, `launcher_edit_r2.py`, `realcheck.sh`) and 4 are new. All 28 were reviewed here. | Correct the two lines at the next edit (this changes the runbook sha, so re-record it). |
| I-R4 | Info | Leftover reference | `gsp-ecosystem-start.sh:119` (live file) | Comment line 119 ("HQ produksi = checkout gsp-hq-prod-v21.") stays after step 9. The `launcher.no_old_path_left` pattern `gsp-hq-prod-v21[\\/"]` skips it. Documentation only. | Optional third anchor. |
| I-R5 | Info | Process-match breadth | `bridge_pids` :466 | Matches any `node.exe bridge.mjs`, whatever its folder, because a read-only listing cannot see the working directory. It matches exactly one process today, and the PID is logged before the kill. | Optionally compare the PID with section 0, or the parent with `nohup.exe node bridge.mjs`. |
| I-R6 | Info | Code default | `benchmark/datum_conformance/clash/clash.py:76` | The default `--work-dir` is still `C:/tmp/dc_clash`. The runbook always passes `$WORK/clash-work`. | Change the default to a user-profile path when the code is next touched. |

### 9.5 Gate results (re-review)

| Check | Result | Details |
|---|---|---|
| 1. Credential leak | PASS | 0 secret hits (601 files). Secrets are non-exported and passed per command. Scans run at 5 points. |
| 2. Destructive operation | PASS | Import, RB-1 and the smoke archive are unchanged (same sha as reviewed). Every gate is now control flow (tested). RB-3 is hard-gated and rehearsed. Residual R-L2 is Low. Dry runs and rehearsals exist (seed `--dry-run`, `--check` for both editors, step-7 import and RB-3 rehearsal on a fresh clone). |
| 3. External call | PASS | Unchanged: allow-listed localhost/loopback HTTPS with TLS verification. |
| 4. Injection | PASS | `spawn_out` allow-list. SQL interpolation only of constants (`$CLONE_DB`, `$SMOKE_MISSION`, `$SLUGS_SQL`) and `:'var'` psql variables. Renderer output escaped (9.3). |
| 5. Permission escalation | PASS | No ACL or permission change. The Hermes repoint script is unchanged (sha `ba5142e6...`). |

### 9.6 Commands run (all read-only for production)

- `sha256sum` of the runbook gives `87da5dea...` (it matches). The extractor regexes found 28 blocks and 28 rows with 0 mismatches and no traversal. Files were extracted to an empty scratchpad folder, and `bash -n` passed on every `.sh`.
- `env -i ... GATE_SANDBOX_ROOT=<scratch> bash tools/gate_tests.sh <step>` for the 25 steps and `gw_one gsp-worker 10`: 26 x `result=PASS`, 167 checks.
- My own command-failure harness (`cmd_mut.sh`, scratchpad) over 24 steps; results as in 9.2 M39-1.
- `Get-CimInstance Win32_Process` (read-only): MCP/bridge/HQ inventory and parent profiles.
- deploy-04 log grep for 9041. The DB name in the gsp-datacenter `.env` was printed as a name only.
- Read-only byte counts of the launcher anchors.
- `secret_scan.py` over the docs (0 hits) and a stdin positive control (HIT, exit 1).
- `npx tsx` timing of `parseXml` (L39-5).
- Note: one harmless temporary file was written to the Git Bash `/tmp` (a file list, `now_list`); it holds no secrets.

### 9.7 Security review log (continued)

| # | Timestamp (WIB) | Scope | Level | Result | Decision | Reviewer |
|---|---|---|---|---|---|---|
| 4 | 2026-11-04 ~22:30-23:30 | Runbook re-review, sha `87da5dea...` (28 embedded files, 26 step functions) | L4 | PASS (R-L1..R-L4 Low; I-R1..I-R6 Info) | L4: needs the USER's approval through the controller; Lows recommended before execution, not blocking | security-review agent |
| 5 | 2026-11-04 | Code: L39-5 fix, I39-1 fix, running-head fit | L3 | PASS | none needed | security-review agent |

No secret value was printed, logged or written during the re-review.

---

## 10. Delta check (sha 5720b724...)

- **Date:** 2026-11-04, about 22:20-22:40 WIB. **Reviewer:** security-review agent. **Level:** L4. **Scope:** the delta only.
- **Runbook:** sha256 `5720b724186573ca591b411058c8961f5fb00b5d844c36bf620c077093eb8726`, 1987 lines, recorded in D-618.
- **Nothing was run against production.** No DB access, no process start or stop, no launcher or Hermes edit.

**Verdict: PASS.** 0 High, 0 Medium, 0 new Low. Every R-L and I-R item is closed or deliberately left as Info, and the changes introduce nothing new.

**Delta confirmed.** The 28 embedded blocks match the section-A table (0 mismatches, no path traversal, `bash -n` clean). Diffing against the 87da5dea extraction, exactly 12 blocks changed, the set the coordinator listed: `env.sh`, `steps.sh`, `gate_tests.sh`, `procs_studio.sh`, and 8 out-of-app scripts. Prose changes: step 0.3 (`bk_open`), section 1, section 14 and section R.

| Item | Status | Evidence |
|---|---|---|
| R-L1 stale log | **CLOSED** | `oa_run` (env.sh) moves any existing log to `<log>.prev-<timestamp>-<random>` with `mv \|\| return 1`, so nothing is deleted and a failed move stops the step. It passes a fresh run ID (`r<YYYYMMDDHHMMSS><random>`, inside the `spawn_out` allow-list). `wait_log` accepts only a log whose first line is exactly `run=<id>`. All 8 log-writing scripts write that line first and read the ID from the right argument position; I checked each caller's argument count. No `spawn_out` + `wait_log` pair is left. The remaining `spawn_out` calls start HQ and are gated by `wait_http`. **Unit test** (sandbox, fake `spawn_out` writing the log after 2 s): a stale `exit=0` log was moved aside and not accepted (rc 0 only after the new run's log, `.prev` kept); a failing new run gave rc 1 with both earlier logs preserved; a log carrying another run's ID gave rc 1 on timeout. |
| R-L2 RB-3 order | **CLOSED** | Control record of `rb3_restore`: `window.ok`, `dump.sha`, `anchors.dump`, `safety.name_unique`, `window.ok_before_stop`, stop 9011, 9051, 9041 and the bridge, `db.no_other_sessions`, safety `pg_dump`, `--list`, count check, sha written and verified, `safety.anchored`, `db.no_other_sessions_before_restore`, restore, counts. The safety dump now captures the quiesced database. |
| R-L3 anchors and re-sourcing | **CLOSED** | `anchor_is` compares with the **last** line per key. The key match is `^<key> ` with a trailing space, so `SHA256SUMS` cannot match `SHA256SUMS_rb3_*`. It is used for the dump, the export and SQL manifests, and the safety dump. `bk_open` (step 0.3) checks the runbook sha in decisions.md (D-618 contains it), then re-hashes every section-A file under `$BK` before sourcing. I tested the exact runbook snippet (`grep -F` found it byte-identical, 1 hit): 28 files, 0 mismatches, rc 0 on the clean extraction; one appended line in `oa/gw_restart2.sh` gave `1 mismatches oa/gw_restart2.sh`, rc 1. `show_anchors` prints the digests for the controller to copy into decisions.md. That copy is a manual step (Info D-1). |
| R-L4 MCP matcher | **CLOSED** | `procs_studio.sh` (static `-EncodedCommand`, read-only CIM) classifies every `node.exe` matching `(?i)studio[\\/]+mcp[\\/]+server\.ts` as OLD, R2, REPO or UNKNOWN, counting one per process tree. The gate now requires `OLD_MCP=0` **and** `UNKNOWN_MCP=0`, and an inventory failure prints `OLD_MCP=?`, so the gate fails closed. A live read-only run gave `OLD_MCP=6 R2_MCP=0 REPO_MCP=0 UNKNOWN_MCP=0`: 12 MCP processes, 6 roots (5 with `python.exe` parents, 1 `pythonw.exe`) and 6 loader children not counted. That matches my independent count in section 9. REPO is allowed through the gate on purpose, because the dev checkout carries the new `latest` constant. |
| I-R1 | **CLOSED** | `git config`, both `rev-parse` calls and `git status` are captured with `\|\| return 1` before the comparison. My command-failure harness now shows those failures stopping step 2. |
| I-R3 | **CLOSED** | Step 0 expects 28 extraction lines, and section S wording is corrected. |
| I-R4 | Left (Info) | Comment line 119 left as is and documented. It names no runnable path. |
| I-R5 | **CLOSED** | `bridge_pids` also requires `ExecutablePath = C:\Program Files\nodejs\node.exe`. `stop_bridge` logs the parent's command line; the PID is numeric from CIM. |
| I-R2, I-R6 | Unchanged (Info) | Operational: steps 10 and 11 wait until the 2 non-gateway old MCP servers end (still 6 old servers live). The `clash.py` default is code outside the runbook, which always passes `--work-dir`. |

**Gate tests and fault injection (sandbox, `env -i`, scratchpad root):**
- `tools/gate_tests.sh` gave 26 of 26 functions `result=PASS`, 170 checks (matching D-618; `rb3_restore` now has 10 checks).
- My command-failure harness, with `oa_run` and `show_anchors` stubbed too, covered the 10 changed steps. Every forced command failure either stops the step or feeds a failing check. The only exceptions are non-gating ones: `show_anchors` (print only), `hermes gateway list` (informational), the `sed` feeding the `ge` check, and the existing diagnostic `cat` before `return 1`.

**Info (no action required before execution):**
- **D-1:** the anchor copy into decisions.md after steps 3 and 7 and RB-3 is a controller action, not automated.
- **D-2:** the derived `$BK/tools/rollout_driver.ts` is not in the section-A set that `bk_open` re-hashes. It is checked once at `step0_driver` (`DRIVER_SHA`). Same-user exposure only (owner-only `$BK`). Optionally re-check `sha256sum rollout_driver.ts` against `DRIVER_SHA` inside `rd`.

| # | Timestamp (WIB) | Scope | Level | Result | Decision | Reviewer |
|---|---|---|---|---|---|---|
| 6 | 2026-11-04 ~22:20-22:40 | Delta check of runbook sha `5720b724...` (12 changed blocks, step 0.3, sections 1, 14 and R) | L4 | PASS (0 new findings; Info D-1, D-2) | L4: needs the USER's approval through the controller | security-review agent |

No secret value was printed, logged or written during the delta check.
