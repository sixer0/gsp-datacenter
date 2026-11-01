Halo Hermes. Ini uji coba ketiga laporan kerja agen. Pada uji ulang, jalur Studio andal, tetapi biaya menulisnya lebih tinggi daripada MD, terutama karena draf JSON ditulis ulang penuh tiap langkah. Jalur baru di bawah menyasar biaya itu. Ukur dengan jujur, dan katakan apa adanya bila masih merepotkan.

Bila alat tidak tersedia atau berbeda dari brief ini, catat sebagai friksi; jangan mengakalinya.

## 1. Yang berubah sejak uji ulang

1. **Laporan = MD biasa**; alat mengonversinya ke kontrak Studio di memori, tanpa blok JSON. Kepala = baris `Kunci: nilai` sebelum `##` pertama: `mission`, `docKey`, `Status` wajib (draft, complete, partial, blocked, needs-review), `ReportedAt` wajib (`YYYY-MM-DD`), bila ada `Owner`, `Initiator`, `TaskRef`, `Verdict`, `CardIds`, `basis`. Bab `##`: Ringkasan, Rincian kerja, Bukti, Isu terbuka, Langkah berikut; opsional Referensi, Rujukan.
2. **Butir kerja dan bukti = tabel**, bukan daftar: kolom `key`, `status` wajib; opsional `judul`, `owner`, `bukti` (path, ukuran, sha).
3. **Baris basis**: sesudah `submit`/`update` alat mencetak `basis: <documentId>@rev<n>`; salin ke kepala laporan menggantikan baris lama. `update` tanpa basis ditolak `BASIS_MISSING`; yang dikirim hanya bagian yang kamu ubah sejak basis.
4. **`## Rujukan`** = tabel `| hubungan | dokumen | paragraf | revisi |`: hubungan `bukti`, `basis`, `keluaran`, atau `menggantikan`; dokumen = documentId; paragraf = pid; revisi boleh kosong. Baris tak terpetakan ditolak.
5. **`template`** mencetak kerangka berplaceholder `<isi: ...>`; yang tersisa ditolak `TEMPLATE_PLACEHOLDER`. **`check`** hanya memeriksa (konversi, cek lokal, dry-run server), tanpa kiriman dan tanpa berkas.
6. `update` tidak mengirim judul `#` dan tidak menghapus bab; tabel butir, bukti, atau rujukan tersimpan yang hilang dari laporan membuat `update` ditolak `RECORD_FIELDS_DROPPED`.
7. Badan kiriman dan unduhan tetap hanya di memori; galat membawa `code` dan cid (kecuali 401, 405).

## 2. Cara menyunting pada pembaruan

Pada S2 dan S3, kedua arm hanya menyunting bagian yang berubah menurut kelompok fakta langkah itu, di tempat. **Jangan menulis ulang seluruh laporan bila hanya sebagian yang berubah.** Arm B lalu menjalankan `update`.

## 3. Lingkungan

- DEV `http://127.0.0.1:9021`, dibekukan selama uji.
- Sesi sudah membawa env `INTERNAL_API_SECRET` (header `x-internal-secret`), `HQ_URL`, dan identitas run. Bila `INTERNAL_API_SECRET` kosong, isi dari berkas `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/trial_internal_secret` di shell. JANGAN mencetak atau menyalin nilainya ke berkas, CSV, log, atau laporan.
- `agentId` lewat `--agent-id hermes-gsp-master01` di setiap `submit`/`update` arm B, bukan di kepala; jangan memakai nama peran lain. `hermes-gsp-verifier01` HANYA di run M langkah M2. Satu `agentId` per penulis.
- Misi `2026-10-31_hermes-contract-ab3`. Folder per run: `C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/2026-10-31_hermes-contract-ab3/<run>/`. Arm B: `docKey` `lapkerja-<run>` huruf kecil. Run W dan M juga di misi ab3 (`w/` dengan `lapkerja-w`, `m/` dengan `lapkerja-m`); abaikan baris pertama `facts/W.md` yang menyebut misi lama.
- Berkas kerja: `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/contract_ab3/` (disingkat `ab3/`): lembar fakta di `ab3/facts/`, lalu `timing.csv`, `retrieval.csv`, `docs_b.csv`, `format_<run>.txt`. Baca hanya lembar yang disebut controller.

## 4. Larangan

