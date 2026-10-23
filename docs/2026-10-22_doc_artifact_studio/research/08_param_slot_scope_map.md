---
schema_version: 1.0
task_slug: doc_artifact_studio
row: SR-02
agent: data-analyst
date: 2026-10-23
revision: 1 (addendum controller: kelompok "ukuran halaman" -> document; 6 kunci dipindah, lihat §14)
type: data
confidence: HIGH (hitungan per berkas cocok dengan konstanta *_COUNT dan urutan ID; keputusan cakupan ambigu = MEDIUM, beralasan di §6)
status: complete
inputs: identification/05_structural_sections_blueprint.md (baris SR-02, §0, §2.3), src/lib/studio/params/**, src/lib/studio/registry/{sections,charts}.ts, src/lib/studio/engine/tokens/grid.ts, decisions D-108, D-111, D-130, D-140, D-141, pesan controller (temuan user ukuran kertas)
---

# SR-02 Peta Cakupan Kunci Rinci (ALL_PARAMS -> tepat satu cakupan)

## 1. Source Tasks

| Sumber | Isi yang dipakai |
|---|---|
| `identification/05_structural_sections_blueprint.md:722` | Baris SR-02: setiap kunci `ALL_PARAMS` tepat satu cakupan menurut §2.3; 0 tanpa cakupan, 0 ganda; jumlah per cakupan = total modul |
| Blueprint §0 (:18-48) | Prinsip (a) konten murni, (b) keputusan keluaran milik templat+mesin, (e) preset + esensial |
| Blueprint §2.3 (:213-282) | Tabel "Cakupan kunci rinci" (:250-258) dan aturan kelas B/K/T (:278-282) |
| D-108, D-111 | Registri chart 87 -> 99; hitungan katalog 685 (115+134+91+111+135+99) + kontrak 35 (saat itu) |
| D-130 | FIX-6: P9-04/38/51 diberi `derive` (kelas T tetap) |
| D-140, D-141 | Keputusan user meringkas permukaan parameter; blueprint disetujui |
| Pesan controller (temuan user) | Ukuran kertas wajib berlaku end-to-end. Kunci ukuran halaman, grid, dan lebar figur = satu kelompok bercakupan `document`; orientasi boleh ditimpa per slot. `page.sizeMm`, `pageSizeTw`, dan lebar 128/166 menjadi TURUNAN kenop `page.size` + `page.orientation` (nama final: SR-01). Lihat §14 |
| SR-01 (`masterplan/03_structural_sections_specs.md`) | BELUM ADA saat analisis (Glob `masterplan/*` hanya `01_specs.md`). Nama cakupan memakai blueprint §2.3; lihat §9 |

## 2. Exploration & Collection Summary (metode hitung)

Tanpa Bash: setiap berkas modul dibaca utuh dan setiap entri `ParamDef` dihitung manual menurut urutan ID, lalu dicocokkan silang dengan (i) komentar hitungan di kepala berkas, (ii) konstanta `*_COUNT` berkas, dan (iii) penomoran ID berurutan tanpa celah. Kelas dibaca per entri (bawaan pembuat + `class`/`cls` eksplisit).

`ALL_PARAMS = [...CATALOG_PARAMS, ...PARAMS_RENDER]` (`params/index.ts:37`); `CATALOG_PARAMS` = 6 larik (`params/index.ts:27-34`).

| Berkas sumber | Larik (baris rakit) | Rincian grup (dihitung) | Konstanta berkas | Hitungan nyata | B | K | T |
|---|---|---|---|---|---|---|---|
| `params/governance-language.ts` | `PARAMS_GOVERNANCE_LANGUAGE` (:414) | P1 4, P3 24, P11 44, P15 31, P16 8, PA-PD 4 | `_COUNT = 115` (:417) | 115 | 21 | 86 | 8 |
| `params/color-type.ts` | `PARAMS_COLOR_TYPE` (:299) | P4C 35, P4T dasar 18, skala 67 (13 unsur, lihat §5.2), prosa 14 | `_COUNT = 134` (:302) | 134 | 125 | 9 | 0 |
| `params/page.ts` | `PARAMS_PAGE` (:548) | P4G 17, P4R 15, P4S 27, P4V 16, P4K 6, P4A 10 | `_COUNT = 91` (:551) | 91 | 58 | 20 | 13 |
| `params/apparatus.ts` | `PARAMS_APPARATUS` (:464) | P5 68, P6 43 | `_COUNT = 111` (:467) | 111 | 11 | 91 | 9 |
| `params/figure.ts` | `PARAMS_FIGURE` (:779) | P7 36, P8 2, P9 55 (8 + 18 jenis penghubung + 5 pola putus + 24), P10 42 | `_COUNT = 135` (:782) | 135 | 51 | 79 | 5 |
| `registry/charts.ts` | `CHART_PARAMS` (:1116, dari `PARAM_ROWS` :202-439) | katalog 87 (P 26, H 9, K 16, W 16, S 14, G 6) + mesin 12 | `CHART_PARAMS_COUNT = 99` (:1120) | 99 | 96 | 3 | 0 |
| `params/render.ts` | `PARAMS_RENDER` (:39-255) | R-01..R-37 | `PARAMS_RENDER_COUNT = 37` (:257) | 37 | 34 | 2 | 1 |
| **ALL_PARAMS** | | katalog 685 + kontrak 37 | | **722** | **396** | **290** | **36** |

Keunikan kunci: tidak ditemukan kunci ganda lintas 7 larik (inspeksi; kunci chart unik per `chart.kind.<kode>.<nama>`, mis. `P-01.sort`/`P-04.sort`/`P-06.sort` berbeda). Pasangan prefiks yang perlu diwaspadai (bukan ganda): `doc.number` vs `doc.number.fileForm`. Duplikat NILAI/makna (bukan kunci) pada kelompok ukuran halaman ada di §14.3.

## 3. Overview

722 kunci dipetakan ke 29 cakupan konkret:
- `document`: 360, termasuk 22 anggota kelompok "ukuran halaman" (§14);
- 17 `section:<kunci registri DOCUMENT>`: 300;
- 7 `section:<perangkat PAGE_DEVICE>`: 37;
- 4 `shared:<kelompok>`: 25;
- `slot`: 0 (kunci baru SR-05, termasuk `page.orientation`, lihat §14.4).

Hasil verifikasi: 0 tanpa cakupan, 0 ganda, jumlah = 722.

## 4. Requirements (dari SR-02 + §2.3 + addendum controller)

1. Setiap kunci ALL_PARAMS tepat satu cakupan dari himpunan `document`, `section:<kunci registri>`, `section:<perangkat>`, `shared:<kelompok>`, `slot`.
2. Kelas B/K/T dipertahankan per kunci (sumber kebenaran: modul).
3. Jumlah per cakupan dijumlahkan = total per berkas = 722.
4. Kunci ambigu didaftar dengan keputusan beralasan.
5. (Addendum) Kunci ukuran halaman, grid, dan lebar figur ditandai sebagai satu kelompok bercakupan `document`. Duplikat/konflik dicatat, termasuk rencana turunan dari `page.size` + `page.orientation`.

## 5. Peta cakupan (lengkap, per berkas)

Notasi `section:<k>` memakai kunci `SECTION_REGISTRY` (`registry/sections.ts:23-644`). Perangkat = grup `PAGE_DEVICE` (:466-557): `runningHead`, `registerBlock`, `sealBand`, `spineString`, `evidenceRail`, `datumRule`, `issueStampColophon`. Kolom kelas: daftar ID K dan T; sisanya B. Tanda [UH] = anggota kelompok "ukuran halaman" (§14).

### 5.1 `params/governance-language.ts` (115) -> semuanya `document` (aturan grup §2.3 :254: P1, P3, P11-P16, PA-PD)

| ID | Kunci | Kelas | Cakupan | n (B/K/T) |
|---|---|---|---|---|
| P1-01..04 | governance.precedence, governance.decisionOwners, governance.tokensOverrideProse, content.authorClaimMarks | K: semua | document | 4 (0/4/0) |
| P3-01..24 | artifact.tier, artifact.tierJustification, artifact.audience.outsideDivision, artifact.tierSuggested, artifact.format, artifact.pdf.enabled, artifact.pageReconciliation.enabled, artifact.lint.enabled, naming.underscore.allowed, naming.folder.pattern, naming.file.pattern, naming.sheet.pattern, naming.sheet.maxChars, naming.artifactId.pattern, naming.engineeringId.separator, naming.figureFile.fromCaption, numbering.scope, doc.number, doc.number.fileForm, doc.typeCode, doc.monthRoman, doc.revision, doc.language, doc.changeLog.required | T: 04,06,07,08,11,16,19,21; K: 09,13,14,15,17,18,20,22,24 | document | 24 (7/9/8) |
| P11-01..44 | doc.channel, doc.openingOrder, doc.readerKnowledgeMap, doc.identityStatement.required, doc.closing.actionAndRecipient.required, doc.authorityUmbrellaFirst, doc.sequenceMap.required, prose.maxInlineNameValuePairs, doc.pivotMoment.required, doc.pivotMoment.window, paragraph.maxWords, list.numberedWhenItemsGreaterThan, letter.* (P11-13..19, 7), doc.readerPronoun, lexicon.controlledGlossary, lexicon.forbiddenClasses, lexicon.blacklistA4.wordBoundary, threshold.* (P11-24..34, 11), jury.* (P11-35..40, 6), prose.emDash, sentence.sehinggaMaxPerSentence, prose.capsEmphasis.policy, prose.englishTerms.decorativeItalic | B: 01,02,03,06,07,10,12,20,43; K: sisanya | document | 44 (9/35/0) |
| P15-01..31 (`inactive`) | workbook.* (P15-01..18, 18; P15-12 `workbook.print` memuat `paper: "A4"`, lihat §14.3 D6), brief.* (P15-19..31, 13) | B: 20,23,28,31; K: sisanya | document | 31 (4/27/0) |
| P16-01..08 | gate.* (8) | K: semua | document | 8 (0/8/0) |
| PA-01, PB-01, PC-01, PD-01 | rules.index, checklist.preSerah.items, glossary.termClasses, sourceRegister.columns | B: PD-01; K: lainnya | document | 4 (1/3/0) |

### 5.2 `params/color-type.ts` (134) -> semuanya `document` (namespace `color`, `page`, `type`; §2.3 :254)

| ID | Kunci | Kelas | Cakupan | n (B/K/T) |
|---|---|---|---|---|
| P4C-01..35 | color.wrapper.* (7), color.interior.* (10), color.brief.* (2), color.retired, color.maxValuesPerPage, color.decorative.allowed, page.background, page.darkRequestReason, color.role.* (9), color.body.pureBlack.allowed, color.classificationInk | K: 20,21,22,34,35 | document | 35 (30/5/0) |
| P4T-01..18 | type.face.* (5), type.role.*.weights (4), type.role.*.fallback (4), type.forbiddenBodyFaces, type.tracking.* (2), type.baselinePt, type.fontEmbedding | K: 14,18 | document | 18 (16/2/0) |
| P4T-S01..S13-<attr> | type.scale.<unsur>.<attr>: chapterTitle 5, chapterKicker 6, sectionHeading 5, body 5, tableBody 5, tableNumerals 5, tableHeader 6, caption 5, sourceLine 5, evidenceRail 6, runningHead 5, registerBlock 4, derivation 5 | B: semua | document | 67 (67/0/0) |
| P4T-X01..X14 | type.scale.groupBand.* (4), type.scale.unitColumn.* (3), type.scale.asideBody.size, type.scale.asideLabel.style, type.scale.sectionNumber.* (2), type.body.align, type.body.measureChars, type.heading.form | K: X13, X14 | document | 14 (12/2/0) |

### 5.3 `params/page.ts` (91)

| ID | Kunci | Kelas | Cakupan | n (B/K/T) |
|---|---|---|---|---|
| P4G-01..17 | page.sizeMm [UH], grid.* (15; [UH] kecuali 08 subcolumns, 10 latticeYMm, 14 verticalRhythm), layout.railMode | T: 07,09,10,13,15,17; K: 11,14 | document | 17 (9/2/6) |
| P4R-01..15 | rules.* | K: 09,10,15; T: 11 | document | 15 (11/3/1) |
| P4S-01..06 | device.datumRule.* | T: 02,03 | section:datumRule (perangkat) | 6 (4/0/2) |
| P4S-07..09 | device.evidenceRail.* | K: 09 | section:evidenceRail (perangkat) | 3 (2/1/0) |
| P4S-10..14 | device.registerBlock.* | K: 12,14 | section:registerBlock (perangkat) | 5 (3/2/0) |
| P4S-15..19 | device.sealBand.* | K: 18,19 | section:sealBand (perangkat) | 5 (3/2/0) |
| P4S-20..25 | device.spine.* | - | section:spineString (perangkat) | 6 (6/0/0) |
| P4S-26..27 | device.issueStamp.format, device.issueStamp.issueNumber | T: 27 | section:issueStampColophon (perangkat) | 2 (1/0/1) |
| P4V-01, P4V-03..10, P4V-12..13 | cover.align, cover.elementOrder, cover.logo.maxOccurrencesPerDocument, cover.addressLine, cover.title.sizePt, cover.kicker.colour, cover.kicker.text, cover.standfirst.italic, cover.scopeLine, cover.controlBlock.fields, cover.colophon.fields | K: 01,04 | section:cover | 11 (9/2/0) |
| P4V-02, P4V-11 | cover.leftMarginMm [UH], cover.datumRule.widthMm [UH] | T | document (kelompok ukuran halaman) | 2 (0/0/2) |
| P4V-14 | wrapper.header | B | section:runningHead (perangkat) | 1 (1/0/0) |
| P4V-15..16 | org.entityName, org.nib | B | document | 2 (2/0/0) |
| P4K-01..04 | controlSheet.revisionHistory.columns, controlSheet.verificationChain, controlSheet.methodStatement.required, controlSheet.distribution.columns | K: 03 | section:controlSheet | 4 (3/1/0) |
| P4K-05..06 | controlSheet.signatures.roles, controlSheet.signatures.holders | B | section:signatureBlock | 2 (2/0/0) |
| P4A-01..03 | runningHead.fields, runningHead.classification.position, runningHead.ruleBelow | K: 02; T: 03 | section:runningHead (perangkat) | 3 (1/1/1) |
| P4A-04..05 | chapter.kicker.pattern, chapter.datumRule.onlyAboveChapterTitle | K: 05 | section:chapter | 2 (1/1/0) |
| P4A-06 | caption.position | K | shared:caption | 1 (0/1/0) |
| P4A-07 | source.position | K | shared:source | 1 (0/1/0) |
| P4A-08..09 | table.totalRow.style, table.groupBand.fill | K | section:table | 2 (0/2/0) |
| P4A-10 | registerBlock.position | K | section:registerBlock (perangkat) | 1 (0/1/0) |

### 5.4 `params/apparatus.ts` (111)

| ID | Kunci | Kelas | Cakupan | n (B/K/T) |
|---|---|---|---|---|
| P5-01..13, P5-15..16 | table.* (15) | B: 03,06,08; T: 10; K: sisanya | section:table | 15 (3/11/1) |
| P5-14 | table.columnWidthSumMm [UH] | K | document (kelompok ukuran halaman) | 1 (0/1/0) |
| P5-17..21 | caption.required, caption.identifier.style, caption.sentenceCount, caption.effectiveDateInTitle, caption.chart.isConclusion | T: 18; K: sisanya | shared:caption | 5 (0/4/1) |
| P5-22..24 | source.required, source.provenanceField.required, source.glyphKey.include | B: 24; K: 22,23 | shared:source | 3 (1/2/0) |
| P5-25 | artifact.mustBeCalledInProse | K | shared:artifact | 1 (0/1/0) |
| P5-26..27 | specTable.columns, specTable.condition.style | K: 26; B: 27 | section:specTable | 2 (1/1/0) |
| P5-28..29 | aside.ruleBottom, aside.fill | B: 28; K: 29 | section:aside | 2 (1/1/0) |
| P5-30..42 | marks.* (13) | B: 41; K: sisanya | shared:marks | 13 (1/12/0) |
| P5-43 | numbers.bindToRegister | K | document | 1 (0/1/0) |
| P5-44..45 | register.rejectUnmarkedEntries, register.maxDecimals | K: 44; T: 45 | document | 2 (0/1/1) |
| P5-46..47 | audit.untrackedNumbers.enabled, audit.retiredValues.enabled | T | document | 2 (0/0/2) |
| P5-48..53 | derivation.* (6) | B: 52,53; K: 48-51 | section:derivation | 6 (2/4/0) |
| P5-54..57 | admiralty.reliability, admiralty.credibility, admiralty.requiredOnExternalClaims, admiralty.excludedFromProposal | K | document | 4 (0/4/0) |
| P5-58 | admiralty.scaleTablePrintedOnceInAppendix | T | section:referenceScale | 1 (0/0/1) |
| P5-59..60 | icd203.bands, icd203.mixLikelihoodWithConfidence | K | document | 2 (0/2/0) |
| P5-61 | confidence.label | B | document | 1 (1/0/0) |
| P5-62 | assumptionRegister.columns | K | section:registerTable | 1 (0/1/0) |
| P5-63..66 | assumption.id.pattern, assumption.impact.required, requirement.id.pattern, requirement.id.immutableAcrossPackage | K | document | 4 (0/4/0) |
| P5-67..68 | serah.secondIndependentRoute.required, serah.reconciliationTable.required | T | document | 2 (0/0/2) |
| P6-01..08 | classification.* (8) | K | document | 8 (0/8/0) |
| P6-09 | doc.urgency | K | document | 1 (0/1/0) |
| P6-10..12 | compliance.regulations.live/.dead/.reviewIntervalMonths | K | document | 3 (0/3/0) |
| P6-13 | normativeQuote.literalWithArticle | K | document | 1 (0/1/0) |
| P6-14..18 | letter.secretariatException.enabled, letter.font, letter.sizePt, letter.marginLeftCm, letter.marginRightCm | K | document | 5 (0/5/0) |
| P6-19..22 | ahs.rows, ahs.laborCodes, ahs.overheadProfitPercent, ahs.coefficientDecimals | K | section:financialTable | 4 (0/4/0) |
| P6-23..26 | vat.inUnitPrice, vat.nominalRatePercent, vat.dppFactor, vat.effectiveRatePercent | T: 26; K: 23-25 | section:financialTable | 4 (0/3/1) |
| P6-27 | stampDuty.amountRp | K | section:financialTable | 1 (0/1/0) |
| P6-28 | terbilang.generatedByCode | K | document | 1 (0/1/0) |
| P6-29 | hps.roundDown | K | section:financialTable | 1 (0/1/0) |
| P6-30 | boq.columns | B | section:financialTable | 1 (1/0/0) |
| P6-31..43 | numerals.* (2), units.* (5: 33,34,35,36,38), uncertainty.maxSignificantDigits, currency.prefixBeforeValue, conventions.oneVariantPerFile, time.zoneRequired, color.distinctionRedundancy.required, photocopy.acceptanceTest | K | document | 13 (0/13/0) |

### 5.5 `params/figure.ts` (135)

| ID | Kunci | Kelas | Cakupan | n (B/K/T) |
|---|---|---|---|---|
| P7-01..19, P7-21..36 | chart.* global (35) | B: 02,03,05,07,08,09,12,16,21-25,27,35; T: 30,31; K: sisanya | section:chart | 35 (15/18/2) |
| P7-20 | chart.output.widthMm [UH] | K | document (kelompok ukuran halaman) | 1 (0/1/0) |
| P8-01..02 | chart.recommendedByDocType, chart.gspRelevance | B | section:chart | 2 (2/0/0) |
| P9-01..08, P9-32..35, P9-37..44, P9-46..55 | diagram.* (30) | B: 06,07,33,37,47,48; T: 04,38,51; K: sisanya (21) | section:diagram | 30 (6/21/3) |
| P9-36, P9-45 | diagram.widthMm [UH], diagram.maxHeightMm [UH] | K | document (kelompok ukuran halaman) | 2 (0/2/0) |
| P9-09..26 | diagram.edgeKind.<data/control/sync/accent/alert/verify>.<pattern/colour/head> | B | section:diagram | 18 (18/0/0) |
| P9-27..31 | diagram.dashPatternMm.<dashed/dotted/longdash/dashdot/solid> | B | section:diagram | 5 (5/0/0) |
| P10-01..42 | symbol.* (12: P10-01..09, 17, 41, 42), designation.* (2), sheet.* (5), mil.* (4), isa.* (2), iec.* (2), iso5807.* (2), bpmn.gatewaySymbols, c4.levels, archimate.versionOnDrawing, topology.* (2), lineWeight.* (2), lineType.code0501.meaning, rack.* (2), labels.standard, iso7010.prefixes, fire.minLegend | B: 01,09,26,29,31; K: sisanya | section:symbolSheet | 42 (5/37/0) |

### 5.6 `registry/charts.ts` (99) -> semuanya `section:chart`

| Kode (jumlah kunci `chart.kind.<kode>.*`) | Kelas | n |
|---|---|---|
| P-01 3, P-03 2, P-04 3, P-05 1, P-06 3, P-08 3, P-09 3, P-10 2, P-11 2, P-12 1, P-13 2, P-15 1 | K: P-11.limitLine.labelled, P-11.overLimitColour | 26 |
| H-01 2, H-02 2, H-03 2, H-07 2, H-09 1 | B | 9 |
| K-02 2, K-03 1, K-04 1, K-05 3, K-06 2, K-07 1, K-09 2, K-10 2, K-11 2 | B | 16 |
| W-01 2, W-02 1, W-04 1, W-05 2, W-07 4, W-08 2, W-09 4 | K: W-04.zeroBaseline | 16 |
| S-01 2, S-02 3, S-05 4, S-07 2, S-08 3 | B | 14 |
| G-01 3, G-04 3 | B | 6 |
| Mesin (IP-25): S-02.whisker, S-03.bandwidth, S-04.bandwidth, K-08.grid, K-08.icon, K-08.caption, K-11.accentLink, K-12.widths, W-07.todayAt, W-07.todayLabel, W-08.riskyTypes, W-08.highlightWindow | B | 12 |
| Total | B 96, K 3, T 0 | 99 |

### 5.7 `params/render.ts` (37)

| ID | Kunci | Kelas | Cakupan |
|---|---|---|---|
| R-01..08 | render.docx.compatibilityMode, .defaultTabStopTw, .updateFieldsOnOpen, .embedTrueTypeFonts, .saveSubsetFonts, .docDefaults, .normalStyle, .embedFonts | B | document |
| R-09, R-10, R-11 | render.section.wrapper [UH], render.section.interior [UH], render.section.breakPerUnit | B | document |
| R-12, R-13 | render.rail.renderer, render.rail.colsTw | B; T: R-13 | section:evidenceRail (perangkat) |
| R-14, R-28 | render.derivation.renderer, render.derivation.nestedColsTw | B | section:derivation |
| R-15 | render.caption.separator | B | shared:caption |
| R-16, R-17 | render.table.sourcePlacement, render.table.layout | B | section:table |
| R-18, R-19 | render.spacer.autoMode, render.spacer.defaults | B | document |
| R-20, R-21 | render.list.bulletMarker, render.list.numberMarker | B | section:list |
| R-22 | render.toc.mode | B | section:toc |
| R-23 | render.cover.mode | B | section:cover |
| R-24, R-25 | render.html.paged, render.png.dpi | B; K: R-25 | document |
| R-26 | runningHead.docLabel | B | section:runningHead (perangkat) |
| R-27 | org.shortName | B | document |
| R-29 | render.section.registerBlockLayout | B | section:registerBlock (perangkat) |
| R-30, R-31 | render.docx.headerFooterStyles [UH, konsumen; §14.3 D8], render.docx.settingsExtras | B | document |
| R-32 | render.runningHead.runProps | B | section:runningHead (perangkat) |
| R-33 | render.section.numberSeparator | B | section:section |
| R-34 | render.specTable.conditionIndentMm | B | section:specTable |
| R-35 | lint.enforcementOverride | K | document |
| R-36, R-37 | render.run.strong, render.run.symbolGlyphByRole | B | document |

Render: document 21 (B19 K2), perangkat 5 (B4 T1), section registri 10 (B10), shared 1 (B1) = 37.

### 5.8 Aturan pembangkit (setara dengan §5.1-5.7; untuk transkripsi SR-05)

Dievaluasi berurutan, aturan pertama yang cocok menang; pencocokan prefiks pada batas segmen (titik termasuk):
0. Kunci persis kelompok ukuran halaman yang berada di namespace section: `cover.leftMarginMm`, `cover.datumRule.widthMm`, `table.columnWidthSumMm`, `chart.output.widthMm`, `diagram.widthMm`, `diagram.maxHeightMm` -> `document`.
1. Grup `P1, P3, P11, P15, P16, PA, PB, PC, PD` -> `document`.
2. Grup `P7, P8, P7X` -> `section:chart`; `P9` -> `section:diagram`; `P10` -> `section:symbolSheet`.
3. Kunci persis `admiralty.scaleTablePrintedOnceInAppendix` -> `section:referenceScale`; `render.section.numberSeparator` -> `section:section`; `render.section.registerBlockLayout` -> `section:registerBlock`.
4. Prefiks: `device.datumRule.` -> datumRule; `device.evidenceRail.`, `render.rail.` -> evidenceRail; `device.registerBlock.`, `registerBlock.` -> registerBlock; `device.sealBand.` -> sealBand; `device.spine.` -> spineString; `device.issueStamp.` -> issueStampColophon; `runningHead.`, `render.runningHead.`, `wrapper.` -> runningHead; `controlSheet.signatures.` -> signatureBlock; `controlSheet.` -> controlSheet; `cover.`, `render.cover.` -> cover; `chapter.` -> chapter; `table.`, `render.table.` -> table; `specTable.`, `render.specTable.` -> specTable; `assumptionRegister.` -> registerTable; `aside.` -> aside; `derivation.`, `render.derivation.` -> derivation; `render.list.` -> list; `render.toc.` -> toc; `ahs.`, `vat.`, `boq.`, `stampDuty.`, `hps.` -> financialTable; `caption.`, `render.caption.` -> `shared:caption`; `source.` -> `shared:source`; `artifact.` -> `shared:artifact`; `marks.` -> `shared:marks`.
5. Selain itu -> `document`.

Diperiksa terhadap seluruh tabel §5.1-5.7: aturan ini menghasilkan pemetaan identik. Aturan 0 mendahului grup P7/P9 dan prefiks `cover.`/`table.`; aturan 1 mendahului prefiks sehingga P3 `artifact.*`, P11 `paragraph./list./letter.`, PD `sourceRegister.` tetap `document`.

## 6. Kunci ambigu dan keputusan beralasan

Tata urut bukti yang dipakai: (0) arahan controller (addendum ukuran halaman), (1) entri eksplisit §2.3 (rentang ID atau kunci persis), (2) aturan grup §2.3, (3) aturan namespace §2.3, (4) `paramRefs` registri (`registry/sections.ts`), (5) semantik: kunci yang nilainya wajib seragam di seluruh dokumen (pola ID, konvensi, ambang lint, pengikatan register) -> `document`.

| # | Kunci (ID) | Konflik | Keputusan | Alasan | Confidence |
|---|---|---|---|---|---|
| A1 | artifact.* P3-01..08 | Grup P3 -> document vs namespace `artifact.*` -> shared | document | Tier, format, PDF, lint = keputusan per dokumen; menimpanya per slot tidak bermakna. `shared:artifact` hanya memuat P5-25 | HIGH |
| A2 | paragraph.maxWords P11-11, list.numberedWhenItemsGreaterThan P11-12 | `paramRefs` paragraph/list (`sections.ts:158`, `:171`) | document | Aturan grup eksplisit; ambang prosa seragam | HIGH |
| A3 | PA-01, PB-01, PC-01, PD-01 | `paramRefs` ruleIndex/checklist/glossary/sourceRegister (`sections.ts:432,393,406,419`) | document | Grup PA-PD eksplisit di §2.3. Satu instans per dokumen, jadi tidak ada kerugian. PD-01 jadi kandidat pindah ke `section:sourceRegister` bila SR-59 menjadikan kolom sebagai kenop slot | MEDIUM |
| A4 | P15-01..31 (`inactive`, D-05) | Section kanal `sheet.*`/`slide.*` `renderable:false` | document | Grup eksplisit. Kanal bukan slot v2.1 | HIGH |
| A5 | type.scale.* (P4T-S01..S13, X01..X11) | `paramRefs` chapter/section/aside/derivation/perangkat | document | Namespace `type` eksplisit. Satu skala tipografi menjaga grid garis dasar DT-10. Variasi per slot lewat roleFormats M12, bukan parameter | MEDIUM |
| A6 | grid.evidenceRailMm P4G-05, layout.railMode P4G-16 | `paramRefs` evidenceRail (`sections.ts:525`) | document | Namespace eksplisit. Geometri grid harus konsisten per halaman | HIGH |
| A7 | rules.asideTopMm P4R-12, rules.derivationLeft* P4R-13..14 | `paramRefs` aside/derivation | document | Namespace `rules` eksplisit | HIGH |
| A8 | P4S-15..27 | `paramRefs` cover memuat P4S-15..27 (`sections.ts:44`) | perangkat masing-masing | Perangkat dapat ditimpa per slot, termasuk slot cover; namespace `device.*` eksplisit | HIGH |
| A9 | cover.colophon.fields P4V-13 | `paramRefs` cover dan issueStampColophon (`:552`) | section:cover | Namespace `cover.*` eksplisit | MEDIUM |
| A10 | wrapper.header P4V-14 | Tidak ada aturan | section:runningHead | Isi kepala halaman pada halaman register WRAPPER = perangkat kepala halaman. Cakupan perangkat memungkinkan cover/controlSheet/toc berbeda. `document` ditolak karena mengunci satu nilai | MEDIUM |
| A11 | controlSheet.signatures.* P4K-05..06 | Namespace controlSheet vs entri eksplisit "P4K-05..06" di §2.3 + `paramRefs` signatureBlock (`:102`) | section:signatureBlock | Rentang ID eksplisit menang. Selaras dengan slot `signature` (AS-2) | HIGH |
| A12 | registerBlock.position P4A-10, render.section.registerBlockLayout R-29 | Tidak ada aturan / namespace render.section | section:registerBlock | Nama kunci = kunci registri perangkat F2. Isinya tata letak blok register footer | HIGH |
| A13 | register.* P5-44..45 | "register" mirip registerTable | document | Register kuantitas DT-23 (mesin bind), bukan section tabel register | HIGH |
| A14 | admiralty.* P5-54..57, icd203.* P5-59..60 | `paramRefs` referenceScale P5-54..60 (`:445`) | document (P5-58 saja -> section:referenceScale) | Skala dipakai digraf rel dan lint 22 di seluruh dokumen. Hanya "dicetak sekali di lampiran" yang menyangkut render section | MEDIUM |
| A15 | assumption.* P5-63..64, requirement.* P5-65..66 | `paramRefs` registerTable dan assumptionInline (P5-63..64 milik dua section) | document | Pola ID wajib seragam sepanjang dokumen/paket | HIGH |
| A16 | assumptionRegister.columns P5-62 | Tidak ada aturan §2.3 | section:registerTable | `paramRefs` pemilik tunggal; kolom = tata letak tabel section | MEDIUM |
| A17 | compliance.regulations.* P6-10..11 | `paramRefs` registerTable (`:271`) | document | Daftar lint DT-29 berlaku seluruh dokumen | HIGH |
| A18 | letter.* P6-14..18 | Kanal `letter` tidak dirender | document | Konsisten dengan P11-13..19 (grup) | HIGH |
| A19 | stampDuty.amountRp P6-27, hps.roundDown P6-29 | Tidak ada aturan; `paramRefs` financialTable P6-19..30 (`:458`) | section:financialTable | Sejalan dengan `vat`/`ahs`/`boq` (§2.3); `terbilang` P6-28 tetap document (eksplisit) | MEDIUM |
| A20 | P10-01..42 | §2.3 `symbol.*` tanpa kunci registri; namespace notasi lain tanpa aturan | section:symbolSheet (seluruh grup) | `paramRefs` symbolSheet P10-01..06 (`:380`); grup Bab 10 kohesif; Grep di `src/lib/studio/engine`: 0 pembaca kunci P10. Alternatif `section:diagram` untuk notasi mil/isa/iec/rack dicatat | MEDIUM |
| A21 | render.section.wrapper/interior/breakPerUnit R-09..11 | Tidak ada aturan | document | Setup halaman per register. Setup per slot memakai `slot.setup` baru (cakupan slot) | MEDIUM |
| A22 | render.rail.* R-12..13 | Tidak ada aturan | section:evidenceRail | Rel = perangkat F5; sejajar device.evidenceRail.* | MEDIUM |
| A23 | render.derivation.*, render.cover.mode, render.runningHead.runProps, render.specTable.*, runningHead.docLabel | Tidak eksplisit (pola `render.<x>` = `<x>`) | section masing-masing | Analog dengan render.table.*/render.toc.* yang eksplisit | HIGH |
| A24 | render.spacer.* R-18..19, render.html.paged R-24, render.png.dpi R-25 | Tidak ada aturan | document | Spacer deprecated (D-138); keluaran/paket = internal | HIGH |
| A25 | render.section.numberSeparator R-33 | §2.3 tanpa kunci registri | section:section | Pemisah nomor-judul seksi = section registri `section` (S07, `sections.ts:121`) | MEDIUM |
| A26 | cover.leftMarginMm P4V-02, cover.datumRule.widthMm P4V-11, table.columnWidthSumMm P5-14, chart.output.widthMm P7-20, diagram.widthMm P9-36, diagram.maxHeightMm P9-45 | Namespace section (cover/table/chart/diagram) vs arahan controller (kelompok ukuran halaman -> document) | document | Arahan controller. Nilainya adalah besaran geometri halaman: `= grid.innerMarginMm`, `= grid.fullSpanMm`, anggota {kolom teks, bentang penuh}, `= grid.textBlockHeightMm`. Menimpanya per slot akan memutus rantai turunan dari `page.size`. Biaya: pilihan "lebar teks vs bentang penuh" per jenis figur tidak lagi bisa ditimpa per slot. Bila itu dibutuhkan, SR-01/SR-59 dapat menambah kenop kelas lebar relatif (`text`/`full`) bercakupan section; nilai mm tetap turunan | MEDIUM |

