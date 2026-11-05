---
task_id: 2026-10-22_doc_artifact_studio
task_slug: doc_artifact_studio
row: C31/C32 (DEV conformance gate, coverage round)
date: 2026-11-05
agent: test-expert
skills: tdd
source_plan: docs/2026-10-22_doc_artifact_studio/identification/03_structured_datum_coverage_round.md (rows C31, C32)
binding_decisions: D-608 (release gate), D-639 (sheet numbering +1 accepted), D-643 (templates v3 on datum-gsp-rev-a-preset)
status: complete
---

# C32 - DATUM Rev A coverage round: DEV conformance gate per template x language

This run was DEV only: `http://localhost:9021` (`next dev`, hot reload, DB `gsp_agent_hq_v21`). The server was not started or stopped. Port 9011, DB `gsp_agent_hq`, and the production checkout were not touched. No production or scorer code was changed, and nothing was committed. The secret was read from its file into the environment and never printed; `grep -rlF` of the secret value across `C:/tmp/c32` returned **0** files.

## Ringkasan

**Overall verdict: PASS 10/10 under D-608.** Every pair has a score of at least 85 % (96.9-97.0 %), 4/4 critical rules, and 0 clashes (PDF and X-*).

As expected, **RH-03 and RB-05 flipped from FAIL to PASS on all 10 pairs**: the seal header rule and the seal register top rule are now opt-ins. The only remaining failures are SB-02 (8 TERBIT/SERAH pairs) and GF-13 (all 10). Both are known engine deviations (D-602, D-604, D-605(1)). LB-11 changed from PASS to N/A on the 8 TERBIT/SERAH pairs because of the C25 scorer update: the verification table now has the manual form, with no role column (D-639 (3)).

All requested visible features are present (section 3), and the body measure is 128 mm. The coverage column is **provisional**: it comes from the current `datum_point_coverage.json` (revision 2), and the C33 re-measure is still in progress.

| Pair | Tier | Template | Score (n/N) | Critical | Clash PDF / X-* | Coverage (provisional, rev 2) | Failing rules | **D-608** |
|---|---|---|---|---|---|---|---|---|
| datum-proposal-teknis / ID | SERAH | @3 | **96.9 %** (64/66) | 4/4 | **0** / 0 | 39.7 % (11.5/29) | SB-02, GF-13 | **PASS** |
| datum-proposal-teknis-en / EN | SERAH | @3 | **97.0 %** (66/68) | 4/4 | **0** / 0 | 46.6 % (13.5/29) | SB-02, GF-13 | **PASS** |
| datum-laporan / ID | TERBIT | @3 | **96.9 %** (64/66) | 4/4 | **0** / 0 | 39.3 % (11/28) | SB-02, GF-13 | **PASS** |
| datum-laporan-en / EN | TERBIT | @3 | **97.0 %** (66/68) | 4/4 | **0** / 0 | 46.4 % (13/28) | SB-02, GF-13 | **PASS** |
| datum-laporan-verifikasi / ID | TERBIT | @3 | **96.9 %** (64/66) | 4/4 | **0** / 0 | 39.3 % (11/28) | SB-02, GF-13 | **PASS** |
| datum-laporan-verifikasi-en / EN | TERBIT | @3 | **97.0 %** (66/68) | 4/4 | **0** / 0 | 46.4 % (13/28) | SB-02, GF-13 | **PASS** |
| datum-standar / ID | TERBIT | @3 | **96.9 %** (64/66) | 4/4 | **0** / 0 | 39.7 % (11.5/29) | SB-02, GF-13 | **PASS** |
| datum-standar-en / EN | TERBIT | @3 | **97.0 %** (66/68) | 4/4 | **0** / 0 | 46.6 % (13.5/29) | SB-02, GF-13 | **PASS** |
| datum-nota / ID | NOTA | @3 | **96.9 %** (32/33) | 4/4 | **0** / 0 | 40.6 % (6.5/16) | GF-13 | **PASS** |
| datum-nota-en / EN | NOTA | @3 | **97.0 %** (33/34) | 4/4 | **0** / 0 | 46.9 % (7.5/16) | GF-13 | **PASS** |

clash.py printed `clash: 0 clashes on 6 pages` (`on 2 pages` for NOTA) and exited 0 on all 10. `xFailures`, `xUnverified`, and `unexercised` were empty or 0 on all 10.

The scorer still prints its own `verdict: FAIL` on every pair. Its only reason is `cakupan butir ... < 85 %`, which is non-gating under D-608. The coverage percentages above are the revision-2 values the scorer read from the file; they do not yet reflect the coverage-round features and must be replaced with the C33 result when it lands.

## 1. Run facts (C31-equivalent)

