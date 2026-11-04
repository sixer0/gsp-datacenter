# 18 — Verifikasi independen laporan hasil loop r6-r13

Status: disusun verifier 2026-11-04. Target: `research/29_loop_results_r6_r13.md` (tidak diubah). Vonis keseluruhan: **FAIL** (perlu koreksi sebelum dipakai sebagai dasar keputusan go-live). Angka inti (tabel §3.1, §3.2, gabungan §5) tereproduksi persis; kesalahan ada di klaim gerbang KERAS (KE-4/KE-5 r10 dan r13) dan di beberapa kesimpulan naratif yang melampaui bukti.

## 1. Lingkup verifikasi

| Butir | Isi |
|---|---|
| Yang diverifikasi | Setiap klaim angka/fakta di §1-§6 laporan 29 |
| Sumber | `decisions/decisions.md` D-547..D-575 (baris 553-581); `hermes_trial/analysis_loop/` (`urep_<r>.json`, `udoc_<r>.json`, `docx_all5.json`, `rounds.json`, `retrieval5.py`, `prov.py`, `docxcheck5.py`); data mentah `contract_ab<N>/`, `doc_ud<N>/`, `controller_ab<N>/` (toolcalls, preq, sessions meta, `ke3_dryrun.csv`); git `6a16bbd..044a1f7`; protokol `research/15` §6.3, `research/17` baris 323, `research/28` §4.5 |
| Perintah yang dijalankan ulang | `python urep.py r11`, `python urep.py r13` (keluaran JSON identik dengan versi sebelumnya, dibandingkan dengan salinan cadangan di scratchpad); `python retrieval5.py r6..r13`; `python prov.py r11/r12/r13 R10B R11B R12B`; `docxcheck5.check()` diimpor dari skrip scratch untuk r10/r12 (tanpa menimpa `docx_all5.json`) |
| Tidak disentuh | `hq_v21_clone/*`, DB produksi, port 9011, `~/gsp-datacenter`, kode, laporan target |
| Efek samping | `urep.py` menulis ulang `urep_r11.json/.txt` dan `urep_r13.json/.txt`; JSON terbukti identik byte-isi (perbandingan `json.load` sama) |

Legenda: **VERIFIED** = cocok dengan sumber; **DISCREPANCY** = berbeda dengan sumber; **UNVERIFIABLE** = tidak ada artefak yang cukup untuk memastikan.

## 2. Checks (ringkasan)

| Aspek | Hasil | Bukti utama |
|---|---|---|
| Intent alignment (laporan menjawab pertanyaan loop: target, gerbang, rekomendasi) | Pass dengan catatan | Semua sasaran D-549 tercakup di §1; KE-5 protokol (jejak disk) tidak dilaporkan, diganti cek rujukan (H-2) |
| Syntax / konsistensi angka | Pass | 24/24 rasio U-REP, 8 median/maks, 14 pasangan U-DOC, gabungan r11-r13 cocok persis (§3 di bawah) |
| Logic (kesimpulan mengikuti bukti) | Fail | KE-4/KE-5 r10 dan r13 salah skor (H-1); "penalaran B/A setara", "turun 3-4x ... stabil sesudahnya", "sedikit lebih lambat" melampaui data (M-2..M-4) |
| Integration (rantai skrip -> JSON -> laporan) | Pass dengan catatan | `urep.py` reproduktif; `retrieval5.py` memakai heuristik pid yang salah di r10/r13 (H-1); `docx_all5.json` tidak memuat r10/r12 (L-3) |
| Regression (konsistensi dengan log keputusan) | Pass dengan catatan | Laporan mengikuti D-557..D-574, tetapi mewarisi kesalahan D-568/D-574 tentang KE-5 |

## 3. Pemeriksaan per klaim

### 3.1 Tabel U-REP (§3.1) dan median

Sumber: `urep_<r>.json` kunci `pairs.<R10|R11|R12>.r1/r2`, `median_r1`, `median_r2`, `max_r2`.

