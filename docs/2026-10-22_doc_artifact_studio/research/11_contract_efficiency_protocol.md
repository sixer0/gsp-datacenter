---
schema_version: 1.0
task_id: doc_artifact_studio
task_row: DC-03 (blueprint identification/07_document_contract_blueprint.md:290, profil :343; disesuaikan D-361)
date: 2026-10-30
agent: data-analyst
type: performance
confidence: MEDIUM (desain protokol dan ambang berdasar bukti berkas; efek nyata arm B belum diukur, n = 3 pasangan bersifat deskriptif)
inputs: identification/07_document_contract_blueprint.md (§1.4, §2, §3.2, baris DC-03/DC-37/DC-44/DC-45), decisions/decisions.md D-361, research/10_contract_corpus_inventory.md, hermes_trial/02_trial_brief.md, 02_trial_feedback.md, 03_retrial_brief.md, 03_retrial_feedback.md, C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/retrial/timing.csv (baca saja)
register_names: masterplan/05_document_contract_specs.md BELUM ADA saat berkas ini ditulis (Glob masterplan/* = 01_specs.md, 03_structural_sections_specs.md, 04_studio_ux_spec.md); nama mengikuti blueprint §2 + D-361. Bila register berbeda, register yang berlaku.
plan_draft: dilewati (baris ini docs only; tidak ada perubahan kode)
status: complete
---

# DC-03: Protokol metrik efisiensi laporan kerja agen (arm A MD lama lawan arm B JSON API Studio)

## 1. Source Tasks

| Sumber | Isi yang dipakai |
|---|---|
| Blueprint 07 baris DC-03 (`:290`) | Rumus waktu, langkah, galat format, retrieval, disk; arm A lawan arm B pada skenario sama; format timing.csv; ambang final KE-1..KE-7; 3 misi banding beralasan. Kriteria: setiap metrik punya rumus, sumber data, ambang; 3 path terverifikasi ada |
| Blueprint 07 §3.2 (`:507-524`) | Ambang usulan KE-1 (median B <= 50% A), KE-2 (B <= 70% A), KE-3 (0 tersimpan menyimpang, <= 1 4xx skema per kontrak), KE-4 (5 kueri, 5/5, lebih cepat dari grep), KE-5 (0 berkas mentah, 100% nama final + sha8), KE-6 konversi, KE-7 vonis Hermes. Acuan riwayat 298 s, ~7 s, 10-15 menit tidak dipakai sebagai ambang |
| Blueprint 07 §1.4 (`:95-106`) | AS-1 tulis lewat R04/R13/R12/R16 tanpa route tulis baru; AS-2 baca global; AS-3 butir dikunci `key`, pembaruan = kirim ulang slot `record`; AS-6 kode status ASCII; AS-7 profil `gsp-master01`, konfigurasi Hermes tidak diubah; AS-8 scanner membaca R20 |
| D-361 (`decisions/decisions.md:366`) | Tahap 1 = SATU jenis `agentWorkReport` (templat `laporan-kerja-agen`, NOTA; kerangka `record` contractRecord wajib + `content` bab berulang + `references` opsional). U-3 penulis tunggal TIDAK ditegakkan ("uji dulu sampai benar2 efektif"). U-4 korpus lama tidak dikonversi. Uji banding memakai 3 laporan kerja nyata |
| Brief tugas controller | KE-1..KE-7 minimal: waktu ujung-ke-ujung, langkah/panggilan, galat format, retrieval (R21/R22 lawan grep), disk (mentah = 0 di B), beban pikir format, kelengkapan bagian wajib |

Penomoran ulang (keputusan analis, perlu dicatat controller): KE-6 blueprint (konversi transisi) pindah sepenuhnya ke kriteria DC-37 (`:324`, sudah menagih unit teks/cardId/keputusan 100% dan 0 status ditebak). KE-7 blueprint (vonis Hermes) menjadi masukan kualitatif V-1 (bagian 4.9), bukan metrik penentu. Slot KE-6/KE-7 diisi beban pikir format dan kelengkapan bagian wajib sesuai brief controller.

## 2. Exploration & Collection Summary

### 2.1 Fakta korpus DC-01 yang dipakai (Tier 2; sumber `research/10_contract_corpus_inventory.md`)

| Fakta | Angka | Rujukan | Mengapa penting untuk protokol |
|---|---|---|---|
| Ukuran korpus | 15787 berkas `.md`, 789 folder misi | `:38`, `:44-45`, `:70-71` | Ruang cari grep arm A (KE-4) realistis seluas ini |
| Kelas laporan kerja | K1 242, K2 3, K3 337, K4 291, K5 172, K6 257, K7 784, K8 35, K9 19 | `:82-92` | Pengklasifikasi `classify` (Lampiran B) dipakai ulang untuk KE-5 |
| Struktur bagian tidak seragam | Judul ## berbeda yang hanya muncul di <=5% berkas: K3 1284/1295, K4 1377/1378, K7 2223/2224 | `:110-120` | Arm A tidak punya kerangka bersama: dasar KE-6 dimensi F7 dan KE-7 |
| Kepala tidak seragam | K3: `fm:status` 45% lawan `kv:status` 55%; kunci tanggal `title/date/tanggal/created` bercampur | `:578-604` | Dasar KE-6 dimensi F3, F4, F10 |
| Kosakata status bebas | Nilai status kepala: K3 15 nilai berbeda (complete 94, draft 69, usulan 8, ... `lihat`, `status`, `all`), K4 15 nilai (complete 141, usulan 10, needs-review 9, partial-handoff 9, ...) | `:622-640`, `:859-877` | Dasar KE-3 (status di luar set) dan KE-6 F5 |
| Kosakata verdict bebas | K3 13 nilai (PASS 67, FAIL 37, NEEDS_REVIEW 9, PARTIAL 3, COKOK 1, ...); K4 10 nilai | `:642-658`, `:879-892` | Dasar KE-6 F6; verdict berbeda dari status laporan (lihat R-2) |
| Status jarang di kepala | K1: medan status 8% berkas; K3 58%; K4 67% | `:234`, `:610`, `:847` | Kueri status lewat grep (KE-4 Q1/Q2) berisiko recall rendah |
| Id kartu stabil | `t_[0-9a-f]{8}`: K1 86%, K3 60%, K4 74% berkas; histogram panjang heks hampir semua 8 | `:290`, `:686`, `:920` | Kunci kueri Q1 dapat dijawab kedua arm; perbedaan ada di status dan konteks |
| Cara rujuk bukti campur | path berkas 91-100%, path:baris 5-11%, sha hex 26-100%, commit 2-14% | `:295-306`, `:691-702`, `:925-936` | Dasar KE-6 F8; `refs[]` documentId+pid di arm B |
| Celah DC-01 | Komentar kanban LAPOR-SELESAI di luar `docs/`; satu baris multi-kunci (`Kartu: x. Verifier: y`) hanya terbaca kunci pertama | `:2733`, `:2736` | Checker KE-3/KE-7 arm A harus memakai regex medan bertarget, bukan kunci pertama saja |

### 2.2 Pola uji Hermes sebelumnya (Tier 2)

| Fakta | Bukti | Implikasi |
|---|---|---|
| Uji pertama end-to-end 298 s, konversi 35 s | `02_trial_feedback.md:6`; `timing.log` `T0_START=1793327006` .. `T9_END=1793327304` (selisih 298) | Hermes mencatat waktu sebagai penanda epoch kasar (detik bulat); cukup untuk total, tidak untuk per langkah |
| Uji ulang: "Waktu API kumulatif 12,88 s dari 34 panggilan", "sesi retrial membentang ~602 s karena jeda pikir dan probe" | `03_retrial_feedback.md:23` | Dihitung ulang dari `timing.csv` baris 1-34 kolom 7: jumlah = 12,884 s (cocok). Jendela baris 1 `t_start` 1793336115,220 sampai baris 27 `t_end` 1793336717,306 = 602,09 s (cocok); sampai baris 34 = 712,66 s. Porsi API = 12,884 / 602,09 = 2,1%. Waktu didominasi jeda pikir agen, bukan server |
| `timing.csv` memuat DUA bentuk baris tanpa header | Baris 1-34: 7 kolom `langkah,endpoint,status,corr,t_start,t_end,dur` (mis. baris 1 `L5_create_doc,POST /api/studio/documents,201,c6cf8be4,1793336115.220,1793336115.789,0.569`). Baris 35-77: 6 kolom `langkah,t_start,dur,status,corr,catatan` (mis. baris 72 `f4_download_docx,1793338292.2845597,0.044,200,92d53136,sha_ok|bytes=2289299`) | Format harus dikunci (bagian 5). Hermes melaporkan "34 baris" (`03_retrial_feedback.md:6`), padahal berkas berisi 77 baris |
| Peringkas `timing_ringkas.py` membaca `r[1]` sebagai waktu mulai dan `r[2]` sebagai durasi | `retrial/work/timing_ringkas.py:5-7` | Hipotesis (tidak dijalankan; sesi ini tanpa shell): pada baris bentuk 7 kolom `r[1]` = endpoint sehingga `float()` gagal. Pelajaran: satu skema, satu pengurai milik controller |
| Galat buatan sendiri Hermes di uji ulang: `replaceBlock` 400, setOutline membawa `$schema` 400, kode chart di luar enum 400, `id` hasil GET content ditolak 400 | `03_retrial_feedback.md:19`, `:23`; `timing.csv` baris 17, 20, 22, 30 | Galat format pada kiriman API nyata terjadi (4 dari 34 panggilan pada dokumen kompleks). Ambang KE-3 "<= 1 per laporan" untuk laporan sederhana masuk akal, "0" tidak |
| Kedua brief mewajibkan "Jangan mengarang hasil. Bila sebuah langkah tidak bisa dijalankan, tulis alasannya" | `02_trial_brief.md:35`, `03_retrial_brief.md:44` | Diturunkan ke aturan kejujuran data bagian 8 |

## 3. Overview

Pertanyaan yang dijawab protokol: apakah menulis laporan kerja agen lewat JSON API Studio (arm B) lebih efisien dan lebih andal daripada menulis MD bebas di `docs/` (arm A), pada konten dan skenario yang sama, cukup untuk menyatakan "efektif" sesuai U-3 D-361.

Pemangku kepentingan: USER (memutuskan adopsi dan penegakan penulis tunggal), Hermes `gsp-master01` (pelaku kedua arm), controller (menyiapkan skenario, menyimpan kunci jawaban, menghitung metrik), DC-44 (menulis brief dari protokol ini), DC-45 (menjalankan uji), DC-46 (menghitung metrik), DC-37 (memakai 3 laporan yang sama untuk banding paritas).

Metodologi: desain silang berpasangan (setiap laporan dikerjakan di kedua arm), konten dipasok sebagai lembar fakta yang sama agar perbedaan yang terukur hanya berasal dari format dan mekanika, urutan diseimbangkan dengan kemiringan yang merugikan arm B, semua angka dihitung ulang controller dari berkas mentah.

Alternatif yang ditolak:
- Membiarkan Hermes menulis konten bebas di tiap arm: variansi komposisi konten akan menenggelamkan efek format (porsi API 2,1% menunjukkan waktu didominasi pikir agen).
- Membandingkan dengan angka riwayat 298 s / ~7 s: blueprint `:524` sudah melarang.
- Uji statistik inferensial: n = 3 pasangan tidak cukup; hasil dilaporkan deskriptif dengan aturan konsistensi per pasangan.

## 4. Metrik KE-1..KE-7 (rumus, sumber, cara ukur, ambang final)

Notasi: `i` = laporan uji (R-1, R-2, R-3, bagian 7); `A_i`, `B_i` = nilai pada arm A dan B untuk laporan `i`; median atas 3 pasangan. Semua waktu dari `t_start_utc`/`t_end_utc` di timing.csv (bagian 5), diambil dari jam mesin (`time.time()`), bukan estimasi.

### 4.1 KE-1 Waktu ujung-ke-ujung

- Rumus: `T_i = t_end(baris step_kind=scenario_marker, action=END) - t_start(baris step_kind=scenario_marker, action=START)` per run. Rasio `r_i = T_B,i / T_A,i`. Turunan informatif: `pikir_i = T_i - Σ dur_s` baris `tool|api|edit|read` di run itu.
- Batas run (sama untuk kedua arm): START = saat skenario diberikan ke Hermes; END = laporan final tersedia dan terverifikasi setelah pembaruan ke-2. Arm A: berkas MD ditulis dan suntingan ke-2 tersimpan. Arm B: slot `record` + bab terkirim, render HTML sukses, berkas final diunduh dan sha cocok `X-Studio-Sha256`. Render dan unduh dihitung di arm B walaupun arm A tidak punya padanannya (sengaja konservatif terhadap B).
- Di luar KE-1, dilaporkan terpisah: biaya onboarding arm B (run pemanasan W, bagian 6.3).
- Sumber: timing.csv. Cara ukur: Hermes menulis baris penanda START/END; controller menghitung dengan pengurai tunggal.
- Ambang final: LULUS bila `median(r_i) <= 0,70` DAN `max(r_i) <= 1,00`. Catatan "unggul" bila `median(r_i) <= 0,50` (ambang usulan blueprint).
- Alasan penguncian (berbeda dari usulan 0,50):
  1. Usulan blueprint mengukur siklus kontrak misi yang mencakup render+unduh tanpa padanan di arm A; definisi sekarang sebanding untuk laporan kerja.
  2. Konten dipasok sama, sehingga yang diuji hanya format+mekanika. Porsi beban format terhadap total belum pernah diukur; mengunci 50% berarti mengasumsikan porsi itu >= 50% tanpa bukti.
  3. Ada risiko arah sebaliknya yang belum terukur: payload JSON lebih panjang dalam token daripada MD (kunci, kutip, escape), sehingga waktu generate arm B bisa lebih lama.
  4. Dengan n = 3, syarat `max <= 1,00` (tidak ada pasangan yang B lebih lambat) melindungi dari median yang kebetulan bagus.
- Confidence MEDIUM. Evidence: porsi API 2,1% dari `timing.csv` baris 1-27; blueprint `:511`, `:524`. Implication: efisiensi arm B, bila ada, akan datang dari berkurangnya jeda pikir format, bukan dari kecepatan server.

### 4.2 KE-2 Jumlah langkah/panggilan

- Rumus: `N_i = count(baris dengan step_kind ∈ {tool, api, edit, read})` antara START dan END. Rasio `s_i = N_B,i / N_A,i`. Rincian per `step_kind` wajib dilaporkan.
- Sumber: timing.csv (satu baris per aksi, termasuk aksi gagal dan ulangan). Silang: log sesi Hermes (jumlah tool call) bila tersedia; selisih dicatat, tidak dikoreksi diam-diam.
- Ambang final: LULUS bila `median(s_i) <= 1,00` (non-inferior). Bersifat ADVISORI: gagal KE-2 saja tidak menggagalkan vonis, tetapi wajib menghasilkan baris lanjutan (mis. CLI pembungkus yang menggabungkan draft-check + kirim + render).
- Alasan (berbeda dari usulan 0,70): perkiraan aksi arm A untuk laporan ini kecil (tulis 1 + sunting 2 + baca/ukur 2-4), sedangkan arm B memerlukan draft-check, kirim `record`, kirim bab, 2 pembaruan, render, unduh (sekitar 8-10). Mengunci 0,70 berarti menetapkan ambang yang hampir pasti gagal karena desain alur, bukan karena friksi. Biaya per aksi API kecil (median durasi baris 1-34 timing.csv di bawah 0,25 s). Klaim D-344 menyangkut "effort untuk thinking", yang diukur KE-6, bukan jumlah panggilan. Perkiraan jumlah aksi ini hipotesis dan harus diganti angka terukur.
- Confidence MEDIUM.

### 4.3 KE-3 Galat format

- Rumus:
  - `G_B,stored` = jumlah laporan arm B yang `GET content` R20-nya, saat dikirim ulang dry-run ke R08, menghasilkan `valid=false`.
  - `G_B,4xx,i` = jumlah respons 4xx berkode skema/kontrak (`SCHEMA_INVALID`, `CONTRACT_*`, `DISPLAY_FIELD`, kode register lain) pada run B laporan `i`.
  - `G_B,draft,i` = jumlah blok `json` yang gagal draft-check/R23. Dilaporkan saja, tidak dihukum, karena inilah jaring pengaman yang dimaksud D-346.
  - `G_A,i` = jumlah butir checklist format yang dilanggar laporan MD arm A. Checklist sama dengan aturan register untuk `contractRecord` jenis `agentWorkReport`: status ada dan dalam set tertutup; owner ada; >= 1 cardId berpola; tanggal ISO; >= 1 rujukan bukti; setiap bagian wajib ada.
- Sumber: timing.csv (`http_status`, `err_code`), keluaran R08 dry-run per dokumen B, keluaran checker arm A (skrip controller, regex medan bertarget dari DC-01 Lampiran A, bukan "kunci pertama", karena celah `:2736`).
- Ambang final: LULUS bila `G_B,stored = 0` (KERAS) DAN `Σ_i G_B,4xx,i <= 3` dengan `max_i G_B,4xx,i <= 2` DAN `Σ G_B < Σ G_A`. Bila `Σ G_A = 0`, catat "tidak ada keunggulan format teramati", tanpa menggagalkan.
- Alasan: 0 tersimpan menyimpang adalah klaim by-construction blueprint (`:513`) dan harus terbukti. Untuk 4xx dipakai `<= 1 per laporan` rata-rata dengan toleransi 2 pada satu laporan, karena uji ulang mencatat 4 galat 400 buatan sendiri dalam 34 panggilan (`03_retrial_feedback.md:23`) dan laporan R-3 panjang (247 baris).
- Confidence HIGH untuk definisi, MEDIUM untuk ambang 4xx.

### 4.4 KE-4 Keberhasilan retrieval

- Lima kueri baku dijalankan oleh Hermes dalam sesi BARU (peran konsumen), setelah keenam run selesai:

| Q | Pertanyaan | Arm B (alat) | Arm A (alat) |
|---|---|---|---|
| Q1 | Status terkini laporan kerja untuk kartu X | R21 `cardId=X` (+ `kind=agentWorkReport`) | grep `t_X` di `workspace/docs`, baca baris status |
| Q2 | Daftar laporan berstatus S di misi M | R21 `mission=M&status=S` | grep di folder misi M |
| Q3 | Paragraf yang memuat istilah Z (mis. identifier kode dari R-3) | R22 `q=Z` → documentId + pid + address | `grep -rn Z` → path:baris |
| Q4 | Laporan milik owner O di misi M | R21 `owner=O&mission=M` | grep nama agen/penulis |
| Q5 | Buka paragraf bukti yang dirujuk laporan L (documentId+pid dari `refs[]`, atau path:baris di arm A) | R20/R16 GET per pid | buka path, cari baris |

- Rumus per kueri `q`: `benar_q = 1` bila himpunan hasil = himpunan kunci jawaban persis (presisi = recall = 1), selain itu 0. Laporkan juga presisi dan recall. `t_q` = jumlah `dur_s` + jeda antara penanda START/END kueri. `Skor = Σ benar_q`.
- Kunci jawaban: ditulis controller SEBELUM sesi konsumen dari keadaan DB DEV + folder uji. sha256 kunci jawaban dicatat di `decisions/decisions.md` sebelum kueri dijalankan.
- Ruang cari: arm A = seluruh `C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/` (15787 `.md`, DC-01 `:45`), sesuai praktik nyata. Arm B = seluruh DB DEV, dengan filter misi hanya bila pertanyaan menyebut misi.
- Sumber: `retrieval.csv` (bagian 5.3) + timing.csv.
- Ambang final: LULUS bila arm B `Skor = 5/5` (KERAS) DAN `median_q t_q(B) <= median_q t_q(A)`. Skor arm A dilaporkan sebagai baseline.
- Alasan: kueri menurut cardId/status/owner adalah tujuan kolom cermin terindeks (blueprint §2.3, §2.4). Satu jawaban salah berarti indeks atau filter keliru, jadi 5/5 bukan ambang yang berlebihan. Grep bisa saja lebih cepat secara mentah, sehingga syarat waktu memakai median, bukan setiap kueri.
- Confidence MEDIUM. Evidence: status di kepala hanya 8% (K1) sampai 67% (K4) berkas, dan nilai status bebas (`:234`, `:847`, `:622-640`). Implication: recall arm A untuk Q1/Q2 diperkirakan < 1 (hipotesis yang diuji, bukan asumsi kelulusan).

### 4.5 KE-5 Jejak disk

- Rumus:
  - `D_raw,B` = jumlah berkas BARU di folder uji arm B yang (a) diklasifikasikan K2-K9 oleh fungsi `classify` DC-01 (Lampiran B, dipakai ulang tanpa ubahan), atau (b) berisi payload `studio.*`/`"type": "contractRecord"` di luar format draf, atau (c) berkas MD laporan yang bukan draf.
  - Draf sah (D-346) = MD berkepala ringkas + >= 1 blok `json` yang LULUS draft-check. Draf yang gagal draft-check dihitung sebagai mentah.
  - `F_name` = persentase berkas final yang cocok regex `^[A-Za-z0-9.-]{1,80}_rev[1-9][0-9]*_[0-9]{8}T[0-9]{6}Z_[0-9a-f]{8}\.(docx|pdf|html)$` (blueprint `:219`).
  - `F_sha` = persentase berkas final yang sha8-nya = 8 heksa awal sha256 berkas = `X-Studio-Sha256` R10.
  - Arm A: hitung berkas laporan yang dibuat (baseline, biasanya 1 per run plus berkas pendamping).
- Cara ukur: controller mengambil listing + sha256 folder uji sebelum dan sesudah tiap run (perintah `find <folder> -type f -newer <penanda>` dan `sha256sum`), lalu menghitung selisihnya. K1 `PHASE-REPORTS.md` dikecualikan karena di luar cakupan tahap 1 D-361. Hermes masih menulis berkas orkestrasi lain (kontrak, PHASE-REPORTS) seperti di uji ulang (`03_retrial_feedback.md:1`).
- Ambang final: LULUS bila `D_raw,B = 0` (KERAS) DAN `F_name = 100%` DAN `F_sha = 100%`.
- Alasan: D-345 ("tanpa versi mentah di disk") dan risiko R2 blueprint (`:531`). Karena U-3 tidak menegakkan penulis tunggal secara teknis, KE-5 adalah satu-satunya bukti kepatuhan.
- Confidence HIGH.

### 4.6 KE-6 Beban pikir format

- Rumus utama (statis, dapat dicek mekanis): `FD = Σ_{d=1..10} [dimensi d harus diputuskan sendiri oleh agen karena arm tidak menetapkan aturannya]`, dinilai dari artefak + aturan arm. Dimensi diturunkan dari keragaman korpus DC-01:

| d | Dimensi keputusan format | Bukti keragaman (DC-01) | Arm B menetapkan lewat |
|---|---|---|---|
| F1 | Nama berkas | K3 >= 8 pola teratas, K4 >= 8 (`:98-99`) | Nama final mesin (§2.5) |
| F2 | Lokasi/folder | K7 tersebar di folder `verification/verif/verifikasi/verify` (`:90`) | Tidak ada berkas; DB + unduhan |
| F3 | Bentuk kepala (frontmatter, kv, prosa) | K3 `fm:status` 45% / `kv:status` 55% (`:580-581`) | Slot `record` |
| F4 | Nama kunci kepala | `title/date/tanggal/created`, `kartu/task_ref` (`:582-604`, `:820-829`) | Skema `contractRecord` |
| F5 | Kosakata status | 15 nilai K3, 15 nilai K4 (`:622-640`, `:859-877`) | Set tertutup register |
| F6 | Kosakata verdict | 13 nilai K3, 10 nilai K4 (`:642-658`, `:879-892`) | Konten bab atau medan register (DC-02 memutuskan) |
| F7 | Struktur dan urutan bagian | 1284/1295 judul K3 hanya di <=5% berkas (`:114`) | Outline wajib templat |
| F8 | Bentuk rujukan bukti | path, path:baris, sha, commit bercampur (`:691-702`) | `refs[]` documentId+pid+rel |
| F9 | Notasi id kartu | `t_` heks bercampur label `FIX-E3`, `R2-A` (`:687`, `:921`) | Pola `cardIds` |
| F10 | Format tanggal/waktu | ISO, WIB, label giliran (`:850-851`) | `YYYY-MM-DD`/UTC ISO |

- Rumus pendamping (proses): `FL` = jumlah aksi baca yang bertujuan mencari format (membaca laporan lama sebagai contoh, membaca panduan/registri/contoh skema) antara START dan END; ditandai `step_kind=read` + `note=format_lookup` oleh Hermes. Ditambah swalapor terstruktur: setelah tiap run Hermes mendaftar setiap momen ia memutuskan bentuk, bukan isi. Swalapor diberi label "swalapor" dan tidak dipakai sebagai satu-satunya bukti.
- Ambang final: LULUS bila `FD_B <= 2` untuk setiap laporan DAN `median FL_B <= median FL_A` (run pemanasan W tidak dihitung). `FD_A` dilaporkan sebagai baseline (diharapkan 10).
- Alasan: D-344 ("hermes tidak perlu effort untuk thinking lagi") adalah klaim inti. `FD` statis lemah bila berdiri sendiri karena by construction, maka `FL` ditambahkan sebagai bukti perilaku yang dapat dihitung dari timing.csv. Toleransi 2 menampung F6 (verdict) dan judul bab bebas di dalam `content`, sampai register DC-02 memutuskan.
- Confidence MEDIUM (operasionalisasi "beban pikir" adalah proksi; asumsi tercatat di bagian 10).

### 4.7 KE-7 Kelengkapan bagian wajib (+ kelengkapan fakta)

- Rumus:
  - `K_i = |elemen wajib yang hadir| / |elemen wajib|`. Elemen wajib = medan wajib `contractRecord` + bab wajib outline `laporan-kerja-agen` menurut register DC-02.
  - Selama register belum ada, dipakai himpunan sementara dari korpus: `status`, `owner`, >= 1 `cardIds`, `opened`, >= 1 rujukan bukti; bab ringkasan, artefak, verifikasi/gerbang, batas. Dasarnya: K2 `artefak`/`gerbang`/`pemetaan kontrak` di 67% berkas (`:113`); K3 `ringkasan` 18%, `verifikasi` 11%, `artefak` 9% (`:528-530`).
  - Arm B: diambil dari `completeness` Studio (INCOMPLETE + daftar hilang) dan dicek silang dengan checker. Arm A: checker yang sama atas MD.
  - `KF_i` (kelengkapan fakta) = fakta lembar fakta (bagian 6.2) yang muncul di laporan / total fakta. Diperiksa per id fakta oleh skrip pencocok string-kunci, dengan sampel manual 100% untuk fakta angka.
- Ambang final: LULUS bila `K_B,i = 100%` untuk 3/3 (KERAS) DAN `KF_B,i = 100%` DAN `KF_B,i >= KF_A,i`.
- Alasan: render penuh menolak dokumen tidak lengkap (409 `DOCUMENT_INCOMPLETE`, KS-4 `:498`), jadi 100% harus tercapai. `KF` mencegah arm B tampak cepat karena membuang isi.
- Confidence HIGH untuk rumus; himpunan wajib sementara LOW sampai register terbit.

### 4.8 Aturan vonis gabungan ("efektif" menurut U-3)

| Hasil | Syarat |
|---|---|
| EFEKTIF | KE-3 (`G_B,stored = 0`), KE-4 (5/5), KE-5 (`D_raw,B = 0`), KE-7 (`K_B = 100%`) semua LULUS, ditambah KE-1 LULUS dan KE-6 LULUS. KE-2 advisori |
| TIDAK EFEKTIF (perlu perbaikan) | Salah satu gerbang KERAS gagal: setiap kegagalan menjadi baris perbaikan, lalu uji ulang (maksimal 3 siklus per kriteria, lalu eskalasi ke USER) |
| NETRAL (keputusan USER) | Semua gerbang KERAS lulus, tetapi KE-1 atau KE-6 gagal. Data disajikan ke USER via controller: andal tetapi tidak lebih hemat |

### 4.9 V-1 Vonis Hermes (kualitatif, bukan penentu)

Hermes menjawab "layak jalur utama laporan kerja" atau memberi daftar syarat sempit (pola `03_retrial_feedback.md:34-35`). Bila vonis Hermes bertentangan dengan metrik, keduanya disajikan ke USER tanpa didamaikan.

## 5. Format berkas data

### 5.1 timing.csv (satu skema, ber-header, UTF-8, pemisah koma, LF)

Lokasi: `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/contract/timing.csv` (folder baru di area kerja uji; DC-44 boleh mengubah path di brief). Satu berkas untuk semua run, hanya ditambah (append-only).

| # | Kolom | Tipe / nilai | Wajib |
|---|---|---|---|
| 1 | `run_id` | `W`, `R1A`, `R1B`, `R2A`, `R2B`, `R3A`, `R3B`, `Q` (konsumen) | ya |
| 2 | `arm` | `A` / `B` / `-` | ya |
| 3 | `report_id` | `R-1` / `R-2` / `R-3` / `W` / `-` | ya |
| 4 | `order` | urutan run dalam jadwal (1..8) | ya |
| 5 | `session_id` | id sesi Hermes (bukan rahasia) | ya |
| 6 | `seq` | nomor urut baris dalam run (1, 2, ...); ulangan = baris baru | ya |
| 7 | `step_id` | label langkah skenario (`S0`..`S5`, `Q1`..`Q5`) + sufiks bebas | ya |
| 8 | `step_kind` | `scenario_marker` / `tool` / `api` / `edit` / `read` / `query` | ya |
| 9 | `action` | `START`/`END` untuk penanda; metode+route untuk API; nama alat untuk tool | ya |
| 10 | `target` | path berkas (A) atau documentId/route (B); tanpa rahasia | bila ada |
| 11 | `http_status` | angka; kosong untuk non-API | bila API |
| 12 | `corr_id` | `x-correlation-id` | bila API |
| 13 | `t_start_utc` | epoch detik, 3 desimal (konvensi uji ulang) | ya |
| 14 | `t_end_utc` | epoch detik, 3 desimal | ya |
| 15 | `dur_s` | `t_end_utc - t_start_utc`, 3 desimal | ya |
| 16 | `ok` | `1` / `0` | ya |
| 17 | `err_code` | kode galat terstruktur (mis. `SCHEMA_INVALID`) | bila gagal |
| 18 | `bytes` | ukuran berkas yang ditulis/diunduh | bila ada |
| 19 | `sha16` | 16 heksa awal sha256 berkas yang ditulis/diunduh | bila ada |
| 20 | `note` | bebas, tanpa koma (pakai `;`); penanda `format_lookup` untuk KE-6 | tidak |

Contoh baris (ILUSTRASI FORMAT, bukan data ukur):

```
run_id,arm,report_id,order,session_id,seq,step_id,step_kind,action,target,http_status,corr_id,t_start_utc,t_end_utc,dur_s,ok,err_code,bytes,sha16,note
R1B,B,R-1,1,s-20261031-01,1,S0,scenario_marker,START,,,,1793400000.000,1793400000.000,0.000,1,,,,
R1B,B,R-1,1,s-20261031-01,2,S0,read,GET /api/studio/registry?kind=contracts,R03,200,1a2b3c4d,1793400003.120,1793400003.210,0.090,1,,,,format_lookup
R1B,B,R-1,1,s-20261031-01,3,S1,tool,draft-check,draf/r1.md,,,1793400041.500,1793400042.100,0.600,0,CONTRACT_STATUS_INVALID,,,blok 1 baris 7
R1B,B,R-1,1,s-20261031-01,4,S1,api,POST /api/studio/slots,record,201,5e6f7a8b,1793400060.010,1793400060.240,0.230,1,,,,
R1A,A,R-1,2,s-20261031-02,5,S2,edit,patch,docs/<misi-uji>/<kartu>/LAPORAN.md,,,1793401200.400,1793401200.450,0.050,1,,5821,92a60eca7944055b,
R1B,B,R-1,1,s-20261031-01,12,S4,api,GET /api/studio/files/{id},R10,200,9c0d1e2f,1793400190.300,1793400190.344,0.044,1,,10234,55d324b1aa00bb11,sha_ok
R1B,B,R-1,1,s-20261031-01,13,S4,scenario_marker,END,,,,1793400190.400,1793400190.400,0.000,1,,,,
```

Aturan: baris 1 = header persis seperti di atas; jumlah kolom setiap baris = 20 (dicek pengurai, baris cacat dilaporkan, tidak dibuang diam-diam); rahasia `x-internal-secret` tidak pernah masuk kolom mana pun.

### 5.2 Penanda waktu

Hermes menulis `scenario_marker START` sebagai aksi pertama setelah menerima skenario dan `END` setelah verifikasi akhir run. Jeda pikir tidak dicatat sebagai baris; nilainya diturunkan (4.1).

### 5.3 retrieval.csv

`q_id,arm,query_text,tool_call,result_ids,expected_sha256,precision,recall,correct,t_start_utc,t_end_utc,dur_s,note`. `result_ids` = documentId[#pid] (B) atau path[:baris] (A), dipisah `;`. `precision`/`recall`/`correct` diisi controller dari kunci jawaban, bukan oleh Hermes.

### 5.4 Snapshot disk

`disk_<run_id>_{pre,post}.txt` berisi `sha256  bytes  path` per berkas folder uji. Ditulis controller.

## 6. Desain skenario dan penyeimbangan

### 6.1 Prinsip

- Skenario identik di kedua arm. Yang berbeda hanya media tulis: A = MD bebas di folder uji `docs/`, B = JSON API Studio (draf MD boleh, D-346).
- Konten dipasok sebagai lembar fakta yang sama, sehingga komposisi isi tidak menjadi variabel.
- Lingkungan beku: DEV 9021 di-restart controller sebelum uji dan kode server dibekukan selama uji (P-2 `:111`); profil `gsp-master01`; konfigurasi dan kredensial Hermes tidak diubah (AS-7); port 9011 dan DB produksi tidak disentuh.
- Folder uji terpisah per run (mis. `2026-MM-DD_kerja-r1a`, `..._kerja-r1b`) agar KE-5 dapat dihitung per run.

### 6.2 Lembar fakta (disiapkan controller/DC-44 sebelum uji)

Untuk setiap R-i, fakta diekstrak dari laporan nyata ke tiga kelompok bernomor:
- `F-awal`: identitas, kartu, owner, ringkasan, artefak.
- `F-upd1`: hasil gerbang/verifikasi.
- `F-upd2`: penutupan status dan batas.

Setiap fakta punya id (`R1-F01` ...) untuk KE-7 `KF`. Lembar fakta tidak memuat format laporan asli (tanpa judul, tanpa kepala), agar arm A tidak sekadar menyalin bentuk lama.

### 6.3 Langkah per run (sama untuk A dan B)

| Langkah | Isi | Arm A | Arm B |
|---|---|---|---|
| S0 | START; terima skenario + lembar fakta | penanda | penanda |
| S1 | Tulis laporan kerja awal, status `running` (kode dari register), isi `F-awal` | tulis MD | draf (opsional) + draft-check + R04/R13 `record` + R12 bab |
| S2 | Pembaruan 1: tambah `F-upd1` | sunting MD | R12/R16 atau kirim ulang slot (AS-3, `baseRevisionNo`) |
| S3 | Pembaruan 2: status penutupan (kode register, padanan `complete` di korpus) + `F-upd2` | sunting MD | kirim ulang `record` + bab/pid |
| S4 | Terbitkan | (tidak ada; MD = final) | render HTML + unduh R10 + cocokkan sha + nama final |
| S5 | END | penanda | penanda |

Run pemanasan W (arm B saja, tidak dinilai): laporan latihan dari lembar fakta sintetis kecil. Fungsinya menyerap biaya membaca panduan §1.1 dan registri sekali. Waktunya dilaporkan sebagai "biaya onboarding". Arm A tidak diberi pemanasan karena merupakan kebiasaan lama Hermes. Ini menyeimbangkan keakraban, bukan memberi keuntungan.

### 6.4 Urutan dan penyeimbangan

| order | run | catatan |
|---|---|---|
| 0 | W (B) | pemanasan, tidak dinilai |
| 1-2 | R1B lalu R1A | B lebih dulu |
| 3-4 | R2A lalu R2B | A lebih dulu |
| 5-6 | R3B lalu R3A | B lebih dulu |
| 7 | Q (konsumen) | sesi baru, 5 kueri x 2 arm, urutan arm per kueri bergantian (Q1 A-B, Q2 B-A, Q3 A-B, Q4 B-A, Q5 A-B) |

- Dengan 3 laporan, keseimbangan sempurna tidak mungkin (2:1). Slot "lebih dulu" ganda diberikan ke arm B. Run pertama atas suatu lembar fakta tidak mendapat efek belajar isi, sehingga kemiringan merugikan B dan vonis yang lulus lebih dapat dipercaya.
- Setiap run memakai sesi Hermes baru (tanpa konteks percakapan run sebelumnya). Memori persisten Hermes tidak diubah (AS-7) dan dicatat sebagai pengganggu yang tidak dapat dikendalikan.
- Analisis melaporkan rasio per pasangan beserta urutannya, sehingga pembaca dapat melihat apakah efek mengikuti urutan.

## 7. Tiga laporan kerja nyata Hermes untuk uji banding (dipakai juga oleh DC-37)

| id | Path (relatif `C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/`) | Kelas DC-01 | Agen / kartu | Baris | Bentuk kepala | Alasan pemilihan |
|---|---|---|---|---|---|---|
| R-1 | `2026-10-04-prompt-manual/_work/t_ac989baa/LAPORAN-SELESAI.md` | K2 | gsp-document-writer (`:53`), kartu `t_ac989baa` (judul `:1`) | 53 | Baris tunggal `STATUS: complete` (`:3`) | Laporan selesai pekerja paling kanonis; judul `## Artefak`, `## Gerbang`, `## Pemetaan kontrak` (`:5`, `:11`, `:29`) = judul K2 yang ada di 67% berkas; sha16 `92a60eca7944055b` (`:8`) memberi istilah unik untuk Q3; pendek |
| R-2 | `2026-10-12-game-success-formula/verification/01_verifier_report.md` | K3 (juga di folder `verification/`) | gsp-thinker sebagai verifier (`:4`), kartu `t_40cefa7e` (`:3`) | 80 | Butir kv multi-kunci dalam satu baris (`Misi: ... \| Kartu: ... \| Tanggal jalan: ...`, `:3`); tanpa baris STATUS | Laporan verifikasi; 15 baris `CHECK n:` + `VERDICT: FAIL` (`:30`) dengan dua NEEDS_REVIEW, sehingga menguji pemisahan status laporan dari verdict (F6); banyak rujukan sha (`:5`); menguji celah DC-01 `:2736` (baris multi-kunci) |
| R-3 | `2026-10-10-tracero-dispatcher-1010/laporan.md` | K4 | gsp-system-manager (`:3`), kartu `t_57ff71c4` (`:4`) | 247 | Pembuka prosa 9 baris, lalu `STATUS: complete` (`:11`) | Laporan diagnosis/ops; tabel vonis (`:21-27`), blok kode (`:68-77`), banyak id kartu di badan (`t_28c5ea2b`, `t_96c17250`, `t_183558d8`, `t_496d0386`; `:43-66`), sehingga menguji `cardIds` jamak dan `items[]`; identifier kode `KANBAN_TERMINAL_TIMEOUT_GRACE_SECONDS` (`:23`) untuk Q3; panjang |

Sebaran yang dicapai: 3 peran agen, 3 misi, 3 kelas (K2/K3/K4), 3 bentuk kepala, panjang 53/80/247 baris, tanggal 2026-10-04..13. Semua di luar folder `backup*`.

Yang tidak dipilih, beserta alasannya:
- K1 `PHASE-REPORTS.md`: log entri fase, lebih dekat ke jenis `phaseReport` yang ditunda D-361.
- K5/K6 countersign/verdict: tercakup oleh pola laporan verifier R-2.
- K8 checkpoints: tetap MD menurut D-346 dan konsultasi B (`03_retrial_feedback.md:41`).
- K9 handoff: n = 19 di 2 misi.
- `2026-08-24_fleet_test/.../execution_report.md` (DC-01 `:706`): uji asap, bukan kerja nyata.

Verifikasi keberadaan path. Sesi analis ini tidak memiliki alat shell (Bash), sehingga `ls`/`test -f` TIDAK dijalankan dan keluarannya tidak dikutip. Sebagai gantinya dipakai alat Glob dan Read, yang memeriksa sistem berkas yang sama. Keluaran apa adanya:

```
Glob pattern=2026-10-04-prompt-manual/_work/t_ac989baa/LAPORAN-SELESAI.md path=C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs
-> C:\Users\TRIAL\workspace\gsp-hermes\workspace\docs\2026-10-04-prompt-manual\_work\t_ac989baa\LAPORAN-SELESAI.md
Glob pattern=2026-10-12-game-success-formula/verification/01_verifier_report.md path=(sama)
-> C:\Users\TRIAL\workspace\gsp-hermes\workspace\docs\2026-10-12-game-success-formula\verification\01_verifier_report.md
Glob pattern=2026-10-10-tracero-dispatcher-1010/laporan.md path=(sama)
-> C:\Users\TRIAL\workspace\gsp-hermes\workspace\docs\2026-10-10-tracero-dispatcher-1010\laporan.md
Grep pattern=^ output_mode=count (01_verifier_report.md) -> 80 ; (laporan.md) -> 247
Read LAPORAN-SELESAI.md -> 53 baris (baris terakhir 53)
```

Perintah yang harus dijalankan ulang controller sebagai bukti shell (gerbang DC-03 "terverifikasi ada"):

```
cd C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs && for f in 2026-10-04-prompt-manual/_work/t_ac989baa/LAPORAN-SELESAI.md 2026-10-12-game-success-formula/verification/01_verifier_report.md 2026-10-10-tracero-dispatcher-1010/laporan.md; do test -f "$f" && echo "ADA $(wc -c <"$f") B $f" || echo "HILANG $f"; done
```

Catatan untuk DC-37/DC-44: workspace Hermes hidup (DC-01 `:38`). Sebelum uji, sha256 ketiga berkas dicatat dan dicek ulang saat uji. Perubahan sha harus dilaporkan, bukan diabaikan.

## 8. Aturan kejujuran data

1. Tidak ada angka yang dikarang. Waktu berasal dari jam mesin. Nilai yang tidak terukur ditulis kosong + `note` alasannya, tidak diimputasi.
2. Setiap aksi, termasuk yang gagal, ditulis sebagai baris (`ok=0`, `http_status`, `err_code`, `corr_id`). Ulangan ditulis sebagai baris baru dengan `seq` berikutnya, tidak menimpa baris lama.
3. Run yang batal tetap dicatat. Pasangannya dinilai gagal untuk KE-1. Run ulang hanya boleh dengan alasan tercatat di `decisions/decisions.md`. Kedua percobaan disimpan, dan analisis utama memakai percobaan sah PERTAMA (larangan memilih run terbaik).
4. Kunci jawaban KE-4 dan lembar fakta KE-7 dibekukan sebelum run dengan sha256 tercatat. Mengubahnya setelah melihat hasil dilarang.
5. Semua metrik dihitung controller (atau DC-46) dari berkas mentah dengan satu pengurai. Angka naratif Hermes tidak menggantikan CSV. Bila berbeda, yang dipakai CSV dan selisihnya dilaporkan (preseden: "34 baris" lawan 77 baris berkas nyata).
6. Swalapor Hermes (KE-6, V-1) diberi label "swalapor".
7. Rahasia uji tidak dicetak di CSV, log, atau laporan (preseden `02_trial_brief.md:6`). Pindai rahasia atas semua berkas data sebelum diserahkan (regex DC-01 `:2728`).
8. Bila server berubah atau di-restart di tengah uji, run yang terdampak ditandai dan dikecualikan dari analisis utama dengan alasan tercatat (risiko R12 blueprint `:541`).
9. Hasil yang tidak menguntungkan arm B dilaporkan sama lengkapnya. Kategori NETRAL disajikan ke USER, tidak dibulatkan menjadi lulus.

## 9. Files/Modules Involved

| Berkas | Peran | Penulis |
|---|---|---|
| `research/11_contract_efficiency_protocol.md` | protokol ini | data-analyst (DC-03) |
| `hermes_trial/04_contract_trial_brief.md` | brief uji dari protokol ini | DC-44 |
| `Temp/hermes_trial/contract/timing.csv`, `retrieval.csv`, `disk_*.txt` | data mentah | Hermes (timing), controller (retrieval scoring, disk) |
| `test/19_contract_md_parity.md` | banding paritas 3 laporan yang sama | DC-37 |
| `masterplan/05_document_contract_specs.md` | set status, outline wajib, kode galat yang dirujuk KE-3/KE-7 | DC-02 |

## 10. Asumsi dan celah (Tier 1)

| ID | Asumsi/celah | Dampak bila keliru |
|---|---|---|
| A-1 | Outline wajib dan set status `agentWorkReport` diputuskan DC-02; himpunan sementara bagian 4.7 hanya pengganti | KE-3/KE-7 dihitung ulang dengan register |
| A-2 | R21 mendukung filter `owner` dan `cardId` untuk jenis `agentWorkReport` (blueprint §2.4 `:204`) | Q4/Q1 harus diganti kueri setara |
| A-3 | Hermes dapat menulis penanda START/END dan baris per aksi dengan skema 20 kolom (dibuktikan sebagian oleh `timing.csv` uji ulang) | Bila tidak, controller membungkus panggilan lewat driver pencatat |
| A-4 | Memori persisten Hermes tidak di-reset (AS-7); efek belajar lintas sesi tidak dapat dihapus | Ditangani lewat kemiringan urutan yang merugikan B |
| A-5 | Jumlah token keluaran per run tidak tersedia dari Hermes | Kolom tidak ditambahkan. Bila log Hermes memuatnya, dilaporkan sebagai data tambahan |
| G-1 | n = 3 pasangan: hasil deskriptif, tanpa uji signifikansi | Vonis memakai aturan konsistensi per pasangan, confidence MEDIUM |
| G-2 | Ambang KE-1 0,70 dan KE-2 1,00 menyimpang dari usulan blueprint (0,50 / 0,70) dengan alasan 4.1/4.2 | Controller mencatat penyimpangan ini sebagai keputusan; USER dapat mengembalikan ke usulan |

## 11. Risks

| # | Risiko | Mitigasi |
|---|---|---|
| RK-1 | Payload JSON lebih panjang dalam token sehingga arm B lebih lambat | KE-1 `max <= 1,00` membuatnya terlihat; vonis NETRAL ke USER |
| RK-2 | Arm A menyalin bentuk laporan asli sehingga beban format tampak rendah | Lembar fakta tanpa bentuk asli (6.2) |
| RK-3 | Dua bentuk baris CSV terulang | Skema 20 kolom + header + pengurai menolak baris cacat (5.1) |
| RK-4 | DB DEV berisi dokumen lain sehingga kunci jawaban KE-4 meleset | Kunci dibuat dari snapshot DB tepat sebelum sesi Q |
| RK-5 | Workspace Hermes berubah | sha256 ketiga laporan dicatat sebelum uji (bagian 7) |

## 12. Acceptance Criteria (untuk berkas ini, cek DC-03 `:290`)

- [x] Setiap metrik KE-1..KE-7 punya rumus, sumber data, cara ukur, ambang final beralasan (bagian 4).
- [x] Format timing.csv dikunci dengan kolom dan contoh baris (bagian 5).
- [x] Skenario sama untuk kedua arm dengan urutan seimbang (bagian 6).
- [x] 3 laporan kerja nyata dipilih beralasan; keberadaannya diverifikasi Glob/Read. Bukti `test -f` shell menunggu controller (bagian 7).
- [x] Aturan kejujuran data (bagian 8).

## 13. Recommendations

1. DC-02: masukkan ke register set status `agentWorkReport` yang mencakup padanan nilai korpus dominan. Bukti: `complete` 141/197 (K4), 94/200 (K3), 213/232 (R1); `draft` 69/200 (K3); `needs-review`, `blocked` (`:622-640`, `:859-877`, `:137`). Putuskan pula apakah verdict (PASS/FAIL/NEEDS_REVIEW) menjadi medan `contractRecord` atau tetap isi bab (F6).
2. Controller: catat penomoran ulang KE dan penyimpangan ambang KE-1/KE-2 di `decisions/decisions.md` sebelum DC-44.
3. DC-44: salin skema timing.csv bagian 5.1 apa adanya ke brief, dan sertakan driver pencatat milik controller sebagai cadangan A-3.
4. DC-46: satu skrip pengurai menghitung semua KE dari berkas mentah. Jangan memakai ulang `timing_ringkas.py`, karena hanya cocok untuk satu bentuk baris.

## 14. Collection Log (analis)

1. Read blueprint 07 baris 1-280 dan 485-544. Grep `DC-03` menemukan baris `:290`, `:343`.
2. Read `decisions.md:360-368` (D-355..D-361).
3. Read `research/10_contract_corpus_inventory.md` baris 1-990, 2083-2122, 2721-2742 (bagian K1-K4, ringkasan 3.x, bagian 5-8).
4. Read `hermes_trial/02_trial_brief.md`, `02_trial_feedback.md`, `03_retrial_brief.md`, `03_retrial_feedback.md`; Read `retrial/timing.csv` (77 baris), `hermes_trial/timing.log`, `retrial/work/timing_ringkas.py`. Penjumlahan kolom 7 baris 1-34 dilakukan manual dari angka yang terbaca (12,884 s).
5. Glob `masterplan/*`: register 05 belum ada (dua kali, di awal dan sesaat sebelum menulis).
6. Glob + Read + Grep count atas 3 laporan Hermes (baca saja). Tidak ada tulisan ke workspace Hermes.
7. Penyimpangan prosedur: berkas ini ditulis langsung dengan alat Write ke path final. Pola "berkas sementara lalu rename" tidak dapat dijalankan karena sesi ini tanpa alat shell/rename. Membuat berkas sementara akan meninggalkan sisa yang tidak bisa dihapus.
