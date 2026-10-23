# S87 — Security Review Studio (gerbang keamanan fase final)

| Medan | Isi |
|---|---|
| Baris | S87 (`identification/02_structured.md:235`) |
| Agen / skill | `security-review` / `security-review-gate` |
| Tanggal | 2026-10-23 |
| Repo / branch | `C:\Users\TRIAL\gsp-swarm-hq-v2.1`, branch `v2.1`; kode Studio belum di-commit, jadi yang direview adalah berkas kerja (`git status`: `src/lib/studio/`, `src/app/api/studio/`, `src/app/studio/`, `src/components/studio/`, `render-env/`, `scripts/parity/`, `benchmark/`, `prisma/seed-studio.ts` untracked; `next.config.ts` modified) |
| Batasan | Review statis saja. Tidak ada kode yang diubah, tidak ada tulis DB, port 9011 tidak disentuh, tidak ada panggilan jaringan keluar. Satu uji lokal Node (`node -e`, di luar repo) untuk perilaku JSON bersarang dalam |
| Status | **needs-review** (vonis CAUTION wajib diputuskan user lewat controller) |

## 1. Ringkasan

**Vonis keseluruhan: CAUTION.** Tidak ada temuan High, ada 5 Medium, 7 Low, dan 3 informasional.

| Tingkat | Jumlah | ID |
|---|---|---|
| High (gate FAIL) | 0 | - |
| Medium (gate CAUTION) | 5 | M-01, M-02, M-03, M-04, M-05 |
| Low (hardening) | 7 | L-01 sampai L-07 |
| Info | 3 | I-01 (lisensi fon F-034), I-02, I-03 |

- **Ketidaksesuaian GDPR:** tidak ada GAP yang memblokir. Ada 1 PARTIAL (Art. 5(1)(e): log JSONL tanpa retensi, L-05). Data pribadi yang ditangani terbatas pada identitas pemanggil (`user:<username>`, `agentId`) dan nama penulis/penanda tangan di dokumen.
- **Celah kontrol ISO 27001:** A.9 PARTIAL (M-04, M-05, L-02), A.12.4 PARTIAL (L-02, L-05), A.12.6 PARTIAL (audit dependensi tidak dijalankan karena larangan panggilan keluar), A.13 PARTIAL (M-03), A.14.2 PARTIAL (M-01, M-02).
- **Tingkat review: L3 (Deep Audit)**, karena lingkupnya mencakup eksekusi proses (soffice, Chromium, reg.exe), sistem berkas, dan kode identitas baru (`contract/auth.ts`). Catatan untuk controller: bila S87 dipakai sebagai gerbang rilis produksi dengan perubahan auth, skill menggolongkannya **L4**, dan L4 selalu butuh persetujuan user apa pun hasilnya.
- **Dimensi yang dilewati:** GDPR Art. 7 (persetujuan), Art. 20 (portabilitas), dan Art. 35 (DPIA) dinyatakan N/A. Studio memproses dokumen kerja internal, bukan data subjek, dan tidak ada aktivitas pemrosesan baru yang berbasis persetujuan. Alasan rinci per baris ada di §4.

### Vonis per area (sesuai brief S87)

| Area | Vonis | Temuan |
|---|---|---|
| Auth 3 jalur (cookie HQ, NextAuth, `x-internal-secret`) | PASS (dengan Low) | L-01, L-02 |
| Peran kelas K / kelas T | PASS | - |
| Gerbang kepercayaan (penanda benchmark, override penegakan, templat terbatas) di semua jalur tulis/render | **CAUTION** | M-04, M-05 |
| Traversal path penyimpanan dan sajian berkas (unduh, Content-Type, Content-Disposition, nosniff) | PASS | - |
| Sandbox Chromium (jaringan, JS, setContent, CSP HTML artefak) | **CAUTION** | M-01 |
| Proses soffice (argumen tanpa shell, profil sementara, batas waktu, tree-kill, path pendek) | PASS (dengan Low) | L-03 |
| Skrip render-env (tanpa tulis HKCU oleh kode aplikasi) | PASS | - |
| Parser turunan tanpa eval | PASS | - |
| Batas masukan (badan, kedalaman JSON, blok, gambar/zip-bomb) | **CAUTION** | M-02, L-04 |
| XSS di UI (pratinjau, `dangerouslySetInnerHTML`) | PASS | - |
| Injeksi SVG/teks di chart/diagram/HTML/DOCX | PASS | - |
| Log yang membocorkan rahasia | PASS (dengan Low) | L-05 |
| Endpoint client-log (spam/ukuran) | PASS | - |
| Rate limit endpoint render | **CAUTION** | M-03 |
| Lisensi fon F-034 | INFO (bukan keamanan) | I-01 |

