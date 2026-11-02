---
task_id: doc_artifact_studio
task_row: FACTS4 (D-476 decisions.md:481; daftar research/17_efficiency_protocol_r4.md §10 FACTS4 butir 1-10 dan DOCPREP butir 1-7; brief hermes_trial/09_r4_report_trial_brief.md, 09_r4_doc_trial_brief.md; pola manifest 06)
date: 2026-11-02
agent: data-analyst
type: data
confidence: HIGH untuk fakta sumber (dibaca langsung, baris dirujuk di §4) dan cek kriteria (Grep atas state.db dan state.db-wal, angka dikutip di §2); MEDIUM untuk desain kunci Q (id konkret baru ada setelah run) dan byte-identitas berkas tulisan alat Write (wajib dibuktikan controller, §8)
inputs: decisions.md D-475, D-476 (:480-481); research/17 (utuh); brief 09 (dua, utuh); manifest 06 (utuh, pola); contract_ab3/facts/{W,M,R-7,R-9}.md, contract_ab3/queries/Q.md, controller_ab3/answers/Q_key.md (pola); tiga laporan sumber U-REP dan manuscript NearLink (baca saja); harness_ab4/ab4.py (Grep, baca saja); scripts/studio/mcp/doc-tools.ts (Grep nama alat); state.db + state.db-wal profil gsp-master01 (Grep baca saja)
status: complete
---

# Manifest bahan uji Putaran 4 (FACTS4 + DOCPREP)

## 1. Berkas

Semua berkas ditulis dengan alat Write. Tidak ada tulisan ke workspace Hermes, ke `contract_ab3/`, ke `controller_ab3/`, ke config Hermes, maupun ke repo selain manifest ini. FACTS4 tidak menulis `controller_ab4/freeze.sha256` (milik `ab4.py freeze`) dan tidak menulis `freeze_sources.sha256` (sesi analis tanpa shell; perintah di §8 langkah 2).

Akar: `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/`.

| Berkas | Pembaca | Isi ringkas | Fakta / ukuran |
|---|---|---|---|
| `contract_ab4/facts/R-10.md` | Hermes (R10B, R10A) | Kurasi VSV-POST-2, `gsp-librarian`, `t_68512e06`; uji premis, gerbang IL, verdict custodian 2 iterasi, promosi; status penutupan needs-review (sumber) | 48 (R10-F01..F48) |
| `contract_ab4/facts/R-11.md` | Hermes (R11A, R11B) | Countersign CS-RR3-CHAIN, `gsp-thinker` (peran gsp-pm-verifier), `t_4b4069db`; pin bahan, CHECK 1-7, VERDICT AGREE; complete (sumber) | 46 (R11-F01..F46) |
| `contract_ab4/facts/R-12.md` | Hermes (R12B, R12A) | Verifikasi W8 WEBLOC-PD-1015, `gsp-worker-fast` (peran gsp-verifier), `t_be3fd6ab`; CHECK 1-8, VERDICT PASS; complete [skenario]; rujukan bukti ke R-10 [skenario] | 43 (R12-F01..F43) |
| `contract_ab4/facts/W.md` | Hermes (W) | Salinan isi `contract_ab3/facts/W.md` (LF, satu non-ASCII `§`). Sha wajib = D-404 `884dc89f...9138` (dicek `ab4.py freeze --check` dan §8 langkah 3) | 14, tidak dinilai |
| `contract_ab4/facts/M.md` | Hermes (M) | Salinan isi `contract_ab3/facts/M.md` (owner `gsp-skill-manager`). Sha wajib = D-440 `1d499e48...966bb3` | 9, tidak dinilai |
| `contract_ab4/queries/Q.md` | Hermes (sesi Q saja) | Q1..Q5 misi ab4; ruang cari arm A r10a/r11a/r12a; arm B alat MCP | 5 kueri |
| `controller_ab4/answers/Q_key.md` | Controller saja | Kunci simbolik, ruang kunci arm B 5 dokumen, aturan penyelesaian mekanis | - |
| `doc_ud1/source/bab-01.md` .. `bab-06.md` | Hermes (DB, DA) | Cuplikan byte NearLink (§7.1) | 14/68/24/89/65/19 = 279 baris |
| `doc_ud1/source/urutan.md`, `meta.md`, `revisi.md` | Hermes (DB, DA) | Urutan bab; metadata sampul [skenario]; tiga perubahan revisi [skenario] | - |
| `doc_ud1/wd/bab-01.md`, `meta_revisi.md` | Hermes (WD, opsional) | Bahan sintetis WD satu bab satu tabel (DOCPREP butir 6) | - |

Jumlah fakta lawan acuan ab3 (47/48/43, pita ±15% = 40-54 / 41-55 / 37-49): R-10 48 (+2,1%), R-11 46 (-4,2%), R-12 43 (0,0%). Ketiganya dalam pita.

| Lembar | F-awal | F-upd1 | F-upd2 | Total |
|---|---|---|---|---|
| R-10 | 13 (F01-F13) | 22 (F14-F35) | 13 (F36-F48) | 48 |
| R-11 | 13 (F01-F13) | 15 (F14-F28) | 18 (F29-F46) | 46 |
| R-12 | 12 (F01-F12) | 16 (F13-F28) | 15 (F29-F43) | 43 |

Format lembar = pola ab3: daftar bernomor polos dengan id fakta, kelompok `F-awal`/`F-upd1`/`F-upd2`, tanpa kepala laporan asli, ASCII saja (Grep `[^\x00-\x7F]` atas `contract_ab4/` = 1 baris, yaitu `§` di W). Kalimat "Cara pakai" sama dengan ab3 ditambah "termasuk tanggal dan angka" (selaras E4-14). Lembar menyebut kode misi (VSV-POST-2, KORPUS-LANJUTAN-1011, WEBLOC-PD-1015) dan subfolder relatif, tanpa folder misi sumber bertanggal dan tanpa nama berkas laporan sumber. Satu penyimpangan C-11: label R11-F01 `CS-RR3-CHAIN` = basename berkas sumber (preseden R9-F01 `CSIGN-REVB-v22`); Grep state.db = 0 (§2).

Penyesuaian sumber yang disengaja: R-11 `source_refs: [R-1, R-2, R-3, R-4]` dibuang (protokol §10 butir 4); rujukan R-1..R-4 di seksi Referensi sumber ditulis sebagai nama berkas (R11-F10, R11-F41). R-10 URL mirror IL berport 9011 (sumber `:62`) ditulis tanpa host/port ("API information-library scope=wiki", R10-F40) agar lembar tidak memuat alamat port terlarang. R-10 kata "librarian" dalam alasan penahan (`:39`, `:45`) ditulis "pelaksana" agar `gsp-librarian` hanya muncul sekali (kunci Q4).

### 1.1 Peta bab pembaruan sebagian (niat desain, bukan kunci)

