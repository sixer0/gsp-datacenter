---
schema_version: 1.0
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
date: 2026-11-05
agent: data-analyst
row: C01 (blueprint identification/03_structured_datum_coverage_round.md)
type: mixed
confidence: HIGH for P1-P4, P6, P7 and the seed-guard readings; MEDIUM for the P5 refinement impact (snapshot drift is proven by code reading, not run); C02 must confirm empirically
repo: C:\Users\TRIAL\gsp-swarm-hq-v2.1, branch v2.1, HEAD 8c7c803 (read-only; no code edit, no DB access)
---

# C01 Registry-param safety spike (code reading)

Abbreviations: `L` = `src/lib/studio`. "Old templates" = datum-gsp, datum-gsp-preset, datum-kanonik, datum-kanonik-preset, datum-manual-000, datum-manual-000-preset and laporan-kerja-agen. "The 10" = the DATUM Rev A templates in `prisma/seed-doc-type-templates.ts`. "Absent path" = a stored version that lacks the new key. "Default path" = a resolution against the full registry, where the new key holds its registry default.

## 0. Verdict (summary)

- **M1 is GO, with conditions.** An additive registry param whose default reproduces today's behaviour leaves the old templates' rows and versions, their DOCX/HTML/PDF bytes, the baseline renderer output and the four listed seed guards unchanged. This holds only if every new key meets conditions C-1..C-12 in section 5.
- **P1, P2, P3, P4, P6 and P7 are confirmed.** P4 and P6 come with stricter wording.
- **P5 is refuted as worded.** A key that **compose** reads must be in `COMPOSE_PARAM_KEYS`, or reconstruction breaks for documents that use the opt-in. To keep snapshots byte-identical, such a key must be dropped from the snapshot when its value is absent or equals the default. Keys that only the **engine** reads stay out of the list, as P5 says. So CS-12 and CS-06 should move from `compose/front.ts` into the engine wrapper. CS-11 stays in compose, under C-5.
- **New conditions the blueprint missed:** P8 (`--import-manual000-v2` fails after any registry addition), P9 (no coupling to derive functions or the layer phase), P10 (`SECTION_REGISTRY` must not change), P11 (the default must pass its own validation), P12 (forbidden key prefixes), P13 (new role keys) and P14 (shared default/enum constants).
- **M2 is GO for GF-08 only.** **M3 is NO-GO.** D-605 (1) stands.

## 1. Source tasks and inputs read

| Input | What was used |
|---|---|
| `identification/03_structured_datum_coverage_round.md` §0-§3 and row C01 | The question, P1-P7, the (A) list and the mechanisms |
| `decisions/decisions.md:611` D-605, `:614` D-608, `:615` D-609, `:631-634` D-625..D-628 | Constraints (a)-(d); USER answers Q2 (CV-15 fixed unit) and Q4 (RB-08c restart at Chapter 1); the Rev A preset |
| `decisions/decisions.md:278` D-273, `delegation_progress/coder_execution_reseed.md:44`, `delegation_progress/integration_backlog.md:78` (IP-70) | Precedent: 10 registry keys were added after SR-36. Kanonik and GSP stayed `unchanged` with 774 stored keys and `registryInSync false`; this was accepted |
| Code at HEAD | All file:line citations below |

## 2. How the two hashes are computed and when they are recomputed

| Hash | Computation | When it is (re)computed | Effect of a new non-essential key |
|---|---|---|---|
| `paramsSha256` | `sha256Hex(stableStringify(resolvedParams))`, where `resolvedParams = resolveParams({base, overrides, registry: ALL_PARAMS})` (`L/services/templates/profile.ts:575-582`) | Only when a version row is **created** (`composeVersion` from `createTemplateV2InTx` / `createTemplateVersionV2InTx`; `L/services/templates/index.ts:958-966`). On load it is only recomputed for an integrity **log**, over the stored params (`index.ts:560-571`). The SR-36 seed recomputes it over the stored baseline and throws on mismatch (`prisma/seed-studio.ts:816-818`). Stored rows are never rewritten | None for stored rows. A **fresh** composition (new version, DB-less file mode, canonical payload) includes the key, so its sha differs. That is expected and harmless (section 4.4) |
| `skeletonSha256` | `sha256Hex(stableStringify(canonicalSkeleton(slots).slots))` (`L/services/skeleton/skeleton.ts:115-117`). Slot params are partitioned by surface (`:69-77`) | By seed as `wantSk` from the slot defs (`prisma/seed-studio-templates.ts:163`, `prisma/seed-studio.ts:672`). Slot params come only from `knobValues` (ESSENTIAL_KNOBS, `essential` surface, `seed-studio-templates.ts:76-90`) plus spec `slotOverrides` (`:115-125`) | None, unless the key is essential (P1) or put into an old template's `slotOverrides` |

