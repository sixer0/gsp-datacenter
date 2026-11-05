---
task_id: 2026-10-22_doc_artifact_studio
task_slug: doc_artifact_studio
row: C44 (DATUM Rev A coverage round production rollout, step 6 - conformance of the R3 rehearsal renders)
date: 2026-11-05
agent: test-expert
source_plan: docs/2026-10-22_doc_artifact_studio/deploy/09_datum_coverage_round_rollout_plan.md (step 6, C44)
binding_decisions: D-608 (release gate)
reference_gate: verification/43_coverage_round_dev_gate_final.md (C32 final, DEV)
status: complete (run 2 PASS 10/10; run 1 kept as record of an input defect)
---

# C44 - DATUM Rev A coverage round: conformance of the R3 rehearsal renders (production clone)

The rehearsal renders were made in step 6 (C43) by R3 on 9031 against the production clone. This row only scored them.

- **Read-only towards production.** Port 9011, DB `gsp_agent_hq`, and the clone DB were not touched. No process was started or stopped. `netstat` shows neither 9031 nor 9033 listening, before and after both runs.
- **No edits.** No source file, runbook file, or `$BK/tools` file was edited, and no secret was read (the scorer and clash checker need none). `git status --porcelain` in R3 was empty before and after each run.
- **Two runs.** Run 1 scored renders made from the placeholder how-to sample and failed on an input defect. The controller re-ran the rehearsal with the real payloads, and run 2 scored those.

`$BK` = `C:/Users/TRIAL/gsp-backups/datum-coverage-20261105-1636`. `G` = `$BK/gladi/r3`. `R1` = `$BK/run1_placeholder`.

## Summary

**Final verdict under D-608: PASS, 10/10 pairs (run 2).**

- **Gate checks, all 10 pairs:**
  - Score is at least 85 %: 96.9 % on every ID pair and 97.0 % on every EN pair.
  - Critical rules pass 4/4.
  - Clashes are 0, both PDF and X-*. clash.py printed `0 clashes` and exited 0.
- **Rule statuses are identical to the DEV final gate on all 10 pairs.**
  - All 81 rule outcomes per pair have the same status as in DEV.
  - The only failures are the known ones: SB-02 on the 8 TERBIT/SERAH pairs and GF-13 on all 10, with the same evidence strings.
  - The only evidence that differs is CR-2, because the clone issues its own document numbers (for example `001/GSP/PT/XI/2026`; DEV had `017/...`).
  - `unexercised` = 0 and `xUnverified` = [] on all 10.
- **Coverage (report-only):** 53.1-70.7 %, the same values as DEV.
- **Run 1 (placeholder payload): FAIL, input defect.** It is kept below. Step 6 first rendered every target from the ID how-to placeholder sample, so the 5 EN pairs failed on X-01. Run 2 shows that the deviation came from the input and not from R3 or the v2 templates.

## Run 2, real payloads (PASS)

### R2.1 Inputs and tools

| Item | Value |
|---|---|
| Payloads | `RD_PAYLOAD_ID`/`RD_PAYLOAD_EN` = `$BK/gladi/payload/id.json` (sha16 `9c607200108d09f4`) and `en.json` (`f849b1700cc7ae79`). Both are byte-identical in sha256 to `C:/tmp/s36/payload/{id,en}.json`, the DEV gate payloads |
| Request check | For each of the 11 `G/req/<target>.json`, `meta` and `sections` deep-equal the language payload (all `true`). `G/req/_sample_meta.json` still names the how-to construction. The driver always writes that file; `langPayload()` replaces the sample when the variables are set |
| Renders | `G/out/` holds 22 files written 17:00-17:01. `templateVersion: 2` on all 10. R08 valid (5 parts each, 2 for NOTA). Render `SUCCEEDED`, `partial:false`. Write warnings: none, except `FRONT_SLOTS_OMITTED` on NOTA, as in DEV. `latest` (KT) is outside the 10 and was not scored |
| File integrity | I recomputed the sha256 of all 20 gate files; each matches `sha256` and `serverSha` in `G/resp/_render_summary.json`. All 10 B-FIX DOCX files match `G/resp/_bfix_summary.json` (R08 valid, submit 201, render 200, COMPLETE) |
| B-FIX | `G/bfix/<slug>.docx` (10). They are byte-identical to the run-1 fixtures (`cmp` 10/10 same) with the same doc numbers. B-FIX uses its own fixed chapter payload, not `RD_PAYLOAD_*` |
| Spec | `G/spec.json` (sha16 `27ea914b477bc958`) is byte-identical to the run-1 spec and to the DEV gate spec `C:/tmp/c32b/spec.json` |
| Scorer / clash checker | Same as run 1: the R3 copy at `C:/Users/TRIAL/gsp-hq-prod-v21-r3`, tag `prod-v2.1-datum-coverage-20261105` (3ebe486), clean tree. `score.ts` sha16 `d2e9f23cafb6a296`, `clash.py` sha16 `218dabea64dd4601` |
| Coverage file | R3 `docs/2026-10-22_doc_artifact_studio/verification/coverage/datum_point_coverage.json` (sha256 `38675038...`, identical to REPO) |
| Run-1 outputs preserved | Before run 2, `G/score`, `G/clash`, and `G/work` were copied to `R1/c44/` (`cp -rp`). `sha256sum -c` against the run-1 manifest passed. Nothing was deleted; run 2 then overwrote the same file names in `G/score` and `G/clash` |

