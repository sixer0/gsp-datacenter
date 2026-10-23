# RQ-8 coder-execution: kenop judul/catatan TOC + kelas lebar image/symbolSheet (sisa SR-32, D-216)

Status: complete (2026-10-23). Skills: backend-execution, dry-run-verify-fix.

## Berkas
- `src/lib/studio/params/render.ts`: R-59 `render.toc.title`, R-60 `render.toc.note` (string, null; B); R-61 `image.widthClass`, R-62 `symbolSheet.widthClass` (enum text|full, bawaan text; B); R-63 `image.widthMm`, R-64 `symbolSheet.widthMm` (mm, null, T, `derive: figureWidthFromClass`; target dibaca registri `deriveTargets`, grid.ts tidak diubah). `PARAMS_RENDER_COUNT` 37 -> 43.
- `src/lib/studio/params/index.ts`: HANYA pin `RENDER_PARAM_COUNT` 37 -> 43 (total 774 -> 780).
- `src/lib/studio/registry/essentials.ts`: HANYA `PARAM_SURFACE_LISTS` (R-59..R-62 advanced, R-63/R-64 derived). Tanpa kenop esensial baru (lihat Keputusan 1).
- `src/lib/studio/services/compose/front.ts`: `tocSpec(payload, ctx, params?)` mengisi `TocSpec.title`/`note` dari kenop (string tak kosong; null = bawaan templat: tanpa judul, kicker mesin).
- `services/compose/snapshot.ts`: panggilan `tocSpec(..., paramsOf(k))`.
- `services/compose/blocks.ts`: `figureWidthMm` image -> `image.widthMm`, symbolSheet -> `symbolSheet.widthMm` (cadangan grid.textColumnMm tetap).
- `services/compose/context.ts`: `COMPOSE_PARAM_KEYS` + 4 kunci (rekonstruksi SC-5 membawa nilai yang dibaca compose).
- `benchmark/manual000/datum-manual-000.preset.json` (3cefdc83… -> d181efb1…): + `render.toc.title` "Peta Isi Manual", `render.toc.note` (teks BM), `image.widthClass` full, `symbolSheet.widthClass` full; `meta.intendedDelta` + 6 entri berbukti BM.

Sumber teks BM: `benchmark/manual000/doc.verbatim.json:2960` ("Peta Isi Manual") dan `:3712` (catatan "Nomor halaman dicetak dari render PDF terbitan ini. ..."), dibaca dari `front.toc` lewat skrip, tidak diketik ulang.

## Bukti
- Render v2 `render_cli.ts --doc doc.v2.json --template template.v2.json --formats docx` -> SUCCEEDED, DOCX 4a06d9c6…; v1 (`doc.json` + `template.json`) -> 53485ebc1eddd145… (tetap = SR-16).
- `units_v2.py v1 v2 --bm BM.docx`: `units a=4544 b=4544 bm=4544 aEqualsB=True aEqualsBm=True bEqualsBm=True`; grid 153 = 153 = BM; run simbol 104 = 104 = BM; hunk 0.
- wp:extent v2 (52 figur, urutan indeks figur): bm-fig-27..40 semua 166,00 mm (raster 28/32-37/39 + lembar simbol 27/29/30/31 = BM). Beda dari BM tersisa 2: bm-fig-11 (raster BM 128, v2 166) dan bm-fig-25 (diagram BM 100, v2 166).
- `verify_v2.ts`: 6/6 PASS; G4 diffKeys = intendedDelta (10 kunci), proyeksi 750 kunci lain 1632e00a… kedua sisi.
- `tsc --noEmit --incremental false` seluruh repo exit 0; eslint area exit 0.
- vitest `tests/unit/studio`: 123 gagal / 1008 lulus, himpunan gagal IDENTIK dengan tanpa RQ-8 (dibalik sementara lalu dipulihkan; `diff` kosong) -> bukan regresi baris ini.
- Registri: 780 = pin, 0 lapis tak terpetakan, 0 id/kunci ganda.

## Keputusan untuk controller
1. Judul TOC TIDAK dijadikan kenop esensial: `convert_v2.ts` mengisi `essentials` slot dari semua kenop esensial slot, jadi template.v2.json (bukan berkas baris ini) akan berubah. Kenop esensial "Judul daftar isi" (toc 2 -> 3, total 30 -> 31) bisa ditambah kemudian.
2. Aturan lebar: kelas per jenis figur di templat, tanpa pengecualian per figur (D-139: medan tampilan tidak masuk konten; ImageV2 tidak punya `preset`). Manual 000 = full (22/24 figur image BM = 166). Sisa: bm-fig-11 128 (raster) dan bm-fig-25 100 (diagram; jalur diagram setelah RQ-9).
3. Brief menyebut "6 raster"; BM mencatat 9 raster (8 x 166 + bm-fig-11 x 128, `figures/index.json`).
4. essentials.ts disentuh hanya untuk pemetaan lapis (tanpanya lapis kunci baru `undefined` = "unmapped").

## Permintaan (file_requests.md, 3 baris RQ-8)
convert_v2.ts tambahan preset + INTENDED_DELTA (blocking regenerasi; `--check` kini DIFF preset); norm.ts `NORM_COMPOSE_PARAM_KEYS` + 4 kunci; slots.ts cakupan image/symbolSheet (kini document).
