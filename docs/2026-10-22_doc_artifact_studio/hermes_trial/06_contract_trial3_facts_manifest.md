---
task_id: doc_artifact_studio
task_row: FACTS3 (D-437 decisions.md:442; daftar research/15_contract_efficiency_protocol_r3.md §8.7 butir 1-12; brief hermes_trial/06_contract_trial3_brief.md)
date: 2026-10-31
agent: data-analyst
type: data
confidence: HIGH untuk fakta sumber (dibaca langsung, baris dirujuk di §4) dan cek ulang kriteria 7 (Grep atas state.db dan state.db-wal, angka dikutip di §2); MEDIUM untuk desain kunci Q (id konkret baru ada setelah run) dan peta bab pembaruan sebagian (penempatan bab adalah pilihan Hermes)
inputs: decisions.md D-435..D-437 (:440-442); research/15 (utuh, terutama §7, §8, §9, §10, §13); brief 06 (utuh); manifest 05 (utuh, pola); contract_ab2/facts/{W,R-4,R-5,R-6,M}.md, contract_ab2/queries/Q.md, controller_ab2/answers/Q_key.md (pola); STUDIO-AGENT-GUIDE.md :2046-2089 (outline bab, pola owner); tiga laporan sumber (baca saja, utuh); state.db + state.db-wal profil gsp-master01 (Grep baca saja)
status: complete
---

# Manifest lembar fakta uji ketiga dan kunci Q (FACTS3)

## 1. Berkas

Semua berkas ditulis dengan alat Write. Tidak ada tulisan ke workspace Hermes, ke `contract_ab2/`, ke `controller_ab2/`, maupun ke repo selain manifest ini. FACTS3 tidak menulis `controller_ab3/freeze.sha256` (milik `ab3.py freeze`, protokol r3 §10 butir 1) dan tidak menulis `freeze_sources.sha256` (sesi analis tanpa shell; perintahnya ada di §7 langkah 2).

| Berkas (akar `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/`) | Pembaca | Isi ringkas | Fakta |
|---|---|---|---|
| `contract_ab3/facts/W.md` | Hermes (run W) | Salinan isi `contract_ab2/facts/W.md` (LF, satu baris baru di akhir, satu-satunya karakter non-ASCII `§`). Sha wajib = D-404 `884dc89f...9138`, dicek controller (§7 langkah 3) | 14 (W-F01..W-F14), tidak dinilai |
| `contract_ab3/facts/R-7.md` | Hermes (R7B, R7A) | Verifikasi custodian + promosi wiki tiga objek vault VCTL-1007, `gsp-librarian`, `t_469ed5fe`; recheck pin, tambalan ber-guard, putusan KD-2, promote + postproof PASS 15/15; complete | 47 (R7-F01..R7-F47) |
| `contract_ab3/facts/R-8.md` | Hermes (R8A, R8B) | Verifikasi rilis S7 deck DECK-HTMLPDF-1015, `gsp-thinker` (peran gsp-verifier), `t_b2945d79`; CHECK 1-18; vonis gerbang G-R1..G-R8; P-1/P-2; VERDICT FAIL; needs-review (dari sumber) | 48 (R8-F01..R8-F48) |
| `contract_ab3/facts/R-9.md` | Hermes (R9B, R9A) | Countersign akhir byte FINAL v2.2 RAFIF-REVB-1010, `gsp-worker` (peran gsp-verifier), `t_0053d245`; CHECK 1-6; putusan controller; penanda kedua VONIS RATIFIKASI (rekomendasi, menunggu USER); complete; rujukan bukti ke R-7 [skenario] | 43 (R9-F01..R9-F43) |
| `contract_ab3/facts/M.md` | Hermes (run M) | Turunan `contract_ab2/facts/M.md`: hanya nilai owner `gsp-librarian` diganti `gsp-skill-manager` (baris 9 dan 15; §3.3). Isi lain byte-sama | 9 (M-F01..M-F09), tidak dinilai KE-1..KE-7 |
| `contract_ab3/queries/Q.md` | Hermes (sesi Q saja) | Q1..Q5 misi ab3; ruang cari arm A r7a/r8a/r9a (w/m/r7b/r8b/r9b dikecualikan); urutan arm; penanda `trial-log qmark START\|END <Q> <arm>` mengikuti brief 06 §8 | 5 kueri |
| `controller_ab3/answers/Q_key.md` | Controller saja | Kunci simbolik, ruang kunci arm B 5 dokumen, aturan penyelesaian mekanis, normalisasi, presisi/recall/correct, `expected_sha256`, urutan `Q_key_resolved.md` lalu `freeze --force` | - |

Jumlah fakta lawan acuan D-404 (48/48/40, pita ±15% = 41-55 / 41-55 / 34-46): R-7 47 (-2,1%), R-8 48 (0,0%), R-9 43 (+7,5%). Ketiganya dalam pita.

| Lembar | F-awal | F-upd1 | F-upd2 | Total |
|---|---|---|---|---|
| R-7 | 14 (F01-F14) | 18 (F15-F32) | 15 (F33-F47) | 47 |
| R-8 | 14 (F01-F14) | 21 (F15-F35) | 13 (F36-F48) | 48 |
| R-9 | 13 (F01-F13) | 15 (F14-F28) | 15 (F29-F43) | 43 |

Format lembar: daftar bernomor polos dengan id fakta, kelompok `F-awal` / `F-upd1` / `F-upd2`, tanpa judul atau kepala laporan asli, bukan MD laporan dan bukan JSON. Status dalam bahasa biasa; pemetaan ke enum dibiarkan ke Hermes (KE-6). Kalimat "Cara pakai" identik dengan lembar 04/05. Lembar R hanya memakai ASCII (karakter `§` dan tanda pisah sumber ditulis ulang, mis. "bagian 10", "U+00A7").

Penyesuaian C-11 (pola manifest 05 §1): lembar menyebut kode misi (VCTL-1007, DECK-HTMLPDF-1015, RAFIF-REVB-1010) dan subfolder relatif (`lib/`, `verification/`), tanpa folder misi bertanggal sumber dan tanpa nama berkas laporan sumber (`LAPORAN-LIB2.md`, `laporan-verifikasi.md`, `laporan.md`). Satu penyimpangan: label tugas R9-F01 `CSIGN-REVB-v22` sama dengan nama subfolder sumber (preseden R4-F04 `e1_sub_purge`); label ini judul kerja laporan (`:2`, `:11`) dan tidak dapat dibuang tanpa menghilangkan identitas pekerjaan (RK3F-7).

### 1.1 Peta bab pembaruan sebagian (protokol r3 §8.7 butir 3)

