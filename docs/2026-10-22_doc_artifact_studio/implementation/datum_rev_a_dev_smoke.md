---
task_id: 2026-10-22_doc_artifact_studio
task_slug: doc_artifact_studio
row: S35
date: 2026-11-04
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/02_structured_datum_rev_a.md
status: complete
---

# Implementation Report: S35 - DEV render dan smoke MCP (DATUM Rev A)

DEV only: `http://localhost:9021` (`next dev`, DB `gsp_agent_hq_v21`). Port 9011, DB `gsp_agent_hq`, and `C:/Users/TRIAL/gsp-hq-prod-v21` were not touched. No code was changed and nothing was committed. The secret was read from a file into the environment and never printed. A grep of every artifact under `C:/tmp/s35` for the secret value found 0 hits.

## Ringkasan

| Gate (AC S35) | Result |
|---|---|
| 10 documents valid under R08, carrying the default type code, and rendered | PASS: 10/10 written via MCP `studio_write`, COMPLETE, R08 valid (5 parts each; 2 for NOTA), DOCX and PDF rendered with server-verified sha256. typeCode, tier, and language match the template spec for all 10 |
| Payloads differ only in `template` | PASS: `meta` and `sections` are byte-identical across all 12 calls (sha256 `cdc2939427f98d77...`). The only differing leaves are `/template` and the addressing key `/docKey` (see below) |
| `latest` = datum-gsp | PASS: resolved to `datum-gsp@3` (warning `TEMPLATE_RESOLVED`), KT/TERBIT/ID, same as the datum-gsp comparator |
| Template count | 17 (R01 via `studio_templates_list includePresets:true`; default view shows 14 and hides 3 presets) |
| B-FIX (D-604) | PASS: 10/10 fixtures. R08 valid, rendered DOCX contains all 4 expected strings for its language, 0 strings from the other language's convention, 0 forbidden-currency hits |
| Spec JSON | `C:/tmp/s35/spec.json` (`datum-template-spec/v1`, 10 templates) |

## Commands (no secrets)

Run from `C:/Users/TRIAL/gsp-swarm-hq-v2.1` in Git Bash. The driver script lives outside the repo at `C:/tmp/s35/driver.ts`. It spawns the real MCP server `scripts/studio/mcp/server.ts` over stdio, using the official SDK client the same way `scripts/studio/mcp/smoke-write.ts` does, with env `STUDIO_BASE_URL=http://localhost:9021`, `STUDIO_AGENT_ID=hermes-datum-smoke`, `STUDIO_MCP_TOOLSETS=write` (and `documents` only for the template list), and `STUDIO_MCP_FILE_ROOTS=C:/tmp/s35`. The driver refuses to run if `STUDIO_BASE_URL` is anything other than DEV 9021.

```bash
export INTERNAL_API_SECRET="$(tr -d '\r\n' < C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/trial_internal_secret)"
npx tsx C:/tmp/s35/driver.ts spec     # docTypeTemplateSpecJson() -> C:/tmp/s35/spec.json
npx tsx C:/tmp/s35/driver.ts write    # 12x MCP studio_write (10 slugs + datum-gsp + latest)
npx tsx C:/tmp/s35/driver.ts list     # tools/list (write) + studio_templates_list (documents toolset)
npx tsx C:/tmp/s35/driver.ts render   # per doc: R20 content, R08 per stored part, R15, R17 {docx,pdf}, R10 GET + HEAD ?verify=1
node C:/tmp/s35/r08full.mjs           # R08 full-document dry-run (studio.doc/v2, fresh docKey, 0 writes) -> lint per doc
node C:/tmp/s35/diff.mjs              # payload diff of the 12 request JSONs
npx tsx C:/tmp/s35/driver.ts bfix     # B-FIX: studio_write shell + R08 dry-run chapter with register + R12 + R17 docx + R10
node C:/tmp/s35/r08full_bfix.mjs      # R08 full-document dry-run of the B-FIX docs (with register)
python -I C:/tmp/s35/bfix_check.py    # expected strings in the B-FIX DOCX text
```

Raw evidence: `C:/tmp/s35/req/*.json` (requests), `C:/tmp/s35/resp/*.json` (MCP responses, `_write_summary.json`, `_render_summary.json`, `_r08_full.json`, `_payload_diff.json`, `_templates_list.json`, `_bfix_summary.json`, `_r08_full_bfix.json`, `_bfix_text_check.json`), `C:/tmp/s35/log/*.log`.

## Payload (U3, D-594 / D-598 F-8)

