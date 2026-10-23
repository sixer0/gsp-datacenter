# 13 Uji unit struktur dan permukaan (SR-44)

Baris: SR-44 (test-expert, skill `tdd`). Tanggal: 2026-10-23. Status: complete.
Pembaruan lanjutan (D-247, D-261, IP-63; `file_requests.md:226-227`): uji usang adaptor (`render`/`outputs` kini dibuang, bukan dibentuk), DF-70/DF-71 (19 entri per lokasi, 33 kasus medan), berkas baru `render-field.test.ts` (`RENDER_FIELD`), O-1 ditutup D-261 (PID_CONFLICT sebelum idempoten) dan dikunci uji.
Area tulis: `tests/unit/studio/structure/**` (baru) dan berkas ini. Klaim: `delegation_progress/file_claims.md` (prefiks SR-44).
Kode produksi (`src/**`, `prisma/**`) tidak diubah. DB tidak disentuh (semua unit murni; `@/lib/prisma` diganti tiruan yang melempar di `error-codes.test.ts`).

## 1. Strategi uji

- Lingkup: aturan struktur §2.7 blueprint 05 (10 SLOT_* + BLOCK_TYPE_NOT_ADMITTED + CHAPTER_KEY_INVALID), DISPLAY_FIELD DF-01..DF-69 dan V1_FIELD VF-01..VF-14 (register 03 §5), adaptor v1 -> v2 (§14, D-221, D-223/D-227), pemetaan glif (R-40, D-145), kelengkapan (§8), identitas pid (§10, KD-13, KD-22), cakupan dan lapis parameter (§13.1-§13.5, D-163, D-165, D-170), urutan resolusi preset/esensial/lanjutan/turunan/T, rantai ukuran kertas (DV-01/DV-02, D-169, D-172), kerangka implisit (§6.3), sha rekonstruksi (§4.6, SC-5).
- Seam (antarmuka publik modul, tanpa internal): `validateV2Against` (pemeta tunggal `classifySchemaV2Errors`), `validateStructure`, `mergeSubmission`, `composeV2`, `rebuildSource`, `storedComposeContext`, `canonicalSha256`, `adaptV1`, `mapRun`/`mapInline`/`apparatusInline`/`glyphSet`, `computeCompleteness`, `applyPidOp`, `validateSkeleton`, `implicitSkeleton`, `skeletonSha256`, `checkTemplateWrite`, `resolveSlotParams`, `resolveParams`, `pageSizeFromPaper`, `isScopeAllowedInSlot`, `resolveTarget*`, `assertCreatable`, `documentIncompleteError`, `STRUCTURE_SLOT_CHECKS`, `inlineFormatStripped`, `STUDIO_ERROR_HTTP`.
- Sumber kebenaran harapan: tabel register/blueprint (SL-01..SL-07, DF/VF, R-38..R-52, PC-01..PC-07, §8.1, §8.3, §10, §13.4) dan keputusan D-xxx; bukan keluaran kode (anti-tautologi).
- Kerangka: Vitest 4.1.11 (`vitest.config.ts`, include `tests/**`, environment node). Tanpa konfigurasi cakupan baris (tidak ada di repo).
- Pengecualian: SCOPE_CONFLICT hanya punya jalur DB (`submit/pipeline.ts` `checkBase` tidak diekspor, `revisions/v2/service.ts`); di sini hanya pemetaan HTTP 409, perilaku -> SR-45/SR-49.

## 2. Berkas uji

