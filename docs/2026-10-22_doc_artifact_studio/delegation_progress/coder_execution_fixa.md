---
task_id: FIX-A
task_slug: doc_artifact_studio
row: FIX-A (IP-59, loop perbaikan siklus 2)
date: 2026-10-23
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/05_structural_sections_blueprint.md
status: complete
---

# Catatan coder-execution FIX-A — `axis` P-13/P-14/S-01 sebagai parameter templat (IP-59, D-227)

Status: complete. Skills: receiving-code-review, dry-run-verify-fix. Klaim FIX-A di `file_claims.md`.

## Akar masalah
- Mesin P-13/P-14/S-01 hanya membaca petunjuk data pendek `params.axis` (`family-p2/quadrant.ts`, `family-p2/arrow.ts`, `family-s1/common.ts` `hintAxis`); tidak ada ParamDef, jadi templat tidak bisa menyetelnya. Konten v2 menolak `axis` (DISPLAY_FIELD DF-63..65, D-230) -> domain hilang di v2.
- Panel komposit dirender dengan `COMPOSITE_CHART_TEMPLATE` (bukan templat dokumen, D-134, `services/render/pure/chart.ts`), jadi parameter templat `chart.kind.<KODE>.*` (termasuk `quadrantNames`, D-227) juga tidak sampai ke panel.
- Menambah ParamDef bernama `axis` saja tidak cukup: resolver tunggal (`core/params.ts`) memindah alias `axis` ke kunci penuh SEBELUM cabang petunjuk data, sehingga pembaca `hint(spec, "axis")` harus ikut membaca kunci penuh (kalau tidak, jalur v1 rusak).

## Berkas
| Berkas | Perubahan |
|---|---|
| `src/lib/studio/registry/charts.ts` | 3 ParamDef petunjuk baru (pola IP-41c: `hint`, grup P7X -> `section:chart` + `advanced` otomatis, default null = domain otomatis mesin v1): `chart.kind.P-13.axis` (range, objek `{x?, y?}`), `chart.kind.P-14.axis` (range), `chart.kind.S-01.axis` (range). Pin `CHART_PARAMS_COUNT` 130 -> 133, `CHART_HINT_PARAMS_COUNT` 31 -> 34; komentar kepala |
| `src/lib/studio/params/index.ts` | Pin `CATALOG_PARAM_COUNT` 716 -> 719 (total 781 -> **784**) + komentar |
| `src/lib/studio/services/compose/blocks.ts` | `kindTemplateParams` + `specParams`: parameter templat `chart.kind.<KODE>.*` yang diset (nilai efektif slot != default registri) diteruskan ke `params` spec mesin (kunci penuh, urut leksikografis), untuk chart tunggal dan tiap panel komposit; digabung dengan petunjuk data konten `chartData` |
| `src/lib/studio/engine/chart/family-p2/quadrant.ts` | `axis` = `kindParam(..., "axis") ?? hint(spec, "axis")` |
| `src/lib/studio/engine/chart/family-p2/arrow.ts` | idem (+ impor `kindParam`) |
| `src/lib/studio/engine/chart/family-s1/common.ts` | `hintAxis`: kunci penuh `chart.kind.<KODE>.axis` bila ada (S-01), selain itu petunjuk `params.axis` (S-02..S-04 tetap) |

`registry/slots.ts` dan `registry/essentials.ts` tidak perlu diubah (cakupan/lapis dihitung per grup P7X).

