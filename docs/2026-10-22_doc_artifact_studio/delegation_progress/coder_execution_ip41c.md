---
task_id: IP-41c
task_slug: doc_artifact_studio
row: IP-41c (= IP-39 petunjuk tergambar panel galeri)
date: 2026-10-23
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/05_structural_sections_blueprint.md
status: complete
---

# IP-41c coder-execution — ParamDef petunjuk tergambar panel galeri (IP-39, D-113/D-136)

Status: complete. Skills: backend-execution, dry-run-verify-fix. Area: `registry/charts.ts`, `engine/chart/**`, `params/index.ts` (pin saja); klaim prefiks IP-41c di `file_claims.md`.

## Klasifikasi 76 petunjuk `panelParamsMoved`

| Kelas | Jumlah | Isi |
|---|---|---|
| Tergambar, ParamDef BARU `chart.kind.<KODE>.<nama>` (P7X: `section:chart`, `advanced`) | 31 | P-02.valueLabel, P-03.seriesLabelsInPlot, P-04.axis, P-05.axis, P-05.pointRoles, P-06.axis, P-11.axis, H-01.trendColour, H-03.colTicks, H-04.labelEnds, H-05.axis, H-05.axesUnlabelled, K-01.totalLabels, K-01.totalsFromLabel, K-02.segmentValueLabels, K-03.sideLabels, K-05.centerLabel, K-06.sliceLabel, K-07.valueLabel, W-01.axis, W-02.valueLabel, W-03.step, W-03.axis, W-06.rankAxisInverted, W-08.axis, W-10.upColour, W-10.downColour, W-10.axis, G-02.schematic, G-02.regionFrame, G-03.schematic |
| Tergambar, ParamDef katalog LAMA + bentuk alternatif | 1 | K-04.groups (int 2 ATAU daftar 2 nama; `CHART_PARAM_ALT_FORMS`) |
| Rangkap dengan medan yang sudah tergambar (tanpa ParamDef) | 3 | P-11.thresholdStyle (= `style: "gallery"` panel), G-02.accentDot "sorot" (= `accent.point` spec), G-03.accentFlow [JKT, SBY] (= `accent.point` "JKT>SBY") — ParamDef aksen kedua melanggar pengurai aksen tunggal D-136 / S84 #1 |
| Catatan tak tergambar -> medan `x` (IP-41d/IP-41e) | 41 | `*Note`, `seriesNames`, `groupOrder`, `panelOrder`, `categoryOrder`, `fillOrder`, `groupValues`, `nodeLabels`, `titleNote`, S-05.periodOrder (string catatan; BENTROK dengan ParamDef bool lama `S-05.periodOrder` -> SCHEMA_INVALID bila dipindah ke params) |

## Berkas diubah

- `registry/charts.ts` — 31 baris ParamDef petunjuk (flag `hint`, sumber "petunjuk galeri ... IP-39/IP-41c, D-113"); default null = perilaku gaya (byte-identik), kecuali P-02/W-02 valueLabel true, W-03 step "post", W-06 rankAxisInverted true, G-0x schematic "KT-12 grid tile" (= perilaku lama). K-04.groups classNote. Pin `CHART_PARAMS_COUNT` 99 -> 130, baru `CHART_HINT_PARAMS_COUNT` 31 (katalog 87 + mesin 12 tetap).
- `params/index.ts` — pin `CATALOG_PARAM_COUNT` 685 -> 716 (total 743 -> 774) + komentar. `PARAM_SCOPE`/`PARAM_SURFACE` TIDAK diubah: dihitung per group P7X (slots.ts `groups.P7X = section:chart`, essentials.ts `groups.P7X = advanced`), jadi 31 kunci baru otomatis `section:chart` + `advanced`.
- `engine/chart/core/scale.ts` — `fixedDomain`, `axisDomain` (petunjuk axis: domain tetap, tick rapi di dalam; nilai di luar memperluas + REPORT AXIS_DOMAIN; zero memaksa 0).
- `engine/chart/core/read.ts` — pembaca tunggal baru `kindAxis`, `kindAxisXY`, `kindStrPair`, `kindNumMap`.
- `engine/chart/core/params.ts` — alt form `chart.kind.K-04.groups: list`.
- `core/prepare.ts`, `core/gallery.ts`, `core/datum.ts` (P-02/W-02 valueLabel, P-11 axis); `family-p1/{common,lollipop,dot-plot,dumbbell,grouped-column}.ts`; `family-h1/{scatter,heatmap,hexbin}.ts`; `family-k1/{stack,diverging,pie}.ts`; `family-k2/waffle.ts`; `family-w1/{frame,render}.ts`; `family-w2/{bump,barcode,candlestick}.ts`; `family-g/dot-flow.ts`.

