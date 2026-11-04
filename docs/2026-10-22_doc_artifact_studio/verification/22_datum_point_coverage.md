---
type: data
confidence: high for LB-07, LB-08, GF-17 and the evidence re-anchoring (code read in this session, file:line); medium for GF-08 and CV-19 (preset values inferred from the seed pinning code, the Manual 000 profile and the stored datum-gsp v1 baseline; the DEV `datum-gsp-preset` row was not read from the DB) and for CV-21 (asset manifest)
subject: Point-coverage matrix for DATUM Rev A coverage-only points (U2, D-593), 10 templates x language
author_agent: data-analyst
date: 2026-11-04
revision: 2 (after G-FIX 1; revision 1 = S33 original)
status: complete (read-only on code, DB and controller files; only this file and `coverage/datum_point_coverage.json` written)
blueprint_row: S33 (`identification/02_structured_datum_rev_a.md:149`), re-score after G-FIX 1 (D-606, D-608)
depends_on: S02 (`research/32_datum_conformance_rules.md` §14), S26 (`prisma/seed-doc-type-templates.ts`), S19 (phase 0 code), G-FIX 1 (`delegation_progress/coder_execution_gfix1.md`; DEV templates at version 2)
binding: D-590, D-593 (U2), D-594, D-596 Q-C, D-598 F-3, D-601, D-602, D-604, D-605, D-606, D-607, D-608
consumers: S36, S45, S52 (`--coverage verification/coverage/datum_point_coverage.json`); per D-608 coverage is reported as-is, not a release gate
verdict: all 10 pairs BELOW 85 % (39.2 % to 46.8 %); D-608 already decided coverage is reported with its gap list and not claimed to meet 85 %; follow-up engine round in §9
---

# DATUM Rev A point-coverage matrix (S33, revision 2)

## Revision 2 (after G-FIX 1)

**Why this revision exists:** G-FIX 1 (D-606) changed `src/lib/studio/engine/front/texts.ts` and `prisma/seed-doc-type-templates.ts`, and DEV now holds version 2 of the 10 templates. The fix report also showed that assumption A2 of revision 1 was false: the `datum-gsp-preset` profile does not keep registry defaults. I re-judged all 39 rows against the current code and data with the same strict rule as before. I also applied the A2 correction to every point, not only to the two keys the fix report named. That turned up one downgrade (GF-08).

**Changed cells (29 cells, 4 points):**

| Point | Cells | Old -> new | Cause | Evidence |
|---|---|---|---|---|
| LB-08 | PT-en, LAP-en, VER-en, STD-en, NOT-en (5) | N -> **C** | G-FIX 1 (a): the EN appendix word is now "Annex" in the single text table. Every print site goes through that table: the opener kicker (caps role, so `ANNEX A`), the TOC and part-divider label, the DOCX running head, and HTML | `src/lib/studio/engine/front/texts.ts:82-83` (`appendix: { ID: "Lampiran", EN: "Annex" }`), `texts.ts:153-155, 166-169, 185-198`; DOCX `src/lib/studio/engine/docx/wrapper/pages.ts:143, 593`, `src/lib/studio/engine/docx/package/header-footer.ts:98`; HTML `src/lib/studio/engine/html/blocks/wrapper.ts:420`, `html/blocks/text.ts:333-335`. No other "Appendix" literal is left in `src/lib/studio` (grep; only a stale comment at `html/blocks/text.ts:326`). Scorer LB-03 accepts ANNEX (`benchmark/datum_conformance/rules/expect_language.ts:168-169`) |
| LB-07 | PT-en, LAP-en, VER-en, STD-en (4) | P -> **C** | G-FIX 1 (b): for an EN document in an EN wrapper, BAHASA prints "English (UK)" | `texts.ts:233-240` (`LANGUAGE_VALUE_TEXT.EN.EN = "English (UK)"`), used at `texts.ts:256`. Boundary: see the LB-07 row (the explicit MCP cover block has no BAHASA field) |
| GF-17 | all 10 | P -> **C** | **A2 correction, not an output change.** The preset already sets `table.zebra.minRows` 1000 (`benchmark/manual000/template.json:882`, inherited because the GSP preset pins every baseline key that differs from the registry, `prisma/seed-studio.ts:33-45`). G-FIX 1 (d) copied the same value into the shared spec layer. Zebra therefore never turns on for tables of 1000 body rows or fewer, and tints stay 15/30 | `prisma/seed-doc-type-templates.ts:44`; readers `src/lib/studio/engine/docx/tables/render.ts:495-497`, `src/lib/studio/engine/html/tables/table.ts:334`; fix report "Correction" and Finding 1 |
| GF-08 | all 10 | C -> **P** | **A2 correction found in this revision.** Table 8.2 values live in the registry, but the scale sizes are class B with the reference pinned by the preset (`src/lib/studio/params/color-type.ts:13`). `datum-gsp-preset` pins the Manual 000 measured values: numerals 7 pt (manual 7.8), header 6.5 pt +0.0923 em (manual 6.8 pt +0.09 em), caption 7.5/11 (manual 7.6/11). Faces, weights, colours, caps, tabular figures and the caption leading match. The spec layer does not override them | `benchmark/manual000/template.json:845-849`; stored datum-gsp v1 baseline `docs/.../test/sr36_baseline_datum_gsp_v1.json:1165, 1666, 1972`; pinning `prisma/seed-studio.ts:33-45, 553-576`; "sama" (pinned unchanged) `research/09_param_surface_design.md:448-450`; spec layer `prisma/seed-doc-type-templates.ts:40-45`; DOCX reads the param `engine/docx/tables/render.ts:188` |

