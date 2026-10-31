Halo Hermes. Ini uji coba ulang laporan kerja agen. Pada uji 1 (misi `2026-10-31_hermes-contract-ab`), arm B 4-7 kali lebih lambat dan ada badan `.json` kiriman tersimpan di disk. Tiga syarat sempitmu sudah dikerjakan. Ukur lagi dengan jujur, dan katakan apa adanya bila jalur baru masih merepotkan.

Bila alat tidak tersedia atau berbeda dari brief ini, catat sebagai friksi; jangan mengakalinya.

## 1. Yang berubah sejak uji 1

1. CLI `studio-report`, jalan dari folder mana pun: `npx tsx C:/Users/TRIAL/gsp-swarm-hq-v2.1/scripts/studio/studio-report.ts submit <draf.md>` membuat dokumen dari draf (slot `record` lalu bab), mengecek kelengkapan, merender HTML, mengunduh ke memori, mencocokkan sha256, dan menjalankan HEAD `?verify=1`. `update <documentId> <draf.md>` membaca basis dari server, mengisi `baseRevisionNo` otomatis, hanya mengirim bab/slot yang berubah, lalu merender dan memverifikasi. Badan kiriman dan unduhan hanya di memori; galat dicetak dengan `code` dan cid. Opsi: `--timing <csv>`, `--step <id>`, `--out <dir>` (satu-satunya cara berkas final tersimpan, bernama `X-Studio-Final-Filename`), `--require-complete` (tanpa opsi ini dokumen belum lengkap tidak dirender dan tetap keluar 0), `--agent-id <id>`. Kode keluar lengkap ada di `--help`.
2. Contoh payload: `GET /api/studio/registry?kind=contracts` memuat `items[0].examples` berisi `howTo`, `record` (slot `record` lengkap), dan `chapters` 1..5 (badan `studio.chapter/v2` sah, termasuk list `items: [{text}]` dan table `cells: [{text}]` + `source`). Setiap contoh lolos dry-run R08. Di draf, `target` bab disamakan dengan blok pembuat (misi + `docKey`). Misi dan `docKey` contoh/templat (`2026-10-31_misi_contoh`, `laporan-kerja-penulis`) WAJIB diganti dengan misi uji `2026-10-31_hermes-contract-ab2` dan `docKey` unik per laporan (`lapkerja-<run>`, §2); bila tidak, `studio-report` berhenti `EXAMPLE_TARGET` (keluar 2) sebelum mengirim apa pun. Tanpa `kind` atau kind tak dikenal: 400 `REGISTRY_KIND_UNKNOWN`, daftar kind sah di `details.validKinds`.
3. draft-check ramah (`npx tsx C:/Users/TRIAL/gsp-swarm-hq-v2.1/scripts/studio/draft-check.ts <draf.md> [--remote http://127.0.0.1:9021] [--json [--with-payload]]`): blok bab sesudah blok pembuat dokumen tidak lagi ditolak `META_REQUIRED_FOR_CREATE`; `--json` selalu JSON, termasuk galat fatal `{fatal:{code,message}}`; payload hanya dengan `--with-payload`.
4. Resep satu halaman di panduan §17.0 (`docs/STUDIO-AGENT-GUIDE.md`), termasuk arti `matchedItems` R21 (butir `items[].key` = cardId, bukan `cardIds`).
5. Bentuk galat (panduan §12): `{ "error": "<pesan>", "code": "<KODE>", "details": ... }`. Baca `code` di tingkat atas, bukan `error.code`; cid di header `x-correlation-id`. 400 uji 1 yang tercatat "tanpa err_code" (cid 3b684687) berkode `SCHEMA_INVALID` di log server: masalahnya di pengurai klien.
6. Pencatatan dipegang alat (§6). START dicatat harness saat pesan pertama dikirim; kamu tetap menulis penanda START dan END.

## 2. Lingkungan

