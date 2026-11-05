---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: S24
date: 2026-11-04
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/02_structured_datum_rev_a.md
status: complete
---

# Implementation Report: S24 PDF text-clash module (D-593 G-01..G-06, D-599 spine zone)

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Read the row (02_structured_datum_rev_a.md:140, :199), research/34, research/32 §13 (G-01..G-06), D-593, D-597 | done | Tool decision taken as given: PyMuPDF 1.28.2 (hermes venv), Studio PDF = DOCX -> LibreOffice 24.2, short work path |
| 2 | Probe real Studio PDFs (a_terbit_datum_gsp converted via soffice in C:/tmp/dc_clash) | done | Tables are drawn as horizontal rules plus filled seal cells. Consecutive ascender-descender line boxes overlap by design (25 pt title: 3.5 pt), so em boxes are used. Default `get_text` drops text past the mediabox, so that clipping is switched off |
| 3 | Tests first (pytest 9.1.1 exists in the venv), then clash.py | done | 16 tests red (ModuleNotFoundError) -> green; one test precondition fixed (label was too short to reach the margin) |
| 4 | Real-sample runs, regression fixes (TDD) | done | Two real defects found and fixed: repeated letters dropped from clash text; false word-box overlap on Manual 000 p.96 (fixed with glyph-level overlap; regression test red first, then green) |
| 5 | Lint, mutation spot-check, README | done | ruff E,F,W,B clean |
| 6 | D-599 (controller): spine string in the outer margin of cover/divider/back cover is allowed, narrowly | done | 7 tests added first (3 red as expected: allowed case, DOCX spine reader, plus one test precondition fixed: x 594 still lay on the page within tolerance, moved to x 598); implementation -> 25/25 green |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| benchmark/datum_conformance/clash/clash.py | add | CLI + `analyze()`, `docx_geometry()`, `docx_spines()`, `page_roles()`, `spine_lines()`, soffice conversion in short work dir, durable error record `clash_error.json` |
| benchmark/datum_conformance/clash/tests/test_clash.py | add | 25 tests: synthetic PDFs (PyMuPDF), DOCX geometry and spine reading, soffice conversion, Manual 000 regression, D-599 spine cases |
| benchmark/datum_conformance/clash/README.md | add | Usage, zone JSON, detector table, spine rule, exit codes |

`benchmark/datum_conformance/clash/index.ts` (S20 stub, "Pemilik: S24") was not touched: the catalog has no DOCX clash rule, so its empty rule list stays correct. Output was checked against the S20 validator `benchmark/datum_conformance/lib/clash.ts` (`parseClashResult`): same keys and kinds.

## Interface
`VENV -I -B benchmark/datum_conformance/clash/clash.py --pdf <file> --out <json> [--docx <file> [--no-convert]] [--margins-mm l,t,r,b] [--zones <json>] [--work-dir C:/tmp/dc_clash] [--soffice <path>]`

- `--docx`: converted by soffice in `<work-dir>/<8 hex>/`. The profile path length is checked (<= 160 chars), the process tree is killed on a 180 s timeout, and the run dir is removed afterwards. The PDF is written to `--pdf`. DOCX sections (`w:pgSz`, `w:pgMar`, gutter, `w:mirrorMargins`) give the body box, header band and footer band. Pages are matched to sections by page size; when several sections match, the most permissive envelope is used (exact page-to-section mapping needs the layout). `--no-convert` (additive option) reads only the geometry.
- Fallback geometry: `--margins-mm`, else the DATUM default 24/26/20/24 mm with header/footer distance 13 mm (GF-02/GF-03).
- Auto zones: running-header band, register/footer band (split into cells at its vertical rules), every filled cell in seal colour 6E1420. `--zones` adds `header|register|footer|seal|rail|cover|allow` zones (mm or pt, optional page list, optional `replace_auto`).
- Output is exactly `{pdf, pages, clashes: [{page, kind, bbox, text, detail}]}`; `detail` starts with the rule code. Exit 0 / 1 / 2 (2 also for unreadable input or failed conversion; `--out` is then not written).

