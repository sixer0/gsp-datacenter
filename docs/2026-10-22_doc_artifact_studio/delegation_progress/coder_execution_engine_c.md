---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: C14, C16, C26, C13 (blueprint identification/03_structured_datum_coverage_round.md:191-204)
date: 2026-11-05
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/03_structured_datum_coverage_round.md
binding: research/38 (R-71, R-72, R-73, R-76, R-80; §3.7; K-5, K-7), research/35 §5, research/36, D-627 (Q4), D-631, D-635
status: complete (C26 has one finding the controller needs to decide on, see "Decision needed")
---

# Implementation Report: engine rows C14 (GF-22), C16 (CL-02 NOTA), C26 (RB-08c), C13 (GF-19)

Skills loaded: `tdd`, `dry-run-verify-fix`. Each row was test-first: new tests red, then code, then green. Nothing committed. No DB writes by me, no ports opened. The studio suite gate itself writes and deletes temporary DEV fixtures (`tests/unit/studio/api-structure/_db.ts`), as in every earlier gate run.

## Decision needed (C26, for C23 / C33)

With `device.registerBlock.sheetNumbering = "bab1"`, LibreOffice 24.2 shows "DARI N" as the document page count **plus one hidden blank page** when Chapter 1 starts on an even physical page. On the a_terbit sample (cover, control sheet and TOC = 3 pages, so Chapter 1 is physical page 4), the PDF has 7 pages but the register shows `LEMBAR 1..4 DARI 8`. Cause, measured: LibreOffice inserts an automatic empty page so that page number 1 (odd) falls on a right-hand page. The repo's default PDF export skips that page, but NUMPAGES still counts it. With `IsSkipEmptyPages=false` the PDF has 8 pages, and page 4 is blank. When Chapter 1 starts on an odd physical page, N is correct (NOTA sample: `LEMBAR 1..4 DARI 4`, 4 pages).

The engine output follows the spec: one `w:pgNumType w:start="1"` and NUMPAGES kept. The "+1" comes from LibreOffice layout, not from the DOCX. Options for the controller:
(a) keep `bab1` in the 5 ID templates (C23) and record that N can be +1 in LibreOffice PDFs. Word does not insert the page;
(b) do not seed `bab1`, and score RB-08c by the "practice" reading (D-627 alternative);
(c) a later row that changes the wrapper page parity. No engine-only fix exists that keeps PAGE then NUMPAGES (CR-4).

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Read the blueprint rows, register research/38 (§1.2, §3.7, §6.3, K-5, K-7), research/36, D-627, D-631, D-635, C06/C07 report, engine package code | done | |
| 2 | Pre-state baseline | done | `compare: 8/8 SAME` + the 4 expected INFO lines (`C:/tmp/eC_baseline_pre.txt`) |
| 3 | C14: test red (4 failed), then code, then green | done | |
| 4 | C16: found where NOTA prints its number; test red (4 failed), then code, then green | done | Placement in the next section |
| 5 | C26: test red (3 failed), then code, then green; LibreOffice probe NUMPAGES vs SECTIONPAGES | done | Finding above |
| 6 | C13: test red (3 failed), then code, then green; PDF background check with PyMuPDF | done | |
| 7 | Gates: tsc, eslint, studio suite, baseline, convert_v2 x3, grep for slug/type branching | done | All pass |

## C16 placement: where the NOTA number is printed, and why the line goes there

