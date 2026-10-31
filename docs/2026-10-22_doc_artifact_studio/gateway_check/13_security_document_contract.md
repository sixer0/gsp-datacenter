# 13 Security review: delta document contract (baris DC-41)

| Medan | Isi |
|---|---|
| Baris | DC-41 (blueprint `identification/07_document_contract_blueprint.md`; register `masterplan/05_document_contract_specs.md` BA-41, AS-2, CA-11; risiko R6 blueprint) |
| Agen | `security-review` (skill `security-review-gate`), hanya meninjau, tanpa perbaikan |
| Lingkup | `git diff c2620b3..HEAD` (commit `2a6f78e`) + `git diff HEAD` (4 berkas belum dikomit: `scripts/studio/draft-check.ts`, `src/app/api/studio/drafts/check/route.ts`, `src/lib/studio/services/draft/check.ts`, `src/lib/studio/services/submit/pipeline.ts`) atas `src/**`, `scripts/studio/**`, `prisma/**` (97 berkas, +8176/-440) |
| Server probe | DEV `http://127.0.0.1:9021` (DB `gsp_agent_hq_v21`), identitas `x-internal-secret` lewat substitusi shell (nilai tidak pernah dicetak), agentId `security-dc41`; sekitar 60 permintaan, semua baca atau dry-run (0 tulis DB) |
| Tanggal | 2026-10-30, sekitar 13:15-13:22 UTC |
| Level | L3 Deep Audit (route baru, akses data lintas misi, kredensial CLI, migrasi skema). L4 tidak berlaku (tanpa deploy produksi) |
| Status | `needs-review`: ada 2 temuan Medium (CAUTION) yang harus diputuskan user lewat controller |

## 1. Ringkasan

**Verdict keseluruhan: CAUTION.** 0 High, 2 Medium, 6 Low.

| Butir | Verdict | Inti |
|---|---|---|
| 1 Kebijakan baca R21/R22 | **CAUTION** (M-1) | Satu panggilan R22 mengembalikan hit dari 2 misi + dokumen tanpa misi, berikut cuplikan teks; arsip dan revisi lama ikut. Sesuai AS-2, tetapi kemampuan "grep seluruh korpus" bertambah, dan akses yang berhasil tidak tercatat |
| 2 Injeksi FTS/SQL | **PASS** (+L-1) | `websearch_to_tsquery` terparameter, kursor divalidasi, filter berpola; 0 injeksi. Byte NUL memicu 500 (L-1) |
| 3 Batas ukuran/DoS R23 + importer | **PASS** (+L-2, L-3) | 413 C54 dan tagihan per blok bekerja. Jalur tanpa blok dry-run tidak ditagih (L-2). `PHASE_RE` importer berwaktu kubik (L-3, hanya CLI) |
| 4 Enumerasi I55 | **PASS** (bersyarat) | Detail galat mengungkap ada atau tidaknya dokumen/pid dan `currentRevisionNo`, tetapi semua itu sudah bisa dibaca lewat R04/R05 di bawah AS-2 |
| 5 `evidence.ref` (CA-11) | **PASS** | Tidak pernah dibuka. Canary 0 hit; ref dirender sebagai teks literal yang di-escape |
| 6 Injeksi header nama final | **PASS** | Ada gerbang regex C51 sebelum header dipasang; CRLF, parameter ganda, dan nilai asing di `?name=` -> 400; docNumber aneh dibersihkan |
| 7 Kuota | **PASS** (+L-4) | Bucket memakai identitas terautentikasi; agentId tidak memecah bucket; tanpa header sebelum tagihan. INTERNAL_AGENT berbagi satu bucket (L-4) |
| 8 CLI draft-check/md2contract | **CAUTION** (M-2) | Rahasia tidak pernah tercetak, tetapi `--remote` mengirim `x-internal-secret` lewat http ke host apa pun dan meneruskannya saat redirect lintas origin (terbukti) |
| 9 Migrasi | **PASS** (+L-5) | 0 DROP/TRUNCATE/DELETE; kolom GENERATED STORED + GIN aditif. Catatan lock saat rollout produksi (L-5) |

