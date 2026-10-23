# INT-W coder-execution: penutup IP-38 (D-110), 2026-10-23

Status: complete. Skills: backend-execution, dry-run-verify-fix. Klaim: `file_claims.md` prefiks INT-W.

Berkas: `engine/docx/package/xml.ts` (tambahan aditif saja), `engine/docx/blocks/xml.ts`, `engine/docx/wrapper/xml.ts`, `engine/docx/blocks/props.ts`. Pemakai `blocks/xml.ts` tidak perlu diubah (nama ekspor lama tetap via re-ekspor).

## Tambahan `package/xml.ts` (API lama dan keluarannya tetap)
- Escape: `stripInvalidXmlChars` + `escapeXmlStrict` (aturan ketat S16: buang surrogate tunggal, `'` -> `&apos;`); `escapeXml` paket tidak berubah (berbagi `escapeEntities`). `int`, `el` (aturan ketat, bilangan dibulatkan).
- `onOff` diekspor. `XmlFlavor` medan opsional: `rFontsOrder`, `capsOffExplicit`, `lineRuleNoDefault`, `emptySpacingWhenLineRule`, `roundParaNumbers`, `paraBordersInside`; konstanta baru `BLOCK_FLAVOR` (PACKAGE/BODY tidak berubah).
- `rPrInnerXml(props, face, lang, flavor)` (rPrXml kini memanggilnya); `pPrInner(..., extras?: { framePr })` disisip setelah pageBreakBefore.
- `textXml(t, TextOptions)` + `WRAPPER_TEXT` (TAB -> preserve) / `STRICT_TEXT`; `paragraphFromInnerXml(inner, content, {compactEmpty})`.
- `SimpleCell.vMerge`, `SimpleRow`, `simpleTableRowsXml(grid, rows, {indentTw, widthFromRoundedCols})`; `simpleTableXml` mendelegasikan ke sana.

## Pengikat tipis
- `blocks/xml.ts`: tanpa escape sendiri; re-ekspor `el`, `escapeXmlStrict as escapeXml`, `int`, `stripInvalidXmlChars`; `textEl`/`paragraph` = satu baris ke paket.
- `wrapper/xml.ts`: `paragraphXml`/`runXml`/`tableXml` = opsi paket; `WCell = SimpleCell`, `WRow = SimpleRow`; `tcXml` re-ekspor paket.
- `blocks/props.ts`: `rPrInner` = `faceOf` + `rPrInnerXml(BLOCK_FLAVOR)`; `pPrInner` = paket `pPrInner(f, undefined, BLOCK_FLAVOR, {framePr})`.

## Bukti (path kerja `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/intw/`, skrip `run.sh`)
- SELURUH berkas sha256 sebelum = sesudah (`before/sums.txt` vs `after/sums.txt`, diff kosong; `before2` = determinisme): DOCX benchmark `6515797f3f8dd292…84d2dd52`, HTML benchmark `54095e22c5148e35…19f656e9`.
- 4 fixture SUCCEEDED, DOCX: memo `7eff336b…b3f655`, tables `e9d08818…4d4a39`, serah `c02c9e90…a64d`, terbit `719b7425…e3e3a`; HTML ke-4 juga identik.
- Uji ekuivalensi lama-vs-baru masukan ekstrem (`equiv.ts`: surrogate tunggal, `'`, C0, TAB, bilangan pecahan, borders berkunci kosong, lineRule tanpa lineTw, caps false, vMerge, cantSplit false, grid pecahan): pass 486 fail 0; kontrol negatif `neg.ts` 2/2 terdeteksi.
- `npx vitest run tests/unit/studio/docx-fonts-family.test.ts`: 3/3 lulus. `npx tsc --noEmit -p tsconfig.json`: exit 0, 0 baris. `npx eslint` 4 berkas: exit 0.

Temuan (di luar area, tidak diubah): `figures/ooxml.ts:34` punya `w:t` lokal dan `assemble/xml.ts:98` pembangun atribut lokal (keduanya memakai `escapeXml` paket, bukan escape sendiri) -> kandidat pengikat `textXml`/`attrs`. Permintaan lintas pemilik: tidak ada. Review direkomendasikan: 4 berkas di atas.
