---
task_id: FIX-T2
task_slug: doc_artifact_studio
row: FIX-T2 (D-342 S2; uji ulang Hermes S2)
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/decisions/decisions.md (D-342)
status: complete
---

# Implementation Report: TOC turunan per section + lampiran (PAGEREF + jangkar HTML)

## Ringkasan

- Daftar isi turunan kini memuat entri **section (tingkat 2)** sesudah bab/lampirannya, selain bagian, bab, dan lampiran. Setiap entri punya penanda (`_StToc_nnn`) di paragraf judulnya dan medan `PAGEREF <penanda> \h` di kolom halaman, baik mode statis maupun mode medan. HTML memberi tautan jangkar setara (`#st-sec-<nomor>` ke id kepala section yang sudah ada di `text.ts`).
- **Kedalaman tidak di-hardcode.** Nilainya diambil dari parameter templat `toc.levels`, kunci yang dirujuk registri S03 (`registry/sections.ts:76`) dan katalog `research/01 §S03`. Bentuk yang diterima: bilangan (1 = bagian/bab/lampiran, 2 atau lebih = tambah section), atau larik nama tingkat (`part|bagian`, `chapter|bab`, `section|seksi|subbab`, `appendix|lampiran`). Bentuk lain tercatat di log `warn` dan memakai bawaan. Bila parameter absen, kedalaman = 2, setara rentang medan TOC mesin `TOC \o "1-2"` yang sudah ada sejak S18. Rentang `\o` kini mengikuti tingkat yang sama ("1-1" untuk kedalaman 1).
- **Satu sumber urutan.** `tocOutline()` di `toc-refs.ts` sekarang dipakai bersama oleh baris DOCX, indeks penanda, dan entri HTML. Sebelumnya urutan dihitung di tiga tempat.
- Skill DATUM HS (`datum-house-style`, dibaca saja) tidak mengatur kedalaman TOC. Grep `toc|daftar isi|outline|depth` atas SKILL.md, `datum_docx.py`, `scripts/datumbuku.py`, dan `tokens.json` tidak memberi hasil yang relevan. Karena itu bawaan diambil dari konvensi mesin (`\o "1-2"`), dan templat dapat mengubahnya lewat `toc.levels`.
- **Manual 000 tidak terdampak.** TOC-nya memakai entri eksplisit berhalaman literal, jadi tidak ada penanda yang ditulis. BM1 tetap 4544/4544 dan DOCX v2 resmi byte-identik dengan sha terakhir yang tercatat (`888f281f…`, FIX-HR3).

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca brief, umpan balik S2, catatan FIX-H4, skill HS (baca-saja) | complete | HS tanpa aturan kedalaman TOC; guide §3 baris 144-146 menyebut "bab, bagian, dan lampiran" |
| 2 | Render dokumen Hermes v3 sebelum perubahan (:9021) | complete | `before.docx`: PAGEREF 3 (Bab 3, Bab 4, Bab 9), 0 section; dokumen punya 12 kepala section (`outlineLvl 1` = 12), tanpa lampiran |
| 3 | `toc-refs.ts`: `tocLevels`, `tocOutline`, `sectionTocTarget`, `tocOutlineRange` | complete | cache per snapshot + objek params |
| 4 | `pages.ts`: baris turunan dari kerangka; baris section; rentang `\o`; warn `toc.levels` | complete | |
| 5 | `structure.ts` `renderSection`: penanda di kepala section | complete | cocok via blockId (v1 normalize dan v2 compose = blockId section dokumen), cadangan alamat `<kunci>.<j>` |
| 6 | HTML `wrapper.ts`: entri dari kerangka, jangkar `st-sec-*` | complete | |
| 7 | Uji unit baru + penyesuaian uji lama yang mengunci perilaku bab-saja | complete | lihat Test Results |
| 8 | Render ulang dokumen Hermes + PDF soffice + Manual 000 | complete | lihat Verifikasi |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/lib/studio/engine/docx/wrapper/toc-refs.ts | modify | `PARAM_TOC_LEVELS`, `tocLevels()`, `tocOutlineRange()`, `TocNode` + `tocOutline()` (urutan C14 + section), `sectionTocTarget()`; indeks penanda dibangun dari kerangka (penanda tetap hanya bila ada TOC turunan) |
| src/lib/studio/engine/docx/wrapper/pages.ts | modify | `deriveTocRows` dari `tocOutline`; tipe `TocRowLevel`/`DerivedTocEntry` (tingkat `section`); `deriveTocEntries` mengembalikan `DerivedTocEntry[]`; medan `TOC \o "<rentang>"`; warn `toc.levels` tidak dikenal |
| src/lib/studio/engine/docx/blocks/structure.ts | modify | `renderSection`: `bookmarkWrap(sectionTocTarget(...), nomor + judul)` |
| src/lib/studio/engine/html/blocks/wrapper.ts | modify | `chapterTitleEntries` dari `tocOutline` (impor dari `docx/wrapper/toc-refs`, pola sama dengan `semantic.ts`); `tocAnchorId` menerima `st-sec`; baris section `data-level="section"` |
| tests/unit/studio/renderers/fixt2-part-lede-k2.test.ts | add | D-350: 4 uji part.lede K2 (DOCX + HTML) |
| tests/unit/studio/renderers/fixt2-toc-sections.test.ts | add | 10 uji (tocLevels; DOCX statis/medan/kedalaman 1/larik nama/tidak dikenal/eksplisit; HTML); dump DOCX opsional `FIXT2_OUT` |
| tests/unit/studio/renderers/fixh4-rail-toc.test.ts | modify | describe TOC: `toc.levels: 1` dipatok agar ekspektasi bab-saja FIX-H4 tetap diuji; rentang medan "1-1" |
| tests/unit/studio/renderers/fix2-wrapper-text-parity.test.ts | modify | 3 ekspektasi label TOC (:250/:261/:303) memuat entri section; paritas DOCX = HTML tetap dikunci (perluasan area D-347) |
| docs/…/delegation_progress/file_claims.md | modify (append) | klaim FIX-T2 + dua perluasan uji |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Unit baru | `npx vitest run tests/unit/studio/renderers/fixt2-toc-sections.test.ts` | 10/10 lulus | |
| Unit studio | `npx vitest run tests/unit/studio` | Test Files 92 passed (92); Tests 2386 passed, 1 skipped, 0 gagal | sebelum penyesuaian: fixh4 3 gagal dan fix2-parity 3 gagal (label section baru); kegagalan ini menjadi bukti merah perilaku lama |
| Typecheck | `npx tsc --noEmit -p .` | exit 0, 0 baris | |
| Lint area | `npx eslint` atas 4 berkas src + 3 berkas uji | exit 0, 0 baris | |
| Manual 000 v2 resmi | `npx tsx benchmark/harness/run/run_benchmark.ts --schema v2 --official --out benchmark/out/fixt2/after` | BM1 PASS 100 % (4544/4544); DOCX sha `888f281fe3388a93…` = sha FIX-HR3 | vonis INCOMPLETE exit 1 karena pdf NOT_READY (render-env: fon sesi), BM2-BM4 NOT-RUN, sama dengan kondisi lingkungan FIX-H4/HR3 |
| Manual 000 v1 | `render_cli.ts --doc benchmark/manual000/doc.json --template benchmark/manual000/template.json --formats docx,html --out benchmark/out/fixt2/v1` | exit 0; DOCX: bookmarkStart 0, PAGEREF 0; HTML: 0 tautan TOC, data-level chapter 17 / part 5 / appendix 4 (tanpa section) | sha v1 (`38b489b9…`) berbeda dari angka FIX-H4 `53485ebc…` karena baris lain mengubah pohon sejak itu. Jalur TOC tidak tersentuh: entri eksplisit, nol penanda |

