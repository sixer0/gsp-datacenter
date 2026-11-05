---
task_slug: doc_artifact_studio
rows: U02, U03, U04
date: 2026-11-05
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/03_structured_datum_coverage_round.md (section 7, rows U02-U04)
spec: docs/2026-10-22_doc_artifact_studio/research/39_param_categories.md
decisions: D-626, D-627, D-630
status: complete (one verification step partial: dev-server log not reachable, see Persistent Issues)
---

# UI param categories (U02, U03, U04)

The USER asked for the advanced settings form to be grouped by category, not by manual chapter. The template editor (`ParamEditor`, used by both the advanced panel and preset mode) and the preview pane's param utilities now share one category helper. The chapter level is gone. Rows are grouped as category, then namespace sub-group, then params. No server, registry, param, data or document-output change was made, no dependency was added, and nothing under `src/lib/studio/**`, `prisma/**`, `scripts/**` or `benchmark/**` was touched.

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| U02 | Category module plus a unit test against the live registry | complete | Test written first and run red (module missing), then green. 14 tests. |
| U03 | `ParamEditor` grouped by category; `values.ts` `groupParams` removed | complete | Component test written first and run red (7 failures), then green. 7 tests. |
| U04 | Preview `param-tools.ts` and the `index.tsx` barrel use the shared helper; chapter grouping removed | complete | Test written first and run red (5 failures), then green. 5 tests. |
| Gate | Studio suite, tsc, eslint, dev-server probe | complete except the dev log | See Test Results and Persistent Issues. |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| `src/components/studio/template-editor/param-categories.ts` | add | The single category module: table, group defaults, E01-E30, the R tables, sub-group labels, `categoryOf`, `subgroupKeyOf`, `subgroupLabel`, `groupByCategory`, `paramCategory` |
| `src/components/studio/template-editor/param-editor.tsx` | modify | Category level replaces the chapter level. Adds two pure exports, `filterParamDefs` and `paramEditorView`. `ClassFilter` is now exported. Open-state IDs are `cat:<id>` and `ns:<categoryId>:<subgroup>`. |
| `src/components/studio/template-editor/values.ts` | modify | Removed `groupParams` and `chapterRank` (grep showed the only user was `param-editor.tsx`) and the now-unused `ParamDef` import |
| `src/components/studio/template-preview/param-tools.ts` | modify | Removed `chapterRank`, `groupParams` and `ParamChapterGroup`. Added `groupParamsByCategory` and `ParamCategorySection`, built on the shared `groupByCategory`. `ParamNamespaceGroup` gains `id` and `label`. The `searchParams` option `chapter` is replaced by `category`. |
| `src/components/studio/template-preview/index.tsx` | modify | The barrel re-exports `groupParamsByCategory` and `ParamCategorySection` instead of `chapterRank`, `groupParams` and `ParamChapterGroup` |
| `tests/unit/studio/ui-categories/param-categories.test.ts` | add | U02 mapping test (14) |
| `tests/unit/studio/ui-categories/param-editor-categories.test.ts` | add | U03 `renderToStaticMarkup` and view-model tests (7) |
| `tests/unit/studio/ui-categories/preview-param-tools-categories.test.ts` | add | U04 test (5) |

## Mapping API (`param-categories.ts`)

```ts
type ParamCategoryId = "warna" | "tipografi" | "halaman-grid" | "sampul" | "lembar-kendali" | "kepala-kaki" | "tabel"
  | "gambar-chart" | "diagram-simbol" | "bukti-angka" | "penomoran-klasifikasi" | "bahasa" | "lint-pemeriksaan"
  | "renderer-ekspor" | "lainnya";
interface ParamCategory { id: ParamCategoryId; label: string; help: string; order: number }
const PARAM_CATEGORIES: readonly ParamCategory[];          // 15 entries, fixed order 1-15 (research/39)
const GROUP_DEFAULT_CATEGORY;                               // research/39 table A (24 groups with keys; P12-P14 and R have none)
const CATALOG_EXCEPTIONS: readonly CatalogException[];      // E01-E30 {row, group, match, category, n}
const R_EXACT_OVERRIDES; const R_RENDER_SEGMENT_CATEGORY; const R_NAMESPACE_CATEGORY;  // research/39 table C
function categoryOf(def: Pick<ParamDef, "group" | "key">): ParamCategoryId;
function subgroupKeyOf(def: Pick<ParamDef, "key">): string; // namespace, or "chart.kind" / "type.scale" (S1)
function subgroupLabel(categoryId, subgroupKey): string;    // category-scoped label, falls back to namespaceLabel()
function groupByCategory<T extends Pick<ParamDef, "group" | "key">>(defs: readonly T[]): ParamCategoryGroup<T>[];
//  ParamCategoryGroup<T> { id: "cat:<id>", category, subgroups: ParamSubgroup<T>[], total }
//  ParamSubgroup<T>      { id: "ns:<categoryId>:<subgroupKey>", key, label, defs: T[] }
function paramCategory(id): ParamCategory;
```