- **Payloads:** the r2 gate payloads, unchanged: `C:/tmp/s36/payload/id.json` (sha16 `9c607200108d09f4`) and `en.json` (`f849b1700cc7ae79`). Mission `2026-11-05_datum-cov-round-dev-gate`, docKey `gate-<slug>`, agent `hermes-datum-gate`.
- **Payload diff within each language** (`node C:/tmp/c32/diff.mjs`): only `/docKey` and `/template` differ. The `{mission, meta, sections}` sha is identical within each language: ID `ffdddab105a5f85b`, EN `cff1fe5591f37fcb`. These differ from r2 only because the mission is part of the hash.
- **Writes:** `studio_write` returned `isError:false`, `dibuat`, and `COMPLETE` for 10/10. There were no warnings except `FRONT_SLOTS_OMITTED` on NOTA.
- **Templates:** R20 reports all 10 as `@3`, and typeCode, tier, and language equal the template defaults.
- **R08:** valid for every stored part (5 per document, 2 for NOTA).
- **R17:** 200, `SUCCEEDED`, `partial:false`, `failedFormats:[]`. All 20 files match the server sha256 and returned `x-studio-sha256-verified: true`.
- **Doc numbers:** PT 013/014, LAP 166/167, VER 013/014, STD 015/016, NOT 013/014 (XI/2026). Doc ids are in `C:/tmp/c32/resp/_write_summary.json`.
- **B-FIX:** regenerated into `C:/tmp/c32/bfix/` (mission `2026-11-05_datum-cov-round-dev-gate-bfix`). R08 was valid and the document COMPLETE for 10/10. `bfix_check.py` reported allPresent on 10/10, with 0 other-language forms and 0 forbidden-currency hits.
- **Spec:** `docTypeTemplateSpecJson()` wrote `C:/tmp/c32/spec.json`, byte-identical to the r2 spec (`cmp` exit 0). The function exports only typeCode, defaults, language, and kicker, and none of these changed in C23.
- **File sha16 (DOCX / PDF):**

  | Pair | DOCX | PDF |
  |---|---|---|
  | proposal-teknis | `a0efbb4a4ac7689b` | `fb5f463944ce79ae` |
  | proposal-teknis-en | `7ef13c2c798e8e1c` | `c18aa377de9a50a7` |
  | laporan | `5b0d4a582b13ec95` | `e29385aa8e62d311` |
  | laporan-en | `39c4c5b3ef01a5b1` | `e78d302345e8caf0` |
  | laporan-verifikasi | `f32ff2b86a8d3bf2` | `af0b388a46d0cee0` |
  | laporan-verifikasi-en | `c08c626411981ff2` | `78657e7769aa0dfe` |
  | standar | `d8f9fbf210f546a4` | `99ebad45bd77bbbe` |
  | standar-en | `8ca597c518fca63e` | `817694b95d0a3a2d` |
  | nota | `6afb41e47d3ac343` | `cd7bc4f04c62b190` |
  | nota-en | `18963229400ac4ac` | `d644d3ed3e429c1a` |

## 2. Rule changes versus r2

Each pair's outcome list was compared with `verification/dev_gate_r2/<slug>_<lang>.json` by rule id and status. All 10 pairs show these changes and no others:

| Rule | r2 | C32 | Pairs | C32 evidence (`C:/tmp/c32/score/datum-laporan_ID.json`) | Reason |
|---|---|---|---|---|---|
| RH-03 | fail | **pass** | 10/10 | `garis kepala 6E1420 sz 6 di 2 header interior` | Opt-in `runningHead.ruleColour 6E1420` (D-643; manual Tabel 8.1 ID:2576, EN:2646) |
| RB-05 | fail | **pass** | 10/10 | `garis register atas 6E1420 sz 8, bawah C3CBD1 di 2 footer` | Opt-in `device.registerBlock.topRuleColour 6E1420` (ID:2577, EN:2647) |
| LB-11 | pass | n/a | 8 TERBIT/SERAH | `rantai verifikasi bentuk manual (Lapis/Metode/Objek/Hasil; ID:39) tanpa kolom peran` (EN: `Layer/Method/Object/Result; EN:38`) | C25 scorer update for the manual-form verification table (`controlSheet.columns.form manual`, D-639 (3)); the role labels are now checked by LB-06 on the signature row |

Score movement: ID T/S 63/67 to **64/66**, EN T/S 65/69 to **66/68**, NOTA ID 30/33 to **32/33**, NOTA EN 31/34 to **33/34**.

The other C25 rules, CS-04 and LB-10, passed in both runs. CS-04 evidence is now `kepala kolom revision, verification = daftar ID bentuk manual ID:29/39/58, EN:29/38/62`.

**Remaining failures (unchanged from r2):**

