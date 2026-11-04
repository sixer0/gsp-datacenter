---
task_slug: doc_artifact_studio
row: S38 follow-up (D-610, review fixes)
date: 2026-11-04
agent: coder-execution
skills_loaded: receiving-code-review, tdd, dry-run-verify-fix
source_review: docs/2026-10-22_doc_artifact_studio/verification/24_datum_rev_a_code_review.md
decision: D-610
status: complete
---

# Review fixes: DATUM Rev A senior code review (D-610)

Repo `C:\Users\TRIAL\gsp-swarm-hq-v2.1`, branch `v2.1`, all uncommitted. No commits, no DB writes (seed `--dry-run` only), no ports opened. The baseline folder `C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline` was not changed.

## 1. Findings: fixed or kept

| # | Result | What changed | Evidence |
|---|---|---|---|
| M1 | **Fixed (pinned tests; behaviour accepted)** | New `tests/unit/studio/renderers/m1-classification-default-pins.test.ts` (9 tests). (1) An ID document with no `classification` takes the registry default `Terbatas`. The stored meta stays `Terbatas`. DOCX prints `TERBATAS` in the running heads (header parts) and the register block (footer parts), and `KLASIFIKASI · TERBATAS` in the seal band. HTML prints `TERBATAS` in `span.cls` (running head), the `.reg` block, `span.st-seal-left` (seal band) and the `@top-right`/`@bottom-right` page margin boxes. No visible `Terbatas` remains. Metadata (DOCX `core.xml`, HTML `<meta studio:classification>`) keeps `Terbatas`. (2) An MCP cover block (`buildClient`, pair `Klasifikasi` = `Terbatas`): the client payload keeps the mixed-case value, the composed snapshot cell is `TERBATAS`, and DOCX/HTML print `Klasifikasi` followed by `TERBATAS` | 9/9 pass. Mutation check: with `classificationMarkText` reverted to identity, 5 of 9 fail (the other 4 pin stored values and metadata, which that mutation does not touch). Source restored byte-identical from backup |
| M1 note | **Deviation from the brief, reported** | The brief says the issue stamp prints "TERBATAS". It does not, by design: the stamp format `{KELAS}` takes the capitalised **initial** (`texts.ts` `issueStampTextOf`: `classificationMarkText(meta.classification.trim().charAt(0))`), so the output is `// 20261023 ID T -- TERBITAN 1`. This predates Rev A (the review §3.5 says the stamp "keeps its earlier `charAt(0).toUpperCase()` semantics"). The test pins the real output, `T`, in DOCX and HTML. No code change | Probe of the rendered DOCX `word/document.xml` and the HTML `data-role="cover.colophonRight"` |
| M2 | **Fixed (red first)** | `scripts/studio/mcp/write-client-run.ts`: on an existing document the D-1 front-slot selector uses the server tier (`content.meta.tier`, falling back to the template `doc.defaultTier`). A `meta.tier` that differs from it produces `META_IGNORED` ("meta.tier X hanya diterapkan saat dokumen dibuat; tier dokumen yang ada (Y) tidak diubah dan menentukan slot depan"). `tier` is never in the `setMeta` diff on rewrite. New documents still honour `meta.tier`. `write-meta.ts`: the `studio_edit` warning text now says the same rule ("hanya diterapkan saat dokumen dibuat (studio_write dokumen baru)"); the code is unchanged | Red: `implw2-client.test.ts` "M2 (D-610 ...)" failed (`expected true to be false`: setMeta carried `tier`). Green after the fix. Added a second case: a matching tier gives no warning and no tier in setMeta. Existing s12 (c) (new document + meta.tier NOTA, `META_IGNORED` absent) still passes. MCP folder: 32 files / 413 tests pass |
| M3 | **Fixed (red first)** | `benchmark/datum_conformance/clash/clash.py`: new `read_docx_parts()` + `DocxLimitError(ValueError)`. Mirrors the TS limits: `MAX_DOCX_ENTRIES` 20000; `MAX_DOCX_PART_BYTES` 64 MiB; `MAX_DOCX_TOTAL_BYTES` 256 MiB (declared sizes of `.xml`/`.rels`/`word/media/*.svg`, as in `lib/docx.ts` `shouldExtract`). Parts are read through a bounded chunked stream capped at the limit. A part whose real size exceeds its header (the stream is cut at the declared size and CRC fails) is refused as `DocxLimitError`. A `<!DOCTYPE`/`<!ENTITY` declaration in any read part is refused (UTF-16 parts are decoded first). `docx_geometry` and `docx_spines` use the reader. `run()` checks `--docx` against the limits **before** LibreOffice conversion. README gained an "Untrusted DOCX" paragraph | Red: 7 new tests failed before the change. Green: `33 passed`. New tests: oversized compressible part (1.2 MB, compresses to a few KB, limit patched to 64 KiB), size-lying header (declared 100 B), entry and total caps, DOCTYPE with internal ENTITY, DOCTYPE SYSTEM, ENTITY in `settings.xml`, CLI hostile DOCX gives exit 2 with `clash_error.json` and neither PDF nor `--out` is written |
| L3 | **Fixed** | `bind/format.ts` `escapeRegExp` exported; `bind/audit.ts` `escBody` removed and uses `escapeRegExp` | engine-core: 16 files / 434 tests pass; baseline 8/8 SAME |
| L4 | **Fixed** | `front/texts.ts`: new `apparatusLabelWords(keys, lang = "ID")` (uppercase words from `APPARATUS_TEXT`), also used by `RUN_LABEL_RE`. `docx/tables/render.ts` `SOURCE_LABEL_RE` = `new RegExp(... apparatusLabelWords(["source", "provenance"]) ...)` | Scratch check: the derived regex source equals `/^\s*(SUMBER\|PROVENANS)\s*$/.source` (`true`); baseline 8/8 SAME |
| L6 | **Fixed (test)** | New `tests/unit/studio/datum-conformance/pair-register-vs-seed.test.ts`: `PAIR_REGISTER` (minus calibration row `datum-gsp`) has the same 10 slugs as `DOC_TYPE_TEMPLATE_SPECS`. Per slug, the language, type code, tier and cover kicker match the spec layer / slot override | 2/2 pass. Mutation: `datum-standar-en` tier changed to SERAH gives 1 failure; restored (`cmp` identical) |
| L7 | **Fixed** | `prisma/seed-studio-templates.ts` `ensureDerivedTemplate` docblock: "CH-06 dicek untuk setiap spec" (was "CH-06 bila `contractKind` terisi") | Comment only |
| L8 | **Fixed** | `DATUM_SKELETON_SLOTS` labels for `controlSheet` and `toc` = `WRAPPER_TEXT.controlKicker.ID` / `WRAPPER_TEXT.tocKicker.ID` (import from `engine/front/texts`). New guard test `tests/unit/studio/seed/l8-skeleton-labels-text-table.test.ts` (2 tests): literal values unchanged, label = text-table ID entry, EN translation via `controlSheetLabelText` = `Control Sheet` | Fingerprint before and after (labels, JSON sha256 of `DATUM_SKELETON_SLOTS` `9e6ff964...`, slots and `skeletonSha256` of all 10 specs): `diff` empty, "L8 fingerprint IDENTICAL". Seed dry-run: all 10 `unchanged` (§2) |
| L9 | **Fixed** | `bind/audit.ts` `auditText(text, reg, allow?, opts?)`: `lang` moved into `AuditTextOptions.lang`, so the call reads `auditText(t.text, reg, allow, { context })` (`lint/structure/checks-d.ts:144`). Behaviour unchanged: `auditLanguage(reg, opts.lang)`. The test call sites with positional `lang`/`undefined` are updated (`bind-language.test.ts:154`, `lint-d01-structural-numbering.test.ts:133,147,151,155`) | `grep auditText(` shows no `undefined` placeholder left; engine-core 434/434 pass; tsc 0 |
| L1, L2, L5, L10-L14 | **Kept** (as instructed) | No change | n/a |

