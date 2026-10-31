---
type: requirements
confidence: medium-high
task_id: doc_artifact_studio
step: DC-02
agent: data-analyst
date: 2026-10-30
status: complete
amended: 2026-10-30 DC-33 (D-398); 2026-10-31 DOC-FIX-B (document-specialist; review DC-42 F-01, review kode DC-40 L1/L2, security DC-41 M-2/L-2/L-4/L-5/L-6; D-395, D-400, D-402, D-403, D-405, D-406, D-407)
binding: D-139, D-322 (H3), D-334, D-341..D-349, D-354, D-361 (U-1..U-4 menimpa blueprint 07), D-21, D-247, D-324, D-347
inputs: identification/07_document_contract_blueprint.md (§0-§4, baris DC-01..DC-48), research/10_contract_corpus_inventory.md (DC-01), identification/06_document_contract_original.md, identification/06_document_contract_translated.md, decisions/decisions.md, masterplan/01_specs.md, masterplan/03_structural_sections_specs.md, src/lib/studio/contract/**, src/lib/studio/registry/{slots,sections,charts}.ts, src/lib/studio/params/structure.ts, prisma/schema.prisma, prisma/migrations/20260927154000_add_ilsearchdoc/migration.sql, prisma/seed-studio.ts, src/lib/studio/http/rate-limit.ts, src/lib/studio/services/render/naming.ts, src/app/api/studio/files/[id]/route.ts, src/app/api/studio/documents/route.ts
---

# 05 Register Document Contract: Laporan Kerja Agen (DC-02)

Dokumen ini adalah **register nama tunggal** untuk fase document contract (baris DC-03..DC-48 blueprint 07). Baris berikutnya hanya merujuk nama di sini. Nama baru di luar register ini diajukan lewat `delegation_progress/file_requests.md` ke controller.

## 0. Aturan baca, prefiks, sumber

### 0.1 Aturan register

1. Setiap nama baru (kode galat, checkId, route, model, kolom, enum, konstanta, tipe, antarmuka, slug, kunci outline) **didefinisikan tepat satu kali**, di baris tabel yang berawalan ID. Di tempat lain nama hanya dirujuk.
2. Nama lama (register 01 dan 03, kode yang ada) hanya dirujuk dan tidak didefinisikan ulang. Perluasan nama lama dicatat sebagai amandemen `AM-` (§14.3).
3. Tahap 1 = U-1: satu jenis kontrak `agentWorkReport` (CK-01). Jenis lain dicatat sebagai **dicadangkan** (§1.2) tanpa spesifikasi penuh dan tanpa masuk enum kode.
4. Klaim faktual membawa sumber `file:baris`, nomor bagian inventaris (`inv §n`), atau kode keputusan. Klaim tanpa sumber diberi label **hipotesis**. Asumsi diberi ID `CA-` (§19.1).
5. Path singkat: `<task>` = `docs/2026-10-22_doc_artifact_studio`, `L` = `src/lib/studio`, `API` = `src/app/api/studio`.
6. Catatan penulisan: alat agen ini tidak memiliki perintah ganti nama berkas, sehingga berkas ditulis langsung dengan satu operasi tulis utuh (bukan berkas sementara lalu rename). Isi tidak terpengaruh.

### 0.2 Prefiks ID (tidak bentrok dengan register 01, 03, blueprint 07)

| Prefiks | Isi | Rentang di register ini | Lanjutan dari |
|---|---|---|---|
| `CK-` | Jenis kontrak | CK-01 aktif; CK-02..CK-05 dicadangkan | baru |
| `CV-` | Vonis D-139 per medan baru | CV-01..CV-26 | baru |
| `CS-` / `CI-` / `CD-` | Kode status laporan / status butir / vonis | CS-01..CS-05, CI-01..CI-07, CD-01..CD-04 | baru |
| `CO-` | Outline bab wajib | CO-01..CO-05 | baru |
| `CF-` | Medan payload `contractRecord` | CF-01..CF-13 | baru |
| `KD-` | Keputusan desain | KD-29..KD-47 | 03 KD-07..KD-28 |
| `T2-` | Tipe kontrak v2 | T2-61..T2-74 | 03 T2-01..T2-60c |
| `DF-` | Medan tampilan terlarang | DF-72, DF-73 | 03 DF-01..DF-71 |
| `SL-` | Slot kerangka templat | SL-08..SL-10 | 03 SL-01..SL-07 |
| `M` / `MX` | Model baru / kolom-relasi model lama | M19..M21 / MX08..MX12 | 03 M10..M18 / MX01..MX07 |
| `E` | Enum TS | E44..E57 | 03 E29..E43 |
| `C` | Konstanta | C34..C60 | 03 C18..C33c |
| `EC` | Kode galat HTTP baru | EC25..EC28 | 03 EC01..EC24 |
| `CH-` | checkId `SCHEMA_INVALID` baru | CH-01..CH-06 | 03 E41 |
| `CW-` | Kode peringatan kontrak | CW-01..CW-04 | baru |
| `DR-` | Kode isu draf dan alasan 413 | DR-01..DR-10 | baru |
| `R` | Route | R21..R23 (baru), R03/R10/R17 (berubah) | 03 R01..R20 |
| `I` | Antarmuka modul | I54..I68 | 03 I44..I53 |
| `CU-` | Bentuk `chart.custom` | CU-01..CU-09 | baru |
| `FN-` | Aturan nama berkas final | FN-01..FN-08 | baru |
| `QH-` | Aturan header kuota | QH-01..QH-06 | baru |
| `GA-` / `GL-` / `GF-` / `GS-` / `GI-` / `GV-` | Alias generator: judul, label K1, kunci kepala, status laporan, status butir, vonis | lihat §16 | baru |
| `NV-` | Kasus negatif validasi (DC-07) | NV-01..NV-12 | baru |
| `DX-` | Kasus ekstraktor draf (DC-21) | DX-1..DX-8 | baru |
| `AM-` | Amandemen nama lama | AM-01..AM-17 | baru |
| `MU-` | Metrik pemakaian U-3 | MU-1, MU-2 | baru |
| `BA-` | Penyesuaian baris blueprint akibat U-1..U-4 | BA-01..BA-48 | baru |
| `CA-` | Asumsi | CA-1..CA-11 | baru (AS-1..AS-8 milik blueprint 07) |
| `RK-` | Risiko | RK-18..RK-29 | 03 RK-01..RK-17 |
| `CQ-` | Butir keputusan terbuka | CQ-1..CQ-5 | baru (KC-n dipakai 01, 03, 07 dengan arti berbeda) |
| `AC-` | Kriteria penerimaan | AC-11..AC-24 | 03 AC-1..AC-10 |

### 0.3 Sumber yang dibaca

| Sumber | Dipakai untuk | Bukti |
|---|---|---|
| Blueprint 07 §0-§4 + baris DC-01..DC-48 | usulan desain, baris yang disesuaikan | `identification/07_document_contract_blueprint.md:19-42, 125-276, 286-335, 489-541` |
| D-361 (persetujuan + U-1..U-4) | lingkup tahap 1 mengikat | `decisions/decisions.md:366` |
| D-139, D-322, D-334, D-341..D-349, D-354 | prinsip konten murni, tanpa tulis workspace, rahasia DEV, syarat Hermes | `decisions/decisions.md:144, 327, 339, 346-359` |
| Intake 06 | kutipan USER, lingkup | `identification/06_document_contract_original.md:7-12`; `06_document_contract_translated.md:11-19` |
| Inventaris DC-01 | kosakata status, judul, label, pola kartu, bentuk bukti | `research/10_contract_corpus_inventory.md` inv §3.2 (:110-120), §3.3 (:126-139), §4 K1 (:143-313), K2 (:367-470), K3 (:519-682), K4 (:756-784), K5 (:990-1018), K6 (:1222-1250), §5 (:2083-2104), §6 R1-R3 (:2106-2536), §8 (:2731-2740) |
| Register 03 | konvensi kode galat, DF, slot, route R01-R20, gaya SQL | `masterplan/03_structural_sections_specs.md:19-49, 123-272, 344-361, 462-570, 574-598, 787-911, 1122-1169` |
| Register 01 | model M01-M09, rollback, larangan migrasi | `masterplan/01_specs.md:41-131, 133-138` |
| 69 kode galat yang ada | cek bentrok | `L/contract/errors.ts:18-95` (dihitung: 36 + 4 + 1 + 3 + 24 + 1 = 69) |
| Konstanta dan route | perluasan C16, C33, pola | `L/contract/env.ts:56-137`; `L/registry/slots.ts:25-34, 59-80` |
| checkId v2 | perluasan E41 | `L/contract/enums.ts:430-439` (sebelum DC-05); **Amandemen DC-33 (D-384):** sesudah DC-05 `SCHEMA_V2_CHECK_IDS` = `L/contract/enums.ts:436-452` (14 entri) |
| Slot payload | perluasan T2-44 | `L/contract/types/v2/slot.ts:100-106` |
| Registri section | pin 51, kelompok 29/7/15, catalogId S25-S29 | `L/registry/sections.ts:400-463, 646-649` |
| Chart | kode tergambar dan `dataShape` | `L/registry/charts.ts:713-1093` |
| Model Studio + IlSearchDoc | gaya kolom, preseden tsvector | `prisma/schema.prisma:556-577, 689-796, 893-923, 1148-1201`; `prisma/migrations/20260927154000_add_ilsearchdoc/migration.sql:29-34` |
| Migrasi terakhir | urutan nama migrasi | Glob `prisma/migrations/*/migration.sql` (terakhir `20261023200000_add_studio_structure`) |
| Seed | slug preset `datum-gsp-preset` | `prisma/seed-studio.ts:509-512` |
| Limiter | `remaining` sudah dihitung | `L/http/rate-limit.ts:7-12, 44-47` |
| Bucket yang ada | render 30/60 s, validate 120/60 s, import 60/60 s | `L/http/render-guard.ts:22-37`; `API/validate/_shared/validate-rate.ts:22-37`; `API/import/markdown/_lib/import-rate.ts:18-33` |
| Nama DATUM, ekstensi | dasar nama final | `L/services/render/naming.ts:10-16, 51-61` |
| R10 | `?verify=1`, header sha | `API/files/[id]/route.ts:7-10, 40-58` |
| R04 GET | batas take 50/200, pola filter | `API/documents/route.ts:81-82, 204-226` |
| Kode jenis dokumen | `LAP` ada di enum P3-20 | `L/params/governance-language.ts:114-119` |
| Format bawaan render | daftar kosong diteruskan ke default mesin | `L/services/render/scope.ts:132-134`; `L/services/render/pure/render.ts:77` |
| Versi Prisma | indeks `type: Gin` | `package.json:20,33` (`^6.19.2`) |

Kelengkapan data: cukup untuk register. Fakta yang tidak dapat diverifikasi dengan alat agen ini (tanpa eksekusi SQL/kode) diberi label hipotesis dan langkah verifikasi (CA-3, CA-4, CA-5).

## 1. Lingkup tahap 1 dan tahap berikut

### 1.1 Penerapan keputusan USER (D-361)

| Keputusan | Isi mengikat | Penerapan di register |
|---|---|---|
| U-1 | Satu jenis: laporan kerja tiap agen, pengganti laporan kerja di `docs/` | CK-01 `agentWorkReport`; kerangka SL-08..SL-10; jenis lain dicadangkan (§1.2) |
| U-2 | Nama final = nama unduhan bawaan untuk dokumen ber-contractKind; dokumen output biasa tetap nama DATUM; header nama final selalu ada | FN-06, FN-07, R10 (§9.5) |
| U-3 | Penulis tunggal tidak ditegakkan teknis | KD-45; pelaku dari kolom yang ada; MU-1, MU-2 |
| U-4 | Korpus lama tidak dikonversi; generator hanya untuk banding 3 laporan + draf | §16 dipakai DC-24/DC-25/DC-37 saja; tidak ada baris konversi massal |
| Tetap | D-139; Studio tidak menulis ke workspace bersama (D-322 H3); migrasi aditif 0 DROP (D-21); hanya DB v21 | §3, §7.4, CA-11 |

### 1.2 Jenis kontrak

| ID | contractKind | Slug templat | Tier | Status tahap | Catatan |
|---|---|---|---|---|---|
| CK-01 | `agentWorkReport` | `laporan-kerja-agen` | NOTA | **aktif** | preset `datum-gsp-preset` (GSP DATUM, `seed-studio.ts:509-510`); kerangka §6.3; status E45 |
| CK-02 | `missionContract` (dicadangkan) | `kontrak-misi` (dicadangkan) | NOTA | tahap berikut | usulan blueprint 07 §2.1; tidak masuk E44, tidak di-seed |
| CK-03 | `phaseReport` (dicadangkan) | `laporan-fase` (dicadangkan) | NOTA | tahap berikut | idem |
| CK-04 | `waveBlueprint` (dicadangkan) | `blueprint-gelombang` (dicadangkan) | NOTA | tahap berikut | idem |
| CK-05 | `completionReport` (dicadangkan) | `laporan-selesai` (dicadangkan) | NOTA | tahap berikut | idem |

Nama CK-02..CK-05 dicadangkan agar tidak dipakai untuk arti lain. Set status usulan blueprint 07 §2.1 untuk jenis itu tidak mengikat.

### 1.3 Menambah jenis tanpa migrasi baru

Kolom jenis dan status bertipe TEXT (KD-29), bukan enum Prisma. Menambah jenis = (1) tambah anggota E44 dan satu entri C58; (2) tambah kode status jenis itu ke enum skema `status` (gabungan, KD-32); (3) satu templat lewat seed; (4) alias generator. Tidak ada DDL. Bila set status dua jenis berbeda arti untuk kode yang sama, pemeriksaan per jenis di I54 menolak dengan EC baru (didaftarkan saat jenis kedua ditambahkan; RK-27).

## 2. Keputusan desain (tier 1)

| ID | Keputusan | Alternatif ditolak | Alasan dan bukti |
|---|---|---|---|
| KD-29 | `contractKind`, `status`, `owner`, dll. disimpan TEXT; himpunan tertutup ditegakkan kontrak dan registri | Enum Prisma | U-1 mewajibkan jenis bertambah tanpa migrasi; enum Prisma menuntut `ALTER TYPE` |
| KD-30 | Payload `contractRecord` tanpa medan `kind`; jenis berasal dari templat dokumen | `kind` di payload (redundan) | Satu jenis di tahap 1; medan wajib yang selalu bernilai sama menambah beban agen (intake 06 butir 3) |
| KD-31 | Outline bab wajib didefinisikan di registri jenis (C58), bukan ParamDef `slot.outline`. Kelengkapan: `expected` = kunci CO wajib ∪ outline dokumen | ParamDef baru di `L/params/structure.ts` (blueprint DC-06) | Satu sumber per jenis; tidak menambah permukaan parameter; `params/structure.ts` tidak disentuh (BA-06) |
| KD-32 | Pelanggaran enum, pola, tanggal pada payload = 400 `SCHEMA_INVALID` dengan checkId baru (CH-01..CH-04); enum skema `status` = gabungan set jenis aktif | Kode 422 per medan (`CONTRACT_STATUS_INVALID`, dst.) | Konsisten dengan pola DISPLAY_FIELD (03 §5.1); JSON Schema memuat enum tertutup sesuai syarat Hermes (D-341) |
| KD-33 | Bukti terstruktur `evidence[]` di payload (jenis dari korpus), tanpa tabel DB | Hanya prosa di bab bukti; tabel DB baru | Bukti adalah bentuk paling umum di laporan: path 98-100%, ukuran byte 90%, sha 72% di K1 (inv §4 K1 :295-306); exit code 96% di R1 (inv §6 :2261). Cukup dicari lewat R22 |
| KD-34 | Setiap butir menjadi baris M17 `F:record/<n>` bertipe `contractItem`; identitas butir dicocokkan per `key` lintas revisi | Hanya satu baris `F:record` | Preseden `sourceRegisterEntry` (03 §4.6 :412); butir dapat dirujuk documentId+pid dan ditemukan R22 |
| KD-35 | Enam kolom cermin di `StudioDocument` (MX09) untuk filter R21; M19-M21 per revisi untuk riwayat, butir, rujukan balik | Join M19 ke revisi terkini untuk semua filter | Preseden kolom cermin `completeness` (`schema.prisma:782`); filter R21 langsung berindeks |
| KD-36 | Rujukan ke dokumen sasaran tanpa FK (string + validasi layanan saat tulis) | FK Restrict ke `StudioDocument` | FK lintas agregat menghalangi hapus dokumen uji; pola KD-02 01_specs (Restrict hanya lintas templat) |
| KD-37 | Kolom `tsv` GENERATED pada `StudioDocBlock` dengan `left(..., C42)`, konfigurasi `simple`; tanpa indeks trigram di tahap 1 | Trigram juga (blueprint 07 KC-1 a) | Salinan penuh per revisi (03 §3.1 :145) membuat GIN trigram besar; batas ukuran nilai tsvector Postgres (hipotesis besarnya) dijaga potongan C42; trigram dapat ditambah migrasi berikut bila DC-39 menunjukkan kebutuhan (CQ-5) |
| KD-38 | Bucket kuota baru `query` (R21, R22). Header kuota melaporkan satu bucket: yang sisanya terkecil sesudah panggilan. Amandemen DOC-FIX-C (D-411, D-413): kunci per agen + plafon identitas (L-4) hanya berlaku pada bucket `render` dan `validate`, yang route-nya menagih sesudah membaca `agentId` badan; bucket `import` dan `query` selalu satu kunci per identitas (§9.6) | Daftar bucket berpisah koma | Satu angka lebih mudah diikuti agen; R08 `?preview=html` memakai dua bucket (03 §12 R08) |
| KD-39 | Nama final dihitung saat baca dari baris `StudioOutputFile` + dokumen; tanpa kolom baru. Berkas artefak memakai `rev0` dan awalan C53 | Kolom `finalFileName` tersimpan | Semua masukan sudah ada (`schema.prisma:893-908`); blueprint 07 §1.2 butir 3 |
| KD-40 | R10 mendapat metode HEAD dan `?name=`; verifikasi nama-saja lewat R21 `docNumber` yang menerima bentuk aman | Route verifikasi baru | Tanpa route tambahan; HEAD memeriksa tanpa mengunduh badan |
| KD-41 | Dokumen ber-contractKind: bila `formats` dan `figures` R17 absen, format = C40 (HTML) | Bawaan mesin DOCX+PDF+HTML | `pure/render.ts:77`; PDF di DEV masih menunggu USER (D-322) sehingga bawaan lama memicu 503 preflight |
| KD-42 | Generator tidak pernah mengisi status bawaan. Status kepala hilang atau tanpa alias dan tanpa `--status` → keluar kode 3 | Isi `draft` + peringatan | KE-6 mensyaratkan 0 status ditebak (blueprint 07 :516) |
| KD-43 | R23 menagih bucket validate satu kali per blok | Sekali per panggilan | Setiap blok = satu dry-run R08 (biaya setara) |
| KD-44 | Blok draf = pagar tepat tiga backtick + info `json`, mulai kolom 1. Pagar lain diabaikan beserta isinya | CommonMark penuh | Deterministik dan dapat dijelaskan dalam satu kalimat; contoh JSON di pagar ```` ```text ```` tidak terkirim |
| KD-45 | U-3: tanpa penegakan. Pelaku = `StudioRevision.createdBy` dan `StudioDocSection.lastFilledBy` (sudah ada); metrik MU-1/MU-2 dari SQL baca-saja | Peringatan `CONTRACT_WRITER_CHANGED` (blueprint 07 U-3 a) | D-361 U-3 "jangan ditegakkan sekarang"; `agentId` hanya label (`auth.ts:16-19`, blueprint 07 §1.2 butir 6) |
| KD-46 | Respons kiriman mendapat `warnings` opsional untuk peringatan non-penahan (pid pensiun) | Peringatan hanya di R08 | Agen yang tidak menjalankan R08 tetap melihat peringatan (blueprint 07 KC-3 a) |
| KD-47 | `chart.custom` hanya pada `ChartV2` (bukan panel komposit); 9 kombinasi dipetakan ke perender yang ada | Panel juga; perender baru | Permukaan mesin minimal (blueprint 07 R11) |