| Rule | Pairs | Evidence | Classification |
|---|---|---|---|
| SB-02 | 8 TERBIT/SERAH | `pita segel 1: warna teks F6E9E9, harapan F4F5F6 (+5 temuan lain)` | Known engine deviation, D-605(1) (preset role format overrides `color.wrapper.cream`) |
| GF-13 | 10/10 | `header word/header4.xml (seksi 3): klasifikasi tebal=true warna=101418, harapan tebal 6E1420 (+3 temuan lain)` | Known engine deviation, D-598 F-4, D-602, D-604 (classification run colour INK900) |

There are no new defects, scorer issues, or payload artefacts among the failures.

## 3. Feature checks on the PDFs

Checked with PyMuPDF (`C:/tmp/c32/features.py` writes `C:/tmp/c32/resp/_features.json`), DOCX XML, and page images in `C:/tmp/c32/work/`.

| Feature | Expected | Observed | Result |
|---|---|---|---|
| Page count | T/S gains a back cover | T/S **6 pages** (cover, control sheet, contents, Bab/Chapter 1, Bab/Chapter 6, back cover), up from 5 in r2. NOTA **2 pages**, as in r2 | as expected |
| Back cover | T/S only (C12) | Page 6 of all 8 T/S PDFs carries only the spine string (for example `L A P · E N · R E V A · X I · 2 0 2 6`). NOTA has none, because it has no cover units (`en_p6_back.png`) | present |
| Control-sheet subtitle | T/S | `Kendali dokumen, riwayat revisi, dan pernyataan verifikasi` (ID) and the EN equivalent on page 2 of all 8 T/S PDFs (`id_p2_control.png`) | present |
| Three signature columns | T/S | `DISUSUN · DIPERIKSA · DISETUJUI` (ID) and `PREPARED BY · REVIEWED BY · APPROVED BY` (EN), three columns on the control sheet. Only the first column carries a name and date (`Tim Kajian`, `2026-11-04`) because the payload has no reviewer or approver | present |
| Manual control-sheet columns | T/S | Revisions table `REV / TANGGAL / PENYUSUN / PERUBAHAN / STATUS` with `Berlaku`; verification `LAPIS / METODE / OBJEK / HASIL` | present |
| Cover block with KLASIFIKASI | 8 fields configured, KLASIFIKASI third | Printed in order: NOMOR DOKUMEN, REVISI, **KLASIFIKASI**, PENYUSUN, TIER, BAHASA. KUSTODIAN and DITUJUKAN KEPADA are skipped because the payload has no `custodian`/`audience` (empty fields are skipped by design, `front/texts.ts:315-336`). Payload effect, not a defect | present |
| Preparer unit | ID and EN | Cover PENYUSUN = `Divisi Engineering PT GSP` (ID). Signatures and revisions keep `meta.author`, per D-639 (2) | present |
| Cover title 150 mm | at most 150 mm | Title lines (25 pt) measure 121.5 and 141.5 mm (ID) and 149.4 and 123.8 mm (EN) | within limit |
| Page background | FCFCFB | `<w:background w:color="FCFCFB"/>` in the DOCX, and a full-page FCFCFB fill on every page of all 10 PDFs | present |
| Seal header and register rules | 6E1420 | RH-03 and RB-05 PASS (section 2); visible as dark-red rules in `id_p4_body.png` and `nota_id_p1_footer.png` | present |
| NOTA classification line | NOTA only | Below the register: `Klasifikasi : TERBATAS` (ID, value in seal colour) and `Classification: TERBATAS` (EN), on both pages. clash.py: 0 clashes (G-06 allowance) | present |
| NOTA ISO-date file name | `<judul> <YYYY-MM-DD>.<ext>` | Content-Disposition: `Kajian Desain Keamanan Sistem Informasi Manajemen Aset Pelabuhan 2026-11-04.pdf` / `.docx` (ID) and `Security Design Study ... 2026-11-04.pdf` (EN). Other types keep `<judul> <nomor> RevA` | present |
| STD rule index | absent unless markers exist | No rule-index page and 0 hits of "Indeks Aturan" / "Rule Index" in the PDF or `word/document.xml` of `datum-standar(-en)`. The payload has no rule markers | absent, as expected |
| Sheet numbering restart (ID only) | Restart at Bab 1 | ID T/S: the Bab 1 section carries `<w:pgNumType w:start="1"/>`, and the register reads `LEMBAR 1 DARI 7` (p4) and `LEMBAR 2 DARI 7` (p5). EN T/S: no restart, `SHEET 4 OF 6` and `SHEET 5 OF 6` (RB-08 EN PASS: `tidak ada mulai ulang nomor lembar di 6 seksi`) | present |
| "DARI N" +1 (D-639, accepted) | N may exceed the PDF page count by 1 | ID T/S: **N = 7 on a 6-page PDF** (+1), the known LibreOffice hidden-blank-page effect when Bab 1 starts on an even page. EN T/S: N = 6 = pages. NOTA ID and EN: `1/2`, `2/2` = pages | as accepted in D-639 |
| Body measure 128 mm | 166 mm text width minus a 32 mm rail and gap | DOCX: text width 9411 tw (166.0 mm) with body `w:ind w:right="2154"` (38.0 mm), giving **128.0 mm**. PDF ink extent of the 9.5 pt Serif body lines: x0 24.04 mm to x1 151.99-152.02 mm, giving **127.95-127.98 mm** (laporan, laporan-en, nota, nota-en) | 128 mm |
| 13.5 pt rhythm | Body 9.5/13.5 | GF-06 PASS: `IBM Plex Serif, sz 19, baris 270/exact (4/4 paragraf)` | present |

