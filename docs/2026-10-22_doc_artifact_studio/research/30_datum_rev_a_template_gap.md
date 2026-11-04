---
type: requirements
confidence: medium
subject: Analisis celah templat Doc Artifact Studio terhadap Manual Penulisan PT GSP Rev A (ID 2 Nov 2026, EN 3 Nov 2026)
author_agent: data-analyst
date: 2026-11-04
status: complete (analisis baca-saja; tidak ada implementasi, tidak ada tulis DB)
note: nama berkas diminta 30_datum_revA_template_gap.md; hook docs_accountability mewajibkan snake_case sehingga disimpan sebagai 30_datum_rev_a_template_gap.md
---

# Celah templat Studio terhadap DATUM Rev A (edisi Indonesia dan Inggris)

## 0. Source Tasks

| Unsur | Isi |
|---|---|
| Apa | Membandingkan jenis dokumen dan bentuk yang diatur Manual Penulisan PT GSP Rev A (edisi ID dan EN) dengan 7 templat Studio yang kini ada di produksi, lalu mengusulkan templat baru ID dan EN. |
| Permintaan pengguna | "cek datum terbaru tambahkan templat yang belum ada di studio versi indonesia dan inggris". Tugas ini hanya analisis dan usulan; implementasi menunggu keputusan pengguna (bagian 9). |
| Siapa | Pemakai: controller, pm-planner, coder-execution. Pemangku: Divisi Engineering (kustodian ENG-01), agen penulis (Hermes) lewat MCP Studio. |
| Kapan | 2026-11-04. Manual ID Rev A bertanggal 2 November 2026, EN Rev A 3 November 2026. Produksi v2.1 melayani port 9011 sejak 2026-11-04 16:59 (`deploy/04_deploy_execution_log.md:8`). |
| Lingkup | Bentuk dokumen (jenis, tier, nomor, sampul, lembar kendali, kop, bahasa). Isi aturan bahasa (Bab 4-5) dan chart (Bab 9-10) hanya disentuh bila memengaruhi templat. |
| Batas | Baca saja. Tidak menjalankan perintah apa pun yang menulis DB; produksi (9011, `gsp_agent_hq`) tidak disentuh. |

### 0.1 Metodologi

1. Membaca teks hasil ekstraksi manual (`manual_id.txt` 5045 baris, `manual_en.txt` 4875 baris) per bab yang relevan: daftar isi, Bab 1-3, 5.4, 6.7/6.8, Bab 8, 9.9, Bab 11-14.
2. PDF tidak bisa dirender di sesi ini (`pdftoppm` tidak terpasang), jadi gambar (mis. Gambar 2.1 pohon tier, Gambar 3.2 tata surat, Gambar 8.2 sampul) hanya diketahui dari caption dan prosa di sekitarnya. Celah ini dicatat di bagian 7.
3. Membaca kode repo: seed (`prisma/seed-studio.ts`), registri section/slot/kontrak/parameter, renderer halaman pembungkus, compose slot depan, pemformat angka, lint bahasa, klien MCP `studio_write`, panduan agen, dan rencana/log deploy.

### 0.2 Notasi rujukan

| Kode | Arti |
|---|---|
| `ID:n` | Baris di `C:/Users/TRIAL/gsp-backups/datum-revA-20261104/manual_id.txt` |
| `EN:n` | Baris di `C:/Users/TRIAL/gsp-backups/datum-revA-20261104/manual_en.txt` |
| `hlm n` / `sheet n` | Nomor LEMBAR/SHEET di blok register manual (dihitung dari sampul, sama dengan halaman PDF) |
| `file:n` | Path relatif akar repo `C:/Users/TRIAL/gsp-swarm-hq-v2.1` |
| (hipotesis) | Klaim yang belum dibuktikan dengan menjalankan sistem |

## 1. Ringkasan eksplorasi dan pengumpulan

- Kedua manual Rev A adalah dokumen baru: "Manual Penulisan PT GSP" yang menyatukan Manual Komprehensif DATUM Rev A, Manual Gaya Bahasa Ahli v1.3, Panduan Chart v1.1, Panduan Simbol v1.0, dan skill DATUM Rev O (`ID:31-35`). Dasarnya `datum-house-style v1.9 Rev O` (`ID:18`, `EN:18`).
- Basis Studio: katalog parameter diturunkan dari Manual Komprehensif DATUM 000/GSP/STD/X/2026 Rev A bertanggal 8 Oktober 2026 dan tokens.json v2.0.0 (`docs/.../research/01_manual_parameter_catalog.md:4, 20`); acuan paritas mesin = skill `datum-house-style` v2.6.0 (`docs/.../decisions/decisions.md:15`, D-10; `src/lib/studio/services/templates/profile.ts:125`). Templat `datum-gsp` bernama "DATUM GSP (profil Manual DATUM 2.6.0)" dan profilnya berasal dari `benchmark/manual000/template.json` (`prisma/seed-studio.ts:145-149, 18-28`).
- Produksi kini memuat 7 templat: `datum-gsp`, `datum-gsp-preset`, `datum-kanonik`, `datum-kanonik-preset`, `datum-manual-000`, `datum-manual-000-preset`, `laporan-kerja-agen` (`deploy/04_deploy_execution_log.md:146, 167`).

## 2. Ikhtisar

Studio saat ini punya satu templat dokumen umum yang dipakai klien (`datum-gsp`), satu profil kanonik, satu benchmark terbatas, dan satu templat jenis kontrak internal (laporan kerja agen). Tidak ada templat per jenis dokumen, dan tidak ada templat berbahasa Inggris. Bahasa ditentukan per dokumen lewat `meta.language` (ID/EN), dan sebagian teks pembungkus sudah dilokalkan, tetapi beberapa teks tetap berbahasa Indonesia dan pemformat angka selalu memakai konvensi Indonesia. Akibatnya dokumen EN yang dibuat di `datum-gsp` hari ini melanggar konvensi angka Inggris (6.7/6.8) dan memuat label Indonesia.

Manual Rev A mengatur 8 bentuk kerja: proposal teknis, kajian, laporan, RAB, surat dinas, workbook, paparan, dan chat (`ID:13`; `EN:13`). Hanya bentuk dokumen DOCX (proposal, kajian, laporan, standar, nota, ringkasan RAB) yang bisa dilayani Studio hari ini. Surat dinas dan surat ke pihak asing butuh kode renderer baru. Workbook, dek, paparan lisan, dan chat berada di luar lingkup Studio v2.1.

