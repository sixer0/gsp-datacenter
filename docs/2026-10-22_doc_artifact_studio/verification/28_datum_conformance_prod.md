---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: S52
date: 2026-11-04
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/deploy/05_datum_rev_a_rollout_plan.md (step 13.1, S52; sha256 5720b724..., D-618)
decisions: D-607 (gate payloads), D-608 (gate), D-612 (one production smoke document; 10-template evidence from the rehearsal), D-619 (GO)
status: complete
---

# S52 - DATUM Rev A conformance of the production smoke document

## Summary

**Verdict: PASS under D-608** for the one production pair `datum-nota` / ID / NOTA: score **90.9 %** (30/33, threshold 85 %), **4/4** critical rules, **0** clashes.

Scope (D-612): production holds exactly one smoke document, so S52 scores only that document. **The full 10-template evidence is the rehearsal, `verification/27_datum_conformance_rehearsal.md` (S45, 10/10 PASS).** That rehearsal ran the same R2 code against a fresh clone of production, and its template rows are identical (md5) to the rows imported in step 11. This report adds the production measurement for the one pair that was written.

The production document matches the rehearsal pair exactly:

- the DOCX is byte-identical to the S45 `datum-nota` DOCX (sha256 `4ac997bcc5b11831...`);
- the PDF has the same text and the same word boxes on both pages. Only the PDF creation date differs, so the PDF sha256 differs;
- the outcome of each of the 81 rules equals S45.

The scorer prints its own `FAIL` for one reason only: `cakupan butir 40.6 % < 85 %`. Point coverage is reported as found and is not a gate (D-608), as in S36 and S45.

## 1. Result

| Pair | Tier | Score (n/N) | Critical | Clash PDF | Clash X-* (fail/unverified) | Coverage (reported only) | Failing rules | Same outcomes as S45 | **D-608 gate** |
|---|---|---|---|---|---|---|---|---|---|
| datum-nota / ID | NOTA | **90.9 %** (30/33) | 4/4 | **0** | 0/0 | 40.6 % (6.5/16) | RH-03, RB-05, GF-13 | yes (81/81 rules) | **PASS** |

By family: CR 4/4, RH 2/3, RB 5/6, GF 12/13, DV 1/1, NU 4/4, TR 1/1, LB 1/1. `unexercised` 0, `na` 2 (GF-07, LB-03). Applicable measurable rules: 35. Rules implemented: 81. Measurable rules in the catalogue: 76. Unimplemented applicable rules: 0.

Critical rules (scorer evidence):

| Rule | Status | Evidence |
|---|---|---|
| CR-1 | pass | classification `TERBATAS` (ANRI, capitals) identical in the running head and the register (2 interior sections) |
| CR-2 | pass | number `001/GSP/NOT/XI/2026` matches the pattern, type code NOT, same in 2 locations |
| CR-3 | pass | ID convention met in the sample and the B-FIX; B-FIX expectations `1.250.000,5`, `Rp 1.385.946.000`, `25 %`, `0,5` present (clone B-FIX, F-7) |
| CR-4 | pass | 0 EN tokens in 14 wrapper locations; ID markers complete |

The failing rules are the known engine deviations already classified in S36 and S45: RH-03 (seal head rule colour/weight), RB-05 (register rules), GF-13 (seal colour of the classification text). SB-02 is n/a for NOTA. There is no new failure.

## 2. Clash check

| Run | PDF checked | Result |
|---|---|---|
| Runbook 13.1 (gate input to the score) | `clash.py --docx` converts the production DOCX with LibreOffice into `$WORK/clash/datum-nota.pdf` (sha16 `d7ce69fd7c67acc1`); margins and zones from the DOCX | `clash: 0 clashes on 2 pages`, exit 0 |
| Same method as S45 (supplementary) | `clash.py --docx ... --no-convert` on the PDF the production server rendered (`$BK/prod-smoke/out/datum-nota.pdf`) | `clash: 0 clashes on 2 pages`, exit 0; scored separately: 90.9 % (30/33), 4/4, 0 clashes, same 81 outcomes |

Both PDFs give 0 clashes, so the result does not depend on whether the server PDF or a fresh LibreOffice conversion is checked.

## 3. Inputs

