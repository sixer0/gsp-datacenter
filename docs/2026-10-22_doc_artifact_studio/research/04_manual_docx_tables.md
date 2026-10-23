# Tabel Manual DATUM (ekstraksi .docx, python-docx)

Sumber: `C:/Users/TRIAL/workspace/Manual DATUM GSP/Manual_Komprehensif_DATUM_GSP_000-GSP-STD-X-2026_RevA.docx`. Ekstraksi mekanis untuk butir V-01..V-12 katalog 01; caption = paragraf terakhir sebelum tabel.

## T001 — 

| KLASIFIKASI · TERBATAS | SALINAN INDUK · PENGGUNAAN INTERNAL GSP |
|---|---|

## T002 — Menyatukan DATUM House Style Explained Rev A · Panduan Jenis Chart v1.1 · Panduan Simbol Engineering v1.0 · Manual Gaya Bahasa Ahli STD-GAYA-AHLI-001 v1.3

| Nomor dokumen | 000/GSP/STD/X/2026 | Revisi | A · 8 Oktober 2026 |
|---|---|---|---|
| Penyusun | Divisi Engineering PT GSP | Kustodian | ENG-01 |
| Ditujukan kepada | Seluruh tim GSP | Tier | TERBIT, dengan PDF |
| Dasar | datum-house-style v1.8 Rev J | Bahasa | Indonesia |

## T003 — Menyatukan DATUM House Style Explained Rev A · Panduan Jenis Chart v1.1 · Panduan Simbol Engineering v1.0 · Manual Gaya Bahasa Ahli STD-GAYA-AHLI-001 v1.3

| PT GEMILANG SATRIA PERKASA · NIB 9120208940517 | // 20261008 ID T — TERBITAN 1 |
|---|---|

## T004 — MANUAL · DATUM TERPADU · ID · REV A · X · 2026

| KLASIFIKASI · TERBATAS | SALINAN INDUK · PENGGUNAAN INTERNAL GSP |
|---|---|

## T005 — A · Riwayat revisi

| Rev | Tanggal | Penyusun | Perubahan | Status |
|---|---|---|---|---|
| A | 08-X-2026 | Div. Engineering | Terbitan pertama: empat dokumen sumber disatukan menjadi satu manual; konflik antar-sumber diputus dan dicatat pada Bab 17 | Berlaku |

## T006 — B · Rantai verifikasi

| Lapis | Metode | Objek | Hasil |
|---|---|---|---|
| V1 | Baca baris per baris | Keempat dokumen sumber, SKILL.md DATUM v1.8 Rev J, tokens.json | Tidak ada sumber dilewati |
| V2 | Eksekusi | datum_diagram.py, datum_render.py, pustaka chart baru, pembangun Word | Gambar dibangun ulang |
| V3 | Render dan periksa | Berkas Word dirender ke PDF; lint DATUM dijalankan pada berkas terbit | Lihat Bab 16.6 |

## T007 — D · Distribusi terkendali

| Salinan | Pemegang | Media | Kembali |
|---|---|---|---|
| 01 | Direktur PT GSP | Word dan PDF | Tidak |
| 02 | Kepala Divisi Engineering | Word dan PDF | Tidak |
| 03 | Pemelihara skill dan seluruh tim GSP | PDF | Tidak |

## T008 — D · Distribusi terkendali

| Disusun | Diperiksa | Disahkan |
|---|---|---|
|  |  |  |
| Divisi Engineering | Kendali Mutu | Direktur Utama |

## T009 — D · Distribusi terkendali

| KLASIFIKASI · TERBATAS | SALINAN INDUK · PENGGUNAAN INTERNAL GSP |
|---|---|

## T010 — Peta Isi Manual

| Bagian I | Fondasi | 4 |
|---|---|---|
| Bab 1 | Identitas, Peta, dan Cara Memakai Manual | 5 |
| Bab 2 | Prinsip Induk dan Hierarki Kewenangan | 8 |
| Bab 3 | Tier, Alur Bangun, dan Penamaan | 11 |
| Bagian II | Bentuk | 14 |
| Bab 4 | Warna, Tipografi, Grid, dan Perangkat Halaman | 15 |
| Bab 5 | Tabel dan Aparatus Bukti | 21 |
| Bab 6 | Kepatuhan, Satuan, dan Reproduksi | 25 |
| Bagian III | Visual | 28 |
| Bab 7 | Memilih dan Membuat Chart | 29 |
| Bab 8 | Pustaka Chart GSP | 34 |
| Bab 9 | Diagram dan Mesin Gambar | 47 |
| Bab 10 | Simbol Engineering | 52 |
| Bagian IV | Bahasa | 63 |
| Bab 11 | Gaya Bahasa Ahli: Tujuh Lapis | 64 |
| Bab 12 | Lapis L0 sampai L2: Orientasi, Arsitektur, Paragraf | 66 |
| Bab 13 | Lapis L3 sampai L5: Kalimat, Kata, Suara | 71 |
| Bab 14 | Lapis L6: Mesin Periksa dan Penilai | 77 |
| Bagian V | Penjaminan dan Pemakaian | 82 |
| Bab 15 | Workbook dan Command Brief | 83 |
| Bab 16 | Gerbang Rilis Terpadu | 85 |
| Bab 17 | Rekonsiliasi Antar-Sumber dan Program Perbaikan | 90 |
| Lampiran A | Indeks Aturan Terpadu | 95 |
| Lampiran B | Daftar Periksa Pra-Serah Satu Halaman | 100 |
| Lampiran C | Glosarium Kendali dan Istilah | 101 |
| Lampiran D | Register Sumber | 102 |

## T011 — Nomor halaman dicetak dari render PDF terbitan ini. Word dapat memaginasi sedikit berbeda, jadi pakai panel navigasi Word untuk lompat langsung ke bab. Tabel, g

| KLASIFIKASI · TERBATAS | SALINAN INDUK · PENGGUNAAN INTERNAL GSP |
|---|---|

## T012 — Apa manual ini, prinsip yang mengikat seluruh isinya, siapa pemilik setiap keputusan, dan bagaimana sebuah dokumen GSP dibangun dari nomor sampai serah.

| Bab 1 | Identitas, Peta, dan Cara Memakai Manual |
|---|---|
| Bab 2 | Prinsip Induk dan Hierarki Kewenangan |
| Bab 3 | Tier, Alur Bangun, dan Penamaan |

## T013 — 1.1   Dokumen ini dan kebutuhan yang melahirkannya

| Manual ini adalah standar kerja internal PT Gemilang Satria Perkasa yang disusun Divisi Engineering untuk seluruh tim GSP. Ia lahir dari satu masalah konkret: aturan tentang tampilan, chart, simbol, dan bahasa tersebar di empat dokumen dengan empat gaya, dua bahasa, dan beberapa ketentuan yang saling bertentangan. Penulis yang membuka satu dokumen tidak tahu aturan di tiga dokumen lainnya, sehingga keluaran GSP tetap bisa lolos satu standar sambil melanggar standar yang lain. |  | ■ TERUKUR SUMBER LAMPIRAN D Empat dokumen sumber, 8 Oktober 2026. |
|---|---|---|

## T014 — Tabel 1.1   Peta sumber ke bab manual, per berkas yang diterima pada 8 Oktober 2026.

| No | Pokok yang diminta | Berkas yang diterima | Rumah di manual ini |
|---|---|---|---|
| 1 | Panduan DATUM | DATUM House Style Explained, 000-GSP-STD-X-2026 Rev A (bahasa Inggris, 44 halaman) | Bab 2 sampai 6, 9, 15, 16 |
| 2 | Jenis chart yang dipakai GSP | Panduan Memilih dan Membuat Chart v1.1, 7 Oktober 2026 | Bab 7 dan 8 |
| 3 | Jenis simbol | Panduan Simbol Engineering GSP v1.0, 7 Oktober 2026 | Bab 10 |
| 4 | Manual chart dan grafik sebagai pustaka | Tidak ada berkas terpisah. Pustaka dibangun ulang dari katalog pokok 2 dalam palet DATUM | Bab 8, Gambar 8.1 sampai 8.5 |
| 5 | Penggunaan kata dan penyusunan kalimat | Manual Gaya Bahasa Ahli GSP, STD-GAYA-AHLI-001 v1.3 (PDF 96 halaman) | Bab 11 sampai 14 |
| SUMBER Berkas unggahan permintaan penyusunan. PROVENANS ■ TERUKUR. Pokok 4: berkas PDF yang diterima berjudul "Manual Komprehensif" tetapi isinya standar gaya bahasa (pokok 5); lihat 1.6. |  |  |  |

## T015 — Tabel 1.2   Tiga cara memakai manual dan hasil yang dapat Anda putuskan sendiri.

| Jalur | Kapan dipakai | Langkah | Hasil yang diputuskan ya atau tidak |
|---|---|---|---|
| Berurutan | Anggota baru tim, atau pemelihara skill | Bagian I sampai V menurut urutan bab | Setiap aturan dikenali beserta alasannya |
| Cari cepat | Nomor aturan atau gejala sudah di tangan | Buka Lampiran A, ambil nomor, ikuti kolom bab | Entri aturan terbuka lengkap di halaman rumahnya |
| Pra-serah | Dokumen akan dikirim dalam hitungan menit | Buka Bab 16 dan Lampiran B | Daftar periksa tercentang pada naskah terakhir |
| SUMBER Diadaptasi dari STD-GAYA-AHLI-001 D.3 untuk keempat pokok. |  |  |  |

## T016 — Tabel 1.3   Empat awalan nomor aturan dan cakupannya.

| Awalan | Cakupan | Asal | Jumlah |
|---|---|---|---|
| DT-nn | Bentuk, aparatus bukti, kepatuhan, satuan, penamaan | DATUM House Style v1.8 Rev J | 44 |
| CH-nn | Pemilihan dan pembuatan chart | Panduan Jenis Chart v1.1 yang diselaraskan ke DATUM | 14 |
| SM-nn | Simbol dan lembar gambar teknik | Panduan Simbol Engineering v1.0 dan DATUM ref. 09 | 12 |
| SG-Ln-nn | Gaya bahasa, tujuh lapis L0 sampai L6 | STD-GAYA-AHLI-001 rev G | 68 |
| SUMBER Indeks lengkap pada Lampiran A. Jumlah dihitung dari indeks itu. |  |  |  |

## T017 — 1.6   Batas cakupan

| Pokok 4, manual chart dan grafik sebagai pustaka, tidak datang sebagai berkas tersendiri. Satu-satunya PDF yang diterima berjudul "STD-GAYA-AHLI Manual Komprehensif" dan seluruh isinya adalah standar gaya bahasa. Manual ini karena itu membangun pustaka chart sendiri: 58 jenis chart digambar ulang dalam palet DATUM dari katalog Panduan Jenis Chart (Bab 8). Bila manual chart terpisah memang ada, isinya perlu dipetakan ke Bab 8 pada revisi berikutnya. |  | △ ASUMSI ASM-MAN-01 Dampak bila salah: Bab 8 kurang satu sumber. |
|---|---|---|

## T018 — 2.1   Aturan pengatur: bukti atau aparatus pembuktinya

| Seluruh isi halaman GSP adalah bukti, atau aparatus yang membuktikan bukti itu. Tidak ada yang berupa hiasan. Kata datum membawa dua makna yang dibutuhkan GSP: dalam geodesi ia adalah bidang acuan tempat setiap koordinat diukur, dalam pembuktian ia adalah fakta yang diberikan, bentuk tunggal dari data. |  | ■ TERUKUR SKILL.MD §1 |
|---|---|---|

## T019 — Tabel 2.1   Aturan pengatur DATUM dan diktum M-4 sebagai satu doktrin.

| Pertanyaan | Jawaban DATUM, halaman | Jawaban Gaya Ahli, kalimat |
|---|---|---|
| Dari mana kesan ahli datang | Dari aparatus: provenans, turunan, rel bukti | Dari aparatus: angka bersumber, alasan teknis, batasan diakui |
| Apa yang dilarang | Ornamen: kotak berwarna, KPI tile, warna tanpa makna | Retorika: kata sifat tanpa angka, superlatif tanpa rem |
| Bagaimana memendekkan | Tier NOTA: buang kemasan, bukan ketelitian | Pindah medium: prosa ke tabel, tabel ke lampiran |
| Di mana angka tinggal | Register kuantitas, diikat ke dokumen | Struktur terpisah; prosa membaca dampak (SG-L1-04) |
| SUMBER SKILL.md DATUM §1, §2a, §8a · STD-GAYA-AHLI-001 SG-L5-09, SG-L1-04. Penyatuan oleh penyusun. PROVENANS ◈ DITURUNKAN. |  |  |

## T020 — Tabel 2.1   Aturan pengatur DATUM dan diktum M-4 sebagai satu doktrin.

| Diktum manual ini Tulis dan gambar hanya yang bisa dibuktikan, tempatkan setiap bukti di medium yang paling mudah diperiksa, dan biarkan aparatus yang berbicara tentang kedalaman. |
|---|

## T021 — 3.1   Tiga tier artefak

| Sebagian besar keluaran sebuah pekerjaan adalah bahan kerja yang dibaca satu atau dua orang sekali saja. Memberinya sampul, pita segel, fon tertanam, lint, dan PDF menghabiskan satu siklus bangun tanpa membeli apa pun yang tidak bisa dibeli catatan Markdown. Karena itu setiap artefak dimasukkan ke satu dari tiga tier. |  | ■ TERUKUR SKILL.MD §2a |
|---|---|---|

## T022 — Tabel 3.1   Tiga tier artefak dan apa yang dilepas masing-masing.

| Tier | Bentuk | Yang dilepas | Dipakai bila |
|---|---|---|---|
| NOTA | Markdown | Sampul, blok register, PDF, lint, rekonsiliasi halaman | Hanya Direktur dan divisi ini yang membaca |
| TERBIT | .docx atau .xlsx DATUM penuh, lint wajib | PDF kecuali diminta, rekonsiliasi halaman | Melintas divisi, atau menjadi masukan dokumen lain |
| SERAH | Aparatus penuh, lint, PDF, audit halaman dan angka | Tidak ada | Dibaca pihak luar, atau dilampirkan ke tender |
| SUMBER SKILL.md DATUM §2a. NOTA adalah default. Naik tier wajib dibenarkan; bertahan tidak pernah. |  |  |  |

## T023 — Ujinya satu kalimat: dapatkah Anda menyebut seseorang di luar divisi ini yang akan membacanya? Bila tidak, artefak itu NOTA. Artefak naik tier bersama-sama, di 

| Kemasan bukan kepedulian Pada satu pekerjaan, rencana kerja dibangun sebagai dokumen SERAH penuh sejak tahap pertama. Ia menjadi artefak terakhir yang masih memuat angka usang, karena tidak ada yang membuka ulang rencana kerja. Artefak yang paling berat kemasannya justru yang paling tidak benar. |
|---|

## T024 — Tabel 3.2   Pembangun resmi untuk setiap format keluaran.

| Keluaran | Pembangun | Yang perlu diketahui |
|---|---|---|
| Word .docx | datum_docx.py | Lalu embed_fonts.py; gambar ditempatkan dengan helper figure(), tidak dengan tangan |
| Workbook .xlsx | datum_xlsx.py | openpyxl; fon tidak bisa ditanam, kirim folder assets/fonts |
| Brief .pptx | datum_pptx.py | python-pptx; kirim folder assets/fonts bersama dek |
| Gambar teknik | datum_diagram.py | Spec JSON masuk, SVG keluar; datum_render.py untuk PNG 300 dpi |
| Chart sumbu | datumchart.py | Keluarga bar, column, threshold |
| Chart lain | pustakachart.py | Pustaka manual ini; token DATUM, PNG 300 dpi (Bab 8.4) |
| Simbol | datum_symbols.py | IEC 60617, ISA-5.1, MIL-STD-2525E, legenda rumah GSP |
| Tinjau Figma | datum_figma_audit.py | Membandingkan salinan Figma terhadap spec |
| PDF | HTML atau Word ke PDF | Disusun terhadap tokens.json; jalankan --check-page sebelum rilis |
| SUMBER SKILL.md DATUM §2, jalur bangun. tokens.json adalah induk mesin; bila prosa dan token berbeda, token yang berlaku. |  |  |

## T025 — 3.5   Penamaan tanpa garis bawah

| Garis bawah dilarang pada setiap nama folder, berkas, sheet, tabel, gambar, dan identifier rekayasa. Nama seperti LAPORAN_KAJIAN_TEKNIS mengumumkan bahwa mesin menulisnya untuk mesin, dan menggagalkan satu tugas folder terbitan: membiarkan pembaca yang tidak ikut rapat menemukan dokumen yang benar dengan membaca rak. |  | ■ TERUKUR SKILL.MD §14 LINT 38 |
|---|---|---|

## T026 — Tabel 3.3   Aturan penamaan dengan contoh benar dan salah.

| Objek | Aturan | Benar | Salah |
|---|---|---|---|
| Folder | Huruf awal kapital, spasi, awalan urut dua digit | 05 Dokumen Terbit | 05_Deliverable |
| Berkas dokumen | Judul dokumen, lalu nomor berpisah tanda hubung | Kajian Teknis 025-GSP-KT-VIII-2026 | KAJIAN_TEKNIS_025 |
| Sheet workbook | Kapital, tanda hubung, maks. 31 karakter | HITUNG-KABEL | HITUNG_KABEL |
| ID tabel dan gambar | Kata, spasi, nomor | Tabel 4.1 · Gambar 5.2 | Tabel_4.1 · g2 |
| Identifier rekayasa | Tanda hubung | REQ-FO-05 · K-01 | REQ_FO_05 |
| Berkas gambar | Caption yang dibawanya | Gambar 4.2 Arsitektur.svg | g2.svg |
| SUMBER SKILL.md DATUM §14. Satu pengecualian: modul Python lama yang importnya memerlukan garis bawah. |  |  |  |

## T027 — Tiga skill saudara memiliki hidup berkas, bukan tampilannya. ARSIP memiliki identitas: nomor diambil dari Register Induk sebelum membangun, ditulis bergaris mir

| KLASIFIKASI · TERBATAS | SALINAN INDUK · PENGGUNAAN INTERNAL GSP |
|---|---|

## T028 — Warna, huruf, grid, perangkat halaman, tabel, aparatus bukti, kepatuhan regulasi, satuan, dan daya tahan fotokopi: semua yang membuat halaman GSP dikenali dari 

| Bab 4 | Warna, Tipografi, Grid, dan Perangkat Halaman |
|---|---|
| Bab 5 | Tabel dan Aparatus Bukti |
| Bab 6 | Kepatuhan, Satuan, dan Reproduksi |

## T029 — Tabel 4.1   Dua register dokumen DATUM.

| Aspek | Pembungkus, Sovereign | Interior, Instrument |
|---|---|---|
| Dipakai untuk | Sampul, lembar kendali, pembatas bagian, tanda tangan | Halaman badan, tabel, gambar, turunan, lampiran |
| Terbaca sebagai | Lembaga negara, formalitas Mabes atau Kementerian | Laboratorium rekayasa, panel instrumen |
| Kertas | krem hangat #FBFAF7 | hampir putih netral #FCFCFB |
| Warna tanda | merah marun negara #6E1420, hanya pita segel dan klasifikasi | amber instrumen #B45309, hanya untuk makna |
| SUMBER SKILL.md DATUM §3 · tokens.json colour.wrapper dan colour.interior. |  |  |

## T030 — 4.2   Latar putih sebagai default

| Sejak Revisi J, latar setiap keluaran GSP adalah putih atau hampir putih: dokumen, workbook, slide, gambar, diagram, layar hidup, dan gambar hasil generator. Latar gelap hanya dipakai bila tugas memintanya secara eksplisit: pusat komando, HUD, mode gelap, layar operasi 24 jam, atau register klien yang mewajibkannya. Kata pertahanan, premium, atau serius bukan instruksi untuk gelap. |  | ■ TERUKUR SKILL.MD §4 DT-05 |
|---|---|---|

## T031 — Tabel 4.2   Setiap token warna DATUM dan satu tugasnya.

| Register | Token | Hex | Tugas |
|---|---|---|---|
| Pembungkus |  |  |  |
| Pembungkus | paper | #FBFAF7 | Kertas sampul dan pembatas |
| Pembungkus | ink | #14110F | Judul dan nilai blok kendali |
| Pembungkus | body | #33302C | Prosa pembungkus |
| Pembungkus | meta | #7A756E | Label, alamat, string punggung |
| Pembungkus | rule | #C4BEB4 | Garis rambut pembungkus |
| Pembungkus | seal | #6E1420 | Pita segel dan klasifikasi saja |
| Interior |  |  |  |
| Interior | paper | #FCFCFB | Kertas badan |
| Interior | ink900 | #101418 | Judul, garis utama, setiap numeral |
| Interior | ink700 | #2B3640 | Prosa badan; tidak pernah hitam murni |
| Interior | ink400 | #6B7783 | Label, caption, baris sumber, rel |
| Interior | ink200 | #C3CBD1 | Garis rambut dan pemisah baris |
| Interior | ink100 | #EFF2F4 | Zebra di atas 12 baris, pita workbook (lihat E-07) |
| Interior | signal | #B45309 | Satu-satunya aksen; tanda DITURUNKAN |
| Interior | alert | #9B1C1C | Rahasia, ASUMSI, batas terlampaui |
| Interior | verd | #2F6F6B | Jalur verifikasi, tautan sheet, arah membaik pada chart |
| Command brief gelap, hanya bila diminta |  |  |  |
| Brief | ground | #0E1216 | Latar slide gelap bila tugas memintanya |
| Brief | accent | #D98324 | Aksen pada latar gelap |
| SUMBER tokens.json colour, versi 1.8. Baris verd diperluas untuk chart oleh putusan R-02, Tabel 17.1. |  |  |  |

## T032 — Tabel 4.3   Tumpukan ganda IBM Plex dan cadangannya.

| Peran | Rupa huruf | Membawa | Cadangan |
|---|---|---|---|
| Struktural | Plex Sans Condensed 400, 600 | Judul, kepala halaman, label, caption | Segoe UI Semibold |
| Baca | Plex Serif 400, 600, miring | Seluruh prosa badan, kedua register | Georgia |
| Data | Plex Mono 400, 600 | Setiap numeral, ID, satuan, register, rel | Consolas |
| UI workbook | Plex Sans 400, 600 | Teks sel Excel saja | Arial Narrow |
| Simbol | DejaVu Sans | Glif provenans dan simbol matematika yang tidak ada di Plex | ditanam ke berkas |
| SUMBER References/02 §2 · tokens.json type. Calibri, Times New Roman, Aptos, dan Arial sebagai fon badan dilarang. Baris Simbol: putusan R-14. |  |  |  |

## T033 — Tabel 4.4   Skala huruf pada garis dasar 13,5 pt.

| Unsur | Ukuran / spasi, satuan pt | Rupa | Warna |
|---|---|---|---|
| Judul bab | 16 / 20 | Cond 600 | ink900 |
| Kicker bab | 6,8, kapital, +0,16 em | Cond 600 | signal |
| Judul seksi | 11 / 13,5 | Cond 600 | ink900 |
| Badan | 9,5 / 13,5 | Serif 400 | ink700 |
| Badan tabel | 8,2 / 11,5 | Serif 400 | ink700 |
| Numeral tabel | 7,8, tabular | Mono 400 | ink900 |
| Kepala tabel | 6,8, kapital, +0,09 em | Cond 600 | ink400 |
| Caption | 7,6 / 11 | Cond 400 | ink700 |
| Baris sumber | 6,6 / 9 | Cond 400 | ink400 |
| Rel bukti | 5,9 / 8,4, kapital | Mono 400 | ink400 |
| Kepala halaman | 6,8, kapital | Cond 400 | ink400 |
| Blok register | 6,2 | Mono 400 | ink400 |
| Turunan | 7,4 / 11,5 | Mono 400 | ink900 |
| SUMBER References/02 §3 · tokens.json type.scale_pt. Kepala halaman memakai Cond 400 karena bobot 500 tidak dikirim (E-25). |  |  |  |

## T034 — Semua unsur mengunci ke grid A4: margin dalam 24 mm, kolom teks 128 mm, talang 6 mm, rel bukti 32 mm, dan margin luar 20 mm. Judul, baris tabel, tinggi gambar, 

| Turunan D-4.1 · Grid A4 menutup dan satuan kisinya Setiap simpul diagram, tinggi gambar, dan baris tabel DATUM adalah kelipatan utuh kedua satuan kisi ini. Gambar selebar selain 128 mm atau 166 mm ditolak kedua mesin. Bila halaman bukan A4, seluruh turunan ini tidak berlaku dan grid harus diturunkan ulang. |
|---|

## T035 — Tabel 4.5   Tebal garis dan warnanya.

| Pemakaian | Tebal | Satuan | Warna |
|---|---|---|---|
| Di atas kepala tabel, di atas total, datum bab | 0,45 | mm | ink900 |
| Di bawah kepala tabel | 0,25 | mm | ink400 |
| Pemisah baris, garis kepala halaman, garis sumber | 0,20 | mm | ink200 |
| Batang revisi di rel bukti | 0,50 | mm | ink900 |
| Lantai fotokopi untuk garis apa pun | 0,18 | mm | apa pun |
| SUMBER References/02 §4 · tokens.json rules_mm. Rona hanya 15 % dan 30 %. Manual ini memasang garis 0,20 mm sebagai 0,22 mm, lihat E-05. |  |  |  |

