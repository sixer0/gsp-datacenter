---
task_slug: doc_artifact_studio
row: S38 (DATUM Rev A blueprint, senior code review)
date: 2026-11-04
agent: senior-code-reviewer
skills_loaded: code-review-senior
source_plan: docs/2026-10-22_doc_artifact_studio/identification/02_structured_datum_rev_a.md (row S38, line 154; RQ-8 line 57; AC-7 line 68; AC-10 line 71)
status: complete
---

# S38: Senior code review, DATUM Rev A (refactor, phase 0, seed, parity test, scorer)

- Reviewer: senior-code-reviewer. Read-only: no production code, test, or config was changed. Nothing was committed.
- Repo / branch: `C:\Users\TRIAL\gsp-swarm-hq-v2.1`, `v2.1`, HEAD `3566486`. All changes are uncommitted: `git diff HEAD` (52 tracked files, +2254/-573) plus untracked files.
- Scope: `src/lib/studio/**`, `src/app/api/studio/validate/**`, `scripts/studio/mcp/**`, `prisma/seed*.ts`, `benchmark/datum_conformance/**`, the new and changed tests, `docs/STUDIO-*.md`, `docs/hermes-skills/gsp-studio-write/SKILL.md`.
- Context read: blueprint §0-§4 and the task table; decisions D-590..D-608 (`decisions/decisions.md:596-614`); implementer reports s06, s07_s08, s09_s11, s12, s13_s15, s16_s18, s20, s24, s26_s29, d01_en_fix, gfix1, s30_s32 (newest section of each); `verification/20_phase0_regression.md`; `verification/21_datum_conformance_calibration.md` (headline numbers via D-604).

## 1. Verdict

**Overall: APPROVED WITH COMMENTS.** 17 findings: 0 High, 3 Medium, 14 Low.

**U4 production blocker check (AC-10, D-595): PASS, 0 blockers.** I found no new branch on template slug or document type, no per-template function, and no copy-pasted seed block in production code.

| Domain | Verdict | High | Medium | Low |
|---|---|---|---|---|
| Structure | PASS | 0 | 0 | 4 |
| Dependency Impact | CAUTION | 0 | 2 | 0 |
| Duplication | PASS | 0 | 0 | 4 |
| Maintainability | CAUTION | 0 | 1 | 4 |
| Reference Integrity | PASS | 0 | 0 | 2 |

Byte-identical ID output: **verified for the S05 corpus** (8/8 SAME, convert_v2 SAME x3, re-run fresh below). **The claim is broader than its evidence.** The corpus never exercises the default (mixed-case) classification path, and that path now renders differently. This is by design (D-607), but RQ-4 and AC-7 need to say so (finding M1).

## 2. Fresh verification commands (run by this reviewer, 2026-11-04 20:43-21:00 +0700)

| # | Command | Result |
|---|---|---|
| V1 | `npx vitest run tests/unit/studio` | `Test Files 253 passed (253)`, `Tests 4682 passed (4682)`, duration 266.38 s, `EXIT=0` |
| V2 | `npx tsc --noEmit -p .` | no output, `EXIT=0` |
| V3 | `npx eslint <91 files>` (= `git diff --name-only HEAD` + untracked, `.ts/.tsx/.mjs` under src, scripts, prisma, benchmark, tests) | no output, `EXIT=0` |
| V4 | `npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root C:/Users/TRIAL/gsp-swarm-hq-v2.1 --out C:/tmp/bl_s38 --inputs C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline/inputs --compare C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline` (output folder cleared first) | `compare: 8/8 SAME`, `EXIT=0`. Hashes, for example: `a_terbit_datum_gsp DOCX 633e583f59de...e9e6af`, `b_nota_datum_kanonik HTML 030e1cda33e3...21b288`. All 8 equal `verification/19` and `verification/20` §2.6 |
| V5 | `npx tsx benchmark/extract/convert_v2.ts --check` | `SAME doc.v2.json 79290e07...`, `SAME template.v2.json 882057c5...`, `SAME datum-manual-000.preset.json a951b149...`, `EXIT=0` |
| V6 | Runtime import closure from `engine/front/texts.ts` (scratch script; it follows non-type `import`/`export ... from`) | `no runtime path` back to `engine/bind/derivation.ts` or `engine/bind/index.ts`; closure 71 modules. So the new edge `bind/derivation.ts -> front/texts` creates no cycle |
| V7 | Slug/type branch grep over all added lines (tracked diff `-U0` + untracked .ts/.mjs under src, scripts, prisma, benchmark): `slug ===`, `typeCode ===`, `.startsWith("datum`, `case "datum`, `has(template`, `defaultTypeCode ===` | Production hits: only `write-client-run.ts:259` (`CONTRACT_TEMPLATE_SLUGS.has(template)`, judged in §3.2). The remaining hits are in the benchmark scorer and compare pair context or spec rows, not slugs in the engine |
| V8 | `grep classification` in `C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline/inputs/*.json` | All 4 doc inputs: `"classification": "TERBATAS"` (uppercase). 0 inputs contain a `Klasifikasi` cover-control pair. All 4 are `"language": "ID"` |
| V9 | Callers of changed exported signatures (`grep -rn` over src, scripts, prisma, benchmark) | See §3.6. 0 `.map(fmt)` or `.map(withUnit)` call sites, which would have broken when the new third parameter was added |