| Lembar | Kelompok | Diniatkan berubah | Diniatkan tetap |
|---|---|---|---|
| R-10 | F-upd1 | `record` (status butir), bab 2 (uji premis, gerbang, klasifikasi, verdict-1), bab 3 (sensus, pin), bab 4 (temuan) | bab 1, bab 5 |
| R-10 | F-upd2 | `record` (status butir, status laporan), bab 1, bab 3 (re-verdict, commit), bab 4 (mirror IL, pitfall), bab 5 (lanjutan) | bab 2 |
| R-11 | F-upd1 | `record`, bab 2 dan bab 3 (pin, CHECK 1-5) | bab 1, bab 4, bab 5 |
| R-11 | F-upd2 | `record` (status laporan, vonis), bab 1 (VERDICT), bab 3 (CHECK 6-7), bab 4 (koreksi, instrumen) | bab 2 |
| R-12 | F-upd1 | `record`, bab 2 dan bab 3 (CHECK 1-6) | bab 1, bab 4, bab 5 |
| R-12 | F-upd2 | `record` (status laporan, vonis), bab 1, bab 3 (CHECK 7-8, rujukan R-10), bab 4 (register catatan, batas) | bab 2 |

## 2. Cek kriteria (protokol §7.4 kriteria 7, §6.4 kriteria 5 dan 6)

Alat Grep (ripgrep, mode hitung baris) atas path berkas langsung `C:/Users/TRIAL/AppData/Local/hermes/profiles/gsp-master01/state.db` dan `state.db-wal`, 2026-11-02, sesi ini.

| Pola | state.db | state.db-wal | Keputusan |
|---|---|---|---|
| Kontrol positif `t_c6721813` | 216 | - | Grep membaca biner (protokol §2: 216) |
| Kontrol isi WAL `session\|tool_calls` | - | 245 | WAL terbaca |
| Utama gabungan U-REP `t_68512e06\|vsv-post2-kurasi.{1,3}laporan-kurasi\|t_4b4069db\|CS-RR3-CHAIN\|t_be3fd6ab\|webloc-product-deepdive.{1,3}verification.{1,3}01_verifier-report` | **0** | - | R-10, R-11, R-12 utama lolos |
| WAL gabungan `t_68512e06\|vsv-post2-kurasi\|VSV-POST-2\|t_4b4069db\|CS-RR3-CHAIN\|t_be3fd6ab\|01_verifier-report\|nearlink\|t_6649838b\|NL-W4\|hermes-contract-ab4\|hermes-doc-ud1` | - | **0** | Belum ada jejak di WAL |
| Sekunder R-10 `t_c25f9f38` (verifikator ronde-1) | 1 | - | Informatif; sama dengan protokol §7.4 dan r3 |
| Sekunder R-10 `t_75ac3af1\|t_3aa757b0` | 0 | - | - |
| Sekunder R-11 `t_6145749f\|t_fda23cbb` | 0 | - | - |
| Misi R-10 `vsv-post2-kurasi\|VSV-POST-2` | 2 | 0 | Risiko sisa (sama protokol) |
| Misi R-11 `korpus-lanjutan-1011\|KORPUS-LANJUTAN-1011` | 26 | 0 | Risiko sisa RK4F-2 |
| Misi R-12 `webloc\|WEBLOC` | 440 | 0 | Risiko sisa RK4-7. Protokol mencatat 1.960 dengan pola lain; angka ini jumlah baris cocok, bukan kemunculan |
| R-12 `f82713ae9741d627\|WEBLOC-PD-1015` | 15 | 0 | Informatif (pin rubrik dan kode misi dikenal profil) |
| NearLink path + kartu `nearlink-research-plan.{1,3}output.{1,3}(manuscript\|10_manuscript\|11_manuscript)\|t_6649838b\|NL-W4-M` | **0** | 0 | U-DOC kriteria 5 lolos |
| NearLink `NEARLINK-1019\|NL-W4-MRG\|NL-FIX-SPK` | 0 | - | Kartu penulis manuskrip 0 (DOCPREP butir 1) |
| Misi NearLink `(?i)nearlink` | 14 | 0 | Risiko sisa tingkat misi (protokol: 14) |
| Istilah Q3 `DIGUGATKAN` | **0** | 0 | Dipilih (§6) |
| Kandidat Q3 ditolak `(?i)penlink` | 3.918 | 0 | Ditolak: sangat dikenal profil |
| Pin Q5 `61b35d8ffba7c993` | **0** | 0 | Dipilih (§6) |
| Pin Q5 ditolak `53109b0fff951647` | 2 | - | Ditolak |

Kriteria 6 U-DOC: Grep `(?i)nearlink|DIGUGATKAN|61b35d8ffba7c993` atas `Temp/hermes_trial/` sebelum menulis = hanya `harness_ab4/ab4.py` (konstanta `SOURCE_MISSIONS` daftar tolak, `ab4.py:79`), bukan bahan uji. Lolos.

Kriteria lain (§7.4): K1 laporan nyata bertanggal 2026-10-23, 2026-10-11, 2026-10-15; K6 owner berbeda satu sama lain (gsp-librarian, gsp-thinker, gsp-worker-fast) dan berbeda dari owner M (`gsp-skill-manager`); owner R-12 sama dengan owner W (`gsp-worker-fast`), tidak memengaruhi Q4. Owner R-10 sama dengan owner R-7 r3 (protokol sudah mencatat). Ukuran: R-10 66 baris, R-11 66 baris (di bawah pita 80), R-12 231 baris.

Keputusan R-12 (§10 butir 2): utama webloc dipakai, cadangan Heimdall TIDAK dipakai. Alasan: kriteria 7 utama 0 di state.db dan WAL; ukuran dalam pita (231 lawan ~250; Heimdall +58%); istilah Q3 `DIGUGATKAN` dengan 0 kemunculan tersedia; U-DOC tetap punya cadangan 2. Harga: keakraban tingkat misi tinggi (RK4-7). Cadangan R-10/R-11 tidak dicari di sesi ini (utama lolos; G4-2 tetap).

## 3. Fakta absen, fakta [skenario], keputusan M

### 3.1 Fakta "tidak ada di sumber" (jenis `absen`)

- R-10 (4): jam mulai/selesai (F06); id sesi dan jam dispatch custodian (F45); cid (F46); ukuran/sha laporan (F47). Sebagian absen: F43 (tidak ada VERDICT menyeluruh; `manual`).
- R-11 (5): jam mulai/selesai (F07); blocker dan langkah berikut eksplisit (F43); id sesi dan jam cetakan cs_run (F44); cid dan commit (F45); ukuran/sha laporan (F46).
- R-12 (4): jam run (F06); blocker dan langkah berikut eksplisit (F40); cid dan commit (F41); ukuran/sha laporan (F42).

### 3.2 Fakta [skenario]