## 3. Jawaban 1: jenis dokumen dan bentuk menurut Manual Rev A

### 3.1 Daftar bentuk kerja

| Bentuk | Dasar di manual | Ciri bentuk |
|---|---|---|
| Proposal teknis (PT) | `ID:13`, Tabel 3.1 `ID:647`, contoh 14.1 `ID:4035-4090` (hlm 83); EN 14.3 `EN:4173-4223` | Dokumen DATUM penuh. Ringkasan eksekutif maks. 1 halaman, empat unsur berurutan (GA-02, `ID:1312-1318`). Tender atau kontrak naik ke SERAH (`EN:450`). |
| Kajian dan analisis teknis (KT) | Tabel 3.1 `ID:649`; contoh "Laporan Kajian Teknis ... 025/GSP/KT/X/2026" `ID:4115-4116` | Dokumen DATUM penuh, bentuk sama dengan proposal. |
| Laporan kegiatan (LAP) | Tabel 3.1 `ID:649`; 14.5 laporan teknis CCTV `ID:4283` | Dokumen DATUM. Manual tidak memberi kode khusus "laporan teknis"; laporan kajian memakai KT. |
| Verifikasi data, uji, forensik (VER) | Tabel 3.1 `ID:659`; Tabel 9.6 "Laporan OSINT dan forensik" `ID:3083` | Dokumen DATUM; alat instrumen wajib disebut dengan versinya (DT-42c, `ID:3969-3972`). |
| RAB atau BoQ (RAB) | Tabel 3.1 `ID:651`; 3.7 PPN `ID:759-783`; Bab 11 workbook `ID:3413-3557` | Bentuk utama = workbook .xlsx dengan sheet COVER, PETUNJUK, KENDALI, RINGKASAN-EKSEKUTIF, REKAPITULASI, RAB, AHS, HITUNG-* (DT-40a, `ID:3422-3431`). Prosa RAB di dokumen DATUM (14.3) memuat petikan rekapitulasi dan Turunan PPN. |
| Standar atau SOP (STD) | Tabel 3.1 `ID:653`; manual ini sendiri bernomor STD (`ID:15`) | Dokumen DATUM dengan kode aturan, indeks aturan, glosarium (Lampiran B, C). |
| Nota internal (NOT) | Tabel 3.1 `ID:655`; NOTA = tier bawaan (DT-02 `ID:406-412`) | Tier NOTA: prosedur melewati langkah 5 dan 8 (`ID:357`), gerbang hanya langkah 1 dan 10 (`ID:3868-3869`). |
| Surat dinas dan surat pengantar (SP), surat penawaran harga (SPH) | 3.6 `ID:703-757` (hlm 16-17); Tabel 3.3, 3.4; contoh 14.2 `ID:4092-4152` | Bukan DATUM: Arial 12 tinta hitam termasuk klasifikasi, margin PerANRI 2/2,5/3/2 cm atau Perkap 2/3/3/2 cm, nomor halaman tengah atas mulai halaman 2, 16 unsur berurutan (kop, tempat-tanggal, Nomor, Sifat, Derajat, Lampiran, Hal, alamat, salam, isi, usul, penutup, jabatan, tanda tangan dan cap, nama, tembusan) (`ID:709-750`). Laporan yang dilampirkan tetap DATUM (`ID:706-707`). |
| Surat dan surel ke pihak asing (EN saja) | EN 3.6 `EN:742-829` (sheet 16-17); Tabel 8.1 baris terakhir `EN:2649` | Kop marun Tabel 8.1, badan IBM Plex Serif 9,5 pt, penandaan hitam di tengah atas dan bawah, margin PerANRI, 13 bagian berurutan (`EN:794-817`); surel = surat pendek bagian 4 dan 6-13 (EG-58, `EN:825-828`). |
| Berita acara (BA), NDA, matriks (MAT), model (MOD) | Tabel 3.1 `ID:655-659` | Hanya kode jenis; manual tidak mengatur bentuk halamannya. |
| Workbook | Bab 11.1-11.4 `ID:3413-3557` | .xlsx dibangun `datum_xlsx.py`; warna sel = tipe sel. |
| Dek / command brief (DEK) | 11.5-11.6 `ID:3559-3613` | .pptx 16:9, 338,7 x 190,5 mm, satu klaim per slide, tutup dengan keputusan. |
| Paparan lisan | 11.7 `ID:3615-3655` | Naskah ucapan 10 menit; angka dibulatkan dua angka penting, tanda di catatan pembicara. |
| Chat dan pesan singkat | Bab 12 `ID:3660-3783` | Kanal tersendiri, tanpa klasifikasi, tanpa isi RAHASIA (BP-15). EN: surat, surel, dan chat tidak bertier (PK-14, `EN:448, 453-457`). |

### 3.2 Tier (2.1)

- Tiga tier: NOTA (bawaan), TERBIT, SERAH. Naik tier wajib dibenarkan, satu paket naik bersama (DT-02, `ID:406-420`, hlm 10). Artefak tanpa pembaca bernama di luar divisi tetap NOTA, dan hanya pihak luar atau tender yang menaikkannya ke SERAH (caption Gambar 2.1, `ID:414`).
- EN merinci pohon itu sebagai langkah: surat/surel/chat tanpa tier; pembaca hanya di divisi penulis atau Direktur = NOTA; deliverable kontrak atau tender = SERAH; selain itu TERBIT (`EN:447-451`). Ini aturan baru yang eksplisit di EN (PK-14, "English edition only", `EN:453-457`).
- SERAH menambah empat kewajiban: rute turunan kedua, blok turunan, rel bukti, gambar dari spec (Tabel 2.1, `ID:429-442`).
- Gerbang: SERAH 10 langkah, TERBIT 1-5, 7, 10, NOTA 1 dan 10 (`ID:3868-3869`).

### 3.3 Kode jenis dan penomoran (3.4)

- Pola `005/GSP/KT/VIII/2026`, bulan Romawi, tanpa awalan SR/R/T/B (DT-04b, `ID:634-641`, hlm 15; `EN:675-679`).
- Daftar tertutup ARSIP Tabel 3.1: PT, KT, RAB, SPH, SP, BA, NDA, DEK, LAP, MAT, STD, NOT, MOD, VER. DS pensiun sejak Rev K (E-21) (`ID:643-661`). EN: kode tetap Indonesia (`EN:681-683`).
- Nomor diambil dari Register Induk sebelum membangun; bila tidak terjangkau pakai `XXX/GSP/<KODE>/<BULAN>/<TAHUN>` dan tahan rilis (DT-04a, `ID:508-517`). Revisi menaikkan Rev, bukan nomor.
- Pasangan dwibahasa berbagi nomor, revisi, klasifikasi, dan nomor tabel; nama berkas menambah bahasa sesudah revisi (`... RevB EN.docx`, `... RevB ID.docx`) (`EN:429, 533`).

