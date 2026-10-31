---
schema_version: 1.0
task_id: doc_artifact_studio
task_row: R2-04 (D-419 decisions.md:424; usulan U-09, U-10, U-11, U-12, U-14 research/12 §9 :325-330; revisi protokol research/11)
date: 2026-10-31
agent: data-analyst
type: performance
confidence: MEDIUM (desain berdasar data uji 1 yang dibaca langsung; sesudah amandemen R2-08 alat R2-01, R2-02, HARNESS2, dan FACTS2 sudah ada dan dirujuk dari kode; yang masih menunggu hanya panduan R2-06 dan review R2-07, §9)
inputs: decisions/decisions.md D-404 (:409), D-416 (:421), D-417 (:422), D-419 (:424); research/12_contract_efficiency_results.md (utuh; §4, §5, §9); research/11_contract_efficiency_protocol.md (utuh); hermes_trial/04_contract_trial_brief.md; 04_contract_trial_report.md; 04_contract_trial_facts_manifest.md; masterplan/05_document_contract_specs.md §19.3 (:1326-1330); docs/STUDIO-AGENT-GUIDE.md §12 (:1504-1533); delegation_progress/file_claims.md:1084-1087; workspace Hermes docs/ (Glob/Grep/Read, baca saja)
amended: R2-08 (2026-10-31; D-421 :426, D-422 :427, D-423 :428; delegation_progress/coder_execution_r2_01.md, coder_execution_r2_02.md; hermes_trial/05_contract_retrial_facts_manifest.md; hermes_trial/05_retrial_harness.md; scripts/studio/studio-report.ts; Temp/hermes_trial/harness_ab2/ab2.py baca saja). Rincian §16
supersedes: research/11 hanya pada butir yang tercantum di §4 (tabel perubahan). Semua yang tidak disebut tetap berlaku seperti protokol 11
plan_draft: dilewati (baris docs only; tidak ada perubahan kode)
status: complete
---

# R2-04: Protokol uji ulang efisiensi laporan kerja agen (arm A MD lawan arm B JSON API Studio), revisi 2

## 1. Source Tasks

| Sumber | Isi yang dipakai |
|---|---|
| D-419 (`decisions.md:424`) | USER menyetujui "improve + retrial". R2-04 = U-09 CSV RFC 4180 + pencatat harness, U-11 START dari harness, U-12 KE-4 diukur ulang, U-14 dua agentId, skenario uji ulang + penanganan bias belajar. U-04 sudah dicek controller: log cid 3b684687 berkode `SCHEMA_INVALID` |
| D-417 (`:422`) | Vonis uji 1 TIDAK EFEKTIF: KE-5 gerbang keras gagal; KE-1, KE-6 gagal; KE-3, KE-7 TIDAK-DAPAT-DIHITUNG |
| D-416 (`:421`) | Penyimpangan (a)-(h) uji 1 yang harus dicegah oleh desain, bukan oleh disiplin agen |
| D-404 (`:409`) | Lembar fakta beku dan penyempitan ruang cari arm A ke r1a/r2a/r3a |
| research/12 §4, §5, §9 | Angka dasar dan usulan U-09..U-14 (`12:325-330`) |
| research/11 | Rumus, ambang, format CSV, aturan kejujuran yang dipertahankan |
| file_claims.md:1084-1087 | Kepemilikan: R2-01 (CLI), R2-02 (registri), R2-04 (berkas ini + brief 05), R2-05 (penutup DC-46) |
| D-422 (`:427`), D-423 (`:428`) (amandemen R2-08) | Ambang KE-1 dipisah (keputusan USER); alat R2-01/R2-02/HARNESS2 dan lembar FACTS2 diterima; daftar penyelarasan R2-08 |

## 2. Exploration & Collection Summary (Tier 2)

Tabel ini adalah keadaan saat R2-04 ditulis. Keadaan sesudah R2-01, R2-02, R2-05, FACTS2, dan HARNESS2 ada di §16.

| Fakta | Bukti | Mengapa penting |
|---|---|---|
| `studio-report.ts` belum ada | Glob `scripts/studio/*.ts` = glossary-check, md2chapter, draft-check, md2contract | Semua rujukan CLI di protokol dan brief diberi tanda [menunggu R2-01] |
| Panduan belum memuat `studio-report`, `examples`, atau resep satu halaman | Grep `studio-report\|examples\|resep` di `STUDIO-AGENT-GUIDE.md` = 0 baris | Contoh payload [menunggu R2-02]; resep dan `matchedItems` [menunggu R2-06] |
| Bentuk galat sudah terdokumentasi | `STUDIO-AGENT-GUIDE.md:1506` `{ "error", "code", "details" }`; `:1511` cid di `x-correlation-id`; `:1531` ROUTE_NOT_FOUND juga `correlationId` di badan | Butir U-04 di brief boleh ditulis tanpa tanda tunggu |
| Pencatatan oleh agen menghasilkan baris estimasi, kosong, ganda, dan bergeser | research/12 §5 butir (b), (d), L126 ganda | Dasar U-09: pencatat dipegang alat |
| START ditulis Hermes setelah membaca brief, fakta, dan panduan; arm A bahkan menyusun S1 sebelum START | research/12 §4.1.2 (L54, L112, L224) | Dasar U-11 |
| Snapshot uji 1 tidak memuat Temp; 16 payload `.json` R2B, salinan payload R1B, dan dump respons R3B hanya ditemukan lewat Glob analis | research/12 §4.5, §5 butir (g) | Dasar U-10 |
| Ruang cari arm A hanya 3 berkas sehingga syarat waktu KE-4 membandingkan grep lokal lawan HTTP dalam milidetik | research/12 §4.4 catatan desain; `11:122` | Dasar U-12 |
| Grep seluruh `workspace/docs` habis waktu 20 s; kartu dan istilah kueri juga ada di laporan asli | `04_contract_trial_facts_manifest.md:62` | Ruang cari penuh membuat kunci arm A tercemar dan galat alat ikut terukur |
| Brief uji 1 memaksa satu `agentId` | `04_contract_trial_brief.md:17`; research/12 §4.8 | Dasar U-14 |
| Memori dan konfigurasi profil Hermes tidak di-reset; `state.db` profil menyimpan riwayat sesi yang dapat dicari | `04_contract_trial_report.md:4`, `:8`; protokol 11 A-4 (`11:354`) | Sumber utama bias belajar (§5) |
| Keluaran uji 1 masih terbaca Hermes: laporan arm A `2026-10-31_hermes-contract-ab/{r1a,r2a,r3a}/`, draf `r1b/`, pembangkit `Temp/r3b_build.py`, `Temp/hermes_trial/scratch_r2b/` (101 berkas), `ab_r3a/*.py` | `04_contract_trial_report.md:1-2`; research/12 §2 baris "Folder scratch" | Lembar lama dapat dikerjakan dengan menyalin keluaran sendiri |

## 3. Overview

Pertanyaan yang sama dengan protokol 11 (`11:59`): apakah laporan kerja lewat JSON API Studio (arm B) lebih efisien dan lebih andal daripada MD bebas (arm A), sesudah perbaikan R2 (CLI `studio-report`, contoh payload per bab, draft-check ramah, panduan tanpa `record.json`, resep satu halaman)?

Pemangku kepentingan: USER (adopsi), controller (harness, snapshot, kunci, dry-run R08), Hermes `gsp-master01` (pelaku), DC-45b (menjalankan), DC-46b (menghitung), DC-47b (verifikasi).

Waktu dan lingkup: uji ulang dijalankan sesudah R2-01, R2-02, R2-06, R2-07, dan runner U-10 (HARNESS2) selesai, lalu server dibekukan (D-419). Sembilan sesi: W, 3 pasangan, M (U-14), Q.

Metodologi: desain silang berpasangan protokol 11 §6 dipertahankan. Yang diubah hanya cara mengukur (siapa mencatat, kapan START, cakupan snapshot), dua definisi metrik (KE-4, KE-2), dan pemisahan ambang KE-1 (D-422), ditambah satu skenario multi-agen dan lembar fakta baru.

Alternatif yang ditolak: (1) membiarkan Hermes mencatat sendiri dengan aturan lebih ketat. Uji 1 menunjukkan aturan "note tanpa koma" dan skrip per sesi tetap menghasilkan baris estimasi (research/12 §5). (2) Uji statistik inferensial: n = 3 tetap deskriptif (`11:68`).

## 4. Perubahan terhadap protokol 11 (dicatat sebagai keputusan)

