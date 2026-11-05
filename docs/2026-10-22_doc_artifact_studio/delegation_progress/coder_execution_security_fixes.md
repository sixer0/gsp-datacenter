---
task_slug: doc_artifact_studio
row: C35 follow-up (security fixes, USER decision "Fix all findings")
date: 2026-11-05
agent: coder-execution
source_review: docs/2026-10-22_doc_artifact_studio/verification/35_coverage_round_security_review.md
skills: tdd, dry-run-verify-fix
status: complete
---

# Coder execution: C35 security findings fixed (H-01, M-01, L-01, L-02, L-04; L-03 checked read-only)

Repo `C:\Users\TRIAL\gsp-swarm-hq-v2.1`, branch v2.1, uncommitted tree. No commits and no DB writes (the seed ran only with
`--dry-run`, and the transaction was rolled back with 0 writes). Every fix was done test-first: each new test was run and seen
failing (red) before the code change, then passing (green).

## 1. Finding -> fix -> evidence

| ID | Fix | Files | Evidence |
|---|---|---|---|
| H-01 ReDoS | (1) `matchMarker` runs `MARKER_RE` only on the first 256 chars (`MARKER_SCAN_MAX`). A match that reaches the cut point exactly is rejected, so the `$` lookahead cannot match falsely at the slice end. `rest` is still taken from the full text. (2) The code-to-level separator is rewritten as `SEP = MD(?:\s+(?:P\s*)?MD \| P\s*MD)?`. No two adjacent quantifiers can match the same characters any more. | `src/lib/studio/engine/front/rule-index.ts:65-80, 96-103` | Before/after timings in §2. New `tests/unit/studio/security/c35-rule-index-redos.test.ts` (6 tests). The 4 timing tests were red before the fix: 5990 ms, 6673 ms, 1295 ms and 4970 ms against limits of 50/50/50/100 ms. A differential test runs 6,900 short marker variants (prefix x separator x level x suffix) through the pre-C35 regex, copied verbatim as an oracle, and through `buildRuleIndex`: the code and level are identical in every case. The C17 builder tests and all datum-conformance rule-index tests pass (269/269 in that run). |
| M-01 CSS injection | `cssString`: after the existing `\`, `"`, `<` and `\r?\n` -> `\A ` steps, every remaining C0 control (U+0000-001F, which covers lone CR, FF, VT, TAB and NUL) and DEL becomes a CSS hex escape, for example `\d `, `\c `, `\7f `. Strings without control characters produce the same output as before. | `src/lib/studio/engine/html/base/fonts.ts:241-257` | New `tests/unit/studio/security/c35-css-string-controls.test.ts` (12 tests; 10 were red before the fix). Literal expectations show that ordinary strings are unchanged (`"a\"b\\c\3C d>"`, `\A` for LF and CRLF). Each of CR, FF, VT, NUL, BS, ESC, US, DEL and TAB is fed through `pageFurnitureCss`, which reaches both sinks: the running head (`markup.ts:87` -> `@top-right`) and the NOTA line (`shell.ts:280`, `"\A" "..."`). A small CSS tokenizer finds no bad-string, the payload never appears outside a string literal, and no raw control character is left. Offline Chromium (scratchpad `c35_css_after.ts`, real `cssString`): CR, FF, LF, VT and NUL all show "not injected". The review's own probe `c35_css_probe.mjs` (old copy) still shows CR and FF "INJECTED", so the harness does detect injection. Baseline 8/8 SAME confirms byte identity on real renders. |
| M-01 optional (intake rejection) | **Not done**, by choice. | none | The `DocMeta` schema (`src/lib/studio/contract/schema/doc.schema.ts:193-215`) is not one of my files. It is the shared `studio.doc/v1` contract, so a new `pattern` there would also apply when stored documents are re-validated (re-ingest or new revision). I cannot rule out, read-only, that a stored document holds a control character in `title`, `author` or `classification`. Such a document would start failing validation. The encoder fix already makes every such value inert in CSS. If it is still wanted, this needs a controller decision with a DB scan first. |
| L-01 R-79 | `cover.controlBlock.preparerUnit` gets `pattern: "^[^\u0000-\u001F\u007F]{0,120}$"`. Max 120, no C0 or DEL, and `""` stays valid. It uses the same `pattern` mechanism as the other string params; `validateParamValue` checks only `pattern` for strings, so the length limit lives in the pattern. | `src/lib/studio/params/render.ts:405-411` | New test in `tests/unit/studio/registry/c06-coverage-round-params.test.ts` (red before the fix). `""`, the C23 opt-in value, accented text and 120 chars pass; 121 chars and 7 control characters are rejected. **Registry pin unchanged**: `paramsSha256` hashes defaults only, and s11 still pins `dcb7166b...dfd9`. The DEV dry-run shows `registryParamsSha256` = `dcb7166b...dfd9`, so neither s11 nor the c06 count needed an edit. The stored preset values (`Divisi Engineering PT GSP`, `Engineering Division`) give `storedOk: true` with `storedIssues: []` on all 11 targets. **Templates unchanged by this fix:** I ran the DEV dry-run with and without the R-79 pattern (temporary swap of my own file, restored and checked byte-identical with `cmp`). The plan block and every `paramsSha256`/`skeletonSha256`/`registryParamsSha256` matched exactly (md5 `3f90d6ac...` and `3269e265...` both times). |
| L-02 bidi | `FORBIDDEN_NAME_CHARS`, used only by `datumClean`, now also strips U+200E, U+200F, U+202A-202E and U+2066-2069. They are written as `\u` escapes, with no literal invisible characters in the source. | `src/lib/studio/services/storage/paths.ts:31-35` | New `tests/unit/studio/security/c35-file-name-bidi.test.ts` (3 tests; 2 were red before the fix). Every bidi control is stripped, and an RLO title through `datumDateFileName` and `datumFileName` gives a clean name. Names without bidi characters are unchanged, including Arabic and Hebrew letters, accents and ZWJ U+200D. The existing C18 file-name tests stay green. |
| L-04 clash.py | `read_docx_parts`: one `present` set built from `infolist()`, so each name lookup is O(1) instead of a `z.namelist()` scan per name. `docx_classification_lines`: footer names are de-duplicated, and more than `MAX_FOOTER_PARTS = 256` raises `DocxLimitError`, consistent with the other `MAX_DOCX_*` refusals. The largest real Studio DOCX found has 29 footer parts (`C:/tmp/dc_s25/in/m000.docx`; the baseline cases have 7). | `benchmark/datum_conformance/clash/clash.py:95, 308-314, 421-423` | 2 new pytest cases at the end of `tests/test_clash.py`, both red before the fix. With 5,000 footers the call raises `DocxLimitError` "footer", and exactly 256 footers are still read. `read_docx_parts` with 19,000 requested parts must finish in under 2.0 s: before the fix it took 2.23 s at only 12,000 parts, after the fix the whole call takes 0.48-0.76 s. Isolated lookup timing at 19,000 names: old per-name `namelist()` 6.23 s, set 1.9 ms. Full clash suite: 46 passed. |
| L-03 archive ACL | Checked read-only. Nothing changed. | none | `icacls C:\Users\TRIAL\gsp-archive\hermes-profiles-2026-10-10` shows exactly `NT AUTHORITY\SYSTEM:(OI)(CI)(F)`, `BUILTIN\Administrators:(OI)(CI)(F)` and `DESKTOP-BR2DLT9\TRIAL:(OI)(CI)(F)`. The parent `gsp-archive` has the same 3 entries. A recursive `icacls /T /C` lists no other principal on any file or folder. All 45 archived `.env` files have exactly the same three entries: Administrators F, TRIAL F, SYSTEM F. **Result: owner, SYSTEM and Administrators only.** The report wording (personal profile names) was not edited, per the brief. |

## 2. H-01 timings (before -> after)

| Probe | Before (C35 review / red run) | After |
|---|---|---|
| Real `buildRuleIndex`, `c35_rule_index_e2e.ts`: runs=1, 20,000 chars | 229 ms (review) / 202 ms (rerun today) | 1 ms |
| runs=2, 40,000 chars | 891 / 788 ms | 0 ms |
| runs=4, 80,000 chars | 4,443 / 3,322 ms | 0 ms |
| 20 paragraphs x 20,000 chars | 6,875 / 4,208 ms | 0 ms |
| Unit test: 100 kB `DT-01` + `*`x100,000 + `X` | 5,990 ms | < 50 ms (passes) |
| Unit test: 100 kB from 6 runs | 6,673 ms | < 50 ms |
| Unit test: mixed `_`/backtick/space/after-level variants | 1,295 ms | < 50 ms each |
| Unit test: 20 hostile 20,000-char paragraphs | 4,970 ms | < 100 ms total |
| New regex alone, **without** the 256 cap (scratch `c35_newre.mjs`), 200,000 chars | 33,802 ms (old regex, review) | 0.4-1.3 ms (linear) |

The restructured regex is linear on its own (last row), so the 256-char cap is defence in depth, not the only protection.

## 3. Gates (fresh runs, 2026-11-05)

| Gate | Command | Result |
|---|---|---|
| Baseline | `npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root ... --out C:/tmp/bl_sec --inputs .../inputs --compare C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline` | `compare: 8/8 SAME`, with the 4 INFO compose-snapshot lines (a_terbit/b_nota x gsp/kanonik) |
| convert_v2 | `npx tsx benchmark/extract/convert_v2.ts --check` | SAME x3 (doc.v2.json, template.v2.json, datum-manual-000.preset.json) |
| Unit | `npx vitest run tests/unit/studio` | 284 files, 5,091 tests passed. A first run showed 3 failures in `s26-doc-type-template-specs.test.ts` while the parallel agent/controller was editing `prisma/seed-doc-type-templates.ts` (file mtime 13:24). Rerun alone it passed 16/16, and the full rerun was all green. None of my files is involved. |
| tsc | `npx tsc --noEmit -p tsconfig.json` | exit 0 |
| eslint | `npx eslint` on the 4 source files and 4 test files I touched | exit 0, no output |
| clash pytest | `<hermes venv python> -I -B -m pytest -p no:cacheprovider benchmark/datum_conformance/clash/tests` | 46 passed |
| Seed dry-run (DEV `gsp_agent_hq_v21`) | `npx tsx prisma/seed-studio.ts --doc-type-templates --dry-run` | exit 0; `guard.ok: true`; `changedTemplates: []`; `addedTemplates: []`; `sectionTypesTouched: []`; 7 other templates unchanged; "transaksi di-rollback (0 tulis)". The plan shows `new-version` for the 10 doc-type templates and the Rev A preset. That comes from the pending seed-spec edits (the controller's D-650 change and the parallel agent), not from this work: the plan is byte-identical with and without my R-79 change (§1 L-01). |

INFO: `ruff check benchmark/datum_conformance/clash/` reports 6 findings (UP037, RUF007, PLW1510 x2, UP017, RUF100). All are on lines that existed before (clash.py 160, 427, 791, 858; test 24, 54). None is on a line I added. Ruff is not a gate.

## 4. Changes made

| File | Change | Description |
|---|---|---|
| `src/lib/studio/engine/front/rule-index.ts` | modify | Unambiguous `SEP`, `MARKER_SCAN_MAX` = 256 cap, cut-edge guard |
| `src/lib/studio/engine/html/base/fonts.ts` | modify | `cssString` hex-escapes C0 and DEL |
| `src/lib/studio/params/render.ts` | modify (R-79 only) | `pattern` max 120, no controls |
| `src/lib/studio/services/storage/paths.ts` | modify | Bidi controls added to `FORBIDDEN_NAME_CHARS` |
| `benchmark/datum_conformance/clash/clash.py` | modify | `present` set; `MAX_FOOTER_PARTS` = 256 |
| `benchmark/datum_conformance/clash/tests/test_clash.py` | modify (append) | 2 L-04 cases |
| `tests/unit/studio/registry/c06-coverage-round-params.test.ts` | modify | L-01 case |
| `tests/unit/studio/security/c35-rule-index-redos.test.ts` | add | H-01 |
| `tests/unit/studio/security/c35-css-string-controls.test.ts` | add | M-01 |
| `tests/unit/studio/security/c35-file-name-bidi.test.ts` | add | L-02 |

Not touched: `tests/unit/studio/registry/s11-doc-typecode-nda.test.ts` (pin unchanged), the review report, the seed files, rhythm,
`html/blocks/text.ts`, `html/tables/*`, `engine/docx/tables/render.ts`. Note: `src/lib/studio/engine/html/tables/escape.ts:21` has its own
`cssString` (single quotes). It already strips C0, C1 and DEL and turns CR/LF into spaces, so it is not vulnerable, and it is in the
other agent's area.

## 5. Issues and decisions

| Item | Decision / resolution |
|---|---|
| H-01 pattern shape | The brief suggested merging the separators into one class, `[*_\`\s]*(?:P[*_\`\s]*)?`. That class accepts more strings than before (for example `DT-01 * WAJIB`), which could add entries. I used an equivalent rewrite that accepts exactly the same strings and still has no adjacent overlapping quantifiers. The 6,900-case differential test against the old regex proves the same entries are extracted. |
| H-01 256 cap edge | A match whose length equals the slice length on a longer text is rejected, so `$` cannot match falsely at the cut. Real markers are far shorter than 256 chars. |
| M-01 TAB | Encoded as `\9 `, as the brief asks for every other C0 control. A tab in a CSS string renders the same. The baseline stayed 8/8 SAME. |
| M-01 intake pattern | Skipped. Outside my file ownership, and a risk to stored documents on re-validation (see §1). Needs a controller decision and a DB scan if wanted. |
| L-04 over-cap behaviour | More than 256 footer parts is refused with `DocxLimitError`, not silently truncated, consistent with the other `MAX_DOCX_*` limits. 256 is about 9x the largest real Studio DOCX (29). |
| Parallel edits | A transient s26 failure during the other agent's seed edit cleared on rerun (see §3). |

## 6. Next steps

- Review recommended (scope: the five source files above plus the new tests). The controller can dispatch `senior-code-reviewer` and/or `security-review` for a C35 re-check.
- Optional: decide on the `DocMeta` intake control-character pattern (M-01 defence in depth) after a DB scan of stored `title`, `author` and `classification` values.
