# SR-23 coder-execution: route R16 paragraphs/[pid] + R20 content

status: complete (2026-10-23)

## Berkas (baru)
- `src/app/api/studio/documents/[id]/paragraphs/[pid]/route.ts`: R16 GET `?rev&history=1` (`{pid, kind, address, type, content (v2 + id), revisionNo, history?}`), PATCH -> `patchPid` (SR-14). Render diminta -> `checkRenderRate` (429) + `assertRenderCapacity` (503).
- `src/app/api/studio/documents/[id]/content/route.ts`: R20 GET `?slot&chapter&rev` -> `projectContentDetailed` (SR-10); `slot` respons = slot terpilih.
- `src/app/api/studio/documents/[id]/paragraphs/_lib/http.ts`: sumber log `studio.api.sr23`, dekode `[pid]` (C19), `?rev` + muat dokumen/revisi, `locatePid` (M15-M18 baca saja), `findById`.

## Keputusan
1. Bentuk badan PATCH divalidasi SATU kali oleh layanan (`parsePatchPidBody`: D-06 `CHANGE_FIELDS_REQUIRED`, fragmen v2 + `classifySchemaV2Errors`, `to`). Route hanya transport + `agentId` (dibuang dari badan sebelum diteruskan; layanan menolak medan tak dikenal).
2. Pid berbentuk di luar C19 -> 404 `PID_NOT_FOUND` di route (tidak mungkin ada). Pid pensiun / belum dibuat pada `rev` -> 404 dengan `details.retiredRevisionNo` bila pensiun (register §10).
3. GET blok: isi dari baris M17 + `id`; bab/subbab: proyeksi `projectContent` lalu cari `id === pid`. `type` = jenis blok, atau `chapter`/`section`. Alamat intro bab (sectionNo 0) = alamat bab (tata bahasa §4.1 tidak punya `C.0`).
4. `?rev` tidak sah -> 404 `REVISION_NOT_FOUND` (pola R05). `slot` di luar C18 -> 422 `SLOT_UNKNOWN`; `chapter` di luar C33a/C33b -> 404 `ADDRESS_NOT_FOUND` (tanpa DB).

## Gerbang D-133
- tsc repo: 0 galat di area SR-23; 155 galat di luar area (UI studio playground/section-composer/template-editor/document-viewer, submit-kit SR-21, documents/route.ts, login/safe-next.ts, revisions/v2/ops.ts) = baris lain yang sedang berjalan.
- eslint `paragraphs` + `content`: exit 0.
- Asap handler (tsx, v21, header internal uji): GET content tanpa sesi -> 401 `{"error":"Unauthorized"}`; GET pid `p-zzzzzzzzzz` -> 404 `PID_NOT_FOUND`; pid `X!` -> 404; PATCH tanpa change -> 400 `CHANGE_FIELDS_REQUIRED`; content dok tak ada -> 404; `slot=Bad-Slot` -> 422.

## Temuan
- PATCH pid tak dikenal pada dokumen v1 -> 400 `SCHEMA_INVALID` (`legacyRevision`, layanan SR-14) mendahului 404; wajar, dicatat untuk SR-35.
- DB v21 belum punya baris M14 (belum ada dokumen v2): jalur 200 R20/R16 belum teruji nyata -> fase uji.