## 3. Conditions P1-P7: verdicts with evidence

### P1: not `essential`, and in no ESSENTIAL_KNOBS entry. CONFIRMED

- **Confidence:** HIGH.
- **Evidence:**
  - `knobValues` iterates only `ESSENTIAL_KNOBS` and keeps only `def.surface === "essential"` keys (`prisma/seed-studio-templates.ts:79-85`).
  - The "unchanged" checks compare the stored `overrides` with knob values plus the spec layer: skeleton templates at `:164, :179`, presets at `prisma/seed-studio.ts:683`.
  - `convert_v2` builds `template.v2.json` essentials from `ESSENTIAL_KNOBS` (`benchmark/extract/convert_v2.ts:468-478`) and `--check` byte-compares the output (`:529-536`).
  - Surface comes from the ID lists (`L/registry/essentials.ts:63-150, 163-180`). The SC-2 test requires every key to have a valid surface and scope (`tests/unit/studio/structure/params-surface.test.ts:72-77`).
- **Implication:**
  - An essential key would enter the knob layer of datum-gsp, datum-kanonik and laporan-kerja-agen. They would get new versions, and `convert_v2 --check` would report DIFF.
  - New keys need an ID in `PARAM_SURFACE_LISTS.advanced` (precedent R-65 and R-66 at `essentials.ts:98-101`).

### P2: not class T, and not surface `derived`. CONFIRMED

- **Confidence:** HIGH.
- **Evidence:**
  - Step 4 of `checkTemplateWrite` rejects class T for everyone. It rejects `derived` keys unless the caller is ADMIN writing a preset (`L/services/skeleton/access.ts:230-239`).
  - The seed writes as `ADMIN_CALLER` (`prisma/seed-studio-templates.ts:47`), so a class K key would pass for the seed but block USER edits (`access.ts:247-251`).
- **Implication:** use class B and surface `advanced`. The Table 8.2 keys are `derived` by ID pattern (`essentials.ts:166-169`, P4T-S*-size), so GF-08 cannot use M1 (section 6).

### P3: the reader treats "absent" exactly like the default. CONFIRMED and strengthened

- **Confidence:** HIGH.
- **Evidence:**
  - Stored versions are frozen and used as they are (`L/services/templates/index.ts:560-581`, `toResolvedTemplate` at `profile.ts:815-839`). Old templates therefore render with the key **absent** at template level.
  - Inside the **same document**, slot params are re-merged against the full registry. `mergeLayers` starts from `canonicalProfile(registry)` (`L/engine/tokens/merge.ts:150-155`). Layered slot resolution uses it (`L/services/skeleton/resolve.ts:109-119`), as does `applyDocOverrides` (`L/services/ingest/index.ts:218-228`). So the key is **present at its default** at slot level.
  - DB-less paths resolve the full registry: file mode (`L/services/templates/import.ts:196-214`), `resolveProfileInMemory` (`profile.ts:790-800`), the parity renderer used by the baseline (`scripts/parity/run/lib/render.ts:767-768, 805`), and `convert_v2` (`benchmark/extract/convert_v2.ts:371-382`).
  - Existing reader convention: fallback = the registry default literal (`pStrList` at `L/engine/docx/wrapper/pages.ts:115, 119`; `L/engine/front/texts.ts:259`; `pNum` at `L/engine/docx/tables/render.ts:188`). `effectiveTemplate` overlays the defaults (`L/engine/docx/tables/style.ts:34-57`). `PARAMS_BY_KEY.get(...).default` is used as a fallback (`L/engine/docx/package/parts.ts:36-37`).
  - Precedent: render params R-26..R-34 were "additive; default = current renderer behaviour" (`L/params/render.ts:3-4`). D-273 accepted stored rows that lack newer keys (`decisions.md:278`).
- **Implication:** both paths occur in every old-template render. Each reader needs a unit test that proves absent equals default (AC-C5).