| Berkas | Kasus | Isi |
|---|---|---|
| `tests/unit/studio/structure/_kit.ts` | - | Kerangka SL-01..SL-07, E1, dokumen probe (semua lokasi DF), pembantu merge/compose |
| `display-field.test.ts` | 167 | DF-01..DF-71 berpointer tepat, matriks 52 x 45 lokasi, DF-65 x 11 varian ChartDataV2, DF-70/71 (panel, garis ambang blok dan panel), VF-01..VF-14 |
| `slot-rules.test.ts` | 34 | 10 SLOT_* + BLOCK_TYPE_NOT_ADMITTED + CHAPTER_KEY_INVALID (negatif + positif) |
| `params-surface.test.ts` | 67 | Register R-38..R-52/PC, SC-2, cakupan slot, izin tulis 1-7, urutan resolusi, rantai kertas |
| `adapt-v1.test.ts` | 37 | AD-01..AD-16 (AD-03/AD-15 diganti D-247: `render`/`outputs` dibuang, `stripped.render/outputs` = 1), R-38 strip/reject/allow, §14.2, §14.3, D-221, RQ-11, 4 fixture paritas v1 |
| `glyph-compose.test.ts` | 13 | glyphSet, pemecahan glif, penanda makna, label aparatus, ujung ke ujung, pulang-pergi v1 |
| `completeness.test.ts` | 27 | §8.1 (12 baris tabel), §8.2, §8.3 teks/forward/nextSteps, §8.4 bentuk |
| `pid-identity.test.ts` | 18 | pembentukan, pertahankan, geser, pensiun, PID_CONFLICT (termasuk isi identik + pid asing, D-261), PID_NOT_FOUND |
| `render-field.test.ts` | 13 | D-247: `render` di badan R04/R12/R13 (skema v2) dan R16/R14 (PATCH) -> 400 SCHEMA_INVALID `checkId: RENDER_FIELD` berpointer `/render`, pesan endpoint render; `render` bersarang bukan RENDER_FIELD |
| `skeleton-reconstruction.test.ts` | 13 | kerangka implisit §6.3, sidik kanonik, SC-5 sha rekonstruksi (+2 negatif) |
| `error-codes.test.ts` | 52 | tabel §2.7 -> HTTP (26 kode), TEMPLATE_MISMATCH, META_CONFLICT, ASSET_NOT_FOUND, DOC_TARGET_AMBIGUOUS, META_REQUIRED_FOR_CREATE, DOCUMENT_INCOMPLETE, lint LD-01..LD-04 |

## 3. Inventaris cakupan kasus negatif

### 3.1 Kode §2.7 (blueprint 05) -> kasus negatif

