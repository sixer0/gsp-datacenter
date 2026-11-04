---
task_id: 2026-10-22_doc_artifact_studio
task_slug: doc_artifact_studio
row: S36
date: 2026-11-04
agent: test-expert
skills: tdd
source_plan: docs/2026-10-22_doc_artifact_studio/identification/02_structured_datum_rev_a.md (row S36, line 152)
binding_decisions: D-592, D-593, D-598 F-8, D-602, D-604, D-605, D-607, D-608, D-610, D-613
status: complete (r1 FAIL on clash; r2 after G-FIX cycle 1 PASS 10/10, see last section)
---

# S36 - DATUM Rev A DEV conformance gate per template x language

This run was DEV only: `http://localhost:9021` (`next dev`, DB `gsp_agent_hq_v21`). The server was not started or stopped. Port 9011, DB `gsp_agent_hq`, and `C:/Users/TRIAL/gsp-hq-prod-v21` were not touched. No production or scorer code was changed, and nothing was committed. The secret was read from its file into the environment and never printed. `grep -rlF` of the secret value across every artefact under `C:/tmp/s36` returned **0** files.

## Ringkasan

> **Update (r2, G-FIX clash cycle 1, D-613):** after the running-head fit fix, the re-run passes **10/10 pairs** under D-608: the same scores, 4/4 critical, and 0 clashes. See "Re-run r2 (after running-head fix)" at the end. The r1 findings below are kept as the record of the failure.

**Gate verdict under D-608: FAIL for all 10 pairs.** Every pair passes the measured score (90.9-94.2 %, threshold 85 %) and passes 4/4 critical rules. Every pair fails the clash gate: there are 2 PDF clashes on each ID pair and 4 on each EN pair, and 0 X-* clashes anywhere.

The clashes have one cause, a **real new engine defect**. The default running head (`header-footer.ts:108-115`) joins entity, `meta.title`, and the chapter heading with no width budget. With a realistic 65-character title the paragraph is wider than the 166 mm text block. The classification (and, for EN, part of the chapter title) then wraps onto a second line, and the classification loses its right tab (G-06, D-593). The defect is engine-wide and older than this round: legacy `datum-gsp` with the same payload shows the same 2 clashes. Shortening only `meta.title` gives 0 clashes and a D-608 PASS (minimal reproduction in section 4). The S35 smoke run did not show the defect because its placeholder title `<judul>` is short.

All failing measured rules are the known engine deviations accepted in D-598 F-4, D-602, D-604, and D-605(1): RH-03, RB-05, SB-02 (not applicable to NOTA), and GF-13. No other rule fails. There are no scorer issues and no payload artefacts among the failures.

| Pair | Tier | Score (n/N) | Critical | Clash PDF | Clash X-* | Coverage (D-608: reported, not gating) | Failing rules | **D-608 gate** |
|---|---|---|---|---|---|---|---|---|
| datum-proposal-teknis / ID | SERAH | **94.0 %** (63/67) | 4/4 | **2** | 0 | 39.7 % (11.5/29) | RH-03, RB-05, SB-02, GF-13 | **FAIL** (clash) |
| datum-proposal-teknis-en / EN | SERAH | **94.2 %** (65/69) | 4/4 | **4** | 0 | 46.6 % (13.5/29) | RH-03, RB-05, SB-02, GF-13 | **FAIL** (clash) |
| datum-laporan / ID | TERBIT | **94.0 %** (63/67) | 4/4 | **2** | 0 | 39.3 % (11/28) | RH-03, RB-05, SB-02, GF-13 | **FAIL** (clash) |
| datum-laporan-en / EN | TERBIT | **94.2 %** (65/69) | 4/4 | **4** | 0 | 46.4 % (13/28) | RH-03, RB-05, SB-02, GF-13 | **FAIL** (clash) |
| datum-laporan-verifikasi / ID | TERBIT | **94.0 %** (63/67) | 4/4 | **2** | 0 | 39.3 % (11/28) | RH-03, RB-05, SB-02, GF-13 | **FAIL** (clash) |
| datum-laporan-verifikasi-en / EN | TERBIT | **94.2 %** (65/69) | 4/4 | **4** | 0 | 46.4 % (13/28) | RH-03, RB-05, SB-02, GF-13 | **FAIL** (clash) |
| datum-standar / ID | TERBIT | **94.0 %** (63/67) | 4/4 | **2** | 0 | 39.7 % (11.5/29) | RH-03, RB-05, SB-02, GF-13 | **FAIL** (clash) |
| datum-standar-en / EN | TERBIT | **94.2 %** (65/69) | 4/4 | **4** | 0 | 46.6 % (13.5/29) | RH-03, RB-05, SB-02, GF-13 | **FAIL** (clash) |
| datum-nota / ID | NOTA | **90.9 %** (30/33) | 4/4 | **2** | 0 | 40.6 % (6.5/16) | RH-03, RB-05, GF-13 | **FAIL** (clash) |
| datum-nota-en / EN | NOTA | **91.1 %** (31/34) | 4/4 | **4** | 0 | 46.9 % (7.5/16) | RH-03, RB-05, GF-13 | **FAIL** (clash) |