**Evidence changed, cell unchanged:**
- **GF-24 (P stays).** The reason is different now. `layout.railMode` is `A` both in the preset (`template.json:816`) and in the spec layer (`seed-doc-type-templates.ts:43`), so the "auto falls back to B" reason no longer applies. It stays P because the GSP preset uses the `framePr` renderer (`prisma/seed-studio.ts:560`), and with that renderer rail space is per paragraph (K2 rev B, D-342, `src/lib/studio/engine/docx/blocks/rail.ts:14-21`). The DOCX/PDF never reserves an empty 32 mm rail. The fix report measured the DOCX sha as equal for `auto` and `A`.
- **CV-19 (P stays).** The preset sets `device.spine.placements = ["margin luar sampul"]` (`template.json:863-865`, pinned like the keys above). For these templates the spine string therefore appears on the cover margin only, not on dividers (`pages.ts:118-119, 559-560`), and there is still no back cover.
- **CL-02 (P/N stay).** G-FIX 1 (g) upper-cases the classification value in the explicit cover pair (`src/lib/studio/services/compose/front.ts:78`). The "Klasifikasi:" line itself is still produced only when the agent sends `number` and `classification`.
- **Line re-anchoring.** References into the files G-FIX 1 modified were re-read and updated: `texts.ts`, `compose/front.ts`, `seed-doc-type-templates.ts`. References into unmodified files are carried over from revision 1.

**Display correction:** revision 1 printed four percentages rounded up (e.g. 11.5/29 = 39.655 % shown as 39.7 %). That breaks the binding rule "satu desimal tanpa pembulatan ke atas (84,96 = gagal)" (`research/31_datum_rev_a_names_register.md:257`). All percentages below are truncated to one decimal, the old values included. The JSON carries fractions only, so it is not affected.

**Per-pair coverage, old -> new (truncated):**

| Pair | Revision 1 | Revision 2 | Delta |
|---|---|---|---|
| `datum-proposal-teknis` / ID | 11.5/29 = 39.6 % (printed 39.7) | 11.5/29 = **39.6 %** | GF-17 +0.5, GF-08 -0.5 |
| `datum-proposal-teknis-en` / EN | 12/29 = 41.3 % (printed 41.4) | 13.5/29 = **46.5 %** | LB-08 +1, LB-07 +0.5, GF-17 +0.5, GF-08 -0.5 |
| `datum-laporan` / ID | 11/28 = 39.2 % (printed 39.3) | 11/28 = **39.2 %** | GF-17 +0.5, GF-08 -0.5 |
| `datum-laporan-en` / EN | 11.5/28 = 41.0 % (printed 41.1) | 13/28 = **46.4 %** | as PT-en |
| `datum-laporan-verifikasi` / ID | 11/28 = 39.2 % (printed 39.3) | 11/28 = **39.2 %** | as LAP |
| `datum-laporan-verifikasi-en` / EN | 11.5/28 = 41.0 % (printed 41.1) | 13/28 = **46.4 %** | as PT-en |
| `datum-standar` / ID | 11.5/29 = 39.6 % (printed 39.7) | 11.5/29 = **39.6 %** | as PT |
| `datum-standar-en` / EN | 12/29 = 41.3 % (printed 41.4) | 13.5/29 = **46.5 %** | as PT-en |
| `datum-nota` / ID | 6.5/16 = 40.6 % | 6.5/16 = **40.6 %** | GF-17 +0.5, GF-08 -0.5 |
| `datum-nota-en` / EN | 6.5/16 = 40.6 % | 7.5/16 = **46.8 %** | LB-08 +1, GF-17 +0.5, GF-08 -0.5 |

**Difference from the fix report's expectation** (`coder_execution_gfix1.md` "Expected coverage after G-FIX1"): every pair is 0.5 point lower than expected. The fix report kept GF-08 at C, inheriting my revision 1 error. Its PT EN 48.2 % becomes 46.5 % here, and its NOT ID 43.75 % becomes 40.6 %.

## 1. Summary

| Pair (slug / language) | Applicable | Covered | Partial | Not covered | Coverage | >= 85 %? | If every partial counted as full |
|---|---|---|---|---|---|---|---|
| `datum-proposal-teknis` / ID | 29 | 2 | 19 | 8 | **39.6 %** (11.5/29) | no | 72.4 % |
| `datum-proposal-teknis-en` / EN | 29 | 5 | 17 | 7 | **46.5 %** (13.5/29) | no | 75.8 % |
| `datum-laporan` / ID | 28 | 2 | 18 | 8 | **39.2 %** (11/28) | no | 71.4 % |
| `datum-laporan-en` / EN | 28 | 5 | 16 | 7 | **46.4 %** (13/28) | no | 75.0 % |
| `datum-laporan-verifikasi` / ID | 28 | 2 | 18 | 8 | **39.2 %** (11/28) | no | 71.4 % |
| `datum-laporan-verifikasi-en` / EN | 28 | 5 | 16 | 7 | **46.4 %** (13/28) | no | 75.0 % |
| `datum-standar` / ID | 29 | 2 | 19 | 8 | **39.6 %** (11.5/29) | no | 72.4 % |
| `datum-standar-en` / EN | 29 | 5 | 17 | 7 | **46.5 %** (13.5/29) | no | 75.8 % |
| `datum-nota` / ID | 16 | 2 | 9 | 5 | **40.6 %** (6.5/16) | no | 68.7 % |
| `datum-nota-en` / EN | 16 | 3 | 9 | 4 | **46.8 %** (7.5/16) | no | 75.0 % |

**Scoring convention (unchanged):** coverage = (covered x 1 + partial x 0.5 + not covered x 0) / applicable. "Not applicable" and "out of scope" (§4) leave the denominator. The value is computed exactly and truncated to one decimal (`research/31_datum_rev_a_names_register.md:257`).

**Finding:** the shortfall is still structural. No pair reaches 85 % even if every partial counted as full (68.7 % to 75.8 %). G-FIX 1 raised the EN pairs. The ID pairs did not move: the zebra gain only corrects a revision 1 misjudgement, and it is cancelled by the GF-08 correction. D-608 has already taken the decision revision 1 asked for (§7). The release gate is the measured score (>= 85 %, 4/4 critical rules, 0 text clashes per pair). Point coverage is reported as-is with its gap list and proposed as a follow-up engine round (§9).