### P4: key name outside the `color.interior.`, `color.wrapper.`, `color.brief.` and `color.role.` prefixes. CONFIRMED and widened to the whole `color.` prefix

- **Confidence:** HIGH.
- **Evidence:**
  - `tokenVars` emits `:root` variables for every resolved key with the three palette prefixes (`L/engine/html/base/css.ts:141-151`; emitted only if the value is a hex) and for every `color.role.*` key (`:153-155`; always emitted).
  - The palette lint collects hexes from **every** `color.*` key (`L/engine/lint/structure/checks-a.ts:352-354`).
  - `resolveColorToken` tries the candidates `color.<ref>` (`L/engine/tokens/color.ts:72-74`), so a new `color.x` key could capture an existing short token reference `x`.
  - `derivedColorTokens` scans **all** param values for `zebraNN` strings (`color.ts:17, 92-103`). The result feeds the CSS (`css.ts:152`) and the palette (`checks-a.ts:356`).
- **Implication:** no new key under `color.`, and no new default shaped like `zebraNN`. GF-22 names: section 7.

### P5: key not in COMPOSE_PARAM_KEYS. REFUTED as worded; refined to C-5

- **Confidence:** HIGH on the mechanism; MEDIUM on the scale of the drift (C02 to measure).
- **Evidence:**
  - `COMPOSE_PARAM_KEYS` is declared as "the only parameter keys compose reads". It is stored in `snapshot.compose` so that recomposing from the snapshot gives the same sha without the template DB (`L/services/compose/context.ts:1-11, 12-29`). `NORM_COMPOSE_PARAM_KEYS` is the canonical copy and must match it in the same order (`L/contract/types/v2/norm.ts:53-74`).
  - Reconstruction and the figure preview use the stored context (`L/services/compose/register.ts:30`; `src/app/api/studio/documents/[id]/figures/preview/_lib/figure.ts:124`).
  - Compose reads slot params for the control sheet (`L/services/compose/snapshot.ts:168, 427`). `pick` stores every listed key whose value is `!== undefined` (`context.ts:45-49`).
  - Slot params of old skeleton templates, and of the DB-less baseline, carry new keys at their default (P3 evidence). Adding a key to the list therefore changes `snapshot.compose` for **new** compositions on old templates.
  - That change does not reach DOCX/HTML bytes: a grep of `L/engine` for `snapshotSha256|paramsSha256|versionId` finds 0 readers in output code.
  - The baseline reports compose-snapshot differences as INFO only (`benchmark/datum_conformance/baseline/render_id_samples.ts:419-423`). Submit idempotence uses a content diff, not the snapshot sha (`L/services/submit/pipeline.ts:872-873`).
- **Implication:**
  - (a) Keys read **only by the engine** (`ctx.tpl.params`) stay out of the list. P5 holds for them.
  - (b) A key read **by compose** must be added to both lists. Otherwise reconstruction of opt-in documents on the 10 gives the absent-path output, a real integrity defect. For full byte stability, `pick` must drop that key when its value is absent, `null`, or equal to the registry default. This is a narrow change in `context.ts`, applied to a named set of new keys; existing keys keep today's behaviour.
  - Recommendation: render CS-12 (subtitle) and CS-06 (signature columns) in the engine. `signatureXml` already sizes the columns as `n = s.roles.length` (`L/engine/docx/wrapper/render.ts:521-522`), and the control-sheet items are built in `pages.ts:281`. Only CS-11 needs compose (`compose/front.ts:99-108` builds the column heads and the row mapping).

### P6: enum additions keep default lists unchanged. CONFIRMED, with a constant-sharing hazard

- **Confidence:** HIGH.
- **Evidence:**
  - Precedent: NDA was added to the `doc.typeCode` enum only, "default unchanged (paramsSha256 unchanged)" (`L/params/governance-language.ts:114-117`).
  - The contract-template layer reads the `doc.typeCode` **default** (`prisma/seed-studio.ts:1138-1143`). A changed default would give laporan-kerja-agen a new version.
  - Hazard: `cover.controlBlock.fields` uses **one constant for both default and enum** (`L/params/page.ts:368-377, 426-429`). Appending `KLASIFIKASI` to that constant changes the default. The baseline sample has `meta.classification = "TERBATAS"` (`render_id_samples.ts:205`) and an auto control block, so a KLASIFIKASI row would appear and the baseline would show DIFF.
  - `device.spine.placements` uses separate literals for default and enum (`page.ts:328` vs `:332`), so it is safe.
  - Second hazard: the fallback in `controlBlockRowsText` is `Object.keys(CONTROL_FIELD_LABELS)` (`L/engine/front/texts.ts:259`). Adding a label entry there silently changes the absent-path list.
