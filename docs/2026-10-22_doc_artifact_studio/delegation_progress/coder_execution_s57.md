# S57 Route artefak (R09) dan sajian berkas (R10) (coder-execution, 2026-10-23)

Status: complete (penjaga + asap handler; uji fungsional di S74/S80). Skills: backend-execution, dry-run-verify-fix.

## Berkas (7, 1062 baris)
- `src/app/api/studio/artifacts/route.ts` - GET `?kind=&mission=&take=&cursor=` -> `{ artifacts: (ArtifactSummary & {outputs})[], nextCursor }`; POST -> validasi -> `StudioArtifact` -> `renderArtifact` S51 -> 201 `{ artifact, outputs, job, errors, lint? }`.
- `artifacts/_lib/{http,request,prepare,dto}.ts` - log JSONL `<akar>/logs/api/` + correlation id, amplop JSON/multipart, cek per jenis, DTO.
- `src/app/api/studio/files/[id]/route.ts` + `files/_lib/serve.ts` - sajian berkas via id DB saja (S52 `readOutputFile`).

## Bukti
- `npx tsc --noEmit -p tsconfig.json | grep -E "src/app/api/studio/(artifacts|files)"` -> kosong (exit 1); total repo 33 galat di area lain (21 pra-ada + `src/components/studio/revision/*` 5).
- `npx eslint src/app/api/studio/artifacts src/app/api/studio/files` -> exit 0.
- Asap tsx (scratchpad, tanpa tulis DB): JSON rusak 400 JSON_MALFORMED; 6 MiB 413 PAYLOAD_TOO_LARGE; multipart 30 MiB 413 ASSET_TOO_LARGE; DF-01 422 CHART_KIND_NOT_DRAWN `alternatives:["P-01"]`; Mermaid 422 DATUM-31; PNG 10 px/100 mm 422 DATUM-39; GIF 415; sha salah 400; `asset.path` `../../etc/passwd` 400; format PDF utk chart 400; templat tak ada 404; anonim 401 (GET dan files); id `../../x` 404; berkas nyata PNG/SVG/DOCX 200, sha terverifikasi, SVG ber-CSP, DOCX attachment.

## Keputusan (untuk register)
1. Disposition (D-65): tanpa param/`download=1` attachment; `inline=1` inline utk HTML/SVG/PDF/PNG/JPG; DOCX dan ekstensi lain selalu attachment; PDF tanpa CSP.
2. CSP HTML/SVG = inti brief + `base-uri 'none'; form-action 'none'; frame-ancestors 'self'; sandbox` (lebih ketat). Header tambahan: nosniff, no-store, `X-Frame-Options: SAMEORIGIN`, CORP same-origin, `X-Studio-Sha256`.
3. `verify=1`: selisih sha tetap disajikan dengan `X-Studio-Sha256-Verified: false` + log warn (kontrak tak punya kode galat utk ini).
4. Multipart (D-61): `assertMultipartLength` sebelum membaca, batas streaming `IMAGE_MAX_MULTIPART_BYTES`; medan `request` (JSON penuh) atau `spec`/`mission`/`formats`/`agentId` + `file`; `file` hanya utk `studio.image/v1`.
5. Gambar: base64/unggahan disimpan `storeImageAsset` S53 -> `spec.asset = {path:"<sha>.<ext>"}` (base64 tidak masuk DB); `asset.path` masukan hanya alamat isi `<sha256>.<png|jpg>`.
6. Diagram: `loadSpec` + `validateSpec(release:false)` FAIL -> 422 BY_CONSTRUCTION_FAILED; spec tersimpan = hasil `loadSpec`. HTML: templat diresolusikan -> `templateVersionId`; sumber dicek (404), artefak sumber hanya CHART/DIAGRAM.
7. Pointer SCHEMA_INVALID spec relatif terhadap `spec`; amplop relatif badan. GET `mission` cocok folder/agentRequestId/hermesTaskId; `take` default 50 maks 200; `cursor` tambahan.
8. Gagal render setelah baris dibuat: baris dipertahankan (tampil di GET), galat dicatat.

## Permintaan / temuan
- Tidak ada permintaan lintas pemilik. Temuan: helper log/korelasi diduplikasi di `_lib` S54/S55/S57 (kandidat konsolidasi S85). Review direkomendasikan (S85/S87: sajian berkas, multipart).