## Bukti (segar, 2026-10-23)

- `npx tsc --noEmit -p tsconfig.json`: exit 2, 1 galat DI LUAR area: `src/lib/studio/services/submit/pipeline.ts(215,63)` TS2339 `source` pada `AnyNormSnapshot` (baris lain). Area 0.
- `npx eslint src/lib/studio/engine/chart src/lib/studio/registry/charts.ts src/lib/studio/params/index.ts`: exit 0.
- Hitung (tsx scratch `count.ts`): CATALOG_PARAMS 716 (pin 716); ALL_PARAMS 774 (pin 774); CHART_PARAMS 130 (pin 130); kunci unik 774, ID unik 774; petunjuk 31, lanjutan+section:chart 31; lapis internal 329 / advanced 354 (323 + 31) / derived 70 / essential 21; cakupan section:chart 170. K-04.groups advanced section:chart.
- Asap (tsx scratch `smoke.ts`, spec = fixture paritas S63 + panel ekstra = chart-smoke S73): "kode tergambar 58; render 116; OK 116; masalah 0" (deterministik). Panel galeri bm-fig-17..21 tanpa petunjuk: 58 panel + 5 komposit sha IDENTIK dengan garis dasar sebelum perubahan (diff kosong).
- Panel galeri dengan petunjuk sebagai params kunci penuh: 58/58 OK, 0 FAIL, 32 petunjuk ber-ParamDef (31 baru + K-04.groups); berubah disengaja: P-05 (peran ink200/ink900 + data-role), P-06, P-11, H-05, W-08, W-10 (domain/warna); sisanya byte-identik karena petunjuk = perilaku galeri yang sudah ada. Gaya datum dengan petunjuk 58/58 OK.
- P-11 sumbu 40..62: tanpa petunjuk tick 40..60 (60 di x=45.648); dengan petunjuk `<line x1="9.5022" y1="27.367" x2="45.648" ...>` = garis sumbu 40..62, tick `40 45 50 55 60` di x 9.5022/17.7172/25.9321/34.1471/42.362, garis batas 55 `x1="34.1471"`.
- Probe variasi non-bawaan (25 cek, semua "ya"): mis. P-03 false -> KUNCI, W-03 pre -> `V..H`, K-05 -> `68 %` + `pemerintah`, K-01 totalsFromLabel -> REPORT K-01.total, G-02 solid -> tanpa dasharray, H-01 trendColour -> stroke #B45309, W-10 up ink900 #101418 (bawaan ink700 #2B3640).

## Keputusan untuk dikukuhkan controller

1. 3 petunjuk rangkap TIDAK diberi ParamDef (thresholdStyle = style; accentDot/accentFlow = accent spec yang sudah tergambar; ParamDef aksen kedua menyalahi D-136). IP-41e: buang atau pindah ke `x`.
2. K-04 `groups` (nama) memakai ParamDef katalog lama + bentuk alternatif daftar (preseden P-09 bandLevels, S-01 bins), bukan kunci baru; IP-41e boleh memindah `groups` apa adanya ke `chart.kind.K-04.groups`.
3. S-05 `periodOrder` panel = catatan string; HARUS ke `x` (ParamDef lama bertipe bool -> SCHEMA_INVALID bila ke params).
4. Default null = "menurut gaya" untuk petunjuk yang perilakunya berbeda antar-gaya (P-03, H-05.axesUnlabelled, K-01.totalLabels, K-02, W-10 warna, G-02.regionFrame); bila diset berlaku di kedua gaya.
5. `axis` di luar data memperluas domain + REPORT AXIS_DOMAIN (tidak menolak, sejalan D-58); `chart.zeroBaseline`/`zeroBaseline` kode tetap memaksa 0 (CH-01).

## Permintaan / temuan (luar area, tidak disentuh)

- `tests/unit/studio/figures/chart-smoke.test.ts:33-36` mengunci 99 / 87+12=99 -> perlu 130 (87 + 12 + 31) oleh baris uji (SR-42/fase uji). Suite tidak dijalankan (D-133).
- Komentar `registry/essentials.ts:165` "99 bawaan tampilan per jenis chart" -> 130 (pemilik essentials).
- Skrip hitung SR-05 (lapis advanced 323) kini 354.
- Tidak ada DB, HKCU, port yang disentuh.
