# SR-16 coder-execution: perakit DOCX sadar slot

Status: complete (gerbang D-133). Tanggal 2026-10-23. Skills: backend-execution, dry-run-verify-fix.

Berkas: `engine/docx/assemble/{index,units,bind}.ts`, `engine/docx/package/{section,header-footer}.ts`, `engine/docx/wrapper/render.ts` (numbering.ts tidak perlu diubah; `xml.ts` tidak disentuh).
- `units.ts`: `planUnits` v1 tetap; v2 = rencana compose (unit/urutan slot), validasi slot aktif, blok otomatis sampul/lembar kendali/daftar isi AUTO tanpa isi, placeholder slot wajib kosong (blok `slotPlaceholder` compose dipertahankan; draf saja, non-draf = BY_CONSTRUCTION_FAILED), penempatan tanda tangan dari `slot.placement` (standalone: `doc.front.signature` dibuang dari konteks lembar kendali, mencegah tanda tangan ganda karena compose selalu mengisi front.signature), unit sintetis hanya untuk slot dalam lingkup; `scopePlans` idempoten (SR-15 menyaring hulu).
- `index.ts`: penomoran seluruh dokumen lalu saring lingkup; RenderContext per unit (params/roleFormats slot ditumpuk di atas dokumen, cache per slotKey); mode TOC = `render.toc.mode` slot (KT-11); penanda draf R-39 di header/footer tiap seksi (`ctx.draft ?? scope != DOCUMENT`); cadangan lokal `SLOT_BLOCK_RENDERERS` (slotPlaceholder, sourceRegisterEntry, ruleIndex) bila dispatch kontrak belum punya; komentar :214 diperbarui (D-150); re-ekspor `hostCellRole` dihapus (D-152); `AssembleDocxDetail` + `draft`, `units`.
- `bind.ts`: `hostCellRole`, `isGlyphText`, `plainOf`, langkah tabel dihapus (D-152); BOUND_RUN_TYPES = figur + turunan.
- `section.ts`: ukuran halaman satu sumber `pageSizeFromPaper` (kenop page.size/orientation, cadangan page.sizeMm), tanpa fallback A4 (KC-7; `pageSizeTw` render.section.* diabaikan, PC-05); margin atas/bawah dari grid; `slot.setup` (R-41) untuk unit v2 termasuk `runningHead` dan `startOnNewPage=false` -> `w:type continuous`; sectPr tanpa pageSizeTw = galat.
- `header-footer.ts`: huruf tebal register dari P4S-13 `boldFields` (IP-44, D-151; alias lengkap enum KT-6, termasuk PAGE/NUMPAGES); `buildSectionPackage` opsi `units`, `contextFor`, `draftMarker`.
- `wrapper/render.ts`: string punggung memakai `resolveUnitSetup` (hapus 11906/16838/1134/1474/1361 :407-411).

Bukti:
- `npx tsc --noEmit -p tsconfig.json`: 102 galat, 0 di area (semua baris paralel: components/studio 100, services/ingest/v2.ts 1, services/submit/pipeline.ts 1).
- `npx eslint` 7 berkas area: exit 0.
- Benchmark v1 (`render_cli` + doc.json + template.json, keluaran `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/sr16/`): SUCCEEDED, 29x `<w:pgSz w:w="11906" w:h="16838"/>`, `word/document.xml` identik baseline pra-SR-16; 21 footer berbeda (P4S-13 bawaan). Templat + boldFields BM: DOCX byte-identik baseline (sha 53485ebc1eddd145...). A4 landscape (page.orientation): 29x `w:w="16838" w:h="11906" w:orient="landscape"`.
- Asap E1 (`smoke_compose.ts`: mergeSubmission + composeV2 SR-08 -> assembleDocxDetailed): DOCUMENT 7 seksi (8 bila standalone) = unit compose, satu seksi per unit slot; header sampul kosong dari `slot.setup` sementara templat pembungkus kepala berjalan; lampiran landscape + header kosong (`runningHead:false`); tanda tangan 1x di kedua penempatan; TOC medan; Tabel 2.1. Draf SLOT controlSheet kosong: placeholder "[Lembar Kendali belum diisi]" + DRAF di header. Draf CHAPTER 2: 1 seksi, DRAF, Tabel 2.1. Lewat `renderSnapshot` SR-15 (bab 2): header1 memuat DRAF.

Permintaan (file_requests.md, 6 baris SR-16): sematan boldFields BM di template.json/template.v2.json/preset; cabut re-ekspor A4_PORTRAIT_TW (package/index.ts); ekspor `pageSizeFromPaper` (tokens); wrapper/formats.ts textWidthTw pakai resolveUnitSetup; alias P4S-13 HTML; renderer kontrak slotPlaceholder/sourceRegisterEntry/ruleIndex (RQ-7).
Keputusan untuk controller: (1) ruleIndex DOCX = seksi kosong + warn (indeks otomatis belum ada); (2) placeholder pada render non-draf = BY_CONSTRUCTION_FAILED; (3) slot.setup menang atas setup unit untuk unit v2; (4) nomor halaman lokal tercapai karena berkas lingkup hanya memuat unit lingkup (PAGE/NUMPAGES mulai 1).
Review recommended: senior-code-reviewer atas engine/docx/assemble/** dan package/{section,header-footer}.ts.