- NOTA output has no cover, no control block and no number block in the body. The only place the document number is printed is **cell 1 of the footer register block**, `GSP · <nomor>`, on every interior page. Evidence: the text of the baseline `b_nota_datum_gsp.docx`. `document.xml` starts at "BAB 1" and `footer1..4.xml` = `GSP · 017/GSP/KT/XI/2026 REV A · 04-XI-2026 LEMBAR 1 DARI 1 TERBATAS`. This matches register risk K-7.
- Manual: "Tulis klasifikasi kapital di baris tersendiri di bawah nomor" (ID:611); the letter specimen is `Nomor :` with `Sifat : TERBATAS` on the next line (ID:4100-4101). EN:647 says "a Classification: line under its number".
- Placement chosen: a **separate paragraph directly under the register row**, indented to the text edge of the cell that holds `{nomor}`. That is cell 1, so the indent is 0. Its text is `Klasifikasi : <K>` (ID) / `Classification: <K>` (EN), built with `classificationLineText` (texts.ts, C07). The label uses the grey register label run (Mono 6 pt, 6B7783). The value is in capitals (`classificationMarkText`), bold, and coloured by `color.wrapper.seal` (6E1420, DT-28d "seal, bold").
- Why not inside cell 1: the scorer reads cell 1 as exactly `GSP · <nomor>`. RB-02 matches the cell 1 pattern. RB-03 rejects U+0020 in literal register runs, and the manual's `" : "` has spaces. RB-04 treats every text run after the `GSP · ` prefix as part of the number and requires it to be bold ink900. Putting the line in the cell would fail RB-03 and RB-04 on every NOTA footer. The register table stays byte-identical to the default (tested).
- PDF evidence (b_nota, LibreOffice): `GSP · 017/GSP/KT/XI/2026` at x 68.2, y 783.3, and `Klasifikasi : ` at x 68.2, y 796.2, followed by `TERBATAS` in 0x6e1420 SemiBold. The line sits under the number at the same left edge. The body is unchanged: the last body line y is the same on all 4 pages. The footer grows upward by one line (8.4 pt), and the page count stays at 4.
- Guard: if the register uses explicit `spec.cells`, or no cell pattern contains `{nomor}`, nothing is printed and the engine logs warn `CLASSIFICATION_LINE_NO_NUMBER`.
- The param is not limited to NOTA by a tier or type branch. The 10-template layer sets R-76 only on the NOTA type layer (register §1.3 "NOT type layer only"). If R-76 is enabled on a T/S document, the same line prints under its register (tested: only footers with a register table get it, and wrapper footers stay byte-identical).

## Changes Made

| File | Change Type | Description |
|---|---|---|
| `src/lib/studio/engine/docx/package/header-footer.ts` | modify | C14: `runningHeadFormat` reads R-72 and `registerBody` reads R-73 through `normalizeHex(...) ?? INK200/INK900`, so absent or invalid values give today's bytes. C16: `classificationLineXml` + a `unit` argument for `registerBody`; shared `registerCellLeftTw`. C26: `buildSectionPackage` passes `{ pgNumStart: 1 }` to the section of the first `kind === "chapter"` unit when R-80 = `bab1` (read from that unit's effective params) |
| `src/lib/studio/engine/docx/package/section.ts` | modify | C26: `PARAM_SHEET_NUMBERING`, `sheetNumberingFromChapter1(params)` (only `"bab1"` is true; absent, `dokumen` or unknown values are false), and an optional third argument `SectPrOptions.pgNumStart` for `sectPrXml`, which writes `<w:pgNumType w:start="n"/>` in CT_SectPr order (after `pgMar`, before `cols`). The 2-argument signature exported from `package/index.ts` is unchanged |
| `src/lib/studio/engine/docx/package/parts.ts` | modify | C13: `pageBackgroundColour(tpl)` returns the colour only when R-71 is true and `color.interior.paper` is valid hex, so both elements are written together or not at all. `withPageBackground(documentXml, colour)` inserts `<w:background w:color>` right before `<w:body` (CT_Document order). `settingsXml` writes `<w:displayBackgroundShape/>` right after `<w:zoom/>` |
| `src/lib/studio/engine/docx/package/index.ts` | modify | C13: `buildDocxPackage` passes `word/document.xml` through `withPageBackground`. The background goes in at package level because `document.xml` is built in `docx/assemble/**`, which this row does not own |
| `tests/unit/studio/renderers/engine-c-coverage-round.test.ts` | add | 31 tests (ID and EN on the `doc_terbit_report` and `doc_nota_memo` fixtures, full `assembleDocxDetailed`, XML inspection, sha256 byte-identity for absent = default) |

