---
task_id: FIX-TL
task_slug: doc_artifact_studio
row: FIX-TL (D-351, D-352)
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/decisions/decisions.md (D-351, D-352)
status: complete
---

# Implementation Report: `toc.levels` di katalog parameter + peran `toc.section*` / `toc.appendix*`

## Ringkasan

- `toc.levels` terdaftar sebagai **R-66** (`params/render.ts`): int 1-3, bawaan 2, kelas B, cakupan `section:toc`, lapis **lanjutan (ADMIN)**.
  - Alasannya mengikuti pola kenop daftar isi RQ-8. `render.toc.title` (R-59) dan `render.toc.note` (R-60) juga lanjutan dengan cakupan `section:toc` (`registry/essentials.ts`, `registry/slots.ts` prefiks `render.toc.`).
  - Kedalaman daftar isi adalah keputusan gaya rumah milik templat. Ia bukan kenop awam. Kenop esensial toc tetap 2 (EK-toc-01 mode nomor halaman, EK-toc-02 pita segel), jadi pin kenop 30 tidak berubah.
- Pin parameter: renderer 44 → 45, total 787 → 788 (`params/index.ts`).
- Tingkat 3 dicadangkan. Kontrak belum punya unit struktur di bawah section: `Section` tanpa subsection, dan `body.subheading` tanpa `outlineLvl`. Karena itu entri turunan tingkat 3 sama dengan tingkat 2, dan hanya kerangka medan Word yang menjadi `\o "1-3"`. Bilangan > 3 dipangkas ke 3 (batas R-66).
- Peran entri baru: `toc.sectionLabel/Title/Page` dan `toc.appendixLabel/Title/Page`, ditambahkan ke `ROLE_KEYS` sebagai U71-U76 (70 → 76). Kunci itu perlu ada di sana agar templat dapat menyetel peran ini, karena validasi `profile.ts:358` dan skema templat v2 `propertyNames` membaca `ROLE_KEYS`.
  - **Section**: gaya bawaannya diturunkan dari format EFEKTIF peran bab (benchmark ← katalog ← `roleFormats` bab templat). Turunannya: indentasi tingkat 2 = 2 em token `type.scale.tableBody.size` (8,2 pt → 328 twip, Hermes datum-gsp 8 pt → 320) pada label dan judul (halaman tidak), dan run 1 pt lebih kecil. Sub-objek yang disetel templat untuk peran section menang utuh.
  - **Lampiran**: `toc.appendix*` dipakai per sel HANYA bila templat menyetelnya. Selain itu dipakai peran bab, sehingga keluaran lama tetap sama, termasuk 4 entri lampiran eksplisit Manual 000 (data-role HTML tidak berubah).
