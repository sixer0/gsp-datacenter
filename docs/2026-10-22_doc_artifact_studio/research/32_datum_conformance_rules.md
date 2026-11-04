---
type: requirements
confidence: high (sitasi manual dan kode diperiksa); medium (toleransi geometri dan nilai yang akan dikalibrasi S25)
subject: Katalog butir Manual Rev A untuk pengukur konformitas DATUM (S02)
author_agent: data-analyst
date: 2026-11-04
status: complete (baca-saja)
blueprint_row: S02 (`identification/02_structured_datum_rev_a.md:118`)
depends_on: research/31_datum_rev_a_names_register.md (S01; semua nilai harapan per bahasa/jenis diambil dari sana)
binding: D-590, D-592 (U1), D-593 (U2), D-594 (U3), D-595 (U4)
consumers: S20 (harness, indeks aturan), S21, S22, S23, S24, S25, S33, S36, S45, S52
counts: 76 terukur (4 kritis) + 39 cakupan-saja (4 sudah ditandai di luar lingkup) + 7 kelompok di luar lingkup + 11 detektor bentrok
---

# Katalog aturan konformitas DATUM Rev A (S02)

## 0. Konvensi

### 0.1 Notasi

- `ID:n` / `EN:n` = baris manual (`C:/Users/TRIAL/gsp-backups/datum-revA-20261104/manual_id.txt` / `manual_en.txt`); `file:n` = path repo; `31 §x` = `research/31_datum_rev_a_names_register.md`.
- Mode: **TERUKUR** = dihitung skrip dari DOCX (atau dari tabel spec, bila disebut) dan masuk skor U1; **CAKUPAN** = masuk matriks cakupan U2 (S33), tidak dihitung skrip.
- Berlaku: Tier `N`=NOTA, `T`=TERBIT, `S`=SERAH; Bahasa `ID`, `EN`, `ID+EN`; Jenis `semua` = PT, LAP, VER, STD, NOT (dan `datum-gsp` untuk kalibrasi S25).
- Kritis: `K` = salah satu dari 4 aturan kritis (D-592); harus lolos, tidak boleh N/A.

### 0.2 Masukan harness per pasangan

Harness menerima konteks pasangan dari 31 §1, bukan dari isi DOCX: `slug`, `lang`, `expectedTypeCode`, `expectedTier`, `expectedKicker`, ditambah bendera sampel `producedBy` (`mcp` atau `r08`), `agentRevisionText` (ada/tidak), `hasCopyControl` (ada/tidak). Untuk kalibrasi `datum-gsp` ID (S25): KT, TERBIT, kicker `""` (`src/lib/studio/params/structure.ts:94-99`; `src/lib/studio/params/page.ts:414`).

Tier efektif = `expectedTier` (sampel konformitas tidak menimpa `meta.tier`). Keberlakuan aturan dievaluasi terhadap tier efektif itu.

### 0.3 Status hasil

`PASS`, `FAIL`, `NA` (dengan alasan), `UNEXERCISED` (bukti yang dibutuhkan tidak ada). Untuk aturan kritis, `NA` tidak sah dan `UNEXERCISED` = `FAIL` (31 §8). Skor = PASS / (PASS + FAIL + UNEXERCISED) atas aturan TERUKUR yang berlaku; ambang >= 85,0 % tanpa pembulatan ke atas (31 §8). Setiap hasil mencatat kode, status, bagian OOXML, lokasi, dan nilai teramati.

### 0.4 Pembaca DOCX (R0, mengikat S20-S23)

| Unsur | Ketentuan |
|---|---|
| Bagian | `word/document.xml`, `word/header*.xml`, `word/footer*.xml`, `word/styles.xml`, `word/settings.xml`, `word/fontTable.xml`, `word/_rels/*.rels`, `word/fonts/*`, `word/theme/theme1.xml`. `word/media/*` tidak dibaca sebagai teks, kecuali GF-12 (SVG). |
| Seksi | Body dipotong pada `w:pPr/w:sectPr` (menutup seksi) dan `w:body/w:sectPr` (seksi terakhir). Header/footer seksi = `w:headerReference`/`w:footerReference` `w:type="default"` (dan `first` bila `w:titlePg`) lewat `word/_rels/document.xml.rels`; referensi absen = warisan seksi sebelumnya. |
| Kelas seksi | SAMPUL = seksi pertama yang memuat tabel pita segel. PEMBUNGKUS = seksi sebelum seksi interior pertama; header-nya tanpa teks (`src/lib/studio/engine/docx/package/section.ts:168`). LEMBAR KENDALI = seksi pembungkus dengan kicker 31 §4.2. DAFTAR ISI = seksi pembungkus yang memuat medan `TOC`. INTERIOR = seksi yang footer default-nya memuat medan `PAGE`. |
| Tabel pita segel | `w:tbl` 1 baris x 2 sel, `w:tcPr/w:shd/@w:fill` = 6E1420 (toleransi warna di bawah) (`src/lib/studio/engine/docx/wrapper/render.ts:329-347`). |
| Tabel register | `w:tbl` di footer, 1 baris x 4 sel (`src/lib/studio/engine/docx/package/header-footer.ts:61`). |
| Medan | `w:fldSimple/@w:instr` atau `w:instrText` di antara `w:fldChar` begin/separate. PAGE/NUMPAGES ditulis `w:fldSimple` (`src/lib/studio/engine/docx/package/xml.ts:369-390`); TOC = medan kompleks `TOC \o "<r>" \h \z \u` (`src/lib/studio/engine/docx/wrapper/pages.ts:423`). Instruksi bukan teks. |
| Teks sumber | Gabungan `w:t` per paragraf (termasuk di dalam `w:hyperlink`, `w:fldSimple`, `w:sdtContent`, dan teks hasil medan), `w:tab` = `\t`, `w:br` = `\n`, `w:noBreakHyphen` = `-`. |
| Teks tampak | Teks sumber dikapitalkan bila `w:caps` efektif aktif. |
| Format efektif | rPr langsung, lalu `w:rStyle`, lalu rPr gaya paragraf, lalu rantai `w:basedOn`, lalu `w:docDefaults`. Sama untuk pPr. |
| Satuan | 1 mm = 56,693 tw; `w:sz` run = setengah poin; `w:sz` garis = per 1/8 poin (1 mm = 22,68); 1 mm = 36.000 EMU. |
| Warna | Hex tanpa beda besar-kecil, toleransi +-3 per kanal (DT-13d `ID:2591-2594`; `EN:2663-2666`). `auto` atau tanpa warna = gagal bila warna diwajibkan. |
| Fon | Seri: nama memuat `IBM Plex Serif`; Cond: memuat `Condensed`; Mono: memuat `IBM Plex Mono` (empat wajah Plex `ID:2601`, `ID:2607`; `EN:2670-2673`). Nama tema (`w:asciiTheme`) diresolusi lewat `theme1.xml`. |
| Lokasi teks pembungkus (WL) | (1) semua bagian header dan footer; (2) di seksi pembungkus: tabel pita segel, paragraf kicker, sel label blok kendali (sel ke-1 dan ke-3 tiap baris), paragraf judul blok lembar kendali, baris kepala tabel lembar kendali, sel peran tanda tangan, kolofon, kicker daftar isi; (3) di seksi interior: paragraf kicker bab dan run label keterangan/sumber/provenans. Paragraf isi agen dan sel nilai tidak termasuk. Id gaya penanda ditentukan dari DOCX kalibrasi S25. |

Normalisasi pola: NBSP diganti spasi hanya bila aturan menyebutnya; spasi ujung dipangkas.

## 1. Ringkasan

| Keluarga | Terukur | Kritis | Cakupan-saja |
|---|---|---|---|
| Kritis lintas keluarga (CR) | 4 | 4 | 0 |
| Sampul §8.2 (CV) | 16 | 0 | 5 |
| Lembar kendali (CS) | 6 | 0 | 5 |
| Running head dan blok register (RH, RB) | 11 | 0 | 1 |
| Pita segel dan cap terbit (SB, IS) | 6 | 0 | 0 |
| Geometri dan fon (GF, DV) | 15 | 0 | 10 |
| §3.4 penomoran dan kode jenis (NU) | 4 | 0 | 3 |
| Perilaku tier (TR) | 5 | 0 | 3 |
| §6.7/§6.8 konvensi angka (NC) | 1 | 0 | 4 |
| AC-6 (AC6) | 1 | 0 | 0 |
| Label bahasa (LB) | 7 | 0 | 4 |
| Klasifikasi dan indeks aturan (CL, ST) | 0 | 0 | 4 |
| **Jumlah** | **76** | **4** | **39** |

