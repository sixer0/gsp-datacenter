# S53 coder-execution: layanan gambar (I43)

Status: complete (2026-10-23). Area: `src/lib/studio/services/images/**` (klaim di `file_claims.md`).

## Berkas
- `index.ts` (stub S03 diganti; ekspor ulang), `sniff.ts` (magic bytes + header PNG IHDR/pHYs/PLTE, JPEG SOFn/JFIF/EXIF), `decode.ts` (base64/data URI ketat, bytes, multipart, batas), `guard.ts` (px_guard DATUM-39), `store.ts` (aset `assets/<sha256>.<png|jpg>` lewat S52).

## Kontrak
- `decodeImage(input)` dan `pxGuard(widthPx, widthMm, minDpi)` persis tanda tangan §8.2 I43 (dipakai S51 `services/render/artifact.ts:168-169`).
- Ekspor tambahan: `decodeImageDetailed`, `decodeBase64Strict`, `assertMultipartLength`, `decodeImageBlob`, `decodeImageFormField`, `storeImageAsset`, `readImageAsset`, `assetRelPath`, `effectiveDpi`, `minWidthPxFor`, `pxGuardMinDpi`, `sniffRaster`, konstanta batas.

## Keputusan (untuk register controller)
1. Galat: masukan rusak / base64 tak sah / dua-atau-nol sumber = `SCHEMA_INVALID` 400; > `STUDIO_MAX_ASSET_BYTES` (dicek SEBELUM dekode base64) atau piksel > 20000 per sisi / > 80 MP = `ASSET_TOO_LARGE` 413; non-PNG/JPEG (SVG mentah, data URI svg+xml, GIF, WebP, BMP, TIFF, PDF, ICO, HEIC/AVIF) dan PNG/JPEG rusak (CRC IHDR, terpotong, SOS sebelum SOF) = `ASSET_TYPE_UNSUPPORTED` 415.
2. `widthPx/heightPx` = piksel tersimpan tanpa rotasi EXIF (paritas PIL `im.size` di HS px_guard dan S19 `sniffImage`); orientasi EXIF dilaporkan di `decodeImageDetailed().header.orientation`.
3. pxGuard: ambang = `minDpi` (150/300; Python selalu 150); rumus `px / (mm / 25.4)` urutan sama dengan Python; pembulatan pesan setengah-ke-genap seperti `:.0f`; pesan menambah "(minimal N px)". Masukan tidak sah melempar `SCHEMA_INVALID` (Python diam-diam lolos tanpa PIL).
4. `AssetRef.path` = `<sha256>.<ext>` relatif akar aset (cocok pembaca S19 `figures/media.ts` dan S51). Simpan idempoten beralamat isi; tulis atomik tmp->rename; sha256 diverifikasi ulang sebelum simpan dan saat baca.
5. Multipart: tipe dari klien diabaikan (selisih = log warn `IMAGE_TYPE_MISMATCH`); `assertMultipartLength` (aset + 1 MiB) untuk dipanggil S57 sebelum `request.formData()`.
6. Log: `storageLog` S52 (sink JSONL tahan restart), kode `IMAGE_*`, tanpa isi berkas.

## Bukti
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/services/images"` -> 0 baris (grep exit 1).
- `npx eslint src/lib/studio/services/images` -> exit 0, tanpa keluaran.
- Uji asap tsx (skrip sementara, sudah dihapus): `smoke ok=138 fail=0` — paritas ukuran/format/dpi vs PIL (VENV) untuk 27 berkas raster benchmark manual000 + 7 PNG/JPEG buatan (dpi, progresif, EXIF 6, grayscale, palet, RGBA), tolak gif/webp/bmp/tif/svg, bom piksel, base64 rusak/terlalu besar, pxGuard 1961/1960 px @166 mm 300 dpi, simpan idempoten + baca ulang + traversal ditolak.

## Permintaan lintas pemilik / temuan
- Tidak ada permintaan berkas. Temuan untuk S57: panggil `assertMultipartLength(request.headers)` sebelum `formData()`; untuk S51: `artifact.ts` `imageInput` membaca `assets/` sendiri — `readImageAsset` tersedia (verifikasi sha256 + mime).
