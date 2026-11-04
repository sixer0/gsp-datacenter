---
task_id: 2026-10-22_doc_artifact_studio
task_slug: doc_artifact_studio
row: S40 (DATUM Rev A blueprint, pre-production verification)
date: 2026-11-04
agent: verifier
skills_loaded: verification-before-completion
source_plan: docs/2026-10-22_doc_artifact_studio/identification/02_structured_datum_rev_a.md (row S40, line 156; AC table lines 60-73)
binding_decisions: D-590..D-618 (reinterpretations flagged per AC: D-607, D-608, D-610, D-612)
status: complete
verdict: PASS-WITH-NOTES on AC-1..AC-11 (DEV scope); overall GO for G1/S41 with 1 precondition (G-1 below)
---

# S40: DATUM Rev A pre-production verification (AC-1..AC-11)

## 1. Verification scope

- Repo `C:/Users/TRIAL/gsp-swarm-hq-v2.1`, branch `v2.1`, HEAD `3566486`, all work uncommitted (`git diff --stat`: 52 tracked files, +2349/-582, plus untracked `benchmark/datum_conformance/`, `prisma/seed-doc-type-templates.ts`, `prisma/seed-studio-templates.ts`, `src/lib/studio/engine/front/running-head-fit.ts` and 36 new test files).
- In scope: AC-1..AC-11 against DEV evidence. AC-12 and the clone, rehearsal, production and Hermes parts of AC-3, AC-4, AC-8 and AC-11 belong to S43-S54 and are marked "deferred".
- Read-only. The only DB contact was `prisma/seed-studio.ts --doc-type-templates --dry-run` against DEV `gsp_agent_hq_v21` (transaction rolled back). No port was opened, no process was started or stopped, nothing was committed, and no repo file except this report was written. Scratch output: `C:/Users/TRIAL/AppData/Local/Temp/claude/s40/`.
- Evidence read: `verification/19..25`, `implementation/datum_rev_a_dev_seed.md` and `datum_rev_a_dev_smoke.md`, `delegation_progress/coder_execution_{gfix1,gfix_running_head,review_fixes,s26_s29,s30_s32,s09_s11}.md`, `decisions/decisions.md` D-590..D-618 (lines 596-624), `deploy/04_deploy_execution_log.md`, `deploy/05_datum_rev_a_rollout_plan.md`, the DEV gate outputs in `C:/tmp/s36r2/`, `C:/tmp/s35/`, `C:/tmp/s34/`.

## 2. Fresh commands run in this session (2026-11-04, 22:10-22:26 WIB)

