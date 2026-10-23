# S74 Uji unit route dan layanan Studio (Prisma di-mock)

Baris: S74 (fase final G3). Agen: test-expert. Skills: tdd. Tanggal: 2026-10-23.
Status: needs-review. Hasil: 305 lulus, 1 gagal, 0 dilewati di 7 berkas. Satu kegagalan adalah bug produksi (F-S74-1, pemilik S54). Ekspektasinya tidak dilunakkan.

## 1. Strategi uji

- Lingkup (seam yang diuji):
  - Handler route publik `src/app/api/studio/**`. Ada 19 handler di 12 berkas route.
  - Layanan `src/lib/studio/services/{ingest,templates,revisions}`: `ingestDocument`, `createTemplateVersion`, `patchBlock`, `stripBenchmarkMarkers`. Layanan ini dipanggil langsung, dan juga lewat route.
  - `getStudioCaller`, `STUDIO_ERROR_HTTP`, `failure`, `studioError`, dan `studioErrorFrom`.
- Pengecualian:
  - DB nyata. `@/lib/prisma` diganti tiruan (`_prisma.ts`). Setiap metode yang tidak diatur uji akan melempar `unmocked prisma call`, sehingga akses DB yang tidak diharapkan langsung terlihat.
  - Port 9011 dan jaringan. Tidak dipakai.
  - Mesin render S51 (DOCX, soffice, Chromium). `renderRevision` dan `renderArtifact` ditiru dengan `vi.mock('@/lib/studio/services/render')`. Mesin ini milik S75, dan juga S72/S73 untuk renderer.
  - Unggahan gambar multipart dan R10 `files/[id]`. R10 hanya diuji untuk 401. Penyimpanan berkas milik S52/S53.
- Runner: Vitest 4.1.11 dengan `vitest.config.ts` (include `tests/**/*.test.ts`, environment node, alias `@`, `fileParallelism: false`). Repo tidak punya konfigurasi cakupan, jadi cakupan baris tidak diukur.
- Lingkungan uji (`_env.ts`) di-set sebelum Next memuat `.env` repo. `@next/env` tidak menimpa variabel yang sudah ada.
  - `NEXTAUTH_SECRET` dan `INTERNAL_API_SECRET` memakai nilai uji.
  - `NEXTAUTH_URL=https://127.0.0.1:9011`, seperti produksi. Akibatnya cookie NextAuth bernama `__Secure-next-auth.session-token`.
  - `STUDIO_WORKSPACE_ROOT` dan `SHARED_WORKSPACE` diarahkan ke `%TEMP%\gsp-studio-s74-<pid>`. Log JSONL tidak pernah ditulis ke repo maupun ke workspace bersama.
- Identitas nyata, bukan stub:
  - Cookie `gsp_hq_session` ditandatangani HMAC, persis seperti `createSessionToken`.
  - JWT NextAuth dibuat dengan `encode` milik `next-auth/jwt` (JWE asli).
  - Header `x-internal-secret`.
- Fixture:
  - Templat dibangun dengan `composeVersion` S49, sehingga `resolvedParams` dan `paramsSha256` nyata.
  - Templat TERBATAS memakai `lint.enforcementOverride = {DATUM-04: release, DATUM-19: release}`.
  - Dokumen memakai bentuk minimal `docs/STUDIO-AGENT-GUIDE.md` §3. Pelanggaran dipicu oleh judul pertanyaan (DATUM-04) dan oleh "PPN 10 %" (DATUM-19) pada tier TERBIT.
- Sumber ekspektasi (independen dari kode):
  - `01_specs.md` §6.1-§6.3 dan revisi d1/d2. Tabel kode galat ditulis ulang sebagai literal.
  - §7.1 C09, dan kriteria §7 butir 1, 2, 5, 6.
  - `docs/API-REFERENCE.md` §12.
  - D-63, D-70, D-90, D-91, D-98, D-102, D-107, D-114.
  - Docstring kontrak layanan.
- Area tulis: hanya `tests/unit/studio/api/**` dan laporan ini. Tidak ada kode produksi yang diubah. Blueprint menulis `studio/unit/api`, sedangkan pesan tugas menetapkan `tests/unit/studio/api/**`. Pesan tugas yang diikuti.