- **Non-kepatuhan GDPR:** 0 GAP yang memblokir. 1 PARTIAL (Art. 25/5(1)(c): pencarian korpus global, M-1).
- **Celah ISO 27001:** A.9 PARTIAL (M-1), A.12.4 PARTIAL (akses R21/R22 yang berhasil tidak dicatat, M-1), A.13 PARTIAL (M-2), A.12.6 tidak dinilai.
- **Dimensi yang dilewati:** GDPR Art. 7 (persetujuan), 15/16/20 (akses, rektifikasi, portabilitas) dan Art. 33 (alur notifikasi breach) N/A untuk delta ini: tidak ada data subjek baru yang dikumpulkan. Medan kontrak (`owner`, `initiator`) berpola pelaku agen/profil (C36). ISO 27701 PIMS dan A.16 tidak dinilai: tidak ada perubahan proses di delta ini. A.12.6 (audit dependensi/CVE) tidak dijalankan karena delta tidak menambah dependensi.

## 2. Tabel temuan

| ID | Severity | Tipe | Lokasi | Deskripsi | Remediasi |
|---|---|---|---|---|---|
| M-1 | Medium | OWASP A01 / CWE-284 (lensa); ISO A.9.4.1, A.12.4.1; GDPR Art. 25, 5(1)(c) | `src/lib/studio/services/query/search.ts:51-73` (tanpa syarat pemanggil/arsip), `:53-54` (revisi lama lewat `documentId+revisionNo`), `:97` (`ts_headline`); `src/lib/studio/services/query/contracts.ts:65-80` (tanpa `archived`); `src/app/api/studio/search/route.ts:36-48`, `contracts/route.ts:34-46` (tanpa log akses sukses) | Setiap pemanggil terautentikasi, termasuk semua agen pemegang satu rahasia bersama, bisa mencari teks penuh di semua misi, dokumen arsip, dan revisi lama, lalu menerima cuplikan paragraf. Probe `abbfeff2` mengembalikan 84 hit: 51 dari `2026-10-30_hermes-retrial`, 28 dari `2026-10-30_hermes-trial`, 5 dari dokumen tanpa misi. Isinya setara R04/R05 (AS-2), tetapi kemampuan menemukan isi berlipat: satu kueri bisa mencari string sensitif di seluruh korpus. Panggilan yang berhasil tidak menulis log akses (hanya galat yang dicatat) | Opsi perbaikan: (a) arsip dikecualikan secara bawaan (`archived=false` kecuali `?archived=1`); (b) INTERNAL_AGENT wajib memakai `mission`, atau daftar misi per agen; (c) log akses tahan lama untuk R21/R22 sukses (callerKind, requester, `filterShape`, jumlah hit, tanpa `q`); (d) opsional: `revisionNo` lama hanya untuk sesi manusia |
| M-2 | Medium | CWE-319, CWE-522; gate External Call/Credential; ISO A.13.2.1 | `scripts/studio/draft-check.ts:113-121` (`http:` diterima untuk host apa pun), `:124-130` (`fetch` dengan header `x-internal-secret`, redirect bawaan `follow`) | `--remote http://<host-non-loopback>` mengirim `INTERNAL_API_SECRET` dalam teks polos. Uji lokal (Node v24.18.0, nilai header dummy): `fetch` meneruskan `x-internal-secret` pada redirect 307 dari `127.0.0.1:9596` ke origin lain `localhost:9597`. Akibatnya remote yang salah konfigurasi atau disusupi (atau MITM di jalur http) bisa memanen rahasia bersama semua agen | `redirect: "manual"` di `call()`, dan 3xx diperlakukan sebagai galat (kode 2); tolak `http:` kecuali host loopback (`127.0.0.1`, `::1`, `localhost`), atau minta flag eksplisit `--allow-insecure-http`; tambah uji unit untuk kedua perilaku |
| L-1 | Low | CWE-20 / CWE-755 | `search.ts:79-104`, `contracts.ts:94-100` (raw `docNumber`), `contracts.ts:102` (`mission`); validasi `filters.ts:154-170` tidak menolak U+0000 | `q`, `mission`, dan `docNumber` yang memuat `%00` menghasilkan 500 (Postgres 22021), bukan 400, dan tetap memakan kuota. Probe: `d73a847c`, `c6b4ee46`, `cc26ce85`. Log tidak memuat isi `q` (terverifikasi di JSONL `logs/query`) | Tolak karakter kontrol (`/[\u0000]/`, atau lebih luas `\p{Cc}`) di `collect()`/`*FilterIssues` -> 400 `SCHEMA_INVALID` |
| L-2 | Low | CWE-770 | `src/app/api/studio/drafts/check/route.ts:130-149` (tagihan hanya untuk `dryRunBlocks`), `services/draft/check.ts:148` (lookup DB DR-08 tanpa tagihan) | Draf tanpa blok yang bisa di-dry-run (mis. 20 blok tanpa `$schema`, ~1,9 MB) diproses tanpa kuota: parse, `JSON.parse` 20 blok, satu lookup DB, dan echo respons ~1,9 MB. Probe `1e28eee4`, `67f27581`, `85edc5f7`: 200 tanpa header kuota, ~50 ms per permintaan. Sesuai teks spesifikasi, tetapi tidak berbatas laju | Tagih satu unit bucket `validate` (atau `query`) per permintaan R23 sebelum ekstraksi, atau satu unit bila ada `basis` yang memicu DR-08 |
| L-3 | Low | CWE-1333 (ReDoS) | `src/lib/studio/services/import/contract/index.ts:79` (`PHASE_RE`), `:539`; `scripts/studio/md2contract.ts:155` (tanpa batas ukuran) | Tiga `.+?` dengan `\s*` di antaranya membuat waktu jalan kubik pada baris `[FASE] ` + `a|->` berulang: 5000 karakter = 7,5 s, 10000 karakter = 60 s (diukur lokal). Hanya CLI yang dijalankan operator (tidak ada route yang memakai importer); masukan berupa laporan agen lama | Ganti dengan pemisahan string (`split("|")`, lalu `split("->")`) atau kelas negasi `([^|]+?)`; batasi panjang baris (mis. 2000) dan ukuran berkas (mis. C54 4 MiB) sebelum parse |
| L-4 | Low | ISO A.12.1.3 (kapasitas) | `src/lib/studio/http/quota.ts:51` | Semua pemegang `x-internal-secret` berbagi satu bucket per jenis (`INTERNAL_AGENT:shared`): satu agen yang boros bisa menghabiskan kuota `query`/`validate` agen lain. Limiter berada di memori per proses (RK-22). Pada R23, tagihan blok sebelum 429 hangus | Terima sebagai desain (agentId bisa dipalsukan); bila perlu, beri kredensial per agen agar bucket per agen sah |
| L-5 | Low | ISO A.12.1.2 (manajemen perubahan) | `prisma/migrations/20261030220000_add_studio_contract/migration.sql:146-151` | `ADD COLUMN ... GENERATED ALWAYS ... STORED` menulis ulang `StudioDocBlock` di bawah ACCESS EXCLUSIVE, dan `CREATE INDEX` tanpa `CONCURRENTLY` memblokir tulis selama build. Skrip rollback berisi DROP (manual, terpisah, tanpa CASCADE) | Untuk produksi: jendela pemeliharaan, backup sebelum `migrate deploy`, ukur durasi di salinan data produksi; rollback hanya setelah backup |
| L-6 | Low | Hardening I55 (CWE-204, bersyarat) | `src/lib/studio/services/contracts/refs.ts:84-90`, `:104-111` | Detail 422 mengungkap `currentRevisionNo` dan ada/tidaknya pid di dokumen mana pun (probe `1d77a213`, `95bbe1b8`, `470a3f71`). Hari ini tidak ada kebocoran baru karena R04/R05 sudah terbuka (AS-2). Temuan ini menjadi oracle bila kelak ada ACL baca per pemanggil | Catat sebagai ketergantungan AS-2: bila ACL baca diperkenalkan, seragamkan galat menjadi `CONTRACT_REF_NOT_FOUND` tanpa `currentRevisionNo` untuk dokumen yang tidak boleh dibaca pemanggil |

