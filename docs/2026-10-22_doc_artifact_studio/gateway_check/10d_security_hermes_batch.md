# SR-57 batch Hermes — Security review D-322..D-331

| Medan | Isi |
|---|---|
| Lingkup | FIX-H7 importer Markdown (`POST /api/studio/import/markdown`, `services/import/**`); FIX-H6 catch-all `src/app/api/studio/[[...notfound]]/route.ts` + `http/route-not-found.ts`; FIX-H1/HZ1 preflight PDF 503 (`services/render/preflight.ts`, R17/R07); FIX-H2 `overwrittenPids` (`services/submit/overwrite.ts`); R08 `details` (`validate/_shared/error-issues.ts`); FIX-H8/HZ2 alt-text (`engine/docx/figures/alt-text.ts`, DOCX `wp:docPr`, HTML `alt`/`aria-label`); seed Δ (D-329); rahasia uji DEV (`dev9021.js` + `trial_internal_secret`) |
| Agen / skill | `security-review` / `security-review-gate` |
| Tanggal | 2026-10-30 |
| Batasan yang dipatuhi | Review-only, 0 perubahan kode atau data. Uji dinamis hanya di `127.0.0.1:9021`, tanpa cookie apa pun. Rahasia uji dibaca dengan `$(cat …)` dan tidak pernah dicetak. Tidak ada render job dibuat (render-env `ready:false`, jadi preflight 503 terjadi sebelum job). Port 9011 dan `~/gsp-datacenter` tidak disentuh. Tidak ada rahasia dikutip |
| Status | **needs-review**: vonis CAUTION, keputusan milik user lewat controller |

## 1. Ringkasan

**Vonis: CAUTION.** 0 High, 2 Medium (UNTUK USER), 1 Low, 4 Info.

| Area | Vonis |
|---|---|
| Importer Markdown | **CAUTION (H-01)**: ada jalur kuadratik yang memblokir event loop proses HQ, dan konversinya tanpa rate limit. Auth, batas ukuran, pembuangan HTML, dan JSON keluaran: PASS |
| Catch-all 404 | PASS: auth dijalankan sebelum 404; path dipantulkan dalam bentuk percent-encoded; id hanya dimasukkan ke hint bila lolos `SAFE_ID` |
| Preflight PDF 503 | PASS: `causes` berupa kalimat tetap + hitungan, tanpa path, nama berkas fon, atau info lingkungan; 404 diperiksa sebelum 503 |
| `overwrittenPids` / R08 `details` | PASS: `editedBy` = `createdBy` revisi, yang sudah terbaca semua sesi lewat riwayat pid (I-03 desain); R08 = isi galat kiriman nyata (4xx saja) |
| Alt-text DOCX/HTML | PASS: escape atribut dan pembuangan karakter XML tidak sah terbukti lewat probe |
| Seed Δ | PASS: penjaga DB tetap (`seed-studio.ts:114,183,1176`) |
| Rahasia uji DEV | Rahasia uji itu sendiri PASS. **CAUTION (H-02)** untuk kunci tanda tangan sesi yang dipakai bersama dengan produksi; Low (L-01) untuk fallback yang gagal-terbuka |

## 2. Temuan

