# S23 coder-execution: engine/html/tables

Status: complete (penjaga lulus). Skills: backend-execution, dry-run-verify-fix.

Berkas (9, semua di `src/lib/studio/engine/html/tables/`): `index.ts` (ganti stub), `table.ts`, `figure.ts`, `derivation.ts`, `apparatus.ts`, `svg.ts`, `inline.ts`, `style.ts`, `escape.ts` (1584 baris).

Isi: `htmlTables` 16 kunci (11 TableBlock + chart, diagram, image, symbolSheet, derivation), tanda tangan I12 tetap. Ekspor tambahan: `tableHtml`, `renderTableBlock`, `renderFigureBlock`, `renderDerivationBlock`, `sanitizeSvg`, `SVG_DROPPED_ELEMENTS`, `rasterDataUri`, `base64DataUri`, `sniffRasterMime`, `toBase64`, `captionHtml`, `sourceInner`, `sourceParagraphHtml`, `provenanceHtml`, `MAX_NESTED_DEPTH`.

Penjaga (2026-10-23):
- `npx tsc --noEmit -p tsconfig.json | grep src/lib/studio/engine/html/tables` -> 0 baris (grep exit 1). Total repo 22 galat di luar area: 21 pra-ada (S03 marker) + 1 `src/lib/studio/services/render/job.ts` (milik S51, tidak disentuh).
- `npx eslint src/lib/studio/engine/html/tables` -> exit 0, tanpa keluaran.
- Smoke `npx tsx <scratch>/s23_smoke.ts`: 23/23 cek benar (thead berulang, zebra >12 baris, tanpa garis tegak, rowspan/colspan, tabel bersarang, baris SUMBER+PROVENANS, escape, SVG berteks nyata, prefiks id, mm, data-figure/data-address, data URI, placeholder tercatat, derivation monoLines + nestedTable, cacat aritmetika -> BY_CONSTRUCTION_FAILED, deterministik).

Keputusan (perlu dicatat controller):
1. CSS INLINE per elemen (bukan kelas bergantung lembar gaya S21/S24); kelas `st-*` hanya penanda. S24 tidak perlu menyisipkan CSS tambahan untuk modul ini.
2. Kunci FigureStore dicoba berurutan: blockId, label artefak, alamat, artifactId spec, kunci aset. Tidak ada entri -> placeholder berlabel + log `ARTIFACT_NOT_FOUND` (warn), tidak melempar. Chart/diagram TIDAK dirender ulang di modul ini (produsen mengisi FigureStore, S51).
3. Sanitizer SVG (string, tanpa DOM): buang `script`, `style` (CSS SVG inline tidak berlingkup, bocor ke halaman), `foreignObject`, animasi (`set`/`animate*`), iframe/object/embed/media; atribut `on*`, `src`, href non-`#`/non-data-raster, `url()` eksternal, nilai `javascript:`; DOCTYPE/ENTITY/komentar/PI dibuang; id diberi prefiks `fig-<blockId>-` (cegah tabrakan antar-SVG).
4. Derivation: `buildDerivationBlock` (S12) dijalankan ulang; cacat -> log error + lempar `StudioEngineError("BY_CONSTRUCTION_FAILED")` (bukan render diam).
5. Label `SUMBER`/`KUNCI` ditambahkan hanya bila teks belum diawali kata itu; bahasa EN -> Source/Provenance/Key/Derivation.
6. Deviasi HTML-only: padding kanan sel 2,5 mm bila margin sel R-17 = 0 (pola RL `.tbl`; DOCX tetap 0); padding vertikal default 1,5 mm (kepala 1,6, pita 3,2/1).
7. Caps = `text-transform:uppercase` (sesuai D-46). `escapeHtml`/`attr` dari `../blocks/escape` (D-46); tidak mengimpor indeks blocks.

Permintaan lintas pemilik: tidak ada.
Temuan: galat tsc baru di `services/render/job.ts` (milik S51), di luar area S23.