| Kode | HTTP | Kasus negatif (berkas > describe) | Status |
|---|---|---|---|
| SCHEMA_INVALID (+DISPLAY_FIELD) | 400 | display-field > semua describe | PASS |
| SLOT_UNKNOWN | 422 | slot-rules > 1 (order, sections, slot OMIT) | PASS |
| SLOT_REQUIRED_MISSING | 422 | slot-rules > 4 | PASS |
| SLOT_DUPLICATE | 422 | slot-rules > 2 (order + validateSkeleton) | PASS |
| SLOT_POSITION_LOCKED | 422 | slot-rules > 5 (appendices, cover) | PASS |
| SLOT_TYPE_MISMATCH | 422 | slot-rules > 6 (payload, kiriman bab) | PASS |
| SLOT_FORBIDDEN_FOR_TIER | 422 | slot-rules > 3 (order, isi) | PASS |
| SLOT_INPUT_NOT_ACCEPTED | 422 | slot-rules > 7 | PASS |
| SLOT_ITEMS_OUT_OF_RANGE | 422 | slot-rules > 8 (langsung + sesudah merge) | PASS |
| BLOCK_TYPE_NOT_ADMITTED | 422 | slot-rules > BLOCK_TYPE_NOT_ADMITTED (blok, intro) | PASS |
| SLOT_USE_CHAPTER_ENDPOINT | 422 | slot-rules > 9 | PASS |
| SLOT_PARAM_SCOPE_INVALID | 422 | slot-rules > 10 (validateSkeleton, checkTemplateWrite) | PASS |
| PARAM_SURFACE_FORBIDDEN | 403 | params-surface > izin 7 (advanced, internal, expertMode, medan setup) | PASS |
| PRESET_READONLY | 403 | params-surface > izin 1 | PASS |
| PARAM_CLASS_K_FORBIDDEN | 403 | params-surface > izin 6 | PASS |
| PARAM_CLASS_T_READONLY | 400 | params-surface > izin 4 (T, derived, slot.setup.pageSizeTw) + resolusi (8) | PASS |
| INLINE_FORMAT_REJECTED | 422 | adapt-v1 > AD-09 reject (pointer per medan) | PASS |
| DOC_TARGET_AMBIGUOUS | 400 | error-codes > DOC_TARGET_AMBIGUOUS (7 kasus) | PASS |
| META_REQUIRED_FOR_CREATE | 400 | error-codes > META_REQUIRED_FOR_CREATE (4 kasus) | PASS |
| META_CONFLICT | 409 | error-codes > TEMPLATE_MISMATCH / META_CONFLICT | PASS |
| TEMPLATE_MISMATCH | 409 | error-codes > idem (slug, versi) | PASS |
| SCOPE_CONFLICT | 409 | error-codes > hanya pemetaan HTTP (jalur DB) | PARTIAL, lihat §4 G-1 |
| PID_NOT_FOUND | 404 | pid-identity > PID_NOT_FOUND (jangkar move, pid bab) | PASS |
| PID_CONFLICT | 422 | pid-identity > pensiun, bab lain, ganda, sisipan pensiun | PASS |
| ASSET_NOT_FOUND | 422 | error-codes > ASSET_NOT_FOUND (4 jalur) | PASS |
| DOCUMENT_INCOMPLETE | 409 | error-codes > DOCUMENT_INCOMPLETE | PASS |
| Lint SLOT_CONTENT_MISSING (FAIL) | - | error-codes > lint rilis | PASS |
| Lint CONTENT_CHAPTER_GAP (FAIL TERBIT/REPORT NOTA) | - | error-codes > lint rilis | PASS |
| Lint SCHEMA_V1_ADAPTED / INLINE_FORMAT_STRIPPED (REPORT) | - | error-codes > lint rilis | PASS |
| Tambahan: CHAPTER_KEY_INVALID | 422 | slot-rules > CHAPTER_KEY_INVALID | PASS |
| Tambahan D-247: SCHEMA_INVALID `RENDER_FIELD` | 400 | render-field > kiriman v2 (doc/chapter/slot) + sunting (PATCH pid/struktur) | PASS |

### 3.2 DISPLAY_FIELD DF-01..DF-69 (setiap DF punya kasus negatif berpointer tepat, pesan register §5.1)

| DF | Kasus (lokasi v2) | Status |
|---|---|---|
| DF-01..DF-10 | run (`.../blocks/0/runs/0/<medan>`) | PASS |
| DF-11 `format` | paragraph, list item, cell, rail, caption, source | PASS |
| DF-12..DF-17 | paragraph; paragraph/chapter/toc/part; section; signature; chart/diagram/image/symbolSheet; caption | PASS |
| DF-18..DF-23 | cover/chapter/part/toc; table; column/cell; column+3 figur; 3 figur; diagram spec | PASS |
| DF-24..DF-31 | controlSheet/colophon/signature/toc; colophon/signature; cover x2; cell+table; cell x3 | PASS |
| DF-32..DF-41 | row x2; table; signature; section; chart+diagram spec; chart; komposit; chart+root; root | PASS |
| DF-42..DF-52 | chapter+toc; section; caption; column; list item; chart; cover+toc; toc; part; paragraph+root; paragraph | PASS |
| Matriks global | 52 nama x 45 lokasi objek v2 = 2.340 kombinasi; VF-11 `style`@ListV2 dan VF-13 `kicker`@CoverPayloadV2 -> V1_FIELD (prioritas §5.2); D-172 `u`@simpul diagram diterima | PASS |
| DF-53..DF-59, DF-62..DF-71 | 33 medan per lokasi (CaptionV2, ChartV2, PartV2 x4, SymbolSheetV2 x2, TocPayloadV2 x2, ControlSheetPayloadV2, RailLineV2, ChartPanelV2 x6, ChartDataV2 x5, ImageV2, DiagramV2, ChartLimit) | PASS |
| DF-70 / DF-71 (IP-63) | `.../panels/0/widthClass`; `.../limit/max` di ChartV2 dan ChartPanelV2 | PASS |
| DF-65 per varian | 5 petunjuk x 11 shape ChartDataV2 x (blok + panel) | PASS |
| DF-60 | blok `spacer`, `device` (section + intro) -> pointer `/type` | PASS |
| DF-61 | 8 peran halaman depan -> pointer `/role`; 8 peran makna KD-16 diterima | PASS |
| VF-01..VF-14 | 19 kasus, pesan "pakai <pengganti>", tanpa DISPLAY_FIELD | PASS |

