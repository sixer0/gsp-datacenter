---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: S45
date: 2026-11-04
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/deploy/05_datum_rev_a_rollout_plan.md (step 6, S45; sha256 5720b724..., D-618)
decisions: D-607 (gate payloads), D-608 (gate), D-612 (10-template evidence from the rehearsal), D-619 G-2 (word-boundary running head)
status: complete
---

# S45 - DATUM Rev A conformance on the production-clone rehearsal

## Summary

**Verdict: PASS 10/10 under D-608** (score >= 85 %, 4/4 critical, 0 clashes on every pair).

The 10 renders come from runbook step 6 (`step6_rehearsal`, 22:35-22:42 WIB): R2 code (tag `prod-v2.1-datum-rev-a-20261104`, commit `5fd72c5`) on `https://127.0.0.1:9031`, against the clone `gsp_agent_hq_v21_seedtest` restored from the step-3 production dump (sha256 `1f5703ca...71fe`) and seeded in step 5. The documents were written and rendered through the R2 MCP server with the D-607 gate payloads. Scores, critical rules, failing rules and clash results are identical to the DEV gate r2 (`23_datum_conformance_dev.md`, r2), and the per-rule outcome list matches S36 r2 on 10/10 pairs. The word-boundary cut of the running head (D-616, D-619 G-2) works on the production clone: every truncated title now ends on a whole word.

Coverage stays at 39.3-46.9 %. It is reported as found and is not a gate (D-608). The scorer prints its own `FAIL` on each pair, and its only reason is `cakupan butir ... < 85 %`.

## 1. Per-pair result

| Pair | Tier | Score (n/N) | Critical | Clash PDF | Clash X-* (fail/unverified) | Coverage (reported only) | Failing rules | Same outcomes as S36 r2 | **D-608 gate** |
|---|---|---|---|---|---|---|---|---|---|
| datum-proposal-teknis / ID | SERAH | **94.0 %** (63/67) | 4/4 | **0** | 0/0 | 39.7 % (11.5/29) | RH-03, RB-05, SB-02, GF-13 | yes | **PASS** |
| datum-proposal-teknis-en / EN | SERAH | **94.2 %** (65/69) | 4/4 | **0** | 0/0 | 46.6 % (13.5/29) | RH-03, RB-05, SB-02, GF-13 | yes | **PASS** |
| datum-laporan / ID | TERBIT | **94.0 %** (63/67) | 4/4 | **0** | 0/0 | 39.3 % (11/28) | RH-03, RB-05, SB-02, GF-13 | yes | **PASS** |
| datum-laporan-en / EN | TERBIT | **94.2 %** (65/69) | 4/4 | **0** | 0/0 | 46.4 % (13/28) | RH-03, RB-05, SB-02, GF-13 | yes | **PASS** |
| datum-laporan-verifikasi / ID | TERBIT | **94.0 %** (63/67) | 4/4 | **0** | 0/0 | 39.3 % (11/28) | RH-03, RB-05, SB-02, GF-13 | yes | **PASS** |
| datum-laporan-verifikasi-en / EN | TERBIT | **94.2 %** (65/69) | 4/4 | **0** | 0/0 | 46.4 % (13/28) | RH-03, RB-05, SB-02, GF-13 | yes | **PASS** |
| datum-standar / ID | TERBIT | **94.0 %** (63/67) | 4/4 | **0** | 0/0 | 39.7 % (11.5/29) | RH-03, RB-05, SB-02, GF-13 | yes | **PASS** |
| datum-standar-en / EN | TERBIT | **94.2 %** (65/69) | 4/4 | **0** | 0/0 | 46.6 % (13.5/29) | RH-03, RB-05, SB-02, GF-13 | yes | **PASS** |
| datum-nota / ID | NOTA | **90.9 %** (30/33) | 4/4 | **0** | 0/0 | 40.6 % (6.5/16) | RH-03, RB-05, GF-13 | yes | **PASS** |
| datum-nota-en / EN | NOTA | **91.1 %** (31/34) | 4/4 | **0** | 0/0 | 46.9 % (7.5/16) | RH-03, RB-05, GF-13 | yes | **PASS** |

