---
task_id: doc_artifact_studio
task_row: FACTS2 (D-421 decisions.md:426; daftar research/13_contract_efficiency_protocol_r2.md §5.5 butir 1-10; brief hermes_trial/05_contract_retrial_brief.md)
date: 2026-10-31
agent: data-analyst
type: data
confidence: HIGH untuk fakta sumber (dibaca langsung, baris dirujuk di §4) dan cek kriteria 7 (Grep atas state.db profil, keluaran dikutip di §2); MEDIUM untuk desain kunci Q (id konkret baru ada setelah run)
inputs: decisions.md D-421 (:426), D-419 (:424); research/13 §5 (utuh), §6.4, §6.7, §7; brief 05 (utuh); manifest 04 (utuh); contract_ab/facts/{W,R-1,R-2,R-3}.md, queries/Q.md, answers/Q_key.md (pola); laporan 04 :1-8; STUDIO-AGENT-GUIDE.md :1821 (pola owner), :2024-2042 (R22); tiga laporan sumber + cadangan R-4 (baca saja); state.db profil gsp-master01 (Grep baca saja)
status: complete
---

# Manifest lembar fakta uji ulang dan kunci Q (FACTS2)

## 1. Berkas

Ditulis dengan alat Write. Tidak ada tulisan ke workspace Hermes maupun ke repo selain manifest ini.

| Berkas (akar `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/`) | Pembaca | Isi ringkas | Fakta |
|---|---|---|---|
| `contract_ab2/facts/W.md` | Hermes (run W) | Salinan byte-identik `contract_ab/facts/W.md` (LF, satu baris baru di akhir, tanpa spasi ekor; satu-satunya karakter non-ASCII `§`). Sha wajib = D-404 `884dc89f...9138` (dicek controller, §7 langkah 3) | 14 (W-F01..W-F14), tidak dinilai |
| `contract_ab2/facts/R-4.md` | Hermes (R4B, R4A) | **Cadangan** §5.4: purge langganan notifikasi webui STA13-E1PURGE, `gsp-system-manager`, `t_4ead3a56`; basal 58/81, cadangan .sql sha256 `1a36d984...7cd9`, uji restore, DELETE 81, short check 3/3 PASS; complete | 50 (R4-F01..R4-F50) |
| `contract_ab2/facts/R-5.md` | Hermes (R5A, R5B) | Verifikasi P4a BLENDER-1012, `gsp-thinker` (peran gsp-verifier), `t_6f30d9fc`; CHECK 1-7 (PASS 1,3,6,7; FAIL 2,4,5); vonis gerbang; FIX-A..D; VERDICT FAIL; status penutupan complete [skenario] | 49 (R5-F01..R5-F49) |
| `contract_ab2/facts/R-6.md` | Hermes (R6B, R6A) | Laporan akhir rev2 WEBUI-MC-1028, `gsp-worker` (peran document-writer), `t_4ca26027`; D-17 empat default PROVISIONAL; metrik U-1..U-6; gerbang G-A..G-F; PARKED; status SELESAI; rujukan bukti ke R-4 [skenario] | 44 (R6-F01..R6-F44) |
| `contract_ab2/facts/M.md` | Hermes (run M) | U-14 sintetis: glosarium latihan, owner `gsp-librarian`, `t_0c0d0e0f`, `lapkerja-m`; M2 catatan verifikasi agen kedua; M3 needs-review | 9 (M-F01..M-F09), tidak dinilai KE-1..KE-7 |
| `contract_ab2/queries/Q.md` | Hermes (sesi Q saja) | Q1..Q5 untuk misi ab2, ruang cari per arm (r4a/r5a/r6a; w/m/r4b/r5b/r6b dikecualikan dari arm A), urutan arm, `trial-log qmark/answer` | 5 kueri |
| `controller_ab2/answers/Q_key.md` | Controller saja | Kunci simbolik, ruang kunci arm B 5 dokumen, aturan penyelesaian mekanis, normalisasi, presisi/recall/correct, `expected_sha256` | - |

Jumlah fakta lawan acuan D-404 (48/48/40, pita ±15% = 41-55 / 41-55 / 34-46): R-4 50 (+4,2%), R-5 49 (+2,1%), R-6 44 (+10,0%). Ketiganya dalam pita.

Format lembar: daftar bernomor polos dengan id fakta, kelompok `F-awal` / `F-upd1` / `F-upd2`, tanpa judul atau kepala laporan asli, bukan MD laporan dan bukan JSON. Status dalam bahasa biasa; pemetaan ke enum dibiarkan ke Hermes (KE-6). Kalimat "Cara pakai" identik dengan lembar 04.

Penyesuaian C-11 (path sumber tidak diberikan): lembar menyebut kode misi dan subfolder relatif (`verification/e1_sub_purge/`, `verification/`, `output/`), tanpa nama folder misi bertanggal dan tanpa nama berkas laporan. Nama berkas revisi 1 R-6 (`WEBUI-MC-1028-laporan-akhir.md`) sengaja tidak dimasukkan ke R6-F11 (hanya ukuran + sha16), karena akan membuka pola nama berkas sumber. Ini beda dengan lembar 04 yang memuat folder misi asal.

## 2. Cek kriteria 7 (§5.5 butir 1) dan penggantian R-4

