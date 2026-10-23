# SR-57 — Security review ulang S87 (diperluas)

| Medan | Isi |
|---|---|
| Baris | SR-57 (`identification/05_structural_sections_blueprint.md:798`); verifikasi D-121, D-123, D-135; F-064 (D-237) |
| Agen / skill | `security-review` / `security-review-gate` |
| Tanggal | 2026-10-23 |
| Repo | `C:\Users\TRIAL\gsp-swarm-hq-v2.1`, berkas kerja (kode Studio masih untracked) |
| Batasan yang dipatuhi | Review-only: 0 perubahan `src/**`/`prisma/**`. DB: hanya baca `gsp_agent_hq_v21` (1 kueri `select`, `current_database()` diverifikasi dulu). Uji dinamis hanya `http://127.0.0.1:9021`, tanpa sesi/cookie palsu. Port 9011 dan DB produksi tidak disentuh. Tidak ada panggilan jaringan keluar (`npm audit` tidak dijalankan). Tidak ada rahasia dikutip |
| Status | **needs-review**: vonis CAUTION, keputusan milik user lewat controller |

## 1. Ringkasan

**Vonis: CAUTION.** 0 High, 1 Medium, 7 Low, 5 Info.

- **D-121 (5 Medium + 7 Low S87): 12/12 tertutup pada lokasi yang dilaporkan.** Tiga di antaranya punya residu baru tingkat Low di jalur lain (L-01 → N-08, L-02 → N-04, L-05 → N-05). Tabel status dan bukti ada di §2.
- **F-064 (D-237): tertutup.** `guardExistingDocumentWrite` dipanggil untuk semua kiriman dokumen/bab/slot ke dokumen yang ada.
- **Temuan baru Medium (UNTUK USER): N-01.** Op struktur `templateVersion` (R14) bisa dipakai pemanggil tak tepercaya untuk memindah patokan dokumen bertemplat TERBATAS ke versi tidak terbatas. Setelah itu mereka bisa menyuntingnya, padahal D-98 membatasi penulisan dokumen seperti itu ke ADMIN. Data v21 memungkinkan skenario ini: `datum-manual-000` v1 tidak terbatas, v2 dan v3 terbatas, dan dokumen 000 berpatokan v3.
- **Ketidaksesuaian GDPR:** tidak ada GAP yang memblokir. PARTIAL: Art. 5(1)(e) (residu N-05), Art. 17 (tanpa purge, sama dengan S87).
- **Celah ISO 27001:** A.9 PARTIAL (N-01, N-04, N-08, I-03 desain), A.12.4 PARTIAL (N-04, N-05, N-06), A.12.6 PARTIAL (`npm audit` belum dijalankan), A.14.2 PARTIAL (N-02, N-03, N-07).
- **Tingkat review: L3 (Deep Audit).** Lingkupnya mencakup kode identitas, gerbang kepercayaan, unggahan berkas, dan proses Chromium/soffice. Bila hasil ini dipakai sebagai gerbang rilis produksi (perubahan auth), skill menggolongkannya **L4**, dan L4 selalu butuh persetujuan user.
- **Dimensi dilewati:** GDPR Art. 7, 20, 35 dan ISO 27701 N/A dengan alasan sama seperti S87 §4: dokumen kerja internal, tanpa pemrosesan berbasis persetujuan, tanpa peran pengendali/prosesor PII baru.

### Vonis per area cakupan

