# INT-E coder-execution: helper HTTP bersama + client-log + roleFormats validate + chartCode (IP-08..IP-11, D-72)

Status: complete. Skills: backend-execution, dry-run-verify-fix.

Berkas BARU `src/lib/studio/http/`: `index.ts`, `log.ts` (JSONL `<akar>/logs/api/studio-api-YYYY-MM-DD.jsonl` + console), `context.ts` (ReqCtx, x-correlation-id, json, NO_STORE), `errors.ts` (reject/schemaInvalid/failure §6.3 tanpa stack), `body.ts` (batas content-length + chunked, JSON_MALFORMED), `validation.ts`, `sanitize.ts` (redactPaths/stripStack dari S102, redactSecrets, sanitizeJson/Route), `rate-limit.ts`, `client-log.ts` (skema+sanitasi), `multipart.ts` (assertMultipartLength + baca berbatas + formData; terpisah dari index).
BARU route: `src/app/api/studio/client-log/route.ts` (requireSession, 16 KiB, 30/menit per sesi -> 429 + Retry-After, 202 `{accepted, correlationId}`, source log `studio.client`).
DIUBAH: route templates, templates/[id], registry, render-env (+ `_lib/status.ts`), documents, documents/[id], blocks/[address], revisions, validate, artifacts (+ `_lib/request.ts`, `_lib/prepare.ts`, `_lib/dto.ts`), files/[id], `templates/_lib/validate.ts`. Dipangkas ke bagian khusus route: `validate/_shared/route-kit.ts` (failFrom P2002, DTO, bodyAgentId), `documents/[id]/blocks/_lib/http.ts` (decodeAddressParam). DIHAPUS (duplikat penuh, digantikan modul bersama): `templates/_lib/http.ts`, `artifacts/_lib/http.ts`.

IP-10: `roleFormats` opsional di badan validate -> `validateRoleFormats` S49 (tidak sah = 200 valid:false pointer `/roleFormats/...`), ditimpakan per peran atas templat DB, diteruskan ke `ingestDocument({dryRun, template})` + pratinjau. Bukti: HTML pratinjau berubah (`14.5pt`, `B00000` muncul), peran asing -> `PARAM_UNKNOWN_KEY` /roleFormats/notARole.
IP-11: `chartCode` = `spec.kind` artefak CHART (null selain itu) pada item daftar R09. Bukti tsx DTO: P-01 -> "P-01", composite -> "composite", DIAGRAM/IMAGE -> null.
D-72: kontrak kini punya `FORBIDDEN` (delta S03-d2 INT-D) -> refresh non-admin render-env = 403 `FORBIDDEN` (sebelumnya `UNAUTHORIZED`; UI S102 hanya memeriksa status 403).

Uji asap (tsx, handler langsung, DB v21 baca saja, log ke scratchpad): 72 kasus sebelum vs sesudah, status+kode identik kecuali: (a) render-env refresh user 403 UNAUTHORIZED -> FORBIDDEN (D-72, disengaja); (b) validate sampel 500 -> 200 valid:true (sebelum: galat INT-C `resolveEnforcement is not a function` saat ingest sedang disunting paralel); (c) kasus berbasis data (documents/[id] real 200, rev=abc 404, revisions real 200, PATCH base 999 409) tidak dapat diulang karena DB v21 dibersihkan di antara dua run (hitungan Studio = 0 dokumen/revisi/job/artefak). client-log: anon 401, ok 202, bentuk konsol lama 202, rusak 400, >16 KiB 413, level salah 400, kunci asing 400, burst 40 -> 429 mulai entri ke-31. JSONL: 102 baris, 0 tanpa correlationId, 0 stack pada 4xx, rahasia (cookie, Bearer, token= query, path user) tidak tersimpan.

Penjaga: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/(app/api/studio|lib/studio/http)"` -> kosong (exit 1); total repo 2 galat di luar area (user-access 2). `npx eslint src/app/api/studio src/lib/studio/http` -> exit 0.

Keputusan (untuk register):
1. Medan log dibakukan `correlationId` (S54/S102 sebelumnya `correlation_id`); source per route (`studio.api.templates`, `.registry`, `.render-env`, `.artifacts`, `.files`, `.s56`, `studio.api` untuk R04/R05/R08). Semua galat 4xx kini dicatat warn (S54/S57 sebelumnya hanya 5xx/403/410) - hanya log, respons tidak berubah.
2. Perbedaan per route dipertahankan lewat opsi: UTF-8 ketat (R04/R08, `S55_BODY_OPTIONS`), 500 dengan `correlationId` di badan (R04/R05/R08, `exposeCorrelationId`), `stripDetails` R10, `NO_STORE` R09.
3. Pratinjau roleFormats: tumpang per peran atas roleFormats templat terresolusi (peran yang dihapus di draf tetap tampil dari versi tersimpan); `roleFormats` pada skema non-dokumen -> valid:false `/roleFormats` keyword `not`.
4. 429 client-log tanpa `code` (kontrak belum punya kode laju) - kandidat delta kontrak `RATE_LIMITED`.
Permintaan lintas pemilik: (i) helper klien bersama `reportClientError` S60/S61/S62/S101/S102 belum memanggil `POST /api/studio/client-log` (area UI, bukan INT-E); (ii) S101 `TemplatePreviewPane` dapat meneruskan `draftRoleFormats` sebagai `roleFormats` di badan validate; (iii) S62 dapat menghapus fallback `chartCodeOf`.
Temuan: DB v21 dikosongkan di tengah baris (kemungkinan IP-22); review recommended (S85/S87): `src/lib/studio/http/**`, client-log (sanitasi, rate-limit in-memory per proses).
