---
task_id: 2026-10-22_doc_artifact_studio
task_slug: doc_artifact_studio
row: C51 (DATUM Rev A coverage round production rollout, step 13.1 - conformance of the production smoke document)
date: 2026-11-05
agent: test-expert
source_plan: docs/2026-10-22_doc_artifact_studio/deploy/09_datum_coverage_round_rollout_plan.md (step 13.1)
binding_decisions: D-608 (release gate)
reference: verification/38_coverage_round_conformance_rehearsal.md (C44 run 2), verification/43_coverage_round_dev_gate_final.md (DEV)
status: complete
---

# C51 - DATUM Rev A coverage round: conformance of the production smoke document

This row only read files: no HTTP call to 9011, no DB query, no process started or stopped. R3 (`C:/Users/TRIAL/gsp-hq-prod-v21-r3`, now serving production on 9011) was used only as the location of the scorer and clash checker. No source, runbook, or `$BK/tools` file was edited, and no secret was read.

- **Scorer checkout:** `git describe --tags --exact-match HEAD` = `prod-v2.1-datum-coverage-20261105`. `git status --porcelain` showed 0 lines before and after.
- **Processes:** the 13.1 clash command converts the DOCX with LibreOffice. clash.py starts its own `soffice` with a profile under `$WORK/clash-work` and kills only that process tree. No soffice process was running afterwards. No other process was touched.

`$BK` = `C:/Users/TRIAL/gsp-backups/datum-coverage-20261105-1636`. `$WORK` = `$BK/work`.

## Summary

**Verdict under D-608: PASS** for `datum-nota` / ID, the production smoke document `002/GSP/NOT/XI/2026` on datum-nota v2.

- **Gate checks:**
  - Score 96.9 % (32/33), above 85 %.
  - Critical rules 4/4.
  - 0 clashes: PDF 0, X-* none, `xUnverified` none.
- **Comparison with C44 run 2 (`datum-nota` / ID):** all 81 rule outcomes have the same status and the same evidence (0 status changes, 0 evidence changes). This is expected, because the production DOCX is byte-identical to the rehearsal render.
- **Comparison with the DEV final gate:** 0 status changes. CR-2 evidence differs only by document number (`002/GSP/NOT/XI/2026` against DEV `017/...`).
- **Only failure:** the known GF-13: `klasifikasi tebal=true warna=101418, harapan tebal 6E1420 (+3 temuan lain)`.
- **Coverage:** 53.1 %, report-only. The scorer prints its own `verdict: FAIL` (exit 1) only because of `cakupan butir 53.1 % < 85 %`, which does not gate under D-608. C44 and DEV show the same.

## 1. Inputs