## 2. Method, scope and assumptions (5W1H)

- **What:** the 39 coverage-only points of `research/32` §14. 35 are in the initial denominator; GF-16, TR-06, NC-08 and CL-04 were already out of scope. Each point was judged against each of the 10 template x language pairs from `research/31` §1.
- **Who:** consumers are S36 (DEV gate), S45 (rehearsal) and S52 (production), via the scorer's `--coverage` option. Under D-608 the figure is informational. The decision owner is the controller, or USER via the controller.
- **How:** each point was checked against:
  - (a) the template spec data (`prisma/seed-doc-type-templates.ts`, now with `layout.railMode` and `table.zebra.minRows` in the shared layer, lines 40-45);
  - (b) **the effective parameters the templates inherit** = registry defaults, overridden by the `datum-gsp-preset` pinned baseline (Manual 000 profile overrides minus `lint.enforcement*`, plus the D-327/D-151/KT-7 decisions; `prisma/seed-studio.ts:33-45, 553-576`), overridden by the spec layers;
  - (c) engine behaviour in `src/lib/studio/**`;
  - (d) the MCP client that builds the front-matter slots (`scripts/studio/mcp/write-client.ts`);
  - (e) post-render lint, which counts only where it actually runs (`src/lib/studio/services/render/lint.ts:113-130`). Structure lints are skipped for NOTA (`engine/lint/structure/index.ts:118`; `registry/lint.ts:139`).
- **Strictness rule (unchanged):**
  - **Covered** = concrete code or data that produces the manual's requirement for that pair without the agent having to supply it.
  - **Partial** = some of the point is produced or checked, but a required part is missing, differs, depends on optional agent input, or is only reported by lint.
  - **Not covered** = nothing produces or checks it, or the engine produces something different.
  - Intent, unread registry parameters and agent content count as nothing.
- **Assumptions:**
  - (A1) The code at the working tree is the post-G-FIX-1 state reported in `coder_execution_gfix1.md` (tests 4682 passed, ID baseline 8/8 SAME).
  - (A2, **revised**) Effective template values = the preset pinned baseline, not registry defaults. I checked every Manual 000 override key that bears on a point: `layout.railMode` A, `table.zebra.minRows` 1000, `type.scale.tableNumerals/tableHeader/caption.*`, `device.spine.placements`, `grid.*`, `type.scale.body.*`, `color.interior.ink200` (`template.json:805-884`). No override touches `cover.controlBlock.fields`, `color.*.paper`, `rules.tintsPercent`, `classification.recipientScheme`, `appendix.kicker.pattern`, `naming.file.pattern`, `terbilang.*` or the `controlSheet.*` params (grep `template.json`; the `controlSheet.*` matches at 1294+ are role formats). The DEV preset row was not read from the DB; the chain is seed code -> profile -> stored baseline `test/sr36_baseline_datum_gsp_v1.json`.
  - (A3) There is no preset `logo` override (unchanged).
- **Gaps:** PDF-only points (CV-20, GF-22) were judged from DOCX roles and known deviations, not rendered PDFs. Manual line citations follow `research/32` §14.

## 3. Matrix

Codes: **C** covered (1), **P** partial (0.5), **N** not covered (0), **NA** not applicable, **OOS** out of scope (§4). Pair columns: PT = `datum-proposal-teknis` (SERAH), LAP = `datum-laporan` (TERBIT), VER = `datum-laporan-verifikasi` (TERBIT), STD = `datum-standar` (TERBIT), NOT = `datum-nota` (NOTA); suffix `-en` = EN. Cells changed in revision 2 are marked with `*`.

