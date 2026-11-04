---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: D-605 (2) D01 EN structural numbering (+ D-605 (3) s29 how-to sample expectation)
date: 2026-11-04
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/decisions/decisions.md (D-605)
status: complete
---

# Implementation Report: D01 EN must not audit structural numbering

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Read D01 (`checks-d.ts` d01/texts), `auditText`, EN pattern builder, S26-S29 report R-S29-2, s29 parity test | done | Repro: subheading "1.1 Background" -> section title unit -> EN pattern `\d+\.\d+` matches "1.1" |
| 2 | Tests first (`lint-d01-structural-numbering.test.ts`) | done | Red confirmed: 6/9 failing before the fix; s29 tightened assertion also red without the fix (`datum-proposal-teknis-en: D01:FAIL:... "1.1"`) |
| 3 | Implement context-based structural-number exclusion | done | `audit.ts` + `checks-d.ts` + one `export` in `scan/walk.ts` |
| 4 | s29: drop R-S29-2 allowance, pin "no D01 1.1"; D-605 (3) first test = as-is how-to sample VALID for datum-gsp | done | `completedSample()` removed (redundant, sample now carries author + source) |
| 5 | Dry-run gate: vitest studio, tsc, eslint, convert_v2 --check, ID baseline 8/8 | done | all green (see Test Results) |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| `src/lib/studio/engine/bind/audit.ts` | modify | New `AuditTextContext` ("heading" / "body"), `AuditTextOptions`, `structuralNumberSpans(text, context)`; `auditText(..., lang?, opts = {})` skips candidates overlapping a structural span. No `opts.context` = Python port unchanged. EN/ID number pattern builders untouched. |
| `src/lib/studio/engine/lint/structure/checks-d.ts` | modify | `TextUnit.heading` (chapter kicker/title, section titles, parts units); `auditContext(t)` = heading for those and for heading paragraphs (role subheading/blockHeading/pageTitle or `format.outlineLvl`), else body; D01 passes `{ context }`. Text units themselves unchanged (same count/text), so the other D-checks are unaffected. |
| `src/lib/studio/engine/lint/scan/walk.ts` | modify | `isHeadingParagraph` exported (was module-private), so D01 uses the existing single heading definition. |
| `tests/unit/studio/engine-core/lint-d01-structural-numbering.test.ts` | add | 12 tests (EN headings/captions/clauses PASS, untraced EN prose still FAIL, ID unchanged incl. corpus equivalence vs. the port, EN address and ID-form-in-EN cases). |
| `tests/unit/studio/compose/s29-usage-parity.test.ts` | modify (expectations only) | (a) R-S29-2 allowance removed: PT-EN SERAH extra findings must be D16 SERAH only, plus explicit "no D01 finding for 1.1"; (b) D-605 (3): first test now asserts the how-to §2 sample, parsed as-is, is VALID for datum-gsp (author "Tim Kajian", no SOURCE_MISSING, no layer/schema/P3-20/blocking issues, COMPLETE); `completedSample()` removed and its callers use `howtoSample()`; describe title adjusted; all other parity assertions unchanged. |

### What counts as structural (generic, no language/template branching)
- Token shape: `\d{1,3}(\.\d{1,2})+` bounded by non-digit/non-separator ("1.1", "2.3.1", "12.10").
- Anywhere (heading or body): numbers after a label word (one EN+ID list: Table/Tabel, Figure/Fig./Gambar, Chart/Grafik, Diagram, Section/Bagian/Subbab/Bab/Chapter, Clause/Pasal/Ayat, Article, Annex/Lampiran/Appendix, Part, Item/Butir, Paragraph/Paragraf, Step/Langkah, Equation/Persamaan/Rumus, Box/Kotak, No./Nomor, §), including joined lists ("Tables 1.2 and 1.3", "Pasal 4.1-4.3"); multi-level addresses with two or more dots ("2.3.1", "4.10.2").
- Heading context: the leading numbering token of each line.
- Body context: the leading token of a line (paragraph, list item, caption line) only when followed by a Capitalised word ("4.2 The contractor ...", "3.1 Scope ..."); "2.75 tonnes" or "3.25 MW" at line start stay audited.