Detektor bentrok (dihitung sebagai bentrok, bukan skor): 5 teks pembungkus (X-01..X-05) + 6 geometri PDF (G-01..G-06), §13. Kelompok di luar lingkup (keluar dari penyebut, beralasan): OS-01..OS-07, §15.

Penyebut maksimum terukur per pasangan (sebelum NA bersyarat): T/S ID 72, T/S EN 74, NOTA ID 35, NOTA EN 36 (§16).

## 2. Aturan kritis

| Kode | Butir | Sitasi | Rumah | Berlaku | K |
|---|---|---|---|---|---|
| CR-1 | Penandaan klasifikasi | DT-28a `ID:566-570`, `EN:590-595`; DT-28c `ID:609-617`, `EN:645-652`; DT-28e `ID:625-629`, `EN:660-661`; EG-50 `EN:627-634`; skema ANRI tetap (D-590) | SB, RH, RB | N T S; ID+EN; semua | K |
| CR-2 | Pola nomor dokumen dan daftar kode tertutup tanpa DS | DT-04b `ID:634-664`, `EN:675-683`; DT-04a `ID:508-513`, `EN:535-541` | NU | N T S; ID+EN; semua | K |
| CR-3 | Konvensi angka per bahasa | DT-30f `ID:1929-1934`, `EN:1929-1936`; DT-30g `ID:1940-1945`, `EN:2022-2030`; `ID:1998-2006`; `EN:2076-2082`; PK-13 `EN:422-427` | NC | N T S; ID+EN; semua | K |
| CR-4 | Bahasa teks pembungkus | RQ-2 dan AC-6 (`02_structured:51, 67`); 31 §6 | AC6, LB | N T S; ID+EN; semua | K |

**CR-1 pemeriksaan**
1. Nilai acuan K = teks tampak run kanan header default seksi interior pertama (`header-footer.ts:133-141`).
2. K (spasi dinormalkan, tanpa beda besar-kecil) adalah salah satu `BIASA`, `TERBATAS`, `RAHASIA`, `SANGAT RAHASIA` (skema ANRI, `src/lib/studio/params/apparatus.ts:277`).
3. K tampil kapital: teks sumber sudah kapital atau run ber-`w:caps` (`ID:611`; `EN:647`).
4. K identik di: run kanan header setiap seksi interior; sel ke-4 tabel register setiap footer interior (`ID:2728` "sel klasifikasi selalu terakhir"; `EN:2787`); untuk T/S juga sel kiri pita segel sesudah awalan `KLASIFIKASI · ` (ID) atau `CLASSIFICATION · ` (EN) (31 §4.4).
5. Tidak ada padanan Inggris di ketiga lokasi itu: bukan `RESTRICTED`, `CONFIDENTIAL`, `SECRET`, `TOP SECRET`, `OFFICIAL`, `UNCLASSIFIED` (EG-50 `EN:627-634`), dan bukan derajat kecepatan `SEGERA`, `SANGAT SEGERA`, `KILAT`, `URGENT` (DT-28e `ID:625-627`; `EN:660-661`).
6. Warna klasifikasi dinilai di GF-13 (tidak kritis).

**CR-2 pemeriksaan**
1. Ambil nomor N dari: sel ke-1 tabel register setiap footer interior, sesudah awalan `<org>` + ` · ` (NBSP dinormalkan ke spasi; `<org>` bawaan `GSP`, `header-footer.ts:271`); untuk T/S juga nilai di sebelah label `Nomor dokumen` / `Document number` di blok kendali sampul (`header-footer.ts:217-237`).
2. N cocok `^(?:\d{3,}|XXX)/GSP/(PT|KT|RAB|SPH|SP|BA|NDA|DEK|LAP|MAT|STD|NOT|MOD|VER)/(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)/(\d{4})$`. Urut minimal 3 digit (`src/lib/studio/services/ingest/repository.ts:54`; contoh `005`, `012` di `ID:636, 663`); `XXX` sah (DT-04a).
3. Tidak ada awalan klasifikasi (`SR/`, `R/`, `T/`, `B/`) dan tidak ada kode `DS` (contoh salah `R/012/GSP/DS/X/2026`, `ID:663`).
4. N sama di semua lokasi.
5. Kode di N = `expectedTypeCode` (sampel tidak mengirim `meta.typeCode` maupun `number`, 31 §9 butir 7).

**CR-3 pemeriksaan**
1. Pindai token pada teks sumber `document.xml`, `header*.xml`, `footer*.xml` (media dikecualikan, Q-C D-596) setiap sampel dan fiksur B-FIX (§10), sesudah membuang: nomor dokumen yang cocok CR-2, tanggal `\d{2}-[IVX]+-\d{4}` dan `\d{4}-\d{2}-\d{2}`, cap terbit `// \d{8}`, penanda versi `v\d+(\.\d+)+`, dan alamat IP `\d{1,3}(\.\d{1,3}){3}`.
2. EN gagal bila ada: `\bRp\b`; `(?<![\d.,])\d{1,3}(\.\d{3}){2,}(?!\d)`; `(?<![\d.,])\d{1,3}\.\d{3},\d+`; koma desimal `(?<![\d.,])\d+,\d{1,2}(?![\d])`; `\bIDR(?=\d)` (`EN:2030`).
3. ID gagal bila ada: `\bRp(?=\d)` ("setiap Rp diikuti spasi", `ID:1932-1934`); `(?<![\d.,])\d{1,3}(,\d{3}){2,}(?!\d)`; `(?<![\d.,])\d{1,3},\d{3}\.\d+`; `\bIDR\b` kecuali dokumen memuat baris `This annex uses English conventions` (`ID:2005-2006`).
4. Fiksur B-FIX pasangan itu memuat persis string harapan §10 untuk bahasanya.
5. Tanpa fiksur B-FIX atau tanpa string harapannya = `UNEXERCISED` = `FAIL` (31 F-5).

**CR-4 pemeriksaan**
1. EN: nol token daftar inti 31 §6 di seluruh teks (`document.xml`, header, footer) dengan semantik 31 §6 (kata utuh, peka huruf, bentuk sumber dan bentuk tampak).
2. EN, penanda wajib ada: semua tier = `SHEET` dan `OF` di sel ke-3 register; T/S tambahan = `CLASSIFICATION · ` di pita segel kiri, `MASTER COPY · GSP INTERNAL USE` di pita segel kanan (NA bila `hasCopyControl`), ` -- ISSUE ` di cap terbit, kicker `Control Sheet`, judul daftar isi `Contents`, label blok kendali `Prepared by`.
3. ID: nol token daftar cermin 31 §6, hanya di WL (§0.4).
4. ID, penanda wajib ada: semua tier = `LEMBAR` dan `DARI` di sel ke-3 register; T/S tambahan = `KLASIFIKASI · `, `SALINAN INDUK · PENGGUNAAN INTERNAL GSP` (NA bila `hasCopyControl`), ` -- TERBITAN `, kicker `Lembar Kendali`, `Daftar Isi`, label `Penyusun`.

## 3. Sampul §8.2 (CV)

Dasar: 12 unsur sampul berurutan (`ID:2468-2485`; `EN:2540-2557`), DT-14 (`ID:2489-2495`; `EN:2561-2567`), DT-13a (`ID:2450-2455`; `EN:2525-2530`). Semua aturan CV berlaku T S, ID+EN, semua jenis; NOTA = NA (tanpa sampul, `prisma/seed-studio.ts:571`).

