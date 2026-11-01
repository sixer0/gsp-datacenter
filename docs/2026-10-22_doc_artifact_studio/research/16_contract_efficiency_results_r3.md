---
schema_version: 1.0
task_id: doc_artifact_studio
task_row: DC-46c (analisis uji ketiga; protokol research/15_contract_efficiency_protocol_r3.md termasuk §20 R3-04 dan §21 R3-H; keputusan D-435..D-457, terutama D-422, D-442, D-447, D-456)
date: 2026-11-01
agent: data-analyst
type: performance
confidence: MEDIUM (waktu, langkah, retrieval, token, beban host, dan bukti asal-usul dihitung langsung dari timing.csv, toolcalls CSV, retrieval.csv, meta, usage, postcheck, dan host_*.txt; n = 3 pasangan, deskriptif; tanpa shell sehingga SQL MU-1, R20 per revisi S1/S2, pencocok token KF penuh, checker G_A mekanis, dan hitung byte argumen tulis belum dijalankan, perintah persis ada di §12 untuk DC-47c)
inputs: research/15 (utuh, §1-§21); research/14 (utuh); research/11 §4.3, §4.6-§4.8 (:96-180); decisions.md D-444..D-457 (:449-462); hermes_trial/06_contract_trial3_report.md (utuh); 06_contract_trial3_brief.md (:1-42, Grep); 06_contract_trial3_facts_manifest.md (Grep §1.1, §5; :228-236); masterplan/05 §19.3 (:1326-1330); delegation_progress/coder_execution_r3_01.md:52; data BACA SAJA Temp/hermes_trial/contract_ab3/ (timing.csv L1-L314, retrieval.csv, docs_b.csv, ke3_dryrun.csv, grep_*.txt, *_meta.txt, usage_*.json, *_stdout.txt R7B/R8B/R9B, R7B_postcheck.json, Grep semua *_postcheck.json dan *_host_*.txt) dan controller_ab3/ (toolcalls W, R7B, R7A, R8A, R8B, R9B, R9A utuh; Q dan M lewat Grep; answers/Q_key_resolved.md; dc45c/m_revisions.txt; dc45c/driver_*.log Grep; host_whitelist.txt Grep)
tools: Read, Glob, Grep. Tanpa shell; semua aritmetika manual. Baris timing.csv dirujuk sebagai L<n> (header = L1). Baris toolcalls dirujuk sebagai `<run>_tc:<n>` (header = baris 1). Epoch ditulis dipotong: nilai epoch = 1793490000 + angka yang ditulis (contoh 8649,206 = 1793498649,206)
plan_draft: dilewati. Baris ini docs only; usulan diserahkan sebagai baris baru berpemilik (§9)
status: complete
---

# DC-46c: Hasil metrik efisiensi uji ketiga (arm A MD lawan arm B MD-native lewat studio-report)

## 0. Ringkasan vonis

| Metrik | Nilai utama | Ambang | Vonis |
|---|---|---|---|
| KE-1 (a) komposisi pertama | r1 = T1_B/T1_A: R-7 0,900; R-8 1,476; R-9 2,167; median **1,476** | median r1 <= 1,00 (D-422) | **GAGAL** |
| KE-1 (b) pembaruan | r2 = T2_B/T2_A: R-7 0,922; R-8 0,807; R-9 1,615; median **0,922**, maks **1,615** | median <= 0,70 DAN tak ada pasangan > 1,00 | **GAGAL** (kedua syarat) |
| KE-1 utuh | (a) GAGAL, (b) GAGAL; sensitivitas 1-4 dan 5 semuanya GAGAL (§4.1.4); 5b TIDAK-DAPAT-DIHITUNG | (a) DAN (b) | **GAGAL** |
| KE-2 langkah (advisori, sumber log sesi) | N_agent B/A: 21/18 = 1,167; 17/16 = 1,063; 45/18 = 2,500; median **1,167** | median <= 1,00 | **GAGAL** (advisori) |
| KE-3 galat format | G_B,stored 0 (30/30 valid); Σ G_B,4xx 0, maks 0; G_B,klien 0; G_B,draft 0; Σ G_A 0 | stored 0 KERAS; Σ 4xx <= 3, maks <= 2; Σ G_B < Σ G_A (bila Σ G_A = 0: catat, tidak menggagalkan, `11:104`) | **LULUS** ("tidak ada keunggulan format teramati"); sensitivitas Σ(4xx + klien) = 0 sama |
| KE-4 retrieval | Skor B 5/5, A 5/5; median L_q B 2 = A 2 (log sesi); B 1 = A 1 (CSV) | B 5/5 KERAS DAN median L_q(B) <= median L_q(A) | **LULUS** |
| KE-5 jejak disk | D_raw,B (D-442) = 0 / 0 / 0 sesudah ajudikasi; postcheck mentah R7B 8 = positif palsu profil Chromium server (DIKONFIRMASI, §4.5.2); F_name 3/3; F_sha 3/3 | D_raw,B = 0 KERAS; F_name = F_sha = 100% | **LULUS** dengan satu temuan terbuka: berkas respons R20 sesaat di `/tmp` oleh R9B (§4.5.4) |
| KE-6 beban pikir format | FD_B 1/1/2; FL utama B 0/0/0 (median 0), A 0/0/1 (median 0) | FD_B <= 2 tiap laporan DAN median FL_B <= median FL_A | **LULUS** (utama). Sensitivitas FL + FL_tpl: B 1/2/1 median 1 > 0 = **GAGAL**; vonis berbeda, disajikan ke USER (§6.4 protokol) |
| KE-7 kelengkapan | K_B 100% 3/3; KF sampel token F-upd1/F-upd2 100% di keenam laporan | K_B 100% KERAS; KF_B = 100%; KF_B >= KF_A | **LULUS sementara** (K_B pasti; KF penuh menunggu DC-47c, §4.7) |
| MU-1 | SQL §19.3 tidak dijalankan analis; proksi R05 `?rev=n`: M 2 aktor (rev7-10 `agent:hermes-gsp-verifier01`), W/R7B/R8B/R9B 1 aktor | deskriptif | **TIDAK-DAPAT-DIHITUNG persis** (perintah §12) |
| MU-2 | porsi aktor = 1: 4/5; median revisi 16 (16/17/18/14/16); laporan MD baru A 3, B 0 + 5 draf MD-native sah | deskriptif | Proksi |

Gerbang keras D-362: (1) 0 menyimpang skema **LULUS** (`ke3_dryrun.csv` 30/30 valid, kolom kode kosong); (2) retrieval 5/5 **LULUS**; (3) 0 berkas mentah **LULUS** (D_raw,B = 0 sesudah positif palsu profil Chromium dikonfirmasi, §4.5); (4) K_B 100% **LULUS**.

Vonis gabungan (`11:178-180`): **NETRAL (keputusan USER)**. Semua gerbang keras lulus, KE-6 lulus pada definisi utama, tetapi KE-1 gagal. Ini siklus 3 dari 3 untuk KE-1 (batas loop tercapai; D-448 menyerahkan pilihan jalan ke controller dengan keterbatasan dicatat).

Jawaban hipotesis R3-01 (MD-native menurunkan biaya komposisi): **TERBUKTI untuk komposisi, tidak cukup untuk KE-1.** Token keluaran B/A turun dari median 3,892 (uji 2) ke 1,206; waktu susun isi B/A kini median 0,938 (0,938 / 0,655 / 1,261); ukuran laporan final B/A 0,783 / 0,847 / 0,919 (uji 2: draf JSON 1,6-2,2 kali MD). Sisa selisih KE-1 berasal dari biaya tetap per langkah arm B (template, check, submit/update lewat `npx tsx`, salin basis) dan, pada R-9, 78,7 s penelusuran kode sumber dan rute API sebelum menulis (§4.1.5, §4.1.6).

## 1. Source Tasks

| Sumber | Isi yang dipakai |
|---|---|
| Protokol r3 (research/15) §4, §6.1-§6.5, §7, §9, §10, §14, §20, §21 | Ambang tetap (D-422 dan protokol 11); sumber utama KE-2/KE-6 = tool call state.db (E-02, E-03); FL_tpl terpisah (§6.4); isolasi informatif dan caveat beban + sensitivitas 5 `beban_tinggi` (§21.2-§21.3); KE-5 kelas D-442 touched_by_run (§21.4); HS-8 `studio-report check` (§21.5); alur arm B (§21.6); G_B,klien terpisah (§21.7); butir wajib W-1..W-17 (§21.8) |
| Protokol 11 §4 (`11:96-180`) | Rumus KE-3 (`:102-104`, termasuk klausul Σ G_A = 0), KE-6 FD/FL (`:143-159`), KE-7 (`:165-170`), vonis gabungan (`:178-180`) |
| D-442 (`decisions.md:447`) | Isolasi informatif; KE-5 hanya berkas terbukti disentuh run lewat state.db; caveat beban wajib |
| D-447, D-451 (`:452`, `:456`) | G_B,klien di luar G_B,4xx; postcheck `kelas_d442` per berkas |
| D-455 (`:460`) | Server beku pada 97f5e80; freeze 10 berkas |
| D-456 (`:461`) | Hasil mentah DC-45c, sha kunci Q 78509b8f...941c; keputusan controller: postcheck W/R7B exit 1 = positif palsu profil Chromium server, analis WAJIB mengonfirmasi dengan bukti induk proses/waktu; umpan balik sisi menulis diambil dari `_stdout` + `format_*.txt` |
| Laporan uji `06_contract_trial3_report.md:1-8` | Kronologi, beban host, path data, dokumen B, ringkasan umpan balik Q dan vonis Hermes (bagian G), penyimpangan (a)-(i) |
| Manifest 06 §1.1, §5 | Peta bab pembaruan sebagian; tabel token KE-7 (R-7 penyebut bertoken 41) |
| research/14 §4.1.5-§4.1.6, §7 | Pembanding uji 2 dan uji 1 (tabel `14:349-363`) |
| `coder_execution_r3_01.md:52` | Hipotesis biaya tulis R3-01: MD 2.257 B lawan JSON setara 10.043 B (pretty, x4,45) / 5.021 B (compact); proses `submit` sekitar 2,6 s dinding |

## 2. Exploration & Collection Summary (Tier 2)