### 3.4 Sampul dan lembar kendali (8.2)

- Sampul 12 unsur dari atas: pita segel, logo 44-46 mm, baris alamat, ruang kosong, Datum Rule 166 mm, kicker jenis dokumen 7,4 pt Cond 600 seal, judul 24-26 pt, standfirst 10,5 pt Serif miring, baris cakupan, blok kendali 4 x 2, kolofon, string punggung (`ID:2474-2485`, hlm 47; `EN:2546-2557`). Semua rata kiri pada 24 mm (DT-14).
- Prosa 8.2 menyebut isi blok kendali: nomor dokumen, revisi, penyusun, kustodian, ditujukan kepada, halaman, datum geodetik, verifikasi (`ID:2486-2487`; `EN:2558-2559`). Sampul manual itu sendiri memakai medan lain: NOMOR DOKUMEN, REVISI, PENYUSUN, KUSTODIAN, DITUJUKAN KEPADA, TIER, DASAR, BAHASA (`ID:15-18`). Ini ketidakkonsistenan di dalam manual.
- Lembar kendali memuat riwayat revisi, rantai verifikasi tiga lapis, pernyataan metode, distribusi terkendali, dan tiga kolom tanda tangan; setiap salinan bernomor punya pemegang bernama (DT-13b) (`ID:2500-2508`). Contoh kolom di manual: REV, TANGGAL, PENYUSUN, PERUBAHAN, STATUS; LAPIS, METODE, OBJEK, HASIL; SALINAN, PEMEGANG, MEDIA, KEMBALI (`ID:27-62`). EN: REV, DATE, PREPARED BY, CHANGE, STATUS; LAYER, METHOD, OBJECT, RESULT; COPY, HOLDER, MEDIUM, RETURN (`EN:27-66`).
- Penomoran lembar: ID menulis "Sampul, lembar kendali, dan pembatas tidak bernomor. Penomoran lembar dimulai dari halaman pertama Bab 1" (`ID:2510-2511`), sedangkan EN menulis "Sheets count from the cover" (`EN:2582`). Praktik di kedua manual = dihitung dari sampul (Bab 1 di LEMBAR 6, `ID:304`). Menurut 1.7 EN, bila dua teks aturan bersama berbeda, edisi Indonesia menang (`EN:411-413`).

### 3.5 Kop marun (8.4)

- Seal #6E1420 (RGB 110, 20, 32) sejak Rev M, 12 Oktober 2026; Tabel 8.1 menang atas sumber warna lain: pita segel 5 x 166 mm, baris alamat 7 pt Cond, kolofon (entitas + NIB, cap terbit seal tebal), kepala halaman (teks ink400, klasifikasi seal tebal, garis seal 0,26 mm), blok register (garis atas seal 0,35 mm), workbook dan dek (klasifikasi dan garis bilah judul seal) (`ID:2564-2586`, hlm 49).
- Surat ke instansi bertinta hitam (DT-32) (`ID:2567`).
- EN menambah dua baris: logo hitam, sekali di sampul atau di kepala surat; surat atau surel ke pihak asing memakai kop ini, badan Plex Serif 9,5 pt, penandaan hitam (`EN:2643-2649`, sheet 51).

### 3.6 Aturan edisi bahasa (ID 6.7; EN 1.6, 1.7, 6.8, EN-L1-13, EG-50, EG-52)

- ID 6.7: satu berkas satu varian per kelas nilai; teks Inggris memakai 1,250,000.5, IDR 12.5 billion, 25 %, 14 October 2026, 17:00 WIB (UTC+7); lampiran Inggris pada dokumen Indonesia dibuka satu baris pernyataan konvensi (`ID:1998-2006`, hlm 37).
- EN 1.6 (PK-11): bahasa dipilih dari pembaca; instansi Indonesia mendapat bahasa Indonesia kecuali meminta tertulis; kementerian yang meminta Inggris mendapat pasangan dwibahasa (`EN:399-407`).
- EN 1.7 (PK-12, PK-13): kedua versi menyebut versi yang berlaku di front matter; dibangun dari satu register kuantitas, hanya format yang berubah (`EN:409-429`).
- EN-L1-13: pernyataan wajib di setiap versi Inggris untuk kementerian, kata per kata (`EN:1350-1352`).
- EG-50: penandaan Indonesia dipertahankan persis (TERBATAS, bukan RESTRICTED) (`EN:627-634`). EG-52/DT-28e EN: dokumen komersial GSP ke pihak asing = penandaan NDA, atau "GSP COMMERCIAL IN CONFIDENCE", tanpa tingkat Indonesia (`EN:663-673`).
- EN 6.8: satu konvensi per berkas (`EN:2076-2082`).
- EN 13.3: belum ada lint Inggris per 3 November 2026; 15 pindai EL-01..EL-15 dijalankan manual (`EN:3866-3897`).

### 3.7 Yang baru atau berubah di Rev A dibanding basis `datum-gsp` (sejauh bisa dipastikan)

| # | Perubahan | Bukti Rev A | Keadaan Studio | Keyakinan |
|---|---|---|---|---|
| C1 | Kop marun seal #6E1420 sejak Rev M | `ID:2569` | Sudah: `color.wrapper.seal` = 6E1420 (`src/lib/studio/params/color-type.ts:65`) | HIGH |
| C2 | DS pensiun; daftar tertutup memuat NDA, DEK, LAP, MAT, NOT, MOD, VER | `ID:643-661` | Bawaan `doc.typeCode` masih `KT, PT, RAB, SPH, SP, BA, DS, STD`; enum tidak memuat NDA (`src/lib/studio/params/governance-language.ts:114-120`) | HIGH |
| C3 | Korespondensi tanpa tier (EN) | `EN:448, 453-457` | Studio tidak merender surat; tidak berdampak pada templat dokumen | HIGH |
| C4 | Surat ke pihak asing berkop marun, Plex Serif, 13 bagian (EN) | `EN:742-829, 2649` | Tidak ada renderer surat (`src/lib/studio/registry/sections.ts:7, 581-592`) | HIGH |
| C5 | Penandaan komersial asing "GSP COMMERCIAL IN CONFIDENCE" (EN) | `EN:663-673` | Skema klasifikasi hanya `kemhanTni`, `polri`, `anri` (`src/lib/studio/params/apparatus.ts:261-283`); lint DATUM-18 menolak nilai di luar tingkat skema (`src/lib/studio/engine/lint/structure/checks-a.ts:406-421`) | HIGH |
| C6 | Pernyataan versi berlaku dan pasangan dwibahasa | `EN:415-429, 1350-1352` | Tidak ada slot/teks templat untuk itu; agen harus menulisnya sebagai isi | MEDIUM |
| C7 | Basis token: Rev A merujuk tokens.json v1.9 Rev O (DT-03, `ID:2432-2438`) | `ID:2436` | Studio dibangun dari tokens.json v2.0.0 (`research/01:20`); nilai belum dibandingkan di analisis ini | LOW (tidak diukur) |