## 2. Tabel temuan

| ID | Tingkat | Jenis | Lokasi | Deskripsi | Remediasi |
|---|---|---|---|---|---|
| M-01 | Medium | CWE-693 / CWE-250; ISO A.14.2 | `src/lib/studio/engine/browser/runtime.ts:123-128` | `chromium.launch` tidak menyetel `chromiumSandbox`. Di playwright-core 1.62.1 (`node_modules/playwright-core/lib/coreBundle.js`: `if (options.chromiumSandbox !== true) chromeArguments.push("--no-sandbox")`) artinya Chromium berjalan **tanpa sandbox OS**. Renderer mengurai HTML/SVG/PNG/JPEG yang bersumber dari pengguna (aset dokumen di-embed sebagai data URI). JS mati dan jaringan diblokir, tetapi bug korupsi memori di decoder gambar/fon (kelas CVE-2023-4863) tetap bisa menjadi eksekusi kode dengan hak proses HQ | Tambahkan `chromiumSandbox: true` pada `chromium.launch`. Uji bahwa headless Windows tetap jalan. Bila sandbox tidak bisa dipakai di host ini, catat sebagai risiko yang diterima dan pertahankan revisi Chromium tetap mutakhir |
| M-02 | Medium | CWE-409 / CWE-400; ISO A.14.2 | `src/lib/studio/services/ingest/assets.ts:131-190` (hanya `sniffMime` di :185) dibanding `src/lib/studio/services/images/decode.ts:108` | Aset dokumen (`doc.assets[*].dataBase64` atau store) hanya dicek ukuran byte dan magic PNG/JPEG. **Batas piksel** (`IMAGE_MAX_SIDE_PX` 20000, `IMAGE_MAX_PIXELS` 80 juta) hanya berlaku di jalur artefak. PNG berisi nol bisa mendeklarasikan puluhan ribu piksel per sisi dalam beberapa MiB (masih di bawah batas badan 5 MiB), lalu didekode oleh soffice (DOCX ke PDF) dan Chromium (ukur/rasterisasi). Akibatnya lonjakan memori multi-GB sampai timeout atau tree-kill | Di `resolveDocAssets`, panggil `decodeImageDetailed({ bytes })` (atau pemeriksaan header yang sama) dan tolak 413 `ASSET_TOO_LARGE` dengan `reason: "pixel_limit"` |
| M-03 | Medium | CWE-770; ISO A.13 | `src/app/api/studio/documents/route.ts:152` (render sinkron dalam request); `src/lib/studio/engine/soffice/service.ts:41,123` (antrean `waiters` tanpa batas); `src/lib/studio/engine/browser/runtime.ts:176` (rantai semafor tanpa batas); limiter hanya di `src/app/api/studio/client-log/route.ts:47` | Tidak ada rate limit atau kuota per pemanggil pada endpoint yang memicu render: POST documents, artifacts, revisions, PATCH blocks, dan validate `?preview=html`. Antrean soffice (maks 2 instans, timeout 180 s) dan Chromium (semafor 1, 30 s per operasi) tidak berbatas, sehingga satu sesi atau agen (`x-internal-secret`) bisa menumpuk ratusan job dan menahan proses HQ bersama | Pasang `createFixedWindowLimiter` per `(kind, requester)` pada route render. Batasi kedalaman antrean (mis. maks 10 menunggu, lalu 429/503 dengan `Retry-After`) |
| M-04 | Medium | CWE-284 (residu F-042/F-047); ISO A.9 | `src/lib/studio/services/revisions/index.ts:340` (`cloneJson(baseSnap.doc)` membawa `x`) dan `:370` (`byConstructionChecks(nextDoc, tpl)`); `src/lib/studio/engine/lint/scan/index.ts:212-223` (`if (policy.benchmark) return []`); pembuangan penanda hanya di ingest `src/lib/studio/services/ingest/index.ts:219-250` | `patchBlock` tidak mengevaluasi ulang kepercayaan pemanggil. Penanda `x.benchmark`/`x.enforcement`/`x.lintEnforcement` yang tersimpan dari ingest ADMIN tetap berlaku untuk suntingan oleh USER/GOOGLE/INTERNAL_AGENT, sehingga **semua cek by-construction dilewati** untuk konten yang mereka sisipkan (turunan verbatim, cek penolak). Templat TERBATAS sudah 403 (`:367`), jadi celah ini hanya ada pada dokumen bertanda yang dipin ke templat tidak terbatas (mis. `datum-kanonik`). D-98 menerima persistensi penanda untuk revisi berikutnya, tetapi tidak jelas apakah penerimaan itu mencakup penyunting non-ADMIN | Di `patchBlock`: bila `!isTrustedCaller(caller)` dan dokumen bertanda, pilih salah satu: (a) 403 FORBIDDEN `reason: "BENCHMARK_DOC_TRUSTED_ONLY"`, atau (b) jalankan `byConstructionChecks` atas salinan tanpa penanda (`stripBenchmarkMarkers` + `stripEnforcementOverride`) untuk blok yang berubah. Catat `BENCHMARK_MARKER_STRIPPED` |
| M-05 | Medium | CWE-284; ISO A.9 | `src/lib/studio/services/templates/index.ts:517-533` (hanya `t.isCanonical` yang dijaga di `:518`) | Siapa pun yang punya sesi bisa membuat **versi baru** templat non-kanonik milik ADMIN, termasuk templat TERBATAS `datum-manual-000`, selama kunci kelas K tidak diubah. `roleFormats` dan `sectionPlan` bisa diganti. Status terbatas tetap, jadi USER tidak bisa memakainya, tetapi render ADMIN/benchmark berikutnya yang memakai versi terbaru (tanpa pin versi) mewarisi perubahan itu. Ini merusak integritas templat acuan | Dalam `createTemplateVersion`, bila `templateRestriction(prev.resolvedParams).restricted` dan `!isTrustedCaller(caller)`, lempar 403 FORBIDDEN (dicatat `TEMPLATE_RESTRICTED_DENIED`, purpose `version`). Pertimbangkan juga kepemilikan templat |
| L-01 | Low | CWE-208; ISO A.9 | `src/lib/studio/contract/auth.ts:51` (pola sama dengan `src/lib/require-session.ts:65`, `src/middleware.ts` yang sudah ada sebelumnya) | Perbandingan XOR atas `x-internal-secret` sudah waktu-konstan untuk isi, tetapi kembali lebih awal bila panjangnya beda. Ini membocorkan panjang rahasia | HMAC kedua nilai dengan kunci acak proses lalu `crypto.timingSafeEqual` pada digest berpanjang sama |
| L-02 | Low | CWE-345; ISO A.12.4 | `src/lib/studio/contract/auth.ts:64`; `src/app/api/studio/artifacts/route.ts:116` (`createdBy: caller.requester`) | Untuk INTERNAL_AGENT, `requester` = `agentId` dari badan (bebas diisi, maks 80) sehingga agen bisa mengatasnamakan agen lain. Untuk GOOGLE_SESSION, email tidak dicatat sebagai requester (menjadi `anonymous-internal` atau agentId) | Simpan `requester` berprefiks jenis (`agent:<id>`, `google:<email>`) dan simpan `callerKind` di baris/log. Perlakukan agentId sebagai label, bukan identitas |
| L-03 | Low | CWE-427 | `src/lib/studio/engine/soffice/readiness.ts:118` (`"reg.exe"`); `src/lib/studio/engine/soffice/process.ts:35` (`"taskkill"`) | Nama biner tanpa path absolut. Resolusi libuv di Windows mencari direktori kerja (akar repo) lebih dulu, jadi `reg.exe`/`taskkill.exe` yang ditanam di sana akan dieksekusi. Prasyaratnya akses tulis ke akar repo | Pakai `path.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "reg.exe")` (sama untuk `taskkill.exe`) |
| L-04 | Low | CWE-674 | `src/lib/studio/services/ingest/validate.ts:183` (walker rekursif); `src/lib/studio/services/revisions/index.ts:393` (`canonicalSha256`); `src/lib/studio/http/body.ts:68` | Tidak ada batas kedalaman JSON eksplisit. Uji lokal Node v24.18.0: `JSON.parse` 2 juta tingkat berhasil, `JSON.stringify` dan walker rekursif melempar `RangeError`. Galat itu tertangkap (500, proses tidak crash), tetapi 5 MiB masukan memakan CPU sebelum gagal | Cek kedalaman iteratif setelah parse (mis. maks 64), tolak 400 `SCHEMA_INVALID` |
| L-05 | Low | GDPR Art. 5(1)(e); ISO A.12.4 | `src/lib/studio/http/log.ts:46` | Log JSONL harian `<akar>/logs/api/` tanpa rotasi, batas ukuran, atau retensi. Isinya `requester` (`user:<username>`) dan pesan klien yang sudah disanitasi | Tetapkan retensi (mis. 90 hari) dan purge terjadwal, plus batas ukuran per berkas |
| L-06 | Low | CWE-73 / CWE-200 | `src/lib/studio/services/templates/assets.ts:67-73` (lingkup = seluruh akar repo); `src/lib/studio/services/templates/profile.ts:383-387`; `src/lib/studio/services/templates/index.ts:704` (`{...base.assets, ...profile.assets}`); `src/lib/studio/engine/html/base/fonts.ts:154-170,299` | Impor profil (hanya ADMIN, `src/app/api/studio/templates/route.ts:80`) boleh mengarahkan `assets[*].path` ke berkas mana pun di akar repo, termasuk `.env`, dan menimpa kunci fon kanonik. Isinya dibaca dan di-embed base64 ke HTML. Integritas sha256 membatasi pengungkapan (pemanggil harus tahu hash). Nilai `actual` di detail galat ada di `fonts.ts:165-168`, tetapi **tidak terbukti** sampai ke klien (`RenderJobError` hanya `{code, message, format}`, `contract/types/api.ts:255`). Jadi rantai eksfiltrasi lewat bocoran hash berstatus hipotesis | Batasi path aset templat ke `src/lib/studio/assets/` plus daftar ekstensi (`.ttf/.otf/.png/.jpg/.docx`). Buang `actual` dari `details` galat |
| L-07 | Low | CWE-352 (pertahanan berlapis) | `src/lib/studio/http/body.ts:88-105` (tidak memeriksa `Content-Type`); mitigasi ada di `src/app/api/auth/login/route.ts:96` (`sameSite: "lax"`) | Route JSON mutatif menerima badan apa pun yang bisa diurai sebagai JSON, termasuk `text/plain` dari form lintas situs. Saat ini termitigasi cookie `SameSite=Lax` | Wajibkan `application/json` untuk POST/PATCH JSON (kecuali route multipart) |
| I-01 | Info | Lisensi (F-034) | `src/lib/studio/assets/fonts/renamed/`; `findings/findings_register.md:42` | Fon Plex modifikasi memakai Reserved Font Name "Plex" (OFL 1.1 syarat 3) dan ter-embed di DOCX/HTML. Aman untuk pemakaian internal; distribusi ke luar GSP butuh izin IBM atau penggantian nama. Status: KEPUTUSAN-USER | Tidak ada tindakan keamanan |
| I-02 | Info | Observasi untuk S88 | grep `trustedHarness` di `scripts/`, `benchmark/`, `prisma/`: 0 tempat menyetel `true`; `benchmark/harness/run/lib/pipeline.ts:107` memakai `INTERNAL_AGENT` | Pengecualian "harness server" di `isTrustedCaller` (`services/templates/access.ts:40-42`) saat ini tidak pernah aktif. Arahnya aman (lebih ketat), tetapi D-98/D-102 menyebut bukti "harness". Verifier S88 perlu memastikan bukti itu memakai jalur ADMIN/seed, bukan harness | Tidak ada tindakan keamanan |
| I-03 | Info | ISO A.9 (desain) | Semua route `src/app/api/studio/**` | Tidak ada otorisasi tingkat objek: setiap sesi sah (termasuk INTERNAL_AGENT) bisa membaca dan menyunting dokumen/templat mana pun. Sesuai model 2 peran HQ (`prisma/schema.prisma:584-587`: ADMINISTRATOR, USER) dan spesifikasi §6.1. Dicatat agar diterima secara sadar | Bila dibutuhkan: kepemilikan atau ACL per dokumen/templat |