## Bukti (segar, 2026-10-23)
Skrip scratch `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/fixa/verify_fixa.ts` (keluaran `final.txt`): **SEMUA LULUS**. Acuan v1 = spec panel fixture apa adanya dalam bingkai komposit yang sama, tanpa `heightMm` (medan ukuran v1 yang di v2 diatur templat, D-139); v2 = blok hasil adaptor `mapFigureSpecToV2` -> `mapBlock` dengan templat berisi nilai fixture.
- Hitung: CATALOG 719 (pin 719), ALL 784 (pin 784), CHART_PARAMS 133 (pin 133, hint 34); ParamDef `P7X-P-13-axis`/`P7X-P-14-axis`/`P7X-S-01-axis` range, default null, scope `section:chart`, surface `advanced`.
- P-13 (bm-fig-17): v2 = v1 IDENTIK `ec1f24fffae9`; templat kosong `fd00b47e82e1` (beda = axis + quadrantNames berpengaruh). Params panel v2: `divider` (konten) + `chart.kind.P-13.axis` + `chart.kind.P-13.quadrantNames` (templat).
- P-14 (bm-fig-17): v2 = v1 IDENTIK `f1ca126f0101`; templat kosong `94f2d1a4efbc`. Chart tunggal P-14: templat `chart.kind.P-14.axis` = v1 alias `params.axis` IDENTIK `f58df25affc1`.
- S-01 (bm-fig-21): fixture TIDAK memuat `axis`. Beda tunggal v2 vs v1 = teks label median (`median 34` v1 vs `median 34 tahun` v2): `medianLabel` = tampilan, dibuang D-227 (mesin menyusun label sendiri) — bukan bagian baris ini. Tanpa `medianLabel` di acuan: IDENTIK `704fb4d52bf1`. Probe axis `[0, 100]` templat vs v1 alias: IDENTIK `36b528653062`, dan berbeda dari tanpa axis (parameter berpengaruh).
- Konten berisi `axis` tetap DISPLAY_FIELD (`validateV2Against studio.chapter/v2`): `/panels/0/axis`, `/panels/0/data/axis`, `/blocks/2/axis` -> `checkId: "DISPLAY_FIELD"`.
- Jalur v1 tidak berubah: render panel fixture sebelum/sesudah `cmp` IDENTIK (P-13, P-14, S-01). Komposit penuh bm-fig-17..21 (berkas sumber dibalik sementara lalu dipulihkan, `cmp` OK): SVG v1 dan v2 (templat kosong) sha IDENTIK sebelum/sesudah (`full_before.txt` / `full_after.txt`). Satu-satunya beda REPORT v1: bm-fig-17 +2 `PARAM_ALIAS` (`axis -> chart.kind.P-13.axis`, `axis -> chart.kind.P-14.axis`) = perilaku resolver baku untuk alias ber-ParamDef (sama dengan petunjuk IP-41c).
- DOCX v1 Manual 000: `render_cli.ts --doc benchmark/manual000/doc.json --template benchmark/manual000/template.json --formats docx` -> `53485ebc1eddd145…` (tetap).
- `npx tsx benchmark/extract/convert_v2.ts --check`: SAME doc.v2 `79290e07…`, template.v2 `882057c5…`, preset `d181efb1…`.
- `npx tsc --noEmit -p tsconfig.json`: exit 0, 0 `error TS` (repo).
- `npx eslint` 6 berkas di atas: exit 0.
- `npx vitest run tests/unit/studio/figures tests/unit/studio/structure`: sesudah 5 gagal / 869 lulus; garis dasar (berkas dibalik sementara) 4 gagal / 870 lulus. 4 bawaan = `diagram-bad-cases.test.ts` (DATUM-33 247 mm, dll.; di luar area). +1 = `chart-smoke.test.ts:34-41` pin `130` -> kini 133 (disengaja; milik baris uji).

## Keputusan untuk dikukuhkan controller
| Keputusan | Alasan |
|---|---|
| Nama ParamDef `chart.kind.<KODE>.axis` (bukan nama lain) | Konsisten dengan 9 ParamDef `axis` IP-41c (D-215); konsekuensinya pembaca mesin 3 keluarga ikut membaca kunci penuh |
| Penerusan compose UMUM untuk `chart.kind.<KODE>.*` yang diset (bukan hanya axis) | Panel komposit tidak menerima templat dokumen (D-134); tanpa aturan umum `quadrantNames` P-13 (ParamDef templat, D-227) juga hilang dan P-13 v2 != v1. Nilai = default tidak diteruskan, jadi templat yang tidak menyetel `chart.kind.*` (seluruh preset Manual 000) tidak berubah (bukti: komposit sha identik, convert SAME). Efek samping disengaja: P-11.axis dan petunjuk IP-41c lain yang diset templat kini juga sampai ke panel komposit |
| Semantik domain mengikuti mesin v1 per kode (classNote) | P-13/P-14 = domain tercetak tepat; S-01 = data di luar memperluas + REPORT AXIS_HINT (tidak diseragamkan ke `axisDomain` IP-41c agar v1 byte-identik) |

## Deviasi area (perlu dikukuhkan)
- Brief menyebut `params/**` sebagai "registri chart"; ParamDef chart berada di `registry/charts.ts` -> diedit (HANYA 3 baris + pin), diklaim.
- Pembaca mesin `family-p2/{quadrant,arrow}.ts`, `family-s1/common.ts` di luar area brief, tanpa pemilik aktif di `file_claims.md`; perubahan minimal 1 baris baca per berkas, diklaim. Tanpa ini ParamDef `axis` memutus jalur v1 (resolver memindah alias ke kunci penuh).

## Permintaan / temuan (luar area, tidak disentuh)
1. Baris uji (SR-42): `tests/unit/studio/figures/chart-smoke.test.ts:33-41` pin 130/31 -> 133/34.
2. `engine/chart/core/params.ts:69-78` (`CHART_DATA_HINT_KEYS`, pemilik FIX-FIG `core/**`): entri `axis` untuk P-13/P-14/S-01 kini mati (cabang ParamDef menang lebih dulu); boleh dibuang, tidak memengaruhi keluaran.
3. Preset/templat (FIX-W atau pemilik preset): agar figur benchmark v2 = v1, preset Manual 000 perlu menyetel `chart.kind.P-13.axis {x:[0,10], y:[0,10]}`, `chart.kind.P-13.quadrantNames {...}`, `chart.kind.P-14.axis [15, 95]` (dan `chart.kind.S-01.bins 16` bila diinginkan; render sama karena `binEdges`). Belum dilakukan (bukan area; convert harus tetap SAME selama FIX-W meregenerasi).
4. Register/panduan (DOC-1/SR-35b): 3 ParamDef baru + aturan penerusan compose; skrip hitung SR-05 lapis advanced +3.
5. Review direkomendasikan (lingkup: `compose/blocks.ts` `kindTemplateParams`/`specParams`, 3 pembaca mesin).