| Item | Value |
|---|---|
| Production document | `002/GSP/NOT/XI/2026`, documentId `cmw3e9tb20001v18sywlbchth`, datum-nota, `templateVersion: 2`, NOT/NOTA/ID, mission `2026-11-05_datum-coverage-prod-smoke`. R08 valid (2 parts). Render `SUCCEEDED`, `partial:false`. Write warning `FRONT_SLOTS_OMITTED` only (`$BK/prod-smoke/resp/_render_summary.json`) |
| Payload | `$BK/prod-smoke/req/datum-nota.json`: `meta` and `sections` deep-equal `$BK/gladi/payload/id.json` (the real ID gate payload, sha16 `9c607200108d09f4`) |
| DOCX | `$BK/prod-smoke/out/datum-nota.docx`, sha16 `c2558d9ee3a18466`. It matches `sha256` and `serverSha` (`verified: true`) and is **byte-identical** to the rehearsal `$BK/gladi/r3/out/datum-nota.docx` |
| PDF (server) | `$BK/prod-smoke/out/datum-nota.pdf`, sha16 `1926dbbb74d7449e`, matches the server sha. It differs from the rehearsal PDF (`fdbec75b...`) at the same size, 56465 bytes, which is expected for a separate PDF render. The 13.1 block does not use it; the supplementary clash check in section 3 does |
| Spec | `$BK/prod-smoke/spec.json`, sha16 `27ea914b477bc958`. Byte-identical to the C44 spec and the DEV gate spec |
| B-FIX | `$BK/gladi/r3/bfix/datum-nota.docx` (the clone's, as 13.1 specifies), sha16 `6c4b380eef3ca8ea`. Matches `_bfix_summary.json` (`004/GSP/NOT/XI/2026`, COMPLETE) |
| Scorer / clash checker | R3 at tag `prod-v2.1-datum-coverage-20261105` (3ebe486): `score.ts` sha16 `d2e9f23cafb6a296`, `clash.py` sha16 `218dabea64dd4601`, the same files as in C44 |
| Coverage file | `$R3/docs/2026-10-22_doc_artifact_studio/verification/coverage/datum_point_coverage.json` (sha256 `38675038...`) |

## 2. Result (D-608)

| Pair | Tier | Doc no. | Score (n/N) | Critical | Clash PDF / X-* | Coverage (report-only) | Failing rules | Status changes vs C44 run 2 | Status changes vs DEV final | **D-608** |
|---|---|---|---|---|---|---|---|---|---|---|
| datum-nota / ID (production) | NOTA | 002/GSP/NOT/XI/2026 | **96.9 %** (32/33) | 4/4 | **0** / 0 | 53.1 % | GF-13 | **none** (0 evidence changes) | **none** (CR-2 evidence: number) | **PASS** |

- **clash.py (13.1 command, LibreOffice conversion of the production DOCX):** `clash: 0 clashes on 2 pages`, exit 0. Report: `{"pages": 2, "clashes": []}`.
- **score.ts:** `datum-nota_ID: FAIL | skor 96.9 % (32/33) | kritis 4/4 | cakupan 53.1 | bentrok 0`, exit 1, with the only reason being coverage. `unexercised` 0. `docxSha256` in the report = `c2558d9e...`, `bfixSha256` = `6c4b380e...`.
- **The block's `&&` chain:** clash.py exited 0, so score.ts ran. The block's overall exit code 1 is score.ts's own verdict, caused by coverage alone.

## 3. Supplementary clash check (C44 method, not part of 13.1)

The 13.1 block checks a fresh LibreOffice conversion of the DOCX. C44 checked the server PDF with `--no-convert`. For parity, the production server PDF was checked the same way:

`clash.py --pdf $BK/prod-smoke/out/datum-nota.pdf --docx $BK/prod-smoke/out/datum-nota.docx --no-convert --out $WORK/clash/prod-datum-nota.serverpdf.json --work-dir $WORK/clash-work`

Result: `clash: 0 clashes on 2 pages`, exit 0. The scored result uses the 13.1 clash file, as the runbook specifies. Both clash files show 0.

## 4. Comparison

Method: a node comparison of `$WORK/score/prod-datum-nota/datum-nota_ID.json` against `$BK/gladi/r3/score/datum-nota_ID.json` (C44 run 2) and against `C:/tmp/c32b/score/datum-nota_ID.json` (DEV final gate), by rule id, status, and evidence. Log: `$WORK/log/c51_compare.log`.

| Reference | Outcomes compared | Status changes | Evidence-only changes |
|---|---|---|---|
| C44 run 2, `datum-nota` / ID (clone rehearsal) | 81 | 0 | 0 |
| DEV final gate, `datum-nota` / ID | 81 | 0 | 1: CR-2, `nomor "002/GSP/NOT/XI/2026"` against `"017/GSP/NOT/XI/2026"` |

The production number `002/GSP/NOT/XI/2026` equals the rehearsal number. The clone's register was a copy of production's, and the runbook's step 12 predicted NOT 002. The 10-pair evidence for this release is C44 run 2 (report 38).

## 5. Commands (no secrets)

The 13.1 block was run as written in Git Bash, with `R3=/c/Users/TRIAL/gsp-hq-prod-v21-r3`, `PY=C:/Users/TRIAL/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe`, and `WORK=$BK/work` (values from `$BK/tools/env.sh`). Console output: `$WORK/log/c51_13_1.log`.

```bash
D=$BK/prod-smoke/out; mkdir -p "$WORK/clash" "$WORK/clash-work" "$WORK/score"
(cd "$R3" && "$PY" -I -B benchmark/datum_conformance/clash/clash.py --pdf "$WORK/clash/prod-datum-nota.pdf" --docx "$D/datum-nota.docx" --out "$WORK/clash/prod-datum-nota.json" --work-dir "$WORK/clash-work") \
 && (cd "$R3" && node node_modules/tsx/dist/cli.mjs benchmark/datum_conformance/score.ts --docx "$D/datum-nota.docx" --template datum-nota --language ID --tier NOTA \
      --produced-by mcp --spec "$BK/prod-smoke/spec.json" --bfix "$BK/gladi/r3/bfix/datum-nota.docx" --clash "$WORK/clash/prod-datum-nota.json" \
      --coverage "$R3/docs/2026-10-22_doc_artifact_studio/verification/coverage/datum_point_coverage.json" --out "$WORK/score/prod-datum-nota")
```

Additional read-only steps:

- `sha256sum` of the inputs, and node checks of the smoke and B-FIX summaries and the payload equality (section 1).
- The supplementary clash run (section 3), logged in `$WORK/log/c51_suppl_clash.log`.
- The comparison (section 4).
- `sha256sum ... > $WORK/log/SHA256SUMS_c51.txt`.

## 6. Evidence paths

- `$WORK/clash/prod-datum-nota.json`: 13.1 clash report, 0 clashes.
- `$WORK/clash/prod-datum-nota.pdf`: the LibreOffice conversion that clash.py checked.
- `$WORK/clash/prod-datum-nota.serverpdf.json`: supplementary clash report on the server PDF.
- `$WORK/score/prod-datum-nota/datum-nota_ID.json|.md`: scorer report.
- `$WORK/log/c51_13_1.log`, `c51_suppl_clash.log`, `c51_compare.log`.
- `$WORK/log/SHA256SUMS_c51.txt`: sha256 of the outputs above, the production DOCX and PDF, the spec, the request, and the B-FIX.
- `$WORK/clash-work/` is empty afterwards; clash.py cleans its soffice profile.
- Inputs, not modified: `$BK/prod-smoke/{out,req,resp,spec.json}`, `$BK/gladi/r3/bfix/datum-nota.docx`.

The smoke document can now be archived (13.3). This row read its files only and did not archive it.