## T036 — Tabel 4.6   Enam perangkat tanda tangan DATUM dan tempat munculnya.

| Perangkat | Spesifikasi | Muncul di |
|---|---|---|
| Datum Rule | Garis rambut 0,20 mm, tik di 12 batas kolom, segmen depan pejal; di PDF segmen depan menjadi pengukur kemajuan baca | Di atas judul bab, sampul, pembatas |
| Rel bukti | Kolom luar 32 mm: tanda, digraf Admiralty, sumber, REQ, batang revisi | Di samping prosa beban keputusan |
| Blok register | Empat sel mono: GSP · nomor │ REV · tanggal │ LEMBAR n DARI N │ kelas | Kaki setiap halaman interior |
| Pita segel | Pita marun 5 mm, klasifikasi kiri, kendali salinan bernomor kanan | Halaman pembungkus saja |
| String punggung | Mono 6 pt diputar 90°: jenis, subjek, bahasa, revisi, bulan, tahun | Margin luar sampul dan pembatas |
| Cap terbit | // YYYYMMDD BAHASA KELAS — TERBITAN n | Kolofon sampul |
| SUMBER SKILL.md DATUM §7 · tokens.json signature_devices. Konvensi pinjaman dari Saab (punggung) dan Hensoldt (cap). |  |  |

## T037 — Tabel 4.7   Kunci Gambar 4.1: setiap unsur dan aturan yang menempatkannya.

| No | Unsur | Aturan |
|---|---|---|
| 1 | Kepala halaman | Entitas, divisi, bab; Cond kapital 6,8 pt di atas garis rambut |
| 2 | Klasifikasi | Kanan kepala halaman; tinta alert untuk Rahasia, ink900 untuk Biasa dan Terbatas |
| 3 | Kicker bab | BAB 3 dalam Cond kapital amber, renggang |
| 4 | Datum Rule | Garis rambut dengan 12 tik dan segmen depan 9 mm; hanya di atas judul bab |
| 5 | Judul bab | 16 pt Cond 600, ink900, berupa label, bukan pertanyaan |
| 6 | Judul seksi | Nomor mono ink400, judul Cond 600 |
| 7 | Badan | 9,5 / 13,5 pt Plex Serif, ink700, rata kiri-kanan, ukuran 128 mm |
| 8 | Rel bukti | Tanda, ID persyaratan dan turunan di samping klaim yang didukungnya |
| 9 | Caption tabel | Identifier, satu kalimat, tanggal berlaku; di atas tabel |
| 10 | Pita kelompok | Cond kapital tanpa isian; numeral mono rata kanan |
| 11 | Baris total | Garis tebal di atas, tanpa isian, Cond 600 |
| 12 | Baris sumber | SUMBER dan PROVENANS di bawah garis rambut, kunci glif disertakan |
| 13 | Blok turunan | Garis kiri amber, aritmetika mono, tanda di tiap baris, kalimat penutup |
| 14 | Blok register | Empat sel mono; nomor dan lembar tebal; LEMBAR dari medan halaman |
| SUMBER SKILL.md DATUM §6 dan §7 · references/02 §3 dan §6 · references/03. |  |  |

## T038 — Tabel 5.1   Tata bahasa tabel: hanya garis mendatar, tanpa isian.

| Unsur | Spesifikasi |
|---|---|
| Garis di atas kepala | 0,45 mm ink900 |
| Garis di bawah kepala | 0,25 mm ink400 |
| Pemisah baris | 0,20 mm ink200 |
| Teks kepala | Cond 600, 6,8 pt, kapital, +0,09 em, ink400, rata bawah |
| Pita kelompok | Cond 600, 7,4 pt, kapital, ink900, tanpa isian |
| Numeral | Mono tabular, rata kanan dan rata desimal, tidak pernah di tengah |
| Satuan | Kolom sendiri, Cond 7,2 pt ink400, di kanan angka |
| Zebra | Hanya di atas 12 baris, ink100, tidak pernah di BoQ cetak |
| Total | Garis di atas, Cond 600, tanpa isian |
| Garis tegak, baris kepala berisi warna | Tidak pernah |
| SUMBER References/03 §1 · tokens.json table. Baris kepala berulang di setiap halaman; baris tidak dipecah. |  |

## T039 — Tabel 5.2   Contoh tabel spesifikasi: cuplikan data unit spesimen, per Pemasok A (fiktif).

| Parameter | Kondisi uji | Nilai | Satuan |
|---|---|---|---|
| Kapasitas pendinginan | per tahap, kondisi rancangan | 35,0 | kW |
|  | kedua tahap bersama | 70,0 | kW |
| EER | beban penuh | 3,2 | W/W |
| Aliran udara pasok | tekanan statis eksternal per saluran | 8.811 | m³/h |
| Faktor daya | beban penuh | 0,88 | – |
| SUMBER Proposal Teknis Spesimen UPK-70, Tabel 4.1. PROVENANS seluruh nilai ◇ PEMASOK, keandalan C3, belum diuji independen. |  |  |  |

## T040 — 5.4   Aside menggantikan kotak callout

| Kotak krem dengan batang kiri berwarna adalah tanda kedua paling dikenali dari dokumen tulisan mesin dan gagal lint 02. DATUM menggantinya dengan aside bergaris: garis 0,35 mm di atas, garis rambut di bawah, label Cond kapital, prosa 8,6 pt, tanpa isian. Penekanannya bertahan, tanda templatnya hilang. Kotak "Keputusan" berisi warna pada Panduan Chart dan Panduan Simbol diubah menjadi aside di manual ini. |  | ■ TERUKUR REF 03 §4 LINT 02 |
|---|---|---|

## T041 — 5.4   Aside menggantikan kotak callout

| Contoh aside Blok ini sebuah aside. Ia punya garis di atas, garis rambut di bawah, dan tanpa isian, sehingga bertahan di mesin fotokopi dan tidak terbaca sebagai templat. |
|---|

## T042 — Tabel 5.3   Empat tanda provenans dan warnanya.

| Tanda | Label | Arti | Warna |
|---|---|---|---|
| ■ | TERUKUR | Dibaca dari dokumen sumber atau instrumen | ink900 |
| ◈ | DITURUNKAN | Dihitung dari masukan terukur; turunannya ditampilkan | signal |
| ◇ | PEMASOK | Klaim lembar data vendor, belum diverifikasi independen | ink400 |
| △ | ASUMSI | Asumsi; membawa ID dan pernyataan dampak | alert |
| SUMBER SKILL.md DATUM §8 · tokens.json provenance.marks. Angka beban keputusan tanpa tanda adalah cacat, bukan pilihan gaya. |  |  |  |

## T043 — Tabel 5.3   Empat tanda provenans dan warnanya.

| Kewajiban tanda (DATUM) dan keterbacaan kalimat (Gaya Ahli) bertemu di sini. Tanda melekat sekali pada baris atau klausa fakta, tidak diulang pada setiap penyebutan ulang angka yang sama (SG-L3-05). Di prosa paling banyak satu tanda per kira-kira 20 kata (SG-L6-13). Tanda yang melewati kerapatan itu pindah ke rel bukti atau ke baris tabel, tidak dihapus. Itulah fungsi rel bukti: memikul tanda agar kalimat tetap bernapas. |  | ◈ DITURUNKAN R-05 TABEL 17.1 |
|---|---|---|

## T044 — Sejak Revisi I, setiap angka beban keputusan dalam dokumen DATUM adalah rujukan bernama ke register kuantitas yang ditulis rantai hitung sebagai langkah terakhi

| Pola pengikatan, datumbind.py N = Register('Model/quantities.json') # ditulis rantai hitung D.p(f"... berkapasitas {N.u('kapasitas terpasang')} dalam dua tahap ...") d = Derivation('Turunan D-7.2a · PPN dengan DPP nilai lain', N) d.result('DPP = 11/12 × subtotal', 'subtotal * 11 / 12', 'dpp nilai lain') d.closes('Bila ketentuan berubah, hanya baris PPN dan total yang bergeser.') R.audit_docx(berkas) # setiap angka terlacak ke register |
|---|

## T045 — Tabel 5.4   Skala Admiralty untuk keandalan sumber dan kredibilitas informasi.

| Kode | Keandalan sumber | Kode | Kredibilitas informasi |
|---|---|---|---|
| A | Sepenuhnya andal | 1 | Dikonfirmasi sumber independen lain |
| B | Biasanya andal | 2 | Kemungkinan benar |
| C | Cukup andal | 3 | Mungkin benar |
| D | Biasanya tidak andal | 4 | Diragukan |
| E | Tidak andal | 5 | Tidak mungkin benar |
| F | Keandalan tidak bisa dinilai | 6 | Kebenaran tidak bisa dinilai |
| SUMBER NATO AJP-2.1 dan STANAG 2511 sebagaimana dirujuk references/03 §3.2; terjemahan label oleh penyusun. Kedua tabel dicetak sekali di lampiran dokumen yang memakainya. |  |  |  |

## T046 — Tabel 5.5   Contoh register asumsi, format wajib.

| ID | Asumsi | Dampak bila salah | Verifikasi |
|---|---|---|---|
| ASM-PWR-01 | cos φ terpasang 0,85 | Kapasitas kVA naik kira-kira 9 % pada 0,78 | Uji terima pabrik |
| ASM-PWR-03 | Tegangan PLN stabil (230 ± 12) V, toleransi rancangan | Susut melebihi batas pada 218 V | Perekaman 7 hari |
| SUMBER Contoh dari sampel laporan teknis DATUM (datum_docx.py). Notasi ± menyatakan toleransi rancangan. |  |  |  |

## T047 — 6.1   Klasifikasi ditentukan penerima

| Kosakata klasifikasi ditetapkan oleh lembaga penerima dokumen, bukan oleh GSP. Memakai skema yang salah adalah cacat kepatuhan yang langsung terlihat oleh peninjau yang memahami regulasinya. |  | ■ TERUKUR REF 01 §1 LINT 18 |
|---|---|---|

## T048 — Tabel 6.1   Skema klasifikasi menurut penerima.

| Penerima | Instrumen | Tingkat |
|---|---|---|
| Kemhan, TNI AD, AL, AU | Permenhan No. 26 Tahun 2017, Pasal 3 | Biasa · Rahasia · Sangat Rahasia |
| Polri, Bareskrim, Densus | Perkap Polri No. 1 Tahun 2023, Pasal 79 | Biasa · Terbatas · Rahasia · Sangat Rahasia |
| Kementerian, BIN, BNPT, internal GSP | Peraturan ANRI No. 5 Tahun 2021, Pasal 104 sampai 109 | Biasa · Terbatas · Rahasia · Sangat Rahasia |
| SUMBER References/01 §1 · tokens.json classification. Skema pertahanan tidak punya tingkat Terbatas. |  |  |

## T049 — Tabel 6.2   Regulasi yang wajib dikutip dan yang sudah mati.

| Topik | Mati, jangan dikutip | Berlaku |
|---|---|---|
| Pengadaan | Perpres 16/2018 jo 12/2021 | Perpres 46/2025 |
| Pedoman pengadaan | – | Perlem LKPP 12/2021 jo 4/2024 |
| Tata Naskah Dinas | Permenpan RB 22/2008 dan 80/2012 | Peraturan ANRI No. 5 Tahun 2021 |
| Korespondensi Polri | Perkap 7/2017 | Perkap No. 1 Tahun 2023 |
| Administrasi Kemhan | Permenhan 60/2014 dan 25/2015 | Permenhan No. 30 Tahun 2019 |
| AHSP, estimasi biaya | Permen PUPR 28/2016 dan 1/2022 | Permen PUPR No. 8 Tahun 2023 |
| Pajak pertambahan nilai | 10 % atau 12 % rata | 11 % efektif, PMK 131/2024 |
| Bea meterai | Rp 6.000 | Rp 10.000, UU 10/2020 |
| SUMBER References/01 §2, diverifikasi penyusun skill. Periksa ulang setiap tahun; kutipan mati adalah cara termurah terlihat tidak serius. |  |  |

## T050 — Lembar AHS mengikuti Permen PUPR No. 8 Tahun 2023: baris A tenaga kerja (kode L.01 sampai L.04, satuan OH), B bahan, C peralatan, D jumlah A + B + C, E biaya um

| Turunan D-6.1 · PPN dengan DPP nilai lain PMK 131/2024 menetapkan DPP nilai lain sebesar 11/12 harga untuk barang non-mewah, menghasilkan tarif efektif 11 %. Bila regulasi berubah sebelum kontrak, hanya baris PPN dan total yang bergeser. Angka dari spesimen DATUM, ilustrasi. |
|---|

## T051 — Tabel 6.3   Aturan satuan dan ketidakpastian menurut BIPM SI dan NIST SP 811.

| Aturan | Benar | Salah |
|---|---|---|
| Spasi memisahkan nilai dan satuan | 12,3 kg · 30,2 °C · 0,25 % | satuan menempel pada nilai |
| Sudut bidang tanpa spasi | 30° 22′ 8″ | spasi sebelum tanda derajat |
| Kurung pasangan toleransi atau ulang satuan | (63,2 ± 0,1) m | satuan hanya setelah toleransi |
| Setiap ± menyatakan artinya | toleransi rancangan, 1 σ, k = 2 | ± tanpa keterangan |
| Ketidakpastian menentukan presisi | paling banyak dua angka penting | presisi diambil dari nilai |
| Numeral Indonesia | Rp 24.475.786.658 | titik desimal, koma ribuan |
| Dimensi mengulang satuan | 51 mm × 51 mm × 25 mm | satuan sekali di akhir |
| SUMBER SKILL.md DATUM §10 · tokens.json units. Pada tabel ini setiap ± adalah toleransi rancangan. |  |  |

## T052 — 6.6   Bertahan di mesin fotokopi

| Dokumen tender difotokopi, dipindai, dan difotokopi lagi, jadi DATUM merancang untuk mesin fotokopi. Tidak ada garis lebih tipis dari 0,18 mm (0,51 pt). Rona hanya 15 % atau 30 %, karena dua rona tipis menjadi satu setelah dua kali fotokopi. Isian diagram berupa arsir 45° dan 135°, tidak pernah rona abu-abu. Setiap pembedaan warna diulang lewat bentuk, label, pola garis, atau posisi. Uji terimanya fisik: cetak 100 %, fotokopi dua kali dengan setelan bawaan, baca dari 40 cm; apa pun yang hilang gagal. |  | ■ TERUKUR SKILL.MD §11 LINT 21 |
|---|---|---|

## T053 — 6.6   Bertahan di mesin fotokopi

| KLASIFIKASI · TERBATAS | SALINAN INDUK · PENGGUNAAN INTERNAL GSP |
|---|---|

## T054 — Kapan memakai chart dan chart yang mana, pustaka 58 jenis chart dalam palet DATUM, mesin gambar teknik, dan simbol standar untuk diagram dan skematik.

| Bab 7 | Memilih dan Membuat Chart |
|---|---|
| Bab 8 | Pustaka Chart GSP |
| Bab 9 | Diagram dan Mesin Gambar |
| Bab 10 | Simbol Engineering |

## T055 — 7.1   Keputusan dalam satu paragraf

| Pilih chart dari pertanyaan, bukan dari tampilan. Tentukan dulu apa yang ingin dijawab: membandingkan, melihat tren, melihat komposisi, melihat sebaran, melihat hubungan, atau melihat lokasi. Default yang aman adalah bar untuk perbandingan, line untuk tren waktu, stacked bar untuk komposisi, scatter untuk hubungan, histogram atau box plot untuk sebaran, dan choropleth atau tile map untuk wilayah. Chart khusus seperti radar, sunburst, sankey, atau stream graph dipakai hanya bila chart default gagal menyampaikan pesan, bukan supaya terlihat canggih. |  | ■ TERUKUR PANDUAN JENIS CHART V1.1 §1 |
|---|---|---|

## T056 — Tabel 7.1   Istilah dasar chart yang dipakai di Bab 7 dan 8.

| Istilah | Arti sederhana |
|---|---|
| Data kategori | Data berupa nama atau kelompok: instansi, wilayah, produk, divisi. |
| Data numerik | Data yang bisa dihitung: rupiah, jumlah, persen, jam. |
| Data waktu | Data yang berurutan menurut tanggal, bulan, atau tahun. |
| Sumbu nol | Titik awal sumbu. Bar wajib mulai dari nol; bila tidak, selisih tampak dibesar-besarkan. |
| Seri | Satu kelompok data yang digambar dengan tinta yang sama, misalnya Realisasi. |
| Bagian dari keseluruhan | Bagian yang dijumlahkan menjadi total bermakna, biasanya 100 %. |
| Sebaran | Cara nilai menyebar: mengumpul di mana, seberapa lebar, ada pencilan atau tidak. |
| Pencilan | Nilai yang jauh berbeda dari kebanyakan data. |
| Korelasi | Dua variabel cenderung bergerak bersama. Korelasi bukan bukti sebab-akibat. |
| Hierarki | Data bertingkat: induk, anak, cucu (divisi, tim, orang). |
| Label langsung | Nama seri ditulis di ujung data. Menggantikan legenda; DATUM tidak memakai kotak legenda. |
| Small multiples | Satu chart kecil yang diulang per kelompok dalam grid dengan skala sama. |
| SUMBER Panduan Jenis Chart v1.1 Bab 2. Baris Label langsung diselaraskan dengan references/03 §2 DATUM. |  |

## T057 — Tabel 7.2   Kata kunci pertanyaan menentukan kelompok chart.

| Kata kunci pertanyaan | Kelompok tujuan | Chart default |
|---|---|---|
| mana yang lebih besar, peringkat, bandingkan | Perbandingan | Bar urut (P-01) |
| bagaimana perkembangannya, naik atau turun | Waktu | Line (W-01) |
| terdiri dari apa, berapa porsinya | Komposisi | Stacked bar (K-01); pie bila maks. 5 bagian |
| bagaimana sebarannya, ada pencilan | Sebaran | Histogram (S-01), box plot (S-02) |
| apakah X berkaitan dengan Y | Hubungan | Scatter (H-01) |
| di mana terjadinya | Geospasial | Tile map (G-01), dot map (G-02) |
| mengalir ke mana, tahap apa | Aliran dan proses | Sankey (K-11), funnel (K-10), waterfall (P-10) |
| sudah mencapai target | Kinerja | Bullet (P-09); threshold (P-11) untuk batas teknis |
| SUMBER Panduan Jenis Chart v1.1 Bab 3, Langkah 1. Kode chart merujuk Pustaka Bab 8. |  |  |

## T058 — Tabel 7.3   Jumlah kategori dan seri menentukan pilihan chart.

| Kondisi | Akibat pada pilihan chart |
|---|---|
| Kategori maks. 5 | Pie atau donut masih boleh; bar tetap lebih presisi. |
| Kategori 6 sampai 30 | Bar urut atau lollipop. |
| Kategori lebih dari 30 | Ambil 10 sampai 15 teratas ditambah Lainnya, atau treemap. |
| Garis pada line chart lebih dari 3 | Sorot satu garis dengan aksen, pudarkan sisanya, atau small multiples. |
| Titik scatter ribuan | Transparansi titik, atau hexbin dan heatmap. |
| Nilai berbeda ribuan kali lipat | Treemap atau icon chart, atau skala log dengan keterangan jelas. |
| SUMBER Panduan Jenis Chart v1.1 Bab 3, Langkah 3. Ambang praktis, bukan standar baku. |  |

## T059 — Tabel 7.4   Enam aturan uji chart dan pelaksanaannya dalam DATUM.

| ID | Aturan uji | Pelaksanaan DATUM |
|---|---|---|
| CH-01 | Bar dan column mulai dari nol | Satu garis dasar ink900; area juga mulai dari nol |
| CH-02 | Urutkan kategori besar ke kecil kecuali urutannya alami | Urutan alami: waktu, tingkat, arah mata angin |
| CH-03 | Satu warna penekanan, sisanya abu-abu | Aksen signal #B45309 hanya pada satu subjek; konteks ink400 dan ink200 |
| CH-04 | Label langsung di data, kurangi legenda | Label nilai mono tanpa kotak; legenda hanya sebagai baris KUNCI di bawah gambar |
| CH-05 | Judul berupa kesimpulan | Tidak ada judul di dalam plot; kalimat caption di atas gambar adalah kesimpulan |
| CH-06 | Tanpa 3D, tanpa dua sumbu Y, tanpa hiasan | Juga tanpa bayangan, gradien, ujung bar membulat, bingkai chart, label berkotak |
| SUMBER Panduan Jenis Chart v1.1 Bab 3 Langkah 5 · references/03 §2 DATUM · putusan R-01 sampai R-03, Tabel 17.1. |  |  |

## T060 — 7.4   Warna chart dalam palet DATUM

| Panduan chart menyarankan hijau dan merah untuk baik dan buruk, dan contoh gambarnya memakai biru. DATUM memutus kedua hal itu. Satu aksen chart adalah signal amber. Merah yang dipakai adalah alert #9B1C1C, hanya untuk nilai yang melewati batas atau arah memburuk. Hijau yang dipakai adalah verd #2F6F6B untuk arah membaik. Biru tidak ada di palet. Setiap pembedaan warna diulang lewat label, posisi, atau pola, sehingga chart tetap terbaca setelah fotokopi hitam-putih. |  | ◈ DITURUNKAN R-02 DT-06 DT-34 |
|---|---|---|

## T061 — Tabel 7.5   Peran warna pada chart GSP.

| Peran | Token | Hex | Dipakai untuk |
|---|---|---|---|
| Aksen tunggal | signal | #B45309 | Satu subjek yang tidak boleh terlewat pembaca |
| Konteks utama | ink400 | #6B7783 | Seri pembanding yang tetap perlu dibaca |
| Konteks latar | ink200 | #C3CBD1 | Target, periode lalu, sisa kategori |
| Batas terlampaui, memburuk | alert | #9B1C1C | Batang yang melewati batas; penurunan |
| Membaik | verd | #2F6F6B | Kenaikan pada waterfall atau slope |
| Teks, sumbu, garis batas | ink900 | #101418 | Garis dasar, label nilai mono, garis batas threshold |
| SUMBER tokens.json colour.interior · putusan R-02. Satu gambar memakai paling banyak lima nilai warna (lint 25). |  |  |  |

## T062 — Tabel 7.6   Tabel pemilihan cepat: tujuan, chart utama, alternatif sah, dan yang biasanya keliru.

| Tujuan | Chart utama | Alternatif sah | Biasanya keliru |
|---|---|---|---|
| Perbandingan antar kategori | Bar urut | Lollipop, dot plot, column | Pie banyak irisan, radial bar, bar 3D |
| Dua seri per kategori | Grouped bar | Dumbbell, slope | Stacked bar |
| Realisasi terhadap target | Bullet | Grouped bar dengan garis target | Deretan gauge |
| Nilai terhadap batas teknis | Threshold | Bullet | Bar dengan batas hanya di caption |
| Perubahan bersih awal ke akhir | Waterfall | Bar perubahan plus-minus | Pie |
| Tren waktu | Line | Area bila mulai nol; column bila maks. 12 periode | Pie per bulan, dua sumbu Y |
| Peringkat dari waktu ke waktu | Bump | Slope untuk dua titik | Line dengan 15 garis |
| Komposisi satu total | Stacked bar atau donut | Waffle, treemap | Pie lebih dari 5 irisan |
| Komposisi antar kelompok | 100 % stacked bar | Marimekko, small multiples | Deretan pie |
| Hierarki | Treemap | Sunburst, circle packing | Pie bertingkat tanpa label |
| Hubungan dua variabel | Scatter | Hexbin untuk data padat | Line bila X bukan urutan |
| Hubungan tiga variabel | Bubble | Scatter dengan warna | Scatter 3D |
| Pola dua dimensi kategori | Heatmap | Table chart berwarna | Grouped bar 7 × 24 batang |
| Sebaran | Histogram, box plot | Violin, density, beeswarm | Bar rata-rata saja |
| Tahapan proses | Funnel | Bar per tahap | Pie |
| Aliran antar tahap | Sankey | Flow map bila ada lokasi | Network diagram kusut |
| Lokasi | Choropleth untuk rasio, tile map | Bubble map untuk angka absolut | Choropleth untuk angka absolut |
| Prioritas dua kriteria | Quadrant | Bubble | Tabel skor saja |
| Jadwal proyek | Gantt | Timeline | Tabel tanggal |
| SUMBER Panduan Jenis Chart v1.1 Bab 4, dengan baris threshold ditambahkan dari SKILL.md DATUM §12. |  |  |  |

## T063 — Tabel 7.7   Sepuluh kesalahan chart yang paling sering dan perbaikannya.