| Area | Vonis | Temuan |
|---|---|---|
| Route R01-R20 (auth 3 jalur, 401/403) | PASS | N-08 (Low, residu L-01). Uji 9021: 17 route x GET/POST tanpa sesi = 401; `x-internal-secret` salah, cookie palsu, dan Bearer acak = 401; PATCH pid/struktur = 401 |
| Kunci advisory `services/submit/lock.ts` | PASS | Kunci memakai `$executeRaw` bertag (parameter terikat, `lock.ts:44`). Urutan kunci tetap, balapan pembuatan diulang sekali (`:110-142`). Tidak ada injeksi |
| Unggah aset + batas (FIX-1, R18, `services/images/**`) | PASS (dengan Low) | N-07. Batasnya: multipart dicek dari header dan saat streaming, aset 20 MiB, batas piksel, magic bytes, laju 60/menit |
| Traversal `missionFolder` (IP-47) | PASS | I-B: nilai itu tidak pernah menjadi path. Pola divalidasi di semua pintu masuk |
| Gerbang kepercayaan kiriman parsial (R12/R13) | PASS (F-064 tertutup) | N-02 (Low, by-construction tidak dijalankan) |
| Dokumen bertarget (SUB-1) | PASS | Patokan restriksi dan kupas penanda lewat `guardExistingDocumentWrite` (`pipeline.ts:222-230,555`) |
| PATCH pid / alamat / struktur | **CAUTION** | **N-01** (op `templateVersion`) |
| Lapis parameter dan preset (PARAM_SURFACE_FORBIDDEN, PRESET_READONLY, templat terbatas ADMIN) | PASS | - |
| `ingest.inlineFormat` | PASS | Kelas K (`params/structure.ts:56-60`). `allow` hanya untuk pemanggil tepercaya (`adapt-v1/index.ts:101-103`, `ingest/v2.ts:628-633`) |
| AsyncLocalStorage target R04 (IP-64) | PASS (tidak ada kebocoran) | I-A |
| `middleware.ts` + login `?next=` | PASS (dengan Low) | N-03 |
| Log klien `client-log` (penyaringan rahasia) | PASS (dengan Low) | N-06 |
| XSS renderer HTML (konten agen) | PASS | - |
| Seed/backfill (v21 saja) | PASS | - |

## 2. Status 5 Medium + 7 Low D-121

