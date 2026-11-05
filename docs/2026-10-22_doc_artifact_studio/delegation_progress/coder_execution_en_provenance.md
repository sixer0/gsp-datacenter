---
task_id: EN-PROV
task_slug: doc_artifact_studio
row: EN provenance mark labels (DATUM Rev A Table 7.1)
date: 2026-11-05
agent: coder-execution
source_plan: controller brief (no plan row)
status: complete
---

# Implementation Report: EN provenance mark labels

Skills loaded: `tdd`, `dry-run-verify-fix`. Nothing committed.

## Summary

- EN documents now print the provenance mark labels MEASURED / DERIVED / VENDOR / ASSUMED. ID documents still print TERUKUR / DITURUNKAN / PEMASOK / ASUMSI. The source is DATUM Rev A Table 7.1: EN `manual_en.txt:2114-2124`, ID `manual_id.txt:2040-2051`. Both were read and confirmed.
- The labels come from one table in `engine/front/texts.ts`:
  - `PROVENANCE_MARK_TEXT`, keyed by contract mark code, then by language;
  - `provenanceMarkLabelText(mark, lang)`. A code outside the enum is returned as-is.
- The mark codes in content, the snapshot, the API and the HTML `data-mark` attributes are unchanged. Only the printed text changes.
- ID output is byte-identical: baseline 8/8 SAME, convert_v2 SAME x3.
- The classification level (TERBATAS, EG-50) and the tier names (NOTA/TERBIT/SERAH) are not touched.
- The four coordinated files were edited only after `coder_execution_review_fixes_c34b.md` existed with `status: complete`. One line plus the import line in each file.

## Print sites changed

| Site | File:line | Before | After |
|---|---|---|---|
| DOCX rail chip (also the DOCX assumptionInline `△ ASUMSI` line, which goes through the rail) | `engine/docx/blocks/rail.ts:181` | `line.label ?? line.mark` | `line.label ?? provenanceMarkLabelText(line.mark, wrapperLangOf(meta))` |
| DOCX figure SOURCE/PROVENANCE line | `engine/docx/figures/figure.ts:243` | `` ` ${m}` `` | `` ` ${provenanceMarkLabelText(m, langOf(ctx))}` `` |
| DOCX table SOURCE/PROVENANCE row | `engine/docx/tables/render.ts:429` | `` ` ${mk}` `` | `` ` ${provenanceMarkLabelText(mk, lang)}` `` |
| HTML rail chip (label-less mark line) | `engine/html/blocks/text.ts:101` | `? mark :` | `? provenanceMarkLabelText(mark, language(ctx)) :` |
| HTML glyph key / provenance list (table, figure and derivation via `markTag`) | `engine/html/tables/apparatus.ts:73` | `escText(m)` | `escText(provenanceMarkLabelText(m, wrapperLangOf(meta)))` |

The following sites print the glyph only, with no label, so they needed no change:
- DOCX derivation (`docx/figures/derivation.ts:126`);
- HTML reproduction (`html/tables/reproduction.ts:78`);
- diagram node glyph (`diagram/core/svg.ts:209`);
- inline glyph colouring (`docx/blocks/semantic.ts`, `docx/wrapper/render.ts`).