| Kesalahan | Akibat | Perbaikan |
|---|---|---|
| Bar tidak mulai dari nol | Selisih kecil tampak besar | Mulai dari nol, atau ganti dot plot |
| Pie dengan 8 irisan atau lebih | Tidak terbaca, label bertumpuk | Bar urut; gabungkan sisa ke Lainnya |
| Efek 3D | Proporsi terdistorsi | Pakai 2D |
| Dua sumbu Y | Pembaca menarik kesimpulan palsu | Dua chart berdampingan |
| Line untuk kategori tak berurutan | Garis menyiratkan kesinambungan palsu | Bar |
| Spaghetti chart | Tidak ada garis yang terbaca | Sorot satu garis atau small multiples |
| Palet pelangi pada heatmap | Urutan nilai tidak jelas | Satu gradasi dari putih ke signal |
| Stacked bar banyak segmen | Segmen atas tidak bisa dibandingkan | Grouped bar atau small multiples |
| Chart khusus untuk audiens awam | Pesan hilang | Kembali ke bar atau line ditambah anotasi |
| Rata-rata tanpa sebaran | Pencilan dan ketimpangan tersembunyi | Box plot atau histogram |
| SUMBER Panduan Jenis Chart v1.1 Bab 9. |  |  |

## T064 — 8.1   Fungsi pustaka

| Pustaka ini adalah lembar galeri 58 jenis chart yang digambar ulang dalam palet dan tipografi DATUM, masing-masing dengan kode tetap. Kode dipakai sebagai alamat: tabel pemilihan di Bab 7, katalog di 8.2, dan contoh terapan di 8.3 menunjuk kode yang sama. Semua data pada galeri adalah ilustrasi. |  | ◈ DITURUNKAN PUSTAKACHART.PY Dibangun ulang 8 Oktober 2026. |
|---|---|---|

## T065 — Tabel 8.1   Katalog perbandingan: fungsi, kapan dipakai, dan kapan dihindari.

| Kode | Chart | Fungsi | Pakai bila | Hindari bila |
|---|---|---|---|---|
| P-01 | Bar urut | Panjang batang sama dengan nilai per kategori | Label kategori panjang; nilai sebesaran | Lebih dari 30 batang, ganti treemap |
| P-02 | Column | Bar yang diputar 90° | Label pendek; urutan alami; sedikit periode | Label panjang, ganti bar |
| P-03 | Grouped column | Beberapa batang per kategori | Dua sampai tiga seri, misalnya target dan realisasi | Banyak seri, ganti small multiples |
| P-04 | Lollipop | Garis tipis dengan titik di ujung | Banyak kategori, ruang terbatas | Nilai sangat berdekatan, ganti bar |
| P-05 | Dot plot | Satu atau beberapa titik per kategori | Sumbu tidak perlu mulai nol | Tanpa gridline, titik kehilangan acuan |
| P-06 | Dumbbell | Dua titik dihubungkan garis | Selisih dua kondisi, sebelum dan sesudah | Data tidak berpasangan |
| P-07 | Range plot | Batang rentang minimum sampai maksimum | Fokus pada lebar celah | Fokus satu nilai, ganti bar |
| P-08 | Slope | Dua sumbu tegak dihubungkan garis | Tepat dua titik waktu | Lebih dari dua titik, ganti line |
| P-09 | Bullet | Realisasi, target, dan pita kinerja dalam satu baris | KPI terhadap target | Tidak ada target |
| P-10 | Waterfall | Batang mengambang dari awal ke akhir | Perubahan bersih: kas, laba, stok | Nilai absolut tiap komponen |
| P-11 | Threshold | Batang terhadap garis batas berlabel | Nilai rekayasa terhadap batas | Tidak ada batas yang dinyatakan |
| P-12 | Small multiples | Chart sama diulang per kelompok | Memecah chart terlalu padat | Satu chart sudah cukup |
| P-13 | Quadrant | Scatter dibagi empat kuadran | Prioritas dua kriteria | Garis pembagi tanpa alasan |
| P-14 | Arrow chart | Dumbbell berpanah | Arah perubahan sama penting dengan besarnya | Hanya satu kondisi |
| P-15 | Table chart | Tabel dengan pewarnaan bersyarat | Pembaca butuh angka persis | Aturan warna tanpa keterangan |
| – | Radar, parallel coordinates, nightingale, radial bar, word cloud | Profil, banyak dimensi, atau hiasan | Hanya untuk tim analis, atau tidak dipakai | Butuh presisi, ganti bar |
| SUMBER Panduan Jenis Chart v1.1 Bab 5, disusun ulang dengan kode pustaka. Baris bertanda – tercatat tetapi tidak digambar. |  |  |  |  |

## T066 — Tabel 8.2   Katalog hubungan: fungsi, kapan dipakai, dan kapan dihindari.

| Kode | Chart | Fungsi | Pakai bila | Hindari bila |
|---|---|---|---|---|
| H-01 | Scatter | Titik pada sumbu X dan Y | Korelasi, klaster, pencilan | Ribuan titik bertumpuk, ganti hexbin |
| H-02 | Bubble | Scatter dengan ukuran sebagai variabel ketiga | Tiga variabel numerik | Gelembung saling tumpuk |
| H-03 | Heatmap | Nilai sebagai intensitas warna dalam grid | Pola hari × jam, matriks korelasi | Butuh selisih presisi |
| H-04 | Connected scatter | Scatter dihubungkan menurut waktu | Dua variabel bergerak bersama | Pembaca awam tanpa anotasi |
| H-05 | Hexbin | Heatmap kepadatan sarang lebah | Ribuan titik | Sampel kecil |
| H-06 | Contour | Garis nilai sama | Permukaan kontinu: elevasi, sinyal | Data jarang |
| H-07 | Network | Simpul dan garis penghubung | Analisis relasi OSINT, topologi | Ratusan simpul tanpa filter |
| H-08 | Arc diagram | Simpul di satu garis, dihubungkan busur | Relasi sedikit sampai sedang | Banyak koneksi |
| H-09 | Venn atau Euler | Lingkaran bertumpuk untuk irisan himpunan | Dua sampai tiga himpunan | Lebih dari tiga himpunan |
| – | Chord diagram | Busur dan pita antar kategori | Pertukaran data antar sedikit instansi | Banyak kategori, ganti heatmap |
| SUMBER Panduan Jenis Chart v1.1 Bab 5, disusun ulang dengan kode pustaka. Baris bertanda – tercatat tetapi tidak digambar. |  |  |  |  |

## T067 — Tabel 8.3   Katalog komposisi dan aliran: fungsi, kapan dipakai, dan kapan dihindari.

| Kode | Chart | Fungsi | Pakai bila | Hindari bila |
|---|---|---|---|---|
| K-01 | Stacked bar | Batang dibelah menjadi segmen | Total dan kontribusi; sedikit segmen | Membandingkan segmen atas |
| K-02 | 100 % stacked bar | Batang sama panjang, segmen persen | Porsi lebih penting dari total | Butuh total absolut |
| K-03 | Diverging bar | Batang ke kiri dan kanan dari nol | Positif dan negatif, skala Likert | Tidak ada titik tengah bermakna |
| K-04 | Population pyramid | Diverging bar usia × dua kelompok | Struktur demografi | Lebih dari dua kelompok |
| K-05 | Donut | Pie berlubang, angka kunci di tengah | Sedikit bagian, ada total yang ditonjolkan | Perbandingan presisi |
| K-06 | Pie | Lingkaran dibagi irisan | Maks. lima kategori, satu dominan | Selisih kecil |
| K-07 | Waffle | Grid 10 × 10, satu kotak 1 % | Progres untuk pembaca awam | Angka tidak bulat |
| K-08 | Icon array | Satu ikon satu unit | Rasio mudah dihitung | Jumlah besar |
| K-09 | Treemap | Persegi bersarang, luas sama dengan nilai | Banyak kategori hierarkis | Banyak kotak kecil |
| K-10 | Funnel | Batang menyempit per tahap | Tahapan berurutan | Butuh presisi antar tahap |
| K-11 | Sankey | Pita yang tebalnya sama dengan volume | Aliran RAB, energi, anggaran | Terlalu banyak simpul |
| K-12 | Marimekko | Stacked bar dengan lebar bervariasi | Dua proporsi bertingkat | Banyak segmen kecil |
| – | Sunburst, circle packing, dendrogram, gauge, semicircle donut | Hierarki melingkar atau satu KPI | Hierarki 2 sampai 3 level; satu indikator | Presisi penting, ganti treemap atau bullet |
| SUMBER Panduan Jenis Chart v1.1 Bab 5, disusun ulang dengan kode pustaka. Baris bertanda – tercatat tetapi tidak digambar. |  |  |  |  |

## T068 — Tabel 8.4   Katalog waktu: fungsi, kapan dipakai, dan kapan dihindari.

| Kode | Chart | Fungsi | Pakai bila | Hindari bila |
|---|---|---|---|---|
| W-01 | Line | Titik dihubungkan garis sepanjang waktu | Tren data rapat; sumbu tidak wajib nol | Lebih dari tiga garis tanpa sorotan |
| W-02 | Column waktu | Batang per periode | Maks. 12 periode | Banyak periode, ganti line |
| W-03 | Step line | Garis berbentuk tangga | Perubahan pada saat tertentu: harga, restok | Berubah di setiap titik |
| W-04 | Area | Line dengan area terisi | Akumulasi yang mulai dari nol | Data tidak mulai dari nol |
| W-05 | Stacked area | Area seri ditumpuk | Tren total dan kontribusi | Membandingkan seri satu sama lain |
| W-06 | Bump | Peringkat dari waktu ke waktu | Siapa naik dan turun | Butuh nilai sebenarnya |
| W-07 | Gantt | Batang durasi pada garis waktu | Jadwal proyek, milestone BAST | Ratusan tugas; pecah per fase |
| W-08 | Barcode | Garis tegak di setiap kejadian | Linimasa forensik, deret alarm | Pengganti tabel log |
| W-09 | Horizon | Area dilipat menjadi pita | Puluhan sensor dalam satu layar | Tanpa legenda pita |
| W-10 | Candlestick | Buka, tutup, tertinggi, terendah | Audiens keuangan | Audiens umum |
| – | Spline, stream graph, spiral, OHLC | Varian halus, artistik, atau siklus | Kasus khusus | Hampir selalu ganti line |
| SUMBER Panduan Jenis Chart v1.1 Bab 5, disusun ulang dengan kode pustaka. Baris bertanda – tercatat tetapi tidak digambar. |  |  |  |  |

## T069 — Tabel 8.5   Katalog sebaran, geospasial, dan proses: fungsi, kapan dipakai, dan kapan dihindari.

| Kode | Chart | Fungsi | Pakai bila | Hindari bila |
|---|---|---|---|---|
| S-01 | Histogram | Data dikelompokkan ke rentang | Bentuk sebaran satu variabel | Bin terlalu banyak atau sedikit |
| S-02 | Box plot | Median, kuartil, pencilan | Sebaran beberapa kelompok | Audiens awam tanpa keterangan |
| S-03 | Density | Histogram versi kurva halus | Data kontinu tanpa efek bin | Sampel kecil |
| S-04 | Violin | Box plot dengan bentuk kepadatan | Bentuk dan sebaran kelompok | Audiens awam |
| S-05 | Ridgeline | Kurva kepadatan ditumpuk | Pergeseran sebaran per bulan | Lebih dari 12 kelompok |
| S-06 | Strip atau jitter | Setiap pengamatan sebagai titik | Sampel kecil sampai sedang | Ribuan titik |
| S-07 | Beeswarm | Titik rapat tanpa bertumpuk | Semua kasus terlihat | Data sangat banyak |
| S-08 | Radial histogram | Histogram melingkar | Data arah atau jam dalam sehari | Data bukan arah |
| G-01 | Tile map | Satu kotak sama besar per wilayah | Membandingkan 38 provinsi secara adil | Butuh bentuk geografis |
| G-02 | Dot map | Satu titik satu lokasi | Sebaran lokasi kantor atau insiden | Ribuan titik bertumpuk |
| G-03 | Flow map | Panah antar lokasi, tebal sama dengan volume | Rute logistik, jaringan kantor | Terlalu banyak garis |
| G-04 | Flowchart | Kotak dan panah ISO 5807 | SOP, rantai kustodi | Data angka; gambar dibangun mesin diagram (Bab 9) |
| – | Choropleth, bubble map, heat map geospasial | Peta berwarna atau bergelembung | Rasio per wilayah; angka absolut | Angka absolut pada choropleth |
| SUMBER Panduan Jenis Chart v1.1 Bab 5, disusun ulang dengan kode pustaka. Baris bertanda – tercatat tetapi tidak digambar. |  |  |  |  |

## T070 — Tabel 8.6   Tiga puluh contoh terapan: pertanyaan, chart, cara membuat, dan jebakan.

| No | Pertanyaan | Kode | Cara membuat | Jebakan |
|---|---|---|---|---|
| 1 | Instansi mana penyumbang pipeline terbesar? | P-01 | Urutkan; warnai batang teratas saja; nilai di ujung batang | Sumbu tidak nol; warna per batang tanpa makna |
| 2 | Kuartal mana di bawah target? | P-03 | Target ink200, realisasi tegas; maks. tiga seri | Menumpuk target dan realisasi dalam stacked bar |
| 3 | Bagaimana peringkat skor teknis 10 vendor? | P-04 | Garis tipis, titik berwarna, mulai nol, urut | Titik terlalu besar |
| 4 | Indikator mana paling membaik setelah implementasi? | P-06 | Kondisi awal ink400, akhir signal; urut menurut selisih | Data tidak berpasangan |
| 5 | KPI mana sudah dan belum mencapai target? | P-09 | Pita tiga tingkat; batang realisasi; garis target | Pita terlalu kontras |
| 6 | Mengapa saldo turun dari 50 menjadi 30? | P-10 | Awal dan akhir menapak nol; tulis plus-minus | Butuh nilai absolut komponen |
| 7 | Divisi mana membaik dan memburuk dari 2025 ke 2026? | P-08 | Nama dan nilai di kiri, nilai di kanan; verd naik, alert turun | Lebih dari dua titik waktu |
| 8 | Apakah belanja promosi berkaitan dengan penjualan? | H-01 | Dugaan penyebab di sumbu X; garis tren opsional | Menyimpulkan sebab-akibat |
| 9 | Proyek mana bernilai besar, margin tinggi, risiko rendah? | H-02 | Luas gelembung sebanding nilai; label langsung | Lebih dari empat variabel |
| 10 | Kapan alarm sistem paling sering muncul? | H-03 | Satu gradasi putih ke signal; sertakan skala | Palet pelangi |
| 11 | Apakah komposisi pendapatan berbeda antar wilayah? | K-02 | Maks. empat segmen; segmen terpenting di kiri | Membandingkan segmen tengah |
| 12 | Seberapa besar ketergantungan pada klien pemerintah? | K-05 | Maks. lima irisan; mulai jam 12 searah jarum jam | Irisan berukuran mirip |
| 13 | Lini bisnis mana mendominasi nilai proyek? | K-09 | Label dan nilai di dalam kotak; batasi kotak kecil | Puluhan kotak tanpa label |
| 14 | Apakah tiket layanan tahun ini tumbuh lebih cepat? | W-01 | Maks. tiga garis; label di ujung garis | Dua sumbu Y |
| 15 | Sumber mana mendorong pendapatan kumulatif? | W-05 | Seri terbesar paling bawah; maks. empat lapisan | Membandingkan lapisan atas |
| 16 | Berapa usia kebanyakan peserta pelatihan? | S-01 | 10 sampai 20 bin; tandai median | Bin terlalu sedikit atau banyak |
| 17 | Departemen mana beban lemburnya paling tidak merata? | S-02 | Median, kotak 50 %, titik pencilan; beri keterangan | Rata-rata saja |
| 18 | Di tahap mana prospek paling banyak hilang? | K-10 | Angka tiap tahap; persentase konversi | Butuh presisi antar tahap |
| 19 | Peluang mana dikejar lebih dulu? | P-13 | Garis pembagi beralasan; beri nama kuadran | Garis pembagi sembarang |
| 20 | Apakah A benar-benar unggul? | K-06, P-01 | Lima irisan 17 sampai 23 % tidak bisa dibedakan; bar urut menjawab | Pie untuk selisih kecil |
| 21 | Kapan tiap pekerjaan mulai dan selesai? | W-07 | Satu baris per tugas; milestone BAST dan UAT; garis hari ini | Ratusan tugas; proposal cukup 8 sampai 15 baris |
| 22 | Ke mana anggaran Rp 100 miliar mengalir? | K-11 | Maks. tiga tingkat dan kira-kira 12 simpul akhir | Total tiap tingkat tidak sama |
| 23 | Siapa menghubungkan dua kelompok terpisah? | H-07 | Ukuran simpul sama dengan koneksi; sorot penghubung | Bola benang tanpa filter |
| 24 | Provinsi mana kesiapan sistemnya masih rendah? | G-01 | Singkatan baku; satu gradasi; nilai di kotak | Dianggap peta presisi |
| 25 | Sensor mana menyimpang dari normal, dan kapan? | W-09 | Kurangi baseline; dua sampai tiga pita; lipat | Tanpa legenda pita |
| 26 | Adakah urutan kejadian mencurigakan dalam log? | W-08 | Satu baris per jenis; alert untuk jenis berisiko | Mengganti tabel log sebagai bukti |
| 27 | Dari arah mana ancaman paling sering datang? | S-08 | Utara di atas, searah jarum jam; sektor seragam | Data bukan arah |
| 28 | Apakah waktu respons tiap satuan sama konsisten? | S-07 | Satu kolom per kelompok; tambah median | Menyimpulkan dari median saja |
| 29 | Apakah layanan membaik dari bulan ke bulan? | S-05 | Urut periode; kurva sedikit tumpang tindih; sumbu sama | Lebih dari 12 kelompok |
| 30 | Bagaimana barang bukti digital ditangani? | G-04 | Satu arah baca; bentuk baku; kira-kira 10 langkah | Semua cabang pengecualian sekaligus |
| SUMBER Panduan Jenis Chart v1.1 Bab 6 dan 7.3. Warna disesuaikan ke Tabel 7.5. |  |  |  |  |

## T071 — Tabel 8.7   Chart tambahan yang paling relevan untuk pekerjaan GSP.

| Chart | Kode | Use case GSP | Relevansi |
|---|---|---|---|
| Gantt | W-07 | Jadwal pelaksanaan di proposal teknis, kajian, dan rencana kerja | Tinggi |
| Sankey | K-11 | Aliran RAB dari total ke kelompok biaya ke item; aliran data antar tier | Tinggi |
| Network | H-07 | Analisis relasi OSINT; topologi; peta pemangku kepentingan | Tinggi |
| Tile map | G-01 | Sebaran nasional per provinsi, Polda, atau Kodam tanpa bias luas | Tinggi |
| Horizon | W-09 | Dashboard pusat komando: puluhan sensor perimeter, radar, kamera | Tinggi |
| Barcode | W-08 | Linimasa forensik digital: login, akses berkas, USB, ekspor | Tinggi |
| Radial histogram | S-08 | Arah deteksi radar dan perimeter, hasil direction finding | Tinggi |
| Flowchart | G-04 | SOP, rantai kustodi barang bukti, alur keputusan | Tinggi |
| Beeswarm, strip | S-07 | Sebaran waktu respons per satuan; skor evaluasi vendor | Sedang |
| Ridgeline | S-05 | Pergeseran sebaran waktu penyelesaian tiket | Sedang |
| Radial bar, nightingale, word cloud | – | Hiasan; presisinya rendah untuk pejabat dan panitia tender | Rendah |
| SUMBER Panduan Jenis Chart v1.1 Bab 7.1. PROVENANS △ ASUMSI: matriks adalah penilaian penyusun panduan chart, bukan isi sumber. |  |  |  |

## T072 — Tabel 8.8   Chart yang disarankan dan dihindari per jenis dokumen GSP.

| Dokumen | Chart yang disarankan | Hindari |
|---|---|---|
| Proposal teknis, kajian | Gantt, flowchart, bar untuk perbandingan opsi, bullet, threshold | Radar untuk membandingkan vendor |
| RAB, BoQ, penawaran | Sankey atau treemap untuk komposisi biaya, waterfall, 100 % stacked bar untuk TKDN | Pie dengan banyak irisan |
| Paparan ke pejabat | Bar urut, line, bullet, tile map; satu pesan per slide | Box plot, horizon, network tanpa penjelasan |
| Layar pusat komando | Horizon, line, heatmap hari × jam, bullet, dot map | 3D, animasi berlebihan, stream graph |
| Laporan OSINT | Network, barcode, heatmap aktivitas, bar frekuensi | Word cloud sebagai satu-satunya bukti |
| Laporan forensik digital | Barcode, flowchart rantai kustodi, table chart | Chart yang menyembunyikan waktu kejadian persis |
| Laporan kinerja internal | Bullet, dumbbell, arrow, beeswarm, ridgeline | Deretan gauge |
| SUMBER Panduan Jenis Chart v1.1 Bab 7.2. |  |  |

## T073 — Tabel 8.9   Dua belas butir periksa chart.

| No | Butir pemeriksaan | Aturan |
|---|---|---|
| 1 | Pertanyaan yang dijawab chart bisa ditulis dalam satu kalimat. | CH-07 |
| 2 | Jenis chart sesuai kelompok tujuan pada Tabel 7.2. | CH-08 |
| 3 | Jumlah kategori dan seri dalam batas Tabel 7.3. | CH-09 |
| 4 | Bar, column, dan area mulai dari nol. | CH-01 |
| 5 | Kategori diurutkan dengan alasan. | CH-02 |
| 6 | Caption berupa kesimpulan, dengan satuan dan periode tertulis. | CH-05 |
| 7 | Satu aksen signal; warna lain dari Tabel 7.5. | CH-03 |
| 8 | Label langsung; legenda hanya sebagai baris KUNCI. | CH-04 |
| 9 | Tanpa 3D, dua sumbu Y, bayangan, gradien, bingkai. | CH-06 |
| 10 | Angka di chart sudah dicocokkan dengan register atau data sumber. | DT-23 |
| 11 | Baris SUMBER dengan tanggal data dan tanda provenans. | DT-15 |
| 12 | Orang yang tidak ikut membuat chart menangkap pesannya dalam lima detik. | CH-10 |
| SUMBER Panduan Jenis Chart v1.1 Bab 10, dipetakan ke nomor aturan manual ini. |  |  |

## T074 — 9.1   Gambar menyatakan fakta

| Chart punya sumbu; gambar teknik punya simpul dan penghubung, dan keduanya gagal dengan cara berbeda. Dalam gambar, setiap kotak adalah komponen nyata, setiap garis antarmuka nyata, dan setiap anotasi kuantitas nyata. Garis yang ditarik melewati kotak yang tidak terkait menyatakan sambungan yang tidak ada. Dua panah yang mendarat di satu jangkar terbaca sebagai panah dua kepala yang tidak pernah digambar. Gambar yang menyatakan satu hal salah kehilangan hak untuk dipercaya tentang sisanya. |  | ■ TERUKUR REF 08 §1 |
|---|---|---|

## T075 — Tabel 9.1   Isi minimum sebuah spec gambar.

| Kunci | Aturan |
|---|---|
| family | Satu dari sembilan keluarga pada Tabel 9.2, dipilih PRISMA, tidak pernah oleh DATUM |
| id, title | Nomor berawalan bab; judul satu kalimat diakhiri titik |
| classification | Diputuskan bersama dokumen induk, tidak pernah sendiri |
| nodes[] | id, label, kelas (tier, lane, col dan row), sub, mark, tag |
| edges[] | from, to, kind, dan label, keempatnya wajib |
| legend[], notes[] | Baris kunci bila tanda rumah dipakai; batas lingkup dan konvensi |
| sources[] | Sekurang-kurangnya satu dokumen dan pasal dasar gambar |
| labels_verified | false berarti draf: render dan tinjau, jangan dikirim |
| width_mm | 128 atau 166, tidak pernah di antaranya |
| apparatus | page untuk gambar di .docx atau .pptx; figure untuk SVG mandiri |
| SUMBER References/08 §0.1 · datum_diagram.py --schema. |  |

## T076 — Tabel 9.2   Keluarga diagram, kapan digambar, dan mesin tata letaknya.

| Keluarga | Gambar bila | Mesin tata letak |
|---|---|---|
| layered | Komponen tergolong lapisan: tier, zona, lapis | layout_layered |
| topology | Perangkat jaringan dan tautan; setiap tautan berlabel | layout_layered |
| stack | Terdaftar sebagai keluarga; belum punya tata letak sendiri | layout_layered |
| flow | Prosedur berurutan dengan gerbang keputusan | layout_flow |
| swimlane | Siapa yang bertindak adalah pokoknya | layout_swimlane |
| sequence | Urutan pesan dari waktu ke waktu | layout_sequence |
| sld | Rantai daya atau sinyal yang menggantung pada rel | layout_sld |
| rack | Elevasi rak; posisi U menanggung beban makna | layout_rack |
| graph | Selain itu, ditempatkan lewat col dan row | layout_graph |
| SUMBER References/08 §2 · tabel LAYOUTS datum_diagram.py. Sembilan nama, tujuh mesin tata letak. |  |  |

## T077 — Tabel 9.3   Bentuk simpul dan artinya, satu notasi per gambar.