| ID S87 | Status | Bukti (berkas:baris / perintah) |
|---|---|---|
| M-01 sandbox Chromium | **Tertutup** | `engine/browser/runtime.ts:121-128` (daftar argumen pematian sandbox + `assertSandboxedArgs`), `:230-238` (`chromiumSandbox: true`, `ignoreDefaultArgs: ["--no-sandbox"]`), `:239-244` (gagal tanpa fallback). Runtime (`Get-CimInstance Win32_Process`): Chromium Playwright PID 9584, anak tsx smoke Studio, **tanpa** `--no-sandbox`. Satu-satunya proses ber-`--no-sandbox` (PID 1832) adalah Chrome sistem dari `render.sh` tertanggal 2026-10-20, bukan Studio |
| M-02 batas piksel aset dokumen | **Tertutup** | `ingest/assets.ts:70`, `ingest/assets-v2.ts:92`, `images/asset-store.ts:153,158` memanggil `decodeImageDetailed`. Batasnya di `images/decode.ts:108-115` (`reason: "pixel_limit"`, 413) |
| M-03 rate limit + antrean render | **Tertutup** | `http/render-guard.ts:70-77` dipanggil di R04 v1/v2, R06, R07, R08 `?preview=html`, R09, R12/R13, R14 dan PATCH pid (bila render diminta), serta R17. Antrean berbatas di `engine/soffice/service.ts:61` dan `engine/browser/runtime.ts:318`. Unggah aset dibatasi 60/menit (`assets/route.ts:81-84,164-170`) |
| M-04 penanda tersimpan untuk penyunting tak tepercaya | **Tertutup** | v1 `revisions/index.ts:387-392`; v2 `revisions/v2/service.ts:199-209`; kiriman `submit/pipeline.ts:202-212` (badan) dan `:222-247` (konten tersimpan). Lihat N-02 untuk celah terkait (by-construction) |
| M-05 versi baru templat terbatas | **Tertutup** | v1 `templates/index.ts:704-714`; v2 `:1037-1041`; `skeleton/access.ts:207-217`; v1 datar hanya ADMIN (`templates/[id]/route.ts:215-224`). Uji `tests/unit/studio/fix1` M-05 gagal karena **usang**: tetap 403, tetapi alasannya kini `V1_FLAT_ADMIN_ONLY` (I-D) |
| L-01 perbandingan rahasia | **Tertutup** (lokasi S87) | `contract/auth.ts:54-71` (HMAC kunci acak + `timingSafeEqual`). Residu di gerbang HQ bersama: N-08 |
| L-02 atribusi agentId | **Tertutup** untuk `createdBy`/requester | `contract/auth.ts:73-83,105,123,132` (`user:`/`google:`/`agent:`). Residu di kolom penulis/pengisi: N-04 |
| L-03 path absolut `reg.exe`/`taskkill` | **Tertutup** | `engine/soffice/readiness-rules.mjs:44-56` (`%SystemRoot%\System32` tervalidasi), `engine/soffice/process.ts:38`; `render-env/lib.mjs:96` |
| L-04 batas kedalaman JSON | **Tertutup** | `http/body.ts:75-110` (iteratif, maks 64, 400 `SCHEMA_INVALID`). `parseJsonText` dipakai `readJsonBody` (`:154-163`) |
| L-05 retensi log | **Tertutup** untuk log yang dilaporkan | `http/jsonl.ts:21-39,57-80,104-110` (retensi 90 hari, 50 MiB per berkas) untuk api/ingest/revisions/skeleton/submit. Residu soffice/storage: N-05 |
| L-06 lingkup path aset templat | **Tertutup** | `templates/assets.ts:66-78` (hanya `src/lib/studio/assets/`); `engine/html/base/fonts.ts:163-168` (`actual` dibuang dari detail galat) |
| L-07 cek Content-Type | **Tertutup** | `http/body.ts:121-131,151` (415 untuk tipe salah), `assets/route.ts:143-152`; grep `anyContentType: true` = 0. Penyimpangan: header kosong diterima (D-134, diputuskan controller, bukan user). Dimitigasi `SameSite=Lax`. Low, diberitahukan ke user sebagai transparansi |

## 3. Tabel temuan baru

