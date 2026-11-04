---
task_id: datum_rev_a
task_slug: doc_artifact_studio
row: S07, S08
date: 2026-11-04
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/02_structured_datum_rev_a.md
status: complete
---

# Implementation Report: S07 number-convention table + S08 lint number dedupe

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Read S07/S08 rows, research/33 §5.4 (D-01..D-19), D-595 | complete | Dispositions: S07 = D-01, D-02, D-03; S08 = D-09, D-10, D-11; D-14 (`checks-d.ts`) is out of scope |
| 2 | Baseline before edits | complete | `npx tsc --noEmit -p .` printed 0 errors, exit 0; `npx vitest run tests/unit/studio/engine-core` gave 10 files / 309 tests passed |
| 3 | S07 TDD: new test file first (red), then refactored format.ts (green) | complete | Red: 13 failures (missing API); the pins on today's fmt/withUnit output already passed. Green: 71/71 together with the existing `bind-format.test.ts` |
| 4 | S08: characterization tests first, run against the unchanged lint code | complete | 34/34 green before the edit. 3 of my expectations were wrong about today's behaviour and were corrected to pin the real behaviour (see Decisions) |
| 5 | S08 refactor of the three lint files | complete | 34/34 still green afterwards |
| 6 | Differential fuzz: old regex literals and `toFixed`/replace (from `git show HEAD`) against the new code | complete | 200,000 random cases, 0 mismatches |
| 7 | Dry-run gate (tsc, eslint, suites, convert_v2, manifest, ID baseline) | complete | 1 cycle, 0 repairs |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| `src/lib/studio/engine/bind/format.ts` | modify | Adds `NumberLanguage` (`"ID"` only), `NumberConvention`, frozen `NUMBER_CONVENTIONS` holding only the ID entry (".", ",", `["Rp","USD","EUR","SGD"]`), `DEFAULT_NUMBER_LANGUAGE`, and `numberConvention(lang?)`. The old exports `DATUM_THOUSANDS_SEPARATOR`, `DATUM_DECIMAL_SEPARATOR` and `DATUM_LEADING_UNITS` are now aliases of the ID entry. `groupThousands` takes a convention. `fmt(v, dec = 0)` and `withUnit(s, unit?)` keep their signatures and delegate to private `formatWith(v, dec, conv)` / `withUnitFor(s, unit, conv)` with the ID entry; S16 can expose a language parameter on these. Also adds `fmtFixed(n, digits = 2, conv = ID)`, the `toFixed` semantics used in lint messages, and `numberPatternSources(conv = ID)`, which returns regex-escaped separators plus `grouped`/`plain` regex sources |
| `src/lib/studio/engine/lint/structure/text.ts` | modify | D-09: `parseDatumNumber`'s regexes and its normalisation (split on the thousands separator, replace the decimal separator) are built from `numberConvention("ID")`. The `findTerbilangPairs` regex is built from `numberPatternSources`. Signatures are unchanged; terbilang stays ID |
| `src/lib/studio/engine/lint/structure/checks-a.ts` | modify | D-10: `PURE_NUMBER` is built from the ID entry. Lines ~464 and ~485 (`toFixed(n).replace(".", ",")`) now call `fmtFixed` (see Decisions) |
| `src/lib/studio/engine/lint/language/checks.ts` | modify | D-11: the exported `fmt(n, digits = 2)` delegates to `fmtFixed(n, digits, numberConvention("ID"))`. `toFixed` semantics are kept |
| `tests/unit/studio/engine-core/bind-number-conventions.test.ts` | add | 32 tests: table shape (ID only), frozen table, aliases, ID output pins (1250000.5 -> "1.250.000,5"; Rp/USD/EUR/SGD placed before the number; IDR/%/m2 placed after), `fmtFixed`, `numberPatternSources` sources equal to the old lint literals |
| `tests/unit/studio/engine-core/lint-number-patterns.test.ts` | add | 34 characterization tests for `parseDatumNumber`, `findTerbilangPairs`, `isPureNumberCell`, and the language-lint `fmt` |