Dijalankan analis dengan alat Grep (ripgrep, mode hitung baris, atas berkas biner) pada `C:/Users/TRIAL/AppData/Local/hermes/profiles/gsp-master01/state.db` dan `state.db-wal`.

| Pola | state.db | state.db-wal | Keputusan |
|---|---|---|---|
| `CS2-patch-laporan` | 0 | 0 | - |
| `t_c6721813` (kartu R-4 kandidat) | **206** | 0 | **R-4 kandidat GAGAL** |
| `blender-mcp-expert-skill/verification/verifier-report` (juga `\\`, dan pemisah apa pun `.{1,3}`) | 0 | 0 | R-5 lolos |
| `t_6f30d9fc` | 0 | 0 | R-5 lolos |
| `WEBUI-MC-1028-laporan-akhir-rev2`, `laporan-akhir-rev2`, `WEBUI-MC-1028-laporan-akhir` | 0 | 0 | R-6 lolos |
| `t_4ca26027` | 0 | 0 | R-6 lolos |
| `E1PURGE_laporan`, `t_4ead3a56` (cadangan R-4) | 0 | 0 | **cadangan R-4 lolos, dipakai** |

Konteks 206 kemunculan `t_c6721813` (contoh hasil `-o`): papan RAFAI-1004 yang diorkestrasi gsp-master01 (`[10-05 09:14:56] t_c6721813 | done | gsp-skill-creator | by gsp-skill-manager`), daftar kartu closeout, dan baris riwayat skill orkestrasi `1.8.3 (2026-10-05, kartu t_c6721813): aturan 15 anti crash-loop review pada kartu penulis`. Jadi isi R-4 kandidat (aturan 15) ada di skill yang dibaca profil ini. Berkas sumbernya tidak pernah dibuka (basename 0), tetapi §5.5 butir 1 berbunyi "bila ada kemunculan, pakai cadangan". Aturan itu diikuti persis: R-4 = `2026-10-13_serah-terima-asignor/verification/e1_sub_purge/E1PURGE_laporan.md`.

Kemunculan tingkat misi (informatif, BUKAN kriteria 7 yang hanya basename + cardId): `SERAH-TERIMA-ASIGNOR|serah-terima-asignor|STA13-E1PURGE` 70; label `E1PURGE` 1 (docstring skrip: "PARKED exit 4 sah (preseden E1SPEC/E1PURGE 14-10)"); `BLENDER-1012|blender-mcp-expert-skill` 47; `WEBUI-MC-1028|webui-mission-control-1028` 5 (contoh: daftar kartu `WEBUI-MC-1028 W0-4`, catatan skill `kartu t_9bfdc7d7 WEBUI-MC-1028 W4-V2`). Profil mengenal ketiga misi, tetapi tidak pernah membuka ketiga laporan ataupun kartunya. Ini risiko sisa RK-F1 (§8).

Ciri cadangan R-4 terhadap kriteria §5.3: laporan kerja nyata bertanggal 2026-10-14 (K1 terpenuhi); bukan misi uji 1 dan alurnya (purge DB notifikasi) tidak sama dengan R-1..R-3 (K2); peran pelaksana pendek dengan short check (K3); **85 baris (Read :1-85), di luar pita ~50** (K4 menyimpang; protokol sudah menerima 84 baris untuk cadangan ini); cardId berpola, owner lolos pola `huruf kecil, angka, . _ -` (guide :1821), sha256 cadangan untuk Q5 (K5); **owner `gsp-system-manager` sama dengan owner R-3 lama** (K6 "bila mungkin" tidak terpenuhi); K7 lolos.

## 3. Fakta "tidak ada di sumber" dan fakta [skenario]

Fakta "tidak ada di sumber" (jenis `absen`, ditulis sebagai fakta tersendiri):
- R-4 (5): jam mulai/selesai (R4-F06); vonis verifikator akun terpisah (R4-F45); isu terbuka (R4-F47); cid dan commit (R4-F48); ukuran/sha berkas JSON jejak dan skrip (R4-F49).
- R-5 (4 + 1 sebagian): jam run (R5-F07); baris status laporan (R5-F44); cid dan commit (R5-F48); ukuran laporan dan sha16 REPORT.md (R5-F49); sebagian: nomor kartu FIX (R5-F47, jenis `manual`).
- R-6 (3): jam penulisan (R6-F07); cid (R6-F43); ukuran/sha laporan rev2 (R6-F44).