| Code | Point | Manual | Where covered (evidence) | PT | PT-en | LAP | LAP-en | VER | VER-en | STD | STD-en | NOT | NOT-en |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CV-14 | Remaining cover control-block fields (pages, geodetic datum, verification) | `ID:2486-2487` vs specimen `ID:15-18`; `EN:2558-2559` vs `EN:15-18` | The engine implements the specimen field set (TIER, DASAR, BAHASA): `COVER_CONTROL_FIELDS` `src/lib/studio/params/page.ts:368-377`, enum `page.ts:426-429`, labels `texts.ts:203-212`, rows `texts.ts:247-272`. The prose fields "halaman, datum geodetik, verifikasi" are not in the enum. When the agent sends `meta.number`, the MCP explicit block replaces the auto block and carries only number/rev/author plus optional classification/audience/custodian/basis (`write-client.ts:194-203`). Partial: specimen met, prose not. NOTA: no cover | P | P | P | P | P | P | P | P | NA | NA |
| CV-15 | Preparer value always "Divisi Engineering PT GSP" / "Engineering Division, PT GSP" | `ID:2487`; `EN:2558` (also `EN:16`) | PENYUSUN = `meta.author` as sent (`texts.ts:251`). `meta.author` is mandatory agent input with no template default (`write-client.ts:77-80`), used as sent in the explicit block (`write-client.ts:195`). No parameter fixes the value (G-FIX 1 confirmed: none exists) | N | N | N | N | N | N | N | N | NA | NA |
| CV-19 | Spine string also on dividers and back cover | DT-13f `ID:2718-2723`; `EN:2766`, `EN:2778-2783` | Cover outer margin `engine/docx/wrapper/pages.ts:234-235`. The divider placement exists in code (`pages.ts:559-560`, predicate `pages.ts:118-119`), but the preset sets `device.spine.placements = ["margin luar sampul"]` (`template.json:863-865`), so these templates print the spine on the cover only. The enum has no back cover (`page.ts:323-332`), and the engine has no back cover page | P | P | P | P | P | P | P | P | NA | NA |
| CV-20 | Cover title line <= 150 mm | `ID:2480`; `EN:2552` | Title roles `cover.titleFirst/Last` have no right indent (`engine/docx/wrapper/formats.ts:179-182`); the title spans the 166 mm column. There is no title-width parameter (G-FIX 1), and the roleFormats route was declined (D-605 (1)) | N | N | N | N | N | N | N | N | NA | NA |
| CV-21 | Logo colour per edition (ID seal, EN black) | `ID:2545-2547`; `EN:2611`, `EN:2643` | Default logo = `logo/gsp-tinta.png` (black) (`engine/docx/wrapper/media.ts:273-283`). The manifest has no seal variant (`src/lib/studio/assets/manifest.json:189-225`). EN = C; ID = N | N | C | N | C | N | C | N | C | NA | NA |
| CS-06 | Three signature columns | `ID:2501`; `EN:2570` | Signature block rendered from the payload (`services/compose/front.ts:113-122`). The client sends 1 to 3 roles depending on optional `checker`/`approver` (`write-client.ts:220-226`). `controlSheet.signatures.roles` (`page.ts:490-499`) is unread. Its default (`DISUSUN/DIPERIKSA/DISAHKAN`, always 3) differs from current output, so G-FIX 1 did not wire it (D-608) | P | P | P | P | P | P | P | P | NA | NA |
| CS-08 | Three-layer verification chain | `ID:2500-2501`, specimen `ID:37-54`; `EN:2569` | Chain = 1 to 3 people layers (`write-client.ts:207-211`), columns Lapis/Peran/Nama/Tanggal (`texts.ts:112`; compose `front.ts:101-106`). The manual's V1/V2/V3 method/object/result layers exist only in the unread `controlSheet.verificationChain` (`page.ts:461-478`). Not wired: default differs from current output (D-608) | P | P | P | P | P | P | P | P | NA | NA |
| CS-09 | Method statement | `ID:2501`; `EN:2570` | Rendered only when the agent sends `meta.method` (`write-client.ts:217`; `front.ts:107`). `controlSheet.methodStatement.required` (`page.ts:479`) is unread. Not wired: any form of `true` changes method-less output (D-608) | P | P | P | P | P | P | P | P | NA | NA |
| CS-11 | Manual control-sheet columns (STATUS; METODE/OBJEK/HASIL; MEDIA/KEMBALI) | `ID:29, 39, 58`; `EN:29, 38, 62` | Engine columns are fixed: Rev/Tanggal/Uraian/Oleh, Lapis/Peran/Nama/Tanggal, Salinan/Pemegang (`texts.ts:109-114`; `front.ts:99-108`). The `controlSheet.*.columns` defaults differ from current output, so they were not wired (D-608) | N | N | N | N | N | N | N | N | NA | NA |
| CS-12 | Control-sheet subtitle "Kendali dokumen, riwayat revisi, dan pernyataan verifikasi" / EN | `ID:25`; `EN:25` | Title = slot label, or `Lembar Kendali <number>` / `Control Sheet <number>` (`front.ts:93-97`; `write-client.ts:214`). No subtitle text exists in `texts.ts` | N | N | N | N | N | N | N | N | NA | NA |
| RB-08c | Sheet numbering restart at Chapter 1 (ID text ambiguous) | `ID:2510-2511` vs practice `ID:304` | No `w:pgNumType` in the DOCX engine (grep `engine/docx`: 0); counting from page 1 matches the practice reading, not the literal text. Partial because the point is ambiguous. ID TERBIT/SERAH only | P | NA | P | NA | P | NA | P | NA | NA | NA |
| GF-08 | Table numeral, table header, caption type scale | Tabel 8.2 `ID:2633-2635`; `EN:2703-2705` | Registry = Table 8.2 (`color-type.ts:223-231`), but the sizes are class B with the reference pinned by the preset (`color-type.ts:13`). The preset pins the Manual 000 measurements: numerals **7** pt (manual 7.8), header **6.5** pt +0.0923 em (6.8 pt +0.09 em), caption **7.5**/11 (7.6/11) (`template.json:845-849`; `test/sr36_baseline_datum_gsp_v1.json:1165, 1666, 1972`). Faces, weights, colours, caps, tabular figures and the caption leading match; the three sizes do not. No spec-layer override (`seed-doc-type-templates.ts:40-45`) | P* | P* | P* | P* | P* | P* | P* | P* | P* | P* |
| GF-17 | Only 15 % / 30 % tints, printed documents without zebra | DT-11b `ID:2749-2754`; `EN:2810-2815` | Tints `rules.tintsPercent = [15, 30]` (`page.ts:175-177`, not overridden by the preset). Zebra threshold `table.zebra.minRows` = 1000 in the preset (`template.json:882`) and in the shared spec layer (`seed-doc-type-templates.ts:44`), read by DOCX (`engine/docx/tables/render.ts:495-497`) and HTML (`engine/html/tables/table.ts:334`). Printed BoQ is never zebra (`render.ts:491-492`). Boundary: a single table with more than 1000 body rows would still get zebra; there is no zebra switch in the registry | C* | C* | C* | C* | C* | C* | C* | C* | C* | C* |
| GF-18 | Photocopy test by a non-author reviewer | DT-11c `ID:2756-2762`; `EN:2817-2823` | Human review process; see §4 | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS |
| GF-19 | Background #FCFCFB / #FBFAF7 | DT-05 `ID:2528-2533`; `EN:2591-2597` | `color.wrapper.paper` FBFAF7 and `color.interior.paper` FCFCFB (`color-type.ts:60, 70`; not overridden by the preset) are applied in HTML (`engine/html/base/shell.ts:213-214`). The DOCX engine writes no page background (grep `w:background` in `engine/docx`: 0) | P | P | P | P | P | P | P | P | P | P |
| GF-20 | Colour limits per page and per chart | DT-06 `ID:2535-2540`; `EN:2599-2608` | Lints DATUM-14/25 (`engine/lint/render/index.ts:217-262, 321-334`, all tiers) and DATUM-12 (`checks-a.ts:369-388`, T/S only). "<= 2 meaning colours per page" is not checked. Lint reports and does not enforce | P | P | P | P | P | P | P | P | P | P |
| GF-21 | 13.5 pt rhythm and 66-80 character line | DT-10b `ID:2680-2685`; `EN:2748-2753` | Body 9.5/13.5 pt (`color-type.ts:221`; the preset keeps 9.5/13.5, `template.json:841-842`, and `type.baselinePt` 13.5, `template.json:817`). DATUM-15 line-length lint (`lint/render/index.ts:277-317`). `grid.verticalRhythm.multipleOfBaseline` (`page.ts:118-128`) is unread; headings, table rows and figures are not snapped | P | P | P | P | P | P | P | P | P | P |
| GF-22 | Letterhead colour samples in PDF (seal band, header rule, register top rule = RGB 110,20,32 +-3) | DT-13d `ID:2588-2594`; `EN:2660-2666` | Seal band fill = 6E1420 (`engine/docx/wrapper/render.ts:329-347`). Header rule INK200 (`engine/docx/package/header-footer.ts:48, 73`); register top rule ink900. Both are known deviations (D-602, D-604). No PDF sampling. 1 of 3 | P | P | P | P | P | P | P | P | NA | NA |
| GF-23 | Datum Rule ticks >= 0.18 mm | DT-13f `ID:2718-2720`; `EN:2777-2781` | Ticks 5 px at 600 dpi = 0.212 mm (`engine/docx/wrapper/media.ts:123, 142-164`) | C | C | C | C | C | C | C | C | C | C |
| GF-24 | Evidence rail in the outer 32 mm column of interior pages | `EN:2764`; legend `ID:2705-2711` | `grid.evidenceRailMm` 32 and `layout.railMode` A in both the preset (`template.json:813, 816`) and the spec layer (`seed-doc-type-templates.ts:43`). HTML renders rail mode A (fix report: `st-rail-a`). The GSP preset uses the `framePr` renderer (`prisma/seed-studio.ts:560`), so DOCX rail space is per paragraph (K2 rev B, D-342, `engine/docx/blocks/rail.ts:14-21`). Only rail-chip paragraphs narrow, and the DOCX/PDF never shows the empty rail the manual asks for ("Rel yang kosong itu benar", `ID:2711`). Fix report: DOCX sha equal for `auto` and `A` | P | P | P | P | P | P | P | P | P | P |
| NU-06 | Bilingual pair shares number, revision, classification, table numbers | PK-13 `EN:422-429`, `EN:533` | No pair link (`research/30:187`); each document gets its own server number (`services/ingest/repository.ts:51-74`) | N | N | N | N | N | N | N | N | N | N |
| NU-08 | Revision scheme Draf 1, Draf 2, RevA | `ID:515-516`; `EN:538-539` | Server `rev` accepts letters A..ZZ only; other text gets `REV_DISPLAY_ONLY` (`write-client.ts:105-107`); file name `Rev<r>` (`services/storage/paths.ts:199-201`). Draft states not modelled | P | P | P | P | P | P | P | P | P | P |
| NU-09 | Number from the Register Induk before building; `XXX` holds release | DT-04a `ID:508-513`; `EN:535-541` | The server assigns the number at ingest (`repository.ts:51-74`). No `XXX` placeholder state and no release hold | P | P | P | P | P | P | P | P | NA | NA |
| TR-05 | Four SERAH obligations | PK-06 `ID:422-444`; `EN:467-479` | Tools exist: derivation blocks, rail (`rail.ts:45-65`), `serah.reconciliationTable.required` (`apparatus.ts:252-255`), lints D01/D03/D16 (`registry/lint.ts:402-404, 417-425`). The obligations are agent content; lints report only. SERAH only | P | P | NA | NA | NA | NA | NA | NA | NA | NA |
| TR-07 | NOTA file named title + ISO date | Tabel 2.3 `ID:487-493`; `EN:518-523` | File name = `<title> <number> Rev<r>` (`paths.ts:196-205`; `services/render/pure/render.ts:362-365`). `naming.file.pattern` is class T and not applied (`engine/tokens/grid.ts:433`); its default `{judul} {nomorBerkas}` also differs from current output (D-608). NOTA only | NA | NA | NA | NA | NA | NA | NA | NA | P | P |
| NC-05 | English annex in an ID document opens with the convention line | `ID:2005-2006`; `EN:2081-2082` | Nothing in the engine; agent content. ID documents only | N | NA | N | NA | N | NA | N | NA | N | NA |
| NC-06 | Money form in prose (one form per file; ISO 4217) | DT-30g `ID:1940-1942`; `EN:2024-2028` | Register-bound money is full form per language (`engine/bind/register.ts:146-158`). Prose money is agent text; no one-form-per-file check | P | P | P | P | P | P | P | P | P | P |
| NC-07 | Terbilang / "In words:" under every binding sum, generated from the figure | DT-31b `ID:1950-1956`; `EN:2030-2036` | No generator (`terbilang.generatedByCode` is a flag only, `apparatus.ts:412`). Lint D05 checks ID number/words pairs (`lint/structure/checks-d.ts:207-219`), T/S only. ID T/S = P; ID NOTA = N; EN = N. G-FIX 1 (f) skipped it: no payload marker for a binding sum (U3), and bind-layer code is out of scope | P | N | P | N | P | N | P | N | N | N |
| LB-07 | Language value "English (UK)" | `EN:18` (also `EN:883`) | **G-FIX 1:** EN document in an EN wrapper -> "English (UK)" (`texts.ts:233-240, 256`). Produced by the auto cover block with no agent input. Boundary: when the agent sends `meta.number`, the MCP explicit block replaces the auto block and has no BAHASA field (`write-client.ts:194-203`), so the value is then absent (not wrong). EN T/S only | NA | C* | NA | C* | NA | C* | NA | C* | NA | NA |
| LB-08 | "Annex" for EN appendices | `EN:223-247`, `EN:4326`, `EN:4441` | **G-FIX 1:** `WRAPPER_TEXT.appendix.EN = "Annex"` (`texts.ts:82-83`) feeds the opener kicker (`texts.ts:166-169`; DOCX `pages.ts:593`; HTML `html/blocks/text.ts:333`), chapter kickers in appendix units (`texts.ts:185-198`), TOC/part-divider labels (`texts.ts:153-155`; `pages.ts:143`; HTML `html/blocks/wrapper.ts:420`) and the DOCX running head (`header-footer.ts:98`). No "Appendix" literal remains (grep `src/lib/studio`). The EN slot label `Appendices` (`seed-doc-type-templates.ts:118`) is a slot name and is not printed as the appendix word (fix report Finding 4). EN only | NA | C* | NA | C* | NA | C* | NA | C* | NA | C* |
| LB-12 | Prevailing version named in the front matter of both versions | PK-12 `EN:415-420` | No slot, parameter or text (`research/30:119`) | N | N | N | N | N | N | N | N | N | N |
| LB-13 | EN-L1-13 statement for ministries | `EN:1350-1352` | Chapter 5 expert-style rule; see §4 | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS |
| CL-02 | "Klasifikasi:" line below the number | DT-28c `ID:611-612`; `EN:647-648` | Only the explicit MCP cover block adds a Klasifikasi/Classification pair, and only when the agent sends `number` and `classification` (`write-client.ts:194-203`); G-FIX 1 (g) upper-cases its value (`front.ts:78`). The auto block enum has no classification (`page.ts:368-377`; `texts.ts:203-212`). T/S = P; NOTA = N | P | P | P | P | P | P | P | P | N | N |
| CL-03 | Classification scheme per recipient | DT-28a/b `ID:566-607`; `EN:590-625` | `classification.recipientScheme` = `anri`, fixed by D-590 (`apparatus.ts:261-264`); DATUM-18 validates (`checks-a.ts:413-430`, T/S only). Kemhan/TNI schemes cannot be selected per document; NOTA has no check | P | P | P | P | P | P | P | P | P | P |
| ST-01 | Rule index (STD) | `ID:235`, `ID:4517`; `EN:240`, `EN:4441` | Slot `ruleIndex` AUTO, optional (`seed-doc-type-templates.ts:62-66, 84`). The empty AUTO marker emits no DOCX section (`engine/docx/assemble/units.ts:188-193, 351-361`); D-598 F-3. STD only | NA | NA | NA | NA | NA | NA | P | P | NA | NA |
| GF-16 | Form values = tokens.json v1.9 | DT-03 `ID:2432-2438`; `EN:2508-2513` | see §4 | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS |
| TR-06 | Release gate per tier | `ID:3868-3869`; `EN:3901-3905` | see §4 | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS |
| NC-08 | Chart number labels in EN documents | `EN:3020` | see §4 | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS |
| CL-04 | GSP COMMERCIAL IN CONFIDENCE | DT-28e/EG-52 `EN:663-673` | see §4 | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS |

Checksum: 39 rows = 33 in scope + 6 out of scope. Applicable counts per pair = §1 (unchanged from revision 1; no applicability changed).

## 4. Out-of-scope list (leaves the denominator)

Unchanged from revision 1.

| Code | Reason | Basis |
|---|---|---|
| GF-16 | Token audit Rev O vs v2.0.0 deferred by USER/controller | D-590 (`decisions.md:596`); `research/32` §14 |
| TR-06 | Release gate is a writing process, not template output | `research/32` §14; OS-06 |
| NC-08 | Chart number labels in EN deferred to the next round | Q-C, D-596 (`decisions.md:602`) |
| CL-04 | Classification scheme fixed to ANRI; per-document or foreign scheme deferred | D-590 |
| GF-18 | DT-11c is a human check by a non-author on every SERAH document (`ID:2756-2762`); no template or engine output can satisfy or fail it. Same class as TR-06/OS-06 | OS-06 |
| LB-13 | EN-L1-13 belongs to Chapter 5 "Layer EN-L1" (`EN:1315`, `EN:1350-1352`); OS-01 excludes EN expert style as agent content | OS-01 |

Sensitivity: restoring GF-18 and LB-13 as "not covered" lowers coverage further (e.g. PT-ID 11.5/30 = 38.3 %, LAP-EN 13/29 = 44.8 %). The verdict does not change.

