# S56 coder-execution: route blocks/[address] dan revisions

Status: complete (penjaga lulus; uji route = S74, alur E = S80).

## Berkas (NEW)
- `src/app/api/studio/documents/[id]/blocks/[address]/route.ts` (R06 GET, PATCH)
- `src/app/api/studio/documents/[id]/blocks/_lib/http.ts` (utilitas bersama R06/R07; folder privat `_lib`, tidak dirutekan)
- `src/app/api/studio/documents/[id]/revisions/route.ts` (R07 GET, POST)

## Perilaku
- Setiap handler: `requireSession(req)` baris pertama; `dynamic = "force-dynamic"`.
- Alamat: segmen didekode sekali bila memuat `%`, divalidasi `parseAddress` §4.1 -> 400 `ADDRESS_INVALID`; diteruskan dalam bentuk kanonik `formatAddress`.
- PATCH: 413 `PAYLOAD_TOO_LARGE` (> STUDIO_MAX_JSON_BYTES), 400 `JSON_MALFORMED`, 400 `CHANGE_FIELDS_REQUIRED` (apa/mengapa/dampak kosong, `details` per medan), 400 `SCHEMA_INVALID` (baseRevisionNo bukan bilangan bulat positif, op di luar 4 nilai, kombinasi op/block/cell). 409 `REVISION_CONFLICT`, 422, 404 dipetakan dari layanan S50 via `studioErrorFrom`.
- Pemanggil: `getStudioCaller(req, agentId?)` diteruskan ke `patchBlock` dan (D-54) ke `rerenderRevision` argumen ke-4.
- GET revisions: `{ revisions }` sesuai §6.2; aditif `?from=a&to=b` atau `?to=b` (diff terhadap parent) -> `{ revisions, diff }` via `diffRevisions` S50.
- POST revisions: `{ revisionNo, formats?, agentId? }` -> `{ job, outputs, identical }`; formats divalidasi terhadap STUDIO_OUTPUT_FORMATS dan dideduplikasi.
- Galat tanpa stack: 500 = `{ error: "Internal error" }`; header `x-correlation-id` di setiap respons non-401.
- Log tahan lama: JSONL harian `<STUDIO_WORKSPACE_ROOT>/logs/api/studio-api-YYYY-MM-DD.jsonl`, source `studio.api.s56` (4xx warn tanpa stack, 5xx error dengan stack, sukses PATCH/POST info). Tanpa isi dokumen.

## Penjaga
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/app/api/studio/documents/\[id\]/(blocks|revisions)"` -> kosong (grep exit 1). Total galat repo 23, di luar area: orchestration 9, information-library 5, dispatch-kpi 3, user-access 3, propose 1, `src/lib/studio/services/ingest/checks.ts` 2 (milik S48).
- `npx eslint "src/app/api/studio/documents/[id]/blocks" "src/app/api/studio/documents/[id]/revisions"` -> exit 0.
- Smoke tanpa DB (tsx, skrip di scratchpad, header internal uji): 401 anonim; 400 ADDRESS_INVALID/JSON_MALFORMED/CHANGE_FIELDS_REQUIRED/SCHEMA_INVALID; 413; 404; decode `Tabel%203.1%2F2.3` -> `Tabel 3.1/2.3`, `A.1.2` sah, `%25`-ganda ditolak; 10 baris JSONL tertulis ke akar uji.

## Keputusan (untuk register)
- K1: batas 4000 karakter per medan apa/mengapa/dampak (spesifikasi tidak memberi batas) -> 400 SCHEMA_INVALID.
- K2: `baseRevisionNo` wajib bertipe number di badan (string ditolak).
- K3: diff riwayat via query aditif, bentuk respons default tetap §6.2.
- K4: `agentId` opsional di badan PATCH/POST untuk `requester` agen (pola dispatch repo).
- Temuan: nama berkas log `studio-api-*.jsonl` juga dipakai baris lain di `data/studio-workspace/logs/api/` (source berbeda, append-only; tidak bentrok).