No slug or type branching was added. Language comes from `meta.language` through the existing helpers (`wrapperLangOf`, `langOf`, `language`).

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Grep for TERUKUR/DITURUNKAN/PEMASOK/ASUMSI and the mark tokens in `src/lib/studio/**` | done | Found 5 label print sites (table above) |
| 2 | Red test | done | `en-provenance-mark-labels.test.ts`: all 6 failed (helper missing) |
| 3 | Helper in texts.ts plus the free-file caller (rail.ts) | done | DOCX EN rail now passes. Table/figure/HTML still failed because they are in the coordinated files |
| 4 | Wait for the c34b report | done | Found about 70 s into polling, `status: complete` |
| 5 | Caller lines in the 4 coordinated files | done | 6/6 green |
| 6 | Scorer check | done | No rule expects the ID mark labels (see below) |
| 7 | Gates | done | All pass (below) |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| `src/lib/studio/engine/front/texts.ts` | modify | `PROVENANCE_MARK_TEXT` table and `provenanceMarkLabelText`; `ProvenanceMark` type import |
| `src/lib/studio/engine/docx/blocks/rail.ts` | modify | 1 line plus import |
| `src/lib/studio/engine/docx/figures/figure.ts` | modify | 1 line plus import name |
| `src/lib/studio/engine/docx/tables/render.ts` | modify | 1 line plus import name |
| `src/lib/studio/engine/html/blocks/text.ts` | modify | 1 line plus import name |
| `src/lib/studio/engine/html/tables/apparatus.ts` | modify | 1 line plus import name |
| `tests/unit/studio/renderers/en-provenance-mark-labels.test.ts` | add | Table unit test, unknown code passthrough, snapshot codes unchanged, EN DOCX/HTML labels, ID DOCX/HTML labels |
| `docs/.../delegation_progress/file_claims.md` | modify | Claim row and release row appended |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| New test | `npx vitest run tests/unit/studio/renderers/en-provenance-mark-labels.test.ts` | 6 passed | Red first: 6 failed. After rail.ts only: 2 failed (EN DOCX still showed TERUKUR/DITURUNKAN/PEMASOK from table/figure; EN HTML showed no EN labels) |
| Suite | `npx vitest run` | 298 files passed, 1 skipped; 5194 tests passed, 26 skipped | |
| Baseline | `npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root ... --out C:/tmp/bl_prov --inputs ... --compare ...` | `compare: 8/8 SAME`, 4 INFO compose-snapshot lines, EXIT=0 | Run before and after the coordinated-file edits; same hashes both times |
| Convert | `npx tsx benchmark/extract/convert_v2.ts --check` | SAME x3 (doc.v2 `79290e07...`, template.v2 `882057c5...`, preset `a951b149...`), EXIT=0 | |
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | EXIT=0 | |
| Lint | `npx eslint` on the 7 touched source/test files | EXIT=0 | A wider run over `src/lib/studio benchmark/datum_conformance tests/unit/studio` reports 131 problems. All are in untouched files: `tests/unit/studio/api/*` no-explicit-any, and 1 unused var in `fixf-spine-text.test.ts`. Pre-existing |

## Verification
- EN DOCX and EN HTML pure render: all four of MEASURED/DERIVED/VENDOR/ASSUMED present, and none of TERUKUR/DITURUNKAN/PEMASOK/ASUMSI as whole words. Covers rail chips, assumptionInline (DOCX), table and figure SOURCE/PROVENANCE lines, and the HTML derivation mark tag (test cases 4 and 5).
- ID DOCX and ID HTML: all four ID labels present, no EN labels (test case 6). The baseline samples are byte-identical (8/8 SAME).
- The EN snapshot still carries the codes `"TERUKUR"`, `"PEMASOK"`, `"DITURUNKAN"`, `"ASUMSI"` and no EN label (test case 3).

## Scorer check (benchmark/datum_conformance/rules)
- No rule expects the ID mark labels for EN documents. Grep for TERUKUR/DITURUNKAN/PEMASOK/ASUMSI/MEASURED/ASSUMED in `rules/*.ts` returns nothing.
- `expect_language.ts` EN covers only `runLabels` SOURCE/PROVENANCE/KEY and the apparatus words. The mark labels are in neither language's token lists, so the scorer neither required nor flagged them.
- Possible follow-up, not done (outside the brief): add TERUKUR/DITURUNKAN/PEMASOK/ASUMSI as foreign apparatus tokens for EN, so a regression would be scored. Cite EN Table 7.1, `manual_en.txt:2114-2124`.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| HTML assumptionInline prints no mark label (`[ASM-FAS-01] ... Impact:`). DOCX prints `△ ASUMSI` / `△ ASSUMED` in the rail | 0 (observed, not in scope) | Pre-existing DOCX/HTML parity gap in `html/blocks/text.ts` `renderAssumptionInline` | Reported; the test covers ASUMSI in HTML through a rail mark line instead | No |
| Lint C-31 (`engine/lint/language/checks.ts:194`) counts mark labels in content prose using the ID codes only | 0 | It counts what agents type in content, not engine output | Reported. Only relevant if EN agents type "MEASURED" in prose | No |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 3 | The helper takes `mark: string`, not `ProvenanceMark` | The HTML apparatus receives `marks` from content. A code outside the enum is printed as-is; no label is invented |
| 3 | An explicit `line.label` sent in content still wins over the localized default | Content-owned text is not translated (D-139). v2 compose never sets `label` on rail lines (`services/compose/blocks.ts:141-149`) |
| 5 | Coordinated files were edited | Only after `coder_execution_review_fixes_c34b.md` existed with `status: complete` |

## Next Steps
- Optional: scorer foreign-token entry for the ID mark labels in EN documents (see Scorer check).
- Optional: HTML assumptionInline mark label parity.
- Review recommended, scope: the 7 files listed under Changes Made.