- Satu sumber DOCX + HTML: `tocEntryRoles`, `TOC_ROLE_PARENT`, `tocSectionIndentTw`, dan `tocSectionSize` di `toc-refs.ts` (HTML sudah mengimpor modul ini sejak FIX-T2).
  - DOCX mode medan: tab judul baris section ikut bergeser sebesar indentasi, sehingga judul section juga menjorok.
  - HTML: indentasi ditulis di `<span style="display:block;padding-left:…">` di dalam sel, karena `margin-left` tidak berlaku pada `td`. Bila peran bab tanpa ukuran eksplisit (kanonik), ukuran section relatif `calc(1em - 1pt)`.

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca brief akhir, catatan FIX-T2, D-139, D-168..D-172, D-224 (RQ-8), D-268/D-287, D-351/D-352 | complete | pola ParamDef + pin dari D-268/D-287 |
| 2 | Baseline `npx vitest run tests/unit/studio` | complete | 93 berkas, 2390 lulus / 1 dilewati |
| 3 | R-66 + cakupan + lapis + pin | complete | |
| 4 | `toc-refs.ts`: `depth`, rentang `1-<depth>`, peran per tingkat, turunan section | complete | |
| 5 | `formats.ts` (DOCX) peran turunan; `pages.ts` peran + geser tab; HTML `renderToc` | complete | |
| 6 | `ROLE_KEYS` +6 | complete | perluasan area, diklaim |
| 7 | Uji baru + penyelarasan 2 pin uji | complete | |
| 8 | Benchmark Manual 000 v2/v1, convert_v2 --check, render Hermes :9021 | complete | |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/lib/studio/params/render.ts | modify | R-66 `toc.levels`; `PARAMS_RENDER_COUNT` 45 |
| src/lib/studio/params/index.ts | modify | `RENDER_PARAM_COUNT` 45, komentar total 788 |
| src/lib/studio/registry/slots.ts | modify | exact `toc.levels` → `section:toc` |
| src/lib/studio/registry/essentials.ts | modify | R-66 lapis advanced |
| src/lib/studio/engine/docx/wrapper/toc-refs.ts | modify | `TocLevels.depth`, `TOC_LEVELS_MAX`, `tocOutlineRange` 1-1/1-2/1-3, `TocEntryLevel`, `tocEntryRoles`, `TOC_ROLE_PARENT`, `isTocSectionRole`, `tocSectionIndentTw`, `tocSectionSize`, `TOC_SECTION_SIZE_STEP_HALFPT` |
| src/lib/studio/engine/docx/wrapper/formats.ts | modify | `WrapperRole` +6; `benchmarkRole` kasus turunan; `tocDerivedFormat`; `roleFormat` mewarisi format efektif peran bab lalu menimpakan sub-objek templat peran itu |
| src/lib/studio/engine/docx/wrapper/pages.ts | modify | `entryRoles` → `tocEntryRoles`; mode medan: tab label/judul section digeser sebesar indentasi |
| src/lib/studio/engine/html/blocks/wrapper.ts | modify | `tocCellHtml` (pewarisan bab + turunan section); `renderToc` memakai `tocEntryRoles` |
| src/lib/studio/contract/enums.ts | modify (perluasan) | `ROLE_KEYS` +6 (U71-U76), komentar E23 76 |
| tests/unit/studio/renderers/fixtl-toc-levels-roles.test.ts | add | 15 uji |
| tests/unit/studio/renderers/fixt2-toc-sections.test.ts | modify (pin) | `toEqual` TocLevels + `depth` (D-351/D-352) |
| tests/unit/studio/renderers/fix2-wrapper-text-parity.test.ts | modify (pin) | regex label HTML menerima `toc.(section\|appendix)Label`; ekspektasi label dan paritas DOCX = HTML tidak berubah |
| docs/…/delegation_progress/file_claims.md | modify (append) | klaim FIX-TL |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Unit baru | `npx vitest run tests/unit/studio/renderers/fixtl-toc-levels-roles.test.ts` | 15/15 lulus | |
| Merah sebelum penyelarasan | `npx vitest run tests/unit/studio/renderers` | 7 gagal: fix2-parity 6 (label HTML section tidak tertangkap regex lama `toc.(chapter\|part)Label`), fixt2 1 (`TocLevels` tanpa `depth`) | bukti bahwa perilaku peran section memang berubah |
| Unit studio | `npx vitest run tests/unit/studio` | Test Files 94 passed (94); Tests 2405 passed, 1 skipped, 0 gagal | baseline 93/2390; +1 berkas, +15 uji |
| Typecheck | `npx tsc --noEmit -p .` | exit 0 | |
| Lint area | `npx eslint src/lib/studio/params src/lib/studio/registry <toc-refs,formats,pages>.ts html/blocks/wrapper.ts contract/enums.ts` + 3 berkas uji | exit 0, 0 temuan | |
| Manual 000 v2 resmi | `npx tsx benchmark/harness/run/run_benchmark.ts --schema v2 --official --out benchmark/out/fixtl/after` | BM1 PASS 100 % (4544/4544); DOCX sha `888f281fe3388a93…` = FIX-T2/FIX-HR3 | vonis INCOMPLETE exit 1 karena pdf NOT_READY (render-env: fon sesi), BM2-BM4 NOT-RUN, kondisi lingkungan sama dengan FIX-T2 |
| Manual 000 v1 | `npx tsx scripts/parity/run/render_cli.ts --doc benchmark/manual000/doc.json --template benchmark/manual000/template.json --formats docx,html --out benchmark/out/fixtl/v1` | exit 0; DOCX `38b489b97677a98d`, HTML `e05a18f24291311e` = FIX-T2 `benchmark/out/fixt2/v1` | lint=FAIL pra-ada (sama dengan FIX-T2) |
| convert_v2 | `npx tsx benchmark/extract/convert_v2.ts --check` | SAME ×3: doc.v2 `79290e07…`, template.v2 `882057c5…`, preset `a951b149…` | preset Manual 000 TIDAK perlu diperbarui |