Bab mengikuti outline `agentWorkReport`: 1 Ringkasan, 2 Rincian kerja, 3 Bukti, 4 Isu terbuka, 5 Langkah berikut, ditambah slot `record` (STUDIO-AGENT-GUIDE.md :2055-2056). Peta ini adalah niat desain untuk analisis U-16. Penempatan nyata adalah pilihan Hermes (KE-6), jadi peta tidak dipakai sebagai kunci.

| Lembar | Kelompok | Bagian yang diniatkan berubah | Bagian yang diniatkan tetap |
|---|---|---|---|
| R-7 | F-upd1 | `record` (status butir), bab 2 (verdict, recheck, tambalan, KD-2), bab 3 (skrip ukur, nilai pin) | bab 1, bab 4, bab 5 |
| R-7 | F-upd2 | `record` (status butir, status laporan), bab 1 (rantai penuh), bab 3 (commit, postproof), bab 4 (blocker, pekerjaan terbuka), bab 5 | bab 2 |
| R-8 | F-upd1 | `record` (status butir), bab 2 dan bab 3 (CHECK 1-18) | bab 1, bab 4, bab 5 |
| R-8 | F-upd2 | `record` (status butir, status laporan, vonis), bab 1 (vonis per gerbang), bab 4 (temuan lintas, P-1/P-2), bab 5 | bab 2, bab 3 |
| R-9 | F-upd1 | `record` (status butir), bab 2 dan bab 3 (CHECK 1-5) | bab 1, bab 4, bab 5 |
| R-9 | F-upd2 | `record` (status butir, status laporan), bab 1 (vonis ratifikasi), bab 3 (CHECK 6), bab 4 (catatan monitoring, pitfall), bab 5 | bab 2 |

## 2. Cek ulang kriteria 7 (§8.7 butir 1)

Dijalankan analis tepat sebelum menulis lembar, dengan alat Grep (ripgrep, mode hitung baris) atas path berkas langsung `C:/Users/TRIAL/AppData/Local/hermes/profiles/gsp-master01/state.db` dan `state.db-wal`.

| Pola | state.db | state.db-wal | Keputusan |
|---|---|---|---|
| Kontrol positif `t_c6721813` | 210 | - | Grep membaca isi biner (sama dengan protokol r3 §8.5) |
| Kontrol isi WAL `session\|tool_calls` | - | 757 | WAL terbaca (protokol: 783; WAL berubah sejak R3-02) |
| Utama gabungan: `LAPORAN-LIB2\|t_469ed5fe\|CSIGN-REVB-v22\|t_0053d245\|t_b2945d79\|smart-deck-htmlpdf.{1,3}verification.{1,3}laporan-verifikasi` | **0** | **0** | R-7, R-8, R-9 utama lolos; cadangan tidak dipakai |
| Sekunder `t_e396fce0` (induk R-7) | 4 | 0 | Informatif. Protokol r3 §8.3 mencatat 1. Konteks (`-o`): kartu proposal rak knowledge gsp-librarian di laporan sesi misi katalog chart ("proposa promosi rak knowledge sudah di tangan gsp-librarian (`t_e396fce0`)"), bukan isi laporan R-7 |
| Sekunder `t_03e9621d`, `t_3c8be3eb`, `t_8da0412d` (R-9) | 0 / 0 / 0 | 0 | - |
| Tingkat misi `VCTL-1007\|vctl-1007` | 124 | 0 | Risiko sisa RK3F-1 (sama dengan protokol) |
| Tingkat misi `smart-deck-htmlpdf\|DECK-HTMLPDF` | 12 | 0 | Risiko sisa RK3F-1 |
| Tingkat misi `rafif-revb-1010\|RAFIF-REVB` | 295 | 0 | Risiko sisa RK3F-1 |
| Misi uji `hermes-contract-ab3` (gabung dengan pola misi di atas) | - | 0 | Belum ada jejak misi ab3 di WAL |
| Istilah Q3 `(?i)skyhop` | 241 | 0 | Kosakata misi rafif dikenal profil (RK3F-4); bukan kriteria 7 |
| Pin Q5 kandidat: `5a3299573e481323` (docx) / `b860153546765629` (katalog) / `b7966d276136ce74` (pdf) / `4cf5216f5953937b` (manifest) | 7 / 5 / 6 / **0** | 0 | Pin manifest dipilih sebagai target Q5 (§6) |

Kriteria 7 (basename atau path berkualifikasi + cardId utama = 0) lolos untuk ketiga kandidat utama protokol r3 §8.3. Tidak ada penggantian ke cadangan.

Kriteria lain terhadap §8.2 (dicatat apa adanya):
- K1, K2: ketiganya laporan kerja nyata bertanggal 2026-10-08, 2026-10-15, 2026-10-11, bukan misi uji 1/2 dan bukan misi sumber R-4..R-6; alurnya (promosi wiki, verifikasi deck, countersign manual) tidak sama dengan R-1..R-6.
- K3: peran setara terpenuhi (pelaksana pendek; verifier dengan CHECK + VERDICT; laporan panjang dengan beberapa kartu dan dua penanda status). Ragam kepala "kv satu baris" hilang (protokol §8.3): R-7 dan R-9 berkepala frontmatter, R-8 daftar kv tanpa STATUS di kepala.
- K4: R-7 61 baris (pita ~50, +22%), R-8 62 baris (pita ~80, -22,5%), R-9 286 baris (pita ~250, +14%). Jumlah fakta tetap dalam pita.
- K5: cardId berpola, owner lolos pola `huruf kecil, angka, . _ -` (guide :2088), istilah unik Q3, nilai sha16 Q5 tersedia.
- K6: owner ketiga lembar berbeda (gsp-librarian, gsp-thinker, gsp-worker), jadi kunci Q4 tunggal. Bagian "sebaiknya berbeda dari slot lama" tidak terpenuhi: owner R-8 = owner R-5, owner R-9 = owner R-6 (protokol §8.3 sudah mencatatnya).

## 3. Fakta "tidak ada di sumber", fakta [skenario], dan keputusan M

### 3.1 Fakta "tidak ada di sumber" (jenis `absen`, ditulis sebagai fakta tersendiri)

- R-7 (6): jam penulisan laporan dan jam selesai keseluruhan (R7-F06); id sesi dan jam iterasi-2 (R7-F19); nilai md5 backup (R7-F41); seksi langkah berikut eksplisit (R7-F44); cid (R7-F45); ukuran/sha laporan (R7-F46).
- R-8 (4): nama lengkap berkas raw RAB dan Proposal, yang di sumber terpotong "..." (R8-F10); nomor kartu FIX P-2 dan hasil putusan P-1 (R8-F44); cid dan commit (R8-F47); ukuran/sha laporan (R8-F48).
- R-9 (4): jam mulai/selesai run (R9-F08); hasil vonis ratifikasi USER L3 (R9-F40); cid dan commit (R9-F41); ukuran/sha laporan dan sha256 penuh keempat artefak (R9-F42).
- Sebagian absen di fakta non-absen: R7-F38 (tidak ada baris VERDICT menyeluruh; jenis `manual`, pola R4-F39).