Summary: score >= 85 % on 10/10 pairs, 4/4 critical on 10/10, 0 clashes on 0/10. Coverage is 39.3-46.9 %. Under D-608 it is reported as found and is not claimed to meet 85 %; the gaps are in `verification/22_datum_point_coverage.md`. The scorer prints its own `verdict: FAIL`, which also counts coverage below 85 % (D-593 interpretation). The D-608 column above ignores coverage, as D-608 requires.

Sensitivity (section 4): the same payload with only a shorter `meta.title` scores `datum-laporan` ID at 94.0 % with 4/4 critical and 0 clashes, and `datum-laporan-en` at 94.2 % with 4/4 critical and 0 clashes. Both are D-608 PASS. The running-head fix is therefore the only thing between this round and a 10/10 PASS. G-FIX applies here (blueprint line 101: at most 3 cycles).

## 1. Gate payloads (D-607)

Both payloads follow the corrected how-to sample in `docs/STUDIO-HOWTO-DOCUMENT.md` §2: the same keys, the same two chapters ("Bab 1" with subheading 1.1 and paragraphs, and "Bab 6" with a paragraph, a captioned and sourced table, a paragraph, and a stacked chart). The placeholders are replaced with plausible content: a port asset-management security design study. `number` is omitted (D-598 F-8). No `language` key is sent, so the template supplies the language.

| meta | ID payload (`C:/tmp/s36/payload/id.json`) | EN payload (`C:/tmp/s36/payload/en.json`) |
|---|---|---|
| title | Kajian Desain Keamanan Sistem Informasi Manajemen Aset Pelabuhan | Security Design Study for the Port Asset Management Information System |
| classification | TERBATAS | TERBATAS (kept: EG-50 EN:627-634 keeps the Indonesian marking; `RESTRICTED` is forbidden by CR-1, `expect_structure_b.ts:54-65`) |
| author | Tim Kajian | Study Team |
| revision / revisionNote | A / Terbit pertama | A / First issue (the EN first-issue note, `expect_language.ts:166`) |
| date | 2026-11-04 | 2026-11-04 |
| headings | Bab 1. Pendahuluan; 1.1 Latar Belakang; Bab 6. Desain Keamanan | Chapter 1. Introduction; 1.1 Background; Chapter 6. Security Design |
| table | ID / Ancaman / Pengendalian utama, 4 rows, caption "Register ancaman prioritas", source "Register ancaman proyek" | ID / Threat / Primary control, 4 rows, caption "Priority threat register", source "Project threat register" |
| chart | Tinggi/Sedang/Rendah; series Kritis [2,1,0], Mayor [1,3,2] | High/Medium/Low; series Critical [2,1,0], Major [1,3,2] |
| numerals in text | "99,5 %" (ID convention) | "99.5 %" (EN convention) |

sha256: `id.json` `9c607200108d09f4...`, `en.json` `f849b1700cc7ae79...`. The ID and EN payloads have identical leaf paths (47 leaves each, `samePaths true`). The only values identical across the two languages are mission, classification, revision, date, table IDs, chart values, and `stacked`.

### Payload diff within each language

`node C:/tmp/s36/diff.mjs` compares each request body actually sent (`C:/tmp/s36/req/<slug>.json`, written by the driver right before the MCP call) with the first template of its language. Output (`C:/tmp/s36/resp/_payload_diff.json`):

```
ID datum-proposal-teknis []                     3dee437e25f7d44f 47
ID datum-laporan ["/docKey","/template"]        3dee437e25f7d44f 47
ID datum-laporan-verifikasi ["/docKey","/template"] 3dee437e25f7d44f 47
ID datum-standar ["/docKey","/template"]        3dee437e25f7d44f 47
ID datum-nota ["/docKey","/template"]           3dee437e25f7d44f 47
EN datum-proposal-teknis-en []                  763197c316b6b796 47
EN datum-laporan-en ["/docKey","/template"]     763197c316b6b796 47
EN datum-laporan-verifikasi-en ["/docKey","/template"] 763197c316b6b796 47
EN datum-standar-en ["/docKey","/template"]     763197c316b6b796 47
EN datum-nota-en ["/docKey","/template"]        763197c316b6b796 47
```

The column after the leaf list is the sha256 of `{mission, meta, sections}`, identical within each language. `git diff --no-index req/datum-proposal-teknis.json req/datum-nota.json` (and the same diff for the EN pair) shows exactly 2 changed lines: `docKey` and `template`. As in S35, `docKey` must differ per document within one mission; reusing it would rewrite the first document and ignore the template.

## 2. Writes, renders, B-FIX, spec