| ID | Tingkat | Jenis | Lokasi | Deskripsi | Remediasi | Verifikasi |
|---|---|---|---|---|---|---|
| **N-01** **UNTUK USER** | **Medium** | CWE-863 / OWASP A01; ISO A.9; D-98 | `services/revisions/v2/structure-ops.ts:180-183`; `services/revisions/v2/service.ts:509-536`; `services/revisions/v2/commit.ts:151-162` | `patchStructure` tidak pernah memeriksa restriksi patokan **saat ini** (`base.templateVersionId`). `commitV2Revision` hanya menjalankan `assertTemplateUsable` atas versi **tujuan**. Akibatnya USER, GOOGLE, atau INTERNAL_AGENT bisa mengirim `{"op":"templateVersion","versionNo":<versi tak terbatas>}` ke dokumen berpatokan versi terbatas: revisi n+1 tertulis atas nama mereka, lalu suntingan berikutnya juga lolos karena patokan sudah tidak terbatas. Op lain ditolak dengan benar, karena patokan tidak berubah dan cek tujuan = cek patokan. Data v21 (kueri baca): `datum-manual-000` v1 tidak terbatas, v2 dan v3 terbatas; dokumen 000 berpatokan v3 (D-238). Dampak: integritas dokumen acuan benchmark rusak (patokan dan isi bisa diubah pemanggil tak tepercaya). Hak cek-dilepas (D-34) tidak didapat, dan riwayat revisi tetap bisa dipulihkan ADMIN. Tidak dieksploitasi dinamis: butuh sesi dan tulis DB, di luar batasan brief. Bukti berupa jalur kode statis + data v21 | Di `patchStructure`, sebelum `applyStructureOp`, panggil `assertTemplateUsable` atas patokan saat ini (pola `guardExistingDocumentWrite`). Atau, di `commitV2Revision`, cek baik `base.templateVersionId` maupun `input.templateVersionId`. Pertimbangkan juga op `templateVersion` hanya untuk ADMIN bila salah satu versi terbatas | Uji transaksi-rollback: USER `PATCH /api/studio/documents/<000>/structure` `{op:"templateVersion",versionNo:1,baseRevisionNo:n}` → 403 FORBIDDEN, 0 revisi baru. ADMIN → 200. Op `setMeta` USER tetap 403 |
| N-02 | Low | CWE-20; ISO A.14.2; register §11.1 langkah 9; regresi kelas F-053/D-134 | `services/submit/pipeline.ts:442-475,479-688` (R12/R13 dan R04 bertarget); `services/revisions/v2/commit.ts:151-` (PATCH pid/alamat/struktur) dibanding `services/ingest/v2.ts:487-497` dan `services/revisions/index.ts:445` | Jalur tulis v2 parsial tidak menjalankan `runGate` (by-construction) maupun `renderFeasibilityBlockers` (D03). Konten yang ditolak 422 lewat R04/ingest (mis. turunan dengan `registerKey` tak terdaftar) diterima 201 lewat R12/R13 atau PATCH pid, lalu gagal saat render. Tidak ada eskalasi hak: penanda dibuang, dan renderer tetap menolak turunan verbatim tanpa penanda. Ini celah lapis pertahanan dan integritas. Catatan: daftar galat R12/R13 di register tidak memuat `BY_CONSTRUCTION_FAILED`, jadi perlu keputusan apakah gerbang memang berlaku untuk kiriman parsial | Jalankan `runGate` + `renderFeasibilityBlockers` atas snapshot hasil compose di `applyInLock`/`commitV2Revision` dengan `ingestPolicy`, di mana `benchmark` hanya untuk penulis tepercaya. Tolak 422 `BY_CONSTRUCTION_FAILED` sebelum `studioRevision.create` | R12 dengan turunan ber-`registerKey` tak terdaftar → 422 `D03`, 0 revisi |
| N-03 | Low | CWE-601 (pertahanan berlapis) | `src/app/login/safe-next.ts:11-26` | `safeNext` mengembalikan `raw` yang belum dinormalisasi. `"/.//evil.com"` dan `"/..//evil.com"` lolos (probe `tsx`: dikembalikan utuh), padahal setelah normalisasi URL pathname-nya `//evil.com` (protocol-relative). Status eksploitasi sebagai open redirect: **hipotesis, tidak terbukti**. Next 16.1.6 memakai `pushState` pada `createHrefFromUrl` = `//evil.com`, yang menolak lintas-origin. Server 9021 menormalkan `//` dengan 308 ke `/evil.com` (curl). Halaman `/login` di 9021 sedang 500 (I-C), jadi uji peramban tidak bisa dilakukan | Kembalikan `u.pathname + u.search + u.hash` hasil `new URL`, dan tolak bila `u.pathname` diawali `//`. Atau tolak segmen `.`/`..`/`%2e` | `safeNext("/.//evil.com") === "/"` dan `safeNext("/..//evil.com") === "/"` |
| N-04 | Low | CWE-345; ISO A.12.4 (residu L-02) | `services/submit/pipeline.ts:446`; `services/ingest/v2.ts:347-349` | `by`/`author` (dipakai untuk `lastFilledBy`, `meta.author` bawaan, `change.by`, dan penulis bab di kelengkapan/`forwardToController`) diambil dari `agentId` badan untuk **semua** jenis pemanggil. Akibatnya sesi HQ atau Google bisa mengatasnamakan agen mana pun. `createdBy` revisi sudah benar (`caller.requester`), dan sunting v2 memakai requester (`commit.ts:204`) | Pakai `agentId` hanya untuk INTERNAL_AGENT (`agent:<id>`); sesi memakai `caller.requester` | Kiriman bab oleh sesi USER dengan `agentId:"x"` → `lastFilledBy = user:<username>` |
| N-05 | Low | GDPR Art. 5(1)(e); ISO A.12.4 (residu L-05) | `engine/soffice/log.ts:29-33`; `services/storage/log.ts:134-141` | Log JSONL soffice dan storage ditulis dengan `appendFile` langsung, tanpa retensi atau batas ukuran. Tidak ada PII yang teridentifikasi (isinya jobId, relPath, ukuran) | Arahkan keduanya ke `appendJsonlDaily` (retensi + batas ukuran) | Berkas `soffice-*.jsonl` lebih tua dari retensi terhapus |
| N-06 | Low | CWE-532; ISO A.12.4 | `src/lib/studio/http/sanitize.ts:37-47` | `redactSecrets` tidak menyamarkan kredensial userinfo URL (`postgresql://user:pass@…`), nilai skema Authorization selain Bearer (hanya kata `Basic` yang disamarkan), atau `pwd=`. Probe `tsx` membuktikan ketiganya lolos utuh. Dipakai oleh client-log dan log server | Tambah pola `scheme://user:pass@` → `scheme://[redacted]@`; samarkan seluruh nilai `Authorization:`; tambah `pwd` | Probe yang sama menghasilkan `[redacted]` |
| N-07 | Low | CWE-400; ISO A.14.2 | `src/app/api/studio/assets/route.ts:81-84`; `services/images/asset-store.ts:191-192` | Unggah R18 diizinkan 60/menit x 20 MiB per pemanggil, dan setiap aset baru ditulis dua kali (shard + salinan datar IP-47). Tidak ada kuota per pemanggil atau cek ruang disk. Seluruh pemegang `x-internal-secret` berbagi satu ember. Akibatnya disk host HQ bisa dihabiskan pemanggil terautentikasi (sekitar 2,4 GB/menit) | Kuota byte per pemanggil per hari, cek ruang kosong sebelum tulis, selesaikan IP-47 (hapus salinan datar) | Unggahan melebihi kuota → 429/507 |
| N-08 | Low | CWE-208 (residu L-01) | `src/lib/require-session.ts:61-69`; `src/middleware.ts:96-103` | Gerbang HQ bersama yang berjalan **sebelum** `getStudioCaller` masih kembali lebih awal bila panjang `x-internal-secret` berbeda (berkas HQ yang sudah ada sebelumnya, di luar area Studio). Kebocoran panjang praktis sangat kecil lewat jaringan | Samakan dengan `secretEquals` (HMAC + `timingSafeEqual`) | grep perbandingan panjang `a.length === b.length` di kedua berkas = 0 |