### R2.2 Per-pair results (full rule set, D-608)

| Pair | Tier | Doc no. | Score (n/N) | Critical | Clash PDF / X-* | Coverage (report-only) | Failing rules | Status changes vs DEV final gate | **D-608** |
|---|---|---|---|---|---|---|---|---|---|
| datum-proposal-teknis / ID | SERAH | 001/GSP/PT/XI/2026 | **96.9 %** (64/66) | 4/4 | 0 / 0 | 63.8 % | SB-02, GF-13 | none (CR-2 evidence: number) | **PASS** |
| datum-proposal-teknis-en / EN | SERAH | 002/GSP/PT/XI/2026 | **97.0 %** (66/68) | 4/4 | 0 / 0 | 69.0 % | SB-02, GF-13 | none | **PASS** |
| datum-laporan / ID | TERBIT | 007/GSP/LAP/XI/2026 | **96.9 %** (64/66) | 4/4 | 0 / 0 | 64.3 % | SB-02, GF-13 | none | **PASS** |
| datum-laporan-en / EN | TERBIT | 008/GSP/LAP/XI/2026 | **97.0 %** (66/68) | 4/4 | 0 / 0 | 69.6 % | SB-02, GF-13 | none | **PASS** |
| datum-laporan-verifikasi / ID | TERBIT | 001/GSP/VER/XI/2026 | **96.9 %** (64/66) | 4/4 | 0 / 0 | 64.3 % | SB-02, GF-13 | none | **PASS** |
| datum-laporan-verifikasi-en / EN | TERBIT | 002/GSP/VER/XI/2026 | **97.0 %** (66/68) | 4/4 | 0 / 0 | 69.6 % | SB-02, GF-13 | none | **PASS** |
| datum-standar / ID | TERBIT | 002/GSP/STD/XI/2026 | **96.9 %** (64/66) | 4/4 | 0 / 0 | 65.5 % | SB-02, GF-13 | none | **PASS** |
| datum-standar-en / EN | TERBIT | 003/GSP/STD/XI/2026 | **97.0 %** (66/68) | 4/4 | 0 / 0 | 70.7 % | SB-02, GF-13 | none | **PASS** |
| datum-nota / ID | NOTA | 002/GSP/NOT/XI/2026 | **96.9 %** (32/33) | 4/4 | 0 / 0 | 53.1 % | GF-13 | none | **PASS** |
| datum-nota-en / EN | NOTA | 003/GSP/NOT/XI/2026 | **97.0 %** (33/34) | 4/4 | 0 / 0 | 59.4 % | GF-13 | none | **PASS** |

- clash.py printed `clash: 0 clashes on 6 pages` (`on 2 pages` for NOTA) and exited 0 on 10/10. `xFailures` and `xUnverified` are empty, and `unexercised` is 0, on 10/10.
- score.ts exited 1 on 10/10 with its own `verdict: FAIL`. Its only reason on every pair is `cakupan butir ... < 85 %`, and coverage does not gate under D-608. DEV showed the same.
- The known failures are unchanged:
  - SB-02: `pita segel 1: warna teks F6E9E9, harapan F4F5F6 (+5 temuan lain)` (D-605(1)).
  - GF-13: `klasifikasi tebal=true warna=101418, harapan tebal 6E1420 (+3 temuan lain)` (D-598 F-4, D-602, D-604).

### R2.3 Comparison with the DEV final gate

