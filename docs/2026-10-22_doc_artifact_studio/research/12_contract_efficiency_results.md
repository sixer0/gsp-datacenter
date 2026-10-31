---
schema_version: 1.0
task_id: doc_artifact_studio
task_row: DC-46 (blueprint identification/07_document_contract_blueprint.md:333, profil :386; protokol research/11_contract_efficiency_protocol.md; register masterplan/05_document_contract_specs.md §19.3 MU-1/MU-2, BA-46)
date: 2026-10-31
agent: data-analyst
type: performance
confidence: MEDIUM (angka waktu, langkah, retrieval, dan nama/sha berkas dihitung langsung dari CSV dan snapshot; n = 3 pasangan dan bersifat deskriptif; tiga komponen belum dapat dihitung karena perintah verifikasi tidak dijalankan pada DC-45, lihat §10)
inputs: research/11 (rumus + ambang); blueprint 07 §3.2 (:507-517) + DC-46 (:333); register 05 §19.3 (:1326-1330), §4.2-§5.3 (:197-313); decisions D-362 (:367), D-404 (:409), D-413..D-416 (:418-421); hermes_trial/04_contract_trial_brief.md, 04_contract_trial_report.md; data BACA SAJA di C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/contract_ab/ (timing.csv 246 baris, retrieval.csv, docs_b.csv, format_*.txt, answers/Q_key_resolved.md, sessions/*_meta.txt, usage_*.json, disk_*_{pre,post}.txt, Q_stdout.txt, R3B_stdout.txt); laporan arm A r1a/r2a/r3a dan unduhan HTML arm B di C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/2026-10-31_hermes-contract-ab/; folder scratch Hermes di Temp (Glob/Grep baca saja)
tools: Read, Glob, Grep. Tanpa shell: semua aritmetika dikerjakan manual dari angka yang terbaca. Baris CSV dirujuk sebagai nomor baris berkas (`timing.csv:Lnn`, header = L1) agar controller dapat mengulang hitungannya
plan_draft: dilewati. Baris ini docs only; usulan perbaikan diserahkan sebagai baris baru (§9) untuk pm-planner/controller
status: complete
---

# DC-46: Hasil metrik efisiensi laporan kerja agen, arm A (MD lama) lawan arm B (JSON API Studio)

## 0. Ringkasan vonis

| Metrik | Nilai utama | Ambang (protokol 11) | Vonis |
|---|---|---|---|
| KE-1 waktu | rasio B/A per pasangan 4,091 / 7,051 / 4,179; median 4,179; maks 7,051 | median <= 0,70 dan maks <= 1,00 | **GAGAL** (tetap gagal pada tiga definisi waktu, §4.1) |
| KE-2 langkah (advisori) | N_B/N_A 11,33 / 12,80 / 4,00 (median 11,33); dengan hitungan mentah Hermes 3,80 / 9,71 / 4,38 | median <= 1,00 | **GAGAL** (advisori; wajib menghasilkan baris lanjutan) |
| KE-3 galat format | G_B,stored belum diuji R08; Σ G_B,4xx = 3, maks 2 (R2B); Σ G_A 3..7 | stored = 0 (KERAS); Σ 4xx <= 3, maks <= 2; Σ G_B < Σ G_A | **TIDAK-DAPAT-DIHITUNG**: gerbang keras tanpa bukti dry-run. Komponen 4xx LULUS tepat di batas |
| KE-4 retrieval | arm B 5/5, arm A 5/5; median t_q B 0,038 s lawan A 0,016 s | B 5/5 (KERAS) dan median t_q(B) <= median t_q(A) | Gerbang keras **LULUS**. KE-4 utuh **GAGAL** pada syarat waktu (selisih 22 ms; urutannya berbalik bila jeda pikir dihitung) |
| KE-5 disk | D_raw,B: R2B 16 berkas payload `.json` (+1 `render_body.json`); R1B 1 salinan payload (`draftcheck_b2.json`); R3B 1 dump respons; F_name 100%; F_sha 100% | D_raw,B = 0 (KERAS), F_name = F_sha = 100% | **GAGAL** |
| KE-6 beban pikir format | FD_B 1 / 1 / 2; FL_B 5 / 3 / 2 (median 3); FL_A 0 / 0 / 0 | FD_B <= 2 tiap laporan dan median FL_B <= median FL_A | **GAGAL** (FL) |
| KE-7 kelengkapan | K_B 100% pada 3/3 (R15 COMPLETE, missingRequired = []); KF belum dihitung | K_B = 100% 3/3 (KERAS), KF_B = 100%, KF_B >= KF_A | Gerbang keras **LULUS**. KE-7 utuh **TIDAK-DAPAT-DIHITUNG** (komponen KF) |
| MU-1 | proksi: revisi 16 / 16 / 16 (W 15); pelaku terakhir 1 per dokumen | (deskriptif) | **TIDAK-DAPAT-DIHITUNG persis** (SQL §19.3 tidak dijalankan); proksi tersedia |
| MU-2 | proksi: porsi actors = 1 sebesar 3/3 (4/4 dengan W); median revisi 16; laporan MD baru: arm A 3, arm B 0 (+2 draf) | (deskriptif) | Proksi; tidak diskriminatif karena brief memaksa satu `agentId` |

Gerbang keras (D-362): (1) 0 laporan menyimpang skema: TIDAK-DAPAT-DIHITUNG, bukti proksi kuat mengarah ke 0; (2) retrieval 5/5: LULUS; (3) 0 berkas mentah: GAGAL; (4) kelengkapan 100%: LULUS.

Vonis gabungan menurut aturan protokol §4.8: **TIDAK EFEKTIF (perlu perbaikan)**, karena gerbang keras KE-5 gagal. KE-1 dan KE-6 juga gagal. Artinya, setelah KE-5 diperbaiki pun hasilnya paling baik NETRAL, kecuali waktu dan beban baca format ikut turun. Vonis kualitatif Hermes (V-1) searah dengan metrik: "Belum layak menggantikan MD sepenuhnya" (§6).

Lokasi waktu arm B (§4.1.3): 58,0% dari jendela START-END dipakai untuk menyusun payload (jeda generate sebelum kiriman). Porsi berikutnya: membaca panduan/registri 14,3%, render/unduh 7,4%, menulis skrip harness 6,2%, galat dan pemulihan 5,6%, retrieval 5,0%, dan pengiriman HTTP 3,4%. Waktu server (Σ dur_s baris api) hanya 1,1-2,8% per run. Di luar jendela, sesi arm B menghabiskan 571,7 s sebelum START, lawan 304,9 s di arm A. Selisih 266,8 s itu diduga (hipotesis) dipakai untuk membaca panduan §16-§17.

## 1. Source Tasks

| Sumber | Isi yang dipakai |
|---|---|
| Blueprint 07 DC-46 (`:333`) | "setiap angka dikutip dari timing.csv atau log; vonis per ambang KE-1..KE-7"; temuan menjadi baris baru |
| Blueprint 07 §3.2 (`:507-517`) | Ambang usulan. Ambang final dikunci DC-03 (D-362) |
| Protokol 11 §4 (`:70-184`) | Rumus KE-1..KE-7, aturan vonis gabungan §4.8, V-1 §4.9; format CSV §5; aturan kejujuran data §8 (antara lain larangan imputasi dan larangan memilih run terbaik) |
| Register 05 §19.3 (`:1326-1330`) | MU-1 (SQL revisi dan pelaku per dokumen kontrak), MU-2 (porsi actors = 1, median revisi, dibandingkan dengan berkas MD baru KE-5) |
| Register 05 §4.4, §5.1, §5.3 (`:220-312`) | Elemen wajib `agentWorkReport`: `type`, `status` (enum draft/complete/partial/blocked/needs-review), `reportedAt`; bab CO-01..CO-05 |
| D-362 (`decisions.md:367`) | Ambang KE-1 (<= 0,70, maks <= 1,0), KE-2 advisori, gerbang keras empat butir |
| D-404 (`:409`) | Lembar fakta beku; retrieval arm A dipersempit ke r1a/r2a/r3a; kunci diselesaikan dari R05/R20 |
| D-416 (`:421`) | Hasil mentah DC-45 dan daftar penyimpangan (a)-(h) yang wajib diperlakukan jujur |
| Laporan uji 04 (`04_contract_trial_report.md:1-8`) | Kronologi sesi, cid 4xx, penyimpangan, vonis Hermes |
| Brief 04 (`04_contract_trial_brief.md:58`, `:72-94`) | Aturan "berkas .json kiriman tersimpan = berkas mentah"; definisi pencatatan |

## 2. Exploration & Collection Summary (Tier 2)

| Fakta | Bukti | Mengapa penting |
|---|---|---|
| timing.csv: 1 header + 245 baris data, semuanya 20 kolom; per run W 51 (L2-L52), R1B 40 (L53-L92), R1A 12 (L93-L104), R2A 9 (L105-L113), R2B 70 (L114-L183), R3B 37 (L184-L220), R3A 10 (L221-L230), Q 16 (L231-L246) | Read timing.csv | Cocok dengan D-416 (246 baris). Tabel A Hermes menyebut 244 (`Q_stdout.txt:9`): selisihnya dicatat, angka CSV yang dipakai (aturan 8.5) |
| Waktu sesi dari harness controller (`sessions/<run>_meta.txt`): W 434,942 s; R1B 424,575; R1A 248,523; R2A 215,229; R2B 755,041; R3B 469,709; R3A 261,768 | `*_meta.txt:1-4` | Dipakai sebagai uji sensitivitas KE-1, karena penanda START ditulis Hermes setelah membaca brief/fakta/panduan |
| Basis epoch 2026-10-31T00:00:00Z = 1793404800 (20757 hari x 86400) | Aritmetika; dicek silang: START W 1793418211,536 = 03:43:31,5Z, 161,6 s setelah awal sesi 03:40:49,932Z | Mengonversi `start_utc` meta ke epoch timing.csv |
| Token dan jumlah panggilan LLM per sesi tersedia | `sessions/usage_<run>.json` | Data tambahan (A-5 protokol): menguji risiko RK-1 (payload JSON lebih panjang dalam token) |
| Snapshot disk hanya mencakup folder misi dan berkas `contract_ab/`, tidak mencakup Temp/scratch | `disk_R2B_post.txt:1-15`, `disk_R3B_post.txt:1-17` | Berkas mentah di scratch tidak terlihat oleh metode KE-5 controller (§7) |
| Folder scratch Hermes: `Temp/hermes_trial/r1b_scratch/` (8 berkas), `scratch_r2b/` (101 berkas termasuk 17 `.json` kiriman), `Temp/r3b_build.py`, `r3b_helper.py`, `r3b_body.out`, `r3b_state.json`, `hermes_trial/w_run/`, `hermes_trial/ab_r3a/` | Glob Temp; Grep `contractRecord\|studio.(slot\|chapter)/v2` | Dasar KE-5 D_raw (§4.5) |
| Server selalu mengirim `code` dan `x-correlation-id` pada galat yang lewat `reject()` | `src/lib/studio/http/errors.ts:43-51`; `src/lib/studio/contract/errors.ts:142-144` (badan `{ error: <pesan>, code, details }`); `src/lib/studio/http/context.ts:40-42` | "400 tanpa err_code" (cid 3b684687) dan "REGISTRY_KIND_UNKNOWN tanpa cid" kemungkinan besar cacat pengurai klien Hermes (pengakuan `R3B_stdout.txt:12`), bukan cacat server (hipotesis: log server untuk cid itu belum diperiksa) |
| Panduan §17.4 menyuruh agen menyimpan badan kiriman sebagai `record.json` lalu `--data-binary @record.json` | `STUDIO-AGENT-GUIDE.md:1875-1881` | Bertentangan dengan brief (`:58`), yang menghitung `.json` kiriman tersimpan sebagai berkas mentah. Penyebab langsung yang masuk akal untuk kegagalan KE-5 R2B |
| Contoh blok `list` (items objek) dan `table` (cells `{text}`) hanya ada di luar §17 | `STUDIO-AGENT-GUIDE.md:560-562`, `:1062-1064`; §17.4 hanya merujuk "seksi 4" (`:1910`) | Menjelaskan 400 SCHEMA_INVALID R2B (items berupa string) dan jeda 88,4 s untuk mencari bentuk sel tabel |
| `matchedItems` R21 = butir `items[].key = cardId`, bukan pencocokan `cardIds` | `src/lib/studio/services/query/contracts.ts:11-12`, `:140-169` | Friksi 5 Hermes (Q1B kosong) adalah salah paham semantik yang tidak terdokumentasi, bukan bug penyaringan |

## 3. Overview

Pertanyaan: apakah laporan kerja lewat JSON API Studio (arm B) lebih efisien dan lebih andal daripada MD bebas (arm A), cukup untuk dinyatakan "efektif" menurut U-3 D-361?

Pemangku kepentingan: USER (memutuskan adopsi dan penegakan penulis tunggal), controller (mediasi dan baris lanjutan), Hermes `gsp-master01` (pengguna utama), pm-planner (merangkai baris perbaikan), coder-execution dan pelaksana DOC-FIX (pemilik usulan).

Waktu dan lingkup: 8 sesi DC-45 pada 2026-10-31 03:40-04:41Z, server beku di HEAD 6fead9c (D-415, D-416). Tiga pasangan: R-1 (53 baris sumber), R-2 (80), R-3 (247), ditambah W (pemanasan, tidak dinilai) dan Q (retrieval).

Metodologi: (1) setiap rumus protokol 11 diterapkan apa adanya ke baris CSV yang disebut; (2) bila data menyimpang (D-416), nilai dihitung "seperti tercatat" lalu dampaknya diuji dengan sensitivitas yang diberi label, tanpa memperbaiki data; (3) waktu arm B dipecah per fase dengan aturan atribusi jeda (§4.1.3); (4) friksi Hermes dipetakan ke usulan berpemilik (§9).

Alternatif yang ditolak: memakai angka naratif Hermes (dilarang aturan 8.5; dipakai hanya sebagai silang); membuang baris estimasi (dilarang, aturan 8.1-8.2); memilih definisi waktu yang paling menguntungkan salah satu arm (semua definisi dilaporkan).

## 4. Metrik KE-1..KE-7 (cara hitung, angka, vonis)

### 4.1 KE-1 Waktu ujung-ke-ujung

#### 4.1.1 Rumus protokol: T = t_end(END) - t_start(START)

| Run | START (baris, t_start) | END (baris, t_end) | T (s) |
|---|---|---|---|
| R1B | L53 1793418687,809 | L88 1793418861,154 | 173,345 |
| R1A | L93 1793419045,581 | L100 1793419087,954 | 42,373 |
| R2A | L105 1793419303,993 | L111 1793419365,080 (t_start kosong; t_end dipakai) | 61,087 |
| R2B | L114 1793419712,674 | L179 1793420143,371 | 430,697 |
| R3B | L184 1793420387,688 | L216 1793420666,752 | 279,064 |
| R3A | L221 1793420892,870 | L230 1793420959,654 | 66,784 |
| W (tidak dinilai) | L2 1793418211,536 | L48 1793418394,722 | 183,186 |

Rasio r_i = T_B / T_A (urutan dalam pasangan): R-1 (B lebih dulu) 173,345 / 42,373 = **4,091**; R-2 (A lebih dulu) 430,697 / 61,087 = **7,051**; R-3 (B lebih dulu) 279,064 / 66,784 = **4,179**. Median **4,179**, maks **7,051**. Agregat: ΣB 883,106 / ΣA 170,244 = 5,187 (Hermes menyebut 5,2: cocok).

Vonis: **GAGAL** (ambang median <= 0,70 dan maks <= 1,00). Tidak ada pasangan yang mendekati ambang. Efek tidak mengikuti urutan, karena pasangan R-2 (A lebih dulu) justru yang terburuk.

Turunan informatif pikir_i = T - Σ dur_s baris tool/api/edit/read di jendela: R1B 173,345 - 4,918 = 168,427 (97,2%); R2B 430,697 - 5,904 = 424,793 (98,6%); R3B 279,064 - 2,934 = 276,130 (98,9%). Σ dur_s baris api saja: R1B 2,774 s (1,6%), R2B 5,904 s (1,4%), R3B 2,934 s (1,1%). Arm A: R1A pikir 42,373 (Σ dur 0); R2A 61,087 - 24,309 = 36,778 (dur baris S2 20,153 memakai t_start perkiraan, L109/L113); R3A 66,780.

#### 4.1.2 Penyimpangan START dan uji sensitivitas

Temuan validitas (D-416 butir b): penanda START ditulis setelah brief, fakta, dan panduan dibaca, padahal protokol menetapkan START "saat skenario diberikan" (protokol 11 `:77`, `:232`). Buktinya: catatan L54 ("dibaca via tool read_file pada giliran sebelumnya"), L116, L185, L94-L95, L222-L223. Di arm A, isi S1 bahkan sudah disusun sebelum START. R2A menulis S1 2,000 s setelah START (L112) dan R3A 0,121 s setelah START (L224), sehingga generate isi S1 pasti terjadi sebelum penanda. Kedua arm sama-sama terpotong, dengan bagian berbeda: B kehilangan waktu baca panduan, A kehilangan waktu komposisi S1. R1A juga menyunting gaya laporannya sesudah END (L104, D-416 butir c), sehingga kerja mutu arm A di luar jendela tidak terhitung.

| Definisi | R-1 (B/A) | R-2 | R-3 | Median | Vonis |
|---|---|---|---|---|---|
| Protokol: START-END Hermes | 173,345/42,373 = 4,091 | 430,697/61,087 = 7,051 | 279,064/66,784 = 4,179 | 4,179 | GAGAL |
| Awal sesi (meta) sampai END | 339,940/115,293 = 2,948 | 684,986/133,562 = 5,129 | 429,842/226,295 = 1,899 | 2,948 | GAGAL |
| Sesi penuh (wall_s meta) | 424,575/248,523 = 1,708 | 755,041/215,229 = 3,508 | 469,709/261,768 = 1,794 | 1,794 | GAGAL |

Cara hitung baris 2: pra-START = epoch START - (1793404800 + detik dari `start_utc` meta). R1B 166,595; R1A 72,920; R2A 72,475; R2B 254,289; R3B 150,778; R3A 159,511; W 161,604. Pasca-END (END sampai `end_utc`): R1B 84,632; R1A 133,233; R2A 81,667; R2B 70,056; R3B 39,868; R3A 35,472. Cek: pra + T + pasca R1B = 166,595 + 173,345 + 84,632 = 424,572 ≈ wall 424,575.

Kesimpulan: vonis KE-1 kokoh terhadap penyimpangan penanda. Rasio menyempit dari sekitar 4x menjadi sekitar 1,8x bila seluruh sesi dihitung, tetapi tetap jauh di atas 0,70 dan 1,00.

Data tambahan token (usage_*.json, seluruh sesi termasuk administrasi sesudah END): output token B/A 68213/39944 = 1,708; 89113/31731 = 2,808; 54640/32287 = 1,692 (median 1,708). Input token 1,215; 5,138; 3,591. Panggilan LLM 30/32 = 0,94; 54/16 = 3,38; 34/14 = 2,43. Risiko RK-1 protokol (JSON lebih panjang dalam token) terbukti: arm B menghasilkan 1,7-2,8x token keluaran untuk fakta yang sama.

#### 4.1.3 Di mana waktu arm B habis (pecahan per fase)

Aturan atribusi (asumsi analis, tercatat AS-3 §10): setiap selang waktu antara dua peristiwa bertimestamp di jendela START-END dibebankan ke fase aksi yang mengakhiri selang itu, yaitu persiapan untuk aksi tersebut. Durasi aksi masuk fasenya sendiri. Fase: baca panduan/registri (`read`, registri R03, `format_lookup`); susun payload (selang sebelum kiriman pertama tiap langkah, pembacaan basis R20, penulisan draf/pembangkit/badan); kirim (rangkaian POST yang berhasil); galat + pulih (dari aksi gagal pertama sampai ulangan yang berhasil dimulai); retrieval (R21/R22, termasuk pencarian rujukan R-3); render/unduh (R15, R17, R10, HEAD verify, simpan); harness/pencatatan (skrip pembungkus curl, MU R05, skrip pencatat surut).

R1B (T = 173,345 s): baca 687,809→687,830 = 0,021 (bacaan nyata terjadi sebelum START); susun 687,830→721,401 (33,571, draf) + draft-check sah 0,624 + 731,571→762,859 (31,288, record) + 763,456→788,001 (24,545, S2) + 788,497→838,011 (49,514, S3) = **139,542**; galat 721,401→730,947 (draft-check MODULE_NOT_FOUND L61 1,456 + jeda 8,091) = **9,547**; kirim 0,597 + 0,496 + 0,657 = **1,750**; retrieval 838,668→843,123 = **4,455**; render/unduh 843,123→861,154 = **18,031**. (Epoch dipotong 1793418xxx.)

R2B (T = 430,697 s; epoch dipotong 1793419xxx, nilai >= 1000 berarti 1793420xxx): harness 712,674→717,327 (api.sh L154) 4,653 + 1093,005→1143,371 (MU R05 L149, log_retro.py L180, baris gagal surut L152) 50,366 = **55,019**; baca 717,327→722,059 (R03 L115) 4,732 + 722,059→743,193 (baris read/format_lookup L116-L118, dicatat surut) 21,134 + 765,026→853,456 (R03 kind=schema format_lookup L151, "cek bentuk sel tabel") 88,430 = **114,296**; susun 743,193→765,026 (build.py L155) 21,833 + 9,133 + 11,951 + 0,109 + S2 900,089→975,404 (75,315) + S3 981,724→1038,613 (56,889) = **175,230**; kirim 0,294 + 4,784 + 0,136 + 0,177 + 6,320 + 1,995 = **13,706**; galat bab 5 879,863→899,912 (400 L124-L126, fix5.py, PY_SYNTAX_ERROR L183) 20,049 + HEAD gagal 1084,522→1092,930 (L147 `verified=` kosong lalu ulang L148) 8,408 = **28,457**; retrieval 1040,608→1055,496 = **14,888**; render/unduh 29,026 + 0,075 = **29,101**.

R3B (T = 279,064 s; epoch dipotong 1793420xxx): baca 387,688→391,951 (R03 L187) 4,263 + 576,859→584,951 (format_lookup §4 L194) 8,092 = **12,355**; susun S1 391,951→571,713 = 179,762 (memuat probe registri 400 L220 yang waktunya estimasi "tengah jeda", sehingga tidak dapat dipisah) + S2 9,270 + S3 8,812 = **197,844**; kirim 5,146 + 3,978 + 5,138 = **14,262**; galat bab 3 S3 (L206 400, ulang L209) 0,027 + 11,440 = **11,467**; retrieval rujukan R1B 598,199→613,087 (14,888) + B5 638,504→648,665 (10,161) = **25,049**; render/unduh 648,665→666,752 = **18,087**.

| Fase | R1B s (%) | R2B s (%) | R3B s (%) | Agregat s (%) |
|---|---|---|---|---|
| Susun payload | 139,542 (80,5) | 175,230 (40,7) | 197,844 (70,9) | 512,616 (58,0) |
| Baca panduan/registri | 0,021 (0,0) | 114,296 (26,5) | 12,355 (4,4) | 126,672 (14,3) |
| Render/unduh | 18,031 (10,4) | 29,101 (6,8) | 18,087 (6,5) | 65,219 (7,4) |
| Harness/pencatatan | 0 (0) | 55,019 (12,8) | 0 (0) | 55,019 (6,2) |
| Galat + pulih | 9,547 (5,5) | 28,457 (6,6) | 11,467 (4,1) | 49,471 (5,6) |
| Retrieval | 4,455 (2,6) | 14,888 (3,5) | 25,049 (9,0) | 44,392 (5,0) |
| Kirim | 1,750 (1,0) | 13,706 (3,2) | 14,262 (5,1) | 29,718 (3,4) |
| Jumlah | 173,346 | 430,697 | 279,064 | 883,107 |

Pemisahan langkah (dipakai untuk usulan): fase S1 (START sampai kiriman S1 terakhir berhasil) B = 75,647 / 187,415 / 189,171 s. Siklus pembaruan S2+S3 (akhir kiriman S1 sampai akhir kiriman S3) B = 75,212 / 140,519 / 61,645 s, lawan A (S1 tersimpan sampai END) 31,148 / 59,087 / 66,663 s. Rasio pembaruan menjadi 2,415 / 2,378 / **0,925**. Pada R-3, setelah pembangkit payload ada, pembaruan arm B lebih cepat daripada arm A. Biaya utama arm B terletak pada komposisi pertama (S1 + bacaan format), bukan pada pembaruan. W (onboarding, tidak dinilai): 183,186 s, dengan 57,639 s (31,5%) habis di galat draft-check `META_REQUIRED_FOR_CREATE` dan BAD_RESP (L10-L14).

Confidence: HIGH untuk total dan Σ dur; MEDIUM untuk atribusi fase (aturan atribusi, baris estimasi L116-L118, L150, L220).

### 4.2 KE-2 Jumlah langkah/panggilan (advisori)

Definisi ketat protokol: baris `tool|api|edit|read` dengan t_start di [START, END], tanpa baris penanda, catatan koreksi, dan baris ganda. Baris R3A `query` (L226-L227, pencarian rujukan dalam run) dihitung sebagai aksi agar setara dengan R21/R22 R3B. Tanpa keduanya, N_R3A = 6.

| Run | N ketat | Rincian per step_kind | Dikecualikan (alasan) | N mentah Hermes |
|---|---|---|---|---|
| R1B | 34 | read 6, api 25, tool 3, edit 0 | L89 MU sesudah END; L90 tulis draf (dicatat surut tanpa waktu nyata); L91-L92 catatan | 38 |
| R1A | 3 | edit 3 | L94-L96 tanpa waktu; L101 sesudah END; L102-L104 tanpa waktu atau sesudah END | 10 |
| R2A | 5 | read 2 (t_end di jendela), edit 3 | L112-L113 baris koreksi (bukan aksi baru) | 7 |
| R2B | 64 | read 4, api 33, edit 27, tool 0 | L126 ganda dari L125 (cid sama 48968c03); L153 sebelum START; L181-L182 sesudah END | 68 |
| R3B | 32 | read 3, api 29 | L217-L219 sesudah END | 35 |
| R3A | 8 | read 3, edit 3, query 2 | - | 8 |

Rasio s_i: R-1 34/3 = 11,33; R-2 64/5 = 12,80; R-3 32/8 = 4,00; median **11,33**. Pada hitungan mentah Hermes: 38/10 = 3,80; 68/7 = 9,71; 35/8 = 4,38; median 4,38. Agregat mentah 141/25 = 5,64, cocok dengan "5,6 kali" Hermes. Bila 18 baris tulis badan oleh skrip R2B (L160-L177) tidak dihitung sebagai aksi agen, N_R2B = 46 dan rasionya 9,20. Silang log: panggilan LLM (`usage_*.json` `api_calls`) R1B 30, R1A 32, R2A 16, R2B 54, R3B 34, R3A 14. R1A punya 32 panggilan LLM walau hanya 10 baris CSV, karena 6 eksekusi skrip pencatat gagal (L102-L103). Selisih ini dicatat, tidak dikoreksi.

Vonis: **GAGAL** (median <= 1,00) pada semua definisi. Sesuai protokol §4.2 (advisori), kegagalan ini menuntut baris lanjutan berupa CLI pembungkus (U-01, §9).

### 4.3 KE-3 Galat format

- G_B,stored: protokol menuntut R20 `GET content` tiap dokumen B dikirim ulang dry-run ke R08. Langkah itu **tidak dijalankan** di DC-45 (tidak ada baris R08 di timing.csv, tidak ada keluaran di `sessions/`). Bukti proksi: setiap tulisan tersimpan melewati validasi server (semua revisi berasal dari respons 201/200); R15 COMPLETE + `missingRequired=[]` (L92, L145, L212); render 200 (L84, L144, L213); dan jumlah revisi = jumlah tulisan sukses (§4.8). Nilai: TIDAK-DAPAT-DIHITUNG, kemungkinan besar 0.
- G_B,4xx,i (respons 4xx berkode skema/kontrak): R1B 0. R2B 2, yaitu L124 cid bd5f2543 dan L125 cid 48968c03, keduanya SCHEMA_INVALID; L126 mencatat ulang panggilan L125 (cid sama, D-416) sehingga tidak dihitung dua kali. R3B 1, yaitu L206 cid 3b684687 dengan err_code kosong; kodenya menurut swalapor `R3B_stdout.txt:12` adalah SCHEMA_INVALID, dihitung sebagai galat skema (konservatif terhadap B). R3B L220 REGISTRY_KIND_UNKNOWN adalah galat parameter kueri registri, bukan kiriman kontrak, sehingga dilaporkan terpisah. Σ = 3, maks = 2.
- G_B,draft (dilaporkan saja): R1B 0 blok gagal (L61 gagal karena alat, MODULE_NOT_FOUND; L62 valid, rincian L91); W 5 blok gagal META_REQUIRED_FOR_CREATE (L10, tidak dinilai); R2B dan R3B tanpa draf.
- G_A,i: checker skrip controller tidak dijalankan. Analis memeriksa checklist protokol §4.3 secara manual atas tiga MD (status ada dan dalam set tertutup, owner, cardId, tanggal ISO, rujukan bukti, bab wajib CO-01..05):

| Laporan | Status | Owner | cardId | Tanggal ISO | Bukti | Bab wajib | G_A ketat / longgar |
|---|---|---|---|---|---|---|---|
| R1A | `complete (selesai) - vonis PASS` (r1a:12): bukan nilai set persis; kata pertama `complete` | r1a:8 ada | r1a:7 | tidak ada medan tanggal lapor; r1a:21 menyatakan tanggal tidak tercatat | r1a:19, :109 | Ringkasan :15, rincian :23/:44, bukti :107, isu+lanjut digabung :115 | 2 / 1 |
| R2A | `complete (pekerjaan verifikasi selesai)...` (r2a:11) | r2a:7 | r2a:6 | r2a:9 `2026-10-13` | tabel sha r2a:24-33 | Tanpa Ringkasan (bab 1 "Lingkup pekerjaan" :14); rincian :54; bukti :20/:101; isu :144; lanjut :148 | 2 / 0 |
| R3A | `SELESAI (complete). ... needs-review ...` (r3a:8): kata pertama di luar set; dua kode set bercampur | r3a:6 | r3a:5 | medan tanggal "tidak ada di sumber" (:9); waktu langkah `2026-10-31 11:28:12 +07:00` (:13-15, spasi, bukan pola skema) | r3a:75, :104, :120 | Tanpa Ringkasan; rincian :29; bukti :37; isu+lanjut :106 | 3 / 2 |

Σ G_A ketat 7, longgar 3.

Uji ambang: (a) G_B,stored = 0 KERAS: tidak terbukti. (b) Σ G_B,4xx = 3 <= 3 dan maks 2 <= 2: LULUS tepat di batas. Bila baris ganda L126 dihitung sebagai respons terpisah, maks menjadi 3 dan komponen ini GAGAL. Data penyimpangan menentukan hasil di sini. (c) Σ G_B < Σ G_A: dengan Σ G_B = stored + 4xx = 3, perbandingan LULUS bila checker ketat (3 < 7) dan GAGAL bila longgar (3 = 3). Dengan tafsir "deviasi tersimpan saja" (0 lawan 3..7), perbandingan LULUS.

Vonis KE-3: **TIDAK-DAPAT-DIHITUNG** sampai dry-run R08 atas 3 payload R20 dijalankan (U-13). Arah bukti: keunggulan format arm B nyata pada artefak tersimpan (0 lawan 3-7 pelanggaran checklist), tetapi pengiriman masih memicu 4xx di batas toleransi.

### 4.4 KE-4 Keberhasilan retrieval

Kunci: `answers/Q_key_resolved.md:21-32` (sha256 86a19765...efce dicatat D-416 sebelum kueri). Hasil: `retrieval.csv:L2-L11`. Analis membandingkan string id langsung (normalisasi: urut leksikografis; Q1/Q2/Q4 di tingkat dokumen sehingga sufiks `:baris` dibuang; Q3/Q5 di tingkat baris/pid). sha256 string ternormalisasi tidak dihitung ulang karena tanpa shell (celah G-5).

| Q | Arm A hasil = kunci? | Arm B hasil = kunci? | t_q A (retrieval.csv dur_s) | t_q B |
|---|---|---|---|---|
| Q1 | `r3a/laporan-kerja-R3.md:8` → dokumen = kunci: benar | `cmvvwaxl30107v1zgzfy2dv42` benar | 3,277 (L2) | 0,038 (L3) |
| Q2 | 3 berkas = kunci: benar | 3 documentId = kunci: benar | 0,015 (L5) | 0,031 (L4) |
| Q3 | r3a:70;83;92 = kunci: benar | 3 pid = kunci (urutan berbeda, himpunan sama): benar | 0,016 (L6) | 0,040 (L7) |
| Q4 | r2a:7 → dokumen = kunci: benar | `cmvvvvqhs00ikv1zg9x5hlqwm` benar | 0,016 (L9) | 0,032 (L8) |
| Q5 | `r1a/LAPORAN-KERJA-R1A.md:109` benar | `cmvvv85ug005mv1zgxx699f9l#p-zejwh52yrt` benar | 2,423 (L10) | 6,604 (L11) |

Presisi = recall = 1 untuk 10/10 pasangan kueri-arm. Skor B **5/5** dan A 5/5.

Syarat waktu: median t_q(B) = 0,038 s, median t_q(A) = 0,016 s, sehingga B > A dan syarat GAGAL. Dengan Σ dur_s timing.csv per kueri (L232-L244) median A 0,015, B 0,038: tetap GAGAL. Penanda START/END per kueri yang diminta rumus tidak ada. Sebagai sensitivitas, bila jeda sebelum aksi pertama tiap kueri dibebankan ke kueri itu (L231-L245), median A 5,070 s dan median B 4,668 s, sehingga B <= A. Ukuran ini bias urutan: arm kedua dalam satu pasangan memakai ulang pikiran arm pertama (Q3B 0,047 s, Q4A 0,035 s).

Catatan desain: D-404 mempersempit ruang cari arm A ke 3 berkas, bukan 15787 berkas yang diasumsikan protokol (`11:122`). Akibatnya syarat waktu kini hanya membandingkan latensi grep lokal dengan HTTP (selisih milidetik), bukan biaya cari. Keunggulan kualitatif B terlihat di catatan: Q2A perlu membaca kepala berkas untuk menafsirkan status (L5 catatan; baca kepala itu tidak berwaktu), Q1A menafsirkan "SELESAI (complete)".

Vonis: gerbang keras **LULUS**; KE-4 utuh **GAGAL** pada syarat waktu menurut rumus harfiah. Confidence MEDIUM.

### 4.5 KE-5 Jejak disk

D_raw,B (protokol §4.5: (a) kelas K2-K9; (b) berkas berisi payload `studio.*` / `"type": "contractRecord"` di luar format draf; (c) MD laporan bukan draf; ditambah aturan brief `:58` bahwa berkas `.json` kiriman tersimpan = mentah):

| Run | Berkas | Kategori | Bukti | Hitung |
|---|---|---|---|---|
| R1B | `r1b/draf-lapkerja-r1b.md` | draf sah (lolos draft-check, L62/L91) | `disk_R2B_pre.txt:4` | 0 |
| R1B | `Temp/hermes_trial/r1b_scratch/draftcheck_b2.json` | (b): keluaran draft-check yang memuat payload `contractRecord` utuh (`:18-85`) | Read berkas; TIDAK tercatat di timing.csv; bertentangan dengan `format_R1B.txt:12` ("tidak pernah disimpan sebagai .json") | 1 (menurut (b)); 0 menurut aturan brief (bukan badan kiriman) |
| R2B | `scratch_r2b/s1_record.json`, `s1_ch1..5.json`, `s2_record.json`, `s2_ch2..4.json`, `s3_record.json`, `s3_ch1..5.json` | (b) + aturan brief | L160-L175; Grep `contractRecord\|studio.(slot\|chapter)/v2` = 16 berkas `.json` | 16 |
| R2B | `scratch_r2b/render_body.json` | aturan brief (badan kiriman `.json`, bukan payload kontrak) | L176 | +1 menurut brief |
| R2B | 24 berkas `*.body` di `scratch_r2b/` (respons curl, termasuk `s2get.body`, `s3get.body` = salinan R20 submission) | abu-abu: dump respons yang memuat string `studio.*` | Grep yang sama | belum diklasifikasi per berkas (celah G-6) |
| R3B | `Temp/r3b_body.out` | abu-abu: dump respons R05 dokumen 012 (memuat `contractRecord`) | Grep `^.{0,300}` | 1 menurut (b) harfiah; 0 menurut brief |

Nilai: D_raw,R1B = 0..1, D_raw,R2B = 16..17 (minimum yang tidak bisa diperdebatkan: 16), D_raw,R3B = 0..1. Vonis **GAGAL** pada semua tafsir, karena R2B > 0. Penyebab yang masuk akal: panduan sendiri menyuruh `record.json` (`STUDIO-AGENT-GUIDE.md:1875-1881`), dan R2B memakai curl dengan berkas karena jalur `-o` MSYS gagal (L150, L152).

F_name: nama unduhan W/R1B/R2B/R3B (`disk_R3B_post.txt:3,6,7,8`) diuji terhadap regex blueprint `^[A-Za-z0-9.-]{1,80}_rev[1-9][0-9]*_[0-9]{8}T[0-9]{6}Z_[0-9a-f]{8}\.(docx|pdf|html)$`. Contoh `010-GSP-LAP-X-2026_rev16_20261031T035408Z_9b79178c.html`: prefiks 18 karakter sah, `_rev16_`, stempel 8+T+6+Z, sha8 heksa, `.html`. Hasil 3/3 = **100%**.

F_sha: sha8 nama = 8 heksa awal sha256 snapshot = sha16 timing. R1B `9b79178c` = `9b79178cb89e...` (`disk_R1B_post.txt:2`, L87), HEAD verified true. R2B `f7cda103` = `f7cda10334...` (`disk_R2B_post.txt:6`, L148 `verified=true; sha_lokal_sama=True`). R3B `6489a23a` = `6489a23ad2e6...` (`disk_R3B_post.txt:7`, L215). Hasil 3/3 = **100%**. Catatan data: L87 mencatat `bytes=0` untuk unduhan R1B, padahal snapshot berikutnya menunjukkan 2.625.598 B (`disk_R2B_pre.txt:3`). Itu galat pencatatan, bukan berkas kosong.

Baseline arm A: 1 MD laporan per run (`disk_R3B_post.txt:2,5`; r3a dari L230), ditambah skrip bantu di Temp (`s2_r2a.py`, `s3_r2a.py` disebut L111 tetapi tidak terdaftar sebagai baris; `ab_r3a/*.py` 7 berkas).

### 4.6 KE-6 Beban pikir format

FD (10 dimensi protokol §4.6) dinilai analis dari aturan arm dan swalapor `format_<run>.txt`, berlabel swalapor:

| Dimensi | R1B | R2B | R3B | Arm A (R1A/R2A/R3A) |
|---|---|---|---|---|
| F1 nama berkas | mesin | mesin | mesin | diputuskan (R1A #1, R2A #9, R3A #1) |
| F2 lokasi | brief | brief | brief | brief (subfolder run): tidak dihitung |
| F3 bentuk kepala | slot record | slot record | slot record | diputuskan (tabel lawan kv: R1A #2, R2A #2, R3A #2) |
| F4 nama kunci | skema | skema | skema | diputuskan |
| F5 kosakata status | registri (R1B #1) | registri | registri | diputuskan (R1A #4, R2A #4, R3A #4) |
| F6 kosakata vonis | registri | registri | registri | diputuskan atau ikut sumber |
| F7 struktur/urutan bagian di dalam bab | diputuskan (#3) | diputuskan (#1-#5, #9) | diputuskan (#1-#6, #11) | diputuskan |
| F8 bentuk rujukan bukti | `evidence[]` sesuai §17.4 | skema (`note` objek, #8) | diputuskan sebagian: `ref` path absolut bebas (#10) | diputuskan (R3A #7) |
| F9 notasi kartu | pola | pola | pola | dari lembar fakta: tidak dihitung |
| F10 tanggal | pola | pola | pola | diputuskan (R3A #5, R2A #7) |
| FD | **1** | **1** | **2** | 8 / 8 / 8 |

FL (baris `read` ber-`note` format_lookup antara START dan END; W tidak dihitung): R1B 5 (L55-L59, dicatat pada detik START walau dibaca sebelumnya), R2B 3 (L117, L118, L151), R3B 2 (L186, L194). Median **3**. Arm A: 0 / 0 / 0 (L106-L107 "bukan format_lookup"; `format_R1A.txt:12` "nol lookup eksternal"). Probe registri R3B L220 (400) tidak berlabel format_lookup. Bila dihitung, R3B = 3 dan median tetap 3.

Vonis: FD_B <= 2 pada 3/3 (LULUS); median FL_B 3 > median FL_A 0 (GAGAL). KE-6 **GAGAL**. Catatan desain: run pemanasan W tidak dapat menyerap biaya onboarding, karena setiap run memakai sesi baru tanpa memori (protokol `11:284`). Setiap run B membaca ulang panduan, yang terlihat pada FL 5/3/2 dan pra-START B 571,7 s lawan A 304,9 s. Selain itu, R2B menemukan bentuk `items` lewat galat 400 (`format_R2B.txt:28-31`), yaitu beban format yang tidak tertangkap oleh FD statis.

### 4.7 KE-7 Kelengkapan bagian wajib

- K_B: R15 `COMPLETE`, `missingRequired=[]`, `fullRenderAllowed=true` untuk R1B (L83 + rincian L92), R2B (L143, L145), dan R3B (L212). Render penuh 200 pada ketiganya (render ditolak 409 bila tidak lengkap, protokol `11:171`). K_B = **100% 3/3**. Cek silang dengan checker controller tidak dijalankan.
- K_A (baseline, elemen wajib register: status dalam set, `reportedAt`, CO-01..05 = 7): R1A 5/7 = 71,4% ketat, 6/7 = 85,7% longgar; R2A 4/7 = 57,1% ketat, 7/7 = 100% longgar; R3A 4/7 = 57,1% ketat, 5/7 = 71,4% longgar (rincian di tabel §4.3).
- KF (kelengkapan fakta per id lembar fakta): **tidak dihitung**. Pencocok string-kunci per fakta tidak dijalankan di DC-45. Lembar fakta berbentuk prosa bernomor tanpa string-kunci beku (`facts/R-1.md:5-17`), sehingga pencocokan butuh daftar token kunci dari manifest. Swalapor R1A L104 "124 token kunci fakta tetap utuh" tidak dipakai sebagai bukti (aturan 8.6).

Vonis: gerbang keras **LULUS**; KE-7 utuh **TIDAK-DAPAT-DIHITUNG** (KF_B = 100% dan KF_B >= KF_A belum terbukti).

### 4.8 MU-1 dan MU-2 (register 05 §19.3)

- MU-1 (SQL `count(*)` revisi, `count(DISTINCT createdBy)` per dokumen kontrak): SQL tidak dijalankan (tanpa akses DB; DC-45 hanya memanggil R05/R20). Proksi revisi dari `docs_b.csv:2-5`: W 15, R1B 16, R2B 16, R3B 16. Proksi ini diverifikasi silang dengan jumlah tulisan 2xx di timing.csv: R1B = 1 record buat + 5 bab + (1 + 3) S2 + (1 + 5) S3 = 16. R2B = 1 + 4 + 1 (bab 5 sukses L127) + 4 + 6 = 16, dengan `base6` (L129) dan `base10` (L134) cocok. R3B = 1 + 5 + 4 + 1 + 4 + 1 (bab 3 ulang L209) = 16. W = 1 (L12, dokumen tercipta walau tercatat BAD_RESP, L51) + 5 + 3 + 6 = 15, dengan `baseRevisionNo` 6..14 berurutan (L23-L39). Proksi pelaku: `lastFilledBy_record` = `lastFilledBy_content` = `agent:hermes-gsp-master01` pada 4/4 dokumen. Itu hanya pelaku terakhir per slot, bukan `DISTINCT createdBy` seluruh revisi.
- MU-2: porsi actors = 1 (proksi) 3/3 = 100% (4/4 dengan W); median revisi 16. Pembanding KE-5: laporan MD baru di workspace Hermes selama uji: arm A 3 (`r1a`, `r2a`, `r3a`); arm B 0 laporan (catatan END L88, L179, L216) ditambah 2 draf (`w/draf-w.md` yang gagal draft-check sehingga mentah menurut definisi protokol walau W tidak dinilai, dan `r1b/draf-lapkerja-r1b.md` yang sah).
- Keterbatasan: brief mewajibkan `agentId: hermes-gsp-master01` di setiap badan (`04_contract_trial_brief.md:17`), dan `agentId` hanya label (KD-45, register `:144`). MU-1/MU-2 dalam uji ini tidak dapat membedakan patuh dari tidak patuh U-3. Butuh uji dengan dua agen berbeda.

Vonis: **TIDAK-DAPAT-DIHITUNG persis**; proksi dilaporkan.

## 5. Penyimpangan data D-416 dan dampaknya pada vonis

| Butir D-416 | Dampak terukur | Pengaruh vonis |
|---|---|---|
| (a) session_id `s-<run>` | Id nyata ada di `usage_<run>.json` | Tidak ada |
| (b) Baris dicatat surut dengan waktu estimasi atau kosong (W L3-L7, L52; R1A L94-L96, L102-L103; R2B L116-L118, L126, L150, L152-L177; R3B L185, L220) | KE-2 ketat membuang baris tanpa waktu (A turun lebih banyak, rasio naik); fase R3B S1 179,8 s tidak dapat dipisah; START ditulis sesudah bacaan | KE-1 dan KE-2 tetap GAGAL pada semua definisi (§4.1.2, §4.2) |
| (c) R1A menyunting gaya sesudah END (L104) | T_R1A tidak memuat kerja mutu sesudah END (pasca-END R1A 133,2 s); kunci Q memakai versi sesudah suntingan (sha 149ca5d9), konsisten dengan disk | Bias menguntungkan A di KE-1; vonis tidak berubah |
| (d) Kolom R2A seq4-5 bergeser, dikoreksi di L112-L113 | T_R2A memakai t_end END (L111) karena t_start kosong; t_start S2 perkiraan 1793419320,000 | Tidak ada (T bergantung pada START/END saja) |
| (e) R2B menyimpan `.json` kiriman di scratch | 16 berkas payload (+1) | **Menentukan**: KE-5 GAGAL |
| (f) W melihat nama folder answers/queries | `Q_key` 0 kali di state.db (laporan 04 `:4`) | Tidak ada pada KE-4 |
| (g) Snapshot `disk_W_post`, `disk_R1B_{pre,post}` tanpa byte | sha tetap ada; byte R1B diambil dari `disk_R2B_pre.txt:3`. Yang lebih besar: cakupan snapshot tidak memuat Temp, sehingga mentah di scratch (R1B, R2B, R3B) tidak terlihat oleh metode controller | F_name/F_sha tetap 100%; D_raw hanya terdeteksi lewat swalapor R2B dan Glob analis (celah ukur, U-10) |
| (h) Hermes menghitung 244 baris, berkas 245 data + header | Angka CSV dipakai | Tidak ada |
| Tambahan analis: L87 `bytes=0` | Galat catat | Tidak ada |
| Tambahan analis: L126 baris ganda cid 48968c03 | Bila dihitung, maks G_B,4xx = 3 | KE-3 komponen 4xx berubah dari LULUS-batas menjadi GAGAL |
| Tambahan analis: `draftcheck_b2.json` R1B tidak tercatat | Swalapor `format_R1B.txt:12` keliru | KE-5 D_raw,R1B 0..1 |

## 6. Umpan balik Hermes (swalapor, `sessions/Q_stdout.txt:44-63`)

Friksi menurut urutan kerugian versi Hermes, dengan bukti CSV dari analis:
1. POST chapters 400 SCHEMA_INVALID berulang dan tidak ada contoh payload bab. Bukti: L124-L126 (R2B, `items` harus objek), L206 (R3B, err_code kosong). Biaya R2B: galat 20,0 s, ditambah selang format-lookup 88,4 s sebelum kiriman pertama.
2. draft-check: META_REQUIRED_FOR_CREATE (W L10) dan keluaran rc=1 sulit diurai (R1B L61, sebenarnya MODULE_NOT_FOUND karena `npx tsx` dijalankan dari luar repo). Biaya: W 57,6 s, R1B 9,5 s.
3. curl Windows menolak path MSYS pada `-o/-D`, exit 23 (R2B L150, L152). Akibatnya cid hilang dan waktu ditaksir dari mtime.
4. Beban baca §17 + registri sebelum aksi pertama: FL_B 5/3/2, R2B baca 114,3 s di jendela, pra-START B 571,7 s lawan A 304,9 s.
5. R21 `matchedItems` kosong (Q1B, retrieval.csv L3). Penyebabnya semantik: kolom itu mencocokkan `items[].key = cardId` (`contracts.ts:11-12`).
6. Aturan "note tanpa koma" rapuh (R1A dan Q harus membangun ulang baris).

Vonis V-1 (kutipan, `Q_stdout.txt:55-57`): "Belum layak menggantikan MD sepenuhnya ... Untuk pembacaan arm B unggul ... Syarat sempit: (1) nol-kejut kirim, registri berisi contoh payload per bab dan setiap 400 membawa err_code; (2) pembungkus CLI satu perintah dari draf MD sampai unduh; (3) draft-check ramah." Vonis ini tidak bertentangan dengan metrik: penulisan TIDAK EFEKTIF, retrieval unggul secara kualitatif, dan 5/5. Kedua hal disajikan ke USER apa adanya (protokol §4.9).

## 7. Key Findings (Confidence / Evidence / Implication)

| # | Temuan | Confidence | Evidence | Implication |
|---|---|---|---|---|
| KF-1 | Arm B 4,1-7,1x lebih lambat per pasangan (median 4,179), dan tetap 1,7-3,5x pada waktu sesi penuh | HIGH | §4.1.1-4.1.2; timing.csv L53/L88, L93/L100, L105/L111, L114/L179, L184/L216, L221/L230; `*_meta.txt` | KE-1 gagal kokoh; tidak ada definisi waktu yang membalik vonis |
| KF-2 | 58% waktu B habis menyusun payload; server hanya 1,1-2,8% | HIGH (total) / MEDIUM (atribusi) | §4.1.3 | Perbaikan harus mengurangi kerja generate JSON (CLI dari draf MD, contoh siap pakai), bukan mempercepat server |
| KF-3 | Biaya B terpusat pada komposisi pertama (S1); pembaruan R-3 malah 0,925x A | MEDIUM | §4.1.3 (S2+S3 B 61,645 s lawan A 66,663 s) | Jalur update lewat R20 shape=submission sudah efisien; fokus perbaikan pada pembuatan |
| KF-4 | KE-5 gagal: 16 payload `.json` di scratch R2B; salinan payload tak tercatat di R1B; dump respons R3B | HIGH | L160-L175; `r1b_scratch/draftcheck_b2.json:18-85`; `Temp/r3b_body.out` | Gerbang keras gagal, vonis TIDAK EFEKTIF; panduan §17.4:1875-1881 ikut mendorong pola `record.json` |
| KF-5 | "400 tanpa err_code" dan "tanpa cid" adalah cacat pengurai klien, bukan server | MEDIUM (hipotesis dari kode, log server belum dicek) | `errors.ts:43-51`, `contract/errors.ts:142-144`, `context.ts:40-42`; `R3B_stdout.txt:12` | Syarat Hermes (1b) kemungkinan sudah terpenuhi di server; yang perlu diubah adalah dokumentasi bentuk galat dan klien/CLI |
| KF-6 | Retrieval 5/5 di kedua arm; syarat waktu kehilangan makna setelah penyempitan D-404 | HIGH (skor) / MEDIUM (waktu) | §4.4 | Keunggulan B ada pada struktur jawaban (status/owner/pid), bukan latensi; protokol perlu mengganti syarat waktu |
| KF-7 | Beban baca format B tidak terserap pemanasan karena sesi baru tanpa memori | HIGH | FL 5/3/2 lawan 0; pra-START | Butuh resep ringkas atau CLI agar bacaan per sesi mendekati nol |
| KF-8 | Format tersimpan B konsisten (status set tertutup, 5 bab, K_B 100%), sedangkan A 3-7 pelanggaran checklist | MEDIUM (A diperiksa manual) | §4.3 tabel; r1a:12, r2a:11, r3a:8 | Nilai keandalan B nyata, tetapi dibayar dengan waktu |
| KF-9 | MU-1/MU-2 tidak diskriminatif karena satu agentId dipaksa | HIGH | brief `:17`; `docs_b.csv` | U-3 belum teruji; perlu uji multi-agen |

## 8. Files/Modules Involved

| Berkas/area | Peran dalam temuan | Penulis/pemilik |
|---|---|---|
| `docs/STUDIO-AGENT-GUIDE.md` §17.4 (`:1842-1913`), §17.7, §17.9, §17.13 | Pola `record.json`, tidak ada contoh list/table, bentuk galat tidak disebut di §17 | pelaksana DOC-FIX (panduan) |
| `src/lib/studio/registry/contracts.ts` (`CONTRACT_KIND_DEFS`), `src/app/api/studio/registry/route.ts` | Respons R03 `kind=contracts`; 400 tanpa `kind` | coder-execution |
| `scripts/studio/draft-check.ts` | META_REQUIRED_FOR_CREATE pada blok bab draf; `--json` menggemakan payload; dijalankan dari luar repo gagal | coder-execution |
| `scripts/studio/` (CLI baru) | Pembungkus satu perintah draf MD → unduh (syarat Hermes 2) | coder-execution |
| `src/lib/studio/services/query/contracts.ts` (`matchedItems`) | Semantik R21 | coder-execution (atau DOC-FIX bila hanya dokumentasi) |
| `research/11_contract_efficiency_protocol.md` dan brief `hermes_trial/04_*` | START oleh harness, snapshot memuat Temp, quoting RFC 4180, syarat waktu KE-4, KF | data-analyst (revisi DC-03), DC-44 |
| Prosedur DC-45 (controller) | R08 dry-run, pencocok KF, SQL MU-1 | controller / test-expert |

## 9. Usulan perbaikan berpemilik (baris baru), berprioritas

Setiap baris: area + perubahan + metrik yang diharapkan membaik. Target angka diberi label hipotesis dan baru sah setelah uji ulang.

| ID | Prioritas | Friksi/temuan | Pemilik | Berkas/area | Perubahan | Metrik yang diharapkan membaik |
|---|---|---|---|---|---|---|
| U-01 | P1 | Syarat Hermes 2; KF-2; friksi 3, 4; harness R2B 55 s | coder-execution | `scripts/studio/studio-report.ts` (baru), memakai ulang pengurai draft-check dan klien HTTP | `submit <draf.md>`: blok 1 → R13 buat, blok bab → R12, lalu R15, R17 (HTML), R10 + HEAD verify; cetak documentId, revisionNo, sha16, nama final. `update <docId> <draf.md>`: R20 basis + `baseRevisionNo` otomatis. Badan hanya di memori/stdin, tanpa curl dan tanpa berkas. Galat dicetak `code` + cid. `--timing <csv>` menambah baris 20 kolom berwaktu mesin | KE-5 D_raw → 0 by construction; harness → 0; galat CURL → 0; KE-2 N_B turun (hipotesis: <= 2x A); KE-1 fase susun + kirim turun |
| U-02 | P1 | KF-4; panduan bertentangan dengan brief | pelaksana DOC-FIX | `STUDIO-AGENT-GUIDE.md:1875-1881` | Ganti contoh `--data-binary @record.json` dengan pipa stdin (`draft-check --emit n \| curl --data-binary @-`) atau U-01; tambah kalimat "jangan simpan badan kiriman atau keluaran draft-check `--json` sebagai berkas" | KE-5 D_raw → 0 |
| U-03 | P1 | Syarat Hermes 1a; friksi 1; R2B 400 x2 + 88,4 s lookup | coder-execution | `src/lib/studio/registry/contracts.ts` + R03 `kind=contracts` | Tambah `examples.chapters[1..5]`: badan `studio.chapter/v2` sah per chapterKey dengan blok paragraf, list (`items: [{text}]`), table (`cells: [{text}]`); uji unit: setiap contoh lolos R08 dry-run | G_B,4xx bentuk blok → 0; FL_B turun; fase baca + susun S1 turun |
| U-04 | P1 | Syarat Hermes 1b; KF-5; cid 3b684687 | controller (cek), pelaksana DOC-FIX | Log server (apiLog) untuk cid 3b684687-59df-408a-a65d-f116efeb295d; panduan §17.13 | Pastikan respons membawa `code: SCHEMA_INVALID` dan header cid. Bila terbukti, catat syarat 1b "sudah terpenuhi server" dan tulis di §17.13 bentuk galat `{ error: <pesan>, code, details }` (yang dibaca `code`, bukan `error.code`; rujuk `:1506`). Bila tidak terbukti, buka baris perbaikan server | Baris 4xx ber-err_code di timing → 100%; baris tanpa cid → 0 |
| U-05 | P2 | Syarat Hermes 3; friksi 2; W 57,6 s, R1B 9,5 s | coder-execution | `scripts/studio/draft-check.ts` | (a) Simulasi berurutan: blok bab sesudah blok buat bertarget `mission+docKey` yang sama dianggap menarget dokumen yang akan dibuat (tidak lagi META_REQUIRED_FOR_CREATE); (b) `--json` selalu mencetak JSON, termasuk galat fatal `{fatal:{code,message}}` saat rc != 0; (c) dapat dijalankan dari cwd mana pun (resolusi tsconfig paths atau entri `bin`); (d) `--json` tanpa payload secara bawaan (`--with-payload` opt-in) | galat+pulih → 0 pada jalur draf; CLI_RC_1 → 0; D_raw salinan draft-check → 0 |
| U-06 | P2 | Friksi 4; KF-7 | pelaksana DOC-FIX | `STUDIO-AGENT-GUIDE.md` §17 awal | "Resep satu halaman" R03 → R13 → R12 → R15 → R17 → R10 dengan satu contoh ujung-ke-ujung (atau satu perintah U-01), supaya agen sesi baru cukup membaca satu subseksi | FL_B → <= 1; pra-START B mendekati A |
| U-07 | P2 | REGISTRY_KIND_UNKNOWN tanpa kind (R3B L220) | coder-execution | `src/app/api/studio/registry/route.ts` | `GET /api/studio/registry` tanpa `kind` → 200 indeks kind + tautan contoh, atau 400 yang memuat daftar kind sah dan contoh kueri (`details`); sesuaikan `dc28-registry-contracts.test.ts:91` | Probe 400 → 0 |
| U-08 | P3 | Friksi 5; Q1B | pelaksana DOC-FIX (minimal) atau coder-execution | panduan §17.7; `services/query/contracts.ts:11-12,169` | Dokumentasikan bahwa `matchedItems` = butir `items[].key = cardId`; opsi kode: tambah `matchedBy: "cardIds"\|"items"` | Salah tafsir R21 → 0 (kualitatif V-1) |
| U-09 | P2 | Friksi 6; D-416 (b), (d) | data-analyst (revisi protokol 11 §5) + DC-44 | protokol §5.1, brief `:72-83` | CSV RFC 4180 (kutip, koma boleh di note); pencatat dipegang harness controller (U-01 `--timing` atau driver), bukan skrip per sesi | Baris estimasi/kosong → 0; baris koreksi → 0 |
| U-10 | P1 (prasyarat uji ulang) | Celah ukur KE-5 (D-416 g) | controller | Prosedur DC-45 | Snapshot pre/post mencakup `%TEMP%` dan `Temp/hermes_trial/*` dengan byte + sha; Grep `contractRecord\|studio.(slot\|chapter)/v2` pasca-run | D_raw terdeteksi mekanis, tidak bergantung swalapor |
| U-11 | P1 (prasyarat uji ulang) | Penyimpangan START (§4.1.2) | data-analyst (revisi protokol 11 §4.1/§5.2) | protokol | START = `start_utc` meta harness (atau pesan pertama), END = penanda Hermes; laporkan pra-START per run | KE-1 sebanding antar-arm |
| U-12 | P2 | KE-4 waktu tidak bermakna | data-analyst | protokol §4.4 | Ganti syarat waktu dengan "langkah + baca tambahan per kueri" atau kembalikan ruang cari A ke workspace penuh pada kueri status/owner | KE-4 mengukur biaya cari yang sebenarnya |
| U-13 | P1 (penutup DC-46) | KE-3 stored, KE-7 KF, MU-1 tak dihitung | controller / test-expert | 3 dokumen R1B/R2B/R3B | (a) Kirim ulang dry-run R08 untuk payload R20 `shape=submission` per slot/bab (sumber `sessions/key_resolution/*_content.json`); (b) pencocok token kunci per fakta (daftar token dari manifest `04_contract_trial_facts_manifest.md`) untuk 6 laporan; (c) jalankan SQL §19.3 di DB DEV (baca saja) | KE-3 dan KE-7 dapat divonis; MU-1 persis |
| U-14 | P3 | KF-9 | controller / DC-44 | Brief uji berikutnya | Satu skenario dengan dua `agentId` (owner + agen lain menyunting) | MU-1/MU-2 diskriminatif terhadap U-3 |

Tiga usulan teratas: U-01 (CLI `studio-report submit/update --timing`), U-02 + U-03 (panduan tanpa `record.json` dan contoh payload per bab di registri), U-05 (draft-check ramah). Ketiganya memenuhi tepat tiga syarat sempit Hermes. U-10, U-11, dan U-13 wajib selesai sebelum uji ulang agar vonis berikutnya tidak lagi bergantung pada swalapor.

## 10. Asumsi dan celah (Tier 1)

| ID | Asumsi/celah | Dampak bila keliru |
|---|---|---|
| AS-1 | Basis epoch 1793404800 untuk 2026-10-31T00:00Z | Dicek silang dengan W (START 161,6 s sesudah awal sesi, laporan 04 `:1`); bila keliru, hanya §4.1.2 baris 2 yang bergeser |
| AS-2 | Baris R3B L206 (err_code kosong) dihitung galat skema | Bila tidak dihitung: Σ G_B,4xx = 2 (vonis komponen 4xx tetap LULUS) |
| AS-3 | Atribusi jeda ke aksi berikutnya mewakili fase kerja | Persentase fase bisa bergeser antar baca/susun (R2B 88,4 s, R3B 179,8 s); total per run tidak berubah |
| AS-4 | `draftcheck_b2.json` dan `r3b_body.out` diklasifikasi menurut (b) protokol | Pada tafsir brief saja, D_raw R1B = R3B = 0; KE-5 tetap GAGAL karena R2B |
| AS-5 | Penilaian FD dan checklist G_A/K_A dilakukan manual oleh analis dari swalapor/MD | Nilai bisa bergeser 1 butir; FL yang menentukan KE-6 dihitung mekanis |
| G-1 | n = 3, deskriptif | Confidence MEDIUM |
| G-2 | R08 dry-run tidak dijalankan | KE-3 tidak dapat divonis (U-13a) |
| G-3 | Pencocok KF tidak dijalankan | KE-7 utuh tidak dapat divonis (U-13b) |
| G-4 | SQL MU-1 tidak dijalankan | MU hanya proksi (U-13c) |
| G-5 | sha256 kunci ternormalisasi tidak dihitung ulang (tanpa shell) | Kecocokan KE-4 dinilai lewat perbandingan string langsung; controller dapat mengulang dengan `printf %s <id> \| sha256sum` lawan `Q_key_resolved.md:23-32` |
| G-6 | 24 berkas `*.body` R2B belum diklasifikasi per berkas | D_raw R2B bisa lebih dari 17 menurut (b); vonis tidak berubah |
| G-7 | Log server (apiLog) untuk cid 3b684687 belum diperiksa | KF-5 tetap hipotesis (U-04) |

## 11. Risks

| # | Risiko | Mitigasi |
|---|---|---|
| RK-1 | Perbaikan CLI menutupi biaya generate JSON tanpa menurunkannya (agen tetap menulis JSON panjang) | U-01 menerima draf MD + konversi (jalur `md/v1` §5.6), lalu uji ulang mengukur token keluaran (usage) |
| RK-2 | Uji ulang kembali bergantung pada swalapor | U-09, U-10, U-11 sebagai prasyarat |
| RK-3 | Ambang KE-1 0,70 tidak realistis bila komposisi isi dominan di kedua arm | Disajikan ke USER sebagai keputusan (protokol G-2); data menunjukkan pembaruan B sudah setara A (KF-3) |
| RK-4 | Menafsirkan KE-4 waktu sebagai kemenangan A | Dilaporkan bersama catatan desain D-404 dan sensitivitas |

## 12. Acceptance Criteria (DC-46 `:333`)

- [x] Setiap angka dikutip dari timing.csv (nomor baris), retrieval.csv, docs_b.csv, snapshot, meta, atau usage (§4).
- [x] Vonis per ambang KE-1..KE-7 dengan alasan (§0, §4); TIDAK-DAPAT-DIHITUNG disertai sebab dan perintah penutupnya (U-13).
- [x] Gerbang keras dinilai dengan bukti (§0).
- [x] Penyimpangan D-416 diperlakukan tanpa memperbaiki data; dampak per butir (§5).
- [x] Waktu arm B dipecah per fase (§4.1.3).
- [x] Friksi Hermes dipetakan ke usulan berpemilik, termasuk lima syarat yang diminta controller: contoh payload per bab (U-03), err_code pada setiap 400 cid 3b684687 (U-04), CLI draf MD ke unduh (U-01), draft-check ramah (U-05), REGISTRY_KIND_UNKNOWN tanpa cid (U-07 + U-04) (§9).

## 13. Recommendations

1. Controller mencatat vonis TIDAK EFEKTIF (KE-5 gagal keras; KE-1, KE-6 gagal) beserta vonis V-1 Hermes di `decisions/decisions.md`, lalu menyajikannya ke USER tanpa didamaikan. Keduanya searah: penulisan B belum hemat, sedangkan pembacaan B unggul.
2. Jalankan U-13 (R08 dry-run, pencocok KF, SQL MU-1) sebagai penutup DC-46 agar KE-3 dan KE-7 punya vonis. Ini kerja mekanis tier D yang dapat diverifikasi.
3. Serahkan U-01..U-08 ke pm-planner sebagai baris perbaikan; prioritas P1: U-01, U-02, U-03, U-04. Uji ulang (maksimal 3 siklus per kriteria) hanya setelah U-09, U-10, U-11 diterapkan pada protokol dan brief.
4. Sebelum uji ulang, minta USER memutuskan apakah ambang KE-1 tetap 0,70 untuk keseluruhan run atau dipisah: komposisi pertama dan pembaruan. Data menunjukkan pembaruan sudah 0,925x pada R-3, sementara komposisi pertama 2,1-5,9x.

## 14. Collection Log (analis)

1. Read protokol 11 (393 baris), blueprint 07 (Grep DC-46, §3.2), register 05 §19.3 dan §4.2-§5.3, decisions D-362/D-404/D-411..D-416, brief 04, laporan uji 04.
2. Read timing.csv utuh (L1-L246), retrieval.csv, docs_b.csv, Q_key_resolved.md, format_{R1A,R1B,R2A,R2B,R3A,R3B}.txt, `*_meta.txt` (7), `usage_*.json` (7), disk_R1B_{pre,post}, disk_R2B_{pre,post}, disk_R3B_post, Q_stdout.txt, R3B_stdout.txt, `facts/R-1.md:1-25`.
3. Read tiga MD arm A (r1a 124 baris, r2a 155, r3a 123).
4. Glob folder Temp/hermes_trial dan Temp `r3b_*`; Grep `contractRecord|studio.(slot|chapter)/v2` di r1b_scratch, scratch_r2b, w_run, ab_r3a, `r3b_*`; Read `draftcheck_b2.json`.
5. Grep kode repo (baca saja): registry/route.ts, http/errors.ts, contract/errors.ts, http/context.ts, draft-check.ts, query/contracts.ts; Read panduan §17.4 (`:1842-1916`) dan `:1055-1067`.
6. Tidak ada penulisan selain berkas ini. Tidak ada shell; semua aritmetika manual dan dapat diulang dari baris yang disebut.
