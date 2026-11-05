---
schema_version: 1.0
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
date: 2026-11-05
agent: data-analyst
row: C05 (blueprint identification/03_structured_datum_coverage_round.md:183)
type: requirements
confidence: HIGH for key names, defaults, IDs, compliance and scorer-flip mechanics (code read at HEAD 8c7c803 with file:line); MEDIUM for the coverage projection (strict-rule judgement is C33's, and four cells carry a named judgement risk)
mode: read-only on code, DB and controller files; only this file written
consumers: C06-C28 (sole source of names), C25 (scorer alignment), C29/C32/C33 (gates, projection), U02 (category rows)
binding: D-590, D-594 (U3), D-595 (U4), D-605 (1), D-608, D-609, D-625, D-626, D-627, D-628, D-630, D-631
---

# 38 - Names and constants register for the DATUM Rev A coverage round (C05)

Abbreviations: `L` = `src/lib/studio`. `ID:n` / `EN:n` = line n of `C:/Users/TRIAL/gsp-backups/datum-revA-20261104/manual_id.txt` / `manual_en.txt` (read as data). "The 10" = the Rev A doc-type templates of `prisma/seed-doc-type-templates.ts`. "Old templates" = the 7 pre-Rev-A templates + the two presets they use. `C-n` = the M1 conditions of `research/35` §5. Coverage scoring: C = 1, P = 0.5, N = 0, truncated to one decimal (`research/31:257`).

## 0. Summary

- **14 new registry params**, IDs **R-67..R-80** in `L/params/render.ts`, all class B, surface `advanced`, default = today's behaviour. No name had to change for C-4 (none starts with `color.`, `type.face` or `chart.kind.`). Seven new rows are needed in the U02 category mapping, or seven keys fall into "Lainnya" (section 1.4).
- **2 enum additions**: `sampul belakang` in `device.spine.placements` (no split, C02 proved it); `KLASIFIKASI` in `cover.controlBlock.fields` (split the shared constant, C-6).
- **Text entries**: subtitle, 13 manual column labels, 2 STATUS values, the classification line, and the rule-index labels. There is no back-cover text, because neither manual specifies any. The preparer unit is **template data**, not a text entry.
- **Projected coverage, with the USER's choices (CV-21 skipped) and GF-19 partial (D-631)**: PT 67.2 %, PT-en 72.4 %, LAP/VER 67.8 %, LAP/VER-en 73.2 %, STD 68.9 %, STD-en 74.1 %, NOT 59.3 %, NOT-en 65.6 %. These are 1.7 to 5.3 pp below blueprint §4 "(A) + recommended". The only causes are CV-21 (skipped, -1 on ID T/S) and GF-19 (partial, -0.5 on every pair).
- **Measured score**: RH-03 and RB-05 flip FAIL to PASS on all 10 pairs. CS-11 flips **CS-04, LB-10 and LB-11** from PASS to FAIL on the 8 T/S pairs unless C25 aligns them, with manual citations (section 6). Every pair stays at or above 85 % either way, so the gate does not depend on C25.

## 1. New registry params

### 1.1 Common properties (every key)

| Property | Value | Evidence |
|---|---|---|
| File | `L/params/render.ts`, appended after R-66 (`render.ts:325-335`); `PARAMS_RENDER_COUNT` 45 -> 59 (`render.ts:337`) | C-11; precedent R-65/R-66 |
| ID | R-67..R-80 (free: R-38..R-58 are in `params/structure.ts`, R-59..R-66 in `render.ts`, per the header at `render.ts:9-12`) | C-11 |
| Class | `B` (the `r()` default, `render.ts:35`); no `derive` | C-2 |
| Surface | `advanced`: append `...ids("R-", [67, 80])` to `PARAM_SURFACE_LISTS.advanced` (`L/registry/essentials.ts:78-102`); in no `ESSENTIAL_KNOBS` entry | C-1 |
| Namespace | Explicit override equal to the first key segment whenever it is not `render` (the `r()` default is `"render"`, `render.ts:41`; ParamDef rule `L/contract/types/params.ts:141-142`) | C-11 |
| Group / chapter / origin | `R` / `"Renderer"` / `contract` (the `r()` defaults, `render.ts:38-40`). The UI no longer reads `chapter` (D-630) | - |
| Scope | From the existing `PARAM_SCOPE` rules (`L/registry/slots.ts:173-274`). No new scope row is needed | SC-2 test `params-surface.test.ts:72-77` |
| Counts | `RENDER_PARAM_COUNT` 45 -> 59, `ALL_PARAM_COUNT` 788 -> 802, `CATALOG_PARAM_COUNT` stays 722 (`L/params/index.ts:34-37`) | C-11 |
| Pins C06 must update | `tests/unit/studio/renderers/fixtl-toc-levels-roles.test.ts:89-92` (45/788 -> 59/802); `tests/unit/studio/registry/s11-doc-typecode-nda.test.ts:31` (canonical sha, recomputed, not predicted) | verification/30 R2 |

### 1.2 Key table

"Today" quotes the code that the default must reproduce. "Reader" is where C08-C28 read the key: E = engine (`ctx.tpl.params`), C = compose, S = render service.

| ID | Key | Type, default | Enum / range | Today (file:line) | Reader | Scope (rule) | Namespace override | UI category (research/39) | Label (ParamDef.label) |
|---|---|---|---|---|---|---|---|---|---|
| R-67 | `controlSheet.subtitle.enabled` | bool, `false` | - | No subtitle. The control sheet has only kicker + title = slot label (`L/services/compose/front.ts:94-98`), and no subtitle text exists in `WRAPPER_TEXT` (`L/engine/front/texts.ts:74-86`) | E: control-sheet page (`L/engine/docx/wrapper/pages.ts:281`) + HTML wrapper | `section:controlSheet` (prefix `controlSheet.`, `slots.ts:248`) | `controlSheet` | Lembar kendali (**new R row** `controlSheet`) | Subjudul lembar kendali |
| R-68 | `controlSheet.signatures.fillRoles` | bool, `false` | - | One column per payload role (`compose/front.ts:113-122`; `signatureXml` `n = s.roles.length`, `L/engine/docx/wrapper/render.ts:521-522`). The client sends 1-3 roles (`scripts/studio/mcp/write-client.ts:220-226`) | E: `signatureXml` + HTML `signatureHtml` | `section:signatureBlock` (`slots.ts:247`) | `controlSheet` | Lembar kendali (new R row `controlSheet`) | Selalu tiga kolom tanda tangan |
| R-69 | `controlSheet.columns.form` | enum, `"mesin"` | `["mesin", "manual"]` | Fixed engine columns Rev/Tanggal/Uraian/Oleh, Lapis/Peran/Nama/Tanggal, Salinan/Pemegang (`texts.ts:109-114`; mapping `compose/front.ts:99-108`) | **C**: `controlSheetFront` (`compose/front.ts:90-111`) | `section:controlSheet` (`slots.ts:248`) | `controlSheet` | Lembar kendali (new R row `controlSheet`) | Bentuk kolom tabel lembar kendali |
| R-70 | `cover.title.maxWidthMm` | mm, `null` | range `{min: 50, max: 166, step: 1}` | Title roles have no right indent: `cover.titleFirst` / `cover.titleLast` paragraphs `ex(0, 0, 580)` / `ex(0, 180, 580)` (`L/engine/docx/wrapper/formats.ts:179-182`) | E: `formats.ts` cover title roles (+ HTML) | `section:cover` (`slots.ts:249`) | `cover` | Sampul (**new R row** `cover`) | Lebar maksimum judul sampul (mm) |
| R-71 | `render.docx.pageBackground` | bool, `false` | - | No `w:background` and no `w:displayBackgroundShape` in the DOCX engine (grep, `research/36` §3) | E: DOCX package parts `document.xml` + `settings.xml` | `document` (fallback, `slots.ts:273`) | - | Renderer & ekspor (existing `render.docx` row) | Latar halaman DOCX dari warna kertas badan |
| R-72 | `runningHead.ruleColour` | hex, `"C3CBD1"` | - | `INK200 = "C3CBD1"` (`L/engine/docx/package/header-footer.ts:50`) used by the running-head bottom border `{ val: "single", sz: 5, space: 1, color: INK200 }` (`header-footer.ts:75`) | E: `runningHeadFormat` (`header-footer.ts:68-77`) | `section:runningHead` (`slots.ts:244`) | `runningHead` | Kepala & kaki halaman (existing R row `runningHead`) | Warna garis kepala halaman |
| R-73 | `device.registerBlock.topRuleColour` | hex, `"101418"` | - | `INK900 = "101418"` (`header-footer.ts:48`) used by the register cell top border `{ val: "single", sz: 8, space: 0, color: INK900 }` (`header-footer.ts:364`) | E: `registerBody` (`header-footer.ts:354-372`) | `section:registerBlock` (`slots.ts:239`) | `device` | Kepala & kaki halaman (**new R row** `device`) | Warna garis atas blok register |
| R-74 | `render.rhythm.snapToBaseline` | bool, `false` | - | No snapping. `grid.verticalRhythm.multipleOfBaseline` exists but is unread, and its default `true` with class K (`L/params/page.ts:118-128`) differs from today's output, so wiring it would change old templates (verification/22 §5) | E: DOCX spacing code (C19 declares) | `document` | - | Halaman & grid (**new** `render.<seg>` row `rhythm`) | Kunci tinggi unsur ke garis dasar 13,5 pt |
| R-75 | `render.rail.reserveColumn` | bool, `false` | - | `framePr` renderer: rail space is per paragraph, so only chip hosts narrow (`L/engine/docx/blocks/rail.ts:14-21`) | E: `rail.ts`, `L/engine/docx/package/section.ts`, table guards | `section:evidenceRail` (prefix `render.rail.`, `slots.ts:238`) | - | Halaman & grid (existing `render.rail` row) | Cadangkan kolom rel bukti di setiap halaman interior |
| R-76 | `render.nota.classificationLine` | bool, `false` | - | No classification line on NOTA output. Only the explicit MCP cover pair exists, and NOTA has no cover (verification/22 CL-02 row; `write-client.ts:194-203`) | E: number-block renderer (C16 declares) | `document` | - | Penomoran & klasifikasi (**new** `render.<seg>` row `nota`) | Baris klasifikasi di bawah nomor |
| R-77 | `render.ruleIndex.fromMarkers` | bool, `false` | - | The `ruleIndex` block renders empty with warning `RULE_INDEX_MARKER_ONLY` (`L/engine/docx/assemble/index.ts:250-252`); an empty AUTO marker is dropped (`L/engine/docx/assemble/units.ts:188-193`) | E: `units.ts` + shared builder; HTML `L/engine/html/assemble/slots.ts:229-231` | `document` | - | Penomoran & klasifikasi (**new** `render.<seg>` row `ruleIndex`) | Indeks aturan dari penanda kode di isi |
| R-78 | `naming.file.form` | enum, `"judulNomorRevisi"` | `["judulNomorRevisi", "judulTanggalIso"]` | `datumFileName(title, docNumber, rev, ext)` -> `<Judul> <nomor-berkas> Rev<X>` (`L/services/storage/paths.ts:196-208`), called at `L/services/render/pure/render.ts:362-365`. Class T `naming.file.pattern` is untouched | S: `render/pure/render.ts`, `storage/paths.ts` | `document` | `naming` | Penomoran & klasifikasi (**new R row** `naming`) | Bentuk nama berkas |
| R-79 | `cover.controlBlock.preparerUnit` | string, `""` | - | `PENYUSUN: meta.author` (`texts.ts:251`) | E: `controlBlockRowsText` (`texts.ts:247-272`); see risk K-6 for the explicit block | `section:cover` (`slots.ts:249`) | `cover` | Sampul (new R row `cover`) | Unit penyusun di blok kendali sampul |
| R-80 | `device.registerBlock.sheetNumbering` | enum, `"dokumen"` | `["dokumen", "bab1"]` | No `w:pgNumType` in the DOCX engine (grep `engine/docx`: 0, verification/22 RB-08c row); register cell 3 = PAGE then NUMPAGES fields (`header-footer.ts:340-341`) | E: `section.ts` (pgNumType) + `header-footer.ts` register fields | `section:registerBlock` (`slots.ts:239`) | `device` | Kepala & kaki halaman (new R row `device`) | Mulai penomoran lembar |

`ruleRef` per key (ParamDef field, for traceability): R-71 `DT-05`, R-72/R-73 `DT-13d`, R-74 `DT-10b`, R-75 `DT-13e`, R-76 `DT-28c`; all others `-`. `source` per key: `"C05 research/38; <manual lines of section 4>"`.

`classNote` per key (one sentence, absent ≡ default ≡ today):
- R-67: "true = subjudul dari tabel teks di bawah judul lembar kendali (ID:25, EN:25); false = tanpa subjudul".
- R-68: "true = tiga kolom tanda tangan selalu, peran yang tidak dikirim diisi label peran bawaan dengan pemegang kosong".
- R-69: "mesin = kolom sekarang; manual = kolom manual (ID:29, 39, 58; EN:29, 38, 62)".
- R-70: "null = tanpa jorokan kanan; nilai = jorokan kanan judul = bentang penuh - nilai (150 -> 16 mm = 907 tw)".
- R-71: "true = w:background dari color.interior.paper + w:displayBackgroundShape; satu warna per dokumen (research/36)".
- R-72: "garis bawah kepala halaman; bawaan = INK200 sekarang".
- R-73: "garis atas sel blok register; bawaan = ink900 sekarang".
- R-74: "true = jarak judul, tinggi baris tabel dan gambar dibulatkan ke kelipatan 13,5 pt".
- R-75: "true = kolom rel 32 mm dicadangkan di setiap halaman interior (badan 128 mm) tanpa mengubah margin seksi".
- R-76: "true = baris 'Klasifikasi : <K>' / 'Classification: <K>' di bawah nomor dokumen".
- R-77: "true = indeks aturan dibangun dari penanda kode+tingkat di isi (research/37)".
- R-78: "judulTanggalIso = '<judul> <YYYY-MM-DD>.<ext>' (Tabel 2.3)".
- R-79: "kosong = meta.author; nilai = unit penyusun tetap (D-627)".
- R-80: "bab1 = nomor lembar mulai 1 di halaman pertama Bab 1 (ID:2510-2511)".

### 1.3 Compliance per key (C-1..C-12)

Legend: ✓ = met as specified; text = the specific way it is met. "C-3 test" = the unit test C06 or the reader row must add: absent, default and today give byte-identical DOCX and HTML.

| ID | C-1 surface/knobs | C-2 class | C-3 absent ≡ default | C-4 prefix/zebra | C-5 compose list | C-6 enum | C-7 sections | C-8 default valid | C-9 derive/TA | C-10 values only in the 10 | C-11 id/ns | C-12 role/category |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| R-67 | ✓ | ✓ B | Absent/false: no paragraph emitted. C-3 test | ✓ `controlSheet.` | ✓ engine-read; not in the list (assumes C08 moves to the engine, research/35 §11 rec. 2) | n/a | ✓ | ✓ bool | ✓ | Shared layer | ✓ R-67 / `controlSheet` | Existing role `cover.standfirst` (`L/contract/enums.ts:189`); category Lembar kendali |
| R-68 | ✓ | ✓ B | Absent/false: `n = s.roles.length` unchanged. C-3 test | ✓ | ✓ engine-read (assumes C09 moves to the engine) | n/a | ✓ | ✓ | ✓ | Shared | ✓ R-68 / `controlSheet` | Existing `signature.space` / role rows; Lembar kendali |
| R-69 | ✓ | ✓ B | `mesin`: heads from `controlSheetColumnHeads` unchanged. C-3 test, plus `composeContextOf` byte-equal for absent vs `mesin` | ✓ | **Compose-read**: append to `COMPOSE_PARAM_KEYS` (`L/services/compose/context.ts:12-29`) **and** `NORM_COMPOSE_PARAM_KEYS` (`L/contract/types/v2/norm.ts:58-74`) in the same position (last). `pick` (`context.ts:45-49`) drops it when absent, `null` or `"mesin"` | New enum; default in enum | ✓ | ✓ | ✓ | Shared | ✓ R-69 / `controlSheet` | Existing `controlTable.header` / `controlTable.cell`; Lembar kendali |
| R-70 | ✓ | ✓ B | `null`: no `indRightTw` added to the title roles. C-3 test | ✓ `cover.` | ✓ engine | n/a | ✓ | ✓ (`null` only because the default is `null`, `L/engine/tokens/merge.ts:49-50`) | ✓ not a `marginsFromDensity` target | Shared (inert on NOTA: no cover unit) | ✓ R-70 / `cover` | Existing `cover.titleFirst/Last`; Sampul |
| R-71 | ✓ | ✓ B | false: no `w:background`, no `w:displayBackgroundShape`. C-3 test on `document.xml` + `settings.xml` | ✓ (outside `color.`; colour read from the existing `color.interior.paper`) | ✓ engine | n/a | ✓ | ✓ | ✓ | Shared | ✓ R-71 / `render` | No role; Renderer & ekspor |
| R-72 | ✓ | ✓ B | `normalizeHex(v) ?? INK200`; `"C3CBD1"` = constant, so same bytes. HTML must not emit a new CSS variable | ✓ not under `color.`; `C3CBD1` is not `zebraNN` (`L/engine/tokens/color.ts:17, 92-103`) | ✓ engine | n/a | ✓ | ✓ hex, uppercase without `#` like `color-type.ts:60-74` | ✓ | Shared (all 10: RH-03 applies to NOTA) | ✓ R-72 / `runningHead` | No role; Kepala & kaki |
| R-73 | ✓ | ✓ B | `normalizeHex(v) ?? INK900`; same bytes | ✓ | ✓ engine | n/a | ✓ | ✓ | ✓ | Shared (all 10) | ✓ R-73 / `device` | No role; Kepala & kaki |
| R-74 | ✓ | ✓ B | false: spacing code untouched. C-3 test | ✓ | ✓ engine | n/a | ✓ | ✓ | ✓ must not modify any DeriveFn; P4G-14 stays unread | Shared | ✓ R-74 / `render` | No role; Halaman & grid |
| R-75 | ✓ | ✓ B | false: `framePr` K2 rev B path unchanged. C-3 test | ✓ | ✓ engine | n/a | ✓ | ✓ | ✓ must not modify the `railColsTw` / grid derive functions (research/35 §7 GF-24) | Shared | ✓ R-75 / `render` | Existing rail roles; Halaman & grid |
| R-76 | ✓ | ✓ B | false: nothing emitted. C-3 test | ✓ | ✓ engine | n/a | ✓ | ✓ | ✓ | **NOT type layer only** | ✓ R-76 / `render` | Existing role (C16 names it); Penomoran & klasifikasi |
| R-77 | ✓ | ✓ B | false: marker-only path (`assemble/index.ts:250-252`) and D-299 omission unchanged. C-3 test | ✓ | ✓ engine | n/a | ✓ uses the existing `ruleIndex` section type; no `SECTION_REGISTRY` edit | ✓ | ✓ | **STD type layer only** | ✓ R-77 / `render` | Existing table roles; Penomoran & klasifikasi |
| R-78 | ✓ | ✓ B (does not touch class T `naming.file.pattern`) | `judulNomorRevisi`: `datumFileName` path unchanged; existing file-name tests unchanged | ✓ | ✓ service, not compose | New enum; default in enum | ✓ | ✓ | ✓ | **NOT type layer only** | ✓ R-78 / `naming` | No role; Penomoran & klasifikasi |
| R-79 | ✓ | ✓ B | `""`: `PENYUSUN = meta.author` unchanged. C-3 test | ✓ | ✓ engine | n/a | ✓ | ✓ empty string | ✓ | **ID/EN language layers** | ✓ R-79 / `cover` | Existing `cover.controlValue`; Sampul |
| R-80 | ✓ | ✓ B | `dokumen`: no `w:pgNumType`, cell 3 unchanged. C-3 test | ✓ | ✓ engine | New enum; default in enum | ✓ | ✓ | ✓ | **ID language layer only** | ✓ R-80 / `device` | No role; Kepala & kaki |

No key needs a new RoleKey (C-12 first clause).

**Name adjustments: none required.** I checked each proposed name against C-4 (no `color.`, `type.face` or `chart.kind.` prefix; no default shaped like `zebraNN`), C-9 (no match for `TYPE_TA_RE` `type.scale.X.size|leading`; no `marginsFromDensity` target), the existing key set (no collision: `device.registerBlock.cells`, `naming.file.pattern` and `controlSheet.signatures.roles` are different keys), and `PARAM_SCOPE` (every key resolves through an existing rule). One semantic note: `render.nota.classificationLine` and `naming.file.form` carry "nota"/"file" in the name, but the readers must not branch on tier or type code (U4, D-595). They act wherever the flag is set, and only the NOT type layer sets it (C-10).

### 1.4 UI category mapping rows required (research/39; C-12 second clause)

U01's rules resolve group-R keys by namespace, and `render.*` keys by their second segment. Unmapped keys fall into "Lainnya", and the U02 test fails (`research/39:53, 319`). Seven rows are needed:

| New row | Category | Keys caught | Sub-group label (existing, category-scoped, `research/39:247-262`) |
|---|---|---|---|
| R namespace `controlSheet` | Lembar kendali | R-67, R-68, R-69 | `controlSheet` "Lembar kendali" |
| R namespace `cover` | Sampul | R-70, R-79 | `cover` "Unsur sampul" |
| R namespace `device` | Kepala & kaki halaman (= the P4S group default; mirror E07-E09 if a future R `device.datumRule.` / `device.evidenceRail.` / `device.spine.` key appears) | R-73, R-80 | `device` "Blok register, pita segel, cap terbit" |
| R namespace `naming` | Penomoran & klasifikasi | R-78 | `naming` "Pola nama berkas dan ID" |
| `render.<seg>` `rhythm` | Halaman & grid (vertical rhythm is a grid rule, like P4G-14 `grid.verticalRhythm.*`) | R-74 | `render` "Seksi dan perender kolom catatan (DOCX)" (optional relabel: "Seksi, rel, dan irama (DOCX)") |
| `render.<seg>` `nota` | Penomoran & klasifikasi (next to `classification.*`, E23) | R-76 | `render` "Daftar isi dan pemisah nomor (DOCX)" (optional relabel: "Daftar isi, nomor, dan klasifikasi (DOCX)") |
| `render.<seg>` `ruleIndex` | Penomoran & klasifikasi (a generated finding aid like the TOC, decision D18 `research/39:298`; the alternative Lint & pemeriksaan is hidden in the advanced view, `research/39:63`) | R-77 | as above |

Keys that need no new row: R-71 (`render.docx` -> Renderer & ekspor), R-72 (`runningHead` -> Kepala & kaki), R-75 (`render.rail` -> Halaman & grid).

**New per-category totals for the U02 pins** (`research/39:222-239`): Lembar kendali 7 -> 10, Sampul 22 -> 24, Kepala & kaki 22 -> 25, Halaman & grid 55 -> 57, Penomoran & klasifikasi 37 -> 40, Renderer & ekspor 49 -> 50, Lainnya 0. Total 788 -> 802. Advanced 366 -> 380 (per category: +3, +2, +3, +2, +3, +1).

**Ownership delta for the controller.** C06 owns only `L/params/**` + `essentials.ts` + `index.ts` (research/35 §8). The category module and U02 test live in `src/components/studio/template-editor/` (U02/U03 ownership). Unless the same row adds these seven rows and updates the U02 count pins, the U02 test fails from C06 onward. Add both to C06's ownership, or schedule one small row in W3 after U03.

## 2. Enum additions

| Key (ID) | Change | Default | Why no default change | Evidence |
|---|---|---|---|---|
| `device.spine.placements` (P4S-25) | `enum` becomes `["margin luar sampul", "pembatas", "sampul belakang"]` at `L/params/page.ts:332` | Unchanged `["margin luar sampul", "pembatas"]` (`page.ts:328`) | Default and enum are separate literals; no C-6 split needed | C02 probe: baseline 8/8 SAME, canonical sha unmoved by the enum-only edit (verification/30 §2, §4.5 "enum-only ... 29 tests passed") |
| `cover.controlBlock.fields` (P4V-12) | **Split the constant.** Keep `COVER_CONTROL_FIELDS` (`page.ts:368-377`) as the default. Add `COVER_CONTROL_FIELD_ENUM = [...COVER_CONTROL_FIELDS, "KLASIFIKASI"]` and use it as `enum` at `page.ts:426-429` | Unchanged 8-field list | Today one constant serves both default and enum (`page.ts:426-427`). Appending to it would change the default, and the baseline sample has `meta.classification = "TERBATAS"` (research/35 P6), so the baseline would show DIFF | C-6; research/35 §3 P6 |

C-6 companion (C15): the absent-path fallback `pStrList(params, "cover.controlBlock.fields", Object.keys(CONTROL_FIELD_LABELS))` (`texts.ts:259`) must switch to the registry default list (`registryDefault("cover.controlBlock.fields", ...)`, pattern `texts.ts:28-32`) **before** a `KLASIFIKASI` label entry is added. Otherwise the new label silently enters the absent-path list.

The enum value strings `sampul belakang` and `KLASIFIKASI` are identifiers in the style of the existing values (`"margin luar sampul"`, `"NOMOR DOKUMEN"`). They are never printed.

## 3. Text-table entries (single source `L/engine/front/texts.ts`, owner C07)

Source text is in mixed case. Display capitals come from role formats (`caps`), not from source text (D-46; `texts.ts:12-13`). The table-header role is capitalised (`type.scale.tableHeader.upper = true`, `L/params/color-type.ts:224`).

### 3.1 Control-sheet subtitle (CS-12)

| Entry (proposed name) | ID | EN | Manual |
|---|---|---|---|
| `WRAPPER_TEXT.controlSubtitle` | Kendali dokumen, riwayat revisi, dan pernyataan verifikasi | Document control, revision history and verification statement | `ID:25`; `EN:25` (verbatim; the EN line has no serial comma) |

Placement constraint: the subtitle goes **after** the title paragraph. CS-02 reads the first two non-empty paragraphs as kicker and title (`benchmark/datum_conformance/rules/structure_a.ts:674-679`). The text does not match the block-heading pattern `^([A-Z]) · (.+)$` (`structure_a.ts:264`), so CS-03 is unaffected.

### 3.2 Manual control-sheet column labels (CS-11)

The `controlSheet.*.columns` params hold the column identifiers. Their defaults are the manual order (`page.ts:453-456` revision, `:466-467` verification, `:483-485` distribution). The text table maps each identifier to a per-language label, using the `CONTROL_FIELD_LABELS` pattern (`texts.ts:203-212`). Proposed name: `CONTROL_SHEET_COLUMN_LABELS`.

| Identifier | ID label | EN label | Manual |
|---|---|---|---|
| REV | Rev | Rev | `ID:29`; `EN:29` |
| TANGGAL | Tanggal | Date | `ID:29`; `EN:29` |
| PENYUSUN | Penyusun | Prepared by | `ID:29`; `EN:29` |
| PERUBAHAN | Perubahan | Change | `ID:29`; `EN:29` |
| STATUS | Status | Status | `ID:29`; `EN:29` |
| LAPIS | Lapis | Layer | `ID:39`; `EN:38` |
| METODE | Metode | Method | `ID:39`; `EN:38` |
| OBJEK | Objek | Object | `ID:39`; `EN:38` |
| HASIL | Hasil | Result | `ID:39`; `EN:38` |
| SALINAN | Salinan | Copy | `ID:58`; `EN:62` |
| PEMEGANG | Pemegang | Holder | `ID:58`; `EN:62` |
| MEDIA | Media | Medium | `ID:58`; `EN:62` |
| KEMBALI | Kembali | Return | `ID:58`; `EN:62` |

Resulting header rows (manual form): revision ID `Rev, Tanggal, Penyusun, Perubahan, Status` / EN `Rev, Date, Prepared by, Change, Status`; verification ID `Lapis, Metode, Objek, Hasil` / EN `Layer, Method, Object, Result`; distribution ID `Salinan, Pemegang, Media, Kembali` / EN `Copy, Holder, Medium, Return`.

Row mapping for C10, using existing payload fields only (U3):
- Revision `[rev, date, by, what, STATUS]` (today `[rev, date, what, by]`, `compose/front.ts:99`).
- Verification `[layer, "", "", ""]`. The payload carries layer/role/name/date (`compose/front.ts:103`), but the manual chain has no role or name column (`ID:39`; `EN:38`). METODE/OBJEK/HASIL have no payload source, and CS-08 V1 stays out of scope (D-627 Q8).
- Distribution `[copy, holder, "", ""]`.

C10 must accept, and record, that names leave the verification table in manual form. They remain in the revision PENYUSUN column and in the signature block.

STATUS values (derived, not payload):

| Entry | ID | EN | Basis |
|---|---|---|---|
| `CONTROL_SHEET_STATUS_TEXT.current` (latest revision row) | Berlaku | In force | `ID:31`; `EN:31` |
| `CONTROL_SHEET_STATUS_TEXT.superseded` (earlier rows) | Diganti | Superseded | **Hypothesis:** no manual line. Both specimens show only one row. Today's MCP client sends one revision row (`write-client.ts:215`), so only "Berlaku"/"In force" prints in practice |

### 3.3 KLASIFIKASI / CLASSIFICATION label (CL-02 T/S)

| Entry | ID | EN | Manual |
|---|---|---|---|
| `CONTROL_FIELD_LABELS.KLASIFIKASI` = reference to `FRONT_PAYLOAD_LABELS.classification` (`texts.ts:221`); no second literal | Klasifikasi | Classification | `ID:1`, `ID:21` ("KLASIFIKASI"); `EN:1`, `EN:21` ("CLASSIFICATION"); DT-28c `ID:609-612`, `EN:645-648` |

Value: `classificationMarkText(meta.classification)` (capitals, `texts.ts:62-64`; `ID:611` "Tulis klasifikasi kapital"). LB-01 already accepts both labels (`benchmark/datum_conformance/rules/expect_language.ts:121, 163`).

### 3.4 Back-cover text (CV-19)

**None.** Both manuals ask only for the Spine String on the back cover: DT-13f `ID:2718-2723` ("string punggung ada di sampul, pembatas, dan sampul belakang"), `EN:2766`, `EN:2778-2783`. A grep of both manuals for "sampul belakang | back cover" returns only those lines. C12 prints `spineTextOf(meta, params)` (`texts.ts:283-297`) on an otherwise blank back-cover page. No `texts.ts` entry is added.

### 3.5 Preparer unit (CV-15): template data, not a text entry

| Language-layer value of `cover.controlBlock.preparerUnit` | Manual |
|---|---|
| ID: `Divisi Engineering PT GSP` | `ID:16` (specimen "PENYUSUN Divisi Engineering PT GSP"); `ID:2487` ('Nilai penyusun selalu "Divisi Engineering PT GSP"'). Confirmed |
| EN: `Engineering Division, PT GSP` | `EN:16` (specimen "PREPARED BY Engineering Division, PT GSP"); `EN:2558` ('preparer (always "Engineering Division, PT GSP")'). Confirmed |

Reason for data instead of `texts.ts`: D-627 Q2 says "unit divisi dari data templat", and C-10 says values are set only in the 10's layers. The label stays `Penyusun` / `Prepared by` (`texts.ts:206`), so the CR-4 marker "preparer label present" (`benchmark/datum_conformance/rules/language.ts:581`) is kept.

### 3.6 Rule-index labels (ST-01, from research/37 R6)

| Entry (proposed) | ID | EN | Basis |
|---|---|---|---|
| `RULE_INDEX_TEXT.title` | Indeks aturan | Rule index | `ID:4517`; `EN:4441` ("Annex B · Rule index"). Sentence case as printed, not the slot UI label "Indeks Aturan" (`prisma/seed-doc-type-templates.ts:65, 119`) |
| `RULE_INDEX_TEXT.columns` | Kode, Ringkas, Tingkat, Bab | Code, Summary, Level, Ch | `ID:4530`; `EN:4456`. SHORT TEST column omitted (research/37 R3). **Deviation from research/37:** EN `Ch` without a period, so the capitalised header shows `CH` exactly as at `EN:4456` |
| `RULE_INDEX_TEXT.source` (text after the run label) | Blok aturan dokumen ini | Rule blocks of this document | Modelled on `ID:4708` / `EN:4533`; proposed wording, not manual text. The run label itself = `APPARATUS_TEXT.source` ("Sumber"/"Source", `texts.ts:374`), so LB-09 sees SUMBER/SOURCE |
| `RULE_INDEX_TEXT.empty` (SLOT-scope or required slot only) | Dokumen ini tidak memuat kode aturan. | This document states no rule codes. | Proposed wording (research/37 R5 row 2); not manual text |
| Appendix chapter cell | `WRAPPER_TEXT.appendix[lang]` + key ("Lampiran A" / "Annex A") | | `texts.ts:83`; research/37 R3 |

Log codes (not text): `RULE_INDEX_DUPLICATE_CODE` (warn), `RULE_INDEX_EMPTY` (info), from research/37 R4/R5.

### 3.7 NOTA classification line (CL-02 NOTA)

| Entry (proposed) | ID | EN | Manual |
|---|---|---|---|
| `CLASSIFICATION_LINE_SEPARATOR` (built as `FRONT_PAYLOAD_LABELS.classification[lang]` + separator + `classificationMarkText(meta.classification)`) | `Klasifikasi : TERBATAS` (separator `" : "`) | `Classification: TERBATAS` (separator `": "`) | ID: "Baris Klasifikasi : di bawah Nomor (surat: Sifat :)" `ID:612-613`, and the ID specimen "Sifat : TERBATAS" `ID:4109` (space before the colon, as in Tata Naskah Dinas). EN: "a Classification: line under the number" `EN:647-649`, specimen "Classification: RAHASIA" `EN:4184` |

Note: the blueprint and verification/22 spell the ID line "Klasifikasi:". The manual's ID form has a space before the colon, and this register follows the manual. Value styling: seal, bold (DT-28d `ID:619-620`; `EN:657-661`) through run properties on an existing role (C-12). Placement "under the document number" (`ID:611`) is C16's to locate in NOTA output; see risk K-7.

### 3.8 Language-safety check of every new string

The CR-4 critical tokens are checked as foreign markers (`language.ts:585-600`): ID tokens across the whole text of EN documents, EN tokens in wrapper locations of ID documents (`expect_language.ts:132, 175-180`). None of the EN strings above contains an ID critical token (`Lembar Kendali`, `KLASIFIKASI`, `SALINAN INDUK`, `TERBITAN`, `Tanggal`, `Uraian`, `Oleh`, `Pemegang`, `LEMBAR`, `Penyusun`, `Rp`). None of the ID strings contains an EN critical token (`CLASSIFICATION`, `MASTER COPY`, `ISSUE`, `SHEET`, `OF` in a register cell, `Control Sheet`, `Contents`, `Prepared by`, `Reviewed by`, `Approved by`, `Author`, `Chapter`, `Appendix`, `Revision history`, `Verification chain`, `Controlled distribution`). `Status` is in neither list. The ID extension tokens (AC6-03, `expect_language.ts:135-140`) appear only in ID documents.

## 4. Opt-in values for the 10 templates (C23, `prisma/seed-doc-type-templates.ts`)

C-10 mechanism: add optional `layer?: ParamRecord` **data fields** to `DocTypeLayer` (`seed-doc-type-templates.ts:69-78`) and `LanguageLayer` (`:89-96`). `composeSpec` (`:136-151`) merges them as `{ ...SHARED_LAYER, ...type.layer, ...lang.layer, "doc.defaultTypeCode", "doc.defaultTier", "doc.language" }`. No key appears in two layers, so the merge order cannot matter. No slug or type branch (U4).

### 4.1 Shared layer (all 10), added to `SHARED_LAYER` (`seed-doc-type-templates.ts:40-45`)

| Key | Value | Manual / decision |
|---|---|---|
| `runningHead.ruleColour` | `"6E1420"` | Tabel 8.1 `ID:2576`, `EN:2646`; DT-13d `ID:2588-2594`, `EN:2660-2666` (RGB 110, 20, 32 = 6E1420) |
| `device.registerBlock.topRuleColour` | `"6E1420"` | Tabel 8.1 `ID:2577`, `EN:2647`; DT-13d as above |
| `render.docx.pageBackground` | `true` (colour = `color.interior.paper` FCFCFB, `color-type.ts:70`) | DT-05 `ID:2528-2533`, `EN:2591-2597`; interior paper `ID:2518-2519`, `EN:2586-2587`; research/36 §1 (one colour per document, `w:displayBackgroundShape` mandatory); D-631 (FCFCFB for the whole document, GF-19 partial) |
| `render.rhythm.snapToBaseline` | `true` | DT-10b `ID:2680-2685`, `EN:2748-2753` |
| `render.rail.reserveColumn` | `true` | `EN:2764` ("Evidence Rail: outer 32 mm column of interior pages"); `ID:2705-2711` ("Rel yang kosong itu benar") |
| `controlSheet.subtitle.enabled` | `true` | `ID:25`; `EN:25` |
| `controlSheet.signatures.fillRoles` | `true` | `ID:2501`; `EN:2570` ("three signature columns") |
| `controlSheet.columns.form` | `"manual"` | `ID:29, 39, 58`; `EN:29, 38, 62` |
| `cover.title.maxWidthMm` | `150` | `ID:2480` ("lebar baris ≤ 150 mm"); `EN:2552` |
| `cover.controlBlock.fields` | **Recommended (8):** `["NOMOR DOKUMEN", "REVISI", "KLASIFIKASI", "PENYUSUN", "KUSTODIAN", "DITUJUKAN KEPADA", "TIER", "BAHASA"]` | `KLASIFIKASI` third, so that with number and revision present it sits in row 2, left column, directly under the number (DT-28c `ID:611` "di baris tersendiri di bawah nomor"; `EN:647`). `DASAR` dropped to keep the 4 × 2 block (`ID:2483`, `EN:2555`; scorer CV-12 fails above 4 rows, `structure_a.ts:539`). The normative field list `ID:2486-2487` / `EN:2558-2559` does not include DASAR (only the specimen `ID:18` does). **Alternative (9 fields, keeps DASAR):** CV-12 fails only when custodian, audience and basis are all sent; the gate payload sends none of them (dev_gate_r2 LB-01 evidence: 5 labels). Controller choice; the recommendation is 8 |
| `device.spine.placements` | `["margin luar sampul", "pembatas", "sampul belakang"]` | DT-13f `ID:2718-2723`; `EN:2766`, `EN:2778-2783` (three places). Overrides the preset pin `["margin luar sampul"]` (verification/22 CV-19 row) |

Cover and control-sheet keys in the shared layer are inert on the two NOTA templates, which have no cover or control-sheet units. Precedent: the shared cover kicker slot override is already composed for NOTA (`seed-doc-type-templates.ts:146`). **C12 constraint:** render the back cover only when the document renders a cover unit. That condition is data-driven, not a tier branch. Otherwise NOTA would gain a back page, and TR-02 (`structure_a.ts:779-795`) and the manual's NOTA form would break.

### 4.2 Type layers

| Type | Key | Value | Manual |
|---|---|---|---|
| NOT (`datum-nota`, `-en`) | `render.nota.classificationLine` | `true` | DT-28c `ID:609-617`; `EN:645-652` |
| NOT | `naming.file.form` | `"judulTanggalIso"` -> `<title> <YYYY-MM-DD>.<ext>`, date = `meta.issueDate` | Tabel 2.3 `ID:487-493` ("Nota Rencana Uji 2026-11-02.md"); `EN:518-523` ("Test Plan Note 2026-11-02.md") |
| STD (`datum-standar`, `-en`) | `render.ruleIndex.fromMarkers` | `true` | `ID:235`, `ID:4515-4522`; `EN:240`, `EN:4439-4445`; research/37 |
| PT, LAP, VER | none | - | - |

### 4.3 Language layers

| Language | Key | Value | Manual / decision |
|---|---|---|---|
| ID (5 templates incl. `datum-nota`) | `cover.controlBlock.preparerUnit` | `"Divisi Engineering PT GSP"` | `ID:16`, `ID:2487`; D-627 Q2 |
| ID | `device.registerBlock.sheetNumbering` | `"bab1"` | `ID:2510-2511` ("Penomoran lembar dimulai dari halaman pertama Bab 1"); D-627 Q4 "Restart at Chapter 1 ... 5 templat ID". On `datum-nota` Chapter 1 is already the first section. RB-08 is EN-only (`benchmark/datum_conformance/catalog.ts:99`), so no scorer effect there |
| EN (5 templates) | `cover.controlBlock.preparerUnit` | `"Engineering Division, PT GSP"` | `EN:16`, `EN:2558`; D-627 Q2 |
| EN | `device.registerBlock.sheetNumbering` | not set (stays `dokumen`) | `EN:2582` ("Sheets count from the cover"); D-590 (each edition follows its own text) |

### 4.4 Rev A preset (M2, GF-08; C21 mechanism, C23 switch)

| Item | Value | Evidence |
|---|---|---|
| Slug | `datum-gsp-rev-a-preset` | research/35 §7 GF-08; D-627 ("Rev A preset"); D-631 |
| Name | `GSP DATUM Rev A` | Blueprint Q5 (`03_structured...:415`) |
| Base | `preset: { slug: "datum-gsp-preset" }`, latest version; `isPreset: true`; ADMIN caller; `datum-gsp-preset` untouched | research/35 §6 M2 (a)-(e) |
| Pins (required, `derived` keys, ADMIN on preset only, `L/services/skeleton/access.ts:235`) | `type.scale.tableNumerals.size` (P4T-S06-size) = **7.8**; `type.scale.tableHeader.size` (P4T-S07-size) = **6.8**; `type.scale.caption.size` (P4T-S08-size) = **7.6** | Tabel 8.2 `ID:2633-2635`; `EN:2703-2705`; registry defaults already equal these (`color-type.ts:223-231`), but `datum-gsp-preset` pins 7 / 6.5 / 7.5 (verification/22 GF-08 row) |
| Pin (recommended, `advanced` key) | `type.scale.tableHeader.trackEm` (P4T-S07-trackEm) = **0.09** (preset today 0.0923) | `ID:2634` "+0,09 em"; `EN:2704`. Keeps the whole Table 8.2 row in one place; without it GF-08 is still judged C (verification/22 says only the three sizes fail) |
| Not pinned | caption leading 11 (already equal); faces, weights, colours, caps, tabular (already equal) | verification/22 GF-08 row |
| Condition | The 10's knob `type.scale.body.size` = 9.5 = preset value (`ID:2632`), so `applyTypeScale` returns early and the pins stay | research/35 §6 M2 (d) (`L/engine/tokens/layer.ts:131`) |
| Switch in the 10 | `presetSlug` = `datum-gsp-rev-a-preset` instead of `DOC_TYPE_PRESET_SLUG` `"datum-gsp-preset"` (`seed-doc-type-templates.ts:24, 143`); the preset slug becomes a guarded-transaction target | research/35 §6 M2 (b), (c) |

## 5. Mechanism per point and projected coverage

### 5.1 Mechanism, reader and row per point

| Point | Mechanism | Key / change | Owner row | Cells changed (pairs) |
|---|---|---|---|---|
| CS-12 | M1 | R-67 + `WRAPPER_TEXT.controlSubtitle` | C07, C08 | N -> C on 8 T/S |
| CS-06 | M1 | R-68; filled roles use `FRONT_PAYLOAD_LABELS.made/checked/approved` (`texts.ts:222-224`), **not** `controlSheet.signatures.roles` (its `DISAHKAN` fails LB-06, `expect_language.ts:122`) | C09 | P -> C on 8 T/S |
| CS-11 | M1 + C-5 | R-69 + `CONTROL_SHEET_COLUMN_LABELS` + STATUS text | C07, C10 | N -> C on 8 T/S ("columns produced", verification/22 §9) |
| CV-20 | M1 | R-70 = 150 -> right indent 16 mm = 907 tw (166 − 150; 1 mm = 56.693 tw) | C11 | N -> C on 8 T/S |
| CV-19 | M1 enum | `sampul belakang` + shared placements | C12 | P -> C on 8 T/S |
| GF-19 | M1 | R-71 (one colour per document) | C13 | **P -> P** on 10 (D-631 partial) |
| GF-22 | M1 | R-72, R-73 = 6E1420 | C14 | P -> C on 8 T/S (NA on NOTA) |
| CL-02 T/S | M1 enum | `KLASIFIKASI` + label | C07, C15 | P -> C on 8 T/S |
| CL-02 NOTA | M1 | R-76 + classification line | C16 | N -> C on 2 NOTA |
| ST-01 | M1 | R-77 + rule-index builder (DOCX C17, HTML per D-631 C17/C22) | C07, C17, C22 | P -> C on STD, STD-en |
| TR-07 | M1 | R-78 | C18 | P -> C on 2 NOTA |
| GF-21 | M1 | R-74 | C19 | P -> C on 10 |
| GF-24 | M1 | R-75 | C20 | P -> C on 10 |
| GF-08 | **M2** | Rev A preset pins (section 4.4) | C21, C23 | P -> C on 10 |
| RB-08c | M1 | R-80 = `bab1` (ID only) | C26 | P -> C on 4 ID T/S |
| CV-15 | M1 | R-79 (language layers) | C27 | N -> C on 8 T/S |
| CV-21 | skipped (D-627 Q3) | none; C28 not run | - | ID stays N, EN stays C |
| NU-06, LB-12, NU-08, NU-09 | excluded (D-627) | none | - | unchanged |
| CL-03, NC-05, NC-07, CS-08 | not in round (D-627 Q7, Q8) | none | - | unchanged |
| GF-20, NC-06, TR-05, CS-09, CV-14 | class C (lint / agent content) | none | - | unchanged |

### 5.2 Expected cells per pair (changed points only; all others as verification/22 §3)

| Point | PT | PT-en | LAP | LAP-en | VER | VER-en | STD | STD-en | NOT | NOT-en |
|---|---|---|---|---|---|---|---|---|---|---|
| CS-12 | N→C | N→C | N→C | N→C | N→C | N→C | N→C | N→C | NA | NA |
| CS-06 | P→C | P→C | P→C | P→C | P→C | P→C | P→C | P→C | NA | NA |
| CS-11 | N→C | N→C | N→C | N→C | N→C | N→C | N→C | N→C | NA | NA |
| CV-20 | N→C | N→C | N→C | N→C | N→C | N→C | N→C | N→C | NA | NA |
| CV-19 | P→C | P→C | P→C | P→C | P→C | P→C | P→C | P→C | NA | NA |
| CV-15 | N→C | N→C | N→C | N→C | N→C | N→C | N→C | N→C | NA | NA |
| GF-22 | P→C | P→C | P→C | P→C | P→C | P→C | P→C | P→C | NA | NA |
| CL-02 | P→C | P→C | P→C | P→C | P→C | P→C | P→C | P→C | N→C | N→C |
| RB-08c | P→C | NA | P→C | NA | P→C | NA | P→C | NA | NA | NA |
| ST-01 | NA | NA | NA | NA | NA | NA | P→C | P→C | NA | NA |
| TR-07 | NA | NA | NA | NA | NA | NA | NA | NA | P→C | P→C |
| GF-08 | P→C | P→C | P→C | P→C | P→C | P→C | P→C | P→C | P→C | P→C |
| GF-21 | P→C | P→C | P→C | P→C | P→C | P→C | P→C | P→C | P→C | P→C |
| GF-24 | P→C | P→C | P→C | P→C | P→C | P→C | P→C | P→C | P→C | P→C |
| GF-19 | P | P | P | P | P | P | P | P | P | P |
| CV-21 | N | C | N | C | N | C | N | C | NA | NA |

### 5.3 Projected coverage per pair (hypothesis until C33 re-scores; truncated)

| Pair | Applicable | Now (v22 rev 2) | Gain | Projected points | C / P / N | **Projected %** | Blueprint §4 "(A) + recommended" | Deviation |
|---|---|---|---|---|---|---|---|---|
| `datum-proposal-teknis` / ID | 29 | 11.5 (39.6 %) | +8.0 | 19.5 | 14 / 11 / 4 | **67.2 %** | 72.4 % | −1.5 pt: CV-21 skipped (−1), GF-19 partial (−0.5) |
| `datum-proposal-teknis-en` / EN | 29 | 13.5 (46.5 %) | +7.5 | 21.0 | 16 / 10 / 3 | **72.4 %** | 74.1 % | −0.5 pt: GF-19 |
| `datum-laporan` / ID | 28 | 11 (39.2 %) | +8.0 | 19.0 | 14 / 10 / 4 | **67.8 %** | 73.2 % | −1.5 pt |
| `datum-laporan-en` / EN | 28 | 13 (46.4 %) | +7.5 | 20.5 | 16 / 9 / 3 | **73.2 %** | 75.0 % | −0.5 pt |
| `datum-laporan-verifikasi` / ID | 28 | 11 (39.2 %) | +8.0 | 19.0 | 14 / 10 / 4 | **67.8 %** | 73.2 % | −1.5 pt |
| `datum-laporan-verifikasi-en` / EN | 28 | 13 (46.4 %) | +7.5 | 20.5 | 16 / 9 / 3 | **73.2 %** | 75.0 % | −0.5 pt |
| `datum-standar` / ID | 29 | 11.5 (39.6 %) | +8.5 | 20.0 | 15 / 10 / 4 | **68.9 %** | 74.1 % | −1.5 pt |
| `datum-standar-en` / EN | 29 | 13.5 (46.5 %) | +8.0 | 21.5 | 17 / 9 / 3 | **74.1 %** | 75.8 % | −0.5 pt |
| `datum-nota` / ID | 16 | 6.5 (40.6 %) | +3.0 | 9.5 | 7 / 5 / 4 | **59.3 %** | 62.5 % | −0.5 pt: GF-19 (equals blueprint "(A) if GF-19 fails", 59.3) |
| `datum-nota-en` / EN | 16 | 7.5 (46.8 %) | +3.0 | 10.5 | 8 / 5 / 3 | **65.6 %** | 68.7 % | −0.5 pt |

Gain composition: ID T/S +8.0 = CS-12 1 + CS-11 1 + CV-20 1 + CV-15 1 + CS-06 0.5 + CV-19 0.5 + GF-22 0.5 + CL-02 0.5 + GF-08 0.5 + GF-21 0.5 + GF-24 0.5 + RB-08c 0.5. EN T/S = the same without RB-08c (+7.5). STD/STD-en add ST-01 (+0.5). NOTA +3.0 = CL-02 1 + TR-07 0.5 + GF-08 0.5 + GF-21 0.5 + GF-24 0.5. Checksums: C + 0.5 P = projected points for every row. Applicability is unchanged from verification/22 §1.

Sensitivity:
- **Upside, GF-19 judged C:** DT-05's own test accepts either colour ("Latar bernilai #FCFCFB atau #FBFAF7", `ID:2531-2533`; `EN:2594-2596`). If C33 reads the point by its UJI line, every pair gains +0.5: PT 68.9, PT-en 74.1, LAP/VER 69.6, LAP/VER-en 75.0, STD 70.6, STD-en 75.8, NOT 62.5, NOT-en 68.7.
- **Downside risks** (each −0.5 on the pairs named): CV-15 on 8 T/S if the explicit MCP block path counts (K-6); RB-08c on 4 ID T/S if "DARI N" is judged part of the point (K-5); CL-02 on 2 NOTA if no number location exists to sit under (K-7). ST-01 stays C as a mechanism even though it is empty in practice (research/37 F9).
- No pair reaches 85 %. This is consistent with D-608 and D-627 Q1 (coverage is informational).

## 6. Scorer rules expected to flip (measured score) and C25 alignment

Baseline: DEV gate r2 (`verification/23_datum_conformance_dev.md:201-210`). ID T/S 63/67 = 94.0 %, EN T/S 65/69 = 94.2 %, NOT 30/33 = 90.9 %, NOT-en 31/34 = 91.1 %. Failing rules today: RH-03, RB-05, SB-02 (T/S), GF-13.

### 6.1 FAIL -> PASS (no scorer change)

| Rule | Pairs | Why it flips | Evidence |
|---|---|---|---|
| RH-03 | 10 | Expectation seal 6E1420, sz 6 ± 1 (`expect_structure_b.ts:77, 118-122`). Today `C3CBD1` sz 5; with R-72 = 6E1420, sz 5 is inside the tolerance | `structure_b.ts:368-384`; `header-footer.ts:75`; gate evidence `verification/23:224` |
| RB-05 | 10 | Expectation top 6E1420 sz 8 ± 1, bottom C3CBD1 sz 5/6. Today top `101418`; with R-73 the top becomes 6E1420 and the bottom stays C3CBD1 sz 5 | `structure_b.ts:508-528`; `header-footer.ts:364-365`; `verification/23:225` |

Unchanged FAILs: SB-02 (preset role format F6E9E9, D-605 (1)) and GF-13 (`RUNNING_HEAD_RIGHT_RUN` INK900, `header-footer.ts:57`). Neither is in this round.

### 6.2 PASS -> FAIL unless C25 aligns (scorer encodes engine output that the manual contradicts)

| Rule | Pairs | Why it flips with CS-11 | Manual citation | Recommended alignment (never a loosening) |
|---|---|---|---|---|
| **CS-04** | 8 T/S | Expected heads = research/31 §4.2 engine lists (`expect_structure_a.ts:40-44, 63-67`); manual form prints the manual heads, so `sameList` fails (`structure_a.ts:715`) | `ID:29, 39, 58`; `EN:29, 38, 62`. The catalog row already cites these lines (`catalog.ts:85`) | Replace the per-language expectation with the manual lists of section 3.2. Calibration effect (datum-gsp prints engine heads): CS-04 becomes FAIL on calibration, as a cited rule. This is allowed under C25 ("unchanged except the cited rules") |
| **LB-10** | 8 T/S (MCP, no agent revision text) | Reads the first-issue note at fixed column index 2 (`language.ts:869`); in manual form index 2 = PENYUSUN and the note is in PERUBAHAN (index 3) | `ID:29` (PERUBAHAN 4th column); `EN:29` (CHANGE 4th) | Locate the change column by header label: `Uraian`/`Change` (engine form) or `Perubahan`/`Change` (manual form). Same check, correct column |
| **LB-11** | 8 T/S (MCP) | Finds the chain table by first head `Lapis`/`Layer` (still true in manual form, `language.ts:877-878`) and reads column 1 as the role (`:880`). Manual column 1 = METODE/METHOD, which is empty, so it fails with "tanpa peran" | `ID:39`, `EN:38`: the manual chain has no role column | NA with reason "manual chain form (LAPIS/METODE/OBJEK/HASIL) has no role column". The rule's subject (MCP role labels) is not printed in manual form. The denominator drops by 1 |

Projected measured score (informational; gate ≥ 85 % holds in both columns):

| Pair group | Today | With this round, no C25 change | With C25 alignment |
|---|---|---|---|
| ID T/S | 63/67 = 94.0 % | 62/67 = 92.5 % (+RH-03 +RB-05 −CS-04 −LB-10 −LB-11) | 65/66 = 98.4 % |
| EN T/S | 65/69 = 94.2 % | 64/69 = 92.7 % | 67/68 = 98.5 % |
| NOT | 30/33 = 90.9 % | 32/33 = 96.9 % | 32/33 = 96.9 % |
| NOT-en | 31/34 = 91.1 % | 33/34 = 97.0 % | 33/34 = 97.0 % |

### 6.3 Rules that must stay as they are (constraints on implementation rows)

| Rule | Constraint | Row |
|---|---|---|
| CS-02 | Subtitle after the title paragraph (`structure_a.ts:674-679`) | C08 |
| LB-06, TR-03 | Filled signature roles use `FRONT_PAYLOAD_LABELS` labels; row 2 (signing space) stays empty (`structure_a.ts:329-336`; `expect_language.ts:122, 164`) | C09 |
| CV-12, CV-13, LB-01 | ≤ 4 control-block rows (`structure_a.ts:539`); KLASIFIKASI is not a core field (`expect_structure_a.ts:84-85`); label allowed (`expect_language.ts:121, 163`) | C15, C23 |
| RB-02, RB-03, CR-4 marker | Register cell 3 keeps `LEMBAR`/`DARI` (`SHEET`/`OF`) and the PAGE-then-NUMPAGES field codes (`structure_b.ts:434-438, 457-458`; `language.ts:565-568`). `bab1` adds only `w:pgNumType w:start="1"` on the first interior section. "DARI N" stays NUMPAGES, which is the manual's own register practice ("LEMBAR 47 DARI 98", `ID:2497`, with 98 = PDF pages, `ID:52`). A CR-4 marker failure is a **critical** failure | C26 |
| RB-07, RB-08 | Back cover and other front pages carry no PAGE/NUMPAGES and no register (`structure_b.ts:544-558`). RB-08 is EN-only (`catalog.ts:99`) | C12, C26 |
| SB-01, interior classification | The back-cover section writes explicit empty header/footer references, as wrapper sections do (`section.ts:168`, research/32 §0.4). An absent reference inherits the interior footer (with PAGE), and the section would then be scored as interior | C12 |
| TR-02 | No back cover on NOTA (section 4.1 C12 constraint) | C12 |
| GF-02, GF-03 | Section margins stay 24/20 mm and 13/26/273/284 mm (`structure_b.ts:688-715`). GF-24 reserves the rail through paragraph/table width, not `w:pgMar` | C19, C20 |
| GF-06 | Body line stays 270 tw exact/atLeast (`expect_structure_b.ts:129`) | C19 |
| GF-10, GF-11 | Figures stay 128 or 166 mm wide; nothing wider than 166 mm (`structure_b.ts:864-901`) | C20 |
| LB-09, CR-4 apparatus | Rule-index SOURCE line uses `APPARATUS_TEXT.source` per language (`expect_language.ts:128, 171`; `foreignApparatusCritical` for EN, `:182`) | C17 |
| X-01..X-05, G-01..G-06 | Clash detectors: per-language text only (section 3.8). The PDF geometry checks may move with GF-21, GF-24 and CV-20; caught by C32, then G-FIX | C19, C20, C11 |

## 7. Gate thresholds and expected INFO lines

| Gate | Threshold / expected output | Source |
|---|---|---|
| Baseline byte gate (every engine row, C23, C29) | `npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts ... --compare C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline` prints **`compare: 8/8 SAME`**, exit 0 (DOCX + HTML of `a_terbit`/`b_nota` × `datum_gsp`/`datum_kanonik`) | verification/30 §4.1; AC-C1 |
| **R1 expected INFO lines** | From the first row that lands a default-bearing param (C06) onward: **exactly 4** lines `INFO compose snapshot <case> baseline <sha> now <sha>`, for `a_terbit_datum_gsp`, `b_nota_datum_gsp`, `a_terbit_datum_kanonik`, `b_nota_datum_kanonik`. The `now` values change with every registry addition and are not compared. The only snapshot fields that differ are `skeleton.templateVersionId` and `compose.skeleton.templateVersionId` (DB-less synthetic ID `file:<paramsSha256[0:16]>:<skeletonSha[0:8]>`, `L/services/templates/import.ts:219`). Before C06: 0 INFO lines. Enum-only rows add none. A 5th INFO line, a changed `compose.params` (C10's C-5 elision must hold), or any non-SAME byte line = **FAIL** | verification/30 R1, §4.2, §5.3; D-631 |
| convert_v2 | `npx tsx benchmark/extract/convert_v2.ts --check`, run 3 times, each exit 0 with SAME for `doc.v2.json` `79290e0732be7253ac0eb6ea3774e411f8e165049908da8595f4a22331c1ee15`, `template.v2.json` `882057c5743273fed1b444a47df64a5dcbe1331a4262f3d8d290a1c1be1c6ba2`, `datum-manual-000.preset.json` `a951b149180345951355c1935e42093334f19789a583e6c7b495cd6abb18804c` | verification/30 §4.3 |
| Seed dry-runs (C06, C23, C30; one at a time on DEV) | `--presets-and-skeletons`, `--contract-templates`, `--doc-type-templates` with `--dry-run`: exit 0, `guard.ok` true, old templates `unchanged` with the same version, paramsSha256 and skeletonSha256. The only differing summary field is `$.canonicalWarn.registryParamsSha256`. `registryInSync` stays false. Section-type plan create 0 / update 0. C23 dry-run additionally plans 10 new versions + 1 new preset (`datum-gsp-rev-a-preset`) with 0 writes. **`--import-manual000-v2` is not run** (it already fails at HEAD, P8) | verification/30 §3, §4.4; D-631 |
| Unit pins | `fixtl-toc-levels-roles` 59/802; `s11-doc-typecode-nda.test.ts:31` canonical sha recomputed in C06; U02 mapping test: Lainnya 0, total 802, per-category totals of section 1.4 | verification/30 §8; research/39 AC 1-3 |
| Old-template snapshot (C30) | slug, latestVersionNo, updatedAt, paramsSha256, skeletonSha256, version count identical before and after | AC-C2 |
| DEV conformance gate per pair (C32; also C44, C51) | Measured score **≥ 85.0 %**, computed to one decimal **without rounding up** ("84,96 = gagal"); N/A leaves the denominator; denominator 0 = fail. **4/4 critical** (CR-1..CR-4; NA is invalid and UNEXERCISED counts as FAIL). **0 clashes** (X-01..X-05 text, G-01..G-06 PDF geometry) | D-608; `research/31:257`; `research/32:24, 34, 74` |
| Coverage | Reported, not gated; truncated to one decimal; compared with section 5.3 | D-608; D-627 Q1; AC-C7 |
| U3 / U4 | MCP payload schema diff empty, `scripts/studio/mcp/**` unchanged; 0 new slug/type branches | AC-C3, AC-C4 |

## 8. Key findings (evidence discipline)

| # | Finding | Confidence | Evidence | Implication |
|---|---|---|---|---|
| K-1 | All 14 proposed names meet C-1..C-12 without renaming | HIGH | Section 1.3; `slots.ts:173-274`; `research/35` §5 | C06 can land them as listed |
| K-2 | Seven keys would land in "Lainnya" without new mapping rows | HIGH | `research/39:53, 165-202` (no R row for `controlSheet`, `cover`, `device`, `naming`; no `render.<seg>` row for `rhythm`, `nota`, `ruleIndex`) | Mapping rows + U02 pins must ship with C06 (ownership delta) |
| K-3 | CS-11 breaks three measured rules that encode engine output | HIGH | `expect_structure_a.ts:40-44, 63-67`; `language.ts:869, 877-880`; manual `ID:29, 39, 58`, `EN:29, 38, 62` | C25 aligns CS-04, LB-10 and LB-11 with citations; the gate holds either way |
| K-4 | GF-22 alone fixes RH-03 and RB-05: the rule sizes already match | HIGH | `header-footer.ts:75, 364-365`; `expect_structure_b.ts:118-123` | +2 measured passes on every pair |
| K-5 | RB-08c must keep NUMPAGES. "DARI N" then counts all sheets, which the manual's own register also does | MEDIUM | `ID:2497`, `ID:52`, `ID:2510-2511`; `structure_b.ts:434-438`; `language.ts:565-568` | Avoids a critical CR-4 failure. C33 may still judge P if it reads N as part of the point |
| K-6 | CV-15 has two print paths. The explicit MCP block prints `meta.author` (`write-client.ts:195`) whenever the agent sends `meta.number`; the gate renders use the auto block (dev_gate_r2 LB-01: 5 auto labels) | MEDIUM | `texts.ts:251`; `write-client.ts:194-203`; `verification/dev_gate_r2/datum_laporan_id.md:143` | C27 should also substitute the value next to the `Penyusun`/`Prepared by` label in explicit control rows, engine-side, with no MCP change. Otherwise C33 may judge CV-15 P (as the LB-07 boundary was recorded) |
| K-7 | NOTA output has no number block in the engine body: the number appears in the footer register | MEDIUM | grep `NOTA` in `L/engine/docx`: 0 hits; register cell 1 `header-footer.ts:327-351` | C16 must locate "under the number" (`ID:611`). If it can only attach to the footer, CL-02 NOTA may be judged P |
| K-8 | GF-19 can only be partial in DOCX/PDF: one background per document | HIGH | research/36 §1 items 1, 5; D-631 | Projection keeps GF-19 at P; upside in section 5.3 |
| K-9 | A back cover risks being scored as interior, or appearing on NOTA | HIGH | Section classification research/32 §0.4; `structure_a.ts:779-795` | C12 constraints in sections 4.1 and 6.3 |
| K-10 | The manual form of the verification chain drops payload role, name and date | HIGH | `compose/front.ts:103`; `ID:39`, `EN:38` | Product trade-off for C10 to record; names remain in the revision and signature tables |

## 9. Files/modules involved (owner rows; read-only here)

- `L/params/render.ts` (R-67..R-80), `L/registry/essentials.ts` (advanced IDs), `L/params/page.ts` (enum split, spine enum), `L/params/index.ts` (counts): C06.
- Category module + U02 test under `src/components/studio/template-editor/` (7 rows, pins): C06 or a small W3 row (**ownership delta**).
- `L/services/compose/context.ts:12-29` + `L/contract/types/v2/norm.ts:58-74` (R-69, C-5): C06 or C10 (research/35 §8).
- `L/engine/front/texts.ts`: C07 (entries), C15 (KLASIFIKASI + C-6 fallback fix), C27 (preparer unit).
- `prisma/seed-doc-type-templates.ts`: C23 (layers, preset slug); `prisma/seed-studio*.ts`: C21 (preset helper).
- `benchmark/datum_conformance/rules/expect_structure_a.ts`, `language.ts` (LB-10/LB-11 column logic), `expect_language.ts` if needed: C25.

## 10. Implementation order

As in the blueprint waves (`03_structured...:329-359`), with these register-driven notes:
1. C06 lands all 14 keys, the two enum edits, the mapping rows and the pins in one row. C07 adds every text entry of section 3 with no caller.
2. C15 fixes the `texts.ts:259` fallback before adding the `KLASIFIKASI` label.
3. C10 adds R-69 to both compose key lists with default elision, and the C-3 test proves `composeContextOf` is byte-equal.
4. C12 and C26 follow the section 6.3 constraints. C25 runs after C05 with the three alignments of section 6.2.
5. C23 sets section 4 values exactly. C33 compares against section 5.3.

Plan draft (`masterplan/02_plan_draft.md`): skipped. This is a research row and the approved blueprint already plans the work.

## 11. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Mapping rows not shipped with C06, so the U02 test fails | High if overlooked | Ownership delta (section 1.4) |
| C25 not run: measured score drops 1.5 pp on T/S | Certain without C25 | Gate still passes (section 6.2); C25 aligns with citations |
| CV-15 explicit-block path (K-6) | Medium | C27 substitutes in explicit rows too |
| RB-08c N semantics (K-5) | Medium | Keep NUMPAGES; C26 records LibreOffice behaviour |
| CL-02 NOTA placement (K-7) | Medium | C16 declares the location; C33 judges |
| GF-21 / GF-24 move PDF geometry (G-01..G-06) or widths | Medium | Section 6.3 constraints; C32; G-FIX ≤ 3 cycles; feature can stay off in the spec (−0.5 per pair) |
| 9-field control block exceeds 4 rows on full payloads | Low (gate payload unaffected) | Recommended 8-field list |

## 12. Acceptance criteria (for this register's consumers)

1. C06: the 14 keys exist with exactly the ID, type, default, enum/range, namespace and surface of section 1.2. `ALL_PARAMS.length` = 802. The U02 test has 0 keys in Lainnya.
2. Every key has a C-3 unit test: absent ≡ default ≡ today's DOCX and HTML bytes.
3. C07 strings equal section 3 byte for byte, and the parity test is green.
4. C23 layers equal section 4. The dry-run shows 10 new versions + 1 preset, 0 writes, and old templates unchanged.
5. C32 meets section 7 on every pair. C33's per-pair values equal section 5.3, or each deviation cites a cell.

## 13. Recommendations / decisions for the controller

1. Adopt the key table as written; no renames.
2. Add the seven mapping rows and U02 pin updates to C06's ownership (or one micro-row in W3).
3. `cover.controlBlock.fields` for the 10: the 8-field list (recommended) or the 9-field list.
4. Confirm the research/35 §11 recommendation that CS-12 and CS-06 move to the engine. This register assumes it; if they stay in compose, C-5 applies to R-67 and R-68 too.
5. C27 covers both cover paths (K-6). C16 declares the NOTA number location (K-7).
6. C25: replace CS-04's expectation with the manual lists, make LB-10 header-based, and give LB-11 an NA reason for the manual chain form.