- DEV `http://127.0.0.1:9021`, dibekukan selama uji.
- Sesi dari controller sudah membawa env `INTERNAL_API_SECRET` (header `x-internal-secret`), `HQ_URL`, dan identitas run. Bila `INTERNAL_API_SECRET` kosong, isi dari berkas `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/trial_internal_secret` di shell. JANGAN mencetak atau menyalin nilainya ke berkas, CSV, log, atau laporan.
- `agentId` utama `hermes-gsp-master01` di setiap badan dan blok draf. agentId kedua `hermes-gsp-verifier01` HANYA di run M langkah M2.
- Misi `2026-10-31_hermes-contract-ab2`. Folder per run: `C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/2026-10-31_hermes-contract-ab2/<run>/` (mis. `w/`, `r4a/`, `r4b/`). Arm B: `target.mission.folder` = nama misi, `docKey` = `lapkerja-<run>`. Run W juga di misi ab2 (`w/`, `lapkerja-w`); baris pertama `facts/W.md` masih menyebut misi uji 1, abaikan.
- Berkas kerja: `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/contract_ab2/` (disingkat `ab2/`): lembar fakta di `ab2/facts/`, lalu `timing.csv`, `retrieval.csv`, `docs_b.csv`, `format_<run>.txt`. Controller menyebut lembar yang dipakai di awal sesi; baca hanya lembar itu.
- Repo `gsp-swarm-hq-v2.1` baca-saja; CLI-nya boleh dijalankan.

## 3. Larangan

- Port 9011, DB produksi, `~/gsp-datacenter`, mengubah konfigurasi/profil/memori Hermes, mencetak rahasia, menulis ke repo.
- Menyimpan badan kiriman, keluaran draft-check, atau respons API (R05, R20, R21, R22) sebagai berkas, di folder mana pun termasuk `%TEMP%`. Yang boleh ada di disk hanya draf MD yang lolos draft-check, laporan MD arm A, unduhan final, dan berkas `ab2/` yang diminta brief ini. Controller memindai `%TEMP%`, `Temp/hermes_trial/`, dan workspace-mu sebelum dan sesudah tiap run.
- Membuka bahan uji 1: folder misi `2026-10-31_hermes-contract-ab`, `Temp/hermes_trial/contract_ab/`, serta skrip dan scratch uji 1 di Temp. Jangan memakai ulang pembangkit payload lama.
- Membaca laporan sumber asli; isi hanya dari lembar fakta.
- Menulis `timing.csv` dengan tangan atau skrip sendiri, membuka `ab2/queries/` sebelum sesi Q, mencari kunci jawaban controller, memakai `md2contract`.
- Menyunting laporan sesudah END.

## 4. Skenario

Tulis tiga laporan kerja (R-4, R-5, R-6) dari lembar `ab2/facts/R-<i>.md` (kelompok `F-awal`, `F-upd1`, `F-upd2`). Semua fakta masuk, tanpa tambahan; fakta "tidak ada di sumber" ditulis demikian. `initiator` = `gsp-master01`. R-6 merujuk satu bagian bukti laporan R-4 pada arm yang sama: R6B lewat R21/R20 lalu `refs[]`; R6A cari MD R4A di `r4a/`. Pencarian ini bagian dari run.

| Langkah | Arm A | Arm B |
|---|---|---|
| S0 | penanda START, baca lembar fakta | sama |
| S1 laporan awal (`F-awal`) | tulis MD | draf MD + `studio-report submit <draf> --step S1` |
| S2 pembaruan 1 (`F-upd1`) | sunting MD | sunting draf + `studio-report update <docId> <draf> --step S2` |
| S3 pembaruan 2, penutupan (`F-upd2`) | sunting MD | sunting draf + `studio-report update <docId> <draf> --step S3 --require-complete --out <folder run>` |
| S4 terbitkan | tidak ada (MD = final) | tercakup `update` S3: keluar 0 = HTML final tersimpan di `--out`, sha cocok, `X-Studio-Sha256-Verified: true` |
| S5 | penanda END | sama |

Arm A: tulis seperti kebiasaanmu. Arm B: pakai alur yang menurutmu tercepat (CLI atau API langsung §17), asal aturan disk ditaati; sebut alurnya di `format_<run>.txt`.

**Run M** (arm B, tidak dinilai waktu): lembar `ab2/facts/M.md`, `docKey` `lapkerja-m`. M1: sebagai owner (`hermes-gsp-master01`) buat laporan dari `F-awal`. M2: sebagai agen lain (`hermes-gsp-verifier01`) perbarui sesuai `F-upd1`. M3: kembali sebagai owner, tutup dengan status dari `F-upd2`. Tanpa `--out`; render otomatis CLI tidak dinilai. Catat apakah server menerima suntingan agen kedua.