| ID | Tingkat | Jenis | Lokasi | Deskripsi | Remediasi | Verifikasi |
|---|---|---|---|---|---|---|
| **H-01** **UNTUK USER** | **Medium** | CWE-407 / CWE-1333 (kompleksitas algoritmik), CWE-770; ISO A.13, A.14.2 | `src/lib/studio/services/import/inline.ts:289-294` (`/ {2,}$/.test(buf)` dan `buf.replace(/[ \t]+$/, …)` pada setiap `\n`); route `src/app/api/studio/import/markdown/route.ts:149-161` (rate limit hanya untuk `?validate=1`) | Setiap baris baru di paragraf menjalankan regex berjangkar `$` atas buffer yang terus tumbuh, sehingga kerjanya O(n²). Probe lokal (`tsx`, keluaran tanpa rahasia; angka termasuk start sekitar 0,2 s) dengan paragraf `"a\n"` berulang: 25k baris = 0,65 s, 50k = 2,15 s, 100k = 7,7 s (sekitar x3,6 per penggandaan). Konversi berjalan **sinkron di event loop** proses HQ bersama, dengan batas 4.000.000 karakter (`markdown.ts:56`). Satu permintaan sah (sesi apa pun atau pemegang `x-internal-secret`) bisa membekukan HQ: ekstrapolasi untuk sekitar 2 juta baris adalah puluhan menit (hipotesis; tidak diuji di 9021 agar server tidak dibekukan). Konversi tanpa `?validate=1` tidak dibatasi laju: 130/130 permintaan diterima di 9021. Klaim D-328 "masukan adversarial kini linear" tidak berlaku untuk kasus ini. Pola lain yang diuji tetap linear: `*`, `_`, `` ` ``, `[`, `[a](`, `<a `, `>`, tabel 1,6 MB (1,3 s), daftar | Ganti penanganan `\n` dengan pelacakan spasi akhir tanpa regex (penghitung atau `trimEnd` lokal pada potongan terakhir, atau kumpulkan bagian dalam array). Tambahkan batas baris/blok per paragraf. Hitung **semua** panggilan route dengan `checkValidateRate` (atau ember impor sendiri). Pertimbangkan worker thread atau batas waktu untuk konversi besar | Probe yang sama untuk 100k baris selesai < 0,5 s dan waktunya naik linear dengan 4x masukan. Panggilan ke-121 dalam satu menit → 429 |
| **H-02** **UNTUK USER** | **Medium** (naik ke **High** bila kesamaan terbukti) | CWE-321 / CWE-1188 (kunci rahasia dipakai bersama antar-lingkungan); OWASP A07; ISO A.9, A.10, A.12.1 (pemisahan lingkungan) | `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/dev9021.js:9` (hanya `INTERNAL_API_SECRET` yang ditimpa); `src/lib/hq-session.ts:63-86` (sesi diverifikasi hanya dengan HMAC + `exp`, tanpa cek DB) | D-320 mencatat `.env` v2.1 adalah **salinan produksi**. Peluncur DEV hanya menimpa rahasia internal; `NEXTAUTH_SECRET` (kunci tanda tangan cookie `gsp_hq_session`) tetap nilai `.env`. Bila nilainya sama dengan produksi, cookie yang diterbitkan login di 9021 (dari akun `WebUiUser` DB **v21**, yang bisa dibuat siapa pun yang punya akses tulis DB dev, mis. `scripts/seed-webui-admin.mjs`) termasuk `r: "ADMINISTRATOR"`, juga diterima HQ produksi :9011 (`0.0.0.0`). Cookie juga tidak dipisah per port di host yang sama. Selain itu, `INTERNAL_API_SECRET` di `.env` v2.1 (salinan produksi) dibaca agen dan skrip E2E di repo dev (`test/06_e2e_session.md:17`). **Status: hipotesis kuat** (dasar: provenance D-320 + jalur kode), tidak diverifikasi karena `~/gsp-datacenter` dan 9011 di luar batas | Buat `NEXTAUTH_SECRET` (dan `INTERNAL_API_SECRET`) khusus DEV: suntikkan lewat `dev9021.js` seperti rahasia uji, atau ganti di `.env` v2.1. Rotasi nilai produksi bila salinannya sudah menyebar ke agen/skrip. Pertimbangkan nama cookie per lingkungan | Controller/user membandingkan sidik `sha256` kedua `NEXTAUTH_SECRET` (v2.1 vs produksi) secara lokal tanpa mencetak nilainya; sama → High, segera rotasi. Setelah perbaikan: cookie dari 9021 ditolak 9011 (uji oleh operator) |
| L-01 | Low | CWE-636 (gagal-terbuka) | `dev9021.js:8-9` | Bila `trial_internal_secret` hilang (folder `%TEMP%` bisa dibersihkan), peluncur diam-diam memakai `INTERNAL_API_SECRET` dari `.env` (salinan produksi) tanpa peringatan | Gagal-tertutup: hentikan peluncuran bila berkas rahasia uji tidak ada atau kosong. Pindahkan berkas ke lokasi yang tidak dibersihkan otomatis | Hapus sementara berkas → peluncur menolak start |

### Penilaian rahasia uji DEV (diminta)

PASS untuk rahasia itu sendiri:
- 64 karakter heksa (32 byte acak).
- ACL hanya `SYSTEM`, `Administrators`, `TRIAL` (`icacls`).
- **Berbeda** dari `INTERNAL_API_SECRET` dan `NEXTAUTH_SECRET` di `.env` (perbandingan boolean).
- 0 kemunculan di 7.717 berkas yang dipindai (log Studio, folder tugas, `tests`, `scripts`, folder clone, `~/.hermes`).
- Server DEV hanya terikat `127.0.0.1:9021` (`Get-NetTCPConnection`), sedangkan produksi `0.0.0.0:9011`.
- Rahasia diberikan sebagai env proses, tidak ditulis ke repo.

Kelemahan pendekatannya ada di H-02 dan L-01.

### Informasional

| ID | Pokok |
|---|---|
| I-1 | Importer membuang tag HTML inline tetapi mempertahankan teks di dalamnya sebagai teks polos. Contoh: `# Judul <script>alert(1)</script>` → judul `"Judul alert(1)"` (9021). Aman (teks di-escape saat render), tetapi isi skrip yang terlihat sebagai teks bisa membingungkan. `report.dropped[].excerpt` memantulkan potongan HTML mentah di JSON `application/json`; aman |
| I-2 | Respons JSON Studio tanpa `X-Content-Type-Options: nosniff` (warisan, semua route; header 9021). Hardening opsional |
| I-3 | `causes` preflight menyebut jumlah fon dan perlunya keluar-masuk sesi Windows (info operasional awam, tanpa nama/path). Rincian fon/versi soffice tetap di R11 (butuh sesi, warisan desain) |
| I-4 | Tautan `javascript:` di Markdown dijadikan teks polos `x (javascript:alert(3))`, bukan tautan. Inline v2 memang tanpa URL |

## 3. Hasil gerbang (5 cek)

| Cek | Hasil | Rincian |
|---|---|---|
| Credential Leak | **CAUTION** | H-02: kunci tanda tangan sesi produksi (salinan) ada di lingkungan DEV yang ditulisi agen. Rahasia uji tidak bocor (0/7.717 berkas, tidak dicetak) |
| Destructive Operation | PASS | Tidak ada operasi hapus baru. Importer dan dry-run tanpa tulis |
| External Call | PASS | Tidak ada panggilan keluar baru |
| Injection | PASS | Importer → JSON terserialisasi + skema v2. Alt-text: `attrs()` → `escapeXml` (`docx/package/xml.ts:128-135`), HTML `escText` (`html/tables/figure.ts:70`, `svg.ts:248`). Probe `"><script>&\u0001` → ter-escape, kontrol dibuang. Catch-all: path percent-encoded, `idOr`/`SAFE_ID` (`route-not-found.ts:53-55`) |
| Permission Escalation | **CAUTION** | H-02 (lintas lingkungan, hipotesis kuat). Di dalam Studio: catch-all `requireSession` dulu (`[[...notfound]]/route.ts:24-27`); dry-run impor memakai `dryRunChapter` dengan pemanggil sebenarnya (gerbang templat terbatas utuh) |

**Keseluruhan: CAUTION** → controller menanyakan user (perbaiki / terima risiko tercatat / ubah lingkup) untuk H-01 dan H-02.

## 4. Bukti segar

- 9021 tanpa cookie: `POST /api/studio/import/markdown` → 401; `GET /api/studio/nope/x` → 401.
- 9021 dengan rahasia uji:
  - Impor kecil → 200 (`content-type: application/json`, `x-correlation-id`); HTML/skrip dibuang.
  - Catch-all `POST …/documents/%3Cscript%3E…/slots` → 404, path tetap ter-encode, hint berisi placeholder `{id}`.
  - R17 dan R07 untuk dokumen tak ada → 404 sebelum preflight.
  - R17 `formats:["pdf"]` pada dokumen ada → 503 + `Retry-After: 300`, `jobCreated:false`, `causes` tanpa path (grep path/fon/HKCU = 0).
  - 130 impor tanpa `?validate=1` → 130 x 200.
- Probe lokal `tsx` atas `importMarkdownChapter` (11 pola adversarial + skala 25k/50k/100k baris) dan alt-text (`attrs`, `figureAltText`).
- Pembacaan kode dengan rujukan `berkas:baris` di atas.

## 5. Log

| # | Waktu | Lingkup | Level | Hasil | Keputusan | Peninjau |
|---|---|---|---|---|---|---|
| 4 | 2026-10-30 | Batch Hermes D-322..D-331 + rahasia uji DEV | L3 | CAUTION (2 Medium, 1 Low, 4 Info) | Menunggu keputusan user lewat controller atas H-01, H-02 | security-review |

Tidak ada rahasia yang dikutip dalam laporan ini. Berkas probe sementara ada di `C:\Users\TRIAL\AppData\Local\Temp\claude\sr57d\` (di luar repo; berisi respons uji tanpa rahasia).
