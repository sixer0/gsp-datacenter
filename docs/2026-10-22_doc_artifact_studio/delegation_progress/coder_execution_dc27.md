---
task_slug: doc_artifact_studio
row: DC-27
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/masterplan/05_document_contract_specs.md (§12, §13.1 EC28; D-367 AM-03, D-368)
status: complete
---

# Implementation Report: DC-27 mesin chart.custom + AM-03

Berkas dideklarasikan sebelum ditulis (klaim file_claims DC-27): `engine/chart/core/custom.ts` (BARU), `core/render.ts`, `core/index.ts`; `contract/types/v2/doc.ts` (HANYA union `ChartV2.code` + JSDoc AM-03); `services/compose/blocks.ts` (HANYA fungsi `chart()` :398/:445 + impor); lint chart `engine/lint/structure/checks-d.ts` (HANYA helper `charts()` :92); uji `tests/unit/studio/figures/dc27-preset-sweep.test.ts` dan `dc27-chart-custom.test.ts` (BARU). Tidak ada berkas engine/chart yang ditulis di luar core/.

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 0 | Sapuan paritas preset SEBELUM edit (58 kode tergambar x 2 gaya = 116 sidik sha256 atas SVG, tinggi, dan laporan) | selesai | sha berkas sapuan `e5baf618…9ecce3` |
| 1 | AM-03: union `ChartV2.code` + `"custom"` | selesai | tsc pecah tepat di 1 titik, `blocks.ts(400,7)`, lalu diperbaiki |
| 2 | Dispatch mesin `core/custom.ts`: I68 -> kode keluarga; CU-01 mendapat `chart.kind.P-01.sort = natural` (D-368); di luar tabel -> EC28 | selesai | `renderChart`/`estimateHeightMm` menerima `StudioChartInput` |
| 3 | Compose `chart()`: `s` bertipe `StudioChartDraft`, `spec = chartSpecFromDraft(s, b.form)` | selesai | preset dikembalikan sebagai objek yang sama |
| 4 | Lint struktur `charts()`: custom dinilai sebagai kode tujuannya (D12-D15) | selesai | bentuk tak didukung dibiarkan; render menolaknya dengan EC28 |
| 5 | Sapuan SESUDAH edit + gerbang | selesai | lihat Test Results |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/lib/studio/engine/chart/core/custom.ts | add | `StudioChartCustomV1`/`StudioChartInput`/`StudioChartDraft`, `isCustomChart`, `customChartCode` (EC28 `{form, dataShape, supported}`), `resolveCustomChart`, `toStudioChart`, `chartSpecFromDraft` |
| src/lib/studio/engine/chart/core/render.ts | modify | `estimateHeightMm`/`renderChart` mendispatch custom lewat `toStudioChart` |
| src/lib/studio/engine/chart/core/index.ts | modify | ekspor modul custom |
| src/lib/studio/contract/types/v2/doc.ts | modify | `code: ChartCode \| "composite" \| "custom"`; JSDoc AM-03 diperbarui |
| src/lib/studio/services/compose/blocks.ts | modify | impor + `const s: StudioChartDraft` + `spec = chartSpecFromDraft(s, b.form)` |
| src/lib/studio/engine/lint/structure/checks-d.ts | modify | impor + helper `charts()` me-resolve spec custom |
| tests/unit/studio/figures/dc27-preset-sweep.test.ts | add | sapuan paritas 116 sidik deterministik; ditulis ke `DC27_SWEEP_OUT` bila diset |
| tests/unit/studio/figures/dc27-chart-custom.test.ts | add | 25 uji: CU-01..09 SVG valid dan identik byte dengan preset kode tujuan, urutan CU-01, EC28, compose, lint D14 |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | exit 0, 0 baris | |
| Lint | `npx eslint` atas 6 berkas sumber + 2 uji DC-27 | exit 0 | |
| Unit DC-27 | `npx vitest run tests/unit/studio/figures/dc27-chart-custom.test.ts` | 25/25 | |
| Paritas | sapuan sebelum vs sesudah (`DC27_SWEEP_OUT`) | 116 kunci, 0 beda; `cmp` IDENTICAL; sha berkas e5baf618…9ecce3 = e5baf618…9ecce3 | |
| Suite studio | `npx vitest run tests/unit/studio` | 109 berkas: 108 lulus, 1 gagal; 2716 lulus / 2 gagal / 1 skip | 2 gagal ada di `renderers/docx-sections.test.ts` (`contractRecord` belum punya renderer DOCX) dan berasal dari delta DC-06 di `registry/sections.ts`, bukan dari DC-27 |

## Verification
- CU-01..CU-09 -> P-01/P-02/P-03/K-01/W-01/W-04/W-05/H-01/H-04: SVG berakar `<svg`, XML berimbang, 0 FAIL, SVG == render preset kode tujuan, tinggi sama.
- Urutan data CU-01: label Alfa, Bravo, Charlie, Delta tetap pada urutan itu (datum dan gallery). P-01 preset dengan data yang sama menghasilkan Bravo, Delta, Charlie, Alfa (valueDesc tidak berubah). `sort` dari agen ditimpa natural.
- Di luar tabel (point x categorical, bar h stacked x categorical, bar x matrix, area h x series, form/data absen) -> `CHART_CUSTOM_FORM_UNSUPPORTED` 422, details sesuai 05 §13.1.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| docx-sections 2 gagal | 0 (bukan milik DC-27) | DC-06 menambah section `contractRecord` sebelum renderer DOCX-nya ada | untuk controller/DC-06 | tidak untuk DC-27 |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 3 | `ChartBlock.spec` (contract/types/doc.ts, bukan milik DC-27) hanya menerima `StudioChartV1` | compose memanggil dispatch mesin sehingga snapshot v1 membawa kode tergambar (tanpa `form`); mesin juga menerima custom langsung |
| 3 | `details.pointer` EC28 (contoh 05 §13.1) tidak tersedia di mesin maupun compose | diisi oleh gerbang by-construction (baris lain) |
| 4 | Lint tidak melaporkan bentuk custom tak didukung sebagai temuan baru | tidak mengarang cek baru; render melempar EC28 |

## Next Steps
- Review recommended: `engine/chart/core/custom.ts`, `blocks.ts chart()`, `checks-d.ts charts()`.