All 10 `studio_write` calls returned `isError:false`, state `dibuat`, and `COMPLETE` (mission `2026-11-04_datum-rev-a-dev-gate`, docKey `gate-<slug>`, agent `hermes-datum-gate`). Warnings were none, except `FRONT_SLOTS_OMITTED` on NOTA. The realistic meta removed the S35 `DATE_DEFAULTED`, `REV_*` warnings. R08 per stored part returned `valid:true` for all parts (5 per document, 2 for NOTA). Template versions were all `@2`. R17 returned 200, `SUCCEEDED`, `partial:false`, and `failedFormats:[]`. Every DOCX and PDF matched the server sha256, and `x-studio-sha256-verified: true` was returned.

| Template | Doc id | Doc number | typeCode/tier/lang | Tpl | DOCX (bytes, sha16) | PDF (bytes, sha16) |
|---|---|---|---|---|---|---|
| datum-proposal-teknis | cmw27c5sr13fcv188ajf8pq74 | 005/GSP/PT/XI/2026 | PT/SERAH/ID | @2 | 497678, 6a5540674a9d3bca | 121124, fa587cab3543e734 |
| datum-proposal-teknis-en | cmw27c9c113gjv188o3kc6jbp | 006/GSP/PT/XI/2026 | PT/SERAH/EN | @2 | 496346, bdf80608810f5954 | 121417, 223ea0a71deb1d7b |
| datum-laporan | cmw27cb0s13hqv1885vu2y769 | 156/GSP/LAP/XI/2026 | LAP/TERBIT/ID | @2 | 497675, 54475da838765de0 | 121102, 3ef93a62958aba62 |
| datum-laporan-en | cmw27ccp713ixv188fa60d9xy | 157/GSP/LAP/XI/2026 | LAP/TERBIT/EN | @2 | 496349, 0f9f401f08b34bed | 121468, 8c186932085f4dd0 |
| datum-laporan-verifikasi | cmw27cei113k4v188b9nuioc0 | 005/GSP/VER/XI/2026 | VER/TERBIT/ID | @2 | 497680, 71fd2ddc31d15e66 | 121148, 827ac427cd1c944f |
| datum-laporan-verifikasi-en | cmw27cg7713lbv188u0we58jc | 006/GSP/VER/XI/2026 | VER/TERBIT/EN | @2 | 496348, 2fb2d23dfcf3c7b7 | 121474, 6a0211c0a9d76122 |
| datum-standar | cmw27chsg13miv188oc9ol9cl | 007/GSP/STD/XI/2026 | STD/TERBIT/ID | @2 | 497675, ac91487df7dc8232 | 121110, 9f20e22e605045fa |
| datum-standar-en | cmw27cjhu13npv188cvpq997l | 008/GSP/STD/XI/2026 | STD/TERBIT/EN | @2 | 496347, 7d278a3647f19057 | 121659, 8dd9ed4a31e14c20 |
| datum-nota | cmw27cl1k13owv188jm3emopi | 005/GSP/NOT/XI/2026 | NOT/NOTA/ID | @2 | 453735, a37fe5f08551c2f0 | 54990, 6bac0769a59dda68 |
| datum-nota-en | cmw27cmgi13pov188wbm0t234 | 006/GSP/NOT/XI/2026 | NOT/NOTA/EN | @2 | 452401, c2ae71618512d55d | 54459, bc3064e7c37495b5 |

Files are at `C:/tmp/s36/out/<slug>.docx|.pdf`.

**B-FIX (D-604, regenerated against current code):** these use the S35 approach (MCP shell `studio_write`, then chapter 1 + a `derivation` block bound to the 4-entry register through R08 then R12, then R17 DOCX), in the separate mission `2026-11-04_datum-rev-a-dev-gate-bfix`. R08 was valid and the document COMPLETE for 10/10. `python -I C:/tmp/s36/bfix_check.py` found all 4 expected strings for the language (ID `1.250.000,5`, `Rp 1.385.946.000`, `25 %`, `0,5`; EN `1,250,000.5`, `IDR 1,385,946,000`, `25 %`, `0.5`) in 10/10, with 0 other-language forms and 0 forbidden-currency hits. Files are at `C:/tmp/s36/bfix/<slug>.docx` (doc ids `cmw27ehse13s4v188y087us2k` ... `cmw27epl613zrv188rbpuz52d`, in `resp/_bfix_summary.json`).

**Spec:** `docTypeTemplateSpecJson()` wrote `C:/tmp/s36/spec.json` (`datum-template-spec/v1`, 10 templates, sha16 `27ea914b477bc958`), byte-identical to `C:/tmp/s35/spec.json` (`cmp` exit 0). Default tiers: PT SERAH; LAP, VER, and STD TERBIT; NOT NOTA.

**Coverage:** `docs/2026-10-22_doc_artifact_studio/verification/coverage/datum_point_coverage.json` (revision 2).

## 3. Failing rules per pair, with evidence and classification

The failure set is identical for the 8 TERBIT/SERAH pairs (ID and EN) and identical for the 2 NOTA pairs; the only difference is the part names. Evidence is quoted from `C:/tmp/s36/score/<slug>_<LANG>.json` (`outcomes[].evidence`).