## 5. Gaps (not covered or partial, by cause), revision 2

| Cause | Points | Pairs hit |
|---|---|---|
| Engine has no mechanism | CV-20 (title width), CS-11 (manual columns), CS-12 (subtitle), NU-06 (pair link), NC-07 EN and NOTA (no generator), CV-19 back cover, GF-19 DOCX background, GF-21 rhythm snapping | all T/S; EN; NOTA |
| Asset missing | CV-21 ID (no seal logo) | 4 ID T/S |
| Agent content or mandatory payload (U3/D-594) | CV-15, NC-05, NC-06, LB-12, TR-05 | all applicable |
| Preset values kept on purpose (identity with datum-gsp / Manual 000 measurements; changing the preset changes datum-gsp ID output) | GF-08 (table sizes), CV-19 (spine placements), GF-24 (framePr per-paragraph rail, D-342), GF-22 (D-602/D-604) | all; T/S |
| Registry parameters that no code reads, with defaults different from current output (wiring changes existing ID output, D-608) | CS-06, CS-08, CS-09, CS-11, TR-07, GF-21 | all T/S; NOTA |
| Closed enums / literals | CV-14 and CL-02 (`cover.controlBlock.fields` enum), CL-03 (scheme fixed by D-590) | all |

Closed by G-FIX 1: LB-08 (EN), LB-07 (EN T/S). Reclassified by the A2 correction: GF-17 (already covered by the preset).