Method: same as run 1. `compare_dev.mjs` compares each `G/score/<slug>_<LANG>.json` with `C:/tmp/c32b/score/<slug>_<LANG>.json` by rule id, status, and evidence. Output: `G/work/compare_dev.json` and `G/work/log/compare_dev_run2.log`.

| Pair | DEV final | R3 run 2 | Status changes | Evidence-only changes |
|---|---|---|---|---|
| 4 ID T/S pairs | 96.9 % (64/66), fail SB-02, GF-13 | 96.9 % (64/66), fail SB-02, GF-13 | **0** | CR-2 (number) |
| 4 EN T/S pairs | 97.0 % (66/68), fail SB-02, GF-13 | 97.0 % (66/68), fail SB-02, GF-13 | **0** | CR-2 (number) |
| datum-nota / ID | 96.9 % (32/33), fail GF-13 | 96.9 % (32/33), fail GF-13 | **0** | CR-2 (number) |
| datum-nota-en / EN | 97.0 % (33/34), fail GF-13 | 97.0 % (33/34), fail GF-13 | **0** | CR-2 (number) |

**Result: no rule differs from DEV in status.**

- 0 status changes over 810 rule outcomes (10 pairs x 81).
- CR-2 is the only rule with different evidence, on 10/10 pairs. Example: `nomor "001/GSP/PT/XI/2026" cocok pola, kode PT, sama di 3 lokasi` against DEV `"017/GSP/PT/XI/2026"`.
- The date-bearing rules (RB-06, IS-01, IS-02, NC-04) match DEV exactly, because the payload date is 2026-11-04 again.
- The run-1 deviations (GF-06, AC6-03, LB-10, X-01) are gone.

## Run 1, placeholder payload, FAIL - input defect

Kept as the record of the first scoring. Run-1 outputs are in `R1/c44/` (`score/`, `clash/`, `work/`), and run-1 inputs are in `R1/gladi/r3/`.

**Verdict under D-608: FAIL. 5 of 10 pairs passed: the 5 ID pairs passed and the 5 EN pairs failed, each with 1 X-01 clash.** The cause was the rehearsal input, not R3 or the v2 templates. Run 2 confirmed this.

### R1.1 Inputs

- **Renders:** `G/out/`, 22 files written 16:44-16:45 (now in `R1/gladi/r3/out/`). `templateVersion: 2` on all 10. Write warnings: `DATE_DEFAULTED` on all, plus `FRONT_SLOTS_OMITTED` on NOTA. The sha256 of all 20 gate files and all 10 B-FIX files matched the summaries.
- **Payload:** one ID-language how-to smoke sample for all 11 targets (`"construction": "s29 howtoSample()+completedSample()"`). It contains placeholders such as `<judul>`, `<paragraf>`, `<tanggal>`, `<...>` and ID headings (`Bab 1. Pendahuluan`, `Bab 6. Desain Keamanan`). A `diff` of `req/datum-laporan.json` against `datum-laporan-en.json` and `datum-nota-en.json` showed that only `docKey` and `template` differed.
- **Spec, scorer, clash checker, coverage file:** the same as run 2.

### R1.2 Per-pair results