| Kode | Butir | Sitasi | Mode |
|---|---|---|---|
| CV-01 | Urutan unsur sampul 1-11 | `ID:2474-2484`; `EN:2546-2556` | TERUKUR |
| CV-02 | Pita segel = unsur pertama sampul | `ID:2474`, `ID:2470`; `EN:2546`, `EN:2542` | TERUKUR |
| CV-03 | Lebar logo 44-46 mm | `ID:2475`; `EN:2547` | TERUKUR |
| CV-04 | Logo sekali di seluruh dokumen, hanya di sampul | DT-14 `ID:2492-2495`; DT-13a `ID:2450`; `EN:2525`, `EN:2564-2567`, `EN:2643` | TERUKUR |
| CV-05 | Baris alamat persis, 7 pt | `ID:2476`, `ID:2574`, `ID:2582-2585`; `EN:2548`, `EN:2644`, `EN:2654-2657` | TERUKUR |
| CV-06 | Datum Rule 166 mm di sampul | `ID:2478`; `EN:2550` | TERUKUR |
| CV-07 | Kicker jenis dokumen = kicker pasangan | `ID:2479`; `EN:2551`; 31 §1 | TERUKUR |
| CV-08 | Bentuk kicker: 7,4 pt Cond seal | `ID:2479`, DT-13c `ID:2542-2548`; `EN:2551`, `EN:2610-2618` | TERUKUR |
| CV-09 | Ukuran judul 24-26 pt | `ID:2480`; `EN:2552` | TERUKUR |
| CV-10 | Standfirst 10,5 pt Serif miring (bila ada) | `ID:2481`; `EN:2553` | TERUKUR |
| CV-11 | Baris cakupan 7,6 pt Cond (bila ada) | `ID:2482`; `EN:2554` | TERUKUR |
| CV-12 | Blok kendali 4 x 2, label 6,4 pt Cond, nilai 7,4 pt Mono, garis 0,45 mm | `ID:2483`; `EN:2555` | TERUKUR |
| CV-13 | Medan inti blok kendali (nomor, revisi, penyusun, kustodian, ditujukan kepada) berurutan | `ID:2486`, `ID:15-17`; `EN:2558`, `EN:15-17`; 31 §10 baris 1 | TERUKUR |
| CV-14 | Tiga medan sisa blok kendali (halaman, datum geodetik, verifikasi lawan tier, dasar, bahasa) | `ID:2486-2487` lawan `ID:15-18`; `EN:2558-2559` lawan `EN:15-18` | CAKUPAN |
| CV-15 | Nilai penyusun selalu "Divisi Engineering PT GSP" / "Engineering Division, PT GSP" | `ID:2487`; `EN:2558` | CAKUPAN |
| CV-16 | Kolofon kiri persis | `ID:2575`, `ID:2586`; `EN:2645`, `EN:2658` | TERUKUR |
| CV-17 | String punggung di sampul | `ID:2485`, DT-13f `ID:2718-2723`; `EN:2557`, `EN:2766`, `EN:2778-2783` | TERUKUR |
| CV-18 | Semua unsur sampul rata kiri pada 24 mm | DT-14 `ID:2489-2495`; `EN:2561-2567` | TERUKUR |
| CV-19 | String punggung juga di pembatas dan sampul belakang | DT-13f `ID:2718-2723`; `EN:2766`, `EN:2778-2783` | CAKUPAN |
| CV-20 | Baris judul <= 150 mm | `ID:2480`; `EN:2552` | CAKUPAN (terukur di PDF bila alat S04 ada) |
| CV-21 | Warna logo (ID seal, EN hitam) | `ID:2545-2547`; `EN:2611`, `EN:2643`; 31 §10 baris 6 | CAKUPAN |

**Pemeriksaan TERUKUR**
- CV-01: di seksi SAMPUL kenali, menurut urutan dokumen: E1 tabel pita segel; E2 paragraf bergambar dengan `wp:extent/@cx` 1.584.000-1.656.000 EMU (logo); E3 paragraf yang teksnya = baris alamat 31 §4.6; E5 gambar dengan `cx` = 5.976.000 +-18.000 EMU dan tinggi < 10 mm (Datum Rule, `render.ts:432-438`); E6 paragraf kicker (teks tampak = `expectedKicker` kapital); E7 paragraf judul pertama dengan `w:sz` 48-52; E8 standfirst (miring, Serif); E9 baris cakupan; E10 tabel 4 kolom grid; E11 paragraf atau tabel kolofon (memuat `NIB` dan pola cap terbit IS-01). Indeks kemunculan pertama unsur yang ditemukan harus naik sesuai urutan E1..E11. Wajib ditemukan: E1, E3, E5, E7, E10, E11. E2, E6, E12 dinilai di CV-03/04, CV-07, CV-17; E4 (ruang kosong) tidak diperiksa; string punggung tidak masuk urutan karena berupa bingkai yang dapat ditambatkan di mana saja.
- CV-02: elemen blok pertama seksi SAMPUL = tabel pita segel.
- CV-03: gambar logo `wp:extent/@cx` dalam [1.584.000; 1.656.000] EMU, toleransi +-3.600.
- CV-04: media yang dirujuk gambar logo dirujuk tepat satu kali di `document.xml` dan tidak sekali pun di header/footer; tidak ada gambar lain berukuran logo di seksi selain SAMPUL (`render.ts:134-138`).
- CV-05: teks sumber E3 = string 31 §4.6 persis (`page.ts:401`); run `w:sz` 14 +-1.
- CV-06: E5 ada.
- CV-07: teks tampak E6 = `expectedKicker` (31 §1) tanpa beda besar-kecil, dan tampil kapital (sumber kapital atau `w:caps`). `expectedKicker` kosong (kalibrasi `datum-gsp`) = FAIL karena unsur 6 manual tidak ada.
- CV-08: run E6: `w:sz` 15 +-1 (7,4 pt), fon Cond, warna 6E1420, `w:spacing` 30 +-4 tw (+0,20 em). NA bila E6 tidak ada.
- CV-09: run E7 `w:sz` dalam [48; 52].
- CV-10: bila E8 ada: miring efektif, fon Serif, `w:sz` 21 +-1; selain itu NA.
- CV-11: bila E9 ada: fon Cond, `w:sz` 15 +-1; selain itu NA.
- CV-12: E10 punya 4 `w:gridCol` dan <= 4 baris; run sel label (sel 1 dan 3) `w:sz` 13 +-1 Cond; run sel nilai (sel 2 dan 4) `w:sz` 15 +-1 Mono; garis atas 0,45 mm (`w:sz` 10 +-1) di `w:tblBorders/w:top`, `w:tcBorders/w:top` baris pertama, atau `w:pBdr/w:bottom` paragraf tepat di atasnya.
- CV-13: petakan sel label E10 ke medan lewat 31 §4.1 dan §4.3 (kedua bahasa). Medan nomor, revisi, penyusun wajib ada berurutan; kustodian dan ditujukan kepada, bila ada, menyusul dalam urutan `NOMOR DOKUMEN, REVISI, PENYUSUN, KUSTODIAN, DITUJUKAN KEPADA` (`page.ts:368-377`; blok MCP `scripts/studio/mcp/write-client.ts:142-143` menyisipkan Klasifikasi sesudah penyusun, yang tidak menggagalkan urutan inti).
- CV-16: teks sisi kiri kolofon (sebelum tab atau sel kanan) = `PT GEMILANG SATRIA PERKASA · NIB 9120208940517` (`src/lib/studio/engine/front/texts.ts:202-210`; `page.ts:444-445`).
- CV-17: seksi SAMPUL memuat teks yang cocok dengan string punggung: medan dipisah ` · `, memuat `expectedTypeCode`, kode bahasa (`ID`/`EN`), `REV <rev>`, bulan Romawi, dan tahun (`texts.ts:172-186`; `src/lib/studio/engine/docx/wrapper/render.ts:357-394`).
- CV-18: `w:pgMar/@w:left` seksi SAMPUL = 1361 +-28 tw; tidak ada paragraf sampul ber-`w:jc` `center`; indentasi kiri efektif 0 +-28 tw untuk semua paragraf sampul kecuali bingkai string punggung. Sisi kanan kolofon boleh rata kanan lewat tab atau sel (`ID:2575`).

## 4. Lembar kendali (CS)

Berlaku T S, ID+EN, semua jenis; NOTA = NA (`seed-studio.ts:572`).

| Kode | Butir | Sitasi | Mode |
|---|---|---|---|
| CS-01 | Lembar kendali menyusul sampul dan dibuka pita segel | `ID:2470`, `ID:2500`; `EN:2542`, `EN:2569`, `EN:2762` | TERUKUR |
| CS-02 | Kicker lembar kendali per bahasa | `ID:23`; `EN:23`; 31 §4.2 | TERUKUR |
| CS-03 | Judul blok berhuruf berurutan per bahasa | `ID:27, 37, 56`; `EN:27, 36, 60`; 31 §4.2 | TERUKUR |
| CS-04 | Kepala kolom tabel per bahasa | `ID:29, 39, 58`; `EN:29, 38, 62`; 31 §4.2 | TERUKUR |
| CS-06 | Tiga kolom tanda tangan | `ID:2501`; `EN:2570` | CAKUPAN |
| CS-07 | Riwayat revisi ada | `ID:2500`, `ID:516-517`; `EN:2569` | TERUKUR |
| CS-08 | Rantai verifikasi tiga lapis | `ID:2500-2501`; `EN:2569` | CAKUPAN |
| CS-09 | Pernyataan metode | `ID:2501`; `EN:2570` | CAKUPAN |
| CS-10 | Setiap salinan bernomor punya pemegang bernama | DT-13b `ID:2503-2508`; `EN:2575-2580` | TERUKUR (bersyarat) |
| CS-11 | Kolom manual (STATUS; METODE/OBJEK/HASIL; MEDIA/KEMBALI) | `ID:29, 39, 58`; `EN:29, 38, 62` | CAKUPAN |
| CS-12 | Subjudul "Kendali dokumen, riwayat revisi, dan pernyataan verifikasi" / EN | `ID:25`; `EN:25` | CAKUPAN |

