---
type: requirements
confidence: medium-high
row: C04
point: ST-01
author: data-analyst
date: 2026-11-05
mode: read-only research (no code changed)
---

# 37 - STD rule index derived from existing content (ST-01)

## Source Tasks

- Blueprint row C04, `identification/03_structured_datum_coverage_round.md:182`; the consumer is C17 at `:195`, with the coverage target ST-01 "P -> C" at `:91`.
- User rule U3 / D-594 (`decisions/decisions.md:600`): "Slot indeks aturan STD = AUTO dari isi, tanpa masukan baru". It forbids new payload fields, new slot payload schemas, per-type request formats and per-type guidance.
- D-598 F-3 (`decisions/decisions.md:604`): the `ruleIndex` slot is `required: false` because it emits no DOCX output today.
- D-595 (`decisions/decisions.md:601`): no branching on slug or document type. Behaviour must come from data.

Manual references in this document use the form `ID:<line>` for `C:/Users/TRIAL/gsp-backups/datum-revA-20261104/manual_id.txt` and `EN:<line>` for `manual_en.txt`. The manuals were read as data. Repo paths are relative to `C:/Users/TRIAL/gsp-swarm-hq-v2.1`.

## Exploration & Collection Summary

| Area read | What it shows |
|---|---|
| Manual TOC and Annex B (ID:235-238, ID:4515-4976; EN:240-245, EN:4439-4746) | The index lists every rule code once with its level, a short test and its home chapter. Its source is the document's own rule blocks (ID:4708, EN:4533). |
| Manual rule blocks (ID:253-257, ID:311-334, ID:2718-2723; EN:261-265, EN:823-849) | The code and level sit in the margin beside the first line of a heading or a paragraph. A "UJI/TEST" line follows. |
| Manual code grammar (ID:265-309; EN:272-302) | Code prefixes, level words, the "(PK)" marker, and the rule that a home statement has a level while a citation does not. |
| `src/lib/studio/engine/docx/assemble/units.ts:188-193, 351-368` | The AUTO marker `{mode:"auto"}` with no `entries` is dropped for an optional slot (D-299). An `entries` array with at least one item already defeats the drop. |
| `src/lib/studio/services/compose/snapshot.ts:303-357, 466-470` | Snapshot block addresses: `C` for a chapter, `C.S` for a section head, `C.S.P` for a block. The section head's `content.title` holds the title. The ruleIndex block is `{mode:"auto"}`. |
| `src/lib/studio/contract/types/v2/doc.ts`, `common.ts`, `schema/v2/common.schema.ts:724` | The v2 content blocks and fields. `RuleIndexPayloadV2` is `{type}` only, with no entries field. |
| `scripts/studio/mcp/write-client.ts:386-569`, `src/lib/studio/services/import/inline.ts` | What `studio_write` can emit: paragraphs, lists, tables of type `table`, charts, and subheadings that become sections. It cannot emit rails, asides, `x` or table subtypes. |
| `src/lib/studio/engine/docx/tables/index.ts:18-36`, `tables/presets.ts:49-54` | A `ruleIndex` block without `mode:"auto"` already renders as a DATUM table. The preset gives column 1 role `id`. |
| `src/lib/studio/engine/docx/wrapper/toc-refs.ts:1-43, 366-391`, `wrapper/pages.ts:423` | How the TOC field, bookmarks and `PAGEREF` are written. |
| `src/lib/studio/engine/html/assemble/slots.ts:229-231` | HTML renders the ruleIndex block as an empty `<div>` and logs a warning. HTML has no D-299 omission. |
| `prisma/seed-doc-type-templates.ts:62-66, 84, 119` | Only `datum-standar` and `datum-standar-en` get the slot. Its labels are "Indeks Aturan" and "Rule Index". |

The input data is complete enough to give a verdict. Nothing is `DATA_INCOMPLETE`.

## Overview

