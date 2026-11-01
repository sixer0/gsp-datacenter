---
schema_version: 1.0
task_id: doc_artifact_studio
task_row: R3-02 (D-435 decisions.md:440; D-422 :427, D-433 :438, D-434 :439; verifikasi DC-47b H-1, M-1, M-2)
date: 2026-10-31
agent: data-analyst
type: performance
confidence: MEDIUM (aturan dan prosedur diturunkan dari data uji ulang yang dibaca langsung; kandidat lembar fakta dicek Grep atas state.db dan state.db-wal profil; perilaku jalur baru arm B diselaraskan R3-04 dari laporan R3-01 dan kode `scripts/studio/studio-report.ts` (§7, §20), lalu R3-H dari laporan R3-F dan kode sesudah R3-F (§21); opsi CLI dibaca dari kode, `--help` tidak dijalankan)
inputs: decisions/decisions.md D-419..D-435 (:424-440); research/13_contract_efficiency_protocol_r2.md (utuh, termasuk §17 amandemen asal-usul); research/14_contract_efficiency_results_r2.md (utuh); verification/03_document_contract_verification_r2.md (utuh); hermes_trial/05_contract_retrial_brief.md; 05_contract_retrial_facts_manifest.md (§1-§5); 05_retrial_harness.md (utuh); 05_contract_retrial_report.md (utuh); Temp/hermes_trial/harness_ab2/ab2.py:760-856 (baca saja); Temp/dc47b/fl.py (baca saja); state.db + state.db-wal profil gsp-master01 (Grep baca saja); workspace Hermes docs/ (Glob/Grep/Read, baca saja); delegation_progress/file_claims.md:1098-1099
inherits: research/13 seluruhnya, kecuali butir yang tercantum di §4 tabel perubahan. research/11 tetap berlaku lewat research/13
plan_draft: dilewati (baris docs only; perubahan alat dimiliki R3-01 dan HARNESS3)
amended_by: R3-04 (D-436, D-437; 2026-10-31), lihat §20; R3-H (D-439..D-443; 2026-11-01), lihat §21
status: complete
---

# R3-02: Protokol uji ketiga efisiensi laporan kerja agen (arm A MD lawan arm B MD-native lewat Studio), revisi 3

> **Penanda R3-H:** §21 (2026-11-01) menggantikan sebagian §5, §6.1, §6.3, §7, §11, §13, §14, §15, dan §20 menurut keputusan D-439..D-443. Setiap bagian yang terdampak diberi penanda "R3-H". Bila teks lama bertentangan dengan §21, §21 yang berlaku. Ambang KE tidak berubah.

## 1. Source Tasks

| Sumber | Isi yang dipakai |
|---|---|
| D-435 (`decisions.md:440`) | Keputusan USER: (1) vonis uji ulang TERKUNCI NETRAL dengan aturan asal-usul (dicatat di research/13 §17); (2) Putaran 3 menyasar biaya menulis: U-15 draf MD-native dikonversi alat, U-16 pembaruan delta, U-18 `studio-report template`, lalu uji Hermes ketiga pada penyiapan terisolasi |
| D-422 (`:427`) | Ambang KE-1 dipisah: (a) median r1 <= 1,00; (b) median r2 <= 0,70 DAN maks r2 <= 1,00 |
| D-433 (`:438`) | Hasil uji ulang: KE-1 dan KE-6 gagal; akar = LLM menulis ulang draf JSON penuh tiap langkah; beban paralel di hampir semua run; anomali latensi R5A |
| D-434 (`:439`) dan verifikasi 03 | H-1 (berkas `t_aa9282e4/lapor_comment.md`), M-1 (`state.db` menyimpan tool call berwaktu; KE-2/KE-6 dihitung dari sumber sekunder), M-2 (KE-5 rentan pekerjaan paralel) |
| research/14 §9 | U-15, U-16, U-18, U-22 (a) catat tulis draf, (b) ekspor tool call, (c) cek pasca-run otomatis, (d) isolasi host |
| Laporan 05 `:3`, `:7` butir (a) | Cacat runner: cek freeze bawaan selalu gagal sehingga 9 sesi berjalan dengan `--skip-freeze-check` |
| file_claims.md:1098-1099 | R3-01 (coder): `studio-report.ts` jalur MD-native + delta + template. R3-02 (berkas ini, brief 06, lampiran research/13) |

## 2. Exploration & Collection Summary (Tier 2)

| Fakta | Bukti | Mengapa penting |
|---|---|---|
| Jalur baru arm B belum ada di kode saat R3-02 | Grep `template\|md-native\|delta` di `scripts/studio/studio-report.ts` = 0 baris (saat R3-02) | Opsi CLI persis di §7 dan brief 06 semula diberi tanda tunggu R3-01; diisi R3-04 dari laporan R3-01 dan kode (§20) |
| `state.db` profil punya tabel `messages` dengan `session_id`, `role`, `content`, `tool_call_id`, `tool_calls`, `tool_name`, `timestamp REAL`, `token_count` | Grep teks `CREATE TABLE messages` di `state.db` gsp-master01 (baca saja) | KE-2 dan KE-6 dapat dihitung dari sumber utama (M-1); ada juga token per pesan untuk pendamping KE-1 |
| Verifier sudah memakai kueri baca-saja per `session_id` atas `messages.tool_calls` | `Temp/dc47b/fl.py:3-19`; verifikasi 03 `:142` (tool call B/A 26/9, 16/12, 32/15) | Bentuk ekspor §6.2 sudah terbukti jalan |
| `mode=ro&immutable=1` tidak membaca WAL | verifikasi 03 `:87` ("mungkin karena WAL belum di-checkpoint"); `state.db-wal` profil aktif (Grep `session` = 783 baris) | Ekspor sesi run harus membaca salinan db + wal + shm, bukan mode immutable |
| Cek freeze bawaan runner membandingkan path absolut `freeze_targets()` dan menuntut 3 berkas alat; `freeze.sha256` FACTS2 berpath relatif tanpa berkas alat | `ab2.py:785-791`, `:798-834`; laporan 05 `:3`, `:7` (a) | Format freeze baku ditetapkan di §10 |
| Beban paralel di host menyentuh kedua arm: WINWORD, `gen_*.py`, dump crash node WSL, folder kartu `t_aa9282e4` | research/14 `:63`; verifikasi 03 `:86-87` | Prosedur isolasi host §5 |
| Throughput R5A 15 token/s, run lain 61-114 | research/14 `:64`, `:173` | Aturan tanda latensi §6.1 |
| Arm B menulis ulang draf penuh tiap langkah; token keluaran B/A median 3,892 | research/14 `:60`, `:171`; `format_R5B.txt:1`, `format_M.txt:2` | Larangan tulis ulang penuh di brief (tanpa menyebut ambang) |
| R6B menulis dengan `agentId` `gsp-document-writer` | research/14 `:317`; laporan 05 `:7` (c) | Brief menegaskan `agentId`; penyimpangan dilabel |
| `trial-log` menolak path relatif (`TARGET_MISSING`) | laporan 05 `:6`; research/14 `:379` | HARNESS3 menyelesaikan path relatif; brief meminta path absolut |
| Kartu lembar R-4 kini ada di `state.db` (`t_4ead3a56` 1 kemunculan) | Grep `state.db` | Lembar R-4..R-6 tercemar uji 2. Lembar baru wajib (§8) |

## 3. Overview

Pertanyaan: sesudah jalur MD-native (U-15), pembaruan delta (U-16), dan `studio-report template` (U-18), apakah laporan kerja lewat Studio (arm B) setidaknya setara MD bebas (arm A) dalam biaya menulis, sambil mempertahankan keandalan yang sudah terbukti di uji ulang (gerbang keras 4/4)?

Pemangku kepentingan: USER (keputusan adopsi; batas loop KE-1/KE-6 siklus 3 dari 3), controller (isolasi host, HARNESS3, snapshot, kunci, ekspor log sesi), Hermes `gsp-master01` (pelaku), R3-01 (CLI), FACTS3 (lembar fakta), baris uji ketiga, analisis, dan verifikasi.

Waktu: sesudah R3-01, review dan security R3, panduan, FACTS3, dan HARNESS3 selesai, lalu server dibekukan (D-435). Sembilan sesi: W, tiga pasangan, M, Q.

Metodologi: desain silang berpasangan research/13 §7 dipertahankan. Yang berubah: definisi arm B (jalur MD-native), sumber utama KE-2/KE-6 (log sesi), isolasi host, aturan asal-usul sejak awal, format freeze, dan lembar fakta. Ambang tidak berubah.

Alternatif yang ditolak:
1. Mengulang lembar R-4..R-6. Hermes sudah mengerjakannya di kedua arm, dan isinya kini ada di `state.db` (§2), jadi alasan research/13 §5.2 butir 1-4 berlaku lagi.
2. Melonggarkan ambang KE-1 karena dua siklus gagal. Tidak ada bukti baru yang membenarkannya. Ambang D-422 adalah keputusan USER.
3. Mematikan cron dan gateway Hermes demi isolasi. Itu mengubah konfigurasi Hermes yang dilarang tanpa keputusan USER. Prosedur §5 memakai penjadwalan, penundaan, dan pencatatan.

## 4. Perubahan terhadap protokol 13 (dicatat sebagai keputusan)

| ID | Butir research/13 | Perubahan | Alasan dan bukti | Jenis |
|---|---|---|---|---|
| E-01 | §6.5 pengecualian D_raw | Pengecualian (6) asal-usul (research/13 §17.1) berlaku sejak awal, dengan bukti (A) dari ekspor log sesi §6.2 dan bukti (B) dari snapshot folder aktif §5.4 | D-435; H-1 verifikasi 03 | definisi; ambang tetap |
| E-02 | §6.2 sumber N_agent | Sumber utama = tool call berwaktu `state.db` sesi run (§6.2). Baris `timing.csv` menjadi silang | M-1 verifikasi 03 `:220`; tulis draf B tidak tercatat di CSV (research/14 `:59`) | sumber; ambang tetap (advisori) |
| E-03 | §6.6 sumber FL | Sumber utama = tool call `state.db`; baris `trial-log ... format_lookup` sebagai silang. `studio-report template` dilaporkan sebagai FL_tpl terpisah, tidak masuk FL utama; sensitivitas FL + FL_tpl wajib | M-1; alasan FL_tpl di §6.4 | sumber dan definisi; ambang tetap |
| E-04 | (baru) | Isolasi host: cek pra-run, aturan tunda, beban host per run, pemantau selama run, snapshot folder aktif (§5) | M-2 verifikasi 03 `:221`; U-22d; research/14 `:63` | prosedur |
| E-05 | §7.1 alur arm B | Arm B = `studio-report template` (opsional) + laporan MD-native + `submit`; pembaruan = sunting bagian yang berubah + `update` delta. Opsi persis di §7 (diisi R3-04 dari laporan R3-01 dan kode) | D-435; U-15, U-16, U-18 | skenario |
| E-06 | §6.1 KE-1 | Ambang D-422 tetap. Batas fase arm B memakai aturan yang sama atas jalur baru. Ditambah token per segmen sebagai pendamping informatif, tanda latensi, dan sensitivitas 5 (tanpa run berhost kotor) | research/14 §16 butir 4; anomali R5A | pelaporan |
| E-07 | §5 lembar fakta | Lembar baru R-7, R-8, R-9 (§8). W dipakai ulang byte-identik. M dipakai ulang hanya bila sah (§8.6) | D-435; §2 baris terakhir | skenario |
| E-08 | Misi, folder, harness | Misi `2026-10-31_hermes-contract-ab3` (atau tanggal hari uji, §9.1); folder kerja `contract_ab3/`; controller `controller_ab3/`; harness `harness_ab3/` | D-435 | lingkungan |
| E-09 | Freeze (harness 05 §3.1) | Format freeze baku: hanya ditulis `ab3.py freeze`, path absolut, termasuk berkas alat. Cek bawaan `run-session` wajib lulus di 9 sesi (§10) | Laporan 05 `:7` (a); `ab2.py:785-834` | prosedur |
| E-10 | Brief | Pembaruan menyunting hanya bagian yang berubah (kedua arm); path absolut untuk `trial-log`; arm B wajib jalur MD-native | research/14 `:60`; laporan 05 `:6` | skenario |
| E-11 | §6.3, §6.5, §6.7, §6.8 | Cek pasca-run otomatis milik controller: draft-check atau cek konversi ulang draf B, `classify` S3/S4, R20 revisi S1/S2, SQL MU-1, checker G_A. Semuanya selesai sebelum analisis | U-22c; verifikasi 03 B1-B5 | pelaksanaan |

> **R3-H:** E-01 (arah aturan asal-usul) diganti §21.4; E-04 (isolasi) diganti §21.2; E-05 (alur arm B) diperbarui §21.6; E-06 sensitivitas 5 didefinisikan ulang §21.3; E-11 cek draf MD-native = `studio-report check` §21.5. Butir baru E-12 (penempatan galat penjaga klien di KE-3) ada di §21.7.

Ambang tidak berubah: KE-1 tetap D-422 (dipisah), KE-4 tetap C-05 (median langkah per kueri), dan KE-2, KE-3, KE-5, KE-6, KE-7, gerbang keras D-362, serta aturan vonis `11:174-180` sama dengan research/13. Satu-satunya perubahan definisi yang menyentuh hitungan ambang adalah E-03 (FL_tpl). Alasannya dicatat di §6.4, dan hasil dengan FL_tpl tetap wajib dilaporkan.

## 5. Isolasi host (prosedur controller sebelum tiap run)

> **Penanda R3-H:** §5.1 (prinsip "hanya dimulai pada host tanpa pekerjaan aktif"), kolom "Lulus bila" §5.2 sebagai syarat mulai, dan §5.3 aturan tunda DIGANTIKAN §21.2 (keputusan USER D-442: cek informatif, dicatat per run, tidak menunda). Perintah cek §5.2, snapshot §5.4, dan pencatatan §5.5 tetap berlaku sebagai pencatatan beban host; kunci meta tambahan di §21.2.

### 5.1 Prinsip

