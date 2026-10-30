# SR-57 recheck batch Hermes (D-334..D-337)

| Medan | Isi |
|---|---|
| Lingkup | Penutupan H-01 (importer: FIX-HR1, D-337), H-02 dan L-01 (rahasia DEV, D-334), D16 berbasis asal nilai (FIX-HR3, D-335), urutan galat R17 seragam dan catch-all PUT/HEAD (FIX-HR2, D-336) |
| Agen / skill | `security-review` / `security-review-gate` |
| Tanggal | 2026-10-30 |
| Laporan sebelumnya | `10d_security_hermes_batch.md` (tidak ditimpa) |
| Batasan yang dipatuhi | Review-only, 0 perubahan kode, data, atau berkas rahasia. Uji dinamis hanya di `127.0.0.1:9021`, tanpa cookie apa pun. Nilai rahasia dibaca di memori dan dibandingkan lewat hash/kesamaan; tidak pernah dicetak. Tidak ada render job dibuat (render-env tidak siap, jadi preflight 503 terjadi sebelum job). 9011 dan `~/gsp-datacenter` tidak disentuh |
| Status | **complete**: vonis PASS, tanpa CAUTION/FAIL |

## 1. Ringkasan

**Vonis: PASS.** H-01, H-02 (sisi DEV), dan L-01 tertutup. 0 temuan baru di atas Low. Ada 1 Low residu (R-1) dan 2 Info.