| Fakta | Bukti | Mengapa penting | Cara verifikasi |
|---|---|---|---|
| timing.csv 313 baris data: W L2-L47, R7B L48-L91, R7A L92-L100, R8A L101-L107, R8B L108-L151, R9B L152-L210, R9A L211-L221, M L222-L263, Q L264-L314 | Read timing.csv | Cocok dengan laporan 06 `:3` (W 46, R7B 44, R7A 9, R8A 7, R8B 44, R9B 59, R9A 11, M 42, Q 51) | csvcheck controller (D-456) |
| Toolcalls 9/9 tersedia, `token_count` kosong di semua baris | `R7B_tc:1-26` dan seterusnya; meta `toolcalls_n_call` W 24, R7B 24, R7A 21, R8A 16, R8B 20, R9B 48, R9A 20, M 24, Q 60 | KE-2/KE-6 dari sumber utama (M-1 tertutup); token per segmen TIDAK-TERSEDIA (AS3-3) | Hitung baris CSV |
| Arm B kini mencatat `trial-log step edit` sebelum check/submit/update | L51, L63, L75 (R7B); L111, L123, L136 (R8B); L164, L176, L185 (R9B) | U-22a tertutup; silang CSV lebih lengkap dari uji 2 | Read timing.csv |
| R8B menulis ulang laporan penuh di S2 dan S3 (`write_file` tiga kali), bertentangan dengan brief §2 | `R8B_tc:8`, `:11`, `:13`; brief 06 `:17` | Laporan 06 `:5` ("menyunting di tempat tanpa menulis ulang penuh") tidak berlaku untuk R8B; delta U-16 tidak teruji di R8B | Read toolcalls |
| R9B menulis respons R20 dokumen R7B ke `/tmp/r20_r7b.json`, lalu menghapusnya 5,9 s kemudian | `R9B_tc:10` (8489,973), `R9B_tc:11` (8495,858; `rm -f /tmp/r20_r7b.json`) | Melanggar brief §4 (`06_brief:30`); tidak terlihat snapshot (§4.5.4) | Read toolcalls |
| R9B membaca kode sumber repo 14 kali (rute, enum status, ReportedAt, Rujukan, verdict, lastFilledBy) | `R9B_tc:3-7`, `:13`, `:14`, `:16-18`, `:37`, `:39`, `:44`, `:46` | Penyebab utama r1 R-9 2,167; tidak tertangkap pola FL dasar | Read toolcalls |
| Brief §1 menetapkan bentuk kepala, bab, dan tabel untuk laporan uji, dan arm A ikut memakainya | `06_brief:7-8`; `format_R7A.txt` (`R7A_tc:22`: "meniru bentuk yang diminta untuk arm B ... karena brief §1"); `format_R9A.txt` (`R9A_tc:21`) | Baseline arm A bukan lagi "MD bebas" murni: G_A = 0 dan FD_A turun. Ini membatasi daya beda KE-3 dan KE-6 | Read brief + toolcalls |
| Profil Chromium `playwright_chromiumdev_profile-RaNCWy` dibuat oleh `chrome.exe` pid 29980, ppid 23232 (`next start-server` DEV :9021), pukul 02:01:28,989Z | `W_host_post.txt:15`, `R9B_host_pre.txt:15`; `host_whitelist.txt:6` | Dasar konfirmasi D-456 (§4.5.2) | Grep host_*.txt |
| Semua run `host_bersih=tidak`; tidak ada `beban_tinggi` (CPU rerata 8,7-15,6%, disk rerata <= 18,2%) | meta tiap run (Grep) | Sensitivitas 5 = analisis utama; 5b TIDAK-DAPAT-DIHITUNG | Grep meta |
| Freeze bawaan OK di 9/9; Q dengan freeze baru bdd4be0c... | meta `freeze_check=OK`; laporan 06 `:4` | Cacat runner r2 tertutup (gerbang §10 butir 7) | Grep meta |

## 3. Overview (Tier 1, 5W1H)

- **Apa**: menilai apakah jalur laporan MD-native lewat `studio-report` (arm B: template, check, submit, update delta berbasis) setidaknya setara MD bebas (arm A) dalam biaya menulis, sambil mempertahankan keandalan (gerbang keras).
- **Siapa**: USER (keputusan adopsi; batas loop KE-1 siklus 3 dari 3), controller (mandat otonom D-448; menyajikan NETRAL), Hermes `gsp-master01` (pelaku, sesi baru per run), DC-47c (verifikasi angka ini dan cek sisa), MCP-01 dan UI-01 (pemakai temuan friksi), pemilik CLI/panduan (usulan §9).
- **Kapan dan di mana**: 9 sesi DC-45c, 2026-11-01 02:00:13Z sampai 02:39:16Z (Q), server DEV :9021 beku pada 97f5e80 (D-455, D-456). Lembar R-7 (LIB2, 47 fakta), R-8 (verifikasi deck, 48), R-9 (countersign, 43); urutan R7B, R7A, R8A, R8B, R9B, R9A (protokol §9.2).
- **Lingkup**: KE-1 (a)(b) + sensitivitas, KE-2..KE-7, MU-1/MU-2, FL_tpl, G_B,klien, gerbang keras, vonis per ambang dan gabungan, pecahan waktu B per fase, perbandingan tiga uji, umpan balik sisi menulis, friksi dan usulan.
- **Mengapa (rantai bukti)**: uji 2 gagal KE-1 karena komposisi JSON oleh LLM (token B/A 3,892; 69,5% jendela B untuk menyusun; `14:37`, `14:171`). D-435 memesan MD-native, delta, dan template untuk menyasar biaya itu. Uji ini mengukur apakah sasaran tercapai.
- **Bagaimana (metodologi)**: (1) rumus protokol diterapkan apa adanya pada baris yang disebut; (2) N_agent dan FL dihitung dari tool call state.db dalam [START harness, END] dengan aturan §6.2; (3) pecahan waktu memakai aturan atribusi uji 1/uji 2 (selang dibebankan ke aksi yang mengakhirinya), kini atas `ts_call`/`ts_result` log sesi; (4) KE-5 memakai kelas D-442 dari postcheck, lalu ajudikasi positif palsu dengan bukti proses dan waktu; (5) setiap penyimpangan dihitung "seperti tercatat" lalu diuji sensitivitas berlabel, tanpa imputasi dan tanpa membuang pasangan.
- **Alternatif yang ditolak**: (a) memakai swalapor Hermes "tidak pernah tulis ulang penuh" untuk semua run B (dibantah log R8B); (b) membuang R-9 karena eksplorasi kode sumber (dilarang; dilaporkan sebagai kontrafaktual); (c) menghitung profil Chromium sebagai D_raw (gagal kriteria mentah dan bukti sentuh hanya token generik); (d) mengabaikan berkas `/tmp` R9B karena tidak ada di snapshot (disajikan sebagai sensitivitas).
- **Asumsi dan celah**: §11.

## 4. Requirements dan hasil per metrik

Persyaratan: R-1 KE-1..KE-7 dihitung dan diberi vonis per ambang; R-2 gerbang keras; R-3 penyimpangan diperlakukan jujur; R-4 pecahan waktu B per fase + perbandingan tiga uji; R-5 umpan balik sisi menulis + vonis Hermes + friksi ke usulan; R-6 vonis gabungan; R-7 konfirmasi D-456 dengan bukti.

### 4.1 KE-1 Waktu (D-422)

#### 4.1.1 Batas dan segmen

Akhir S1/S3 arm B = `t_end` baris `api` 2xx POST kiriman terakhir pemanggilan S1/S3 (protokol §6.1; `note` `blok 6 bab 5`). Arm A = `t_end` baris `trial-log step edit` S1/S3 terakhir.

| Run | START harness | START Hermes | Akhir S1 | Akhir S3 | END | T1 (s) | T2 (s) | T (s) |
|---|---|---|---|---|---|---|---|---|
| R7B | L48 8649,206 | L49 8660,158 | L57 8691,115 | L82 8753,250 | L91 8771,070 | 41,909 | 62,135 | 121,864 |
| R7A | L92 8849,828 | L93 8874,590 | L95 8896,408 | L99 8963,829 | L100 8965,753 | 46,580 | 67,421 | 115,925 |
| R8A | L101 9043,340 | L102 9056,923 | L104 9083,260 | L106 9148,866 | L107 9153,395 | 39,920 | 65,606 | 110,055 |
| R8B | L108 9224,662 | L109 9245,796 | L117 9283,599 | L143 9336,524 | L151 9363,039 | 58,937 | 52,925 | 138,377 |
| R9B | L152 9448,385 | L153 9459,535 | L170 9566,021 | L192 9663,472 | L209 9745,253 | 117,636 | 97,451 | 296,868 |
| R9A | L211 9835,428 | L212 9862,464 | L218 9889,713 | L220 9950,044 | L221 9953,363 | 54,285 | 60,331 | 117,935 |

Cek jumlah: T + (end_epoch meta - END) = wall_s untuk keenam run (R7B 121,864 + 7,885 = 129,749; R7A 115,925 + 8,940 = 124,865; R8A 110,055 + 2,610 = 112,665 lawan 112,666; R8B 138,377 + 14,102 = 152,479; R9B 296,868 + 16,761 = 313,629; R9A 117,935 + 7,272 = 125,207). Tidak ada celah waktu.

Catatan R7A: ada dua baris edit S3 (L97 8948,959 dan L99 8963,829, sesudah `cmd` cek cakupan L98). Batas utama memakai yang terakhir; yang pertama diuji di §4.1.4.

#### 4.1.2 Rasio dan vonis

| Pasangan (urutan) | r1 = T1_B/T1_A | r2 = T2_B/T2_A |
|---|---|---|
| R-7 (B dulu) | 41,909/46,580 = **0,900** | 62,135/67,421 = **0,922** |
| R-8 (A dulu) | 58,937/39,920 = **1,476** | 52,925/65,606 = **0,807** |
| R-9 (B dulu) | 117,636/54,285 = **2,167** | 97,451/60,331 = **1,615** |
| Median / maks | **1,476** / 2,167 | **0,922** / **1,615** |

- (a) median r1 1,476 > 1,00: **GAGAL**.
- (b) median r2 0,922 > 0,70 dan maks 1,615 > 1,00: **GAGAL** pada kedua syarat.
- KE-1: **GAGAL**. Confidence HIGH (angka), MEDIUM (tafsir; n = 3).

Pasangan R-7 untuk pertama kalinya memenuhi r1 <= 1,00 dan r2 <= 1,00 (tetapi r2 > 0,70).

#### 4.1.3 Caveat beban host (wajib, §21.3)

