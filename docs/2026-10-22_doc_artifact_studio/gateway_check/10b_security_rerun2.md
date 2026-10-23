# SR-57 siklus 2 — Security review ulang setelah siklus perbaikan

| Medan | Isi |
|---|---|
| Baris | SR-57 (ulang). Menindaklanjuti D-247 (user: "perbaiki semua"), D-251 (user: F-068 "perbaiki"). Perbaikan yang diverifikasi: D-253 (FIX-R), D-255 (FIX-SEC), D-261 (FIX-S), D-272 (FIX-V), D-275 (FIX-Y) |
| Agen / skill | `security-review` / `security-review-gate` |
| Tanggal | 2026-10-23 |
| Laporan siklus 1 | `gateway_check/10_security_rerun.md` (tidak ditimpa) |
| Batasan yang dipatuhi | Review-only, 0 perubahan `src/**`/`prisma/**`. Tidak ada tulis DB. Uji dinamis hanya di `127.0.0.1:9021` tanpa sesi berlaku. Port 9011 dan DB produksi tidak disentuh. Tidak ada panggilan keluar. Tidak ada rahasia dikutip |
| Status | **complete** (vonis PASS, tanpa CAUTION/FAIL; tidak ada butir yang wajib diputuskan user) |

## 1. Ringkasan

**Vonis: PASS.** 0 High, 0 Medium, 4 Low baru, 3 Info.

- **Semua temuan siklus 1 tertutup:** N-01 (F-066), N-02 (= F-065), N-03 sampai N-08 (F-067), dan F-068. D-247 (tanpa build implisit) dan pencabutan ALS (IP-64) juga terverifikasi. Bukti per butir ada di §2.
- **Jawaban FIX-V (R08 dry-run):**
  - Tulis: tidak ada. Transaksi dibuka `SET TRANSACTION READ ONLY` sebagai pernyataan pertama dan tanpa kunci; aset hanya didekode, tidak disimpan.
  - Draf templat USER memakai **preset atau base terbatas**: **ditolak 403**. Ada dua titik cek: `template-draft.ts:113` untuk preset/base dan `:193` untuk hasil draf.
  - Draf templat USER memakai **kunci kelas K / lanjutan / turunan**: **tidak ditolak**, kecuali kunci yang membuat templat terbatas. Ini temuan baru S2-01 (Low). Dampaknya hanya pada pratinjau: tidak tersimpan, HTML berlabel "[PRATINJAU]", dan kena rate limit.
- **IP-68:** risiko laten Low (S2-02). Saat ini tidak bisa dieksploitasi, karena spec artefak hanya dirender oleh pembuatnya dan gerbang dijalankan ulang setiap kali render.
- **Regresi baru di delta siklus perbaikan:** tidak ada yang Medium atau High. Ada dua Low lain: S2-03 (R08 dry-run tanpa rate limit) dan S2-04 (kuota aset lunak + ember agen bersama, diterima controller di D-255).
- **Tingkat review: L3.** Bila hasil ini dipakai sebagai gerbang rilis produksi (perubahan auth), skill menggolongkannya L4 yang butuh persetujuan user.
- **GDPR:** tidak ada GAP baru. Residu Art. 5(1)(e) dari siklus 1 kini OK (log soffice beretensi, log layout dibatasi ukurannya). **ISO 27001:** A.9 dan A.14.2 PARTIAL karena Low S2-01..S2-04. Kontrol lain sama dengan siklus 1. Dimensi yang dilewati sama dengan siklus 1 (GDPR Art. 7/20/35 dan ISO 27701 N/A).

## 2. Status temuan siklus sebelumnya