Tolerances (not tuned against real samples): `TOL_PT = 0.5` pt (0.18 mm, the DATUM line floor; above LibreOffice's 1/20 pt rounding and the 0.2 pt jitter measured); same-visual-line overlap needs > 0.2 em (kerning, italic overhang); baselines equal within 1 pt; drawn segments < 2 pt are not edges.

### D-599 spine zone (narrow)
A line is exempt from out_of_margin only when all of these hold:
1. Every word of the PyMuPDF line is rotated 90 or 270 degrees (line direction (0, +-1)).
2. Every word box lies wholly in the outer margin band: the right margin, from the body box right edge to the page edge. Studio anchors the spine at the recto outer margin (`wrapper/render.ts` `spineXml`).
3. The page role is cover, divider or back cover. A body page carries running-header or register text (horizontal words in the header or footer band). Cover = page 1, back cover = last page, divider = the page directly before a body page; each only when it is not itself a body page.
4. Text:
   - With `--docx`: the normalized text (whitespace removed, upper case) must equal a spine string read from the DOCX (cells with a vertical `w:textDirection`), and the page role must belong to a section kind that carries one. Section kind comes from the section position: first = cover, last = back cover, other = divider (`docx_spines`).
   - Without a DOCX: the text must match `type · subject · language · REV x · Roman month · year` (>= 4 fields, first 2-4 letters, a `REV..` field, a Roman month, a 4-digit year last).

Overlap, out_of_page and cell-edge checks still apply to the spine, because out_of_page is tested before the exemption and overlap/edge tests are separate.

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| unit/CLI | `VENV -I -B -m pytest -p no:cacheprovider -q benchmark/datum_conformance/clash/tests` | 25 passed in 9.80 s | includes soffice conversion, Manual 000 regression, 7 D-599 tests |
| lint | `VENV -I -m ruff check --no-cache --select E,F,W,B --line-length 130 benchmark/datum_conformance/clash` | All checks passed! | |
| mutation spot-check (before D-599) | sed mutant per run, file restored (cmp equal) | 4 of 6 mutants killed | Killed: text clip back on (out_of_page test), ascender-descender boxes (5 tests), decoration filter off (underline test). Survived: glyph-level edge test replaced by word box; mirrorMargins ignored |

Synthetic cases (A4, default geometry), each detected with page and coordinates:
| Case | Kind | Evidence asserted |
|---|---|---|
| clean page (header, body 13.5 pt leading, cell with text, register) | none | exit 0, `{"pdf", "pages": 1, "clashes": []}` |
| "OVERLAPPING" / "COLLIDING" 3 pt apart | overlap | page 1, bbox x0 205, y0 495.2, y1 502.2 |
| "Overflowing" at x 560 | out_of_page | bbox x0 560, x1 > 595.28 |
| "x" at x 545 | out_of_margin | bbox x0 545; `--margins-mm` and `--zones` rail override tested |
| "Terpotong" across cell edge y 612 | clipped | bbox spans y 612, detail names `y=612.00` |
| underline of its own line | none | decoration filter |
| over-long running header | overflow | bbox x1 > 538.58, detail names header zone |
| header wraps to 2nd baseline | overflow | detail "wraps" |
| seal-cell label across cell boundary 303.4 | overflow | detail names seal cell |
| register cell 2nd baseline | overflow | detail names register cell |
| D-599: rotated spine in outer margin, page 1 (cover) | none | `clashes == []` |
| D-599: same spine on a body page (page 2) | out_of_margin | `[(2, "out_of_margin")]`, bbox x0 565.3 |
| D-599: horizontal label in outer margin, page 1 | out_of_margin | `[(1, "out_of_margin")]` |
| D-599: spine overlapped by other text, page 1 | overlap | overlap on page 1 naming "XX" |
| D-599: spine past the page edge | out_of_page | `["out_of_page"]` |
| D-599: rotated text not matching the spine pattern, page 1 | out_of_margin | `[(1, "out_of_margin")]` |
| D-599: DOCX spine reader | n/a | `{"roles": {"cover"}, "texts": {"KT·BIAYAPEMELIHARAANGICIKUPA·ID·REVA·XI·2026"}}` |

## Verification (real samples, fresh run after D-599, 2026-11-04)
| Sample | Mode | Exit | Clashes |
|---|---|---|---|
| a_terbit_datum_gsp (7 p) | `--docx` (soffice conversion) | 0 | 0 |
| a_terbit_datum_gsp | PDF only (pattern mode) | 0 | 0 |
| b_nota_datum_gsp (4 p) | `--docx` / PDF only | 0 / 0 | 0 / 0 |
| a_terbit_datum_kanonik (7 p) | `--docx` | 0 | 0 (was 1 out_of_margin before D-599) |
| a_terbit_datum_kanonik | PDF only (pattern mode) | 0 | 0 |
| b_nota_datum_kanonik (4 p) | `--docx` / PDF only | 0 / 0 | 0 / 0 |
| Manual 000 PDF (105 p), default geometry | `--pdf` | 0 | 0 |
| Manual 000 PDF, DOCX geometry | `--docx ... --no-convert` | 0 | 0 |
| Manual 000 DOCX reconverted by soffice | `--docx` | 0 | 0 |

D-599 evidence on the real samples:
- `docx_spines`: only a_terbit_datum_kanonik carries a spine (`roles {cover}`, text `KT·BIAYAPEMELIHARAANGICIKUPA·ID·REVA·XI·2026`). The other three baselines and Manual 000 have none, so no exemption can apply to them in DOCX mode.
- The former clash (kanonik p.1, bbox [564.93, 73.8, 570.93, 351.0], rotated, outer margin) is now exempt in both modes. It is the only page of that PDF with vertical text.
- Page roles found:
  - kanonik: p.1 cover, p.3 divider (4 body pages).
  - Manual 000: p.1 cover, pp. 4, 15, 29, 66, 85 divider (97 body pages; no vertical text anywhere).

Evidence (before D-599, same PDFs) that the zero results do not come from blind detectors or loose tolerances:
- Manual 000: 31,490 words, 1,922 drawn edges, 16 seal cells, 1,581 header-band words, 1,164 footer words; the register splits into 4 cells on 97 pages.
- Glyph-box intersections > 0.1 pt between different lines: 0 (Manual 000, a_terbit_datum_gsp, a_terbit_datum_kanonik).
- Drawn edges touching any glyph box at any depth: 0 (Manual 000, a_terbit_datum_gsp).
- Largest overshoot past the right margin: 0.196 pt (0.07 mm), the right-aligned issue-stamp digit "1" on cover page 1 (Manual 000 and both baselines), below TOL_PT.

Result JSONs: `C:/tmp/dc_clash/res/` (outside the repo).

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| none | - | - | - | no |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 2 | `get_text` default clip drops text outside the mediabox (G-02 would be blind) | `clip=INFINITE_RECT()` plus flag `TEXT_MEDIABOX_CLIP` cleared; covered by a test (mutant killed) |
| 2 | Ascender-descender boxes of consecutive lines overlap by design | em boxes (`set_small_glyph_heights`), state restored after each run |
| 3 | PyMuPDF can merge overprinted text into one line, so skipping same-line pairs would hide it | words of one visual line are compared too, but only overlap > 0.2 em counts (kerning ignored, overprint not hidden) |
| 4 | Manual 000 p.96 false overlap ("√, ≤,": fallback-font glyphs in a second line whose word box spans a Plex comma; glyphs touch by 0.04 pt) | overlap and edge crossing judged on glyph boxes; regression test on Manual 000 (skips if the PDF is absent) |
| 4 | Clash text lost repeated words (de-duplicated by string) | de-duplicated by word identity; test added (written after the fix, not red first) |
| 3 | Exact re-draws (same text, same box within 0.1 pt) | dropped before checks: they print as one glyph run |
| - | `--no-convert` added (not in the brief) | additive; lets the Manual 000 PDF be checked with its own DOCX geometry without reconverting |
| 6 | D-599 (controller): spine string in the outer margin of cover/divider/back cover is not a clash | implemented narrowly as above; out_of_page, overlap and cell-edge checks unchanged |
| 6 | Page role cannot be mapped exactly from DOCX sections without layout | DOCX gives the spine texts and the section kinds that carry them; the PDF page role comes from body-page positions (header/register text) |
| 6 | Known limit of the page-role heuristic: a non-body page directly before the first chapter is classed "divider" even when it is a TOC (kanonik p.3, probably Manual 000 p.4) | No effect in DOCX mode when the DOCX has no divider spine (kanonik: roles {cover} only). In PDF-only mode a rotated spine-pattern string on such a page would be exempt. Recommend always passing `--docx` in the harness |
| 6 | Outer margin = right margin only | Studio places the spine on the recto right margin; mirrored (verso-left) spines are not exempt and would be flagged |
| - | Review | review recommended: clash.py + tests (scope `benchmark/datum_conformance/clash/**`) |

## Next Steps
- Controller: record that the harness should call the checker with `--docx` (or `--docx --no-convert` for an existing PDF), so D-599 relies on the DOCX spine text and section kind, not on the PDF-only pattern.
- S25 calibration can run the checker per family as listed above.
- Known limits: images are not checked against text; the mirrored-margin and glyph-gap edge paths have no killing test; page-to-section mapping uses the page-size envelope; the page-role heuristic is as described above.

## G-06 NOTA classification line (2026-11-05)

status: complete. Skills loaded: `tdd`, `dry-run-verify-fix`. Nothing committed. Files written: `benchmark/datum_conformance/clash/**` only.

Problem (evidence `coder_execution_c25.md` finding F2, `coder_execution_engine_c.md` C16): the opt-in NOTA line `Klasifikasi : <K>` / `Classification: <K>` (R-76), a separate footer paragraph directly under the register row and starting at the number cell's text edge, was a G-06 "label wraps in register zone 'register/footer cell 1'" clash on every interior page, because the whole footer band is one single-line register zone (`clash.py` auto zone, G-06 baseline loop). The manual requires that line on its own line under the number (ID:611-613, EN:647-649), so it was a false positive against the 0-clash gate (D-593).

### Changes Made
| File | Change Type | Description |
|---|---|---|
| `benchmark/datum_conformance/clash/clash.py` | modify | `classification_line()`: the one allowed second baseline in a register zone. All must hold: it is the next baseline after the register row (topmost baseline in the zone) and starts below the row (below the cell separators and the row glyphs, at most 1.5 line heights lower); it starts at the text edge of the number cell (the cell whose row text matches `DOC_NUMBER_RE`, e.g. `017/GSP/KT/XI/2026`, within `ALIGN_TOL_PT` = 1.5 pt); its text matches `^(Klasifikasi\s*:\|Classification\s*:)` followed by an upper-case value (manual: capitals); every word is inside the footer band and the text column. The G-06 baseline/cell-width loop skips only those words. `docx_classification_lines()`: reads `word/footer*.xml` through the existing bounded `read_docx_parts` (M3 limits) and returns paragraphs that come directly after the register `w:tbl` and match the pattern. With `--docx`, when a footer has such a paragraph, the PDF line must equal it (structural). Otherwise the pattern and position rule decide. `_separators()` was extracted from `_cells()` with the same criterion. Docstring updated. A pre-existing E501 (`read_docx_parts` signature, 132 chars) is wrapped |
| `benchmark/datum_conformance/clash/tests/test_clash.py` | modify | 11 new test cases (synthetic register geometry measured on the C16 PDF: rules y 777.70/795.40, separators x 215.5/334.5/453.6, row baseline 789.40, classification line x 68.15 baseline 802.35) |
| `benchmark/datum_conformance/clash/README.md` | modify | Documents the exception |

Not changed: G-01 overlap, G-02 out_of_page, G-03 out_of_margin, G-04 edge crossing (they still apply to the classification line), the header and seal zones, the CLI and JSON contract, exit codes.

### Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Red first | `VENV -I -B -m pytest -p no:cacheprovider benchmark/datum_conformance/clash/tests -k "classification or other_second or second_line"` | 4 failed, 5 passed | Failing: allowed ID line, allowed EN line, DOCX reader (missing), DOCX structural. The 5 passing were the "still flagged" guards, which were already flagged before the change, as intended |
| Suite | `C:/Users/TRIAL/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe -I -B -m pytest -p no:cacheprovider benchmark/datum_conformance/clash/tests` | `44 passed` | Includes the Manual 000 p.96 regression (PDF present, not skipped) |
| Lint | `VENV -I -m ruff check --no-cache --select E,F,W,B --line-length 130 benchmark/datum_conformance/clash` | `All checks passed!` | Same rule set as the original S24 run |
| Mutation spot-check | ad-hoc: `ALIGN_TOL_PT=1000`; label pattern replaced by `.+` | each makes its guard test fail | the cell-2 test and the `CATATAN TAMBAHAN` test |

Full gate log: `C:/tmp/g06/gate_final.txt`.

### Verification
- Synthetic (new tests): classification line under the number, ID and EN -> 0 clashes. Other second lines (`Catatan tambahan register`, `CATATAN TAMBAHAN`, lower-case value `Klasifikasi : terbatas`) -> overflow "wrap". Classification line under cell 2 -> overflow. Classification line overlapping the register row (baseline 792.5) -> overlap + overflow. Over-long classification line past the right margin -> overflow. A third baseline below the classification line -> flagged. With `--docx`, a footer paragraph equal to the PDF line -> 0, and a footer paragraph that differs (`RAHASIA`) -> overflow "wrap". `docx_classification_lines` returns `{"CLASSIFICATION:TERBATAS"}`, and returns an empty set with no paragraph or with a non-matching paragraph.
- Real NOTA output with R-76 on: `render_cli.ts --doc C:/tmp/g06/in/b_nota_datum_gsp.doc.v2.json --template C:/tmp/g06/in/cl_ID.template.v2.json --out C:/tmp/g06/N_ID --formats docx`. The template is the baseline `datum_gsp.template.v2.json` plus only `advanced: {"render.nota.classificationLine": true}`. The preset is copied from engine C's `C:/tmp/eC/in`. EN is the same doc with `meta.language = "EN"` and `cl_EN.template.v2.json`. Then `clash.py --docx C:/tmp/g06/N_{ID,EN}.docx --pdf C:/tmp/g06/N_{ID,EN}.pdf --out C:/tmp/g06/clash/N_{ID,EN}.json --work-dir C:/tmp/g06/w` (LibreOffice conversion) gives **`0 clashes on 4 pages`** for each, exit 0. Every page carries `Klasifikasi : TERBATAS` / `Classification: TERBATAS` at x 68.15. The structural path is engaged: `docx_classification_lines` = `{'KLASIFIKASI:TERBATAS'}` / `{'CLASSIFICATION:TERBATAS'}`.
- Before/after on the same PDFs: HEAD `clash.py` (`git show HEAD:...` into `C:/tmp/g06/head/clash.py`, `--no-convert`) gives `4 clashes on 4 pages {'overflow': 4}` for N_ID and for N_EN.
- C25 all-on NOTA output (`C:/tmp/c25/r/N_{ID,EN}`, previously 5 clashes each): `0 clashes on 5 pages` each.
- S36 r2 (`C:/tmp/s36r2/out/*.pdf` with their DOCX, `--no-convert`): 10/10 at `0 clashes` (laporan, laporan-verifikasi, nota, proposal-teknis, standar; ID and EN). Results in `C:/tmp/g06/s36r2/`.
- Manual 000: `0 clashes on 105 pages`, both PDF-only and with `--docx --no-convert`.

### Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| none | - | - | - | no |

### Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| G06-1 | How to identify the number cell without the template | Register cell whose row text matches the document-number shape `\d{1,4}(/[A-Z0-9][A-Z0-9.-]*){3,}`. If no cell matches, there is no exemption (strict) |
| G06-2 | Classification value | Must be upper case with at least one letter. The engine uppercases it (`classificationMarkText`), and the manual says "kapital" (ID:611) |
| G06-3 | `--docx` given but no matching footer paragraph (e.g. the S36 r2 NOTA, R-76 off) | Falls back to the pattern and position rule, as the brief says. When the DOCX has the paragraph, the PDF text must equal it |
| G06-4 | Only one extra line is allowed | Only the baseline right after the register row. Any further line keeps the single-line rule |
| G06-5 | Classification line wider than cell 1 but inside the column | Not a clash: the line sits below the row, where the cell separators do not extend. Only the footer band and the text column bound it |
| G06-6 | Pre-existing ruff E501 in `read_docx_parts` | Line wrapped (owned path, no behaviour change) |
| - | Review | review recommended: `classification_line()`, `docx_classification_lines()` and the new tests (scope `benchmark/datum_conformance/clash/**`) |

### Next Steps
- Controller: the NOTA pairs in C32/C44 can be re-scored against the 0-clash gate with this checker (call it with `--docx`).
