# INT-A coder-execution: IP-01 + IP-04 (services/render, services/storage)

Status: complete (2026-10-23). Skills: backend-execution, dry-run-verify-fix, diagnosing-bugs. Klaim: `file_claims.md` prefiks INT-A.

## IP-01 (F-032) akar + perbaikan
- Akar: `storage/files.ts` `checkInput` memakai regex `^[a-z0-9.+-]+/[a-z0-9.+-]+$` (tanpa parameter), sedangkan render `FORMAT_MIME.HTML` = `text/html; charset=utf-8` -> TypeError "writeOutput: invalid mime" -> `handOff` memetakan ke `FILE_MISSING_ON_DISK` -> job PARTIAL. DOCX/PDF/SVG/PNG lolos (tanpa parameter).
- Loop merah-hijau: `mime_loop.ts` (tsx, 1,3 s) -> sebelum `LOOP RED (1)` HTML "writeOutput: invalid mime"; sesudah `LOOP GREEN` 5/5.
- Perbaikan: `mimeBase()` (RFC 9110 media type + parameter token/quoted, maks 255, tanpa CR/LF) + `OUTPUT_MIME_BASE` per format: tipe dasar wajib cocok format (MIME tetap disimpan apa adanya -> Content-Type R10 membawa charset). 12/12 kasus mime.

## IP-04 (render)
- (a) fallback generik: `RENDER_FAILED` (job, figur, DOCX, PNG, gambar, chart/diagram), `STORAGE_WRITE_FAILED` (hand-off, direktori, nama berkas), `HTML_RENDER_FAILED` bila `HtmlAssembleError` (`htmlErrorCodeOf`).
- (b) `lintRenderedWith(i, renderLintLimitsFor(log, tpl.params))` di `lintAfterRender` + `lintArtifact` (params chart/HTML). Penjaga `repairLimits`: hasil NaN S45 dihitung ulang (lihat temuan 1).
- (c) `templateForDoc` = `applyDocOverrides` (S48) atas templat terpin (revisi, HTML artefak sumber dokumen/inline); isu override -> warn `DOC_OVERRIDES_INVALID`.
- (d) artefak IMAGE: `loadImage` -> `readImageAsset` S53 (aset tersimpan) / `decodeImage` (base64); `readFile`+`resolveSafe` lokal dihapus.
- (e) `ctx.assetBytes` dipramuat (`preloadAssetBytes`: dataBase64 dicek sha256, aset tersimpan lewat `readImageAsset`; gagal = warn `ASSET_PRELOAD_FAILED`).

## Bukti
- tsc: `grep -E "src/lib/studio/services/(render|storage)"` kosong; `src/lib/studio/**` 0 sebelum/sesudah; total repo 21 -> 25: +4 baru di `src/app/api/studio/validate/route.ts` (151,179: `tag`, `NextResponse`) = baris lain yang sedang menyunting, bukan area ini. eslint render+storage exit 0.
- Asap nyata DB `gsp_agent_hq_v21`, akar sandbox `%TEMP%\inta_ws`: ingest SAMPLE_DOCUMENT (991/GSP/KT/X/2026, NOTA, override `org.shortName=GSPXA`) -> `renderRevision` DOCX+PDF+HTML: job `cmvjuzruj000hv1awc7jslw0o` SUCCEEDED 6,5 s, 0 galat; DOCX sha256 `cfdc957f…ba1ba` (1169682 B, footer memuat GSPXA), PDF `da0e4982…6f82` (111569 B, %PDF-1.7), HTML `4cd396dc…a017f` (2562087 B, mime `text/html; charset=utf-8`); sha disk = DB. Log memuat `DOC_OVERRIDES_APPLIED`, `LINT_LIMITS_REPAIRED`.
- Dihapus: dokumen `cmvjuzrtf0001v1awe5pc19yb`, revisi `cmvjuzrtj0003v1aw285s18f8`, job `cmvjuzruj000hv1awc7jslw0o`, berkas `cmvjuzwue000jv1awvr1pok2u`, `cmvjuzwuk000lv1awfcrtd71s`, `cmvjuzwuu000nv1awjgvwitwj` (+12 StudioBlock). Run sebelumnya juga dihapus (doc `cmvjuxdw10001v12cqe2j0lxp`, `cmvjuswcr0001v1ik43w9nkn1` beserta revisi/job/berkas). Cek sisa: docs 0, jobs 0, files 0. Sandbox dihapus.

## Temuan / permintaan
1. S45 (file_requests): `renderLintLimitsFromParams` `reduce(Math.min)` -> NaN untuk 3 batas templat kanonik (cek 25/28/33 tak pernah FAIL bila dipakai mentah). Diatasi lokal, tidak blocking.
2. S92 (INFO/MINOR): akar `STUDIO_WORKSPACE_ROOT` panjang (~250 karakter) -> profil soffice `<root>/tmp/<jobId>/lo-profile` lewat MAX_PATH -> soffice menggantung sampai RENDER_TIMEOUT 180 s (job PARTIAL); akar pendek 5,8 s. Usul: cek panjang path / fail-fast.
3. Renderer S18/S19/S24 belum membaca `ctx.assetBytes` (masih baca sinkron sendiri; HTML hanya dataBase64) — kini tersedia dari S51.
4. INFO: lint NOTA sampel `NOT_RUN`; aset `rule128` tidak ada di templat kanonik (warn renderer DOCX).