| Bentuk | Arti | Notasi |
|---|---|---|
| box | Komponen, langkah proses, peralatan | universal |
| stadium | Mulai atau selesai; satu-satunya bentuk bersudut bulat | ISO 5807 |
| diamond | Keputusan; setiap keluaran berlabel | ISO 5807 |
| parallelogram | Masukan atau keluaran | ISO 5807 |
| cylinder | Data tersimpan, arsip | universal |
| hexagon | Persiapan, gerbang | ISO 5807, BPMN |
| doubled | Subsistem dengan struktur lanjutan | Komponen UML |
| shadowed | Entitas eksternal di luar batas | DFD Gane-Sarson |
| circle | Persimpangan, penghubung antarhalaman | universal |
| bus | Rel daya atau backplane, garis tebal | IEC 60617 |
| SUMBER References/08 §4 · tokens.json diagram.node.shapes. |  |  |

## T078 — Tabel 9.4   Jenis penghubung: makna dibawa pola garis lebih dulu, warna kemudian.

| Jenis | Pola dan warna | ISO 128-2 | Pemakaian |
|---|---|---|---|
| data | penuh, ink900, kepala pejal | 01.1 | Zat yang mengalir melalui sistem |
| control | putus-putus, ink700, kepala terbuka | 02.1 | Perintah, pemicu, orkestrasi |
| sync | titik-titik, ink400, kepala terbuka | – | Replikasi, pencerminan, detak |
| accent | penuh, signal, tebal | 01.1 | Satu jalur yang tidak boleh terlewat |
| alert | putus panjang, alert | – | Kegagalan, penolakan, pengecualian |
| verify | titik-garis, verd | 04.1 | Pemeriksaan integritas, atestasi, audit |
| SUMBER References/08 §5 · references/09 §7 · tokens.json diagram.edge_kinds. |  |  |  |

## T079 — 10.1   Aturan yang mengatur setiap simbol

| Jangan pernah mengarang simbol standar. Bila satu set simbol resmi berlaku, pakai set itu; bila tidak, katakan terus terang bahwa blok sederhana yang dipakai. Tanda karangan yang terlihat resmi lebih buruk daripada persegi yang jujur, karena ia mengklaim kepatuhan pada standar yang tidak dipegang GSP. Bila standar memang tidak ada, katakan begitu dan terbitkan legendanya. |  | ■ TERUKUR REF 09 §1 SM-01 |
|---|---|---|

## T080 — Tabel 10.1   Jenis gambar GSP dan standar simbolnya, edisi per 7 Oktober 2026.

| Jenis gambar | Dipakai di | Standar simbol | Edisi, status | Pustaka DATUM |
|---|---|---|---|---|
| Diagram satu garis catu daya | Pos perimeter, ruang server, NOC | IEC 60617 dan penandaan IEC 81346-1; instalasi PUIL 2020 (SNI 0225:2020) | IEC 60617:2026 DB [T]; 81346-1:2022 [D] | iec: |
| Skematik kendali | Panel sensor, kotak antarmuka | IEC 60617; IEEE 315 hanya bila klien memakai standar AS | IEEE 315 belum terverifikasi | sebagian |
| P&ID, instrumentasi | Tambang, migas, pelabuhan, utilitas | ANSI/ISA-5.1 | 2024 [T], menggantikan 2022 | isa: (label 2022) |
| Denah keamanan | CCTV, akses, intrusi, perimeter | Legenda rumah GSP, atau SIA AG-01 v3.0 bila klien memakai standar AS | AG-01 v3.0 [T] | sec: |
| Denah alarm kebakaran | Gedung, ruang server | NFPA 170; rujukan Indonesia SNI 03-3985-2000 | NFPA 170:2024 [S] | tidak ada |
| Topologi jaringan | Hampir semua proyek | Tidak ada standar formal; ikon vendor tanpa diubah, atau legenda generik GSP | – | usulan net: |
| Elevasi rak | Ruang server, NOC | EIA-310, rak 19 inci | 1U = 44,45 mm [S] | rack |
| Label kabel | Ruang server, gedung | ANSI/TIA-606-D | 606-D [S] | tidak ada |
| Diagram alir, SOP | Kajian teknis, SOP | ISO 5807 | 1985, dikonfirmasi 2019 [T] | bentuk simpul |
| Proses bisnis | SPBE, alur kerja | BPMN 2.0.2 (ISO/IEC 19510) | [K] | usulan bpmn: |
| Arsitektur perangkat lunak | DEMS, OSINT, platform | UML 2.5.1; model C4 | [K] | sebagian |
| Arsitektur enterprise | SPBE, transformasi digital | ArchiMate | ArchiMate 4, April 2026 [T] | tidak ada |
| Diagram aliran data | Analisis sistem | Gane-Sarson, konvensi de facto | – | shadowed |
| Gambar operasi, COP | TNI, pusat komando | MIL-STD-2525; NATO APP-6 | 2525E [D]; APP-6E 2025 [S] | mil: |
| Rambu keselamatan | Jalur evakuasi, APAR | ISO 7010 | 2019 + Amd 9:2025 [T] | tidak ada |
| Jenis dan tebal garis | Semua gambar teknik | ISO 128-2 | 2022 [D] | ya |
| SUMBER Panduan Simbol Engineering GSP v1.0 Bab 3. Status: [T] diverifikasi dari situs penerbit 7 Oktober 2026 · [S] sumber sekunder · [D] dari tabel DATUM §09 · [K] pengetahuan umum. |  |  |  |  |

## T081 — 5Lengkapi lembar gambar: legenda, penandaan komponen, label setiap garis berisi apa yang mengalir dan kapasitasnya, sumber, klasifikasi, nomor gambar, dan revis

| Bila ragu Kotak persegi biasa yang diberi nama jelas lebih jujur daripada simbol yang tampak resmi tetapi salah. |
|---|

## T082 — Tabel 10.2   Aturan dialek IEC 60617.

| Aturan | Penjelasan |
|---|---|
| Keluarga sakelar | Semua berbentuk kontak berbilah terbuka; yang membedakan hanya tanda pada kontak: × pemutus daya yang bisa memutus arus gangguan, garis pendek pemisah yang hanya mengisolasi, busur kontaktor yang ditahan kumparan. Salah tanda berarti salah klaim keselamatan. |
| Tidak ada simbol ATS | ATS digambar sebagai kontak pindah ditambah keterangan fungsi kendali. Jangan membuat kotak ATS karangan. |
| UPS, penyearah, konverter | Digambar sebagai blok fungsi bernama penandaannya, bukan simbol khayalan. |
| Penandaan IEC 81346 | Setiap simbol diberi kode =sistem +lokasi -komponen, misalnya =G01+P01-Q1, dan kode itu muncul di BoQ. |
| Sebelum terbit konstruksi | Cocokkan setiap simbol dengan entri basis data IEC 60617. |
| SUMBER Panduan Simbol Engineering GSP v1.0 5.1 · references/09 §3. |  |

## T083 — Tabel 10.3   Aturan dialek ISA-5.1.

| Aturan | Penjelasan |
|---|---|
| Bentuk sama dengan fungsi | Lingkaran instrumen tunggal; lingkaran dalam persegi tampilan atau kendali bersama; segi enam fungsi komputer; belah ketupat dalam persegi PLC. |
| Garis sama dengan lokasi | Tanpa garis di lapangan; satu garis ruang kendali utama; dua garis lokasi bantu; garis putus tak terjangkau operator. |
| Katup | Badan katup ditambah aktuator diafragma, motor, atau solenoid. Badan tanpa aktuator berarti katup manual. |
| Kesalahan paling sering | Garis lokasi dihapus karena dianggap mengganggu, sehingga indikator ruang kendali terbaca sebagai instrumen lapangan. |
| SUMBER Panduan Simbol Engineering GSP v1.0 5.2 · references/09 §4. |  |

## T084 — Tabel 10.4   Aturan legenda rumah keamanan.

| Aturan | Penjelasan |
|---|---|
| Legenda wajib | Setiap gambar yang memakai sec: mencetak legenda di lembar yang sama (lint 34) dengan tulisan bukan simbol standar. |
| Jangan salah rujuk | IEC 62676 dan EN 50132 dikutip untuk DORI dan kualitas gambar, tidak pernah sebagai dasar simbol. |
| Kerucut pandang | Diturunkan dari focal length dan ukuran sensor kamera yang sebenarnya, karena klien bisa mengukurnya dari gambar. |
| Kapan memakai SIA AG-01 | Bila KAK, klien, atau konsultan memakai standar AS. Simbol AG-01 berhak cipta: beli dokumennya. |
| Pemetaan | Setiap simbol sec: dipetakan ke kategori AG-01 setara agar legenda rumah mudah diterjemahkan bila diminta. |
| SUMBER Panduan Simbol Engineering GSP v1.0 5.3 · references/09 §6 · putusan R-09. |  |

## T085 — Tabel 10.5   Aturan dialek militer.

| Aturan | Penjelasan |
|---|---|
| Identitas lewat bentuk | Kawan persegi panjang, lawan belah ketupat, netral bujur sangkar, tak dikenal quatrefoil. Warna hanya penegas. |
| Kawan dan netral | Hanya beda rasio. Bujur sangkar yang sedikit melebar terbaca sebagai kawan, kesalahan afiliasi yang serius. |
| Eselon | Ditulis di atas bingkai (\| kompi, \|\| batalyon, X brigade, XX divisi), bukan dengan mengubah bingkai. |
| Kode resmi | Untuk sistem C2, pakai kode simbol SIDC dari dokumen standar; jangan menggambar ikon fungsi dengan perkiraan. |
| SUMBER Panduan Simbol Engineering GSP v1.0 5.5 · references/09 §5. |  |

## T086 — Tabel 10.6   Aturan notasi proses dan arsitektur.

| Notasi | Aturan |
|---|---|
| ISO 5807 | Terminator satu-satunya bentuk bersudut bulat. Setiap keluaran keputusan berlabel. Satu arah baca; panah balik hanya untuk pengulangan. Kira-kira 10 langkah per gambar, lebih dari itu pecah menjadi sub-proses. |
| BPMN 2.0.2 | Lingkaran tipis mulai, ganda antara, tebal akhir. Gerbang × eksklusif, + paralel, ○ inklusif. Aliran urutan garis penuh di dalam pool; aliran pesan putus-putus antar-pool. Satu lajur satu peran. |
| DFD | Entitas eksternal, proses bernomor, simpanan data bernomor (D1), aliran data selalu bernama. |
| UML 2.5.1 | Pilih jenis diagram sesuai pertanyaan: struktur (kelas, komponen) atau perilaku (sekuens, aktivitas). |
| Model C4 | Empat tingkat: Konteks, Kontainer, Komponen, Kode. Tiap kotak: nama, jenis, deskripsi; tiap panah berlabel. Untuk proposal, tingkat Konteks dan Kontainer biasanya cukup. |
| ArchiMate 4 | Terbit April 2026; konsep turun dari kira-kira 60 menjadi 42, lapis disebut domain. Domain SPBE cocok dipetakan ke ArchiMate (penilaian penyusun). Tulis versinya di gambar, karena 3.2 dan 4 berbeda. |
| SUMBER Panduan Simbol Engineering GSP v1.0 5.6 sampai 5.9. |  |

## T087 — 10.5   Penandaan acuan IEC 81346

| Penandaan acuan mengikuti IEC 81346-1: tanda = untuk fungsi, + untuk lokasi, - untuk produk, : untuk terminal. Pada spesimen, =UPK+PP-Q1 terbaca sistem UPK, lokasi panel PP, komponen Q1, pemutus pengumpan. Karena penandaan yang sama muncul di baris BoQ dan uji terima, satu simbol bisa dilacak ke harganya dan ke kriteria lulusnya. |  | ■ TERUKUR REF 09 §8 SM-07 |
|---|---|---|

## T088 — Tabel 10.7   Aturan lembar gambar.

| Unsur lembar | Aturan |
|---|---|
| Blok judul | Judul satu kalimat, nomor gambar, revisi, tanggal, skala atau tanpa skala, pembuat, pemeriksa, klasifikasi. |
| Legenda | Wajib bila ada simbol non-standar, dianjurkan selalu ada; berupa baris keterangan, bukan kotak hiasan. |
| Satu dialek | Satu gambar satu dialek; DATUM menolak campuran (lint 35). |
| Label | Setiap simbol bernama; setiap garis menyebut apa yang mengalir dan kapasitasnya. |
| Penandaan | Komponen fisik memakai kode IEC 81346 yang sama dengan BoQ dan uji terima. |
| Ukuran huruf | Minimum 5,5 pt agar terbaca setelah dicetak dan difotokopi (lint 28). |
| Warna | Hanya penegas; gambar tetap terbaca hitam-putih. |
| Revisi dan sumber | Setiap perubahan menaikkan revisi dan dicatat; dokumen dasar ditulis di bawah gambar. |
| SUMBER Panduan Simbol Engineering GSP v1.0 Bab 7. Blok judul ISO 7200 untuk lembar A3 masih usulan P-05. |  |

## T089 — Tabel 10.8   Sepuluh kesalahan simbol yang paling sering.

| Kesalahan | Akibat | Perbaikan |
|---|---|---|
| Membuat simbol ATS, UPS, atau radar sendiri yang tampak resmi | Klaim kepatuhan standar yang tidak benar | Simbol standar atau kotak bernama |
| Mengutip ISA-5.1-2009 atau 2022, atau ISO 128-2:2020 | Terlihat tertinggal | Kutip edisi pada Tabel 10.1 |
| Mencampur flowchart dan BPMN | Belah ketupat bermakna ganda | Satu dialek per gambar |
| Ikon vendor diubah warna atau bentuknya | Melanggar ketentuan vendor | Pakai apa adanya atau ikon generik |
| Pemisah digambar sebagai pemutus daya | Klaim keselamatan salah | Periksa tanda pada kontak |
| Bingkai netral terlalu lebar | Terbaca sebagai kawan | Pakai pustaka DATUM; jangan ubah rasio |
| Garis tanpa label | Pembaca menebak isi aliran | Label setiap garis |
| Legenda rumah tanpa legenda | Simbol tidak terbaca | Cetak legenda di lembar yang sama |
| Kerucut pandang dikira-kira | Cakupan berbeda dengan kenyataan | Hitung dari focal length dan sensor |
| Simbol berbayar disalin dari internet | Risiko hak cipta dan versi lama | Beli dokumen standarnya |
| SUMBER Panduan Simbol Engineering GSP v1.0 Bab 8. |  |  |

## T090 — Tabel 10.8   Sepuluh kesalahan simbol yang paling sering.

| KLASIFIKASI · TERBATAS | SALINAN INDUK · PENGGUNAAN INTERNAL GSP |
|---|---|

## T091 — Enam puluh delapan aturan gaya bahasa ahli dalam tujuh lapis, dari orientasi pembaca sampai pemeriksaan mesin dan juri: bagaimana kata dipilih dan kalimat disus

| Bab 11 | Gaya Bahasa Ahli: Tujuh Lapis |
|---|---|
| Bab 12 | Lapis L0 sampai L2: Orientasi, Arsitektur, Paragraf |
| Bab 13 | Lapis L3 sampai L5: Kalimat, Kata, Suara |
| Bab 14 | Lapis L6: Mesin Periksa dan Penilai |

## T092 — 11.1   Apa yang diatur dan mengapa

| Standar Gaya Bahasa Ahli (STD-GAYA-AHLI-001) memuat 68 aturan yang mengatur tulisan GSP dari tingkat paling besar, bagaimana pembaca disambut di halaman pertama, sampai tingkat paling halus, kata mana yang boleh hidup dan angka mana yang tidak boleh berdiri sendiri. Aturannya disusun dari pemeriksaan sembilan korpus keluaran kerja terhadap acuan tulisan manusia, sehingga setiap butir punya bukti tulisan nyata, bukan selera. |  | ■ TERUKUR STD-GAYA-AHLI-001 REV G |
|---|---|---|

## T093 — Tabel 11.1   Tujuh lapis gaya bahasa, cakupan, dan rumahnya di manual ini.

| Lapis | Nama | Mengatur | Aturan | Rumah |
|---|---|---|---|---|
| L0 | Orientasi Pembaca | menit pertama orang yang memegang dokumen: apa yang ia pegang, untuk siapa, dan apa yang terjadi setelah membaca | 5 | Bab 12.1 |
| L1 | Arsitektur Dokumen | susunan: apa diletakkan di depan, di mana angka hidup, gagasan mana menempati rumah mana | 10 | Bab 12.2 |
| L2 | Paragraf | unit baca menengah: apa yang boleh dilakukan sebuah paragraf dan berapa beban yang boleh dipikulnya | 9 | Bab 12.3 |
| L3 | Kalimat | bangun kalimat: bagaimana norma dikutip, keputusan ditetapkan, angka didampingi, dan ritme dijaga | 9 | Bab 13.1 |
| L4 | Kata dan Identifier | kosakata dan nama: pelaku keputusan, kode yang boleh keluar dari jalur data, istilah Inggris, konvensi nilai | 10 | Bab 13.2 |
| L5 | Suara Ahli | sikap penulis di hadapan pembaca: kelas asal klaim, batasan yang diakui, pengacaraan institusional | 9 | Bab 13.3 |
| L6 | Mesin Periksa dan Penilai | pemeriksaan mesin dan manusia yang menutup celah enam lapis sebelumnya | 16 | Bab 14 |
| SUMBER STD-GAYA-AHLI-001 rev G, edisi pembaca v1.3 D.4. Jumlah aturan dihitung dari pernyataan yang diekstrak. PROVENANS ◈ DITURUNKAN. |  |  |  |  |

## T094 — Tabel 11.2   Peta keluhan: gejala yang paling sering terdengar dan aturan yang menambalnya.

| Keluhan pembaca | Aturan penambal utama | Penegak | Hasil bila dijalankan |
|---|---|---|---|
| Bertele-tele: gagasan berputar, kesimpulan ditunda, medium salah | SG-L3-08, L3-09, L1-09, L1-10, L0-03, L1-04, L2-09 | Pemindai C-26, C-27, C-14, C-24; juri | Satu gagasan satu rumah; nol temuan pada keempat check |
| Terasa seperti mesin: ritme seragam, sikap kosong, aparatus bocor | SG-L4-03, L6-03, L6-05, L6-12, L3-08, L5-01 sampai L5-09, L2-01, L4-08 | Pemindai; rubrik tiga dimensi | Nol pelanggaran absolut; sapaan institusional hadir |
| Susunan konteks kacau: urutan seksi, asumsi pengetahuan, kohesi | SG-L1-01 sampai L1-03, L0-05, L2-05, L1-09, L2-01, L1-04, L3-05, L5-01 | Perencanaan manusia; juri dimensi 3 | Identitas di muka, peta urutan terbaca, angka di strukturnya |
| Kosakata terasa mesin | SG-L4-01 sampai L4-10, glosarium kendali | Pemindai leksikon; manusia | Identifier pindah ke tabel; nol kata daftar hitam |
| SUMBER STD-GAYA-AHLI-001 rev G, edisi pembaca v1.3 D.4, Tabel 3. |  |  |  |

## T095 — Tabel 11.3   Aturan Gaya Ahli yang bertemu aturan DATUM.

| Pokok | Gaya Ahli | DATUM | Bentuk bersama |
|---|---|---|---|
| Angka dan provenans | SG-L3-05, L6-13 | DT-21, DT-22 | Tanda sekali per klausa di prosa; sisanya di rel bukti dan baris tabel |
| Angka tinggal di struktur | SG-L1-04 | DT-23 | Register kuantitas mengisi tabel; prosa membaca dampak |
| Judul sebagai klaim | SG-L2-01 | DT-41, CH-05 | Headline slide dan caption chart berupa kesimpulan |
| Artefak dipanggil | SG-L2-06 | DT-15 | Setiap tabel dan gambar punya caption, SUMBER, dan panggilan di prosa |
| Kosakata identifier | SG-L4-03, L6-12 | DT-12 | Tanpa snake_case di prosa dan tanpa garis bawah di nama |
| Konvensi nilai | SG-L4-05, L4-06 | DT-30, DT-31 | Numeral Indonesia, satuan berspasi, terbilang, satu varian per berkas |
| Pertanyaan | SG-L1-10 | DT-38 | Pertanyaan pembalik boleh di badan, tidak pernah sebagai judul |
| Tanda pisah panjang | SG-L3-09 | DT-38 | Maks. tiga per 1.000 kata dan nol di judul; titik-koma maks. 5,4 per 1.000 kata |
| SUMBER Disusun penyusun dari kedua standar. PROVENANS ◈ DITURUNKAN. |  |  |  |

## T096 — Tabel 12.1   Lima aturan lapis L0, orientasi pembaca.

| Nomor | Judul dan pernyataan, dikutip apa adanya | Cara pakai | Penegak |
|---|---|---|---|
| SG-L0-01 | Dokumen menyatakan identitasnya sendiri di muka. Dokumen panjang dibuka dengan pernyataan identitas dirinya (apa, siapa penyusun, kebutuhan apa yang melahirkannya) sebelum masuk materi. | Paragraf pertama menjawab tiga hal berurutan: jenis dokumen, penyusun, kebutuhan nyata yang melahirkannya. | Juri rubrik; daftar periksa lembar kendali |
| SG-L0-02 | Jangkar konkret sebelum abstraksi. Pembuka menjangkarkan pembaca pada skala konkret (instrumen dan tanggal, jumlah unit, konsekuensi dunia nyata), bukan latar generik atau kata sifat. | Pilih satu jangkar terukur (nomor peraturan dan tanggalnya, jumlah unit, konsekuensi bernama) dan pasang di kalimat awal. | Juri, dimensi kejelasan |
| SG-L0-03 | Penutup menyebut aksi dan penerimanya. Penutup dokumen kerja menyebut keputusan atau aksi yang diminta beserta penerimanya, bukan ringkasan isi. | Kalimat terakhir memakai verba permintaan atau penyerahan ditambah pihak yang memutuskan. Periksa lagi setelah memangkas halaman. | Daftar periksa pra-kirim; juri |
| SG-L0-04 | Rekap kebutuhan pembaca dengan istilah pembaca. Sebelum menawarkan sesuatu, penulis merekap kebutuhan pembaca dengan istilah pembaca sendiri, lalu berbicara dari titik itu; rekap bukan basa-basi penunda isi. | Rumuskan ulang masalah lawan bicara dengan kata-kata mereka dalam satu sampai dua kalimat, lalu sambungkan ke tawaran. | Juri, dimensi 1 dan 3 |
| SG-L0-05 | Urutan pembuka ditetapkan per kanal di muka. Penulis menetapkan di muka apa yang dijelaskan dan apa yang dianggap diketahui pembaca sasaran, termasuk urutan pembuka per kanal (jawaban lebih dulu untuk kanal keputusan; dasar hukum lebih dulu untuk naskah dinas), tanpa merata-ratakan genre. | Sebelum menulis, buat dua kolom: yang dijelaskan dan yang dianggap diketahui. Tetapkan urutan pembuka per kanal dan simpan bersama rencana. | Manusia saat perencanaan; juri |
| SUMBER STD-GAYA-AHLI-001 rev G, edisi pembaca v1.3. Pernyataan dikutip verbatim karena standar induk melarang parafrase; cara pakai diringkas penyusun. PROVENANS ■ TERUKUR. |  |  |  |

## T097 — Tabel 12.2   Contoh salah dan benar lapis L0.

| Aturan | Salah, salinan nyata | Benar, salinan nyata |
|---|---|---|
| SG-L0-01 | MISI DATMANUAL-1004 \| F9-P16 \| Role: gsp-document-writer (lane pekerja). Bagian I dari tiga bagian manual final | Dokumen ini adalah Proposal Teknis & RAB yang disusun oleh tim engineering PT GSP berdasarkan analisis komprehensif kebutuhan Undang-Undang Nomor 20 Tahun 2025 ... Pasal 30 |
| SG-L0-02 | Seksi ini mencatat riwayat lima revisi secara berantai: revisi A direkam 24 September 2026 pukul 09:01:33 WIB | Dengan total 10.063 ruang pemeriksaan yang tersebar dari Sabang hingga Merauke |
| SG-L0-03 | selesai: celah 55/28; register GAP-01..GAP-19 (Block 2, Major 10, Minor 7) | Please therefore let us know whether you envisage testing one geofence or several geofences, and the approximate radius required for each. |
| SUMBER STD-GAYA-AHLI-001 rev G, edisi pembaca v1.3, bukti pada Lampiran L.A standar induk. Kutipan dipangkas dengan elipsis; ejaan sumber dipertahankan. |  |  |

## T098 — Tabel 12.2   Contoh salah dan benar lapis L0.

| Tiga cek tercepat sebelum mengirim, lapis L0 1. Halaman pertama menyebut jenis dokumen, penyusun, dan kebutuhan pemicu, dengan minimal satu jangkar terukur. 2. Kalimat terakhir menyebut aksi dan penerima yang berhak memutuskan. 3. Urutan pembuka cocok dengan kanal sasaran hari ini, bukan warisan templat lain. |
|---|

## T099 — Tabel 12.3   Sepuluh aturan lapis L1, arsitektur dokumen.

