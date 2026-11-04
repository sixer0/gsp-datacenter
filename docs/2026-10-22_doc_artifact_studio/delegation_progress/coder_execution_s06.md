---
task_slug: doc_artifact_studio
row: S06 (DATUM Rev A blueprint)
date: 2026-11-04
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/02_structured_datum_rev_a.md
status: complete
---

# S06 (DATUM Rev A): wrapper text single source

Behaviour-preserving refactor. Bindings: D-595, D-597 D-7, research/33 findings B-01, B-05, B-06, B-10, B-11. Skill loaded: `tdd`. The `dry-run-verify-fix` checks (test, typecheck, lint and the AC-7 checks) were run by hand; their commands and results are below.

Note: this file already held an older S06 report, dated 2026-10-23, from a different blueprint (params/page.ts, G1a). That report is kept unchanged at the end of this file.

## Changes Made

| File | Change | Description |
|---|---|---|
| `src/lib/studio/engine/front/texts.ts` | modify | Added `CONTROL_SHEET_COLUMNS` (ID entries only, exactly the old literals) and `controlSheetColumnHeads(kind, lang = "ID")`. A language without an entry falls back to ID. Added `sealBandTextsOf(meta, params)`. Added `REGISTER_WORDS` (`{ EN: { LEMBAR: "SHEET", DARI: "OF" } }`, so ID has no translation) and `registerWordsText(text, lang)`. The `wrapper.header` and `device.issueStamp.format` fallbacks are now read once from `PARAMS_BY_KEY.get(key).default`, the same way as `engine/symbols/primitives.ts:22`. If that default is missing or has the wrong shape, it throws `StudioEngineError("SCHEMA_INVALID")` at module load. `issueStampTextOf` uses the registry default instead of a literal |
| `src/lib/studio/services/compose/front.ts` | modify | Removed `REVISION_HEAD`, `VERIFICATION_HEAD` and `DISTRIBUTION_HEAD`. It now calls `controlSheetColumnHeads(...)` (default ID, as before). No language wiring was added; that is S14 |
| `src/lib/studio/engine/docx/wrapper/render.ts` | modify | `sealBandTexts(b)` now delegates to `sealBandTextsOf(meta, b.params)`. The export and its signature are unchanged, because `pages.ts` and `wrapper/index.ts` re-export it |
| `src/lib/studio/engine/docx/package/header-footer.ts` | modify | B-10: the running-head label now uses `chapterLabelText(unit.key, unit.kind === "appendix", lang)` in place of the inline Bab/Chapter/Lampiran/Appendix ternary. B-11: removed `REGISTER_WORDS_EN`; `literal` uses `registerWordsText` |
| `src/lib/studio/engine/html/base/markup.ts` | modify | B-11: removed `REGISTER_WORDS_EN`; `registerCellParts` uses `registerWordsText` |
| `tests/unit/studio/renderers/s06-wrapper-text-single-source.test.ts` | add | 10 tests that pin the ID output (and the current EN behaviour) at the public seams: the table helpers, `composeV2` control-sheet header rows, `sealBandTextsOf`, `issueStampTextOf`, `registerCellParts` (HTML), `defaultRunningHeadLeft` (DOCX), and the DOCX footer register words from a full `assembleDocxDetailed` |

`src/lib/studio/params/page.ts` was not edited (`git diff --stat` lists only the 5 files above under `src/lib/studio` for this row). `WRAPPER_TEXT` keys are unchanged, so the key-set assertion in the fix2 test still holds.

## TDD sequence

| Step | Command | Result |
|---|---|---|
| Red | `npx vitest run tests/unit/studio/renderers/s06-wrapper-text-single-source.test.ts` | `Tests 5 failed / 5 passed (10)`. The 5 failures are the new helpers (`controlSheetColumnHeads`, `sealBandTextsOf`, `REGISTER_WORDS` are undefined). The 5 passes are characterisation tests on existing seams (compose header rows, issue stamp, HTML register cell, running head, DOCX footer), recorded before the refactor |
| Green | the same file plus `fix2-wrapper-text-parity.test.ts` | `Test Files 2 passed (2)`, `Tests 21 passed (21)` |