Rincian nilai bentuk (grid 24/128/6/32/20 mm) cocok pada sampel yang diperiksa (`src/lib/studio/params/page.ts:68-82`), tetapi perbandingan token penuh Rev O vs v2.0.0 tidak dilakukan.

## 4. Jawaban 2: yang dicakup templat Studio saat ini

### 4.1 Per templat

| Templat | Bahasa | Struktur | Sampul / lembar kendali | Kop dan perangkat halaman | Per jenis atau umum |
|---|---|---|---|---|---|
| `datum-gsp` (preset `datum-gsp-preset`) | Netral; `meta.language` per dokumen, bawaan `doc.language` = ID (`src/lib/studio/services/compose/merge.ts:87`) | 7 slot: cover, controlSheet, signature, toc, content (bab berulang), references, appendices (`prisma/seed-studio.ts:570-578`; `docs/STUDIO-AGENT-GUIDE.md:197-209`) | Ya, aktif untuk TERBIT dan SERAH; NOTA menonaktifkan slot 1-4 (`docs/STUDIO-AGENT-GUIDE.md:209`) | Pita segel seal, kepala halaman, blok register, Datum Rule, string punggung, cap terbit dan kolofon (`src/lib/studio/registry/sections.ts:686-688`); rel bukti framePr (`prisma/seed-studio.ts:549-562`) | Umum. Kode jenis bawaan KT, tier bawaan TERBIT (`src/lib/studio/params/structure.ts:94-99`); kicker jenis dokumen kosong |
| `datum-kanonik` (preset `datum-kanonik-preset`) | Sama | 7 slot yang sama | Ya | Nilai bawaan registri | Umum (profil acuan) |
| `datum-manual-000` (preset terbatas) | ID | 6 slot (`benchmark/manual000/template.v2.json:18-137`) | Ya | Profil terukur Manual 000 | Khusus benchmark STD, TERBATAS untuk ADMIN (`docs/STUDIO-AGENT-GUIDE.md:195`) |
| `laporan-kerja-agen` | ID | 3 slot: record (contractRecord), content, references (`prisma/seed-studio.ts:1179-1192`) | Tidak (tier NOTA) | Tidak | Per jenis: kontrak `agentWorkReport`, kode LAP, tier NOTA (`prisma/seed-studio.ts:1217-1223`) |

### 4.2 Dukungan bahasa Inggris hari ini

Sudah dilokalkan menurut `meta.language`:
- Judul blok lembar kendali, kicker daftar isi, label Bab/Lampiran/Bagian (`src/lib/studio/engine/front/texts.ts:21-32`); pola kicker bab "CHAPTER {n}" (`texts.ts:89-115`); label blok kendali sampul (`texts.ts:120-129`); kata LEMBAR/DARI menjadi SHEET/OF di blok register (`src/lib/studio/engine/docx/package/header-footer.ts:164, 268-274`); label slot depan dari klien MCP (`scripts/studio/mcp/write-client.ts:104-107`).

Belum dilokalkan (tetap Indonesia pada dokumen EN):
- Kepala kolom tabel lembar kendali ditulis keras "Rev, Tanggal, Uraian, Oleh" / "Lapis, Peran, Nama, Tanggal" / "Salinan, Pemegang" (`src/lib/studio/services/compose/front.ts:29-32`). Isinya juga berbeda dari contoh manual (5 kolom dengan STATUS, `ID:29`), dan parameter `controlSheet.*.columns` (`src/lib/studio/params/page.ts:450-489`) tidak dipakai jalur ini.
- Kicker dan judul lembar kendali = label slot templat ("Lembar Kendali") (`front.ts:74-77`), dan nilai ini menang atas kicker berbahasa yang disediakan mesin (`src/lib/studio/engine/docx/wrapper/pages.ts:285`).
- Teks pita segel bawaan "KLASIFIKASI · {kelas}" dan "SALINAN INDUK · PENGGUNAAN INTERNAL GSP" (`src/lib/studio/params/page.ts:434-443`; `src/lib/studio/engine/docx/wrapper/render.ts:322-327`).
- Cap terbit "-- TERBITAN {n}" (`src/lib/studio/params/page.ts:334-344`; `texts.ts:190`).
- Label "Author" untuk PENYUSUN (`texts.ts:123`), sedangkan manual EN menulis "Prepared by" (`EN:16, 2558`).
- Angka terikat register selalu "1.250.000,5" dan "Rp": pemisah ditulis keras di `src/lib/studio/engine/bind/format.ts:13-16`. Ini melanggar 6.7/6.8 untuk dokumen Inggris.
- Lint bahasa: dokumen EN menjalankan pemindai Indonesia kecuali C-20 dan C-34 (`src/lib/studio/engine/lint/language/index.ts:36, 56-57`; `checks.ts:275`); tidak ada pindai EL-01..EL-15. Manual EN sendiri menyatakan belum ada lint Inggris (`EN:3870`), jadi ini sejalan, tetapi lint Indonesia yang berjalan pada teks Inggris bisa memberi hasil tidak bermakna (hipotesis).

Bagian yang sudah bisa diatur lewat data templat (parameter kelas B/K oleh ADMIN): `doc.language`, `wrapper.header`, `device.issueStamp.format`, `cover.kicker.text`, `render.toc.title`, label slot, `doc.defaultTypeCode`, `doc.defaultTier`, `doc.typeCode` (`merge.ts:83-87`; `page.ts:414-443`; `structure.ts:94-99`).

### 4.3 Kemampuan renderer per bentuk manual