Amandemen DOC-FIX-B: (1) KD-37 dikukuhkan dan CQ-5 ditutup, trigram tidak diperlukan (D-400; rincian §19.4). (2) KD-43 diperhalus: R23 menagih max(1, jumlah blok dry-run), sehingga draf tanpa blok dry-run tetap ditagih satu unit (security DC-41 L-2, D-402, D-407; §9.3). (3) KD-38 diperluas: di semua bucket (dikoreksi Amandemen DOC-FIX-C, D-411/D-413: hanya `render` dan `validate`; lihat KD-38 dan §9.6), pemanggil yang mengirim `agentId` dikunci per identitas + `agentId` dengan plafon identitas, sedangkan pemanggil tanpa `agentId` tetap satu kunci per identitas (security DC-41 L-4, D-402, D-407; §9.6).

## 3. Tabel vonis D-139 untuk setiap medan baru

Uji: apakah agen harus memahami tampilan untuk mengisi medan ini? Bila ya, cacat desain (D-139, `decisions.md:144`).

| ID | Medan / nama baru | Pengirim | Vonis | Alasan |
|---|---|---|---|---|
| CV-01 | Section type dan slot `contractRecord` | templat | Lulus | Struktur milik templat; agen hanya mengisi |
| CV-02 | `status` (CF-02) | agen | Lulus | Kode ASCII adalah data; label tampil dari C58 |
| CV-03 | `verdict` (CF-03) | agen | Lulus | Hasil cek (PASS/FAIL) adalah fakta, bukan gaya |
| CV-04 | `owner` (CF-04) | agen | Lulus | Identitas pelaku = data |
| CV-05 | `initiator` (CF-05) | agen | Lulus | idem |
| CV-06 | `taskRef` (CF-06) | agen | Lulus | Rujukan baris/kartu non-heks = data |
| CV-07 | `reportedAt` (CF-07) | agen | Lulus | Waktu fakta; format tampil tanggal milik templat |
| CV-08 | `due` (CF-08) | agen | Lulus | idem |
| CV-09 | `phase.from`, `phase.to` (CF-09) | agen | Lulus | Transisi fase = data (pola `[FASE]` inv §4 K1 :312) |
| CV-10 | `cardIds` (CF-10) | agen | Lulus | Id kanban = data |
| CV-11 | `refs[]`: `documentId`, `docNumber`, `pid`, `revisionNo`, `rel` (CF-11) | agen | Lulus | Alamat isi, bukan path; tampilan rujukan dari templat |
| CV-12 | `evidence[]`: `kind`, `ref`, `sha256`, `bytes`, `line`, `exitCode`, `item`, `note` (CF-12) | agen | Lulus | Fakta bukti; urutan kolom dan label tabel bukti milik C58 |
| CV-13 | `items[]`: `key`, `title`, `status`, `owner`, `phase`, `due`, `dependsOn` (CF-13) | agen | Lulus | Butir kerja = data |
| CV-14 | Label medan, status, kolom tabel (bagian `labels` C58) | registri | Lulus | Agen tidak pernah mengirim label |
| CV-15 | Outline bab wajib CO-01..CO-05 | registri | Lulus | Struktur milik templat; agen mengisi bab |
| CV-16 | `label`, `columns`, `order`, `heading` di payload kontrak | agen (terlarang) | Penjaga | Ditolak DF-72 `DISPLAY_FIELD` |
| CV-17 | `chart.code = "custom"` + `form.mark`, `form.orientation`, `form.stacked` | agen | Lulus bersyarat | Pilihan analitis setara memilih kode preset; warna, ukuran, sumbu tetap milik templat |
| CV-18 | `palette`, `axis`, `max`, `width`, `height`, `legend` di `form` | agen (terlarang) | Penjaga | Ditolak DF-73 `DISPLAY_FIELD` |
| CV-19 | Nama final (header C50, `finalFileName`, Content-Disposition) | mesin | Lulus | Metadata unduhan; agen tidak mengirimnya |
| CV-20 | Header kuota C48, C49 | mesin | Lulus | Metadata respons |
| CV-21 | Kepala draf MD (judul, `tujuan`, `langkah-berikut`, `basis`) | agen (berkas lokal) | Lulus | Tidak pernah dikirim; ekstraktor hanya mengambil blok `json` |
| CV-22 | Kolom cermin MX09, model M19-M21, kolom `tsv` | mesin | Lulus | Turunan payload; tidak ada di kontrak kiriman |
| CV-23 | `SubmitResultV2.warnings` (T2-67) | mesin | Lulus | Respons terstruktur yang dapat diteruskan |
| CV-24 | Parameter R21, R22, badan R23 | agen (baca) | Lulus | Kata kerja baca; tidak menyentuh tampilan |
| CV-25 | Format bawaan HTML (C40, KD-41) | mesin | Lulus | Agen tidak wajib memilih format |
| CV-26 | Alias generator §16 | registri | Lulus | Agen tidak memetakan judul atau status |

## 4. Kosakata yang dikunci dari korpus

### 4.1 Status laporan (E45, `status` CF-02)

| ID | Kode | Label tampil (C58) | Bukti korpus |
|---|---|---|---|
| CS-01 | `draft` | Draf | K3 status kepala `draft` 69 dari 200 berkas bernilai-status, `working-draft` 2 (inv §4 K3 :622-634); K1 `draft` 4 (:246-253) |
| CS-02 | `complete` | Selesai | Nilai teratas semua kelas: R1 213 dari 232 (inv §6 :2211-2216), K3 94, K2 3 dari 3 (inv §3.3 :126-139) |
| CS-03 | `partial` | Sebagian | K3 `partial` 1 + `partial-handoff` 2 (inv §4 K3 :634-635) |
| CS-04 | `blocked` | Terhambat | K1 `blocked` 1 (:252); token `blocked` di 17% K1 (:270) |
| CS-05 | `needs-review` | Perlu tinjauan | R1 `needs-review` 19 (inv §6 :2216); K3 2 (:632) |

Kode berhuruf kecil ASCII dengan tanda hubung, sama persis dengan bentuk yang sudah ditulis agen (inv §6 :2216), sehingga agen tidak menerjemahkan.

### 4.2 Status butir (E46, `items[].status`)

| ID | Kode | Label tampil | Bukti korpus (token, berkas K1 dari 242) |
|---|---|---|---|
| CI-01 | `todo` | Belum mulai | `todo` 51 (21%) (inv §4 K1 :280); `sisa:` di JALUR (:344) |
| CI-02 | `ready` | Siap | `ready` 41 (17%) (:278) |
| CI-03 | `running` | Berjalan | `running` 84 (35%), `berjalan` 237 (98%) (:277, :285) |
| CI-04 | `review` | Ditinjau | `review` 40 (17%) (:281) |
| CI-05 | `done` | Selesai | `done` 164 (68%), `selesai` 238 (98%) (:276, :286) |
| CI-06 | `blocked` | Terhambat | `blocked` 40 (17%) (:270) |
| CI-07 | `cancelled` | Dibatalkan | Tidak terukur di inventaris; dibawa dari usulan blueprint 07 §2.1 (**hipotesis kebutuhan**, dipertahankan agar kartu yang dibatalkan tidak dipaksa ke kode lain) |

### 4.3 Vonis (E47, `verdict` CF-03)

| ID | Kode | Bukti korpus |
|---|---|---|
| CD-01 | `PASS` | Kemunculan K1 PASS=1334 (inv §4 K1 :288); vonis teratas K3-K7 (inv §3.3 :128-134) |
| CD-02 | `CAUTION` | Token CAUTION di K3 3 berkas (:669); verdict PASS/CAUTION/FAIL dipakai gerbang review dan security fase ini (blueprint 07 :327-328) |
| CD-03 | `FAIL` | K1 FAIL=483 (:288); K3 37 berkas (:647) |
| CD-04 | `NEEDS_REVIEW` | K1 NEEDS_REVIEW=55 (:288); K3 9 berkas (:648) |

Huruf besar dipertahankan karena itulah bentuk korpus (inv §4 K1 :288). Label tampil = kode apa adanya.

### 4.4 Outline bab wajib (E50, slot `content`)

Kunci bab slot `chapter` wajib numerik (C33a `^[1-9][0-9]{0,2}$`, `env.ts:133`), sehingga setiap kunci outline semantik dipetakan ke satu kunci bab tetap.

| ID | chapterKey | outlineKey (E50) | Judul anjuran (C58) | Wajib | Dasar korpus |
|---|---|---|---|---|---|
| CO-01 | `1` | `ringkasan` | Ringkasan | ya | Label `RINGKAS` 1097 kemunculan, `kv:ringkas` 236/242 (98%) K1 (inv §4 K1 :204-205, :313); judul `ringkasan` teratas K3 60 berkas (:528) |
| CO-02 | `2` | `rincian` | Rincian kerja | ya | `JALUR` 1048 (K1 :313); R1 `perubahan` 23, `changes made` 21, `executed steps` 20 (inv §6 :2133-2137) |
| CO-03 | `3` | `bukti` | Bukti | ya | `ARTEFAK` 1060 (K1 :313); R1 `bukti` 50 berkas, judul teratas (inv §6 :2127); K3 `verifikasi` 36, `artefak` 30 (:529-530) |
| CO-04 | `4` | `isu` | Isu terbuka | ya | R1 `persistent issues` 36, `issues & decisions` 32 (:2128, :2130); `HAMBAT` 43 + `LIMIT` 48 (K1 :313) |
| CO-05 | `5` | `lanjut` | Langkah berikut | ya | `RENCANA` 1039 + `ESTIMASI` 1013 (K1 :313); R1 `next steps` 33 (:2129) |

Aturan: bab di luar CO (kunci 6 dan seterusnya) tetap diterima dan tercantum di `present` (03 §8.2 :695). Judul bab dikirim agen (`ChapterV2.title` wajib, 03 T2-31); judul tidak dibandingkan dengan judul anjuran. Isu terbuka kosong ditulis sebagai satu paragraf (mis. "Tidak ada"), sehingga bab tetap ada.

Batas korpus yang dicatat: tidak ada judul yang hampir selalu ada di kelas laporan selain kunci K1 (inv §3.2 :110-120; 196 dari 198 judul K1 dan 1284 dari 1295 judul K3 hanya ada di ≤ 5% berkas). Outline adalah sintesis lima fungsi yang muncul lintas kelas, bukan judul tunggal yang dominan.

### 4.5 Pola id (bukti)

| Pola | Konstanta | Bukti |
|---|---|---|
| Kartu kanban `t_` + 8 heksa | C34 | Histogram panjang heksa setelah `t_` di K1: 8 → 3342, 2 → 1; 1936 id unik (inv §4 K1 :290) |
| Label non-heksa (baris, kartu berlabel) | C35 | `PSIKOTES-1008`, `FIX-E3`, `D1-D6`, `CRAWL-W1` (inv §4 K1 :291); R1 memakai `row`/`task_id` (inv §6 :2172, :2184; §8 butir 5-6) |
| Pelaku (agen/profil) | C36 | `gsp-master01`, `gsp-document-writer` (inv §4 K2 :504; D-341); agen repo `coder-execution` (inv §6 :2170) — huruf kecil (CA-1) |

## 5. Kontrak: payload `contractRecord`

### 5.1 Medan payload

| ID | Medan | Tipe | Wajib | Aturan |
|---|---|---|---|---|
| CF-01 | `type` | `"contractRecord"` | ya | diskriminator slot (03 §4.4) |
| CF-02 | `status` | E45 | ya | enum skema = gabungan set jenis aktif (KD-32) |
| CF-03 | `verdict` | E47 | tidak | |
| CF-04 | `owner` | string C36 | tidak | pelaku penulis laporan |
| CF-05 | `initiator` | string C36 | tidak | pemberi tugas (mis. `controller`, `user`) |
| CF-06 | `taskRef` | string C35 | tidak | baris/kartu non-heksa, mis. `DC-02`, `FIX-R1` |
| CF-07 | `reportedAt` | string C37 | ya | tanggal atau waktu ber-zona; dinormalkan ke UTC saat proyeksi |
| CF-08 | `due` | string tanggal (`isoDate` common v2, `common.schema.ts:42`) | tidak | tenggat langkah berikut |
| CF-09 | `phase` | T2-65 | tidak | `{ from?, to }` |
| CF-10 | `cardIds` | string C34 [] | tidak | unik, ≤ C39.cardIds |
| CF-11 | `refs` | T2-63 [] | tidak | ≤ C39.refs |
| CF-12 | `evidence` | T2-64 [] | tidak | ≤ C39.evidence |
| CF-13 | `items` | T2-62 [] | tidak | ≤ C39.items; `key` unik (EC27) |

### 5.2 Tipe TS (`L/contract/types/v2/contract.ts`, berkas baru milik DC-05)

| ID | Nama | Definisi |
|---|---|---|
| T2-61 | `ContractRecordPayloadV2` | `{ type: "contractRecord"; status: AgentWorkReportStatus; verdict?: ContractVerdict; owner?: string; initiator?: string; taskRef?: string; reportedAt: string; due?: string; phase?: ContractPhaseV2; cardIds?: string[]; refs?: ContractRefV2[]; evidence?: ContractEvidenceV2[]; items?: ContractItemV2[] }` |
| T2-62 | `ContractItemV2` | `{ key: string; title: InlineV2; status: ContractItemStatus; owner?: string; phase?: string; due?: string; dependsOn?: string[] }` |
| T2-63 | `ContractRefV2` | `{ documentId?: string; docNumber?: string; pid?: string; revisionNo?: number; rel: ContractRefRel }` dengan tepat satu dari `documentId`/`docNumber` |
| T2-64 | `ContractEvidenceV2` | `{ kind: ContractEvidenceKind; ref: string; sha256?: string; bytes?: number; line?: number; exitCode?: number; item?: string; note?: InlineV2 }`; `line` hanya untuk `file`, `exitCode` hanya untuk `command` |
| T2-65 | `ContractPhaseV2` | `{ from?: string; to: string }` |
| T2-66 | `ChartCustomFormV2` | `{ mark: ChartCustomMark; orientation?: ChartCustomOrientation; stacked?: boolean }` (bawaan `vertical`, `false`) |
| T2-67 | `SubmitWarningV2` | `{ code: ContractWarningCode; pointer: string; message: string; details?: unknown }` |
| T2-68 | `ContractSummaryV2` | Butir R21 (§9.1) |
| T2-69 | `SearchHitV2` | Butir R22 (§9.2) |
| T2-70 | `DraftCheckResultV2` | Respons R23 dan keluaran CLI (§11.4) |
| T2-71 | `DraftBlockResultV2` | Hasil per blok (§11.4) |
| T2-72 | `DraftIssueV2` | `{ code: DraftIssueCode; severity: "error" \| "warning"; line?: number; column?: number; blockIndex?: number; message: string }` |
| T2-73 | `ContractKindDefV2` | Butir R03 `kind=contracts` dan entri C58 (§6.4) |
| T2-74 | `FinalFileNameParts` | `{ docNumberSafe: string; revisionNo: number; renderedAt: string /* ISO UTC detik */; sha8: string; ext: "docx" \| "pdf" \| "html" \| "svg" \| "png" }` |

### 5.3 JSON Schema 2020-12 (`$defs` baru di `L/contract/schema/v2/common.schema.ts`)

`$ref` ke `InlineV2` menunjuk def yang ada (`common.schema.ts:319`). Pola memakai nilai konstanta §14.1. Semua objek `additionalProperties: false`.

```json
{
  "ContractRecordPayloadV2": {
    "type": "object",
    "properties": {
      "type": { "const": "contractRecord" },
      "status": { "enum": ["draft", "complete", "partial", "blocked", "needs-review"] },
      "verdict": { "enum": ["PASS", "CAUTION", "FAIL", "NEEDS_REVIEW"] },
      "owner": { "type": "string", "pattern": "^[a-z0-9][a-z0-9._-]{0,63}$" },
      "initiator": { "type": "string", "pattern": "^[a-z0-9][a-z0-9._-]{0,63}$" },
      "taskRef": { "type": "string", "pattern": "^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$" },
      "reportedAt": {
        "type": "string",
        "pattern": "^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])(T([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d(\\.\\d{1,3})?)?(Z|[+-]([01]\\d|2[0-3]):[0-5]\\d))?$"
      },
      "due": { "type": "string", "pattern": "^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$" },
      "phase": { "$ref": "#/$defs/ContractPhaseV2" },
      "cardIds": {
        "type": "array", "maxItems": 64, "uniqueItems": true,
        "items": { "type": "string", "pattern": "^t_[0-9a-f]{8}$" }
      },
      "refs": { "type": "array", "maxItems": 100, "items": { "$ref": "#/$defs/ContractRefV2" } },
      "evidence": { "type": "array", "maxItems": 200, "items": { "$ref": "#/$defs/ContractEvidenceV2" } },
      "items": { "type": "array", "maxItems": 500, "items": { "$ref": "#/$defs/ContractItemV2" } }
    },
    "required": ["type", "status", "reportedAt"],
    "additionalProperties": false
  },
  "ContractPhaseV2": {
    "type": "object",
    "properties": {
      "from": { "type": "string", "minLength": 1, "maxLength": 64 },
      "to": { "type": "string", "minLength": 1, "maxLength": 64 }
    },
    "required": ["to"],
    "additionalProperties": false
  },
  "ContractRefV2": {
    "type": "object",
    "properties": {
      "documentId": { "type": "string", "pattern": "^[a-z0-9]{20,40}$" },
      "docNumber": { "type": "string", "minLength": 1, "maxLength": 80 },
      "pid": { "type": "string", "pattern": "^[a-z0-9][a-z0-9-]{2,63}$" },
      "revisionNo": { "type": "integer", "minimum": 1 },
      "rel": { "enum": ["basis", "evidence", "output", "supersedes"] }
    },
    "required": ["rel"],
    "oneOf": [ { "required": ["documentId"] }, { "required": ["docNumber"] } ],
    "additionalProperties": false
  },
  "ContractEvidenceV2": {
    "type": "object",
    "properties": {
      "kind": { "enum": ["file", "command", "commit", "correlation"] },
      "ref": { "type": "string", "minLength": 1, "maxLength": 500 },
      "sha256": { "type": "string", "pattern": "^[0-9a-f]{8,64}$" },
      "bytes": { "type": "integer", "minimum": 0 },
      "line": { "type": "integer", "minimum": 1 },
      "exitCode": { "type": "integer", "minimum": -2147483648, "maximum": 2147483647 },
      "item": { "type": "string", "pattern": "^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$" },
      "note": { "$ref": "#/$defs/InlineV2" }
    },
    "required": ["kind", "ref"],
    "allOf": [
      { "if": { "properties": { "kind": { "not": { "const": "file" } } } }, "then": { "not": { "required": ["line"] } } },
      { "if": { "properties": { "kind": { "not": { "const": "command" } } } }, "then": { "not": { "required": ["exitCode"] } } }
    ],
    "additionalProperties": false
  },
  "ContractItemV2": {
    "type": "object",
    "properties": {
      "key": { "type": "string", "pattern": "^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$" },
      "title": { "$ref": "#/$defs/InlineV2" },
      "status": { "enum": ["todo", "ready", "running", "review", "done", "blocked", "cancelled"] },
      "owner": { "type": "string", "pattern": "^[a-z0-9][a-z0-9._-]{0,63}$" },
      "phase": { "type": "string", "minLength": 1, "maxLength": 64 },
      "due": { "type": "string", "pattern": "^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$" },
      "dependsOn": {
        "type": "array", "maxItems": 32, "uniqueItems": true,
        "items": { "type": "string", "pattern": "^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$" }
      }
    },
    "required": ["key", "title", "status"],
    "additionalProperties": false
  },
  "ChartCustomFormV2": {
    "type": "object",
    "properties": {
      "mark": { "enum": ["bar", "line", "point", "area"] },
      "orientation": { "enum": ["vertical", "horizontal"] },
      "stacked": { "type": "boolean" }
    },
    "required": ["mark"],
    "additionalProperties": false
  }
}
```

Penyertaan: `SlotPayloadV2` (union, `common.schema.ts:634`) dan `DocSectionPayloadV2` (`:636`) mendapat anggota `ContractRecordPayloadV2` (AM-02). `ChartV2` (`:466`): `code` menerima `"custom"`; `form` = `ChartCustomFormV2`, wajib bila `code = "custom"` dan terlarang selain itu; bila `custom`, `data` wajib, `panels` dan `artifactId` terlarang (AM-03).

### 5.4 checkId `SCHEMA_INVALID` baru (perluasan E41, `enums.ts:430-439`, 8 → 14)