Not touched: `src/lib/studio/engine/bind/index.ts` (not owned; the old exports still resolve through the aliases, and the new table is imported from `bind/format` directly), `lint/structure/checks-d.ts`, and all 39 chart modules (`git diff --quiet -- src/lib/studio/engine/chart` -> untouched).

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Unit (format, existing + new) | `npx vitest run tests/unit/studio/engine-core/bind-number-conventions.test.ts tests/unit/studio/engine-core/bind-format.test.ts` | 2 files, 71 tests passed | The half-even parity cases in `bind-format.test.ts` were not edited and pass |
| Unit (engine-core: bind + lint) | `npx vitest run tests/unit/studio/engine-core` | 12 files, 369 tests passed | Baseline was 10 / 309; +2 new files / +60 tests |
| Unit (full studio) | `npx vitest run tests/unit/studio` | 229 files passed, 1 failed; 4289 tests passed | The failing file is `tests/unit/studio/seed/s09-seed-template-helpers.test.ts`. It cannot import `prisma/seed-studio-templates`, which is S09's in-progress work by another agent. Not mine |
| Typecheck | `npx tsc --noEmit -p .` | exit 2; all errors are in `tests/unit/studio/seed/s09-seed-template-helpers.test.ts` (TS2307 missing module, TS7006 x5) | 0 errors in my files. Baseline before my edits was 0 errors, so these come from the parallel S09 file |
| Lint | `npx eslint <4 source files> <2 test files>` | exit 0 | |
| Manual 000 | `npx tsx benchmark/extract/convert_v2.ts --check` | SAME x3 (doc.v2 `79290e07...`, template.v2 `882057c5...`, preset `a951b149...`) | |
| Clean-SVG manifest | `npx vitest run tests/unit/studio/figures/clean-svg-manifest.test.ts` | 1 file, 4 tests passed | |
| ID baseline (S05 AC-7) | `tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root <repo> --out <scratch> --inputs C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline/inputs --compare C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline --runs 2` | `compare: 8/8 SAME`, exit 0 | Run on the live tree, which also contains the other agents' in-progress edits (texts.ts, seed, governance-language). All 8 hashes match `verification/19_id_baseline_hashes.md` |
| Differential fuzz | scratch script comparing HEAD `text.ts` and the old literals with the new code | `cases=200000 mismatches=0` | Script kept in the session scratchpad only, not in the repo |

## Verification
- **S07: existing format tests green; half-even parity unchanged.** `bind-format.test.ts` was not modified and passes (part of the 71/71 run).
- **S07: fmt/withUnit signatures unchanged; 39 chart modules untouched.** `git diff --quiet -- src/lib/studio/engine/chart` -> untouched. tsc shows 0 errors outside the S09 test file.
- **S07: table has only the ID entry, equal to today's constants.** Test `Object.keys(NUMBER_CONVENTIONS) == ['ID']` and the `toEqual` on the entry pass.
- **S07: ID formatting pinned.** `fmt(1250000.5, 1) == "1.250.000,5"`, and `withUnit(..., 'Rp') == "Rp 1.250.000,5"` pass. The baseline render still contains `Rp 1.250.000,50` byte-identically (8/8 SAME).
- **S08: lint tests green.** engine-core 369/369, including `lint-structure-language`, `lint-fixl-precision` and `lint-scan`.
- **S08: 0 duplicated separator literals in lint.** Each of these greps over `src/lib/studio/engine/lint` returns 0 hits: `\.\d{3}`, `replace(".", ",")`, `,\d+`, `replace(/\./g`, `"Rp `.
- **S08: `checks-d.ts` untouched.** `git diff --stat -- src/lib/studio/engine/lint/structure/checks-d.ts` is empty.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| tsc errors and 1 failing suite file in `tests/unit/studio/seed/s09-seed-template-helpers.test.ts` | 0 (not mine to fix) | Parallel S09 work imports `prisma/seed-studio-templates`, which does not exist yet | Reported to the controller | Not for S07/S08 |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| S08 | `checks-a.ts:464` and `:485` also hard-code `toFixed(n).replace(".", ",")`. research/33 did not list them, but the row's acceptance check ("0 literal pemisah angka ganda di lint", grep) would fail without them | Included. Both now call `fmtFixed`, with identical output (`toFixed` semantics). They are in a file I own. The controller may want to add them to research/33 as D-10b |
| S07 | Where should the shared `toFixed` formatter and the regex builder live? lint/structure and lint/language do not import each other; both may import `bind` | Put in `bind/format.ts`, the single owner of the separators: `fmtFixed` and `numberPatternSources`. Both take an optional convention, defaulting to ID. No EN behaviour exists |
| S07 | The type of `DATUM_THOUSANDS_SEPARATOR` / `DATUM_DECIMAL_SEPARATOR` widened from the literal `"."` / `","` to `string`, and `DATUM_LEADING_UNITS` is now a frozen array | No consumer depends on the literal type (grep: only the `index.ts` re-export and a test that uses `DATUM_MAX_DECIMALS`). tsc shows 0 errors in my files |
| S08 | My first characterization expectations were wrong for 3 cases: `isPureNumberCell('1,250,000.25')` and `('12.5')` return true because the `\S{0,8}` tail absorbs the rest, and `"2,5 persen (dua koma lima)"` is a valid pair | Tests now pin the real behaviour, with a comment. This confirms the D-10 note: lint has no EN number awareness yet (deferred behaviour change) |
| S07/S16 | `bind/index.ts` does not re-export the new table API | Left alone because I do not own the file. Consumers import from `bind/format`. S16 or the controller can add the re-export |

## Next Steps
- S16: add the `EN` key to `NumberLanguage` and `NUMBER_CONVENTIONS` (",", ".", IDR in place of Rp), and expose a language parameter on `fmt`/`withUnit`, for example via the existing private `formatWith`/`withUnitFor`.
- Optional: the controller adds checks-a.ts:464/485 to research/33 as part of D-10. Review recommended (scope: the 4 source files and 2 tests above) under the S38 senior review.