- **Implication:** see C-6 and P14.

### P7: no role key emitted for every document, and no registry-wide count or hash printed. CONFIRMED (closed)

- **Confidence:** HIGH.
- **Evidence:**
  - `styles.xml` is a fixed minimal set: docDefaults, Normal, three built-in styles, Header/Footer and their character styles (`L/engine/docx/package/parts.ts:180-232`). Nothing iterates roles or the registry.
  - `ROLE_KEYS` (`L/contract/enums.ts:177-181`) is used only for validation and UI (`profile.ts:358`, `L/contract/schema/v2/template.schema.ts:63`, `src/app/api/studio/registry/route.ts:449`, `src/components/studio/template-editor/role-formats-editor.tsx:88-123`).
  - Output code reads only fixed lists: face roles (`L/engine/html/base/css.ts:203`) and `color.role.*` params (P4).
  - Registry-wide figures exist only in these places:
    - count constants and their test pins (`L/params/index.ts:34-37`; `tests/unit/studio/renderers/fixtl-toc-levels-roles.test.ts:89-92`, pinned to 45/788). They must be updated in C06. This is an expected test change, not a safety break;
    - `registryDigest`, written into `provenance.catalogRef` of **new** versions only (`profile.ts:105-127, 586`);
    - `describeCanonical`'s `registryParamsSha256` (`seed-studio.ts:1190-1199`);
    - `reportCounts`, which counts from stored rows (`seed-studio.ts:1208-1226`; unchanged);
    - the seed's warning for invalid defaults (`seed-studio.ts:1261-1265`; see P11);
    - the DB-less `versionId = file:<paramsSha256 prefix>` (`import.ts:219`, `profile.ts:804`), which the engine never reads (grep: 0 hits).
- **Implication:** P7 holds. The only printed change is the canonical registry sha value (section 4.3).

## 4. Seed guards and outputs: per-guard verdict

| # | Guard / output | Verdict | Evidence | Note |
|---|---|---|---|---|
| 4.1 | `--presets-and-skeletons --dry-run` | **Unchanged** | `computePresetLayer` pins only baseline (stored) keys that differ (`seed-studio.ts:635-657`). The new key is not in `legacy` (`:637`). `ensurePreset` compares the stored layer, the folded roleFormats and the skeleton (`:680-684`). `ensureSkeletonVersion` compares sk, base and layer (`seed-studio-templates.ts:179`). `guardReport` runs on stored `next` for `unchanged` outcomes (`seed-studio.ts:700-746, 863-873`) | Needs P9: the new key must not change the derived value of any existing key |
| 4.2 | `--contract-templates --dry-run` | **Unchanged** | `snapshotTemplates` compares stored columns only (`seed-studio-templates.ts:333-342, 401-426`). Layer = `doc.*` from the **default** of `doc.typeCode` (`seed-studio.ts:1138-1143`). Knobs come from the stored preset `resolvedParams` (`seed-studio-templates.ts:263-264`) | Needs P6 and P10 |
| 4.3 | Canonical `registryInSync` | **Value changes, boolean stays false; report only** | `registryInSync = stored sha === canonicalVersionPayload().paramsSha256` (`seed-studio.ts:1187-1199`). `canonicalVersionPayload` resolves the full registry (`profile.ts:598-606`). It is already false on DEV: IP-70 open (`integration_backlog.md:78`), accepted in D-273 (`decisions.md:278`), warning persisted (`coder_execution_reseed.md:44`). No test asserts it: the grep over tests/scripts/src finds it only in `tests/integration/studio/out/*.log` | C02 records the before/after `registryParamsSha256` |
| 4.4 | `--doc-type-templates --dry-run` (old templates) | **Unchanged** | Same runner as 4.2. `freezeSectionTypes: true` (`prisma/seed-doc-type-templates.ts:198`; `seed-studio-templates.ts:419`) | The 10 get new versions only when their spec changes (intended). Needs P10 |
| 4.5 | **`--import-manual000-v2` (missed by the blueprint)** | **FAILS on DEV after any registry addition** | `fileSha` resolves `template.v2.json` against the full registry (`seed-studio.ts:998`). The `unchanged` stored version lacks the key, so the guard condition `fileSha === r.version.paramsSha256` fails (`:1045, :1049`). The code documents this exact case (R-65 precedent) and leaves "new version or accept" to the controller (`:1015-1027`) | **P8.** Do not combine this flag with C02/C30 on DEV, or record it as an expected failure plus a controller decision. Fresh DB (uji-run, `tests/integration/studio/uji-run.mjs:135-139`) is unaffected because its rows are created with the full registry. It may already fail on DEV today (registry 784 at the reseed vs 788 now, `L/params/index.ts:37`); C02 should check |
| 4.6 | Baseline `render_id_samples` 8/8 | **SAME, if C-1..C-12 hold** | DB-less full-registry resolution (`scripts/parity/run/lib/render.ts:767-805`). Bytes depend only on readers (P3). Compose snapshot is INFO only (`render_id_samples.ts:419-423`) | C-5 also keeps the INFO line stable |
| 4.7 | `convert_v2 --check` x3 | **SAME** | Outputs depend on template.json overrides, the fixed `additions` (`convert_v2.ts:402-429`) and ESSENTIAL_KNOBS (`:468-478`). `canon[k]` is compared only for kept keys (`:394-397`) | Needs P1 and P10 (no new section type; `:480-482` filters `ruleIndex`) |
| 4.8 | DB render of old templates (DOCX/HTML/PDF) | **Same bytes, if C-3 holds** | Template-level key absent; slot-level key at default (P3). No output path hashes params (grep `stableStringify(.*params` → only `profile.ts:593` and `index.ts:562`) | PDF is LibreOffice from DOCX (D-597): same DOCX gives the same PDF content |
| 4.9 | Profile imports `--import-benchmark` / `--import-datum-gsp` | Would create new versions, but **skipped** | `importTemplateProfile` compares a digest that includes a fresh `paramsSha256` (`L/services/templates/index.ts:1401-1411`). Both flags are skipped for skeleton-managed templates (`seed-studio.ts:1303-1317`) | Informational |