**Pemeriksaan TERUKUR**
- CS-01: seksi pembungkus kedua = LEMBAR KENDALI; elemen blok pertamanya = tabel pita segel.
- CS-02: teks sumber paragraf kicker lembar kendali = `Lembar Kendali` (ID) / `Control Sheet` (EN). Paragraf judul: = teks yang sama, atau berawalan `Lembar Kendali ` / `Control Sheet ` diikuti nomor (`src/lib/studio/services/compose/front.ts:74-76`; `write-client.ts:161`).
- CS-03: paragraf judul blok cocok, berurutan, `^[A-D] · (Riwayat revisi|Rantai verifikasi|Pernyataan metode|Distribusi terkendali)$` (ID) atau `^[A-D] · (Revision history|Verification chain|Method statement|Controlled distribution)$` (EN); huruf mulai A dan naik satu per blok yang ada, urutan blok = revisi, verifikasi, metode, distribusi (`texts.ts:37-45`).
- CS-04: baris pertama tabel riwayat revisi, rantai verifikasi, distribusi = daftar 31 §4.2 untuk bahasanya, teks sumber persis dan berurutan.
- CS-07: tabel riwayat revisi punya >= 1 baris data.
- CS-10: bila sel kanan pita segel memuat `\b(SALINAN|COPY)\s+(\d+)\b`, nomor itu ada di kolom pertama tabel distribusi dengan sel pemegang tidak kosong; selain itu NA (bawaan = salinan induk tanpa nomor, 31 §4.4).

## 5. Running head dan blok register (RH, RB)

| Kode | Butir | Sitasi | Mode | Berlaku |
|---|---|---|---|---|
| RH-01 | Kepala halaman menyebut bab di halaman itu, tanpa logo | DT-13a `ID:2450-2455`, `ID:349`; `EN:2525-2530`, `EN:397` | TERUKUR | N T S; ID+EN |
| RH-03 | Garis kepala seal 0,26 mm | Tabel 8.1 `ID:2576`; `EN:2646` | TERUKUR | N T S; ID+EN |
| RH-04 | Teks kepala ink400 | `ID:2576`; `EN:2646` | TERUKUR | N T S; ID+EN |
| RB-01 | Blok register di kaki setiap halaman interior | Gambar 8.7 `ID:2726-2728`; `EN:2765` | TERUKUR | N T S; ID+EN |
| RB-02 | Urutan sel register, klasifikasi terakhir, kata per bahasa | `ID:2728`, `ID:348`; `EN:2787`, `EN:396` | TERUKUR | N T S; ID+EN |
| RB-03 | Jumlah lembar dari NUMPAGES, pemisah NBSP | DT-13g `ID:2732-2737`; `EN:2794-2799` | TERUKUR | N T S; ID+EN |
| RB-04 | Nomor dokumen dan nomor lembar tebal ink900 | DT-13g `ID:2732` (EN tidak mengatur, 31 §10 baris 8) | TERUKUR | N T S; ID |
| RB-05 | Garis register: atas seal 0,35 mm, bawah ink200 0,20 mm | Tabel 8.1 `ID:2577`; `EN:2647` | TERUKUR | N T S; ID+EN |
| RB-06 | Tanggal register `DD-<Romawi>-YYYY` | Tabel 6.2 `ID:1978`; `EN:2059` | TERUKUR | N T S; ID+EN |
| RB-07 | Halaman depan tanpa blok register | `ID:2510`, praktik `ID:304`; `EN:2765`, praktik `EN:310` | TERUKUR | T S; ID+EN |
| RB-08 | Lembar dihitung dari sampul (atau dari halaman pertama bila tanpa sampul), tanpa mulai ulang | `EN:2582` | TERUKUR | N T S; EN |
| RB-08c | Mulai ulang nomor di Bab 1 (teks ID ambigu) | `ID:2510-2511` lawan `ID:304` | CAKUPAN | T S; ID |

**Pemeriksaan TERUKUR**
- RH-01: untuk setiap seksi interior yang memuat judul bab, teks tampak header default memuat entitas (`PT GEMILANG SATRIA PERKASA`, tanpa beda besar-kecil; cadangan `PT Gemilang Satria Perkasa`, `header-footer.ts:111`) dan memuat label bab bahasa itu (`BAB <kunci>` / `CHAPTER <kunci>`) atau, bila kicker bab ditekan (`texts.ts:57-67`), judul bab itu. Tidak ada `w:drawing` di bagian header mana pun.
- RH-03: `w:pBdr/w:bottom` paragraf header interior: warna 6E1420, `w:sz` 6 +-1. Catatan kalibrasi: mesin kini menulis INK200 `w:sz` 5 (`header-footer.ts:73`), diperkirakan FAIL (31 F-4).
- RH-04: run kiri header warna 6B7783 (`header-footer.ts:54`; `src/lib/studio/params/color-type.ts:73`).
- RB-01: setiap seksi interior punya footer default yang memuat tabel register dan medan PAGE.
- RB-02: teks sel (NBSP dinormalkan): sel 1 = `<org> · <N>`; sel 2 = `REV <rev> · <tanggal>`; sel 3 = `LEMBAR <PAGE> DARI <NUMPAGES>` (ID) / `SHEET <PAGE> OF <NUMPAGES>` (EN); sel 4 = K (`header-footer.ts:154, 164, 257-258, 266-288`).
- RB-03: sel 3 memuat medan PAGE dan medan NUMPAGES; semua run teks literal di keempat sel tidak memuat U+0020 (semua spasi literal = U+00A0, `page.ts:260`; `header-footer.ts:255-256, 274`).
- RB-04: run nilai nomor (sel 1, sesudah `<org> · `) dan run medan PAGE: tebal efektif dan warna 101418 (`color-type.ts:71`; `header-footer.ts:59`).
- RB-05: garis atas tabel register warna 6E1420 `w:sz` 8 +-1; garis bawah warna C3CBD1 (`color-type.ts:74`) `w:sz` 5 atau 6; dari `w:tblBorders` atau `w:tcBorders`.
- RB-06: bagian tanggal sel 2 cocok `^\d{2}-(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)-\d{4}$` (`header-footer.ts:82-87`).
- RB-07: footer setiap seksi pembungkus tidak memuat medan PAGE/NUMPAGES maupun tabel register.
- RB-08: tidak ada `w:pgNumType/@w:start` pada seksi mana pun, kecuali seksi pertama dengan nilai 1. Pada NOTA (tanpa sampul) aturan tetap bermakna: hitungan berjalan dari halaman pertama tanpa mulai ulang.

## 6. Pita segel dan cap terbit (SB, IS)

Berlaku T S, ID+EN, semua jenis; NOTA = NA.

| Kode | Butir | Sitasi | Mode |
|---|---|---|---|
| SB-01 | Pita segel di kepala sampul dan lembar kendali, boleh di daftar isi, tidak di interior | `ID:2470`, DT-13e `ID:2709-2712`, praktik daftar isi `ID:72`; `EN:2542`, `EN:2762`, `EN:2773-2776`, `EN:75` | TERUKUR |
| SB-02 | Bentuk pita: isian seal, teks F4F5F6, 5 x 166 mm, klasifikasi kiri, kendali salinan kanan | Tabel 8.1 `ID:2573`; `EN:2642`, spesimen `EN:1`, `EN:21` | TERUKUR |
| SB-03 | Teks pita per bahasa | `ID:1`, `ID:21`; `EN:1`, `EN:21`, `EN:75`; 31 §4.4 | TERUKUR |
| IS-01 | Format cap terbit per bahasa | Tabel 6.2 `ID:1979`, `ID:20`; `EN:2061`, `EN:20`, `EN:2791-2792`; 31 §4.4 | TERUKUR |
| IS-02 | Konsistensi cap terbit (tanggal, kelas, bahasa) | `EN:2791`; `src/lib/studio/engine/front/texts.ts:189-198` | TERUKUR |
| IS-03 | Cap terbit seal tebal | Tabel 8.1 `ID:2575`; `EN:2645` | TERUKUR |