### Why ID is provably unchanged
Every ID audit candidate that contains "." has 3-digit groups after each "." and is bounded by lookarounds rejecting adjacent digits/separators; the structural token only allows 1-2 digit groups and must end at a non-digit. The two can never overlap, so excluding structural spans removes no ID candidate. Pinned by the corpus test (ID audit with heading/body context equals the plain port for 10 strings incl. "1.250 Kepala keluarga", "Tabel 1.250", "§1.250") and by the ID baseline 8/8 SAME.

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Red check | `npx vitest run .../lint-d01-structural-numbering.test.ts` (before fix) | 6 failed / 9 | e.g. `/chapters/0/title: angka "1.1" tidak tertelusur`, `angka "2.3"` |
| Red check s29 | probe run with context disabled | s29 parity test fails: `datum-proposal-teknis-en: D01:FAIL:/chapters/0/sections/0/title: angka "1.1" ...` | probe reverted (grep NOFIX in src: none) |
| Targeted | `npx vitest run lint-d01-structural-numbering lint-d01-register-language bind-language` | 3 files, 34 passed | existing "EN: bentuk ID 1.250.000,5 -> FAIL" still passes |
| s29 | `npx vitest run tests/unit/studio/compose/s29-usage-parity.test.ts` (+ new D01 file) | 2 files, 26 passed | s29 = 14 tests |
| Unit studio | `npx vitest run tests/unit/studio` | Test Files 253 passed (253); Tests 4682 passed (4682) | final run. Two earlier runs hit transient failures (3, then 52) in renderer/datum-conformance tests (G-FIX1 / D-606 "Annex", "English (UK)", wrapper text) while another agent was editing those files (mtime 20:23-20:24); a re-run of those dirs passed 43/43 files and the final full run is green. None involved D01. |
| convert_v2 | `npx tsx --tsconfig tsconfig.json benchmark/extract/convert_v2.ts --check` | SAME x3 | doc.v2 79290e07..., template.v2 882057c5..., preset a951b149... |
| ID baseline | `npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root C:/Users/TRIAL/gsp-swarm-hq-v2.1 --out C:/tmp/bl_d01 --inputs C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline/inputs --compare C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline` | `compare: 8/8 SAME` | |
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | 0 errors | |
| Lint | `npx eslint src/lib/studio/engine/bind/audit.ts src/lib/studio/engine/lint <2 test files>` | clean (exit 0) | |

## Verification
- EN headings "1.1", "2.3.1" (chapter title, section title, subheading paragraph) and captions/references "Table 1.2", "Figure 3.1", "Section 2.3.1", "clause 4.2": D01 PASS (tests 1-3).
- Untraced EN prose "1,250,000.25" and "2.75" still FAIL, "1.1" not reported (test 4); a heading starting with "1,250,000.75" still FAIL (test 5).
- ID unchanged: corpus equivalence test, ID lint tests, ID baseline 8/8 SAME.
- Original repro (datum-gsp-equivalent PT-EN SERAH, subheading "1.1 Background"): no D01 finding in s29.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| none | - | - | - | no |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 3 | First attempt tightened the EN pattern lookahead (reject "." + digit) so "2.3.1" is not cut to "2.3"; it broke the pinned S18 test "EN: bentuk ID 1.250.000,5 -> FAIL" (ID form in EN doc must stay flagged) | Reverted; multi-level addresses are excluded as structural spans instead (1-2 digit groups only), so "1.250.000,5" in EN still yields "1.250" |
| 3 | Exclusion is opt-in via `auditText(..., { context })`; default call keeps the Python port semantics | D01 is the only caller passing a context |
| 3 | Parts unit (label + title + lede) kept as one unit (changing unit count would alter other D-check details); it is marked heading, so a lede line starting with a numbering token such as "1.25" is not audited | Residual, low risk; noted |
| 3 | Heuristics with residual false negatives (EN only): label-joined lists ("Figure 3.1 and 2.75") and a body line starting "1.5 Million ..." (capitalised word) are treated as structural; IP-like "192.168.1.1" still yields "192.168" (3-digit groups) | Accepted as heuristic; documented here |
| 3 | `scan/walk.ts` `isHeadingParagraph` exported (lint/** owned) rather than duplicating the heading-role list | - |
| 4 | s29 expectation changes (both owned by this row): R-S29-2 allowance removed and replaced by an explicit no-D01 assertion; D-605 (3) first test rewritten, `completedSample()` removed | Controller can close R-S29-2 |
| - | Review recommended: `audit.ts` regexes and the structural heuristics (scope: `audit.ts`, `checks-d.ts` d01/auditContext) | for controller |

## Next Steps
- Controller: close R-S29-2 / D-605 (2) and (3) in decisions; optional senior review of the heuristics above.