## 2. Berkas uji (`tests/unit/studio/api/`)

| Berkas | Isi | Lulus | Gagal |
|---|---|---|---|
| `auth.test.ts` | 401 anonim di 19 handler (badan `{error:"Unauthorized"}`, tanpa `x-correlation-id`, 0 akses DB) + penjaga cakupan ekspor handler; 401 untuk secret salah, env secret kosong, cookie salah tanda tangan/kedaluwarsa, JWT secret lain; 3 jalur auth -> 200 (cookie ADMIN/USER, NextAuth, secret); pantulan `x-correlation-id`; klasifikasi `getStudioCaller` (ADMIN_SESSION, USER_SESSION termasuk `r:"admin"`, GOOGLE_SESSION, INTERNAL_AGENT, agentId 80, prioritas cookie, agentId tidak menaikkan hak, UNAUTHORIZED); render-env `refresh=1` non-admin 403 FORBIDDEN | 41 | 0 |
| `templates.test.ts` | R01: K oleh user/google/agent 403 tanpa tulis DB; K oleh ADMIN 201 (dasar = kanonik v1); T 400 untuk semua termasuk ADMIN; kunci asing 422; urutan K sebelum T; B oleh agent 201 (createdBy = agentId); CHANGE_NOTE_REQUIRED; TEMPLATE_SLUG_EXISTS; `?import=profile` non-admin 403. R02: ubah K non-admin 403 (POST dan PATCH); ADMIN 201 versi 1->2 dengan kunci optimistik, versi lama tidak disunting; VERSION_CONFLICT 409 + `latestVersionNo`; kanonik oleh USER 403; layanan: K tak berubah lolos, K dihapus 403; route: K tak berubah + B berubah (GAGAL, F-S74-1) | 27 | 1 |
| `ingest.test.ts` | R04 201 untuk 4 identitas (docNumber sekuens `001/GSP/KT/X/2026`, render format diminta); 422 DATUM-04 untuk 4 identitas tanpa tulis DB/render; NOTA tidak menahan; 422 DATUM-19; K dokumen non-admin 403 berpointer `/document/overrides/...`, ADMIN 201; T 400; templat terbatas 403 (user/google/agent, `reason TEMPLATE_RESTRICTED`, log `TEMPLATE_RESTRICTED_DENIED`), ADMIN 201 rilis FAIL; `x.lintEnforcement` dan `x.benchmark` dibuang untuk non-admin (422 + log), dihormati ADMIN (201, penanda tersimpan di snapshot); SCHEMA_INVALID berpointer, TEMPLATE_NOT_FOUND, DOC_NUMBER_EXISTS, 503 PDF-only, render gagal tetap 201, 500 generik + correlationId. R08: terbatas 403 (badan ingest, bentuk `{schemaId, spec}`, roleFormats draf), ADMIN 200 valid; pelanggaran = 200 `valid:false` (bukan 422) tanpa tulis DB; K = `valid:false` keyword PARAM_CLASS_K_FORBIDDEN; temuan REPORT `ENFORCEMENT_OVERRIDE_STRIPPED`/`BENCHMARK_MARKER_STRIPPED`. Layanan: dryRun + terbatas melempar FORBIDDEN; `trustedHarness` lolos; `enforcement:"report"` tak tepercaya diabaikan, ADMIN dihormati; non-dryRun melempar 422; strip tidak memutasi | 57 | 0 |
| `artifacts.test.ts` | R09 HTML inline: 422 DATUM-04 untuk 4 identitas dengan pointer `/source/document/...`, TANPA `StudioArtifact.create` dan tanpa render; `x.lintEnforcement` dibuang -> 422; K dokumen inline 403; ADMIN + penanda 201 lalu render; templat terbatas 403 (inline dan sumber dokumen tersimpan) tanpa baris; ADMIN + terbatas 201 dengan `templateVersionId` terpin; amplop asing 400; `$schema` dokumen ditolak; format salah 400; kode chart di luar registri 400 `/kind`; kode drawn=false 422 CHART_KIND_NOT_DRAWN + `alternatives`; JSON rusak 400 | 22 | 0 |
| `revisions.test.ts` | PATCH `1.1.1` replace -> 200 revisi 2 (parent 1, apa/mengapa/dampak, `changedAddresses`, blockId dipertahankan, templat terpin sama, indeks blok rev2, render rev2); revisi n tidak diubah (tulis = updateMany dokumen + create revisi + createMany blok); insertAfter -> `1.1.2` blockId baru; isi identik 400; CHANGE_FIELDS_REQUIRED x3 di route (0 akses DB) dan di layanan; ADDRESS_INVALID x3; ADDRESS_NOT_FOUND; DOCUMENT_NOT_FOUND; REVISION_CONFLICT (usang dan balapan transaksi); baseRevisionNo string 400; 422 DATUM-19 untuk 4 identitas tanpa transaksi; templat terpin terbatas 403 untuk non-admin, ADMIN 200 meski PPN 10 %; GET blok `?rev=1`, `?rev=0` 400, `?rev=5` 404; R07 RENDER_IN_PROGRESS 409, `identical:true` tanpa tulis, format/revisi salah | 29 | 0 |
| `http-errors.test.ts` | C09 = 5242880; 41 kode = `STUDIO_ERROR_CODES`; 39 kode literal §6.3/d1/d2 -> HTTP; 2 kode "dalam job" -> 5xx; `failure()` per kode (status, badan `{error,code,details}`, correlation id); `studioError` tanpa details; galat tak dikenal 500 tanpa pesan; StudioNotImplemented tanpa moduleId; REGISTRY_KIND_UNKNOWN; 413 lewat content-length dan lewat stream chunked untuk 6 route berbadan (0 akses DB); tepat 5 MiB bukan 413; JSON rusak/kosong 400 di 6 route; UTF-8 tidak sah 400 di R04/R08 | 112 | 0 |
| `client-log.test.ts` | 202 untuk 4 identitas tanpa DB, `Cache-Control: no-store`; correlationId klien dipakai; alias lama diterima; sanitasi (Bearer, JWT, `token=`, query `session=`, fragmen, path profil, kunci `password`/`apiKey` di detail -> `[redacted]`); identitas dicatat tanpa cookie/secret; kunci asing 400; 5 bentuk tidak sah 400 berpointer; > 16 KiB 413; JSON rusak 400; entri ke-31 per sesi 429 + `Retry-After`, sesi lain 202 | 17 | 0 |
| `_env.ts`, `_prisma.ts`, `_studio.ts` | Lingkungan uji; Prisma tiruan berbasis Proxy (`on`, `callsOf`, `dbCalls`, `dbWrites`); pembuat identitas, permintaan `NextRequest`, dokumen, templat, tangkapan log | - | - |