**Pemeriksaan TERUKUR**
- SB-01: elemen blok pertama seksi SAMPUL dan LEMBAR KENDALI = tabel pita segel; seksi interior tidak memuat tabel pita segel.
- SB-02: setiap tabel pita segel: kedua sel `w:shd/@w:fill` 6E1420; warna run F4F5F6; lebar total (`w:tblW` dxa atau jumlah `w:gridCol`) 9411 +-28 tw; bila `w:trHeight` ada, 283 +-28 tw (5 mm), selain itu tinggi NA.
- SB-03: sel kiri = `KLASIFIKASI · <K>` (ID) / `CLASSIFICATION · <K>` (EN); sel kanan = `SALINAN INDUK · PENGGUNAAN INTERNAL GSP` (ID) / `MASTER COPY · GSP INTERNAL USE` (EN), atau nilai `meta.copyControl` bila `hasCopyControl` (`render.ts:322-327`).
- IS-01: teks sisi kanan kolofon cocok `^// (\d{8}) (ID|EN) ([A-Z]) -- TERBITAN (\d+)$` (ID) atau `^// (\d{8}) (ID|EN) ([A-Z]) -- ISSUE (\d+)$` (EN); tidak memuat U+2014 (`page.ts:343`).
- IS-02: grup bahasa = `lang` pasangan; grup kelas = huruf pertama K kapital (`texts.ts:197`); grup tanggal = tanggal register RB-06 dalam bentuk YYYYMMDD.
- IS-03: run cap terbit tebal efektif dan warna 6E1420.

## 7. Geometri halaman dan fon (GF, DV)

| Kode | Butir | Sitasi | Mode | Berlaku |
|---|---|---|---|---|
| GF-01 | Halaman A4 | `ID:2655-2667`; `EN:2723-2735` | TERUKUR | N T S; ID+EN |
| GF-02 | Grid mendatar 24 + 166 + 20 mm | Turunan 8.6A `ID:2659-2665`; `EN:2727-2733` | TERUKUR | N T S; ID+EN |
| GF-03 | Batas tegak interior 13 / 26 / 273 / 284 mm | Tabel 8.3 `ID:2687-2699`; `EN:2751-2760` | TERUKUR | N T S; ID+EN |
| GF-04 | Hanya Plex; tanpa Calibri, Times New Roman, Aptos, Arial sebagai fon badan | DT-08a `ID:2609-2614`; `EN:2679-2685` | TERUKUR | N T S; ID+EN |
| GF-05 | Fon tertanam di DOCX | DT-09 `ID:2616-2621`; `EN:2687-2692` | TERUKUR | N T S; ID+EN |
| GF-06 | Badan 9,5 / 13,5 pt Serif | Tabel 8.2 `ID:2632`; `EN:2702` | TERUKUR | N T S; ID+EN |
| GF-07 | Kicker bab 6,8 pt Cond kapital signal | Tabel 8.2 `ID:2631`, DT-13c `ID:2542-2543`; `EN:2701`, `EN:2610-2611` | TERUKUR (bersyarat) | N T S; ID+EN |
| GF-08 | Skala huruf tabel dan caption | Tabel 8.2 `ID:2633-2635`; `EN:2703-2705` | CAKUPAN | semua |
| GF-09 | Lantai garis 0,18 mm (`w:sz` >= 5) | DT-11a `ID:2742-2747`; `EN:2803-2808` | TERUKUR | N T S; ID+EN |
| GF-10 | Tidak ada unsur lebih lebar dari 166 mm | DT-10a `ID:2669-2675`; `EN:2737-2743` | TERUKUR | N T S; ID+EN |
| GF-11 | Gambar isi selebar 128 atau 166 mm | DT-10a `ID:2672-2675`; `EN:2737-2743` | TERUKUR (bersyarat) | N T S; ID+EN |
| GF-12 | Navy dan emas pensiun | DT-07 `ID:2550-2555`; `EN:2620-2625` | TERUKUR | N T S; ID+EN |
| GF-13 | Teks klasifikasi seal tebal | DT-28d `ID:619-623`; `EN:657-661`; Tabel 8.1 `ID:2576-2577`, `EN:2646-2647` | TERUKUR | N T S; ID+EN |
| GF-14 | Setiap bab di seksi Word baru | DT-13a `ID:2450`; `EN:2525` | TERUKUR | N T S; ID+EN |
| GF-15 | Judul bernomor maks. tiga tingkat | `ID:2457`; `EN:2532` | TERUKUR | N T S; ID+EN |
| DV-01 | Datum Rule di atas judul bab | `EN:2763`; legenda Gambar 8.6 `ID:2705-2713` (gambar tidak terbaca, `research/30:269`) | TERUKUR | N T S; ID+EN |
| GF-16 | Nilai bentuk = tokens.json v1.9 | DT-03 `ID:2432-2438`; `EN:2508-2513` | CAKUPAN (LUAR: audit token ditunda D-590) | semua |
| GF-17 | Hanya rona 15 % dan 30 %, tanpa zebra | DT-11b `ID:2749-2754`; `EN:2810-2815` | CAKUPAN | semua |
| GF-18 | Uji fotokopi oleh pemeriksa bukan penulis | DT-11c `ID:2756-2762`; `EN:2817-2823` | CAKUPAN | S |
| GF-19 | Latar #FCFCFB / #FBFAF7 | DT-05 `ID:2528-2533`; `EN:2591-2597` | CAKUPAN | semua |
| GF-20 | Batas warna per halaman dan per chart | DT-06 `ID:2535-2540`; `EN:2599-2608` | CAKUPAN | semua |
| GF-21 | Irama 13,5 pt dan panjang baris 66-80 karakter | DT-10b `ID:2680-2685`; `EN:2748-2753` | CAKUPAN | semua |
| GF-22 | Sampel warna kop di PDF | DT-13d `ID:2588-2594`; `EN:2660-2666` | CAKUPAN (terukur di PDF bila alat S04 ada) | T S |
| GF-23 | Tik Datum Rule >= 0,18 mm | DT-13f `ID:2718-2720`; `EN:2777-2781` | CAKUPAN | semua |
| GF-24 | Rel bukti di kolom luar 32 mm halaman interior | `EN:2764`; legenda `ID:2705-2711` | CAKUPAN | semua |

**Pemeriksaan TERUKUR**
- GF-01: setiap `w:pgSz`: tegak `w:w` 11906 +-2, `w:h` 16838 +-2; seksi `w:orient="landscape"` dinilai dengan nilai tertukar.
- GF-02: setiap seksi tegak: `w:pgMar/@w:left` 1361 +-28, `@w:right` 1134 +-28, sehingga lebar teks 9411 +-28 tw (`header-footer.ts:60`; `page.ts:63-90`).
- GF-03: setiap seksi interior: `@w:top` 1474 +-28 (26 mm), `@w:bottom` 1361 +-28 (24 mm = 297 - 273), `@w:header` 737 +-57 (13 mm), `@w:footer` 737 +-57 (13 mm = 297 - 284). Catatan kalibrasi: katalog mencatat margin bawah interior 26 mm pada sumber lama (celah G-03, `page.ts:106-113`); S25 memastikan nilai render.
- GF-04: tidak ada `w:rFonts` (`ascii`, `hAnsi`, `cs`, `eastAsia`, setelah resolusi tema) bernilai Calibri, Times New Roman, Aptos, atau Arial di `document.xml`, header, footer, dan `styles.xml` (docDefaults dan semua gaya yang dipakai).
- GF-05: setiap `w:font` di `fontTable.xml` yang namanya memuat `IBM Plex` dan dirujuk dokumen punya >= 1 dari `w:embedRegular`/`w:embedBold`/`w:embedItalic`/`w:embedBoldItalic` yang `r:id`-nya (`word/_rels/fontTable.xml.rels`) mengarah ke bagian yang ada di `word/fonts/`.
- GF-06: gaya badan = `w:pStyle` milik >= 50 % paragraf isi tak kosong di seksi interior (bukan judul, keterangan, sel tabel, atau daftar). Format efektifnya: fon Serif, `w:sz` 19 +-1, `w:spacing/@w:line` 270 +-5 dengan `@w:lineRule` `exact` atau `atLeast`.
- GF-07: paragraf kicker pembuka bab (teks cocok LB-03): `w:sz` 14 +-1, `w:caps` aktif, warna B45309, fon Cond. NA bila kicker bab ditekan di semua bab.
- GF-09: setiap elemen garis (`w:top`, `w:left`, `w:bottom`, `w:right`, `w:insideH`, `w:insideV`, `w:between`, `w:bar` di `w:pBdr`, `w:tblBorders`, `w:tcBorders`, `w:pgBorders`) dengan `@w:val` selain `nil`/`none` punya `@w:sz` >= 5.
- GF-10: setiap `wp:extent/@cx` <= 5.994.000 EMU; setiap `w:tblW` bertipe `dxa` dan jumlah `w:gridCol` per tabel <= 9439 tw; `w:tblW` bertipe `pct` <= 5000.
- GF-11: setiap gambar di seksi interior selain Datum Rule: `cx` = 4.608.000 atau 5.976.000, masing-masing +-18.000 EMU. NA bila tidak ada gambar isi.
- GF-12: pencarian tanpa beda besar-kecil `1A2B4A` dan `C9A84C` di semua bagian XML dan `word/media/*.svg` = 0.
- GF-13: run pembawa K di header interior (kanan) dan sel ke-4 register: tebal efektif dan warna 6E1420. Teks pita segel dikecualikan (F4F5F6 di atas seal, SB-02). Catatan kalibrasi: mesin menulis INK900 (`header-footer.ts:55`; `color-type.ts:122`), diperkirakan FAIL (31 F-4).
- GF-14: setiap paragraf judul bab (tingkat outline 0) adalah judul pertama di seksi interiornya, dan tidak ada seksi interior dengan dua judul bab.
- GF-15: tidak ada paragraf dengan `w:outlineLvl` efektif >= 3 dan tidak ada gaya Heading 4-9 yang dipakai.
- DV-01: di seksi interior yang membuka bab, paragraf bergambar Datum Rule (`cx` = lebar kolom teks 4.608.000 +-18.000 EMU, `render.ts:419-424`) muncul sebelum paragraf judul bab.