## 3. Hasil gerbang (security-review-gate, 5 cek)

| Cek | Hasil | Rincian |
|---|---|---|
| Credential Leak | PASS | Regex kunci API/token/JWT/private key/connection string/`password=` atas semua berkas Studio untracked, migrasi Studio, `next.config.ts`, `docs/STUDIO-AGENT-GUIDE.md`, dan uji Studio menghasilkan 0 kecocokan. `.env` dan `data/studio-workspace/` di-ignore (`.gitignore:34`, `:73`). Log menyamarkan rahasia (`src/lib/studio/http/sanitize.ts` `redactSecrets`/`isSecretKey`) dan path profil (`redactPaths`). Galat 500 tanpa stack ke klien (`src/lib/studio/http/errors.ts` `failure`) |
| Destructive Operation | PASS | Tidak ada route DELETE dan tidak ada `deleteMany` di Studio. Penghapusan hanya untuk `tmp/<jobId>` (`soffice/service.ts`, `finally`) dengan `jobId` tervalidasi `^[A-Za-z0-9_-]{1,100}$` dan `isPathInside(tmp)`. `calibrate_bundle.mjs` melepas junction (`unlinkSync`) sebelum `rmSync`. Seed hanya membaca SQL mentah (`$queryRaw` tagged). `db:migrate` diganti ke `migrate deploy` |
| External Call | PASS | Tidak ada `fetch`/HTTP keluar di kode Studio, CLI, maupun skrip Python. Chromium `offline: true` + `ctx.route("**/*")` abort (`runtime.ts:235,257`). HTML artefak memakai CSP `default-src 'none'` plus `enforceStandalone` |
| Injection | PASS | Proses: `spawn(..., { shell: false })` dengan argumen array (`soffice/process.ts:76`, `render-env/lib.mjs:54`, `scripts/parity/run/lib/python.ts:69-71`), nama berkas ke soffice disaring (`safeBaseName` membuang `-`/`.` di depan). SQL: Prisma ORM plus `$executeRaw` tagged (`ingest/repository.ts:143`). Kode: `evalArith` parser sendiri, tanpa `eval`/`Function`, batas panjang 4096 dan kedalaman 100, lookup lewat `Map` (`engine/bind/arith.ts:22-23,265`). XML/HTML/SVG: escape `& < > " '` di HTML, `& < > "` di SVG, `fldSimple` dibatasi `PAGE`/`NUMPAGES` (`docx/blocks/runs.ts`) |
| Permission Escalation | **CAUTION** | Kelas K ditegakkan di route (`assertOverridesAllowed`) dan layanan (`assertOverrideRights`, termasuk kunci yang dihapus via `changedOverrides`), kelas T read-only. Tetapi: M-01 (sandbox Chromium mati), M-04 (penanda tersimpan dihormati untuk penyunting tak tepercaya), M-05 (non-ADMIN menyunting templat terbatas), L-06 (lingkup path aset ADMIN = akar repo) |