## 3. Mandatory checks

### 3.1 U4: no new slug/type branching, no per-template duplication (production blocker check)

**PASS, 0 blockers.**

- `DEFAULT_CLIENT_TEMPLATE_SLUG = "datum-gsp"` (`scripts/studio/mcp/write-client-run.ts:30`) is the single D-590 constant. `resolveTemplate` (`:34`) compares the input token `latest`, not a template slug. The removed HEAD heuristic (`startsWith("datum-")` plus `updatedAt`) is a net improvement.
- Seed: one spec table (`prisma/seed-doc-type-templates.ts:80-86` `DOC_TYPE_LAYERS` x `:98-123` `LANGUAGE_LAYERS`, composed by `composeSpec` `:136-151`, flattened at `:154`). One runner (`prisma/seed-studio-templates.ts:387-444` `runGuardedTemplateTx`) is shared by `--contract-templates` (`prisma/seed-studio.ts` `runContractTemplates`, via the data adapter `contractDerivedSpec`) and `--doc-type-templates` (`runDocTypeTemplates`, 1 call). The only per-type difference (STD `ruleIndex`) is data: `extraSlots` (`seed-doc-type-templates.ts:63-66, 84`). The 7-slot skeleton now has one source, `DATUM_SKELETON_SLOTS` (`seed-studio-templates.ts:52-60`), used by `seed-studio.ts` (`SKELETON_SLOTS = DATUM_SKELETON_SLOTS`) and the spec table.
- Engine/compose/MCP: every language difference reads `WRAPPER_TEXT`, `CONTROL_SHEET_COLUMNS`, `CONTROL_FIELD_LABELS`, `FRONT_PAYLOAD_LABELS`, `APPARATUS_TEXT`, `REGISTER_WORDS`, `SEAL_BAND_TEXT`, `ISSUE_STAMP_FORMAT_TEXT`, `LANGUAGE_VALUE_TEXT` (all in `engine/front/texts.ts`) or `NUMBER_CONVENTIONS` (`engine/bind/format.ts:319-334`). The `lang === "ID"` shortcuts (`texts.ts:399, 409, 424`, `docx/tables/render.ts`, `html/tables/apparatus.ts`) preserve ID bytes; they do not select per-template behaviour.
- Language resolution is spread over three equivalent helpers plus inline copies (L2). That is a duplication nit, not a U4 violation: each one resolves the language and then indexes a shared table.

### 3.2 `CONTRACT_TEMPLATE_SLUGS.has(template)` (`write-client-run.ts:38, 259`), flagged by S19

**Judgement: allowed, not a U4 violation (L1, Low).** The set is derived from registry data (`CONTRACT_KIND_DEFS.map((d) => d.templateSlug)`; `src/lib/studio/registry/contracts.ts:390` is the single entry today). It replaces the hard-coded HEAD literal `template === "laporan-kerja-agen"`. It is generic over contract kinds, and a new C58 contract template is covered without code changes. It also keeps the 0-network rejection, before R02.

Residual: membership only covers registry contract templates. A template whose stored `contractKind` is non-null but which is missing from `CONTRACT_KIND_DEFS` would pass this guard. The server still governs that case. Optional hardening: also reject when the R02 shape (already fetched in `templateShape`, `write-client-run.ts:52-68`) reports a non-null `contractKind`. Not required for this release.

### 3.3 Byte-identical ID output

**Verified for the corpus (V4, V5). The claim scope is narrower than stated (M1).**

