---
task_slug: doc_artifact_studio
row: DC-26
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/masterplan/05_document_contract_specs.md (§12, §14.1 C59/C60, I68, CA-4, AC-20)
status: complete
---

# Implementation Report: DC-26 registri chart.custom

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca register §12, marker 06, perender `engine/chart/core` + family-p1/k1/w1/h1 (baca saja) | selesai | CA-4 diverifikasi tingkat fungsi |
| 2 | Perluas `registry/charts.ts` (C59, C60, I68, tipe) | selesai | aditif, tanpa perubahan entri lama |
| 3 | Uji `tests/unit/studio/registry/dc26-chart-custom.test.ts` | selesai | 24 uji |
| 4 | Gerbang: vitest, eslint, tsc | lulus | lihat Test Results |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/lib/studio/registry/charts.ts | modify | +impor `ChartCustomMark`, `ChartCustomOrientation`, `ChartCustomFormV2`; seksi baru: `CHART_CUSTOM_DATA_SHAPES`, `ChartCustomDataShape`, `ChartCustomFormId`, `ChartCustomFormDef`, C59 `CHART_CUSTOM_FORMS` (CU-01..CU-09), C60 `CHART_CUSTOM_FORM_COUNT = 9`, `CHART_CUSTOM_FORM_IDS` (untuk `details.supported` EC28), I68 `resolveChartCustom(form, dataShape): DrawnChartCode \| null` (bawaan T2-66 vertical/false; masukan rusak -> null) |
| tests/unit/studio/registry/dc26-chart-custom.test.ts | add | isi = register literal; pin = panjang array; tiap kode tujuan drawn, dataShape sama, punya perender, dirender asap tanpa FAIL; CA-4 orientasi dari geometri SVG; P-01 urut; enumerasi lengkap 4x2x2x11 -> tepat 9 hit, sisanya null; masukan rusak -> null |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Unit | `npx vitest run tests/unit/studio/registry/dc26-chart-custom.test.ts` | 24/24 lulus | |
| Unit (regresi) | `npx vitest run tests/unit/studio/registry tests/unit/studio/figures` | 12 berkas, 417/417 lulus | figures = folder uji chart yang ada (chart-smoke pin 76 tetap) |
| Lint | `npx eslint src/lib/studio/registry/charts.ts tests/unit/studio/registry/dc26-chart-custom.test.ts` | exit 0 | |
| Typecheck | `npx tsc --noEmit -p .` | exit 0, 0 galat | termasuk berkas agen paralel saat dijalankan |

## Verification
- AC-20: CU-01..CU-09 -> P-01, P-02, P-03, K-01, W-01, W-04, W-05, H-01, H-04; semuanya `drawn=true`, `dataShape` sama, `CHART_RENDERERS[code]` fungsi, render asap dari fixture paritas tanpa FAIL; `CHART_REGISTRY_COUNT` tetap 76.
- CA-4 (hipotesis register -> terverifikasi): P-01 = keluarga inti `bar`, batang mendatar (`core/datum.ts:116-144`, `core/gallery.ts:46-62`; uji: tinggi rect seragam, lebar bervariasi). K-01 = batang mendatar bertumpuk (`family-k1/stack.ts` hFrame, rect `xa..xb`). P-02/P-03 kolom tegak. Tabel §12 TIDAK perlu diubah; tidak ada entri `file_requests.md`.
- CA-4 urutan P-01: P-01 MENGURUTKAN data menurun secara bawaan (`core/prepare.ts:81-89`, `chart.kind.P-01.sort` bawaan `valueDesc`; `natural` mempertahankan urutan). Diuji dengan data dibalik.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| none | - | - | - | - |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 2 | Ekspor tambahan di luar register: `CHART_CUSTOM_FORM_IDS`, `CHART_CUSTOM_DATA_SHAPES`, tipe `ChartCustomFormDef`/`ChartCustomFormId`/`ChartCustomDataShape` | aditif; mempermudah DC-27 (EC28 `supported`, tipe). Controller boleh menolak |
| 2 | `registry/index.ts` tidak disentuh (milik DC-06) | bila ekspor C59/C60/I68 perlu lewat barrel: tambah `CHART_CUSTOM_FORMS`, `CHART_CUSTOM_FORM_COUNT`, `CHART_CUSTOM_FORM_IDS`, `resolveChartCustom` (+ tipe) di `registry/index.ts` |
| 1 | CU-01 (P-01) mengurutkan nilai menurun bawaan: agen yang mengirim `bar`+`horizontal` akan melihat urutan data berubah | keputusan untuk DC-27/controller: biarkan (perilaku preset P-01) atau suntik `chart.kind.P-01.sort = natural` saat memetakan custom |

## Next Steps
- DC-27: union `ChartV2.code` + "custom" dan pemanggilan I68 di gerbang by-construction (422 EC28 dengan `CHART_CUSTOM_FORM_IDS`).
- Review recommended (lingkup: seksi chart.custom di registry/charts.ts + uji dc26).
