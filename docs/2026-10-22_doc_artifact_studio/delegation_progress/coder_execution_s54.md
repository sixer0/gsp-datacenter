# S54 coder-execution: route templates + registry

Status: complete (penjaga lolos; uji route penuh milik S74).

Berkas (area eksklusif S54):
- `src/app/api/studio/templates/route.ts` (R01 GET daftar, POST buat, POST `?import=profile` impor profil JSON admin)
- `src/app/api/studio/templates/[id]/route.ts` (R02 GET `?version=n`, POST versi baru, PATCH = alias POST)
- `src/app/api/studio/templates/_lib/http.ts` (batas 5 MiB -> 413, JSON_MALFORMED, log JSONL `<STUDIO_WORKSPACE_ROOT>/logs/api/`, x-correlation-id, 500 tanpa stack)
- `src/app/api/studio/templates/_lib/validate.ts` (validasi bentuk berpointer, CHANGE_NOTE_REQUIRED, hak override via `assertOverrideRights` S11 + `validateParamValue`)
- `src/app/api/studio/registry/route.ts` (R03 sections/params/charts/diagram/symbols/lint/roles/schema, unduh `download=1`)

Bukti:
- `npx tsc --noEmit -p tsconfig.json | grep -E "src/app/api/studio/(templates|registry)"` -> kosong (exit 1). Total 26 baris galat di luar area: 6 berkas pra-ada + `src/lib/studio/services/ingest/checks.ts` 2 (milik S48).
- `npx eslint src/app/api/studio/templates src/app/api/studio/registry` -> exit 0.
- Smoke tsx (handler dipanggil langsung, header x-internal-secret uji): anonim 401; sections 51; params 698 (673+25; K 289, B 373, T 36); charts 76 (drawn 58); diagram 9; symbols 41; lint 99; roles 70; schema `studio.doc/v1` application/schema+json + attachment; kind salah 400 REGISTRY_KIND_UNKNOWN; JSON rusak 400 JSON_MALFORMED; slug salah 400 SCHEMA_INVALID; tanpa changeNote 400 CHANGE_NOTE_REQUIRED; kunci asing 422 PARAM_UNKNOWN_KEY; kelas K oleh agent 403; impor non-admin 403; content-length besar 413; GET [id] tak ada 404 TEMPLATE_NOT_FOUND (layanan S49 nyata); GET daftar 200. Tidak ada penulisan DB (semua POST ditolak validasi).

Keputusan (untuk controller):
1. PATCH `/templates/[id]` = alias POST (simpan = versi baru); brief menyebut PATCH, spesifikasi §6.2 menyebut POST.
2. Impor profil = `POST /api/studio/templates?import=profile`, badan bentuk `benchmark/manual000/template.json` (`meta.slug/name/kind`, `overrides`, `roleFormats`, `sectionPlan`, `changeNote`); hanya ADMIN_SESSION (403 PARAM_CLASS_K_FORBIDDEN); `base` slug tidak dipetakan ke `baseVersionId`; slug sudah ada -> 409 (tanpa versi baru otomatis).
3. Registry: respons `{ kind, count, items, meta }` (aditif atas `{ kind, items }`); filter params `class/group/chapter/origin`; `schemaId=common/v1` juga diterima (dirujuk `$ref` skema lain); schemaId salah -> 400 REGISTRY_KIND_UNKNOWN; `Cache-Control: private, max-age=300`.
4. GET daftar: `archived` default false (`archived=0`); kind/archived tak sah -> 400 SCHEMA_INVALID.
5. `registry/route.ts` mengimpor `../templates/_lib/http` (keduanya area S54).

Permintaan lintas pemilik: tidak ada. Temuan: galat tsc `services/ingest/checks.ts` (S48) dilaporkan, tidak disentuh.
