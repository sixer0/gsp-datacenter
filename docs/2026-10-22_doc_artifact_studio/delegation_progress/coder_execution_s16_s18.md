---
task_id: datum_rev_a
task_slug: doc_artifact_studio
row: S16, S17, S18
date: 2026-11-04
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/02_structured_datum_rev_a.md
status: complete
---

# Implementation Report: S16 EN number entry, S17 language-aware bind layer, S18 meta.language wiring

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Read rows S16-S18, the S07/S08 report, research/33 §5.4 (D-01..D-19), D-590/D-595/D-597 (D-4: 7 sites) | complete | `research/31_datum_rev_a_names_register.md` existed at the start, so its §5 EN entry is the authority: ",", ".", leading units `["IDR","USD","EUR","SGD"]` with Rp mapped to IDR, `rp()` = `"IDR " + fmt`, percent " %" the same as ID |
| 2 | S16 TDD: new EN test file (red: 25 failures), then `format.ts` (green) | complete | 2 shape pins in the S07 test changed on purpose (see Decisions) |
| 3 | S17 TDD: new `bind-language.test.ts` (red: 17 failures), then register/derivation/audit/index (green) | complete | One wrong expected value in my own fixture (2 x 1,250,000.5) was fixed in the test, not in the code |
| 4 | S18 TDD: pure-render EN/ID test (red: EN still printed ID numbers), then wired the 7 sites (green). Added a lint D01 test; confirmed it fails when the checks-d wiring is reverted, then restored the wiring | complete | |
| 5 | Dry-run gate | complete | 1 cycle, 0 repairs |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| `src/lib/studio/engine/bind/format.ts` | modify | `NumberLanguage = "ID" \| "EN"`. `NumberConvention` gains `currencyUnit` (ID "Rp", EN "IDR") and `unitAliases` (ID `{}`, EN `{ Rp: "IDR" }`). Adds a frozen `EN` entry. `numberConvention(lang)` throws `BindDefect` for an unknown language. New `numberLanguageOf(language)` returns `"EN"` only when the value is exactly `"EN"`, otherwise `"ID"`: the same rule the renderers use (`meta.language === "EN" ? "EN" : "ID"`). `fmt(v, dec = 0, lang = "ID")` and `withUnit(s, unit?, lang = "ID")` gain a trailing language parameter. The ID path keeps the cached ID entry, and with an empty alias table it produces the same output. `formatWith` and `withUnitFor` are now exported so Register can call them with its own convention |
| `src/lib/studio/engine/bind/register.ts` | modify | `new Register(entries, language = "ID")` with a public `language`. `format`, `u`, `rp`, `pct` and `knownForms` use that convention. `rp()` takes its unit from the table (this replaces the hard-coded `"Rp " +`). New `registerForSnapshot(snapshot)` builds a Register from `snapshot.register ?? {}` and `numberLanguageOf(snapshot.doc.meta?.language)`; `RegisterSource` is its input type |
| `src/lib/studio/engine/bind/derivation.ts` | modify | `Derivation.language` comes from the Register, otherwise from `opts.language`, otherwise ID. The `line`, `result` and `verdict` rows and literal number values are formatted in that language. Defect messages keep ID numbers (see Decisions) |
| `src/lib/studio/engine/bind/audit.ts` | modify | `bindNumberPatternSource(lang = "ID")`. For ID it returns the unchanged `BIND_NUMBER_PATTERN_SOURCE` literal. For other languages it builds the same Python `PAT` shape from the table's separators: the lookbehind rejects both separators, and the lookahead rejects the thousands separator. `auditText(text, reg, allow, lang?)`: the language is `lang`, else the Register's language, else ID. Known forms and the pattern both come from that one language, so EN forms are accepted only for EN documents |
| `src/lib/studio/engine/bind/index.ts` | modify | Re-exports `NUMBER_CONVENTIONS`, `DEFAULT_NUMBER_LANGUAGE`, `numberConvention`, `numberLanguageOf`, the `NumberConvention`/`NumberLanguage` types, `registerForSnapshot`, `RegisterSource` and `bindNumberPatternSource` |
| `src/lib/studio/services/render/pure/render.ts` (:351) | modify | `registerForSnapshot(snapshot)` |
| `src/lib/studio/services/render/artifact.ts` (:455) | modify | `registerForSnapshot(snapshot)`. The wrapped-artifact path at :410 has a fixed `language: "ID"` and no Register; I did not touch it |
| `src/lib/studio/services/ingest/checks.ts` (:137, :191) | modify | `new Register(register, numberLanguageOf(snapshot.doc.meta?.language))` |
| `src/lib/studio/engine/lint/structure/checks-d.ts` (:83) | modify | `new Register(ctx.register, numberLanguageOf(ctx.doc.meta?.language))`. D01 `auditText` picks the language up from the Register |
| `src/app/api/studio/validate/_shared/preview-v2.ts` (:44) | modify | `registerForSnapshot(snapshot)` |
| `src/app/api/studio/validate/route.ts` (:128) | modify | `registerForSnapshot(snapshot)` |
| `tests/unit/studio/engine-core/bind-number-conventions-en.test.ts` | add | 31 tests: the EN entry, frozen tables, unknown language rejected, `numberLanguageOf`, `fmt(.., 'EN')` (1250000.5 dec 1 = "1,250,000.5"), `withUnit(.., 'EN')` (IDR and Rp lead as "IDR"; % and kW trail), the ID defaults still in place, `fmtFixed`, and the EN pattern sources |
| `tests/unit/studio/engine-core/bind-number-conventions.test.ts` | modify | Only 2 shape pins changed: the table keys are now `['ID','EN']`, and the ID entry has `currencyUnit: 'Rp'` and `unitAliases: {}`. No ID output pin changed |
| `tests/unit/studio/engine-core/bind-language.test.ts` | add | 18 tests: Register in ID and EN (format/u/rp/pct/knownForms), `registerForSnapshot`, Derivation in EN and ID, verdict and literal values, a plain `RegisterApi` with `opts.language`, the ID audit pattern equal to the old literal, and audit EN/ID acceptance and rejection |
| `tests/unit/studio/engine-core/lint-d01-register-language.test.ts` | add | 4 tests: D01 (SERAH) passes `IDR 1,250,000.5` in an EN document and fails the ID form there. In an ID document it passes `Rp 1.250.000,5` and fails the EN form |
| `tests/unit/studio/renderers/s18-register-language.test.ts` | add | 3 tests through `renderSnapshot` (HTML, the pure render path). The SERAH fixture is trimmed to its derivation chapter, plus a register line `biaya_pasang` (1250000.5, dec 1, unit "Rp"). EN contains `IDR 1,250,000.5` and neither `1.250.000,5` nor `Rp 1`. ID contains `Rp 1.250.000,5` and neither `1,250,000.5` nor `IDR 1`. The other register numbers follow too (`18.4 kW` in EN, `18,4 kW` in ID) |

