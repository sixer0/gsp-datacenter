---
schema_version: 1.0
task_id: doc_artifact_studio
task_row: ANALYSIS-R4 (analisis uji putaran 4; protokol research/17_efficiency_protocol_r4.md §6.6-§6.9 U-DOC dan §7.5-§7.8 U-REP; keputusan D-422, D-435, D-442, D-458, D-476, D-481, D-498, D-511..D-519)
date: 2026-11-03
agent: coder-execution (baris analisis, bukti dihitung dengan skrip)
type: performance
confidence: MEDIUM untuk U-REP (n = 3 pasangan; waktu, langkah, token, galat, retrieval, KF, asal-usul dihitung mekanis dari berkas uji); LOW-MEDIUM untuk U-DOC (n = 1 pasangan utama + 1 pasangan perluasan; mutu DOCX dihitung docxcheck buatan baris ini + inspeksi visual PNG grafik; lint Studio per aturan tidak tersedia di berkas)
inputs: research/17 (utuh); research/16 (ringkasan, §4.1.4); research/11 §4.3-§4.8; research/15 §6.1-§6.4; decisions.md D-422, D-435, D-442, D-458, D-476..D-519; hermes_trial/09_r4_report_trial_brief.md, 09_r4_doc_trial_brief.md, 09_r4_facts_manifest.md (utuh); data BACA SAJA Temp/hermes_trial/contract_ab4/, doc_ud1/, controller_ab4/ (toolcalls, mcpcalls, answers), harness_ab4/ab4.py (baca kode), folder run Hermes 2026-11-02_hermes-contract-ab4/ dan 2026-11-02_hermes-doc-ud1/
tools: skrip Python stdlib di Temp/hermes_trial/analysis_r4/ (daftar §12); datum_lint skill datum-house-style dijalankan atas DOCX (baca saja); tanpa git, tanpa DB, tanpa panggilan server DEV, berkas rahasia tidak dibaca
plan_draft: dilewati (baris analisis docs-only; usulan di §9)
status: complete
---

# ANALYSIS-R4: Hasil uji efisiensi putaran 4 (U-REP laporan kerja MCP lawan MD bebas; U-DOC dokumen klien MCP Studio lawan builder lokal)

Konvensi: angka desimal memakai koma. Epoch ditulis utuh atau sebagai detik relatif. Sumber `aN/<berkas>` berarti `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/analysis_r4/<berkas>` (keluaran skrip baris ini). Sumber `tc:<RUN>` = `controller_ab4/toolcalls/<RUN>_toolcalls.csv`; `mcp:<RUN>` = `controller_ab4/mcpcalls/<RUN>_mcpcalls.csv` (log server per panggilan dengan `durationMs`). Ambang U-DOC (§6.8) adalah **usulan controller** (D-476), belum keputusan USER, dan dilabeli demikian di setiap vonis U-DOC.

## 0. Ringkasan vonis

### 0.1 U-REP (laporan kerja, 3 pasangan R-10, R-11, R-12)

| Metrik | Nilai utama | Ambang | Vonis |
|---|---|---|---|
| KE-1 (a) komposisi pertama | r1 = T1_B/T1_A: R-10 1,725; R-11 2,625; R-12 1,006; median **1,725** | median r1 <= 1,00 (D-422) | **GAGAL** |
| KE-1 (b) pembaruan | r2 = T2_B/T2_A: 1,922; 3,257; 4,393; median **3,257**, maks **4,393** | median <= 0,70 DAN maks <= 1,00 | **GAGAL** (kedua syarat) |
| KE-1 utuh | (a) GAGAL, (b) GAGAL; semua sensitivitas 1-4 dan 6 GAGAL (§4.1.3); sensitivitas 5 TIDAK-DAPAT-DIHITUNG (9/9 run `host_bersih=tidak`) | (a) DAN (b) | **GAGAL** |
| KE-2 langkah (advisori) | N_agent B/A: 38/16 = 2,375; 45/15 = 3,000; 52/20 = 2,600; median **2,600** | median <= 1,00 | **GAGAL** (advisori) |
| KE-3 galat format | Log server: Σ G_B,4xx 0, G_B,klien 0, G_B,draft 0, G_env 0; G_B,stored TIDAK-DAPAT-DIHITUNG persis (dry-run R08 tidak pernah dijalankan), proksi 0; Σ G_A (checker ketat) 6 | stored 0 KERAS; Σ 4xx <= 3, maks <= 2; Σ G_B < Σ G_A | **LULUS** (stored = proksi). Sensitivitas + 3 panggilan alat di luar toolset R12B: Σ 3, maks 3 (melewati maks 2) |
| KE-4 retrieval | B 5/5, A 4/5; median L_q B 2 <= A 3 | B 5/5 KERAS DAN median L_q(B) <= median L_q(A) | **LULUS** (kunci Q5 B menurut padanan aturan rujukan kasar arm A; tafsir harfiah: B 4/5 = GAGAL KERAS, §4.4) |
| KE-5 jejak disk | D_raw,B (D-442 + §7.7) = 0/0/0 sesudah ajudikasi; postcheck mentah 1/2/1 = laporan MD tergolong "lainnya" karena postcheck mencari baris CLI, bukan panggilan MCP (§4.5); F_name 3/3, F_sha 3/3 | D_raw,B = 0 KERAS; F_name = F_sha = 100% | **LULUS** sesudah ajudikasi |
| KE-6 beban pikir format | FL utama B 0/1/3 (median 1) lawan A 0/0/0 (median 0); FD_B 2/2/2 (taksiran analis, LOW) | FD_B <= 2 DAN median FL_B <= median FL_A | **GAGAL** (FL). Sensitivitas FL + FL_tpl: B 1/2/4 median 2, GAGAL |
| KE-7 kelengkapan | K_B 3/3 (render `requireComplete` sukses); KF_B 38/38, 33/37 (89,2%), 33/33; KF_A 100% di ketiganya | K_B 100% KERAS; KF_B = 100%; KF_B >= KF_A | K_B **LULUS**; KF **GAGAL** (R-11: 4 fakta dengan notasi rentang diubah, 1 di antaranya hilang isi) |
| TK-1 token (informatif) | token masuk per `api_call` B/A: 1,323; 2,195; 1,470; median **1,470**; B per panggilan 63.236 / 110.286 / 70.690 | usulan controller: median <= 1,25 | Tanda pengecil token **tidak tercapai** |

Gerbang keras D-362: (1) 0 menyimpang skema: **LULUS-proksi** (tidak ada R08 dry-run; semua submit/update `ok:true` di server dan `studio-report check --remote` postcheck valid 0 isu); (2) retrieval 5/5: **LULUS** pada kunci utama; (3) 0 berkas mentah: **LULUS** sesudah ajudikasi; (4) K_B 100%: **LULUS**.

**Vonis gabungan U-REP (`11:178-180`): NETRAL (keputusan USER).** Semua gerbang keras lulus pada definisi utama, KE-1 dan KE-6 gagal. Dua catatan yang wajib disajikan: (a) dengan kunci Q5 harfiah, KE-4 gagal sehingga vonis menjadi TIDAK EFEKTIF; (b) R12B melanggar larangan arm B "HTTP langsung" (6 GET `/api/studio/...` lewat `trial-log get`), karena alat pencari dokumen yang diminta brief tidak ada di toolset `reports` (§8 A-3). Run dinilai dengan tanda `penyimpangan_http`. Uji ini adalah izin USER D-475 untuk satu uji baru, bukan siklus keempat KE-1.

### 0.2 U-DOC (dokumen klien; pasangan utama DB lawan DA, perluasan DB2 lawan DA2)

| Metrik (§6.7) | DB (B) / DA (A) | DB2 (B) / DA2 (A), informatif | Ambang usulan controller (§6.8) | Vonis pasangan utama |
|---|---|---|---|---|
| UD-1a T1 (START harness sampai mark S1) | 938,654 / 720,196 s = **1,303** | 1.133,557 / 619,517 s = 1,830 | <= 1,00 | **GAGAL** |
| UD-1b T2 (mark S1 sampai mark S2) | 238,008 / 0,311 s = 765,3 (artefak, §5.1) | 180,184 / 48,052 s = 3,750 | <= 0,70 | **GAGAL** (T2_A tidak terukur wajar: arm A membangun Rev 0 dan Rev 1 dalam satu jalan build sebelum mark S1) |
| UD-2 mutu KERAS arm B | Q1 isi 53/53 paragraf, 630/630 token, tabel 3/3 identik; tetapi Q2: nomor sampul `016/GSP/KT/X/2026` (bukan `GSP-UD1-NL-001`), 0 keterangan tabel; Q6 nomor `Gambar 5.1` dan sumber tidak tampil | Q1 51/53 paragraf (96,2%: awalan "Chapter 6."/"Chapter 10." dibuang importer), nomor `GSP-UD1-NL-001-DB2B` | Q1 >= 99%, 100%, 0, tabel sama; Q2 semua butir; Q6 (a)(b) | **GAGAL** |
| UD-3 mutu | datum_lint B 4 FAIL rakitan (DATUM-05, -10, -14, -38) lawan A 0; cacat docxcheck B 6 lawan A 3; Gambar 6.1 cacat tata letak 0 lawan 0 tetapi bentuk berkelompok, bukan bertumpuk | Gambar 6.1 B: 1 (S1) dan 2 (S2) label kategori terpotong; A 0 | rakitan_alat 0; cacat B <= A; Q6 (c) B <= A | **GAGAL** |
| UD-5 galat tidak pulih arm B | 0 (18 galat server pulih semua) | 0 (10 galat pulih) | = 0 KERAS | LULUS |
| UD-6 asal-usul + UD-Q5 | D_raw,B 0 sesudah ajudikasi (2 draf bab sah); nama C51 dan sha 2/2 | 0 sesudah ajudikasi (6 draf bab); 3/3 | 0 dan 100% KERAS | LULUS |
| UD-4 langkah (advisori) | 164 / 46 = 3,565 | 153 / 41 = 3,732 | <= 1,00 | GAGAL (advisori) |
| UD-7 token (informatif) | masuk 6,385x; per panggilan 222.877 / 100.436 = 2,219 | 3,182x; 1,196 | informatif | - |

**Vonis U-DOC (usulan controller, satu pasangan, confidence LOW-MEDIUM): LEBIH BURUK.** Gerbang KERAS UD-2 arm B gagal (sampul tanpa nomor dokumen dari `meta.md`, tabel tanpa keterangan, Gambar 6.1 bernomor 5.1), dan UD-1a, UD-1b, UD-3 juga gagal. Pasangan perluasan DB2/DA2 (urutan A lalu B, informatif UD-S5) memberi arah yang sama. Sensitivitas: bila butir nomor sampul dianggap galat lingkungan (nomor itu sudah dipakai run pemanasan WD di misi yang sama, §8 A-6), UD-2 tetap gagal oleh tabel tanpa keterangan dan nomor gambar, jadi vonis tetap LEBIH BURUK. Bias urutan pada uji ini justru menguntungkan arm B (WD berlatih penuh dengan bahan yang sama sebelum DB, §8 A-6), sehingga kesimpulan "tidak lebih cepat" konservatif.

**Inti temuan waktu (kedua uji):** waktu arm B tidak habis di server. Total `durationMs` server per run U-REP B 5,0-5,8 s (2,2-3,0% dari T); per run U-DOC B 7,5-9,7 s (0,6-0,8%). Sebanyak 86-90% (U-REP B) dan 71-97% (U-DOC B; DB 71% karena subagen `delegate_task` 185 s tercatat sebagai eksekusi alat) dari T adalah jeda model di antara panggilan alat, angka yang sama besarnya di arm A (86-94%). Biaya B berasal dari jumlah giliran (api_calls B/A 1,45-2,19x di U-REP, 2,66-2,88x di U-DOC) dan konteks per giliran yang lebih besar (1,2-2,2x), ditambah pencarian skema dan kode sumber saat alat tidak menjelaskan bentuk data (§9).

## 1. Source Tasks

| Sumber | Isi yang dipakai |
|---|---|
| research/17 §6.6-§6.9 | Langkah sesi U-DOC, metrik UD-T1..UD-J, ambang usulan controller UD-1a..UD-7 dan aturan vonis LEBIH BAIK/SETARA/LEBIH BURUK, sensitivitas UD-S1..S5 |
| research/17 §7.5-§7.8 | Urutan U-REP, KE-1 dengan batas arm B dari `ts_result` submit/update (E4-03), ambang D-422 terpisah, aturan asal-usul KE-5 §7.7 butir 1-6, isolasi informatif D-442 |
| research/17 §5 E4-04, E4-05, E4-07 | KE-2 satu pemanggilan alat = 1 (penanda tidak dihitung); kelas galat G_B,4xx/klien/draft/G_env; FL utama MCP (`studio_registry`, `get_prompt studio_laporan_kerja`, `read_resource studio://resep/*`), FL_tpl = `studio_report_template` |
| research/11 §4.3, §4.6-§4.8; research/15 §6.1-§6.4 | Rumus KE-3 (klausul Σ G_A), KE-6 FD/FL, KE-7 K/KF, vonis gabungan `11:178-180`, sensitivitas KE-1 1-5 |
| D-422 | KE-1 dipisah: (a) median r1 <= 1,00; (b) median r2 <= 0,70 dan tidak ada pasangan > 1,00 |
| D-442, D-435 | KE-5 hanya berkas yang terbukti disentuh run lewat log sesi; isolasi host informatif |
| D-458 | Preseden hitung ketat (berkas sesaat R9B dihitung; vonis ketat dan sensitivitas dilaporkan berdampingan) |
| D-476 | Protokol r4 diterima; ambang U-DOC dikunci controller sebelum uji (label usulan controller) |
| D-481, D-498 | Gambar foto dikeluarkan dari kedua arm; Gambar 6.1 berbasis data + RV-4 masuk U-DOC (UD-Q6, UD-2 Q6 a-b KERAS, UD-3 Q6 c) |
| D-511..D-519 | Freeze per run (meta `freeze_sha256`, semua `freeze_check=OK`): W `0bc87d2d`; R10B..R12A, M, dan Q `cd2fda93` (tidak ada `freeze --force` sebelum Q, sesuai temuan §8 A-4); WD dan DB `23a95a93`; DA, DA2, DB2, DF `f126e0c4` (sesudah perbaikan D-517); kode Studio commit `84c0aa2`; perbaikan alat pasca-run (`phases`, `postcheck`) tidak memengaruhi sesi |
| hermes_trial/09_r4_facts_manifest.md §5, §6, §7.3 | Tabel token KE-7 per fakta (beku), desain Q1..Q5, acuan docxcheck |
| controller_ab4/answers/Q_key.md | Aturan kunci simbolik Q1..Q5 (diselesaikan baris ini secara mekanis karena `Q_key_resolved.md` tidak pernah ditulis, §8 A-4) |
| research/16 | Pembanding r3 (§7) |