## 8. §3.4 penomoran dan daftar kode tertutup (NU)

| Kode | Butir | Sitasi | Mode | Berlaku |
|---|---|---|---|---|
| (CR-2) | Pola nomor dan daftar tertutup tanpa DS | §2 | TERUKUR K | N T S; ID+EN |
| NU-02 | Kode jenis konsisten di nomor, string punggung, dan templat | `ID:640-641`; `EN:536` | TERUKUR | N T S; ID+EN |
| NU-03 | Spec templat `doc.typeCode` = daftar Rev A tanpa DS dengan NDA | `ID:643-661`; `EN:681-683`; 31 §3.1 | TERUKUR (dari tabel spec, bukan DOCX) | semua 10 templat |
| NU-05 | Revisi tanpa desimal | `ID:515-516`; `EN:538-539` | TERUKUR | N T S; ID+EN |
| NU-06 | Pasangan dwibahasa berbagi nomor, revisi, klasifikasi, nomor tabel | PK-13 `EN:422-429`, `EN:533` | CAKUPAN | ID+EN |
| NU-07 | Bulan Romawi dan tahun nomor = tanggal dokumen | `ID:640-641`; `EN:536` | TERUKUR | N T S; ID+EN |
| NU-08 | Skema revisi Draf 1, Draf 2, RevA | `ID:515-516`; `EN:538-539` | CAKUPAN | semua |
| NU-09 | Nomor dari Register Induk sebelum membangun; `XXX` menahan rilis | DT-04a `ID:508-513`; `EN:535-541` | CAKUPAN | T S |

**Pemeriksaan TERUKUR**
- NU-02: kode di N (CR-2 grup 1) = `expectedTypeCode`; untuk T/S juga = medan pertama string punggung (`jenis`, `texts.ts:174-182`).
- NU-03: dalam uji tabel spec S26 atau baca DB S34: nilai `doc.typeCode` setiap templat baru = `["PT","KT","RAB","SPH","SP","BA","NDA","DEK","LAP","MAT","STD","NOT","MOD","VER"]` persis.
- NU-05: token revisi di sel 2 register dan sel pertama baris terakhir riwayat revisi tidak cocok `\d+[.,]\d+`.
- NU-07: bulan Romawi dan tahun di N = bulan dan tahun tanggal register RB-06 (nomor server dibentuk dari tanggal terbit, `repository.ts:66-73`).

## 9. Perilaku tier (TR)

| Kode | Butir | Sitasi | Mode | Berlaku |
|---|---|---|---|---|
| TR-01 | Tier efektif = tier bawaan pasangan | DT-02 `ID:406-412`; `EN:440-451`; 31 §2 | TERUKUR | T S; ID+EN |
| TR-02 | NOTA tanpa sampul, lembar kendali, tanda tangan, daftar isi | `ID:357`, `ID:380`; `EN:349`; `seed-studio.ts:571-574` | TERUKUR | N; ID+EN |
| TR-03 | TERBIT/SERAH: sampul, lembar kendali, tanda tangan, daftar isi sebelum Bab 1 | `ID:2500`; `EN:2569`; `seed-studio.ts:570-578` | TERUKUR | T S; ID+EN |
| TR-04 | Nama tier tetap Indonesia di EN | `EN:447` | TERUKUR | T S; EN |
| TR-05 | Empat kewajiban SERAH | PK-06 `ID:422-444`; `EN:467-479` | CAKUPAN | S |
| TR-06 | Gerbang rilis per tier | `ID:3868-3869`; `EN:3901-3905` | CAKUPAN (LUAR: proses penulisan, bukan templat) | semua |
| TR-07 | Berkas NOTA dinamai judul dan tanggal ISO | Tabel 2.3 `ID:487-493`; `EN:518-523` | CAKUPAN | N |
| TR-08 | Daftar isi sampai tingkat seksi | `ID:2511`; `EN:2582` | TERUKUR | T S; ID+EN |

**Pemeriksaan TERUKUR**
- TR-01: nilai di sebelah label `Tier` blok kendali sampul = `expectedTier`. NA bila blok kendali adalah blok eksplisit MCP tanpa medan tier (`write-client.ts:141-149`).
- TR-02: tidak ada tabel pita segel, kicker lembar kendali, medan TOC, atau blok tanda tangan; seksi pertama sudah interior (header berjalan dan footer register).
- TR-03: seksi pembungkus berurutan SAMPUL, LEMBAR KENDALI, lalu DAFTAR ISI sebelum seksi interior pertama; blok tanda tangan (sel peran LB-06) ada di salah satu seksi pembungkus.
- TR-04: nilai tier blok kendali sampul dokumen EN adalah `NOTA`, `TERBIT`, atau `SERAH` persis.
- TR-08: instruksi medan TOC cocok `TOC \\o "1-(\d)"` dengan angka >= 2 (`pages.ts:423`).

## 10. §6.7/§6.8 konvensi angka (NC) dan fiksur bind

| Kode | Butir | Sitasi | Mode | Berlaku |
|---|---|---|---|---|
| (CR-3) | Konvensi angka per bahasa | §2 | TERUKUR K | N T S; ID+EN |
| NC-04 | Tanggal panjang (REVISI sampul) dengan nama bulan bahasa itu | Tabel 6.2 `ID:1975`; `EN:2053`; `ID:2001` | TERUKUR | T S; ID+EN |
| NC-05 | Lampiran Inggris pada dokumen Indonesia dibuka baris konvensi | `ID:2005-2006`; `EN:2081-2082` | CAKUPAN | ID |
| NC-06 | Bentuk uang di prosa (miliar/billion satu bentuk per berkas; ISO 4217) | DT-30g `ID:1940-1942`; `EN:2024-2028` | CAKUPAN | semua |
| NC-07 | Terbilang / In words di bawah jumlah mengikat | DT-31b `ID:1950-1956`; `EN:2030-2036` | CAKUPAN | semua |
| NC-08 | Label angka chart pada dokumen EN | `EN:3020`; Q-C D-596 | CAKUPAN (LUAR: ditunda ke ronde berikut, `decisions.md:602`) | EN |

**Pemeriksaan TERUKUR**
- NC-04: nilai medan REVISI blok kendali auto cocok `^.+ · (\d{1,2}) (<bulan>) (\d{4})$`, `<bulan>` dari daftar bahasa itu (`src/lib/studio/engine/docx/wrapper/formats.ts:461-462`; `texts.ts:139`).

**Fiksur bind B-FIX (bukti CR-3)**
- Alasan: jalur `studio_write` tidak mengirim register (31 F-5), jadi angka terikat register tidak muncul di sampel how-to.
- Bentuk: satu dokumen per pasangan templat x bahasa, dirender lewat templat yang sama dengan `snapshot.register` berisi empat entri, ditampilkan lewat mekanisme pengikatan register yang sudah ada (tabel register atau blok turunan; pilihan coder, tanpa medan muatan baru). Fiksur adalah alat uji, bukan cara pakai agen (U3 tetap utuh).

| Entri | Nilai | `dec` | Satuan | Harapan ID | Harapan EN |
|---|---|---|---|---|---|
| `fx.decimal` | 1250000.5 | 1 | - | `1.250.000,5` | `1,250,000.5` |
| `fx.money` | 1385946000 | 0 | `Rp` | `Rp 1.385.946.000` | `IDR 1,385,946,000` |
| `fx.pct` | 25 | 0 | persen | `25 %` | `25 %` |
| `fx.small` | 0.5 | 1 | - | `0,5` | `0.5` |

Sumber harapan: 31 §5 (`format.ts:13-16`; `src/lib/studio/engine/bind/register.ts:146-158`; `EN:423`, `EN:1933`, `EN:2024-2025`; `ID:1931-1932`, `ID:2001`).

