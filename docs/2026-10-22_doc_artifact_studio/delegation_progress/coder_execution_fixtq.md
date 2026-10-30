---
task_id: FIX-TQ
task_slug: doc_artifact_studio
row: FIX-TQ (D-359; review SR-56e E2 + E5 + E6 + E7 + E9)
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/decisions/decisions.md (D-359)
status: complete
---

# Implementation Report: penanda TOC satu sumber + G-RAIL-3 revisi lama + toc.levels satu bentuk + pesan CLI Indonesia

Skill: diagnosing-bugs, tdd (uji merah dulu untuk E2 dan G-RAIL-3), dry-run-verify-fix. Rahasia uji dibaca dari berkas lewat env oleh skrip, tidak pernah dicetak. Skrip dan keluaran uji ada di luar repo (`C:/Users/TRIAL/AppData/Local/Temp/fixtq/`). Semua penulisan berkas repo memakai tmp + rename (`os.replace`/`mv`; `sed -i` GNU = tmp + rename).

## Ringkasan

- **E2 (Medium) ditutup.** Nama penanda `_StToc_nnn` dan tingkat yang dimuat kini punya SATU sumber: `tocParams(ctx)` di `toc-refs.ts`, yaitu nilai efektif slot blok TOC di `ctx.slots` (slot dicari dari `slotKey` blok TOC turunan, cadangan `slotKey` unitnya), dengan cadangan params templat konteks (v1/tanpa slot = satu peta untuk semua unit). Kepala bab/section/bagian/lampiran (params slot isi) dan baris TOC memakai indeks yang sama. Fungsi baru yang diekspor: `tocLevelsOf(ctx)`. `pages.ts` memakainya untuk rentang medan `\o` dan peringatan `toc.levels`. `structure.ts` tidak perlu diubah (memanggil `sectionTocTarget`/`chapterTocTarget*` yang kini berbasis indeks satu sumber).
  - Penomoran berurut dipertahankan (bukan nama struktural). Alasannya: keluaran semua kasus yang sudah ada tetap byte-identik (Manual 000 `888f281f…`, dokumen Hermes 002/003 sha DOCX sama dengan sebelum baris ini), dan uji FIX-T2 `toc.levels=1 -> _StToc_001..004` tetap berlaku. Kerapuhan yang disorot review (params per unit) hilang karena urutan tidak lagi bergantung params unit.
- **E7 (Low) ditutup.** Cache per snapshot sekarang memuat fakta yang tidak bergantung params (`derived`, `tocSlotKey`) dan indeks per `levels.section`, satu-satunya tingkat yang mengubah urutan. `hasDerivedToc` tidak lagi dipindai ulang pada setiap kepala bab/section (dulu O(blok) per panggilan `index()`). Unit yang berselang-seling dengan params slot berbeda tidak lagi membangun ulang indeks.
- **E6 (Low) ditutup.** Cabang larik nama tingkat (`bagian|seksi|subbab|…`) dihapus, sehingga hanya ada satu bentuk R-66 (int 1-3). Bentuk lain = bawaan 2 + `invalid`, dan pemanggil mencatat warn. `TocLevels` disederhanakan menjadi `{ section, depth }` karena bagian dan lampiran selalu dimuat. `tocOutlineRange` = `1-<depth>`. Pesan warn: "parameter toc.levels tidak dikenal (bilangan bulat 1-3); kedalaman bawaan 2 dipakai".
- **E5 (G-RAIL-3 revisi lama).**
  - Diagnosis: gerbang hanya dapat dipicu DATA lewat `format` eksplisit di konten blok dengan `indRightTw` sama dengan cadangan rel (jalur peran ditutup FIX-R1 by construction).
  - Pindai baca-saja DB `gsp_agent_hq_v21`: dari 38 revisi, hanya 1 yang membawa indentasi kanan eksplisit, yaitu Manual 000 `000/GSP/STD/X/2026` rev 1 (`studio.norm/v1`, nilai 1701/1134, bukan 2154). Revisi itu terikat templat `table3col`, sehingga gerbang tidak berjalan. Semua 20 revisi pada `datum-gsp` v3 (`framePr`) tanpa format eksplisit. Artinya data lama yang ada TIDAK memicu gerbang.
  - Tindakan pencegahan (keputusan, lihat tabel): pelanggaran pada snapshot `studio.norm/v1` (kontrak yang mengizinkan `format` eksplisit) kini DILAPORKAN, bukan gagal keras. Bentuknya log warn `RAIL_K2_LEGACY_V1` per unit dengan pesan G-RAIL-3 dan maksimal 5 contoh teks, ditambah satu warn ringkasan. Render tetap dilanjutkan, dan format penulis dihormati (D-06: revisi lama tetap dapat dirender ulang). Snapshot v2 konten-saja (D-139) tetap gagal keras `BY_CONSTRUCTION_FAILED`, karena di sana pelanggaran hanya mungkin terjadi akibat cacat mesin.