**Keseluruhan gerbang: CAUTION**, jadi controller harus menanyakan user (perbaiki / terima risiko tercatat / ubah lingkup). CAUTION tidak dianggap sudah disetujui sebelumnya.

### Kontrol yang terverifikasi baik (bukti PASS per area)

- **Auth:** ke-15 handler `src/app/api/studio/**/route.ts` memanggil `requireSession` sebagai baris pertama. Middleware mencakup `/api/studio` dan `/studio` (`src/middleware.ts` matcher). `getStudioCaller` gagal-tertutup tanpa env (`auth.ts:47`). Cookie HQ diverifikasi HMAC dengan perbandingan waktu-konstan (`src/lib/hq-session.ts:70-77`). Hanya `r === "ADMINISTRATOR"` yang bisa menulis kelas K (`auth.ts:74-81`). Impor profil hanya ADMIN (`templates/route.ts:80`). `render-env?refresh=1` hanya ADMIN (`render-env/route.ts:89-94`).
- **Gerbang kepercayaan (yang sudah benar):** ingest/validate membuang penanda dan override dokumen dari pemanggil tak tepercaya sebelum skema (`ingest/index.ts:219-250`). Opsi route berupa literal (`documents/route.ts:125` `{ dryRun: false }`), dan `trustedHarness` tidak bisa diset dari body/header. Templat terbatas dijaga di ingest (setelah override dokumen juga), validate (403), artefak HTML (`render/artifact.ts:110,314-339`, sebelum baris dibuat, INT-U), dan PATCH (`revisions/index.ts:367`). F-048 tertutup di sisi layanan.
- **Penyimpanan:** `resolveSafe` memakai pemeriksaan leksikal plus realpath leluhur/target, menolak segmen `.`/`..`/kosong, `<>:"|?*` (termasuk ADS `:`), nama perangkat Windows, titik/spasi di akhir, path absolut/UNC/drive (`storage/paths.ts:69-138`). Penulisan atomik dengan `wx` dan rename, target symlink ditolak (`storage/files.ts:125-165`). Path sajian hanya dari baris DB via id `^[A-Za-z0-9_-]{1,100}$` (`files.ts:281`). Penjaga `STORAGE_ROOT_FORBIDDEN` (`contract/env.ts:141-152`).
- **Sajian berkas:** Content-Type per ekstensi, `nosniff`, `no-store`, `Referrer-Policy`, CORP same-origin, `X-Frame-Options`. CSP `default-src 'none' ... sandbox` untuk HTML/SVG. `attachment` sebagai default, DOCX selalu attachment. `Content-Disposition` RFC 5987 tanpa karakter kendali/kutip (`files/_lib/serve.ts:39,58,81,100`). `details` galat dibuang (`stripDetails`).
- **Chromium (selain M-01):** `javaScriptEnabled:false`, `offline`, service worker diblokir, unduhan ditolak, `bypassCSP:false`, `setContent` saja, timeout per operasi, context ditutup di `finally`, semafor 1 (`runtime.ts:226-284`).
- **soffice:** `--headless --norestore --nologo --nodefault --nolockcheck`, `-env:UserInstallation` per job, tanpa `cwd` job, timeout lalu `taskkill /PID /T /F`, cek magic `%PDF-`, path pendek `%TEMP%\gso-XXXXXX` bila melewati MAX_PATH, hapus di `finally` (`soffice/service.ts`, `soffice/paths.ts`). Maks 2 instans (`contract/env.ts:154-157`).
- **render-env:** HKCU hanya dibaca (`reg.exe query`, `render-env/lib.mjs:94-98`, `soffice/readiness.ts:118`). grep `reg add|reg import|Set-ItemProperty|AddFontResource|winreg.Set*` = 0 kemunculan. Penulisan HKCU D-35 dilakukan controller secara manual dengan cadangan, bukan oleh kode aplikasi.
- **XSS UI:** 0 `dangerouslySetInnerHTML`/`innerHTML`. Semua pratinjau memakai `<iframe sandbox="">` (tanpa allow-scripts/same-origin): `artifact-gallery/preview.tsx:54`, `document-viewer/output-files.tsx:55`, `playground/panels.tsx:175`, `template-preview/index.tsx:360`, `section-composer/preview-pane.tsx:128`. HTML pratinjau juga membawa CSP meta (`html/assemble/standalone.ts:19-37`) dan diproses `enforceStandalone`. SVG figur dibangun ulang dari token (`html/tables/svg.ts`: elemen script/style/foreignObject/animasi dibuang, `on*`/`src` dibuang, href hanya `#id`/data raster).
- **client-log:** limiter 30 per menit per sesi dicek sebelum badan dibaca, badan maks 16 KiB, kunci yang tidak dikenal ditolak, isi disanitasi dan dipotong (`client-log/route.ts:47-70`, `http/client-log.ts`).
- **Batas masukan (selain M-02/L-04):** badan JSON 5 MiB, dicek dari header dan saat streaming (chunked) (`http/body.ts:25-62`). Multipart 21 MiB. Aset 20 MiB. Blok 20000, sel 5000, run 20000, aset 200 (`ingest/validate.ts:164-193`, `ingest/normalize.ts:339`). Satu-satunya `unzipSync` hanya untuk basis DOCX templat yang dikunci sha256 (`docx/package/base.ts:84-97`), bukan unggahan pengguna, jadi tidak ada jalur zip-bomb dari pengguna.