Rules:

- `categoryOf` reads only `group` and `key`. A test passes in a def with a false `chapter`, `namespace` and `surface` and gets the same result.
- For catalog groups, the longest matching exception within the group wins. A match ending in `.` is a prefix match; any other match is an exact key. Without a match, the group default applies.
- For group R, the 5 exact overrides apply first, then the `render.<seg>` table, then the namespace table.
- An unknown R namespace or render segment, or a group with no default, resolves to `lainnya`, so the U02 test fails until someone decides.

Ordering:

- Categories follow `PARAM_CATEGORIES` order, and empty categories are not returned.
- Sub-groups follow the research/39 label-table order. Any unlisted sub-group comes after them, sorted alphabetically. Research/39 says "first-appearance". I chose alphabetical so that the order does not depend on input order, which the test checks with reversed input. No unlisted sub-group exists today.
- Params keep their input (registry) order.

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| New tests | `npx vitest run tests/unit/studio/ui-categories` | `Test Files 3 passed (3)`, `Tests 26 passed (26)` | Each file was run red first (module or exports missing), then green |
| Studio suite | `npx vitest run tests/unit/studio` | `Test Files 262 passed (262)`, `Tests 4764 passed (4764)` | No regressions |
| Typecheck | `npx tsc --noEmit -p .` | exit 0, no output | |
| Lint (changed files) | `npx eslint <5 changed src files> tests/unit/studio/ui-categories/` | exit 0, no output | |
| Lint (touched dirs) | `npx eslint src/components/studio/template-editor src/components/studio/template-preview` | exit 0, no output | |
| `next lint` | `npx next lint` | not available | Next 16.1.6 no longer has `next lint`. It treats `lint` as a project directory ("Invalid project directory provided ... \lint"). eslint was run directly instead (above). |
| DEV 9021 route | `curl http://127.0.0.1:9021/studio/templates`, `/studio/templates/x-probe-u03`, `...?paramFilter=P4V-01..16` | 307 to `/login?next=...` for all three | The brief accepts a redirect. No "Failed to compile", "Module not found" or "Build Error" in the response bodies. |

## Verification (acceptance checks)

U02 (research/39 acceptance criteria 1-4, checked against the live `ALL_PARAMS`):

- `ALL_PARAMS.length === 788`. Every key maps to exactly one category, and Lainnya = `[]`.
- Per-category counts (essential / advanced / other / total) equal research/39 for all 15 rows. Surface totals are 21 / 366 / 72 / 329. **No difference from research/39**: the hand-derived counts matched on the first run.
- Per-sub-group counts for all 14 categories also equal the research/39 "Sub-group labels" table. With S1, Gambar & chart splits into chart 41 + chart.kind 136, and Tipografi into type 21 + type.scale 78.
- All 30 exception rows catch at least one key, and each exact-key row catches exactly 1. 18 spot checks, including E18 beating E17 as the longer match.
- Every R namespace row and every `render.<seg>` row matches at least one live key. Each of the 5 exact overrides matches exactly 1 key.
- Category and sub-group order is pinned and unchanged when the input is reversed. Open-state IDs are `cat:<id>` and `ns:<cat>:<sub>`. Labels are category-scoped: for example, `rules` is "Tebal dan warna garis" in Halaman & grid and "Indeks aturan" in Lint. Unlisted sub-groups fall back to `namespaceLabel`.
- An unknown R namespace, an unknown render segment, and group P12 all resolve to `lainnya`.

U03 (`renderToStaticMarkup`, no new dependency):

- Preset mode shows 14 category headings in research/39 order, no "Bab N" or "Renderer" heading, every heading `aria-expanded="false"`, help line as `title`, and "181 pengaturan" for Gambar & chart.
- On the advanced surface, Bahasa, Lint & pemeriksaan and Lainnya are hidden, leaving 12 categories.
- With `refFilter=["P4V-01..16"]`, the editor is in search mode: only Sampul and Kepala & kaki are shown, both `aria-expanded="true"`, with the sub-group labels "Unsur sampul", "Identitas organisasi" and "Kepala halaman pembungkus", and the technical key in `title="cover"`.
- The "1 diubah" pill appears on the Halaman & grid header and not on Tipografi.
- View-model: a text search filters, and search mode opens every category and sub-group. Without search, the `open` set drives state through `cat:`/`ns:` IDs. The class and inactive filters still work.