## 2. Exploration & Collection Summary (Tier 2)

| Fakta | Bukti | Mengapa penting | Cara verifikasi |
|---|---|---|---|
| 15 ekspor toolcalls dan 9 log server MCP tersedia; semua run exit 0 | `controller_ab4/toolcalls/*.csv`, `mcpcalls/*.csv`; meta `exit_code=0` | Sumber utama KE-2, KE-3, UD-N, UD-G | `ls`; `aN/urep_time.txt`, `aN/udoc.txt` |
| Kolom `mcp_ok` di toolcalls bernilai `?` untuk SETIAP panggilan yang di log server `ok:false` (WD 9/9, DB 18/18, DB2 10/10); tidak ada satu pun `false` | crosstab `aN/reconcile.py` (fungsi `crosstab`); parser `ab4.py:1697-1714` hanya mengenali pola teks ok tertentu | Meta `toolcalls_n_mcp_galat=0` dan D-517/D-518 "0 galat MCP" untuk WD, DB, DB2 **keliru**; galat sebenarnya dari log server | `python reconcile.py WD DB DB2` |
| Selisih hitung MCP toolcalls lawan log server dijelaskan tuntas (§4.3.2) | `aN/reconcile.py` | Meminta penugasan | idem |
| Brief U-REP §5 meminta `studio_contracts_query`/`studio_search` untuk R12B, tetapi toolset `reports` (9 alat) tidak memuatnya | log server R12B `toolsets:["reports"]` (`mcp:R12B` stderr baris 3); 3 panggilan `?` tanpa jejak server | Penyebab penyimpangan HTTP R12B dan 3 galat pra-server | `mcpcalls/R12B_stderr_slice.log` |
| Arm A U-DOC menandai S1, S2, END dalam 0,6 s di akhir sesi (DA) karena satu jalan build menghasilkan Rev 0 dan Rev 1 sekaligus | `doc_ud1/timing.csv` DA seq 15-22; `tc:DA` baris 30-48 | UD-1b tidak terukur wajar | `aN/dumptc.py DA` |
| Prompt DF identik dengan brief umum (ARM `-`), bukan prompt umpan balik akhir §6.6; Hermes memilih arm A dan membangun dokumen ketiga | `doc_ud1/sessions/prompt_DF.txt:1-6` (diff terhadap prompt DA2); `feedback_DF.md` bagian C butir 1 | Vonis Hermes (V-1) untuk U-DOC tidak ada; DF hanya informatif | `diff` prompt |
| Run pemanasan WD memakai bahan asli `ud1/source/`, bukan bahan sintetis `doc_ud1/wd/` | `prompt_WD.txt:16`; `sandbox/wd/bab-06-rev1.md` sha `4892f156...` sama dengan `sandbox/db/bab-06-rev1.md` | Bias urutan berbalik menguntungkan B; nomor `GSP-UD1-NL-001` sudah terpakai sebelum DB (sebab `DOC_NUMBER_EXISTS`) | `sha256sum` |
| HTML render final U-REP memuat atribut `data-block-id` per blok | `contract_ab4/sandbox/*/*.html` | Kunci Q3/Q5 arm B dapat diselesaikan dari render tersimpan tanpa memanggil DEV | `aN/htmlpid.py` |
| docxcheck (H4-11) tidak pernah dibangun di `ab4.py`; dibangun di `analysis_r4/` (`docx_extract.py`, `docxcheck.py`, `docx_all.py`), stdlib saja | Grep `docxcheck` atas `harness_ab4/ab4.py` = 0 | Q1-Q4 diukur dengan alat baru; diberi label | `aN/docx_all.txt` |

## 3. Overview (Tier 1, 5W1H)

- **Apa**: menghitung hasil dan vonis dua uji putaran 4 (U-REP 3 pasangan + M + Q; U-DOC 2 pasangan + WD + DF) menurut definisi protokol r4 apa adanya.
- **Siapa**: Hermes `gsp-master01` (pelaku), controller (harness, freeze, ekspor), baris ini (analisis). USER memutuskan adopsi dan ambang U-DOC.
- **Kapan**: sesi 2026-11-02 22:44Z sampai 2026-11-03 01:22Z (meta `start_utc`/`end_utc`); analisis 2026-11-03.
- **Di mana**: DEV 9021 beku pada commit `84c0aa2`; data di `Temp/hermes_trial/`; analisis di `Temp/hermes_trial/analysis_r4/`.
- **Mengapa (rantai bukti)**: r3 menunjukkan biaya tetap per langkah CLI (research/16 §4.1.5); r4 memindahkan arm B ke MCP (tanpa start proses per langkah, basis diingat sesi) dan menambah alat dokumen + figur. Pertanyaannya apakah itu cukup untuk D-422 (laporan kerja) dan untuk mengungguli builder lokal (dokumen klien).
- **Bagaimana**: skrip stdlib membaca timing.csv, toolcalls, log server, usage, postcheck, snapshot, laporan MD, HTML render, dan DOCX. Tidak ada angka yang diketik tangan dari ingatan; setiap tabel menyebut berkas keluaran skrip.
- **Alternatif yang ditolak**: (a) menjalankan R08 dry-run atau R20 ke DEV untuk G_B,stored dan kunci Q: dilarang penugasan (tanpa panggilan DEV), sehingga dipakai proksi dan render tersimpan, dengan label; (b) memakai `mcp_ok` toolcalls untuk KE-3/UD-G: ditolak karena terbukti salah baca (§2).
- **Asumsi dan celah**: §11.

## 4. U-REP: hasil per metrik

### 4.1 KE-1 Waktu (D-422)

#### 4.1.1 Batas dan segmen

- START harness = baris `scenario_marker START src=harness` di `contract_ab4/timing.csv`.
- Arm B: akhir S1/S2/S3 = `ts_result` panggilan `studio_report_submit` (S1) atau `studio_report_update` (S2, S3) yang ok, dari `<RUN>_phases.json` (sumber `toolcalls:mcp submit/update ok`, E4-03). Silang: ketiga panggilan itu juga `ok:true` di log server (`mcp:R10B/R11B/R12B`).
- Arm A: akhir fase = `t_end` baris `trial-log step edit --step Sx` terakhir (D-519, `<RUN>_phases.json` sumber `edit_terakhir`).
- T1 = START harness sampai akhir S1; T2 = akhir S1 sampai akhir S3.

#### 4.1.2 Rasio dan vonis (sumber `aN/urep_time.txt`, `aN/urep_time.json`)

| Pasangan | T1_B (s) | T1_A (s) | r1 | T2_B (s) | T2_A (s) | r2 | S2 B/A (s) | S3 B/A (s) |
|---|---|---|---|---|---|---|---|---|
| R-10 (B dulu) | 49,431 | 28,658 | 1,725 | 94,495 | 49,160 | 1,922 | 54,957 / 27,084 | 39,538 / 22,076 |
| R-11 (A dulu) | 94,702 | 36,081 | 2,625 | 141,970 | 43,587 | 3,257 | 40,741 / 15,925 | 101,229 / 27,662 |
| R-12 (B dulu) | 64,074 | 63,711 | 1,006 | 157,792 | 35,920 | 4,393 | 114,833 / 21,877 | 42,959 / 14,043 |
| **Median** | | | **1,725** | | | **3,257** (maks 4,393) | | |

(a) median r1 1,725 > 1,00: **GAGAL**. (b) median r2 3,257 > 0,70 dan maks 4,393 > 1,00: **GAGAL**. KE-1: **GAGAL**. Tidak ada pasangan yang lulus (b); hanya R-12 (a) mendekati setara (1,006).

#### 4.1.3 Sensitivitas (tidak menentukan vonis)

| Definisi | R-10 | R-11 | R-12 | Median | Uji ambang |
|---|---|---|---|---|---|
| (1) T ujung-ke-ujung (START harness-END) | 166,805/80,069 = 2,083 | 246,610/79,826 = 3,089 | 232,901/107,222 = 2,172 | 2,172 | GAGAL |
| (2) START Hermes-END | 149,543/68,746 = 2,175 | 218,624/57,035 = 3,833 | 218,933/80,289 = 2,727 | 2,727 | GAGAL |
| (3) Sesi penuh `wall_s` | 174,746/89,755 = 1,947 | 333,887/124,589 = 2,680 | 292,402/112,152 = 2,607 | 2,607 | GAGAL |
| (4a) akhir S1 B = penanda `mark S1` | 52,001/28,658 = 1,815 | 113,672/36,081 = 3,150 | 74,155/63,711 = 1,164 | 1,815 | (a) GAGAL |
| (4b) akhir S1/S3 B = `mark S1`/`mark S3` | 93,907/49,160 = 1,910 | 126,691/43,587 = 2,907 | 150,435/35,920 = 4,188 | 2,907 | (b) GAGAL |
| (5) tanpa pasangan `host_bersih=tidak`/`latensi_anomali` | TIDAK-DAPAT-DIHITUNG: 9/9 run `host_bersih=tidak` (isolasi informatif D-442); `latensi_anomali` 0 run (token keluaran/s 117,9-145,9, median 134,0; batas 0,5x = 67,0) | | | - | - |
| (6) B dikurangi `durationMs` submit/update di fase | 48,300/28,658 = 1,685; r2 91,313/49,160 = 1,857 | 93,211/36,081 = 2,583; r2 139,363/43,587 = 3,197 | 62,553/63,711 = 0,982; r2 155,315/35,920 = 4,324 | r1 1,685; r2 3,197 | GAGAL. Catatan: render R17 tidak dapat dipisahkan dari `durationMs` per panggilan, jadi sensitivitas 6 menurut definisi ketat TIDAK-DAPAT-DIHITUNG; baris ini mengurangi seluruh durasi panggilan (batas atas manfaat) |
| Tambahan: T1 dari START Hermes | 32,169/17,335 = 1,856 | 66,716/13,290 = 5,020 | 50,106/36,778 = 1,362 | 1,856 | (a) GAGAL |

Caveat beban host (wajib, research/15 §21.3): semua run `host_bersih=tidak` dengan isolasi gagal H-1, H-4, H-5, H-7 (meta `isolation_gagal`), informatif menurut D-442. CPU rerata selama run (meta `host_cpu_rerata_selama`): R10B 18,7 / R10A 9,5; R11A 17,6 / R11B 9,2; R12B 8,7 / R12A 8,2 (%). Beban tidak sistematis memberatkan arm B (pada R-11 justru arm A yang lebih berat), dan arah rasio sama di ketiga pasangan.

#### 4.1.4 Ke mana waktu arm B pergi (sumber `aN/phase_attr.txt`, `aN/mcp_dur.txt`)

Atribusi selang ke aksi pengakhir (research/16 §4.1.5): selang dari akhir kelompok panggilan sebelumnya sampai akhir panggilan ini dibebankan ke kategori panggilan itu. "Jeda model" = waktu sebelum panggilan dikirim (pemikiran dan pembangkitan token); "eksekusi alat" = `ts_result - ts_call`.

| Run | T (START harness-END, s) | Jeda model | Eksekusi alat | Tulis/sunting MD | Pencatatan trial-log | Skema/panduan (tool_describe, tool_search, list/get/read MCP) | Semua panggilan MCP Studio | Lain yang menonjol |
|---|---|---|---|---|---|---|---|---|
| R10B | 166,8 | 143,1 (86%) | 23,7 (14%) | 99,0 (59,4%) | 15,9 (9,5%) | 14,5 (8,7%) | 13,0 (7,8%) | cek lokal 16,3 |
| R10A | 80,1 | 68,8 (86%) | 11,3 (14%) | 53,6 (66,9%) | 20,8 (25,9%) | 0 | 0 | - |
| R11B | 246,6 | 221,9 (90%) | 24,7 (10%) | 114,0 (46,2%) | 52,6 (21,3%) | 14,5 (5,9%) | 26,1 (10,6%) | cek lokal 38,1 |
| R11A | 79,8 | 70,4 (88%) | 9,4 (12%) | 40,5 (50,8%) | 6,9 (8,7%) | 0 | 0 | baca lembar 24,4 |
| R12B | 232,9 | 210,6 (90%) | 22,3 (10%) | 59,9 (25,7%) | 23,6 (10,2%) | 28,3 (12,1%) | 29,0 (12,5%) | HTTP lewat trial-log 32,3 (13,9%); cek lokal 58,7 (25,2%) |
| R12A | 107,2 | 96,5 (90%) | 10,7 (10%) | 40,8 (38,1%) | 14,9 (13,9%) | 0 | 0 | baca lembar 27,3; cek lokal 24,1 |

Durasi server per panggilan (log server `durationMs`, `aN/mcp_dur.txt`): total per run R10B 5,02 s, R11B 5,84 s, R12B 5,04 s, yaitu 3,0%, 2,4%, dan 2,2% dari T. Rinciannya: `studio_report_update` 2 panggilan 2,48-3,18 s, `studio_report_submit` 1,13-1,52 s, `studio_report_check` 0,65-1,55 s (1 sampai 4 panggilan), `studio_file_verify` 0,05-0,06 s, `studio_report_template` di bawah 0,01 s. Latensi sisi klien MCP (jumlah `ts_result - ts_call` panggilan MCP) 5,7 / 7,6 / 8,1 s. Kesimpulan: start proses per langkah (biaya r3) sudah hilang; yang tersisa adalah jumlah giliran model dan ukuran konteks per giliran.

