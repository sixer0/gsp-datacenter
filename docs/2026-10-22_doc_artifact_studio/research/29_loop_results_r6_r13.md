# 29 — Hasil loop perbaikan ronde 6-13 (jalur tulis Studio untuk Hermes)

Status: disusun controller 2026-11-04 sesudah USER menghentikan loop (D-575). Protokol dasar: `research/27_efficiency_protocol_r5.md` (mewarisi `17_efficiency_protocol_r4.md`); ambang tidak berubah. Keputusan per ronde: `decisions/decisions.md` D-547 sampai D-575. Skrip analisis: `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/analysis_loop/` (`urep.py`, `udoc5.py`, `retrieval5.py`, `docxcheck5.py`, `rounds.json`); keluaran per ronde `urep_<r>.json`, `udoc_<r>.json`, `docx_all5.json`. Verifikasi independen: `verification/18_loop_results_verification.md`.

## 1. Ringkasan

| Sasaran | Ambang | Hasil akhir | Vonis |
|---|---|---|---|
| U-DOC UD-1a (T1 B/A) | <= 1,00 | 0,098-0,463 di semua 14 pasangan sah r6-r13 | LULUS konsisten |
| U-DOC UD-1b (T2 B/A) | <= 0,70 | 0,027-0,581 di 13 dari 14 pasangan sah; 1,276 sekali (r12 DB2) | LULUS (satu pengecualian) |
| U-DOC UD-2 (isi + struktur, KERAS) | lihat r4 §6.8 | sejak r6 judul/subbab tepat; sejak r7 footer, riwayat revisi, dan grafik benar; r7 DB menaruh RV-3 sebagai paragraf baru; r13 DB kurang 9 token isi (kesalahan penulis) | LULUS di r8, r9, r11, r12 (DB2); satu pasangan gagal di r7 dan r13 |
| U-REP KE-1 r1 (median per ronde, ukuran utama) | <= 1,00 | lulus di 4 dari 8 ronde (r7 0,970, r8 0,877, r11 0,726, r12 0,817); gagal r6, r9, r10, r13 (1,034); sensitivitas gabungan r11-r13 0,86 | BERAYUN: lulus di ronde terakhir yang berprotokol sama kecuali r13 |
| U-REP KE-1 r2 (median; maks) | <= 0,70; <= 1,00 | lulus sekali (r9 0,512/0,611, dengan cacat skenario); r11-r13 per ronde 0,863 / 1,889 / 1,393; sensitivitas gabungan 1,39 / 2,41 (6 dari 9 pasangan > 1,0) | GAGAL |
| U-REP gerbang KERAS (G_B,stored, KE-4, KE-5, status) | semua | G_B,stored 100% tiap ronde; status = tujuan di 6 dari 8 ronde (r7 W tidak sah, r10 W `draft`; benar sejak r11); KE-4 B 5/5 di 7 dari 8 ronde (r7 2/5 otomatis, 5/5 ajudikasi), rujukan Q5 menunjuk paragraf bernilai di 8/8 ronde; KE-5 jejak disk: F_name = F_sha = 100% dan sandbox arm B hanya berisi unduhan final di 8/8 ronde | LULUS (kecuali status W r7/r10) |

Kesimpulan controller: dokumen klien lewat Studio jelas lebih ringan dan lebih rapi daripada builder lokal (T1 2-10x lebih cepat, struktur benar oleh mesin). Laporan kerja lewat Studio kira-kira setara dengan Markdown untuk tulis pertama (r1 berayun di sekitar 1,0) dan lebih lambat untuk suntingan kecil (r2 median per ronde 0,86-1,89 di r11-r13; 6 dari 9 pasangan di atas 1,0, maks 2,41), sambil menambah retrieval terstruktur, record tervalidasi, dan jejak berkas terverifikasi. Target r2 <= 0,70 tidak tercapai dan menurut analisis §5 kecil kemungkinannya tercapai lewat perbaikan alat saja.

## 2. Jalannya loop

| Ronde | Perubahan utama (commit) | Perubahan protokol/harness |
|---|---|---|
| r6 | judul sumber tetap, meta selalu diterapkan, ringkasan verifikasi, font raster grafik (b84dfb9) | brief r6 |
| r7 | append/addRow, batch berurutan + cadangan alamat tersimpan, terapkan sebagian (`notApplied`), alias status, reportedAt otomatis, lebar label grafik, footer nomor meta (02e87f7) | panduan menulis di brief (arahan USER) |
| r8 | how-to + draf skill Hermes (a99cd15) | fase orientasi P + `mark READY`, jam dari mark START Hermes (D-559/D-560); 4 lajur profil paralel (D-562/D-563) |
| r9 | peringatan informasi disembunyikan, catatan argumen objek (64d6cab) | agentId tunggal di semua profil |
| r10 | — (7e326c1 dokumen) | fakta pembaruan dibuka bertahap (D-567); server thinker sempat down; JEDA atas arahan USER |
| r11 | larik datar berurutan -> satu tabel, jumlah tabel di verifikasi (e39ce5e) | config gsp-master01 baru diterima (D-569); lajur DA2/DB2 ke gsp-thinker |
| r12 | toleransi argumen terbungkus ganda dan meta di dalam edits (eb7fcef) | pencatatan + baca pembaruan satu perintah |
| r13 | append membuat bagian baku yang belum ada, normalisasi vonis (044a1f7) | — |