Kept unchanged:

- `SEARCH_LIMIT` slicing, the `?paramFilter=` URL sync, and the refFilter chips.
- Buttons stay buttons, so Enter and Space toggle as before, and they stay disabled while searching.
- Classes and tokens are identical. The only additions are `data-category` and `title` attributes.

U04:

- `groupParamsByCategory` returns the same category, sub-group, label, ID and key order as `groupByCategory`. B/K/T counts add up per sub-group and per category, for a total of 788.
- On a subset, empty categories are hidden.
- `searchParams(..., { category: 'sampul' })` returns 22 keys.
- Neither the module nor the barrel exports `chapterRank` or `groupParams`. The template-preview directory contains no `chapterRank` and no `.chapter` (checked by the test).
- Finding: `template-preview/index.tsx` only re-exported the old `groupParams`. No component inside the preview pane renders a grouped param list, and grep found no other consumer in `src/`. U04 therefore changes that exported API and the barrel.

## Before / after structure

Before, the advanced panel (366 keys) was grouped by manual chapter, then by namespace, sorted alphabetically: Bab 3 (2) | Bab 4 (141) | Bab 5 (21) | Bab 6 (2) | Bab 7-8 (149) | Bab 9 (27) | Renderer (15) | Struktur (9). Preset mode showed every chapter, from Bab 1-2 to Renderer.

After, the advanced panel has 12 categories (category (count): sub-groups):

- Warna (27): Palet dan peran warna, Latar halaman
- Tipografi (69): Rupa, bobot, dan aturan huruf 12; Skala huruf per unsur 54; Format run (DOCX) 3
- Halaman & grid (23)
- Sampul (13)
- Lembar kendali (5)
- Kepala & kaki halaman (11)
- Tabel (15)
- Gambar & chart (153): Aturan grafik umum 15; Bawaan per jenis grafik 136; Gambar raster 2
- Diagram & simbol (29)
- Bukti, angka & satuan (12)
- Penomoran & klasifikasi (8)
- Renderer & ekspor (1)

Bahasa and Lint have no advanced keys and are hidden.

After, preset mode (788 keys) has 14 categories: Warna 36 · Tipografi 104 · Halaman & grid 55 · Sampul 22 · Lembar kendali 7 · Kepala & kaki 22 · Tabel 36 · Gambar & chart 181 · Diagram & simbol 101 · Bukti, angka & satuan 66 · Penomoran & klasifikasi 37 · Bahasa 46 · Lint & pemeriksaan 26 · Renderer & ekspor 49. Lainnya is hidden because it is empty.

```
before: [Bab 4 v] -> [Huruf v] -> rows        after: [Tipografi v] -> [Skala huruf per unsur v] -> rows
        open ids ch:<chapter>, ns:<chapter>:<ns>      open ids cat:<categoryId>, ns:<categoryId>:<subgroup>
```

Old open-state IDs (`ch:`) are UI-only state. They reset to closed and no data is lost (research/39 Risks).

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| The DEV 9021 log cannot be checked for "Failed to compile" in these modules | 2 | The proxy redirects every `/studio/templates/*` request to `/login` (307) before the route module is compiled, so curl does not trigger compilation. The dev server (`next dev`, PID 9124, started 2026-11-02 by launcher `hq_v21_clone/dev9021.js` with `stdio: inherit`) writes to a captured task output that stopped growing at 2026-11-04 21:53 (`.../tasks/b7glk284k.output`, 0 "Failed to compile" lines, no `/studio/templates` compile entries). No current log for this process was found. | The substitutes pass: tsc exit 0, eslint exit 0, and vitest imports and server-renders `ParamEditor` and the preview barrel. A compile check in the real route needs a logged-in session, which is U05 (USER login, Q11). | No. It should be confirmed in U05. |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| U02 | Unlisted sub-groups: research/39 says first-appearance order | Sorted alphabetically after the listed ones, so the order is stable against input order (pinned by test). No unlisted sub-group exists today. |
| U02 | Groups P12-P14 have no default (they have no keys) | They resolve to Lainnya, so any future key in them fails the test until it gets a category (same policy as R) |
| U02 | Lainnya help line | The spec text "Fallback; must stay empty (test)" is a developer note, so the user-facing help is "Parameter yang belum berkategori". The category is never shown while empty. |
| U03 | "n diubah" placement | Kept per category only, as the chapter header had it. Sub-group buttons never showed it, so none was added. |
| U03 | Testability without a new dependency | Extracted the pure `filterParamDefs` and `paramEditorView` from the component body (same logic) and tested them directly. The component is tested via `createElement` in a `.test.ts` file, because vitest includes only `tests/**/*.test.ts`. |
| U04 | API change in the preview barrel | `groupParams`, `chapterRank` and `ParamChapterGroup` were replaced by `groupParamsByCategory` and `ParamCategorySection`, and the `searchParams` `chapter` option by `category`. Grep found no consumer in `src/` or `tests/` before the change. |
| U04 | Cross-directory import | `template-preview/param-tools.ts` imports `template-editor/param-categories.ts` (one shared helper, D-630). There is no import cycle: `param-categories` depends only on `param-labels` and the registry types. |

