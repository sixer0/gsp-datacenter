# Catatan coder-execution RQ-11 (putusan D-223; lanjutan RQ-9)

Status: complete. Tanggal 2026-10-23. Skills: backend-execution, dry-run-verify-fix. Klaim RQ-11 di `file_claims.md`.

## Berkas
| Berkas | Perubahan |
|---|---|
| `src/lib/studio/contract/schema/v2/common.schema.ts` | `ChartV2.panels` `maxItems` 12 -> 24; `ChartPanelV2.limit` `{value, label?}` (bentuk = `ChartV2.limit`); `ChartDataV2`: `categorical.points[].target`, `xy.divider {x?, y?}` (minProperties 1), `distribution.binEdges` (2..201 angka = batas mesin MAX_BINS + 1) dan `distribution.sectors` (bulat 4..72 = batas mesin) |
| `src/lib/studio/contract/schema/v2/forbidden.ts` | peta struktur: `ChartPanelV2.limit -> ChartLimit` (pelokasi galat) |
| `src/lib/studio/contract/types/v2/doc.ts` | tipe padanan + dok `highlight` (aturan kategori + seri) |
| `src/lib/studio/services/adapt-v1/blocks.ts` | `adaptChartParams` baru (params S94 -> konten v2); `limit`/`limitLabel` panel -> `ChartPanelV2.limit`; params sisa dihitung `stripped.params` (satu per spec, seperti sebelumnya) |
| `src/lib/studio/services/compose/blocks.ts` | `chartData` meneruskan konten baru ke mesin sebagai petunjuk data `params` (`targets`, `divider`, `binEdges`, `sectors`); limit panel -> `limit`/`limitLabel` spec panel; bentuk `series` kategori (+ satu seri) -> aksen titik; `distribution` indeks bulat -> `accent.point` |

## Klasifikasi data vs tampilan (bukti)
Sumber: tabel mesin `engine/chart/core/params.ts:61-81` `CHART_DATA_HINT_KEYS` ("bentuk data, bukan parameter tata letak") disaring dengan D-215 (ParamDef `chart.kind.*` = templat) dan D-139.
| Panel | Kunci | Putusan | Alasan |
|---|---|---|---|
| P-09 | `targets` (`target`) | DATA -> `points[].target` | sasaran per baris dalam satuan data (`bullet.ts:84-95`) |
| P-09 | `max` | tampilan (dibuang) | domain skala; mesin menurunkan 100 dari `bandLevels`/data (`bullet.ts:107-115`) -> render sama untuk BM (data maks 95) |
| P-09 | `belowTargetColour` | tampilan | warna (`bullet.ts:124`) |
| P-09 | `chart.kind.P-09.bandLevels` | templat | ParamDef (D-215) |
| P-11 | `limit`/`limitLabel` | DATA -> `ChartPanelV2.limit` | D-223 (2) |
| P-13 | `divider` | DATA -> `xy.divider` | garis bagi kuadran dalam satuan data (`quadrant.ts:107-115`) |
| P-13 | `axis` | tampilan | domain sumbu; preseden ParamDef `chart.kind.P-11.axis` (D-215) |
| P-13 | `chart.kind.P-13.quadrantNames` | templat (RAGU) | teks label = mirip konten, tetapi D-215 menetapkannya ParamDef; tidak dipindah |
| P-14 | `accentCategory` | SOROTAN -> `highlight: ["MTTR"]` | D-223 (5); prioritas mesin: hanya bila tanpa `accent` (`family-p2/common.ts:127-133`) |
| P-14 | `axis` | tampilan | seperti P-13 |
| S-01 | `binEdges` | DATA -> `distribution.binEdges` | data galeri terkelompok di tepi ini (catatan `x.countsNote`: "nilai merata di dalam bin") |
| S-01 | `medianLabel` | tampilan (RAGU) | format label; mesin menghitung median + label sendiri (`histogram.ts:166`) |
| S-01 | `axis`, `chart.kind.S-01.*` | tampilan / templat | domain sumbu; ParamDef |
| S-08 | `sectors` | DATA -> `distribution.sectors` | sudut data = pusat sektor 10 derajat (5, 15, ..., 355) |
| S-08 | `accentSectorDeg` | SOROTAN -> `highlight: [7]` | indeks sektor (75 / (360/36)); mesin membaca indeks dari `accent.point` (`radial.ts:101-113`) |
| S-08 | `compassLabels` | tampilan | label arah = bawaan mesin `["U","T","S","B"]` (`radial.ts:20-21`) |
| P-03 | `accent {point K3, series real}` | SATU sorotan | adaptor -> `highlight ["K3","real"]`; compose: kategori + tepat satu seri = `accent {point, series}` (D-136) |

