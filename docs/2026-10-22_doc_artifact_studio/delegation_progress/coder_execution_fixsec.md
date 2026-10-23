---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: FIX-SEC
date: 2026-10-23
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/05_structural_sections_blueprint.md (loop perbaikan siklus 1; D-247 butir 2, D-248)
status: complete
---

# Implementation Report: FIX-SEC (SR-57 N-03, N-05, N-06, N-07, N-08)

Skill: `security-and-hardening`, `dry-run-verify-fix`. Klaim: `delegation_progress/file_claims.md` (3 baris FIX-SEC). Semua tulisan atomik (tmp lalu rename), kecuali satu suntingan kecil Edit di `sanitize.ts`.

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| N-03 | `safeNext` menolak varian normalisasi jalur | complete | Mengembalikan bentuk ternormalisasi `pathname+search+hash`, bukan `raw` |
| N-05 | Retensi log soffice/storage/Studio | complete | soffice ke `appendJsonlDaily`; sink tata letak storage diberi batas ukuran |
| N-06 | `redactSecrets` userinfo URL + Authorization utuh + `pwd` | complete | |
| N-07 | Kuota unggah aset + tulis ganda | complete | Kuota per pemanggil 24 jam + cek disk; salinan datar jadi hard link (pembaca tidak diubah) |
| N-08 | Perbandingan rahasia waktu-konstan | complete | node: HMAC + `timingSafeEqual`; edge: Web Crypto HMAC + XOR penuh |
| - | Login bebas regex rusak | complete | 0 escape `\u` di `src/app/login/*`; chunk yang dilayani :9021 memuat kode baru |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| `src/app/login/safe-next.ts` | modify | Tolak segmen `.`/`..`, `%2f`/`%5c`/`%2e`/`%25` di path, kendali terenkode `%00-%1f`/`%7f` di mana pun, `/login/`; hasil = URL ternormalisasi, dicek ulang tidak diawali `//` dan tanpa `\` |
| `src/lib/require-session.ts` | modify | `secretEqualsConstantTime` (HMAC-SHA256 kunci acak per proses + `timingSafeEqual`); hapus kembali-awal berbasis panjang |
| `src/middleware.ts` | modify | `secretEqualsEdge` (Web Crypto, kunci HMAC acak per isolat, XOR penuh 32 byte) untuk `x-internal-secret` dan tanda tangan cookie HQ; tidak diekspor |
| `src/lib/studio/http/sanitize.ts` | modify | Pola userinfo URL `scheme://[redacted]@`, nilai `Authorization`/`Proxy-Authorization` utuh (skema apa pun, berkutip atau tidak), `Basic <b64>` tanpa header, kunci `pwd`/`passphrase` (teks dan `isSecretKey`); idempoten |
| `src/lib/studio/engine/soffice/log.ts` | modify | Sink berkas bawaan lewat `appendJsonlDaily("soffice","soffice")` (retensi 90 hari, 50 MiB per berkas; nama berkas sama) |
| `src/lib/studio/services/storage/log.ts` | modify | `createLayoutLogSink`: batas ukuran per berkas `STUDIO_LAYOUT_LOG_MAX_BYTES` (bawaan 10 MiB, minimal 64 KiB), entri di atas batas dibuang + satu warn console. Umur ikut folder revisi/artefak |
| `src/lib/studio/services/images/asset-store.ts` | modify | `assertAssetQuota` / `assetQuotaScope` / `assetQuotaLimits`; dipanggil di `storeAssetRow` hanya untuk sha256 baru; salinan datar lewat `linkAssetCopy` |
| `src/lib/studio/services/images/store.ts` | modify | `linkAssetCopy`: hard link shard -> `assets/<sha>.<ext>`, cadangan `writeAssetFile` bila link gagal (log `IMAGE_LINK_FALLBACK`) |
| `src/lib/studio/services/images/index.ts` | modify | Ekspor helper baru |
| `src/app/api/studio/assets/route.ts` | modify | Detail `RATE_LIMITED` (angka kuota, tanpa path) dipertahankan di respons; dokumentasi galat 429/500 |
| `tests/unit/studio/security/*.test.ts` | add | 5 berkas, 77 uji |