### 3.2 Fakta [skenario] (ketentuan uji, bukan isi sumber)

- initiator `gsp-master01` (R7-F03, R8-F04, R9-F04; brief 06 §5).
- Waktu lapor = jam mesin +07:00 (R7-F05, R8-F06, R9-F07).
- Status butir dan status laporan S1/S2 (R7-F13..F15, R8-F13..F15, R9-F12..F14), karena sumber hanya memuat keadaan akhir.
- Kode butir kerja R7-B*, R8-B*, R9-B* adalah pengelompokan analis atas seksi sumber (pola R4-B*); tidak diberi label [skenario] agar setara dengan lembar 04/05.
- Status penutupan R-8 = `needs-review` dari sumber `:62` (BUKAN skenario, protokol §8.7 butir 5).
- Status penutupan R-9 = complete dari kepala `:5`; penanda kedua "VONIS RATIFIKASI: PASS (sebagai REKOMENDASI)" + ratifikasi menunggu USER sebagai fakta terpisah R9-F36 (pola D-406 / R6-F34-F35).
- Owner R-9 = `gsp-worker` (R9-F04), peran gsp-verifier fakta terpisah (R9-F05). Owner R-8 = `gsp-thinker`, peran di R8-F05.
- Rujukan R-9 ke R-7 (R9-F43, R7-F47) untuk Q5. Nilai = pin sha16 manifest `4cf5216f5953937b` dari sumber R-7 `:34`. Protokol §8.7 butir 5 menyebut "salah satu pin sha16 `:34`". Pin manifest dipilih karena satu-satunya dari empat pin dengan 0 kemunculan di `state.db` (§2), dan hanya muncul di satu fakta isi (R7-F20). Alasan rujukan (contoh pola ukur ulang pin sebelum vonis) adalah rekaan skenario.

### 3.3 Keputusan M (protokol r3 §8.6)

- R-7 utama berowner `gsp-librarian` = owner M lama, jadi M tidak sah dipakai ulang byte-identik.
- Owner pengganti: `gsp-skill-manager`. Alasan: lolos pola owner (guide :2088); 0 kemunculan di ketiga sumber (Grep) dan di lembar R ab3 (§7 langkah 6); berbeda dari owner R-7..R-9, owner W (`gsp-worker-fast`), dan owner slot lama (`gsp-system-manager` R-3/R-4). Usulan protokol `gsp-custodian` ditolak karena muncul di lembar R-7 (R7-F12, profil custodian yang di-dispatch), sehingga melanggar syarat "dicek tidak muncul di lembar R".
- Cakupan penggantian: nilai owner muncul di DUA baris lembar M lama, yaitu `:9` (M-F03 "Pelaksana (owner): gsp-librarian") dan `:15` (M-F06 "Owner laporan tetap gsp-librarian"). Keduanya diganti agar lembar konsisten dan `gsp-librarian` tidak tersisa di M. Ini tafsir analis atas "hanya baris owner"; controller mencatatnya sebagai keputusan (RK3F-3). Diff yang diharapkan: `9c9` dan `15c15`, tidak ada baris lain.
- Tetap: kartu `t_0c0d0e0f`, status penutupan `needs-review`, `docKey` `lapkerja-m`, agentId kedua `hermes-gsp-verifier01` (brief). Baris 1 M masih menyebut misi ab2 (RK3F-2).

## 4. Jejak fakta ke sumber (untuk cek KF dan audit; tidak diberikan ke Hermes)

Path relatif `C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/`.

| Lembar | Fakta: baris sumber |
|---|---|
| R-7 `2026-10-08_vctl-1007-lib2/lib/LAPORAN-LIB2.md` | F01 `:2`,`:14`; F02 `:6`; F03 `:4`; F04 `:58-59`, path; F05 `:3`; F06 absen (`:3` hanya tanggal; jam sesi `:26`); F07 `:7`; F08 `:18`; F09 `:19`; F10 `:20`; F11 pengelompokan §2-§6 `:24-54`; F12 `:26`; F13-F15 skenario; F16 `:16-20`,`:26`; F17 `:28`; F18 `:27`,`:18-20`; F19 absen (`:27` "sesi baru" tanpa id/jam); F20 `:34`; F21 `:34`; F22 `:35`; F23 `:36`; F24 `:37`; F25 `:41`; F26 `:42`; F27 `:43`; F28 `:44`; F29 `:39`,`:45`; F30 `:47`,`:49`; F31 `:49`; F32 `:49`; F33 keadaan akhir `:14`,`:58`; F34 `:14`,`:22`; F35 `:53`; F36 `:54`; F37 `:51`; F38 `:14` + seluruh berkas tanpa VERDICT; F39 `:5`,`:58`; F40 `:60`; F41 `:60` (nilai tidak ada); F42 `:61`; F43 `:61`; F44 seluruh berkas; F45 seluruh berkas; F46 seluruh berkas; F47 skenario (nilai `:34`) |
| R-8 `2026-10-15_smart-deck-htmlpdf/verification/laporan-verifikasi.md` | F01 `:1`,`:4`,`:23`; F02 `:1`,`:7`, path; F03 `:1`; F04 `:3`; F05 `:3`; F06 `:4`; F07 `:5`; F08 `:5`; F09 `:6`; F10 absen (`:6` terpotong "..."); F11 `:7`; F12 pengelompokan `:9-62`; F13-F15 skenario; F16 `:27`; F17 `:28`; F18 `:29`; F19 `:30`; F20 `:31`; F21 `:32`; F22 `:33`; F23 `:34`; F24 `:35`; F25 `:35`; F26 `:36`; F27 `:36`; F28 `:37`; F29 `:38`; F30 `:39`; F31 `:40`; F32 `:41`; F33 `:42`,`:19`; F34 `:43`; F35 `:44`,`:21`; F36 keadaan akhir; F37 `:11-21`; F38 `:48`; F39 `:49`; F40 `:50`; F41 `:51`; F42 `:55`; F43 `:56`; F44 seluruh berkas; F45 `:23`,`:60`; F46 `:62`; F47 seluruh berkas; F48 seluruh berkas |
| R-9 `2026-10-10-rafif-revb-1010/verification/CSIGN-REVB-v22/laporan.md` | F01 `:2`,`:11`,`:15`; F02 path `:261-262`; F03 `:6`; F04 `:4`; F05 `:4`; F06 `:7`,`:15-19`; F07 `:3`; F08 absen (`:3` tanpa jam; `:280`); F09 `:20-22`; F10 `:7`,`:24-27`; F11 pengelompokan CHECK 1-6 `:29-257`; F12-F14 skenario; F15 `:29-40`; F16 `:42-43`; F17 `:50-56`; F18 `:58-70`; F19 `:72-80`; F20 `:84-92`; F21 `:91`,`:101`; F22 `:94-97`; F23 `:97-103`; F24 `:107-111`; F25 `:113-139`; F26 `:143-147`; F27 `:148-154`; F28 `:155-163`; F29 keadaan akhir; F30 `:165-191`,`:249-250`; F31 `:167-169`; F32 `:196-203`; F33 `:215-220`; F34 `:222-229`; F35 `:231-235`; F36 `:252-257`; F37 `:5`; F38 `:275`,`:280`; F39 `:282-286`; F40 absen (`:256`, `:276` menyebut menunggu USER); F41 seluruh berkas; F42 `:35-40` (hanya sha16 + ukuran), seluruh berkas; F43 skenario (nilai R-7 `:34`) |