## 4. Penilaian GDPR / ISO 27701

| Pasal / kontrol | Status | Temuan | Remediasi |
|---|---|---|---|
| GDPR Art. 5 (minimisasi, batas penyimpanan) | PARTIAL | Log hanya berisi id/kode/requester (minimal). Tidak ada retensi log (L-05). Dokumen/revisi disimpan permanen sebagai rekam jejak (sengaja) | L-05 |
| GDPR Art. 7 (persetujuan) | N/A | Tidak ada pemrosesan data subjek berbasis persetujuan; isi dokumen kerja internal | - |
| GDPR Art. 15/16/17 (akses, rektifikasi, penghapusan) | PARTIAL | Akses dan rektifikasi lewat GET/PATCH. Tidak ada endpoint hapus/arsip-purge untuk dokumen yang memuat nama orang (penulis, penanda tangan) | Bila diwajibkan: prosedur purge ADMIN dengan kaskade ke berkas `StudioOutputFile` |
| GDPR Art. 20 (portabilitas) | N/A | Dokumen sudah tersedia sebagai DOCX/PDF/HTML/JSON | - |
| GDPR Art. 25 (privacy by design) | OK | Log tanpa isi dokumen, sanitasi masukan klien, akar sandbox terpisah dari `SHARED_WORKSPACE` | - |
| GDPR Art. 30 (catatan pemrosesan) | OK | Riwayat revisi dengan apa/mengapa/dampak dan `createdBy`, log job | Lihat L-02 untuk akurasi atribusi |
| GDPR Art. 32/33 (langkah teknis, deteksi pelanggaran) | PARTIAL | Kontrol teknis kuat (§3). Tidak ada alur deteksi/notifikasi khusus Studio di luar log | Ikut proses insiden HQ |
| GDPR Art. 35 (DPIA) | N/A | Bukan pemrosesan berisiko tinggi atas data subjek | - |
| Inventaris PII | PARTIAL | PII: `createdBy`/`requestedBy` (username), `meta.author`, blok tanda tangan, `agentId`. Tidak diklasifikasi eksplisit di model | Catat kolom PII di dokumentasi model |
| ISO 27701 (PIMS) | N/A | Tidak ada peran pengendali/prosesor PII baru di Studio | - |
| ISO 27001 A.18.1.4 | PARTIAL | Mengikuti baris GDPR di atas | - |