## Next Steps

- U05: browser check on DEV 9021 with the USER's login. It covers both surfaces, confirms there are no "Bab" headings, checks search and a `?paramFilter=` link, and also confirms the route compiles.
- U06: review recommended (scope: the 5 changed `src` files and the 3 new tests; labels, order, accessibility, UI-only diff).
- C05: every new coverage key must resolve outside Lainnya. `param-categories.test.ts` enforces this for group R automatically. New catalog-group keys inherit their group default.


## UX simplification (D-632, 2026-11-05)

The USER gave three instructions for this pass:

- "ui uxnya tolong pikirkan agar eksperience user tidak merasa rumit ya" (keep it simple);
- "gunakan istilah umum yang mudah dipahami saja, jangan over translate" (use common office words, including loanwords such as grid, chart, file, Word, header and footer; no developer jargon);
- "tata letak uinya jg perlu kamu pikirkan agar experiencenya lebih smooth" (make the layout smoother).

The pass is UI only. It made no server, registry, data or output change and added no dependency. Nothing under `src/lib/studio/**`, `prisma/**`, `scripts/**` or `benchmark/**` was touched. The skills loaded were `frontend-design`, `tdd` and `dry-run-verify-fix`.

### Category labels (ids unchanged)

| id | Before | After | Description (shown under the title) |
|---|---|---|---|
| warna | Warna | Warna | Palet warna dokumen, peran tiap warna, dan latar halaman. |
| tipografi | Tipografi | Tipografi | Font, ketebalan, dan ukuran teks untuk judul, isi, dan caption. |
| halaman-grid | Halaman & grid | Halaman & grid (kept, per the USER) | Ukuran kertas, margin, grid, garis penanda, dan kolom catatan. |
| sampul | Sampul | Sampul | Isi dan urutan halaman sampul, teks tepi, dan identitas organisasi. |
| lembar-kendali | Lembar kendali | Lembar kendali | Riwayat revisi, alur verifikasi, distribusi, dan tanda tangan. |
| kepala-kaki | Kepala & kaki halaman | **Header & footer** | Isi header dan footer, blok register, pita segel, dan cap terbit. |
| tabel | Tabel | Tabel | Garis dan kepala tabel, caption, baris sumber, dan tabel spesifikasi. |
| gambar-chart | Gambar & chart | Gambar & chart (kept, per the USER) | Aturan umum chart, pengaturan tiap jenis chart, dan gambar. |
| diagram-simbol | Diagram & simbol | Diagram & simbol | Diagram, simbol standar, dan lembar gambar teknik. |
| bukti-angka | Bukti, angka & satuan | Bukti, angka & satuan | Tanda asal data, penulisan angka dan satuan, serta hitungan biaya. |
| penomoran-klasifikasi | Penomoran & klasifikasi | Penomoran & klasifikasi | Nomor dan jenis dokumen, klasifikasi, pola nama file, dan daftar isi. |
| bahasa | Bahasa | Bahasa | Bahasa dokumen, gaya penulisan, surat dinas, dan kosakata. |
| lint-pemeriksaan | Lint & pemeriksaan | **Pemeriksaan otomatis** | Cek otomatis yang dijalankan sebelum dokumen terbit. |
| renderer-ekspor | Renderer & ekspor | **Pembuatan file & ekspor** | Cara file Word, HTML, PNG, dan PDF dibuat. |
| lainnya | Lainnya | Lainnya | Pengaturan yang belum masuk kategori mana pun. |

The first brief listed "Halaman & kisi", "Gambar & grafik" and "Pemeriksaan mutu". The USER's later correction ("jangan over translate") replaced them, so they were not used. "Header & footer" was not on the brief's list. I chose it under the same rule, because "kepala & kaki halaman" is a forced translation of the Word terms. It is a one-line change in `PARAM_CATEGORIES` if the controller prefers the old label.

### Sub-group labels (only the ones that changed)

