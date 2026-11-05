# C35 Security review: DATUM Rev A coverage round

- Row: C35, blueprint `identification/03_structured_datum_coverage_round.md` (C35 at line 213)
- Agent: security-review (skill `security-review-gate`)
- Scope: repo `C:\Users\TRIAL\gsp-swarm-hq-v2.1`, branch v2.1, HEAD 8c7c803. Reviewed `git diff HEAD` (67 files) and the untracked files (new engine modules, seed, tests, docs), plus `C:/Users/TRIAL/gsp-backups/profiles-investigation/report.md`. Decisions D-625..D-647 read.
- Method: read-only. No code, DB or production change. Probes ran on pure functions and on a local offline Chromium. Probe scripts are outside the repo (`C:\Users\TRIAL\AppData\Local\Temp\c35_*.{mjs,ts}`).
- Status: `needs-review`. The FAIL and CAUTION findings go to the USER through the controller.

## 1. Summary

| Item | Value |
|---|---|
| **Overall verdict** | **FAIL** |
| Totals | High 1, Medium 1, Low 4 |
| Review level | L3 deep audit: the render engine handles untrusted content, the seed uses an ADMIN caller, and file names go to disk and download headers. Not L4: no deploy or auth change. |
| GDPR non-compliances | 0 blocking. 1 Low data-minimisation note (L-03) |
| ISO 27001 control gaps | A.14.2 (H-01, M-01: secure coding, no hostile-input tests), A.12.6 partial (no dependency change, nothing to audit) |
| Skipped dimensions | GDPR Art. 7, 15/16/17, 20, 30, 33 and 35 are N/A. The round adds no new PII processing, storage or consent flow. Only render-time text placement changes. CV-21 asset intake is N/A: C28 has not run (Q3 asset not delivered, blueprint line 413), and `assets/manifest.json` is unchanged. |

### Per-area verdicts

| # | Area | Verdict | Finding(s) |
|---|---|---|---|
| 1 | Injection into DOCX/HTML from new text paths; CSS colour overrides | **CAUTION** | M-01. Colours, DOCX text, HTML text and the spine string are all PASS. |
| 2 | C18 file name `<title> <issueDate>.<ext>` | PASS | L-02 (pre-existing, informational) |
| 3 | ReDoS in the new regexes | **FAIL** | H-01 (rule-index). clash.py and scorer PASS |
| 4 | Seed: derived preset with ADMIN caller | PASS | none |
| 5 | clash.py `docx_classification_lines()` and subprocess | PASS | L-04 (benchmark tool, hardening) |
| 6 | UI: category mapping, editor, `highlightParts`, admin params | PASS | none |
| 7 | `src/lib/agent-roster.ts` `controllerRosterFile`, model labels | PASS | none |
| 8 | Data privacy in new docs and report | PASS | L-03 (Low note) |

## 2. Issues table (FAIL and CAUTION first)