| ID | Butir protokol 11 | Perubahan | Alasan dan bukti | Jenis |
|---|---|---|---|---|
| C-01 | §5.1 format CSV (`11:188-228`) | RFC 4180: medan yang memuat koma, kutip, atau baris baru dikutip `"`, kutip digandakan; koma boleh di `note`. Pemisah baris LF (penyimpangan sadar dari CRLF RFC; pengurai `csv` Python menerima keduanya). Header 20 kolom byte-identik `11:218` | U-09; friksi 6 Hermes (research/12 §6) | format |
| C-02 | §5.2, A-3 (`11:232`, `:353`) | Penulis `timing.csv` hanya alat: (a) harness controller `run-session` (baris START sesi), (b) `studio-report --timing` untuk setiap panggilan HTTP CLI ditambah satu baris `tool` per pemanggilan, (c) pencatat controller `trial-log` (HARNESS2) untuk penanda, suntingan, bacaan, kueri, dan GET di luar CLI. Hermes tidak menulis CSV dengan tangan atau skrip sendiri | U-09; research/12 §5 (b), (d) | pengukuran |
| C-03 | §4.1 batas run (`11:77`) | START = jam harness saat pesan pertama dikirim ke Hermes (`start_utc` meta). END = penanda Hermes. Penanda START Hermes tetap ditulis sebagai informasi; selisihnya dilaporkan sebagai pra-START per run | U-11; research/12 §4.1.2 | definisi |
| C-04 | §4.2 KE-2 (`11:90`) | N dihitung per aksi yang dimulai agen (satu pemanggilan CLI = 1, dari baris `tool` CLI, §6.2). Panggilan HTTP di dalam CLI dilaporkan sebagai N_api (informatif) | Tanpa ini, CLI yang menulis satu baris per HTTP menaikkan N_B padahal agen hanya memberi satu perintah | definisi; ambang tetap (advisori) |
| C-05 | §4.4 syarat waktu (`11:124`) | Syarat waktu diganti langkah per kueri: `median_q L_q(B) <= median_q L_q(A)`. Ruang cari arm A tetap folder misi uji (D-404). t_q dilaporkan informatif | U-12; §6.4 | **ambang berubah** |
| C-06 | §4.5 cara ukur KE-5 (`11:136`) | Snapshot pre/post mencakup `%TEMP%` dan `Temp/hermes_trial/**` (byte + sha256) serta workspace Hermes; Grep pola payload pasca-run; dump respons yang memuat payload dihitung mentah; cache transpilasi tsx bukan berkas mentah (§6.5) | U-10; research/12 §4.5, G-6; D-423 | definisi; ambang tetap |
| C-07 | §4.3 KE-3 | Dry-run R08 atas laporan tersimpan WAJIB dijalankan controller sebelum sesi Q; checker G_A dijalankan mekanis | research/12 §4.3, G-2 | pelaksanaan |
| C-08 | §4.6 FL | FL dihitung dalam jendela START harness sampai END (termasuk bacaan sebelum penanda Hermes); sumber utama log sesi Hermes bila memuat tool call berwaktu, silang dengan baris `trial-log` | Konsekuensi C-03; uji 1 FL R1B dicatat pada detik START walau dibaca sebelumnya (research/12 §4.6) | definisi; ambang tetap |
| C-09 | §4.7 KF | Pencocok token fakta: daftar token per fakta dibekukan di manifest sebelum uji | research/12 §4.7, G-3 | pelaksanaan |
| C-10 | §6.4 urutan, §7 laporan | Tiga laporan baru R-4, R-5, R-6 (§5); run M (U-14) sesudah R6A dan sebelum Q | §5; U-14 | skenario |
| C-11 | Brief: path laporan asli diberikan ke Hermes (`04_contract_trial_brief.md:26-32`) | Path sumber TIDAK diberikan; Hermes hanya menerima lembar fakta | Mengurangi penyalinan bentuk asli (RK-2 protokol 11) dan paparan isi di luar lembar | skenario |
| C-12 | §4.1 ambang KE-1 (`11:80`) | Ambang KE-1 dipisah: (a) komposisi pertama `median(r1) <= 1,00`; (b) siklus pembaruan `median(r2) <= 0,70` DAN `max(r2) <= 1,00`; KE-1 LULUS bila (a) DAN (b). Rasio ujung-ke-ujung lama menjadi sensitivitas (§6.1) | Keputusan USER D-422 (`decisions.md:427`); research/12 §4.1.3 (biaya terpusat pada komposisi pertama; pembaruan R-3 sudah 0,925x arm A) | **ambang berubah** |

Ambang KE-2, KE-3, KE-5, KE-6, KE-7, gerbang keras D-362, dan aturan vonis gabungan §4.8 tidak berubah. Perubahan ambang ada dua: C-05 (KE-4) dan C-12 (KE-1, keputusan USER D-422). Pertanyaan pemisahan ambang KE-1 yang sebelumnya terbuka sudah diputuskan USER dan tidak lagi berstatus keputusan terbuka.

## 5. Penanganan bias belajar

### 5.1 Keputusan

Uji ulang memakai **lembar fakta baru dari 3 laporan nyata Hermes lain** (R-4, R-5, R-6), bukan lembar lama dengan urutan dibalik. Lembar W (sintetis, tidak dinilai) dipakai ulang apa adanya (sha D-404 `884dc89f...9138`).

### 5.2 Alasan berbasis bukti

| # | Bukti | Implikasi |
|---|---|---|
| 1 | Hermes sudah mengerjakan R-1..R-3 di kedua arm (`04_contract_trial_report.md:1`). Membalik urutan hanya menukar arm mana yang "pertama" di uji ulang, padahal kedua arm sudah pernah dikerjakan | Membalik urutan tidak menghapus efek belajar; efek itu sama-sama ada di kedua arm dan tidak dapat dipisah dari efek alat |
| 2 | Waktu kedua arm didominasi komposisi: pikir arm A 97-100% T, susun payload arm B 58% (research/12 §4.1.1, §4.1.3) | Keakraban isi memangkas bagian terbesar waktu dengan besaran yang berbeda per arm. Rasio B/A bergeser ke arah yang tidak dapat diprediksi |
| 3 | Keluaran uji 1 masih terbaca: laporan arm A, draf arm B, pembangkit payload (`Temp/r3b_build.py`, `scratch_r2b/`, `ab_r3a/*.py`) (§2) | Dengan lembar lama, Hermes dapat menyalin keluaran sendiri; KE-1 lalu mengukur kecepatan menyalin |
| 4 | Memori profil tidak di-reset dan `state.db` menyimpan riwayat sesi (`04_contract_trial_report.md:4`, `:8`; `11:354`) | Pengingatan isi lembar lama tidak dapat dikendalikan. Ini hipotesis yang belum diuji, tetapi arah risikonya hanya satu |
| 5 | DB DEV sudah berisi dokumen 010-012 dengan kartu, owner, dan istilah yang sama (`04_contract_trial_report.md:1`) | Kueri tanpa filter misi akan mengembalikan dokumen lama; kunci Q harus bergantung pada filter misi saja |
| 6 | Lembar lama berbentuk prosa tanpa token kunci beku (research/12 §4.7) | Lembar baru dapat dirancang dengan daftar token KE-7 sejak awal |

Biaya keputusan ini: perbandingan langsung per lembar dengan uji 1 hilang. Mitigasi: (a) laporan baru dipilih dengan peran, panjang, dan bentuk yang setara (§5.4); (b) angka uji 1 dilaporkan sebagai acuan historis, tanpa dipasangkan; (c) kerangka langkah S0-S5 dan urutan silang tetap sama.

Alternatif yang ditolak: (1) lembar lama dengan urutan dibalik (alasan 1-5); (2) satu lembar lama sebagai jangkar ditambah tiga lembar baru. Jangkar itu tercemar oleh desain dan menambah 2 sesi tanpa memisahkan efek belajar dari efek alat.

### 5.3 Kriteria pemilihan laporan