Uji ketiga hanya dimulai pada host tanpa pekerjaan aktif lain di workspace Hermes, folder kanban, dan `%TEMP%`. Controller tidak mengubah konfigurasi, cron, atau profil Hermes. Isolasi dicapai lewat cek, penundaan, dan pencatatan. Mematikan cron atau gateway hanya boleh atas keputusan USER yang tercatat.

### 5.2 Cek pra-run

Cek dijalankan sesudah cek freeze dan sebelum `snapshot pre`. Keluaran disimpan ke `contract_ab3/sessions/<run>_host_pre.txt`.

| # | Cek | Perintah (Git Bash, kecuali ditandai PS = PowerShell) | Lulus bila |
|---|---|---|---|
| H-1 | Proses yang dapat menulis ke workspace atau Temp | PS: `Get-CimInstance Win32_Process \| Where-Object { $_.Name -match '^(hermes\|python\|pythonw\|node\|bash\|WINWORD\|EXCEL\|POWERPNT\|chrome\|msedge\|wsl\|wslhost)(\.exe)?$' } \| Select-Object ProcessId,ParentProcessId,Name,CreationDate,CommandLine \| Format-List` | Tidak ada `hermes.exe`; tidak ada proses lain di luar daftar putih controller (`controller_ab3/host_whitelist.txt`: PID server DEV :9021, sesi Claude Code controller, dan shell controller, dicatat sebelum run W) |
| H-2 | Kartu kanban yang sedang berjalan | Baca-saja atas DB kanban Hermes (path dan nama tabel ditetapkan controller dari `.tables`/`.schema` sebelum run W lalu dicatat; path diduga di bawah `C:/Users/TRIAL/AppData/Local/hermes/kanban/`, hipotesis). Contoh: `sqlite3 "file:<kanban.db>?mode=ro" "<kueri status running>"` | 0 kartu berstatus running |
| H-3 | Aktivitas folder kerja kanban | `find C:/Users/TRIAL/AppData/Local/hermes/kanban/workspaces -type f -newermt '-15 minutes' 2>/dev/null \| wc -l` | 0 |
| H-4 | Aktivitas `%TEMP%` | `find C:/Users/TRIAL/AppData/Local/Temp -type f -newermt '-15 minutes' -not -path '*/hermes_trial/*' -not -path '*/tsx-TRIAL/*' -not -path '*/claude/*' 2>/dev/null \| tee -a <host_pre> \| wc -l` | 0, atau hanya berkas milik controller yang tercatat |
| H-5 | Aktivitas workspace Hermes | `find C:/Users/TRIAL/workspace/gsp-hermes/workspace -type f -newermt '-15 minutes' 2>/dev/null \| wc -l` | 0 |
| H-6 | Jadwal cron Hermes | Controller membaca daftar job secara baca-saja (sintaks CLI dicek lebih dulu; laporan kesehatan fleet menyebut "Cron list" `sysman-gateway-monitor`, `docs/2026-10-11_fleet-health-pagi/report.md:16`) dan mencatat job yang jatuh tempo dalam 30 menit | Tidak ada job yang jatuh tempo di dalam perkiraan jendela run (W sekitar 5 menit, R 5-15 menit, Q sekitar 6 menit) |
| H-7 | WSL dan dump crash | `wsl.exe -l -v`; `find C:/Users/TRIAL/AppData/Local/Temp/wsl-crashes -newermt '-60 minutes' 2>/dev/null` | Tidak ada distro yang berjalan di luar daftar putih; tidak ada dump baru |
| H-8 | Beban host | PS: `Get-Counter '\Processor(_Total)\% Processor Time','\PhysicalDisk(_Total)\% Disk Time' -SampleInterval 2 -MaxSamples 5`; `Get-CimInstance Win32_OperatingSystem \| Select-Object FreePhysicalMemory,TotalVisibleMemorySize`; `Get-Process \| Sort-Object CPU -Descending \| Select-Object -First 10 Name,Id,CPU,WS` | Rata-rata CPU < 30% dan disk < 50% selama 10 s. Angka ini ambang prosedur, bukan ambang metrik. Controller boleh mengubahnya sebelum run W dengan alasan tercatat |
| H-9 | Agen controller lain | Daftar dispatch controller | Tidak ada sub-agen lain (verifier, coder) yang berjalan selama jendela run, termasuk tulisan ke folder kerja seperti `Temp/dc47b/` |

### 5.3 Aturan tunda

- Bila satu cek gagal, run ditunda. Controller menunggu 5 menit lalu mengulang seluruh §5.2, maksimal 6 kali (30 menit).
- Sesudah 6 kali gagal, controller tidak memulai run. Controller mengembalikan `needs-review` dengan isi `<run>_host_pre.txt` untuk diputuskan USER (lanjut dengan label, hentikan pekerjaan lain, atau jadwal ulang).
- Run yang dimulai atas keputusan USER pada host yang tidak bersih diberi label `host_bersih=tidak` di meta. Run itu tetap dinilai, lalu dilaporkan di sensitivitas 5 (§6.1).
- Penundaan, alasan, dan jam dicatat di `controller_ab3/host_log.md`.

### 5.4 Snapshot penanda folder aktif

Dijalankan tepat sebelum `snapshot pre`, untuk S3 dan S4. Keluaran ke `contract_ab3/sessions/<run>_active_dirs_pre.txt`, satu baris per folder: `folder<TAB>mtime_terbaru_utc<TAB>jumlah_berkas_60_menit`.

```bash
find C:/Users/TRIAL/AppData/Local/Temp C:/Users/TRIAL/workspace/gsp-hermes/workspace \
  -type f -newermt '-60 minutes' -not -path '*/hermes_trial/*' -not -path '*/tsx-TRIAL/*' \
  -printf '%h\t%TY-%Tm-%TdT%TH:%TM:%TS\n' 2>/dev/null \
  | sort | awk -F'\t' '{n[$1]++; if ($2>m[$1]) m[$1]=$2} END {for (d in n) print d"\t"m[d]"\t"n[d]}' | sort
```

Pakai pasca-run: setiap berkas baru di S3/S4 yang folder induknya tercantum di daftar ini diberi tanda `folder_aktif_pra=1` di diff. Tanda ini memenuhi bukti (B) pengecualian (6). Bukti (A) dari ekspor log sesi tetap wajib (research/13 §17.1).

### 5.5 Beban host per run

- `<run>_host_pre.txt` (§5.2) dan `<run>_host_post.txt` (H-1, H-4, H-5, H-8 diulang sesudah `snapshot post`).
- Selama run, HARNESS3 menulis `<run>_host_during.csv` setiap 30 s dengan kolom `t_utc,cpu_pct,disk_pct,free_mem_mb,n_proc_luar_whitelist,n_berkas_baru_temp,n_berkas_baru_workspace`. Pemantau hanya menghitung dan tidak membaca isi berkas.
- Meta run menambah kunci `host_bersih`, `host_cpu_rerata_selama`, dan `tunda_kali`.

## 6. Metrik (hanya bagian yang berubah atau diperjelas; sisanya research/13 §6)

### 6.1 KE-1 Waktu

- Rumus, segmen T1/T2, dan ambang D-422 sama dengan research/13 §6.1.
- Batas fase arm B pada jalur baru:

| Fase | Isi | Akhir fase |
|---|---|---|
| S1 | `studio-report template` (opsional) + menulis laporan MD-native + `submit` | `t_end_utc` baris `api` kiriman 2xx terakhir pemanggilan `submit` ber-`step_id=S1` (aturan research/13 §6.1); baris kiriman ber-`note` `blok <i> <bagian>` (`studio-report.ts:832`). `template` tidak menulis baris timing (menolak `--timing`/`--step`, keluar 2; `studio-report.ts:610-614`); pemanggilannya hanya tampak di log sesi dan berada di dalam T1 bila dijalankan sebelum `submit` (R3-04, §20 T-1) |
| S2, S3 | Menyunting bagian yang berubah + `update` delta | Kiriman 2xx terakhir pemanggilan `update` ber-`step_id=S2`/`S3`. Bila `update` tidak mengirim blok karena tidak ada perubahan, dipakai baris `basis` (`GET /api/studio/documents/{id}/content`, `note=basis`, `studio-report.ts:945`) dan hal itu dicatat |

> **R3-H:** S1 kini memuat `check` sebelum `submit` (juga tanpa baris timing, di dalam T1); baris `basis` pada `update` ber-`note` `basis` atau `basis rev<n>` (`studio-report.ts:1216-1217`). Alur lengkap §21.6.

- Pendamping informatif (tidak menentukan vonis), per run dan per segmen:
  - Token keluaran `usage_<run>.json` per sesi (seperti research/14 §4.1.6).
  - Token per segmen = jumlah `token_count` pesan `role=assistant` di `state.db` dengan `timestamp` di dalam T1 atau T2. Bila kolom kosong, ditulis TIDAK-TERSEDIA.
  - Rasio token B/A per pasangan.
- Tanda latensi: throughput token keluaran per `wall_s` dihitung per run. Run dengan throughput < 0,5 x median run lain diberi tanda `latensi_anomali` (preseden R5A 15 token/s). Run tidak dibuang dan tidak diulang tanpa keputusan tercatat (`11:331`). Sensitivitas tanpa pasangan bertanda dilaporkan.
- Sensitivitas wajib 1-4 research/13 §6.1 tetap. Ditambah sensitivitas 5: KE-1 tanpa pasangan yang salah satu run-nya `host_bersih=tidak` atau `latensi_anomali`.

> **R3-H:** sensitivitas 5 didefinisikan ulang dan caveat beban host menjadi wajib di analisis (§21.3).

### 6.2 KE-2 Jumlah langkah (advisori): sumber utama log sesi

Ekspor (milik controller, dijalankan sesudah sesi Hermes selesai dan sebelum run berikut):
1. Salin `state.db`, `state.db-wal`, dan `state.db-shm` profil gsp-master01 ke `controller_ab3/statedb_tmp/<run>/`. Salinan dibuka baca-saja (`mode=ro`, bukan `immutable`), supaya baris sesi yang masih di WAL ikut terbaca.
2. Ekspor baris sesi `hermes_session_id` run ke `controller_ab3/toolcalls/<run>_toolcalls.csv` (RFC 4180). Kolom: `msg_id,role,ts_call,tool_call_id,function_name,arguments,ts_result,result_len,token_count`.
   - `ts_call` = `timestamp` pesan assistant yang memuat tool call.
   - `ts_result` = `timestamp` pesan `role=tool` dengan `tool_call_id` yang sama.
   - `arguments` disensor `[REDACTED]` bila memuat nilai rahasia (fungsi sensor harness).
   - Isi hasil tool tidak disalin; hanya panjangnya.
3. Hapus salinan `statedb_tmp/<run>/` sesudah ekspor terverifikasi (jumlah pesan sesi dicatat di meta, `toolcalls_n_msg`, `toolcalls_n_call`).

Aturan hitung:
- `N_agent` = jumlah tool call dengan `ts_call` di [START harness, END]. END = `t_end_utc` penanda `trial-log mark END` di `timing.csv`.
- Satu tool call = 1, termasuk baca berkas, tulis berkas, dan perintah terminal berantai.
- Tidak dihitung: tool call yang seluruh isinya hanya `trial-log mark`, `qmark`, atau `answer` (padanan `act=0`).
- Tulis atau sunting draf arm B kini terhitung (menutup U-22a dan research/14 `:59`).
- Silang: N dari `timing.csv` dengan aturan research/13 §6.2. Selisih dilaporkan per run, tidak dikoreksi.
- Bila ekspor gagal atau sesi tidak ditemukan, dipakai aturan CSV research/13 §6.2 dengan tanda `sumber=csv`.
- Ambang tetap `median(s_i) <= 1,00`, advisori (`11:92`).

### 6.3 KE-5 Jejak disk

> **Penanda R3-H:** dua butir di bawah DIGANTIKAN: (1) cek draf MD-native dan cek pasca-run HS-8 `update ... --json` diganti `studio-report check` (§21.5; D-441); (2) pengecualian (6) asal-usul diganti aturan D-442 "hanya berkas yang terbukti disentuh run lewat log sesi" (§21.4); aturan lama menjadi sensitivitas wajib.

- Cakupan S1-S4, pola Grep, dan pengecualian (1)-(5) sama dengan research/13 §6.5, dengan path ab3 (S1 = folder misi ab3; S2 = `Temp/hermes_trial/` termasuk `contract_ab3/`).
- Pengecualian (1) disesuaikan untuk jalur MD-native: laporan MD-native di folder run arm B adalah **draf sah** bila (a) lolos cek draf alat pasca-run, dan (b) isinya terkirim (baris `api` 2xx pemanggilan terakhir). Salinan MD laporan lain di S1-S4 tetap dihitung lewat butir (c) `D_raw,B`.
  - Cek draf untuk laporan MD-native (R3-04): draft-check tidak menerima MD-native dan `studio-report` tidak punya mode kering (§20 T-4). Konversi dan cek lokal hanya berjalan di dalam `submit`/`update` sebelum kiriman pertama (galat keluar 1, 0 kiriman; `studio-report.ts:1130-1140`).
  - Cek pasca-run yang diusulkan (HS-8, dikonfirmasi controller): `studio-report update <documentId> <laporan.md> --json` tanpa `--timing`, atas server beku. Lulus bila keluar 0, `format` = `md`, dan `delta.sent` kosong (laporan di disk sama dengan revisi tersimpan). Efek samping: GET R20, GET R15, render R17, unduh dan HEAD R10; revisi tidak bertambah (laporan R3-01 `:51`).
- Pengecualian (6) asal-usul: research/13 §17.1.
  - Bukti (A) diambil dari `<run>_toolcalls.csv` (kata cari = basename, folder induk, cardId berkas).
  - Bukti (B) diambil dari `<run>_active_dirs_pre.txt` dan snapshot.
  - Setiap berkas `asal_luar` didaftar di analisis beserta kedua bukti, lalu dicek ulang verifier.