| ID | Status | Bukti |
|---|---|---|
| N-01 / F-066 (op `templateVersion` melepas versi terbatas) | **Tertutup** | `services/revisions/v2/commit.ts:163-168`: bila versi berubah, `assertTemplateUsable` dicek atas versi **saat ini** (`base.templateVersionId`). `:169-173`: lalu atas versi tujuan. Asap FIX-S: agen/USER v3 → v1 = 403, ADMIN = 200 (`delegation_progress/coder_execution_fixs.md:52`). Saya tidak mengulangnya secara dinamis karena butuh sesi. Belum ada uji unit permanen (I-1) |
| N-02 / F-065 (gerbang by-construction di semua jalur) | **Tertutup** | Satu gerbang di `services/ingest/by-construction.ts:94-122` (`runGate` + intrinsik + `renderFeasibilityBlockers`) dan `:213-223` (422 `BY_CONSTRUCTION_FAILED`). Dipakai di R04 (`ingest/v2.ts`), R12/R13 dan R04 bertarget (`submit/pipeline.ts:908-932`, di dalam transaksi sebelum `studioRevision.create`), serta R16/R06/R14 (`revisions/v2/commit.ts:222-235`). Mode "report" (D-34) tidak bisa didapat pemanggil tak tepercaya, karena penanda dibuang sebelum gerbang lewat fungsi bersama `stripTrustMarkersForWriter` (`pipeline.ts:338-345` badan, `:356-370` konten tersimpan, `revisions/v2/service.ts:184-188`, `revisions/index.ts:383`). Uji `api-structure/submit.test.ts:336` ("F-065 … di R12") lulus |
| N-03 safeNext | **Tertutup** | `src/app/login/safe-next.ts:27-57` menolak dot-segment, `%2f/%5c/%2e/%25`, kontrol terenkode, dan mengembalikan nilai ternormalisasi. Probe `tsx`: `/.//evil.com`, `/..//evil.com`, `/a/..//evil.com`, `/%2e%2e//evil.com`, `/%2F%2Fevil.com`, `/%09/evil.com`, `/studio/./x` → `/`. `/studio/documents?x=1#h` dipertahankan. `GET /login` di 9021 kini 200 (siklus 1: 500) |
| N-04 atribusi `agentId` | **Tertutup** | `services/submit/meta.ts:20-23` `fillerOf` (agentId hanya untuk INTERNAL_AGENT), dipakai untuk `lastFilledBy`/`change.by` (`pipeline.ts:675,681`). Sunting v2 memakai requester (`commit.ts:205`), ingest v2 memakai filler (`ingest/v2.ts:542`). Sisa: lihat I-2 |
| N-05 retensi log | **Tertutup** | `engine/soffice/log.ts:29-31` → `appendJsonlDaily` (90 hari / 50 MiB). Log layout storage dibatasi 10 MiB (`services/storage/log.ts:113-123,137-164`) |
| N-06 redactSecrets | **Tertutup** | `src/lib/studio/http/sanitize.ts:32-66`. Probe: `postgresql://[redacted]@…`, `Authorization: [redacted]` (seluruh nilai Basic), `pwd=[redacted]`; URL tanpa userinfo tidak diubah. Probe ReDoS (200 ribu karakter) selesai 4 ms |
| N-07 kuota aset | **Tertutup** (residu S2-04) | `services/images/asset-store.ts:77-200,347`: 512 MiB per peminta per 24 jam, 2 GiB untuk ember agen; 429 + `retryAfterSec`; cek ruang disk minimum. Hard link `services/images/store.ts:140-177` memakai `resolveSafe` + `assertRealInsideRoot` di kedua ujung, cek sha sebelum dan sesudah, dan fallback tulis atomik. Tidak ada penulisan di tempat, sehingga link tidak menyebarkan kerusakan |
| N-08 perbandingan rahasia | **Tertutup** | `src/lib/require-session.ts:15-19,77` (HMAC + `timingSafeEqual`); `src/middleware.ts:36-67,87,126-128` (HMAC Web Crypto, XOR penuh, tanpa cek panjang lebih awal). Uji 9021: `x-internal-secret` salah (panjang berbeda/sama) = 401 |
| F-068 override render HTML inline | **Tertutup** | `services/render/common.ts:175-224` `gateInlineDocOverrides` dipakai di `render/artifact.ts:360-367` untuk semua pemanggil. Bagi pemanggil tak tepercaya, `effectiveInlinePolicy` ≠ `allow` sehingga **seluruh** `overrides` dibuang. Pemanggil tepercaya tetap dicek per kunci (`checkOverrideRights` + `checkTemplateWrite`). Suite `api` lulus (lihat §6) |
| D-247 tanpa build implisit | **Tertutup** | `render` di badan ditolak skema (`contract/schema/v2/forbidden.ts:185` `RENDER_FIELD`, `chapter.schema.ts:29`, `doc.schema.ts:47`, `structure/_lib/patch-body.ts`). grep pemanggil render: hanya R17 (`documents/[id]/render/_lib/handler.ts:105`) dan R07 rerender eksplisit (`documents/[id]/revisions/route.ts:118`) |
| IP-64 AsyncLocalStorage | **Tertutup** (dicabut) | grep `AsyncLocalStorage` di `src/lib/studio` dan `src/app/api/studio` = 0 |
| FIX-Y pointer | **OK** | `pipeline.ts:933-950` hanya memetakan pointer isu ke badan kiriman. `mergedPointer` menunjuk dokumen yang sama milik pemanggil, tanpa data lintas dokumen |
| IP-68 spec artefak verbatim | **Terbuka, Low laten** | S2-02 |