- **E9 (Low) ditutup.** Semua pesan galat pemakaian, catatan bab pertama, dan baris pemakaian (`pemakaian:`) di `md2chapter.ts` kini berbahasa Indonesia. Nama opsi, kode galat server (`META_REQUIRED_FOR_CREATE`, `DOC_TARGET_AMBIGUOUS`), kode keluar, dan stdout tidak berubah. Baris ringkasan `md2chapter <importer>: valid=… issues=…` (pasangan kunci=nilai mesin) dan pesan galat importer `${code}: ${message}` dari layanan tidak diubah.

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca brief akhir, review 09e (E2, E5-E7, E9), catatan FIX-T2/TL/R1/CLI, D-359 | complete | |
| 2 | Klaim berkas (`file_claims.md`, tmp + rename) + perluasan uji fixcli | complete | 2 baris FIX-TQ |
| 3 | E2 uji merah: `fixtq-toc-bookmarks.test.ts` pada kode lama | complete | 3 dari 5 gagal (lihat Test Results) |
| 4 | `toc-refs.ts`: `tocParams`/`tocLevelsOf`, indeks satu sumber, cache per snapshot, buang cabang larik | complete | |
| 5 | `pages.ts`: rentang medan + warn lewat `tocLevelsOf(b.ctx)` | complete | |
| 6 | `fixt2-toc-sections.test.ts`: 2 uji cabang larik diselaraskan (E6) | complete | uji lain fixt2 tidak diubah |
| 7 | G-RAIL-3: pindai DB baca-saja + render ulang R07 revisi lama (sebelum dan sesudah suntingan) | complete | |
| 8 | `assemble/index.ts`: v1 = laporan, v2 = gagal keras; uji `fixtq-rail-legacy.test.ts` merah lalu hijau | complete | |
| 9 | `md2chapter.ts` pesan Indonesia; uji baru + ekspektasi teks fixcli | complete | |
| 10 | Gerbang: vitest studio, tsc, eslint area (sesudah suntingan terakhir), Manual 000 v2, render ulang final | complete | |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| src/lib/studio/engine/docx/wrapper/toc-refs.ts | modify | `TocLevels` = `{section, depth}`; `tocLevels` hanya int (cabang larik + `LEVEL_ALIASES` dihapus); `tocOutlineRange` = `1-<depth>`; `isDerivedTocContent`; `SnapshotTocInfo` + `infoOf` (cache per snapshot); `tocSlotKeyOf`; `tocParams`; `tocLevelsOf` (ekspor baru); `buildIndex(snapshot, levels)`; `fullIndex(ctx)`/`index(ctx)`/`tocOutline(ctx)` dari satu sumber; komentar kepala FIX-TQ |
| src/lib/studio/engine/docx/wrapper/pages.ts | modify | Impor `tocLevelsOf` (ganti `tocLevels`); `fieldTocXml` rentang `\o` dan `renderToc` warn memakai `tocLevelsOf(b.ctx)`; teks warn "bilangan bulat 1-3" |
| src/lib/studio/engine/docx/assemble/index.ts | modify | Hanya blok G-RAIL-3: try/catch `assertRailK2`; snapshot v1 + `BY_CONSTRUCTION_FAILED` -> warn `RAIL_K2_LEGACY_V1` per unit (+contoh) + warn ringkasan; v2/galat lain dilempar ulang |
| scripts/studio/md2chapter.ts | modify | 14 pesan `fail()`/catatan/pemakaian ke bahasa Indonesia |
| tests/unit/studio/renderers/fixtq-toc-bookmarks.test.ts | add | 5 uji E2 (statis, medan, kebalikan, HTML, sanity slotKey) |
| tests/unit/studio/renderers/fixtq-rail-legacy.test.ts | add | 4 uji G-RAIL-3 revisi lama (v1 bersih, v1 = cadangan dilaporkan, v1 1701 tanpa laporan, v2 tetap gagal keras) |
| tests/unit/studio/import/fixtq-md2chapter-messages.test.ts | add | 14 uji (13 jalur galat exit 2 + catatan) |
| tests/unit/studio/renderers/fixt2-toc-sections.test.ts | modify (perluasan klaim) | Uji `tocLevels` (bentuk `{section, depth}`; larik = invalid) dan uji `["bab","seksi"]` -> warn + kedalaman 2 |
| tests/unit/studio/import/fixcli-md2chapter.test.ts | modify (perluasan klaim) | Hanya ekspektasi teks pesan (9 tempat): `catatan:`, `--template dan --doc-title`, `tambahkan juga --doc-title (tanpa itu`, `--template harus berbentuk`, `--doc-title tidak boleh kosong`, `memerlukan opsi dokumen tujuan` |
| docs/…/delegation_progress/file_claims.md | modify (append) | Klaim FIX-TQ + perluasan E9 |

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| E2 merah (kode lama) | `npx vitest run tests/unit/studio/renderers/fixtq-toc-bookmarks.test.ts` sebelum suntingan `toc-refs.ts` | **3 failed / 2 passed** | statis: penanda `_001…_007` vs PAGEREF `_001…_004`; medan: sama; kebalikan (slot TOC 2, slot isi 1): penanda 4 vs PAGEREF 7 (PAGEREF menggantung). HTML dan sanity sudah lulus (HTML memakai params slot TOC) |
| E2 hijau | sama, sesudah suntingan, bersama fixt2/fixtl/fixh4/fix2-parity | 5 files, **51/51 lulus** | |
| G-RAIL-3 merah | `fixtq-rail-legacy.test.ts` dengan blok G-RAIL-3 `assemble/index.ts` dikembalikan sementara ke sebelum suntingan (skrip balik, lalu dipulihkan dari salinan) | **1 failed / 3 passed**: v1 berformat = cadangan melempar `BY_CONSTRUCTION_FAILED` dari `rail.ts:231` | dipulihkan; `grep -c RAIL_K2_LEGACY_V1` = 2 |
| G-RAIL-3 hijau | `npx vitest run tests/unit/studio/renderers/fixtq-rail-legacy.test.ts tests/unit/studio/renderers/fixr1-rail-k2.test.ts` | 2 files, **15/15 lulus** | uji FIX-R1 "gagal keras atas format eksplisit" (v2) tetap lulus |
| CLI | `npx vitest run tests/unit/studio/import/fixtq-md2chapter-messages.test.ts tests/unit/studio/import/fixcli-md2chapter.test.ts` | 2 files, **29/29 lulus** | |
| Unit studio | `npx vitest run tests/unit/studio` | exit 0; **Test Files 97 passed (97); Tests 2428 passed, 1 skipped (2429)** | baseline FIX-TL 94/2405; +3 berkas baru (23 uji) |
| Typecheck | `npx tsc --noEmit -p .` | **exit 0, 0 baris** | sesudah suntingan src terakhir |
| Lint area | `npx eslint toc-refs.ts pages.ts structure.ts assemble/index.ts scripts/studio/md2chapter.ts` + 5 berkas uji | **exit 0, 0 temuan** | dijalankan sesudah suntingan terakhir (tidak ada suntingan kode sesudahnya) |
| Manual 000 v2 resmi | `npx tsx benchmark/harness/run/run_benchmark.ts --schema v2 --official --out benchmark/out/fixtq/after` | BM1 PASS 4544/4544; DOCX sha256 **`888f281fe3388a933e1a83d31cb98a90043d5ea9214e165c038bed9bf9f510db`** = FIX-T2/TL/HR3 | vonis INCOMPLETE exit 1 karena pdf NOT_READY (render-env: fon sesi), BM2-BM4 NOT-RUN, kondisi lingkungan sama dengan FIX-T2/TL |