## 3. Inventaris kasus kunci (kriteria tugas)

| Kasus | Kategori | Masukan | Diharapkan | Aktual | Status |
|---|---|---|---|---|---|
| Anonim di 19 handler | auth | tanpa header | 401 `{error:"Unauthorized"}`, 0 akses DB | sesuai | PASS |
| Cookie HQ / NextAuth / secret | auth | identitas sah | 200 + `x-correlation-id` | sesuai | PASS |
| K oleh USER/Google/agent (R01, R02, R04, R09 inline) | hak | `naming.underscore.allowed` | 403 `PARAM_CLASS_K_FORBIDDEN`, tanpa tulis | sesuai | PASS |
| K oleh ADMIN (R01, R02, R04) | hak | sama | 201 | sesuai | PASS |
| K oleh USER di R08 | hak/dry-run | sama | 200 `valid:false`, keyword K | sesuai | PASS |
| Templat terbatas, non-admin (R04, R08 x3 bentuk, R09, PATCH, layanan dryRun) | otorisasi | `datum-terbatas` | 403 `FORBIDDEN` | sesuai | PASS |
| Templat terbatas, ADMIN/harness | otorisasi | sama | 200/201 | sesuai | PASS |
| `x.lintEnforcement`/`x.benchmark` non-admin | kepercayaan | penanda + DATUM-04 | dibuang, 422 / `valid:false` + REPORT | sesuai | PASS |
| Ingest by-construction | 422 | judul pertanyaan TERBIT | 422 `BY_CONSTRUCTION_FAILED` checkId DATUM-04 | sesuai | PASS |
| HTML artefak inline | 422 | sama | 422 sebelum `StudioArtifact.create` | sesuai | PASS |
| Revisi PATCH C.S.P | alur | replace 1.1.1 | revisi 2, revisi 1 utuh | sesuai | PASS |
| Revisi tanpa apa/mengapa/dampak | validasi | `why` kosong | 400 `CHANGE_FIELDS_REQUIRED` | sesuai | PASS |
| Badan > 5 MiB (header / chunked) | batas | 5242881 B | 413 `PAYLOAD_TOO_LARGE` | sesuai | PASS |
| R02 USER: K tak berubah + B berubah | hak | `{K:true (sama dgn v1), B:true}` | 201 versi 2 | 403 | FAIL (F-S74-1) |