| ID | Status | Bukti |
|---|---|---|
| H-01 importer MD | **Tertutup** | (1) **Linear:** probe ulang dengan pola siklus 10d di ukuran maksimum baru. `"a\n"` x199.000 = 235 ms (dulu 100k = 7,7 s); `"a  \n"` x199.000 = 152 ms; `*` / `_` / `` ` `` / `[` / `[a](` / `<a ` / `>` sekitar 990 ribu karakter ≤ 570 ms; tabel 100 kolom 970 ribu karakter = 638 ms; komentar HTML tak tertutup, fence terbuka, campuran penekanan, dan `\` + baris baru ≤ 216 ms. Waktu termasuk start sekitar 0,2 s; probe `tsx` lokal. (2) **Batas 413:** `markdown.ts:63,72-75` (1 juta karakter, 200 ribu baris, 50 ribu blok, 100 kolom). Di 9021, 1.000.001 karakter → 413 `PAYLOAD_TOO_LARGE` `reason: MD_TOO_LONG`. (3) **Ember 60/menit dicek sebelum badan dibaca** (`api/studio/import/markdown/route.ts:135-140`): di 9021, 70 panggilan → 59x200 + 11x429 (`Retry-After: 60`); satu panggilan 413 ikut terhitung. (4) **Komentar role:** nama divalidasi terhadap `PARAGRAPH_ROLES_V2` (`markdown.ts:609-612`), dan skema membatasi `role` ke enum (`contract/schema/v2/common.schema.ts:372`). Probe `<!-- role: <script>x</script> -->` → diabaikan (`ROLE_UNKNOWN`), tidak ada role atau teks bocor. Penanda inline diabaikan (`ROLE_MARKER_INLINE`). HTML/skrip tetap dibuang |
| H-02 rahasia DEV | **Tertutup (sisi DEV)** | `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/dev9021.js:6-21` menyuntik 5 rahasia dari `dev_secrets.json`. Hasil perbandingan sha256 di memori: kelima nilai (`INTERNAL_API_SECRET`, `NEXTAUTH_SECRET`, `CRON_SECRET`, `WEBUI_RBAC_TOKEN`, `CLIENT_PULSE_ADMIN_SECRET`) masing-masing 64 karakter, **berbeda dari kunci yang sama di `.env` maupun dari nilai `.env` mana pun**, dan saling unik. `INTERNAL_API_SECRET` = rahasia uji Hermes. Satu-satunya kunci rahasia `.env` yang tidak ditimpa adalah `GOOGLE_CLIENT_SECRET` (klien OAuth, bukan kunci tanda tangan sesi; JWT NextAuth kini ditandatangani `NEXTAUTH_SECRET` DEV). ACL `dev_secrets.json`: hanya `SYSTEM`, `Administrators`, `TRIAL`. Server 9021 masih terikat `127.0.0.1`. Dinamis 9021: `GET /api/studio/templates` tanpa rahasia → 401; dengan **nilai `.env` salinan produksi → 401**; dengan rahasia uji → 200 |
| L-01 gagal-terbuka | **Tertutup** | Salinan `dev9021.js` dijalankan di folder scratch: tanpa `dev_secrets.json` → keluar 1 sebelum spawn; berkas tidak lengkap (`INTERNAL_API_SECRET` pendek, kunci lain hilang) → keluar 1 sebelum spawn. JSON rusak → `JSON.parse` melempar, proses berhenti sebelum spawn. Tidak ada lagi fallback ke `.env` |

## 2. Area tambahan yang diminta

| Area | Hasil | Bukti |
|---|---|---|
| D16 berbasis asal nilai | PASS (tidak dapat dilewati USER) | `engine/lint/structure/checks-d.ts:529-533,562-580`: NOT_APPLICABLE hanya bila kunci tidak bisa ditulis USER atau templat terbatas D-98; selain itu gagal-tertutup. Jalur USER untuk membuat `device.evidenceRail.enabled=false` tertutup: (a) templat → lapis lanjutan non-ADMIN 403 `PARAM_SURFACE_FORBIDDEN` (`skeleton/access.ts` tahap 7; draf R08 sama, siklus 3); (b) override dokumen v1 → hanya bila `inlineFormat` efektif `allow` = pemanggil tepercaya (`ingest/v2.ts` `effectiveInlinePolicy`); jalur norm/v1 lama hanya `legacyV1 && trusted` (`ingest/index.ts:304`); (c) v2 tidak punya medan `overrides` (DISPLAY_FIELD); (d) render inline mengupas override untuk pemanggil tak tepercaya (`render/common.ts:208-216`). Catatan D-335 (cek K/T jalur v1 lama `ingest/index.ts:463` tidak memeriksa lapis) tidak dapat dieksploitasi karena jalurnya hanya untuk pemanggil tepercaya |
| Urutan galat R17 | PASS | 9021: tanpa sesi → 401 untuk `pdf` / `docx` / `docx+pdf`; agen + dokumen tak ada → 404 untuk ketiganya (seragam); agen + dokumen ada + `pdf` → 503 `PDF_ENGINE_UNAVAILABLE`. Keberadaan dokumen hanya terlihat oleh pemanggil terautentikasi, yang memang bisa mendaftar semua dokumen (I-03 desain), jadi tidak ada kebocoran baru. 503 diperiksa sebelum job (`services/render/scope.ts:251-257`) |
| Catch-all PUT/HEAD | PASS | 9021 dengan rahasia uji: PUT/DELETE/OPTIONS → 404 berbadan JSON + `x-correlation-id`; HEAD → 404 tanpa badan + `x-correlation-id`. Tanpa sesi → 401 untuk keempat metode |

## 3. Temuan

| ID | Tingkat | Lokasi | Deskripsi | Remediasi |
|---|---|---|---|---|
| R-1 | Low (residu H-02; disampaikan ke user demi transparansi) | `.env` repo v2.1 | Nilai salinan produksi (`INTERNAL_API_SECRET`, `NEXTAUTH_SECRET`, dll., menurut D-320) masih ada di disk repo dev yang dibaca agen dan skrip (mis. `tests/e2e/studio/lib/env.mjs`). Nilai itu kini ditolak di 9021, tetapi tetap berlaku di produksi bila memang sama. Kesamaannya tidak diverifikasi (`~/gsp-datacenter` di luar batas) | Hapus atau ganti nilai salinan produksi di `.env` v2.1 dengan placeholder atau nilai DEV. Rotasi rahasia produksi bila salinannya sudah dibaca agen. Arahkan skrip E2E ke rahasia DEV |

### Informasional

| ID | Pokok |
|---|---|
| I-1 | `dev_secrets.json` dan `trial_internal_secret` disimpan di `%TEMP%`. Pembersihan otomatis kini hanya menyebabkan server DEV gagal start (gagal-tertutup, ketersediaan saja) |
| I-2 | R17/R07 tidak menerapkan gerbang templat terbatas D-98 saat merender revisi **tersimpan** (`services/render/scope.ts:251-257`). Ini desain lama (D-98/D-107 menggerbang tulis, ingest, validate, artefak inline), bukan regresi delta ini: isi tersimpan sudah lolos gerbang saat ditulis |

## 4. Hasil gerbang (5 cek)

| Cek | Hasil | Rincian |
|---|---|---|
| Credential Leak | PASS (dengan Low R-1) | Rahasia DEV terpisah dari `.env` dan tidak dicetak. Salinan produksi masih ada di `.env` (R-1) |
| Destructive Operation | PASS | Tidak ada operasi baru |
| External Call | PASS | Tidak ada |
| Injection | PASS | Komentar role dibatasi allowlist + enum skema. Importer → JSON + skema v2 |
| Permission Escalation | PASS | D16 tidak bisa dilewati USER. Cookie/rahasia salinan produksi ditolak di 9021 |

**Keseluruhan: PASS.**

## 5. Log

| # | Waktu | Lingkup | Level | Hasil | Keputusan | Peninjau |
|---|---|---|---|---|---|---|
| 4 | 2026-10-30 | Batch Hermes | L3 | CAUTION (H-01, H-02 Medium; L-01) | User: perbaiki semua (D-334) | security-review |
| 5 | 2026-10-30 | Recheck D-334..D-337 | L3 | PASS (1 Low residu, 2 Info) | Tidak perlu keputusan wajib; R-1 disampaikan ke user | security-review |

Tidak ada rahasia yang dikutip dalam laporan ini. Probe ada di `C:\Users\TRIAL\AppData\Local\Temp\claude\sr57d\` (di luar repo, tanpa nilai rahasia).
