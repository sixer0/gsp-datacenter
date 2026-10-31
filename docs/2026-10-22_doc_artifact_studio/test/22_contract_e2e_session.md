# DC-43 Sesi E2E Kontrak (Laporan Kerja Agen) di DEV 9021

Tanggal: 2026-10-31. Pelaksana: test-expert. Baris blueprint DC-43, register BA-43 (U1-U5 = laporan kerja, status, query, draf, unduh), panduan `docs/STUDIO-AGENT-GUIDE.md` seksi 17. Skill: `tdd`, `webapp-testing`. Tidak ada kode produk yang diubah.

## 1. Strategi dan lingkup

- Seam yang diuji: route HTTP publik Studio (R03, R13, R12, R15, R20, R21, R22, R16, R23, R05, R17, R10) dan CLI `scripts/studio/draft-check.ts --remote`, ditambah HTML hasil unduhan yang dibuka di Chromium. Tidak ada uji unit atau mock.
- Target: `http://127.0.0.1:9021` (server milik controller, tidak dimatikan). agentId `test-dc43`, misi `2026-10-31_dc43_e2e`, kartu `t_dc43a7e1`, kata unik `zorvekuarsa<run>`.
- Rahasia dibaca dari `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/trial_internal_secret` di dalam skrip (`readFileSync`) lalu diteruskan sebagai header dan env anak CLI. Rahasia tidak pernah dicetak atau ditulis ke berkas.
- Setiap permintaan mengirim `x-correlation-id: dc43-<run>-<nn>-<langkah>`; server memantulkannya (cid di tabel bagian 4 = nilai header respons).
- Di luar lingkup: render DOCX/PDF, uji beban kuota, dan sesi cookie.

## 2. Skrip

`C:/Users/TRIAL/AppData/Local/Temp/dc43/dc43_e2e.mjs` (Node ESM, `fetch` bawaan, `playwright-core` 1.62.1 dari `node_modules` repo; tidak ada paket baru yang dipasang). Ringkasnya:

| Bagian | Isi |
|---|---|
| U1 | `GET /registry?kind=contracts` -> `POST /slots` beramplop buat (templat `laporan-kerja-agen`, record `draft`, 2 butir) -> 5x `POST /chapters` (bab 1..5) -> `GET /completeness` = COMPLETE |
| U2 | `GET /content?slot=record&shape=submission` -> ubah status `blocked`, vonis `NEEDS_REVIEW`, bukti `correlation` -> `POST /slots` (201 revisi baru) -> kirim ulang badan identik (200 `unchanged`) |
| U3 | R21 `status`, status lama, `cardId` (`matchedItems`), `owner`, `owner&includeArchived=1`, parameter salah (400 tanpa header kuota); R22 kata unik dan `q=<kartu>&type=contractItem`; pid hit dibuka lewat R16 |
| U4 | draf MD (kepala + satu blok `studio.slot/v2` tanpa `agentId`, basis `<id>@rev7`) -> R23 `agentId: test-dc43` -> CLI `draft-check --remote --agent-id test-dc43 --json` -> bandingkan hasil dengan medan `lastFilledAt`/`at` disamarkan -> R05 memastikan revisi tidak berubah |
| U5 | `POST /render {scope: document}` tanpa `formats` -> R10 GET (nama final = header = Content-Disposition = regex `patterns.finalFileName`) -> simpan dengan nama header -> HEAD `?verify=1` |
| Chromium | buka `file:///` HTML unduhan, kumpulkan `console.error`, `pageerror`, permintaan non-`file:`/`data:`/`blob:`/`about:`, tangkapan layar halaman penuh |

Jalankan: `node C:/Users/TRIAL/AppData/Local/Temp/dc43/dc43_e2e.mjs` (keluar 0 bila semua cek lulus). Hasil mentah: `C:/Users/TRIAL/AppData/Local/Temp/dc43/results.json` (run 2) dan `results_run1.json` (run 1).

## 3. Hasil

Run 2 (`run=mvvtrk79`): **29 PASS / 0 FAIL**, keluar 0. Dokumen `cmvvtrk8w00b4v1jgbdbhdcgm`, nomor `007/GSP/LAP/X/2026`.

