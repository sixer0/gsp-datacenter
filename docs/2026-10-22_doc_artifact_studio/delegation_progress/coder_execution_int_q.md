# INT-Q coder-execution: IP-34 (F-046) + IP-36 + F-043

Status: complete (2026-10-23). Skills: backend-execution, dry-run-verify-fix. Klaim: `file_claims.md` prefiks INT-Q.

Berkas: baru `engine/docx/figures/asset-bytes.ts` (isomorfik, tanpa `node:*`); ubah `engine/docx/figures/{media,figure,index}.ts`, `engine/docx/wrapper/media.ts`, `engine/html/blocks/device.ts`, `engine/html/tables/figure.ts`, `services/render/lint.ts`. `services/render/figures.ts` tidak perlu diubah (tidak membaca aset).

## IP-34 sumber byte aset tunggal
- `docAssetBytes(ctx, key)`: `ctx.assetBytes(ref.sha256, key)` -> cadangan `dataBase64` (base64 asli dikembalikan untuk HTML) -> pemanggil lanjut jalur lamanya (path akar aset, templat, sha/manifest, FigureStore). Galat `assetBytes` = warn `ASSET_BYTES_LOOKUP_FAILED` + cadangan. dataBase64 kosong = tidak ada (sama perilaku lama); dataBase64 rusak: figur DOCX `ASSET_TYPE_UNSUPPORTED`, pembungkus `BY_CONSTRUCTION_FAILED`, HTML seperti lama.
- Dipakai: `resolveRasterAsset` (figur), `loadAsset` (pembungkus: logo, Datum Rule, gambar), `assetDataUri` (HTML perangkat), figur `image` HTML.

## IP-36
- `repairLimits`/`STRICTER`/`LINT_LIMITS_REPAIRED` dihapus; `renderLintLimitsFor` = `renderLintLimitsFromParams` dalam try (cadangan `LINT_LIMITS_DEFAULTED` tetap). Batas kanonik = benchmark = {5,5,[66,80],5.5,247}, parameter rusak -> default, 0 warn.

## F-043 DATUM-39
- `rasterDpiShortfall(px, mm, minDpi)`: lolos bila dpi efektif >= 99 % (297 dpi) ATAU kekurangan px <= 1 px CSS (minDpi/96) + 1 px pembulatan. Raster Node nyata: 24 mm 281 px (297,4), 128 mm 1509 (299,4), 166 mm 1959 (299,8) -> 0 DATUM-39; PNG 753 px pada 128 mm (149,4 dpi) -> 1 DATUM-39; 10 mm 115 px (292,1, dulu warn) -> lolos; 24 mm 274 px (290) -> warn; image 504 px/128 mm (100 dpi, min 150) -> warn.

## Bukti
- Benchmark render_cli + `benchmark/manual000/template.json` (docx,html): sebelum DOCX `f697804e…6d41` HTML `54095e22…56e9`; sesudah identik (= INT-B / INT-M). Lint report identik (FAIL, 160 cek), kode log mesin identik.
- Ekuivalensi assetBytes (fixture serah_handover): A dataBase64 vs B tanpa dataBase64 + assetBytes -> DOCX `2d55e9fc…`, HTML `a0376e8e…` sama; assetBytes melempar -> cadangan, DOCX sama, 1 warn; tanpa sumber -> DOCX FILE_NOT_FOUND, HTML RENDER_ASSET_MISSING.
- 4 fixture doc kanonik (memo, tables, serah_handover, terbit_report) SUCCEEDED.
- `npx tsc --noEmit -p tsconfig.json | grep -E "src/lib/studio/(engine/(docx|html)|services/render)"` kosong (exit 1); repo 2 galat di `src/app/api/user-access/*` (bukan area). `npx eslint <area>` exit 0.

## Permintaan (file_requests.md)
- `engine/docx/blocks/media.ts` `loadImageAsset` masih membaca dataBase64 langsung -> pakai `docAssetBytes` (tidak blocking).
- Usul memindahkan `asset-bytes.ts` ke lokasi netral (engine/bind atau modul aset bersama): HTML kini mengimpor dari `engine/docx/figures/asset-bytes`.
Review direkomendasikan: `engine/docx/figures`, `engine/docx/wrapper/media.ts`, `engine/html/{blocks/device,tables/figure}.ts`.