- Corpus scope (V8): 4 ID inputs, all with explicit uppercase `TERBATAS`, none with a cover-control `Klasifikasi` pair.
- Code paths outside that scope now change ID output:
  - The registry default `classification.level` is mixed case `"Terbatas"` (`src/lib/studio/params/apparatus.ts:265`). `compose/merge.ts:86` uses it whenever the agent omits `classification`. The how-to sample omitted `classification` until D-607.
  - Such documents now print `TERBATAS` instead of `Terbatas` in: the DOCX running head (`docx/package/header-footer.ts:133`), the DOCX register cell (`:284`), the HTML running head (`html/base/markup.ts:87`), the HTML ID seal band (`html/blocks/device.ts:155`), and the DOCX seal band (`front/texts.ts:325`).
  - `compose/front.ts:52-57` (`markClassificationPairs`) rewrites the stored snapshot's cover control value next to `Klasifikasi`/`Classification`. On recompose, the snapshot hash of an existing MCP-written ID document therefore changes as well.
- D-607 explicitly decided this ("diperbaiki generik di mesin ... masukan kapital byte-identik"), so it is not a defect. But RQ-4 ("dokumen yang ada tidak berubah; keluaran ID byte-identik") and AC-7, as worded, are no longer true without qualification.
- EN output of existing `datum-gsp` EN documents also changes. Examples: `Appendix` becomes `Annex` (`texts.ts:83`), `English` becomes `English (UK)` (`:235`), and `Author` becomes `Prepared by` (`:206`). RQ-4 covers only ID, so this is in scope (D-606, D-601).

### 3.4 Single sources

| Source | Status | Evidence |
|---|---|---|
| One text table | PASS | `engine/front/texts.ts` holds every wrapper/apparatus/MCP label table. HTML `labels()` (`html/tables/style.ts`) and DOCX `figureLabels()` (`docx/figures/defaults.ts`) both derive from `APPARATUS_TEXT`. The MCP client labels (`write-client.ts` `CLIENT_LABELS`) are composed from `CONTROL_FIELD_LABELS`, `WRAPPER_TEXT.controlKicker` and `FRONT_PAYLOAD_LABELS`, with a fail-loud key check (`controlFieldLabel`). `REGISTER_WORDS_EN` is removed from both `header-footer.ts` and `markup.ts`. `LEGACY_EN_LABELS` (`write-client.ts`) is an intentional read-only alias set (D-6), not a copy. Residual literals: L4, L8 |
| One number table | PASS | `NUMBER_CONVENTIONS` (`bind/format.ts:319-334`). Lint builds its patterns from it (`lint/structure/text.ts:6-12`, `checks-a.ts:19, 241-249`, `lint/language/checks.ts:15, 51`). `Register.rp` takes `currencyUnit` from the table (`register.ts:554` region; no `"Rp "` literal left). Residual: duplicate regex escaper (L3) |
| One seed spec table | PASS | `DOC_TYPE_TEMPLATE_SPECS` (`seed-doc-type-templates.ts:154`). The scorer keeps its own copy as an oracle (L6) |
| Shared seed helpers | PASS | `presetSlotEssentials`, `derivedTemplatePlan`, `ensureDerivedTemplate`, `ensureSkeletonVersion`, `runGuardedTemplateTx`, `snapshotTemplates`, `assertTxDatabase` (`seed-studio-templates.ts`). The HEAD `ensureContractTemplate` and `runContractTemplates` bodies (about 140 lines) are gone from `seed-studio.ts` |

### 3.5 Correctness and maintainability