| ID | Klaim | Nilai di sumber | Status |
|---|---|---|---|
| C-01 | r6 1,671/4,307; 2,446/7,891; 0,458/0,415; med 1,671/4,307; maks 7,891 | 1.6709/4.3067; 2.4458/7.8910; 0.4576/0.4155; 1.6709/4.3067/7.8910 | VERIFIED |
| C-02 | r7 0,468/1,016; 0,970/1,466; 1,335/0,934; 0,970/1,016/1,466 | 0.4684/1.0156; 0.9704/1.4658; 1.3353/0.9341; sama | VERIFIED |
| C-03 | r8 0,877/2,492; 1,352/1,675; 0,199/2,778; 0,877/2,492/2,778 | 0.8773/2.4923; 1.3520/1.6746; 0.1987/2.7782 | VERIFIED |
| C-04 | r9 0,797/0,611; 6,421/0,251; 1,758/0,512; 1,758/0,512/0,611 | 0.7968/0.6108; 6.4209/0.2513; 1.7581/0.5118 | VERIFIED |
| C-05 | r10 0,765/2,436; 1,544/1,489; 9,218/7,056; 1,544/2,436/7,056 | 0.7655/2.4364; 1.5442/1.4892; 9.2180/7.0557 | VERIFIED |
| C-06 | r11 0,559/0,863; 0,726/2,158; 2,593/0,490; 0,726/0,863/2,158 | 0.5590/0.8630; 0.7261/2.1577; 2.5934/0.4901; dijalankan ulang `python urep.py r11` -> identik | VERIFIED |
| C-07 | r12 0,931/1,933; 0,817/1,057; 0,764/1,889; 0,817/1,889/1,933 | 0.9309/1.9329; 0.8170/1.0565; 0.7640/1.8889 | VERIFIED |
| C-08 | r13 0,860/1,393; 1,034/0,744; 1,618/2,413; 1,034/1,393/2,413 | 0.8599/1.3931; 1.0336/0.7435; 1.6175/2.4134; dijalankan ulang -> identik | VERIFIED |
| C-09 | Catatan r6 "jam dari START harness" | `T1_basis: START_h` r6/r7; `START_hermes` r8+ | VERIFIED |
| C-10 | Catatan r7/r8/r9/r10/r12 (W menyimpang; regresi agentId; B merencanakan S1-S3; outage + tabel jadi daftar; beban host) | D-565, D-566, D-567 (r9 juga tanpa `S2B/S3B` di JSON), D-568/D-570, D-572 | VERIFIED |
| C-11 | §1 KE-1 r1 lulus di r7, r8, r11, r12; r13 1,034 | median_r1 per ronde di atas | VERIFIED |
| C-12 | §1 KE-1 r2 lulus sekali (r9 0,512/0,611) | hanya r9 memenuhi median <= 0,70 dan maks <= 1,00 | VERIFIED |
| C-13 | §4.1 median r2 berayun 0,51/0,86/1,89/1,39 (r9, r11, r12, r13) | 0.512/0.863/1.889/1.393 | VERIFIED |

### 3.2 Volume penalaran (§3.1 paragraf 2, §5, §6.3)

Sumber: `urep_<r>.json` `pairs.*.reason_chars`; definisi di `urep.py:55-62` (jendela START harness..END, termasuk fase orientasi P arm B sejak r8).

| ID | Klaim | Bukti | Status |
|---|---|---|---|
| C-14 | Angka karakter r6, r7, r13 (9 pasang B/A) | persis sama, mis. r6 R10 [209972, 49510], r13 R12 [71638, 50356] | VERIFIED |
| C-15 | "Biaya adaptasi Studio turun 3-4x dari r6 ke r7" | B r6/r7: R10 4,38x, R11 2,89x, R12 1,36x; total 454.078/170.490 = 2,66x | DISCREPANCY (M-3) |
| C-16 | "... dan stabil sesudahnya" | B naik lagi di r8 (94.702/106.376/106.330), r10 R12B 255.446; D-566 sendiri: "penalaran arm B naik". Jendela r8+ juga memuat fase P sehingga tidak sebanding dengan r6/r7 | DISCREPANCY (M-3) |
| C-17 | §5 "penalaran B/A setara" (r11-r13) | 9 rasio B/A: 0,63; 2,10; 0,94; 1,77; 5,05; 1,61; 1,46; 2,40; 1,42 (median 1,61); total B 518.994 / A 395.952 = 1,31 | DISCREPANCY (M-2) |
| C-18 | §6.3 "biaya adaptasi r6 (penalaran 3-7x)" | rasio B/A r6: 4,24; 7,20; 1,65 (D-557 memakai ukuran lain: 4-8x) | DISCREPANCY ringan (L-4) |

