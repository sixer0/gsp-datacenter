---
type: data
confidence: high for the 84 changed cells (code read in this session with file:line, plus the C32 DEV PDFs and scores in C:/tmp/c32); medium for GF-08 (the inherited measured role formats were traced through the seed chain and the engine resolution rule, but the run sizes were not extracted from the C32 DOCX) and for the GF-21 boundary judgement
subject: Point-coverage matrix for DATUM Rev A coverage-only points (U2, D-593), 10 templates x language
author_agent: data-analyst
date: 2026-11-05
revision: 3 (after the coverage engine round; revision 2 = after G-FIX 1, revision 1 = S33 original)
status: complete (read-only on code, DB and controller files; only this file and `coverage/datum_point_coverage.json` written)
blueprint_row: C33 (`identification/03_structured_datum_coverage_round.md:211`); controller instruction: update this file and its JSON in place (the blueprint's `33_datum_point_coverage_r3.md` / `_r3.json` names were not used)
depends_on: register `research/38` §5; implementer reports `delegation_progress/coder_execution_{c06_c07,engine_a,engine_b,engine_c,engine_d,engine_e,c21,c22,c23,c25}.md`; `prisma/seed-doc-type-templates.ts` (DEV v3); `prisma/seed-derived-presets.ts`; C32 DEV run `C:/tmp/c32/` (PDF, DOCX, scores, `resp/_features.json`)
binding: D-590, D-593 (U2), D-594 (U3), D-608, D-627, D-631, D-635, D-638, D-639, D-640, D-641, D-642, D-643
consumers: C32, C36, C37 (`--coverage verification/coverage/datum_point_coverage.json`); per D-608 / D-627 Q1 coverage is reported as-is, not a release gate
verdict: all 10 pairs still BELOW 85 % (53.1 % to 70.6 %); every pair is exactly 1.0 point below the register projection because GF-08 and GF-21 stay partial; remaining gaps in §9
---

# DATUM Rev A point-coverage matrix (revision 3)

## Revision 3 (after coverage round)

**Why this revision exists.** The coverage engine round (C06-C27, D-638..D-643) added 14 opt-in params (R-67..R-80), two enum values, the Rev A preset `datum-gsp-rev-a-preset`, and seeded the 10 templates as DEV v3 with those opt-ins (`prisma/seed-doc-type-templates.ts:33, 54, 72-91, 140, 150, 175, 195`). I re-judged all 39 rows with the same strict rule as before. Covered means code or data produces the requirement for the pair without agent input. Partial means only part of it is produced, or it depends on optional agent input, or lint only reports it. The C32 DEV run had already produced its PDFs and scores, so changed cells cite them where they show the element.

**PDF and score evidence used** (C32 DEV run, templates at v3, `C:/tmp/c32/resp/_render_summary.json`):
- `C:/tmp/c32/resp/_features.json`, PyMuPDF extraction of the 10 PDFs (`C:/tmp/c32/features.py`):
  - control-sheet subtitle present on all 8 T/S;
  - signature row `DISUSUN DIPERIKSA DISETUJUI` / `PREPARED BY REVIEWED BY APPROVED BY` on all 8 T/S;
  - last page = spaced spine string on all 8 T/S (back cover), and an interior page on NOTA;
  - body right edge 152.8 mm and widest body line 128.8 mm on all 10;
  - page fill FCFCFB on every page, cover included;
  - ID T/S register `LEMBAR 1 DARI 7` / `2 DARI 7` on pages 4-5 of 6-page PDFs; EN `SHEET 4 OF 6`;
  - NOTA ID `Klasifikasi : TERBATAS` on both pages.
- `C:/tmp/c32/score/*.md`:
  - RH-03 and RB-05 pass on all 10 ("garis kepala 6E1420", "garis register atas 6E1420 sz 8");
  - CS-04 pass in manual form and LB-11 NA (manual chain) on the 8 T/S;
  - LB-01 shows 6 cover labels with Klasifikasi/Classification third (e.g. `datum-laporan_ID.md:143`, `datum-laporan-en_EN.md:146`);
  - LB-06 shows three signature roles;
  - TR-02 pass on NOTA;
  - G-06 = 0 on both NOTA pairs.

**Changed cells (84 cells, 12 points):**

| Point | Cells | Old -> new | Evidence |
|---|---|---|---|
| CS-12 | 8 T/S | N -> **C** | R-67 on in the shared layer (`seed-doc-type-templates.ts:76`). DOCX subtitle after the title (`src/lib/studio/engine/docx/wrapper/pages.ts:303`), text `WRAPPER_TEXT.controlSubtitle` (ID:25 / EN:25). HTML parity C22 (`engine/html/blocks/wrapper.ts`). PDF: `_features.json` `subtitle: true` on all 8 T/S |
| CS-06 | 8 T/S | P -> **C** | R-68 (`seed-doc-type-templates.ts:77`). `filledSignature` always gives three columns, with roles placed by label (`engine/docx/wrapper/render.ts:527, 551`). PDF: three-role signature row on all 8 T/S; score LB-06 "Disusun, Diperiksa, Disetujui" |
| CS-11 | 8 T/S | N -> **C** | R-69 = `manual` (`seed-doc-type-templates.ts:78`). Manual heads, STATUS derived from revision order (`src/lib/studio/services/compose/front.ts:135-160, 172-176, 194-196`). Score CS-04 "bentuk manual ID:29/39/58, EN:29/38/62" on 8 T/S. The METODE/OBJEK/HASIL and MEDIA/KEMBALI cells print empty. Their content belongs to CS-08 and to distribution input, so the columns count as produced (same reading as revision 2 §9) |
| CV-20 | 8 T/S | N -> **C** | R-70 = 150 (`seed-doc-type-templates.ts:79`). Right indent = `grid.fullSpanMm` - 150 = 907 tw on `cover.titleFirst/Last`, applied after the template role layer (`engine/docx/wrapper/formats.ts:388, 422`). Engine A test `w:right="907"`. HTML indent on `<h1>` (C22) |
| CV-19 | 8 T/S | P -> **C** | Placements `["margin luar sampul", "pembatas", "sampul belakang"]` override the preset pin (`seed-doc-type-templates.ts:81`). Predicate `pages.ts:119-133`; back-cover unit planned only with a cover unit in document scope (`engine/docx/assemble/units.ts:387-393`). PDF: last page = spine string on all 8 T/S; NOTA last page is interior (TR-02 pass) |
| CV-15 | 8 T/S | N -> **C** | R-79 in the language layers: `Divisi Engineering PT GSP` / `Engineering Division, PT GSP` (`seed-doc-type-templates.ts:175, 195`). Auto block `engine/front/texts.ts:306-313, 325`. The explicit MCP block is substituted in compose (`compose/front.ts:107-115`, D-639 (2)), so both print paths are closed (register K-6 resolved). Signatures and revision rows keep `meta.author` |
| GF-22 | 8 T/S | P -> **C** | R-72 / R-73 = 6E1420 (`seed-doc-type-templates.ts:73-74`). The header-rule override now wins over the preset border (`engine/docx/package/header-footer.ts:92`, D-640 (1)); register top rule `header-footer.ts:74`. Scores: RH-03 and RB-05 pass with 6E1420 on all 10. The seal band fill was already seal (SB-02 fails only on text colour F6E9E9, which is not part of GF-22) |
| CL-02 | 8 T/S | P -> **C** | 8-field list with KLASIFIKASI third (`seed-doc-type-templates.ts:80`). The value always exists: `meta.classification` falls back to template `classification.level` (registry default `Terbatas`, `src/lib/studio/services/compose/merge.ts:86`, `params/apparatus.ts:265`), printed in capitals (`texts.ts:332`). Score LB-01: Klasifikasi/Classification in row 2, left column, directly under the number; CR-1 "TERBATAS". Boundary: see the matrix row |
| CL-02 | 2 NOTA | N -> **C** | R-76 in the NOT type layer (`seed-doc-type-templates.ts:150`). Line `Klasifikasi : <K>` / `Classification: <K>` under the register number cell (`header-footer.ts:379-393`; D-639 (4)). PDF NOTA ID: `Klasifikasi : TERBATAS` on both pages. G-06 = 0 after the narrow clash alignment (D-640 (2)). NOTA EN: the C32 feature regex looks for " : " (`features.py:38`), while the EN separator is ": ", so the PDF text was not captured. That is not a negative; the code path and the engine C / C22 tests are the same for EN |
| GF-24 | all 10 | P -> **C** | R-75 (`seed-doc-type-templates.ts:54, 82`). K2 reserve on interior units only (`engine/docx/blocks/rail.ts:45, 76, 104-105`); section margins unchanged (score GF-02/GF-03 pass). PDF: body right edge 152.8 mm (24 + 128 + 0.8 mm glyph overshoot) and widest body line 128.8 mm on all 10. Tables and figures keep 128/166 mm, as the manual allows (EN:2737) |
| RB-08c | 4 ID T/S | P -> **C** | R-80 = `bab1` in the ID layer only (`seed-doc-type-templates.ts:175`). `w:pgNumType w:start="1"` on the first chapter section (`header-footer.ts:649`; `engine/docx/package/section.ts:205, 246`). PDF: `LEMBAR 1 DARI 7`, `2 DARI 7` on pages 4-5. The ambiguity revision 2 cited was settled by USER (D-627 Q4, D-639 (1)). N counts the whole document, including the LibreOffice hidden parity page (6-page PDF, "DARI 7"). USER accepted this "+1 total" (D-639) |
| ST-01 | STD, STD-en | P -> **C** | R-77 in the STD type layer (`seed-doc-type-templates.ts:140`). One builder for DOCX and HTML (`engine/front/rule-index.ts:186, 272`; `units.ts:358-362`). The index is derived from rule codes in the content, with no new agent field. Boundary: the C32 STD content has no rule markers, so the PDFs show no index (`ruleIndex: false`) and the optional slot is omitted. That is the specified behaviour; the mechanism is proven by engine D's tests only |
| TR-07 | 2 NOTA | P -> **C** | R-78 = `judulTanggalIso` in the NOT type layer (`seed-doc-type-templates.ts:150`). Artifact `fileName` = `<title> <YYYY-MM-DD>.<ext>` (`services/storage/paths.ts:215-233`; `services/render/pure/render.ts:365-382`). `meta.issueDate` always exists (MCP default today, `scripts/studio/mcp/write-client.ts:85`). Boundary: the delivery name `finalFileName` (AM-09, `services/render/final-name.ts`) stays `<number>_rev<n>_<timestamp>_<sha>` for every tier, as in revision 2 (`_render_summary.json`) |

**Evidence changed, cell unchanged:**
- **GF-08 (P stays on all 10; projected C).** The Rev A preset pins 7.8 / 6.8 / 7.6 pt + 0.09 em (`prisma/seed-derived-presets.ts:30-35`), and the 10 resolve those params (C23 S29 assertion). Two things keep the output partial:
  - **(1) The pins do not reach the printed runs.** Template role formats win per sub-object over the catalog type scale, and a written `run` is used whole, with no catalog size under it (`src/lib/studio/engine/tokens/roles.ts:4-11, 170-177`; `engine/tokens/index.ts:152`; tables `engine/docx/tables/style.ts:196-207`; caption `engine/docx/tables/render.ts:476-483`). The 10 inherit the measured Manual 000 role formats through `datum-gsp-preset`:
    - caption run 7.5 pt (`benchmark/manual000/template.json:1500-1506`);
    - table headers 6.5 pt (`:2260-2268`, `:2401-2409`);
    - right-aligned numerals 7.5 pt (`:2441-2447`) and mono cells 7 pt (`:2299-2305`).
    The inheritance path: preset own role formats = the datum-gsp baseline roles that differ from the base (`prisma/seed-studio.ts:171, 838`), and versions inherit the base's effective role formats (`src/lib/studio/services/templates/index.ts:382, 962`). The same inheritance produces the known SB-02 F6E9E9 failure. The pins reach only the table width solver (`tables/render.ts:218`).
  - **(2) R-74 changes the caption leading.** It rounds every `exact` line height up to 270 tw (`engine/docx/blocks/rhythm.ts:53`), caption paragraphs included (`tables/render.ts:105-113`; `figures/figure.ts:434-444`). The caption line goes 220 -> 270 tw, so 11 -> 13.5 pt, against Table 8.2 "7,6 / 11 pt" (`ID:2635`). Engine E measured "Table caption: 120/48/220 -> 0/0/270". DT-10b lists body spacing, heading distances, table rows and figure heights, not captions (`ID:2683-2685`).
  - **Correction to revision 2:** numerals printed 7.5 pt from the role format, not 7 pt from the param.
  - **Not verified from the C32 DOCX:** no XML extraction was available in this session. To check, unzip `C:/tmp/c32/out/datum-laporan.docx` and read the caption and table-header `w:sz`.
- **GF-21 (P stays on all 10; projected C).** Snapping now covers headings, figures, captions and table rows (`rhythm.ts:6-15`; `tables/render.ts:623-626`). The 128 mm measure brings line length to 66-80 (engine E: median 76/77 characters; C32 widest body line 128.8 mm). Body leading is 270 exact (score GF-06). Still partial for two reasons:
  - Rows get only `atLeast` k x 270 from a single-line estimate. The body cell text line is 220 tw with 85 + 85 tw margins (`template.json:2323-2343`). A row whose text wraps to two lines is 610 tw, more than the 540 minimum and not a multiple of 270.
  - Device boxes are not snapped.
  - Engine E's own report: "The page is not on one global 13.5 pt grid even with R-74 on". DT-10b's test names "baris tabel" without a size limit.
  - The body paragraph gap of 135 tw (`template.json:1475-1482`) is the Manual 000 measured value, so I did not count it against the point.
- **GF-19 (P stays).** DOCX now writes `w:background` FCFCFB plus `w:displayBackgroundShape` (`engine/docx/package/parts.ts:248-260, 291`). The PDF fill is FCFCFB on every page, but the cover, control sheet and TOC should be FBFAF7. That is one colour per document by design (D-631).
- **CV-14 (P stays).** The 8-field list drops DASAR to keep the 4 x 2 block (D-635 (3)). The normative prose fields (pages, geodetic datum, verification) are still not in the enum.
- **CS-08 (P stays).** In manual form the chain prints `[layer, "", "", ""]` (`compose/front.ts:147`). Names, roles and dates leave the verification table (K-10, D-639 (3)). Layers still come from the payload (1-3), and V1/V2/V3 content is still not produced.
- **CV-21 (ID N, EN C).** Skipped by USER (D-627 Q3).
- **Line re-anchoring.** References into files the round modified were re-read: `texts.ts`, `compose/front.ts`, `pages.ts`, wrapper `render.ts`, `formats.ts`, `units.ts`, `header-footer.ts`, `section.ts`, `parts.ts`, `rail.ts`, tables `render.ts` (numeral param now `:218`, was `:188`), `seed-doc-type-templates.ts`. Other references are carried over.

**Per-pair coverage, revision 2 -> revision 3 (truncated to one decimal), compared with the register projection (`research/38` §5.3):**

| Pair | Revision 2 | Revision 3 | Register projection | Difference |
|---|---|---|---|---|
| `datum-proposal-teknis` / ID | 11.5/29 = 39.6 % | 18.5/29 = **63.7 %** | 19.5/29 = 67.2 % | -1.0 pt |
| `datum-proposal-teknis-en` / EN | 13.5/29 = 46.5 % | 20/29 = **68.9 %** | 21/29 = 72.4 % | -1.0 pt |
| `datum-laporan` / ID | 11/28 = 39.2 % | 18/28 = **64.2 %** | 19/28 = 67.8 % | -1.0 pt |
| `datum-laporan-en` / EN | 13/28 = 46.4 % | 19.5/28 = **69.6 %** | 20.5/28 = 73.2 % | -1.0 pt |
| `datum-laporan-verifikasi` / ID | 11/28 = 39.2 % | 18/28 = **64.2 %** | 19/28 = 67.8 % | -1.0 pt |
| `datum-laporan-verifikasi-en` / EN | 13/28 = 46.4 % | 19.5/28 = **69.6 %** | 20.5/28 = 73.2 % | -1.0 pt |
| `datum-standar` / ID | 11.5/29 = 39.6 % | 19/29 = **65.5 %** | 20/29 = 68.9 % | -1.0 pt |
| `datum-standar-en` / EN | 13.5/29 = 46.5 % | 20.5/29 = **70.6 %** | 21.5/29 = 74.1 % | -1.0 pt |
| `datum-nota` / ID | 6.5/16 = 40.6 % | 8.5/16 = **53.1 %** | 9.5/16 = 59.3 % | -1.0 pt |
| `datum-nota-en` / EN | 7.5/16 = 46.8 % | 9.5/16 = **59.3 %** | 10.5/16 = 65.6 % | -1.0 pt |

**Why every pair is exactly 1.0 point below the projection:**
- GF-08 stays P (-0.5): inherited measured role formats plus the R-74 caption leading.
- GF-21 stays P (-0.5): multi-line rows and boxes.
- Every other cell the register projected landed as projected, including the three named downside risks:
  - K-5 RB-08c: judged C, because USER settled N (D-639);
  - K-6 CV-15: both paths closed;
  - K-7 CL-02 NOTA: the line sits under the only printed number.
- The register's GF-19 upside (reading DT-05 by its test line) was not taken, per D-631.

**Notes for the controller:**
- (a) The C32 score reports were produced against the revision 2 JSON. They print "cakupan butir 39.3 %" for 11/28 (`C:/tmp/c32/score/datum-laporan_ID.md:5, 72`), which is a rounded display; truncated it is 39.2 %. A re-score with this JSON gives the revision 3 values.
- (b) The C32 feature-regex gap for the NOTA-EN classification line (above) affects only the feature summary, not the score.

## Revision 2 (after G-FIX 1) - history

**Why this revision exists:** G-FIX 1 (D-606) changed `src/lib/studio/engine/front/texts.ts` and `prisma/seed-doc-type-templates.ts`, and DEV now holds version 2 of the 10 templates. The fix report also showed that assumption A2 of revision 1 was false: the `datum-gsp-preset` profile does not keep registry defaults. I re-judged all 39 rows against the current code and data with the same strict rule as before. I also applied the A2 correction to every point, not only to the two keys the fix report named. That turned up one downgrade (GF-08).

**Changed cells (29 cells, 4 points):**

| Point | Cells | Old -> new | Cause | Evidence |
|---|---|---|---|---|
| LB-08 | PT-en, LAP-en, VER-en, STD-en, NOT-en (5) | N -> **C** | G-FIX 1 (a): the EN appendix word is now "Annex" in the single text table. Every print site goes through that table: the opener kicker (caps role, so `ANNEX A`), the TOC and part-divider label, the DOCX running head, and HTML | `src/lib/studio/engine/front/texts.ts:82-83` (`appendix: { ID: "Lampiran", EN: "Annex" }`), `texts.ts:153-155, 166-169, 185-198`; DOCX `src/lib/studio/engine/docx/wrapper/pages.ts:143, 593`, `src/lib/studio/engine/docx/package/header-footer.ts:98`; HTML `src/lib/studio/engine/html/blocks/wrapper.ts:420`, `html/blocks/text.ts:333-335`. No other "Appendix" literal is left in `src/lib/studio` (grep; only a stale comment at `html/blocks/text.ts:326`). Scorer LB-03 accepts ANNEX (`benchmark/datum_conformance/rules/expect_language.ts:168-169`) |
| LB-07 | PT-en, LAP-en, VER-en, STD-en (4) | P -> **C** | G-FIX 1 (b): for an EN document in an EN wrapper, BAHASA prints "English (UK)" | `texts.ts:233-240` (`LANGUAGE_VALUE_TEXT.EN.EN = "English (UK)"`), used at `texts.ts:256`. Boundary: see the LB-07 row (the explicit MCP cover block has no BAHASA field) |
| GF-17 | all 10 | P -> **C** | **A2 correction, not an output change.** The preset already sets `table.zebra.minRows` 1000 (`benchmark/manual000/template.json:882`, inherited because the GSP preset pins every baseline key that differs from the registry, `prisma/seed-studio.ts:33-45`). G-FIX 1 (d) copied the same value into the shared spec layer. Zebra therefore never turns on for tables of 1000 body rows or fewer, and tints stay 15/30 | `prisma/seed-doc-type-templates.ts:44`; readers `src/lib/studio/engine/docx/tables/render.ts:495-497`, `src/lib/studio/engine/html/tables/table.ts:334`; fix report "Correction" and Finding 1 |
| GF-08 | all 10 | C -> **P** | **A2 correction found in this revision.** Table 8.2 values live in the registry, but the scale sizes are class B with the reference pinned by the preset (`src/lib/studio/params/color-type.ts:13`). `datum-gsp-preset` pins the Manual 000 measured values: numerals 7 pt (manual 7.8), header 6.5 pt +0.0923 em (manual 6.8 pt +0.09 em), caption 7.5/11 (manual 7.6/11). Faces, weights, colours, caps, tabular figures and the caption leading match. The spec layer does not override them | `benchmark/manual000/template.json:845-849`; stored datum-gsp v1 baseline `docs/.../test/sr36_baseline_datum_gsp_v1.json:1165, 1666, 1972`; pinning `prisma/seed-studio.ts:33-45, 553-576`; "sama" (pinned unchanged) `research/09_param_surface_design.md:448-450`; spec layer `prisma/seed-doc-type-templates.ts:40-45`; DOCX reads the param `engine/docx/tables/render.ts:188` |

**Evidence changed, cell unchanged (revision 2):** GF-24 (P: `framePr` per-paragraph rail, D-342), CV-19 (P: preset placements cover only), CL-02 (P/N: explicit pair only). Line references in this history section are as of revision 2.

**Display correction (revision 2):** all percentages are truncated to one decimal, per "satu desimal tanpa pembulatan ke atas (84,96 = gagal)" (`research/31_datum_rev_a_names_register.md:257`).

| Pair | Revision 1 | Revision 2 |
|---|---|---|
| `datum-proposal-teknis` / ID | 11.5/29 = 39.6 % | 11.5/29 = 39.6 % |
| `datum-proposal-teknis-en` / EN | 12/29 = 41.3 % | 13.5/29 = 46.5 % |
| `datum-laporan` / ID | 11/28 = 39.2 % | 11/28 = 39.2 % |
| `datum-laporan-en` / EN | 11.5/28 = 41.0 % | 13/28 = 46.4 % |
| `datum-laporan-verifikasi` / ID | 11/28 = 39.2 % | 11/28 = 39.2 % |
| `datum-laporan-verifikasi-en` / EN | 11.5/28 = 41.0 % | 13/28 = 46.4 % |
| `datum-standar` / ID | 11.5/29 = 39.6 % | 11.5/29 = 39.6 % |
| `datum-standar-en` / EN | 12/29 = 41.3 % | 13.5/29 = 46.5 % |
| `datum-nota` / ID | 6.5/16 = 40.6 % | 6.5/16 = 40.6 % |
| `datum-nota-en` / EN | 6.5/16 = 40.6 % | 7.5/16 = 46.8 % |

## 1. Summary (revision 3)

| Pair (slug / language) | Applicable | Covered | Partial | Not covered | Coverage | >= 85 %? | If every partial counted as full |
|---|---|---|---|---|---|---|---|
| `datum-proposal-teknis` / ID | 29 | 12 | 13 | 4 | **63.7 %** (18.5/29) | no | 86.2 % |
| `datum-proposal-teknis-en` / EN | 29 | 14 | 12 | 3 | **68.9 %** (20/29) | no | 89.6 % |
| `datum-laporan` / ID | 28 | 12 | 12 | 4 | **64.2 %** (18/28) | no | 85.7 % |
| `datum-laporan-en` / EN | 28 | 14 | 11 | 3 | **69.6 %** (19.5/28) | no | 89.2 % |
| `datum-laporan-verifikasi` / ID | 28 | 12 | 12 | 4 | **64.2 %** (18/28) | no | 85.7 % |
| `datum-laporan-verifikasi-en` / EN | 28 | 14 | 11 | 3 | **69.6 %** (19.5/28) | no | 89.2 % |
| `datum-standar` / ID | 29 | 13 | 12 | 4 | **65.5 %** (19/29) | no | 86.2 % |
| `datum-standar-en` / EN | 29 | 15 | 11 | 3 | **70.6 %** (20.5/29) | no | 89.6 % |
| `datum-nota` / ID | 16 | 5 | 7 | 4 | **53.1 %** (8.5/16) | no | 75.0 % |
| `datum-nota-en` / EN | 16 | 6 | 7 | 3 | **59.3 %** (9.5/16) | no | 81.2 % |

**Scoring convention (unchanged):** coverage = (covered x 1 + partial x 0.5 + not covered x 0) / applicable. "Not applicable" and "out of scope" (§4) leave the denominator. The value is computed exactly and truncated to one decimal (`research/31_datum_rev_a_names_register.md:257`).

**Finding:**
- Gains from the round:
  - ID T/S pairs: +7.0 points (+7.5 on STD);
  - EN T/S pairs: +6.5 points (+7.0 on STD-en);
  - NOTA pairs: +2.0 points.
- No pair reaches 85 %, consistent with D-608 and D-627 Q1.
- With partials counted as full, the 8 T/S pairs would pass 85 %. The strict gap is therefore mostly half-covered points (11 to 13 per T/S pair), not missing mechanisms.
- The not-covered T/S cells left are 4 per ID pair (CV-21, NU-06, NC-05, LB-12) and 3 per EN pair (NU-06, NC-07, LB-12). All are excluded, skipped or agent-dependent by decision (§9).

## 2. Method, scope and assumptions (5W1H)

- **What:** the 39 coverage-only points of `research/32` §14 (33 in scope, 6 out of scope), judged against the 10 template x language pairs of `research/31` §1.
- **Who:** consumers are C32 (DEV gate), C36 (DEV verification) and C37 (round report), via the scorer's `--coverage` option. Under D-608 and D-627 Q1 the figure is informational. The decision owner is the controller, or USER via the controller.
- **When:** code at the working tree on 2026-11-05 after D-643; DEV templates v3 on `datum-gsp-rev-a-preset` v1 (`_render_summary.json` `templateVersion: 3`).
- **How:** each point was checked against:
  - (a) the template spec data, `prisma/seed-doc-type-templates.ts`: shared layer `:72-91`, type layers `:140, 150`, language layers `:175, 195`, preset slug `:33`;
  - (b) the effective inherited values = registry defaults < `datum-gsp-preset` pinned baseline **and its role formats** < Rev A preset pins (`prisma/seed-derived-presets.ts:30-35`) < spec layers;
  - (c) engine behaviour in `src/lib/studio/**`;
  - (d) the MCP client (`scripts/studio/mcp/write-client.ts`);
  - (e) lint only where it runs;
  - (f) the C32 DEV PDFs and scores, where they show the element.
- **Strictness rule (unchanged):**
  - **Covered** = concrete code or data produces the manual's requirement for that pair without the agent supplying it.
  - **Partial** = some of the point is produced or checked, but a required part is missing, differs, depends on optional agent input, or is only reported by lint.
  - **Not covered** = nothing produces or checks it, or the engine produces something different.
  - **Boundary conditions** of a covered cell are written in its row. A boundary that needs an unusual input (e.g. GF-17's >1000 rows, LB-07's and CL-02's explicit MCP block) keeps C. A gap hit by ordinary content (GF-21 wrapped table rows) makes it P.
- **Assumptions:**
  - (A1) The working tree is the state reported by the ten implementer reports and D-643 (suite 5031 / 5093 passed, baseline 8/8 SAME + 4 INFO).
  - (A2, extended) Effective values include the role formats the preset chain carries, not only params. I added this after finding that measured role formats override the catalog type scale (GF-08). I checked no other changed cell against role formats, because the other opt-ins either act after the role layer (CV-20 `formats.ts:422`, CV-15/CL-02 text values) or are confirmed in the C32 PDFs and scores.
  - (A3) There is no preset `logo` override (unchanged).
- **Alternatives considered:**
  - GF-21 C (accepting the wrapped-row boundary like GF-17's): rejected, because rows that wrap are ordinary in engineering tables, and the implementer states the page is off-grid.
  - GF-19 C under the DT-05 test line: rejected per D-631.
- **Gaps:** DOCX XML was not extracted in this session, so GF-08 rests on code and seed data. NOTA-EN classification line text was not captured by the C32 feature regex. HTML parity for R-74/R-75 (C22b) has no report in the inputs. The matrix judges the DOCX/PDF deliverable.

## 3. Matrix

Codes: **C** covered (1), **P** partial (0.5), **N** not covered (0), **NA** not applicable, **OOS** out of scope (§4). Pair columns: PT = `datum-proposal-teknis` (SERAH), LAP = `datum-laporan` (TERBIT), VER = `datum-laporan-verifikasi` (TERBIT), STD = `datum-standar` (TERBIT), NOT = `datum-nota` (NOTA); suffix `-en` = EN. Cells changed in revision 3 are marked with `*`; revision 2 markers were removed (see its history note).

| Code | Point | Manual | Where covered (evidence) | PT | PT-en | LAP | LAP-en | VER | VER-en | STD | STD-en | NOT | NOT-en |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CV-14 | Remaining cover control-block fields (pages, geodetic datum, verification) | `ID:2486-2487` vs specimen `ID:15-18`; `EN:2558-2559` vs `EN:15-18` | The 10 print 8 fields: number, revision, KLASIFIKASI, preparer, custodian, audience, TIER, BAHASA (`seed-doc-type-templates.ts:80`). DASAR was dropped to keep 4 x 2 (D-635 (3)); score LB-01 shows 6 labels in the gate. The prose fields "halaman, datum geodetik, verifikasi" are not in the enum (`params/page.ts`, `COVER_CONTROL_FIELD_ENUM`). The explicit MCP block still replaces the auto block when the agent sends `meta.number` (`write-client.ts:194-196`) | P | P | P | P | P | P | P | P | NA | NA |
| CV-15 | Preparer value always "Divisi Engineering PT GSP" / "Engineering Division, PT GSP" | `ID:2487`; `EN:2558` (also `EN:16`) | R-79 language-layer values (`seed-doc-type-templates.ts:175, 195`); auto block `texts.ts:306-313, 325`; explicit MCP block substituted at compose (`compose/front.ts:107-115`; D-639 (2)). `meta.author` stays in signatures and revision rows | C* | C* | C* | C* | C* | C* | C* | C* | NA | NA |
| CV-19 | Spine string also on dividers and back cover | DT-13f `ID:2718-2723`; `EN:2766`, `EN:2778-2783` | Placements cover margin + dividers + back cover (`seed-doc-type-templates.ts:81`); predicate `pages.ts:119-133`; back-cover unit `units.ts:387-393` (HTML C22). PDF: last page = spine string on 8 T/S. Boundary: dividers appear only in documents with parts (none in the C32 content) | C* | C* | C* | C* | C* | C* | C* | C* | NA | NA |
| CV-20 | Cover title line <= 150 mm | `ID:2480`; `EN:2552` | R-70 = 150 -> right indent 907 tw on both title roles, applied after the template role layer (`formats.ts:388, 422`); HTML on `<h1>` (C22) | C* | C* | C* | C* | C* | C* | C* | C* | NA | NA |
| CV-21 | Logo colour per edition (ID seal, EN black) | `ID:2545-2547`; `EN:2611`, `EN:2643` | Default logo black (`engine/docx/wrapper/media.ts:273-283`); no seal asset. Seal logo skipped by USER (D-627 Q3). EN = C; ID = N | N | C | N | C | N | C | N | C | NA | NA |
| CS-06 | Three signature columns | `ID:2501`; `EN:2570` | R-68 (`seed-doc-type-templates.ts:77`); `filledSignature` (`wrapper/render.ts:527, 551`) places roles by label and pads to three. PDF and score LB-06: three roles on 8 T/S. Names stay optional agent input (empty holder lines) | C* | C* | C* | C* | C* | C* | C* | C* | NA | NA |
| CS-08 | Three-layer verification chain | `ID:2500-2501`, specimen `ID:37-54`; `EN:2569` | Manual form prints `[layer, "", "", ""]` (`compose/front.ts:147`), with 1-3 layers from the payload (`write-client.ts:207-211`). METODE/OBJEK/HASIL have no source (U3; D-627 Q8). Names, roles and dates left this table (K-10) | P | P | P | P | P | P | P | P | NA | NA |
| CS-09 | Method statement | `ID:2501`; `EN:2570` | Rendered only when the agent sends `meta.method` (`compose/front.ts:152`). No enforcement opt-in in this round | P | P | P | P | P | P | P | P | NA | NA |
| CS-11 | Manual control-sheet columns (STATUS; METODE/OBJEK/HASIL; MEDIA/KEMBALI) | `ID:29, 39, 58`; `EN:29, 38, 62` | R-69 `manual` (`seed-doc-type-templates.ts:78`); heads and derived STATUS (`compose/front.ts:135-160, 172-176, 194-196`). Score CS-04 manual form pass on 8 T/S. Column cells without a payload source print empty (CS-08 / distribution content) | C* | C* | C* | C* | C* | C* | C* | C* | NA | NA |
| CS-12 | Control-sheet subtitle "Kendali dokumen, riwayat revisi, dan pernyataan verifikasi" / EN | `ID:25`; `EN:25` | R-67 (`seed-doc-type-templates.ts:76`); DOCX `pages.ts:303`; HTML C22. PDF `subtitle: true` on 8 T/S | C* | C* | C* | C* | C* | C* | C* | C* | NA | NA |
| RB-08c | Sheet numbering restart at Chapter 1 | `ID:2510-2511` vs practice `ID:304` | R-80 `bab1`, ID layer only (`seed-doc-type-templates.ts:175`); `w:pgNumType w:start="1"` on the first chapter section (`header-footer.ts:649`; `section.ts:246`). PDF `LEMBAR 1/2 DARI 7` on pages 4-5. Ambiguity settled by USER (D-627 Q4). Boundary: N = whole-document NUMPAGES; LibreOffice adds a hidden parity page when Chapter 1 starts on an even page (6-page PDF shows "DARI 7"). USER accepted it (D-639 (1)). ID T/S only | C* | NA | C* | NA | C* | NA | C* | NA | NA | NA |
| GF-08 | Table numeral, table header, caption type scale | Tabel 8.2 `ID:2633-2635`; `EN:2703-2705` | Rev A preset pins 7.8 / 6.8 / 7.6 + 0.09 em (`seed-derived-presets.ts:30-35`). The inherited measured role formats print caption 7.5, header 6.5, numerals 7.5 / mono 7 pt (`template.json:1500-1506, 2260-2268, 2401-2409, 2441-2447, 2299-2305`) and win over the catalog scale (`roles.ts:4-11, 170-177`; `tables/style.ts:196-207`; `tables/render.ts:476-483`). R-74 also snaps the caption leading 11 -> 13.5 pt (`rhythm.ts:53`; `tables/render.ts:105-113`). The pins reach only the width solver (`tables/render.ts:218`). DOCX half-points cannot express 7.6/7.8/6.8 exactly (nearest 7.5/8/7) | P | P | P | P | P | P | P | P | P | P |
| GF-17 | Only 15 % / 30 % tints, printed documents without zebra | DT-11b `ID:2749-2754`; `EN:2810-2815` | Tints `[15, 30]`; `table.zebra.minRows` 1000 in the shared layer (`seed-doc-type-templates.ts:89`) and the inherited preset. Boundary: >1000 body rows would get zebra | C | C | C | C | C | C | C | C | C | C |
| GF-18 | Photocopy test by a non-author reviewer | DT-11c `ID:2756-2762`; `EN:2817-2823` | Human review process; see §4 | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS |
| GF-19 | Background #FCFCFB / #FBFAF7 | DT-05 `ID:2528-2533`; `EN:2591-2597` | R-71: DOCX `w:background` = `color.interior.paper` + `w:displayBackgroundShape` (`parts.ts:248-260, 291`). PDF fill FCFCFB on every page, so wrapper pages do not get FBFAF7. One colour per document (D-631) | P | P | P | P | P | P | P | P | P | P |
| GF-20 | Colour limits per page and per chart | DT-06 `ID:2535-2540`; `EN:2599-2608` | Lints DATUM-14/25/12 only; "<= 2 meaning colours per page" not checked (unchanged) | P | P | P | P | P | P | P | P | P | P |
| GF-21 | 13.5 pt rhythm and 66-80 character line | DT-10b `ID:2680-2685`; `EN:2748-2753` | R-74 snaps headings, figures, captions and table rows (`rhythm.ts:6-15`; `tables/render.ts:623-626`); body 270 exact (score GF-06). The 128 mm measure gives 66-80 characters (engine E median 76/77; PDF widest body line 128.8 mm). Rows get only `atLeast` k x 270 from a single-line estimate, so a body row that wraps (2 lines = 610 tw) is off the multiple, and boxes are not snapped (engine E Persistent Issues) | P | P | P | P | P | P | P | P | P | P |
| GF-22 | Letterhead colour samples in PDF (seal band, header rule, register top rule = RGB 110,20,32 +-3) | DT-13d `ID:2588-2594`; `EN:2660-2666` | Seal band fill 6E1420 (unchanged); R-72/R-73 = 6E1420 (`seed-doc-type-templates.ts:73-74`), header override over the preset border (`header-footer.ts:92`), register top `header-footer.ts:74`. Scores RH-03 and RB-05 pass with 6E1420 | C* | C* | C* | C* | C* | C* | C* | C* | NA | NA |
| GF-23 | Datum Rule ticks >= 0.18 mm | DT-13f `ID:2718-2720`; `EN:2777-2781` | Ticks 0.212 mm (`engine/docx/wrapper/media.ts:123, 142-164`); R-74 pads the paragraph and does not rescale the image | C | C | C | C | C | C | C | C | C | C |
| GF-24 | Evidence rail in the outer 32 mm column of interior pages | `EN:2764`; legend `ID:2705-2711` | R-75 (`seed-doc-type-templates.ts:82`): interior body paragraphs narrowed by 2154 tw (`rail.ts:76, 104-105`), margins unchanged (GF-02/03 pass). PDF body right edge 152.8 mm on all 10. Boundary: the appendix opener title (wrapper `pages.ts`) is not narrowed; full-span 166 mm tables and figures cross the rail, as the manual allows | C* | C* | C* | C* | C* | C* | C* | C* | C* | C* |
| NU-06 | Bilingual pair shares number, revision, classification, table numbers | PK-13 `EN:422-429`, `EN:533` | No pair link; excluded from the round (D-627) | N | N | N | N | N | N | N | N | N | N |
| NU-08 | Revision scheme Draf 1, Draf 2, RevA | `ID:515-516`; `EN:538-539` | Letter revisions only (`write-client.ts:105-107`); draft states excluded (D-627) | P | P | P | P | P | P | P | P | P | P |
| NU-09 | Number from the Register Induk before building; `XXX` holds release | DT-04a `ID:508-513`; `EN:535-541` | Server number at ingest; reservation excluded (D-627) | P | P | P | P | P | P | P | P | NA | NA |
| TR-05 | Four SERAH obligations | PK-06 `ID:422-444`; `EN:467-479` | Tools exist; obligations are agent content; lints report only (unchanged). SERAH only | P | P | NA | NA | NA | NA | NA | NA | NA | NA |
| TR-07 | NOTA file named title + ISO date | Tabel 2.3 `ID:487-493`; `EN:518-523` | R-78 `judulTanggalIso`, NOT layer (`seed-doc-type-templates.ts:150`); artifact `fileName` `<title> <YYYY-MM-DD>.<ext>` (`paths.ts:215-233`; `render/pure/render.ts:365-382`); `issueDate` always set (`write-client.ts:85`). Boundary: the AM-09 delivery name `finalFileName` keeps its system form on every tier. NOTA only | NA | NA | NA | NA | NA | NA | NA | NA | C* | C* |
| NC-05 | English annex in an ID document opens with the convention line | `ID:2005-2006`; `EN:2081-2082` | Nothing in the engine; agent content (D-627 Q8). ID documents only | N | NA | N | NA | N | NA | N | NA | N | NA |
| NC-06 | Money form in prose (one form per file; ISO 4217) | DT-30g `ID:1940-1942`; `EN:2024-2028` | Register-bound money only; prose is agent text (unchanged) | P | P | P | P | P | P | P | P | P | P |
| NC-07 | Terbilang / "In words:" under every binding sum, generated from the figure | DT-31b `ID:1950-1956`; `EN:2030-2036` | No generator; lint D05 for ID T/S only; not in the round (D-627 Q8). ID T/S = P; ID NOTA = N; EN = N | P | N | P | N | P | N | P | N | N | N |
| LB-07 | Language value "English (UK)" | `EN:18` (also `EN:883`) | Auto block BAHASA, still in the 8-field list (`seed-doc-type-templates.ts:80`; `texts.ts:330`). Boundary: the explicit MCP block has no BAHASA field. EN T/S only | NA | C | NA | C | NA | C | NA | C | NA | NA |
| LB-08 | "Annex" for EN appendices | `EN:223-247`, `EN:4326`, `EN:4441` | `WRAPPER_TEXT.appendix.EN = "Annex"` (unchanged). EN only | NA | C | NA | C | NA | C | NA | C | NA | C |
| LB-12 | Prevailing version named in the front matter of both versions | PK-12 `EN:415-420` | Depends on the pair link; excluded (D-627) | N | N | N | N | N | N | N | N | N | N |
| LB-13 | EN-L1-13 statement for ministries | `EN:1350-1352` | Chapter 5 expert-style rule; see §4 | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS |
| CL-02 | "Klasifikasi:" line below the number | DT-28c `ID:611-612`; `EN:647-648` | T/S: KLASIFIKASI third in the 8-field list, so it lands in row 2 left under the number (`seed-doc-type-templates.ts:80`; `texts.ts:332`; score LB-01). The value defaults to `classification.level` "Terbatas" (`merge.ts:86`; `apparatus.ts:265`). NOTA: R-76 line under the register number cell (`header-footer.ts:379-393`); PDF ID `Klasifikasi : TERBATAS`. Boundary: when the agent sends `meta.number` without `classification`, the explicit MCP block carries no classification pair (`write-client.ts:196`), the same boundary as LB-07 | C* | C* | C* | C* | C* | C* | C* | C* | C* | C* |
| CL-03 | Classification scheme per recipient | DT-28a/b `ID:566-607`; `EN:590-625` | ANRI only (D-590); not in the round (D-627 Q7) | P | P | P | P | P | P | P | P | P | P |
| ST-01 | Rule index (STD) | `ID:235`, `ID:4517`; `EN:240`, `EN:4441` | R-77, STD layer (`seed-doc-type-templates.ts:140`); index built from rule codes in the content, DOCX and HTML from one builder (`rule-index.ts:186, 272`; `units.ts:358-362`). Boundary: no markers -> optional slot omitted (C32 STD content has none, `ruleIndex: false`). STD only | NA | NA | NA | NA | NA | NA | C* | C* | NA | NA |
| GF-16 | Form values = tokens.json v1.9 | DT-03 `ID:2432-2438`; `EN:2508-2513` | see §4 | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS |
| TR-06 | Release gate per tier | `ID:3868-3869`; `EN:3901-3905` | see §4 | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS |
| NC-08 | Chart number labels in EN documents | `EN:3020` | see §4 | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS |
| CL-04 | GSP COMMERCIAL IN CONFIDENCE | DT-28e/EG-52 `EN:663-673` | see §4 | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS | OOS |

Checksum: 39 rows = 33 in scope + 6 out of scope. Applicability is unchanged from revisions 1 and 2. Changed cells: 7 points x 8 T/S (CV-15, CV-19, CV-20, CS-06, CS-11, CS-12, GF-22) = 56, GF-24 10, CL-02 10, RB-08c 4, ST-01 2, TR-07 2 = **84**.

## 4. Out-of-scope list (leaves the denominator)

Unchanged from revision 1.

| Code | Reason | Basis |
|---|---|---|
| GF-16 | Token audit Rev O vs v2.0.0 deferred by USER/controller | D-590; `research/32` §14 |
| TR-06 | Release gate is a writing process, not template output | `research/32` §14; OS-06 |
| NC-08 | Chart number labels in EN deferred to the next round | Q-C, D-596 |
| CL-04 | Classification scheme fixed to ANRI; per-document or foreign scheme deferred | D-590 |
| GF-18 | DT-11c is a human check by a non-author on every SERAH document (`ID:2756-2762`) | OS-06 |
| LB-13 | EN-L1-13 belongs to Chapter 5 "Layer EN-L1"; OS-01 excludes EN expert style as agent content | OS-01 |

## 5. Gaps (not covered or partial, by cause), revision 3

| Cause | Points | Pairs hit |
|---|---|---|
| Engine mechanism built but output still differs | GF-08 (measured role formats win over the Rev A pins; R-74 changes the caption leading), GF-21 (wrapped table rows and boxes off the 13.5 pt multiple) | all 10 |
| Format limit accepted by decision | GF-19 (one DOCX background per document, D-631) | all 10 |
| Asset skipped by USER | CV-21 ID (D-627 Q3) | 4 ID T/S |
| Excluded from the round by USER | NU-06, LB-12 (pair link), NU-08 (draft states), NU-09 (number reservation) (D-627) | all applicable |
| Agent content, U3 not relaxed (D-627 Q8) | CS-08 (V1/V2/V3 content), NC-05, NC-07, CS-09, TR-05, NC-06 | all applicable |
| Lint only | GF-20 | all 10 |
| Closed enum / decision | CV-14 (prose fields not in the enum; DASAR dropped, D-635 (3)), CL-03 (ANRI only, D-590, D-627 Q7) | T/S; all |

Closed by the round: CS-12, CS-11, CV-20, CV-15 (8 T/S); CS-06, CV-19, GF-22 (8 T/S); CL-02 (all 10); GF-24 (all 10); RB-08c (4 ID T/S); ST-01 (STD pair); TR-07 (NOTA pair).

## 6. Data-only changes: status after the coverage round

| # | Change | Status | Coverage effect |
|---|---|---|---|
| D1 | Shared layer `layout.railMode: "A"` | Applied (G-FIX 1), kept (`seed-doc-type-templates.ts:88`) | GF-24 closed by R-75, not by D1 |
| D2 | Shared layer `table.zebra.minRows` 1000 | Applied (G-FIX 1), kept (`:89`) | GF-17 C (unchanged) |
| D3 | EN "Annex" | Superseded by the text-table route (G-FIX 1) | LB-08 C (unchanged) |
| D4 | Cover title width | **Done as M1 param R-70** (D-605 (1) stands, no template roleFormats) | CV-20 C |
| D5 | Table 8.2 sizes | **Done as M2 preset pins** (`seed-derived-presets.ts:30-35`), but **inert for printed runs** behind the inherited measured role formats; R-74 also changes the caption leading | GF-08 stays P (§9) |
| D6 | Spine placements incl. dividers | **Applied with the back cover** (`seed-doc-type-templates.ts:81`) | CV-19 C |

## 7. Decision status

- D-608 and D-627 Q1 stand: coverage is informational. The release gate is the measured score (>= 85 %, 4/4 critical, 0 clashes per pair). In C32 the measured scores are above 85 % (e.g. `datum-laporan` ID 96.9 %, 64/66, `C:/tmp/c32/score/datum-laporan_ID.md:9`).
- USER decisions applied as recorded: D-627 Q2 (CV-15 fixed unit), Q3 (CV-21 skipped), Q4 and D-639 (1) (`bab1`, "+1 total" accepted), D-631 (GF-19 partial).
- **New information for the controller (no decision taken here):**
  1. **GF-08 is not delivered by M2 alone.** The Rev A preset pins change the resolved params but not the printed table and caption runs. Measured role formats inherited from `datum-gsp-preset` win per sub-object. This was not visible to C21/C23's tests, which assert params, not DOCX runs. It contradicts the register expectation (`research/38` §5.1 GF-08 P -> C).
  2. **R-74 snaps caption line heights**, which conflicts with Table 8.2 caption leading 11 pt. DT-10b does not list captions.
  3. GF-21 remains partial for wrapped table rows. Engine E documented this as out of its brief.

  Each of the three is a candidate G-FIX or follow-up row (§9). None affects the measured gate.

## 8. Machine-readable output

`verification/coverage/datum_point_coverage.json` is updated in place: same schema `datum-point-coverage/v1`, same keys (`schema`, `source`, `generatedAt`, `convention`, `outOfScope`, `pairs[]` with `template`, `language`, `covered`, `applicable`, `counts`). Only `source`, `generatedAt`, `covered` and `counts` changed. It stays in the `pairs` form read by `benchmark/datum_conformance/lib/coverage.ts:36-53`; the loader derives `percent = covered / applicable x 100`.

Plan draft (`masterplan/02_plan_draft.md`) not produced. This is a verification artifact; the follow-up rows in §9 are for the controller to schedule.

## 9. What remains and why (follow-up list after the coverage round)

Scope: every point still P or N in any pair. "Old templates" = the 7 pre-existing templates and their presets, whose output D-590 keeps byte-identical. "Agent input" = a new or newly required payload field (U3, D-594). **Best reachable** is my strict-rule projection if the change is made; it is a hypothesis until re-scored.

### 9.1 Fixable in a small engine/seed follow-up (no USER decision needed)

| Point | Why it is still partial | Change that would cover it | Old templates change? | Agent input? | Best reachable | Gain |
|---|---|---|---|---|---|---|
| GF-08 | Measured role formats inherited from `datum-gsp-preset` (caption 7.5, header 6.5, numerals 7.5 / mono 7 pt) override the catalog sizes the Rev A preset pins (`roles.ts:4-11`). R-74 also snaps the caption leading 11 -> 13.5 pt (`rhythm.ts:53`) | (a) Give `datum-gsp-rev-a-preset` its own role formats for `caption`, `table.headerLeft/Right`, `controlTable.header`, `table.cellNumeralRight`, `table.cellMono` with Table 8.2 run sizes (nearest DOCX half-points 7.5 / 7.0 / 8.0 pt), or drop their `szHalfPt` so the catalog scale applies. This needs the C21 helper to carry role formats and the guard to compare them (the M3 guard defect, research/35 §6, applies to this preset row too). (b) Exclude caption line height from R-74 snapping: keep line 220 and pad the spacing instead. First verify (a) by extracting the run sizes from the C32 DOCX | No (new preset only) | No | C (half-point caveat) | +0.5 all 10 |
| GF-21 | `trHeight atLeast` from a single-line estimate; wrapped rows and device boxes are off the 13.5 pt multiple (engine E Persistent Issues) | Estimate the line count per row and set `atLeast` to the next multiple for multi-line rows; snap derivation/aside box heights. Re-run the clash detector | No (opt-in R-74) | No | C | +0.5 all 10 |

With both fixed, every pair equals the register projection: PT 67.2, PT-en 72.4, LAP/VER 67.8, LAP/VER-en 73.2, STD 68.9, STD-en 74.1, NOT 59.3, NOT-en 65.6 %.

### 9.2 Limited by format or by a recorded decision

| Point | Why it remains | What would change it | Best reachable |
|---|---|---|---|
| GF-19 | One `w:background` per DOCX; wrapper pages show FCFCFB instead of FBFAF7 (D-631) | A page-sized behind-text shape in wrapper headers (engine work, LibreOffice behaviour unproven); or the controller reads DT-05 by its test line ("#FCFCFB atau #FBFAF7", `ID:2531-2533`), which would give C | P (C if re-read: +0.5 all 10) |
| CV-21 ID | Seal logo skipped by USER (D-627 Q3) | Seal-colour logo asset from the brand owner plus a per-language logo param | C (+1 on 4 ID T/S) |
| CV-14 | Prose fields not in the enum; DASAR dropped to keep 4 x 2 (D-635 (3)) | Enum + engine for HALAMAN (page count) and VERIFIKASI (derived); DATUM GEODETIK needs project input | P |
| CL-03 | ANRI only (D-590); not in the round (D-627 Q7) | Per-template recipient scheme | P |

### 9.3 Excluded by USER from this round (D-627)

| Point | Why it remains | Best reachable if taken up |
|---|---|---|
| NU-06 | No bilingual pair link | P (pair declaration is agent input) |
| LB-12 | Depends on NU-06 | C |
| NU-08 | No draft states in the server rev model | C |
| NU-09 | No number reservation / `XXX` hold | C |

### 9.4 Agent content: U3 not relaxed (D-627 Q8), or lint only

| Point | Why it remains | Best reachable |
|---|---|---|
| CS-08 | V1/V2/V3 method/object/result has no payload source; manual columns print empty | P (V2/V3 could be machine-filled from render/lint results; V1 needs a human record) |
| CS-09 | Method statement is agent content; no enforcement | P |
| TR-05 | SERAH obligations are agent content; lints report only | P |
| NC-05 | Convention line for an EN annex in an ID document needs an annex-language flag | P |
| NC-06 | Prose money is agent text | P |
| NC-07 | No terbilang generator; needs a binding-sum marker | P |
| GF-20 | "<= 2 meaning colours per page" not checked; lint only reports | P |

### 9.5 Boundaries recorded on covered cells (for honest reporting)

- RB-08c: "DARI N" can be +1 in LibreOffice PDFs when Chapter 1 starts on an even page (C32: 6-page PDFs show "DARI 7"). Accepted by USER, D-639 (1).
- CL-02 T/S and LB-07: when the agent sends `meta.number`, the explicit MCP cover block carries classification only if sent and never carries BAHASA. The C32 gate used the auto block (LB-01: 6 auto labels).
- CV-15: substituted at compose for both cover paths; the legacy EN label `Author` in old documents is not matched (engine B).
- ST-01: proven by tests only; the C32 STD content has no rule codes, so no index printed.
- GF-24: the appendix opener title is not narrowed. HTML preview parity for R-74/R-75 (C22b) has no report in the inputs.
- TR-07: applies to the artifact `fileName`. The AM-09 delivery `finalFileName` is a separate system name on every tier.
- CL-02 NOTA EN: the PDF text was not captured by the C32 feature regex (`features.py:38` expects " : "). Code path identical to ID.

### 9.6 Projection (hypothesis)

| Scenario | PT | PT-en | LAP/VER | LAP/VER-en | STD | STD-en | NOT | NOT-en |
|---|---|---|---|---|---|---|---|---|
| Revision 3 (measured from code, data and PDFs) | 63.7 | 68.9 | 64.2 | 69.6 | 65.5 | 70.6 | 53.1 | 59.3 |
| + §9.1 (GF-08, GF-21) | 67.2 | 72.4 | 67.8 | 73.2 | 68.9 | 74.1 | 59.3 | 65.6 |
| + GF-19 read by its test line | 68.9 | 74.1 | 69.6 | 75.0 | 70.6 | 75.8 | 62.5 | 68.7 |
| + CV-21 seal logo (ID only) | 72.4 | 74.1 | 73.2 | 75.0 | 74.1 | 75.8 | 62.5 | 68.7 |

Even with every item in 9.1 and 9.2 that has no agent-input dependency, no pair reaches 85 % under the strict rule. The remainder is the USER exclusions (9.3) and agent content (9.4). This supports D-608 and D-627 Q1: gate on the measured score and report coverage as information.
