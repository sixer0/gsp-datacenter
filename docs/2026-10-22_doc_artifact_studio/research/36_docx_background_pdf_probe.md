---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: C03
date: 2026-11-05
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/03_structured_datum_coverage_round.md
document: research/36_docx_background_pdf_probe.md
evidence_tier: 3 (keluaran mekanis: perintah + keluaran + piksel terukur)
question: GF-19 (DATUM ID:2528-2533) - apakah LibreOffice 24.2 menghormati latar halaman DOCX saat ekspor PDF?
status: complete
---

# Probe GF-19: latar halaman DOCX (`w:background`) ke PDF lewat LibreOffice 24.2

## 1. Verdict

**HONOURS, dengan syarat.** LibreOffice 24.2 menulis latar halaman ke PDF hanya bila
`word/document.xml` memuat `<w:background w:color="RRGGBB"/>` **dan** `word/settings.xml`
memuat `<w:displayBackgroundShape/>`. Tanpa `displayBackgroundShape`, `w:background`
**diabaikan** (halaman putih #FFFFFF, identik dengan kontrol).

Syarat dan batasan (semuanya terukur, bagian 4-6):

1. `w:displayBackgroundShape` **wajib**. Hanya `w:background` = putih.
2. Perintah repo (`--convert-to pdf`, tanpa opsi filter) sudah cukup; repo tidak memakai opsi filter khusus (bagian 3).
3. Warna keluar tepat: #FCFCFB -> (252,252,251), #FBFAF7 -> (251,250,247), #FFE0E0 -> (255,224,224). Operator isian PDF = nilai hex asli.
4. Berlaku pada **semua halaman** dan semua section (termasuk section lanskap), seluas penuh halaman (kotak isian `-0.1,0,612,792` pada halaman Letter).
5. **Hanya satu latar per dokumen**: `w:background` adalah anak tunggal `w:document`, tidak bisa per-section. Pada uji 3 section semuanya sama. Jadi #FCFCFB (halaman badan) dan #FBFAF7 (halaman pembungkus) **tidak dapat berbeda lewat `w:background`**; warna beda per halaman butuh mekanisme lain (tidak diuji, bagian 7).
6. Ekspor PDF/A (`SelectPdfVersion` 1 atau 2): operator isian tetap sama persis, tetapi rasterisasi PyMuPDF menunjukkan pergeseran 1 unit per kanal (mis. #FCFCFB terbaca #FBFCFA). Itu efek profil ICC OutputIntent saat render, bukan isi PDF (bagian 5).

## 2. Delivery path (dry-run-verify-fix, Phase 1)

- Dihasilkan: 7 DOCX uji (a-g) + PDF-nya di `C:/tmp/c03` (di luar repo). Tidak ada kode repo diubah, tidak ada commit, tidak ada pemasangan.
- Validasi: konversi dengan perintah identik repo, render halaman ke piksel dengan PyMuPDF, bandingkan RGB area kosong dengan warna target; cek aliran konten PDF.
- Hasil yang diharapkan: area kosong = warna target bila dihormati, #FFFFFF bila diabaikan.
- Siklus perbaikan: 0 (semua langkah lulus pada percobaan pertama).

## 3. Perintah konversi yang dipakai repo (diverifikasi dari kode)

- `benchmark/datum_conformance/clash/clash.py:684-686` (`convert_docx`):
  `[soffice, "--headless", "--norestore", "--nologo", "--nodefault", "--nolockcheck", "-env:UserInstallation=<profil as_uri>", "--convert-to", "pdf", "--outdir", <out>, <in.docx>]`, soffice bawaan `C:\Program Files\LibreOffice\program\soffice.com` (`clash.py:75`).
- Studio: `src/lib/studio/engine/soffice/service.ts:203-217` (argumen sama; `--convert-to` pada baris 211 hanya `pdf`, tidak ada nama filter atau JSON opsi). `grep -n "filter|writer_pdf_Export|convert-to"` pada service.ts menghasilkan hanya baris 211.
- Repo tidak memiliki `w:background`/`displayBackgroundShape` hari ini: `grep -rln "w:background\|displayBackgroundShape" src benchmark` tanpa hasil.
- Folder kerja pendek `C:/tmp/c03` dipakai (profil `file:///C:/tmp/c03/p`, 14 karakter jalur profil) sesuai catatan MAX_PATH (`research/34` butir 5, 20).

Perintah yang dijalankan (Git Bash), tiap kasus:

```
SOF="C:/Program Files/LibreOffice/program/soffice.com"
"$SOF" --headless --norestore --nologo --nodefault --nolockcheck \
  "-env:UserInstallation=file:///C:/tmp/c03/p" --convert-to pdf \
  --outdir C:/tmp/c03/out/<kasus> C:/tmp/c03/work/<kasus>.docx
```

Keluaran representatif: `convert C:\tmp\c03\work\a_FCFCFB_dbs.docx as a Writer document -> C:\tmp\c03\out\a_FCFCFB_dbs\a_FCFCFB_dbs.pdf using filter : writer_pdf_Export` (waktu 7,5 s pada panggilan pertama = inisialisasi profil, 1,3 s sesudahnya). Baris stderr `Entity: line 1: parser error : Document is empty` muncul pada panggilan pertama profil baru; tidak menghalangi hasil (sama seperti `research/34` butir 19).

## 4. Pembangunan DOCX uji

Skrip: `C:/tmp/c03/bin/build.py` dan `build2.py` (python-docx 1.2.0 dari hermes venv, `python.exe -I`). Dasar = `docx.Document()` berisi satu judul dan satu paragraf (halaman Letter 612x792 pt, area kanan-bawah kosong). XML disisipkan lewat zip:

- `word/document.xml`: `<w:background w:color="RRGGBB"/>` disisipkan tepat sebelum `<w:body>` (urutan skema ECMA-376 17.2.1: `background` mendahului `body`).
- `word/settings.xml`: `<w:displayBackgroundShape/>` disisipkan setelah `<w:zoom .../>` (urutan `CT_Settings`).

Pemeriksaan XML hasil (keluaran nyata):

```
== a_FCFCFB_dbs   <w:background w:color="FCFCFB"/>   <w:zoom w:val="bestFit"/><w:displayBackgroundShape/>
== d_FFE0E0_dbs   <w:background w:color="FFE0E0"/>   <w:zoom w:val="bestFit"/><w:displayBackgroundShape/>
== c_control      (tanpa keduanya)
```

| Kasus | `w:background` | `displayBackgroundShape` |
|---|---|---|
| a_FCFCFB_dbs | FCFCFB | ada |
| b_FCFCFB_nodbs | FCFCFB | tidak ada |
| c_control | tidak ada | tidak ada |
| d_FFE0E0_dbs | FFE0E0 | ada |
| e_FFE0E0_nodbs | FFE0E0 | tidak ada |
| g_FBFAF7_dbs | FBFAF7 (warna halaman pembungkus) | ada |
| f_3sections_FFE0E0 | FFE0E0, 3 section (Letter, Letter, Letter lanskap) | ada |

## 5. Hasil terukur: RGB area kosong

Render: `pymupdf.Page.get_pixmap(dpi=144, alpha=False)`; skrip `C:/tmp/c03/bin/sample.py`. Titik uji: area kosong kanan-bawah (500,700 pt), tengah kosong (300,500), sudut kiri-atas (2,2), margin kiri (20,400), sudut kanan-bawah. Kelima titik memberi nilai sama pada setiap PDF.

| Kasus | RGB area kosong | Hex | Isian di PDF (`get_drawings`) | Putusan |
|---|---|---|---|---|
| a. FCFCFB + displayBackgroundShape | (252,252,251) | #FCFCFB | 1 isian `(0.9882,0.9882,0.9843)` rect `(-0.1,0,612,792)` | honours |
| b. FCFCFB tanpa displayBackgroundShape | (255,255,255) | #FFFFFF | tidak ada | ignores |
| c. kontrol (tanpa latar) | (255,255,255) | #FFFFFF | tidak ada | (kontrol) |
| d. FFE0E0 + displayBackgroundShape | (255,224,224) | #FFE0E0 | 1 isian `(1.0,0.8784,0.8784)` rect `(-0.1,0,612,792)` | honours |
| e. FFE0E0 tanpa displayBackgroundShape | (255,255,255) | #FFFFFF | tidak ada | ignores |
| g. FBFAF7 + displayBackgroundShape | (251,250,247) | #FBFAF7 | (lihat catatan) | honours |

Catatan g: `sample.py ... | head -4` hanya menampilkan 4 baris pertama; baris `drawings 1` pada keluarannya mengonfirmasi satu objek gambar, nilai isian tidak dicetak untuk kasus ini (piksel sudah tepat #FBFAF7).

Aliran konten halaman 1 (kasus a, mentah dari `Page.read_contents()`): `0.1 w\n/Artifact BMC\nq 0 0.028 611.971 791.971 re\nW* n\n0.9882352941 0.9882352941 0.9843137254 rg\n-0.05 792.05 m ... f*\nEMC` = 252/255, 252/255, 251/255. Isian dibungkus `/Artifact` (bukan isi teks), jadi tidak mengganggu ekstraksi teks.

### Uji tambahan: banyak section dan ukuran halaman (`f_3sections_FFE0E0`)

```
page 1 size_pt (612.0, 792.0) ['#FFE0E0', '#FFE0E0', '#FFE0E0']  fill (1.0, 0.878, 0.878)
page 2 size_pt (612.0, 792.0) ['#FFE0E0', '#FFE0E0', '#FFE0E0']  fill (1.0, 0.878, 0.878)
page 3 size_pt (792.0, 612.0) ['#FFE0E0', '#FFE0E0', '#FFE0E0']  fill (1.0, 0.878, 0.878)
```

Tiga halaman, satu warna; latar mengikuti ukuran tiap halaman (lanskap 792x612 ikut terisi penuh).

### Diagnosis impor (DOCX -> ODT, `--convert-to odt`)

`styles.xml` hasil dari `d_FFE0E0_dbs` memuat pada `style:page-layout-properties`: `fo:background-color="#ffe0e0" ... draw:fill="solid" draw:fill-color="#ffe0e0" draw:opacity="100%"`. Hasil dari `e_FFE0E0_nodbs` tidak memuat satu pun atribut latar. Jadi penentu ada pada impor DOCX: `displayBackgroundShape` mengaktifkan pemetaan `w:background` ke latar gaya halaman LibreOffice; tanpa flag itu importer membuangnya sebelum ekspor PDF.

## 6. Mode ekspor PDF lain (opsi filter)

Kasus d (FFE0E0 + displayBackgroundShape), perintah sama dengan bagian 3 tetapi `--convert-to` diganti:

| Mode | `--convert-to` | Piksel area kosong | Isian PDF |
|---|---|---|---|
| bawaan repo | `pdf` | #FFE0E0 | 1 |
| filter eksplisit | `pdf:writer_pdf_Export` | #FFE0E0 | 1 |
| lossless | `pdf:writer_pdf_Export:{"UseLosslessCompression":{"type":"boolean","value":"true"},"ReduceImageResolution":{"type":"boolean","value":"false"}}` | #FFE0E0 | 1 |
| web PDF | `pdf:writer_web_pdf_Export` | #FFE0E0 | 1 |
| PDF/A-1 | `pdf:writer_pdf_Export:{"SelectPdfVersion":{"type":"long","value":"1"}}` | #FEE0DF | 1, isian `(1.0,0.8784,0.8784)` |
| PDF/A-2 | `...{"SelectPdfVersion":{"type":"long","value":"2"}}` | #FEE0DF | 1, isian `(1.0,0.8784,0.8784)` |

Kasus a di PDF/A-2: piksel #FBFCFA, isian `(0.988,0.988,0.984)` (nilai isian tidak berubah). Aliran konten PDF/A-2 kasus d: `1 0.8784313725 0.8784313725 rg` (sama dengan mode bawaan). Pergeseran piksel pada PDF/A karena PDF/A membawa OutputIntent/profil ICC sehingga PyMuPDF mengonversi warna saat render; ini penjelasan hipotesis yang konsisten dengan operator isian identik, tidak diuji lebih jauh (mis. dengan rasterizer lain). Studio memakai `pdf` bawaan, jadi mode PDF/A hanya relevan bila kelak diaktifkan.

## 7. Word (dari semantik OOXML; Word tidak dijalankan)

Dijalankan: tidak ada. Word COM terdaftar di host (`research/34` butir 21) tetapi tidak dipakai sesuai instruksi. Yang berikut adalah pengetahuan semantik OOXML (ECMA-376), bukan hasil uji, dan diberi label hipotesis:

- `w:background` (ECMA-376 Part 1, 17.2.1) mendefinisikan warna/isian latar seluruh dokumen. `w:displayBackgroundShape` ("Display Background Objects When Displaying Document") menentukan apakah Word menampilkan latar itu. Word sendiri menuliskan kedua elemen bersama saat pengguna mengatur "Page Color". Hipotesis: dengan keduanya, Word menampilkan #FCFCFB penuh halaman di Print Layout/Web Layout; tanpa `displayBackgroundShape`, Word tidak menampilkannya, jadi perilaku Word searah dengan temuan LibreOffice.
- Hipotesis: pencetakan warna latar dari Word bergantung opsi pengguna "Print background colors and images"; ekspor PDF bawaan Word umumnya menyertakan warna halaman. Perilaku cetak Word tidak dapat dipastikan tanpa menjalankannya.
- `w:background` adalah elemen tunggal di bawah `w:document`: Word pun tidak mengenal latar per-section lewat elemen ini (sejalan dengan butir 5 verdict). Latar per halaman di Word dibuat dengan bentuk (shape) di header/footer atau isian per-halaman, mekanisme yang **tidak diuji** di sini terhadap LibreOffice.

## 8. Implikasi untuk C13 (hanya catatan, tanpa perubahan kode)

- Syarat lolos: C13 harus menulis KEDUA bagian paket (`w:background` di document.xml dan `w:displayBackgroundShape` di settings.xml); satu saja tidak cukup untuk PDF. Penempatan: sebelum `w:body` dan setelah `w:zoom` (urutan skema).
- Satu warna per dokumen: bila template menuntut #FCFCFB untuk halaman badan dan #FBFAF7 untuk pembungkus dalam satu dokumen, `w:background` hanya dapat memenuhi satu; pilihan konservatif untuk dokumen campuran adalah warna badan (mayoritas halaman). Opsi per-halaman (shape di header section pembungkus) adalah hipotesis, belum terukur; probe terpisah diperlukan sebelum dipakai.
- Terukur: kontrak C13 "PDF of one opt-in fixture samples the paper colour" memenuhi nilai tepat: (252,252,251) dan (251,250,247) pada render 144 dpi.

## 9. Validation summary (dry-run-verify-fix, Phase 5)

| Langkah | Hasil | Bukti |
|---|---|---|
| Bangun 7 DOCX uji, periksa XML | PASS | bagian 4 (grep XML) |
| Konversi dengan perintah identik repo | PASS | bagian 3; semua PDF ada (`ls -l`: 29.369 - 29.414 byte) |
| Piksel area kosong vs target | PASS | bagian 5 (a, d, g sama persis; b, c, e = #FFFFFF) |
| Mode ekspor lain | PASS (diukur) | bagian 6 |
| Siklus perbaikan | 0 | tidak ada kegagalan |

Sisa proses `soffice`: `tasklist | grep -ci soffice` = 0. Tidak ada `soffice` menggantung.

## 10. Gaps

- Hanya halaman Letter (python-docx bawaan) dan satu ukuran lanskap yang diuji; ukuran A4 DATUM tidak diuji (hipotesis: tak berpengaruh, karena kotak isian mengikuti ukuran halaman seperti pada section lanskap).
- Tidak diuji: `w:background` dengan `w:themeColor`/`w:themeTint` atau isian gradien (`v:background`); DATUM hanya perlu warna datar.
- Tidak diuji: efek `displayBackgroundShape` terhadap dokumen Studio nyata (header/footer, bentuk lain); dokumen uji berisi satu judul dan satu paragraf.
- Perilaku Word tidak diukur (bagian 7, hipotesis).
- Penjelasan pergeseran PDF/A (ICC) adalah hipotesis.
- Berkas kerja tetap di `C:/tmp/c03` (work, out, bin, p); tidak dihapus.

## 11. Collection log

| Aksi | Hasil |
|---|---|
| Read research/34, grep `soffice`, Read `clash.py:668-708`, grep `service.ts` | perintah konversi repo, tanpa opsi filter |
| `build.py` -> 5 DOCX (a-e); `build2.py` -> 3 section; salin g | bagian 4 |
| 7 konversi `--convert-to pdf`; 5 mode lain; 1 odt (2 berkas) | bagian 3, 6, 5 |
| `sample.py`, `pages.py` (PyMuPDF 1.28.2, hermes venv, `-I`) | bagian 5, 6 |
