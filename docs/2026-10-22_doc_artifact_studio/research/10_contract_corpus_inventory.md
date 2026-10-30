---
task_id: doc_artifact_studio
task_row: DC-01 (blueprint identification/07_document_contract_blueprint.md; disesuaikan D-361)
date: 2026-10-30
agent: data-collector
items_collected: 12 kelas berkas dihitung (9 kelas laporan kerja Hermes K1-K9 + 3 kelas pembanding repo R1-R3); 15787 berkas .md Hermes dipindai; 5 contoh berpath per kelas
sumber_baca_saja: C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/
snapshot_utc: 2026-10-30T10:20:01Z .. 2026-10-30T10:20:19Z
status: complete
---

# DC-01: Inventaris korpus LAPORAN KERJA agen (Hermes) + format laporan agen repo ini

## 1. Task Overview

- Permintaan: kumpulkan fakta saja tentang laporan kerja tiap agen yang biasa ditulis di `docs/` (laporan eksekusi/implementasi per agen, `PHASE-REPORTS.md`, LAPOR-FASE, LAPOR-SELESAI, laporan verifikasi/review/uji, checkpoint). Tanpa analisis atau saran desain. Fokus ditetapkan USER D-361.
- Sumber BACA-SAJA: workspace Hermes `C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/` (15787 berkas `.md` di luar `node_modules`; folder misi `YYYY-MM-DD[-_]<slug>/`). Pembanding: `C:\Users\TRIAL\gsp-swarm-hq-v2.1\docs\2026-10-22_doc_artifact_studio\delegation_progress\coder_execution_*.md` dan `...\test\*.md`.
- Tidak ada berkas yang ditulis di workspace Hermes. Satu-satunya keluaran: berkas ini.
- Butir yang diminta dan letaknya: (1) pola nama + jumlah = bagian 3 dan 4; (2) frekuensi judul ## dan ### 20 teratas per jenis = bagian 4; (3) medan kepala + frekuensi = bagian 4 (tabel "Kunci kepala generik" dan "Medan kepala bertarget"); (4) kosakata status/verdict = bagian 4 (tiga tabel per jenis); (5) pola id kartu dan cara merujuk bukti = bagian 4 + bagian 5; (6) bagian hampir-selalu vs jarang = bagian 3 (tabel ringkasan) + tabel judul per jenis; (7) 5 contoh berpath per jenis = bagian 4.

## 2. Cara menghitung (dapat diulang)

### 2.1 Perintah utama

Semua angka per jenis (bagian 3 dan 4) dihasilkan oleh satu skrip Python baca-saja (teks penuh di Lampiran B):

```text
cd C:/Users/TRIAL        # cwd pendek; cwd scratchpad terlalu panjang untuk Win32
python -I <scratchpad>/dc01_inventory.py C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs C:/Users/TRIAL/gsp-swarm-hq-v2.1/docs/2026-10-22_doc_artifact_studio <keluaran>.md
```

