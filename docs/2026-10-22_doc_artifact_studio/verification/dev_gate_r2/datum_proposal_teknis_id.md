# Konformitas DATUM Rev A: datum-proposal-teknis (ID, SERAH)

Putusan: **FAIL**

- cakupan butir 39.7 % < 85 %

| Ukuran | Nilai | Ambang | Lulus |
|---|---|---|---|
| Skor terukur | 94.0 % (63/67) | >= 85 % | ya |
| Aturan kritis | 4/4 | semua | ya |
| Cakupan butir | 39.7 % | >= 85 % | tidak |
| Bentrok teks | 0 | 0 | ya |

## Masukan

| Medan | Nilai |
|---|---|
| DOCX | C:/tmp/s36r2/out/datum-proposal-teknis.docx |
| sha256 | 3f58e446f5da2d6ed4242d4021e64c1e8d2ccef0e843a9ae8f3fa76f2aaa6cbf |
| Kode jenis / kicker | PT / PROPOSAL TEKNIS |
| Sampel | producedBy=mcp, copyControl=false, agentRevisionText=false |
| B-FIX | C:/tmp/s36r2/bfix/datum-proposal-teknis.docx |
| Spec templat | ada |
| Mode | aturan belum terimplementasi = UNEXERCISED |
| Struktur (R0) | 5 seksi; sampul 0, lembar kendali 1, daftar isi 2; pembungkus [0, 1, 2]; interior 2; pita segel 3; footer register 2 |
| Dibuat | 2026-11-04T14:53:55.156Z |

## Skor per keluarga

Aturan terukur katalog 76, terimplementasi 81, berlaku untuk pasangan ini 72.

| Keluarga | Lulus | Penyebut |
|---|---|---|
| CR | 4 | 4 |
| CV | 14 | 14 |
| CS | 5 | 5 |
| RH | 2 | 3 |
| RB | 6 | 7 |
| SB | 2 | 3 |
| IS | 3 | 3 |
| GF | 12 | 13 |
| DV | 1 | 1 |
| NU | 4 | 4 |
| TR | 3 | 3 |
| NC | 1 | 1 |
| LB | 6 | 6 |

## Aturan kritis

| Kode | Status | Bukti |
|---|---|---|
| CR-1 | pass | klasifikasi "TERBATAS" (ANRI, kapital) identik di kepala halaman, register, dan pita segel (2 seksi interior) |
| CR-2 | pass | nomor "009/GSP/PT/XI/2026" cocok pola, kode PT, sama di 3 lokasi |
| CR-3 | pass | konvensi ID terpenuhi di sampel dan B-FIX; harapan B-FIX "1.250.000,5", "Rp 1.385.946.000", "25 %", "0,5" ada |
| CR-4 | pass | 0 token EN di 40 lokasi pembungkus; penanda ID lengkap |

## Bentrok teks

Detektor teks pembungkus gagal: tidak ada.
PDF C:/tmp/s36r2/out/datum-proposal-teknis.pdf (5 halaman): 0 bentrok.

| Jenis | Kode | Jumlah |
|---|---|---|
| overlap | G-01 | 0 |
| out_of_page | G-02 | 0 |
| out_of_margin | G-03 | 0 |
| clipped | G-04/G-05 | 0 |
| overflow | G-06 | 0 |

## Cakupan butir

39.7 % (11.5/29) dari docs/2026-10-22_doc_artifact_studio/verification/coverage/datum_point_coverage.json.

## Hasil per aturan

