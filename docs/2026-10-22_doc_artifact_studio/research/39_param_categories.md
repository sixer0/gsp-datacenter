---
type: requirements
confidence: medium-high
row: U01
author: data-analyst
date: 2026-11-05
mode: read-only research (no code changed)
consumers: U02 (category module + test), U03 (ParamEditor), U04 (preview pane), C05 (category of every new coverage param)
---

# 39 - Parameter categories for the template editor (U01)

> **Label update, D-632 (2026-11-05).** Category ids, mapping and counts below are unchanged. Only the display text changed, following the USER's "gunakan istilah umum yang mudah dipahami saja, jangan over translate" (common office words such as grid, chart, file, Word, header and footer; no developer jargon). Category labels that changed: "Kepala & kaki halaman" -> "Header & footer", "Lint & pemeriksaan" -> "Pemeriksaan otomatis", and "Renderer & ekspor" -> "Pembuatan file & ekspor". "Halaman & grid" and "Gambar & chart" stay as they are. Each category's help line is now one short, plain sentence that is shown under the title. Sub-group labels were also reworded, for example "Format run dan penanda butir (DOCX)" -> "Format teks dan bullet di file Word" and "Kiriman konten v1" -> "Format teks isi kiriman", and no sub-group repeats its category name. Categories with one sub-group or 8 or fewer settings are now shown without the sub-group level. The current label tables are in `src/components/studio/template-editor/param-categories.ts`, and the full before/after list is in `delegation_progress/ui_param_categories.md`, section "UX simplification". The label tables further down this document are the original U01 text, kept as a record.

## Source Tasks

- USER request (D-626, `decisions/decisions.md:632`): "tambahan di UI template editor bagian advance grouping formnya perlu diperbaiki, bukan per bab tapi per jenis/kategori saja". The settings form must be grouped by kind/category, not by manual chapter.
- D-627 (`decisions/decisions.md:633`): Q10 = namespace sub-groups in every category. Preview-pane grouping is in scope (U04).
- Blueprint section 7 and row U01 (`identification/03_structured_datum_coverage_round.md:157-162, 231`). The mapping is keyed on `ParamDef.group`, with namespace exceptions. Expected total = `ALL_PARAMS` length, and "Lainnya" = 0.
- **Naming note:** blueprint row U01 names the output `research/39_param_category_mapping.md` (`:231`). The controller's dispatch names it `research/39_param_categories.md`, and this file uses the dispatch name. U02 cites "research/39", so either name resolves.

## Exploration & Collection Summary

| Source read (repo-relative) | What it gives |
|---|---|
| `src/lib/studio/contract/types/params.ts:32-60, 137-142, 159` | The 28 `ParamGroup` values. `chapter` is the current UI grouping, `namespace` is the first key segment, and `surface` is the layer. |
| `src/lib/studio/params/index.ts:8, 34-37, 59-65` | `ALL_PARAMS` = catalog 722 + renderer 45 + structure 21 = **788**. `PARAMS_BY_KEY` is built from it. |
| `params/governance-language.ts:51-415` | 115 keys: P1 4, P3 24, P11 44, P15 31, P16 8, PA/PB/PC/PD 1 each |
| `params/color-type.ts:59-314` | 134 keys: P4C 35 and P4T 99. The P4T total is 18 base + 67 scale + 14 prose. |
| `params/page.ts:63-564` (group = `id.slice(0,3)`, `:51`) | 91 keys: P4G 17, P4R 15, P4S 27, P4V 16, P4K 6, P4A 10 |
| `params/apparatus.ts:49-465` (group = `id.slice(0,2)`, `:30`) | 111 keys: P5 68, P6 43 |
| `params/figure.ts:60-780` | 135 keys: P7 36, P8 2, P9 55, P10 42 |
| `registry/charts.ts:679-707, 1358-1362` | 136 keys `chart.kind.<code>.<name>`, all with group `P7X` and namespace `chart` (`:696-698`) |
| `params/render.ts:21-335` | 45 keys, all group `R`. Namespace defaults to `render` (`:41`). Every key that does not start with `render.` carries an explicit namespace override (`:181, 186, 245, 282, 288, 296, 305, 316, 328`). |
| `params/structure.ts:28-135` | 21 keys, group `R`, namespace = first segment (`:49`) |
| `registry/essentials.ts:63-180` | Surface per ID (explicit lists), P4T scale pattern (`:166-172`), P7X = advanced (`:174`) |
| `components/studio/template-editor/values.ts:94-117`, `template-preview/param-tools.ts:73-129` | Two separate chapter-then-namespace groupers. The first sorts namespaces alphabetically; the second keeps first-appearance order. |
| `template-editor/advanced-panel.tsx:84, 112, 161-162` | The advanced panel passes only `surface === "advanced"` keys. Preset mode passes **all 788**. |
| `template-editor/param-editor.tsx:87, 174-213`; `param-labels.ts:52-117` | Open-state IDs `ch:<chapter>` and `ns:<chapter>:<ns>`, plus today's global namespace label map |
| `research/01_manual_parameter_catalog.md:68-831` | Catalog structure per chapter. The aside is section type S11 (`:851`). Bab 5 is "tabel dan aparatus bukti" and Bab 6 is "kepatuhan, satuan, reproduksi" (`:345, :420`). |