### 3.3 Tabel U-DOC (§3.2) dan ringkasan §1/§5

Sumber: `udoc_<r>.json` (rasio = DB.T1/DA.T1, DB.T2/DA.T2, dst.), `docx_all5.json`, cek segar `docxcheck5.check()`.

| ID | Klaim | Bukti | Status |
|---|---|---|---|
| C-19 | r6 0,315/0,363; 0,294/0,363 | 467,9/1487,0 = 0,315; 42,9/118,2 = 0,363; 210,4/715,4 = 0,294; 18,2/50,2 = 0,363 | VERIFIED |
| C-20 | r7 0,437/0,279; 0,207/0,224 | 258,0/589,8; 14,3/51,3; 142,2/685,6; 14,9/66,6 | VERIFIED |
| C-21 | r8 0,244/0,358; 0,428/0,255 | 249,9/1024,1; 53,5/149,5; 289,8/676,7; 16,3/64,2 | VERIFIED |
| C-22 | r9 0,246/0,388; 0,098/0,581 | 273,4/1110,7; 41,2/105,9; 196,0/2004,4; 27,1/46,6 | VERIFIED |
| C-23 | r10 0,192/0,027; DB2/DA2 tidak sah (DA2 kehabisan anggaran profil) | 223,9/1167,0; 9,4/343,7; `udoc_r10.json` tanpa DA2; `doc_ud7/sessions/DA2_meta.txt` `wall_s=2210.327`, `timing.csv` DA2 hanya S0 (START + 18 `get`); anggaran 2700 s per D-568 | VERIFIED |
| C-24 | r11 0,463/0,461; 0,140/0,223 | 302,8/653,6; 20,7/44,8; 157,2/1121,7; 10,9/48,9 | VERIFIED |
| C-25 | r12 DB/DA tidak sah (DA berhenti sebelum S1); 0,220/1,276 | `udoc_r12.json` tanpa DA; `doc_ud9/timing.csv` DA hanya S0 (START + 11 `get`); 282,6/1282,3; 31,9/25,0 | VERIFIED |
| C-26 | r13 0,188/0,315; 0,159/0,539 | 166,8/886,3; 12,8/40,6; 154,6/975,3; 9,1/16,9 | VERIFIED |
| C-27 | §1 UD-1a 0,098-0,463 di 14 pasangan sah; UD-1b 0,027-0,581 di 13/14, 1,276 sekali | hitungan pasangan sah 2+2+2+2+1+2+1+2 = 14; min/maks cocok | VERIFIED |
| C-28 | §1 "T1 2-10x lebih cepat" | 1/0,463 = 2,16; 1/0,098 = 10,2 | VERIFIED |
| C-29 | §5 U-DOC 5 pasangan r11-r13: UD-1a 0,140-0,463; UD-1b 0,223-0,539 kecuali 1,276 | dari C-24..C-26 | VERIFIED |
| C-30 | UD-2 r6 "judul 18/18 tepat; label grafik terpotong (UD-3)" | `docx_all5.json` r6_DB*_S* `Q2_heading` [18,18]; D-557 UD-3 GAGAL "Low-Medium" | VERIFIED |
| C-31 | UD-2 r7 "DB: RV-3 jadi paragraf baru; DB2 utuh; footer benar" | r7_DB_S2 `Q4_rv3` [["paragraf_sendiri",128]]; r7_DB2_S2 `menyatu`; footer r7 "GSP-UD1-NL-001 REV 1" vs r6 "047/GSP/KT/X/2026 REV A" (`Q2_header_footer`, `Q2_hf_nomor`) | VERIFIED |
| C-32 | UD-2 r8, r9, r11 utuh | Q1a 53/53, Q1b 630/633, Q2h 18/18, RV-3 `menyatu` di DB/DB2 | VERIFIED |
| C-33 | UD-2 r12 "DB2 utuh" | `docx_all5.json` TIDAK memuat r12; cek segar `docxcheck5.check()`: r12 DB2 S1 Q1a (53,53), Q1b (630,630), Q2h (18,18), subbab (12,12); S2 Q1b (633,633), RV-3 `menyatu`, footer nomor meta True | VERIFIED (oleh verifier; sumber yang dikutip laporan tidak memuatnya, L-3) |
| C-34 | UD-2 r13 "DB kurang 9 token isi (kesalahan penulis)" | r13_DB_S1 Q1b [621,630], defisit token 1+1+1+1+2+1+1+1 = 9; Q1a 52/53 (paragraf "The production plan is six phases ..."); paragraf itu tidak ada di argumen `studio_write` DB (`controller_ab13/toolcalls/DB_toolcalls.csv`) tetapi ada di DB2 -> kelalaian penulis | VERIFIED |
| C-35 | §1 UD-2 "sejak r7 footer, riwayat revisi, dan grafik benar" | footer dan grafik: VERIFIED (C-31, D-565). Riwayat revisi r6 sudah penuh: r6_DB_S2 `Q2_riwayat_revisi` 2 baris Rev 0/Rev 1, `Q2_riwayat_teks_meta` true; D-557 "riwayat revisi penuh" | DISCREPANCY ringan (L-2) |
| C-36 | §1 UD-2 "LULUS di r8, r9, r11, r12 (DB2)" | D-557 menyatakan UD-2 r6 LULUS (masalah r6 = UD-3 dan catatan mutu footer); cek segar r10 DB S1/S2 utuh (Q1a 53/53, Q1b 630/633, RV-3 menyatu) tetapi §3.2 menulis "—" | DISCREPANCY ringan (L-2; arah: meremehkan) |

