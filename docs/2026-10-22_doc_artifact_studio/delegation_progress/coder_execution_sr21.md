# SR-21 route kiriman parsial R12 `/api/studio/chapters` + R13 `/api/studio/slots` (coder-execution)

Status: complete (gerbang D-133). Skills: backend-execution, dry-run-verify-fix.

Berkas BARU:
- `src/app/api/studio/chapters/route.ts` (R12 POST `studio.chapter/v2`)
- `src/app/api/studio/slots/route.ts` (R13 POST `studio.slot/v2`)
- `src/app/api/studio/chapters/_shared/submit-kit.ts` (handler bersama: `requireSession`, `getStudioCaller`, `readJsonBody`, ajv + `classifySchemaV2Errors`, target, laju FIX-1, `submitChapter`/`submitSlot` SR-13, `failFrom`; 201 baru/revisi, 200 `unchanged`)

Bukti:
- `npx tsc --noEmit -p tsconfig.json`: 0 galat di area; 20 galat di luar area (template-editor 9, document-viewer 6, validate/route.ts 2, ingest/index.ts 1, studio/templates 1; baris paralel).
- `npx eslint src/app/api/studio/chapters src/app/api/studio/slots`: exit 0.
- Asap tahap 1 (stub SR-13 lewat paths tsconfig scratch, sebelum SR-13 mendarat): 17/17 PASS (401, JSON_MALFORMED, SCHEMA_INVALID + DISPLAY_FIELD/V1_FIELD berpointer, DOC_TARGET_AMBIGUOUS x2, SLOT_USE_CHAPTER_ENDPOINT x3, 201/200 dari hasil layanan, StudioEngineError -> kode kontrak, 413).
- Asap tahap 2 (layanan SR-13 nyata, `current_database = gsp_agent_hq_v21`): agen POST E2 -> 201 `create;chapter:3`, rev 1, 8 blok (3.2.3 image "Gambar 3.1", 3.3.2 table "Tabel 3.1"); ulang -> 200 `unchanged:true` rev 1. Dihapus: dokumen `cmvk6ejih0002v1l0lup1ri6m`, aset `cmvk6ejhx0000v1l0lxkaq8nu` (+ berkas). Sisa 0 (dokumen, revisi, identitas, keluaran, job, aset); dokumen 3 = 3.

Keputusan (perlu dicatat controller):
1. R13: slot berulang diperiksa SEBELUM skema (`payload.type` chapter/appendix atau kunci `content`/`appendices`) -> 422 `SLOT_USE_CHAPTER_ENDPOINT` `{slotKey, use}`; tanpa ini skema SID03 (payload tanpa tipe berulang) memberi 400 yang menyesatkan. Kunci khusus kerangka templat tetap diputuskan layanan.
2. Target tepat satu cara juga dicek di route (400 `DOC_TARGET_AMBIGUOUS`, `docKey` tanpa `mission` ditolak) agar galat murah sebelum DB; layanan SR-13 tetap pemegang aturan penuh.
3. Laju 429 selalu; kapasitas antrean 503 hanya bila `render` diminta (D-131 butir 1: kiriman isi tetap diterima saat antrean penuh).
4. Asap E2 memakai aset base64 PNG 1x1 (bukan `assetRef`) dan tanpa `render` (tidak menulis berkas render).

Temuan: kelengkapan E2 di `datum-gsp` v1 (kerangka implisit) memberi `missingRequired` tanpa `signature` (blueprint §2.5 menyebut signature) -> periksa SR-06/SR-11 di fase uji.