| Rule | Pairs | Evidence (scorer) | Classification |
|---|---|---|---|
| RH-03 running-head rule | all 10 | `header word/header4.xml (seksi 3): garis single/C3CBD1/sz 5, harapan 6E1420/sz 6+-1` (+1 more section; NOTA `header1.xml`/`header2.xml`) | Known engine deviation: D-598 F-4, D-602, D-604 (hard-coded `runningHeadFormat` border INK200 sz 5, `header-footer.ts:66-75`; no parameter) |
| RB-05 register rules | all 10 | `word/footer4.xml (seksi 3): sel 1 garis atas single/101418/sz 8, harapan 6E1420/sz 8+-1` (+7: cells 1-4 of both interior footers) | Known engine deviation: D-602, D-604 (top rule ink900, manual seal ID:2577) |
| SB-02 seal-band text colour | 8 TERBIT/SERAH (n/a for NOTA) | `pita segel 1: warna teks F6E9E9, harapan F4F5F6` (+5: 3 bands x 2 cells) | Known engine deviation: D-605(1) (preset role format `wrapper.sealBand.run.color = F6E9E9` overrides `color.wrapper.cream`) |
| GF-13 classification colour | all 10 | `header word/header4.xml (seksi 3): klasifikasi tebal=true warna=101418, harapan tebal 6E1420` (+3: second header, 2 register cells) | Known engine deviation: D-598 F-4, D-602, D-604 (`RUNNING_HEAD_RIGHT_RUN` colour INK900, `header-footer.ts:55`) |
| **G-06 overflow (PDF clash)** | all 10: ID 2, EN 4 | ID p4/p5 (NOTA p1/p2): `"TERBATAS" G-06 label wraps in header zone 'running header': 2 baselines (y=44.05, 53.05), expected 1`. EN also has `"INTRODUCTION"` (p4) and `"DESIGN"` (p5) wrapping the same way | **Real new defect** (engine; see section 4). Not a scorer issue: confirmed visually (`C:/tmp/s36/work/hdr_laporan_id_p4.png`, `hdr_laporan_en_p5.png`: the classification sits mid-page on a second line under the running head) and by PyMuPDF line extraction |

Not applicable / not exercised (none count against the score): CV-10 (no standfirst) and CV-11 (no scope line) are conditional elements the payload does not supply. CS-10 does not apply because a master copy has no numbered copies. GF-07 and LB-03 do not apply because the chapter kicker is suppressed when headings carry the source number "Bab 1." / "Chapter 1.", which is how-to §2 behaviour. RB-04, RB-08, TR-02, TR-04, and AC6-03 do not apply because of tier or language. `unexercised` = 0 on every pair. CR-3 ran with B-FIX and passed everywhere.

Passing critical rules (evidence for `datum-laporan` ID): CR-1 `klasifikasi "TERBATAS" (ANRI, kapital) identik di kepala halaman, register, dan pita segel (2 seksi interior)`. CR-2, CR-3, and CR-4 passed on all 10. On the EN pairs, CR-4 passed with no Indonesian wrapper token. That confirms the D-607 causes are gone: capitals from G-FIX 1, and the language-correct payload removes the English headings from the ID documents.

## 4. Investigation of the D-608 failure (clash)

**Cause.** `defaultRunningHeadLeft()` (`src/lib/studio/engine/docx/package/header-footer.ts:108-115`) builds `[org.entityName, runningHead.docLabel ?? meta.subject ?? meta.title, chapter label, chapter title].join(" · ")`. The new templates do not set `runningHead.docLabel` (registry default `""`, `src/lib/studio/params/render.ts:179-183`), so the full `meta.title` is used. `runningHeadBody()` (`:123-140`) puts this text and a right-tab classification run in one paragraph with exact 9 pt line height and a right tab at the text width. Nothing limits the width. When left text plus classification is wider than 166 mm, LibreOffice and Word wrap. The tab then falls to the next default stop, so the classification lands mid-line on line 2, and for EN the chapter title also breaks.

