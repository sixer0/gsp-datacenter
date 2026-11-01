# 15c — Review verifikasi siklus 3/3 "tanpa lost update" (baris R3-03c)

Tanggal: 2026-11-01. Peninjau: senior-code-reviewer (skill `code-review-senior`). Lingkup: `git diff HEAD` pada `scripts/studio/studio-report.ts` (runUpdate :1425-1561, runRefresh :2054-2258, `lastWritersOf`/`ownWrite` :1355-1383, `nextBasisOf` :1568-1606), `src/lib/studio/services/draft/md-report.ts` (serializer balik :603-1155, penanda konflik :148-164, `~~hapus~~` :166-208), uji `r3fix2-refresh` / `r3fix-md-report` / `r3cli-md-native`, panduan §17.0 (`docs/STUDIO-AGENT-GUIDE.md`:1873-1930). Konteks: D-446, D-448, D-452; review `15b_review_r3_fixes.md` (N1..N11); laporan `delegation_progress/coder_execution_r3_f2.md`. Berkas terdampak yang ikut dibaca: `services/revisions/v2/commit.ts:228-238` dan `services/structure/rows.ts:508-527` (cap `lastFilled*` = penulis TERAKHIR saja), `services/submit/meta.ts:19-43` (`fillerOf`), `hermes_trial/06_contract_trial3_brief.md` (run M). Peninjau hanya membaca; kode produksi tidak diubah.

## Ringkasan

| Domain | Vonis | Isu (H/M/L) |
|---|---|---|
| Struktur kode | PASS | 0/0/0 |
| Dampak dependensi | CAUTION | 0/1/0 |
| Duplikasi | PASS | 0/0/0 |
| Keterpeliharaan | CAUTION | 0/0/3 |
| Integritas rujukan / alur kerja | **FAIL** | 1/1/2 |

**Vonis keseluruhan: CHANGES REQUESTED.** Ada 8 isu: 1 High, 2 Medium, 5 Low.

**Kriteria "tanpa lost update": BELUM terpenuhi.**

- N1 dan N2 tertutup dan terbukti di DEV.
- Perbaikan N3 (pengecualian "tulisan sendiri") membuka jalur lost update baru. Jalur itu terbukti di DEV: rc 0, bab penulis lain terhapus, tanpa 409, dan disertai pemberitahuan yang menyesatkan (R1).

**Aman untuk uji ketiga: TIDAK** (dalam keadaan kode sekarang). Alasan dan syarat agar menjadi "ya" ada di bagian akhir.

## Bukti segar (dijalankan peninjau)