The manual builds its rule index from its own rule blocks. Each rule block states its code and level once, in the margin beside the block's first line. Other places cite the code without the level. Studio content already carries the same information as plain text, so the index can be derived by recognising a **home marker**: a rule code followed by a level word at the start of a section title, a paragraph, a list item, or a paragraph rail note. No new payload field is needed. Section titles, paragraphs and list items come through `studio_write` unchanged, and rail notes come through the full v2 JSON path. Each entry gives the code, the level, a summary, and the home chapter, which is what the manual's index shows minus the short-test column. If a document has no markers, the optional slot stays omitted, as it is today (D-299).

**Blocker check:** there is none. Existing text fields carry the markers without a new field. The one limit is about content, not mechanism: the index only fills when authors write rules in the manual's home form. U3 forbids adding guidance to make them do so (D-594).

## Requirements

### R1. Where markers are recognised (existing fields only)

| ID | Carrier (existing field) | Reachable via `studio_write`? | Reachable via full v2 JSON? | In scope |
|---|---|---|---|---|
| M1 | Section title, `SectionV2.title` (`types/v2/doc.ts:260-264`). The snapshot's `section` block holds it as `content.title` (`compose/snapshot.ts:351-353`). | Yes: `{subheading}` becomes a section (`write-client.ts:554-558`). | Yes | Yes |
| M2 | Paragraph text, `ParagraphV2` text or runs (`types/v2/doc.ts:34`), and list item text (`:37-42`) | Yes: a string becomes a paragraph and `{list}` becomes a list (`write-client.ts:544-547, 561-563`). | Yes | Yes |
| M3 | Paragraph or list-item rail note, `RailLineV2` with `kind:"note"` and `text` or `runs` (`types/v2/common.ts:26`). Compose passes it through (`compose/blocks.ts:141-161, 171-172`). | No: the client has no rail input (`write-client.ts:386`). | Yes | Yes (R08 authors only) |
| X1 | Tables of any subtype, including `ruleTable` and `ruleIndex` (`contract/enums.ts:69-81`) | Type `table` only (`write-client.ts:376`) | Yes | **No.** The manual's example tables put codes at the start of rows with no home meaning (EN:963-975, EN:1891-1909), and scanning an index table would re-index an index (ID:4530+). |
| X2 | Aside, monoBlock, derivation, captions, SOURCE lines, chart and diagram text | Partly | Yes | **No.** Asides and examples quote rules, monoBlock is code (KD), and SOURCE lines cite codes ("SOURCE ... EN-L3-06 · DT-30h", EN:819). |
| X3 | Document-level `x` (`types/v2/doc.ts:300`; compose copies it, `compose/snapshot.ts:238`) | No: not in `chapter/v2` (`types/v2/chapter.ts:10-25`) and not emitted by the client | Yes | **No.** Giving a key in `x` a meaning would be a new payload convention, which D-594 forbids. |
| X4 | ruleIndex slot payload | No | `RuleIndexPayloadV2 = {type}` only (`schema/v2/common.schema.ts:724`) | **No.** It has no entries field, and adding one would be a new field. |
| X5 | Front-matter slots (cover, control sheet, signature, TOC), source register, the ruleIndex slot itself | - | - | **No.** Only units of kind `chapter` or `appendix` are scanned. |

The `ruleRef`/`ruleRefs` fields named in the brief are template **parameter and registry metadata**, not content (`contract/types/params.ts:134, 185, 260`; `registry/sections.ts:46-659`). Agents cannot send them, so they cannot carry markers.

### R2. Extraction rule

The rule comes from the manual. "One code is one rule with one level, stated once in its home chapter. Other chapters cite the code without the level" (ID:282-283; EN:286-287 for the first half). A marker is therefore **code + level** in a leading position. A code without a level is a citation and is ignored, for example "(DT-03 di Bab 8)" at ID:327 and "(EN-L3-06)" at EN:826.

Definitions. Matching is case-sensitive and runs on the plain text of the inline content. Build that text from `text`, or join `runs[].t`. Strip leading md-lite `*`, `_` and backtick characters, and treat U+00A0 as a space.