| Bentuk | Bisa di renderer DOCX hari ini | Bukti |
|---|---|---|
| Dokumen DATUM (proposal, kajian, laporan, standar, nota, ringkasan RAB) | Ya | 30 section DOCUMENT + 7 PAGE_DEVICE renderable (`src/lib/studio/registry/sections.ts:24-577`); urutan sampul = 12 unsur manual (`src/lib/studio/params/page.ts:354-367`) |
| Surat dinas / surat pengantar / SPH | Tidak | `letter` CHANNEL `renderable: false`, "letter belum punya renderer" (`sections.ts:7, 581-592`); parameter `letter.font/marginLeftCm/...` hanya katalog, tidak dibaca mesin (`src/lib/studio/params/apparatus.ts:355-365`; tidak ada pemakai di `src/lib/studio/engine`) |
| Surat EN ke pihak asing | Tidak | Sama |
| Workbook | Di luar lingkup | `sheet.*` CHANNEL `renderable: false`, D-05 XLSX/PPTX di luar v2.1 (`sections.ts:7, 616-641`) |
| Dek / command brief | Di luar lingkup | `slide.*` `renderable: false` (`sections.ts:593-615`) |
| Paparan lisan, chat | Di luar lingkup | Tidak ada section type; kanal, bukan berkas dokumen |

## 5. Jawaban 3: tabel celah

Status: ADA = templat siap pakai; SEBAGIAN = bisa dibuat dengan templat umum tetapi tanpa bawaan jenis atau dengan pelanggaran aturan; TIDAK ADA = perlu templat baru; KODE = perlu kode renderer; LUAR = di luar lingkup Studio v2.1.

| # | Jenis (kode) | ID | EN | Alasan |
|---|---|---|---|---|
| 1 | Proposal teknis (PT) | SEBAGIAN | SEBAGIAN | `datum-gsp` umum: kode bawaan KT, kicker kosong; EN tambah celah 4.2 (angka, kolom lembar kendali, pita segel, cap terbit) |
| 2 | Kajian teknis (KT) | ADA | SEBAGIAN | `datum-gsp` bawaan KT/TERBIT (`structure.ts:94-99`; `docs/STUDIO-AGENT-GUIDE.md:193`); EN: celah 4.2 |
| 3 | Laporan kegiatan / teknis (LAP) | SEBAGIAN | SEBAGIAN | LAP tidak ada di daftar bawaan `doc.typeCode` (`governance-language.ts:114`), jadi `meta.typeCode` LAP di `datum-gsp` kemungkinan ditolak (hipotesis, perlu dry-run R08). `laporan-kerja-agen` memakai LAP tetapi untuk laporan kerja agen internal, bukan laporan klien |
| 4 | Verifikasi / uji / forensik (VER) | TIDAK ADA | TIDAK ADA | VER tidak ada di daftar bawaan (hipotesis penolakan sama) |
| 5 | Standar / SOP / manual (STD) | SEBAGIAN | SEBAGIAN | `datum-manual-000` terbatas ADMIN; `datum-gsp` menerima STD tetapi tanpa slot indeks aturan |
| 6 | Nota internal (NOT, tier NOTA) | SEBAGIAN | SEBAGIAN | Tier NOTA berjalan di `datum-gsp`, tetapi NOT tidak ada di daftar bawaan (hipotesis penolakan) |
| 7 | RAB / BoQ, ringkasan DOCX (RAB) | SEBAGIAN | SEBAGIAN (berisiko) | Kode RAB diterima; tabel keuangan ada. EN melanggar konvensi IDR dan pemisah angka (`format.ts:13-16`) |
| 8 | RAB / BoQ workbook | LUAR | LUAR | D-05 (`sections.ts:7`) |
| 9 | Surat dinas / pengantar ke instansi (SP), Arial 12 hitam | KODE | KODE | EN 3.6 juga mewajibkan Arial 12 hitam untuk surat ke instansi Indonesia dalam bahasa apa pun (`EN:736-740`); tidak ada renderer surat |
| 10 | Surat penawaran harga (SPH) | KODE | KODE | Bentuk surat; sama dengan baris 9 |
| 11 | Surat / surel ke pihak asing, kop marun | tidak diatur ID | KODE (surel: LUAR) | `EN:742-829, 2649`; ID 8.4 hanya mengatur surat ke instansi (`ID:2567`) |
| 12 | Berita acara (BA) | tanpa dasar bentuk | tanpa dasar bentuk | Hanya kode jenis di Tabel 3.1 |
| 13 | NDA | tanpa dasar bentuk; kode tidak ada di enum | sama | `governance-language.ts:116` |
| 14 | Matriks / register (MAT) | tanpa dasar bentuk | sama | Hanya kode jenis |
| 15 | Model diserahkan (MOD) | LUAR | LUAR | Bukan dokumen |
| 16 | Dek / command brief (DEK) | LUAR | LUAR | `sections.ts:593-615` |
| 17 | Paparan lisan | LUAR | LUAR | Naskah lisan |
| 18 | Chat / pesan singkat | LUAR | LUAR | Kanal tanpa berkas; Bab 12 |
| 19 | Laporan kerja agen (LAP, NOTA) | ADA | tidak diatur manual | `laporan-kerja-agen`; jenis internal Studio, bukan jenis manual |
| 20 | Pasangan dwibahasa (satu nomor, dua bahasa) | SEBAGIAN | SEBAGIAN | Dua dokumen bisa menampilkan nomor tampilan yang sama (`docs/STUDIO-MCP.md:486-487`), tetapi tidak ada tautan pasangan atau pernyataan versi berlaku |

## 6. Jawaban 4: usulan konkret

### 6.1 Prinsip usulan

1. Semua templat baru diturunkan dari preset `datum-gsp-preset` (versi terbaru disematkan), memakai kerangka 7 slot yang sama seperti `datum-gsp`, dan hanya menambah lapis kecil parameter jenis/bahasa. Cara ini sama dengan templat kontrak (`prisma/seed-studio.ts:1248-1308`) dan tidak menyentuh preset atau templat lama.
2. Satu flag seed baru (usulan nama `--doc-type-templates`) yang meniru penjaga `--contract-templates`: satu transaksi, `--dry-run`, snapshot templat lain harus tidak berubah, hasil wajib `restricted=false` (`prisma/seed-studio.ts:1310-1368`).
3. Perbaikan kode kecil (fase 0) dikerjakan lebih dulu, karena tanpa itu templat EN tetap mencetak label dan angka Indonesia.