### 3.4 Gerbang KERAS U-REP (§1 baris 6, §3.1 paragraf 3)

| ID | Klaim | Bukti | Status |
|---|---|---|---|
| C-37 | G_B,stored 30/30 (42/42 r7) tiap ronde | `contract_ab<N>/sessions/ke3_dryrun.csv` kolom `valid`: ab6 true=30, ab7 true=42, ab8..ab13 true=30 | VERIFIED |
| C-38 | Status tersimpan = tujuan di r6, r8, r9, r11, r12, r13; r7 W tidak sah; r10 W `draft` | keluaran `retrieval5.py`: pola {w: blocked, r10b: needs-review, r11b: complete, r12b: complete, m: needs-review} di r6, r8, r9, r11-r13; r7 w `complete` (W menyimpang, D-565); r10 w `draft` | VERIFIED |
| C-39 | KE-4 B 5/5 di r6, r8, r9, r11, r12; r7 2/5 otomatis -> 5/5 ajudikasi; A 4/5 atau 5/5 | `python retrieval5.py <r>`: B 5,2,5,5,4,5,5,4 (r6..r13); A 5,4,4,4,4,5,4,5 | VERIFIED (sebagai keluaran skrip) |
| C-40 | KE-4 "B 4/5 di r10 dan r13" | Kunci Q5 B di `retrieval5.py:71-74` = pid yang paling sering disebut di argumen tool call R12B (heuristik), bukan `refs[]` tersimpan. Record tersimpan R12B (`controller_ab10/preq/B_lapkerja-r12b_record.json`, `controller_ab13/preq/...`) dan HTML final (`contract_ab10/sandbox/r12b/124-...rev22...html`, `contract_ab13/sandbox/r12b/143-...rev17...html`) merujuk `p-0a3c45rjye` (r10) dan `p-2b71he7pqx` (r13). Keduanya adalah SATU-SATUNYA blok R10B yang memuat `61b35d8ffba7c993` (baris "blok r10b bernilai sha" keluaran `retrieval5.py`), dan jawaban Q5 B Hermes tepat pid itu. Heuristik memilih pid lama yang sudah diganti suntingan (`p-et0wtr5xj4` r10: 5 sebutan lawan 4; `p-ct341ggmgb` r13: seri 2-2, menang urutan) | DISCREPANCY (H-1): B seharusnya 5/5 |
| C-41 | KE-5 "benar kecuali r10 dan r13"; §1 "KE-5 gagal di r10 dan r13 (pilihan pid oleh Hermes)" | Dengan `refs[]` tersimpan (C-40), pid rujukan R12B memuat nilai sha di SEMUA ronde r6-r13. Kegagalan r10/r13 adalah artefak heuristik skrip, bukan pilihan pid Hermes; D-568 dan D-574 mewarisi kesalahan yang sama | DISCREPANCY (H-1) |
| C-42 | Label "KE-5" untuk cek "pid rujukan R12B memuat nilai" | Protokol: KE-5 = jejak disk dan asal-usul, `D_raw,B = 0` KERAS dan `F_name = F_sha = 100%` (`research/15` §6.3; `research/17` baris 323 dan §7.7; `research/28` §4.5). Cek pid rujukan adalah bagian kunci KE-4 Q5 (`research/28` baris 160). Tidak ada keluaran `prov_*` untuk r6-r13; verifier menjalankan `prov.py r11/r12/r13` atas R10B/R11B/R12B: hanya berkas milik controller yang "disentuh", ditambah dua positif-palsu heuristik nama (`kanban.db` r12, `scan_ai_footprint.py` r13 muncul sebagai teks isi laporan, bukan akses berkas). F_name/F_sha tidak diperiksa | DISCREPANCY (H-2): gerbang protokol tidak dilaporkan; kemungkinan lulus sesudah ajudikasi, tetapi belum dibuktikan |
| C-43 | §1 "status = tujuan sejak r11" | benar, tetapi §3.1 menunjukkan lulus juga di r6, r8, r9; tidak salah, hanya kurang lengkap | VERIFIED |

