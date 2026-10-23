---
type: requirements
confidence: medium
subject: Katalog parameter kustomisasi Doc Artifact Studio, diturunkan dari Manual Komprehensif DATUM GSP 000/GSP/STD/X/2026 Rev A
author_agent: data-analyst
date: 2026-10-22
status: complete-with-gaps
---

# Katalog Parameter Kustomisasi: Manual DATUM GSP sebagai Dasar Skema Template

## 0. Source Tasks, metode, dan konvensi baca

### 0.1 Tugas sumber (5W1H)

| Unsur | Isi |
|---|---|
| Apa | Katalog parameter kustomisasi, registri jenis section, matriks tier, daftar lint otomatis vs penilaian manusia, serta register celah dan konflik, sebagai dasar skema template modul "Doc Artifact Studio" Swarm HQ v2.1. |
| Siapa | Pemakai: pemilik skema template HQ (pm-planner, coder-execution). Pemangku: Divisi Engineering GSP (kustodian ENG-01, L18), admin kepatuhan, penulis dan AI agent penyedia data JSON. |
| Kapan | Dibaca 2026-10-22. Manual Rev A bertanggal 8 Oktober 2026 (L17). tokens.json v2.0.0 dibangun 2026-10-05 (TK4-5). |
| Lingkup | Seluruh 17 bab dan Lampiran A-D manual. Bab 1-2 dan 17 dipakai sebagai sumber tata kelola dan konflik; Bab 3-16 dan Lampiran A-B sebagai sumber parameter. |
| Mengapa | Kedalaman kustomisasi wajib setara manual. Setiap parameter harus punya default, rentang, nomor aturan, dan kelas kunci agar template tidak bisa diam-diam melanggar aturan kepatuhan. |
| Bagaimana | (1) Membaca `datum_manual.txt` baris 1-5058 utuh dalam 9 potongan. (2) Membaca `tokens.json` 117 baris utuh. (3) Untuk nilai yang menurut manual tinggal di tokens.json tetapi ternyata tidak ada di berkas v2.0.0, menelusuri kode skill (`datum_diagram.py`, `scripts/datum_lint.py`, `pustakachart.py`, `SKILL.md`) sebagai bukti pendukung. (4) Merekonstruksi tabel yang kolomnya tergeser pdftotext dengan pencocokan jumlah baris dan silang ke tokens.json (lihat 0.3). |

### 0.2 Notasi rujukan

| Kode | Arti |
|---|---|
| `L1234` | Baris di `C:\Users\TRIAL\AppData\Local\Temp\hq_v21_clone\datum_manual.txt` |
| `TK12` | Baris di `C:\Users\TRIAL\AppData\Local\hermes\skills\gsp\datum-house-style\tokens.json` |
| `SK12` | Baris di `...\datum-house-style\SKILL.md` (bukti pendukung, bukan sumber wajib) |
| `DD12` | Baris di `...\datum-house-style\datum_diagram.py` |
| `LT12` | Baris di `...\datum-house-style\scripts\datum_lint.py` |
| `PC12` | Baris di `...\datum-house-style\pustakachart.py` |
| Kelas **B** | Bebas diubah user pada template |
| Kelas **K** | Terkunci kepatuhan atau ambang gerbang; hanya admin |
| Kelas **T** | Turunan; dihitung dari parameter lain, tidak disunting langsung |
| `[REK]` | Nilai hasil rekonstruksi kolom tergeser (keyakinan MEDIUM; wajib dicek ke .docx, lihat 7.3) |
| `[TAK TERBACA]` | Glif rusak (U+FFFD) atau nilai tidak ada di sumber mana pun |

Kriteria kelas kunci (penilaian analis, diturunkan dari hierarki kewenangan 2.5, L379-398): parameter menjadi **K** bila (a) berasal dari regulasi, kontrak, atau Bab 6 kepatuhan ("tidak bisa ditawar oleh aturan gaya", L386-387); (b) merupakan ambang lint yang memblokir rilis (DT-42, L3931); (c) menyandang makna semantik tetap (tanda provenans, warna klasifikasi, pola ID); atau (d) dirumuskan manual sebagai "tidak pernah"/"dilarang". Nilai gaya rumah (warna, ukuran, wajah huruf, urutan) menjadi **B**. Nilai yang manual hitung dari nilai lain menjadi **T**.

### 0.3 Keterbatasan metode (celah yang diakui)

1. Berkas .docx `Manual_Komprehensif_DATUM_GSP_000-GSP-STD-X-2026_RevA.docx` **tidak dibuka**. Sebab: agen ini hanya memiliki alat Read, Glob, Grep, dan Write; tidak ada alat eksekusi shell atau Python, sehingga python-docx tidak bisa dijalankan dan Read tidak mengurai .docx. Ambiguitas diputus lewat tokens.json, kode skill, dan pencocokan jumlah baris. Daftar butir yang wajib dicek ke .docx ada di 7.3.
2. pdftotext menggeser kolom pada Tabel 4.2, 4.4, 4.5, 5.3, 7.5, 10.1, 15.1, 16.1, 17.2, A.1, dan B.1. Rekonstruksi ditandai `[REK]`.
3. Glif provenans, tanda ±, ×, ≥, ≤, dan ° tampil sebagai U+FFFD. Glif provenans diambil dari TK104-107. Pembanding ambang juri (Tabel 14.2, 14.3) sebagian `[TAK TERBACA]`.

## 1. Exploration and Collection Summary

| Butir | Hasil | Bukti |
|---|---|---|
| Panjang manual | 5058 baris teks, 102 lembar | L5057 "LEMBAR 102 DARI 102" |
| Ruang nama aturan | DT 44, CH 14, SM 12, SG 68 = 138 aturan | L236-247, Lampiran A L4555-4874 |
| Pustaka chart | 58 jenis bergambar dalam 6 kelompok (P15, H9, K12, W10, S8, G4) + 18 jenis tercatat tidak digambar | L1575-1584, Tabel 8.1-8.5 L1598-1872 |
| Keluarga diagram | 9 keluarga, 7 mesin tata letak, 10 bentuk simpul, 6 jenis penghubung | L2136-2210, DD125-165 |
| Lint DATUM | 38 di manual (27 berkas, 7 bangun, 4 mata); 39 di kode (DATUM-39 baru) | L3927-4021, LT36-74, SK72 |
| tokens.json | v2.0.0 "REBUILD lini baru, BUKAN salinan tokens.json 1.8 Rev J" | TK4-6 |
| Total parameter dikatalogkan | 673 | Jumlah per tabel 2.x |
| Jenis section | 29 section dokumen + 7 perangkat halaman + 15 section kanal lain = 51 entri registri | Bagian 3 |
| Pemeriksaan otomatis untuk HQ | 83 (80 penuh, 3 sebagian) | Bagian 5 |
| Konflik dan celah tercatat | 34 | Bagian 6 |

## 2. Overview

Manual DATUM memisahkan tiga lapis yang harus menjadi tiga lapis skema HQ: **token bentuk** (Bab 4, warna, huruf, grid, garis), **aparatus bukti** (Bab 5-6, tanda provenans, register kuantitas, turunan, klasifikasi, satuan), dan **aturan isi** (Bab 7-14, chart, diagram, simbol, bahasa). Gerbang rilis (Bab 16) mengikat ketiganya. Implikasi utama bagi HQ: karena dokumen HQ disimpan terstruktur di DB dan dirender dari template, sebagian besar pemeriksaan yang di manual dijalankan setelah berkas jadi dapat dipindah ke saat penyusunan (by construction). Contohnya garis tegak tabel (lint 07) dan baris tanpa SUMBER (lint 10) menjadi mustahil secara skema. Yang tetap butuh manusia adalah penilaian makna: uji lima detik, kebenaran diagram, rubrik juri, dan uji fotokopi fisik.

## 3. Katalog parameter per bab

### 3.1 Bab 1-2: tata kelola (4 parameter)

| ID | Kunci | Tipe | Default DATUM | Rentang / enum | Aturan | Sumber | Kelas |
|---|---|---|---|---|---|---|---|
| P1-01 | `governance.precedence` | list | [regulasi-kontrak, kepatuhan-DATUM, bentuk-DATUM, isi-pilihan, edisi-terbaru] | urutan tetap 5 butir | Hierarki 2.5, SM-02 | L379-398 | K |
| P1-02 | `governance.decisionOwners` | map | isi: spesialis; perlu-ada gambar: PRISMA; angka: veritas; bentuk: DATUM; kalimat: Gaya Ahli; hidup berkas: ARSIP/LOKUS/KRONIK | peran tetap | 2.4 | L355-360 | K |
| P1-03 | `governance.tokensOverrideProse` | bool | true | true | DT-03 | L285-287, L490, TK2 | K |
| P1-04 | `content.authorClaimMarks` | enum | TERUKUR / DITURUNKAN / ASUMSI | 3 nilai | Konvensi 1.5 | L260-263 | K |

### 3.2 Bab 3: tier, alur bangun, penamaan, penomoran (24 parameter)

| ID | Kunci | Tipe | Default DATUM | Rentang / enum | Aturan | Sumber | Kelas |
|---|---|---|---|---|---|---|---|
| P3-01 | `artifact.tier` | enum | NOTA | NOTA, TERBIT, SERAH | DT-02 | L417-428 | B (naik wajib dibenarkan) |
| P3-02 | `artifact.tierJustification` | string | kosong | wajib bila tier bukan NOTA | DT-02 | L428 | B |
| P3-03 | `artifact.audience.outsideDivision` | bool | false | true/false | Uji satu kalimat | L430-431 | B |
| P3-04 | `artifact.tierSuggested` | enum | NOTA | dari P3-03: false menjadi NOTA | 3.1 | L430-431 | T |
| P3-05 | `artifact.format` | enum | md (NOTA), docx (TERBIT) | md, docx, xlsx, pptx, svg, png, pdf, html | 3.3 | L419-425, L469-488 | B (dibatasi tier) |
| P3-06 | `artifact.pdf.enabled` | bool | NOTA false, TERBIT false kecuali diminta, SERAH true | true/false | Tabel 3.1 | L419-425 | T (B hanya untuk TERBIT) |
| P3-07 | `artifact.pageReconciliation.enabled` | bool | SERAH saja | true/false | Tabel 3.1 | L419-425 | T |
| P3-08 | `artifact.lint.enabled` | bool | NOTA false, TERBIT/SERAH true | true/false | Tabel 3.1, DT-42 | L419-425 | T |
| P3-09 | `naming.underscore.allowed` | bool | false | false | DT-12, lint 38 | L506-512 | K |
| P3-10 | `naming.folder.pattern` | string | `NN Judul Kapital` (urut dua digit, spasi) | pola | Tabel 3.3 | L521 | B |
| P3-11 | `naming.file.pattern` | string | `{judul} {nomorBerkas}` | dari P3-18 dan judul | Tabel 3.3 | L524 | T |
| P3-12 | `naming.sheet.pattern` | string | KAPITAL, tanda hubung (HITUNG-KABEL) | pola | Tabel 3.3 | L527 | B |
| P3-13 | `naming.sheet.maxChars` | int | 31 | 1-31 | Tabel 3.3 | L527 | K |
| P3-14 | `naming.artifactId.pattern` | string | `{Jenis} {bab}.{urut}` (Tabel 4.1, Gambar 5.2) | kata, spasi, nomor | Tabel 3.3 | L530, L132-133 | K |
| P3-15 | `naming.engineeringId.separator` | string | `-` (REQ-FO-05, K-01) | `-` | Tabel 3.3 | L533 | K |
| P3-16 | `naming.figureFile.fromCaption` | bool | true (`Gambar 4.2 Arsitektur.svg`) | true | 3.5 | L536, L540 | T |
| P3-17 | `numbering.scope` | enum | perChapter | perChapter | 1.6 catatan daftar isi | L132-133 | K |
| P3-18 | `doc.number` | string | `{urut}/GSP/{kodeJenis}/{bulanRomawi}/{tahun}` | dari Register Induk | DT-04 | L1138-1141, L550 | K |
| P3-19 | `doc.number.fileForm` | string | garis miring diganti tanda hubung | dari P3-18 | 6.3 | L1140-1142 | T |
| P3-20 | `doc.typeCode` | enum | DATUM: KT, PT, RAB, SPH, SP, BA, DS; ARSIP menambah DEK, LAP, MAT, STD, NOT, MOD, VER, tanpa DS | daftar tertutup | 6.3, E-21 | L1142-1145 | K (konflik K-15) |
| P3-21 | `doc.monthRoman` | string | dari tanggal (Perkap 1/2023) | I-XII | 6.3 | L1139-1140 | T |
| P3-22 | `doc.revision` | string | A | huruf revisi ARSIP | 3.6 | L17, L548-551 | K |
| P3-23 | `doc.language` | enum | ID | ID, EN (EN: usulan P-08 belum berlaku) | R-16 | L20, L4298-4300, L4488 | B |
| P3-24 | `doc.changeLog.required` | bool | true (apa, mengapa, dampak) | true | 3.6 | L550-551 | K |

Jumlah: 24.

### 3.3 Bab 4: warna, tipografi, grid, perangkat halaman (225 parameter)

#### 3.3.1 Warna (35 parameter)

Kolom TUGAS Tabel 4.2 tergeser satu baris mulai ink700 (L630-638). Rekonstruksi dicocokkan ke peran warna pada skala huruf TK62-74 dan cocok penuh untuk ink700 sampai verd.