## 3. Gate results (security-review-gate, 5 cek)

| Cek | Hasil | Rincian |
|---|---|---|
| Credential Leak | **CAUTION** | Tidak ada rahasia tertanam di diff (pindai pola `password/secret/token/api_key=` -> 0). CLI tidak mencetak rahasia: pesan `serverFailure`/galat pemakaian tanpa nilai rahasia (`draft-check.ts:149-154`, `:327-331`). Risiko transit M-2 (rahasia dikirim ke origin lain saat redirect) |
| Destructive Operation | **PASS** | Migrasi aditif: grep `DROP|TRUNCATE|DELETE FROM` = 0. R21/R22/R23 tanpa tulis DB; R23 memakai dry-run transaksi READ ONLY. Rollback manual terpisah (L-5). Dry-run tersedia: shadow DB prosedur D-21 |
| External Call | **CAUTION** | Server: 0 panggilan keluar baru (grep `fetch(|http.request|child_process|exec(|spawn(|readFile` di jalur contracts/query/draft/compose/engine contract-record = 0; canary SSRF 0 hit). CLI: M-2 (http non-TLS diizinkan, redirect diikuti dengan header rahasia) |
| Injection | **PASS** | SQL: hanya `$queryRaw` bertag + `Prisma.sql`/`Prisma.join`; 0 `$queryRawUnsafe`/`Prisma.raw`. FTS: `websearch_to_tsquery($q)`. Kursor didekode dan divalidasi tipe (`r` hingga, `id` pola cuid). Header: regex C51 sebelum `X-Studio-Final-Filename`/Content-Disposition. HTML: sel record di-escape lewat `tableHtml`/`attr` |
| Permission Escalation | **PASS** (NA untuk ACL) | Tidak ada perubahan peran/izin. Identitas kuota diambil dari sesi terautentikasi, bukan `agentId`. `agentId` badan R23 hanya label (sama dengan R08) |

