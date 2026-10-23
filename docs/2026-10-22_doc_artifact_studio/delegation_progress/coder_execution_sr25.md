# SR-25 — Route R18 `/api/studio/assets` (coder-execution, 2026-10-23)

Status: complete. Skills: backend-execution, dry-run-verify-fix.

Berkas: `src/app/api/studio/assets/route.ts` (baru). Klaim: `file_claims.md` (prefiks SR-25).

Isi: POST multipart `file` (tepat satu bagian; D-134: multipart diizinkan untuk route ini) atau JSON `{ mime, dataBase64 }` (badan maks `STUDIO_MAX_JSON_BYTES`, aset besar lewat multipart), `?mission=` opsional (format MISSION_FOLDER_RE) -> `storeAsset` SR-19 (I52) -> 201 `{asset, created:true}` / 200 `{asset, created:false}`. GET `?sha256=<hex|sha256:hex>` -> `findAssetBySha` + `toAssetDto` (SR-19), tak dikenal 404 `FILE_NOT_FOUND` (KD-24); `?mission=&take=` (1..200, bawaan 50) -> daftar terbaru dulu. Laju unggah 60/60 s per identitas terautentikasi (`renderRateIdentity`) -> 429 `RATE_LIMITED`. Content-Type selain multipart/JSON -> 415 `UNSUPPORTED_MEDIA_TYPE` (header absen = JSON, L-07). Galat layanan lewat `failure` dengan `stripDetails` (kecuali isu SCHEMA_INVALID) agar relPath tidak bocor; respons tanpa path.

Penjaga:
- `npx tsc --noEmit -p tsconfig.json`: 1 galat, DI LUAR area: `src/app/api/studio/chapters/_shared/submit-kit.ts(39,43) TS2307 '@/lib/studio/services/submit'` (SR-13/route chapters belum mendarat). Area assets: 0.
- `npx eslint src/app/api/studio/assets`: exit 0, 0 problem.
- Asap handler (scratch `sr25_smoke.ts`, POST/GET dipanggil langsung, cookie sesi USER bertanda tangan): `current_database = gsp_agent_hq_v21`; RESULT 13/13 PASS: multipart PNG 201 (4x3, 105 B, kunci DTO tanpa path), ulang 200 sha sama, base64 ulang 200, 20001x1 px 413 ASSET_TOO_LARGE, content-length 30 MiB 413 ASSET_TOO_LARGE, JSON > 5 MiB 413 PAYLOAD_TOO_LARGE, SVG 415 ASSET_TYPE_UNSUPPORTED, text/plain 415, skema 400 (3 isu), GET sha 200, GET sha nol 404 FILE_NOT_FOUND, daftar misi n=1, tanpa sesi 401.
- Pembersihan: baris uji dihapus 1, sisa 0 (dicek ulang: `sisa baris uji = 0`, StudioAsset sebelum 0 = sesudah 0); berkas `assets/1b/<sha>.png` dan salinan datar `assets/<sha>.png` dihapus, `find data/studio-workspace -name "1b6f4ef2*" | wc -l` = 0.

Temuan:
- SR-19 `storeAssetRow` menulis DUA salinan berkas (C33c `assets/<2>/<sha>` + tata letak lama `assets/<sha>`, asset-store.ts:191-192); disengaja untuk pembaca lama? Perlu dicatat (ruang disk x2, pembersihan wajib dua path).
- SR-19 `normalizeMissionFolder` menerima string apa pun <= maks; route ini lebih ketat (pola §7.2). Selaraskan bila perlu.

Permintaan lintas pemilik: tidak ada. SR-35 (API-REFERENCE) dapat mengutip kontrak di komentar header route.