- Port 9011, DB produksi, `~/gsp-datacenter`, mengubah konfigurasi/profil/memori Hermes, mencetak rahasia, menulis ke repo.
- Menyimpan badan kiriman, hasil konversi, keluaran `check` atau draft-check, atau respons API sebagai berkas di folder mana pun, termasuk `%TEMP%`. Yang boleh ada di disk hanya laporan MD di folder run, unduhan final, dan berkas `ab3/` yang diminta brief ini.
- Membuka bahan uji sebelumnya: folder misi `2026-10-31_hermes-contract-ab` dan `-ab2`, `Temp/hermes_trial/contract_ab/` dan `contract_ab2/`, serta skrip dan draf lama.
- Membaca laporan sumber asli; isi hanya dari lembar fakta.
- Menulis `timing.csv` dengan tangan atau skrip sendiri, membuka `ab3/queries/` sebelum sesi Q, mencari kunci jawaban controller, memakai `md2contract` atau `--force-latest`.
- Menyunting laporan sesudah END.

## 5. Skenario

Tulis tiga laporan kerja (R-7, R-8, R-9) dari lembar `ab3/facts/R-<i>.md` (kelompok `F-awal`, `F-upd1`, `F-upd2`). Semua fakta masuk, tanpa tambahan; fakta "tidak ada di sumber" ditulis demikian. `initiator` = `gsp-master01`. R-9 merujuk satu bagian bukti laporan R-7 pada arm yang sama. R9B: cari documentId laporan R7B lewat R21, pid paragraf bukti lewat R20, lalu tulis satu baris tabel `## Rujukan` dengan hubungan `bukti`. R9A: cari MD R7A di `r7a/`.

Langkah: S0 penanda START dan baca lembar; S1 (`F-awal`) arm A menulis MD, arm B langkah 1-5 §6; S2 (`F-upd1`) dan S3 (`F-upd2`, penutupan) kedua arm menyunting bagian yang berubah, arm B langkah 6 dan 7; S4 hanya arm B, tercakup `update` S3 (keluar 0 = HTML final di `--out`, sha cocok, terverifikasi); S5 penanda END.

Arm A: tulis seperti kebiasaanmu. Arm B: pakai jalur laporan MD; bila terpaksa memakai blok JSON atau API langsung, tulis alasannya di `format_<run>.txt`.

**Run M** (arm B, tidak dinilai waktu): lembar `ab3/facts/M.md`, alur §6 dengan `--step M1|M2|M3`, tanpa `--out`. M1 (`F-awal`) dan M3 (penutupan `F-upd2`) memakai `--agent-id hermes-gsp-master01`; M2 (`F-upd1`, agen lain) memakai `--agent-id hermes-gsp-verifier01`. Catat apakah server menerima suntingan agen kedua.

## 6. Alur arm B (perintah persis)

`SR` = `npx tsx C:/Users/TRIAL/gsp-swarm-hq-v2.1/scripts/studio/studio-report.ts`, `L` = path absolut laporan di folder run (mis. `.../r7b/laporan.md`), `T` = `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/contract_ab3/timing.csv`. Tulis perintah lengkap saat menjalankan.

1. (Opsional) `SR template --mission 2026-10-31_hermes-contract-ab3 --doc-key lapkerja-<run> > L`
2. Isi `L`: ganti setiap `<isi: ...>`; hapus baris atau bagian (termasuk Rujukan) yang tidak berlaku.
3. `SR check L --remote http://127.0.0.1:9021`: keluar 0 = VALID; 1 = perbaiki `L`, lalu ulangi.
4. `SR submit L --agent-id hermes-gsp-master01 --timing T --step S1`
5. Simpan baris `basis: <documentId>@rev<n>` yang dicetak; salin ke kepala `L` paling lambat bersama suntingan S2.
6. S2: sunting `L` (termasuk baris basis), lalu `SR update <documentId> L --agent-id hermes-gsp-master01 --timing T --step S2`; simpan baris basis baru untuk suntingan S3.
7. S3: sunting `L` (termasuk baris basis), lalu `SR update <documentId> L --agent-id hermes-gsp-master01 --timing T --step S3 --require-complete --out <folder run>`.