## 5. Urutan silang

Satu sesi baru per run; kerjakan hanya run yang disebut controller.

| order | run |
|---|---|
| 0 | W: arm B, `facts/W.md`, pemanasan tidak dinilai |
| 1, 2 | R4B, lalu R4A |
| 3, 4 | R5A, lalu R5B |
| 5, 6 | R6B, lalu R6A |
| 7 | M |
| 8 | Q: retrieval |

## 6. Pencatatan

`trial-log` ada di PATH sesi (cadangan `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/harness_ab2/bin/trial-log`, atau `trial-log.cmd` di cmd.exe). Satu pemanggilan = satu baris `timing.csv`; identitas run diambil dari env sesi.

- `trial-log mark START <RUN>` sebagai aksi pertama (`<RUN>` dari controller, mis. `R4B`); `trial-log mark END <RUN> --note "md_baru=<path>"` sesudah S4 terverifikasi (arm A: sesudah suntingan S3 tersimpan).
- Baca lembar fakta lewat `trial-log get <path lembar>`.
- Arm B: setiap `studio-report` dengan `--timing C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/contract_ab2/timing.csv --step S1|S2|S3`. GET atau HEAD di luar CLI: `trial-log get "/api/studio/..." [--head]`; badan hanya tampil di layar.
- Arm A: sesudah setiap tulis atau sunting, `trial-log step edit --target <path> --step S1|S2|S3`.
- Bacaan format (panduan, registri, laporan lama): `trial-log step read --target <x> --note format_lookup`, atau `trial-log get "/api/studio/registry?kind=contracts" --note format_lookup`.
- Perintah lain (draft-check, grep, skrip): `trial-log step cmd --note "<perintah>"`.
- Sesudah END: `ab2/format_<run>.txt` berisi keputusan bentuk (bukan isi) yang kamu ambil sendiri. Arm B: satu baris `ab2/docs_b.csv` (`run_id,documentId,docNumber,revisionNo,lastFilledBy_record,lastFilledBy_content`) dari R05.

## 7. Sesi Q

Lima kueri beku di `ab2/queries/Q.md`, diserahkan di awal sesi Q, semuanya dibatasi ke misi ab2. Urutan arm: Q1 A-B, Q2 B-A, Q3 A-B, Q4 B-A, Q5 A-B.

- Tandai tiap kueri per arm: `trial-log qmark START Q1 A` ... `trial-log qmark END Q1 A`.
- Yang diukur kini jumlah langkah dan bacaan tambahan per kueri, bukan detik. Cari sewajarnya; catat setiap grep, baca berkas, atau panggilan API lewat `trial-log` (§6).
- Arm A: hanya laporan di `r4a/`, `r5a/`, `r6a/`; hasil `path[:baris]`.
- Arm B: R21 (Q1, Q2, Q4), R22 (Q3), R16 (Q5, boleh didahului R20 atau R21); hasil `documentId[#pid]`.
- Jawaban: `trial-log answer <Q> <A|B> <result_ids...> [--tool-call "<perintah>"]`, yang mengisi `ab2/retrieval.csv`.

## 8. Umpan balik (akhir sesi Q, maks 900 kata)

- A. Hasil per arm per run: selesai atau tidak, jumlah aksi, galat.
- B. Setiap galat apa adanya: HTTP, `code`, cid. Galat alat (CLI, draft-check, trial-log): perintah dan keluaran ringkas.
- C. Friksi, urut dari yang paling merugikan: kejadian, dampak, usulan konkret.
- D. Vonis: layakkah laporan kerja JSON menggantikan laporan kerja MD? Nilai tiga syaratmu dari uji 1 (contoh payload per bab + `code` pada setiap 400; CLI satu perintah dari draf sampai unduh; draft-check ramah): terpenuhi, sebagian, atau belum, dengan bukti.
- E. Run M: apa yang terjadi saat agen kedua menyunting.
- F. Usulan lain.

Jangan mengarang. Nilai tak terukur dikosongkan dengan alasan di `note`. Langkah gagal dicatat dengan `code` dan cid; jangan mengulang diam-diam demi hasil terbaik. Angka di umpan balik harus sama dengan CSV.