## 7. Ringkasan hitungan

### 7.1 Per cakupan x berkas sumber x kelas

| Cakupan | gov | col-type | page | appar. | figure | charts | render | Total | B | K | T |
|---|---|---|---|---|---|---|---|---|---|---|---|
| document | 115 | 134 | 36 | 51 | 3 | 0 | 21 | **360** | 188 | 150 | 22 |
| section:cover | | | 11 | | | | 1 | 12 | 10 | 2 | 0 |
| section:controlSheet | | | 4 | | | | | 4 | 3 | 1 | 0 |
| section:signatureBlock | | | 2 | | | | | 2 | 2 | 0 | 0 |
| section:toc | | | | | | | 1 | 1 | 1 | 0 | 0 |
| section:chapter | | | 2 | | | | | 2 | 1 | 1 | 0 |
| section:section | | | | | | | 1 | 1 | 1 | 0 | 0 |
| section:table | | | 2 | 15 | | | 2 | 19 | 5 | 13 | 1 |
| section:specTable | | | | 2 | | | 1 | 3 | 2 | 1 | 0 |
| section:registerTable | | | | 1 | | | | 1 | 0 | 1 | 0 |
| section:aside | | | | 2 | | | | 2 | 1 | 1 | 0 |
| section:derivation | | | | 6 | | | 2 | 8 | 4 | 4 | 0 |
| section:list | | | | | | | 2 | 2 | 2 | 0 | 0 |
| section:chart | | | | | 37 | 99 | | 136 | 113 | 21 | 2 |
| section:diagram | | | | | 53 | | | 53 | 29 | 21 | 3 |
| section:symbolSheet | | | | | 42 | | | 42 | 5 | 37 | 0 |
| section:referenceScale | | | | 1 | | | | 1 | 0 | 0 | 1 |
| section:financialTable | | | | 11 | | | | 11 | 1 | 9 | 1 |
| *Subtotal section registri (17)* | 0 | 0 | 21 | 38 | 132 | 99 | 10 | **300** | 180 | 112 | 8 |
| section:runningHead | | | 4 | | | | 2 | 6 | 4 | 1 | 1 |
| section:registerBlock | | | 6 | | | | 1 | 7 | 4 | 3 | 0 |
| section:sealBand | | | 5 | | | | | 5 | 3 | 2 | 0 |
| section:spineString | | | 6 | | | | | 6 | 6 | 0 | 0 |
| section:evidenceRail | | | 3 | | | | 2 | 5 | 3 | 1 | 1 |
| section:datumRule | | | 6 | | | | | 6 | 4 | 0 | 2 |
| section:issueStampColophon | | | 2 | | | | | 2 | 1 | 0 | 1 |
| *Subtotal perangkat (7)* | 0 | 0 | 32 | 0 | 0 | 0 | 5 | **37** | 25 | 7 | 5 |
| shared:caption | | | 1 | 5 | | | 1 | 7 | 1 | 5 | 1 |
| shared:source | | | 1 | 3 | | | | 4 | 1 | 3 | 0 |
| shared:artifact | | | | 1 | | | | 1 | 0 | 1 | 0 |
| shared:marks | | | | 13 | | | | 13 | 1 | 12 | 0 |
| *Subtotal shared (4)* | 0 | 0 | 2 | 22 | 0 | 0 | 1 | **25** | 3 | 21 | 1 |
| slot | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **0** | 0 | 0 | 0 |
| **Total** | **115** | **134** | **91** | **111** | **135** | **99** | **37** | **722** | **396** | **290** | **36** |

