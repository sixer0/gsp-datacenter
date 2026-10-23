# IP-54 — Polesan API untuk UI SR-30 (coder-execution, 2026-10-23)

Status: complete. Skills: backend-execution, dry-run-verify-fix. Keputusan sumber: D-212 (permintaan SR-30 di `file_requests.md`), D-175, D-176, D-186, D-207, D-155.

Klaim: `file_claims.md` (prefiks IP-54). Berkas yang diubah (aditif):

| Berkas | Perubahan |
|---|---|
| `src/lib/studio/services/storage/files.ts` | `toOutputFileDto` -> `StoredOutputFileDto` = `OutputFileDto & { draft: boolean; scope: { kind, key? } }` dari kolom MX06 `draft`/`scopeKind`/`scopeKey` (DOCUMENT tanpa `key`; bentuk sama dengan `ScopedOutputDto` di `services/render/scope.ts`). Helper baru `outputFileScope`. `writeOutput`/`readOutputFile` mengembalikan tipe superset itu. Impor Prisma MALAS (`db()` lewat `import("@/lib/prisma")`, pola `render/db.ts`, D-155/IP-48). |
| `src/app/api/studio/documents/route.ts` | R04 GET per dokumen: `completeness` bentuk `CompletenessSummary` kontrak (`status`, `fullRenderAllowed`, `revisionNo?`, `missingRequired`, `slots[{slotKey,label,sectionType,state,required}]`, `chapters`) + `latestFiles: {revisionNo, hasFull, hasDraft} \| null`. Medan lama `status`/`missingRequired` tetap. Revisi tanpa laporan sah (semua revisi v21 saat ini: backfill SR-37 tanpa `completenessReport`) memakai baris M14/M15 (aturan label/state sama dengan R05 `buildSlots`/`fallbackState`). `latestFiles` = revisi bernomor terbesar yang punya berkas PRIMARY; `hasFull` = DOCUMENT bukan draf, `hasDraft` = draf. Dua query tambahan per halaman (bukan per baris). |
| `src/app/api/studio/assets/route.ts` | R18 GET `?sha256=&inline=1` -> byte PNG/JPEG: Content-Type dari dekode, `inline`, `nosniff`, `no-referrer`, CORP same-origin (lewat `files/_lib/serve.fileHeaders`, impor saja), ETag sha + `If-None-Match` -> 304, `Cache-Control: private, max-age=3600, immutable`. Baca via `readImageAsset` (verifikasi sha/mime) dari `relPath` C33c, cadangan jalur datar lama (D-175); hilang 410. Galat `stripDetails` (tanpa path). Tanpa `inline` = JSON `{asset}` seperti sebelumnya. |

Bukti (segar, 2026-10-23):
- `npx tsc --noEmit -p tsconfig.json` -> exit 0, 0 galat seluruh repo.
- `npx eslint <3 berkas area>` -> exit 0, 0 masalah.
- Asap handler baca saja (scratchpad `ip54_smoke.ts`, `npx tsx --env-file=.env`, cookie `gsp_hq_session` bertanda tangan pola SR-25; tanpa tulis DB/berkas): `current_database = gsp_agent_hq_v21`; RESULT 16/16 PASS. Kutipan:
  - R04 dokumen `001/GSP/KT/X/2026`: `completeness = {"status":"COMPLETE","fullRenderAllowed":true,"missingRequired":[],"slots":[{"slotKey":"content","label":"Bab","sectionType":"chapter","state":"FILLED","required":false}],"chapters":{"content":{"missing":[],"present":[{key:"1"},{key:"2"}]}}}`, `latestFiles = {"revisionNo":1,"hasFull":true,"hasDraft":false}`; `latestFiles` cocok dengan query DB mentah untuk 3/3 dokumen; tanpa sesi 401.
  - R18 inline: tanpa sesi 401; sha tak dikenal 404 `{"error":"Asset not found","code":"FILE_NOT_FOUND"}` (tanpa path).
  - DTO berkas: `{"id":"cmvjwl7ay00ddv1cgr6xc0w09","format":"HTML","role":"PRIMARY","draft":false,"scope":{"kind":"DOCUMENT"}}`; `outputFileScope` CHAPTER -> `{"kind":"CHAPTER","key":"3"}`.
  - Impor `files.ts` tidak membuat klien Prisma (`globalThis.prisma` tetap undefined sampai panggilan DB pertama).

Celah / temuan:
- Jalur 200 R18 inline (byte gambar + header) TIDAK teruji di v21: `StudioAsset` 0 baris dan asap dibatasi baca saja -> uji di SR-49/SR-52 (atau asap rollback dengan unggah R18).
- Aturan cadangan slot dari baris kini ada di dua tempat (R05 `documents/[id]/route.ts` dan R04) -> kandidat helper bersama (bukan area IP-54).
- `OutputFileDto` kontrak (SR-04) belum memuat `draft`/`scope`; tipe superset hidup di `storage/files.ts` dan tidak diekspor dari `storage/index.ts` (bukan area). Usul: kontrak menambah medan opsional/wajib agar klien SR-30 bisa mengetik dari kontrak.
- Impor Prisma statis masih ada di `storage/mission.ts`, `ingest/repository.ts`, `images/store.ts` (backlog IP-48 D-186; bukan area).

Permintaan lintas pemilik: tidak ditulis ke `file_requests.md` (controller memutuskan; lihat Celah).
Review recommended: senior-code-reviewer, lingkup 3 berkas di atas.
