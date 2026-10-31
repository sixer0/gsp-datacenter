# 14 — Review kode senior + keamanan delta R2 (baris R2-07)

Tanggal: 2026-10-31. Peninjau: senior-code-reviewer (skill `code-review-senior`). Lingkup: `git diff HEAD` sejak 81336ef (belum di-commit) pada `scripts/studio/studio-report.ts` (baru), `scripts/studio/_repo-alias.ts` (baru), `scripts/studio/draft-check.ts`, `src/lib/studio/services/draft/{check,index}.ts`, `src/lib/studio/registry/contracts.ts`, `src/app/api/studio/registry/route.ts`, `src/lib/studio/contract/types/v2/contract.ts`, uji r2cli/r2reg/dc22/dc28. Konteks: D-402 (M-2 diterima USER untuk `draft-check --remote`), D-419..D-423, laporan `coder_execution_r2_01.md`/`_02.md`, review/security 12/13. Peninjau hanya membaca; tidak ada kode produksi yang diubah.

## Ringkasan

| Domain | Vonis | Isu (H/M/L) |
|---|---|---|
| Struktur kode | CAUTION | 0/0/2 |
| Dampak dependensi | CAUTION | 0/1/0 |
| Duplikasi | CAUTION | 0/1/0 |
| Keterpeliharaan | CAUTION | 0/1/3 |
| Integritas rujukan | CAUTION | 0/1/1 |
| Keamanan | CAUTION | 0/2/3 |

**Vonis keseluruhan: APPROVED WITH COMMENTS.** Tidak ada FAIL. Ada 6 Medium. Sebelum uji ulang Hermes DC-45b di DEV, perbaiki #3 dulu (contoh registri menunjuk dokumen DEV nyata). Keputusan USER diperlukan untuk temuan keamanan #1, #2, #7, #8, #9.

## Bukti segar (dijalankan peninjau)

- `npx vitest run` r2cli-studio-report, r2cli-draft-check, r2reg-contract-examples, dc28-registry-contracts, dc22-draft-check, http-errors: **6 berkas, 249 lulus**. `npx tsc --noEmit -p .`: tanpa keluaran galat. `npx eslint` 6 berkas yang berubah: bersih.
- Probe redirect, dengan rahasia DUMMY dan dua server lokal (307 dari 127.0.0.1 ke localhost):
  - `studio-report` rc 2 `REMOTE_REDIRECT`, server tujuan tidak menerima satu permintaan pun.
  - `draft-check --remote` rc 0, server tujuan menerima `x-internal-secret` (PRESENT). Ini perilaku lama yang sudah diterima di D-402 M-2.
- Probe DEV :9021 (agentId `review-r2-07`, misi `2026-10-31_r2_07`, dijalankan dari cwd di luar repo):
  - R03 `kind=contracts` 200, 11.800 bita (examples 6.329 bita), cid 4e7c8a78-5b07-4e94-89fd-3237a4056a13.
  - R03 tanpa kind: 400, `details` berupa objek, cid 9409641a-a21e-4a45-ab08-75e09d3ed291. R03 dengan filter tak dikenal: `details` tetap larik.
  - `submit` record + bab 1..5: rc 0, dokumen `cmvw0868f01gev1zgeg7akcve` (016/GSP/LAP/X/2026), rev6, verify true, `--out` 1 berkas, timing.csv 25 baris berformat epoch sesuai research/11:206. Submit ulang: 6x `unchanged`, berkas `--out` yang sama diterima karena sha sama (idempoten).
  - `update` 3 blok berubah dengan baseRevisionNo sama: rev7/8/9 201 (cek per lingkup §9.2 lolos). Update ulang: 3x dilewati.
  - Kegagalan di tengah submit (bab 3 G1): rc 1, `BY_CONSTRUCTION_FAILED`, cid c79f68b6-acea-41e9-8cb5-fdb2f7f2e70f. Dokumen setengah jadi (docKey `review-r2-07-b`, record + bab 1-2) tertinggal dan tidak dilaporkan.
  - AC-19 (CLI `--json --with-payload` dibanding R23): hanya `submitPreview.slot.pid` acak dan cap waktu `lastFilledAt`/`at` yang berbeda, cid R23 63285cf6-d299-4c16-b3f5-54f9ed780210.