### 7.2 Verifikasi

| Cek | Hasil |
|---|---|
| Kunci tanpa cakupan | 0 (setiap baris §5.1-5.7 punya cakupan; aturan §5.8 punya fallback `document`) |
| Kunci bercakupan ganda | 0 (setiap rentang ID muncul sekali; rentang yang dipecah addendum (P4V, P5-01..16, P7, P9) diperiksa saling lepas) |
| Jumlah kolom per berkas = hitungan berkas | 115, 134, 91 (36+21+32+2), 111 (51+38+22), 135 (3+132), 99, 37 |
| Jumlah baris = 722 | 360 + 300 + 37 + 25 + 0 = 722 |
| Kelas | B 396 + K 290 + T 36 = 722 (document 188/150/22; section registri 180/112/8; perangkat 25/7/5; shared 3/21/1) |
| Dapat ditimpa per slot (non-document) | 362, dengan T 14 tetap hanya-baca |

## 8. Key Findings

| # | Temuan | Confidence | Bukti | Implikasi |
|---|---|---|---|---|
| F1 | ALL_PARAMS = 722 tepat (katalog 685 + kontrak 37) | HIGH | §2; `render.ts:257`, `charts.ts:1120` | Angka "sekitar 722" di blueprint §1.2 (:84) terkonfirmasi |
| F2 | Pin hitungan usang: `CATALOG_PARAM_COUNT = 673` dan `RENDER_PARAM_COUNT = 35`, padahal modul 685 dan 37. Komentar kepala (:3-5) juga usang | HIGH | `params/index.ts:3-5`, `:23-24` vs `render.ts:257`; D-111 mencatat INT-V menyetel 685, tetapi berkas di disk tetap 673 | SR-05 (penulis tunggal pin hitungan) wajib memperbaiki dan menambah uji `ALL_PARAMS.length` |
| F3 | Delapan entri aturan §2.3 belum punya kunci di modul: `toc.*` (registri hanya merujuk `toc.levels` yang tidak ada), `part.*`, `map.*`, `ingest.inlineFormat`, `render.draft.marker`, `render.run.symbolGlyphs`, `slot.*`, `color.accent`/`type.baseSizePt`/`grid.marginDensity` | HIGH | Grep `src/lib/studio`: 0 hasil untuk ingest.inlineFormat, render.draft, symbolGlyphs, slot.setup, type.baseSizePt, marginDensity; `sections.ts:76` | Cakupan `slot` = 0 kunci sekarang. SR-05 menambahkan; peta ini wajib diperluas saat kunci itu masuk ALL_PARAMS |
| F4 | `document` memuat 360/722 (50 %). Dari jumlah itu, 31 kunci P15 `inactive` dan 21 kunci render internal/paket | HIGH | §7.1 | Masukan SR-59: kandidat lapis Internal/tersembunyi |
| F5 | Ada kunci yang sejatinya ISI per figur/dokumen, bukan parameter templat: chart.question P7-01, chart.purposeGroup P7-02, diagram.family/id/title/nodes[]/edges[]/legend[]/notes[]/sources[]/labelsVerified (P9-01,02,03,05,08,32,33,34,35), cover.kicker.text P4V-08, cover.scopeLine P4V-10 | MEDIUM | `figure.ts:61-67`, `:337-378`; `page.ts:398-405` | Melanggar §0 (a)/(e) bila tampil di permukaan templat. SR-59 sebaiknya menandainya internal atau isi |
| F6 | Kunci P10 (42) tidak dibaca mesin | MEDIUM | Grep pola kunci P10 di `src/lib/studio/engine`: 0 hasil | Penempatan cakupan berisiko rendah; kandidat lanjutan/internal |
| F7 | IP-39 (ParamDef petunjuk chart) masih backlog | MEDIUM | D-136 | Bila mendarat, hitungan `section:chart` naik dan peta wajib dihitung ulang |
| F8 | Ukuran kertas belum end-to-end. Ada dua sumber kebenaran (`page.sizeMm` vs `pageSizeTw` A4 di R-09/R-10 + fallback A4 di mesin DOCX). Tinggi blok teks 247 tidak diturunkan, sehingga margin bawah negatif untuk A4 lanskap/A5. Lebar figur 128/166 tertanam sebagai enum literal | HIGH | §14.3 D1-D3 | Lihat §14.4 untuk rantai turunan yang diusulkan |

