# S55 coder-execution: route documents, documents/[id], validate

Status: complete (penjaga lulus; perilaku ujung-ke-ujung menunggu S48 ingest yang masih stub `StudioNotImplemented`).

## Berkas
- `src/app/api/studio/documents/route.ts`: GET daftar (`mission`/`missionFolder`, `agentRequestId`, `hermesTaskId`, `archived`, `take` maks 200, `cursor`); POST ingest (dryRun false) lalu `renderRevision` (format dari `render.formats` + `render.figures`; kosong = bawaan S51), 201 `{ document, revision, outputs, job, releaseStatus, lint, errors, addresses, url }`.
- `src/app/api/studio/documents/[id]/route.ts`: GET `?rev=n` `{ document, revision, tree, outputs, lint }`; pohon bab -> seksi -> blok dari baris StudioBlock.
- `src/app/api/studio/validate/route.ts`: POST dry-run (StudioIngestRequest atau `{ schemaId, spec }`), `?preview=html` dirakit S24 mode pratinjau tanpa DB/berkas; tidak sah = 200 `valid:false`.
- `src/app/api/studio/validate/_shared/route-kit.ts`: batas badan 413 (content-length dan chunked), 400 JSON_MALFORMED, log JSONL tahan restart `<STUDIO_WORKSPACE_ROOT>/logs/api/studio-api-YYYY-MM-DD.jsonl` + header `x-correlation-id`, pemetaan galat §6.3 tanpa stack, DTO DocumentSummary/RevisionSummary.

## Keputusan
- K1: helper bersama di folder privat `validate/_shared` (route.ts tidak boleh mengekspor non-handler); kandidat pindah ke `src/lib/studio/` bila controller menghendaki.
- K2: ingest invalid -> 422 BY_CONSTRUCTION_FAILED bila ada isu ber-`checkId`, selain itu 400 SCHEMA_INVALID; StudioEngineError dari ingest diteruskan dengan kodenya; Prisma P2002 docNumber -> 409 DOC_NUMBER_EXISTS.
- K3: render gagal sesudah dokumen tersimpan -> tetap 201 dengan `errors` (hindari kirim ulang yang berbenturan DOC_NUMBER_EXISTS); hanya-PDF + PDF_ENGINE_UNAVAILABLE tanpa berkas -> 503 dengan `details { documentId, revisionId, jobId, rerender }`.
- K4: bila ingest sudah mengembalikan `job`, route tidak merender ulang (toleran terhadap dua kemungkinan desain S48).
- K5: GET `?rev` tidak sah -> 404 REVISION_NOT_FOUND (spesifikasi R05 hanya 404); `take` di-clamp 1..200, bukan galat.
- K6: respons POST menambah `addresses` (alamat, blockId, jenis) dan `url` R05 untuk "alamat" di brief; R05 menambah `lint` (aditif).

## Penjaga
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/app/api/studio/(documents|validate)"` -> kosong (exit grep 1). Total galat repo 23 di luar area: information-library/propose, studio/artifacts/_lib/request.ts (S57), user-access (3), dispatch-kpi, information-library page, orchestration page, services/ingest/checks.ts (S48, 2).
- `npx eslint src/app/api/studio/documents/route.ts "src/app/api/studio/documents/[id]/route.ts" src/app/api/studio/validate` -> exit 0, tanpa keluaran.
- Smoke tsx (STUDIO_WORKSPACE_ROOT di scratchpad): JSON sah terbaca; rusak/kosong 400 JSON_MALFORMED; content-length besar dan chunked melewati batas 413; StudioEngineError 409 + header correlation; galat tak dikenal 500 tanpa stack; 6 baris JSONL tertulis.

## Permintaan / temuan
- Tidak ada permintaan lintas pemilik. Temuan: ingest masih stub, sehingga POST documents/validate saat ini 500 (dicatat MODULE_NOT_IMPLEMENTED). Review recommended (S85/S87): auth, batas badan, pemetaan galat.