## Test Results

| Test type | Command | Result |
|---|---|---|
| Wrapper parity + new tests | `npx vitest run tests/unit/studio/renderers/s06-wrapper-text-single-source.test.ts tests/unit/studio/renderers/fix2-wrapper-text-parity.test.ts` | 2 files, 21/21 passed |
| Renderers/compose/render + manifest | `npx vitest run tests/unit/studio/renderers tests/unit/studio/compose tests/unit/studio/render/ tests/unit/studio/figures/clean-svg-manifest.test.ts` | `Test Files 35 passed (35)`, `Tests 391 passed (391)`, 71.1 s. That is S05's 377 + 4 manifest + 10 new |
| Wider engine suites | `npx vitest run tests/unit/studio/engine-core tests/unit/studio/structure tests/unit/studio/fix1 tests/unit/studio/contract tests/unit/studio/registry tests/unit/studio/import tests/unit/studio/completeness` | `Test Files 57 passed (57)`, `Tests 1550 passed (1550)` |
| Typecheck | `npx tsc --noEmit` | exit 0 with no output, so no errors anywhere, including the files other agents were editing when it ran |
| Lint | `npx eslint` on the 5 source files and the new test | exit 0 |
| Manual 000 | `npx tsx benchmark/extract/convert_v2.ts --check` | exit 0. `SAME doc.v2.json 79290e07...`, `SAME template.v2.json 882057c5...`, `SAME datum-manual-000.preset.json a951b149...` |
| S05 ID baseline | `npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root C:/Users/TRIAL/gsp-swarm-hq-v2.1 --out C:/Users/TRIAL/AppData/Local/Temp/s06cmp --inputs C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline/inputs --compare C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline` | exit 0, `compare: 8/8 SAME`. All 8 DOCX/HTML hashes equal the S05 table, for example `a_terbit_datum_gsp DOCX 633e583f...` and `b_nota_datum_kanonik HTML 030e1cda...` |

The baseline run happened while other agents were editing `bind/format.ts`, lint and governance files. 8/8 SAME means the tree as it stood then, including their edits, rendered the ID samples byte-identically.

## Grep evidence (0 ID wrapper strings outside the table for these areas)

Run from the repo root, scope `src/lib/studio`, `*.ts`:

| Pattern | Hits outside `engine/front/texts.ts` |
|---|---|
| `"(Uraian\|Lapis\|Pemegang\|Salinan)"` | 0 (the only hits are `texts.ts:78-80`) |
| `SALINAN INDUK\|KLASIFIKASI · \{kelas\}\|TERBITAN \{n\}` | Only the registry `params/page.ts:339,439` (the source of truth) and a doc comment at `docx/wrapper/render.ts:347` (it describes the issue-stamp format and is not a fallback value) |
| `"(Bab\|Chapter\|Lampiran\|Appendix)"` in `engine/` and `services/` | 0 in the engine outside `texts.ts:50-51`. Two hits are outside this row's scope and not in research/33: `services/completeness/texts.ts:174` (completeness message) and `services/render/naming.ts:99` (file-name label) |
| `REGISTER_WORDS\|LEMBAR: "SHEET"\|DARI: "OF"` | 0 (only `texts.ts:255-264`) |

## Verification against the row's acceptance checks

- fix2-wrapper-text-parity is green (11/11 inside the 21/21 run).
- The renderers suite is green (391/391 together with compose, render and the manifest).
- There are 0 ID wrapper strings outside the table for B-01/B-05/B-06/B-10/B-11 (grep above).
- ID output is unchanged: the S05 baseline is 8/8 SAME and convert_v2 is SAME x3.

## Persistent Issues