| Run | CPU pre / selama / post (%) | Disk pre / selama / post (%) | Mem bebas pre / post (MB) | Maks proses luar izin | Maks berkas baru Temp | isolation_gagal pre / post | beban_tinggi | latensi_anomali | Token keluaran / wall_s |
|---|---|---|---|---|---|---|---|---|---|
| W | 6,6 / 14,0 / 9,2 | 0,2 / 7,0 / 0,0 | 87195 / 86888 | 19 | 131 | H-1,H-4,H-5,H-7 / H-1,H-4,H-5 | tidak | (tidak dinilai) | 94,4 |
| R7B | 7,8 / 12,2 / 5,8 | 0,0 / 6,8 / 0,0 | 86857 / 86818 | 19 | 32 | H-1,H-4,H-5 / sama | tidak | tidak | 120,3 |
| R7A | 11,0 / 10,2 / 7,2 | 1,6 / 0,0 / 0,0 | 86810 / 86825 | 16 | 4 | sama | tidak | tidak | 134,1 |
| R8A | 10,4 / 13,8 / 10,2 | 0,0 / 0,0 / 0,0 | 86851 / 86781 | 16 | 6 | sama | tidak | tidak | 147,6 |
| R8B | 12,2 / 14,2 / 7,6 | 0,0 / 0,2 / 1,6 | 86737 / 86345 | 19 | 8 | sama | tidak | tidak | 131,5 |
| R9B | 7,6 / 8,7 / 14,0 | 20,2 / 5,6 / 4,8 | 86381 / 87117 | 19 | 5 | sama | tidak | tidak | 136,3 |
| R9A | 12,4 / 15,6 / 17,4 | 0,0 / 18,2 / 0,0 | 86545 / 86498 | 19 | 4 | sama | tidak | tidak | 133,2 |
| M | 5,4 / 9,4 / 11,2 | 0,6 / 0,0 / 0,0 | 86514 / 86504 | 18 | 4 | sama | tidak | (MU) | 114,4 |
| Q | 10,0 / 11,6 / 12,6 | 0,0 / 0,4 / 0,0 | 86391 / 86458 | 19 | 3 | sama | tidak | (KE-4) | 133,3 |

Sumber: `<run>_meta.txt` (`host_cpu_pre`, `host_cpu_rerata_selama`, `host_post_cpu`, `host_disk_*`, `host_free_mb_pre`, `host_post_free_mb`, `host_maks_proc_luar_selama`, `host_maks_berkas_baru_temp_selama`, `isolation_gagal`, `host_post`, `wall_s`); token dari `usage_<run>.json`. Kunci maks berkas baru workspace selama run tidak ada di meta (dilaporkan sebagai celah). Throughput median enam run dinilai 132,3 token/s; ambang anomali 0,5 x = 66,2; tidak ada run di bawahnya.

Selisih beban dalam pasangan (B - A): CPU rerata R-7 +2,0, R-8 +0,4, R-9 -6,9 poin; proses luar izin R-7 +3, R-8 +3, R-9 0; disk rerata R-7 +6,8, R-8 +0,2, R-9 -12,6.

Paragraf caveat: waktu dinding KE-1 memuat derau beban host yang tidak dikendalikan (semua run `host_bersih=tidak`, D-442). Besarnya kecil dan tidak searah: B sedikit lebih terbebani pada R-7 dan R-8 (CPU +0,4 sampai +2,0 poin, +3 proses), lebih ringan pada R-9 (CPU -6,9, disk -12,6). Pasangan dengan rasio terburuk bagi B (R-9) justru pasangan dengan beban B lebih rendah, jadi beban tidak menjelaskan kegagalan. Vonis KE-1 dihitung atas semua pasangan dengan aturan D-422; sensitivitas 5 di samping. Derau yang lebih besar adalah jeda awal LLM (pra-START 10-27 s, §4.1.5), yang tidak terkait arm.

#### 4.1.4 Sensitivitas (tidak menentukan vonis)

| Definisi | R-7 | R-8 | R-9 | Median | Uji ambang |
|---|---|---|---|---|---|
| (1) T ujung-ke-ujung | 121,864/115,925 = 1,051 | 138,377/110,055 = 1,257 | 296,868/117,935 = 2,517 | 1,257 | GAGAL |
| (2) START Hermes-END | 110,912/91,163 = 1,217 | 117,243/96,472 = 1,215 | 285,718/90,899 = 3,143 | 1,217 | GAGAL |
| (3) Sesi penuh wall_s | 129,749/124,865 = 1,039 | 152,479/112,666 = 1,353 | 313,629/125,207 = 2,505 | 1,353 | GAGAL |
| (4a) akhir S1 B = `t_end` baris `tool` submit: r1 | 42,549/46,580 = 0,913 (L62) | 59,887/39,920 = 1,500 (L122) | 118,306/54,285 = 2,179 (L175) | 1,500 | (a) GAGAL |
| (4b) idem: r2 (akhir S3 = baris `tool` L88, L149, L198) | 62,110/67,421 = 0,921 | 52,613/65,606 = 0,802 | 97,377/60,331 = 1,614 | 0,921 | (b) GAGAL |
| (5) tanpa pasangan `beban_tinggi`/`latensi_anomali` | sama dengan utama (tidak ada pasangan bertanda) | | | r1 1,476; r2 0,922 / maks 1,615 | GAGAL |
| (5b) tanpa pasangan `host_bersih=tidak` | TIDAK-DAPAT-DIHITUNG: 9/9 run `host_bersih=tidak` (D-442) | | | | - |
| Tambahan: akhir S3 R7A = edit pertama L97 | r2 62,135/52,551 = 1,182 | 0,807 | 1,615 | 1,182 | (b) GAGAL |
| Tambahan: T1 dari START Hermes (tanpa pra-START) | 30,957/21,818 = 1,419 | 37,803/26,337 = 1,435 | 106,486/27,249 = 3,908 | 1,435 | (a) GAGAL |

Kontrafaktual analis (bukan definisi protokol): bila penelusuran sebelum menulis dibuang dari T1 kedua arm R-9 (B 80,270 s, `R9B_tc:3-18` termasuk jeda; A 19,731 s, `R9A_tc:4-7`), r1 R-9 = 37,366/34,554 = 1,081 dan median r1 = 1,081. Vonis (a) tetap GAGAL. Tanpa R-9 sama sekali, median r1 = rerata (0,900; 1,476) = 1,188, tetap GAGAL.

#### 4.1.5 Pecahan waktu arm B per fase (sumber log sesi)

Aturan: tiap tool call i punya jeda LLM `ts_call_i - ts_result_(i-1)` dan eksekusi `ts_result_i - ts_call_i`; keduanya dibebankan ke fase aksi i (atribusi uji 1/uji 2). Jendela [START harness, END].

| Fase | R7B s (%) | R8B s (%) | R9B s (%) | Agregat s (%) | Uji 2 agregat (%) |
|---|---|---|---|---|---|
| Pra-START (sampai hasil `mark START`) | 11,126 (9,1) | 21,280 (15,4) | 10,291 (3,5) | 42,697 (7,7) | 8,6 |
| Baca fakta | 1,345 (1,1) | 1,488 (1,1) | 1,190 (0,4) | 4,023 (0,7) | 8,0 (termasuk panduan) |
| Penelusuran kode sumber, rute API, dan rujukan | 0 | 0 | 78,716 (26,5) | 78,716 (14,1) | 3,5 (retrieval) |
| `template` (termasuk percobaan gagal dan baca kerangka) | 3,762 (3,1) | 12,706 (9,2) | 3,449 (1,2) | 19,917 (3,6) | - |
| Persiapan (mkdir, `date`) | 6,991 (5,7) | 4,958 (3,6) | 29,094 (9,8) | 41,043 (7,4) | 5,5 |
| Susun isi (write/patch, termasuk salin basis) | 62,324 (51,1) | 46,701 (33,7) | 70,052 (23,6) | 179,077 (32,1) | 69,5 |
| `check` | 4,257 (3,5) | 4,449 (3,2) | 4,806 (1,6) | 13,512 (2,4) | (draft-check di dalam susun) |
| CLI submit/update (jeda + eksekusi; R9B S3 termasuk check) | 15,034 (12,3) | 21,197 (15,3) | 18,280 (6,2) | 54,511 (9,8) | 1,2 (HTTP saja) |
| Admin pasca-S3 sampai END (R05 docs_b, inspeksi record/lint) | 17,025 (14,0) | 25,598 (18,5) | 80,989 (27,3) | 123,612 (22,2) | 2,1 |
| Jumlah | 121,864 | 138,377 | 296,868 | 557,109 | 1420,829 |

Rincian penting:
- R9B penelusuran 78,716 s = kode sumber rute/API 16,543 (`R9B_tc:3`, `:5`, `:7`, `:13`) + rujukan R7B lewat MD, R21, R20, R16 34,662 (`:4`, `:6`, `:8-12`, `:15`) + kode sumber untuk bentuk (Rujukan, enum status, ReportedAt) 27,511 (`:14`, `:16-18`).
- R9B persiapan memuat jeda 21,724 s sebelum `date` (`R9B_tc:25`) yang kemungkinan besar adalah penyusunan S2 (hipotesis). Bila jeda itu dihitung susun, susun R9B = 91,776 s.
- R8B `template` 12,706 s termasuk percobaan pertama yang gagal karena folder belum ada (`R8B_tc:4`, 6,923 s) dan baca kerangka (`:6`).
- CLI menurut kolom `dur_s` baris `tool` (setara cara uji 2): R7B 4,065, R8B 4,948, R9B 4,207 s, agregat 13,220 s (2,4%). Eksekusi per log sesi 32,828 s (5,9%). Selisihnya adalah start `npx tsx` dan `trial-log step edit` per pemanggilan (sekitar 1,5-2 s; selaras proses `submit` 2,6 s dinding di `coder_execution_r3_01.md:52`).
- T1 R-8: kelebihan B 19,017 s = pra-START +8,541, template +12,706, check +4,449, submit sampai POST terakhir +3,667, persiapan -2,692, susun -6,202 (B 10,389 lawan A 16,591), lain -1,452 (rincian A: pra 12,739, get 1,209, mkdir/date 7,650, tulis 16,591, edit log 1,731).
- T1 R-9: kelebihan B 63,351 s hampir seluruhnya penelusuran (+65,020: B 78,716 lawan A 13,696).

#### 4.1.6 Komposisi: apakah MD-native menurunkan biaya (hipotesis R3-01)

| Pasangan | Susun isi B / A (s) | B/A | Token keluaran B / A | B/A | Token penalaran B/A | Panggilan LLM B/A | Ukuran laporan final B / A (byte) | B/A |
|---|---|---|---|---|---|---|---|---|
| R-7 | 62,324 / 66,426 | 0,938 | 15612 / 16744 | 0,932 | 7673/8478 = 0,905 | 25/20 = 1,25 | 8013 / 10229 (L75, L99) | 0,783 |
| R-8 | 46,701 / 71,290 | 0,655 | 20047 / 16627 | 1,206 | 8664/6620 = 1,309 | 21/17 = 1,24 | 10416 / 12300 (L136, L106) | 0,847 |
| R-9 | 70,052 / 55,553 | 1,261 | 42749 / 16673 | 2,564 | 30259/9722 = 3,112 | 49/21 = 2,33 | 8353 / 9089 (L185, L220) | 0,919 |
| Median | | **0,938** | | **1,206** | 1,309 | 1,25 | | **0,847** |