## 11. AC-6 (AC6)

| Kode | Butir | Sitasi | Mode | Berlaku |
|---|---|---|---|---|
| (CR-4) | Daftar inti AC-6 dan penanda bahasa | §2 | TERUKUR K | N T S; ID+EN |
| AC6-03 | Daftar perluasan token Indonesia di lokasi pembungkus EN | 31 §6; RQ-2 `02_structured:51` | TERUKUR | N T S; EN |

**Pemeriksaan**: AC6-03 = nol token daftar perluasan 31 §6 di WL (§0.4), semantik pencocokan 31 §6. Catatan kalibrasi: label aparatus (`Tabel`, `Gambar`, `SUMBER`, `Turunan`) diperkirakan FAIL sampai ada keputusan 31 F-2.

## 12. Label bahasa (LB)

| Kode | Butir | Sitasi | Mode | Berlaku |
|---|---|---|---|---|
| LB-01 | Label blok kendali sampul per bahasa (`Prepared by`) | `ID:15-18`; `EN:15-18`, `EN:2558`; 31 §4.1, §4.3 | TERUKUR | T S; ID+EN |
| LB-02 | Satu judul daftar isi per bahasa | `ID:74`; `EN:77`; 31 §3.4, §4.5 | TERUKUR | T S; ID+EN |
| LB-03 | Kicker pembuka bab per bahasa | `ID:76`; `EN:79`; `texts.ts:89-104` | TERUKUR (bersyarat) | N T S; ID+EN |
| LB-06 | Peran tanda tangan per bahasa | `EN:2570`; D-590; 31 §4.3 | TERUKUR (sampel MCP) | T S; ID+EN |
| LB-07 | Nilai bahasa "English (UK)" | `EN:18` | CAKUPAN | T S; EN |
| LB-08 | "Annex" untuk lampiran EN | `EN:240`, `EN:2509`, `EN:4441` | CAKUPAN | EN |
| LB-09 | Label aparatus per bahasa (TABEL/TABLE, GAMBAR/FIGURE, SUMBER/SOURCE, TURUNAN/DERIVATION, PROVENANS/PROVENANCE, KUNCI/KEY) | `ID:2402-2405`, `ID:2659`; `EN:2327`, `EN:2496`, `EN:2721`, `EN:2727` | TERUKUR (bersyarat) | N T S; ID+EN |
| LB-10 | Catatan revisi bawaan per bahasa | `EN:31`; 31 §4.3 | TERUKUR (bersyarat) | T S; ID+EN |
| LB-11 | Peran rantai verifikasi per bahasa | 31 §4.3 | TERUKUR (sampel MCP) | T S; ID+EN |
| LB-12 | Versi yang berlaku disebut di front matter | PK-12 `EN:415-420` | CAKUPAN | ID+EN pasangan |
| LB-13 | Pernyataan EN-L1-13 untuk kementerian | `research/30:105` (EN-L1-13) | CAKUPAN | EN |

**Pemeriksaan TERUKUR**
- LB-01: teks sumber sel label blok kendali sampul termasuk dalam himpunan label 31 §4.1 (auto) atau §4.3 (MCP) bahasa itu, dan label penyusun = `Penyusun` (ID) / `Prepared by` (EN). Label bahasa lain = FAIL.
- LB-02: di seksi DAFTAR ISI tepat satu paragraf yang teks tampaknya (tanpa beda besar-kecil) = `DAFTAR ISI` (ID) / `CONTENTS` (EN) (`pages.ts:465-466`).
- LB-03: paragraf kicker pembuka bab cocok `^BAB \S+$` (ID) / `^CHAPTER \S+$` (EN) pada teks tampak. NA bila tidak ada kicker bab (judul bab membawa nomor sumber, `texts.ts:57-67`).
- LB-06: untuk `producedBy = mcp`: teks sel peran tanda tangan termasuk `Disusun`, `Diperiksa`, `Disetujui` (ID, `write-client.ts:104`) atau `Prepared by`, `Reviewed by`, `Approved by` (EN). NA untuk `r08`.
- LB-09: setiap paragraf keterangan tabel/gambar/turunan di seksi interior diawali (teks tampak, tanpa beda besar-kecil) `TABEL `/`GAMBAR `/`TURUNAN ` (ID) atau `TABLE `/`FIGURE `/`DERIVATION ` (EN); run label sumber/provenans/kunci = `SUMBER`/`PROVENANS`/`KUNCI` (ID) atau `SOURCE`/`PROVENANCE`/`KEY` (EN). NA bila tidak ada keterangan. Catatan kalibrasi: EN diperkirakan FAIL (`src/lib/studio/engine/docx/assemble/numbering.ts:110-111`; `src/lib/studio/engine/docx/figures/defaults.ts:36-41`; 31 F-2).
- LB-10: bila `agentRevisionText` tidak ada dan `producedBy = mcp`: sel catatan baris pertama riwayat revisi = `Terbit pertama` (ID) / `First issue` (EN); selain itu NA.
- LB-11: untuk `producedBy = mcp`: sel peran tabel rantai verifikasi termasuk `Penyusun`, `Diperiksa`, `Disetujui` (ID, `write-client.ts:155-157`) atau `Prepared by`, `Reviewed by`, `Approved by` (EN). NA untuk `r08`.

## 13. Detektor bentrok (D-593; dihitung bentrok, bukan skor)

Teks pembungkus yang saling bertentangan (tafsir controller D-593, `decisions.md:599`), diimplementasikan S23:

| Kode | Bentrok | Pemeriksaan |
|---|---|---|
| X-01 | Dua bahasa di teks pembungkus | WL memuat >= 1 token daftar inti/perluasan 31 §6 DAN >= 1 penanda bahasa lain (CR-4 butir 2/4) |
| X-02 | Dua kode jenis | Kode di N, medan `jenis` string punggung, dan kode yang tersirat kicker sampul (kicker 31 §1 milik jenis lain) tidak semuanya sama |
| X-03 | Dua kicker | Kicker sampul memuat lebih dari satu nama jenis dari kolom kicker 31 §1 |
| X-04 | Dua klasifikasi | K berbeda di antara pita segel, header interior, dan sel register (bagian CR-1 butir 4; dilaporkan juga sebagai bentrok) |
| X-05 | Kode bahasa bertentangan | Grup bahasa cap terbit atau medan `bahasa` string punggung tidak sama dengan bahasa teks pembungkus |

Geometri PDF (D-593), diimplementasikan S24 dengan alat dari S04; dicantumkan agar indeks aturan lengkap:

| Kode | Bentrok |
|---|---|
| G-01 | Kotak teks pada halaman yang sama saling tumpang |
| G-02 | Teks keluar halaman |
| G-03 | Teks keluar margin (di luar kolom teks/rel yang sah, GF-02) |
| G-04 | Teks terpotong di sel tabel |
| G-05 | Teks terpotong atau meluap di blok sampul (blok kendali, kolofon, pita segel) |
| G-06 | Label meluap di blok register, kepala halaman, atau pita segel |

Ambang bentrok = 0 per sampel (31 §8).

## 14. Butir cakupan-saja (masukan S33)

Status awal adalah usulan; S33 memutus berdasarkan bukti keluaran templat dan mesin.