| # | Command | Result |
|---|---|---|
| F1 | `npx vitest run tests/unit/studio` | `Test Files 259 passed (259)`, `Tests 4738 passed (4738)`, 324 s, EXIT=0 |
| F2 | `npx tsc --noEmit -p .` | no output, EXIT=0 |
| F3 | `npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root ... --out C:/tmp/bl_s40 --inputs .../datum-rev-a-baseline/inputs --compare .../datum-rev-a-baseline` | `compare: 8/8 SAME` (each line `SAME <case> DOCX/HTML baseline <sha> now <sha>`, e.g. `a_terbit_datum_gsp DOCX 633e583f...e9e6af`), EXIT=0 |
| F4 | `npx tsx benchmark/extract/convert_v2.ts --check` | `SAME` for `doc.v2.json` (79290e07...), `template.v2.json` (882057c5...), `datum-manual-000.preset.json` (a951b149...), EXIT=0 |
| F5 | `npx tsx prisma/seed-studio.ts --doc-type-templates --dry-run` | DB `gsp_agent_hq_v21`, `dryRun: true`; 10/10 `outcome: unchanged`, `storedOk: true`, `versionNo: 2`, `contractKind: null`, `baseVersionId: cmvue8kfk0001v1usfrh1fb94` (= `datum-gsp-preset` v2), `skeletonShaMatchesSeed: true`; guard `{"ok": true, "otherTemplates": 7, "changedTemplates": [], "addedTemplates": [], "sectionTypesTouched": []}`; "Dry-run templat jenis dokumen selesai; transaksi di-rollback (0 tulis)" |
| F6 | `clash.py --pdf/--docx C:/tmp/s36r2/out/datum-laporan-en.* --no-convert` (commands of `C:/tmp/s36r2/score_all.sh`, output to scratch) | `clash: 0 clashes on 5 pages`, exit 0 |
| F7 | `score.ts --docx C:/tmp/s36r2/out/datum-laporan-en.docx --template datum-laporan-en --language EN --tier TERBIT --produced-by mcp --bfix ... --spec ... --clash <F6> --coverage ...` | `skor 94.2 % (65/69) | kritis 4/4 | cakupan 46.4 | bentrok 0`; failing rules `GF-13, RB-05, RH-03, SB-02`; 81 rule outcomes identical to the stored r2 JSON; scorer verdict FAIL only for `cakupan butir 46.4 % < 85 %` (exit 1) |
| F8 | `npx eslint <98 changed/new .ts/.mjs files>` | no output, EXIT=0 |
| F9 | `npx vitest run` on 12 AC-relevant test files, verbose | all passed, incl. S29 parity (14 tests), S27 guard red cases, S10 `latest`, S11 NDA, M1 classification pins |
| F10 | AC-6 text scan (`ac6.py`, w:t runs of document/header/footer XML) over 5 EN gate DOCX + 5 EN B-FIX DOCX; positive control on `datum-laporan.docx` (ID) | EN: 0 hits for all 21 ID strings; B-FIX EN: `1,250,000.5`, `1,385,946,000`, `IDR` x1. Control (ID) finds `Lembar Kendali`, `KLASIFIKASI`, `SALINAN INDUK`, `TERBITAN`, `Tanggal`, `Uraian`, `Oleh`, `LEMBAR`, `Penyusun`, `Rp`, ... (scanner is sensitive) |
| F11 | sha256 of the 20 r2 files in `C:/tmp/s36r2/out` + magic bytes | 10 DOCX start `PK\003\004`, 10 PDF start `%PDF-`; sha16 equal to the table in `verification/23` r2 section |
| F12 | Seed spec dump (`DOC_TYPE_TEMPLATE_SPECS`) vs `research/31:38-47` vs the 3 docs | equal on slug, name, language, code, tier, kicker for 10/10 (section 6) |
| F13 | Runbook: extract the 28 section-A blocks to scratch, sha check, `bash -n`, py compile, `node --check`; `gate_tests.sh` for `rb3_restore`, `step11_import`, `step10_gate`, `step8_swap` (env -i, scratch sandbox) | 28 blocks / 28 rows, 0 mismatches; all syntax checks pass; 4/4 `result=PASS` (10, 14, 8, 12 checks) |

## 3. Checks table

| Check | Result | Evidence |
|---|---|---|
| Intent alignment (AC-1..AC-11) | PASS-WITH-NOTES | Section 4; 4 recorded reinterpretations flagged |
| Syntax | PASS | F2 tsc 0, F8 eslint 0 |
| Logic | PASS | F1 4738/4738; F7 reproduces the DEV gate score exactly |
| Integration | PASS (DEV) | S35/S36 r2 MCP + R08 + R17 evidence, F11 hashes; F5 seed guard |
| Regression | PASS (uppercase classification inputs, D-610) | F3 8/8 SAME, F4 SAME; baseline inputs carry `"classification": "TERBATAS"` (4/4 files) |

## 4. Acceptance criteria

### AC-1 Seed flag `--doc-type-templates` | PASS

- Dry-run 0 writes: F5 ("transaksi di-rollback (0 tulis)").
- First run 10 created, re-run unchanged: `C:/tmp/s34/real.log` 10 x `"outcome":"created"`, `rerun.log` 10 x `unchanged`, both `"guard":{"ok":true` (counted with grep this session). After G-FIX 1 the spec changed: `real2.log` (20:42) 10 x `new-version`, `rerun2.log` 10 x `unchanged`. Fresh F5: 10 x `unchanged` at v2. Fresh-seed on `_uji`: `coder_execution_s26_s29.md:57` (`doc-type-templates created: OK`, `unchanged: OK`); not re-run here (would write `_uji`).
- Guard fails when another template or a section type changes: `tests/unit/studio/seed/s27-doc-type-seed.test.ts:105` (other template changes), `:118` (template added), `:128` (section type written), `:138` (AC-2 mismatch), all green in F9. Guard predicate: `prisma/seed-studio-templates.ts:411-421`.
- `ALLOWED_DATABASES` unchanged: HEAD `prisma/seed-studio.ts:124` = working tree `:150` (same 3 names).