## 4. Analisis cakupan dan celah

- G-1 SCOPE_CONFLICT: tidak ada seam murni (cek dasar per lingkup hanya di transaksi DB). Remediasi: kasus negatif di uji API/DB (SR-45 `api-structure`, SR-49 integrasi `_uji`), atau ekspor fungsi murni pembanding sha lingkup (pemilik SR-13/SR-14) bila controller menginginkan uji unit.
- O-1 DITUTUP (D-261, FIX-S): kiriman bab berisi identik yang membawa pid milik bab lain kini 422 PID_CONFLICT (klaim pid sebelum idempoten); dikunci `pid-identity.test.ts` ("D-261 (O-1 ditutup)"), dan kiriman ulang identik dengan pid miliknya sendiri tetap `unchanged` (KD-13).
- Penyelarasan register yang diuji mengikuti keputusan: D-169 (kolom teks selalu moda A; margin tetap mm untuk non-A4; A4 landscape blok 160) menggantikan baris moda B dan DV-03 W/210 di §13.3-§13.4; D-163 T-1 (expertMode tidak membuka lanjutan bagi USER) menggantikan urutan 7 §13.5.
- Cakupan baris kode tidak diukur (repo tanpa `@vitest/coverage-*`).

## 5. Cara menjalankan

```
npx vitest run tests/unit/studio/structure
npx eslint tests/unit/studio/structure
npx tsc --noEmit -p tsconfig.json   # filter: tests/unit/studio/structure
```

Keluaran segar (2026-10-23, sesudah pembaruan D-247/D-261/IP-63):

```
$ npx vitest run tests/unit/studio/structure
 Test Files  10 passed (10)
      Tests  441 passed (441)
   Duration  9.25s
$ npx eslint tests/unit/studio/structure ; echo exit=$?
eslint exit=0
$ npx tsc --noEmit -p . ; echo exit=$?
tsc exit=0   (0 galat repo; galat TS2339 adapt-v1.test.ts:52 hilang)
```

Catatan riwayat: jalan pertama SR-44 = 9 berkas / 421 lulus; sebelum pembaruan, 5 uji usang gagal (DF register 17->19, kasus 31->33, DF-71 tanpa induk ChartLimit di probe, AD-03, AD-15).

## 6. Catatan CI

- Murni dan deterministik (pid berbenih, tanpa jam/jaringan/DB); waktu ~10 s. Tidak ada uji flaky yang teramati (3 kali jalan, hasil sama).
- Bergantung pada fixture baca-saja `tests/parity/fixtures/doc/*.json` (4 dokumen v1).

## 7. Batasan

- SCOPE_CONFLICT hanya pemetaan HTTP (G-1). Gerbang kepercayaan D-98/D-134 dan aset M13 nyata di luar lingkup unit ini.
- Rekonstruksi SC-5 diuji pada jalur murni (pulang-pergi JSON baris/snapshot), bukan pembacaan M14-M18 dari DB (SR-49).

## 8. Rekomendasi

1. Tutup G-1 lewat SR-45/SR-49 atau ekspor pembanding lingkup murni.
2. Pertimbangkan `@vitest/coverage-v8` agar cakupan baris dapat dilaporkan fase berikut.