Not touched: `src/lib/studio/contract` (`RegisterApi` unchanged; `language` is a property of the `Register` class), the 39 chart modules (D-596 Q-C), `bind-format.test.ts`, `bind-derivation.test.ts`, `bind-arith.test.ts`, and every file owned by other agents.

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Unit engine-core | `npx vitest run tests/unit/studio/engine-core` | 15 files, 422 tests passed | S07 baseline was 12 / 369 |
| Pure render EN/ID | `npx vitest run tests/unit/studio/renderers/s18-register-language.test.ts` | 3 / 3 passed | |
| Full studio suite (render, ingest, lint, api, figures, ...) | `npx vitest run tests/unit/studio` | 238 files, 4400 tests passed, exit 0 (302 s) | |
| Typecheck | `npx tsc --noEmit -p .` | exit 2; 17 errors, all TS2307 and related, in `benchmark/datum_conformance/rules/types.ts` (2) and `tests/unit/studio/datum-conformance/rule-index.test.ts` (15) | 0 errors in my files. Both files are another agent's in-progress, untracked work (missing `../catalog`, `../lib/layout`, `.../rules`). Reported, not fixed |
| Lint | `npx eslint` on the 11 source files and 5 test files above | exit 0 | |
| Manual 000 | `npx tsx benchmark/extract/convert_v2.ts --check` | SAME x3 (doc.v2 `79290e07...`, template.v2 `882057c5...`, preset `a951b149...`) | |
| Clean-SVG manifest | `npx vitest run tests/unit/studio/figures/clean-svg-manifest.test.ts` | 1 file, 4 tests passed | |
| ID baseline (AC-7) | `npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root C:/Users/TRIAL/gsp-swarm-hq-v2.1 --out C:/tmp/bl_s18 --inputs C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline/inputs --compare C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline` | `compare: 8/8 SAME`, exit 0 | Run on the live tree, which also holds the other agents' in-progress edits |