### AC-2 New template rows | PASS

F5 reports `storedOk: true`, `storedIssues: []` for 10/10. `storedOk` is `storedIssues.length === 0` (`prisma/seed-studio-templates.ts:301`), and the issues cover `contractKind`, `archived`, `restricted`, `baseVersionId !== presetVersionId` (`:239-242`). F5 also prints `contractKind: null` and `baseVersionId` = `datum-gsp-preset` v2 directly. Unit test `s09-seed-template-helpers.test.ts:89` (AC-2 cases) green.

### AC-3 Seven old templates unchanged | PASS (DEV); clone/production deferred to S43/S50

`otherTemplatesBefore` in `C:/tmp/s34/dry.log` (20:07, before the first DEV seed) is identical to F5's (22:15) for all 7 rows (slug, latestVersionNo, versions, updatedAt, paramsSha256, skeletonSha256), compared programmatically: `identical = True 7 7`. Example: `datum-gsp 3 3 2026-10-30T03:09:22.217Z 21f4e1e7 396a4ad1`.

### AC-4 `latest` = `datum-gsp` | PASS-WITH-NOTE (DEV parts); rehearsal/production/Hermes deferred

- Code: `scripts/studio/mcp/write-client-run.ts:30` `export const DEFAULT_CLIENT_TEMPLATE_SLUG = "datum-gsp"`; `resolveTemplate` returns it for `"latest"` (`:33-35`); the old `updatedAt` sort is removed.
- Unit test: `implw2-client.test.ts:459-462` "templat datum-* klien yang lebih baru tidak menggeser latest: tetap datum-gsp", green (F9).
- DEV MCP smoke: `C:/tmp/s35/resp/_write_summary.json` target `latest` -> KT doc `073/GSP/KT/XI/2026` with warning `TEMPLATE_RESOLVED` (`datum_rev_a_dev_smoke.md`: `datum-gsp@3`).
- **Reinterpretation D-612 (flagged):** production writes no `latest` document; production `latest` is proven by `OLD_MCP=0` + `datum-gsp` present and active + the unit test of the constant (runbook summary item 3). Acceptable because `latest` is now a client constant independent of DB rows.
- Note (Low): `research/31:250` says a missing or archived `datum-gsp` returns `TEMPLATE_NOT_FOUND` from the client; the implementation no longer queries R01 and leaves existence to the server (R02). RB-1 never archives `datum-gsp`, so there is no functional impact.

### AC-5 One sample per template valid under R08 with its default type code, DOCX and PDF rendered | PASS (DEV)

S36 r2 (`verification/23` r2 facts): `studio_write` `isError:false`, `COMPLETE` 10/10; R08 valid (5 parts, 2 for NOTA); R17 `SUCCEEDED`, `failedFormats:[]`, server sha verified; typeCode/tier/language = template defaults 10/10. S35 shows the same on the how-to payload. Fresh F11: the 20 r2 files exist, are well-formed, and hash to the reported values. D-612 moves production per-template evidence to the rehearsal S44/S45.

### AC-6 EN renders free of ID wrapper text; register numbers 1,250,000.5 with IDR | PASS-WITH-NOTE

F10: 0 hits for Lembar Kendali, KLASIFIKASI, SALINAN INDUK, TERBITAN, Tanggal, Uraian, Oleh, Pemegang, LEMBAR, Penyusun, Rp (plus Tabel, Gambar, SUMBER, KUNCI, PROVENANS, MEMENUHI, Turunan, Daftar Isi, BAB) in the 5 EN gate DOCX and 5 EN B-FIX DOCX. EN equivalents are present (`Control Sheet` 2, `CLASSIFICATION` 3, `MASTER COPY` 3, `Prepared by` 4, `SHEET` 2, `Contents` 1 in `datum-laporan-en.docx`). B-FIX EN: `fx.decimal 1,250,000.5`, `fx.money IDR 1,385,946,000`.
Notes: (1) the classification value stays `TERBATAS` in EN documents (ANRI scheme unchanged, D-590); (2) chart-internal labels and alt text stay ID (D-596 Q-C, D-601(5)); the scan covers text runs only, not text inside chart images; (3) only one signature layer is in the gate payload, so "Reviewed by"/"Approved by" are not exercised in the renders; they exist in `src/lib/studio/engine/front/texts.ts:222-224`.

