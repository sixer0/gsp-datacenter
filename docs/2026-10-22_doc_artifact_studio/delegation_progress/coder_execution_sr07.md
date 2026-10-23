---
row: SR-07
agent: coder-execution
date: 2026-10-23
status: complete
---

# SR-07 Layanan templat v2 (`src/lib/studio/services/templates/**`)

- Berkas: `index.ts` (ubah), `v2.ts` (baru), `import.ts` (ubah), `profile.ts` (aditif: medan profil `skeleton`, `isPreset`).
- `createTemplateV2` / `createTemplateVersionV2` (+ varian `...InTx(tx, ...)` untuk seed SR-36): SATU transaksi = templat/versi + `baseVersionId` versi preset + esensial ∪ lanjutan (overrides datar, KD-21) + roleFormats milik + kerangka M10-M12 + `skeletonSha256` (D-163 T-2). Kerangka, sidik, `writeSkeleton`, `getSkeleton`, `checkTemplateWrite` = layanan SR-06 (dipakai, tidak diduplikasi; D-182 400 turunan ditegakkan SR-06 tahap 4).
- `isPreset`: buat preset hanya ADMIN (403 FORBIDDEN `PRESET_ADMIN_ONLY`); versi preset non-ADMIN 403 `PRESET_READONLY` (juga jalur v1 datar dan impor). `listTemplates({ preset })`, `TemplateSummaryAccess.isPreset`, `TemplateVersionDtoAccess.skeletonSha256`.
- `getTemplateV2(id, ver, { includeAdvanced })`: definisi `studio.template/v2` (preset + esensial; lanjutan + roleFormats hanya bila includeAdvanced; tanpa itu `version.overrides` dipangkas ke esensial + proyeksi medan kenop). Definisi null bila versi tanpa kerangka (implisit).
- Impor profil membawa kerangka (`profile.skeleton`, divalidasi SR-06) + `isPreset`; profil tanpa kerangka membawa kerangka versi terbaru; sidik idempoten profil lama tidak berubah. v1 datar `createTemplateVersion` juga membawa kerangka versi sebelumnya.
- `loadResolvedTemplateV2File(file, { repoRoot, presetFiles? })` diekspor (D-160): preset dicari `presetFiles[slug]` -> `<dir>/<slug>.preset.json` -> `<dir>/presets/<slug>.json` -> `<dir>/template.json` bila slug-nya = slug preset; `datum-kanonik`/tanpa preset = kanonik. Mengembalikan `{ template, slug, droppedDerived, ignoredFields, definition, skeleton, skeletonSha256, preset }`.

## Gerbang (D-133)
- `npx tsc --noEmit -p tsconfig.json`: 0 galat di `services/templates`, `services/skeleton`, `api/studio/templates`; 174 galat di luar area (baris paralel: `services/submit` belum ada, `components/studio/{template-editor,section-composer,playground,document-viewer,template-preview}`).
- `npx eslint src/lib/studio/services/templates`: exit 0.
- Asap tsx (DB `gsp_agent_hq_v21`, `current_database()` dicek): 31 PASS / 0 FAIL. Preset ADMIN + templat USER (preset + esensial + 7 slot) dalam transaksi rollback: M10 7 baris, `slot.setup` M11 essential, skeletonSha256 = SR-06 baca ulang; 403 PRESET_READONLY, 403 PARAM_SURFACE_FORBIDDEN (kunci lanjutan slot, `slot.setup.marginTw`), 400 PARAM_CLASS_T_READONLY (turunan USER dan ADMIN non-preset), 422 SLOT_PARAM_SCOPE_INVALID, 422 PARAM_UNKNOWN_KEY, 400 SKELETON_POSITION, 409 VERSION_CONFLICT, kenop medan USER versi 2 OK; hitungan sebelum = sesudah {template 3, version 8, slot 0, slotParam 0, slotRole 0}. Pemuat berkas: preset M000 (template.json) + esensial kosong -> sha params = profil v1 (d824a239ae857570), 70 peran, 6 slot.

## Keputusan untuk controller
1. Perubahan dihitung relatif nilai EFEKTIF sebelumnya (override = nilai warisan preset bukan perubahan) agar kenop pra-isi UI (mis. Klasifikasi K) lolos untuk USER.
2. Non-ADMIN: kunci lanjutan/roleFormats tersembunyi yang tidak dikirim DIBAWA dari versi lama; kunci bermedan kenop digabung `{...sebelum, ...kiriman}`. Override lama yang kini asing/kelas T tidak dibawa (log `TEMPLATE_PARAM_SKIPPED`; migrasi SR-36).
3. Jalur v1 datar: non-ADMIN kini dibatasi lapis (esensial saja, roleFormats ADMIN); jalur ADMIN v1/impor warisan tanpa cek lapis/turunan (template.json M000 menyematkan turunan). Uji S74 yang mengunci perilaku lama -> SR-43.
4. Preset wajib untuk templat non-preset di v2 (400 SCHEMA_INVALID); rujukan harus templat `isPreset` dan bukan dirinya; preset terbatas (D-98) ditolak FORBIDDEN untuk pemanggil tidak tepercaya.
5. Konvensi berkas preset di atas mengikat SR-32 (template.v2.json `preset.slug = "datum-manual-000"` cukup dengan template.json bersebelahan); `preset.version` diabaikan di mode berkas (dilaporkan `ignoredFields`).

## Permintaan / temuan
- SR-61: komentar header route dan pemetaan GET non-ADMIN memakai `getTemplateV2(..., { includeAdvanced: isAdmin })`. Route SR-26/SR-61 sudah memakai `splitBySurface`, `surfaceOfKey`, `essentialProjection` (tetap diekspor).
- Urutan galat: bentuk/kerangka (termasuk kunci slot asing) dievaluasi sebelum cek peran pada R02 v2 (11.1 skema lebih dulu); penyimpangan kecil dari §13.5 langkah 1-2.