`template` dan `check` tanpa `--timing`, `--step`, dan `trial-log`; `check` sebelum `update` boleh. Galat: catat `code`, perbaiki `L`, ulangi perintah: `TEMPLATE_PLACEHOLDER` (placeholder tersisa), `MD2CONTRACT_REQUIRED_MISSING` (Status/ReportedAt hilang), `BASIS_MISSING` (basis belum disalin), `RECORD_FIELDS_DROPPED` (tabel hilang atau menjadi daftar). `BASE_CONFLICT` tidak diharapkan: catat keluarannya, lalu pulihkan: `SR refresh <documentId> L --write` -> selesaikan penanda `<<<<<<<` `=======` `>>>>>>>` bila ada (`MERGE_CONFLICT_MARKER`) -> `SR update <documentId> L` (jangan update salinan lama `L`).

## 7. Urutan silang

Satu sesi baru per run; kerjakan hanya run yang disebut controller. Urutan: 0 W (arm B, `facts/W.md`, pemanasan tidak dinilai); 1-2 R7B lalu R7A; 3-4 R8A lalu R8B; 5-6 R9B lalu R9A; 7 M; 8 Q (retrieval).

## 8. Pencatatan

`trial-log` ada di PATH sesi (cadangan `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/harness_ab3/bin/trial-log`, atau `trial-log.cmd` di cmd.exe). Satu pemanggilan = satu baris `timing.csv`. **Selalu pakai path absolut.**

- `trial-log mark START <RUN>` sebagai aksi pertama. `trial-log mark END <RUN> --note "md_baru=<path>"` sesudah S4 terverifikasi (arm A: sesudah suntingan S3 tersimpan).
- Baca lembar fakta lewat `trial-log get <path lembar>`.
- Arm B: `submit`/`update` selalu dengan `--timing T --step` (§6); GET atau HEAD di luar CLI: `trial-log get "/api/studio/..." [--head]`, badan hanya di layar.
- Kedua arm: sesudah setiap tulis atau sunting laporan, `trial-log step edit --target <path> --step S1|S2|S3`.
- Bacaan format (panduan, registri, laporan lama): `trial-log step read --target <x> --note format_lookup`.
- Perintah lain (grep, skrip): `trial-log step cmd --note "<perintah>"`.
- Sesudah END: `ab3/format_<run>.txt` berisi keputusan bentuk (bukan isi) yang kamu ambil sendiri; arm B juga satu baris `ab3/docs_b.csv` (`run_id,documentId,docNumber,revisionNo,lastFilledBy_record,lastFilledBy_content`) dari R05.

## 9. Sesi Q

Lima kueri beku di `ab3/queries/Q.md`, diserahkan di awal sesi Q, semuanya dibatasi misi ab3. Urutan arm: Q1 A-B, Q2 B-A, Q3 A-B, Q4 B-A, Q5 A-B.

- Tandai tiap kueri per arm: `trial-log qmark START Q1 A` ... `trial-log qmark END Q1 A`.
- Catat setiap grep, baca berkas, atau panggilan API per kueri lewat `trial-log`.
- Arm A: hanya laporan di `r7a/`, `r8a/`, `r9a/`; hasil `path[:baris]`.
- Arm B: R21 (Q1, Q2, Q4), R22 (Q3), R16 (Q5: `refs` R9B dari R20, lalu R16 per pid); hasil `documentId[#pid]`.
- Jawaban: `trial-log answer <Q> <A|B> <result_ids...> [--tool-call "<perintah>"]`.

## 10. Umpan balik (akhir sesi Q, maks 900 kata)

- A. Hasil per arm per run: selesai atau tidak, jumlah aksi, galat.
- B. Setiap galat apa adanya: HTTP, `code`, cid; galat alat (CLI, konversi, `check`, trial-log) dengan perintah dan keluaran ringkas.
- C. Laporan MD arm B: lebih ringan daripada draf JSON uji ulang? Bagian mana (kepala, tabel, Rujukan, baris basis) masih menuntut keputusan bentuk?
- D. Pembaruan: apakah `update` hanya mengirim bagian yang berubah? Apakah kamu menulis ulang laporan penuh di suatu langkah, dan mengapa?
- E. `template` dan `check`: dipakai atau tidak; apakah panduan atau registri masih dibuka?
- F. Friksi, urut dari yang paling merugikan: kejadian, dampak, usulan konkret.
- G. Vonis: layakkah laporan kerja lewat Studio menggantikan MD, untuk misi apa ya dan apa tidak, dengan bukti.
- H. Run M: apa yang terjadi saat agen kedua menyunting.

Jangan mengarang. Nilai tak terukur dikosongkan dengan alasan di `note`. Langkah gagal dicatat dengan `code` dan cid, tidak diulang diam-diam. Angka umpan balik harus sama dengan CSV.