### 6.2 Fase 0: prasyarat kode (kecil, wajib sebelum templat EN dan sebelum menambah templat `datum-*`)

| ID | Perubahan | Berkas | Perkiraan |
|---|---|---|---|
| P0-1 | Perilaku `template: "latest"` dikunci: pilihan (a) alias tetap ke `datum-gsp`, (b) env/konfigurasi slug bawaan, atau (c) hanya templat bertanda bawaan. Uji `implw2-client.test.ts` menetapkan `latest = datum-gsp` | `scripts/studio/mcp/write-client-run.ts:24-35`; `tests/unit/studio/mcp/implw2-client.test.ts:96-100, 211` | 0,5 hari |
| P0-2 | Tambah `NDA` ke enum `doc.typeCode` tanpa mengubah nilai bawaan (mengubah bawaan akan memicu selisih sinkron kanonik, `prisma/seed-studio.ts:1370-1384`) | `src/lib/studio/params/governance-language.ts:114-120` | 0,25 hari |
| P0-3 | Kepala kolom lembar kendali mengikuti bahasa dokumen, atau dibaca dari parameter `controlSheet.*.columns` | `src/lib/studio/services/compose/front.ts:29-32, 78-88` (+ padanan HTML) | 0,5 hari |
| P0-4 | Label blok kendali EN "Prepared by" untuk PENYUSUN | `src/lib/studio/engine/front/texts.ts:123` | 0,1 hari |
| P0-5 | Konvensi angka EN: pemisah "," dan ".", satuan mata uang IDR, untuk `meta.language = EN` saja; dokumen ID harus tetap byte-identik | `src/lib/studio/engine/bind/format.ts:13-16` dan pemanggilnya; lint angka terkait | 1,5-2 hari |
| P0-6 (opsional) | Skema klasifikasi penerima asing + "GSP COMMERCIAL IN CONFIDENCE", atau skema klasifikasi per dokumen (kini kelas K di templat) | `src/lib/studio/params/apparatus.ts:261-283`; `checks-a.ts:399-421` | 1-2 hari |

### 6.3 Fase 1: templat data saja (lewat seed)

Lapis bersama setiap templat baru: `preset = datum-gsp-preset vN`, esensial global dibaca dari preset (seperti SR-36), `doc.typeCode` = daftar Rev A tanpa DS (PT, KT, RAB, SPH, SP, BA, DEK, LAP, MAT, STD, NOT, MOD, VER, + NDA setelah P0-2).

| # | Slug usulan | Nama | Bahasa | Dasar | Yang berubah | Perkiraan |
|---|---|---|---|---|---|---|
| T1 | `datum-proposal-teknis` | Proposal Teknis | ID | `datum-gsp-preset` + kerangka 7 slot | `doc.defaultTypeCode` PT; `doc.defaultTier` SERAH (lihat Q4); `cover.kicker.text` "PROPOSAL TEKNIS" | 2 jam |
| T2 | `datum-kajian-teknis` | Kajian Teknis | ID | sama | KT; TERBIT; kicker "KAJIAN TEKNIS" | 2 jam |
| T3 | `datum-laporan` | Laporan | ID | sama | LAP; TERBIT; kicker "LAPORAN" | 2 jam |
| T4 | `datum-laporan-verifikasi` | Laporan Verifikasi dan Uji | ID | sama | VER; TERBIT; kicker "LAPORAN VERIFIKASI" | 2 jam |
| T5 | `datum-standar` | Standar / SOP | ID | sama, 8 slot | STD; TERBIT; kicker "STANDAR"; tambah slot `ruleIndex` (AUTO) sebelum lampiran (jenis slot sah, `src/lib/studio/registry/slots.ts:29-40, 92`) | 3 jam |
| T6 | `datum-nota` | Nota Internal | ID | sama | NOT; NOTA (slot 1-4 tidak aktif) | 1 jam |
| T7 | `datum-ringkasan-rab` (opsional, Q10) | Ringkasan RAB | ID | sama | RAB; SERAH; kicker "RENCANA ANGGARAN BIAYA" | 2 jam |
| T1E-T7E | `<slug>-en` (mis. `datum-proposal-teknis-en`) | Technical Proposal, Technical Study, Report, Verification Report, Standard, Internal Note, Cost Estimate Summary | EN | sama | Lapis ID yang sesuai + `doc.language` EN; label slot EN (Cover, Control Sheet, Signatures, Contents, Content, References, Appendices); `wrapper.header` ["CLASSIFICATION · {kelas}", "MASTER COPY · GSP INTERNAL USE"] (`EN:1, 21`); `device.issueStamp.format` "// {YYYYMMDD} {BAHASA} {KELAS} -- ISSUE {n}" (`EN:20`); `render.toc.title` "Contents" (`EN:77`); kicker EN | 1-2 jam per templat, setelah P0-3..P0-5 |
| Seed | flag `--doc-type-templates` + penjaga + uji | - | - | - | spesifikasi templat sebagai data di seed, penjaga snapshot templat lain, dry-run, uji determinisme DB segar | 1-1,5 hari |

Bagian yang murni data (tanpa kode renderer): seluruh T1-T7 dan lapis EN. Bagian yang tetap kode: flag seed itu sendiri (skrip), P0-1..P0-6.

Alternatif ramping (Q2): satu templat umum EN `datum-gsp-en` saja, jenis dokumen dibedakan lewat `meta.typeCode` dan `cover.tagline` per dokumen. Lebih sedikit templat untuk dirawat, tetapi agen harus mengisi kode jenis dan kicker sendiri.

### 6.4 Fase 2: perlu kode renderer

| # | Usulan | Isi | Perkiraan |
|---|---|---|---|
| L1 | `surat-dinas` (ID; dipakai juga untuk surat EN ke instansi Indonesia) | Jenis slot/section `letter` renderable dengan payload 16 unsur Tabel 3.4; Arial 12 hitam; margin PerANRI/Perkap dipilih per penerima; nomor halaman tengah atas mulai halaman 2; klasifikasi tengah atas dan bawah; tanpa pita segel, blok register, dan grid DATUM; pengecualian lint fon (Arial dilarang sebagai fon badan, `src/lib/studio/params/color-type.ts:156`) | 5-8 hari bersama L2 |
| L2 | `letter-foreign-en` (EN) | Payload 13 bagian Tabel 3.3 EN; kop marun Tabel 8.1, logo hitam sekali, Plex Serif 9,5 pt, penandaan hitam tengah atas dan bawah | termasuk di atas |
| L3 | Surat penawaran harga (SPH) | Varian L1 dengan lampiran rekapitulasi | 1 hari setelah L1 |