## 9. Files/Modules Involved

Dibaca: `src/lib/studio/params/{index,governance-language,color-type,page,apparatus,figure,render}.ts`, `src/lib/studio/registry/{sections,charts}.ts`, `src/lib/studio/contract/types/params.ts:114` (kelas `"B" | "K" | "T"`), `src/lib/studio/engine/tokens/grid.ts:30-59, 216-353`. Grep: `src/lib/studio/engine/docx/package/section.ts`, `engine/docx/wrapper/render.ts`, `engine/html/base/params.ts`.

Penyelarasan SR-01: bila register nama SR-01 memakai sintaks berbeda (mis. `device:<k>` untuk perangkat), cukup ganti label. Pemetaan kunci -> kunci registri tidak berubah. Kunci registri yang dipakai: `financialTable` (untuk `boq`/`ahs`/`vat` §2.3), `symbolSheet` (untuk `symbol.*`), `section` (untuk render.section.numberSeparator). Nama kenop `page.size` dan `page.orientation` (§14) ditetapkan SR-01.

## 10. Implementation Order (untuk konsumen)

1. SR-01 menetapkan nama dan cakupan kenop `page.size` + `page.orientation` (§14.4).
2. SR-59 memakai §7.1 + F4/F5 + §14 untuk lapis esensial/lanjutan/turunan/internal. Ukuran kertas sudah ada di daftar esensial global blueprint (§2.3 :238).
3. SR-05 mentranskripsi §5.8 sebagai fungsi cakupan + uji: (a) setiap kunci ALL_PARAMS punya cakupan, (b) hitungan per cakupan = §7.1, (c) total = 722 + kunci baru `params/structure.ts`.
4. Perbaiki pin `params/index.ts:23-24` (F2) di SR-05.