## Bukti (2026-10-23)
- `npx tsx benchmark/harness/run/run_benchmark.ts --schema v2 --dry-run`: exit 0; `skema doc sesudah substitusi {"id":"studio.doc/v2","valid":true,"issues":0,"first":[]}` (sebelumnya 1 isu maxItems panels).
- `--schema v1 --dry-run`: exit 0; `{"id":"studio.doc/v1","valid":true,"issues":0,"first":[]}`.
- `npx tsx benchmark/harness/run/selftest_verdict.ts`: 24/24 lulus.
- Skrip scratch `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/rq11/verify_rq11.ts` (keluaran `verify.txt`): SEMUA LULUS — ajv E1 `studio.doc/v2` 0 isu, E2 `studio.chapter/v2` 0 isu, E2 + komposit bm-fig-17 15 panel 0 isu, 25 panel ditolak (maxItems), limit panel tanpa `value` ditolak; render P-11 via compose -> mesin: `<line x1="31.2081" y1="3" x2="31.2081" y2="27.4" stroke="#101418" stroke-width="0.3" stroke-dasharray="1.2 0.9" data-limit="line"/>` + `<text ...>batas 55,0 dB(A)</text>`; P-03 kolom per isian `{"#C3CBD1":4,"#6B7783":3,"#B45309":1}` = satu kolom tersorot `data-series="real" data-index="2"` (K3); P-14 `accent {point: MTTR}`; S-08 `params {sectors: 36}` + `accent {point: 7}`; komposit penuh bm-fig-17 (15 panel) dan bm-fig-21 dirender lewat v2.
- `npx tsc --noEmit -p tsconfig.json`: exit 0, 0 `error TS`.
- `npx eslint src/lib/studio/contract/schema/v2 src/lib/studio/contract/types/v2 src/lib/studio/services/adapt-v1 src/lib/studio/services/compose`: exit 0.
- `npx vitest run tests/unit/studio`: 123 gagal / 1008 lulus, IDENTIK sebelum dan sesudah RQ-11 (baseline dengan berkas dibalik sementara; daftar nama uji gagal diff kosong) -> kegagalan bawaan, bukan regresi.

## Temuan untuk controller
1. Amandemen register `03_structural_sections_specs.md` T2-24/T2-25 (milik SR-01/controller): medan baru `points[].target`, `xy.divider`, `distribution.binEdges`, `distribution.sectors`, `ChartPanelV2.limit`, aturan `highlight` kategori + seri.
2. Dokumen agen (`docs/STUDIO-AGENT-GUIDE.md`, `docs/API-REFERENCE.md` seksi 12; pemilik SR-35b) belum menyebut medan ini.
3. Domain sumbu `axis` P-13/P-14/S-01 hilang di v2 (tanpa ParamDef `chart.kind.<KODE>.axis` untuk kode itu, beda dengan P-11) -> kandidat ParamDef templat (pola IP-41c), bukan medan konten.
4. Review direkomendasikan (lingkup: `adapt-v1/blocks.ts` `adaptChartParams`, `compose/blocks.ts` `chartData`).