| Pair | Tier | Doc no. | Score (n/N) | Critical | Clash PDF / X-* | Coverage | Failing rules | Status changes vs DEV | **D-608** |
|---|---|---|---|---|---|---|---|---|---|
| datum-proposal-teknis / ID | SERAH | 001/GSP/PT/XI/2026 | 95.4 % (63/66) | 4/4 | 0 / 0 | 63.8 % | SB-02, GF-13 | GF-06 pass -> unexercised | PASS |
| datum-proposal-teknis-en / EN | SERAH | 002/GSP/PT/XI/2026 | 92.6 % (63/68) | 4/4 | 0 / **1 (X-01)** | 69.0 % | SB-02, GF-13, AC6-03, LB-10, X-01 | GF-06 -> unexercised; AC6-03, LB-10, X-01 pass -> fail | **FAIL** |
| datum-laporan / ID | TERBIT | 007/GSP/LAP/XI/2026 | 95.4 % (63/66) | 4/4 | 0 / 0 | 64.3 % | SB-02, GF-13 | GF-06 -> unexercised | PASS |
| datum-laporan-en / EN | TERBIT | 008/GSP/LAP/XI/2026 | 92.6 % (63/68) | 4/4 | 0 / **1 (X-01)** | 69.6 % | SB-02, GF-13, AC6-03, LB-10, X-01 | GF-06 -> unexercised; AC6-03, LB-10, X-01 pass -> fail | **FAIL** |
| datum-laporan-verifikasi / ID | TERBIT | 001/GSP/VER/XI/2026 | 95.4 % (63/66) | 4/4 | 0 / 0 | 64.3 % | SB-02, GF-13 | GF-06 -> unexercised | PASS |
| datum-laporan-verifikasi-en / EN | TERBIT | 002/GSP/VER/XI/2026 | 92.6 % (63/68) | 4/4 | 0 / **1 (X-01)** | 69.6 % | SB-02, GF-13, AC6-03, LB-10, X-01 | GF-06 -> unexercised; AC6-03, LB-10, X-01 pass -> fail | **FAIL** |
| datum-standar / ID | TERBIT | 002/GSP/STD/XI/2026 | 95.4 % (63/66) | 4/4 | 0 / 0 | 65.5 % | SB-02, GF-13 | GF-06 -> unexercised | PASS |
| datum-standar-en / EN | TERBIT | 003/GSP/STD/XI/2026 | 92.6 % (63/68) | 4/4 | 0 / **1 (X-01)** | 70.7 % | SB-02, GF-13, AC6-03, LB-10, X-01 | GF-06 -> unexercised; AC6-03, LB-10, X-01 pass -> fail | **FAIL** |
| datum-nota / ID | NOTA | 002/GSP/NOT/XI/2026 | 93.9 % (31/33) | 4/4 | 0 / 0 | 53.1 % | GF-13 | GF-06 -> unexercised | PASS |
| datum-nota-en / EN | NOTA | 003/GSP/NOT/XI/2026 | 91.1 % (31/34) | 4/4 | 0 / **1 (X-01)** | 59.4 % | GF-13, AC6-03, X-01 | GF-06 -> unexercised; AC6-03, X-01 pass -> fail | **FAIL** |

**Evidence-only changes vs DEV in run 1:**

- CR-2: document numbers.
- RB-06, IS-01, IS-02, NC-04: the date was 2026-11-05, because `<tanggal>` was defaulted.
- GF-09: fewer rules lines (81 instead of 93; 32 instead of 44 on NOTA).
- CR-4: paragraph count.
- X-05: the wrapper-language item dropped out because of X-01.

### R1.3 Deviations and root cause

| # | Deviation | Evidence | Cause |
|---|---|---|---|
| D-1 | **X-01 fail = 1 clash on 5 EN pairs (gating)** | `ID "Bab" @ word/header4.xml paragraf 1; "Bab" @ word/header5.xml paragraf 1 \| EN "SHEET" @ word/footer4.xml ...`. The run-1 `laporan-en` header4 read `PT GEMILANG SATRIA PERKASA · <judul> · Bab 1. Pendahuluan`; DEV reads `... · Chapter 1. Introduction` | The running header repeats the content's chapter heading, and the EN templates received ID headings. The EN wrapper strings were correct |
| D-2 | AC6-03 fail on 5 EN pairs | `token perluasan ID di pembungkus: "Bab" @ word/header4.xml ...` | Same "Bab" from the content headings |
| D-3 | LB-10 fail on 4 EN T/S pairs | `catatan revisi baris pertama "Terbit pertama" != "First issue"` | `meta.revisionNote` was `"Terbit pertama"` for every target |
| D-4 | GF-06 pass -> unexercised on all 10 | `tidak ada paragraf isi di seksi interior`. No `<paragraf>` placeholder reached `word/document.xml` | The placeholder body paragraphs produced no body text |

**Why the input was wrong:** `$BK/tools/rollout_driver.ts:50-56` falls back to the how-to sample when `RD_PAYLOAD_ID`/`RD_PAYLOAD_EN` are unset. `rd()` in `$BK/tools/env.sh:159-163` treats them as optional, and `step6_rehearsal` (runbook, "step 6 (C43)") did not set them.

**Recommendation made after run 1:** re-run the step-6 render with the real payloads copied into `$BK`. The controller did this, and run 2 is the result.

**Still open for the runbook owner (not this row):** `step6_rehearsal`, and the step-12 smoke if it uses the same driver, should set `RD_PAYLOAD_ID`/`RD_PAYLOAD_EN` in the runbook itself. Otherwise a fresh execution repeats run 1.

**Observation (scorer sensitivity, no gate effect):** in run 1, CR-4 passed on the EN pairs (`0 token ID di 75 paragraf`) even though the body headings were `Bab ...`. Only X-01 and AC6-03 caught the ID headings, through the running header.

## Commands (no secrets)