### 6.5 Risiko

| # | Risiko | Bukti | Dampak | Mitigasi |
|---|---|---|---|---|
| R1 | `template: "latest"` berpindah ke templat baru | `resolveTemplate` memilih slug berawalan `datum-` bukan preset, bukan terbatas, bukan kontrak, bukan arsip, urut `updatedAt` turun (`scripts/studio/mcp/write-client-run.ts:24-31`) | Hermes yang memakai `latest` tiba-tiba menulis di, mis., templat EN atau nota. Bahkan hari ini pilihan antara `datum-gsp` dan `datum-kanonik` bergantung pada `updatedAt` | P0-1 sebelum seed apa pun; atau slug baru tanpa awalan `datum-` (Q3) |
| R2 | Metode salin seed produksi tidak bisa diulang apa adanya | Deploy memakai `pg_restore --data-only` ke 21 tabel Studio yang kosong (`deploy/01_production_deploy_plan.md:159`; log `deploy/04_deploy_execution_log.md:144`). Kini tabel produksi berisi 7 templat dan mungkin dokumen | Restore penuh akan bentrok kunci atau menimpa | Rollout terarah, bagian 6.6 |
| R3 | Angka EN salah format | `format.ts:13-16` | Pelanggaran 6.7/6.8 di proposal dan RAB EN | P0-5 sebelum templat EN dirilis |
| R4 | Templat bertambah, perawatan bertambah | Setiap perubahan preset GSP butuh versi baru tiap templat turunan agar ikut (dokumen mematok versi, `docs/STUDIO-AGENT-GUIDE.md:209-210`) | Templat turunan tertinggal | Flag seed yang memperbarui semua turunan dalam satu transaksi; atau alternatif ramping |
| R5 | Daftar kode jenis tidak sesuai Rev A | `governance-language.ts:114-120` | DS masih diterima; LAP/NOT/VER kemungkinan ditolak di `datum-gsp` (hipotesis) | Daftar Rev A di templat baru; Q8 untuk templat lama |
| R6 | Skema klasifikasi tingkat templat | `classification.recipientScheme` kelas K, bawaan `anri` (`apparatus.ts:261-264`); non-admin hanya boleh override kelas B (`src/lib/studio/contract/types/doc.ts:27`) | Dokumen Kemhan bertanda TERBATAS lolos lint (pelanggaran DT-28a tidak tertangkap) | P0-6 atau varian skema (Q6) |
| R7 | Basis token berbeda | Rev A: tokens.json v1.9 Rev O (`ID:2436`); Studio v2.0.0 (`research/01:20`) | Nilai bentuk bisa menyimpang tanpa terdeteksi | Audit token terpisah (Q12) |
| R8 | Ketidakkonsistenan manual | Medan blok kendali `ID:2486` vs `ID:15-18`; penomoran lembar `ID:2510` vs `EN:2582` | Templat mengikuti satu tafsir dan dinilai salah oleh tafsir lain | Keputusan pengguna (Q7) |
| R9 | Fon Arial pada surat | DT-09 wajib fon tertanam (`ID:2616-2621`); aset Studio hanya Plex dan DejaVu (`src/lib/studio/assets/fonts/`) | Lisensi dan penanaman Arial belum diketahui | Diputuskan sebelum fase 2 |
| R10 | Panduan agen tertinggal | Tabel templat panduan hanya 3 slug (`docs/STUDIO-AGENT-GUIDE.md:191-195`); deskripsi UI bawaan hanya 7 slug (`src/components/studio/shared/labels.ts:314-322`) | Agen tidak tahu slug baru | Perbarui §3 panduan, `docs/STUDIO-MCP.md`, deskripsi templat |

### 6.6 Rollout

DEV (`gsp_agent_hq_v21`):
1. Kode fase 0 masuk, uji unit lulus (termasuk `latest` tetap `datum-gsp`).
2. `npx tsx prisma/seed-studio.ts --doc-type-templates --dry-run`, lalu tanpa `--dry-run`, lalu jalan ulang harus `unchanged` (pola `uji-run.mjs fresh-seed`, `deploy/01_production_deploy_plan.md:135`).
3. Per templat: dokumen sampel ID dan EN lewat R08 (dry-run) lalu render DOCX, PDF, HTML di DEV 9021; periksa lint dan teks Indonesia yang tersisa di dokumen EN.
4. Smoke MCP: `studio_templates_list`, `studio_write` dengan slug eksplisit, dan `studio_write` dengan `latest` (harus tetap `datum-gsp`).

Produksi (cara seed-copy §4 diadaptasi, karena tabel produksi tidak lagi kosong):
1. Deploy kode fase 0 dengan metode geser port yang sama (§5 Fase 0-4) sebelum data apa pun.
2. `pg_dump` produksi segar, pulihkan ke `gsp_agent_hq_v21_seedtest` (nama yang diizinkan penjaga seed, `prisma/seed-studio.ts:124, 189-193`), lalu jalankan `--doc-type-templates` di klon itu. Jangan memakai baris dari DB DEV: `baseVersionId` versi baru merujuk ID versi preset, dan ID itu hanya sama di klon produksi (ID cuid, `deploy/01_production_deploy_plan.md:159`).
3. Ekspor hanya baris baru: `StudioTemplate` (slug baru), `StudioTemplateVersion`, `StudioTemplateSlot`, `StudioTemplateSlotParam` milik templat itu, misalnya dengan `\copy (select ...)` per tabel. Pastikan tidak ada baris `StudioSectionType` yang berubah.
4. Impor ke produksi dalam satu transaksi dengan cek awal "slug belum ada".
5. Verifikasi: 7 templat lama punya `latestVersionNo`, `paramsSha256`, dan `updatedAt` yang sama sebelum dan sesudah; jumlah baris bertambah tepat sebanyak yang diekspor; `latest` tetap `datum-gsp`.
6. Alternatif: opsi A rencana deploy (opt-in env + `--confirm-db` pada penjaga seed, `deploy/01_production_deploy_plan.md:160`). Ini menyentuh penjaga keamanan, jadi perlu review.

## 7. Celah data analisis ini