| Nomor | Judul dan pernyataan, dikutip apa adanya | Cara pakai | Penegak |
|---|---|---|---|
| SG-L1-01 | Payung otoritas sebelum konten teknis. Payung otoritas (dasar hukum, tanggung jawab, atau disclaimer pembatas klaim) diletakkan sebelum konten teknis pada dokumen yang bentuknya mengikat urutan. | Pada naskah dinas, proposal mengikat, atau lembar data, dasar hukum dan pembatas klaim mendahului tabel teknis pertama. | Audit urutan seksi; juri |
| SG-L1-02 | Unit panjang dibuka dengan taruhannya. Unit panjang dibuka dengan taruhannya (keperluan dunia nyata, skala, atau mode kegagalan); definisi formal menyusul setelah pembaca merasakan kebutuhannya. | Kalimat pertama bab memuat keperluan, skala, atau mode kegagalan. Definisi kamus dan riwayat menyusul. | Juri, dimensi 1 |
| SG-L1-03 | Peta urutan dinyatakan eksplisit. Peta urutan (apa dicakup, di bagian apa, apa tidak) dinyatakan eksplisit dalam beberapa kalimat pertama, bukan dibiarkan ditebak dari Daftar Isi. | Nyatakan cakupan per bagian dan apa yang tidak dicakup dalam beberapa kalimat pertama, dengan alamat bagian. | Juri; cek peta saat perencanaan |
| SG-L1-04 | Angka tinggal di struktur, prosa membaca dampak. Angka konfigurasi hidup di struktur terpisah (tabel, sheet, lampiran) yang dipanggil dengan rujukan eksplisit; prosa hanya mengklaim dan membaca dampak. | Konfigurasi lebih dari tiga pasangan nama dan nilai pindah ke tabel; prosa memanggil "sebagaimana Tabel X" lalu membaca dampaknya. | Pemindai C-31; manusia |
| SG-L1-05 | Definisi kerja punya label cakupan dan pemilik. Definisi kerja datang dengan label cakupan dan provenance ("untuk keperluan dokumen ini...", padanan Indonesia + asli dalam kurung), bukan sebagai kebenaran tanpa pemilik. | Istilah ciptaan dokumen diberi pembatas "untuk keperluan dokumen ini" dan padanan asal dalam kurung pada kemunculan pertama. | Juri, dimensi 2 |
| SG-L1-06 | Kebutuhan ukur dulu, rumus menyusul, contoh menempel. Rumus dan derivasi muncul setelah kebutuhan ukurnya dibangun lewat pertanyaan; contoh terhitung menyusul satu-dua paragraf sesudahnya. | Tulis kalimat kebutuhan atau pertanyaan ukur sebelum persamaan pertama; contoh terhitung menyusul satu sampai dua paragraf. | Audit struktur bab hitungan |
| SG-L1-07 | Anatomi pesan pendek: satu usul yang bisa dijawab ya atau tidak. Surat dan e-mail pendek memakai anatomi sapaan-inti-satu usul konkret yang bisa di-yes/no-sign-off; permintaan aksi tidak dibundel lebih dari satu butir. | Sapaan, inti satu kalimat, tepat satu usul yang bisa dijawab ya atau tidak, plus jalan balik tanpa butir baru. | Manusia; juri |
| SG-L1-08 | Penutup unit panjang: batas berlaku atau nilai profesi. Unit panjang ditutup dengan batas berlaku atau nilai profesi, bukan rangkuman yang mengulang isi. | Tutup bab dengan kondisi berlaku, batasan, atau implikasi nilai. Bila kalimat terakhir mengulang kalimat pertama, ganti. | Juri, dimensi 1 |
| SG-L1-09 | Satu gagasan satu rumah. Setiap gagasan punya satu rumah di dokumen: perluasan dinyatakan sebagai rujukan silang, bukan ditulis ulang di seksi lain. | Nyatakan setiap gagasan penuh sekali; penyebutan berikutnya berupa nomor seksi. Buat peta gagasan saat perencanaan. | Pemindai C-14; manusia |
| SG-L1-10 | Momen pembalik di badan dokumen. Dokumen bersistem bab dan proposal tebal menempatkan momen pembalik (temuan kunci, keputusan penentu) di badan dokumen, bukan hanya di ujung. | Setelah seperempat awal dan sebelum seperempat akhir, tempatkan satu temuan kunci atau keputusan penentu dengan suara yang diangkat. | Pemindai C-24; juri |
| SUMBER STD-GAYA-AHLI-001 rev G, edisi pembaca v1.3. Pernyataan dikutip verbatim karena standar induk melarang parafrase; cara pakai diringkas penyusun. PROVENANS ■ TERUKUR. |  |  |  |

## T100 — Tabel 12.4   Contoh salah dan benar lapis L1.

| Aturan | Salah, salinan nyata | Benar, salinan nyata |
|---|---|---|
| SG-L1-01 | Kepala "Keputusan rancangan" menempati nomor 1.1, sedangkan "Dasar Rancangan dan Persyaratan" baru datang di nomor berikutnya. | PoE budget calculations are based on laboratory testing. Actual PoE power budget is not guaranteed and will vary ... |
| SG-L1-04 | Daftar belanja tiga belas item dipaksa menjadi satu kalimat 439 kata dengan 41 tanda pemisah. | Rincian Anggaran dan Biaya (RAB) telah disusun sebagaimana terlampir |
| SG-L1-07 | Meminta konfirmasi tanpa opsi konkret, sehingga pembaca harus memformulasikan ulang jadwal. | I am available on Thursday and Friday. Please send a meeting link. Feel free to propose another timing if this doesn't work for you. |
| SG-L1-10 | 5.3 Penampang kabel dan susut tegangan (klimaks teknis disimpan di balik kepala seksi datar) | baris itulah yang memutuskan SM vs MM di awal setiap pekerjaan dan ia satu-satunya angka di baris itu |
| SUMBER STD-GAYA-AHLI-001 rev G, edisi pembaca v1.3, bukti pada Lampiran L.A standar induk. Kutipan dipangkas dengan elipsis; ejaan sumber dipertahankan. |  |  |

## T101 — Tabel 12.4   Contoh salah dan benar lapis L1.

| Tiga cek tercepat sebelum badan ditulis, lapis L1 1. Dasar, kewenangan, atau pembatas klaim mendahului isi teknis pada dokumen yang bentuknya mengikat. 2. Setiap konfigurasi lebih dari tiga pasangan nama dan nilai sudah punya tabel atau lampiran yang dipanggil eksplisit. 3. Setiap gagasan punya satu rumah; penyebutan kedua berupa rujukan. |
|---|

## T102 — Tabel 12.5   Sembilan aturan lapis L2, paragraf.

| Nomor | Judul dan pernyataan, dikutip apa adanya | Cara pakai | Penegak |
|---|---|---|---|
| SG-L2-01 | Kalimat pertama langsung ke objek bidang. Kalimat pertama paragraf kerja langsung menyebut objek bidang (instrumen dan tanggal, atau segmen dan fungsinya) tanpa pemanasan retoris; membuka dengan label bentuk dokumen dilarang. | Subjek kalimat pembuka paragraf adalah benda atau keputusan, bukan "Berikut ini", label bentuk, atau status proses. | Pemindai C-29 INFO; juri |
| SG-L2-02 | Fakta negatif disusun, lalu ditutup klausa konsekuensi. Paragraf masalah menyusun fakta negatif sebagai enumerasi lalu menutupnya dengan satu klausa vonis konsekuensi. | Fakta negatif sebagai enumerasi polos tanpa kata sifat emotif, ditutup satu klausa akibat yang menunjuk keputusan. | Juri, dimensi 2 |
| SG-L2-03 | Kata sifat ditempel angka, atau tidak dipakai. Kata sifat kualitatif pada klaim tujuan ditempel satu angka pengukur; tanpa angka, kata sifatnya tidak dipakai (yang ditagih angkanya, bukan katanya dihapus). | Setiap kata sifat pada klaim tujuan ditempel angka, toleransi, atau norma pembanding. Angkanya yang ditagih, bukan katanya dihapus. | Juri; manusia |
| SG-L2-04 | Janji jumlah ditepati di medium yang dijanjikan. Enumerasi diumumkan jumlahnya lalu ditepati isinya pada medium yang dijanjikan; urutan panjang hidup dalam struktur bernomor, bukan dalam prosa berordinal "Pertama, Kedua,". | Umumkan jumlah, sajikan sebagai struktur bernomor bila lebih dari tiga, cacah ulang janji terhadap isi sebelum mengirim. | Manusia; pemindai bantu |
| SG-L2-05 | Objek dulu, label menyusul. Benda atau skenario konkret didahulukan, nama istilahnya menyusul dengan penanda konvensi; pembaca melihat objek dulu, label kemudian. | Perlihatkan benda atau skenario dalam satu sampai dua kalimat, baru perkenalkan istilahnya dengan "disebut" atau kurung. | Juri, dimensi 1 |
| SG-L2-06 | Artefak visual dipanggil dan dibicarakan. Gambar, tabel, dan persamaan bernomor dipanggil dan dibicarakan dalam kalimat; tidak ada artefak visual yatim. | Hitung artefak bernomor dan cari panggilannya di prosa; artefak yatim dipanggil atau dihapus. | Pemindai C-21; manusia |
| SG-L2-07 | Kelebihan dan kerugian dipasang bersebelahan. Kelebihan dan kerugian pilihan yang sama dipasang bersebelahan dalam satu gerak, bukan dijauhkan agar kritik tidak terlihat. | Letakkan keunggulan dan pertukaran setiap pilihan dalam kalimat atau blok yang sama. | Juri, dimensi 2 |
| SG-L2-08 | Zona abu-abu dibuka, lalu satu angka kerja ditetapkan. Zona abu-abu dibahas terbuka (sengketa istilah, lanskap standar berbeda), lalu satu definisi atau angka kerja ditetapkan untuk dipakai bersama. | Akui variasi konvensi satu sampai dua kalimat, lalu tetapkan satu definisi atau angka kerja beserta cakupannya. | Juri; manusia |
| SG-L2-09 | Satu paragraf satu tugas; lebih pindah medium. Satu paragraf kerja satu tugas; materi yang melewati daya tampung pindah medium (tabel/lampiran), bukan dibiarkan menjadi paragraf raksasa; paragraf satu kalimat sah sebagai pivot ritme setelah analisis panjang. | Satu paragraf satu klaim, langkah, atau objek. Plafon bantu 150 kata; lewati plafon berarti pecah atau pindah ke tabel. | Pemindai cacah paragraf; juri |
| SUMBER STD-GAYA-AHLI-001 rev G, edisi pembaca v1.3. Pernyataan dikutip verbatim karena standar induk melarang parafrase; cara pakai diringkas penyusun. PROVENANS ■ TERUKUR. |  |  |  |

## T103 — Tabel 12.6   Densitas pemisah sebelum dan sesudah perbaikan satu seksi, per 1.000 kata prosa.

| Ukuran, satuan pada baris | Sebelum | Sesudah | Acuan |
|---|---|---|---|
| Titik-koma per 1.000 kata prosa | 53,7 | 0,0 | Langit-langit tulisan manusia 5,4; korpus mesin 33,2 |
| Maksimum kata satu kalimat | 61 | 32 | Target ritme Bab 13 |
| Porsi kalimat berantai | 40 % | 13,3 % | Ambang pemeriksaan C-26 |
| SUMBER STD-GAYA-AHLI-001 rev G, edisi pembaca v1.3 Bab 3, Tabel 5. PROVENANS ◈ DITURUNKAN oleh alat pemecah kalimat standar induk. |  |  |  |

## T104 — Tabel 12.7   Contoh salah dan benar lapis L2.

| Aturan | Salah, salinan nyata | Benar, salinan nyata |
|---|---|---|
| SG-L2-01 | selesai: 179 aturan DAT + 68 WB terdaftar (cetakan M02: 247 aturan) | The UG-I500-H16 is specifically designed for general medium and small-scale campus scenarios. |
| SG-L2-02 | Register perubahan revisi memuat 96 butir terhitung mesin, naik dari 49 butir pada run-D ... | Rekaman yang ada tidak terenkripsi, tidak memiliki mekanisme verifikasi integritas ... sehingga mengancam keberhasilan penuntutan |
| SG-L2-03 | Register kelengkapan menjaga kejujuran tabel utama (klaim tanpa angka pengukur) | scalable, aman, dan dapat diandalkan dengan ketersediaan 99,999 % |
| SG-L2-09 | Satu paragraf 283 kata dengan 33 koma memadatkan empat lapis arsitektur beserta angka masing-masing. | Materi melewati daya tampung dipindah ke lampiran dengan rujukan. |
| SUMBER STD-GAYA-AHLI-001 rev G, edisi pembaca v1.3, bukti pada Lampiran L.A standar induk. Kutipan dipangkas dengan elipsis; ejaan sumber dipertahankan. |  |  |

## T105 — Tabel 12.7   Contoh salah dan benar lapis L2.

| Tiga cek paragraf tercepat, lapis L2 1. Subjek kalimat pertama setiap paragraf adalah objek bidang atau keputusan. 2. Paragraf masalah berupa enumerasi fakta polos yang ditutup satu klausa konsekuensi. 3. Tidak ada paragraf di atas plafon 150 kata; konfigurasi panjang sudah di tabel. |
|---|

## T106 — Tabel 13.1   Sembilan aturan lapis L3, kalimat.

| Nomor | Judul dan pernyataan, dikutip apa adanya | Cara pakai | Penegak |
|---|---|---|---|
| SG-L3-01 | Norma dikutip literal, bukan diparafrase. Klaim normatif dikutip literal dengan verba pelapor dan nomor pasal, bukan diparafrase, karena kekuatan klaim ada pada teks sumbernya. | Nomor pasal, verba pelapor (mewajibkan, menetapkan), lalu teks norma utuh dalam tanda kutip. Elipsis jujur bila diringkas. | Tinjau silang kutipan; juri |
| SG-L3-02 | Keputusan ditulis sebagai tetapan, alasan menyusul, penangkis pada napas yang sama. Keputusan teknis ditulis sebagai tetapan, lalu alasan, lalu (bila kontroversial) rujukan eksternal penangkis pada napas yang sama. | Mulai dengan nilai dan statusnya, ikuti alasan operasional, tutup dengan pembanding bernama bila posisi bisa dibantah. | Juri, aparatus keputusan |
| SG-L3-03 | Larangan dan aturan pakai membawa sebabnya dalam kalimat yang sama. Larangan, pengecualian, dan aturan pakai selalu membawa sebab atau kondisi berlakunya dalam kalimat yang sama; perintah telanjang tanpa alasan tidak dipakai. | Tempelkan klausa "karena" atau "bila" pada setiap larangan dan pengecualian di prosa. | Juri; audit perintah telanjang |
| SG-L3-04 | Koreksi miskonsepsi memakai kontras eksplisit, per kejadian. Bila miskonsepsi pembaca adalah lawannya, koreksi ditulis dengan kontras eksplisit "bukan X, melainkan Y"; dipakai per kejadian koreksi, bukan sebagai kuota retoris. | Pakai "bukan X, melainkan Y" hanya bila X benar-benar diyakini pembaca; paling banyak sekali per momen koreksi. | Juri |
| SG-L3-05 | Angka tidak pernah telanjang; mark provenans sekali per klausa. Angka tidak pernah telanjang: pembanding, basis, konversi satuan, atau sumbernya duduk dalam tarikan napas yang sama; mark provenans melekat baris atau klausa fakta, bukan diulang pada tiap penyebutan ulang angka yang sama. | Setiap numeral beban keputusan membawa pembanding, basis, konversi, atau sumber dalam klausa yang sama; tanda sekali per klausa. | Manusia; pemindai C-31 |
| SG-L3-06 | Permintaan dibuat mudah dijawab. Permintaan dibuat mudah dijawab: opsi dalam kurung, rentang waktu konkret, atau daftar field yang dibutuhkan, bukan pertanyaan terbuka tanpa batas. | Tutup pertanyaan terbuka dengan opsi berkurung, tanggal dan jam berzona, atau daftar field yang disebut namanya. | Manusia; juri |
| SG-L3-07 | Ambang terima satu kalimat: angka, kondisi, aksi. Ambang terima ditulis satu kalimat berisi angka + kondisi + aksi, tanpa imbauan lembut. | Satu kalimat: angka, kondisi ukur, aksi yang terpicu, dan alat ukurnya. Kriteria belum terkalibrasi diakui dengan tanggal kalibrasi. | Manusia; juri |
| SG-L3-08 | Ritme adalah selang panjang-pendek, bukan seragam satu kutub. Ritme tulisan adalah selang panjang-pendek: rangkaian kalimat panjang ditutup kalimat verdict pendek; seragam di salah satu kutub (selalu gemuk atau selalu potong) adalah cacat yang sama. | Variasikan panjang dengan sengaja; tutup rangkaian kalimat berat dengan satu kalimat pendek. Periksa sebaran, bukan hanya rata-rata. | Pemindai sebaran; juri |
| SG-L3-09 | Setiap kalimat punya subjek dan predikat; rantai fragmen titik-koma dilarang. Setiap kalimat punya subjek dan predikat; rantai fragmen tanpa predikat yang dirangkai titik-koma dilarang, dan satu kata sehingga per kalimat dengan kalimat baru untuk konsekuensi. | Beri setiap kalimat predikat. Titik-koma hanya di antara klausa setara yang berpredikat. "Sehingga" kedua menjadi kalimat baru. | Pemindai C-26; manusia |
| SUMBER STD-GAYA-AHLI-001 rev G, edisi pembaca v1.3. Pernyataan dikutip verbatim karena standar induk melarang parafrase; cara pakai diringkas penyusun. PROVENANS ■ TERUKUR. |  |  |  |

## T107 — Tabel 13.2   Ritme satu surat niaga sebelum dan sesudah penataan kalimat.

| Metrik | Sebelum | Sesudah | Satuan |
|---|---|---|---|
| Kata badan surat | 166 | 163 | kata |
| Jumlah kalimat prosa | 5 | 9 | kalimat |
| Rata-rata kata per kalimat | 33,2 | 18,1 | kata |
| Kalimat terpanjang | 86 | 32 | kata |
| SUMBER STD-GAYA-AHLI-001 rev G, edisi pembaca v1.3 Bab 4, Tabel 6. Hanya anatomi kalimat yang berubah; tidak ada fakta yang bergeser. Median tulisan manusia 23,65 kata (diagnostik). |  |  |  |

## T108 — Tabel 13.3   Contoh salah dan benar lapis L3.

| Aturan | Salah, salinan nyata | Benar, salinan nyata |
|---|---|---|
| SG-L3-01 | Format penamaan dokumen mengikuti aturan internal yang konsisten | Pasal 30 Ayat (1) secara eksplisit mewajibkan "Pemeriksaan terhadap seseorang yang disangka melakukan tindak pidana direkam ..." |
| SG-L3-03 | Satu aksen jenuh pada pesan; 3-D, bayangan, gradien, ujung bar membulat, bingkai, label berkotak DILARANG | SSD ini didesain untuk penggunaan pada beban kerja komputer desktop dan notebook, tidak ditujukan untuk lingkungan Server. |
| SG-L3-07 | Daun yang sedang dipakai sebaiknya dibuka seksi contohnya sekali ... | A DAR ratio below 1.25 is cause for investigation and possible repair of the electrical apparatus. |
| SG-L3-09 | ISA: the bubble is a two-axis code, shape for the function and the horizontal line for the location; dropping the line ... | Beban laten udara luar adalah komponen terbesar. Nilainya 17.443 W, sehingga rasio kalor sensibel ruang hanya 0,65. |
| SUMBER STD-GAYA-AHLI-001 rev G, edisi pembaca v1.3, bukti pada Lampiran L.A standar induk. Kutipan dipangkas dengan elipsis; ejaan sumber dipertahankan. |  |  |

## T109 — Tabel 13.3   Contoh salah dan benar lapis L3.

| Tiga cek tercepat sebelum mengirim, lapis L3 1. Setiap norma dan angka beban keputusan membawa alamatnya dalam klausa yang sama. 2. Setiap permintaan bisa dijawab dengan satu pilihan atau satu daftar field. 3. Kalimat terpanjang di bawah batas napas dan ditutup kalimat pendek yang menegas. |
|---|

## T110 — Tabel 13.4   Sepuluh aturan lapis L4, kata dan identifier.

| Nomor | Judul dan pernyataan, dikutip apa adanya | Cara pakai | Penegak |
|---|---|---|---|
| SG-L4-01 | Pelaku keputusan adalah manusia atau institusi, bukan alat. Verba keputusan memakai pelaku manusia atau institusi yang berwenang; alat tidak menjadi subjek keputusan di luar log mesin. | Verba menetapkan, memutuskan, menerima hanya untuk manusia atau institusi bernama; artefak cukup "memuat". | Pemindai C-28; juri |
| SG-L4-02 | Kapitalisasi penuh sebagai penegas semantik, bukan dekorasi. Kapitalisasi penuh dipakai sebagai penegas semantik pada negasi dan kekekalan aturan (TIDAK, NOT, PERMANENT), bukan sebagai dekorasi atau teriakan umum. | Kapital penuh hanya untuk negasi, kekekalan, atau larangan yang berisiko terlewat, dan jarang. | Manusia, cacah kapital penegas |
| SG-L4-03 | Namespace penulis didefinisikan lalu dipakai disiplin; identifier jalur data pindah ke tabel. Namespace kode privat diciptakan sekali, didefinisikan, lalu dipakai disiplin di seluruh dokumen; identifier pipa data (snake_case skema, enum status mentah) dilarang di prosa dan pindah ke tabel dengan label manusia. | Kode privat didefinisikan sekali lengkap (nama, nilai, satuan, status). Identifier skema hanya hidup di tabel berlabel manusia. | Pemindai C-30; manusia |
| SG-L4-04 | Istilah Inggris utuh tanpa italic dekoratif; padanan lazim jadi kepala. Istilah teknis Inggris dibiarkan utuh tanpa italic dekoratif dan tanpa terjemahan paksa; bila padanan Indonesia lazim, padanan itu jadi kepala dengan asli dalam kurung; putusan italic per kanal dicatat di Decision Log (gesekan EYD vs praktik authored dibawa terbuka, tidak dipilih diam-diam). | Istilah teknis tetap utuh tanpa miring dekoratif; padanan baku jadi kepala dengan asli dalam kurung sekali. Nama produk tidak diterjemahkan. | Leksikon padanan; catatan putusan miring |
| SG-L4-05 | Waktu dianchor ke zona penerima; uang bernilai dipasang terbilang. Waktu selalu dianchor ke zona penerima yang jelas (kota atau offset), dan dokumen bernilai uang memasangkan angka dengan terbilang. | Waktu lintas zona membawa kota atau offset; nilai uang mengikat di naskah dinas membawa terbilang. | Daftar periksa dokumen berharga |
| SG-L4-06 | Satu kelas nilai, satu konvensi per berkas. Satu kelas nilai dieja satu konvensi per dokumen (tanggal, ribuan, persen); variasi gaya boleh antar kanal, tidak boleh dalam satu berkas. | Bekukan satu varian per kelas nilai per berkas: tanggal, ribuan, Rp, persen. Varian lain hanya dalam kutipan berpenanda. | Pemindai C-33 |
| SG-L4-07 | Status keyakinan angka dileksekankan eksplisit. Status keyakinan sebuah angka atau klaim dileksekankan eksplisit (konservatif, indikatif, defensible, mostly, arguably); fakta terverifikasi penuh tidak diberi hedge. | Tempel label status (konservatif, indikatif) atau kelas asal pada angka non-faktual; fakta terverifikasi dinyatakan datar. | Juri, sikap proporsional |
| SG-L4-08 | Konsistensi sempurna adalah jejak mesin; field beban-rilis tetap mutlak. Aturan pemahaman (bukan izin): tekstur manusiawi jangan diseterilkan demi keseragaman, tetapi field beban-rilis tetap tunduk SPK-002. | Saat menyeragamkan, berhenti di batas kelas field: tekstur boleh bertahan, nama, angka, tanggal, tautan, kontak tunduk akurasi mutlak. | Juri, penjaga koreksi berlebih |
| SG-L4-09 | Daftar hitam hanya kelas ber-alasan-bukti; kelas tersangkal dilarang naik. Daftar hitam leksikal hanya berisi kelas ber-alasan-bukti (di mana relatif, kamu di kanal mengikat, verba keputusan berpelaku alat, enum status mentah dan snake_case skema dalam prosa, paragraf dibuka label bentuk dokumen di kanal laporan/proposal, campur gaya angka/tanggal/uang dalam satu berkas); kelas yang tersangkal alat (penguat kosong, nominalisasi, kemubaziran sinonim) dilarang naik jadi daftar hitam; idiom korespondensi EN diatur sebagai konsistensi rumah (satu penutup kanonis), bukan larangan. Aturan dua sisi M-3. | Sebelum menaikkan kata ke daftar larangan, tunjukkan bukti pembeda atau kaidah resmi. Kelas yang tersangkal cukup dipantau. | Leksikon dengan syarat bukti |
| SG-L4-10 | Glosarium kendali adalah pemutus padanan. Glosarium kendali (Lampiran C, salinan kerjanya di bawah) adalah pemutus padanan: nama produk/model/standar dipertahankan apa adanya; istilah berpadanan baku wajib padanan; istilah tanpa padanan mapan dipertahankan dan didefinisikan sekali. | Cocokkan istilah ke glosarium: wajib padanan, pertahankan, atau pertahankan dan definisikan sekali (Lampiran C). | Leksikon padanan; manusia |
| SUMBER STD-GAYA-AHLI-001 rev G, edisi pembaca v1.3. Pernyataan dikutip verbatim karena standar induk melarang parafrase; cara pakai diringkas penyusun. PROVENANS ■ TERUKUR. |  |  |  |