## Verification

- **E2 (`toc.levels` di slot TOC berbeda dari slot isi):** uji `fixtq-toc-bookmarks` memeriksa bahwa setiap PAGEREF (urutan baris TOC) menunjuk penanda yang ada tepat sekali di paragraf judul yang benar, tanpa penanda yatim, dengan id unik dan berpasangan. Kasus statis/medan dengan slot TOC 1 dan slot isi/lampiran 2 menghasilkan 4 entri, kepala section tanpa penanda, dan `\o "1-1"`. Kasus kebalikan (slot TOC 2, slot isi 1) menghasilkan 7 entri, dan section tetap ber-penanda.
- **Render ulang revisi lama via R07** (`POST /api/studio/documents/{id}/revisions {revisionNo, formats:["docx","html"]}`, :9021, DB `gsp_agent_hq_v21`, skrip `C:/Users/TRIAL/AppData/Local/Temp/fixtq/rerender.mjs`). Semua revisi ini dibuat sebelum FIX-R1. Final dijalankan sesudah semua suntingan:

| Dok | Rev | Templat | HTTP | Job | DOCX sha16 | Log G-RAIL-3 (`StudioRenderJob.engine.log`) |
|---|---|---|---|---|---|---|
| 002/GSP/KT/X/2026 | 12 | datum-gsp v3 framePr | 200 | SUCCEEDED `cmvumlks600lbv11groz5z1hv` | 63ae20d7bb1ff69e | lulus: 3 unit, 1 inang, 2 chip |
| 002/GSP/KT/X/2026 | 11 | v2 table3col | 200 | SUCCEEDED `cmvumlmfk00lhv11gz79gs9kh` | 613b1175e883c195 | tidak berjalan (bukan K2, sesuai rancangan) |
| 003/GSP/KT/X/2026 | 8 | v3 framePr | 200 | SUCCEEDED `cmvumlnw100lnv11gpohqytlg` | 8ce718ef7c5a2d2a | lulus: 3 unit, 2 inang, 2 chip |
| 003/GSP/KT/X/2026 | 9 | v3 framePr | 200 | SUCCEEDED `cmvumlojh00ltv11gmfz25pdy` | 0e5750651f1d1af9 | lulus: 3 unit, 2 inang, 2 chip |
| 003/GSP/KT/X/2026 | 10 | v3 framePr | 200 | SUCCEEDED `cmvumlp5w00lzv11gqv7sz825` | b00a23e59d05819e | lulus: 4 unit, 2 inang, 2 chip |

  - Rev 1-7 dok 003 menjawab 409 `DOCUMENT_INCOMPLETE`. Ini aturan kelengkapan (slot wajib kosong pada revisi awal), bukan gerbang rel, dan sudah ditolak sebelum mesin berjalan.
  - Putaran pertama (sesudah suntingan `toc-refs.ts`, sebelum suntingan `assemble`) memberi sha DOCX yang sama untuk kelima revisi.