- Cache tsx: wajib dipanaskan ulang sesudah R3-01 dibekukan, karena sumber CLI berubah (langkah 0 harness 05 §3.2). Satu pemanggilan `--help` sudah memuat seluruh graf impor (impor statis `studio-report.ts:46-64`, termasuk `services/draft/md-report`); `template --mission <misi> --doc-key lapkerja-w` boleh ikut dipanaskan karena tidak memerlukan server, rahasia, atau berkas (`studio-report.ts:1320-1324`).
- Ambang tetap: `D_raw,B = 0` (KERAS), `F_name = F_sha = 100%`.

### 6.4 KE-6 Beban pikir format

- FD dan ambang tetap (`11:159`).
- FL utama dihitung dari tool call `<run>_toolcalls.csv` dalam [START harness, END]. Polanya:
  - Pola dasar (sama dengan `Temp/dc47b/fl.py:5`): `STUDIO-AGENT-GUIDE|STUDIO-API-REF|/api/studio/registry|registry\?kind|--help`.
  - Ditambah bacaan laporan lama untuk meniru bentuk, yaitu folder misi ab, ab2, atau ab3 milik run lain yang bukan rujukan isi (diajudikasi manual).
  - Silang: baris `trial-log ... format_lookup`.
- **FL_tpl**: pemanggilan `studio-report template` dilaporkan terpisah dan tidak masuk FL utama. Alasannya:
  1. `template` menghasilkan kerangka kerja draf itu sendiri, padanan arm A membuka berkas MD baru. Bacaannya tidak dipakai untuk mempelajari aturan bentuk.
  2. U-18 dibuat untuk menggantikan bacaan panduan dan registri (research/14 §9 U-18). Bila `template` dihitung, FL_B >= 1 di setiap run, sedangkan FL_A = 0, sehingga komponen FL tidak dapat lulus untuk alat apa pun dan tidak lagi membedakan apa pun.
  3. Alternatif yang ditolak: menghitung `template` sebagai FL. Akibatnya setiap kerangka yang disediakan alat menjadi bacaan format.
- Hasil KE-6 wajib dilaporkan dua kali: FL utama (vonis) dan FL utama + FL_tpl (sensitivitas). Bila keduanya berbeda vonis, perbedaan itu disajikan ke USER apa adanya.

### 6.5 KE-3, KE-4, KE-7, MU-1/MU-2

> **R3-H:** penempatan galat penjaga klien (`BASE_CONFLICT`, `BASIS_MISSING`, dan kerabatnya) serta galat konversi lokal di KE-3 ditetapkan di §21.7.

Rumus dan ambang sama dengan research/13 §6.3, §6.4, §6.7, dan §6.8, dengan nama run R7..R9. Pelaksanaan pasca-run otomatis (E-11):
- Dry-run R08 atas R20 `shape=submission` dikerjakan sesudah R9A, sebelum Q. Isi tersimpan di server tetap JSON kontrak, sehingga jalur MD-native tidak mengubah prosedur ini.
- R20 per revisi akhir S1 dan S2 untuk fakta status transien dikerjakan langsung sesudah tiap run B.
- SQL MU-1 baca-saja dijalankan sesudah M.
- Checker G_A mekanis (pola `Temp/dc47b/ga_checker.py`) dijalankan atas 3 MD arm A.

## 7. Arm B jalur baru (R3-01, diselaraskan R3-04)

> **Penanda R3-H:** kolom ketiga tabel ini mencerminkan R3-01 (sebelum R3-F). Perilaku yang berubah sesudah R3-F (D-439, D-440, D-441, D-443) berlaku menurut §21.6: placeholder `<isi: ...>` di templat (`TEMPLATE_PLACEHOLDER`), baris `basis:` wajib untuk `update` (`BASIS_MISSING`, `BASE_CONFLICT`, `--base-rev`, `--force-latest`), `## Rujukan` -> `record.refs`, `Initiator`/`Pemberi tugas` -> `initiator`, `--agent-id` menang atas `agentId:` kepala, `RECORD_FIELDS_DROPPED`, dan perintah `check`. Bila bertentangan, §21.6 yang berlaku.

Perilaku yang diharapkan dari D-435 dan usulan research/14 §9. Kolom ketiga diisi R3-04 dari laporan R3-01 (`delegation_progress/coder_execution_r3_01.md`) dan kode (baca saja). Path kode relatif repo; `studio-report.ts` = `scripts/studio/studio-report.ts`, `md-report.ts` = `src/lib/studio/services/draft/md-report.ts`, `contracts.ts` = `src/lib/studio/registry/contracts.ts`, `index.ts` = `src/lib/studio/services/import/contract/index.ts`.

