---
row: SR-26
agent: coder-execution
date: 2026-10-23
status: complete
---

# SR-26 Route R19 `/api/studio/templates/[id]/skeleton`

- Berkas baru: `src/app/api/studio/templates/[id]/skeleton/route.ts` (GET + POST). Tanpa pembantu `_lib`.
- GET `?version=n`: `getTemplateSkeleton` (SR-06) + `getTemplate` (ringkasan) -> `{ template, versionNo, skeleton, skeletonSha256, implicit, essentials: { global, bySlot }, advancedIncluded }`. Lanjutan + roleFormats slot hanya ADMIN (D-163 T-1); selain ADMIN medan kenop `medan` diproyeksikan ke `essentials` (`essentialProjection`, D-170).
- POST: pisah `baseVersionNo`/`changeNote`/`expertMode` -> ajv `studio.skeleton/v1` (pointer relatif badan) -> 400 CHANGE_NOTE_REQUIRED -> templat v2 = definisi versi terbaru (lapis lengkap, server saja) + kerangka baru -> `createTemplateVersionV2` (SR-07: izin per kunci berubah §13.5 + per kenop via SR-06 `checkTemplateWrite`, bawa lapis tersembunyi non-ADMIN, VERSION_CONFLICT, satu transaksi). Pointer galat layanan `/template/skeleton/...` dipetakan ke `/...`. 201 `{ version, skeletonSha256 }`.
- Penjaga: `npx tsc --noEmit -p tsconfig.json` 100 galat repo, 0 di area (sisa: chapters/_shared + documents/route `services/submit` SR-13, components/studio/{section-composer,template-editor,document-viewer} baris UI). `npx eslint "src/app/api/studio/templates/[id]/skeleton"` exit 0.
- Asap handler (scratch `sr26_smoke.ts`, tsx, DB `gsp_agent_hq_v21` dicek, fixture preset + templat slug unik dibuat lewat SR-07 lalu dihapus, sisa 0): RESULT 17/17 PASS.
  - USER `slot.setup.marginTw` di slot -> 403 PARAM_SURFACE_FORBIDDEN (`details.failures[0].fields = ["marginTw"]`).
  - USER `page.size` di slot content -> 422 SLOT_PARAM_SCOPE_INVALID (`scope: "document"`).
  - USER `slot.setup: { startOnNewPage: true }` -> 201 `{"versionNo":2,"skeletonSha256":"0341bffc..."}`; GET ulang memuat `essentials["slot.setup"].startOnNewPage = true`, sha sama, preset terbawa.
  - Lain: anon 401, id asing 404, base basi 409 VERSION_CONFLICT, tanpa changeNote 400, medan asing 400 (pointer ""), posisi bolong 400 SKELETON_POSITION (pointer `/slots`), slotKey ganda 422 SLOT_DUPLICATE, USER pada preset 403 PRESET_READONLY, ADMIN `titlePg` 201, GET ADMIN melihat lanjutan / USER hanya proyeksi kenop, USER simpan ulang tanpa lanjutan 201 dan `titlePg` ADMIN terbawa.

## Keputusan / catatan untuk controller
1. Versi lama tanpa kerangka eksplisit (`definition` null) pada templat bukan preset: POST R19 ditolak layanan 400 SCHEMA_INVALID (`/template/preset`, "preset wajib") sampai migrasi SR-36; templat preset lama dapat disimpan.
2. Tanpa pembatas laju: sama dengan R02 (FIX-1 hanya jalur render/ingest/client-log).
3. `?expert=1` tidak didukung di GET (T-1: lanjutan hanya ADMIN di v2.1). Respons GET menambah `advancedIncluded`; kenop berbentuk `EssentialKnobSpec` (superset `EssentialKnobDef`).
4. `agentId` di badan POST ditolak (skema kerangka `additionalProperties: false`; agen tidak memakai R19).
5. Impor baca-saja `validateAgainst` dari `services/ingest/validate` (pemilik SR-12).

## Permintaan lintas pemilik
- Tidak ada.
