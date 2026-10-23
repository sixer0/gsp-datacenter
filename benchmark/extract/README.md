# benchmark/extract (S93)

Extracts the acceptance benchmark Manual DATUM 000 Rev A (`BM.docx`, D-12) into the application's input
format `studio.doc/v1` at `benchmark/manual000/doc.json`.

## Why Python + lxml (and tsx only for the schema check)

- The extraction needs full OOXML fidelity (`w:t` text byte for byte, duplicate `tcW`/`tblW`, `fldSimple`,
  nested tables, per-run `rPr`). lxml reads the XML tree as written; the repo has no XML parser in its npm
  dependencies and adding one is out of scope.
- research/07 (S90) and the benchmark comparer (S96, `benchmark/harness/compare/docx_units.py`) use the same
  stack (VENV + lxml), so paragraph and cell indices are identical by construction and the S96 unit rules
  can be reused unchanged.
- Schema validation must use the contract's ajv setup (`STUDIO_SCHEMA_LOAD_ORDER`, `STUDIO_AJV_OPTIONS`),
  hence the small `validate_doc.ts` run with `npx tsx`.

## Files

| File | Role |
|---|---|
| `extract_manual000.py` | CLI: BM.docx + research/07 clusters -> `benchmark/manual000/doc.json` + `out/manual000_trace.json` |
| `docx_read.py` | OOXML -> RunProps / ParaFormat / Cell / layout readers; records any unmapped XML |
| `doc_text_model.py` | Rebuilds the text skeleton a renderer produces from doc.json alone (conventions C1-C14) |
| `verify_manual000.py` | Data guard V1-V7 (strict skeleton, 748 + 4159 paragraphs, 29 header/footer, S96 4544 units, counts, mapping, figures) -> `out/verify_report.json` |
| `validate_doc.ts` | ajv validation of doc.json against the contract schema |

## Run

```
VENV=C:/Users/TRIAL/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe
$VENV -I -B benchmark/extract/extract_manual000.py
$VENV -I -B benchmark/extract/verify_manual000.py
npx tsx benchmark/extract/validate_doc.ts benchmark/manual000/doc.json
```

Run from any cwd outside the skill folders; BM.docx is opened read-only in memory.

## Mapping summary

- Units (29 sectPr, KS-06): `front.cover` (explicit body), `front.controlSheet` (explicit body), `front.toc`
  (static entries), `parts[5]`, `chapters[17]`, `appendices[4]`; each unit carries its own `setup`
  (A4, margins, header `empty`/`runningHead`, footer `empty`/`registerBlock` with PAGE/NUMPAGES fields).
- 151 top-level tables: 8 `device:sealBand`, 1 `controlBlock`, 1 `colophon`, 3 control-sheet `table`,
  1 `signatureBlock`, 1 TOC, 5 part chapter lists (derived from `chapterKeys`), 24 rail paragraphs
  (`paragraph.rail[]`), 91 data tables (90 `table` + 1 `checklist`, caption + `source` lastRowMerged),
  10 `aside`, 2 `derivation` (the 2 nested tables = derivation lines), 4 `monoBlock`.
- All text is explicit `runs[]` with the run's own RunProps; every block/cell paragraph carries its own
  ParaFormat (format per cluster). Cell borders/margins/shading/width are explicit per cell.
- Figures: 52 placements -> ids `bm-fig-01..52` in placement order (= docPr id). 31 explicit references
  (logo, 6 datum rules 166 mm as `device`, 24 `image` blocks with `x.figureRef`) + 21 chapter datum rules
  derived by the renderer. `x.figures` lists all 52 with media sha256; `assets` holds the 31 explicit refs.
  S94 resolves each `bm-fig-NN` to a chart/diagram spec or the raster with the same sha256.
- Renderer conventions C1-C14 and schema gaps G-01..G-08 are written into `doc.json x.benchmark`.