## Verification
- **Dokumen Hermes v3 `003/GSP/KT/X/2026`** (`cmvui0qun000qv11gtygb1mk9`, rev `cmvuifzek0097v11gujvrq7wq`), dirender via `POST /api/studio/documents/{id}/render` `{"scope":"document","formats":["docx","html"]}`: 200, job `cmvukmal700jzv11gviditvr6` SUCCEEDED; DOCX sha16 `c4a0ece23990a3d8`, HTML `3274f49bba9f4d68`.
  - DOCX: PAGEREF 15 = bookmark 15 (sebelumnya 3). Baris TOC: Bab 3, 3.1-3.4, Bab 4, 4.1-4.7, Bab 9, 9.1. Setiap baris memuat `_StToc_001`…`_015` berurutan, dan setiap penanda berada di paragraf judul yang sesuai (misalnya `_StToc_002` di "3.1   Reading the evidence labels").
  - PDF soffice 24.2.3.2 (`--convert-to pdf` polos atas DOCX unduhan): **15/15 entri, nomor halaman tercetak = halaman tempat judul berada** (Bab 3 hlm 4; 3.3 hlm 5; 3.4 hlm 6; Bab 4 hlm 8; 4.3 hlm 9; 4.5-4.7 hlm 10; Bab 9 dan 9.1 hlm 11). Skrip pemeriksa: pymupdf `scripts/pdfcheck.py` di folder sementara sesi.
  - HTML: 15 tautan `st-toc-link` (`#st-ch-3`, `#st-sec-3-1` … `#st-sec-9-1`), setiap id target ada tepat sekali, `data-level="section"` = 12.
  - Lampiran: dokumen Hermes tidak punya lampiran. Lampiran dibuktikan dengan fixture uji (E1 + bagian + lampiran A), DOCX dibuang lewat `FIXT2_OUT` lalu dikonversi soffice. TOC hlm 3: Bab 1 → 4, 1.1 → 4, BAGIAN I → 5, Bab 2 → 6, 2.1 → 6, Lampiran A → 8, A.1 → 8. Halaman judul pada PDF: Tujuan 4, Bagian Satu 5, Temuan Utama 6, Data Mentah 8, Log Suhu 8. Semua cocok.