## 2. Verification (fresh, 2026-11-04, after the last edit)

| Check | Command | Result |
|---|---|---|
| Unit suite | `npx vitest run tests/unit/studio` | `Test Files 256 passed (256)`, `Tests 4697 passed (4697)` (= 4682 before + 15 new), 271.37 s, `EXIT=0` |
| Clash pytest | `C:/Users/TRIAL/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe -I -B -m pytest -p no:cacheprovider benchmark/datum_conformance/clash/tests` | `33 passed in 7.97s` (25 before + 8 new: 7 test functions, one parametrised twice) |
| Typecheck | `npx tsc --noEmit -p .` | no output, `TSC_EXIT=0` |
| Lint (changed TS files) | `npx eslint` on the 14 changed or new `.ts` files (§3) | no output, `ESLINT_EXIT=0` |
| Baseline | `npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root C:/Users/TRIAL/gsp-swarm-hq-v2.1 --out C:/tmp/bl_cr --inputs C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline/inputs --compare C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline` (output folder cleared first) | `compare: 8/8 SAME`, `BASELINE_EXIT=0` (for example `a_terbit_datum_gsp DOCX 633e583f...e9e6af`, `b_nota_datum_kanonik HTML 030e1cda...21b288`) |
| convert_v2 | `npx tsx benchmark/extract/convert_v2.ts --check` | `SAME doc.v2.json 79290e07...`, `SAME template.v2.json 882057c5...`, `SAME datum-manual-000.preset.json a951b149...`, `CONVERT_EXIT=0` |
| Seed doc-type | `npx tsx prisma/seed-studio.ts --doc-type-templates --dry-run` | `SEED_DOC_EXIT=0`, DB `gsp_agent_hq_v21`. All 10 templates `"outcome":"unchanged"`, `"storedOk":true`, `versionNo` 2. `guard.ok: true` (`changedTemplates: []`, `addedTemplates: []`, `sectionTypesTouched: []`). "Dry-run templat jenis dokumen selesai; transaksi di-rollback (0 tulis)" |
| Seed contract | `npx tsx prisma/seed-studio.ts --contract-templates --dry-run` | `SEED_CT_EXIT=0`, `laporan-kerja-agen` `"outcome":"unchanged"`, `"storedOk":true`, `guard.ok: true` (`changedTemplates: []`). "Dry-run templat jenis kontrak selesai; transaksi di-rollback (0 tulis)" |