## 6. Data-only changes: status after G-FIX 1

| # | Change | Status | Coverage effect |
|---|---|---|---|
| D1 | Shared layer `layout.railMode: "A"` | **Applied** (`seed-doc-type-templates.ts:43`); the preset already had A | None: GF-24 stays P because of the DOCX `framePr` design (D-342) |
| D2 | Shared layer `table.zebra.minRows` large | **Applied** as 1000 (`seed-doc-type-templates.ts:44`); the preset already had 1000 | GF-17 C (A2 correction) |
| D3 | EN `appendix.kicker.pattern` "ANNEX {n}" | **Superseded** by the text-table route (G-FIX 1 (a)), which also covers the TOC label and running head; LB-03 updated | LB-08 C on 5 EN pairs |
| D4 | `cover.titleFirst/Last` right indent 907 tw via template roleFormats | **Not applied** (D-605 (1) stands) | CV-20 stays N |
| D5 (new) | Shared layer `type.scale.tableNumerals.size` 7.8, `type.scale.tableHeader.size` 6.8 (+ `trackEm` 0.09), `type.scale.caption.size` 7.6 | Not applied; found in this revision | GF-08 P -> C on all 10 pairs (+0.5). Preconditions in §9 |
| D6 (new) | Shared layer `device.spine.placements: ["margin luar sampul", "pembatas"]` | Not applied | None alone (back cover still missing; CV-19 stays P) |

Best case with data-only D4 + D5: PT/STD ID 13/29 = 44.8 %, PT/STD EN 15/29 = 51.7 %, LAP/VER ID 12.5/28 = 44.6 %, LAP/VER EN 14.5/28 = 51.7 %, NOT ID 7/16 = 43.7 %, NOT EN 8/16 = 50.0 %. **85 % is still unreachable with data-only changes.**

## 7. Decision status

Revision 1 asked the controller to decide because the S36/S45/S52 criterion "cakupan >= 85 % tiap pasangan" could not pass. **D-608 decided it** (`decisions.md:614`):
- G-FIX cycle 2 is not run, because every further gain needs one of three things: a change to existing ID template output (against D-590), new registry parameters that change the 7 old templates (AC-3), or new agent input (U3, D-594).
- The 85 % coverage threshold was a controller interpretation (D-593). USER's "kecocokan dengan datum minimal 85 %" is measured by the measured-rule score.
- Release gate = measured score >= 85 %, 4/4 critical rules, 0 text clashes per pair.
- Point coverage is reported as-is (this file), not claimed to meet 85 %, and the remaining gaps go to a follow-up engine round (§9).

No further decision is requested here. The GF-08 finding (D5) is new information. The controller may want to put it to the follow-up task, or decide separately whether a data-only D5 belongs in this release, because it changes the 10 new templates' table type sizes.

## 8. Machine-readable output

`verification/coverage/datum_point_coverage.json` is updated in place: same schema `datum-point-coverage/v1`, same keys (`schema`, `source`, `generatedAt`, `convention`, `outOfScope`, `pairs[]` with `template`, `language`, `covered`, `applicable`, `counts`). Only the `covered` and `counts` values, plus the `source` text, changed. It is in the `pairs` form accepted by `benchmark/datum_conformance/lib/coverage.ts:45-56`. The loader derives `percent = covered / applicable x 100`, and the scorer looks pairs up by `{ template, language }` (`benchmark/datum_conformance/lib/cli.ts:177`).

Plan draft (`masterplan/02_plan_draft.md`) not produced: this is a verification artifact, and the follow-up round (§9) is proposed by the controller as a separate task.

## 9. Follow-up engine round (not in this release)

Scope: every point still P or N in any pair. "Old templates" = the 7 pre-existing templates plus `datum-gsp`/`datum-gsp-preset`, whose ID output D-590 keeps byte-identical. "New ID" = the 10 Rev A templates' ID output in DEV v2. "Agent input" = a new or newly required payload or meta field (U3, D-594). **Best reachable** is my projection under the strict rule if the change is made; it is a hypothesis until re-scored.