| Item | Verdict | Notes |
|---|---|---|
| Language resolution: template -> document -> client | PASS | New document: `meta.language` (agent) wins, else R02 `doc.language` (`write-client-run.ts:52-68, 301`), else ID. Existing document: server `content.meta.language` (`:352-353`), else the R02 language of the document's template version (`:356`). Labels are rebuilt through `relabel` (`:285-289`), before D-1 selection and preflight. No `language` field is added to DocMetaV2 (U3). The server keeps `sent.language ?? template doc.language` (`compose/merge.ts`). Compose wires `src.meta.language` into `controlSheetFront` (`compose/snapshot.ts:427`) |
| D-1 front-slot omission | PASS, with M2 | `frontSlotsForTier` (`write-client-run.ts:73-84`) follows server `isSlotActive` semantics (empty `tiers` = all tiers). An unknown skeleton means everything is sent, as before. `FRONT_SLOTS_OMITTED` warning. Gap: a tier change on an existing document through `studio_write` (M2) |
| `meta.tier` passthrough | PASS | Alias `tier` (`write-client.ts` `META_ALIASES`). Uppercased and checked against `STUDIO_TIERS`; otherwise `TIER_IGNORED` and dropped (`normalizeMeta`). Forwarded by `docMetaOf`. `studio_edit` refuses it with `META_IGNORED` (`write-meta.ts:87-90`, D-600 (2)) |
| D01 skip heuristics (`bind/audit.ts`) | PASS (heuristic) | Opt-in through `opts.context` (`audit.ts:143-160`), so the default stays the Python port. The ID-invariance argument holds: structural tokens allow only 1-2 digit groups and end at a non-digit (`audit.ts:135`), while ID audit candidates with "." have 3-digit groups. The corpus test pins it. Residual false negatives are documented in `coder_execution_d01_en_fix.md` ("Figure 3.1 and 2.75", line-start "1.5 Million") (L12) |
| Classification-capitals helper | PASS, with M1 | One helper, `classificationMarkText` (`texts.ts:62-64`), used at every print site. The issue stamp keeps its earlier `charAt(0).toUpperCase()` semantics (`texts.ts:312`). Metadata (`docProps/core.xml`, HTML `<meta>`) keeps the stored value (gfix1 finding 5). The compose pair matcher is case-sensitive on the label (`compose/front.ts:46, 57`): an agent-sent `KLASIFIKASI` label is not matched (part of M1's recommendation) |
| Seed guard | PASS | `freezeSectionTypes` (`seed-studio-templates.ts:416`) fails closed: `seedSectionTypes` still runs inside the transaction, and any create, update or touch fails the guard and rolls back. CH-06 now runs for every spec (`:264-265`); the docblock at `:256` is stale (L7). AC-2 is checked in `derivedTemplateStoredIssues` (`:224-244`): contractKind null-safe, `archived`, `restricted` via `templateRestriction`, `baseVersionId` = latest preset version, skeleton sha, slot order, and layer. `ALLOWED_DATABASES` is unchanged (`seed-studio.ts`; the helper never checks DB permission itself and only asserts transaction DB = checked DB, `:342-345`) |
| Scorer robustness (untrusted DOCX) | PASS (TS) / CAUTION (Python, M3) | TS reader: fflate `unzipSync` filter caps entries (20,000), declared part size (64 MiB) and declared total (256 MiB) (`lib/docx.ts:118-120, 179-188`), and it extracts only `.xml`, `.rels` and `media/*.svg` (`:126-129`). A size lie in the ZIP directory is bounded too: fflate inflates into `new u8(su)` with `st.i = 2`, so `resize = false` and the output is truncated at the declared size (`node_modules/fflate/lib/index.cjs:227-229`, v0.8.3). Memory therefore stays within the declared caps. XML parser: iterative, rejects `<!DOCTYPE`, expands only the 5 built-in and numeric entities (`lib/xml.ts:32-43, 83-85`). Python `clash.py`: see M3 |

### 3.6 Dependency impact of changed exported signatures

| Export | Change | Callers verified |
|---|---|---|
| `sealBandTexts(b)` (`docx/wrapper/render.ts:325-327`) | Unchanged signature; now delegates | Re-exported by `pages.ts` and `wrapper/index.ts` (s06 report); tsc 0 |
| `sealBandTextsOf(meta, params, lang?)` (`texts.ts:322`) | New; `lang` defaults to the meta language | `docx/wrapper/render.ts:326` (passes `b.lang`), `html/blocks/device.ts:152` (non-ID only) |
| `issueStampTextOf(meta, params, lang?)` (`texts.ts:303`) | Optional `lang` added | `docx/wrapper/render.ts:353` (passes `b.lang`), `texts.ts:353` (`colophonTexts`, default = meta language, the same rule as `b.lang`, `render.ts:102`) |
| `fmt(v, dec?, lang?)`, `withUnit(s, unit?, lang?)` (`bind/format.ts:385, 412`) | Trailing optional `lang`; ID path uses the cached ID entry | Existing 2-argument callers (chart modules, for example `chart/family-h1/ramp.ts:165`, `family-k1/common.ts:266`) keep ID. 0 `.map(fmt)` sites (V9). `bind-format.test.ts` is unchanged and passes (V1) |
| `new Register(entries, language?)` | Optional `language` | 4 sites use `registerForSnapshot` (`render/pure/render.ts`, `render/artifact.ts:455`, `validate/_shared/preview-v2.ts:44`, `validate/route.ts:128`). 3 sites pass `numberLanguageOf(...)` (`ingest/checks.ts:137, 191`, `lint/structure/checks-d.ts:93`). The out-of-scope `artifact.ts:410` hard-codes ID (no Register, Q-C) |
| `auditText(text, reg, allow?, lang?, opts?)` (`bind/audit.ts:143-149`) | Two trailing optional parameters | One production caller, `checks-d.ts:144` (L9) |
| `controlSheetFront(payload, slot, ctx, language?)` (`compose/front.ts`) | Optional `language` | `compose/snapshot.ts:427` |
| `FIGURE_LABELS` (`docx/figures/defaults.ts`) | Now `figureLabels("ID")`; same values, wider type | Compose and adapt-v1 marker users unchanged (s13 report); tsc 0 |
| `DATUM_THOUSANDS_SEPARATOR` and related | Type widened from literal to `string` | Only the `bind/index.ts` re-export uses them (s07 report); tsc 0 |
| `resolveTemplate(template)` (`write-client-run.ts:34`) | Was `async (ctx, template)` with R01; now pure and synchronous | Only caller `write-client-run.ts:299`; tsc 0 |

## 4. Findings

Blockers first: **there are no U4 blockers.** Then the remaining findings by severity.

| # | Severity | Domain | File:Line | Description | Recommendation |
|---|---|---|---|---|---|
| M1 | Medium | Dependency Impact | `params/apparatus.ts:265`; `services/compose/merge.ts:86`; `docx/package/header-footer.ts:133, 284`; `html/base/markup.ts:87`; `html/blocks/device.ts:155`; `front/texts.ts:325`; `services/compose/front.ts:46-57` | The "ID output byte-identical" claim (RQ-4, AC-7, repeated in s06..gfix1 and `verification/20`) is proven only for the S05 corpus, whose 4 inputs all carry explicit uppercase `TERBATAS` (V8). The default classification is mixed case `Terbatas`. Every ID document that omitted `classification` (including MCP documents written from the pre-D-607 how-to sample) now renders `TERBATAS` in 5 wrapper places on re-render. Its recomposed snapshot also changes through `markClassificationPairs`. Intended by D-607, but nowhere stated as an exception to RQ-4 or AC-7. The S05 baseline cannot detect any regression on this path | (a) The controller records in `decisions.md` that byte-identity is scoped to uppercase classification input, and that re-rendering existing mixed-case ID documents gives capitals (D-607). (b) Add one baseline case with default (absent) classification and one with an MCP cover-control `Klasifikasi` pair, pinned to the new expected hashes, so later rounds guard this path. (c) Optional: match the classification label case-insensitively in `compose/front.ts:57` |
| M2 | Medium | Dependency Impact | `scripts/studio/mcp/write-client-run.ts:354-358`; `write-meta.ts:87-90`; `tests/unit/studio/mcp/implw2-client.test.ts:497`; `s12-client-labels.test.ts:116-136` | `studio_write` on an existing document lets `meta.tier` override the server tier (`docMetaTier ?? srvMeta.tier ...`). `setMeta` then sends the new tier (`:370-372`) while the D-1 selector omits front slots. For a TERBIT document already holding cover, controlSheet and signature, switching to NOTA leaves those stored slots in place. The tier gate (`compose/structure.ts:264-269`, `SLOT_FORBIDDEN_FOR_TIER`) may then reject the write after preflight passed, or leave a document that fails compose. `studio_edit` refuses tier changes for exactly this reason (D-600 (2)), but the rewrite path does not. **Hypothesis**: not executed. No test covers "existing TERBIT document + meta.tier NOTA via studio_write"; the tests cover only a new document (s12 (c)) and an existing document that is already NOTA (implw2 :497) | Decide the rule (D-600 parity): either ignore `meta.tier` on rewrite with the same `META_IGNORED` warning as `studio_edit`, or clear forbidden stored front slots explicitly. Add a red-first test on the mock server for the tier-change rewrite |
| M3 | Medium | Maintainability (robustness) | `benchmark/datum_conformance/clash/clash.py:262-266, 312-313` | The PDF clash checker reads `word/document.xml` and `word/settings.xml` with `zipfile.ZipFile(...).read()`, with no decompressed-size or entry cap. The TS reader enforces caps (`lib/docx.ts:118-120, 179-188`). A crafted DOCX passed with `--docx` can therefore exhaust memory. `ET.fromstring` relies on the interpreter's expat for entity-expansion protection, and DOCTYPE is not rejected as it is in `lib/xml.ts:83-85`. The inputs are Studio's own DOCX in practice, but the blueprint treats scorer input as untrusted (S39) | Mirror the TS caps: check `ZipInfo.file_size` against a part limit before `read()`, refuse when `<!DOCTYPE` is present, and add one test for each. Final verdict belongs to S39 |
| L1 | Low | Reference Integrity | `write-client-run.ts:38, 259` | `CONTRACT_TEMPLATE_SLUGS.has(template)`: judged allowed (§3.2). It is registry-derived and replaces the HEAD literal | Optional: also check the R02 `contractKind` |
| L2 | Low | Duplication | `front/texts.ts:67-69` (`wrapperLangOf`); `bind/format.ts:62-64` (`numberLanguageOf`); `scripts/studio/mcp/write-client.ts:158` (`labelLangOf`); inline `header-footer.ts:91, 267`, `html/base/markup.ts:145` | Three exported helpers plus inline rewrites encode the same rule (`=== "EN" ? "EN" : "ID"`). If the language set grows, they will drift | Keep one resolver (for example `wrapperLangOf`, or move it next to the tables) and use it at the 5 new sites |
| L3 | Low | Duplication | `bind/audit.ts:23-25` (`escBody`) vs `bind/format.ts:214-216` (`escapeRegExp`) | Identical regex-escape helpers in the same module folder | Export one from `format.ts` |
| L4 | Low | Duplication | `docx/tables/render.ts:273` (`SOURCE_LABEL_RE = /^\s*(SUMBER\|PROVENANS)\s*$/`); `docx/figures/figure.ts:187-190` (`labelRunRe`); `front/texts.ts:416` (`RUN_LABEL_RE`) | Three recognizers for "is this run an apparatus label". The tables one still hard-codes the ID words instead of reading `APPARATUS_TEXT` (D-597 D-2 single source) | Derive all three from one helper in `texts.ts` (`APPARATUS_TEXT[...].ID.toUpperCase()`) |
| L5 | Low | Structure | `bind/derivation.ts:16, 201`; `docx/figures/derivation.ts:133`; `html/tables/derivation.ts:29` | The bind layer (Python port, pure numbers) now imports `engine/front/texts`, a 71-module closure (V6; no cycle). The EN verdict is applied twice: the builder emits the EN tag, and both renderers also map ID to EN through `verdictTagText` | Keep one mechanism. Either renderers translate (and the bind default stays ID), or bind emits the language tag and renderers stop mapping. Document the choice |
| L6 | Low | Duplication | `benchmark/datum_conformance/lib/pairs.ts:14-27`, `rules/expect_language.ts:23` vs `prisma/seed-doc-type-templates.ts:27, 80-86` | The scorer keeps its own slug/type/tier/kicker register and type-code list. That is legitimate oracle independence, but no test cross-checks them against `DOC_TYPE_TEMPLATE_SPECS`. `report-cli.test.ts:39-42` pins only 3 literal rows | Add one test asserting that `PAIR_REGISTER` (10 rows) equals the defaults in `DOC_TYPE_TEMPLATE_SPECS`. A mismatch then surfaces before a gate run |
| L7 | Low | Structure | `prisma/seed-studio-templates.ts:256` | The docblock says "CH-06 bila `contractKind` terisi", but the code runs CH-06 unconditionally (`:264`, S27) | Fix the comment |
| L8 | Low | Structure | `prisma/seed-studio-templates.ts:54, 56` vs `front/texts.ts:131-133`; `seed-doc-type-templates.ts:113, 115` | The ID slot labels `"Lembar Kendali"` and `"Daftar Isi"` are literals. `controlSheetLabelText` translates only when the label equals `WRAPPER_TEXT.controlKicker.ID`, so an edit to either side silently breaks EN translation for `datum-gsp`. The EN layer already references `WRAPPER_TEXT` | Reference `WRAPPER_TEXT.controlKicker.ID` and `tocKicker.ID` in `DATUM_SKELETON_SLOTS` (values identical, so the skeleton sha is unchanged) |
| L9 | Low | Maintainability | `bind/audit.ts:143-149`; `lint/structure/checks-d.ts:144` | `auditText(text, reg, allow, lang?, opts?)` forces `undefined` placeholders at the call site | Fold `lang` into the options object |
| L10 | Low | Maintainability | `lint/structure/checks-a.ts:19`, `lint/structure/text.ts:6`, `lint/language/checks.ts:15`, `lint/structure/checks-d.ts:26` | Lint imports `bind/format` and `bind/audit` directly, bypassing the `bind/index.ts` barrel that `checks-d.ts:14` uses (`fmtFixed`, `numberPatternSources`, `AuditTextContext` are not re-exported) | Re-export them from `bind/index.ts` and import through the barrel |
| L11 | Low | Structure | `html/blocks/device.ts:148-156` | The HTML seal band picks a different algorithm by language: ID shows classification/copyControl, EN uses the `wrapper.header` pattern shared with DOCX. Accepted by D-601 (1) for byte-identity, but it is behaviour branching on language, not a table lookup | Track it as design debt. Align ID once a baseline refresh is allowed |
| L12 | Low | Maintainability | `bind/audit.ts:135-175` | The structural-number exclusion is a regex heuristic: a label word list, joiners, and a body line-start capital rule. It has documented residual false negatives (EN only) and is hard to reason about | Keep the corpus test. Add the documented false-negative cases as explicit `it.todo` or pinned tests, so a future change is deliberate |
| L13 | Low | Maintainability (tests) | `tests/unit/studio/seed/s27-doc-type-seed.test.ts:173-190` | The "0 code per slug" guards are lexical source greps (`split('"slug"')` counts). They catch literals only; a renamed variable or computed slug passes | Acceptable as a tripwire; rely on review for semantics. No change required |
| L14 | Low | Reference Integrity / docs | `docs/STUDIO-HOWTO-DOCUMENT.md` (§2 sample, §3 item 6, `meta` bullet) | The S30 row acceptance said "diff hanya tabel dan kalimat latest", but the diff also redefines `revision` as a revision code and introduces `revisionNote` in the guidance. `revisionNote` is an existing client alias (`write-client.ts` `META_ALIASES`), and the change was authorized by D-605 (3)/D-607. Still, it is a usage-instruction change under U3 | Controller confirms in `decisions.md` that the `revision`/`revisionNote` guidance is accepted under D-594 |

Totals: Structure 4 Low (L5, L7, L8, L11). Dependency Impact 2 Medium (M1, M2). Duplication 4 Low (L2, L3, L4, L6). Maintainability 1 Medium + 4 Low (M3, L9, L10, L12, L13). Reference Integrity 2 Low (L1, L14). Sum: 3 Medium + 14 Low = 17.

## 5. Tests: do they guard the behaviour?

| Test | Red-before-green claim | Assessment |
|---|---|---|
| `renderers/s06-wrapper-text-single-source.test.ts` | 5 red (new helpers) / 5 characterisation | Good: pins ID output at public seams |
| `engine-core/bind-number-conventions{,-en}.test.ts`, `bind-language.test.ts` | Red 13 / 25 / 17 | Good: ID pins unchanged, EN table, audit acceptance in both directions |
| `engine-core/lint-d01-register-language.test.ts` | Mutation: 2 of 4 fail with the checks-d wiring reverted | Good: proves the wiring |
| `engine-core/lint-d01-structural-numbering.test.ts` | 6 of 9 red before | Good: includes ID corpus equivalence against the port. See L12 |
| `registry/s11-doc-typecode-nda.test.ts` | 1 red | Good: pins the canonical `paramsSha256` literal |
| `mcp/implw2-client.test.ts` (+6), `mcp/s12-client-labels.test.ts` | 4 red / 6 red; D-6 mutation 3 of 12 fail | Good, but the mock re-implements the server tier gate (`implw2-client.test.ts:116-126`), so fidelity depends on the mock matching `structure.ts`. Missing case: M2 |
| `renderers/s13-wrapper-text-en.test.ts`, `gfix1-classification-caps.test.ts`, `s18-register-language.test.ts` | 11 / 7 / EN-ID red | Good for EN and mixed-case behaviour. This is the only place the M1 behaviour change is pinned, as new behaviour; the ID byte baseline does not cover it |
| `seed/s09`, `s26`, `s27` | S27 mutation: 2 of 12 fail with CH-06 conditional + no freeze | Good guard coverage on an in-memory DB stub. The real SQL snapshot is exercised only by the S28 integration run. L13 for the grep tests |
| `compose/s29-usage-parity.test.ts` | Probe red without the D01 fix | Useful. Uses `benchmark/manual000/template.json` as a proxy for `datum-gsp-preset` (documented) |
| `datum-conformance/*` (9 files), `clash/tests/test_clash.py` (25) | S20-S24 reports; mutation 4 of 6 killed (clash) | Adequate for a scorer. Survived mutants (glyph-level edge test, mirrorMargins) are noted in the s24 report. Missing a cross-check against the seed spec (L6). No hostile-ZIP test for the Python reader (M3) |

**Weak spots:** (1) The byte-identity baseline corpus misses the default-classification, cover-control-pair and EN paths (M1). (2) There is no tier-change rewrite test (M2). (3) There is no `PAIR_REGISTER` vs spec cross-check (L6). (4) The lexical grep tests (L13).

## 6. Key challenges (design questions for the controller)

1. **RQ-4 vs D-607.** Should capitalising classification apply to existing ID documents on re-render? D-607 says yes; RQ-4 says existing documents do not change. The release notes and AC-7 should state which one wins, because production re-renders of `datum-gsp` documents with default classification will differ (M1).
2. **Tier as an override on rewrite.** U3/D-594 says "meta tetap bisa menimpa", and D-600 (2) blocks tier changes in edit. Pick one rule for both write paths (M2).
3. **Where should the EN verdict live?** In bind, in the renderers, or both (L5)? Two mechanisms make the next language harder to add.
4. **Scorer oracle vs seed table.** Keeping the scorer independent is right. Wire one equality test, so a spec change cannot silently move the S36, S45 and S52 gates (L6).

## 7. Positive findings

- The seed refactor is a genuine de-duplication. Roughly 140 lines of contract-path transaction, snapshot and stored-check code moved into one generic runner with a data adapter. `--contract-templates` log parity was verified (s09 report), and `--doc-type-templates` is a 1-line caller (`seed-studio.ts` `runDocTypeTemplates`).
- The spec table is clean data composition (5 type layers x 2 language layers), with override validation (unknown slot, out-of-scope key, invalid value; `seed-studio-templates.ts:102-121`). There is no slug literal outside the type rows.
- The `latest` heuristic was replaced by a named constant, and the hard-coded `laporan-kerja-agen` check by a registry-derived set. Both are net reductions in slug coupling.
- The registry defaults (`wrapper.header`, `device.issueStamp.format`) are read from `PARAMS_BY_KEY` and fail loudly (`texts.ts:28-40`), so the text table cannot drift from the registry, and `paramsSha256` is untouched (S11 pin).
- The number table is frozen. Unknown languages throw `BindDefect` (`format.ts:338-342`). `numberLanguageOf` makes document data unable to reach that throw. The ID path keeps the cached entry (`format.ts:385-387`).
- The D01 change is opt-in, with a clear ID-invariance argument, an equivalence test, and documented residuals.
- The TS scorer reader is careful: DOCTYPE rejection, an iterative parser, entry and size caps (also against a lying directory size), and selective extraction.
- Every row ran the AC-7 trio (baseline 8/8, convert_v2, suite) at its own completion. My fresh re-run confirms the final tree.

## 8. Files actually reviewed

Read in full or diff-reviewed hunk by hunk:

- `src/lib/studio/engine/front/texts.ts` (full)
- `src/lib/studio/engine/bind/{audit,derivation,format,index,register}.ts` (diff)
- `src/lib/studio/engine/docx/figures/{defaults,derivation,figure}.ts`, `docx/package/header-footer.ts`, `docx/tables/render.ts` (diff + lines 270-290), `docx/wrapper/render.ts` (diff)
- `src/lib/studio/engine/html/base/markup.ts`, `html/blocks/device.ts`, `html/tables/{apparatus,derivation,figure,style}.ts` (diff)
- `src/lib/studio/engine/lint/language/checks.ts`, `lint/scan/walk.ts`, `lint/structure/{checks-a,checks-d,text}.ts` (diff)
- `src/lib/studio/params/governance-language.ts` (diff)
- `src/lib/studio/services/compose/{front,snapshot}.ts`, `services/ingest/checks.ts`, `services/render/artifact.ts`, `services/render/pure/render.ts` (diff)
- `src/app/api/studio/validate/route.ts`, `validate/_shared/preview-v2.ts` (diff)
- `scripts/studio/mcp/write-client-run.ts` (diff + lines 296-372), `write-client.ts`, `write-meta.ts` (diff)
- `prisma/seed-studio-templates.ts` (full), `prisma/seed-doc-type-templates.ts` (full), `prisma/seed-studio.ts` (diff)
- `benchmark/datum_conformance/lib/xml.ts` (full), `lib/docx.ts` (lines 110-215), `lib/pairs.ts` (full), `clash/clash.py` (lines 258-330 + subprocess grep), `rules/*.ts` (grep for type/tier branching)
- Affected or callee files checked:
  - `src/lib/studio/params/apparatus.ts:265`
  - `services/compose/merge.ts:56, 86`
  - `services/compose/structure.ts:250-275`
  - `services/skeleton/skeleton.ts:115-117`
  - `registry/contracts.ts:390`
  - `engine/docx/wrapper/formats.ts` (imports)
  - `node_modules/fflate/lib/index.cjs:222-244, 2691`
- Tests (case lists and key assertions):
  - `tests/unit/studio/mcp/{implw2-client,s12-client-labels}.test.ts`
  - `tests/unit/studio/seed/s27-doc-type-seed.test.ts`
  - `tests/unit/studio/renderers/gfix1-classification-caps.test.ts`
  - `tests/unit/studio/compose/s29-usage-parity.test.ts`
  - `tests/unit/studio/datum-conformance/report-cli.test.ts`
- Docs: `docs/STUDIO-HOWTO-DOCUMENT.md`, `docs/hermes-skills/gsp-studio-write/SKILL.md` (diff); `docs/STUDIO-AGENT-GUIDE.md` (via the s30_s32 report and `git diff --stat`)
