---
task_id: datum_rev_a
task_slug: doc_artifact_studio
row: G-FIX1 (S33 coverage remediation, D-606) + item (g) (CR-1/RB-02 classification capitals, controller message)
date: 2026-11-04
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/02_structured_datum_rev_a.md
status: complete
---

# Implementation Report: G-FIX 1, DATUM point coverage for the 10 new templates

Skills loaded: `tdd` (red then green per item), `dry-run-verify-fix` (gate below). Every change went red first:
the updated or new test failed before the production edit, then passed after it.

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| a | LB-08 EN "Annex" via the text table, plus scorer LB-03 | done | `WRAPPER_TEXT.appendix.EN` = "Annex"; used by kicker, TOC label, running head, part-divider list. LB-03 EN accepts ANNEX (APPENDIX still accepted) |
| b | LB-07 EN BAHASA "English (UK)" | done | One small language-value table in `texts.ts`; ID values unchanged |
| c | GF-24 `layout.railMode: "A"` in the shared spec layer | done (value pinned; coverage stays P) | Preset already carries A; DOCX keeps per-paragraph rail by design (D-342), see Findings |
| d | GF-17 zebra threshold in the shared spec layer | done | `table.zebra.minRows: 1000`, the same value and convention as the GSP DATUM preset (Manual 000 profile) |
| e | Wire unread registry params only if the default reproduces today's output | none wired | Every candidate has default != current output, or there is no parameter at all. Values below |
| f | NC-07 EN "In words:" | skipped | Not small and not data-only, reason below |
| g | Classification marking in capitals (controller message) | done | One helper `classificationMarkText` in `texts.ts`; every wrapper print site routes through it |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| `src/lib/studio/engine/front/texts.ts` | modify | (a) `appendix.EN` = "Annex"; (b) `LANGUAGE_VALUE_TEXT`/`languageValueText` (EN doc in EN wrapper = "English (UK)"); (g) new export `classificationMarkText`, used for `{kelas}` in the seal band and `{KELAS}` in the issue stamp |
| `src/lib/studio/engine/docx/package/header-footer.ts` | modify | (g) running-head right text and register cell `{kelas}` through `classificationMarkText` |
| `src/lib/studio/engine/html/base/markup.ts` | modify | (g) HTML running head and register `kelas` through `classificationMarkText` (the register was already upper-cased inline) |
| `src/lib/studio/engine/html/blocks/device.ts` | modify | (g) HTML ID seal-band default (classification on the left) through `classificationMarkText` |
| `src/lib/studio/services/compose/front.ts` | modify | (g) `markClassificationPairs`: in cover control rows, the text value next to a classification label (`FRONT_PAYLOAD_LABELS.classification`, ID "Klasifikasi" / EN "Classification", the MCP client's own labels) is upper-cased. One place for DOCX and HTML |
| `prisma/seed-doc-type-templates.ts` | modify | (c)(d) shared layer adds `layout.railMode: "A"` and `table.zebra.minRows: 1000`; docblock updated |
| `benchmark/datum_conformance/rules/expect_language.ts` | modify | (a) EN `chapterKickerWords` = CHAPTER, ANNEX, APPENDIX |
| `tests/unit/studio/renderers/gfix1-classification-caps.test.ts` | add | (g) helper, seal band ID/EN, HTML running head and register, compose cover pair, DOCX + HTML full render (mixed case gives capitals; capital input gives identical output) |
| `tests/unit/studio/renderers/s13-wrapper-text-en.test.ts` | modify | (a)(b) new Annex and English (UK) cases; (g) EN seal band expectation `CLASSIFICATION · TERBATAS` (input `Terbatas`) |
| `tests/unit/studio/renderers/fix2-wrapper-text-parity.test.ts` | modify | (a)(b) EN expectations `Appendix` to `Annex`, `English` to `English (UK)` (6 lines; ID lines untouched) |
| `tests/unit/studio/renderers/s06-wrapper-text-single-source.test.ts` | modify | (a) EN running head `· Annex Z` |
| `tests/unit/studio/datum-conformance/language.test.ts` | modify | (a) LB-03: ANNEX passes on EN, APPENDIX passes, LAMPIRAN on EN fails, ANNEX on ID fails |
| `tests/unit/studio/seed/s26-doc-type-template-specs.test.ts` | modify | (c)(d) layer expectation; the ADMIN seed caller may write both keys; USER is refused zebra (class K); registry defaults unchanged (`auto`, 12) |
| `delegation_progress/file_claims.md` | modify (append) | G-FIX1 claim row |

Not touched: `src/lib/studio/engine/lint/**`, `bind/audit.ts`, `tests/unit/studio/compose/s29-usage-parity.test.ts`, registry (`src/lib/studio/params/**`), `prisma/seed-studio-templates.ts` (no change needed), `scripts/studio/mcp/**`.

## Per-point outcome and expected coverage

C = covered, P = partial, N = not covered, NA = not applicable. "Now" is the S33 matrix (`verification/22`); "after" is my expectation. The controller re-scores.

| Point | Change or reason | PT | PT-en | LAP | LAP-en | VER | VER-en | STD | STD-en | NOT | NOT-en |
|---|---|---|---|---|---|---|---|---|---|---|---|
| LB-08 | EN appendix word is "Annex" in the opener kicker (`ANNEX A` via caps role), TOC label `Annex A`, running head `· Annex A`, part-divider list. Seen in the pure render: `Annex A` x3 in the EN DOCX. EN only, ID unchanged | NA | N to **C** | NA | N to **C** | NA | N to **C** | NA | N to **C** | NA | N to **C** |
| LB-07 | BAHASA value for an EN document in an EN wrapper is "English (UK)" (seen in the EN render). EN T/S only | NA | P to **C** | NA | P to **C** | NA | P to **C** | NA | P to **C** | NA | NA |
| GF-17 | `table.zebra.minRows: 1000` in the shared layer (DOCX `tables/render.ts:495` and HTML `tables/table.ts:334` read it). Tints are 15/30. Correction: the preset already sets 1000 (`benchmark/manual000/template.json:882`, kept by `seed-studio.ts` `toDatumGspProfile`), so zebra was already off; the layer makes it template data | P to **C** | P to **C** | P to **C** | P to **C** | P to **C** | P to **C** | P to **C** | P to **C** | P to **C** | P to **C** |
| GF-24 | `layout.railMode: "A"` in the shared layer. Output is unchanged: the preset already has A (`template.json:816`, `essentialsGlobal` lists it). HTML keeps the 32 mm rail (`st-rail-a`; the same template with `auto` renders `st-rail-b`). The DOCX is identical for `auto` and `A` (sha equal; `pgMar` right 1134 tw): DOCX mode A with the `framePr` renderer narrows only paragraphs that carry rail chips (K2 rev B, D-342, `docx/blocks/rail.ts:14-21`), so the DOCX/PDF never reserves an empty rail. Changing that would change existing ID output (the datum-gsp preset also has A), which constraint (1) forbids | P | P | P | P | P | P | P | P | P | P |
| CS-06 | Not wired. `controlSheet.signatures.roles` default `["DISUSUN","DIPERIKSA","DISAHKAN"]` (always 3) vs current payload roles `Disusun`/`Diperiksa`/`Disetujui` (EN Prepared by/Reviewed by/Approved by), 1 to 3 by optional checker/approver. Default != current output | P | P | P | P | P | P | P | P | NA | NA |
| CS-08 | Not wired. `controlSheet.verificationChain` default columns `LAPIS, METODE, OBJEK, HASIL`, layers V1 "Baca baris per baris"/V2 "Eksekusi"/V3 "Render dan periksa" vs current `Lapis, Peran, Nama, Tanggal` with people layers from the payload. Default != current output | P | P | P | P | P | P | P | P | NA | NA |
| CS-09 | Not wired. `controlSheet.methodStatement.required` default `true` (class K) vs current: the method block appears only when the payload sends it, with no enforcement. Any wiring of `true` (placeholder, warning or block) changes output for method-less documents of existing templates; a lint form would be in `engine/lint/**` (not my file). Default != current output | P | P | P | P | P | P | P | P | NA | NA |
| CS-11 | Not wired. `controlSheet.revisionHistory.columns` default `REV, TANGGAL, PENYUSUN, PERUBAHAN, STATUS` vs current `Rev, Tanggal, Uraian, Oleh`; `controlSheet.distribution.columns` default `SALINAN, PEMEGANG, MEDIA, KEMBALI` vs current `Salinan, Pemegang`. Default != current output | N | N | N | N | N | N | N | N | NA | NA |
| TR-07 | Not wired. `naming.file.pattern` default `{judul} {nomorBerkas}` vs current `<title> <number> Rev<r>` (`storage/paths.ts:196-205`): the default drops `Rev<r>`, so default != current output. It is also class T (derive `fileName`), so a template cannot set the manual value (PARAM_CLASS_T_READONLY) | NA | NA | NA | NA | NA | NA | NA | NA | P | P |
| CV-20 | No existing parameter for the title width (only `cover.title.sizePt`). The roleFormats route was declined by D-605 (1) | N | N | N | N | N | N | N | N | NA | NA |
| CS-12 | No existing parameter or text for the control-sheet subtitle | N | N | N | N | N | N | N | N | NA | NA |
| CV-15 | No existing parameter for the preparer value; PENYUSUN = mandatory agent input `meta.author` (U3). `controlSheet.signatures.holders` (unread) is the signature holders list, not the cover preparer, and its default would replace agent-sent holders (default != current) | N | N | N | N | N | N | N | N | NA | NA |
| NC-07 EN | Skipped: no data field marks a sum as "binding", so generation would need a new payload flag (U3) or a heuristic over every register sum; the English number-words generator and its placement belong in `engine/bind` (not in my file list; `bind/audit.ts` is busy). Not small | P | N | P | N | P | N | P | N | N | N |

Item (g) fixes measured rules (CR-1 critical, RB-02), not coverage points.

### Expected coverage after G-FIX1 (shown exactly, no rounding up)

| Pair | S33 | Delta | After |
|---|---|---|---|
| PT ID / STD ID | 11.5/29 = 39.7 % | GF-17 +0.5 | 12/29 = 41.3 % |
| PT EN / STD EN | 12/29 = 41.4 % | LB-08 +1, LB-07 +0.5, GF-17 +0.5 | 14/29 = 48.2 % |
| LAP ID / VER ID | 11/28 = 39.3 % | GF-17 +0.5 | 11.5/28 = 41.0 % |
| LAP EN / VER EN | 11.5/28 = 41.1 % | LB-08 +1, LB-07 +0.5, GF-17 +0.5 | 13.5/28 = 48.2 % |
| NOT ID | 6.5/16 = 40.6 % | GF-17 +0.5 | 7/16 = 43.75 % |
| NOT EN | 6.5/16 = 40.6 % | LB-08 +1, GF-17 +0.5 | 8/16 = 50.0 % |

All pairs stay below 85 %. The remaining gap is agent content, missing engine features, or unread parameters whose defaults differ from current output. None of these can move under constraints (1) to (4).

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Unit (studio, all) | `npx vitest run tests/unit/studio` | 253 files, 4682 tests passed, exit 0 | Includes the lint agent's files at run time (s29 passed: 14/14) |
| Red step (a)(b) | `npx vitest run <4 files>` before the edit | 9 failed / 74 passed | After the edit: 83/83 |
| Red step (g) | `npx vitest run tests/unit/studio/renderers/gfix1-classification-caps.test.ts` before the edit | 7 failed (`classificationMarkText is not a function`, `KLASIFIKASI · Terbatas`) | After: 9/9 |
| Red step (c)(d) | `npx vitest run tests/unit/studio/seed/` before the spec edit | 1 failed | After: 48/48 |
| ID baseline | `npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root C:/Users/TRIAL/gsp-swarm-hq-v2.1 --out C:/tmp/bl_gfix1 --inputs C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline/inputs --compare C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline` | `compare: 8/8 SAME`, exit 0 | DOCX/HTML sha equal to baseline, e.g. a_terbit_datum_gsp DOCX `633e583f...` |
| Manual 000 | `npx tsx benchmark/extract/convert_v2.ts --check` | `SAME doc.v2.json 79290e07...`, `SAME template.v2.json 882057c5...`, `SAME datum-manual-000.preset.json a951b149...` | |
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | exit 0, no output | |
| Lint | `npx eslint <13 touched files>` | exit 0, no output | |
| Seed dry-run | `npx tsx prisma/seed-studio.ts --doc-type-templates --dry-run` | exit 0; DB `gsp_agent_hq_v21`; `guard.ok: true`; `changedTemplates: []`, `addedTemplates: []`, `otherTemplates: 7`, `sectionTypesTouched: []`; 10 x `outcome: new-version, versionNo: 2`, `storedOk: true`, `storedIssues: []`; "transaksi di-rollback (0 tulis)" | Real DEV seed NOT run (controller's step) |
| Pure render (c) | `scripts/parity/run/render_cli.ts` for `datum-laporan` (TERBIT, ID) and `datum-laporan-en` from spec-built `studio.template/v2` files (preset = frozen `datum-gsp.preset.json`), variants G-FIX1 / without the two keys / explicit `auto`+12 | 6 renders, exit 0, job SUCCEEDED | Work dir `C:/tmp/gfix1` |
| DOCX validity | hermes venv `-I` zip `testzip()` + `minidom` parse of every XML part | zip ok, 0 XML errors, 47 parts (all 4 DOCX) | |
| Lint delta | `render_report.json` lint, G-FIX1 vs control | new: [] , gone: [] (ID and EN) | Same 5 pre-existing FAILs in both: C-27, D16 issueStampColophon, D17, D18, DATUM-15 (sample-content findings) |
| Clash | `VENV -I -B benchmark/datum_conformance/clash/clash.py --docx ... --pdf ... --out ... --work-dir C:/tmp/gfix1/cw_<slug>` | `0 clashes on 7 pages` for both, exit 0 | |

## Verification

- (a) LB-08: s13/fix2/s06 tests are green with `Annex`; EN render text contains `Annex A` (TOC, opener, running head `... · Annex A · Data Pendukung`). LB-03 test: ANNEX on EN = pass.
- (b) LB-07: test `controlBlockRowsText(EN meta, BAHASA, EN)` = `English (UK)`; EN render text contains `English (UK)`.
- (c)(d): s26 test pins the layer; seed dry-run layer shows `"layout.railMode":"A","table.zebra.minRows":1000`; renders show identical DOCX/HTML sha for G-FIX1 vs without (values equal the preset), and `auto` changes the HTML only (`st-rail-b`), not the DOCX.
- (g): the new test proves mixed case gives capitals in the DOCX headers, footers (register) and body, and in the HTML visible text, with no `Terbatas` left. Capital input gives output identical to mixed-case input. Baseline (capital `TERBATAS`) 8/8 SAME.
- Constraint (2): no registry file touched (`git diff --stat src/lib/studio/params` shows only the earlier `governance-language.ts` change, not mine). Constraint (3): no payload or schema change. Constraint (4): no slug or type branch; the cover pair uses text-table labels. Constraint (5): the guard is ok and the 7 other templates are unchanged.

## Findings for the controller

1. **Matrix assumption A2 is false for two keys.** The `datum-gsp-preset` profile already sets `layout.railMode: "A"` and `table.zebra.minRows: 1000` (`benchmark/manual000/template.json:816, 882`). The seed keeps both, since `toDatumGspProfile` drops only `lint.enforcement*`. The S33 judgements for GF-17 (zebra on above 12 rows) and GF-24 (auto falls to B) therefore described registry defaults, not what the templates inherit. GF-17 is C with or without this cycle. GF-24 stays P only because of the DOCX design (D-342).
2. **GF-24 cannot reach C under constraint (1).** DOCX rail space is per paragraph (K2 rev B). Reserving an empty 32 mm rail would change the existing datum-gsp ID output.
3. **The DEV new versions come from the layer.** The 10 templates get version 2 because the stored overrides gain `table.zebra.minRows` (`layout.railMode` was already among the global essentials). Rendered output for these templates is unchanged by (c)/(d); (a), (b) and (g) are engine changes and apply right away.
4. **The EN slot label `Appendices`** (`LANGUAGE_LAYERS`, register §3.3) was left unchanged. It is a slot label, not the printed appendix word. If the controller wants `Annexes`, that is a one-line spec change plus an s26 register update.
5. **(g) scope:** `docProps/core.xml` description (`docx/package/parts.ts:302`) and the HTML `<meta name="studio:classification">` still carry the stored value. Both are metadata and are not printed.

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Coverage still below 85 % on every pair (41.0 % to 50.0 %) | 1 cycle | Agent-content points, missing engine features, unread params whose defaults differ from current output | Recorded; re-score and next decision belong to the controller (D-606: cycle 2 maximum) | Yes for the S36 coverage criterion as specified |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| a | Should LB-03 still accept APPENDIX? | Yes. LB-03 is a language rule and both words are English. LB-08 (coverage) is judged separately |
| d | Zebra value: 1,000,000 vs 1000 | 1000: the established Manual 000 convention ("1000 menonaktifkan zebra") and the preset's own value, so output is unchanged |
| c | Keep `layout.railMode: "A"` even though the preset already provides it | Kept, as D-606 (b) asks: it becomes template data independent of the preset version |
| e | Wire any of CS-06/08/09/11, TR-07? | None: each default != current output (values in the table). CV-20, CS-12 and CV-15 have no parameter |
| f | NC-07 EN generator | Skipped: needs a binding-sum marker (U3) and bind-layer code outside my file list |
| g | Identify the MCP classification pair without slug or type branching | Match the label cell against the text table's classification labels (ID/EN) in compose; upper-case only plain-text values |

## Next Steps

- Controller: run the real DEV seed (`--doc-type-templates`), re-score coverage and the DEV smoke (CR-1/RB-02 should now pass for mixed-case classification), then decide on G-FIX cycle 2 or the release decision.
- Review recommended (scope: `engine/front/texts.ts` helper and its 5 call sites, `compose/front.ts` cover-pair rule, spec layer).