### AC-7 ID output byte-identical | PASS-WITH-NOTE (reinterpreted by D-610)

F3 8/8 SAME against the S05 baseline (tag `prod-v2.1-20261104`, `verification/19`); F4 SAME x3; clean-SVG manifest test and full studio suite green inside F1.
**Reinterpretation D-610 (flagged):** byte identity holds for uppercase classification input only. The baseline inputs all use `"TERBATAS"`. A mixed-case classification (including the registry default `Terbatas` when a document sends none) is now printed uppercase in every wrapper location, also when older ID documents are re-rendered; pinned by `tests/unit/studio/renderers/m1-classification-default-pins.test.ts` (green, F9). The runbook's read-only evidence records `StudioDocument 0` rows in production (`deploy/05` section 0), so no existing production document changes; DEV documents do (not verified per document here).

### AC-8 Conformance per pair (DEV) | PASS-WITH-NOTE (DEV); rehearsal S45 and production S52 deferred

- Measured score >= 85 % and 4/4 critical on 10/10 pairs: `verification/23` r2 table (94.0 % ID TERBIT/SERAH, 94.2 % EN, 90.9 % NOTA ID, 91.1 % NOTA EN). Fresh F7 reproduces `datum-laporan-en` exactly (94.2 %, 4/4, identical 81 outcomes).
- 0 text clashes on 10/10: `verification/23` r2 (`clash: 0 clashes on 5 pages`, 2 for NOTA); fresh F6 on `datum-laporan-en`.
- **Coverage >= 85 %: NOT MET.** 39.3-46.9 % on all 10 pairs (`verification/22` revision 2, F7 46.4 %). **Reinterpretation D-608 (flagged):** coverage is reported, not gated. See section 5, U2.
- **Reinterpretation D-607 (flagged):** gate payloads are written in the document's language (one ID payload, its EN translation); usage parity U3 is proven separately (AC-9).
- Note (Low): the per-template JSON/MD reports live in `C:/tmp/s36r2/score/` and `clash/`, outside the repo and the backup folder; `verification/23` holds the per-pair table only. AC-8 asks for per-template reports under `verification/`.
- Note (Low-Medium, see G-2): the r2 renders were produced at 21:52; the word-boundary change to `running-head-fit.ts` (`shortenAtWord`, file mtime 21:57, D-616) came after. It is covered by 16 unit tests and a pure-render clash check (`coder_execution_gfix_running_head.md:93-94`, 0 clashes ID/EN) and by the fresh F3 8/8 SAME, but not by a DEV R17 re-gate. The rehearsal gate S45 will measure it on the tagged code.

### AC-9 Usage parity | PASS-WITH-NOTE

- S29 test green (F9): one how-to JSON to `datum-gsp` and the 10 templates; "10 templat valid dengan isu, peringatan, dan temuan lint yang SAMA dengan pembandingnya"; "isi ... byte-identik; selisih snapshot hanya keluaran milik templat"; NOTA compared with `datum-gsp` + `meta.tier NOTA`; "meta yang dikirim agen tetap menang atas bawaan templat" (3 cases).
- MCP smoke: `C:/tmp/s35/resp/_payload_diff.json` `diffPaths: ["/docKey", "/template"]` with identical `contentSha cdc29394...` for all 12 calls; r2 the same within each language (`verification/23` r2).
- Note: `/docKey` also differs. This is unavoidable (one document per mission + docKey) and is not a behaviour selector.

### AC-10 Code review and security review | PASS-WITH-NOTE