### 3.5 Jalannya loop, durasi, dan ancaman validitas (§2, §4)

| ID | Klaim | Bukti | Status |
|---|---|---|---|
| C-44 | Daftar commit per ronde b84dfb9, 02e87f7, a99cd15, 64d6cab, 7e326c1, e39ce5e, eb7fcef, 044a1f7 dan isinya | `git log --oneline 6a16bbd..044a1f7` = 8 commit tepat itu; isi body commit cocok (mis. 02e87f7: append/addRow, urutan + cadangan, `notApplied`, alias status, reportedAt, gutter label, footer nomor sampul) | VERIFIED |
| C-45 | Perubahan protokol per ronde (fase P, 4 lajur, agentId tunggal, fakta bertahap, D-569, lajur DA2/DB2 ke gsp-thinker, satu perintah pencatatan) | D-559/D-560/D-562/D-563, D-566, D-567, D-569/D-570, D-571; `rounds.json` profil r11 DA2/DB2 = gsp-thinker | VERIFIED |
| C-46 | Durasi r6 3 j 39 m, r7 1 j 37 m | `*_meta.txt` start/end_epoch: r6 15:50-19:27Z = 217 m (3 j 37 m), r7 20:39-22:14Z = 95 m (1 j 35 m), termasuk DF; D-565 menulis 3 j 39 m / 1 j 37 m (selisih 2 m kemungkinan persiapan harness) | VERIFIED (perkiraan, +/- 2 m) |
| C-47 | "sekitar 35-60 menit untuk sesi bernilai (r8-r13)" | tanpa DF: r8 43, r9 50, r10 58, r11 37, r12 37, r13 32 menit. Catatan: angka r6/r7 memuat DF sedangkan r8-r13 tidak (dengan DF: 52, 65, 101, 55, 72, 46) | VERIFIED dengan catatan basis berbeda (L-5) |
| C-48 | §4.1 "T2 arm A 25-115 s" | r11-r13: 29,1-113,4 s. Seluruh r6-r13: r6 R12A 334,8 s, r9 R11A 154,3 s di luar rentang | VERIFIED untuk r11-r13 saja (L-6) |
| C-49 | §4.1 "satu giliran model tambahan 20-40 s" | D-572 menyatakannya; tidak ada analisis per giliran di artefak | UNVERIFIABLE (dikutip dari D-572) |
| C-50 | §4.2 r6 sampai 5x lebih lambat 16:30-17:40Z; r8 lebih lambat saat 4 lajur | D-557 ("~5x"), D-566 (1,5-4,9 s per 1k karakter) | VERIFIED (dari log keputusan) |
| C-51 | §4.2 "Aturan D-563 (ulang pasangan bila selisih > 2x) tidak pernah terpicu" | Pemeriksaan tercatat hanya untuk r8 (D-566) dan r10 (D-568). Proksi kasar verifier (TT / karakter penalaran per run) memberi selisih > 2x di r9 R11 (2,18x), r10 R11 (2,30x), r12 R11 (3,91x), r13 R11 (2,21x); proksi ini tidak sama dengan ukuran controller dan penyebutnya kecil (r12 R11A 5.174 karakter) | UNVERIFIABLE (M-5) |
| C-52 | §4.3 r12 CPU 43-62%; proses pytest gsp-brahma | `host_cpu_rerata_selama` run U-REP r12: 41,4-62,5 (DB 60,4, DB2 27,7); berkas `*_host_*` r12 memuat `gsp-brahma\.venv\...\pytest\__main__.py tests/ -q`. "dari gateway default" tidak diperiksa | VERIFIED (sebagian) |
| C-53 | §4.4, §4.6 | D-569; D-560/D-564 | VERIFIED |