Deteksi = pemetaan galat ajv per pointer/kata kunci, ditambah pemeriksaan murni pasca-ajv (tanggal kalender). Status HTTP tetap 400 `SCHEMA_INVALID`.

Amandemen DC-33 (D-384): rujukan baris E41 di judul ini (`enums.ts:430-439`) adalah keadaan sebelum DC-05. Sesudah DC-05, `SCHEMA_V2_CHECK_IDS` berada di `L/contract/enums.ts:436-452`: 8 entri lama (:437-444) + CH-01..CH-06 (:446-451).

| ID | checkId | Pemicu | Pointer contoh |
|---|---|---|---|
| CH-01 | `CONTRACT_ENUM` | nilai di luar E45, E46, E47, E48, E49 | `/payload/status`, `/payload/items/0/status`, `/payload/refs/0/rel` |
| CH-02 | `CONTRACT_PATTERN` | pola C34, C35, C36, C38, pola `pid`/`documentId` ref gagal | `/payload/cardIds/0` |
| CH-03 | `CONTRACT_DATE` | pola C37/`isoDate` gagal atau tanggal tidak ada di kalender (mis. 2026-02-30) | `/payload/reportedAt` |
| CH-04 | `CONTRACT_REF_TARGET` | ref tanpa atau dengan keduanya `documentId` dan `docNumber`; `line`/`exitCode` pada `kind` yang salah | `/payload/refs/0` |
| CH-05 | `CHART_CUSTOM_FORM` | `form` hilang saat `code = "custom"`, `form` ada pada kode lain, `custom` di panel, `panels`/`artifactId` bersama `custom` | `/chapter/sections/0/blocks/2/form` |
| CH-06 | `SKELETON_CONTRACT_RECORD` | simpan templat/kerangka: slot `contractRecord` pada templat tanpa `contractKind`, lebih dari satu slot `contractRecord`, atau `repeatable = true` | `/template/skeleton/slots/0` |

### 5.5 Medan tampilan terlarang tambahan (perluasan C30, 71 → 73 entri)

| ID | Lokasi | Medan terlarang | Keterangan (`reason`) |
|---|---|---|---|
| DF-72 | `ContractRecordPayloadV2`, `ContractItemV2`, `ContractEvidenceV2`, `ContractRefV2` | `label`, `columns`, `order`, `heading` | label dan susunan tabel catatan diatur templat |
| DF-73 | `ChartCustomFormV2` | `palette`, `axis`, `max`, `width`, `height`, `legend` | rupa grafik kustom diatur templat |

Medan global yang sudah ada (mis. `color` DF-04, `layout` DF-19, `style` DF-47) tetap berlaku di objek baru (03 §5.1 :468).

Amandemen DC-33 (D-367): DF-72 berlaku di empat lokasi lewat satu entri. Untuk itu `DisplayFieldLocationRule` (`L/contract/schema/v2/forbidden.ts:77-87`) mendapat medan opsional `alsoAt?: readonly string[]` (lokasi tambahan dengan aturan sama). DF-72 = `location: "ContractRecordPayloadV2"`, `alsoAt: ["ContractItemV2", "ContractEvidenceV2", "ContractRefV2"]` (`forbidden.ts:130-135`); pencocokan lokasi = `location` sama ATAU termasuk `alsoAt` (`forbidden.ts:479`). Hitungan DISPLAY_FIELD tetap 73 entri (DF-72 dihitung satu). Nama ini diterima controller di D-367 dan didefinisikan di sini.

### 5.6 Aturan semantik layanan dan urutan evaluasi

Disisipkan ke urutan 03 §11.1 (:789-802):

| Langkah | Tempat | Pemeriksaan | Hasil gagal |
|---|---|---|---|
| 2 (skema) | validator kontrak, murni | CH-01..CH-05, DF-72, DF-73 | 400 `SCHEMA_INVALID` |
| 6b (struktur, murni, sebelum kunci) | I54 | `items[].key` unik; `status` anggota set jenis templat dokumen (identik dengan enum skema di tahap 1) | 422 EC27 |
| 9a (dalam transaksi, sebelum by-construction) | I55 | `refs[]`: dokumen ada (lewat `documentId` atau `docNumber`); `pid` pernah ada di `StudioDocIdentity` dokumen sasaran; `revisionNo` ≤ `currentRevisionNo` sasaran | 422 EC25 / EC26; pid pensiun = peringatan CW-01 di `warnings` (KD-46) |
| 9 (by-construction) | gerbang yang ada (`services/ingest/by-construction.ts`) | `chart.custom`: kombinasi `form` × bentuk data ada di CU-01..CU-09 | 422 EC28 |

Dry-run R08 menjalankan langkah yang sama dalam transaksi READ ONLY (03 §12 R08) dan memuat peringatan di `submitPreview.warnings` (AM-08). `evidence[].ref` tidak pernah dibuka, dibaca, atau di-resolve oleh Studio (CA-11).

Amandemen DOC-FIX-B (F-01 review DC-42, L2 review kode DC-40; D-374, D-395): tabel di atas digantikan oleh urutan yang dijalankan kode (FIX-C1). Dua koreksi: langkah 6b berjalan di dalam kunci dokumen, bukan "sebelum kunci"; dan EC28 menjadi langkah tersendiri sebelum I55, bukan bagian langkah 9.

| Langkah | Tempat | Pemeriksaan | Hasil gagal |
|---|---|---|---|
| 2 (skema) | validator kontrak, murni, sebelum kunci | CH-01..CH-05, DF-72, DF-73 | 400 `SCHEMA_INVALID` |
| 6 (gabung struktur) | `mergeSubmission`, di dalam kunci (`L/services/submit/pipeline.ts:840`) | struktur, pid §10, aset | 422 `PID_CONFLICT` / `ASSET_NOT_FOUND` dan isu struktur 03 §11.1 langkah 6-8 (mendahului 6b; struktural, diterima D-395) |
| 6b (I54) | `checkContractSource`, di dalam kunci, sesudah gabung, sebelum langkah 7 (`pipeline.ts:869`) | `items[].key` unik; `status` anggota set jenis templat; medan CH atas dokumen tergabung (`checkContractRecord`) | 400 `SCHEMA_INVALID` (checkId CH) lebih dulu; 422 EC27 hanya bila tidak ada isu CH di payload mana pun (`summarizeContractChecks`, `L/services/ingest/by-construction.ts:257-267`, FIX-QB) |
| 7 (lingkup) | di dalam kunci: cek idempoten (`:873`), FIX-H2 (`:894`), cek dasar §9.2 (`:921`) | 03 §11.1 langkah 7 | 200 `unchanged` / 409 `SCOPE_CONFLICT` |
| 7a (compose) | `composeV2` (`pipeline.ts:926-939`); dilempar `L/engine/chart/core/custom.ts:59-63` | `chart.custom`: kombinasi `form` × bentuk data ada di CU-01..CU-09 (I68) | 422 EC28, pointer blok lewat `withChartCustomPointer` (D-382) |
| 9a (I55) | gerbang async dalam transaksi (`assertByConstructionAsync`, `pipeline.ts:980`) | `refs[]` seperti baris 9a di atas | 422 EC25 / EC26; pid pensiun = CW-01 di `warnings` (KD-46) |
| 9 (by-construction) | gerbang yang ada (`services/ingest/by-construction.ts`) | cek by-construction 03 §11.1 langkah 9 | 422 `BY_CONSTRUCTION_FAILED` dan kode langkah 9 lainnya |

- Urutan sama di jalur sunting R16/R06/R14 (`L/services/revisions/v2/commit.ts:211` I54, `:215-228` compose, `:251` gerbang async), di R04 dokumen baru (`L/services/ingest/v2.ts:579` I54 sebelum compose), dan di dry-run R08. Kiriman yang memuat rujukan salah sekaligus `chart.custom` tak didukung menerima EC28 lebih dulu, bukan EC25/EC26.
- Akibat I54 di dalam kunci: pada jalur buat dokumen, baris dokumen dan kunci nomor `studio-docno` sudah diambil sebelum penolakan 6b; transaksi dibatalkan sehingga tidak ada sisa tulis (L2). Pada jalur buat, 403 `FORBIDDEN` templat terbatas (`pipeline.ts:766`) mendahului 409 `META_CONFLICT` (`:769`) dan 409 `DOC_NUMBER_EXISTS` (`:778`) (perilaku teramati, dicatat review DC-42 F-01).
- Cek lingkup R16/R14 (`L/services/revisions/v2/service.ts:256`, `:479`) mendahului I54 (`commit.ts:211`) tanpa efek pada hasil, karena R16/R06 tidak dapat menyentuh payload slot (`revisions/v2/ops.ts:98-101`) dan R14 tidak mengubah payload `record` (review kode DC-40 fokus 4, D-399).
- Peringatan R08 (AM-08, FIX-QB, D-403): cabang bab/slot membawa CW-01 di `submitPreview.warnings`; cabang dokumen `studio.doc/v2` (dokumen baru dan dokumen yang ada) membawa CW-01 di medan TINGKAT ATAS `warnings` badan respons R08, hanya bila tidak kosong, dengan pointer relatif badan seperti isu (`ValidateBody.warnings`, `API/validate/_shared/dry-run.ts:69-73`, diisi `:255-257` dari `IngestResultV2.contractWarnings`; dokumen yang ada: `L/services/ingest/v2.ts:868` menyalin `dry.result.warnings`).

### 5.7 Proyeksi alamat, baris, dan teks

| Baris M17 | Alamat | `type` | `textPlain` (urutan tetap, dipisah spasi, medan kosong dilewati) |
|---|---|---|---|
| Catatan | `F:record` | `contractRecord` | `status` `verdict` `owner` `initiator` `taskRef` `reportedAt` (UTC) `due` `phase.from->phase.to` `cardIds…` lalu per ref `rel documentId\|docNumber#pid@revisionNo` lalu per bukti `kind ref sha256` |
| Butir ke-n | `F:record/<n>` (n 1-based, urutan `items`) | `contractItem` | `key status <teks title> owner phase due dependsOn…` |

- Identitas butir dicocokkan per `key` lintas revisi (KD-34): butir dengan `key` yang sama mewarisi pid; butir baru mendapat pid bangkitan (03 §10 C20-C22); butir yang hilang dipensiunkan (03 §10 "Pensiun").
- `parseAddress` sudah menerima `F:<slotKey>/<n>` (03 AC-7), sehingga tata bahasa alamat tidak berubah.
- Amandemen DOC-FIX-B (L1 review kode DC-40; D-383, D-391, D-399): format pid bangkitan butir baru berbeda per jalur dan dicatat sebagai perilaku diketahui, bukan cacat. Jalur kiriman/commit (R04 v2, R12, R13, R16, R06, R14) memakai `dbPidAllocator` (`L/services/structure/pid.ts:121-127`): pid acak `p-…`, memuat semua pid dokumen termasuk pensiun sehingga tidak ada pemakaian ulang. Compose tanpa allocator memakai pid deterministik dari alamat, `slot-record-<n>` (`L/services/compose/snapshot.ts:192-195`, `L/services/compose/pids.ts:52-55`); format ini hanya tersimpan lewat `persistAdaptedV1` (R04 v1), yang adaptornya tidak pernah mengisi `sections.record` (D-391). Pewarisan per `key` (`inheritItemPids`, `L/services/structure/rows.ts:219-237`) bekerja lintas kedua format. Dampak yang terlihat: pratinjau R08 dokumen baru dapat menampilkan pid butir yang tidak sama dengan pid hasil simpan. Agen memakai pid dari respons kiriman atau R05, bukan dari pratinjau dry-run dokumen baru.

### 5.8 Contoh valid (dipakai DC-05 ajv, DC-07, DC-33)

Nilai ukuran dan sha di contoh bersifat ilustratif.

```json
{
  "$schema": "studio.slot/v2",
  "target": { "mission": { "folder": "2026-10-30_hermes-retrial" }, "docKey": "laporan-kerja-dc02" },
  "template": { "slug": "laporan-kerja-agen" },
  "meta": { "title": "Laporan kerja DC-02 register document contract" },
  "slot": "record",
  "payload": {
    "type": "contractRecord",
    "status": "complete",
    "owner": "data-analyst",
    "initiator": "controller",
    "taskRef": "DC-02",
    "reportedAt": "2026-10-30T19:30+07:00",
    "phase": { "from": "research", "to": "masterplan" },
    "cardIds": ["t_249c6b84"],
    "refs": [{ "documentId": "cmvui0qun000qv11gtygb1mk9", "pid": "p-8rj0w4aw6r", "rel": "basis" }],
    "evidence": [
      { "kind": "file", "ref": "docs/2026-10-22_doc_artifact_studio/masterplan/05_document_contract_specs.md", "bytes": 61234, "sha256": "55d324b1" },
      { "kind": "command", "ref": "npx tsc --noEmit -p tsconfig.json", "exitCode": 0 }
    ],
    "items": [
      { "key": "t_5943d415", "title": { "text": "Kunci kosakata status dari korpus" }, "status": "done", "owner": "data-analyst", "phase": "masterplan" },
      { "key": "DC-03", "title": { "text": "Protokol metrik efisiensi" }, "status": "ready", "dependsOn": ["DC-02"] }
    ]
  }
}
```

```json
{
  "$schema": "studio.chapter/v2",
  "target": { "mission": { "folder": "2026-10-30_hermes-retrial" }, "docKey": "laporan-kerja-dc02" },
  "chapter": {
    "key": "1",
    "title": { "text": "Ringkasan" },
    "sections": [{ "title": { "text": "Hasil" }, "blocks": [{ "type": "paragraph", "text": "Register 05 ditulis; empat kode galat baru." }] }]
  }
}
```

## 6. Registri, kerangka, kelengkapan

### 6.1 Section type `contractRecord` (`L/registry/sections.ts`, seed `StudioSectionType`)

| Medan `SectionTypeDef` | Nilai |
|---|---|
| `key` | `contractRecord` |
| `catalogId` | `S30` (S01..S29 terpakai, `sections.ts:401-453`; CA-3) |
| `group` / `register` | `DOCUMENT` / `INTERIOR` |
| `name` | `Catatan Kontrak` |
| `elements` | `["status", "penanggung jawab", "rujukan tugas", "waktu lapor", "kartu", "butir", "bukti", "rujukan dokumen"]` |
| `paramRefs` / `ruleRefs` | `[]` / `["D-139", "D-344"]` |
| `activeTiers` / `renderable` | semua tier / `true` |
| `sourceRef` | `register 05 §6.1` |

Pin: `SECTION_REGISTRY_COUNT` 51 → 52; `SECTION_REGISTRY_GROUP_COUNTS.DOCUMENT` 29 → 30 (AM-10).

Amandemen DC-33 (D-371, D-384): baris `activeTiers` di atas ("semua tier") digantikan. Nilai di kode = `NONE` (`[]`, `L/registry/sections.ts:20`, `:480`). Alasan: `contractRecord` hanya hadir lewat kerangka EKSPLISIT templat ber-contractKind (SL-08), tidak pernah lewat rencana kanonik tier; opsi semua tier menambah slot `record` ke setiap templat non-kontrak dan melanggar CH-06. Aktivasi slot membaca `slot.tiers` templat, bukan `activeTiers` registri, sehingga kerangka eksplisit SL-08..SL-10 di tier NOTA diterima tanpa pengecualian (dibuktikan DC-10, D-376).

### 6.2 Jenis slot (perluasan C33 dan `SLOT_KINDS`, `slots.ts:25-80`)

`{ sectionType: "contractRecord", contentModes: ["INPUT"], defaultContentMode: "INPUT", repeatable: false, singlePerSkeleton: true, admitsAllowed: [], defaultAdmits: [], implicitSlotKey: "record" }` (AM-01, AM-11). Validasi kerangka CH-06.

### 6.3 Templat `laporan-kerja-agen` (CK-01; seed DC-29)

| ID | pos | slotKey | sectionType | label | required | tiers | positionLocked | repeatable | contentMode |
|---|---|---|---|---|---|---|---|---|---|
| SL-08 | 1 | `record` | `contractRecord` | Catatan Laporan | true | (semua) | true | false | INPUT |
| SL-09 | 2 | `content` | `chapter` | Isi Laporan | true | (semua) | false | true, `minItems 1` | INPUT |
| SL-10 | 3 | `references` | `sourceRegister` | Referensi | false | (semua) | false | false | INPUT |

- Templat: `slug` = `laporan-kerja-agen`, `name` = "Laporan Kerja Agen", `kind` = `DOCUMENT`, `contractKind` = `agentWorkReport` (MX08), `preset` = `{ slug: "datum-gsp-preset" }`.
- Lapis templat: `doc.defaultTier` (R-49) = `NOTA`; `doc.defaultTypeCode` (R-48) = `LAP`; `doc.typeCode` (P3-20, kelas K, ditulis seed ADMIN) = daftar bawaan ditambah `LAP` (`governance-language.ts:114-116`; CQ-1).
- `admits` SL-09 = 21 `CONTENT_BLOCK_TYPES` (bawaan, `slots.ts:70-71`).
- Penjaga idempoten seed: templat lama tidak berubah (sha `paramsSha256` dan `skeletonSha256` sebelum = sesudah); jalan kedua = `unchanged`.

### 6.4 Registri jenis kontrak (C58, `L/registry/contracts.ts`, berkas baru milik DC-06)

Setiap entri bertipe T2-73 dan memuat: `kind`; `stage: "active"`; `templateSlug`; `tier`; `typeCode`; `skeleton` (SL-08..SL-10 ringkas: `slotKey`, `sectionType`, `label`, `required`, `repeatable`); `outline` (CO-01..CO-05: `chapterKey`, `outlineKey`, `title`, `required`); `statuses` (CS: `code`, `label`); `itemStatuses` (CI); `verdicts` (CD); `refRels` (E48); `evidenceKinds` (E49); `patterns` (`cardId` C34, `key` C35, `actor` C36, `reportedAt` C37, `finalFileName` C51); `limits` (C39); `labels` (medan CF dan kolom tabel butir, bukti, rujukan); `aliases` (GA, GL, GF, GS, GI, GV §16); `defaultFormats` (C40).

Label medan (bagian `labels`, bahasa Indonesia; CA-2): `status` Status; `verdict` Vonis; `owner` Penanggung jawab; `initiator` Pemberi tugas; `taskRef` Rujukan tugas; `reportedAt` Waktu lapor; `due` Tenggat; `phase` Fase; `cardIds` Kartu; tabel butir: Kunci, Judul, Status, Penanggung jawab, Fase, Tenggat, Bergantung pada; tabel bukti: Jenis, Rujukan, sha256, Ukuran, Baris, Kode keluar, Butir, Catatan; tabel rujukan: Hubungan, Dokumen, Paragraf, Revisi.

### 6.5 Kelengkapan (DC-11; perluasan 03 §8)

- Slot SL-08 wajib: tanpa baris M14 terisi → `EMPTY`, `missingRequired` memuat `record`.
- Slot SL-09: `expected` = kunci CO wajib (`1`..`5`) ∪ kunci `outline` dokumen (bila disetel lewat R14 `setOutline`); `expectedSource = "outline"`. `setOutline null` tidak menghapus kunci CO wajib.
- Kasus asap DC-11: laporan tanpa bab `3` → `INCOMPLETE`, `missingRequired` memuat `content:3`; render penuh R17 = 409 `DOCUMENT_INCOMPLETE`.

## 7. Data Prisma (DC-04)

### 7.1 Model baru (3)

Semua `id String @id @default(cuid())`; `onUpdate` relasi = Cascade (bawaan).

