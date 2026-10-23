# S24 coder-execution: perakit HTML (engine/html/assemble, I13)

Status: complete (2026-10-23), dengan catatan: uji ujung-ke-ujung `assembleHtml` menunggu S21 (`htmlShell`/`fontFaceCss` masih stub saat smoke). Skills: backend-execution, dry-run-verify-fix.

Berkas (4): `src/lib/studio/engine/html/assemble/{index.ts, classes.ts, faces.ts, standalone.ts}`.

Isi: tanda tangan kontrak `assembleHtml(ctx, { preview })` tetap. Tambahan: `assembleBody`, `HtmlAssembleError` (reason RENDERER_MISSING/RENDERER_FAILED/SHELL_FAILED), `collectFaces`/`faceForRole`, `enforceStandalone`/`injectHead`/`isAllowedUrl`, `STUDIO_HTML_CSP(_META)`, kelas gabungan `HTML_CLASSES` (S22 `HTML_BLOCK_CLASSES` + kelas perakit), `STUDIO_HTML_STRUCTURAL_CSS` (S22 `HTML_BLOCKS_CSS` + CSS perakit).

Alur: blok per unit (urutan `snapshot.units`, lalu `ordinal`, pemutus seri `blockId`) -> `HTML_RENDERERS` (D01) -> `<section class="st-unit" data-unit data-unit-key data-header data-footer>`; blok beralamat tanpa `data-address` dibungkus `.st-block` (D-38) -> wajah dari HTML badan -> `fontFaceCss` + `htmlShell` (S21) -> `<meta charset>` + CSP + CSS struktural di awal `<head>` -> `enforceStandalone` (jaring terakhir, pelanggaran ke `ctx.log` level error).

CSP: `default-src 'none'; script-src 'none'; script-src-attr 'none'; object-src/base-uri/form-action/frame-src/child-src/worker-src/connect-src/manifest-src/media-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'`.

Smoke (tsx, scratchpad `s24_smoke.ts`): HTML jahat -> 10 pelanggaran (script, iframe, link, @import, url() eksternal, onload, img http, javascript:, xlink:href http, meta refresh) dinetralkan; prosa ber-escape tidak berubah; HTML bersih identik byte, 0 pelanggaran; `injectHead` menaruh charset+CSP pertama dan membuang charset ganda; `collectFaces` = 6 wajah terurut; `assembleBody` pratinjau: renderer S22 `paragraph` nyata, tipe tak dikenal -> pengganti `.st-missing` ber-alamat, blok unit tak dikenal -> section orphan + warn; mode artefak -> `HtmlAssembleError RENDERER_MISSING 1.1.2`; `assembleHtml` -> `SHELL_FAILED` karena S21 stub (diharapkan).

Penjaga: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/engine/html/assemble"` -> kosong (exit 1). `npx eslint src/lib/studio/engine/html/assemble` -> exit 0.

Keputusan (untuk dicatat controller):
1. Unit alir TIDAK diberi `.page`: `.page` (D-38) = lembar tetap A4; bab multi-halaman akan terbaca luapan/hitungan halaman salah oleh S25. Pemenggalan antar unit lewat CSS `break-before:page`. Lembar tetap (cover dsb.) bila perlu dipancarkan S21/S22.
2. Mode pratinjau toleran (pengganti + log warn/error); mode artefak gagal keras (log error + `HtmlAssembleError`), artefak rilis tidak kehilangan isi diam-diam.
3. CSS struktural disisipkan sebelum CSS S21 agar token S21 menang saat konflik; `previewLabel` = `opts.preview`.
4. Wajah dasar serif+condensed selalu ditanam; lainnya dari kelas `st-face-*` dan `font-family` eksplisit (termasuk SVG).

Ketergantungan lokal (bukan kontrak): `../blocks/classes` dan `../blocks/escape` (S22, dinyatakan S22 untuk dipakai modul lain). Bila S22 mengganti nama/memindahkan, impor S24 harus disesuaikan.

Permintaan (tidak blocking, belum ditulis ke file_requests): S21 sebaiknya memakai data: URI `font/ttf` atau `application/font-sfnt` (diizinkan CSP dan penjaga) dan dapat membaca `data-header`/`data-footer` pada `.st-unit` untuk kepala berjalan per unit. Kode kontrak untuk galat render HTML (mis. `HTML_RENDER_FAILED`) bisa ditambahkan di delta S03-d1; kini `HtmlAssembleError` lokal.