## 4. Cakupan dan celah

- Handler: 19 dari 19 diuji untuk 401. Penjaga cakupan memastikan tabel uji sama dengan ekspor handler.
- Handler dengan uji perilaku lebih dalam: R01 POST, R02 POST/PATCH, R03, R04 POST, R06 GET/PATCH, R07 POST, R08, R09 POST, R11 (refresh), dan client-log.
- Celah. Dikecualikan dengan alasan; pemiliknya bisa menambah:
  - R04 GET, R05, R07 GET (diff), R09 GET, R10, dan R11 jalur baca. Untuk route-route ini hanya auth yang diuji, karena cakupan S74 diprioritaskan pada jalur tulis dan gerbang.
  - Multipart gambar (`ASSET_TOO_LARGE`, `ASSET_TYPE_UNSUPPORTED`, `DATUM-39`). Bergantung pada layanan gambar dan penyimpanan S53.
  - Cakupan baris tidak diukur karena repo tidak punya `@vitest/coverage-*`. Remediasi: tambah provider cakupan (keputusan controller, perlu dependensi).
- Observasi, bukan kegagalan: pointer temuan by-construction di R04/R08 relatif dokumen (`/chapters/0/sections/0/title`). Ini tidak memakai awalan `/document` seperti yang dikatakan docstring `src/lib/studio/services/ingest/index.ts:30`. Di sisi lain, `render/artifact.ts:284-292` mendokumentasikan perbedaan itu sebagai disengaja. Uji hanya mengunci akhiran pointer. Penyelarasan docstring diserahkan ke S48.

## 5. Cara menjalankan

```
npx vitest run tests/unit/studio/api
npx vitest run tests/unit/studio/api --reporter=verbose
npx vitest run tests/unit/studio/api/templates.test.ts
```

Keluaran segar (2026-10-23, `npx vitest run tests/unit/studio/api`, exit 1):

```
 ❯ tests/unit/studio/api/templates.test.ts (28 tests | 1 failed) 98ms
     × ROUTE: USER membawa K tak berubah + mengubah B -> 201 (selaras kontrak layanan) 8ms
 FAIL  tests/unit/studio/api/templates.test.ts > R02 POST|PATCH /api/studio/templates/[id] — versi baru dan hak kelas K > ROUTE: USER membawa K tak berubah + mengubah B -> 201 (selaras kontrak layanan)
AssertionError: expected 403 to be 201 // Object.is equality
 ❯ tests/unit/studio/api/templates.test.ts:234:24
 Test Files  1 failed | 6 passed (7)
      Tests  1 failed | 305 passed (306)
   Duration  9.09s (transform 2.44s, setup 0ms, import 6.80s, tests 1.36s, environment 0ms)
```

Hitungan per berkas dari `--reporter=json` (run ketiga, hasil identik):

```
total 306 passed 305 failed 1
tests/unit/studio/api/artifacts.test.ts passed=22 failed=0
tests/unit/studio/api/auth.test.ts passed=41 failed=0
tests/unit/studio/api/client-log.test.ts passed=17 failed=0
tests/unit/studio/api/http-errors.test.ts passed=112 failed=0
tests/unit/studio/api/ingest.test.ts passed=57 failed=0
tests/unit/studio/api/revisions.test.ts passed=29 failed=0
tests/unit/studio/api/templates.test.ts passed=27 failed=1
```