- Code review S38 (`verification/24:15-19`): APPROVED WITH COMMENTS, 0 High, 3 Medium (M1 accepted as D-610, M2 and M3 fixed, D-611), "U4 production blocker check ... PASS, 0 blockers". My own grep of added lines in `src`, `scripts`, `prisma/seed-studio.ts` finds no new slug or type branch: the only slug literal is the named constant `DEFAULT_CLIENT_TEMPLATE_SLUG` (register disposition "pertahankan, alasan D-590"); contract slugs come from the registry (`write-client-run.ts:38`, `CONTRACT_KIND_DEFS`); `s27-doc-type-seed.test.ts:178` greps the seed sources for slugs (green).
- Security S39 (`verification/25`): code PASS; runbook CAUTION, fixed (not accepted) per D-591/D-614; re-review of runbook revision 2 (sha `87da5dea...`) PASS, 0 High, 0 Medium (`:141`).
- Note (Medium, G-1): runbook revision 3 (sha `5720b724...`, D-618) carries the R-L1..R-L4 and I-R fixes and has NOT been security re-reviewed. Its own header says so: `status: needs-review (re-review PASS on revision 2; the revision-3 changes need a check of the changed blocks ...)` (`deploy/05:10`). My F13 checks (sha table consistent, syntax, 4 gate tests PASS) reduce but do not replace that review.
- Note (Low): `verification/25:136` dates the re-review "about 22:30-23:30 WIB", but the file was last written at 22:08 and this session's clock read 22:21 at the time of checking. The timestamp in the evidence is wrong.

### AC-11 Doc slug tables = register; Hermes skill sha = repo | PASS-WITH-NOTE (tables); Hermes copy deferred to S53

- Tables equal the register and the seed spec, 10/10 rows (section 6).
- Note: the `STUDIO-HOWTO-DOCUMENT.md` diff is wider than "only the table and the latest sentence" (S30 check). It also changes the §2 meta guidance (`revision` = revision code, plus `revisionNote`), the §2 sample (ID headings, `classification: "TERBATAS"`, `author`, table `source`) and §3 item 6. This is recorded: D-605(3), D-607, `coder_execution_s30_s32.md:78`. `revisionNote` is not a new payload field: it is already in HEAD `scripts/studio/mcp/write-client.ts:24,44` and `write-meta.ts:158`. The new guidance reaches every agent through the Hermes `references/howto-document.md` copy at S53, including `datum-gsp` users.
- `SKILL.md` status line DRAF -> TERPASANG matches D-612 F-4.

## 5. U1-U4 traceability

| User requirement | Decision | Status | Evidence | Shortfall |
|---|---|---|---|---|
| U1 "target kecocokan dengan datum minimal 85%" | D-592 | **Met (DEV)** | `verification/23` r2: 90.9-94.2 % and 4/4 critical on 10/10; fresh F7 94.2 % 4/4 on `datum-laporan-en`; scorer calibrated, mutations lower the score (`verification/21`, D-604) | The 4 failing rules (RH-03, RB-05, SB-02, GF-13) are known engine deviations, left in place so ID output stays byte-identical (D-598 F-4, D-602, D-605(1)). Rehearsal (S45) and production (S52) still to run |
| U2 "kalau tidak bisa diukur, cek dengan point coverage dan tidak ada bentrok text" | D-593, reinterpreted by D-608 | **Partly met** | Point coverage was done and is reported per pair (`verification/22`, 39 points, 10 pairs, gap list and follow-up round in §9). 0 clashes on 10/10 (`verification/23` r2, fresh F6) | **Coverage is 39.3-46.9 %, below the controller's own 85 % floor (D-593) on every pair.** D-608 made coverage report-only. The user's words set no number, so U2 as worded is met (coverage checked, 0 clashes); the 85 % floor that D-593 set is not met, and the final report must not suggest otherwise. Why it is low (D-606, D-608, D-609): points that need agent content, registry parameters the code never reads, engine features that do not exist, and deviations kept to protect ID byte identity |
| U3 "metode penggunaannya gunakan cara global yang sama" | D-594 | **Met** | S29 parity test green (F9); S35 payload diff = `/template` (+ `/docKey`); doc tables add slugs only | Notes: `meta.tier` is now passed through by the MCP client (an existing DocMetaV2 field; D-600); the how-to meta guidance changed for all templates (AC-11 note); gate payloads in document language (D-607) |
| U4 "sweep code agar reuseable dengan berbagai template" | D-595 | **Met** | S38 0 U4 blockers (`verification/24:17`); `research/33` sweep (69 findings with disposition); one spec table `prisma/seed-doc-type-templates.ts` iterated by the shared `runGuardedTemplateTx` (`prisma/seed-studio-templates.ts:388`); one text table `src/lib/studio/engine/front/texts.ts`; my grep of added code (AC-10) | None found |