- `clash.py` printed `clash: 0 clashes on 5 pages` (`on 2 pages` for NOTA) and exited 0 on all 10 PDFs.
- `unexercised` = 0 on all 10. `xFailures` and `xUnverified` are empty on all 10.
- "Same outcomes as S36 r2" compares the ordered list `rule id : status` of each `$WORK/score/<pair>.json` with `C:/tmp/s36r2/score/<pair>.json`: equal on 10/10.
- The failing rules are the known engine deviations already classified in S36 (RH-03, RB-05, GF-13 on 10/10; SB-02 on the 8 TERBIT/SERAH pairs, n/a for NOTA). There is no new failure.

## 2. Running head word boundary (D-616, D-619 G-2)

PyMuPDF line extraction of the header band (`hdr.py`, copied to `$BK/gladi/hdr.py`) on the 10 rehearsal PDFs, output `$BK/logs/s45_running_heads.txt`:

- 20 interior header lines on 20 interior pages. Each is **one line** at y1 = 45.8 pt, x0 = 68.2 to x1 = 535.5 pt, with `TERBATAS` on the same baseline.
- Every shortened title ends on a whole word followed by the ellipsis:
  - ID (10 lines): `PT GEMILANG SATRIA PERKASA · KAJIAN DESAIN KEAMANAN SISTEM INFORMASI MANAJEMEN ASET… · BAB n. ...`
  - EN (10 lines): `PT GEMILANG SATRIA PERKASA · SECURITY DESIGN STUDY FOR THE PORT ASSET MANAGEMENT… · CHAPTER n. ...`
- Comparison with the DEV gate r2 PDFs (code before the word-boundary change): `datum-laporan.pdf` p4 read `... MANAJEMEN ASET PEL…` and `datum-laporan-en.pdf` p4 read `... MANAGEMENT IN…` (cut inside a word). In the rehearsal both pages read `... ASET…` and `... MANAGEMENT…`.
- The chapter label and the classification are never cut. CR-1 passes on 10/10 (`klasifikasi "TERBATAS" (ANRI, kapital) identik di kepala halaman, register, dan pita segel`).

G-2 is therefore measured and met: the word-boundary change is present in the R2 build and behaves as specified on the production clone.

## 3. Rehearsal facts (step 6)

| Item | Result |
|---|---|
| R2 on 9031 | started out-of-app (`spawn_out` WMI `ReturnValue=0`), `/login` 200 after 1 s, smoke ok with 17 templates (`S-5 n=17`) |
| R2 MCP writes + renders | 10 templates + `latest`; `check_render` rows 11, fail 0; R08 valid, render 200, DOCX and PDF sha-verified, typeCode/tier/language = template spec on 10/10; `latest` -> `datum-gsp` (`001/GSP/KT/XI/2026`) |
| Doc numbers on the clone | 001/002 per type code: PT, LAP, VER, STD, NOT (ID = 001, EN = 002) |
| B-FIX | 10 fixtures in `$BK/gladi/r2/bfix/`, each `r08:true`, `COMPLETE` |
| Old code on 9051 | old 3566486 build against the clone, smoke ok with 17 templates; old MCP wrote and rendered `datum-gsp` next to the new rows (`002/GSP/KT/XI/2026`, `check_render` 1/0) |
| RB-1 rehearsal | `rb1_archive.sql` on the clone: old code lists 7 templates and its `latest` simulation is `datum-gsp`; a real old-MCP `latest` write resolved to `datum-gsp`; unarchive restored the exact seeded rows (`new10_fp` identical) |
| Stop | 9031 and 9051 stopped (only the `hq-server.mjs` trees of those two ports); 9011 (PID 35600) and 9041 (PID 31428) untouched |
| Secret scan | `secret_scan` keys=6, files=183, hits=0 |
| Spec | `$BK/gladi/r2/spec.json` (sha16 `27ea914b477bc958`) is byte-identical to the DEV gate r2 spec |