## 5. Conditions every new key must satisfy (the M1 contract)

| ID | Condition | Source |
|---|---|---|
| C-1 | Surface `advanced` (ID added to `PARAM_SURFACE_LISTS.advanced`). Not in any `ESSENTIAL_KNOBS` entry | P1 |
| C-2 | Class B. No `derive` field. Not `derived` | P2, P9 |
| C-3 | Absent ≡ default ≡ today's bytes in DOCX and HTML. The reader falls back to the registry default literal, and emits nothing new (no extra CSS variable, attribute or element) when the value is absent or default. Proven by a unit test (AC-C5) | P3 |
| C-4 | Key does not start with `color.` (or `type.face`, `chart.kind.`), and its default is not shaped like `zebraNN` | P4, P12 (`checks-a.ts:177-180`, `L/services/compose/blocks.ts:374-384`) |
| C-5 | Engine-read keys: not in `COMPOSE_PARAM_KEYS`. Compose-read keys: added to `COMPOSE_PARAM_KEYS` **and** `NORM_COMPOSE_PARAM_KEYS` in the same order, with `pick` dropping them when absent, `null` or equal to the default | P5 refined |
| C-6 | An enum addition changes only `enum`, never `default`. Where default and enum share a constant, split it (`cover.controlBlock.fields`). Engine fallbacks must use the registry default list, not label-table keys (`texts.ts:259`) | P6, P14 |
| C-7 | No `SECTION_REGISTRY` change (no `paramRefs`, elements or version edit). `planSectionTypes` would schedule updates, and the `--doc-type-templates` freeze would fail | P10 (`seed-studio.ts:221-256`) |
| C-8 | The default passes `validateParamValue` (`null` only when default is `null`, `L/engine/tokens/merge.ts:49-50`); otherwise the seed logs a new warning (`seed-studio.ts:1261-1265`) | P11 |
| C-9 | Name does not match `TYPE_TA_RE` (`type.scale.X.size|leading`, `L/engine/tokens/layer.ts:70, 134-140`) and is not a `marginsFromDensity` target (`layer.ts:106-117`). No existing DeriveFn reads it | P9 |
| C-10 | Values are set **only** in the 10's spec layers (shared / type / language data in `prisma/seed-doc-type-templates.ts`), never in old templates' specs or in `slotOverrides` of old templates. No slug or type branch (U4). Per-type and per-language layers are new **data** fields of `DocTypeLayer` / `LanguageLayer` (`seed-doc-type-templates.ts:69-123`) | Constraint (c)/(d) |
| C-11 | Prefer a contract param in `L/params/render.ts`, with IDs R-67 onward (R-65/R-66 precedent at `render.ts:11-12, 311-335`). Override `namespace` to the key's first segment (the `r()` default is `"render"`, `render.ts:41`; ParamDef rule at `L/contract/types/params.ts:141-142`). This keeps `CATALOG_PARAM_COUNT` 722. Update `RENDER_PARAM_COUNT`/`ALL_PARAM_COUNT` and the pin test in the same row | P7, SC-2 test |
| C-12 | No new RoleKey if an existing role fits. If one is needed, append it at the end of `ROLE_KEYS` (FIX-TL precedent, `enums.ts:177-180`) and reference it only from opt-in code. Every new key gets a non-"Lainnya" UI category (AC-C10, U01) | P13 |