## Bawaan kuota dan retensi (beralasan, env opsional)

| Kontrol | Bawaan | Env | Alasan |
|---|---|---|---|
| Kuota byte aset baru per requester sesi | 512 MiB / 24 jam bergulir | `STUDIO_ASSET_QUOTA_BYTES_PER_DAY` (min 1 MiB) | 25 aset ukuran maksimum 20 MiB, atau ratusan gambar dokumen biasa per hari; dedupe tidak dihitung |
| Kuota ember internal (semua pemegang `x-internal-secret`, agentId hanya label) | 2 GiB / 24 jam | `STUDIO_ASSET_QUOTA_INTERNAL_BYTES_PER_DAY` | Satu ember untuk banyak agen; selaras dengan identitas laju `INTERNAL_AGENT:shared` |
| Ruang disk minimum tersisa | 2 GiB (dihitung 2x byte unggahan untuk kasus cadangan salinan) | `STUDIO_ASSET_MIN_FREE_BYTES` | Cadangan untuk DB, log, keluaran render |
| Log JSONL (api/ingest/revisions/skeleton/submit/storage/structure/templates + **soffice**) | 90 hari, 50 MiB per berkas, 21 bagian per hari | `STUDIO_LOG_RETENTION_DAYS`, `STUDIO_LOG_MAX_FILE_BYTES` | Sudah ada (FIX-1 L-05); soffice kini ikut |
| Log tata letak `Log Render.jsonl` | 10 MiB per berkas | `STUDIO_LAYOUT_LOG_MAX_BYTES` (min 64 KiB) | Satu render menulis puluhan sampai ratusan baris; batas hanya tercapai oleh loop galat |

Galat kuota: 429 `RATE_LIMITED`, `details = { reason: "asset_quota_exceeded", bucket, quotaBytes, usedBytes, requestedBytes, windowHours: 24, retryAfterSec }`, header `Retry-After`. Disk kurang: 500 `STORAGE_WRITE_FAILED` (`reason: "insufficient_disk_space"`, dibuang dari respons R18 oleh `stripDetails`; pesan tetap jelas).

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Unit baru | `npx vitest run tests/unit/studio/security` | 5 berkas, 77/77 lulus | safe-next 42 (32 tolak + 7 terima + 3), redact 16, secret-compare 7, log-retention 5, asset-quota 7 |
| Regresi terkait | `npx vitest run tests/unit/require-session.test.ts tests/unit/middleware-devbypass.test.ts tests/unit/studio/api/auth.test.ts tests/unit/studio/api/client-log.test.ts tests/unit/studio/fix1` | 97 lulus / 14 gagal | 14 gagal = uji usang fix1 yang sama dengan baseline SR-57 (I-D) |
| R18 DB nyata (v21, fixture membersihkan diri) | `npx vitest run tests/unit/studio/api-structure/assets.test.ts` | 11/11 lulus | Melewati `storeAssetRow` + `aggregate` kuota + hard link |
| Suite Studio penuh | `npx vitest run tests/unit/studio` | 1812 lulus / 32 gagal (baseline D-239: 123 gagal) | Gagal di luar baris ini: `trust`/`pid`/`submit`/`revisions` (`withDocV2Targeting is not a function`, FIX-S sedang menyunting `documents/route.ts`), `fix1` (usang), `asset-bytes` + `docx-determinism` (fixture SR-41), `diagram-bad-cases` (FIX-B) |
| Typecheck | `npx tsc --noEmit -p .` | 0 galat di berkas FIX-SEC; repo 34 galat | Semua di area lain: `engine/chart/core/*` (7), `services/ingest/v2.ts` (3, FIX-S), `tests/integration/studio/studio-db.integration.test.ts` (24, SR-49) |
| Lint area | `npx eslint <10 berkas src area> tests/unit/studio/security/` | 0 masalah | |

## Verification