| Kode | Butir | Sitasi | Petunjuk tempat cakupan | Usulan awal |
|---|---|---|---|---|
| CV-14 | Tiga medan sisa blok kendali | `ID:2486-2487`/`ID:15-18`; `EN:2558-2559`/`EN:15-18` | `cover.controlBlock.fields` (`page.ts:368-377, 426-429`) | sebagian (spesimen dipenuhi, prosa tidak) |
| CV-15 | Nilai penyusun tetap | `ID:2487`; `EN:2558` | `meta.author` agen (`write-client.ts:74-77`) | tidak tercakup templat (isi agen) |
| CV-19 | Punggung di pembatas dan sampul belakang | `ID:2718-2723`; `EN:2778-2783` | `device.spine.placements` (`page.ts:323-332`); tanpa sampul belakang | sebagian |
| CV-20 | Baris judul <= 150 mm | `ID:2480`; `EN:2552` | PDF (S24) | sebagian |
| CV-21 | Warna logo per edisi | `ID:2545-2547`; `EN:2611`, `EN:2643` | aset logo | sebagian |
| CS-06 | Tiga kolom tanda tangan | `ID:2501`; `EN:2570` | `write-client.ts:167-174` (bergantung reviewer/approver) | sebagian |
| CS-08 | Tiga lapis verifikasi | `ID:2500-2501` | `write-client.ts:154-158` | sebagian |
| CS-09 | Pernyataan metode | `ID:2501`; `EN:2570` | `meta.method` (`write-client.ts:164`); `page.ts:479` | sebagian |
| CS-11 | Kolom manual lembar kendali | `ID:29, 39, 58`; `EN:29, 38, 62` | `front.ts:30-32`; `page.ts:450-489` tidak dipakai | sebagian |
| CS-12 | Subjudul lembar kendali | `ID:25`; `EN:25` | judul = label slot (`front.ts:76`) | tidak |
| RB-08c | Mulai ulang nomor di Bab 1 (ID) | `ID:2510-2511`/`ID:304` | perilaku PAGE mesin | sebagian (ambigu) |
| GF-08 | Skala huruf tabel/caption | `ID:2633-2635`; `EN:2703-2705` | tabel peran tipografi (`color-type.ts:218-233`) | tercakup |
| GF-16 | tokens.json v1.9 | `ID:2432-2438`; `EN:2508-2513` | - | LUAR (audit token ditunda D-590) |
| GF-17 | Rona 15/30 %, tanpa zebra | `ID:2749-2754`; `EN:2810-2815` | `rules.tintsPercent` (`page.ts:175-177`) | tercakup |
| GF-18 | Uji fotokopi | `ID:2756-2762`; `EN:2817-2823` | proses pemeriksa | tidak |
| GF-19 | Latar halaman | `ID:2528-2533`; `EN:2591-2597` | parameter warna kertas | tercakup |
| GF-20 | Batas warna | `ID:2535-2540`; `EN:2599-2608` | lint 14/25 | sebagian |
| GF-21 | Irama 13,5 pt, panjang baris | `ID:2680-2685`; `EN:2748-2753` | `grid.verticalRhythm.multipleOfBaseline` (`page.ts:118-128`) | sebagian |
| GF-22 | Sampel warna kop PDF | `ID:2588-2594`; `EN:2660-2666` | PDF (S24) | sebagian |
| GF-23 | Tik Datum Rule | `ID:2718-2720`; `EN:2777-2781` | aset Datum Rule (`render.ts:432-438`) | sebagian |
| GF-24 | Rel bukti 32 mm | `EN:2764`; `ID:2705-2711` | `layout.railMode` (`page.ts:133-139`) | tercakup |
| NU-06 | Pasangan dwibahasa | `EN:422-429`, `EN:533` | tidak ada tautan pasangan (`research/30:187`) | tidak |
| NU-08 | Skema revisi | `ID:515-516`; `EN:538-539` | `write-client.ts:93-96` (peringatan REV_DISPLAY_ONLY) | sebagian |
| NU-09 | Nomor Register Induk / tahan rilis | `ID:508-513`; `EN:535-541` | nomor server (`repository.ts:52-74`) | sebagian |
| TR-05 | Empat kewajiban SERAH | `ID:422-444`; `EN:467-479` | blok turunan dan rel bukti tersedia; isi agen | sebagian |
| TR-06 | Gerbang rilis per tier | `ID:3868-3869`; `EN:3901-3905` | - | LUAR (proses, bukan templat) |
| TR-07 | Nama berkas NOTA | `ID:487-493`; `EN:518-523` | `naming.file.pattern` (`src/lib/studio/params/governance-language.ts:95-96`) | sebagian |
| NC-05 | Baris konvensi lampiran Inggris | `ID:2005-2006`; `EN:2081-2082` | isi agen | tidak |
| NC-06 | Bentuk uang di prosa | `ID:1940-1942`; `EN:2024-2028` | isi agen | sebagian |
| NC-07 | Terbilang / In words | `ID:1950-1956`; `EN:2030-2036` | S33 memeriksa pembangkit terbilang mesin | ditentukan S33 |
| NC-08 | Angka chart EN | `EN:3020` | - | LUAR (Q-C D-596) |
| LB-07 | "English (UK)" | `EN:18` | `texts.ts:145` | sebagian |
| LB-08 | "Annex" | `EN:240`, `EN:4441` | `texts.ts:29` | sebagian |
| LB-12 | Versi berlaku di front matter | `EN:415-420` | tidak ada slot (`research/30:119`) | tidak |
| LB-13 | Pernyataan EN-L1-13 | `research/30:105` | isi agen | tidak |
| CL-02 | Baris "Klasifikasi:" di bawah nomor | DT-28c `ID:611-612`; `EN:647-648` | pasangan Klasifikasi blok MCP (`write-client.ts:143`); spesimen manual sendiri tidak memuatnya (`ID:15-18`) | sebagian |
| CL-03 | Skema klasifikasi per penerima | DT-28a/b `ID:566-607`; `EN:590-625` | skema ANRI tetap (`apparatus.ts:261-264`; D-590) | sebagian |
| CL-04 | GSP COMMERCIAL IN CONFIDENCE | DT-28e/EG-52 `EN:663-673` | - | LUAR (skema tetap ANRI, D-590) |
| ST-01 | Indeks aturan STD | `ID:235`, `ID:4517`; `EN:240`, `EN:4441` | slot `ruleIndex` AUTO (31 §3.5) tidak memancarkan isi (`src/lib/studio/engine/docx/assemble/units.ts:351-361`) | tidak (31 F-3); hanya STD |

Jumlah: 39 butir; 4 sudah LUAR (GF-16, TR-06, NC-08, CL-04), sehingga penyebut awal 35 per pasangan sebelum keberlakuan tier/bahasa/jenis diterapkan S33.

## 15. Kelompok di luar lingkup (keluar dari penyebut)

| Kode | Kelompok | Alasan |
|---|---|---|
| OS-01 | Bab 4-5 tata bahasa dan Gaya Bahasa Ahli (ID), Bab 4-5 English grammar/expert style (EN) | Aturan isi yang ditulis agen; lingkup templat = bentuk (`research/30:21`) |
| OS-02 | Bab 9-10 chart dan diagram | Mesin chart yang ada, label angka EN ditunda Q-C (D-596) |
| OS-03 | Bab 11-12 workbook, dek, paparan, chat | Di luar Studio v2.1 dan D-590 (`research/30:175-185`) |
| OS-04 | §3.6 surat dinas, surat ke pihak asing, kop surat Tabel 8.1 baris surat | Di luar ronde (D-590) |
| OS-05 | §3.7 PPN dan meterai | Isi RAB; RAB di luar ronde (D-590) |
| OS-06 | Bab 13 gerbang rilis, lint, juri LEPAS | Proses penulisan, bukan keluaran templat |
| OS-07 | Bab 7 aparatus bukti (isi register, turunan, asumsi) | Isi agen; hanya format angka terikat register yang masuk (CR-3) |

## 16. Keberlakuan ringkas (penyebut terukur maksimum)

| Keluarga | T/S ID | T/S EN | N ID | N EN |
|---|---|---|---|---|
| CR | 4 | 4 | 4 | 4 |
| CV | 16 | 16 | - | - |
| CS | 6 | 6 | - | - |
| RH | 3 | 3 | 3 | 3 |
| RB | 7 (tanpa RB-08) | 7 (tanpa RB-04) | 6 (tanpa RB-07, RB-08) | 6 (tanpa RB-04, RB-07) |
| SB, IS | 6 | 6 | - | - |
| GF, DV | 15 | 15 | 15 | 15 |
| NU | 4 | 4 | 4 | 4 |
| TR | 3 (01, 03, 08) | 4 (+04) | 1 (02) | 1 (02) |
| NC | 1 | 1 | - | - |
| AC6 | - | 1 | - | 1 |
| LB | 7 | 7 | 2 (03, 09) | 2 (03, 09) |
| **Jumlah** | **72** | **74** | **35** | **36** |

Aturan bersyarat (CV-10, CV-11, CS-10, GF-07, GF-11, LB-03, LB-09, LB-10, TR-01 pada blok MCP) dapat menjadi NA dan mengecilkan penyebut. NU-03 dinilai dari tabel spec, bukan DOCX.

## 17. Verifikasi katalog

| Cek (`02_structured:118`) | Hasil |
|---|---|
| Setiap butir mengutip baris manual yang ada | Ya; baris dibaca di sesi ini (`ID:1-130, 296-679, 1925-2009, 2400-2789, 4025-4324`; `EN:1-130, 395-694, 1920-2084, 2215-2229, 2495-2824`); butir tanpa baris manual hanya LB-06/LB-11 (D-590) dan LB-13 (`research/30:105`) |
| 4 aturan kritis ditandai | Ya, CR-1..CR-4 (§2) |
| Setiap butir berstatus terukur atau cakupan-saja | Ya: 76 TERUKUR, 39 CAKUPAN (§1) |
| Setiap aturan terukur menyebut apa yang diperiksa pembaca DOCX | Ya: bagian OOXML, nilai harapan, toleransi (§2-§12); nilai per bahasa/jenis dirujuk ke register 31 |