## T111 — Tabel 13.5   Contoh salah dan benar lapis L4.

| Aturan | Salah, salinan nyata | Benar, salinan nyata |
|---|---|---|
| SG-L4-01 | ... inventaris readonly mailbox procurement menetapkan 12 surat ... (alat menyandang verba keputusan) | Adjudikasi final: manusia dengan PDF Hayes Bab 5/9 dan TIA-568. |
| SG-L4-02 | Plex Mono untuk SETIAP numeral, ID, satuan, register, dan rail | Method Edge STT Whisper-medium berjalan lokal di Jetson Orin Nano Super (privacy preserving, raw audio TIDAK meninggalkan Edge). |
| SG-L4-06 | Satu berkas memuat "Rp 75.000 per bulan" dan "Rp832 ribu", 152 tanggal ISO dan 58 format Indonesia. | 3 (satu) Tahun Anggaran ... 36 (dua belas) bulan: pasangan huruf menangkap cacat angka. |
| SG-L4-10 | Artificial Intelligence (AI) mutakhir meliputi Real-Time Automatic Speech Recognition (ASR) | pengenalan bicara otomatis (Automatic Speech Recognition, ASR) |
| SUMBER STD-GAYA-AHLI-001 rev G, edisi pembaca v1.3, bukti pada Lampiran L.A standar induk. Kutipan dipangkas dengan elipsis; ejaan sumber dipertahankan. |  |  |

## T112 — Tabel 13.5   Contoh salah dan benar lapis L4.

| Tiga cek tercepat sebelum mengirim, lapis L4 1. Setiap verba keputusan berpelaku manusia atau institusi bernama. 2. Tidak ada identifier mentah jalur data di paragraf narasi, dan istilah cocok dengan glosarium Lampiran C. 3. Satu kelas nilai satu varian, waktu berzona, uang bernilai berterbilang. |
|---|

## T113 — Tabel 13.6   Sembilan aturan lapis L5, suara ahli.

| Nomor | Judul dan pernyataan, dikutip apa adanya | Cara pakai | Penegak |
|---|---|---|---|
| SG-L5-01 | Klaim beban keputusan menunjukkan kelas asalnya. Setiap klaim beban keputusan menunjukkan kelas asalnya secara terlihat (data institusi, keputusan bersama, estimasi, kutipan, hasil riset pribadi), sehingga otoritas angka dinilai tanpa membaca lampiran. | Sebut kelas asal klaim di badan teks: data institusi, keputusan bersama, estimasi, kutipan, atau riset pribadi. | Juri; manusia |
| SG-L5-02 | Kredensial satu klausa, rekam jejak menggantikan kata sifat. Kredensial disajikan singkat satu klausa (pengalaman spesifik atau jabatan di sign-off); rekam jejak spesifik menggantikan kata sifat promosi. | Identitas penulis cukup satu klausa pengalaman bernama atau jabatan pada blok tanda tangan. Tanpa paragraf pujian diri. | Juri, dimensi 2 |
| SG-L5-03 | Batasan faktual ditutup jalan keluar. Batasan, ketidakmampuan, dan kegagalan masa lalu dinyatakan faktual impersonal, lalu ditutup jalan keluar atau alternatif; tanpa drama, tanpa blaming. Aturan dua sisi M-3. | Nyatakan batasan sebagai fakta impersonal, lalu dalam paragraf yang sama tutup dengan alternatif, langkah, atau jadwal. | Juri, dimensi 1 dan 3 |
| SG-L5-04 | Klaim performa diikat ke norma atau angka pihak ketiga. Klaim performa diukur terhadap norma atau angka pihak ketiga dalam baris yang sama (typical vs ours); tanpa pembanding publik, akuikan tanpa benchmark, jangan ciptakan pembanding karangan. | Pasangkan klaim performa dengan pembanding bernama sebaris; tanpa pembanding publik, akui tanpa benchmark. | Juri; manusia |
| SG-L5-05 | Ketidakpastian dikonversi menjadi instruksi. Ketidakpastian dikonversi menjadi instruksi: fallback bertingkat (tanya sumber resmi, else aturan turunan), angka bulat beralasan simplicity, atau aturan komunikasi bila bahasa pihak berbeda. | Setiap pengakuan ketidakpastian membawa klausa instruksi: aturan default dan alasannya, urutan fallback, atau "tunggu". | Juri, dimensi 1 dan 3 |
| SG-L5-06 | Ketelitian dijustifikasi mode kegagalan. Ketelitian dijustifikasi dengan menyebutkan mode kegagalan: satu fakta, satu konsekuensi, tanpa inventaris risiko yang tidak terhubung ke tindakan. | Dampingi paragraf kehati-hatian dengan satu pasangan fakta dan konsekuensi yang terhubung ke tindakan pembaca. | Juri, dimensi 2 dan 3 |
| SG-L5-07 | Nada mengajar: superlatif diberi rem. Nada ahli mengajar, bukan pamer: superlatif diberi rem ("could be argued", "arguably"); rem Inggris tidak disalin mentah ke Indonesia, penyaringan padanan lewat glosarium kendali. | Pasang syarat berlaku, rujukan perdebatan, atau angka pada klaim evaluatif kuat. Rem Inggris disaring lewat glosarium. | Juri, dimensi 2 |
| SG-L5-08 | Pengacaraan institusional Indonesia, bukan kamu. Kanal surat, proposal, dan laporan klien wajib memakai pengacaraan institusional Indonesia (Kami sebagai sapaan diri, Yth. tanpa Kepada, Bapak/Ibu/Saudara, mohon untuk setara, berkenan ke atasan) dan dilarang memakai kamu. | Kanal resmi berbahasa Indonesia: Yth. tanpa Kepada, Dengan hormat, mohon untuk setara, berkenan ke atasan, kami untuk institusi. | Pemindai C-20 dan C-34; manusia |
| SG-L5-09 | Rumusan M-4: kedalaman dari apparatur, keringkasan dari medium. Rumusan M-4 tercetak verbatim sebagai diktum lapis ini: kedalaman dijamin oleh apparatur bukti (angka bersumber, alasan teknis, batasan diakui, pertukaran eksplisit), bukan jumlah kata; keringkasan dicapai lewat pemindahan medium, bukan penghapusan isi. Aturan dua sisi M-3; rumusan yang sama dipasang sebagai kepala rujukan BAB L1 (manual/bagian-A.md) dan tercetak ulang utuh di Seksi Rujukan Silang bagian ini. | Penuhi semua field aparatus lebih dulu, lalu capai panjang kanal lewat pindah medium, bukan membuang fakta. | Juri, dimensi 2 |
| SUMBER STD-GAYA-AHLI-001 rev G, edisi pembaca v1.3. Pernyataan dikutip verbatim karena standar induk melarang parafrase; cara pakai diringkas penyusun. PROVENANS ■ TERUKUR. |  |  |  |

## T114 — Tabel 13.7   Sistem sapaan kanal resmi berbahasa Indonesia, menurut SG-L5-08.

| Unsur | Bentuk yang dipakai | Tidak dipakai |
|---|---|---|
| Alamat | Yth. Bapak, Ibu, atau Saudara beserta jabatan | Kepada Yth. |
| Salam pembuka | Dengan hormat, | Halo, Hai |
| Diri institusi | kami | saya atas nama lembaga; kita |
| Pembaca | Bapak, Ibu, Saudara; Anda pada manual internal | kamu |
| Permohonan ke setara | mohon | tolong |
| Permohonan ke atasan | berkenan, perkenan | mohon segera |
| Penutup | Atas perhatian Saudara, kami ucapkan terima kasih. | Penutup rangkap, terima kasih berulang |
| SUMBER STD-GAYA-AHLI-001 rev G, edisi pembaca v1.3 SG-L5-08, mengutip kaidah tata naskah dinas resmi. |  |  |

## T115 — Tabel 13.8   Contoh salah dan benar lapis L5.

| Aturan | Salah, salinan nyata | Benar, salinan nyata |
|---|---|---|
| SG-L5-01 | Register perubahan revisi memuat 96 butir terhitung mesin (kelas asal hanya "terhitung mesin") | P-A04 Ruang per Bareskrim HQ 50 ruang, Direksi GSP + arsitek Bareskrim (keputusan bersama sebaris dengan angka) |
| SG-L5-03 | empat belas field secara jujur berlabel tidak disebutkan dalam surat (berhenti di label, tanpa rute penutup) | The agreement was under review by Eka but was not executed, and communication ceased. (ditutup pertanyaan langkah berikutnya) |
| SG-L5-05 | transisi status dari TIDAK JELAS menjadi BELUM MULAI (ketidakpastian dikonversi menjadi label lain) | you must either educate whoever is wrong or opt to communicate with each party using its own language. |
| SG-L5-08 | mampukah kamu menyebut seseorang di luar divisi yang akan membacanya? | Atas perhatian Saudara, kami ucapkan terima kasih. |
| SUMBER STD-GAYA-AHLI-001 rev G, edisi pembaca v1.3, bukti pada Lampiran L.A standar induk. Kutipan dipangkas dengan elipsis; ejaan sumber dipertahankan. |  |  |

## T116 — Tabel 13.8   Contoh salah dan benar lapis L5.

| Tiga cek tercepat sebelum mengirim, lapis L5 1. Setiap klaim beban keputusan menyebut kelas asalnya di badan teks. 2. Setiap batasan dan ketidakpastian ditutup jalan keluar atau instruksi. 3. Kanal Indonesia memakai kami, Yth., dan jenjang mohon atau berkenan, dengan nol kamu pada alamat mengikat. |
|---|

## T117 — Lapis sebelumnya mengatur apa yang ditulis, sedangkan lapis ini mengatur bagaimana tulisan diuji sebelum sampai ke pembaca. Dokumen yang lolos periksa mata teta

| Angka ambang lapis ini berstatus kalibrasi awal dan berlabel DIAGNOSIS. Yang mengikat adalah jalurnya: ukur, usulkan, timbang, uji regresi, lalu naikkan versi alat secara tercatat. Pengecualian hanya sah lewat penanda blok yang bisa ditelusuri, bukan lewat pelonggaran ambang diam-diam. |  | ■ TERUKUR SG-L6-03 SG-L6-15 |
|---|---|---|

## T118 — Tabel 14.1   Enam belas aturan lapis L6, mesin periksa dan penilai.

| Nomor | Judul dan pernyataan, dikutip apa adanya | Cara pakai | Penegak |
|---|---|---|---|
| SG-L6-01 | Plafon kepadatan klausa (C-26). Gerbang ini menjatuhkan FAIL pada lapisan prosa bila rata-rata klausa per kalimat atau persentase kalimat berantai panjang melewati ambang kalibrasi. Aturan yang ditegakkan: SG-L3-08 dan SG-L3-09. | Rata-rata klausa per kalimat di atas 2,2 berarti rantai dipecah dengan predikat lengkap, bukan dengan memindah koma. | C-26 |
| SG-L6-02 | Plafon rata-rata panjang kalimat (C-27). Gerbang ini menagih FAIL atau INFO pada rata-rata kata per kalimat yang melewati langit-langit kanal panjang; ia menuntut dua sisi target register K2 (lantai lama dipertahankan). Aturan yang ditegakkan: SG-L3-08 (dua sisi M-3). | Koridor dua dinding: di bawah 18 kata gabungkan fragmen, di atas 32 kata pisahkan aparatus ke klausa sendiri. | C-27 |
| SG-L6-03 | Penanda blok aparatus dan kutipan (perluasan D16, usulan D18). Penanda blok kutipan/aparatus melegalkan token aparatus rumah pada baris provenans/heading dan blok kutipan eksternal ber-rujukan-kartu; tanpa penanda, token tetap absolut. Aturan yang ditegakkan: menutup paradoks GS-04/GS-05 "arsitek melanggar aturan sendiri" (GAP-POLA-07, GAP-POLA-08); pelindung M-7. | Baris aparatus rumah dan kutipan eksternal diberi penanda blok yang bisa ditelusuri; tanpa penanda token larangan mutlak. | Penanda D16 |
| SG-L6-04 | Daftar putih struktural C-14. C-14 menghitung salinan berlebih hanya pada kalimat narasi; blok tanda tangan, kepala turunan, dan baris notasi wajib di-whitelist. | Gagasan berulang hanya dinilai dari lapisan narasi; tanda tangan, kepala turunan, dan baris notasi masuk daftar putih. | C-14 |
| SG-L6-05 | Batas kata pada daftar hitam A4. Daftar hitam A4 memakai batas kata (word boundary); fixture regresi "such as an aisle" wajib lulus. | Setiap pola daftar hitam baru membawa dua contoh regresi: satu kalimat manusia yang harus lolos, satu cacat yang harus tertangkap. | Daftar hitam A4 |
| SG-L6-06 | Sapaan institusional ditagih di K2 (C-20 + C-34). Dokumen ID kanal K2 wajib memuat sapaan institusional (Kami atau padanan terdaftar); C-20 dipromosikan dari INFO ke menagih, dilengkapi C-34 (kami + Yth./Bapak/Ibu/Saudara; larangan kamu). | Dokumen Indonesia kanal resmi wajib memuat kami dan pasangan penghormatan; kamu tidak pernah muncul di kanal mengikat. | C-20, C-34 |
| SG-L6-07 | Momen pembalik benar-benar ditagih (C-24). C-24 momen pembalik menagih langsung (bukan hanya agregasi) pada dokumen bab-baban dan proposal kanal doc/etalase. Aturan yang ditegakkan: SG-L1-10. | Dokumen bab-baban dan proposal tebal wajib punya satu momen pembalik yang tertangkap; tanpa titik balik berarti gagal. | C-24 |
| SG-L6-08 | Kanon satu-pemecah dan lapis baca (integritas ukur). metrics.py mengimpor pemecah kalimat scanner (kanon satu-pemecah); laporan forensik wajib menyebut lapis baca (docx-langsung vs txt-ekstrak) di samping tiap angka. | Bandingkan angka panjang kalimat hanya dari alat dan lapis baca yang sama; tulis lapis baca di samping setiap angka. | Integritas ukur |
| SG-L6-09 | Monitor rasio pembuka (INFO dulu). Check INFO baru: rasio pembuka kalimat berbeda di bawah ambang pada dokumen panjang = monoton. Aturan yang ditegakkan: SG-L2-01 (monitor, bukan vonis). | Variasikan pembuka kalimat secara sadar pada dokumen panjang; angka INFO tidak menghukum, tetapi angka ekstrem ditindaklanjuti. | Monitor INFO |
| SG-L6-10 | Subjek keputusan adalah manusia (C-28). Check ini memvonis FAIL, di kanal laporan dan proposal, setiap kalimat beraverba keputusan yang subjeknya artefak pipa data tanpa pelaku manusia. Aturan yang ditegakkan: SG-L4-01. | Di laporan dan proposal, setiap verba keputusan berpelaku manusia atau institusi. Ambang awal 2 kejadian per 1.000 kata. | C-28 |
| SG-L6-11 | Kerapatan objek bidang (C-29). Check ini bergerak dari INFO ke FAIL pada seksi teknis ketika rasio meta-proses terhadap objek konkret melewati ambang tanpa satu pun istilah objek bidang. Aturan yang ditegakkan: SG-L2-01 dan SG-L2-05. | Setiap seksi teknis memuat istilah objek bidang (koil, uplink, rak) dan rasio meta-proses di bawah ambang. | C-29 |
| SG-L6-12 | Identifier skema pindah ke tabel (C-30). Check ini memvonis FAIL snake_case skema dan enum status internal yang muncul dalam kalimat prosa; nama standar, nama produk, dan token berpenanda kutipan masuk whitelist. Aturan yang ditegakkan: SG-L4-03. | Identifier skema keluar dari prosa ke tabel berlabel manusia; nama standar dan produk lolos daftar putih. | C-30 |
| SG-L6-13 | Densitas provenans sebaris (C-31). Check ini memvonis FAIL bila lebih dari satu penanda provenans inline muncul per satuan jarak kata dalam satu kalimat prosa; mark pindah ke baris tabel, tidak dihapus. Aturan yang ditegakkan: SG-L3-05 dan SG-L1-04. Batas tegas M-2: aturan ini hanya mengatur cara sajian, kewajiban provenans tetap milik SPK-002. | Satu tanda per klausa fakta, kira-kira satu per 20 kata. Tanda dipindah ke baris tabel, tidak dihapus. | C-31 |
| SG-L6-14 | Konsistensi konvensi numerik (C-33). Check ini memvonis FAIL dua varian ejaan untuk kelas nilai yang sama dalam satu dokumen; ia menuntut satu varian per kanal, bukan melarang varian. Aturan yang ditegakkan: SG-L4-06. | Tetapkan konvensi per kelas nilai di awal, sisir sekali sebelum serah. | C-33 |
| SG-L6-15 | Anggaran pemindai: kelas tersangkal turun ke INFO, C-32 beku. Kelas yang tersangkal alat (penguat kosong, kemubaziran sinonim) turun ke INFO dan dilarang naik jadi daftar hitam aktif; nomor C-32 (kalung yang) tetap kosong karena usulannya ditarik oleh pengukurnya sendiri. Aturan yang ditegakkan: SG-L4-09 (penjaga GS-10/GS-17/GS-23). | Sebelum mengusulkan check baru, tunjukkan ukuran pemisahnya pada korpus nyata; bila nol, turunkan ke pantauan. | Anggaran pemindai |
| SG-L6-16 | Rubrik juri sebagai instrumen resmi aturan berjuri. Rubrik juri tiga dimensi serta penjaga (work/f2_rubrik.md) adalah instrumen resmi seluruh aturan berinstrumen juri: skor dilaporkan terpisah per dimensi, juri bukan penulis, lembar skor ber-ID. Aturan yang ditegakkan: semua aturan berjuri di ketujuh lapis. | Empat dimensi dinilai terpisah skala 1 sampai 5, alasan dengan kutipan verbatim lebih dulu, juri bukan penulis. | Rubrik juri |
| SUMBER STD-GAYA-AHLI-001 rev G, edisi pembaca v1.3. Pernyataan dikutip verbatim karena standar induk melarang parafrase; cara pakai diringkas penyusun. PROVENANS ■ TERUKUR. |  |  |  |

## T119 — Tabel 14.2   Ambang periksa lapis L6 per kanal, kalibrasi awal berlabel DIAGNOSIS.

| Metrik, satuan pada baris | Kanal | Lantai | Plafon | Aksi saat lewat | Check |
|---|---|---|---|---|---|
| Klausa per kalimat, rata-rata prosa | doc, etalase | – | 2,2 | Pecah rantai dengan predikat | C-26 |
| Kalimat berantai dengan 4 koma atau lebih | doc, etalase | – | 20 % | Rombak paragraf terkait | C-26 |
| Titik-koma per 1.000 kata prosa | doc, etalase | – | 5,4 | Rombak rantai menjadi kalimat berpredikat | C-26 |
| Kata per kalimat, rata-rata | K2 panjang | 18 | 32 | Gabung fragmen atau pecah di batas klausa | C-27 |
| Rasio pembuka kalimat berbeda | doc lebih dari 2.000 kalimat | 0,20 | – | Variasikan pembuka | INFO |
| Verba keputusan berpelaku artefak | laporan, proposal | – | 2 per 1.000 kata | Tempelkan pelaku manusia | C-28 |
| Rasio meta-proses : objek konkret | seksi teknis | – | 8, tanpa objek | Kembalikan ke objek bidang | C-29 |
| Identifier skema di prosa | doc, etalase | 0 | – | Pindahkan ke tabel berlabel | C-30 |
| Penanda provenans sebaris | prosa | – | 1 per 20 kata | Pindahkan ke baris tabel atau rel | C-31 |
| Varian ejaan per kelas nilai | per berkas | – | 1 varian | Sisir ke satu konvensi | C-33 |
| Salinan berlebih | lapisan narasi | – | Gabung gagasan; boilerplate sah dikecualikan | C-14 |  |
| Skor juri per dimensi | pintu rilis | – | Lulus bila dimensi 1 sampai 3 ≥ 4 dan dimensi 4 ≥ 3; bila tidak, revisi lalu nilai ulang | Rubrik |  |
| SUMBER STD-GAYA-AHLI-001 rev G, edisi pembaca v1.3 Bab 7, Tabel 8. Ambang hanya berubah lewat jalur tata kelola. |  |  |  |  |  |

## T120 — Tabel 14.3   Dua ambang agregasi yang tidak boleh tertukar.

| Ambang | Syarat | Dipakai untuk |
|---|---|---|
| SARING | Rata-rata dimensi 1 sampai 3 ≥ 4, tidak ada dimensi 1 sampai 3 ≤ 2, dimensi 4 ≥ 3 | Penyaring korpus besar dan perbaikan awal |
| LEPAS | Dimensi 1, 2, dan 3 masing-masing ≥ 4 dan dimensi 4 ≥ 3, atas adjudikasi dua juri | Satu-satunya pintu rilis yang sah |
| SUMBER STD-GAYA-AHLI-001 rev G, edisi pembaca v1.3 Bab 7, Rubrik juri sebagai prosedur. Pelonggaran dari LEPAS ke SARING hanya lewat persetujuan pengelola yang tercatat. |  |  |

## T121 — Status tinjau berlaku bila selisih antar-juri dua poin atau lebih, salah satu juri menjatuhkan dimensi 4 sementara lawannya memberi empat atau lebih, juri tidak

| Kepala lembar skor juri LEMBAR SKOR JURI <id-juri>-<nomor>: cuplikan <id>, genre <kanal>, tanggal Dimensi 1 kejelasan: alasan dengan kutipan verbatim, lalu skor 1-5 Dimensi 2 kedalaman: ____ Dimensi 3 kematangan susunan: ____ Dimensi 4 penjaga pola: ____ Tanda tangan juri, wajib bukan penulis cuplikan |
|---|

## T122 — 14.5   Tiga tangan terpisah

| Tangan yang menulis, tangan yang menilai, dan tangan yang memeriksa tidak boleh bertumpuk. Penulis menghasilkan draf faktual dan menyisirnya sendiri, tetapi tidak menilai karyanya dengan rubrik. Juri dilarang membuka berkas sumber, menjalankan alat ukur, atau membaca percakapan tentang cuplikan sebelum semua lembar terkumpul. Selisih dua poin atau lebih naik ke adjudikator ketiga. Pemeriksa independen terakhir memastikan jejak setiap langkah alat ada dan konsisten. |  | ■ TERUKUR SG-L6-16 |
|---|---|---|

## T123 — 7Serah. Dokumen diserahkan dengan pernyataan jujur di kolofon. Hasil pemeriksaan disimpan sebagai register, tidak ditempel ke teks pembaca.

| Perintah alat mutu standar induk python lint_mutu.py --selftest python lint_mutu.py naskah.md --kanal umum --json laporan-lint.json python scan_ai_footprint.py naskah.md --channel doc python scan_ai_footprint.py pesan.txt --channel chat |
|---|

## T124 — Kedua alat itu milik standar gaya bahasa dan tidak dikirim bersama skill DATUM. Bab 16 menggabungkan prosedur ini dengan lint DATUM menjadi satu gerbang rilis.

| KLASIFIKASI · TERBATAS | SALINAN INDUK · PENGGUNAAN INTERNAL GSP |
|---|---|

## T125 — Workbook dan command brief, satu gerbang rilis yang menyatukan lint DATUM dengan prosedur pra-serah Gaya Ahli, dan register keputusan atas setiap tabrakan antar

| Bab 15 | Workbook dan Command Brief |
|---|---|
| Bab 16 | Gerbang Rilis Terpadu |
| Bab 17 | Rekonsiliasi Antar-Sumber dan Program Perbaikan |

## T126 — 15.1   Standar workbook

| Workbook mengikuti FAST Standard, ICAEW Twenty Principles, dan praktik Operis. excel-master dan gsp-keuangan-excel memiliki logikanya; DATUM memiliki kulit, warna provenans, dan aparatus kendali. Komputasi dipisah dari presentasi, dan setiap nilai dihitung sekali lalu dirujuk. |  | ■ TERUKUR REF 04 DT-40 |
|---|---|---|

## T127 — Tabel 15.1   Kelas sheet workbook DATUM.

| Sheet | Kelas | Fungsi |
|---|---|---|
| COVER | Tampilan | Identitas dan angka kunci, semuanya lewat rujukan |
| PETUNJUK | Kendali | Kunci warna, peta sheet, batas model BTS-nn |
| KENDALI | Kendali | Pemeriksaan silang dan bendera induk |
| RINGKASAN EKSEKUTIF | Tampilan | Angka kunci dengan satuan dan provenans |
| REKAPITULASI | Tampilan | Nilai per bab, PPN, total, terbilang |
| RAB | Tampilan | Daftar kuantitas dan harga |
| AHS | Dasar harga | Analisa harga satuan, Permen PUPR 8/2023 |
| HITUNG-nama | Hitung | Satu domain per sheet; satu-satunya rumah konstanta |
| SUMBER References/04 §1 · tokens.json workbook.sheet_classes. |  |  |

## T128 — Tabel 15.2   Warna numeral di workbook adalah provenans.

