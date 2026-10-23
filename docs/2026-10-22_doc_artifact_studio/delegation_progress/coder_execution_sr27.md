---
row: SR-27
agent: coder-execution
date: 2026-10-23
status: complete
---

# SR-27 Route registri R03

- Berkas: `src/app/api/studio/registry/route.ts` (satu-satunya berkas kode; klaim di file_claims.md prefiks SR-27).
- Kind baru (pakai `REGISTRY_KINDS` kontrak, 12 kind): `presets` (DB `isPreset` aktif, impor Prisma malas, status terbatas D-98 lewat `templateRestriction`, `no-store`); `essentials` (`items` 30 + `global` + `bySectionType` semua C33 + `meta.fieldPaths` = `ESSENTIAL_FIELD_PATHS` D-171 + `withinLimits`; pelanggaran batas PT-07 dicatat warn `ESSENTIAL_SURFACE_LIMIT` ke log JSONL); `slots` (`SLOT_KINDS` + contentModes, repeatable, C32a, perangkat halaman); `paramScopes` (743 kunci {id,key,class,scope,surface} + `meta.rules = PARAM_SCOPE`; filter `scopeKind`, `surface`, `sectionType` via `isScopeAllowedInSlot` dengan admits bawaan).
- `params`: hitungan 743 (+ `structure` 21, `bySurface`, `byScopeKind`, filter `surface=`) sesuai permintaan SR-05 file_requests.
- `schema`: menerima SID01-SID05 + `common/v1` + `common/v2` (D-172 / permintaan SR-04).
- Filter tak dikenal -> 400 REGISTRY_KIND_UNKNOWN (pointer `/query/<nama>`), konsisten dengan `class`/`origin` lama.

## Bukti penjaga (D-133)
- `npx tsc --noEmit -p tsconfig.json`: 10 galat, 0 di area SR-27. Di luar area (dicatat, tidak diperbaiki): `chapters/_shared/submit-kit.ts`, `documents/route.ts` (modul `services/submit` belum ada, SR-12), `documents/[id]/paragraphs/[pid]/route.ts` (`patchPid`/`pidHistory`, pemilik services/revisions), `services/templates/index.ts` 6 galat (SR-07 sedang berjalan).
- `npx eslint src/app/api/studio/registry/route.ts`: exit 0.
- Asap handler (tsx, GET langsung, sesi lewat x-internal-secret uji): `kind=essentials` 200, count 30, global 8, per jenis slot {cover 7, controlSheet 1, signatureBlock 1, toc 2, chapter 7, appendix 3, sourceRegister 1, ruleIndex 0}, maks 8, withinLimits true; `schemaId=studio.chapter/v2` 200 `application/schema+json` `$id` .../studio.chapter/v2.json; doc/slot/template v2, common/v2, skeleton/v1, doc/v1 juga 200; slots 200 (8); paramScopes 200 (743; document 368, section 346, shared 25, slot 4); params 743 = expected; kind/sectionType/schemaId salah -> 400; presets 200 count 0 (DB v21, seed SR-36 belum jalan).

## Catatan / temuan
- `paramScopes.byScopeKind.section` = 346 (D-168 menyebut section 309 + device 37 = 346; route memakai `parseParamScope`, device = `section:<perangkat>`). Konsisten.
- Permintaan lintas pemilik: tidak ada. Saran (tidak blocking): bila SR-07 menambah `listTemplates({ preset })`, `kind=presets` dapat beralih ke layanan itu.