| Input | Value |
|---|---|
| Document | production `StudioDocument` `cmw2bw8460001v19c0j9jhgat`, `001/GSP/NOT/XI/2026`, template `datum-nota` v1, NOT / NOTA / ID, revision 4, completeness COMPLETE, created by `agent:hermes-datum-rollout`, mission `2026-11-04_datum-rev-a-prod-smoke` (archived after scoring, step 13.3) |
| Written by | runbook `step12_smoke`: R2 MCP server (tag `prod-v2.1-datum-rev-a-20261104` = `5fd72c5`) against `https://localhost:9011`, `RD_TARGETS=datum-nota`, D-607 ID gate payload (`RD_PAYLOAD_ID` = `$BK/gladi/payload/id.json`, sha16 `9c607200108d09f4`, the same payload as S45) |
| DOCX | `$BK/prod-smoke/out/datum-nota.docx`, 453,750 bytes, sha256 `4ac997bcc5b11831a19d4bd806bac824e3c4283f59adfc3627413150042697f4` (= server sha, `x-studio-sha256-verified: true`; = S45 DOCX) |
| PDF (server) | `$BK/prod-smoke/out/datum-nota.pdf`, 55,401 bytes, 2 pages, sha256 `16df26bc9a197f5c...` (= server sha, verified) |
| Spec | `$BK/prod-smoke/spec.json`, sha16 `27ea914b477bc958` (byte-identical to the S45 and DEV gate r2 spec) |
| B-FIX | clone fixture `$BK/gladi/r2/bfix/datum-nota.docx`, sha16 `4739457bb8c77161` (F-7; no B-FIX document in production, D-612) |
| Coverage | `docs/2026-10-22_doc_artifact_studio/verification/coverage/datum_point_coverage.json`, sha16 `4114d8051a00c91f` |
| Rule set | full (no `--implemented-only`) |

## 4. Commands (no secrets)

`$BK` = `C:/Users/TRIAL/gsp-backups/datum-rev-a-20261104-2230`, `$WORK` = `$BK/work`. Shell opened with `bk_open` (`tools_ok: 28 files checked, 0 mismatches`). This is the runbook 13.1 block, unchanged:

```bash
V=$PY; D=$BK/prod-smoke/out; mkdir -p "$WORK/clash" "$WORK/clash-work" "$WORK/score"
(cd "$R2" && "$V" -I -B benchmark/datum_conformance/clash/clash.py --pdf "$WORK/clash/datum-nota.pdf" --docx "$D/datum-nota.docx" --out "$WORK/clash/datum-nota.json" --work-dir "$WORK/clash-work") \
 && (cd "$R2" && node node_modules/tsx/dist/cli.mjs benchmark/datum_conformance/score.ts --docx "$D/datum-nota.docx" --template datum-nota --language ID --tier NOTA \
      --produced-by mcp --spec "$BK/prod-smoke/spec.json" --bfix "$BK/gladi/r2/bfix/datum-nota.docx" --clash "$WORK/clash/datum-nota.json" \
      --coverage "$REPO/docs/2026-10-22_doc_artifact_studio/verification/coverage/datum_point_coverage.json" --out "$WORK/score/datum-nota")
```

Console output (`$BK/logs/s52_console.txt`):

```
clash: 0 clashes on 2 pages  | ...\work\clash\datum-nota.json
datum-nota_ID: FAIL | skor 90.9 % (30/33) | kritis 4/4 | cakupan 40.6 | bentrok 0
  - cakupan butir 40.6 % < 85 %
```

The scorer exits 1 because of its own coverage verdict. Under D-608 that verdict is not a gate.

Before this run, the S45 clash report at the same path (`$WORK/clash/datum-nota.json`) was copied to `$WORK/clash/s45_datum-nota.json`, so the rehearsal evidence is kept. The S45 scores (`$WORK/score/datum-nota_ID.json|.md`) are in another path and were not touched.

Comparison: for both production score reports, the ordered `rule id : status` list of the 81 outcomes equals the S45 `$WORK/score/datum-nota_ID.json` list.

## 5. Artefacts

| File | sha16 |
|---|---|
| `$WORK/clash/datum-nota.pdf` (LibreOffice conversion) | `d7ce69fd7c67acc1` |
| `$WORK/clash/datum-nota.json` | `228733c001e23396` |
| `$WORK/score/datum-nota/datum-nota_ID.json` | `08ece55517e96db6` |
| `$WORK/score/datum-nota/datum-nota_ID.md` | `990fa9761edeb642` |
| `$WORK/clash-prod-server/datum-nota.json` (supplementary) | `fb6dc0608cb2b09b` |
| `$WORK/score/datum-nota-serverpdf/datum-nota_ID.json` (supplementary) | `87878e6f384e2b43` |
| `$BK/logs/s52_console.txt`, `$BK/logs/s52_serverpdf_console.txt` | consoles |

## 6. Notes

- Coverage of 40.6 % is the same figure as S45 and is not claimed to reach 85 % (D-608). The gaps are listed in `22_datum_point_coverage.md`.
- The document was archived after scoring (step 13.3, guarded UPDATE `exp_docs=1`, `001/GSP/NOT/XI/2026|t|agent:hermes-datum-rollout`). Nothing was deleted. The rendered files stay in the production workspace and in `$BK/prod-smoke/out/`.
- No secret appears in this report. `secret_scan` of `$BK/prod-smoke` and `$BK/logs` (step 12) and `s54_secret_scan` found 0 hits.
