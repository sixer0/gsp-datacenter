---
task_id: 2026-10-22_doc_artifact_studio
task_slug: doc_artifact_studio
row: G-FIX cycle 1 (clash criterion, D-608 / G-06) + I39-1
date: 2026-11-04
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/verification/23_datum_conformance_dev.md (section 4, option 1)
status: complete
---

# Implementation Report: running-head width fit (G-06) and I39-1 seal-band literal

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Read defect evidence (verification/23 §4, R1-R3) and `header-footer.ts`, `html/base/markup.ts`, `chart/core/textfit.ts` | done | Cause confirmed at `defaultRunningHeadLeft` / `runningHeadBody` |
| 2 | Capture pre-change header XML sha256 for short ID/EN titles (guard literal) | done | ID `5e2c6f8e...16e7`, EN `ad03a905...cf56e` |
| 3 | Red test `gfix-running-head-fit.test.ts` | done | 6 failed / 1 passed (guard) before the fix |
| 4 | Shared helper `front/running-head-fit.ts` + DOCX wiring | done | 7/7 green |
| 5 | HTML running head check | done, no change | Different structure (see Issues & Decisions) |
| 6 | I39-1 (coordinator add-on): red test, replacer function in `front/texts.ts` | done | 5 failed -> 6/6 green |
| 7 | Dry-run gate: vitest studio, baseline 8/8, convert_v2 --check, tsc, eslint | done | all green |
| 8 | Pure render of gate ID/EN + PDF + clash.py, plus pre-fix control | done | 0 clashes after fix, control reproduces 2 (ID) / 4 (EN) |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| `src/lib/studio/engine/front/running-head-fit.ts` | add | `fitRunningHeadText(segments, maxWidthMm, font)`: joins segments with " · "; returns the text unchanged when it fits; otherwise ellipsizes segments by ascending `shrinkOrder` with `textfit.ellipsize` (a segment that cannot keep 3 glyphs is dropped with its separator, then the next one shrinks). Segments without `shrinkOrder` are never cut. Imports only `chart/core/textfit` (which imports nothing; no cycle). |
| `src/lib/studio/engine/docx/package/header-footer.ts` | modify | `defaultRunningHeadLeft(ctx, unit, maxWidthMm?)`: segments entity / docLabel (shrink 1) / chapter label / chapter title (shrink 2); without `maxWidthMm` the output is the old join. `runningHeadBody` (default left only) computes the budget = right-tab position (`fmt.tabs` right tab, else text width) - measured classification width (bold run font) - 4 mm gap. `fitFontOf(RunProps)` derives the measuring font from `RUNNING_HEAD_LEFT_RUN` / `RUNNING_HEAD_RIGHT_RUN` (6.5 pt, caps, 0.6 pt tracking, condensed -> `struct`). Template-supplied `spec.left` runs are not touched. No slug/type branching, no new parameter. |
| `src/lib/studio/engine/front/texts.ts` | modify | I39-1: `sealBandTextsOf` fills `{kelas}` with a replacer function `() => kelas`, so `$&`, `$$`, `` $` ``, `$'` in a classification are inserted literally (line 325-327). |
| `tests/unit/studio/renderers/gfix-running-head-fit.test.ts` | add | Seam `headerFooterXml({mode:"runningHead"})`. Gate titles ID/EN with chapters 1 and 6: header fits (left + classification <= text width - 1 mm, measured independently at 6.5 pt caps 0.6 pt tracking), title segment ends with "…", entity and chapter title intact. Long chapter title: shortened after the title. Classification `SANGAT RAHASIA` never truncated (ID and EN). Guard: short ID/EN titles give the pre-change sha256. |
| `tests/unit/studio/renderers/i39-seal-band-literal.test.ts` | add | `$&`, `$$`, `` $` ``, `$'` in the classification (ID default, template pair, EN) are literal; ordinary classification unchanged. |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Red (G-FIX) | `npx vitest run tests/unit/studio/renderers/gfix-running-head-fit.test.ts` (before fix) | 6 failed, 1 passed | the guard passes by construction before the fix |
| Red (I39-1) | `npx vitest run tests/unit/studio/renderers/i39-seal-band-literal.test.ts` (before fix) | 5 failed, 1 passed | |
| Unit (studio) | `npx vitest run tests/unit/studio` | 259 files, 4729 tests passed | run after the final change (gap 4 mm) |
| ID baseline | `npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root C:/Users/TRIAL/gsp-swarm-hq-v2.1 --out C:/tmp/bl_rh --inputs C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline/inputs --compare C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline` | `compare: 8/8 SAME` | e.g. a_terbit_datum_gsp DOCX `633e583f...e9e6af` = baseline |
| convert_v2 | `npx tsx --tsconfig tsconfig.json benchmark/extract/convert_v2.ts --check` | SAME x3 | doc.v2 `79290e07...`, template.v2 `882057c5...`, preset `a951b149...` |
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | exit 0, no output | |
| Lint | `npx eslint <5 changed/added files>` | exit 0, no output | |
| Clash, ID after fix | `clash.py --docx C:/tmp/rh_gate/out_id/document.docx --pdf .../document.pdf --out C:/tmp/rh_gate/clash_id.json --work-dir C:/tmp/rh_work` | `clash: 0 clashes on 5 pages` | |
| Clash, EN after fix | same, `out_en` | `clash: 0 clashes on 5 pages` | |
| Clash, ID control (fit disabled) | same input, `ctl_id` | `clash: 2 clashes on 5 pages {'overflow': 2}` | matches the gate's ID count |
| Clash, EN control (fit disabled) | same input, `ctl_en` | `clash: 4 clashes on 5 pages {'overflow': 4}` | matches the gate's EN count |