| U | Cek | Hasil | Bukti (run 2) |
|---|---|---|---|
| U1 | registry kontrak | PASS | 200, count=1, slug `laporan-kerja-agen`, `defaultFormats ["HTML"]` |
| U1 | buat laporan + record | PASS | 201, rev 1, `INCOMPLETE`, missing `content:1..5` |
| U1 | bab 1..5 | PASS | 201 x5, rev 2..6 |
| U1 | kelengkapan | PASS | `COMPLETE`, missing `[]` |
| U2 | baca submission | PASS | 200, `baseRevisionNo` 6, `submitTo` `POST /api/studio/slots` |
| U2 | perbarui status | PASS | 201, rev 7, `changeScope: slot:record` |
| U2 | kirim ulang identik | PASS | 200, `unchanged: true`, rev tetap 7 |
| U3 | R21 `status=blocked` | PASS | ditemukan, rev 7, COMPLETE; header `query`/114 |
| U3 | R21 status lama `draft` | PASS | dokumen run 2 tidak muncul |
| U3 | R21 `cardId` | PASS | `matchedItems` key `t_dc43a7e1`, status `blocked`, pid `p-rbazkwk0f5` |
| U3 | R21 `owner` / `includeArchived=1` | PASS | dokumen ditemukan pada keduanya (count 2 = fixture run 1 + run 2) |
| U3 | R21 parameter salah | PASS | 400 `SCHEMA_INVALID`, tanpa header kuota |
| U3 | R22 kata unik | PASS | 2 hit: `p-rbazkwk0f5` @ `F:record/1` (`contractItem`), `p-jtnwt0wjy3` @ `1.1.1` (`paragraph`); header `query`/117 |
| U3 | R22 kartu `type=contractItem` | PASS | hit `p-2f90190b2f` @ `F:record/2` (butir yang `dependsOn` kartu) |
| U3 | pid hit dapat dibuka (R16) | PASS | 200 |
| U4 | R23 | PASS | `valid: true`, 1 blok, `issues []`, header `validate`/118 |
| U4 | CLI `--remote --agent-id` setara R23 | PASS | exit 0, `valid: true`, JSON identik setelah penyamaran medan jam |
| U4 | dry-run tidak menulis | PASS | R05 rev tetap 7 |
| U5 | render tanpa `formats` | PASS | 200, outputs `["HTML"]`, header `render`/28 |
| U5 | unduh R10 nama final | PASS | `007-GSP-LAP-X-2026_rev7_20261031T031150Z_afa8ac4d.html`; header = `outputs[].finalFileName` = Content-Disposition; cocok regex registri |
| U5 | HEAD `?verify=1` | PASS | `X-Studio-Sha256-Verified: true`; `X-Studio-Sha256` = sha256 lokal `afa8ac4da0341db7...`; sha8 di nama cocok |

Run 1 (`run=mvvtr112`, dokumen `cmvvtr1cr0081v1jgpc5775hn`, `006/GSP/LAP/X/2026`): 22 PASS / 7 FAIL. Penyebabnya galat di skrip uji, bukan di produk: bukti `note` dikirim sebagai string, sehingga U2 ditolak `400 SCHEMA_INVALID` (`/payload/evidence/0/note` "must be object", cid `dc43-mvvtr112-10-U2-update`), dan 6 cek lanjutan ikut gagal. Skrip diperbaiki (`note: { text }`) lalu dijalankan ulang sebagai run 2.

## 4. cid per langkah (run 2)

| # | Langkah | HTTP | cid |
|---|---|---|---|
| 1 | U1 registry | 200 | `dc43-mvvtrk79-01-U1-registry` |
| 2 | U1 buat | 201 | `dc43-mvvtrk79-02-U1-create` |
| 3-7 | U1 bab 1..5 | 201 | `dc43-mvvtrk79-03-U1-ch1` .. `dc43-mvvtrk79-07-U1-ch5` |
| 8 | U1 kelengkapan | 200 | `dc43-mvvtrk79-08-U1-completeness` |
| 9 | U2 baca submission | 200 | `dc43-mvvtrk79-09-U2-read-submission` |
| 10 | U2 perbarui | 201 | `dc43-mvvtrk79-10-U2-update` |
| 11 | U2 kirim ulang identik | 200 | `dc43-mvvtrk79-11-U2-resend-identical` |
| 12 | U3 R21 status | 200 | `dc43-mvvtrk79-12-U3-R21-status` |
| 13 | U3 R21 status lama | 200 | `dc43-mvvtrk79-13-U3-R21-oldstatus` |
| 14 | U3 R21 cardId | 200 | `dc43-mvvtrk79-14-U3-R21-cardId` |
| 15 | U3 R21 owner | 200 | `dc43-mvvtrk79-15-U3-R21-owner` |
| 16 | U3 R21 includeArchived | 200 | `dc43-mvvtrk79-16-U3-R21-includeArchived` |
| 17 | U3 R21 parameter salah | 400 | `dc43-mvvtrk79-17-U3-R21-badparam` |
| 18 | U3 R22 kata | 200 | `dc43-mvvtrk79-18-U3-R22-word` |
| 19 | U3 R22 kartu | 200 | `dc43-mvvtrk79-19-U3-R22-card` |
| 20 | U3 R16 pid | 200 | `dc43-mvvtrk79-20-U3-R16-pid` |
| 21 | U4 R23 | 200 | `dc43-mvvtrk79-21-U4-R23` |
| 22 | U4 R05 cek revisi | 200 | `dc43-mvvtrk79-22-U4-R05-norev` |
| 23 | U5 render | 200 | `dc43-mvvtrk79-23-U5-render` |
| 24 | U5 R10 GET | 200 | `dc43-mvvtrk79-24-U5-R10-get` |
| 25 | U5 R10 HEAD verify | 200 | `dc43-mvvtrk79-25-U5-R10-head-verify` |