- `npx vitest run tests/unit/studio/draft tests/unit/studio/contract tests/unit/studio/import`: **26 berkas, 566 lulus, 0 gagal**. Cakupannya r3fix2 (14), r3fix, r3cli, r2fix/r2cli, golden dc24/dc35, dan importer. Suite studio penuh (161 berkas) tidak diulang peninjau.
- `npx tsc --noEmit -p .`: rc 0. `npx eslint` atas 5 berkas (2 sumber, 3 uji): rc 0.
- `git status`: tidak ada berkas golden/fixture yang berubah; `tests/` hanya memuat 3 berkas uji r3 baru (untracked). **KD-42 + golden tidak berubah.**
- Probe DEV `http://127.0.0.1:9021`, misi `2026-11-01_r3_03c`, docKey `review-r3-03c`, A = `review-r3-03c`, B = `review-r3-03c-2`, `--agent-id` sesuai brief.
  - Dokumen fixture yang dibiarkan (pola D-408): `cmvx5d7xz037uv1i802ajeh03` (038/GSP/LAP/XI/2026), rev22.
  - Lokasi keluaran: `C:/Users/TRIAL/AppData/Local/Temp/r303c/` (`driver.py`, `p4b.py`, `run/probe_log.txt`, `run/NN_*.out.txt`, `run/own_hole.txt`, `run/r_a3.txt`). Path scratchpad sesi terlalu panjang untuk direktori kerja Win32.
  - Rahasia hanya lewat substitusi shell. `grep -rlF` rahasia atas 69 berkas keluaran = **0**.
  - **P0** `check` lokal rc 0 dan `check --remote` rc 0, keduanya tanpa berkas yang berubah. `submit` rev1-6 COMPLETE.
  - **P1 (bagian yang sama).**
    - B mengubah bab 3 (rev7). A (basis rev6) mengubah bab 3: rc 1 `BASE_CONFLICT`, changedByOthers `[bab 3]`, conflicts `[bab 3]`. Revisi tetap rev7 dan bab 3 milik B tetap.
    - `refresh` tanpa `--write`/`--out-md`: rc 1, **0 berkas berubah**, sha `a1.md` sama. Penanda ada di stdout, dan basis yang dicetak rev7.
    - `--out-md`: hanya `a1_segar.md` yang ditulis.
    - Update dengan berkas berpenanda: rc 1 `MERGE_CONFLICT_MARKER`, revisi tetap.
    - Sesudah digabung: hanya bab 3 terkirim (rev8), dan isinya memuat teks A + B.
  - **P2 (update berulang sesudah refresh).** Update tanpa suntingan: 0 kiriman, basis rev8. Ditambah bab 5: hanya bab 5 terkirim (rev9), tanpa konflik palsu.
  - **P3 (record + bab bersamaan).**
    - B mengubah Status dan bab 1 (rev10-11). A mengubah Owner dan bab 4: `BASE_CONFLICT` conflicts `[record]`, changedByOthers `[record, bab 1]`, revisi tetap.
    - A mengubah bab 4 saja: bab 4 terkirim, sedangkan record dan bab 1 stale. `nextBasis` null; Status `blocked` milik B dan bab 1 milik B tetap.
    - `refresh --write` rc 0: hanya `a3b.md` yang ditulis, basis rev12. Update sesudahnya: 0 kiriman, dan perubahan B tetap.
  - **P4/Q (`~~hapus~~`).**
    - `~~hapus~~` C3-2 dengan basis segar: record terkirim, items `[C3-1]`.
    - Q1: A menandai `~~hapus~~` C3-3 dan mengubah bab 5, sementara B juga mengubah bab 5. Hasilnya `BASE_CONFLICT` conflicts `[bab 5]`, sendable `[record, bab 2]`.
    - `refresh` **membuang baris C3-3 beserta penanda `~~hapus~~`-nya**. Update sesudahnya (memilih versi A): rc 1 `RECORD_ELEMENTS_DROPPED` (gagal-tertutup; items tetap `[C3-1, C3-3]`) (R2).
  - **P5 (judul).** Judul `#` diubah: muncul pemberitahuan "judul laporan ... berbeda", 0 kiriman, judul dokumen tetap.
  - **P6 (N2 di DEV).** B mengisi bab 4 berformat (paragraph, monoBlock, aside, table, list, paragraph). A (basi) mengubah bab 5: bab 5 terkirim dan bab 4 stale. Sesudah `refresh --write` lalu update: 0 kiriman, dan **bab 4 milik B identik** (tanpa id).
  - **P7 (agentId sama).** B menulis bab 1 memakai agentId A. Update A dari salinan basi lalu mengirim bab 1 dan **menimpa B** tanpa konflik (R3).
  - **P8.** `EXAMPLE_TARGET` rc 2, `fatal` tanpa `progress`, 0 berkas.
  - **R1 (repro).**
    - Setelah P1, berkas asli `a1.md` masih memuat basis rev6 dan bab 3 versi A pra-gabung. Ini persis keadaan sesudah langkah 1 panduan (`--out-md laporan-segar.md`).
    - `update a1.md --agent-id review-r3-03c` hasilnya **rc 0**, mencetak "bab 3: diubah sesudah basis oleh Anda sendiri ..., bukan pihak lain; suntingan Anda dikirim", lalu bab 3 terkirim (rev22, cid 83c7f50b-d50d-4311-96f9-ae252bdf2b8f).
    - Isi bab 3: di rev21 ada dua section, "Bukti versi A ..." dan **"Bukti versi B: hasil penulis kedua."**. Di rev22 tinggal section "Bukti versi A ...". **Tulisan B (rev7) hilang.**
    - Keluaran yang sama juga mendaftar "diubah pihak lain sejak basis: bab 4, bab 5" saja, padahal record dan bab 1 juga pernah diubah B.
  - **Refresh dengan salinan basi** (`run/r_a3.txt`): untuk record yang diubah B di rev11, refresh memutuskan "versi Anda dipertahankan — diubah sesudah basis oleh Anda sendiri". Berkas kebetulan tidak ditulis hanya karena verifikasi butir gagal. Seandainya tabel butir cocok, versi lama A akan ditulis dengan basis terkini dan dikirim pada update berikutnya.