## Verification
- **Header fits on one line (PDF, PyMuPDF line extraction):** every page-4/5 header line of both renders is at y = 37.39 pt, with the left text ending at about 488 pt and `TERBATAS` ending at 535.5 pt on the same baseline. Rendered texts: ID p5 `PT GEMILANG SATRIA PERKASA · KAJIAN DESAIN KEAMANAN SISTEM INFORMASI MANAJEMEN ASET… · BAB 6. DESAIN KEAMANAN | TERBATAS`; EN p5 `PT GEMILANG SATRIA PERKASA · SECURITY DESIGN STUDY FOR THE PORT ASSET MANAGEMENT… · CHAPTER 6. SECURITY DESIGN | TERBATAS`. Header crops: `C:/tmp/rh_gate/hdr_id_last.png`, `C:/tmp/rh_gate/hdr_en_last.png`.
- **Short titles byte-identical:** guard test sha256 equals the pre-change output; ID baseline 8/8 SAME.
- **Classification never truncated:** unit test with `SANGAT RAHASIA` (ID and EN); the classification is outside the fitted text by construction (its full measured width is subtracted from the budget).
- **Control proves the check is sensitive:** with only the fit call disabled (temporary edit, file restored, sha256 `05e83439...1cea` before and after), clash.py reports exactly the gate's 2 (ID) / 4 (EN) overflows on the same inputs.
- **Pure render procedure (no DEV writes, no DB, no ports):** `C:/tmp/rh_gate/mk_gate_doc.ts` turns `C:/tmp/s36/payload/{id,en}.json` into `studio.doc/v2` through `scripts/studio/mcp/write-client.ts buildClient` (read-only use); template = frozen `datum_gsp.template.v2.json` from the baseline inputs with `doc.language` set per language and content/appendices `admits` = current `CONTENT_BLOCK_TYPES` (`C:/tmp/rh_gate/patch_tpl.ts`, matching `prisma/seed-studio-templates.ts:60-62`); render: `npx tsx scripts/parity/run/render_cli.ts --doc C:/tmp/rh_gate/gate_<l>.doc.v2.json --template C:/tmp/rh_gate/datum_gsp_<l>.template.v2.json --out C:/tmp/rh_gate/out_<l> --formats docx,pdf --pid-seed gfix-rh --with-canonical-assets`. Artefact sha256: ID docx `a2f216cc...d9698`, ID pdf `6b1cac11...a5ad2b`, EN docx `69d60ed1...c43d3`, EN pdf `94b68555...3220e`.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| `render_cli` under `tsx` cannot rasterize charts: `rasterizeSvg failed: page.evaluate: ReferenceError: __name is not defined` (seen through a diagnostic log tee, `C:/tmp/rh_gate/sink.mjs`) | 3 (sandbox off, `--with-canonical-assets`, log tee to find the cause) | tsx/esbuild `keepNames` injects a `__name(...)` helper into the functions passed to `page.evaluate` in `engine/browser/index.ts` (font check); the page has no `__name`. Older than this change; the compiled DEV/production server is not affected. | Worked around: the one chart block of chapter 6 is removed from the pure-render input (`STRIP_CHARTS=1`). The running head does not depend on figures, and the chapter-6 header is still present on page 5. A DEV R17 render of the full payload has not been run (DEV writes were out of scope). | No (for this fix); a tooling item for the controller |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 4 | Gap between fitted left text and classification | 4 mm, equal to the HTML `.runhead{gap:4mm}` (`html/base/css.ts:245`). A first try with 2 mm also gave 0 clashes but looked cramped in EN. The 4 mm gap also absorbs the difference between the SemiBold width table and the Bold run. Baselines stay 8/8 SAME with 4 mm. |
| 4 | When a segment cannot keep 3 glyphs | It is dropped with its separator (a lone "…" or "K…" segment carries no meaning), then the next segment shrinks. Entity and chapter label are never cut; if they alone overflow, the text is returned as is (best effort). |
| 4 | Template-supplied `runningHead` `left` runs | Not fitted (author content, as option 1 specified for the default left text only). |
| 5 | HTML running head | **Not changed: different structure.** `runningHeadText` (`html/base/markup.ts:61-95`) builds left = entity · `cover.kicker.text`/`typeCode` (it never uses `meta.title`), center = chapter, right = classification, in 3 flex spans with `white-space:nowrap` and per-span `text-overflow:ellipsis` (`css.ts:245-249`), or in `@page` margin boxes in print. It cannot show the G-06 wrap. The helper is in `engine/front/` so the HTML path can use it if it ever takes the DOCX shape. |
| 6 | I39-1 is outside the original file ownership (`front/texts.ts`) | Done on the coordinator's explicit instruction. Only line 325 (`{kelas}` in the seal band) changed. Line 312 (`{KELAS}` in the issue stamp) inserts one character, and a single `$` is not a replacement pattern, so it was left unchanged. |
| 8 | Gate template for the pure render | `datum-gsp` (legacy, R3 of the gate report) from the frozen baseline inputs. The 10 new templates exist only as seed specs (`prisma/seed-doc-type-templates.ts`) and DB rows, with no pure template file. The header code path is the same for all templates (no slug branching). |