Penyederhanaan yang disengaja (rincian berikut tidak menjadi fakta, jadi tidak ditagih di KF):
- R-7: tabel vonis `:16-20` dipecah ke F08-F10, F16, F18; tidak ada seksi yang dibuang.
- R-8: CHECK 6 angka teknis Proposal (6.236 W, 536/696 port, 77,0%, 4 Mbps/1,5 Mbps) dan CHECK 8 rincian geometri/warna/footer (`:34`) diringkas; CHECK 14 parameter Chrome dan statistik non-blank (`:40`) diringkas; CHECK 18 daftar tombol/keyboard (`:44`) diringkas.
- R-9: kutipan vonis praktisi (`:58-69`), enam butir visus per id (`:113-136`), known-gap 2-8 rincian (`:170-191`, hanya DT-15 dipisah), daftar 6 URL hyperlink (`:155-160`, hanya llama.cpp), seksi VERIFIKASI-AKURASI SPK-002 (`:205-211`), rekap PENUTUP (`:237-250`), dan daftar instrumen SELESAI (`:262-271`, diringkas ke "16 berkas" R9-F02) tidak dijadikan fakta.

## 5. Tabel token KE-7 (dibekukan sebelum uji; aturan pakai sama dengan manifest 05 §5)

Aturan pakai:
- Fakta cocok bila setiap token di kolom DAN ditemukan dalam teks yang dinormalisasi (NFC, spasi diringkas, `*` `` ` `` `_` dibuang, huruf kecil). Normalisasi yang sama diterapkan pada token (mis. `t_469ed5fe` dibandingkan sebagai `t469ed5fe`).
- Kolom ATAU berisi padanan sah dengan format `token => padanan1 / padanan2`. Token angka juga dicocokkan dalam bentuk digit saja; kecocokan yang hanya lewat bentuk digit diperiksa manual.
- `manual` = diperiksa pemeriksa 100%. `absen` = tidak masuk penyebut; diperiksa bahwa nilai tidak dikarang.
- Status S1/S2 [skenario] berjenis `manual`, dicek pada revisi atau langkah terkait (arm B: revisi S1/S2 lewat R20, protokol r3 §6.5).
- Token bertanda `*` juga muncul di fakta lain: kecocokannya wajib diajudikasi ke fakta yang benar.

### R-7

| fact_id | kelompok | token wajib (DAN) | token alternatif (ATAU) | jenis |
|---|---|---|---|---|
| R7-F01 | F-awal | vctl-1007*; LIB2* | - | literal |
| R7-F02 | F-awal | t_469ed5fe*; t_e396fce0 | - | literal |
| R7-F03 | F-awal | gsp-librarian*; gsp-master01 | - | literal |
| R7-F04 | F-awal | VCTL-1007*; 16 berkas | - | literal |
| R7-F05 | F-awal | 2026-10-08 | 2026-10-08 => 08-10-2026 / 8 Oktober 2026 | literal |
| R7-F06 | F-awal | - | - | absen |
| R7-F07 | F-awal | vault/vctl-1007/; 2026-10-07; hermes/wiki | - | literal |
| R7-F08 | F-awal | katalog-kanonik-chart-graph-gsp-99-entri-vctl-1007-pin-b860153546765629.md | - | literal |
| R7-F09 | F-awal | manual-komprehensif-chart-graphs-gsp-000-gsp-std-x-2026-reva-terbatas.md | - | literal |
| R7-F10 | F-awal | resep-render-datum-token-chart-gsp-74-png-manifest-seed-42-vctl-1007.md | - | literal |
| R7-F11 | F-awal | R7-B1; R7-B4 | - | literal |
| R7-F12 | F-awal | gsp-custodian; 20261008_003614_d61925; custodian-run1.log | - | literal |
| R7-F13 | F-awal | - | - | manual |
| R7-F14 | F-awal | - | - | manual |
| R7-F15 | F-upd1 | - | - | manual |
| R7-F16 | F-upd1 | - | - | manual (verdict iterasi-1 per objek) |
| R7-F17 | F-upd1 | ended_at; catatan_verifikasi | - | literal |
| R7-F18 | F-upd1 | 61+12+1=74; 18 kunci | 61+12+1=74 => 61 + 12 + 1 = 74 | angka |
| R7-F19 | F-upd1 | - | - | absen |
| R7-F20 | F-upd1 | b860153546765629*; 4cf5216f5953937b*; 5a3299573e481323; b7966d276136ce74 | - | literal |
| R7-F21 | F-upd1 | 2.120 baris; above 30; L135 | 2.120 => 2120 | literal |
| R7-F22 | F-upd1 | fda8c03a158bc058; 74/74 | - | literal |
| R7-F23 | F-upd1 | VC=61; AP=12; HOL brs | VC=61 => VC 61; AP=12 => AP 12 | literal |
| R7-F24 | F-upd1 | coord-sample.py; seed-11; out-of-range | - | literal |
| R7-F25 | F-upd1 | revise-iter1.py*; LEGACY-THRESHOLD kelas WARISAN; Census keluarga | - | literal |
| R7-F26 | F-upd1 | VC-01; VC-05; CHECK-B | - | literal |
| R7-F27 | F-upd1 | CRLF; parse_fm; body-sym-check2.py | - | literal |
| R7-F28 | F-upd1 | yaml.safe_load; U+00A7; md5 body grup-2 | - | literal |
| R7-F29 | F-upd1 | mark-ditininjau.py; keputusan-promosi* | - | literal |
| R7-F30 | F-upd1 | 50 ASUMSI; known-defect | - | literal |
| R7-F31 | F-upd1 | R1/R2; approval-ref | - | literal |
| R7-F32 | F-upd1 | VCTL-V3 | - | literal |
| R7-F33 | F-upd2 | - | - | manual |
| R7-F34 | F-upd2 | c42ba95; 257a003; 299f39b | - | literal |
| R7-F35 | F-upd2 | di-attest-oleh; dipromosikan | - | literal |
| R7-F36 | F-upd2 | total_entries=865; own=3/3; VSSKB | total_entries=865 => total_entries 865 | literal |
| R7-F37 | F-upd2 | 15/15*; postproof-output.txt | - | literal |
| R7-F38 | F-upd2 | - | - | manual (rantai penuh; tidak ada VERDICT menyeluruh yang dikarang) |
| R7-F39 | F-upd2 | complete | complete => selesai | literal |
| R7-F40 | F-upd2 | backup-iter1 | - | literal |
| R7-F41 | F-upd2 | - | - | absen |
| R7-F42 | F-upd2 | - | - | manual (blocker tidak ada) |
| R7-F43 | F-upd2 | Register Induk; KD-2* | - | literal |
| R7-F44 | F-upd2 | - | - | absen |
| R7-F45 | F-upd2 | - | - | absen |
| R7-F46 | F-upd2 | - | - | absen |
| R7-F47 | F-upd2 | 4cf5216f5953937b* | - | literal (dicek di bagian bukti) |

R-7 ringkas: literal 33, angka 1, manual 7, absen 6. Penyebut KF bertoken = 41.

### R-8

| fact_id | kelompok | token wajib (DAN) | token alternatif (ATAU) | jenis |
|---|---|---|---|---|
| R8-F01 | F-awal | S7; PRESISI-HASIL | - | literal |
| R8-F02 | F-awal | DECK-HTMLPDF-1015; verification/render | - | literal |
| R8-F03 | F-awal | t_b2945d79 | - | literal |
| R8-F04 | F-awal | gsp-thinker*; gsp-master01 | - | literal |
| R8-F05 | F-awal | gsp-verifier; gsp-worker-fast | - | literal |
| R8-F06 | F-awal | 2026-10-15; 22:00-22:25 | 2026-10-15 => 15-10-2026 / 15 Oktober 2026; 22:00-22:25 => 22.00-22.25 / 22:00 - 22:25 | literal |
| R8-F07 | F-awal | 39c4b3bff2aabc7f; 5c0134edf6d3824b; 82.311 | 82.311 => 82311 | literal |
| R8-F08 | F-awal | 960x540*; 338,7 | 960x540 => 960 x 540; 338,7 => 338.7 | literal |
| R8-F09 | F-awal | kendali-konten-v1; entri_tanpa_pola_uji=0 | - | literal |
| R8-F10 | F-awal | - | - | absen |
| R8-F11 | F-awal | python 3.11.15; openpyxl | - | literal |
| R8-F12 | F-awal | R8-B1; R8-B4 | - | literal |
| R8-F13 | F-awal | - | - | manual |
| R8-F14 | F-awal | - | - | manual |
| R8-F15 | F-upd1 | - | - | manual |
| R8-F16 | F-upd1 | 84 PASS; wajib_muncul | - | literal |
| R8-F17 | F-upd1 | gr1-placement.json | - | literal |
| R8-F18 | F-upd1 | mencegah ledakan*; D-14* | - | literal |
| R8-F19 | F-upd1 | 34.559.461.000; 4.954.890.710*; 49.999.351.710* | bentuk digit saja | angka |
| R8-F20 | F-upd1 | 6.441.668.000; rab-items.json | 6.441.668.000 => 6441668000 | literal |
| R8-F21 | F-upd1 | 5.973; C92; 17.800 | 5.973 => 5973; 17.800 => 17800 | literal |
| R8-F22 | F-upd1 | 31,7; baris 524 | 31,7 => 31.7 | literal |
| R8-F23 | F-upd1 | K17; palet 9 warna | - | literal |
| R8-F24 | F-upd1 | html:937; halaman 15* | - | literal |
| R8-F25 | F-upd1 | html:403; pdftotext | - | literal |
| R8-F26 | F-upd1 | 7,27pt; 8,48pt; 6,8pt | 7,27pt => 7,27 pt / 7.27pt; 8,48pt => 8,48 pt / 8.48pt; 6,8pt => 6,8 pt / 6.8pt | literal |
| R8-F27 | F-upd1 | raster-p18-150.png; tesseract | - | literal |
| R8-F28 | F-upd1 | hasil-scan.txt; 410/419; 317/326 | - | literal |
| R8-F29 | F-upd1 | C-9a; 2,2/1000 | 2,2/1000 => 2.2/1000 | literal |
| R8-F30 | F-upd1 | BASE-B; BASE-C; C-8b | - | literal |
| R8-F31 | F-upd1 | nav-lb5.png; 132.784 | 132.784 => 132784 | literal |
| R8-F32 | F-upd1 | TIDAK UNTUK DIEDARKAN; 19/19* | - | literal |
| R8-F33 | F-upd1 | saradan; 7/7 | - | literal |
| R8-F34 | F-upd1 | 65.366.315.300; 90 hari kalender | 65.366.315.300 => 65366315300 | literal |
| R8-F35 | F-upd1 | 1149-1308; hash routing | - | literal |
| R8-F36 | F-upd2 | - | - | manual |
| R8-F37 | F-upd2 | 17/18; G-R8* | - | literal |
| R8-F38 | F-upd2 | data-detail; detail-pop | - | literal |
| R8-F39 | F-upd2 | ubin ghost | - | literal |
| R8-F40 | F-upd2 | gsp-verification-before-completion | - | literal |
| R8-F41 | F-upd2 | GSP/RAB/IX/2026 | - | literal |
| R8-F42 | F-upd2 | P-1*; bullet-slide | - | literal |
| R8-F43 | F-upd2 | P-2*; perakit S5 | - | literal |
| R8-F44 | F-upd2 | - | - | absen |
| R8-F45 | F-upd2 | - | - | manual (vonis FAIL: medan verdict record arm B / teks vonis arm A) |
| R8-F46 | F-upd2 | needs-review | needs-review => butuh tinjauan / perlu tinjauan | literal |
| R8-F47 | F-upd2 | - | - | absen |
| R8-F48 | F-upd2 | - | - | absen |

R-8 ringkas: literal 38, angka 1, manual 5, absen 4. Penyebut KF bertoken = 44.

### R-9

| fact_id | kelompok | token wajib (DAN) | token alternatif (ATAU) | jenis |
|---|---|---|---|---|
| R9-F01 | F-awal | CSIGN-REVB-v22; pin-final-v22.json | - | literal |
| R9-F02 | F-awal | RAFIF-REVB-1010; csignfinal* | - | literal |
| R9-F03 | F-awal | t_0053d245 | - | literal |
| R9-F04 | F-awal | gsp-worker; gsp-master01 | - | literal |
| R9-F05 | F-awal | gsp-verifier | - | literal |
| R9-F06 | F-awal | t_03e9621d; t_3c8be3eb; t_8da0412d | - | literal |
| R9-F07 | F-awal | 2026-10-11 | 2026-10-11 => 11-10-2026 / 11 Oktober 2026 | literal |
| R9-F08 | F-awal | - | - | absen |
| R9-F09 | F-awal | blok-lipat-ganda*; L3* | - | literal |
| R9-F10 | F-awal | 4010; 60 figurb | - | literal |
| R9-F11 | F-awal | R9-B1; R9-B4 | - | literal |
| R9-F12 | F-awal | - | - | manual |
| R9-F13 | F-awal | - | - | manual |
| R9-F14 | F-upd1 | - | - | manual |
| R9-F15 | F-upd1 | 977762a3c40b13c5*; 1c9c4171b2b291a0*; 10.142.292 | 10.142.292 => 10142292 | literal |
| R9-F16 | F-upd1 | G19.2.png; FIXR3-B* | - | literal |
| R9-F17 | F-upd1 | 9,45; 174 kalimat; 212 kalimat | 9,45 => 9.45 | literal |
| R9-F18 | F-upd1 | 28/28; 8/8* | - | literal |
| R9-F19 | F-upd1 | Rev BTERBATAS; PENUTUP | - | literal |
| R9-F20 | F-upd1 | 70/70/0; 89/70/19 | - | angka |
| R9-F21 | F-upd1 | Skyhop*; halaman 41* | - | literal |
| R9-F22 | F-upd1 | BOBOT BEKU; DERIVASI TAGIHAN | - | literal |
| R9-F23 | F-upd1 | cf2b; halaman 42 | - | literal |
| R9-F24 | F-upd1 | ambang-100; sidecar | - | literal |
| R9-F25 | F-upd1 | Permintaan dikirim; RPM; G18.3* | - | literal |
| R9-F26 | F-upd1 | 704 | - | angka |
| R9-F27 | F-upd1 | REGISTER-ONLY*; host buku; 11906x16838 | - | literal |
| R9-F28 | F-upd1 | HTTP 415*; v0.6.0 | - | literal |
| R9-F29 | F-upd2 | - | - | manual |
| R9-F30 | F-upd2 | DT-15*; resample-media-cetak | - | literal |
| R9-F31 | F-upd2 | CVE-2025-32711; 72,4 | 72,4 => 72.4 | literal |
| R9-F32 | F-upd2 | S-1077/S-744; title_hit | - | literal |
| R9-F33 | F-upd2 | chrome-span-merge; 30 lawan 14 | - | literal |
| R9-F34 | F-upd2 | 120-135; 106-107 | - | literal |
| R9-F35 | F-upd2 | SEED-LOG | - | literal |
| R9-F36 | F-upd2 | VONIS RATIFIKASI; REKOMENDASI* | - | literal |
| R9-F37 | F-upd2 | complete | complete => selesai | literal |
| R9-F38 | F-upd2 | 6 butir lunas | - | literal |
| R9-F39 | F-upd2 | register fleet | - | literal |
| R9-F40 | F-upd2 | - | - | absen |
| R9-F41 | F-upd2 | - | - | absen |
| R9-F42 | F-upd2 | - | - | absen |
| R9-F43 | F-upd2 | - | - | manual (arm B: entri `refs[]` record ke blok R7B; arm A: rujukan teks ke baris R7A; nilai `4cf5216f5953937b` boleh tertulis) |

R-9 ringkas: literal 32, angka 2, manual 5, absen 4. Penyebut KF bertoken = 39.

W dan M tidak dinilai KE-7 (W pemanasan; M uji dua agen), jadi tidak diberi token.

## 6. Desain Q1..Q5 (rinci di `controller_ab3/answers/Q_key.md`)

| Q | Kueri | Kunci diniatkan arm A | Kunci diniatkan arm B | Fakta penopang |
|---|---|---|---|---|
| Q1 | status laporan kartu `t_0053d245` di misi ab3 | berkas laporan r9a; status selesai/complete | `lapkerja-r9b`; `complete` | R9-F03, R9-F37 |
| Q2 | laporan berstatus complete di misi ab3 | laporan r7a, r9a | `lapkerja-r7b`, `-r9b`; `lapkerja-r8b` (needs-review, R8-F46), `lapkerja-w` (blocked, W-F12), `lapkerja-m` (needs-review, M-F08) keluar | R7-F39, R9-F37 |
| Q3 | paragraf memuat istilah `Skyhop` | baris di laporan r9a yang memuatnya | blok `lapkerja-r9b` yang memuatnya | R9-F21, R9-F22, R9-F23 |
| Q4 | laporan owner `gsp-thinker` di misi ab3 | laporan r8a | `lapkerja-r8b` | R8-F04 |
| Q5 | bagian bukti yang dirujuk laporan `t_0053d245` | baris laporan r7a bermuatan `4cf5216f5953937b` yang ditunjuk r9a | `lapkerja-r7b#pid` dari `refs[]` `lapkerja-r9b` | R9-F43, R7-F47, R7-F20 |

Pemilihan istilah Q3. `Skyhop` dipilih karena: (a) hanya muncul di lembar R-9, tepat 3 baris fakta (Grep `(?i)\bskyhop\b` atas `contract_ab3/facts/`: R-9.md :30, :31, :32; W, M, R-7, R-8 = 0), setara dengan 3 fakta istilah Q3 lama (`PARKED`); (b) satu token tanpa titik, garis bawah, atau tanda hubung, sehingga aman untuk R22 konfigurasi `simple`; (c) nama diri, jadi kecil kemungkinan dialihbahasakan. Kandidat yang ditolak: `BTERBATAS` (1 fakta saja, artefak ekstraksi), `EchoLeak` (1 fakta), `chrome-span-merge` (tanda hubung, pemecahan token R22 tidak pasti), `countersign` (terlalu banyak fakta), `VERIFR3` (2 fakta). Kunci Q3 tidak peka huruf (sama dengan Q_key 05).

Pemilihan pin Q5. Pin manifest `4cf5216f5953937b` (lihat §3.2). Grep atas lembar: R-7.md :29 (R7-F20) dan :59 (R7-F47, skenario), R-9.md :55 (R9-F43); tidak ada di W, M, R-8.

Pemeriksaan silang lembar (Grep atas `contract_ab3/facts/`, keluaran §7 langkah 6): `gsp-thinker` hanya di R-8 (:10, :11); `t_0053d245` hanya di R-9 (:9); kata utuh `complete` hanya di R-7 :51 dan R-9 :49 (fakta status penutupan), tidak ada di R-8, W, M; `gsp-librarian` di R-7 (:9, :46, :47) dan R-9 :55 (rujukan skenario), 0 di M. Urutan aman untuk Q5: R7B (order 1) mendahului R9B (order 5), dan R7A (order 2) mendahului R9A (order 6), sehingga rujukan tidak kena `422 CONTRACT_REF_NOT_FOUND`.

Penanda `qmark` di Q.md memakai bentuk brief 06 §8 (`trial-log qmark START Q1 A`), bukan bentuk Q.md 05 (`qmark <Q><arm> START|END`), agar Q.md tidak bertentangan dengan brief yang berlaku. Bentuk persis tetap ditentukan HARNESS3; bila berbeda, baris penyelaras R3-04 menyamakan keduanya sebelum freeze.

Kunci dinilai terhadap keadaan TERSIMPAN sesudah run M dan dry-run R08, sebelum sesi Q. Dokumen misi ab dan ab2 tidak masuk ruang kunci.

## 7. Instruksi controller (perintah yang harus dijalankan; Git Bash)

1. Cek kriteria 7 versi shell, untuk catatan di `decisions.md` (analis sudah menjalankannya dengan Grep; hasil di §2):
   ```
   cd C:/Users/TRIAL/AppData/Local/hermes/profiles/gsp-master01 && for t in LAPORAN-LIB2 CSIGN-REVB-v22 t_469ed5fe t_b2945d79 t_0053d245 t_e396fce0 t_03e9621d t_3c8be3eb t_8da0412d t_c6721813; do printf '%s ' "$t"; cat state.db state.db-wal | grep -a -c -F -- "$t"; done; cat state.db state.db-wal | grep -a -c -E 'smart-deck-htmlpdf.{1,3}verification.{1,3}laporan-verifikasi'
   ```
   Diharapkan: `LAPORAN-LIB2`, `CSIGN-REVB-v22`, `t_469ed5fe`, `t_b2945d79`, `t_0053d245`, pola path smart-deck = 0; `t_e396fce0` > 0 (analis: 4, sekunder, informatif); tiga kartu sekunder R-9 = 0; kontrol `t_c6721813` > 0 (analis: 210). Bila salah satu nilai utama > 0, lembar slot itu tidak sah: pakai cadangan protokol r3 §8.4 dan luncurkan ulang FACTS3 untuk slot itu.
2. Bekukan tiga laporan sumber (path absolut, protokol r3 §8.7 butir 2), lalu catat sha di `decisions.md`:
   ```
   sha256sum C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/2026-10-08_vctl-1007-lib2/lib/LAPORAN-LIB2.md C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/2026-10-15_smart-deck-htmlpdf/verification/laporan-verifikasi.md C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/2026-10-10-rafif-revb-1010/verification/CSIGN-REVB-v22/laporan.md > C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/controller_ab3/freeze_sources.sha256 && sha256sum -c C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/controller_ab3/freeze_sources.sha256
   ```
3. Bukti byte-identik W:
   ```
   cd C:/Users/TRIAL/AppData/Local/Temp/hermes_trial && sha256sum contract_ab2/facts/W.md contract_ab3/facts/W.md && cmp contract_ab2/facts/W.md contract_ab3/facts/W.md && echo W_IDENTIK
   ```
   Keduanya wajib `884dc89f...9138` dan `W_IDENTIK` tercetak. Bila berbeda (mis. akibat penulisan alat Write): `cp contract_ab2/facts/W.md contract_ab3/facts/W.md`, lalu ulangi.
4. Bukti turunan M (hanya nilai owner yang berubah):
   ```
   cd C:/Users/TRIAL/AppData/Local/Temp/hermes_trial && diff contract_ab2/facts/M.md contract_ab3/facts/M.md; sha256sum contract_ab3/facts/M.md
   ```
   Diharapkan: diff hanya `9c9` dan `15c15` (`gsp-librarian` menjadi `gsp-skill-manager`). Catat sha M baru dan keputusan M (§3.3) di `decisions.md` (P3-9). Bila ada baris lain berbeda: salin M lama lalu ganti dua kemunculan itu dengan `sed -i 's/gsp-librarian/gsp-skill-manager/g' contract_ab3/facts/M.md`, lalu ulangi.
5. Daftar berkas untuk freeze baku (ditulis HANYA oleh `ab3.py freeze`, protokol r3 §10 butir 2; FACTS3 tidak menulisnya):
   - `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/contract_ab3/facts/W.md`
   - `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/contract_ab3/facts/R-7.md`
   - `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/contract_ab3/facts/R-8.md`
   - `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/contract_ab3/facts/R-9.md`
   - `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/contract_ab3/facts/M.md`
   - `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/contract_ab3/queries/Q.md`
   - `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/controller_ab3/answers/Q_key.md`
   - ditambah berkas alat milik HARNESS3: `harness_ab3/ab3.py`, `harness_ab3/bin/trial-log`, `harness_ab3/bin/trial-log.cmd`.

   Uji sebelum W (protokol r3 §10 butir 8): `ab3.py freeze --check` exit 0 dan `sha256sum -c C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/controller_ab3/freeze.sha256` exit 0. Bila ada berkas di daftar ini yang disunting sesudahnya (mis. penggantian tanggal misi §9.1 protokol r3), freeze ditulis ulang oleh `ab3.py freeze` dan dicatat.
6. Cek mekanis lembar:
   ```
   cd C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/contract_ab3 && grep -c -i -w Skyhop facts/*.md; grep -l gsp-thinker facts/*.md; grep -c -w complete facts/*.md; grep -l gsp-librarian facts/*.md; grep -l gsp-skill-manager facts/*.md; grep -c -F 4cf5216f5953937b facts/*.md; grep -c -E '^[0-9]+\. [A-Z0-9]+-F[0-9]+' facts/*.md; grep -c $'\r' facts/*.md queries/Q.md ../controller_ab3/answers/Q_key.md; LC_ALL=C grep -c -P '[^\x00-\x7F]' facts/*.md queries/Q.md
   ```
   Diharapkan: Skyhop R-9 = 3, lainnya 0; `gsp-thinker` hanya `facts/R-8.md`; `complete` R-7 = 1, R-9 = 1, lainnya 0; `gsp-librarian` hanya `facts/R-7.md` dan `facts/R-9.md`; `gsp-skill-manager` hanya `facts/M.md`; `4cf5216f5953937b` R-7 = 2, R-9 = 1, lainnya 0; jumlah fakta W 14, R-7 47, R-8 48, R-9 43, M 9; CR = 0 di semua berkas; non-ASCII W = 1, lainnya 0. (Analis sudah memeriksa hal yang sama dengan Grep, kecuali CR yang tidak dapat dicek tanpa shell.)
7. Pindai rahasia atas `contract_ab3/` dan `controller_ab3/` sebelum diserahkan (berkas tulisan baris ini tidak memuat nilai rahasia maupun path berkas rahasia; R7-F36 hanya menyebut panjang secret dari sumber, bukan nilainya):
   ```
   cd C:/Users/TRIAL/AppData/Local/Temp/hermes_trial && grep -r -l -F "$(cat C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/trial_internal_secret)" contract_ab3 controller_ab3; echo "exit=$?"
   ```
   Diharapkan: tanpa berkas, exit=1.
8. Penyelesaian kunci: sesudah run M (order 7) dan dry-run R08, tulis `controller_ab3/answers/Q_key_resolved.md` dengan aturan Q_key, salin freeze ke `freeze_preQ.sha256`, jalankan `ab3.py freeze --force` dengan keputusan tercatat, lalu catat sha256 `Q_key_resolved.md` di `decisions.md` sebelum kueri pertama (protokol r3 §10 butir 5).
9. Penyerahan: run W `facts/W.md`; run R `facts/R-<i>.md` saja; run M `facts/M.md`; sesi Q `queries/Q.md`. Prompt M wajib menyebut misi `2026-10-31_hermes-contract-ab3`, folder `m/`, dan `docKey` `lapkerja-m` (RK3F-2), sama seperti prompt W (protokol r3 §8.6).

## 8. Risiko dan catatan untuk keputusan controller

| ID | Risiko | Mitigasi atau keputusan yang diminta |
|---|---|---|
| RK3F-1 | Profil gsp-master01 mengenal ketiga misi sumber di tingkat misi (§2: 124/12/295) dan kartu induk R-7 `t_e396fce0` (4, naik dari 1 di protokol), walau laporan dan kartu utamanya tidak pernah dibuka | Diterima menurut kriteria 7 (basename + cardId utama). Deteksi pemakaian ingatan: fakta yang tidak ada di lembar tetapi muncul di laporan Hermes diperiksa pada ajudikasi KF; dilaporkan sebagai risiko sisa (protokol r3 §14 butir 5) |
| RK3F-2 | Baris 1 `M.md` masih menyebut misi ab2 (hanya owner yang boleh diganti), padahal brief 06 menempatkan M di misi ab3 dan brief §5 tidak menyuruh mengabaikan baris itu (berbeda dengan W) | Controller menyebut misi ab3 di prompt M (§7 langkah 9) dan mencatatnya; atau R3-04 menambah kalimat "abaikan baris pertama `facts/M.md`" di brief 06 §5. Alternatif (butuh keputusan): sunting baris 1 M, yang melampaui instruksi "hanya baris owner" |
| RK3F-3 | Tafsir "hanya baris owner": nilai owner muncul di 2 baris M (M-F03, M-F06); keduanya diganti | Catat sebagai keputusan (P3-9). Bila controller menghendaki satu baris saja, M-F06 akan tetap menyebut `gsp-librarian` = owner R-7, sehingga syarat research/13 §5.5 butir 6 gagal |
| RK3F-4 | `Skyhop` dikenal profil (241 baris di `state.db`, kosakata misi rafif); Hermes bisa memakainya di laporan lain | Kunci Q3 dihitung dari keadaan tersimpan, jadi tidak ada galat kunci; pemakaian di luar R-9 tercatat sebagai selisih niat lawan tersimpan (pola RK-F4) |
| RK3F-5 | Tiga dari empat pin R-7 dikenal profil (7/5/6) | Pin target Q5 = pin manifest (0 kemunculan); pin lain tetap fakta isi dan dinilai KE-7 biasa |
| RK3F-6 | R8-F05 menyebut beberapa aktor (`gsp-worker-fast`, `gsp-thinker-peran-desain`, `gsp-worker`); `record.owner` hanya satu | Q4 dinilai dari medan owner tersimpan; Q_key menyatakan penyebutan penulis artefak bukan owner. Salah isi owner tercatat sebagai galat penulisan (KE-3/KE-7), bukan galat retrieval |
| RK3F-7 | Label R9-F01 `CSIGN-REVB-v22` = nama subfolder sumber (C-11 menyimpang sebagian) | Brief 06 §4 melarang membaca laporan sumber; pembacaan sumber terlihat di `<run>_toolcalls.csv` dan dicatat sebagai penyimpangan (protokol r3 §14 butir 4). Alternatif (butuh keputusan): label netral, dengan kehilangan identitas pekerjaan |
| RK3F-8 | Peta bab pembaruan sebagian (§1.1) adalah niat; Hermes bebas menempatkan fakta. F-upd2 R-7 dan R-9 juga menyentuh bab 3 | U-16 dianalisis dari blok yang benar-benar dikirim `update` (R20 per revisi), bukan dari peta ini; peta hanya pembanding |
| RK3F-9 | W.md dan M.md ditulis alat Write, bukan `cp`; byte-identitas W belum dibuktikan dengan sha | Wajib §7 langkah 3 sebelum freeze; jalur pemulihan `cp` tersedia |
| RK3F-10 | Penyimpangan K3/K4/K6 (§2): ragam kv satu baris hilang; pita panjang R-7 +22%, R-8 -22,5%, R-9 +14%; owner R-8/R-9 sama dengan R-5/R-6 lama | Jumlah fakta dalam pita; Q4 tetap tunggal. Dicatat sebagai keterbatasan keterbandingan historis |
| RK3F-11 | Folder run M diasumsikan `m/`, folder W `w/` (brief 06 §3) | Q.md mengecualikan keduanya dari arm A; bila nama nyata lain, catat |

## 9. Batas

- Sesi analis tanpa shell: sha256 tidak dihitung di sini; keberadaan berkas ditunjukkan oleh hasil Write. Cek kriteria 7 dan cek lembar dijalankan dengan Grep (ripgrep) atas berkas biner dan teks. Angka adalah jumlah baris yang cocok, bukan jumlah kemunculan mutlak, dan bisa berbeda tipis dengan `grep -a -c` controller.
- Pemeriksaan CR (CRLF) dan byte-identitas W hanya dapat dibuktikan controller (§7 langkah 3 dan 6).
- Fakta M dan W sintetis seluruhnya dan sudah ditandai di kepala masing-masing lembar.
- Kunci Q bergantung pada apa yang ditulis Hermes di run 1-7. Bila sebuah run gagal, kunci terkait diselesaikan apa adanya (bisa kosong) dan dicatat (aturan kejujuran protokol r2 §10, r3 §14).
- Jalur MD-native arm B, opsi `template`/`update`, dan bentuk `qmark` masih bertanda [menunggu R3-01] di brief 06; lembar fakta tidak bergantung pada bentuk itu.