Seed procedure note (P8): run `--presets-and-skeletons`, `--contract-templates` and `--doc-type-templates` separately. Do not pass `--import-manual000-v2` on DEV in C02/C30 unless its expected `equalsFileMode` failure is recorded and decided.

## 6. Mechanism comparison

| Aspect | M1 additive param (default = today) | M2 "GSP DATUM Rev A" preset derived from `datum-gsp-preset` | M3 template-level roleFormats |
|---|---|---|---|
| Old rows / versions | Unchanged (section 4) | Unchanged: new preset row; `datum-gsp-preset` untouched; laporan-kerja-agen keeps `datum-gsp-preset` (`seed-studio.ts:1105`) | Unchanged only if the guard ignores roleFormats, which is the defect |
| Can pin `derived` keys | No (`access.ts:235`) | Yes: ADMIN on a preset (`access.ts:235`). A preset may reference a preset (`L/services/templates/index.ts:913-929`) | n/a |
| Seed guard sees the change | Yes: stored `overrides` compared (`seed-studio-templates.ts:179`) | Yes: layer compared. The preset slug must be a **target** of the guarded transaction, or `addedTemplates` fails (`seed-studio-templates.ts:395, 401, 410, 417`) | **No**: `ensureSkeletonVersion` ignores roleFormats (`:179`). `ensureDerivedTemplate` does not even pass them (`:269-279`). Stored roleFormats are the merged effective set (`profile.ts:583`), so a naive comparison would give datum-manual-000 a new version (it passes `def.roleFormats`, `seed-studio.ts:994`) |
| Reaches the table width solver | n/a | Yes: the solver reads `type.scale.tableNumerals.size` (`L/engine/docx/tables/render.ts:188`) | No: runs change, guards do not |
| Verdict | **GO** (primary) | **GO for GF-08 only** | **NO-GO**; D-605 (1) stands |

M2 conditions:
- (a) A new seed helper creates or updates the preset with `isPreset: true`, `preset: { slug: "datum-gsp-preset" }` and ADMIN caller. `ensurePreset` has no `preset` field (`seed-studio.ts:665-671`), so it cannot be reused as is.
- (b) Its slug is added to the guarded transaction's targets.
- (c) The 10 switch `presetSlug`; this means new versions for the 10 only (`seed-studio-templates.ts:179, 242`).
- (d) The template knob `type.scale.body.size` equals the preset value, so `applyTypeScale` returns early (`layer.ts:131`) and the pins stay.
- (e) PRESET_MIGRATIONS is not edited.

## 7. Per-point mechanism table (every (A) point plus CV-15 and RB-08c)

Every key: class B, surface `advanced`, contract param (R-67 onward, C-11), default = today. Names are proposals; C05 is the final register.