Susun A dihitung dengan aturan yang sama atas `R7A_tc:5`, `:7-9`, `:11-16`, `:19`; `R8A_tc:4`, `:6-7`, `:9-15`; `R9A_tc:8`, `:11-12`, `:14-18`.

Putusan (Confidence HIGH untuk angka, MEDIUM untuk sebab):
- Hipotesis R3-01 terbukti untuk komposisi. Token keluaran B/A turun dari median 3,892 (uji 2) ke 1,206, waktu susun kini setara (median 0,938), dan laporan MD-native B lebih kecil daripada MD A (median 0,847). Pada uji 2, draf JSON 1,6-2,2 kali MD (`14:166-171`).
- Rasio R3-01 (MD 2.257 B lawan JSON 10.043 B, x4,45) adalah pengukuran satu laporan di lab. Di lapangan, penurunan token B/A dari uji 2 ke uji 3 adalah 3,892 / 1,206 = 3,2 kali, searah dan sebesar orde yang sama.
- Sisa token lebih pada R-9 (2,564) bersumber dari penelusuran kode dan inspeksi pasca-S3 (penalaran 3,1 kali), bukan dari menulis laporan.
- Byte persis yang ditulis agen (isi `write_file` + `new_string` patch) dan byte payload yang dikirim CLI: TIDAK-DIHITUNG-PERSIS oleh analis (tanpa shell; baris `api` POST tidak mencatat `bytes`). Batas bawah dari ukuran berkas: R8B menulis penuh tiga kali = 3024 + 8481 + 10416 = 21921 B; run patch (R7B, R9B, semua A) menulis S1 penuh ditambah potongan. Perintah §12 butir 4.

### 4.2 KE-2 Jumlah langkah (advisori; sumber utama log sesi, §6.2)

Aturan: tool call dengan `ts_call` dalam [START harness, END] dihitung 1; yang isinya hanya `trial-log mark`/`qmark`/`answer` tidak dihitung; panggilan gabungan (`mark START && get`) dihitung 1.

| Run | Baris dihitung | N_agent (log) | N CSV (silang, aturan research/13 §6.2) | Selisih |
|---|---|---|---|---|
| R7B | `R7B_tc:3-23` (baca, mkdir, template, date, tulis, check, submit, patch x7, update x2, R05 x4) | **21** | 9 (L50, L51, L62, L63, L74, L75, L88, L89, L90) | 12 |
| R7A | `R7A_tc:3-20` | **18** | 6 (L94-L99) | 12 |
| R8A | `R8A_tc:2-17` (`:17` = `mark END && printf format` di 9153,056 < END) | **16** (15 tanpa `:17`) | 4 | 12 |
| R8B | `R8B_tc:3-19` (`:19` = `mark END && head/ls` di 9362,696 < END) | **17** (16 tanpa `:19`) | 8 | 9 |
| R9B | `R9B_tc:2-46` | **45** | 26 (L154-L163, L164, L175, L176, L184, L185, L198, L199-L208) | 19 |
| R9A | `R9A_tc:2-19` | **18** | 8 (L213-L220) | 10 |

Rasio s = N_B/N_A: R-7 21/18 = 1,167; R-8 17/16 = 1,063 (tanpa baris END-bundel 16/15 = 1,067); R-9 45/18 = 2,500. Median **1,167**. Vonis **GAGAL** (advisori). Silang CSV: 1,50 / 2,00 / 3,25, median 2,00.

Selisih log lawan CSV dilaporkan, tidak dikoreksi (§14 butir 3): CSV tidak mencatat tulis/patch, `date`, `mkdir`, template, check, dan bacaan kode sumber.

Uji 2: 3,00 (CSV); uji 1: 11,33. Kini 1,167 (log) atau 2,00 (CSV).

### 4.3 KE-3 Galat format

- **G_B,stored = 0**: `ke3_dryrun.csv` 30 baris (record + bab 1-5 untuk W rev16, R7B rev17, R8B rev18, R9B rev14, M rev16), semua `200,true`, kolom `codes` kosong, cid per baris (`ke3_dryrun.csv:2-31`; laporan 06 `:3`). Gerbang keras **LULUS**.
- **G_B,4xx = 0** di R7B/R8B/R9B: tidak ada `http_status` 4xx/5xx di L48-L210; semua baris `tool` submit/update `ok=1` (L62, L74, L88, L122, L135, L149, L175, L184, L198). Σ 0, maks 0.
- **G_B,klien = 0** per kode (BASE_CONFLICT, BASIS_MISSING, BASIS_INVALID, BASIS_DOCUMENT_MISMATCH, DOCUMENT_MISMATCH): tidak ada `err_code` di baris `tool` run B. Tanda anomali W-12 (BASE_CONFLICT di run R): 0.
- **G_B,draft = 0**: setiap `check` dijalankan sekali sebelum submit dan (R9B) sebelum update S3, tanpa pengulangan (`R7B_tc:8`, `R8B_tc:9`, `R9B_tc:21`, `:36`); swalapor "check VALID ... keluar 0 pada percobaan pertama" (`R8B_stdout.txt:4`, `format_r9b.txt` butir 11 di `R9B_tc:48`); postcheck ulang `check --remote` rc 0, `valid=true`, 0 isu (`R7B_postcheck.json:16-26`; Grep `n_issues: 0` di semua postcheck B). Isi hasil tool `check` di state.db belum dibaca analis (perintah §12 butir 6).
- Peringatan non-blokir (dilaporkan, bukan galat): `HTML_INLINE` membuang `<n>` di R7B (`R7B_stdout.txt:6`) dan literal `<style>` di R8B (`R8B_stdout.txt:6`); `CONTRACT_STATUS_UNMAPPED` pada baris `Verdict` R9B (`R9B_stdout.txt:6`). Ini masalah integritas isi, bukan galat format (§8 F-4).
- **G_A** (manual, aturan research/12 §4.3, karena checker mekanis belum dijalankan): R7A `Status: complete`, Owner, CardIds, ReportedAt `2026-11-01`, bukti, lima bab wajib (`R7A_tc:5`, `:12`) = 0; R8A `Status: needs-review`, Owner, CardIds, ReportedAt, Verdict, lima bab (`R8A_tc:4`, `:9`) = 0; R9A `Status: complete`, Owner, CardIds, ReportedAt, lima bab + `### Rincian penutupan` + `## Rujukan` (`R9A_tc:8`, `:14`, `:17-18`) = 0. Σ G_A ketat 0, longgar 0.

Uji ambang: (a) stored 0 LULUS; (b) Σ 4xx 0 <= 3, maks 0 <= 2 LULUS; (c) Σ G_B 0 < Σ G_A 0 salah, tetapi `11:104` menetapkan bila Σ G_A = 0 dicatat "tidak ada keunggulan format teramati" tanpa menggagalkan. KE-3 **LULUS**. Sensitivitas Σ(G_B,4xx + G_B,klien) = 0: vonis sama. Sebab Σ G_A = 0: arm A memakai bentuk kepala dan bab dari brief §1 (§2 baris 7), sehingga uji ini tidak lagi mengukur keunggulan format kontrak atas MD bebas. Confidence HIGH (stored, 4xx, klien), MEDIUM (G_A manual).

### 4.4 KE-4 Retrieval

Kunci `Q_key_resolved.md:32-43` (sha 78509b8f...941c, D-456). Hasil `retrieval.csv:2-11`. Normalisasi: Q1/Q2/Q4 tingkat dokumen (sufiks `:baris` dan prefiks akar dibuang), Q3/Q5 tingkat baris/pid, himpunan.

| Q (urutan) | A = kunci? | B = kunci? | L_q A log sesi (CSV) | L_q B log sesi (CSV) | t_q A / B (s) |
|---|---|---|---|---|---|
| Q1 (A-B) | r9a: benar | cmvx7c1lo...: benar | 2 (1) | 11 (1): `cat format_r9b`, 8 baca kode sumber/rute (`Q_tc:9-18`), R21 `:19` | 4,276 / 20,966 |
| Q2 (B-A) | r7a, r9a: benar | r7b, r9b: benar | 1 (0; grep dibundel dengan qmark) | 2 (2) | 2,551 / 4,534 |
| Q3 (A-B) | r9a:44;45;46: benar | `#p-185c2xcf4e`: benar | 2 (1) | 2 (1) | 6,039 / 5,837 |
| Q4 (B-A) | r8a: benar | cmvx75zlw...: benar | 1 (1) | 1 (1) | 2,456 / 1,784 |
| Q5 (A-B) | r7a:57: benar | `cmvx6tagz...#p-qcqjwjhfrc`: benar | 2 (1) | 2 (2) | 6,654 / 6,697 |
| Median | | | **2** (1) | **2** (1) | 4,276 / 5,837 |

L_q log sesi dihitung dari `Q_tc:6-40` (panggilan `qmark START && kerja` = 1; `answer` murni = 0). Presisi = recall = 1 pada 10/10. Skor B **5/5**, A 5/5. Vonis **LULUS** (log dan CSV). Biaya Q1B bersumber dari tidak adanya parameter R21 di brief (friksi Q-1 Hermes, laporan 06 `:5`). Q5B kini dua panggilan (uji 2: lima) karena `refs` tersimpan dari `## Rujukan` (Q_key `:15`, `:28`). Confidence HIGH.

### 4.5 KE-5 Jejak disk (kelas D-442, §21.4)

#### 4.5.1 Ringkasan postcheck per run

| Run | Draf sah (check rc 0 + baris tool ok=1 ber-`note` basename) | S3/S4 baru | `touched_by_run` | D_raw_d442 mentah postcheck | D_raw dua-bukti lama (sensitivitas) | Pola payload di luar milik controller dan unduhan final |
|---|---|---|---|---|---|---|
| R7B | 1/1 (`R7B_postcheck.json:12-30`; L62/L74/L88 `note=laporan.md`) | 33 | 8 | 8 | 12 | 0 (`grep_R7B.txt:2-3`) |
| R8B | 1/1 | (Grep `ringkas`) | 0 | 0 | 0 | 0 (`grep_R8B.txt:2-3`) |
| R9B | 1/1 | (Grep `ringkas`) | 0 | 0 | 0 | 0 (`grep_R9B.txt:2-3`) |
| W (gerbang W) | 1/1 | | 85 | 85 | 128 | 0 (`grep_W.txt:2-3`) |
| M | 1/1 | | 0 | 0 | 0 | 0 |