## 4. Bukti probe (correlation id)

| # | Permintaan | Hasil | cid |
|---|---|---|---|
| P1 | R21 tanpa rahasia | 401, tanpa header kuota/correlation | - |
| P2 | R21 `take=200` | 200, 2 kontrak, `x-studio-quota-bucket: query`, remaining 119 | `88fa7804-d13b-4c27-803d-9da22d55644d` |
| P3 | R22 `q=the&take=100` | 200, 84 hit dari 4 dokumen: 2 misi + 1 dokumen tanpa misi (lintas misi) | `b21d676d-a327-4a2d-a41f-3ddb148c712a`, `abbfeff2-7526-4374-9c24-e099c06a35bb` |
| P3b | R22 `q=dan` / `q=yang` | 200, cuplikan 371-387 karakter bertanda `[[ ]]` | `36de29ff-dac5-410f-b02a-e036875b513a`, `4ea9654c-d60a-4723-b6e4-4c23c5ec6866` |
| P3c | R04 `archived=1` | 0 dokumen arsip di DEV, jadi pencakupan arsip hanya dibuktikan lewat kode (`search.ts:51-73`, `contracts.ts:65-80`) | - |
| P4 | R22 `q='); DROP TABLE "StudioDocBlock";--` | 200 `hits: []` | `885c0697-efc4-44ec-b709-c22e63f256b5` |
| P4b | R22 operator websearch/tsquery (`"unterminated or - !!:*&|<->`, `!@#$%^&*()`, `a:* & b`) | 200 tanpa galat | `69a60253-60ce-4db0-97f7-7f54f6b11856`, `3b41333b-d3f5-4b81-b0f3-f9828da3b94b`, `7fb13e05-1117-4629-8a63-6afbf508a0d2` |
| P4c | R22 `mission=' OR '1'='1` | 200 `hits: []` (terparameter) | `c906787b-7251-41ec-8070-9f47ce9adf47` |
| P4d | R22 `type=paragraph' OR 1=1--`, `slotKey=a'--` | 400 sebelum tagihan, tanpa header kuota | `7558bcdd-bb34-4e1a-b238-452e9ac5cbfe`, `b2134466-7e11-4165-881c-fb0d71c70fe9` |
| P5 | R22 kursor palsu (`r` string; `id` berkutip) | 400 `/query/cursor` | `dc8bdd04-45af-4d98-b998-d5efd9e4d933`, `e42acaab-b86f-4403-bdfb-9aa776ec139a` |
| P5b | R22 `take=101`, `q` ganda, parameter `evil` | 400 | `41c1a45c-eaad-4509-b407-25c1b5cba994`, `b4adf58f-5273-43f2-a072-d9f4c69b7b9d`, `8b040600-4bc5-49e5-a910-be3d35c94328` |
| P6 | R21 `docNumber=%' OR 1=1--` / bentuk aman `001-GSP-LAP-X-2026` | 200 kosong / 200 1 kontrak (pencocokan I61) | `de259f0b-c46f-4054-aaba-6c50a201c29c`, `db1e60f1-253f-470e-a470-ed890e13c1b4` |
| P6b | R21 `cursor=../../etc`, `status=complete,x'` | 400 | `ba15283c-b943-4107-a184-670d14ecddcc`, `70efceea-2ba1-4732-8e67-36859fadf8e7` |
| L-1 | R22 `q=x%00y`; R21 `mission=a%00b`; R21 `docNumber=a%00b` | 500 `Internal error` (P2010/22021) | `d73a847c-9fa5-4706-b69d-5e76af34ac14`, `c6b4ee46-47ca-4b2f-b64f-d12071d7384f`, `cc26ce85-414e-454e-a362-6f276b74b6d8` |
| P7 | R23 tanpa rahasia / `text/plain` | 401 / 415 tanpa header kuota | `200a5822-e48e-4d05-b82c-34807a6aa35c` |
| P7b | R23 badan 4,3 MB / 2.000.100 karakter / 21 blok | 413 `DRAFT_TOO_LONG` x2 / 413 `DRAFT_TOO_MANY_BLOCKS`, tanpa header kuota | `049a2807-4c2f-4cc4-aa4a-c8ec3ed86dec`, `23a41c80-6575-441e-86ed-bdbbdc5f7e4a`, `97fad941-d2f4-4693-81ae-54b987d6e6c2` |
| P7c | R23 3 blok (agentId `security-dc41`), lalu 3 blok (agentId lain), lalu 3 blok | remaining `validate` 117 -> 114 -> 111 (3 per permintaan; agentId tidak memecah bucket) | `faa1511c-77ca-4759-880f-40704e912f2e`, `94509164-a07e-4114-8cbc-1280dfa4f522`, `9c30dafb-ebbc-4ef2-bf4a-96af97e0753b` |
| L-2 | R23 20 blok tanpa `$schema` (~1,9 MB) + `basis` docId@rev1 | 200 tanpa header kuota, DR-08 dijalankan, respons ~1,9 MB | `1e28eee4-21ee-4cc0-af8e-044e1c2dbd66`, `67f27581-7a5a-42d8-bdd7-eb7346fdb9c9`, `85edc5f7-3962-4702-a87f-cc7232406f34` |
| P8 | R08 dry-run, refs ke dokumen misi lain + pid sah | `valid: true` (rujukan lintas misi diterima) | `28341627-9dc4-48e7-9316-2147bb34651e` |
| P8b | refs pid tak ada / documentId tak ada / revisionNo 999 | isu `CONTRACT_REF_PID_NOT_FOUND` / `CONTRACT_REF_NOT_FOUND reason DOCUMENT` / `reason REVISION` + `currentRevisionNo: 5` | `95bbe1b8-a683-4adb-b98f-d56cf5d2b8c3`, `470a3f71-d3a0-46bb-a8c7-09888859218b`, `1d77a213-113f-475b-a728-b45f47df1c63` |
| P9 | R08 dry-run, `evidence.ref` = `http://127.0.0.1:9599/dc41-canary-file`, `curl http://127.0.0.1:9599/...`, `../../../../Windows/win.ini`, `file:///C:/Windows/win.ini`, UNC | `valid: true`; canary di :9599 hanya mencatat self-test (0 hit dari server) | `82988b13-6178-4c8c-a50b-5f1b41f991d4` |
| P10 | R10 berkas dokumen kontrak, tanpa `name` / `?name=datum` / HEAD | CD = nama final C51 / nama DATUM; C50 selalu ada; HEAD membawa header yang sama | `c886d7e7-3913-4ffa-8275-06f11c2dc9e8`, `bbcd88af-7ab4-46a1-8588-558098b41777`, `437e02dd-4963-46df-8ea4-132f20e640bb` |
| P10b | R10 `?name=final%0d%0aSet-Cookie:...` / `name` ganda / `name=../../x` | 400, tanpa header tersuntik | `b6941030-be45-4f5f-abdc-549afecd3d96`, `e0e795d4-6816-4d3c-8778-22960a48a89d`, `d4b7839a-0927-4f9b-866d-ae6414fa8abd` |
| P10c | R10 berkas non-kontrak, bawaan / `?name=final` | CD = DATUM / nama final; C50 ada | `5b9c1b3e-2c91-432a-ad39-462c8882b51e`, `9998a2b0-7cfc-4d70-8c48-aff5cbfd617c` |
| P10d | `docNumberSafe`/`finalFileNameOf` (tsx lokal) atas CRLF+`Set-Cookie`, `"; filename=evil.exe`, `../../etc/passwd`, Unicode, NUL, RLO U+202E, 500 karakter, kosong | Semua hasil cocok C51 (mis. `a-Set-Cookie-x-1`, `filename-evil.exe`, `etc-passwd`, `DOC`) | lokal |
| L-3 | `PHASE_RE` (node lokal) | 5000 karakter 7543 ms; 10000 karakter 60056 ms | lokal |
| M-2 | `fetch` Node v24.18.0 dengan header dummy, redirect 307 lintas origin | Origin kedua menerima `x-internal-secret` | lokal |