- Fixture DEV yang dibiarkan (sesuai pola D-408): dokumen 016 rev9 (docKey `review-r2-07-a`) dan dokumen setengah jadi docKey `review-r2-07-b`, keduanya di misi `2026-10-31_r2_07`. Berkas probe di `%TEMP%\r207` sudah dihapus.

## Log isu

| # | Sev | Domain | File:baris | Temuan + bukti | Rekomendasi |
|---|---|---|---|---|---|
| 1 | Medium | Keamanan | `scripts/studio/_repo-alias.ts:4-9`; panduan `docs/STUDIO-AGENT-GUIDE.md:1781` | Dengan U-05c, CLI resmi boleh dijalankan "dari cwd mana pun". Padahal `tsx` membaca `tsconfig.json` dari cwd dan menerapkan `paths`-nya ke impor bare di `src`. Probe: cwd berisi tsconfig `paths: { "ajv/*": ["./evil.cjs"] }` membuat `draft-check` memuat `evil.cjs` (berkas penanda tertulis, kode jalan). Proses yang sama membawa env `INTERNAL_API_SECRET`. Alias `@/` sendiri aman (path absolut dari `__dirname`), tetapi klaim "tidak memuat modul dari cwd" tidak berlaku untuk proses CLI secara utuh. Catatan: `npx tsx` juga mencari `tsx` di `node_modules/.bin` cwd lebih dulu. | Pin tsconfig. Terverifikasi: `tsx --tsconfig <repo>/tsconfig.json` atau `TSX_TSCONFIG_PATH` membuat penanda tidak tertulis dan rc 0. Sediakan peluncur (`node <repo>/node_modules/tsx/dist/cli.mjs --tsconfig <repo>/tsconfig.json ...`) dan perbarui panduan §17 serta brief. |
| 2 | Medium | Keamanan | `scripts/studio/studio-report.ts:794-798, 342` | `studio-report` mengirim rahasia ke `--remote`, atau ke env `HQ_URL` bila opsi itu tidak diberikan, termasuk `http://` ke host non-loopback, lalu MENULIS data (R13/R12/R04/R17). Penerimaan USER D-402 M-2 hanya mencakup `draft-check`, yang dry-run saja. Perbandingan: soal pengalihan, `studio-report` lebih sempit (tidak diikuti, terbukti probe). Soal dampak, lebih luas (menulis). Soal tujuan, sama (URL apa pun). Fallback `HQ_URL` bisa menunjuk produksi tanpa niat eksplisit. | Opsi untuk USER (di bawah). Perbaikan yang disarankan: izinkan hanya loopback atau `https:`; selain itu wajib `--allow-remote-host`. Tampilkan host tujuan di keluaran. |
| 3 | Medium | Integritas rujukan | `src/lib/studio/registry/contracts.ts:186` (`AGENT_WORK_REPORT_TARGET`), `:213` (`refs`) | Contoh "salin apa adanya" memakai ID DEV nyata. `cmvuz4mn70001v1jgoom5m4qw` adalah 001/GSP/LAP/X/2026 di misi `2026-10-30_dc31_gate` (R05 200, cid db2943a4-7592-4aee-af57-ed8d828fc2d2). Ref `cmvuz5jlk0020v1jg9vekh7rp` adalah 002 (cid bd431dff-a2a7-4f5c-928d-27e5242fb5ae). Dry-run R08 bab 1 contoh APA ADANYA: `valid: true`, `submitPreview.documentId` = dokumen 001, `created: false` (cid beee6884-7089-431d-9ad4-cd2ef3b572d1). Artinya agen yang lupa mengganti target akan menulis revisi ke laporan orang lain di DEV, tempat uji ulang dijalankan. | Ganti dengan ID placeholder yang lolos pola tetapi mustahil ada, mis. `GANTI_documentId_dari_respons_record`, atau cuid sintetis yang terdokumentasi. Hapus `refs` dari contoh atau beri placeholder. Tambahkan uji bahwa ID contoh tidak ada di fixture atau bukan bentuk ID DEV. |
| 4 | Medium | Dampak dependensi | `src/app/api/studio/registry/route.ts:369-385` | `details` REGISTRY_KIND_UNKNOWN berubah dari larik isu menjadi objek. Akibatnya kode yang sama di route yang sama punya dua bentuk: filter tak dikenal tetap larik (probe). Amplop di 01_specs §6.2 (`masterplan/01_specs.md:751`) menyatakan `details?: ValidationIssue[]`. Klien lama yang membaca `details[0].message` (dulu diuji di dc28 :96) rusak. API-REF :417 tidak menjelaskan bentuk ini. Dalam repo, hanya `firstPointer` di studio-report yang menangani kedua bentuk. | Pertahankan larik satu isu yang diperluas, `[{ pointer, keyword, message, received, validKinds, examples }]`: kompatibel ke belakang dan satu bentuk per kode. Bila objek dipertahankan, catat sebagai keputusan dan perbarui 01 §6.2, 05 §9.4, dan API-REF. |
| 5 | Medium | Keterpeliharaan | `scripts/studio/studio-report.ts:632-645, 380` | Submit tidak atomik dan hanya diperiksa lokal sebelum tulis pertama. Bila galat terjadi di tengah, dokumen setengah jadi tertinggal, sementara galat dan `fatal` JSON tidak memuat `documentId`, `docNumber`, atau langkah yang sudah sukses (probe cid c79f68b6). Mengirim ulang submit memang idempoten lewat kunci misi+docKey (terbukti), tetapi operator tidak tahu dokumen itu ada. | Sertakan `documentId`, `docNumber`, dan `completedSteps` di `ReportError.info` dan di `fatal` untuk setiap galat sesudah dokumen dibuat. Opsional: `--preflight` dry-run R08 (dengan simulasi berurutan) sebelum tulis pertama. |
| 6 | Medium | Duplikasi | `scripts/studio/draft-check.ts:162-189` dan `studio-report.ts:317-392`; `studio-report.ts:43` | Ada dua klien HTTP untuk satu API dengan kebijakan berbeda: redirect (ikuti vs `manual`, divergensi yang relevan untuk keamanan), timeout (30 vs 60 s), dan kode 401 (`REMOTE_UNAUTHORIZED` vs kode server `UNAUTHORIZED`), sehingga kode fatal kedua CLI tidak konsisten. `studio-report` juga mengimpor modul CLI `draft-check`, coupling antar-CLI. | Ekstrak `scripts/studio/_http.ts` (header rahasia, `redirect: "manual"`, timeout, peta galat) dan `normalizeBaseUrl`. Langkah ini sekaligus menutup kebocoran rahasia lewat redirect di draft-check tanpa biaya. |
| 7 | Low | Keamanan | `services/draft/check.ts:466-471` dan `app/api/studio/drafts/check/route.ts:139-143` | KD-43 menetapkan satu tagihan per blok dry-run. Simulasi U-05a menjalankan dry-run KEDUA, dengan ingest penuh, untuk blok bersumber yang menjawab META_REQUIRED_FOR_CREATE, tanpa tagihan. Akibatnya hingga sekitar 2x kerja per tagihan R23 (maksimal 20 blok). | Tagih 2 untuk blok yang punya sumber, atau tagih saat dry-run ulang. |
| 8 | Low | Keamanan | `studio-report.ts:137-140, 364` | `csvField` sudah memenuhi RFC 4180 tetapi tidak menetralkan awalan `= + - @`. `err_code` diambil dari badan server dan `corr_id` dari header, keduanya dikendalikan server (dan `--remote` boleh ke URL apa pun). Formula bisa tereksekusi saat timing.csv dibuka di spreadsheet. | Awali sel yang dimulai `= + - @ \t \r` dengan `'`, atau batasi `err_code` ke `^[A-Z0-9_]{1,64}$`. |
| 9 | Low | Keamanan | `studio-report.ts:683-685` | `safeFinalName` lebih longgar dari `FINAL_FILENAME_PATTERN` (`contract/env.ts:178`): menerima `CON.html` dan `...` dari server jahat. Traversal sudah tertutup, dan `wx` mencegah penimpaan. | Pakai `FINAL_FILENAME_PATTERN` (satu sumber kebenaran). |
| 10 | Low | Integritas rujukan | `services/draft/check.ts:536` dibanding `services/submit/lock.ts:66-80` | Pemetaan bab tanpa docKey ke blok buat lebih lebar dari aturan server. Probe `nokey.md`: blok 2-6 tetap `DOC_TARGET_AMBIGUOUS` di CLI maupun R23 (cid 2f309ca5-f3e9-44e5-84da-a4924cc54b09), tetapi keluaran manusia menulis "(target: dokumen yang dibuat blok 1)", dan `studio-report submit` akan mengarahkannya ke documentId lalu berhasil. Jadi draft-check dan submit tidak sepakat. | Wajibkan docKey yang sama secara eksplisit, atau salin docKey efektif ke `simulatedCreateInput`. Samakan aturannya di studio-report. |
| 11 | Low | Keterpeliharaan | `studio-report.ts:664`; `:66` dibanding `:635` | Pada `update`, target `documentId` milik blok diganti diam-diam dengan argumen CLI, sehingga blok yang menyebut dokumen lain terkirim ke dokumen argumen. Selain itu `--mission` diterapkan ke semua blok, padahal bantuan menyebut "blok pembuat dokumen dan blok sesudahnya". | Tolak blok yang `target.documentId`-nya berbeda dari argumen. Selaraskan teks bantuan. |
| 12 | Low | Struktur | `studio-report.ts:262, 570`; `_repo-alias.ts:14`; `draft-check.ts` (`main` catch) | Kode `TIMING_HEADER_MISMATCH` dipakai juga untuk "tanpa baris baru akhir". `readDraft` memintas fs yang disuntik. Fallback `process.cwd()` pada `REPO_ROOT` mati (patch tidak aktif di ESM) dan menyesatkan bila diimpor. Pada `--json`, `INTERNAL_ERROR` draft-check mencetak stack ke stdout, padahal handler bawah sudah membuang stack. | Kode `TIMING_NO_TRAILING_NEWLINE`. Wajibkan `readFileSyncBuffer`. Hapus fallback cwd. Buang stack dari pesan fatal. |
| 13 | Low | Keterpeliharaan (uji) | `tests/unit/studio/api/r2reg-contract-examples.test.ts:120-135`; `r2cli-studio-report.test.ts:289-328` | Bab contoh hanya di-dry-run di dalam doc/v2, tidak dengan amplopnya sendiri (target documentId), sehingga cacat #3 tidak tertangkap. Update multi-blok dan kegagalan di tengah submit juga belum diuji. | Tambahkan ketiga uji itu. |
| 14 | Low | Struktur | `scripts/studio/md2contract.ts`, `md2chapter.ts`, `glossary-check.ts` | Alias cwd-bebas hanya ada di 2 dari 5 CLI. | Putuskan cakupannya, atau dokumentasikan bahwa hanya dua CLI yang cwd-bebas. |