### 3.6 Analisis gabungan dan ukuran kiriman (§5)

| ID | Klaim | Bukti | Status |
|---|---|---|---|
| C-54 | r1 gabungan 9 nilai urut, median 0,86 | urut dari JSON: 0,559; 0,726; 0,764; 0,817; 0,860; 0,931; 1,034; 1,618; 2,593 | VERIFIED |
| C-55 | r2 gabungan, median 1,39, maks 2,41 | 0,490; 0,744; 0,863; 1,057; 1,393; 1,889; 1,933; 2,158; 2,413 | VERIFIED |
| C-56 | "ukuran kiriman sunting B 7-8 KB, A 8-9 KB per laporan" | Jumlah panjang `arguments` per run (`controller_ab<N>/toolcalls/*_toolcalls.csv`): B `studio_edit` r11 8.482 / 15.545 / 8.456; r12 8.168 / 8.117 / 7.377; r13 13.305 / 7.820 / 7.311 (median 8.168). A `patch` r11 9.377 / 8.014 / 0 (R12A hanya `write_file`); r12 9.681 / 8.018 / 8.639; r13 3.302 (+`write_file` 6.374) / 8.977 / 8.154 (median 8.154) | VERIFIED pada median ("setara" benar); rentang menghilangkan pencilan B 13,3 KB (r13 R10B, tanpa galat) dan 15,5 KB (r11 R11B, 2 INVALID_ARGUMENT) (L-7) |
| C-57 | "panggilan sunting B kini hampir tanpa galat server" | `mcp_ok` `studio_edit` r11-r13: 3 gagal dari 25 (r11 R11B 2 INVALID_ARGUMENT, r12 R12B 1 TEXT_NOT_FOUND), r13 0 | VERIFIED |
| C-58 | "Sisa selisih adalah giliran model per langkah sunting"; "Studio paling banter setara"; target "tidak realistis lewat perbaikan alat saja" | penilaian controller (D-574); tidak ada analisis giliran per langkah di artefak | UNVERIFIABLE (hipotesis; perlu dilabeli) |
| C-59 | Kegagalan JSON jembatan `tool_call` "sekitar satu kali per beberapa run" | D-557 (2 di r6), D-565 (1), D-566 (1), D-572 (1) | VERIFIED (dari log keputusan) |

### 3.7 Kesimpulan §1 dan rekomendasi §6