Sumber: `R7B_postcheck.json:1153-1187`; Grep `D_raw_d442_n`, `D_raw_dua_bukti_lama_n` di `R8B_postcheck.json:210-211`, `R9B_postcheck.json:242-243`, `W_postcheck.json:4527-4528`, `M_postcheck.json:208-209`. Pola Grep (`contractRecord|studio.(slot|chapter)/v2|"baseRevisionNo"|"chapterKey"`) hanya mengenai HTML final (pengecualian 2) dan log stdout DEV milik controller `Temp/claude/.../tasks/bw37aeur5.output` (pengecualian 3).

#### 4.5.2 Konfirmasi D-456: positif palsu profil Chromium server (DIKONFIRMASI)

Kedelapan berkas R7B `touched_by_run` (dan 85 di W) berada di `Temp/playwright_chromiumdev_profile-RaNCWy/`. Bukti:

1. **Induk proses**: profil dipakai `chrome.exe` pid 29980 dengan ppid 23232, dibuat 2026-11-01T02:01:28,989Z; anak-anaknya (crashpad, gpu `--headless`, utility) memakai `--user-data-dir=...playwright_chromiumdev_profile-RaNCWy` (`W_host_post.txt:15-20`; sama di `R9B_host_pre.txt:15-20`). pid 23232 = `next start-server (anak next dev :9021)` di daftar putih controller (`host_whitelist.txt:6`). Proses Hermes (`hermes.exe`, meta `cmd`) bukan leluhurnya.
2. **Waktu lahir**: 02:01:28,989Z = epoch 8488,989, tepat di dalam pemanggilan render pertama W `POST .../render` L16 (8487,200-8489,605). Itu render pertama sesudah DEV dimulai ulang (D-455), jadi Chromium headless diluncurkan oleh server untuk render.
3. **Waktu tulis berkas R7B**: mtime 02:04:29,292-02:04:29,295Z untuk `LOCK`/`LOG` LevelDB dan 02:04:29,149Z untuk `BrowserMetrics-spare.pma` (`R9B_host_pre.txt:31-38`), yaitu tepat 180,2-180,3 s sesudah Chromium lahir; `Crashpad/metadata` 02:11:29,029Z = 600,0 s sesudahnya. Selang bulat ini cocok dengan pewaktu internal Chromium (mekanisme pewaktu = hipotesis; selangnya fakta).
4. **Bukti sentuh hanya token generik**: kecocokan `touched_by_run (langsung)` berasal dari basename `LOCK` (8 kemunculan) dan `LOG` (26) di log sesi; path penuh, folder induk (`AutofillAiModelCache`, `AutofillStrikeDatabase`, `BudgetDatabase`, `GCM Store`), dan nama folder profil semuanya 0 (`R7B_postcheck.json:187-560`). Tidak ada tool call R7B yang menyebut chrome, playwright, atau folder profil (`R7B_tc:2-25`).
5. **Kebetulan waktu yang harus disebut**: pemanggilan `template` R7B berjalan 8668,016-8669,914 (`R7B_tc:5`) dan mencakup mtime 8669,292. `template` hanya menulis ke stdout, tanpa server, rahasia, atau berkas (protokol §7, `studio-report.ts:1320-1324`), dan bukan induk Chromium. Kebetulan ini tidak mengubah putusan.
6. **Kriteria mentah**: §21.4 menghitung berkas yang memenuhi kriteria mentah research/13 §6.5 DAN terbukti disentuh. Kedelapan berkas adalah LevelDB/biner tanpa kecocokan pola (`pola_payload_di_lainnya: 0`, `R7B_postcheck.json:1160`), jadi gagal kriteria mentah walau bukti sentuh diterima.

Putusan: **D_raw,B R7B = 0**; gerbang W lulus atas dasar yang sama (`driver_W.log` mendaftar 20 dari 85, semuanya di folder profil yang sama; hitung penuh 85 lewat perintah §12 butir 7). Sensitivitas aturan dua-bukti lama (R7B 12, W 128) juga seluruhnya berkas profil dengan 0 kecocokan pola, sehingga tidak dihitung menurut kriteria mentah. Vonis KE-5 tidak berbeda antara kedua aturan (W-8). Confidence HIGH.

#### 4.5.3 F_name dan F_sha

- F_name: `042-GSP-LAP-XI-2026_rev17_20261101T020553Z_d3119785.html` (L87), `043-GSP-LAP-XI-2026_rev18_20261101T021537Z_cba36cec.html` (L148), `044-GSP-LAP-XI-2026_rev14_20261101T022103Z_9cba0bce.html` (L197) cocok regex `11:133`: **3/3**.
- F_sha: sha8 nama = awal sha16 baris unduh (d31197858d1dc0bc L85; cba36cec9273d551 L146; 9cba0bce02c403e4 L195), byte unduh = byte simpan (2606883, 2621324, 2612029; L85/L87, L146/L148, L195/L197), HEAD verify 200 (L86, L147, L196); R9B juga menghitung ulang sha16 berkas di disk (`R9B_tc:38`). **3/3**.

#### 4.5.4 Temuan terbuka: berkas respons sesaat R9B

`R9B_tc:10` menjalankan `trial-log get ".../cmvx6tagz006mv1xcjyq4zn17/content" 2>&1 > /tmp/r20_r7b.json` (8489,973) lalu `R9B_tc:11` menghapusnya (8495,858). Respons R20 berukuran 10883 B (L157). Di Git Bash, `/tmp` lazimnya dipetakan ke `%TEMP%` (hipotesis; tidak diverifikasi). Berkas hidup sekitar 6 s, sehingga tidak ada di snapshot post dan tidak dihitung definisi KE-5 (berkas baru pada snapshot). Berkas ini melanggar brief §4 (`06_brief:30`: dilarang menyimpan respons API sebagai berkas, termasuk `%TEMP%`) dan terbukti disentuh run lewat log sesi. Sensitivitas "termasuk berkas sesaat terbukti di log" memberi D_raw,B R9B = 1, sehingga gerbang keras (3) **GAGAL** dan vonis menjadi TIDAK EFEKTIF. Apakah isinya cocok pola payload: tidak diketahui (hipotesis: respons R20 memuat struktur `studio.chapter/v2`). Perbedaan vonis ini disajikan ke USER apa adanya (pola §21.4 baris sensitivitas). Penyebab perilaku: tidak ada cara mencari pid dari teks tanpa mengurai JSON R20 (§8 F-2, U-24).

Vonis KE-5: **LULUS** (definisi D-442 dan aturan lama sama-sama 0 sesudah ajudikasi profil), dengan temuan terbuka §4.5.4. Confidence HIGH untuk F_name/F_sha dan profil; MEDIUM untuk pemetaan `/tmp`.

### 4.6 KE-6 Beban pikir format

FD (10 dimensi `11:145-156`), dinilai dari artefak dan swalapor `format_<run>.txt` (berlabel swalapor). Dimensi dihitung bila agen menyatakan keputusan bentuk yang tidak ditetapkan alat/templat.

| Dimensi | R7B | R8B | R9B | Arm A (R7A/R8A/R9A) |
|---|---|---|---|---|
| F1 nama berkas | mesin | mesin | mesin | brief (`laporan.md`) |
| F3/F4 kepala dan kunci | templat | templat | templat | disalin dari brief §1 (diputuskan meniru) |
| F5 status | set tertutup | set tertutup; pemetaan draft -> partial -> needs-review diputuskan sendiri (`format_R8B` butir 4) | set tertutup (enum templat `done/running/todo`, butir 4) | diputuskan (status butir bahasa Indonesia) |
| F6 verdict | tidak ada | enum (`FAIL`) | diputuskan: teks bebas di `Verdict`, alat `CONTRACT_STATUS_UNMAPPED`, diterima (butir 6) | diputuskan |
| F7 struktur dalam bab | diputuskan (narasi di Rincian, butir 4) | diputuskan (CHECK sebagai paragraf di Bukti, butir 6) | diputuskan (tabel + prosa ganda, butir 5) | diputuskan |
| F8 rujukan bukti | kolom templat | kolom templat (sel kosong, butir 5) | tabel `## Rujukan` templat | diputuskan (R9A path + nomor baris) |
| F10 tanggal | pola alat | pola alat | pola alat (bentuk panjang dipilih, butir 2) | diputuskan (`2026-11-01` + jam di prosa) |
| FD | **1** | **1** | **2** | sekitar 5 per laporan (taksiran analis) |

Sensitivitas FD: F5 R8B dihitung -> FD 2 (tetap lulus); F10 R9B dihitung -> FD 3 (gagal komponen FD).

FL dalam [START harness, END] dari log sesi:

| Run | FL utama (pola dasar + laporan lama run lain) | FL_tpl | FL + FL_tpl | Bacaan kode sumber untuk bentuk (luas) | Semua bacaan kode/dok repo | CSV `format_lookup` (silang) |
|---|---|---|---|---|---|---|
| R7B | 0 | 1 (`R7B_tc:5`) | 1 | 0 | 2 (`:20-21`, admin R05) | 0 |
| R8B | 0 | 2 (`R8B_tc:4` gagal, `:5`) | 2 | 0 | 3 (`:15-17`, admin R05) | 0 |
| R9B | 0 | 1 (`R9B_tc:19`) | 1 | 6 (`:14`, `:16`, `:17`, `:18`, `:44`, `:46`) | 14 | 0 |
| R7A | 0 | - | 0 | 0 | 0 | 0 |
| R8A | 0 | - | 0 | 0 | 0 | 0 |
| R9A | 1 (`R9A_tc:7`: r8a sebagai contoh bentuk, label Hermes; panggilan itu hanya mencatat, isi r8a tidak dicetak) | - | 1 | 0 | 0 | 1 (L217) |
| Median B / A | **0 / 0** | | **1 / 0** | 0 / 0 | 3 / 0 | 0 / 0 |

Vonis utama: FD_B <= 2 pada 3/3 dan median FL_B 0 <= median FL_A 0: **KE-6 LULUS**. Sensitivitas wajib FL + FL_tpl: 1 > 0, **GAGAL**. Vonis berbeda; sesuai protokol §6.4 disajikan ke USER apa adanya. Sensitivitas tambahan "semua bacaan kode repo" juga GAGAL (3 > 0). Uji 2: FL_B 1/2/1; uji 1: 5/3/2. Panduan dan registri tidak lagi dibuka oleh run R (0 baris `STUDIO-AGENT-GUIDE`, `registry`, `--help`); W masih membukanya (L5-L7). Confidence MEDIUM (ajudikasi bacaan kode).

### 4.7 KE-7 Kelengkapan