Durasi uji per ronde (termasuk sesi umpan balik DF) turun dari 3 j 39 m (r6, berurutan) dan 1 j 37 m (r7, berurutan) ke 54 m (r8, 4 lajur); di r9-r13 sesi bernilai selesai dalam sekitar 35-60 menit, DF berjalan sesudahnya (r10 sampai 02:17Z karena outage).

## 3. Hasil per ronde

### 3.1 U-REP (laporan kerja; pasangan R10, R11, R12; r1/r2 = B/A)

| Ronde | R10 r1/r2 | R11 r1/r2 | R12 r1/r2 | median r1 | median r2 | maks r2 | Catatan |
|---|---|---|---|---|---|---|---|
| r6 | 1,671/4,307 | 2,446/7,891 | 0,458/0,415 | 1,671 | 4,307 | 7,891 | jam dari START harness |
| r7 | 0,468/1,016 | 0,970/1,466 | 1,335/0,934 | 0,970 | 1,016 | 1,466 | run W menulis isi R (penyimpangan) |
| r8 | 0,877/2,492 | 1,352/1,675 | 0,199/2,778 | 0,877 | 2,492 | 2,778 | regresi agentId per profil |
| r9 | 0,797/0,611 | 6,421/0,251 | 1,758/0,512 | 1,758 | 0,512 | 0,611 | B merencanakan S1-S3 di fase S1 (cacat skenario) |
| r10 | 0,765/2,436 | 1,544/1,489 | 9,218/7,056 | 1,544 | 2,436 | 7,056 | outage thinker; tabel butir tersimpan sebagai daftar (R12B) |
| r11 | 0,559/0,863 | 0,726/2,158 | 2,593/0,490 | 0,726 | 0,863 | 2,158 | |
| r12 | 0,931/1,933 | 0,817/1,057 | 0,764/1,889 | 0,817 | 1,889 | 1,933 | beban host 43-62% |
| r13 | 0,860/1,393 | 1,034/0,744 | 1,618/2,413 | 1,034 | 1,393 | 2,413 | |

Volume penalaran arm B/A (karakter, R10 / R11 / R12; jendela START harness-END, sehingga arm B sejak r8 ikut memuat fase orientasi): r6 209.972/49.510, 146.404/20.328, 97.702/59.060; r7 47.940/73.686, 50.726/25.754, 71.824/41.756; r13 58.030/39.862, 37.048/15.464, 71.638/50.356. Penalaran arm B turun 1,4-4,4x per pasangan (total 2,7x) dari r6 ke r7, naik lagi di r8 (D-566), lalu berada di sekitar 26.000-107.000 karakter per run; rasio B/A r11-r13 median 1,61.

Gerbang KERAS per ronde: G_B,stored valid 30/30 (atau 42/42 di r7) di semua ronde. Status tersimpan = tujuan di r6, r8, r9, r11, r12, r13 (r7 W tidak sah, r10 W `draft`). KE-4 (skor `retrieval5.py`, dokumen dari registri misi, kunci Q5 dari `refs[]` record R12B yang tersimpan): B 5/5 di r6, r8, r9, r10, r11, r12, r13; r7 B 2/5 otomatis, 5/5 sesudah ajudikasi dokumen tambahan run W (D-565). A 4/5 atau 5/5 di semua ronde. Rujukan R12B -> R10B menunjuk paragraf yang memuat nilai di 8/8 ronde (klaim gagal r10/r13 di D-568/D-574 adalah salah skor, dikoreksi D-576). KE-5 (jejak disk, protokol r4 §7.6): unduhan arm B 9-14 berkas per ronde, F_name = F_sha = 100% di 8/8 ronde, sandbox arm B tidak memuat berkas lain, sandbox Q kosong; pemindaian `prov.py` r11-r13 oleh verifikasi 18 hanya menemukan dua positif-palsu nama berkas.

### 3.2 U-DOC (dokumen klien; DB/DA dan DB2/DA2; UD-1a/UD-1b)