| Warna | Arti | Yang dilakukan pembaca |
|---|---|---|
| signal amber | Konstanta yang diketik tangan | Periksa dan tantang |
| verd | Rujukan ke sheet lain di workbook ini | Ubah di sumbernya |
| ink900 | Rumus di sheet ini | Jangan ditimpa |
| alert merah | Tautan ke berkas di luar workbook | Verifikasi ulang |
| SUMBER References/04 §2. Kuncinya dicetak di PETUNJUK, karena konvensi yang tidak bisa dibaca bukan konvensi. |  |  |

## T129 — PETUNJUK punya tiga bagian wajib: kunci warna dengan contoh, struktur workbook, dan daftar bernomor batas serta kelemahan model. KENDALI menjalankan sekurang-ku

| Bendera induk KENDALI, references/04 §4 BENDERA INDUK =IF(COUNTIF(D8:D12,"GAGAL")=0, "SELURUH UJI LULUS", "ADA UJI YANG GAGAL, JANGAN TERBITKAN") vonis =IF(ABS(Cn)<0.5,"LULUS","GAGAL") |
|---|

## T130 — 15.2   Standar command brief

| Brief berukuran 16:9 (338,7 mm × 190,5 mm) pada master instrumen terang sebagai default; master gelap hanya bila diminta. gsp-presentation-maestro memiliki argumennya; DATUM memiliki masternya. Setiap headline adalah klaim, bukan topik, satu gagasan per slide dengan paling banyak kira-kira 55 kata badan. Setiap slide yang membawa angka membawa baris sumber. Dek ditutup dengan keputusan yang diminta dan empat angka yang membenarkannya, tidak pernah dengan Terima kasih. |  | ■ TERUKUR REF 05 DT-41 |
|---|---|---|

## T131 — Tabel 15.3   Headline adalah klaim, bukan topik.

| Klaim, benar | Topik, salah |
|---|---|
| Perimeter 6.546,2 m menuntut 70 titik. Kuantitas berikutnya mengikuti. | Baseline Kuantitas |
| Tiga asumsi mengikat seluruh angka. Semuanya dapat diuji sebelum kontrak. | Asumsi dan Risiko |
| Unit 70,0 kW menutup beban 65,6 kW dengan cadangan 6,7 %. | Pemilihan Unit |
| SUMBER References/05 §3; baris ketiga dari spesimen DATUM. Selaras dengan SG-L2-01 adaptif kanal dek. |  |

## T132 — 16.1   Lint DATUM: 38 pemeriksaan dalam tiga tahap

| Lint menangkap dua hal: apa pun yang membuat dokumen terbaca sebagai tulisan mesin, dan cacat kepatuhan yang membuat GSP terlihat tidak memahami regulasi. Kegagalan mana pun memblokir rilis. Ke-38 pemeriksaan berjalan pada tiga tahap: 27 di lint berkas (datum_lint.py), 7 saat bangun di mesin diagram dan perender, dan 4 dengan mata. Sejak Revisi J spanduk lint hanya melaporkan yang benar-benar dijalankan skrip. |  | ■ TERUKUR REF 06 DT-42 |
|---|---|---|

## T133 — Tabel 16.1   Seluruh baterai lint: 38 pemeriksaan, batas, dan tahap pemiliknya.

| No | Pemeriksaan | Batas | Tahap |
|---|---|---|---|
| 01 | Deret KPI tile, strip statistik dasbor | 0 | berkas |
| 02 | Kotak callout berisi warna dengan batang | 0 | berkas |
| 03 | Tanda pisah panjang per 1.000 kata; nol di judul | maks. 3 | berkas |
| 04 | Judul berbentuk pertanyaan | 0 | berkas |
| 05 | Fon bawaan Office di keluaran | 0 | berkas |
| 06 | Sampul di tengah | 0 | berkas |
| 07 | Garis tegak di tabel | 0 | berkas |
| 08 | Baris kepala tabel berisi warna di Word atau PDF | 0 | mata |
| 09 | Tabel data tanpa kolom satuan | 0 | berkas |
| 10 | Tabel atau gambar tanpa baris SUMBER | 0 | berkas |
| 11 | Angka beban keputusan tanpa tanda provenans | 0 | berkas |
| 12 | Warna dekoratif | 0 | mata |
| 13 | Chart dirasterisasi | 0 | mata |
| 14 | Nilai warna terlihat pada satu halaman | maks. 5 | berkas |
| 15 | Ukuran baris badan dalam karakter | 66–80 | mata |
| 16 | Nilai dan satuan tanpa spasi | 0 | berkas |
| 17 | ± tanpa arti yang dinyatakan | 0 | berkas |
| 18 | Klasifikasi salah untuk penerima | 0 | berkas |
| 19 | PPN selain 11 % untuk barang non-mewah 2026 | 0 | berkas |
| 20 | Sel gabungan di zona komputasi | 0 | berkas |
| 21 | Garis di bawah 0,18 mm atau rona di bawah 15 % | 0 | berkas |
| 22 | Klaim eksternal tanpa derajat Admiralty | 0 | berkas |
| 23 | Sudut membulat di luar terminator | 0 | berkas |
| 24 | Penghubung tanpa label | 0 | bangun |
| 25 | Nilai warna pada satu gambar | maks. 5 | berkas |
| 26 | Subjek beraksen pada satu gambar | maks. 1 | bangun |
| 27 | Garis diagram di bawah 0,18 mm | 0 | berkas |
| 28 | Huruf diagram di bawah 5,5 pt | 0 | berkas |
| 29 | Gambar tanpa baris SUMBER | 0 | berkas |
| 30 | Gambar tanpa nomor atau caption | 0 | berkas |
| 31 | Sumber Mermaid dalam berkas terbit | 0 | berkas |
| 32 | Penghubung melewati kotak tak terkait | 0 | bangun |
| 33 | Gambar lebih tinggi dari blok teks 247 mm | 0 | bangun |
| 34 | Tanda rumah tanpa legenda terbit | 0 | bangun |
| 35 | Lebih dari satu dialek simbol per gambar | 0 | bangun |
| 36 | Aparatus didelegasikan ke halaman | lapor | berkas |
| 37 | Lembar tersusun melewati halaman A4 | 0 | bangun |
| 38 | Garis bawah di nama berkas, folder, atau sheet | 0 | berkas |
| SUMBER References/06 · datum_lint.py FILE_LINT_CHECKS, BUILD_TIME_CHECKS, HUMAN_EYE_CHECKS. Tahap: berkas 27, bangun 7, mata 4. |  |  |  |

## T134 — Tabel 16.2   Satu gerbang rilis: urutan pemeriksaan untuk dokumen TERBIT dan SERAH.

| Langkah | Pemeriksaan | Alat atau tangan | Lulus bila | Tier |
|---|---|---|---|---|
| 1 | Sisir sendiri: tiga cek tercepat tiap lapis, daftar kata terlarang | Penulis | Mata sendiri menyentuh halaman terakhir | semua |
| 2 | Penjaga titik panggil saat bangun | datumcheck.py | Nol G1, G2, G3, N1 | TERBIT |
| 3 | Lint gambar saat bangun | datum_diagram.py, datum_render.py | Pemeriksaan 24, 26, 32 sampai 35, 37 bersih | TERBIT |
| 4 | Pemeriksaan mekanik naskah dan jejak mesin per kanal | lint_mutu.py, scan_ai_footprint.py | Pelanggaran absolut nol | TERBIT |
| 5 | Lint berkas DATUM | datum_lint.py | 27 dari 27 pemeriksaan berkas lulus | TERBIT |
| 6 | Audit pengikatan angka | datumbind audit_docx, audit_retired | Nol angka tak terlacak, nol nilai pensiun | SERAH |
| 7 | Pemeriksaan mata | Pemeriksa | Pemeriksaan 08, 12, 13, 15 dan daftar manual 16.4 | TERBIT |
| 8 | Penilaian juri buta | Dua juri bukan penulis | Ambang LEPAS pada lembar skor ber-ID | SERAH |
| 9 | Pemeriksaan independen dan uji fotokopi | Pemeriksa bukan penulis dan bukan juri | Jejak langkah 2 sampai 8 tersimpan; terbaca dari 40 cm | SERAH |
| 10 | Serah dan rekam | ARSIP, LOKUS, KRONIK | Nomor, catatan perubahan, folder proyek, SHA-256 | semua |
| SUMBER Disusun penyusun dari SKILL.md DATUM §8a, §13 dan STD-GAYA-AHLI-001 Bab 7. PROVENANS ◈ DITURUNKAN. Langkah gagal kembali ke sumber (Gambar 3.1). |  |  |  |  |

## T135 — Tabel 16.3   Rute harian: kanal keluaran menentukan aturan yang dicek dan gerbang yang dijalankan.

| Kanal | Aturan inti | Gerbang | Lulus bila |
|---|---|---|---|
| Chat kerja | Jawaban di depan (SG-L0-05); satu maksud per pesan (SG-L1-07); angka berbasis (SG-L3-05); permintaan mudah dijawab (SG-L3-06) | Pemindai kanal chat | Jawaban di baris pertama; nol pelanggaran absolut |
| Surat dinas | Pengacaraan institusional (SG-L5-08); penutup aksi dan penerima (SG-L0-03); format tata naskah penerima (DT-32) | Langkah 1, 4, 7 | Sapaan benar; satu usul yang bisa dijawab |
| Dokumen dan proposal | Identitas di muka; payung otoritas; peta urutan; angka di tabel; momen pembalik; seluruh Bagian II | Langkah 1 sampai 10 sesuai tier | Lint 27 dari 27; LEPAS untuk SERAH |
| Dek presentasi | Headline klaim (DT-41); satu angka besar per slide dengan sumber; chart dibicarakan di catatan | Langkah 1, 3, 5, 7 | Setiap slide satu klaim; lint dek bersih |
| Notifikasi otomatis | Kalimat pertama berisi hasil dan angka (SG-L2-01); kegagalan dengan sebab dan langkah (SG-L5-03) | Pemindai kanal notif | Pembaca tahu langkah berikutnya tanpa membuka kanal lain |
| Workbook | Kelas sheet, warna provenans, KENDALI (DT-40); angka turunan dari rumus | Langkah 2, 5, 7 | Bendera induk SELURUH UJI LULUS |
| Chart | Bab 7 dan Tabel 8.9 | Langkah 3, 7 | Dua belas butir 8.6 tercentang |
| Gambar teknik | Bab 9 dan 10; satu dialek; labels_verified true | Langkah 3, 7 | Lint bangun bersih; legenda ada |
| SUMBER STD-GAYA-AHLI-001 Bab 8 · SKILL.md DATUM. Disusun penyusun. PROVENANS ◈ DITURUNKAN. |  |  |  |

## T136 — 16.7   Hasil gerbang pada manual ini

| Berkas Word dan PDF manual ini dijalankan melalui gerbang pada bangun akhir. PDF lulus 27 dari 27 pemeriksaan berkas. Word memicu dua hal, keduanya cacat alat yang sudah tercatat dan bukan cacat isi. Lint berhenti pada tabel satu baris (E-01), sehingga gerbang dijalankan pada salinan lint yang ditambal satu baris. Pemeriksaan 18 lalu menembak karena manual ini menjelaskan skema klasifikasi TNI sambil berklasifikasi TERBATAS menurut skema ANRI (E-10). Temuan itu dibiarkan tercatat dan tidak dihindari dengan mengganti nama lembaga, karena penggantian itu mengubah isi aturan. |  | ◈ DITURUNKAN DATUM LINT.PY V3 |
|---|---|---|

## T137 — Tabel 16.4   Hasil gerbang rilis pada berkas Word manual ini.

| Langkah | Hasil | Catatan |
|---|---|---|
| Penjaga titik panggil G1 dan G2 | Lulus | Diterapkan sebagai assert di setiap tabel; bangun gagal bila dilanggar |
| Lint bangun Gambar 2.1 dan 3.1 | Lulus | Maks. lima warna, setiap penghubung berlabel; lint 36 dilaporkan dan aparatus dicetak halaman |
| Lint berkas pada PDF | 27 dari 27 | datum_lint.py v1.8 |
| Lint berkas pada Word | 26 dari 27 | Pemeriksaan 18 salah tangkap (E-10); salinan lint bertambal E-01 |
| Titik-koma di prosa | 1,2 per 1.000 kata | Plafon 5,4 (C-26) |
| Tanda pisah panjang di prosa | 0 | Plafon 3 per 1.000 kata (lint 03) |
| Kata kamu di prosa | 0 | Kutipan contoh salah di tabel dikecualikan |
| Audit pengikatan angka | Tidak berlaku | Manual tidak punya register kuantitas; angka contoh dikutip dari sumber |
| Juri buta dan pemeriksa independen | Belum dijalankan | Wajib bila manual naik ke tier SERAH |
| Uji fotokopi fisik | Belum dijalankan | Perlu cetak dan fotokopi di kantor |
| SUMBER Dijalankan pada bangun akhir, 8 Oktober 2026. PROVENANS ◈ DITURUNKAN. |  |  |

## T138 — 17.1   Keputusan

| Empat sumber manual ini sepakat pada hampir seluruh prinsip, tetapi berselisih pada dua puluh titik pelaksanaan. Manual ini memutus kedua puluhnya dengan hierarki 2.5 dan mencatat setiap putusan di Tabel 17.1, karena tabrakan yang dipilih diam-diam adalah cara termudah membuat dua penulis GSP menghasilkan dua bentuk berbeda dari aturan yang sama. |  | ◈ DITURUNKAN HIERARKI 2.5 |
|---|---|---|

## T139 — Tabel 17.1   Register rekonsiliasi: setiap tabrakan antar-sumber dan putusannya.

| ID | Pokok | Sumber A | Sumber B | Putusan | Dasar |
|---|---|---|---|---|---|
| R-01 | Judul chart | Chart: judul berupa kesimpulan di atas chart | DATUM: tidak ada judul di dalam plot | Kesimpulan ditulis sebagai kalimat caption di atas gambar | Bentuk DATUM, isi Chart |
| R-02 | Warna chart | Chart: biru, hijau baik, merah buruk | DATUM: satu aksen signal; biru tidak ada | Aksen signal; alert untuk melewati batas; verd untuk membaik | Bentuk DATUM |
| R-03 | Legenda | Chart: kurangi legenda | DATUM: legenda baris kunci, bukan kotak | Label langsung; bila perlu baris KUNCI di bawah gambar | Selaras |
| R-04 | Dashboard dan KPI tile | Chart: prinsip dashboard, gauge untuk satu KPI | DATUM lint 01: tile dilarang | Tile dan gauge hanya di layar hidup (gsp-ui-architect); dokumen memakai bullet | Bentuk DATUM |
| R-05 | Kerapatan provenans | Gaya: tanda sekali per klausa, maks. 1 per 20 kata | DATUM: tanda pada setiap angka beban | Kewajiban tetap; tanda berlebih pindah ke rel bukti dan baris tabel | Selaras lewat rel |
| R-06 | Zebra tabel | Gaya: selang warna baris genap di workbook | DATUM: zebra hanya di atas 12 baris, tidak di BoQ | Aturan DATUM berlaku | Bentuk DATUM |
| R-07 | Letak satuan | Gaya: satuan di kepala kolom | DATUM: kolom satuan sendiri (lint 09) | Tabel data memakai kolom satuan; kepala bersatuan hanya untuk tabel ringkas bersatuan tunggal | Bentuk DATUM △ |
| R-08 | Edisi ISA-5.1 | Simbol: 2024 [T], terbit Oktober 2024 | DATUM: 2022, diverifikasi 2 Agustus 2026 | Kutip ANSI/ISA-5.1-2024; label isa: diperbarui setelah veritas | Edisi terbaru |
| R-09 | Standar simbol keamanan | Simbol: SIA AG-01 v3.0 ada [T] | DATUM: tidak ada standar sama sekali | Tidak ada standar internasional; ada standar industri SIA AG-01 | Edisi terbaru |
| R-10 | Edisi APP-6 | Simbol: APP-6E dilaporkan 2025 [S] | DATUM: APP-6D | Tetap D sampai dokumen NATO dikonfirmasi; sebut E sebagai laporan | Verifikasi dulu |
| R-11 | Edisi IEC 60617 | Simbol: IEC 60617:2026 DB [T] | DATUM: basis data tanpa tahun | Kutip edisi basis data yang dirujuk | Edisi terbaru |
| R-12 | Kotak Keputusan | Chart dan Simbol: kotak berisi warna | DATUM lint 02 | Diganti aside bergaris | Bentuk DATUM |
| R-13 | Tanda pisah di judul | Chart: "Langkah 1 — ...", "Contoh 1 — ..." | DATUM lint 03: nol di judul | Judul memakai titik | Bentuk DATUM |
| R-14 | Glif provenans | Semua sumber memakai ■ ◈ ◇ △ | Plex tidak memuat glif itu (E-32) | Glif diset DejaVu Sans yang ditanam ke berkas | Penutupan E-32 |
| R-15 | Klasifikasi manual | Gaya: TERBATAS | DATUM Explained dan Simbol: BIASA | TERBATAS, mengikuti klasifikasi tertinggi bahan yang dimuat | Kepatuhan |
| R-16 | Bahasa | DATUM Explained: Inggris | Chart, Simbol, Gaya: Indonesia | Bahasa Indonesia; label perangkat halaman sudah Indonesia | Kanal GSP |
| R-17 | Kata ganti pembaca | Gaya SG-L5-08: kamu dilarang | SKILL.md DATUM §2a memakai you dalam uji tier | Anda di manual internal; teks DATUM perlu direvisi | Gaya Ahli |
| R-18 | Mesin chart | Chart: lebih dari 80 jenis | datumchart.py: tiga keluarga | pustakachart.py ditambah pemeriksaan mata (C-01) | Celah dicatat |
| R-19 | Pertanyaan | Gaya SG-L1-10: pertanyaan pembalik dianjurkan | DATUM lint 04: judul bertanya dilarang | Pertanyaan boleh di badan, tidak pernah sebagai judul | Selaras |
| R-20 | Pokok 4 yang hilang | Permintaan: manual chart sebagai pustaka | Berkas tidak diterima | Pustaka dibangun ulang di Bab 8 (ASM-MAN-01) | Asumsi |
| SUMBER Keempat dokumen sumber, Lampiran D. Dasar mengikuti hierarki 2.5. △ pada R-07: perilaku lint 09 terhadap satuan di kepala kolom belum diuji. |  |  |  |  |  |

## T140 — Tabel 17.2   Register temuan: 32 temuan DATUM Explained ditambah dua temuan baru manual ini.

| ID | Bobot | Temuan | Perbaikan | Status di manual ini |
|---|---|---|---|---|
| E-01 | Blokir | Lint berhenti pada .docx dengan tabel satu baris 3 sampai 5 kolom | Ulangi baris lalu sel | Terbuka △ |
| E-02 | Blokir | Pemeriksaan 17 meloloskan ± bila kata rancangan muncul di mana pun | Periksa jendela di sekitar ± | Terbuka |
| E-03 | Blokir | Pemeriksaan 11 dan 22 meloloskan berkas dengan satu tanda atau satu derajat | Hitung per paragraf atau tabel | Terbuka |
| E-04 | Mayor | datum_docx.py membangun sampel saat diimpor | Pustaka terpisah dari sampel | Ditutup di manual |
| E-05 | Mayor | Garis rambut docx 0,176 mm, di bawah lantai | w:sz 5 (0,22 mm) | Ditutup di manual |
| E-06 | Mayor | Register sampel menulis DARI 6 pada berkas 3 halaman | Medan NUMPAGES | Ditutup di manual |
| E-07 | Mayor | ink100 adalah rona 5,3 %, lantai 15 % | Definisikan rona pita 15 % | Terbuka |
| E-08 | Mayor | Huruf chart tampil 75 %, gambar 3,78 kali terlalu lebar | Tulis mm dan pt seperti mesin diagram | Terbuka |
| E-09 | Mayor | Pemeriksaan 19 memblokir bentuk sah 12 % × DPP | Terima pola DPP nilai lain | Terbuka |
| E-10 | Mayor | Pemeriksaan 18 menembak dokumen yang menjelaskan aturannya | Baca medan klasifikasi saja | Terbuka |
| E-11 | Minor | Enam ID simbol bergaris bawah | Ganti tanda hubung, simpan alias | Terbuka |
| E-12 | Minor | audit_docx menandai nilai register 4 desimal | Pakai desimal tiap entri | Terbuka |
| E-13 | Minor | Derivation.verdict hanya menguji nilai ≤ batas | Tambah argumen arah | Terbuka |
| E-14 | Minor | Toleransi turunan absolut 0,51 | Toleransi relatif | Terbuka |
| E-15 | Minor | Masukan turunan tercetak tanpa tanda | Tambahkan tanda register | Ditutup di manual |
| E-16 | Mayor | Aksen ditambah alert melewati plafon lima warna gambar | Hitung ramp tinta sebagai satu keluarga | Terbuka |
| E-17 | Mayor | Cabang SLD bisa menggantung dari rel | Rute tap rel ke batang | Terbuka |
| E-18 | Minor | Lembar simbol 310 mm dan memotong label | Paginasi pada 247 mm | Terbuka |
| E-19 | Minor | datum_diagram.py tidak punya --estimate | Implementasi atau hapus dari §12 | Terbuka |
| E-20 | Minor | Default apparatus diagram figure, dokumen menyebut page | Default page | Terbuka |
| E-21 | Minor | Kode DS di luar daftar tertutup ARSIP | Tambah DS atau pensiunkan | Terbuka |
| E-22 | Minor | Margin brief 9 mm di token, 18 mm di referensi | Pilih satu nilai | Terbuka |
| E-23 | Minor | Versi kepala skrip v1.1 sampai v1.6 di bawah skill v1.8 | Satu konstanta versi | Terbuka |
| E-24 | Minor | Kepala halaman sampel tetap Bab 5 sampai Bab 7 | Seksi per bab | Ditutup di manual |
| E-25 | Minor | Kepala halaman meminta Cond 500 yang tidak dikirim | Kirim Medium atau pakai 400 | Ditutup di manual |
| E-26 | Minor | Brief gelap masih default di kode dan lembar bukti | Master terang di kode | Terbuka |
| E-27 | Minor | Pemeriksaan judul menandai label berawalan How dan What | Tandai hanya ? di akhir | Terbuka |
| E-28 | Minor | Satuan pt hilang dari kosakata satuan | Tambah pt, em, dpi | Terbuka |
| E-29 | Minor | graph menggambar stadium sebagai lingkaran; tutup silinder menimpa label | Ukur bentuk dari geometrinya | Terbuka, dihindari di Gambar 3.1 |
| E-30 | Mayor | flow mengabaikan per_row | Implementasi pembungkusan | Terbuka, dihindari di Gambar 3.1 |
| E-31 | Minor | Pemeriksaan 16 membaca rujukan seksi berhuruf sebagai nilai ampere | Lewati token setelah § | Terbuka |
| E-32 | Mayor | Glif provenans, Yunani, √, ≤, → tidak ada di Plex | Tanam fon simbol terverifikasi | Ditutup di manual |
| C-01 | Mayor | Mesin chart hanya tiga keluarga; katalog GSP 58 jenis | Perluas datumchart.py dari pustakachart.py | Baru, terbuka |
| C-02 | Minor | Tabel edisi DATUM ref. 09 tertinggal dari Tabel 10.1 | Perbarui lewat knowledge-master dan veritas | Baru, terbuka |
| SUMBER DATUM House Style Explained Tabel 9.1, 3 Oktober 2026; C-01 dan C-02 dari penyusunan ini. Blokir: gerbang berbohong atau berhenti. Mayor: keluaran salah sampai ke halaman. Minor: inkonsistensi. △ E-01: lihat 16.7. |  |  |  |  |

## T141 — Tabel 17.3   Usulan pembaruan pustaka simbol DATUM dari riset Oktober 2026.

| Butir | Tertulis di DATUM §09 | Temuan 7 Oktober 2026 | Usulan tindakan |
|---|---|---|---|
| ISA-5.1 | Edisi 2022, berlaku | ISA-5.1-2024 terbit Oktober 2024; judul berubah [T] | Perbarui label isa: dan tabel edisi |
| Simbol keamanan | Tidak ada standar sama sekali | Ada standar industri SIA AG-01 v3.0 [T] | Ubah kalimat; petakan sec: ke kategori AG-01 |
| NATO APP-6 | Edisi D (2017) | APP-6E dilaporkan 2025 [S] | Konfirmasi dari dokumen NATO |
| IEC 60617 | Basis data tanpa tahun | IEC 60617:2026 DB, 3 Maret 2026 [T] | Catat edisi basis data |
| ArchiMate | Tidak dibahas | ArchiMate 4, April 2026 [T] | Tambah ke notasi proyek SPBE |
| Cakupan pustaka | iec, isa, sec, mil | BPMN, topologi, kebakaran, rambu belum ada | Tambah bpmn: dan net:; fire: setelah NFPA 170 dibeli |
| Mesin SLD | – | SLD kiri ke kanan menghasilkan tata letak bertumpuk | Sementara pakai atas ke bawah |
| mil:unknown | Quatrefoil | Tergambar empat lingkaran terpisah | Cocokkan ke MIL-STD-2525E |
| SUMBER Panduan Simbol Engineering v1.0 Bab 10. Temuan melewati knowledge-master dan veritas sebelum tabel DATUM diubah. |  |  |  |

