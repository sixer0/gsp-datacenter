# S03 contract landing — catatan coder-execution

- Status: complete (2026-10-23). Marker: `implementation/01_contract_landed.md` (bukti lengkap, deviasi #1-15).
- Berkas: `prisma/schema.prisma` (+320/-0, 9 model + 11 enum), `prisma/migrations/20261022120000_add_studio/migration.sql` (sha256 c5b6b2fc...bc6a), `package.json`, `package-lock.json`, 80 berkas di `src/lib/studio/**` + `src/components/studio/template-preview/index.tsx` (30 lengkap + 51 stub).
- Migrasi: shadow `gsp_agent_hq_v21_shadow` dibuat; baseline 5 pernyataan drift IlSearchDoc; migrasi 66 pernyataan, DROP 0, CREATE TABLE 9, CREATE TYPE 11, non-Studio 0; `migrate deploy` ke v21; `migrate status` up to date; diff ulang = baseline; hitungan 7 tabel lama identik (WorkerTrace 1488, IlSearchDoc 18186).
- npm: ajv 8.20.0, fflate 0.8.3, playwright-core 1.62.1 (tepat); `db:migrate` -> `prisma migrate deploy`; `overrides.fast-uri = 3.1.8`.
- Penjaga: prisma validate exit 0; tsc grep studio kosong; eslint studio exit 0; registri section 51 (29/7/15); RENDER_PARAM_COUNT 25.

## Keputusan untuk dicatat controller

1. `overrides: { "fast-uri": "3.1.8" }` di package.json: transitif ajv 8.20.0 menarik fast-uri 3.1.9 (rilis 2026-10-19, melanggar aturan 14 hari). 3.1.8 = 2026-09-15, npm audit 0. Ajv eslint bersarang 6.12.6 -> 6.15.0.
2. `studioError` memakai `Response.json` (bukan NextResponse) agar errors/env aman di klien; `contract/index.ts` tidak mengekspor nilai `auth.ts`/`dispatch.ts`.
3. `FrontItem` memuat spacer/device (dibutuhkan §13).
4. Shadow DB `gsp_agent_hq_v21_shadow` dibiarkan ada untuk delta S03-dN.

## Permintaan lintas pemilik

- S32: akses `CHART_RENDERERS` hanya di dalam badan fungsi (dispatch mengimpor chart/core; peta malas).
- S69: `serverExternalPackages: ["playwright-core"]` di next.config.ts (sudah di spesifikasi §10).
- S48: ajv dibangun dari `STUDIO_SCHEMA_LOAD_ORDER` + `STUDIO_AJV_OPTIONS` (contract/index.ts).

## Temuan (tidak menghentikan, D-19)

- 21 galat tsc pra-ada di 6 berkas `src/app/**` (di luar area).
- `prisma format --check` melaporkan schema tidak terformat: pra-ada (salinan sebelum sunting juga gagal); tidak diformat agar diff tetap aditif.
- npm "allow-scripts": skrip install @prisma/client, prisma, esbuild, sharp, unrs-resolver tidak dijalankan otomatis; `prisma generate` dijalankan manual (exit 0).
- `npm audit` repo: 32 kerentanan pra-ada (4 critical, 20 high), tidak terkait paket baru.
- Tidak ada sink log galat persisten di repo (tidak ada model ErrorLog); kontrak tidak menambah jalur catch selain fallback identitas di auth.ts (pola require-session).