Both seed runs also log a `warn` "Profil kanonik berkerangka berbeda dari registri saat ini; sinkron otomatis dihentikan ...". That warning comes from HEAD code (`prisma/seed-studio.ts` `describeCanonical`, SR36 design, `implementation/sr36_seed_presets_skeletons.md:59`) and concerns the canonical preset against the param registry. This round changed no params or registry file, so the warning is unrelated to these fixes.

## 3. Files changed

| File | Change | Finding |
|---|---|---|
| `scripts/studio/mcp/write-client-run.ts` | modify | M2 |
| `scripts/studio/mcp/write-meta.ts` | modify (warning text) | M2 |
| `tests/unit/studio/mcp/implw2-client.test.ts` | modify (+2 tests) | M2 |
| `benchmark/datum_conformance/clash/clash.py` | modify | M3 |
| `benchmark/datum_conformance/clash/tests/test_clash.py` | modify (+8 cases) | M3 |
| `benchmark/datum_conformance/clash/README.md` | modify (+1 paragraph) | M3 |
| `tests/unit/studio/renderers/m1-classification-default-pins.test.ts` | add | M1 |
| `src/lib/studio/engine/bind/format.ts` | modify (export `escapeRegExp`) | L3 |
| `src/lib/studio/engine/bind/audit.ts` | modify | L3, L9 |
| `src/lib/studio/engine/lint/structure/checks-d.ts` | modify (call site) | L9 |
| `tests/unit/studio/engine-core/bind-language.test.ts` | modify (call site) | L9 |
| `tests/unit/studio/engine-core/lint-d01-structural-numbering.test.ts` | modify (call sites) | L9 |
| `src/lib/studio/engine/front/texts.ts` | modify (`apparatusLabelWords`) | L4 |
| `src/lib/studio/engine/docx/tables/render.ts` | modify (`SOURCE_LABEL_RE`) | L4 |
| `tests/unit/studio/datum-conformance/pair-register-vs-seed.test.ts` | add | L6 |
| `prisma/seed-studio-templates.ts` | modify (comment; labels from `WRAPPER_TEXT`) | L7, L8 |
| `tests/unit/studio/seed/l8-skeleton-labels-text-table.test.ts` | add | L8 |

## 4. Persistent issues

| Issue | Attempts | Root cause | Current status | Blocking? |
|---|---|---|---|---|
| ruff (hermes venv defaults) reports 5 findings in `clash.py`/`test_clash.py` (UP037 :151, PLW1510 :692, UP017 :759, RUF100 test:24, PLW1510 test:54) | 0 (not in scope) | All on lines that predate this round; none on the new code. ruff is not a configured project gate | Left as is | No |

## 5. Issues and decisions

| Step | Issue / decision | Resolution |
|---|---|---|
| M1 | The brief lists "issue stamp" among the places that print "TERBATAS"; the engine prints the capitalised initial `T` there (format `{KELAS}`, unchanged since before Rev A) | Pinned the real behaviour (`// 20261023 ID T -- TERBITAN 1`) and changed no code. **The controller should confirm** that `T` is the intended stamp output |
| M1 | Pins live in a unit test (text at each print site), not in the S05 baseline folder (the brief says not to change it) | Text pins at public seams. They do not depend on byte hashes, so unrelated engine changes do not churn them |
| M2 | Server tier unknown (no `meta.tier` in R20 and no template reference) | `meta.tier` is still ignored with `META_IGNORED` (the message omits the tier value). This is the conservative choice, consistent with `studio_edit` |
| M3 | Python's `ZipExtFile` stops at the declared size and then raises `BadZipFile` (CRC) for a size-lying part | Converted to `DocxLimitError` naming the part, so a size lie is a refusal (exit 2 + durable `clash_error.json`), not an uncaught error class |
| M3 | Added a pre-conversion check in `run()` (not in the review text) | A hostile DOCX is refused before LibreOffice reads it. The cost is one bounded read of `document.xml`/`settings.xml` |
| L6 | Kicker added to the comparison (the brief named slug, type code, tier, language) | Both tables carry it, and it is a cheap extra guard |
| L9 | Chose a named options object (`opts.lang`) over moving opts to the 3rd parameter | `allow` stays 3rd; there is one production caller and 5 test call sites, all updated |

## 6. Next steps

- Controller: record the M1 issue-stamp clarification (initial `T`, not `TERBATAS`) in the decision log if accepted.
- Review recommended (scope: M2 rule in `write-client-run.ts`, M3 reader in `clash.py`). S39 owns the final scorer-robustness verdict.