| Run | api_calls | wall_s / api_call (s) | token masuk per panggilan |
|---|---|---|---|
| R10B / R10A | 29 / 20 | 6,03 / 4,49 | 63.236 / 47.797 |
| R11B / R11A | 40 / 20 | 8,35 / 6,23 | 110.286 / 50.241 |
| R12B / R12A | 46 / 21 | 6,36 / 5,34 | 70.690 / 48.089 |

Arm B memakai 1,45-2,19x giliran, dan setiap giliran 1,19-1,34x lebih lama, sejalan dengan konteks per giliran 1,32-2,20x lebih besar (`usage_<RUN>.json`).

### 4.2 KE-2 Jumlah langkah (advisori; sumber utama log sesi, E4-04)

N_agent = tool call dengan `ts_call` di [START harness, END], tidak termasuk panggilan yang seluruh isinya `trial-log mark/qmark/answer` (`aN/common.py` fungsi `is_marker_only`). `tool_describe` dan `tool_search` (meta-alat Hermes untuk membuka skema alat MCP) dihitung 1 per panggilan seperti alat lain.

| Pasangan | N_agent B | N_agent A | s = B/A | B tanpa meta-alat | s tanpa meta | Silang timing.csv `act=1` B/A | Total tool call sesi (meta) B/A |
|---|---|---|---|---|---|---|---|
| R-10 | 38 (meta 5, penanda 3 tak dihitung) | 16 | 2,375 | 33 | 2,062 | 4 / 4 | 41 / 19 |
| R-11 | 45 (meta 6) | 15 | 3,000 | 39 | 2,600 | 6 / 4 | 53 / 19 |
| R-12 | 52 (meta 10) | 20 | 2,600 | 42 | 2,100 | 10 / 6 | 60 / 20 |
| Median | | | **2,600** | | 2,100 | | |

KE-2 **GAGAL** (advisori). Silang timing.csv jauh di bawah log sesi di kedua arm (Hermes hanya mencatat baca lembar dan edit), jadi timing.csv bukan sumber langkah yang memadai; selisih dilaporkan, tidak dikoreksi.

### 4.3 KE-3 Galat format

#### 4.3.1 Nilai

| Komponen (E4-05) | R10B | R11B | R12B | Sumber |
|---|---|---|---|---|
| G_B,stored | TIDAK-DAPAT-DIHITUNG (dry-run R08 isi tersimpan tidak dijalankan controller; tidak ada berkas hasilnya di `controller_ab4/`). Proksi: semua submit/update `ok:true` di server, render S3 `requireComplete` sukses, `studio-report check --remote` postcheck atas MD akhir `valid:true`, 0 isu | idem | idem | `mcp:<RUN>`; `<RUN>_postcheck.json` `drafts[0].check` |
| G_B,4xx (server `ok:false` berkode skema/kontrak) | 0 | 0 | 0 | `mcp:<RUN>` (semua `ok=true`) |
| G_B,klien (kode penjaga klien MCP Studio) | 0 | 0 | 0 | idem |
| G_B,draft (`studio_report_check` tidak valid) | 0 di log server (semua `ok:true`); isi `valid` tidak diekspor ke toolcalls, swalapor R11B menyebut peringatan `CONTRACT_STATUS_UNMAPPED` diperbaiki sebelum kirim | | | `R11B_stdout.txt` bagian C butir 1 |
| G_env | 0 | 0 | 0 | meta `mcp_tools_found=9`, `secret_leak_check=clean` |
| Panggilan alat di luar toolset (ditolak klien Hermes sebelum server) | 0 | 0 | 3 (`studio_search` x2, `studio_contracts_query` x1; hasil 164-681 B, tanpa jejak server) | `tc:R12B` `mcp_ok=?`; `aN/reconcile.py` |
| G_A (checker mekanis DC-47b, salinan `aN/ga_checker_dc47b_copy.py`) | ketat 2 / longgar 1 | ketat 2 / longgar 1 | ketat 2 / longgar 2 | `aN/ga.txt` |

Σ G_B,4xx = 0 (maks 0) <= 3/2; Σ G_B = 0 < Σ G_A ketat 6 (longgar 4). Karena arm A kini MD bebas (E4-02), checker membedakan lagi: ketiga MD arm A tidak punya bab Ringkasan berlabel dan status akhir tidak dalam bentuk himpunan tertutup (`aN/ga.txt`). KE-3 **LULUS** dengan G_B,stored sebagai proksi. Sensitivitas Σ(4xx + klien + di luar toolset) = 3, maks 3 pada R12B: Σ masih <= 3, maks melewati 2; sumbernya ketidakcocokan brief dengan toolset (§8 A-3), bukan bentuk laporan.

#### 4.3.2 Rekonsiliasi hitung MCP toolcalls lawan log server (diminta penugasan)

Pencocokan per panggilan: nama alat sama dan `ts` server di [ts_call - 1 s, ts_result + 1 s] (`aN/reconcile.py`). Semua panggilan server tercocokkan ke satu baris toolcalls; tidak ada baris server yatim.

| Run | toolcalls MCP | server | Selisih | Penjelasan (semua baris selisih teridentifikasi) |
|---|---|---|---|---|
| W, R10B, R11B, Q | 6, 6, 10, 12 | 6, 6, 10, 12 | 0 | - |
| R12B | 15 | 9 | 6 | 3 metode protokol MCP yang tidak dicatat server sebagai `tool_call` (`list_resources`, `get_prompt studio_contracts_query`, `read_resource studio://resep/laporan-kerja`) + 3 panggilan alat di luar toolset `reports` (`studio_search` x2, `studio_contracts_query` x1) yang ditolak klien Hermes ("3 kegagalan tool_call beruntun", `R12B_stdout.txt:31`) |
| M | 8 | 7 | 1 | `list_prompts` (metode protokol) |
| WD | 43 | 37 | 6 | 4 metode protokol (`read_resource` x2, `list_resources`, `list_prompts`) + 2 panggilan ditolak sebelum handler (`studio_slot_fill` dengan argumen `dryRun`, `studio_document_get` dengan `slot/view`) |
| DB | 92 | 86 | 6 | 3 metode protokol (`list_resources`, `read_resource`, `list_prompts`) + 3 ditolak sebelum handler (`studio_figure_preview` probe, `studio_chapter_import_markdown` probe `markdown`, `studio_slot_fill` `dryRun`); catatan Hermes menyebut pemutus sirkuit klien MCP terpicu (`doc_ud1/timing.csv` DB seq 16, "MCP circuit breaker tripped") |
| DB2 | 57 | 51 | 6 | 4 metode protokol (`list_resources`, `read_resource`, `list_prompts`, `get_prompt`) + 2 ditolak sebelum handler (`studio_figure_preview` dengan data `shape:"?"`, `studio_chapter_submit` dengan `arguments` berupa string JSON yang ditolak parser argumen, `feedback_DB2.md` B butir 8) |

Tidak ada panggilan ganda atau ulang diam-diam yang menjelaskan selisih; "pembungkus" `tool_call` Hermes dipetakan satu-satu ke panggilan server. Isi hasil panggilan yang ditolak sebelum handler tidak diekspor (hanya `result_len`), jadi pesan galatnya TIDAK-DAPAT-DIVERIFIKASI dari berkas; jumlah dan argumennya terverifikasi.

### 4.4 KE-4 Retrieval (sumber `aN/retrieval.txt`)

Kunci diselesaikan baris ini secara mekanis menurut `Q_key.md` karena `Q_key_resolved.md` tidak ada (§8 A-4). Arm A dari isi akhir `r10a/`, `r11a/`, `r12a/laporan.md`. Arm B dari HTML render terakhir tiap dokumen di `contract_ab4/sandbox/<run>/` (render revisi terakhir; tidak ada tulisan ke dokumen B sesudah render S3 selain GET R12B), dengan teks per `data-block-id` (`aN/htmlpid.py`), bukan dari `studio_search`, agar tidak sirkular. documentId per docKey diambil dari argumen `documentId` panggilan update tiap run (`tc:W/R10B/R11B/R12B/M`). Status tersimpan arm B = kepala `Status:` MD yang terkirim terakhir (tidak ada edit MD sesudah update terakhir, `aN` pemeriksaan §4.5).

| Q | Arm | Jawaban | Kunci | Presisi | Recall | Benar | L_q | dur_s (`retrieval.csv`) |
|---|---|---|---|---|---|---|---|---|
| Q1 | A | r12a (tingkat berkas) | r12a; status tersimpan "complete (selesai)" | 1,00 | 1,00 | 1 | 5 | 6,901 |
| Q1 | B | `cmvzvcaif01p2v188rrlikayw` (R12B) | idem | 1,00 | 1,00 | 1 | 2 | 8,283 |
| Q2 | A | r11a, r12a | r11a, r12a (r10a "needs-review") | 1,00 | 1,00 | 1 | 3 | 6,084 |
| Q2 | B | R11B, R12B | R11B, R12B (R10B needs-review, W blocked, M needs-review) | 1,00 | 1,00 | 1 | 1 | 3,242 |
| Q3 | A | r12a:38, r12a:50 (jawaban akhir; jawaban pertama r10a:44 salah, dikoreksi) | r12a:38, r12a:50 | 1,00 | 1,00 | 1 (jawaban pertama: 0) | 5 | 18,654 |
| Q3 | B | R12B `#p-e9mwpcfn4h` | R12B `#p-e9mwpcfn4h` (kedua kemunculan berada di satu blok tabel) | 1,00 | 1,00 | 1 | 3 | 5,011 |
| Q4 | A | r10a | r10a | 1,00 | 1,00 | 1 | 1 | 2,106 |
| Q4 | B | R10B | R10B | 1,00 | 1,00 | 1 | 2 | 3,618 |
| Q5 | A | r10a:65 | r10a:69 (r12a menunjuk baris 65 = heading tanpa nilai, dan baris 69 yang memuat `61b35d8ffba7c993`) | 0,00 | 0,00 | 0 | 3 | 5,736 |
| Q5 | B | R10B `#p-7bpz07hy5m` | utama: R10B `#p-7bpz07hy5m` (lihat di bawah) | 1,00 | 1,00 | 1 | 4 | 8,377 |

Skor: **B 5/5**, A 4/5. Presisi dan recall rerata B 1,00/1,00, A 0,80/0,80. Median L_q B 2 <= A 3. KE-4 **LULUS** pada kunci utama.

Tafsir kunci Q5 B (wajib disajikan ke USER): `refs[]` R12B menunjuk R10B dengan paragraf `bab-3` revisi 18 (`r12b/laporan.md` bagian Rujukan), yaitu alamat bab, bukan pid blok. Aturan Q_key arm B hanya mengatur "refs ada" dan "tidak ada refs". Untuk arm A, rujukan yang kurang presisi (hanya path) diselesaikan dengan "semua baris yang memuat nilai". Baris ini memakai padanan itu untuk arm B: kunci = semua blok R10B yang memuat `61b35d8ffba7c993` = `p-7bpz07hy5m` (tabel Bukti di bab 3). Tafsir harfiah (kunci = `R10B#bab-3`) membuat Q5 B salah, skor B 4/5, KE-4 KERAS gagal, dan vonis gabungan TIDAK EFEKTIF. Keterbatasan ini sendiri dilaporkan Hermes ("pid hanya sampai tingkat bab", `R12B_stdout.txt:32`).

Catatan kualitas Q (bukan penentu): jendela `qmark` sangat sempit (1,7-18,7 s) karena Hermes menggabungkan perintah cari dan `answer` dalam satu giliran; L_q dihitung dari toolcalls, bukan dari jumlah grep yang disebut di catatan.

### 4.5 KE-5 Jejak disk dan asal-usul (§7.7)

#### 4.5.1 Ringkasan per run (sumber `<RUN>_postcheck.json`, `snap_<RUN>_diff.json`, `aN` pemeriksaan)

| Run | Postcheck mentah D_raw_d442 | Isi | Ajudikasi §7.7 | D_raw,B akhir |
|---|---|---|---|---|
| R10B | 1 | `r10b/laporan.md` kelas "lainnya", alasan "tidak ada baris studio-report submit/update ok=1" | Draf sah (butir 6): `check --remote` valid 0 isu; isinya terkirim lewat `studio_report_submit/update` dengan argumen `path` = berkas itu (`tc:R10B`, server `ok:true`); 0 edit MD sesudah update terakhir. Postcheck H4-8 belum mengenali kiriman MCP berbasis `path` (mencari baris CLI di timing.csv) | 0 |
| R11B | 2 | `r11b/laporan.md` (seperti R10B) + `Temp/playwright_chromiumdev_profile-uf3dxT/Default/Network/Network Persistent State` (981 B, "touched_by_run langsung" karena kata generik "Network" 1 kali) | Laporan: draf sah. Berkas profil: pengecualian `render_server` (butir 3): (a) `R11B_host_pre.txt` mencatat `chrome.exe` pid 3764 dengan `--user-data-dir` profil itu berinduk pid 10664 = `node ... next/dist/server/lib/start-server.js` (server DEV), lahir 22:45:12Z (saat render W); (b) tidak ada tool call R11B yang menyebut chrome/playwright/folder profil (kata "chrome" hanya muncul sebagai istilah "allowed chrome" di skrip cek angka); (c) bukan pola payload. Catatan: berkas `host_whitelist.txt` tidak ada di `controller_ab4/`, jadi bukti (a) bersandar pada baris proses host_pre | 0 |
| R12B | 1 | `r12b/laporan.md` | Draf sah; 6 GET HTTP lewat `trial-log get` dipipa ke `head`/`python -c` tanpa berkas keluaran (pemindai pengalihan: 0 `>`/`tee`/`-o` ke berkas) | 0 |
| M | 2 | `m/laporan.md` (draf sah) + `m/friksi.md` (7.673 B, catatan friksi Hermes di folder run) | `friksi.md` bukan respons API/badan kiriman; isi catatan swalapor. Dihitung "lainnya" (bukan D_raw) | 0 (M tidak dinilai) |