## 6. Doc slug tables vs register vs seed spec

Seed spec (F12, `DOC_TYPE_TEMPLATE_SPECS`) = `research/31:38-47` = `docs/STUDIO-HOWTO-DOCUMENT.md:44-53` = `docs/hermes-skills/gsp-studio-write/SKILL.md:47-51` = `docs/STUDIO-AGENT-GUIDE.md:195-204` (§3):

| Slug (ID / EN) | Code | Tier | Kicker ID / EN | Slots |
|---|---|---|---|---|
| datum-proposal-teknis / -en | PT | SERAH | PROPOSAL TEKNIS / TECHNICAL PROPOSAL | 7 |
| datum-laporan / -en | LAP | TERBIT | LAPORAN / REPORT | 7 |
| datum-laporan-verifikasi / -en | VER | TERBIT | LAPORAN VERIFIKASI / VERIFICATION REPORT | 7 |
| datum-standar / -en | STD | TERBIT | STANDAR / STANDARD | 8 (+ ruleIndex) |
| datum-nota / -en | NOT | NOTA | NOTA INTERNAL / INTERNAL NOTE | 7 |

All three docs state `latest` = `datum-gsp` (HOWTO:40, SKILL:43; AGENT-GUIDE keeps `datum-gsp` as the default example). `SKILL.md` has no kicker column, which is acceptable for a thin skill. The `doc.typeCode` list in every spec layer (F5) is `PT, KT, RAB, SPH, SP, BA, NDA, DEK, LAP, MAT, STD, NOT, MOD, VER`: NDA added, DS removed only in the new templates. The registry enum still holds DS and adds NDA at the end; the default is unchanged (`governance-language.ts:114-117`; `s11-doc-typecode-nda.test.ts` "daftar bawaan tidak berubah", "paramsSha256 kanonik tidak berubah", green).

## 7. D-590 scope, both directions

**In scope, delivered:**

| D-590 item | Evidence |
|---|---|
| Pin `latest` to datum-gsp | AC-4 |
| Control-sheet header, kicker, seal-band and issue-stamp text, "Prepared by" follow the language | F10 (Control Sheet, CLASSIFICATION, MASTER COPY, ISSUE, Prepared by present in EN, ID strings absent); `s13-wrapper-text-en.test.ts` green |
| English number format for EN, ID byte-identical | B-FIX EN `1,250,000.5`, `IDR 1,385,946,000` (F10); F3 8/8 SAME |
| NDA in the type-code enum | `governance-language.ts:117`, S11 test |
| DS retired only in the new templates | F5 layer list without DS; registry enum keeps DS |
| 10 data templates PT/LAP/VER/STD(+ruleIndex)/NOT, ID and `-en`, one per type per language, via a new seed flag modelled on `--contract-templates` | AC-1, AC-2, section 6 |
| Controller defaults: tier from manual text, EN signature roles, per-edition text | Tiers per `research/31` (D-598); roles `texts.ts:222-224` |

**Out of scope, not crept in.** Grep of added lines in `src`, `scripts`, `prisma` for `kop`, `marun`, `maroon`, `workbook`, `xlsx`, `pptx`, `chat`, `letter`, `surat`, classification-scheme terms: 0 hits. The only SPH/SP/RAB occurrence is the existing enum line. No chart module changed (`git status` shows no chart or SVG file), so EN chart labels are correctly not done (Q-C deferred). The classification scheme stays ANRI. The token audit was not done. Letters, RAB, workbook/deck/chat: no change.

**Recorded expansions beyond the blueprint rows (not on the D-590 exclusion list, each with a decision):** EN apparatus labels and Table/Figure captions in DOCX/HTML (D-597 D-2/D-3, D-598 F-2), MCP client front slots by tier (D-597 D-1), `meta.tier` passed through by the client (D-600), lint D01 EN fix (D-605(2)), uppercase classification in all wrapper locations (D-607, D-610), engine-wide running-head width fit (D-613, D-616). The last two change engine behaviour for every template; both keep the ID baseline at 8/8 SAME.