- **K_B = 100% 3/3**: setiap update S3 memakai `--require-complete --out`, merender 200 dan verify 200 (L84/L86, L145/L147, L194/L196); kunci Q mencatat ketiganya COMPLETE (`Q_key_resolved.md:13-15`). Gerbang keras **LULUS**.
- **KF (sampel)**: token wajib manifest §5 untuk fakta F-upd1/F-upd2 dicek analis pada teks akhir kedua arm (A = MD akhir dari argumen write/patch; B = MD-native yang terkirim, dikurangi token yang dibuang `HTML_INLINE`):
  - R-7 F17-F18, F20-F32, F34-F37, F39-F40, F43, F47 (21 fakta bertoken): R7B 21/21, R7A 21/21 (`R7B_tc:7`, `:11-18`; `R7A_tc:5`, `:8-16`). Token `HOL brs` tetap ada walau `<n>` dibuang.
  - R-8 F30-F35, F37-F43, F46 (14 fakta): R8B 14/14 (`R8B_tc:13`), R8A 14/14 (`R8A_tc:7`, `:9-13`). Literal `<style>` yang dibuang bukan token manifest (R8-F40 = `gsp-verification-before-completion`, manifest `:228`).
  - R-9 F21, F35-F39 (6 fakta): R9B 6/6 (`R9B_tc:26`, `:29-35`), R9A 6/6 (`R9A_tc:12`, `:15-17`).
  - Hasil sampel 41/41 = 100% di keenam laporan. Fakta F-awal, sisa F-upd, fakta manual, dan status transien S1/S2 (W-14, R20 per revisi) belum dicek: TIDAK-DIHITUNG-PENUH, perintah §12 butir 2-3.
- Vonis: **LULUS sementara** (K_B pasti; KF_B = KF_A = 100% pada sampel). Q5 arm B (W-15) terpenuhi: `refs` R9B ke `cmvx6tagz...` pid `p-qcqjwjhfrc` rel evidence rev17, R16 cid 9345db95... (`Q_key_resolved.md:15`, `:28`). Confidence HIGH (K_B), MEDIUM (KF sampel).

### 4.8 MU-1 dan MU-2

- MU-1: SQL `masterplan/05:1329` tidak dijalankan analis (tanpa shell): **TIDAK-DAPAT-DIHITUNG persis**; perintah §12 butir 1.
- Proksi revisi dari kiriman 2xx timing.csv: W 6 + 4 + 6 = 16; R7B 6 + 5 + 6 = 17; R8B 6 + 6 + 6 = 18; R9B 6 + 2 + 6 = 14; M 6 + 4 + 6 = 16. Semuanya sama dengan `revisionNo` di `docs_b.csv:1-5`.
- Proksi aktor: M rev1-6 dan rev11-16 `agent:hermes-gsp-master01`, rev7-10 `agent:hermes-gsp-verifier01` (`m_revisions.txt:1-16`, R05 `?rev=n` oleh controller), sehingga aktor = 2; agen-id M2 lewat `--agent-id hermes-gsp-verifier01` (Grep `M_tc:13`). W, R7B, R8B, R9B: 1 aktor (`docs_b.csv` lastFilledBy master01; semua submit/update `--agent-id hermes-gsp-master01`). W-14 terpenuhi; lastFilledBy record/content akhir M kembali ke master01 (`docs_b.csv:5`).
- MU-2: porsi aktor = 1 sebesar 4/5; median revisi = median(16, 17, 18, 14, 16) = 16. Pembanding KE-5: laporan MD baru arm A 3; arm B 0 laporan mentah + 5 laporan MD-native sah (w, r7b, r8b, r9b, m). Pada jalur MD-native, arm B juga meninggalkan satu MD per laporan di folder run. Keunggulan "tanpa berkas MD" uji 2 tidak lagi berlaku; Studio menjadi indeks terstruktur di atas MD.
- Delta U-16 (blok terkirim per update / blok total): R7B 5/6 + 6/6, R8B 6/6 + 6/6 (tulis ulang penuh), R9B 2/6 + 6/6, W 4/6 + 6/6, M 4/6 + 6/6. Manifest §1.1 merancang tiap pembaruan menyentuh 3-5 bagian, tetapi agen ikut menyunting bab Isu/Langkah, status tabel, dan baris basis. Penghematan delta kecil, dan biaya per blok sekitar 0,08 s, sehingga pengaruhnya ke waktu dapat diabaikan.

## 5. Gerbang keras dan vonis gabungan

| Gerbang D-362 | Bukti | Hasil |
|---|---|---|
| (1) 0 laporan menyimpang skema | `ke3_dryrun.csv:2-31` 30/30 valid | LULUS |
| (2) Retrieval 5/5 | §4.4 | LULUS |
| (3) 0 berkas mentah | §4.5; positif palsu dikonfirmasi; pola payload hanya pada pengecualian 2/3 | LULUS (temuan terbuka §4.5.4) |
| (4) Kelengkapan 100% | §4.7 | LULUS |

KE-1 GAGAL; KE-6 LULUS (utama), GAGAL pada sensitivitas FL_tpl; KE-2 GAGAL advisori. Menurut `11:180`: **NETRAL (keputusan USER)**, yaitu "andal, komposisi kini setara, tetapi waktu menulis belum setara".

Kekokohan:
- NETRAL turun ke TIDAK EFEKTIF bila USER atau DC-47c menghitung berkas sesaat `/tmp` R9B (§4.5.4) atau menolak ajudikasi profil Chromium (§4.5.2).
- NETRAL naik ke EFEKTIF hanya bila KE-1 lulus. Jaraknya kini kecil untuk (b) (median 0,922 lawan 0,70) dan sedang untuk (a) (1,476 lawan 1,00), tetapi KE-1 sudah di siklus 3 dari 3.
- KE-6 bergantung pada aturan FL_tpl (D-437). Tanpa aturan itu, vonis tetap NETRAL (KE-1 sudah gagal), jadi FL_tpl tidak mengubah vonis gabungan.

## 6. Perlakuan penyimpangan

| Butir | Dampak terukur | Pengaruh vonis |
|---|---|---|
| R8B menulis ulang penuh S2/S3 (brief §2) | Token R8B 20047 (B/A 1,206); susun R8B tetap lebih cepat daripada R8A (46,7 lawan 71,3 s); delta 6/6 | Tidak mengubah vonis; swalapor laporan 06 `:5` dikoreksi |
| R9B berkas `/tmp` sesaat (brief §4) | §4.5.4 | Sensitivitas membalik gerbang (3) |
| R9B membaca kode sumber repo 14 kali | 78,7 s di T1, FL luas 6 | Penyebab utama r1 R-9; dilaporkan sebagai kontrafaktual |
| Baris sesudah END: R9B 1 (L210), Q 2 (L313-L314) | Admin/retroaktif; tidak dihitung N | Tidak ada |
| Baris END-bundel R8A/R8B (`R8A_tc:17`, `R8B_tc:19`) | N ketat termasuk; sensitivitas tanpa | KE-2 median tetap 1,167 |
| `host_whitelist.txt` hanya pengelompokan catatan; host sibuk 9/9 | §4.1.3 | Sensitivitas 5b TIDAK-DAPAT-DIHITUNG |
| `docs_b.csv` tanpa header | Kolom diketahui dari brief (`06_brief:74`) | Tidak ada |
| R20 per revisi, SQL MU-1, checker G_A belum dijalankan (laporan 06 `:7` h) | KF transien, MU-1 persis, G_A mekanis tertunda | §12 |
| W `trial-log` TARGET_MISSING (L5, anchor `#17`) | W tidak dinilai | Tidak ada |
| Baseline arm A memakai bentuk brief §1 | G_A 0, FD_A turun | KE-3 tidak dapat menunjukkan keunggulan format; KE-6 lebih sulit lulus bagi B. Celah desain, §11 G3-6 |

## 7. Perbandingan tiga uji (acuan historis; lembar berbeda, tidak dipasangkan)

| Metrik | Uji 1 (research/12, 12b; via `14:349-363`) | Uji 2 (research/14) | Uji 3 (ini) | Arah |
|---|---|---|---|---|
| KE-1 r1 median (komposisi pertama) | tidak didefinisikan (pemisahan D-422 belum ada) | 2,050 | **1,476** | membaik, tetap GAGAL |
| KE-1 r2 median / maks (pembaruan) | 2,378 (S2+S3: 2,415 / 2,378 / 0,925) | 4,296 / 5,980 | **0,922 / 1,615** | sangat membaik, tetap GAGAL |
| START Hermes-END median | 4,179 | 3,863 | 1,217 | sangat membaik |
| Sesi penuh wall_s median | 1,794 | 2,355 | 1,353 | membaik |
| KE-2 langkah median | 11,33 (CSV) | 3,00 (CSV) | 1,167 (log sesi); 2,00 (CSV) | membaik, tetap GAGAL |
| FL_B median | 3 (5/3/2) | 1 (1/2/1) | 0 (0/0/0); + FL_tpl 1 | KE-6 lulus pertama kali (utama) |
| Token keluaran B/A median | 1,708 | 3,892 | **1,206** | turun 3,2 kali dari uji 2 |
| Byte artefak agen B/A median | tidak tercatat | 1,959 (draf JSON lawan MD) | **0,847** (MD-native lawan MD) | B kini lebih kecil |
| Waktu susun isi B, agregat (porsi jendela) | 512,6 s (58,0%) | 988,0 s (69,5%) | 179,1 s (32,1%) | sangat turun |
| Susun B/A median | - | - | 0,938 | setara |
| Overhead CLI + galat (porsi) | sekitar 22,6% | 2,8% | CLI HTTP 2,4%; CLI log sesi 9,8%; galat 0 | galat hilang; biaya tetap per pemanggilan kini terlihat |
| KE-3 | LULUS (12b); 4xx 3 | LULUS; 4xx 1 | LULUS; 4xx 0, klien 0, draft 0 | membaik |
| KE-4 | gerbang LULUS | LULUS (Q5B 5 langkah) | LULUS (Q5B 2 langkah) | membaik |
| KE-5 | GAGAL | LULUS | LULUS (temuan `/tmp`) | tetap |
| KE-7 | LULUS | LULUS | LULUS sementara | tetap |
| Vonis gabungan | TIDAK EFEKTIF | NETRAL | NETRAL | tetap; jarak ke EFEKTIF menyempit |

## 8. Umpan balik sisi menulis Hermes (swalapor, dari `_stdout` dan `format_*.txt`) dan friksi

Sumber: `R7B_stdout.txt:1-7`, `R8B_stdout.txt:1-6`, `R9B_stdout.txt:1-6`; `format_r7b.txt` (`R7B_tc:25`), `format_R8B.txt` (`R8B_tc:21`), `format_r9b.txt` (`R9B_tc:48`), `format_W.txt` (`W_tc:24`), `format_R7A/R8A/R9A.txt` (`R7A_tc:22`, `R8A_tc:17`, `R9A_tc:21`). Sesi Q tidak memuat bagian C/D/H (laporan 06 `:5`, `:7` e).