| ID | Model | Kolom (nama: tipe, atribut) | Unik / indeks | Relasi |
|---|---|---|---|---|
| M19 | `StudioContractRecord` | `revisionId: String`; `docSectionId: String`; `documentId: String`; `revisionNo: Int`; `contractKind: String`; `status: String`; `verdict: String?`; `owner: String?`; `initiator: String?`; `taskRef: String?`; `reportedAt: DateTime` (UTC); `dueOn: DateTime? @db.Date`; `phaseFrom: String?`; `phaseTo: String?`; `cardIds: String[]`; `itemCount: Int`; `createdAt: DateTime @default(now())` | `@@unique([revisionId])`, `@@unique([docSectionId])`, `@@unique([documentId, revisionNo])`, `@@index([contractKind, status])`, `@@index([cardIds], type: Gin)` | `revision: StudioRevision` (Cascade); `docSection: StudioDocSection` (Cascade); `items: StudioContractItem[]`; `refs: StudioDocRef[]` |
| M20 | `StudioContractItem` | `recordId: String`; `documentId: String`; `revisionNo: Int`; `itemKey: String`; `position: Int` (1-based); `pid: String` (pid baris `F:record/<n>`); `status: String`; `owner: String?`; `phase: String?`; `dueOn: DateTime? @db.Date`; `dependsOn: String[]`; `titlePlain: String` | `@@unique([recordId, itemKey])`, `@@unique([recordId, position])`, `@@index([itemKey])`, `@@index([documentId, revisionNo])` | `record: StudioContractRecord` (Cascade) |
| M21 | `StudioDocRef` | `recordId: String`; `fromDocumentId: String`; `revisionNo: Int`; `position: Int`; `rel: String`; `targetDocumentId: String` (tanpa FK, KD-36); `targetPid: String?`; `targetRevisionNo: Int?` | `@@unique([recordId, position])`, `@@index([targetDocumentId, targetPid])`, `@@index([fromDocumentId, revisionNo])` | `record: StudioContractRecord` (Cascade) |

Invarian layanan: satu M19 per revisi dokumen ber-contractKind yang slot `record`-nya terisi; M19-M21 adalah salinan penuh per revisi (03 §3.1 :145); `documentId` dan `revisionNo` di M20/M21 = denormalisasi untuk kueri revisi terkini.

### 7.2 Kolom dan relasi tambahan pada model lama

| ID | Model | Tambahan | Indeks baru | Catatan |
|---|---|---|---|---|
| MX08 | `StudioTemplate` | `contractKind: String?` | `@@index([contractKind])` | null = templat dokumen output |
| MX09 | `StudioDocument` | `contractKind: String?`; `contractStatus: String?`; `contractOwner: String?`; `contractTaskRef: String?`; `contractDueOn: DateTime? @db.Date`; `contractCardIds: String[] @default([])` | `@@index([contractKind, contractStatus])`, `@@index([contractOwner])`, `@@index([contractTaskRef])`, `@@index([contractDueOn])`, `@@index([contractCardIds], type: Gin)` | cermin revisi terbaru; `contractCardIds` = gabungan terurut unik `cardIds` ∪ `items[].key` yang cocok C34 |
| MX10 | `StudioDocBlock` | `tsv: Unsupported("tsvector")?` | indeks GIN lewat SQL tangan (tidak dideklarasikan di Prisma, preseden `schema.prisma:556-577`) | GENERATED STORED; komentar skema melarang `db push` |
| MX11 | `StudioRevision` | relasi `contractRecord: StudioContractRecord?` | - | tanpa SQL |
| MX12 | `StudioDocSection` | relasi `contractRecord: StudioContractRecord?` | - | tanpa SQL |

Jumlah kolom SQL baru pada tabel lama: 1 + 6 + 1 = **8**.

### 7.3 SQL migrasi yang diharapkan (`20261030220000_add_studio_contract`)

Dibuat lewat prosedur D-21 (baseline sebelum edit, shadow DB, `migrate diff` dikurangi drift baseline, `migrate deploy` v21; `migrate dev`/`db push` dilarang, 01_specs §2). Teks di bawah adalah bentuk yang diharapkan; penjaga adalah hitungan §7.4.

```sql
-- AlterTable (2 pernyataan Prisma, 7 ADD COLUMN)
ALTER TABLE "StudioDocument" ADD COLUMN "contractCardIds" TEXT[] DEFAULT ARRAY[]::TEXT[], ADD COLUMN "contractDueOn" DATE, ADD COLUMN "contractKind" TEXT, ADD COLUMN "contractOwner" TEXT, ADD COLUMN "contractStatus" TEXT, ADD COLUMN "contractTaskRef" TEXT;
ALTER TABLE "StudioTemplate" ADD COLUMN "contractKind" TEXT;

-- CreateTable (3)
CREATE TABLE "StudioContractRecord" ("id" TEXT NOT NULL, "revisionId" TEXT NOT NULL, "docSectionId" TEXT NOT NULL, "documentId" TEXT NOT NULL, "revisionNo" INTEGER NOT NULL, "contractKind" TEXT NOT NULL, "status" TEXT NOT NULL, "verdict" TEXT, "owner" TEXT, "initiator" TEXT, "taskRef" TEXT, "reportedAt" TIMESTAMP(3) NOT NULL, "dueOn" DATE, "phaseFrom" TEXT, "phaseTo" TEXT, "cardIds" TEXT[], "itemCount" INTEGER NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "StudioContractRecord_pkey" PRIMARY KEY ("id"));
CREATE TABLE "StudioContractItem" ("id" TEXT NOT NULL, "recordId" TEXT NOT NULL, "documentId" TEXT NOT NULL, "revisionNo" INTEGER NOT NULL, "itemKey" TEXT NOT NULL, "position" INTEGER NOT NULL, "pid" TEXT NOT NULL, "status" TEXT NOT NULL, "owner" TEXT, "phase" TEXT, "dueOn" DATE, "dependsOn" TEXT[], "titlePlain" TEXT NOT NULL, CONSTRAINT "StudioContractItem_pkey" PRIMARY KEY ("id"));
CREATE TABLE "StudioDocRef" ("id" TEXT NOT NULL, "recordId" TEXT NOT NULL, "fromDocumentId" TEXT NOT NULL, "revisionNo" INTEGER NOT NULL, "position" INTEGER NOT NULL, "rel" TEXT NOT NULL, "targetDocumentId" TEXT NOT NULL, "targetPid" TEXT, "targetRevisionNo" INTEGER, CONSTRAINT "StudioDocRef_pkey" PRIMARY KEY ("id"));

-- CreateIndex (18 Prisma)
CREATE INDEX "StudioTemplate_contractKind_idx" ON "StudioTemplate"("contractKind");
CREATE INDEX "StudioDocument_contractKind_contractStatus_idx" ON "StudioDocument"("contractKind", "contractStatus");
CREATE INDEX "StudioDocument_contractOwner_idx" ON "StudioDocument"("contractOwner");
CREATE INDEX "StudioDocument_contractTaskRef_idx" ON "StudioDocument"("contractTaskRef");
CREATE INDEX "StudioDocument_contractDueOn_idx" ON "StudioDocument"("contractDueOn");
CREATE INDEX "StudioDocument_contractCardIds_idx" ON "StudioDocument" USING GIN ("contractCardIds");
CREATE UNIQUE INDEX "StudioContractRecord_revisionId_key" ON "StudioContractRecord"("revisionId");
CREATE UNIQUE INDEX "StudioContractRecord_docSectionId_key" ON "StudioContractRecord"("docSectionId");
CREATE UNIQUE INDEX "StudioContractRecord_documentId_revisionNo_key" ON "StudioContractRecord"("documentId", "revisionNo");
CREATE INDEX "StudioContractRecord_contractKind_status_idx" ON "StudioContractRecord"("contractKind", "status");
CREATE INDEX "StudioContractRecord_cardIds_idx" ON "StudioContractRecord" USING GIN ("cardIds");
CREATE UNIQUE INDEX "StudioContractItem_recordId_itemKey_key" ON "StudioContractItem"("recordId", "itemKey");
CREATE UNIQUE INDEX "StudioContractItem_recordId_position_key" ON "StudioContractItem"("recordId", "position");
CREATE INDEX "StudioContractItem_itemKey_idx" ON "StudioContractItem"("itemKey");
CREATE INDEX "StudioContractItem_documentId_revisionNo_idx" ON "StudioContractItem"("documentId", "revisionNo");
CREATE UNIQUE INDEX "StudioDocRef_recordId_position_key" ON "StudioDocRef"("recordId", "position");
CREATE INDEX "StudioDocRef_targetDocumentId_targetPid_idx" ON "StudioDocRef"("targetDocumentId", "targetPid");
CREATE INDEX "StudioDocRef_fromDocumentId_revisionNo_idx" ON "StudioDocRef"("fromDocumentId", "revisionNo");

-- AddForeignKey (4)
ALTER TABLE "StudioContractRecord" ADD CONSTRAINT "StudioContractRecord_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "StudioRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudioContractRecord" ADD CONSTRAINT "StudioContractRecord_docSectionId_fkey" FOREIGN KEY ("docSectionId") REFERENCES "StudioDocSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudioContractItem" ADD CONSTRAINT "StudioContractItem_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "StudioContractRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudioDocRef" ADD CONSTRAINT "StudioDocRef_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "StudioContractRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SQL tangan (preseden 20260927154000_add_ilsearchdoc:29-34): kolom hasil tsvector + GIN
ALTER TABLE "StudioDocBlock"
  ADD COLUMN "tsv" tsvector
  GENERATED ALWAYS AS (to_tsvector('simple', left(coalesce("textPlain", ''), 100000))) STORED;
CREATE INDEX "StudioDocBlock_tsv_idx" ON "StudioDocBlock" USING gin ("tsv");
```

### 7.4 Penjaga isi `migration.sql` (DC-04, dihitung Grep, keluaran dikutip)

| Cek | Nilai lulus |
|---|---|
| `DROP` | 0 |
| `CREATE TABLE` | 3, semua berawalan `"Studio` |
| `CREATE TYPE` | 0 |
| `CREATE INDEX` + `CREATE UNIQUE INDEX` | 19 (18 Prisma + 1 tangan), semua bernama berawalan `"Studio` dan `ON "Studio…` |
| `ADD CONSTRAINT` | 4, semua `FOREIGN KEY` antar-tabel `Studio*` |
| `ADD COLUMN` | 8 (7 Prisma + `tsv`), hanya pada `StudioTemplate`, `StudioDocument`, `StudioDocBlock` |
| Penyebutan `IlSearchDoc`, `pg_trgm`, `WorkerTrace`, `Role` | 0 |
| `migrate status` | up to date |
| Hitungan baris tabel lama (semua tabel non-delta) | sebelum = sesudah |

### 7.5 Rollback SQL delta

Disimpan byte-identik oleh DC-04 sebagai `prisma/rollback/03_rollback_studio_contract_delta.sql` (preseden berkas 01/02, 03 §3.5 :256) dan digladikan DC-38 hanya di `gsp_agent_hq_v21_uji`.

```sql
-- Rollback delta document contract. Tanpa CASCADE: gagal keras bila ada ketergantungan tak terduga.
BEGIN;
DROP TABLE IF EXISTS "StudioDocRef";
DROP TABLE IF EXISTS "StudioContractItem";
DROP TABLE IF EXISTS "StudioContractRecord";
DROP INDEX IF EXISTS "StudioDocBlock_tsv_idx";
ALTER TABLE "StudioDocBlock" DROP COLUMN IF EXISTS "tsv";
DROP INDEX IF EXISTS "StudioDocument_contractKind_contractStatus_idx";
DROP INDEX IF EXISTS "StudioDocument_contractOwner_idx";
DROP INDEX IF EXISTS "StudioDocument_contractTaskRef_idx";
DROP INDEX IF EXISTS "StudioDocument_contractDueOn_idx";
DROP INDEX IF EXISTS "StudioDocument_contractCardIds_idx";
ALTER TABLE "StudioDocument" DROP COLUMN IF EXISTS "contractKind", DROP COLUMN IF EXISTS "contractStatus", DROP COLUMN IF EXISTS "contractOwner", DROP COLUMN IF EXISTS "contractTaskRef", DROP COLUMN IF EXISTS "contractDueOn", DROP COLUMN IF EXISTS "contractCardIds";
DROP INDEX IF EXISTS "StudioTemplate_contractKind_idx";
ALTER TABLE "StudioTemplate" DROP COLUMN IF EXISTS "contractKind";
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261030220000_add_studio_contract';
COMMIT;
```

Pencocokan: 3 tabel (indeks dan FK ikut terhapus) + 8 kolom + 7 indeks tabel lama + 1 baris buku = semua objek delta, 0 objek lain.

Rollback data seed (opsional, dijalankan SEBELUM rollback skema; hanya di `_uji`, atau di v21 hanya dengan persetujuan eksplisit USER karena menghapus dokumen):

```sql
BEGIN;
DELETE FROM "StudioDocument" WHERE "templateId" IN (SELECT "id" FROM "StudioTemplate" WHERE "slug" = 'laporan-kerja-agen');
DELETE FROM "StudioTemplateVersion" WHERE "templateId" IN (SELECT "id" FROM "StudioTemplate" WHERE "slug" = 'laporan-kerja-agen');
DELETE FROM "StudioTemplate" WHERE "slug" = 'laporan-kerja-agen';
DELETE FROM "StudioSectionType" WHERE "key" = 'contractRecord';
COMMIT;
```

Berkas keluaran di disk milik dokumen yang dihapus tetap ada (yatim) dan dicatat di laporan gladi.

Cek sesudah rollback (DC-38): `pg_tables` untuk 3 nama M19-M21 = 0; 8 kolom MX08-MX10 tidak ada di `information_schema.columns`; hitungan baris semua tabel lama sama sebelum dan sesudah; deploy ulang memulihkan objek.

### 7.6 Aturan tulis (DC-09)

Di dalam transaksi commit v2 (03 §9.1 butir 4), untuk dokumen bertemplat ber-contractKind dengan slot `record` terisi: tulis M19 (1), M20 (n butir), M21 (m rujukan) dari I56, lalu perbarui MX09. Revisi tanpa slot `record` terisi: tidak ada M19, MX09 diisi `contractKind` saja (status dan lainnya null). Rekonstruksi dari baris (03 §4.6 :415) tidak memakai M19-M21 (turunan payload M14).

## 8. Retrieval

### 8.1 Teks penuh (DC-14)

- Konfigurasi C41 `simple`; kueri `websearch_to_tsquery('simple', $q)` terparameter (Prisma `$queryRaw` bertag, tanpa penggabungan string).
- Lingkup bawaan: revisi terkini setiap dokumen (`StudioRevision.revisionNo = StudioDocument.currentRevisionNo`). `revisionNo` eksplisit hanya bersama `documentId` (blueprint 07 KC-4 a).
- Peringkat `ts_rank(tsv, q)`; urut `rank DESC, id DESC`; cuplikan `ts_headline` dengan C44, dihitung hanya untuk baris halaman (subkueri berbatas lebih dulu, RK-28).
- Hanya baris v2 (`StudioDocBlock`, M17); dokumen v1 (`StudioBlock`, M06) tidak tercakup (CA-7).
- Hanya `C42` karakter pertama setiap blok yang terindeks.

Bentuk kueri yang diharapkan (pseudokode SQL):

```sql
WITH q AS (SELECT websearch_to_tsquery('simple', $1) AS q),
hits AS (
  SELECT b."id", b."pid", b."address", b."type", b."docSectionId", b."chapterId", rv."revisionNo", d."id" AS "documentId",
         ts_rank(b."tsv", q.q) AS rank
  FROM "StudioDocBlock" b
  JOIN "StudioRevision" rv ON rv."id" = b."revisionId"
  JOIN "StudioDocument" d ON d."id" = rv."documentId" AND rv."revisionNo" = d."currentRevisionNo"
  CROSS JOIN q
  WHERE b."tsv" @@ q.q /* + filter terparameter: mission, kind, documentId, type, slotKey, kursor (rank, id) */
  ORDER BY rank DESC, b."id" DESC
  LIMIT $take_plus_1)
SELECT h.*, ts_headline('simple', left(b."textPlain", 100000), q.q, $snippet_options) AS snippet
FROM hits h JOIN "StudioDocBlock" b ON b."id" = h."id" CROSS JOIN q;
```

### 8.2 Filter kontrak (DC-14) — kolom MX09 + M20 untuk `matchedItems`

`cardId` → `contractCardIds @> ARRAY[$cardId]` (GIN). `matchedItems` = baris M20 dengan `itemKey = $cardId` dan `(documentId, revisionNo)` = revisi terkini.

## 9. Route

Semua route baru: `export const dynamic = "force-dynamic"`, `requireSession` (tanpa sesi 401), `getStudioCaller`, `reqCtx` + `withCorrelation` (`x-correlation-id`, pola D-323), galat `{ error, code, details }` berbahasa Indonesia (D-340). Kebijakan baca = R04 GET: semua pemanggil terautentikasi membaca semua dokumen (AS-2 blueprint 07; dinilai DC-41). `STUDIO_ROUTES` (C16) diperluas (AM-06).

| ID | Path | Metode | Status |
|---|---|---|---|
| R21 | `/api/studio/contracts` | GET | baru |
| R22 | `/api/studio/search` | GET | baru |
| R23 | `/api/studio/drafts/check` | POST | baru |

### 9.1 R21 `GET /api/studio/contracts`

| Parameter | Bentuk dan batas |
|---|---|
| `mission` | string 1..120, cocok tepat `missionFolder` |
| `docKey` | C23 |
| `docNumber` | string 1..80; cocok `docNumber` tepat ATAU bentuk aman I61 (SQL setara `rtrim(left(trim(both '-.' from regexp_replace(regexp_replace("docNumber", '[^A-Za-z0-9.-]+', '-', 'g'), '-{2,}', '-', 'g')), 80), '-.')`) |
| `kind` | anggota E44 |
| `status` | daftar dipisah koma, ≤ C45.statusListMax, setiap butir anggota set status gabungan |
| `cardId` | C34 |
| `owner` | C36 |
| `taskRef` | C35 |
| `dueBefore`, `dueAfter` | tanggal `YYYY-MM-DD` (inklusif) |
| `take` | bilangan bulat 1..C45.takeMax, bawaan C45.takeDefault |
| `cursor` | id dokumen dari `nextCursor` |

- Hanya dokumen dengan `contractKind` tidak null. Urutan `updatedAt DESC, id DESC`.
- Parameter tak dikenal atau nilai tidak sah → 400 `SCHEMA_INVALID`, issue pointer `/query/<nama>`.
- 200 `{ contracts: ContractSummaryV2[], nextCursor: string | null }`. T2-68 = `{ documentId, docNumber, title, kind, status, owner, taskRef, cardIds, dueOn, revisionNo, completeness: { status, missingRequired }, missionFolder, docKey, updatedAt, matchedItems?: Array<{ key, status, pid, title }> }` (`matchedItems` hanya bila `cardId` diisi; nilai kosong = `null`).
- Amandemen DC-33 (D-370): `ContractSummaryV2.status` bertipe `AgentWorkReportStatus | null` (`L/contract/types/v2/contract.ts:115`), selaras §7.6: dokumen ber-contractKind yang slot `record`-nya kosong mempunyai kolom cermin status null.
- Galat: 401; 400 `SCHEMA_INVALID`; 429 `RATE_LIMITED` (bucket `query`, `Retry-After`).
- Bucket: `query` (QH-01).
- Amandemen DOC-FIX-B (keputusan USER D-402 atas security DC-41 M-1/L-1; terpasang FIX-SEC D-407; FIX-QB D-403):
  - Parameter baru `includeArchived`: `1` menyertakan dokumen terarsip; `0` atau tidak diisi = bawaan, dokumen `archived = true` DIKECUALIKAN; nilai lain → 400 `SCHEMA_INVALID` `/query/includeArchived` keyword `enum` (`L/services/query/filters.ts:109`, `:175-181`; `L/services/query/contracts.ts:84`, `:107`).
  - Byte NUL (U+0000) di nilai teks parameter mana pun → 400 `SCHEMA_INVALID` `/query/<nama>` keyword `pattern`, sebelum tagihan dan tanpa header kuota (semula 500 dari Postgres 22021; `filters.ts:183-189`).
  - Log baca: setiap 200 menulis satu entri `logQueryRead` (level info, `message: "query read"`) ke JSONL harian `<STUDIO_WORKSPACE_ROOT>/logs/query/query-YYYY-MM-DD.jsonl`: route, jenis pemanggil, identitas aman-log, `agentId` bila ada, nilai filter dipotong `READ_LOG_VALUE_MAX` = 64 karakter, jumlah hasil, ada-tidaknya halaman berikut, correlation id; isi hasil tidak dicatat (`L/services/query/log.ts:1-13`, `:89`; `API/contracts/route.ts:47`).
  - Kebijakan baca lintas swarm (AS-2, semua pemanggil terautentikasi membaca semua dokumen) DITERIMA USER sebagai risiko tercatat (D-402).
  - Bentuk aman `docNumber` di SQL kini `docNumberSafeSql`: batas potong = parameter C52 `FINAL_DOC_NUMBER_MAX` (bukan angka `80` keras) dan langkah 5 I61 (kosong → `DOC`) ikut diterapkan (`L/services/query/contracts.ts:51-53`, `:109`; paritas SQL = TS 14/14, D-403). Rumus SQL di tabel parameter di atas adalah bentuk sebelum FIX-QB.