| ID | Kunci | Tipe | Default | Tugas | Aturan | Sumber | Kelas |
|---|---|---|---|---|---|---|---|
| P4C-01 | `color.wrapper.paper` | hex | #FBFAF7 | Kertas sampul dan pembatas | DT-05 | L615, TK16 | B |
| P4C-02 | `color.wrapper.ink` | hex | #14110F | Judul dan nilai blok kendali | - | L616, TK17 | B |
| P4C-03 | `color.wrapper.body` | hex | #33302C | Prosa pembungkus | - | L617, TK18 | B |
| P4C-04 | `color.wrapper.meta` | hex | #7A756E | Label, alamat, string punggung | - | L618, TK19 | B |
| P4C-05 | `color.wrapper.rule` | hex | #C4BEB4 | Garis rambut pembungkus | - | L619, TK20 | B |
| P4C-06 | `color.wrapper.seal` | hex | #6E1420 | Pita segel dan klasifikasi saja | - | L620, L595, TK21 | B |
| P4C-07 | `color.wrapper.cream` | hex | #F6E9E9 | Tidak disebut manual | - | TK22 saja | B (konflik K-03) |
| P4C-08 | `color.interior.paper` | hex | #FCFCFB | Kertas badan | DT-05 | L623, TK25 | B |
| P4C-09 | `color.interior.ink900` | hex | #101418 | Judul, garis utama, setiap numeral | - | L624, TK26 | B |
| P4C-10 | `color.interior.ink700` | hex | #2B3640 | Prosa badan; tidak pernah hitam murni [REK] | - | L631-632, TK27 | B |
| P4C-11 | `color.interior.ink400` | hex | #6B7783 | Label, caption, baris sumber, rel [REK] | - | L632-633, TK28 | B |
| P4C-12 | `color.interior.ink200` | hex | #C3CBD1 | Garis rambut dan pemisah baris [REK] | - | L633-634, TK29 | B |
| P4C-13 | `color.interior.ink100` | hex | #EFF2F4 | Zebra di atas 12 baris, pita workbook (E-07) [REK] | - | L634-635, TK30 | B (konflik K-07) |
| P4C-14 | `color.interior.signal` | hex | #B45309 | Satu-satunya aksen; tanda DITURUNKAN [REK] | - | L635-636, TK31 | B |
| P4C-15 | `color.interior.alert` | hex | #9B1C1C | Rahasia, ASUMSI, batas terlampaui [REK] | - | L636-637, TK32 | B |
| P4C-16 | `color.interior.verd` | hex | #2F6F6B | Jalur verifikasi, tautan sheet, arah membaik [REK] | R-02 | L637-638, L646, TK33 | B |
| P4C-17 | `color.interior.link` | hex | #0563C1 | Tidak disebut manual | - | TK34 saja | B (konflik K-04) |
| P4C-18 | `color.brief.ground` | hex | #0E1216 | Latar slide gelap bila diminta | DT-05 | L642, TK37 | B |
| P4C-19 | `color.brief.accent` | hex | #D98324 | Aksen pada latar gelap | - | L644, TK38 | B |
| P4C-20 | `color.retired` | list hex | [#1A2B4A, #C9A84C] | dilarang dipakai | DT-07 | L648-651, TK41-42 | K |
| P4C-21 | `color.maxValuesPerPage` | int | 5 | 1-5 | DT-06, lint 14 | L648-649, L3966 | K |
| P4C-22 | `color.decorative.allowed` | bool | false | false | DT-06, lint 12 | L649, L3962 | K |
| P4C-23 | `page.background` | enum | light | light, dark | DT-05 | L600-607 | B (dark wajib P4C-24) |
| P4C-24 | `page.darkRequestReason` | string | kosong | wajib bila dark: pusat komando, HUD, mode gelap, layar 24 jam, register klien | DT-05 | L604-607 | B |
| P4C-25 | `color.role.heading` | tokenRef | ink900 | token palet | 4.3 | L624 | B |
| P4C-26 | `color.role.numeral` | tokenRef | ink900 | token palet | 4.3 | L624 | B |
| P4C-27 | `color.role.body` | tokenRef | ink700 | token palet | 4.3 | L632 [REK] | B |
| P4C-28 | `color.role.label` | tokenRef | ink400 | token palet | 4.3 | L633 [REK] | B (konflik K-08) |
| P4C-29 | `color.role.hairline` | tokenRef | ink200 | token palet | 4.3 | L634 [REK] | B |
| P4C-30 | `color.role.zebra` | tokenRef | ink100 | token palet | DT-18 | L635, L877 | B |
| P4C-31 | `color.role.accent` | tokenRef | signal | satu per halaman/gambar | CH-03 | L636, L1388 | B (jumlah: K) |
| P4C-32 | `color.role.alert` | tokenRef | alert | token palet | CH-11 | L637, L1411-1412 | B |
| P4C-33 | `color.role.verify` | tokenRef | verd | token palet | CH-11 | L638, L1413 | B |
| P4C-34 | `color.body.pureBlack.allowed` | bool | false | false | 4.3 | L632 | K |
| P4C-35 | `color.classificationInk` | map | SR, R: alert; T, B: ink900 | tetap | DT-28 | L1089-1091, L817 | K |

#### 3.3.2 Tipografi dasar (18 parameter)

| ID | Kunci | Tipe | Default | Rentang / enum | Aturan | Sumber | Kelas |
|---|---|---|---|---|---|---|---|
| P4T-01 | `type.face.serif` | string | IBM Plex Serif | nama fon | DT-08 | L661, TK48 | B |
| P4T-02 | `type.face.condensed` | string | IBM Plex Sans Condensed | nama fon | DT-08 | L659, TK49 | B |
| P4T-03 | `type.face.mono` | string | IBM Plex Mono | nama fon | DT-08 | L663, TK50 | B |
| P4T-04 | `type.face.workbookUi` | string | IBM Plex Sans | nama fon | DT-08 | L665, TK51 | B |
| P4T-05 | `type.face.symbolGlyph` | string | DejaVu Sans | nama fon | R-14 | L667-670, L4291-4292 | B (tidak ada di tokens, konflik K-18) |
| P4T-06 | `type.role.structural.weights` | list int | [400, 600] | 400, 600 | Tabel 4.3 | L659, TK54 | B |
| P4T-07 | `type.role.reading.weights` | list | [400, 600, italic] | 400, 600, italic | Tabel 4.3 | L661, TK55 | B |
| P4T-08 | `type.role.data.weights` | list int | [400, 600] | 400, 600 | Tabel 4.3 | L663, TK56 | B |
| P4T-09 | `type.role.workbookUi.weights` | list int | [400, 600] | 400, 600 | Tabel 4.3 | L665, TK57 | B |
| P4T-10 | `type.role.structural.fallback` | string | Segoe UI Semibold | nama fon | Tabel 4.3 | L659, TK54 | B |
| P4T-11 | `type.role.reading.fallback` | string | Georgia | nama fon | Tabel 4.3 | L661, TK55 | B |
| P4T-12 | `type.role.data.fallback` | string | Consolas | nama fon | Tabel 4.3 | L663, TK56 | B |
| P4T-13 | `type.role.workbookUi.fallback` | string | Arial Narrow | nama fon | Tabel 4.3 | L665, TK57 | B |
| P4T-14 | `type.forbiddenBodyFaces` | list | [Calibri, Times New Roman, Aptos, Arial] | daftar larangan | DT-08, lint 05 | L670, TK43 | K |
| P4T-15 | `type.tracking.displayTighter` | em | -0,012 | angka | - | TK59 saja | B |
| P4T-16 | `type.tracking.microLabelWider` | em | 0,09 | angka | - | TK59, L703 | B |
| P4T-17 | `type.baselinePt` | pt | 13,5 | angka positif | DT-10 | L682, L722, TK60 | B (menggerakkan P4G-10) |
| P4T-18 | `type.fontEmbedding` | map | docx: tanam (embed_fonts.py); xlsx/pptx: kirim assets/fonts + PASANG-DULU.txt; pdf: tanam dan subset | tetap per format | DT-09 | L674-678 | K |

#### 3.3.3 Skala huruf (13 unsur, 67 parameter)

Kolom WARNA Tabel 4.4 tergeser (L685-703). Urutan 13 nilai warna yang terbaca (ink900, signal, ink900, ink700, ink700, ink900, ink400, ink700, ink400, ink400, ink400, ink400, ink900) cocok 13 dari 13 dengan TK62-74. Setiap sel terisi adalah satu parameter `type.scale.{unsur}.{atribut}`, kelas B kecuali disebut lain.

| ID | Unsur (`type.scale.*`) | size pt | leading pt | upper | trackEm | face | weight | colour | tabular | Jumlah | Sumber |
|---|---|---|---|---|---|---|---|---|---|---|---|
| P4T-S01 | `chapterTitle` | 16 | 20 | - | - | condensed | 600 | ink900 | - | 5 | L686, TK62 |
| P4T-S02 | `chapterKicker` | 6,8 | - | true | 0,16 | condensed | 600 | signal | - | 6 | L693, TK63 |
| P4T-S03 | `sectionHeading` | 11 | 13,5 | - | - | condensed | 600 | ink900 | - | 5 | L695, TK64 |
| P4T-S04 | `body` | 9,5 | 13,5 | - | - | serif | 400 | ink700 | - | 5 | L697, L832, TK65 |
| P4T-S05 | `tableBody` | 8,2 | 11,5 | - | - | serif | 400 | ink700 | - | 5 | L699, TK66 |
| P4T-S06 | `tableNumerals` | 7,8 | - | - | - | mono | 400 | ink900 | true | 5 | L701, TK67 |
| P4T-S07 | `tableHeader` | 6,8 | - | true | 0,09 | condensed | 600 | ink400 | - | 6 | L703, L869, TK68 |
| P4T-S08 | `caption` | 7,6 | 11 | - | - | condensed | 400 | ink700 | - | 5 | L705, TK69 |
| P4T-S09 | `sourceLine` | 6,6 | 9 | - | - | condensed | 400 | ink400 | - | 5 | L707, TK70 |
| P4T-S10 | `evidenceRail` | 5,9 | 8,4 | true | - | mono | 400 | ink400 | - | 6 | L709, TK71 |
| P4T-S11 | `runningHead` | 6,8 | - | true | - | condensed | 400 (manual) / 500 (token) | ink400 | - | 5 | L711, L717, TK72 (konflik K-05) |
| P4T-S12 | `registerBlock` | 6,2 | - | - | - | mono | 400 | ink400 | - | 4 | L713, TK73 |
| P4T-S13 | `derivation` | 7,4 | 11,5 | - | - | mono | 400 | ink900 | - | 5 | L715, TK74 |

Jumlah: 67.

#### 3.3.4 Unsur huruf yang hanya ada di prosa manual (14 parameter, tidak ada di tokens.json)

| ID | Kunci | Tipe | Default | Rentang | Aturan | Sumber | Kelas |
|---|---|---|---|---|---|---|---|
| P4T-X01 | `type.scale.groupBand.size` | pt | 7,4 | angka | 5.1 | L871 | B |
| P4T-X02 | `type.scale.groupBand.upper` | bool | true | bool | 5.1 | L871 | B |
| P4T-X03 | `type.scale.groupBand.faceWeight` | string | condensed 600 | face+weight | 5.1 | L838, L871 | B |
| P4T-X04 | `type.scale.groupBand.colour` | tokenRef | ink900 | token | 5.1 | L871 | B |
| P4T-X05 | `type.scale.unitColumn.size` | pt | 7,2 | angka | DT-17 | L875 | B |
| P4T-X06 | `type.scale.unitColumn.face` | string | condensed (bobot `[TAK TERBACA]`: tidak dinyatakan) | face | DT-17 | L875 | B |
| P4T-X07 | `type.scale.unitColumn.colour` | tokenRef | ink400 | token | DT-17 | L875 | B |
| P4T-X08 | `type.scale.asideBody.size` | pt | 8,6 | angka | DT-20 | L930 | B |
| P4T-X09 | `type.scale.asideLabel.style` | string | condensed kapital | face+upper | DT-20 | L929-930 | B |
| P4T-X10 | `type.scale.sectionNumber.face` | string | mono | face | Tabel 4.7 no. 6 | L830 | B |
| P4T-X11 | `type.scale.sectionNumber.colour` | tokenRef | ink400 | token | Tabel 4.7 no. 6 | L830 | B |
| P4T-X12 | `type.body.align` | enum | justify (rata kiri-kanan) | left, justify | Tabel 4.7 no. 7 | L832 | B |
| P4T-X13 | `type.body.measureChars` | range int | 66-80 | 66-80 | DT-10, lint 15 | L724-725, L3968 | K |
| P4T-X14 | `type.heading.form` | enum | label (bukan pertanyaan) | label | DT-38, lint 04, R-19 | L823, L3946, L4309-4311 | K |

Subtotal tipografi: 18 + 67 + 14 = 99.

#### 3.3.5 Grid halaman (17 parameter)

| ID | Kunci | Tipe | Default | Rentang / rumus | Aturan | Sumber | Kelas |
|---|---|---|---|---|---|---|---|
| P4G-01 | `page.sizeMm` | [mm, mm] | [210, 297] | A4; selain A4 memicu P4G-17 | DT-10 | L721, L740-741, TK80 | B |
| P4G-02 | `grid.innerMarginMm` | mm | 24 | angka | DT-10 | L721, TK81 | B |
| P4G-03 | `grid.textColumnMm` | mm | 128 | angka | DT-10 | L721, TK82 | B |
| P4G-04 | `grid.gutterMm` | mm | 6 | angka | DT-10 | L722, TK83 | B |
| P4G-05 | `grid.evidenceRailMm` | mm | 32 | angka atau 0 (moda B) | DT-10 | L722, TK84, SK38-44 | B |
| P4G-06 | `grid.outerMarginMm` | mm | 20 | angka | DT-10 | L722, TK85 | B |
| P4G-07 | `grid.fullSpanMm` | mm | 166 | = textColumn + gutter + rail | D-4.1 | L734-735, TK86 | T |
| P4G-08 | `grid.subcolumns` | int | 12 | int | D-4.1 | L736, TK89 | B |
| P4G-09 | `grid.latticeXMm` | mm | 10,6667 | = textColumn / subcolumns | D-4.1 | L736, TK87, DD100 | T |
| P4G-10 | `grid.latticeYMm` | mm | 4,7625 | = baselinePt x 25,4 / 72 | D-4.1 | L737, TK88, DD102 | T |
| P4G-11 | `grid.textBlockHeightMm` | mm | 247 | gambar lebih tinggi ditolak | lint 33 | L4009, DD113 | K |
| P4G-12 | `grid.topBottomMarginMm` | mm | `[TAK TERBACA]`: tidak dinyatakan di manual maupun tokens; hanya selisih 297 - 247 = 50 mm yang tersirat | - | - | L4009 (tersirat) | B (celah G-03) |
| P4G-13 | `grid.allowedFigureWidthsMm` | list mm | [128, 166] | = [textColumn, fullSpan] | DT-36 | L739-740, L2122, DD104 | T (keanggotaan: K) |
| P4G-14 | `grid.verticalRhythm.multipleOfBaseline` | bool | true (judul, baris tabel, tinggi gambar, blok caption) | true | DT-10 | L722-724, L739 | K |
| P4G-15 | `grid.pageWidthCheck` | mm | 210 = 24 + 128 + 6 + 32 + 20 | harus sama dengan lebar halaman | D-4.1 | L733-734 | T |
| P4G-16 | `layout.railMode` | enum | A (rel 32 mm) bila ada sitasi per paragraf; B (margin 20 mm, teks 166 mm) bila nol | A, B | RAIL-BUKTI-DUA-MODA | SK36-49 | T (konflik K-11) |
| P4G-17 | `grid.rederiveForNonA4` | bool | true | bila halaman bukan A4, semua turunan dihitung ulang | D-4.1 | L740-741 | T |

#### 3.3.6 Tebal garis (15 parameter)

Kolom WARNA Tabel 4.5 tergeser (L743-748); urutan 4 warna ink900, ink400, ink200, ink900 dipasangkan ke 4 baris. Tiga baris pertama terkonfirmasi Tabel 5.1 (L863-867); warna batang revisi tetap `[REK]`.

| ID | Kunci | Tipe | Default | Pemakaian | Aturan | Sumber | Kelas |
|---|---|---|---|---|---|---|---|
| P4R-01 | `rules.primaryMm` | mm | 0,45 | di atas kepala tabel, di atas total, datum bab | DT-16 | L745, L863, TK93 | B (>= 0,18: K) |
| P4R-02 | `rules.primary.colour` | tokenRef | ink900 | | | L744-745, L863 | B |
| P4R-03 | `rules.belowHeaderMm` | mm | 0,25 | di bawah kepala tabel | DT-16 | L746, L865, TK94 | B |
| P4R-04 | `rules.belowHeader.colour` | tokenRef | ink400 | | | L746, L865 | B |
| P4R-05 | `rules.hairMm` | mm | 0,20 (terpasang 0,22 di docx, E-05) | pemisah baris, garis kepala halaman, garis sumber | DT-16 | L747, L757, TK95, TK100 | B (konflik K-06) |
| P4R-06 | `rules.hair.colour` | tokenRef | ink200 | | | L747, L867 | B |
| P4R-07 | `rules.revisionBarMm` | mm | 0,50 | batang revisi di rel bukti | - | L748, TK96 | B |
| P4R-08 | `rules.revisionBar.colour` | tokenRef | ink900 `[REK]` | | | L748 | B |
| P4R-09 | `rules.photocopyFloorMm` | mm | 0,18 (0,51 pt) | lantai garis apa pun | DT-11, lint 21/27 | L755, L1215, TK97 | K |
| P4R-10 | `rules.tintsPercent` | list | [15, 30] | hanya dua rona | DT-11, lint 21 | L757, L1216, TK99 | K |
| P4R-11 | `rules.wordLadderSz` | list | [5, 6, 8, 10, 11] (per 1/8 pt) | kuantisasi Word | - | TK98, TK100 | T (renderer docx) |
| P4R-12 | `rules.asideTopMm` | mm | 0,35 | garis atas aside | DT-20 | L929, TK100 (sz8) | B |
| P4R-13 | `rules.derivationLeftMm` | mm | 0,45 | garis kiri blok turunan | DT-24 | L994 | B |
| P4R-14 | `rules.derivationLeft.colour` | tokenRef | signal (amber) | | | L844, L994 | B |
| P4R-15 | `rules.diagramFillHatchDeg` | list | [45, 135]; tidak pernah rona abu-abu | arsir isian diagram | DT-11 | L1217-1218, DD1216-1220 | K |

#### 3.3.7 Enam perangkat tanda tangan (27 parameter)

| ID | Kunci | Tipe | Default | Rentang | Aturan | Sumber | Kelas |
|---|---|---|---|---|---|---|---|
| P4S-01 | `device.datumRule.enabled` | bool | true | bool | DT-13 | L765 | B |
| P4S-02 | `device.datumRule.weightMm` | mm | 0,20 | = rules.hairMm | DT-13 | L765 | T |
| P4S-03 | `device.datumRule.ticks` | int | 12 batas kolom | = grid.subcolumns | DT-13 | L765, L821 | T |
| P4S-04 | `device.datumRule.frontSegmentMm` | mm | 9 (pejal) | angka | Tabel 4.7 no. 4 | L821 | B |
| P4S-05 | `device.datumRule.pdfProgressMeter` | bool | true | bool | DT-13 | L765-766 | B |
| P4S-06 | `device.datumRule.placements` | list | [atas judul bab, sampul, pembatas]; di interior hanya atas judul bab | subset | Tabel 4.6-4.7 | L765-766, L821 | B |
| P4S-07 | `device.evidenceRail.enabled` | bool/mode | true (lihat P4G-16) | bool | DT-13 | L768 | B (konflik K-11) |
| P4S-08 | `device.evidenceRail.contents` | list | [tanda, digraf Admiralty, sumber, REQ, batang revisi] | subset | Tabel 4.6 | L768-769, L834 | B |
| P4S-09 | `device.evidenceRail.emptyAllowed` | bool | true | bool | DT-43 | L784-785, L4649 | K (konflik K-11) |
| P4S-10 | `device.registerBlock.enabled` | bool | true | setiap halaman interior | DT-13 | L769, L846 | B |
| P4S-11 | `device.registerBlock.cells` | list | [GSP · nomor, REV · tanggal, LEMBAR n DARI N, kelas] | 4 sel mono | Tabel 4.6 | L771-772, L212 | B |
| P4S-12 | `device.registerBlock.separator` | string | spasi tak-putus | NBSP | 4.7 | L786-788 | K |
| P4S-13 | `device.registerBlock.boldFields` | list | [nomor dokumen, nomor lembar] | subset | 4.7 | L787 | B |
| P4S-14 | `device.registerBlock.sheetFromPageField` | bool | true (medan NUMPAGES, E-06) | true | Tabel 4.7 no. 14 | L846, L4348 | K |
| P4S-15 | `device.sealBand.enabled` | bool | true, halaman pembungkus saja | bool | DT-13 | L774 | B |
| P4S-16 | `device.sealBand.heightMm` | mm | 5 | angka | Tabel 4.6 | L774 | B |
| P4S-17 | `device.sealBand.colour` | tokenRef | seal | token | Tabel 4.6 | L774, L620 | B |
| P4S-18 | `device.sealBand.leftContent` | enum | klasifikasi | tetap | Tabel 4.6 | L774 | K |
| P4S-19 | `device.sealBand.rightContent` | enum | kendali salinan bernomor | tetap | Tabel 4.6, 6.1 | L774, L1095-1097 | K |
| P4S-20 | `device.spine.enabled` | bool | true | bool | DT-13 | L777 | B |
| P4S-21 | `device.spine.face` | tokenRef | mono | token | Tabel 4.6 | L777 | B |
| P4S-22 | `device.spine.sizePt` | pt | 6 | angka | Tabel 4.6 | L777 | B |
| P4S-23 | `device.spine.rotationDeg` | deg | 90 | 0, 90 (python-docx mencetak mendatar) | Tabel 4.6 | L777, L4525-4526 | B |
| P4S-24 | `device.spine.fields` | list | [jenis, subjek, bahasa, revisi, bulan, tahun] | subset urut | Tabel 4.6 | L777-778, L23 | B |
| P4S-25 | `device.spine.placements` | list | [margin luar sampul, pembatas] | subset | Tabel 4.6 | L777 | B |
| P4S-26 | `device.issueStamp.format` | string | `// {YYYYMMDD} {BAHASA} {KELAS} -- TERBITAN {n}` | pola, tanpa U+2014 | Tabel 4.6 | L780, L22, SK106-109 | B |
| P4S-27 | `device.issueStamp.issueNumber` | int | 1 | >= 1 | Tabel 4.6 | L22, L780 | T (dari ARSIP) |

#### 3.3.8 Sampul (16 parameter)

| ID | Kunci | Tipe | Default | Rentang | Aturan | Sumber | Kelas |
|---|---|---|---|---|---|---|---|
| P4V-01 | `cover.align` | enum | left | left | DT-14, lint 06 | L792, L3950 | K |
| P4V-02 | `cover.leftMarginMm` | mm | 24 | = grid.innerMarginMm | DT-14 | L792 | T |
| P4V-03 | `cover.elementOrder` | list | [pita segel, logo, baris alamat di atas garis rambut, ruang putih, Datum Rule 166 mm, kicker jenis dokumen, judul, standfirst, baris cakupan, blok kendali, kolofon, string punggung] | permutasi | 4.8 | L792-796 | B |
| P4V-04 | `cover.logo.maxOccurrencesPerDocument` | int | 1 | 1 | DT-14, 16.4 | L793, L4093 | K |
| P4V-05 | `cover.addressLine` | string | "Divisi Engineering & Technical Intelligence · Jl. Bangka Raya No. 27 ..." | teks | 4.8 | L3, L793 | B |
| P4V-06 | `cover.title.sizePt` | range pt | 24-26 | 24-26 | 4.8 | L795 | B |
| P4V-07 | `cover.kicker.colour` | tokenRef | seal (marun) | token | 4.8 | L794-795 | B |
| P4V-08 | `cover.kicker.text` | string | jenis dokumen ("STANDAR · MANUAL KOMPREHENSIF · ...") | teks | 4.8 | L5, L794 | B |
| P4V-09 | `cover.standfirst.italic` | bool | true | bool | 4.8 | L795 | B |
| P4V-10 | `cover.scopeLine` | string | baris cakupan sumber | teks | 4.8 | L14-15, L796 | B |
| P4V-11 | `cover.datumRule.widthMm` | mm | 166 | = grid.fullSpanMm | 4.8 | L794 | T |
| P4V-12 | `cover.controlBlock.fields` | list | [NOMOR DOKUMEN, REVISI, PENYUSUN, KUSTODIAN, DITUJUKAN KEPADA, TIER, DASAR, BAHASA] | subset urut | 4.8 | L17-20, L796 | B |
| P4V-13 | `cover.colophon.fields` | list | [entitas, NIB, cap terbit, klasifikasi] | subset | 4.8 | L22, L796 | B |
| P4V-14 | `wrapper.header` | pair string | kiri "KLASIFIKASI · {kelas}", kanan "SALINAN INDUK · PENGGUNAAN INTERNAL GSP" | teks | 4.1 | L1, L24 | B |
| P4V-15 | `org.entityName` | string | PT GEMILANG SATRIA PERKASA | teks | - | L22 | B |
| P4V-16 | `org.nib` | string | 9120208940517 | teks | - | L22 | B |

#### 3.3.9 Lembar kendali (6 parameter)

| ID | Kunci | Tipe | Default | Aturan | Sumber | Kelas |
|---|---|---|---|---|---|---|
| P4K-01 | `controlSheet.revisionHistory.columns` | list | [REV, TANGGAL, PENYUSUN, PERUBAHAN, STATUS] | 4.8 | L32-38, L797 | B |
| P4K-02 | `controlSheet.verificationChain` | object | 3 lapis (V1 baca baris per baris, V2 eksekusi, V3 render dan periksa); kolom [LAPIS, METODE, OBJEK, HASIL] | 4.8 | L40-51, L797 | B (jumlah lapis 3: K) |
| P4K-03 | `controlSheet.methodStatement.required` | bool | true | 4.8 | L53-59, L797 | K |
| P4K-04 | `controlSheet.distribution.columns` | list | [SALINAN, PEMEGANG, MEDIA, KEMBALI] | 4.8 | L61-69 | B |
| P4K-05 | `controlSheet.signatures.roles` | list | [DISUSUN, DIPERIKSA, DISAHKAN] | 4.8 | L71-73, L798 | B (tiga kolom: K) |
| P4K-06 | `controlSheet.signatures.holders` | list | [Divisi Engineering, Kendali Mutu, Direktur Utama] | - | L73 | B |

#### 3.3.10 Anatomi halaman interior, Tabel 4.7 (10 parameter)

| ID | Kunci | Tipe | Default | Aturan | Sumber | Kelas |
|---|---|---|---|---|---|---|
| P4A-01 | `runningHead.fields` | list | [entitas, jenis dokumen, BAB n, judul bab] | Tabel 4.7 no. 1 | L147, L815 | B |
| P4A-02 | `runningHead.classification.position` | enum | right | Tabel 4.7 no. 2 | L817 | K |
| P4A-03 | `runningHead.ruleBelow` | tokenRef | rules.hair | Tabel 4.5, 4.7 | L747, L815 | T |
| P4A-04 | `chapter.kicker.pattern` | string | `BAB {n}` kapital amber renggang | Tabel 4.7 no. 3 | L819 | B |
| P4A-05 | `chapter.datumRule.onlyAboveChapterTitle` | bool | true | Tabel 4.7 no. 4 | L821 | K |
| P4A-06 | `caption.position` | enum | above | DT-15 | L836, L888 | K |
| P4A-07 | `source.position` | enum | below, di bawah garis rambut | DT-15 | L842, L888-889 | K |
| P4A-08 | `table.totalRow.style` | object | garis tebal (primary) di atas, tanpa isian, condensed 600 | Tabel 4.7 no. 11, 5.1 | L840, L879 | K |
| P4A-09 | `table.groupBand.fill` | enum | none | Tabel 4.7 no. 10 | L838, L871 | K |
| P4A-10 | `registerBlock.position` | enum | footer setiap halaman interior | Tabel 4.6 | L769 | K |

Subtotal Bab 4: 35 + 99 + 17 + 15 + 27 + 16 + 6 + 10 = 225.

### 3.4 Bab 5: tabel dan aparatus bukti (68 parameter)

| ID | Kunci | Tipe | Default | Rentang / enum | Aturan | Sumber | Kelas |
|---|---|---|---|---|---|---|---|
| P5-01 | `table.verticalRules.allowed` | bool | false | false | DT-16, lint 07 | L881, L3952 | K |
| P5-02 | `table.headerFill.allowed` | bool | false | false | DT-16, lint 08 | L881-882, L3954 | K |
| P5-03 | `table.header.verticalAlign` | enum | bottom | bottom | 5.1 | L869 | B |
| P5-04 | `table.numeral.align` | enum | right + decimal; tidak pernah center | right, decimal | DT-17 | L873 | K |
| P5-05 | `table.unitColumn.required` | bool | true (tabel data) | true | DT-17, lint 09 | L875, L3956 | K |
| P5-06 | `table.unitInHeader.singleUnitException` | bool | false; true hanya untuk tabel ringkas bersatuan tunggal | bool | R-07 | L4260-4263 | B |
| P5-07 | `table.zebra.minRows` | int | 12 (zebra hanya bila lebih dari 12 baris) | > 12 | DT-18 | L877, L3887 | K |
| P5-08 | `table.zebra.colour` | tokenRef | ink100 | token | DT-18 | L877 | B (konflik K-07) |
| P5-09 | `table.zebra.onPrintedBoq` | bool | false | false | DT-18, R-06 | L877, L4256-4258 | K |
| P5-10 | `table.totalRow.ruleAbove` | tokenRef | rules.primary | - | 5.1 | L745, L879 | T |
| P5-11 | `table.totalRow.fill` | enum | none | none | 5.1 | L879 | K |
| P5-12 | `table.header.repeatEachPage` | bool | true | true | 5.1 | L884 | K |
| P5-13 | `table.row.splitAcrossPages` | bool | false | false | 5.1 | L884 | K |
| P5-14 | `table.columnWidthSumMm` | mm | 128 atau 166 | {128, 166} | datumcheck G2 | L4029 | K |
| P5-15 | `table.rowCellCount.equalsHeader` | bool | true | true | datumcheck G1 | L4028 | K |
| P5-16 | `table.cellText.fitsColumn` | bool | true | true | datumcheck G3 | L4029-4030 | K |
| P5-17 | `caption.required` | bool | true, di atas | true | DT-15, lint 30 | L888-889, L4003 | K |
| P5-18 | `caption.identifier.style` | tokenRef | condensed kapital ("T A B E L 5 . 1") | - | DT-15 | L889-890, L859 | T |
| P5-19 | `caption.sentenceCount` | int | 1 | 1 | DT-15 | L890 | K |
| P5-20 | `caption.effectiveDateInTitle` | bool | true bila isi bertanggal berlaku | bool | 5.2 | L890-892 | K |
| P5-21 | `caption.chart.isConclusion` | bool | true | true | CH-05 | L892, L1394-1405 | K |
| P5-22 | `source.required` | bool | true, di bawah | true | DT-15, lint 10/29 | L888-889, L3958, L4001 | K |
| P5-23 | `source.provenanceField.required` | bool | true ("SUMBER ... PROVENANS ...") | true | DT-15 | L842, L199 | K |
| P5-24 | `source.glyphKey.include` | bool | true bila glif dipakai | bool | Tabel 4.7 no. 12 | L842 | B |
| P5-25 | `artifact.mustBeCalledInProse` | bool | true; artefak yatim dipanggil atau dihapus | true | SG-L2-06, DT-15 | L894-896 | K |
| P5-26 | `specTable.columns` | list | [PARAMETER, KONDISI UJI, NILAI, SATUAN] | tetap | DT-19 | L900-906 | K |
| P5-27 | `specTable.condition.style` | object | menjorok, tidak bergaris | - | DT-19 | L900-902 | B |
| P5-28 | `aside.ruleBottom` | tokenRef | rules.hair | - | DT-20 | L929 | B |
| P5-29 | `aside.fill` | enum | none (kotak krem berbatang gagal lint 02) | none | DT-20, lint 02, R-12 | L927-932, L4285 | K |
| P5-30 | `marks.terukur.glyph` | char | ■ (U+25A0) | tetap | DT-21 | TK104; L945 glif `[TAK TERBACA]` | K |
| P5-31 | `marks.terukur.colour` | tokenRef | ink900 `[REK]` | token | Tabel 5.3 | L944-945 | K |
| P5-32 | `marks.diturunkan.glyph` | char | ◈ (U+25C8) | tetap | DT-21 | TK105 | K |
| P5-33 | `marks.diturunkan.colour` | tokenRef | signal `[REK]` | token | Tabel 5.3 | L945-947, TK103 | K |
| P5-34 | `marks.pemasok.glyph` | char | ◇ (U+25C7) | tetap | DT-21 | TK106 | K |
| P5-35 | `marks.pemasok.colour` | tokenRef | ink400 `[REK]` | token | Tabel 5.3 | L946-949 | K |
| P5-36 | `marks.asumsi.glyph` | char | △ (U+25B3) | tetap | DT-21 | TK107 | K |
| P5-37 | `marks.asumsi.colour` | tokenRef | alert `[REK]` | token | Tabel 5.3 | L947-951, TK103 | K (konflik K-19) |
| P5-38 | `marks.requiredOnDecisionNumbers` | bool | true | true | DT-21, lint 11 | L953, L3960 | K |
| P5-39 | `marks.prose.maxPerWords` | int | 1 per 20 kata | 20 | SG-L6-13, C-31 | L957-958, L3696-3698 | K |
| P5-40 | `marks.oncePerClause` | bool | true; tidak diulang pada penyebutan ulang | true | DT-22, SG-L3-05 | L956-957 | K |
| P5-41 | `marks.overflowTarget` | enum | rail atau tableRow (tidak dihapus) | rail, tableRow | R-05 | L958-960, L4252-4254 | B |
| P5-42 | `marks.asumsi.requiresIdAndImpact` | bool | true | true | Tabel 5.3 | L951 | K |
| P5-43 | `numbers.bindToRegister` | bool | true; angka beban keputusan adalah rujukan bernama | true | DT-23 | L964-968 | K |
| P5-44 | `register.rejectUnmarkedEntries` | bool | true | true | DT-23 | L968 | K |
| P5-45 | `register.maxDecimals` | int | 3 (batas mesin, E-12) | 0-3 | - | TK115, L4365 | T |
| P5-46 | `audit.untrackedNumbers.enabled` | bool | SERAH true (audit_docx) | bool | DT-23 | L987-988, L4064 | T (per tier) |
| P5-47 | `audit.retiredValues.enabled` | bool | SERAH true (audit_retired) | bool | DT-23 | L988-989, L4064 | T (per tier) |
| P5-48 | `derivation.id.pattern` | string | `D-{bab}.{urut}` (D-6.1, D-7.2a) | pola | DT-24 | L996, L976 | K |
| P5-49 | `derivation.markPerInputLine` | bool | true | true | DT-24, E-15 | L994-995, L4370 | K |
| P5-50 | `derivation.closingSentence.required` | bool | true (akibat bila asumsi gagal) | true | DT-24 | L995, L980 | K |
| P5-51 | `derivation.recomputeAgainstRegister` | bool | true; bangun ditolak bila tidak sama | true | DT-24 | L996-998 | K |
| P5-52 | `derivation.toleranceMode` | enum | absolute 0,51 (temuan E-14 mengusulkan relative) | absolute, relative | E-14 | L4369 | B |
| P5-53 | `derivation.verdictDirection` | enum | lessOrEqual (E-13 mengusulkan argumen arah) | lessOrEqual, greaterOrEqual | E-13 | L4367 | B |
| P5-54 | `admiralty.reliability` | enum | A-F | A, B, C, D, E, F | DT-25 | L1003-1024 | K |
| P5-55 | `admiralty.credibility` | enum | 1-6 | 1-6 | DT-25 | L1003-1024 | K |
| P5-56 | `admiralty.requiredOnExternalClaims` | bool | true | true | DT-25, lint 22 | L1003, L3982 | K |
| P5-57 | `admiralty.excludedFromProposal` | list | [F6] | daftar | 5.8 | L1007-1008 | K |
| P5-58 | `admiralty.scaleTablePrintedOnceInAppendix` | bool | true bila dipakai | bool | 5.8 | L1026-1027 | T |
| P5-59 | `icd203.bands` | list | hampir tidak mungkin 1-5 %; sangat kecil kemungkinannya 5-20 %; kecil kemungkinannya 20-45 %; kira-kira berimbang 45-55 %; kemungkinan besar 55-80 %; sangat mungkin 80-95 %; hampir pasti 95-99 % | 7 pita tetap | DT-26 | L1029-1033 | K |
| P5-60 | `icd203.mixLikelihoodWithConfidence` | bool | false | false | DT-26 | L1033-1034 | K |
| P5-61 | `confidence.label` | enum | konservatif, indikatif (fakta terverifikasi tanpa pagar) | daftar terbuka | SG-L4-07 | L1034-1036 | B |
| P5-62 | `assumptionRegister.columns` | list | [ID, ASUMSI, DAMPAK BILA SALAH, VERIFIKASI] | tetap | DT-27 | L1040-1052 | K |
| P5-63 | `assumption.id.pattern` | string | `ASM-{domain}-{nn}` | pola | DT-27 | L1041-1042 | K |
| P5-64 | `assumption.impact.required` | bool | true ("asumsi tanpa dampak adalah tebakan") | true | DT-27 | L1042 | K |
| P5-65 | `requirement.id.pattern` | string | `REQ-{subsistem}-{nn}` | pola | DT-27 | L1043 | K |
| P5-66 | `requirement.id.immutableAcrossPackage` | bool | true (kajian, proposal, BoQ, jadwal, uji terima) | true | DT-27 | L1043-1045 | K |
| P5-67 | `serah.secondIndependentRoute.required` | bool | true untuk setiap kuantitas rekapitulasi | per tier | 3.2 | L449-451 | T (per tier) |
| P5-68 | `serah.reconciliationTable.required` | bool | true (kedua rute dan selisih) | per tier | 3.2 | L450-451 | T (per tier) |

Jumlah: 68.

### 3.5 Bab 6: kepatuhan, satuan, reproduksi (43 parameter)

| ID | Kunci | Tipe | Default | Rentang / enum | Aturan | Sumber | Kelas |
|---|---|---|---|---|---|---|---|
| P6-01 | `classification.recipientScheme` | enum | anri (internal GSP) | kemhanTni (Permenhan 26/2017 Ps 3), polri (Perkap 1/2023 Ps 79), anri (ANRI 5/2021 Ps 104-109) | DT-28, lint 18 | L1075-1086 | K |
| P6-02 | `classification.level` | enum | Terbatas (manual ini) | kemhanTni: Biasa, Rahasia, Sangat Rahasia; polri dan anri: Biasa, Terbatas, Rahasia, Sangat Rahasia | DT-28 | L1079-1086, L4294-4296 | K |
| P6-03 | `classification.schemeLevels` | map | tabel 6.1; skema pertahanan tanpa Terbatas | tetap | DT-28 | L1079-1086 | K |
| P6-04 | `classification.codeInDocNumber` | enum | SR, R, T, B sebagai unsur pertama nomor | 4 kode | 6.1 | L1088 | K (konflik K-14) |
| P6-05 | `classification.everyPage` | bool | true pada produk operasional (kepala halaman + blok register) | true | 6.1 | L1092-1094 | K |
| P6-06 | `classification.doubleEnvelope` | bool | true untuk SR dan R | per level | 6.1 | L1095-1097 | K |
| P6-07 | `classification.numberedCopyControl` | bool | true untuk SR dan R, dicatat sel kanan pita segel | per level | 6.1 | L1095-1097 | K |
| P6-08 | `classification.minLevelForSiteData` | enum | Rahasia (tata letak, koordinat, perimeter instalasi militer; UU 14/2008 Ps 17) | >= Rahasia | 6.1 | L1098-1101 | K |
| P6-09 | `doc.urgency` | enum | biasa | kilat, sangat segera, segera, biasa; sumbu terpisah dari klasifikasi | 6.1 | L1102-1103 | K (sumbu terpisah) |
| P6-10 | `compliance.regulations.live` | list | Perpres 46/2025; Perlem LKPP 12/2021 jo 4/2024; ANRI 5/2021; Perkap 1/2023; Permenhan 30/2019; Permen PUPR 8/2023; PMK 131/2024; UU 10/2020 | admin | DT-29 | L1109-1125 | K |
| P6-11 | `compliance.regulations.dead` | list | Perpres 16/2018 jo 12/2021; Permenpan RB 22/2008, 80/2012; Perkap 7/2017; Permenhan 60/2014, 25/2015; Permen PUPR 28/2016, 1/2022; PPN 10 % atau 12 % rata; meterai Rp 6.000 | daftar blokir | DT-29 | L1109-1125 | K |
| P6-12 | `compliance.regulations.reviewIntervalMonths` | int | 12 ("periksa ulang setiap tahun") | 12 | DT-29 | L1127 | K |
| P6-13 | `normativeQuote.literalWithArticle` | bool | true (verba pelapor + nomor pasal) | true | SG-L3-01 | L1132-1134 | K |
| P6-14 | `letter.secretariatException.enabled` | bool | false; true untuk surat ke sekretariat Polri atau ANRI | bool | DT-32 | L1147-1151 | K |
| P6-15 | `letter.font` | string | Arial | Arial | DT-32 | L1149 | K |
| P6-16 | `letter.sizePt` | pt | 12 | 12 | DT-32 | L1149 | K |
| P6-17 | `letter.marginLeftCm` | cm | 3 | margin penerima | DT-32 | L1149-1150 | K |
| P6-18 | `letter.marginRightCm` | cm | 2 | margin penerima | DT-32 | L1150 | K |
| P6-19 | `ahs.rows` | list | A tenaga kerja; B bahan; C peralatan; D = A + B + C; E biaya umum dan keuntungan; F = D + E | tetap | DT-33 | L1155-1158 | K |
| P6-20 | `ahs.laborCodes` | object | L.01-L.04, satuan OH | tetap | DT-33 | L1156 | K |
| P6-21 | `ahs.overheadProfitPercent` | % | wajib disebut | 10-15 % dari D | DT-33 | L1157-1158 | K (pita), B (nilai) |
| P6-22 | `ahs.coefficientDecimals` | int | 3 desimal bukan nol | 3 | DT-33 | L1159 | K |
| P6-23 | `vat.inUnitPrice` | bool | false; dihitung sekali di rekapitulasi | false | DT-31 | L1159-1160 | K |
| P6-24 | `vat.nominalRatePercent` | % | 12 | regulasi | DT-31, lint 19 | L1165-1166 | K |
| P6-25 | `vat.dppFactor` | rasio | 11/12 | regulasi | DT-31 | L1165, L1170 | K |
| P6-26 | `vat.effectiveRatePercent` | % | 11 | = nominal x dppFactor | DT-31, lint 19 | L1168-1170, L3976 | T |
| P6-27 | `stampDuty.amountRp` | Rp | 10.000 | regulasi | DT-29 | L1125 | K |
| P6-28 | `terbilang.generatedByCode` | bool | true; tidak diketik | true | DT-31, SG-L4-05 | L1173-1176 | K |
| P6-29 | `hps.roundDown` | bool | true | true | DT-31 | L1174 | K |
| P6-30 | `boq.columns` | list | [No, uraian, volume, satuan, harga satuan, jumlah] (konvensi, bukan regulasi) | daftar | 6.4 | L1177-1178 | B |
| P6-31 | `numerals.thousandsSeparator` | char | "." | "." | DT-30 | L257-258, TK112 | K |
| P6-32 | `numerals.decimalSeparator` | char | "," | "," | DT-30 | L257-258, TK113 | K |
| P6-33 | `units.spaceBetweenValueAndUnit` | bool | true | true | DT-30, lint 16 | L1186, L3970, TK114 | K |
| P6-34 | `units.planeAngleNoSpace` | bool | true (30°22'8") | true | Tabel 6.3 | L1188 | K |
| P6-35 | `units.toleranceParentheses` | bool | true ((63,2 ± 0,1) m) | true | Tabel 6.3 | L1195 | K |
| P6-36 | `units.plusMinusMeaning.required` | bool | true (toleransi rancangan, 1σ, k = 2) | true | DT-30, lint 17 | L1198, L3972 | K |
| P6-37 | `uncertainty.maxSignificantDigits` | int | 2; ketidakpastian menentukan presisi | <= 2 | Tabel 6.3 | L1200 | K |
| P6-38 | `units.dimensionsRepeatUnit` | bool | true (51 mm x 51 mm x 25 mm) | true | Tabel 6.3 | L1204 | K |
| P6-39 | `currency.prefixBeforeValue` | list | [Rp, USD, EUR, SGD] mendahului nilai | daftar | DT-30 | TK114 | K |
| P6-40 | `conventions.oneVariantPerFile` | bool | true (tanggal, ribuan, Rp, persen) | true | SG-L4-06, C-33 | L1208-1209 | K |
| P6-41 | `time.zoneRequired` | bool | true (14.00 WIB, UTC+7) | true | SG-L4-05 | L1209-1210 | K |
| P6-42 | `color.distinctionRedundancy.required` | bool | true (bentuk, label, pola garis, posisi) | true | DT-34 | L1218, L1413-1415 | K |
| P6-43 | `photocopy.acceptanceTest` | object | cetak 100 %, fotokopi dua kali setelan bawaan, baca dari 40 cm | tetap | DT-11, 16.4 | L1219-1220, L4083 | K (manusia) |

Jumlah: 43.

### 3.6 Bab 7-8: chart (125 parameter)

#### 3.6.1 Parameter global chart (36 parameter)

| ID | Kunci | Tipe | Default | Rentang / enum | Aturan | Sumber | Kelas |
|---|---|---|---|---|---|---|---|
| P7-01 | `chart.question` | string | wajib, satu kalimat | teks | CH-07 | L1302, L2062 | K (wajib ada) |
| P7-02 | `chart.purposeGroup` | enum | - | perbandingan, waktu, komposisi, sebaran, hubungan, geospasial, aliranProses, kinerja | CH-08, Tabel 7.2 | L1304-1326 | B |
| P7-03 | `chart.audience` | enum | pejabat | pejabat, teknis, publik, realtime | Langkah 4 | L1358-1372 | B |
| P7-04 | `chart.zeroBaseline` | bool | true untuk bar, column, area | true | CH-01 | L1383, L4659 | K |
| P7-05 | `chart.sortOrder` | enum | valueDesc | valueDesc, natural (waktu, tingkat, arah mata angin) | CH-02 | L1385-1386 | B |
| P7-06 | `chart.accent.maxSubjects` | int | 1 | 0-1 | CH-03, lint 26 | L1388-1389, L3995 | K |
| P7-07 | `chart.colorRole.accent` | tokenRef | signal | token | Tabel 7.5 | L1420-1421 `[REK]` | B |
| P7-08 | `chart.colorRole.contextMain` | tokenRef | ink400 (target, periode lalu, sisa kategori) | token | Tabel 7.5 | L1421-1423 `[REK]` | B |
| P7-09 | `chart.colorRole.contextBackground` | tokenRef | ink200 | token | Tabel 7.5 | L1422-1425 `[REK]` | B |
| P7-10 | `chart.colorRole.limitExceeded` | tokenRef | alert (melewati batas, penurunan) | token | CH-11 | L1423-1428 | K (makna) |
| P7-11 | `chart.colorRole.improving` | tokenRef | verd (kenaikan pada waterfall atau slope) | token | CH-11 | L1425-1430 | K (makna) |
| P7-12 | `chart.colorRole.textAxis` | tokenRef | ink900 (garis dasar, label nilai mono, garis batas threshold) | token | Tabel 7.5 | L1437 | B |
| P7-13 | `chart.legend.mode` | enum | direct; legenda hanya baris KUNCI di bawah gambar; tanpa kotak | direct, keyRow | CH-04, R-03 | L1391-1392, L4244-4246 | K |
| P7-14 | `chart.inPlotTitle` | bool | false | false | CH-05, R-01 | L1394-1395, L4236 | K |
| P7-15 | `chart.forbiddenEffects` | list | [3D, dua sumbu Y, bayangan, gradien, ujung bar membulat, bingkai, label berkotak] | larangan | CH-06 | L1397-1398 | K |
| P7-16 | `chart.gridlines` | enum | none; hanya bila nilai harus dibandingkan | none, whenComparing | 7.7 | L1514-1515 | B |
| P7-17 | `chart.maxColors` | int | 5 | 1-5 | lint 25 | L1440, L3993 | K |
| P7-18 | `chart.output.vectorRealText` | bool | true (SVG berteks nyata) | true | DT-36 | L1525 | K |
| P7-19 | `chart.output.rasterDpiForWord` | int | 300 | 300 | DT-36 | L1525-1526 | K |
| P7-20 | `chart.output.widthMm` | enum mm | 128 | 128, 166 | DT-36 | L1526 | K |
| P7-21 | `chart.limits.pieMaxSlices` | int | 5 | 1-5 | Tabel 7.3 | L1344, L1312 | B |
| P7-22 | `chart.limits.barCategoryRange` | range | 6-30 (bar urut atau lollipop) | 6-30 | Tabel 7.3 | L1346 | B |
| P7-23 | `chart.limits.topNOverflow` | range | 10-15 teratas + Lainnya bila > 30 | 10-15 | Tabel 7.3 | L1348 | B |
| P7-24 | `chart.limits.lineMaxSeries` | int | 3; lebih dari itu sorot satu, pudarkan, atau small multiples | 1-3 | Tabel 7.3 | L1350 | B |
| P7-25 | `chart.limits.denseScatterStrategy` | enum | transparency | transparency, hexbin, heatmap | Tabel 7.3 | L1352 | B |
| P7-26 | `chart.limits.logScaleNoteRequired` | bool | true bila nilai berbeda ribuan kali | true | Tabel 7.3 | L1354 | K |
| P7-27 | `chart.heatmap.ramp` | list tokenRef | putih ke signal (satu gradasi) | gradasi tunggal | Tabel 7.7, 8.6 no. 10 | L1554, L1916 | B (konflik K-13) |
| P7-28 | `chart.dashboardTiles.allowedInDocument` | bool | false (tile, gauge hanya di layar hidup) | false | CH-13, lint 01, R-04 | L1531-1533, L4248-4250 | K |
| P7-29 | `chart.specialOnlyIfDefaultFails` | bool | true (radar, sunburst, sankey, stream) | true | CH-14 | L1249-1251 | K (manusia) |
| P7-30 | `chart.engine` | enum | datumchart (bar, column, threshold); pustakachart (55 jenis lain) | 2 nilai | 8.5, C-01 | L2050-2054 | T |
| P7-31 | `chart.eyeCheck.required` | list | lint 12, 13, 25, 27, 28 bila engine bukan datumchart | daftar | 8.5 | L2055-2056 | T |
| P7-32 | `chart.threshold.limitLineLabelled` | bool | true; batang melewati batas memakai alert | true | CH-12 | L1444-1449 | K |
| P7-33 | `chart.source.dataDateAndMark` | bool | true (baris SUMBER dengan tanggal data dan tanda provenans) | true | DT-15, Tabel 8.9 no. 11 | L1522-1523, L2072 | K |
| P7-34 | `chart.numbersBoundToRegister` | bool | true | true | DT-23, Tabel 8.9 no. 10 | L2071 | K |
| P7-35 | `chart.illustrativeDataLabel` | string | "CONTOH DATA SINTETIS" (galeri) | teks | 1.5 | L270-271, PC68 | B |
| P7-36 | `chart.minFontPt` | pt | 5,5 (pustakachart mengukur minimum 5,8) | >= 5,5 | lint 28 | L3999, SK80 | K |

#### 3.6.2 Registri 58 jenis chart dan parameter khusus keluarga (87 parameter)

Kolom "Parameter khusus" diambil dari Tabel 8.6 "cara membuat" (L1880-1986) dan kolom "Hindari bila" Tabel 8.1-8.5. Angka dalam kurung adalah jumlah parameter khusus. Semua kelas B kecuali disebut.

| Kode | Chart | Fungsi | Pakai bila | Hindari bila | Parameter khusus (default) | Sumber |
|---|---|---|---|---|---|---|
| P-01 | Bar urut | Panjang batang = nilai per kategori | Label panjang; nilai sebesaran | > 30 batang, ganti treemap | `sort=valueDesc`, `accent=topBarOnly`, `valueLabel=barEnd` (3) | L1602-1604, L1884-1885 |
| P-02 | Column | Bar diputar 90° | Label pendek; urutan alami; sedikit periode | Label panjang | - (0) | L1606-1607 |
| P-03 | Grouped column | Beberapa batang per kategori | 2-3 seri, target dan realisasi | Banyak seri | `maxSeries=3`, `targetColour=ink200` (2) | L1609-1610, L1887-1888 |
| P-04 | Lollipop | Garis tipis dengan titik ujung | Banyak kategori, ruang terbatas | Nilai sangat berdekatan | `stemWeight=thin`, `zeroBaseline=true`, `sort=valueDesc` (3) | L1612-1613, L1890-1891 |
| P-05 | Dot plot | Titik per kategori | Sumbu tidak perlu nol | Tanpa gridline | `gridlines=required` (1) | L1615-1616 |
| P-06 | Dumbbell | Dua titik dihubungkan garis | Selisih sebelum dan sesudah | Data tidak berpasangan | `startColour=ink400`, `endColour=signal`, `sort=byDifference` (3) | L1618-1619, L1893-1894 |
| P-07 | Range plot | Rentang min-maks | Lebar celah | Fokus satu nilai | - (0) | L1621-1622 |
| P-08 | Slope | Dua sumbu tegak dihubungkan garis | Tepat dua titik waktu | > 2 titik | `labelsBothSides=true`, `upColour=verd`, `downColour=alert` (3) | L1624-1625, L1902-1903 |
| P-09 | Bullet | Realisasi, target, pita kinerja | KPI terhadap target | Tidak ada target | `bandLevels=3`, `actualBar=true`, `targetLine=true` (3) | L1627-1628, L1896-1897 |
| P-10 | Waterfall | Batang mengambang awal ke akhir | Perubahan bersih | Nilai absolut komponen | `endsGroundedAtZero=true`, `signedDeltaLabels=true` (2) | L1630-1631, L1899-1900 |
| P-11 | Threshold | Batang terhadap garis batas berlabel | Nilai rekayasa terhadap batas | Tidak ada batas | `limitLine.labelled=true` (K), `overLimitColour=alert` (K) (2) | L1633-1634, L1442-1449 |
| P-12 | Small multiples | Chart sama diulang per kelompok | Memecah chart padat | Satu chart cukup | `sharedScale=true` (1) | L1636-1637, L1289 |
| P-13 | Quadrant | Scatter dibagi 4 kuadran | Prioritas dua kriteria | Garis pembagi tanpa alasan | `dividerJustification` wajib, `quadrantNames` (2) | L1639-1640, L1943-1944 |
| P-14 | Arrow chart | Dumbbell berpanah | Arah dan besar perubahan | Hanya satu kondisi | - (0) | L1642-1643 |
| P-15 | Table chart | Tabel pewarnaan bersyarat | Pembaca butuh angka persis | Aturan warna tanpa keterangan | `colourRuleLegend=required` (1) | L1645-1646 |
| H-01 | Scatter | Titik X-Y | Korelasi, klaster, pencilan | Ribuan titik, ganti hexbin | `xIsPresumedCause=true`, `trendLine=optional` (2) | L1668-1669, L1905-1906 |
| H-02 | Bubble | Scatter + ukuran | Tiga variabel numerik | Gelembung bertumpuk | `areaProportional=true`, `directLabels=true` (2) | L1671-1672, L1913-1914 |
| H-03 | Heatmap | Intensitas warna dalam grid | Hari x jam, matriks korelasi | Butuh selisih presisi | `ramp=single(white→signal)`, `scaleShown=true` (2) | L1674-1675, L1916-1917 |
| H-04 | Connected scatter | Scatter dihubungkan waktu | Dua variabel bergerak bersama | Awam tanpa anotasi | - (0) | L1677-1678 |
| H-05 | Hexbin | Kepadatan sarang lebah | Ribuan titik | Sampel kecil | - (0) | L1680-1681 |
| H-06 | Contour | Garis nilai sama | Permukaan kontinu | Data jarang | - (0) | L1683-1684 |
| H-07 | Network | Simpul dan garis | Relasi OSINT, topologi | Ratusan simpul tanpa filter | `nodeSize=degree`, `highlightBridges=true` (2) | L1686-1687, L1956-1957 |
| H-08 | Arc diagram | Simpul segaris, busur | Relasi sedikit-sedang | Banyak koneksi | - (0) | L1689-1690 |
| H-09 | Venn atau Euler | Lingkaran irisan himpunan | 2-3 himpunan | > 3 himpunan | `maxSets=3` (1) | L1697-1698 |
| K-01 | Stacked bar | Batang dibelah segmen | Total dan kontribusi | Membandingkan segmen atas | - (0) | L1717-1718 |
| K-02 | 100 % stacked bar | Segmen persen | Porsi > total | Butuh total absolut | `maxSegments=4`, `keySegmentLeft=true` (2) | L1720-1721, L1919-1920 |
| K-03 | Diverging bar | Batang kiri-kanan dari nol | Positif-negatif, Likert | Tanpa titik tengah | `meaningfulMidpoint=required` (1) | L1723-1725 |
| K-04 | Population pyramid | Diverging bar usia, 2 kelompok | Struktur demografi | > 2 kelompok | `groups=2` (1) | L1727-1728 |
| K-05 | Donut | Pie berlubang, angka kunci tengah | Sedikit bagian, total ditonjolkan | Perbandingan presisi | `maxSlices=5`, `startAngle=12 o'clock`, `clockwise=true` (3) | L1730-1732, L1922-1923 |
| K-06 | Pie | Lingkaran dibagi irisan | Maks. 5 kategori, satu dominan | Selisih kecil | `maxSlices=5`, `oneDominant=required` (2) | L1734-1735 |
| K-07 | Waffle | Grid 10 x 10, satu kotak 1 % | Progres awam | Angka tidak bulat | `grid=10x10` (1) | L1737-1738 |
| K-08 | Icon array | Satu ikon satu unit | Rasio mudah dihitung | Jumlah besar | - (0) | L1740 |
| K-09 | Treemap | Persegi bersarang | Banyak kategori hierarkis | Banyak kotak kecil | `labelsInside=true`, `limitSmallBoxes=true` (2) | L1742-1743, L1925-1926 |
| K-10 | Funnel | Batang menyempit per tahap | Tahapan berurutan | Presisi antar tahap | `stageValues=true`, `conversionPercent=true` (2) | L1745, L1940-1941 |
| K-11 | Sankey | Pita setebal volume | Aliran RAB, energi | Terlalu banyak simpul | `maxLevels=3`, `maxEndNodes≈12` (2) | L1747-1748, L1953-1954 |
| K-12 | Marimekko | Stacked bar lebar bervariasi | Dua proporsi bertingkat | Banyak segmen kecil | - (0) | L1750-1751 |
| W-01 | Line | Titik dihubungkan sepanjang waktu | Tren data rapat | > 3 garis tanpa sorotan | `maxLines=3`, `labelAtLineEnd=true` (2) | L1774-1776, L1928 |
| W-02 | Column waktu | Batang per periode | Maks. 12 periode | Banyak periode | `maxPeriods=12` (1) | L1778 |
| W-03 | Step line | Garis tangga | Perubahan pada saat tertentu | Berubah tiap titik | - (0) | L1780-1781 |
| W-04 | Area | Line dengan area terisi | Akumulasi mulai nol | Tidak mulai nol | `zeroBaseline=true` (K) (1) | L1783-1784, L4659 |
| W-05 | Stacked area | Area ditumpuk | Tren total dan kontribusi | Membandingkan seri | `largestAtBottom=true`, `maxLayers=4` (2) | L1790-1792, L1931-1932 |
| W-06 | Bump | Peringkat dari waktu ke waktu | Siapa naik turun | Butuh nilai sebenarnya | - (0) | L1793-1794 |
| W-07 | Gantt | Batang durasi pada garis waktu | Jadwal proyek, milestone BAST | Ratusan tugas | `rowPerTask=true`, `milestones=[BAST, UAT]`, `todayLine=true`, `rowsInProposal=8-15` (4) | L1795-1797, L1949-1951 |
| W-08 | Barcode | Garis tegak tiap kejadian | Linimasa forensik, deret alarm | Pengganti tabel log | `rowPerEventType=true`, `riskyTypeColour=alert` (2) | L1799-1800, L1965-1967 |
| W-09 | Horizon | Area dilipat menjadi pita | Puluhan sensor satu layar | Audiens umum; tanpa legenda pita | `subtractBaseline=true`, `bands=2-3`, `fold=true`, `bandLegend=required` (4) | L1801-1803, L1962-1963 |
| W-10 | Candlestick | OHLC | Audiens keuangan | Hampir selalu ganti line | - (0) | L1805-1806 |
| S-01 | Histogram | Data ke rentang | Bentuk sebaran satu variabel | Bin terlalu banyak/sedikit | `bins=10-20`, `medianMarker=true` (2) | L1826-1827, L1934-1935 |
| S-02 | Box plot | Median, kuartil, pencilan | Sebaran beberapa kelompok | Awam tanpa keterangan | `median=true`, `box50=true`, `outlierPoints=true` (3) | L1829-1830, L1937-1938 |
| S-03 | Density | Histogram kurva halus | Data kontinu | Sampel kecil | - (0) | L1832 |
| S-04 | Violin | Box plot + kepadatan | Bentuk dan sebaran kelompok | Audiens awam | - (0) | L1834-1835 |
| S-05 | Ridgeline | Kurva kepadatan ditumpuk | Pergeseran sebaran per bulan | > 12 kelompok | `periodOrder=true`, `slightOverlap=true`, `sharedAxis=true`, `maxGroups=12` (4) | L1842-1843, L1975-1976 |
| S-06 | Strip atau jitter | Tiap pengamatan sebagai titik | Sampel kecil-sedang | Ribuan titik | - (0) | L1845-1846 |
| S-07 | Beeswarm | Titik rapat tanpa tumpuk | Semua kasus terlihat | Data sangat banyak | `columnPerGroup=true`, `medianMarker=true` (2) | L1848, L1972-1973 |
| S-08 | Radial histogram | Histogram melingkar | Data arah atau jam | Data bukan arah | `northUp=true`, `clockwise=true`, `uniformSectors=true` (3) | L1850-1851, L1969-1970 |
| G-01 | Tile map | Kotak sama besar per wilayah | 38 provinsi adil | Butuh bentuk geografis | `standardAbbrev=true`, `singleRamp=true`, `valueInTile=true` (3) | L1853-1854, L1959-1960 |
| G-02 | Dot map | Satu titik satu lokasi | Sebaran lokasi | Ribuan titik | - (0) | L1856-1857 |
| G-03 | Flow map | Panah antar lokasi setebal volume | Rute logistik | Terlalu banyak garis | - (0) | L1859-1860 |
| G-04 | Flowchart | Kotak dan panah ISO 5807 | SOP, rantai kustodi | Data angka; dibangun mesin diagram | `singleReadingDirection=true`, `standardShapes=ISO 5807`, `maxSteps≈10` (3) | L1862-1864, L1983-1984 |

Jumlah per kelompok: P 15 jenis, 26 parameter; H 9 jenis, 9; K 12 jenis, 16; W 10 jenis, 16; S 8 jenis, 14; G 4 jenis, 6. Total 58 jenis, 87 parameter khusus.

**Tercatat tetapi tidak digambar (18 jenis, `drawn=false`)**: radar, parallel coordinates, nightingale, radial bar, word cloud (L1648-1654); chord diagram (L1700-1702); sunburst, circle packing, dendrogram, gauge, semicircle donut (L1753-1759); spline, stream graph, spiral, OHLC (L1808-1810); choropleth, bubble map, heat map geospasial (L1866-1870). Katalog sumber memuat lebih dari 80 jenis (L1580).

#### 3.6.3 Peta rekomendasi (2 parameter)

| ID | Kunci | Tipe | Default | Sumber | Kelas |
|---|---|---|---|---|---|
| P8-01 | `chart.recommendedByDocType` | map | Tabel 8.8: proposal/kajian, RAB/BoQ, paparan pejabat, layar komando, OSINT, forensik digital, kinerja internal (disarankan dan dihindari) | L2022-2043 | B |
| P8-02 | `chart.gspRelevance` | map | Tabel 8.7: Gantt, Sankey, Network, Tile map, Horizon, Barcode, Radial histogram, Flowchart Tinggi; Beeswarm, Ridgeline Sedang; Radial bar dan sejenis Rendah (ASUMSI penyusun) | L1990-2020 | B |

Subtotal Bab 7-8: 36 + 87 + 2 = 125.

### 3.7 Bab 9: diagram dan mesin gambar (55 parameter)

| ID | Kunci | Tipe | Default | Rentang / enum | Aturan | Sumber | Kelas |
|---|---|---|---|---|---|---|---|
| P9-01 | `diagram.family` | enum | dipilih PRISMA, tidak pernah DATUM | layered, topology, stack, flow, swimlane, sequence, sld, rack, graph | DT-35 | L2106, L2138-2163, DD125-135 | K (pemilik) |
| P9-02 | `diagram.id` | string | nomor berawalan bab | pola | Tabel 9.1 | L2108 | K |
| P9-03 | `diagram.title` | string | satu kalimat diakhiri titik | teks | Tabel 9.1 | L2108 | K |
| P9-04 | `diagram.classification` | enum | diwarisi dokumen induk | = P6-02 | Tabel 9.1 | L2110 | T |
| P9-05 | `diagram.nodes[]` | list object | {id, label, class, sub, mark, tag} | skema | Tabel 9.1 | L2112 | K (skema) |
| P9-06 | `diagram.node.shape` | enum | box | box, stadium, diamond, parallelogram, cylinder, hexagon, doubled, shadowed, circle, bus | Tabel 9.3 | L2167-2189, DD138-149 | B |
| P9-07 | `diagram.node.class` | object | {tier, lane, col, row} | per keluarga | Tabel 9.1 | L2112 | B |
| P9-08 | `diagram.edges[]` | list object | {from, to, kind, label}; keempatnya wajib | skema | DT-37, lint 24 | L2114, L3986 | K |
| P9-09..P9-26 | `diagram.edgeKind.{kind}.{pattern, colour, head}` (6 jenis x 3 atribut = 18 parameter) | enum/tokenRef | data: solid, ink900, solid; control: dashed, ink700, open; sync: dotted, ink400, open; accent: solid, signal, solid (tebal); alert: longdash, alert, open; verify: dashdot, verd, open | ISO 128-2: 01.1, 02.1, -, 01.1, -, 04.1 | Tabel 9.4 | L2193-2210, DD152-165 | B (pola-makna: K) |
| P9-27..P9-31 | `diagram.dashPatternMm.{dashed, dotted, longdash, dashdot, solid}` (5 parameter) | string mm | dashed 3,2/1,6; dotted 0,2/1,1; longdash 7,1/1,6; dashdot 7,1/1,6/0,2/1,6; solid none | geometri | - | DD167-170 saja (tidak di manual) | B |
| P9-32 | `diagram.legend[]` | list | baris kunci bila tanda rumah dipakai | skema | Tabel 9.1 | L2116 | K (wajib bila tanda rumah, lint 34) |
| P9-33 | `diagram.notes[]` | list | batas lingkup dan konvensi | skema | Tabel 9.1 | L2116 | B |
| P9-34 | `diagram.sources[]` | list | minimal 1 dokumen dan pasal | >= 1 | Tabel 9.1 | L2118 | K |
| P9-35 | `diagram.labelsVerified` | bool | false (draf); true hanya setelah veritas | bool | DT-39 | L2120, L2128-2132 | K |
| P9-36 | `diagram.widthMm` | enum mm | 128 | 128, 166 | DT-36 | L2122 | K |
| P9-37 | `diagram.apparatus` | enum | page (dokumen); figure (SVG mandiri) | page, figure | Tabel 9.1, lint 36 | L2124, L2226-2229 | B (konflik K-17) |
| P9-38 | `diagram.latticeSnap` | object | 10,667 mm x 4,7625 mm | = P4G-09, P4G-10 | 9.3 | L2219 | T |
| P9-39 | `diagram.widthPerTier.single` | bool | true | true | 9.3 | L2219-2220 | K |
| P9-40 | `diagram.trustZone.style` | object | garis tepi putus-putus, tab label, tanpa isian | tetap | DT-44 | L2220-2221 | K |
| P9-41 | `diagram.accent.max` | int | 1 | 0-1 | DT-37, lint 26 | L2221, L3995 | K |
| P9-42 | `diagram.maxColors` | int | 5 | 1-5 | lint 25 | L2221, DD114 | K |
| P9-43 | `diagram.legend.style` | enum | keyRow, bukan kotak | keyRow | 9.3 | L2222 | K |
| P9-44 | `diagram.minFontPt` | pt | 5,5 | >= 5,5 | lint 28 | L3999, DD112 | K |
| P9-45 | `diagram.maxHeightMm` | mm | 247 | <= 247 | lint 33 | L4009, DD113 | K |
| P9-46 | `diagram.minStrokeMm` | mm | 0,18 | >= 0,18 | lint 27 | L3997, DD105 | K |
| P9-47 | `diagram.hopRadiusMm` | mm | 0,9 | geometri | - | DD116 saja | B |
| P9-48 | `diagram.anchorFanning` | bool | true (jangkar dikipas) | bool | 9.3 | L2212-2214 | B |
| P9-49 | `diagram.routing.avoidUnrelatedBoxes` | bool | true | true | lint 32 | L2218, L4007 | K |
| P9-50 | `diagram.render.pngDpi` | int | 300 | 300 | DT-36 | L478, L2230 | K |
| P9-51 | `diagram.docxPlacement.exactLineSpacingPt` | pt | lepas spasi 13,5 pt lewat helper | = baseline | 9.4 | L2230-2232 | T |
| P9-52 | `diagram.mermaidInDeliverable` | bool | false (draf saja) | false | DT-35, lint 31 | L2237-2239 | K |
| P9-53 | `diagram.figmaCopy.reviewOnly` | bool | true (teks jadi kontur, tidak dimasukkan kembali) | true | 9.5 | L2241-2245 | K |
| P9-54 | `diagram.roundedCorners.onlyTerminator` | bool | true (stadium satu-satunya) | true | lint 23 | L2171, L3984 | K |
| P9-55 | `diagram.notationsPerFigure` | int | 1 | 1 | DT-44, SM-04 | L2252, L4651 | K |

Jumlah: 55 (P9-09..P9-26 = 18, P9-27..P9-31 = 5).

### 3.8 Bab 10: simbol engineering dan dialek (42 parameter)

Tabel 10.1 (L2298-2357) sangat tergeser. Edisi per baris direkonstruksi `[REK]`: SLD IEC 60617:2026 DB [T] dan IEC 81346-1:2022 [D], pustaka iec:; skematik kendali IEC 60617, IEEE 315 belum terverifikasi, sebagian; P&ID ANSI/ISA-5.1-2024 [T] menggantikan 2022, isa: (label 2022); denah keamanan legenda rumah atau SIA AG-01 v3.0 [T], sec:; alarm kebakaran NFPA 170:2024 [S] dan SNI 03-3985-2000, tidak ada; topologi tanpa standar formal, usulan net:; rak EIA-310, 1U = 44,45 mm [S], rack; label kabel ANSI/TIA-606-D [S], tidak ada; diagram alir ISO 5807:1985 dikonfirmasi 2019 [T], bentuk simpul; proses bisnis BPMN 2.0.2 [K], usulan bpmn:; arsitektur PL UML 2.5.1/C4 [K], sebagian; enterprise ArchiMate 4 April 2026 [T], tidak ada; DFD Gane-Sarson, shadowed; operasi MIL-STD-2525E [D], APP-6E 2025 [S], mil:; rambu ISO 7010:2019 + Amd 9:2025 [T], tidak ada; garis ISO 128-2:2022 [D], ya.

| ID | Kunci | Tipe | Default | Rentang / enum | Aturan | Sumber | Kelas |
|---|---|---|---|---|---|---|---|
| P10-01 | `symbol.dialect` | enum | - | iec (16), isa (12), sec (7), mil (6); usulan bpmn, net, fire | 10.4 | L2389, SK81, L4450-4451 | B |
| P10-02 | `symbol.dialectsPerDrawing` | int | 1 | 1 | SM-04, lint 35 | L2372-2373, L4013 | K |
| P10-03 | `symbol.standardByDrawingType` | map | Tabel 10.1 (16 jenis gambar) | admin | SM-05 | L2298-2357 | K |
| P10-04 | `symbol.editionStatus` | enum | - | T (situs penerbit), S (sekunder), D (tabel DATUM), K (pengetahuan umum) | Tabel 10.1 | L2356-2357 | K |
| P10-05 | `symbol.houseLegend.required` | bool | true bila sec: atau tanda rumah | true | SM-03, lint 34 | L2483-2484, L4011 | K |
| P10-06 | `symbol.houseLegend.disclaimer` | string | "bukan simbol standar" | tetap | SM-03 | L2368-2370, L2483-2484 | K |
| P10-07 | `symbol.kakOverride` | bool | true (KAK dan kontrak didahulukan) | true | SM-02 | L2364-2366 | K |
| P10-08 | `symbol.vendorIcon.modifiable` | bool | false | false | SM-06 | L2586-2587, L2674 | K |
| P10-09 | `symbol.genericIconsForBrandNeutral` | bool | true kecuali merek ditetapkan | bool | SM-06 | L2587-2588 | B |
| P10-10 | `designation.iec81346.prefixes` | map | = fungsi, + lokasi, - produk, : terminal | tetap | SM-07 | L2613-2617 | K |
| P10-11 | `designation.sameAcrossDrawingBoqAcceptance` | bool | true | true | SM-07 | L2425-2426, L2649 | K |
| P10-12 | `sheet.titleBlock.fields` | list | [judul satu kalimat, nomor gambar, revisi, tanggal, skala atau tanpa skala, pembuat, pemeriksa, klasifikasi] | tetap | SM-08 | L2639-2640 | K |
| P10-13 | `sheet.legend.style` | enum | baris keterangan, bukan kotak hiasan | keyRow | Tabel 10.7 | L2642-2643 | K |
| P10-14 | `sheet.lineLabel.required` | bool | true (isi aliran dan kapasitas) | true | SM-08 | L2375-2377, L2647 | K |
| P10-15 | `sheet.colour.reinforcementOnly` | bool | true (terbaca hitam-putih) | true | Tabel 10.7 | L2653 | K |
| P10-16 | `sheet.revisionOnChange` | bool | true | true | Tabel 10.7 | L2655 | K |
| P10-17 | `symbol.viewCone.fromLens` | bool | true (focal length + ukuran sensor) | true | SM-09 | L2489-2490 | K |
| P10-18 | `mil.identityByShape` | map | kawan persegi panjang, lawan belah ketupat, netral bujur sangkar, tak dikenal quatrefoil | tetap | SM-10 | L2520-2521 | K |
| P10-19 | `mil.frameRatioLocked` | bool | true | true | SM-10 | L2523-2524 | K |
| P10-20 | `mil.echelonMarks` | map | \| kompi, \|\| batalyon, X brigade, XX divisi, di atas bingkai | tetap | Tabel 10.5 | L2526-2527 | K |
| P10-21 | `mil.sidcRequiredForC2` | bool | true | true | Tabel 10.5 | L2529-2530 | K |
| P10-22 | `isa.locationLines` | map | tanpa garis lapangan; satu garis ruang kendali utama; dua garis lokasi bantu; putus tak terjangkau | tetap | Tabel 10.3 | L2454-2455 | K |
| P10-23 | `isa.shapeByFunction` | map | lingkaran instrumen; lingkaran dalam persegi tampilan bersama; segi enam komputer; belah ketupat dalam persegi PLC | tetap | Tabel 10.3 | L2451-2452 | K |
| P10-24 | `iec.switchFamilyMarks` | map | pemutus daya, pemisah, kontaktor dibedakan tanda pada kontak | tetap | Tabel 10.2 | L2414-2417 | K |
| P10-25 | `iec.atsAsChangeoverContact` | bool | true (tanpa kotak ATS karangan) | true | Tabel 10.2 | L2419-2420 | K |
| P10-26 | `iso5807.maxSteps` | int | ≈ 10, lebih dari itu sub-proses | angka | Tabel 10.6 | L2554-2555 | B |
| P10-27 | `iso5807.terminatorOnlyRounded` | bool | true | true | Tabel 10.6 | L2553 | K |
| P10-28 | `bpmn.gatewaySymbols` | map | eksklusif, + paralel, inklusif (glif `[TAK TERBACA]` sebagian) | tetap | Tabel 10.6 | L2557-2558 | K |
| P10-29 | `c4.levels` | list | [Konteks, Kontainer, Komponen, Kode]; proposal cukup dua pertama | subset | Tabel 10.6 | L2564-2565 | B |
| P10-30 | `archimate.versionOnDrawing` | bool | true (3.2 dan 4 berbeda) | true | Tabel 10.6 | L2567-2569 | K |
| P10-31 | `topology.layerOrder` | list | [WAN, inti, agregasi, lapangan] | urutan | 10.4 | L2589 | B |
| P10-32 | `topology.linkLabel.capacityOrProtocol` | bool | true (10G, 1G PoE, VPN IPsec) | true | 10.4 | L2588-2589 | K |
| P10-33 | `lineWeight.seriesR10Mm` | list | [0,13, 0,18, 0,25, 0,35, 0,5, 0,7, 1] | tetap | ISO 128-2 | L2591 | K |
| P10-34 | `lineWeight.thinThickRatio` | rasio | 1 : 2 | tetap | ISO 128-2 | L2591-2592 | K |
| P10-35 | `lineType.05_1.meaning` | string | pekerjaan di luar kontrak | tetap | 10.4 | L2592-2594 | K |
| P10-36 | `rack.unitMm` | mm | 44,45 | tetap | EIA-310 | L2596 | K |
| P10-37 | `rack.numberFromBottom` | bool | true | true | EIA-310 | L2596, L2265 | K |
| P10-38 | `labels.standard` | string | ANSI/TIA-606-D | tetap | 10.4 | L2597-2598 | K |
| P10-39 | `iso7010.prefixes` | map | E evakuasi, F kebakaran, M kewajiban, P larangan, W peringatan | tetap | 10.4 | L2600-2602 | K |
| P10-40 | `fire.minLegend` | list | detektor asap, detektor panas, titik panggil manual, alarm bunyi dan visual, panel MCFA, APAR atau hidran, jalur evakuasi | tetap | 10.4 | L2604-2606 | K |
| P10-41 | `symbol.verifyBeforeConstruction` | bool | true (cocokkan ke basis data IEC 60617) | true | SM-11 | L2433, L4718 | K (manusia) |
| P10-42 | `symbol.paidStandardsNotCopied` | bool | true | true | SM-12 | L2682, L4720 | K |

Catatan nomor kunci: P10-35 memakai nama ISO "05.1"; bila skema melarang garis bawah (DT-12), pakai `lineType.code0501.meaning`.

### 3.9 Bab 11-14: gaya bahasa L0-L6 (44 parameter)

#### 3.9.1 Parameter yang dapat disetel template (44)

| ID | Kunci | Tipe | Default | Rentang | Aturan | Sumber | Kelas |
|---|---|---|---|---|---|---|---|
| P11-01 | `doc.channel` | enum | dokumen | chat, surat, dokumen, dek, notifikasi, workbook (kanal K2 = panjang) | 16.5, Lampiran C.2 | L4104-4140, L4982-4983 | B |
| P11-02 | `doc.openingOrder` | enum | answerFirst (kanal keputusan) | answerFirst, legalBasisFirst (naskah dinas) | SG-L0-05 | L2877-2883 | B |
| P11-03 | `doc.readerKnowledgeMap` | object | dua kolom: dijelaskan vs dianggap diketahui | - | SG-L0-05 | L2877-2881 | B |
| P11-04 | `doc.identityStatement.required` | bool | true (jenis, penyusun, kebutuhan, satu jangkar terukur) | true | SG-L0-01, SG-L0-02 | L2854-2863, L2914-2915 | K |
| P11-05 | `doc.closing.actionAndRecipient.required` | bool | true | true | SG-L0-03 | L2865-2869 | K |
| P11-06 | `doc.authorityUmbrellaFirst` | bool | true pada dokumen yang bentuknya mengikat urutan | bool | SG-L1-01 | L2930-2934 | B |
| P11-07 | `doc.sequenceMap.required` | bool | true (cakupan per bagian dan yang tidak dicakup) | bool | SG-L1-03 | L2942-2945 | B |
| P11-08 | `prose.maxInlineNameValuePairs` | int | 3; lebih pindah ke tabel | 0-3 | SG-L1-04 | L2947-2951, L3019-3020 | K |
| P11-09 | `doc.pivotMoment.required` | bool | true untuk dokumen bersistem bab dan proposal tebal | bool | SG-L1-10, C-24 | L2986-2990 | K |
| P11-10 | `doc.pivotMoment.window` | range | setelah 25 % awal, sebelum 25 % akhir | 0,25-0,75 | SG-L1-10 | L2986-2989 | B |
| P11-11 | `paragraph.maxWords` | int | 150 (plafon bantu) | <= 150 | SG-L2-09 | L3082-3084, L3135 | K |
| P11-12 | `list.numberedWhenItemsGreaterThan` | int | 3 | 3 | SG-L2-04 | L3054-3058 | B |
| P11-13 | `letter.salutation.address` | string | "Yth. Bapak/Ibu/Saudara + jabatan" (bukan "Kepada Yth.") | tetap | SG-L5-08 | L3471 | K |
| P11-14 | `letter.salutation.opening` | string | "Dengan hormat," (bukan Halo, Hai) | tetap | SG-L5-08 | L3473 | K |
| P11-15 | `letter.selfReference` | string | kami (bukan saya atas nama lembaga, kita) | tetap | SG-L5-08 | L3473-3475 | K |
| P11-16 | `letter.readerReference` | string | Bapak, Ibu, Saudara; Anda di manual internal (bukan kamu) | tetap | SG-L5-08, R-17 | L3477, L4302-4304 | K |
| P11-17 | `letter.requestToPeer` | string | mohon (bukan tolong) | tetap | SG-L5-08 | L3479 | K |
| P11-18 | `letter.requestToSuperior` | string | berkenan, perkenan (bukan mohon segera) | tetap | SG-L5-08 | L3481 | K |
| P11-19 | `letter.closing` | string | "Atas perhatian Saudara, kami ucapkan terima kasih." | tetap | SG-L5-08 | L3483-3484 | K |
| P11-20 | `doc.readerPronoun` | enum | Anda (manual internal); Bapak/Ibu/Saudara (kanal resmi) | Anda, Bapak/Ibu/Saudara | R-17 | L4302-4304 | B |
| P11-21 | `lexicon.controlledGlossary` | map | Lampiran C.1: 6 kelas istilah dan perlakuannya | admin | SG-L4-10 | L4940-4962 | K |
| P11-22 | `lexicon.forbiddenClasses` | list | 7 kelompok: nama proses/alat internal; kode mentah dan sidik jari; status mesin kapital; jejak alamat berkas dan markup; riwayat edisi di badan; stempel korporat keliru; kata peremeh dan kasar-metaforis | admin | 16.6 | L4144-4158 | K |
| P11-23 | `lexicon.blacklistA4.wordBoundary` | bool | true; setiap pola baru membawa dua fixture regresi | true | SG-L6-05 | L3570-3573 | K |
| P11-24 | `threshold.clausesPerSentenceAvg.max` | float | 2,2 (doc, etalase) | DIAGNOSIS | SG-L6-01, C-26 | L3670 | K |
| P11-25 | `threshold.chainedSentencesPercent.max` | % | 20 (kalimat dengan >= 4 koma) | DIAGNOSIS | C-26 | L3673 | K |
| P11-26 | `threshold.semicolonsPer1000Words.max` | float | 5,4 | DIAGNOSIS | C-26, SG-L3-09 | L3676, L3102 | K |
| P11-27 | `threshold.wordsPerSentenceAvg` | range | 18-32 (kanal K2 panjang) | DIAGNOSIS | SG-L6-02, C-27 | L3680, L3549-3552 | K |
| P11-28 | `threshold.distinctOpenerRatio.min` | float | 0,20 (dokumen > 2.000 kalimat, INFO) | DIAGNOSIS | SG-L6-09 | L3684-3685 | K |
| P11-29 | `threshold.decisionVerbArtifactSubject.max` | rate | 2 per 1.000 kata (laporan, proposal) | DIAGNOSIS | SG-L6-10, C-28 | L3687-3688, L3606-3607 | K |
| P11-30 | `threshold.metaProcessToObjectRatio.max` | float | 8, tanpa objek bidang (seksi teknis) | DIAGNOSIS | SG-L6-11, C-29 | L3690-3692 | K |
| P11-31 | `threshold.schemaIdentifiersInProse.max` | int | 0 (doc, etalase) | DIAGNOSIS | SG-L6-12, C-30 | L3694 | K |
| P11-32 | `threshold.inlineProvenanceMarks.max` | rate | 1 per 20 kata | DIAGNOSIS | SG-L6-13, C-31 | L3696-3698 | K |
| P11-33 | `threshold.spellingVariantsPerValueClass.max` | int | 1 per berkas | DIAGNOSIS | SG-L6-14, C-33 | L3700 | K |
| P11-34 | `threshold.redundantCopiesNarrative` | object | lapisan narasi; boilerplate dikecualikan (daftar putih C-14) | DIAGNOSIS | SG-L6-04, C-14 | L3703, L3565-3568 | K |
| P11-35 | `jury.dimensions` | list | [kejelasan, kedalaman, kematangan susunan, penjaga pola], skala 1-5 | tetap | SG-L6-16 | L3717-3724 | K |
| P11-36 | `jury.threshold.saring` | object | rata-rata dimensi 1-3 >= 4; tidak ada dimensi 1-3 pada nilai 2 (pembanding `[TAK TERBACA]`); dimensi 4 >= 3 | tetap | 14.4 | L3730-3731 | K |
| P11-37 | `jury.threshold.lepas` | object | dimensi 1, 2, 3 masing-masing >= 4 dan dimensi 4 >= 3, adjudikasi dua juri (pembanding direkonstruksi dari "4" dan "3") | tetap | 14.4 | L3706-3707, L3733-3734 | K |
| P11-38 | `jury.minJudges` | int | 2 independen, bukan penulis | >= 2 | 14.5-14.6 | L3756-3762, L3781-3782 | K |
| P11-39 | `jury.adjudicationDiffPoints` | int | 2 (selisih >= 2 naik ke adjudikator ketiga) | 2 | 14.4-14.5 | L3739, L3760-3761 | K |
| P11-40 | `jury.snippetWords` | range | 150-600 kata tanpa alamat, nama, angka alat | 150-600 | 14.6 | L3781-3782 | K |
| P11-41 | `prose.emDash` | object | maks. 3 per 1.000 kata; 0 di judul | 0-3 | DT-38, SG-L3-09, lint 03 | L2830-2831, L3942-3944 | K (konflik K-09) |
| P11-42 | `sentence.sehinggaMaxPerSentence` | int | 1; konsekuensi berikutnya kalimat baru | 1 | SG-L3-09 | L3210-3213 | K |
| P11-43 | `prose.capsEmphasis.policy` | enum | rare (hanya negasi, kekekalan, larangan berisiko) | rare | SG-L4-02 | L3279-3283 | B |
| P11-44 | `prose.englishTerms.decorativeItalic` | bool | false; padanan lazim jadi kepala dengan asli dalam kurung sekali | false | SG-L4-04 | L3293-3300 | K |

Ambang lapis L6 berlabel "kalibrasi awal, DIAGNOSIS" dan "hanya berubah lewat jalur tata kelola" (L3532-3535, L3710), maka seluruhnya K.

#### 3.9.2 Klasifikasi 68 aturan SG: parameter, lint, atau juri

Kelas utama: **L** = ada pemindai otomatis; **P** = ditegakkan lewat struktur/parameter template tanpa pemindai; **J** = juri atau manusia. Sumber kolom PENEGAK: Tabel 12.1, 12.3, 12.5, 13.1, 13.4, 13.6, 14.1 (L2852-3660).

| Lapis | L (lint otomatis) | P (parameter/struktur) | J (juri/manusia) | Jumlah |
|---|---|---|---|---|
| L0 (L2850-2886) | - | L0-01 (blok identitas), L0-03 (penutup aksi), L0-05 (kanal, urutan pembuka) | L0-02, L0-04 | 5 |
| L1 (L2926-2993) | L1-01 (audit urutan seksi), L1-04 (C-31), L1-09 (C-14), L1-10 (C-24) | L1-03 (peta urutan), L1-06 (struktur bab hitungan), L1-07 (anatomi pesan pendek) | L1-02, L1-05, L1-08 | 10 |
| L2 (L3033-3089) | L2-01 (C-29), L2-04 (pemindai bantu), L2-06 (C-21), L2-09 (cacah paragraf) | - | L2-02, L2-03, L2-05, L2-07, L2-08 | 9 |
| L3 (L3151-3216) | L3-05 (C-31), L3-08 (sebaran), L3-09 (C-26) | - | L3-01, L3-02, L3-03, L3-04, L3-06, L3-07 | 9 |
| L4 (L3270-3353) | L4-01 (C-28), L4-02 (cacah kapital), L4-03 (C-30), L4-04 (leksikon padanan), L4-05 (terbilang, zona waktu), L4-06 (C-33), L4-10 (glosarium) | L4-09 (tata kelola daftar hitam) | L4-07, L4-08 | 10 |
| L5 (L3393-3465) | L5-08 (C-20, C-34) | - | L5-01 s.d. L5-07, L5-09 | 9 |
| L6 (L3539-3661) | L6-01, L6-02, L6-04, L6-05, L6-06, L6-07, L6-09, L6-10, L6-11, L6-12, L6-13, L6-14 | L6-03 (penanda D16), L6-08 (kanon satu pemecah), L6-15 (anggaran pemindai) | L6-16 (rubrik juri) | 16 |
| **Total** | **31** | **10** | **27** | **68** |

Catatan rekonstruksi: Tabel 14.1 mencetak nomor SG-L6-06 sampai SG-L6-14 bertumpuk di kiri (L3579-3588). Pemetaan judul ke nomor diambil dari Lampiran A.4 (L4852-4868): 06 C-20+C-34, 07 C-24, 08 kanon satu pemecah, 09 rasio pembuka, 10 C-28, 11 C-29, 12 C-30, 13 C-31, 14 C-33.

### 3.10 Bab 15: workbook dan command brief (31 parameter)

Kolom FUNGSI Tabel 15.1 tergeser (L3830-3847); 8 baris fungsi dipasangkan berurutan ke 8 sheet `[REK]`.

| ID | Kunci | Tipe | Default | Rentang | Aturan | Sumber | Kelas |
|---|---|---|---|---|---|---|---|
| P15-01 | `workbook.sheetClasses` | list | COVER (Tampilan: identitas dan angka kunci lewat rujukan); PETUNJUK (Kendali: kunci warna, peta sheet, batas model BTS-nn); KENDALI (Kendali: pemeriksaan silang dan bendera induk); RINGKASAN EKSEKUTIF (Tampilan: angka kunci dengan satuan dan provenans); REKAPITULASI (Tampilan: nilai per bab, PPN, total, terbilang); RAB (Tampilan: daftar kuantitas dan harga); AHS (Dasar harga: Permen PUPR 8/2023); HITUNG-nama (Hitung: satu domain per sheet, satu-satunya rumah konstanta) | 8 kelas | DT-40 | L3830-3847 | K |
| P15-02 | `workbook.numeralColour.constant` | tokenRef | signal (konstanta diketik tangan) | token | DT-40 | L3854 | K |
| P15-03 | `workbook.numeralColour.crossSheetRef` | tokenRef | verd | token | DT-40 | L3856 | K |
| P15-04 | `workbook.numeralColour.formula` | tokenRef | ink900 | token | DT-40 | L3858 | K |
| P15-05 | `workbook.numeralColour.externalLink` | tokenRef | alert | token | DT-40 | L3860 | K |
| P15-06 | `workbook.petunjuk.sections` | list | [kunci warna dengan contoh, struktur workbook, daftar bernomor batas dan kelemahan model] | 3 wajib | DT-40 | L3864-3865 | K |
| P15-07 | `workbook.kendali.minChecks` | int | 5 | >= 5 | DT-40 | L3866-3867 | K |
| P15-08 | `workbook.kendali.checks` | list | [jumlah silang, PPN, total, AHS ke RAB, uji nol]; masing-masing selisih, vonis, dasar | daftar | DT-40 | L3866-3868 | K |
| P15-09 | `workbook.kendali.passTolerance` | float | ABS(Cn) < 0,5 menjadi LULUS | angka | 15.1 | L3879 | K |
| P15-10 | `workbook.masterFlag.text` | pair | "SELURUH UJI LULUS" / "ADA UJI YANG GAGAL, JANGAN TERBITKAN", di panel beku | tetap | 15.1 | L3867-3869, L3875-3877 | K |
| P15-11 | `workbook.mergedCellsInComputationZone` | bool | false | false | lint 20 | L3869, L3978 | K |
| P15-12 | `workbook.print` | object | A4, muat lebar, baris kepala berulang, gridline mati, kaki blok register | tetap | 15.1 | L3869-3871 | K |
| P15-13 | `workbook.unitPerNumericColumn` | bool | true | true | Gaya Ahli kanal workbook | L3884-3886 | K |
| P15-14 | `workbook.emptyCellNeedsNote` | bool | true | true | Gaya Ahli kanal workbook | L3885-3886 | K |
| P15-15 | `workbook.derivedByFormula` | bool | true | true | Gaya Ahli kanal workbook | L3886 | K |
| P15-16 | `workbook.fontShipping` | object | assets/fonts + PASANG-DULU.txt (tidak bisa ditanam) | tetap | DT-09 | L474, L675-676 | K |
| P15-17 | `workbook.modelLimit.id.pattern` | string | `BTS-{nn}` | pola | Tabel 15.1 | L3833 | K |
| P15-18 | `workbook.constants.onlyInHitungSheets` | bool | true | true | Tabel 15.1 | L3839 | K |
| P15-19 | `brief.slideSizeMm` | [mm, mm] | [338,7, 190,5] (16:9) | tetap | DT-41 | L3892 | K |
| P15-20 | `brief.master` | enum | light | light, dark (hanya bila diminta) | DT-41, DT-05 | L3892-3893, L4399 | B |
| P15-21 | `brief.headline.isClaim` | bool | true (klaim, bukan topik) | true | DT-41 | L3894-3895, L3900-3910 | K |
| P15-22 | `brief.ideasPerSlide` | int | 1 | 1 | DT-41 | L3895 | K |
| P15-23 | `brief.bodyWordsMax` | int | ≈ 55 | <= 55 | DT-41 | L3895-3896 | B |
| P15-24 | `brief.sourceLineOnNumberSlides` | bool | true | true | DT-41 | L3896-3897 | K |
| P15-25 | `brief.closing` | object | keputusan yang diminta + empat angka; tidak pernah "Terima kasih" | tetap | DT-41 | L3897-3898 | K |
| P15-26 | `brief.forbidden` | list | animasi masuk, transisi, logo tiap slide, foto stok, set ikon, gradien, bayangan, sudut membulat, aksen kedua | larangan | DT-41 | L3912-3914 | K |
| P15-27 | `brief.bullets.max` | int | 5 | <= 5 | DT-41 | L3913 | K |
| P15-28 | `brief.slidePatterns` | enum | claimNumberBlock, chartOneAccent, specTable3Col, assumption, request | 5 pola | DT-41 | L3914-3916 | B |
| P15-29 | `brief.speakerNotes.evidenceWithMarks` | bool | true | true | DT-41 | L3916-3917 | K |
| P15-30 | `brief.speakerNotes.oneSentencePerChart` | bool | true | true | SG-L2-06 | L3917-3918 | K |
| P15-31 | `brief.marginMm` | mm | `[TAK TERBACA]`: token lama 9 mm, referensi 18 mm (E-22); tokens.json v2.0.0 tidak memuat margin brief | - | E-22 | L4388 | B (celah G-04) |

### 3.11 Bab 16: gerbang rilis (8 parameter)

| ID | Kunci | Tipe | Default | Aturan | Sumber | Kelas |
|---|---|---|---|---|---|---|
| P16-01 | `gate.lintFailureBlocksRelease` | bool | true | DT-42 | L3931, L4647 | K |
| P16-02 | `gate.lintRegistry` | list | 38 pemeriksaan (manual) / 39 (kode) dengan batas dan tahap | 16.1 | L3936-4021, LT36-74 | K |
| P16-03 | `gate.stepsByTier` | list | 10 langkah, kolom tier | Tabel 16.2 | L4040-4079 | K |
| P16-04 | `gate.callSiteGuards` | list | [G1, G2, G3, N1] + ulang 03, 04, 09, 10, 16 | 16.2 | L4025-4031 | K |
| P16-05 | `gate.manualChecklist` | list | 10 butir 16.4 | 16.4 | L4081-4098 | K |
| P16-06 | `gate.channelRoutes` | map | 7 kanal: chat, surat dinas, dokumen/proposal, dek, notifikasi, workbook, chart, gambar teknik (Tabel 16.3) | 16.5 | L4102-4140 | K |
| P16-07 | `gate.colophon.honestStatement` | bool | true; satu kalimat berbahasa pembaca; hasil periksa disimpan sebagai register, bukan ditempel | 14.6, 16.6 | L3787-3788, L4157 | K |
| P16-08 | `gate.pdf.checkPageBeforeRelease` | bool | true (--check-page) | 3.3 | L488 | K |

Catatan: Tabel 16.3 mencantumkan 8 baris kanal (chat, surat dinas, dokumen dan proposal, dek, notifikasi, workbook, chart, gambar teknik), bukan 7. P16-06 memakai 8 nilai.

### 3.12 Lampiran A-D (4 parameter)

| ID | Kunci | Tipe | Default | Sumber | Kelas |
|---|---|---|---|---|---|
| PA-01 | `rules.index` | list | DT-01..44, CH-01..14, SM-01..12, SG (68) dengan kolom rumah | L4545-4874 | K |
| PB-01 | `checklist.preSerah.items` | list | 20 butir dengan pemetaan aturan dan bendera SERAH (5.2) | L4879-4931 | K |
| PC-01 | `glossary.termClasses` | list | 6 kelas (nama produk/standar; protokol; istilah berpadanan baku; padanan belum mapan; idiom korespondensi Inggris; pasangan sementara) | L4940-4962 | K |
| PD-01 | `sourceRegister.columns` | list | [DOKUMEN, VERSI/TANGGAL, BAHASA/HALAMAN, KLASIFIKASI, DIPAKAI DI] | L5008-5030 | B |

### 3.13 Rekap jumlah parameter

| Kelompok | Jumlah |
|---|---|
| Bab 1-2 tata kelola | 4 |
| Bab 3 tier, penamaan, penomoran | 24 |
| Bab 4 warna 35, tipografi 99, grid 17, garis 15, perangkat 27, sampul 16, lembar kendali 6, anatomi 10 | 225 |
| Bab 5 tabel dan aparatus bukti | 68 |
| Bab 6 kepatuhan, satuan, reproduksi | 43 |
| Bab 7-8 chart (global 36, khusus keluarga 87, peta 2) | 125 |
| Bab 9 diagram | 55 |
| Bab 10 simbol | 42 |
| Bab 11-14 bahasa | 44 |
| Bab 15 workbook dan brief | 31 |
| Bab 16 gerbang | 8 |
| Lampiran A-D | 4 |
| **Total** | **673** |

## 4. Registri jenis section (section type registry)

Alamat penyuntingan yang diusulkan: `bab.seksi.paragraf` (mis. `5.2¶3`), artefak memakai pola manual (`Tabel 5.2`, `Gambar 8.1`, `Turunan D-6.1`) yang bernomor per bab (L132-133). Lampiran memakai huruf (`Tabel A.1`, L4555).

### 4.1 Section dokumen (29 jenis)

| ID | Jenis (`sectionType`) | Register | Unsur wajib | Parameter utama | Aturan | Sumber |
|---|---|---|---|---|---|---|
| S01 | `cover` | pembungkus | pita segel, logo (sekali), baris alamat, Datum Rule 166 mm, kicker, judul, standfirst, baris cakupan, blok kendali, kolofon, string punggung | P4V-01..16, P4S-15..27 | DT-13, DT-14 | L792-796, L1-23 |
| S02 | `controlSheet` | pembungkus | riwayat revisi, rantai verifikasi 3 lapis, pernyataan metode, distribusi terkendali, 3 tanda tangan | P4K-01..06 | 4.8 | L26-73, L797-798 |
| S03 | `toc` | pembungkus | bagian, bab, lampiran, nomor halaman; catatan paginasi | `toc.levels` (bagian, bab, lampiran), catatan nomor halaman dari render PDF | 1.3 | L76-133 |
| S04 | `partDivider` | pembungkus | label BAGIAN n, judul, standfirst, daftar bab | Datum Rule, string punggung | Tabel 4.1 | L136-146, L559-569, L586 |
| S05 | `signatureBlock` | pembungkus | peran, nama/unit, tanggal | P4K-05..06 | Tabel 4.1, SG-L5-02 | L71-73, L586-588, L3404-3407 |
| S06 | `chapter` | interior | kicker BAB n (signal), Datum Rule, judul label (bukan pertanyaan), rel status opsional | P4T-S01, S02, P4A-04..05 | DT-38, SG-L1-02, SG-L1-08 | L149-151, L819-823 |
| S07 | `section` | interior | nomor mono ink400 + judul condensed 600; badge provenans di rel opsional (TERUKUR + sumber) | P4T-S03, X10-X11 | Tabel 4.7 no. 6 | L153-154, L830 |
| S08 | `appendix` | interior | kicker LAMPIRAN huruf, judul, penomoran artefak berhuruf | sama dengan chapter | 1.3 | L4547-4555, L4879-4881 |
| S09 | `paragraph` | interior | teks badan; peran (`role`: identity, anchor, body, pivot, closingAction); chip rel | P4T-S04, P11-11, P5-39..41 | SG-L0-01..03, SG-L1-10, SG-L2-01..09 | L832, L2850-3135 |
| S10 | `list` | interior | butir bertanda atau bernomor | P11-12 | SG-L2-04 | L253-271, L379-398 |
| S11 | `aside` | interior | label condensed kapital, garis atas 0,35, garis rambut bawah, tanpa isian; varian: generic, doctrine (DIKTUM), story (KEMASAN BUKAN KEPEDULIAN), quickCheck (TIGA CEK TERCEPAT), ifInDoubt (BILA RAGU) | P4R-12, P5-28..29, P4T-X08..X09 | DT-20, R-12 | L336-339, L437-442, L925-937, L2379-2382, L2912-2917 |
| S12 | `monoBlock` | interior | label kapital + listing mono (pola kode, rumus, perintah alat, kepala lembar skor juri) | face mono | 5.6, 14.4, 14.6, 15.1 | L970-982, L3745-3752, L3790-3795, L3873-3879 |
| S13 | `assumptionInline` | interior | tanda ASUMSI + ID ASM + dampak bila salah di rel | P5-42, P5-63..64 | DT-27, 1.5 | L276-283 |
| S14 | `table` | interior | caption atas, kepala, baris, pita kelompok opsional, total opsional, SUMBER + PROVENANS bawah | P5-01..25 | DT-15..18 | L857-896 |
| S15 | `specTable` | interior | PARAMETER, KONDISI UJI (menjorok), NILAI, SATUAN | P5-26..27 | DT-19 | L898-923 |
| S16 | `registerTable` | interior | preset: asumsi (ASM), rekonsiliasi (R-nn), temuan (E-nn/C-nn), regulasi hidup/mati, edisi standar, peningkatan (P-nn), riwayat revisi, distribusi | P5-62..66, P6-10..11 | DT-27, DT-29 | L1050-1060, L1107-1127, L4232-4316, L4325-4430, L4462-4502 |
| S17 | `exampleWrongRight` | interior | ATURAN, SALAH (salinan nyata), BENAR (salinan nyata); catatan elipsis dan ejaan sumber dipertahankan | kolom 3 atau 4 | 11.3 | L517-538, L1184-1206, L2888-2910, L3900-3910 |
| S18 | `ruleTable` | interior | NOMOR, JUDUL DAN PERNYATAAN (verbatim), CARA PAKAI, PENEGAK | verbatim terkunci | 11.3 | L2850-2886, L3539-3661 |
| S19 | `derivation` | interior | kepala "TURUNAN D-n.m · judul", baris aritmetika mono dengan tanda, hasil + vonis toleransi, kalimat penutup | P5-48..53, P4R-13..14, P4T-S13 | DT-24 | L727-741, L991-999, L1162-1171 |
| S20 | `chart` | interior | caption kesimpulan, plot, label langsung, baris KUNCI opsional, SUMBER + tanggal + PROVENANS | P7-01..36, registri 3.6.2 | CH-01..14 | L1374-1405, L1591-1593 |
| S21 | `diagram` | interior | spec JSON (Tabel 9.1), caption, SUMBER, KUNCI, PROVENANS | P9-01..55 | DT-35..37, DT-39, DT-44 | L2094-2132, L362-365, L501-504 |
| S22 | `image` | interior | gambar raster (spesimen halaman, foto), dpi, lebar, caption, SUMBER, PROVENANS | lebar {128, 166}, dpi (200 pada Gambar 4.1, 300 untuk chart) | DT-15, DT-36 | L806-809 |
| S23 | `symbolSheet` | interior | lembar simbol per dialek, paginasi blok 247 mm, legenda | P10-01..06 | SM-03, E-18 | L2403-2405, L2475-2477, SK81 |
| S24 | `checklist` | interior | NO/CEK, BUTIR, ATURAN, bendera tier; kotak centang U+25A1 | PB-01 | 8.6, Lampiran B | L2060-2075, L4083-4098, L4887-4931, SK115-116 |
| S25 | `glossary` | interior | KELAS ISTILAH, PERLAKUAN, CONTOH; atau ISTILAH, ARTI, RUMAH | PC-01 | SG-L4-10 | L4940-5001 |
| S26 | `sourceRegister` | interior | dokumen sumber dan sumber eksternal | PD-01 | 1.4, Lampiran D | L5008-5055 |
| S27 | `ruleIndex` | interior | NOMOR, ATURAN, RUMAH per awalan | PA-01 | Lampiran A | L4545-4874 |
| S28 | `referenceScale` | interior | skala tetap Admiralty (A-F, 1-6) dan pita ICD 203; dicetak sekali di lampiran | P5-54..60 | DT-25, DT-26 | L1010-1036 |
| S29 | `financialTable` | interior | preset BoQ (6 kolom), AHS (baris A-F), rekapitulasi (PPN sekali, total, terbilang) | P6-19..30 | DT-31, DT-33 | L1153-1178 |

### 4.2 Perangkat halaman (7 jenis, bukan section tetapi wajib di registri)

| ID | Perangkat | Parameter | Sumber |
|---|---|---|---|
| F1 | `runningHead` | P4A-01..03, P4T-S11 | L147, L815-817 |
| F2 | `registerBlock` | P4S-10..14, P4T-S12 | L769-772, L786-788 |
| F3 | `sealBand` | P4S-15..19 | L774 |
| F4 | `spineString` | P4S-20..25 | L777-778 |
| F5 | `evidenceRail` | P4S-07..09, P4G-05, P4G-16, P4T-S10 | L768, L784-785, SK36-49 |
| F6 | `datumRule` | P4S-01..06 | L765-766, L821 |
| F7 | `issueStampColophon` | P4S-26..27, P4V-13 | L22, L780 |

### 4.3 Section kanal lain (15 jenis)

| ID | Jenis | Unsur | Sumber |
|---|---|---|---|
| C01 | `letter` (surat pengantar dan surat dinas) | sapaan, inti satu kalimat, satu usul ya/tidak, penutup (SG-L1-07, SG-L5-08); pengecualian Arial 12 (DT-32) | L1147-1151, L2970-2974, L3467-3486 |
| C02-C06 | `slide.claimNumberBlock`, `slide.chartOneAccent`, `slide.specTable3Col`, `slide.assumption`, `slide.request` | headline klaim, baris sumber, catatan pembicara | L3914-3918 |
| C07-C14 | `sheet.cover`, `sheet.petunjuk`, `sheet.kendali`, `sheet.ringkasanEksekutif`, `sheet.rekapitulasi`, `sheet.rab`, `sheet.ahs`, `sheet.hitung` | lihat P15-01 | L3830-3847 |
| C15 | `drawingSheet` (lembar gambar teknik) | blok judul, legenda, satu dialek, label garis, penandaan, sumber, revisi; usulan blok ISO 7200 A3 (P-05) | L2635-2657, L4476 |

## 5. Tier: parameter aktif dan dilepas

Sumber: Tabel 3.1 (L417-428), 3.2 (L446-460), Tabel 16.2 kolom TIER (L4040-4079), Lampiran B (L4883-4885).

| Kelompok parameter | NOTA | TERBIT | SERAH | Bukti / status keyakinan |
|---|---|---|---|---|
| Format | Markdown | .docx atau .xlsx DATUM penuh | aparatus penuh + PDF | L419-425 |
| Sampul (S01), pita segel, string punggung, cap terbit | dilepas | aktif | aktif | L419 "Sampul" dilepas; perangkat pembungkus mengikuti sampul (DITURUNKAN) |
| Lembar kendali (S02) | dilepas | aktif | aktif | ASUMSI: tidak disebut eksplisit di Tabel 3.1; diturunkan dari "sampul dilepas" |
| Blok register (F2) | dilepas | aktif | aktif | L419-420 |
| PDF (P3-06) | dilepas | dilepas kecuali diminta | aktif | L419-425 |
| Lint (P3-08) | dilepas | wajib | wajib | L419-425 |
| Rekonsiliasi halaman (P3-07) | dilepas | dilepas | aktif (audit halaman dan angka) | L419-425 |
| Tanda provenans (P5-30..42) | aktif | aktif | aktif | L432-433 "NOTA tetap membawa tanda provenans" |
| Pengikatan register (P5-43..44) | aktif | aktif | aktif | L433 |
| Klasifikasi dan regulasi (Bab 6) | aktif | aktif | aktif | DITURUNKAN dari hierarki 2.5 butir 2 (L386-387) |
| Audit angka audit_docx, audit_retired (P5-46..47) | - | - | wajib | L987-989, L4064 |
| Rute turunan kedua + tabel rekonsiliasi (P5-67..68) | - | - | wajib | L449-451 |
| Blok turunan setiap angka beban keputusan (S19) | opsional | opsional | wajib | L453-454 |
| Rel bukti terpakai di halaman beban keputusan (F5) | - | opsional | wajib | L456-457 (konflik moda rel K-11) |
| Gambar dari mesin diagram (S21), bukan sketsa/Mermaid | ASUMSI: Mermaid boleh sebagai draf berpikir | wajib (langkah 3) | wajib | L459-460, L2237 |
| Gerbang langkah 1 sisir sendiri, 10 serah-rekam | aktif | aktif | aktif | L4044, L4076 ("semua") |
| Gerbang langkah 2 datumcheck, 3 lint bangun, 4 mekanik naskah, 5 lint berkas, 7 mata | - | aktif | aktif | L4047-4067 |
| Gerbang langkah 6 audit angka, 8 juri buta, 9 pemeriksa independen + uji fotokopi | - | - | aktif | L4064-4074 |
| Lampiran B butir 17 (audit angka, dua juri LEPAS, pemeriksa independen) | - | - | aktif | L4923 |

Catatan: uji fotokopi muncul dua kali, di daftar manual 16.4 (dipanggil langkah 7, tier TERBIT, L4067-4068, L4083) dan di langkah 9 (SERAH, L4073-4074). Lihat konflik K-29.

## 6. Gerbang rilis dan lint: otomatis di HQ vs penilaian manusia

### 6.1 Lint DATUM (39 pemeriksaan)

Kolom BATAS dan TAHAP Tabel 16.1 tergeser (L3940-3963). Rekonstruksi 24 baris pertama berurutan, lalu dicocokkan ke `LT36-74` (kode skill) dan ke rangkuman tahap manual ("langkah 3: 24, 26, 32 sampai 35, 37" L4050-4051; "mata: 08, 12, 13, 15" L4067-4068). Kecocokan tahap 39 dari 39. Batas cocok kecuali lint 03 (konflik K-09).

Kolom "HQ": **S** = dijamin skema saat menyusun (by construction); **R** = dihitung setelah render; **X** = pemindaian teks; **M** = butuh mata.

| No | Pemeriksaan | Batas | Tahap manual | HQ | Aturan |
|---|---|---|---|---|---|
| 01 | Deret KPI tile, strip statistik | 0 | berkas | S | DT-38, CH-13 |
| 02 | Kotak callout berisi warna | 0 | berkas | S | DT-20 |
| 03 | Tanda pisah panjang per 1.000 kata; nol di judul | maks. 3 (manual) / 0 (kode) | berkas | X | DT-38 |
| 04 | Judul berbentuk pertanyaan | 0 | berkas | X | DT-38 |
| 05 | Fon bawaan Office | 0 | berkas | S | DT-08 |
| 06 | Sampul di tengah | 0 | berkas | S | DT-14 |
| 07 | Garis tegak di tabel | 0 | berkas | S | DT-16 |
| 08 | Baris kepala tabel berisi warna | 0 | mata | S (manual: M) | DT-16 |
| 09 | Tabel data tanpa kolom satuan | 0 | berkas | S | DT-17 |
| 10 | Tabel atau gambar tanpa SUMBER | 0 | berkas | S | DT-15 |
| 11 | Angka beban keputusan tanpa tanda | 0 | berkas | S + X | DT-21 |
| 12 | Warna dekoratif | 0 | mata | S + M (sebagian) | DT-06 |
| 13 | Chart dirasterisasi | 0 | mata | S (manual: M) | DT-36 |
| 14 | Nilai warna terlihat pada satu halaman | maks. 5 | berkas | R | DT-06 |
| 15 | Ukuran baris badan | 66-80 karakter | mata | R (manual: M) | DT-10 |
| 16 | Nilai dan satuan tanpa spasi | 0 | berkas | X | DT-30 |
| 17 | ± tanpa arti | 0 | berkas | X | DT-30 |
| 18 | Klasifikasi salah untuk penerima | 0 | berkas | S | DT-28 |
| 19 | PPN selain 11 % non-mewah 2026 | 0 | berkas | S + X | DT-31 |
| 20 | Sel gabungan di zona komputasi | 0 | berkas | S | DT-40 |
| 21 | Garis < 0,18 mm atau rona < 15 % | 0 | berkas | S | DT-11 |
| 22 | Klaim eksternal tanpa Admiralty | 0 | berkas | S | DT-25 |
| 23 | Sudut membulat di luar terminator | 0 | berkas | S | DT-37 |
| 24 | Penghubung tanpa label | 0 | bangun | S | DT-37 |
| 25 | Nilai warna pada satu gambar | maks. 5 | berkas | S + R | DT-06 |
| 26 | Subjek beraksen pada satu gambar | maks. 1 | bangun | S | DT-37 |
| 27 | Garis diagram < 0,18 mm | 0 | berkas | S | DT-11 |
| 28 | Huruf diagram < 5,5 pt | 0 | berkas | R | Tabel 10.7 |
| 29 | Gambar tanpa SUMBER | 0 | berkas | S | DT-15 |
| 30 | Gambar tanpa nomor atau caption | 0 | berkas | S | DT-15 |
| 31 | Sumber Mermaid dalam berkas terbit | 0 | berkas | X | DT-35 |
| 32 | Penghubung melewati kotak tak terkait | 0 | bangun | R | 9.3 |
| 33 | Gambar lebih tinggi dari blok 247 mm | 0 | bangun | R | 9.4 |
| 34 | Tanda rumah tanpa legenda | 0 | bangun | S | SM-03 |
| 35 | Lebih dari satu dialek per gambar | 0 | bangun | S | SM-04 |
| 36 | Aparatus didelegasikan ke halaman | lapor | berkas | S | 9.4 |
| 37 | Lembar melewati halaman A4 | 0 | bangun | R | 9.4 |
| 38 | Garis bawah di nama berkas, folder, sheet | 0 | berkas | X | DT-12 |
| 39 | Residu rentang token tertelan (kode saja) | 0 | berkas | X | SK140, SK321-342, LT74 |

Sumber: L3936-4021, LT36-74.

### 6.2 Daftar pemeriksaan otomatis untuk HQ (83 butir)

| Kelompok | Butir | Jumlah | Sebagian |
|---|---|---|---|
| A. Lint DATUM | 01-39 (6.1) | 39 | 1 (lint 12) |
| B. Penjaga titik panggil datumcheck | G1 sel = kepala; G2 lebar 128/166; G3 teks muat kolom; N1 garis bawah di nama (L4025-4031) | 4 | 0 |
| C. Pemindai bahasa | C-14 salinan berlebih; C-20 sapaan institusional; C-21 artefak yatim; C-24 momen pembalik; C-26a klausa/kalimat; C-26b kalimat berantai; C-26c titik-koma; C-27 kata/kalimat; C-28 subjek keputusan; C-29 objek bidang; C-30 identifier skema; C-31 densitas provenans; C-33 konvensi numerik; C-34 kamu/Yth.; INFO rasio pembuka; A4 daftar hitam batas kata; 16.6 tujuh kelas kata terlarang; cacah paragraf 150 kata (SG-L2-09); butir bernomor bila > 3 (SG-L2-04) | 19 | 0 |
| D. Struktur dan aparatus | D01 angka tak terlacak (audit_docx); D02 nilai pensiun (audit_retired); D03 turunan dihitung ulang terhadap register; D04 kalimat penutup turunan ada; D05 terbilang cocok angka; D06 logo tepat sekali; D07 REQ, kuantitas, total cocok di seluruh paket; D08 klasifikasi di setiap halaman produk operasional; D09 labels_verified true untuk diagram terbit; D10 KENDALI >= 5 uji + bendera induk; D11 caption satu kalimat dan tanggal berlaku (sebagian); D12 jenis chart cocok kelompok tujuan (Tabel 7.2); D13 jumlah kategori/seri dalam batas Tabel 7.3; D14 bar/column/area mulai nol (CH-01, tidak ada di lint); D15 tidak ada judul dalam plot (CH-05); D16 section wajib per tier ada (mis. tabel rekonsiliasi SERAH); D17 blok identitas halaman pertama ada (SG-L0-01); D18 paragraf penutup punya aksi + penerima (SG-L0-03, kehadiran); D19 zona waktu pada setiap waktu (SG-L4-05); D20 skala Admiralty dicetak sekali di lampiran bila dipakai; D21 istilah ICD 203 dalam kosakata pita dan tidak dicampur keyakinan (sebagian) | 21 | 2 (D11, D21) |
| **Total** | | **83** | **3** |

Workbook: SKILL.md mencatat lint workbook `datumbuku.py` 23 cek W01-W23 (SK73). Daftar itu tidak ada di manual, sehingga tidak dihitung di 83; lihat celah G-06.

### 6.3 Pemeriksaan yang butuh penilaian manusia

| ID | Pemeriksaan | Aturan | Sumber |
|---|---|---|---|
| H01 | Uji lima detik oleh orang yang tidak ikut membuat chart | CH-10, Tabel 8.9 no. 12 | L1258, L2073, L4098 |
| H02 | Uji fotokopi fisik: cetak 100 %, fotokopi dua kali, baca 40 cm | DT-11, DT-34 | L1219-1220, L4083 |
| H03 | Setiap kotak diagram komponen nyata, setiap garis antarmuka nyata | 9.1 | L2087-2092, L4095-4096 |
| H04 | Kejujuran rel bukti (tidak diisi agar terlihat sibuk) | DT-43 | L784-785, L4087 |
| H05 | Kecukupan kalimat akibat pada turunan | DT-24 | L4088 |
| H06 | Keberlakuan regulasi dan edisi standar (tinjau tahunan, veritas) | DT-29, SM-05 | L1127, L4089-4091 |
| H07 | Penetapan labels_verified oleh PRISMA setelah veritas | DT-39 | L2128-2132 |
| H08 | Rubrik juri buta 4 dimensi, minimal 2 juri bukan penulis | SG-L6-16 | L3652-3658, L3715-3743 |
| H09 | Pemeriksa independen (bukan penulis, bukan juri) | 14.5, langkah 9 | L3761-3762, L4073-4074 |
| H10 | Makna warna dekoratif (sisa lint 12) | DT-06 | L3962, L4067 |
| H11 | Chart khusus hanya bila default gagal | CH-14 | L1249-1251 |
| H12 | Kerucut pandang dari lensa nyata | SM-09 | L2489-2490 |
| H13 | Simbol dicocokkan ke basis data standar sebelum terbit konstruksi | SM-11 | L2433 |
| H14 | 27 aturan SG kelas J (3.9.2) | SG | L2850-3661 |
| H15 | Klasifikasi minimum untuk data tapak militer (penilaian isi) | 6.1 | L1098-1101 |
| H16 | Mutu kalimat kesimpulan pada caption chart | CH-05 | L1402-1405 |

## 7. Celah dan konflik

### 7.1 Konflik antar-sumber (manual vs tokens.json vs kode skill)

Prinsip putus: manual menyatakan tokens.json menang atas prosa (DT-03, L285-287). Namun tokens.json di disk adalah rebuild v2.0.0 yang bukan salinan 1.8 (TK4-6), sehingga aturan DT-03 tidak otomatis berlaku untuk nilai yang tokens.json v2.0.0 sendiri tidak muat. Rekomendasi putusan di kolom terakhir adalah usulan analis, perlu keputusan admin.

| ID | Pokok | Manual | tokens.json / kode | Dampak skema | Usulan |
|---|---|---|---|---|---|
| K-01 | Versi token | Mengutip tokens.json versi 1.8 (L646, L490) dan skill v1.8 Rev J (L20) | tokens.json v2.0.0 rebuild (TK4-6); SKILL.md menyebut v2.6.0 (SK4) dan v2.1.0 (SK13) | Rujukan versi skema harus menyimpan versi token terpisah dari versi manual | Simpan `tokens.version` dan `manual.revision` sebagai dua medan |
| K-02 | Seksi token yang hilang | Merujuk tokens.json `table`, `diagram.node.shapes`, `diagram.edge_kinds`, `signature_devices`, `classification`, `units`, `provenance.marks`, `workbook.sheet_classes` (L884, L2189, L2210, L782, L1086, L1206, L953, L3848) | Tidak ada di TK1-117; diagram tinggal di DD138-170; marks di `marks` (TK102), bukan `provenance.marks` | Nilai ini hanya punya prosa atau kode sebagai sumber | HQ menjadikan katalog ini sumber token tunggal untuk seksi tersebut |
| K-03 | wrapper.cream | Tidak disebut | #F6E9E9 (TK22) | Token tanpa tugas | Simpan, tandai tanpa peran sampai admin menetapkan |
| K-04 | interior.link biru | "Biru tidak ada di palet" (L1413) | #0563C1 (TK34) | Bertentangan dengan R-02 untuk chart | Batasi ke hyperlink dokumen; larang di chart dan diagram |
| K-05 | Bobot kepala halaman | Cond 400, karena 500 tidak dikirim (L711, L717, E-25 ditutup di manual L4396) | weight 500 (TK72) | Renderer jatuh ke fallback | Pakai 400 sampai fon 500 dikirim |
| K-06 | Garis rambut | 0,20 mm; manual memasang 0,22 (E-05, L757, L4346) | hair 0,20; catatan "jangan ditiru" (TK95, TK100); Word hanya sz5 = 0,22 mm | Nilai per renderer berbeda | Simpan nilai logis 0,20 + kuantisasi per format (P4R-11) |
| K-07 | ink100 sebagai zebra | Zebra ink100 (L877); lantai rona 15 % (L1216) | ink100 = rona 5,3 % (E-07, L4351) | Zebra gagal lantai fotokopi | Definisikan token zebra baru pada rona 15 % (usulan E-07) |
| K-08 | Warna caption | Peran palet: ink400 untuk caption (L633 [REK]) | Skala: caption ink700 (L705 [REK], TK69) | Dua nilai untuk satu unsur | Pakai skala (ink700), sesuai DT-03 dan TK69 |
| K-09 | Tanda pisah panjang | Maks. 3 per 1.000 kata (L2830, L3942, L4193) | DATUM-03 batas 0 (LT38); U+2014 nol mutlak (SK106-109) | Ambang lint berbeda | Admin memilih; skill terbaru (0) lebih ketat |
| K-10 | Jumlah lint | 38: 27 berkas, 7 bangun, 4 mata (L3931-3933) | 39 (DATUM-39), berkas 28 (SK72, LT74) | Registri lint | Pakai 39 |
| K-11 | Rel bukti kosong | "Rel bukti yang kosong itu benar" (DT-43, L784-785) | RAIL-BUKTI-DUA-MODA: rel dialokasikan tanpa chip DILARANG; moda B margin 20 mm, teks 166 mm (SK36-49) | Grid tidak lagi tetap; `railMode` turunan | Adopsi moda A/B sebagai P4G-16; DT-43 berlaku hanya di dalam moda A per halaman |
| K-12 | Namespace chart | 58 jenis berkode P/H/K/W/S/G (L1575-1578) | pustakachart.py: katalog VCTL vNN (v01..v99) + ap01-06, 74 PNG (PC191-1435, SK80) | Kode chart HQ tidak bisa dipetakan otomatis ke fungsi kode | Buat tabel pemetaan kode manual ke vNN (celah G-05) |
| K-13 | Ramp heatmap | Satu gradasi putih ke signal (L1554, L1916) | RAMP paper → ink200 → ink400 → ink900 (PC114) | Warna heatmap berbeda | Putusan admin; manual lebih spesifik |
| K-14 | Kode klasifikasi di nomor | Kode klasifikasi unsur pertama nomor (L1088) | Pola nomor `urut/GSP/kode/bulan/tahun` tanpa kelas (L1138-1141); kelas muncul di cap terbit (L22) | Format nomor ambigu | Cek .docx; sementara simpan kelas sebagai medan terpisah |
| K-15 | Kode jenis dokumen | DATUM memuat DS | ARSIP tidak memuat DS (E-21, L1142-1145) | Enum P3-20 | Putusan ARSIP |
| K-16 | Margin brief | 9 mm token lama vs 18 mm referensi (E-22, L4388) | Tidak ada di tokens v2.0.0 | P15-31 tanpa nilai | Putusan admin |
| K-17 | Default aparatus diagram | Dokumen menyebut page (L2226) | Kode default figure (E-20, L4383) | P9-37 default | Pakai page untuk diagram dalam dokumen |
| K-18 | Fon glif provenans | DejaVu Sans ditanam (R-14, L667, L4291-4292) | "jangan tukar font", fallback Word (TK108); pustakachart memakai DejaVu (PC103) | Dua kebijakan | Ikuti R-14 dan kode (DejaVu) |
| K-19 | Warna tanda provenans | Per tanda: ink900, signal, ink400, alert (Tabel 5.3 [REK]) | Catatan "tetap mono amber di XML" (TK108) | Warna tanda berbeda | Cek .docx Tabel 5.3; sementara per-tanda |
| K-20 | Choropleth | Default untuk wilayah (L1248-1249, L1495) | Tidak digambar di pustaka (L1866-1870) | Chart default tanpa resep | Tambah resep atau ganti default ke tile map G-01 |
| K-21 | Status E-11, E-18 | Terbuka (L4362, L4378) | Ditutup di datumsimbol.py (SK81) | Status temuan berbeda | Pakai status skill terbaru |
| K-22 | Bobot temuan E-05..E-29 | Kolom ID, bobot, status tergeser (L4344-4407) | - | Register temuan | Rekonstruksi berurutan: E-05..E-10 Mayor, E-11..E-15 Minor, E-16..E-17 Mayor, E-18..E-29 Minor; dicocokkan rujukan silang E-05 (L757), E-07 (L635), E-10 (L4167), E-11 (L2390), E-12 (TK115), E-21 (L1144), E-25 (L717) |
| K-23 | Font workbook | Plex Sans | Plex Sans (TK51) | Tidak ada konflik | - |
| K-24 | Penjaga titik panggil | 4 penjaga (L4025-4031) | datumcheck juga A1-A6 audit berkas jadi (SK78, SK82) | Gerbang tambahan | Tambah A1-A6 sebagai kelompok D di masa depan |
| K-25 | Nama lint 15 | "Ukuran baris badan dalam karakter" | "Body measure in characters" (LT50) | Tidak ada konflik | - |
| K-26 | Pembanding juri | ≥ dan ≤ hilang (L3706, L3730-3734) | - | P11-36..37 | Cek .docx |
| K-27 | Glif provenans | U+FFFD (L945-951) | ■ ◈ ◇ △ (TK104-107) | P5-30..37 | Pakai TK |
| K-28 | Tabel 10.1 | Kolom edisi dan pustaka tergeser (L2302-2357) | - | P10-03 | Cek .docx |
| K-29 | Letak uji fotokopi | Langkah 7 TERBIT memanggil 16.4 yang memuat uji fotokopi (L4067, L4083) | Langkah 9 SERAH (L4073-4074) | Tier aktif uji fotokopi | Putuskan: wajib SERAH, anjuran TERBIT |
| K-30 | Jumlah kanal | "Tujuh" tidak disebut; Tabel 16.3 memuat 8 baris kanal | - | P16-06 | Pakai 8 |
| K-31 | Tipe data bobot | - | `weights: [400, 600, "italic"]` campur angka dan string (TK55) | Skema tipe | Pisahkan `weights` dan `styles` |
| K-32 | Lima warna + alert | Maks. 5 warna per gambar (lint 25) | Aksen + alert melewati plafon (E-16, L4373); kode memakai 5 seri (PC115) | Hitungan warna | Hitung ramp tinta sebagai satu keluarga (usulan E-16) |
| K-33 | Standar workbook | Manual Bab 15 | SKILL.md merujuk Standar_Workbook_DATUM_001-GSP-STD-X-2026_RevA §11 (SK73) | Sumber workbook kedua tidak dibaca | Celah G-06 |
| K-34 | Otoritas aturan | Manual Rev A | "otoritas sementara lapis aturan tetap IL standars/manual-datum-002-datman-1004" (SK31-33) | Manual ini mungkin bukan otoritas tertinggi | Konfirmasi ke pemelihara skill |

### 7.2 Celah (nilai yang tidak ada di sumber mana pun)

| ID | Celah | Sumber | Dampak |
|---|---|---|---|
| G-01 | Bobot font kolom satuan (P4T-X06) dan wajah prosa aside (P4T-X08) tidak dinyatakan | L875, L930 | Default harus diputus admin |
| G-02 | Ukuran judul sampul berupa rentang 24-26 pt tanpa nilai tunggal | L795 | Template perlu nilai pilihan |
| G-03 | Margin atas dan bawah halaman | L4009 hanya blok 247 mm | Grid vertikal tidak lengkap |
| G-04 | Margin brief | L4388 | P15-31 kosong |
| G-05 | Pemetaan 58 kode manual ke katalog vNN kode | L1575, PC191-1435 | Renderer chart HQ tidak bisa memakai resep kode tanpa peta |
| G-06 | Lint workbook W01-W23 dan Standar Workbook 001 | SK73 | Gerbang workbook HQ tidak lengkap |
| G-07 | Algoritma pemindai bahasa (lint_mutu.py, scan_ai_footprint.py) tidak dikirim bersama skill | L3797 | HQ harus memanggil alat itu atau membangun ulang; definisi klausa, kosakata meta-proses, daftar hitam A4 tidak tercantum |
| G-08 | Varian perangkat halaman Inggris (SOURCE, SHEET n OF N) masih usulan P-08 | L4488 | Template EN belum punya label |
| G-09 | Blok judul ISO 7200 A3 masih usulan P-05 | L2657, L4476 | Lembar gambar A3 belum standar |
| G-10 | Glosarium kendali lengkap ada di standar induk, manual hanya salinan kerja | L4962 | P11-21 perlu sumber lengkap |
| G-11 | Daftar kata terlarang 16.6 hanya kelas, bukan kata | L4144-4156 | Lint leksikon butuh daftar kata dari standar induk |
| G-12 | Parameter HTML artifact (layar hidup) dimiliki gsp-ui-architect, bukan DATUM | L1371-1372, L1532-1533 | Template HTML tidak punya basis DATUM untuk tile dan dashboard |

### 7.3 Butir yang wajib dicek ke .docx sebelum skema dikunci

V-01 Tabel 4.2 kolom TUGAS (L611-646). V-02 Tabel 4.4 kolom WARNA (L682-717). V-03 Tabel 4.5 warna batang revisi (L743-757). V-04 Tabel 5.3 glif dan warna tanda (L941-953). V-05 Tabel 7.5 pasangan token-hex-peran (L1417-1440). V-06 Tabel 10.1 kolom edisi dan pustaka (L2298-2357). V-07 Tabel 14.2 dan 14.3 pembanding ambang juri (L3665-3737). V-08 Tabel 15.1 kolom FUNGSI (L3828-3848). V-09 Tabel 16.1 kolom BATAS dan TAHAP (L3936-4021). V-10 Tabel 17.2 baris E-05..E-29 (L4325-4430). V-11 Lampiran B kolom ATURAN (L4887-4931). V-12 pola nomor dengan kode klasifikasi (L1088, L1138).

## 8. Key Findings

| No | Temuan | Keyakinan | Bukti | Implikasi |
|---|---|---|---|---|
| F1 | Manual memuat 138 aturan bernomor dalam empat ruang nama, dan 673 parameter kustomisasi dapat diturunkan darinya | HIGH | L236-247; Bagian 3 | Skema template HQ perlu sekitar 670 medan; disarankan dikelompokkan dalam 12 namespace di 3.13 |
| F2 | tokens.json di disk adalah rebuild v2.0.0 dan tidak memuat seksi tabel, diagram, perangkat tanda tangan, klasifikasi, satuan, workbook yang dirujuk manual | HIGH | TK4-6, TK1-117; L782, L884, L1086, L1206, L2189, L2210, L3848 | HQ tidak bisa mengimpor tokens.json saja; katalog ini harus menjadi sumber seed untuk seksi yang hilang |
| F3 | Pustaka chart manual 58 jenis (P15, H9, K12, W10, S8, G4) tidak memakai kode yang sama dengan pustakachart.py (vNN, 74 PNG) | HIGH | L1575-1872; PC191-1435; SK80 | Diperlukan tabel pemetaan sebelum resep chart kode dipakai HQ |
| F4 | 29 jenis section dokumen dapat dibedakan dengan unsur dan parameter masing-masing, ditambah 7 perangkat halaman dan 15 section kanal lain | MEDIUM | Bagian 4 | Registri section menjadi dasar alamat chapter/section/paragraph dan validasi struktur |
| F5 | Dari 39 lint DATUM, seluruhnya dapat dipindah ke HQ; 3 lint mata manual (08, 13, 15) menjadi otomatis karena renderer HQ token-driven; lint 12 tetap sebagian manusia | MEDIUM | L3936-4021, LT36-74, 6.1 | Gerbang HQ bisa memblokir sebagian besar cacat saat penyusunan |
| F6 | Dari 68 aturan bahasa, 31 punya pemindai, 10 ditegakkan lewat struktur, 27 hanya juri | HIGH | Tabel 12.1-14.1, 3.9.2 | HQ butuh antarmuka juri (lembar skor ber-ID, dua juri buta) untuk SERAH |
| F7 | Kebijakan rel bukti di skill terbaru (moda A/B) bertentangan dengan DT-43 di manual | HIGH | L784-785; SK36-49 | Grid menjadi turunan dari jumlah sitasi; parameter rel tidak bisa statis |
| F8 | Ambang tanda pisah panjang berbeda: manual 3 per 1.000 kata, kode 0 | HIGH | L3942, L4193; LT38; SK106-109 | Admin harus memilih sebelum lint HQ diaktifkan |
| F9 | Beberapa nilai tabel hanya bisa direkonstruksi dari teks tergeser; .docx belum diverifikasi | HIGH (bahwa celah ada) | 0.3, 7.3 | 12 butir V-01..V-12 wajib dicek sebelum skema dikunci |

## 9. Files/Modules Involved

Sumber yang dibaca (hanya baca, tidak diubah):
- `C:\Users\TRIAL\AppData\Local\Temp\hq_v21_clone\datum_manual.txt` (utuh, L1-5058)
- `C:\Users\TRIAL\AppData\Local\hermes\skills\gsp\datum-house-style\tokens.json` (utuh, TK1-117)
- `C:\Users\TRIAL\AppData\Local\hermes\skills\gsp\datum-house-style\SKILL.md` (SK1-120 dan hasil grep)
- `C:\Users\TRIAL\AppData\Local\hermes\skills\gsp\datum-house-style\datum_diagram.py` (DD100-189)
- `C:\Users\TRIAL\AppData\Local\hermes\skills\gsp\datum-house-style\scripts\datum_lint.py` (LT36-74)
- `C:\Users\TRIAL\AppData\Local\hermes\skills\gsp\datum-house-style\pustakachart.py` (daftar fungsi PC45-1613)

Tidak dibaca: `.docx` manual (sebab di 0.3).

## 10. Implementation Order (usulan, tanpa kode)

1. Putuskan 12 butir V-01..V-12 lewat ekstraksi .docx oleh controller.
2. Putuskan konflik K-04, K-05, K-07, K-09, K-11, K-13, K-14, K-17, K-19 oleh admin; catat di `decisions/decisions.md` tugas ini.
3. Bangun lapis token (namespace `color`, `type`, `grid`, `rules`, `device`) dari 3.3.
4. Bangun registri section (Bagian 4) dan alamat `bab.seksi.paragraf`.
5. Bangun lapis aparatus (Bab 5-6) dan pengikatan register.
6. Bangun registri chart (3.6) dan diagram (3.7), lalu tabel peta kode manual ke vNN (G-05).
7. Bangun gerbang: kelompok S dan B lebih dulu (by construction), lalu R, X, D, dan antarmuka juri.

## 11. Risks

| Risiko | Kemungkinan | Dampak | Mitigasi |
|---|---|---|---|
| Nilai `[REK]` salah karena pergeseran kolom | sedang | warna atau batas lint keliru di seluruh template | cek V-01..V-12 sebelum seed |
| Skill DATUM terus berubah (v2.6.0 per 22-10) sementara manual Rev A | tinggi | katalog usang | simpan versi sumber per parameter; tinjau ulang per rilis skill |
| User membuat template non-DATUM yang melonggarkan parameter K | sedang | dokumen lolos HQ tetapi melanggar kepatuhan | kelas K hanya bisa diubah admin; profil "DATUM-kanonik" terkunci |
| Pemindai bahasa tidak tersedia di HQ (G-07) | tinggi | 19 pemeriksaan kelompok C tidak jalan | panggil alat standar induk atau tandai NOT-RUN secara jujur seperti datum_lint (L3933-3934) |

## 12. Acceptance Criteria untuk skema yang memakai katalog ini

1. Setiap parameter di 3.1-3.12 (673 baris) memiliki medan skema dengan kunci, tipe, default, rentang, rujukan aturan, dan kelas B/K/T.
2. Parameter kelas K tidak bisa diubah oleh peran non-admin; parameter kelas T tidak bisa disunting langsung dan dihitung ulang saat parameter induknya berubah (uji: ubah `grid.textColumnMm`, maka `grid.fullSpanMm`, `grid.latticeXMm`, `grid.allowedFigureWidthsMm` berubah).
3. Registri section memuat 29 + 7 + 15 entri; setiap section dokumen dapat dialamatkan sampai tingkat paragraf.
4. Registri chart memuat 58 jenis bergambar dan 18 jenis `drawn=false`.
5. Gerbang HQ menjalankan 83 pemeriksaan otomatis dan menampilkan status NOT-RUN untuk pemeriksaan yang alatnya tidak tersedia.
6. Matriks tier Bagian 5 menentukan section dan gerbang yang wajib untuk NOTA, TERBIT, SERAH.

## 13. Recommendations

1. Jadikan katalog ini sumber seed profil "DATUM-kanonik" yang terkunci; template turunan user mewarisi profil dan hanya bisa mengubah kelas B.
2. Simpan `tokens.version`, `manual.revision`, dan `skill.version` per template agar setiap dokumen bisa ditelusuri ke set aturan yang dipakai.
3. Pindahkan sebanyak mungkin lint ke tahap penyusunan (kelompok S), karena dokumen HQ terstruktur; ini mengurangi beban gerbang pasca-render.
4. Tangani konflik K-11 (moda rel) sebelum membangun renderer halaman, karena ia mengubah grid.
5. Draf rencana (`masterplan/02_plan_draft.md`) tidak dibuat: tugas ini riset katalog, bukan perubahan kode.
