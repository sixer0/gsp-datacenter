---
task_id: datum_rev_a
task_slug: doc_artifact_studio
row: S13, S14, S15 (+ D-597 D-2/D-3/D-5, D-598 F-2, controller addendum B-08)
date: 2026-11-04
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/02_structured_datum_rev_a.md
status: complete
---

# Implementation Report: S13-S15 EN wrapper texts, control sheet language, seal band, apparatus labels

Bindings: D-595 (no slug/type branching), D-597 D-2/D-3/D-5, D-598 F-2, register `research/31` §4.1-§4.4, sweep `research/33` B-01, B-02, B-05..B-08, B-15, B-16. Skills loaded: `tdd`, `dry-run-verify-fix`.

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Red: new test `s13-wrapper-text-en.test.ts` (texts.ts seams, compose seam, EN pure path DOCX+HTML) | complete | First run: 11 failed, 1 passed, 4 skipped |
| 2 | S13 texts.ts: EN column heads, PENYUSUN "Prepared by", seal-band pair + issue-stamp format per language, `lang` on `sealBandTextsOf`/`issueStampTextOf` | complete | EN only when the param value equals the registry default; `params/page.ts` not edited |
| 3 | S14 compose: kicker, default title and column heads follow `meta.language`; `snapshot.ts:427` passes the language (D-5) | complete | |
| 4 | S15 seal band DOCX (`render.ts`) and HTML (`device.ts`) | complete | HTML ID path unchanged (B-07); see Decisions |
| 5 | F-2/D-2/D-3: apparatus labels and caption display in one table (`APPARATUS_TEXT`), DOCX and HTML | complete | Addresses/numbering untouched |
| 6 | Verdict tag in `bind/derivation.ts` (done last, after `coder_execution_s16_s18.md` existed) | complete | Red test first, then 1 line + 1 import |
| 7 | Controller addendum: `CLIENT_ONLY_LABELS` moved to texts.ts (`FRONT_PAYLOAD_LABELS`), write-client imports it, TODO removed | complete | |
| 8 | Dry-run gate: suites, baseline, convert_v2, tsc, eslint | complete | 0 repair cycles on production code (test expectations fixed twice, see Decisions) |

## Changes Made