Semua berkas probe sementara dan pendengar canary sudah dihapus atau dihentikan (13:22 UTC).

## 5. GDPR / ISO 27701

| Pasal / kontrol | Status | Temuan | Remediasi |
|---|---|---|---|
| GDPR Art. 5(1)(c) minimisasi | PARTIAL | R22 memberi akses cari ke seluruh korpus, termasuk revisi lama dan arsip (M-1) | Opsi M-1 (a)-(d) |
| GDPR Art. 5(1)(e) batas simpan | OK (delta) | Tabel baru ikut cascade revisi; `tsv` terhapus bersama blok. `StudioDocRef.targetDocumentId` tanpa FK: baris rujukan di dokumen lain tetap ada setelah sasaran dihapus (hanya id/pid, tanpa PII) | Saat hapus dokumen, pertimbangkan pembersihan `StudioDocRef` yang menunjuk dokumen itu |
| GDPR Art. 17 penghapusan (cascade) | OK | FK `ON DELETE CASCADE` untuk record, item, dan ref per revisi (`migration.sql` AddForeignKey) | - |
| GDPR Art. 25 privacy by design | PARTIAL | `q` tidak dicatat di log (terverifikasi pada log 500); cuplikan dibatasi `MaxWords=30, MaxFragments=2`; tidak ada pembatasan misi | M-1 |
| GDPR Art. 30 / 32 | OK (delta) | Log JSONL tahan lama untuk galat query (`services/query/log.ts`) | M-1 (c) untuk akses sukses |
| GDPR Art. 7, 15, 16, 20, 33, 35 | N/A | Delta tidak mengumpulkan data subjek baru | - |
| Inventaris PII | OK | Medan baru: `contractOwner`/`owner`/`initiator` (pola pelaku agen C36), `cardIds`, `taskRef`; bukan PII pengguna akhir | Bila pelaku manusia dipakai, tandai sebagai PII di register |
| ISO 27701 PIMS | N/A | Tidak ada perubahan peran/proses privasi | - |