| Ronde | DB/DA | DB2/DA2 | UD-2 arm B |
|---|---|---|---|
| r6 | 0,315/0,363 | 0,294/0,363 | judul 18/18 tepat, riwayat revisi penuh; label grafik terpotong (UD-3), footer nomor server |
| r7 | 0,437/0,279 | 0,207/0,224 | DB: RV-3 jadi paragraf baru; DB2 utuh; grafik utuh, footer benar |
| r8 | 0,244/0,358 | 0,428/0,255 | utuh kedua pasangan |
| r9 | 0,246/0,388 | 0,098/0,581 | utuh |
| r10 | 0,192/0,027 | tidak sah (DA2 kehabisan anggaran profil) | DB utuh (cek segar verifikasi 18) |
| r11 | 0,463/0,461 | 0,140/0,223 | utuh |
| r12 | tidak sah (DA berhenti sebelum S1) | 0,220/1,276 | DB2 utuh |
| r13 | 0,188/0,315 | 0,159/0,539 | DB2 utuh; DB kurang 9 token isi |

## 4. Ancaman validitas

1. n = 3 pasangan U-REP per ronde; T2 absolut kecil (arm A 25-115 s di r11-r13), sehingga satu giliran model tambahan (20-40 s) menggandakan rasio. Median per ronde berayun (r2: 0,51 / 0,86 / 1,89 / 1,39 di r9, r11, r12, r13).
2. Throughput penyedia berubah antar-waktu (r6 sampai 5x lebih lambat 16:30-17:40Z; r8 lebih lambat saat 4 lajur). Aturan D-563 (ulang pasangan bila selisih throughput > 2x) hanya dicek di r8 dan r10 (tidak terpicu); proksi kasar verifikasi 18 menunjukkan selisih > 2x pada pasangan R11 di r9, r10, r12, r13, jadi aturan itu tidak diterapkan konsisten.
3. Beban host dari pekerjaan swarm lain (r12 CPU 43-62%; proses pytest gsp-brahma dari gateway default).
4. Pergantian profil per lajur sejak r8 dan config gsp-master01 berubah oleh pihak lain di r10 (diterima USER, D-569).
5. Perubahan protokol di tengah loop (orientasi P, jam dari START Hermes, fakta bertahap) membuat r6-r10 tidak dapat digabung dengan r11-r13; analisis gabungan memakai r11-r13 saja.
6. Arm A tidak membaca how-to (kebiasaan Markdown bawaan); arm B membaca how-to sebelum START (proksi skill produksi, D-560).

## 5. Analisis gabungan r11-r13 (protokol sama)

U-REP 9 pasangan: r1 = 0,559; 0,726; 0,764; 0,817; 0,860; 0,931; 1,034; 1,618; 2,593 (median 0,86). r2 = 0,490; 0,744; 0,863; 1,057; 1,393; 1,889; 1,933; 2,158; 2,413 (median 1,39, maks 2,41).

Mengapa r2 tidak turun lagi: ukuran kiriman sunting B setara A (median B 7-8 KB, A 8-9 KB per laporan di r11-r13; dua pencilan B 13,3 dan 15,5 KB), panggilan sunting B kini hampir tanpa galat server, tetapi penalaran B masih lebih banyak daripada A (rasio median 1,61). Sisa selisih adalah giliran model per langkah sunting; menambal Markdown sudah merupakan aksi minimal, sehingga Studio paling banter setara. Kegagalan JSON pada jembatan `tool_call` Hermes (alat MCP dimuat tertunda lewat tool_search) masih muncul sekitar satu kali per beberapa run dan tidak dapat ditangani server bila `name` hilang.

U-DOC 5 pasangan sah r11-r13: UD-1a 0,140-0,463, UD-1b 0,223-0,539 kecuali 1,276 (r12 DB2).

## 6. Rekomendasi untuk keputusan go-live

1. Dokumen klien lewat Studio: layak go-live (waktu jauh lebih rendah, struktur dan revisi dikerjakan mesin; sisa kesalahan isi berasal dari penulis).
2. Laporan kerja lewat Studio: layak bila nilai retrieval terstruktur, record tervalidasi, revisi berversi, dan jejak berkas terverifikasi dianggap sepadan dengan suntingan yang lebih lambat daripada menambal Markdown (r2 median per ronde 0,86-1,89); tidak memenuhi target r2 protokol.
3. Pasang skill `gsp-studio-write` (draf `docs/hermes-skills/gsp-studio-write/`) bila go-live; tanpa skill, biaya adaptasi r6 (penalaran 3-7x) muncul kembali.
4. Pertimbangkan memuat alat Studio langsung di Hermes (tanpa jembatan tool_search) sebagai percobaan lanjutan; butuh perubahan config Hermes (keputusan USER).
5. Butir terbuka dari ronde sebelumnya: F8 (kolom label TOC kosong), S2-2r (`lastFilledBy` server), append tabel dokumen klien tanpa sumber (`SOURCE_MISSING`), PAGEREF daftar isi kosong sampai Word memperbarui medan.