## 6. Catatan CI

- Suite deterministik. Tiga run berurutan menghasilkan 305/1 yang sama, dan tidak ada uji yang dikenal flaky.
- Uji laju client-log (31 permintaan) memakai nama sesi unik per uji, karena pembatas laju bersifat modul-global per proses.
- Setiap run membuat log JSONL di `%TEMP%\gsp-studio-s74-<pid>\logs\`, yaitu sink log `apiLog` dan layanan yang ditulis secara fire-and-forget. Direktori run sesi ini sudah dihapus. Di CI, direktori tersebut dapat dibersihkan setelah job.
- Konsol dibisukan per uji (`vi.spyOn(console, ...)`), karena route mencatat setiap penolakan.
- Peringatan Vite `configLoader: 'native'` (ESM di `vitest.config.ts`) sudah ada sebelumnya. Peringatan ini bukan dari S74.

## 7. Temuan (bug produksi)

### F-S74-1 (MAYOR, pemilik S54; terkait S58)

R02 memeriksa hak kelas K atas seluruh lapisan override, bukan hanya kunci yang berubah. Akibatnya USER/agent tidak dapat menyimpan versi baru dari templat mana pun yang sudah memuat override K hasil ADMIN.

Bukti:

- Route `src/app/api/studio/templates/[id]/route.ts:72` memanggil `assertOverridesAllowed(input.overrides, caller)`. Fungsi itu, di `src/app/api/studio/templates/_lib/validate.ts:215-216`, menjalankan `assertOverrideRights(overrides, ...)` atas SEMUA kunci, sebelum layanan dipanggil.
- Kontrak layanan menyatakan "untuk versi baru hanya kunci yang BERUBAH yang diperiksa" (`src/lib/studio/services/templates/index.ts:12`, `:501`). Layanan menegakkannya di `:532` dengan `changedOverrides(prev, next)`.
- `overrides` adalah lapisan LENGKAP. UI `src/components/studio/template-editor/template-editor.tsx:183` mengisi `draft` dari `version.overrides`, lalu `:259-265` mengirimnya utuh. Membuang kunci K tetap terhitung perubahan K, dan ini benar ditolak, seperti dibuktikan uji layanan "K dihapus 403".
- Uji layanan (lulus): USER, K tak berubah + B berubah, menghasilkan versi 2. Uji route (gagal): masukan yang sama menghasilkan 403 `PARAM_CLASS_K_FORBIDDEN`.

Dampak:

- Templat turunan ber-K, mis. `datum-manual-000` yang menurut D-44/D-50 memuat override K, tidak dapat disunting kelas B-nya oleh non-ADMIN lewat API maupun editor S58.
- Ini bertentangan dengan kriteria §7 butir 1 dan dengan baris S58 ("B dapat disunting, K terkunci kecuali admin").

Remediasi yang disarankan (pemilik S54, bukan S74): di R02, periksa hak terhadap `changedOverrides` versi terbaru. Cara lain: serahkan pemeriksaan hak sepenuhnya ke layanan, dan pertahankan hanya validasi nilai (`validateParamValue`) di route. R01 tidak terdampak karena templat baru tidak punya versi sebelumnya.

## 8. Rekomendasi

1. Controller merutekan F-S74-1 ke S54 (route R02). Setelah perbaikan, `npx vitest run tests/unit/studio/api` harus 306/306.
2. Selaraskan docstring pointer ingest (§4, observasi) di S48.
3. Tambahkan provider cakupan Vitest bila controller menyetujui dependensi baru.
4. Pemilik S55/S57 dapat memperluas uji baca R04 GET, R05, dan R09 GET dengan helper `_studio.ts` dan `_prisma.ts` yang sama.

## Berkas yang ditulis S74

- `tests/unit/studio/api/_env.ts`, `_prisma.ts`, `_studio.ts`
- `tests/unit/studio/api/auth.test.ts`, `templates.test.ts`, `ingest.test.ts`, `artifacts.test.ts`, `revisions.test.ts`, `http-errors.test.ts`, `client-log.test.ts`
- `docs/2026-10-22_doc_artifact_studio/test/s74_unit_api.md` (laporan ini)