## 5. Pemetaan ISO 27001 Annex A

| Kontrol | Status | Temuan | Remediasi |
|---|---|---|---|
| A.9 Kontrol akses | PARTIAL | RBAC 2 peran plus kelas K/T ditegakkan. Celah: M-04, M-05, L-01, L-02, I-03 | M-04, M-05, L-01, L-02 |
| A.10 Kriptografi | OK | HMAC-SHA256 sesi, cookie `secure`/`httpOnly`/`lax`, integritas sha256 berkas/aset | - |
| A.12.1 Prosedur operasional | OK | `migrate deploy` (bukan `dev`), akar sandbox terpisah, `render-env/README.md`, keputusan tercatat (D-35) | - |
| A.12.4 Logging | PARTIAL | JSONL tahan restart dengan correlation id dan log job. Tanpa retensi (L-05), atribusi agen bisa dipalsukan (L-02) | L-02, L-05 |
| A.12.6 Kerentanan teknis | PARTIAL | Dependensi baru disematkan versi (`ajv 8.20.0`, `fflate 0.8.3`, `playwright-core 1.62.1`, override `fast-uri 3.1.8`). `npm audit` tidak dijalankan di S87 karena larangan panggilan keluar | Jalankan `npm audit --omit=dev` sebelum rilis |
| A.13 Komunikasi | PARTIAL | Tanpa jaringan keluar, CSP ketat. Tanpa rate limit render (M-03) | M-03 |
| A.14.2 Pengembangan aman | PARTIAL | Review dan uji per baris (S71-S86), parser aman, sanitasi. Celah: M-01, M-02, L-04 | M-01, M-02, L-04 |
| A.16 Manajemen insiden | N/A (warisan HQ) | Tidak ada mekanisme khusus Studio; log menyediakan jejak | - |
| A.18 Kepatuhan | PARTIAL | Lisensi fon OFL (I-01) sudah tercatat sebagai keputusan user | Keputusan distribusi (F-034) |

