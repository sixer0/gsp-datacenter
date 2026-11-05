---
task_id: 2026-10-22_doc_artifact_studio
task_slug: doc_artifact_studio
row: C25
date: 2026-11-05
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/03_structured_datum_coverage_round.md
status: complete
---

# Implementation Report: C25 scorer alignment (CS-04, LB-10, LB-11)

Skills loaded: `tdd`, `dry-run-verify-fix`. Inputs read: blueprint 03 row C25, research/38 §3.2, §6, decision D-635 (5), research/32 CS-04 row, `catalog.ts:85`, engine reports B and C. Manual lines checked against `C:/Users/TRIAL/gsp-backups/datum-revA-20261104/manual_id.txt` / `manual_en.txt`: ID:29 `REV TANGGAL PENYUSUN PERUBAHAN STATUS`, ID:39 `LAPIS METODE OBJEK HASIL`, ID:58 `SALINAN PEMEGANG MEDIA KEMBALI`, EN:29 `REV DATE PREPARED BY CHANGE STATUS`, EN:38 `LAYER METHOD OBJECT RESULT`, EN:62 `COPY HOLDER MEDIUM RETURN`.

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Read inputs, verify manual lines | done | All six lines verified verbatim (above) |
| 2 | CS-04 tests (manual pass, engine pass, broken/mixed/foreign/short fail) | done | Red: 3 failed, then green |
| 3 | CS-04 alignment | done | `expect_structure_a.ts` `manualColumns`; `structure_a.ts` form detection |
| 4 | LB-10/LB-11 tests | done | Red: 3 failed (manual ID, manual EN, header-less change column), then green. The LB-11 partial-header guard passes before and after, by design |
| 5 | LB-10/LB-11 alignment | done | `expect_language.ts` `revisionChangeHeads`, `manualVerificationHeads`; `language.ts` |
| 6 | Cross-module pin (language heads = structure_a heads) | done | Test in `language.test.ts` |
| 7 | Checks: RH-03/RB-05, CL-02 NOTA line, back cover, rule index | done | Real engine renders with all opt-ins on, see Verification |
| 8 | Gates and re-score | done | See Test Results |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| `benchmark/datum_conformance/rules/expect_structure_a.ts` | modify | New `manualColumns` per language (revision/verification/distribution), each list commented with its manual line. `columns` (engine form) kept unchanged |
| `benchmark/datum_conformance/rules/structure_a.ts` | modify | `controlTables` fallback also recognises the manual lists. CS-04 (`:711`): the document is in manual form when any control table header equals the manual list of the pair's language; then **all** tables must equal the manual lists, otherwise all must equal the engine lists. One form param governs the three tables (`controlSheet.columns.form`), so a mixed document fails. Evidence text names the form and cites ID:29/39/58, EN:29/38/62 |
| `benchmark/datum_conformance/rules/expect_language.ts` | modify | `revisionChangeHeads` (ID `Uraian`, `Perubahan`; EN `Change`) and `manualVerificationHeads` (ID:39, EN:38) |
| `benchmark/datum_conformance/rules/language.ts` | modify | LB-10 (`:872`): change column located by header (union of both languages' labels, locator only); no such header = fail with reason, never a fixed index. LB-11 (`:888`): N/A only when the chain header equals a manual list exactly (ID:39 / EN:38), reason cites the line; any other header keeps the role check |
| `tests/unit/studio/datum-conformance/structure-a.test.ts` | modify | `MANUAL` heads + `manualControlSheetBody` (rows as C10 emits: `[rev, date, by, what, STATUS]`, `[layer, "", "", ""]`, `[copy, holder, "", ""]`); 3 tests: manual ID/EN pass and engine pass; broken / mixed / foreign / short-distribution fail; manual DOCX passes every applicable structure_a rule (CS-07, CS-10 with a numbered copy too) |
| `tests/unit/studio/datum-conformance/language.test.ts` | modify | `sample()` accepts `revRow`/`verRow`; `MANUAL_HEADS` + `manualSample`; 7 tests: manual ID/EN full language run (LB-10 pass, LB-11 N/A citing ID:39/EN:38, 0 X clashes, critical gate ok), engine form LB-10/LB-11 pass, LB-10 wrong note in PERUBAHAN/CHANGE fails and unknown change header fails, LB-11 N/A only for the exact manual header, cross-module head pin |

No file outside `benchmark/datum_conformance/rules/**` and `tests/unit/studio/datum-conformance/**` was edited (`git status --short benchmark tests/unit/studio/datum-conformance` lists only the 6 files above). No commits.

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Datum-conformance suite | `npx vitest run tests/unit/studio/datum-conformance` | `Test Files 12 passed (12)`, `Tests 245 passed (245)` | includes 10 new tests (3 structure_a, 7 language) |
| Clash pytest | `<hermes venv python> -I -B -m pytest -p no:cacheprovider -q benchmark/datum_conformance/clash/tests` | `33 passed in 9.12s` | |
| Typecheck | `npx tsc --noEmit -p .` | exit 0, no output | |
| Lint | `npx eslint benchmark/datum_conformance/rules tests/unit/studio/datum-conformance` | exit 0, no output | |
| DEV gate r2 re-score | `score_all.sh` commands with outputs redirected (`<scratchpad>/rescore.sh <scorer> <outdir>`), run once with the HEAD scorer (`git archive HEAD benchmark/datum_conformance`) to `C:/tmp/c25/before`, once with the C25 scorer to `C:/tmp/c25/after`. The originals in `C:/tmp/s36r2/{clash,score}` were not overwritten | **0 rule-status changes on all 10 pairs**; scores identical to the r2 originals: ID T/S 63/67 = 94.0 %, EN T/S 65/69 = 94.2 %, NOT 30/33, NOT-en 31/34; critical 4/4; 0 clashes | Score exit 1 on every pair, same as the original r2 log (`C:/tmp/s36r2/log/score.log`): coverage points below 85 %, which is the known pre-round coverage gate, not a scorer change |
| Calibration (verification/21 §12 commands, HEAD vs C25 scorer, `C:/tmp/c25/cal/{head,c25}`) | datum-gsp a/b, datum-kanonik a/b, Manual 000, 12 DOCX mutants | 16 of 17 identical. **Manual 000: 74.6 % -> 76.1 % (50/67 -> 51/67), only CS-04 fail -> pass.** Manual 000 prints exactly `[Rev, Tanggal, Penyusun, Perubahan, Status]`, `[Lapis, Metode, Objek, Hasil]`, `[Salinan, Pemegang, Media, Kembali]`, so this is the cited rule doing what the manual says | Mutant scores unchanged (deliberate mutants still fail as before) |

## Verification
- **CS-04 manual form passes, engine form passes, broken fails:** `structure-a.test.ts:556`, `:563`, `:580` green. On real engine output with `controlSheet.columns.form = manual` (`C:/tmp/c25/r/T_ID.docx`, `T_EN.docx`): HEAD scorer CS-04 fail, C25 scorer pass ("kepala kolom revision, verification, distribution = daftar ID bentuk manual ID:29/39/58, EN:29/38/62").
- **LB-10 by header:** `language.test.ts` C25 block green. Real output: HEAD fail, C25 pass ("catatan revisi bawaan \"Terbit pertama\"").
- **LB-11 N/A in manual form:** real output HEAD fail, C25 `na` ("rantai verifikasi bentuk manual (Lapis/Metode/Objek/Hasil; ID:39) tanpa kolom peran"). Engine form unchanged (pass).
- The real-output set: `render_cli.ts` with the `datum-gsp` template plus every R-67..R-80 opt-in on (including `render.nota.classificationLine` on T/S as a stress case, a `ruleIndex` slot and two `DT-xx WAJIB/BAKU` markers), ID and EN, TERBIT and NOTA, DOCX + PDF in `C:/tmp/c25/r/`; scores in `C:/tmp/c25/on/{head,c25}`, clash in `C:/tmp/c25/on/clash`. On this set, head -> C25 changes only CS-04, LB-10, LB-11 (T/S), and nothing on NOTA. Other failures in that set (CV-07, CV-16, TR-03, TR-08, CR-2/NU-02 on NOTA, CR-3) come from my ad-hoc payload (no kicker, no `render.toc.mode=field`, typeCode STD on a NOTA pair, no B-FIX), not from the scorer.

### Checks requested (no rule changed)
| Check | Result | Evidence |
|---|---|---|
| RB-05 with seal register rule (R-73) | PASS on real output, all 4 renders | "garis register atas 6E1420 sz 8, bawah C3CBD1 di 5 footer" |
| RH-03 with seal running-head rule (R-72) | Rule is correct: PASS on a copy whose header bottom border is `single sz 5 6E1420` (what R-72 emits per engine C) (`C:/tmp/c25/r/T_ID_rh72.docx`, `N_EN_rh72.docx`). **But R-72 does not reach the output under the `datum-gsp` preset** (engine finding F1 below) | RH-03 on the unpatched real output: "garis single/C3CBD1/sz 5" |
| CL-02 NOTA line vs RB-03/RB-04/X detectors | RB-02, RB-03, RB-04 (ID), X-01..X-05, CR-4 all PASS with `Klasifikasi : TERBATAS` / `Classification: TERBATAS` under the register, on NOTA and T/S | `C:/tmp/c25/on/c25/*.json`. **But clash.py G-06 flags it: 5 clashes per document** (finding F2) |
| Back cover (no PAGE field) | Treated like the cover for RB/RH: `buildLayout` classes it neither wrapper nor interior (`lib/layout.ts:72-86`: interior = default footer has PAGE; wrapper = before the first interior), so RB-01..RB-06 and RH-01..RH-04 skip it, as they skip the cover. It carries explicit empty header/footer parts (`header9.xml`/`footer9.xml`, no PAGE). RB-07 and SB-01 PASS. TR-02 PASS on NOTA (no back cover there). RB-07 only checks front pages (its subject, ID:2510); extending it to the back cover would be a tightening without a manual line, so not done | Section list "8:-" in TR-03 observed text, T_ID |
| Rule-index table vs caption/SOURCE rules | LB-09 PASS ("2 keterangan dan 3 label aparatus berbahasa ID/EN"; the index SOURCE run is a valid SUMBER/SOURCE label), CR-4 PASS for EN (no foreign apparatus label), GF-10 PASS. The index table has no caption by design and is not counted as one | T_ID, T_EN, N_ID, N_EN outcomes |
| CS-03 in manual form | No change needed: manual specimen is A/B/C without a method block (ID:27/37/56, EN:27/36/60); the engine prints A/B/C/D with a method block. CS-03 checks sequence and order only, so both pass | manual lines read |

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| F1: R-72 `runningHead.ruleColour` is inert under the `datum-gsp` preset, so RH-03 will **not** flip to PASS as research/38 §6.1 projects | 0 (not my file) | `runningHeadBody` builds `{ ...runningHeadFormat(textW, p), ...(spec.format ?? {}) }` (`src/lib/studio/engine/docx/package/header-footer.ts:170`); the `datum-gsp` preset section plan carries `header.format.borders.bottom = {single, 5, C3CBD1}` (`C:/tmp/c25/in/datum-gsp.preset.json`), which overwrites the param's border. The Rev A preset is based on `datum-gsp-preset`, so the 10 templates inherit it. Engine C's tests use fixtures without that section plan | Open, engine owner | Not for C25; affects C32 score projection (RH-03 stays FAIL) |
| F2: clash.py G-06 counts the NOTA classification line as a wrapped register label: "label wraps in register zone 'register/footer cell 1': 2 baselines", 5 clashes per document (one per interior page) | 0 (clash.py is not mine) | The register zone is the whole footer box with `single_line=True` (`clash.py:516`, G-06 loop `:548-566`); C16 puts the line as a separate paragraph under the register row. The manual asks for exactly that: "Tulis klasifikasi kapital di baris tersendiri di bawah nomor" (ID:611), "Baris Klasifikasi : di bawah Nomor" (ID:612-613), "a Classification: line under the number" (EN:647-649) | Open | **Blocking for C32/C44 on the two NOTA pairs** (gate "0 clashes on every pair"; R-76 is set on the NOT type layer). Needs a clash.py alignment (owner of `clash/clash.py`), for example bounding the register zone to the register table rows or allowing one classification line below cell 1, cited to ID:611-613 / EN:647-649 |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 3 | research/38 §6.2 says "replace the per-language expectation with the manual lists"; the brief says keep accepting engine columns for documents not in manual form | Both kept: form detected per document, then **all** tables judged against that one form. Stricter than "either list per table" (a mixed document fails), so no loosening |
| 5 | LB-10 column locator uses both languages' labels | Locator only: the note check itself stays per pair language, and a foreign header is CS-04/CR-4's finding, so LB-10 does not double-penalise it |
| 5 | LB-11 N/A trigger | Only an exact manual header list (ID:39 or EN:38). A header like `Layer, Method, Name, Date` keeps the role check and fails (tested) |
| 7 | Cosmetic, not changed: RH-03's pass text prints the expected size (`sz 6`) rather than the observed one | No manual-backed change; left as is |
| 7 | Scratchpad slip: I first extracted `git archive HEAD benchmark/datum_conformance` into a pre-existing shared scratch folder `<scratchpad>/head/`, overwriting its `benchmark/datum_conformance/` with HEAD content, and briefly added a `node_modules` junction there (removed with `rmdir`; the target `node_modules` is intact, 505 entries). The HEAD copy used for scoring is `<scratchpad>/c25_head/` | Recorded; no repo file affected |

## Next Steps
- Controller: route F2 to the owner of `benchmark/datum_conformance/clash/clash.py` before C32 (NOTA pairs would show 5 clashes each).
- Controller: route F1 to the engine owner (C14 follow-up) or record RH-03 as staying FAIL in the C32 projection.
- Review recommended: scope = the 6 files above (scorer alignment only).
