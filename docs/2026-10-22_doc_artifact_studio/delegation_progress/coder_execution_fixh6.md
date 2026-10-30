---
task_slug: doc_artifact_studio
row: FIX-H6 (D-321/D-322; Hermes C6)
date: 2026-10-30
agent: coder-execution
status: complete
---

# FIX-H6: 404 JSON untuk path `/api/studio/*` yang tidak ada

Sumber: `hermes_trial/02_trial_report_full.md:26` (`POST /api/studio/documents/{id}/slots` -> 404 body kosong tanpa kode/`x-correlation-id`).

## Perubahan

| Berkas | Jenis | Isi |
|---|---|---|
| `src/app/api/studio/[[...notfound]]/route.ts` | baru | Catch-all opsional (juga menjawab `/api/studio` sendiri). GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS -> `requireSession` lalu `routeNotFound`. Next mendahulukan segmen statis/dinamis, jadi route yang ada tidak terbayangi (terbukti 21 sampel di bawah). |
| `src/lib/studio/http/route-not-found.ts` | baru | `routeNotFound(req)`: 404 `{ error, code: "ROUTE_NOT_FOUND", message, hint, correlationId, details: { method, path, suggestion? } }` + `x-correlation-id` + `Cache-Control: no-store`; log warn JSONL tahan lama (`source studio.api.route-not-found`). `suggestStudioRoute`: 22 regex salah-umum (documents/{id}/slots, /chapters, /build, /validate, /history, /revisions/{n}, /outline, /paragraphs, /assets; slot, chapter, document, template singular; render, schemas, files, logs, health). Id dari path hanya disalin bila `^[A-Za-z0-9_-]{1,64}$`; path digema maks 200 karakter. |
| `tests/unit/studio/api/fixh6-route-not-found.test.ts` | baru | 42 uji. |

Tidak diubah: `src/middleware.ts`, route yang ada, `src/lib/studio/http/index.ts` (helper diimpor langsung lewat path modul), enum kontrak (`ROUTE_NOT_FOUND` tidak masuk `StudioErrorCode`; 404 ini dijawab sebelum layanan mana pun).

## Bukti (server dev :9021, rahasia uji dari berkas trial, tidak dicetak)

- `POST /api/studio/documents/abc123/slots` -> `404`, `content-type: application/json`, `x-correlation-id: f5b7b395-...`, badan `code: ROUTE_NOT_FOUND`, `hint` "Slots are submitted to POST /api/studio/slots with body { "target": { "documentId": "abc123" }, ... }", `details.suggestion: POST /api/studio/slots`.
- `GET /api/studio` -> 404 JSON dengan hint umum (daftar sumber daya). `DELETE /api/studio/xyz/abc` + `x-correlation-id: hermes-trial-0001` -> header dipantulkan. `OPTIONS .../documents/abc/chapters` -> 404 + hint chapters. `HEAD /api/studio/foo` -> 404 + correlation.
- Tanpa sesi: 4 path (salah dan benar) -> `401 {"error":"Unauthorized"}` (middleware; route juga `requireSession`).
- Route yang ada (rnf = jumlah `ROUTE_NOT_FOUND` di badan, semua 0): GET templates 200, templates/{id} 200, templates/{id}/skeleton 200, registry?kind=slots 200, documents 200, documents/{id} 200, /revisions 200, /structure 200, /completeness 200, /content 200, /blocks/x.y 400 (ADDRESS_INVALID), /paragraphs/p_nope 404 (PID_NOT_FOUND, bukan ROUTE_NOT_FOUND), artifacts 200, files/{id} 200, render-env 200, assets?sha256=00 400; POST chapters 400, slots 400, validate 200, client-log 400, documents/{id}/render 400 (badan sengaja salah).
- Log tahan lama: `data/studio-workspace/logs/api/studio-api-2026-10-30.jsonl` memuat 8 entri `ROUTE_NOT_FOUND` (route `/api/studio/[[...notfound]]`, correlationId, path, suggestion).
- `npx vitest run tests/unit/studio/api/fixh6-route-not-found.test.ts` -> 42 passed. `npx vitest run tests/unit/studio/api` -> 19 files / 592 passed.
- `npx tsc --noEmit -p .` -> exit 0. `npx eslint` (3 berkas) -> exit 0.

## Persistent Issues

| Isu | Upaya | Akar | Status | Memblokir? |
|---|---|---|---|---|
| Metode salah pada route yang ADA (mis. `GET /api/studio/slots`, `DELETE /api/studio/templates`) tetap `405` badan kosong, tanpa `content-type` maupun `x-correlation-id` (curl terverifikasi). | 0 (di luar area) | Next menjawab 405 sendiri saat route cocok tetapi metode tidak diekspor; catch-all tidak pernah dipanggil. | terbuka | tidak |

Opsi untuk controller: (a) middleware memetakan metode yang diizinkan per pola route Studio dan menjawab 405 JSON `METHOD_NOT_ALLOWED` + `Allow` (menyentuh `src/middleware.ts`, runtime edge, daftar route harus dijaga sinkron); (b) setiap route Studio mengekspor handler 405 JSON untuk metode yang tidak didukung (21 berkas, milik banyak baris); (c) biarkan (405 standar HTTP, agen sudah tahu path-nya benar).

## Issues & Decisions

| Langkah | Isu / Keputusan | Resolusi |
|---|---|---|
| Nama folder | `[[...notfound]]` (opsional) dipilih alih-alih `[...notfound]` agar `/api/studio` tanpa sub-path juga mendapat 404 JSON | Tidak ada `route.ts` di `/api/studio`, jadi tidak bentrok |
| Bentuk badan | Selain medan yang diminta, `error` (= message) disertakan agar konsisten dengan bentuk galat §6.1 `{ error, code }` | - |
| Kode galat | `ROUTE_NOT_FOUND` tidak ditambahkan ke enum kontrak (di luar area) | Laporkan bila register 03 perlu mencatatnya |

## Next Steps

- Keputusan controller untuk 405 JSON (opsi a/b/c di atas). Review recommended: dua berkas baru (route + helper).