### 9.2 R22 `GET /api/studio/search`

| Parameter | Bentuk dan batas |
|---|---|
| `q` | wajib; panjang sesudah trim C43.qMin..C43.qMax |
| `mission` | seperti R21 |
| `kind` | anggota E44 (hanya dokumen jenis itu) |
| `documentId` | pola `^[a-z0-9]{20,40}$` |
| `revisionNo` | bilangan bulat ≥ 1; hanya bersama `documentId` |
| `type` | daftar dipisah koma ≤ 8; setiap butir anggota `CONTENT_BLOCK_TYPES` ∪ C33 ∪ `{ "sourceRegisterEntry", "contractItem" }` |
| `slotKey` | C18 |
| `take` | 1..C43.takeMax, bawaan C43.takeDefault |
| `cursor` | string opak (base64url `{ r: rank, id }`) dari `nextCursor` |

- 200 `{ hits: SearchHitV2[], nextCursor: string | null, query: { q, config: "simple" } }`. T2-69 = `{ documentId, docNumber, title, kind: string | null, revisionNo, pid, address, slotKey, chapterKey: string | null, type, snippet, rank }`. `q` yang menjadi kueri kosong (hanya tanda baca) → `hits: []`.
- Galat: 401; 400 `SCHEMA_INVALID` (`/query/q` kosong atau melebihi batas, `revisionNo` tanpa `documentId`, parameter tak dikenal); 429 `RATE_LIMITED` (bucket `query`).
- Bucket: `query`.
- Amandemen DOC-FIX-B (D-402, D-407): tiga aturan amandemen DOC-FIX-B §9.1 berlaku sama untuk R22. `includeArchived` (`0`/`1`, bawaan arsip dikecualikan) termasuk parameter sah (`L/services/query/filters.ts:110`); NUL di `q`, `mission`, atau parameter teks lain → 400 `SCHEMA_INVALID` `/query/<nama>` keyword `pattern`; setiap 200 menulis log baca `logQueryRead` dengan `q` dipotong 64 karakter (`API/search/route.ts:19-29`). Blok milik dokumen terarsip tidak muncul di `hits` tanpa `includeArchived=1`, juga bila `documentId` diisi (`L/services/query/search.ts:21`, `:60`).

### 9.3 R23 `POST /api/studio/drafts/check`

- Badan JSON `{ markdown: string, agentId?: string /* 1..80 */ }`; kunci lain → 400 `SCHEMA_INVALID`. Badan bukan JSON → 415 `UNSUPPORTED_MEDIA_TYPE` / 400 `JSON_MALFORMED`.
- Batas (C54): badan > `bodyBytes` atau `markdown` > `maxChars` → 413 `PAYLOAD_TOO_LARGE` `details.reason` = DR-09; blok > `maxBlocks` → 413 `details.reason` = DR-10.
- Proses: I63 mengekstrak; setiap blok valid secara sintaks di-dry-run seperti R08 (03 §12 R08) dalam transaksi READ ONLY; 0 tulis DB; tanpa render (`previewHtml` tidak dihasilkan).
- 200 selalu untuk masukan dalam batas: T2-70 (§11.4). Isu ekstraksi = isu DR, bukan status HTTP.
- Bucket: `validate`, ditagih satu per blok berisi JSON sintaksis sah sebelum dry-run (KD-43); bila satu tagihan ditolak → 429 `RATE_LIMITED` tanpa dry-run apa pun.
- Galat: 401; 400; 413; 415; 429.
- Amandemen DOC-FIX-B (security DC-41 L-2, keputusan USER D-402, terpasang D-407): jumlah tagihan bucket `validate` per permintaan = max(1, jumlah blok yang di-dry-run) (`draftValidateCharges`, `L/services/draft/check.ts:78`; `API/drafts/check/route.ts:27`). Draf tanpa blok yang dapat di-dry-run tetap ditagih satu unit, sehingga respons 200-nya membawa header kuota (QH-03). Kalimat "ditagih satu per blok" di atas berlaku untuk draf berblok.

### 9.4 R03 `GET /api/studio/registry?kind=contracts`

- Nilai `kind` baru `contracts` (AM-07). Parameter lain tidak diterima untuk kind ini (400 `SCHEMA_INVALID` `/query/<nama>`).
- 200 `{ kind: "contracts", items: ContractKindDefV2[] }`: tepat jenis berstatus `active` (tahap 1: CK-01). Jenis dicadangkan tidak dicantumkan.
- Galat: 401; 400 `REGISTRY_KIND_UNKNOWN` (kind lain yang tidak dikenal, perilaku lama). Tanpa bucket kuota (tanpa header kuota).

### 9.5 R10 dan R17 (berubah)

| Route | Perubahan |
|---|---|
| R10 `GET /api/studio/files/[id]` | Header C50 selalu ada (FN-06). `Content-Disposition` bawaan = nama final bila dokumen pemilik berkas memiliki `contractKind`; selain itu nama DATUM `fileName` (U-2). `?name=final\|datum` (E57) menimpa bawaan; nilai lain → 400 `SCHEMA_INVALID` `/query/name`. `?verify=1` tetap (`X-Studio-Sha256-Verified`, `route.ts:40-57`) |
| R10 `HEAD /api/studio/files/[id]` | Baru (KD-40): header sama dengan GET (termasuk C50 dan, bila `?verify=1`, hasil sha), tanpa badan; galat sama tanpa badan |
| R17 render, R07 POST, R05 GET | Setiap `OutputFileDto` memuat `finalFileName: string` (AM-09) |
| R17 render | Dokumen ber-contractKind tanpa `formats` dan `figures` → format C40 (KD-41, AM-15) |

Amandemen DC-33 (D-390): `OutputFileDto.finalFileName` WAJIB (`string`, bukan opsional; `L/contract/types/api.ts:266`). Mapper `finalFileNameOfRow` selalu menghasilkan string (dokumen: docNumber + revisi; artefak: `ART-…_rev0`); baris tanpa relasi pemilik dicatat `OUTPUT_FILE_OWNER_MISSING` lalu melempar `TypeError` (bukan nilai kosong). Semua pemanggil `toOutputFileDto` memuat include pemilik.

Amandemen DC-33 (D-386, D-389): respons R16 PATCH, R06 PATCH, dan R14 PATCH mendapat medan opsional `warnings?: SubmitWarningV2[]` (hanya bila tidak kosong; diteruskan dari `CommitOutput.warnings` oleh `L/services/revisions/v2/service.ts:340`), selain `SubmitResultV2.warnings` dan R08 `submitPreview.warnings` (AM-08). Isinya peringatan kontrak non-penahan (CW-01 `CONTRACT_REF_PID_RETIRED`).

### 9.6 Header kuota (DC-19)

| ID | Aturan |
|---|---|
| QH-01 | Bucket (E53) dan route: `render` = R17, R07 POST, R09 POST, R08 `?preview=html`; `validate` = R08, R23, import `?validate=1`; `import` = `/api/studio/import/markdown`; `query` = R21, R22 |
| QH-02 | Header C48 = sisa bilangan bulat ≥ 0 (`RateLimitResult.remaining`, `rate-limit.ts:7-12`); C49 = nama bucket E53 |
| QH-03 | Ada pada setiap respons yang dihasilkan SESUDAH tagihan bucket (2xx, 4xx, 429, 5xx); tidak ada bila permintaan ditolak sebelum tagihan (mis. 401) |
| QH-04 | Permintaan yang menagih dua bucket: header melaporkan bucket dengan sisa terkecil; seri = urutan E53 (KD-38) |
| QH-05 | 429 → C48 = `0` dan `Retry-After` tetap |
| QH-06 | Nilai = sisa kuota proses ini (limiter memori per proses, `rate-limit.ts:1-5`; RK-22); didokumentasikan di panduan DC-33 |

Bucket `query`: C46 permintaan per C47 ms per identitas pemanggil (identitas sama dengan bucket validate, `validate-rate.ts:10`); env `STUDIO_QUERY_RATE_LIMIT` / `STUDIO_QUERY_RATE_WINDOW_MS`.