| Kode | Keluarga | Butir | Kritis | Status | Bukti |
|---|---|---|---|---|---|
| CR-1 | CR | Penandaan klasifikasi | ya | pass | klasifikasi "TERBATAS" (ANRI, kapital) identik di kepala halaman, register, dan pita segel (2 seksi interior) |
| CR-2 | CR | Pola nomor dokumen dan daftar kode tertutup tanpa DS | ya | pass | nomor "009/GSP/PT/XI/2026" cocok pola, kode PT, sama di 3 lokasi |
| CR-3 | CR | Konvensi angka per bahasa | ya | pass | konvensi ID terpenuhi di sampel dan B-FIX; harapan B-FIX "1.250.000,5", "Rp 1.385.946.000", "25 %", "0,5" ada |
| CR-4 | CR | Bahasa teks pembungkus | ya | pass | 0 token EN di 40 lokasi pembungkus; penanda ID lengkap |
| CV-01 | CV | Urutan unsur sampul 1-11 | - | pass | unsur sampul berurutan E1..E11 (8 unsur dikenali) |
| CV-02 | CV | Pita segel = unsur pertama sampul | - | pass | blok pertama SAMPUL = tabel pita segel |
| CV-03 | CV | Lebar logo 44-46 mm | - | pass | lebar logo dalam 44-46 mm |
| CV-04 | CV | Logo sekali di seluruh dokumen, hanya di sampul | - | pass | logo dirujuk sekali, hanya di SAMPUL, tidak di header/footer |
| CV-05 | CV | Baris alamat persis, 7 pt | - | pass | baris alamat persis, 7 pt |
| CV-06 | CV | Datum Rule 166 mm di sampul | - | pass | Datum Rule 166 mm ada di SAMPUL |
| CV-07 | CV | Kicker jenis dokumen = kicker pasangan | - | pass | kicker = "PROPOSAL TEKNIS", tampil kapital |
| CV-08 | CV | Bentuk kicker: 7,4 pt Cond seal | - | pass | kicker 7,4 pt Cond seal +0,20 em |
| CV-09 | CV | Ukuran judul 24-26 pt | - | pass | judul sampul 24-26 pt |
| CV-10 | CV | Standfirst 10,5 pt Serif miring (bila ada) | - | na | standfirst tidak ada (unsur 8 bersyarat) |
| CV-11 | CV | Baris cakupan 7,6 pt Cond (bila ada) | - | na | baris cakupan tidak ada (unsur 9 bersyarat) |
| CV-12 | CV | Blok kendali 4 x 2, label 6,4 pt Cond, nilai 7,4 pt Mono, garis 0,45 mm | - | pass | blok kendali 4 kolom <= 4 baris, label 6,4 pt Cond, nilai 7,4 pt Mono, garis atas 0,45 mm |
| CV-13 | CV | Medan inti blok kendali berurutan | - | pass | medan inti berurutan: number, rev, author |
| CV-16 | CV | Kolofon kiri persis | - | pass | kolofon kiri persis |
| CV-17 | CV | String punggung di sampul | - | pass | string punggung ada di SAMPUL |
| CV-18 | CV | Semua unsur sampul rata kiri pada 24 mm | - | pass | unsur sampul rata kiri pada 24 mm |
| CS-01 | CS | Lembar kendali menyusul sampul dan dibuka pita segel | - | pass | LEMBAR KENDALI = pembungkus kedua, dibuka pita segel |
| CS-02 | CS | Kicker lembar kendali per bahasa | - | pass | kicker dan judul lembar kendali = "Lembar Kendali" |
| CS-03 | CS | Judul blok berhuruf berurutan per bahasa | - | pass | 2 judul blok berurutan |
| CS-04 | CS | Kepala kolom tabel per bahasa | - | pass | kepala kolom revision, verification = daftar ID |
| CS-07 | CS | Riwayat revisi ada | - | pass | riwayat revisi 1 baris data |
| CS-10 | CS | Setiap salinan bernomor punya pemegang bernama (bersyarat) | - | na | pita segel tanpa nomor salinan (salinan induk); tidak ada salinan bernomor untuk diperiksa |
| RH-01 | RH | Kepala halaman menyebut bab di halaman itu, tanpa logo | - | pass | 2 kepala halaman bab memuat entitas dan label bab BAB; tanpa gambar di header |
| RH-03 | RH | Garis kepala seal 0,26 mm | - | fail | header word/header4.xml (seksi 3): garis single/C3CBD1/sz 5, harapan 6E1420/sz 6+-1 (+1 temuan lain) |
| RH-04 | RH | Teks kepala ink400 | - | pass | teks kiri kepala halaman 6B7783 di 2 header interior |
| RB-01 | RB | Blok register di kaki setiap halaman interior | - | pass | 2 seksi interior berblok register dengan medan PAGE |
| RB-02 | RB | Urutan sel register, klasifikasi terakhir, kata per bahasa | - | pass | urutan sel register benar (LEMBAR/DARI, klasifikasi terakhir) di 2 footer interior |
| RB-03 | RB | Jumlah lembar dari NUMPAGES, pemisah NBSP | - | pass | medan PAGE/NUMPAGES ada dan semua spasi literal register = NBSP di 2 footer |
| RB-04 | RB | Nomor dokumen dan nomor lembar tebal ink900 | - | pass | nomor dokumen dan nomor lembar tebal 101418 di 2 footer |
| RB-05 | RB | Garis register: atas seal 0,35 mm, bawah ink200 0,20 mm | - | fail | word/footer4.xml (seksi 3): sel 1 garis atas single/101418/sz 8, harapan 6E1420/sz 8+-1 (+7 temuan lain) |
| RB-06 | RB | Tanggal register DD-<Romawi>-YYYY | - | pass | tanggal register 04-XI-2026 berformat DD-<Romawi>-YYYY |
| RB-07 | RB | Halaman depan tanpa blok register | - | pass | 3 seksi pembungkus tanpa blok register maupun medan PAGE/NUMPAGES |
| SB-01 | SB | Pita segel di kepala sampul dan lembar kendali, boleh di daftar isi, tidak di interior | - | pass | pita segel di kepala SAMPUL dan LEMBAR KENDALI; 2 seksi interior tanpa pita segel |
| SB-02 | SB | Bentuk pita: isian seal, teks F4F5F6, 5 x 166 mm | - | fail | pita segel 1: warna teks F6E9E9, harapan F4F5F6 (+5 temuan lain) |
| SB-03 | SB | Teks pita per bahasa | - | pass | teks pita ID benar di 3 pita segel |
| IS-01 | IS | Format cap terbit per bahasa | - | pass | cap terbit "// 20261104 ID T -- TERBITAN 1" sesuai format ID |
| IS-02 | IS | Konsistensi cap terbit (tanggal, kelas, bahasa) | - | pass | cap terbit konsisten: tanggal 20261104, bahasa ID, kelas T |
| IS-03 | IS | Cap terbit seal tebal | - | pass | cap terbit tebal 6E1420 |
| GF-01 | GF | Halaman A4 | - | pass | 5 seksi A4 11906x16838 tw |
| GF-02 | GF | Grid mendatar 24 + 166 + 20 mm | - | pass | 5 seksi tegak bergrid 24 + 166 + 20 mm |
| GF-03 | GF | Batas tegak interior 13 / 26 / 273 / 284 mm | - | pass | 2 seksi interior berbatas tegak 13/26/273/284 mm |
| GF-04 | GF | Hanya Plex; tanpa Calibri, Times New Roman, Aptos, Arial | - | pass | tanpa Calibri, Times New Roman, Aptos, atau Arial di teks, docDefaults, dan gaya yang dipakai |
| GF-05 | GF | Fon tertanam di DOCX | - | pass | 3 fon Plex tertanam: IBM Plex Sans Cond, IBM Plex Mono, IBM Plex Serif |
| GF-06 | GF | Badan 9,5 / 13,5 pt Serif | - | pass | gaya badan (tanpa pStyle) (4/4 paragraf isi): IBM Plex Serif, sz 19, baris 270/exact (4/4 paragraf) |
| GF-07 | GF | Kicker bab 6,8 pt Cond kapital signal (bersyarat) | - | na | tidak ada kicker bab (kicker ditekan di semua bab) |
| GF-09 | GF | Lantai garis 0,18 mm (w:sz >= 5) | - | pass | 88 garis, semuanya sz >= 5 (0,18 mm) |
| GF-10 | GF | Tidak ada unsur lebih lebar dari 166 mm | - | pass | tidak ada gambar atau tabel lebih lebar dari 166 mm |
| GF-11 | GF | Gambar isi selebar 128 atau 166 mm (bersyarat) | - | pass | 1 gambar isi selebar 128 atau 166 mm |
| GF-12 | GF | Navy dan emas pensiun | - | pass | warna pensiun 1A2B4A, C9A84C tidak ada di bagian XML dan SVG |
| GF-13 | GF | Teks klasifikasi seal tebal | - | fail | header word/header4.xml (seksi 3): klasifikasi tebal=true warna=101418, harapan tebal 6E1420 (+3 temuan lain) |
| GF-14 | GF | Setiap bab di seksi Word baru | - | pass | 2 judul bab masing-masing membuka seksi Word sendiri |
| GF-15 | GF | Judul bernomor maks. tiga tingkat | - | pass | judul bernomor paling dalam tiga tingkat (tanpa outline >= 3, tanpa Heading 4-9) |
| DV-01 | DV | Datum Rule di atas judul bab | - | pass | Datum Rule 4608000 EMU di atas 2 judul bab |
| NU-02 | NU | Kode jenis konsisten di nomor, string punggung, dan templat | - | pass | kode PT sama di nomor (3 lokasi) dan string punggung |
| NU-03 | NU | Spec templat doc.typeCode = daftar Rev A tanpa DS dengan NDA (dari tabel spec) | - | pass | spec datum-proposal-teknis: doc.typeCode = daftar Rev A (14 kode, NDA, tanpa DS); kode, tier, bahasa, kicker = pasangan |
| NU-05 | NU | Revisi tanpa desimal | - | pass | revisi tanpa desimal: A |
| NU-07 | NU | Bulan Romawi dan tahun nomor = tanggal dokumen | - | pass | bulan Romawi dan tahun nomor = tanggal register di 2 footer |
| TR-01 | TR | Tier efektif = tier bawaan pasangan | - | pass | tier sampul = SERAH |
| TR-03 | TR | TERBIT/SERAH: sampul, lembar kendali, tanda tangan, daftar isi sebelum Bab 1 | - | pass | SAMPUL, LEMBAR KENDALI, DAFTAR ISI berurutan sebelum interior; tanda tangan di pembungkus |
| TR-08 | TR | Daftar isi sampai tingkat seksi | - | pass | medan TOC sampai tingkat seksi (\o "1-n", n >= 2) |
| NC-04 | NC | Tanggal panjang (REVISI sampul) dengan nama bulan bahasa itu | - | pass | tanggal panjang "A · 4 November 2026" bernama bulan ID |
| LB-01 | LB | Label blok kendali sampul per bahasa (Prepared by) | - | pass | 5 label blok kendali ID: Nomor dokumen, Revisi, Penyusun, Tier, Bahasa |
| LB-02 | LB | Satu judul daftar isi per bahasa | - | pass | satu judul "Daftar Isi" di seksi DAFTAR ISI 2 |
| LB-03 | LB | Kicker pembuka bab per bahasa (bersyarat) | - | na | tidak ada kicker pembuka bab (judul bab membawa nomor sumber) |
| LB-06 | LB | Peran tanda tangan per bahasa (sampel MCP) | - | pass | peran tanda tangan ID: Disusun |
| LB-09 | LB | Label aparatus per bahasa (bersyarat) | - | pass | 2 keterangan dan 2 label aparatus berbahasa ID |
| LB-10 | LB | Catatan revisi bawaan per bahasa (bersyarat) | - | pass | catatan revisi bawaan "Terbit pertama" |
| LB-11 | LB | Peran rantai verifikasi per bahasa (sampel MCP) | - | pass | peran rantai verifikasi ID: Penyusun |
| X-01 | X | Dua bahasa di teks pembungkus | - | pass | teks pembungkus satu bahasa (token ID 38, token EN 0) |
| X-02 | X | Dua kode jenis | - | pass | kode jenis tunggal PT dari 5 sumber |
| X-03 | X | Dua kicker | - | pass | kicker sampul memuat paling banyak satu nama jenis (1 paragraf kicker diperiksa) |
| X-04 | X | Dua klasifikasi | - | pass | klasifikasi tunggal "TERBATAS" di 7 lokasi |
| X-05 | X | Kode bahasa bertentangan | - | pass | kode bahasa tunggal ID (cap terbit (seksi 0 (cover) cap terbit), string punggung (seksi 0 (cover) string punggung), bahasa teks pembungkus) |

Tidak berlaku untuk pasangan ini: RB-08, TR-02, TR-04, AC6-03.