| ID | Severity | Type | Location | Description | Remediation |
|---|---|---|---|---|---|
| H-01 | **High** (gate FAIL) | CWE-1333 ReDoS; OWASP A04/A05 (availability) | `src/lib/studio/engine/front/rule-index.ts:65-69` (`MD`, `MARKER_RE`), exec at `:90`; text joined from unbounded `runs` at `:80-85`. Reached from `src/lib/studio/engine/docx/assemble/units.ts:362` and `src/lib/studio/engine/html/assemble/slots.ts:261`. | `MARKER_RE` puts two `[*_\`]*` quantifiers next to each other: `MD \s* (punct)? MD` after the code, so `\s*` and the optional group can both be empty. If a paragraph starts with a rule code followed by a long run of `*`, `_` or backtick characters and then a character that does not match, matching takes polynomial (quadratic) time. Measured with the real `buildRuleIndex`: 20,000 chars (the schema max of one `text`) took **229 ms**; 40,000 chars from two schema-legal runs took **891 ms**; 80,000 chars from four runs took **4,443 ms**; 20 paragraphs of 20,000 chars took **6,875 ms**. On the regex alone, 200,000 chars took **33.8 s**. `runs` has no `maxItems` (`src/lib/studio/contract/schema/v2/common.schema.ts:78`), so one paragraph can carry up to about 5 MB (`STUDIO_MAX_JSON_BYTES`, `src/lib/studio/contract/env.ts:41`), which means hours of CPU. The scan runs synchronously in the HQ Node process (no worker thread; `child_process` is used only for soffice). It runs twice per render (DOCX and HTML) and once per AUTO marker, and it blocks the event loop for every user. The path is live on all STD templates: the seed sets `render.ruleIndex.fromMarkers: true` at `prisma/seed-doc-type-templates.ts:140`. | Fix before any promotion: (1) Markers sit only at the start of the text, so cap the input before `exec`, e.g. `MARKER_RE.exec(s.slice(0, 256))`, in `matchMarker` (`rule-index.ts:87-92`). (2) Remove the ambiguity: fold the separator into one class, e.g. `[*_\`\s]*(?:[·•\|:,—–(][*_\`\s]*)?`, so no two quantifiers over the same characters sit next to each other. (3) Add a unit test with a hostile 100 kB `*` run that must finish in under 50 ms. Optionally also give `runs` a `maxItems` bound in the v2 schema. |
| M-01 | **Medium** (gate CAUTION) | CWE-116 improper encoding causing CSS injection (OWASP A03) | Encoder `src/lib/studio/engine/html/base/fonts.ts:242-244` (`cssString`). New sink: `src/lib/studio/engine/html/base/shell.ts:280` (R-76 NOTA classification line in the `@page` margin box, value from `shell.ts:228-229`). Same encoder, existing sink: `src/lib/studio/engine/html/base/markup.ts:87` into `shell.ts:282-284` (running-head classification). | `cssString` escapes `\`, `"`, `<` and `\r?\n`, but leaves a lone CR (`\r`) and form feed (`\f`). CSS preprocessing turns both into newlines, which ends the string as a bad-string, so the text after it is parsed as CSS rules. `meta.classification` is a free string of 1-64 chars (`src/lib/studio/contract/schema/doc.schema.ts:201`), and intake does not strip control characters. Verified in offline Chromium with the verbatim `cssString`: a classification of the form `X<CR>}} p{color:...} q{a:` (40 chars) applied the injected rule; the FF variant also applied it; the escaped LF variant did not. Mitigations in place: served HTML carries `ACTIVE_CONTENT_CSP` (`src/app/api/studio/files/_lib/serve.ts:47-48,144`), which blocks remote fetches, and the server-side browser is offline (`src/lib/studio/engine/browser/index.ts:6`). Residual risk: a submitter can hide or alter visible content of a controlled HTML artifact (for example the classification marking itself), and can trigger a remote beacon when a downloaded HTML file is opened outside the CSP viewer. The root cause predates this round; R-76 adds a second sink. | In `cssString`, encode every CSS newline and C0 control: `.replace(/\r\n\|[\r\n\f]/g, "\\A ")`, then strip the remaining `[\u0000-\u0008\u000B\u000E-\u001F\u007F]`. As defence in depth, also reject control characters in `DocMeta` string fields at intake (schema `pattern: "^[^\\u0000-\\u001F\\u007F]*$"` on `classification`, `title` and `author`). Add a test that feeds `\r` and `\f` through `pageFurnitureCss` and checks that no `}` appears outside the quoted string. |
| L-01 | Low | Input validation hardening (CWE-20) | `src/lib/studio/params/render.ts:405` (R-79 `cover.controlBlock.preparerUnit`, type `string`, no `pattern`); `src/lib/studio/engine/tokens/merge.ts:67-79` (string branch checks only `pattern`) | The class-B template param accepts a string of any length and content. The output is escaped (DOCX `escapeXml`, HTML `esc`), so there is no injection, only layout abuse and payload bloat. | Add `pattern: "^[^\\u0000-\\u001F\\u007F]{1,120}$"`, or a max length, to R-79. |
| L-02 | Low (pre-existing, informational) | CWE-451 UI misrepresentation (bidi spoofing) | `src/lib/studio/services/storage/paths.ts:32` (`FORBIDDEN_NAME_CHARS`), `:161-168` (`datumClean`); used by the new `datumDateFileName` at `:215-225` | Bidi controls (U+202E and others) survive into the stored file name and into `filename*`; the ASCII fallback replaces them with `_`. The extension is fixed by the engine, so spoofing is visual only. Everything else holds (probe of 16 hostile cases): traversal (`../`, `..\`, `C:\`), reserved names (`CON`, `nul` become `CON 2026-11-05.docx`, which is not reserved), control characters, quotes and `;`, and length (clipped to 120 + ext). An `issueDate` that is not ISO (`../…`, CRLF header text, empty) throws `SCHEMA_INVALID`, and the caller falls back to `document.<ext>`. | Strip `[\u200E\u200F\u202A-\u202E\u2066-\u2069]` in `datumClean`. |
| L-03 | Low | GDPR Art. 5(1)(c) data minimisation; ISO A.8/A.9 | `C:/Users/TRIAL/gsp-backups/profiles-investigation/report.md:7` (individual user-profile identifiers, apparently personal names); `report.md:10` (records that the archived profile folders each hold a `.env`) | The ops report sits outside the repo and holds no secret values: an exact-value scan of every secret in `.env` and `.env.bak-prod` against the report and all 606 task-folder files found 0 matches. It does name individual user profiles, and it shows that 45 `.env` files sit in an archive folder whose ACL this review did not check. | Use role or profile IDs instead of personal names in reports, or limit who can read the report. Check that the archive folder named at `report.md:10` is readable only by the owner account, and rotate keys if it ever had wider access. |
| L-04 | Low | CWE-407 algorithmic complexity (offline benchmark tool) | `benchmark/datum_conformance/clash/clash.py:419` (all `word/footer*.xml` names passed in), `:312` (`name not in z.namelist()` per name) | A hostile DOCX with up to `MAX_DOCX_ENTRIES` = 20,000 footer entries makes the lookup O(n²) (about 4e8 list operations). Impact is limited: this is an offline CLI, and the size and DTD guards still apply. | Build `set(z.namelist())` once in `read_docx_parts`, and cap the footer names (for example at 64). |

## 3. Gate results (security-review-gate, 5 checks)

| Check | Result | Details |
|---|---|---|
| 1. Credential leak | PASS | Exact-value scan of `NEXTAUTH_SECRET`, `INTERNAL_API_SECRET`, `CRON_SECRET`, `WEBUI_RBAC_TOKEN` and the DATABASE_URL password from `.env` and `.env.bak-prod` (values read into shell variables, never printed) against `docs/2026-10-22_doc_artifact_studio/**` (606 files) and `report.md`: 0 files. Pattern scan of all changed and untracked files (API keys, JWT, private keys, connection strings): 0 real credentials. The 5 `postgresql://…@` hits in older task docs are placeholders or redacted examples from earlier security reviews. `agent-roster.ts:121-143` surfaces only `model.default` / `model.provider` lines from `config.yaml`, never key lines. |
| 2. Destructive operation | PASS | Seed writes run in one guarded transaction (`runGuardedTemplateTx`), with rollback on guard failure and on `--dry-run`. `ALLOWED_DATABASES` is unchanged (HEAD `prisma/seed-studio.ts:150` = working tree `:155`, enforced at `:220`). Guard targets come from code constants (`prisma/seed-derived-presets.ts` `DERIVED_PRESET_SPECS`), not from DB data, and duplicate slugs are rejected (`prisma/seed-studio-templates.ts`, `runGuardedTemplateTx`). The base preset `datum-gsp-preset` is outside the targets, so the guard requires it to stay unchanged. |
| 3. External call | PASS | No new outbound call. The clash.py subprocess (soffice) is unchanged (`clash.py:782`; the diff has 0 subprocess lines). The headless browser stays offline. |
| 4. Injection | **FAIL** | Driven by H-01 (ReDoS, CWE-1333, on untrusted content). M-01 (CSS injection through incomplete `cssString` encoding) is CAUTION. Everything else PASS: DOCX text goes through `escapeXml`/`textXml` (`src/lib/studio/engine/docx/package/xml.ts:46,357-362`) for the control-sheet subtitle, signature role labels (`filledSignature`), manual column heads, STATUS, KLASIFIKASI, the classification line (`header-footer.ts:412` via `hfRunsXml`), the preparer unit, rule-index cells (a normal `TableBlock`) and the back-cover spine. HTML uses `esc`/`escapeHtml`/`inlineHtml` (`shell.ts:252`, `html/blocks/wrapper.ts` `renderBackCover` / subtitle). Colours accept only hex validated by `normalizeHex` (`/^#?([0-9A-Fa-f]{6})$/`, `tokens/color.ts:16,25-29`) at `shell.ts:160-163,308-311`, `header-footer.ts:83,93,411,422` and `parts.ts:260` (also `escapeXml`). A malicious template param cannot inject CSS through R-72/R-73. |
| 5. Permission escalation | PASS | The ADMIN caller (`ADMIN_CALLER`, `prisma/seed-studio-templates.ts:51`) is used only from the CLI seed. No `src/` or `src/app` module imports `prisma/seed-*`. `buildRoster` is called only from `getRoster()` with no arguments (`agent-roster.ts:229`), and `/api/agents` uses `getRoster`, so a request cannot reach `controllerRosterFile`. The UI lock logic (`lockOf`) is unchanged, and class-K params stay admin-only. |

**Overall gate: FAIL.** Level L3. FAIL and CAUTION go back to the controller for a USER decision: fix / accept recorded risk / change scope.

## 4. GDPR / ISO 27701 assessment

| Article / control | Status | Finding | Remediation |
|---|---|---|---|
| GDPR Art. 5 minimisation | OK / PARTIAL | Positive: manual control-sheet columns leave the verification role and name blank (`compose/front.ts` manual verification rows), and R-79 can put an org unit in place of `meta.author` on the cover. Partial: personal profile identifiers in the ops report (L-03). | See L-03 |
| GDPR Art. 5 storage limitation | N/A | No new stored PII. The `f070_backup` snapshots (untracked) hold only an org unit as author (checked) | none |
| GDPR Art. 7, 15/16/17, 20, 30, 33, 35 | N/A | No new processing purpose, store or export of personal data in this round | none |
| GDPR Art. 25 privacy by design | OK | New options are opt-in, and the defaults keep today's output | none |
| GDPR Art. 32 security of processing | PARTIAL | H-01 is an availability weakness in the processing system | Fix H-01 |
| PII inventory | OK | New fields are R-67..R-80 (render toggles, hex colours, enum, org-unit string). None is PII | none |
| ISO 27701 PIMS | N/A | No change to controller or processor roles | none |
| ISO 27001 A.18.1.4 | OK | Reuses the rows above | none |

## 5. ISO 27001 Annex A mapping

| Control | Status | Finding | Remediation |
|---|---|---|---|
| A.9 Access control | OK | Seed ADMIN path is CLI-only; roster file option cannot be reached from a request; class-K UI lock unchanged | none |
| A.10 Cryptography | N/A | No crypto change | none |
| A.12.1 Operational procedures | OK | Decisions recorded at the time they were made (D-625..D-647); seed is idempoten with `--dry-run`; changes are uncommitted on v2.1 (DEV), production 9011 untouched | Commit in reviewed units after fixes |
| A.12.4 Logging | OK | New log entries (`RULE_INDEX_DUPLICATE_CODE`, `CLASSIFICATION_LINE_NO_NUMBER`) carry codes and addresses, no secrets | none |
| A.12.6 Vulnerability management | N/A | `package.json` and lockfile unchanged; no new dependency | none |
| A.13 Communications | OK | Served HTML keeps the strict CSP; Content-Disposition is encoded per RFC 5987 with control characters stripped (`serve.ts:83-91`) | none |
| A.14.2 Secure development | **GAP** | H-01 and M-01 have no hostile-input tests. C18 has unsafe-character tests (`tests/unit/studio/render/c18-file-name-form.test.ts:27,38`) | Add the ReDoS timing test and the CSS control-character test |
| A.16 Incident management | N/A | No change | none |
| A.18 Compliance | OK | Evidence in this report | none |

## 6. Remediation priorities

1. **Before any merge or promotion to production (High):** H-01. Cap the input and remove the ambiguity in `MARKER_RE`, add the hostile-input timing test, and re-run C17 tests plus baseline 8/8.
2. **Before production HTML artifacts carry R-76 (Medium):** M-01. Fix `cssString` encoding of CR, FF and C0, and optionally add an intake control-character pattern on `DocMeta` strings.
3. **Hardening (Low):** L-01 R-79 pattern; L-02 bidi strip in `datumClean`; L-04 clash.py set lookup; L-03 report wording and archive ACL check.
4. GDPR / ISO 27701: there are no blocking gaps for production PII.

## 7. Evidence (probe outputs)

- ReDoS, verbatim regexes (`node c35_redos.mjs`): `MARKER code+*^n+X` took 53.9 ms at 10,006 chars, 1,374.4 ms at 50,006, 8,557.9 ms at 100,006 and 33,802.3 ms at 200,006. `SECTION_NUMBER_RE`, `LEAD_PUNCT_RE` and `SENTENCE_END_RE` stayed linear (≤ 1.3 ms at 200 k).
- ReDoS, real builder (`tsx c35_rule_index_e2e.ts`): `runs=1 chars=20000 ms=229`; `runs=2 chars=40000 ms=891`; `runs=4 chars=80000 ms=4443`; `20 text paragraphs x 20000 chars ms=6875`.
- clash.py regexes (`python -I`): `CLASSIFICATION_RE`, `DOC_NUMBER_RE` and `FOOTER_PART_RE` stayed linear (≤ 32 ms at 2 M chars).
- Scorer CS-04/LB-10/LB-11 (`benchmark/datum_conformance/rules/*.ts` diff): exact `Set` and list equality only, no new regex.
- CSS (`node c35_css_probe.mjs`, offline Chromium, all requests aborted): `CR ... INJECTED`, `FF ... INJECTED`, `LF (escaped) ... not injected`.
- C18 (`tsx c35_c18_probe.ts`): 16 cases. Every name passes `assertSafeSegment` or the call throws `SCHEMA_INVALID`; an unknown form value falls back to today's `<title> <number> Rev<r>`.
- clash.py: `docx_classification_lines` reads footers only through `read_docx_parts` (entry, size and stream limits; `_DTD_RE` rejects DOCTYPE/ENTITY, including UTF-16) at `clash.py:286-331,412-428`.
- UI: no `dangerouslySetInnerHTML` or `innerHTML` in `template-editor/**` or `template-preview/**`. `highlightParts` (`param-editor-state.ts:52-65`) uses `indexOf` (no regex) and renders through React text nodes (`param-editor.tsx:457-472`).

## 8. Security review log

| # | Timestamp | Scope | Level | Result | Decision |
|---|---|---|---|---|---|
| 1 | 2026-11-05 | C35 coverage-round diff (67 modified + untracked files), report.md | L3 | FAIL (H-01), CAUTION (M-01), 4 Low | Pending: returned to the controller for the USER choice (fix / accept recorded risk / change scope). Not self-approved. |