## 11. Risks

| Risiko | Mitigasi |
|---|---|
| Hitungan manual tanpa eksekusi | Cross-check tiga arah (§2). Controller dapat menjalankan `npx tsx -e "import('./src/lib/studio/params/index.ts').then(m=>console.log(m.ALL_PARAMS.length))"` |
| Baris paralel (IP-39 chart, FIX-6 derive) mengubah modul | Peta berlaku untuk keadaan berkas 2026-10-23. Uji SR-05 (langkah 10.3) menangkap drift |
| Keputusan MEDIUM (A3, A5, A9, A10, A14, A16, A19-A22, A25, A26) diperdebatkan | Setiap keputusan hanya mengubah satu baris aturan di §5.8; tidak memengaruhi nilai efektif (cakupan hanya mengatur boleh/tidaknya override slot) |
| Orientasi per slot (§14.4) mengharuskan turunan grid dihitung per unit | Urutan resolusi blueprint §2.3 butir 7-8 sudah per unit. Uji wajib: satu slot lanskap di antara slot potret |

## 12. Acceptance Criteria

- AC1: 722 kunci, 0 tanpa cakupan, 0 ganda (§7.2). PASS.
- AC2: Jumlah per cakupan = total modul per berkas (§7.1). PASS.
- AC3: Kelas per kunci sesuai modul; B 396 / K 290 / T 36. PASS.
- AC4: Kunci ambigu terdaftar dengan alasan (26 butir, §6). PASS.
- AC5 (addendum): Kelompok ukuran halaman ditandai, 22 anggota bercakupan `document`. Duplikat/konflik D1-D11 tercatat (§14). PASS.

