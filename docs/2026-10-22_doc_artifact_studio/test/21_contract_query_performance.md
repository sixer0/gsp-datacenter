# DC-39 — Kinerja retrieval kontrak (R21 `queryContracts` I65, R22 `searchBlocks` I66)

Tanggal: 2026-10-30. Pelaksana: test-expert (skill `tdd`). Branch `v2.1`. Kode produksi tidak diubah.
Rujukan: blueprint 07 baris DC-39 (:326), KS-5 (:499); register 05 §8, §9.1-§9.2, KD-37 (:135), CA-6 (:1229), CQ-5 (:1269); keputusan D-370, D-396.

## Ringkasan

| Ambang CA-6 | Terukur (p95 terburuk, 2 putaran x 60 eksekusi) | Vonis |
|---|---|---|
| R21 ≤ 500 ms pada v21 | 1,56 ms (gabungan status+owner+cardId) | **LULUS** |
| R22 ≤ 500 ms pada v21 | 7,18 ms (kata terumum `dan`); 2,22 ms untuk `laporan` | **LULUS** |
| R21 ≤ 1000 ms pada 10x `_uji` | 6,03 ms (tenggat, 40 kontrak) | **LULUS** |
| R22 ≤ 1000 ms pada 10x `_uji` | 90,05 ms (`dan`, 5.832 blok cocok di revisi terkini); 11,1 ms untuk `laporan` | **LULUS** |
| EXPLAIN R22 memakai `StudioDocBlock_tsv_idx`, tanpa Seq Scan pada `StudioDocBlock` | 7/7 kueri x 4 putaran (v21 dan 10x): `Bitmap Index Scan on "StudioDocBlock_tsv_idx"`, Seq Scan pada StudioDocBlock = 0 | **LULUS** |
| Data sintetis dibersihkan | 0 baris `dc39syn%` di 10 tabel; md5 hitungan 56 tabel dan md5 isi blok sama dengan sebelum | **LULUS** |

Rekomendasi KD-37/CQ-5: **indeks trigram tidak perlu** di tahap 1 (bukti di §6).

## 1. Metode

- **Titik ukur (seam):** fungsi layanan publik `queryContracts` dan `searchBlocks` dari `src/lib/studio/services/query/index.ts`, dipanggil di dalam proses lewat `tsx` (Node v24.18.0), dengan `PrismaClient` sendiri yang disuntikkan lewat `opts.db`. Latensi = `performance.now()` mengelilingi satu panggilan layanan (validasi filter + semua kueri Prisma + pemetaan hasil). Ini adalah "latensi server" tanpa HTTP/auth; server DEV :9021 tidak dipakai.
- **Pengulangan:** 5 pemanasan, lalu 60 eksekusi berurutan per kueri; p50/p95/p99/maks/rata-rata dengan persentil nearest-rank. Dua putaran independen per DB (r1/r2).
- **URL DB:** disusun di dalam proses dari `.env` lewat `ujiUrl()` di `tests/integration/studio/uji-run.mjs` (nama DB diganti), tidak pernah dicetak; keluaran disaring `sed` untuk pola `postgres://`. `connection_limit=1`.
- **v21 hanya baca:** setelah konek, `SET SESSION default_transaction_read_only = on`, lalu skrip memeriksa `current_setting('default_transaction_read_only') = 'on'` dan `current_database() = 'gsp_agent_hq_v21'` sebelum kueri apa pun (gagal = berhenti). Hasil tercatat `"ro":"on"` di kedua putaran. Tidak ada tulis ke v21, produksi, atau `~/gsp-datacenter`; tidak ada `migrate dev` atau `db push`.
- **EXPLAIN:** SQL yang benar-benar dikirim layanan ditangkap dari event `query` Prisma untuk satu panggilan, lalu dijalankan ulang sebagai `EXPLAIN (ANALYZE, BUFFERS) <SQL itu>` dengan parameter yang sama. Untuk R22, parameternya `[simple, q, take+1, simple, 100000, opsi C44]`, sama dengan urutan placeholder di `search.ts`. Pemeriksaan plan diotomatisasi: `includes("StudioDocBlock_tsv_idx")` dan regex `/Seq Scan on "StudioDocBlock"/`.
- **Kueri wakil:**
  - R21: tanpa filter; `status=complete`; `status=draft,complete,partial`; `cardId=t_5943d415` (+`matchedItems`); `owner=verifier`; tenggat `2026-10-01..2026-12-31`; gabungan status+owner+cardId; `docNumber` (jalur regexp I61).
  - R22: kata umum `laporan`; kata langka `pemeliharaan` (v21 ndoc=1 dari `ts_stat`); frasa `"laporan kerja"`; `t_ac989baa`. Tambahan: `dan` (kata terumum, stres), `t_5943d415` (id kartu yang ada), dan `laporan` dengan `take=100`.

