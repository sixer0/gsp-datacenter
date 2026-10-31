---
schema_version: 1.0
task_id: doc_artifact_studio
task_row: R2-05 = U-13 (D-419; penutup DC-46 untuk komponen TIDAK-DAPAT-DIHITUNG di research/12 §4.3, §4.7, §4.8, §10 G-2..G-4)
date: 2026-10-31
agent: test-expert
type: performance
confidence: HIGH untuk angka (dihitung mesin; skrip, keluaran, dan sha di §6); MEDIUM untuk vonis KE-3 utuh dan KE-7 sensitivitas (bergantung tafsir G_A dan penyebut KF, dua-duanya dilaporkan)
inputs: research/11 §4.3, §4.7, §4.8, §6.2; research/12 §0, §4.3, §4.7, §4.8, §9 U-13; register masterplan/05 §19.3 (:1326-1330); hermes_trial/04_contract_trial_facts_manifest.md; facts/R-1..R-3.md, answers/Q_key_resolved.md, sessions/key_resolution/*_content.json (Temp/hermes_trial/contract_ab, BACA SAJA); 3 MD arm A + 3 HTML arm B di workspace Hermes docs/2026-10-31_hermes-contract-ab (BACA SAJA)
tools: Bash (node 22: fetch, node:test, pg). DEV http://127.0.0.1:9021, DB gsp_agent_hq_v21 sesi READ ONLY. Rahasia internal hanya lewat substitusi shell ke env, tidak dicetak (pindai: tidak ada di keluaran). Tanpa ubahan kode, tanpa tulis DB
status: complete
---

# R2-05 (U-13): Penutup metrik KE-3 stored, KE-7 KF, dan MU-1/MU-2 uji 1

## 0. Ringkasan

| Metrik | Sebelum (research/12) | Angka penutup | Vonis baru |
|---|---|---|---|
| KE-3 `G_B,stored` | TIDAK-DAPAT-DIHITUNG | 18 payload R20 `shape=submission` (3 dokumen x slot record + bab 1..5) di-dry-run R08: **18/18 `valid=true`, 0 isu galat, 0 peringatan**, `submitPreview.unchanged=true`, `completenessPreview=COMPLETE`. `G_B,stored = 0` | Gerbang keras **LULUS** |
| KE-3 utuh | TIDAK-DAPAT-DIHITUNG | stored 0; Σ G_B,4xx 3, maks 2 (dari research/12, tidak diubah); Σ G_B = 3 lawan Σ G_A 7 (ketat) / 3 (longgar) | **LULUS** dengan checklist literal (ketat). Peka tafsir: longgar 3 < 3 salah, jadi GAGAL tepat di batas |
| KE-7 KF | tidak dihitung | Fakta persisten (tanpa 9 status transien S1/S2): R1A 45/45, R2A 45/45, R3A 37/37, R1B 45/45, R2B 45/45, R3B 37/37 = **100% keenamnya**, ketat dan longgar; HTML arm B juga 100% | KE-7 utuh **LULUS** (K_B 100% 3/3 dari research/12; KF_B = 100%; KF_B >= KF_A) |
| KE-7 sensitivitas | - | Penyebut seluruh fakta, revisi terakhir saja: B 45/48, 45/48, 37/40 (93,8 / 93,8 / 92,5%), A 100%. Status S1/S2 arm B ada persis di riwayat revisi (rev1 dan rev7, §3.3), jadi dengan riwayat revisi B juga 100% | GAGAL hanya bila riwayat revisi B tidak dihitung |
| MU-1 | proksi | SQL §19.3 persis: 010/011/012 = revisions 16/16/16, actors 1/1/1 (W 009 = 15/1); 13 dokumen kontrak di DEV, semuanya actors = 1 | Angka persis tersedia |
| MU-2 | proksi | Porsi actors = 1: uji 3/3 = 100% (4/4 dengan W); median revisi uji 16; seluruh DEV 13/13, median 6 | Deskriptif, tetap tidak diskriminatif (satu agentId, U-14) |

Dampak pada vonis gabungan uji 1 (protokol §4.8): KE-3 dan KE-7 berubah dari TIDAK-DAPAT-DIHITUNG menjadi LULUS. Gerbang keras sekarang: stored 0 LULUS, retrieval 5/5 LULUS, kelengkapan 100% LULUS, **0 berkas mentah (KE-5) tetap GAGAL**. Vonis gabungan **tetap TIDAK EFEKTIF (perlu perbaikan)**. Bila KE-5 sudah diperbaiki, hasil paling baik NETRAL karena KE-1 dan KE-6 masih GAGAL. Penutup ini menghapus ketidakpastian, tetapi tidak mengubah arah vonis.

## 1. Metode

### 1.1 KE-3 stored (U-13a)

1. Untuk tiap dokumen B (id dari `answers/Q_key_resolved.md`: R1B `cmvvv85ug005mv1zgxx699f9l`, R2B `cmvvvvqhs00ikv1zg9x5hlqwm`, R3B `cmvvwaxl30107v1zgzfy2dv42`) dan tiap sasaran (`slot=record`, `slot=content&chapter=1..5`): `GET R20 /api/studio/documents/{id}/content?...&shape=submission&rev=16`.
2. `submission` dikirim apa adanya ke `POST R08 /api/studio/validate`. R08 berjalan di transaksi `SET TRANSACTION READ ONLY` (`src/lib/studio/services/submit/lock.ts:52`, `:127`), jadi tidak ada revisi baru.
3. Galat = `issues[]`. Peringatan = `lint.checks` berstatus selain PASS/NOT_RUN/SKIP ditambah `submitPreview.warnings[]`.
4. Cek silang sumber: 18 `submission` live rev16 dibandingkan dengan isi beku `sessions/key_resolution/*_content.json` (diambil 04:30Z saat penyelesaian kunci), dengan medan `id` diabaikan. Hasil: `compared 18, diffs 0`.
5. Kontrol negatif instrumen: payload R1B record dengan `status="running"` dan payload R2B bab 2 dengan blok `type="bogus"`. Keduanya `valid=false` (isu `enum` cid `2b3be5fe-f7a6-4a93-9178-2486dda1137b`; isu `discriminator` cid `a2ee60b1-06c9-40c4-bb02-7230da78ff79`). Artinya R08 memang membedakan payload sah dari payload rusak.

### 1.2 KE-7 KF (U-13b)

- Manifest tidak memuat daftar token beku (research/12 §4.7). Karena itu daftar token disusun dari lembar fakta R-1..R-3 **sebelum laporan dibaca**: 136 fakta, 1-5 token atomik per fakta (id, angka, nama berkas, kode). Daftar ini dibekukan pada 2026-10-31T05:29:03Z dengan sha256 `37684ad74fbed4db039154786d3161c86aa1ba230cb3e1b3f84e22fcb0b04765` (`tokens.json`), `lib.js` `bcc54f26...`, dan pemeriksa `tokens_selfcheck.js` `d6f52b1b...`. Ketiganya tercatat di `tokens.freeze.sha256` (`sha256sum -c`: OK).
- Uji konsistensi: setiap token terbukti ada di teks faktanya sendiri (`PASS all tokens present in own fact text`).
- Pencocokan: teks dinormalisasi (huruf kecil, tanpa `` ` `` dan `*`, pemisah ribuan `70.390` dibaca `70390`). Batas token `[a-z0-9_]`; pemisah internal `-`, `_`, dan spasi dianggap setara. Fakta **ketat** = semua token hadir; **longgar** = minimal separuh token hadir.
- Sumber teks: arm A dari MD tersimpan. Arm B dari semua nilai string/angka R20 rev16 (`*_content.json`, tanpa `id`), dicek silang dengan teks HTML unduhan.
- Penyebut utama: 9 fakta status transien S1/S2 dikeluarkan (R1-F10..F12, R2-F12..F14, R3-F09..F11). Alasannya, status itu secara desain ditimpa pembaruan S2/S3 (protokol §6.3). Penyebut seluruh fakta dilaporkan sebagai sensitivitas.
- Kontrol negatif: token R1 atas R2A 4/45 (8,9%); token R2 atas R1A 2/45 (4,4%); R2B tanpa bab 2 dan 3 15/45 (33,3%); R1A dengan `70.390` diubah ke `70.391` 44/45. Artinya pencocok peka terhadap isi.
- Sampel manual angka (protokol §4.7): konteks ±45 karakter untuk setiap token angka murni <= 4 digit di keenam laporan (`ke7_numctx.txt`). Ada dua hit pertama yang meleset konteks: `31` di tanggal R2B dan `21` di jam R3A/R3B. Keduanya dicek dengan grep, dan kemunculan bermakna memang ada (`31 paragraf`, `21 di antaranya`). Tidak ada positif palsu yang mengubah hasil.

### 1.3 MU-1/MU-2 (U-13c)

SQL MU-1 register 05 §19.3 (`:1328-1329`) dijalankan **apa adanya** lewat `pg`, dengan `default_transaction_read_only=on` dan `BEGIN READ ONLY ... ROLLBACK`. Hasil `transaction_read_only = on`. Probe tulis `CREATE TEMP TABLE` ditolak dengan `25006 cannot execute CREATE TABLE in a read-only transaction`. DB `gsp_agent_hq_v21`, waktu 2026-10-31T05:30:56Z. Ditambah kueri rincian per `createdBy`. DATABASE_URL dibaca dari `.env` repo dan tidak dicetak.

## 2. Angka KE-3

| Run | Sasaran | R20 status / rev | R20 cid | R08 status | R08 cid | valid | galat | peringatan |
|---|---|---|---|---|---|---|---|---|
| R1B | slot record | 200 / 16 | ffd60a82-6965-4d1d-b4ab-59e3e603179b | 200 | 1540f9fc-d866-4513-92b6-7f8cc470ff3a | true | 0 | 0 |
| R1B | bab 1 | 200 / 16 | 3e9853ff-a74b-46f4-acb3-84fff2dda44b | 200 | 27530e47-b4a3-4d55-a0d8-9a365201931c | true | 0 | 0 |
| R1B | bab 2 | 200 / 16 | ebe18781-e4a8-4268-ac5d-189c330f07bc | 200 | 56cd18f3-cd9c-4442-b25c-6dfb281dcde9 | true | 0 | 0 |
| R1B | bab 3 | 200 / 16 | 0f2ffd46-4f4f-4ffd-9784-b6c07507113f | 200 | ac5f6253-5add-4a15-bc87-d69f6292b650 | true | 0 | 0 |
| R1B | bab 4 | 200 / 16 | aabdf532-2946-4847-b99d-1e848d9cde8e | 200 | 293da115-867c-46ff-9503-23a87f80d6c9 | true | 0 | 0 |
| R1B | bab 5 | 200 / 16 | f422e1dd-5e88-4b10-9f0e-a1ef05cb41de | 200 | 99ac6ec3-2d2b-42f1-9346-526bcb889902 | true | 0 | 0 |
| R2B | slot record | 200 / 16 | 18198ae1-6eb8-47a0-8c5a-dbdb30b29bc9 | 200 | 8e7c67f0-3c9a-4b3f-bd58-380ac36f79ee | true | 0 | 0 |
| R2B | bab 1 | 200 / 16 | e11e0f53-fb0d-4bf0-8211-0e5d7114b951 | 200 | 1abbd978-068f-4786-af5b-a1e59d1ccb7e | true | 0 | 0 |
| R2B | bab 2 | 200 / 16 | 18a20d1e-f0b6-493e-a59c-a3284e2ec1ad | 200 | a775ed34-3a9c-45ce-a64b-ccca3bb73e4d | true | 0 | 0 |
| R2B | bab 3 | 200 / 16 | ea5a38f1-8065-432b-a0f6-b565df5027db | 200 | 65699c13-fda1-4019-8879-09cda1bc130a | true | 0 | 0 |
| R2B | bab 4 | 200 / 16 | da9f2d73-f094-433d-a04b-20fe1a6cdbca | 200 | 6d5b4093-0653-4b69-95f4-18a81105d892 | true | 0 | 0 |
| R2B | bab 5 | 200 / 16 | 3981d9b5-b920-4b2a-88e9-b1517d7cf070 | 200 | bd988bde-6816-4fe8-8d92-04d2b676bce0 | true | 0 | 0 |
| R3B | slot record | 200 / 16 | 29c4da44-c5d3-4f18-81b5-8c9035bbcd2d | 200 | 9fc73fa2-308e-434d-8d1e-595a680b4076 | true | 0 | 0 |
| R3B | bab 1 | 200 / 16 | 521919a7-b199-45d5-9f86-da392a66fc12 | 200 | 7b92b150-e20a-484a-9bed-3cfbd706706a | true | 0 | 0 |
| R3B | bab 2 | 200 / 16 | 2d16d809-4cdb-424a-aaf9-7760592175d5 | 200 | fae81315-5f07-4d74-9f23-9a3cdb64aa34 | true | 0 | 0 |
| R3B | bab 3 | 200 / 16 | 661f5da0-d198-4d3f-ad9b-0f717aa89a4b | 200 | 8ac14600-4bfb-45a8-bdc5-6540baba71b5 | true | 0 | 0 |
| R3B | bab 4 | 200 / 16 | f262af0e-b578-4ef0-be9c-2910d683ef8d | 200 | 00cb4fff-888f-48e0-95a0-8ad527e7ca05 | true | 0 | 0 |
| R3B | bab 5 | 200 / 16 | 5ecf43cf-83df-41b7-bb02-4f6620558bbc | 200 | 6f9d7b17-4772-485c-9b59-b3f8ce6b4416 | true | 0 | 0 |

Per laporan: R1B, R2B, dan R3B masing-masing 0 galat dan 0 peringatan pada 6/6 sasaran. `lint` = null (lint rilis tidak dijalankan untuk kiriman lingkup), dan `submitPreview.warnings` tidak ada.

Uji rumus protokol §4.3:
- (a) `G_B,stored = 0` (KERAS): **LULUS**.
- (b) Σ G_B,4xx = 3 <= 3 dan maks 2 <= 2: LULUS tepat di batas. Angka ini dari research/12 §4.3, termasuk catatan L126 baris ganda dan AS-2 R3B L206.
- (c) Σ G_B = stored + 4xx = 0 + 3 = 3 lawan Σ G_A: ketat 7 memberi LULUS (3 < 7), longgar 3 memberi GAGAL (3 < 3 salah). G_A diambil dari tabel manual research/12 §4.3; checker G_A mekanis bukan lingkup U-13.

Vonis KE-3: **LULUS** bila checklist dibaca literal, yaitu "status ada dan dalam set tertutup" menurut protokol 11 §4.3, sehingga `complete (selesai)` dan `SELESAI (complete)` bukan nilai set. Pada tafsir longgar, komponen (c) GAGAL tepat di batas. Gerbang kerasnya lulus tanpa syarat.

## 3. Angka KE-7

### 3.1 KF per laporan (`ke7_kf_result.json`)

| Laporan | Fakta persisten | Ketat | Longgar | Seluruh fakta (revisi terakhir) ketat / longgar | HTML ketat / longgar |
|---|---|---|---|---|---|
| R1A | 45 | 45 (100%) | 45 (100%) | 48/48 / 48/48 | - |
| R2A | 45 | 45 (100%) | 45 (100%) | 48/48 / 48/48 | - |
| R3A | 37 | 37 (100%) | 37 (100%) | 40/40 / 40/40 | - |
| R1B | 45 | 45 (100%) | 45 (100%) | 45/48 / 47/48 | 100% / 100% |
| R2B | 45 | 45 (100%) | 45 (100%) | 45/48 / 47/48 | 100% / 100% |
| R3B | 37 | 37 (100%) | 37 (100%) | 37/40 / 39/40 | 100% / 100% |

Fakta yang hilang pada penyebut utama: tidak ada di keenam laporan. Termasuk 13 fakta "tidak ada di sumber" (manifest §2): token konsepnya (`cid`, `commit`, `tanggal`, `isu`) hadir, tetapi pencocok token tidak dapat membuktikan bahwa nilainya tidak ditebak. Batas ini tercatat di §5.

### 3.2 Uji rumus protokol §4.7

K_B = 100% 3/3 (research/12 §4.7, R15 COMPLETE). KF_B = 100% 3/3. KF_B >= KF_A berlaku pada ketiga pasangan (100 >= 100). Hasil `ke7Verdict` ketat dan longgar: `{"kOk":true,"kfOk":true,"cmpOk":true,"verdict":"LULUS"}`. Vonis: **KE-7 utuh LULUS**.

### 3.3 Status transien S1/S2 (sensitivitas)

Arm A menyimpan status S1/S2 di MD akhir sebagai log langkah. Arm B menimpanya di revisi terakhir, tetapi riwayat revisi R20 `?slot=record&rev=n` (baca saja) memuat semua status persis sesuai lembar fakta:

| Dokumen | rev1 (S1) | rev7 (S2) | rev11..16 (S3) |
|---|---|---|---|
| R1B | draft; B1 running, B2-B4 todo (cid 1ca2008e-097f-4415-971d-3773dc8a61ad) | partial; B1, B4 done, B2, B3 running (cid 60c78811-eb34-42b1-b7f1-7e9651bb5a02) | complete; semua done (cid a049c171-a57c-4940-8662-9f63d2e056c5) |
| R2B | draft; B1 running, B2-B5 todo (cid aab59c99-830c-4530-9204-8de9bb98e152) | partial; B1-B3 done, B4 running, B5 todo (cid 0cfd7fed-54ae-48ec-80ac-240d5c3e0459) | complete; semua done (cid d4cf199a-7cdf-4002-97a4-5b4b44a89c66) |
| R3B | draft; B1 running, B2-B4 todo (cid 988bd3e4-8bf2-4c24-9a3c-cd9133d7b87a) | partial; B1-B3 done, B4 running (cid 1f518a15-4397-4ace-a8c2-a445214082a2) | complete; semua done (cid f91477c6-aa5a-4515-98c8-e282d00f17ba) |

Jadi KF_B dengan penyebut seluruh fakta = 100% bila riwayat revisi dihitung, dan 92,5-93,8% bila hanya revisi terakhir yang dihitung. Kata `berjalan` lembar fakta dipetakan B ke enum (`running`, `draft`, `partial`). Ini sesuai pemetaan yang diserahkan ke Hermes (manifest §1).

## 4. Angka MU-1/MU-2 (`mu_result.json`)

| docNumber | id | revisions | actors | createdBy |
|---|---|---|---|---|
| 009/GSP/LAP/X/2026 (W) | cmvvuxlpo0001v1zgm48a20ju | 15 | 1 | agent:hermes-gsp-master01 |
| 010/GSP/LAP/X/2026 (R1B) | cmvvv85ug005mv1zgxx699f9l | 16 | 1 | agent:hermes-gsp-master01 |
| 011/GSP/LAP/X/2026 (R2B) | cmvvvvqhs00ikv1zg9x5hlqwm | 16 | 1 | agent:hermes-gsp-master01 |
| 012/GSP/LAP/X/2026 (R3B) | cmvvwaxl30107v1zgzfy2dv42 | 16 | 1 | agent:hermes-gsp-master01 |
| 001..008, 013 (non-uji) | lihat `mu_result.json` | 7, 5, 1, 1, 1, 6, 7, 1, 2 | 1 masing-masing | controller-gate-dc31, test-dc37, test-dc43, doc-fix-a, cod-r2-01 (013 tercipta sesudah uji, R2-01) |

- MU-1 persis sama dengan proksi research/12 §4.8 (`docs_b.csv`: W 15, R1B/R2B/R3B 16), sehingga proksi terkonfirmasi. `actors` = 1 kini terbukti sebagai `DISTINCT createdBy` seluruh revisi, bukan hanya pelaku terakhir.
- MU-2: uji 3/3 = 100% actors = 1 (4/4 dengan W); median revisi uji 16. Seluruh DEV: 13/13 kontrak `agentWorkReport` actors = 1, median revisi 6 (nilai terurut 1,1,1,1,2,5,6,7,7,15,16,16,16). Pembanding KE-5 tidak berubah: MD baru arm A 3, arm B 0 (+2 draf).
- Batas tetap: brief memaksa satu `agentId`, sehingga MU tidak dapat membedakan patuh dari tidak patuh U-3 (U-14).

## 5. Asumsi, batas, dan kejujuran data

| ID | Butir | Dampak |
|---|---|---|
| B-1 | Daftar token KF disusun test-expert dari lembar fakta pada hari uji (sesudah run, sebelum laporan dibaca), tidak dibekukan sebelum DC-45 seperti tuntutan protokol §8.4 | Kurang kuat dibanding kunci pra-run. Mitigasinya: sha dibekukan sebelum pencocokan, uji konsistensi token, dan kontrol negatif |
| B-2 | Token membuktikan kehadiran nilai kunci, bukan kebenaran kalimat atau posisi bab (mis. R1-F48 "di bagian bukti", fakta "tidak ada di sumber") | KF 100% = semua nilai kunci hadir. Penempatan R1-F48 sudah dibuktikan Q5 (research/12 §4.4) |
| B-3 | Isi kedua arm sangat dekat dengan teks lembar fakta (konteks §1.2 berbunyi hampir sama) | KF tinggi di kedua arm sesuai harapan. KF tidak membedakan arm di uji ini |
| B-4 | Payload R08 diambil 2026-10-31 sekitar 05:2xZ dengan `rev=16` eksplisit; isi = isi beku 04:30Z (18/18 sama) | Tidak ada pergeseran data |
| B-5 | G_A dan Σ G_B,4xx diambil dari research/12, tidak dihitung ulang | Vonis KE-3 utuh mewarisi ketidakpastian ketat/longgar G_A dan L126 |
| B-7 | DEV 9021 melayani pohon kerja v2.1 yang sedang diubah baris R2 paralel (`git status`: `src/lib/studio/contract/types/v2/contract.ts`, `registry/contracts.ts`, `services/draft/*`, belum di-commit; bukan ubahan baris ini). Dry-run R08 karenanya memakai validator pohon kerja saat 05:2xZ, bukan validator persis saat uji | Kecil: ubahan itu menyangkut contoh registri dan draft-check (U-03, U-05), bukan skema `agentWorkReport`. Vonis stored 0 berlaku untuk validator terkini. Ulangi R08 sesudah commit R2 bila ingin terikat ke satu sha |
| B-6 | Kuota R08 (120/60 s) dan pencatat apiLog server menerima 20 panggilan validate + 66 GET dari baris ini | Tidak ada tulisan DB. Log API bertambah, dan cid tercatat di sini untuk audit |

## 6. Berkas kerja dan cara mengulang

Folder `C:/Users/TRIAL/AppData/Local/Temp/r2_05/`:
- `lib.js` (helper murni), `lib.test.js` (8 uji). `node --test lib.test.js` hasilnya `tests 8, pass 8, fail 0`.
- `ke3_dryrun.js` + `ke3/` (36 respons R20/R08 + `summary.json` sha `8a421ed0...`), `crosscheck.js` (`compared 18, diffs 0`), `ke3_negctl.js` + `ke3/negctl.jsonl`.
- `tokens.json`, `tokens_selfcheck.js`, `tokens.freeze.sha256`; `ke7_kf.js` + `ke7_kf_result.json` (sha `ce25268d...`), `ke7_negctl.js`/`.txt`, `ke7_numctx.js`/`.txt`, `ke7_history.js` + `ke7_history.json`.
- `mu_sql.js` + `mu_result.json` (sha `6e249281...`).

Perintah: `TRIAL_SECRET="$(cat <berkas rahasia>)" node ke3_dryrun.js`; `node crosscheck.js`; `node tokens_selfcheck.js && sha256sum -c tokens.freeze.sha256 && node ke7_kf.js`; `TRIAL_SECRET="$(cat <berkas rahasia>)" node ke7_history.js`; `node mu_sql.js`.

## 7. Dampak pada research/12 (untuk controller)

- §0 baris KE-3: TIDAK-DAPAT-DIHITUNG menjadi LULUS (stored 0; utuh LULUS ketat, peka longgar). Gerbang keras D-362 (1) menjadi LULUS.
- §0 baris KE-7: KE-7 utuh menjadi LULUS (KF 100% 6/6).
- §0 baris MU-1/MU-2: proksi menjadi angka persis (sama dengan proksi).
- §10 G-2, G-3, G-4 tertutup. Vonis gabungan tetap **TIDAK EFEKTIF** (KE-5), dan setelah KE-5 diperbaiki menjadi NETRAL selama KE-1/KE-6 gagal.
- Saran untuk uji ulang (DC-45b): bekukan `tokens.json` (atau penerusnya) bersama `freeze.sha256` sebelum run, sesuai protokol §8.4. Putuskan juga di protokol 11 §4.7 apakah status transien dihitung lewat riwayat revisi.