Berkas sesaat (butir 4): 0 kandidat di run B U-REP (`aN` pemindai pengalihan atas `tc:R10B/R11B/R12B`; satu-satunya kecocokan adalah `grep -o`). F_name 3/3 (nama sandbox berpola C51 `NNN-GSP-LAP-XI-2026_revN_<UTC>_<sha8>.html`) dan F_sha 3/3 (sha256 berkas = awalan sha8 di nama = sha di `<RUN>_sandbox.txt`). KE-5 **LULUS** sesudah ajudikasi. Sensitivitas aturan lama research/13 §17.1 (dua bukti): sama, 0 sesudah draf sah dikecualikan.

### 4.6 KE-6 Beban pikir format (sumber `aN/fl.txt`)

| Run | FL utama (E4-07: `studio_registry`, `get_prompt studio_laporan_kerja`, `read_resource studio://resep/*`, pola dasar r3) | FL_tpl (`studio_report_template`) | `tool_describe` (informatif, padanan `--help`) | Bacaan folder uji lama |
|---|---|---|---|---|
| R10B / R10A | 0 / 0 | 1 / 0 | 5 / 0 | 0 / 0 |
| R11B / R11A | 1 (`studio_registry`) / 0 | 1 / 0 | 5 / 0 | 0 / 0 |
| R12B / R12A | 3 (`studio_registry` x2, `read_resource studio://resep/laporan-kerja`) / 0 | 1 / 0 | 6 / 0 | 0 / 0 |
| Median | B 1 / A 0 | B 1 / A 0 | | |

Median FL_B 1 > FL_A 0: **GAGAL**. Sensitivitas FL + FL_tpl: B 1/2/4 (median 2) lawan A 0: GAGAL. FD_B dinilai dari `format_<run>.txt` dan artefak (penilaian analis, confidence LOW): dimensi yang masih diputuskan sendiri pasti F6 (kosakata verdict: R11B menulis AGREE di prosa karena enum Verdict tidak memuatnya, `format_R11B.txt` butir 11; R10B tanpa Verdict) dan F10 (bentuk `ReportedAt`: R10B dan R11B tanggal-jam +07:00, R12B tanggal saja); sebagian F8 (isi kolom `bukti` bebas, `format_R10B.txt` "Kolom bukti saya isi teks jejak"). FD_B = 2 sampai 3 per laporan, sehingga komponen FD berada tepat di ambang dan tidak menentukan; KE-6 tetap GAGAL oleh FL. FD_A = 10 menurut definisi (MD bebas, tanpa aturan arm).

### 4.7 KE-7 Kelengkapan (sumber `aN/kf.txt`)