### Informasional

| ID | Pokok | Bukti |
|---|---|---|
| I-A | IP-64 AsyncLocalStorage: **tidak ada kebocoran konteks antarpermintaan.** `store.run` hanya membungkus `ingest()` R04 bertarget (`documents/route.ts:318-319`). Satu-satunya pembaca adalah `submitDocumentV2` (`submit/index.ts:65`), yang berjalan dalam rantai async permintaan itu sendiri. Kelanjutan `await` mewarisi konteks pendaftar, dan tidak ada antrean berbasis callback di antara ingest dan submit. Utang desain tetap ada: konteks implisit dengan urutan argumen → ALS → badan | grep `currentDocV2Targeting\|withDocV2Targeting` = 3 tempat |
| I-B | IP-47: `missionFolder` di layanan aset hanya dicek panjang dan karakter kendali (`asset-store.ts:87-96`), tetapi **tidak pernah dipakai sebagai path** (`relPath` dari sha, `:189`). Pola divalidasi di R18 (`assets/route.ts:90-100`), skema `MissionRef` (`contract/schema/doc.schema.ts:167`, dipakai v2), `storage/paths.ts:223-231`, dan `render/naming.ts:35-38`. Traversal tidak bisa dicapai | Pembacaan kode |
| I-C | Server dev 9021: `GET /login` = 500 (Turbopack `CssSyntaxError` di `src/app/globals.css:1:1`). Overlay dev memuat path absolut server. Ini mode dev saja, bukan temuan produksi, tetapi menghalangi uji E2E login/`?next=` (SR-52) | `curl` 9021 |
| I-D | 14 uji `tests/unit/studio/fix1` gagal (M-04: 500 dari stub lama; M-05: alasan 403 berubah). Ini uji usang (SR-42/43), bukan bukti regresi. Penutupan M-04/M-05 di laporan ini berdasarkan kode. `params-surface.test.ts` lulus | `npx vitest run tests/unit/studio/fix1 tests/unit/studio/structure/params-surface.test.ts`: 14 gagal / 91 lulus |
| I-E | I-03 S87 (tanpa otorisasi tingkat objek) tetap sesuai desain. `GET /api/studio/assets?mission=` mendaftar aset misi mana pun untuk sesi apa pun | `assets/route.ts:259-276` |