## 13. Recommendations

1. Pakai §5.8 sebagai satu sumber aturan cakupan (fungsi murni) dan §5.1-5.7 sebagai fixture uji.
2. SR-59: keluarkan F5 dari permukaan templat; P15 dan render internal -> lapis Internal.
3. Rantai turunan ukuran halaman (§14.4) sebaiknya diadopsi SR-01/SR-59 sebelum SR-05 mengunci registri.
4. Plan draft (`masterplan/02_plan_draft.md`) DILEWATI: SR-02 adalah baris riset tanpa perubahan kode; perubahan dijalankan SR-01/SR-05/SR-59.

## 14. Addendum controller: kelompok "ukuran halaman"

### 14.1 Anggota kelompok (kunci yang ada di ALL_PARAMS)

Semua anggota sumber/turunan bercakupan `document`. Konsumen yang bukan besaran halaman tetap di cakupannya; ditandai agar ikut dialihkan ke turunan.

| ID | Kunci | Kelas | Nilai kini | Peran dalam kelompok | Cakupan |
|---|---|---|---|---|---|
| P4G-01 | page.sizeMm | B | [210, 297] | Sumber ukuran -> jadi TURUNAN `page.size` + `page.orientation` | document |
| P4G-02 | grid.innerMarginMm | B | 24 | Masukan grid | document |
| P4G-03 | grid.textColumnMm | B | 128 | Kini B; diturunkan ulang hanya bila bukan A4 potret (`grid.ts:228-243`) -> sebaiknya T (= lebar halaman - margin - talang - rel) | document |
| P4G-04 | grid.gutterMm | B | 6 | Masukan grid | document |
| P4G-05 | grid.evidenceRailMm | B | 32 | Masukan grid | document |
| P4G-06 | grid.outerMarginMm | B | 20 | Masukan grid | document |
| P4G-07 | grid.fullSpanMm | T | 166 | Turunan (`grid.ts:244-247`) | document |
| P4G-09 | grid.latticeXMm | T | 10.6667 | Turunan dari kolom teks | document |
| P4G-11 | grid.textBlockHeightMm | K | 247 | Konstanta, BUKAN turunan -> wajib jadi T (= tinggi halaman - margin atas - margin bawah) | document |
| P4G-12 | grid.topBottomMarginMm | B | 26 | Masukan grid (D-33: margin atas) | document |
| P4G-13 | grid.allowedFigureWidthsMm | T | [128, 166] | Turunan [kolom teks, bentang penuh] (`grid.ts:257-261`) = satu-satunya sumber lebar figur yang sah | document |
| P4G-15 | grid.pageWidthCheck | T | 210 | Cek konsistensi | document |
| P4G-17 | grid.rederiveForNonA4 | T | true | Bendera khusus A4 -> pensiunkan; turunan selalu berjalan dari `page.size` | document |
| P4V-02 | cover.leftMarginMm | T | 24 | Turunan (= inner) | document (dipindah dari section:cover) |
| P4V-11 | cover.datumRule.widthMm | T | 166 | Turunan (= fullSpan) | document (dipindah dari section:cover) |
| P5-14 | table.columnWidthSumMm | K | 128, rentang 128-166 | Duplikat literal himpunan lebar -> turunan dari P4G-13 | document (dipindah dari section:table) |
| P7-20 | chart.output.widthMm | K | 128, enum ["128","166"] | Duplikat literal -> turunan dari P4G-13 | document (dipindah dari section:chart) |
| P9-36 | diagram.widthMm | K | 128, enum ["128","166"] | Duplikat literal -> turunan dari P4G-13 | document (dipindah dari section:diagram) |
| P9-45 | diagram.maxHeightMm | K | 247 | Duplikat P4G-11 -> turunan | document (dipindah dari section:diagram) |
| R-09 | render.section.wrapper | B | `pageSizeTw: A4_PORTRAIT_TW` | Salinan ukuran kedua (twip) -> medan `pageSizeTw` jadi turunan | document |
| R-10 | render.section.interior | B | `pageSizeTw: A4_PORTRAIT_TW` | Sama dengan R-09 | document |
| P15-12 | workbook.print (`paper: "A4"`) | K, `inactive` | A4 | Sumber kertas terpisah kanal workbook (D-05, di luar v2.1) | document |