Amandemen DOC-FIX-B (review kode DC-40 isu #1 dan #6, security DC-41 L-4; FIX-QA D-403, keputusan USER D-402, FIX-SEC D-407):
- QH-01 diperluas. Bucket `render` juga ditagih R04 POST, R12, R13, R06 PATCH, R16 PATCH, dan R14 PATCH (`checkRenderRate`); keenam route kini dibungkus `withQuotaHeaders` sehingga 2xx dan 4xx sesudah tagihan membawa C48/C49 sesuai QH-03, bukan hanya 429 (`API/documents/route.ts:288`, `:338`, `:405`; `API/chapters/_shared/submit-kit.ts`; `API/documents/[id]/blocks/[address]/route.ts`; `API/documents/[id]/paragraphs/[pid]/route.ts`; `API/documents/[id]/structure/route.ts:107`, `:152`). Penolakan sebelum `checkRenderRate` (mis. 401, badan tidak sah) tetap tanpa header. Catatan "header hanya pada 429" untuk keenam route di dokumen lain adalah keadaan sebelum FIX-QA.
- Satu helper tagihan untuk keempat bucket: `checkBucketRate(bucket, limiter, caller, ctx, message, logLabel?)` (`L/http/quota.ts:227-245`); identitas tunggal `quotaRateIdentity` (`quota.ts:60-71`).
- Bucket per agen dan plafon identitas (L-4). Pemanggil tanpa `agentId` memakai satu kunci per identitas terautentikasi seperti sebelumnya (pemegang `x-internal-secret` = `<kind>:shared`). Pemanggil dengan `agentId` memakai kunci identitas + `agentId` (`quotaAgentRateIdentity`, `quota.ts:78-81`), sehingga agen yang berbagi satu rahasia punya sisa terpisah. Setiap tagihan per agen yang diizinkan juga menagih plafon identitas = F × batas bucket dalam jendela bucket yang sama; 429 karena plafon dicatat dengan `scope: "identityCeiling"` di log, dan header melaporkan sisa terkecil agen/plafon (QH-04). Karena `agentId` berasal dari badan dan dapat dipalsukan, plafon inilah yang menghentikan rotasi `agentId` sesudah F × batas permintaan per jendela.
- Env baru `STUDIO_QUOTA_AGENT_CEILING_FACTOR` = F: bilangan bulat, bawaan 4; nilai tidak sah atau < 1 → bawaan; nilai > 64 dipotong ke 64 (`QUOTA_AGENT_CEILING_FACTOR_ENV`, `_DEFAULT`, `_MAX`, `quota.ts:49-52`, `:169-171`); dibaca setiap tagihan.
- Ketelitian sisa plafon (diterima D-407): plafon disusun dari F slot kunci pada limiter yang sama, diisi bergiliran (`rate-limit.ts` tidak disentuh). Sisa plafon = F × sisa slot + slot yang belum tersentuh pada putaran itu; nilainya tepat bila jendela slot sejajar dan selisihnya < F bila tidak. Agen tidak boleh menganggap C48 sebagai hitungan pasti di dekat batas plafon.

Amandemen DOC-FIX-C (review dokumen DC-42b temuan N-01; D-411, D-413): `checkBucketRate` memecah kunci per agen hanya bila pemanggil yang diteruskan route membawa `agentId` (`quota.ts:236`, `:240`). Karena itu butir "Bucket per agen" di atas berlaku per bucket, bukan untuk semua bucket:
- `render`: per identitas + `agentId` dengan plafon identitas. Semua route menagih sesudah membaca `agentId` badan: R04 POST (`API/documents/route.ts:286-288`, `:329-338`), R12/R13 (`API/chapters/_shared/submit-kit.ts:142`, `:179`), R06 PATCH (`API/documents/[id]/blocks/[address]/route.ts:154-156`), R14 PATCH (`API/documents/[id]/structure/route.ts:146-152`), R16 PATCH (`API/documents/[id]/paragraphs/[pid]/route.ts:116-119`), R17 (`API/documents/[id]/render/_lib/handler.ts:122-123`), R07 POST (`API/documents/[id]/revisions/route.ts:130-132`), R09 POST (`API/artifacts/route.ts:106-108`), R08 `?preview=html` (`API/validate/route.ts:192`, `:199`).
- `validate`: per identitas + `agentId` dengan plafon identitas: R08 (`API/validate/route.ts:192-194`), R23 (`API/drafts/check/route.ts:137-142`), import `?validate=1` (`API/import/markdown/route.ts:150`, `:159-161`).
- `import`: selalu satu kunci per identitas. Route menagih sebelum badan dibaca, dengan pemanggil tanpa `agentId` (`API/import/markdown/route.ts:139-140`); dua agen yang berbagi satu rahasia berbagi kuota ini.
- `query`: selalu satu kunci per identitas. R21/R22 adalah GET tanpa badan dan memanggil `getStudioCaller(req)` tanpa `agentId` (`API/contracts/route.ts:42-44`, `API/search/route.ts:45-47`); diterima D-411, plafon identitas tidak relevan karena tidak ada kunci per agen.

## 10. Nama berkas final (DC-17, DC-18, DC-20)

| ID | Aturan |
|---|---|
| FN-01 | Bentuk: `<docNumberSafe>_rev<revisionNo>_<YYYYMMDDTHHMMSSZ>_<sha8>.<ext>`; regex C51 |
| FN-02 | `docNumberSafe` (I61): (1) ganti setiap runtun karakter di luar `[A-Za-z0-9.-]` dengan `-`; (2) rapatkan `-` beruntun menjadi satu; (3) buang `-`/`.` di awal dan akhir; (4) potong C52 karakter lalu buang `-`/`.` akhir lagi; (5) kosong → `DOC` |
| FN-03 | `revisionNo` = nomor revisi baris `StudioRevision` berkas; berkas artefak (tanpa revisi) = `0` dan `docNumberSafe` = C53 + `artifactId` (karakter di luar `[A-Za-z0-9-]` dibuang) |
| FN-04 | Waktu = `StudioOutputFile.createdAt` UTC, detik dipotong (bukan dibulatkan) |
| FN-05 | `sha8` = 8 heksa pertama `StudioOutputFile.sha256` huruf kecil; `ext` = `FORMAT_EXT[format]` (`naming.ts:10-16`) |
| FN-06 | Header C50 pada setiap respons R10 berkas mana pun; nilai = nama final (ASCII, tanpa kutip) |
| FN-07 | `Content-Disposition: attachment; filename="<nama>"; filename*=UTF-8''<nama>` untuk nama final; aturan nama DATUM tidak berubah |
| FN-08 | Parser I60: cocokkan C51; `renderedAt` = ISO `YYYY-MM-DDTHH:MM:SSZ`; tanggal kalender tidak sah → `null`. Sifat bolak-balik: `formatFinalFileName(parseFinalFileName(x)) === x` untuk setiap `x` yang lolos parser |

Contoh: `docNumber` `003/GSP/KT/X/2026`, revisi 12, dirender 2026-10-30 12:58:00 UTC, sha256 berawalan `55d324b1`, HTML → `003-GSP-KT-X-2026_rev12_20261030T125800Z_55d324b1.html`.

Verifikasi terhadap sistem (KD-40):
- Dengan id berkas (tersimpan dari respons R17): `HEAD /api/studio/files/{id}?verify=1` → bandingkan C50 dengan nama lokal dan `X-Studio-Sha256-Verified: true`.
- Dengan nama saja: I60 → `docNumberSafe`, `revisionNo`, `sha8`; R21 `?docNumber=<docNumberSafe>` → `documentId`; R05 `?rev=<revisionNo>` → `outputs[]` yang `finalFileName` sama. Tanpa kecocokan = berkas lokal tidak dikenal sistem.

## 11. Draf dan checkpoint MD (DC-21, DC-22, DC-23)

### 11.1 Format

````
# DRAF Laporan kerja DC-02
tujuan: register nama document contract
langkah-berikut: kirim slot record lalu bab 1-5
basis: cmvui0qun000qv11gtygb1mk9@rev3

```json
{ "$schema": "studio.slot/v2", "target": { "documentId": "cmvui0qun000qv11gtygb1mk9" }, "slot": "record", "baseRevisionNo": 3,
  "payload": { "type": "contractRecord", "status": "partial", "reportedAt": "2026-10-30" } }
```
````

- Kepala = baris sebelum pagar pembuka pertama. Judul = baris pertama berbentuk `# <teks>`. Kunci C55 berbentuk `<kunci>: <nilai>` huruf kecil. `basis` sesuai C56 (`<documentId>@rev<n>` atau `baru`).
- Blok = pagar tepat tiga backtick + info `json` di kolom 1, ditutup baris tiga backtick di kolom 1 (KD-44). Pagar lain (info apa pun, empat backtick atau lebih) diabaikan beserta isinya.
- Setiap blok = satu objek JSON dengan `$schema` anggota C57. Teks lain diabaikan.
- Akhir baris CRLF dinormalkan ke LF; nomor baris 1-based terhadap berkas asli.

### 11.2 Kode isu dan alasan batas (E55, E56)

| ID | Kode | Tingkat | Pemicu |
|---|---|---|---|
| DR-01 | `DRAFT_NO_JSON_BLOCK` | error | tidak ada blok `json` |
| DR-02 | `DRAFT_FENCE_UNCLOSED` | error | pagar `json` tanpa penutup sampai akhir berkas |
| DR-03 | `DRAFT_JSON_MALFORMED` | error | `JSON.parse` gagal; `line`/`column` absolut di berkas MD |
| DR-04 | `DRAFT_BLOCK_NOT_OBJECT` | error | nilai puncak bukan objek |
| DR-05 | `DRAFT_SCHEMA_UNKNOWN` | error | `$schema` hilang atau bukan anggota C57 |
| DR-06 | `DRAFT_HEADER_INCOMPLETE` | warning | judul atau salah satu kunci C55 tidak ada |
| DR-07 | `DRAFT_BASIS_INVALID` | warning | nilai `basis` tidak cocok C56 |
| DR-08 | `DRAFT_BASIS_STALE` | warning | (R23 dan CLI `--remote` saja) `rev<n>` < `currentRevisionNo` dokumen |
| DR-09 | `DRAFT_TOO_LONG` | alasan 413 | badan atau `markdown` melebihi C54 |
| DR-10 | `DRAFT_TOO_MANY_BLOCKS` | alasan 413 | blok > C54.maxBlocks |

### 11.3 CLI `scripts/studio/draft-check.ts` (DC-22)

`npx tsx scripts/studio/draft-check.ts <berkas.md> [--remote <baseUrl>] [--emit <n>] [--json]`
- Lokal (bawaan): ekstraksi I63 + ajv SID01-SID03 + pemeriksaan murni §5.6 langkah 2 dan 6b (tanpa DB; DR-08 dan EC25/EC26 tidak diperiksa).
- `--remote`: setiap blok dikirim ke R08 dengan header `x-internal-secret` dari env `INTERNAL_API_SECRET` (nama env yang ada, D-334); keluaran `--json` identik dengan respons R23 untuk berkas yang sama (KS-8).
- `--emit <n>`: mencetak teks blok ke-n persis seperti tertulis (byte-identik), untuk dikirim apa adanya.
- Kode keluar: `0` semua blok valid dan tanpa isu error; `1` ada isu error atau blok tidak valid; `2` galat pemakaian/berkas/jaringan.

Amandemen DC-33 (D-393): CLI mendapat opsi `--agent-id <id>` (1..80 karakter, hanya bersama `--remote`; bentuk pemakaian `[--remote <baseUrl>] [--agent-id <id>] [--emit <n>] [--json]`). Aturan tunggal di `L/services/draft/check.ts` untuk CLI dan R23: `agentId` efektif setiap blok = medan `agentId` payload blok bila ada, selain itu bawaan pemanggil (CLI `--agent-id` atau badan R23 `agentId`); tanpa keduanya = dry-run tanpa `agentId`; bila bawaan dipakai, `agentId` ditambahkan di akhir objek dry-run. Medan jam `completenessPreview.slots[].lastFilledAt` dan `at` mengikuti waktu dry-run sehingga TIDAK deterministik: kesamaan "`--json` identik dengan respons R23" (KS-8, AC-19) berlaku dengan medan jam itu disamarkan, `agentId` efektif sama, dan R23 dipanggil dengan rahasia internal (pemanggil bersesi cookie tercatat `user:<nama>`). Dibuktikan D-393 (diff 0 baris sesudah penyamaran) dan diulang DC-33 (contoh draf panduan seksi 17.9: CLI `--remote --json` = R23, medan jam disamarkan).

Amandemen DOC-FIX-B, catatan keamanan CLI (security DC-41 M-2; RISIKO DITERIMA USER, D-402): `--remote` menerima URL `http:` maupun `https:` ke host apa pun (`scripts/studio/draft-check.ts:118-120`) dan memanggil `fetch` dengan header `x-internal-secret` serta perilaku redirect bawaan `follow` (`:125-126`). Akibatnya rahasia bersama `INTERNAL_API_SECRET` terkirim dalam teks polos bila host bukan loopback dan http dipakai, dan ikut diteruskan pada redirect lintas origin (dibuktikan DC-41 dengan nilai dummy). USER menerima risiko ini dengan dasar bahwa CLI hanya dipakai lokal oleh agen; tidak ada perubahan kode. Aturan pakai yang menyertai penerimaan risiko: arahkan `--remote` hanya ke HQ lokal (`http://127.0.0.1:<port>`) atau https internal yang dipercaya. Bila CLI kelak dipakai di luar mesin lokal, usulan DC-41 (`redirect: "manual"` + tolak http non-loopback) menjadi baris perbaikan baru, dan keputusan D-402 perlu ditinjau ulang.

### 11.4 Bentuk hasil (T2-70, T2-71)

`DraftCheckResultV2 = { valid: boolean; header: { title: string | null; tujuan: string | null; langkahBerikut: string | null; basis: string | null }; issues: DraftIssueV2[]; blocks: DraftBlockResultV2[] }`
`DraftBlockResultV2 = { index: number /* 1-based */; line: number /* baris pagar pembuka */; endLine: number; schema: string | null; valid: boolean; issues: unknown[] /* isu R08 apa adanya */; payload: unknown | null; submitPreview?: unknown; completenessPreview?: unknown }`
`valid` = tidak ada isu error dan setiap blok `valid`.

## 12. `chart.custom` (DC-26, DC-27)

| ID | `mark` | `orientation` | `stacked` | Bentuk data | Kode tergambar | Bukti `dataShape` |
|---|---|---|---|---|---|---|
| CU-01 | `bar` | `horizontal` | false | `categorical` | `P-01` | `charts.ts:713-718` |
| CU-02 | `bar` | `vertical` | false | `categorical` | `P-02` | `:722-727` |
| CU-03 | `bar` | `vertical` | false | `series` | `P-03` | `:731-736` |
| CU-04 | `bar` | `horizontal` | true | `series` | `K-01` | `:931-936` |
| CU-05 | `line` | `vertical` | false | `series` | `W-01` | `:1041-1046` |
| CU-06 | `area` | `vertical` | false | `categorical` | `W-04` | `:1068-1073` |
| CU-07 | `area` | `vertical` | true | `series` | `W-05` | `:1077-1082` |
| CU-08 | `point` | `vertical` | false | `xy` | `H-01` | `:849-854` |
| CU-09 | `line` | `vertical` | false | `xy` | `H-04` | `:876-881` |

- Registri C59 memuat CU-01..CU-09; pin C60 = 9. `CHART_REGISTRY_COUNT` (76) tidak berubah karena bentuk kustom bukan kode chart.
- I68 mengembalikan kode tergambar untuk kombinasi di tabel; selain itu `null` → 422 EC28 `details = { form, dataShape, supported: [CU…] }`.
- Data hanya `categorical`, `series`, `xy`. `highlight`, `unit`, `dec`, `limit`, `note`, `caption`, `source`, `keyRow` berlaku seperti kode preset (03 T2-23).
- Orientasi asli perender `P-01` dan `K-01`, serta apakah `P-01` mengurutkan data, belum diperiksa sampai tingkat fungsi (CA-4); DC-26 memverifikasi dan mengajukan perubahan tabel lewat `file_requests.md` bila berbeda.

## 13. Kode galat, peringatan, dan isu baru

### 13.1 Kode galat HTTP baru (ditambahkan ke `STUDIO_ERROR_CODES` dan `STUDIO_ERROR_HTTP`, 69 → 73)

Cek bentrok: keempat nama tidak ada di `errors.ts:19-94` maupun `enums.ts` `STUDIO_ERROR_CODES` (Read sesi ini).

| ID | Kode | HTTP | Kondisi | Contoh `details` |
|---|---|---|---|---|
| EC25 | `CONTRACT_REF_NOT_FOUND` | 422 | `refs[n]` menunjuk dokumen yang tidak ada, atau `revisionNo` > revisi terkini sasaran | `{ "pointer": "/payload/refs/0", "documentId": "cm…", "reason": "DOCUMENT" }` (`reason` = `DOCUMENT` \| `REVISION`) |
| EC26 | `CONTRACT_REF_PID_NOT_FOUND` | 422 | `pid` tidak pernah ada di identitas dokumen sasaran | `{ "pointer": "/payload/refs/0/pid", "documentId": "cm…", "pid": "p-zz" }` |
| EC27 | `CONTRACT_ITEM_KEY_DUPLICATE` | 422 | `items[].key` ganda | `{ "key": "t_5943d415", "positions": [1, 4] }` |
| EC28 | `CHART_CUSTOM_FORM_UNSUPPORTED` | 422 | kombinasi `form` × bentuk data di luar CU-01..CU-09 | `{ "pointer": "/chapter/sections/0/blocks/2", "form": { "mark": "point" }, "dataShape": "categorical", "supported": ["CU-01", "…"] }` |

### 13.2 Kode peringatan kontrak (E54; bukan kode galat HTTP)

| ID | Kode | Sumber | Arti |
|---|---|---|---|
| CW-01 | `CONTRACT_REF_PID_RETIRED` | kiriman, R08 | `pid` rujukan sudah pensiun; rujukan tetap disimpan (blueprint 07 KC-3 a) |
| CW-02 | `CONTRACT_STATUS_UNMAPPED` | generator | nilai status MD tanpa alias; `details.scope` = `record` \| `item`; teks tetap utuh |
| CW-03 | `CONTRACT_HEADING_UNMAPPED` | generator | judul `##` tanpa alias; isinya menjadi bab tambahan kunci ≥ 6 |
| CW-04 | `CONTRACT_FIELD_UNMAPPED` | generator | kunci kepala tanpa alias; baris `kunci: nilai` dipertahankan sebagai paragraf di bab 1 |

Amandemen DOC-FIX-B (temuan uji DC35-F1, FIX-IMP D-405 dan D-406; KD-42 tidak menebak):
- CW-02 mendapat `details.reason = "compound"` untuk nilai majemuk status laporan, vonis, atau status butir: beberapa alternatif dipisah `/`, `,`, `|`, `atau`/`or`, misalnya `PASS/FAIL`, `complete/blocked`, `todo,blocked` (`aliasTokenOf`, `L/services/import/contract/parse.ts:145-173`; pemanggil `L/services/import/contract/index.ts:198`, `:208`, `:258-260`, `:392-393`). Nilai tidak dipetakan dan teks utuh dipertahankan. Status laporan majemuk tanpa `--status` → kode keluar 3 (§16.6). Nilai berekor catatan tetap terpetakan (`FAIL (catatan)`, `complete | Giliran: …`). Sebelum FIX-IMP, nilai majemuk dipotong diam-diam ke token pertama (`PASS/FAIL` menjadi `PASS`), yang menyalahi KD-42.
- CW-04 kini juga dipakai untuk medan `owner` dan `taskRef` yang majemuk (`DC-03/DC-04`, `coder/verifier`, `DC-03 | DC-04`) atau tidak cocok pola C36/C35: medan dibiarkan kosong, `details` = `{ scope: "record", field, key, value, reason }` dengan `reason` = `compound` \| `pattern`, dan baris sumber tetap menjadi teks di bab 1 (`patternValueOf`, `parse.ts:176-199`; `index.ts:218`, `:223`, `:269-272`). Aturan yang sama berlaku untuk kolom `owner` tabel butir: `details.scope = "item"`, `field: "owner"`, butir tetap masuk tanpa `owner`, tabel tetap utuh di teks bab (`index.ts:419`). Nilai berekor catatan (`t_xxx (catatan)`) tetap terpetakan (D-377 butir 2).
- Alasan CW-04 dan bukan teks utuh: skema C35/C36 menolak `/`, `,`, dan spasi (`L/contract/env.ts:149`, `:151`). Tidak ada kode peringatan baru; E54 tetap CW-01..CW-04. Perubahan perilaku yang diterima D-406: nilai yang gagal pola dulu hanya dicatat sebagai catatan `FIELD_VALUE_INVALID`, kini menjadi peringatan CW-04 sehingga `--strict` menangkapnya (kode keluar 1).

### 13.3 Ringkasan hitungan

| Kelompok | Sebelum | Baru | Sesudah |
|---|---|---|---|
| `STUDIO_ERROR_CODES` | 69 | 4 (EC25-EC28) | 73 |
| `SCHEMA_V2_CHECK_IDS` (E41) | 8 | 6 (CH-01..CH-06) | 14 |
| DF (C29 + C30) | 71 | 2 (DF-72, DF-73) | 73 |
| Kode peringatan kontrak (E54) | 0 | 4 | 4 |
| Kode isu draf (E55) + alasan 413 (E56) | 0 | 8 + 2 | 10 |

## 14. Konstanta, enum, amandemen

### 14.1 Konstanta (`L/contract/env.ts` kecuali disebut)

| ID | Nama | Nilai |
|---|---|---|
| C34 | `CARD_ID_PATTERN` | `"^t_[0-9a-f]{8}$"` |
| C35 | `CONTRACT_KEY_PATTERN` | `"^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$"` (butir `key`, `taskRef`, `dependsOn`, `evidence.item`) |
| C36 | `CONTRACT_ACTOR_PATTERN` | `"^[a-z0-9][a-z0-9._-]{0,63}$"` |
| C37 | `CONTRACT_REPORTED_AT_PATTERN` | pola `reportedAt` §5.3 |
| C38 | `CONTRACT_SHA_PREFIX_PATTERN` | `"^[0-9a-f]{8,64}$"` |
| C39 | `CONTRACT_LIMITS` | `{ cardIds: 64, items: 500, dependsOn: 32, refs: 100, evidence: 200, refText: 500 }` |
| C40 | `CONTRACT_DEFAULT_RENDER_FORMATS` | `["HTML"]` |
| C41 | `STUDIO_FTS_CONFIG` | `"simple"` |
| C42 | `STUDIO_FTS_MAX_CHARS` | `100000` |
| C43 | `SEARCH_LIMITS` | `{ qMin: 2, qMax: 200, takeDefault: 20, takeMax: 100 }` |
| C44 | `SEARCH_SNIPPET_OPTIONS` | `"MaxWords=30, MinWords=10, ShortWord=2, MaxFragments=2, StartSel=[[, StopSel=]]"` |
| C45 | `CONTRACT_QUERY_LIMITS` | `{ takeDefault: 50, takeMax: 200, statusListMax: 8 }` (selaras `documents/route.ts:81-82`) |
| C46 | `QUERY_RATE_LIMIT_DEFAULT` (`L/http/quota.ts`) | `120`; env `STUDIO_QUERY_RATE_LIMIT` |
| C47 | `QUERY_RATE_WINDOW_MS_DEFAULT` (`L/http/quota.ts`) | `60000`; env `STUDIO_QUERY_RATE_WINDOW_MS` |
| C48 | `STUDIO_QUOTA_REMAINING_HEADER` | `"X-Studio-Quota-Remaining"` |
| C49 | `STUDIO_QUOTA_BUCKET_HEADER` | `"X-Studio-Quota-Bucket"` |
| C50 | `STUDIO_FINAL_FILENAME_HEADER` | `"X-Studio-Final-Filename"` |
| C51 | `FINAL_FILENAME_PATTERN` | `"^([A-Za-z0-9](?:[A-Za-z0-9.-]{0,78}[A-Za-z0-9])?)_rev(0\|[1-9][0-9]{0,5})_([0-9]{8}T[0-9]{6}Z)_([0-9a-f]{8})\\.(docx\|pdf\|html\|svg\|png)$"` |
| C52 | `FINAL_DOC_NUMBER_MAX` | `80` |
| C53 | `FINAL_ARTIFACT_PREFIX` | `"ART-"` |
| C54 | `DRAFT_LIMITS` | `{ bodyBytes: 4194304, maxChars: 2000000, maxBlocks: 20 }` |
| C55 | `DRAFT_HEADER_KEYS` | `["tujuan", "langkah-berikut", "basis"]` |
| C56 | `DRAFT_BASIS_PATTERN` | `"^(?:([a-z0-9]{20,40})@rev([1-9][0-9]{0,5})\|baru)$"` |
| C57 | `DRAFT_ACCEPTED_SCHEMAS` | `["studio.doc/v2", "studio.chapter/v2", "studio.slot/v2"]` |
| C58 | `CONTRACT_KIND_DEFS` (`L/registry/contracts.ts`) | `readonly ContractKindDefV2[]`, isi §6.4; tahap 1 = 1 entri |
| C59 | `CHART_CUSTOM_FORMS` (`L/registry/charts.ts`) | CU-01..CU-09 |
| C60 | `CHART_CUSTOM_FORM_COUNT` (`L/registry/charts.ts`) | `9` |

### 14.2 Enum TS (`L/contract/enums.ts`)

| ID | Konstanta / tipe | Nilai |
|---|---|---|
| E44 | `CONTRACT_KINDS` / `ContractKind` | `agentWorkReport` |
| E45 | `AGENT_WORK_REPORT_STATUSES` / `AgentWorkReportStatus` | CS-01..CS-05 |
| E46 | `CONTRACT_ITEM_STATUSES` / `ContractItemStatus` | CI-01..CI-07 |
| E47 | `CONTRACT_VERDICTS` / `ContractVerdict` | CD-01..CD-04 |
| E48 | `CONTRACT_REF_RELS` / `ContractRefRel` | `basis`, `evidence`, `output`, `supersedes` |
| E49 | `CONTRACT_EVIDENCE_KINDS` / `ContractEvidenceKind` | `file`, `command`, `commit`, `correlation` (bentuk rujukan bukti inv §4 K1 :295-306) |
| E50 | `CONTRACT_OUTLINE_KEYS` / `ContractOutlineKey` | `ringkasan`, `rincian`, `bukti`, `isu`, `lanjut` |
| E51 | `CHART_CUSTOM_MARKS` / `ChartCustomMark` | `bar`, `line`, `point`, `area` |
| E52 | `CHART_CUSTOM_ORIENTATIONS` / `ChartCustomOrientation` | `vertical`, `horizontal` |
| E53 | `QUOTA_BUCKETS` / `QuotaBucket` | `render`, `validate`, `import`, `query` |
| E54 | `CONTRACT_WARNING_CODES` / `ContractWarningCode` | CW-01..CW-04 |
| E55 | `DRAFT_ISSUE_CODES` / `DraftIssueCode` | DR-01..DR-08 |
| E56 | `DRAFT_LIMIT_REASONS` / `DraftLimitReason` | DR-09, DR-10 |
| E57 | `FINAL_NAME_MODES` / `FinalNameMode` | `final`, `datum` |

### 14.3 Amandemen nama lama (diperluas, tidak didefinisikan ulang)

| ID | Nama lama | Perubahan | Pemilik |
|---|---|---|---|
| AM-01 | C33 `SLOT_SECTION_TYPES` | + `contractRecord` (8 → 9) | DC-06 |
| AM-02 | T2-44 `SlotPayloadV2`, `DocSectionPayloadV2` | + T2-61 | DC-05 |
| AM-03 | T2-23 `ChartV2` | `code` + `"custom"`; medan `form?: ChartCustomFormV2` (CH-05) | DC-05 |
| AM-04 | E41 `SCHEMA_V2_CHECK_IDS` | + CH-01..CH-06 (8 → 14) | DC-05 |
| AM-05 | `STUDIO_ERROR_CODES` / `STUDIO_ERROR_HTTP` | + EC25..EC28 (69 → 73) | DC-05 |
| AM-06 | C16 `STUDIO_ROUTES` | + `R21`, `R22`, `R23` (§9) | DC-05 |
| AM-07 | `RegistryKind` / `REGISTRY_KINDS` (`types/api.ts:380-406`) | + `contracts` | DC-05 |
| AM-08 | T2-60c `SubmitResultV2`; R08 `submitPreview` | + `warnings?: SubmitWarningV2[]` (hanya bila tidak kosong) | DC-05 (tipe), DC-08 (isi) |
| AM-09 | `OutputFileDto` (`types/api.ts:234-256`) | + `finalFileName: string` | DC-05 (tipe), DC-20 (isi) |
| AM-10 | `SECTION_REGISTRY_COUNT`, `SECTION_REGISTRY_GROUP_COUNTS` | 51 → 52; DOCUMENT 29 → 30 | DC-06 |
| AM-11 | `SLOT_KINDS` | + entri §6.2 | DC-06 |
| AM-12 | C29/C30 (`forbidden.ts`) | + DF-72, DF-73 (71 → 73) | DC-05 |
| AM-13 | `TemplateSummary` (R01/R02/R19) | + `contractKind: string \| null` | DC-05 (tipe); pengisian di route templat menunggu baris (CQ-4) |
| AM-14 | R10 | + HEAD, `?name=`, header C50 | DC-18 |
| AM-15 | R17 format bawaan | KD-41 untuk dokumen ber-contractKind | DC-20 (CQ-2) |
| AM-16 | Route bucket yang ada (R07, R08, R09, R17, import) | + header kuota QH-01..QH-05 | DC-19 |
| AM-17 | StudioDocV2 R04 ke dokumen baru bertemplat CK-01 | tanpa perubahan bentuk; `sections.record` = T2-61 | - |

## 15. Antarmuka modul

| ID | Tanda tangan | Berkas (baru kecuali disebut) | Pemilik |
|---|---|---|---|
| I54 | `checkContractRecord(payload: ContractRecordPayloadV2, kind: ContractKind): { issues: Array<{ pointer: string; checkId: SchemaV2CheckId }>; error?: { code: "CONTRACT_ITEM_KEY_DUPLICATE"; details: unknown } }` | `L/services/contracts/validate.ts` | DC-07 |
| I55 | `resolveContractRefs(refs: ContractRefV2[], reader: ContractRefReader): Promise<{ resolved: Array<{ position: number; targetDocumentId: string; targetPid: string \| null; targetRevisionNo: number \| null; rel: ContractRefRel }>; warnings: SubmitWarningV2[] }>` (melempar EC25/EC26; `ContractRefReader` internal, baca saja) | `L/services/contracts/refs.ts` | DC-07 |
| I56 | `projectContractRows(payload, ctx: { documentId; revisionNo; revisionId; docSectionId; kind; itemPids: string[]; resolvedRefs }): { record; items; refs; mirror }` (murni) | `L/services/contracts/project.ts` | DC-07 |
| I57 | `contractRecordTextPlain(payload: ContractRecordPayloadV2): string` (§5.7) | `L/services/contracts/text.ts` | DC-07 |
| I58 | `contractItemTextPlain(item: ContractItemV2): string` (§5.7) | `L/services/contracts/text.ts` | DC-07 |
| I59 | `formatFinalFileName(parts: FinalFileNameParts): string` | `L/services/render/final-name.ts` | DC-17 |
| I60 | `parseFinalFileName(name: string): FinalFileNameParts \| null` | idem | DC-17 |
| I61 | `docNumberSafe(docNumber: string): string` (FN-02) | idem | DC-17 |
| I62 | `finalFileNameOf(file: { createdAt: Date; sha256: string; format: StudioOutputFormat }, owner: { docNumber: string; revisionNo: number } \| { artifactId: string }): string` | idem | DC-17 |
| I63 | `extractDraft(markdown: string): { header: DraftCheckResultV2["header"]; issues: DraftIssueV2[]; blocks: Array<{ index; line; endLine; text; value: unknown \| null; schema: string \| null }> }` (murni) | `L/services/draft/index.ts` | DC-21 |
| I64 | `markdownToContract(markdown: string, opts: { kind: ContractKind; mission?: string; docKey?: string; docNumber?: string; docTitle?: string; status?: string; reportedAt?: string; entry?: number \| "last" }): { doc: StudioDocV2; report: { generator: "md2contract/v1"; warnings: Array<{ code: ContractWarningCode; line: number; details?: unknown }>; mapping: unknown } }` (murni, deterministik) | `L/services/import/contract/index.ts` | DC-24 |
| I65 | `queryContracts(filter): Promise<{ contracts: ContractSummaryV2[]; nextCursor: string \| null }>` | `L/services/query/contracts.ts` | DC-14 |
| I66 | `searchBlocks(filter): Promise<{ hits: SearchHitV2[]; nextCursor: string \| null }>` | `L/services/query/search.ts` | DC-14 |
| I67 | `withQuotaHeaders(res: Response, bucket: QuotaBucket, rl: RateLimitResult): Response` | `L/http/quota.ts` | DC-19 |
| I68 | `resolveChartCustom(form: ChartCustomFormV2, dataShape: ChartDataShape): DrawnChartCode \| null` | `L/registry/charts.ts` (berkas ada) | DC-26 |

Route baru: `API/contracts/route.ts` (DC-15), `API/search/route.ts` (DC-16), `API/drafts/check/route.ts` (DC-23). CLI: `scripts/studio/draft-check.ts` (DC-22), `scripts/studio/md2contract.ts` (DC-25).

Amandemen DC-33 (D-377): hasil I64 bertambah medan `validation` dan menjadi `{ doc: StudioDocV2; report: …; validation: { valid: boolean; issues: ValidationIssue[] } }` (`ContractImportResult`, `L/services/import/contract/types.ts:111-116`). `validation` = hasil validator v2 repo (ajv bersama + `classifySchemaV2Errors`) atas `doc`, tanpa DB (`validateContractDoc`, `L/services/import/contract/index.ts:607-610`); dikembalikan juga pada hasil sukses. CLI DC-25 memakainya untuk kode keluar 1 (dokumen tidak sah) dan baris `valid=` di stderr.

## 16. Generator MD lama ke kontrak (DC-24, DC-25; U-4: hanya banding + draf)

### 16.1 Bentuk masukan

| Bentuk | Pengenal | Pemetaan |
|---|---|---|
| F1 laporan tunggal (R1-R3, K2-K7) | frontmatter opsional + baris `Kunci: nilai` di 40 baris pertama + judul `##` | kunci → GF; judul → GA; prosa lewat importer `md/v1` (`L/services/import/markdown.ts`, baca saja) |
| F2 entri `PHASE-REPORTS.md` (K1) | `## YYYY-MM-DD HH:MM` + `[FASE] <misi> \| <dari> -> <ke> \| HH:MM` + baris berlabel | `--entry <n\|last>` (bawaan `last`); label → GL; `[FASE]` → `phase` + misi (GL-12); judul entri → `reportedAt` (GL-13) |

Normalisasi judul sama dengan DC-01 (inv §2.1 :34): huruf kecil, digit → `N`, nomor awal dibuang, dipangkas, maks 70 karakter. Alias dicocokkan pada bentuk ternormalisasi, persis.

### 16.2 Alias judul `##` (GA) → bab atau slot

Kolom bukti = berkas pemuat per kelas (inv §4, §6).

| ID | Judul ternormalisasi | Tujuan | Bukti |
|---|---|---|---|
| GA-01 | `ringkasan` | bab 1 | K3 60, K4 13, R3 10, R1 8 |
| GA-02 | `ringkasan eksekutif` | bab 1 | K4 10 |
| GA-03 | `ringkasan eksekusi` | bab 1 | K4 8 |
| GA-04 | `ringkasan tugas` | bab 1 | contoh K3 (inv :712) |
| GA-05 | `status` | bab 1 | K4 10 |
| GA-06 | `kesimpulan` | bab 1 | K5 4 |
| GA-07 | `verdict` | bab 1 | K6 61, K5 13 |
| GA-08 | `vonis` | bab 1 | K6 9, K5 8 |
| GA-09 | `vonis akhir` | bab 1 | K6 10, K5 6 |
| GA-10 | `putusan` | bab 1 | K5 18 |
| GA-11 | `perubahan` | bab 2 | R1 23 |
| GA-12 | `changes made` | bab 2 | R1 21 |
| GA-13 | `executed steps` | bab 2 | R1 20 |
| GA-14 | `langkah analisa` | bab 2 | K3 10 |
| GA-15 | `berkas` | bab 2 | R1 24, R2 4 |
| GA-16 | `berkas diubah` | bab 2 | R2 1 |
| GA-17 | `isi` | bab 2 | R1 12 |
| GA-18 | `keputusan` | bab 2 | R1 21 |
| GA-19 | `keputusan / deviasi` | bab 2 | R1 8 |
| GA-20 | `temuan` | bab 2 | R1 25, K5 7 |
| GA-21 | `strategi uji` | bab 2 | R3 19 |
| GA-22 | `bukti` | bab 3 | R1 50, R2 2 |
| GA-23 | `artefak` | bab 3 | K3 30, K4 9, K2 2 |
| GA-24 | `artefak terbit (ukur disk nyata, cetakan alat)` | bab 3 | K2 1 |
| GA-25 | `verifikasi` | bab 3 | K3 36 |
| GA-26 | `verification` | bab 3 | R1 18 |
| GA-27 | `test results` | bab 3 | R1 21 |
| GA-28 | `hasil check` | bab 3 | K4 12 |
| GA-29 | `bukti verifikasi` | bab 3 | R2 1 |
| GA-30 | `perintah dan keluaran` | bab 3 | R3 2 |
| GA-31 | `gerbang (diukur pada state akhir disk, bukan ingatan)` | bab 3 | K2 2 |
| GA-32 | `tabel vonis` | bab 3 | K6 45 |
| GA-33 | `bukti reproduksi` | bab 3 | K6 41 |
| GA-34 | `tabel check` | bab 3 | K5 13 |
| GA-35 | `cara menjalankan` | bab 3 | R3 14 |
| GA-36 | `persistent issues` | bab 4 | R1 36 |
| GA-37 | `issues & decisions` | bab 4 | R1 32 |
| GA-38 | `blocker` | bab 4 | K4 13, K3 12, K5 4 |
| GA-39 | `blocker & flag` | bab 4 | K3 13 |
| GA-40 | `catatan / blocker` | bab 4 | K3 9 |
| GA-41 | `keterbatasan` | bab 4 | K4 8, R3 3 |
| GA-42 | `batas klaim` | bab 4 | K4 10, K6 6, K5 4 |
| GA-43 | `temuan untuk controller` | bab 4 | R2 3 |
| GA-44 | `permintaan lintas pemilik` | bab 4 | R1 10, R2 2 |
| GA-45 | `keputusan (untuk dicatat controller)` | bab 4 | R1 7 |
| GA-46 | `butir terbuka` | bab 4 | R2 1 |
| GA-47 | `analisis cakupan dan celah` | bab 4 | R3 7 |
| GA-48 | `next steps` | bab 5 | R1 33 |
| GA-49 | `rekomendasi` | bab 5 | R3 10 |
| GA-50 | `kartu_lanjutan_saran` | bab 5 | K4 11, K5 5 |
| GA-51 | `penutup` | bab 5 | K4 7 |
| GA-52 | `catatan ci` | bab 5 | R3 15 |
| GA-53 | `referensi` | slot `references` | K5 28, K4 19, K3 9 |
| GA-54 | `N referensi` | slot `references` | K4 7 |

Judul lain → CW-03, isinya menjadi bab tambahan berkunci 6, 7, … sesuai urutan kemunculan (tidak ada teks yang dibuang). Dua judul ber-alias ke bab yang sama → digabung sebagai section berurutan di bab itu.

### 16.3 Alias label baris K1 (GL)

| ID | Label | Tujuan | Bukti (kemunculan, inv §4 K1 :311-313) |
|---|---|---|---|
| GL-01 | `RINGKAS:` | bab 1 | 1097 |
| GL-02 | `JALUR:` | bab 2 (teks utuh; tidak dibuat butir) | 1048 |
| GL-03 | `ARTEFAK:` | bab 3 + `evidence[]`: setiap segmen dipisah `;` yang memuat path berekstensi → `{ kind: "file", ref }`; angka `NN B`/`NN.NNN B` → `bytes` (titik ribuan dibuang); heksa ≥ 8 sesudah `sha` → `sha256`. Segmen tanpa path hanya teks | 1060 |
| GL-04 | `HAMBAT:` | bab 4 | 43 |
| GL-05 | `LIMIT:` | bab 4 | 48 |
| GL-06 | `RENCANA:` | bab 5 | 1039 |
| GL-07 | `ESTIMASI:` | bab 5 | 1013 |
| GL-08 | `STATUS:` | `status` lewat GS | 24 |
| GL-09 | `CATATAN:` | bab 2 | 20 |
| GL-10 | `GERBANG:` | bab 3 | 11 |
| GL-11 | `RUJUKAN:` | bab 3 | 9 |
| GL-12 | `[FASE] <misi> \| <dari> -> <ke> \| HH:MM` | `phase.from`, `phase.to`; `<misi>` hanya dilaporkan di `report.mapping` (bukan folder misi) | 827 dari 1197 baris `[FASE]` cocok pola (:312) |
| GL-13 | `## YYYY-MM-DD HH:MM` (+ akhiran `WIB` → `+07:00`; `x` sesudah menit dibuang) | `reportedAt` | 977 entri berjudul tanggal (:310) |

### 16.4 Alias kunci kepala (GF)

| ID | Kunci (huruf kecil) | Medan | Bukti |
|---|---|---|---|
| GF-01 | `status` | `status` lewat GS | R1 `kv:status` 223 (:2169); K3 184 (:580); K2 3 (:405) |
| GF-02 | `agent` | `owner` | R1 51 (:2174) |
| GF-03 | `profil` | `owner` | K2 1 (:410) |
| GF-04 | `writer` | `owner` | K3 93 (:591) |
| GF-05 | `date` | `reportedAt` | R1 51 (:2175), K3 46 (:602) |
| GF-06 | `tanggal` | `reportedAt` | K3 76 (:594), K8 20 (inv §3.2 :119) |
| GF-07 | `created` | `reportedAt` bila GF-05/GF-06 absen | K3 89 (:592) |
| GF-08 | `row` | `taskRef` | R1 51 (:2176) |
| GF-09 | `task_id` | `taskRef` | R1 32 (:2184) |
| GF-10 | `kartu` | `cardIds` bila cocok C34, selain itu `taskRef` | K3 49 (:601) |
| GF-11 | `verdict`, `vonis` | `verdict` lewat GV | medan bertarget verdict/vonis (inv §3.3) |

Kunci lain → CW-04. Semua id cocok C34 di 40 baris pertama → `cardIds` (unik, urut kemunculan).

Amandemen DOC-FIX-B (D-406): kunci ber-alias yang mengisi `owner` atau `taskRef` (mis. GF-08, GF-09) tidak lagi dipotong ke token pertama. Nilai majemuk atau tidak cocok pola → medan kosong + CW-04 `reason` `compound` \| `pattern` (§13.2 amandemen DOC-FIX-B); baris sumber tetap teks di bab 1.

### 16.5 Alias status laporan (GS), status butir (GI), vonis (GV)

| ID | Nilai MD (dicocokkan huruf kecil kecuali vonis) | Kode | Bukti |
|---|---|---|---|
| GS-01 | `complete`, `completed` | `complete` | inv §3.3; K1 `completed` 1 (:253) |
| GS-02 | `draft`, `working-draft` | `draft` | K3 69, 2 (:627, :634) |
| GS-03 | `partial`, `partial-handoff` | `partial` | K3 1, 2 (:635, :633) |
| GS-04 | `blocked` | `blocked` | K1 1 (:252) |
| GS-05 | `needs-review`, `perlu_revisi` | `needs-review` | R1 19 (:2216); K3 5 (:630) |
| GI-01 | `done`, `selesai`, `complete` | `done` | K1 token (:276, :286) |
| GI-02 | `running`, `berjalan` | `running` | (:277, :285) |
| GI-03 | `ready` | `ready` | (:278) |
| GI-04 | `todo`, `sisa` | `todo` | (:280); JALUR `sisa:` (:344) |
| GI-05 | `review` | `review` | (:281) |
| GI-06 | `blocked` | `blocked` | (:270) |
| GI-07 | `cancelled`, `closed-as-cancelled` | `cancelled` | blueprint 07 §2.7 (tidak terukur di inventaris) |
| GV-01 | `PASS` | `PASS` | (:288) |
| GV-02 | `CAUTION` | `CAUTION` | K3 (:669) |
| GV-03 | `FAIL` | `FAIL` | (:288) |
| GV-04 | `NEEDS_REVIEW`, `NEEDS-REVIEW` | `NEEDS_REVIEW` | (:288) |

Sengaja tanpa alias (CW-02, tidak ditebak): `usulan`, `active`, `milik`, `lihat`, `relevan`, `prov`, `all` (K3 :628-640), `PARKED` (inv §5 :2088), `closed` (ambigu), vonis `SETUJU`, `SAH-`, `PARTIAL`, `ALL_OK`, `DONE` (:259-262, :649-652).

Amandemen DOC-FIX-B (D-405): pencocokan GS/GI/GV berlaku untuk satu nilai. Nilai majemuk yang memuat beberapa alternatif (`PASS/FAIL`, `complete/blocked`, `done/blocked`, `todo,blocked`, `… atau …`) tidak dipetakan ke alternatif pertama, walaupun alternatif itu ber-alias; hasilnya CW-02 `reason: "compound"` (§13.2 amandemen DOC-FIX-B).

### 16.6 Tabel butir, CLI, keluaran

- Tabel MD yang baris kepalanya memuat kolom {`id`, `kartu`, `card`, `key`} DAN kolom `status` → `items[]`. Alias kolom: `judul`/`title` → `title`; `assignee`/`owner`/`agen` → `owner`; `fase`/`phase` → `phase`; `dep`/`depends` → `dependsOn` (dipisah koma); `bukti`/`evidence` → `evidence[]` dengan `item` = kunci baris. Baris dengan status tanpa alias tidak dimasukkan ke `items[]` (CW-02 `scope: item`); tabel tetap utuh di teks bab.
- Status laporan hilang atau tanpa alias: pakai `--status`; tanpa `--status` → keluar kode 3 (KD-42). `reportedAt` hilang: pakai `--reported-at`; tanpa itu → keluar kode 3.
- CLI `npx tsx scripts/studio/md2contract.ts <berkas.md> --kind agentWorkReport [--mission <folder>] [--doc-key <key>] [--doc-number <nomor>] [--doc-title <judul>] [--status <kode>] [--reported-at <waktu>] [--entry <n|last>] [--strict] [--out <berkas.json>]`. Keluaran: satu `studio.doc/v2` (templat CK-01; `sections.record` + `sections.content.chapters` + `sections.references` bila ada) di stdout atau `--out`; laporan di stderr.
- Kode keluar: `0` sukses; `1` ada peringatan dan `--strict`; `2` galat pemakaian/berkas; `3` nilai wajib hilang. Dua jalan pada masukan sama → byte-identik (tanpa cap waktu, urutan kunci tetap).
- Amandemen DOC-FIX-C (FIX-CLI2, D-412; review dokumen DC-42b temuan N-02, D-413): unsur prosa yang dibuang importer (`mapping.prose[].dropped`, mis. `LIST_NESTING`, `THEMATIC_BREAK`) dilaporkan ke stderr per kode (jumlah, baris sumber, cuplikan) dengan `dropped=N` di ringkasan; stdout tidak berubah. Kode keluar `1` kini = ada peringatan pemetaan atau unsur dibuang dengan `--strict`, atau dokumen tidak sah menurut validator v2 (`scripts/studio/md2contract.ts:15`, `:22-27`).

## 17. Kasus uji yang dikunci

### 17.1 Dua belas kasus negatif validasi (DC-07; dasar = contoh slot §5.8)

| ID | Ubahan pada contoh | Hasil yang diharapkan |
|---|---|---|
| NV-01 | `payload.status = "running"` | 400 `SCHEMA_INVALID`, checkId `CONTRACT_ENUM`, pointer `/payload/status` |
| NV-02 | `items[0].status = "berjalan"` | 400, `CONTRACT_ENUM`, `/payload/items/0/status` |
| NV-03 | `cardIds[0] = "t_249c6b8"` (7 heksa) | 400, `CONTRACT_PATTERN`, `/payload/cardIds/0` |
| NV-04 | `items[1].key = "DC 03"` (spasi) | 400, `CONTRACT_PATTERN`, `/payload/items/1/key` |
| NV-05 | `reportedAt = "2026-02-30"` | 400, `CONTRACT_DATE`, `/payload/reportedAt` (pemeriksaan kalender pasca-ajv) |
| NV-06 | `due = "2026-11-02T10:00Z"` | 400, `CONTRACT_DATE`, `/payload/due` |
| NV-07 | `refs[0]` berisi `documentId` dan `docNumber` | 400, `CONTRACT_REF_TARGET`, `/payload/refs/0` |
| NV-08 | `refs[0].rel = "cites"` | 400, `CONTRACT_ENUM`, `/payload/refs/0/rel` |
| NV-09 | `items[0].label = "Kunci"` | 400, `DISPLAY_FIELD` (DF-72), `/payload/items/0/label` |
| NV-10 | `items[1].key = "t_5943d415"` (sama dengan butir 0) | 422 `CONTRACT_ITEM_KEY_DUPLICATE`, `details.positions = [1, 2]` |
| NV-11 | `refs[0].documentId` = id yang tidak ada | 422 `CONTRACT_REF_NOT_FOUND`, `details.reason = "DOCUMENT"` |
| NV-12 | `refs[0].pid` = pid yang tidak pernah ada di dokumen sasaran | 422 `CONTRACT_REF_PID_NOT_FOUND` |

Kasus positif pendamping (tidak dihitung): `refs[0].pid` pensiun → 201 dengan `warnings[0].code = "CONTRACT_REF_PID_RETIRED"`. Setiap kasus: 0 tulis DB (KS-3).

### 17.2 Delapan kasus ekstraktor draf (DC-21)

| ID | Masukan | Hasil |
|---|---|---|
| DX-1 | Kepala lengkap, tanpa blok | `DRAFT_NO_JSON_BLOCK`; `valid: false` |
| DX-2 | Satu blok, koma hilang di baris MD ke-9 | `DRAFT_JSON_MALFORMED` `line: 9` |
| DX-3 | Dua blok valid (slot `record` + bab `1`) | `blocks.length = 2`, keduanya `valid`; `valid: true` |
| DX-4 | Blok `$schema: "studio.contract/v1"` | `DRAFT_SCHEMA_UNKNOWN` |
| DX-5 | Pagar `json` tanpa penutup | `DRAFT_FENCE_UNCLOSED` |
| DX-6 | Blok berisi larik `[ … ]` | `DRAFT_BLOCK_NOT_OBJECT` |
| DX-7 | Kepala tanpa `tujuan`, satu blok valid | `DRAFT_HEADER_INCOMPLETE` (warning); `valid: true` |
| DX-8 | Pagar ```` ```text ```` berisi JSON + satu pagar `json` valid | tepat 1 blok terekstrak |

## 18. Penyesuaian baris blueprint akibat U-1..U-4 (BA)

Jenis: **Tetap** (tanpa perubahan lingkup), **Berubah** (isi atau contoh berganti), **Menyusut**, **Bertambah** (file/perilaku tambahan).

| ID | Baris | Jenis | Penyesuaian |
|---|---|---|---|
| BA-01 | DC-01 | Berubah (selesai) | Menginventaris laporan kerja agen, bukan `contract*.md` (D-361) |
| BA-02 | DC-02 | Berubah | Register ini; satu jenis |
| BA-03 | DC-03 | Berubah | Arm A = alur laporan kerja MD lama; KE-1 = buat laporan kerja, 2 pembaruan status, render HTML, unduh final; KE-6 dan banding = 3 laporan kerja nyata (bukan 3 misi). Usulan kandidat untuk dinilai DC-03: satu entri K1 (`2026-09-20-ft-eval-0920/PHASE-REPORTS.md`, inv :337-344), satu K2 (`2026-10-04-prompt-manual/_work/t_39134b6d/LAPORAN-SELESAI.md`, inv :499-506), satu R1 (`delegation_progress/coder_execution_fix1.md`, inv :2267) |
| BA-04 | DC-04 | Berubah + Bertambah | Kolom M19 sesuai §7.1 (`reportedAt`, `verdict`, `taskRef`, `phaseFrom/To`); 6 kolom cermin MX09; simpan rollback ke `prisma/rollback/03_rollback_studio_contract_delta.sql` |
| BA-05 | DC-05 | Berubah | Satu jenis; T2-61..T2-74; CH-01..CH-06; DF-72/DF-73; EC25..EC28; AM-02..AM-09, AM-12, AM-13; tanpa medan `kind` |
| BA-06 | DC-06 | Menyusut | `L/params/structure.ts` TIDAK disentuh (KD-31); registri `contracts.ts` satu entri; AM-01, AM-10, AM-11 |
| BA-07 | DC-07 | Berubah | NV-01..NV-12 (§17.1); I54-I58 |
| BA-08 | DC-08 | Tetap | Urutan §5.6; contoh asap memakai CK-01 |
| BA-09 | DC-09 | Berubah | Tulis M19-M21 + MX09 per §7.6; butir mendapat baris M17 `F:record/<n>` (KD-34) |
| BA-10 | DC-10 | Berubah | Unit `F:record`: tabel fakta + tabel butir + tabel bukti + daftar rujukan, label C58; contoh = laporan kerja |
| BA-11 | DC-11 | Berubah | Outline dari C58 (bukan `slot.outline`); asap = laporan tanpa bab 3 → INCOMPLETE (`content:3`) |
| BA-12 | DC-12 | Berubah | Contoh HTML = laporan kerja §5.8 |
| BA-13 | DC-13 | Berubah | idem DOCX; P-1 tetap (FIX-R1/FIX-T2 sudah diterima D-350/D-352) |
| BA-14 | DC-14 | Tetap | Fixture kueri memakai laporan kerja; I65/I66 |
| BA-15 | DC-15 | Tetap | R21 §9.1 |
| BA-16 | DC-16 | Tetap | R22 §9.2 |
| BA-17 | DC-17 | Tetap | I59-I62 |
| BA-18 | DC-18 | Bertambah | HEAD + `?name=` (KD-40, CQ-4) |
| BA-19 | DC-19 | Tetap | QH-01..QH-06; bucket `query` baru |
| BA-20 | DC-20 | Bertambah | `finalFileName` di mapper `OutputFileDto` bersama (CQ-3) + bawaan HTML di `L/services/render/scope.ts` (CQ-2) |
| BA-21 | DC-21 | Tetap | DX-1..DX-8 |
| BA-22 | DC-22 | Tetap | §11.3 |
| BA-23 | DC-23 | Tetap | §9.3 |
| BA-24 | DC-24 | Berubah | Masukan = laporan kerja F1/F2 (bukan `contract.md`); alias §16; "3 kontrak contoh" → 3 laporan kerja |
| BA-25 | DC-25 | Berubah | Opsi CLI + `--status`, `--reported-at`, `--entry`; kode keluar 3 |
| BA-26 | DC-26 | Tetap | CU-01..CU-09, C59/C60 |
| BA-27 | DC-27 | Tetap | - |
| BA-28 | DC-28 | Menyusut | R03 `kind=contracts` satu jenis |
| BA-29 | DC-29 | Menyusut | Seed 1 templat + 1 section type (bukan 4 templat) |
| BA-30 | DC-30 | Menyusut | Hitungan: 1 templat ber-contractKind, 52 section type |
| BA-31 | DC-31 | Berubah | Asap alur: buat laporan kerja, perbarui status lewat slot `record`, R21, R22, render HTML, unduh nama final |
| BA-32 | DC-32 | Tetap | - |
| BA-33 | DC-33 | Berubah | Bab panduan "Laporan kerja agen" menggantikan "buka misi, perbarui per fase, laporan fase" |
| BA-34 | DC-34 | Tetap | - |
| BA-35 | DC-35 | Berubah | Golden = 3 laporan kerja (BA-03) |
| BA-36 | DC-36 | Tetap | - |
| BA-37 | DC-37 | Berubah | 3 laporan kerja nyata; bandingkan unit teks, cardId, status, dan bukti berpath |
| BA-38 | DC-38 | Tetap | Rollback §7.5 |
| BA-39 | DC-39 | Tetap | Ambang CA-6 |
| BA-40 | DC-40 | Tetap | - |
| BA-41 | DC-41 | Berubah | Tambah: `evidence.ref` tidak pernah di-resolve (CA-11); `?name=` dan header C50 tahan injeksi header |
| BA-42 | DC-42 | Tetap | - |
| BA-43 | DC-43 | Berubah | U1-U5 = laporan kerja, status, query, draf, unduh |
| BA-44 | DC-44 | Berubah | Brief arm A = laporan kerja MD lama |
| BA-45 | DC-45 | Tetap | - |
| BA-46 | DC-46 | Berubah | Tambah MU-1, MU-2 (U-3) |
| BA-47 | DC-47 | Tetap | - |
| BA-48 | DC-48 | Tetap | - |

## 19. Asumsi, risiko, butir terbuka, kriteria penerimaan

### 19.1 Asumsi

| ID | Asumsi | Dasar | Verifikasi |
|---|---|---|---|
| CA-1 | Id pelaku (agen, profil Hermes) berhuruf kecil | contoh `gsp-master01`, `gsp-document-writer`, `coder-execution` (inv :504, :2170) | DC-37 pada 3 laporan; bila ada huruf besar, ajukan pelonggaran C36 |
| CA-2 | Label tampil hanya bahasa Indonesia di tahap 1 | dokumen GSP berbahasa ID; `language` bawaan ID (`schema.prisma:769`) | DC-42 |
| CA-3 | `catalogId` `S30` belum dipakai dan tidak dibatasi pola selain unik | `sections.ts:401-453` (S25-S29); unik `schema.prisma:743` | DC-06 Grep `catalogId: "S30"` = 0 sebelum tulis |
| CA-4 | `K-01` horizontal; `P-01` horizontal; urutan data `P-01` belum diketahui (**hipotesis**) | nama "Stacked bar", "Bar urut" (`charts.ts:714, 932`) | DC-26 baca perender |
| CA-5 | `websearch_to_tsquery('simple', 't_5943d415')` cocok dengan `to_tsvector('simple', …)` teks yang sama (**hipotesis**: parser memecah garis bawah secara konsisten di kedua sisi) | perilaku parser bawaan Postgres | asap DC-14 (kueri kartu) |
| CA-6 | Ambang kinerja: p95 server R21 dan R22 ≤ 500 ms pada volume v21; ≤ 1000 ms pada data sintetis 10x di `_uji` | usulan KS-5 blueprint 07 :499 | DC-39 |
| CA-7 | Dokumen v1 (M06) tidak dicari R22 | R22 hanya membaca M17 | panduan DC-33 menyebutnya |
| CA-8 | Preset `datum-gsp-preset` ada di v21 | `seed-studio.ts:509-510` (SR-36) | dry-run seed DC-29 |
| CA-9 | Dry-run R08 untuk rujukan membaca DB dalam transaksi READ ONLY | 03 §12 R08 | DC-08 asap |
| CA-10 | Agen menulis pagar draf di kolom 1 | KD-44 | DX-8; panduan DC-33 |
| CA-11 | Studio tidak membuka `evidence[].ref` (path, perintah) dalam bentuk apa pun | D-322 H3 | DC-41 |

### 19.2 Risiko (tambahan atas R1-R12 blueprint 07)

| ID | Risiko | Kemungkinan / dampak | Mitigasi / pemilik |
|---|---|---|---|
| RK-18 | `ADD COLUMN … GENERATED STORED` menulis ulang `StudioDocBlock` dengan kunci eksklusif selama migrasi | Pasti / sedang | DC-04 mencatat jumlah baris dan durasi; jalankan saat DEV diam |
| RK-19 | Nilai tsvector melebihi batas Postgres menggagalkan INSERT blok besar | Rendah / tinggi | C42 memotong masukan; DC-36 menguji blok tabel terbesar |
| RK-20 | Pencocokan identitas butir per `key` adalah logika baru di compose/commit | Sedang / sedang | DC-09/DC-10 asap 2 revisi: pid butir tetap saat urutan berubah |
| RK-21 | Drift Prisma untuk kolom `tsv` + indeks GIN (seperti IlSearchDoc) | Pasti / sedang | Pemetaan `Unsupported`, komentar skema, diff dikurangi baseline (blueprint 07 R3) |
| RK-22 | Header kuota = sisa per proses | Rendah / rendah | QH-06; satu instans HQ |
| RK-23 | Dua `docNumber` berbeda bertemu di bentuk aman yang sama | Rendah / rendah | R21 mengembalikan keduanya; `sha8` + `revisionNo` membedakan |
| RK-24 | Bawaan HTML menyentuh `L/services/render/scope.ts` yang tidak dimiliki baris mana pun | Pasti / rendah | CQ-2 |
| RK-25 | Mapper `OutputFileDto` bersama belum diketahui berkasnya | Pasti / rendah | CQ-3; DC-20 mendeklarasikan sebelum menulis |
| RK-26 | Cakupan alias judul rendah: judul ber-alias teratas hanya 4-24% berkas per kelas (inv §3.2, §4) | Tinggi / sedang | Bab tambahan (CW-03) menjaga teks; DC-37 mengukur porsi teks di bab 1-5 |
| RK-27 | Enum status gabungan lintas jenis kelak dapat memberi arti ganda | Sedang / rendah | §1.3: pemeriksaan per jenis + kode baru saat jenis kedua ditambahkan |
| RK-28 | `ts_headline` mahal pada blok panjang | Sedang / sedang | Subkueri berbatas (§8.1); DC-39 EXPLAIN |
| RK-29 | Penulis kontrak ganda tanpa penegakan (U-3) | Sedang / sedang | MU-1/MU-2 di DC-46; aturan panduan DC-33 |

Amandemen DOC-FIX-B, catatan rollout dan backlog (security DC-41 L-5 dan L-6; keputusan USER D-402 "dicatat sebagai catatan rollout/backlog"; tanpa perubahan kode):
- L-5 (melengkapi RK-18): migrasi `20261030220000_add_studio_contract` menambah kolom `GENERATED ALWAYS … STORED` yang menulis ulang `StudioDocBlock` di bawah kunci ACCESS EXCLUSIVE, dan `CREATE INDEX` tanpa `CONCURRENTLY` memblokir tulis selama indeks dibangun (`prisma/migrations/20261030220000_add_studio_contract/migration.sql:146-151`). Skrip rollback §7.5 memuat DROP manual tanpa CASCADE. Daftar periksa rollout produksi: jendela pemeliharaan, backup sebelum `migrate deploy`, ukur durasi pada salinan data produksi, dan rollback hanya sesudah backup. Gladi `_uji` DC-38 lulus (D-396), tetapi durasi pada volume produksi belum diukur.
- L-6 (bergantung AS-2): detail 422 EC25/EC26 mengungkap `currentRevisionNo` dan ada-tidaknya pid di dokumen sasaran (`L/services/contracts/refs.ts:84-90`, `:104-111`). Hari ini tidak ada kebocoran baru karena R04/R05 sudah terbaca semua pemanggil (AS-2). Bila kelak ada ACL baca per pemanggil, galat untuk dokumen yang tidak boleh dibaca diseragamkan menjadi `CONTRACT_REF_NOT_FOUND` tanpa `currentRevisionNo`; butir ini masuk backlog bersama perubahan ACL tersebut.

### 19.3 Metrik pemakaian U-3 (SQL baca-saja, DC-46)

- **MU-1** revisi per pelaku per dokumen kontrak:
  `SELECT d."id", d."docNumber", count(*) AS revisions, count(DISTINCT rv."createdBy") AS actors FROM "StudioDocument" d JOIN "StudioRevision" rv ON rv."documentId" = d."id" WHERE d."contractKind" IS NOT NULL GROUP BY d."id", d."docNumber";`
- **MU-2** porsi dokumen kontrak dengan `actors = 1` (penulis tunggal de facto) dan median `revisions`; dibandingkan dengan jumlah berkas laporan MD baru di workspace Hermes selama uji (KE-5).

### 19.4 Butir keputusan terbuka

Tidak ada butir yang memerlukan keputusan USER. Butir untuk controller (wewenang D-18; rekomendasi dicetak tebal):

| ID | Pertanyaan | Opsi | Rekomendasi |
|---|---|---|---|
| CQ-1 | Kode jenis dokumen laporan kerja | (a) `LAP` (anggota enum P3-20, ditambahkan ke daftar templat); (b) `NOT` | **(a)**: arti "laporan"; nomor `001/GSP/LAP/X/2026` |
| CQ-2 | Pemilik perubahan bawaan HTML di `L/services/render/scope.ts` | (a) DC-20 diperluas satu berkas; (b) baris baru | **(a)**: satu fungsi `requestFormats` (`scope.ts:132-134`) |
| CQ-3 | Pemilik mapper `OutputFileDto` bersama | (a) DC-20 mendeklarasikan berkas ke klaim gelombang; (b) baris baru | **(a)** |
| CQ-4 | Lingkup tambahan R10 (HEAD, `?name=`) dan `TemplateSummary.contractKind` di route templat | (a) DC-18 memegang R10; route templat menunggu baris temuan; (b) tunda keduanya | **(a)** untuk R10; `TemplateSummary.contractKind` cukup di tipe (DC-05) dan diisi saat ada baris |
| CQ-5 | Indeks trigram (blueprint 07 KC-1 a) | (a) tunda sampai DC-39; (b) tambahkan sekarang | **(a)** (KD-37) |

Amandemen DOC-FIX-B (D-400): CQ-5 DITUTUP, indeks trigram tidak diperlukan. DC-39 mengukur 15 kueri wakil: p95 terburuk R21 1,56 ms dan R22 7,18 ms di v21 (ambang CA-6 500 ms), serta R21 6,03 ms dan R22 90,05 ms pada data sintetis 10x di `_uji` (ambang 1000 ms). EXPLAIN memakai `StudioDocBlock_tsv_idx` pada 7/7 kueri R22 tanpa Seq Scan `StudioDocBlock`. I66 hanya memakai `tsv @@ websearch_to_tsquery`, sehingga `pg_trgm` tidak akan dipakai planner. KD-37 (tanpa trigram di tahap 1) tetap berlaku; evaluasi ulang hanya bila muncul kebutuhan pencarian substring, prefiks, atau salah ketik. Catatan pantau: perkiraan baris GIN oleh planner konstan (tsquery dari CTE), perlu diawasi di atas volume 10x.

### 19.5 Kriteria penerimaan register (diukur baris pemakai dan verifier)

| ID | Kriteria | Ambang / bukti |
|---|---|---|
| AC-11 | `STUDIO_ERROR_CODES` = 73; `STUDIO_ERROR_HTTP` memuat EC25-EC28 dengan HTTP §13.1 | hitungan dikutip (DC-05, DC-32) |
| AC-12 | `SCHEMA_V2_CHECK_IDS` = 14; DF = 73 | hitungan dikutip (DC-05) |
| AC-13 | `migration.sql` memenuhi §7.4 | 0 DROP; 3 / 0 / 19 / 4 / 8 |
| AC-14 | Rollback §7.5 hanya objek delta | 3 tabel, 8 kolom, 7 indeks tabel lama, 1 baris buku |
| AC-15 | Contoh §5.8 lolos ajv; NV-01..NV-09 → checkId yang disebut; NV-10..NV-12 → kode 422 yang disebut | keluaran asap dikutip (DC-05, DC-07) |
| AC-16 | `SECTION_REGISTRY_COUNT` 52 (DOCUMENT 30); C33 berisi 9 jenis | skrip hitung (DC-06) |
| AC-17 | C16 memuat R21-R23 dan berkas route ada | Glob (DC-15, DC-16, DC-23) |
| AC-18 | Contoh FN diformat lalu di-parse identik; setiap `finalFileName` keluaran cocok C51 | asap (DC-17, DC-20) |
| AC-19 | DX-1..DX-8 memberi hasil §17.2; CLI `--remote` = R23 untuk 3 draf | asap (DC-21, DC-22, DC-23) |
| AC-20 | CU-01..CU-09 memetakan ke kode tergambar dengan `dataShape` sama; `CHART_REGISTRY_COUNT` tetap 76 | skrip (DC-26) |
| AC-21 | R03 `kind=contracts` mengembalikan tepat CK-01 dengan status E45 | asap (DC-28) |
| AC-22 | Seed: tepat 1 templat dengan `contractKind` tidak null; 52 baris section type; jalan kedua unchanged | keluaran seed (DC-30) |
| AC-23 | Setiap medan CV-02..CV-13 ada di skema §5.3 dan tidak ada medan lain di `ContractRecordPayloadV2` | pindai skema (DC-05) |
| AC-24 | Nama di register 03 yang diperbarui DC-32 identik dengan register ini | diff nama (DC-32) |

## 20. Verifikasi register (hitungan definisi)

| Register | Prefiks | Jumlah |
|---|---|---|
| Jenis kontrak | CK-01 aktif; CK-02..CK-05 dicadangkan | 1 + 4 |
| Vonis D-139 | CV-01..CV-26 | 26 |
| Status laporan / butir / vonis | CS / CI / CD | 5 / 7 / 4 |
| Outline | CO-01..CO-05 | 5 |
| Medan payload | CF-01..CF-13 | 13 |
| Keputusan desain | KD-29..KD-47 | 19 |
| Tipe kontrak | T2-61..T2-74 | 14 |
| checkId baru | CH-01..CH-06 | 6 |
| Medan tampilan baru | DF-72, DF-73 | 2 |
| Slot templat | SL-08..SL-10 | 3 |
| Model baru | M19..M21 | 3 |
| Kolom/relasi model lama | MX08..MX12 | 5 (8 kolom SQL) |
| Indeks baru | §7.3 | 19 |
| FK baru | §7.3 | 4 |
| Route baru | R21..R23 | 3 (+ R03, R10, R17 berubah) |
| Aturan header kuota | QH-01..QH-06 | 6 |
| Aturan nama final | FN-01..FN-08 | 8 |
| Kode galat HTTP baru | EC25..EC28 | 4 (total 73) |
| Kode peringatan | CW-01..CW-04 | 4 |
| Kode isu draf + alasan 413 | DR-01..DR-10 | 10 |
| Konstanta | C34..C60 | 27 |
| Enum TS | E44..E57 | 14 |
| Amandemen | AM-01..AM-17 | 17 |
| Antarmuka | I54..I68 | 15 |
| Bentuk chart.custom | CU-01..CU-09 | 9 |
| Alias generator | GA-01..GA-54, GL-01..GL-13, GF-01..GF-11, GS-01..GS-05, GI-01..GI-07, GV-01..GV-04 | 94 |
| Kasus negatif / draf | NV-01..NV-12 / DX-1..DX-8 | 12 / 8 |
| Penyesuaian baris | BA-01..BA-48 | 48 |
| Asumsi / risiko / butir terbuka / kriteria | CA-1..CA-11 / RK-18..RK-29 / CQ-1..CQ-5 / AC-11..AC-24 | 11 / 12 / 5 / 14 |
| Metrik U-3 | MU-1, MU-2 | 2 |

Nama baru yang bukan ID tabel tetapi didefinisikan di baris berID di atas: slug `laporan-kerja-agen`; section type `contractRecord` (dan `catalogId` `S30`); slotKey `record`; tipe baris M17 `contractItem`; migrasi `20261030220000_add_studio_contract`; berkas rollback `prisma/rollback/03_rollback_studio_contract_delta.sql`; env `STUDIO_QUERY_RATE_LIMIT`, `STUDIO_QUERY_RATE_WINDOW_MS`; parameter route R21 (`docNumber`, `kind`, `status`, `cardId`, `owner`, `taskRef`, `dueBefore`, `dueAfter`) dan R22 (`q`, `type`, `slotKey`, `revisionNo`); parameter R10 `name`; CLI `draft-check.ts`, `md2contract.ts` beserta opsinya.

Cek bentrok yang dilakukan sesi ini: 4 kode EC25-EC28 tidak ada di `errors.ts:19-94`; checkId CH-01..CH-06 tidak ada di `enums.ts:430-439`; prefiks register (§0.2) tidak memakai ulang ID 01/03 untuk arti lain; `contractRecord` tidak ada di `slots.ts:25-34`; route path R21-R23 tidak ada di `env.ts:56-78`.