## 4. Hasil gerbang (security-review-gate, 5 cek)

| Cek | Hasil | Rincian |
|---|---|---|
| Credential Leak | PASS | Regex (kunci API, AWS, private key, URL postgres berkata sandi, token GitHub/Slack, JWT, `password=…`) atas `src/lib/studio`, `src/app/api/studio`, `src/app/studio`, `src/components/studio`, `src/app/login`, `src/middleware.ts`, seed/backfill, migrasi 2026-10-2x, `docs/STUDIO-AGENT-GUIDE.md`, `docs/API-REFERENCE.md`, `scripts/parity`, `render-env`, `benchmark/harness`, `next.config.ts`, folder tugas: 0 kecocokan. `tests/unit/studio/{api,api-structure}/_env.ts` berisi rahasia uji yang **tidak sama** dengan `.env` (dibandingkan sebagai boolean tanpa mencetak nilai). `.env` dan `data/studio-workspace/` di-ignore (`.gitignore:34,77`) |
| Destructive Operation | PASS | Tidak ada handler DELETE atau `deleteMany` di Studio. Hapus pid adalah revisi logis. Purge log hanya menyasar nama berpola di direktori log (`jsonl.ts:57-80`). Seed/backfill menolak DB selain `gsp_agent_hq_v21`/`_uji` (`seed-studio.ts:172-176,1000`; `backfill-studio-structure.ts:124-129,791`). `$queryRawUnsafe` hanya dengan nama tabel tervalidasi `SAFE_IDENT` (`backfill:138-139`) |
| External Call | PASS | Tidak ada `fetch`/HTTP keluar di services/engine Studio. Chromium tetap offline dan bersandbox (M-01) |
| Injection | PASS | SQL: Prisma + `$executeRaw`/`$queryRaw` bertag (`lock.ts:44`). Proses: `execFile`/`spawn` dengan `shell: false` dan path absolut. HTML/CSS: `escapeHtml` pada teks, `cssString` meng-escape `<`, `"`, `\` dan baris baru (`html/base/fonts.ts:242-244`) untuk meta dan kunci slot di `<style>` (`assemble/slots.ts:288`, `base/shell.ts:150-158`). Kunci slot berpola `^[a-z][a-zA-Z0-9]{0,31}$` (`contract/env.ts:109`). Skema inline v2 tanpa tautan/URL (`common.schema.ts:296-320`) |
| Permission Escalation | **CAUTION** | Lapis parameter (`skeleton/access.ts:199-276`: PRESET_READONLY, TEMPLATE_RESTRICTED, kelas T/K, PARAM_SURFACE_FORBIDDEN, `expertMode` diabaikan), preset hanya ADMIN (`templates/route.ts:256-266`), impor profil hanya ADMIN (`:213-218`), `renumberChapters` hanya ADMIN (`v2/service.ts:516-518`), dan `inlineFormat allow` hanya untuk pemanggil tepercaya semuanya benar. **Tetapi N-01**: op `templateVersion` melewati D-98 |

**Keseluruhan gerbang: CAUTION** → controller menanyakan user (perbaiki / terima risiko tercatat / ubah lingkup). CAUTION tidak dianggap sudah disetujui sebelumnya.

## 5. Penilaian GDPR / ISO 27701

| Pasal / kontrol | Status | Temuan | Remediasi |
|---|---|---|---|
| GDPR Art. 5 (minimisasi, batas penyimpanan) | PARTIAL | Log api/ingest/revisions/skeleton/submit kini beretensi 90 hari (L-05 tertutup). Log soffice/storage tanpa retensi (N-05, tanpa PII) | N-05 |
| GDPR Art. 7 | N/A | Tidak ada pemrosesan berbasis persetujuan | - |
| GDPR Art. 15/16/17 | PARTIAL | Akses dan rektifikasi lewat GET/PATCH. Tidak ada purge dokumen yang memuat nama penulis/penanda tangan (sama dengan S87) | Prosedur purge ADMIN bila diwajibkan |
| GDPR Art. 20 | N/A | Ekspor DOCX/PDF/HTML/JSON sudah ada | - |
| GDPR Art. 25 | OK | Sanitasi log klien, log tanpa isi dokumen, akar sandbox terpisah. Celah pola sanitasi: N-06 | N-06 |
| GDPR Art. 30 | PARTIAL | Riwayat revisi + `createdBy` benar. Kolom penulis/pengisi bisa dipalsukan sesi (N-04) | N-04 |
| GDPR Art. 32/33 | PARTIAL | Kontrol teknis kuat. Tanpa alur deteksi pelanggaran khusus Studio | Ikut proses insiden HQ |
| GDPR Art. 35 | N/A | Bukan pemrosesan berisiko tinggi | - |
| Inventaris PII | PARTIAL | `createdBy`, `lastFilledBy`, `meta.author`, blok tanda tangan, `agentId`, `google:<email>`. Belum diklasifikasi eksplisit di model | Catat kolom PII |
| ISO 27701 | N/A | Tidak ada peran PII baru | - |
| ISO 27001 A.18.1.4 | PARTIAL | Mengikuti baris GDPR | - |

## 6. Pemetaan ISO 27001 Annex A

| Kontrol | Status | Temuan | Remediasi |
|---|---|---|---|
| A.9 Kontrol akses | PARTIAL | M-04/M-05/F-064 tertutup. Celah: N-01, N-04, N-08; I-03 sesuai desain | N-01, N-04, N-08 |
| A.10 Kriptografi | OK | HMAC sesi, `timingSafeEqual` (Studio), integritas sha256 aset/fon | - |
| A.12.1 Prosedur operasional | OK | Penjaga DB seed/backfill, `migrate deploy`, akar sandbox | - |
| A.12.4 Logging | PARTIAL | Retensi untuk 5 log. Residu: N-05, N-06, N-04 | N-04, N-05, N-06 |
| A.12.6 Kerentanan teknis | PARTIAL | `npm audit` tidak dijalankan (tanpa panggilan keluar) | Jalankan `npm audit --omit=dev` sebelum rilis |
| A.13 Komunikasi | OK | Rate limit render + antrean berbatas (M-03 tertutup), CSP, tanpa jaringan keluar | - |
| A.14.2 Pengembangan aman | PARTIAL | M-01/M-02/L-04 tertutup. Celah: N-02, N-03, N-07. Uji FIX-1 usang (I-D) | N-02, N-03, N-07; perbarui uji (SR-42/43) |
| A.16 Insiden | N/A (warisan HQ) | - | - |
| A.18 Kepatuhan | PARTIAL | Lisensi fon F-034 (keputusan user, tidak berubah) | - |

## 7. Prioritas remediasi

1. **Sebelum deploy ke HQ produksi:** N-01 (Medium, keputusan user). Pemilik baris yang diusulkan: pemilik `services/revisions/v2/**` (SR-14) dalam loop perbaikan.
2. **Sebelum PII produksi:** N-05, N-06 (log), N-04 (atribusi).
3. **Hardening / kesiapan sertifikasi:** N-02 (perlu keputusan apakah gerbang berlaku untuk kiriman parsial), N-03, N-07 (dengan IP-47), N-08 (berkas HQ bersama), `npm audit`.

Opsi keputusan untuk controller (vonis CAUTION):
1. **Perbaiki**: terapkan remediasi N-01, lalu ulangi cek Permission Escalation dan verifikasi N-01.
2. **Terima risiko tercatat**: N-01 dicatat di `decisions/decisions.md` atas keputusan user.
3. **Ubah lingkup**: mis. batasi op `templateVersion` ke ADMIN sementara.

## 8. Log security review

| # | Waktu | Lingkup | Level | Hasil | Keputusan | Peninjau |
|---|---|---|---|---|---|---|
| 1 | 2026-10-23 | S87 (`gateway_check/06_security_review.md`) | L3 | CAUTION (0 High, 5 Medium, 7 Low, 3 Info) | User: "Perbaiki semua" (D-123) | security-review |
| 2 | 2026-10-23 | SR-57: route R01-R20, kunci advisory, aset/unggah, gerbang kepercayaan (R04 bertarget, R12/R13, PATCH pid/alamat/struktur), lapis parameter/preset, `ingest.inlineFormat`, ALS R04, middleware + login `?next=`, client-log, renderer HTML, seed/backfill | L3 | CAUTION (0 High, 1 Medium, 7 Low, 5 Info); D-121 12/12 tertutup; F-064 tertutup | Menunggu keputusan user lewat controller atas N-01 | security-review |

Tidak ada rahasia yang dikutip dalam laporan ini.

### Metode dan bukti (Tier 3)

- Pembacaan kode dengan rujukan `berkas:baris` di atas. Peta guard per route dibuat dengan grep `requireSession|getStudioCaller|checkRenderRate|isTrustedCaller` atas `src/app/api/studio/**/route.ts`. Ke-21 berkas route memanggil `requireSession` pertama; R12/R13 lewat `chapters/_shared/submit-kit.ts:158`.
- Dinamis (9021, tanpa sesi): 17 route x GET/POST = 401. Header palsu (`x-internal-secret: wrong`, cookie `gsp_hq_session=abc.def`, Bearer acak) = 401. `/studio` → 307 `/login?next=%2Fstudio`. `//evil.com` dan `/.//evil.com` → 308 `/evil.com` (same-origin). `/login` → 500 (I-C).
- Probe lokal `tsx` (di luar repo, impor modul repo): `redactSecrets` (N-06) dan `safeNext` (N-03). Probe `node` (keluaran boolean saja): rahasia uji ≠ `.env`.
- Kueri baca v21 (`current_database()` = `gsp_agent_hq_v21` diverifikasi dulu): status terbatas per versi templat lewat `templateRestriction`. Hasil: `datum-manual-000` 1:u 2:R 3:R, `datum-manual-000-preset` 1:R, `datum-kanonik` 1-6:u, `datum-gsp` 1-2:u, 3 dokumen.
- Proses: `Get-CimInstance Win32_Process` untuk chrome.exe (baris perintah di-redaksi, hanya flag yang dilaporkan).
- Vitest: `tests/unit/studio/fix1` + `structure/params-surface.test.ts`: 2 berkas, 14 gagal / 91 lulus (uji usang, I-D).