Observation (non-gating, outside the measured rules): the spine string on the back cover renders horizontally at the top left (x 24 mm, y 30 mm, PyMuPDF `dir (1, 0)`). The cover spine renders the same way in both r2 and C32 (y 161 mm), so this is not a change in this round. The manual places the spine in the outer margin (EN:2766). CV-17 checks the DOCX and passes.

## 4. Failures

None. No pair fails D-608, so no cause or repro is needed.

## 5. Commands (no secrets)

Run from `C:/Users/TRIAL/gsp-swarm-hq-v2.1` in Git Bash. The driver is `C:/tmp/s36/driver.ts` (the r2 driver). Its only change is a guard that accepts this run's output root and mission.

```bash
export INTERNAL_API_SECRET="$(tr -d '\r\n' < C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/trial_internal_secret)"
export STUDIO_BASE_URL=http://localhost:9021 STUDIO_AGENT_ID=hermes-datum-gate STUDIO_MCP_TOOLSETS=write STUDIO_MCP_FILE_ROOTS=C:/tmp/c32
export S36_ROOT=C:/tmp/c32 S36_MISSION=2026-11-05_datum-cov-round-dev-gate
for ph in spec write render bfix; do npx tsx C:/tmp/s36/driver.ts $ph; done
node C:/tmp/c32/diff.mjs                                   # payload diff within each language
V=C:/Users/TRIAL/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe
$V -I -B C:/tmp/c32/bfix_check.py                          # B-FIX expected strings
bash C:/tmp/c32/score_all.sh                               # per pair:
#   $V -I -B benchmark/datum_conformance/clash/clash.py --pdf C:/tmp/c32/out/<slug>.pdf --docx C:/tmp/c32/out/<slug>.docx \
#       --no-convert --out C:/tmp/c32/clash/<slug>.json --work-dir C:/tmp/c32/work
#   npx tsx benchmark/datum_conformance/score.ts --docx C:/tmp/c32/out/<slug>.docx --template <slug> --language ID|EN \
#       --tier <SERAH|TERBIT|NOTA> --produced-by mcp --bfix C:/tmp/c32/bfix/<slug>.docx --spec C:/tmp/c32/spec.json \
#       --clash C:/tmp/c32/clash/<slug>.json \
#       --coverage docs/2026-10-22_doc_artifact_studio/verification/coverage/datum_point_coverage.json --out C:/tmp/c32/score
#   (full rule set; no --implemented-only)
$V -I -B C:/tmp/c32/features.py                            # page count, register N, body measure, background, features
node C:/tmp/c32/names.mjs                                  # Content-Disposition file names (headers only)
$V -I -B C:/tmp/c32/snap.py <pdf> <page> <png> <dpi> [clip] # page images in C:/tmp/c32/work/
```

Evidence (all under `C:/tmp/c32/`): `req/`, `resp/` (`_write_summary.json`, `_render_summary.json`, `_bfix_summary.json`, `_bfix_text_check.json`, `_payload_diff.json`, `_features.json`), `out/`, `bfix/`, `clash/`, `score/<slug>_<LANG>.json|.md`, `work/*.png` (`id_p2_control.png`, `en_p6_back.png`, `nota_id_p1_footer.png`, `id_p4_body.png`), `log/` (`spec.log`, `write.log`, `render.log`, `bfix.log`, `score.log`, `names.log`).

DEV DB writes: 10 gate documents and 10 B-FIX fixtures in the two `2026-11-05_datum-cov-round-dev-gate(-bfix)` missions. Nothing was deleted.

## 6. Notes

- **Coverage is provisional.** When C33 publishes `coverage/datum_point_coverage_r3.json`, re-run only the score step (`score.ts ... --coverage <r3>`); the clash and rule results do not depend on coverage. D-608 does not gate on coverage.
- **File name differs from the blueprint.** Row C32 names the output `32_coverage_round_conformance_dev.md`; this file uses the name the coordinator gave, `32_coverage_round_dev_gate.md`.
