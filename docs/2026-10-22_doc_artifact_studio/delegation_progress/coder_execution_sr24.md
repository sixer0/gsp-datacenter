# SR-24 coder-execution — R17 POST /api/studio/documents/[id]/render

Status: complete (gerbang D-133). Tanggal 2026-10-23.

Berkas (baru):
- src/app/api/studio/documents/[id]/render/route.ts — sesi + dependensi nyata (getStudioCaller, checkRenderRate, assertRenderCapacity, renderQueueRetryAfterSec).
- src/app/api/studio/documents/[id]/render/_lib/request.ts — validasi badan `{scope, key?, formats?, figures?, revisionNo?, agentId?}`.
- src/app/api/studio/documents/[id]/render/_lib/handler.ts — inti: 400/429/503/409/404/422 + 200 `{job, outputs, completeness}`; pembentuk 409 §11.3.
- src/app/api/studio/documents/[id]/render/_lib/service.ts — seam `renderScope` SR-15 (baca ekspor dinamis; belum ada → 500 MODULE_NOT_IMPLEMENTED).

Bukti:
- `npx tsc --noEmit -p tsconfig.json`: 1 galat, di LUAR area: `src/app/api/studio/chapters/_shared/submit-kit.ts(39,43) TS2307 '@/lib/studio/services/submit'` (SR-21 menunggu SR-13). Area SR-24: 0.
- `npx eslint "src/app/api/studio/documents/[id]/render"`: exit 0.
- Asap (tsx, layanan tiruan, SR-15 belum mendarat): render penuh INCOMPLETE → 409 DOCUMENT_INCOMPLETE dengan `details.completeness` (status INCOMPLETE, revisi 6, missingRequired) + `allowedScopes ["chapter","slot"]` + `forwardToController`; chapter → 200 draft=true; slot tak dikenal → 422; badan salah → 400; antrean penuh → 503 Retry-After 9; laju → 429 Retry-After 5; seam kosong → 500. "SMOKE PASS". Log JSONL tertulis di STUDIO_WORKSPACE_ROOT/logs/api.

Keputusan (untuk dicatat controller):
1. `key` wajib untuk chapter/slot, dilarang untuk document; kunci badan tak dikenal → 400 (additionalProperties false).
2. `agentId` diterima aditif (setara R07) untuk identitas pemanggil.
3. formats/figures tidak peka huruf, dinormalkan huruf kecil (bentuk RenderRequestV2).
4. Pesan 409 tetap = E3b; `details` dinormalkan route: completeness dari `details.completeness` atau details berbentuk laporan; forwardToController dari details → completeness → pesan galat.
5. Kontrak untuk SR-15: lempar `StudioEngineError("DOCUMENT_INCOMPLETE", msg, { completeness: CompletenessReportV2 })`; kembalikan `{ job (+scope, draft), outputs, completeness, errors? }`.

Permintaan: tidak ada berkas milik baris lain disunting. Setelah SR-15 mendarat, seam `_lib/service.ts` boleh diganti impor langsung (opsional; seam otomatis memakai ekspor nyata).