1. Laporan kerja nyata Hermes di `C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/`, bukan folder `backup*`, bukan uji asap, bertanggal sebelum 2026-10-31 (tidak berubah lagi).
2. Bukan misi uji 1 (`2026-10-04-prompt-manual`, `2026-10-12-game-success-formula`, `2026-10-10-tracero-dispatcher-1010`, `2026-10-31_hermes-contract-ab`), dan alur ceritanya tidak sama dengan R-1..R-3.
3. Peran setara slot lama: pelaksana pendek, verifier sedang dengan CHECK + VERDICT, laporan panjang dengan banyak kartu dan dua penanda status.
4. Panjang dalam pita yang sama: sekitar 50, 80, dan 250 baris (lama 53/80/247, `11:295`).
5. Memuat cardId berpola, owner yang dapat dipetakan ke pola skema, dan istilah unik untuk Q3 serta nilai bukti (sha16) untuk Q5.
6. Owner berbeda dari slot lama bila mungkin, supaya pemetaan owner tidak dikerjakan dari ingatan.
7. Tidak pernah dibuka Hermes pada sesi uji 1 (dicek controller lewat Grep `state.db` profil atas basename dan cardId, seperti cek "Q_key" pada `04_contract_trial_report.md:4`).

### 5.4 Kandidat (baca saja; dicek Glob/Grep/Read)

Path relatif `C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/`.

| Slot | Path | Kelas DC-01 | Owner, kartu | Baris | Ciri yang menguji | Bukti |
|---|---|---|---|---|---|---|
| R-4 (padanan R-1) | `2026-10-05-closeout-skill/CS2-patch-laporan.md` | K4 | `gsp-skill-creator`, `t_c6721813` | 50 | Kepala multi-kunci satu baris `STATUS: complete \| Executor: ... \| Tanggal:` (celah DC-01 `:2736`); 3 kartu (`t_21314a56`, `t_bff41a2e`); tabel cek PASS; sha16 `08b942670460d48f` sebagai target Q5 | `:1`, `:3`, `:7-8`, `:28-35`; Grep count 50 |
| R-5 (padanan R-2) | `2026-10-12-blender-mcp-expert-skill/verification/verifier-report.md` | K3 | `gsp-thinker` sebagai verifier, `t_6f30d9fc` | 85 | CHECK 1-7 campur PASS/FAIL, tabel vonis gerbang, `VERDICT: FAIL`, tanpa baris STATUS (status penutupan [skenario], sama seperti R-2) | `:3`, `:16-57`, `:69-79`, `:85` |
| R-6 (padanan R-3) | `2026-10-28_webui-mission-control-1028/output/WEBUI-MC-1028-laporan-akhir-rev2.md` | K4 | `gsp-worker` (peran document-writer), `t_4ca26027` | 251 | Frontmatter (bentuk kepala ketiga); status "SELESAI" plus status PROVISIONAL per butir; kartu lain `t_8f460ad7`; tabel gerbang; pin byte `1e7d979a6d1b1f5d` | `:3`, `:5-7`, `:54-59`, `:122`, `:178`, `:199`; Grep count 251 |

Cadangan bila kandidat gagal kriteria 7 atau FACTS2 menemukan cacat: R-4 `2026-10-13_serah-terima-asignor/verification/e1_sub_purge/E1PURGE_laporan.md` (84 baris, `gsp-system-manager`, `t_4ead3a56`, status `:6`); R-5 `2026-10-10_bakuan-distribusi-orkestrasi/evaluasi/verifikasi-distribusi-01_laporan.md` (190 baris, `gsp-thinker`, `t_389d7ac9`; lebih panjang dari pita); R-6 `2026-10-21_adint-gsdi-transcript-brief/verification/01_laporan-verifikasi.md` (265 baris, 6 kemunculan cardId; kepala belum dibaca, perlu dicek FACTS2).

Ditolak: kedua K2 tersisa (`2026-10-04-prompt-manual/_work/t_39134b6d/LAPORAN-SELESAI.md`, `.../t_0a7016b5/LAPORAN-SELESAI.md`). Keduanya satu misi, satu owner, dan satu alur cerita dengan R-1 lama. Contohnya, t_39134b6d `:75-79` (scanner ronde-1 FAIL, healing, ronde-2 PASS) dan t_0a7016b5 `:12-13` yang menulis sendiri "pola sama dengan cacat bab-21 ronde-1". Akibatnya kelas K2 hilang dari campuran (K4/K3/K4 lawan K2/K3/K4 lama). Ini dapat diterima, karena kelas hanya memengaruhi bentuk kepala dan bentuk kepala tetap tiga ragam (kv satu baris, kv berbaris tanpa STATUS, frontmatter).

Catatan: R-6 punya saudara `WEBUI-MC-1028-laporan-akhir.md` (rev1) di folder yang sama. Brief melarang membaca laporan sumber (C-11), sehingga keberadaannya tidak memengaruhi uji.

Amandemen R2-08: kandidat R-4 `CS2-patch-laporan.md` GAGAL kriteria 7 (`t_c6721813` 206 baris di `state.db` profil) dan diganti cadangan E1PURGE (D-423; manifest 05 §2). R-5 dan R-6 tetap kandidat utama.

### 5.5 Daftar persiapan untuk baris FACTS2 (tidak ditulis sekarang)

1. Bekukan 3 laporan sumber (`sha256sum`) dan catat di `decisions.md`. Jalankan cek kriteria 7 (Grep `state.db` atas `CS2-patch-laporan`, `verifier-report.md` misi blender-mcp-expert, `WEBUI-MC-1028-laporan-akhir-rev2`, dan ketiga cardId); bila ada kemunculan, pakai cadangan.
2. `contract_ab2/facts/R-4.md`, `R-5.md`, `R-6.md`: daftar bernomor `R4-F01..`, kelompok `F-awal`/`F-upd1`/`F-upd2`, tanpa judul atau kepala asli, status dalam bahasa biasa. Jumlah fakta dalam ±15% dari lembar lama (48/48/40, D-404) agar beban isi setara; jumlah nyata dicatat.
3. Fakta "tidak ada di sumber" ditulis eksplisit (pola manifest 04 §2).
4. Fakta [skenario]: `initiator` `gsp-master01`; status laporan dan butir pada S1/S2; status penutupan R-5 `complete` (sumber hanya VERDICT); rujukan R-6 ke satu bagian bukti R-4 (nilai sha16 R-4) untuk Q5. Owner R-6 dipetakan ke nilai yang lolos pola skema (`gsp-worker`), dengan peran ditulis sebagai fakta terpisah (pola D-406).
5. `contract_ab2/facts/W.md` = salinan byte-identik W lama (sha `884dc89f...9138`).
6. `contract_ab2/facts/M.md` (U-14): 6-10 fakta sintetis kecil. Owner dan kartu berbeda dari R-4..R-6; `F-awal` untuk owner, `F-upd1` untuk agen kedua (catatan verifikasi), `F-upd2` penutupan berstatus `needs-review` (bukan `complete`, supaya kunci Q2 tidak berubah). Istilah Q3 tidak boleh muncul.
7. Tabel token KE-7 di manifest: per fakta `fact_id | kelompok | token wajib (DAN) | token alternatif (ATAU) | jenis (literal/angka/manual/absen)`. Token 1-3 string literal pembeda (id, angka, sha, nama berkas, istilah). Fakta tanpa token literal diberi jenis `manual`. Fakta "tidak ada di sumber" diberi jenis `absen`.
8. `contract_ab2/queries/Q.md`: Q1 status laporan kartu `t_4ca26027`; Q2 laporan berstatus `complete` di misi ab2 (kunci: R-4, R-5, R-6; W `blocked` dan M `needs-review` keluar); Q3 paragraf yang memuat satu istilah unik R-6 (dipilih FACTS2 dan dicek hanya muncul di lembar R-6); Q4 laporan owner `gsp-thinker` di misi ab2 (R-5); Q5 bagian bukti R-4 yang dirujuk R-6.
9. Kunci simbolik `Q_key.md` ditaruh DI LUAR `contract_ab2/` (mis. `Temp/hermes_trial/controller_ab2/answers/`), karena pada uji 1 W melihat nama folder `answers/` lewat `ls` (D-416 butir f).
10. Manifest `hermes_trial/05_contract_retrial_facts_manifest.md`: jejak fakta ke baris sumber, tabel token, desain Q, `freeze.sha256` untuk facts + queries + Q_key.

Amandemen R2-08: daftar ini sudah dikerjakan FACTS2 dan dibekukan (D-423; `controller_ab2/freeze.sha256`, `sha256sum -c` OK). Risiko RK-F2 manifest 05 §8: `facts/W.md` byte-identik masih menyebut misi uji 1 di baris 1, jadi prompt run W wajib menyebut misi `2026-10-31_hermes-contract-ab2`, folder `w/`, dan `docKey` `lapkerja-w` (brief 05 §2; harness 05 §3.2).

