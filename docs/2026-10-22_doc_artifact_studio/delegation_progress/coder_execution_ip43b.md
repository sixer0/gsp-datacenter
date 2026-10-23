# coder-execution IP-43b (S85 R-13)

- Status: complete
- Berkas: `src/lib/studio/services/templates/index.ts`, `src/app/api/studio/templates/route.ts` (CRLF dipertahankan pada index.ts)
- Perubahan:
  - `createTemplateVersion`: non-ADMIN ubah profil kanonik -> `FORBIDDEN` 403, details `{ reason: "CANONICAL_ADMIN_ONLY", templateId }` (dulu PARAM_CLASS_K_FORBIDDEN).
  - `importTemplateProfile`: timpa profil kanonik lewat impor -> `FORBIDDEN` 403, details `{ reason: "CANONICAL_IMPORT_OVERWRITE", templateId }` (aturan aksi, bukan kunci K).
  - Route R01 `?import=profile` non-ADMIN -> `reject(ctx, "FORBIDDEN", ...)` (dulu PARAM_CLASS_K_FORBIDDEN).
  - `PARAM_CLASS_K_FORBIDDEN` tetap hanya dari `assertOverrideRights` (kunci kelas K yang berubah). Docstring diperbarui.
- Bukti (2026-10-23):
  - `npx tsc --noEmit -p tsconfig.json` -> exit 0, 0 `error TS` (seluruh repo).
  - `npx eslint src/lib/studio/services/templates/index.ts src/app/api/studio/templates/route.ts` -> exit 0.
  - Asap (vitest, Prisma tiruan `tests/unit/studio/api/_prisma.ts`, berkas uji di scratchpad, bukan di repo): 8/8 lolos.
    `SMOKE service FORBIDDEN {"reason":"CANONICAL_ADMIN_ONLY","templateId":"tpl-canon"}` + dbWrites `[]`;
    `SMOKE R02 user|google|agent 403 FORBIDDEN`; `SMOKE R01 import user|google|agent 403 FORBIDDEN`;
    regresi `SMOKE K regresi 403 PARAM_CLASS_K_FORBIDDEN` (USER ubah nilai K turunan).
- Permintaan (file_requests.md, tidak blocking): komentar header `templates/[id]/route.ts` (SR-61); 2 ekspektasi S74 `templates.test.ts` :128-134, :190-195 -> FORBIDDEN (SR-43). Uji S74 itu kini sengaja gagal 4 kasus (3 impor + 1 kanonik).
- Keputusan: penolakan impor yang menimpa kanonik (berlaku juga untuk ADMIN) diperlakukan sebagai aturan aksi -> FORBIDDEN, bukan kunci K.
- Temuan: tidak ada.