## 8. Runbook consistency with `deploy/04` lessons

Reviewed file: `deploy/05_datum_rev_a_rollout_plan.md`, **sha256 `5720b724186573ca591b411058c8961f5fb00b5d844c36bf620c077093eb8726`**, 1987 lines, mtime 22:17:08, unchanged at 22:25:36. **Section "R. Re-review fixes" is present** (`:1974`). The sha is recorded in D-618 (`decisions.md:624`), replacing the D-615 anchor, so `bk_open`/`step0_preflight` will accept it.

| `deploy/04` lesson | Runbook handling | Verdict |
|---|---|---|
| Production processes started out-of-app via WMI `spawn_out`, no `-File`, no execution-policy bypass (`04:104, 113-114, 194`) | Conventions "Out-of-app" (`05:61`); `spawn_out` allow-list (`:519`) | Consistent |
| AppData/HKCU edits from inside the app are virtualized (`04:75-79, 124`) | Launcher, Hermes config and skill edits run out-of-app; `realcheck.sh` reads the real view (`:1674, 1779, 1936`) | Consistent |
| MSYS `sed` turned CRLF into LF; grep backslash escape gave match=0 (`04:153`) | `launcher_edit_r2.py` byte-exact, sha-pinned, one exact anchor each, EOL kept; `--check` shows LF 129 and CRLF 177/177 kept (`:210, 334`) | Consistent |
| `gsp-datacenter/scripts/hq_restart.mjs` silently restarts old code on 9011 (`04:154`) | F-3: the warning comment is repointed to `gsp-hq-prod-v21-r2/scripts/hq_restart.mjs` (`:1682-1683`) | Consistent |
| Render readiness S-6 failed in the virtualized environment (`04:44, 75, 139`) | Rehearsal out-of-app; smoke checks `readiness.ready === true` (`:1288`) | Consistent |
| S-4 needed `?kind=sections` (`04:42`) | `smoke_http.mjs` uses `/api/studio/registry?kind=sections` (`:1281`) | Consistent |
| Production `.env` carries the production workspace (`04:31`, Q-10) | Temporary `STUDIO_WORKSPACE_ROOT` for rehearsal and every seed run (F-10, `:167, 307, 588`) | Consistent |
| Watchdog window and Monday restart (`deploy/01` §5) | `window_ok` refuses :55-:59 before and :00-:05 after each 3-hour mark, and Monday 04:00-05:59 (`steps.sh` in `:511-516`) | Consistent |
| 9041 standby = gsp-datacenter on the production DB (`04:147, 164`) | Old build on 9051 (Q-A); RB-3 stops 9011, 9051, 9041 and the bridge before the safety dump (R-L2), and `rb3_restart` brings 9041 back with `start-hq2.sh` | Consistent |
| `core.autocrlf=true` broke the S05 worktree (`verification/19` §1) | `git clone --no-hardlinks -c core.autocrlf=false` + check (`steps.sh` `:656-659`) | Consistent |
| `request error` log watch and verified PID before `taskkill` (`04:46, 155`) | `r2.log_no_request_error` (`:863`); `stop_listener` checks the command line before `taskkill` (`:468-472`) | Consistent |

Observations: the runbook never cites `deploy/04` by path (0 matches), but each lesson is applied. `rb3_restart` calls the full `gsp-ecosystem-start.sh`; that launcher is idempotent (`already_up` checks on 9010, 9012, 9011, bridge and gateways, `gsp-ecosystem-start.sh:22-25, 58-117`).

## 9. Issues found

**High:** none.

**Medium**
- **G-1** Runbook revision 3 (sha `5720b724...`) has not been security re-reviewed; the runbook's own status line asks for a check of the changed blocks (`deploy/05:10`). Only revision 2 (`87da5dea...`) was re-reviewed (`verification/25` §9). Precondition before runbook step 0.