## 3. Temuan baru siklus 2

| ID | Tingkat | Jenis | Lokasi | Deskripsi | Remediasi | Verifikasi |
|---|---|---|---|---|---|---|
| S2-01 | Low | CWE-863 (pratinjau); ISO A.9 | `src/app/api/studio/validate/_shared/template-draft.ts:164-193`; pratinjau `validate/route.ts:401-408` | `resolveDraftTemplate` tidak menjalankan `checkTemplateWrite` (kelas K, PARAM_SURFACE_FORBIDDEN lanjutan, lapis turunan) untuk non-ADMIN. Yang dicek hanya restriksi D-98 (`:113`, `:193`). Akibatnya USER bisa memperoleh pratinjau HTML dengan kunci kelas K yang tidak boleh ia simpan, mis. `color.classificationInk` atau `type.forbiddenBodyFaces`. Pratinjau ini tanpa penanda draf (`draft: false`), meskipun berlabel "[PRATINJAU]" (`html/base/shell.ts:281-295`). Tidak ada yang tersimpan. Kunci yang melepas cek (`lint.enforcementOverride`) tetap 403 karena membuat templat terbatas | Untuk non-ADMIN, jalankan `checkTemplateWrite` atas `diffEffective(prevLayer, layer, inherited)` seperti jalur simpan (`templates/index.ts` `saveTemplateV2Tx`). Atau kupas kunci non-esensial dari lapis draf dan laporkan isu | USER R08 `draftTemplate` dengan `essentials`/`advanced` berisi `color.classificationInk` → isu `PARAM_CLASS_K_FORBIDDEN`, tanpa `previewHtml` |
| S2-02 | Low (laten) | CWE-441 (confused deputy); IP-68 | `src/app/api/studio/artifacts/route.ts:114` (spec disimpan verbatim) dan `services/render/artifact.ts:127,341-367` (gerbang memakai **pemanggil render**) | Spec HTML artefak disimpan apa adanya, termasuk `overrides` dan penanda `x` dari pembuat tak tepercaya. Saat ini aman, karena render hanya terjadi sekali oleh pembuat di POST (`route.ts:132`) dan gerbang menilai ulang dengan pemanggil itu. Fitur "render ulang artefak" di masa depan yang dijalankan ADMIN akan memberlakukan override/penanda kiriman USER dengan hak ADMIN | Simpan spec yang sudah digerbang (override dan penanda dikupas sesuai hak pembuat), atau simpan `creatorKind` dan gerbang dengan identitas pembuat | Uji: artefak USER berisi `x.benchmark` + `overrides`, render oleh ADMIN → tetap dikupas |
| S2-03 | Low | CWE-770; ISO A.13 | `src/app/api/studio/validate/route.ts:431-436` | Rate limit R08 hanya berlaku untuk `?preview=html`. Dry-run kiriman bab/slot/dokumen v2 (FIX-V) membuka transaksi interaktif READ ONLY per permintaan (pool koneksi, maxWait 10 s) dan menjalankan lint penuh tanpa batas laju. Pemanggil terautentikasi bisa menekan pool DB dan CPU HQ bersama | Hitung semua panggilan R08 dalam limiter tersendiri (lebih longgar dari render) | N+1 panggilan R08 dalam jendela → 429 |
| S2-04 | Low (residu N-07; **diterima controller D-255, bukan user**) | CWE-400 | `services/images/asset-store.ts:157-200,347`; IP-67 | (a) Kuota dicek lalu baris disisipkan tanpa kunci, sehingga unggahan bersamaan bisa melewati kuota sekitar N x 20 MiB. (b) Semua pemegang `x-internal-secret` berbagi satu ember 2 GiB, sehingga satu agen bisa menghabiskan kuota agen lain. Diberitahukan ke user demi transparansi (aturan brief 9) | Kunci advisory per ember saat cek+sisip. IP-67: ember per identitas agen | Unggahan paralel tidak melewati kuota |

### Informasional

