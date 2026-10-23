# IP-42b - teruskan opsi `fit` lembar simbol (coder-execution)

Status: complete (sisi IP-42b; efek tinggi isi-pas menunggu IP-42a mendarat)
Berkas: src/lib/studio/services/render/figures.ts (satu-satunya berkas kode)

## Perubahan
- `PARAM_SYMBOL_SHEET_FIT = "symbol.sheet.fit"`: `fit` dibaca dari parameter templat (`tpl.params`), bukan medan konten (D-139; kontrak `SymbolSheetBlock` tidak berubah).
- `symbolSheetOptions(content, tpl)` + `symbolSheetFigures(content, tpl)` (diekspor, murni); `buildFigures` cabang `symbolSheet` memanggil `symbolSheetFigures(c, i.tpl)`. Bawaan `fit:false` = perilaku lama.
- Seam sementara: tipe lokal `SymbolSheetFn` `(d, cols?, opts?: { fit?: boolean })`, cast dari `symbolSheetSvg`; hapus saat engine/symbols mengekspor bentuk ini.

## Penjaga (2026-10-23)
- `npx tsc --noEmit -p tsconfig.json` -> exit 0, 0 `error TS` (seluruh repo).
- `npx eslint src/lib/studio/services/render/figures.ts` -> exit 0.
- Asap (vitest scratch, mock prisma + spy engine/symbols + stub prepareFigureStore, lewat `buildFigures`):
  `FIT=true  -> symbolSheetSvg args [["iec",6,{"fit":true}]] sheets[w,h] [[166,247]]`
  `FIT unset -> symbolSheetSvg args [["iec",6,{"fit":false}]] sheets[w,h] [[166,247]]`
  Tinggi masih 247 karena engine/symbols saat ini (index.ts:137) belum menerima opsi ke-3 (IP-42a belum mendarat; coder_execution_ip42a.md belum ada).

## Permintaan (file_requests.md, prefiks IP-42b)
1. IP-42a: bentuk `symbolSheetSvg(d, cols?, opts?: { fit?: boolean })`; bila beda, IP-42b menyesuaikan satu baris pemanggil.
2. Pemilik params (SR-05 / params/figure.ts): daftarkan ParamDef `symbol.sheet.fit` (bool, bawaan false, cakupan slot `section:symbolSheet`).

## Temuan
- `figures.ts` membaca `content.widthMm` (medan FigureCommon yang sudah ada) sebagai lebar cadangan; tetap dipertahankan.