## 6. Prioritas remediasi

1. **Sebelum deploy ke HQ produksi** (tidak ada High; Medium butuh keputusan user):
   - M-04 dan M-05: menutup sisa celah gerbang kepercayaan. Ini kelanjutan F-042/F-047 yang menurut register harus diverifikasi S87.
   - M-01: aktifkan sandbox Chromium, atau terima risikonya secara tercatat.
   - M-02 dan M-03: ketersediaan proses HQ bersama (bom piksel, antrean tanpa batas, tanpa rate limit).
2. **Sebelum PII produksi:** L-05 (retensi log). Prosedur purge Art. 17 bila diwajibkan.
3. **Kesiapan sertifikasi / hardening:** L-01, L-02, L-03, L-04, L-06, L-07. Jalankan `npm audit` (A.12.6).

Opsi keputusan untuk controller (vonis CAUTION):
1. **Perbaiki**: terapkan remediasi lalu ulangi cek Permission Escalation dan cek area terkait (verifikasi per temuan ada di bawah).
2. **Terima risiko tercatat**: per temuan Medium, dengan pencatatan di `decisions/decisions.md`.
3. **Ubah lingkup**: mis. tunda paparan endpoint render ke agen sampai M-03 selesai.

Verifikasi per temuan:

| ID | Cara memastikan perbaikan |
|---|---|
| M-01 | Baris perintah proses `chrome.exe` anak tidak memuat `--no-sandbox` (`Get-CimInstance Win32_Process`), dan uji `rasterizeSvg` tetap lulus |
| M-02 | Unit uji: dokumen dengan PNG header 30000x30000 (IDAT nol) menghasilkan 413 `ASSET_TOO_LARGE` dengan `reason: "pixel_limit"` sebelum render |
| M-03 | Uji: N+1 POST dalam jendela menghasilkan 429 `Retry-After`; antrean penuh menghasilkan 503 |
| M-04 | Uji stub: USER mem-PATCH dokumen ber-`x.benchmark` pada templat tak terbatas dengan turunan tanpa `result()` mendapat 403 atau 422 (bukan 200) |
| M-05 | Uji: USER POST `/api/studio/templates/<id datum-manual-000>` mendapat 403 FORBIDDEN, dan jumlah versi tetap |
| L-01 | Kode memakai `timingSafeEqual` atas digest; uji 3 jalur auth tetap lulus |
| L-02 | Baris baru agen tersimpan sebagai `agent:<id>` plus `callerKind` |
| L-03 | grep `"reg.exe"`/`"taskkill"` tanpa path absolut = 0 |
| L-04 | Badan dengan kedalaman 1000 menghasilkan 400, bukan 500 |
| L-05 | Berkas log lebih tua dari retensi terhapus oleh tugas purge |
| L-06 | Impor profil dengan `path: ".env"` menghasilkan 400 `SCHEMA_INVALID` |
| L-07 | POST JSON dengan `Content-Type: text/plain` menghasilkan 415/400 |