- N-03: probe `tsx`: `"/.//evil.com" -> /`, `"/..//evil.com" -> /`, `"/%2f%2fevil.com" -> /`, `"/%5cevil.com" -> /`, `"/%09/evil.com" -> /`, `"/studio/documents" -> /studio/documents`. curl :9021: `/login` 200, `/login?next=/.//evil.com` 200 (halaman), `/studio` 307 -> `/login?next=%2Fstudio`. Pengalihan pasca-login tidak diuji E2E (tanpa sesi palsu, sesuai brief); diuji di level fungsi.
- Login regex: `grep '\\u00' src/app/login/*` = 0. Chunk `/_next/static/chunks/src_app_login_*.js` yang dilayani :9021: 0 `u0000-`, memuat `ENCODED_PATH_META_RE`/`DOT_SEGMENT_RE` (kode baru).
- N-08: grep `.length === x.length` / `!==` di `require-session.ts` dan `middleware.ts` = 0 (diuji statis di `secret-compare.test.ts`); perilaku: rahasia benar lolos, salah isi/panjang beda/kosong = 401, env kosong fail-closed (node dan middleware).
- N-06: probe yang sama dengan SR-57 (`postgresql://u:p@`, `Authorization: Basic`, `pwd=`) kini menghasilkan `[redacted]`.
- N-05: uji menulis `logs/soffice/soffice-<hari ini>.jsonl`, memurge `soffice-2020-01-01.jsonl`, berpindah ke `.1` saat penuh; sink tata letak berhenti di bawah 64 KiB.
- N-07: kuota tepat batas lolos, +1 byte 429 dengan `Retry-After` dari entri tertua; ember internal bersama; disk kurang 500; `nlink = 2` dan `ino` sama untuk shard + datar; `readImageAsset` tanpa path (datar) dan dengan `relPath` shard keduanya lulus.

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| tsc repo tidak 0 (34 galat) | 0 (bukan area ini) | Penyuntingan paralel baris lain (chart engine, FIX-S ingest v2, SR-49 integrasi) | Dilaporkan ke controller | Tidak untuk FIX-SEC |
| Kode galat 507 khusus disk penuh belum ada | - | `contract/errors.ts` milik SR-04 (di luar area) | Memakai `STORAGE_WRITE_FAILED` 500 | Tidak |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| N-07 | Hapus tulis ganda: pembaca jalur datar masih banyak (`engine/docx/figures/media.ts:206-207`, `engine/docx/wrapper/media.ts:251-256`, `services/render/common.ts:192`, `services/ingest/assets.ts`, `artifacts/_lib/prepare.ts:163`, cadangan D-175 R18) dan di luar area | Salinan datar TIDAK dihapus; diganti hard link (isi disimpan sekali, pembaca tidak berubah). Penghapusan entri datar sepenuhnya menunggu pembaca dimigrasi ke `relPath` (IP-47 sisa, pemilik engine/render/ingest) |
| N-07 | Per dokumen vs per pengguna | Dipilih per pengguna (requester) + ember internal bersama: baris M13 tidak terkait dokumen, dan kuota di layanan juga menutup `assets` base64 kiriman. Kuota per dokumen tidak diterapkan |
| N-07 | Unggah serentak bisa melampaui kuota sedikit (cek lalu tulis, tanpa kunci) | Diterima sebagai batas lunak; dibatasi laju 60/menit route |
| N-07 | Cek disk gagal-terbuka bila `statfs` tidak terbaca | Dicatat warn `IMAGE_ASSET_DISK_CHECK_FAILED`; kuota byte tetap berlaku |
| N-08 | Helper edge tidak diekspor dari `middleware.ts` | Hindari ekspor non-standar dari berkas middleware; diuji lewat perilaku `middleware()` |
| N-03 | `%2f`/`%2e`/`%25` hanya ditolak di bagian path; di query diterima | Query tidak memengaruhi origin; uji `"/studio?q=a%2Fb"` diterima |
| Format | `src/middleware.ts` berkas kerja ber-CRLF, HEAD ber-LF; kini LF (sama dengan HEAD) | Diff minimal terhadap HEAD |

## Next Steps

- Security review ulang (D-247 butir 2) atas N-03, N-05..N-08: review recommended (lingkup: berkas di tabel Changes Made).
- IP-47 sisa: migrasi pembaca jalur datar ke `relPath`, lalu hapus `linkAssetCopy`.
- Bila kode 507 diinginkan: tambah `INSUFFICIENT_STORAGE` di `contract/errors.ts` + `enums.ts` (SR-04).