**Method and limitation.** My toolset has no shell, so the suggested `npx tsx -e` dump was **not run**. Every key, group, namespace and surface below comes from reading all eight source arrays line by line. I cross-checked the totals in two ways:

- Per-file counts equal the `*_COUNT` constants: 115 + 134 + 91 + 111 + 135 + 136 + 45 + 21 = 788.
- Per-category surface totals equal totals computed independently from `PARAM_SURFACE_LISTS`: essential 21, advanced 366, derived 72, internal 329 (sum 788).

U02's unit test must pin these counts against the live registry. That test is the mechanical proof.

## Overview

The table below is the single mapping. A key's category is resolved in three steps:

1. Take the exception rows for the key's `group` and use the longest one that matches the key. A row ending in `.` matches by prefix; any other row matches the exact key.
2. If no row matches, use the group default.
3. For group `R` there is no default. A key resolves by namespace, and for namespace `render` by the second key segment. An unmapped R namespace or segment falls to **Lainnya**, so the test fails until someone decides.

Every rule uses only `group` and `key`; `chapter` is never read. Since `namespace === key.split(".")[0]` holds for all 788 keys (see the render.ts row above), a namespace rule is the same as a key-prefix rule.

## Requirements

- R1. Every one of the 788 keys resolves to exactly one of categories 1-14. Lainnya (15) holds 0 keys.
- R2. Category display order is fixed (1-15 below). It does not depend on filters, search or registry order.
- R3. The second level is the namespace sub-group (D-627 Q10). Sub-group labels are scoped to the category, because the same namespace means different things in different categories.
- R4. Data only. There is no change to the registry, contract, server or output (blueprint section 7, Scope).
- R5. Categories with no visible key in the current view are hidden (the advanced panel has none in Bahasa or Lint). Lainnya is never shown when it is empty.

## Category list (final, 15 entries including Lainnya)

| # | id (slug for `ns:`/open-state) | Label | Help line (tooltip) |
|---|---|---|---|
| 1 | `warna` | Warna | Palet pembungkus/interior, peran warna, latar terang/gelap, batas jumlah warna |
| 2 | `tipografi` | Tipografi | Rupa huruf, bobot, skala huruf per unsur, format run |
| 3 | `halaman-grid` | Halaman & grid | Ukuran kertas, margin, kisi, kolom catatan bukti, garis penanda, tebal garis, seksi |
| 4 | `sampul` | Sampul | Unsur dan urutan sampul, teks tepi sampul, identitas organisasi |
| 5 | `lembar-kendali` | Lembar kendali | Riwayat revisi, rantai verifikasi, distribusi, tanda tangan |
| 6 | `kepala-kaki` | Kepala & kaki halaman | Kepala halaman, blok register, pita segel, cap terbit |
| 7 | `tabel` | Tabel | Garis/zebra/kepala tabel, keterangan dan baris sumber, tabel spesifikasi |
| 8 | `gambar-chart` | Gambar & chart | Aturan grafik umum, bawaan per jenis grafik, gambar raster |
| 9 | `diagram-simbol` | Diagram & simbol | Diagram, penghubung, dialek simbol, lembar gambar teknik |
| 10 | `bukti-angka` | **Bukti, angka & satuan** (new) | Tanda provenans, Admiralty, asumsi, turunan, register; pemisah angka, satuan, PPN, AHS, BoQ |
| 11 | `penomoran-klasifikasi` | Penomoran & klasifikasi | Nomor/jenis/revisi dokumen, tier, klasifikasi, pola nama, label bab/lampiran, daftar isi |
| 12 | `bahasa` | Bahasa | Bahasa dokumen, kanal, prosa, surat dinas, kosakata, ambang gaya |
| 13 | `lint-pemeriksaan` | Lint & pemeriksaan | Gerbang rilis, juri, penegakan lint, regulasi, uji fotokopi, tata kelola |
| 14 | `renderer-ekspor` | Renderer & ekspor | Pengaturan berkas DOCX/HTML/PNG, format keluaran, kanal workbook/brief (nonaktif) |
| 15 | `lainnya` | Lainnya | Fallback; must stay empty (test) |

**Changes from the dispatched list, with reasons**