| Point | Mechanism | Proposed key / change | Type, default (= today) | Read in (engine vs compose) | Specific evidence and conditions |
|---|---|---|---|---|---|
| CS-12 | M1 | `controlSheet.subtitle.enabled` | bool, `false` | **Engine** (`L/engine/docx/wrapper/pages.ts:281` + HTML wrapper); text from the text table | Moving off `compose/front.ts` avoids C-5. If kept in compose, C-5 applies |
| CS-06 | M1 | `controlSheet.signatures.fillRoles` | bool, `false` | **Engine** `signatureXml` (`L/engine/docx/wrapper/render.ts:521-522`) + HTML `signatureHtml` (`L/engine/html/blocks/wrapper.ts:148`) | Scope `section:signatureBlock` (`L/registry/slots.ts:247`). Role labels from the text table (`texts.ts:220-226`) or `controlSheet.signatures.roles` (`page.ts:490-500`), only when true |
| CS-11 | M1 + C-5 | `controlSheet.columns.form` | enum [`mesin`, `manual`], `mesin` | **Compose** (`compose/front.ts:99-108`); reads the existing `controlSheet.*.columns` (`page.ts:451-489`) only when `manual` | Must be added to both compose key lists, with default elision. Existing column params keep their defaults (D-608: their defaults differ from today's output) |
| CV-20 | M1 | `cover.title.maxWidthMm` | mm, `null` (range 0-166) | Engine `L/engine/docx/wrapper/formats.ts` (cover title roles) | Right indent = full span − value (166 − 150 = 16 mm = 907 tw). `null` = no indent (C-8 allows `null`) |
| CV-19 | M1 (enum variant) | Add `sampul belakang` to the `enum` of `device.spine.placements` (`page.ts:332`); default `page.ts:328` unchanged | list | Engine `pages.ts:118-119` + `L/engine/front/apparatus.ts:67, 70` + HTML | Divider placement is already honoured (`pages.ts:559`; HTML `wrapper.ts:560`). Only the back cover is new. Separate literals, so P6 is safe |
| GF-19 | M1 (conditional on C03) | `render.docx.pageBackground` | bool, `false` | Engine package parts (`document.xml`, `settings.xml`); colour from the existing `color.interior.paper` | The name is outside `color.` (C-4) |
| GF-22 | M1 | `runningHead.ruleColour` and `device.registerBlock.topRuleColour` | hex, `"C3CBD1"` and `"101418"` | Engine `L/engine/docx/package/header-footer.ts:75` (INK200) and `:364` (INK900); reader `normalizeHex(v) ?? constant` | **No CSS variable for old templates:** not under `color.interior.`/`wrapper.`/`brief.`/`role.` (`css.ts:141-155`), not in the palette lint (`checks-a.ts:354`), not a `zebraNN` token. Scopes `section:runningHead` / `section:registerBlock` (`slots.ts:244, 239`). HTML parity must not emit a new variable when the value is default |
| GF-21 | M1 | `render.rhythm.snapToBaseline` | bool, `false` | Engine DOCX spacing code | Layout risk on the 10 only (blueprint §1.4) |
| GF-24 | M1 | `render.rail.reserveColumn` | bool, `false` | Engine `L/engine/docx/blocks/rail.ts`, `L/engine/docx/package/section.ts`, table guards | Must not modify the `railColsTw`/grid derive functions (C-9). Width guards read params, so the flag must be honoured at render. `layout.railMode` "A" is already set by the 10 (`seed-doc-type-templates.ts:43`) |
| CL-02 (T/S) | M1 (enum variant) | Add `KLASIFIKASI` to the **enum only** of `cover.controlBlock.fields` (split the shared constant, `page.ts:368-377, 426-429`) + label entry | list | Engine `texts.ts:247-272` | C-6: the fallback at `texts.ts:259` must stay the registry default list. The 10 set the list with `KLASIFIKASI` |
| CL-02 (NOTA) | M1 | `render.nota.classificationLine` | bool, `false` | Engine NOTA number-block renderer (C16 locates it) | Set in the NOTA type layer only (C-10) |
| ST-01 | M1 (gate) | `render.ruleIndex.fromMarkers` | bool, `false` | Engine `L/engine/docx/assemble/units.ts` + HTML `L/engine/html/assemble/slots.ts:229-231` | Today `ruleIndex` renders as a marker only (`L/engine/docx/assemble/index.ts:250-251`). An ungated builder would change any skeleton that has a ruleIndex slot. Set in the STD type layer (STD already has the slot, `seed-doc-type-templates.ts:62-66, 84`) |
| TR-07 | M1 | `naming.file.form` | enum [`judulNomorRevisi`, `judulTanggalIso`], `judulNomorRevisi` | `L/services/render/pure/render.ts`, `L/services/storage/paths.ts:196-210` | Does not touch class T `naming.file.pattern` (`governance-language.ts:95-96`). Set in the NOTA type layer |
| GF-08 | **M2** | Preset `datum-gsp-rev-a-preset` ("GSP DATUM Rev A") pins `type.scale.tableNumerals.size` 7.8, `type.scale.tableHeader.size` 6.8, `type.scale.caption.size` 7.6 (D-609) | n/a | Solver `tables/render.ts:188` | M1 not feasible: keys are `derived` (`essentials.ts:166-169`; `access.ts:235`). M3 not feasible: no guard comparison and no solver effect (section 6) |
| CV-15 (USER approved, D-627) | M1 | `cover.controlBlock.preparerUnit` | string, `""` (empty = `meta.author`) | Engine `texts.ts:251` | Language layer values "Divisi Engineering PT GSP" / "Engineering Division, PT GSP"; `meta.author` stays in the signatures. No payload change (U3) |
| RB-08c (USER approved, D-627) | M1 | `device.registerBlock.sheetNumbering` | enum [`dokumen`, `bab1`], `dokumen` | Engine `section.ts` (pgNumType restart) + `header-footer.ts` register fields (`:337-345`, PAGE/NUMPAGES) | Set in the ID language layer only. **Risk:** "OF N" counted from Chapter 1 needs field arithmetic or SECTIONPAGES. LibreOffice 24.2 support for this is not verified; C26 must probe it |

Not feasible: none. The (A) list maps to 13 points on M1 and GF-08 on M2. Together with CV-15 and RB-08c this gives **14 new keys** and **2 enum additions** (CV-19, CL-02 T/S): `RENDER_PARAM_COUNT` 45 → 59 and `ALL_PARAM_COUNT` 788 → 802 if C-11 is followed.

## 8. Files/modules involved (for C05/C06)

- `L/params/render.ts`: new defs (C-11).
- `L/registry/essentials.ts`: surface IDs (C-1).
- `L/params/page.ts`: enum splits (C-6).
- `L/params/index.ts` and `tests/unit/studio/renderers/fixtl-toc-levels-roles.test.ts`: counts.
- `L/services/compose/context.ts` and `L/contract/types/v2/norm.ts`: only for CS-11 (C-5).
- Blueprint ownership deltas to raise at G-SPIKE:
  - C08 (CS-12) and C09 (CS-06) move from `compose/front.ts` to the engine wrapper and HTML wrapper.
  - C06 or C10 owns the `context.ts`/`norm.ts` change.
  - C06 should write only `render.ts`, `essentials.ts`, `page.ts` and `index.ts`, not the five param files listed in the Execution Profile.

## 9. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| `--import-manual000-v2` guard fails on DEV (P8) | Certain if run | Keep it out of C02/C30, or record it as expected and get a controller decision |
| A compose-read key added without default elision causes snapshot drift on old templates | Medium (blueprint P5 currently forbids the list, which would instead break reconstruction) | C-5 and a unit test: `composeContextOf` is byte-equal for absent vs default |
| Shared default/enum constant (CL-02) changes the baseline | High if overlooked | C-6 plus the baseline gate |
| RB-08c "OF N" not supported through LibreOffice | Medium | Probe in C26; fallback = restart PAGE only, recorded as P |
| GF-24 width guards inconsistent with the 128 mm body | Medium | C-9; table guard tests on an opt-in fixture (C20) |

## 10. Acceptance for this spike / handover to C02

C02 should verify empirically, with one dummy advanced bool (contract param, `false`) and one enum-only addition:
- baseline 8/8 SAME, including the compose-snapshot INFO line unchanged;
- `convert_v2 --check` SAME x3;
- `--presets-and-skeletons --dry-run`, `--contract-templates --dry-run` and `--doc-type-templates --dry-run` all `unchanged` with `guard.ok`;
- `registryInSync` false before and after, with both `registryParamsSha256` values recorded;
- (optional, informational) `--import-manual000-v2 --dry-run` expected to fail with `registryDrift.addedSinceVersion = [dummy]`.

## 11. Recommendations

1. GO for M1 under C-1..C-12. Amend blueprint P5 to C-5 and add P8-P14 at G-SPIKE.
2. Move CS-12 and CS-06 into the engine. Keep CS-11 in compose with C-5.
3. GO for M2 for GF-08 with the slug-as-target condition. Keep M3 rejected.
4. C05 adopts the key names in section 7, or records why a name differs, and checks each one against C-1..C-12.

Plan draft: skipped (a C01 research row; the plan belongs to pm-planner / task-architect at G-SPIKE).