**Measurement** (engine's own `measureFont`, `src/lib/studio/engine/chart/core/textfit.ts:112`, run read-only by `C:/tmp/s36/fitprobe.ts`; 6.5 pt Plex Sans Cond caps, 0.6 pt tracking): the left budget is 166 - 12.1 (`TERBATAS` bold) = **153.9 mm**.

| Running-head left text | Width | Result |
|---|---|---|
| ID gate p4 (`... KAJIAN DESAIN ... PELABUHAN · BAB 1. PENDAHULUAN`) | 156.4 mm | wraps (PDF line 442 pt = 156 mm, matches) |
| ID gate p5 (`... · BAB 6. DESAIN KEAMANAN`) | 161.5 mm | wraps |
| EN gate p5 (`... INFORMATION SYSTEM · CHAPTER 6. SECURITY DESIGN`) | 173.3 mm | wraps, chapter title breaks too |
| ID short title (`Kajian Keamanan Aset Pelabuhan`) | 114.0 mm | fits |
| EN short title (`Port Asset Security Study`) | 109.7 mm | fits |

The manual specimen (ID:349, EN:397) shows the running head on one line with the classification at the right: `PT GEMILANG SATRIA PERKASA · MANUAL PENULISAN BAHASA INDONESIA · BAB 1 ... TERBATAS`. A wrapped head breaks that specimen and breaks D-593 ("label tidak meluap di ... kepala halaman").

**Minimal reproduction** (DEV, mission `2026-11-04_datum-rev-a-dev-gate-repro`, `npx tsx C:/tmp/s36/driver.ts repro`). The gate payload is used unchanged except where noted:

| Case | Template | Change from gate payload | clash.py | Score / critical | D-608 |
|---|---|---|---|---|---|
| R1 | datum-laporan (ID) | `meta.title = "Kajian Keamanan Aset Pelabuhan"` only | **0** | 94.0 % (63/67), 4/4 | PASS |
| R2 | datum-laporan-en (EN) | `meta.title = "Port Asset Security Study"` only | **0** | 94.2 % (65/69), 4/4 | PASS |
| R3 | **datum-gsp** (legacy, ID) | none (same long title) | **2** (`TERBATAS` wraps p4/p5, same bbox as gate) | not scored (legacy template; S36 scope is the 10 new templates) | n/a |

R3 shows that the defect is engine-wide and older than this round, not caused by the new templates. Its DOCX and PDF are at `C:/tmp/s36/repro/gsp-long.*`. Smallest manual reproduction: any `studio_write` whose `len(entity · title · chapter heading)` is greater than about 153.9 mm at 6.5 pt Cond caps (about 110-115 characters), on any template, followed by R17 PDF and clash.py.

**Proposed fix (not applied; product code is out of scope for this row):**

1. *Recommended, generic engine change (U4-compliant: no slug branch, no new parameter):* in `runningHeadBody()`/`defaultRunningHeadLeft()`, fit the default left text to `textWidth - width(right text) - gap`, using `measureFont`/`ellipsize` from `engine/chart/core/textfit.ts` (that module imports nothing, so no import cycle). Shorten `docLabel` first with an ellipsis, then the chapter title. Entity and chapter label stay intact. Text that already fits is emitted unchanged, so the ID baselines should stay byte-identical: every calibration input had 0 clashes (D-604; `21_datum_conformance_calibration.md`), and this must be confirmed by baseline 8/8 SAME. TDD seam: the rendered header XML through `defaultRunningHeadLeft` (or the render entry point). Red test 1: the gate ID title with chapter "Bab 6. Desain Keamanan" gives left text that measures at most 153.9 mm and ends its title segment with an ellipsis. Red test 2: an EN title of 98 characters gives the same. Green guard: a short title gives byte-identical XML. Then re-run S36 and expect 0 clashes on 10/10 pairs.
2. *Data-only alternative (needs a controller decision):* set `runningHead.docLabel` in the shared spec layer to the document-type kicker (for example `LAPORAN VERIFIKASI`, which measures 95.8 mm; `VERIFICATION REPORT` measures 102.0 mm). This follows the code comment "jenis dokumen" (`header-footer.ts:107`), but it departs from the manual specimen, which carries the document title, and long chapter titles could still wrap. Use it only together with option 1, or not at all.

The *payload* is not the cause. A 65-character title is ordinary agent content. How-to §2 tells agents to take `meta` key-values from the source metadata ("kunci-nilai dari metadata bahan") and to copy chapter headings exactly. Asking agents to shorten titles would add a new usage rule, which U3/D-594 forbids.

## 5. Commands (no secrets)

Run from `C:/Users/TRIAL/gsp-swarm-hq-v2.1` in Git Bash. The driver is `C:/tmp/s36/driver.ts`, derived from `C:/tmp/s35/driver.ts`. It spawns the real MCP server `scripts/studio/mcp/server.ts` over stdio, and it refuses to run if the base URL is not DEV 9021 or the agent id is not `hermes-datum-gate`.

```bash
export INTERNAL_API_SECRET="$(tr -d '\r\n' < C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/trial_internal_secret)"
export STUDIO_BASE_URL=http://localhost:9021 STUDIO_AGENT_ID=hermes-datum-gate STUDIO_MCP_TOOLSETS=write STUDIO_MCP_FILE_ROOTS=C:/tmp/s36
npx tsx C:/tmp/s36/driver.ts spec      # docTypeTemplateSpecJson() -> C:/tmp/s36/spec.json
npx tsx C:/tmp/s36/driver.ts write     # 10x MCP studio_write, mission 2026-11-04_datum-rev-a-dev-gate (payload/id.json | en.json)
node C:/tmp/s36/diff.mjs               # payload diff within each language -> resp/_payload_diff.json
npx tsx C:/tmp/s36/driver.ts render    # R20, R08 per part, R17 {docx,pdf}, R10 GET + HEAD ?verify=1 -> out/
npx tsx C:/tmp/s36/driver.ts bfix      # B-FIX per pair -> bfix/ (mission ...-dev-gate-bfix)
python -I -B C:/tmp/s36/bfix_check.py  # hermes venv; expected B-FIX strings
bash C:/tmp/s36/score_all.sh           # per pair:
#   V=C:/Users/TRIAL/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe
#   $V -I -B benchmark/datum_conformance/clash/clash.py --pdf C:/tmp/s36/out/<slug>.pdf --docx C:/tmp/s36/out/<slug>.docx \
#       --no-convert --out C:/tmp/s36/clash/<slug>.json --work-dir C:/tmp/s36/work
#   npx tsx benchmark/datum_conformance/score.ts --docx C:/tmp/s36/out/<slug>.docx --template <slug> --language ID|EN \
#       --tier <SERAH|TERBIT|NOTA> --produced-by mcp --bfix C:/tmp/s36/bfix/<slug>.docx --spec C:/tmp/s36/spec.json \
#       --clash C:/tmp/s36/clash/<slug>.json \
#       --coverage docs/2026-10-22_doc_artifact_studio/verification/coverage/datum_point_coverage.json --out C:/tmp/s36/score
#   (full rule set; no --implemented-only)
npx tsx C:/tmp/s36/driver.ts repro     # section 4 R1-R3 -> C:/tmp/s36/repro/, then clash.py + score.ts as above
npx tsx C:/tmp/s36/fitprobe.ts         # running-head width measurement (engine textfit, read-only)
```

Raw evidence (all under `C:/tmp/s36/`): `payload/`, `req/`, `resp/` (`_write_summary.json`, `_render_summary.json`, `_bfix_summary.json`, `_bfix_text_check.json`, `_payload_diff.json`), `out/`, `bfix/`, `clash/`, `score/<slug>_<LANG>.json|.md`, `repro/` (requests, DOCX/PDF, clash JSON, `score/`), `work/hdr_*.png`, `log/` (`write.log`, `render.log`, `bfix.log`, `score.log`, `repro.log`, `repro_clash.log`).

## 6. Notes and limitations

- DEV DB writes: 10 gate documents, 10 B-FIX fixtures, and 3 reproduction documents in three separate missions (`...-dev-gate`, `...-dev-gate-bfix`, `...-dev-gate-repro`). Nothing was deleted.
- Blueprint row S36 still lists "cakupan >= 85 % tiap pasangan". D-608 supersedes that: coverage is reported, not gating.
- The scorer's per-pair `.md` and `.json` print `verdict: FAIL` with two reasons: clash, and coverage below 85 %. Only the clash reason is gating under D-608.
- Known limitation carried from D-601(5): chart image labels and alt text stay Indonesian. In this run the chart categories come from the payload, so they are in the document's language. No CR-4 or X-01 finding came from the chart.
- No flaky behaviour seen: each checker ran once per pair, and the R1/R2 re-runs on the same engine reproduced the same rule outcomes (63/67 and 65/69).

## Re-run r2 (after running-head fix)

G-FIX clash cycle 1 (D-613). The engine fix is in `delegation_progress/coder_execution_gfix_running_head.md`: `front/running-head-fit.ts` plus `header-footer.ts` fit the default running-head left text to the right-tab position minus the measured classification minus a 4 mm gap, ellipsizing the document title first and then the chapter title. The DEV server (`next dev`, hot reload) served the new code. Templates were unchanged (all 10 at `@2`).

The procedure was the same as r1: the same scripts, the same payloads (`C:/tmp/s36/payload/id.json`, `en.json`, unchanged, sha16 `9c607200108d09f4` and `f849b1700cc7ae79`), the same spec, coverage revision 2, and the full rule set. Only the mission changed, to `2026-11-04_datum-rev-a-dev-gate-r2` (B-FIX in `2026-11-04_datum-rev-a-dev-gate-r2-bfix`), and the output root, to `C:/tmp/s36r2/`. The driver change is limited to reading `S36_ROOT` and `S36_MISSION` from the environment, guarded to the two allowed values, with payloads always read from `C:/tmp/s36/payload`.

### r2 verdict: **PASS 10/10 under D-608** (score >= 85 %, 4/4 critical, 0 clashes on every pair)

| Pair | Tier | Score (n/N) | Critical | Clash PDF | Clash X-* | Coverage (reported only) | Failing rules | **D-608 gate** |
|---|---|---|---|---|---|---|---|---|
| datum-proposal-teknis / ID | SERAH | **94.0 %** (63/67) | 4/4 | **0** | 0 | 39.7 % (11.5/29) | RH-03, RB-05, SB-02, GF-13 | **PASS** |
| datum-proposal-teknis-en / EN | SERAH | **94.2 %** (65/69) | 4/4 | **0** | 0 | 46.6 % (13.5/29) | RH-03, RB-05, SB-02, GF-13 | **PASS** |
| datum-laporan / ID | TERBIT | **94.0 %** (63/67) | 4/4 | **0** | 0 | 39.3 % (11/28) | RH-03, RB-05, SB-02, GF-13 | **PASS** |
| datum-laporan-en / EN | TERBIT | **94.2 %** (65/69) | 4/4 | **0** | 0 | 46.4 % (13/28) | RH-03, RB-05, SB-02, GF-13 | **PASS** |
| datum-laporan-verifikasi / ID | TERBIT | **94.0 %** (63/67) | 4/4 | **0** | 0 | 39.3 % (11/28) | RH-03, RB-05, SB-02, GF-13 | **PASS** |
| datum-laporan-verifikasi-en / EN | TERBIT | **94.2 %** (65/69) | 4/4 | **0** | 0 | 46.4 % (13/28) | RH-03, RB-05, SB-02, GF-13 | **PASS** |
| datum-standar / ID | TERBIT | **94.0 %** (63/67) | 4/4 | **0** | 0 | 39.7 % (11.5/29) | RH-03, RB-05, SB-02, GF-13 | **PASS** |
| datum-standar-en / EN | TERBIT | **94.2 %** (65/69) | 4/4 | **0** | 0 | 46.6 % (13.5/29) | RH-03, RB-05, SB-02, GF-13 | **PASS** |
| datum-nota / ID | NOTA | **90.9 %** (30/33) | 4/4 | **0** | 0 | 40.6 % (6.5/16) | RH-03, RB-05, GF-13 | **PASS** |
| datum-nota-en / EN | NOTA | **91.1 %** (31/34) | 4/4 | **0** | 0 | 46.9 % (7.5/16) | RH-03, RB-05, GF-13 | **PASS** |

**Overall: PASS on 10/10 pairs** under the D-608 release gate. The clash criterion failed in r1 and closed in G-FIX cycle 1, so no further cycle is needed.

- clash.py printed `clash: 0 clashes on 5 pages` (`on 2 pages` for NOTA) and exited 0 on all 10 PDFs.
- `xFailures` and `xUnverified` were empty on all 10.
- `unexercised` = 0 on all 10.

Coverage is still 39.3-46.9 %. It is unchanged from r1 and reported as found (D-608); it is not claimed to meet 85 %. The scorer still prints its own `verdict: FAIL` on every pair. The only reason it gives is `cakupan butir ... < 85 %`, which D-608 treats as non-gating, and no clash reason remains.

**Failing rules and classification (r2).** Per rule id and status, every pair's outcome list is identical to r1 (`sameOutcomesAsR1 true` for 10/10, comparing `C:/tmp/s36r2/score/*.json` with `C:/tmp/s36/score/*.json`). The evidence strings are unchanged:

| Rule | Pairs | Evidence (r2, e.g. `datum-laporan_ID.json`) | Classification |
|---|---|---|---|
| RH-03 | 10/10 | `header word/header4.xml (seksi 3): garis single/C3CBD1/sz 5, harapan 6E1420/sz 6+-1 (+1 temuan lain)` | Known engine deviation (D-598 F-4, D-602, D-604) |
| RB-05 | 10/10 | `word/footer4.xml (seksi 3): sel 1 garis atas single/101418/sz 8, harapan 6E1420/sz 8+-1 (+7 temuan lain)` | Known engine deviation (D-602, D-604) |
| SB-02 | 8 TERBIT/SERAH (n/a for NOTA) | `pita segel 1: warna teks F6E9E9, harapan F4F5F6 (+5 temuan lain)` | Known engine deviation (D-605(1)) |
| GF-13 | 10/10 | `header word/header4.xml (seksi 3): klasifikasi tebal=true warna=101418, harapan tebal 6E1420 (+3 temuan lain)` | Known engine deviation (D-598 F-4, D-602, D-604) |

There are no real new defects, no scorer issues, and no payload artefacts. The fit did not touch the classification. CR-1 still passes with `klasifikasi "TERBATAS" (ANRI, kapital) identik di kepala halaman, register, dan pita segel`, and RH-01 still passes because the entity and chapter label are intact.

### Visual header check

PyMuPDF line extraction (`C:/tmp/s36/hdr.py`) on all 10 r2 PDFs: every interior header is **one line**, at y1 = 45.8 pt, from x0 = 68.2 to x1 = 535.5 pt (the right edge of the 166 mm block). The classification is on the same baseline. In r1 the header had two lines, with `TERBATAS` at y1 = 54.8 pt, x1 = 318.7.

| Crop | File | What it shows |
|---|---|---|
| ID, `datum-laporan` p5 | `C:/tmp/s36r2/work/hdr_laporan_id_p5.png` | `PT GEMILANG SATRIA PERKASA · KAJIAN DESAIN KEAMANAN SISTEM INFORMASI MANAJEMEN ASET… · BAB 6. DESAIN KEAMANAN`, with `TERBATAS` bold and right-aligned on the same line, above the header rule. Nothing overlaps or wraps. |
| EN, `datum-laporan-en` p5 | `C:/tmp/s36r2/work/hdr_laporan_en_p5.png` | `PT GEMILANG SATRIA PERKASA · SECURITY DESIGN STUDY FOR THE PORT ASSET MANAGEMENT… · CHAPTER 6. SECURITY DESIGN`, with `TERBATAS` right-aligned on the same line. The chapter title is complete. |

For comparison, the r1 crops (`C:/tmp/s36/work/hdr_laporan_id_p4.png`, `hdr_laporan_en_p5.png`) show the classification dropped to mid-page on a second line.

Observation (non-gating, cosmetic; no D-608 or manual rule measures it): on page 4 the title is cut inside a word, `... MANAJEMEN ASET PEL…` (ID) and `... MANAGEMENT IN…` (EN). The fit ellipsizes at a glyph boundary (`textfit.ellipsize`). Cutting at the last word boundary would read better (`... ASET…`, `... MANAGEMENT…`). This is a possible refinement for the code review of the fix, not a defect against the gate.

### r2 render and fixture facts

- `studio_write` returned `isError:false`, `dibuat`, and `COMPLETE` for 10/10. Doc numbers ran 009-012 for PT, VER, STD, and NOT, and 162/163 for LAP. Doc ids are in `C:/tmp/s36r2/resp/_write_summary.json`. Warnings were none, except `FRONT_SLOTS_OMITTED` on NOTA.
- R08 was valid for every part: 5 parts per document, 2 for NOTA.
- R17 returned 200, `SUCCEEDED`, `partial:false`, and `failedFormats:[]`. All 20 files matched the server sha256 and returned `x-studio-sha256-verified: true`.
- typeCode, tier, and language equal the template defaults on 10/10.
- DOCX/PDF sha16 by pair:

  | Pair | DOCX | PDF |
  |---|---|---|
  | proposal-teknis | `3f58e446f5da2d6e` | `d68018b9256160f2` |
  | proposal-teknis-en | `4101bde7c7acb4b9` | `6f2bc5ff6133d022` |
  | laporan | `4a486a228fd80415` | `745484775480f938` |
  | laporan-en | `ac49bc9ecb312a04` | `fc54f592f8a94c15` |
  | laporan-verifikasi | `72523a6606c07d6d` | `345ae6584e373422` |
  | laporan-verifikasi-en | `bd989d2136104743` | `db51e18aba471dd7` |
  | standar | `c38559004d71dcff` | `21baf0b7658f913d` |
  | standar-en | `d6377b3b3c330813` | `b3e8be82eb4bb84f` |
  | nota | `f19d7fb11fa7d148` | `87db648473b87c26` |
  | nota-en | `a66010907daa0114` | `a6c5c08efdd39b00` |

- Payload diff within each language (`node C:/tmp/s36r2/diff.mjs`): only `/docKey` and `/template` differ, and the `{mission, meta, sections}` sha is identical within each language (ID `63c198a7d080a337`, EN `b8a747ad25ce668a`). These shas differ from r1 only because the mission is part of the hash.
- r1 against r2 request for `datum-laporan`, with `mission` removed: byte-identical (`cmp` exit 0).
- B-FIX regenerated in `C:/tmp/s36r2/bfix/` (doc ids `cmw28lb4314h5v188w8gn7zke` ... `cmw28lk2014osv188rt0kvz4s`). R08 was valid and the document COMPLETE for 10/10. `bfix_check.py` reported allPresent on 10/10, with 0 other-language forms and 0 forbidden-currency hits.
- `C:/tmp/s36r2/spec.json` is byte-identical to the r1 spec (`cmp` exit 0).

### r2 commands (no secrets)

```bash
export INTERNAL_API_SECRET="$(tr -d '\r\n' < C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/trial_internal_secret)"
export STUDIO_BASE_URL=http://localhost:9021 STUDIO_AGENT_ID=hermes-datum-gate STUDIO_MCP_TOOLSETS=write STUDIO_MCP_FILE_ROOTS=C:/tmp/s36r2
export S36_ROOT=C:/tmp/s36r2 S36_MISSION=2026-11-04_datum-rev-a-dev-gate-r2
for ph in spec write render bfix; do npx tsx C:/tmp/s36/driver.ts $ph; done
node C:/tmp/s36r2/diff.mjs
python -I -B C:/tmp/s36r2/bfix_check.py                    # hermes venv
bash C:/tmp/s36r2/score_all.sh                             # same clash.py + score.ts commands as section 5, T=C:/tmp/s36r2
python -I -B C:/tmp/s36/hdr.py C:/tmp/s36r2/out/*.pdf       # header line extraction
python -I -B C:/tmp/s36/clip.py C:/tmp/s36r2/out/datum-laporan.pdf 5 C:/tmp/s36r2/work/hdr_laporan_id_p5.png
python -I -B C:/tmp/s36/clip.py C:/tmp/s36r2/out/datum-laporan-en.pdf 5 C:/tmp/s36r2/work/hdr_laporan_en_p5.png
```

Logs are in `C:/tmp/s36r2/log/` (`spec.log`, `write.log`, `render.log`, `bfix.log`, `score.log`). A `grep -rlF` of the secret over `C:/tmp/s36r2` and `C:/tmp/s36` returned 0 files. The r2 DEV DB writes were 10 gate documents and 10 B-FIX fixtures in the two `-r2` missions. Nothing was deleted, no code changed in the repo, and nothing was committed.