- initiator `gsp-master01` (R10-F03, R11-F04, R12-F03).
- Waktu lapor jam mesin +07:00 (R10-F05, R11-F06, R12-F05).
- Status butir dan status laporan S1/S2 (R10-F12..F14, R11-F12..F14, R12-F11..F13).
- Kode butir R10-B*, R11-B*, R12-B* = pengelompokan analis (pola ab3, tanpa label).
- Status penutupan: R-10 `needs-review` dari kepala sumber `:5` (BUKAN skenario; isi `:62` memuat promosi selesai, tetapi status kepala tetap needs-review dan mirror IL belum dicek). R-11 `complete` dari kepala `:5`. R-12 `complete` **[skenario]**: sumber tidak punya medan status; VERDICT PASS `:220` (R12-F39).
- Rujukan R-12 ke R-10 (R12-F43, R10-F48) untuk Q5. Nilai = sha16 dataset `61b35d8ffba7c993` dari R-10 `:25` (R10-F15). Dipilih karena 0 di state.db dan WAL (§2), sedangkan pin xlsx 2. Alasan rujukan (pola uji premis ber-pin) adalah rekaan skenario. R12-F43 sengaja tidak menyebut owner R-10 agar `gsp-librarian` tetap tunggal untuk Q4.

### 3.3 Keputusan M (protokol §10 butir 6)

Syarat pakai ulang byte-identik terpenuhi: `gsp-skill-manager` 0 di R-10..R-12 (Grep atas `contract_ab4/facts/`: hanya M.md :9, :15); istilah Q3 `DIGUGATKAN` 0 di M. M = salinan isi `contract_ab3/facts/M.md`; sha wajib D-440 `1d499e48...966bb3`. Baris 1 M masih menyebut misi ab2 (RK3F-2 r3): prompt M wajib menyebut misi `2026-11-02_hermes-contract-ab4`, folder `m/`, docKey `lapkerja-m`.

## 4. Jejak fakta ke sumber (untuk cek KF; tidak diberikan ke Hermes)

Path relatif `C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/`.

| Lembar | Fakta: baris sumber |
|---|---|
| R-10 `2026-10-23_vsv-post2-kurasi/laporan-kurasi.md` | F01 `:2`,`:15`,`:19`; F02 `:6`; F03 `:4`,`:19`; F04 `:58`; F05 `:3`; F06 absen; F07 `:7-12`; F08 `:19`; F09 `:19`; F10 `:23-31` (daftar klaim); F11 pengelompokan; F12-F14 skenario; F15 `:25-26`; F16 `:27`; F17 `:28`; F18 `:29`; F19 `:30`; F20 `:31`; F21 `:33`; F22 `:33`; F23 `:37`; F24 `:37`; F25 `:37`; F26 `:39`; F27 `:43-44`; F28 `:45`; F29 `:49`; F30 `:50`; F31 `:62`; F32 `:62`; F33 `:62`; F34 `:62`; F35 `:62`; F36 keadaan akhir; F37 `:62`; F38 `:62`; F39 `:62`; F40 `:62`; F41 `:64`; F42 `:66`; F43 seluruh berkas; F44 `:5`; F45 seluruh berkas; F46 seluruh berkas; F47 seluruh berkas; F48 skenario (nilai `:25`) |
| R-11 `2026-10-11-korpus-lanjutan-1011/verification/CS-RR3-CHAIN.md` | F01 `:2`,`:10`; F02 `:12`; F03 `:12`, path; F04 `:4`; F05 `:13`; F06 `:14`; F07 absen; F08 `:14-15`; F09 `:16`; F10 `:64`; F11 pengelompokan; F12-F14 skenario; F15 `:22`; F16 `:23-24`; F17 `:25`; F18 `:26-27`; F19 `:31`; F20 `:33`; F21 `:33`; F22 `:33`; F23 `:35`; F24 `:35`; F25 `:37`; F26 `:37`; F27 `:39`; F28 `:39`; F29 keadaan akhir; F30 `:41`; F31 `:41`; F32 `:43`; F33 `:43`; F34 `:45`; F35 `:49`; F36 `:50`; F37 `:51`; F38 `:55`; F39 `:55`; F40 `:59`; F41 `:63`,`:65`; F42 `:5`; F43 seluruh berkas; F44 `:59` (tanpa jam/sesi); F45 seluruh berkas; F46 seluruh berkas |
| R-12 `2026-10-15_webloc-product-deepdive/verification/01_verifier-report.md` | F01 `:2`,`:4`,`:13`, path; F02 `:3`; F03 `:5`; F04 `:5`; F05 `:6`; F06 absen (`:26` mtime artefak); F07 `:7`; F08 `:8-10`; F09 `:15-17`; F10 pengelompokan; F11-F13 skenario; F14 `:24-25`; F15 `:26-28`; F16 `:33-35`; F17 `:42-47`; F18 `:48`; F19 `:50-56`; F20 `:60-63`; F21 `:66-71`; F22 `:73-77`; F23 `:87-89`,`:94`; F24 `:90-93`,`:95-102`; F25 `:106-110`; F26 `:112-125`; F27 `:129-151` (N5 `:139`); F28 `:151-156`; F29 keadaan akhir; F30 `:160-171`; F31 `:173-178`; F32 `:182-191`; F33 `:195-199`; F34 `:200-202`; F35 `:205-207`; F36 `:211-220`; F37 `:222-226`; F38 `:228-231`; F39 skenario (`:220`); F40 seluruh berkas; F41 seluruh berkas; F42 seluruh berkas; F43 skenario (nilai R-10 `:25`) |

Penyederhanaan yang disengaja (bukan fakta, tidak ditagih KF): R-10 nama berkas objek vault terpotong `:56`, tabel artefak `:54-58` diringkas ke F04; R-11 baris "Reproduksi" daftar indeks sampel `:59`; R-12 tabel ambang S3-C L1-L6 diringkas (rincian LADDER per lajur, celah U1-U8/G-09..G-15, K2..K6 sel kosong), tabel 8 angka spot-check (hanya 3 angka contoh di F26), tabel butir N/C per baris `:135-149`, register catatan 3 `:203-204` (sudah tercakup F28, F31), pin rubrik/jejak scan di daftar artefak akhir `:223-225` (sudah F14, F25).

## 5. Tabel token KE-7 (dibekukan sebelum uji; aturan pakai = manifest 06 §5)