NOTA number-block renderer: no separate renderer exists. The NOTA number lives in the register block, `header-footer.ts` (declared). Files not touched: `texts.ts` (read only), `wrapper/**`, `compose/**`, `docx/assemble/**`, `html/**`, params, `prisma/**`, `scripts/**`, `benchmark/**`.

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| New tests | `npx vitest run tests/unit/studio/renderers/engine-c-coverage-round.test.ts` | `Tests 31 passed (31)` | Red first per row: C14 4 failed, C16 4 failed, C26 3 failed, C13 3 failed |
| Studio suite | `npx vitest run tests/unit/studio` | exit 0, `Test Files 271 passed (271)`, `Tests 4921 passed (4921)` | `C:/tmp/eC/gate_vitest.txt` |
| Typecheck | `npx tsc --noEmit -p .` | exit 0 (final run) | An earlier run failed only in `src/lib/studio/engine/html/assemble/slots.ts` (`isRuleIndexAutoMarker`, `PARAM_RULE_INDEX_FROM_MARKERS`, `expandRuleIndexMarker` not found). That was another agent's in-flight work, not my file; the next run was clean. My own test file had one TS2542 error (writing to a readonly ParamMap), now fixed |
| Lint | `npx eslint src/lib/studio/engine/docx/package/ tests/unit/studio/renderers/engine-c-coverage-round.test.ts` | exit 0 | |
| Baseline | `npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root C:/Users/TRIAL/gsp-swarm-hq-v2.1 --out C:/tmp/bl_eC --inputs .../datum-rev-a-baseline/inputs --compare C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline` | exit 0, `compare: 8/8 SAME`, exactly 4 `INFO compose snapshot` lines (a_terbit_datum_gsp, b_nota_datum_gsp, a_terbit_datum_kanonik, b_nota_datum_kanonik) | `C:/tmp/eC/gate_baseline.txt`; re-run after the last (comment-only) edit: `C:/tmp/eC/gate_baseline_final.txt` |
| convert_v2 | `npx tsx benchmark/extract/convert_v2.ts --check`, 3 runs | each exit 0, SAME x3: doc.v2 `79290e07...`, template.v2 `882057c5...`, preset `a951b149...` | `C:/tmp/eC/gate_conv_{1,2,3}.txt` |
| No branching | `git diff -U0 src/lib/studio/engine/docx/package/ \| grep "^+" \| grep -iE "slug\|typeCode\|tier\|NOTA\|TERBIT\|SERAH\|language ===\|=== \"EN\"\|=== \"ID\""` | no match (grep exit 1) | Only `unit.kind === "chapter"` (unit kind, as `singleSectionIndex` already does) |

## Verification

- **C14:** default gives a header bottom border `single sz 5 C3CBD1` and register top `single sz 8 101418`. With both params at 6E1420, both rules are 6E1420 at the same sizes, and the register bottom/right stay C3CBD1. The two params work independently. `#6e1420` is normalised; invalid values give the same bytes as the default. Absent = explicit default = default, by sha256 (ID and EN). On the a_terbit PDF sample both rules carry 6E1420 (DOCX inspection).
- **C16:** with R-76 on, the line appears in ID and EN, the value is in capitals (`terbatas` -> `TERBATAS`), the register table is byte-identical, and wrapper footers are unchanged. Absent = false = default, by sha256. The PDF geometry is in the placement section.
- **C26:** with `bab1` there is exactly one `<w:pgNumType w:start="1"/>`, in the section whose header carries "Bab 1" / "Chapter 1". Cover, control sheet and TOC sections come before it, and their footers stay without fields. Every header and footer part is byte-identical to the default, and register cell 3 keeps the fields `PAGE`, `NUMPAGES` in that order. The only difference in `document.xml` is that one element. On NOTA the first section gets it. Absent = `dokumen` = an unknown value = default, by sha256.
  - PDF (LibreOffice 24.2, `C:/tmp/eC`), page numbers by text extraction:
    - a_terbit with `bab1`: pages 1-3 have no register; pages 4-7 show `LEMBAR 1 DARI 8` .. `LEMBAR 4 DARI 8` (7 PDF pages).
    - Default a_terbit: `LEMBAR 4..7 DARI 7`.
    - b_nota with `bab1`: `LEMBAR 1..4 DARI 4`.
  - Field probe, same DOCX with ` NUMPAGES ` replaced by ` SECTIONPAGES `: `LEMBAR 1..4 DARI 1`. SECTIONPAGES counts per section, and every chapter is its own section, so it cannot give a total counted from Chapter 1.
  - Chosen field: **NUMPAGES**. It is the field that keeps CR-4 safe: RB-02 and the CR-4 marker require PAGE then NUMPAGES.
  - What "OF N" shows: the whole document's page count as laid out by LibreOffice, wrapper pages included. That matches the manual's own practice, "LEMBAR 47 DARI 98" with 98 = PDF pages (ID:2497, ID:52). It is one more than the PDF when Chapter 1 starts on an even physical page (Decision needed).