## T142 — Tabel 17.4   Usulan peningkatan yang menaikkan otoritas teknis.

| ID | Peningkatan | Yang ditambahkan | Upaya |
|---|---|---|---|
| P-01 | Pembangun Word yang bisa diimpor | Bab, rel, medan, lembar kendali; datumword.py manual ini sebagai purwarupa | kecil |
| P-02 | Dialek simbol HVAC dan mekanikal | Kompresor, kondensor, koil, kipas, damper; edisi diverifikasi dulu | sedang |
| P-03 | Templat catatan hitung | Masukan, metode, hasil, pemeriksaan, batas per hitungan | kecil |
| P-04 | Matriks keterlacakan | REQ ke pasal, baris BoQ, uji, dan status | kecil |
| P-05 | Lembar gambar A3 dengan blok judul | Blok judul ISO 7200 untuk gambar yang akan dibangun | sedang |
| P-06 | Tabel anggaran ketidakpastian | Komponen GUM, faktor cakupan, ketidakpastian diperluas | kecil |
| P-07 | Daftar simbol dan nomenklatur | Halaman depan simbol, satuan, singkatan | kecil |
| P-08 | Varian perangkat halaman Inggris | SOURCE, SHEET n OF N; aturan numeral Inggris | kecil |
| P-09 | Laporan rekonsiliasi paket | Satu register untuk kajian, proposal, BoQ, jadwal; audit semua berkas | sedang |
| P-10 | Standar tulis Inggris | Bahasa terkendali ASD-STE100; Gaya Ahli tetap suara Indonesia | sedang |
| P-11 | Register risiko | Kemungkinan pita ICD 203, dampak, pemilik, pemicu; tanpa heatmap warna | kecil |
| P-12 | Pustaka chart masuk skill | pustakachart.py menjadi keluarga datumchart.py dengan keluaran SVG | sedang |
| SUMBER DATUM House Style Explained Tabel 9.3; P-12 dari penyusunan ini. Edisi standar yang disebut wajib diverifikasi sebelum dipakai. |  |  |  |

## T143 — Tabel A.1   Aturan bentuk DATUM, awalan DT.

| Nomor | Aturan | Rumah |
|---|---|---|
| DT-01 | Setiap unsur halaman adalah bukti atau aparatus pembuktinya; tidak ada hiasan | 2.1 |
| DT-02 | Tier ditetapkan sebelum membangun; NOTA adalah default | 3.1 |
| DT-03 | tokens.json adalah induk mesin dan menang atas prosa | 3.3 |
| DT-04 | Nomor diambil dari Register Induk sebelum membangun | 3.4, 6.3 |
| DT-05 | Latar putih sebagai default; latar gelap hanya bila tugas memintanya | 4.2 |
| DT-06 | Paling banyak lima nilai warna per halaman; warna tanpa makna dihapus | 4.3 |
| DT-07 | Pasangan navy dan emas sudah pensiun | 4.3 |
| DT-08 | Tumpukan IBM Plex; Calibri, Times New Roman, Aptos, Arial badan dilarang | 4.4 |
| DT-09 | Berkas .docx menanam fon; .xlsx dan .pptx dikirim dengan folder fon | 4.4 |
| DT-10 | Grid 24, 128, 6, 32, 20 mm; unsur penuh paling lebar 166 mm | 4.6 |
| DT-11 | Garis tidak lebih tipis dari 0,18 mm; rona hanya 15 % dan 30 % | 4.6, 6.6 |
| DT-12 | Tanpa garis bawah pada nama folder, berkas, sheet, tabel, gambar, identifier | 3.5 |
| DT-13 | Enam perangkat tanda tangan dipasang di tempatnya | 4.7 |
| DT-14 | Sampul rata kiri, tidak di tengah; logo muncul sekali | 4.8 |
| DT-15 | Caption di atas, SUMBER di bawah, dan setiap artefak dipanggil di prosa | 5.2 |
| DT-16 | Tabel hanya bergaris mendatar; tanpa garis tegak dan tanpa kepala berisi warna | 5.1 |
| DT-17 | Satuan di kolom sendiri; numeral mono rata kanan | 5.1 |
| DT-18 | Zebra hanya di atas 12 baris dan tidak pernah di BoQ cetak | 5.1 |
| DT-19 | Tabel spesifikasi membawa kondisi uji | 5.3 |
| DT-20 | Aside bergaris menggantikan kotak callout | 5.4 |
| DT-21 | Angka beban keputusan membawa tanda provenans | 5.5 |
| DT-22 | Tanda sekali per klausa di prosa; kelebihannya pindah ke rel atau tabel | 5.5 |
| DT-23 | Angka diikat ke register kuantitas dan diaudit di gerbang | 5.6 |
| DT-24 | Turunan memeriksa aritmetikanya dan ditutup akibat bila asumsi gagal | 5.7 |
| DT-25 | Klaim eksternal membawa digraf Admiralty | 5.8 |
| DT-26 | Pernyataan ke depan memakai pita ICD 203 | 5.8 |
| DT-27 | Register asumsi berdampak; ID REQ tidak berubah sepanjang paket | 5.9 |
| DT-28 | Klasifikasi mengikuti skema penerima | 6.1 |
| DT-29 | Hanya regulasi yang hidup yang dikutip | 6.2 |
| DT-30 | Numeral Indonesia; spasi nilai dan satuan; setiap ± menyatakan artinya | 6.5 |
| DT-31 | PPN dihitung di rekapitulasi; terbilang dibangun kode | 6.4 |
| DT-32 | Surat pengantar mengikuti tata naskah dinas penerima | 6.3 |
| DT-33 | AHS mengikuti Permen PUPR No. 8 Tahun 2023 | 6.4 |
| DT-34 | Setiap pembedaan warna diulang bentuk, label, pola, atau posisi | 6.6 |
| DT-35 | Gambar teknik dibangun dari spec; Mermaid tidak dikirim | 9.2, 9.5 |
| DT-36 | Gambar selebar 128 mm atau 166 mm; PNG 300 dpi lewat helper | 9.4 |
| DT-37 | Setiap penghubung berlabel; satu aksen per gambar | 9.3 |
| DT-38 | Lint pembuka-jejak: tanpa KPI tile, callout, judul bertanya, sampul di tengah, garis tegak; tanda pisah panjang dibatasi | 16.1 |
| DT-39 | Spec dengan labels_verified false tidak masuk dokumen terbit | 9.2 |
| DT-40 | Workbook: kelas sheet, warna provenans, PETUNJUK, dan KENDALI | 15.1 |
| DT-41 | Headline brief berupa klaim; dek ditutup permintaan keputusan | 15.2 |
| DT-42 | Kegagalan lint mana pun memblokir rilis | 16.1 |
| DT-43 | Rel bukti yang kosong itu benar; jangan diisi agar terlihat sibuk | 4.7 |
| DT-44 | Satu notasi per gambar; zona kepercayaan tanpa isian | 9.3 |
| SUMBER SKILL.md DATUM v1.8 Rev J, diringkas penyusun. |  |  |

## T144 — Tabel A.2   Aturan chart, awalan CH.

| Nomor | Aturan | Rumah |
|---|---|---|
| CH-01 | Bar, column, dan area mulai dari nol | 7.3 |
| CH-02 | Kategori diurutkan kecuali urutannya alami | 7.3 |
| CH-03 | Satu aksen signal; konteks ink400 dan ink200 | 7.3, 7.4 |
| CH-04 | Label langsung; legenda hanya baris KUNCI | 7.3 |
| CH-05 | Tanpa judul di dalam plot; caption berupa kesimpulan | 7.3 |
| CH-06 | Tanpa 3D, dua sumbu Y, bayangan, gradien, bingkai | 7.3 |
| CH-07 | Pertanyaan chart ditulis dalam satu kalimat lebih dulu | 7.3 |
| CH-08 | Jenis chart dipilih dari kelompok tujuan | 7.3 |
| CH-09 | Jumlah kategori dan seri dalam batas praktis | 7.3 |
| CH-10 | Pesan tertangkap dalam lima detik oleh orang lain | 7.1 |
| CH-11 | Alert untuk melewati batas atau memburuk; verd untuk membaik | 7.4 |
| CH-12 | Nilai terhadap batas teknis memakai threshold | 7.5 |
| CH-13 | Deret KPI tile dan gauge hanya di layar hidup, tidak di dokumen | 7.7 |
| CH-14 | Chart khusus hanya bila chart default gagal | 7.1 |
| SUMBER Panduan Jenis Chart v1.1 diselaraskan ke DATUM. |  |  |

## T145 — Tabel A.3   Aturan simbol, awalan SM.

| Nomor | Aturan | Rumah |
|---|---|---|
| SM-01 | Jangan mengarang simbol standar; blok bernama lebih jujur | 10.1 |
| SM-02 | KAK dan kontrak klien didahulukan | 10.3 |
| SM-03 | Legenda rumah tercetak di lembar yang sama, bertanda bukan simbol standar | 10.3, 10.4 |
| SM-04 | Satu dialek simbol per gambar | 10.3 |
| SM-05 | Edisi standar yang dikutip adalah edisi berlaku pada Tabel 10.1 | 10.2 |
| SM-06 | Ikon vendor tidak diubah; ikon generik untuk proposal netral merek | 10.4 |
| SM-07 | Penandaan IEC 81346 sama di gambar, BoQ, dan uji terima | 10.5 |
| SM-08 | Lembar lengkap: blok judul, label setiap garis, sumber, revisi | 10.7 |
| SM-09 | Kerucut pandang kamera dihitung dari focal length dan sensor | 10.4 |
| SM-10 | Identitas militer lewat bentuk; rasio bingkai tidak diubah | 10.4 |
| SM-11 | Simbol dicocokkan ke dokumen standar sebelum terbit konstruksi | 10.4 |
| SM-12 | Simbol standar berbayar dibeli, tidak disalin | 10.7 |
| SUMBER Panduan Simbol Engineering v1.0 dan references/09 DATUM. |  |  |

## T146 — Tabel A.4   Aturan gaya bahasa, awalan SG, dengan judul aturan.

| Nomor | Judul aturan | Rumah |
|---|---|---|
| SG-L0-01 | Dokumen menyatakan identitasnya sendiri di muka | 12.1 |
| SG-L0-02 | Jangkar konkret sebelum abstraksi | 12.1 |
| SG-L0-03 | Penutup menyebut aksi dan penerimanya | 12.1 |
| SG-L0-04 | Rekap kebutuhan pembaca dengan istilah pembaca | 12.1 |
| SG-L0-05 | Urutan pembuka ditetapkan per kanal di muka | 12.1 |
| SG-L1-01 | Payung otoritas sebelum konten teknis | 12.2 |
| SG-L1-02 | Unit panjang dibuka dengan taruhannya | 12.2 |
| SG-L1-03 | Peta urutan dinyatakan eksplisit | 12.2 |
| SG-L1-04 | Angka tinggal di struktur, prosa membaca dampak | 12.2 |
| SG-L1-05 | Definisi kerja punya label cakupan dan pemilik | 12.2 |
| SG-L1-06 | Kebutuhan ukur dulu, rumus menyusul, contoh menempel | 12.2 |
| SG-L1-07 | Anatomi pesan pendek: satu usul yang bisa dijawab ya atau tidak | 12.2 |
| SG-L1-08 | Penutup unit panjang: batas berlaku atau nilai profesi | 12.2 |
| SG-L1-09 | Satu gagasan satu rumah | 12.2 |
| SG-L1-10 | Momen pembalik di badan dokumen | 12.2 |
| SG-L2-01 | Kalimat pertama langsung ke objek bidang | 12.3 |
| SG-L2-02 | Fakta negatif disusun, lalu ditutup klausa konsekuensi | 12.3 |
| SG-L2-03 | Kata sifat ditempel angka, atau tidak dipakai | 12.3 |
| SG-L2-04 | Janji jumlah ditepati di medium yang dijanjikan | 12.3 |
| SG-L2-05 | Objek dulu, label menyusul | 12.3 |
| SG-L2-06 | Artefak visual dipanggil dan dibicarakan | 12.3 |
| SG-L2-07 | Kelebihan dan kerugian dipasang bersebelahan | 12.3 |
| SG-L2-08 | Zona abu-abu dibuka, lalu satu angka kerja ditetapkan | 12.3 |
| SG-L2-09 | Satu paragraf satu tugas; lebih pindah medium | 12.3 |
| SG-L3-01 | Norma dikutip literal, bukan diparafrase | 13.1 |
| SG-L3-02 | Keputusan ditulis sebagai tetapan, alasan menyusul, penangkis pada napas yang sama | 13.1 |
| SG-L3-03 | Larangan dan aturan pakai membawa sebabnya dalam kalimat yang sama | 13.1 |
| SG-L3-04 | Koreksi miskonsepsi memakai kontras eksplisit, per kejadian | 13.1 |
| SG-L3-05 | Angka tidak pernah telanjang; mark provenans sekali per klausa | 13.1 |
| SG-L3-06 | Permintaan dibuat mudah dijawab | 13.1 |
| SG-L3-07 | Ambang terima satu kalimat: angka, kondisi, aksi | 13.1 |
| SG-L3-08 | Ritme adalah selang panjang-pendek, bukan seragam satu kutub | 13.1 |
| SG-L3-09 | Setiap kalimat punya subjek dan predikat; rantai fragmen titik-koma dilarang | 13.1 |
| SG-L4-01 | Pelaku keputusan adalah manusia atau institusi, bukan alat | 13.2 |
| SG-L4-02 | Kapitalisasi penuh sebagai penegas semantik, bukan dekorasi | 13.2 |
| SG-L4-03 | Namespace penulis didefinisikan lalu dipakai disiplin; identifier jalur data pindah ke tabel | 13.2 |
| SG-L4-04 | Istilah Inggris utuh tanpa italic dekoratif; padanan lazim jadi kepala | 13.2 |
| SG-L4-05 | Waktu dianchor ke zona penerima; uang bernilai dipasang terbilang | 13.2 |
| SG-L4-06 | Satu kelas nilai, satu konvensi per berkas | 13.2 |
| SG-L4-07 | Status keyakinan angka dileksekankan eksplisit | 13.2 |
| SG-L4-08 | Konsistensi sempurna adalah jejak mesin; field beban-rilis tetap mutlak | 13.2 |
| SG-L4-09 | Daftar hitam hanya kelas ber-alasan-bukti; kelas tersangkal dilarang naik | 13.2 |
| SG-L4-10 | Glosarium kendali adalah pemutus padanan | 13.2 |
| SG-L5-01 | Klaim beban keputusan menunjukkan kelas asalnya | 13.3 |
| SG-L5-02 | Kredensial satu klausa, rekam jejak menggantikan kata sifat | 13.3 |
| SG-L5-03 | Batasan faktual ditutup jalan keluar | 13.3 |
| SG-L5-04 | Klaim performa diikat ke norma atau angka pihak ketiga | 13.3 |
| SG-L5-05 | Ketidakpastian dikonversi menjadi instruksi | 13.3 |
| SG-L5-06 | Ketelitian dijustifikasi mode kegagalan | 13.3 |
| SG-L5-07 | Nada mengajar: superlatif diberi rem | 13.3 |
| SG-L5-08 | Pengacaraan institusional Indonesia, bukan kamu | 13.3 |
| SG-L5-09 | Rumusan M-4: kedalaman dari apparatur, keringkasan dari medium | 13.3 |
| SG-L6-01 | Plafon kepadatan klausa (C-26) | 14.2 |
| SG-L6-02 | Plafon rata-rata panjang kalimat (C-27) | 14.2 |
| SG-L6-03 | Penanda blok aparatus dan kutipan (perluasan D16, usulan D18) | 14.2 |
| SG-L6-04 | Daftar putih struktural C-14 | 14.2 |
| SG-L6-05 | Batas kata pada daftar hitam A4 | 14.2 |
| SG-L6-06 | Sapaan institusional ditagih di K2 (C-20 + C-34) | 14.2 |
| SG-L6-07 | Momen pembalik benar-benar ditagih (C-24) | 14.2 |
| SG-L6-08 | Kanon satu-pemecah dan lapis baca (integritas ukur) | 14.2 |
| SG-L6-09 | Monitor rasio pembuka (INFO dulu) | 14.2 |
| SG-L6-10 | Subjek keputusan adalah manusia (C-28) | 14.2 |
| SG-L6-11 | Kerapatan objek bidang (C-29) | 14.2 |
| SG-L6-12 | Identifier skema pindah ke tabel (C-30) | 14.2 |
| SG-L6-13 | Densitas provenans sebaris (C-31) | 14.2 |
| SG-L6-14 | Konsistensi konvensi numerik (C-33) | 14.2 |
| SG-L6-15 | Anggaran pemindai: kelas tersangkal turun ke INFO, C-32 beku | 14.2 |
| SG-L6-16 | Rubrik juri sebagai instrumen resmi aturan berjuri | 14.2 |
| SUMBER STD-GAYA-AHLI-001 rev G. Pernyataan lengkap di tabel rumahnya. |  |  |

## T147 — Tabel B.1   Dua puluh butir periksa pra-serah terpadu.

| Cek | Butir | Aturan |
|---|---|---|
| ☐ | Tier ditetapkan dengan uji satu kalimat; nomor diambil dari Register Induk | DT-02, DT-04 |
| ☐ | Kanal dan audiens ditetapkan; urutan pembuka sesuai kanal | SG-L0-05 |
| ☐ | Halaman pertama: jenis dokumen, penyusun, kebutuhan, satu jangkar terukur | SG-L0-01, L0-02 |
| ☐ | Klasifikasi sesuai skema penerima; regulasi yang dikutip hidup | DT-28, DT-29 |
| ☐ | Angka beban terikat ke register dan bertanda; tanda maks. sekali per klausa | DT-21 sampai DT-23 |
| ☐ | Setiap tabel dan gambar: caption, SUMBER, dipanggil di prosa | DT-15 |
| ☐ | Tabel: garis mendatar, kolom satuan, numeral mono, tanpa isian | DT-16, DT-17 |
| ☐ | Chart: pertanyaan satu kalimat, satu aksen, caption kesimpulan, mulai nol | CH-01 sampai CH-07 |
| ☐ | Gambar teknik dari spec; labels_verified true; satu dialek; legenda | DT-35, DT-39, SM-04 |
| ☐ | Satuan berspasi, ± berarti, numeral Indonesia, satu varian per berkas | DT-30, SG-L4-06 |
| ☐ | Kalimat berpredikat; titik-koma maks. 5,4 per 1.000 kata; ritme berselang | SG-L3-08, L3-09 |
| ☐ | Pelaku keputusan manusia; tanpa identifier skema di prosa | SG-L4-01, L4-03 |
| ☐ | Sapaan institusional di kanal resmi; tanpa kamu | SG-L5-08 |
| ☐ | Momen pembalik di badan dokumen tebal | SG-L1-10 |
| ☐ | Penutup menyebut aksi dan penerima | SG-L0-03 |
| ☐ | datumcheck bersih; lint berkas 27 dari 27; lint bangun bersih | DT-42 |
| ☐ | SERAH: audit angka, dua juri buta mencapai LEPAS, pemeriksa independen | 14.6, 16.3 |
| ☐ | Uji fotokopi: cetak 100 %, fotokopi dua kali, baca 40 cm | DT-11, DT-34 |
| ☐ | Nama berkas sama dengan judul, tanpa garis bawah; catatan perubahan ditulis | DT-12 |
| ☐ | Kolofon: pernyataan jujur berbahasa pembaca | 16.6 |
| SUMBER Penggabungan daftar periksa DATUM, Chart, Simbol, dan Gaya Ahli oleh penyusun. |  |  |

## T148 — Tabel C.1   Glosarium kendali: nasib istilah asing.

| Kelas istilah | Perlakuan | Contoh |
|---|---|---|
| Nama produk, model, merek, nomor standar | Pertahankan apa adanya, ejaan konsisten | Uniview IPC3734SS-ADZKM-F3-NB; IEC 61280-4-2 |
| Protokol atau antarmuka berbentuk token teknis | Pertahankan dengan label manusia saat muncul pertama | ONVIF Profile S; SNMP; SHA-256 |
| Istilah umum berpadanan baku | Wajib padanan, bentuk asli di kurung sekali | pemantauan (monitoring); reviu (review); peta jalan (road map) |
| Padanan belum mapan di bidang | Pertahankan, definisikan sekali, tanpa miring setengah hati | chain of custody; hot-swap; loss budget |
| Idiom korespondensi Inggris | Konsistensi rumah dengan satu penutup kanonis | Kind regards, dipertahankan |
| Pasangan sementara | Belum wajib; jangan diajarkan sebagai aturan | cadangan (backup); pemulihan (rollback) |
| SUMBER STD-GAYA-AHLI-001 Lampiran L.B, salinan kerja. |  |  |

## T149 — Tabel C.2   Istilah kunci manual ini.

| Istilah | Arti dalam manual ini | Rumah |
|---|---|---|
| Aparatus | Seluruh perangkat yang membuktikan isi: tanda provenans, turunan, sumber, register, rel bukti | 2.1 |
| Provenans | Asal sebuah angka: terukur, diturunkan, pemasok, atau asumsi | 5.5 |
| Rel bukti | Kolom luar 32 mm yang membawa tanda, sumber, dan ID di samping klaim | 4.7 |
| Register kuantitas | Berkas yang ditulis rantai hitung; satu-satunya sumber angka dokumen | 5.6 |
| Turunan | Blok aritmetika bernomor D-bab.urutan yang ditutup akibat bila asumsi gagal | 5.7 |
| Tier | Tingkat kemasan artefak: NOTA, TERBIT, SERAH | 3.1 |
| Kanal | Medium dan pembaca sasaran: chat, surat, dokumen, dek, notifikasi, workbook | 16.5 |
| Lapis | Granularitas keputusan bahasa L0 sampai L6 | 11.2 |
| Dialek | Satu keluarga simbol dari satu standar; satu gambar satu dialek | 10.3 |
| Legenda rumah | Simbol buatan GSP untuk hal tanpa standar; legendanya wajib dicetak | 10.4 |
| Penandaan acuan | Kode IEC 81346 =fungsi +lokasi -produk yang sama di gambar, BoQ, dan uji | 10.5 |
| Aksen | Satu-satunya warna penekanan, signal #B45309, pada satu subjek | 7.4 |
| Threshold | Chart nilai terhadap garis batas berlabel; yang melewati batas bertinta alert | 7.5 |
| LEPAS | Ambang rubrik juri yang sah sebagai pintu rilis | 14.4 |
| Momen pembalik | Titik di badan dokumen tempat pemahaman berubah arah | 12.2 |
| SUMBER Disusun penyusun dari keempat sumber. |  |  |

## T150 — Tabel D.1   Dokumen sumber manual ini.

| Dokumen | Versi, tanggal | Bahasa, halaman | Klasifikasi | Dipakai di |
|---|---|---|---|---|
| DATUM House Style Explained, 000-GSP-STD-X-2026 | Rev A, 3 Oktober 2026 | Inggris, 44 | BIASA | Bab 2 sampai 6, 9, 15 sampai 17 |
| Panduan Memilih dan Membuat Chart | v1.1, 7 Oktober 2026 | Indonesia | tidak ada | Bab 7, 8 |
| Panduan Simbol Engineering untuk Diagram dan Skematik Teknik PT GSP | v1.0, 7 Oktober 2026 | Indonesia | BIASA | Bab 9, 10, 17 |
| Manual Gaya Bahasa Ahli GSP, STD-GAYA-AHLI-001 | rev G, edisi pembaca v1.3, 7 Oktober 2026 | Indonesia, 96 | TERBATAS | Bab 11 sampai 14, 16 |
| Skill datum-house-style: SKILL.md, tokens.json, references, scripts | v1.8 Rev J, 14 Agustus 2026 | Inggris | – | Seluruh bentuk dan mesin |
| SUMBER Berkas unggahan permintaan penyusunan dan skill terpasang, dibaca 8 Oktober 2026. PROVENANS ■ TERUKUR. |  |  |  |  |

## T151 — Tabel D.2   Sumber eksternal yang dikutip lewat dokumen sumber.

| Sumber | Dipakai untuk |
|---|---|
| Datylon, 80 types of charts and graphs; Chart Library | Katalog chart Bab 8 |
| Holistics, 40+ Chart Types | Katalog chart dan prinsip dashboard |
| ISA, siaran pers ISA-5.1-2024 (Oktober 2024) | Edisi ISA-5.1 |
| SIA, AG-01 Architectural Graphics for Security | Simbol keamanan |
| ISO 5807:1985, dikonfirmasi 2019 | Diagram alir |
| SCC Kanada, IEC 60617:2026 DB | Edisi IEC 60617 |
| The Open Group, ArchiMate 4 | Arsitektur enterprise |
| EVS, ISO 7010:2019/Amd 9:2025 | Rambu keselamatan |
| Cisco, Network Topology Icons | Ketentuan ikon vendor |
| Kementerian PANRB, KAK portal arsitektur SPBE 2024 | Kebutuhan BPMN dan UML |
| SUMBER Panduan Jenis Chart Bab 11 dan Panduan Simbol Bab 11. Tidak diperiksa ulang daring dalam penyusunan ini. |  |