Yang dilaporkan Hermes sebagai lebih ringan: alur template -> isi -> check -> submit -> salin basis -> update berjalan tanpa galat di 3/3 run; tidak ada blok JSON; tabel butir dan `## Rujukan` diterima; check lulus pada percobaan pertama (R9B butir 11).

Friksi tersisa (swalapor disilang dengan log):

| # | Friksi | Bukti | Dampak terukur |
|---|---|---|---|
| F-1 | Biaya tetap per langkah arm B: `template`, `check`, `submit`/`update` masing-masing proses `npx tsx` baru (sekitar 1,5-2 s start) plus jeda keputusan dan salin basis | §4.1.5; `coder_execution_r3_01.md:52` | T1 R-8: +20,8 s overhead khusus B; dominan pada laporan pendek |
| F-2 | Rute dan parameter API (R20/R21/R22/R16, R05 lastFilledBy) tidak ada di brief/templat; agen membaca kode sumber dan mengurai JSON R20 untuk mencari pid | `R9B_tc:3-18`, `:37-46`; `Q_tc:10-18`; friksi Q-1 dan Q-2 (laporan 06 `:5`) | R9B 78,7 s di T1 + 81,0 s admin; Q1B 11 langkah; berkas `/tmp` |
| F-3 | Verdict teks bebas ("VONIS RATIFIKASI: PASS (sebagai REKOMENDASI) ...") tidak masuk enum; `CONTRACT_STATUS_UNMAPPED`, teks jatuh ke bab 1, `record.verdict` kosong | `R9B_stdout.txt:6`; `format_r9b` butir 6 | FD F6 R9B; pencarian verdict terstruktur hilang |
| F-4 | `HTML_INLINE` membuang literal seperti `<n>` dan `<style>` diam-diam (exit 0, hanya peringatan) | `R7B_stdout.txt:6`; `R8B_stdout.txt:6`; `format_R8B` butir 8 | Makna kalimat berubah di dokumen tersimpan (integritas isi) |
| F-5 | Pemetaan status laporan per langkah (draft lawan partial) tidak ditetapkan | `format_R8B` butir 4 | FD F5 (sensitivitas) |
| F-6 | Lint server menandai FAIL gaya pada teks verbatim fakta (mis. `338.7mm`, paragraf 164 kata) | `format_R8B` butir 9 | Tidak memblokir; menambah keputusan |
| F-7 | `template` ke folder yang belum ada gagal (redirect shell) | `R8B_tc:4-5` | 6,9 s |
| F-8 | Baris basis harus disalin manual tiap langkah | `R7B_tc:10`, `R9B_tc:24`, `:30` | 4-9 s per run |
| F-9 | `trial-log` tidak mencatat perintah berantai `&&`; R20 menerima parameter tak dikenal tanpa galat | laporan 06 `:5` friksi 2-3; L304 `?section=references` 200 | Ukur dan retrieval |
| F-10 | Admin `docs_b.csv` (lastFilledBy dari R05) membebani agen sesudah S3 | `R7B_tc:20-23`, `R8B_tc:15-18`, `R9B_tc:37-46` | 17-81 s per run (di T, bukan T1/T2) |

Vonis Hermes (bagian G, kutipan laporan 06 `:5`): "Untuk retrieval, Studio layak menggantikan grep MD pada misi yang laporannya lintas sesi dan kuerinya terstruktur (kartu, status, owner) ... Tidak layak pada dua hal: pencarian teks murni setara saja ... dan kebutuhan lokasi baris fisik ... Kesimpulan operasional: simpan MD sebagai arsip, jadikan jalur Studio untuk tanya-jawab misi, dan tahan klaim hemat biaya menulis sampai ada run tulis yang mengukurnya." Vonis ini searah dengan metrik. Klaim "tahan klaim hemat biaya menulis" kini dapat dijawab dari data: komposisi setara (susun B/A 0,938, token 1,206), tetapi waktu menulis total belum setara (KE-1 GAGAL).

Klaim Hermes/laporan yang dicek: "tidak pernah menulis ulang penuh" BENAR untuk R7B dan R9B, KELIRU untuk R8B (§2). "Galat nol" BENAR (§4.3). "check VALID pada percobaan pertama" DIDUKUNG (§4.3).

## 9. Usulan berpemilik (baris baru), berprioritas

Target angka berlabel hipotesis; sah sesudah diukur ulang.

| ID | Prioritas | Friksi | Pemilik | Area | Perubahan | Metrik yang diharapkan membaik |
|---|---|---|---|---|---|---|
| U-23 | P1 | F-1, F-8 | coder-execution (MCP-01 yang sedang berjalan, D-457) | server MCP Studio + `studio-report` | Satu proses tetap (MCP stdio) untuk template/check/submit/update, sehingga start `npx tsx` per langkah hilang; `submit`/`update` menulis baris `basis:` ke berkas sendiri bila diminta (`--write-basis`); `template` membuat folder | KE-1 (a): biaya tetap B sekitar 10-20 s per T1 turun (hipotesis) |
| U-24 | P1 | F-2 | coder-execution + pemilik panduan | `studio-report` (atau alat MCP) + panduan §17.0 | Perintah `find --mission --doc-key --grep <teks>` yang mengembalikan documentId + pid + cuplikan tanpa mengurai JSON; kartu rute ringkas R20/R21/R22/R16/R05 di keluaran `template` dan brief | KE-1 R-9, KE-4 Q1B, larangan berkas sementara (§4.5.4) |
| U-25 | P1 | F-4 | coder-execution + senior-code-reviewer | konversi MD (`md-report.ts` / import contract) | Literal mirip tag di teks di-escape sebagai teks, bukan dibuang; bila tetap dibuang, keluar 1 dengan kode | Integritas isi; KF |
| U-26 | P2 | F-3 | USER (keputusan registri) lalu coder-execution | registri verdict | Izinkan `verdict.note` teks bebas di samping enum, atau alias "PASS (rekomendasi)" | FD F6; pencarian verdict |
| U-27 | P2 | F-5, F-6 | pemilik panduan | panduan + brief | Tetapkan status laporan per langkah; lint gaya tidak berlaku pada kutipan verbatim | FD |
| U-28 | P2 | F-10, celah baseline | controller (HARNESS) | `ab3.py` + brief uji berikut | Harness mengisi `docs_b.csv` dari R05; brief arm A tidak memuat skema arm B (atau baseline "MD terskema" dinyatakan eksplisit) | Daya beda KE-3/KE-6; T bersih |
| U-29 | P3 | F-9 | coder-execution (server) + controller (trial-log) | rute R20; `trial-log` | R20 menolak parameter tak dikenal (400 + daftar sah); `trial-log` mendokumentasikan batas `&&` | KE-4 |
| U-30 | P1 (prasyarat klaim) | Celah §11 | DC-47c (verifier) | baca saja | Jalankan perintah §12 | Menutup TIDAK-DAPAT-DIHITUNG |

Usulan teratas: U-23 dan U-24 (satu-satunya yang menyasar sisa KE-1), U-25 (integritas data), dan U-30 (prasyarat klaim).

## 10. Key Findings (Confidence / Evidence / Implication)

| # | Temuan | Confidence | Evidence | Implication |
|---|---|---|---|---|
| KF-1 | KE-1 gagal di kedua segmen: median r1 1,476; median r2 0,922 (maks 1,615) | HIGH | §4.1.1-§4.1.2; L48-L221 | Batas loop KE-1 tercapai; keputusan jalan ada di controller/USER |
| KF-2 | MD-native menurunkan biaya komposisi sesuai hipotesis: token B/A 3,892 -> 1,206; susun B/A 0,938; laporan B/A 0,847 | HIGH (angka) / MEDIUM (sebab) | §4.1.6; `usage_*.json`; toolcalls | Sasaran D-435 tercapai untuk komposisi |
| KF-3 | Sisa selisih waktu = biaya tetap per langkah B dan penelusuran rute/kode sumber (R9B 78,7 s di T1) | HIGH | §4.1.5 | U-23, U-24; jangan lagi mengoptimalkan format |
| KF-4 | Semua gerbang keras lulus; G_B 0 di semua kelompok (stored, 4xx, klien, draft) | HIGH | §4.3, §5 | Keandalan dipertahankan |
| KF-5 | D-456 DIKONFIRMASI: profil Chromium milik server DEV (ppid 23232, lahir di dalam render W), bukti sentuh hanya token generik, gagal kriteria mentah | HIGH | §4.5.2; `W_host_post.txt:15-20`; `host_whitelist.txt:6`; L16 | Postcheck perlu penyaring token generik dan kriteria mentah (H3 berikut) |
| KF-6 | R9B menyimpan respons R20 ke `/tmp` selama 6 s (melanggar brief §4) | HIGH (log) / MEDIUM (lokasi fisik) | `R9B_tc:10-11` | Sensitivitas membalik gerbang (3); disajikan ke USER |
| KF-7 | R8B menulis ulang laporan penuh di S2/S3 meski dilarang brief | HIGH | `R8B_tc:8`, `:11`, `:13` | Swalapor laporan 06 tidak berlaku umum |
| KF-8 | KE-6 lulus pertama kali (FL utama 0/0/0), tetapi gagal bila FL_tpl dihitung | MEDIUM | §4.6 | Perbedaan vonis disajikan ke USER (protokol §6.4) |
| KF-9 | Arm A memakai skema brief §1, sehingga G_A = 0 dan FD_A turun | HIGH | `06_brief:7-8`; `R7A_tc:22` | Celah desain; KE-3 tidak bisa menunjukkan keunggulan format |
| KF-10 | Pada jalur MD-native, arm B juga meninggalkan satu MD per laporan; Studio menjadi indeks terstruktur di atas MD | HIGH | §4.8; postcheck `draf_sah` | Searah dengan vonis Hermes "MD arsip, Studio tanya-jawab" |
| KF-11 | `HTML_INLINE` membuang literal teks diam-diam | HIGH | `R7B_stdout.txt:6`; `R8B_stdout.txt:6` | U-25 |

## 11. Asumsi dan celah (Tier 1)

