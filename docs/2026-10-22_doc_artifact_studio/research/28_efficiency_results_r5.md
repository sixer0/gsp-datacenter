---
schema_version: 1.0
task_id: doc_artifact_studio
task_row: ANALYSIS-R5 (hasil uji putaran 5 dan 5b; protokol research/27_efficiency_protocol_r5.md yang mewarisi research/17 §6.6-§6.9 dan §7.5-§7.8; keputusan D-422, D-520..D-543)
date: 2026-11-03
agent: coder-execution (baris analisis; semua angka dihitung ulang dengan skrip baca-saja)
type: performance
confidence: MEDIUM untuk U-REP (n = 3 pasangan per ronde; waktu, langkah, token, galat server, retrieval, KF, asal-usul dihitung mekanis); LOW-MEDIUM untuk U-DOC (1 pasangan utama + 1 perluasan per ronde; DA/DA2 r5b = data r5, D-538; mutu dari docxcheck baris ini + datum_lint + inspeksi PNG)
inputs: research/27 (utuh), research/17 §6-§7, research/26 (metode r4), verification/12 (L-1..L-8), decisions.md D-520..D-543, brief hermes_trial/10_r5_*.md dan 11_r5b_*.md; data BACA SAJA Temp/hermes_trial/contract_ab5{,b}/, doc_ud2{,b}/, controller_ab5{,b}/ (toolcalls, mcpcalls, answers, ke3_dryrun), folder run Hermes 2026-11-03_hermes-contract-ab5{,b}/ dan -doc-ud2{,b}/, salinan state.db (+wal) di analysis_r5/statedb/
tools: skrip Python stdlib (+PIL untuk crop PNG) di Temp/hermes_trial/analysis_r5/ (daftar §13); harness_ab5{,b}/ab4.py phases dijalankan dengan --out ke analysis_r5/phases/ (tidak menulis ke sessions/); datum_lint skill datum-house-style atas salinan DOCX bernama asli; tanpa git, tanpa tulis DB, tanpa panggilan DEV, berkas rahasia tidak dibaca
plan_draft: dilewati (baris analisis docs-only; usulan di §10)
status: complete
---

# ANALYSIS-R5: Hasil uji efisiensi putaran 5 dan 5b (jalur tulis minimal Studio lawan Markdown dan builder lokal)

Konvensi: angka desimal memakai koma; detik relatif terhadap START harness kecuali disebut lain. Sumber `a5/<berkas>` = `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/analysis_r5/<berkas>` (keluaran skrip baris ini). `tc:<rnd>:<RUN>` = `controller_ab5{,b}/toolcalls/<RUN>_toolcalls.csv`; `mcp:<rnd>:<RUN>` = `controller_ab5{,b}/mcpcalls/<RUN>_mcpcalls.csv` (log server: `ok`, `code`, `durationMs`); `sdb` = salinan baca-saja `state.db` di `a5/statedb/`. "r5b" memakai DA/DA2 r5 (D-538), sehingga pasangan U-DOC r5b = DB/DB2 r5b lawan DA/DA2 r5.

## 0. Ringkasan vonis

### 0.1 Vonis per ronde per uji

| Uji | r5 | r5b | Alasan inti |
|---|---|---|---|
| U-REP (laporan kerja, 3 pasangan) | **NETRAL (keputusan USER)** | **NETRAL (keputusan USER)** | Keempat gerbang KERAS lulus di kedua ronde (G_B,stored 30/30, retrieval B 5/5, D_raw,B 0, K_B 3/3); KE-1 gagal kedua bagian di kedua ronde (r5: median r1 2,185, median r2 7,689, maks 15,057; r5b: 1,511 / 4,190 / 4,444) |
| U-DOC (dokumen klien, DB lawan DA) | **LEBIH BURUK** | **LEBIH BURUK** | Gerbang KERAS UD-2 arm B gagal di kedua ronde: Q1a 50/53 (r5) dan 46/53 (r5b) < 99% karena judul bab/subbab sumber diubah mesin (r5 "CHAPTER 4" + "4.1 1.1"; r5b FM disarangkan ke bab 1, subbab 1.1-1.4 menjadi 1.4-1.7); r5 juga gagal UD-6 bacaan ketat (59 berkas `_probe` di sandbox). UD-1a LULUS di kedua ronde (0,402 dan 0,269) |
| U-DOC perluasan (DB2 lawan DA2, informatif) | LEBIH BURUK | LEBIH BURUK | Q1a sama dengan pasangan utama; r5 DB2 Gambar 6.1 S2 salah data (Medium/Medium = 3, bukan 2; kesalahan isi kiriman Hermes) |

Confidence: U-REP MEDIUM (n = 3), U-DOC LOW-MEDIUM (satu pasangan; ambang U-DOC dikunci USER, D-525).

### 0.2 Lima angka terpenting (dengan sumber)

1. **KE-1 U-REP tetap gagal, tetapi membaik r5 ke r5b.** Median r1 2,185 ke 1,511; median r2 7,689 ke 4,190; maks r2 15,057 ke 4,444. R-11 r5b mencapai r1 0,944 (satu-satunya pasangan setara di S1). Sumber `a5/urep_r5.txt`, `a5/urep_r5b.txt`; batas fase `a5/urep.py` fungsi `ends_B`/`ends_A`.
2. **Galat server dan pemutus sirkuit hilang.** Galat server U-REP arm B (R10B+R11B+R12B) 31 di r5 ke 6 di r5b; `sleep` 7 panggilan (367 s nominal) di r5 ke 0 di r5b; panggilan yang ditolak klien Hermes karena pemutus sirkuit 6 ke 0 (ditambah 1 di U-DOC DB r5). Sumber `mcp:r5:*`, `mcp:r5b:*`, `a5/urep_r5{,b}.txt` kolom `sleep`, teks hasil di `sdb` ("unreachable after 3 consecutive failures").
3. **Server Studio bukan penyebab lambat.** Total `durationMs` server per run arm B U-REP r5b 4,6 / 7,1 / 9,1 s, yaitu 3,7% dari selisih B-A gabungan 559,0 s; di U-DOC r5b DB 6,5 s dari T 912,2 s (0,7%). Sumber `mcp:r5b:*`, `a5/gap.txt`.
4. **U-DOC S1 kini lebih cepat di arm B, S2 tidak.** UD-1a T1_B/T1_A: r5 283,5/705,5 = 0,402; r5b 189,6/705,5 = 0,269. UD-1b T2: r5 331,8/20,4 = 16,249; r5b 683,7/20,4 = 33,482. Sumber `a5/udoc_r5.txt`, `a5/udoc_r5b.txt` (penanda `mark S1/S2` di `doc_ud2{,b}/timing.csv`).
5. **Waktu T2 DB r5b adalah verifikasi mandiri Hermes, bukan Studio.** Panggilan Studio terakhir fase S2 selesai +47,3 s sesudah mark S1; 636,4 s berikutnya (93% T2) dipakai membuka DOCX, mengukur piksel, `vision_analyze`, termasuk satu jeda 310,8 s sebelum `execute_code` berargumen rusak. Atribusi: 645,7 dari 683,7 s T2 = verifikasi mandiri. Sumber `a5/udoc_r5b.txt` (ekor_T2), `a5/gap.txt`, `a5/seq_r5b_DB.txt`, `sdb` pesan id 173284.

### 0.3 Inti atribusi waktu

- **U-REP r5b:** 69% selisih B-A (385,9 dari 559,0 s) ada di jalur Studio, yaitu menyusun isi lalu `studio_write`/`studio_edit`, penemuan alat (`tool_describe`), baca balik `studio_document_get`, dan `studio_file_verify`. Pencatatan trial-log menyumbang 26% (143,7 s), termasuk 15,9 s (R10B) dan 13,0 s (R11B) untuk menyelidiki `trial-log step edit --target <documentId>` yang ditolak `TARGET_MISSING`. Verifikasi mandiri hanya 8% (46,3 s). Di U-REP, kebiasaan verifikasi Hermes bukan sebab utama; jalur tulis/sunting dan penemuan alat yang mahal.
- **U-REP r5:** 85% selisih (1.505,1 dari 1.766,0 s) di jalur Studio, termasuk 417,8 s menunggu pemutus sirkuit (`sleep`).
- **U-DOC r5b DB:** 96% selisih T2 (639,7 dari 663,3 s) adalah verifikasi mandiri Hermes. Di T1 arm B lebih cepat 515,9 s karena arm A menghabiskan 278,6 s membaca kode builder/lint dan 293,5 s menulis builder.
- **Jawaban pertanyaan inti:** untuk dokumen klien, celah B/A kini hampir seluruhnya kebiasaan verifikasi Hermes (r5b DB) atau suntingan yang gagal (r5 DB, 99% selisih T2 di jalur Studio karena `TEXT_NOT_FOUND`/`TEXT_AMBIGUOUS` + `sleep 50`). Untuk laporan kerja, celah masih terutama jalur Studio itu sendiri.

### 0.4 Penjelasan Q 709,6 s (r5b) lawan 204,2 s (r5)

Kerja kueri sendiri naik dari 52,0 s (qmark pertama sampai terakhir, r5) ke 110,3 s (r5b), karena Hermes mengukur ulang kueri Q1-Q4 arm B dengan qmark terpisah sesudah empat jawaban tercatat `no_qmark_start`. Selisih besar ada sesudah kueri: r5 menandai END 35,2 s sesudah kueri terakhir dan menulis umpan balik di luar jendela (94,0 s sesudah END, hanya di stdout); r5b menulis umpan balik sebagai berkas `q/umpan-balik-Q.md` SEBELUM END, 519,5 s (berkas itu ditulis dengan 3 `write_file` dan 33 `patch` sepanjang sesi; juga analisis `timing.csv`, membaca empat `format_*.txt`, membaca revisi dokumen M lewat `studio_document_get`, lalu gerbang naturalisasi). Atribusi jendela pasca-kueri r5b: tulis berkas umpan balik 254,8 s, analisis timing 80,3 s, baca format 78,2 s, gerbang naturalisasi 76,3 s, baca Studio 21,5 s. Sumber `a5/attr_Q.txt`, `contract_ab5b/timing.csv` (Q), `tc:r5b:Q`. Server Studio Q: 0,27 s (r5) dan 0,58 s (r5b).

## 1. Source Tasks

| Sumber | Isi yang dipakai |
|---|---|
| `research/27_efficiency_protocol_r5.md` | Delta P5-1..P5-10, ambang tidak berubah (§3), ancaman validitas (§4) |
| `research/17_efficiency_protocol_r4.md` §6.6-§6.9, §7.5-§7.8 | Definisi UD-*/KE-*, ambang U-DOC §6.8, aturan asal-usul §7.7 |
| `research/11_contract_efficiency_protocol.md` §4.3, §4.6, §4.8 | Rumus KE-3, KE-6 (FD/FL), aturan vonis gabungan |
| `research/26_efficiency_results_r4.md` | Metode dan angka pembanding r4 (skrip `analysis_r4/`) |
| `verification/12_results_r4_verification.md` | Cacat L-1..L-8 yang dikoreksi di salinan skrip r5 (§12) |
| `decisions/decisions.md` D-520..D-543 | Log run, perbaikan IMPL-W/W2/W3, ambang U-DOC dikunci USER (D-525), deviasi r5b DA/DA2 (D-538) |
| `hermes_trial/10_r5_*_brief.md`, `11_r5b_*_brief.md` | Langkah S0-S5, larangan §3 (berkas di disk), pencatatan §6, umpan balik §8 |

## 2. Exploration & Collection Summary (Tier 2)