## 6. ISO 27001 Annex A

| Kontrol | Status | Temuan | Remediasi |
|---|---|---|---|
| A.9 Kontrol akses | PARTIAL | `requireSession` wajib di R21/R22/R23/R10 (probe 401). Google dibatasi `ALLOWED_EMAILS` (`src/lib/auth.ts:16-23`). Tidak ada least privilege per misi/agen (M-1) | M-1 |
| A.10 Kriptografi | OK | Perbandingan rahasia HMAC + `timingSafeEqual` (`contract/auth.ts`, `require-session.ts`); tidak ada kripto baru | - |
| A.12.1 Prosedur operasional | PARTIAL | Migrasi aditif berdokumen dengan rollback terpisah; risiko lock (L-5); bucket bersama (L-4) | L-5, L-4 |
| A.12.4 Logging | PARTIAL | Galat query/API dicatat ke JSONL dengan correlation id, tanpa isi `q`; akses R21/R22 yang sukses tidak dicatat | M-1 (c) |
| A.12.6 Kerentanan teknis | N/A (delta) | Tanpa dependensi baru; audit CVE tidak dijalankan | - |
| A.13 Komunikasi | PARTIAL | Server tanpa panggilan keluar baru; CLI mengizinkan http non-loopback dan redirect membawa rahasia (M-2) | M-2 |
| A.14.2 Pengembangan aman | OK | Kueri terparameter, validasi parameter ketat (unknown/dup -> 400), gerbang regex header, uji unit per baris; celah validasi NUL (L-1) dan ReDoS CLI (L-3) | L-1, L-3 |
| A.16 Insiden | N/A | Tidak ada perubahan | - |
| A.18 Kepatuhan | OK | CA-11 terbukti (P9); AS-2 diikuti dan dinilai di sini | Keputusan user untuk M-1 |