- **C13:** with R-71 on there is exactly one `<w:background w:color="FCFCFB"/>`, right before `<w:body>`, and `<w:zoom w:val="bestFit"/><w:displayBackgroundShape/>`. Apart from those two elements, `document.xml` and `settings.xml` are unchanged. The colour follows `color.interior.paper` (FFE0E0 test). An invalid paper colour writes neither element.
  - PyMuPDF on the a_terbit (7 pages) and b_nota (4 pages) PDFs: every page samples `#FCFCFB` at 4 points, with one full-page fill `(0.9882, 0.9882, 0.9843)`. The default PDF is `#FFFFFF` with no fill.
  - **GF-19 partial (D-631):** `w:background` is a single child of `w:document`, so the wrapper paper FBFAF7 cannot differ from the interior paper FCFCFB. The cover, control sheet and TOC also get FCFCFB.

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| "DARI N" is +1 under `bab1` in LibreOffice when Chapter 1 starts on an even physical page | 3 probes: default export, `ExportBlankPages`, `IsSkipEmptyPages=false`; plus the SECTIONPAGES variant | LibreOffice inserts an automatic empty page for page-number parity, and NUMPAGES counts it | Documented; decision with the controller | No for these rows; yes for whether C23 seeds `bab1` |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| C16 | NOTA has no number block; the number appears only in register cell 1 | Line under the register row, aligned to the number cell; cells unchanged so RB-02, RB-03 and RB-04 stay intact |
| C16 | Value colour | `color.wrapper.seal` (existing token "Pita segel dan klasifikasi", 6E1420), no new literal; INK900 fallback if the token is unreadable |
| C16 | ID separator `" : "` per the manual / D-635, not `"Klasifikasi:"` | Taken from `classificationLineText` (C07); no text literal in the engine |
| C26 | NUMPAGES vs SECTIONPAGES | NUMPAGES (CR-4); SECTIONPAGES measured wrong ("DARI 1") |
| C26 | Which section restarts | First unit with `kind === "chapter"`; v2 placeholder chapters are re-kinded to `slot` by `planUnits`, so an empty chapter cannot take the restart. If `render.docx.breakPerUnit = false`, the single section kept is that same first chapter, which is harmless |
| C26 | Interior units before Chapter 1 that are not wrappers (none in the current templates) would keep document-order PAGE values | Not handled; no current template has one |
| C13 | Insertion point | Package level (`buildDocxPackage`), because `docx/assemble/**` is owned by another row |

## Next Steps

- Controller: decide the C26 "DARI N" option before C23 seeds `bab1`.
- C22 (HTML parity) can read R-72/R-73 with the same `normalizeHex(...) ?? default` rule.
- Review recommended (scope: the 4 package files above + the new test).

## RH-03 precedence fix (C25 finding F1, 2026-11-05)

status: complete

**Problem.** R-72 `runningHead.ruleColour` had no effect under the `datum-gsp` preset. `runningHeadBody` builds `{ ...runningHeadFormat(textW, p), ...(spec.format ?? {}) }`. The preset's `render.section.interior.header.format.borders.bottom = {single, 5, C3CBD1, space 1}` replaced the whole `borders` object, so the R-72 colour was dropped. The 10 Rev A templates inherit this, so RH-03 (seal 6E1420, 0.26 mm, ID:2575/2576) kept failing.

**Fix** (`src/lib/studio/engine/docx/package/header-footer.ts` only).
- New `runningHeadRuleOverride(p)` returns the normalized R-72 hex only when it is valid and **different from the registry default** (`PARAMS_BY_KEY.get("runningHead.ruleColour").default` = C3CBD1). This is the same rule as HTML `ruleColourOverride` (`html/base/shell.ts:160`).
- `runningHeadBody`: after the merge, if an override exists and the effective format has a bottom border, only that border's `color` is replaced. `val`, `sz` and `space` stay as the preset gives them.
- R-72 absent, equal to the default (any case, with or without `#`) or invalid: nothing changes, so the preset border wins exactly as before.

**Width.** The rule width comes from the preset (`sz 5`) and is the same as the engine default (`sz 5`). RH-03 checks `sz 6 ±1` (`structure_b.ts:368-382`, `RULE_SIZE.runningHead ± RULE_SIZE.tol`). `sz 5` (0.22 mm) is inside that tolerance, and it passes on real output (below). No width opt-in is needed, and no new param was added. Note: exactly 0.26 mm would be `sz 6`. If the controller wants the exact value rather than the tolerance, that needs a new param or a preset change (decision, not done).