- **Nol tulis.** Dari 38 pemanggilan CLI, 28 tidak mengubah berkas apa pun. Kesepuluh sisanya hanya mengubah target `--out-md`/`--write` masing-masing. Submit dan update tanpa `--out`/`--timing` tidak menulis berkas. `check` juga tidak menulis.

## Status N1..N11 (review 15b)

| # | Status | Bukti |
|---|---|---|
| N1 (High) | **TERTUTUP** | `studio-report.ts:1506-1528`: BASE_CONFLICT mendaftar `changedByOthers` dan menunjuk `refresh`; tidak ada lagi "ganti basis". DEV P1/P3 dan uji r3fix2 :233-322. Catatan: daftar dapat tidak lengkap bila penulis terakhir adalah A (R1/R7). |
| N2 (High) | **TERTUTUP** | Serializer lossless `md-report.ts:738-783` (diverifikasi `parseInline`) dan :842-985. Verifikasi konversi ulang per bagian di `studio-report.ts:2166-2225`. DEV P6: bab 4 milik B identik. Uji r3fix2 :360-519. |
| N3 (Medium) | **TERTUTUP, tetapi membuka R1 (High)** | `ownWrite` :1379-1383 hanya melihat penulis TERAKHIR (R15), bukan "tidak ada penulis lain sejak basis". `baseRevisionNo` = terkini (:1545) menonaktifkan pengaman §9.2 server, padahal pengaman itu justru menolak kasus ini. |
| N4 (Medium) | **TERTUTUP** (gagal-tertutup) | `assertRecordKeepsElements` :1296-1324 (`RECORD_ELEMENTS_DROPPED`) dan `~~hapus~~` `md-report.ts:184-208`. DEV P4/Q1. Sisa friksi: R2. |
| N5 (Medium) | TERTUTUP | `plainTextOf` `md-report.ts:640-647`; kunci judul kosong tidak dicocokkan, `studio-report.ts:1221-1222`. Uji r3fix2 :585-599; DEV coder S5. Tidak diulang peninjau. |
| N6 (Low) | TERTUTUP | `studio-report.ts:953`; uji :602. |
| N7 (Low) | TERTUTUP | Alasan majemuk dicantumkan di MD2CONTRACT_REQUIRED_MISSING; uji :608. |
| N8 (Low) | TERTUTUP | `findPlaceholders(..., { skipFences })` `md-report.ts:124-137`; uji :611. |
| N9 (Low) | SEBAGIAN (sah) | Hanya bantuan, `studio-report.ts:142-143`; `check` tetap tidak menjalankan gerbang update. |
| N10 (Low) | SEBAGIAN | r3fix2 menambah 14 uji dengan mock berkeadaan + §9.2, tetapi tidak ada uji "penulis lain lalu tulisan sendiri lalu salinan basi" (R1) maupun refresh + `~~hapus~~` (R2). |
| N11 (Low) | TERTUTUP | `md-report.ts:25, 645-646` memakai `import/inline.inlineText`; `studio-report.ts:1195` alias. |

**Regresi R2/R3: tidak ada.**

- EXAMPLE_TARGET: rc 2 tanpa `fatal.progress` (P8).
- `OUT_NAME_UNSAFE` dan `fatal.progress`: dikunci uji r2fix yang tidak diubah dan lulus.
- `check`: nol tulis (P0).
- KD-42 + golden: tidak berubah.
- Rahasia: 0 kemunculan.

## Log isu baru