- Skrip menelusuri `os.walk` di bawah folder Hermes dengan melewati folder bernama `node_modules`, hanya berkas berakhiran `.md`, urut abjad path. Skrip membuka berkas hanya untuk dibaca.
- Setiap berkas masuk TEPAT SATU kelas menurut urutan prioritas fungsi `classify` (Lampiran B). Kelas K3-K8 karenanya saling eksklusif dan jumlahnya lebih kecil daripada hitungan mentah per pola nama di 2.2.
- Normalisasi judul: huruf kecil, digit diganti `N`, nomor awal (`1.`, `A)`) dibuang, dipotong 70 karakter, judul dalam pagar kode (```` ``` ````) diabaikan.
- "Kunci kepala generik": 40 baris pertama; `fm:` = kunci frontmatter YAML, `kv:` = baris `Kunci: nilai` / `**Kunci:** nilai` / `- **Kunci:** nilai`. Berkas berfrontmatter terhitung di `fm:` dan `kv:` untuk kunci yang sama (dua hitungan sama untuk satu berkas).
- "Medan kepala bertarget" dan "Cara merujuk bukti": regex di Lampiran A, dihitung per berkas (berkas yang memuat, bukan jumlah kemunculan).
- "5 contoh": indeks 0, n/5, 2n/5, 3n/5, 4n/5 pada daftar kelas yang urut abjad (n < 5: semua). Setiap contoh = path + 5 baris tak-kosong pertama, dipotong 200 karakter.
- Pindaian berjalan 2026-10-30T10:20:01Z .. 2026-10-30T10:20:19Z UTC. Workspace Hermes hidup (Hermes menulis saat uji): `find ... -name '*.md' | wc -l` memberi 15786 pada pindaian pertama sesi ini dan 15787 pada pindaian kedua (mis. misi baru `2026-10-30_dao-cloud-fit-analysis/`). Selisih satu berkas ini tidak mengubah hitungan kelas K1-K9 antar dua pindaian.

### 2.2 Perintah verifikasi silang (keluaran asli, dijalankan di folder docs Hermes; `F` = `find . -name node_modules -prune -o -type f`)

```text
# cwd = C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs ; waktu UTC 2026-10-30T10:27:53Z
$ $F -name '*.md' -print | wc -l
15787
$ $F -name 'PHASE-REPORTS.md' -print | wc -l   # K1
242
$ $F -name 'LAPORAN-SELESAI.md' -print | wc -l   # K2
3
$ $F -iname 'handoff.md' -print | wc -l   # K9
19
$ $F -iname '*report*.md' -print | wc -l   # mentah, tidak eksklusif (K3 eksklusif = 337)
579
$ $F -iname '*lapor*.md' -print | wc -l   # mentah (K4 eksklusif = 291)
294
$ $F -iname '*countersign*.md' -print | wc -l   # mentah (K5 = 172)
173
$ $F \( -iname '*verdict*.md' -o -iname '*vonis*.md' \) -print | wc -l   # mentah (K6 = 257)
271
$ $F -iname '*verif*.md' -print | wc -l   # mentah nama saja (K7 = 784 termasuk folder verification/verif/verifikasi/verify)
438
$ $F -path '*/checkpoints/*' -name '*.md' -print | wc -l   # mentah (K8 eksklusif = 35)
52
$ grep -rl --include='*.md' --exclude-dir=node_modules 'LAPOR-SELESAI' . | wc -l
625
$ grep -rl --include='*.md' --exclude-dir=node_modules 'LAPOR-FASE' . | wc -l
100
$ find . -name node_modules -prune -o -name PHASE-REPORTS.md -print0 | xargs -0 grep -h '^\[FASE\]' | wc -l
1204
$ ls -d [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9][-_]* | wc -l   # folder misi
789
```

Catatan atas selisih yang tercatat: `[FASE]` di 2.2 = 1204 baris (grep seluruh baris) lawan 1197 di bagian 4/K1 (skrip melewati baris di dalam pagar kode); `grep -rl LAPOR-SELESAI` = 625 berkas = angka skrip di bagian 5.

## 3. Ringkasan lintas-jenis (angka saja)

### 3.1 Jenis laporan kerja Hermes yang dipindai (pola nama, jumlah, sebaran)

Definisi kelas (prioritas turun; huruf-besar/kecil nama berkas tidak dibedakan kecuali K1): K1 nama = `PHASE-REPORTS.md`; K2 nama = `LAPORAN-SELESAI.md`; K3 nama memuat `report`; K4 nama memuat `lapor`; K5 nama memuat `countersign`; K6 nama memuat `verdict` atau `vonis`; K7 nama memuat `verif` ATAU berada di folder `verification|verif|verifikasi|verify`; K8 berada di folder `checkpoints/`; K9 nama = `handoff.md`.

| kelas | berkas | misi berbeda | di folder backup* |
|---|---|---|---|
| K1 PHASE-REPORTS.md | 242 | 242 | 0 |
| K2 LAPORAN-SELESAI.md | 3 | 1 | 0 |
| K3 *REPORT*.md (basename) | 337 | 167 | 22 |
| K4 *lapor*.md (basename) | 291 | 110 | 26 |
| K5 *countersign*.md | 172 | 73 | 0 |
| K6 *verdict*/*vonis*.md | 257 | 70 | 6 |
| K7 verif* (nama berkas atau folder verification/verif/verifikasi/verify) | 784 | 159 | 147 |
| K8 folder checkpoints/*.md | 35 | 5 | 0 |
| K9 handoff.md | 19 | 2 | 0 |

Pola nama berkas teratas per kelas (digit diganti `N`; perintah: bagian 2.1):

- K1 PHASE-REPORTS.md: `PHASE-REPORTS.md` x242
- K2 LAPORAN-SELESAI.md: `LAPORAN-SELESAI.md` x3
- K3 *REPORT*.md (basename): `REPORT.md` x84, `screen-report.md` x19, `report.md` x9, `acquisition-report.md` x7, `HG_REPORT_BN_RN.md` x6, `VN-REPORT_runN_N_N.md` x5, `verification_report.md` x4, `L-BN-report.md` x4
- K4 *lapor*.md (basename): `VN-laporan-NTNZ.md` x21, `laporan.md` x12, `hijau-doc-laporan.md` x9, `LAPORAN.md` x9, `LAPORAN_PAKET_ANON.md` x7, `N_laporan-verifikasi.md` x6, `dens-DN-laporan.md` x5, `EN-LAPORAN.md` x2
- K5 *countersign*.md: `countersign.md` x18, `COUNTERSIGN.md` x12, `countersign_vN.md` x7, `N_countersign.md` x7, `card_cs-dN-countersign-vonis-verif-dN.md` x5, `COUNTERSIGN-C-RN.md` x4, `countersign-revN.md` x4, `COUNTERSIGN-RN.md` x3
- K6 *verdict*/*vonis*.md: `chN-verdict.md` x37, `verdict.md` x27, `vonis.md` x18, `chN-verdict-rN.md` x17, `VERDICT.md` x7, `C-BN-verdict.md` x4, `N_verdict.md` x4, `RN-vonis-lajur.md` x4
- K7 verif* (nama berkas atau folder verification|verif|verifikasi|verify): `reverif-chN.md` x17, `VERIFICATION.md` x12, `probe-dN-N-gsp-masterN-PN.out.md` x12, `VERIFIKASI-VN.md` x9, `probe-dN-N-gsp-creative-PN.out.md` x9, `probe-dN-N-gspuserN-PN.out.md` x9, `VERIFICATION_RN.md` x8, `SEED-LOG.md` x8
- K8 folder checkpoints/*.md: `FIXN-selfcheck.md` x3, `review_gaya_pemirsa_vN.md` x2, `naskah_pembicara_vN.md` x1, `CP-FN-rt.md` x1, `CP-FN-rev.md` x1, `CP-FN-verfinal.md` x1, `CP-FNa-cli.md` x1, `CP-FNa-srv.md` x1
- K9 handoff.md: `handoff.md` x19

### 3.2 Bagian dan kunci kepala yang hampir selalu ada vs jarang (judul ##; kunci kepala `kv:`)

Ambang: "hampir selalu" = di >=80% berkas kelas; "sering" = 50-79%; kolom "<=5%" = jumlah judul ternormalisasi berbeda yang hanya ada di <=5% berkas kelas dibanding seluruh judul ternormalisasi berbeda. (Satu angka per sel; sumber: perintah 2.1, fungsi `summarize`.)

| kelas | n | judul ## di >=80% berkas (jumlah berkas) | judul ## di 50-79% berkas | judul ## berbeda yang ada di <=5% berkas | kunci kepala kv: di >=80% berkas | kunci kv: di 50-79% berkas |
|---|---|---|---|---|---|---|
| K1 PHASE-REPORTS.md | 242 | `N-N-N N:N` (197) | (tidak ada) | 196 dari 198 | `kv:artefak` (236), `kv:ringkas` (236), `kv:rencana` (235), `kv:estimasi` (234), `kv:jalur` (231) | (tidak ada) |
| K2 LAPORAN-SELESAI.md | 3 | (tidak ada) | `gerbang (diukur pada state akhir disk, bukan ingatan)` (2), `catatan distribusi skill (awareness)` (2), `artefak` (2), `healing loop (satu loop, sesuai batas verif-short)` (2), `pemetaan kontrak` (2) | 0 dari 15 | `kv:status` (3) | `kv:naskah` (2) |
| K3 *REPORT*.md (basename) | 337 | (tidak ada) | (tidak ada) | 1284 dari 1295 | (tidak ada) | `kv:status` (184) |
| K4 *lapor*.md (basename) | 291 | (tidak ada) | (tidak ada) | 1377 dari 1378 | (tidak ada) | `kv:status` (170) |
| K5 *countersign*.md | 172 | (tidak ada) | (tidak ada) | 836 dari 840 | (tidak ada) | (tidak ada) |
| K6 *verdict*/*vonis*.md | 257 | (tidak ada) | (tidak ada) | 936 dari 940 | (tidak ada) | (tidak ada) |
| K7 verif* (nama berkas atau folder verification/verif/verifikasi/verify) | 784 | (tidak ada) | (tidak ada) | 2223 dari 2224 | (tidak ada) | (tidak ada) |
| K8 folder checkpoints/*.md | 35 | (tidak ada) | (tidak ada) | 214 dari 226 | (tidak ada) | `kv:tanggal` (20) |
| K9 handoff.md | 19 | (tidak ada) | (tidak ada) | 0 dari 17 | (tidak ada) | (tidak ada) |

### 3.3 Tabel silang: status, verdict, id kartu, cara merujuk bukti

Sumber: tabel per kelas di bagian 4 dan 6 (diekstrak skrip `assemble` dari keluaran perintah 2.1; angka identik dengan tabel per kelas).

| kelas | n | status kepala teratas | VERDICT/VONIS teratas | berkas memuat id t_xxxxxxxx | rujuk sha (nilai hex) | rujuk corr id | rujuk commit/@hex | rujuk path berkas |
|---|---|---|---|---|---|---|---|---|
| K1 PHASE-REPORTS.md (n = 242) | 242 | complete=13 dari 19 berkas bernilai-status | PASS=7 dari 10 berkas ber-verdict | 208 (86%) | 174 (72%) | 1 (0%) | 35 (14%) | 241 (100%) |
| K2 LAPORAN-SELESAI.md (n = 3) | 3 | complete=3 dari 3 berkas bernilai-status | PASS=1 dari 1 berkas ber-verdict | 3 (100%) | 3 (100%) | 0 (0%) | 0 (0%) | 3 (100%) |
| K3 *REPORT*.md (basename) (n = 337) | 337 | complete=94 dari 200 berkas bernilai-status | PASS=67 dari 129 berkas ber-verdict | 202 (60%) | 86 (26%) | 0 (0%) | 9 (3%) | 308 (91%) |
| K4 *lapor*.md (basename) (n = 291) | 291 | complete=141 dari 197 berkas bernilai-status | PASS=60 dari 101 berkas ber-verdict | 216 (74%) | 141 (48%) | 1 (0%) | 5 (2%) | 285 (98%) |
| K5 *countersign*.md (n = 172) | 172 | complete=69 dari 95 berkas bernilai-status | PASS=62 dari 140 berkas ber-verdict | 155 (90%) | 118 (69%) | 0 (0%) | 3 (2%) | 172 (100%) |
| K6 *verdict*/*vonis*.md (n = 257) | 257 | complete=39 dari 76 berkas bernilai-status | PASS=101 dari 163 berkas ber-verdict | 213 (83%) | 139 (54%) | 0 (0%) | 11 (4%) | 252 (98%) |
| K7 verif* (nama berkas atau folder verification/ | 784 | complete=185 dari 387 berkas bernilai-status | PASS=166 dari 302 berkas ber-verdict | 422 (54%) | 257 (33%) | 0 (0%) | 20 (3%) | 767 (98%) |
| K8 folder checkpoints/*.md (n = 35) | 35 | complete=21 dari 23 berkas bernilai-status | PASS=6 dari 17 berkas ber-verdict | 35 (100%) | 2 (6%) | 0 (0%) | 10 (29%) | 35 (100%) |
| K9 handoff.md (n = 19) | 19 | (tidak ada) | (tidak ada) | 7 (37%) | 0 (0%) | 0 (0%) | 0 (0%) | 9 (47%) |
| R1 delegation_progress/coder_execution_*.md (n = | 233 | complete=213 dari 232 berkas bernilai-status | (tidak ada) | 0 (0%) | 38 (16%) | 3 (1%) | 0 (0%) | 225 (97%) |
| R2 delegation_progress/*.md bukan coder_executio | 16 | complete=10 dari 10 berkas bernilai-status | (tidak ada) | 0 (0%) | 2 (12%) | 0 (0%) | 0 (0%) | 15 (94%) |
| R3 test/*.md (n = 21) | 21 | complete=11 dari 16 berkas bernilai-status | FAIL=1 dari 1 berkas ber-verdict | 0 (0%) | 8 (38%) | 1 (5%) | 0 (0%) | 21 (100%) |

## 4. Per jenis laporan kerja Hermes (K1-K9): statistik dan contoh

#### K1 PHASE-REPORTS.md (n = 242)
- Misi/folder tingkat-1 berbeda: 242; di dalam folder backup*/wiki_backup*: 0; ukuran median 3497 B (min 683, maks 212079); baris median 26.
- Berkas tanpa satu pun judul ## atau ###: 4 (2%).
- Judul ##: total kemunculan 1243; judul ternormalisasi berbeda 198; muncul di tepat 1 berkas 191.

**Top 20 judul ##** (normalisasi: huruf kecil, digit -> N, nomor awal dibuang; urut berkas-pemuat)

| judul | berkas | % berkas | kemunculan |
|---|---|---|---|
| N-N-N N:N | 197 | 81% | 868 |
| N-N-N N:Nx | 29 | 12% | 89 |
| N-N-N N:N wib | 12 | 5% | 37 |
| N-N-N N:Nx wib | 6 | 2% | 10 |
| N:N | 2 | 1% | 5 |
| [fase] N-N-N N:N | 2 | 1% | 4 |
| N-N-N (pembukaan misi) | 2 | 1% | 2 |
| N-N-N N:N (watchdog cron) | 1 | 0% | 24 |
| N-N-N N:N (cron board-mover) | 1 | 0% | 7 |
| N-N-N (gerbang-N -> perbaikan-N) | 1 | 0% | 2 |
| N-N-N N:N (arsip susulan ditulis N:N oleh run ke-N controller) | 1 | 0% | 2 |
| N-N-N N:N (laporan progres t-N, permintaan user) | 1 | 0% | 2 |
| N-N-N N:Nx wib (watchdog full-power tick-N) | 1 | 0% | 2 |
| N-N-N blok: | 1 | 0% | 2 |
| N-N-N ~N:N (cron board-mover rafifunity-N, run ini) | 1 | 0% | 2 |
| [fase] N-N-N N:N (cron penggerak papan rafifunity-N) | 1 | 0% | 2 |
| [fase] mover N-N ~N:N (cron board-mover, gsp-masterN) | 1 | 0% | 2 |
| N-N-N (aturan fleet) | 1 | 0% | 1 |
| N-N-N (awal misi) | 1 | 0% | 1 |
| N-N-N (beku) | 1 | 0% | 1 |

- Judul ###: total kemunculan 59; judul ternormalisasi berbeda 45; muncul di tepat 1 berkas 45.

**Top 20 judul ###** (normalisasi: huruf kecil, digit -> N, nomor awal dibuang; urut berkas-pemuat)

| judul | berkas | % berkas | kemunculan |
|---|---|---|---|
| peta akhir run (cetakan alat, filter tenant rafifunity-N) | 1 | 0% | 4 |
| tahan + triase | 1 | 0% | 4 |
| triase + batas | 1 | 0% | 3 |
| adendum N:Nx (run mover yang sama) | 1 | 0% | 2 |
| hilir berjadwal (urutan saat slot bebas) | 1 | 0% | 2 |
| posisi fase | 1 | 0% | 2 |
| putusan controller (d-N..d-N) + tindak papan | 1 | 0% | 2 |
| putusan controller baru | 1 | 0% | 2 |
| ukur done (cetakan alat, path+ukuran nyata; bukan kutip summary worker | 1 | 0% | 2 |
| [fase] fN-tulis gelombang-N + rantai fix figur gel.N - laporan board-m | 1 | 0% | 1 |
| [fase] fN-tulis gelombang-N - laporan board-mover (N-N ~N:N, cron) | 1 | 0% | 1 |
| cacat orkestrasi terdeteksi: kartu ganda langkah N dan N | 1 | 0% | 1 |
| cacat tooling (catatan fleet) | 1 | 0% | 1 |
| hilir berjadwal | 1 | 0% | 1 |
| hilir dibuka (kap misi N) | 1 | 0% | 1 |
| kartu baru (lad_card; probe `list --json` pada shell terakhir sebelum  | 1 | 0% | 1 |
| kartu baru (lad_card; tenant rafifunity-N; parents = hulu nyata; probe | 1 | 0% | 1 |
| kartu hilir baru (lad_card; probe list --json pada shell terakhir sebe | 1 | 0% | 1 |
| koreksi N:N (jejak audit, bukan transisi fase) | 1 | 0% | 1 |
| koreksi sejarah run (N-N ~N:N) - instance mover kembar membalik putusa | 1 | 0% | 1 |

**Kunci kepala generik** (40 baris pertama; `fm:` = frontmatter YAML, `kv:` = baris `Kunci: nilai` / `**Kunci:** nilai`; berkas pemuat)

| kunci | berkas | % |
|---|---|---|
| kv:artefak | 236 | 98% |
| kv:ringkas | 236 | 98% |
| kv:rencana | 235 | 97% |
| kv:estimasi | 234 | 97% |
| kv:jalur | 231 | 95% |
| kv:hambat | 24 | 10% |
| kv:limit | 23 | 10% |
| kv:catatan | 6 | 2% |
| kv:status | 5 | 2% |
| fm:created | 4 | 2% |
| fm:domain | 4 | 2% |
| fm:kelas_bukti | 4 | 2% |
| fm:status | 4 | 2% |
| fm:tags | 4 | 2% |
| fm:title | 4 | 2% |
| fm:type | 4 | 2% |
| fm:writer | 4 | 2% |
| kv:created | 4 | 2% |
| kv:domain | 4 | 2% |
| kv:kelas_bukti | 4 | 2% |
| kv:tags | 4 | 2% |
| kv:title | 4 | 2% |
| kv:type | 4 | 2% |
| kv:writer | 4 | 2% |
| kv:jalan | 4 | 2% |

**Medan kepala bertarget** (regex pada 40 baris pertama; berkas pemuat)

| medan (regex ringkas di Lampiran A) | berkas | % |
|---|---|---|
| status | 19 | 8% |
| agen/owner/peran | 25 | 10% |
| kartu (t_xxxxxxxx / kartu / task_id / task_ref) | 238 | 98% |
| label tanggal (tanggal/date/created/updated/giliran) | 6 | 2% |
| tanggal ISO YYYY-MM-DD di kepala | 240 | 99% |
| misi/tenant/kontrak | 207 | 86% |
| verdict/vonis | 179 | 74% |
| sha | 177 | 73% |
| corr/correlation | 2 | 1% |
| commit/git | 49 | 20% |
| path berkas (ext) | 241 | 100% |

**Nilai status kepala** (`status: x` / `STATUS: x`, 60 baris pertama, 1 per berkas, huruf kecil): berkas bernilai-status = 19

| nilai | berkas |
|---|---|
| complete | 13 |
| draft | 4 |
| blocked | 1 |
| completed | 1 |

**Nilai `VERDICT:`/`VONIS:`** (seluruh berkas, kemunculan pertama, huruf besar): berkas = 10

| nilai | berkas |
|---|---|
| PASS | 7 |
| SETUJU | 1 |
| FAIL | 1 |
| SAH- | 1 |

**Token kosakata status/verdict** (berkas yang memuat kata utuh; huruf-besar dicocokkan persis, huruf-kecil dicocokkan persis huruf kecil)

| token | berkas | % |
|---|---|---|
| complete | 52 | 21% |
| needs-review | 15 | 6% |
| blocked | 40 | 17% |
| NEEDS_REVIEW | 40 | 17% |
| PASS | 199 | 82% |
| CAUTION | 0 | 0% |
| FAIL | 127 | 52% |
| PARKED | 5 | 2% |
| done | 164 | 68% |
| running | 84 | 35% |
| ready | 41 | 17% |
| draft | 14 | 6% |
| todo | 51 | 21% |
| review | 40 | 17% |
| issued | 0 | 0% |
| closed | 15 | 6% |
| approved | 0 | 0% |
| berjalan | 237 | 98% |
| selesai | 238 | 98% |

**Kemunculan hasil-cek huruf besar** (semua kemunculan): PASS=1334, FAIL=483, NEEDS_REVIEW=55, NEEDS-REVIEW=5

**Id kartu** regex `\bt_[0-9a-f]{8}\b`: berkas pemuat 208 (86%); id unik 1936; histogram panjang heks setelah `t_` (semua `t_[0-9a-f]+`): 2:1, 8:3342
- Label kartu non-heks setelah kata "kartu " (bentuk -> jumlah -> contoh): `AAAAAAAA-9999` x8 (mis. PSIKOTES-1008); `AAA-A9` x5 (mis. FIX-E3); `A9-A9` x3 (mis. D1-D6); `AA-A` x2 (mis. AF-V); `AAAAA-A9` x2 (mis. CRAWL-W1); `AAA-AAAA` x2 (mis. PUB-GATE)

**Cara merujuk bukti** (regex pada seluruh berkas; berkas pemuat)

| bentuk rujukan | berkas | % |
|---|---|---|
| path docs/... | 165 | 68% |
| path berkas dgn ekstensi | 241 | 100% |
| path:baris (file.ext:NN) | 11 | 5% |
| sha dgn nilai hex>=8 | 174 | 72% |
| corr id (corr <hex8>) | 1 | 0% |
| commit/@hex7+ | 35 | 14% |
| byte/ukuran (NN B/KB/MB) | 218 | 90% |
| exit code | 65 | 27% |
| mtime | 30 | 12% |
| kartu t_xxxxxxxx | 208 | 86% |

**Analisis tingkat-entri PHASE-REPORTS.md**

- Entri (baris `## `): 1244; entri berjudul `## YYYY-MM-DD HH:MM`: 977; entri per berkas median 3.0, maks 62, min 0.
- Penanda kurung siku di awal baris (`^\[[A-Z-]+\]`): [FASE]=1197, [ANGKA]=27, [WATCHDOG]=25, [MILESTONE]=10, [JALUR]=7, [PUTUSAN]=4, [VONIS]=3, [PROMOSI]=2, [JALAN]=2, [CATATAN]=2, [HASIL]=1, [BUKU]=1, [UBAH]=1, [SAMPLING]=1, [RENCANA]=1, [AKSI]=1, [PELAJARAN]=1, [INSIDEN]=1, [BUKTI-BEKU]=1, [BUKTI-RILIS]=1, [JEJAK-GATE]=1, [JELAJAH]=1, [SISA]=1, [ARTEFAK-BARU]=1, [ANOMALI]=1, [TINDAKAN]=1, [GERBANG]=1, [SERAH]=1, [EKSEKUSI]=1, [KEBIJAKAN]=1, [SERAH-B]=1, [SERAH-C]=1, [KOREKSI]=1
- Baris `[FASE]` yang cocok pola `[FASE] <misi> | <dari> -> <ke> | HH:MM`: 827 dari 1197.
- Label baris-awal huruf besar `^[A-Z ]{3,21}:` per kemunculan: RINGKAS=1097, ARTEFAK=1060, JALUR=1048, RENCANA=1039, ESTIMASI=1013, LIMIT=48, HAMBAT=43, STATUS=24, CATATAN=20, GERBANG=11, SINYAL DIGEST=11, RUJUKAN=9

##### Contoh berpath: K1 PHASE-REPORTS.md

`./2026-09-02-asset-factory/PHASE-REPORTS.md`

```text
# Phase Reports: Misi Asset Factory ComfyUI (kontrak docs/2026-09-02-asset-factory)
## 2026-09-03 16:30
[FASE] AF-COMFYUI-2609 | V-final -> V-close (MISI SELESAI) | 16:30
RINGKAS: Penutupan contract dikerjakan kartu AF-V-close t_ac21f612: string basi baris 9 dikoreksi, KOREKSI RT 6/6 + TA 7/7 masuk Decision Log, STATUS complete ditulis; rerun verifier beku sha fabec128
ARTEFAK: docs/2026-09-02-asset-factory/contract.md 17.250 B STATUS complete; verification/CLOSE-t_ac21f612.md 2.992 B; verification/report_close_t_ac21f612_run{1,2}.md 5.738 B; CHANGELOG gsp-agent com
```

`./2026-09-09-acuan-format-balasan-email/PHASE-REPORTS.md`

```text
# PHASE-REPORTS ACUAN-0909
## 2026-09-09 16:35
[FASE] ACUAN-0909 | kontrak -> identifikasi (RT+TA) | 16:35
RINGKAS: Dump sumber kanonik dibuat controller: 92 baris bernomor dari docx (3 pasang surat vendor + Reply Draft), sha256 sumber 570f1307...8d3e terverifikasi python-docx termasuk tabel harga.
ARTEFAK: docs/2026-09-09-acuan-format-balasan-email/identification/00_source_dump.txt (163 baris file, 92 baris isi bernomor); contract.md (2.558 byte).
```

`./2026-09-20-ft-eval-0920/PHASE-REPORTS.md`

```text
## 2026-09-20 16:10
[FASE] FT-EVAL-0920 | gate -> SELESAI | 16:10
RINGKAS: 13 kartu done; V v1 FAIL-sempit (D-1,D-3) -> F1/F2 -> V2 PASS 19/19; dokumen rencana lolos gerbang doc (sha16 fab3aa68302842fd, A1/A2=0); 15 platform, 37 klaim register L2, korpus bersih 4,31
ARTEFAK: output/RENCANA-FT-SWARM.md 19.845+ B (ukur ulang di bawah); lajur L1-L4, S0-S2, V-VERDICT.md + RE-CHECK; raw-L1, raw/L4, raw/S4 tersimpan.
JALUR: selesai: intake, riset, state, gate, fix | berjalan: S13 promosi librarian (kartu menyusul) | sisa: keputusan user (tier, vendor, provenance server).
```

`./2026-10-07-rafif-final-editorial/PHASE-REPORTS.md`

```text
# PHASE-REPORTS - RAFIFFINAL-1007
## 2026-10-07 02:40
[FASE] RAFIFFINAL-1007 | (start) -> fase-0-fondasi | 02:40
RINGKAS: misi dibuka; Panduan Mutu 81 hlm dibaca penuh (2.935 baris teks terukur), ekstrak aturan A-P ditulis (22.977 B), kontrak misi + 9 kartu dibuat; sumber 5 lajur terinventaris (145.669 + 72.863 
ARTEFAK: docs/2026-10-07-rafif-final-editorial/CONTRACT.md 6.375 B+patch; identification/00_aturan-mutu-ekstrak.md 22.977 B; _work/card_*.md 9 berkas.
```

`./2026-10-18-sync-email-nas-pagi/PHASE-REPORTS.md`

```text
# Laporan Fase: SYNCNAS-1018P
## 2026-10-18 07:12
[FASE] SYNCNAS-1018P | probe-dasar -> tutup-jalur-DELTA-NOL | 07:12
RINGKAS: Giliran 18-Oct pagi tuntas jalur DELTA NOL. Master NAS terverifikasi byte-identik rilis 16-Okt malam (sha 2873eaaba756, 114.353 B, assert match_basis=True pada 2 pembacaan), cutoff MDTM 17-Ok
ARTEFAK: docs/2026-10-18-sync-email-nas-pagi/contract.md (10.916 B), probe.py (7.513 B), probe_result.json, close_probe.py, close_probe_result.json, nas/nas_master.xlsx (114.353 B sha 2873eaaba756).
```

#### K2 LAPORAN-SELESAI.md (n = 3)
- Misi/folder tingkat-1 berbeda: 1; di dalam folder backup*/wiki_backup*: 0; ukuran median 7014 B (min 5827, maks 7460); baris median 86.
- Berkas tanpa satu pun judul ## atau ###: 0 (0%).
- Judul ##: total kemunculan 20; judul ternormalisasi berbeda 15; muncul di tepat 1 berkas 10.

**Top 20 judul ##** (normalisasi: huruf kecil, digit -> N, nomor awal dibuang; urut berkas-pemuat)

| judul | berkas | % berkas | kemunculan |
|---|---|---|---|
| artefak | 2 | 67% | 2 |
| catatan distribusi skill (awareness) | 2 | 67% | 2 |
| gerbang (diukur pada state akhir disk, bukan ingatan) | 2 | 67% | 2 |
| healing loop (satu loop, sesuai batas verif-short) | 2 | 67% | 2 |
| pemetaan kontrak | 2 | 67% | 2 |
| artefak terbit (ukur disk nyata, cetakan alat) | 1 | 33% | 1 |
| batas klaim (d-ta-N) | 1 | 33% | 1 |
| catatan dua-run (crash run-N, instrumen run-N) | 1 | 33% | 1 |
| field dinamis placeholder (N basis, N kemunculan nyata; refresh step N | 1 | 33% | 1 |
| field dinamis placeholder (N basis, N kemunculan; refresh step N) | 1 | 33% | 1 |
| field dinamis placeholder (menunggu refresh step N) | 1 | 33% | 1 |
| healing loop run-N (satu loop, sesuai batas pekerja) | 1 | 33% | 1 |
| instrumen ukur pekerja (workdir kini terbentuk) | 1 | 33% | 1 |
| pemetaan butir-per-butir: N sub-bab vs anchor specs §N baris N | 1 | 33% | 1 |
| predikat & konflik | 1 | 33% | 1 |

- Judul ###: total kemunculan 2; judul ternormalisasi berbeda 2; muncul di tepat 1 berkas 2.

**Top 20 judul ###** (normalisasi: huruf kecil, digit -> N, nomor awal dibuang; urut berkas-pemuat)

| judul | berkas | % berkas | kemunculan |
|---|---|---|---|
| ringkasan babN_check.py (cetakan alat, bukan ingatan) | 1 | 33% | 1 |
| ringkasan scanner kanal doc | 1 | 33% | 1 |

**Kunci kepala generik** (40 baris pertama; `fm:` = frontmatter YAML, `kv:` = baris `Kunci: nilai` / `**Kunci:** nilai`; berkas pemuat)

| kunci | berkas | % |
|---|---|---|
| kv:status | 3 | 100% |
| kv:naskah | 2 | 67% |
| kv:direktori | 1 | 33% |
| kv:line ending | 1 | 33% |
| kv:path | 1 | 33% |
| kv:profil | 1 | 33% |
| kv:run | 1 | 33% |
| kv:ukuran | 1 | 33% |
| kv:kedalaman mekanisme | 1 | 33% |
| kv:predikat tampil apa adanya | 1 | 33% |

**Medan kepala bertarget** (regex pada 40 baris pertama; berkas pemuat)

| medan (regex ringkas di Lampiran A) | berkas | % |
|---|---|---|
| status | 3 | 100% |
| agen/owner/peran | 0 | 0% |
| kartu (t_xxxxxxxx / kartu / task_id / task_ref) | 3 | 100% |
| label tanggal (tanggal/date/created/updated/giliran) | 0 | 0% |
| tanggal ISO YYYY-MM-DD di kepala | 3 | 100% |
| misi/tenant/kontrak | 1 | 33% |
| verdict/vonis | 3 | 100% |
| sha | 3 | 100% |
| corr/correlation | 0 | 0% |
| commit/git | 0 | 0% |
| path berkas (ext) | 3 | 100% |

**Nilai status kepala** (`status: x` / `STATUS: x`, 60 baris pertama, 1 per berkas, huruf kecil): berkas bernilai-status = 3

| nilai | berkas |
|---|---|
| complete | 3 |

**Nilai `VERDICT:`/`VONIS:`** (seluruh berkas, kemunculan pertama, huruf besar): berkas = 1

| nilai | berkas |
|---|---|
| PASS | 1 |

**Token kosakata status/verdict** (berkas yang memuat kata utuh; huruf-besar dicocokkan persis, huruf-kecil dicocokkan persis huruf kecil)

| token | berkas | % |
|---|---|---|
| complete | 3 | 100% |
| needs-review | 0 | 0% |
| blocked | 0 | 0% |
| NEEDS_REVIEW | 0 | 0% |
| PASS | 3 | 100% |
| CAUTION | 0 | 0% |
| FAIL | 3 | 100% |
| PARKED | 0 | 0% |
| done | 0 | 0% |
| running | 0 | 0% |
| ready | 0 | 0% |
| draft | 0 | 0% |
| todo | 0 | 0% |
| review | 0 | 0% |
| issued | 0 | 0% |
| closed | 0 | 0% |
| approved | 0 | 0% |
| berjalan | 0 | 0% |
| selesai | 0 | 0% |

**Kemunculan hasil-cek huruf besar** (semua kemunculan): PASS=28, FAIL=5

**Id kartu** regex `\bt_[0-9a-f]{8}\b`: berkas pemuat 3 (100%); id unik 3; histogram panjang heks setelah `t_` (semua `t_[0-9a-f]+`): 8:4

**Cara merujuk bukti** (regex pada seluruh berkas; berkas pemuat)

| bentuk rujukan | berkas | % |
|---|---|---|
| path docs/... | 3 | 100% |
| path berkas dgn ekstensi | 3 | 100% |
| path:baris (file.ext:NN) | 0 | 0% |
| sha dgn nilai hex>=8 | 3 | 100% |
| corr id (corr <hex8>) | 0 | 0% |
| commit/@hex7+ | 0 | 0% |
| byte/ukuran (NN B/KB/MB) | 3 | 100% |
| exit code | 3 | 100% |
| mtime | 1 | 33% |
| kartu t_xxxxxxxx | 3 | 100% |

##### Contoh berpath: K2 LAPORAN-SELESAI.md

`./2026-10-04-prompt-manual/_work/t_0a7016b5/LAPORAN-SELESAI.md`

```text
# LAPORAN SELESAI - Bab 22 Penguasaan dan pemeliharaan ilmu (t_0a7016b5)
STATUS: complete
## Catatan dua-run (crash run-1, instrumen run-2)
Run-1 (pid 31224) crash setelah naskah lahir ke disk (52.998 B, mtime 05:00) pada fase
instrumen/laporan, bukan saat menulis. Run-2 mengikuti arahan pengawas preseden B20:
```

`./2026-10-04-prompt-manual/_work/t_39134b6d/LAPORAN-SELESAI.md`

```text
# LAPORAN SELESAI - Bab 20 PROMANUAL-1004 (kartu t_39134b6d)
STATUS: complete
Profil: gsp-document-writer
Run: 2 (run-1 timeout 1800s dengan naskah hampir tuntas di disk; run-2 menyelesaikan gerbang + instrumen sesuai arahan pengawas 05-10)
## Artefak terbit (ukur disk nyata, cetakan alat)
```

`./2026-10-04-prompt-manual/_work/t_ac989baa/LAPORAN-SELESAI.md`

```text
# LAPORAN SELESAI - Bab 21 Kapstone: sistem prompt end-to-end (t_ac989baa)
STATUS: complete
## Artefak
- Naskah: docs/2026-10-04-prompt-manual/output/bab-21.md
- 70.390 B / 344 baris / ~9.020 kata / LF murni (CRLF=0) / sha256[:16]=92a60eca7944055b
```

#### K3 *REPORT*.md (basename) (n = 337)
- Misi/folder tingkat-1 berbeda: 167; di dalam folder backup*/wiki_backup*: 22; ukuran median 5955 B (min 9, maks 289330); baris median 77.
- Berkas tanpa satu pun judul ## atau ###: 43 (13%).
- Judul ##: total kemunculan 2231; judul ternormalisasi berbeda 1295; muncul di tepat 1 berkas 1068.

**Top 20 judul ##** (normalisasi: huruf kecil, digit -> N, nomor awal dibuang; urut berkas-pemuat)

| judul | berkas | % berkas | kemunculan |
|---|---|---|---|
| ringkasan | 60 | 18% | 60 |
| verifikasi | 36 | 11% | 36 |
| artefak | 30 | 9% | 30 |
| status: complete | 21 | 6% | 21 |
| deadline and progress checkpoints | 19 | 6% | 19 |
| director decision: ______ | 19 | 6% | 19 |
| flag register first pass | 19 | 6% | 19 |
| material claims summary | 19 | 6% | 19 |
| open items without answer | 19 | 6% | 19 |
| top five ask-list | 19 | 6% | 19 |
| prospect sketch | 18 | 5% | 18 |
| blocker & flag | 13 | 4% | 13 |
| blocker | 12 | 4% | 12 |
| vendor identity block | 12 | 4% | 12 |
| langkah analisa | 10 | 3% | 10 |
| rekomendasi kurasi | 10 | 3% | 10 |
| angka | 9 | 3% | 9 |
| catatan / blocker | 9 | 3% | 9 |
| proposa vault dibuat (N) | 9 | 3% | 9 |
| referensi | 9 | 3% | 9 |

- Judul ###: total kemunculan 549; judul ternormalisasi berbeda 472; muncul di tepat 1 berkas 447.

**Top 20 judul ###** (normalisasi: huruf kecil, digit -> N, nomor awal dibuang; urut berkas-pemuat)

| judul | berkas | % berkas | kemunculan |
|---|---|---|---|
| lN-fN | 3 | 1% | 12 |
| N.N candidate information | 2 | 1% | 2 |
| N.N competency profile | 2 | 1% | 2 |
| N.N development areas | 2 | 1% | 2 |
| N.N overall assessment | 2 | 1% | 2 |
| N.N overall score | 2 | 1% | 2 |
| N.N recommendation for next stage | 2 | 1% | 2 |
| N.N risk / validation points | 2 | 1% | 2 |
| N.N section scores | 2 | 1% | 2 |
| N.N strengths | 2 | 1% | 2 |
| a.N resep N - cycles headless render (`templates/cycles-headless-rende | 2 | 1% | 2 |
| a.N resep N - gn parametric generator (`templates/gn-parametric-genera | 2 | 1% | 2 |
| ac-N gsp-agent: git show --stat Ncc | 2 | 1% | 2 |
| ac-N gsp-brahma: git show --stat NeNaN | 2 | 1% | 2 |
| ac-N gsp-datacenter: git show --stat NaNbN | 2 | 1% | 2 |
| batasan wajib | 2 | 1% | 2 |
| blok N - candidate information | 2 | 1% | 2 |
| blok N - competency profile | 2 | 1% | 2 |
| blok N - development areas | 2 | 1% | 2 |
| blok N - overall assessment | 2 | 1% | 2 |

**Kunci kepala generik** (40 baris pertama; `fm:` = frontmatter YAML, `kv:` = baris `Kunci: nilai` / `**Kunci:** nilai`; berkas pemuat)

| kunci | berkas | % |
|---|---|---|
| kv:status | 184 | 55% |
| fm:status | 151 | 45% |
| kv:title | 142 | 42% |
| fm:title | 140 | 42% |
| kv:type | 106 | 31% |
| fm:tags | 103 | 31% |
| fm:type | 103 | 31% |
| kv:tags | 103 | 31% |
| fm:domain | 93 | 28% |
| fm:writer | 93 | 28% |
| kv:domain | 93 | 28% |
| kv:writer | 93 | 28% |
| fm:created | 89 | 26% |
| kv:created | 89 | 26% |
| kv:tanggal | 76 | 23% |
| fm:editor | 68 | 20% |
| fm:updated | 68 | 20% |
| kv:editor | 68 | 20% |
| kv:updated | 68 | 20% |
| fm:kelas_bukti | 53 | 16% |
| kv:kelas_bukti | 53 | 16% |
| kv:kartu | 49 | 15% |
| kv:date | 46 | 14% |
| fm:date | 45 | 13% |
| kv:catatan | 38 | 11% |

**Medan kepala bertarget** (regex pada 40 baris pertama; berkas pemuat)

| medan (regex ringkas di Lampiran A) | berkas | % |
|---|---|---|
| status | 197 | 58% |
| agen/owner/peran | 187 | 55% |
| kartu (t_xxxxxxxx / kartu / task_id / task_ref) | 201 | 60% |
| label tanggal (tanggal/date/created/updated/giliran) | 179 | 53% |
| tanggal ISO YYYY-MM-DD di kepala | 298 | 88% |
| misi/tenant/kontrak | 162 | 48% |
| verdict/vonis | 141 | 42% |
| sha | 99 | 29% |
| corr/correlation | 1 | 0% |
| commit/git | 26 | 8% |
| path berkas (ext) | 288 | 85% |

**Nilai status kepala** (`status: x` / `STATUS: x`, 60 baris pertama, 1 per berkas, huruf kecil): berkas bernilai-status = 200

| nilai | berkas |
|---|---|
| complete | 94 |
| draft | 69 |
| usulan | 8 |
| active | 7 |
| perlu_revisi | 5 |
| milik | 4 |
| needs-review | 2 |
| partial-handoff | 2 |
| working-draft | 2 |
| partial | 1 |
| lihat | 1 |
| relevan | 1 |
| status | 1 |
| prov | 1 |
| all | 1 |

**Nilai `VERDICT:`/`VONIS:`** (seluruh berkas, kemunculan pertama, huruf besar): berkas = 129

| nilai | berkas |
|---|---|
| PASS | 67 |
| FAIL | 37 |
| NEEDS_REVIEW | 9 |
| PARTIAL | 3 |
| ALL_OK | 3 |
| ALL | 2 |
| DONE | 2 |
| NEEDS_REMEDIATION | 1 |
| TIDAK | 1 |
| KOSONG | 1 |
| AGREE | 1 |
| STRATEGI | 1 |
| COKOK | 1 |

**Token kosakata status/verdict** (berkas yang memuat kata utuh; huruf-besar dicocokkan persis, huruf-kecil dicocokkan persis huruf kecil)

| token | berkas | % |
|---|---|---|
| complete | 185 | 55% |
| needs-review | 36 | 11% |
| blocked | 20 | 6% |
| NEEDS_REVIEW | 45 | 13% |
| PASS | 178 | 53% |
| CAUTION | 3 | 1% |
| FAIL | 114 | 34% |
| PARKED | 2 | 1% |
| done | 44 | 13% |
| running | 23 | 7% |
| ready | 14 | 4% |
| draft | 88 | 26% |
| todo | 3 | 1% |
| review | 69 | 20% |
| issued | 3 | 1% |
| closed | 16 | 5% |
| approved | 8 | 2% |
| berjalan | 62 | 18% |
| selesai | 56 | 17% |

**Kemunculan hasil-cek huruf besar** (semua kemunculan): PASS=2390, FAIL=884, NEEDS_REVIEW=155, CAUTION=6, NA=5, NEEDS-REVIEW=1

**Id kartu** regex `\bt_[0-9a-f]{8}\b`: berkas pemuat 202 (60%); id unik 338; histogram panjang heks setelah `t_` (semua `t_[0-9a-f]+`): 8:596
- Label kartu non-heks setelah kata "kartu " (bentuk -> jumlah -> contoh): `AAA-A9` x4 (mis. SIM-S6); `AA-99` x2 (mis. SP-10); `AAA-AAAA` x1 (mis. FIX-CIRC); `A9-AAA-A9-A9` x1 (mis. F5-CHK-B9-R3); `AAAA-A9` x1 (mis. BOOK-R6); `A99-A9` x1 (mis. L07-F2)

**Cara merujuk bukti** (regex pada seluruh berkas; berkas pemuat)

| bentuk rujukan | berkas | % |
|---|---|---|
| path docs/... | 172 | 51% |
| path berkas dgn ekstensi | 308 | 91% |
| path:baris (file.ext:NN) | 38 | 11% |
| sha dgn nilai hex>=8 | 86 | 26% |
| corr id (corr <hex8>) | 0 | 0% |
| commit/@hex7+ | 9 | 3% |
| byte/ukuran (NN B/KB/MB) | 140 | 42% |
| exit code | 104 | 31% |
| mtime | 58 | 17% |
| kartu t_xxxxxxxx | 202 | 60% |

##### Contoh berpath: K3 *REPORT*.md (basename)

`./2026-08-24_fleet_test/gsp-coder-execution/execution_report.md`

```text
# Execution Report — gsp-coder-execution (Smoke Test Fleet GSP 2026-08-24)
## Status
**complete**
## Ringkasan Tugas
Menulis skrip Python `sum_stats.py` yang menghitung sum, mean, dan max dari list
```

`./2026-08-30-swarm-ecosystem-audit/REPORT.md`

```text
---
title: "REPORT — Audit Ekosistem Swarm 2026-08-30"
type: catatan
status: draft
created: 2026-08-30
```

`./2026-09-03-il-ingestion-librarian-custodian/L-B0-report.md`

```text
---
title: "Laporan L-B0: promote batch B0 smoke (gsp-orchestration-skill-report)"
date: 2026-09-03
author_profile: gsp-librarian
status: complete
```

`./2026-09-24-rekap-trial-email/review/W5-REVIEW-REPORT-C.md`

```text
# W5-REVIEW REPORT-C (t_1b6b1a34, instrumen verifier independen w5cc)
Laporan ini adalah cetakan hasil instrumen deterministik milik verifier independen atas objek LAPORAN-REKAP-TRIAL-0924.docx revisi C dengan sha16 17317261fd8a3aee beserta berkas LAPORAN.md pendampingn
```
objek sha16: 17317261fd8a3aee (kanonik rev-C); md sha16 8937be5fecccecfd
arsip rev-A sha16 068f89fc0d3e1c00 / md 912e09d00ce7a2bb; arsip rev-B sha16 ad91c47107b24d79 / md 4ac461be78d44a4a
```

`./2026-10-12-game-success-formula/verification/01_verifier_report.md`

```text
# 01_verifier_report - GSF-20 Verifikasi penuh SPK-002 (akun terpisah penulis)
- Misi: GAME-SUCCFORMULA-1012 | Langkah 20 GK verifikasi penuh | Kartu: t_40cefa7e | Tanggal jalan: 2026-10-13 (zona +07)
- Verifier: gsp-thinker run sesi ini (akun sesi berbeda dari penulis formula/rumusan/matriks GSF-12/13/14 dan berbeda dari penulis naskah GSF-16/17/18). Prinsip penulis-bukan-verifikator terpenuhi di 
- Objek yang divonis (hash dihitung sendiri saat laporan ini ditulis): `sajian/01_formula_sukses_game.md` sha256[:16] `8485078b1370bbe6` 132.774 B (identik dengan pin handoff GSF-19, tidak ada mutasi 
- Seed log awal (wajib menurut kartu; diteruskan ke seed_log.json GSF-21): seed induk `GSF20-V1-20261013` (sha256[:16] `0f2f3814381e0605`, dipakai sebagai integer pembangkit). Sampel acak klaim numeri
```

#### K4 *lapor*.md (basename) (n = 291)
- Misi/folder tingkat-1 berbeda: 110; di dalam folder backup*/wiki_backup*: 26; ukuran median 8008 B (min 1158, maks 264558); baris median 101.
- Berkas tanpa satu pun judul ## atau ###: 47 (16%).
- Judul ##: total kemunculan 1816; judul ternormalisasi berbeda 1378; muncul di tepat 1 berkas 1190.

**Top 20 judul ##** (normalisasi: huruf kecil, digit -> N, nomor awal dibuang; urut berkas-pemuat)

| judul | berkas | % berkas | kemunculan |
|---|---|---|---|
| referensi | 19 | 7% | 19 |
| blocker | 13 | 4% | 13 |
| ringkasan | 13 | 4% | 13 |
| hasil check | 12 | 4% | 12 |
| hitung ulang angka turunan (check N) | 12 | 4% | 12 |
| kartu_lanjutan_saran | 11 | 4% | 11 |
| batas klaim | 10 | 3% | 10 |
| ringkasan eksekutif | 10 | 3% | 10 |
| status | 10 | 3% | 10 |
| artefak | 9 | 3% | 9 |
| keterbatasan | 8 | 3% | 8 |
| ringkasan eksekusi | 8 | 3% | 8 |
| N referensi | 7 | 2% | 7 |
| disclaimer | 7 | 2% | 7 |
| penutup | 7 | 2% | 7 |
| N hasil per disiplin | 6 | 2% | 6 |
| angka meta struktural tanpa rk (check N, dilaporkan bukan sebagai beba | 6 | 2% | 6 |
| baris mentah yang diuji (reproduksi) | 6 | 2% | 6 |
| catatan adjudikasi | 6 | 2% | 6 |
| sampel tautan (check N/N) | 6 | 2% | 6 |

- Judul ###: total kemunculan 645; judul ternormalisasi berbeda 478; muncul di tepat 1 berkas 370.

**Top 20 judul ###** (normalisasi: huruf kecil, digit -> N, nomor awal dibuang; urut berkas-pemuat)

| judul | berkas | % berkas | kemunculan |
|---|---|---|---|
| N.N validasi dan pelepasan situs | 6 | 2% | 6 |
| N.N offer-N - connectx (connectx.solutions) | 5 | 2% | 5 |
| N.N offer-N - hootsuite (enterprise apac) / produk talkwalker | 5 | 2% | 5 |
| N.N offer-N - intelligence x (dioperasikan kleissner investments s.r.o | 5 | 2% | 5 |
| N.N offer-N - quadrant (quadrant.io) | 5 | 2% | 5 |
| N.N offer-N - sntt (osntt.com) | 5 | 2% | 5 |
| N.N deviasi geometri terukur (cacat nyata, butuh kartu perbaikan) | 4 | 1% | 4 |
| N.N deviasi tinggi tulis yang dibukukan (menunggu keputusan reviewer) | 4 | 1% | 4 |
| N.N distribusi per bidang fokus (N baris, termasuk yang nihil) | 4 | 1% | 4 |
| N.N enam poin baru hg-imp-cN..cN (vN.N) | 4 | 1% | 4 |
| N.N metode penilaian (ringkas) | 4 | 1% | 4 |
| N.N sepuluh poin lama (cad-master-orchestrator) | 4 | 1% | 4 |
| N.N tunda fase dan revisi terbuka (bukan cacat) | 4 | 1% | 4 |
| N.N blok peringkat: top-N pendalaman dan korespondensi | 3 | 1% | 3 |
| N.N closed putaran-N (dengan angka sebelum/sesudah, semua cetakan alat | 3 | 1% | 3 |
| N.N defect checker warisan [paket-lama] (cacat alat ukur, ranah kartu  | 3 | 1% | 3 |
| N.N kedalaman, keyakinan, dan jejak regional | 3 | 1% | 3 |
| N.N masih terbuka / dicatat (bukan ditambal di kartu ini) | 3 | 1% | 3 |
| N.N offer-N - babel street | 3 | 1% | 3 |
| N.N pemisahan verdict dan relevansi gsp | 3 | 1% | 3 |

**Kunci kepala generik** (40 baris pertama; `fm:` = frontmatter YAML, `kv:` = baris `Kunci: nilai` / `**Kunci:** nilai`; berkas pemuat)

| kunci | berkas | % |
|---|---|---|
| kv:status | 170 | 58% |
| fm:status | 98 | 34% |
| kv:title | 89 | 31% |
| fm:title | 87 | 30% |
| kv:date | 73 | 25% |
| fm:date | 71 | 24% |
| kv:author_profile | 66 | 23% |
| kv:task_ref | 66 | 23% |
| fm:author_profile | 64 | 22% |
| fm:task_ref | 64 | 22% |
| fm:source_refs | 60 | 21% |
| kv:source_refs | 57 | 20% |
| kv:kartu | 51 | 18% |
| kv:tanggal | 39 | 13% |
| kv:verdict | 32 | 11% |
| kv:objek | 30 | 10% |
| fm:penulis | 23 | 8% |
| kv:penulis | 23 | 8% |
| fm:tags | 21 | 7% |
| fm:type | 21 | 7% |
| kv:tags | 21 | 7% |
| kv:type | 21 | 7% |
| kv:misi | 21 | 7% |
| fm:naturalisasi | 19 | 7% |
| kv:naturalisasi | 19 | 7% |

**Medan kepala bertarget** (regex pada 40 baris pertama; berkas pemuat)

| medan (regex ringkas di Lampiran A) | berkas | % |
|---|---|---|
| status | 196 | 67% |
| agen/owner/peran | 100 | 34% |
| kartu (t_xxxxxxxx / kartu / task_id / task_ref) | 236 | 81% |
| label tanggal (tanggal/date/created/updated/giliran) | 153 | 53% |
| tanggal ISO YYYY-MM-DD di kepala | 221 | 76% |
| misi/tenant/kontrak | 187 | 64% |
| verdict/vonis | 209 | 72% |
| sha | 176 | 60% |
| corr/correlation | 1 | 0% |
| commit/git | 22 | 8% |
| path berkas (ext) | 280 | 96% |

**Nilai status kepala** (`status: x` / `STATUS: x`, 60 baris pertama, 1 per berkas, huruf kecil): berkas bernilai-status = 197

| nilai | berkas |
|---|---|
| complete | 141 |
| usulan | 10 |
| needs-review | 9 |
| partial-handoff | 9 |
| draft | 4 |
| active | 4 |
| perlu_revisi | 4 |
| selesai | 3 |
| done | 2 |
| laporan | 2 |
| complete-draft | 1 |
| preliminary | 1 |
| rilis | 1 |
| awaiting | 1 |
| serah | 1 |

**Nilai `VERDICT:`/`VONIS:`** (seluruh berkas, kemunculan pertama, huruf besar): berkas = 101

| nilai | berkas |
|---|---|
| PASS | 60 |
| FAIL | 28 |
| NEEDS_REVIEW | 5 |
| ALL | 2 |
| DROP-SAH | 1 |
| TIDAK | 1 |
| BERSIH | 1 |
| SATU | 1 |
| FAIL-PERBAIKAN | 1 |
| SEHAT | 1 |

**Token kosakata status/verdict** (berkas yang memuat kata utuh; huruf-besar dicocokkan persis, huruf-kecil dicocokkan persis huruf kecil)

| token | berkas | % |
|---|---|---|
| complete | 175 | 60% |
| needs-review | 21 | 7% |
| blocked | 17 | 6% |
| NEEDS_REVIEW | 39 | 13% |
| PASS | 251 | 86% |
| CAUTION | 0 | 0% |
| FAIL | 154 | 53% |
| PARKED | 7 | 2% |
| done | 26 | 9% |
| running | 16 | 5% |
| ready | 4 | 1% |
| draft | 17 | 6% |
| todo | 6 | 2% |
| review | 40 | 14% |
| issued | 0 | 0% |
| closed | 5 | 2% |
| approved | 0 | 0% |
| berjalan | 85 | 29% |
| selesai | 80 | 27% |

**Kemunculan hasil-cek huruf besar** (semua kemunculan): PASS=2616, FAIL=774, NEEDS_REVIEW=110

**Id kartu** regex `\bt_[0-9a-f]{8}\b`: berkas pemuat 216 (74%); id unik 409; histogram panjang heks setelah `t_` (semua `t_[0-9a-f]+`): 8:826
- Label kartu non-heks setelah kata "kartu " (bentuk -> jumlah -> contoh): `A9-A` x6 (mis. R2-A); `AAA-A9` x4 (mis. VGV-C2); `A9-AAA` x3 (mis. F5-FIX); `AAA-AAA-999` x3 (mis. REF-CIV-001); `AA-AAAAA` x3 (mis. RE-RAKIT); `AA-A9` x2 (mis. QA-E3)

**Cara merujuk bukti** (regex pada seluruh berkas; berkas pemuat)

| bentuk rujukan | berkas | % |
|---|---|---|
| path docs/... | 120 | 41% |
| path berkas dgn ekstensi | 285 | 98% |
| path:baris (file.ext:NN) | 32 | 11% |
| sha dgn nilai hex>=8 | 141 | 48% |
| corr id (corr <hex8>) | 1 | 0% |
| commit/@hex7+ | 5 | 2% |
| byte/ukuran (NN B/KB/MB) | 178 | 61% |
| exit code | 122 | 42% |
| mtime | 42 | 14% |
| kartu t_xxxxxxxx | 216 | 74% |

##### Contoh berpath: K4 *lapor*.md (basename)

`./2026-08-24_adint-vendor-research/LAPORAN-WAVE-A.md`

```text
---
title: "IL Rebuild — Analisa Folder docs/2026-08-24_adint-vendor-research"
type: catatan
status: complete
created: 2026-08-25
```

`./2026-09-05-progress-report/LAPORAN-POSISI-ETA-0509-1538.md`

```text
# LAPORAN POSISI DAN ETA SEMUA TAB (Sabtu 05-09-2026, ukur 15:38 WIB)
## A. Ringkasan keadaan
Papan kanban hasil export pukul 15:38 memuat 1.385 kartu, bertambah 49 kartu sejak laporan pagi, dengan tujuh kartu RUNNING, dua kartu blocked aktif-misi, dan 23 kartu TODO di dalam rantai yang digera
## B. Posisi dan estimasi selesai per tab
| Tab | Posisi sekarang | Sisa | ETA selesai |
```

`./2026-09-21-ft-deep-dive/verification/reports/V3-laporan-20260921T183207Z.md`

```text
# Laporan V3 FTDEEP-0921 (verifikasi angka edisi komprehensif)
- kartu: t_de7602ee (gsp-verifier), parent S2 t_202a8550
- eksekusi UTC: 20260921T183207Z
- skrip: verification/scripts/v3_check.py (parser verifier sendiri, tanpa impor kode lajur/S2)
- objek uji: output/LAPORAN-KOMPREHENSIF-FTDEEP-0921.md + synthesis/register-klaim-v2.md
```

`./2026-10-04-prompt-manual/verification/sunting-c-laporan.md`

```text
---
title: "Laporan SUNTING-C: T-01a/b/c + remedi TEMU-RG2-01 + rakit ulang idempoten v3"
date: 2026-10-05
author_profile: gsp-document-writer
status: complete
```

`./2026-10-10-tracero-dispatcher-1010/laporan.md`

```text
# TRACEROOT-DISPATCHER-1010 - Laporan Diagnosis Akar
Tiket R3 dari AUDIT-DURASI-1010 (§3.2 / §5). Penyusun: gsp-system-manager
(lane CONTROLLER, eksekusi langsung kelas infra/ops pada kartu t_57ff71c4).
Semua angka adalah cetakan alat pada giliran ini: kueri `kanban.db`
(tables tasks, task_runs, task_events), `state.db` profil worker, pembacaan
```

#### K5 *countersign*.md (n = 172)
- Misi/folder tingkat-1 berbeda: 73; di dalam folder backup*/wiki_backup*: 0; ukuran median 10037 B (min 1156, maks 36840); baris median 83.
- Berkas tanpa satu pun judul ## atau ###: 13 (8%).
- Judul ##: total kemunculan 1075; judul ternormalisasi berbeda 840; muncul di tepat 1 berkas 738.

**Top 20 judul ##** (normalisasi: huruf kecil, digit -> N, nomor awal dibuang; urut berkas-pemuat)

| judul | berkas | % berkas | kemunculan |
|---|---|---|---|
| referensi | 28 | 16% | 28 |
| putusan | 18 | 10% | 18 |
| tabel check | 13 | 8% | 13 |
| verdict | 13 | 8% | 13 |
| putusan countersign | 8 | 5% | 8 |
| vonis | 8 | 5% | 8 |
| temuan | 7 | 4% | 7 |
| kesesuaian dengan klaim hulu | 6 | 3% | 6 |
| vonis akhir | 6 | 3% | 6 |
| kartu_lanjutan_saran | 5 | 3% | 5 |
| verdict countersign | 5 | 3% | 5 |
| vonis countersign | 5 | 3% | 5 |
| batas klaim | 4 | 2% | 4 |
| blocker | 4 | 2% | 4 |
| daftar check (bukti segar eksekusi verifier) | 4 | 2% | 4 |
| hasil hitung ulang (angka milik verifier sendiri) | 4 | 2% | 4 |
| hasil verifikasi (setiap baris dari ukur sendiri, bukan kutipan pekerj | 4 | 2% | 4 |
| kesimpulan | 4 | 2% | 4 |
| kesimpulan countersign | 4 | 2% | 4 |
| putusan ringkas | 4 | 2% | 4 |

- Judul ###: total kemunculan 74; judul ternormalisasi berbeda 71; muncul di tepat 1 berkas 71.

**Top 20 judul ###** (normalisasi: huruf kecil, digit -> N, nomor awal dibuang; urut berkas-pemuat)

| judul | berkas | % berkas | kemunculan |
|---|---|---|---|
| bukti langkah N — eksekusi ulang verifier | 1 | 1% | 2 |
| kesimpulan countersign | 1 | 1% | 2 |
| putusan | 1 | 1% | 2 |
| N.N `sumber arsip gsp-ar-N N.N.` (koreksi dua arah) | 1 | 1% | 1 |
| N.N fetch hidup mandiri N url kanonik (tanpa cache misi, curl ua brows | 1 | 1% | 1 |
| N.N gN sebenarnya tertentu, bukan tidak terukur | 1 | 1% | 1 |
| N.N gerbang terpasang di builder (saya baca sendiri, bukan dari summar | 1 | 1% | 1 |
| N.N kenapa vonis tidak bisa dibalik oleh sengketa metode apa pun | 1 | 1% | 1 |
| N.N parser sensus milik sendiri, ditulis dari nol | 1 | 1% | 1 |
| N.N penajaman dan koreksi rN (semuanya instrumen milik kartu ini sendi | 1 | 1% | 1 |
| N.N pencocokan terhadap proyeksi run pertama | 1 | 1% | 1 |
| N.N red-green parser sendiri (bukti parser tidak vacuous) | 1 | 1% | 1 |
| N.N register dan nama berkas menyimpang dari d-a tanpa putusan (fail p | 1 | 1% | 1 |
| N.N rekonstruksi (bukan karangan ulang dari nol) | 1 | 1% | 1 |
| N.N segel vNo utuh | 1 | 1% | 1 |
| N.N sensus independen atas baseline beku ddNcNfNb (uji kalibrasi, buka | 1 | 1% | 1 |
| N.N waiver bN/bN/bN belum cukup dengan satu catatan | 1 | 1% | 1 |
| adjudikasi mandiri N pemblokir sisa (baca sel langsung, bukan output g | 1 | 1% | 1 |
| ambang tidak digeser (d-ta-N terjaga) | 1 | 1% | 1 |
| angka inventaris pustaka-teknis vN.N.N vs disk | 1 | 1% | 1 |

**Kunci kepala generik** (40 baris pertama; `fm:` = frontmatter YAML, `kv:` = baris `Kunci: nilai` / `**Kunci:** nilai`; berkas pemuat)

| kunci | berkas | % |
|---|---|---|
| kv:status | 80 | 47% |
| fm:status | 57 | 33% |
| kv:title | 51 | 30% |
| fm:title | 48 | 28% |
| kv:date | 46 | 27% |
| fm:date | 44 | 26% |
| kv:author_profile | 44 | 26% |
| kv:task_ref | 44 | 26% |
| fm:author_profile | 42 | 24% |
| fm:task_ref | 42 | 24% |
| kv:source_refs | 40 | 23% |
| fm:source_refs | 39 | 23% |
| kv:kartu | 36 | 21% |
| kv:tanggal | 31 | 18% |
| kv:verdict | 30 | 17% |
| kv:metode | 25 | 15% |
| kv:verifikator | 20 | 12% |
| kv:objek | 14 | 8% |
| kv:seed | 13 | 8% |
| kv:objek countersign | 13 | 8% |
| kv:verifier | 11 | 6% |
| kv:objek uji | 11 | 6% |
| kv:tanggal ukur | 11 | 6% |
| kv:misi | 11 | 6% |
| kv:card | 10 | 6% |

**Medan kepala bertarget** (regex pada 40 baris pertama; berkas pemuat)

| medan (regex ringkas di Lampiran A) | berkas | % |
|---|---|---|
| status | 88 | 51% |
| agen/owner/peran | 98 | 57% |
| kartu (t_xxxxxxxx / kartu / task_id / task_ref) | 156 | 91% |
| label tanggal (tanggal/date/created/updated/giliran) | 96 | 56% |
| tanggal ISO YYYY-MM-DD di kepala | 148 | 86% |
| misi/tenant/kontrak | 129 | 75% |
| verdict/vonis | 167 | 97% |
| sha | 147 | 85% |
| corr/correlation | 0 | 0% |
| commit/git | 10 | 6% |
| path berkas (ext) | 172 | 100% |

**Nilai status kepala** (`status: x` / `STATUS: x`, 60 baris pertama, 1 per berkas, huruf kecil): berkas bernilai-status = 95

| nilai | berkas |
|---|---|
| complete | 69 |
| partial-handoff | 10 |
| draft | 5 |
| needs-review | 3 |
| superseded-partial-handoff | 2 |
| selesai | 2 |
| done | 1 |
| complete-dengan-putusan | 1 |
| siap-uji | 1 |
| active | 1 |

**Nilai `VERDICT:`/`VONIS:`** (seluruh berkas, kemunculan pertama, huruf besar): berkas = 140

| nilai | berkas |
|---|---|
| PASS | 62 |
| FAIL | 39 |
| SETUJU | 11 |
| NEEDS_REVIEW | 7 |
| AGREE | 7 |
| YES | 3 |
| SETUJU-RILIS | 3 |
| TIDAK | 2 |
| RETURN | 2 |
| NO | 1 |
| BENAR | 1 |
| OFF | 1 |
| ON | 1 |

**Token kosakata status/verdict** (berkas yang memuat kata utuh; huruf-besar dicocokkan persis, huruf-kecil dicocokkan persis huruf kecil)

| token | berkas | % |
|---|---|---|
| complete | 88 | 51% |
| needs-review | 10 | 6% |
| blocked | 6 | 3% |
| NEEDS_REVIEW | 94 | 55% |
| PASS | 162 | 94% |
| CAUTION | 1 | 1% |
| FAIL | 137 | 80% |
| PARKED | 2 | 1% |
| done | 19 | 11% |
| running | 9 | 5% |
| ready | 6 | 3% |
| draft | 7 | 4% |
| todo | 4 | 2% |
| review | 18 | 10% |
| issued | 0 | 0% |
| closed | 3 | 2% |
| approved | 0 | 0% |
| berjalan | 41 | 24% |
| selesai | 52 | 30% |

**Kemunculan hasil-cek huruf besar** (semua kemunculan): PASS=2283, FAIL=838, NEEDS_REVIEW=296, NA=2, CAUTION=1

**Id kartu** regex `\bt_[0-9a-f]{8}\b`: berkas pemuat 155 (90%); id unik 343; histogram panjang heks setelah `t_` (semua `t_[0-9a-f]+`): 7:1, 8:632
- Label kartu non-heks setelah kata "kartu " (bentuk -> jumlah -> contoh): `AA-9` x5 (mis. CS-4); `AAA-A9` x5 (mis. FIX-W1); `A-99` x3 (mis. C-15); `AAA-A99A` x3 (mis. FIX-S17C); `AAAAAA-A9` x2 (mis. VERIFY-R2); `AA-99` x2 (mis. CS-11)

**Cara merujuk bukti** (regex pada seluruh berkas; berkas pemuat)

| bentuk rujukan | berkas | % |
|---|---|---|
| path docs/... | 75 | 44% |
| path berkas dgn ekstensi | 172 | 100% |
| path:baris (file.ext:NN) | 26 | 15% |
| sha dgn nilai hex>=8 | 118 | 69% |
| corr id (corr <hex8>) | 0 | 0% |
| commit/@hex7+ | 3 | 2% |
| byte/ukuran (NN B/KB/MB) | 124 | 72% |
| exit code | 89 | 52% |
| mtime | 59 | 34% |
| kartu t_xxxxxxxx | 155 | 90% |

##### Contoh berpath: K5 *countersign*.md

`./2026-08-29-lean-fleet/system_control_countersign_final.md`

```text
---
title: "CounterSign Final — Lean Fleet (System Control)"
type: catatan
status: draft
created: 2026-08-29
```

`./2026-09-03-expo26-tier1-deepening/reports/countersign_akurasi_v7j_cs9b.md`

```text
# Countersign akurasi v7j — CS-9b (t_b82af6ff) — SUPERSEDED (partial-handoff)
STATUS: superseded-partial-handoff
Worker: gsp-test-expert · Tanggal: 2026-09-05 15:33–15:41 · Seed yang direncanakan: CS9B (belum dipakai)
Artefak uji: docs/2026-09-03-expo26-tier1-deepening/process/expo26_revB.xlsx
Verdict: TIDAK DITERBITKAN — CHECK 1–6 belum ada yang selesai penuh; vonis ditunda ke kartu countersign pasca-v7k/v7l.
```

`./2026-09-05-modernday26-deepdive/reports/countersign_mdm.md`

```text
# countersign_mdm.md | MODMARINE26-CS langkah 15 | countersign independen C01-C05
# Worker : gsp-test-expert (kartu t_b44f0215) | 2026-09-05T17:55+07:00
# Objek : docs/2026-09-05-modernday26-deepdive/process/mdm/build/ModMarine26-Workbook-Pendalaman-RevA.xlsx
#         sha256 dibaca dari disk saat mulai = d26b1f3703324e82627bcd1b939196d49c109bf8aca71f8c530ccf1b56c98122 (425.642 B); diukur ulang saat selesai: identik (stabil).
#         Narasi ModMarine26-Laporan-Pendalaman-RevA.md sha256=9d1f9a5b8264f72f6518b6238121c45dfd36e698e3ab6e420206d268bad22b00 (35.539 B).
```

`./2026-09-25-rafif-guide/verification/COUNTERSIGN.md`

```text
---
title: "COUNTERSIGN verifikasi panduan RAFIF - RAFIF-GUIDE-0925"
date: 2026-09-25
author_profile: gsp-document-reviewer
status: complete
```

`./2026-10-14_gaya-manusia-global/work/11_countersign-revI.md`

```text
# 11_countersign-revI - Countersign independen hasil increment kedua GML2
- Kartu: `t_ada29a0f` (GML2-F2, langkah 8 blueprint), tenant GML2-1020
- Peran: `roles/gsp-verifier.md` dijalankan profil `gsp-thinker` sebagai kendaraan, run 6948, sesi `20261020_112405_a09373`
- Diukur: 2026-10-20 pukul 11:24 sampai 11:45 WIB, seluruh angka adalah cetakan alat pada giliran ini, bukan salinan dari laporan pihak lain
- Instrumen: scanner kanonik `scan_ai_footprint.py` v1.13.0 menurut cetakan `--version` alat itu sendiri (261.426 B, sha256[:16] `df291e2c5ec09175`), Python 3.11 hashlib, certutil, dan salinan sampel 
```

#### K6 *verdict*/*vonis*.md (n = 257)
- Misi/folder tingkat-1 berbeda: 70; di dalam folder backup*/wiki_backup*: 6; ukuran median 8593 B (min 785, maks 39214); baris median 69.
- Berkas tanpa satu pun judul ## atau ###: 23 (9%).
- Judul ##: total kemunculan 1364; judul ternormalisasi berbeda 940; muncul di tepat 1 berkas 818.

**Top 20 judul ##** (normalisasi: huruf kecil, digit -> N, nomor awal dibuang; urut berkas-pemuat)

| judul | berkas | % berkas | kemunculan |
|---|---|---|---|
| verdict | 61 | 24% | 61 |
| tabel vonis | 45 | 18% | 45 |
| bukti reproduksi | 41 | 16% | 41 |
| lampiran a - daftar caption saja (bukti uji tanpa-label, kriteria N) | 31 | 12% | 31 |
| check | 12 | 5% | 12 |
| lampiran b - catatan instrumen (anti-positif-palsu) | 10 | 4% | 10 |
| vonis akhir | 10 | 4% | 10 |
| resep perbaikan (semua non-pemblokir, untuk controller / kartu hilir) | 9 | 4% | 9 |
| vonis | 9 | 4% | 9 |
| catatan verifikator | 8 | 3% | 8 |
| prekondisi: shaN register beku (syarat pakai) | 8 | 3% | 8 |
| sampel entity-match (n=N, seed N-vN) | 8 | 3% | 8 |
| ringkasan vonis | 7 | 3% | 7 |
| batas klaim | 6 | 2% | 6 |
| resep perbaikan (verifier tidak menambal; untuk kartu fix) | 6 | 2% | 6 |
| sN register negatif | 6 | 2% | 6 |
| sN rekonsiliasi cakupan vs angka resmi | 6 | 2% | 6 |
| metode | 5 | 2% | 5 |
| pin objek yang divonis (check N) | 5 | 2% | 5 |
| tabel vonis ulang | 5 | 2% | 5 |

- Judul ###: total kemunculan 227; judul ternormalisasi berbeda 215; muncul di tepat 1 berkas 205.

**Top 20 judul ###** (normalisasi: huruf kecil, digit -> N, nomor awal dibuang; urut berkas-pemuat)

| judul | berkas | % berkas | kemunculan |
|---|---|---|---|
| adjudikasi per-baris temuan sisa (baca sel mandiri openpyxl, tanpa ala | 2 | 1% | 2 |
| aud-dsp - gerbang dokumen sebagian lulus; vonis jenuh-bersyarat diperb | 2 | 1% | 2 |
| brk-ptz - jenuh-kelas-harga diperluas (pita melebar ke atas oleh brake | 2 | 1% | 2 |
| cek N - figur (pass) | 2 | 1% | 2 |
| cek N - kelengkapan struktur (pass) | 2 | 1% | 2 |
| cek N - register versus sitasi (pass) | 2 | 1% | 2 |
| cek N - scanner kanal dokumen (pass) | 2 | 1% | 2 |
| kam-N - masih menghasilkan temuan baru di ronde-N dan ronde-N -> cappe | 2 | 1% | 2 |
| kam-N - tidak berubah dari jenuh-siap-audit (ronde-N/N tidak menambah  | 2 | 1% | 2 |
| mik - tetap belum jenuh; dua kemajuan terdokumentasi | 2 | 1% | 2 |
| hasil recheck custodian ronde-N (kartu t_ddN) | 1 | 0% | 2 |
| verdict d-N: pass | 1 | 0% | 2 |
| N.N angka produk/vendor terhadap sumber oem hidup (lN/lN) | 1 | 0% | 1 |
| N.N blok dua: g-e butir nc-N, dua tapak stop sharing menyebut objek (k | 1 | 0% | 1 |
| N.N blok empat: spot-check regresi fungsional, drawer, dan kontrol fix | 1 | 0% | 1 |
| N.N blok satu: g-f sub-butir N, permukaan todos lewat klik nyata (kelu | 1 | 0% | 1 |
| N.N blok tiga: spot-check regresi rbac dan kanal share/pwa pada byte h | 1 | 0% | 1 |
| N.N estimasi butir katalog vis-nn per kelompok | 1 | 0% | 1 |
| N.N field `domain` kosong pada empat objek forensic: dasar klasifikasi | 1 | 0% | 1 |
| N.N fondasi sumprimer (lN) | 1 | 0% | 1 |

**Kunci kepala generik** (40 baris pertama; `fm:` = frontmatter YAML, `kv:` = baris `Kunci: nilai` / `**Kunci:** nilai`; berkas pemuat)

| kunci | berkas | % |
|---|---|---|
| kv:kartu | 96 | 37% |
| kv:verdict | 73 | 28% |
| kv:status | 55 | 21% |
| kv:mandat | 43 | 17% |
| fm:status | 41 | 16% |
| kv:alat ukur | 41 | 16% |
| kv:instrumen | 40 | 16% |
| kv:tanggal | 35 | 14% |
| kv:objek pin | 31 | 12% |
| fm:title | 26 | 10% |
| kv:title | 26 | 10% |
| kv:objek | 25 | 10% |
| kv:misi | 20 | 8% |
| fm:date | 20 | 8% |
| fm:task_ref | 20 | 8% |
| kv:date | 20 | 8% |
| kv:task_ref | 20 | 8% |
| fm:author_profile | 19 | 7% |
| kv:author_profile | 19 | 7% |
| kv:verifikator | 18 | 7% |
| kv:verifier | 15 | 6% |
| fm:tanggal | 14 | 5% |
| fm:source_refs | 14 | 5% |
| fm:misi | 12 | 5% |
| fm:kartu | 11 | 4% |

**Medan kepala bertarget** (regex pada 40 baris pertama; berkas pemuat)

| medan (regex ringkas di Lampiran A) | berkas | % |
|---|---|---|
| status | 75 | 29% |
| agen/owner/peran | 136 | 53% |
| kartu (t_xxxxxxxx / kartu / task_id / task_ref) | 236 | 92% |
| label tanggal (tanggal/date/created/updated/giliran) | 76 | 30% |
| tanggal ISO YYYY-MM-DD di kepala | 186 | 72% |
| misi/tenant/kontrak | 151 | 59% |
| verdict/vonis | 257 | 100% |
| sha | 164 | 64% |
| corr/correlation | 0 | 0% |
| commit/git | 32 | 12% |
| path berkas (ext) | 251 | 98% |

**Nilai status kepala** (`status: x` / `STATUS: x`, 60 baris pertama, 1 per berkas, huruf kecil): berkas bernilai-status = 76

| nilai | berkas |
|---|---|
| complete | 39 |
| partial-handoff | 12 |
| needs-review | 5 |
| active | 3 |
| usulan | 3 |
| done | 2 |
| final | 2 |
| selesai | 2 |
| partial | 1 |
| complete-dengan-putusan-terbuka | 1 |
| pass | 1 |
| terverifikasi | 1 |
| r | 1 |
| capped | 1 |
| final-bersyarat | 1 |

**Nilai `VERDICT:`/`VONIS:`** (seluruh berkas, kemunculan pertama, huruf besar): berkas = 163

| nilai | berkas |
|---|---|
| PASS | 101 |
| FAIL | 40 |
| NEEDS_REVIEW | 6 |
| PERBAIKAN | 3 |
| ALL_OK | 2 |
| LULUS-RATIFIKASI | 2 |
| PASS-BERSYARAT-COUNTERSIGN | 1 |
| TS-IT | 1 |
| BELUM | 1 |
| PARTIAL | 1 |
| TIDAK | 1 |
| VONIS-LEPAS | 1 |
| EARLY | 1 |
| PASS-RILIS | 1 |
| MODA | 1 |

**Token kosakata status/verdict** (berkas yang memuat kata utuh; huruf-besar dicocokkan persis, huruf-kecil dicocokkan persis huruf kecil)

| token | berkas | % |
|---|---|---|
| complete | 69 | 27% |
| needs-review | 13 | 5% |
| blocked | 11 | 4% |
| NEEDS_REVIEW | 61 | 24% |
| PASS | 210 | 82% |
| CAUTION | 0 | 0% |
| FAIL | 148 | 58% |
| PARKED | 6 | 2% |
| done | 15 | 6% |
| running | 8 | 3% |
| ready | 4 | 2% |
| draft | 9 | 4% |
| todo | 2 | 1% |
| review | 35 | 14% |
| issued | 0 | 0% |
| closed | 5 | 2% |
| approved | 0 | 0% |
| berjalan | 35 | 14% |
| selesai | 44 | 17% |

**Kemunculan hasil-cek huruf besar** (semua kemunculan): PASS=3540, FAIL=761, NEEDS_REVIEW=236, NA=10

**Id kartu** regex `\bt_[0-9a-f]{8}\b`: berkas pemuat 213 (83%); id unik 393; histogram panjang heks setelah `t_` (semua `t_[0-9a-f]+`): 8:689
- Label kartu non-heks setelah kata "kartu " (bentuk -> jumlah -> contoh): `AAA-A9` x4 (mis. FIX-W4); `A9-9` x3 (mis. F3-2); `A-99` x3 (mis. B-04); `AAA-AAAAAA-A9` x2 (mis. NAT-FOLLOW-R5); `AAAAAAA-A99A` x2 (mis. BIZPLAN-S18B); `A9A-AAAAA-A9` x1 (mis. G4B-CLOSE-R2)

**Cara merujuk bukti** (regex pada seluruh berkas; berkas pemuat)

| bentuk rujukan | berkas | % |
|---|---|---|
| path docs/... | 75 | 29% |
| path berkas dgn ekstensi | 252 | 98% |
| path:baris (file.ext:NN) | 40 | 16% |
| sha dgn nilai hex>=8 | 139 | 54% |
| corr id (corr <hex8>) | 0 | 0% |
| commit/@hex7+ | 11 | 4% |
| byte/ukuran (NN B/KB/MB) | 170 | 66% |
| exit code | 103 | 40% |
| mtime | 85 | 33% |
| kartu t_xxxxxxxx | 213 | 83% |

##### Contoh berpath: K6 *verdict*/*vonis*.md

`./2026-09-02-laporan-kenaikan-fase/VERDICT-ORC.md`

```text
# VERDICT ORC-VRF (t_6a01b52c) - Audit deterministik aturan Laporan Kenaikan Fase
| kartu | verifier | tanggal | skrip | sha256 skrip (16) | kanal |
|---|---|---|---|---|---|
| t_6a01b52c | gsp-verifier | 2026-09-02 19:10 WIB | orc_vrf_check.py v2 (frozen) | 741a67e64289c18d | doc |
VONIS AKHIR: **NEEDS_REVIEW**. Seluruh kriteria selesai kontrak (sec. 4 butir 1-3) dan
```

`./2026-09-23-dems-edge/AMAND-01_vonis-kamera.md`

```text
# AMANDEMEN AMAND-01 DEMS-EDGE-0923 (23-09 23:15) - Putusan User: Vonis Kamera 3 Opsi
## Isi direktif user (verbatim)
"Untuk Pilihan Kamera - Tentukan Pilihan terbaik [1. HD KATOV Kamera] atau [UNV Camera] atau [Hybrid]; Kaji dengan mendalam"
## Konsekuensi mengikat
1. Lajur B1 (kartu t_51a9d740, gsp-vss-specialist) TIDAK cukup berhenti pada komparasi dua kamera.
```

`./2026-10-03-dems-vendor-saturation/lanes/L16-F4/vonis.md`

```text
# VONIS GERBANG JENUH S1-S4 - L16-F4 (RoW)
Angka di bawah dicetak parser dari register.tsv + raw/*.jsonl pada 2026-10-04T00:24:33 (bukan salinan narasi).
BARIS_REGISTER=148 | VENDOR_UNIK=136 | TIER: TRUSTED=51 PROVISIONAL=25 UNTRUSTED=72
GRUP: {'A': 50, 'C': 64, 'X-ADJ': 2, 'B': 21, 'D': 11}
SPEC: {'ADAPTASI': 79, 'TIDAK': 69}
```

`./2026-10-09-mitra-dd-procedure/verification/VERDICT2.md`

```text
# VERDICT2 - V-GATE2 DDV-STD-1009 (umum: gen-source.md + skill gsp-deep-dive)
Verifier: gsp-verifier (kartu t_55c789d8, run 5655). Penulis bukan verifikator: naskah ditulis
gsp-pm-writer (t_a17c4b07), skill oleh gsp-document-writer (t_e58b6970); instrumen di bawah
ditulis ulang dari nol pada giliran ini, bukan salinan gerbang pekerja.
Alat ukur: CONTRACT.md D-03..D-21 + blueprint 02b §2.3/§3.1/§3.3/§6.1 (D-03..D-20 sesuai kartu;
```

`./2026-10-13-vibe-coding-bible/reviews/ch27-verdict.md`

```text
# Verdict W3: Bab 27 "MCP connects the agent to the world; an unbraked loop is a designed accident" (manuscript/ch27.md)
- Kartu: t_60ed37fa (tenant VIBE-BIBLE-1013). Verifier: gsp-thinker peran gsp-verifier (akun beda dari penulis; penulis = t_99bb85a4). Tanggal ukur: 15 Oktober 2026. Giliran ini = run ke-2 (run 6581 m
- Objek pin: `manuscript/ch27.md` 34.039 B, sha16 `2fa829c03356fe5e`, mtime 15-10 01:01 + `assets/fig/ch27/`: 8 PNG (semua 1511 px lebar = 127,9 mm pada 300 dpi), `build_figs.py` 15.483 B sha16 `e304c
- Alat ukur: `02_structured.md` S5 GERBANG MUTU + baris silabus bab 27 (SYLLABUS-GB1 L119 + 02#L93 lokus 27.1-27.6) + KONTRAK-AUDIENS + anatomi 02#S2 + kartu penulis `cards/m4-ch27.md` (rentang 5.280-
- Instrumen (scratch kartu t_60ed37fa, deterministik, tanpa LLM): `verify_ch27_w3.py` (12 kriteria + 55 token klaim), `probe_g_ch27.py` (sapuan tEXt PNG, dimensi, hex literal, census SOURCE casing, pi
```

#### K7 verif* (nama berkas atau folder verification|verif|verifikasi|verify) (n = 784)
- Misi/folder tingkat-1 berbeda: 159; di dalam folder backup*/wiki_backup*: 147; ukuran median 5144 B (min 0, maks 1509099); baris median 54.
- Berkas tanpa satu pun judul ## atau ###: 234 (30%).
- Judul ##: total kemunculan 3570; judul ternormalisasi berbeda 2224; muncul di tepat 1 berkas 1780.

**Top 20 judul ##** (normalisasi: huruf kecil, digit -> N, nomor awal dibuang; urut berkas-pemuat)

| judul | berkas | % berkas | kemunculan |
|---|---|---|---|
| keterbatasan entri (kolom keterbatasan tabel peringkat, verbatim) | 78 | 10% | 78 |
| verdict | 35 | 4% | 35 |
| referensi | 29 | 4% | 29 |
| vonis | 25 | 3% | 25 |
| bukti (disalin dari blok entri `wave_N_consumer_retail_health` baris N | 18 | 2% | 18 |
| ringkasan | 17 | 2% | 17 |
| bukti (disalin dari blok entri `wave_N_telecom_media` baris N) | 14 | 2% | 14 |
| bukti (disalin dari blok entri `wave_N_transportation_logistics` baris | 12 | 2% | 12 |
| batas klaim | 11 | 1% | 11 |
| status | 11 | 1% | 11 |
| vonis akhir | 11 | 1% | 11 |
| bukti (disalin dari blok entri `wave_N_finance_banking` baris N) | 10 | 1% | 10 |
| bukti (disalin dari blok entri `wave_N_industrial_manufacturing_energy | 10 | 1% | 10 |
| reproduksi | 9 | 1% | 9 |
| aturan kerja | 8 | 1% | 8 |
| bukti (disalin dari blok entri `wave_N_technology_software` baris N) | 8 | 1% | 8 |
| daftar check (run bersih vNrN_final.py, bukti segar di vNrN_laporan.tx | 8 | 1% | 8 |
| gate enforcement — lane pekerja/worker (wajib, kebijakan N-N-N) | 8 | 1% | 8 |
| identitas | 8 | 1% | 8 |
| memori & dokumentasi bersama (shared workspace) | 8 | 1% | 8 |

- Judul ###: total kemunculan 1980; judul ternormalisasi berbeda 1129; muncul di tepat 1 berkas 655.

**Top 20 judul ###** (normalisasi: huruf kecil, digit -> N, nomor awal dibuang; urut berkas-pemuat)

| judul | berkas | % berkas | kemunculan |
|---|---|---|---|
| defect / proposal skill | 8 | 1% | 8 |
| fallback mandiri (jika skill manager tidak dapat dihubungi / dispatch  | 8 | 1% | 8 |
| kalau tidak berhasil | 4 | 1% | 76 |
| bab N - psikologi pemain | 4 | 1% | 4 |
| c-N | 3 | 0% | 9 |
| cek diri | 2 | 0% | 32 |
| contoh nyata | 2 | 0% | 32 |
| ingat | 2 | 0% | 32 |
| jembatan | 2 | 0% | 32 |
| mitos vs fakta | 2 | 0% | 32 |
| aman dan aturan | 2 | 0% | 28 |
| coba sekarang (N menit) | 2 | 0% | 18 |
| catatan format untuk perakit (asm) dan verifier (vsN) | 2 | 0% | 6 |
| coba sekarang (N menit, dua latihan) | 2 | 0% | 6 |
| bab N - alat dan engine final | 2 | 0% | 4 |
| bab N - aset nol modal | 2 | 0% | 4 |
| bab N - build dan pasang di hp | 2 | 0% | 4 |
| bab N - cara berpikir mobile-first | 2 | 0% | 4 |
| bab N - cara membaca kasus sukses | 2 | 0% | 4 |
| bab N - dari main ke membangun | 2 | 0% | 4 |

**Kunci kepala generik** (40 baris pertama; `fm:` = frontmatter YAML, `kv:` = baris `Kunci: nilai` / `**Kunci:** nilai`; berkas pemuat)

| kunci | berkas | % |
|---|---|---|
| kv:status | 312 | 40% |
| fm:status | 241 | 31% |
| kv:title | 237 | 30% |
| fm:title | 224 | 29% |
| kv:sumber | 152 | 19% |
| fm:tags | 150 | 19% |
| kv:tags | 150 | 19% |
| fm:type | 149 | 19% |
| kv:type | 149 | 19% |
| fm:kelas_bukti | 148 | 19% |
| kv:kelas_bukti | 148 | 19% |
| kv:penulis | 147 | 19% |
| fm:penulis | 146 | 19% |
| fm:diajukan | 143 | 18% |
| fm:halaman | 143 | 18% |
| fm:id | 143 | 18% |
| fm:perkara | 143 | 18% |
| fm:sensitif | 143 | 18% |
| fm:sumber | 143 | 18% |
| fm:tanggal_akses | 143 | 18% |
| kv:diajukan | 143 | 18% |
| kv:halaman | 143 | 18% |
| kv:id | 143 | 18% |
| kv:perkara | 143 | 18% |
| kv:sensitif | 143 | 18% |

**Medan kepala bertarget** (regex pada 40 baris pertama; berkas pemuat)

| medan (regex ringkas di Lampiran A) | berkas | % |
|---|---|---|
| status | 374 | 48% |
| agen/owner/peran | 318 | 41% |
| kartu (t_xxxxxxxx / kartu / task_id / task_ref) | 504 | 64% |
| label tanggal (tanggal/date/created/updated/giliran) | 230 | 29% |
| tanggal ISO YYYY-MM-DD di kepala | 611 | 78% |
| misi/tenant/kontrak | 461 | 59% |
| verdict/vonis | 560 | 71% |
| sha | 370 | 47% |
| corr/correlation | 2 | 0% |
| commit/git | 46 | 6% |
| path berkas (ext) | 755 | 96% |

**Nilai status kepala** (`status: x` / `STATUS: x`, 60 baris pertama, 1 per berkas, huruf kecil): berkas bernilai-status = 387

| nilai | berkas |
|---|---|
| complete | 185 |
| active | 57 |
| dipromosikan | 45 |
| usulan | 36 |
| needs-review | 17 |
| draft | 6 |
| perlu_revisi | 6 |
| partial-handoff | 5 |
| vonis | 3 |
| status | 3 |
| verified | 3 |
| locked | 2 |
| selesai | 2 |
| terverifikasi | 2 |
| menunggu_persetujuan | 1 |

**Nilai `VERDICT:`/`VONIS:`** (seluruh berkas, kemunculan pertama, huruf besar): berkas = 302

| nilai | berkas |
|---|---|
| PASS | 166 |
| FAIL | 84 |
| NEEDS_REVIEW | 22 |
| TIDAK | 4 |
| BENAR | 2 |
| BELUM | 2 |
| AGREE | 2 |
| PASS-RILIS | 2 |
| LAYAK-BERSYARAT | 1 |
| APPROVE-WITH-NOTES | 1 |
| PASS- | 1 |
| TAHAN | 1 |
| SETUJU-RILIS | 1 |
| ACCEPT | 1 |
| CAPPED-WITH-EVIDENCE | 1 |

**Token kosakata status/verdict** (berkas yang memuat kata utuh; huruf-besar dicocokkan persis, huruf-kecil dicocokkan persis huruf kecil)

| token | berkas | % |
|---|---|---|
| complete | 290 | 37% |
| needs-review | 39 | 5% |
| blocked | 29 | 4% |
| NEEDS_REVIEW | 167 | 21% |
| PASS | 498 | 64% |
| CAUTION | 3 | 0% |
| FAIL | 386 | 49% |
| PARKED | 10 | 1% |
| done | 44 | 6% |
| running | 39 | 5% |
| ready | 18 | 2% |
| draft | 36 | 5% |
| todo | 12 | 2% |
| review | 91 | 12% |
| issued | 3 | 0% |
| closed | 17 | 2% |
| approved | 5 | 1% |
| berjalan | 139 | 18% |
| selesai | 103 | 13% |

**Kemunculan hasil-cek huruf besar** (semua kemunculan): PASS=6669, FAIL=1998, NEEDS_REVIEW=499, NA=37, CAUTION=3, NEEDS-REVIEW=2

**Id kartu** regex `\bt_[0-9a-f]{8}\b`: berkas pemuat 422 (54%); id unik 914; histogram panjang heks setelah `t_` (semua `t_[0-9a-f]+`): 8:2028
- Label kartu non-heks setelah kata "kartu " (bentuk -> jumlah -> contoh): `AAA-A9` x93 (mis. LAD-C1); `AAA-AAA-999` x14 (mis. REF-ELC-002); `AAA-A` x8 (mis. FIX-D); `A99-A9` x6 (mis. V31-V1); `A9-AAA` x5 (mis. D1-FIX); `AAAA-A9-AA-A9` x5 (mis. CVLK-C1-VS-R2)

**Cara merujuk bukti** (regex pada seluruh berkas; berkas pemuat)

| bentuk rujukan | berkas | % |
|---|---|---|
| path docs/... | 330 | 42% |
| path berkas dgn ekstensi | 767 | 98% |
| path:baris (file.ext:NN) | 147 | 19% |
| sha dgn nilai hex>=8 | 257 | 33% |
| corr id (corr <hex8>) | 0 | 0% |
| commit/@hex7+ | 20 | 3% |
| byte/ukuran (NN B/KB/MB) | 351 | 45% |
| exit code | 204 | 26% |
| mtime | 97 | 12% |
| kartu t_xxxxxxxx | 422 | 54% |

##### Contoh berpath: K7 verif* (nama berkas atau folder verification|verif|verifikasi|verify)

`./2026-08-24_fleet_test/gsp-pm-verifier/verification.md`

```text
# Verifikasi Rencana — Portal Klien (2 Bulan)
- **Tanggal verifikasi:** 2026-08-24
- **Verifikator:** profil `gsp-pm-verifier` (smoke-test fleet GSP, 2026-08-24)
- **Objek yang diverifikasi:** rencana inline (teks diberikan langsung dalam tugas, tanpa file fisik):
> "Rencana portal klien (2 bulan): (1) requirement gathering (wk1-2), (2) desain UI (wk3-4), (3) backend API (wk3-6), (4) integrasi (wk7), (5) UAT (wk8)."
```

`./2026-09-02-naturalisasi-output/verify-chat-sweep-pascagerbang.md`

```text
# Sapuan Sampel Chat Fleet (NAT-S20)
- Tanggal: 2026-09-02 15:48:12
- Scanner: `C:\Users\TRIAL\AppData\Local\hermes\skills\gsp\gsp-output-naturalization\scripts\scan_ai_footprint.py` v1.2.0
- Skrip: `workspace/gsp-hermes/scripts/scan_chat_sweep_20260902.py` (read-only, URI mode=ro)
- Jendela waktu: efektivitas: sesi lahir pasca-rollout gate 02-09 12:08 | hanya sesi lahir >= 2026-09-02 12:08
```

`./2026-09-23-nws-knowledge-register/verif/d1/raw/probe-d1-3-gsp-master01-P2.out.md`

```text
# D1 probe | profil gsp-master01 | P2 | dispatch hermes -p gsp-master01 -z (env-strip) | ts mulai 2026-09-24 15:05:22
Boleh dijawab langsung dari rak. Tidak perlu delegasi untuk pertanyaan pengetahuan seperti ini.
## Jawaban singkat
**Tidak.** Menghitung anggaran PoE dari jumlah port dikali daya maksimal per port **ditolak** sebagai metode. Switch 24 port PoE+ tidak berarti sanggup memberi 30 W ke 24 port sekaligus; daya total ca
## Prosedur yang benar
```

`./2026-09-29-rafif-visual/verification/FIX-VISUAL-C5C7.md`

```text
---
title: "Jejak suntingan FIX-VISUAL C-5/C-7 pada PANDUAN-RAFIF-VISUAL.md"
date: 2026-09-29
author_profile: gsp-document-reviewer
status: complete
```

`./2026-10-10-rafif-revb-1010/verification/QC-PARSEL-1010.md`

```text
STATUS: complete | 9/9 LAYAK, 0 kelas sistemik
## QC-PARSEL-1010 — Uji Visual Dini Parsel (R5 AUDIT-DURASI-1010)
### Ringkasan
Parsel hijau: 9/9 id LAYAK, 0 kelas sistemik. Rekomendasi: lanjut gelombang tanpa bekuan.
### Cakupan
```

#### K8 folder checkpoints/*.md (n = 35)
- Misi/folder tingkat-1 berbeda: 5; di dalam folder backup*/wiki_backup*: 0; ukuran median 9234 B (min 1836, maks 31103); baris median 83.
- Berkas tanpa satu pun judul ## atau ###: 0 (0%).
- Judul ##: total kemunculan 251; judul ternormalisasi berbeda 226; muncul di tepat 1 berkas 214.

**Top 20 judul ##** (normalisasi: huruf kecil, digit -> N, nomor awal dibuang; urut berkas-pemuat)

| judul | berkas | % berkas | kemunculan |
|---|---|---|---|
| status | 7 | 20% | 7 |
| batas klaim | 5 | 14% | 5 |
| check / verdict (bukti segar giliran ini) | 3 | 9% | 3 |
| prohibitions | 3 | 9% | 3 |
| tabel verifikasi-akurasi (spk-N butir N; populasi penuh field beban-ri | 3 | 9% | 3 |
| artefak (research/raw/wlp-fN/) | 2 | 6% | 2 |
| batas klaim verifier | 2 | 6% | 2 |
| domain senior (ringkas) | 2 | 6% | 2 |
| kepatuhan batas keras | 2 | 6% | 2 |
| referensi | 2 | 6% | 2 |
| serah | 2 | 6% | 2 |
| temuan non-blocking (nit) | 2 | 6% | 2 |
| slide N — sepuluh subsistem dan fungsinya (N) — apa yang dilakukannya  | 1 | 3% | 2 |
| status mata N | 1 | 3% | 2 |
| N.N mata-N terminal (t_NafNbeN, run N, N:N-N:Nx +N) - agg final sesuda | 1 | 3% | 1 |
| acN flicker (cakupan N) - sesi uji milik pekerja | 1 | 3% | 1 |
| addendum revN (run final harness, flash-stale dibersihkan) | 1 | 3% | 1 |
| aksen emas #cNe (probe resolusi asli) | 1 | 3% | 1 |
| alasan_limit | 1 | 3% | 1 |
| angka payload per siklus klik (restatement d-N/d-N; n efektif per sel  | 1 | 3% | 1 |

- Judul ###: total kemunculan 32; judul ternormalisasi berbeda 32; muncul di tepat 1 berkas 32.

**Top 20 judul ###** (normalisasi: huruf kecil, digit -> N, nomor awal dibuang; urut berkas-pemuat)

| judul | berkas | % berkas | kemunculan |
|---|---|---|---|
| N.N acN flicker (parsial — rantai masih berjalan saat anggaran habis) | 1 | 3% | 1 |
| N.N atribusi mismatches pasca-tambang (kontrol warisan murni, semua fl | 1 | 3% | 1 |
| N.N batas klaim mata-N | 1 | 3% | 1 |
| N.N bench final (fN_bench_samples.jsonl, N baris; cetakan fN_count_che | 1 | 3% | 1 |
| N.N eNxeN + dev-fN-N determinisme: belum terukur | 1 | 3% | 1 |
| N.N eNxeN interleaving dengan kontrol arm off (tuntutan check N) | 1 | 3% | 1 |
| N.N jump-path klik nyata (fN_jump_samples.jsonl, N baris, selesai N:N  | 1 | 3% | 1 |
| N.N payload terukur (encodedbodysize resource-timing, per fase) | 1 | 3% | 1 |
| N.N pendaratan target (target_match = teks flash == excerpt entri yang | 1 | 3% | 1 |
| N.N register deviasi mata-N | 1 | 3% | 1 |
| acN flicker final (N/N run, sesi uji milik pekerja NaN, N.N pesan sint | 1 | 3% | 1 |
| batas klaim mata-N | 1 | 3% | 1 |
| d-a. sahkan blueprint ta (identification/N_structured.md)? | 1 | 3% | 1 |
| d-b. batas scope engine hermes | 1 | 3% | 1 |
| d-c. target angka final (mengunci [proposed-fN]) | 1 | 3% | 1 |
| d-e. qN default virtualisasi + qN jendela restart + qN dependensi | 1 | 3% | 1 |
| d-f. dev-N (ulang ukur n>=N?) dan dev-N (sumber sesi long ~Nk) | 1 | 3% | 1 |
| dev-fN-N determinisme final (longp on deep-mined, fresh context tiap i | 1 | 3% | 1 |
| eNxeN dua-arm final (interleaving load-earlier x jump, kontrol kebenar | 1 | 3% | 1 |
| lane canon cr-n (sisa_kerja N) - selesai | 1 | 3% | 1 |

**Kunci kepala generik** (40 baris pertama; `fm:` = frontmatter YAML, `kv:` = baris `Kunci: nilai` / `**Kunci:** nilai`; berkas pemuat)

| kunci | berkas | % |
|---|---|---|
| kv:tanggal | 20 | 57% |
| kv:status | 14 | 40% |
| kv:kartu | 9 | 26% |
| kv:verdict | 8 | 23% |
| kv:title | 7 | 20% |
| kv:metode | 7 | 20% |
| kv:author_profile | 6 | 17% |
| kv:date | 6 | 17% |
| kv:source_refs | 6 | 17% |
| kv:task_ref | 6 | 17% |
| kv:objek | 6 | 17% |
| kv:pekerja | 5 | 14% |
| fm:author_profile | 4 | 11% |
| fm:date | 4 | 11% |
| fm:source_refs | 4 | 11% |
| fm:status | 4 | 11% |
| fm:task_ref | 4 | 11% |
| fm:title | 4 | 11% |
| kv:reviewer | 3 | 9% |
| kv:objek ukur | 3 | 9% |
| kv:status kartu | 3 | 9% |
| kv:konsistensi verdict | 2 | 6% |
| kv:objek vonis | 2 | 6% |
| kv:verifier | 2 | 6% |
| kv:regresi tetangga | 2 | 6% |

**Medan kepala bertarget** (regex pada 40 baris pertama; berkas pemuat)

| medan (regex ringkas di Lampiran A) | berkas | % |
|---|---|---|
| status | 21 | 60% |
| agen/owner/peran | 16 | 46% |
| kartu (t_xxxxxxxx / kartu / task_id / task_ref) | 35 | 100% |
| label tanggal (tanggal/date/created/updated/giliran) | 32 | 91% |
| tanggal ISO YYYY-MM-DD di kepala | 35 | 100% |
| misi/tenant/kontrak | 18 | 51% |
| verdict/vonis | 21 | 60% |
| sha | 10 | 29% |
| corr/correlation | 0 | 0% |
| commit/git | 21 | 60% |
| path berkas (ext) | 35 | 100% |

**Nilai status kepala** (`status: x` / `STATUS: x`, 60 baris pertama, 1 per berkas, huruf kecil): berkas bernilai-status = 23

| nilai | berkas |
|---|---|
| complete | 21 |
| pending | 1 |
| partial-handoff | 1 |

**Nilai `VERDICT:`/`VONIS:`** (seluruh berkas, kemunculan pertama, huruf besar): berkas = 17

| nilai | berkas |
|---|---|
| PASS | 6 |
| NEEDS_REVIEW | 5 |
| FAIL | 3 |
| DEV-F | 1 |
| INSTRUMEN | 1 |
| PARTIAL-HANDOFF | 1 |

**Token kosakata status/verdict** (berkas yang memuat kata utuh; huruf-besar dicocokkan persis, huruf-kecil dicocokkan persis huruf kecil)

| token | berkas | % |
|---|---|---|
| complete | 28 | 80% |
| needs-review | 1 | 3% |
| blocked | 2 | 6% |
| NEEDS_REVIEW | 10 | 29% |
| PASS | 20 | 57% |
| CAUTION | 1 | 3% |
| FAIL | 13 | 37% |
| PARKED | 0 | 0% |
| done | 0 | 0% |
| running | 0 | 0% |
| ready | 0 | 0% |
| draft | 1 | 3% |
| todo | 0 | 0% |
| review | 5 | 14% |
| issued | 0 | 0% |
| closed | 11 | 31% |
| approved | 0 | 0% |
| berjalan | 10 | 29% |
| selesai | 11 | 31% |

**Kemunculan hasil-cek huruf besar** (semua kemunculan): PASS=210, NEEDS_REVIEW=50, FAIL=33, CAUTION=1

**Id kartu** regex `\bt_[0-9a-f]{8}\b`: berkas pemuat 35 (100%); id unik 43; histogram panjang heks setelah `t_` (semua `t_[0-9a-f]+`): 8:86
- Label kartu non-heks setelah kata "kartu " (bentuk -> jumlah -> contoh): `AAAA-AAAAAA` x2 (mis. GATE-ENGINE)

**Cara merujuk bukti** (regex pada seluruh berkas; berkas pemuat)

| bentuk rujukan | berkas | % |
|---|---|---|
| path docs/... | 4 | 11% |
| path berkas dgn ekstensi | 35 | 100% |
| path:baris (file.ext:NN) | 19 | 54% |
| sha dgn nilai hex>=8 | 2 | 6% |
| corr id (corr <hex8>) | 0 | 0% |
| commit/@hex7+ | 10 | 29% |
| byte/ukuran (NN B/KB/MB) | 22 | 63% |
| exit code | 12 | 34% |
| mtime | 15 | 43% |
| kartu t_xxxxxxxx | 35 | 100% |

##### Contoh berpath: K8 folder checkpoints/*.md

`./2026-09-01-deck-ims-wms-kaarrenal/checkpoints/naskah_pembicara_v4.md`

```text
# Naskah Pembicara — Deck v4 Forum KAARSENAL (TERBATAS)
title: "Naskah Pembicara — Deck v4 Forum KAARSENAL"
date: 2026-09-02
author_profile: gsp-document-writer
status: complete
```

`./2026-09-05-webui-long-transcript-perf/checkpoints/CP-F13a-srv.md`

```text
# CP-F13a-srv — checkpoint misi F13A server (mata-3 t_0f5046b2 menutup rantai), STATUS: complete
Tanggal: 2026-09-06 01:4x (+07) | Pekerja: gsp-coder-execution | Objek: C:/Users/TRIAL/gsp-brahma branch wlp/f5-impl.
## Hasil akhir mata-3 (TERVERIFIKASI segar run ini)
- Commit granular DUA butir, nol push:
- `2a29482` test(wlp): F13A tes merah proyeksi ?questions=1 indeks outline
```

`./2026-09-05-webui-long-transcript-perf/checkpoints/CP-F2-ta.md`

```text
# CP-F2-ta - Checkpoint Fase F2 (Task Architect) Misi WLP
- Tanggal: 2026-09-05
- Kartu: t_24d08579
- Agen: gsp-task-architect
- Status fase: complete
```

`./2026-09-05-webui-long-transcript-perf/checkpoints/CP-F31-smoke-on.md`

```text
# CP-F31-smoke-on: SMOKE HIDUP ARM ON pasca-restart :9012 (langkah 16 blueprint)
- Kartu: t_c2e055db (WLP-F31-SMOKE-ON) | Pekerja: gsp-test-expert | Giliran: 2026-09-07 16:41-16:55 WIB
- Kontrak: docs/2026-09-05-webui-long-transcript-perf/contract.md | Instruksi: CP-F13a-cli.md seksi 'Instruksi smoke'
- Metode: resource-timing encodedBodySize browser (resep identik F17/F19/F23/F26), sesi beku seed 20260907,
interpreter playwright = C:/Users/TRIAL/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe.
```

`./2026-09-05-webui-long-transcript-perf/checkpoints/CP-F8-fix.md`

```text
# CP-F8-fix — Aktifkan window pada jalur klik nyata outline + uji dua-arm E1xE2 (F8, t_08c85cb7)
- Tanggal: 2026-09-05 (run 1811, 19:35-20:2x +07)
- Pekerja: gsp-coder-execution (penulis diff ini; BUKAN verifikator — lapis L2 milik verifier)
- Objek: branch `wlp/f5-impl` @ `6e7aa3e` (4 commit baru dari `82f7ad7`; main==origin/main==7be022f9, NOL push; service 9012 TIDAK di-restart — parity md5 repo==sajian dibuktikan tanpa restart)
- Rujukan cacat: CP-F7-ver.md CHECK 4 (E2 tak terjangkau klik nyata, payload jump ON==OFF 1.345.751 B), CHECK 10 (R-R8 pembukuan pasca-bare; R-E1xE2 tanpa kontrol OFF), vonis F6b2 CHECK 10 (perluasan 
```

#### K9 handoff.md (n = 19)
- Misi/folder tingkat-1 berbeda: 2; di dalam folder backup*/wiki_backup*: 0; ukuran median 1590 B (min 672, maks 3203); baris median 15.
- Berkas tanpa satu pun judul ## atau ###: 8 (42%).
- Judul ##: total kemunculan 21; judul ternormalisasi berbeda 17; muncul di tepat 1 berkas 14.

**Top 20 judul ##** (normalisasi: huruf kecil, digit -> N, nomor awal dibuang; urut berkas-pemuat)

| judul | berkas | % berkas | kemunculan |
|---|---|---|---|
| catatan untuk mrg-cn | 3 | 16% | 3 |
| lempar keluar | 2 | 11% | 2 |
| lempar masuk yang diserap | 2 | 11% | 2 |
| addendum resume lNr (t_NcbNaN) | 1 | 5% | 1 |
| catatan untuk mrg-cn (hilir) | 1 | 5% | 1 |
| dilempar keluar | 1 | 5% | 1 |
| diterima (dicatat, sudah dipakai run ini) | 1 | 5% | 1 |
| diterima gelombang-N (komentar operator mid-run, N:Nxz) | 1 | 5% | 1 |
| koreksi gerbang pada giliran tutup lNr (penting untuk mrg t_NfeNdb) | 1 | 5% | 1 |
| lead antar-lajur | 1 | 5% | 1 |
| lemparan antar lajur (d-ta-N) | 1 | 5% | 1 |
| lemparan baru run N (lNb) | 1 | 5% | 1 |
| ronde-N (t_fcdN) | 1 | 5% | 1 |
| sisa_kerja untuk kartu lanjutan (dari ambang-b run-N) | 1 | 5% | 1 |
| tambahan round-N (t_aNdbabca, N:N) | 1 | 5% | 1 |
| temuan teknis yang memengaruhi lajur lain (bukan vendor) | 1 | 5% | 1 |
| tidak ada temuan lN yang wajib pindah permanen ke lajur lain; semua ba | 1 | 5% | 1 |

- Judul ###: total kemunculan 0; judul ternormalisasi berbeda 0; muncul di tepat 1 berkas 0.

**Top 20 judul ###** (normalisasi: huruf kecil, digit -> N, nomor awal dibuang; urut berkas-pemuat)

(tidak ada)

**Kunci kepala generik** (40 baris pertama; `fm:` = frontmatter YAML, `kv:` = baris `Kunci: nilai` / `**Kunci:** nilai`; berkas pemuat)

| kunci | berkas | % |
|---|---|---|
| kv:nihil lemparan lain | 1 | 5% |
| kv:jebakan entity | 1 | 5% |
| kv:vertiv vr rack / smartcabinet | 1 | 5% |
| kv:wajib baca mrg | 1 | 5% |
| kv:lis-virt | 1 | 5% |
| kv:catatan mrg-cn | 1 | 5% |
| kv:catatan skema | 1 | 5% |
| kv:getwell | 1 | 5% |

**Medan kepala bertarget** (regex pada 40 baris pertama; berkas pemuat)

| medan (regex ringkas di Lampiran A) | berkas | % |
|---|---|---|
| status | 0 | 0% |
| agen/owner/peran | 1 | 5% |
| kartu (t_xxxxxxxx / kartu / task_id / task_ref) | 12 | 63% |
| label tanggal (tanggal/date/created/updated/giliran) | 0 | 0% |
| tanggal ISO YYYY-MM-DD di kepala | 4 | 21% |
| misi/tenant/kontrak | 3 | 16% |
| verdict/vonis | 5 | 26% |
| sha | 0 | 0% |
| corr/correlation | 0 | 0% |
| commit/git | 0 | 0% |
| path berkas (ext) | 9 | 47% |

**Nilai status kepala** (`status: x` / `STATUS: x`, 60 baris pertama, 1 per berkas, huruf kecil): berkas bernilai-status = 0

(tidak ada)

**Nilai `VERDICT:`/`VONIS:`** (seluruh berkas, kemunculan pertama, huruf besar): berkas = 0

(tidak ada)

**Token kosakata status/verdict** (berkas yang memuat kata utuh; huruf-besar dicocokkan persis, huruf-kecil dicocokkan persis huruf kecil)

| token | berkas | % |
|---|---|---|
| complete | 0 | 0% |
| needs-review | 0 | 0% |
| blocked | 0 | 0% |
| NEEDS_REVIEW | 0 | 0% |
| PASS | 7 | 37% |
| CAUTION | 0 | 0% |
| FAIL | 2 | 11% |
| PARKED | 0 | 0% |
| done | 0 | 0% |
| running | 0 | 0% |
| ready | 0 | 0% |
| draft | 0 | 0% |
| todo | 0 | 0% |
| review | 0 | 0% |
| issued | 0 | 0% |
| closed | 0 | 0% |
| approved | 0 | 0% |
| berjalan | 0 | 0% |
| selesai | 0 | 0% |

**Kemunculan hasil-cek huruf besar** (semua kemunculan): PASS=23, FAIL=2

**Id kartu** regex `\bt_[0-9a-f]{8}\b`: berkas pemuat 7 (37%); id unik 10; histogram panjang heks setelah `t_` (semua `t_[0-9a-f]+`): 8:13

**Cara merujuk bukti** (regex pada seluruh berkas; berkas pemuat)

| bentuk rujukan | berkas | % |
|---|---|---|
| path docs/... | 0 | 0% |
| path berkas dgn ekstensi | 9 | 47% |
| path:baris (file.ext:NN) | 0 | 0% |
| sha dgn nilai hex>=8 | 0 | 0% |
| corr id (corr <hex8>) | 0 | 0% |
| commit/@hex7+ | 0 | 0% |
| byte/ukuran (NN B/KB/MB) | 1 | 5% |
| exit code | 1 | 5% |
| mtime | 0 | 0% |
| kartu t_xxxxxxxx | 7 | 37% |

##### Contoh berpath: K9 handoff.md

`./2026-09-27-harga-dems-saturasi/lanes/L01/handoff.md`

```text
# HANDOFF L01 - register lempar antar lajur (D-TA-6)
Lemparan aktif:
1. -> L02 (NVR+Storage): penemuan "Ruision Uniview Uni XM 4mp/5mp IP Camera Module Board PCB" 7.98-11.98 USD (https://www.alibaba.com/findproduct/uniview-ipc6434.html, rung 4.16) - modul kamera, BUKAN
2. -> L04 (Power): pencarian braket/mik memunculkan catu daya 12V industri di ekosistem listing yang sama namun tidak dikurasi di sini; PSU-12 (kode lajur L04) sebaiknya pakai slug findproduct '12v 2a
Nihil lemparan lain: semua temuan L01 tetap di dalam 5 kode lajur ini.
```

`./2026-09-27-harga-dems-saturasi/lanes/L04/handoff.md`

```text
# HANDOFF L04 (D-TA-6)
Merk/lead yang ditemukan L04 tapi milik lajur lain, atau lead lintas-lajur:
1. Rack/PDU aksesoris AMPCOM, 百能, 科安 (CN) - kalau lajur L06 (Cabinets+Racks) butuh supplier PDU dasar 16A/32A unmetered, floor price sudah di L04 findings (Rp-equivalent CNY 85-209) - jangan riset ula
2. Schneider/APC Indonesia channel (se.com/id quote-gated, apc-indonesia.com, platindokaryaprima.com, tokopedia APC Authorized Store) - berguna utk SEMUA lajur barang bermerek Barat yang butuh kutipan
3. Pola pconline price-page (`product.pconline.com.cn/ups_power/<brand>/<id>_price.html`) = sumber harga harian CN yang lolos entity-match - rekomendasikan ke lajur CN lain (L07/L08/L09 perangkat IT m
```

`./2026-09-27-harga-dems-saturasi/lanes/L08/handoff.md`

```text
# HANDOFF - L08 -> lajur lain (HARGA-DEMS-0927)
Lemparan merk/kanal yang bukan milik L08 agar lead tidak mati di sini:
1. **ServerBasket.net pola tabel harga WooCommerce-ter-escape** (tablepress dsplan rows) -
kanal list-price publik utk rakitan server/kerja di semua lajur hardware; parser siap
pakai ada di workspace run ini (parse_sb3.py). Untuk L03/L06/L07/L09/L10.
```

`./2026-10-03-vendor-dems-saturasi/lanes/L02-C/handoff.md`

```text
# HANDOFF L02-C
- LEMPAR ke L03 (gsp-infra-specialist): Ruijie (ruijie.com.cn 200) dan H3C (h3c.com/en 200) kandidat kuat switch/router; TP-Link terbukti punya locale ID resmi (tp-link.com/id 200).
- LEMPAR ke L01 (vss, kartu sendiri t_6e34a0db): set pabrikan CCTV CN yang sama (Hikvision/Dahua/Uniview/Tiandy/TVT/Jovision/XMT/ALHUA/Sunell/Milesight/KEDACOM) berlaku untuk kamera; entity-match suda
- LEMPAR ke L06/L07: KEDACOM & H3C kelas enterprise DC; datasheet NVR M8/M16 Hikvision relevan arsitektur storage.
- CATATAN MRG-CN: kolom vendor_name_cn sengaja kosong bila nama legal CN tidak tercacah dari bukti giliran ini (kosong > salah, SPK-002).
```

`./2026-10-03-vendor-dems-saturasi/lanes/L06-C/handoff.md`

```text
# HANDOFF L06-C (aturan lempar D-TA-8)
Ditemukan di lajur L06 tapi milik lingkup lajur lain  -  dilempar, tidak dibiarkan mati di penemu.
| # | Entitas | Bukti lajur ini | Milik lajur | Tindakan untuk penerima |
|---|---|---|---|---|
| H-1 | 爱数 Aishu (AnyBackup) | probe HTTP 200 icp=6 @12:09Z, aishu.cn | L08 LIS-BAK (lisensi backup) | naikkan sebagai VR-1 penerbit; jangan daur ulang sebagai barang |
```

## 5. Protokol LAPOR-SELESAI dan LAPOR-FASE di dalam korpus (komentar kanban, bukan berkas)

Fakta: tidak ada berkas bernama `LAPOR-FASE*` (`find . -name node_modules -prune -o -type f -iname '*lapor-fase*' -print | wc -l` = 0). `LAPOR-SELESAI` dan `LAPOR-FASE` muncul sebagai kata di dalam teks berkas lain. Hitungan di bawah dari perintah 2.1 (bagian `LAPOR`) dan dikonfirmasi `grep -rl --include='*.md' --exclude-dir=node_modules ...` di 2.2:

- `LAPOR-SELESAI`: berkas pemuat 625 (misi berbeda 63); baris pemuat 767; nama berkas teratas: `wN-chN-ver.md` x37, `wN-chN-writer.md` x36, `mN-chN.md` x34, `cardN.md` x30, `card-N.md` x24, `body-gwb-bN.md` x20
  - token pada baris pemuat (jumlah baris): complete=395, wait-ack=252, byte=212, STATUS: complete=189, PARKED=153, verdict/vonis=140, path=118, artefak=110, mikro-verif=108, exit=77, sha16/sha256=72, jumlah kata=24, jalur=16, ringkas=8, rencana=3, estimasi=2
  - 5 contoh baris (path; baris-ke-n pemuat; dipotong 260 karakter):
    - `./2026-10-05-gaya-bahasa-forensik/manual/STD-GAYA-AHLI-001.md` #27: `| Pin revI | Suatu berkas tidak dapat memuat hash sha256 dirinya sendiri, sehingga berkas ini tidak mengangka pin-nya sendiri: angka sha256[:16] revI adalah cetakan alat 'certutil -hashfile <berkas> SHA256' (ekuivalen hashlib sha256) atas berkas final di path `
    - `./2026-10-13-vibe-coding-bible/cards/m4-ch17.md` #23: `SHORT CHECK sebelum tutup (<=3 langkah): wc -w dalam rentang target; URL badan=0; figur>=target dan semua dipanggil. Tutup: komentar LAPOR-SELESAI + result STATUS: complete.`
    - `./2026-10-13_serah-terima-asignor/cards/STA13-N1WAKESCAN.md` #21: `urutan tutup sah = (a) artefak+short check; (b) komentar 'LAPOR-SELESAI: <bukti>'; (c)`
    - `./2026-10-22-gsp-eosda-bizplan/work/card6.md` #7: `LAPOR: komentar LAPOR-SELESAI + path + byte + sha16 + metrik kartu + token mikro-verif; wait-ack; complete ber-prefix PARKED bila ACK tak tiba.`
    - `./2026-10-27_manual-ktx-1027/work/cards/body-gwc-c3r.md` #12: `SERAH: LAPOR-SELESAI + angka ter-render, wait-ack loop --timeout 400, complete.`
- `LAPOR-FASE`: berkas pemuat 100 (misi berbeda 63); baris pemuat 137; nama berkas teratas: `N_translated.md` x23, `N_structured.md` x19, `PHASE-REPORTS.md` x18, `contract.md` x15, `N_blueprint.md` x7, `CONTRACT.md` x3
  - token pada baris pemuat (jumlah baris): ringkas=23, byte=19, verdict/vonis=16, rencana=16, artefak=15, sha16/sha256=6, estimasi=2, jalur=2, jumlah kata=2, corr=2
  - 5 contoh baris (path; baris-ke-n pemuat; dipotong 260 karakter):
    - `./2026-09-02-expo-intel-2026/contract.md` #95: `- D-13 (02-09, 23:2x): Skill metode di-upgrade user saat misi berjalan (v1.2.1 + referensi dag-true-dependencies + deterministic-verification + LAPOR-FASE) dan DIPAKAI untuk sisa misi. Fakta: E2 done tapi summary bridge kosong = bookkeeping failure (pitfall fl`
    - `./2026-10-09_rtta-improve/identification/03_verdict.md` #8: `Bukti: grep '01_translated' di 02 -> baris 7 (frontmatter source_translated_task), 43 (kepala siap-kartu), 47 (S3 pointer + ukuran 15.369 B/135 br = cocok ukur disk). Jawaban L2 (rantai hilir + efisiensi token): Seksi C.2 baris 129-137 menurunkan BERAT SELURUH`
    - `./2026-10-10_improve-delegasi/uji/COUNTERSIGN-ID3.md` #53: `HEAD sekarang (0d65ce81) hanya menambah dokumen LAPOR-FASE, kode teruji identik.`
    - `./2026-10-19_nearlink-research-plan/identification/02_structured.md` #104: `| Seluruh rantai | Deliverable melewati plafon waktu misi | fase W1..W9 LAPOR-FASE F-2; controller boleh memangkas kedalaman lajur (bukan jumlah gerbang) dengan putusan tercatat |`
    - `./2026-10-27-draf-v33/identification/01b_fix-translated.md` #62: `Plafon: 01 STANDAR <=14 KB (terpenuhi); 02 mini-rantai oleh controller per bentuk preseden (satu kartu kontrak sah dengan catatan turun kelas D.3); kartu hilir FIX praktis 1 + 1 verifier ronde-2; LAPOR-FASE ringkas <=1,5 KB; jejak log wajib ke berkas (preseden`

Tambahan terukur: berkas bernama `LAPOR-SELESAI-RD5F.txt` (1 berkas, `find . -name node_modules -prune -o -type f -iname '*lapor-selesai*' -print`) berada di `./2026-10-19-expo-intel-survey/process/F4f/` dan berisi teks komentar penutup (baris pertama `LAPOR-SELESAI: REMED-RD5F selesai sesuai kontrak ...`, lalu `Objek terbit: ... sha16 ...`, lalu `Bukti terukur per butir mandat:` bernomor). `PHASE-REPORTS.md` yang mengutip `LAPOR-SELESAI`: 3 berkas, 3 baris (`find ... -name PHASE-REPORTS.md -print0 | xargs -0 grep -l LAPOR-SELESAI | wc -l`).

## 6. Pembanding: format laporan agen di repo controller ini (R1-R3)

Sumber: `docs/2026-10-22_doc_artifact_studio/delegation_progress/*.md` (top-level saja; subfolder `f070_backup/` tidak dihitung) dan `docs/2026-10-22_doc_artifact_studio/test/*.md` (hanya `.md`; berkas `.json` dilewati). R1 = nama berawalan `coder_execution_`, R2 = sisanya di `delegation_progress/`, R3 = `test/`. Perintah: sama dengan 2.1 (skrip yang sama, argumen kedua).

Ringkasan bagian/kunci (definisi seperti 3.2):

| kelas | n | judul ## di >=80% berkas (jumlah berkas) | judul ## di 50-79% berkas | judul ## berbeda yang ada di <=5% berkas | kunci kepala kv: di >=80% berkas | kunci kv: di 50-79% berkas |
|---|---|---|---|---|---|---|
| R1 delegation_progress/coder_execution_*.md | 233 | (tidak ada) | (tidak ada) | 237 dari 252 | `kv:status` (223) | (tidak ada) |
| R2 delegation_progress/*.md bukan coder_execution_ | 16 | (tidak ada) | (tidak ada) | 0 dari 52 | (tidak ada) | `kv:status` (9) |
| R3 test/*.md | 21 | `strategi uji` (19) | `catatan ci` (15), `cara menjalankan` (14) | 86 dari 106 | (tidak ada) | `kv:status` (14), `kv:baris` (13) |

#### R1 delegation_progress/coder_execution_*.md (n = 233)
- Misi/folder tingkat-1 berbeda: 1; di dalam folder backup*/wiki_backup*: 0; ukuran median 3313 B (min 685, maks 17707); baris median 27.
- Berkas tanpa satu pun judul ## atau ###: 85 (36%).
- Judul ##: total kemunculan 708; judul ternormalisasi berbeda 252; muncul di tepat 1 berkas 200.

**Top 20 judul ##** (normalisasi: huruf kecil, digit -> N, nomor awal dibuang; urut berkas-pemuat)

| judul | berkas | % berkas | kemunculan |
|---|---|---|---|
| bukti | 50 | 21% | 50 |
| persistent issues | 36 | 15% | 36 |
| next steps | 33 | 14% | 33 |
| issues & decisions | 32 | 14% | 32 |
| temuan | 25 | 11% | 25 |
| berkas | 24 | 10% | 24 |
| perubahan | 23 | 10% | 24 |
| changes made | 21 | 9% | 21 |
| keputusan | 21 | 9% | 21 |
| test results | 21 | 9% | 21 |
| executed steps | 20 | 9% | 20 |
| verification | 18 | 8% | 18 |
| permintaan / temuan | 13 | 6% | 13 |
| isi | 12 | 5% | 12 |
| penjaga | 12 | 5% | 12 |
| bukti (N-N-N) | 10 | 4% | 10 |
| permintaan lintas pemilik | 10 | 4% | 10 |
| keputusan / deviasi | 8 | 3% | 8 |
| ringkasan | 8 | 3% | 8 |
| keputusan (untuk dicatat controller) | 7 | 3% | 7 |

- Judul ###: total kemunculan 10; judul ternormalisasi berbeda 10; muncul di tepat 1 berkas 10.

**Top 20 judul ###** (normalisasi: huruf kecil, digit -> N, nomor awal dibuang; urut berkas-pemuat)

| judul | berkas | % berkas | kemunculan |
|---|---|---|---|
| asynclocalstorage -> parameter eksplisit | 1 | 0% | 1 |
| d-N (n-srN-N): halaman akhir kosong vN | 1 | 0% | 1 |
| docx tetap byte-identik | 1 | 0% | 1 |
| f-N gerbang bersama dokumen/bab/slot | 1 | 0% | 1 |
| fN: lint vN serah gagal dN + dN (datumrule/sealband/spinestring) | 1 | 0% | 1 |
| hitungan db (sebelum -> sesudah) | 1 | 0% | 1 |
| penjaga gsp (keluaran seed, jalan nyata) | 1 | 0% | 1 |
| tabel N tempat x id/en (docx vs html sebelum/sesudah) | 1 | 0% | 1 |
| toc vN tanpa entri "bagian" (hipotesis sr-N §N.N): terbukti cacat | 1 | 0% | 1 |
| uji dan pemeriksaan | 1 | 0% | 1 |

**Kunci kepala generik** (40 baris pertama; `fm:` = frontmatter YAML, `kv:` = baris `Kunci: nilai` / `**Kunci:** nilai`; berkas pemuat)

| kunci | berkas | % |
|---|---|---|
| kv:status | 223 | 96% |
| fm:agent | 51 | 22% |
| fm:date | 51 | 22% |
| fm:row | 51 | 22% |
| fm:status | 51 | 22% |
| kv:agent | 51 | 22% |
| kv:date | 51 | 22% |
| kv:row | 51 | 22% |
| kv:permintaan lintas pemilik | 44 | 19% |
| kv:temuan | 43 | 18% |
| fm:task_slug | 42 | 18% |
| kv:task_slug | 42 | 18% |
| kv:berkas | 34 | 15% |
| fm:source_plan | 33 | 14% |
| kv:source_plan | 33 | 14% |
| fm:task_id | 32 | 14% |
| kv:task_id | 32 | 14% |
| kv:penjaga | 22 | 9% |
| kv:skill | 18 | 8% |
| kv:bukti | 10 | 4% |
| kv:permintaan | 9 | 4% |
| kv:isi | 9 | 4% |
| kv:keputusan | 8 | 3% |
| kv:skills | 6 | 3% |
| kv:angka | 6 | 3% |

**Medan kepala bertarget** (regex pada 40 baris pertama; berkas pemuat)

| medan (regex ringkas di Lampiran A) | berkas | % |
|---|---|---|
| status | 232 | 100% |
| agen/owner/peran | 63 | 27% |
| kartu (t_xxxxxxxx / kartu / task_id / task_ref) | 35 | 15% |
| label tanggal (tanggal/date/created/updated/giliran) | 59 | 25% |
| tanggal ISO YYYY-MM-DD di kepala | 157 | 67% |
| misi/tenant/kontrak | 107 | 46% |
| verdict/vonis | 13 | 6% |
| sha | 92 | 39% |
| corr/correlation | 8 | 3% |
| commit/git | 12 | 5% |
| path berkas (ext) | 224 | 96% |

**Nilai status kepala** (`status: x` / `STATUS: x`, 60 baris pertama, 1 per berkas, huruf kecil): berkas bernilai-status = 232

| nilai | berkas |
|---|---|
| complete | 213 |
| needs-review | 19 |

**Nilai `VERDICT:`/`VONIS:`** (seluruh berkas, kemunculan pertama, huruf besar): berkas = 0

(tidak ada)

**Token kosakata status/verdict** (berkas yang memuat kata utuh; huruf-besar dicocokkan persis, huruf-kecil dicocokkan persis huruf kecil)

| token | berkas | % |
|---|---|---|
| complete | 215 | 92% |
| needs-review | 22 | 9% |
| blocked | 2 | 1% |
| NEEDS_REVIEW | 0 | 0% |
| PASS | 74 | 32% |
| CAUTION | 0 | 0% |
| FAIL | 72 | 31% |
| PARKED | 0 | 0% |
| done | 1 | 0% |
| running | 3 | 1% |
| ready | 8 | 3% |
| draft | 19 | 8% |
| todo | 0 | 0% |
| review | 51 | 22% |
| issued | 0 | 0% |
| closed | 2 | 1% |
| approved | 0 | 0% |
| berjalan | 34 | 15% |
| selesai | 32 | 14% |

**Kemunculan hasil-cek huruf besar** (semua kemunculan): FAIL=227, PASS=220

**Id kartu** regex `\bt_[0-9a-f]{8}\b`: berkas pemuat 0 (0%); id unik 0; histogram panjang heks setelah `t_` (semua `t_[0-9a-f]+`): 

**Cara merujuk bukti** (regex pada seluruh berkas; berkas pemuat)

| bentuk rujukan | berkas | % |
|---|---|---|
| path docs/... | 34 | 15% |
| path berkas dgn ekstensi | 225 | 97% |
| path:baris (file.ext:NN) | 79 | 34% |
| sha dgn nilai hex>=8 | 38 | 16% |
| corr id (corr <hex8>) | 3 | 1% |
| commit/@hex7+ | 0 | 0% |
| byte/ukuran (NN B/KB/MB) | 21 | 9% |
| exit code | 224 | 96% |
| mtime | 3 | 1% |
| kartu t_xxxxxxxx | 0 | 0% |

##### Contoh berpath: R1 delegation_progress/coder_execution_*.md

`./x/delegation_progress/coder_execution_fix1.md`

```text
---
task_id: FIX-1
task_slug: doc_artifact_studio
row: FIX-1 (loop perbaikan siklus 1: layanan + API)
date: 2026-10-23
```

`./x/delegation_progress/coder_execution_fixx.md`

```text
---
task_id: FIX-X
task_slug: doc_artifact_studio
row: FIX-X (loop perbaikan siklus 2; D-271 butir a + c)
date: 2026-10-23
```

`./x/delegation_progress/coder_execution_ip52.md`

```text
# IP-52 rekomposer norm/v1 runtime + sunting v1 ber-baris (coder-execution)
Status: needs-review (semua bukti area PASS; satu perbaikan satu baris di luar area wajib: `submit/pipeline.ts`). Skills: backend-execution, dry-run-verify-fix. Temuan SR-37 / D-209; D-196, D-199.
Berkas:
- BARU `src/lib/studio/services/structure/legacy-v1.ts`: `adaptLegacySnapshot`, `sectionsShaWithoutPids`, `adaptorPidMismatches`, `checkLegacyReconstruction` (logika `legacyRecomposer` skrip SR-37 dip
- UBAH `structure/snapshot.ts`: `verifyReconstruction` menangani norm/v1 sendiri (cek baris vs `adaptV1(snapshot.doc)` lalu snapshot v1 tersimpan; recomposer terdaftar hanya untuk norm/v2; skema lain 
```

`./x/delegation_progress/coder_execution_s29.md`

```text
# S29 coder-execution: diagram tata letak sld, rack, graph (I19)
- Status: complete (2026-10-23). Area: `src/lib/studio/engine/diagram/layout-c/**`. Klaim di `file_claims.md` (2 baris S29).
- Berkas (5): `layout-c/index.ts` (ganti stub), `geometry.ts`, `sld.ts`, `rack.ts`, `graph.ts`.
- Ekspor kontrak §8.2: `layoutSld`, `layoutRack`, `layoutGraph` : `LayoutResult`. Tambahan aditif: `layoutSldDetail` (`bus`), `layoutRackDetail` (`rackX`), `layoutGraphDetail` (`adaptive`, `rowpack`):
- Port: HS `datum_diagram.py` :582-854 (`layout_sld`, `layout_rack`, `_graph_min_width`, `_graph_column_pos` ROWPACK lengkap, `layout_graph`), util :189-249, `Sheet.height` :404 (foot 0; kaki ditambah
```

`./x/delegation_progress/coder_execution_s96.md`

```text
# S96 coder-execution: harness pembanding benchmark D-17 (H06)
- Status: complete. Skill: dry-run-verify-fix (1 siklus, 0 perbaikan gagal).
- Berkas (area eksklusif `benchmark/harness/compare/`): `bm_compare.py` (CLI H06), `docx_units.py` (unit teks + hitungan DOCX), `pdf_pages.py` (teks/raster/SSIM per halaman dan per figur), `ssim_seam.
- Klaim: `file_claims.md` baris S96 (glob + 7 path persis).
- Metode: BM1 = LCS eksak (bit-parallel, diuji 2000 kasus acak vs DP: 0 selisih) atas unit (paragraf badan, sel tabel, caption, baris SUMBER/PROVENANS), pct = LCS / max(unit acuan, unit keluaran); dif
```

- Nilai frontmatter `status:` (persis): (none)=179, complete=45, needs-review=9

#### R2 delegation_progress/*.md bukan coder_execution_ (n = 16)
- Misi/folder tingkat-1 berbeda: 1; di dalam folder backup*/wiki_backup*: 0; ukuran median 6735 B (min 1737, maks 104014); baris median 57.
- Berkas tanpa satu pun judul ## atau ###: 4 (25%).
- Judul ##: total kemunculan 60; judul ternormalisasi berbeda 52; muncul di tepat 1 berkas 47.

**Top 20 judul ##** (normalisasi: huruf kecil, digit -> N, nomor awal dibuang; urut berkas-pemuat)

| judul | berkas | % berkas | kemunculan |
|---|---|---|---|
| berkas | 4 | 25% | 4 |
| temuan untuk controller | 3 | 19% | 3 |
| bukti | 2 | 12% | 2 |
| klaim vs kode | 2 | 12% | 2 |
| permintaan lintas pemilik | 2 | 12% | 2 |
| angka (dicetak skrip) | 1 | 6% | 1 |
| angka (grep atas N_specs.md) | 1 | 6% | 1 |
| area dan berkas bersama | 1 | 6% | 1 |
| artefak | 1 | 6% | 1 |
| aturan | 1 | 6% | 1 |
| batasan | 1 | 6% | 1 |
| batch hermes (N-N-N, d-N) | 1 | 6% | 1 |
| berkas bersama dan penulis tunggal | 1 | 6% | 1 |
| berkas ditulis (area eksklusif) | 1 | 6% | 1 |
| berkas diubah | 1 | 6% | 1 |
| bukti verifikasi | 1 | 6% | 1 |
| butir terbuka | 1 | 6% | 1 |
| doc-N (d-N..d-N; review doc-N + uji ulang hermes) | 1 | 6% | 1 |
| doc-Nb (d-N..d-N) | 1 | 6% | 1 |
| documentation contract | 1 | 6% | 1 |

- Judul ###: total kemunculan 0; judul ternormalisasi berbeda 0; muncul di tepat 1 berkas 0.

**Top 20 judul ###** (normalisasi: huruf kecil, digit -> N, nomor awal dibuang; urut berkas-pemuat)

(tidak ada)

**Kunci kepala generik** (40 baris pertama; `fm:` = frontmatter YAML, `kv:` = baris `Kunci: nilai` / `**Kunci:** nilai`; berkas pemuat)

| kunci | berkas | % |
|---|---|---|
| kv:status | 9 | 56% |
| kv:penulis | 3 | 19% |
| kv:blueprint | 2 | 12% |
| kv:format | 2 | 12% |
| kv:rollback | 1 | 6% |
| kv:keluaran | 1 | 6% |
| kv:masukan dibaca | 1 | 6% |
| kv:perintah | 1 | 6% |
| fm:agent | 1 | 6% |
| fm:date | 1 | 6% |
| fm:row | 1 | 6% |
| fm:status | 1 | 6% |
| kv:agent | 1 | 6% |
| kv:date | 1 | 6% |
| kv:row | 1 | 6% |
| kv:kenop esensial | 1 | 6% |
| kv:lapis | 1 | 6% |
| kv:penjaga sha | 1 | 6% |
| kv:preset | 1 | 6% |
| kv:sebelum | 1 | 6% |
| kv:catatan nama berkas | 1 | 6% |
| kv:skills_to_load | 1 | 6% |
| kv:skrip di luar repo | 1 | 6% |
| kv:akar repo | 1 | 6% |
| kv:catatan baris | 1 | 6% |

**Medan kepala bertarget** (regex pada 40 baris pertama; berkas pemuat)

| medan (regex ringkas di Lampiran A) | berkas | % |
|---|---|---|
| status | 9 | 56% |
| agen/owner/peran | 1 | 6% |
| kartu (t_xxxxxxxx / kartu / task_id / task_ref) | 0 | 0% |
| label tanggal (tanggal/date/created/updated/giliran) | 2 | 12% |
| tanggal ISO YYYY-MM-DD di kepala | 6 | 38% |
| misi/tenant/kontrak | 8 | 50% |
| verdict/vonis | 0 | 0% |
| sha | 4 | 25% |
| corr/correlation | 1 | 6% |
| commit/git | 1 | 6% |
| path berkas (ext) | 15 | 94% |

**Nilai status kepala** (`status: x` / `STATUS: x`, 60 baris pertama, 1 per berkas, huruf kecil): berkas bernilai-status = 10

| nilai | berkas |
|---|---|
| complete | 10 |

**Nilai `VERDICT:`/`VONIS:`** (seluruh berkas, kemunculan pertama, huruf besar): berkas = 0

(tidak ada)

**Token kosakata status/verdict** (berkas yang memuat kata utuh; huruf-besar dicocokkan persis, huruf-kecil dicocokkan persis huruf kecil)

| token | berkas | % |
|---|---|---|
| complete | 13 | 81% |
| needs-review | 2 | 12% |
| blocked | 1 | 6% |
| NEEDS_REVIEW | 0 | 0% |
| PASS | 6 | 38% |
| CAUTION | 1 | 6% |
| FAIL | 6 | 38% |
| PARKED | 0 | 0% |
| done | 1 | 6% |
| running | 0 | 0% |
| ready | 1 | 6% |
| draft | 5 | 31% |
| todo | 0 | 0% |
| review | 10 | 62% |
| issued | 0 | 0% |
| closed | 0 | 0% |
| approved | 0 | 0% |
| berjalan | 3 | 19% |
| selesai | 2 | 12% |

**Kemunculan hasil-cek huruf besar** (semua kemunculan): PASS=18, FAIL=18, CAUTION=1

**Id kartu** regex `\bt_[0-9a-f]{8}\b`: berkas pemuat 0 (0%); id unik 0; histogram panjang heks setelah `t_` (semua `t_[0-9a-f]+`): 

**Cara merujuk bukti** (regex pada seluruh berkas; berkas pemuat)

| bentuk rujukan | berkas | % |
|---|---|---|
| path docs/... | 12 | 75% |
| path berkas dgn ekstensi | 15 | 94% |
| path:baris (file.ext:NN) | 8 | 50% |
| sha dgn nilai hex>=8 | 2 | 12% |
| corr id (corr <hex8>) | 0 | 0% |
| commit/@hex7+ | 0 | 0% |
| byte/ukuran (NN B/KB/MB) | 5 | 31% |
| exit code | 5 | 31% |
| mtime | 1 | 6% |
| kartu t_xxxxxxxx | 0 | 0% |

##### Contoh berpath: R2 delegation_progress/*.md bukan coder_execution_

`./x/delegation_progress/data_analyst_s01.md`

```text
# Catatan baris S01 (data-analyst)
Status: complete. Skills_to_Load: none. Klaim berkas sudah ditulis controller (`file_claims.md:8-9`).
## Berkas
- NEW `docs/2026-10-22_doc_artifact_studio/masterplan/01_specs.md` (15 bagian)
- NEW catatan ini
```

`./x/delegation_progress/data_analyst_sr02.md`

```text
---
row: SR-02
agent: data-analyst
date: 2026-10-23
status: complete
```

`./x/delegation_progress/document_specialist_doc1.md`

```text
# Catatan document-specialist DOC-1 (IP-60, D-227; lanjutan SR-35b)
Status: complete (lanjutan D-229/D-230 sesudah FIX-5; Temuan 1 tertutup, lihat seksi Lanjutan). Tanggal 2026-10-23. Skill: document-quality-standards (modul D, E, F, H). Klaim DOC-1 di `file_claims.md
## Berkas diubah
| Berkas | Perubahan | Lokasi sesudah edit |
|---|---|---|
```

`./x/delegation_progress/driver_rules.md`

```text
# Aturan driver — Doc Artifact Studio (berlaku untuk setiap baris)
Penulis: controller. Setiap brief merujuk berkas ini; baca utuh sebelum mulai.
Akar repo: `C:\Users\TRIAL\gsp-swarm-hq-v2.1` (branch `v2.1`). Folder tugas: `docs/2026-10-22_doc_artifact_studio/` (selanjutnya `<task>`).
Blueprint: `<task>/identification/02_structured.md`. Keputusan mengikat: `<task>/decisions/decisions.md` (D-01..D-22).
## Mode
```

`./x/delegation_progress/file_requests.md`

```text
# File requests (append-only oleh driver; dirutekan controller)
Format: `IDpeminta | path | perubahan persis | blocking ya/tidak` — controller menambahkan ` => putusan` di baris yang sama saat dirutekan.
S02 | src/lib/studio/contract (S01/S03) | tambah spec komposit galeri chart (panel bernama berisi beberapa kode chart), atribut peran tanda data (data-mark role) pada SVG Node, entri drawn=false denga
S02 | benchmark/manual000/figures (S94) | sumber data figur galeri Gambar 8.1-8.5 = transkripsi nilai dari panel PNG manual, BUKAN pustakachart_data.py (F-005) | ya untuk S94 => DIRUTEKAN ke brief S94
S02 | src/lib/studio/engine/chart/core (S32) | tulis ukuran font dalam pt fisik (bukan px); opsi gaya threshold galeri (garis batas hitam, label batas di atas, label nilai di dalam batang) untuk P-11 
```

- Nilai frontmatter `status:` (persis): (none)=15, complete=1

#### R3 test/*.md (n = 21)
- Misi/folder tingkat-1 berbeda: 1; di dalam folder backup*/wiki_backup*: 0; ukuran median 15711 B (min 9440, maks 32981); baris median 152.
- Berkas tanpa satu pun judul ## atau ###: 0 (0%).
- Judul ##: total kemunculan 196; judul ternormalisasi berbeda 106; muncul di tepat 1 berkas 86.

**Top 20 judul ##** (normalisasi: huruf kecil, digit -> N, nomor awal dibuang; urut berkas-pemuat)

| judul | berkas | % berkas | kemunculan |
|---|---|---|---|
| strategi uji | 19 | 90% | 19 |
| catatan ci | 15 | 71% | 15 |
| cara menjalankan | 14 | 67% | 14 |
| rekomendasi | 10 | 48% | 10 |
| ringkasan | 10 | 48% | 10 |
| analisis cakupan dan celah | 7 | 33% | 7 |
| berkas uji | 4 | 19% | 4 |
| cakupan dan celah | 4 | 19% | 4 |
| analisis cakupan | 3 | 14% | 3 |
| cara menjalankan ulang | 3 | 14% | 3 |
| keterbatasan | 3 | 14% | 3 |
| batasan dan rekomendasi | 2 | 10% | 2 |
| berkas keluaran | 2 | 10% | 2 |
| berkas uji dan keluaran | 2 | 10% | 2 |
| berkas yang dihasilkan | 2 | 10% | 2 |
| berkas yang ditulis sN | 2 | 10% | 2 |
| masalah dan keterbatasan | 2 | 10% | 2 |
| perintah dan keluaran | 2 | 10% | 2 |
| perintah dan keluaran (dikutip) | 2 | 10% | 2 |
| status akhir | 2 | 10% | 2 |

- Judul ###: total kemunculan 34; judul ternormalisasi berbeda 34; muncul di tepat 1 berkas 34.

**Top 20 judul ###** (normalisasi: huruf kecil, digit -> N, nomor awal dibuang; urut berkas-pemuat)

| judul | berkas | % berkas | kemunculan |
|---|---|---|---|
| N.N N bad_cases | 1 | 5% | 1 |
| N.N atribusi unit teks (gerbang textorder): `diag/<fixture>_classes.js | 1 | 5% | 1 |
| N.N atribusi unit teks beracuan (`diag/classes_runN.json`, ditinjau ma | 1 | 5% | 1 |
| N.N beracuan (N): N lulus / N gagal | 1 | 5% | 1 |
| N.N chart asap | 1 | 5% | 1 |
| N.N diagnosis f-N per kriteria (N fixture int-n) | 1 | 5% | 1 |
| N.N diagram, per fixture terhadap ambang dg | 1 | 5% | 1 |
| N.N display_field df-N..df-N (setiap df punya kasus negatif berpointer | 1 | 5% | 1 |
| N.N gerbang struktur | 1 | 5% | 1 |
| N.N harness diagram | 1 | 5% | 1 |
| N.N harness simbol | 1 | 5% | 1 |
| N.N keluarga diagram | 1 | 5% | 1 |
| N.N kode beracuan (N) | 1 | 5% | 1 |
| N.N kode tanpa acuan (N, lint saja) | 1 | 5% | 1 |
| N.N kode §N.N (blueprint N) -> kasus negatif | 1 | 5% | 1 |
| N.N laporan engine diagram (cek tambahan) | 1 | 5% | 1 |
| N.N lembar simbol per dialek | 1 | 5% | 1 |
| N.N penanganan f-N (strip tanda node, banding ulang) | 1 | 5% | 1 |
| N.N pengamatan sampingan (di luar gerbang dx, untuk sN/sN) | 1 | 5% | 1 |
| N.N perintah runbook yang salah atau kurang (runbook tidak diubah) | 1 | 5% | 1 |

**Kunci kepala generik** (40 baris pertama; `fm:` = frontmatter YAML, `kv:` = baris `Kunci: nilai` / `**Kunci:** nilai`; berkas pemuat)

| kunci | berkas | % |
|---|---|---|
| kv:status | 14 | 67% |
| kv:baris | 13 | 62% |
| fm:agent | 5 | 24% |
| fm:date | 5 | 24% |
| fm:row | 5 | 24% |
| fm:status | 5 | 24% |
| kv:agent | 5 | 24% |
| kv:date | 5 | 24% |
| kv:row | 5 | 24% |
| kv:lingkup | 4 | 19% |
| kv:area tulis | 4 | 19% |
| kv:runner | 4 | 19% |
| kv:kerangka | 3 | 14% |
| fm:skills | 3 | 14% |
| fm:task_id | 3 | 14% |
| fm:type | 3 | 14% |
| kv:skills | 3 | 14% |
| kv:task_id | 3 | 14% |
| kv:type | 3 | 14% |
| kv:pengecualian | 3 | 14% |
| kv:pembanding | 2 | 10% |
| kv:klaim berkas | 2 | 10% |
| fm:skill | 2 | 10% |
| fm:source_plan | 2 | 10% |
| fm:task_slug | 2 | 10% |

**Medan kepala bertarget** (regex pada 40 baris pertama; berkas pemuat)

| medan (regex ringkas di Lampiran A) | berkas | % |
|---|---|---|
| status | 16 | 76% |
| agen/owner/peran | 13 | 62% |
| kartu (t_xxxxxxxx / kartu / task_id / task_ref) | 3 | 14% |
| label tanggal (tanggal/date/created/updated/giliran) | 16 | 76% |
| tanggal ISO YYYY-MM-DD di kepala | 20 | 95% |
| misi/tenant/kontrak | 8 | 38% |
| verdict/vonis | 9 | 43% |
| sha | 11 | 52% |
| corr/correlation | 0 | 0% |
| commit/git | 4 | 19% |
| path berkas (ext) | 20 | 95% |

**Nilai status kepala** (`status: x` / `STATUS: x`, 60 baris pertama, 1 per berkas, huruf kecil): berkas bernilai-status = 16

| nilai | berkas |
|---|---|
| complete | 11 |
| needs-review | 5 |

**Nilai `VERDICT:`/`VONIS:`** (seluruh berkas, kemunculan pertama, huruf besar): berkas = 1

| nilai | berkas |
|---|---|
| FAIL | 1 |

**Token kosakata status/verdict** (berkas yang memuat kata utuh; huruf-besar dicocokkan persis, huruf-kecil dicocokkan persis huruf kecil)

| token | berkas | % |
|---|---|---|
| complete | 13 | 62% |
| needs-review | 7 | 33% |
| blocked | 0 | 0% |
| NEEDS_REVIEW | 0 | 0% |
| PASS | 18 | 86% |
| CAUTION | 1 | 5% |
| FAIL | 19 | 90% |
| PARKED | 0 | 0% |
| done | 1 | 5% |
| running | 1 | 5% |
| ready | 2 | 10% |
| draft | 3 | 14% |
| todo | 0 | 0% |
| review | 8 | 38% |
| issued | 0 | 0% |
| closed | 0 | 0% |
| approved | 0 | 0% |
| berjalan | 13 | 62% |
| selesai | 4 | 19% |

**Kemunculan hasil-cek huruf besar** (semua kemunculan): PASS=663, FAIL=296, CAUTION=2

**Id kartu** regex `\bt_[0-9a-f]{8}\b`: berkas pemuat 0 (0%); id unik 0; histogram panjang heks setelah `t_` (semua `t_[0-9a-f]+`): 

**Cara merujuk bukti** (regex pada seluruh berkas; berkas pemuat)

| bentuk rujukan | berkas | % |
|---|---|---|
| path docs/... | 5 | 24% |
| path berkas dgn ekstensi | 21 | 100% |
| path:baris (file.ext:NN) | 21 | 100% |
| sha dgn nilai hex>=8 | 8 | 38% |
| corr id (corr <hex8>) | 1 | 5% |
| commit/@hex7+ | 0 | 0% |
| byte/ukuran (NN B/KB/MB) | 7 | 33% |
| exit code | 19 | 90% |
| mtime | 3 | 14% |
| kartu t_xxxxxxxx | 0 | 0% |

##### Contoh berpath: R3 test/*.md

`./x/test/01_integration_db.md`

```text
# SR-49 Uji integrasi DB Studio (S75 diperluas) di `gsp_agent_hq_v21_uji`
Baris: SR-49 (blueprint 05; SC-5, SC-6, SC-7). Agen: test-expert, skill `tdd`. Tanggal: 2026-10-23.
Status: **complete** sesudah rerun akhir D-309 (bagian 00) dan jalan ulang D-275 (bagian 0): `Tests 25 passed | 1 skipped (26)`. Bagian 1-9 = jalan pertama (siklus 0), dipertahankan sebagai riwayat.
## 00. Rerun akhir (D-305 M-6, D-309; sesudah FIX-S2, FIX-U2, FIX-Z, FIX-SERAH, FIX-C2, FIX-A2, FIX-B2, FIX-H, FIX-2)
| Butir | Perintah -> log | Hasil |
```

`./x/test/05_parity_chart.md`

```text
---
type: test-report
task_id: doc_artifact_studio_s79
row: S79
date: 2026-10-23
```

`./x/test/09_benchmark_manual000.md`

```text
---
type: test-report
task_id: doc_artifact_studio_sr51
row: SR-51 (S98 benchmark resmi D-17)
date: 2026-10-23
```

`./x/test/14_api_structure.md`

```text
# SR-45 Uji API struktur (R12-R20, R01/R02/R19 v2, R18 multipart, R08 dry-run)
Baris: SR-45 (fase uji akhir) dan lanjutan D-305 (celah M-5 SR-58). Agen: test-expert. Skill: tdd. Tanggal: 2026-10-23.
Status: complete. Hasil run terakhir: 150 lulus, 0 gagal, 0 dilewati, di 9 berkas.
Kasus E2, E3a, E3b, dan E3c ada dan lulus. E3c mengikuti D-247: render penuh lewat R17.
Tiga kegagalan run pertama (D-247 x2, F-065) kini lulus setelah FIX-S diterima (D-261). Ekspektasinya diperketat ke kontrak D-261/D-275.
```

`./x/test/18_datum_lint_node_docx.md`

```text
---
task_slug: doc_artifact_studio
row: DL-1 (celah M-3 SR-58, D-305)
date: 2026-10-23
agent: test-expert
```

- Nilai frontmatter `status:` (persis): (none)=14, complete=6, needs-review=1

## 7. Collection Log

1. Baca blueprint: Read `identification/07_document_contract_blueprint.md` (baris 1-374 dari 602; baris 288 = DC-01, baris 341 = profil DC-01). Hasil: tugas DC-01 dikonfirmasi.
2. Skala korpus Hermes: `ls | wc -l` di docs/ = 841 entri; `find . -type f | wc -l` = 431576 berkas semua jenis (termasuk `node_modules`).
3. Daftar `.md` tanpa `node_modules`: `find . -name node_modules -prune -o -type f -name '*.md' -print | wc -l` = 15786 (pindaian 1), 15787 (pindaian 2).
4. Inventaris kelas: skrip Lampiran B (perintah 2.1). Hasil: bagian 3, 4, 6.
5. Verifikasi silang: perintah 2.2. Hasil: angka K1, K2, K9, LAPOR-SELESAI, LAPOR-FASE cocok dengan skrip.
6. Pindai rahasia pada keluaran skrip: `grep -n -i -E 'password|passwd|secret|api[_-]?key|bearer |token=|sk-[A-Za-z0-9]{10}|ghp_|AKIA|authorization:'` pada keluaran skrip. Hasil: 0 baris cocok. Contoh hanya mengutip 5 baris awal berkas.
7. Upaya dibatalkan: `grep -rl -E '^LAPOR-SELESAI' .` atas seluruh 431576 berkas (semua ekstensi) melewati batas waktu 300 detik dan dipindah ke latar; hasilnya tidak dipakai (bagian 8 butir 2).

## 8. Gaps & Needs More Data

1. Isi komentar kanban `LAPOR-SELESAI` / `LAPOR-FASE` yang sebenarnya tidak berada di `docs/`. Yang terukur hanya (a) instruksi kartu yang mewajibkannya (bagian 5, 625 dan 100 berkas), (b) 1 berkas `.txt` berisi teks komentar penutup, (c) 3 kutipan di `PHASE-REPORTS.md`. Sumber nyata komentar (basis data kanban Hermes) tidak dibaca karena di luar `docs/`.
2. Pencarian teks `^LAPOR-SELESAI` pada semua ekstensi (bukan hanya `.md`) tidak selesai (timeout 300 detik pada 431576 berkas). Jumlah berkas non-`.md` yang berisi teks komentar penutup tidak diketahui. Hanya `.md` yang dipindai oleh skrip.
3. Kelas K3 (`*report*`) memuat berkas bernama topik (mis. `screen-report.md`, `acquisition-report.md`) yang bukan laporan kerja agen; K7 memuat keluaran probe (`probe-*.out.md`) dan `SEED-LOG.md`; 147 dari 784 berkas K7 berada di folder `backup*`/`wiki_backup*` (duplikat arsip). Penyaringan lebih tajam tidak dilakukan.
4. Normalisasi judul menghapus digit dan nomor awal; judul yang berbeda hanya dari angka digabung. Kunci kepala `kv:` adalah heuristik regex: baris dengan beberapa kunci dalam satu baris (`Kartu: x. Verifier: y`) hanya menghasilkan kunci pertama; medan bertarget (tabel kedua) menutup sebagian celah itu.
5. Pola id kartu `t_[0-9a-f]{8}` stabil (histogram panjang heks: hampir semua 8). Label kartu non-heks (mis. `W0-4`, `FIX-R1`) berbentuk beragam dan hanya terukur lewat frasa "kartu <LABEL>" huruf besar-berstrip; tidak ada regex tunggal untuk label itu.
6. Laporan repo controller (R1-R3) tidak memuat id kartu Hermes (`t_xxxxxxxx` = 0 berkas) karena memakai `task_id`/`row`/nama baris (mis. `FIX-R1`); medan itu terhitung di "Kunci kepala generik" R1.
7. Kontrak (`contract*.md`) tidak diinventaris di sini (di luar fokus D-361). Hitungan pembanding untuk blueprint saja: `-name 'contract*.md'` = 468, `-iname 'contract*.md'` = 515, `-name 'contract.md'` = 460, `-name 'CONTRACT.md'` = 43 (blueprint 07 mengutip 463 dari Glob sesi lain; selisih mengikuti pindaian hidup dan huruf-besar/kecil).
8. Isi semantik (apakah suatu bagian "wajib" menurut aturan Hermes) tidak dinilai; hanya frekuensi. Aturan tertulis Hermes untuk format laporan (mis. `standards/`, skill `phase-reports`) tidak dibaca dalam baris ini.

## Lampiran A. Regex yang dipakai (salinan dari skrip)

```python
PRES = [
 ('status', r'(?i)\bstatus\b\**\s*[:=]'),
 ('agen/owner/peran', r'(?i)\b(agen|agent|owner|writer|author(?:_profile)?|peran|verifier|countersigner|reviewer|editor|assignee|profile)\b\**\s*[:=]'),
 ('kartu (t_xxxxxxxx | kartu | task_id | task_ref)', r'(?i)\bt_[0-9a-f]{8}\b|\b(kartu|task_id|task_ref)\b'),
 ('label tanggal (tanggal|date|created|updated|giliran)', r'(?i)\b(tanggal|date|created|updated|giliran)\b\**\s*[:=]'),
 ('tanggal ISO YYYY-MM-DD di kepala', r'\b20\d\d-\d\d-\d\d\b'),
 ('misi/tenant/kontrak', r'(?i)\b(misi|mission|tenant|kontrak|proyek|project)\b\**\s*[:=]?'),
 ('verdict/vonis', r'(?i)\b(verdict|vonis)\b'),
 ('sha', r'(?i)\bsha(?:256|16|8)?\b'),
 ('corr/correlation', r'(?i)\bcorr(?:elation)?\b'),
 ('commit/git', r'(?i)\b(commit|git)\b'),
 ('path berkas (ext)', r'[\w./-]+\.(?:md|json|py|csv|docx|xlsx|pptx|html|svg|png|txt|out|log)\b'),
]
EVID = [
 ('path docs/...', r'\bdocs/[\w./\-]+'),
 ('path berkas dgn ekstensi', r'[\w./-]+\.(?:md|json|py|csv|docx|xlsx|pptx|html|svg|png|txt|out|log)\b'),
 ('path:baris (file.ext:NN)', r'[\w/-]+\.\w{1,4}:\d+'),
 ('sha dgn nilai hex>=8', r'(?i)sha(?:256|16|8)?(?:\[:?\d+\])?\s*(?:16|8)?\s*[:=]?\s*`?[0-9a-f]{8,64}'),
 ('corr id (corr <hex8>)', r'(?i)\bcorr(?:elation)?(?:[ _-]?id)?\b[\s:=]*`?[0-9a-f]{8}'),
 ('commit/@hex7+', r'(?i)(?:commit\s+|@)[0-9a-f]{7,40}\b'),
 ('byte/ukuran (NN B|KB|MB)', r'\b\d[\d.,]*\s*(?:B|bytes|KB|MB)\b'),
 ('exit code', r'(?i)\bexit\s*(?:code\s*)?[=:]?\s*\d'),
 ('mtime', r'(?i)\bmtime\b'),
 ('kartu t_xxxxxxxx', r'\bt_[0-9a-f]{8}\b'),
]
STATUS_TOKENS = [
 ('complete', r'\bcomplete\b'), ('needs-review', r'\bneeds-review\b'), ('blocked', r'\bblocked\b'),
 ('NEEDS_REVIEW', r'\bNEEDS_REVIEW\b'), ('PASS', r'\bPASS\b'), ('CAUTION', r'\bCAUTION\b'), ('FAIL', r'\bFAIL\b'),
 ('PARKED', r'\bPARKED\b'), ('done', r'\bdone\b'), ('running', r'\brunning\b'), ('ready', r'\bready\b'),
 ('draft', r'\bdraft\b'), ('todo', r'\btodo\b'), ('review', r'\breview\b'),
 ('issued', r'\bissued\b'), ('closed', r'\bclosed\b'), ('approved', r'\bapproved\b'),
 ('berjalan', r'\bberjalan\b'), ('selesai', r'\bselesai\b'),
]
RE_HSTATUS = re.compile(r'(?i)\bstatus\b\**\s*[:=]\s*\**\s*`?([A-Za-z][A-Za-z_\-]*)')
RE_VERDICT = re.compile(r'\b(?:VERDICT|Verdict|VONIS|Vonis)\b\**\s*[:=]\s*\**\s*`?([A-Z][A-Z_\-]+)')
RE_CHECKRES = re.compile(r'\b(PASS|FAIL|CAUTION|NEEDS_REVIEW|NEEDS-REVIEW|NA)\b')
RE_KARTU_LABEL = re.compile(r'\b[Kk]artu\s+([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)')
```

## Lampiran B. Skrip lengkap `dc01_inventory.py` (teks apa adanya; jalankan seperti 2.1)

````python
# DC-01 inventory script (read-only over Hermes workspace; writes only to the output path argument).
# Usage: python -I dc01_inventory.py <hermes_docs_dir> <repo_task_dir> <out_md>
import os, re, sys, collections, statistics

HERMES = sys.argv[1].rstrip('/\\')
TASK = sys.argv[2].rstrip('/\\')
OUT = sys.argv[3]

def walk_md(root):
    res = []
    for dp, dns, fns in os.walk(root):
        dns[:] = [d for d in dns if d != 'node_modules']
        for fn in fns:
            if fn.endswith('.md'):
                res.append(os.path.join(dp, fn).replace('\\', '/'))
    res.sort()
    return res

def rel(p, root):
    return './' + p[len(root.replace('\\', '/')) + 1:]

def read(p):
    with open(p, 'r', encoding='utf-8', errors='replace') as f:
        return f.read()

# ---------- class definitions (priority order, mutually exclusive) ----------
def classify(r):
    parts = r.split('/')
    b = parts[-1]
    dirs = parts[:-1]
    if b == 'PHASE-REPORTS.md': return 'K1 PHASE-REPORTS.md'
    if b.upper() == 'LAPORAN-SELESAI.MD': return 'K2 LAPORAN-SELESAI.md'
    if re.search(r'(?i)report', b): return 'K3 *REPORT*.md (basename)'
    if re.search(r'(?i)lapor', b): return 'K4 *lapor*.md (basename)'
    if re.search(r'(?i)countersign', b): return 'K5 *countersign*.md'
    if re.search(r'(?i)verdict|vonis', b): return 'K6 *verdict*/*vonis*.md'
    if re.search(r'(?i)verif', b) or any(d in ('verification', 'verif', 'verifikasi', 'verify') for d in dirs): return 'K7 verif* (nama berkas atau folder verification|verif|verifikasi|verify)'
    if 'checkpoints' in dirs: return 'K8 folder checkpoints/*.md'
    if b.lower() == 'handoff.md': return 'K9 handoff.md'
    return None

def in_backup(r):
    return any(re.match(r'^(backup|wiki_backup)', d) for d in r.split('/')[:-1])

# ---------- text helpers ----------
def strip_fences(text):
    out = []
    fence = False
    for ln in text.split('\n'):
        if ln.lstrip().startswith('```'):
            fence = not fence
            continue
        if not fence:
            out.append(ln)
    return out

def norm_h(s):
    s = s.strip().rstrip('#').strip()
    s = s.lower()
    s = re.sub(r'^[\(\[]?[a-z0-9]{1,3}[\.\)\]]\s+', '', s)
    s = re.sub(r'\d+', 'N', s)
    s = re.sub(r'\s+', ' ', s)
    return s[:70]

def headings(lines):
    h2, h3 = [], []
    for ln in lines:
        m = re.match(r'^(#{2,3})\s+(.*\S)\s*$', ln)
        if m:
            (h2 if len(m.group(1)) == 2 else h3).append(norm_h(m.group(2)))
    return h2, h3

KV = re.compile(r'^\s*(?:[-*>]\s*)*\*{0,2}([A-Za-z\u00c0-\u00ff_][A-Za-z\u00c0-\u00ff_ /\-]{1,28}?)\*{0,2}\s*:\*{0,2}\s+\S')

def head_keys(lines):
    keys = []
    head = lines[:40]
    if head and head[0].strip() == '---':
        for ln in head[1:]:
            if ln.strip() == '---':
                break
            m = re.match(r'^([A-Za-z_][\w-]*)\s*:', ln)
            if m: keys.append('fm:' + m.group(1).lower())
    for ln in head:
        m = KV.match(ln)
        if m:
            k = m.group(1).strip().lower()
            if 'http' in k or len(k) < 2: continue
            keys.append('kv:' + k)
    return sorted(set(keys))

PRES = [
 ('status', r'(?i)\bstatus\b\**\s*[:=]'),
 ('agen/owner/peran', r'(?i)\b(agen|agent|owner|writer|author(?:_profile)?|peran|verifier|countersigner|reviewer|editor|assignee|profile)\b\**\s*[:=]'),
 ('kartu (t_xxxxxxxx | kartu | task_id | task_ref)', r'(?i)\bt_[0-9a-f]{8}\b|\b(kartu|task_id|task_ref)\b'),
 ('label tanggal (tanggal|date|created|updated|giliran)', r'(?i)\b(tanggal|date|created|updated|giliran)\b\**\s*[:=]'),
 ('tanggal ISO YYYY-MM-DD di kepala', r'\b20\d\d-\d\d-\d\d\b'),
 ('misi/tenant/kontrak', r'(?i)\b(misi|mission|tenant|kontrak|proyek|project)\b\**\s*[:=]?'),
 ('verdict/vonis', r'(?i)\b(verdict|vonis)\b'),
 ('sha', r'(?i)\bsha(?:256|16|8)?\b'),
 ('corr/correlation', r'(?i)\bcorr(?:elation)?\b'),
 ('commit/git', r'(?i)\b(commit|git)\b'),
 ('path berkas (ext)', r'[\w./-]+\.(?:md|json|py|csv|docx|xlsx|pptx|html|svg|png|txt|out|log)\b'),
]
EVID = [
 ('path docs/...', r'\bdocs/[\w./\-]+'),
 ('path berkas dgn ekstensi', r'[\w./-]+\.(?:md|json|py|csv|docx|xlsx|pptx|html|svg|png|txt|out|log)\b'),
 ('path:baris (file.ext:NN)', r'[\w/-]+\.\w{1,4}:\d+'),
 ('sha dgn nilai hex>=8', r'(?i)sha(?:256|16|8)?(?:\[:?\d+\])?\s*(?:16|8)?\s*[:=]?\s*`?[0-9a-f]{8,64}'),
 ('corr id (corr <hex8>)', r'(?i)\bcorr(?:elation)?(?:[ _-]?id)?\b[\s:=]*`?[0-9a-f]{8}'),
 ('commit/@hex7+', r'(?i)(?:commit\s+|@)[0-9a-f]{7,40}\b'),
 ('byte/ukuran (NN B|KB|MB)', r'\b\d[\d.,]*\s*(?:B|bytes|KB|MB)\b'),
 ('exit code', r'(?i)\bexit\s*(?:code\s*)?[=:]?\s*\d'),
 ('mtime', r'(?i)\bmtime\b'),
 ('kartu t_xxxxxxxx', r'\bt_[0-9a-f]{8}\b'),
]
STATUS_TOKENS = [
 ('complete', r'\bcomplete\b'), ('needs-review', r'\bneeds-review\b'), ('blocked', r'\bblocked\b'),
 ('NEEDS_REVIEW', r'\bNEEDS_REVIEW\b'), ('PASS', r'\bPASS\b'), ('CAUTION', r'\bCAUTION\b'), ('FAIL', r'\bFAIL\b'),
 ('PARKED', r'\bPARKED\b'), ('done', r'\bdone\b'), ('running', r'\brunning\b'), ('ready', r'\bready\b'),
 ('draft', r'\bdraft\b'), ('todo', r'\btodo\b'), ('review', r'\breview\b'),
 ('issued', r'\bissued\b'), ('closed', r'\bclosed\b'), ('approved', r'\bapproved\b'),
 ('berjalan', r'\bberjalan\b'), ('selesai', r'\bselesai\b'),
]
RE_HSTATUS = re.compile(r'(?i)\bstatus\b\**\s*[:=]\s*\**\s*`?([A-Za-z][A-Za-z_\-]*)')
RE_VERDICT = re.compile(r'\b(?:VERDICT|Verdict|VONIS|Vonis)\b\**\s*[:=]\s*\**\s*`?([A-Z][A-Z_\-]+)')
RE_CHECKRES = re.compile(r'\b(PASS|FAIL|CAUTION|NEEDS_REVIEW|NEEDS-REVIEW|NA)\b')
RE_KARTU_LABEL = re.compile(r'\b[Kk]artu\s+([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)')

def shape(s):
    s = re.sub(r'[0-9]', '9', s)
    s = re.sub(r'[a-z]', 'a', s)
    s = re.sub(r'[A-Z]', 'A', s)
    return s

def md_table(headers, rows):
    out = ['| ' + ' | '.join(headers) + ' |', '|' + '|'.join(['---'] * len(headers)) + '|']
    for r in rows:
        out.append('| ' + ' | '.join(str(x).replace('|', '/') for x in r) + ' |')
    return '\n'.join(out)

def stats_block(label, items, mode_note=''):
    """items: list of (relpath, text). Returns markdown for one class."""
    n = len(items)
    L = []
    L.append('#### ' + label + ' (n = %d)' % n)
    if n == 0:
        return '\n'.join(L) + '\n\n(kosong)\n'
    missions = collections.Counter(r.split('/')[1] if r.startswith('./') else r for r, _ in items)
    sizes = [len(t.encode('utf-8', 'replace')) for _, t in items]
    lines_n = [t.count('\n') + 1 for _, t in items]
    bk = sum(1 for r, _ in items if in_backup(r))
    L.append('- Misi/folder tingkat-1 berbeda: %d; di dalam folder backup*/wiki_backup*: %d; ukuran median %d B (min %d, maks %d); baris median %d.' % (
        len(missions), bk, statistics.median(sizes), min(sizes), max(sizes), statistics.median(lines_n)))
    # headings
    h2c, h3c = collections.Counter(), collections.Counter()
    h2df, h3df = collections.Counter(), collections.Counter()
    nohead = 0
    parsed = []
    for r, t in items:
        lines = strip_fences(t)
        h2, h3 = headings(lines)
        parsed.append((r, t, lines, h2, h3))
        h2c.update(h2); h3c.update(h3)
        h2df.update(set(h2)); h3df.update(set(h3))
        if not h2 and not h3: nohead += 1
    L.append('- Berkas tanpa satu pun judul ## atau ###: %d (%.0f%%).' % (nohead, 100.0 * nohead / n))
    for lvl, c, df in (('##', h2c, h2df), ('###', h3c, h3df)):
        distinct = len(c)
        single = sum(1 for k in c if df[k] == 1)
        L.append('- Judul %s: total kemunculan %d; judul ternormalisasi berbeda %d; muncul di tepat 1 berkas %d.' % (lvl, sum(c.values()), distinct, single))
        rows = [(k, df[k], '%.0f%%' % (100.0 * df[k] / n), c[k]) for k, _ in sorted(c.items(), key=lambda kv: (-df[kv[0]], -kv[1], kv[0]))[:20]]
        L.append('\n**Top 20 judul %s** (normalisasi: huruf kecil, digit -> N, nomor awal dibuang; urut berkas-pemuat)\n' % lvl)
        L.append(md_table(['judul', 'berkas', '% berkas', 'kemunculan'], rows) if rows else '(tidak ada)')
        L.append('')
    # header keys
    kc = collections.Counter()
    for r, t, lines, h2, h3 in parsed:
        kc.update(head_keys(t.split('\n')))
    rows = [(k, v, '%.0f%%' % (100.0 * v / n)) for k, v in kc.most_common(25)]
    L.append('**Kunci kepala generik** (40 baris pertama; `fm:` = frontmatter YAML, `kv:` = baris `Kunci: nilai` / `**Kunci:** nilai`; berkas pemuat)\n')
    L.append(md_table(['kunci', 'berkas', '%'], rows) if rows else '(tidak ada)')
    L.append('')
    # targeted presence
    rows = []
    for name, rx in PRES:
        c = 0
        crx = re.compile(rx)
        for r, t in items:
            head = '\n'.join(t.split('\n')[:40])
            if crx.search(head): c += 1
        rows.append((name, c, '%.0f%%' % (100.0 * c / n)))
    L.append('**Medan kepala bertarget** (regex pada 40 baris pertama; berkas pemuat)\n')
    L.append(md_table(['medan (regex ringkas di Lampiran A)', 'berkas', '%'], rows))
    L.append('')
    # status
    hs, vd = collections.Counter(), collections.Counter()
    for r, t in items:
        lines = t.split('\n')
        m = RE_HSTATUS.search('\n'.join(lines[:60]))
        if m: hs[m.group(1).lower()] += 1
        m = RE_VERDICT.search(t)
        if m: vd[m.group(1)] += 1
    L.append('**Nilai status kepala** (`status: x` / `STATUS: x`, 60 baris pertama, 1 per berkas, huruf kecil): berkas bernilai-status = %d\n' % sum(hs.values()))
    L.append(md_table(['nilai', 'berkas'], hs.most_common(15)) if hs else '(tidak ada)')
    L.append('')
    L.append('**Nilai `VERDICT:`/`VONIS:`** (seluruh berkas, kemunculan pertama, huruf besar): berkas = %d\n' % sum(vd.values()))
    L.append(md_table(['nilai', 'berkas'], vd.most_common(15)) if vd else '(tidak ada)')
    L.append('')
    rows = []
    for name, rx in STATUS_TOKENS:
        crx = re.compile(rx)
        c = sum(1 for r, t in items if crx.search(t))
        rows.append((name, c, '%.0f%%' % (100.0 * c / n)))
    L.append('**Token kosakata status/verdict** (berkas yang memuat kata utuh; huruf-besar dicocokkan persis, huruf-kecil dicocokkan persis huruf kecil)\n')
    L.append(md_table(['token', 'berkas', '%'], rows))
    L.append('')
    cr = collections.Counter()
    for r, t in items:
        cr.update(RE_CHECKRES.findall(t))
    L.append('**Kemunculan hasil-cek huruf besar** (semua kemunculan): ' + ', '.join('%s=%d' % kv for kv in cr.most_common()) + '\n')
    # card ids
    ids = collections.Counter()
    lens = collections.Counter()
    fcards = 0
    shapes = collections.Counter()
    ex_labels = {}
    for r, t in items:
        f = re.findall(r'\bt_[0-9a-f]{8}\b', t)
        if f: fcards += 1
        ids.update(set(f))
        for m in re.findall(r'\bt_[0-9a-f]+\b', t):
            lens[len(m) - 2] += 1
        for m in RE_KARTU_LABEL.findall(t):
            if re.fullmatch(r't_[0-9a-f]{8}', m): continue
            sh = shape(m)
            shapes[sh] += 1
            ex_labels.setdefault(sh, m)
    L.append('**Id kartu** regex `\\bt_[0-9a-f]{8}\\b`: berkas pemuat %d (%.0f%%); id unik %d; histogram panjang heks setelah `t_` (semua `t_[0-9a-f]+`): %s' % (
        fcards, 100.0 * fcards / n, len(ids), ', '.join('%d:%d' % kv for kv in sorted(lens.items()))))
    if shapes:
        L.append('- Label kartu non-heks setelah kata "kartu " (bentuk -> jumlah -> contoh): ' + '; '.join('`%s` x%d (mis. %s)' % (s, c, ex_labels[s]) for s, c in shapes.most_common(6)))
    L.append('')
    rows = []
    for name, rx in EVID:
        crx = re.compile(rx)
        c = sum(1 for r, t in items if crx.search(t))
        rows.append((name, c, '%.0f%%' % (100.0 * c / n)))
    L.append('**Cara merujuk bukti** (regex pada seluruh berkas; berkas pemuat)\n')
    L.append(md_table(['bentuk rujukan', 'berkas', '%'], rows))
    L.append('')
    return '\n'.join(L), parsed

def examples(label, items, k=5):
    n = len(items)
    if n == 0: return ''
    idx = sorted(set([0, n // 5, (2 * n) // 5, (3 * n) // 5, (4 * n) // 5])) if n >= 5 else list(range(n))
    L = ['##### Contoh berpath: ' + label]
    for i in idx[:k]:
        r, t = items[i]
        nb = [ln.strip()[:200] for ln in t.split('\n') if ln.strip()][:5]
        L.append('\n`' + r + '`\n')
        L.append('```text')
        L.extend(nb)
        L.append('```')
    return '\n'.join(L) + '\n'


SUMM = []

def summarize(label, parsed):
    n = len(parsed)
    df = collections.Counter()
    kdf = collections.Counter()
    for r, t, lines, h2, h3 in parsed:
        df.update(set(h2))
        kdf.update(head_keys(t.split(chr(10))))
    hi = [(k, v) for k, v in df.most_common() if v * 100 >= 80 * n]
    mid = [(k, v) for k, v in df.most_common() if 50 * n <= v * 100 < 80 * n]
    rare = sum(1 for k, v in df.items() if v * 100 <= 5 * n)
    khi = [(k, v) for k, v in kdf.most_common() if v * 100 >= 80 * n and not k.startswith('fm:')]
    kmid = [(k, v) for k, v in kdf.most_common() if 50 * n <= v * 100 < 80 * n and not k.startswith('fm:')]
    def fmt(lst):
        return ', '.join('`%s` (%d)' % kv for kv in lst[:8]) if lst else '(tidak ada)'
    SUMM.append((label, n, fmt(hi), fmt(mid), '%d dari %d' % (rare, len(df)), fmt(khi), fmt(kmid)))

def main():
    out = []
    all_md = walk_md(HERMES)
    out.append('<!--GEN-->')
    out.append('TOTAL_MD=%d' % len(all_md))
    classes = collections.OrderedDict()
    texts = {}
    for p in all_md:
        r = rel(p, HERMES)
        c = classify(r)
        if c:
            classes.setdefault(c, []).append(r)
    # overview table
    ov = []
    for c in sorted(classes):
        lst = classes[c]
        ms = set(r.split('/')[1] for r in lst)
        ov.append((c, len(lst), len(ms), sum(1 for r in lst if in_backup(r))))
    out.append('@@OVERVIEW@@')
    out.append(md_table(['kelas', 'berkas', 'misi berbeda', 'di folder backup*'], ov))
    # basename frequency per class
    out.append('@@BASENAMES@@')
    for c in sorted(classes):
        bn = collections.Counter(re.sub(r'\d+', 'N', r.split('/')[-1]) for r in classes[c])
        out.append('- %s: ' % c + ', '.join('`%s` x%d' % kv for kv in bn.most_common(8)))
    out.append('@@STATS@@')
    ex_out = []
    for c in sorted(classes):
        items = [(r, read(HERMES + '/' + r[2:])) for r in classes[c]]
        texts[c] = items
        s, parsed = stats_block(c, items)
        summarize(c, parsed)
        out.append(s)
        ex_out.append(examples(c, items))
        if c.startswith('K1 '):
            # entry level analysis for PHASE-REPORTS
            ent = 0; tags = collections.Counter(); labels = collections.Counter(); per_file = []
            fase_ok = 0; fase_all = 0; ts = 0
            for r, t in items:
                lines = strip_fences(t)
                e = 0
                for ln in lines:
                    if ln.startswith('## '):
                        e += 1
                        if re.match(r'^## \d{4}-\d\d-\d\d \d\d:\d\d', ln): ts += 1
                    m = re.match(r'^\[([A-Z][A-Z\-]*)\]', ln)
                    if m:
                        tags[m.group(1)] += 1
                        if m.group(1) == 'FASE':
                            fase_all += 1
                            if re.match(r'^\[FASE\]\s+\S+\s*\|[^|]+->[^|]+\|\s*\d\d:\d\d', ln): fase_ok += 1
                    m = re.match(r'^([A-Z][A-Z ]{2,20}):', ln)
                    if m: labels[m.group(1)] += 1
                per_file.append(e); ent += e
            out.append('**Analisis tingkat-entri PHASE-REPORTS.md**\n')
            out.append('- Entri (baris `## `): %d; entri berjudul `## YYYY-MM-DD HH:MM`: %d; entri per berkas median %s, maks %d, min %d.' % (ent, ts, statistics.median(per_file), max(per_file), min(per_file)))
            out.append('- Penanda kurung siku di awal baris (`^\\[[A-Z-]+\\]`): ' + ', '.join('[%s]=%d' % kv for kv in tags.most_common()))
            out.append('- Baris `[FASE]` yang cocok pola `[FASE] <misi> | <dari> -> <ke> | HH:MM`: %d dari %d.' % (fase_ok, fase_all))
            out.append('- Label baris-awal huruf besar `^[A-Z ]{3,21}:` per kemunculan: ' + ', '.join('%s=%d' % kv for kv in labels.most_common(12)))
            out.append('')
    # LAPOR-SELESAI / LAPOR-FASE instruction lines across all md
    out.append('@@SUMMARY@@')
    out.append(md_table(['kelas', 'n', 'judul ## di >=80% berkas (jumlah berkas)', 'judul ## di 50-79% berkas', 'judul ## berbeda yang ada di <=5% berkas', 'kunci kepala kv: di >=80% berkas', 'kunci kv: di 50-79% berkas'], [x for x in SUMM if not x[0].startswith('R')]))
    out.append('@@LAPOR@@')
    for key in ('LAPOR-SELESAI', 'LAPOR-FASE'):
        files = 0; lines_n = 0; tok = collections.Counter(); bnc = collections.Counter(); specs = collections.Counter(); exl = []
        mis = set()
        for p in all_md:
            t = read(p)
            if key not in t: continue
            files += 1
            r = rel(p, HERMES)
            mis.add(r.split('/')[1])
            bnc[re.sub(r'\d+', 'N', r.split('/')[-1])] += 1
            for lno, ln in enumerate(t.split(chr(10)), 1):
                if key in ln:
                    lines_n += 1
                    exl.append((r, lno, ln))
                    for name, rx in (('path', r'(?i)\bpath\b'), ('byte', r'(?i)\bbyte\b|\bB\b'), ('sha16/sha256', r'(?i)sha16|sha256'),
                                     ('jumlah kata', r'(?i)jumlah kata|\bkata\b'), ('verdict/vonis', r'(?i)verdict|vonis'),
                                     ('wait-ack', r'(?i)wait-ack'), ('complete', r'\bcomplete\b'), ('PARKED', r'PARKED'),
                                     ('mikro-verif', r'(?i)mikro-?verif'), ('corr', r'(?i)\bcorr'), ('exit', r'(?i)\bexit\b'),
                                     ('STATUS: complete', r'STATUS: ?complete'), ('ringkas', r'(?i)ringkas'), ('artefak', r'(?i)artefak'),
                                     ('estimasi', r'(?i)estimasi'), ('jalur', r'(?i)\bjalur\b'), ('rencana', r'(?i)\brencana\b')):
                        if re.search(rx, ln): tok[name] += 1
        out.append('- `%s`: berkas pemuat %d (misi berbeda %d); baris pemuat %d; nama berkas teratas: %s' % (
            key, files, len(mis), lines_n, ', '.join('`%s` x%d' % kv for kv in bnc.most_common(6))))
        out.append('  - token pada baris pemuat (jumlah baris): ' + ', '.join('%s=%d' % kv for kv in tok.most_common()))
        if exl:
            n_ = len(exl)
            idx_ = sorted(set([0, n_ // 5, (2 * n_) // 5, (3 * n_) // 5, (4 * n_) // 5]))
            out.append('  - 5 contoh baris (path; baris-ke-n pemuat; dipotong 260 karakter):')
            for i_ in idx_:
                r_, k_, l_ = exl[i_]
                out.append('    - `%s` #%d: `%s`' % (r_, k_, l_.strip()[:260].replace('`', "'")))
    out.append('@@EXAMPLES@@')
    out.extend(ex_out)
    # Repo comparators
    out.append('@@REPO@@')
    d1 = TASK + '/delegation_progress'
    d2 = TASK + '/test'
    A = sorted(os.path.join(d1, f).replace('\\', '/') for f in os.listdir(d1) if f.endswith('.md') and f.startswith('coder_execution_'))
    B = sorted(os.path.join(d1, f).replace('\\', '/') for f in os.listdir(d1) if f.endswith('.md') and not f.startswith('coder_execution_'))
    C = sorted(os.path.join(d2, f).replace('\\', '/') for f in os.listdir(d2) if f.endswith('.md'))
    for lab, lst in (('R1 delegation_progress/coder_execution_*.md', A), ('R2 delegation_progress/*.md bukan coder_execution_', B), ('R3 test/*.md', C)):
        items = [('./' + os.path.basename(os.path.dirname(p)) + '/' + os.path.basename(p), read(p)) for p in lst]
        # fake mission component to keep helper happy
        items = [('./x/' + r[2:], t) for r, t in items]
        s, parsed = stats_block(lab, items)
        summarize(lab, parsed)
        out.append(s)
        out.append(examples(lab, items))
        sc = collections.Counter()
        for r, t in items:
            m = re.search(r'(?m)^status:\s*(\S+)', t)
            sc[m.group(1) if m else '(none)'] += 1
        out.append('- Nilai frontmatter `status:` (persis): ' + ', '.join('%s=%d' % kv for kv in sc.most_common()) + '\n')
    out.append('@@SUMMARY_REPO@@')
    out.append(md_table(['kelas', 'n', 'judul ## di >=80% berkas (jumlah berkas)', 'judul ## di 50-79% berkas', 'judul ## berbeda yang ada di <=5% berkas', 'kunci kepala kv: di >=80% berkas', 'kunci kv: di 50-79% berkas'], [x for x in SUMM if x[0].startswith('R')]))
    with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(out))

main()
````

Catatan: skrip `assemble` yang menyusun berkas ini dari keluaran skrip di atas (hanya pemformatan dan tabel silang 3.3) tidak disertakan; angka 3.3 diekstrak dari tabel per kelas.