## Verification
- **S16: 1250000.5 in EN with dec 1 gives "1,250,000.5", and IDR leads.** `bind-number-conventions-en.test.ts`: `fmt(1250000.5, 1, 'EN') == '1,250,000.5'`; `withUnit(.., 'IDR', 'EN') == 'IDR 1,250,000.5'`; `'Rp'` in EN gives `'IDR 1,250,000.5'`.
- **S16: ID tests unchanged.** `bind-format.test.ts` has no diff (`git diff --stat` is empty) and passes. In `bind-number-conventions.test.ts`, every ID output pin (`1.250.000,5`, `Rp 1.250.000,5`, `1.250.000,5 IDR`, fmtFixed, pattern sources) is unchanged and passes.
- **S17: ID bind tests byte-identical.** `bind-format.test.ts`, `bind-derivation.test.ts` and `bind-arith.test.ts` have no diff and pass. `bindNumberPatternSource('ID') === BIND_NUMBER_PATTERN_SOURCE` (test).
- **S17: the currency unit comes from the table.** `Register.rp` uses `conv.currencyUnit`. `grep '"Rp "' src/lib/studio/engine/bind/register.ts` returns no hits.
- **S17: audit accepts the EN variant only for EN documents.** Unit level: `bind-language.test.ts` (EN Register passes `IDR 1,250,000.5` and rejects `1.250.000,5`; ID Register does the reverse). Lint level: `lint-d01-register-language.test.ts`, 4/4. With the checks-d wiring reverted, 2 of those 4 fail, so the test really checks the wiring.
- **S18: all 7 sites wired.** `grep -rn "new Register(" src` now returns only `bind/register.ts:219` (the factory), `checks-d.ts:83` and `ingest/checks.ts:137,191`, and each of those passes `numberLanguageOf(...)`. The other four sites call `registerForSnapshot(snapshot)`.
- **S18: EN render shows "1,250,000.5" with IDR; ID shows "1.250.000,5" with Rp.** `s18-register-language.test.ts`, 3/3.
- **S18: no slug or type branching.** The only added line matching `slug|typeCode|templateSlug|datum-` in my diff is a comment ("bukan slug/jenis"). The language comes only from `doc.meta.language` (or `ctx.doc.meta.language` in lint).
- **The ID render is byte-identical.** `compare: 8/8 SAME`.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| 17 tsc errors in `benchmark/datum_conformance/rules/types.ts` and `tests/unit/studio/datum-conformance/rule-index.test.ts` | 0 (not mine) | Another agent's untracked work imports modules that do not exist yet (`benchmark/datum_conformance/catalog`, `lib/layout`, `rules`) | Reported to the controller | Not for S16-S18 |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| S16 | What happens to an EN register entry whose unit is "Rp"? Without a mapping it would print "1,250,000.5 Rp" and leak the AC-6 forbidden token `Rp` | Added `unitAliases` (EN `{Rp: "IDR"}`, ID `{}`), following register §5 ("Rp dipetakan ke IDR"). With the ID alias table empty, ID output is unchanged |
| S16 | Two S07 table-shape pins (`keys == ['ID']`, ID entry `toEqual` with 3 fields) cannot survive adding EN plus the two new fields | Updated only those two pins. No ID output pin changed. The S07 test itself said "EN ditambah baris S16" |
| S16 | Unknown language at runtime | `numberConvention` throws `BindDefect` instead of returning undefined. `numberLanguageOf` maps any non-"EN" value to ID (same as the renderers), so document data cannot reach the throw |
| S17 | `RegisterApi` (contract, not owned) has no language field | `language` lives on the `Register` class. Derivation and audit read it with `instanceof Register`; a plain `RegisterApi` gets `opts.language` / the `lang` argument, default ID. The contract is unchanged |
| S17 | Derivation defect messages (`"..." menghasilkan 2.500.001,00 ...`) | Kept in ID numbers: they are Indonesian operator text, not document content, the same as the D-11 lint-message decision in S07/S08. The controller may override this |
| S17 | Shape of the EN audit pattern | Mirrors Python `PAT` with the separators swapped: the lookbehind excludes both separators, the lookahead excludes the thousands separator. As a result, a number directly followed by a sentence comma is not audited in EN, just as one followed by a sentence-final period is not audited in ID. This matches the original semantics and is noted here as a known limit |
| S18 | Shared factory against inline construction | Four sites had the same expression, so they now call `registerForSnapshot(snapshot)` (research/33 D-07). The ingest (2) and lint (1) sites build their own normalised entry maps, so they call `new Register(map, numberLanguageOf(meta.language))` |
| S18 | `artifact.ts:410` hard-codes `language: "ID"` for wrapped CHART/DIAGRAM artifacts | Out of scope: that path builds no Register and has no register numbers (chart labels are D-596 Q-C) |
| S18 | Ingest language effect | The ingest Register language changes only how numbers print inside the D03 check (the arithmetic is language-neutral). It is wired anyway so that every site is consistent |

## Next Steps
- None for S16-S18. Downstream: S19 regression gate. Review recommended (scope: the 5 bind files, the 7 site files and the 5 test files above) under the S38 senior review, including a check that no slug/type branch was added.