| Category | Key | Before | After |
|---|---|---|---|
| Warna | color | Palet dan peran warna | Palet warna |
| Tipografi | type | Rupa, bobot, dan aturan huruf | Font dan ketebalan |
| Tipografi | type.scale | Skala huruf per unsur | Gaya teks per elemen |
| Tipografi | render | Format run dan penanda butir (DOCX) | Format teks dan bullet di file Word |
| Halaman & grid | grid | Kisi dan margin | Grid dan margin |
| Halaman & grid | layout | Mode kolom catatan bukti | Mode kolom catatan |
| Halaman & grid | device | Garis penanda dan kolom catatan bukti | Garis penanda dan kolom catatan |
| Halaman & grid | slot | Pengaturan seksi per bagian | Pengaturan section per bagian |
| Halaman & grid | render | Seksi dan perender kolom catatan (DOCX) | Section dan kolom catatan di file Word |
| Lembar kendali | controlSheet | Lembar kendali (repeated the category name) | Isi lembar kendali |
| Header & footer | runningHead | Kepala halaman | Isi header |
| Header & footer | wrapper | Kepala halaman pembungkus | Header halaman pembungkus |
| Header & footer | render | Tata letak kepala dan kaki (DOCX) | Tata letak di file Word |
| Tabel | table | Tabel (repeated the category name) | Garis, isian, dan kepala tabel |
| Tabel | caption | Keterangan (caption) | Caption tabel |
| Tabel | artifact | Rujukan di prosa | Rujukan tabel di teks |
| Tabel | render | Perender tabel (DOCX) | Tabel di file Word |
| Gambar & chart | chart | Aturan grafik umum | Aturan umum chart |
| Gambar & chart | chart.kind | Bawaan per jenis grafik | Pengaturan per jenis chart |
| Gambar & chart | caption | Keterangan grafik | Caption chart |
| Gambar & chart | image | Gambar raster | Ukuran dan resolusi gambar |
| Diagram & simbol | symbol | Simbol dan dialek | Gaya simbol |
| Diagram & simbol | bpmn / c4 / archimate | BPMN / Model C4 / ArchiMate | Diagram proses BPMN / Diagram arsitektur C4 / Diagram ArchiMate |
| Bukti, angka & satuan | marks | Tanda provenans | Tanda asal data |
| Bukti, angka & satuan | admiralty | Skala Admiralty | Skala keandalan sumber (Admiralty) |
| Bukti, angka & satuan | icd203 | Kemungkinan ICD 203 | Skala kemungkinan (ICD 203) |
| Bukti, angka & satuan | numbers | Angka beban keputusan | Angka penting untuk keputusan |
| Bukti, angka & satuan | derivation | Blok turunan perhitungan | Langkah perhitungan |
| Bukti, angka & satuan | render | Perender blok turunan (DOCX) | Langkah perhitungan di file Word |
| Bukti, angka & satuan | audit | Audit angka SERAH | Audit angka |
| Bukti, angka & satuan | serah | Rute kedua SERAH | Cek silang perhitungan |
| Bukti, angka & satuan | conventions | Konsistensi konvensi | Konsistensi format |
| Bukti, angka & satuan | hps | HPS | Harga perkiraan sendiri (HPS) |
| Bukti, angka & satuan | boq | BoQ | Daftar kuantitas dan harga (BoQ) |
| Penomoran & klasifikasi | artifact | Tier dokumen | Tingkat dokumen |
| Penomoran & klasifikasi | naming | Pola nama berkas dan ID | Pola nama file dan ID |
| Penomoran & klasifikasi | render | Daftar isi dan pemisah nomor (DOCX) | Daftar isi dan nomor di file Word |
| Bahasa | doc | Bahasa, kanal, dan susunan dokumen | Bahasa dan susunan dokumen |
| Bahasa | prose | Prosa | Gaya penulisan |
| Bahasa | normativeQuote | Kutipan normatif | Kutipan peraturan |
| Bahasa | threshold | Ambang diagnosis gaya | Batas kerumitan kalimat |
| Pemeriksaan otomatis | gate | Gerbang rilis | Syarat sebelum terbit |
| Pemeriksaan otomatis | lint | Penegakan lint | Tingkat ketegasan cek |
| Pemeriksaan otomatis | artifact | Lint dan rekonsiliasi per tier | Cek yang aktif |
| Pemeriksaan otomatis | jury | Juri buta | Penilaian juri |
| Pemeriksaan otomatis | checklist | Daftar periksa pra-serah | Checklist sebelum serah |
| Pemeriksaan otomatis | compliance | Regulasi berlaku dan mati | Regulasi berlaku dan dicabut |
| Pemeriksaan otomatis | rules | Indeks aturan | Daftar aturan |
| Pembuatan file & ekspor | render | Berkas DOCX, HTML, PNG | File Word, HTML, dan PNG |
| Pembuatan file & ekspor | artifact | Format keluaran dan PDF | Format file dan PDF |
| Pembuatan file & ekspor | ingest | Kiriman konten v1 | Format teks isi kiriman |
| Pembuatan file & ekspor | slot | Teks pengganti draf | Teks pengisi bagian kosong |
| Pembuatan file & ekspor | workbook | Lembar kerja xlsx (nonaktif) | Workbook Excel (nonaktif) |
| Pembuatan file & ekspor | brief | Ringkasan komando pptx (nonaktif) | Slide PowerPoint (nonaktif) |

