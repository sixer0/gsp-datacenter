# S22 coder-execution: engine/html/blocks (I11)

Status: complete. Tanggal 2026-10-23. Skills: backend-execution, dry-run-verify-fix. Klaim di file_claims.md (`S22 src/lib/studio/engine/html/blocks/**`).

Berkas (9, 1629 baris): `index.ts` (htmlBlocks 15 kunci: chapter, section, paragraph, list, aside, monoBlock, assumptionInline, spacer, device, cover, controlSheet, toc, partDivider, signatureBlock, appendix; escapeHtml; tanda tangan I11 tetap), `escape.ts`, `classes.ts`, `style.ts`, `inline.ts`, `common.ts`, `device.ts`, `text.ts`, `wrapper.ts`.

Penjaga:
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/engine/html/blocks"` -> kosong (exit 1); total repo 21 galat, semuanya pra-ada (sama dengan marker S03).
- `npx eslint src/lib/studio/engine/html/blocks` -> exit 0, tanpa keluaran.
- `grep -rnE "eval\(|new Function|<script|innerHTML"` -> kosong pada kode (text-transform kini sah per D-46).
- Smoke ad hoc (tsx, bukan suite): 22 kasus termasuk muatan XSS di teks, atribut, face, color; semua ter-escape, face/warna tak sah dibuang, `data-address` ada pada setiap blok beralamat dan butir (`C.S.P/n`, `F:cover/n`); isi rusak -> "" + ctx.log error.

Keputusan (dicatat controller):
1. Kelas CSS LOKAL `HTML_BLOCK_CLASSES` (prefiks `st-`) + `HTML_BLOCKS_CSS` (CSS struktural: pre-wrap, caps, smallCaps, tab, rel grid) karena kontrak tidak punya nama kelas. S24 menyatukan dengan S21 dan menyisipkan `HTML_BLOCKS_CSS`.
2. (D-46) caps -> `.st-caps{text-transform:uppercase}` (presentasi, teks DOM tidak berubah); smallCaps -> `.st-smallcaps{font-variant-caps:small-caps}`, dibaca defensif karena `RunProps` kontrak belum punya `smallCaps`.
3. Format: inline style dari `roleFormats[role]` + format eksplisit blok (urutan §5.6); `data-role` = RoleKey; faceRole -> kelas `st-face-*` (S21 memetakan ke wajah).
4. md-lite meniru HS INLINE_RE; URL/DOI tampil sebagai teks bergaya tautan, BUKAN `<a href>` (larangan rujukan eksternal); tanda baca buntut URL dipertahankan sebagai teks (HS membuangnya).
5. Asumsi `NormBlock.content`: blok = objek blok; chapter/appendix/section = kepala saja (seksi/blok NormBlock terpisah); cover/controlSheet = FrontPage termasuk body[] explicit; toc = TocSpec; partDivider = PartSpec. Bila S48/S24 memecah body[] depan menjadi NormBlock terpisah, body harus dibuang dari content agar tidak dobel.
6. Unsur body[] keluarga tabel/figur/derivation diserahkan ke `htmlTables` (S23, impor `../tables`); bila belum ada: tabel fallback minimum + log warn `RENDER_FALLBACK_TABLE`.
7. Datum Rule = SVG inline dari P4S-02/03/04; logo hanya `data:` URI (aset dokumen base64 > FigureStore > aset templat via `process.getBuiltinModule("node:fs")`), MIME dicek byte ajaib PNG/JPEG.
8. Default teks pembungkus: kicker `chapter.kicker.pattern` / "LAMPIRAN X", judul blok lembar kendali "A. RIWAYAT REVISI".."D. DISTRIBUSI", "DAFTAR ISI" (EN padanan) - perlu dicocokkan dengan S18.
9. Kode log baru (bukan StudioErrorCode): RENDER_BLOCK_INVALID, RENDER_ASSET_MISSING, RENDER_ASSET_UNREADABLE, RENDER_FALLBACK_TABLE, RENDER_RENDERER_MISSING.

Permintaan lintas pemilik (tidak blocking): S23 sebaiknya mengimpor `../blocks/escape` (bukan `../blocks`) agar tidak ada siklus blocks <-> tables. S24: pembungkus `.page/.body/.reg` (S25) milik perakit; S22 tidak memancarkannya.
Temuan: tidak ada. Review direkomendasikan (S83, lingkup html/blocks).
Siaran D-45: S24 mengimpor `blocks/classes` dan `blocks/escape`; nama dan ekspor dipertahankan, hanya ditambah `smallCaps`. Pembungkus S22 tidak lagi memakai `st-unit`/`data-unit` (milik unit S24; mencegah unit bersarang dan pemenggalan ganda) - diganti `data-wrapper`/`data-head`. `data-address` blok tetap satu kali di elemen terluar (S24 `withAddress` mendeteksinya, tidak membungkus ulang); sub-alamat butir (`C.S.P/n`, `F:x/n`) bernilai berbeda.
Penjaga ulang setelah D-45/D-46: tsc grep html/(blocks|assemble) kosong; eslint exit 0. Total repo 22: tambahan 1 di luar area, `src/lib/studio/services/render/job.ts(208,54)` TS2352 (S51), tidak disentuh.