## 6. Metrik (hanya bagian yang berubah atau diperjelas; sisanya protokol 11 §4)

### 6.1 KE-1 Waktu (U-11; ambang dipisah, D-422)

Batas run:
- START harness: `run-session` menulis baris `scenario_marker,START` dengan `note` `src=harness;...` tepat sebelum pesan pertama dikirim (`ab2.py:1014-1021`), dan nilai yang sama masuk `<run>_meta.txt` (`start_epoch`, `start_utc`).
- END: penanda `trial-log mark END <run>` (`note` memuat `marker=hermes`).

Dua segmen per run, dihitung dari `timing.csv` tanpa imputasi:
- **Komposisi pertama** (fase S1): `T1 = t(akhir S1) - t(START, src=harness)`.
- **Siklus pembaruan** (S2 + S3): `T2 = t(akhir S3) - t(akhir S1)`.

Batas fase "laporan tersimpan atau terkirim":

| Arm | Akhir S1 | Akhir S3 |
|---|---|---|
| A | `t_end_utc` baris `trial-log step edit\|write` terakhir ber-`step_id=S1` atas MD laporan | sama, `step_id=S3` |
| B, lewat CLI | `t_end_utc` baris `api` kiriman 2xx terakhir (`action` `POST ...`, `note` `blok <n> <bagian>`) dari pemanggilan `studio-report` ber-`step_id=S1` yang berhasil. Bila pemanggilan tidak mengirim blok, dipakai baris `basis` (R20) pemanggilan itu, dan hal ini dicatat | sama, pemanggilan ber-`step_id=S3`. Baris `kelengkapan`, `render`, `unduh`, dan `verify` sesudahnya termasuk S4, jadi di luar T2 |
| B, lewat API langsung | kiriman 2xx terakhir S1 menurut tool call log sesi Hermes (POST lewat curl tidak dicatat `trial-log`) | sama untuk S3 |

Aturan tepi:
- Bila `--step` tidak diisi (step_id CLI menjadi `submit` atau `update`, `studio-report.ts:783`) atau step_id arm A tidak konsisten, fase ditetapkan berurutan: submit sukses pertama = S1, update sukses pertama = S2, update sukses kedua = S3. Untuk arm A, fase ditetapkan dari isi suntingan lawan kelompok fakta di log sesi. Penetapan ini dicatat sebagai ajudikasi per run.
- Pemanggilan gagal (`ok=0`) dan percobaan ulangnya masuk ke fase tempat kejadian itu terjadi. Waktu galat dan pemulihan tidak dikeluarkan.
- Pada pasangan mana pun, segmen yang batasnya tidak dapat ditetapkan membuat segmen itu TIDAK-DAPAT-DIHITUNG, dan KE-1 ikut TIDAK-DAPAT-DIHITUNG. Tidak ada imputasi dan tidak ada pasangan yang dibuang.

Rasio dan ambang (D-422, `decisions.md:427`), per pasangan i (R-4, R-5, R-6):
- `r1_i = T1_B,i / T1_A,i` dan `r2_i = T2_B,i / T2_A,i`.
- (a) Komposisi pertama LULUS bila `median(r1_i) <= 1,00` (JSON boleh paling lambat setara MD).
- (b) Siklus pembaruan LULUS bila `median(r2_i) <= 0,70` DAN `max(r2_i) <= 1,00` (tidak ada pasangan > 1,00).
- **KE-1 LULUS bila (a) DAN (b) lulus.**

Bias yang dipertahankan dengan sadar: `studio-report` selalu merender, mengunduh, dan memverifikasi bila dokumen COMPLETE, dan tidak punya opsi untuk melewati render (`studio-report.ts:825-837`). Akibatnya render S1 dan S2 arm B jatuh di dalam T2. Ini merugikan B, sejalan dengan kemiringan `11:283`. Render S3 beserta unduh dan verifikasi adalah S4, di luar T2 tetapi di dalam T.

Dilaporkan per run, tanpa imputasi:
- `T = t(END, src=hermes) - t(START, src=harness)`.
- `pra_START = t(START, src=hermes) - t(START, src=harness)` (berisi baca brief, fakta, panduan).
- `pasca_END = end_utc(meta) - t(END)`.

Sensitivitas wajib, tidak menentukan vonis:
1. T ujung-ke-ujung (START harness sampai END) dengan ambang lama `11:80` (`median <= 0,70` DAN `max <= 1,00`) sebagai acuan.
2. START Hermes sampai END (definisi uji 1, untuk acuan historis; tabel research/12 §4.1.2 diulang).
3. Sesi penuh `wall_s`.
4. Akhir S1 arm B = `t_end_utc` baris `tool` `studio-report submit` (termasuk kelengkapan, render, dan verifikasi S1), sebagai ganti kiriman 2xx terakhir.

Lain-lain:
- Aksi sesudah END adalah penyimpangan. T tidak berubah, aksinya didaftar (preseden R1A L104, D-416 butir c).
- Data tambahan: token keluaran dan jumlah panggilan LLM per sesi dari `usage_<run>.json` (RK-1).

### 6.2 KE-2 Jumlah langkah (advisori)

`N_agent,i` = aksi yang dimulai agen antara START harness dan END. Aturan hitung dari `timing.csv` ditetapkan sebelum uji (R2-08). Buktinya `studio-report.ts:338`, `:803`, `:845-856`; `ab2.py:276-286`, `:343`; laporan R2-01 baris "Konteks kolom timing".

| Sumber baris | Pengenal | Hitungan N_agent |
|---|---|---|
| harness | `note` diawali `src=harness` | 0 |
| `trial-log`, `act=1` (`step`, `get`) | `note` diawali `src=trial-log`, memuat `act=1` | 1 per baris. Baris `step` mewakili aksi yang dicatatnya; pemanggilan `trial-log` itu sendiri tidak dihitung terpisah |
| `trial-log`, `act=0` (`mark`, `qmark`, `answer`) | `note` memuat `act=0` | 0 |
| `studio-report`, baris `tool` | `note` tanpa `src=`; `step_kind=tool`; `action` = `studio-report submit` atau `studio-report update`; `note` = nama berkas draf | 1 per baris. Ada tepat satu baris `tool` per pemanggilan yang sudah membuka berkas timing, termasuk pemanggilan gagal (`ok=0`, `err_code` = kode galat, mis. galat cek lokal draf) |
| `studio-report`, baris `api` | `note` tanpa `src=`; `step_kind=api`; `action` = `<METODE> <route>`; `note` salah satu dari `blok <n> <bagian>`, `basis`, `kelengkapan`, `render`, `unduh`, `verify` | 0; masuk `N_api` |

Pengelompokan baris `api` ke pemanggilannya:
- CLI menulis semua barisnya dalam satu append di akhir pemanggilan (`TimingSink.flush`). Baris `tool` ditulis paling akhir, `seq` berurutan, dan rentang `t_start_utc..t_end_utc` baris `tool` mencakup semua baris `api`-nya.
- Baris `api` milik suatu pemanggilan = baris `api` pada `run_id` yang sama, dengan seq tepat sebelum baris `tool` itu, DAN waktu di dalam rentang baris `tool`.
- Kunci pengelompokan adalah rentang waktu, bukan seq saja. CLI menulis tanpa kunci berkas dan menghitung seq saat membuka berkas, sehingga `trial-log` yang berjalan di tengah satu pemanggilan dapat menghasilkan seq ganda. Seq ganda dilaporkan `csvcheck` dan tidak dikoreksi (harness 05 L-3).

Pemanggilan tanpa baris di CSV:
- Kasusnya: galat sebelum berkas timing dibuka (galat pemakaian, `SECRET_MISSING`, draf tak terbaca, `TIMING_HEADER_MISMATCH`, `TIMING_UNREADABLE`), proses terhenti sebelum flush, atau pemanggilan tanpa `--timing`.
- Dihitung 1 per pemanggilan dari tool call log sesi Hermes, diberi tanda `src=sesi`, dan dilaporkan terpisah.
- `draft-check` tidak menulis timing. Bila Hermes mencatatnya lewat `trial-log step cmd`, ia dihitung dari baris itu saja (tanpa hitung ganda). Bila tidak, dihitung dari log sesi dengan tanda `src=sesi`.

Lain-lain:
- `N_api,i` = jumlah baris `api` studio-report, dilaporkan per `action`. Tidak masuk rasio.
- Silang: N_agent dari CSV dibandingkan dengan jumlah tool call di log sesi Hermes (AS-2). Selisihnya dilaporkan, tidak dikoreksi.
- Ambang tetap `median(s_i) <= 1,00`, advisori (`11:92`).