- K_B: render S3 dengan `requireComplete: true` sukses di ketiga run (server `ok:true`; swalapor "COMPLETE" `R10B_stdout.txt`, `R11B_stdout.txt`). K_B = 100% 3/3: **LULUS** (KERAS).
- KF dengan pencocok token manifest 09 §5 (beku sebelum uji; normalisasi NFC, `*` `` ` `` `_` dibuang, huruf kecil; padanan ATAU dan bentuk digit). Teks arm B diperiksa pada MD terkirim dan pada teks penuh HTML render tersimpan (hasil sama).

| Laporan | KF_A | KF_B ketat | Fakta B yang tidak cocok | KF_B sesudah ajudikasi notasi |
|---|---|---|---|---|
| R-10 | 38/38 = 100% | 38/38 = 100% | - | 100% |
| R-11 | 37/37 = 100% | 33/37 = 89,2% | R11-F01 (`langkah 31` hilang: kalimat "akun berbeda dari langkah 31" ditulis ulang tanpa rujukan langkah), R11-F23 (`2..308` ditulis "2 sampai 308"), R11-F26 (`GAP-023..035` ditulis "GAP-023 sampai GAP-035", `24/26` ditulis "24 dan 26"), R11-F35 (`259..276`, `299..307`, `307-259=48` ditulis "259 sampai 276", "299 sampai 307", "307 dikurangi 259") | 36/37 = 97,3% (F01 tetap hilang) |
| R-12 | 33/33 = 100% | 33/33 = 100% | - | 100% |

KF_B = 100% gagal pada R-11 dan KF_B < KF_A pada R-11: komponen KF **GAGAL** (pola sama dengan r3 R9-F07: satu fakta). Status transien S1/S2 (fakta `manual`) TIDAK-DAPAT-DIHITUNG karena R20 per revisi tidak dijalankan. Klaim Hermes "0 angka yatim, 0 butir hilang" (`R11B_stdout.txt` bagian A) memakai pencocok Hermes sendiri yang menganggap rentang berganti notasi sebagai cocok.

### 4.8 TK-1 Token (pendamping, informatif; sumber `usage_<RUN>.json`, `aN/urep_time.txt`)

| Run | Masuk | Keluar | Penalaran | api_calls | Masuk per panggilan |
|---|---|---|---|---|---|
| R10B / R10A | 1.833.838 / 955.935 (1,918x) | 24.679 / 11.604 (2,127x) | 12.911 / 5.460 | 29 / 20 | 63.236 / 47.797 (1,323x) |
| R11B / R11A | 4.411.449 / 1.004.821 (4,390x) | 47.604 / 18.172 (2,620x) | 29.576 / 10.414 | 40 / 20 | 110.286 / 50.241 (2,195x) |
| R12B / R12A | 3.251.732 / 1.009.878 (3,220x) | 34.467 / 15.306 (2,252x) | 21.764 / 9.014 | 46 / 21 | 70.690 / 48.089 (1,470x) |
| W, M, Q | 1.764.581; 2.757.055; 2.905.314 | 16.827; 32.979; 34.499 | | 23; 42; 51 | 76.721; 65.644; 56.967 |

Median masuk per panggilan B/A 1,470 > 1,25 (usulan controller): tanda pengecil token MCP-D1 **tidak tercapai**. Terhadap acuan lama: median B per panggilan 70.690, turun dari sekitar 100 ribu pada MCP-05 (`08:64-76`, research/17 §2) tetapi masih di atas CLI r3 (55-66 ribu). Token keluaran B/A median 2,252 (r3: 1,206).

### 4.9 MU-1 dan MU-2

MU-1 (SQL baca-saja) TIDAK-DAPAT-DIHITUNG: penugasan melarang akses DB. Proksi dari jejak revisi yang dibaca Hermes lewat MCP di sesi Q (sesudah END, `Q_stdout.txt` bagian H): dokumen `lapkerja-m` rev16; rev6 dan rev10 oleh `agent:hermes-gsp-verifier01`, rev13, rev15, rev16 oleh `agent:hermes-gsp-master01`; server menerima suntingan agen kedua tanpa konflik; bab 5 ditulis dua agen pada revisi berbeda dan revisi terakhir menang tanpa peringatan. MU-2 proksi: aktor = 1 pada R10B, R11B, R12B, W; 2 pada M.

### 4.10 Gerbang keras dan vonis gabungan U-REP

| Gerbang | Hasil | Catatan |
|---|---|---|
| (1) G_B,stored = 0 | LULUS-proksi | R08 dry-run tidak ada (§8 A-5) |
| (2) KE-4 B 5/5 | LULUS (utama) / GAGAL (tafsir harfiah Q5) | §4.4 |
| (3) D_raw,B = 0 | LULUS sesudah ajudikasi | §4.5 |
| (4) K_B = 100% | LULUS | §4.7 |
| KE-1 | GAGAL | (a) 1,725, (b) 3,257 / maks 4,393 |
| KE-6 | GAGAL | FL median 1 > 0 |
| KE-2 (advisori), KE-7 KF | GAGAL | tidak menentukan vonis |

Vonis (`11:178-180`): **NETRAL (keputusan USER)**: andal pada gerbang keras tetapi tidak lebih hemat, dan sekarang jauh lebih mahal daripada MD bebas. Vonis ketat alternatif: **TIDAK EFEKTIF** bila kunci Q5 dibaca harfiah. Penyimpangan R12B (HTTP lewat `trial-log get`) ditandai, tidak mengubah gerbang karena GET tidak menulis berkas.

## 5. U-DOC: hasil per metrik

### 5.1 UD-T1, UD-T2, UD-T (sumber `doc_ud1/timing.csv`, meta, `aN/udoc.txt`)

| Run | Arm, urutan | T1 START harness-mark S1 (s) | T2 mark S1-mark S2 (s) | T START-END (s) | wall_s | Catatan |
|---|---|---|---|---|---|---|
| WD | B, 0 (pemanasan, tidak dinilai) | 501,753 | 128,659 | 630,579 | 735,4 | memakai bahan asli, bukan bahan sintetis (§8 A-6) |
| DB | B, 1 | 938,654 | 238,008 | 1.176,847 | 1.615,8 | 1 sesi turunan (`delegate_task`) disertakan |
| DA | A, 2 | 720,196 | 0,311 | 720,818 | 822,6 | mark S1, S2, END dalam 0,62 s; Rev 0 dan Rev 1 dibangun satu jalan build (`tc:DA` baris 30-47) |
| DA2 | A, 3 (perluasan) | 619,517 | 48,052 | 667,713 | 758,5 | Rev 1 juga dibangun sebelum mark S1 (`timing.csv` DA2 seq 13-28); T2 = verifikasi Rev 1 |
| DB2 | B, 4 (perluasan) | 1.133,557 | 180,184 | 1.313,884 | 1.443,4 | dokumen pertama dibuang, dokumen kedua dibangun ulang (§5.4) |
| DF | prompt tanpa arm; Hermes memilih A | 720,693 | 25,217 | 746,265 | 1.145,6 | bukan sesi umpan balik (§8 A-7), informatif saja |

| Rasio | DB/DA (utama) | DB2/DA2 (UD-S5) | Rerata dua pasangan |
|---|---|---|---|
| UD-1a T1 | **1,303** | 1,830 | 1,567 |
| UD-1b T2 | **765,3** (T2_A = 0,311 s, artefak) | 3,750 | - |
| T1 + T2 | 1,633 | 1,968 | 1,800 |
| UD-T (START-END) | 1,633 | 1,968 | 1,800 |
| wall_s | 1,964 | 1,903 | 1,934 |
| UD-S1 T1 dari START Hermes | 927,101/702,104 = 1,320 | 1.118,449/568,507 = 1,967 | |
| UD-S2 "rakit saja" (T1 dikurangi selang baca bahan) | (938,654-157,6)/(720,196-13,7) = 1,105 | (1.133,557-16,7)/(619,517-13,0) = 1,841 | |
| UD-S3 T1_B dikurangi `durationMs` render+unduh di T1 | (938,654-2,29)/720,196 = 1,300 | (1.133,557-1,79)/619,517 = 1,827 | |

UD-1a GAGAL (1,303 > 1,00). UD-1b GAGAL menurut definisi (765,3), tetapi rasio ini tidak bermakna: arm A tidak punya fase revisi terpisah karena builder deterministik menghasilkan Rev 0 dan Rev 1 dari satu skrip (`feedback_DA.md` bagian E "S2 = build ulang penuh"; `feedback_DA2.md` bagian E "satu skrip deterministik (`--rev 0|1`)"). Biaya revisi arm A terlipat ke T1_A, sehingga T1_A justru menanggung kerja revisi dan UD-1a menguntungkan B; B tetap lebih lambat. Pembanding revisi yang wajar (T2) TIDAK-DAPAT-DIHITUNG dari penanda; satu-satunya angka yang setara adalah T1 + T2 (1,633 dan 1,968). Sebagai acuan, T2 arm B sendiri 238,0 s (DB) dan 180,2 s (DB2) untuk empat perubahan kecil.

UD-S4 beban host: keenam run `host_bersih=tidak` (isolasi gagal H-1/H-4 dan lainnya, informatif D-442); CPU rerata DB 13,0%, DA 8,0%, DB2 13,0%, DA2 12,0%.

### 5.2 UD-F Pecahan fase (sumber `aN/phase_attr.txt`; atribusi ke aksi pengakhir)

| Run | T (s) | Jeda model | Kategori terbesar |
|---|---|---|---|
| DB | 1.176,8 | 837,9 (71%) | panggilan MCP tulis dokumen (impor bab, submit bab, slot, buat dokumen) 319,5 (27,2%); cek lokal (skrip Python, ekstraksi gambar dari DOCX untuk cek visual) 228,6 (19,4%); panggilan figur (`studio_figure_preview`/`revise`) 174,7 (14,8%); baca bahan 157,6 (13,4%); subagen Request Translator (`delegate_task`, 185,4 s eksekusi) 101,7 (8,6%); skema/panduan 62,6 (5,3%); inspeksi visual 53,7 (4,6%); render+unduh 24,5 (2,1%) |
| DA | 720,8 | 659,4 (91%) | cek lokal, terutama membaca kode engine `datum_docx.py`/`datum_lint.py` (perintah `sed`/`grep` di `tc:DA` baris 11-28) 428,3 (59,4%); tulis/sunting skrip build 154,2 (21,4%); pencatatan 52,4 (7,3%); inspeksi visual 36,7 (5,1%); build 34,4 (4,8%) |
| DB2 | 1.313,9 | 1.279,7 (97%) | membaca kode sumber dan dok Studio di repo (skema blok chart, `renumberChapters`, rute) 495,3 (37,7%); panggilan MCP tulis dokumen 407,0 (31,0%); cek lokal 181,6 (13,8%); pencatatan 72,2 (5,5%); render+unduh 65,8 (5,0%); skema/panduan 32,6 (2,5%); figur 25,6 (2,0%) |
| DA2 | 667,7 | 627,2 (94%) | cek lokal (baca engine, skrip verifikasi) 357,3 (53,5%); tulis/sunting builder 160,3 (24,0%); build 71,9 (10,8%) |

Durasi server MCP (`aN/mcp_dur.txt`): DB total 9,7 s untuk 86 panggilan (render 3 panggilan 3,18 s; `studio_figure_revise` 6 panggilan 1,92 s; impor bab 15 panggilan 1,54 s); DB2 7,5 s untuk 51 panggilan. Server memakan 0,8% (DB) dan 0,6% (DB2) dari T. Kedua arm sama-sama didominasi jeda model; arm A menghabiskan waktunya membaca kode builder-nya sendiri, arm B menghabiskannya pada panggilan yang gagal dan pencarian bentuk data chart.

### 5.3 UD-N, UD-K, UD-G (sumber `aN/udoc.txt`, `aN/reconcile.py`, `mcp:<RUN>`)

| Run | UD-N (N_agent, meta-alat) | Masuk | Keluar | Penalaran | api_calls | Masuk/panggilan | Galat arm B di server (`ok:false`, semua pulih) | Ditolak sebelum server | Galat arm A (swalapor) |
|---|---|---|---|---|---|---|---|---|---|
| DB | 164 (17) | 36.551.825 | 159.451 | 79.796 | 164 | 222.877 | 18: `SCHEMA_INVALID` 14 (`studio_figure_preview` 10, impor bab 2, `studio_document_create` 1, `studio_figure_revise` 1), `INVALID_ARGUMENT` 2 (`studio_file_verify`, `studio_document_status` menolak `agentId`), `DOC_NUMBER_EXISTS` 1, `BLOCK_TYPE_NOT_ADMITTED` 1 (`studio_figure_preview`) | 3 | - |
| DA | 46 (0) | 5.724.826 | 119.386 | 96.667 | 57 | 100.436 | - | - | 3 (ValueError matplotlib; gerbang sendiri salah jangkar RV-1; datum_lint DATUM-22 pada isi sumber), `feedback_DA.md` B |
| DB2 | 153 (14) | 25.471.309 | 207.951 | 155.021 | 149 | 170.948 | 10: `SCHEMA_INVALID` 7 (`studio_figure_preview` 3, `studio_document_create`, impor bab, `studio_slot_fill`, `studio_chapter_submit` masing-masing 1), `DOC_NUMBER_EXISTS` 1, `INVALID_ARGUMENT` 1 dan `FORBIDDEN` 1 (`studio_document_structure`; `renumberChapters` butuh sesi administrator) | 2 | - |
| DA2 | 41 (0) | 8.005.284 | 101.219 | 81.366 | 56 | 142.952 | - | - | 3 (DATUM-22 isi sumber; bug skrip verifikasi sendiri; exit lint tersamar pipa), `feedback_DA2.md` B |
| WD | 107 (12) | 12.004.370 | 92.315 | 53.023 | 105 | 114.327 | 9 | 2 | - |

UD-4 (advisori): N B/A 3,565 (utama) dan 3,732: GAGAL. UD-5: galat tidak pulih arm B = 0 di DB dan DB2 (kedua run menghasilkan DOCX S1 dan S2): LULUS. Satu galat tanpa kode juga tercatat: kiriman bab DB yang hanya berisi satu blok chart mengganti seluruh prosa bab 5 tanpa peringatan server (`doc_ud1/timing.csv` DB seq 17, cid `9a531248`), dipulihkan Hermes pada revisi berikut. UD-7: token masuk B/A 6,385x dan per panggilan 2,219x (utama); 3,182x dan 1,196x (perluasan).

### 5.4 UD-Q1 sampai UD-Q5 (docxcheck baris ini; sumber `aN/docx_all.txt`, `aN/docx_all.json`)

docxcheck = protokol H4-11 yang tidak pernah dibangun di HARNESS4; dibangun di `analysis_r4/` (`docx_extract.py` ekstraksi zipfile + xml.etree; `docxcheck.py` acuan dari `doc_ud1/source/bab-*.md` beku, versi Rev 1 diturunkan dari `revisi.md` RV-1..RV-3; `docx_all.py` diff S1-S2 dan sha). Paragraf dinormalisasi NFC, penanda MD dibuang, spasi diringkas; mode longgar juga menyamakan kutip/tanda pisah dan huruf kecil. Token = regex manifest §7.3.

| Butir | DB S1 / S2 | DA S1 / S2 | DB2 S1 / S2 | DA2 S1 / S2 |
|---|---|---|---|---|
| Q1a paragraf sumber hadir (ketat = longgar) | 53/53 / 53/53 | 53/53 / 53/53 | 51/53 / 51/53 (judul "Chapter 6. ..." dan "Chapter 10. ..." tercetak tanpa awalan, nomor dipindah ke kicker "CHAPTER 6/10") | 53/53 / 53/53 |
| Q1b token angka/ID sumber hadir | 630/630 / 633/633 | 630/630 / 633/633 | 630/630 / 633/633 | 630/630 / 633/633 |
| Q1c angka tambahan di DOCX (sesudah ajudikasi) | 0 isi; token tambahan semua chrome templat: alamat/telepon/NIB kop (12720, 021, 22715320, 9120208940517), nomor dan tanggal dokumen (016, 2026, 19, 20261019); S2 + "500" di baris riwayat revisi | 0 isi (2026, 19 tanggal) | 0 isi (chrome sama dengan DB) | 0 isi (2026, 19, "05") |
| Q1d tabel FM.1 10x2, Table 6.1 21x6, Table 6.2 3x4 | identik 3/3 | identik 3/3 | data identik; tiap tabel 6.x ditambah satu baris "SUMBER ..." di dalam tabel | identik 3/3 |
| Q2 urutan heading sumber | 18/18 berurutan | 18/18 | 16/18 (dua judul berubah, lihat Q1a) | 18/18 |
| Q2 sampul: judul / nomor `GSP-UD1-NL-001` / TERBATAS | ya / **tidak** (`016/GSP/KT/X/2026`) / ya | ya / ya / ya | ya / sebagian (`GSP-UD1-NL-001-DB2B`) / ya | ya / ya / ya |
| Q2 lembar kendali (penyusun, pemeriksa/penyetuju "belum ditetapkan", Rev, tanggal) | lengkap (Rev 0/Rev 1 di riwayat; sampul memakai huruf revisi A/B) | lengkap | lengkap (sampul A/B) | pemeriksa/penyetuju "belum ditetapkan" tidak ada |
| Q2 daftar isi | tabel "Contents" 12 baris dengan 12 field PAGEREF, kolom halaman kosong; judul bab terulang sebagai subbagian (contoh "1.1 FM.1 Document control block"); subbab sumber 1.1-1.4, 6.1-6.5, 10.1-10.3 tidak masuk | tabel statis "Table of Contents" tanpa nomor halaman, tanpa field | tabel 6 baris, 6 PAGEREF, kolom halaman kosong | tabel statis tanpa nomor halaman |
| Q2 header/footer | ada per seksi (kop, judul, nomor, REV, SHEET n OF m, klasifikasi) | ada (cache "LEMBAR 2 DARI 1" basi karena tanpa repaginasi Word) | ada | ada |
| Q2 tabel berketerangan | **tidak** (0 paragraf keterangan untuk 3 tabel isi) | ya, keterangan otomatis engine "TABEL 1..5 ..." (nomor engine, bukan "Table 6.1/6.2") | ya ("Tabel 6.1/6.2", teks dari judul subbab) | ya |
| Q2/Q6 keterangan + alt gambar | keterangan "Gambar **5.1** ..."; alt = keterangan + "Source: Table 6.1, bab 6 dokumen ini" (tidak generik) | keterangan "GAMBAR 6.1 ..." + baris SUMBER; alt **generik** (`docPr name="Picture 1"`, descr kosong) | "Gambar 6.1 ..." + baris SUMBER tampil; alt tidak generik | "GAMBAR 6.1"; alt generik ("Picture 1") |
| Q3 halaman / badan | A4 210x297; margin kiri 24, kanan 20, atas 26, bawah 24 mm; badan 9,5 pt | A4; kiri 24, kanan 20; badan 9,5 pt | sama dengan DB | sama dengan DA |
| Q3 datum_lint (dijalankan baris ini, tanpa register pelepasan) | FAIL 5: DATUM-05 (wajah "IBM Plex Sans Cond"), DATUM-10 (2 tabel tanpa SUMBER), DATUM-14 (6 warna di halaman 1), DATUM-38 (pola nama berkas), DATUM-22 (isi sumber) | FAIL 1: DATUM-22 (isi sumber; Hermes melepasnya dengan `--allow-register` berkas `c22-register-rev*.json`) | FAIL 5 (sama dengan DB) | FAIL 1 (DATUM-22) |
| Q4 stabilitas revisi: blok berubah S1-S2 | 6: label revisi sampul A ke B, RV-1, RV-3, baris revisi tabel kendali, sisipan riwayat Rev 1, sel SEC-12 | 5: label revisi sampul, RV-1, RV-3, baris revisi kendali, SEC-12 | 5 (setara DB tanpa sisipan riwayat) | 5 |
| Q4 token: `400 bundles` ada, `500 bundles` 0, `REV-UD1-03` ada, SEC-12 = Medium-High | ya semua | ya semua | ya semua | ya semua |
| Q5 nama dan sha | 2/2: nama C51 `016-GSP-KT-X-2026_revN_<UTC>_<sha8>.docx`, sha256 berkas = sha8 nama = sha yang dilaporkan di `timing.csv` (`098b3a52...`, `db4287e0...`) | 2/2: sha256 yang dilaporkan agen (`9c2e12db...215c`, `94fead82...671b`) = sha berkas | 3/3 (termasuk dokumen pertama `rev7` yang dibuang) | 2/2 (`450610b3...9397`, `dad8b0d2...f8dc`) |

Lint Studio per aturan (UD-Q3 arm B utama) TIDAK-DAPAT-DIHITUNG dari berkas: hasil `studio_document_status` tidak diekspor (isi hasil alat tidak disalin, H4-5). Swalapor DB: "Lint gaya membalas FAIL berulang pada naskah yang sudah divonis lolos" (`feedback_DB.md` C butir 7), yaitu FAIL berkelas `isi_sumber`. Sebagai pengganti terukur dipakai datum_lint (lint DATUM milik Hermes): arm B membawa 4 FAIL berkelas `rakitan_alat` (DATUM-05, -10, -14, -38) yang tidak ada di arm A.

### 5.5 UD-Q6 Gambar 6.1 (D-498)

Grafik di kedua arm tertanam sebagai PNG raster (Studio merender blok `chart` lalu menyematkan PNG; arm A matplotlib). Data tersimpan Studio (spec blok chart di DB server) tidak dapat dibaca tanpa DEV/DB dan tidak ada di log server (log hanya metadata panggilan). Karena itu data diverifikasi dari PNG yang diekstrak dari DOCX (`aN/fig/<RUN>_S1.png`, `_S2.png`) dengan inspeksi visual baris ini; nilainya bilangan bulat kecil 0-5 pada garis kisi, jadi pembacaan berkeyakinan tinggi.

| Butir | DB (B) | DA (A) | DB2 (B, perluasan) | DA2 (A, perluasan) |
|---|---|---|---|---|
| (a) posisi | sesudah Table 6.1, sebelum Table 6.2 (blok 78 lalu 80) | sesudah Table 6.1 (56 lalu 59) | sesudah Table 6.1 (79 lalu 81) | sesudah Table 6.1 (66 lalu 69) |
| (a) keterangan / sumber | "Gambar **5.1** ..." (nomor mengikuti posisi bab Studio, bukan nomor sumber); sumber hanya di alt, tidak tampil | "GAMBAR 6.1 ..." + baris "SUMBER Table 6.1, bab 6 dokumen ini" | "Gambar 6.1 ..." + baris SUMBER tampil | "GAMBAR 6.1" + SUMBER |
| (a) berbasis data | blok `chart` Studio; RV-4 lewat `studio_figure_revise` (log server: 6 panggilan, 1 gagal) | grafik buatan builder dari data `gambar.md` (`build_ud1.py`) | blok `chart`; RV-4 lewat `studio_figure_revise` (1 panggilan) | matplotlib dari builder |
| (b) data S1 = `gambar.md` (High 0/1/3, Medium 1/5/3, Low-Medium 1/2/1, Low 0/3/0, N/A 1/0/0) | cocok | cocok | cocok | cocok |
| (b) data S2 = RV-4 (Medium-High 0/0/1 disisipkan, Medium 1/5/2) | cocok | cocok | cocok | cocok |
| (b) bentuk "batang bertumpuk" (`gambar.md`) | **tidak**: batang berkelompok vertikal (Hermes: tumpuk "tidak ketemu pada sembilan code yang saya uji", `feedback_DB.md` C butir 3) | bertumpuk horizontal, label nilai | bertumpuk horizontal tanpa label nilai (kode didapat dari membaca kode server) | bertumpuk vertikal, label nilai |
| (c) cacat tata letak (inspeksi baris ini: teks bertumpuk, terpotong, keluar bingkai, legenda menimpa) | 0 / 0 | 0 / 0 | **1 / 2**: label kategori terpotong di tepi kiri ("ow-Medium" pada S1; "edium-High" dan "ow-Medium" pada S2) | 0 / 0 |
| (c) `layoutIssueCount` `studio_figure_preview` | TIDAK-DAPAT-DIHITUNG (isi hasil tidak diekspor) | - | swalapor "pratinjau 0 isu tata letak" (`feedback_DB2.md` D), bertentangan dengan PNG di DOCX | - |

Kesimpulan Q6: data benar di keempat dokumen; DB gagal bentuk dan nomor; DB2 gagal tata letak (pratinjau Studio tidak menangkap pemotongan label pada raster DOCX). Q6 (c) pasangan utama B 0 <= A 0 lulus; pasangan perluasan B 2 > A 0 gagal.

### 5.6 UD-J Jejak berkas (sumber `snap_<RUN>_diff.json` S1/S2, `<RUN>_postcheck.json`)

| Run | docx_final | unduhan_mcp | draf | skrip_build | antara | lainnya | Total (berkas, byte) |
|---|---|---|---|---|---|---|---|
| DB | - | 2 (1.060.594 B; DOCX menyematkan 12 fon odttf) | 2 (`bab-06-rev1.md` di folder run dan sandbox, 13.620 B) | - | gambar `chk_*.png`/`v_*.png`/`s2_*.png` diekstrak dari DOCX ke sandbox untuk cek visual lalu dihapus (`tc:DB` baris 133, 166) | 1 (`db/contract.md` 4.905 B, ditulis sesudah END) | 5, 1.079.119 |
| DA | 2 (184.207 B; tanpa fon tersemat) | - | - | 1 (15.969 B) | 4 (2 PNG grafik, 2 register DATUM-22; 75.103 B) | - | 7, 275.279 |
| DB2 | 2 salinan DOCX di folder run (1.061.622 B) | 3 (termasuk DOCX dokumen pertama yang dibuang; 1.505.385 B) | 6 (`bab-01..06.md` dibentuk ulang untuk importer di sandbox; 37.995 B) | - | - | - | 11, 2.605.002 |
| DA2 | 2 (188.548 B) | - | - | 2 (15.878 B) | 11 (PNG, keluaran lint/cek/verifikasi, register; 97.495 B) | - | 15, 301.921 |

Asal-usul §7.7 arm B: postcheck mentah DB 3, DB2 6. Ajudikasi: berkas bab di sandbox adalah draf yang isinya dikirim lewat `studio_chapter_import_markdown` dengan argumen `path` ke berkas itu (`tc:DB` baris 143; `tc:DB2` baris 121-129, 149), padanan draf sah butir 6; bukan respons API atau hasil alat. `contract.md` = kebiasaan orkestrasi Hermes (kontrak misi), bukan payload. Gambar yang diekstrak dari DOCX unduhan bukan respons API (butir 4 tidak berlaku). D_raw,B = 0 untuk DB dan DB2. Sensitivitas ketat (berkas bab di sandbox dihitung sebagai badan kiriman, karena brief §6 melarang menyimpan badan kiriman): D_raw,B DB 2, DB2 6. Penyimpangan kecil: DB sempat menulis `bab-06-rev1.md` di `C:/Users/TRIAL/workspace/` (di luar folder run) lalu memindahkannya (`tc:DB` baris 139).

Berkas `%TEMP%/wd_t_2421ba64.json`, `wd_t_b04ebd60.json`, `wd_t_f0669a37.json` (20.545-22.645 B), `wd_hl_report.md`, `wd_hl_nas_list.json` (yang terdaftar di postcheck DB sebagai S3 `asal_usul_D435`, `not_touched`):
- Dibuat 2026-11-03 00:00:24Z-00:02:19Z (mtime), yaitu sesudah penanda END DB (00:00:06Z) tetapi sebelum sesi DB berakhir (meta `end_utc` 00:07:25Z), saat Hermes menulis umpan balik.
- Tidak ada satu pun rujukan `wd_t_`, `wd_hl_`, atau `health_recheck` di ke-15 ekspor toolcalls (sesi uji dan turunannya, salinan baris tool call `state.db`); postcheck DB: rujukan A = 0, `dynamic_path_calls` = 0.
- `DB_host_post.txt` baris 25 mencatat proses `hermes.exe -p gspuser02 ... cronjob ...` (pid 11620) lahir 00:00:52Z, 34 s sebelum `wd_t_*` (tetapi sesudah `wd_hl_nas_list.json` 00:00:24Z); keluarga `wd_hl_*` sudah ada di `%TEMP%` sejak 2026-10-23 (mtime), jadi berasal dari pekerjaan berulang di luar uji.
- Kesimpulan: **tidak dibuat oleh sesi uji mana pun** (terbukti dari salinan baris tool call state.db sesi uji yang diekspor; ekspor itu tidak mencakup sesi non-uji gsp-master01 seperti cron). Pembuatnya tidak terbukti: kandidat sesi profil `gspuser02` atau pekerjaan cron/gateway (hipotesis; state.db lain tidak dibaca). Tidak dihitung ke D_raw.

### 5.7 Ambang §6.8 dan vonis U-DOC (usulan controller)

| Ambang | DB / DA (utama) | DB2 / DA2 (UD-S5) |
|---|---|---|
| UD-1a T1 <= 1,00 | GAGAL (1,303) | GAGAL (1,830) |
| UD-1b T2 <= 0,70 | GAGAL (765,3; tidak bermakna, §5.1) | GAGAL (3,750) |
| UD-2 KERAS (Q1 a-d, Q2 semua butir, Q6 a-b) | **GAGAL**: Q1 lulus penuh; Q2 gagal (nomor sampul, tabel tanpa keterangan); Q6 (a) nomor 5.1 dan sumber tidak tampil, (b) bentuk berkelompok | **GAGAL**: Q1a 96,2% < 99%; nomor sampul bersufiks `-DB2B` |
| UD-3 (rakitan_alat 0; docxcheck B <= A; Q6 c B <= A) | GAGAL: datum_lint rakitan 4 lawan 0; cacat docxcheck B 6 (nomor sampul, huruf revisi, nomor gambar/bab, halaman daftar isi kosong, judul bab terulang di daftar isi, 0 keterangan tabel) lawan A 3 (daftar isi tanpa halaman, alt generik, nomor keterangan tabel engine); Q6 c 0 lawan 0 | GAGAL: Q6 c 2 lawan 0 |
| UD-4 advisori | GAGAL (3,565) | GAGAL (3,732) |
| UD-5 KERAS | LULUS | LULUS |
| UD-6 KERAS | LULUS sesudah ajudikasi (ketat: 2 berkas) | LULUS sesudah ajudikasi (ketat: 6) |

**Vonis: LEBIH BURUK** (satu pasangan, confidence LOW-MEDIUM, ambang usulan controller). Alasan: gerbang KERAS UD-2 arm B gagal. Sensitivitas yang diuji: (1) nomor sampul sebagai galat lingkungan (WD sudah memakai `GSP-UD1-NL-001`, `feedback_DB.md` B "nomor beku meta.md sudah dipakai arm lain"): UD-2 tetap gagal oleh keterangan tabel dan nomor/bentuk gambar, vonis tetap LEBIH BURUK; (2) UD-2 dinilai hanya atas kesetiaan isi (Q1) dan data gambar (Q6 b-data): lulus, tetapi UD-1a dan UD-3 gagal sehingga vonis menjadi SETARA. Temuan builder arm A (dilaporkan, tidak mengubah vonis B): alt gambar generik di DA dan DA2, daftar isi tanpa nomor halaman di DA dan DA2, lembar kendali DA2 tanpa pemeriksa/penyetuju, fon IBM Plex tidak tersemat dan tidak terpasang (`feedback_DA2.md` C butir 1).

## 6. Umpan balik Hermes (swalapor; kutipan paling banyak 15 kata, dipetakan ke metrik)

Sumber U-REP: `contract_ab4/sessions/<RUN>_stdout.txt` (laporan akhir sesi), `format_<run>.txt`, umpan balik sesi Q (`Q_stdout.txt`, bagian A-H). Tidak ada berkas `feedback_<run>.md` U-REP; brief U-REP meminta umpan balik di akhir sesi Q. Sumber U-DOC: `doc_ud1/feedback_<run>.md`. Label "swalapor": tidak dipakai sebagai satu-satunya bukti.

| Kutipan | Sumber | Metrik | Cocok dengan data? |
|---|---|---|---|
| "latensi server BUKAN biayanya." | `R11B_stdout.txt` bagian B | KE-1 | Ya: server 2,2-3,0% dari T (§4.1.4) |
| "Yang memakan usaha tetap penyusunan Markdown-nya, bukan alatnya." | `R10B_stdout.txt` friksi 5 | KE-1, KE-6 | Ya: tulis/sunting 59,4% T R10B |
| "Dua alat yang disebut brief tidak ada." | `R12B_stdout.txt:31` | KE-3 sensitivitas, penyimpangan HTTP | Ya: toolset `reports` tanpa alat itu (§8 A-3) |
| "pid hanya sampai tingkat bab." | `R12B_stdout.txt:32` | KE-4 Q5 | Ya: refs `bab-3` (§4.4) |
| "Status tak terpetakan = baris hilang sambil laporan tetap `valid`." | `R11B_stdout.txt` C butir 1 | KE-3 G_B,draft, KE-7 | Ya sebagai risiko; diperbaiki sebelum kirim |
| "Basis diingat server bekerja." | `R12B_stdout.txt:40` | perubahan r4 (basis sesi) | Ya: 0 `BASE_CONFLICT` di log server |
| "delta update sungguhan" (bab 4 tidak dikirim pada S2) | `R11B_stdout.txt` C penutup | perubahan r4 (delta) | Tidak dapat dicek dari log server (isi tidak dicatat) |
| "OWNER_AGENT_MISMATCH muncul di setiap panggilan." | `R11B_stdout.txt` C butir 4 | TK-1 | Konsisten dengan masuk per panggilan B 1,32-2,20x A |
| "Render HTML final 2,7 MB dari sumber MD 11 KB." | `R10B_stdout.txt` friksi 3 | KE-5/jejak | Ya: 2.737.682 B (`R10B_sandbox.txt`) |
| "Arm B lebih ringan daripada CLI" | `Q_stdout.txt` C | KE-4 | Ya: median L_q B 2 lawan A 3 |
| "Layak menggantikan MD bila laporannya banyak, disunting bertahap, dan dibaca agen lain" | `Q_stdout.txt` G | V-1 vonis Hermes | Kualitatif |
| "Tidak layak untuk kueri kata kunci tunggal atas tiga berkas kecil" | `Q_stdout.txt` G | V-1 | Kualitatif |
| "revisi terakhir menang tanpa peringatan." | `Q_stdout.txt` H | MU-1 | Proksi (§4.9) |
| "Skema blok chart tidak terbaca sebelum dipakai." | `feedback_DB.md` C1 | UD-G, UD-F | Ya: 10 `SCHEMA_INVALID` `studio_figure_preview` DB |
| "Kiriman bab mengganti seluruh isi tanpa gerbang" | `feedback_DB.md` C2 | UD-G | Ya: cid `9a531248` |
| "Batang bertumpuk diminta bahan, tetapi tidak ketemu pada sembilan code yang saya uji." | `feedback_DB.md` C3 | UD-Q6 (b) bentuk | Ya: PNG DB berkelompok |
| "Nomor figur mengikuti posisi" | `feedback_DB.md` C4 | UD-Q6 (a) | Ya: "Gambar 5.1" |
| "Nomor dokumen beku dipakai sebagai kunci global sehingga arm kedua pasti ditolak." | `feedback_DB.md` C6 | UD-Q2 sampul | Ya; pemakai pertama nomor itu WD (§8 A-6) |
| "seluruh nomornya kosong pada kedua keluaran" | `feedback_DB.md` D | UD-Q2 daftar isi | Ya: kolom halaman kosong, 12 PAGEREF |
| "Skema akhirnya saya baca dari kode server (baca-saja)." | `feedback_DB2.md` B4 | UD-F | Ya: 495,3 s (37,7%) membaca repo |
| "satu-satunya jalan pintas (renumberChapters) dikunci ADMIN" | `feedback_DB2.md` C1 | UD-G, UD-T1 | Ya: `FORBIDDEN`; dokumen pertama dibuang |
| "pratinjau 0 isu tata letak" | `feedback_DB2.md` D | UD-Q6 (c) | **Tidak**: PNG DOCX memotong 2 label |
| "Bab 6 harus disalin ulang sebagai JSON studio.chapter/v2 seberat sekitar 15 KB" | `feedback_WD.md` C1 | UD-F, UD-T2 | Ya: DB2 `studio_chapter_submit` payload besar ditolak parser sekali |
| "jalur builder tetap menuntut baca sumber engine 800+ baris." | `feedback_DA.md` C5 | UD-F arm A | Ya: cek lokal 59,4% T DA |
| "Penomoran figur engine urut-lokal (GAMBAR 1)" | `feedback_DA.md` C1 | UD-Q2 arm A | Ya: keterangan tabel DA bernomor engine |
| "Font DATUM (IBM Plex trio) tidak terpasang" | `feedback_DA2.md` C1 | UD-Q3 arm A | Ya: DOCX A tanpa fon tersemat |
| "Tanpa COM tidak ada paginasi nyata" | `feedback_DA2.md` C2 | UD-Q2 daftar isi kedua arm | Ya |
| "Header menuliskan arm kosong dan controller tidak menyebut arm" | `feedback_DF.md` C1 | anomali DF | Ya (§8 A-7) |

Bagian F umpan balik ("mana yang lebih ringan dibanding sesi pertama") dikosongkan Hermes di semua run U-DOC dengan alasan sah (setiap sesi hanya satu arm). Vonis Hermes U-DOC (V-1) tidak ada karena sesi DF tidak menjalankan peran umpan balik akhir.

## 7. Perbandingan dengan putaran 3 (acuan historis; lembar fakta dan bahan berbeda, tidak dipasangkan)

| Ukuran | r3 (research/16 §0, §4.1.4) | r4 | Arah |
|---|---|---|---|
| Arm A | MD dengan skema laporan arm B (G_A = 0) | MD bebas (E4-02) | garis dasar lebih murah |
| KE-1 (a) median r1 | 1,476 (0,900 / 1,476 / 2,167) | 1,725 (1,725 / 2,625 / 1,006) | memburuk |
| KE-1 (b) median r2 / maks | 0,922 / 1,615 | 3,257 / 4,393 | memburuk tajam |
| T START-END arm B (s) | 121,9 / 138,4 / 296,9 | 166,8 / 246,6 / 232,9 | tidak membaik |
| T START-END arm A (s) | 115,9 / 110,1 / 117,9 | 80,1 / 79,8 / 107,2 | lebih cepat (MD bebas) |
| `wall_s` median B/A | 1,353 | 2,607 | memburuk |
| KE-2 median | 1,167 | 2,600 | memburuk |
| Token keluaran median B/A | 1,206 | 2,252 | memburuk |
| KE-3 | 0 galat; Σ G_A = 0 ("tidak ada keunggulan format teramati") | 0 galat server; Σ G_A = 6 (keunggulan format teramati) | membaik sebagai pembeda |
| KE-4 | B 5/5, L_q 2 = 2 | B 5/5 (tafsir Q5), L_q 2 < 3 | setara/sedikit membaik |
| KE-5 | ketat GAGAL (berkas sesaat R9B), sensitivitas lulus | lulus sesudah ajudikasi; 0 berkas sesaat | membaik |
| KE-6 FL | 0/0/0, lulus | 0/1/3, gagal | memburuk |
| KE-7 | KF gagal oleh 1 fakta (R9-F07, verifikasi 04) | KF gagal oleh 1 fakta isi (R11-F01) + 3 fakta notasi | setara |
| Vonis gabungan | NETRAL (ketat TIDAK EFEKTIF) | NETRAL (ketat TIDAK EFEKTIF bila Q5 harfiah) | setara |

Apa yang benar-benar diperbaiki perubahan r4:
- **Biaya proses per langkah hilang.** Server MCP memproses submit/update dalam 1,1-1,8 s per panggilan dan total 5-6 s per run (§4.1.4); tidak ada lagi start `npx tsx` per langkah dan salin basis. Basis sesi bekerja (0 `BASE_CONFLICT`).
- **Asal-usul lebih bersih.** Tidak ada berkas sesaat; unduhan ber-nama C51 dan sha cocok 100% di kedua uji.
- **Retrieval lewat MCP berjalan** (5/5, L_q lebih kecil dari grep MD bebas) bila toolset `query` terpasang (sesi Q).
- **Alat figur** memungkinkan RV-4 tanpa kirim ulang bab (`studio_figure_revise` dipakai di DB dan DB2), dan data Gambar 6.1 benar di semua dokumen B.

Apa yang tidak diperbaiki:
- **Jumlah giliran dan konteks per giliran**, yang kini menjadi biaya utama: B 1,45-2,19x giliran, 1,32-2,20x token masuk per giliran (pengecil token tidak mencapai tanda 1,25).
- **Kerja menyusun laporan berstruktur**: tulis/sunting tetap kategori terbesar; laporan B lebih besar (9,0-14,9 KB lawan 8,0-9,1 KB A) karena tabel butir/bukti.
- **Penemuan bentuk data**: R11B dan R12B membuka registri/resep (FL 1 dan 3); DB dan DB2 menebak skema chart (10 dan 3 `SCHEMA_INVALID`) atau membaca kode server (DB2 495 s).
- **Dokumen klien**: perakitan chrome (nomor dokumen, huruf revisi, nomor bab/gambar, halaman daftar isi, keterangan tabel) belum setara builder lokal; dua dari empat butir sampul/struktur gagal di DB.

## 8. Anomali dan celah data

| ID | Anomali / celah | Bukti | Dampak pada analisis |
|---|---|---|---|
| A-1 | Parser `mcp_ok` toolcalls tidak mengenali hasil galat server; semua `ok:false` tercatat `?`, meta `toolcalls_n_mcp_galat=0` | crosstab WD 9/9, DB 18/18, DB2 10/10 (`aN/reconcile.py`); `ab4.py:1697-1714` | D-517/D-518 "0 galat MCP" untuk WD, DB, DB2 keliru; UD-G dan KE-3 memakai log server |
| A-2 | `postcheck` H4-8 menilai draf MD dari baris CLI di timing.csv, tidak mengenali kiriman MCP berbasis `path`; untuk U-DOC tidak menjalankan cek atas draf bab | `R10B_postcheck.json` `drafts[0].alasan`; `DB_postcheck.json` "cek draf belum dijalankan" | D_raw mentah 1-6 per run; diajudikasi manual (§4.5, §5.6) |
| A-3 | Brief U-REP §5 menyuruh R12B memakai `studio_contracts_query`/`studio_search`, toolset `reports` tidak memuatnya | log server R12B `toolsets:["reports"]`; brief 09 laporan §5 | 3 panggilan ditolak, 6 GET HTTP lewat `trial-log get` (penyimpangan arm B), sekitar 60 s ekstra di R12B (HTTP 32,3 s + skema 28,3 s) |
| A-4 | `Q_key_resolved.md` tidak pernah ditulis; tidak ada `freeze --force` sebelum Q (Q memakai freeze `cd2fda93` yang sama) | `controller_ab4/answers/` hanya `Q_key.md`; meta Q | Kunci diselesaikan analis dari render HTML tersimpan dan MD akhir; Q5 B butuh tafsir (§4.4) |
| A-5 | Dry-run R08 isi tersimpan, R20 per revisi, SQL MU-1 tidak dijalankan | tidak ada berkas hasil di `controller_ab4/` | G_B,stored = proksi; fakta status transien TIDAK-DAPAT-DIHITUNG; MU-1 proksi |
| A-6 | Pemanasan WD memakai bahan asli `ud1/source/` (prompt WD baris 16), bukan bahan sintetis `doc_ud1/wd/`; dokumen WD memakai nomor `GSP-UD1-NL-001` | `prompt_WD.txt`; nama `sandbox/wd/GSP-UD1-NL-001_rev9_...docx`; sha `bab-06-rev1.md` WD = DB | Arm B mendapat latihan penuh sebelum DB (bias menguntungkan B); `DOC_NUMBER_EXISTS` di DB dan DB2 |
| A-7 | Prompt DF = brief umum dengan ARM `-`, bukan prompt umpan balik akhir §6.6 | `prompt_DF.txt:1-6`; `feedback_DF.md` C1 | Tidak ada vonis Hermes U-DOC; DF membangun dokumen arm A ketiga (informatif) |
| A-8 | Arm A U-DOC menandai S1/S2 sesudah satu build Rev 0 + Rev 1 | `doc_ud1/timing.csv` DA seq 15-22, DA2 seq 13-28 | UD-1b tidak bermakna (§5.1) |
| A-9 | docxcheck H4-11 tidak dibangun; `host_whitelist.txt` tidak ada | Grep `ab4.py`; `ls controller_ab4/` | docxcheck dibangun baris ini (§12); bukti render_server R11B bersandar pada baris proses host_pre |
| A-10 | DB menjalankan pembukaan orkestrasi GSP: subagen Request Translator (`delegate_task`, 185,4 s) dan `clarify` (8,1 s) | `tc:DB` baris 6 dan 26 | T1_B DB naik sekitar 110 s (atribusi 101,7 + 8,1 s); tanpa itu UD-1a sekitar (938,7-109,8)/720,2 = 1,151, tetap GAGAL |
| A-11 | Pembingkaian D-518 "build pertama DB/DA 1,96x, revisi DB2/DA2 1,90x" adalah rasio `wall_s` dua pasangan, bukan metrik build/revisi | meta `wall_s` 1.615,8/822,6 dan 1.443,4/758,5 | Penugasan menyebut DB2/DA2 sebagai "revisi"; sebenarnya kedua pasangan memuat S1 dan S2; laporan ini memakai DB/DA sebagai pasangan utama dan DB2/DA2 sebagai UD-S5 |
| A-12 | Jendela `qmark` Q sempit (1,7-18,7 s), satu jawaban Q3 A salah tempel lalu dikoreksi | `retrieval.csv`; `Q_stdout.txt` B-1 | L_q dari toolcalls; skor A memakai jawaban akhir (jawaban pertama dicatat) |
| A-13 | Hasil alat MCP tidak diekspor (hanya `result_len`) | H4-5 | Lint Studio per aturan, `layoutIssueCount`, isi galat pra-server, nilai `valid` check: TIDAK-DAPAT-DIHITUNG |
| A-14 | Spec blok chart tersimpan tidak dapat dibaca tanpa DEV/DB | penugasan | Data Gambar 6.1 diverifikasi dari PNG di DOCX (§5.5) |
| A-15 | DB2 membuat dua dokumen (dokumen pertama `rev7` dibuang karena "Gambar 5.1") dan menyalin DOCX ke folder run | `sandbox/db2/`, `db2/` | Jejak berkas lebih besar; T1_B DB2 memuat pembangunan ulang penuh |
| A-16 | timing.csv tidak memadai sebagai silang langkah (4-10 baris `act=1` per run) | §4.2 | Hanya log sesi yang dipakai |

Yang tidak dapat diverifikasi sama sekali: pesan galat panggilan yang ditolak sebelum server (WD 2, DB 3, DB2 2, R12B 3); hasil lint Studio per aturan untuk DB/DB2; status S1/S2 tersimpan per revisi arm B; pembuat pasti berkas `wd_*` di `%TEMP%`.

## 9. Rekomendasi: apa yang membuat Studio benar-benar lebih efisien untuk Hermes

Dasar: waktu arm B adalah jumlah giliran model x lama per giliran; server hanya 0,6-3,0% dari T (§4.1.4, §5.2). Rekomendasi di bawah diurutkan menurut detik yang dapat dihemat menurut data run ini. Semuanya usulan; pemilik dan keputusan di controller/USER.

| # | Usulan | Masalah yang diukur | Perkiraan hemat (dari data run ini) | Pemilik usulan |
|---|---|---|---|---|
| R-1 | Lengkapi toolset `documents` dengan pembaca skema blok (atau contoh blok `chart` lengkap per kode di resep `dokumen-klien`) dan sediakan kode batang bertumpuk yang terdokumentasi | DB: 10 `SCHEMA_INVALID` pratinjau + 1 revise, pemutus sirkuit klien; panggilan figur 174,7 s (14,8% T); DB2 membaca kode server 495,3 s (37,7% T); resep menunjuk `studio_registry` yang tidak ada di toolset | DB sekitar 175 s, DB2 sekitar 495 s | MCP (alat dokumen) |
| R-2 | Nomor figur/tabel eksplisit dan pemetaan nomor bab (mis. kunci bab 6/10) yang tidak butuh `renumberChapters` admin; keterangan tabel dari Markdown | "Gambar 5.1"; DB2 membangun ulang dokumen penuh; DB 0 keterangan tabel | DB2 sebagian besar dari T1 1.133,6 s (dokumen pertama dibuang); syarat UD-2 | MCP + engine render |
| R-3 | Importer menerima `##` sebagai judul bab (atau parameter judul per impor) tanpa membuang awalan "Chapter N." dan mendukung blok `chart` di Markdown | WD/DB2 menyalin bab 6 sebagai JSON `studio.chapter/v2` sekitar 15 KB; `SCHEMA_INVALID` judul bab; awalan judul hilang (Q1a DB2 96,2%) | Kiriman JSON bab 6 dan revisinya (T2_B 180-238 s didominasi kirim ulang bab) | MCP importer |
| R-4 | Pagar kiriman bab: tolak kiriman yang menghapus sebagian besar blok kecuali bendera ganti-menyeluruh; sunting per paragraf/pid untuk revisi kecil | DB kehilangan prosa bab 5 (cid `9a531248`); revisi 4 perubahan kecil memakan 238,0 s (DB) dan 180,2 s (DB2) | Bagian besar T2_B | MCP |
| R-5 | Nomor dokumen dan huruf revisi: terima `Rev 0/Rev 1` dari meta (atau petakan eksplisit di `template_get`), ruang nomor per run/agen untuk uji | `SCHEMA_INVALID /meta/rev`, `DOC_NUMBER_EXISTS` di DB dan DB2; nomor sampul gagal UD-2 | 2 galat per run + syarat UD-2 | MCP + harness (WD jangan memakai nomor bahan nyata) |
| R-6 | Daftar isi dengan nomor halaman terisi (perbarui field PAGEREF saat render atau tanda "perbarui saat dibuka") dan tanpa judul bab terulang | Kolom halaman kosong di 12/12 dan 6/6 baris | Mutu (UD-Q2/UD-3) | engine render DOCX |
| R-7 | Samakan lint figur pratinjau dengan raster DOCX (ukur bbox teks pada PNG yang disematkan) | DB2: pratinjau "0 isu", PNG DOCX memotong 2 label | Mutu (UD-Q6 c) | engine chart |
| R-8 | Pasang `studio_contracts_query` dan `studio_search` di toolset `reports`, atau alat `studio_ref_resolve` (docKey ke documentId + pid blok) | R12B: 3 panggilan ditolak, 6 GET HTTP lewat `trial-log get` 32,3 s, skema/panduan 28,3 s, registri 9,1 s | sekitar 60-70 s pada R12B | MCP (toolset) |
| R-9 | Satu panggilan "susun" untuk S1: `submit` sudah memvalidasi, jadi `check` terpisah opsional; kirim template + submit dalam satu giliran | R11B 4 `check` (1,55 s server, tetapi tiap check = satu giliran model sekitar 6-8 s) | 1-3 giliran per run, sekitar 6-25 s | MCP + resep |
| R-10 | Perkecil hasil alat ringkas: hilangkan `OWNER_AGENT_MISMATCH` berulang, saran salin `nextBasis`, `completenessPreview` yang disuruh diabaikan, `structuredContent` penuh secara bawaan | Masuk per panggilan B 63-110 ribu lawan A 48-50 ribu (1,32-2,20x); lama per giliran B 1,19-1,34x | Bila masuk per giliran turun ke 1,25x A, lama giliran B diperkirakan turun sekitar 5-10% (hipotesis; korelasi dari 3 pasangan) | MCP (hasil ringkas) |
| R-11 | Muat skema alat yang dipakai di awal sesi (hindari 5-10 `tool_describe`/`tool_search` per run) atau jelaskan alur di satu prompt MCP | `tool_describe` 5-6 dan `tool_search` sampai 4 per run B; skema/panduan 14,5-28,3 s per run U-REP, 62,6 s DB | 15-60 s per run | MCP prompt/resep + konfigurasi Hermes |
| R-12 | Status butir di luar enum: petakan otomatis atau tolak dengan saran (bukan "valid" sambil membuang baris) | R11B `CONTRACT_STATUS_UNMAPPED` 6 baris | Mutu + 1-2 giliran | kontrak laporan |
| R-13 | `studio_file_verify` dan `studio_document_status` menerima `agentId` seperti alat tulis | 2 `INVALID_ARGUMENT` di DB | 2 giliran | MCP |

Rekomendasi untuk harness dan protokol (agar putaran berikut terukur sah): perbaiki parser `mcp_ok` (A-1) dan postcheck MCP (A-2); selaraskan brief dengan toolset (A-3); jalankan langkah controller sebelum Q (R08, R20, kunci, `freeze --force`) (A-4, A-5); WD memakai bahan sintetis dan nomor dokumen sendiri (A-6); prompt DF khusus umpan balik (A-7); arm A U-DOC wajib membangun Rev 1 sesudah mark S1, atau T2_A diambil dari waktu tulis berkas Rev 1 (A-8); matikan pembukaan orkestrasi (subagen RT, `clarify`) di prompt uji atau laporkan terpisah (A-10); ekspor ringkasan hasil alat MCP (`ok`, `code`, `valid`, `layoutIssueCount`) tanpa isi (A-13).

Pertanyaan yang disiapkan untuk USER (research/17 §19 butir 5): U-REP: adopsi MCP sebagai jalur laporan untuk laporan yang banyak, disunting bertahap, dan dicari agen lain (kekuatan terukur: retrieval dan asal-usul), hentikan klaim waktu, atau desain ulang (R-8 sampai R-12)? U-DOC: tetap builder lokal untuk dokumen klien sampai R-1 sampai R-7 terpasang, lalu uji ulang satu pasangan dengan bahan sintetis untuk WD?

## 10. Key Findings

| # | Temuan | Confidence | Evidence | Implication |
|---|---|---|---|---|
| KF-1 | KE-1 U-REP gagal di kedua bagian dan di semua sensitivitas: median r1 1,725, median r2 3,257, maks 4,393 | HIGH | `aN/urep_time.txt`; `<RUN>_phases.json`; timing.csv | MCP belum memenuhi D-422 terhadap MD bebas |
| KF-2 | Server bukan biaya: 5,0-5,8 s per run U-REP B (2,2-3,0% T), 7,5-9,7 s per run U-DOC B (0,6-0,8%) | HIGH | `mcp:<RUN>` `durationMs`; `aN/mcp_dur.txt` | Optimasi harus pada jumlah giliran dan ukuran konteks |
| KF-3 | B memakai 1,45-2,19x giliran dan 1,32-2,20x token masuk per giliran (U-REP); pengecil token tidak mencapai tanda 1,25 | HIGH | `usage_<RUN>.json` | R-9, R-10, R-11 |
| KF-4 | Gerbang keras U-REP lulus pada definisi utama; vonis NETRAL; menjadi TIDAK EFEKTIF bila kunci Q5 dibaca harfiah | MEDIUM | §4.4, §4.10 | Tafsir Q5 perlu keputusan USER |
| KF-5 | Toolcall `mcp_ok` salah baca galat; 37 galat server U-DOC (WD 9, DB 18, DB2 10) tercatat sebagai 0 di meta | HIGH | `aN/reconcile.py` crosstab | Koreksi D-517/D-518; perbaiki parser |
| KF-6 | U-DOC DB lebih lambat (UD-1a 1,303) dan gagal UD-2 KERAS (nomor sampul, keterangan tabel, nomor gambar) walau isi 100% setia | HIGH untuk angka, LOW-MEDIUM untuk vonis (n = 1) | `aN/udoc.txt`, `aN/docx_all.txt` | Vonis LEBIH BURUK (usulan controller) |
| KF-7 | Data Gambar 6.1 benar di semua dokumen, tetapi DB berbentuk berkelompok (bukan bertumpuk) dan DB2 memotong 2 label yang lolos pratinjau Studio | HIGH | `aN/fig/*.png` (inspeksi visual) | R-1, R-7 |
| KF-8 | Bias urutan U-DOC berbalik: WD melatih jalur B dengan bahan dan nomor yang sama sebelum DB | HIGH | prompt WD; sha `bab-06-rev1.md` | Kesimpulan "B tidak lebih cepat" konservatif; nomor sampul gagal karena itu |
| KF-9 | UD-1b tidak terukur wajar karena arm A membangun Rev 0 dan Rev 1 sekaligus | HIGH | timing.csv DA/DA2; `feedback_DA*.md` E | Protokol perlu aturan build revisi terpisah |
| KF-10 | Berkas `%TEMP%/wd_*` tidak dibuat sesi uji mana pun | HIGH (negatif), LOW (pembuat) | 0 rujukan di 15 ekspor toolcalls; mtime; `DB_host_post.txt:25` | Tidak masuk D_raw |

## 11. Asumsi dan celah (Tier 1)

| ID | Asumsi / celah | Dampak bila keliru |
|---|---|---|
| AS-1 | Jam `timing.csv`, toolcalls (state.db), dan log server sama (terbukti r3 research/16 AS-2; pencocokan per panggilan ±1 s berhasil 100%) | Batas fase bergeser sedikit; rasio tidak berubah arah |
| AS-2 | HTML render terakhir di sandbox mewakili isi tersimpan sebelum sesi Q (tidak ada tulisan dokumen B sesudah render S3 selain GET R12B) | Kunci Q3/Q5 B berubah bila ada revisi sesudah render; tidak ada bukti revisi itu |
| AS-3 | Status tersimpan arm B = kepala MD terkirim terakhir (0 edit MD sesudah update terakhir, §4.5) | Kunci Q2 B |
| AS-4 | Pembacaan visual nilai grafik dari PNG akurat (bilangan bulat 0-5 pada garis kisi) | Q6 (b); risiko rendah |
| AS-5 | datum_lint sebagai pengganti lint Studio untuk kelas `rakitan_alat` | UD-3; lint Studio sendiri tidak tersedia |
| AS-6 | Klasifikasi token tambahan Q1c sebagai chrome (kop perusahaan, nomor/tanggal dokumen) | Bila dihitung isi, Q1c DB/DB2 gagal (memperberat vonis B) |
| AS-7 | FD_B dinilai analis dari swalapor | KE-6 tidak bergantung padanya (FL sudah gagal) |
| G-1 | n = 3 pasangan U-REP, n = 1 (+1) U-DOC; tidak ada uji statistik | Vonis deskriptif |
| G-2 | Sesi non-uji gsp-master01 dan profil lain tidak diperiksa | Pembuat `wd_*` tidak terbukti |

## 12. Files/Modules Involved

| Berkas | Peran |
|---|---|
| `research/26_efficiency_results_r4.md` (ini) | Hasil dan vonis r4 |
| `Temp/hermes_trial/analysis_r4/common.py` | Utilitas baca data (meta, timing, toolcalls, log server, usage, penanda) |
| `analysis_r4/urep_time.py` -> `urep_time.txt/.json` | KE-1, sensitivitas, KE-2, token, durasi server |
| `analysis_r4/phase_attr.py` -> `phase_attr.txt` | Pecahan waktu per kategori aksi (KE-1 §4.1.4, UD-F) |
| `analysis_r4/reconcile.py`, `dumptc.py` | Rekonsiliasi toolcalls lawan log server; tampilan ringkas tool call |
| `analysis_r4/retrieval.py`, `htmlpid.py` -> `retrieval.txt` | Penyelesaian kunci Q dan skor KE-4 |
| `analysis_r4/kf.py` -> `kf.txt` | KE-7 KF |
| `analysis_r4/ga_checker_dc47b_copy.py` -> `ga.txt` | G_A (salinan checker DC-47b) |
| `analysis_r4/fl.py` -> `fl.txt` | KE-6 FL |
| `analysis_r4/udoc.py` -> `udoc.txt/.json` | UD-T, UD-N, UD-K, UD-G, UD-S1..S3 |
| `analysis_r4/docx_extract.py`, `docxcheck.py`, `docx_all.py` -> `docx_all.txt/.json`, `fig/*.png` | **docxcheck H4-11 dibangun baris ini** (stdlib zipfile + xml.etree): UD-Q1..Q5, posisi dan ekstraksi Gambar 6.1 |
| `analysis_r4/datum_lint.txt`, `datum_lint_orig.txt`, `lint_in/` | datum_lint atas salinan dan berkas asli DOCX |
| `analysis_r4/mcp_dur.txt` | `durationMs` server per alat |

## 13. Collection Log dan perintah reproduksi (baca saja)

1. Read: research/17 (utuh), research/16 §0 dan §4.1.4, research/11 §4.3-§4.8, research/15 §6.1-§6.5, decisions D-422..D-519, brief 09 (laporan, dokumen), manifest 09 (utuh), `Q_key.md`, `ab4.py:1697-1830` (parser toolcalls).
2. Data: timing.csv, retrieval.csv, meta/phases/postcheck/sandbox/snapshot/usage/stdout per run, toolcalls 15 run, mcpcalls 9 run, feedback dan format U-DOC, laporan MD dan HTML/DOCX keluaran.
3. Perintah (dari `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/analysis_r4/`): `python urep_time.py`; `python phase_attr.py R10B R10A R11B R11A R12B R12A DB DA DB2 DA2`; `python -I reconcile.py W R10B R11B R12B M Q WD DB DB2`; `python retrieval.py`; `python kf.py`; `python -I ga_checker_dc47b_copy.py <laporan.md...>`; `python fl.py`; `python udoc.py`; `PYTHONIOENCODING=utf-8 python docx_all.py`; datum_lint: `uv run --python 3.11 --no-project --with python-docx python <skill>/scripts/datum_lint.py <docx>`.
4. Tidak dijalankan: subperintah runner yang menulis (`run-session`, `mcp-wrap`, `freeze`, `mcp-unblock`); panggilan DEV 9021; akses DB; git. Berkas rahasia uji tidak dibaca atau dicetak. Tidak ada data uji yang diubah; semua keluaran ditulis di `analysis_r4/`.

## 14. Acceptance Criteria (ANALYSIS-R4)

- [x] Ringkasan vonis per uji (U-REP NETRAL dengan alternatif ketat; U-DOC LEBIH BURUK, usulan controller, n = 1).
- [x] Tabel metrik bersumber; ambang dicek; TIDAK-DAPAT-DIHITUNG beralasan bila data tidak cukup.
- [x] Rekonsiliasi hitung MCP R12B, M, WD, DB, DB2 dijelaskan per baris.
- [x] Retrieval Q presisi/recall terhadap aturan `Q_key.md`.
- [x] UD-Q1..Q6 dari DOCX nyata (docxcheck dibangun dan dinyatakan); Gambar 6.1 diperiksa; yang tak terverifikasi disebut.
- [x] Asal-usul KE-5/UD-J, termasuk berkas `wd_*`.
- [x] Umpan balik Hermes dikutip (maks 15 kata) dan dipetakan; perbandingan r3; rekomendasi berbasis pecahan waktu dan `durationMs`.

## Adendum controller (2026-11-03, D-524..D-526): vonis final r4

Verifikasi independen (`verification/12_results_r4_verification.md`) menghitung ulang semua angka dengan skrip sendiri dan cocok; tidak ada vonis yang berubah. Koreksi atas laporan ini:

| # | Koreksi | Dampak |
|---|---|---|
| M-1 | Sumber Gambar 6.1 di DB TERLIHAT sebagai paragraf `SUMBER Table 6.1, bab 6 dokumen ini` di bawah gambar, bukan hanya di alt | Q6 (a) sumber DB terpenuhi; kegagalan UD-2 DB tetap (nomor sampul, keterangan tabel, nomor gambar 5.1) |
| M-2 | DA2 membangun Rev 1 SESUDAH mark S1 (hanya DA yang membangun Rev 0+1 sebelum S1) | Rasio revisi DB2/DA2 = 3,750 adalah ukuran sah |
| M-3 | DB sesudah END menjalankan `lad_card.py` (kartu `t_3c0afd09`); server MCP kedua mulai tanpa rahasia (RK4-3) | Cakupan asal-usul DB sesudah 00:05:45Z tidak lengkap; kesimpulan `wd_*` tetap |

Keputusan USER (D-525): Q5 dibaca sebagai rujukan kasar (arm B 5/5, KE-4 LULUS); draf bab U-DOC dilaporkan dua bacaan dengan bacaan ketat sebagai utama (UD-6 GAGAL); ambang U-DOC dikonfirmasi.

G_B,stored kini diukur langsung (D-526), bukan proxy: R20 `shape=submission` lalu R08 dry-run untuk record + bab 1-5 dari W rev18, R10B rev18, R11B rev17, R12B rev15, M rev16 = 30/30 `200, valid=true`, tanpa kode (`contract_ab4/sessions/ke3_dryrun.csv`, skrip `controller_ab4/dc45d/ke3_dryrun.py`). Gerbang KERAS LULUS.

**Vonis final r4:**

- **U-REP: NETRAL.** Semua gerbang KERAS lulus (KE-3 stored 0 terukur, KE-4 5/5 dengan rujukan kasar, KE-5 asal-usul). KE-1 GAGAL kedua bagian (median r1 1,725 > 1,00; median r2 3,257 > 0,70, maks 4,393). Studio lebih unggul di retrieval (B 5/5, A 4/5), kalah di biaya menulis.
- **U-DOC: LEBIH BURUK** (n = 1, confidence LOW-MEDIUM, ambang dikonfirmasi USER). DB gagal UD-2 KERAS (nomor dokumen sampul, keterangan tabel, nomor gambar), UD-1a 1,303, revisi DB2/DA2 3,750, UD-6 gagal pada bacaan utama. Isi setia 53/53 paragraf, 630/630 token; data Gambar 6.1 benar di keempat dokumen.

Akar biaya (dasar ronde 5, D-521..D-523): waktu server hanya 0,6-3,0 % sesi; beban arm B ada pada penemuan alat, bentuk kontrak, dan loop cek, serta pada format yang seharusnya dikerjakan mesin.