- Gambar manual (Gambar 2.1, 3.2, 8.1, 8.2, 8.6, 8.7) tidak dilihat karena PDF tidak bisa dirender; isinya disimpulkan dari caption dan prosa.
- Tidak ada perbandingan nilai per nilai antara tokens.json v1.9 Rev O dan v2.0.0.
- Penolakan LAP/NOT/VER di `datum-gsp` belum dibuktikan dengan dry-run R08 (R08 tidak menulis, tetapi tidak dijalankan di analisis ini). Versi preset `datum-gsp-preset` produksi belum dibaca langsung untuk memastikan nilai `doc.typeCode` efektifnya.
- Nama peran tanda tangan EN tidak ditemukan di manual EN (hanya "three signature columns", `EN:2570`).

## 8. Requirements, Files, Implementation Order, Acceptance Criteria, Recommendations

### 8.1 Requirements (turunan, untuk pm-planner)

- RQ-1: Setiap jenis dokumen DATUM yang diatur Rev A dan bisa dirender DOCX punya templat ID dan EN (atau keputusan tertulis bahwa templat umum cukup).
- RQ-2: Dokumen EN tidak memuat teks pembungkus Indonesia, dan angka mengikuti 6.7/6.8.
- RQ-3: Penambahan templat tidak mengubah apa yang didapat Hermes untuk `template: "latest"`.
- RQ-4: Templat lama dan dokumen yang sudah ada tidak berubah (versi dipatok).

### 8.2 Berkas yang terlibat

`prisma/seed-studio.ts`; `scripts/studio/mcp/write-client-run.ts`; `src/lib/studio/params/governance-language.ts`; `src/lib/studio/services/compose/front.ts`; `src/lib/studio/engine/front/texts.ts`; `src/lib/studio/engine/bind/format.ts`; `src/lib/studio/params/apparatus.ts` (opsional); `src/components/studio/shared/labels.ts`; `docs/STUDIO-AGENT-GUIDE.md` §3; `docs/STUDIO-MCP.md`; uji `tests/unit/studio/mcp/implw2-client.test.ts` dan uji seed.

### 8.3 Urutan implementasi

P0-1, lalu P0-2 sampai P0-5 (P0-6 sesuai Q6), lalu flag seed dan T1-T7 ID, lalu T1E-T7E, lalu dokumentasi agen, lalu rollout DEV, lalu produksi. Fase 2 (surat) terpisah dan bergantung pada Q1 dan R9.

### 8.4 Kriteria terima

- AC-1: Seed `--doc-type-templates` jalan dua kali; jalan kedua `unchanged`; `--dry-run` = 0 tulis.
- AC-2: Setiap templat baru `restricted=false`, `contractKind` null, versi dasarnya = versi terbaru `datum-gsp-preset`.
- AC-3: Snapshot 7 templat lama identik sebelum dan sesudah (slug, `latestVersionNo`, `updatedAt`, `paramsSha256`, `skeletonSha256`, jumlah versi).
- AC-4: `resolveTemplate("latest")` = `datum-gsp` setelah semua templat baru ada (uji unit + smoke MCP).
- AC-5: Dokumen sampel per templat lolos R08 dengan `meta.typeCode` = kode bawaannya, dan render DOCX/PDF/HTML berhasil.
- AC-6: Render EN tidak memuat "Lembar Kendali", "KLASIFIKASI", "SALINAN INDUK", "TERBITAN", "Tanggal", "Uraian", "Oleh", "Pemegang", "LEMBAR", "Rp"; angka terikat register tampil seperti 1,250,000.5 dengan IDR.
- AC-7: Dokumen ID yang sudah ada dirender byte-identik sebelum dan sesudah perubahan fase 0 (uji paritas yang ada).

### 8.5 Rekomendasi

1. Putuskan Q1-Q3 dulu; tanpa P0-1, jangan menambah templat `datum-*` di DEV maupun produksi.
2. Kerjakan fase 0 dan templat ID (T1-T6) dalam satu putaran; templat EN menyusul segera setelah P0-3..P0-5 lulus.
3. Tunda surat (fase 2) ke putaran tersendiri dengan keputusan fon Arial.
4. Catat keputusan di `docs/2026-10-22_doc_artifact_studio/decisions/decisions.md` (milik controller).

Draf rencana (`masterplan/02_plan_draft.md`) tidak dibuat: tugas ini hanya analisis, dan lingkup implementasi bergantung pada jawaban bagian 9.

## 9. Jawaban 5: pertanyaan untuk pengguna

| # | Pertanyaan | Pilihan |
|---|---|---|
| Q1 | Jenis mana yang masuk putaran ini? | (a) T1-T6 ID + EN saja (data, ditambah fase 0); (b) ditambah T7 ringkasan RAB; (c) ditambah surat (fase 2, kode renderer) |
| Q2 | Satu templat per jenis per bahasa (sekitar 12-14 templat) atau satu templat umum EN `datum-gsp-en`? | per jenis / umum / campuran |
| Q3 | Perilaku `latest` dan pola slug | kunci `latest` ke `datum-gsp` (disarankan) / slug baru tanpa awalan `datum-` / biarkan berpindah |
| Q4 | Tier bawaan per jenis | Proposal SERAH (tender) atau TERBIT; Kajian dan Laporan TERBIT; Nota NOTA |
| Q5 | Setujui perubahan pemformat angka untuk dokumen EN (dokumen ID tidak berubah)? | ya / tidak |
| Q6 | Skema klasifikasi penerima (Kemhan/TNI, Polri, ANRI, asing) | medan per dokumen (kode) / varian templat per skema / tetap bawaan ANRI |
| Q7 | Tafsir yang dipakai saat manual tidak konsisten | Blok kendali sampul: medan prosa 8.2 (halaman, datum geodetik, verifikasi) atau medan sampul manual (tier, dasar, bahasa). Penomoran lembar: dari sampul (praktik, EN) atau dari Bab 1 (prosa ID; menurut 1.7 EN edisi ID menang) |
| Q8 | Pensiunkan DS di `datum-gsp` dan `datum-kanonik` lewat versi preset baru, atau hanya di templat baru? | semua / hanya baru |
| Q9 | Cara rollout produksi | salin baris terarah dari klon produksi (disarankan) / opsi A opt-in penjaga seed |
| Q10 | Perlu ringkasan RAB DOCX sekarang, atau tunggu dukungan workbook? | sekarang / tunda |
| Q11 | Teks peran tanda tangan EN (tidak ada di manual) | mis. Prepared / Checked / Approved, atau dari pengguna |
| Q12 | Lakukan audit token terpisah (tokens.json v1.9 Rev O vs v2.0.0 yang dipakai Studio)? | ya / tidak |