## Baris perbaikan berpemilik (High/Medium)

| Baris | Isu | Pemilik | Verifikasi |
|---|---|---|---|
| R2-07-F1 | #3 ID contoh nyata | coder-execution (pemilik R2-02) | dry-run bab contoh apa adanya tidak boleh `valid: true` ke dokumen yang ada; uji r2reg baru |
| R2-07-F2 | #1 pin tsconfig | coder-execution (peluncur) + R2-06 (panduan/brief) | probe tsconfig jahat di cwd: penanda tidak tertulis |
| R2-07-F3 | #5 progres saat galat | coder-execution (R2-01) | uji galat di tengah: `fatal.details.documentId` ada |
| R2-07-F4 | #6 klien HTTP bersama | coder-execution (R2-01) | probe redirect: kedua CLI tidak meneruskan rahasia |
| R2-07-F5 | #4 bentuk `details` | controller (keputusan) lalu coder-execution (R2-02) / pemilik spesifikasi | dc28 + r2reg; 01 §6.2/API-REF selaras |
| R2-07-F6 | #2 tujuan rahasia | menunggu keputusan USER lalu coder-execution | uji: `http://` non-loopback ditolak tanpa opsi eksplisit |

## Opsi keputusan USER (keamanan CAUTION)

- **#1 (M) cwd tak dipercaya memuat kode lewat tsconfig.** (a) Perbaiki: peluncur + `--tsconfig`, panduan diperbarui (disarankan). (b) Terima risiko tercatat: agen hanya menjalankan CLI dari cwd tepercaya. (c) Ubah lingkup: batalkan klaim "cwd mana pun" di panduan.
- **#2 (M) `studio-report` mengirim rahasia ke URL apa pun lalu menulis.** (a) Perbaiki: hanya loopback/https, selain itu wajib `--allow-remote-host`, dan fallback `HQ_URL` ditampilkan (disarankan). (b) Terima risiko tercatat dengan memperluas D-402 M-2 ke studio-report. (c) Ubah lingkup: hapus fallback `HQ_URL` dan wajibkan `--remote`.
- **#7 (L) dry-run ulang R23 tanpa tagihan.** (a) Perbaiki: tagih per dry-run. (b) Terima risiko tercatat (maksimal 2x, terautentikasi). (c) Ubah lingkup: simulasi hanya di CLI. Opsi (c) melanggar AC-19, jadi tidak disarankan.
- **#8 (L) injeksi formula CSV.** (a) Perbaiki: netralkan awalan sel. (b) Terima risiko tercatat (CSV hanya dibaca skrip analisis).
- **#9 (L) allowlist nama `--out`.** (a) Perbaiki: pakai `FINAL_FILENAME_PATTERN`. (b) Terima risiko tercatat (server tepercaya, traversal sudah tertutup).