The names of standards (IEC 81346, IEC 60617, ISA-5.1, MIL-STD-2525, ISO 5807, ISO 128-2, EIA-310, TIA-606, ISO 7010) are kept, because they are the terms the USER's engineers search for. A test now fails if any category or sub-group label contains lint, renderer, perender, run, namespace, v1, DOCX, tier, provenans, xlsx or pptx, or if a sub-group repeats its category name.

### Header, summary and filter text

| Place | Before | After |
|---|---|---|
| Category row | `27 pengaturan · 2 kelompok`, with the help text only as a tooltip | Title plus a visible one-line description on the left. `27 pengaturan` and a `2 diubah` badge (only when there are unsaved changes) on the right. |
| Summary line | `366 dari 366 parameter · induk: bawaan gaya` | `Menampilkan 366 pengaturan · nilai asal: gaya bawaan` (or `Menampilkan 12 dari 366 pengaturan` when filtered). "induk" in the code is `parentValues`/`parentLabel`, the value that applies when the template does not override a key. The two caller strings are now "gaya bawaan" and "gaya saat ini" (preset mode). |
| Non-admin note | `kelas K terkunci (bukan sesi ADMINISTRATOR)` | `pengaturan Standar DATUM hanya dapat diubah admin` |
| Class select | `Semua kelas (366)`, `Bebas diubah`, `Standar DATUM, admin`, `Dihitung otomatis` | `Semua pengaturan (366)`, `Bebas diubah`, `Standar DATUM, khusus admin`, `Dihitung otomatis`. "kelas" is the B/K/T param class (`ParamDef.class`). The option values and filter behaviour are the same, and the other labels match the row badges (`CLASS_LABEL`). The control's accessible name is "Saring jenis pengaturan". |
| Checkboxes | `Hanya yang diubah di templat ini`, `Tampilkan nonaktif` | `Hanya yang diubah di templat ini`, `Tampilkan yang nonaktif` |
| Search placeholder | `Cari kunci, label, ID, atau aturan (mis. grid.textColumnMm, DT-10)` | `Cari nama pengaturan, kunci, atau aturan (mis. margin, DT-10)` |
| No results | `Tidak ada parameter yang cocok dengan saringan.` | An empty state with the title "Tidak ada pengaturan yang cocok", a hint, and a "Hapus pencarian" button. The button clears the text, class filter, toggles and section references (and `?paramFilter=`), then returns focus to the search box. |

### Layout decisions

- **Sticky toolbar.** Search, filter, the two toggles and "Buka semua / Tutup semua" sit in one compact bar that wraps (`surface-1` and a hairline border, the same tokens as the panel). From 640 px up it is `position: sticky` (`top-16` under the mobile top bar, `md:top-2` on desktop) inside the editor, so it stays visible while the list scrolls and leaves when the editor ends. Below 640 px it is not sticky, because a wrapped toolbar would cover about a quarter of a phone screen.
- **Quick navigation.** A row of category chips inside the toolbar shows the label, the count and an accent dot when the category has unsaved changes. Each chip's accessible name reads like "Warna, 27 pengaturan, 1 diubah". Clicking a chip opens the category, scrolls it into view (`scrollIntoView` with `behavior: "smooth"`, or `auto` under `prefers-reduced-motion`) and moves focus to its toggle. Sections have `scroll-margin-top`, so the sticky bar does not cover them. The chips wrap from 640 px up and become a single strip that scrolls sideways on its own below that, so the page never scrolls horizontally.
- **Calm defaults.** All categories start collapsed, except those with unsaved changes ("n diubah"), which open together with the sub-groups that hold the change. "Buka semua / Tutup semua" opens or closes categories only. Sub-group state is kept, so opening everything does not render all 788 rows. Open state lives in component state for the session, as before.
- **Less nesting.** `showSubgroups(g)` returns true only when a category has more than one sub-group and more than 8 settings. Otherwise the rows are shown directly. The rule runs on the grouped data that is displayed, so it also applies to search results. On the advanced surface, Lembar kendali (5), Penomoran & klasifikasi (8) and Pembuatan file & ekspor (1) are now flat. The large categories keep their sub-groups. The preview helper `groupParamsByCategory` exposes the same `flat` flag.
- **Category rows.** The whole row is one native button: a rotating chevron, the title and description on the left, and the count and badge on the right. It has `aria-expanded`, an `aria-controls` that points at the panel, a name from the title and counts, and a description from the description line.
- **Setting rows.** The reset action "Kembalikan ke nilai gaya" is now right-aligned on the "Nilai gaya" line, so it stays in the same place on every row. Technical keys stay in the existing "Info teknis" disclosure. While searching, the matching text in each setting's label is highlighted with a `<mark>` in an accent tint.
- **Accessibility.** Each category `<section>` is named through `aria-labelledby` (the title span inside the heading). Preset mode now passes `headingLevel={2}`, so its headings go h1 > h2 with no jump to h3; the advanced panel keeps h3 under the "Pengaturan" h2. The toggles are native `type="button"` elements and are enabled outside search. The summary line is `aria-live="polite"`, so result counts are announced. The global focus ring applies to every new control.