### 6.3 KE-3 Galat format

- Rumus dan ambang tetap (`11:98-104`).
- `G_B,stored` wajib diukur controller sesudah R6A dan sebelum sesi Q. Untuk setiap dokumen B (R4B, R5B, R6B): ambil `GET /api/studio/documents/{id}/content?shape=submission` (R20) untuk slot `record` dan setiap bab, alirkan ke `POST` R08 dry-run tanpa menyimpan badan, catat `valid` dan kode isu. Simpan hanya ringkasan `contract_ab2/sessions/ke3_dryrun.csv` (`documentId,unit,revisionNo,http_status,valid,codes,corr_id`), tanpa payload. Prosedurnya sama dengan penutup uji 1 R2-05 (U-13a, `research/12b_contract_efficiency_closure.md`, D-420), dan boleh memakai ulang alatnya.
- `G_B,4xx`: dihitung dari baris CLI dan `trial-log` (cid selalu terisi oleh alat). Baris ganda tidak mungkin lagi karena satu panggilan = satu baris yang ditulis alat. Galat registri (mis. probe `kind`) dilaporkan terpisah, seperti di uji 1.
- `G_A`: checker skrip controller (regex medan bertarget, `11:103`) dijalankan atas 3 MD. Hasil ketat dan longgar dilaporkan (pola research/12 §4.3).

### 6.4 KE-4 Retrieval (U-12)

Pilihan: **langkah + bacaan tambahan per kueri**, dengan ruang cari arm A tetap folder misi uji `2026-10-31_hermes-contract-ab2/{r4a,r5a,r6a}/`.

- `L_q,arm` = jumlah aksi agen dari penanda `qmark START` sampai `qmark END` kueri itu (grep, baca berkas, `trial-log get`, panggilan alat).
- `X_q,arm` = bagian dari `L_q` yang bukan pencarian pertama, yaitu bacaan untuk menafsirkan atau memastikan jawaban (baca kepala berkas, buka berkas, R05/R20 untuk membaca status). Dilaporkan per kueri.
- Ambang: LULUS bila Skor B = 5/5 (KERAS, tetap) DAN `median_q L_q(B) <= median_q L_q(A)`. `t_q` dilaporkan informatif.
- Sumber: baris `trial-log` (penanda kueri dan aksi), silang dengan tool call log sesi Hermes; selisih dicatat, tidak dikoreksi.

Alasan memilih ini, bukan ruang cari penuh untuk kueri status/owner:
1. Laporan sumber R-4..R-6 ada di workspace dengan kartu dan owner yang sama, sehingga grep seluruh workspace mengembalikan laporan asli. Kunci arm A menjadi ambigu: apakah laporan asli jawaban benar? Ini masalah yang sama dengan yang membuat D-404 mempersempit ruang cari (`04_contract_trial_facts_manifest.md:62`, butir 5.4).
2. Grep seluruh `workspace/docs` habis waktu 20 s pada alat analis (manifest `:62`). Yang terukur menjadi batas alat, bukan biaya mencari.
3. Keunggulan B yang teramati di uji 1 ada pada struktur jawaban: Q1-Q4 masing-masing satu panggilan R21/R22, sedangkan arm A perlu grep ditambah baca kepala dan menafsirkan label bebas (research/12 §4.4; vonis Hermes `04_contract_trial_report.md:6`). Langkah dan bacaan tambahan mengukur itu langsung.
4. Langkah lebih tahan terhadap bias urutan dalam satu pasangan daripada detik. Arm kedua tetap bisa melewati bacaan karena sudah tahu jawabannya, sehingga urutan per kueri dilaporkan bersama angkanya.

### 6.5 KE-5 Jejak disk (U-10)

Cakupan snapshot (ditulis controller sebelum dan sesudah tiap run, format `sha256  bytes  path`, `disk_<run>_{pre,post}.txt`):

| Set | Path | Cara |
|---|---|---|
| S1 | `C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/2026-10-31_hermes-contract-ab2/` | listing rekursif penuh pre/post |
| S2 | `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/` (termasuk `contract_ab2/`) | listing rekursif penuh pre/post |
| S3 | `C:/Users/TRIAL/AppData/Local/Temp/` (`%TEMP%`) di luar S2 | pasca-run: `find -type f -newer <penanda_pre>` + sha256 + byte |
| S4 | `C:/Users/TRIAL/workspace/gsp-hermes/workspace/` di luar `docs/` | pasca-run: `find -type f -newer <penanda_pre>` + sha256 + byte |

- Grep pasca-run atas setiap berkas baru atau berubah (teks, < 5 MB) di S1-S4: `contractRecord|studio\.(slot|chapter)/v2|"baseRevisionNo"|"chapterKey"`. Dua pola terakhir adalah tambahan agar badan bab dan badan pembaruan yang tidak memuat `contractRecord` ikut tertangkap.
- `D_raw,B` = berkas baru/berubah pada run B yang (a) diklasifikasi K2-K9 oleh `classify` DC-01, atau (b) cocok pola Grep, atau (c) MD laporan yang bukan draf. Tafsir (b) harfiah: dump respons yang memuat payload juga dihitung (menutup ambiguitas G-6 dan `r3b_body.out`, research/12 §4.5).
- Dikecualikan: (1) draf MD di folder run yang lolos draft-check (controller menjalankan ulang draft-check atas draf itu pasca-run); (2) unduhan final yang cocok regex F_name; (3) berkas milik controller: `contract_ab2/{facts,queries,sessions}/`, `timing.csv`, `retrieval.csv`, `docs_b.csv`, `format_*.txt`, folder alat `trial-log`; (4) berkas di S3/S4 yang tidak cocok pola dan tidak berkelas K2-K9 (didaftar, tidak dihitung); (5) cache transpilasi tsx (aturan di bawah).
- **Cache transpilasi tsx (D-423; laporan R2-01 "Persistent Issues").** Eksekusi pertama `npx tsx` sesudah sumber berubah menulis `%TEMP%/tsx-<user>/<hash>` berisi kode CLI hasil transpilasi. Kode itu memuat literal `studio.slot/v2`, sehingga cocok pola Grep. Berkas ini adalah cache transpilasi, bukan berkas mentah.
  - Pencegahan (pilih satu sebelum run W, catat di `decisions.md`, pakai sama untuk semua run): (i) **utama**: panaskan cache sesudah server dan repo dibekukan dan sebelum setiap `run-session`, sehingga di luar jendela snapshot pre. Prosedur dan cek mekanisnya di harness 05 §3.2 langkah 0. (ii) Alternatif: `TSX_DISABLE_CACHE=1` diekspor di shell controller sebelum `run-session`. Env ini diwarisi sesi Hermes karena env anak disalin dari env controller (`ab2.py:977`), dan nama env-nya ada di `node_modules/tsx/dist/cli.mjs`. Kekurangannya: setiap pemanggilan CLI mentranspilasi ulang, sehingga waktu arm B bertambah. Besarnya belum diukur (hipotesis).
  - Klasifikasi: berkas baru atau berubah di bawah `%TEMP%/tsx-*/` didaftar dengan label `tsx_cache` dan tidak dihitung dalam D_raw,B, asal isinya kode JavaScript hasil transpilasi (bukan dokumen JSON yang terurai sebagai objek). Setiap berkas `tsx_cache` yang cocok pola dicek manual sekali dan dicatat. Kemunculan `tsx_cache` saat cara (i) dipakai juga dicatat sebagai tanda cache belum hangat.
- Run W dipakai sebagai uji asap klaim "badan hanya di memori" milik `studio-report` (R2-01 sudah membuktikannya dengan snapshot dan `vi.spyOn`; laporan R2-01 baris Verifikasi "Snapshot"). Sesudah W, S3 harus memuat 0 berkas cocok pola, setelah pengecualian controller dan `tsx_cache`. Bila tidak 0, uji ditahan dan dikembalikan ke R2-01.
- Ambang tetap: `D_raw,B = 0` (KERAS), `F_name = F_sha = 100%`.

### 6.6 KE-6 Beban pikir format