Fakta [skenario] (ketentuan uji, bukan isi sumber):
- initiator `gsp-master01` (R4-F03, R5-F04, R6-F04; brief §4).
- Waktu lapor = jam mesin +07:00 (R4-F05, R5-F06, R6-F06).
- Status butir dan status laporan S1/S2 (R4-F10..F12, R5-F14..F16, R6-F13..F15), karena sumber hanya memuat keadaan akhir.
- Kode butir kerja R4-B*, R5-B*, R6-B* adalah pengelompokan analis atas seksi sumber (sama dengan R1-F09 lama, yang dikelompokkan dari `:11-36`). Tidak diberi label [skenario] agar setara dengan lembar 04.
- Status penutupan R-5 = complete (R5-F45), karena sumber hanya memuat VERDICT (R5-F44).
- Rujukan R-6 ke R-4 (R6-F41, R4-F50) untuk Q5. Nilai = sha256 berkas cadangan yang ada di sumber R-4 `:27`. Protokol menyebut "sha16". Sumber memuat sha256 penuh, jadi lembar memakai nilai penuh apa adanya, dan pengecekan memakai awalan 16 heksa `1a36d984eb3e8c86`. Alasan rujukan (pola cadangan teruji, acuan kartu sanitasi `t_8f460ad7`) adalah rekaan skenario.
- Owner R-6 dipetakan ke `gsp-worker` (nilai sumber `:6`, lolos pola) dengan peran sebagai fakta terpisah R6-F05 (pola D-406). R-5: owner `gsp-thinker`, peran gsp-verifier di R5-F05.
- R-6 memuat dua penanda status di sumber: kepala `status: SELESAI - ...` (`:7`) dan PROVISIONAL per gerbang serta "Misi ini tidak dinyatakan lulus" (`:31`). Lembar memakai kepala sebagai status laporan (R6-F34) dan mencatat penanda lain sebagai fakta tersendiri (R6-F23, R6-F35), tanpa menafsir ulang. Pola ini sama dengan R3-F28 lama.

## 4. Jejak fakta ke sumber (untuk cek KF dan audit; tidak diberikan ke Hermes)

Path relatif `C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/`.

| Lembar | Fakta: baris sumber |
|---|---|
| R-4 `2026-10-13_serah-terima-asignor/verification/e1_sub_purge/E1PURGE_laporan.md` | F01 `:1`,`:42`; F02 `:1`; F03 `:3`; F04 `:3`, path, `:66`; F05 `:3`,`:25`,`:43`; F06 absen (hanya tanggal `:3`); F07 `:4-6`; F08 `:9`,`:13-14`; F09 pengelompokan §1-§6 `:9-64`; F10-F12 skenario; F13 `:13`; F14 `:14`; F15 `:13`,`:44`; F16 `:16-17`; F17 `:17-18`; F18 `:18-19`; F19 `:19`; F20 `:23-26`; F21 `:26-27`; F22 `:28`; F23 `:32-33`; F24 `:33-34`; F25 `:35-37`; F26 `:37-38`; F27 keadaan akhir `:61-64`; F28 `:42-43`; F29 `:43-44`; F30 `:13`,`:44-45`; F31 `:46-47`; F32 `:20-21`; F33 `:49-53`; F34 `:53-54`; F35 `:55-57`; F36 `:61`; F37 `:62-63`; F38 `:64`; F39 `:59-64` (tidak ada baris VERDICT menyeluruh di seluruh berkas); F40 `:68-70`; F41 `:71-74`; F42 `:78-79`; F43 `:80-82`; F44 `:6-7`; F45 `:6-7` (hasil verifikator tidak ada); F46 `:83-84`; F47 seluruh berkas tanpa seksi isu terbuka; F48 seluruh berkas; F49 `:28`,`:68-74` (tanpa ukuran/sha); F50 skenario (nilai dari `:27`) |
| R-5 `2026-10-12-blender-mcp-expert-skill/verification/verifier-report.md` | F01 `:1`,`:5`; F02 `:1`, path, `:9-14`; F03 `:3`; F04 `:3`; F05 `:3`; F06 `:4`; F07 absen (`:4` tanpa jam; cap waktu `:63-67`); F08 `:4`; F09 `:5`; F10 `:5`; F11 `:9-11`; F12 `:12-14`; F13 pengelompokan `:7-81`; F14-F16 skenario; F17 `:16-18`; F18 `:20-22`; F19 `:26-27`; F20 `:28-29`; F21 `:30`; F22 `:32`; F23 `:32`; F24 `:34-36`; F25 `:36`; F26 `:38-40`; F27 `:41`; F28 `:42`; F29 `:43`; F30 `:45-47`; F31 `:48`; F32 `:50-52`; F33 `:54-56`; F34 `:56`; F35 `:57`; F36 `:57`; F37 keadaan akhir; F38 `:61-64`; F39 `:63-64`; F40 `:65-67`; F41 `:69-79`; F42 `:81`; F43 `:83-85`; F44 seluruh berkas tanpa baris STATUS; F45 skenario; F46 `:32`,`:43`,`:48`,`:56`; F47 `:81`; F48 seluruh berkas; F49 `:4` (REPORT.md tanpa sha) dan seluruh berkas |
| R-6 `2026-10-28_webui-mission-control-1028/output/WEBUI-MC-1028-laporan-akhir-rev2.md` | F01 `:4`,`:7`,`:15`; F02 `:2`, path; F03 `:3`,`:20`; F04 `:6`; F05 `:6`; F06 `:5`; F07 absen (`:5` tanpa jam; rentang `:191`); F08 `:13`,`:21`; F09 `:22`,`:69-70`; F10 `:10`,`:116`; F11 `:24`; F12 pengelompokan §3-§12; F13-F15 skenario; F16 `:23`,`:54-59`; F17 `:61`; F18 `:80-84`; F19 `:85-89`; F20 `:97-101`; F21 `:103`; F22 `:109-114`; F23 `:122-129`; F24 `:137`; F25 `:139`; F26 `:141`; F27 `:149`; F28 `:156`,`:159`,`:165`,`:168`,`:171`; F29 `:178`; F30 `:188`; F31 `:193`; F32 keadaan akhir; F33 `:191`; F34 `:7`,`:31`; F35 `:31`,`:131`; F36 `:197-201`; F37 `:205`; F38 `:211-217`; F39 `:228`; F40 `:234-251`; F41 skenario; F42 `:232`; F43 seluruh berkas; F44 seluruh berkas |