```
Before                                           After
[search............][Semua kelas (366) v]        +-- sticky (>= 640 px) ------------------------------------+
[x] Hanya yang diubah  [x] Tampilkan nonaktif    | [search.........] [Semua pengaturan v] [ ] diubah [x] nonaktif  [Buka semua] |
366 dari 366 parameter · induk: bawaan gaya      | (Warna 27 *) (Tipografi 69) (Halaman & grid 23) ...       |
                                                 +-----------------------------------------------------------+
[> Tipografi            69 pengaturan · 3 kelompok]  Menampilkan 366 pengaturan · nilai asal: gaya bawaan
   [> Rupa, bobot, dan aturan huruf (12)]         [> Tipografi                               69 pengaturan [2 diubah]]
   [> Skala huruf per unsur (54)]                 [  Font, ketebalan, dan ukuran teks untuk judul, isi, dan caption.  ]
   [> Format run ... (DOCX) (3)]                    [> Font dan ketebalan 12] [> Gaya teks per elemen 54] ...
[> Lembar kendali        5 pengaturan · 1 kelompok]  [v Lembar kendali                                  5 pengaturan]
   [> Lembar kendali (5)] -> rows                 [  Riwayat revisi, alur verifikasi, distribusi, dan tanda tangan. ]
                                                     rows (shown directly, no sub-group)
```

### Hardening and cleanup (review findings 5-8)

- #5a/b: the sections are named, and preset mode no longer jumps from h1 to h3. #5c (toggles `disabled` while searching) is unchanged on purpose, because search keeps every category open.
- #6: removed `paramCategory()` and its private `CATEGORY_BY_ID`. Grep showed no caller, and a test asserts the export is gone.
- #7: `categoryOf` now checks `hasOwnKey(GROUP_DEFAULT_CATEGORY, group)`. The twin in `namespaceLabel` (`param-labels.ts`) got the same own-property check. A test shows that `constructor`/`toString` groups or namespaces fall to Lainnya or show the raw key, and are never dropped.
- #8a-d: new tests cover a non-empty Lainnya render, "n diubah" for the equal-value case (not counted) and the removed-key case (counted), and `type="button"` with no `disabled` outside search. The tautological label assertion became "no live sub-group label equals its raw key".

### Files (this pass)

| File | Change |
|---|---|
| `src/components/studio/template-editor/param-categories.ts` | Labels, descriptions, sub-group labels; `SUBGROUP_FLAT_MAX_SETTINGS`, `showSubgroups`, `flat` on `ParamCategoryGroup`; own-property group default; `paramCategory` removed |
| `src/components/studio/template-editor/param-editor-state.ts` | add: pure layout helpers `defaultOpenIds`, `categoryChips`, `allCategoriesOpen`, `setAllCategoriesOpen`, `highlightParts`, `resultSummary` |
| `src/components/studio/template-editor/param-editor.tsx` | Sticky toolbar, chips, Buka/Tutup semua, category rows with description, flat categories, empty state, highlight, aligned reset, `headingLevel` prop, sub-group `changed` and category `flat` in the view model |
| `src/components/studio/template-editor/param-labels.ts` | Own-property check in `namespaceLabel` |
| `src/components/studio/template-editor/advanced-panel.tsx` | Preset mode passes `headingLevel={2}` (one line) |
| `src/components/studio/template-editor/template-editor.tsx` | `parentLabel` strings "gaya saat ini" / "gaya bawaan" (two strings) |
| `src/components/studio/template-preview/param-tools.ts` | `ParamCategorySection.flat` from the shared helper |
| `tests/unit/studio/ui-categories/ux-simplification.test.ts` | add (9 tests): labels, descriptions, jargon/repeat guard, prototype keys, `paramCategory` removed, flat rule, preview parity |
| `tests/unit/studio/ui-categories/param-editor-layout.test.ts` | add (14 tests): default open, chips, expand/collapse all, highlight, summary, toolbar, row header, a11y, flat render, n diubah cases, Lainnya, heading level, empty state |
| `tests/unit/studio/ui-categories/param-categories.test.ts`, `param-editor-categories.test.ts` | Updated label assertions; the tautological check replaced; the heading regex tolerates the heading class |

