---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: SR-60
date: 2026-10-23
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/05_structural_sections_blueprint.md
status: complete
---

# Implementation Report: SR-60 fungsi turunan kenop esensial (engine/tokens)

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca baris SR-60, research/09 §4-§8, register §13, D-130/D-158/D-162/D-165/D-166 | complete | |
| 2 | Klaim `file_claims.md` (prefiks SR-60) | complete | |
| 3 | Ukuran halaman satu sumber (`paper.ts`), hapus `A4_MM` (KC-7) | complete | dimensi dari kontrak E38 setelah SR-04 mendarat |
| 4 | Turunan idempoten di `grid.ts` (§6.2 butir 1, 3, 4, 7, 9, 10, 12) | complete | |
| 5 | Fase lapis `layer.ts` (§6.2 butir 2, 6, 13, 14) + `resolveParamsWith` | complete | sekali per resolusi; uji idempotensi lolos |
| 6 | Asap kenop + asap DB baca-saja + tsc + eslint + vitest engine-core | complete | |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/lib/studio/engine/tokens/paper.ts | add | `PAGE_KNOB`, `pageSizeFromKnob` (custom > `PAPER_SIZE_MM[page.size]`, orientasi menukar sisi) |
| src/lib/studio/engine/tokens/grid.ts | modify | turunan baru, `rederiveNonA4` dipensiunkan, `ensureBottomMargin`, `DERIVERS` lengkap (kecuali id fase lapis), tanpa `A4_MM`/`isA4Portrait`/`KEYED_DERIVERS` |
| src/lib/studio/engine/tokens/layer.ts | add | `applyLayerDerivations`, `applySpanScaledSubfields`, `deriveLayered`, `DENSITY_FACTOR`, `pinPolicy` |
| src/lib/studio/engine/tokens/index.ts | modify | resolusi berlapis (acuan = registri <- base; eksplisit = override diterima), cek kolom/blok <= 0, ekspor baru |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | exit 1: 8 galat, semuanya `src/lib/studio/contract/schema/v2/forbidden.ts` | di luar area (SR-04 sedang menulis); 0 galat `engine/tokens` |
| Lint | `npx eslint src/lib/studio/engine/tokens` | exit 0 | |
| Asap kenop | `npx tsx <scratchpad>/sr60_knobs.ts` | SEMUA PASS (33 cek) | registri mendarat 743 kunci, 0 fixture sementara |
| Asap DB | `npx tsx <scratchpad>/sr60_db.ts` | projEqual true x3 | `current_database()` = gsp_agent_hq_v21, baca saja |
| Unit | `npx vitest run tests/unit/studio/engine-core` | 272 lulus / 9 gagal | semua di `tokens.test.ts`, ekspektasi semantik lama |

## Verification
- (1) A4 portrait bawaan (base = template.json tanpa `lint.enforcement*`, `table.widthClass` full): pageSizeTw [11906,16838] (wrapper + interior), marginTw 1474/1361/1361/1134 (header 737/footer 737/gutter 0 utuh), blok 247, kolom 128, bentang 166, tab kanan header 9411, P9-45 247, P5-14 166, R-13 [7257,340,1814], R-30 4680/9360.
- (2) A4 landscape: blok 160, kolom 215, bentang 253, bawah 24, pageSizeTw [16838,11906], tab 14343. A5 potret 66/104/160 (lanskap 128/166/98), Letter 133,9/171,9/229,4 (lanskap 197,4/235,4/165,9; tw 12240x15840), F4 133/171/280 (lanskap 248/286/165; tw 12189x18709): sama dengan tabel research/09 §6.2. AC6: 72 kombinasi (6 kertas x 2 orientasi x 3 kerapatan x 2 base) margin bawah/blok/kolom > 0, 0 galat. A5 lega 55 / 147,5.
- (3) DB v21, versi terbaru, masukan dimigrasi per register §13.6 butir 2 (page.sizeMm -> page.size A4; P5-14 166 -> table.widthClass full; textColumnMm/baselinePt T dibuang): sha terproyeksi ke kunci lama = paramsSha256 tersimpan untuk datum-kanonik v5 (`38c776de…`), datum-gsp v1 (`f7767a75…`), datum-manual-000 v2 (`bee70bde…`); diffKeys kosong; integritas tersimpan true; sha penuh berbeda (20/22 kunci baru, diharapkan F1).
- Idempotensi (R2): resolve (k != 1, kerapatan != sedang, A5 landscape) -> computeDerivedWith x2 = identik.
- PT-09 (tokens): grep `11906|16838|A4_PORTRAIT_TW|A4_MM` di `engine/tokens` = 0.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| 9 uji `tokens.test.ts` gagal | 0 (bukan milik SR-60) | ekspektasi lama: P4G-03/P4G-01/P4T-17 kini T (SR-05), blok teks diturunkan (D-162), N5 terdaftar, uji KEYED_DERIVERS (D-130) | dirutekan ke SR-42 lewat file_requests | tidak |
| tsc 8 galat `contract/schema/v2/forbidden.ts` | 0 | SR-04 sedang menulis | dicatat | tidak (di luar area) |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 4 | Register DV-02 menyebut moda B `W - dalam - luar`; research/09 butir 3 rumus moda A selalu | Ikut research/09 (D-165): moda B tetap lewat `railColsTw` [bentang]; mengubah kolom teks di moda B akan menggeser lebar badan dokumen `auto` tanpa sitasi rel. Perlu putusan controller bila register dimaksudkan |
| 5 | Register DV-03 menskalakan margin non-A4 (W/210, H/297); research/09 AS-59-3 margin tetap mm | Ikut research/09 dan brief (A4 landscape blok 160). Dengan DV-03 hasilnya 174,5 |
| 5 | Sematan preset: research/09 §4.2 (sematan = acuan skala) vs register §13.5 langkah 7 (sematan absolut) | Bawaan `pinPolicy: "reference"` (D-165); `"absolute"` tersedia. Pada kenop = acuan keduanya identik |
| 5 | R-30 diskalakan bentang efektif/bentang acuan (bukan konstanta 166) | Setara pada kanonik/GSP; tanpa angka A4 di mesin |
| 3 | DeriveFnId dan `PAPER_SIZE_MM` mula-mula bentuk sementara lokal | SR-04 mendarat selama baris berjalan dengan 12 id yang sama; bentuk sementara dihapus, impor kontrak |
| 4 | Peta tanpa margin bawah (versi lama, sebelum N5) | `ensureBottomMargin` menghitung sekali dari tinggi - atas - blok tersimpan (D-33), lalu blok diturunkan |

## Next Steps
- SR-42: perbarui 9 ekspektasi `tokens.test.ts` (rincian di file_requests).
- SR-06: resolusi per slot memakai `deriveLayered({ reference, merged, explicit, registry, ctx })` sekali; orientasi slot cukup `computeDerivedWith`.
- SR-16/SR-17: baca `grid.topBottomMarginMm`/`grid.marginBottomMm`/`render.section.*.pageSizeTw` efektif (tanpa fallback A4).
- Review recommended: senior-code-reviewer atas `engine/tokens/**` (fase lapis vs idempoten).