Total 22 kunci: B 9, K 6, T 7 (P4G-01..07 kecuali 07 = 6 B + 07 T; 09 T; 11 K; 12 B; 13 T; 15 T; 17 T; P4V-02 T; P4V-11 T; P5-14 K; P7-20 K; P9-36 K; P9-45 K; R-09 B; R-10 B; P15-12 K). Konsumen terkait yang tetap di cakupannya: `render.rail.colsTw` R-13 (T, sudah turunan dari grid, section:evidenceRail), `render.docx.headerFooterStyles` R-30 (document; posisi tab tertanam, lihat D8), `render.section.registerBlockLayout` R-29 (profil Manual 000 menyematkan kolom berjumlah 9411 tw = 166 mm), `layout.railMode` P4G-16 (moda B mengubah lebar teks).

Catatan: kunci `render.docx.sectionSetup` yang disebut pesan controller TIDAK ADA (Grep `sectionSetup` di `src/lib/studio`: 0 hasil). `pageSizeTw` A4 berada di R-09 `render.section.wrapper` (`render.ts:91`) dan R-10 `render.section.interior` (`render.ts:102`), dari konstanta `render.ts:12`.

### 14.2 Kunci bayangan (dipakai mesin, tidak ada di ALL_PARAMS)

| Kunci | Bukti | Catatan |
|---|---|---|
| grid.marginBottomMm | `engine/tokens/grid.ts:44-45`, `:341-352` (D-33) | Turunan tanpa ParamDef: margin bawah = tinggi halaman - margin atas - textBlockHeight. Tidak dihitung dalam 722 |