## 7. Log security review

| # | Waktu | Lingkup | Level | Hasil | Keputusan | Peninjau |
|---|---|---|---|---|---|---|
| 1 | 2026-10-23 | Berkas kerja Studio (lingkup S87: `src/lib/studio/**`, `src/app/api/studio/**`, `src/app/studio/**`, `src/components/studio/**`, `render-env/**`, `scripts/parity/**`, `benchmark/harness/**`, `prisma/seed-studio.ts`, `next.config.ts`) | L3 | CAUTION (0 High, 5 Medium, 7 Low, 3 Info) | Menunggu keputusan user lewat controller (perbaiki / terima risiko tercatat / ubah lingkup) | security-review (agen) |

Tidak ada rahasia yang dikutip dalam laporan ini.

Metode (bukti Tier 3): pembacaan berkas dengan rujukan `berkas:baris` di atas. Grep: guard route, `trustedHarness`, sink HTML, panggilan proses, tulis registri, jaringan keluar, pola kredensial. `git status --short` dan `git diff HEAD -- next.config.ts package.json`. Pemeriksaan `node_modules/playwright-core/lib/coreBundle.js` untuk default `--no-sandbox`. Satu uji lokal `node -e` (Node v24.18.0) untuk JSON bersarang 2 juta tingkat, dengan keluaran `parse ok` / `stringify err RangeError` / `walk err RangeError`.