- **PAGEREF ↔ bookmark (XML, `analyze.py`; PDF soffice tidak tersedia):**
  - 002 r12, 002 r11, 003 r8, 003 r9: PAGEREF 13 = bookmark 13, nol menggantung, nol yatim. `_StToc_001` → "Technical Deep Dive…", `_002` → "3.1 Reading the evidence labels" … `_013` → "4.7 What the fleet means for procurement".
  - 003 r10: 15 = 15, termasuk `_014` → "Uji tinggi chart" dan `_015` → "9.1 Cadangan".
  - Rel: 002 r12/003 r8-r10: `framePr` 2, prosa tanpa chip ber-`w:right=2154` = 0.
  - HTML 003 r10: 15 tautan `st-toc-link`, setiap target id ada tepat sekali.
- **Pindai DB baca-saja** (`scan.ts`, `current_database()` = `gsp_agent_hq_v21`): 38 revisi; indentasi kanan eksplisit di konten blok hanya ada pada Manual 000 rev 1 (v1, templat table3col). Template version: `cmvue8khb000hv1us9qwwbkyf` v3 `framePr` (20 revisi), lainnya `table3col`.

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| 002 r11 (templat lama v2 `table3col`) memuat 26 paragraf `w:right=2154` tanpa chip | 0 (di luar area; perilaku warisan templat lama) | Peran badan profil turunan Manual 000 membawa `indRightTw` 2154 (E4, backlog IP-106); G-RAIL-3 sengaja hanya untuk K2 | Observasi. Keluaran revisi lama pada templat lama tetap seperti dulu (D-06). Tidak ada perubahan perilaku dari baris ini | Tidak |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| E2 | Penamaan struktural (`_StToc_c<kunci>`) vs urutan satu sumber | Dipilih urutan dengan satu sumber tingkat (`tocParams` = slot TOC). Akar E2 (params per unit) hilang, dan keluaran semua kasus yang ada byte-identik. Uji FIX-T2 nama berurut tetap valid |
| E2 | Sumber tingkat bila slot TOC tidak ada di `ctx.slots` | Cadangan `ctx.tpl.params`. Pada v1 dan v2 tanpa slot, semua unit memakai peta yang sama (`slotTemplate` mengembalikan `ctx.tpl`), jadi konsisten |
| E5 | **Keputusan untuk dicatat controller:** G-RAIL-3 pada snapshot `studio.norm/v1` = laporan (warn `RAIL_K2_LEGACY_V1` + contoh), bukan gagal keras; v2 tetap gagal keras | v1 adalah satu-satunya kelas data yang sah membawa `format` eksplisit (konten lama, mis. Manual 000), sehingga hanya di sana data lama dapat memicu gerbang (D-06). Saat ini tidak ada revisi di DB yang terdampak (pindai: 0 revisi v1 pada templat framePr). Catatan: kiriman v1 BARU berformat eksplisit pada templat framePr juga akan dilaporkan, bukan ditolak. Bila controller ingin tetap gagal keras untuk v1 baru, diperlukan penanda "render ulang" dari layanan R07 (`services/revisions`, di luar area) |
| E6 | Bentuk `toc.levels` | Hanya int R-66. Larik = invalid + warn (sebelumnya bentuk tak terdokumentasi yang ditolak validator templat) |
| E9 | Lingkup terjemahan | Pesan pemakaian/catatan/baris pemakaian CLI. Baris ringkasan kunci=nilai dan pesan galat importer (`services/import`, di luar area) tidak diubah |
| Jejak DB | 10 job render (2 putaran × 5 revisi) oleh `agent:coder-execution-fixtq` lewat R07; 7 penolakan 409 tanpa job | Tidak ada revisi atau dokumen baru. Output memakai ulang id berkas yang ada (isi identik) |

## Next Steps

- Controller mencatat keputusan E5 (v1 = laporan) di `decisions/decisions.md`.
- Review direkomendasikan (`senior-code-reviewer`, lingkup: `toc-refs.ts`, `pages.ts` (2 baris), blok G-RAIL-3 `assemble/index.ts`, `md2chapter.ts`, 3 uji baru + 2 penyelarasan uji).