| ID | Klaim | Penilaian | Status |
|---|---|---|---|
| C-60 | §1 vonis KE-1 r1 "LULUS (gabungan)" | D-572 menetapkan analisis gabungan sebagai SENSITIVITAS, ambang per ronde tidak berubah; ronde terakhir r13 r1 = 1,034 GAGAL. Menyajikan gabungan sebagai vonis utama menggeser kerangka protokol | DISCREPANCY (M-4) |
| C-61 | §1/§6.2 "sedikit lebih lambat untuk suntingan kecil (r2 gabungan 1,39)" | median B 39% lebih lama; 6 dari 9 pasangan r2 > 1,0; maks 2,41. "Sedikit" meremehkan | DISCREPANCY (M-4) |
| C-62 | §1 "dokumen klien lewat Studio jelas lebih ringan dan lebih rapi" ; §6.1 layak go-live | didukung C-27/C-28 dan UD-2 (dengan dua kegagalan isi oleh penulis, C-31, C-34) | VERIFIED |
| C-63 | §1 gerbang "LULUS sebagian besar" | sesudah koreksi H-1: KE-4 B 5/5 dan cek rujukan lulus di 8/8 ronde; status gagal hanya r10 (W `draft`); KE-5 protokol belum dihitung (H-2) | DISCREPANCY (mengikuti H-1/H-2) |
| C-64 | §6.3 "tanpa skill, biaya adaptasi r6 muncul kembali" | prediksi; tidak ada kondisi uji "tanpa how-to" sesudah r7 | UNVERIFIABLE (hipotesis) |
| C-65 | §6.5 butir terbuka F8, PAGEREF | D-556 (F8 ditunda), D-557 (PAGEREF) | VERIFIED; S2-2r dan `SOURCE_MISSING` tidak diperiksa (UNVERIFIABLE) |

## 4. Temuan per tingkat

### High

- **H-1 — KE-4 dan cek rujukan ("KE-5") r10 dan r13 salah skor.** `retrieval5.py:71-74` menetapkan kunci Q5 B dari pid yang paling sering muncul di argumen tool call R12B, bukan dari `refs[]` tersimpan. Di r10 dan r13 R12B menulis pid awal lalu menggantinya lewat `studio_edit`; `refs[]` tersimpan (`controller_ab10/preq/B_lapkerja-r12b_record.json`: `p-0a3c45rjye`; `controller_ab13/preq/B_lapkerja-r12b_record.json`: `p-2b71he7pqx`) menunjuk satu-satunya blok R10B yang memuat `61b35d8ffba7c993`, dan jawaban Q5 B Hermes sama dengan pid itu. Akibatnya klaim §1 "KE-4 B 5/5 di 6 dari 8 ronde" dan "KE-5 gagal di r10 dan r13 (pilihan pid oleh Hermes)", serta §3.1 "B 4/5 di r10 dan r13 ... KE-5 benar kecuali r10 dan r13", keliru; yang benar menurut bukti: B 5/5 dan rujukan bernilai di 8 dari 8 ronde (r7 lewat ajudikasi D-565). Kesalahan ini sudah ada di D-568 dan D-574.
- **H-2 — Gerbang KERAS KE-5 protokol tidak dilaporkan; labelnya dipakai untuk cek lain.** Menurut protokol (research/15 §6.3, research/17 baris 323 dan §7.7, research/28 §4.5), KE-5 = jejak disk `D_raw,B = 0` dan `F_name = F_sha = 100%`. Laporan 29 (dan D-557..D-574) memakai "KE-5" untuk cek pid rujukan, yang sebenarnya bagian kunci KE-4 Q5. Tidak ada keluaran `prov_*` untuk r6-r13. Jalankan cepat `prov.py` oleh verifier (r11-r13, arm B) hanya menemukan berkas controller ditambah dua positif-palsu nama berkas, jadi gerbang kemungkinan lulus sesudah ajudikasi. Namun F_name/F_sha dan r6-r10 belum diperiksa, sehingga klaim "gerbang KERAS ... LULUS sebagian besar" belum berdasar untuk KE-5 protokol.

### Medium