- FD dan ambang tetap (`11:159`).
- FL = bacaan format dalam [START harness, END]. Sumber utama: tool call log sesi Hermes yang membaca `STUDIO-AGENT-GUIDE.md`, `GET /api/studio/registry`, atau laporan lama. Sumber silang: baris `trial-log step read --note format_lookup` (dan `trial-log get ... --note format_lookup`). Bila log sesi tidak memuat tool call berwaktu (asumsi AS-2), baris `trial-log` menjadi sumber utama.
- Angka FL uji 1 (5/3/2) tidak sebanding karena jendelanya lebih sempit. Perbandingan historis diberi label itu.

### 6.7 KE-7 Kelengkapan (dengan pencocok token)

- `K_B` dari R15 `COMPLETE` + `missingRequired = []` (tetap).
- `KF_i` = fakta bertoken yang cocok / fakta bertoken. Fakta `absen` tidak masuk penyebut. Fakta `manual` diperiksa 100% oleh pemeriksa (sampel penuh, `11:169`).
- Teks yang dicocokkan: arm B = gabungan teks semua slot dan bab dari R20 revisi terakhir (termasuk nilai medan `record`); arm A = isi MD final.
- Normalisasi: Unicode NFC, spasi diringkas, penanda MD (`*`, `` ` ``, `_`) dibuang, huruf kecil untuk token alfabet. Token angka dicocokkan dalam bentuk mentah DAN bentuk digit saja (pemisah ribuan `.`/`,` dibuang); setiap kecocokan yang hanya lewat bentuk digit diperiksa manual.
- Hasil pencocok mentah dan hasil sesudah ajudikasi manual dilaporkan keduanya; vonis memakai hasil ajudikasi dengan setiap perubahan tercatat per fact_id.
- Fakta `absen`: diperiksa manual bahwa laporan tidak mengarang nilai. Hasilnya dilaporkan terpisah.
- Ambang tetap (`11:170`).

### 6.8 MU-1 dan MU-2 (U-14)

- Skenario run M (§7.2) menghasilkan satu dokumen kontrak dengan dua `agentId`.
- MU-1: SQL `masterplan/05:1329` dijalankan baca-saja di DB DEV, dibatasi ke dokumen misi `2026-10-31_hermes-contract-ab2` (kolom misi disesuaikan controller dengan skema). Diharapkan `actors = 2` untuk `lapkerja-m` dan `actors = 1` untuk W, R4B, R5B, R6B.
- MU-2: porsi `actors = 1` (diharapkan 4/5) dan median revisi; pembanding = jumlah MD laporan baru di S1 (KE-5).
- Uji diskriminasi: bila `lapkerja-m` tetap `actors = 1`, berarti `createdBy` tidak mencerminkan `agentId` (KD-45: agentId hanya label). Itu temuan bahwa MU-1 tidak dapat mengukur U-3, bukan kegagalan run.
- Dicatat juga dari run M: apakah server menerima suntingan agen kedua (diharapkan ya, karena U-3 tidak ditegakkan), serta `lastFilledBy` per slot dari R05.

## 7. Skenario dan urutan

### 7.1 Langkah per run R (sama untuk A dan B)

Langkah S0-S5 protokol 11 §6.3 dengan isi R-4..R-6.

Arm B menurut alur CLI (perilaku dari `studio-report.ts:2-26`, `:825-837`, dan laporan R2-01):
- S1: draf MD + `studio-report submit <draf.md> --timing <csv> --step S1`.
- S2: sunting draf + `studio-report update <documentId> <draf.md> --timing <csv> --step S2`.
- S3: sunting draf + `studio-report update ... --step S3 --require-complete --out <folder run>`.
- S4 tercakup di pemanggilan S3. `submit` dan `update` merender HTML bila dokumen COMPLETE, mengunduh ke memori, mencocokkan sha256, lalu menjalankan HEAD R10 `?verify=1`. Keluar 0 berarti `X-Studio-Sha256-Verified: true` dan nama final konsisten; selain itu `VERIFY_FAILED` atau `SHA_MISMATCH` dengan keluar 1.
- Berkas final hanya tersimpan bila `--out <dir>` diberikan (nama dari `X-Studio-Final-Filename`, flag `wx`). Tanpa `--require-complete`, dokumen yang belum lengkap tidak dirender dan CLI tetap keluar 0. Karena itu brief menganjurkan `--require-complete` pada S3 (keluar 3 bila belum lengkap).

F_name dan F_sha arm B dihitung dari baris `unduh` (bytes + sha16) dan `verify` (HTTP 200) pemanggilan S3, ditambah berkas `--out` di folder run. Hermes boleh memilih API langsung (§17), asal aturan disk ditaati; S4 lalu memakai R15/R17/R10 lewat `trial-log get` dan alur §17.8. Pilihan alurnya dicatat di `format_<run>.txt`. R6 merujuk satu bagian bukti R-4 pada arm yang sama (R6B lewat R21/R20 lalu `refs[]`; R6A mencari MD R4A).

### 7.2 Run M (U-14; arm B; tidak dinilai KE-1..KE-7)

Satu sesi, lembar `facts/M.md`, `docKey` `lapkerja-m`. M1: owner (`agentId` `hermes-gsp-master01`) membuat laporan dari `F-awal`. M2: agen lain (`agentId` `hermes-gsp-verifier01`) memperbarui sesuai `F-upd1`. M3: owner menutup dengan status `needs-review` dari `F-upd2`. Tanpa render yang diminta dan tanpa `--out`. Bila M memakai `studio-report`, render otomatis CLI pada dokumen COMPLETE (§7.1) boleh terjadi dan tidak dinilai. Nama agentId kedua hanya label (KD-45); controller boleh menggantinya sebelum uji, asal dicatat.

### 7.3 Urutan

| order | run | catatan |
|---|---|---|
| 0 | W (B) | pemanasan + uji asap CLI, `trial-log`, dan S3 (§6.5); tidak dinilai |
| 1-2 | R4B lalu R4A | B lebih dulu |
| 3-4 | R5A lalu R5B | A lebih dulu |
| 5-6 | R6B lalu R6A | B lebih dulu |
| 7 | M | U-14 |
| - | controller | dry-run R08 (§6.3), penyelesaian kunci Q, sha kunci dicatat |
| 8 | Q | Q1 A-B, Q2 B-A, Q3 A-B, Q4 B-A, Q5 A-B |

Kemiringan merugikan B dipertahankan (`11:283`). Setiap run memakai sesi Hermes baru.

## 8. Format data

### 8.1 timing.csv

Lokasi `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/contract_ab2/timing.csv`. Header dan 20 kolom = `11:192-213`, kutip RFC 4180 (C-01). Medan tambahan di `note` (pasangan `kunci=nilai` dipisah `;`) hanya ditulis harness dan `trial-log`: `src=harness|trial-log`, `inv=<n>`, `act=<0|1>`, `idsrc=<env|state>`, `format_lookup`, `sha_ok`, `marker=hermes`, `qmark=<Q><arm>` (daftar lengkap di harness 05 §2). Baris `studio-report` tidak memuat `src=`, `via=`, atau `inv=`. Pengenalnya adalah ketiadaan `src=` ditambah `step_kind` `api` atau `tool` (§6.2).

| Penulis | Baris | Medan identitas |
|---|---|---|
| Harness (`run-session`) | START sesi (`step_id=S0`, `scenario_marker`, `START`) | dari tabel run harness; `session_id` = id harness `h-<RUN>-<UTC>` |
| `studio-report --timing <csv>` | Satu baris `api` per HTTP: `<METODE> <route>`, status, cid, t_start/t_end mesin, bytes/sha16 untuk unduhan. Ditambah tepat satu baris `tool` per pemanggilan (`studio-report submit\|update`, ditulis terakhir). Semua baris ditulis dalam satu append di akhir pemanggilan, tanpa kunci berkas. `step_id` = `--step` (bawaan `submit`/`update`) | `run_id`, `arm`, `report_id`, `order`, `session_id` dari env **`STUDIO_TIMING_RUN_ID`, `STUDIO_TIMING_ARM`, `STUDIO_TIMING_REPORT_ID`, `STUDIO_TIMING_ORDER`, `STUDIO_TIMING_SESSION_ID`** (`studio-report.ts:772-785`; bawaan bila kosong: `-`, `B`, `-`, kosong, `-`), bukan `TRIAL_*`. Berkas CSV hanya lewat opsi `--timing`; CLI tidak membaca env `STUDIO_TIMING_CSV` |
| `trial-log` (HARNESS2) | `mark START\|END <run>`; `step read\|edit\|write\|cmd [--target <path>] [--note] [--step]` (bytes + sha16 dihitung alat dari berkas); `get <path\|/api/...> [--head]` (GET/HEAD ke DEV dengan rahasia dari env, badan ke stdout saja, status + cid tercatat); `qmark START\|END <Q> <arm>`; `answer <Q> <arm> <result_ids...>` (menulis `retrieval.csv`). Satu pemanggilan = satu baris, di bawah kunci berkas + fsync | env `TRIAL_RUN_ID`, `TRIAL_ARM`, `TRIAL_REPORT_ID`, `TRIAL_ORDER`, `TRIAL_SESSION_ID` (`ab2.py:225`); cadangan `harness_ab2/state/current_run.json` (`idsrc=state`) |

`run-session` mengisi kedua set env (`TRIAL_*` dan `STUDIO_TIMING_*`) dengan nilai yang sama (`ab2.py:976-981`). Akibatnya baris CLI dan baris `trial-log` satu run berbagi identitas. Pewarisan env dari proses hermes ke alat terminal Hermes belum terbukti (AS-6). Bila env tidak sampai ke alat terminal: `trial-log` jatuh ke `idsrc=state`, sedangkan baris CLI memakai nilai bawaan (`run_id` `-`). Baris CLI seperti itu dipetakan ke run lewat jendela START-END run, dan pemetaan itu dicatat.

Kebutuhan minimum `trial-log` (milik controller, bukan R2-01): satu berkas alat beku dengan sha dicatat; tidak pernah menulis badan respons ke disk; kunci tulis append agar baris tidak terpotong; menolak berjalan bila env identitas kosong. Semuanya terpenuhi HARNESS2 (harness 05 §2, §5; uji asap PASS 45/0).

Pengurai DC-46b: satu skrip `csv` Python; baris dengan jumlah kolom ≠ 20 dilaporkan, tidak dibuang.

### 8.2 retrieval.csv

Header `11:236`, RFC 4180, ditulis oleh `trial-log answer`. `precision`, `recall`, `correct`, `expected_sha256` diisi controller. Kolom `L_q` dan `X_q` dihitung DC-46b dari timing.csv, tidak ditulis Hermes.

### 8.3 Berkas controller lain

`sessions/<run>_meta.txt` (`start_utc`, `end_utc`, `wall_s`, id sesi nyata), `usage_<run>.json`, `disk_<run>_{pre,post}.txt` + `disk_<run>_new_S3S4.txt`, `grep_<run>.txt` (hasil pola §6.5), `ke3_dryrun.csv`, `kf_<run>.csv` (`fact_id,jenis,cocok_mentah,cocok_ajudikasi,catatan`), `mu1.csv` (keluaran SQL).

## 9. Prasyarat sebelum sesi pertama (gerbang controller)

Status per amandemen R2-08 (2026-10-31).

| # | Prasyarat | Pemilik | Status |
|---|---|---|---|
| P-1 | `studio-report submit/update --timing` ada, badan hanya di memori, galat `code` + cid; `--help` menjelaskan render/unduh pada `update`, folder unduh, identitas baris | R2-01 | **TERPENUHI** fungsi (D-423; `scripts/studio/studio-report.ts`; asap :9021 submit rev6 + update rev7, verified true). Penanda `inv` per baris tidak disediakan; diganti aturan baris `tool` §6.2. Review kode + security menunggu P-9 |
| P-2 | draft-check ramah (U-05 a-d) | R2-01 | **TERPENUHI** (D-423; simulasi berurutan, `--json` selalu JSON + `{fatal}`, cwd mana pun via `_repo-alias.ts`, `--with-payload` opt-in) |
| P-3 | `examples.chapters` di R03 `kind=contracts`, setiap contoh lolos R08; R03 tanpa `kind` berdaftar | R2-02 | **TERPENUHI** (D-423; R03 `items[0].examples` {howTo, record, chapters 1..5}, cid e5b825bd; tanpa kind -> 400 `REGISTRY_KIND_UNKNOWN`, `details.validKinds` 13, cid 5c9a601e; bab 1 contoh -> R08 valid, cid 54b1f7f4). Perubahan bentuk `details` (larik -> objek) menunggu P-9 |
| P-4 | Panduan: tanpa `record.json`, resep satu halaman, `matchedItems`, bentuk galat §17.13, dokumentasi `studio-report` | R2-06 | **MENUNGGU R2-06** |
| P-5 | `trial-log` + snapshot S1-S4 + Grep pola + harness START | controller (HARNESS2) | **TERPENUHI** (D-423; `harness_ab2/ab2.py`, uji asap 45/0). Sisa: pewarisan env ke alat terminal Hermes dicek pada baris pertama run W (`idsrc=env` atau terima `state`; AS-6) |
| P-6 | Lembar fakta R-4..R-6, M, W salinan, Q.md, Q_key di luar ab2, manifest, `freeze.sha256` | FACTS2 | **TERPENUHI** (D-423; R-4 = cadangan E1PURGE; `sha256sum -c` OK) |
| P-7 | Server dibekukan; HEAD dicatat; `sha256sum -c` sebelum tiap sesi; cache tsx dipanaskan atau `TSX_DISABLE_CACHE=1` diputuskan dan dicatat (§6.5) | controller | sesudah P-4 dan P-9. Catatan B-7 D-420: DEV menjalankan pohon kerja yang sedang diubah R2, jadi commit dan restart DEV dilakukan sebelum dibekukan |
| P-8 | Brief 05 diselaraskan: setiap tanda [menunggu ...] dihapus atau diganti perilaku nyata | controller / R2-08 | **SEBAGIAN**: R2-08 menyelaraskan brief; tersisa satu tanda [menunggu R2-06] (rujukan subseksi resep panduan), dihapus sesudah P-4 |
| P-9 | Review kode + security CLI baru dan perubahan R03 (`studio-report.ts`, `_repo-alias.ts`, `services/draft/check.ts`, `registry/route.ts`): PASS, atau risiko diterima USER tercatat | R2-07 | **MENUNGGU R2-07**. Perbaikan dari review yang mengubah perilaku CLI/R03 menuntut cek ulang P-1..P-3 dan brief 05 sebelum P-7 |

## 10. Aturan kejujuran data (tambahan atas `11:327-335`)

1. Baris yang ditulis tangan atau dengan skrip Hermes sendiri ke `timing.csv` adalah penyimpangan: dilaporkan, tidak dipakai untuk metrik waktu.
2. Pemakaian bahan uji 1 (folder misi lama, `contract_ab/`, pembangkit lama) yang terlihat di log sesi dicatat sebagai penyimpangan. Run tetap dinilai, dengan tanda.
3. Bila alat R2 (`studio-report`, `draft-check`) atau alat harness (`trial-log`, `run-session`) gagal saat uji, kegagalan dicatat (code + cid atau keluaran alat), run tidak diulang diam-diam; ulang hanya dengan keputusan tercatat (`11:329`; `run-session` menolak dengan `RUN_EXISTS`).
4. Angka naratif Hermes tidak menggantikan CSV (`11:331`).

## 11. Asumsi dan celah

| ID | Asumsi/celah | Dampak bila keliru |
|---|---|---|
| AS-1 | `studio-report` memenuhi U-01 seperti dirinci research/12 §9 | Terverifikasi R2-01 (D-423); penyelarasan langkah S1-S4, C-02, dan C-04 dikerjakan R2-08 (§6.2, §7.1, §8.1) |
| AS-2 | Log sesi Hermes (`state.db`) memuat tool call dengan waktu | Bila tidak, FL dan N_agent bersumber dari `trial-log` dan baris CLI saja (masih alat, bukan ingatan); pemanggilan tanpa baris (§6.2) tidak dapat dihitung dan dilaporkan sebagai celah |
| AS-3 | `createdBy` revisi mencerminkan `agentId` | Bila tidak, MU-1 tidak diskriminatif (dilaporkan sebagai temuan, §6.8) |
| AS-4 | Kandidat R-4..R-6 belum pernah dibuka Hermes pada uji 1 | Dicek FACTS2: R-4 kandidat gagal dan diganti cadangan (D-423) |
| AS-5 | Kelas K2 tidak dibutuhkan untuk keterbandingan | Bentuk kepala tetap tiga ragam (§5.4) |
| AS-6 | Env sesi (`TRIAL_*`, `STUDIO_TIMING_*`, `INTERNAL_API_SECRET`, `HQ_URL`) sampai ke alat terminal Hermes | Bila tidak: `trial-log` memakai `idsrc=state`; baris CLI berisi identitas bawaan dan dipetakan lewat jendela run (§8.1); CLI tanpa rahasia gagal `SECRET_MISSING` keluar 2 tanpa baris timing (brief 05 §2 memberi cara mengisi rahasia dari berkas) |
| G-1 | n = 3, deskriptif | Confidence MEDIUM |
| G-2 | Kepala kandidat cadangan R-6 belum dibaca | Tidak relevan lagi: R-6 kandidat utama dipakai (D-423) |
| G-3 | Analis tanpa shell: sha kandidat tidak dihitung di sini | Dihitung controller (D-423, `freeze_sources.sha256`) |

## 12. Risks

| # | Risiko | Mitigasi |
|---|---|---|
| RK-1 | CLI menutupi biaya menulis JSON tanpa menurunkannya | Token keluaran per sesi dilaporkan (§6.1); ambang KE-1 dipisah komposisi pertama lawan pembaruan (C-12) |
| RK-2 | `trial-log` menambah langkah yang ikut terhitung KE-2 | Pemanggilan `trial-log mark/qmark/answer` (`act=0`) tidak dihitung. Baris `step` dan `get` (`act=1`) dihitung satu kali sebagai aksi yang dicatatnya (`get` menggantikan `curl`), bukan sebagai aksi tambahan (§6.2) |
| RK-3 | Lembar baru lebih mudah atau lebih sulit daripada lama | Jumlah fakta ±15%, pita panjang sama, angka uji 1 hanya acuan historis |
| RK-4 | Hermes membaca bahan uji 1 | Larangan di brief + deteksi log sesi (§10 butir 2); `trial-log get` menolak `contract_ab/` |
| RK-5 | Run M mengubah status yang masuk kunci Q | M ditutup `needs-review`; kunci diselesaikan sesudah M |
| RK-6 | Tanda [menunggu ...] tertinggal di brief saat uji | Gerbang P-8; sisa satu tanda R2-06 |
| RK-7 | Cache transpilasi tsx menghasilkan positif palsu KE-5 | §6.5: dipanaskan sebelum snapshot pre atau `TSX_DISABLE_CACHE=1`; label `tsx_cache` |
| RK-8 | Seq ganda karena CLI menulis tanpa kunci berkas | Pengelompokan per rentang waktu (§6.2); `csvcheck` melaporkan |

## 13. Acceptance Criteria (R2-04)

- [x] U-09: CSV RFC 4180, penulis hanya alat (C-01, C-02, §8.1).
- [x] U-11: START harness, END Hermes, pra-START dilaporkan per run (C-03, §6.1).
- [x] U-12: pilihan langkah + bacaan tambahan, beralasan (C-05, §6.4).
- [x] U-10: snapshot `%TEMP%` dan `Temp/hermes_trial/**` (byte + sha) + Grep pola (C-06, §6.5).
- [x] U-14: skenario dua agentId (§6.8, §7.2).
- [x] KE-3 dry-run R08 wajib (§6.3); KE-7 pencocok token (§6.7).
- [x] Keputusan bias belajar beralasan, kriteria dan path kandidat disebut, daftar FACTS2 (§5).
- [x] Perubahan ambang hanya C-05 dan C-12 (keputusan USER D-422), dicatat (§4).

## 14. Recommendations

1. Controller mencatat C-01..C-12 dan keputusan §5.1 di `decisions.md`. Perubahan ambang: C-05 dan C-12 (D-422).
2. Luncurkan FACTS2 dengan daftar §5.5 sesudah cek kriteria 7. (Selesai, D-423.)
3. Pertanyaan [menunggu R2-01] (§6.2, §7.1, §8.1) sudah terjawab dari laporan R2-01 dan kode CLI, dan dituangkan oleh amandemen R2-08.
4. Ambang KE-1 terpisah sudah diputuskan USER (D-422) dan ditetapkan di §6.1. Ambang ini tidak diberitahukan ke Hermes (brief 05), supaya tidak memengaruhi perilaku.
5. Sebelum P-7: tutup P-4 (R2-06) dan P-9 (R2-07), hapus tanda [menunggu R2-06] terakhir di brief, putuskan cara cache tsx (§6.5), dan tulis prompt W yang menyebut misi ab2 (RK-F2).

## 15. Collection Log

1. Read utuh: research/12, research/11, brief 04, laporan 04, manifest 04; Read `decisions.md:409-424`; Read register 05 `:1318-1333`; Read panduan `:1504-1533`; Grep panduan judul seksi dan `studio-report|examples|resep`.
2. Glob `scripts/studio/*.ts`; Grep `R2-01|studio-report` di repo; Read `file_claims.md:1084-1087`.
3. Workspace Hermes (baca saja): Glob `*/_work/*/LAPORAN-SELESAI.md`, `*/verification/*verifier*.md`, `*/laporan*.md`, `2026-10-*/**/*apor*.md`; Grep hitung baris dan cardId; Read CS2-patch-laporan (utuh), verifier-report blender-mcp-expert (utuh), t_39134b6d (utuh), t_0a7016b5 `:1-15`, WEBUI-MC-1028 rev1 `:1-40`, verifikasi-distribusi-01 `:1-30`, E1PURGE `:1-25`, E1WS `:1-20`; Grep rev2 cardId/status. Tidak ada tulisan ke workspace Hermes.
4. Tidak ada shell: hitungan baris dari Grep `^` count.
5. Amandemen R2-08: Read `decisions.md:418-428`; laporan R2-01 dan R2-02 (utuh); manifest 05 (utuh); harness 05 (utuh); `studio-report.ts:2-106`, `:176-294`, `:326-381`, `:772-858`, Grep opsi dan label baris; `draft-check.ts` Grep opsi; `ab2.py:225-360`, `:556-585`, `:925-1034` (baca saja); Grep `TSX_DISABLE_CACHE` di `node_modules/tsx/dist` (4 berkas).

## 16. Amandemen R2-08 (2026-10-31)

Dasar: D-422 (keputusan USER, ambang KE-1 dipisah), D-423 (alat dan lembar diterima, daftar penyelarasan), D-421 (gerbang P-8). Sunting di tempat; isi lain tidak berubah.

| Bagian | Perubahan | Bukti |
|---|---|---|
| §4 C-02, C-04, C-06; C-12 baru; paragraf penutup | Tanda tunggu dihapus; ambang KE-1 dipisah dicatat sebagai C-12; status "keputusan terbuka" dihapus | D-422; D-423 |
| §6.1 | KE-1 = (a) komposisi pertama `median(r1) <= 1,00` DAN (b) siklus pembaruan `median(r2) <= 0,70` dan `max(r2) <= 1,00`; batas fase per arm; aturan tepi; sensitivitas (1)-(4) | D-422; `studio-report.ts:825-837` |
| §6.2 | Aturan N_agent: 1 per baris `tool` `studio-report submit\|update`; baris `api` = N_api; `trial-log act=1` = 1; pengelompokan per rentang waktu; pemanggilan tanpa baris dari log sesi | `studio-report.ts:338`, `:803`, `:845-856`; `ab2.py:276-286`; harness 05 L-2, L-3 |
| §6.3 | Tanda R2-05 diganti rujukan research/12b | D-420 |
| §6.5 | Aturan cache tsx (pencegahan + label `tsx_cache`); uji asap W tanpa tanda tunggu | laporan R2-01 "Persistent Issues"; D-423 |
| §7.1, §7.2 | Alur CLI S1-S4 nyata (`--step`, `--require-complete`, `--out`; S4 di dalam pemanggilan S3); render otomatis di run M | `studio-report.ts:2-26`, `:64-79` |
| §8.1 | Identitas baris CLI dari `STUDIO_TIMING_*`, bukan `TRIAL_*`; CLI tanpa `src=`/`inv=`/kunci berkas; `trial-log` dari `TRIAL_*`; CLI tidak membaca `STUDIO_TIMING_CSV` | `studio-report.ts:772-785`; `ab2.py:225`, `:976-981` |
| §9 | P-1, P-2, P-3, P-5, P-6 terpenuhi; P-4 menunggu R2-06; P-8 sebagian; P-9 baru menunggu R2-07; P-7 menambah keputusan cache tsx | D-423; D-419 (R2-06, R2-07 gelombang 2) |
| §5.4, §5.5, §10, §11, §12, §13, §14 | Catatan penggantian R-4; FACTS2 selesai + RK-F2; AS-6, RK-7, RK-8 baru; AC dan rekomendasi diperbarui | D-423; manifest 05 §2, §8 |