**Low**
- **G-2** The DEV conformance gate (r2, renders at 21:52) predates the `shortenAtWord` change (21:57). Covered by unit tests, a pure-render clash check and F3, but no DEV R17 re-gate. S45 must be treated as the gate that measures it.
- **G-3** Per-template score and clash reports exist only under `C:/tmp/s36r2/` (not durable, outside the task folder). AC-8 asks for per-template reports under `verification/`.
- **G-4** `implementation/datum_rev_a_dev_seed.md` records only the v1 seed (`real.log`, `rerun.log`). The v2 reseed after G-FIX 1 (`C:/tmp/s34/real2.log` new-version x10, `rerun2.log` unchanged x10, 20:42) is undocumented. DEV now holds v2.
- **G-5** `verification/25:136` gives an impossible re-review time window (22:30-23:30 WIB against a 22:08 file mtime).
- **G-6** `research/31:250` (client `TEMPLATE_NOT_FOUND` when `datum-gsp` is missing) no longer matches the implementation (server-side check). No functional impact.
- **G-7** The how-to diff goes beyond the S30 check ("table and latest sentence only"); the meta revision guidance changed for all templates (recorded in D-605(3)/D-607; no new payload field).

**Known shortfall, reported plainly (not an issue under D-608):** point coverage 39.3-46.9 % against the D-593 floor of 85 % on all 10 pairs.

## 10. Remediation notes (proposed new rows; nothing was fixed here)

| Proposed row | Agent | Task | Verification | Blocks |
|---|---|---|---|---|
| S40a | security-review | Delta re-review of runbook revision 3 (sha `5720b724...`): the changed blocks (`env.sh`, `steps.sh`, `procs_studio.sh` and the others listed in section R) and the new `oa_run`, `anchor_is`, `bk_open`, `rb3_restore` order | Verdict PASS/CAUTION with block shas; on any edit, a new sha recorded in `decisions.md` | Runbook step 0 (S41 onward) |
| S40b | controller (decision) | Record that S45 is the gate that measures the word-boundary running-head change, or re-run the DEV gate as r3 on the final tree | Decision line, or `verification/23` r3 with 0 clashes on 10/10 | none (S45 already blocks the import) |
| S40c | coder-execution (sonnet) | Copy `C:/tmp/s36r2/{score,clash}/*` and `spec.json` into `verification/coverage/` or `gsp-backups`, with sha256 | Files exist, sha equal to the source | none |
| S40d | controller | Add the v2 reseed (real2/rerun2) to `datum_rev_a_dev_seed.md` | Row present, citing the logs | none |
| S40e | controller | Correct the re-review timestamp in `verification/25` §9 and the `research/31:250` note | Text corrected | none |
| Follow-up round | task-architect | Engine round for coverage (already proposed in D-608, D-609): control-sheet columns and verification chain, 150 mm title, control-sheet subtitle, seal logo, bilingual pairs, EN spelled-out amounts, Rev A preset (GF-08) | Coverage re-measured per pair | not this release |

## 11. Verdict per AC and go/no-go

| AC | Verdict |
|---|---|
| AC-1 | PASS |
| AC-2 | PASS |
| AC-3 | PASS (DEV); clone/production deferred |
| AC-4 | PASS-WITH-NOTE (D-612); rehearsal/production/Hermes deferred |
| AC-5 | PASS (DEV) |
| AC-6 | PASS-WITH-NOTE |
| AC-7 | PASS-WITH-NOTE (D-610) |
| AC-8 | PASS-WITH-NOTE (DEV): score and clash pass; coverage NOT met, report-only per D-608; D-607 payloads |
| AC-9 | PASS-WITH-NOTE |
| AC-10 | PASS-WITH-NOTE (G-1) |
| AC-11 | PASS-WITH-NOTE (tables); Hermes copy deferred to S53 |

**Overall: GO for G1 and S41-S46, conditional on S40a (G-1) before runbook step 0.** Reasons: every in-scope criterion holds on fresh evidence (suite 4738/4738, tsc and eslint clean, ID baseline 8/8 SAME, convert_v2 SAME, seed dry-run guard ok with 10 unchanged and 7 old templates byte-for-byte unchanged, DEV gate reproduced). Scope matches D-590 in both directions. The runbook applies every `deploy/04` lesson and passes its own gate tests. Production data changes stay behind the S45 rehearsal gate and `OLD_MCP=0` (currently 6, so steps 10-11 will wait). Coverage below the controller's 85 % floor is a known, recorded shortfall. It does not block under D-608, but it must be stated plainly to the USER.