1. **Added "Bukti, angka & satuan" (#10).** Sixty-six keys had no fitting home among the 13:
   - the Bab 5 evidence apparatus: `marks`, `admiralty`, `icd203`, `confidence`, `assumption*`, `requirement`, `derivation`, `register`, `numbers`, `audit`, `serah` (39 keys);
   - the Bab 6 numeral, unit and tax conventions: `numerals`, `units`, `uncertainty`, `currency`, `conventions`, `time`, `ahs`, `vat`, `stampDuty`, `terbilang`, `hps`, `boq` (23 keys);
   - `content.authorClaimMarks`, `sourceRegister.columns` and two `render.derivation.*` keys.

   Without the new category these keys would either end up in Lainnya, which fails R1, or be misfiled under Tabel or Penomoran. Both halves deal with decision-bearing numbers: their marks, register binding, derivation, units and tax. A single merged category keeps the list at 15 entries including Lainnya. Two separate categories would have made 16.
2. **Labels.** "Kepala & kaki halaman" keeps the dispatched parenthetical (register, pita segel, cap terbit) as its help line, not in the label. "Diagram/simbol" becomes "Diagram & simbol". No other category was split or merged.

## Mapping rules

### A. Group defaults (27 groups; R has no default)

| group | Default category | Keys (total in group) | Source |
|---|---|---|---|
| P1 | Lint & pemeriksaan | 4 | governance-language.ts:51-70 |
| P3 | Penomoran & klasifikasi | 24 | :74-128 |
| P4C | Warna | 35 | color-type.ts:59-125 |
| P4T | Tipografi | 99 | color-type.ts:128-312 |
| P4G | Halaman & grid | 17 | page.ts:63-144 |
| P4R | Halaman & grid | 15 | page.ts:148-194 |
| P4S | Kepala & kaki halaman | 27 | page.ts:198-350 |
| P4V | Sampul | 16 | page.ts:380-446 |
| P4K | Lembar kendali | 6 | page.ts:450-511 |
| P4A | Kepala & kaki halaman | 10 | page.ts:515-562 |
| P5 | Bukti, angka & satuan | 68 | apparatus.ts:49-257 |
| P6 | Bukti, angka & satuan | 43 | apparatus.ts:260-463 |
| P7 | Gambar & chart | 36 | figure.ts:60-200 |
| P8 | Gambar & chart | 2 | figure.ts:204-280 |
| P7X | Gambar & chart | 136 | charts.ts:679-707 |
| P9 | Diagram & simbol | 55 | figure.ts:336-450 |
| P10 | Diagram & simbol | 42 | figure.ts:454-777 |
| P11 | Bahasa | 44 | governance-language.ts:132-241 |
| P15 | Renderer & ekspor | 31 | :245-311 |
| P16 | Lint & pemeriksaan | 8 | :315-366 |
| PA | Lint & pemeriksaan | 1 (`rules.index`) | :376 |
| PB | Lint & pemeriksaan | 1 (`checklist.preSerah.items`) | :378 |
| PC | Bahasa | 1 (`glossary.termClasses`) | :402 |
| PD | Bukti, angka & satuan | 1 (`sourceRegister.columns`) | :411 |

### B. Exceptions for catalog groups (30 rows; longest match within the group wins)

| Row | group | Match (`.`-ended = prefix, else exact key) | Category | Keys caught (IDs) | n |
|---|---|---|---|---|---|
| E01 | P1 | `content.` | Bukti, angka & satuan | P1-04 | 1 |
| E02 | P3 | `doc.language` | Bahasa | P3-23 | 1 |
| E03 | P3 | `artifact.format` | Renderer & ekspor | P3-05 | 1 |
| E04 | P3 | `artifact.pdf.` | Renderer & ekspor | P3-06 | 1 |
| E05 | P3 | `artifact.pageReconciliation.` | Lint & pemeriksaan | P3-07 | 1 |
| E06 | P3 | `artifact.lint.` | Lint & pemeriksaan | P3-08 | 1 |
| E07 | P4S | `device.datumRule.` | Halaman & grid | P4S-01..06 | 6 |
| E08 | P4S | `device.evidenceRail.` | Halaman & grid | P4S-07..09 | 3 |
| E09 | P4S | `device.spine.` | Sampul | P4S-20..25 | 6 |
| E10 | P4V | `wrapper.` | Kepala & kaki halaman | P4V-14 | 1 |
| E11 | P4A | `chapter.kicker.` | Penomoran & klasifikasi | P4A-04 | 1 |
| E12 | P4A | `chapter.datumRule.` | Halaman & grid | P4A-05 | 1 |
| E13 | P4A | `caption.` | Tabel | P4A-06 | 1 |
| E14 | P4A | `source.` | Tabel | P4A-07 | 1 |
| E15 | P4A | `table.` | Tabel | P4A-08, 09 | 2 |
| E16 | P5 | `table.` | Tabel | P5-01..16 | 16 |
| E17 | P5 | `caption.` | Tabel | P5-17..20 | 4 |
| E18 | P5 | `caption.chart.` | Gambar & chart | P5-21 | 1 |
| E19 | P5 | `source.` | Tabel | P5-22..24 | 3 |
| E20 | P5 | `artifact.mustBeCalledInProse` | Tabel | P5-25 | 1 |
| E21 | P5 | `specTable.` | Tabel | P5-26, 27 | 2 |
| E22 | P5 | `aside.` | Halaman & grid | P5-28, 29 | 2 |
| E23 | P6 | `classification.` | Penomoran & klasifikasi | P6-01..08 | 8 |
| E24 | P6 | `doc.urgency` | Penomoran & klasifikasi | P6-09 | 1 |
| E25 | P6 | `compliance.` | Lint & pemeriksaan | P6-10..12 | 3 |
| E26 | P6 | `normativeQuote.` | Bahasa | P6-13 | 1 |
| E27 | P6 | `letter.` | Bahasa | P6-14..18 | 5 |
| E28 | P6 | `color.` | Warna | P6-42 | 1 |
| E29 | P6 | `photocopy.` | Lint & pemeriksaan | P6-43 | 1 |
| E30 | P11 | `jury.` | Lint & pemeriksaan | P11-35..40 | 6 |

The rest of each group follows its default. For example, P4S-10..19 and P4S-26..27 land in Kepala & kaki, and P5-30..68 and P6-19..41 land in Bukti, angka & satuan.

### C. Group R (66 keys): namespace table, then the second segment for `render`

| R namespace | Category | IDs | n |
|---|---|---|---|
| `runningHead` | Kepala & kaki halaman | R-26 | 1 |
| `org` | Kepala & kaki halaman | R-27 (`org.shortName`, "blok register", render.ts:184-188) | 1 |
| `lint` | Lint & pemeriksaan | R-35 | 1 |
| `image` | Gambar & chart | R-61, R-63, R-65 | 3 |
| `chart` | Gambar & chart | R-50, R-51, R-56 | 3 |
| `symbolSheet` | Diagram & simbol | R-62, R-64 | 2 |
| `symbol` | Diagram & simbol | R-54 | 1 |
| `diagram` | Diagram & simbol | R-57 | 1 |
| `table` | Tabel | R-55 | 1 |
| `page` | Halaman & grid | R-44, R-45, R-46 | 3 |
| `grid` | Halaman & grid | R-47, R-53 | 2 |
| `doc` | Penomoran & klasifikasi | R-48, R-49 | 2 |
| `appendix` | Penomoran & klasifikasi | R-58 | 1 |
| `toc` | Penomoran & klasifikasi | R-66 | 1 |
| `ingest` | Renderer & ekspor | R-38 | 1 |
| `slot` | Renderer & ekspor; **exact overrides:** `slot.setup` -> Halaman & grid, `slot.placement` -> Lembar kendali | R-43 (default); R-41; R-42 | 3 |
| `render` | by second segment (next table) | 39 keys | 39 |

| `render.<seg>` | Category | IDs | n |
|---|---|---|---|
| `docx` | Renderer & ekspor; **exact override** `render.docx.headerFooterStyles` -> Kepala & kaki | R-01..08, R-31; R-30 | 10 |
| `section` | Halaman & grid; **exact overrides** `render.section.registerBlockLayout` -> Kepala & kaki, `render.section.numberSeparator` -> Penomoran & klasifikasi | R-09, R-10, R-11; R-29; R-33 | 5 |
| `rail` | Halaman & grid | R-12, R-13 | 2 |
| `derivation` | Bukti, angka & satuan | R-14, R-28 | 2 |
| `caption` | Tabel | R-15 | 1 |
| `table` | Tabel | R-16, R-17, R-52 | 3 |
| `specTable` | Tabel | R-34 | 1 |
| `list` | Tipografi | R-20, R-21 | 2 |
| `run` | Tipografi | R-36, R-37, R-40 | 3 |
| `toc` | Penomoran & klasifikasi | R-22, R-59, R-60 | 3 |
| `cover` | Sampul | R-23 | 1 |
| `runningHead` | Kepala & kaki halaman | R-32 | 1 |
| `spacer` | Renderer & ekspor | R-18, R-19 | 2 |
| `html` | Renderer & ekspor | R-24 | 1 |
| `png` | Renderer & ekspor | R-25 | 1 |
| `draft` | Renderer & ekspor | R-39 | 1 |

The R tables sum to 66, which is 45 (render.ts) + 21 (structure.ts).

## Key Findings

| # | Finding | Confidence | Evidence | Implication |
|---|---|---|---|---|
| F1 | `chapter` is the only grouping input today. The two groupers differ on namespace order (alphabetical vs first appearance). | HIGH | values.ts:94-108; param-tools.ts:104-128 | U02 should provide one shared helper so the editor and the preview cannot drift (U03/U04). |
| F2 | `group` alone cannot yield categories. R (66 keys) has no semantic, and P4S, P4A, P5, P6 and P3 each span 3-5 categories. | HIGH | params.ts:32-60; page.ts:198-350, 515-562; apparatus.ts:49-463 | The mapping needs scoped exceptions: 30 catalog rows, the R namespace table and 5 exact R overrides. |
| F3 | `namespace === key.split(".")[0]` holds for every key, including render.ts overrides. | HIGH | the makers at governance-language.ts:43, color-type.ts:44, page.ts:53, apparatus.ts:43, figure.ts:53, structure.ts:49, charts.ts:698; render.ts:41 plus overrides at :181-328 | Prefix rules on `key` and namespace rules are interchangeable. |
| F4 | Preset mode shows all 788 keys and the advanced panel shows the 366 advanced keys. In the advanced view, Bahasa (0) and Lint & pemeriksaan (0) are empty. | HIGH | advanced-panel.tsx:84, 162; essentials.ts:78-102 | R5: hide empty categories. |
| F5 | The same namespace means different things in different categories (`render`, `rules`, `artifact`, `device`, `doc`, `org`, `slot`, `page`, `caption`, `chapter`). The global label `rules: "Aturan"` (param-labels.ts:68) is wrong for P4R line weights. | HIGH | param-labels.ts:52-112; page.ts:148-194 vs governance-language.ts:376 | Sub-group labels must be keyed by (category, namespace), with `namespaceLabel` as the fallback. |
| F6 | Gambar & chart has one 177-key `chart` sub-group, and Tipografi has one 99-key `type` sub-group. Both match today's Bab 7-8 and Bab 4 sizes. | HIGH | charts.ts:1362; color-type.ts:254-279 | No regression, but see the optional split S1 below. |
| F7 | All 788 surfaces resolve; none is `undefined`. | MEDIUM-HIGH (hand-derived) | essentials.ts:63-180; totals reconcile to 788 | Counts can be pinned in the U02 test. |

## Per-category counts by surface

"Other" = derived + internal. Advanced-panel view = the advanced column. Preset-mode view = the total.

| # | Category | Essential | Advanced | Derived | Internal | Other | **Total** |
|---|---|---|---|---|---|---|---|
| 1 | Warna | 1 | 27 | 0 | 8 | 8 | **36** |
| 2 | Tipografi | 1 | 69 | 24 | 10 | 34 | **104** |
| 3 | Halaman & grid | 5 | 23 | 16 | 11 | 27 | **55** |
| 4 | Sampul | 3 | 13 | 2 | 4 | 6 | **22** |
| 5 | Lembar kendali | 1 | 5 | 0 | 1 | 1 | **7** |
| 6 | Kepala & kaki halaman | 1 | 11 | 2 | 8 | 10 | **22** |
| 7 | Tabel | 1 | 15 | 3 | 17 | 20 | **36** |
| 8 | Gambar & chart | 1 | 153 | 4 | 23 | 27 | **181** |
| 9 | Diagram & simbol | 1 | 29 | 6 | 65 | 71 | **101** |
| 10 | Bukti, angka & satuan | 1 | 12 | 7 | 46 | 53 | **66** |
| 11 | Penomoran & klasifikasi | 4 | 8 | 5 | 20 | 25 | **37** |
| 12 | Bahasa | 1 | 0 | 0 | 45 | 45 | **46** |
| 13 | Lint & pemeriksaan | 0 | 0 | 2 | 24 | 26 | **26** |
| 14 | Renderer & ekspor | 0 | 1 | 1 | 47 | 48 | **49** |
| 15 | Lainnya | 0 | 0 | 0 | 0 | 0 | **0** |
| | **Total** | **21** | **366** | **72** | **329** | **401** | **788** |

Cross-check against `PARAM_SURFACE_LISTS`: the essential list has 21 IDs, and the advanced count is 366 = 230 explicit + 136 P7X. The 230 explicit IDs include 46 P4T scale attributes resolved through `scaleAttr`. Derived is 72, including 20 scale sizes and leadings.

## Sub-group labels (category-scoped; order as listed = recommended display order)

Rule: sub-group key = `namespace`. The open-state ID changes from `ns:<chapter>:<ns>` (param-editor.tsx:201) to `ns:<categoryId>:<ns>`. Label = `SUBGROUP_LABEL[categoryId][ns] ?? namespaceLabel(ns)`. A namespace not listed goes after the listed ones, in first-appearance order. Counts are preset-mode totals.

| Category | namespace -> sub-label (n) |
|---|---|
| Warna | `color` Palet dan peran warna (34) · `page` Latar halaman (2) |
| Tipografi | `type` Huruf dan skala huruf (99) · `render` Format run dan penanda butir (DOCX) (5) |
| Halaman & grid | `page` Ukuran dan orientasi kertas (4) · `grid` Kisi dan margin (17) · `layout` Mode kolom catatan bukti (1) · `device` Garis penanda dan kolom catatan bukti (9) · `chapter` Garis penanda bab (1) · `rules` Tebal dan warna garis (15) · `aside` Catatan samping (2) · `slot` Pengaturan seksi per bagian (1) · `render` Seksi dan perender kolom catatan (DOCX) (5) |
| Sampul | `cover` Unsur sampul (13) · `device` Teks tepi sampul (6) · `org` Identitas organisasi (2) · `render` Mode sampul (1) |
| Lembar kendali | `controlSheet` Lembar kendali (6) · `slot` Penempatan tanda tangan (1) |
| Kepala & kaki halaman | `runningHead` Kepala halaman (4) · `wrapper` Kepala halaman pembungkus (1) · `device` Blok register, pita segel, cap terbit (12) · `registerBlock` Posisi blok register (1) · `org` Nama pendek organisasi (1) · `render` Tata letak kepala dan kaki (DOCX) (3) |
| Tabel | `table` Tabel (19) · `caption` Keterangan (caption) (5) · `source` Baris sumber (4) · `artifact` Rujukan di prosa (1) · `specTable` Tabel spesifikasi (2) · `render` Perender tabel (DOCX) (5) |
| Gambar & chart | `chart` Grafik (177) · `caption` Keterangan grafik (1) · `image` Gambar raster (3) |
| Diagram & simbol | `diagram` Diagram (56) · `symbol` Simbol dan dialek (13) · `symbolSheet` Lembar simbol (2) · `sheet` Lembar gambar teknik (5) · `designation` Penandaan IEC 81346 (2) · `iec` Simbol listrik IEC 60617 (2) · `isa` Instrumentasi ISA-5.1 (2) · `mil` Simbol militer MIL-STD-2525 (4) · `iso5807` Diagram alir ISO 5807 (2) · `bpmn` BPMN (1) · `c4` Model C4 (1) · `archimate` ArchiMate (1) · `topology` Topologi jaringan (2) · `lineWeight` Tebal garis ISO 128-2 (2) · `lineType` Jenis garis ISO 128-2 (1) · `rack` Elevasi rak EIA-310 (2) · `labels` Label kabel TIA-606 (1) · `iso7010` Rambu ISO 7010 (1) · `fire` Denah kebakaran (1) |
| Bukti, angka & satuan | `marks` Tanda provenans (13) · `content` Tanda klaim penulis (1) · `admiralty` Skala Admiralty (5) · `icd203` Kemungkinan ICD 203 (2) · `confidence` Label keyakinan (1) · `numbers` Angka beban keputusan (1) · `register` Register kuantitas (2) · `derivation` Blok turunan perhitungan (6) · `render` Perender blok turunan (DOCX) (2) · `audit` Audit angka SERAH (2) · `serah` Rute kedua SERAH (2) · `assumptionRegister` Register asumsi (1) · `assumption` Asumsi (2) · `requirement` ID persyaratan (2) · `sourceRegister` Daftar sumber (1) · `numerals` Pemisah angka (2) · `units` Satuan (5) · `uncertainty` Ketidakpastian (1) · `conventions` Konsistensi konvensi (1) · `time` Zona waktu (1) · `currency` Mata uang (1) · `vat` PPN (4) · `ahs` Analisa harga satuan (AHS) (4) · `hps` HPS (1) · `boq` BoQ (1) · `terbilang` Terbilang (1) · `stampDuty` Bea meterai (1) |
| Penomoran & klasifikasi | `doc` Nomor, jenis, dan revisi dokumen (9) · `artifact` Tier dokumen (4) · `classification` Klasifikasi keamanan (8) · `naming` Pola nama berkas dan ID (8) · `numbering` Lingkup penomoran (1) · `chapter` Label nomor bab (1) · `appendix` Label nomor lampiran (1) · `toc` Daftar isi (1) · `render` Daftar isi dan pemisah nomor (DOCX) (4) |
| Bahasa | `doc` Bahasa, kanal, dan susunan dokumen (11) · `prose` Prosa (4) · `sentence` Kalimat (1) · `paragraph` Paragraf (1) · `list` Daftar butir (1) · `letter` Surat dinas (12) · `lexicon` Kosakata (3) · `glossary` Glosarium (1) · `normativeQuote` Kutipan normatif (1) · `threshold` Ambang diagnosis gaya (11) |
| Lint & pemeriksaan | `gate` Gerbang rilis (8) · `lint` Penegakan lint (1) · `artifact` Lint dan rekonsiliasi per tier (2) · `jury` Juri buta (6) · `checklist` Daftar periksa pra-serah (1) · `photocopy` Uji fotokopi (1) · `compliance` Regulasi berlaku dan mati (3) · `rules` Indeks aturan (1) · `governance` Tata kelola (3) |
| Renderer & ekspor | `render` Berkas DOCX, HTML, PNG (14) · `artifact` Format keluaran dan PDF (2) · `ingest` Kiriman konten v1 (1) · `slot` Teks pengganti draf (1) · `workbook` Lembar kerja xlsx (nonaktif) (18) · `brief` Ringkasan komando pptx (nonaktif) (13) |

Sub-group counts per category equal the category totals: 36, 104, 55, 22, 7, 22, 36, 181, 101, 66, 37, 46, 26, 49.

**Optional refinements. These do not change the category mapping and are for U02/U03 to adopt or skip.**

- **S1, split two very large sub-groups.** In Gambar & chart, `chart.kind.*` (136) becomes "Bawaan per jenis grafik" and the remaining `chart` keys (41) become "Aturan grafik umum". In Tipografi, `type.scale.*` (78) becomes "Skala huruf per unsur" and the remaining `type` keys (21) become "Rupa, bobot, dan aturan huruf". The sub-group key would be the first two segments for these two prefixes only. This is the one deviation from pure namespace grouping, so the controller should confirm it against D-627 Q10.
- **S2, merge labels in Bukti, angka & satuan.** That category has 27 namespaces. A many-to-one label map would cut them to six:
  - Tanda dan keandalan sumber: marks, content, admiralty, icd203, confidence
  - Register, turunan, dan audit: numbers, register, derivation, render, audit, serah
  - Asumsi dan persyaratan: assumptionRegister, assumption, requirement
  - Daftar sumber: sourceRegister
  - Penulisan angka dan satuan: numerals, units, uncertainty, conventions, time, currency
  - Harga, pajak, dan BoQ: vat, ahs, hps, boq, terbilang, stampDuty

## Debatable placements and justification

| # | Keys | Placed in | Alternative | Why this placement |
|---|---|---|---|---|
| D1 | `rules.*` P4R-01..15 | Halaman & grid | Tabel | Tabel 4.5 is one line-weight system used by tables, rail, aside, derivation, running head and diagrams (page.ts:148-194). The photocopy floor and Word ladder apply to every line. Splitting the namespace would scatter one table across categories. |
| D2 | `type.scale.{tableBody,tableNumerals,tableHeader,caption,sourceLine,runningHead,registerBlock}.*`, `type.scale.groupBand/unitColumn.*` | Tipografi | Tabel / Kepala & kaki | They come from one type scale (Tabel 4.4) and follow the base-size knob (`typeScaleFromBase`, color-type.ts:211-214). Editing them apart from the body size breaks the scale. |
| D3 | `page.background`, `page.darkRequestReason` (P4C-23/24) | Warna | Halaman & grid | Light/dark ground is a palette decision (DT-05, color-type.ts:95-101). |
| D4 | `device.datumRule.*`, `chapter.datumRule.*` | Halaman & grid | Kepala & kaki / Sampul | The ticks derive from `grid.subcolumns` and the cover rule width from `grid.fullSpanMm` (page.ts:204-207, 422-425). It is a grid device, not a header or footer. |
| D5 | `device.evidenceRail.*`, `layout.railMode`, `render.rail.*` | Halaman & grid | - | The rail is a grid column (`grid.evidenceRailMm`, page.ts:78-81). |
| D6 | `device.issueStamp.*` (P4S-26/27) | Kepala & kaki | Sampul | This follows the dispatched list ("cap terbit"), although the stamp prints in the cover colophon (P4V-13 fields include "cap terbit", page.ts:378). |
| D7 | `wrapper.header` (P4V-14) | Kepala & kaki | Sampul | It is a page header (label "Kepala halaman pembungkus", page.ts:437). |
| D8 | `org.shortName` (R-27) vs `org.entityName/nib` (P4V-15/16) | Kepala & kaki vs Sampul | all in Sampul | shortName feeds the first register-block cell (render.ts:187). entityName and nib feed the cover colophon. |
| D9 | `caption.*`, `source.*` (P5-17..24, P4A-06/07), `render.caption.separator` | Tabel | own category | DT-15 also covers figures, but the manual places these in the table chapter, and the P4A-06 label reads "Posisi caption tabel" (page.ts:537). `caption.chart.isConclusion` goes to Gambar & chart. |
| D10 | `artifact.mustBeCalledInProse` (P5-25) | Tabel | Bahasa | Its rules are DT-15 together with captions and sources, plus SG-L2-06 (apparatus.ts:104). |
| D11 | `aside.*` (P5-28/29) | Halaman & grid | Tipografi | Both keys are rule or fill settings next to `rules.asideTopMm`. The aside's type sizes stay in Tipografi (S11, research/01:851). |
| D12 | `artifact.tier*`, `artifact.audience.outsideDivision`, `doc.defaultTier` | Penomoran & klasifikasi | Lint & pemeriksaan | Tier is a document identity attribute. It is printed in the cover control block as "TIER" (page.ts:374), like classification. Tier-derived switches are split by function: PDF to Renderer, lint and reconciliation to Lint. |
| D13 | `doc.changeLog.required` (P3-24) | Penomoran & klasifikasi | Lembar kendali | It belongs to the revision rule (3.6) together with `doc.revision`. |
| D14 | `threshold.*` P11-24..34 | Bahasa | Lint & pemeriksaan | These are style-language DIAGNOSIS ceilings (SG-L6). `jury.*` (the release gate, 14.4-14.6) goes to Lint. |
| D15 | P6 `letter.*` (secretariat font and margins) | Bahasa | Tipografi / Halaman & grid | This keeps one "Surat dinas" sub-group together with the P11 `letter.*` salutation keys. |
| D16 | `compliance.*`, `governance.*`, `photocopy.*` | Lint & pemeriksaan | Bukti / own category | Regulation allow/block lists are reviewed checks (DT-29). The precedence and decision-owner rules are internal. The photocopy test is a 16.4 human gate. |
| D17 | P15 `workbook.*`, `brief.*` (31, inactive) | Renderer & ekspor | - | These are the other output channels (xlsx/pptx) and are inactive (A5/D-05). `color.brief.*` stays in Warna. |
| D18 | `toc.levels`, `render.toc.*` (R-22 is essential) | Penomoran & klasifikasi | own category / Renderer | There is no TOC category. TOC depth follows bab/section numbering. The sub-label "Daftar isi" and search keep it findable. |
| D19 | `render.section.{wrapper,interior,breakPerUnit}`, `slot.setup` | Halaman & grid | Renderer & ekspor | SectionSetup carries page size, margins and orientation (render.ts:93-119; structure.ts:67-71). |
| D20 | `render.docx.{docDefaults,normalStyle,embedFonts}` | Renderer & ekspor | Tipografi | These are DOCX package defaults. The typographic policy `type.fontEmbedding` stays in Tipografi. |
| D21 | `rules.diagramFillHatchDeg` (P4R-15) | Halaman & grid | Diagram & simbol | Kept with Tabel 4.5 (D1). |
| D22 | `sourceRegister.columns` (PD-01, essential) | Bukti, angka & satuan | Tabel | It is the Annex D source register, an evidence apparatus. |

## Files/Modules Involved (for U02-U04; read-only here)

- NEW category module under `src/components/studio/template-editor/` (U02): category list, group defaults, exception rows, R tables, sub-label table, `categoryOf`, `groupByCategory`.
- `template-editor/values.ts:93-117` (replace `groupParams`), `param-editor.tsx:87, 174-213` (category level, `ns:` IDs).
- `template-preview/param-tools.ts:73-129` and the `chapter` option of `searchParams` (`:38, :55`), plus `template-preview/index.tsx:50` (U04).
- `param-labels.ts:52-117` stays as the fallback label source.

## Implementation Order

U02 (module + test against `ALL_PARAMS`) -> U03 (editor) and U04 (preview) in parallel -> C05 assigns a category to every new coverage key using these rules.

## Risks

| Risk | Mitigation |
|---|---|
| A new key in group R with a new namespace or `render.<seg>` falls to Lainnya | Intended. The U02 test fails, and C05/C06 must add an R row. New catalog-group keys inherit their group default silently, so C05 should state the category explicitly for each new key anyway. |
| Hand-derived counts (no shell run) | The U02 test pins the per-category totals in the table above. Any mismatch points to an error in this document or a registry change since 2026-11-05. |
| Users look for table rules in Tabel (D1) or TOC in its own place (D18) | Search ignores categories (SEARCH_LIMIT, all groups open while searching, blueprint section 7). The help lines name the contents. |
| Old open-state IDs (`ch:`/`ns:<chapter>`) | They are UI state only. They reset to closed and no data is lost. |

## Acceptance Criteria (for U02 test)

1. `ALL_PARAMS.length === 788`, and every key maps to a category id in 1-14. The count for `lainnya` is 0.
2. Category order equals the list above. Per-category totals equal the "Total" column. Per-surface totals equal the table: essential 21, advanced 366, derived 72, internal 329.
3. Every exception row E01-E30 and every R namespace or segment row matches at least one key, so there are no dead rules. Every exact-key override matches exactly one key.
4. Sub-group IDs are `ns:<categoryId>:<namespace>`, and labels come from the category-scoped table, falling back to `namespaceLabel`.

## Recommendations

1. Adopt the 15-entry list, the group defaults, E01-E30 and the R tables as written. Treat D1-D22 as decided unless USER objects. D6 and D11 are the closest calls.
2. Use one shared grouping helper for both the editor (U03) and the preview (U04).
3. Hide empty categories (R5). In the advanced view, Bahasa and Lint & pemeriksaan are empty.
4. Controller decision: S1 (split `chart.kind` and `type.scale` sub-groups). Recommended yes for usability, but it refines D-627 Q10. S2 is optional.
5. Plan draft (`masterplan/02_plan_draft.md`): skipped. Rows U02-U04 of the approved blueprint already plan the implementation.

## Appendix - complete per-key assignment by registry ID

Every key has a unique `id` (params.ts:116), and each line below lists the IDs for one category. Ranges are inclusive. "P4T-S01..S13 (all attributes)" means all 67 `P4T-Snn-<attr>` IDs (color-type.ts:254-279). "P7X (all)" means all 136 `CHART_PARAMS` (charts.ts:707, 1358). The R IDs come from render.ts and structure.ts.

| Category | IDs | n |
|---|---|---|
| Warna | P4C-01..35; P6-42 | 36 |
| Tipografi | P4T-01..18; P4T-S01..S13 (all attributes, 67); P4T-X01..X14; R-20, R-21, R-36, R-37, R-40 | 104 |
| Halaman & grid | P4G-01..17; P4R-01..15; P4S-01..09; P4A-05; P5-28, P5-29; R-09, R-10, R-11, R-12, R-13, R-41, R-44, R-45, R-46, R-47, R-53 | 55 |
| Sampul | P4V-01..13, P4V-15, P4V-16; P4S-20..25; R-23 | 22 |
| Lembar kendali | P4K-01..06; R-42 | 7 |
| Kepala & kaki halaman | P4S-10..19, P4S-26, P4S-27; P4A-01, P4A-02, P4A-03, P4A-10; P4V-14; R-26, R-27, R-29, R-30, R-32 | 22 |
| Tabel | P5-01..20, P5-22..27; P4A-06..09; R-15, R-16, R-17, R-34, R-52, R-55 | 36 |
| Gambar & chart | P7-01..36; P8-01, P8-02; P7X (all, 136); P5-21; R-50, R-51, R-56, R-61, R-63, R-65 | 181 |
| Diagram & simbol | P9-01..55; P10-01..42; R-54, R-57, R-62, R-64 | 101 |
| Bukti, angka & satuan | P5-30..68; P6-19..41; P1-04; PD-01; R-14, R-28 | 66 |
| Penomoran & klasifikasi | P3-01..04, P3-09..22, P3-24; P6-01..09; P4A-04; R-22, R-33, R-48, R-49, R-58, R-59, R-60, R-66 | 37 |
| Bahasa | P11-01..34, P11-41..44; P3-23; P6-13..18; PC-01 | 46 |
| Lint & pemeriksaan | P1-01..03; P3-07, P3-08; P6-10..12, P6-43; P11-35..40; P16-01..08; PA-01; PB-01; R-35 | 26 |
| Renderer & ekspor | P3-05, P3-06; P15-01..31; R-01..08, R-18, R-19, R-24, R-25, R-31, R-38, R-39, R-43 | 49 |
| Lainnya | (none) | 0 |
| **Total** | | **788** |

Per-group completeness check: each ID range of every group appears exactly once above.

- P3 01-24: 01-04, 05-06, 07-08, 09-22, 23, 24
- P4A 01-10: 01-03, 04, 05, 06-09, 10
- P4S 01-27: 01-09, 10-19, 20-25, 26-27
- P4V 01-16: 01-13, 14, 15-16
- P5 01-68: 01-20, 21, 22-27, 28-29, 30-68
- P6 01-43: 01-09, 10-12, 13-18, 19-41, 42, 43
- P11 01-44: 01-34, 35-40, 41-44
- R 01-66: each ID listed once