CLI `draft-check` memanggil R08/R05 dengan cid buatan server (UUID); CLI tidak mengirim `x-correlation-id`.

## 5. Chromium

- Browser: Chromium 151.0.7922.34 headless (`playwright-core` 1.62.1 dari repo, peramban di `%LOCALAPPDATA%\ms-playwright`).
- Berkas: `C:/Users/TRIAL/AppData/Local/Temp/dc43/007-GSP-LAP-X-2026_rev7_20261031T031150Z_afa8ac4d.html` (2.582.543 byte).
- Galat konsol: **0**. `pageerror`: **0**. Permintaan jaringan eksternal: **0**. Permintaan gagal: **0**.
- Judul halaman "Laporan kerja uji DC-43 mvvtrk79". Tinggi gulir 6.924 px: halaman catatan (tabel catatan, butir, bukti) dan lima halaman bab.
- Tangkapan layar: `C:/Users/TRIAL/AppData/Local/Temp/dc43/dc43_contract_html.png`.

## 6. Temuan (dicatat, tidak diperbaiki)

| ID | Tingkat | Temuan | Bukti |
|---|---|---|---|
| F-43-1 | Rendah (celah dokumen) | Tabel seksi 17.3 panduan menulis `note?` pada `evidence` tanpa menyebut bentuknya. Validator menuntut teks sebaris `{ "text": "..." }`, sehingga string polos ditolak `400 SCHEMA_INVALID` oneOf. | run 1 cid `dc43-mvvtr112-10-U2-update` |
| F-43-2 | Rendah (dokumen vs perilaku) | Seksi 17.11 menyatakan bahwa pada route kiriman, header kuota hanya muncul di respons `429`. Kenyataannya respons `201` `POST /slots` dan `/chapters` membawa `X-Studio-Quota-Bucket: render` beserta sisanya. | run 2 langkah 2-7, 10-11 (mis. `U1-create render/28`) |
| F-43-3 | Rendah (hipotesis) | R21 dan R22 melaporkan sisa kuota `query` dari penghitung terpisah, padahal seksi 17.11 menyebut satu kuota 120/60 detik untuk R21+R22. Di run 1, R21 turun 119→115 sementara R22 mulai lagi dari 119. Dugaan: limiter in-memory per modul route di Next dev (lihat juga D-366). Belum diverifikasi di build produksi. | `results_run1.json` dan `results.json` medan `steps[].quotaRemaining` |

## 7. Sisa fixture

Tidak ada endpoint arsip atau hapus dokumen. R04 hanya menyaring `?archived=0|1` saat GET; R05 hanya punya GET. Arsipkan dokumen berikut lewat jalur controller:

| documentId | Nomor | Run | Berkas render (id R10) |
|---|---|---|---|
| `cmvvtr1cr0081v1jgpc5775hn` | `006/GSP/LAP/X/2026` | 1 (rev 6, status `draft`) | `cmvvtr4g400a2v1jge4s36eos` |
| `cmvvtrk8w00b4v1jgbdbhdcgm` | `007/GSP/LAP/X/2026` | 2 (rev 7, status `blocked`) | `cmvvtrlts00djv1jg2d7yb3w7` |

- Misi `2026-10-31_dc43_e2e` dan nomor sekuens LAP 006 dan 007 ikut terpakai.
- Berkas lokal (bukan fixture DB) ada di `C:/Users/TRIAL/AppData/Local/Temp/dc43/`: skrip, draf, dua HTML, PNG, dan dua results.json.
- Kriteria DC-43 "fixture 0 sisa" baru terpenuhi setelah controller mengarsipkan kedua dokumen di atas.