| Point | Change that would cover it | Old templates' ID output changes? | New ID output changes? | Agent input? | Best reachable |
|---|---|---|---|---|---|
| GF-08 | Data: D5, setting the Table 8.2 sizes in the spec shared layer. Precondition: confirm that class-B `type.scale.*` keys are accepted in a template layer and that preset role formats (`template.json:1116+`) do not hardcode run sizes. Re-check table width guards G1-G3, which read the numeral size (`engine/docx/tables/render.ts:188`) | No (preset untouched) | Yes (table numerals, headers and captions grow 0.1-0.8 pt) | No | C |
| CV-14 | Engine + registry enum: add HALAMAN (page count field), VERIFIKASI (derived from the chain) and DATUM GEODETIK to `cover.controlBlock.fields` and `CONTROL_FIELD_LABELS`; set them only in the new templates' layer. Also make the MCP explicit block (`write-client.ts:194-203`) keep the auto fields | No, if the enum default list is unchanged. The explicit-block change does alter output for documents that send `meta.number`, on every template | Yes | Geodetic datum value: yes (project-specific) | P |
| CV-15 | Product decision plus a new param (e.g. a preparer unit name) printed as PENYUSUN, with `meta.author` kept for signatures. Requires USER to relax U3 for this one field | No, if the param is unset by default (but a new registry param, AC-3) | Yes | No | C (needs USER decision) |
| CV-19 | Engine: new back-cover page and placement enum value; data: D6 for dividers | No (opt-in) | Yes | No | C |
| CV-20 | Engine/registry: cover title max-width (150 mm -> right indent) as a param or role, set only in the new templates; or reverse D-605 (1) and use template roleFormats with a seed guard that compares role formats | No (opt-in) | Yes (title wrap) | No | C |
| CV-21 | Asset: seal-colour GSP logo from the brand owner, added to the manifest; a per-template or per-language logo parameter set only in the new ID templates | No (default logo unchanged) | Yes | No | C |
| CS-06 | Engine: opt-in "always three signature columns" (empty holder lines when checker/approver are absent), behind a new flag | No, if the flag defaults off | Yes | No (names stay optional agent input) | C |
| CS-08 | Engine: render the manual's V1/V2/V3 chain from `controlSheet.verificationChain`; V2 (execution) and V3 (render and check) can be machine-filled from Studio's own render/lint results; V1 (line-by-line read) needs a human record | No, if opt-in | Yes | Yes for V1 | P |
| CS-09 | Engine: opt-in enforcement (ingest warning or release block when the method statement is missing) | No, if opt-in | Only for method-less documents | Yes (content) | P |
| CS-11 | Engine + payload: wire the `controlSheet.*.columns` params behind an opt-in; STATUS derived from tier/rev; MEDIA/KEMBALI from the distribution input | No, if opt-in | Yes | MEDIA/KEMBALI values: yes (optional) | C (columns produced) |
| CS-12 | Engine: subtitle entry in `WRAPPER_TEXT` (ID/EN), printed under the control-sheet title behind an opt-in | No, if opt-in | Yes | No | C |
| RB-08c | Manual-owner clarification first; if the literal reading wins, a `w:pgNumType w:start="1"` at Chapter 1 behind an opt-in | No, if opt-in | Yes (if literal) | No | C |
| GF-19 | Engine: DOCX `w:background` from the paper colours behind an opt-in param. Verify the LibreOffice PDF export renders it | No, if opt-in | Yes | No | C (if PDF honours it) |
| GF-20 | Engine: new lint for "<= 2 meaning colours per page". Lint only reports, so the point stays P unless the palette is limited by construction | No (lint report only; DOCX bytes unchanged) | Lint report only | No | P |
| GF-21 | Engine: wire `grid.verticalRhythm.multipleOfBaseline` (snap heading/table-row/figure heights to 13.5 pt) behind an opt-in | No, if opt-in (default reproduces nothing today) | Yes (vertical spacing) | No | C |
| GF-22 | Engine/registry: params for the header rule and register top rule colours (default = current INK200/ink900), set to seal in the new templates; PDF colour sampling in the scorer/S24 | No (default = current) but new registry params (AC-3) | Yes | No | C |
| GF-24 | Engine: a DOCX rail mode that reserves the 32 mm column on every interior page (opt-in renderer variant beside K2 rev B, D-342); re-check DATUM-15 at the 128 mm measure | No, if opt-in | Yes (body measure 166 -> 128 mm) | No | C |
| NU-06 | Product: bilingual pair link (EN document declared as the pair of an ID document; shared number, revision, classification, table numbering) in ingest and numbering | No (new documents only) | No for unpaired documents | Yes (pair declaration) | P |
| NU-08 | Product: draft states (Draf 1, Draf 2 -> RevA) in the server rev model, file name and register | No for letter revisions | No for letter revisions | No (rev text already sent) | C |
| NU-09 | Product: number reservation with an `XXX` placeholder until release, and a release hold | Draft output only (`XXX` before release) | Draft output only | No (release action by a human) | C |
| TR-05 | Engine: auto-build the reconciliation table from the register; make D01/D03/D16 blocking at SERAH release | No (SERAH opt-in) | PT only | Yes (obligation content) | P |
| TR-07 | Engine: tier-specific file-name derivation (NOTA = title + ISO date) through `naming.file.pattern` with a default that reproduces today's names | File names of NOTA documents only if the opt-in is set | NOTA file names | No | C |
| NC-05 | Engine + payload: an appendix-language flag; when an ID document has an EN annex, insert the convention line | No | Only for flagged annexes | Yes (flag) | P |
| NC-06 | Engine: lint "one money form per file" over prose | No (lint only) | Lint report only | Yes (prose) | P |
| NC-07 | Engine + payload: a "binding sum" marker; ID/EN number-to-words generator in `engine/bind`, placed under marked sums; enable D05 for NOTA | No (unmarked sums unchanged) | Only for marked sums | Yes (marker) | P |
| LB-12 | Engine/text: a prevailing-version statement (rule fixed by the manual) printed in the front matter of paired documents; depends on NU-06 | No | Only for paired documents | No if the rule is fixed; yes if it varies per contract | C |
| CL-02 | Registry enum + engine: KLASIFIKASI in `cover.controlBlock.fields` (value = existing `meta.classification`), set in the new templates; for NOTA, a classification line under the number in the header | No (enum default unchanged); NOTA header change only if opt-in | Yes | No (existing meta) | C |
| CL-03 | Product/registry: per-template or per-document recipient scheme (Kemhan/TNI), lifting D-590's ANRI-only rule; enable DATUM-18 for NOTA | No | Only with a non-ANRI scheme | Yes (recipient type), unless set by template | P |
| ST-01 | Engine: generate the rule-index section from rule IDs in the content (`engine/docx/assemble/units.ts:188-193`) | No (STD slot is new) | STD only | No (index derived from content) | C |

**Projection (hypothesis, not a measurement):** if every row above reached its "best reachable" status:
- `datum-laporan` / ID: 19 C + 9 P = 23.5/28 = 83.9 %; without the CV-15 product decision, 22.5/28 = 80.3 %.
- `datum-laporan-en` / EN: 24/28 = 85.7 %; without CV-15, 23/28 = 82.1 %.
- `datum-nota` / ID: 13/16 = 81.2 %.

So even a complete engine round leaves most pairs near or below 85 % under the strict rule. The remainder is agent-dependent: CS-08 V1, NC-05, NC-06, NC-07 marker, NU-06 pair declaration, TR-05, CL-03. That supports D-608's choice to gate on the measured score and to report coverage as information.