| Issue | Attempts | Root cause | Status | Blocking? |
|---|---|---|---|---|
| none | - | - | - | no |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| Table shape | `WRAPPER_TEXT` requires ID and EN on every entry, and the fix2 test pins its key set. Column headings are arrays with no EN yet | I added a separate `CONTROL_SHEET_COLUMNS` table in the same module, typed `{ ID: required, EN?: optional }`. S13 adds `EN` entries there without changing the type |
| Seal-band helper signature | research/33 suggests `sealBandTextsOf(meta, params, lang)` | I implemented it without `lang`, because no EN values exist yet (the brief says to add no EN values). S13 adds the parameter |
| Registry default read | Fallback values come from `PARAMS_BY_KEY` at module load and fail loudly if missing, following the `primitives.ts` precedent | Registry defaults unchanged, so `paramsSha256` is unaffected |
| Existing report file | `delegation_progress/coder_execution_s06.md` already held a 2026-10-23 report from a different blueprint (tracked in git, commit 9c1648d) | I put this report first and kept the old content unchanged below it |
| Out of scope (observation) | The HTML seal band (`html/blocks/device.ts:143-147`) does not read `wrapper.header`: left = classification, right = copyControl, while DOCX uses the `wrapper.header` pattern. The two renderers behave differently here; this is not a duplicate | Not changed; reported for the controller (possible S13/S15 follow-up) |
| Review | Behaviour-preserving refactor across the DOCX and HTML renderers | Review recommended. Scope: the 5 source files above plus the new test |

## Next Steps

- S13: add EN entries to `CONTROL_SHEET_COLUMNS` and a `lang` parameter to `sealBandTextsOf`.
- S14: wire the language into `controlSheetFront` / `compose/snapshot.ts:427`.

---

# Earlier report kept unchanged (2026-10-23, different blueprint)

# S06 coder-execution: params/page.ts (G1a)

Status: complete. Berkas: `src/lib/studio/params/page.ts` (satu-satunya yang ditulis).

## Angka
- `PARAMS_PAGE.length` = 91 = `PARAMS_PAGE_COUNT`; P4G 17, P4R 15, P4S 27, P4V 16, P4K 6, P4A 10; id dan key unik 91/91.
- Kelas: B 58, K 20, T 13 (semua T punya `derive`). Tanpa default null. Tanpa U+2014.
- tsc: grep `src/lib/studio/params/page` kosong (total galat repo 3, di luar area). eslint exit 0.

## Keputusan
- K-06: `rules.hairMm` 0,20 logis; kuantisasi lewat `rules.wordLadderSz` (P4R-11, T, derive wordLadder). Tidak ada R-xx khusus garis rambut di render.ts.
- K-11/KT-07: `layout.railMode` enum auto|A|B, default auto, class B + `derive: "railMode"` (katalog menulis T; T read-only akan memblokir override profil Manual 000).
- G-02: `cover.title.sizePt` type pt default 24, range 24-26 (katalog: "range pt").
- G-03: `grid.topBottomMarginMm` 26 (datum_docx.py:453 interior 26/26; :407 sampul 26 atas, 24 bawah). BM terukur 26,00/24,01 (research/07:641-642).
- D-09/V-03: P4R-08 ink900, `rek: true` (research/04 T035).
- P4V-08 kicker dan P4V-10 scopeLine default "" (isi per dokumen; contoh Manual 000 di classNote). Alamat, entitas, NIB, kepala wrapper, pemegang tanda tangan memakai nilai asli research/04 T001-T008.
- Tebal garis diberi `range.min` 0,18 (lantai P4R-09). Daftar subset diberi `enum`; kunci K tetap berenum satu nilai.

## Temuan
- Margin 26+26 = 52 mm memberi area teks 245 mm, sedangkan P4G-11 = 247 mm (297-247 = 50, tersirat L4009). Tidak diputus; untuk S11/S95.
- P4S-12 default = U+00A0 (ditulis `\u00A0`).

## Permintaan lintas pemilik
Tidak ada.
