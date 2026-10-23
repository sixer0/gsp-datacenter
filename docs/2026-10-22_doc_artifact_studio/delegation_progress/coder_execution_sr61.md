# coder-execution SR-61 (route templat R01/R02 `studio.template/v2`)

- Status: complete
- Berkas: `src/app/api/studio/templates/route.ts` (LF), `src/app/api/studio/templates/[id]/route.ts` (CRLF dipertahankan). Klaim: `file_claims.md` prefiks SR-61.
- R01 GET: `?preset=0|1` (D-166; nilai lain 400), `isPreset` selalu boolean + `restricted`; filter diulang di route (pertahanan berlapis).
- R01 POST: amplop v2 `{ slug, name, kind, description?, isPreset?, changeNote, template, expertMode? }` -> `createTemplateV2` (SR-07, satu transaksi) 201 `{ template, version, skeletonSha256 }`; `isPreset: true` non-ADMIN -> 403 FORBIDDEN `PRESET_ADMIN_ONLY` (peran, D-146). v1 datar tetap; non-ADMIN dengan kunci non-esensial -> 403 `PARAM_SURFACE_FORBIDDEN` (per kenop: medan `ESSENTIAL_FIELD_PATHS` diizinkan, D-170/D-171). `?import=profile` tetap ADMIN.
- R02 GET: `?version=n&expert=0|1` -> `getTemplateV2(id, n, { includeAdvanced: ADMIN })`; non-ADMIN diproyeksi ulang (definition hanya `$schema`/`preset`/`essentials`/`skeleton` tanpa `advanced`/`roleFormats` slot, `version.roleFormats = {}`). `expert=1` USER tidak membuka lanjutan (D-163 T-1).
- R02 POST/PATCH: amplop v2 `{ baseVersionNo, changeNote, template, expertMode? }` = SATU versi (D-163 T-2) -> `createTemplateVersionV2`; PRESET_READONLY/FORBIDDEN/K/lapis per kunci berubah (D-134) di layanan. v1 datar HANYA ADMIN (lain 403 FORBIDDEN `V1_FLAT_ADMIN_ONLY`). Komentar header memuat FORBIDDEN (peran: ubah profil kanonik non-ADMIN) sesuai permintaan D-146.
- Bukti (2026-10-23):
  - `npx eslint src/app/api/studio/templates/route.ts "src/app/api/studio/templates/[id]/route.ts"` -> exit 0.
  - `npx tsc --noEmit -p tsconfig.json` -> 155 `error TS` seluruh repo, 0 di dua berkas SR-61; sisanya di baris paralel (components/studio/playground, section-composer, template-editor, document-viewer; api/chapters, api/documents; login/safe-next.ts; services/revisions/v2/ops.ts).
  - Asap vitest scratch (Prisma tiruan `tests/unit/studio/api/_prisma.ts`, layanan SR-07 NYATA untuk POST; `getTemplateV2`/`listTemplates` tiruan untuk GET; `revisions/v2/ops` di-mock karena modul `submit/pids` SR-13 belum ada): 10/10 lolos.
    `SMOKE R02 POST v2 user|google|agent -> 403 PRESET_READONLY details={"templateSlug":"datum-gsp-preset","templateId":"tpl-preset"} dbWrites=[]`;
    `SMOKE R02 GET user -> 200 includeAdvanced=false definition={"$schema":"studio.template/v2","preset":{...},"essentials":{"page.size":"A4"},"skeleton":{"slots":[{...,"essentials":{"slot.setup":{"startOnNewPage":true}}}]}} version.roleFormats={}`;
    ADMIN `includeAdvanced=true` + advanced/roleFormats; R01 `preset=1` -> hanya preset, `preset=x` 400; v1 R02 USER 403 V1_FLAT_ADMIN_ONLY; R01 v2 isPreset USER 403 PRESET_ADMIN_ONLY; R01 v1 USER kunci lanjutan 403 PARAM_SURFACE_FORBIDDEN.
- Keputusan untuk controller: (1) GET non-ADMIN MEMPERTAHANKAN `version.resolvedParams` (nilai efektif baca saja; dipakai playground/section-composer untuk `doc.typeCode`, lapis internal) — "hanya preset + esensial" diterapkan pada `definition`, `version.overrides`, roleFormats; (2) R01 POST v2 `isPreset` non-ADMIN memakai FORBIDDEN (register R01 tidak memuat PRESET_READONLY); (3) R02 v1 non-ADMIN ditolak FORBIDDEN sebelum cek kunci.
- Permintaan (file_requests.md, tidak blocking): UI template-editor/section-composer pindah ke v2 untuk simpan USER (SR-29); ekspektasi S74 `templates.test.ts` (SR-43).
- Temuan: tidak ada di area. DB tulis/HKCU/port 9011 tidak disentuh.