## Next Steps
- Controller: re-run the S36 DEV gate (10/10 pairs, R17 PDF + clash.py) on the deployed code; 0 clashes are expected.
- Review recommended (scope: `front/running-head-fit.ts`, the `header-footer.ts` hunks at lines 108-145 and 162-173, `front/texts.ts:325-327`, and the two new test files).
- Optional tooling item: make `render_cli` under tsx able to rasterize charts (`__name` shim in the page or `keepNames` off).

## Word-boundary cut (follow-up to G-FIX cycle 1, DEV gate r2 finding)

Finding: the shortened document title and chapter title were cut mid-word ("ASET PEL...", "MANAGEMENT IN..."). Change: `shortenAtWord` in `src/lib/studio/engine/front/running-head-fit.ts` replaces the direct `ellipsize` call in `fitRunningHeadText`.

- Starts from the longest character-level cut that fits (`ellipsize`). If that cut ends at a word boundary (next glyph is whitespace) it is kept; otherwise it backs up to the last whitespace inside the kept text. Trailing separators and spaces (`, ; : . - en/em dash, middle dot, / | & ( [` and whitespace) are stripped before the "...".
- Fallback to the old character-level cut when no whole word fits (single long word), and also when the whole-word result would keep fewer than `MIN_KEPT_GLYPHS` (3) glyphs (a 1-2 letter word such as "Di" is not a meaningful cut; a decision of mine, flagged for review). Text that already fits never reaches this code, so it stays byte-identical.
- Only the two owned files changed: `running-head-fit.ts` and `tests/unit/studio/renderers/gfix-running-head-fit.test.ts`. No commit.

Tests (TDD, seams: `headerFooterXml` as before, plus the exported `fitRunningHeadText`): red 3 failed / 13 passed (gate title ID and EN cut mid-word; punctuation case gave "Alpha Beta, Gamm..."), green 16/16. New tests: gate titles ID and EN with chapters 1 and 6 cut at a word boundary and the next word would not fit (budget = text width - classification - 4 mm); single long word falls back to a character cut; helper-level fit-unchanged, trailing-separator strip (`,`, ` - `, `:`), long-word fallback, 2-glyph-word fallback; the classification test now also asserts the title segment is still shortened. The existing sha256 guard for short ID/EN titles is untouched and passes.

| Check | Command | Result |
|---|---|---|
| Unit studio | `npx vitest run tests/unit/studio` | 259 files, 4738 tests passed |
| Baseline | `render_id_samples.ts ... --out C:/tmp/bl_wb ... --compare` | `compare: 8/8 SAME` |
| convert_v2 | `npx tsx --tsconfig tsconfig.json benchmark/extract/convert_v2.ts --check` | SAME x3 (doc.v2 `79290e07...`, template.v2 `882057c5...`, preset `a951b149...`) |
| tsc | `npx tsc --noEmit -p tsconfig.json` | exit 0, no output |
| eslint | `npx eslint` on the 2 files | exit 0, no output |
| Clash ID | render_cli (inputs `C:/tmp/rh_gate/gate_id.doc.v2.json` + `datum_gsp_id.template.v2.json`, out `wb_id`) then `clash.py --docx ... --pdf ... --work-dir C:/tmp/rh_work` | `clash: 0 clashes on 5 pages` |
| Clash EN | same, `gate_en`, out `wb_en` | `clash: 0 clashes on 5 pages` |

Rendered running heads (PyMuPDF, all header lines at y = 37.4 pt, one line): ID `PT GEMILANG SATRIA PERKASA · KAJIAN DESAIN KEAMANAN SISTEM INFORMASI MANAJEMEN ASET… · BAB 6. DESAIN KEAMANAN`; EN `PT GEMILANG SATRIA PERKASA · SECURITY DESIGN STUDY FOR THE PORT ASSET MANAGEMENT… · CHAPTER 6. SECURITY DESIGN`. The render lint banner (TERBIT FAIL, 4 checks) is identical to the cycle 1 renders (`out_id`, `out_en`), so it is not caused by this change. Outputs: `C:/tmp/rh_gate/wb_id`, `wb_en`, `wb_clash_id.json`, `wb_clash_en.json`.

Next: review recommended (scope: `shortenAtWord` and its tests); the DEV gate can be re-run once deployed.