Skrip ada di scratchpad (bukan bagian repo): `bench.mts` (pengukur), `gen.mjs` (`count|insert|cleanup` data sintetis, hanya `_uji`), `terms.mjs` (jumlah kecocokan per istilah), dan `probe.mjs`/`probe2.mjs` (inventaris hanya-baca). Semuanya di `C:\Users\TRIAL\AppData\Local\Temp\claude\C--Users-TRIAL-AppData-Local-Claude-Data-claude-pzs8sxrjxfjjc-scratch-workspaces-82c3eee2-ba3c-4c60-933d-04d93794dde1-2baf709b-3616-4b3d-bc4d-6b5ff33884c7-scratch-2026-10-22-a4e38a\4f3398cf-689f-41f1-aaa2-aa5e16082c93\scratchpad\dc39\`, bersama keluaran JSON-nya (`v21_run1/2.json`, `uji_run1/2.json`, `count_before.json`, `count_with_synthetic.json`, `count_after.json`, `insert.json`, `cleanup.json`, `terms.json`).

Perintah (cwd = repo):

```
node <scratch>/dc39/probe.mjs                          # inventaris v21 + _uji (sesi read-only)
./node_modules/.bin/tsx <scratch>/dc39/bench.mts v21 60 > v21_runN.json
node <scratch>/dc39/gen.mjs count                      # sebelum
node <scratch>/dc39/gen.mjs insert                     # _uji saja
node <scratch>/dc39/gen.mjs count
./node_modules/.bin/tsx <scratch>/dc39/bench.mts uji 60 > uji_runN.json
node <scratch>/dc39/terms.mjs
node <scratch>/dc39/gen.mjs cleanup && node <scratch>/dc39/gen.mjs count   # sesudah
```

## 2. Volume

| Tabel | v21 (BACA SAJA) | Target 10x | `_uji` dengan data sintetis | dari jumlah itu, sintetis `dc39syn%` |
|---|---|---|---|---|
| StudioDocument | 8 (2 kontrak) | 80 (20 kontrak) | 120 (40 kontrak) | 115 |
| StudioRevision | 50 | 500 | 360 | 345 |
| StudioDocSection | 286 | 2.860 | 2.040 | 1.955 |
| StudioDocChapter | 195 | 1.950 | 2.088 | 2.001 |
| StudioDocBlock | 2.317 (430 di revisi terkini) | 23.170 (4.300) | **24.192 (8.544 di revisi terkini)** | 23.184 |
| StudioContractRecord (M19) | 12 | 120 | 120 | 120 |
| StudioContractItem (M20) | 24 | 240 | 240 | 240 |
| StudioDocRef (M21) | 1 | 10 | 10 | 10 |
| Ukuran StudioDocBlock / GIN tsv | 10 MB / 1.152 kB | - | 84 MB / 9.248 kB | - |

**Pembangkitan.** Graf dokumen `_uji` yang ada (5 dokumen) dikloning 23 kali dalam satu transaksi: StudioDocument, StudioDocIdentity, StudioRevision, StudioDocSection, StudioDocChapter, StudioDocSubsection, dan StudioDocBlock. Kolom diambil dari `information_schema`; kolom GENERATED `tsv` dikecualikan sehingga dihitung ulang oleh Postgres. id baru = `'dc39syn' || k || md5(id lama)[1..16]`, dengan FK dipetakan memakai fungsi yang sama (`pg_temp`, otomatis hilang di akhir sesi). Penanda tambahan: `createdBy='dc39-synthetic'` dan `docNumber 'DC39SYN-k-…'`.

Isi data sintetis:
- 40 dokumen sintetis diberi kolom cermin MX09: 5 status bergilir, 4 owner, `taskRef`, `dueOn` 2026-10-15+n, dan `contractCardIds`; 10 di antaranya memuat `t_5943d415`.
- 1 record M19 per revisi dokumen tersebut, 2 item M20 per record, dan 10 baris M21.
- Token FTS disuntikkan: 40 blok revisi terkini mendapat "Laporan kerja agen … t_5943d415", dan 10 blok mendapat `pemeliharaan`.
- Lalu `ANALYZE` dijalankan pada 10 tabel.

Volume blok revisi terkini 2x target, sehingga hasil R22 cenderung konservatif. Revisi 7,2x (bukan 10x) tidak memengaruhi R22 karena R22 menyaring ke revisi terkini.

**Penanda DC-38:** `count` mencari `id like 'dc38-s%'` di 6 tabel lama (AgentRequest, HermesTask, IlSearchDoc, WorkerTrace, HermesMemory, OrchestrationRecord) dan menemukan **0** baris, baik sebelum maupun sesudah. 27 baris penanda dari D-396 tampaknya sudah dihapus. Tabel-tabel itu memang tidak termasuk tabel Studio, jadi tidak dihitung sebagai volume.

## 3. Hasil latensi (ms, latensi panggilan layanan di dalam proses)

`hit` = jumlah baris yang dikembalikan halaman (R22 `take` bawaan 20).

| Kueri | v21 hit | v21 p50 | v21 p95 (r1 / r2) | v21 maks | 10x hit | 10x p50 | 10x p95 (r1 / r2) | 10x maks |
|---|---|---|---|---|---|---|---|---|
| R21 tanpa filter (semua kontrak) | 2 | 0,92 | 1,14 / 1,17 | 1,28 | 40 | 4,63 | 5,34 / 5,60 | 5,80 |
| R21 status=complete | 1 | 0,65 | 0,74 / 0,81 | 0,85 | 8 | 1,64 | 1,77 / 1,93 | 2,14 |
| R21 status=draft,complete,partial | 2 | 0,91 | 1,14 / 1,07 | 1,49 | 24 | 3,63 | 4,18 / 4,37 | 4,51 |
| R21 cardId=t_5943d415 (+matchedItems) | 2 | 1,34 | 1,47 / 1,44 | 1,77 | 10 | 2,30 | 2,93 / 2,56 | 3,86 |
| R21 owner=verifier | 2 | 0,87 | 0,99 / 1,03 | 1,38 | 10 | 1,53 | 1,80 / 1,54 | 1,94 |
| R21 tenggat 2026-10-01..2026-12-31 | 0 (a) | 0,49 | 0,63 / 0,61 | 1,38 | 40 | 4,56 | 6,03 / 4,70 | 7,00 |
| R21 gabungan status+owner+cardId | 2 | 1,34 | 1,55 / 1,56 | 2,04 | 4 | 1,98 | 2,35 / 2,43 | 3,70 |
| R21 docNumber (regexp I61) | 1 | 0,85 | 0,98 / 0,92 | 1,09 | 1 | 1,00 | 1,16 / 1,07 | 1,23 |
| R22 kata umum `laporan` | 19 | 1,75 | 2,15 / 2,22 | 2,79 | 20 | 8,74 | 10,46 / 11,10 | 15,49 |
| R22 kata langka `pemeliharaan` | 1 | 0,27 | 0,34 / 0,36 | 0,61 | 20 | 1,18 | 1,59 / 1,02 | 1,81 |
| R22 frasa `"laporan kerja"` | 2 | 0,32 | 0,38 / 0,39 | 0,76 | 20 | 1,45 | 1,78 / 1,30 | 1,91 |
| R22 `t_ac989baa` | 0 (b) | 0,24 | 0,29 / 0,28 | 0,30 | 0 (b) | 0,63 | 0,75 / 0,35 | 0,82 |
| R22 kata terumum `dan` (stres) | 20 | 5,92 | 6,51 / 7,18 | 9,58 | 20 | 75,76 | 80,82 / 90,05 | 94,27 |
| R22 `t_5943d415` | 2 | 0,35 | 0,44 / 0,38 | 1,08 | 20 | 1,04 | 1,32 / 1,27 | 1,78 |
| R22 `laporan` take=100 | 19 | 1,79 | 2,21 / 2,25 | 2,75 | 100 | 17,35 | 20,09 / 20,53 | 25,98 |

(a) Dua dokumen kontrak v21 memiliki `contractDueOn = null`, sehingga 0 hasil adalah benar. Jalur kueri tetap diukur; pada 10x, 40 dokumen ber-tenggat cocok.

(b) `websearch_to_tsquery('simple','t_ac989baa')` menghasilkan `'t' <-> 'ac989baa'` (sesuai CA-5/D-370). Tidak ada blok yang memuatnya di v21 maupun di `_uji`, sehingga yang diukur adalah jalur tanpa hasil.

Jumlah kecocokan total / revisi terkini (`terms.mjs`):

| Istilah | v21 | 10x |
|---|---|---|
| `laporan` | 93 / 19 | 952 / 376 |
| `pemeliharaan` | 1 / 1 | 58 / 34 |
| `"laporan kerja"` | 10 / 2 | 40 / 40 |
| `dan` | 1.176 / 242 | 17.184 / 5.832 |
| `t_5943d415` | 12 / 2 | 40 / 40 |

## 4. EXPLAIN (ANALYZE, BUFFERS), ringkas

R22, semua 7 kueri pada 4 putaran (`planCheck`): `usesTsvGin=true`, `seqScanOnDocBlock=false`. Bentuk plan sama di v21 dan 10x:

```
Nested Loop (ts_headline hanya untuk baris halaman)
  -> Limit -> Sort (top-N heapsort) key: ts_rank DESC, id DESC
     -> Nested Loop Left Join StudioDocChapter (pkey)
        -> Nested Loop StudioDocSection (pkey)
           -> Hash Join (rv.documentId = d.id AND rv.revisionNo = d.currentRevisionNo)
              -> Nested Loop StudioRevision (pkey)
                 -> Bitmap Heap Scan on "StudioDocBlock" b_1  Recheck Cond: (tsv @@ q_1.q)
                    -> Bitmap Index Scan on "StudioDocBlock_tsv_idx"  Index Cond: (tsv @@ q_1.q)
              -> Hash -> Seq Scan on "StudioDocument" d   (8 / 120 baris)
  -> Index Scan using "StudioDocBlock_pkey" on "StudioDocBlock" b  (gabung ulang baris halaman)