DOCX / PDF sha16 of the scored renders:

| Pair | DOCX | PDF |
|---|---|---|
| proposal-teknis | `df44d5f16a6e29f2` | `d470a218e75f0377` |
| proposal-teknis-en | `418a3195369968dc` | `c630261619d67282` |
| laporan | `cb87fcd1f4bb2357` | `9088ac22c5929d14` |
| laporan-en | `fb3593af2d2b5b8c` | `ec43557c4291375c` |
| laporan-verifikasi | `45491bed4ff12e23` | `3199f2f6bc16bb60` |
| laporan-verifikasi-en | `a0fc4573ab66849f` | `758170a73a3d67a8` |
| standar | `22e6419eebd174ac` | `e8e79f34b24bce90` |
| standar-en | `31cdc70555937ca1` | `b37de7b9d52514ab` |
| nota | `4ac997bcc5b11831` | `3a29a7b7abcfed65` |
| nota-en | `108ba5042257817e` | `a819c057ce02e417` |

## 4. Method and commands (no secrets)

Payloads (D-607): `step6_rehearsal` ran unchanged, with the documented optional driver inputs `RD_PAYLOAD_ID` / `RD_PAYLOAD_EN` set to copies of the DEV gate payloads in `$BK/gladi/payload/` (`id.json` sha16 `9c607200108d09f4`, `en.json` sha16 `f849b1700cc7ae79`, identical to `C:/tmp/s36/payload/`). Without them the driver falls back to the how-to sample, whose title is a placeholder and would neither be a D-607 gate payload nor exercise the running-head fit (G-2).

Scoring: `$BK/gladi/score_all_gladi.sh`, which is `C:/tmp/s36r2/score_all.sh` adapted to the rehearsal outputs. It runs from R2 with tsx directly (no npx); work folders are under `$WORK` (L39-7):

```bash
V=C:/Users/TRIAL/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe   # hermes venv, PyMuPDF
G=$BK/gladi/r2; COV=$REPO/docs/2026-10-22_doc_artifact_studio/verification/coverage/datum_point_coverage.json
cd "$R2"
"$V" -I -B benchmark/datum_conformance/clash/clash.py --pdf "$G/out/<slug>.pdf" --docx "$G/out/<slug>.docx" --no-convert \
    --out "$WORK/clash/<slug>.json" --work-dir "$WORK/clash-work"
node node_modules/tsx/dist/cli.mjs benchmark/datum_conformance/score.ts --docx "$G/out/<slug>.docx" --template <slug> \
    --language ID|EN --tier SERAH|TERBIT|NOTA --produced-by mcp --bfix "$G/bfix/<slug>.docx" --spec "$G/spec.json" \
    --clash "$WORK/clash/<slug>.json" --coverage "$COV" --out "$WORK/score"        # full rule set, no --implemented-only
```

`--no-convert` checks the PDF exactly as the R2 server rendered it (the Studio PDF path), with margins and zones taken from the DOCX, as in S36.

Paths (`$BK` = `C:/Users/TRIAL/gsp-backups/datum-rev-a-20261104-2230`): renders `$BK/gladi/r2/out/`, B-FIX `$BK/gladi/r2/bfix/`, clash `$BK/work/clash/`, scores `$BK/work/score/<pair>.json|.md`, console `$BK/logs/s45_score_console.txt`, running heads `$BK/logs/s45_running_heads.txt`.

## 5. Notes

- The clone was dropped in step 7 (Q-9), after the import and RB-3 rehearsals. The renders, fixtures and scores stay in `$BK` (owner-only ACL).
- The rehearsal workspaces `C:/Users/TRIAL/gsp-ws-gladi-r2`, `-old` and `-seed` hold only rehearsal renders (section L).
- The production template rows imported in step 11 must equal the clone rows by md5 (export manifest, step 7). That is what makes this rehearsal the 10-template evidence for production (D-612).
