---
schema_version: 1.0
task_id: doc_artifact_studio
task_row: DC-46b (analisis uji ulang; protokol research/13_contract_efficiency_protocol_r2.md; keputusan D-419..D-432, terutama D-422 ambang KE-1 dipisah dan D-432 penyimpangan + 4xx)
date: 2026-10-31
agent: data-analyst
type: performance
confidence: MEDIUM (angka waktu, langkah, retrieval, disk, dan token dihitung langsung dari timing.csv, retrieval.csv, snapshot, usage, dan isi berkas; n = 3 pasangan, deskriptif; log tool call sesi Hermes tidak tersedia sehingga N_agent dan FL hanya bersumber baris alat; SQL MU-1, checker G_A mekanis, draft-check ulang pasca-run, dan cek riwayat revisi status transien belum dijalankan controller, lihat §14)
inputs: research/13 (utuh); research/11 §4 (:70-184); research/12 (§0-§9); research/12b (Grep KE-3/KE-7); decisions.md D-419..D-432 (:424-437); hermes_trial/05_contract_retrial_report.md (utuh); 05_contract_retrial_facts_manifest.md (utuh); data BACA SAJA Temp/hermes_trial/contract_ab2/ (timing.csv 340 baris + header, retrieval.csv, docs_b.csv, format_*.txt, facts/R-4..R-6.md, sessions/*_meta.txt, usage_*.json, grep_*.txt, disk_*_new_S3S4.txt, disk_*_post.txt, snap_R4B_diff.json, ke3_dryrun.csv, *_stdout.txt); controller_ab2/answers/Q_key_resolved.md; MD arm A, draf + HTML arm B di workspace Hermes docs/2026-10-31_hermes-contract-ab2/; log server DEV (keluaran tugas latar controller, baca saja)
tools: Read, Glob, Grep. Tanpa shell: semua aritmetika manual dari angka yang terbaca. Baris CSV dirujuk sebagai nomor baris berkas (timing.csv:Lnn, header = L1). Epoch ditulis dipotong: nilai epoch = 1793430000 + angka yang ditulis (contoh 3508,753 = 1793433508,753)
plan_draft: dilewati. Baris ini docs only; usulan diserahkan sebagai baris baru berpemilik (§9)
status: complete
---

# DC-46b: Hasil metrik efisiensi uji ulang Hermes (arm A MD lawan arm B JSON lewat studio-report)

## 0. Ringkasan vonis

| Metrik | Nilai utama | Ambang (protokol 13 + 11) | Vonis |
|---|---|---|---|
| KE-1 (a) komposisi pertama | r1 = T1_B/T1_A: R-4 4,891; R-5 2,050; R-6 1,737; median **2,050** | median(r1) <= 1,00 | **GAGAL** |
| KE-1 (b) siklus pembaruan | r2 = T2_B/T2_A: R-4 4,296; R-5 0,535; R-6 5,980; median **4,296**, maks 5,980 | median(r2) <= 0,70 DAN maks <= 1,00 | **GAGAL** (kedua syarat) |
| KE-1 utuh | (a) GAGAL, (b) GAGAL; sensitivitas 1-4 semuanya GAGAL (§4.1.4) | (a) DAN (b) | **GAGAL** |
| KE-2 langkah (advisori) | N_agent B/A: 12/4 = 3,00; 7/4 = 1,75; 18/6 = 3,00; median **3,00** | median <= 1,00 | **GAGAL** (advisori) |
| KE-3 galat format | G_B,stored = 0 (18/18 valid); Σ G_B,4xx = 1 (409 META_CONFLICT; 2 bila 404 salah ketik dihitung), maks 1; Σ G_A ketat 5 / longgar 1 | stored = 0 KERAS; Σ 4xx <= 3, maks <= 2; Σ G_B < Σ G_A | **LULUS** (tafsir ketat, sama dengan aturan 12b); sensitivitas longgar 1 < 1 salah = GAGAL tepat di batas. Gerbang keras LULUS tanpa syarat |
| KE-4 retrieval | Skor B 5/5, A 5/5; median L_q B 1 = A 1 (ketat), B 1 = A 1 (diperluas) | B 5/5 KERAS DAN median L_q(B) <= median L_q(A) | **LULUS** |
| KE-5 jejak disk | D_raw,B = 0 pada R4B/R5B/R6B sesudah pengecualian protokol; F_name 3/3; F_sha 3/3 | D_raw,B = 0 KERAS; F_name = F_sha = 100% | **LULUS** (dua cek mekanis sisa untuk DC-47b, §4.5) |
| KE-6 beban pikir format | FD_B 2/1/2 (semua <= 2); FL_B ketat 1/2/1 (median 1), luas 1/2/5 (median 2); FL_A 0/0/0 | FD_B <= 2 tiap laporan DAN median FL_B <= median FL_A | **GAGAL** (komponen FL) |
| KE-7 kelengkapan | K_B 100% 3/3; KF fakta persisten 100% di keenam laporan (42/42, 42/42, 38/38 kedua arm) | K_B 100% KERAS; KF_B = 100%; KF_B >= KF_A | **LULUS** (penyebut fakta persisten, aturan 12b); 9 fakta status transien arm B belum diverifikasi analis (§4.7) |
| MU-1 | SQL §19.3 tidak dijalankan; proksi: M 2 aktor (rev 7-12 `agent:hermes-gsp-verifier01`), W/R4B/R5B/R6B 1 aktor | (deskriptif) | **TIDAK-DAPAT-DIHITUNG persis**; proksi diskriminatif |
| MU-2 | proksi: porsi aktor = 1 sebesar 4/5; median revisi 18 (14/18/16/18/18); laporan MD baru arm A 3, arm B 0 (+5 draf sah) | (deskriptif) | Proksi |

Gerbang keras D-362: (1) 0 menyimpang skema **LULUS** (`ke3_dryrun.csv` 18/18 valid, 0 kode isu); (2) retrieval 5/5 **LULUS**; (3) 0 berkas mentah **LULUS** (D_raw,B = 0; pengecualian tsx_cache tidak terpakai karena 0 entri, draf lolos validasi, unduhan final, berkas controller; berkas pekerjaan paralel tidak dihitung, §4.5); (4) kelengkapan K_B 100% **LULUS**.

Vonis gabungan protokol 11 §4.8: **NETRAL (keputusan USER)**. Semua gerbang keras lulus, tetapi KE-1 dan KE-6 gagal. Artinya jalur JSON kini andal dan unggul untuk pencarian, tetapi tidak lebih hemat ditulis. Uji 1 bervonis TIDAK EFEKTIF (KE-5 gagal). Vonis Hermes (V-1) searah dengan metrik: JSON "layak menggantikan" untuk misi yang mengutamakan pencarian dan pengawasan, sedangkan MD tetap lebih hemat untuk misi tulis saja. Keduanya disajikan ke USER apa adanya (protokol 11 §4.9).

Lokasi waktu arm B (§4.1.5): 69,5% dari jendela START harness sampai END habis untuk menyusun isi (jeda generate sebelum draft-check atau CLI). Seluruh kerja mekanis CLI (kirim, kelengkapan, render, unduh, verify) hanya 1,2% (17,295 s dari 1420,829 s). Andaikan durasi CLI nol pun, r2 tetap 4,14 / 0,52 / 5,92. Jadi kegagalan KE-1 bersumber dari biaya komposisi JSON oleh LLM (token keluaran B/A 3,54 / 4,00 / 3,89), bukan dari alat.

## 1. Source Tasks

| Sumber | Isi yang dipakai |
|---|---|
| Protokol 13 §4 (C-01..C-12), §6.1-§6.8, §7, §8, §10 | Rumus dan ambang yang mengikat: KE-1 dipisah (C-12, D-422), KE-2 per baris `tool` (C-04, §6.2), KE-4 langkah per kueri (C-05), KE-5 snapshot S1-S4 + Grep + pengecualian (C-06, §6.5), KE-7 pencocok token (C-09) |
| Protokol 11 §4 (`11:70-184`) | Rumus yang tidak berubah: KE-3 (`:98-104`), KE-5 F_name/F_sha (`:133-134`), KE-6 FD 10 dimensi (`:143-159`), KE-7 (`:165-170`), aturan vonis gabungan §4.8 (`:174-180`), V-1 §4.9 |
| D-422 (`decisions.md:427`) | Keputusan USER: KE-1 (a) median r1 <= 1,00; (b) median r2 <= 0,70 DAN tidak ada pasangan > 1,00; lulus bila (a) DAN (b) |
| D-423, D-430, D-431 (`:428`, `:435`, `:436`) | Lembar beku (sha), cache tsx dihangatkan, server beku pada e723afb |
| D-432 (`:437`) | Hasil mentah DC-45b, kunci Q (sha 434c12b1...0656), 4xx beserta cid, dan penyimpangan: freeze dijalankan dengan cek pengganti, agentId R6B, baris sesudah END, berkas paralel di S4 |
| Laporan uji `05_contract_retrial_report.md:1-8` | Kronologi, path data, dokumen B, umpan balik dan vonis Hermes, penyimpangan (a)-(f) |
| Manifest `05_contract_retrial_facts_manifest.md` §5 | Tabel token KE-7 beku (R-4 45, R-5 45, R-6 41 fakta bertoken) |
| research/12, research/12b | Pembanding uji 1 dan preseden tafsir (G_A ketat/longgar, KF fakta persisten) |

## 2. Exploration & Collection Summary (Tier 2)

| Fakta | Bukti | Mengapa penting |
|---|---|---|
| timing.csv: header + 340 baris, per run W 51 (L2-L52), R4B 48 (L53-L100), R4A 8 (L101-L108), R5A 7 (L109-L115), R5B 45 (L116-L160), R6B 64 (L161-L224), R6A 10 (L225-L234), M 54 (L235-L288), Q 53 (L289-L341) | Read timing.csv | Cocok dengan D-432 (340 baris, csvcheck VALID). Semua baris trial-log `idsrc=env`, sehingga AS-6 terbukti |
| START harness (`src=harness`) dan END (`marker=hermes`) ada di setiap run; step_id S1/S2/S3 konsisten di kedua arm | L53/L100, L101/L107, L109/L115, L116/L156, L161/L220, L225/L233 | KE-1 dapat dihitung tanpa ajudikasi fase |
| stdout sesi hanya memuat jawaban akhir, tanpa tool call | `sessions/R4B_stdout.txt:1-8`, `R6B_stdout.txt:1-11` | AS-2 tidak terpenuhi dari data yang diserahkan. N_agent dan FL bersumber dari baris alat saja; pemanggilan tanpa baris (mis. tulis draf arm B) tidak terhitung |
| Draf arm B tidak dicatat sebagai `step write/edit`; arm A mencatat setiap suntingan | L104-L106 (A) lawan tidak ada baris tulis draf di L53-L100 (B) | N_B terhitung kurang. Silang: panggilan LLM `usage_*.json` |
| Arm B menulis ulang draf penuh tiap langkah ("disunting penuh antar-langkah, bukan patch blok") | `format_R5B.txt:1`, `format_M.txt:2`; ukuran draf B/MD A 14874/7594, 16359/10126, 21750/9751 B (`disk_Q_post.txt:3-11`) | Menjelaskan token keluaran B 3,5-4,0x A (§4.1.6) |
| Draf final R5B tanpa bab 2 (bab 2 hanya dikirim di S1); bab 2 ada di HTML final | `r5b/draf-r5b.md` (kunci bab 1,3,4,5); Grep HTML R5B `:422` "Rincian kerja", `bind_audit.py`, `gsp-verifier` | KE-7 arm B wajib dibaca dari isi tersimpan (HTML render revisi terakhir), bukan dari draf |
| Log server DEV: draft-check berjalan 07:49:24 (W), 07:58:24 (R4B), 08:29:21 + 08:29:30 + 08:36:08 (R6B); R5B dan M tidak menjalankan draft-check; 08:55:14-16 dry-run KE-3 controller | Grep `dry-run kiriman` atas keluaran tugas latar controller | Bukti lolos draft-check untuk pengecualian KE-5 (1); R5B hanya punya bukti setara (kiriman S3 201) |
| Beban paralel ada di hampir semua run, bukan hanya R6B/R6A/M | `disk_R4B_new_S3S4.txt:8-9` (gen_06.py, k4_build/gen_01.py); `disk_R4A_new_S3S4.txt:4` (dump crash node WSL 446 MB, epoch 1793433652); `disk_R5A_new_S3S4.txt:7-13`; `disk_R5B_new_S3S4.txt:4-7, 13-61` (WINWORD, docx 5,4 MB, gen_*.py); `disk_R6B_new_S3S4.txt:5-29` (WINWORD, gen_*.py, dump crash node WSL 444 MB epoch 1793435328) | Pernyataan D-432 "selama R6B/R6A/M" terlalu sempit. Beban mengenai kedua arm; arah biasnya tidak diketahui (hipotesis) |
| Throughput token R5A menyimpang: 8636 token keluaran dalam 578 s (15 token/s), padahal run lain 61-114 token/s | `usage_R5A.json:6`, `R5A_meta.txt:4`; run lain `usage_*.json` / `wall_s` | Rasio R-5 (r1 2,050; r2 0,535) kemungkinan besar dipengaruhi latensi, bukan kecepatan B (hipotesis) |

## 3. Overview

Pertanyaan (protokol 13 §3): sesudah perbaikan R2 (CLI `studio-report`, contoh payload per bab, draft-check ramah, resep satu halaman), apakah laporan kerja JSON lewat Studio (arm B) lebih efisien dan lebih andal daripada MD bebas (arm A)?

Pemangku kepentingan: USER (adopsi dan penegakan U-3), controller (mediasi, cek sisa, baris lanjutan), Hermes `gsp-master01` (pengguna), DC-47b (verifikasi angka ini), pemilik CLI/panduan (usulan §9).

Waktu dan lingkup: 9 sesi DC-45b, 2026-10-31 07:48-09:01Z, server beku pada e723afb (D-431, D-432). Tiga pasangan R-4 (E1PURGE, 50 fakta), R-5 (verifier BLENDER, 49), R-6 (WEBUI-MC rev2, 44), ditambah W (pemanasan), M (dua agentId), dan Q (retrieval). Urutan R4B, R4A, R5A, R5B, R6B, R6A (protokol 13 §7.3).

Metodologi: (1) rumus protokol 13 diterapkan apa adanya ke baris yang disebut; (2) setiap penyimpangan dihitung "seperti tercatat", lalu dampaknya diuji dengan sensitivitas berlabel, tanpa imputasi dan tanpa membuang pasangan (§6.1 aturan tepi); (3) waktu arm B dipecah per fase dengan aturan atribusi uji 1 (selang dibebankan ke aksi yang mengakhirinya, research/12 §4.1.3); (4) KF dicocokkan per token beku manifest §5; (5) friksi dipetakan ke usulan berpemilik.

Alternatif yang ditolak: memakai rasio swalapor Hermes 2,4/1,1/3,4 (itu rentang baris pertama sampai terakhir ledger, termasuk baris sesudah END; dipakai hanya sebagai silang, §8); membuang pasangan R-5 karena anomali latensi (dilarang §6.1, hanya disebut sebagai sensitivitas); menghitung berkas pekerjaan paralel sebagai mentah run B (§4.5).

## 4. Requirements dan hasil per metrik

Persyaratan yang diuji: R-1 KE-1..KE-7 dihitung dengan rumus protokol 13 dan diberi vonis per ambang; R-2 gerbang keras D-362 diputuskan; R-3 penyimpangan D-432 diperlakukan jujur; R-4 pecahan waktu B per fase dan perbandingan dengan uji 1; R-5 umpan balik dan vonis Hermes dirangkum, friksi dipetakan ke usulan berpemilik; R-6 vonis gabungan.

### 4.1 KE-1 Waktu (D-422)

#### 4.1.1 Batas dan segmen

Batas akhir S1/S3 arm B = `t_end` baris `api` 2xx POST terakhir pemanggilan S1/S3 (protokol 13 §6.1). Arm A = `t_end` baris `trial-log step edit` S1/S3.

| Run | START harness | START Hermes | Akhir S1 | Akhir S3 | END | T1 (s) | T2 (s) | T (s) |
|---|---|---|---|---|---|---|---|---|
| R4B | L53 3382,660 | L54 3416,224 | L63 3508,753 | L89 3600,229 | L100 3617,082 | 126,093 | 91,476 | 234,422 |
| R4A | L101 3637,254 | L102 3647,011 | L104 3663,036 | L106 3684,330 | L107 3684,489 | 25,782 | 21,294 | 47,235 |
| R5A | L109 3999,181 | L110 4099,053 | L112 4172,781 | L114 4518,154 | L115 4518,322 | 173,600 | 345,373 | 519,141 |
| R5B | L116 4592,481 | L117 4648,894 | L127 4948,390 | L149 5133,022 | L156 5139,389 | 355,909 | 184,632 | 546,908 |
| R6B | L161 5174,500 | L162 5207,363 | L179 5376,556 | L213 5804,876 | L220 5813,999 | 202,056 | 428,320 | 639,499 |
| R6A | L225 5945,506 | L226 5985,536 | L230 6061,810 | L232 6133,436 | L233 6142,558 | 116,304 | 71,626 | 197,052 |

Rumus: T1 = akhir S1 - START harness; T2 = akhir S3 - akhir S1; T = END - START harness.

#### 4.1.2 Rasio dan vonis

| Pasangan (urutan) | r1 = T1_B/T1_A | r2 = T2_B/T2_A |
|---|---|---|
| R-4 (B dulu) | 126,093/25,782 = **4,891** | 91,476/21,294 = **4,296** |
| R-5 (A dulu) | 355,909/173,600 = **2,050** | 184,632/345,373 = **0,535** |
| R-6 (B dulu) | 202,056/116,304 = **1,737** | 428,320/71,626 = **5,980** |
| Median / maks | **2,050** / 4,891 | **4,296** / **5,980** |

- (a) median r1 = 2,050 > 1,00: **GAGAL**.
- (b) median r2 = 4,296 > 0,70 dan maks 5,980 > 1,00: **GAGAL** pada kedua syarat.
- KE-1: **GAGAL**.

Confidence HIGH untuk angka (baris CSV di atas); MEDIUM untuk tafsir per pasangan (n = 3, anomali latensi R5A).

#### 4.1.3 Pra-START, pasca-END, dan cek jumlah

| Run | pra_START = START Hermes - START harness | T Hermes (START Hermes-END) | pasca_END = end_epoch meta - END | T + pasca = wall_s meta |
|---|---|---|---|---|
| R4B | 33,564 | 200,858 | 3620,360 - 3617,082 = 3,278 | 237,700 (meta 237,701) |
| R4A | 9,757 | 37,478 | 53,705 | 100,940 (100,941) |
| R5A | 99,872 | 419,269 | 59,236 | 578,377 (578,377) |
| R5B | 56,413 | 490,495 | 21,923 | 568,831 (568,830) |
| R6B | 32,863 | 606,636 | 116,300 | 755,799 (755,799) |
| R6A | 40,030 | 157,022 | 6,532 | 203,584 (203,584) |

end_epoch dari `sessions/<run>_meta.txt:6`. Jumlah cocok dengan wall_s dalam 0,001 s, jadi tidak ada celah waktu yang hilang.

#### 4.1.4 Sensitivitas wajib (tidak menentukan vonis)

| Definisi | R-4 | R-5 | R-6 | Median | Uji ambang |
|---|---|---|---|---|---|
| (1) T ujung-ke-ujung, ambang lama `11:80` | 234,422/47,235 = 4,963 | 546,908/519,141 = 1,053 | 639,499/197,052 = 3,245 | 3,245 | GAGAL (median > 0,70; maks > 1,00) |
| (2) START Hermes-END (definisi uji 1) | 200,858/37,478 = 5,359 | 490,495/419,269 = 1,170 | 606,636/157,022 = 3,863 | 3,863 | GAGAL |
| (3) Sesi penuh wall_s | 237,701/100,941 = 2,355 | 568,830/578,377 = 0,983 | 755,799/203,584 = 3,712 | 2,355 | GAGAL |
| (4a) Akhir S1 B = t_end baris `tool` submit: r1 | 127,011/25,782 = 4,926 | 357,339/173,600 = 2,058 | 203,051/116,304 = 1,746 | 2,058 | (a) GAGAL |
| (4b) idem: r2 | 90,558/21,294 = 4,253 | 183,202/345,373 = 0,530 | 427,325/71,626 = 5,966 | 4,253 | (b) GAGAL |

Baris tool submit: L68 t_end 3509,671; L132 4949,820; L184 5377,551.

Kontrafaktual analis (bukan definisi protokol): T2 dikurangi seluruh durasi CLI di dalamnya. R4B 91,476 - 3,321 = 88,155 (r2 4,14); R5B 184,632 - 4,085 = 180,547 (0,52); R6B 428,320 - 4,627 = 423,693 (5,92). Bila galat + pulih 409 R6B (22,244 s) ikut dibuang: 401,449 (5,60). Vonis (b) tidak berubah. Pada R-6, rujukan R6-F41 jatuh di T2 arm B (R21/R22 L202-L204) tetapi di T1 arm A (ls/grep r4a L228-L229). Kemiringan ini merugikan B di T2, tetapi hanya sekitar 34 s, jauh dari cukup untuk membalik vonis.

#### 4.1.5 Pecahan waktu arm B per fase

Aturan atribusi sama dengan research/12 §4.1.3: selang di antara dua peristiwa berwaktu dibebankan ke fase aksi yang mengakhiri selang itu. Baris yang dipakai: L53-L100 (R4B), L116-L156 (R5B), L161-L220 (R6B).

| Fase | R4B s (%) | R5B s (%) | R6B s (%) | Agregat s (%) | Uji 1 agregat (%) |
|---|---|---|---|---|---|
| Pra-START (prompt sampai penanda Hermes) | 33,564 (14,3) | 56,413 (10,3) | 32,863 (5,1) | 122,840 (8,6) | di luar jendela uji 1 |
| Baca fakta + panduan/registri | 18,250 (7,8) | 63,857 (11,7) | 30,919 (4,8) | 113,026 (8,0) | 14,3 |
| Persiapan lain (mkdir/cek env) | 0 | 67,073 (12,3) | 10,827 (1,7) | 77,900 (5,5) | harness/pencatatan 6,2 |
| Susun isi (termasuk draft-check) | 148,177 (63,2) | 348,064 (63,6) | 491,788 (76,9) | 988,029 (69,5) | 58,0 |
| Retrieval/cek di dalam run (R21/R22) | 13,460 (5,7) | 0 | 36,368 (5,7) | 49,828 (3,5) | 5,0 |
| CLI: kirim + kelengkapan + render + unduh + verify | 4,870 (2,1) | 5,936 (1,1) | 6,489 (1,0) | 17,295 (1,2) | kirim 3,4 + render/unduh 7,4 |
| Galat + pulih | 0 | 0 | 22,244 (3,5) | 22,244 (1,6) | 5,6 |
| Admin pasca-S3 sebelum END (R05, docs_b) | 16,101 (6,9) | 5,565 (1,0) | 8,001 (1,3) | 29,667 (2,1) | - |
| Jumlah | 234,422 | 546,908 | 639,499 | 1420,829 | 883,107 (START Hermes) |

Rincian hitung (contoh R4B): pra 3382,660→3416,224; baca fakta 0,166 + panduan 3416,390→3434,474 = 18,084; susun 3434,474→3502,496 (68,022) + draft-check sampai submit 5,460 + 3523,131→3559,956 (36,825) + 3561,459→3599,329 (37,870); CLI 1,715 + 1,503 + 1,652; cek R21 3509,671→3523,131 = 13,460; admin 3600,981→3617,082. R5B: baca 0,177 + 38,379 (sampai R03 L119) + 25,301 (sampai panduan L120); persiapan 4712,751→4779,824 (mkdir L121); susun 167,517 + 123,465 + 57,082. R6B galat: 5499,399 (L188, ok=0) → 5521,643 (mulai ulang L201) = 22,244. R6B retrieval rujukan: 5523,442→5557,819 = 34,377, ditambah R21 docKey 1,991.

Di mana perbaikan R2 berdampak (Confidence HIGH untuk porsi, MEDIUM untuk atribusi):
- Overhead mekanis turun dari sekitar 22,6% (kirim 3,4 + render/unduh 7,4 + harness 6,2 + galat 5,6) menjadi 2,8% (CLI 1,2 + galat 1,6). Skrip harness, berkas badan kiriman, galat curl/MSYS, SCHEMA_INVALID, dan META_REQUIRED_FOR_CREATE di ledger semuanya 0.
- Baca format turun dari 14,3% menjadi 8,0% (tidak sepenuhnya sebanding, karena jendela uji 1 tidak memuat bacaan pra-START).
- Bagian yang tidak tersentuh adalah komposisi. Porsinya naik menjadi 69,5%, dan nilai absolutnya juga naik (512,6 s di uji 1 lawan 988,0 s di sini, beda lembar, hanya acuan). Penyebabnya diduga pergeseran kerja: pada uji 1, pembaruan R3B dipercepat oleh skrip pembangkit payload (S2 9,27 s, S3 8,81 s, research/12 §4.1.3), yang justru menggagalkan KE-5. Kini aturan disk memaksa LLM menulis ulang JSON draf penuh tiap langkah (`format_R5B.txt:1`, `format_M.txt:2`). Ini hipotesis yang didukung data token (§4.1.6), belum diuji terpisah.

#### 4.1.6 Data tambahan token (seluruh sesi, `usage_<run>.json`)

| Pasangan | Token keluaran B/A | Token penalaran B/A | Panggilan LLM B/A | Ukuran artefak final B/A (byte) |
|---|---|---|---|---|
| R-4 | 27121/7666 = 3,538 | 12211/3062 = 3,988 | 27/10 = 2,70 | 14874/7594 = 1,959 |
| R-5 | 34542/8636 = 4,000 | 18095/2459 = 7,359 | 17/13 = 1,31 | 16359/10126 = 1,616 (draf B tanpa bab 2) |
| R-6 | 50223/12904 = 3,892 | 31975/6354 = 5,032 | 33/16 = 2,06 | 21750/9751 = 2,231 |
| Median | **3,892** (uji 1: 1,708) | 5,032 | 2,06 (uji 1: 2,43) | 1,959 |

Throughput token keluaran per wall_s: R4B 114, R4A 76, R5A **15**, R5B 61, R6B 66, R6A 63 token/s. R5A menyimpang lima kali lebih lambat. Ini cocok dengan jeda S1→S2 132,9 s dan S2→S3 212,5 s untuk tambahan teks 5,3 KB dan 2,1 KB (L112-L114, byte 2697→8036→10126). Rasio token keluaran konsisten 3,5-4,0x di ketiga pasangan, sedangkan rasio waktu R-5 menyimpang. Jadi sinyal yang lebih tahan derau adalah token, dan sinyal itu menunjuk B lebih mahal di ketiga pasangan. Risiko RK-1 protokol (JSON lebih panjang dalam token) terbukti makin kuat dibanding uji 1.

### 4.2 KE-2 Jumlah langkah (advisori)

Aturan protokol 13 §6.2: baris trial-log `act=1` = 1; baris `tool` studio-report = 1; baris `api` studio-report = 0 (N_api); harness dan `act=0` = 0; jendela [START harness, END]. Baris trial-log `cmd` yang mencatat pemanggilan studio-report adalah aksi yang sama dengan baris `tool` CLI-nya, sehingga dihitung sekali (tanpa hitung ganda, analog aturan draft-check §6.2).

| Run | Baris yang dihitung | N_agent | N mentah (tanpa dedup) | N_api (per action) |
|---|---|---|---|---|
| R4B | L55 get fakta, L56 baca panduan, L57 draft-check, L68 tool submit, L69-L70 R21 x2, L82 tool update, L95 tool update, L96-L99 R05 x4 (termasuk 404) | **12** | 12 | 32: basis 2, POST slots 3, POST chapters 15, kelengkapan 3, render 3, unduh 3, verify 3 (+1 simpan `--out`) |
| R4A | L103 get, L104-L106 edit x3 | **4** | 4 | - |
| R5A | L111 get, L112-L114 edit x3 | **4** | 4 | - |
| R5B | L118 get, L119 R03, L120 panduan, L121 mkdir, L132/L143/L155 tool x3 | **7** | 7 | 30: basis 2, slots 3, chapters 13, kelengkapan 3, render 3, unduh 3, verify 3 (+1) |
| R6B | L163-L172 (10 baris: get, cek env, grep, sed x3, R03, draft-check x2, R21), L184 tool submit, L188 tool gagal, L201 tool ulang, L202-L204 R21/R22 x3, L205 draft-check, L219 tool S3; L173/L185/L189/L206 = cmd duplikat | **18** | 22 | 34: basis 3, slots 4 (1 x 409), chapters 15, kelengkapan 3, render 3, unduh 3, verify 3 (+1) |
| R6A | L227 get, L228 ls, L229 grep, L230-L232 edit x3 | **6** | 6 | - |

Rasio s = N_B/N_A: R-4 12/4 = 3,00; R-5 7/4 = 1,75; R-6 18/6 = 3,00. Median **3,00** (mentah: 3,00 / 1,75 / 3,67, median 3,00). Vonis **GAGAL** (advisori).

Silang dengan panggilan LLM (proksi tool call, AS-2 tidak tersedia): R4B 27, R4A 10, R5A 13, R5B 17, R6B 33, R6A 16. Rasionya 2,70 / 1,31 / 2,06 (median 2,06), tetap > 1. Baris CSV hanya menangkap 31-55% panggilan LLM. Tulis/sunting draf arm B (minimal 3 per run) tidak punya baris, sehingga N_B sebenarnya lebih besar. Selisih ini dilaporkan, tidak dikoreksi.

Uji 1: median 11,33 (ketat). Kini 3,00. Agregasi CLI menurunkan rasio sekitar 3,8 kali, tetapi belum mencapai non-inferior.

### 4.3 KE-3 Galat format

- G_B,stored = 0: `sessions/ke3_dryrun.csv:2-19`, 18 baris (record + bab 1-5 untuk R4B rev18, R5B rev16, R6B rev18), semuanya `200,true`, kolom kode kosong. Dijalankan sesudah M dan sebelum Q (D-432; log server 08:55:14-16Z). **Gerbang keras LULUS**. Kontrol negatif tidak dijalankan (laporan 05 :7 butir f). Daya beda R08 sudah dibuktikan di D-420.
- G_B,4xx per run (respons 4xx berkode skema/kontrak pada run B):

| Run | Kejadian | Tafsir protokol (skema/kontrak) | Tafsir semua 4xx |
|---|---|---|---|
| R4B | L96 GET R05 404 DOCUMENT_NOT_FOUND cid dd482913 (salah ketik id, diulang 200 di L97) | 0 (galat pencarian, bukan kiriman kontrak) | 1 |
| R5B | - | 0 | 0 |
| R6B | L187 POST slots 409 META_CONFLICT cid e5a1d101 (L188 baris `tool` kejadian yang sama, tidak dihitung dua kali) | 1 | 1 |
| Σ / maks | | **1 / 1** | 2 / 1 |

Dilaporkan terpisah, tidak masuk Σ: Q L334 422 SLOT_UNKNOWN cid 53d63a18 (sesi konsumen); Q L292 trial-log TARGET_MISSING (alat harness); M curl buatan Hermes tanpa header rahasia 401 tanpa code/cid (`M_stdout.txt:7`, run tidak dinilai; sesuai D-426 bahwa 401 tidak membawa code/cid).

- G_B,draft (dilaporkan saja): draft-check tercatat W 1 (L10), R4B 1 (L57), R6B 3 (L170, L171, L205); R5B dan M 0. Log server menunjukkan setiap blok berakhir `SUBMIT_DRY_RUN` (valid). Peringatan `META_REQUIRED_FOR_CREATE` di log adalah lintasan pertama simulasi internal draft-check per bab (dokumen belum ada), lalu diulang dengan simulasi pembuatan dan valid. Tidak ada di ledger dan tidak sampai ke agen. Blok gagal = 0.
- G_A (checker mekanis controller tidak dijalankan; analis memeriksa manual dengan aturan research/12 §4.3, yaitu "ketat" = nilai status harus persis anggota set dan bab Ringkasan wajib ada; "longgar" = kata pertama status dalam set dan bab dinilai menurut fungsi):

| Laporan | Status | Owner | cardId | Tanggal ISO | Bukti | Bab wajib | G_A ketat / longgar |
|---|---|---|---|---|---|---|---|
| R4A | `complete (selesai)` (r4a:166): bukan nilai set persis; kata pertama `complete` | :5 | :4 | :9 `2026-10-14` | §14 :141-147 | Ringkasan §1; rincian §7-§13; bukti §14; isu + lanjut digabung di §16 (preseden R1A tidak dihitung) | 1 / 0 |
| R5A | `complete (pekerjaan verifikasi selesai), mengikuti...` (r5a:14) | :9 | :8 | :12 `2026-10-13` | §2 :23-25, jejak §4 | Tanpa Ringkasan (§1 "Ruang lingkup"); rincian §6; isu + FIX §8; lanjut :121 | 2 / 0 |
| R6A | `SELESAI - laporan rev2 ...` (r6a:17): kata pertama di luar set | :13 | :12 | :16 `2026-10-29` | §12 :124-134 | Tanpa Ringkasan (§1 Identitas); isu = §14 sisa terjadwal + §15; lanjut §17 | 2 / 1 |

Σ G_A ketat 5, longgar 1. Σ G_B = stored 0 + 4xx 1 = 1 (tafsir semua 4xx: 2).

Uji ambang: (a) stored 0: LULUS. (b) Σ 4xx 1 <= 3, maks 1 <= 2: LULUS (juga pada tafsir semua 4xx). (c) Σ G_B < Σ G_A: ketat 1 < 5 LULUS; longgar 1 < 1 salah, GAGAL tepat di batas (tafsir semua 4xx: 2 < 5 LULUS, 2 < 1 GAGAL). Vonis KE-3: **LULUS** dengan tafsir checklist literal, seperti putusan 12b untuk uji 1. Komponen (c) peka tafsir. Gerbang keras lulus tanpa syarat. Confidence HIGH (stored, 4xx), MEDIUM (G_A manual).

### 4.4 KE-4 Retrieval (C-05)

Kunci: `Q_key_resolved.md:32-43` (sha 434c12b1...0656, D-432). Hasil: `retrieval.csv:2-11`. Normalisasi research/12 §4.4: Q1/Q2/Q4 tingkat dokumen (sufiks `:baris` dibuang), Q3/Q5 tingkat baris/pid, himpunan tanpa urutan.

| Q (urutan) | A = kunci? | B = kunci? | L_q A ketat (diperluas) | L_q B ketat (diperluas) | X_q A / B (diperluas) | t_q A / B (s) |
|---|---|---|---|---|---|---|
| Q1 (A-B) | r6a:12 → r6a: benar; status SELESAI cocok | cmvw548nv...: benar; status complete | 1 (2: + baca r6a L297 sesudah qmark END) | 1 (2: + R21 tanpa misi L302) | 1 / 1 | 0,497 / 0,443 |
| Q2 (B-A) | 3 berkas: benar | 3 documentId: benar | 1 (2: + baca r4a L311) | 1 (1) | 1 / 0 | 0,504 / 0,395 |
| Q3 (A-B) | r6a:112;114;116: benar | 3 pid (urutan beda, himpunan sama): benar | 1 (1) | 1 (1) | 0 / 0 | 0,417 / 0,434 |
| Q4 (B-A) | r5a:9 → r5a: benar | cmvw4v23a...: benar | 1 (1) | 1 (1) | 0 / 0 | 0,705 / 0,436 |
| Q5 (A-B) | r4a:145: benar | cmvw407dy...#p-kshekxxr37: benar | 1 (1) | 5 (5): 422 SLOT_UNKNOWN L334, grep panduan L335, R20 record x2 L336-L337, R16 L338 | 0 / 4 | 0,367 / 13,704 |
| Median | | | **1** (1) | **1** (1) | | 0,497 / 0,436 |

Presisi = recall = 1 pada 10/10 pasangan kueri-arm. Skor B **5/5**, A 5/5. Jumlah L ketat A 5, B 9; diperluas A 7, B 10 (cocok dengan swalapor Hermes "A 7 bacaan, B 10 panggilan", `Q_stdout.txt:17`).

Vonis: 5/5 DAN median L_q(B) 1 <= median L_q(A) 1 → **LULUS** (ketat dan diperluas). Catatan: Q5A langsung membuka `r4a:140-150` karena baris tujuan sudah terbaca saat Q1A (r6a:138 menunjuk r4a:145). Ini bias urutan yang menguntungkan A (protokol 13 §6.4 butir 4). Biaya Q5B berasal dari tafsir slot (`refs` adalah medan di dalam slot `record`, bukan slot sendiri), dan 422 tidak memuat daftar slot sah. Keunggulan kualitatif B: jawaban beralamat pid tanpa membaca berkas utuh, dan status tingkat laporan terpisah dari status butir (`Q_stdout.txt:34`). Confidence HIGH.

### 4.5 KE-5 Jejak disk (C-06, §6.5)

Berkas baru/berubah pada run B menurut `grep_<run>.txt` dan `disk_<run>_new_S3S4.txt`:

| Run | Berkas | Set | Cocok pola | Klasifikasi | Hitung D_raw |
|---|---|---|---|---|---|
| R4B | `r4b/023-GSP-LAP-X-2026_rev18_20261031T080000Z_07146aea.html` | S1 | contractRecord 3 (`grep_R4B.txt:2`) | Unduhan final cocok F_name (pengecualian 2) | 0 |
| R4B | `r4b/draf.md` | S1 | contractRecord 1, studio v2 6 (`:3`) | Draf; lolos draft-check 07:58:24Z (log server) dan dikirim 6x201 di S3 (L84-L89) (pengecualian 1) | 0 |
| R5B | `r5b/024-...rev16_..._9e1912ae.html` | S1 | 3 (`grep_R5B.txt:2`) | Unduhan final (2) | 0 |
| R5B | `r5b/draf-r5b.md` | S1 | 1 + 5 (`:3`) | Draf; draft-check TIDAK dijalankan Hermes. Bukti setara: kelima blok draf final diterima server 201 di S3 (L145-L149) dan R08 tersimpan valid | 0 (dengan catatan) |
| R6B | `r6b/025-...rev18_..._577535b3.html` | S1 | 3 (`grep_R6B.txt:2`) | Unduhan final (2) | 0 |
| R6B | `r6b/draf-r6b.md` | S1 | 1 + 6 (`:3`) | Draf; draft-check 08:29:21, 08:29:30, 08:36:08Z; S3 6x201 (L208-L213) (1) | 0 |
| W/R4B/R5B/R6B/M/Q | `Temp/claude/.../tasks/b6rpssopn.output` | S3 | studio v2 11-68 | Keluaran proses server DEV yang dijalankan controller (baris log `"message":"v2 partial dry-run (studio.slot/v2)"`, `:18`), tanpa badan payload (pengecualian 3) | 0 |
| Semua run B | `swap.vhdx`, `*.etl`, `Diagnostics/WINWORD/*.log`, `playwright_chromiumdev_profile-*`, `gen_*.py`, `ekstrak_*.txt`, `tab*_text.txt`, `uf-basal-red-1031b/*`, `defect-updatefields-1031_backup_*/*`, `wsl-crashes/*.dmp`, `Temp/t_aa9282e4/*`, `workspace/Temp/gen_16.py`, `insp19*.py`, `cek19.py`, `gen_17.py`, `gen_19.py` | S3/S4 | 0 | Tidak cocok pola; bukan MD laporan run (pengecualian 4, didaftar) | 0 |

Putusan atas berkas pekerjaan paralel (`workspace/Temp/gen_*.py` dan sejenisnya, D-432 butir e). Berkas ini **tidak dihitung**, menurut pengecualian (4) protokol 13 §6.5. Ketiga syaratnya terpenuhi: (i) 0 kecocokan pola di setiap `grep_<run>.txt`; (ii) berkas Python/teks/biner, bukan MD, sehingga di luar domain kelas laporan K2-K9 fungsi `classify` DC-01; (iii) asal-usulnya bukan run uji. Nama dan isinya merujuk pekerjaan lain ("Kartu 22 generator", `gen_18_kartu21.py`, `gen_13_kartu13_terminal.py`, misi `defect-updatefields-1031`), dan sudah muncul sejak R4B (`disk_R4B_new_S3S4.txt:8-9`) serta di run arm A (`disk_R5A_new_S3S4.txt:7-13`, `disk_R6A_new_S3S4.txt:6-11`).

Satu kasus tepi harus disebut terbuka: `Temp/t_aa9282e4/lapor_comment.md` (2548 B, `disk_R6B_new_S3S4.txt:25`) adalah MD bertipe laporan selesai ("LAPOR-SELESAI ... STATUS: complete", `:1`, `:13`) yang muncul di jendela R6B. Isinya tentang kartu `t_aa9282e4` (defect updateFields DATUM) dan memuat 0 token R-6. Pekerjaan kartu itu sudah berjalan sejak R5B (`disk_R5B_new_S3S4.txt:13-17, 29-31`). Analis memutuskan tidak dihitung: D_raw mengukur versi mentah laporan run B, dan berkas ini bukan hasil run R6B. Bila `classify` DC-01 dijalankan harfiah dan memberinya kelas K2, pembacaan literal "berkas baru pada run B yang berkelas K2-K9" akan menghitungnya, dan gerbang KE-5 gagal karena artefak pengukuran (host tidak terisolasi), bukan karena arm B. Putusan ini diserahkan ke DC-47b/controller untuk dikonfirmasi.

- D_raw,B = 0 / 0 / 0. Arm A (baseline): 1 MD laporan per run (r4a, r5a, r6a), tanpa skrip bantu di S3/S4 yang cocok pola (`grep_R4A/R5A/R6A.txt` kosong).
- F_name: tiga nama final cocok regex `11:133`: awalan `023-`/`024-`/`025-GSP-LAP-X-2026` (karakter sah, <= 80), `_rev18_`/`_rev16_`, stempel `20261031T080000Z`/`20261031T082533Z`/`20261031T083645Z` (8 digit + T + 6 digit + Z), sha8 heksa, `.html`. Hasil **3/3 = 100%**.
- F_sha: sha8 nama = 8 heksa awal sha256 snapshot = sha16 baris unduh. Rinciannya 07146aea (`disk_R4B_post.txt:2`, L92), 9e1912ae (`disk_R6B_post.txt:6`, L152), dan 577535b3 (`disk_R6B_post.txt:8`, L216). Byte snapshot sama dengan byte unduh (2643286, 2660763, 2712300), dan HEAD verify 200 (L93, L153, L217): **3/3 = 100%**.
- Uji asap W: S3 0 berkas cocok pola di luar milik controller, cache tsx 0 entri (laporan 05 :1). Gerbang W LULUS.

Vonis KE-5: **LULUS**. Cek mekanis sisa untuk DC-47b (prosedur protokol yang belum dijalankan): (1) draft-check ulang pasca-run atas `r4b/draf.md`, `r5b/draf-r5b.md`, `r6b/draf-r6b.md` (§6.5 pengecualian 1; R5B tidak punya draft-check sama sekali); (2) `classify` DC-01 atas tiga MD di S3 selama run B (`cak_00test/cakupan-matriks.md` dan `defect-updatefields-1031_backup_.../SKILL.md` di R5B, `t_aa9282e4/lapor_comment.md` di R6B). Bila (1) gagal untuk satu draf, D_raw run itu menjadi 1 dan gerbang gagal. Confidence HIGH (F_name, F_sha, pola), MEDIUM (pengecualian 1 R5B dan putusan asal-usul).

### 4.6 KE-6 Beban pikir format

FD (10 dimensi `11:145-156`), dinilai dari aturan arm dan swalapor `format_<run>.txt` (berlabel swalapor). Dimensi dihitung bila agen menyatakan keputusan bentuk yang tidak ditetapkan arm.

| Dimensi | R4B | R5B | R6B | Arm A (R4A/R5A/R6A) |
|---|---|---|---|---|
| F1 nama berkas | mesin | mesin | mesin | diputuskan (tiga nama berbeda) |
| F2 lokasi | DB | DB | DB | brief: tidak dihitung |
| F3 bentuk kepala | slot record | slot record | slot record | diputuskan (daftar kv R4A; tabel R5A/R6A) |
| F4 nama kunci | skema | skema | skema | diputuskan |
| F5 kosakata status | registri (partial→complete, `format_r4b.txt:1`) | registri | registri | diputuskan (`complete (selesai)`, `SELESAI`) |
| F6 kosakata vonis | registri (dikosongkan) | registri (`FAIL`) | registri (dikosongkan karena "belum lulus" bukan enum, `format_r6b.txt:9`) | diputuskan |
| F7 struktur dalam bab | diputuskan | diputuskan (bab 2 tidak disentuh S2/S3) | diputuskan | diputuskan |
| F8 bentuk rujukan bukti | sebagian: teks `ref` path folder kerja (`format_r4b.txt:1`) | evidence[] mengikuti templat | sebagian: sha16 di medan `sha256` (`format_r6b.txt:6`); refs[] skema | diputuskan (R6A path:baris) |
| F9 notasi kartu | pola | pola | pola | dari lembar: tidak dihitung |
| F10 tanggal | pola | pola | pola | diputuskan (`15:00:54 +0700`, `15:12 +07:00`) |
| FD | **2** | **1** | **2** | 8 / 8 / 8 |

Sensitivitas: bila keputusan R6B mengosongkan verdict dihitung sebagai F6 (enum tidak menampung "belum lulus"), FD_R6B = 3 dan komponen FD gagal.

FL dalam [START harness, END]. Log tool call sesi tidak tersedia, jadi baris trial-log menjadi sumber utama (AS-2):

| Run | FL ketat (baris bertanda `format_lookup`) | FL luas (+ baca panduan lewat sed/grep, `--help`) |
|---|---|---|
| R4B | 1 (L56) | 1 |
| R5B | 2 (L119 R03, L120 panduan) | 2 |
| R6B | 1 (L169 R03) | 5 (L165 grep judul, L166-L168 sed §17.0/templat/§17.3, L169) |
| R4A / R5A / R6A | 0 / 0 / 0 (L228-L229 mencari isi R4A untuk R6-F41, bukan format) | 0 / 0 / 0 |

Median FL_B ketat 1, luas 2; median FL_A 0. Vonis: FD_B <= 2 pada 3/3 LULUS (peka F6 R6B); median FL_B > median FL_A, GAGAL. KE-6 **GAGAL**. Perbandingan historis berlabel "tidak sebanding" (jendela uji 1 lebih sempit): FL_B uji 1 5/3/2 (median 3) menjadi 1/2/1 (median 1). Resep §17.0 menurunkan bacaan, tetapi tiap sesi baru tetap membuka panduan atau registri minimal sekali. Confidence MEDIUM.

### 4.7 KE-7 Kelengkapan

- K_B: setiap pemanggilan S3 melakukan render 200 dan verify 200 (L91/L93, L151/L153, L215/L217). CLI hanya merender dokumen COMPLETE (protokol 13 §7.1), dan R4B/R6B memakai `--require-complete` dengan keluar 0 (R4B: `R4B_stdout.txt:5`; R6B: L206 dan `R6B_stdout.txt:4`). Kunci Q mencatat status complete ketiganya (`Q_key_resolved.md:13-15`). K_B = **100% 3/3**.
- KF dengan token beku manifest §5. Teks arm B = HTML render revisi terakhir (= gabungan slot dan bab tersimpan; dipakai karena draf R5B tidak memuat bab 2) ditambah draf untuk R4B/R6B yang mengirim keenam blok di S3. Teks arm A = MD final.

| Laporan | Literal + angka cocok | Manual persisten cocok | Status transien S1/S2 terlihat di teks final | KF fakta persisten | KF penyebut penuh (teks final saja) |
|---|---|---|---|---|---|
| R4A | 37/37 | 5/5 (F14 :73-77, F19 :85, F27 :113, F36 :135, F39 :139) | 3/3 (F10 :38-43, F11 :45-47, F12 :55-62; MD kumulatif) | 42/42 = 100% | 45/45 = 100% |
| R4B | 37/37 | 5/5 (tabel gsp 0/0/0, platform, items done, SC1, "tidak menulis baris VERDICT") | 0/3 (riwayat ada di revisi DB, belum dicek analis) | 42/42 = 100% | 42/45 = 93,3% |
| R5A | 38/38 | 4/4 (F37 :48-51, F38 :102-103, F43 :110, F47 :121) | 0/3 (MD ditimpa di tempat) | 42/42 = 100% | 42/45 = 93,3% |
| R5B | 38/38 (HTML: `gsp-verifier`, `SE Asia Standard Time`, `bind_audit.py`, `legibilitas_void.py`, `middot_host_reg.py`, `BLENDER-1012-P4a-t_6f30d9fc-20261013` di `:422`) | 4/4 | 0/3 (DB) | 42/42 = 100% | 42/45 = 93,3% |
| R6A | 36/36 | 2/2 (F32 :42-45, F41 :138 → r4a:145) | 0/3 (ditimpa) | 38/38 = 100% | 38/41 = 92,7% |
| R6B | 36/36 | 2/2 (F32 items done; F41 `refs[]` → `cmvw407dy...#p-kshekxxr37` rel evidence, draf :23-25, kunci Q5) | 0/3 (DB) | 38/38 = 100% | 38/41 = 92,7% |

Fakta `absen` (R-4 F06/F45/F47/F48/F49; R-5 F07/F44/F48/F49; R-6 F07/F43/F44): keenam laporan menyatakan "tidak ada di sumber" atau tidak mengisi nilai. Tidak ditemukan nilai karangan. Catatan mutu: judul meta R6B tetap "...(berjalan)" padahal status complete (`draf-r6b.md:12`). Ini sisa langkah S1 yang terkunci oleh META_CONFLICT, bukan fakta yang hilang.

Vonis: K_B 100% (KERAS) LULUS; KF_B fakta persisten 100% = KF_A; KE-7 **LULUS** dengan aturan penyebut 12b. Sensitivitas: pada penyebut penuh "teks final saja", R-4 menjadi KF_B 93,3% < KF_A 100% dan KF_B < 100%, sehingga GAGAL. Manifest §5 menetapkan status S1/S2 "dicek pada revisi atau langkah terkait", jadi angka itu belum vonis. Tindakan: controller memanggil R20 `?revision=` revisi akhir S1 dan S2 untuk R4B (rev6, rev12), R5B (rev6, rev11), dan R6B (rev6, rev12), lalu mencocokkan status butir/laporan. Swalapor Hermes menyebut status record S1/S2 `partial` (`format_r4b.txt:1`, `format_r6b.txt:9`), tetapi swalapor bukan bukti. Confidence HIGH (persisten), LOW (transien B).

### 4.8 MU-1 dan MU-2 (U-14)

- MU-1: SQL `masterplan/05:1329` tidak dijalankan (tidak ada `mu1.csv` di `sessions/`). **TIDAK-DAPAT-DIHITUNG persis**.
- Proksi revisi dari tulisan 2xx timing.csv: R4B 6 + 6 + 6 = 18 (= rev18 `docs_b.csv:3`); R5B 6 + 5 + 5 = 16 (= rev16); R6B 6 + 0 (409 di blok pertama, tidak ada tulisan) + 6 + 6 = 18 (= rev18); M 6 + 6 + 6 = 18; W 6 + 3 + 5 = 14.
- Proksi aktor: run M memanggil R05 dan `/revisions` (L279-L287, 200, badan tidak disimpan). Swalapor `M_stdout.txt:5` dan `format_M.txt:7` menyebut rev 7-12 `createdBy agent:hermes-gsp-verifier01`, sisanya `hermes-gsp-master01`, sehingga aktor = 2. W, R4B, R5B: 1 (`agentId` seragam di draf; `docs_b.csv` lastFilledBy master01). R6B: 1, dengan label **`agent:gsp-document-writer`** (`docs_b.csv:5`; `draf-r6b.md:9` dan setiap blok).
- Uji diskriminasi: `createdBy` mengikuti `agentId` badan (AS-3 didukung swalapor). MU-1 dapat membedakan satu lawan dua label. R6B membuktikan sisi lain KD-45: agentId adalah label bebas yang diterima server tanpa cek. MU-1 mengukur label yang dideklarasikan, bukan identitas pemanggil.
- MU-2: porsi aktor = 1 sebesar 4/5 (W, R4B, R5B, R6B); median revisi 5 dokumen = median(14, 16, 18, 18, 18) = 18. Pembanding KE-5: laporan MD baru arm A 3; arm B 0 laporan ditambah 5 draf sah (w, r4b, r5b, r6b, m).
- Server menerima suntingan agen kedua tanpa penolakan (U-3 tidak ditegakkan, sesuai harapan protokol 13 §6.8); lastFilledBy kembali ke owner (record rev13, content rev18) menurut swalapor.

## 5. Gerbang keras dan vonis gabungan

| Gerbang D-362 | Bukti | Hasil |
|---|---|---|
| (1) 0 laporan menyimpang skema | `ke3_dryrun.csv:2-19` 18/18 valid | LULUS |
| (2) Retrieval 5/5 | §4.4; `retrieval.csv:2-11` lawan `Q_key_resolved.md:34-43` | LULUS |
| (3) 0 berkas mentah | §4.5; `grep_*.txt`; tsx_cache 0; draf lolos validasi; unduhan final; berkas controller; berkas paralel tidak dihitung menurut pengecualian (4) | LULUS (cek sisa DC-47b) |
| (4) Kelengkapan 100% | §4.7 | LULUS |

KE-1 GAGAL dan KE-6 GAGAL; KE-2 GAGAL advisori. Menurut `11:178-180`: **NETRAL (keputusan USER)**, yaitu "andal tetapi tidak lebih hemat".

Kekokohan vonis: NETRAL turun menjadi TIDAK EFEKTIF hanya bila salah satu cek sisa KE-5 gagal (draft-check ulang draf gagal, atau `lapor_comment.md` dihitung secara literal). NETRAL naik menjadi EFEKTIF menuntut KE-1 (a) dan (b) serta FL lulus. Data ini menunjukkan jarak yang besar: median r1 2,05 lawan 1,00 dan median r2 4,30 lawan 0,70.

## 6. Perlakuan penyimpangan D-432

| Butir | Dampak terukur | Pengaruh vonis |
|---|---|---|
| (a) Cek freeze bawaan dilewati (`freeze_check=SKIPPED`, meta :14), diganti `sha256sum -c` 7/7 + `ab2.py freeze --check` sebelum tiap sesi dan di akhir | Integritas lembar, kunci, dan alat terbukti setara (laporan 05 :3) | Tidak ada |
| (c) R6B memakai agentId `gsp-document-writer` | Hanya label aktor; tidak mengubah waktu, langkah, disk, atau isi | Tidak ada pada KE-1..KE-7; MU-2 tetap 1 aktor; temuan KD-45 (§4.8) |
| (d) Baris sesudah END: W 6 (L47-L52), R4A 1 (L108), R5B 4 (L157-L160), R6B 4 (L221-L224), R6A 1 (L234) | Semuanya admin docs_b/format sesuai brief §6. T tidak berubah; baris dikeluarkan dari N | Tidak ada. Asimetri: R4B mengerjakan R05 untuk docs_b SEBELUM END (L96-L99, 16,1 s), sehingga T R4B membengkak 16,1 s. T1 dan T2 tidak terkena |
| (e) Beban paralel di host | Ada di run kedua arm (§2), termasuk dua dump crash node WSL (R4A, R6B) dan anomali throughput R5A | Derau, arah tidak diketahui (hipotesis). Vonis KE-1 kokoh: kontrafaktual CLI nol tetap gagal; rasio token konsisten 3,5-4,0x |
| (f) Dry-run R08 tanpa kontrol negatif | Daya beda R08 sudah dibuktikan D-420 | Tidak ada |
| Tambahan analis: draft-check R5B tidak dijalankan | Pengecualian KE-5 (1) R5B hanya bersandar pada bukti setara | Cek sisa DC-47b |
| Tambahan analis: draf B tidak dicatat `step write` | N_B kurang terhitung | KE-2 tetap GAGAL; arah koreksi memperburuk B |

## 7. Perbandingan dengan uji 1 (acuan historis, lembar berbeda, tidak dipasangkan)

| Metrik | Uji 1 (research/12, 12b) | Uji ulang (ini) | Arah |
|---|---|---|---|
| KE-1 START Hermes-END, median B/A | 4,179 (4,091/7,051/4,179) | 3,863 (5,359/1,170/3,863) | sedikit membaik, tetap GAGAL |
| KE-1 sesi penuh, median | 1,794 | 2,355 | memburuk |
| Rasio pembaruan (S2+S3) | 2,415 / 2,378 / 0,925 | 4,296 / 0,535 / 5,980 | tidak membaik; R3B uji 1 cepat karena skrip pembangkit (yang menggagalkan KE-5) |
| Token keluaran B/A, median | 1,708 | 3,892 | memburuk |
| Overhead mekanis B (kirim, render/unduh, harness, galat) | sekitar 22,6% | 2,8% | sangat membaik (U-01, U-02, U-05) |
| KE-2 median | 11,33 | 3,00 | membaik, tetap GAGAL (advisori) |
| KE-3 | TIDAK-DAPAT-DIHITUNG lalu LULUS (12b); 4xx 3 (maks 2, di batas) | LULUS; 4xx 1 (maks 1); 0 SCHEMA_INVALID | membaik |
| KE-4 | gerbang LULUS, utuh GAGAL (syarat waktu ms) | LULUS (syarat langkah C-05) | membaik (sebagian karena definisi baru) |
| KE-5 | GAGAL (16 payload .json R2B dan lainnya) | LULUS (D_raw 0) | diperbaiki |
| KE-6 | GAGAL (FL 5/3/2) | GAGAL (FL 1/2/1; jendela lebih lebar) | membaik, tetap GAGAL |
| KE-7 | LULUS (12b) | LULUS | tetap |
| W (onboarding) | 183,2 s, 57,6 s galat draft-check | T 130,950 s (L2→L46), 0 galat | membaik (U-05) |
| Vonis gabungan | TIDAK EFEKTIF | NETRAL | naik satu tingkat |

## 8. Umpan balik dan vonis Hermes (swalapor, `Q_stdout.txt:1-48`)

Angka swalapor Hermes adalah "rentang" baris pertama sampai terakhir ledger per run, termasuk baris sesudah END: R4B 3382,660→3617,082 = 234; R4A 3637,254→3733,536 = 96; R5B 4592,481→5149,821 = 557; R6B 5174,500→5838,595 = 664; R6A 197. Rasio swalapor 2,4/1,1/3,4 berbeda dengan rasio resmi 4,963/1,053/3,245 (§4.1.4 baris 1), karena penyebut A memasukkan baris sesudah END. Angka resmi tetap dari CSV (protokol 13 §10 butir 4).

Klaim Hermes yang dicek:
- "Setiap respons galat membawa code dan cid": BENAR untuk 404/409/422 di ledger, KELIRU untuk 401 curl run M tanpa code/cid (`M_stdout.txt:7`; D-426).
- "CLI satu perintah dari draf sampai unduh; tidak ada badan kiriman di disk": DIDUKUNG (§4.5).
- "Nol META_REQUIRED_FOR_CREATE di ledger": BENAR untuk ledger. Log server memuat peringatan itu sebagai lintasan internal simulasi draft-check, yang tidak terlihat oleh agen (§4.3).
- "Waktu tulis 1,1-3,4 kali, aksi 2-4 kali": arah benar, besarnya terlalu kecil pada R-4 (resmi 4,96 ujung-ke-ujung).

Friksi menurut Hermes, dengan bukti analis:
1. 409 META_CONFLICT saat judul berubah antar langkah (L187-L188; galat + pulih 22,244 s). Efek sampingnya, judul final masih bertuliskan "(berjalan)" (`draf-r6b.md:12`).
2. Beban tulis B: 10-11 baris API per langkah (N_api 30-34 per run) dan render otomatis tanpa `--out` (M merender 3 kali). Bukti waktu: render + unduh + verify + kelengkapan di S1 dan S2 hanya sekitar 1,6 s per run (R4B 0,915 + 0,652). Friksinya nyata pada jumlah aksi dan log, tidak pada waktu.
3. 422 SLOT_UNKNOWN tanpa daftar slot sah (L334; Q5B 5 langkah).
4. trial-log menolak path relatif (L292; alat harness).
5. lastFilledBy R6B `agent:gsp-document-writer`.

Friksi yang tidak disebut Hermes, tetapi terlihat di data: penulisan ulang draf JSON penuh per langkah (token keluaran 3,5-4,0x); bacaan panduan per sesi tetap ada (FL > 0); R5B tidak menjalankan draft-check.

Vonis V-1 (kutipan, `Q_stdout.txt:34`): "Laporan kerja JSON (Studio) layak menggantikan laporan kerja MD untuk misi yang kebutuhan pencarian dan pengawasannya lebih besar daripada biaya menulis ... Untuk misi yang hanya menulis tanpa dicari, MD tetap lebih hemat." Ketiga syarat uji 1 dinilai Hermes TERPENUHI (`:36-39`). Vonis ini searah dengan metrik: gerbang keandalan dan retrieval lulus, sedangkan biaya tulis gagal. Keduanya disajikan ke USER tanpa didamaikan.

## 9. Usulan berpemilik (baris baru), berprioritas

Target angka berlabel hipotesis dan baru sah sesudah diukur ulang.

| ID | Prioritas | Friksi/temuan | Pemilik | Area | Perubahan | Metrik yang diharapkan membaik |
|---|---|---|---|---|---|---|
| U-15 | P1 | Komposisi 69,5% waktu B; token keluaran 3,9x (§4.1.5-§4.1.6) | coder-execution (pola R2-01), dengan sesi `brainstorming` lebih dulu | `scripts/studio/studio-report.ts` + `md2chapter`/`md2contract` yang sudah ada | Jalur draf MD-native: agen menulis kepala record ringkas (kunci-nilai) + prosa MD berjudul bab; CLI mengonversi ke `studio.chapter/v2` di memori. Agen tidak lagi menulis JSON blok | KE-1 (a) dan (b), token keluaran B/A (hipotesis mendekati rasio byte MD) |
| U-16 | P1 | Draf JSON ditulis ulang penuh tiap langkah (`format_R5B.txt:1`, `format_M.txt:2`) | pemilik panduan (baris DOC, pola R2-06) + coder-execution | panduan §17.0 + `studio-report update` | Resep: sunting hanya blok yang berubah (patch) dan kirim draf parsial (CLI sudah menerima draf tanpa bab yang tak berubah, bukti R5B S2/S3 5 blok). Opsional: `update --blocks record,3` | KE-1 (b), token per pembaruan |
| U-17 | P2 | META_CONFLICT judul + judul basi "(berjalan)" | coder-execution (server/CLI) + panduan | rute slot/meta, `studio-report update` | `update` tidak mengirim `meta` bila sama dengan yang tersimpan, atau perubahan judul lewat jalur eksplisit; panduan melarang status di judul | G_B,4xx 409 → 0; galat + pulih → 0 |
| U-18 | P2 | FL_B > 0 di setiap sesi (KE-6 gagal) | coder-execution | `studio-report template --mission --docKey [--agent-id]` | Cetak kerangka draf siap isi (dari R03 `examples`, kunci contoh sudah diganti) ke stdout, sehingga sesi baru tidak perlu membuka panduan/registri | FL_B median → 0 (hipotesis); fase baca |
| U-19 | P2 | agentId label bebas (R6B), sehingga MU-1 mengukur label | USER (keputusan U-3) lalu coder-execution | otorisasi kiriman / CLI | Pilihan: ikat agentId ke identitas pemanggil, atau allowlist per misi, atau minimal CLI mengisi agentId dari env dan memperingatkan bila badan berbeda | Validitas MU-1/MU-2 |
| U-20 | P3 | 422 SLOT_UNKNOWN tanpa daftar slot sah (Q5B) | coder-execution | rute R20 | `details.validSlots` + catatan bahwa `refs` ada di slot `record` | L_q Q5 B → 2 |
| U-21 | P3 | Render/unduh/verify otomatis tiap pembaruan COMPLETE (aksi dan log; waktu < 1%) | coder-execution | `studio-report.ts:825-837` | Render hanya bila `--out` atau `--require-complete`, atau sediakan `--no-render` | N_api turun sekitar 6 per run; waktu nyaris tetap |
| U-22 | P1 (prasyarat uji berikutnya) | Celah ukur §14 | controller (HARNESS) | `ab2.py` + prosedur | (a) catat tulis draf B (`trial-log step write` otomatis atau pemantau berkas); (b) ekspor log tool call sesi per run (AS-2); (c) jalankan otomatis pasca-run: draft-check ulang, `classify` S3/S4, SQL MU-1, checker G_A, R20 revisi S1/S2; (d) isolasi host dari pekerjaan paralel selama uji | KE-2, KE-6, KE-7, MU-1 tidak lagi bergantung swalapor; derau KE-1 turun |

Usulan teratas: U-15 + U-16 (satu-satunya jalur yang menyasar sumber kegagalan KE-1), U-18 (KE-6), dan U-22 (prasyarat ukur). U-17 sampai U-21 adalah friksi kecil.

## 10. Key Findings (Confidence / Evidence / Implication)

| # | Temuan | Confidence | Evidence | Implication |
|---|---|---|---|---|
| KF-1 | KE-1 gagal di kedua segmen: median r1 2,050, median r2 4,296 (maks 5,980) | HIGH | §4.1.1-4.1.2; L53-L233 | JSON lewat CLI belum setara MD bahkan untuk komposisi pertama |
| KF-2 | CLI menghapus overhead mekanis (22,6% → 2,8%); kerja CLI 1,2% dari jendela B | HIGH | §4.1.5; L58-L95, L122-L155, L174-L219 | Perbaikan alat R2 bekerja; sisa biaya bukan di alat |
| KF-3 | Biaya B kini adalah generate JSON oleh LLM: token keluaran 3,5-4,0x A, draf 1,6-2,2x byte MD, ditulis ulang penuh tiap langkah | HIGH (token) / MEDIUM (sebab) | `usage_*.json`; `disk_Q_post.txt`; `format_R5B.txt:1`; `format_M.txt:2` | U-15/U-16; trade-off KE-5 lawan kecepatan pembaruan (uji 1 R3B cepat karena skrip pembangkit) |
| KF-4 | Semua gerbang keras lulus: stored 0, retrieval 5/5, D_raw 0, K_B 100% | HIGH (MEDIUM untuk dua cek sisa KE-5) | §5 | Vonis naik dari TIDAK EFEKTIF ke NETRAL; keputusan adopsi ada di USER |
| KF-5 | Retrieval B setara dalam langkah dan unggul kualitatif (pid, status tingkat laporan); Q5B mahal karena tafsir slot | HIGH | §4.4; L294-L340 | Nilai B ada pada konsumsi; U-20 |
| KF-6 | Rasio R-5 terdistorsi latensi A (15 token/s); beban paralel ada di kedua arm | MEDIUM | `usage_R5A.json`; `R5A_meta.txt`; `disk_*_new_S3S4.txt` | Vonis tidak berubah; uji berikut butuh isolasi host (U-22d) dan token sebagai metrik pendamping |
| KF-7 | agentId bebas: R6B menulis sebagai `gsp-document-writer`, server menerima; M menunjukkan createdBy mengikuti label | MEDIUM (swalapor revisi) | `docs_b.csv:5`; `draf-r6b.md:9`; `M_stdout.txt:5` | MU-1 diskriminatif terhadap label, bukan identitas; U-19 butuh keputusan USER |
| KF-8 | FL_B turun ke 1/2/1, tetapi tetap > FL_A 0 | MEDIUM | §4.6; L56, L119-L120, L165-L169 | U-18 |
| KF-9 | Swalapor Hermes mengecilkan rasio R-4 (2,4 lawan resmi 4,96) dan keliru soal 401 | HIGH | §8 | Angka naratif tidak boleh menggantikan CSV |

## 11. Files/Modules Involved

| Berkas | Peran |
|---|---|
| `Temp/hermes_trial/contract_ab2/timing.csv` (L1-L341) | Sumber KE-1, KE-2, KE-3 4xx, KE-4 L_q, FL |
| `contract_ab2/retrieval.csv`, `controller_ab2/answers/Q_key_resolved.md` | KE-4 |
| `contract_ab2/sessions/ke3_dryrun.csv` | KE-3 stored |
| `contract_ab2/sessions/{grep_*,disk_*_new_S3S4,disk_*_post}.txt`, `snap_R4B_diff.json` | KE-5 |
| `contract_ab2/sessions/*_meta.txt`, `usage_*.json`, `*_stdout.txt`, `format_*.txt`, `docs_b.csv` | Sensitivitas, token, swalapor, MU |
| `contract_ab2/facts/R-4.md`, `R-5.md`, `R-6.md`; manifest 05 §5 | KE-7 |
| Workspace Hermes `docs/2026-10-31_hermes-contract-ab2/{r4a,r5a,r6a}/*.md`, `{r4b,r5b,r6b}/draf*.md` + `*.html` | G_A, KF, F_name/F_sha |
| Keluaran tugas latar controller `Temp/claude/.../tasks/b6rpssopn.output` (log server DEV) | Bukti draft-check, sumber hit S3 milik controller |

## 12. Implementation Order (untuk controller)

1. DC-47b memverifikasi angka di dokumen ini dan menjalankan cek sisa mekanis: draft-check ulang tiga draf B, `classify` tiga MD S3, R20 revisi S1/S2 (9 fakta transien), SQL MU-1, checker G_A.
2. Bila cek sisa tidak membalik gerbang, controller menyajikan vonis NETRAL ke USER lewat AskUserQuestion (misalnya: adopsi JSON untuk laporan yang dicari/diawasi dan MD untuk tulis saja; atau lanjut perbaikan U-15/U-16 dan uji ulang; atau hentikan), lalu mencatat keputusan di `decisions.md`.
3. Bila USER memilih perbaikan, urutan baris: U-22 (prasyarat ukur), U-15 + U-16, U-18, lalu U-17, U-19 (sesudah keputusan USER), U-20, U-21; kemudian uji ulang siklus 3 (batas loop: maksimal 3 siklus per kriteria, KE-1 dan KE-6 kini di siklus 2).

## 13. Risks

| # | Risiko | Mitigasi |
|---|---|---|
| RK-1 | Putusan asal-usul `lapor_comment.md` ditolak dan berkas dihitung harfiah | Disajikan terbuka (§4.5); isolasi host di uji berikut (U-22d) |
| RK-2 | Draft-check ulang draf R5B gagal | Bukti setara kuat (kiriman S3 201, R08 valid); bila gagal, KE-5 gagal dan vonis menjadi TIDAK EFEKTIF |
| RK-3 | Status transien B tidak ada di riwayat revisi | Hanya memengaruhi KF penyebut penuh (bukan gerbang keras); dicek R20 |
| RK-4 | n = 3 dan latensi penyedia tidak stabil | Token dilaporkan sebagai pendamping; kontrafaktual CLI nol; vonis tidak bergantung satu pasangan (r1 gagal tanpa R-5: 4,891 dan 1,737; r2 maks 5,980) |
| RK-5 | U-15 memindahkan kembali beban ke konversi dengan risiko galat skema | Uji dry-run R08 per bab hasil konversi; gerbang KE-3 tetap keras |

## 14. Asumsi dan celah (Tier 1)

| ID | Asumsi/celah | Dampak bila keliru |
|---|---|---|
| AS-1 | `t_end` baris `trial-log step edit` arm A = saat suntingan tersimpan (dicatat sesudah tulis) | Bila pencatatan tertunda beberapa detik, T1_A/T2_A sedikit membesar. Itu menguntungkan B, sehingga vonis tidak berubah |
| AS-2 | HTML render revisi terakhir mewakili isi R20 revisi terakhir untuk KF arm B | Teks HTML dirender dari revisi yang sama (rev pada nama berkas = rev akhir `docs_b.csv`) |
| AS-3 | Aturan atribusi fase (selang → aksi pengakhir) | Porsi per fase bergeser antar-kategori baca/susun, tetapi total CLI dan galat tetap |
| G-1 | Log tool call sesi Hermes tidak tersedia | N_agent dan FL hanya dari baris alat; N_B terhitung kurang |
| G-2 | SQL MU-1, checker G_A mekanis, draft-check ulang, `classify`, dan R20 revisi S1/S2 belum dijalankan | MU-1 tetap proksi; G_A manual; dua cek KE-5 dan KF transien terbuka (§12 butir 1) |
| G-3 | Analis tanpa shell: sha string kunci Q tidak dihitung ulang | Pencocokan dilakukan pada string id; sha kunci dicek controller (D-432) |
| G-4 | Klaim revisi M dua aktor bersandar pada swalapor (badan R05/revisions tidak disimpan) | MU-1 persis lewat SQL (U-22c) |

## 15. Acceptance Criteria (DC-46b)

- [x] KE-1 (a), (b), dan sensitivitas 1-4 dihitung dengan baris dan rumus yang dapat diulang (§4.1).
- [x] KE-2..KE-7 diberi vonis per ambang (§0, §4.2-§4.7).
- [x] MU-1/MU-2 dilaporkan, termasuk agentId R6B (§4.8).
- [x] Gerbang keras diputuskan, termasuk putusan berkas paralel sesuai pengecualian (4) dan kasus tepi yang disebut terbuka (§4.5, §5).
- [x] Penyimpangan D-432 diperlakukan tanpa imputasi dan tanpa membuang pasangan (§6).
- [x] Pecahan waktu B per fase dan perbandingan uji 1 (§4.1.5, §7).
- [x] Umpan balik dan vonis Hermes dirangkum; friksi dipetakan ke usulan berpemilik (§8, §9).
- [x] Vonis gabungan menurut protokol 11 §4.8 (§5).

## 16. Recommendations

1. Controller mencatat vonis NETRAL beserta tafsir KE-3 (ketat) dan KE-7 (fakta persisten) di `decisions.md`, lalu meluncurkan DC-47b dengan daftar cek sisa §12 butir 1.
2. Sajikan ke USER dua fakta yang tidak didamaikan: (a) jalur JSON kini andal (4/4 gerbang keras) dan unggul untuk pencarian; (b) biaya tulisnya 2-6 kali MD dan 3,9 kali token keluaran.
3. Bila perbaikan berlanjut, jangan mengoptimalkan server atau CLI lagi; sasarannya komposisi (U-15, U-16) dan bacaan per sesi (U-18).
4. Uji berikut wajib memakai token keluaran sebagai metrik pendamping KE-1 dan host yang terisolasi.

## 17. Collection Log

1. Read utuh: protokol 13, laporan 05, manifest 05, timing.csv, retrieval.csv, docs_b.csv, ke3_dryrun.csv, Q_key_resolved.md, facts R-4/R-5/R-6, tiga MD arm A, tiga draf arm B, format_* (7), stdout R4B/R6B/M/Q, usage (6 run B/A + M), grep_* (W, R4B, R5B, R6B, M, Q, R6A), disk_*_new_S3S4 (W, R4A, R4B, R5A, R5B, R6A, R6B, M), snap_R4B_diff.json, R4B_meta; `Temp/t_aa9282e4/lapor_comment.md`.
2. Read bagian: decisions.md :424-437; protokol 11 :70-194; research/12 :1-300, :311-335; Grep research/12b (G_A, KF).
3. Grep: meta seluruh run (start/end/wall/epoch/hits); `disk_*_post.txt` nama final + sha; HTML R5B (token bab 2: `bind_audit.py`, `gsp-verifier`, `SE Asia Standard Time`, `Rincian kerja`); log server (`dry-run kiriman`, `META_REQUIRED_FOR_CREATE`, level warn/error, baris 1-50 dibaca).
4. Tidak ada tulisan selain berkas ini. Tidak ada tulisan ke workspace Hermes, Temp, atau repo lain.