| File | Change | Description |
|---|---|---|
| `src/lib/studio/engine/front/texts.ts` | modify | `CONTROL_SHEET_COLUMNS` EN entries (`Rev/Date/Change/Prepared by`, `Layer/Role/Name/Date`, `Copy/Holder`); `CONTROL_FIELD_LABELS.PENYUSUN.EN = "Prepared by"`; private `SEAL_BAND_TEXT` / `ISSUE_STAMP_FORMAT_TEXT` (ID = registry default, EN = register §4.4); `wrapperLangOf(meta)`; `sealBandTextsOf(meta, params, lang = wrapperLangOf(meta))`; `issueStampTextOf(meta, params, lang = ...)`; `controlSheetLabelText(slotLabel, lang)`; `APPARATUS_TEXT` + `apparatusText(lang)`, `artifactLabelText(label, lang)`, `verdictTagText(tag, lang)`, `apparatusLabelRunText(text, lang)`; `FRONT_PAYLOAD_LABELS` (addendum) |
| `src/lib/studio/services/compose/front.ts` | modify | `controlSheetFront(..., language?)`: kicker/default title via `controlSheetLabelText`, column heads via `controlSheetColumnHeads(kind, lang)` |
| `src/lib/studio/services/compose/snapshot.ts` | modify | line 427: passes `src.meta.language` (D-5); one-line change |
| `src/lib/studio/engine/docx/wrapper/render.ts` | modify | `sealBandTexts` and `issueStampText` pass `b.lang` |
| `src/lib/studio/engine/html/blocks/device.ts` | modify | `sealBandDefaults(ctx)`: ID keeps classification / copyControl (old behaviour); other languages use `sealBandTextsOf` (same table as DOCX) |
| `src/lib/studio/engine/docx/figures/defaults.ts` | modify | `figureLabels(lang)` from `APPARATUS_TEXT` (uppercase for SUMBER/PROVENANS/KUNCI); `FIGURE_LABELS = figureLabels("ID")` (same values, still exported for compose/adapt-v1 markers) |
| `src/lib/studio/engine/docx/figures/figure.ts` | modify | caption label display via `artifactLabelText`; KEY/SOURCE/PROVENANCE labels by language; EN also recognises ID labels in author text; label runs ("SUMBER  ") shown in the doc language |
| `src/lib/studio/engine/docx/figures/derivation.ts` | modify | derivation label prefix by language (id stripping still uses the ID address prefix); verdict tag display via `verdictTagText` |
| `src/lib/studio/engine/docx/tables/render.ts` | modify | table SOURCE/PROVENANCE labels and runs-form label runs by language; caption display via `artifactLabelText` (fallback `APPARATUS_TEXT.table.ID`) |
| `src/lib/studio/engine/html/tables/style.ts` | modify | `labels(ctx)` now reads `APPARATUS_TEXT` (one source; same values as before) |
| `src/lib/studio/engine/html/tables/apparatus.ts` | modify | caption label display via `artifactLabelText`; runs-form label runs localised for non-ID |
| `src/lib/studio/engine/html/tables/derivation.ts` | modify | verdict tag display via `verdictTagText`; EN head does not repeat the ID address prefix ("Derivation D-2.1", not "Derivation Turunan D-2.1") |
| `src/lib/studio/engine/html/tables/figure.ts` | modify | "figure missing" message label via `artifactLabelText` |
| `src/lib/studio/engine/bind/derivation.ts` | modify | verdict default tag = `APPARATUS_TEXT.verdictPass/verdictFail[this.language]` (1 line + 1 import) |
| `scripts/studio/mcp/write-client.ts` | modify | imports `FRONT_PAYLOAD_LABELS`, local `CLIENT_ONLY_LABELS` and `TODO(S13)` removed (addendum, that change only) |
| `tests/unit/studio/renderers/s13-wrapper-text-en.test.ts` | add | 17 tests |
| `tests/unit/studio/renderers/s06-wrapper-text-single-source.test.ts` | modify | 2 assertions that pinned "no EN entry yet" now pin the EN entries (ID assertions unchanged) |

