# INT-O coder-execution: IP-32 (lint/render) + IP-33 (soffice)

Status: complete (2026-10-23). Skills: backend-execution, dry-run-verify-fix. Klaim: `file_claims.md` prefiks INT-O.

## IP-32 `renderLintLimitsFromParams` (engine/lint/render/index.ts)
- Akar: `vals.reduce(Math.min)` meneruskan (acc, cur, index, array) -> NaN bila >= 2 kunci terisi (`[5,5].reduce(Math.min)` = NaN, dicek node).
- Perbaikan: `reduce((a, b) => stricter(a, b))`; nilai sah = angka atau teks desimal, finit, > 0 (`positiveNumber`); tidak ada/bukan angka -> `base` lalu default katalog; `measureChars` divalidasi sama. Hasil selalu finit.
- Bukti (`npx tsx` scratch): kanonik `{page 5, fig 5, measure [66,80], minPt 5.5, maxH 247}`; benchmark manual000 sama; parameter rusak -> default (teks "6.5" diterima); kunci ganda -> lebih ketat (fig 4, minPt 6, maxH 200). SVG 6 warna / teks 4 pt / 260 mm dgn batas kanonik: DATUM-25 FAIL 6 > 5, DATUM-28 FAIL 4.00 pt, DATUM-33 FAIL 260.0 > 247.

## IP-33 soffice path aman Windows
- Baru `soffice/paths.ts`: ambang profil 160 karakter (subpath profil LO ~95 -> < 260), berkas I/O 240. Workspace dipakai bila muat; selain itu `mkdtemp(os.tmpdir()/gso-)` dgn nama `d.docx`/`d.pdf` (PDF dibaca balik sebagai byte); tak muat juga -> `PathTooLongError` sebelum spawn.
- `service.ts`: pakai layout; `PathTooLongError` -> `PDF_CONVERT_FAILED` (`details.reason = PATH_TOO_LONG` + panjang path), log error; warn `SOFFICE_SHORT_WORKDIR`; `finally` menghapus dir pendek + dir job.
- `readiness.ts`: probe `--version` memakai aturan sama (tak muat -> error kesiapan, tidak melempar).
- Bukti (`npx tsx`, DOCX `assets/base/default.docx`, timeout 60 s): akar normal 44 char -> PDF 1433 B `%PDF-` 3736 ms; akar 250 char -> `SOFFICE_SHORT_WORKDIR` + PDF 1433 B 3925 ms (sebelumnya INT-A: gantung 180 s RENDER_TIMEOUT); akar 250 + TEMP 291 char -> `PDF_CONVERT_FAILED` 3 ms tanpa soffice. Sisa `tmp/` workspace dan `gso-*` = 0; direktori uji dihapus.

## Penjaga
- `npx tsc --noEmit -p tsconfig.json | grep -E "src/lib/studio/engine/(lint/render|soffice)"` -> kosong (exit 1); total repo 2 galat, di luar area.
- `npx eslint src/lib/studio/engine/lint/render src/lib/studio/engine/soffice` -> exit 0.

## Untuk controller
- INT-A dapat menghapus `repairLimits`/`LINT_LIMITS_REPAIRED` di `services/render/lint.ts` (tidak disentuh; kini tak pernah terpicu). Baris file_requests INT-A->S45 (baris 84) terpenuhi.
- Keputusan: ambang 160/240 (lebih ketat dari contoh 200 karena subpath profil LO); kode gagal cepat `PDF_CONVERT_FAILED` (bukan kode baru, kontrak tak diubah).