```
CODE   = DT-\d{2}[a-z]?
       | (PK|TB|GA|KD|CH|SM|IL|BP|EG)-\d{2}
       | SG-L\d-\d{2} | EN-L\d-\d{2} | EN-C-\d{2}
LEVEL  = WAJIB | BAKU | ANJURAN | MANDATORY | DEFAULT | ADVISORY
SEP    = optional one of  space | "·" | "•" | "|" | ":" | "," | "—" | "–" | "("   (surrounding spaces allowed)
MARKER = ^ CODE (?![A-Za-z0-9-]) SEP LEVEL ")"? ( "(PK)" )? (?= end | space | . : ; , · • | — – ) )
M1 only: an optional leading section number ^\d{1,3}(\.\d{1,3})*\.?\s+ before CODE
M3: the same MARKER applied to each rail line with kind "note"
```

Each part of the rule rests on evidence:
- **Prefixes.** These are the code families the index actually lists: ID Table 1.2 (ID:290-298) and ID Annex B (ID:4532-4950), and EN Table 1.2 (EN:293-299) and EN Annex B.1-B.3 (EN:4456-4719). Several families are excluded on purpose. `R-nn` and `E-nn` are rulings and machine defects (ID:299; EN:300). `lint nn`, `G1`-`G3`, `N1` and `EL-nn` are checks that "take the level of the rule [they enforce]" (EN:4589-4592; ID:300). `ASM`, `REQ`, `BTS` and "Turunan 3.7a" are apparatus IDs (ID:302). Studio's derivation labels `D-C.n` also start with `D-`, which matches no prefix (`compose/snapshot.ts:334`).
- **Levels.** ID uses WAJIB, BAKU and ANJURAN (ID:271-276). EN uses MANDATORY, DEFAULT and ADVISORY (EN:278-282). Both sets are accepted in every document. The match is upper-case only, so the English prose words "default" and "advisory" never match.
- **(PK).** The working-ruling flag sits in the index's level column ("WAJIB (PK)", ID:4546, ID:4580; EN:4444-4447). In rule blocks it sometimes appears only in the body text, as with DT-13f at ID:2718-2719. The flag is captured only when it follows the level inside the marker. It is not searched for in the body.
- **Leading position only.** The manual pins the code to the first line of a heading or a paragraph (ID:253, ID:311, ID:330, ID:2718; EN:261, EN:823, EN:836, EN:843). Mid-sentence codes are citations (ID:327; EN:839).
- **What survives the client.** `studio_write` passes paragraph strings through `parseInline` without rewriting words (`write-client.ts:19, 546`; `import/inline.ts:563-565`). Subheading numbers of the form `n.n` are stripped only in machine-numbering mode (`write-client.ts:394, 556`), and a code like "DT-01a" matches neither `SUB_NUM`, `SUB_SRC` nor `HEADING_NUM` (`write-client.ts:392-411`). So a code never switches source-numbering mode on and is never stripped.

Accepted forms, for example: "DT-01a WAJIB. Taruh di halaman ...", "**PK-02** · WAJIB — Catat ...", "EG-58 (MANDATORY): Write an email ...", a subheading "1.1 DT-01a WAJIB Aturan pengatur", and a rail note "DT-13f WAJIB".

Rejected forms, for example: "DT-03 di Bab 8 mengalahkan ..." (no level), "lihat DT-05 WAJIB" (not leading), the table row "EG-02 GSP installed ..." (tables are excluded), and "R-31 WAJIB" (prefix excluded).

### R3. What each entry shows

The manual's index columns are KODE, RINGKAS, TINGKAT, UJI SINGKAT and BAB (ID:4530), or CODE, SUMMARY, LEVEL, SHORT TEST and CH (EN:4456). The derived index has four columns.