Aturan: fakta cocok bila setiap token DAN ditemukan dalam teks ternormalisasi (NFC, spasi diringkas, `*` `` ` `` `_` dibuang, huruf kecil; normalisasi sama atas token). Kolom ATAU = padanan sah. Token angka juga dicocokkan bentuk digit saja (diperiksa manual). `manual` = diperiksa 100%. `absen` = tidak masuk penyebut; diperiksa tidak dikarang. Status S1/S2 [skenario] `manual`, dicek pada revisi terkait (arm B: R20 per revisi). Token bertanda `*` muncul juga di fakta lain: diajudikasi ke fakta yang benar. Fakta tanggal wajib ditagih (pelajaran R9-F07).

### R-10

| fact_id | kelompok | token wajib (DAN) | token alternatif (ATAU) | jenis |
|---|---|---|---|---|
| R10-F01 | F-awal | VSV-POST-2; 2581* | 2581 => 2.581 | literal |
| R10-F02 | F-awal | t_68512e06* | - | literal |
| R10-F03 | F-awal | gsp-librarian; gsp-master01; gspuser01* | - | literal |
| R10-F04 | F-awal | gate_fleet_run.txt; validate_fm.py; prompt_custodian.txt | - | literal |
| R10-F05 | F-awal | 2026-10-23 | 2026-10-23 => 23-10-2026 / 23 Oktober 2026 | literal |
| R10-F06 | F-awal | - | - | absen |
| R10-F07 | F-awal | vendor-sort-verify-1023; jejak-verifikasi-ronde2.md; merge_audit.json* | - | literal |
| R10-F08 | F-awal | dataset-vsv-1023-2581-vendor-pameran-ai-2026-identifier-situs-terverifikasi-entity-gate | - | literal |
| R10-F09 | F-awal | expo-2026-intel | - | literal |
| R10-F10 | F-awal | FIELD-KOSONG*; UNCONFIRMED-DIRECTORI* | - | literal |
| R10-F11 | F-awal | R10-B1; R10-B4 | - | literal |
| R10-F12 | F-awal | - | - | manual |
| R10-F13 | F-awal | - | - | manual |
| R10-F14 | F-upd1 | - | - | manual |
| R10-F15 | F-upd1 | 61b35d8ffba7c993*; 53109b0fff951647 | - | literal |
| R10-F16 | F-upd1 | JSONL*; 2581* | - | literal |
| R10-F17 | F-upd1 | gsp-agent/docs/2026-10-23-vendor-sort-verify | - | literal |
| R10-F18 | F-upd1 | 114; 87 Website; 27 Expertise; D-10 | - | literal |
| R10-F19 | F-upd1 | seksi 5.1; DITEGAKKAN | seksi 5.1 => bagian 5.1 | literal |
| R10-F20 | F-upd1 | t_c25f9f38; t_75ac3af1; 909 | - | literal |
| R10-F21 | F-upd1 | 2455/39/33/32/22; 1666/504/323/74/14; 1564/931/50/34/1/1 | bentuk digit saja | angka |
| R10-F22 | F-upd1 | 2494; build_excel.py:58 | 2494 => 2.494 | literal |
| R10-F23 | F-upd1 | librarian-intake; il_ingest/gate.py; AM-G4 | - | literal |
| R10-F24 | F-upd1 | 438; 3.063; 2.625; exit 2 | 3.063 => 3063; 2.625 => 2625 | literal |
| R10-F25 | F-upd1 | 2.359; Keyfactor; Semgrep; malformed-record | 2.359 => 2359 | literal |
| R10-F26 | F-upd1 | rafai-1004; G-3.2; GATE-SPEC 8.2 | - | literal |
| R10-F27 | F-upd1 | 1.015; 960; cidex | 1.015 => 1015 | literal |
| R10-F28 | F-upd1 | - | - | manual (dua penahan promosi) |
| R10-F29 | F-upd1 | MATI-TERKONFIRMASI; jlcbr.com; seksi 5.4 | - | literal |
| R10-F30 | F-upd1 | 915/2581; ts_verif; seksi 5.3 | - | literal |
| R10-F31 | F-upd1 | perlu_revisi; custodian-vsv-post2; gsp-custodian | - | literal |
| R10-F32 | F-upd1 | 82 pameran; 13 pameran; 148* | - | literal |
| R10-F33 | F-upd1 | lines=2583; Arfysica; G-1.3 | - | literal |
| R10-F34 | F-upd1 | 42 seq; newline 2581 | - | literal |
| R10-F35 | F-upd1 | SequenceMatcher; apply_verdict_r1.py | - | literal |
| R10-F36 | F-upd2 | - | - | manual |
| R10-F37 | F-upd2 | custodian_out2.txt; seq 82-84; terverifikasi | - | literal |
| R10-F38 | F-upd2 | vault_promote.py; d95a2ca; dipromosikan | - | literal |
| R10-F39 | F-upd2 | 246+3+1; 245+2+3 | - | literal |
| R10-F40 | F-upd2 | scope=wiki; mirror IL | - | literal |
| R10-F41 | F-upd2 | U+0085*; json.dumps; readline | - | literal |
| R10-F42 | F-upd2 | t_3aa757b0; CJK | - | literal |
| R10-F43 | F-upd2 | - | - | manual (tidak ada VERDICT menyeluruh yang dikarang) |
| R10-F44 | F-upd2 | needs-review | needs-review => butuh tinjauan / perlu tinjauan | literal |
| R10-F45 | F-upd2 | - | - | absen |
| R10-F46 | F-upd2 | - | - | absen |
| R10-F47 | F-upd2 | - | - | absen |
| R10-F48 | F-upd2 | 61b35d8ffba7c993* | - | literal (dicek di bagian bukti) |

R-10 ringkas: literal 37, angka 1, manual 6, absen 4. Penyebut KF bertoken = 38.

### R-11

| fact_id | kelompok | token wajib (DAN) | token alternatif (ATAU) | jenis |
|---|---|---|---|---|
| R11-F01 | F-awal | CS-RR3-CHAIN; V-RR3-CHAIN*; langkah 31 | - | literal |
| R11-F02 | F-awal | t_4b4069db; 34/G4 | - | literal |
| R11-F03 | F-awal | KORPUS-LANJUTAN-1011 | - | literal |
| R11-F04 | F-awal | gsp-thinker; gsp-master01 | - | literal |
| R11-F05 | F-awal | gsp-pm-verifier; t_6145749f | - | literal |
| R11-F06 | F-awal | 2026-10-11* | 2026-10-11 => 11-10-2026 / 11 Oktober 2026 | literal |
| R11-F07 | F-awal | - | - | absen |
| R11-F08 | F-awal | cs_rr3_chain.py*; SETELAH | SETELAH => sesudah | literal |
| R11-F09 | F-awal | 1011013*; SEED-LOG | - | literal |
| R11-F10 | F-awal | 02_structured.md; sama 33 | - | literal |
| R11-F11 | F-awal | R11-B1; R11-B4 | - | literal |
| R11-F12 | F-awal | - | - | manual |
| R11-F13 | F-awal | - | - | manual |
| R11-F14 | F-upd1 | - | - | manual |
| R11-F15 | F-upd1 | 0c75aa9d4585a0de; 59.450; CC3-DISPOSISI | 59.450 => 59450 | literal |
| R11-F16 | F-upd1 | b5627d7c3bc4ebf8; 2c333fbbb1680202; 104 baris | - | literal |
| R11-F17 | F-upd1 | 01ca3425c9bfa5a7; 46.733; W11c-MERGE | 46.733 => 46733 | literal |
| R11-F18 | F-upd1 | 50080c48948c0590; 130/177/0 | - | literal |
| R11-F19 | F-upd1 | 25/25; BUILDING-CONSTRUCTION | - | literal |
| R11-F20 | F-upd1 | 12/12; REF-SWD-001* | - | literal |
| R11-F21 | F-upd1 | 2.198; 3.472; +1.274; REF-PRQ-003 | bentuk digit saja | angka |
| R11-F22 | F-upd1 | R3-STATUS.md; Catatan penyatuan status | - | literal |
| R11-F23 | F-upd1 | 2..308*; 0/307 | - | literal |
| R11-F24 | F-upd1 | 40/40; 03_SOURCE-VAULT; berkas hantu | - | literal |
| R11-F25 | F-upd1 | 32 terbuka; GAP-014 | - | literal |
| R11-F26 | F-upd1 | GAP-023..035; 24/26 | - | literal |
| R11-F27 | F-upd1 | RF-WIRELESS=4; BERANTAI PARSIAL TERBIMBING | RF-WIRELESS=4 => RF-WIRELESS 4 | literal |
| R11-F28 | F-upd1 | may_set_acceptance; no-unless-contract-adopts* | - | literal |
| R11-F29 | F-upd2 | - | - | manual |
| R11-F30 | F-upd2 | 149; langkah 10-17 | - | literal |
| R11-F31 | F-upd2 | Pembuktian torsi baut; 3 iterasi | - | literal |
| R11-F32 | F-upd2 | 55 lokus; 0/55 | - | literal |
| R11-F33 | F-upd2 | PERLU-DINILAI; langkah 22 | - | literal |
| R11-F34 | F-upd2 | AGREE; 6/6 | - | literal |
| R11-F35 | F-upd2 | 259..276; 299..307; 307-259=48 | - | literal |
| R11-F36 | F-upd2 | Chapra-Canale; t_fda23cbb; PROXY-ACK | - | literal |
| R11-F37 | F-upd2 | Temuan 1; closeout | - | literal |
| R11-F38 | F-upd2 | io.StringIO; TypeError | - | literal |
| R11-F39 | F-upd2 | 113; 53; 34 kalimat | - | literal |
| R11-F40 | F-upd2 | cs_run5.txt; VERDICT-COUNTERSIGN-INSTRUMEN | - | literal |
| R11-F41 | F-upd2 | V-RR3-CHAIN.md; PETA-LOKUS-INTAKE-PD.json | - | literal |
| R11-F42 | F-upd2 | complete | complete => selesai | literal |
| R11-F43 | F-upd2 | - | - | absen |
| R11-F44 | F-upd2 | - | - | absen |
| R11-F45 | F-upd2 | - | - | absen |
| R11-F46 | F-upd2 | - | - | absen |

R-11 ringkas: literal 36, angka 1, manual 4, absen 5. Penyebut KF bertoken = 37.

### R-12

| fact_id | kelompok | token wajib (DAN) | token alternatif (ATAU) | jenis |
|---|---|---|---|---|
| R12-F01 | F-awal | WEBLOC-PD-1015; W8; BERAT | - | literal |
| R12-F02 | F-awal | t_be3fd6ab | - | literal |
| R12-F03 | F-awal | gsp-worker-fast*; gsp-master01 | - | literal |
| R12-F04 | F-awal | gsp-verifier; gsp-thinker; kendaraan ketiga | - | literal |
| R12-F05 | F-awal | 2026-10-15 | 2026-10-15 => 15-10-2026 / 15 Oktober 2026 | literal |
| R12-F06 | F-awal | - | - | absen |
| R12-F07 | F-awal | 10152026* | - | literal |
| R12-F08 | F-awal | READ-ONLY; nol aksi eksternal | - | literal |
| R12-F09 | F-awal | w8_measure.py; v1.11.0; --channel chat | - | literal |
| R12-F10 | F-awal | R12-B1; R12-B4 | - | literal |
| R12-F11 | F-awal | - | - | manual |
| R12-F12 | F-awal | - | - | manual |
| R12-F13 | F-upd1 | - | - | manual |
| R12-F14 | F-upd1 | f82713ae9741d627; 18.022; 276 baris | 18.022 => 18022 | literal |
| R12-F15 | F-upd1 | 12:58:10; 17:13:04; 3 jam 02 menit | - | literal |
| R12-F16 | F-upd1 | a943b1fe378eefb5; e30e8a173b674fd3; 7/7* | - | literal |
| R12-F17 | F-upd1 | 36; .go.id; 84 sel; 68 terisi | - | literal |
| R12-F18 | F-upd1 | DIGUGATKAN*; W-01..W-24; DPK-01..DPK-20 | - | literal |
| R12-F19 | F-upd1 | V1-gerbang-lajur.md; JENUH | - | literal |
| R12-F20 | F-upd1 | KS-06.D5; KS-03.D3; 21,7%* | 21,7% => 21.7% | literal |
| R12-F21 | F-upd1 | L2-regulasi-pdp.md#L120; L1-teknis-api.md#L217; 0 dari 13 | - | literal |
| R12-F22 | F-upd1 | 0 dari 60 | - | literal |
| R12-F23 | F-upd1 | 59,0; 60,0; PLAFON-SEKUNDER | 59,0 => 59.0; 60,0 => 60.0 | literal |
| R12-F24 | F-upd1 | 44,0; 53,0; 52,0; TERPASANG-VETO | 44,0 => 44.0; 53,0 => 53.0; 52,0 => 52.0 | literal |
| R12-F25 | F-upd1 | 65f30d26764ad71f; 5.217; 39 baris | 5.217 => 5217 | literal |
| R12-F26 | F-upd1 | 10.623; 372 unit; U+2014 | 10.623 => 10623 | literal |
| R12-F27 | F-upd1 | N1..N7; C1..C8; DIGUGATKAN* | - | literal |
| R12-F28 | F-upd1 | synthesis/01-sintesis-skenario.md; presentation/01-sajian-chat.md | - | literal |
| R12-F29 | F-upd2 | - | - | manual |
| R12-F30 | F-upd2 | 13 kecocokan; kanban.db; tidak dikirim ke siapa pun | - | literal |
| R12-F31 | F-upd2 | D-TA-06; 7 dari 15 | - | literal |
| R12-F32 | F-upd2 | 315; 200; 10/10 | - | angka |
| R12-F33 | F-upd2 | 60 positif-palsu; D1 | - | literal |
| R12-F34 | F-upd2 | 70/24; 72/24 | - | literal |
| R12-F35 | F-upd2 | SEED-LOG; 10152026* | - | literal |
| R12-F36 | F-upd2 | - | - | manual (vonis akhir PASS: medan verdict record arm B / teks vonis arm A) |
| R12-F37 | F-upd2 | c7fca65647546b54; ae4f5e936737cb5a; 1cff424ebbb7ca5e; e309d5afaae6ae09 | - | literal |
| R12-F38 | F-upd2 | nol-halusinasi; yurisdiksi | - | literal |
| R12-F39 | F-upd2 | complete | complete => selesai | literal |
| R12-F40 | F-upd2 | - | - | absen |
| R12-F41 | F-upd2 | - | - | absen |
| R12-F42 | F-upd2 | - | - | absen |
| R12-F43 | F-upd2 | - | - | manual (arm B: entri `refs[]` record ke blok R10B; arm A: rujukan teks ke baris R10A; nilai `61b35d8ffba7c993` boleh tertulis) |

R-12 ringkas: literal 32, angka 1, manual 6, absen 4. Penyebut KF bertoken = 33. W dan M tidak diberi token.

## 6. Desain Q1..Q5 (rinci di `controller_ab4/answers/Q_key.md`)

| Q | Kueri | Kunci diniatkan arm A | Kunci diniatkan arm B | Fakta penopang |
|---|---|---|---|---|
| Q1 | status laporan kartu `t_be3fd6ab` | LAP_A(r12a); complete/selesai | `lapkerja-r12b`; complete | R12-F02, R12-F39 |
| Q2 | laporan berstatus complete | r11a, r12a | `lapkerja-r11b`, `-r12b`; keluar r10b (needs-review), w (blocked), m (needs-review) | R11-F42, R12-F39, R10-F44 |
| Q3 | paragraf memuat `DIGUGATKAN` | baris di r12a | blok `lapkerja-r12b` | R12-F18, R12-F27 |
| Q4 | laporan owner `gsp-librarian` | r10a | `lapkerja-r10b` | R10-F03 |
| Q5 | bagian bukti yang dirujuk laporan `t_be3fd6ab` | baris r10a bermuatan `61b35d8ffba7c993` yang ditunjuk r12a | `lapkerja-r10b#pid` dari `refs[]` `lapkerja-r12b` | R12-F43, R10-F48, R10-F15 |

Istilah Q3 `DIGUGATKAN`: 0 di state.db dan WAL; hanya di lembar R-12 (2 baris fakta: R-12.md :30, :39; Grep `(?i)\bdigugatkan\b` atas `contract_ab4/facts/` = R-12 2, lainnya 0); satu token tanpa tanda baca. Lebih sedikit dari 3 fakta ab3 (keterbatasan sumber: istilah hanya di `:48` dan `:139`). Ditolak: `Penlink` (3.918 di state.db).

Q4 = `gsp-librarian` (bukan `gsp-thinker`) karena `gsp-thinker` juga muncul di R-12 (R12-F04, penulis lajur), sedangkan `gsp-librarian` hanya di R-10.md :9 (Grep). Pengusul `gspuser01` dan akun `gsp-custodian` bukan owner (Q_key).

Pemeriksaan silang (Grep atas `contract_ab4/facts/`): kata utuh `complete` hanya R-11.md :54 dan R-12.md :51; `t_be3fd6ab` hanya R-12.md :8; `61b35d8ffba7c993` R-10.md :24, :60 dan R-12.md :55; `t_68512e06` R-10.md :8, :10 dan R-12.md :55 (rujukan); `gsp-skill-manager` hanya M.md. Urutan aman Q5: R10B (order 1) sebelum R12B (order 5), R10A (order 2) sebelum R12A (order 6).

Kunci dinilai atas keadaan TERSIMPAN sesudah run M dan dry-run R08, sebelum sesi Q. Dokumen misi ab, ab2, ab3 tidak masuk ruang kunci.

## 7. Bahan U-DOC (DOCPREP)

### 7.1 Cuplikan (salinan byte rentang baris; tidak ada rentang yang memecah tabel)

Sumber `S` = `C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/2026-10-19_nearlink-research-plan/output/manuscript.md` (1.732 baris; LF; rentang terpilih ASCII murni dan tanpa spasi akhir baris, Grep `[^\x00-\x7F]|\s$` atas S hanya cocok `:1723`, di luar rentang).

| Berkas | Rentang S | Baris | Isi |
|---|---|---|---|
| `bab-01.md` | 3-16 | 14 | FM.1, tabel 10 baris data x 2 kolom |
| `bab-02.md` | 17-84 | 68 | FM.2 prosa |
| `bab-03.md` | 86-109 | 24 | FM.3 prosa TANPA baris 110-113 (dua baris apparatus Gambar FG-1, FG-2) |
| `bab-04.md` | 116-204 | 89 | Chapter 1 (1.1-1.4) |
| `bab-05.md` | 974-1038 | 65 | Chapter 6 (6.1-6.5); Table 6.1 `:988-1010` 21 baris data x 6 kolom; Table 6.2 `:1020-1024` 3 baris data x 4 kolom |
| `bab-06.md` | 1247-1265 | 19 | Chapter 10 (10.1-10.3) |

Total 279 baris (pita protokol 250-320). Pemisah `---` dan baris kosong batas tidak diambil. Hitung baris berkas tertulis dicek Grep `^`: 14/68/24/89/65/19.

Aturan gambar (protokol §6.4): `scripts/studio/mcp/doc-tools.ts` saat ini hanya punya 8 alat (`studio_templates_list`, `studio_template_get`, `studio_document_create`, `studio_chapter_import_markdown`, `studio_chapter_submit`, `studio_slot_fill`, `studio_document_structure`, `studio_document_status`), tanpa alat aset. Maka bahan disiapkan VARIAN TANPA GAMBAR untuk kedua arm, dan `urutan.md` menyatakannya. Kalimat FM.3 yang menyebut FG-1/FG-2 dan "Three figure slots appear inline below" tetap verbatim (isi). Bila MCP-D1 akhirnya menyediakan alat aset sebelum freeze, controller memakai varian dengan gambar (§8 langkah 9) dan mencatat keputusannya. Keputusan wajib dikunci sebelum freeze (P4-3).

### 7.2 meta.md, revisi.md, WD

- `meta.md` [skenario]: judul dari heading S `:1` tanpa "(merged manuscript)"; nomor `GSP-UD1-NL-001`; klasifikasi TERBATAS; penyusun Tim Riset GSP; tanggal 2026-10-19 (tanggal misi sumber); Rev 0 / Rev 1.
- `revisi.md` [skenario], tiga perubahan dengan token cek:

| ID | Lokasi | Lama | Baru | Token cek S2 | Token tidak boleh tersisa |
|---|---|---|---|---|---|
| RV-1 | bab-05 6.4 (S `:1034`) | `500 bundles` | `400 bundles` | `400 bundles` | `500 bundles` (0 di DOCX S2; 1 di S1) |
| RV-2 | Table 6.1 baris SEC-12 kolom Likelihood (S `:1001`) | `Medium` | `Medium-High` | sel SEC-12 = `Medium-High` | - |
| RV-3 | akhir paragraf terakhir 10.3 (S `:1265`) | - | kalimat `Revision note REV-UD1-03: ...` | `REV-UD1-03` | - |

`400 bundles`, `Medium-High`, `REV-UD1` = 0 di rentang cuplikan (Grep atas S: `Medium-High` hanya di `:1189`, `:1199`, `:1202`, di luar cuplikan; `500 bundles` hanya `:1034` di dalam cuplikan).
- WD: `doc_ud1/wd/` (sintetis seluruhnya, satu bab, satu tabel 3 x 3, satu perubahan revisi). Tidak masuk freeze `doc_ud1/source/*` (H4-14); bila WD dijalankan, prompt WD menunjuk folder ini.

### 7.3 Acuan docxcheck (UD-Q1..Q4; dibekukan sebelum uji)

`docxcheck` belum ada di `ab4.py` (Grep `docx` hanya `:2181`). Acuan = berkas beku `doc_ud1/source/bab-*.md` + `revisi.md` itu sendiri, diturunkan mekanis oleh HARNESS4 (bukan daftar tangan, agar tidak ada galat salin):
- paragraf ternormalisasi: blok prosa dipisah baris kosong, baris yang dilipat digabung, penanda MD (`#`, `**`, `` ` ``) dibuang, NFC, spasi diringkas;
- multiset angka dan ID rujukan: regex `\[[A-F]-[CN]-\d+b?\]`, `SEC-\d+`, `SD-\d+`, `KD-\d+`, `A-\d+`, `EXP-\d+`, angka;
- tabel: FM.1 10 x 2, Table 6.1 21 x 6, Table 6.2 3 x 4 (baris data x kolom);
- gambar: 0 (varian tanpa gambar);
- heading: 6 heading `##` + 13 heading `###` (1.1-1.4, 6.1-6.5, 10.1-10.3; FM tanpa subjudul);
- token revisi: tabel §7.2; selain tiga perubahan, teks DOCX S2 = teks DOCX S1 (UD-Q4).

## 8. Instruksi controller (Git Bash; alat analis tanpa shell)

1. Cek kriteria versi shell (hasil analis di §2):
   ```
   cd C:/Users/TRIAL/AppData/Local/hermes/profiles/gsp-master01 && for t in t_68512e06 t_4b4069db t_be3fd6ab CS-RR3-CHAIN t_6649838b NL-W4-M DIGUGATKAN 61b35d8ffba7c993 t_75ac3af1 t_3aa757b0 t_6145749f t_fda23cbb t_c25f9f38 t_c6721813; do printf '%s ' "$t"; cat state.db state.db-wal | grep -a -c -F -- "$t"; done; for p in 'vsv-post2-kurasi.{1,3}laporan-kurasi' 'webloc-product-deepdive.{1,3}verification.{1,3}01_verifier-report' 'nearlink-research-plan.{1,3}output.{1,3}(manuscript|10_manuscript|11_manuscript)'; do printf '%s ' "$p"; cat state.db state.db-wal | grep -a -c -E -- "$p"; done
   ```
   Diharapkan: semua 0 kecuali `t_c25f9f38` (analis 1, sekunder informatif) dan kontrol `t_c6721813` > 0 (analis 216). Nilai utama > 0 berarti lembar slot itu tidak sah: pakai cadangan (§7.4 protokol) dan luncurkan ulang FACTS4 untuk slot itu. `DIGUGATKAN` atau `61b35d8ffba7c993` > 0: pilih ulang istilah/pin.
2. Bekukan sumber (protokol §10 butir 3), lalu catat sha di `decisions.md`:
   ```
   D=C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs; sha256sum $D/2026-10-23_vsv-post2-kurasi/laporan-kurasi.md $D/2026-10-11-korpus-lanjutan-1011/verification/CS-RR3-CHAIN.md $D/2026-10-15_webloc-product-deepdive/verification/01_verifier-report.md $D/2026-10-19_nearlink-research-plan/output/manuscript.md > C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/controller_ab4/freeze_sources.sha256 && sha256sum -c C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/controller_ab4/freeze_sources.sha256
   ```
3. Byte-identik W dan M (dicek juga oleh `ab4.py freeze --check` untuk W):
   ```
   cd C:/Users/TRIAL/AppData/Local/Temp/hermes_trial && sha256sum contract_ab3/facts/W.md contract_ab4/facts/W.md contract_ab3/facts/M.md contract_ab4/facts/M.md && cmp contract_ab3/facts/W.md contract_ab4/facts/W.md && echo W_IDENTIK && cmp contract_ab3/facts/M.md contract_ab4/facts/M.md && echo M_IDENTIK
   ```
   W wajib `884dc89f...9138`, M wajib `1d499e48...966bb3`. Bila berbeda: `cp -p contract_ab3/facts/W.md contract_ab4/facts/W.md` (atau M), ulangi.
4. Byte-identik cuplikan U-DOC:
   ```
   S=C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/2026-10-19_nearlink-research-plan/output/manuscript.md; D=C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/doc_ud1/source; for r in "01 3,16" "02 17,84" "03 86,109" "04 116,204" "05 974,1038" "06 1247,1265"; do set -- $r; sed -n "${2}p" "$S" | cmp - "$D/bab-$1.md" && echo "bab-$1 IDENTIK"; done; sha256sum $D/*
   ```
   Diharapkan enam IDENTIK. Bila ada yang beda: `sed -n "${2}p" "$S" > "$D/bab-$1.md"` untuk berkas itu, ulangi, lalu catat sha per berkas di `decisions.md`.
5. Cek mekanis lembar:
   ```
   cd C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/contract_ab4 && grep -c -i -w DIGUGATKAN facts/*.md; grep -l gsp-librarian facts/*.md; grep -c -w complete facts/*.md; grep -l gsp-skill-manager facts/*.md; grep -c -F 61b35d8ffba7c993 facts/*.md; grep -l t_be3fd6ab facts/*.md; grep -c -E '^[0-9]+\. [A-Z0-9]+-F[0-9]+' facts/*.md; grep -c $'\r' facts/*.md queries/Q.md ../controller_ab4/answers/Q_key.md ../doc_ud1/source/*.md; LC_ALL=C grep -c -P '[^\x00-\x7F]' facts/*.md queries/Q.md ../doc_ud1/source/*.md
   ```
   Diharapkan: DIGUGATKAN R-12 = 2, lainnya 0; `gsp-librarian` hanya R-10; `complete` R-11 = 1, R-12 = 1, lainnya 0; `gsp-skill-manager` hanya M; `61b35d8ffba7c993` R-10 = 2, R-12 = 1; `t_be3fd6ab` hanya R-12; jumlah fakta W 14, R-10 48, R-11 46, R-12 43, M 9; CR = 0 semua; non-ASCII W = 1, lainnya 0.
6. Pindai rahasia sebelum diserahkan:
   ```
   cd C:/Users/TRIAL/AppData/Local/Temp/hermes_trial && grep -r -l -F "$(cat C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/trial_internal_secret)" contract_ab4 controller_ab4 doc_ud1; echo "exit=$?"
   ```
   Diharapkan tanpa berkas, exit=1.
7. Freeze baku (ditulis HANYA oleh `ab4.py freeze`; `freeze_targets()` `ab4.py:1077-1084` mengambil semua berkas di `contract_ab4/facts`, `contract_ab4/queries`, `controller_ab4/answers`, `doc_ud1/source` + berkas alat). Isi yang diharapkan:
   - `contract_ab4/facts/{M,R-10,R-11,R-12,W}.md`, `contract_ab4/queries/Q.md`, `controller_ab4/answers/Q_key.md`;
   - `doc_ud1/source/{bab-01..bab-06,meta,revisi,urutan}.md` (+ `fig-FG-1.png`, `fig-FG-2.png` hanya bila varian gambar dipilih);
   - berkas alat HARNESS4.
   Jangan menaruh berkas lain di empat folder itu sebelum freeze. Uji sebelum W: `ab4.py freeze --check` exit 0 dan `sha256sum -c controller_ab4/freeze.sha256` exit 0.
8. Penyelesaian kunci: sesudah run M dan dry-run R08, tulis `controller_ab4/answers/Q_key_resolved.md` menurut Q_key, salin freeze ke `freeze_preQ.sha256`, `ab4.py freeze --force` dengan keputusan tercatat, catat sha256 `Q_key_resolved.md` di `decisions.md` sebelum kueri pertama.
9. Hanya bila MCP-D1 menyediakan alat aset sebelum freeze (varian gambar):
   ```
   S=C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/2026-10-19_nearlink-research-plan/output; D=C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/doc_ud1/source; sed -n '86,113p' $S/manuscript.md > $D/bab-03.md && cp -p $S/figures/fig_SIM-R12-sheet-glif-provenans_FM-3.png $D/fig-FG-1.png && cp -p $S/figures/fig_SIM-R12-label-status-verifikasi_FM-3.png $D/fig-FG-2.png && sha256sum $D/bab-03.md $D/fig-FG-*.png
   ```
   Lalu ganti paragraf "Gambar:" di `urutan.md` (gambar FG-1, FG-2 dipasang di FM.3 sesuai baris apparatus) dan tambahkan dua figur ke acuan §7.3. Sha16 PNG wajib cocok dengan sumber `:111` (`79d2f9359262b3ff`) dan `:113` (`99bcc072d5d944b4`). Bila varian tanpa gambar tetap: brief 09 dok §1 ("gambar `fig-*.png`") dan §3 langkah 4 wajib diselaraskan (P4-2).
10. Penyerahan: W `facts/W.md`; run R `facts/R-<i>.md` saja; M `facts/M.md` (prompt menyebut misi ab4, `m/`, `lapkerja-m`); sesi Q `queries/Q.md`; DB/DA `ud1/source/`; WD `ud1/wd/`.

## 9. Risiko dan keputusan untuk controller

| ID | Risiko | Mitigasi / keputusan yang diminta |
|---|---|---|
| RK4F-1 | Path U-DOC berbeda dari daftar penugasan (`contract_ab4/doc/source.md`, `doc/revision.md`) | Ditulis di `doc_ud1/source/` (`bab-NN.md`, `urutan.md`, `meta.md`, `revisi.md`) karena protokol §9/§10 DOCPREP butir 2-4, brief 09 dok §1/§5, dan `ab4.py:61`, `:917`, `:1080` semuanya memakai path itu; menaruh bahan di `contract_ab4/` juga akan membuka bahan U-DOC ke sesi U-REP. Controller mencatat keputusan ini |
| RK4F-2 | Tenant `KORPUS-LANJUTAN-1011` (26 baris state.db) pernah menjadi token lembar uji 2 | Diterima seperti protokol §7.4; pemakaian ingatan diperiksa saat ajudikasi KF |
| RK4F-3 | Keakraban misi R-12 (440 baris `webloc`; pin rubrik 15) | Isi hanya dari lembar; fakta di laporan yang tidak ada di lembar dicatat |
| RK4F-4 | Status penutupan R-12 `complete` adalah skenario (sumber tanpa medan status) | Q1/Q2 menilai nilai tersimpan; label [skenario] di lembar dan Q_key |
| RK4F-5 | R-10 status kepala needs-review padahal isi menyebut promosi selesai | Lembar mengikuti kepala (pola R-8 r3); Hermes bisa memetakan beda; Q2 menilai nilai tersimpan |
| RK4F-6 | Istilah Q3 hanya 2 fakta (ab3: 3) | Kunci tetap tunggal; dicatat sebagai keterbatasan keterbandingan |
| RK4F-7 | Varian tanpa gambar dipilih dari keadaan kode saat ini; MCP-D1 masih bisa menambah alat aset | §8 langkah 9; keputusan dikunci sebelum freeze; gambar tidak boleh hanya di satu arm |
| RK4F-8 | File tulisan alat Write: byte-identitas W, M, dan cuplikan belum dibuktikan sha | §8 langkah 3-4 wajib sebelum freeze; jalur pemulihan `cp`/`sed` tersedia |
| RK4F-9 | Revisi RV-1/RV-2 mengubah angka isi (skenario) di dokumen yang bergaya klien | Label [skenario] di `revisi.md`; dokumen uji tidak dikirim ke klien |
| RK4F-10 | Owner R-12 = owner W (`gsp-worker-fast`) | Tidak memengaruhi Q4 (`gsp-librarian`); dicatat |
| RK4F-11 | Manifest digabung (penugasan: satu berkas `09_r4_facts_manifest.md`; protokol §10 menyebut dua manifest `10_*`) | Mengikuti penugasan controller; isi DOCPREP ada di §7 |

## 10. Batas

- Sesi analis tanpa shell: sha256, CR, dan byte-identitas tidak dihitung di sini; keberadaan berkas dibuktikan hasil Write, hitung baris lewat Grep. Angka Grep = jumlah baris cocok, bisa beda tipis dengan `grep -a -c`.
- Cadangan R-10/R-11 tidak dicari (utama lolos); kartu sekunder R-12 tidak ada di sumber selain `t_be3fd6ab`.
- Kunci Q bergantung pada isi run 1-7; run gagal berarti kunci terkait diselesaikan apa adanya dan dicatat.
- Nama alat MCP di Q.md mengikuti brief 09 laporan §7; bila MCP-D1 mengganti nama, penyelaras P4-2 menyamakan Q.md sebelum freeze.