Penyederhanaan yang disengaja (rincian berikut tidak menjadi fakta, jadi tidak ditagih di KF):
- R-6 F28 memilih 5 dari 20 baris tabel uji fungsional (`:153-172`). F38 memilih 5 dari 16 baris register bukti (`:211-226`). F36/F37 meringkas §9/§10. Seksi 3.1 kondisi ukur (versi Chromium dan lain-lain), §0 empat pernyataan hasil (isinya sudah tertutup F19-F23), §8 baris gelombang W0-W4 dan Remediasi luar rantai juga tidak dijadikan fakta. Isi Lampiran A dijadikan satu fakta prosedur (F40), tanpa 10 butir.
- R-5: kolom "Metode"/"Cakupan%" tabel akurasi (`:61-67`) tidak menjadi fakta. Daftar halaman overlap dimuat tanpa xref dan jumlah kata per halaman (`:47`).
- R-4: tabel hitung pra/pasca (`:11-14`) dipecah menjadi F13-F15 dan F30.

## 5. Tabel token KE-7 (dibekukan sebelum uji; C-09, §6.7)

Aturan pakai:
- Fakta cocok bila setiap token di kolom DAN ditemukan dalam teks yang dinormalisasi (§6.7: NFC, spasi diringkas, `*` `` ` `` `_` dibuang, huruf kecil). Normalisasi yang sama diterapkan pada token, jadi `isi_identik` dibandingkan sebagai `isiidentik`.
- Kolom ATAU berisi padanan sah untuk token DAN dengan format `token => padanan1 / padanan2`. Token angka juga dicocokkan dalam bentuk digit saja; kecocokan yang hanya lewat bentuk digit diperiksa manual.
- `manual` = diperiksa pemeriksa 100%. `absen` = tidak masuk penyebut; diperiksa bahwa nilai tidak dikarang.
- Status S1/S2 [skenario] diberi jenis `manual` dan dicek pada revisi atau langkah terkait. Untuk arm B, status S1/S2 hanya ada di revisi awal (temuan D-420).
- Token yang juga muncul di fakta lain ditandai `*`: kecocokannya wajib diajudikasi ke fakta yang benar.

### R-4

| fact_id | kelompok | token wajib (DAN) | token alternatif (ATAU) | jenis |
|---|---|---|---|---|
| R4-F01 | F-awal | kanban_notify_subs*; STA13-E1PURGE | - | literal |
| R4-F02 | F-awal | t_4ead3a56 | - | literal |
| R4-F03 | F-awal | gsp-system-manager; gsp-master01 | - | literal |
| R4-F04 | F-awal | SERAH-TERIMA-ASIGNOR-1013; e1_sub_purge | - | literal |
| R4-F05 | F-awal | 2026-10-14 | 2026-10-14 => 14-10-2026 / 14 Oktober 2026 | literal |
| R4-F06 | F-awal | - | - | absen |
| R4-F07 | F-awal | e1_adapter_spec.md; F.5* | - | literal |
| R4-F08 | F-awal | include_archived=False; boards/gsp | - | literal |
| R4-F09 | F-awal | R4-B1; R4-B4 | - | literal |
| R4-F10 | F-awal | - | - | manual |
| R4-F11 | F-awal | - | - | manual |
| R4-F12 | F-upd1 | - | - | manual |
| R4-F13 | F-upd1 | 1192 | - | angka |
| R4-F14 | F-upd1 | - | - | manual |
| R4-F15 | F-upd1 | 1111* | - | angka |
| R4-F16 | F-upd1 | t_90d2fc5f; E1SPEC | - | literal |
| R4-F17 | F-upd1 | rafif01; 62 | - | literal |
| R4-F18 | F-upd1 | KORPUS-LANJUTAN-1011; TIKET-WAKE-1011; notify+wake | - | literal |
| R4-F19 | F-upd1 | - | - | manual |
| R4-F20 | F-upd1 | backup_webui_subs_20261014_004209.sql*; 26.172 | 26.172 => 26172 | literal |
| R4-F21 | F-upd1 | 1a36d984eb3e8c869d49ae5c75101a1ee62095eac74c3e15a94d1be7cc467cd9* | - | literal |
| R4-F22 | F-upd1 | precheck_and_backup_20261014_004209.json* | - | literal |
| R4-F23 | F-upd1 | checkpoint WAL | - | literal |
| R4-F24 | F-upd1 | isi_identik*; 12 kolom | 12 kolom => 12 column | literal |
| R4-F25 | F-upd1 | executescript | - | literal |
| R4-F26 | F-upd1 | 74 MB; restore_test_20261014_004209 | 74 MB => 74MB | literal |
| R4-F27 | F-upd2 | - | - | manual |
| R4-F28 | F-upd2 | DELETE FROM kanban_notify_subs; rowcount | - | literal |
| R4-F29 | F-upd2 | purge_report_20261014_004220.json* | - | literal |
| R4-F30 | F-upd2 | 1111/1111 | 1111/1111 => 1111 / 1111 | angka |
| R4-F31 | F-upd2 | uri=ro | - | literal |
| R4-F32 | F-upd2 | webui_pending_terminal | - | literal |
| R4-F33 | F-upd2 | platforms.webui; 40+ | - | literal |
| R4-F34 | F-upd2 | E1GW* | - | literal |
| R4-F35 | F-upd2 | add_notify_sub; 11790 | - | literal |
| R4-F36 | F-upd2 | - | - | manual |
| R4-F37 | F-upd2 | 81==81 | 81==81 => 81 == 81 | angka |
| R4-F38 | F-upd2 | 58/81 | 58/81 => 58 dari 81 | angka |
| R4-F39 | F-upd2 | - | - | manual |
| R4-F40 | F-upd2 | backup_webui_subs_20261014_004209.sql*; precheck_and_backup_20261014_004209.json*; purge_report_20261014_004220.json* | - | literal |
| R4-F41 | F-upd2 | sta13_e1purge_precheck.py; sta13_e1purge_schema.py | - | literal |
| R4-F42 | F-upd2 | purge_stale_done_notify_subs | - | literal |
| R4-F43 | F-upd2 | watch_cards.py; VONIS-A L1 | - | literal |
| R4-F44 | F-upd2 | complete; GS-6 | complete => selesai | literal |
| R4-F45 | F-upd2 | - | - | absen |
| R4-F46 | F-upd2 | E1WS | - | literal |
| R4-F47 | F-upd2 | - | - | absen |
| R4-F48 | F-upd2 | - | - | absen |
| R4-F49 | F-upd2 | - | - | absen |
| R4-F50 | F-upd2 | 1a36d984eb3e8c869d49ae5c75101a1ee62095eac74c3e15a94d1be7cc467cd9* | - | literal (dicek di bagian bukti) |

R-4 ringkas: literal 32, angka 5, manual 8, absen 5. Penyebut KF bertoken = 45.

### R-5

| fact_id | kelompok | token wajib (DAN) | token alternatif (ATAU) | jenis |
|---|---|---|---|---|
| R5-F01 | F-awal | P4a; Iron Law | - | literal |
| R5-F02 | F-awal | BLENDER-1012* | - | literal |
| R5-F03 | F-awal | t_6f30d9fc* | - | literal |
| R5-F04 | F-awal | gsp-thinker; gsp-master01 | - | literal |
| R5-F05 | F-awal | gsp-verifier; P3b* | - | literal |
| R5-F06 | F-awal | 2026-10-13; SE Asia Standard Time | 2026-10-13 => 13-10-2026 / 13 Oktober 2026 | literal |
| R5-F07 | F-awal | - | - | absen |
| R5-F08 | F-awal | 77711c969666c62e; dfc93e42f41bbc07; 127.613 | 127.613 => 127613 | literal |
| R5-F09 | F-awal | datum_figur*; entity-match* | - | literal |
| R5-F10 | F-awal | 652704721*; BLENDER-1012-P4a-t_6f30d9fc-20261013 | - | literal |
| R5-F11 | F-awal | bind_audit.py; scan-pdf-pypdf.txt | - | literal |
| R5-F12 | F-awal | legibilitas_void.py; middot_host_reg.py | - | literal |
| R5-F13 | F-awal | R5-B1; R5-B4 | - | literal |
| R5-F14 | F-awal | - | - | manual |
| R5-F15 | F-awal | - | - | manual |
| R5-F16 | F-upd1 | - | - | manual |
| R5-F17 | F-upd1 | DATUM-36; 26/0/1 | - | literal |
| R5-F18 | F-upd1 | bind-diag-t0d5afd71; 0.526* | - | literal |
| R5-F19 | F-upd1 | AN-40; _known() | - | literal |
| R5-F20 | F-upd1 | AN-70; upstream | - | literal |
| R5-F21 | F-upd1 | para 450; E-07* | - | literal |
| R5-F22 | F-upd1 | AN-7x; TERUKUR | - | literal |
| R5-F23 | F-upd1 | audit_docx | - | literal |
| R5-F24 | F-upd1 | 2154; x=7597 | - | literal |
| R5-F25 | F-upd1 | G-RAIL-2; 11906x16838 | - | literal |
| R5-F26 | F-upd1 | 31/49; p90=67 | - | literal |
| R5-F27 | F-upd1 | fbe6228777e7; para 599 | - | literal |
| R5-F28 | F-upd1 | FAIL-C-2; 4622 | - | literal |
| R5-F29 | F-upd1 | build-log | build-log => build log | literal |
| R5-F30 | F-upd1 | DEFECTS=8*; allow-void | - | literal |
| R5-F31 | F-upd1 | 166 mm; 128 mm; 242 | 166 mm => 166mm; 128 mm => 128mm | literal |
| R5-F32 | F-upd1 | odttf; lastRenderedPageBreak=51 | - | literal |
| R5-F33 | F-upd1 | vakum*; SPK-002* | - | literal |
| R5-F34 | F-upd1 | butir 8*; 0 hyperlink | - | literal |
| R5-F35 | F-upd1 | 163; 137; 139 | - | angka |
| R5-F36 | F-upd1 | 145*; blendkit.com | - | literal |
| R5-F37 | F-upd2 | - | - | manual |
| R5-F38 | F-upd2 | - | - | manual |
| R5-F39 | F-upd2 | 02:40 | - | angka |
| R5-F40 | F-upd2 | 02:25; 02:27 | - | angka |
| R5-F41 | F-upd2 | SG-2 | - | literal |
| R5-F42 | F-upd2 | FIX-A*; FIX-D* | - | literal |
| R5-F43 | F-upd2 | - | - | manual |
| R5-F44 | F-upd2 | - | - | absen |
| R5-F45 | F-upd2 | complete | complete => selesai | literal |
| R5-F46 | F-upd2 | ISU-LINTAS-OWNER* | - | literal |
| R5-F47 | F-upd2 | - | - | manual (bagian absen: nomor kartu FIX) |
| R5-F48 | F-upd2 | - | - | absen |
| R5-F49 | F-upd2 | - | - | absen |

R-5 ringkas: literal 35, angka 3, manual 7, absen 4. Penyebut KF bertoken = 45.

### R-6

| fact_id | kelompok | token wajib (DAN) | token alternatif (ATAU) | jenis |
|---|---|---|---|---|
| R6-F01 | F-awal | W4-6R; 9022 | - | literal |
| R6-F02 | F-awal | WEBUI-MC-1028* | - | literal |
| R6-F03 | F-awal | t_4ca26027 | - | literal |
| R6-F04 | F-awal | gsp-worker; gsp-master01 | - | literal |
| R6-F05 | F-awal | document-writer | - | literal |
| R6-F06 | F-awal | 2026-10-29 | 2026-10-29 => 29-10-2026 / 29 Oktober 2026 | literal |
| R6-F07 | F-awal | - | - | absen |
| R6-F08 | F-awal | 1e7d979a6d1b1f5d5ef31beaa91142932d1bcd05; dup-9022 | - | literal |
| R6-F09 | F-awal | 4199206eda8ef6a5; 74a3bd133f7d0239; b7ddee5e48042a9f | - | literal |
| R6-F10 | F-awal | mc1028r2_aritmetika.py | - | literal |
| R6-F11 | F-awal | deb5af6329175bf1; 34.559 | 34.559 => 34559 | literal |
| R6-F12 | F-awal | R6-B1; R6-B4 | - | literal |
| R6-F13 | F-awal | - | - | manual |
| R6-F14 | F-awal | - | - | manual |
| R6-F15 | F-upd1 | - | - | manual |
| R6-F16 | F-upd1 | D-V8; D-V4; D-V2 | - | literal |
| R6-F17 | F-upd1 | D-V5; 29,3 MB* | 29,3 MB => 29.3 MB | literal |
| R6-F18 | F-upd1 | 6.703; 1.953 | - | angka |
| R6-F19 | F-upd1 | 2.282; 2.719; 0,8889* | - | angka |
| R6-F20 | F-upd1 | -480,8; -255,0 | - | angka |
| R6-F21 | F-upd1 | 11.297; 2.219 | - | angka |
| R6-F22 | F-upd1 | sus-basal.json; sus-pasca.json* | - | literal |
| R6-F23 | F-upd1 | G-F; MERAH* | - | literal |
| R6-F24 | F-upd1 | overlay-focus; sessionSearch; mc1028_runner_final2.py | - | literal |
| R6-F25 | F-upd1 | gear; appearance | - | literal |
| R6-F26 | F-upd1 | design/01 | - | literal |
| R6-F27 | F-upd1 | v47-fungsional.jsonl; 24 PASS | - | literal |
| R6-F28 | F-upd1 | 265x28; 6.218 | - | literal |
| R6-F29 | F-upd1 | PARKED*; wait-ack; t_8f460ad7* | - | literal |
| R6-F30 | F-upd1 | 21:46; ca10541* | - | literal |
| R6-F31 | F-upd1 | 15.757; aa9dc83; 10842 | 15.757 => 15757 | literal |
| R6-F32 | F-upd2 | - | - | manual |
| R6-F33 | F-upd2 | 04:10; 04:20 | - | angka |
| R6-F34 | F-upd2 | complete | complete => selesai | literal |
| R6-F35 | F-upd2 | belum lulus | - | literal |
| R6-F36 | F-upd2 | test_mobile_layout.py; test_russian_locale.py; 9012 | - | literal |
| R6-F37 | F-upd2 | 6.019; 6.021; scripted-only | - | literal |
| R6-F38 | F-upd2 | 0b2aac5019883e1a; badac091bc8ec493; 45ec8173d92fb584 | - | literal |
| R6-F39 | F-upd2 | 4410; 9341 | - | angka |
| R6-F40 | F-upd2 | Lampiran A; 2,5 | 2,5 => 2.5 | literal |
| R6-F41 | F-upd2 | - | - | manual (arm B: entri `refs[]` record ke blok R4B; arm A: rujukan teks ke baris R4A; nilai `1a36d984eb3e8c86` boleh tertulis) |
| R6-F42 | F-upd2 | t_8f460ad7*; lantai API | - | literal |
| R6-F43 | F-upd2 | - | - | absen |
| R6-F44 | F-upd2 | - | - | absen |

R-6 ringkas: literal 30, angka 6, manual 5, absen 3. Penyebut KF bertoken = 41.

W dan M tidak dinilai KE-7 (§7.2; W pemanasan), jadi tidak diberi token.

## 6. Desain Q1..Q5 (rinci di `controller_ab2/answers/Q_key.md`)

| Q | Kueri | Kunci diniatkan arm A | Kunci diniatkan arm B | Fakta penopang |
|---|---|---|---|---|
| Q1 | status laporan kartu `t_4ca26027` di misi ab2 | berkas laporan r6a; status selesai/complete | `lapkerja-r6b`; `complete` | R6-F03, R6-F34 |
| Q2 | laporan berstatus complete di misi ab2 | laporan r4a, r5a, r6a | `lapkerja-r4b`, `-r5b`, `-r6b`; `lapkerja-w` (blocked, W-F12) dan `lapkerja-m` (needs-review, M-F08) keluar | R4-F44, R5-F45, R6-F34 |
| Q3 | paragraf memuat istilah `PARKED` | baris di laporan r6a yang memuatnya | blok `lapkerja-r6b` yang memuatnya | R6-F29, R6-F30, R6-F31 |
| Q4 | laporan owner `gsp-thinker` di misi ab2 | laporan r5a | `lapkerja-r5b` | R5-F04 |
| Q5 | bagian bukti yang dirujuk laporan `t_4ca26027` | baris laporan r4a bermuatan `1a36d984eb3e8c86` yang ditunjuk r6a | `lapkerja-r4b#pid` dari `refs[]` `lapkerja-r6b` | R6-F41, R4-F50, R4-F21 |

Pemilihan istilah Q3. `PARKED` dipilih karena: (a) hanya muncul di lembar R-6, tepat 3 baris fakta (Grep `(?i)\bparked\b` atas `contract_ab2/facts/`: R-6.md :38, :39, :40; W, M, R-4, R-5 = 0), setara dengan 3 fakta istilah Q3 lama; (b) satu token tanpa titik atau garis bawah, sehingga aman untuk R22 konfigurasi `simple` (guide :2024-2026). Kandidat yang ditolak: `mc1028_runner_final2.py` (titik dan garis bawah, pemecahan token tidak pasti), `#sessionSearch` dan `overlay-focus` (hanya 1 kemunculan di sumber), `FOCUS MODE` (dua kata, mudah dialihbahasakan), `PROVISIONAL` (terlalu banyak fakta). Kunci Q3 dibuat tidak peka huruf (beda dengan Q_key 04 yang peka huruf) agar selaras dengan R22. Alasannya dicatat di Q_key.

Pemeriksaan silang lembar (Grep atas `contract_ab2/facts/`): `gsp-thinker` hanya di R-5 (:10, :11); `t_4ca26027` hanya di R-6 (:9); kata `complete` hanya di R-4 :56, R-5 :57, R-6 :46 (fakta status penutupan); M dan W tidak memuat `complete`. Urutan aman untuk Q5: R4B (order 1) mendahului R6B (order 5), dan R4A (order 2) mendahului R6A (order 6), sehingga rujukan tidak kena `422 CONTRACT_REF_NOT_FOUND`.

Kunci dinilai terhadap keadaan TERSIMPAN sesudah run M dan dry-run R08, sebelum sesi Q. Dokumen misi lama (009-012) tidak masuk ruang kunci (bukti §5.2 butir 5 protokol r2).

## 7. Instruksi controller (perintah yang harus dijalankan)

1. Cek kriteria 7 versi shell, untuk catatan di `decisions.md` (analis sudah menjalankannya dengan Grep; hasil di §2):
   ```
   cd C:/Users/TRIAL/AppData/Local/hermes/profiles/gsp-master01 && for t in CS2-patch-laporan E1PURGE_laporan WEBUI-MC-1028-laporan-akhir-rev2 t_c6721813 t_4ead3a56 t_6f30d9fc t_4ca26027; do printf '%s ' "$t"; cat state.db state.db-wal | grep -a -c -F -- "$t"; done; cat state.db state.db-wal | grep -a -c -E 'blender-mcp-expert-skill.{1,3}verification.{1,3}verifier-report'
   ```
   Diharapkan: `t_c6721813` > 0 (analis: 206 baris), semua lainnya 0. Catat penggantian R-4 ke cadangan E1PURGE sebagai keputusan.
2. Bekukan tiga laporan sumber:
   ```
   cd C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs && sha256sum 2026-10-13_serah-terima-asignor/verification/e1_sub_purge/E1PURGE_laporan.md 2026-10-12-blender-mcp-expert-skill/verification/verifier-report.md 2026-10-28_webui-mission-control-1028/output/WEBUI-MC-1028-laporan-akhir-rev2.md > C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/controller_ab2/freeze_sources.sha256
   ```
3. Bukti byte-identik W:
   ```
   cd C:/Users/TRIAL/AppData/Local/Temp/hermes_trial && sha256sum contract_ab/facts/W.md contract_ab2/facts/W.md
   ```
   Keduanya wajib `884dc89f...9138`. Bila berbeda: `cp contract_ab/facts/W.md contract_ab2/facts/W.md`, lalu ulangi.
4. `freeze.sha256` (berkas daftar: facts W, R-4, R-5, R-6, M + queries Q + Q_key). Taruh di `controller_ab2/`, JANGAN di `contract_ab2/`, karena isinya memuat path Q_key (pelajaran D-416 f):
   ```
   cd C:/Users/TRIAL/AppData/Local/Temp/hermes_trial && sha256sum contract_ab2/facts/W.md contract_ab2/facts/R-4.md contract_ab2/facts/R-5.md contract_ab2/facts/R-6.md contract_ab2/facts/M.md contract_ab2/queries/Q.md controller_ab2/answers/Q_key.md > controller_ab2/freeze.sha256 && sha256sum -c controller_ab2/freeze.sha256
   ```
   Di awal setiap run dan sesi Q: `cd C:/Users/TRIAL/AppData/Local/Temp/hermes_trial && sha256sum -c controller_ab2/freeze.sha256`.
5. Cek mekanis lembar:
   ```
   cd C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/contract_ab2 && grep -c -i -w PARKED facts/*.md; grep -l gsp-thinker facts/*.md; grep -c -E '^[0-9]+\. [A-Z0-9]+-F[0-9]+' facts/*.md
   ```
   Diharapkan: PARKED R-6 = 3, lainnya 0; gsp-thinker hanya `facts/R-5.md`; jumlah W 14, R-4 50, R-5 49, R-6 44, M 9.
6. Pindai rahasia atas `contract_ab2/` dan `controller_ab2/` sebelum diserahkan (berkas tulisan baris ini tidak memuat nilai rahasia maupun path berkas rahasia):
   ```
   cd C:/Users/TRIAL/AppData/Local/Temp/hermes_trial && grep -r -l -F "$(cat C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/trial_internal_secret)" contract_ab2 controller_ab2; echo "exit=$?"
   ```
   Diharapkan: tanpa berkas, exit=1.
7. Penyelesaian kunci: sesudah run M (order 7) dan dry-run R08, tulis `controller_ab2/answers/Q_key_resolved.md` dengan aturan Q_key, lalu catat sha256-nya di `decisions.md` sebelum kueri pertama.
8. Penyerahan: run W `facts/W.md`; run R `facts/R-<i>.md` saja; run M `facts/M.md`; sesi Q `queries/Q.md`.

## 8. Risiko dan catatan untuk keputusan controller

| ID | Risiko | Mitigasi atau keputusan yang diminta |
|---|---|---|
| RK-F1 | Profil gsp-master01 mengenal ketiga misi sumber di tingkat misi (§2: 70/47/5 kemunculan), walau laporan dan kartunya tidak pernah dibuka | Diterima menurut kriteria 7 (basename + cardId). Deteksi pemakaian ingatan: fakta yang tidak ada di lembar tetapi muncul di laporan Hermes, diperiksa pada ajudikasi KF dan dicatat sebagai penyimpangan §10 butir 2 |
| RK-F2 | **W.md byte-identik masih menyebut misi lama** `2026-10-31_hermes-contract-ab` di baris 1, padahal brief 05 menempatkan W di misi ab2 dan melarang membuka misi lama | Sha D-404 mengunci teksnya, jadi lembar tidak disunting. Controller wajib menyebut di prompt W bahwa misi = `2026-10-31_hermes-contract-ab2`, folder `w/` di bawahnya, dan `docKey` `lapkerja-w`, lalu mencatat keputusan itu. Alternatif (butuh keputusan): W baru dengan sha baru, yang memutus ketentuan §5.5 butir 5 |
| RK-F3 | Cadangan R-4 berada di luar pita panjang (85 baris lawan ~50) dan owner-nya sama dengan R-3 lama | Jumlah fakta tetap dalam pita (50). Owner sama tidak memengaruhi Q (Q4 = gsp-thinker). Dicatat sebagai keterbatasan keterbandingan historis |
| RK-F4 | `PARKED` adalah kosakata umum fleet (banyak kemunculan di state.db profil); Hermes bisa memakainya di laporan lain | Kunci Q3 dihitung dari keadaan tersimpan, jadi tidak ada galat kunci; pemakaian di luar R-6 tercatat sebagai selisih niat lawan tersimpan |
| RK-F5 | R-4 memuat tenant `BLENDER-SKILL-1012` (misi R-5) | Tidak dipakai kueri mana pun; tidak memengaruhi kunci |
| RK-F6 | Folder run M diasumsikan `m/` (brief: `<run>/`) | Q.md mengecualikan `m/` dari arm A; bila controller memakai nama lain, Q.md tidak berubah maknanya (draf arm B tetap bukan hasil arm A), tetapi catat nama nyata |
| RK-F7 | R6-F41 (arm B) hanya dapat dinilai lewat `refs[]` terstruktur, bukan teks | Jenis `manual`; diperiksa bersama kunci Q5 |

## 9. Batas

- Sesi analis tanpa shell: sha256 tidak dihitung di sini; keberadaan berkas ditunjukkan oleh hasil Write. Cek kriteria 7 dijalankan dengan Grep (ripgrep) atas berkas biner. Angka adalah jumlah baris yang cocok, bukan jumlah kemunculan mutlak, dan bisa berbeda tipis dengan `grep -a -c` controller.
- Fakta M dan W sintetis seluruhnya dan sudah ditandai di kepala masing-masing lembar.
- Kunci Q bergantung pada apa yang ditulis Hermes di run 1-7. Bila sebuah run gagal, kunci terkait diselesaikan apa adanya (bisa kosong) dan dicatat (aturan kejujuran protokol r2 §10).
