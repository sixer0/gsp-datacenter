# SR-18 Lint struktur v2 (coder-execution) — status: complete

Berkas: `src/lib/studio/engine/lint/structure/checks-slots.ts` (baru), `structure/index.ts`, `structure/context.ts`, `structure/walk.ts` (tipe `walkDoc` saja), `structure/checks-d.ts` (D16), `src/lib/studio/registry/lint.ts` (KC-9).

Hasil:
- Registri +4 (register §11.4): `SLOT_CONTENT_MISSING`, `CONTENT_CHAPTER_GAP`, `SCHEMA_V1_ADAPTED` (modul structure), `INLINE_FORMAT_STRIPPED` (modul scan, dilaporkan modul structure). Kelompok D, stage build, hqMode S, ruleRef D-131/D-138, blocksIngest false, tier semua. Hitungan: registri 99 -> 103, D 21 -> 25, modul structure 45 -> 48, `structureCoverageGaps()` = [].
- `lintStructure`/`lintStructureWith`/`benchmarkSafetyOverrides` menerima `AnyNormSnapshot` (v1 dan v2; pelebaran tipe, pemanggil lama tetap sah). Opsi baru `completeness?` (CompletenessReportV2) dan `adaptReport?`.
- LD-01 FAIL slot wajib aktif EMPTY/PARTIAL (semua tier); LD-02 FAIL TERBIT/SERAH, REPORT NOTA.
- D16 v2: jenis slot (C33) di `sectionPlan` required/forbidden diserahkan ke kerangka (LD-01, ingest SLOT_FORBIDDEN_FOR_TIER); section non-slot tetap dicek; `requiredPresets` dinilai per slot berulang aktif (konten v2 `snapshot.source`).

Keputusan (perlu dicatat controller):
1. Sumber LD-01/LD-02: laporan kelengkapan pemanggil > snapshot v2 DINILAI ULANG menurut §8.1/§8.2 (state tersimpan yang berbeda disebut di detail) > snapshot v1 lewat kerangka implisit §6.3 (KC-8). Tidak bergantung pada kode SR-11 (tepi C, paralel).
2. minItems tidak ada di `NormSlotV2`: dipakai `SLOT_KIND_BY_TYPE.implicitMinItems` (chapter 1) kecuali laporan kelengkapan diberikan.
3. v1: CONTENT_CHAPTER_GAP PASS (bab posisional); SCHEMA_V1_ADAPTED PASS (jalur lama).
4. LD-03 `details`: `LintIssue` tidak punya medan `details`; AdaptReportV1 diserialkan JSON di `detail`.
5. Seam laporan adaptor: `snapshot.source.x.adaptReportV1` (fallback `doc.x`); permintaan ke SR-09/SR-10 di file_requests.

AMANDEMEN REGISTER §11.4 LD-01 (putusan controller, 2026-10-23): pada NOTA, `SLOT_CONTENT_MISSING` TIDAK menghitung PARTIAL yang semata karena celah bab (minItems terpenuhi); celah ditangani `CONTENT_CHAPTER_GAP` (REPORT NOTA, FAIL TERBIT/SERAH). EMPTY dan minItems tak terpenuhi tetap FAIL di semua tier. Diterapkan di `checks-slots.ts` (`partialOnlyByGap`).
Asap ulang setelah amandemen: NOTA bab 1,3 -> rilis PASS (LD-01 PASS, LD-02 REPORT "bab belum ada 2"); NOTA tanpa bab -> rilis FAIL (LD-01 "Konten EMPTY: belum ada bab"); TERBIT E2 saja -> rilis FAIL seperti sebelumnya. tsc repo 9 galat, semuanya di luar area (submit-kit, paragraphs/[pid], documents/route, services/templates/index.ts), 0 di area; eslint area exit 0.

Penjaga (2026-10-23): tsc repo 5 galat, semuanya di luar area (`api/studio/chapters/_shared/submit-kit.ts`, `documents/[id]/content`, `paragraphs/[pid]`: modul services/submit, services/structure, ekspor patchPid/pidHistory belum ada); 0 di area. `npx eslint src/lib/studio/engine/lint/structure src/lib/studio/registry/lint.ts` exit 0.
Asap (tsx, tanpa DB, `runLint` tahap post): TERBIT berisi E2 saja -> releaseStatus FAIL; SLOT_CONTENT_MISSING FAIL @F:controlSheet, @F:signature, content PARTIAL "bab belum ada 1, 2"; CONTENT_CHAPTER_GAP FAIL. NOTA bab 1,3 -> CONTENT_CHAPTER_GAP REPORT "bab belum ada 2 ... NOTA: dilaporkan saja". Kontrol NOTA 1,2 -> PASS. Outline 1-3 dengan bab 1,2 -> gap 3. Adaptasi v1 strip -> LD-03 dan LD-04 REPORT. v1 tanpa controlSheet -> D16 dan LD-01 FAIL; lengkap -> PASS.
Permintaan: file_requests (SR-09/SR-10 seam adaptor; SR-43 pin uji 45 -> 48).