### Test results (this pass)

| Check | Command | Result |
|---|---|---|
| Red first | `npx vitest run tests/unit/studio/ui-categories/ux-simplification.test.ts` (before the code change) | 8 failed, 1 passed (the preview-parity test passed vacuously while `flat` did not exist yet) |
| Category tests | `npx vitest run tests/unit/studio/ui-categories` | `Tests 49 passed (49)` |
| Studio suite | `npx vitest run tests/unit/studio` | `Test Files 264 passed (264)`, `Tests 4787 passed (4787)` |
| Typecheck | `npx tsc --noEmit -p .` | exit 0, no output |
| Lint | `npx eslint` on the 7 changed src files plus `tests/unit/studio/ui-categories/` | exit 0, no output |
| DEV 9021 | `curl http://127.0.0.1:9021/studio/templates` | 307 to login (server up). The route compile and screenshots need the USER's logged-in browser pane, so they are for the controller. |

### Not verified here

- Visual check in a browser (sticky behaviour, the chip strip at about 400 px, dark/light). Per the brief, no browser was opened. The controller takes the screenshots.

### Fix: chip click opened the category but did not scroll (controller browser check, 2026-11-05)

- **Symptom (controller):** clicking the chip "Tabel 15" set the section to `aria-expanded="true"`, but the app shell's scroll container `<main class="relative flex-1 overflow-auto">` stayed at `scrollTop` 953, and `window.scrollY` stayed 0.
- **Ruled out, (b) id mismatch.** A new test checks that every chip's `aria-controls` equals a rendered `<section id>` (12 of 12, including `...-cat_tabel-section`). It passed against the old code too, so the ids were never the problem.
- **Root cause, (a) timing.** The scroll ran inside a `requestAnimationFrame` callback queued from the click handler. That timing is fragile: `requestAnimationFrame` does not fire while the page runs in the background, which the browser pane can be when it is not displayed. Focus was also moved after the smooth scroll had started. This is inferred, not observed directly.
- **Fix.** A chip click now sets only state: it opens the category and queues a scroll request (`requestScroll`: target plus a sequence number). A `useEffect` keyed on that request does the scroll after React commits the update, then marks the request handled (`pendingScrollTarget` with a handled-seq ref, so later renders do not scroll again, while a repeat click on the same chip still does). The effect:
  - sets the section's `scroll-margin-top` from the measured toolbar (`stickyScrollMarginPx`: toolbar height plus its sticky `top` plus 8 px while sticky; 8 px when not sticky, below 640 px);
  - focuses the category toggle with `preventScroll`;
  - then calls `scrollIntoView({ block: "start", behavior: scrollBehaviorFor(reducedMotion) })`, which also scrolls nested containers such as `<main>`.
- **Tests:** 3 new tests. Two cover the pure pending-target and margin/behaviour helpers; one checks the chip-to-section ids. Results: `npx vitest run tests/unit/studio/ui-categories` gives 52 passed. `npx vitest run tests/unit/studio` gives `Test Files 264 passed (264)`, `Tests 4790 passed (4790)`. `npx tsc --noEmit -p .` exits 0. eslint on the changed files exits 0. The repo has no DOM test environment and no new dependency is allowed, so the scroll itself must be confirmed in the browser pane.

## Revisi sesudah umpan balik USER (D-637, controller)

Baris chip kategori dan plumbing gulirnya dihapus karena menduplikasi akordeon ("filternya jadi bikin bingung karena dobel2 dengan accordeon drop down"). Toolbar kini satu baris: pencarian, "Hanya yang diubah", "Saringan lain" (berisi saringan kelas dan "Tampilkan yang nonaktif"; yang kedua hanya muncul bila daftar memuat pengaturan nonaktif, mis. mode preset), dan "Buka semua / Tutup semua". Akordeon menjadi satu-satunya navigasi; chevron berwarna aksen saat terbuka. Bagian chip dan gulir chip di atas sudah tidak berlaku. Diverifikasi controller di panel peramban DEV (login USER): tampilan bersih, 0 galat konsol.