## 7. Prioritas remediasi dan opsi keputusan user

Tidak ada High, jadi tidak ada pemblokir mutlak. Keputusan user diperlukan untuk dua CAUTION berikut (controller mengajukan lewat `AskUserQuestion` dan mencatatnya di `decisions/decisions.md`):

| Temuan | Perbaiki | Terima risiko tercatat | Ubah lingkup |
|---|---|---|---|
| M-1 kebijakan baca R21/R22 | Arsip dikecualikan secara bawaan + log akses sukses (minimal); opsional: `mission` wajib untuk INTERNAL_AGENT | Konsisten dengan AS-2 (populasi = email ber-allowlist + pemegang rahasia internal); catat bahwa R22 menambah kemampuan menemukan isi | Batasi R22 ke revisi terkini saja, atau hilangkan `snippet`, atau `mission` wajib |
| M-2 rahasia CLI di http/redirect | `redirect: "manual"` + tolak http non-loopback (perubahan kecil, ~10 baris + uji) | Hanya bila `--remote` dijamin selalu loopback atau https internal | Hapus `--remote` dan pakai R23 dengan sesi |

Urutan yang disarankan: (1) M-2, karena murah dan menutup kebocoran kredensial bersama; (2) M-1 (c) log akses + arsip bawaan, sebelum data produksi yang sensitif dimuat; (3) L-1 dan L-3 sebagai hardening kecil; (4) L-5 sebagai checklist rollout produksi; (5) L-2, L-4, L-6 dicatat.

## 8. Log security review

| # | Waktu (UTC) | Lingkup | Level | Hasil | Keputusan |
|---|---|---|---|---|---|
| 1 | 2026-10-30 13:15-13:22 | DC-41: diff `c2620b3..HEAD` + working tree (R21, R22, R23, R10 nama final, kuota, I55, CA-11, CLI draft-check/md2contract, migrasi `20261030220000`) | L3 | CAUTION (0 High, 2 Medium, 6 Low) | Menunggu user via controller (perbaiki / terima risiko tercatat / ubah lingkup) untuk M-1 dan M-2 |