| ID | Asumsi/celah | Dampak bila keliru |
|---|---|---|
| AS-1 | `t_end` `trial-log step edit` arm A dicatat sesudah suntingan tersimpan | T_A sedikit membesar; menguntungkan B; vonis tetap |
| AS-2 | Jam `state.db` = jam timing.csv (mesin sama, AS3-1) | Diperiksa: `mark START` log sesi selalu < penanda CSV dalam 1 s (mis. `R7B_tc:2` 8659,324 lawan L49 8660,158) |
| AS-3 | Aturan atribusi fase (selang -> aksi pengakhir) | Porsi bergeser antar kategori (contoh jeda 21,7 s R9B), total tetap |
| G3-1 | n = 3, deskriptif | Confidence MEDIUM |
| G3-2 | Tanpa shell: SQL MU-1, R20 per revisi S1/S2, KF penuh, checker G_A, byte argumen tulis, isi hasil `check` di state.db belum dihitung | Perintah §12 untuk DC-47c; vonis gerbang keras tidak bergantung padanya kecuali KF |
| G3-3 | `token_count` kosong | Token per segmen TIDAK-TERSEDIA (AS3-3) |
| G3-4 | `/tmp` Git Bash dipetakan ke `%TEMP%` (hipotesis) | Bila tidak, berkas sesaat di luar S3; temuan tetap pelanggaran brief |
| G3-5 | W `touched_by_run` 85: analis melihat 20 di `driver_W.log` | Perintah §12 butir 7 |
| G3-6 | Brief yang sama untuk kedua arm memuat skema laporan | Baseline arm A tidak murni "MD bebas" (U-28) |
| G3-7 | FD_A sekitar 5 adalah taksiran analis | Tidak dipakai di ambang |

## 12. Implementation Order dan perintah verifikasi DC-47c (baca saja)

1. MU-1 (masterplan/05 §19.3, baca saja, DB DEV `gsp_agent_hq_v21`):
   `psql "<URL DB DEV v21 milik controller>" -c "BEGIN READ ONLY; SELECT d.\"id\", d.\"docNumber\", count(*) AS revisions, count(DISTINCT rv.\"createdBy\") AS actors FROM \"StudioDocument\" d JOIN \"StudioRevision\" rv ON rv.\"documentId\" = d.\"id\" WHERE d.\"contractKind\" IS NOT NULL AND d.\"id\" IN ('cmvx6owkx0001v1xck5d2bnms','cmvx6tagz006mv1xcjyq4zn17','cmvx75zlw00hav1xc4wj2xzjf','cmvx7c1lo00vnv1xcw1s5cqb4','cmvx7n26e014sv1xcwixz9l46') GROUP BY d.\"id\", d.\"docNumber\"; ROLLBACK;"`
   Harapan: revisions 16/17/18/14/16; actors 1/1/1/1/2.
2. R20 per revisi untuk status transien (W-14 dan KF): `trial-log get "/api/studio/documents/<id>/content?revision=<n>&slot=record"` (atau `dc45c/devapi.py`) untuk R7B rev6 dan rev11, R8B rev6 dan rev12, R9B rev6 dan rev8; cocokkan status laporan dan status butir dengan fakta [skenario] manifest §3.2.
3. KF penuh: pencocok token manifest §5 (normalisasi NFC, spasi diringkas, `*` `` ` `` `_` dibuang, huruf kecil) atas `r7a/r8a/r9a/laporan.md` dan isi R20 revisi akhir R7B/R8B/R9B; laporkan per fakta, termasuk token yang dibuang `HTML_INLINE`.
4. Byte yang ditulis agen per run: `python -I -c "import csv,json,sys; ..."` atas `controller_ab3/toolcalls/<run>_toolcalls.csv`, jumlahkan `len(content)` untuk `write_file` dan `len(new_string)` untuk `patch` dengan `ts_call` dalam [START harness, END].
5. Checker G_A mekanis (pola `Temp/dc47b/ga_checker.py`) atas tiga MD arm A.
6. Isi hasil `check` dari salinan `state.db` + wal + shm (`mode=ro`): `SELECT tool_call_id, substr(content,1,400) FROM messages WHERE role='tool' AND tool_call_id IN ('call_54c9842ee5d6412eae6ddef7','call_58087427d4c24bbd8c772e16','call_4810dc0817f34a74aca84d73','call_a6b0c4a92fbe43bd8342d2d9');` Harapan: VALID, 0 isu.
7. W 85 berkas: `python -I -c "import json; d=json.load(open(r'C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/contract_ab3/sessions/W_postcheck.json')); e=[x for x in d['classify']['entries'] if x.get('kelas_d442')=='touched_by_run']; print(len(e), sum('playwright_chromiumdev_profile-RaNCWy' not in x['path'] for x in e))"`. Harapan: `85 0`.
8. Isi `/tmp/r20_r7b.json` tidak dapat diperiksa (sudah dihapus). DC-47c mencatat temuan §4.5.4 sebagai keputusan USER.
9. Sesudah DC-47c: controller menyajikan NETRAL ke USER (mis. lewat AskUserQuestion: adopsi Studio sebagai indeks tanya-jawab di atas MD; atau satu siklus alat U-23/U-24 tanpa uji ulang KE-1 sebagai klaim; atau hentikan), beserta dua perbedaan vonis sensitivitas (FL_tpl, berkas `/tmp`), lalu mencatat keputusan di `decisions.md`.

## 13. Files/Modules Involved

| Berkas | Peran |
|---|---|
| `Temp/hermes_trial/contract_ab3/timing.csv` (L1-L314) | KE-1, silang KE-2, KE-3 4xx/klien, KE-4 CSV, KE-5 F_name/F_sha |
| `controller_ab3/toolcalls/<run>_toolcalls.csv` | KE-2, KE-6 FL, pecahan waktu, penyimpangan, KF sampel |
| `contract_ab3/retrieval.csv`, `controller_ab3/answers/Q_key_resolved.md` | KE-4 |
| `contract_ab3/sessions/ke3_dryrun.csv` | KE-3 stored |
| `contract_ab3/sessions/<B>_postcheck.json`, `grep_*.txt`, `*_host_pre.txt`, `*_host_post.txt`, `controller_ab3/host_whitelist.txt`, `dc45c/driver_*.log` | KE-5, konfirmasi D-456 |
| `contract_ab3/sessions/*_meta.txt`, `usage_*.json`, `*_stdout.txt`, `format_*.txt`, `docs_b.csv`, `dc45c/m_revisions.txt` | Caveat beban, token, swalapor, MU |
| `hermes_trial/06_contract_trial3_facts_manifest.md` §1.1, §5 | KE-7, delta |

## 14. Risks

| # | Risiko | Mitigasi |
|---|---|---|
| RK-1 | Berkas `/tmp` R9B dihitung, sehingga vonis menjadi TIDAK EFEKTIF | Disajikan terbuka (§4.5.4); U-24 menghilangkan penyebab |
| RK-2 | KF penuh menemukan fakta hilang di B (mis. akibat `HTML_INLINE`) | §12 butir 3; U-25 |
| RK-3 | n = 3 dan jeda awal LLM 10-27 s mendominasi T1 laporan pendek | Sensitivitas "T1 dari START Hermes" dan token sebagai pendamping |
| RK-4 | Optimasi lanjutan dibaca sebagai siklus 4 KE-1 | Batas loop D-448; perbaikan alat dicatat sebagai baris friksi, bukan klaim KE-1 tanpa keputusan |
| RK-5 | Postcheck terus menghasilkan positif palsu dari token generik | Penyaring token generik dan kriteria mentah di postcheck (baris H3 berikut, pemilik controller) |

## 15. Acceptance Criteria (DC-46c)

- [x] KE-1 (a), (b), sensitivitas 1-4, 5, dan 5b dihitung dengan baris dan rumus yang dapat diulang (§4.1).
- [x] Caveat beban wajib: tabel per run, selisih dalam pasangan, paragraf (§4.1.3).
- [x] KE-2 dan KE-6 dari tool call state.db, CSV sebagai silang; FL_tpl terpisah dan sensitivitas FL + FL_tpl (§4.2, §4.6).
- [x] KE-3 dengan G_B,klien terpisah dan sensitivitas Σ(4xx + klien) (§4.3).
- [x] KE-5 kelas D-442 + sensitivitas dua-bukti lama; D-456 dikonfirmasi dengan bukti induk proses dan waktu (§4.5).
- [x] KE-4, KE-7 (K_B pasti; KF sampel, sisanya diserahkan), MU-1/MU-2 (proksi, perintah persis) (§4.4, §4.7, §4.8, §12).
- [x] Gerbang keras dan vonis gabungan (§5).
- [x] Pecahan waktu B per fase, perbandingan tiga uji, jawaban hipotesis R3-01 (§4.1.5, §4.1.6, §7).
- [x] Umpan balik sisi menulis dari `_stdout` + `format_*.txt`, vonis Hermes, friksi ke usulan berpemilik (§8, §9).

## 16. Recommendations

1. Controller mencatat vonis NETRAL, konfirmasi D-456, dan dua perbedaan vonis sensitivitas (FL_tpl; berkas `/tmp` R9B) di `decisions.md`, lalu meluncurkan DC-47c dengan §12.
2. Sajikan ke USER tiga fakta tanpa didamaikan: (a) keandalan tetap 4/4 gerbang keras dengan 0 galat; (b) MD-native mencapai sasaran komposisi (token B/A 1,206, susun B/A 0,938); (c) waktu menulis total belum setara karena biaya tetap per langkah dan penelusuran rute (r1 1,476).
3. Rekomendasi jalan (di bawah mandat D-448, siklus KE-1 habis): adopsi Studio sebagai indeks terstruktur dan tanya-jawab di atas laporan MD (searah vonis Hermes dan KF-10), tanpa klaim "lebih hemat ditulis". Biaya tetap dan penelusuran rute diselesaikan lewat MCP-01 (U-23) dan alat pencarian pid (U-24) sebagai baris friksi. Pengukuran ulang KE-1 hanya atas keputusan USER baru.
4. Perbaiki U-25 (`HTML_INLINE`) sebelum pemakaian luas, karena ia mengubah makna isi tersimpan secara diam-diam.

## 17. Collection Log

1. Read utuh: protokol r3 (2 halaman), research/14 (2 halaman), laporan 06, toolcalls W/R7B/R7A/R8A/R8B/R9B/R9A, timing.csv, retrieval.csv, Q_key_resolved.md, docs_b.csv, m_revisions.txt, R7B_meta.txt, usage_R7B.json, stdout R7B/R8B/R9B.
2. Read bagian: decisions.md :449-462; research/11 :141-176; brief 06 :1-37; manifest 06 :228-236; masterplan/05 :1326-1339; R7B_postcheck.json :1-983, :1150-1209, :1600-1631; ke3_dryrun.csv :1-6.
3. Grep: decisions D-435..D-457; research/11 (KE-3, vonis); meta semua run (beban, wall, freeze, toolcalls); usage semua run (token, panggilan); postcheck semua run (ringkas, D_raw); host_*.txt (chrome/pid); `29980|23232|RaNCWy` di hermes_trial; grep_*.txt; driver_*.log (touched_by_run); toolcalls (`/tmp`, `--force-latest`, `--section`, `agentId:`); Q_tc perintah; M_tc agent-id; manifest 06 (§1.1, §5, style/Skyhop); `coder_execution_r3_01.md:52`.
4. Tidak ada tulisan selain berkas ini. Tidak ada tulisan ke workspace Hermes, Temp, DB, atau repo lain. Tidak ada perintah shell.