| Unsur | Perilaku yang diharapkan | Perilaku nyata R3-01 (diisi R3-04; sumber) |
|---|---|---|
| `studio-report template` | Mencetak kerangka laporan MD-native siap isi untuk misi dan `docKey` yang diberikan, dengan kunci contoh sudah diganti, sehingga sesi baru tidak perlu membuka panduan atau registri (U-18) | Opsi persis `template [--mission <folder>] [--doc-key <kunci>] [--format md\|json]`, ditambah `--json` umum (`studio-report.ts:6`, `:73`). Tidak ada `--agent-id`: `--remote`, `--agent-id`, `--section`, `--out`, `--timing`, `--step`, `--require-complete`, `--allow-example` ditolak keluar 2 (`:610-614`). Keluaran hanya stdout; tanpa server, rahasia, maupun berkas (`:1320-1324`). TIDAK menulis baris timing (FL_tpl hanya dari log sesi, §6.4; §20 T-1). Isi md: `# judul`, `mission:`, `docKey:`, `Status`/`Verdict`/`Owner`/`TaskRef`/`ReportedAt`/`CardIds` dari contoh registri, lima judul `##` outline dengan contoh baris singkat, tabel butir di bab 2 berkolom `key, judul, status, owner, fase, dep, bukti`; tanpa baris `agentId` dan tanpa ID nyata (`md-report.ts:299-346`). Tanpa `--mission`/`--doc-key`, target = contoh registri, lalu `EXAMPLE_TARGET` keluar 2 saat dikirim apa adanya (D-427; laporan R3-01 `:46`, `:70`) |
| Laporan MD-native | Agen menulis kepala ringkas kunci-nilai + prosa MD berjudul bab; CLI mengonversi ke slot `record` dan `studio.chapter/v2` di memori. Agen tidak menulis JSON blok (U-15) | **Kepala** = frontmatter atau baris `Kunci: nilai` sebelum `##` pertama dalam 40 baris pertama, di luar pagar kode; kunci tidak peka huruf (`studio-report.ts:83`; `services/import/contract/parse.ts:18`; `md-report.ts:105-131`). Kunci alat (tidak masuk isi): `mission`\|`misi`, `docKey`, `agentId`; kepala draf `tujuan`, `langkah-berikut`, `basis` dibuang (`md-report.ts:26-35`). Kunci record yang dikenali (alias registri menang bila bentrok): status <- `status`; verdict <- `verdict`, `vonis`; owner <- `owner`, `penanggung jawab`, `agent`, `profil`, `writer`; taskRef <- `taskref`, `rujukan tugas`, `row`, `task_id`; reportedAt <- `reportedat`, `waktu lapor`, `date`, `tanggal`, `created`; cardIds <- `cardids`, `kartu` (`md-report.ts:23`, `:52-58`; `contracts.ts:127-140`, `:444-454`). Kunci lain, termasuk `initiator`, `due`, `phase`, menghasilkan CW `CONTRACT_FIELD_UNMAPPED` dan nilainya disimpan sebagai teks di bab 1 (`index.ts:481`, `:491`; §20 T-3). Status wajib: `draft`, `complete`, `partial`, `blocked`, `needs-review`, ditambah alias `completed`, `working-draft`, `partial-handoff`, `perlu_revisi` (`contracts.ts:143-153`); ReportedAt wajib `YYYY-MM-DD` atau `YYYY-MM-DDTHH:MM+07:00` (`studio-report.ts:86`). **Judul bab** `##` (huruf kecil, nomor depan diabaikan): judul outline atau `outlineKey` (bab 1 Ringkasan/ringkasan, bab 2 Rincian kerja/rincian, bab 3 Bukti/bukti, bab 4 Isu terbuka/isu, bab 5 Langkah berikut/lanjut) ditambah alias registri (`contracts.ts:54-108`, `:400-406`); `Referensi` menjadi slot `references`, satu entri sourceRegister per baris (teks sitasi + url) (`index.ts:323-347`); judul lain menjadi bab tambahan 6, 7, ... dengan CW `CONTRACT_HEADING_UNMAPPED` (`index.ts:528`). Satu `##` = satu section; `###` = paragraf subjudul; tabel tetap di teks bab (laporan R3-01 `:65`). **Butir kerja HANYA dari tabel** berkolom `key`\|`id`\|`kartu` + `status` (opsional `judul`, `owner`, `fase`, `dep`, `bukti`); daftar tidak dibaca sebagai butir; id `t_xxxxxxxx` ikut masuk `cardIds`; kolom `bukti` menjadi evidence jenis file (`studio-report.ts:88-89`; laporan R3-01 `:64`; D-436). **Rujukan `refs`** antar-dokumen tidak dapat ditulis lewat MD (§20 T-2). Bab wajib kosong dicetak dan dokumen INCOMPLETE. **Galat konversi** (semua keluar 1, 0 kiriman, `step` = `konversi MD`): `MD2CONTRACT_REQUIRED_MISSING` (status/ReportedAt hilang atau tanpa alias; `details.missing`), `MD_REPORT_TARGET_MISSING` (submit tanpa misi/docKey), `MD_REPORT_INVALID`, `MD_REPORT_TOO_LARGE` (`md-report.ts:37`, `:176-208`; `studio-report.ts:718-722`). Status tanpa alias: CW `CONTRACT_STATUS_UNMAPPED` dicetak, keluar 1, 0 permintaan (laporan R3-01 `:44`) |
| `submit <laporan.md>` | Membuat dokumen dari laporan MD-native, lalu kelengkapan, render, unduh ke memori, sha, verify (perilaku r2) | Cek lokal konversi BERJALAN sebelum kiriman pertama. Urutannya: baca berkas, deteksi format, konversi MD ke draf json di memori, cek lokal (batas C54 + `checkDraftLocal` yang sama dengan draft-check), penjaga `EXAMPLE_TARGET`, lalu kirim (`studio-report.ts:1120-1141`). Galat cek lokal atas hasil konversi diberi awalan "hasil konversi laporan MD tidak lolos cek lokal", keluar 1 (`:1136`). Opsi baru: `--format md\|json` (bawaan deteksi otomatis: ada blok ```json ber-`$schema` studio.* = json, selain itu md; `:689-691`), `--mission`, `--doc-key` (menimpa kepala; `md-report.ts:181-182`). `--section` pada submit keluar 2 (`:624`). `agentId:` di kepala mengalahkan `--agent-id` (`services/draft/check.ts:139-145`; §20 T-5). Tidak ada kode keluar baru: 0 sukses, 1 galat isi (termasuk konversi), 2 lingkungan/pemakaian (termasuk `EXAMPLE_TARGET`, `SECTION_UNKNOWN`), 3 INCOMPLETE dengan `--require-complete` (`:36-39`, `:135-138`). Hasil `--json` menambah `format`, `conversion` (`parts`, `warnings`, `dropped`, `missingChapters`), dan `delta` (`:674-679`) |
| `update <documentId> <laporan.md>` delta | Mengirim hanya bagian yang berubah dibanding revisi tersimpan (U-16) | **Dasar pembanding** = SATU `GET` R20 penuh (isi + `revisionNo`; `note=basis`), bukan `shape=submission` per bagian dan bukan berkas basis lokal (`studio-report.ts:943-949`; keputusan agen diterima D-436). Per blok: `baseRevisionNo` diisi otomatis; isi sama dengan basis = tidak dikirim (`unchanged`); berbeda = POST (`:957-977`). Tanpa perubahan: 0 POST, tetapi R15, render R17, unduh, dan verify tetap berjalan bila COMPLETE (`:1141-1166`; laporan R3-01 `:51`). **Judul/meta**: update MD tidak mengirim `meta`/`template` record, sehingga judul tidak dapat diubah lewat update dan 409 META_CONFLICT judul basi tidak terjadi (`md-report.ts:220`; uji `tests/unit/studio/draft/r3cli-md-native.test.ts:261`); `mission`/`docKey` kepala diabaikan karena target = `documentId` (`md-report.ts:212`); `--mission`/`--doc-key` pada update keluar 2 (`studio-report.ts:622-623`). Blok `studio.doc/v2` menghasilkan `UPDATE_DOC_BLOCK_UNSUPPORTED` keluar 1 (`:954-956`). Bagian yang dihapus dari MD tidak dihapus di server (laporan R3-01 `:69`). **Opsi pembatas**: `--section record\|references\|<kunci bab>` (juga `bab3`, `bab-3`; beberapa dipisah koma) memaksa kirim bagian terpilih walau sama (server menjawab unchanged); tidak cocok = `SECTION_UNKNOWN` keluar 2 tanpa kiriman (`:920-941`, `:963-968`). Keluaran manusia `dikirim: ...` dan `tidak berubah: ...`; `--json` `delta.sent`/`unchanged`/`excluded` (`:1168-1175`, `:1245-1249`) |
| Timing | Satu baris `api` per HTTP + satu baris `tool` per pemanggilan, identitas dari `STUDIO_TIMING_*` (perilaku r2) | Dikonfirmasi tidak berubah untuk `submit`/`update`: header 20 kolom (`studio-report.ts:142-163`); satu baris `api` per HTTP, `action` = `<METODE> <rute>`, `note`: `blok <i> <bagian>` (POST, mis. `blok 4 bab 3`), `basis` (R20 pada update), `kelengkapan`, `render`, `unduh`, `verify` (`:409-438`, `:832`, `:945`, `:1005`, `:1017`, `:1025`, `:1144`); baris `edit` `save` untuk `--out` (`:1067`); satu baris `tool` per pemanggilan: `action` `studio-report submit` atau `studio-report update`, `target` = documentId (atau nama berkas bila gagal sebelum ada dokumen), `note` = nama berkas laporan, `ok`/`err_code` (`:1202-1203`). Baris ditulis sekali di akhir, juga saat gagal (galat konversi = hanya baris `tool` `ok=0` dengan `err_code` = kode); galat sebelum berkas timing dibuka (rahasia, URL, argumen) tidak menulis baris (`:1110-1121`). Identitas dari `STUDIO_TIMING_RUN_ID`, `STUDIO_TIMING_ARM` (bawaan B), `STUDIO_TIMING_REPORT_ID`, `STUDIO_TIMING_ORDER`, `STUDIO_TIMING_SESSION_ID`; `step_id` = `--step` atau nama perintah (`:1090-1103`). Tidak ada label `note` khusus delta; bagian yang dilewati tidak menghasilkan baris. `template` tidak menulis baris (§20 T-1) |
| Draft-check | Tetap tersedia untuk draf JSON | draft-check TIDAK menerima laporan MD-native: Grep `md-report\|mdReport\|--format\|MD-native` di `scripts/studio/draft-check.ts` = 0. Untuk MD, konversi dan `checkDraftLocal` yang sama berjalan di dalam `submit`/`update`; cek pasca-run memakai §6.3 (§20 T-4) |

Aturan arm: arm B wajib memakai jalur MD-native. Pemakaian draf blok JSON atau API langsung dicatat sebagai penyimpangan di `format_<run>.txt`. Run tetap dinilai dengan tanda, karena yang diuji D-435 adalah jalur MD-native.

## 8. Bias belajar: lembar fakta baru R-7..R-9

### 8.1 Keputusan

Uji ketiga memakai **lembar fakta baru dari 3 laporan kerja nyata Hermes lain** (R-7, R-8, R-9). Alasannya sama dengan research/13 §5.2, ditambah satu bukti baru: Hermes sudah mengerjakan R-4..R-6 di kedua arm pada uji 2, dan kartu lembar itu kini muncul di `state.db` (`t_4ead3a56`, §2). W dipakai ulang byte-identik. M mengikuti §8.6.

### 8.2 Kriteria (research/13 §5.3 dengan penyesuaian)

1. Laporan kerja nyata di `C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/`, bukan folder `backup*`, bukan uji asap, bertanggal sebelum 2026-10-31.
2. Bukan misi uji 1 atau uji 2: `2026-10-04-prompt-manual`, `2026-10-12-game-success-formula`, `2026-10-10-tracero-dispatcher-1010`, `2026-10-31_hermes-contract-ab`, `2026-10-31_hermes-contract-ab2`, serta misi sumber R-4..R-6 (`2026-10-13_serah-terima-asignor`, `2026-10-12-blender-mcp-expert-skill`, `2026-10-28_webui-mission-control-1028`). Alur cerita juga tidak boleh sama dengan R-1..R-6, sehingga `2026-10-29_webui-mc-gen2-1101` (lanjutan WEBUI-MC) dan `2026-10-06-prompt-manual-v2` (lanjutan prompt-manual) ditolak.
3. Peran setara: pelaksana pendek; verifier sedang dengan CHECK + VERDICT; laporan panjang dengan banyak kartu dan dua penanda status.
4. Pita panjang sekitar 50, 80, dan 250 baris.
5. Ada cardId berpola, owner yang dapat dipetakan, istilah unik untuk Q3, dan nilai bukti sha16 untuk Q5.
6. Owner ketiga laporan wajib berbeda satu sama lain (agar kunci Q4 tunggal) dan sebaiknya berbeda dari slot lama.
7. **0 kemunculan di `state.db` dan `state.db-wal` profil gsp-master01** untuk basename berkas (atau path berkualifikasi misi bila basename umum) dan cardId utama laporan. Kemunculan cardId sekunder dan nama misi dicatat sebagai informasi risiko (pola RK-F1 manifest 05). Bila nilainya setara, dipilih kandidat dengan kemunculan sekunder 0.

### 8.3 Kandidat utama (baca saja; Grep `state.db` dan `state.db-wal`)

Path relatif `C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/`.

| Slot | Path | Kepala, owner, kartu | Baris | Ciri yang menguji | Kriteria 7 (utama / sekunder / tingkat misi) |
|---|---|---|---|---|---|
| R-7 (pelaksana pendek; padanan R-1/R-4) | `2026-10-08_vctl-1007-lib2/lib/LAPORAN-LIB2.md` | Frontmatter `:1-8`; `author_profile: gsp-librarian` `:4`; `status: complete` `:5`; `task_ref: t_469ed5fe (induk t_e396fce0)` `:6` | 61 | Tabel vonis tiga objek dengan iterasi 1/1/2 (`:16-20`); commit `c42ba95`, `257a003`, `299f39b` (`:22`); pin sha16 `b860153546765629`, `4cf5216f5953937b`, `5a3299573e481323`, `b7966d276136ce74` (`:34`) sebagai target Q5; postproof PASS 15/15 (`:51`); keputusan KD-2 (`:47-49`) | `LAPORAN-LIB2` 0, `t_469ed5fe` 0 / `t_e396fce0` 1 / `VCTL-1007\|vctl-1007` 124 |
| R-8 (verifier sedang; padanan R-2/R-5) | `2026-10-15_smart-deck-htmlpdf/verification/laporan-verifikasi.md` | Kepala daftar kv tanpa STATUS di kepala (`:3-7`); verifier `gsp-thinker` peran gsp-verifier (`:3`); kartu `t_b2945d79` (`:1`); tanggal 2026-10-15 (`:4`) | 62 | Tabel vonis 9 gerbang (`:11-21`); CHECK 1-18 campur PASS/FAIL/CATATAN (`:27-44`); `VERDICT: FAIL` (`:23`, `:60`); `STATUS: needs-review` di akhir (`:62`); dua putusan P-1/P-2 (`:55-56`); pin sha16 `39c4b3bff2aabc7f`, `5c0134edf6d3824b` (`:5`) | path `smart-deck-htmlpdf/verification/laporan-verifikasi` 0, `t_b2945d79` 0 / tidak ada kartu sekunder / `smart-deck-htmlpdf\|DECK-HTMLPDF` 12 |
| R-9 (panjang, banyak kartu, dua penanda status; padanan R-3/R-6) | `2026-10-10-rafif-revb-1010/verification/CSIGN-REVB-v22/laporan.md` | Frontmatter `:1-9`; `author_profile: gsp-worker (peran: gsp-verifier)` `:4`; `status: complete` `:5`; `task_ref: t_0053d245` `:6` | 286 | Kartu lain `t_03e9621d`, `t_3c8be3eb`, `t_8da0412d` (`:7`, `:16`); penanda status kedua "VONIS RATIFIKASI: PASS (sebagai REKOMENDASI)", ratifikasi wewenang USER (`:21-22`, `:252-257`); seed 5012 (`:24`); pin sha16 empat byte FINAL (`:37-40`, `:255`); CHECK per butir dan VERDICT (`:249`, `:275`) | path `CSIGN-REVB-v22` 0, `t_0053d245` 0 / tiga kartu sekunder 0 / `rafif-revb-1010\|RAFIF-REVB` 295 |

Ketiga owner berbeda (gsp-librarian, gsp-thinker, gsp-worker), sehingga Q4 owner `gsp-thinker` hanya menunjuk R-8. Bentuk kepala: frontmatter (R-7, R-9) dan daftar kv tanpa STATUS di kepala (R-8). Ragam "kv satu baris" hilang karena semua kandidat berkepala kv satu baris yang diperiksa gagal kriteria 7 (§8.5). FACTS3 mencatat ini sebagai penyimpangan K4/kriteria 3. Owner R-8 sama dengan R-5 dan owner R-9 sama dengan R-6 (kriteria 6 bagian "sebaiknya"). Alasannya, hampir semua laporan verifier di workspace ditulis gsp-thinker, dan kandidat panjang lain gagal kriteria 7.

### 8.4 Cadangan

| Slot | Path | Owner, kartu | Baris | Kriteria 7 | Catatan |
|---|---|---|---|---|---|
| R-7 | `2026-10-23_vsv-post2-kurasi/laporan-kurasi.md` | `gsp-librarian`, `t_68512e06` | 66 | `laporan-kurasi` 0, `t_68512e06` 0 / `t_c25f9f38` 1 | Owner sama dengan M (§8.6); kepala belum dibaca utuh, perlu dicek FACTS3 |
| R-8 | `2026-10-11-korpus-lanjutan-1011/verification/CS-RR3-CHAIN.md` | `gsp-thinker`, `t_4b4069db` | 66 | `CS-RR3-CHAIN` 0, `t_4b4069db` 0 / `t_6145749f`, `t_fda23cbb` 0 | Risiko: tenant `KORPUS-LANJUTAN-1011` muncul sebagai token R4-F18 di lembar uji 2 (manifest 05 `:116`), dan `source_refs: [R-1, R-2, R-3, R-4]` (`:7`) bentrok dengan penamaan lembar. Dipakai hanya bila R-8 utama gagal |
| R-9 | `2026-10-27-analisa-penawaran-heimdall/output/LAPORAN-ANALISA-HEIMDALL.md` | `gsp-worker` peran document-writer (`:5`), `t_65167b7b` (`:4`) | 394 | `LAPORAN-ANALISA-HEIMDALL` 0, `t_65167b7b` 0 / `t_095fc748` 1 / misi 5 | Di atas pita (+58%); peran document-writer paling dekat dengan R-6; keakraban tingkat misi paling rendah |

Bila kandidat utama dan cadangan suatu slot sama-sama gagal cek ulang FACTS3, FACTS3 mencari dengan kriteria §8.2 dan mencatat pilihannya. FACTS3 tidak boleh menurunkan kriteria 7.

### 8.5 Ditolak (bukti kriteria 7 atau kriteria 2)

| Kandidat | Alasan |
|---|---|
| `2026-10-22-gsp-eosda-bizplan/output/s17c-lapor.md` (47, kv satu baris) | `t_504af4c5` muncul berulang di `state.db`; owner tidak tertulis |
| `2026-10-08-psikotes-senior-ai/qc/f6/d2-laporan.md` (81, kv berbaris) | `t_9b0f124d` 1; `d2-laporan` 4 |
| `2026-10-04-rafif-ai-manual/_work/t_53ec9b12/LAPORAN-FIX-NAT.md` (46, kelas K2) | `t_53ec9b12` dan `t_28b4def6` berulang (papan RAFAI-1004, sama dengan kandidat R-4 r2 yang gagal) |
| `2026-10-28_eos360-1028/verification/03_laporan-verifikasi-rev2.md` (80) | `t_9d0e6ed1` berulang (penugas gsp-master01, `:3`) |
| `2026-10-10-rafif-revb-1010/verification/VERIF-REVB/laporan.md` (86) | `t_7f6f54fb` 7 |
| `2026-10-21_adint-gsdi-transcript-brief/verification/01_laporan-verifikasi.md` (265; cadangan R-6 r2) | `t_1e3ebeef` dan path berulang |
| `2026-10-21-eosda-sergii-brief/verification/01_laporan-verifikasi.md` (290) | `t_4b4ea8eb` berulang |
| `2026-10-26_family-trip-eoy-2026/figuran/batch2/LAPORAN-B2.md` (153) | `t_bcb27ecb` 2 |
| `2026-10-05-gate-maxpath-fix/REPORT.md`, `2026-10-09_bug-diag-rowpack/LAPORAN.md`, `2026-10-19-expo-intel-survey/process/F5/RM3-laporan-reparasi.md`, `2026-10-13-aie26-saturasi/process/LF-r1..r3.md`, `2026-10-28_putus-rantai-audit-1028/fix/{e2e-b1,e2e-b4-b5,verifikasi-akhir}.md`, `2026-10-28_gsdi-demo-drilldown/verification/01_laporan-verifikasi.md` | cardId utama atau path muncul di `state.db` (Grep, 1 sampai puluhan kemunculan) |
| `2026-10-29_webui-mc-gen2-1101/*`, `2026-10-06-prompt-manual-v2/*` | Kriteria 2 (alur cerita sama dengan R-6 atau R-1) |

Catatan cara cek: Grep atas direktori profil dengan glob `state.db*` tidak membaca berkas biner (kontrol positif `t_c6721813` = 0). Grep atas path berkas langsung membaca (kontrol positif `t_c6721813` = 210 di `state.db`, 206 pada D-423, dan bertambah oleh sesi sesudahnya). Semua angka di §8.3-§8.5 diambil dengan path berkas langsung. `state.db-wal` = 0 untuk semua kartu kandidat §8.3-§8.4; kontrol isi WAL `session|tool_calls|hermes-contract-ab2` = 783 baris.

### 8.6 W dan M

- **W**: dipakai ulang byte-identik (sha D-404 `884dc89f...9138`). Ini sah karena W sintetis dan tidak dinilai. Baris 1 W masih menyebut misi uji 1 (RK-F2), sehingga prompt W wajib menyebut misi ab3, folder `w/`, dan `docKey` `lapkerja-w`.
- **M**: aturan research/13 §5.5 butir 6 menuntut owner dan kartu M berbeda dari laporan R. Owner M `gsp-librarian` (manifest 05 `:24`) sama dengan owner R-7 utama, sehingga M **tidak sah dipakai ulang byte-identik** bila R-7 = LIB2 atau cadangannya. Dalam hal itu FACTS3 membuat `M.md` turunan yang hanya mengganti baris owner ke nilai yang bukan owner R-7..R-9 (mis. `gsp-custodian`, dicek tidak muncul di lembar R), dengan diff tercatat. Bila R-7 akhirnya berowner lain, M dipakai ulang byte-identik (sha `b27deeab...20a4`, D-423). Kartu `t_0c0d0e0f`, status penutupan `needs-review`, dan agentId kedua `hermes-gsp-verifier01` tetap.

### 8.7 Daftar persiapan FACTS3 (tidak ditulis sekarang)

1. Cek ulang kriteria 7 tepat sebelum membekukan, dengan Grep atas path berkas `state.db` dan `state.db-wal` langsung. Kata cari: basename atau path berkualifikasi, semua cardId di sumber, dan nama misi. Keluaran hitungan dikutip di manifest 06. Bila cardId utama atau basename > 0, pakai cadangan.
2. Bekukan 3 sumber ke `controller_ab3/freeze_sources.sha256` (path absolut) dan catat sha di `decisions.md`.
3. `contract_ab3/facts/R-7.md`, `R-8.md`, `R-9.md`:
   - Bentuknya daftar bernomor `R7-F01..`, kelompok `F-awal`/`F-upd1`/`F-upd2`, tanpa judul atau kepala asli, status dalam bahasa biasa.
   - Jumlah fakta dalam pita D-404 ±15% (41-55 / 41-55 / 34-46); jumlah nyata dicatat.
   - `F-upd1` dan `F-upd2` dirancang sebagai perubahan **sebagian** (sebagian bab saja), supaya U-16 benar-benar diuji. Jumlah fakta per kelompok dan bab yang disentuh tiap kelompok dicatat di manifest.
4. Fakta "tidak ada di sumber" ditulis eksplisit (jenis `absen`).
5. Fakta [skenario]:
   - `initiator` = `gsp-master01`.
   - Status S1/S2.
   - Status penutupan R-8 = `needs-review` (dari sumber `:62`; bukan [skenario]).
   - Status penutupan R-9 = `complete`, dengan penanda kedua "rekomendasi ratifikasi menunggu USER" sebagai fakta terpisah.
   - Rujukan R-9 ke satu bagian bukti R-7 (salah satu pin sha16 `:34`) untuk Q5.
   - Owner R-9 = `gsp-worker`, dengan peran gsp-verifier sebagai fakta terpisah (pola D-406).
6. `contract_ab3/facts/W.md` = salinan byte-identik W (sha D-404).
7. `contract_ab3/facts/M.md` menurut §8.6. Istilah Q3 tidak boleh muncul.
8. Tabel token KE-7 per fakta di manifest (pola manifest 05 §5), dibekukan sebelum uji.
9. `contract_ab3/queries/Q.md`, semuanya dibatasi misi ab3:
   - Q1: status laporan kartu `t_0053d245` (R-9).
   - Q2: laporan berstatus `complete` (kunci R-7, R-9; R-8 `needs-review`, W `blocked`, M `needs-review` keluar).
   - Q3: paragraf dengan satu istilah unik R-9, dicek hanya muncul di lembar R-9.
   - Q4: laporan owner `gsp-thinker` (R-8).
   - Q5: bagian bukti R-7 yang dirujuk R-9.
   - Bila status penutupan berubah dari rencana ini, kunci Q2 disesuaikan dan dicatat.
10. Kunci `Q_key.md` di `controller_ab3/answers/`, yaitu di luar `contract_ab3/` dan di luar workspace Hermes. `trial-log get` menolak `controller_ab3/`.
11. Manifest `hermes_trial/06_contract_trial3_facts_manifest.md` memuat jejak fakta ke baris sumber, tabel token, desain Q, hasil kriteria 7, keputusan M, dan penyimpangan kriteria 3/4/6.
12. FACTS3 TIDAK menulis `freeze.sha256` runner. Berkas itu dibuat controller dengan `ab3.py freeze` (§10).

## 9. Skenario, misi, folder, dan urutan

### 9.1 Misi dan folder

| Unsur | Nilai |
|---|---|
| Misi | `2026-10-31_hermes-contract-ab3`. Bila uji dijalankan pada tanggal lain, controller mengganti tanggal secara konsisten di brief 06, prompt, konstanta HARNESS3, `Q.md`, dan `Q_key.md` sebelum freeze, lalu mencatatnya |
| Folder run Hermes | `C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/<misi>/<run>/` (`w/`, `r7a/`, `r7b/`, ...) |
| Folder kerja | `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/contract_ab3/` (`facts/`, `queries/`, `sessions/`, `timing.csv`, `retrieval.csv`, `docs_b.csv`, `format_<run>.txt`) |
| Controller | `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/controller_ab3/` (`answers/`, `freeze.sha256`, `toolcalls/`, `host_log.md`, `host_whitelist.txt`) |
| Harness | `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/harness_ab3/` (`ab3.py`, `bin/trial-log`, `bin/trial-log.cmd`) |
| `docKey` arm B | `lapkerja-<run>` huruf kecil (`lapkerja-r7b`, ...); W `lapkerja-w`; M `lapkerja-m` |
| Ditolak `trial-log get` | berkas rahasia, `controller_ab3/`, `contract_ab/`, `contract_ab2/`, `controller_ab2/`, folder misi ab dan ab2, `harness_ab3/state/`, `contract_ab3/queries/` di luar run Q |

### 9.2 Urutan

| order | run | catatan |
|---|---|---|
| 0 | W (B) | Pemanasan + uji asap jalur MD-native, `template`, `trial-log`, S3 (gerbang W research/13 §6.5); tidak dinilai |
| 1-2 | R7B lalu R7A | B lebih dulu |
| 3-4 | R8A lalu R8B | A lebih dulu |
| 5-6 | R9B lalu R9A | B lebih dulu |
| 7 | M | Dua agentId: `hermes-gsp-master01` dan `hermes-gsp-verifier01` |
| - | controller | Dry-run R08, SQL MU-1, penyelesaian kunci Q, `freeze --force` tercatat (§10) |
| 8 | Q | Q1 A-B, Q2 B-A, Q3 A-B, Q4 B-A, Q5 A-B |

Kemiringan merugikan B dipertahankan (`11:283`). Setiap run memakai sesi Hermes baru. Langkah S0-S5 sama dengan research/13 §7.1, dengan alur arm B menurut §7.

## 10. Freeze: format baku dan perbaikan cacat runner r2

Cacat r2: `freeze_check` memisah tiap baris menjadi hash dan path, lalu mencocokkan string path dengan daftar `freeze_targets()` (path absolut dari konstanta, ditambah `ab2.py`, `bin/trial-log`, `bin/trial-log.cmd`) (`ab2.py:785-791`, `:810-824`). `controller_ab2/freeze.sha256` ditulis FACTS2 dengan path relatif terhadap `Temp/hermes_trial/` dan tanpa berkas alat, sehingga setiap path tercatat HILANG atau BARU. Akibatnya kesembilan sesi dijalankan dengan `--skip-freeze-check` dan cek pengganti di proses terpisah (laporan 05 `:3`, `:7` butir a).

Format baku r3:
1. Satu-satunya berkas freeze yang dibaca runner adalah `controller_ab3/freeze.sha256`. Berkas itu hanya ditulis `ab3.py freeze`, tidak pernah ditulis tangan, oleh `sha256sum`, atau oleh FACTS3.
2. Format baris: `<sha256 64 heksa huruf kecil> *<path absolut>`, dengan path bergaris miring maju dan berhuruf drive `C:/...` (persis keluaran `freeze_targets()`), dipisah LF. Isinya: `contract_ab3/facts/*`, `contract_ab3/queries/*`, `controller_ab3/answers/*`, `harness_ab3/ab3.py`, `harness_ab3/bin/trial-log`, dan `harness_ab3/bin/trial-log.cmd`.
3. Format ini lulus `sha256sum -c` dan cek bawaan sekaligus (uji asap HARNESS2: "`sha256sum -c` lulus untuk path `C:/`", harness 05 §5).
4. Sumber lembar dibekukan FACTS3 di `controller_ab3/freeze_sources.sha256`. Runner tidak membaca berkas ini.
5. Sesudah M, `Q_key_resolved.md` ditulis ke `answers/`. Controller menyalin freeze lama ke `freeze_preQ.sha256`, lalu menjalankan `ab3.py freeze --force` dengan keputusan tercatat. Sesi Q dengan begitu juga lulus cek bawaan.
6. `TRIAL_FREEZE_FILE` tidak dipakai. Bila HARNESS3 tetap menyediakannya, variabel itu wajib dibuang dari env anak supaya path kunci tidak sampai ke Hermes.
7. Gerbang: cek bawaan `run-session` lulus di 9/9 sesi (`freeze_check=OK` di meta). `--skip-freeze-check` hanya boleh dengan keputusan tercatat dan dilaporkan sebagai penyimpangan.
8. Uji sebelum W: `ab3.py freeze --check` exit 0 dan `sha256sum -c controller_ab3/freeze.sha256` exit 0.

## 11. Kebutuhan HARNESS3 (milik controller, di luar repo)

> **R3-H:** HS-5 kini mencatat tanpa menunda (§21.2); HS-8 memakai `studio-report check` untuk laporan MD-native (§21.5) dan kelas KE-5 D-442 (§21.4).

| # | Kebutuhan | Dasar |
|---|---|---|
| HS-1 | Salinan `ab2.py` menjadi `ab3.py` dengan konstanta ab3 (misi, `contract_ab3`, `controller_ab3`, S1, tabel run R7..R9) | §9 |
| HS-2 | Format freeze §10; cek bawaan lulus tanpa `--skip-freeze-check` | §10 |
| HS-3 | `trial-log step --target` dan `get <path>` menerima path relatif, diselesaikan terhadap cwd, dan mencatat path absolut | laporan 05 `:6` |
| HS-4 | Daftar tolak `get` §9.1 | §9.1 |
| HS-5 | Cek host §5.2 (atau skrip terpisah) menulis `<run>_host_pre.txt` dan `<run>_host_post.txt`; pemantau 30 s `<run>_host_during.csv` | §5.2, §5.5 |
| HS-6 | `<run>_active_dirs_pre.txt` sebelum `snapshot pre`; tanda `folder_aktif_pra` di diff | §5.4 |
| HS-7 | Ekspor log sesi `<run>_toolcalls.csv` pasca-sesi dari salinan db + wal + shm | §6.2 |
| HS-8 | Cek pasca-run otomatis (cek draf, `classify` S3/S4, R20 revisi S1/S2, SQL MU-1 sesudah M, checker G_A sesudah R9A) dengan keluaran ringkasan tanpa payload | E-11 |
| HS-9 | Uji asap ulang (pola `smoke_test.sh`) PASS sebelum W, termasuk kasus path relatif, freeze baku, dan ekspor log sesi palsu | harness 05 §5 |

## 12. Format data

Format data sama dengan research/13 §8 dengan path ab3. Berkas baru:
- `sessions/<run>_host_pre.txt` dan `sessions/<run>_host_post.txt`
- `sessions/<run>_host_during.csv`
- `sessions/<run>_active_dirs_pre.txt`
- `controller_ab3/toolcalls/<run>_toolcalls.csv` (kolom §6.2)
- `controller_ab3/host_log.md`

Meta run menambah `host_bersih`, `tunda_kali`, `host_cpu_rerata_selama`, `toolcalls_n_msg`, `toolcalls_n_call`, dan `freeze_check`. Semua berkas ini termasuk `controller_owned` dalam snapshot.

## 13. Prasyarat sebelum sesi pertama (gerbang controller)

> **R3-H:** status prasyarat diperbarui di §21.9.

| # | Prasyarat | Pemilik | Status |
|---|---|---|---|
| P3-1 | Jalur MD-native, `update` delta, dan `template` ada dan diuji; badan hanya di memori; galat `code` + cid | R3-01 | SELESAI (D-436) |
| P3-2 | Review kode + security R3: PASS, atau risiko diterima USER tercatat | baris review R3 | MENUNGGU |
| P3-3 | Panduan memuat jalur MD-native, delta, dan `template` | baris panduan R3 | MENUNGGU |
| P3-4 | Lembar R-7..R-9, W, M (§8.6), Q, Q_key, manifest 06; kriteria 7 dicek ulang | FACTS3 | MENUNGGU |
| P3-5 | HARNESS3 HS-1..HS-9, uji asap PASS | controller | MENUNGGU |
| P3-6 | Server dibekukan pada commit R3; HEAD dicatat; cache tsx dipanaskan ulang (termasuk `template`) | controller | sesudah P3-1..P3-3 |
| P3-7 | Freeze baku §10 lulus (`freeze --check` dan `sha256sum -c`) | controller | sesudah P3-4, P3-5 |
| P3-8 | Brief 06 bersih dari tanda tunggu R3-01; opsi CLI nyata tertulis | controller / baris penyelaras | SELESAI R3-04 (keputusan sisa §20 T-1, T-2) |
| P3-9 | Keputusan tercatat: aturan FL_tpl (E-03), keputusan M (§8.6), tanggal misi (§9.1), ambang prosedur host H-8 | controller | MENUNGGU |
| P3-10 | Uji coba prosedur isolasi §5.2 sekali (kering) dan daftar putih dicatat | controller | MENUNGGU |

## 14. Aturan kejujuran data (tambahan atas research/13 §10)

> **R3-H:** butir 1 diperbarui §21.3 (semua run berhost sibuk; caveat beban wajib); butir 2 diperbarui §21.4 (berkas tanpa bukti sentuh didaftar sebagai `tak_terbukti_run`).

1. Run di host yang tidak bersih tidak disembunyikan. Run itu dilabel dan dilaporkan di sensitivitas 5.
2. Setiap berkas `asal_luar` didaftar dengan bukti (A) dan (B). Tanpa kedua bukti, berkas dihitung.
3. Selisih N_agent antara log sesi dan CSV dilaporkan, tidak dikoreksi.
4. Pemakaian bahan uji 1 atau uji 2 (folder misi ab/ab2, `contract_ab/`, `contract_ab2/`, draf lama) yang terlihat di log sesi dicatat sebagai penyimpangan. Run tetap dinilai.
5. Kemunculan tingkat misi kandidat lembar (§8.3) dilaporkan di analisis sebagai risiko sisa. Angka itu tidak dipakai untuk mengoreksi metrik.

## 15. Asumsi dan celah (Tier 1)

> **R3-H:** sisa celah AS3-5 (`refs`, `initiator`, cek konversi pasca-run) tertutup R3-F dan D-441 (§21.5, §21.6). Asumsi baru AS3-8..AS3-10 ada di §21.9.

| ID | Asumsi/celah | Dampak bila keliru |
|---|---|---|
| AS3-1 | `timestamp` pesan `state.db` memakai jam yang sama dengan `timing.csv` (mesin yang sama) | Bila bergeser, jendela [START, END] untuk log sesi diselaraskan memakai penanda `trial-log mark START/END` yang ada di kedua sumber. Pergeseran dilaporkan |
| AS3-2 | Satu pesan assistant dapat memuat beberapa tool call dengan `timestamp` sama | N tetap dihitung per tool call. Urutan di dalam pesan memakai urutan larik |
| AS3-3 | `token_count` terisi untuk pesan assistant | Bila kosong, token per segmen TIDAK-TERSEDIA. Token per sesi tetap dari `usage_<run>.json` |
| AS3-4 | Path dan skema DB kanban (H-2) belum diverifikasi | Ditetapkan controller sebelum run W (P3-10). Bila tidak dapat dibaca, H-3 dan H-1 menjadi cek pengganti, dan hal ini dicatat |
| AS3-5 | Perilaku jalur baru arm B (§7) | Diselaraskan R3-04 dari laporan R3-01 dan kode (§7, §20). §6.1 batas fase dan §6.3 pengecualian (1) sudah diselaraskan. Sisa celah: `refs` dan `initiator` tidak didukung jalur MD (§20 T-2, T-3); cek konversi pasca-run masih usulan (§20 T-4) |
| AS3-6 | Kriteria 7 diukur hari ini; `state.db` bertambah oleh sesi profil sesudahnya | FACTS3 mengulang cek tepat sebelum membekukan (§8.7 butir 1) |
| G3-1 | n = 3, deskriptif | Confidence MEDIUM |
| G3-2 | Analis tanpa shell: perintah §5 dan kueri §6.2 belum dijalankan di sini | Dijalankan controller dan HARNESS3 dengan uji kering (P3-10, HS-9) |
| G3-3 | R-8 dan R-9 sama-sama laporan bertipe verifier, sedangkan R-6 adalah document-writer | Peran slot R-9 tetap terpenuhi (panjang, banyak kartu, dua penanda status). Cadangan HEIMDALL adalah document-writer |

## 16. Risks

| # | Risiko | Mitigasi |
|---|---|---|
| RK3-1 | MD-native memindahkan galat ke konversi (bab salah petakan, kehilangan fakta) | Gerbang KE-3 stored tetap keras; KE-7 pencocok token; cek konversi pasca-run |
| RK3-2 | Delta salah deteksi sehingga bagian yang berubah tidak terkirim | KE-7 per revisi (R20 S1/S2) dan revisi akhir; kunci Q diselesaikan dari server |
| RK3-3 | Isolasi menunda uji berjam-jam | Batas 6 kali tunda lalu keputusan USER (§5.3) |
| RK3-4 | Profil mengenal misi sumber (rafif-revb 295, vctl-1007 124) | Basename dan cardId utama 0; isi hanya dari lembar fakta; risiko dilaporkan (§14 butir 5) |
| RK3-5 | Ekspor log sesi memuat teks panjang di folder controller | Hasil tool tidak disalin (hanya panjang); argumen disensor; berkas `controller_owned` |
| RK3-6 | Larangan tulis ulang penuh memengaruhi perilaku kedua arm | Berlaku sama untuk A dan B; ambang tidak disebut di brief |
| RK3-7 | Batas loop: KE-1 dan KE-6 di siklus 3 dari 3 | Hasil apa pun disajikan ke USER; tidak ada siklus 4 tanpa keputusan USER |

## 17. Acceptance Criteria (R3-02)

- [x] Aturan asal-usul berlaku sejak awal dengan bukti wajib (E-01; research/13 §17).
- [x] Sumber utama KE-2/KE-6 = tool call berwaktu `state.db`; CSV sebagai silang (E-02, E-03, §6.2, §6.4).
- [x] Isolasi host: daftar perintah, aturan tunda, beban host per run, snapshot folder aktif (§5).
- [x] Arm B jalur baru; opsi persis diisi R3-04 dari laporan R3-01 dan kode (§7, §20).
- [x] Ambang D-422 dan lainnya tidak berubah; satu perubahan definisi (FL_tpl) dicatat beralasan (§4, §6.4).
- [x] Kandidat R-7..R-9 + cadangan dengan bukti kriteria 7 = 0; daftar persiapan FACTS3 (§8).
- [x] W dipakai ulang byte-identik; keputusan M beralasan (§8.6).
- [x] Kunci Q di luar folder Hermes; misi dan folder ab3 (§9).
- [x] Format freeze baku dan perbaikan cacat runner r2 (§10).

## 18. Recommendations

1. Controller mencatat E-01..E-11, aturan FL_tpl, keputusan M, dan ambang prosedur H-8 di `decisions.md` (P3-9).
2. Luncurkan FACTS3 dengan daftar §8.7 sesudah cek ulang kriteria 7. Luncurkan HARNESS3 dengan HS-1..HS-9.
3. Selesai di R3-04: setiap tanda tunggu R3-01 di §6.1, §6.3, §7, dan brief 06 sudah diganti perilaku nyata dari laporan R3-01 dan kode (P3-8). Keputusan sisa milik controller tercantum di §20.
4. Ambang KE tidak diberitahukan ke Hermes (brief 06), sama seperti brief 05.
5. Karena ini siklus 3 dari 3 untuk KE-1 dan KE-6, sebelum uji controller menyiapkan pertanyaan USER untuk setiap kemungkinan hasil: adopsi berbasis misi (V-1 Hermes), hentikan, atau desain ulang.

## 19. Collection Log

1. Read utuh: `decisions.md:420-441`, research/13, research/14, verifikasi 03, brief 05, harness 05, laporan 05; manifest 05 `:1-120`; `ab2.py:760-869`; `Temp/dc47b/fl.py`; `file_claims.md` (Grep R3).
2. Grep `state.db` (path berkas langsung): teks `CREATE TABLE messages`; kontrol positif `t_c6721813` = 210; cardId dan basename kandidat (§8.3-§8.5); nama misi kandidat. Grep `state.db-wal`: kandidat = 0; kontrol isi 783.
3. Workspace Hermes (baca saja): Glob `2026-10-*/**/*apor*.md` dan pola LAPOR/REPORT; Grep hitung baris; Grep owner, kartu, dan status; Read LIB2 (utuh), smart-deck laporan-verifikasi (utuh), CSIGN-REVB-v22 `:1-25`, `:248-286`, s17c (utuh), mikroverif-disp (utuh), eos360 rev2 (utuh), VERIF-REVB (utuh), FIX-NAT (utuh), fleet-health 11-10 (utuh), dan kepala kandidat lain. Tidak ada tulisan ke workspace Hermes.
4. Grep `template|md-native|delta` di `scripts/studio/studio-report.ts` = 0.
5. Tidak ada shell. Tidak ada perintah §5 atau kueri §6.2 yang dijalankan analis.
6. R3-04 (2026-10-31, baca saja, tanpa shell): `decisions.md:441-442` (D-436, D-437); `delegation_progress/coder_execution_r3_01.md` utuh; `studio-report.ts:1-200`, `:260-370`, `:395-445`, `:640-820`, `:900-1350`, ditambah Grep opsi, kode galat, dan timing; `md-report.ts` utuh; `contracts.ts:54-140`, `:385-469`; Grep `services/import/contract/index.ts` (UNMAPPED, references), Grep `\brefs\b` di `services/import` = 0, Grep `draft-check.ts` (MD-native) = 0; `services/draft/check.ts:139-145`; Grep uji `r3cli-md-native.test.ts`. `--help` tidak dijalankan; isinya dibaca dari `studio-report.ts:76-139`.
7. R3-H (2026-11-01, baca saja, tanpa shell): lihat §21.11.

## 20. Amandemen R3-04 (D-436, D-437; 2026-10-31)

> **R3-H:** status T-1..T-5 sesudah R3-F ada di §21.10.

Baris penyelaras R3-04 mengisi semua tanda tunggu R3-01 dari laporan R3-01 dan kode. Bagian yang diubah: frontmatter (`confidence`, `amended_by`), §2 baris 1, §4 E-05, §6.1 tabel batas fase, §6.3 pengecualian (1) dan cache tsx, §7 (judul, pengantar, kolom ketiga), §13 P3-1 dan P3-8, §15 AS3-5, §17 butir 4, §18 butir 3, §19 butir 6, dan bagian ini. Teks lain tidak berubah. Di brief 06, butir 1-4 §1 diisi dan §7 baris arm B diselaraskan dengan T-1.

Temuan yang perlu keputusan controller (tidak diputuskan di sini):

| ID | Temuan | Bukti | Implikasi | Confidence |
|---|---|---|---|---|
| T-1 | `template` menolak `--timing`, `--step`, dan `--agent-id` (keluar 2) dan tidak menulis baris timing. Brief 06 §7 semula meminta `--timing` untuk `template` | `studio-report.ts:610-614`, `:1320-1324` | Brief 06 §7 diselaraskan: `template` tanpa `--timing`/`--step` dan tanpa `trial-log`; FL_tpl hanya dari log sesi (§6.4). Controller mengonfirmasi, atau memilih `trial-log step cmd` sebagai silang (menambah satu tool call arm B) | HIGH |
| T-2 | Jalur MD tidak menghasilkan `record.payload.refs`. Baris di bawah `## Referensi` menjadi entri sourceRegister (teks sitasi + url), bukan relasi `refs` | Grep `\brefs\b` di `src/lib/studio/services/import` = 0; `index.ts:323-347`; registri `contracts.ts:197` (refs hanya lewat JSON) | Brief 06 §5 (R9B "lalu `refs`") dan Q5 arm B (R16) tidak dapat dipenuhi lewat jalur MD murni. R9B akan memakai blok JSON atau API (penyimpangan §7) atau rujukan teks. Perlu keputusan: perluas alat, izinkan pengecualian tercatat, atau ubah Q5 | HIGH |
| T-3 | `initiator` (juga `due`, `phase`) bukan kunci kepala yang dipetakan; nilainya disimpan sebagai teks bab 1 dengan CW `CONTRACT_FIELD_UNMAPPED` | `md-report.ts:23`; `index.ts:481`, `:491` | Fakta `initiator` (brief 06 §5) tidak masuk record arm B. KE-7 pencocok token tetap menemukannya sebagai teks; pembanding struktur (KE-3, MU) perlu mencatatnya | HIGH |
| T-4 | Tidak ada perintah cek konversi terpisah: draft-check tidak menerima MD-native; `studio-report` tanpa mode kering | Grep `md-report\|mdReport\|--format\|MD-native` di `scripts/studio/draft-check.ts` = 0; opsi `studio-report.ts:590` | §6.3 pengecualian (1) memakai cek kesetaraan `update ... --json` pasca-run (usulan untuk HS-8; efek samping render tanpa revisi baru). Alternatif: HARNESS3 memanggil konversi murni `mdReportToBlocks` tanpa server | MEDIUM |
| T-5 | `agentId:` di kepala laporan mengalahkan `--agent-id` untuk kiriman; render memakai `--agent-id` bila diberikan | `services/draft/check.ts:139-145`; `studio-report.ts:982-986` | Run M2: bila kepala laporan memuat `agentId: hermes-gsp-master01`, `--agent-id hermes-gsp-verifier01` diabaikan untuk kiriman. Brief 06 butir 3 menyebut fakta ini; analisis M memeriksa `lastFilledBy` | HIGH |

## 21. Amandemen R3-H (D-439..D-443; 2026-11-01)

Baris R3-H (data-analyst, dok saja) menyelaraskan protokol, brief 06, dan dok harness 06 dengan keputusan USER D-442 serta keputusan D-439, D-440, D-441, D-443. Teks §1-§20 dipertahankan; bagian yang digantikan diberi penanda "R3-H" yang menunjuk subbagian di bawah. Ambang KE-1..KE-7, gerbang keras, dan aturan vonis tidak berubah.

### 21.1 Sumber

| Sumber | Isi yang dipakai |
|---|---|
| D-439 (`decisions.md:444`) | KEPUTUSAN USER: `update` memakai revisi basis salinan agen (baris `basis:`), konflik berhenti dengan instruksi segarkan; templat berplaceholder yang ditolak sampai diisi |
| D-440 (`:445`) | `refs` dan `initiator` lewat MD (R3-F); `--agent-id` MENANG atas kepala; daftar izin layanan selalu-hidup; prompt W dan M wajib menyebut misi `2026-10-31_hermes-contract-ab3`; M owner `gsp-skill-manager` |
| D-441 (`:446`) | Isolasi penuh tidak tercapai (H-1..H-5 gagal di host); `studio-report check <laporan.md>` (konversi + dry-run R08, nol tulis); `--md-update-check` (menulis ke server) TIDAK dipakai |
| D-442 (`:447`) | KEPUTUSAN USER "Record load, rely on provenance": H-1..H-5 INFORMATIF, dicatat per run (beban pre/post), tidak menunda; KE-5 hanya berkas yang terbukti lewat log sesi Hermes (state.db) disentuh run; caveat waktu akibat beban di analisis; controller tidak menghentikan proses USER |
| D-443 (`:448`) | R3-F diterima: basis/`BASIS_MISSING`/`BASE_CONFLICT`/`--force-latest`, placeholder, `RECORD_FIELDS_DROPPED`, `## Rujukan` -> refs, initiator, `--agent-id` menang, `check`; baris berikut R3-G, R3-H, H3-G |
| Laporan R3-F (`delegation_progress/coder_execution_r3_f.md`) | `:46` repro basis/konflik; `:53` `check --remote` hanya POST validate + GET R05, 0 tulis; `:54` asap (refs tersimpan, R16 pid 200); `:64-71` keputusan agen; `:76-83` perubahan yang terlihat agen |
| Kode `scripts/studio/studio-report.ts` (baca saja) | `:94-180` pemakaian/bantuan; `:645-707` argumen (check menolak `--section`, `--base-rev`, `--out`, `--timing`, `--step`, `--require-complete`, `--force-latest`, `:685-687`); `:850-893` `resolveBasis`; `:1224-1326` `runUpdate` (BASE_CONFLICT `:1296-1303`); `:1330-1368` basis berikutnya; `:1742-1851` `check` |
| Kode `harness_ab3/ab3.py` (baca saja; suntingan H3-G belum dilaporkan) | `:1458-1469` `isolation-check` (exit 0/1, hanya melapor); `:1757`, `:1766`, `:1812-1848` mode informatif + `--strict-isolation`; `:1950-1978` meta; `:2048-2066` postcheck MD-native = `studio-report check`; `:2129-2159` `Provenance.judge` (arah lama); `:2165-2167` `--md-update-check` ditolak |

### 21.2 Isolasi host informatif (menggantikan §5.1, kolom "Lulus bila" §5.2 sebagai syarat mulai, dan §5.3)

| Butir | Aturan R3-H | Dasar |
|---|---|---|
| H-1..H-5 | INFORMATIF: dijalankan sebelum `snapshot pre` dan (H-1, H-4, H-5) sesudah `snapshot post`; hasil dicatat per run; tidak menunda dan tidak menggagalkan run | D-442 |
| Daftar izin layanan selalu-hidup | Tetap aktif (grup `hermes-gateway`, `hermes-gateway-bridge`, `hermes-dashboard`, `hermes-cron`, `wsl`). Pada mode informatif ia hanya memisahkan layanan yang diizinkan dari beban lain di catatan (`isolation_allowlist_kena_pre/post`). Pekerja kanban dan sesi chat tidak pernah diizinkan dan tercatat sebagai beban | D-440, D-441; harness 06 §5.1 |
| H-6, H-7, H-8 | D-442 tidak menyebutnya. Kode H3-G menjadikan SEMUA cek informatif pada mode bawaan (`ab3.py:1812-1832`). Protokol menetapkan H-6, H-7, H-8 juga informatif karena sekelas dengan beban/jadwal host yang diputuskan D-442 ("uji tetap dijalankan di host yang sibuk"). Ambang H-8 (CPU 30%, disk 50%) dipakai hanya sebagai label `beban_tinggi` (§21.3) | D-442 (perluasan, perlu konfirmasi: §21.9 K-1) |
| H-9 | Tetap kewajiban controller: tidak ada sub-agen controller yang berjalan selama jendela run. Kegagalan H-9 tidak menahan run (kode), tetapi dicatat sebagai penyimpangan controller di analisis | §5.2 H-9; §21.9 K-1 |
| Aturan tunda §5.3 | Tidak berlaku pada mode bawaan. `--strict-isolation` (dengan `--isolation-wait`, `--isolation-max-delays`, `--force-isolation-skip`) hanya atas keputusan USER tercatat | D-442; `ab3.py:1766` |
| Tindakan controller | Tidak menghentikan proses USER, tidak mengubah cron/gateway/profil Hermes | D-442; §5.1 |
| Dicatat per run | `<run>_host_pre.txt`, `<run>_host_post.txt`, `<run>_host_during.csv` (30 s; pemantau tidak dimatikan), `host_log.md`; meta: `isolation_mode`, `host_bersih`, `isolation_gagal`, `isolation_allowlist`, `isolation_allowlist_kena_pre/post`, `host_cpu_pre`, `host_disk_pre`, `host_free_mb_pre`, `host_post`, `host_post_cpu`, `host_post_disk`, `host_post_free_mb`, `host_cpu_rerata_selama`, `host_disk_rerata_selama`, `host_n_sampel_selama`, `host_maks_proc_luar_selama`, `host_maks_berkas_baru_temp_selama` | `ab3.py:1950-1978`; harness 06 §3 |

### 21.3 Caveat beban dan sensitivitas 5 (menggantikan butir sensitivitas 5 di §6.1 dan §14 butir 1)

Pada mode informatif hampir pasti setiap run berlabel `host_bersih=tidak` (temuan host D-441; harness 06 L3-10), sehingga sensitivitas 5 lama akan mengosongkan sampel. Definisi baru:

1. Label `beban_tinggi` per run = `host_cpu_rerata_selama >= 30` ATAU `host_disk_rerata_selama >= 50` (ambang prosedur H-8 lama, diterapkan pada rerata selama run; bukan ambang metrik).
2. **Sensitivitas 5** = KE-1 tanpa pasangan yang salah satu run-nya `beban_tinggi` atau `latensi_anomali`. Bila tidak ada pasangan tersisa, ditulis TIDAK-DAPAT-DIHITUNG beserta alasannya.
3. **Sensitivitas 5b** (definisi lama, `host_bersih=tidak`) dilaporkan hanya bila masih ada >= 1 pasangan; selain itu ditulis TIDAK-DAPAT-DIHITUNG (semua run berhost sibuk, D-442).
4. **Caveat beban WAJIB** di analisis, berisi:
   - Tabel per run: CPU pre / rerata selama / post, disk pre / rerata selama / post, memori bebas pre/post, maks proses di luar daftar izin selama run, maks berkas baru `%TEMP%` dan workspace selama run, `isolation_gagal` pre dan post, `beban_tinggi`, `latensi_anomali`, throughput token/s.
   - Selisih beban dalam pasangan (B - A) untuk CPU rerata dan proses luar daftar izin, supaya pembaca melihat apakah beban menguntungkan salah satu arm.
   - Satu paragraf caveat: waktu dinding KE-1 memuat derau beban host yang tidak dikendalikan; arah dan besar derau per pasangan disebut dari tabel; vonis KE-1 tetap dihitung dengan aturan D-422 atas semua pasangan, dan sensitivitas 5 disajikan di sampingnya.
5. Run tidak dibuang dan tidak diulang karena beban tanpa keputusan USER tercatat (`11:331`).

### 21.4 KE-5: aturan asal-usul D-442 (menggantikan pengecualian (6) di §6.3, E-01, dan §14 butir 2)

D-442 menetapkan bahwa KE-5 hanya menghitung berkas yang terbukti lewat log sesi Hermes (state.db) disentuh run itu. Ini membalik arah beban bukti dibanding research/13 §17.1: dulu berkas dihitung kecuali ada dua bukti asal luar; kini berkas dihitung bila ada bukti sentuh.

| Set | Aturan |
|---|---|
| S1 (folder misi ab3) dan S2 (`Temp/hermes_trial/`, di luar `controller_owned`) | Hanya run dan controller yang menulis di sana. Bukti sentuh tingkat folder = nama folder run (`r7b`, ...), nama misi, atau `contract_ab3` muncul di tool call sesi run + turunan; jumlahnya dicatat per run. Berkas yang bukan pengecualian (1)-(5) dihitung seperti biasa. Interpretasi ini perlu konfirmasi (§21.9 K-4) |
| S3 (`%TEMP%` di luar S2) dan S4 (workspace Hermes di luar S1) | Berkas baru yang memenuhi kriteria mentah research/13 §6.5 dihitung ke `D_raw,B` HANYA bila ada salah satu bukti: (i) **sentuh langsung**: basename, path, atau nama folder induk (bukan akar `Temp`, `workspace`, `docs`) muncul di `tool_calls`, `content`, atau `tool_name` pesan sesi run + turunan (salinan `state.db` + wal + shm, `mode=ro`); atau (ii) **sentuh tak langsung**: sesi memuat tool call berpath dinamis (`tempfile`, `mkstemp`, `mktemp`, `NamedTemporaryFile`, `TemporaryDirectory`, `uuid`) DAN isi berkas memuat token lembar fakta run itu, atau isi tak terbaca. Bila log sesi tak terbaca atau sesi tidak ditemukan, semua berkas berpola di S3/S4 dihitung (ragu = dihitung) |
| Tanpa bukti sentuh | Kelas `tak_terbukti_run`: tidak dihitung, tetapi didaftar di analisis (path, set, ukuran, sha, `folder_aktif_pra`, kata cari dan jumlahnya, `A_dynamic_path_calls`), lalu dicek ulang verifier |
| Sensitivitas wajib | `D_raw,B` menurut aturan research/13 §17.1 (dihitung kecuali bukti A dan B; kelas alat `asal_usul_D435`) dilaporkan berdampingan. Bila vonis KE-5 berbeda antara kedua aturan, perbedaan disajikan ke USER apa adanya |

- Pengecualian (1)-(5) tetap; pengecualian (1) memakai §21.5.
- Risiko sisa: berkas yang ditulis subproses alat dengan nama yang tidak muncul di log sesi (bukan pola tempfile/uuid) lolos dari (i) dan (ii); sensitivitas aturan lama menutup sebagian. Risiko ini disebut di analisis.
- Status alat: `postcheck` masih mengklasifikasi dengan arah lama (`Provenance.judge`, `ab3.py:2129-2159`; ragu = dihitung) dan menghitung bukti token fakta hanya bila `folder_aktif_pra=1` (`:2152-2158`). Kelas D-442 per berkas belum ada [menunggu H3-G, §21.9 K-3]. Sampai ada, controller menurunkan kelas D-442 dari `A_rujukan` di `<run>_postcheck.json` ditambah kueri token terpisah atas salinan `state.db` untuk berkas dengan `A_rujukan` = 0 dan `folder_aktif_pra` = 0.

### 21.5 HS-8 dan pengecualian (1): `studio-report check` (menggantikan butir cek draf di §6.3, HS-8 §11, dan §20 T-4)

- Perintah controller (HS-8, `postcheck`): `npx tsx C:/Users/TRIAL/gsp-swarm-hq-v2.1/scripts/studio/studio-report.ts check <laporan.md> --remote http://127.0.0.1:9021 --json` (`ab3.py:2048-2066`).
- Nol tulis: tidak menulis berkas apa pun (`--out`, `--timing`, `--step` ditolak keluar 2; `studio-report.ts:685-687`); server hanya menerima GET R05 dan POST `/api/studio/validate` (dry-run R08, tidak menyimpan) (`:1762-1767`; laporan R3-F `:53`). `--remote` wajib eksplisit; `HQ_URL` tidak dipakai (laporan R3-F `:71`).
- Mode: baris `basis:` di kepala = mode update dengan `documentId` dari baris itu; selain itu mode create (`studio-report.ts:1785-1794`).
- Lulus bila keluar 0 dan `ok=true`. Keluar 1 = ada isu yang menghalangi kiriman (termasuk `TEMPLATE_PLACEHOLDER`; `EXAMPLE_TARGET` pada `check` keluar 1, `:1803-1809`). Keluar 2 = lingkungan.
- **Draf sah** (pengecualian (1) §6.3) = (a) `check` lulus DAN (b) ada baris `tool` `studio-report submit` atau `studio-report update` ok=1 dengan `note` = basename laporan di `timing.csv` run itu. Kesetaraan isi disk dengan revisi tersimpan tidak lagi dicek di HS-8; KE-7 per revisi (R20) dan larangan sunting sesudah END menutupnya. Bila mtime laporan lebih baru daripada `t_end` kiriman terakhir, hal itu dicatat dan diadili analis (kolom `lebih_baru_dari_kiriman` opsional, [menunggu H3-G]).
- Cek kesetaraan `update ... --json` (§6.3 lama; `postcheck --md-update-check`) DIHAPUS karena menulis ke server (D-441); `ab3.py` menolaknya dengan keluar 2 `USAGE` (`:2165-2167`).
- Laporan akhir arm B memuat basis dari S2 (brief 06 §6 langkah 7 tidak meminta salin basis sesudah S3). Hipotesis: validate R08 tidak memeriksa jendela revisi, sehingga basis lama tidak memunculkan isu. Bukti: Grep `baseRevisionNo` di `src/app/api/studio/validate` = 0. Bila postcheck W menunjukkan sebaliknya, controller mencatatnya sebelum R7B; brief tidak diubah selama uji tanpa keputusan tercatat.

### 21.6 Alur arm B (memperbarui E-05, batas fase §6.1, dan §7)

`SR` = `npx tsx C:/Users/TRIAL/gsp-swarm-hq-v2.1/scripts/studio/studio-report.ts`; `L` = laporan di folder run; `T` = `contract_ab3/timing.csv` (path absolut).

| Langkah | Perintah persis (brief 06 §6) | Catatan pengukuran |
|---|---|---|
| S1-a (opsional) | `SR template --mission 2026-10-31_hermes-contract-ab3 --doc-key lapkerja-<run> > L` | Stdout saja; tanpa `--timing`/`--step`/`--agent-id` (keluar 2; `studio-report.ts:676-678`); FL_tpl dari log sesi (§6.4) |
| S1-b | Isi `L`: ganti setiap `<isi: ...>`, hapus baris/bagian yang tidak berlaku | Tulis/sunting; `trial-log step edit` |
| S1-c | `SR check L --remote http://127.0.0.1:9021` | Tanpa baris timing dan tanpa `trial-log`; N dari log sesi; di dalam T1; keluar 1 masuk `G_B,draft` (§21.7) |
| S1-d | `SR submit L --agent-id hermes-gsp-master01 --timing T --step S1` | Akhir fase S1 = kiriman 2xx terakhir (§6.1). Mencetak `basis: <documentId>@rev<n>` |
| S1-e | Salin baris basis ke kepala `L`, paling lambat bersama suntingan S2 | Digabung dengan suntingan S2 sehingga tidak menambah tool call |
| S2 | Sunting `L` (termasuk basis), lalu `SR update <documentId> L --agent-id hermes-gsp-master01 --timing T --step S2` | Baris `api` `basis rev<n>` (`:1216-1217`); hanya bagian yang diubah sejak basis yang dikirim; mencetak "basis berikutnya" (`:1693`) atau `null` + alasan (`:1330-1368`) |
| S3 | Sunting `L` (termasuk basis), lalu `SR update <documentId> L --agent-id hermes-gsp-master01 --timing T --step S3 --require-complete --out <folder run>` | S4 tercakup; basis sesudah S3 tidak disalin (§21.5) |
| M | Alur yang sama dengan `--step M1\|M2\|M3`, tanpa `--out`; M1 dan M3 `--agent-id hermes-gsp-master01`, M2 `--agent-id hermes-gsp-verifier01` | `--agent-id` menang atas kepala (D-440 butir 4; `studio-report.ts:149-150`); brief melarang `agentId:` di kepala. Analisis M memeriksa `lastFilledBy` record/content per langkah |

- Larangan arm B (penyimpangan bila terjadi, run tetap dinilai): `--force-latest` (melewati penjaga basis; tercatat di `note` baris `tool` sebagai `<berkas> force-latest`, `studio-report.ts:1609-1610`); `--section` tanpa petunjuk `BASE_CONFLICT`; blok JSON atau API langsung; `agentId:` di kepala.
- Status temuan §20: T-1 dikonfirmasi D-440 butir 1; T-2 tertutup (`## Rujukan` tabel `| hubungan | dokumen | paragraf | revisi |` -> `record.refs`; hubungan `basis`/`dasar`, `evidence`/`bukti`, `output`/`keluaran`/`hasil`, `supersedes`/`menggantikan`; `md-report.ts:224-235`); T-3 tertutup (`Initiator:`/`Pemberi tugas:` -> `record.initiator`); T-4 diganti `check` (§21.5); T-5 dibalik (`--agent-id` menang + pemberitahuan bila berbeda).
- Perilaku lain yang memengaruhi data (laporan R3-F `:76-83`): bagian yang tidak diubah agen sejak basis tidak pernah dikirim (bagian `stale` dicetak sebagai isi terkini); bab yang hilang dari laporan tidak dihapus; judul tidak diperbarui `update`; nilai majemuk `a dan b` tidak dipotong.
- Q5 arm B kini dapat dipenuhi lewat MD: R9B menulis satu baris `## Rujukan` berhubungan `bukti` ke dokumen R7B + pid paragraf bukti (asap R3-F: refs tersimpan, R16 pid rujukan 200; laporan R3-F `:54`).

### 21.7 KE-3: penempatan galat penjaga klien (E-12, menambah §6.5)

**Keputusan:** `BASE_CONFLICT`, `BASIS_MISSING`, `BASIS_INVALID`, `BASIS_DOCUMENT_MISMATCH`, dan `DOCUMENT_MISMATCH` TIDAK dihitung dalam `G_B,4xx`. Kode-kode itu dicatat dalam kelompok baru **`G_B,klien`** (galat penjaga klien) per run per kode dan dilaporkan di KE-3 di samping `G_B,draft`, tanpa ambang. Galat konversi lokal (`TEMPLATE_PLACEHOLDER`, `MD2CONTRACT_REQUIRED_MISSING`, `RECORD_FIELDS_DROPPED`, `MD_REPORT_INVALID`, `MD_REPORT_TOO_LARGE`) dan `check` yang keluar 1 masuk `G_B,draft` (dilaporkan, tidak dihukum; `11:101`).

Alasan:
1. `G_B,4xx` didefinisikan sebagai respons 4xx server berkode skema/kontrak (`11:100`). Kode penjaga klien dihasilkan CLI sebelum jaringan atau sebelum kiriman pertama: `BASIS_MISSING` keluar 1 sebelum jaringan (`studio-report.ts:850-893`), `BASE_CONFLICT` keluar 1 dengan 0 POST (`:1296-1303`; laporan R3-F `:46`). Tidak ada respons HTTP dan tidak ada yang tersimpan.
2. Kode-kode ini bukan galat format. Mereka adalah penjaga konkurensi dan prosedur yang diminta USER (D-439). Memasukkannya ke `G_B,4xx` mengubah pembilang ambang KE-3 yang diputuskan sebelumnya tanpa keputusan baru, padahal §4 menetapkan ambang tetap.
3. Biaya agen tetap terukur: waktu masuk KE-1, tool call masuk KE-2, dan setiap kejadian dilaporkan per kode.
4. Padanan terdekat di protokol adalah `G_B,draft` (jaring pengaman lokal yang dilaporkan, tidak dihukum), bukan 4xx server.

Alternatif yang ditolak: menghitungnya sebagai "4xx-setara". Akibatnya ambang KE-3 berubah diam-diam, dan penjaga yang bekerja sesuai rancangan justru dihukum.

Pelaporan tambahan:
- Sensitivitas wajib: `Σ(G_B,4xx + G_B,klien)` diuji dengan ambang 4xx KE-3 yang sama dan dilaporkan berdampingan (pola FL_tpl, §6.4). Bila vonis berbeda, perbedaan disajikan ke USER.
- Tanda anomali: `BASE_CONFLICT` di run R (satu penulis) menandakan konflik palsu, yaitu cacat alat, bukan galat agen. Kejadian itu dilaporkan ke USER terpisah. Di run M (penulis bergantian) kejadiannya dicatat dan dijelaskan.
- Sumber: baris `tool` `timing.csv` dengan `ok=0` dan `err_code` (submit/update). Hasil `check` tidak menulis timing, dan `<run>_toolcalls.csv` hanya menyimpan `result_len`, sehingga keluaran `check` diambil controller dari isi hasil tool di salinan `state.db` saat analisis.
- Confidence: MEDIUM (definisi jelas; dampak pada vonis bergantung pada frekuensi yang belum teramati).

### 21.8 Tabel butir wajib R3-H

| # | Butir wajib | Sumber/bukti | Pemilik | Dilaporkan di |
|---|---|---|---|---|
| W-1 | Mode isolasi per run = `informatif(D-442)`; `--strict-isolation` hanya dengan keputusan USER tercatat | meta `isolation_mode`; `host_log.md` | runner/controller | analisis, caveat beban |
| W-2 | Beban host pre, selama, dan post setiap run | `<run>_host_pre.txt`, `<run>_host_post.txt`, `<run>_host_during.csv`, meta `host_*` | runner | caveat beban (§21.3) |
| W-3 | Proses yang diizinkan daftar izin, pre dan post | meta `isolation_allowlist_kena_pre/post` | runner | caveat beban |
| W-4 | H-9: tidak ada sub-agen controller selama jendela run | `agents_active.txt` kosong; H-9 di `host_pre` | controller | penyimpangan bila gagal |
| W-5 | Label `beban_tinggi` dan `latensi_anomali` per run; sensitivitas 5 (dan 5b bila dapat dihitung) | meta, `usage_<run>.json` | analis | KE-1 |
| W-6 | Paragraf caveat beban + selisih beban dalam pasangan | W-2 | analis | analisis |
| W-7 | KE-5 D-442: daftar berkas yang dihitung beserta bukti sentuh (i)/(ii); daftar `tak_terbukti_run` | `<run>_postcheck.json`, salinan `state.db` | controller/analis | KE-5; dicek ulang verifier |
| W-8 | Sensitivitas KE-5 aturan research/13 §17.1 | `classify` (`asal_usul_D435`) | analis | KE-5 |
| W-9 | Postcheck arm B dengan `studio-report check --remote` per laporan MD-native | `<run>_postcheck.json` `drafts[]` | controller | KE-5 pengecualian (1) |
| W-10 | Draf sah = `check` lulus + baris `tool` ok=1 ber-`note` basename | `<run>_postcheck.json`, `timing.csv` | controller | KE-5 |
| W-11 | `G_B,klien` per kode, `G_B,draft` (termasuk `check` keluar 1), sensitivitas KE-3 | `timing.csv` `err_code`; salinan `state.db` | analis | KE-3 |
| W-12 | `BASE_CONFLICT` di run R = anomali alat | `timing.csv` | analis | ke USER terpisah |
| W-13 | Penyimpangan arm B: `--force-latest`, `--section` tanpa petunjuk, blok JSON/API langsung, `agentId:` di kepala | `note` baris `tool`; log sesi; `format_<run>.txt` | analis | tanda per run |
| W-14 | Run M: `lastFilledBy` record/content per langkah; M2 = `hermes-gsp-verifier01` | `docs_b.csv`; R20/R05 | controller | MU |
| W-15 | Q5 arm B: `record.refs` R9B (documentId R7B + pid + `evidence`) tersimpan; R16 pid 200 | R20 dokumen R9B | controller | KE-4, KE-7 |
| W-16 | Prompt W dan M menyebut misi `2026-10-31_hermes-contract-ab3` (M juga `--agent-id hermes-gsp-verifier01` untuk M2) | `sessions/prompt_W.txt`, `sessions/prompt_M.txt` | controller | precheck per run |
| W-17 | Sha alat final dan freeze baku sesudah H3-G (dan R3-G bila panduan ikut dibekukan) | `freeze.sha256`, `freeze.origin.json` | controller | P3-7 |

### 21.9 Status prasyarat, asumsi baru, dan hal terbuka (memperbarui §13 dan §15)

| # | Status per 2026-11-01 | Bukti |
|---|---|---|
| P3-1 | SELESAI, diperluas R3-F (basis, placeholder, refs, initiator, `check`) | D-436, D-443 |
| P3-2 | Review R3-03 CHANGES REQUESTED -> R3-F diterima -> review fokus R3-F (R3-03b) MENUNGGU | D-438, D-443 |
| P3-3 | Panduan R3-G MENUNGGU | D-443 |
| P3-4 | SELESAI (dicek controller; M owner `gsp-skill-manager`) | D-440 |
| P3-5 | H3-F diterima sebagian; H3-G (isolasi informatif + postcheck `check`) terlihat di kode tetapi belum dilaporkan: MENUNGGU | D-441, D-443; `ab3.py:1766`, `:2048-2066` |
| P3-6 | Sesudah P3-2, P3-3, H3-G | - |
| P3-7 | Menunggu hash alat final | D-441 |
| P3-8 | Diselaraskan ulang R3-H (brief 06 sekitar 1.380 kata) | brief 06 |
| P3-9 | FL_tpl diterima (D-437); keputusan M (D-440); misi (D-440); ambang H-8 kini hanya label `beban_tinggi` (§21.3), perlu dicatat controller | D-437, D-440 |
| P3-10 | Uji kering isolasi SELESAI (hasil GAGAL, lalu diputuskan D-442) | D-441, D-442; harness 06 L3-10 |

| ID | Asumsi baru | Dampak bila keliru |
|---|---|---|
| AS3-8 | Validate R08 tidak memeriksa jendela revisi (§21.5) | Postcheck melaporkan isu basis; controller mencatatnya di W sebelum R7B |
| AS3-9 | Bukti sentuh tingkat folder di S1/S2 selalu ada karena prompt dan brief mengarahkan ke folder itu | Bila tidak ada, berkas S1/S2 tetap dihitung (ragu = dihitung) dan hal itu dicatat |
| AS3-10 | Menggabungkan salin basis dengan suntingan langkah berikutnya tidak menambah galat `BASIS_MISSING` | Bila Hermes lupa, `BASIS_MISSING` muncul di `G_B,klien` dan biayanya terlihat di KE-1/KE-2 |

Hal terbuka untuk controller (tidak diputuskan di sini):

| ID | Hal | Usulan |
|---|---|---|
| K-1 | Kode H3-G menjadikan H-1..H-9 informatif, sedangkan D-442 menyebut H-1..H-5 | Terima H-6..H-8 informatif; H-9 tetap kewajiban controller (§21.2). Catat di `decisions.md` |
| K-2 | Penempatan `G_B,klien` di KE-3 (§21.7) | Catat sebagai E-12 di `decisions.md` |
| K-3 | H3-G: kelas KE-5 D-442 di `postcheck` (bukti sentuh langsung dan tak langsung, token fakta dihitung tanpa syarat B), opsional `lebih_baru_dari_kiriman` | Tambahkan sebelum freeze, atau controller menghitungnya manual (§21.4) |
| K-4 | Interpretasi S1/S2 (bukti sentuh tingkat folder) | Konfirmasi |
| K-5 | Basis tidak disalin sesudah S3 (menghemat satu suntingan arm B) | Pertahankan kecuali W membuktikan AS3-8 keliru |

### 21.10 Bagian yang digantikan (penanda R3-H)

| Lokasi | Penggantian |
|---|---|
| Kepala dokumen | Penanda umum R3-H |
| §4 (sesudah tabel E-01..E-11) | E-01, E-04, E-05, E-06, E-11 -> §21.4, §21.2, §21.6, §21.3, §21.5; E-12 baru §21.7 |
| §5 (pengantar) | §5.1, kolom "Lulus bila" §5.2, §5.3 -> §21.2 |
| §6.1 (dua penanda) | `check` di T1 dan `note` basis -> §21.6; sensitivitas 5 -> §21.3 |
| §6.3 | Cek draf/HS-8 -> §21.5; pengecualian (6) -> §21.4 |
| §6.5 | `G_B,klien` -> §21.7 |
| §7 | Kolom ketiga sesudah R3-F -> §21.6 |
| §11 | HS-5, HS-8 -> §21.2, §21.5, §21.4 |
| §13 | Status -> §21.9 |
| §14 | Butir 1 dan 2 -> §21.3, §21.4 |
| §15 | AS3-5 -> §21.5, §21.6; asumsi baru -> §21.9 |
| §19 | Butir 7 -> §21.11 |
| §20 | T-1..T-5 -> §21.6 |

Selain penanda di atas, frontmatter (`confidence`, `amended_by`) dan butir 7 §19 ditambahkan. Teks lain §1-§20 tidak berubah.

### 21.11 Collection log R3-H (baca saja, tanpa shell)

1. `decisions.md:440-448` (D-435..D-443).
2. `delegation_progress/coder_execution_r3_f.md` utuh.
3. `scripts/studio/studio-report.ts:1-180`, `:640-720`, `:1742-1891`, ditambah Grep `check|basis|base-rev|force-latest|BASE_CONFLICT|BASIS_MISSING|TEMPLATE_PLACEHOLDER|RECORD_FIELDS_DROPPED|AGENT_ID_OVERRIDDEN`.
4. `src/lib/studio/services/draft/md-report.ts:220-260`, `:625-699`, ditambah Grep `refRels|rujukan|initiator|<isi:`.
5. `harness_ab3/ab3.py:1-45`, `:1455-1470`, `:1755-2273`, ditambah Grep `informat|studio-report|--md-update-check|D-442`.
6. research/11 `:94-106` dan research/13 `:215-224` (definisi KE-3).
7. Grep `baseRevisionNo` di `src/app/api/studio/validate` = 0 (dasar hipotesis AS3-8).
8. Tidak ada perintah yang dijalankan; `--help` dibaca dari kode (`studio-report.ts:94-180`).