## Tantangan utama

1. **Contoh "salin apa adanya" harus aman bila disalin persis.** Badan contoh yang disajikan ke agen otonom adalah antarmuka, bukan dokumentasi. Saat ini menyalin persis menghasilkan tulis yang sah ke dokumen orang lain (#3).
2. **"Jalan dari cwd mana pun" memperluas permukaan serangan.** Kemudahan ini sah, tetapi tanpa pin tsconfig ia mengubah cwd menjadi masukan kode (#1). Pin cukup satu flag.
3. **Satu API, dua klien.** Perbedaan kebijakan redirect antara kedua CLI adalah bukti nyata biaya duplikasi (#6). Ekstraksi menutup risiko yang diterima di M-2 tanpa biaya.
4. **Submit yang gagal di tengah harus melaporkan apa yang sudah ditulis** (#5). Idempotensi kunci misi menyelamatkan pengiriman ulang, tetapi operator perlu tahu dokumennya ada.

## Temuan positif

- Penanganan rahasia di `studio-report` benar: hanya header, tidak dicetak, tidak masuk timing (uji r2cli :252). Pengalihan tidak diikuti, terbukti probe. `normalizeBaseUrl` membuang userinfo (`u.origin`).
- Nol berkas sementara: tulisan hanya `--out` (`wx`, sha sama diterima, tanpa timpa) dan `--timing` (header dicek sebelum kiriman pertama, satu kali append). Uji spy fs :341. Hanya cache transpilasi tsx yang ada di %TEMP% (sudah dicatat D-423).
- Simulasi berurutan berada di layanan bersama, sehingga AC-19 terjaga (probe: hanya pid dan cap waktu yang beda). Validasi R23 tidak melemah: dry-run ulang hanya pada META_REQUIRED_FOR_CREATE, isi blok tetap divalidasi penuh, dan blok buat yang tidak sah tetap menggagalkan `valid`.
- Update: baseRevisionNo otomatis aman untuk multi-blok (per lingkup), dan blok tak berubah dilewati.
- Examples konten-saja (D-139). Lolos skema, lint, dan dry-run (kecuali celah amplop #13). Ukuran R03 terbatas (+6,3 KB). `received` dipotong 64 karakter. U-07 mempertahankan kontrak 400.
- Kode keluar dan pesan galat konsisten: code + cid + pointer di stderr, dan `fatal` JSON lengkap.

## Berkas yang ditinjau

`scripts/studio/studio-report.ts`, `scripts/studio/_repo-alias.ts`, `scripts/studio/draft-check.ts`, `src/lib/studio/services/draft/check.ts`, `src/lib/studio/services/draft/index.ts`, `src/lib/studio/registry/contracts.ts`, `src/app/api/studio/registry/route.ts`, `src/lib/studio/contract/types/v2/contract.ts`, `src/app/api/studio/drafts/check/route.ts` (pemanggil), `src/lib/studio/services/submit/lock.ts` + `overwrite.ts`/`pipeline.ts` (semantik target/baseRevisionNo), `src/lib/studio/contract/env.ts` (FINAL_FILENAME_PATTERN), `tests/unit/studio/draft/r2cli-studio-report.test.ts`, `r2cli-draft-check.test.ts`, `dc22-draft-check.test.ts`, `tests/unit/studio/api/r2reg-contract-examples.test.ts`, `dc28-registry-contracts.test.ts`, `decisions/decisions.md` (D-402, D-419..D-423), `delegation_progress/coder_execution_r2_01.md`, `_02.md`, `masterplan/01_specs.md` §6.2, `docs/API-REFERENCE.md:417`, `docs/STUDIO-AGENT-GUIDE.md` §17 (rujukan), `research/11_contract_efficiency_protocol.md:206`.