Run in Git Bash, from the R3 checkout. `score_all.sh` is a copy of `C:/tmp/c32b/score_all.sh` (DEV final gate, report 43 section 7). The only changes are the root (`G`) and `--work-dir G/work/clash-work`; `diff` against the DEV copy shows nothing else. The runbook names `$WORK/clash-work`; the directory was placed under `G/work/` instead, as the row brief instructs. It stayed empty because clash.py ran with `--no-convert`. Runs 1 and 2 used identical commands.

```bash
BK=C:/Users/TRIAL/gsp-backups/datum-coverage-20261105-1636; G=$BK/gladi/r3
V=C:/Users/TRIAL/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe
# run 2 preparation: preserve run-1 C44 outputs (copy, never delete) and verify the copy
mkdir -p $BK/run1_placeholder/c44 && cp -rp $G/score $G/clash $G/work $BK/run1_placeholder/c44/
(cd $BK/run1_placeholder/c44 && grep -v spec.json work/SHA256SUMS_c44.txt | sha256sum -c --quiet)   # RUN1_COPY_VERIFIED
# input checks
sha256sum $BK/gladi/payload/*.json C:/tmp/s36/payload/*.json                  # 9c607200... / f849b170... both sides
node -e '<deep-equal of G/req/<target>.json meta+sections vs the language payload>'   # 11/11 true
node -e '<sha256 of G/out vs _render_summary.json sha256+serverSha; G/bfix vs _bfix_summary.json>'   # 30/30 ok
cmp $G/spec.json C:/tmp/c32b/spec.json
cd C:/Users/TRIAL/gsp-hq-prod-v21-r3 && git describe --tags --exact-match HEAD && git status --porcelain | wc -l   # tag, 0
# scoring (per pair: clash.py, then score.ts)
bash $G/work/score_all.sh > $G/work/log/score_run2.log 2>&1                   # run 1: work/log/score.log
#   $V -I -B benchmark/datum_conformance/clash/clash.py --pdf $G/out/<s>.pdf --docx $G/out/<s>.docx --no-convert \
#       --out $G/clash/<s>.json --work-dir $G/work/clash-work
#   npx tsx benchmark/datum_conformance/score.ts --docx $G/out/<s>.docx --template <s> --language <ID|EN> --tier <T> \
#       --produced-by mcp --bfix $G/bfix/<s>.docx --spec $G/spec.json --clash $G/clash/<s>.json \
#       --coverage docs/2026-10-22_doc_artifact_studio/verification/coverage/datum_point_coverage.json --out $G/score
node $G/work/compare_dev.mjs $G | tee $G/work/log/compare_dev_run2.log        # vs C:/tmp/c32b/score
$V -I -B -X utf8 $G/work/peek_docx.py <docx> ['word/header[45]\.xml']         # run-1 D-1 evidence
cd $G && sha256sum score/*.json clash/*.json work/compare_dev.json work/*.sh work/*.mjs work/*.py spec.json req/*.json ../payload/*.json > work/SHA256SUMS_c44_run2.txt
```

Exit codes in run 2: clash.py exited 0 on 10/10. score.ts exited 1 on 10/10, its own verdict, caused by coverage only.

## Evidence paths

**Run 2 (final):**

- `G/score/<slug>_<LANG>.json|.md`: 10 scorer reports, `generatedAt` 2026-11-05T10:07Z. `input.docxSha256` matches the run-2 renders.
- `G/clash/<slug>.json`: 10 clash.py results.
- `G/work/log/score_run2.log`, `G/work/log/compare_dev_run2.log`, `G/work/compare_dev.json`.
- `G/work/SHA256SUMS_c44_run2.txt`: 39 files, covering the score, clash and comparison outputs, the harness scripts, the spec, the 11 requests, and the 2 payloads.
- Inputs, not modified: `G/out/` (22), `G/bfix/`, `G/spec.json`, `G/req/`, `G/resp/`, `$BK/gladi/payload/{id,en}.json`.

**Run 1 (placeholder):**

- `R1/c44/score/`, `R1/c44/clash/`.
- `R1/c44/work/`: `log/score.log`, `log/compare_dev.log`, `compare_dev.json`, `SHA256SUMS_c44.txt`. `spec_run1_ref.json` is byte-identical to the spec used in both runs.
- Inputs: `R1/gladi/r3/`.

**DEV reference:** `C:/tmp/c32b/score/`, `C:/tmp/c32b/out/`, `C:/tmp/s36/payload/{id,en}.json`.