| Column | Value | Evidence |
|---|---|---|
| Code | The matched code, verbatim | ID:4532; EN:4458 |
| Summary | M1: the title text after the marker. If that is empty, use the first sentence of the section's first paragraph. M2 and M3: the first sentence of the rule text (M2: the text after the marker; M3: the host paragraph). Cut the sentence at the first `.`, `!` or `?` followed by a space or the end. Cap it at 12 words, and add "…" only when cut. | The manual's summary is a condensed first sentence. DT-01a: "Taruh di halaman hanya bukti dan aparatus pembuktinya" (ID:255) becomes "Halaman hanya memuat bukti dan aparatus" (ID:4532). DT-02: ID:408 becomes ID:4536. DT-13f: ID:2718 becomes ID:4580. |
| Level | The matched level word verbatim, plus " (PK)" when captured. It is never translated, because the engine does not rewrite agent content. | ID:4546; EN:4539 ("keeps the code and level it has in the Bahasa edition") |
| Chapter | The home chapter, i.e. the chapter of the block's address `C.S.P` or of the section head `C.S` (`compose/snapshot.ts:339, 353`). Print the outline `label` when source numbering is on (`types/v2/common.ts:79-88`; `compose/snapshot.ts:374-375`), otherwise the chapter key. For appendix units print `WRAPPER_TEXT.appendix[lang]` + key, e.g. "Lampiran A" / "Annex A" (`engine/front/texts.ts:83`). | "bab rumahnya" (ID:4519); "its home chapter" (EN:4443); column BAB/CH (ID:4530; EN:4456) |

The SHORT TEST column is **omitted**. In the manual the test is a separate margin line ("U J I · M A T A ...", ID:256-257; EN:264-265), and Studio has no field for it other than free rail text. Deriving it would need a second heuristic on rail lines. This is recorded as a known gap.

**Page numbers.** Page numbers *can* be fields, using the same mechanism as the TOC. The engine writes `w:bookmarkStart`/`w:bookmarkEnd` around a target (`toc-refs.ts:366-380`) and a `PAGEREF <name> \h` field with an empty cached result (`toc-refs.ts:382-391`). LibreOffice evaluates the field at layout time for PDF, and Word updates it on open when `render.docx.updateFieldsOnOpen` is set (`toc-refs.ts:9-13`). The TOC itself is a `TOC \o` field (`pages.ts:423`), selected by `render.toc.mode` (`units.ts:80, 157-161`).

**Recommendation: no page column in C17.** The manual locates rules by chapter, not page (ID:4519, ID:4530; EN:4443, EN:4456). Page fields would need bookmarks written inside the paragraph and section renderers. That conflicts with the invariant "no other bookmarks are written by the engine" (`toc-refs.ts:27-29`, id base 9000 at `:47`) and touches renderers outside C17's file list. If page numbers are wanted later, use a separate name prefix (e.g. `_StRule_nnn`) and an id base that cannot collide with `9000 + n`, and write bookmarks only when the index has at least one entry.

### R4. Order and duplicates

- **Order by code, not by document position**, following the manual's index order. Family order is DT, PK, TB, EG, GA, SG, EN-L, KD, CH, SM, IL, BP, EN-C. This merges ID B.1/B.2 (ID:4530-4950: DT, then PK, TB, GA, SG, KD, CH, SM, IL, BP) with EN B.1-B.3 (EN:4456-4719: DT; PK, GA, KD, CH, SM, IL; then PK-14, EG, EN-L, EN-C). Within a family, sort numerically on each number part (SG-L1-02 sorts by L1 and then 02), then by letter suffix, with the plain number first (DT-13 < DT-13a < DT-13f).
- **One table, one row per code.** The manual groups ranges of consecutive codes with the same level and home into one row ("diringkas per rentang", ID:4520-4521; EN:4443-4444). The derived index does not group them in this round, because grouping can hide a missing code. This is a known simplification.
- **Duplicates.** A code is listed once (ID:4519 "tepat sekali"; EN:4443 "once"; ID:282 "ditulis sekali di bab rumahnya"). The first marker in document order, by `NormBlock.ordinal` (`units.ts:110-121`), wins. Every later marker with the same code is dropped from the table and logged as a warning (proposed code `RULE_INDEX_DUPLICATE_CODE`) with both addresses. This also applies when the levels differ. The log text names both levels.

### R5. Empty behaviour (no markers)