The payload was built exactly as `tests/unit/studio/compose/s29-usage-parity.test.ts` `howtoSample()` + `completedSample()` builds it: the first ```json block of `docs/STUDIO-HOWTO-DOCUMENT.md` §2, with `meta.number` deleted, `meta.author = "Tim Kajian"`, and table `source = "Register ancaman proyek"` where missing. Only `meta` and `sections` were taken; the sample's own `mission`/`docKey`/`template` placeholders were dropped, as in the test. The §2 JSON block read at run time has sha256 `5aaefe86b7373ce76b890b886adef6ae0f905b560e728d543ad5751791c54c99`. In that working-tree version, `author` and `source` are already in the sample, so the completion steps changed nothing. The sample keeps its placeholders (`title "<judul>"`, `date "<tanggal>"`, `"<paragraf>"`), so every call returned the same client warnings: `DATE_DEFAULTED`, `REV_DISPLAY_ONLY`, `REV_SPLIT`.

### Payload diff evidence

`node C:/tmp/s35/diff.mjs` compares the leaf paths of each request JSON against `req/datum-gsp.json`:

| Request | Differing leaf paths vs datum-gsp | sha256(meta+sections+mission) |
|---|---|---|
| 10 template slugs | `/docKey`, `/template` | `cdc2939427f98d77...` (all identical) |
| latest | `/docKey`, `/template` | `cdc2939427f98d77...` |
| datum-gsp | none | `cdc2939427f98d77...` |

`git diff --no-index req/datum-gsp.json req/datum-laporan-en.json` shows 2 changed lines: `"docKey": "smoke-datum-gsp"` -> `"smoke-datum-laporan-en"` and `"template": "datum-gsp"` -> `"datum-laporan-en"`. The `docKey` difference is unavoidable: the mission is fixed, and one document is addressed by mission + docKey. Reusing a docKey would rewrite the first document, and the template would then be ignored for that existing document. Content (`meta`, `sections`) and `mission` are identical, so the only difference that selects behaviour is the template slug.

## Per-template results

R08 validity: every stored part (cover/controlSheet/signature slots and every chapter) was POSTed to R08 against the document at its stored revision. All returned `valid:true` with 0 issues and `completenessPreview COMPLETE`. NOTA has only the content chapters, because the front slots are omitted by tier (`FRONT_SLOTS_OMITTED`). R08 lint for an unchanged part is `null`, so lint was also captured with an R08 full-document dry-run (`studio.doc/v2` with a fresh docKey; no write). That dry-run was `valid:true` with 0 issues for all 12. Its non-blocking lint findings are in the next table.

| Template | Doc id | Doc number | typeCode | Tier | Lang | Tpl ver | Rev | R08 valid (parts) | studio_write warnings | DOCX (bytes) | PDF (bytes) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| datum-proposal-teknis | cmw25235q12t4v188a353mk5q | 001/GSP/PT/XI/2026 | PT | SERAH | ID | 1 | 7 | true (5) | DATE_DEFAULTED, REV_DISPLAY_ONLY, REV_SPLIT | out/datum-proposal-teknis.docx (487355) | out/datum-proposal-teknis.pdf (110596) |
| datum-proposal-teknis-en | cmw2528m812u6v1888rdrr8nq | 002/GSP/PT/XI/2026 | PT | SERAH | EN | 1 | 7 | true (5) | same 3 | out/datum-proposal-teknis-en.docx (487331) | out/datum-proposal-teknis-en.pdf (110382) |
| datum-laporan | cmw252bpt12v8v1886gi5wbn0 | 152/GSP/LAP/XI/2026 | LAP | TERBIT | ID | 1 | 7 | true (5) | same 3 | out/datum-laporan.docx (487353) | out/datum-laporan.pdf (110573) |
| datum-laporan-en | cmw252dqx12wav188ej44xury | 153/GSP/LAP/XI/2026 | LAP | TERBIT | EN | 1 | 7 | true (5) | same 3 | out/datum-laporan-en.docx (487331) | out/datum-laporan-en.pdf (110668) |
| datum-laporan-verifikasi | cmw252fqw12xcv1885v5be70a | 001/GSP/VER/XI/2026 | VER | TERBIT | ID | 1 | 7 | true (5) | same 3 | out/datum-laporan-verifikasi.docx (487358) | out/datum-laporan-verifikasi.pdf (110626) |
| datum-laporan-verifikasi-en | cmw252heq12yev1888zh5di9p | 002/GSP/VER/XI/2026 | VER | TERBIT | EN | 1 | 7 | true (5) | same 3 | out/datum-laporan-verifikasi-en.docx (487336) | out/datum-laporan-verifikasi-en.pdf (110478) |
| datum-standar | cmw252j2c12zgv188xvzwgss0 | 003/GSP/STD/XI/2026 | STD | TERBIT | ID | 1 | 7 | true (5) | same 3 | out/datum-standar.docx (487356) | out/datum-standar.pdf (110777) |
| datum-standar-en | cmw252kw1130iv188ndyyptny | 004/GSP/STD/XI/2026 | STD | TERBIT | EN | 1 | 7 | true (5) | same 3 | out/datum-standar-en.docx (487328) | out/datum-standar-en.pdf (110488) |
| datum-nota | cmw252mk0131kv188kdxo3ehi | 001/GSP/NOT/XI/2026 | NOT | NOTA | ID | 1 | 4 | true (2) | same 3 + FRONT_SLOTS_OMITTED | out/datum-nota.docx (443432) | out/datum-nota.pdf (41667) |
| datum-nota-en | cmw252o7t1327v188yh5ze760 | 002/GSP/NOT/XI/2026 | NOT | NOTA | EN | 1 | 4 | true (2) | same 3 + FRONT_SLOTS_OMITTED | out/datum-nota-en.docx (443432) | out/datum-nota-en.pdf (41549) |
| datum-gsp (comparator) | cmw252px3132uv188nq4prmun | 072/GSP/KT/XI/2026 | KT | TERBIT | ID | 3 | 7 | true (5) | same 3 | out/datum-gsp.docx (487301) | out/datum-gsp.pdf (113815) |
| latest | cmw252rtb133wv188zriu4xek | 073/GSP/KT/XI/2026 | KT | TERBIT | ID | datum-gsp@3 | 7 | true (5) | same 3 + TEMPLATE_RESOLVED | out/latest.docx (487301) | out/latest.pdf (114061) |

All paths are under `C:/tmp/s35/`. For all 24 files: R17 returned 200 with render status `SUCCEEDED`, `partial:false`, and `failedFormats: []`. The R10 `HEAD ?verify=1` header `x-studio-sha256-verified` was `true`, and the sha256 recomputed from the download equals the server sha256. All DOCX are valid zip files (`testzip` clean, 22/22 including B-FIX), and all PDFs start with `%PDF-`. The PDFs came from LibreOffice 24.2.3.2 (R11 readiness `ready:true`). `datum-nota.docx` and `datum-nota-en.docx` have the same size but different content (sha256 `e9f0ee9d...` and `5b4e5381...`).

Type code = template default: each document's typeCode, tier, and language (read from R20 `content.meta`) match `doc.defaultTypeCode`, `doc.defaultTier`, and `doc.language` in `spec.json` for all 10: MATCH x10. The cover kicker from the spec (`cover.kicker.text`) appears in `word/document.xml` for the 8 non-NOTA documents. NOTA has no cover, because its front slots are omitted by tier (expected; s29 test "NOTA: slot depan tidak dikirim").

### R08 full-document lint (non-blocking; parity with comparator)

| Group | releaseStatus | Non-PASS checks |
|---|---|---|
| datum-gsp, latest (comparator) | FAIL | C-INFO-OPENER:REPORT, D11:REPORT, D12:REPORT, D16:FAIL (TERBIT `issueStampColophon`), D17:FAIL, D18:FAIL |
| laporan, laporan-verifikasi, standar (ID+EN) | FAIL | identical to comparator |
| proposal-teknis (ID+EN, SERAH) | FAIL | comparator set, plus D16 for tier SERAH: `registerTable`, `derivation`, `evidenceRail`, preset `reconciliation` (R-S29-1, recorded risk) |
| nota (ID+EN) | PASS | C-INFO-OPENER:REPORT only |

No D01 finding appears on any EN document, including the D01 "1.1" false positive in R-S29-2, which D-605(2) fixed. These findings come from the sample content: no identity or closing-action paragraph, and no TERBIT colophon section. They are not template defects. The by-construction gate did not block any write, and all documents rendered.

## Template list

- The `write` toolset exposes 6 tools: `studio_contracts_query`, `studio_search`, `studio_document_get`, `studio_file_verify`, `studio_write`, `studio_edit`. None of them lists templates (`studio_contracts_query` is the contract registry).
- `studio_templates_list` is in the `documents` toolset, so a second server process was run with `STUDIO_MCP_TOOLSETS=documents`, read-only. `includePresets:true` returned **17** templates. The default view returned 14, with 3 presets hidden (`datum-gsp-preset`, `datum-kanonik-preset`, `datum-manual-000-preset`). A direct R01 `GET /api/studio/templates?kind=DOCUMENT` also returned 17.

## B-FIX fixtures (D-604, research/32 §10)

Mission `2026-11-04_datum-rev-a-dev-bfix`, docKey `bfix-<slug>`. A separate mission keeps the fixtures apart from the U3 usage docs. Steps for each template:

1. MCP `studio_write` shell through the same template. It has one short chapter with no numerals, and `meta {title, author}`.
2. Chapter 1 from R20 gets one `derivation` block appended. This uses the existing register-binding mechanism; no new payload field was added. The chapter goes to R08 as `studio.chapter/v2` with `register`, then to R12, then R17 renders DOCX, which is downloaded via R10.

Register:

| Key | v | dec | unit | mark | Printed label |
|---|---|---|---|---|---|
| fx_decimal | 1250000.5 | 1 | `-` | TERUKUR | fx.decimal |
| fx_money | 1385946000 | 0 | `Rp` | TERUKUR | fx.money |
| fx_pct | 25 | 0 | `%` | ASUMSI | fx.pct |
| fx_small | 0.5 | 1 | `-` | TERUKUR | fx.small (result row, expr `fx_small`) |

Example rendered text (datum-laporan-en): `fx.decimal 1,250,000.5 - ■ fx.money IDR 1,385,946,000 ■ fx.pct 25 % △ fx.small 0.5 - ■`.

| Template | Lang | Doc id | Doc number | typeCode/tier | R08 chapter valid | R08 full doc valid | Expected 4 strings present | Other-language forms | Forbidden currency | DOCX (bytes) |
|---|---|---|---|---|---|---|---|---|---|---|
| datum-proposal-teknis | ID | cmw257imt1382v1880rl4k0uv | 003/GSP/PT/XI/2026 | PT/SERAH | true | true | 4/4 | 0 | 0 | bfix/datum-proposal-teknis.docx (1944145) |
| datum-proposal-teknis-en | EN | cmw257jod138yv188gnlobz64 | 004/GSP/PT/XI/2026 | PT/SERAH | true | true | 4/4 | 0 | 0 | bfix/datum-proposal-teknis-en.docx (1944144) |
| datum-laporan | ID | cmw25626i136yv188treo65jb | 154/GSP/LAP/XI/2026 | LAP/TERBIT | true | true | 4/4 | 0 | 0 | bfix/datum-laporan.docx (1944140) |
| datum-laporan-en | EN | cmw257klb139uv1887hu7ub3h | 155/GSP/LAP/XI/2026 | LAP/TERBIT | true | true | 4/4 | 0 | 0 | bfix/datum-laporan-en.docx (1944140) |
| datum-laporan-verifikasi | ID | cmw257lkl13aqv188zw9or160 | 003/GSP/VER/XI/2026 | VER/TERBIT | true | true | 4/4 | 0 | 0 | bfix/datum-laporan-verifikasi.docx (1944146) |
| datum-laporan-verifikasi-en | EN | cmw257mjo13bmv188czuo5yr9 | 004/GSP/VER/XI/2026 | VER/TERBIT | true | true | 4/4 | 0 | 0 | bfix/datum-laporan-verifikasi-en.docx (1944146) |
| datum-standar | ID | cmw257nhi13civ188b5ipehmt | 005/GSP/STD/XI/2026 | STD/TERBIT | true | true | 4/4 | 0 | 0 | bfix/datum-standar.docx (1944141) |
| datum-standar-en | EN | cmw257ofw13dev1883m78ma9x | 006/GSP/STD/XI/2026 | STD/TERBIT | true | true | 4/4 | 0 | 0 | bfix/datum-standar-en.docx (1944136) |
| datum-nota | ID | cmw257pgr13eav1882wfjusbd | 003/GSP/NOT/XI/2026 | NOT/NOTA | true | true | 4/4 | 0 | 0 | bfix/datum-nota.docx (1900325) |
| datum-nota-en | EN | cmw257q4t13etv188c6tjdi3w | 004/GSP/NOT/XI/2026 | NOT/NOTA | true | true | 4/4 | 0 | 0 | bfix/datum-nota-en.docx (1900347) |

Notes:

- Expected strings follow research/32 §10. ID: `1.250.000,5`, `Rp 1.385.946.000`, `25 %`, `0,5`. EN: `1,250,000.5`, `IDR 1,385,946,000`, `25 %`, `0.5`. They were checked as whole tokens with the same regex as `hasNumberToken` in `benchmark/datum_conformance/rules/language.ts:529`, across document, header, and footer text.
- The R08 full-document lint of the fixtures shows no D01 or D03 finding. It does show C-26c and C-27 (sentence-metric diagnostics on the one-sentence fixture paragraph), plus the same D16/D17/D18 as the smoke docs (non-NOTA). These are expected for a fixture.
- The B-FIX DOCX are about 1.9 MB because the derivation block embeds two mono font files (`word/fonts/font13.odttf`, `font14.odttf`, about 0.7 MB each).
- Each `C:/tmp/s35/bfix/<slug>.chapter.json` holds the exact R12/R08 body, and `<slug>.shell.json` holds the shell `studio_write` arguments.

## Spec JSON

`npx tsx C:/tmp/s35/driver.ts spec` wrote `C:/tmp/s35/spec.json` (4995 B) from `docTypeTemplateSpecJson()` in `prisma/seed-doc-type-templates.ts:158`: schema `datum-template-spec/v1`, 10 templates, each with `doc.typeCode`, `doc.defaultTypeCode`, `doc.defaultTier`, `doc.language`, and `cover.kicker.text`.

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | MCP smoke, slug-only change (12 studio_write) | complete | 12/12 created, COMPLETE, DOCX rendered |
| 2 | Template list | complete | 17 with presets |
| 3 | Render DOCX+PDF, R08, type code | complete | 24 files, all sha-verified; 12/12 R08 valid; typeCode MATCH x10 |
| 4 | B-FIX fixtures | complete | 10/10; 4/4 strings each |
| 5 | Spec JSON | complete | 10 templates |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| docs/2026-10-22_doc_artifact_studio/implementation/datum_rev_a_dev_smoke.md | add | This report |
| C:/tmp/s35/** (outside repo) | add | Driver scripts, requests, responses, 24 rendered files, 10 B-FIX DOCX, spec.json |
| DEV DB gsp_agent_hq_v21 | data | 12 documents in mission `2026-11-04_datum-rev-a-dev-smoke` + 10 fixture documents in `2026-11-04_datum-rev-a-dev-bfix` (S35 = sole DEV DB writer this wave) |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| MCP smoke | `npx tsx C:/tmp/s35/driver.ts write` | 12/12 ok | isError false, state `dibuat`, COMPLETE |
| Render | `npx tsx C:/tmp/s35/driver.ts render` | 12/12 render 200 SUCCEEDED | 24 files, sha verified |
| R08 | per-part + full-doc dry-run | 12/12 valid, 0 issues | lint non-blocking, parity with comparator |
| B-FIX | `driver.ts bfix` + `bfix_check.py` | 10/10 allPresent | 0 other-language forms |
| Build/lint/typecheck | n/a | not run | No code changed in the repo (docs-only row) |

## Verification
- U3: payload diff shows only `/template` (+ addressing `/docKey`), and content sha is identical for all 12.
- 10 documents: R08 valid, typeCode equals the template default, rendered as DOCX and PDF (see table).
- latest -> `datum-gsp@3`, `TEMPLATE_RESOLVED`.
- Template count: 17.
- B-FIX: 10 DOCX contain the 4 expected strings for their language.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| none | - | - | - | - |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 1 | The write toolset has no template-list tool | Used `studio_templates_list` from the read-only `documents` toolset in a second server process; also cross-checked with R01 |
| 1 | `docKey` must differ per document within one mission | Payload diff is reported as `/template` + `/docKey`; content and mission identical |
| 4 | Derivation expressions reject dotted names (`arith.ts:37` identifier rule), and D03 requires at least one `result()` row | Register keys `fx_decimal`, `fx_money`, `fx_pct`, `fx_small`; printed labels keep the §10 names; `fx.small` is the result row with identity expr `fx_small` |
| 4 | Units for dimensionless entries | `-` (register requires a non-empty unit); prints as `1.250.000,5 -`, which still satisfies the whole-token check |
| 4 | Fixture mission | Separate mission `2026-11-04_datum-rev-a-dev-bfix` so fixtures are not mixed with U3 usage docs |
| 1 | Sample placeholders (`<judul>`, `<tanggal>`) are kept as constructed by the s29 test | Same warnings on all 12 calls (`DATE_DEFAULTED`, `REV_*`); not a template difference |

## Next Steps
- S36 can run the conformance gate per pair with `--docx C:/tmp/s35/out/<slug>.docx --bfix C:/tmp/s35/bfix/<slug>.docx --spec C:/tmp/s35/spec.json`.