Not touched: `params/page.ts` (registry defaults), `contract/address.ts`, `engine/docx/assemble/numbering.ts`, `services/ingest/normalize.ts` (they produce API addresses; the translation is display-only at render time), `prisma/*`, `governance-language.ts`, Register sites, other `bind/*` files.

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Red | `npx vitest run tests/unit/studio/renderers/s13-wrapper-text-en.test.ts` | 11 failed / 1 passed / 4 skipped | before production code |
| Red (bind line) | same file, `-t "pembangun"` | 1 failed (`['MEMENUHI','TIDAK MEMENUHI']` vs EN) | before the bind edit |
| New + S06 + FIX-2 + manifest + MCP | `npx vitest run tests/unit/studio/mcp tests/unit/studio/renderers/s13-wrapper-text-en.test.ts tests/unit/studio/renderers/s06-wrapper-text-single-source.test.ts tests/unit/studio/renderers/fix2-wrapper-text-parity.test.ts tests/unit/studio/figures/clean-svg-manifest.test.ts` | `Test Files 36 passed (36)`, `Tests 453 passed (453)` | MCP = 411 (S12's count); after the addendum |
| Renderers/compose/render/figures | `npx vitest run tests/unit/studio/renderers tests/unit/studio/compose tests/unit/studio/render/ tests/unit/studio/figures` | `Test Files 63 passed (63)`, `Tests 969 passed (969)` | after the bind edit |
| Engine suites | `npx vitest run tests/unit/studio/engine-core tests/unit/studio/structure tests/unit/studio/contract tests/unit/studio/registry` | `Test Files 48 passed (48)`, `Tests 1332 passed (1332)` | final tree |
| Other studio suites | `npx vitest run tests/unit/studio/{api,api-contract,api-structure,contracts,draft,ingest,query,security,seed,ui02,ui04} docx-fonts-*.test.ts tests/unit/studio/mcp` | 116/117 files; 5 failures in `mcp/s12-client-labels.test.ts` | S12 was mid-edit; the file alone then passed 12/12 and the mcp folder 32/32 files, 411/411 |
| ID baseline | `npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root C:/Users/TRIAL/gsp-swarm-hq-v2.1 --out C:/tmp/bl_s13 --inputs C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline/inputs --compare C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline` | `compare: 8/8 SAME` | final tree (after addendum); e.g. `a_terbit_datum_gsp DOCX 633e583f...`, `b_nota_datum_kanonik HTML 030e1cda...` |
| Manual 000 | `npx tsx benchmark/extract/convert_v2.ts --check` | `SAME doc.v2.json 79290e07...`, `SAME template.v2.json 882057c5...`, `SAME datum-manual-000.preset.json a951b149...` | final tree |
| Typecheck | `npx tsc --noEmit -p .` | 0 output lines | an earlier run showed 3 errors in `tests/unit/studio/datum-conformance/report-cli.test.ts` (S20's files, missing module); gone in the final run |
| Lint | `npx eslint` on the 15 source files + 2 tests listed above | exit 0 | |

## Verification

- S13 "EN entries = register": the test asserts the §4.1/§4.2/§4.4 values literally (`Prepared by`, `Rev/Date/Change/Prepared by`, `Layer/Role/Name/Date`, `Copy/Holder`, `CLASSIFICATION · {kelas}`, `MASTER COPY · GSP INTERNAL USE`, `// {YYYYMMDD} {BAHASA} {KELAS} -- ISSUE {n}` giving `// 20261103 EN T -- ISSUE 1`).
- Registry defaults unchanged: the test asserts `PARAMS_BY_KEY.get('wrapper.header').default` and `device.issueStamp.format` equal the ID values; `git diff` lists no `params/` file of mine.
- Template value wins in any language; copyControl wins on the right (tests `['K TERBATAS','R']`, `COPY 3`).
- S14: EN compose gives kicker and title `Control Sheet`, EN heads; non-default slot label `Document Control` stays.
- EN pure path (composeV2, then `assembleDocxDetailed` and `assembleHtml`): DOCX (document/header/footer `w:t`) and HTML visible text contain none of `Lembar Kendali, KLASIFIKASI, SALINAN INDUK, TERBITAN, Tanggal, Uraian, Oleh, Pemegang, LEMBAR, Penyusun, Tabel, Gambar, SUMBER, KUNCI, PROVENANS, MEMENUHI, Turunan`. The test matches whole words in the source text and in its uppercase form. Both outputs contain `CLASSIFICATION · Terbatas`, `MASTER COPY · GSP INTERNAL USE`, `Control Sheet`, `Prepared by`, `Holder`, `Table 2.1`, `Figure 2.1`, `Derivation D-2.1` and `COMPLIES`. DOCX also contains `-- ISSUE 1`, `SOURCE`, `PROVENANCE` and `KEY`. HTML contains `Source`, `Provenance` and `KEY`.
- ID byte-identical: baseline 8/8 SAME, convert_v2 SAME x3, the FIX-2 parity test and the S06 ID assertions are green.
- No slug/type branching: `git diff -U0` over my files, added lines matching `slug|typeCode|datum-` = 0.

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| none | - | - | - | no |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| S15 HTML | HTML seal band never used `wrapper.header`: it shows bare `meta.classification` / `meta.copyControl` (research/33 B-07, R-5). Moving ID to the pattern would change HTML ID bytes | ID keeps the old preview behaviour. Non-ID languages use `sealBandTextsOf`, the same table and rules as DOCX. So EN HTML equals EN DOCX, and ID HTML/DOCX keep their pre-existing difference. Controller may want to note this asymmetry |
| `lang` default | Brief asked to add `lang` to `sealBandTextsOf` | Added as an optional third parameter, default `wrapperLangOf(meta)`. DOCX passes `b.lang` explicitly. Same for `issueStampTextOf`, so `colophonTexts` follows the meta language without a signature change |
| Kicker fix location | The compose kicker (slot label) wins over the engine kicker in `pages.ts:285` | Fixed in compose via `controlSheetLabelText`: the slot label equal to `WRAPPER_TEXT.controlKicker.ID` becomes the EN kicker for EN, and any other label wins. The same applies to the default title (it also printed `Lembar Kendali`). `pages.ts` not edited. Snapshots composed before this change keep their stored kicker until recomposed |
| D-3 caption | `Tabel/Gambar/Turunan n.m` are API addresses | Translated only at display (DOCX caption run, HTML caption span, DOCX/HTML derivation head, HTML missing-figure text). `numbering.ts`, `normalize.ts` and `address.ts` are unchanged. Figure-store lookup still uses the raw label. Alt text (`docPr descr` / `aria-label`) still contains the ID label; it is an attribute and outside the AC-6 text scope. Noted for a later round |
| F-2 runs-form markers | Compose (`services/compose/inline.ts`, not my file) inserts `"SUMBER  "` / `"KUNCI  "` runs into the snapshot as structural markers | Kept ID in the snapshot (no compose change, snapshot hashes unchanged). DOCX and HTML render those marker runs in the document language (`apparatusLabelRunText`). Runs-form labels show uppercase (`KEY`, `SOURCE`), as in DOCX |
| Single source | DOCX printed `SUMBER` and HTML printed `Sumber` (CSS caps) | One `APPARATUS_TEXT` table in mixed case. DOCX takes `.toUpperCase()` of the same entry, which is byte-identical to the old literals |
| Verdict EN wording | The manual EN has no verdict text | `COMPLIES` / `DOES NOT COMPLY` (MEDIUM confidence; an English rendering of MEMENUHI / TIDAK MEMENUHI). Controller may override in `APPARATUS_TEXT` |
| "Turunan at bind/derivation.ts:193" | At HEAD, line 193 is the verdict tag line (`MEMENUHI` / `TIDAK MEMENUHI`). The "Turunan" label in DOCX lives in `docx/figures/derivation.ts` (FIGURE_LABELS) | Did the bind line last, after `coder_execution_s16_s18.md` existed (status complete): 1 line plus 1 import (`../front/texts`), red test first. The renderers also map an ID tag for display, so snapshots built before this still render EN |
| Addendum B-08 | Five labels local in write-client (`TODO(S13)`) | Added `FRONT_PAYLOAD_LABELS` to texts.ts with ID values byte-equal to `CLIENT_ONLY_LABELS` (`Klasifikasi, Disusun, Diperiksa, Disetujui, Terbit pertama`) and EN `Classification, Prepared by, Reviewed by, Approved by, First issue`. write-client spreads it and the TODO is removed. MCP suite 411/411 |
| PENYUSUN EN | Changing `CONTROL_FIELD_LABELS.PENYUSUN.EN` from `Author` to `Prepared by` also changes write-client's `author` label (S12 reads it) | Intended by register §4.3 (`author` EN target `Prepared by`). The MCP suite is green |
| Test expectation fixes | Default test meta gives classification `Terbatas`, so the expectation `TERBATAS` was wrong. HTML runs-form key shows `KEY` | Fixed the test expectations, not the code |
| S06 test | Two S06 assertions pinned "no EN entry yet", which S13 supersedes by design | Updated to pin the EN entries; the ID assertions are unchanged |
| Ownership | Beyond the listed files I edited `docx/figures/figure.ts`, `docx/figures/derivation.ts` and `html/tables/{apparatus,derivation,figure}.ts`. They are the consumers of the label table and needed for F-2 in DOCX and HTML. All are claimed in `file_claims.md` | No other agent claim was found on them |

## Next Steps

- Review recommended (scope: the 15 source files above). Check the HTML seal-band asymmetry, display-only caption translation, the `COMPLIES` wording, and the absence of slug/type branching.
- Out of scope, not done: alt text labels (`Gambar n.m` inside `docPr descr` / `aria-label`), chart/diagram SVG `KUNCI` / `SUMBER` (word/media, Q-C), and `services/compose/inline.ts` markers (they stay ID by design).