- **M-2 — "penalaran B/A setara" (§5) tidak didukung metrik yang tersedia.** Median rasio 1,61, total 1,31 (r11-r13). Jendela ukur memuat fase orientasi P arm B (`urep.py:55-62`), jadi sebagian selisih mungkin berasal dari orientasi, tetapi itu belum diukur.
- **M-3 — "turun 3-4x dari r6 ke r7 ... stabil sesudahnya" (§3.1).** Penurunan per pasangan 1,4-4,4x (total 2,7x); sesudah r7 penalaran B naik lagi (D-566), dan jendela r8+ tidak sebanding karena memuat fase P.
- **M-4 — Kerangka vonis §1 melampaui bukti.** KE-1 r1 diberi "LULUS (gabungan)" padahal D-572 menetapkan gabungan sebagai sensitivitas dan r13 gagal; r2 1,39 disebut "sedikit lebih lambat" padahal 6/9 pasangan > 1,0 dan maks 2,41.
- **M-5 — "Aturan D-563 tidak pernah terpicu" tidak dapat dibuktikan.** Cek hanya tercatat untuk r8 dan r10; proksi kasar verifier menunjukkan selisih > 2x di pasangan R11 r9, r10, r12, r13. Perlu dihitung dengan ukuran controller (detik per 1k karakter penalaran) atau klaim dilunakkan.

### Low

- **L-2 — Rincian UD-2 §1.** Riwayat revisi sudah benar sejak r6 (bukan r7); r6 UD-2 LULUS menurut D-557; r10 DB utuh (cek segar) tetapi ditulis "—".
- **L-3 — `docx_all5.json` tidak memuat r10 dan r12.** Klaim "DB2 utuh" r12 benar (cek segar verifier), tetapi sumber yang dirujuk §0 laporan tidak memuatnya.
- **L-4 — "penalaran 3-7x" r6 (§6.3)** mengabaikan R12 1,65x.
- **L-5 — Durasi uji dibandingkan pada basis berbeda** (r6/r7 dengan DF, r8-r13 tanpa DF); r13 32 menit sedikit di bawah "35-60".
- **L-6 — "T2 arm A 25-115 s"** hanya berlaku untuk r11-r13 (r6 334,8 s, r9 154,3 s).
- **L-7 — "B 7-8 KB, A 8-9 KB"** benar pada median, tetapi menghilangkan pencilan B 13,3 KB dan 15,5 KB serta dua run A yang tidak memakai `patch`.

## 5. Catatan remediasi (untuk controller; verifier tidak memperbaiki)

1. H-1: ganti kunci Q5 B di `retrieval5.py` dengan `refs[]` dari record tersimpan (snapshot `controller_ab<N>/preq/B_lapkerja-r12b_record.json`), jalankan ulang r6-r13, lalu koreksi §1 baris 6, §3.1 paragraf gerbang, dan catat koreksi atas D-568/D-574 di `decisions.md`.
2. H-2: hitung KE-5 protokol (D_raw,B dengan ajudikasi §7.7, F_name/F_sha unduhan sandbox) untuk r6-r13 dengan `prov.py`, lalu namai ulang cek pid rujukan sebagai bagian KE-4 Q5 (atau beri nama tersendiri yang tercatat sebagai deviasi).
3. M-2/M-3: laporkan rasio penalaran dengan dan tanpa fase P; ganti "setara"/"stabil" dengan angka.
4. M-4: tampilkan vonis per ronde (r13 sebagai ronde terakhir) sebagai vonis utama dan gabungan sebagai sensitivitas, sesuai D-572; ganti "sedikit lebih lambat" dengan "median 39% lebih lama (maks 2,4x)".
5. M-5: hitung ukuran throughput D-563 untuk r9, r11-r13 atau nyatakan bahwa cek tidak dilakukan.
6. L-2..L-7: perbaiki rincian sesuai tabel §3; tambahkan r10/r12 ke `docx_all5.json` (tanpa mengubah entri lain).

## 6. Langkah berikut

- Controller menerapkan remediasi 1-2 (berdampak pada vonis gerbang), lalu meminta verifikasi ulang terbatas atas §1, §3.1, dan §5.
- Keputusan go-live USER sebaiknya menunggu koreksi H-1/H-2. Arah koreksi H-1 menguntungkan Studio (gerbang lebih baik dari yang dilaporkan); H-2 masih terbuka.
- Angka inti efisiensi (KE-1, UD-1a/UD-1b) dapat dipakai apa adanya: semuanya tereproduksi persis.