### Test Results (fresh, 2026-11-05)
| Check | Command | Result |
|---|---|---|
| TDD red | `npx vitest run tests/unit/studio/renderers/rh03-rule-colour-precedence.test.ts` before the fix | 4 failed / 2 passed. The opt-in cases (ID, EN, `#6e1420`, opt-in over AABBCC) gave C3CBD1/AABBCC; the byte-identity cases already passed |
| TDD green | same + `engine-c-coverage-round.test.ts` | `Test Files 2 passed`, `Tests 37 passed (37)` |
| Typecheck | `npx tsc --noEmit -p .` | exit 0, no output |
| Lint | `npx eslint <header-footer.ts> <new test>` | exit 0, no output |
| Baseline | `render_id_samples.ts ... --out C:/tmp/bl_rh03 ... --compare C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline` | `compare: 8/8 SAME`, exactly the 4 `INFO compose snapshot` lines |
| convert_v2 | `npx tsx benchmark/extract/convert_v2.ts --check` x3 | each exit 0, SAME x3 (doc.v2 `79290e07...`, template.v2 `882057c5...`, preset `a951b149...`) |
| Full suite | `npx vitest run` | 284 files passed, 2 failed, 1 skipped; 5080 tests passed, 12 failed. Neither failure is from this change: (1) `engine-e-coverage-round.test.ts` (C19, another agent's untracked test) was red while its files were mid-edit; re-run on its own afterwards: `24 passed (24)`. (2) `agent-roster.test.ts` imports only `@/lib/agent-roster` and reads the real `C:/Users/TRIAL/AppData/Local/hermes/profiles` directory (machine-dependent, no studio code) |
| RH-03 on real output | `render_cli.ts --doc C:/tmp/c25/in/on_{T_ID,N_EN}.doc.v2.json --template C:/tmp/c25/in/on_{ID,EN}.template.v2.json` (datum-gsp preset, R-72 = 6E1420) -> `C:/tmp/rh03/{T_ID,N_EN}.docx`; `score.ts --template datum-standar --language ID --tier TERBIT` / `--template datum-nota-en --language EN --tier NOTA --produced-by mcp` -> `C:/tmp/rh03/score_*` | **RH-03 `pass`** on both: "garis kepala 6E1420 sz 6 di 5 header interior". Emitted XML, 5 headers each: `<w:bottom w:val="single" w:sz="5" w:space="1" w:color="6E1420"/>`. The scorer exits 1 because of other rules from the C25 ad-hoc payload (as in the C25 runs), not RH-03 |

### Tests added (`tests/unit/studio/renderers/rh03-rule-colour-precedence.test.ts`)
The canonical template plus a literal copy of the `datum-gsp` preset's `render.section.interior`, fixture `doc_terbit_report`:
- ID/EN with R-72 6E1420: the header rule is `single sz 5 space 1 6E1420`.
- `#6e1420` is normalized to 6E1420.
- ID/EN with R-72 absent: rule C3CBD1. Explicit default `C3CBD1` and invalid `merah` give bytes identical (sha256) to absent.
- A non-default preset border (AABBCC) still wins when R-72 is absent or set to `c3cbd1` (bytes identical), and loses to R-72 6E1420.

### Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| precedence | "Set" means different from the registry default, not merely present | Canonical/DATUM profiles carry every default explicitly, so an explicit default must behave as absent to keep the bytes (same rule as HTML) |
| scope | R-72 is a colour param, not a rule switch | It recolours an existing bottom border only. A preset with no bottom border gets no rule added |
| width | `sz 5` vs 0.26 mm (`sz 6`) | Inside RH-03's ±1 tolerance; passes. Exact `sz 6` would need a new param or a preset change. Not done; flagged for the controller |

### Files
- `C:/Users/TRIAL/gsp-swarm-hq-v2.1/src/lib/studio/engine/docx/package/header-footer.ts` (modify: `runningHeadRuleOverride`, override in `runningHeadBody`, `PARAMS_BY_KEY` import)
- `C:/Users/TRIAL/gsp-swarm-hq-v2.1/tests/unit/studio/renderers/rh03-rule-colour-precedence.test.ts` (add)

Next: C32 score projection can count RH-03 as PASS for templates that set R-72 = 6E1420. Review recommended (scope: the two files above).