| # | Sev | Domain | File:baris | Temuan + bukti | Rekomendasi |
|---|---|---|---|---|---|
| R1 | **High** | Integritas alur kerja (keamanan: integritas) | `scripts/studio/studio-report.ts:1379-1383` (`ownWrite`: cukup `by === agent:<id>` dan `revisionNo > basisRev`); `:1494-1495` (`baseNow = sameContent(atBase, atNow) \|\| own`); `:1545` (`baseRevisionNo: p.own ? latest : basisRev`); `:1513` (bagian "own" dikeluarkan dari `changedByOthers`); `:2119` (refresh: aturan yang sama menghasilkan "anda"); dasar server `services/structure/rows.ts:519-523` (cap = penulis terakhir saja); panduan `STUDIO-AGENT-GUIDE.md:1883` | **Lost update lewat pengecualian "tulisan sendiri".** Bila B mengubah bagian X sesudah basis n dan A kemudian menulis X (misalnya sesudah refresh), penulis terakhir X adalah A. Update atau refresh dari salinan apa pun yang masih ber-basis n dan memuat suntingan X lama A akan menganggap X "milik Anda" dan mengirimnya dengan `baseRevisionNo` = terkini, sehingga §9.2 server tidak lagi dapat menolak. Perubahan B di X yang sudah digabung A lalu hilang, dengan rc 0 dan pemberitahuan "bukan pihak lain". Pemicunya adalah alur baku panduan langkah 1 (`--out-md laporan-segar.md` membiarkan berkas asli ber-basis lama), lalu agen kembali ke berkas asli. Contohnya: perintah `update L` diulang pada harness, atau dua salinan berkas. **Terbukti di DEV**: rev21 ke rev22, tulisan B "Bukti versi B ..." terhapus (`run/own_hole.txt`). Mock uji tidak menangkapnya karena tidak ada uji urutan ini (`r3fix2-refresh.test.ts:522-544`). | Minimal dan aman di bawah batas siklus: **matikan pengecualian `own` di `runUpdate` dan `runRefresh`** (`ownWrite` dianggap false, `baseRevisionNo` = basisRev untuk semua bagian). N3 kembali menjadi konflik palsu yang dapat dipulihkan `refresh`, yang kini lossless. Alternatif yang benar: `own` hanya bila isi X di revisi `w.revisionNo - 1` (GET R20 `?rev=`) sama dengan isi X di basis, yaitu tidak ada penulis lain di (basis, tulisan A], dan tulisan A adalah penulis terakhir. Tambahkan uji urutan "B tulis X, A refresh lalu gabung lalu kirim X, A update dari berkas asli basis lama", yang harus menghasilkan BASE_CONFLICT dengan 0 kiriman. Revisi kalimat panduan :1883. |
| R2 | Medium | Dampak dependensi | `studio-report.ts:2097` (`partsOfValues(values)`: refresh menulis ulang dari payload; `conversion.removals` tidak ikut); `md-report.ts:184-208` (baris `~~hapus~~` dibuang sebelum konversi); `:1037-1067` (record tidak menulis penanda hapus) | **`refresh` membuang niat hapus eksplisit.** Baris `~~hapus~~` hilang dari laporan gabungan, sehingga update sesudah refresh ditolak `RECORD_ELEMENTS_DROPPED` (DEV Q1). Gagal-tertutup, tidak ada data hilang, tetapi refresh tidak setara dengan suntingan agen meskipun panduan :1890 menjanjikan "bagian yang hanya Anda ubah dipertahankan". | Refresh menulis kembali baris `\| key \| judul \| ~~hapus~~ \|` untuk `conversion.removals.items`/`refs` yang masih ada di server, atau mencetak pemberitahuan "tulis ulang baris ~~hapus~~ ...". Tambahkan uji. |
| R3 | Medium | Integritas alur kerja | `studio-report.ts:1379-1388` (identitas = agentId); `meta.ts:36-43`; panduan :1883; brief 06 :23, :44 | **Dua penulis dengan agentId sama saling menimpa tanpa konflik** (DEV P7). Batas ini dicatat di laporan coder, tetapi tidak tertulis eksplisit di panduan maupun brief. Run M memakai id berbeda (`master01`/`verifier01`), sehingga jalur ini hanya tercapai bila Hermes salah memakai id. | Bila R1 diperbaiki dengan mematikan `own`, isu ini ikut tertutup. Bila tidak, tulis di §17.0 dan brief: "setiap penulis wajib memakai `--agent-id` berbeda; agentId sama = dianggap satu penulis". |
| R4 | Low | Integritas alur kerja | `md-report.ts:1114-1119` (penanda membungkus seluruh wilayah bab termasuk `## judul`); panduan :1893-1895 ("gabungkan isinya") | Penggabungan "pertahankan keduanya" yang wajar menghasilkan dua `## Bukti`. Bab 3 lalu tersimpan dengan dua section berjudul sama (DEV P1, rev8) tanpa peringatan. Tidak ada data hilang. | Tulis penanda hanya di sekitar isi (judul di luar penanda) bila judul sama, atau peringatkan "pertahankan satu judul ##" di panduan dan keluaran refresh. |
| R5 | Low | Keterpeliharaan | `md-report.ts:793-799` (`Kunci: nilai` menjadi `Kunci\: nilai`, `Tabel:`/`Sumber:`), `:690-694` (`*` menjadi `\*`) | Laporan hasil refresh memuat escape yang terlihat (`Bukti versi A\: ...`). Agen yang menyunting dengan ganti-teks atas kalimatnya sendiri gagal mencocokkan, sehingga update berikutnya "0 kiriman" dengan rc 0 (DEV P4: suntingan B tidak terjadi). Lossless, tetapi menambah friksi. | Sebutkan di panduan bahwa refresh dapat menambah `\` dan bahwa itu sah. Pertimbangkan escape hanya di 40 baris kepala, tempat generator membaca `Kunci: nilai`. |
| R6 | Low | Integritas rujukan (dokumen) | `STUDIO-AGENT-GUIDE.md:1883` (aturan `own` keliru, lihat R1); `:1930` ("jalur JSON ... untuk menghapus butir dengan sengaja", sudah usang); §17.0 tidak menyebut `~~hapus~~`, `--allow-remove`, `RECORD_ELEMENTS_DROPPED`; `hermes_trial/06_contract_trial3_brief.md:58` (daftar galat tanpa `MERGE_CONFLICT_MARKER`/`RECORD_ELEMENTS_DROPPED`, tanpa `refresh`) | Panduan dan brief tertinggal dari perilaku CLI (brief milik controller/R3-H). | Perbarui §17.0 (hapus eksplisit, `--allow-remove`, kode baru). Brief: arahkan pemulihan ke `refresh --write` (satu berkas, menutup pemicu R1 sebagai lapisan tambahan) dan tambahkan kode baru ke daftar. |
| R7 | Low | Keterpeliharaan | `studio-report.ts:1484` (penulis hanya dibaca bila ada kandidat konflik); `:1509-1514` | `changedByOthers` tidak konsisten. Tanpa kandidat, tulisan A sendiri didaftar sebagai "pihak lain". Dengan pengecualian `own`, bagian yang diubah B tetapi kemudian ditulis A tidak didaftar (DEV `own_hole.txt`: hanya bab 4, bab 5). | Ikut terselesaikan oleh perbaikan R1. Bila `own` dipertahankan, hitung `changedByOthers` dari isi saja dan beri label terpisah untuk "tulisan Anda". |
| R8 | Low | Keterpeliharaan (tes) | `tests/unit/studio/draft/r3fix2-refresh.test.ts:522-544`, :546-583 | Tidak ada uji untuk urutan R1, refresh + `~~hapus~~` (R2), maupun penggabungan dua judul (R4). | Tambahkan bersama perbaikan R1/R2. |

## Keamanan (integritas data) — untuk keputusan controller (mandat D-448)

- **R1 (High), siklus 3 dari 3:** (a) **matikan pengecualian `own`** (disarankan). Perubahannya subtraktif dan kecil di `:1494`/`:1545`/`:1513`/`:2119`, ditambah membalik ekspektasi uji N3 dan menambah uji urutan R1. Verifikasinya cukup vitest r3fix2 ditambah repro DEV `own_hole` yang harus menjadi BASE_CONFLICT dengan 0 kiriman. (b) Batasi `own` dengan cek revisi `w-1`; ini lebih kompleks, jadi tidak disarankan di siklus terakhir. (c) Terima risiko untuk uji ketiga dengan brief "pemulihan hanya `refresh --write`, jangan pernah update berkas lama". Opsi ini tidak menutup salinan basi lain dan jalur agentId sama.
- R2, R3 (Medium): R3 ikut tertutup oleh (a). R2 gagal-tertutup, jadi aman ditunda dengan catatan di panduan.

## Tantangan utama

1. **"Penulis terakhir" bukan "satu-satunya penulis sejak basis".** Cap R15 menimpa penulis sebelumnya (`rows.ts:519-523`). Pengecualian berbasis cap itu tidak dapat membuktikan bahwa tidak ada penulis lain di jendela (basis, sekarang]. Server sudah menegakkan hal ini dengan benar (409 SCOPE_CONFLICT, ditemukan coder sendiri di DEV). Mengirim `baseRevisionNo` = terkini berarti melewati satu-satunya pengaman yang tepat.
2. **Alur pemulihan menghasilkan dua berkas.** Default `--out-md` meninggalkan berkas asli ber-basis lama. Dengan R1, berkas itu menjadi senjata. Tanpa R1, berkas itu aman (konflik).
3. **Refresh menulis ulang dari payload.** Strategi ini menjamin kesetaraan isi (N2), tetapi niat yang tidak berbentuk isi (`~~hapus~~`) hilang.

## Temuan positif

- `refresh` dirancang hati-hati: hanya GET, verifikasi konversi ulang penuh per bagian dengan putaran pembuangan bagian server yang tidak terwakili (`:2166-2225`), record yang tidak terwakili berarti tidak ada yang ditulis, berkas agen hanya ditulis dengan `--write`, tulisnya atomik (`REAL_FS.writeFileText` :1714-1718), dan `--out-md` ke berkas sendiri ditolak (:2233). DEV: tanpa opsi tulis berarti 0 berkas.
- Serializer lossless (`inlineToMarkdown` :771-783 mencoba md/html dan escape minimal/penuh, lalu memverifikasi dengan pengurai yang sama). Bentuk tanpa padanan menjadi null + alasan, bukan teks penanda. DEV P6 identik.
- BASE_CONFLICT kini atomik, mendaftar semua bagian, dan tidak lagi menyuruh mengganti basis secara manual. `nextBasisOf` menahan basis selama ada bagian stale atau pending.
- `RECORD_ELEMENTS_DROPPED` gagal-tertutup dengan alasan per baris; `MERGE_CONFLICT_MARKER` mengabaikan pagar kode.
- Kontrak/importer dan golden tidak disentuh; ekstraktor teks disatukan (N11).

## Pernyataan untuk uji ketiga

**Aman untuk uji ketiga: TIDAK** (kode saat ini).

**Alasan.** Satu jalur lost update yang terbukti di DEV (R1) masih ada pada alat yang menjadi objek uji run M dua penulis. Pemicunya realistis bagi agen yang mengikuti pesan alat (`refresh --out-md` lalu kembali ke berkas `L`), dan gejalanya senyap (rc 0, pemberitahuan "bukan pihak lain").

**Menjadi YA bila semua syarat ini terpenuhi:**

1. Pengecualian `own` dimatikan di `runUpdate` dan `runRefresh`.
2. Uji urutan R1 ditambahkan dan lulus.
3. Repro DEV `own_hole` (B tulis X, lalu A gabung X lewat refresh, lalu A update dari berkas basis lama) menghasilkan `BASE_CONFLICT` dengan 0 kiriman.
4. Vitest draft/contract/import tetap hijau.
5. Brief 06 :58 menyebut `refresh --write` sebagai pemulihan.

Syarat ini dapat diverifikasi tanpa review penuh baru, karena perubahannya subtraktif dan perilakunya kembali ke model konservatif yang lolos P1-P6.

## Berkas yang ditinjau

`scripts/studio/studio-report.ts` (586-1000, 1170-1620, 1697-2290), `src/lib/studio/services/draft/md-report.ts` (140-270, 600-1160), `tests/unit/studio/draft/r3fix2-refresh.test.ts` (1-140, 520-549, daftar uji), `src/lib/studio/services/revisions/v2/commit.ts:200-260`, `src/lib/studio/services/structure/rows.ts:508-527`, `src/lib/studio/services/submit/meta.ts:15-43`, `docs/STUDIO-AGENT-GUIDE.md:1840-1950`, `hermes_trial/06_contract_trial3_brief.md` (grep run M/agent-id), `decisions/decisions.md` (D-446..D-452), `gateway_check/15b_review_r3_fixes.md`, `delegation_progress/coder_execution_r3_f2.md`, keluaran asap coder `Temp/r3f2_smoke2/` (log + driver).