| ID | Pokok |
|---|---|
| I-1 | N-01 hanya dibuktikan lewat asap (FIX-S 43/43); belum ada uji unit/regresi permanen (grep `templateVersion` + 403 di `tests/unit/studio` = 0). Disarankan ke SR-43/SR-44 |
| I-2 | Label `meta.author` bawaan masih diambil dari `agentId` badan untuk semua jenis pemanggil (`submit/pipeline.ts:676`, `ingest/v2.ts:402-404`). Ini medan isi dokumen yang memang bisa diisi pengirim lewat `meta.author`, bukan atribusi identitas. Atribusi identitas (`lastFilledBy`, `createdBy`, `change.by`) sudah benar |
| I-3 | Transparansi metode: satu uji negatif mengirim cookie `gsp_hq_session` berisi payload acak dengan **tanda tangan tidak sah** (tanpa rahasia, tidak mungkin berlaku) → 401. Ini bukan sesi palsu yang berlaku, tetapi dicatat karena brief melarang pemalsuan cookie sesi |

## 4. Hasil gerbang (security-review-gate, 5 cek)

| Cek | Hasil | Rincian |
|---|---|---|
| Credential Leak | PASS | Tidak ada pola kredensial di delta (berkas berubah sejak siklus 1: 140 berkas `src/prisma`). Sanitasi log diperkuat (N-06) |
| Destructive Operation | PASS | Tidak ada handler DELETE atau `deleteMany` baru. `prisma/rollback/*.sql` (IP-69, berisi DROP) adalah skrip runbook manual, tidak dipanggil kode aplikasi. Wajib cadangan sebelum dipakai (D-260). Hard link aset tidak menimpa isi |
| External Call | PASS | Tidak ada panggilan keluar baru. Chromium tetap bersandbox (FIX-FIG hanya menambah `--disable-gpu`/`--num-raster-threads=1`, D-265) |
| Injection | PASS | `SET TRANSACTION READ ONLY` dan kunci advisory memakai `$executeRaw` bertag. Regex sanitasi linear (probe 4 ms) |
| Permission Escalation | PASS (dengan Low) | N-01, F-065, F-068 tertutup. Preset terbatas di draf R08 = 403. Low: S2-01 (kelas K hanya di pratinjau), S2-02 (laten) |

**Keseluruhan gerbang: PASS.** Tidak ada CAUTION/FAIL. S2-04 diberitahukan ke user hanya sebagai transparansi atas penerimaan oleh controller.

## 5. Prioritas remediasi

1. Sebelum rilis: tidak ada blocker keamanan.
2. Hardening siklus berikut: S2-01 (samakan aturan hak draf dengan simpan), S2-03 (rate limit R08), S2-02 (IP-68 simpan spec tergerbang), S2-04 (kunci kuota, IP-67), I-1 (uji permanen N-01).

## 6. Log security review dan metode

| # | Waktu | Lingkup | Level | Hasil | Keputusan | Peninjau |
|---|---|---|---|---|---|---|
| 1 | 2026-10-23 | S87 | L3 | CAUTION (5 Medium, 7 Low) | User: perbaiki semua (D-123) | security-review |
| 2 | 2026-10-23 | SR-57 siklus 1 | L3 | CAUTION (1 Medium, 7 Low) | User: perbaiki semua (D-247); F-068: perbaiki (D-251) | security-review |
| 3 | 2026-10-23 | SR-57 siklus 2: verifikasi N-01..N-08, F-065..F-068, D-247, FIX-V, FIX-Y, IP-68, delta 140 berkas | L3 | PASS (0 High, 0 Medium, 4 Low, 3 Info) | Tidak perlu keputusan user; Low ke backlog | security-review |

Bukti segar:
- `npx vitest run tests/unit/studio/security`: 5 berkas, **77/77 lulus**.
- `npx vitest run tests/unit/studio/api-structure tests/unit/studio/api`: 14 berkas, **525/525 lulus**.
- 9021 tanpa sesi: 20 route x GET/POST/PATCH = **401** semuanya. Header salah = 401. `/studio` → 307 `/login?next=%2Fstudio`. `/.//evil.com` → 308 same-origin `/evil.com`. `/login` = 200.
- Probe `tsx` (di luar repo, keluaran tanpa rahasia): safeNext dan redactSecrets seperti §2.
- Pembacaan kode dengan rujukan `berkas:baris` di atas. Berkas probe sementara dihapus setelah dipakai.

Tidak ada rahasia yang dikutip dalam laporan ini.