- **Data lengkap**: 15 run r5 (W, R10B, R10A, R11A, R11B, R12B, R12A, M, Q, WD, DB, DA, DA2, DB2, DF) dan 13 run r5b (tanpa DA/DA2), masing-masing dengan `_meta.txt`, `usage_*.json`, `toolcalls.csv`, snapshot `snap_*_diff.json`; log server untuk semua run yang memuat server `studio`. Verifikasi: `ls controller_ab5{,b}/toolcalls/ controller_ab5{,b}/mcpcalls/`.
- **Rekonsiliasi toolcalls lawan log server**: setiap baris log server tercocokkan ke satu tool call (alat sama, `ts` server di [ts_call-1 s, ts_result+1 s]); 0 baris server yatim di 18 run arm B kedua ronde (`a5/common.py` fungsi `match_server`). Kolom `mcp_ok` toolcalls r5/r5b kini cocok dengan `ok` server pada semua panggilan yang sampai ke server; panggilan tanpa baris server = ditolak klien Hermes (pemutus sirkuit, argumen bukan JSON, argumen wajib hilang). `mcp_galat_server` di meta = jumlah `ok=false` log server di semua run (dicek ulang).
- **`_phases.json` tidak ada di sessions/**: dihasilkan dengan `harness_ab5{,b}/ab4.py phases <RUN> --out a5/phases/...`. Aturan harness untuk U-REP arm B mengambil tiga panggilan tulis/sunting ok PERTAMA sebagai S1/S2/S3; itu salah bila satu fase memuat beberapa panggilan (r5 R11B: S1 menurut harness 459,6 s, padahal tulis ulang S1 yang sah selesai 484,6 s). Baris ini memakai aturan §4.1.1 dan melaporkan aturan harness sebagai sensitivitas.
- **G_B,stored** sudah diukur controller: `contract_ab5/sessions/ke3_dryrun.csv` dan `contract_ab5b/sessions/ke3_dryrun.csv`, masing-masing 30 baris, 30 `valid=true` (dihitung ulang, §13).
- **Salinan state.db** (1.190.252.544 B + wal 20.542.352 B) dibuka `mode=ro` hanya untuk teks hasil alat (pesan pemutus sirkuit, peringatan `studio_edit`, kelengkapan render, deskripsi alat).

## 3. Overview (Tier 1, 5W1H)

- **Apa**: hasil dan vonis U-REP dan U-DOC ronde 5 (jalur tulis minimal `studio_write`/`studio_edit`, D-522/D-523) dan ronde 5b (jalur yang sama sesudah IMPL-W3: hasil yang dapat diperbaiki dikirim sebagai `ok:false` biasa, bukan `isError`; alamat sel; pencocokan longgar; D-537..D-541).
- **Siapa**: Hermes profil gsp-master01 (agentId `hermes-gsp-master01`, M2 `hermes-gsp-verifier01`) sebagai subjek; controller pemilik runner; USER pemutus vonis NETRAL.
- **Kapan**: run r5 2026-11-03 03:51-05:59Z, r5b 07:32-09:16Z (meta `start_utc`).
- **Lingkup**: tiga pasangan laporan kerja (R-10, R-11, R-12), run M dan Q; satu pasangan dokumen klien utama (DB lawan DA) dan satu perluasan (DB2 lawan DA2). W dan WD pemanasan, tidak dinilai.
- **Mengapa**: USER meminta usaha tulis Studio setara Markdown (D-521, D-523) dan menanyakan mengapa r5 justru lambat (D-534).
- **Bagaimana**: skrip baca-saja; batas fase dari `ts_result` panggilan ok di log server (arm B) dan edit berlabel terakhir (arm A); atribusi selang ke aksi pengakhir; docxcheck terkoreksi; inspeksi visual PNG dari DOCX.
- **Asumsi dan celah**: §11.

## 4. U-REP: hasil per metrik

### 4.1 KE-1 Waktu (D-422)

#### 4.1.1 Batas fase (P5-3)

- START = baris `scenario_marker START src=harness` (`contract_ab5{,b}/timing.csv`).
- Arm A: akhir S1/S2/S3 = `t_end` `trial-log step edit --step Sx` terakhir per label (D-519), sama dengan keluaran `ab4.py phases`.
- Arm B: akhir fase = `ts_result` panggilan `studio_write`/`studio_edit` yang `ok=true` di log server. Label `step edit` arm B tidak lengkap: R10B r5 hanya punya label S1, R11B r5 menandai S2 dan S3 bersamaan sesaat sebelum END, R12B r5b hanya S1, dan 10 baris `step edit` arm B r5b gagal `TARGET_MISSING` (trial-log menuntut berkas di disk; umpan balik Q r5b §B butir 1). Karena itu: **akhir S1 = panggilan tulis/sunting ok terakhir sebelum label `step edit S1` pertama** (label menandai fase, `ts_result` menandai waktu); **akhir S3 = panggilan tulis/sunting ok terakhir sebelum END**. Pemisahan S2/S3 arm B hanya dilaporkan bila label S2 dan S3 terpisah > 1 s (`a5/urep.py`, fungsi `ends_B`).
- T1 = START sampai akhir S1; T2 = akhir S1 sampai akhir S3.

#### 4.1.2 Rasio dan vonis (sumber `a5/urep_r5.txt`, `a5/urep_r5b.txt`)

| Ronde | Pasangan | T1_B / T1_A (s) | r1 | T2_B / T2_A (s) | r2 | S2 / S3 arm A (s) |
|---|---|---|---|---|---|---|
| r5 | R-10 (B dulu) | 60,619 / 35,393 | 1,713 | 450,569 / 63,391 | 7,108 | 50,8 / 12,6 |
| r5 | R-11 (A dulu) | 484,614 / 30,211 | 16,041 | 467,482 / 31,048 | 15,057 | 14,7 / 16,4 |
| r5 | R-12 (B dulu) | 88,666 / 40,572 | 2,185 | 340,784 / 44,321 | 7,689 | 20,8 / 23,5 |
| r5 | **Median / maks** | | **2,185** | | **7,689 / 15,057** | |
| r5b | R-10 | 62,462 / 41,346 | 1,511 | 84,112 / 40,562 | 2,074 | 21,2 / 19,3 |
| r5b | R-11 | 70,888 / 75,114 | **0,944** | 213,211 / 47,976 | 4,444 | 15,5 / 32,5 |
| r5b | R-12 | 149,847 / 61,466 | 2,438 | 178,597 / 42,624 | 4,190 | 16,1 / 26,6 |
| r5b | **Median / maks** | | **1,511** | | **4,190 / 4,444** | |

Ambang D-422: (a) median r1 <= 1,00; (b) median r2 <= 0,70 DAN maks r2 <= 1,00. **r5: (a) GAGAL, (b) GAGAL. r5b: (a) GAGAL, (b) GAGAL.** KE-1 GAGAL di kedua ronde. Pemisahan S2/S3 arm B hanya tersedia untuk R-12 r5 (S2 278,985 s, S3 61,799 s).

#### 4.1.3 Sensitivitas (tidak menentukan vonis; nilai R-10 / R-11 / R-12; median)

| Definisi | r5 | r5b | Uji |
|---|---|---|---|
| Aturan harness (tiga ok pertama), r1 | 1,713 / 15,212 / 2,185; 2,185 | 1,511 / 0,944 / 1,908; 1,511 | GAGAL |
| Aturan harness, r2 | 6,369 / 1,864 / 5,443; 5,443 | 2,074 / 2,289 / 1,846; 2,074 | GAGAL |
| (1) T START-END | 5,331 / 16,659 / 5,332; 5,332 | 2,510 / 2,445 / 3,465; 2,510 | GAGAL |
| (3) `wall_s` sesi | 5,003 / 15,169 / 5,154; 5,154 | 4,900 / 2,348 / 4,153; 4,153 | GAGAL |
| (2) T1 dari START Hermes | 1,536 / 28,232 / 3,660; 3,660 | 2,036 / 1,547 / 3,623; 2,036 | GAGAL |
| (6) B dikurangi seluruh `durationMs` tulis/sunting di fase, r1 | 1,661 / 15,945 / 2,137; 2,137 | 1,471 / 0,919 / 2,387; 1,471 | GAGAL |
| (6) idem, r2 | 7,029 / 14,848 / 7,495; 7,495 | 2,002 / 4,339 / 4,057; 4,057 | GAGAL |
| (5) tanpa `host_bersih=tidak` | TIDAK-DAPAT-DIHITUNG: 9/9 run `host_bersih=tidak` (isolasi informatif D-442) | idem | - |

Caveat beban: semua run gagal isolasi H-1/H-4 (meta `isolation_gagal`); CPU rerata selama run B/A r5 9,6/13,2 (R-10), 10,5/8,3 (R-11), 9,1/16,8 (R-12); r5b 6,8/10,0, 7,1/14,4, 8,4/12,5 (%). Beban tidak memberatkan arm B secara sistematis. Catatan: `wall_s` r5b R10B 462,7 s memuat 256,8 s sesudah END (Hermes menulis `format_R10B.txt` dan dua `studio_document_get` pasca-END, `tc:r5b:R10B`), sehingga rasio wall yang dikutip D-543 (462,7/94,4) melebih-lebihkan rasio T (205,9/82,1).

### 4.2 KE-2 Jumlah langkah (advisori; `a5/urep_r5{,b}.txt`)

| Ronde | R-10 B/A | R-11 B/A | R-12 B/A | Median s | Meta-alat B (`tool_describe`/`tool_search`) |
|---|---|---|---|---|---|
| r4 (acuan) | 38/16 | 45/15 | 52/20 | 2,600 | 5 / 6 / 10 |
| r5 | 32/10 = 3,200 | 59/11 = 5,364 | 48/14 = 3,429 | 3,429 | 4 / 5 / 6 |
| r5b | 22/13 = 1,692 | 39/14 = 2,786 | 43/14 = 3,071 | 2,786 | 3 / 4 / 7 |

N_agent = tool call di [START, END] tanpa panggilan yang seluruhnya `trial-log mark/qmark/answer` (pembelah perintah sadar-kutipan, koreksi L-1). KE-2 GAGAL (advisori) di kedua ronde.

### 4.3 KE-3 Galat format (log server; `mcp:<rnd>:<RUN>`, `a5/urep_r5{,b}.txt`)

Kode server dikelompokkan: **skema/kontrak** (`SECTION_MISSING`, `CONTENT_INJECTION`, `MD_REPORT_INVALID`, `META_CONFLICT`, `META_MISSING`, `RECORD_FIELDS_DROPPED`, `RECORD_ELEMENTS_DROPPED`, `SCHEMA_INVALID`, `CONTENT_INVALID`), **argumen** (`INVALID_ARGUMENT`, `EDIT_INVALID`), **alamat suntingan** (`TEXT_NOT_FOUND`, `TEXT_AMBIGUOUS`).

| Komponen | r5 R10B / R11B / R12B | r5b R10B / R11B / R12B | Sumber |
|---|---|---|---|
| G_B,stored (dry-run R08 isi tersimpan, W/R10B/R11B/R12B/M x record + bab 1-5) | 0 (30/30 `valid=true`) | 0 (30/30) | `contract_ab5{,b}/sessions/ke3_dryrun.csv` |
| G_B,4xx skema/kontrak | 1 / 10 / 4 (Σ 15) | 0 / 0 / 2 (Σ 2) | log server |
| Galat argumen | 1 / 1 / 0 | 0 / 0 / 2 (`EDIT_INVALID`, `INVALID_ARGUMENT` pada `studio_file_verify`) | idem |
| Galat alamat suntingan | 6 / 4 / 4 | 0 / 1 / 1 | idem |
| Ditolak klien sebelum server | 0 / 5 (pemutus sirkuit) / 2 (1 pemutus, 1 argumen bukan JSON) | 0 / 1 (`arguments must be an object`) / 0 | `sdb` teks hasil |
| G_A (checker DC-47b, ketat / longgar) | 2+2+2 = 6 / 4 | 1+2+2 = 5 / 2 | `a5/ga5.txt` |

Rincian r5 R11B: `CONTENT_INJECTION` 7 (positif palsu "pembuka bab 1 di luar section", akar diperbaiki D-537), `SECTION_MISSING` 2, `INVALID_ARGUMENT` 1, `SCHEMA_INVALID` 1 (`studio_document_get` dengan `shape`), `TEXT_NOT_FOUND` 3, `TEXT_AMBIGUOUS` 1.

Ambang (research/11 §4.3): G_B,stored = 0 KERAS; Σ G_B,4xx <= 3 dan maks <= 2; Σ G_B < Σ G_A.
- **r5**: stored LULUS; Σ 15, maks 10: GAGAL; KE-3 **GAGAL** (bagian non-keras).
- **r5b**: stored LULUS; Σ 2, maks 2, 2 < 5: **LULUS**. Sensitivitas dengan galat argumen: Σ 4, maks 4 (R12B): GAGAL.

### 4.4 KE-4 Retrieval (sumber `a5/retrieval_r5.txt`, `a5/retrieval_r5b.txt`, `a5/lq_r5{,b}.txt`)

Kunci diselesaikan dari `controller_ab5{,b}/answers/Q_key.md` (aturan rujukan kasar D-525 sudah tertulis sebelum run). Arm B: HTML render akhir di `contract_ab5{,b}/sandbox/<k>/` dengan teks per atribut `data-block` (format r5 memakai `data-block`, bukan `data-block-id` r4; `a5/htmlpid.py` diperluas); status tersimpan = baris `Status` rekaman di HTML; arm A: `laporan.md` akhir.

| Q | r5 A | r5 B | r5b A | r5b B |
|---|---|---|---|---|
| Q1 | benar | benar | benar | benar |
| Q2 | benar | benar (kunci {R11B, R12B}) | benar | benar (kunci tersimpan hanya {R12B}, lihat bawah) |
| Q3 | benar (2 baris) | benar (2 blok `#p-...`) | benar | benar |
| Q4 | benar | benar | benar | benar |
| Q5 | **salah**: jawab {74, 76}, kunci {76} (r12a hanya memberi path + subbagian) | benar: refs R12B -> `R10B#p-zgd512ktht` (blok memuat `61b35d8ffba7c993`) | **salah ketat**: jawab rentang 102-104, kunci {104}; benar dengan aturan rentang setara rujukan kasar | benar: refs R12B -> `R10B#p-yb43paj5z6` |
| Skor | 4/5 | **5/5** | 4/5 | **5/5** |
| Median L_q (terkoreksi) | 1 | 1 | 1 | 1 |

L_q terkoreksi (L-1): aksi pencarian milik arm itu di jendela qmark terakhir; arm A = sub-perintah grep/sed/cat/head/awk atas `r1Xa/laporan.md` (perintah dipecah sadar-kutipan, heredoc tidak dipecah), arm B = panggilan `studio_*`. r5 Q1B tanpa jendela (Hermes lupa `qmark`, tercatat OPERATOR-ERROR di `timing.csv`), dihitung 1 dari toolcalls. Dengan cara ini r4 menjadi A 3 / B 1 (r4 melaporkan 3 / 2).

KE-4 (B 5/5 KERAS DAN median L_q B <= A): **LULUS di r5 dan r5b.** Catatan wajib r5b: kunci Q2 arm B memakai status TERSIMPAN (Q_key "Keadaan yang dipakai = keadaan TERSIMPAN"). Status rekaman tersimpan W, R10B, R11B r5b = `draft` (niat: blocked, needs-review, complete), sehingga R11B tidak masuk kunci dan jawaban Hermes {R12B} benar terhadap kunci, tetapi salah terhadap niat lembar fakta. Selisih itu galat penulisan (§4.7), bukan galat retrieval. Hermes sendiri melaporkannya (umpan balik Q r5b §E butir 2).

### 4.5 KE-5 Jejak disk dan asal-usul (§7.7; `a5/prov_r5_urep.txt`, `a5/prov_r5b_urep.txt`)

| Ronde | Run | Berkas baru (snapshot) | Ajudikasi | D_raw,B |
|---|---|---|---|---|
| r5 | R10B / R11B / R12B | S2: 1 unduhan C51 per run + berkas controller (`format_*`, `timing.csv`, log harness); S3: berkas `%TEMP%` (`wd_hlnas_*`, `route_8026*`, `vcsfs_*`, `wake1031/`, dump MSRDC, `swap.vhdx`, profil Chromium `Local State`) | Semua berkas S3: 0 rujukan path/basename di toolcalls run (`a5/prov.py`), tidak disentuh sesi uji, pola sama dengan pekerjaan cron/profil lain (L-8 r4); unduhan = pengecualian butir 5. Berkas sesaat r5 R12B: `sandbox/r12b/check.py`, `glyph.py` (skrip cek buatan Hermes, dihapus sesudah dijalankan, bukan respons API); r5 W `/tmp/draft_w.txt` (draf teks laporan stdout untuk gerbang naturalisasi, dihapus) | 0 / 0 / 0 |
| r5b | R10B / R11B / R12B | S2: 1 unduhan C51 per run + berkas controller; S3: `f1_*`, `wd_hlnas*`, `wd_rt.json`, `verif-delta/`, `hermes-webui-tests/`, `microverif_benny/`, dump | Sama: 0 rujukan di toolcalls run; tidak ada berkas sesaat di arm B U-REP r5b | 0 / 0 / 0 |

F_name 3/3 dan F_sha 3/3 di kedua ronde (nama `NNN-GSP-LAP-XI-2026_revN_<UTC>_<sha8>.html`; sha256 berkas = sha8 nama). Arm B r5/r5b tidak menyimpan laporan MD di disk (P5-1). Folder kosong `2026-11-03_hermes-contract-ab5/r12b/` ada di workspace (0 berkas). KE-5 **LULUS** di kedua ronde.

### 4.6 KE-6 Beban pikir format

- FL utama (panggilan `studio_registry`, `get_prompt`, `read_resource`, `list_prompts`/`list_resources` di [START, END]): B 0/0/0 dan A 0/0/0 di r5 dan r5b. `tool_describe`/`tool_search` (padanan `--help`, informatif): r5 4/5/6, r5b 3/4/7; `skill_view` r5 R11B 2, r5b R10B 2, R12B 2. Median FL_B 0 <= FL_A 0: LULUS.
- FD_B (taksiran analis, LOW, dari `format_<run>.txt` dan artefak): dimensi yang masih diputuskan Hermes sendiri adalah F6 kosakata verdict (r5b: teks bebas dibuang `VERDICT_DROPPED`, umpan balik Q r5b §C) dan F10 bentuk `reportedAt` (r5b R11B `2026-11-03T14:54+07:00`, R10B `2026-11-03`; `tc:r5b`), sebagian F5 (pemetaan "berjalan"/"belum mulai" ke enum mesin, `format_R10B.txt` r5b butir 5). FD_B = 2 sampai 3.
- KE-6: **LULUS-batas** di kedua ronde (FL lulus; FD di ambang 2, taksiran). Swalapor Hermes r5b: "Bentuk halaman hilang, bentuk kontrak tinggal." (umpan balik Q r5b §C).

### 4.7 KE-7 Kelengkapan (`a5/kf5.txt`)

- K_B: hasil tulis/sunting ok terakhir tiap run arm B memuat `kelengkapan: COMPLETE` (r5 rev 18/30/29, r5b rev 16/20/27; `sdb`). K_B 3/3 di kedua ronde: **LULUS** (KERAS).
- KF dengan pencocok token manifest 09 §5 (sama dengan r4) atas teks HTML render akhir arm B dan `laporan.md` arm A:

| Laporan | r5 KF_A / KF_B | Fakta B hilang r5 | r5b KF_A / KF_B | Fakta B r5b |
|---|---|---|---|---|
| R-10 | 38/38 / **34/38** (89,5%) | R10-F31..F34 (verdict custodian iterasi-1, butir B-1/G-1, uji ulang): teks tidak ada di HTML (cek `perlu_revisi`, `Arfysica`, `2583` = 0 kemunculan) | 38/38 / 37/38 | R10-F30 `915/2581` ditulis "915 dari 2581" (notasi; sesudah ajudikasi 38/38) |
| R-11 | 37/37 / 37/37 | - | 37/37 / 37/37 | - |
| R-12 | 33/33 / 33/33 | - | 33/33 / 33/33 | - |

KF: r5 **GAGAL** (R-10 kehilangan empat fakta S2 di tengah lima `TEXT_NOT_FOUND`); r5b **LULUS sesudah ajudikasi notasi**.

- **Status rekaman tersimpan lawan niat (cek tambahan, bukan metrik protokol)**: r5 5/5 cocok (W blocked, R10B needs-review, R11B complete, R12B complete, M needs-review). **r5b 2/5**: W, R10B, R11B tersimpan `draft`. Sebab: `studio_edit` r5b tidak punya kanal meta (deskripsi alat di `sdb`: hanya `find/replace`, `after/insert`, `cell`, `pid`, `figure/chart`), dan `find` satu kata ("draft") yang dipakai R10B r5 untuk mengganti status kini ditolak aturan jangkar >= 3 kata (D-536). Hanya R12B (tulis ulang `studio_write` dengan meta) dan M yang benar. Pencocok token KF tidak menangkapnya karena "needs-review" tetap tertulis di prosa.

### 4.8 TK-1 Token (informatif; `usage_<RUN>.json` mencakup seluruh sesi, termasuk pasca-END)

| Ronde | Masuk per `api_call` B/A (R-10, R-11, R-12) | Median | api_calls B/A |
|---|---|---|---|
| r4 | 1,323; 2,195; 1,470 | 1,470 | 29/20, 40/20, 46/21 |
| r5 | 67.390/45.996 = 1,465; 117.964/46.850 = 2,518; 69.684/47.578 = 1,465 | 1,465 | 36/14, 65/11, 50/18 |
| r5b | 98.997/46.173 = 2,144; 66.939/47.861 = 1,399; 123.776/48.272 = 2,564 | 2,144 | 29/16, 47/19, 50/15 |

Usulan controller (median <= 1,25): tidak tercapai di kedua ronde, dan r5b memburuk. Hasil alat Studio per panggilan membesar (rerata `result_len` U-REP B r4 2,9-4,3 KB, r5 2,2-2,8 KB, r5b 4,4-6,3 KB; total `tool_describe` per run r4 6,1-6,8 KB, r5b 10,6-17,0 KB; `a5` perintah §13), karena hasil r5b memuat `nextSteps`, daftar `correlationIds`, peringatan `TEXT_ESCAPED`, kandidat siap salin, dan blok data tak tepercaya.

### 4.9 Gerbang keras dan vonis gabungan U-REP

| Gerbang / metrik | r5 | r5b |
|---|---|---|
| (1) G_B,stored = 0 | LULUS (30/30, diukur) | LULUS (30/30) |
| (2) KE-4 B 5/5 | LULUS | LULUS (kunci Q2 dari status tersimpan) |
| (3) D_raw,B = 0 | LULUS | LULUS |
| (4) K_B = 100% | LULUS | LULUS |
| KE-1 | GAGAL (2,185; 7,689 / 15,057) | GAGAL (1,511; 4,190 / 4,444) |
| KE-6 | LULUS-batas (FD taksiran) | LULUS-batas |
| KE-3 non-keras | GAGAL (Σ 15) | LULUS (Σ 2) |
| KE-7 KF | GAGAL (R-10 4 fakta) | LULUS sesudah ajudikasi |
| KE-2 (advisori) | GAGAL (3,429) | GAGAL (2,786) |

Vonis (research/11 §4.8): semua gerbang KERAS lulus dan KE-1 gagal, jadi **NETRAL (keputusan USER) untuk r5 dan r5b**. Caveat yang wajib disajikan: r5b menyimpan status rekaman salah di 3 dari 5 dokumen arm B, dan kecepatan tidak mencapai ambang di pasangan mana pun pada S2/S3.

## 5. U-DOC: hasil per metrik

### 5.1 UD-T1, UD-T2, UD-T (penanda `mark S1/S2`; `a5/udoc_r5.txt`, `a5/udoc_r5b.txt`)

| Ronde | Run | T1 (s) | T2 (s) | T START-END (s) | wall_s | Studio T1 / ekor T1 (s) | Studio T2 / ekor T2 (s) |
|---|---|---|---|---|---|---|---|
| r5 | DB (B) | 283,513 | 331,797 | 710,310 | 752,9 | 219,7 / 63,8 | 313,0 / 18,8 |
| r5 | DA (A) | 705,465 | 20,419 | 726,062 | 869,7 | - | - |
| r5 | DB2 (B) | 243,402 | 331,830 | 575,443 | 829,2 | 194,6 / 48,8 | 240,5 / 91,3 |
| r5 | DA2 (A) | 561,670 | 59,082 | 620,901 | 958,2 | - | - |
| r5b | DB (B) | 189,584 | 683,675 | 912,212 | 1.416,8 | 182,0 / 7,6 | 47,3 / **636,4** |
| r5b | DB2 (B) | 555,738 | 95,896 | 652,036 | 733,7 | 543,7 / 12,0 | 75,8 / 20,1 |
| r5b | DA, DA2 | = r5 (D-538) | | | | | |

"Studio T" = sampai `ts_result` panggilan `studio_write`/`studio_edit`/`studio_file_verify` ok terakhir sebelum penanda fase; "ekor" = penanda fase dikurangi itu, yaitu kerja Hermes sesudah alat selesai.

| Rasio (ambang D-525) | r5 DB/DA | r5 DB2/DA2 | r5b DB/DA | r5b DB2/DA2 |
|---|---|---|---|---|
| UD-1a T1 (<= 1,00) | **0,402 LULUS** | 0,433 | **0,269 LULUS** | 0,989 |
| UD-1b T2 (<= 0,70) | **16,249 GAGAL** | 5,616 | **33,482 GAGAL** | 1,623 |
| T1 + T2 | 0,848 | 0,927 | 1,203 | 1,050 |
| T START-END | 0,978 | 0,927 | 1,256 | 1,050 |
| wall_s | 0,866 | 0,865 | 1,629 | 0,766 |
| "Rakit saja" (T1 minus baca bahan) | 0,410 | 0,423 | 0,273 | 0,979 |
| Sensitivitas jalur Studio T1 / T2 | 0,311 / 15,330 | 0,347 / 4,071 | 0,258 / 2,316 | 0,968 / 1,283 |

Catatan UD-1b: arm A kembali memasukkan logika revisi ke builder sebelum mark S1 (`tc:r5:DA` +612,7 s: patch builder dengan cabang `rev == 1` untuk Table 6.1; build Rev 1 baru dijalankan +708 s sesudah S1 +705,5 s), sehingga T2_A 20,4 s hanya build ulang + verifikasi. T2_A bukan biaya revisi utuh; pembanding yang adil tetap T1 + T2 (r5 0,848, r5b 1,203). Pola sama dengan r4 (`research/26` §5.1).

### 5.2 UD-N, UD-K, UD-G (`a5/udoc_r5{,b}.txt`, `mcp:<rnd>:<RUN>`)

| Ronde | Run | UD-N (meta-alat; panggilan sesi) | Token masuk / keluar | api_calls | Masuk/panggilan | Galat server arm B (semua pulih) | Ditolak klien |
|---|---|---|---|---|---|---|---|
| r5 | DB | 48 (4; 53) | 5.854.762 / 98.752 | 51 | 114.799 | 8: `TEXT_NOT_FOUND` 4, `TEXT_AMBIGUOUS` 1, `INVALID_ARGUMENT` 1, `CONTENT_INVALID` 1, `HTTP_404` 1 | 1 (pemutus sirkuit) |
| r5 | DA | 40 (0; 57) | 7.516.511 / 117.675 | 57 | 131.869 | - | - |
| r5 | DB2 | 40 (4; 79) | 7.699.175 / 106.636 | 65 | 118.449 | 4: `TEXT_NOT_FOUND` 2, `TEXT_AMBIGUOUS` 1, `INVALID_ARGUMENT` 1 | 1 (argumen wajib hilang) |
| r5 | DA2 | 60 (0; 128) | 12.769.748 / 108.494 | 106 | 120.469 | - | - |
| r5b | DB | 43 (3; 117) | 18.798.315 / 145.062 | 118 | 159.308 | 1: `CONTENT_INVALID` | 0 |
| r5b | DB2 | 73 (5; 82) | 9.062.460 / 86.537 | 79 | 114.715 | 3: `CONTENT_INVALID`, `SCHEMA_INVALID`, `EDIT_INVALID` | 0 |

UD-4 (N B/A, advisori): r5 1,200 dan 0,667; r5b 1,075 dan 1,217. UD-5 galat tidak pulih arm B = 0 di keempat run B (semua menghasilkan DOCX S1 dan S2): **LULUS**. UD-7: token masuk B/A r5 0,779 dan 0,603; r5b 2,501 dan 0,710; per panggilan r5 0,871 dan 0,983; r5b 1,208 dan 0,952. Token r5b DB mencakup 74 tool call sesudah END (117 panggilan sesi, 43 di jendela).

### 5.3 UD-Q1 sampai UD-Q5 (docxcheck terkoreksi; `a5/docx_all5.txt`, `a5/docx_all5.json`, `a5/q4diff.txt`, `a5/rail_adj.txt`)

docxcheck = salinan `analysis_r4/docxcheck.py` dengan acuan `doc_ud2/source/` (bab-01..06 identik byte dengan r4, `cmp`), dikoreksi: keterangan = pola `Tabel/Table/Gambar/Figure N` DAN bukan paragraf sumber (L-3: "Table 6.1 condenses ..." tidak lagi terhitung), plus cek baru: keterangan tepat sebelum tabel isi, nomor/prefiks ganda Gambar 6.1, penomoran ganda bab/subbab, nomor subbab sumber dipertahankan, baris sumber yang tidak ada di bahan, riwayat revisi, nomor di header/footer, posisi RV-3. DOCX: r5 DB rev11/rev16, DB2 rev11/rev16, DA Rev0/Rev1, DA2 S1/S2; r5b DB rev8/rev13, DB2 rev12/rev17 (penanda S1/S2 dan catatan `timing.csv`; `a5/docmap.py`).

| Butir | r5 DB (S1/S2) | r5 DB2 | r5 DA | r5 DA2 | r5b DB | r5b DB2 |
|---|---|---|---|---|---|---|
| Q1a paragraf sumber hadir | **50/53** / 50/53 | 50/53 | 42/53 ketat; 52/53 sesudah rujukan rail | 53/53 | **46/53** / 46/53 | 46/53 |
| Yang hilang | "Chapter 1./6./10." diganti kicker "CHAPTER n" + judul; Introduction menjadi **CHAPTER 4** | sama | rujukan `[X-C-nn]` dipindah builder ke rail tanpa kurung (`rail-manifest-rev0.json`), 1 paragraf beda tanda kurung | - | judul bab + 4 subbab Chapter 1 (FM disarangkan ke bab 1 sebagai 1.1-1.3; subbab sumber 1.1-1.4 menjadi **1.4-1.7**) | sama |
| Q1b token angka/ID | 630/630, 633/633 | sama | 585/630 ketat; rujukan tanpa kurung 94/96 | 630/630, 633/633 | 630/630, 633/633 | sama |
| Q1c angka tambahan (isi) | 0 (chrome kop/nomor) | 0 | 0 | 0 | 0; token "1.5/1.6/1.7" = nomor subbab baru mesin | sama |
| Q1d tabel | data identik 3/3; tiap tabel + 1 baris SUMBER | sama | identik 3/3 | identik 3/3 | identik 3/3 (+ baris SUMBER) | sama |
| Q2 sampul: judul / nomor `GSP-UD1-NL-001` / TERBATAS | ya / ya / ya | ya | ya | ya | ya / ya / ya | ya |
| Q2 nomor di footer | nomor server `025/GSP/KT/X/2026` (keterbatasan D-530) | `026/...` | meta | meta | `034/...`; footer "REV A" tidak ikut Rev 1 (DF r5b) | `035/...` |
| Q2 keterangan tabel isi | 3/3 ("Tabel 1.1/6.1/6.2") | 3/3 | 3/3 (nomor engine "TABEL F1/6.1/6.2") | 3/3 ("TABLE FM.1/6.1/6.2"; regex docxcheck tidak mengenali "TABLE" huruf besar, dikoreksi manual dari `a5/dump/r5_DA2_S1.txt`) | 3/3 | 3/3 |
| Q2 penomoran ganda ("4.1   1.1 ...") | **12 heading** | 12 | 0 | 0 | 0 | 0 |
| Q2 nomor subbab sumber dipertahankan | 12/12 (sebagai nomor kedua) | 12/12 | 12/12 | 12/12 | **8/12** | 8/12 |
| Q2 baris sumber tanpa dasar di bahan | **3 "SUMBER Compiled by Tim Riset GSP"** (`SOURCE_DEFAULTED` mesin) | 3 | 0 (sumber dari bahan: "Table 6.1, bab-05" dll.) | 0 | 0 (sumber diturunkan Hermes dari teks bab: "masterplan/02 section 3") | 0 |
| Q2 riwayat revisi | 1 baris; S2 "Rev 1 / First issue" (Rev 0 hilang; uraian meta "terbitan pertama"/"sesuai revisi.md" tidak tercetak) | sama | "Rev 1, sesuai revisi.md" | "Rev 1, sesuai revisi.md" | sama dengan r5 DB | sama |
| Q2 daftar isi | tabel "Contents" 18 PAGEREF, kolom halaman kosong | sama | field TOC (kosong sampai F9) | statis tanpa halaman | sama dengan r5 DB | sama |
| Q4 blok berubah S1-S2 | 5 (Rev, riwayat, SEC-12, RV-1, RV-3) | 6 (+ keterangan gambar diperbaiki) | 5 | 4 | 5; RV-3 sebagai **paragraf baru**, bukan kalimat akhir paragraf (revisi.md butir 3) | 5 (RV-3 menyatu) |
| Q4 token: `400 bundles` ada, `500` hilang, `REV-UD1-03`, SEC-12 Likelihood | ya / ya / ya / Medium-High | ya | ya | ya | ya | ya |
| Q5 nama C51 + sha | 2/2 | 3/3 | sha dilaporkan = berkas (33d090b6, 1c3e468b) | 2/2 | 2/2 | 7/7 |

UD-Q3 lint (datum_lint skill, salinan DOCX bernama ASLI sehingga DATUM-38 tidak dihukum karena nama yang diwajibkan protokol, koreksi L-6; `a5/datum_lint5.txt`): arm B 8/8 DOCX FAIL DATUM-05 (wajah "IBM Plex Sans Cond"), DATUM-10 (tabel4-8 lembar kendali tanpa SUMBER), DATUM-14 (6 warna halaman 1), DATUM-22 (isi sumber), DATUM-38 (pola nama C51); arm A 4/4 hanya DATUM-22. Kelas `rakitan_alat`: B 3 (05, 10, 14; DATUM-38 dikeluarkan sebagai syarat protokol) lawan A 0. Lint Studio per aturan TIDAK-DAPAT-DIHITUNG dari berkas (hasil tidak diekspor per aturan).

### 5.4 UD-Q6 Gambar 6.1 (D-498; PNG diekstrak ke `a5/fig/`, crop tepi kiri `a5/fig/crop_*_left.png`)

PNG grafik arm B identik byte lintas ronde: S1 r5 DB = r5b DB = r5b DB2 (sha256 awal `e941a3b4`), S2 r5 DB = r5b DB = r5b DB2 (`ae6dfcb8`); hanya r5 DB2 berbeda (memuat label sumbu "jumlah baris SEC"). Nilai dibaca dari garis kisi (bilangan bulat 0-9; keyakinan tinggi).

| Butir | Arm B (r5 DB, r5 DB2, r5b DB, r5b DB2) | Arm A (DA, DA2) |
|---|---|---|
| (a) posisi | sesudah Table 6.1, sebelum 6.3, di keempat | sesudah Table 6.1 |
| (a) keterangan | "Gambar 6.1 ..." di semua; **prefiks ganda "Gambar 6.1 Gambar 6.1"** di r5 DB S1/S2 dan r5 DB2 S1 (Hermes mengirim caption berprefiks, mesin menambah nomor; diperbaiki IMPL-W3, r5b tunggal) | "GAMBAR 6.1 ..." |
| (a) sumber tampil | "SUMBER Table 6.1, bab 6 dokumen ini" di semua | sama |
| (a) alt | tidak generik (teks keterangan; ganda di r5 DB) | **generik** (`Picture 1`, descr kosong) |
| (b) data S1 = `gambar.md` | cocok di keempat | cocok |
| (b) data S2 = RV-4 | cocok di r5 DB, r5b DB, r5b DB2; **r5 DB2 salah**: Medium/Medium = 3 (total 22 baris), seharusnya 2; isi kiriman Hermes sendiri `series Medium [3,1,3,1,0,0]` (`tc:r5:DB2`, `studio_edit` ok) | cocok |
| (b) bentuk bertumpuk | batang horizontal bertumpuk | DA vertikal bertumpuk, DA2 horizontal bertumpuk |
| (c) cacat tata letak | **S1: 1 label terpotong** ("Low-Medium", huruf L terpotong di tepi kanvas; 6 piksel tinta di kolom x=0); **S2: 2 label** ("Medium-High" huruf M dan "Low-Medium" huruf L terpotong sebagian; 24 piksel tinta di x=0). Cacat sama di r5 dan r5b karena PNG identik | 0 / 0 |

Kesimpulan Q6: (a) lulus di r5b, cacat keterangan ganda di r5; (b) data benar kecuali r5 DB2 S2 (galat isi agen); (c) B 1/2 lawan A 0/0 di kedua ronde: Q6 (c) GAGAL. Pratinjau atau pemeriksa tata letak mesin tidak menangkap pemotongan ini (keluhan yang sama di r4, `research/26` §5.5, dan di umpan balik DF r5b).

### 5.5 UD-J Jejak berkas dan asal-usul (`a5/prov_r5_udoc.txt`, `a5/prov_r5b_udoc.txt`, `a5/prov_r5_udocA.txt`)

| Ronde | Run | Unduhan C51 (sha cocok) | Berkas lain arm di disk sesudah run | Berkas sesaat (dibuat lalu dihapus) | Lainnya (%TEMP%, tidak disentuh) |
|---|---|---|---|---|---|
| r5 | DB | 2 (1.063.402 B) | **59 berkas `sandbox/db/_probe/` (1.258.395 B)**: 47 bagian DOCX hasil unzip (`word/`, `customXml/`, `docProps/`, fon `odttf`, media) + 12 berkas yang namanya muncul di tool call (3 skrip inspeksi disimpan sebagai `_zz_inspect*.py.txt`, `cropcheck.py`, `diffrev.py`, `s1_chart.png`, `rev_chart.png`, dua crop tepi kiri, bagian XML yang dibaca) | `_probe/*` ditulis lewat `write_file`/`open(...,'w')` | `rmaster_*`, `sysman_*` (0 rujukan) |
| r5 | DB2 | 3 (1.606.231 B) | - | `_chk/chart_s1.png`, `chart_s2.png` (PNG dari DOCX) | dump WSL, `swap.vhdx`, `hlnas_watchdog_report.md` |
| r5b | DB | 2 (1.053.516 B) | - | `sandbox/db/.peek_url.txt` (data URL PNG grafik dari DOCX, dihapus `rm -f`) | `gw_audit_sysman_*`, dump |
| r5b | DB2 | 7 (3.668.761 B; rev8, rev9, rev10, rev11, rev12, rev16, rev17) | - | `gambar61_rev9.png`, `gambar61_rev16.png` | - |
| r5 | DA | - | 8 berkas workspace: 2 DOCX (190.537 B), 2 skrip (`build-ud2-da.py`, `verify-ud2-da.py`; 28.228 B), 4 antara (2 PNG grafik, 2 `rail-manifest`) | - | - |
| r5 | DA2 | - | 10 berkas: 2 DOCX (198.270 B), 2 skrip (`build_udoc_a.py`, `gate_udoc_a.py`; 23.850 B), 6 antara (PNG/JSON grafik, register `lint-allow-datum22*`) | - | - |

**Ajudikasi `_probe` (UD-6, bacaan ketat utama per D-525):** brief r5 §3 hanya mengizinkan "unduhan final arm B di sandbox" di disk. Ke-59 berkas `_probe` bukan unduhan final, dibuat sesi DB (bukti sentuh langsung: `tc:r5:DB` `write_file .../_probe/inspect.py`, `cropcheck.py`, `diffrev.py`; unzip ke `_probe`), dan tetap ada sesudah run. **Bacaan ketat: UD-6 r5 DB GAGAL.** Bacaan analogi (§7.7 butir 4: hanya respons API, badan kiriman, atau hasil alat yang dihitung D_raw): isinya turunan unduhan sah dan skrip cek milik Hermes, bukan respons/payload, sehingga D_raw,B = 0 dan UD-6 LULUS. Kedua bacaan disajikan; vonis memakai bacaan ketat sesuai keputusan USER D-525. Berkas sesaat r5 DB2, r5b DB, r5b DB2 adalah turunan DOCX unduhan (bukan respons API) dan sudah dihapus sebelum snapshot: dicatat, tidak dihitung pada kedua bacaan. UD-Q5: nama C51 dan sha8 = sha256 berkas untuk 14/14 unduhan B; sha yang dilaporkan arm A = sha berkas 4/4.

### 5.6 Ambang D-525 dan vonis U-DOC

| Ambang | r5 DB/DA | r5 DB2/DA2 (UD-S5) | r5b DB/DA | r5b DB2/DA2 (UD-S5) |
|---|---|---|---|---|
| UD-1a T1 <= 1,00 | LULUS (0,402) | LULUS (0,433) | LULUS (0,269) | LULUS (0,989) |
| UD-1b T2 <= 0,70 | GAGAL (16,249) | GAGAL (5,616) | GAGAL (33,482) | GAGAL (1,623) |
| UD-2 KERAS: Q1 (a) >= 99%, (b) 100%, (c) 0, (d) tabel; Q2 semua butir; Q6 (a)(b) | **GAGAL**: Q1a 94,3%; Q2 nomor bab salah (CHAPTER 4, "4.1 1.1"), riwayat revisi salah, 3 baris sumber karangan mesin; Q6 (a) keterangan ganda | **GAGAL**: sama + Q6 (b) data S2 salah | **GAGAL**: Q1a 86,8%; subbab sumber 1.1-1.4 tercetak 1.4-1.7, FM disarangkan ke bab 1; riwayat revisi salah | **GAGAL**: sama |
| UD-3 mutu (rakitan_alat 0; cacat B <= A; Q6 c B <= A) | GAGAL (lint rakitan 3 lawan 0; Q6 c 1/2 lawan 0) | GAGAL | GAGAL | GAGAL |
| UD-4 advisori | GAGAL (1,200) | LULUS (0,667) | GAGAL (1,075) | GAGAL (1,217) |
| UD-5 KERAS | LULUS | LULUS | LULUS | LULUS |
| UD-6 KERAS (ketat / analogi) | **GAGAL** / LULUS | LULUS / LULUS | LULUS / LULUS | LULUS / LULUS |

**Vonis U-DOC r5: LEBIH BURUK; r5b: LEBIH BURUK** (satu pasangan, LOW-MEDIUM). Sensitivitas: bila Q1a dinilai longgar (judul bab dianggap utuh walau "Chapter N." dipindah ke kicker), r5 tetap gagal UD-2 karena Introduction bernomor 4 dan 12 heading bernomor ganda; r5b tetap gagal karena empat subbab sumber dinomori ulang 1.4-1.7. Bila UD-2 hanya menilai kesetiaan isi (Q1b, Q1d) dan data grafik (Q6 b), r5 DB dan r5b DB lulus, dan vonis menjadi SETARA (UD-1b dan UD-3 gagal). Temuan builder arm A (tidak mengubah vonis B): alt gambar generik (DA, DA2), daftar isi tanpa halaman, rujukan `[X-C-nn]` DA dipindah ke rail tanpa kurung.

## 6. Atribusi waktu: ke mana waktu arm B (dan arm A) pergi

### 6.1 Metode (`a5/attr.py`, `a5/gap.py`)

Atribusi selang ke aksi pengakhir (research/16 §4.1.5, sama dengan r4): selang dari akhir kelompok panggilan sebelumnya sampai akhir kelompok ini dibagi menjadi **pikir** (sebelum `ts_call`; pemikiran dan pembangkitan token model) dan **eksekusi** (`ts_call` sampai `ts_result`), lalu dibebankan ke kategori panggilan itu. Waktu server Studio diukur terpisah dari `durationMs` log server. Kategori:

| Kategori | Isi |
|---|---|
| Jalur tulis | arm B: menyusun isi lalu `studio_write`/`studio_edit` (termasuk panggilan gagal); arm A: `write_file`/`patch`/edit skrip atas `laporan.md` atau builder, plus build lokal |
| Studio lain | `tool_describe`/`tool_search`/`skill_view` (penemuan alat), `studio_document_get`/`studio_search` (baca balik), `studio_file_verify`, dan `sleep` (menunggu pemutus sirkuit) |
| Verifikasi mandiri | unzip DOCX, ukur/crop PNG, `vision_analyze`, `execute_code`/`python` atas DOCX/HTML unduhan, `sha256sum`, berkas `_probe` |
| Gerbang dan engine | menjalankan gerbang naturalisasi/gaya/lint/byte gate dan membaca kode builder/lint (arm A) |
| Pencatatan | `trial-log mark/step/qmark/answer` dan penyelidikan kegagalan trial-log (`ab4.py`, `bin/trial-log`) |
| Baca bahan | `trial-log get`, membaca lembar fakta atau `source/` |
| Lain | `date`/zona waktu, perintah lokal lain |

Keterbatasan: waktu pikir dibebankan ke aksi berikutnya, sehingga pikir yang menimbang hasil Studio sebelumnya ikut ke "pencatatan" bila aksi berikutnya adalah `trial-log step`. Kategori "jalur tulis" arm B memuat waktu menyusun isi, padanan menulis Markdown di arm A.

### 6.2 U-REP (jendela START-END; detik; `a5/gap.txt`, `a5/attr_r5{,b}_urep.txt`)

| Ronde, pasangan | T B / A | Jalur tulis B / A | Studio lain B (di dalamnya `sleep`) | Verifikasi B / A | Pencatatan B / A | Baca bahan B / A | Lain B / A | Server Studio B |
|---|---|---|---|---|---|---|---|---|
| r5 R-10 | 527,6 / 99,0 | 260,6 / 40,2 | 102,4 (0) | 5,8 / 16,0 | 103,1 / 21,9 | 6,5 / 12,9 | 49,1 / 7,9 | 7,0 |
| r5 R-11 | 1.023,2 / 61,4 | 477,8 / 32,3 | 425,2 (349,2) | 0 / 0 | 93,7 / 8,7 | 21,2 / 15,0 | 5,2 / 5,4 | 9,8 |
| r5 R-12 | 462,3 / 86,7 | 254,0 / 46,3 | 103,9 (68,6) | 11,9 / 0 | 69,4 / 29,7 | 1,6 / 2,9 | 21,5 (gerbang 6,6) / 7,7 | 10,8 |
| r5b R-10 | 205,9 / 82,1 | 57,7 / 35,6 | 36,9 (0) | 19,3 / 0 | 84,3 / 30,3 | 3,3 / 2,0 | 4,5 / 14,1 | 4,6 |
| r5b R-11 | 301,3 / 123,3 | 103,9 / 47,6 | 66,5 (0) | 7,7 / 0 | 68,8 / 15,7 | 2,0 / 41,7 | 52,5 / 18,2 | 7,1 |
| r5b R-12 | 361,3 / 104,3 | 181,0 / 56,0 | 79,2 (0) | 19,3 / 0 | 47,0 / 10,4 | 8,1 / 25,9 | 26,7 / 11,9 | 9,1 |

Dekomposisi selisih B-A (jumlah tiga pasangan):

| Komponen selisih | r5 (selisih 1.766,0 s) | r5b (selisih 559,0 s) |
|---|---|---|
| Jalur tulis (menyusun isi + tulis/sunting Studio) | +873,6 s (49%) | +203,3 s (36%) |
| Studio lain (penemuan alat, baca balik, verify, sleep) | +631,5 s (36%), di antaranya `sleep` 417,8 s | +182,6 s (33%), `sleep` 0 |
| **Jalur Studio total** | **+1.505,1 s (85%)** | **+385,9 s (69%)** |
| Verifikasi mandiri | +1,8 s (0%) | +46,3 s (8%) |
| Pencatatan (termasuk friksi `TARGET_MISSING`) | +205,8 s (12%) | +143,7 s (26%) |
| Baca bahan | -1,5 s | -56,4 s |
| Lain (zona waktu, perintah lokal; r5 termasuk gerbang naturalisasi R12B 6,6 s) | +54,8 s | +39,5 s |
| Server Studio (`durationMs`) | 27,6 s (1,6% dari selisih) | 20,9 s (3,7%) |

Rincian r5b yang dapat dihapus tanpa mengubah isi: penemuan alat (`tool_describe`/`skill_view`) 33,5 / 37,6 / 44,2 s per run; penyelidikan trial-log yang menolak `--target <documentId>` 15,9 s (R10B) dan 13,0 s (R11B); deliberasi zona waktu `reportedAt` sebelum `date`/`reg query TimeZone` 44,4 s (R11B) dan 26,7 s (R12B); baca balik `studio_document_get` 19,7 s (R11B) dan 28,8 s (R12B). Sisa inti jalur tulis r5b (pikir sebelum `studio_write`/`studio_edit`) 54,2 / 96,9 / 172,1 s lawan menulis MD arm A 35,6 / 47,6 / 56,0 s: menyusun isi sebagai larik JSON dan menyunting lewat jangkar teks tetap 1,5-3,1 kali menulis/menyunting berkas.

**Jawaban untuk U-REP:** celah B/A terutama jalur Studio itu sendiri (r5b 69%), bukan kebiasaan verifikasi (8%). Di r5 sepertiganya menunggu pemutus sirkuit yang terpicu galat dapat-diperbaiki; IMPL-W3 menghapusnya (0 `sleep`). Server hanya 3,7% dari selisih.

### 6.3 U-DOC (jendela T, T1, T2; detik; `a5/gap.txt`, `a5/attr_r5{,b}_udoc.txt`)

| Ronde, pasangan, fase | T B / A | Jalur tulis B / A | Studio lain B / A | Verifikasi B / A | Gerbang+engine B / A | Pencatatan B / A | Baca bahan B / A | Server B |
|---|---|---|---|---|---|---|---|---|
| r5 DB/DA T1 | 283,5 / 705,5 | 163,0 / 293,5 | 20,0 / 43,3 | 63,8 / 3,8 | 0 / 278,6 | 10,9 / 9,4 | 25,8 / 76,9 | 4,3 |
| r5 DB/DA T2 | 331,8 / 20,4 | 222,9 / 5,2 | 90,1 / 0 | 18,8 / 6,0 | 0 / 5,4 | 0 / 3,8 | 0 / 0 | 4,8 |
| r5 DB2/DA2 T1 | 243,4 / 561,7 | 152,1 / 146,1 | 12,3 / 1,7 | 58,5 / 55,2 | 0 / 298,1 | 9,7 / 29,1 | 10,9 / 12,2 | 3,4 |
| r5 DB2/DA2 T2 | 331,8 / 59,1 | 142,7 / 0 | 20,9 / 0 | 159,8 / 28,6 | 0 / 30,5 | 8,4 / 0 | 0 / 0 | 4,5 |
| r5b DB/DA T1 | 189,6 / 705,5 | 120,2 / 293,5 | 12,8 / 43,3 | 16,9 / 3,8 | 0 / 278,6 | 21,5 / 9,4 | 18,2 / 76,9 | 2,8 |
| r5b DB/DA T2 | 683,7 / 20,4 | 15,5 / 5,2 | 2,4 / 0 | **645,7** / 6,0 | 0 / 5,4 | 20,1 / 3,8 | 0 / 0 | 3,7 |
| r5b DB2/DA2 T1 | 555,7 / 561,7 | 194,8 / 146,1 | 70,8 / 1,7 | 242,4 / 55,2 | 0 / 298,1 | 21,8 / 29,1 | 18,0 / 12,2 | 8,7 |
| r5b DB2/DA2 T2 | 95,9 / 59,1 | 28,9 / 0 | 5,9 / 0 | 43,0 / 28,6 | 0 / 30,5 | 18,1 / 0 | 0 / 0 | 4,7 |

Temuan:
- **T1: arm B lebih cepat karena arm A membaca engine dan menulis builder.** Arm A menghabiskan 278,6 s (DA) dan 298,1 s (DA2) membaca `datum_docx.py`/`datumcheck.py`/`datum_lint.py` dan menjalankan gerbang, plus 146-294 s menulis builder. Arm B tidak membayar itu. r5b DB2 kehilangan keunggulan ini karena 242,4 s verifikasi mandiri dan 70,8 s "studio lain" untuk mencoba varian `type` grafik (`column`, `stacked`, `bar`, `stackedColumn`; `tc:r5b:DB2`, catatan S1 "varian kolom/bar ditolak/cacat") yang akhirnya dibatalkan ke rev12 = rev8.
- **T2 r5 DB: jalur Studio (99% selisih).** 222,9 s jalur tulis dengan empat `TEXT_NOT_FOUND` dan satu `TEXT_AMBIGUOUS` (sel "Medium" yang muncul berulang di Table 6.1) dan 90,1 s studio lain termasuk `sleep 50` sesudah pemutus sirkuit.
- **T2 r5b DB: verifikasi mandiri (96% selisih).** Suntingan selesai dalam 47,3 s (dua `studio_edit` ok: RV-1/RV-3 teks, RV-2 sel `{cell:{row:"SEC-12",column:"Likelihood"}}`, RV-4 `{figure, chart}`); sesudahnya Hermes menjalankan 23 `execute_code` atas DOCX (zip, diff paragraf, ukur piksel PIL) dan satu `vision_analyze` sebelum mark S2. Di dalamnya ada **jeda 310,8 s** sebelum satu `execute_code` yang argumennya terbungkus ganda (`{"arguments": "{\"code\": ...`) dan ditolak "No code provided" (`sdb` pesan id 173284; isi `tool_calls` 1.309 karakter, penalaran 1.945 karakter), jadi jeda itu bukan pembangkitan teks yang panjang; hipotesis: latensi atau ulangan di sisi API (tidak dapat diverifikasi dari berkas). Tanpa jeda itu verifikasi mandiri T2 masih 334,9 s.
- **Server Studio** 2,8-8,7 s per fase (0,7-3,5%).

**Jawaban inti (seberapa besar celah B/A berasal dari jalur Studio lawan kebiasaan verifikasi Hermes):** di U-DOC r5b, hampir seluruh celah T2 DB (639,7 dari 663,3 s) adalah kebiasaan verifikasi Hermes yang tidak dilakukan arm A dalam bentuk yang sama (arm A memverifikasi DOCX 6,0 s di T2 karena builder dan gerbangnya sudah memeriksa saat build). Di U-DOC r5, celah T2 adalah jalur Studio (suntingan gagal). Di U-REP, celah adalah jalur Studio (69-85%).

## 7. Perbandingan r4 -> r5 -> r5b

Lembar fakta dan bahan U-DOC sama di ketiga ronde (lembar r5/r5b = r4 kecuali nama misi, `diff`; `bab-0*.md` identik byte), alat berbeda: r4 toolset `reports`/`documents`, r5 toolset `write` awal, r5b `write` sesudah IMPL-W3. Sumber r4: `analysis_r4/urep_time.json`, `udoc.json`, `mcp_dur.txt`; r5/r5b: `a5/urep_*.txt`, `a5/udoc_*.txt`, log server.

### 7.1 U-REP per pasangan

| Pasangan | Ronde | wall B / A (s) | T B / A (s) | T1 B / A (s) | T2 B / A (s) | r1 / r2 | Panggilan MCP server B | Galat server B (kode) | `sleep` B |
|---|---|---|---|---|---|---|---|---|---|
| R-10 | r4 | 174,7 / 89,8 | 166,8 / 80,1 | 49,4 / 28,7 | 94,5 / 49,2 | 1,725 / 1,922 | 6 | 0 | 0 |
| R-10 | r5 | 599,3 / 119,8 | 527,6 / 99,0 | 60,6 / 35,4 | 450,6 / 63,4 | 1,713 / 7,108 | 17 | 8 (`TEXT_NOT_FOUND` 5, `TEXT_AMBIGUOUS` 1, `INVALID_ARGUMENT` 1, `SECTION_MISSING` 1) | 0 |
| R-10 | r5b | 462,7 / 94,4 | 205,9 / 82,1 | 62,5 / 41,3 | 84,1 / 40,6 | 1,511 / 2,074 | 6 | 0 | 0 |
| R-11 | r4 | 333,9 / 124,6 | 246,6 / 79,8 | 94,7 / 36,1 | 142,0 / 43,6 | 2,625 / 3,257 | 10 | 0 | 0 |
| R-11 | r5 | 1.080,7 / 71,2 | 1.023,2 / 61,4 | 484,6 / 30,2 | 467,5 / 31,0 | 16,041 / 15,057 | 30 (+5 ditolak klien) | 15 (`CONTENT_INJECTION` 7, `TEXT_NOT_FOUND` 3, `SECTION_MISSING` 2, `TEXT_AMBIGUOUS` 1, `INVALID_ARGUMENT` 1, `SCHEMA_INVALID` 1) | 6 (305 s) |
| R-11 | r5b | 362,2 / 154,2 | 301,3 / 123,3 | 70,9 / 75,1 | 213,2 / 48,0 | 0,944 / 4,444 | 14 (+1 ditolak klien) | 1 (`TEXT_NOT_FOUND`) | 0 |
| R-12 | r4 | 292,4 / 112,2 | 232,9 / 107,2 | 64,1 / 63,7 | 157,8 / 35,9 | 1,006 / 4,393 | 9 | 0 | 0 |
| R-12 | r5 | 495,3 / 96,1 | 462,3 / 86,7 | 88,7 / 40,6 | 340,8 / 44,3 | 2,185 / 7,689 | 23 (+2 ditolak klien) | 8 (`TEXT_NOT_FOUND` 3, `MD_REPORT_INVALID` 2, `SECTION_MISSING` 1, `META_CONFLICT` 1, `TEXT_AMBIGUOUS` 1) | 1 (62 s) |
| R-12 | r5b | 487,3 / 117,3 | 361,3 / 104,3 | 149,8 / 61,5 | 178,6 / 42,6 | 2,438 / 4,190 | 21 | 5 (`META_MISSING`, `EDIT_INVALID`, `TEXT_NOT_FOUND`, `RECORD_FIELDS_DROPPED`, `INVALID_ARGUMENT`) | 0 |
| **Median r1 / r2 (maks r2)** | r4 / r5 / r5b | | | | | 1,725 / 3,257 (4,393); 2,185 / 7,689 (15,057); 1,511 / 4,190 (4,444) | | | |

Run lain arm B: W r4 6 panggilan 0 galat; r5 18 / 5 galat; r5b 21 / 6 galat. M r4 7 / 0; r5 18 / 6; r5b 16 / 3. Q r4 12 / 0; r5 8 / 0; r5b 16 / 0. T arm B r5b masih 1,2-1,6 kali r4 (R-10 205,9 lawan 166,8; R-11 301,3 lawan 246,6; R-12 361,3 lawan 232,9): jalur tulis minimal belum lebih cepat dari jalur `reports` r4 untuk laporan kerja.

### 7.2 U-DOC per pasangan

| Run | r4 | r5 | r5b |
|---|---|---|---|
| DB T1 / T2 / wall (s) | 938,7 / 238,0 / 1.615,8 | 283,5 / 331,8 / 752,9 | 189,6 / 683,7 / 1.416,8 |
| DA T1 / T2 / wall | 720,2 / 0,3 / 822,6 | 705,5 / 20,4 / 869,7 | = r5 |
| UD-1a / UD-1b DB/DA | 1,303 / 765,3 | 0,402 / 16,249 | 0,269 / 33,482 |
| DB panggilan server / galat / `sleep` | 86 / 18 (`SCHEMA_INVALID` 14, `INVALID_ARGUMENT` 2, `DOC_NUMBER_EXISTS` 1, `BLOCK_TYPE_NOT_ADMITTED` 1) / 3 (87 s) | 14 / 8 (`TEXT_NOT_FOUND` 4, `TEXT_AMBIGUOUS` 1, `INVALID_ARGUMENT` 1, `CONTENT_INVALID` 1, `HTTP_404` 1) / 1 (50 s) | 6 / 1 (`CONTENT_INVALID`) / 0 |
| DB2 T1 / T2 / wall | 1.133,6 / 180,2 / 1.443,4 | 243,4 / 331,8 / 829,2 | 555,7 / 95,9 / 733,7 |
| DA2 T1 / T2 / wall | 619,5 / 48,1 / 758,5 | 561,7 / 59,1 / 958,2 | = r5 |
| UD-1a / UD-1b DB2/DA2 | 1,830 / 3,750 | 0,433 / 5,616 | 0,989 / 1,623 |
| DB2 panggilan server / galat / `sleep` | 51 / 10 / 0 | 10 / 4 / 0 | 19 / 3 / 0 |
| Vonis U-DOC | LEBIH BURUK | LEBIH BURUK | LEBIH BURUK |

Jalur tulis minimal memangkas panggilan server U-DOC DB dari 86 (r4) ke 14 (r5) dan 6 (r5b), serta T1 dari 938,7 s ke 189,6 s. Kegagalan UD-2 bergeser: r4 nomor dokumen sampul, keterangan tabel, dan Gambar 5.1 (semuanya diperbaiki di r5); r5 penomoran ganda, sumber karangan mesin, keterangan ganda; r5b penyarangan FM dan renomor subbab sumber.

### 7.3 Hasil suntingan (`a5/edits_r5.txt`, `a5/edits_r5b.txt`; semua run arm B termasuk W, M, WD, DB, DB2)

| Butir | r4 | r5 | r5b |
|---|---|---|---|
| Panggilan `studio_edit` (ok / gagal) | alat tidak ada | 56 (23 / 33) | 45 (32 / 13) |
| `TEXT_NOT_FOUND` | - | 23 | 4 |
| `TEXT_AMBIGUOUS` | - | 7 | 0 |
| Galat lain `studio_edit` | - | `INVALID_ARGUMENT` 2, `RECORD_ELEMENTS_DROPPED` 1 | `EDIT_INVALID` 3, `RECORD_ELEMENTS_DROPPED` 3, `SCHEMA_INVALID` 2, ditolak klien 1 |
| Operasi `find/replace` (ok) | - | 116 (49) | 63 (43) |
| Operasi `after/insert` (ok) | - | 65 (20) | 84 (63) |
| Operasi sel `{cell:{row,column}}` (ok) | - | tidak tersedia | 33 (27) |
| Operasi posisi `{pid, at}` | - | tidak tersedia | **0** |
| Operasi `{figure, chart}` (ok) | - | 4 (3) | 8 (6) |
| `find` kurang dari 3 kata | - | 40 | 3 |
| Pencocokan longgar/samar yang terjadi | - | - | **TIDAK-DAPAT-DIHITUNG**: hasil ok tidak melaporkan pencocokan longgar; peringatan yang muncul hanya `TEXT_ESCAPED` (r5 14, r5b 17) |

Operasi dihitung dari argumen tool call (`tc:<rnd>:<RUN>`), hasil dari log server, peringatan dari `structuredContent.warnings` di `sdb`. Catatan selisih dengan D-534: log server r5 mencatat `TEXT_AMBIGUOUS` 7, bukan 18 seperti di D-534 (`TEXT_NOT_FOUND` 23 cocok); angka 18 kemungkinan menghitung kandidat atau kemunculan teks, bukan panggilan (hipotesis).

## 8. Umpan balik Hermes (swalapor; kutipan paling banyak 15 kata, dipetakan ke angka)

Sumber U-DOC: `doc_ud2/feedback_DF.md` (r5) dan `doc_ud2b/feedback_DF.md` (r5b, sesi DF hanya umpan balik, D-528). Sumber U-REP: `contract_ab5/sessions/Q_stdout.txt` (r5) dan `workspace/docs/2026-11-03_hermes-contract-ab5b/q/umpan-balik-Q.md` (r5b).

| Klaim Hermes | Kutipan | Angka baris ini | Cocok? |
|---|---|---|---|
| r5 DF: S1 arm B lebih ringan | "S1: arm B, unggul terukur pada kedua pasangan bahan." | UD-1a 0,402 dan 0,433 (T1 283,5/705,5 dan 243,4/561,7) | ya (angka Hermes 284/705, 243/562 sama) |
| r5 DF: S2 arm A lebih ringan karena sel tabel | "sel tabel bernilai umum tidak teralamatkan oleh studio_edit" | r5 DB T2: 4 `TEXT_NOT_FOUND` + 1 `TEXT_AMBIGUOUS` (sel "Medium"), jalur Studio 99% selisih T2 | ya |
| r5 DF: mesin mengubah isi tanpa izin | "empat mekanik mesin mengubah isi tanpa izin" | 12 heading bernomor ganda, 3 baris "SUMBER Compiled by Tim Riset GSP", keterangan ganda, riwayat revisi "First issue" | ya |
| r5 DF: vonis | "Layak bersyarat, per jenis dokumen." | UD-2 GAGAL; vonis protokol LEBIH BURUK | sebagian (Hermes menilai per jenis dokumen, protokol per gerbang) |
| r5b DF: T2 DB adalah verifikasi | "Yang 684 dtk itu mayoritas verifikasi mandiri penulis, bukan mesin." | 645,7 dari 683,7 s T2 = verifikasi mandiri | ya |
| r5b DF: beban token B naik | "Beban token arm B jauh lebih berat" | DB r5b 18.798.315 masuk lawan DA 7.516.511 (2,501x); r5 DB 5.854.762 | ya (sebagian dari 74 tool call pasca-END) |
| r5b DF: struktur bab | "SECTION_NESTED menelan FM ke bab 1" | Q1a 46/53; subbab 1.1-1.4 tercetak 1.4-1.7 | ya |
| r5b DF: kendali | "nomor dan halaman dikendalikan mesin, bukan penulis" | 18 PAGEREF kosong, footer REV A, nomor footer server | ya |
| r5b DF: vonis | "Layak untuk dokumen klien bermeta tetap, isi prosa, tabel, dan gambar data" | UD-2 GAGAL (struktur bab), UD-3 GAGAL (label grafik terpotong) | tidak (vonis Hermes lebih longgar daripada gerbang protokol; disajikan tanpa didamaikan, research/11 §4.9) |
| r5 Q: vonis retrieval | "Layak menggantikan MD untuk misi yang laporannya dicari kembali" | KE-4 B 5/5, median L_q B 1 = A 1 | ya untuk retrieval; sesi Q r5 tidak memuat alat tulis, jadi Hermes tidak menilai jalur tulis |
| r5b Q: usaha tulis | "Usaha menulis belum setara." | KE-1 r1 1,511, r2 4,190; T B/A 2,8x (868,5/309,7 s, angka Hermes sama) | ya |
| r5b Q: status | "meta.status tanpa kanal sunting" | status tersimpan `draft` di W, R10B, R11B r5b | ya |
| r5b Q: vonis | "Layak menggantikan MD untuk laporan kerja yang butuh registri dan retrieval terstruktur" (bersyarat E-1, E-2) | NETRAL: gerbang keras lulus, KE-1 gagal | sejalan bersyarat |

## 9. Anomali dan celah data

### 9.1 Anomali

| ID | Anomali | Bukti | Dampak |
|---|---|---|---|
| A-1 | `ab4.py phases` arm B mengambil tiga panggilan tulis/sunting ok pertama sebagai S1/S2/S3 | `a5/phases/ab5_R11B_phases.json` S1 = 459,6 s; tulis ulang S1 sah selesai 484,6 s; r5b R12B harness S1 117,3 s lawan 149,8 s | Rasio harness dilaporkan sebagai sensitivitas (§4.1.3); vonis tidak berubah |
| A-2 | `trial-log step edit --target <documentId>` gagal `TARGET_MISSING` (tanpa `--target`: `TARGET_REQUIRED`) di arm B r5b | 10 baris `ok=0` lintas W, R10B, R11B, R12B, M (umpan balik Q r5b §B butir 1); `tc:r5b:R10B` membaca `ab4.py` | Label fase arm B tidak lengkap; 15,9 s (R10B) dan 13,0 s (R11B) friksi; cacat runner milik controller |
| A-3 | Status rekaman tersimpan `draft` di W, R10B, R11B r5b | `a5/kf5.txt`; deskripsi `studio_edit` r5b di `sdb` tanpa kanal meta | Q2 arm B dinilai terhadap status tersimpan; galat penulisan tidak tertangkap KE-3/KE-7 |
| A-4 | Jeda 310,8 s di r5b DB sebelum `execute_code` berargumen terbungkus ganda | `a5/seq_r5b_DB.txt` baris +629,6; `sdb` id 173284 (`tool_calls` 1.309 karakter) | Menggelembungkan T2 r5b DB; sebab tidak dapat diverifikasi (hipotesis: latensi/ulangan API) |
| A-5 | Aktivitas sesudah END masuk `wall_s` dan token | r5b R10B 256,8 s pasca-END; r5b DB 74 tool call pasca-END (wall 1.416,8 lawan T 912,2) | Rasio wall dan token (D-543, DF r5b) tidak setara dengan T; vonis memakai T fase |
| A-6 | Sesi Q r5b menulis umpan balik sebelum END; 4 jawaban `no_qmark_start`; r5 Q1B tanpa qmark | `contract_ab5{,b}/timing.csv` Q; §0.4 | Q wall 709,6 s; L_q Q1B r5 dihitung dari toolcalls |
| A-7 | D-534 menyebut `TEXT_AMBIGUOUS` 18 di r5; log server 7 | `mcp:r5:*` | Koreksi angka controller; `TEXT_NOT_FOUND` 23 cocok |
| A-8 | Arm A memasukkan logika Rev 1 ke builder sebelum mark S1 | `tc:r5:DA` +612,7 s (patch `rev == 1`), build Rev 1 +708 s | UD-1b tidak bermakna sebagai biaya revisi; pembanding adil T1+T2 |
| A-9 | 59 berkas `_probe` di sandbox r5 DB | `doc_ud2/sandbox/db/_probe/` (1.258.395 B) | UD-6 ketat GAGAL r5 |
| A-10 | Gambar 6.1 r5 DB2 S2: Medium/Medium = 3 | PNG `a5/fig/r5_DB2_S2.png`; argumen `studio_edit` `[3,1,3,1,0,0]` | Q6 (b) gagal di perluasan r5; galat isi agen |
| A-11 | DA memindah rujukan `[X-C-nn]` ke rail tanpa kurung | `rail-manifest-rev0.json`; `a5/rail_adj.txt` | Q1 ketat arm A 42/53, 585/630; sesudah rail 52/53, 94/96 |
| A-12 | Toolset sesi Q r5 hanya 7 alat baca; brief §D menanyakan `studio_edit` | `Q_stdout.txt` r5 §B | Tidak ada vonis Hermes atas jalur tulis U-REP r5 (hanya dari DF untuk U-DOC) |
| A-13 | PNG Gambar 6.1 identik byte r5 -> r5b | sha256 `e941a3b4`/`ae6dfcb8` (`a5/fig/`) | Cacat label terpotong tidak tersentuh IMPL-W3 |
| A-14 | Pencocokan longgar tidak dilaporkan di hasil | `a5/edits_r5b.txt` (peringatan hanya `TEXT_ESCAPED`) | Jumlah suntingan yang cocok secara longgar TIDAK-DAPAT-DIHITUNG |
| A-15 | Folder kosong `2026-11-03_hermes-contract-ab5/r12b/` | `find` 0 berkas | Tidak dihitung (bukan berkas) |

### 9.2 Celah data

- Lint Studio per aturan (UD-Q3 arm B utama) tidak diekspor per aturan; diganti datum_lint.
- G_B,stored diterima dari `ke3_dryrun.csv` controller (30/30), tidak diulang (larangan panggilan DEV).
- FD_B taksiran analis (LOW). MU-1 (SQL) tidak dihitung (larangan DB). Status transien S1/S2 (fakta `manual`) tidak dihitung.
- Tidak ada render Word/PDF: nomor halaman daftar isi dan tata letak halaman nyata tidak terukur di kedua arm.
- Isolasi host gagal di semua run (informatif D-442); sensitivitas (5) tidak dapat dihitung.
- n = 3 pasangan U-REP, 1 + 1 pasangan U-DOC; DA/DA2 r5b memakai data r5 (hari sama, bukan pasangan segar).
- Atribusi pikir ke aksi pengakhir adalah proksi; pikir sebelum `trial-log step` bisa berisi penilaian hasil Studio sebelumnya.

## 10. Rekomendasi: apa yang membuat Studio setidaknya secepat Markdown untuk Hermes

Dasar: atribusi §6. Taksiran di bawah adalah aritmetika atas kategori terukur, bukan hasil uji.

### 10.1 Perubahan sisi alat

| ID | Perubahan | Bukti | Dampak taksiran |
|---|---|---|---|
| T-1 | Kanal meta di `studio_edit` (mis. `{meta:{status, verdict, reportedAt}}`) | Status tersimpan salah 3/5 dokumen r5b; R12B harus menulis ulang via `studio_write` (`RECORD_FIELDS_DROPPED` di tengah) | Status benar tanpa tulis ulang; menutup selisih Q2 |
| T-2 | Hasil `studio_write`/`studio_edit` memuat ringkasan verifikasi yang biasa dicari Hermes: teks paragraf sesudah suntingan beserta alamatnya, mode cocok (persis/longgar), daftar heading bernomor, keterangan tabel/gambar, dan cek tata letak grafik yang menangkap tinta di tepi kanvas | r5b DB 645,7 s verifikasi T2 (23 `execute_code` + `vision_analyze` atas DOCX); r5b DB2 242,4 s di T1; U-REP r5b baca balik 19,7-28,8 s + verifikasi 7,7-19,3 s per run | Menghapus alasan verifikasi mandiri; hingga 640 s di r5b DB |
| T-3 | Margin kiri renderer grafik mengikuti label kategori terpanjang | Label terpotong 1 (S1) dan 2 (S2), identik r4 DB2, r5, r5b | UD-3 Q6 (c) B = A |
| T-4 | Hormati judul dan nomor sumber: "Chapter N." dan subbab 1.1-1.4 tetap; jangan sarangkan bagian depan tanpa nomor; opsi `numbering: "source"` | Q1a 50/53 (r5), 46/53 (r5b); "4.1 1.1" (r5); 1.4-1.7 (r5b) | UD-2 Q1a dan Q2 penomoran |
| T-5 | Riwayat revisi menambah baris, uraian dari meta utuh; huruf REV di sampul/footer ikut revisi; nomor meta di footer | Riwayat S2 "Rev 1 / First issue" tanpa Rev 0; footer nomor server (D-530) | UD-2 Q2 lembar kendali |
| T-6 | Mode hasil ringkas: `nextSteps`, daftar `correlationIds`, dan blok kandidat hanya bila diminta; deskripsi alat lebih pendek | Masuk per panggilan B/A r5b median 2,144 (r4 1,470); hasil Studio rerata 4,4-6,3 KB; `tool_describe` 10,6-17,0 KB per run | Konteks per giliran lebih kecil |
| T-7 | `downloadDir` pada `studio_write`/`studio_edit` (tulis + unduh + cek sha satu panggilan) | `studio_file_verify` 3,4-9,2 s per run U-REP r5b + 1 giliran | -1 giliran per laporan |
| T-8 | Laporkan pencocokan longgar sebagai peringatan; pertahankan urutan beberapa `after/insert` berjangkar sama; tolak eksplisit `type` grafik yang membuang `stacked` | A-14; umpan balik Q r5b §D butir 4; DF r5b ("`stacked` dibuang diam-diam") | Auditabilitas, lebih sedikit ulangan |

### 10.2 Perubahan brief atau instruksi (dan runner)

| ID | Perubahan | Bukti | Dampak taksiran |
|---|---|---|---|
| B-1 | Nyatakan di brief: alat sudah memverifikasi sha, kelengkapan, dan tata letak; jangan membuka zip, crop, atau `vision_analyze` kecuali hasil alat melaporkan masalah (setelah T-2 tersedia). Arm A tidak melakukan verifikasi sebesar itu karena gerbangnya berjalan di dalam build | §6.3; arm A T2 verifikasi 6,0 s | r5b DB T 912,2 -> sekitar 272 s (T2 683,7 -> sekitar 44 s), T/T_A sekitar 0,37 |
| B-2 | Sertakan skema ringkas `studio_write`/`studio_edit` di brief agar `tool_describe` tidak perlu | 33,5 / 37,6 / 44,2 s penemuan alat per run U-REP r5b | -34 sampai -44 s per run |
| B-3 | Tetapkan bentuk `reportedAt` (mis. tanggal mesin `YYYY-MM-DD`) | Deliberasi zona waktu 44,4 s (R11B), 26,7 s (R12B) | -27 sampai -44 s |
| B-4 | Runner: `trial-log step edit` menerima `documentId` untuk arm B (milik controller) | A-2 | -13 sampai -16 s; label fase bersih |
| B-5 | Sesi Q: tandai END sebelum menulis umpan balik | §0.4 (519,5 s di jendela r5b) | Wall Q tidak tercemar |
| B-6 | Protokol U-DOC: `revisi.md` baru dibuka sesudah mark S1 di kedua arm, atau UD-1b memakai T1+T2 | A-8 | UD-1b bermakna |

### 10.3 Apakah itu cukup untuk paritas?

- **U-DOC (dokumen klien):** ya untuk waktu. Dengan B-1 (didukung T-2), DB r5b diperkirakan 272 s lawan DA 726 s. Kelayakan mutu tetap bergantung T-3, T-4, T-5 (UD-2 dan UD-3 gagal karena hal milik mesin).
- **U-REP (laporan kerja):** belum. Mengurangi penemuan alat, friksi trial-log, zona waktu, baca balik, verifikasi mandiri, dan `studio_file_verify` dari T arm B r5b memberi taksiran 129,3 / 169,7 / 236,1 s lawan T arm A 82,1 / 123,3 / 104,3 s (1,57 / 1,38 / 2,26). Sisa selisih adalah pikir menyusun isi sebagai larik dan menyunting lewat jangkar (54,2 / 96,9 / 172,1 s lawan menulis MD 35,6 / 47,6 / 56,0 s) dan pikir di sekitar pencatatan (47-84 s lawan 10-30 s). Paritas laporan kerja kemungkinan butuh S2/S3 berbentuk "ganti isi bagian ini dengan teks berikut" (padanan menyunting berkas, tanpa mencari jangkar) atau penerimaan Markdown per bagian. Rekomendasi ini perlu keputusan USER karena menyentuh prinsip D-521 (larik per paragraf).

## 11. Key Findings dan asumsi (Tier 1)

### 11.1 Key Findings

1. U-REP r5 dan r5b: NETRAL. Keandalan terjaga (G_B,stored 30/30, retrieval B 5/5, D_raw,B 0, K_B 3/3), kecepatan tidak: median r1 2,185 -> 1,511, median r2 7,689 -> 4,190.
2. IMPL-W3 menghapus pemutus sirkuit (8 `sleep` dan 7 penolakan klien di semua run r5 -> 0) dan memangkas galat server arm B U-REP 31 -> 6 serta `TEXT_NOT_FOUND`+`TEXT_AMBIGUOUS` semua run 30 -> 4.
3. IMPL-W3 memperkenalkan galat penulisan diam: status rekaman tidak dapat disunting, 3/5 dokumen arm B r5b tersimpan `draft`.
4. U-DOC r5 dan r5b: LEBIH BURUK oleh UD-2 (struktur bab/subbab dan riwayat revisi diubah mesin), padahal UD-1a kini lulus (0,402 dan 0,269) dan isi teks/tabel setia (630/630 dan 633/633 token, tabel identik).
5. Waktu server Studio 0,7-3,7% dari selisih; celah U-REP ada di jalur Studio (69% r5b), celah U-DOC r5b ada di verifikasi mandiri Hermes (96% T2 DB).
6. Q r5b 709,6 s karena umpan balik ditulis di dalam jendela sesi (519,5 s) dan kueri arm B diulang.

### 11.2 Asumsi dan celah

| Asumsi | Dasar | Risiko bila salah |
|---|---|---|
| Akhir fase arm B dari panggilan ok di log server, dipisah oleh label `step edit S1` pertama | P5-3; label arm B tidak lengkap (A-2) | Bila Hermes menulis isi S2 sebelum label S1, T1 terlalu panjang; diperiksa manual di `a5/seq_dump.py` untuk 6 run |
| Status tersimpan dibaca dari HTML render terakhir di sandbox | Tidak ada tulis/sunting ok sesudah `studio_file_verify` terakhir di run B U-REP (dicek `a5/seq_dump.py`) | Bila server berubah sesudah unduhan, kunci Q2 bergeser |
| Kelompok kode KE-3 (skema/kontrak, argumen, alamat) | research/11 §4.3 menyebut kode skema/kontrak | Bila galat argumen dihitung, r5b KE-3 gagal (Σ 4, maks 4) |
| `_probe` dinilai dengan bacaan ketat sebagai utama | D-525 | Bacaan analogi membuat UD-6 r5 lulus; vonis tetap LEBIH BURUK oleh UD-2 |
| Nilai grafik dari PNG | Bilangan bulat kecil pada garis kisi | Rendah |
| Jeda 310,8 s = latensi API | Isi pesan pendek | Bila model memang berpikir lama, kategori tetap verifikasi mandiri |

## 12. Koreksi atas cacat skrip r4 (verification/12 L-1..L-8)

| Cacat | Koreksi di `a5/` |
|---|---|
| L-1 pembelah `;` di dalam kutipan; L_q memasukkan `answer` | `common.split_cmd` sadar kutipan; `lq.py` menghitung aksi pencarian per arm dan tidak memecah heredoc |
| L-2 kunci Q5 arm A ambigu | Aturan Q_key ditulis eksplisit per ronde di `retrieval5.py` (r5: semua baris bernilai; r5b: baris dalam rentang yang ditunjuk) |
| L-3 regex keterangan menangkap paragraf badan | `docxcheck5.py`: keterangan = pola DAN bukan paragraf sumber; plus cek keterangan tepat sebelum tabel |
| L-4 deskripsi pemotongan berlebih | Pemotongan diukur sebagai piksel tinta di kolom x=0 (`a5/fig/`), huruf disebut "terpotong sebagian" |
| L-5 bentuk dimasukkan ke Q6 (b) | Bentuk dilaporkan terpisah dari data |
| L-6 DATUM-38 menghukum nama C51 | datum_lint dijalankan atas salinan bernama asli; DATUM-38 dikeluarkan dari `rakitan_alat` |
| L-7 proksi G_B,stored | G_B,stored kini diukur (`ke3_dryrun.csv`) |
| L-8 berkas %TEMP% tanpa ajudikasi | Semua berkas S3 diperiksa rujukan path/basename di toolcalls (`prov.py`) |

## 13. Files/Modules Involved dan perintah reproduksi (baca saja)

Skrip di `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/analysis_r5/`: `common.py` (ronde r4/r5/r5b, `match_server`, `split_cmd`), `seq_dump.py`, `urep.py`, `attr.py`, `gap.py`, `kf5.py` (+ `kf_r4_orig.py`), `retrieval5.py` (+ `htmlpid.py` diperluas `data-block`), `lq.py`, `prov.py`, `udoc5.py`, `docmap.py`, `docx_extract.py`, `docxcheck5.py` (+ `docxcheck_r4_orig.py`), `rail_adj.py`, `q4diff.py`, `edit_outcomes.py`, `sdb.py` (salinan `statedb/state.db`, `mode=ro`), `ga_checker.py`. Keluaran: `urep_r5{,b}.txt/.json`, `attr_*.txt`, `gap.txt/.json`, `kf5.txt`, `retrieval_r5{,b}.txt`, `lq_r{4,5,5b}.txt`, `prov_*.txt`, `udoc_r5{,b}.txt/.json`, `docx_all5.txt/.json`, `dump/`, `fig/`, `q4diff.txt`, `rail_adj.txt`, `datum_lint5.txt`, `edits_r5{,b}.txt`, `ga5.txt`, `phases/`.

```
cd C:/Users/TRIAL/AppData/Local/Temp/hermes_trial
for h in ab5 ab5b; do for r in W R10B R10A R11A R11B R12B R12A M WD DB DB2; do python harness_$h/ab4.py phases $r --out analysis_r5/phases/${h}_${r}_phases.json; done; done
cd analysis_r5
python urep.py r5; python urep.py r5b
python gap.py; python attr.py r5b Q
python kf5.py r5 r5b; python retrieval5.py r5; python retrieval5.py r5b; python lq.py r5; python lq.py r5b
python prov.py r5 R10B R11B R12B W M; python prov.py r5b DB DB2 WD
python udoc5.py r5; python udoc5.py r5b; python docxcheck5.py; python q4diff.py; python rail_adj.py
python edit_outcomes.py r5; python edit_outcomes.py r5b
python -c "import csv;print(sum(r['valid']=='true' for r in csv.DictReader(open('../contract_ab5b/sessions/ke3_dryrun.csv'))))"
```

Data uji, runner, dan repo tidak diubah; satu-satunya berkas yang ditulis di repo adalah laporan ini.

## 14. Acceptance Criteria (ANALYSIS-R5)

| Kriteria penugasan | Status | Bagian |
|---|---|---|
| U-REP r5 dan r5b terpisah: KE-1 (fase, r1/r2, ambang), KE-2..KE-6, vonis | terpenuhi | §4 |
| Penjelasan Q 709,6 s lawan 204,2 s | terpenuhi | §0.4 |
| U-DOC r5 dan r5b: UD-1a/1b, UD-N/K/G, UD-Q1..Q6 dengan docxcheck terkoreksi, cek khusus (nomor sampul, keterangan tabel, Gambar 6.1, "4.1 1.1", baris sumber, teks revisi, data grafik S1/RV-4, crop PNG), UD-J dan ajudikasi `_probe`, vonis | terpenuhi | §5 |
| Atribusi waktu arm B dan arm A per kategori; jawaban porsi jalur Studio lawan verifikasi mandiri | terpenuhi | §6 |
| Tabel r4 -> r5 -> r5b (wall, fase, MCP, galat per kode, `sleep`, hasil suntingan) | terpenuhi; pencocokan longgar TIDAK-DAPAT-DIHITUNG | §7 |
| Vonis Hermes dengan kutipan <= 15 kata dipetakan ke angka | terpenuhi | §8 |
| Rekomendasi alat lawan brief | terpenuhi | §10 |
| Tanpa git, tanpa tulis DB, tanpa panggilan DEV, rahasia tidak dibaca, data uji tidak diubah | terpenuhi | §13 |
