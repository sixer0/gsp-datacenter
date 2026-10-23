# SR-19 Layanan gambar + StudioAsset (coder-execution)

Status: complete (2026-10-23). Skills: backend-execution, dry-run-verify-fix.

## Berkas
- BARU `src/lib/studio/services/images/asset-store.ts`: `storeAsset` (I52, `{asset: AssetDtoV2, created}`), `storeAssetRow`, `resolveAssetRef(ref, {db?, local?})`, `resolveSubmissionAssets`, `findAssetBySha`, `toAssetDto`, `assetRefOf`; tipe internal `StudioAssetRow`, `StudioAssetDb`.
- UBAH `services/images/store.ts`: penulis atomik bersama `writeAssetFile` (diekstrak dari `storeImageAsset`, perilaku sama) + `assetShardRelPath` (C33c).
- UBAH `services/images/index.ts`: ekspor aditif.

## Desain
- Batas: satu helper `decodeImageDetailed` (D-134 M-02): >20.000 px sisi / >80 MP 413, non-PNG/JPEG 415, rusak 400; MIME klien diabaikan (warn bila beda).
- Dedupe sha256: `createMany skipDuplicates` (ON CONFLICT DO NOTHING; aman di transaksi pemanggil dan serentak) lalu `findUnique`; `created = count === 1`.
- `opts.db` = klien transaksi; tanpa itu impor malas `@/lib/prisma`.
- `resolveAssetRef`: `sha256:<hex>` -> DB; kunci lokal -> `opts.local`; 64 heksa polos bukan kunci lokal -> sha (AD-14); tak dikenal 422 ASSET_NOT_FOUND; bentuk lain 400.
- Berkas: C33c (relPath M13) + salinan datar untuk pembaca lama (KEPUTUSAN perlu ratifikasi, lihat file_requests).
- Log tahan restart: `storageLog` (JSONL harian), error DB dengan stack_trace.

## Bukti
- `npx eslint src/lib/studio/services/images` -> 0 galat, 0 peringatan.
- `npx tsc --noEmit -p tsconfig.json` -> 1 galat, DI LUAR area: `src/app/api/studio/chapters/_shared/submit-kit.ts(39,43) TS2307 '@/lib/studio/services/submit'` (baris lain sedang berjalan); 0 di `services/images`.
- Asap `npx tsx <scratchpad>/sr19_smoke.ts`: current_database = gsp_agent_hq_v21; dalam transaksi: unggah 1 created=true, unggah 2 (base64) created=false sha sama, baris per sha = 1 (juga setelah resolveSubmissionAssets); resolve sha -> relPath C33c; kunci lokal ok; sha/kunci tak dikenal 422 ASSET_NOT_FOUND; rollback -> 0 baris, total tidak berubah. PNG 20001x1 dan 9000x9000 -> 413 ASSET_TOO_LARGE; GIF -> 415; ref `../etc/passwd` -> 400. Berkas uji dihapus.
- Regresi `storeImageAsset`: unggah 2x created true/false, `readImageAsset` cocok sha.

## Permintaan (file_requests.md)
1. Controller: ratifikasi tata letak C33c vs datar (tulis-ganda sementara).
2. SR-12: pola pemakaian di transaksi kiriman. 3. SR-25: pemetaan 201/200 dan GET.