- Kedalaman: `toc.levels = 1` menghasilkan 4 entri tanpa penanda di kepala section dan medan `\o "1-1"`; `["bab","seksi"]` menghapus bagian dan lampiran; nilai tidak dikenal memicu log warn dan kedalaman 2 (uji fixt2).

## Dampak benchmark Manual 000
Tidak ada. TOC Manual 000 (v1 dan v2) memakai entri eksplisit berhalaman literal (T010), sehingga `hasDerivedToc` = false: nol penanda, nol PAGEREF, dan tidak ada baris section. BM1 4544/4544 tetap. DOCX v2 resmi byte-identik dengan sha terakhir tercatat. BM3 tidak dapat diukur di sesi ini (pdf NOT_READY), tetapi karena DOCX byte-identik, BM2-BM4 tidak mungkin turun akibat baris ini.

## Perluasan D-350: `part.lede` pada moda rel K2 (temuan FIX-R1)

- **Cacat:** lede pembatas bagian adalah prosa tanpa chip. Meski begitu, di DOCX ia membawa `w:ind w:right="2154"`, dan di HTML ia membawa `margin-right:107.7pt` dari peran `part.lede` (profil benchmark K-22, `wrapper/formats.ts:212`) ketika perender rel `framePr` aktif. Ini melanggar K2 rev B (prosa tanpa chip harus selebar teks penuh). G-RAIL-3 FIX-R1 melewati unit bagian, sehingga cacat ini tidak tertangkap.
- **Perbaikan DOCX** (`pages.ts` `partLedeXml`): bila indentasi kanan peran sama dengan cadangan rel `railK2ReserveOf` (moda A + `framePr`; impor baca-saja dari `blocks/rail.ts` milik FIX-R1), indentasi itu dibuang. Format peran lainnya (spasi, run miring) tetap. Indentasi peran templat yang bukan cadangan rel dihormati. Untuk `table3col` dan moda B keluarannya sama dengan `roleParagraphXml`.
- **Perbaikan HTML** (`html/blocks/wrapper.ts` `partLedeK2Format`): padanan `k2Format` text.ts FIX-R1, yaitu `margin-right` cadangan dibuang pada K2.
- **Uji:** `tests/unit/studio/renderers/fixt2-part-lede-k2.test.ts`, 4/4 lulus. Isinya: table3col tetap `w:right="2154"`; framePr tanpa `w:right` dengan spasi/miring tetap; indentasi templat 1134 dihormati; HTML framePr tanpa `margin-right` sementara table3col tetap `107.7pt`. Sebelum perbaikan, diagnosis HTML mencetak `margin-right:107.7pt` pada framePr. Sisi DOCX memakai `roleParagraphXml`, yang mempertahankan 2154 apa pun perendernya (dibuktikan oleh kasus table3col yang memakai jalur peran yang sama).
- **Manual 000 (table3col) tidak berubah:** run resmi v2 `benchmark/out/fixt2/after2` memberi BM1 4544/4544 dan DOCX sha `888f281f…` (sama dengan run sebelum perluasan dan FIX-HR3). v1 `render_cli` DOCX `38b489b97677a98d` dan HTML `e05a18f24291311e` sama persis dengan run sebelum perluasan (`benchmark/out/fixt2/v1`).
- Dokumen Hermes v3 tidak punya bagian, jadi tidak terdampak.
- Klaim perluasan dicatat di `file_claims.md` (pages.ts `part.lede`, html wrapper `part.lede`, berkas uji baru).
- Bukti akhir: `npx vitest run tests/unit/studio` = Test Files 93 passed (93), Tests 2390 passed, 1 skipped, 0 gagal; `npx tsc --noEmit -p .` exit 0; eslint atas 4 berkas src + 4 berkas uji exit 0.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| `toc.levels` belum terdaftar di katalog parameter (`src/lib/studio/params/**`), sehingga templat belum bisa menyetelnya lewat editor/validasi | 0 (di luar area) | Kunci hanya dirujuk registri S03 (temuan lama `research/08` F3) | Mesin sudah membaca kunci ini; bawaan kedalaman 2. Perlu pemilik params untuk mendaftarkan (bilangan atau larik nama, bawaan null = 2) | Tidak |
| Baris section memakai peran `toc.chapter*`, karena templat belum punya peran `toc.section*` | 0 (di luar area: `wrapper/formats.ts`, `contract/enums.ts`, `tokens/roles.ts`) | Peran TOC hanya ada untuk bagian dan bab | Hierarki terbaca dari label ("Bab 3" lawan "3.1"). Peran khusus section = usulan lanjutan | Tidak |
| STUDIO-AGENT-GUIDE §3 (baris 144-146) masih menyebut "bab, bagian, dan lampiran" | 0 (di luar area) | Dokumen milik baris DOC | Perlu ditambah: section tingkat 2 dan kenop `toc.levels` | Tidak |
| Fixture parity v1 dengan TOC turunan (`doc_terbit_report`, `doc_serah_handover`) berubah DOCX/HTML (baris section + penanda) | 0 | Perilaku baru yang memang diminta | Tercatat. Suite parity tidak dijalankan ulang di baris ini | Tidak |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 3 | Kunci parameter kedalaman | Dipilih `toc.levels` (sudah dirujuk registri S03 dan katalog), bukan kunci baru `render.toc.*` |
| 3 | Bawaan saat parameter absen | Kedalaman 2 = rentang medan TOC mesin `\o "1-2"` (bukan angka baru). Katalog manual mendaftar "bagian, bab, lampiran"; templat yang menginginkan itu menyetel `toc.levels: 1` atau larik nama |
| 3 | Bab selalu dimuat | Tingkat minimum daftar isi; larik tanpa "bab" tetap memuat bab |
| 5 | Pencocokan section | blockId (sama di normalize v1 dan compose v2), cadangan alamat `<kunci>.<j>` per jenis unit (bab/lampiran) |
| 7 | Uji lama FIX-H4 dan FIX-2 | FIX-H4: kedalaman 1 dipatok (ekspektasi bab-saja tetap diuji). FIX-2: ekspektasi label diperluas dengan section, paritas DOCX = HTML tidak dilonggarkan (D-347) |
| - | Penulisan atomik | Semua sunting src/uji/klaim lewat berkas sementara lalu rename (skrip patch dengan cek satu-kecocokan) |

## Next Steps
- Pemilik params: daftarkan `toc.levels` (bilangan >= 1 atau larik nama tingkat; null = kedalaman 2).
- Baris DOC: perbarui guide §3 (section tingkat 2 ber-PAGEREF + kenop `toc.levels`).
- Opsional: peran `toc.sectionLabel/Title/Page` milik templat untuk membedakan gaya baris section.
- Review direkomendasikan: `senior-code-reviewer` atas `toc-refs.ts`, `pages.ts` (renderToc), `structure.ts` (renderSection), dan `html/blocks/wrapper.ts` (TOC).
