# IP-39a coder-execution — mesin chart (loop perbaikan siklus 1)

Status: needs-review (DIHENTIKAN atas instruksi controller/user: tahan pengujian, rampungkan perubahan berjalan). Skills: backend-execution, receiving-code-review, dry-run-verify-fix.

## Selesai (kode konsisten)
- S84 #1: satu pengurai aksen `resolveAccent`/`accentOf` di `core/params.ts`; prioritas medan `accent` > `accent.*` > alias (tingkat tertinggi menang utuh, kunci kalah -> REPORT PARAM_ALIAS, nilai buruk -> PARAM_IGNORED / ACCENT_HINT); alias dibuang dari params. 12 pengurai lokal (core/prepare, g, h1, h2, k1, k2, p1, p2, s1, s2, w1, w2) kini hanya membaca `accentOf`. H2 `accentRefsOf` memakai satu medan (point > group > series) -> probe H-07 medan+alias = 1 subjek.
- S84 #8: API baca tunggal `core/read.ts` (chartParam, explicitParam D-77, read*/kind*/hint*, invalidParam, asRange); palette paramBool/Num/Enum/Str = alias read.ts (strict); 11 keluarga mendelegasikan. Satu `linspace` + `kde` (`core/numeric.ts`, n = 1 -> [a]), satu `requireDistribution` (`core/guards.ts`), satu `midBaseline` (`core/svg.ts`). Kode mati #12 dihapus (kindParamNames, W1_PARAM_NAMES, accentHintLabel, ignoredParamKeys, coreCodeOf, MEASURE_TOL_MM, P2_CODES, S1_CODES, ACCENT_ALIAS_KEYS).
- S84 #4: `escText`/`escAttr` membuang karakter tak sah XML 1.0; #3 (bonus, berkas sama): `comment()` tanpa `--` tersisa.
- S84 #5: `SvgDoc(minFontPt)` + `fontPt()`; 18 titik konstruksi memberi `chart.minFontPt` -> semua teks chart menghormati lantai.

## Bukti
- Akhir: `npx tsc --noEmit -p tsconfig.json` exit 0 (seluruh repo); `npx eslint src/lib/studio/engine/chart src/lib/studio/registry/charts.ts src/lib/studio/contract/schema/chart.schema.ts src/lib/studio/engine/lint/render` exit 0.
- Sebelum instruksi berhenti (asap scratchpad, 167 render x 2 templat): SVG templat bawaan identik byte dengan garis dasar untuk 58 kode x 2 gaya + 5 komposit; `chart.minFontPt=6.5`: DATUM-28 125 -> 0. vitest figures (setelah #1/#8, sebelum #4/#5): 355/362; 7 gagal = 1 disengaja (permintaan file_requests IP-39a), 1 fixture K-08 FIX-3, 5 diagram IP-39b.

## Sisa (belum dimulai, dihentikan)
S79 E1/E2 ukuran fon dasar P-10/K-07; E3 peran warna P-10/K-07/K-09/H-07; E4 label Gantt W-07 di grup sumbu; E6 level kontur H-06 (analisis selesai: acuan = MaxNLocator(9, steps [1,1.5,2,2.5,3,4,5,6,8,10]) -> -84..-42 langkah 6); L1 parser busur lint DATUM-32 H-08; IP-39 ParamDef petunjuk tergambar + pemindahan panelParamsMoved; IP-40 medan `x`; uji paritas sebelum/sesudah (garis dasar "before" ada di tests/parity/out/ip39a/before: DIAGNOSIS 8, FAIL 37, NODE_ERROR 1); determinisme 2 run; validate_figures.