### 14.3 Duplikat dan konflik yang ditemukan

| # | Temuan | Bukti | Dampak |
|---|---|---|---|
| D1 | Dua sumber ukuran halaman: `page.sizeMm` [210, 297] dan `pageSizeTw` [11906, 16838] di R-09/R-10. Disinkronkan hanya bila halaman bukan A4 potret | `page.ts:60`; `render.ts:12, 91, 102`; `grid.ts:228-243` | Profil yang menimpa `pageSizeTw` langsung (bukan `page.sizeMm`) akan menyimpang dari grid |
| D2 | Fallback A4 tertanam di mesin DOCX, di luar registri parameter | `engine/docx/package/section.ts:25, 74, 89, 108`; `engine/docx/wrapper/render.ts:407-408` | Seksi tanpa `pageSizeTw` selalu A4. Harus membaca nilai efektif |
| D3 | `grid.textBlockHeightMm` 247 (K) dan `diagram.maxHeightMm` 247 (K) = konstanta sama ganda (keduanya lint 33), tidak diturunkan dari tinggi halaman | `page.ts:92`; `figure.ts:445` | Margin bawah D-33 = tinggi - 26 - 247: A4 lanskap (tinggi 210) -> -63 mm; A5 (210) -> -63 mm. Tidak valid |
| D4 | Himpunan lebar figur ditulis empat kali: P4G-13 (T, turunan) vs P7-20 dan P9-36 (K, enum string "128"/"166" dengan default angka 128) vs P5-14 (rentang 128-166) | `page.ts:101`; `figure.ts:144-147, 379-382`; `apparatus.ts:80-83` | Enum literal tidak mengikuti ukuran kertas. Ada juga konflik tipe: enum string vs nilai `mm` angka |
| D5 | `grid.rederiveForNonA4` (P4G-17) menganggap A4 potret sebagai kasus khusus. A4 lanskap ikut "bukan A4": kolom teks = 297-24-6-32-20 = 215 mm, tetapi tinggi blok tetap 247 | `grid.ts:228-243` | Orientasi belum menjadi konsep; perlu kenop `page.orientation` |
| D6 | `workbook.print.paper` "A4" = sumber kertas ketiga (kanal workbook, `inactive`) | `governance-language.ts:277-278` | Di luar v2.1. Bila kanal diaktifkan, harus membaca `page.size` |
| D7 | `grid.pageWidthCheck` (T) = jumlah margin+kolom; berlebih bila kolom teks sudah turunan | `page.ts:116-119`, `grid.ts:262-265` | Bisa dipertahankan sebagai cek internal |
| D8 | `render.docx.headerFooterStyles` (R-30): tab tengah 4680 tw dan tab kanan 9360 tw (165,1 mm) tertanam | `render.ts:201-202` | Kepala/kaki halaman tidak mengikuti lebar halaman/kolom. Sebaiknya turunan dari bentang penuh |
| D9 | `render.section.registerBlockLayout` (R-29) profil Manual 000 menyematkan kolom [2948, 2381, 2381, 1701] = 9411 tw (166 mm) | `render.ts:192` (classNote) | Sah sebagai sematan preset (blueprint §2.3 :222), tetapi gugur bila preset dipakai pada kertas lain |
| D10 | Literal 128/166/247 di mesin: 91 kemunculan di 37 berkas (`engine/chart/core/guards.ts` 9, `canvas.ts` 8, `diagram/core/tokens.ts` 8, `docx/figures/figure.ts` 6, dll.) | Grep `\b(128\|166\|247)\b` di `src/lib/studio/engine` (mode hitung) | HIPOTESIS: sebagian adalah lebar/tinggi figur tertanam. Belum diklasifikasi per baris. Perlu audit oleh baris implementasi |
| D11 | Margin grid kanonik mengasumsikan A4 potret (24 + 128 + 6 + 32 + 20 = 210) | `page.ts:118` (classNote P4G-15) | Untuk kertas lain, margin tetap dan kolom teks menyerap selisih. Kebijakan ini perlu disahkan SR-01 |

### 14.4 Rantai turunan yang diusulkan (masukan SR-01/SR-59; nama final milik SR-01)

1. Kenop baru `page.size` (B, esensial global, bercakupan `document`) dan `page.orientation` (B, nilai `portrait`/`landscape`). `page.orientation` bercakupan `slot`: default di tingkat dokumen, boleh ditimpa per slot sesuai arahan controller. Kunci ini tidak bisa berada di cakupan `document` karena `document` menolak override slot (422 `SLOT_PARAM_SCOPE_INVALID`).
2. `page.sizeMm` (P4G-01) B -> T: hasil `page.size` + orientasi efektif unit.
3. `render.section.wrapper|interior.pageSizeTw` -> turunan dari `page.sizeMm` per unit, menggantikan `A4_PORTRAIT_TW`. Fallback mesin (D2) membaca nilai efektif.
4. `grid.textColumnMm` B -> T (lebar - inner - gutter - rel - outer). `grid.textBlockHeightMm` K -> T (tinggi - atas - bawah); margin bawah menjadi masukan B, menggantikan `grid.marginBottomMm` bayangan.
5. `grid.fullSpanMm`, `grid.allowedFigureWidthsMm`, `cover.leftMarginMm`, `cover.datumRule.widthMm`: tetap T. `table.columnWidthSumMm`, `chart.output.widthMm`, `diagram.widthMm`: K -> T (anggota/turunan `grid.allowedFigureWidthsMm`). Pilihan per figur dinyatakan sebagai kelas lebar relatif (`text`/`full`) bila diperlukan (A26). `diagram.maxHeightMm` K -> T (= `grid.textBlockHeightMm`).
6. `grid.rederiveForNonA4`: pensiunkan atau jadikan internal (turunan selalu berjalan).
7. Tab kepala/kaki (R-30) diturunkan dari bentang penuh.
8. Penjaga nilai: preset Manual 000 menyematkan nilai terukur (blueprint §2.3 :222). `paramsSha256` efektif untuk A4 potret harus identik sebelum/sesudah (blueprint §2.3 :320).

Dampak hitungan bila diadopsi (untuk SR-59): kelas T bertambah 7 (P4G-01, P4G-03, P4G-11, P5-14, P7-20, P9-36, P9-45). Kunci baru: +2 (`page.size`, `page.orientation`). Cakupan `slot` naik menjadi minimal 1.