## Verification
- **(1) `toc.levels` 1/2/3** (fixtl): ParamDef R-66 sama dengan register (int, 2, 1-3, B, `section:toc`, advanced). Total 788 = `ALL_PARAMS.length`. Kanonik tanpa setelan terselesaikan ke 2. DOCX + HTML: tingkat 1 memberi 4 PAGEREF, `\o "1-1"`, 0 baris section. Tingkat 2 memberi 7 PAGEREF, `\o "1-2"`, 3 baris section, dan **absen = 2 byte-identik (XML dan HTML)**. Tingkat 3 memberi PAGEREF sama dengan 2, dan XML = XML tingkat 2 kecuali `"1-3"`.
- **(2) Peran section dipakai** (fixtl): kanonik dan profil Manual 000 statis. Selisih indentasi section − bab = [328, 328, 0] (label, judul, halaman); ukuran setiap sel = ukuran bab − 2 setengah-poin. Lampiran tanpa peran templat memberi sel berformat identik dengan bab. Mode medan: `w:ind left` 328 dan tab judul bergeser 328. Templat yang menyetel `toc.sectionTitle.run` / `toc.appendixTitle.run` membuat sub-objek templat menang (sz 30 / 26, warna) sementara indentasi turunan tetap. HTML: `data-role` toc.section* 3×3 dengan `padding-left:16.4pt` pada label/judul; kanonik `calc(1em - 1pt)`; Manual 000 memberi ukuran bab − 1 pt; lampiran = `toc.chapterLabel` kecuali disetel.
- **Dokumen Hermes `003/GSP/KT/X/2026`** (`cmvui0qun000qv11gtygb1mk9`, rev `cmvuifzek0097v11gujvrq7wq`): `POST /api/studio/documents/{id}/render` `{"scope":"document","formats":["docx","html"]}` (header `x-internal-secret` dari berkas rahasia uji lewat variabel shell, tidak dicetak) → 200, job `cmvulm92d00kbv11gr3pq9xg3` SUCCEEDED.
  - DOCX sha16 `b00a23e59d05819e` (2 303 648 B): PAGEREF tetap 15; 12 baris section `ind=320` dengan sz label 12 / judul 14 / halaman 12; 3 baris bab tanpa ind dengan sz 14 / 16 / 14.
  - HTML sha16 `45790a1e467898db`: data-role `toc.section*` 12×3, `toc.chapter*` 3×3. Judul section 7pt `padding-left:16pt`, judul bab 8pt. Paritas dengan DOCX: 320 twip = 16 pt, dan 1 pt lebih kecil.
  - Pemeriksa: `C:/Users/TRIAL/AppData/Local/Temp/fixtl_hermes/check.py`, `checkh.py`.
- **(3) Templat tanpa setelan berperilaku seperti sekarang**: absen = 2 byte-identik (lihat atas). Manual 000 tidak berubah: v2 `888f281f…`, v1 DOCX + HTML sama dengan FIX-T2, convert_v2 SAME ×3.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| - | - | - | tidak ada | tidak |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 3 | Kelas `toc.levels`: esensial slot toc atau lanjutan ADMIN? | Lanjutan, pola R-59/R-60 (kenop daftar isi RQ-8). Kenop esensial dan pin 30 tetap. Butuh keputusan controller bila ingin kenop awam |
| 3 | Kunci `toc.levels`, bukan `render.toc.levels` | Kunci dipertahankan (rujukan registri S03 `paramRefs` dan mesin FIX-T2). Cakupan diberi lewat entri exact di `slots.ts` |
| 4 | Tingkat 3 tanpa unit struktur | Dicadangkan: entri sama dengan 2, medan `\o "1-3"`. Tidak ada judul tingkat 3 yang dikarang |
| 4 | Larik nama tingkat (FIX-T2) di luar tipe int R-66 | Mesin tetap toleran (uji fixt2 menguncinya). Templat tervalidasi hanya menerima int 1-3 |
| 6 | **Perluasan area**: `contract/enums.ts` `ROLE_KEYS` +6 | Diperlukan agar templat dapat menyetel peran baru (validasi profil + skema v2). Sifatnya aditif, sama dengan preseden FIX-HR2. Komentar "70 peran" di `src/app/api/studio/registry/route.ts:13` dan `src/components/studio/template-editor/role-formats-editor.tsx:4` tidak diubah (di luar area) → DOC-4 / pemilik |
| 5 | Lampiran memakai peran bab bila `toc.appendix*` tidak disetel | Menjaga data-role HTML dan byte Manual 000. Begitu templat menyetelnya, peran lampiran aktif per sel |
| 5 | HTML `margin-left` pada `td` tidak berlaku | Indentasi ditulis di span pembungkus. Catatan: peran bab templat yang memakai `indLeftTw` juga tidak berlaku di HTML (perilaku pra-ada, tidak diubah) |

## Next Steps
- DOC-4: panduan §3 dan register 03 (R-66, U71-U76, peran toc.section*), serta komentar jumlah peran di route registry dan editor peran.
- Review kode TL (senior-code-reviewer) dianjurkan dengan cakupan: berkas di Changes Made.