| Case | Behaviour | Basis |
|---|---|---|
| DOCUMENT render, optional slot (today's STD seed `required: false`, `seed-doc-type-templates.ts:65`), 0 entries | **Omit the section.** The marker stays `{mode:"auto"}` with no entries, so `isEmptyRuleIndexMarker` stays true and stage (c2) removes the unit, logging `OPTIONAL_SLOT_EMPTY_OMITTED` (`units.ts:188-193, 355-368`). The output is identical to today's. | DT-01a: the page holds only evidence and apparatus (ID:255; EN:263). DT-43: an empty rail is correct (ID:4704). An index page that says "no rules" is neither evidence nor apparatus. The manual has an index only because it has rule blocks (ID:4708; EN:4533). |
| SLOT-scope render of `ruleIndex` (preview), or a template that sets the slot `required: true`, 0 entries | One note line from the text table, logged at info level (proposed code `RULE_INDEX_EMPTY`). The unit is already kept in these cases (`units.ts:358-359`). | A preview of a kept unit should explain why it is blank rather than render a blank page. |
| 1 or more entries | Heading plus table (R6). `entries.length > 0` disables the D-299 drop (`units.ts:191-192`). | - |

Recommendation: **omit**, which is the first row. An empty-state line appears only where the unit is already forced to render.

### R6. Labels (ID/EN)

New entries go in the single text table `engine/front/texts.ts` (following the `WRAPPER_TEXT` pattern at `:74-86`; D-595, D-597 D-2). The names are to be fixed by C05/C07.

| Key (proposed) | ID | EN | Basis |
|---|---|---|---|
| Section title | Indeks aturan | Rule index | ID:4517; EN:4441 ("Annex B · Rule index"). The seed's UI labels "Indeks Aturan"/"Rule Index" (`seed-doc-type-templates.ts:65, 119`) are title case. The printed form follows the manual's sentence case. |
| Columns | Kode · Ringkas · Tingkat · Bab | Code · Summary · Level · Ch. | ID:4530; EN:4456. The letter case follows `CONTROL_SHEET_COLUMNS` (`texts.ts:109-114`) if the header role applies capitals; C05 confirms this. |
| SOURCE line text | Blok aturan dokumen ini | Rule blocks of this document | Modelled on "SUMBER Blok aturan Bab 1 sampai 13" (ID:4708) and "SOURCE Rule blocks of Chapters 1 to 13" (EN:4533). DATUM tables carry SOURCE (DT-15, ID:4586). |
| Empty-state line (R5 row 2 only) | Dokumen ini tidak memuat kode aturan. | This document states no rule codes. | Proposed wording. Not manual text. |

The level words and codes are content and are never translated (R3).

### R7. HTML

HTML **should** get the same index. Today it emits an empty `<div class="st-ruleindex">` with a warning, and it has no D-299 omission (`engine/html/assemble/slots.ts:229-231`; there is no `planUnits` in `engine/html`). DOCX and HTML would therefore disagree once C17 lands. There is a precedent for sharing: the DOCX TOC outline is a pure builder imported by HTML (`engine/html/blocks/wrapper.ts:46, 433` imports `tocOutline` from `docx/wrapper/toc-refs.ts`). The builder should be a pure function over the snapshot, returning entries, and both renderers should consume it. HTML falls outside C17's file list (`03_structured_datum_coverage_round.md:258`), so either C05 extends C17's HTML ownership or a follow-on row is needed. For 0 entries, HTML should emit nothing, to match DOCX.

## Key Findings

| # | Finding | Confidence | Evidence | Implication |
|---|---|---|---|---|
| F1 | The manual's index is built from its own rule blocks. Each block pins code and level to the first line of a heading or paragraph. | HIGH | ID:4708; EN:4533; ID:253-257, ID:330-334, ID:2718-2723; EN:261-265, EN:823-828 | Leading-position matching mirrors the source structure. |
| F2 | Home statements carry the level; citations do not. | HIGH | ID:282-283; EN:286-287; citations at ID:327, EN:826, EN:839 | Requiring code + level is the main false-positive guard. |
| F3 | `studio_write` can carry markers in subheadings, paragraphs and list items without change. Rails are only reachable through full v2 JSON. | HIGH | `write-client.ts:19, 386, 544-563`; `import/inline.ts:543-565`; `types/v2/common.ts:26`; `compose/blocks.ts:141-172` | No new payload field is needed (U3 holds). |
| F4 | The slot payload cannot hold entries, and `x` would be a new convention. | HIGH | `schema/v2/common.schema.ts:724`; `types/v2/doc.ts:300`; D-594 | The index must be derived and cannot be supplied. |
| F5 | The engine already expects `entries` on the AUTO marker. A non-auto `ruleIndex` block already renders as a DATUM table with an `id` first column. | HIGH | `units.ts:188-193`; `tables/index.ts:18-25`; `tables/presets.ts:49-54` | C17 can fill `entries` and render through the table family without touching the generic table code. The renderer routing is detailed under Recommendations. |
| F6 | Page numbers are technically feasible as PAGEREF fields, but the manual uses chapters. | HIGH | `toc-refs.ts:9-13, 27-29, 366-391`; ID:4519, ID:4530; EN:4443 | A chapter column is enough. Pages are deferred. |
| F7 | No test fixture or gate sample contains marker-form text today. | MEDIUM | Repo search of `tests/` and `verification/dev_gate_r2` for the R2 pattern: 0 hits. `ruleIndex` appears only in `tests/parity/fixtures/{doc,doc/v2}/doc_nota_tables.json` and `src/docs.ts`, as a v1/v2 *table* type. | Baselines should stay SAME. C17 must confirm with 8/8 and convert_v2. |
| F8 | HTML renders an empty div with no omission. | HIGH | `engine/html/assemble/slots.ts:229-231` | There is a parity gap unless HTML gets the shared builder (R7). |
| F9 | The index fills only if authors write home markers, and U3 forbids new per-type guidance to make them do so. | MEDIUM | D-594 (`decisions.md:600`) | ST-01 "C" means the engine generates the index from content. It does not guarantee a non-empty index in practice. |

## Files/Modules Involved

- `src/lib/studio/engine/docx/assemble/units.ts`: call the builder before stage (c2) and replace the content of the AUTO marker (`:188-193, 351-368`).
- New pure builder, e.g. `src/lib/studio/engine/shared/rule-index.ts`. The executor declares the path; it must not be `compose/front.ts` (`03_...:258`). It reads `snapshot.blocks` (types `section`, `paragraph`, `list`; units of kind chapter/appendix) and `snapshot.source` outline labels.
- `src/lib/studio/engine/docx/tables/index.ts:22-25`: routing for auto with entries. This applies only if C17 does not choose the content-swap approach under Recommendations.
- `src/lib/studio/engine/front/texts.ts`: labels from R6, via C07.
- `src/lib/studio/engine/html/assemble/slots.ts:229-231`: HTML parity (R7), subject to C05.
- Unchanged: the content contract (`contract/**`), the MCP client (`scripts/studio/mcp/write-client.ts`), compose (`services/compose/snapshot.ts:466-470`), and the template seed.

## Implementation Order

1. C05/C07: fix the label names (R6) in the text table.
2. C17: TDD the pure builder. Cases: marker forms M1, M2 and M3; rejected forms (no level, not leading, table row, excluded prefix); order; duplicates; summary cut; appendix chapter label; source-numbering label.
3. C17: wire the builder into `units.ts` (fill `entries`) and render the heading, the table and the SOURCE line. Test the empty case: optional slot, DOCUMENT render, 0 entries, gives identical output and `OPTIONAL_SLOT_EMPTY_OMITTED`.
4. Run baseline 8/8 SAME and convert_v2 SAME. Check that `s29-usage-parity` (`tests/unit/studio/compose/s29-usage-parity.test.ts:205, 220`) and `fixserah-front-apparatus` (`tests/unit/studio/renderers/fixserah-front-apparatus.test.ts:154-170`) stay green.
5. Optional, or a follow-on: HTML parity (R7).

Plan draft skipped: C17 is already a blueprint row with its own TDD and verification criteria (`03_...:195`). `masterplan/02_plan_draft.md` is not needed for a research row.

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| False positive: a paragraph opens with a cited code followed by an upper-case level word ("DT-05 WAJIB dilanggar bila ...") | Low | Leading position plus level is the manual's own home signature (ID:282-283). Duplicates are logged. Authors can rephrase. |
| False negative: an author writes the level in lower case or after the summary ("DT-01a: ... (wajib)") | Medium | Accepted. Upper-case levels are the manual's form (ID:271-276; EN:278-282). Widening the match raises the false-positive risk. |
| The summary is cut at an abbreviation ("maks. 166 mm", ID:4556) | Medium | The 12-word cap bounds the damage. It is a display-only column. |
| The table has no caption, while DT-15 asks for a caption above every table (ID:4586) | Medium | A caption would be numbered inside a non-chapter slot unit (`assemble/index.ts:276-287`) and might raise `NUMBERING_MISMATCH`. Recommendation: no caption, with the heading acting as title. C05 decides, and the conformance scorer may flag it. |
| The index is not in the TOC, and it is placed before the appendices, not as Annex B | Known | The slot position comes from the seed (`seed-doc-type-templates.ts:63-65`), and `tocOutline` lists only parts, chapters and appendices (`toc-refs.ts:214-262`). Out of scope. |
| Empty in practice (F9) | Medium | Report ST-01 coverage honestly: the mechanism exists, and entries depend on the content. |
| Two ID/EN level vocabularies in one document | Low | The levels are shown verbatim (agent content). D-593 clash checks apply to wrapper text, which comes from the text table per language. |

## Acceptance Criteria (for C17)

1. Markers M1, M2 and M3 in chapter or appendix units each produce one entry with code, level, summary and chapter as defined in R3. List items behave like paragraphs.
2. None of these produce an entry: a code without a level, a code that is not in the leading position, a code in a table, aside, monoBlock, caption, SOURCE line or front-matter slot, an excluded prefix (`R-`, `E-`, `EL-`, `G1`, `N1`, lint), or `x`.
3. Entries are in the order defined in R4. A duplicate code keeps the first occurrence and logs one warning per extra occurrence, naming both addresses.
4. An optional slot with 0 entries in a DOCUMENT render produces no section, identical to the current output (`OPTIONAL_SLOT_EMPTY_OMITTED` logged). A SLOT-scope render with 0 entries produces the empty-state line.
5. An ID document shows "Indeks aturan" and the ID column heads. An EN document shows "Rule index" and the EN column heads. Neither contains the other language's wrapper words.
6. No contract, schema, MCP-client or seed file is changed (U3). The baseline gives 8/8 SAME and convert_v2 SAME.
7. The builder is pure and deterministic: the same snapshot gives byte-identical entries.

## Recommendations

1. Adopt R2 as specified: code + upper-case level at the start of a section title, paragraph, list item or rail note.
2. Implement it as a pure builder over the snapshot, invoked from `units.ts`. Make the swap minimal: when entries exist, replace the marker's content with a v1 table content of type `ruleIndex` (header row from the text table; columns `id`, `text`, `text`, `text`; SOURCE line), preceded by a heading block. `renderRuleIndex` then takes the existing `renderTableBlock` path (`tables/index.ts:24`) with no routing change, and `isEmptyRuleIndexMarker` is false because `mode` is absent (`units.ts:191-192`). If C17 prefers to keep `mode:"auto"` and add `entries`, then `tables/index.ts:22-25` must route that case to a table render.
3. Keep omission as the empty behaviour (R5). Use the empty-state line only for SLOT-scope renders or a required slot.
4. Use a chapter column and no page fields in this round (R3, F6).
5. Give HTML the same builder (R7). C05 should either add HTML to C17's ownership or open a follow-on row.
6. Report ST-01 as "C (engine derives the index from content markers)", with F9 recorded as the practical limit.