```

| R22 (10x `_uji`, r1) | baris dari GIN | Execution Time | shared hit |
|---|---|---|---|
| `laporan` | 953 | 10,41 ms | 6.818 |
| `pemeliharaan` | 58 | 1,08 ms | 767 |
| `"laporan kerja"` | 41 | 1,21 ms | 755 |
| `t_ac989baa` | 0 | 0,46 ms | 252 |
| `dan` | 17.207 | 79,29 ms | 99.275 |
| `t_5943d415` | 41 | 0,81 ms | 515 |
| `laporan` take=100 | 953 | 16,09 ms | 6.977 |

Angka yang sama di v21 (r2): `laporan` 93 baris dari GIN dalam 1,47 ms; `dan` 1.176 baris dalam 6,00 ms; kueri lain ≤ 0,14 ms.

R21: `queryContracts` memakai `Seq Scan on "StudioDocument"` dengan Filter `contractKind IS NOT NULL AND …`, lalu Sort `updatedAt DESC, id DESC`. Waktunya 0,02-0,05 ms (v21 8 baris, 10x 120 baris; 1-6 buffer). Seq scan di sini dipilih planner secara wajar karena tabel hanya 1-6 halaman. Indeks B-tree/GIN MX09 tersedia dan akan dipakai bila tabel tumbuh. Kriteria DC-39 tentang seq scan hanya berlaku untuk tabel blok.

Catatan planner: perkiraan baris GIN tetap (12 di v21, 121 di 10x), apa pun istilahnya, karena tsquery berasal dari CTE `q` sehingga selektivitasnya tidak terlihat oleh planner. Pada data ini planner tetap memilih GIN, termasuk untuk `dan` (71 persen baris cocok). Ini perlu dipantau bila volume tumbuh jauh di atas 10x.

## 5. Vonis CA-6

- **R21 v21:** p95 terburuk 1,56 ms, jauh di bawah 500 ms. **LULUS.**
- **R22 v21:** p95 terburuk 7,18 ms (`dan`), di bawah 500 ms. **LULUS.**
- **R21 10x:** p95 terburuk 6,03 ms, di bawah 1000 ms. **LULUS.**
- **R22 10x:** p95 terburuk 90,05 ms (`dan`), di bawah 1000 ms. **LULUS.**
- **EXPLAIN:** GIN `StudioDocBlock_tsv_idx` dipakai di setiap kueri R22, tanpa Seq Scan pada StudioDocBlock. **LULUS.**

KS-5, bagian kinerja (p95 di bawah ambang register pada v21), terpenuhi. Biaya R22 tumbuh linear terhadap jumlah blok cocok di revisi terkini, karena `ts_rank` dan join dihitung untuk semua kecocokan sebelum `LIMIT`. Ekstrapolasi kasar dari `dan` (5.832 cocok, sekitar 90 ms) menunjukkan ambang 1000 ms baru terlampaui di sekitar 65.000 blok cocok di revisi terkini untuk satu istilah. Ini hipotesis, belum diukur.

## 6. Rekomendasi indeks trigram (KD-37 / CQ-5)

**Tidak perlu. Pertahankan KD-37 dan tutup CQ-5 sebagai "tidak dibutuhkan di tahap 1".** Bukti:

1. Ambang CA-6 terpenuhi dengan selisih lebar hanya dengan GIN tsvector: 11 ms (`laporan`) dan 90 ms (kasus terburuk `dan`) pada 10x, terhadap ambang 1000 ms.
2. Indeks trigram (`pg_trgm`, `gin_trgm_ops`) hanya melayani `LIKE`/`ILIKE`/`similarity`. I66 hanya memakai `tsv @@ websearch_to_tsquery(...)` (`search.ts` `searchConditions`), sehingga indeks trigram tidak akan dipakai oleh kueri mana pun di layanan ini.
3. Satu-satunya jalur yang mendekati mahal (kata sangat umum) disebabkan `ts_rank` atas ribuan kecocokan. Trigram tidak mengurangi biaya itu.
4. Biaya ruangnya nyata: GIN tsv sudah 9,2 MB pada 10x (blok 84 MB, karena salinan penuh per revisi), dan GIN trigram atas `textPlain` lazimnya beberapa kali lebih besar (hipotesis, tidak diukur).
5. Id kartu (`t_xxxxxxxx`) sudah ditemukan lewat frasa `'t' <-> 'hex'` (CA-5). `t_5943d415` mengembalikan 40/40 kecocokan dalam sekitar 1 ms pada 10x.

Pemicu evaluasi ulang trigram adalah kebutuhan **fungsional**, bukan kinerja: pencarian substring di tengah kata, prefiks, atau toleransi salah ketik. Selain itu, bila kata sangat umum menjadi masalah pada volume di atas 10x, opsi yang lebih tepat adalah konfigurasi FTS dengan daftar stopword atau batas jumlah kecocokan sebelum perankingan. Kedua opsi itu juga di luar trigram.

## 7. Pembersihan `_uji` (hitungan sebelum/sesudah)

| Titik | Baris sintetis `dc39syn%` (10 tabel) | StudioDocBlock | Semua tabel (56) | md5 hitungan per tabel | md5 isi blok (id + md5 textPlain) |
|---|---|---|---|---|---|
| Sebelum (`count_before.json`) | 0 | 1.008 | 3.468 baris | `913caa8013d5b4c23c43aa323308cfeb` | `dae8f75e21027bc1b23d85871a0366ca` |
| Dengan sintetis (`count_with_synthetic.json`) | 48.233 | 24.192 | 51.701 | `5a3ee933…` | `58eb0b22…` |
| Sesudah (`count_after.json`) | **0** | 1.008 | 3.468 | `913caa8013d5b4c23c43aa323308cfeb` | `dae8f75e21027bc1b23d85871a0366ca` |

Cara pembersihan: `cleanup` menjalankan `delete from "StudioDocument" where id like 'dc39syn%'` (115 baris) di dalam transaksi. Cascade FK menghapus revisi, identitas, section, chapter, subsection, blok, record, item, dan ref. Sebelum COMMIT, skrip memeriksa bahwa sisa = 0 di 10 tabel, lalu `ANALYZE` dijalankan ulang. Hasil `cleanup.json`: `{"deletedDocuments":115,"left":{…semua 0}}`.

## 8. Keterbatasan

- Latensi adalah latensi layanan di dalam proses, pada DB lokal (PostgreSQL 17.11 Windows) dengan cache hangat (semua `shared hit`, tanpa `read`). Latensi ujung-ke-ujung route (auth, kuota, JSON) tidak diukur karena server :9021 tidak dipakai, sesuai lingkup.
- Data 10x adalah kloning isi `_uji` (5 dokumen) ditambah token sisipan, bukan teks baru. Sebaran kata mengikuti dokumen asal. `pemeliharaan` lebih sering di `_uji` (58) daripada di v21 (1), karena dokumen asal `_uji` memuatnya.
- Tidak ada uji unit/integrasi baru di repo. DC-39 adalah pengukuran, dan skripnya disimpan di scratchpad.
