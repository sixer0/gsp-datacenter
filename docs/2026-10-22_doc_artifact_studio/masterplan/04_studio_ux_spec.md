---
type: spec
task_id: doc_artifact_studio
step: UX-01
agent: coder-execution
date: 2026-10-23
status: complete
binding: D-139, D-140, D-153, D-158, D-161; blueprint 05 §0, §2.3, §2.6, §2.12; S86 (gateway_check/05_review_ui_harness.md)
inputs: identification/05_structural_sections_blueprint.md, decisions/decisions.md, gateway_check/05_review_ui_harness.md, src/app/studio/**, src/components/studio/**, src/components/ui/kit.tsx, src/components/{sidebar,command-palette}.tsx, src/app/globals.css
consumers: SR-28, SR-29, SR-30, SR-31, FIX-4 (D-161), SR-52 (E2E), SR-56 (review)
---

# 04 Spesifikasi UX Studio Dokumen (UX-01)

Permintaan user (D-161): "UI-nya juga perlu diperbaiki yang lebih user friendly". Dokumen ini adalah spesifikasi desain, bukan kode. Isinya mengikat baris SR-28 sampai SR-31 dan FIX-4. Bila ada yang bertentangan dengan blueprint 05, blueprint yang menang. Pertentangan itu dicatat di §8.

Cara baca:
- §1 berisi prinsip, kamus istilah layar, dan tanda visual.
- §2 berisi peta navigasi dan hak USER/ADMIN.
- §3 berisi empat alur berpemandu.
- §4 berisi wireframe tiap layar.
- §5 berisi status kosong, memuat, galat, dan konfirmasi.
- §6 berisi pedoman komponen.
- §7 memetakan isi spesifikasi ke baris implementasi dan temuan S86.
- §8 berisi keputusan dan pertanyaan terbuka untuk controller.
- §9 berisi kriteria penerimaan UX.

Penanda bukti: `berkas:baris` merujuk ke kode saat ini (2026-10-23). Hal yang belum terbukti diberi label **hipotesis**.

---

## 1. Pembacaan desain dan prinsip

**Pembacaan desain:** alat kerja internal untuk staf GSP yang meninjau dokumen hasil agen. Bahasanya tenang dan profesional, mengikuti kit "Calm Luxury" HQ yang sudah ada (`src/components/ui/kit.tsx:1-7`, token `src/app/globals.css:174-202`). Ini bukan halaman pemasaran. Kenop desain (skill design-taste-frontend):
- VARIANCE 3: tata letak simetris dan dapat diprediksi.
- MOTION 2: hanya transisi status, dan menghormati `prefers-reduced-motion`.
- DENSITY 5: daftar padat, tetapi area baca lega.

Aturan pemasaran (hero, logo wall) tidak berlaku di sini. Aturan anti-slop yang tetap berlaku:
- Tanpa hitam murni.
- Satu keluarga ikon, yaitu `lucide-react` yang sudah dipakai proyek.
- Tanpa angka palsu.
- Tombol tidak membungkus ke dua baris.

### 1.1 Prinsip UX (setiap layar diuji terhadapnya)

| # | Prinsip | Akibat konkret |
|---|---|---|
| P1 | **Manusia mengatur templat dan meninjau dokumen. Agen yang mengisi konten** (blueprint §0, D-139) | Tidak ada layar utama yang meminta manusia menulis JSON. Editor JSON hanya ada di Alat developer (ADMIN) |
| P2 | **Dokumen tampil seperti dokumen** | Isi dibaca sebagai halaman bernomor (bab, bagian, paragraf, gambar, tabel), bukan pohon alamat atau JSON |
| P3 | **Bahasa awam di permukaan utama** | Istilah teknis diganti memakai kamus §1.2. Kunci parameter, pid, alamat C.S.P, sha, kelas B/K/T, `slotKey`, dan kode galat mentah hanya muncul di panel "Info teknis" yang terlipat (ADMIN) |
| P4 | **Kelengkapan selalu terlihat** | Setiap dokumen membawa Rel kelengkapan (§1.3) di daftar, kepala halaman, dan di samping tombol buat berkas |
| P5 | **Tombol nonaktif selalu menjelaskan dirinya** | "Buat berkas lengkap" yang belum boleh tetap dapat difokus (`aria-disabled`). Saat diklik, ia membuka daftar kekurangan dan menawarkan alternatif (draf bab/bagian) |
| P6 | **Satu tindakan utama per layar** | Hanya satu `Button variant="primary"` per layar. Tindakan lain berupa `ghost` atau masuk menu |
| P7 | **Paling banyak 8 kenop per kelompok** (D-140, §2.3) | Pengaturan global dan per bagian masing-masing ≤ 8 kenop. Sisanya ada di panel "Lanjutan" yang terlipat dan hanya untuk ADMIN |
| P8 | **Alat admin terpisah dari alur kerja** | Alat developer (playground) dan Sistem tidak tampil di navigasi USER (§2.2) |
| P9 | **Konsisten dengan HQ** | Memakai `Panel`, `Button`, `Pill`, `SectionHeader`, `EmptyState`, `Skeleton` dari kit, token `var(--…)`, dan Geist. Tanpa pustaka UI baru |
| P10 | **Gagal itu terarah** | Setiap galat menyebut apa yang terjadi, akibatnya, dan satu tindakan perbaikan (§5.2) |

### 1.2 Kamus istilah layar (sumber tunggal label; dipakai semua baris)

Implementasi menaruh kamus ini di satu modul label bersama (§6.2 `shared/labels.ts`). Saat ini label masih tersebar di beberapa modul, misalnya `document-viewer/labels.ts`, `revision/labels.ts`, dan `artifact-gallery/labels.ts`.

| Istilah sistem | Label di layar | Catatan |
|---|---|---|
| template | **Templat** | Ejaan baku KBBI. Mengganti "Template" di `studio-subnav.tsx:16` dan `sidebar.tsx:32` |
| preset gaya (`isPreset`) | **Gaya** (mis. "Gaya GSP DATUM") | "Pilih gaya dokumen" |
| kenop esensial | **Pengaturan** | Tanpa kata "parameter" di permukaan utama |
| lanjutan (advanced) | **Pengaturan lanjutan** | Terlipat, ADMIN |
| kerangka / skeleton | **Susunan dokumen** | |
| slot | **Bagian** | Bagian = Sampul, Lembar kendali, Isi, dst. Label diambil dari `label` slot (M10) |
| sectionType | **Jenis bagian** | Memakai `nodeTypeLabel` (`document-viewer/labels.ts`) yang diperluas |
| `required` | **Wajib** / **Opsional** | |
| `positionLocked` | **Posisi tetap** | Ikon gembok + teks, tidak hanya ikon |
| `repeatable` | **Bisa berisi banyak bab** | Hanya untuk slot berulang |
| `contentMode` AUTO / INPUT / MIXED | **Dibuat otomatis** / **Diisi agen** / **Otomatis, dapat dilengkapi agen** | |
| tier NOTA / TERBIT / SERAH | **Tingkat terbitan**: Nota (catatan internal) / Terbit (terbitan resmi) / Serah (serah terima) | Mengganti label "Tier" |
| chapter | **Bab** | |
| section (sub-bagian bab) | **Subbab** | "Seksi" (`document-viewer/labels.ts:67`) diganti |
| block / paragraf | **Paragraf**, **Gambar**, **Tabel**, **Daftar**, **Catatan** | Per jenis |
| alamat C.S.P (`3.2.2`) | **Nomor** ("Paragraf 3.2.2") | Ditampilkan sebagai penomoran dokumen, bukan "alamat". Kata "alamat" tidak muncul |
| pid | tidak ditampilkan | Hanya di "Info teknis" (ADMIN) dan di URL |
| revisi | **Versi dokumen** ("Versi 10") | Kata "revisi" boleh dipakai di Riwayat sebagai keterangan sekunder |
| render (job) | **Buat berkas** / "Berkas sedang dibuat" / "Berkas siap" | Satu nama tindakan dalam seluruh alur (P6, skill frontend-design) |
| render penuh (scope DOCUMENT) | **Berkas lengkap** | |
| render bab / slot (draf) | **Draf bab** / **Draf bagian** | Berkas draf bertanda DRAF di halaman |
| COMPLETE / INCOMPLETE | **Lengkap** / **Belum lengkap** | |
| FILLED / AUTO_READY / EMPTY / PARTIAL / OPTIONAL_EMPTY / OMITTED | **Terisi** / **Otomatis** / **Belum diisi** / **Sebagian** / **Opsional, kosong** / **Tidak dipakai** | Warna di §1.3 |
| `lastFilledBy` (agentId) | **Diisi oleh** + nama agen | Nama dari id agen HQ bila ada. **Hipotesis**: perlu peta id ke nama (§8 T-4) |
| output DOCX / PDF / HTML / SVG / PNG | **Word (.docx)** / **PDF** / **Halaman web (.html)** / **Gambar (.svg/.png)** | Mengganti `FORMAT_LABEL` kode mentah (`labels.ts:47-53`) |
| release status PASS / FAIL / PENDING / NOT_RUN | **Lolos pemeriksaan** / **Ada masalah standar** / **Sedang diperiksa** / **Belum diperiksa** | |
| missionFolder | **Misi** | Tampil sebagai nama misi, dengan folder di tooltip. **Hipotesis**: judul misi tersedia dari HQ (§8 T-3) |
| `change {what, why, impact}` | **Apa yang diubah / Mengapa / Dampaknya** | |
| SCOPE_CONFLICT | "Paragraf ini sudah diubah orang lain" | §5.2 |

**Kata terlarang di permukaan utama** (diperiksa SR-56 dengan grep atas string JSX di luar `InfoTeknis`): `pid`, `C.S.P`, `alamat`, `slot`, `slotKey`, `payload`, `JSON` (kecuali di Alat developer), `sha`, `kelas K`, `kelas B`, `kelas T`, `override`, `tier`, `render`, `job`, `registri`, `AgentRequest`, `HermesTask`.

### 1.3 Tanda visual: Rel kelengkapan dan Lembar baca

Studio berada di dalam HQ yang bertema gelap. Arah visualnya mengikuti HQ, dan keberanian desain dipusatkan di dua elemen yang menyampaikan sesuatu yang benar tentang konten:

**(1) Rel kelengkapan.** Ini elemen khas Studio. Bentuknya satu pita horizontal yang dibagi per bagian dokumen sesuai urutan susunan.
- Setiap segmen mewakili satu bagian, dan lebarnya sama.
- Bagian "Isi" yang berisi banyak bab dibagi lagi menjadi sub-segmen per bab yang diharapkan.
- Warna segmen mengikuti status:

| Status | Token | Pola (tidak hanya warna, WCAG 1.4.1) |
|---|---|---|
| Terisi | `--up` | penuh |
| Otomatis | `--accent` | penuh, opasitas 60% |
| Sebagian | `--warn` | arsir diagonal |
| Belum diisi (wajib) | `--down` | garis tepi putus-putus, isi kosong |
| Opsional, kosong | `--line-strong` | garis tepi tipis |
| Tidak dipakai | tidak digambar | |

- Rel muncul di tiga tempat dengan ukuran berbeda:
  - baris daftar dokumen: tinggi 6 px;
  - kepala halaman dokumen: tinggi 10 px, berlabel di bawahnya;
  - kartu "Buat berkas": dalam bentuk daftar kekurangan.
- Rel adalah `role="img"` dengan `aria-label` ringkas, misalnya "7 dari 9 bagian terisi; belum diisi: Lembar kendali, Bab 4". Setiap segmen dapat difokus. Tooltip menampilkan label, status, pengisi, dan waktu. Mengklik segmen membawa ke bagian itu di tab Baca.

Alasan: pertanyaan nomor satu pengguna untuk dokumen misi adalah "sudah lengkap belum, apa yang kurang, siapa yang mengisi". Rel menjawab ketiganya dalam satu pandang dan memetakan langsung `completeness.slots` + `content.expected/missing` (blueprint §2.6).

**(2) Lembar baca.** Isi dokumen ditampilkan di atas lembar terang dengan proporsi ukuran kertas templat (A4/F4/Letter dll., D-158), di tengah latar gelap HQ. Lembar ini adalah satu-satunya permukaan terang di HQ. Alasannya: peninjau menilai dokumen yang akan dicetak, dan lembar terang memutus kesan "data/JSON". Token baru disimpan lokal di Studio, tidak di `globals.css` global:

| Token | Hex | Pakai | Kontras |
|---|---|---|---|
| `--studio-paper` | `#eceef1` | latar lembar (abu dingin, bukan krem) | |
| `--studio-ink` | `#1b1f24` | teks lembar | sekitar 14,2:1 terhadap paper |
| `--studio-ink-2` | `#4a515b` | caption, sumber, nomor | sekitar 6,9:1 |
| `--studio-mark` | `color-mix(in srgb, var(--accent) 22%, var(--studio-paper))` | sorot paragraf saat diarahkan/difokus | |

Huruf memakai Geist (sudah dimuat `src/app/layout.tsx:6-7`). Lembar baca adalah tampilan tinjau, bukan replika piksel. Kesetiaan cetak ada di pratinjau PDF ("Buka PDF"), dan ini dinyatakan di layar (W7).

Gerak: hanya transisi warna/opasitas 150 ms `var(--ease)` pada hover/fokus, kemunculan panel sunting 200 ms, dan pembaruan segmen rel 300 ms. Semuanya mati bila `prefers-reduced-motion: reduce`. Tidak ada animasi berulang.

---

## 2. Peta navigasi dan arsitektur informasi

### 2.1 Peta rute

Tidak ada rute baru yang wajib. Semua rute di bawah sudah ada (`src/app/studio/**`), kecuali yang ditandai.

```
/studio                               Beranda                         semua
|-- /studio/documents                 Dokumen (per misi)              semua
|   +-- /studio/documents/[id]        Halaman dokumen                 semua
|        ?tab=baca|kelengkapan|berkas|riwayat  (bawaan: baca)
|        &versi=<n>                   lihat versi lama (baca saja)
|        &p=<pid>                     paragraf terpilih (URL saja, tak tampil)
|        /edit            -> dialihkan ke ?tab=baca&p=... (SR-30; kompat tautan lama)
|        /revisions       -> dialihkan ke ?tab=riwayat     (SR-30)
|        /revisions/[rev] -> dialihkan ke ?tab=baca&versi=<rev>
|-- /studio/templates                 Templat                         semua (ubah: pemilik/ADMIN)
|   +-- /studio/templates/[id]        Editor templat                  semua (baca), pemilik/ADMIN (ubah)
|        ?langkah=gaya|pengaturan|simpan
|        /sections                    Susunan dokumen (langkah 3)     idem
|        /versions                    Riwayat versi templat           idem
|-- /studio/artifacts                 Galeri artefak                  semua
|-- /studio/playground                Alat developer                  ADMIN (USER: layar "khusus admin")
+-- /studio/system                    Sistem (mesin cetak)            ADMIN penuh; USER: ringkas baca saja
```

Arsitektur informasinya: Beranda, lalu Dokumen (tempat pekerjaan harian), lalu Templat (pengaturan, lebih jarang), lalu Galeri artefak, lalu Alat admin. Urutan ini menggantikan urutan kontrak `STUDIO_NAV` yang menaruh Template sebelum Dokumen (`src/lib/studio/contract/ui.ts:27-34`), sekaligus menutup ketidakselarasan urutan antara subnav dan kontrak (S86 R14).

### 2.2 Apa yang dilihat USER vs ADMIN

Peran diketahui klien dari `GET /api/auth/me` (`section-composer/api.ts:159-161`; `role === "ADMINISTRATOR"`). Penyembunyian di UI hanya untuk kenyamanan. Penegakan tetap di server (403 `FORBIDDEN`, `PARAM_SURFACE_FORBIDDEN`, `PRESET_READONLY`, `PARAM_CLASS_K_FORBIDDEN`).

| Area | USER | ADMIN |
|---|---|---|
| Navigasi | Beranda, Dokumen, Templat, Galeri artefak | Ditambah grup "Alat admin": Alat developer, Sistem |
| Beranda | Perlu perhatian, Baru lengkap, Templat saya, chip status mesin cetak | Sama, ditambah tautan Sistem pada chip |
| Dokumen: baca, kelengkapan, berkas, riwayat | Ya | Ya |
| Dokumen: sunting paragraf, ganti jadi gambar, sisip, hapus, pindah | Ya, kecuali templat terbatas (403 `FORBIDDEN`): mode baca saja + penjelasan | Ya |
| Dokumen: buat dokumen kosong untuk misi (D-153) | Ya | Ya |
| Dokumen: ganti versi templat yang dipatok (op `templateVersion`), nomori ulang bab (`renumberChapters`) | Tidak tampil | Menu "Tindakan admin" + konfirmasi |
| Info teknis (pid, nomor revisi mentah, sha, kode galat, `forwardToController` mentah, correlationId) | Tidak tampil | Panel terlipat "Info teknis" per paragraf/galat |
| Templat: gaya + pengaturan + susunan | Ubah bila pemilik dan templat tidak kanonik. Templat kanonik: baca saja + alasan | Ubah semua |
| Templat: Pengaturan lanjutan | Tidak tampil (lihat §8 T-1 "mode ahli") | Panel terlipat |
| Gaya (preset): ubah isi gaya | Tidak tampil | Tab "Gaya" di daftar templat, editor lengkap |
| Impor profil templat | Tidak tampil | Menu "Tindakan admin" di daftar templat |
| Galeri artefak | Ya | Ya |
| Alat developer | Layar "khusus admin" bila dibuka lewat URL | Ya |
| Sistem | Ringkasan satu kartu (siap/bermasalah + "hubungi admin") | Penuh, termasuk "Periksa ulang kesiapan" (`render-status/index.tsx:7`) |

### 2.3 Navigasi

- **Satu sumber**: `STUDIO_NAV` (kontrak) mendapat medan `audience: "all" | "admin"`, `shortLabel` (subnav/sidebar), dan `paletteLabel` (palet perintah). `sidebar.tsx:29-35` (`STUDIO_SIDEBAR_LABELS`), `command-palette.tsx:30` (`STUDIO_PALETTE_LABELS`), dan `studio-subnav.tsx:13-20` (`ITEMS`) diturunkan dari situ. Ini menutup S86 R14.
- Sidebar HQ, grup "Studio": Beranda, Dokumen, Templat, Galeri artefak. Untuk ADMIN ada pemisah lalu "Alat developer" dan "Sistem".
- Subnav Studio (pil, `studio-subnav.tsx`) memakai urutan yang sama. Ikon Beranda = `FileStack` (kontrak), bukan `Home`.
- **Remah roti** di bawah subnav pada halaman dalam, mis. "Dokumen / Misi A / Laporan Inspeksi Gardu". Pakai pola `src/components/breadcrumbs.tsx`, tetapi tautan dibangun dari data halaman.
- Judul metadata seragam: `"<Halaman> · Studio · GSP Swarm HQ"`. Ini menutup bagian judul di S86 R16.
- Palet perintah: entri "Studio: Dokumen", "Studio: Templat", "Studio: Buat dokumen untuk misi…", dan untuk ADMIN "Studio: Alat developer" serta "Studio: Sistem".

---

## 3. Alur berpemandu

Setiap alur menyebut langkah, layar (§4), API, aturan, dan pemulihan galat. Sebelum menulis kode, pelaksana wajib memanggil setiap endpoint dengan `curl` dan mengetik klien dari respons nyata (aturan frontend-integration). Bentuk respons di bawah berasal dari blueprint §2.6 dan §2.11, dan bisa saja sudah bergeser setelah SR-20..SR-27 mendarat.

### 3a. Membuat atau mengubah templat

Stepper empat langkah tampil di kepala halaman `/studio/templates/[id]` dan `/sections` (W3, W4). Setiap langkah dapat diklik. Status langkah: "selesai", "ada perubahan belum disimpan", atau "perlu perhatian".

```
 Gaya  >  Pengaturan  >  Susunan dokumen  >  Simpan versi
```

| Langkah | Tujuan pengguna | Layar | API | Aturan |
|---|---|---|---|---|
| 0. Buat | "Saya butuh templat untuk laporan inspeksi" | W2 dialog "Buat templat" | R01 POST (`studio.template/v2`: preset + essentials kosong + skeleton bawaan gaya) | Medan: Nama templat (wajib), Gaya (kartu), Tingkat terbitan bawaan. Slug dibangkitkan dari nama dan hanya terlihat di Info teknis. Selesai, pengguna diarahkan ke `?langkah=pengaturan` |
| 1. Gaya | Memilih satu gaya | W3 tab Gaya | R01 `?kind=preset`, R03 `kind=presets` | Kartu gaya berisi gambar mini sampul + halaman bab (pratinjau dari R08/TemplatePreviewPane) dan deskripsi satu kalimat. Gaya terbatas (Manual 000) hanya untuk ADMIN. **Mengganti gaya pada templat yang sudah diatur memerlukan konfirmasi** (§5.3 K-1) karena pengaturan kembali ke nilai gaya baru |
| 2. Pengaturan | Mengatur kenop esensial global dengan pratinjau langsung | W3 tab Pengaturan | R03 `kind=essentials` (label awam dari server), R02 GET | ≤ 8 kenop global dalam tiga kelompok: **Halaman** (Ukuran kertas, Orientasi (D-158), Kerapatan margin), **Tampilan** (Warna aksen, Ukuran huruf dasar, Logo organisasi), **Isi** (Bahasa, Klasifikasi bawaan, Rel bukti). Setiap kenop punya label, satu kalimat bantuan, nilai, dan tautan "Kembalikan ke bawaan gaya (A4)" bila diubah. Pratinjau di samping diperbarui dengan jeda 600 ms setelah perubahan terakhir. Kenop kelas K untuk non-ADMIN tampil terkunci dengan alasan awam ("Hanya admin yang dapat mengubah ini karena mengikat standar DATUM"). Pengaturan lanjutan: panel terlipat, hanya ADMIN, dengan pencarian. Di dalamnya kunci teknis boleh tampil sebagai teks sekunder `font-mono` |
| 3. Susunan dokumen | Menata bagian: urutan, wajib/opsional, pengaturan per bagian | W4 `/sections` | R19 GET/POST, R03 `kind=slots`, R08 (pratinjau validasi) | Daftar kartu bagian yang dapat diseret. Alternatif keyboard: Alt+Panah atas/bawah (sudah ada, `section-list.tsx:82-85`) dan tombol "Naikkan"/"Turunkan" di menu kartu. Bagian "Posisi tetap" tidak dapat dipindah. Usaha memindahkannya memberi pesan inline "Sampul selalu di awal". Sakelar **Wajib** per bagian. Bagian wajib bawaan gaya yang dimatikan memerlukan konfirmasi (K-3). Kartu terbuka berisi ≤ 8 pengaturan jenis bagian itu (mis. Isi: "Bab mulai di halaman baru", "Posisi keterangan gambar"). Lampiran mendapat "Orientasi halaman bagian ini" (D-158). "Tambah bagian" membuka dialog jenis bagian yang diizinkan, masing-masing dengan deskripsi. "Hapus bagian" memerlukan konfirmasi (K-2). Tanpa pengaturan per bab (blueprint §2.12) |
| 4. Simpan versi | Menyimpan sebagai versi baru dengan catatan | W3 tab Simpan (komponen sama dipakai `/sections`) | R02 POST / R19 POST | Ringkasan perubahan berbahasa awam, mis. "Ukuran kertas: A4 jadi F4", "Lampiran: dijadikan opsional". Catatan perubahan wajib. Info tetap: "Dokumen yang sudah dibuat tetap memakai versi lama. Dokumen baru memakai versi ini." (D-153). Tombol utama "Simpan versi 4", lalu notifikasi "Versi 4 disimpan" |

Aturan lintas langkah:
- Perubahan yang belum disimpan dijaga oleh `beforeunload` dan konfirmasi navigasi di dalam app (K-6). Draf disimpan per templat di `localStorage` dengan try/catch.
- Simpan dari langkah mana pun membuka langkah 4. Langkah 2 dan 3 menghasilkan **satu** versi bila disimpan bersamaan. **Hipotesis**: R02 dan R19 menerima satu POST gabungan. Bila tidak, langkah 4 menyimpan dua kali secara berurutan dan melaporkan hasil gabungan (§8 T-2).
- Mode gaya (ADMIN, templat `isPreset`): judul "Mengubah gaya: GSP DATUM", pita peringatan "Perubahan gaya memengaruhi semua templat yang memakainya saat mereka menyimpan versi berikutnya", dan editor lengkap seluruh kunci (komponen `param-editor` yang ada) di bawah pencarian.

### 3b. Memantau dokumen misi

| Langkah | Layar | API | Aturan |
|---|---|---|---|
| Lihat dokumen per misi | W5 `/studio/documents` | R04 GET `?mission=&take=&cursor=` (+ kelengkapan, §2.6) | Dikelompokkan per misi (kepala grup: nama misi, "3 dokumen · 1 lengkap"). Baris: judul, nomor dokumen, templat, Rel kelengkapan kecil, ringkasan kekurangan satu baris ("Belum: Lembar kendali, Bab 4"), terakhir diisi oleh siapa dan kapan, serta status berkas ("Belum ada berkas" / "Draf" / "Berkas lengkap, versi 10"). Filter: misi (cari), status (Semua / Belum lengkap / Lengkap / Ada masalah standar), templat. Urut: terakhir berubah. "Muat lebih banyak" dengan kursor. Filter disimpan di URL (pola `document-list.tsx:4-5` dipertahankan) |
| Buat dokumen kosong untuk misi (D-153) | W5 dialog | R04 POST `{template, meta:{title}, mission, docKey?}` | Medan: Misi, Judul, Templat (versi terbaru dipatok; info "Dokumen akan memakai Templat X versi 4 dan tidak berubah bila templat diubah nanti"). Hasilnya dokumen dengan semua bagian berstatus awal (Belum diisi / Otomatis / Opsional, kosong). Agen mengisi kemudian. Tombol "Buat dokumen". `META_CONFLICT`/`TEMPLATE_MISMATCH` bila dokumen misi dengan kunci sama sudah ada: pesan + tautan "Buka dokumen yang ada" |
| Lihat kelengkapan rinci | W6 tab Kelengkapan | R15 | Satu baris per bagian berisi status, siapa mengisi dan kapan, serta tindakan "Buat draf bagian ini". Untuk bagian Isi: kisi chip bab 1..n (ada/belum, inisial agen pengisi, waktu). Tombol "Salin ringkasan kekurangan" menyalin teks awam yang disusun klien dari `missingRequired` + label bagian. Untuk ADMIN, Info teknis berisi `forwardToController` mentah |
| Buat berkas | Kartu "Buat berkas" di kepala W6/W7 | R17 `{scope, key?, formats}` | **Berkas lengkap** hanya aktif bila `fullRenderAllowed`. Bila belum, tombol tetap dapat difokus (`aria-disabled="true"`). Mengkliknya membuka popover "Belum dapat membuat berkas lengkap" berisi daftar kekurangan (tautan ke tiap bagian) dan alternatif "Buat draf bab ini" / "Buat draf bagian ini". Pilihan format: kotak centang PDF dan Word (bawaan keduanya), Halaman web opsional. Saat proses: "Berkas sedang dibuat…" dengan status per format. Polling job: jeda 2 s, lalu 4 s, lalu 8 s, maksimal 15 s; berhenti saat tab tersembunyi (`visibilitychange`) dan lanjut saat terlihat. Selesai: notifikasi "Berkas siap" + tombol Buka/Unduh (alur 3d). 409 `DOCUMENT_INCOMPLETE` (balapan): pesan §5.2 + rel diperbarui dari `details.completeness` |
| Pembaruan saat terbuka | W5, W6 | R15 / R04 | Muat ulang otomatis setiap 30 s hanya bila tab terlihat dan pengguna tidak sedang menyunting. Tombol "Perbarui" manual. Perubahan rel dianimasikan 300 ms (kecuali reduced-motion), ditambah `aria-live="polite"`: "Bab 4 baru saja diisi oleh gsp-analis-01" |

### 3c. Membaca dan menyunting dokumen

| Langkah | Layar | API | Aturan |
|---|---|---|---|
| Baca | W7 tab Baca | R20 (isi v2 per bagian/bab + pid), R05 (pohon + nomor) | Lembar baca (§1.3) per bagian dalam urutan susunan. Bagian otomatis (Sampul, Daftar isi) tampil sebagai kartu ringkas "Dibuat otomatis saat berkas dibuat" + "Lihat di PDF". Bagian kosong tampil sebagai placeholder bergaris putus-putus "Lembar kendali belum diisi. Agen akan mengisinya, atau minta pengisian lewat controller." Bab berisi judul bernomor, subbab, paragraf, daftar, tabel (tampilan sederhana), gambar/grafik/diagram (gambar mini dari aset atau berkas figur), dan keterangan + sumber. Jenis blok yang belum punya tampilan sederhana menjadi kartu netral "Tabel spesifikasi, lihat tampilan lengkap di PDF". Panel kiri "Daftar isi dokumen" (sticky di desktop, lembar bawah di ponsel) |
| Pilih paragraf | W7 | - | Arahkan kursor/fokus: sorot `--studio-mark` + tombol pensil "Sunting" di tepi kiri. Setiap paragraf adalah elemen yang dapat difokus (`tabIndex=0`, `aria-label="Paragraf 3.2.2, tekan Enter untuk menyunting"`). Klik atau Enter membuka mode sunting di tempat. URL `?p=<pid>` diperbarui (bisa dibagikan) |
| Sunting teks | W7 panel sunting di tempat | R16 PATCH `{op:"replace", baseRevisionNo, block, change}` | Area teks setinggi isi. Bilah kecil berisi Tebal, Miring, Kode, Superskrip, Subskrip (penanda makna v2: `strong`, `em`, `code`, `sup`, `sub`). Tidak ada pilihan huruf, warna, atau ukuran (D-139). Tombol "Simpan perubahan" membuka lembar perubahan berisi tiga medan wajib: **Apa yang diubah** (terisi otomatis "Ubah paragraf 3.2.2", dapat diedit), **Mengapa**, dan **Dampaknya** (bawaan "Paragraf 3.2.2 saja"). Bila dokumen Lengkap, ada kotak centang "Buat ulang berkas lengkap setelah disimpan" (`render.scope="document"`). Esc membatalkan; bila ada perubahan, muncul konfirmasi buang (K-7). Selesai: "Disimpan sebagai versi 10" + nomor yang bergeser bila ada (`addressMap`), ditulis awam: "Penomoran bergeser: 3.2.3 menjadi 3.2.4" |
| Ganti paragraf jadi gambar | W7 menu paragraf, lalu dialog | R18 POST (unggah, idempoten sha), R16 PATCH `replace` (blok gambar) | Langkah: (1) tarik-lepas atau pilih berkas (PNG, JPG, SVG; batas ukuran dari kontrak env), (2) pratinjau, (3) **Keterangan gambar** (wajib) dan **Sumber** (opsional), (4) lembar perubahan, lalu simpan. Tanpa medan lebar/ukuran, karena lebar ditentukan templat (blueprint §0 tabel, "Ukuran figur dihapus dari v2"). Nomor gambar dibangkitkan mesin. Arah sebaliknya ("Ganti gambar jadi paragraf") tersedia di menu gambar |
| Tindakan paragraf lain | Menu "..." per paragraf | R16 PATCH `insertBefore/insertAfter/delete/move` | Sisipkan paragraf di bawah, Sisipkan gambar di bawah, Pindahkan... (dialog pilih tujuan: bab, subbab, sebelum/sesudah paragraf, ditampilkan sebagai daftar isi yang bisa dipilih), Hapus paragraf (konfirmasi K-4), Riwayat paragraf |
| Riwayat paragraf | W8 panel samping | R16 GET `?history=1` | Daftar versi paragraf: versi dokumen, waktu, oleh siapa, Apa/Mengapa. Perbandingan teks dengan versi sebelumnya (komponen `revision/text-diff.tsx` dipakai ulang). Tindakan "Pakai teks ini lagi" mengisi editor dengan teks lama, lalu tetap melalui lembar perubahan (bukan pemulihan diam-diam) |
| Riwayat dokumen | W8 tab Riwayat | R07 GET, R05 `?rev=` | Daftar versi dokumen: nomor, waktu, oleh, lingkup awam ("Bab 3", "Paragraf 3.2.2", "Susunan"), Apa/Mengapa/Dampak. Tindakan: "Lihat versi ini" (tab Baca dengan pita "Anda melihat versi 7 (bukan terbaru). Kembali ke terbaru"), "Bandingkan dengan terbaru" (`revision/diff-view.tsx`), "Buat berkas dari versi ini" (R07; berkas lengkap hanya bila versi itu Lengkap) |
| Konflik | W7 dialog | 409 `SCOPE_CONFLICT` `{changedBy, changedInRevisionNo, currentContent}` | Dialog "Paragraf ini sudah diubah oleh gsp-analis-02 (versi 9) sejak Anda mulai menyunting." Dua kolom: "Teks terbaru" vs "Teks Anda", dengan perbedaan disorot. Pilihan: **Pakai teks terbaru** (utama; editor diisi teks terbaru + teks Anda disalin ke papan klip), **Tetap simpan teks saya** (konfirmasi K-5; kirim ulang dengan `baseRevisionNo` = versi terbaru), Batal |
| Baca saja | W7 | 403 `FORBIDDEN` / templat terbatas / melihat versi lama | Pita atas yang menjelaskan alasan ("Dokumen ini memakai templat terbatas; hanya admin yang dapat menyunting" / "Anda melihat versi lama"). Tombol pensil tidak dirender |

### 3d. Membuka dan mengunduh berkas

| Aturan | Isi |
|---|---|
| Dua tindakan berbeda, dua nama berbeda | **Buka** = pratinjau di dalam Studio (dialog pratinjau) dengan "Buka di tab baru" sebagai tindakan sekunder. **Unduh** = menyimpan berkas (`Content-Disposition: attachment`). Tidak ada tombol "Buka" yang mengunduh. Ini menutup S86 R06 |
| Per format | PDF: Buka (`<object type="application/pdf">` dalam dialog + cadangan tautan, D-65) dan Unduh. Halaman web: Buka (`<iframe sandbox="">` dengan `title`, SEC-1) dan Unduh. Gambar SVG/PNG: Buka (`<img>`) dan Unduh. **Word: hanya Unduh**. Di samping Unduh ada catatan kecil "Word tidak dapat dipratinjau di browser. Lihat versi PDF", yang menautkan ke PDF revisi yang sama bila ada |
| Satu pembangun URL | `fileUrl(file, "inline" \| "download")` di `shared/file-url.ts` (§6.2). URL server ditolak bila tidak berawalan `/api/studio/files/` (menutup SEC-3). Dipakai oleh tab Berkas (SR-30), `revision/job-status.tsx:53,56` dan `playground/panels.tsx:218,246,254` (FIX-4/SR-31), `document-viewer/output-files.tsx:23,137`, dan `artifact-gallery/api.ts:95-98` |
| Pengelompokan di tab Berkas (W9) | Per versi dokumen, terbaru di atas. Di dalamnya: "Berkas lengkap" (pil `up`), "Draf bab 3" / "Draf bagian Lembar kendali" (pil `warn` + teks "Bertanda DRAF di setiap halaman"), lalu figur ("Gambar 3.1"). Kolom: nama awam, format, ukuran (KB/MB), dibuat kapan, tombol |
| Nama berkas unduhan | Diatur server. UI tidak mengubahnya. **Hipotesis**: nama sudah bermakna (nomor dokumen + versi). Bila belum, catat sebagai permintaan ke pemilik R10 |

---

## 4. Wireframe per layar

Konvensi: `[ Tombol ]` = `Button` (`*` = primary), `( )` = sakelar/radio, `[x]` = kotak centang, `{Pill}`, `▓▒░` = segmen Rel kelengkapan (▓ terisi, ▒ sebagian/otomatis, ░ belum diisi), `...` = menu. Lebar acuan desktop sekitar 1100 px (layout `max-w-6xl`, `src/app/studio/layout.tsx:10`). Di ponsel (< 640 px), kolom bertumpuk sesuai catatan per layar.

### W1. Beranda `/studio`

```
+---------------------------------------------------------------------------------+
| Studio Dokumen                                       {Mesin cetak siap}         |
| Dokumen berstandar DATUM untuk misi HQ.                                         |
| [Beranda] [Dokumen] [Templat] [Galeri artefak]   | ADMIN: [Alat developer] [Sistem]
|---------------------------------------------------------------------------------|
| PERLU PERHATIAN                                            [ Lihat semua ]      |
|  Laporan Inspeksi Gardu   Misi A   ▓▓▓░▓▓▒▒░   Belum: Lembar kendali, Bab 4     |
|  Kajian Beban Trafo       Misi C   ▓▓▓▓▓▓▓▓▓   Berkas gagal dibuat  [ Buka ]    |
|                                                                                 |
| BARU LENGKAP                                                                    |
|  Nota Survei Lokasi       Misi B   ▓▓▓▓▓       Berkas lengkap, versi 6          |
|                                                [ Buka PDF ] [ Unduh ]           |
|                                                                                 |
| TEMPLAT                                     [ Buat templat ]                    |
|  GSP DATUM . versi 4 . Gaya GSP DATUM      DATUM Kanonik . versi 5               |
+---------------------------------------------------------------------------------+
```
- "Perlu perhatian" = dokumen Belum lengkap yang berubah dalam 7 hari terakhir, ditambah dokumen yang job terakhirnya Gagal. Paling banyak 5. Setiap kartu memuat datanya sendiri (pola `studio-home.tsx:4-7` dipertahankan).
- Kosong: "Belum ada dokumen. Dokumen muncul di sini saat agen mengirim bab pertama, atau buat dokumen kosong untuk misi." `[ Buat dokumen ]`.
- Chip mesin: USER melihat "Mesin cetak bermasalah. Berkas baru mungkin tertunda; hubungi admin". ADMIN melihat tautan ke Sistem.
- Statistik angka besar (`StatCard`, `studio-home.tsx:42-80`) dihapus. Beranda menjawab "apa yang harus saya lakukan", bukan "berapa jumlahnya".

### W2. Daftar templat `/studio/templates` + dialog Buat templat

```
+---------------------------------------------------------------------------------+
| Templat                                       [ Buat templat* ]   ...(ADMIN)    |
| Templat menentukan gaya dan susunan dokumen. Agen hanya mengisi kontennya.      |
| [Templat] [Gaya (ADMIN)]                                    Cari [__________]   |
|---------------------------------------------------------------------------------|
| GSP DATUM                      Gaya: GSP DATUM    Versi 4 . 23 Okt   {Kanonik}  |
|   7 bagian . A4 tegak . dipakai 12 dokumen                       [ Buka ]       |
| Laporan Inspeksi Lapangan      Gaya: DATUM Kanonik Versi 2 . 22 Okt  pemilik Anda|
|   6 bagian . F4 tegak . dipakai 3 dokumen                        [ Buka ]       |
+---------------------------------------------------------------------------------+

  Dialog <dialog> "Buat templat"
  +-----------------------------------------------------+
  | Nama templat   [Laporan Inspeksi Lapangan_______]   |
  | Pilih gaya                                          |
  |  +-----------+ +-----------+ +-----------+          |
  |  | [mini pg] | | [mini pg] | | [mini pg] |          |
  |  | GSP DATUM | | DATUM     | | Manual 000|(ADMIN)   |
  |  | (o)       | | Kanonik() | | ( )       |          |
  |  +-----------+ +-----------+ +-----------+          |
  | Tingkat terbitan bawaan  (o) Terbit ( ) Nota ( ) Serah
  |                         [ Batal ] [ Buat templat* ] |
  +-----------------------------------------------------+
```
- "dipakai N dokumen" bersifat **hipotesis**: perlu agregat dari R01. Bila tidak tersedia, kolom tidak ditampilkan (§8 T-5).
- Menu `...` ADMIN: "Impor profil templat", "Buat gaya baru dari templat ini".
- Kanonik untuk non-ADMIN: pil "Kanonik", lalu tombol "Buka" menampilkan mode baca saja dengan pita "Templat kanonik hanya dapat diubah admin. Buat salinan untuk menyesuaikan." `[ Buat salinan ]`.
- Ponsel: baris menjadi kartu, dan kartu gaya di dialog bertumpuk vertikal.

### W3. Editor templat `/studio/templates/[id]` (langkah Gaya, Pengaturan, Simpan)

```
+---------------------------------------------------------------------------------+
| Templat / Laporan Inspeksi Lapangan                         {Ada perubahan}     |
| (1) Gaya  >  (2) Pengaturan  >  (3) Susunan dokumen  >  (4) Simpan versi        |
|---------------------------------------------------------------------------------|
| PENGATURAN                                   | PRATINJAU                        |
|                                              | Halaman: [Sampul v]              |
| Halaman                                      | +------------------------------+ |
|  Ukuran kertas       [F4 v]  Bawaan gaya: A4 | |                              | |
|                      Kembalikan              | |   (gambar mini halaman,      | |
|  Orientasi           (o) Tegak ( ) Mendatar  | |    proporsi F4)              | |
|  Kerapatan margin    [Sedang v]              | |                              | |
| Tampilan                                     | +------------------------------+ |
|  Warna aksen         [# swatch v]            | Diperbarui 2 detik lalu          |
|  Ukuran huruf dasar  [10,5 pt v]             | Pratinjau perkiraan; hasil akhir |
|  Logo organisasi     [logo-gsp.svg] [Ganti]  | ada di berkas PDF.               |
| Isi                                          |                                  |
|  Bahasa              [Indonesia v]           |                                  |
|  Klasifikasi bawaan  [Terbatas v]  (gembok: hanya admin)                        |
|  Rel bukti           (o) Otomatis ( ) Aktif ( ) Mati                            |
|                                              |                                  |
| > Pengaturan lanjutan (ADMIN)  214 pengaturan . cari [______]                   |
|                                                                                 |
|                         [ Lanjut ke Susunan dokumen ]  [ Simpan versi... * ]    |
+---------------------------------------------------------------------------------+
```
- Label, bantuan, dan pilihan diambil dari R03 `kind=essentials`. Angka "8 kenop" mengikuti finalisasi SR-59. Daftar di atas adalah usulan blueprint §2.3 + D-158.
- Pratinjau: komponen `TemplatePreviewPane` (U71, `template-preview/`) diberi `essentials` draf sebagai pengganti `draftOverrides` datar. Pilih halaman: Sampul / Halaman bab / Tabel. Saat memuat, kerangka abu dipertahankan dengan opasitas 60% (tidak berkedip). Saat galat: "Pratinjau tidak dapat dibuat. Pengaturan tetap bisa disimpan." `[ Coba lagi ]` dengan jeda 3/6/12 s.
- Tab Gaya: kartu gaya seperti dialog W2 + K-1. Tab Simpan: lihat W4 bagian bawah (komponen bersama).
- Ponsel: pratinjau pindah ke atas sebagai tombol "Lihat pratinjau" yang membuka lembar bawah, dan kenop menjadi satu kolom.

### W4. Susunan dokumen `/studio/templates/[id]/sections`

```
+---------------------------------------------------------------------------------+
| Templat / Laporan Inspeksi Lapangan / Susunan dokumen                           |
| (1) Gaya  >  (2) Pengaturan  >  (3) Susunan dokumen  >  (4) Simpan versi        |
|---------------------------------------------------------------------------------|
| Urutan bagian dalam dokumen. Seret untuk mengurutkan.        [ Tambah bagian ]  |
|                                                                                 |
|  = 1 Sampul             Dibuat otomatis   {Wajib} {Posisi tetap: awal}          |
|                         Dipakai di: Terbit, Serah                    v          |
|  = 2 Lembar kendali     Diisi agen        Wajib ( on)          ...    v         |
|  = 3 Tanda tangan       Diisi agen        Wajib ( on)          ...    v         |
|  = 4 Daftar isi         Dibuat otomatis   Wajib ( on)          ...    v         |
|  = 5 Isi                Diisi agen . bisa berisi banyak bab . min. 1 bab  ^     |
|    +-------------------------------------------------------------------------+  |
|    | Pengaturan bagian Isi                                                   |  |
|    |  Bab mulai di halaman baru        ( on)                                 |  |
|    |  Kepala halaman berjalan          ( on)                                 |  |
|    |  Tampilkan label "BAB n"          ( on)                                 |  |
|    |  Garis pembuka bab                ( on)                                 |  |
|    |  Posisi keterangan gambar         (o) Bawah ( ) Atas                    |  |
|    |  Tampilkan baris SUMBER           ( on)                                 |  |
|    |  > Pengaturan lanjutan (ADMIN)                                          |  |
|    +-------------------------------------------------------------------------+  |
|  = 6 Daftar sumber      Diisi agen        Wajib (off)          ...    v         |
|  = 7 Lampiran           Diisi agen        Wajib (off) {Posisi tetap: akhir}     |
|                                                                                 |
| PEMERIKSAAN SUSUNAN                                                             |
|  Lolos. Contoh dokumen tersusun 7 bagian.        [ Lihat contoh halaman ]       |
|---------------------------------------------------------------------------------|
| SIMPAN VERSI (langkah 4, komponen bersama)                                      |
|  Perubahan: Lampiran dijadikan opsional . Isi: keterangan gambar di atas        |
|  Catatan perubahan*  [______________________________________________]          |
|  Dokumen yang sudah dibuat tetap memakai versi 3 (12 dokumen).                  |
|                                                    [ Simpan versi 4 * ]         |
+---------------------------------------------------------------------------------+
```
- "=" adalah pegangan seret (`GripVertical`, `aria-hidden`). Item `<li>` dapat difokus. Alt+Panah memindahkan item, dan setiap pemindahan diumumkan lewat `aria-live`: "Lembar kendali dipindah ke posisi 3 dari 7". Seret memakai HTML5 bawaan yang sudah ada (`section-list.tsx:50-130`). `react-dnd` tersedia di `package.json:35-36`, tetapi tidak perlu ditambahkan ke modul ini.
- Menu `...`: Naikkan, Turunkan, Ganti nama label, Hapus bagian (K-2).
- "Pemeriksaan susunan" = R08 dengan contoh dokumen. Galat tampil sebagai kalimat awam yang menautkan ke kartu bagian.
- Dialog simpan memakai `<dialog>` bawaan lewat `ConfirmDialog`/`Sheet` bersama (menutup S86 R11, `save-dialog.tsx:54-55`).
- Ponsel: kartu selebar layar, dan pemindahan hanya lewat menu (seret dinonaktifkan pada `pointer: coarse`).

### W5. Dokumen per misi `/studio/documents`

```
+---------------------------------------------------------------------------------+
| Dokumen                                               [ Buat dokumen* ]         |
| Cari misi [__________]  Status [Semua v]  Templat [Semua v]       [ Perbarui ]  |
|---------------------------------------------------------------------------------|
| MISI A . Inspeksi Gardu Induk Cibatu            3 dokumen . 1 lengkap           |
|  Laporan Inspeksi Gardu       014/GSP/LAP/X/2026   GSP DATUM v4                 |
|  ▓▓▓░▓▓▒▒░  7 dari 9 terisi . Belum: Lembar kendali, Bab 4                      |
|  Terakhir: Bab 5 oleh gsp-analis-02, 09:12          {Belum ada berkas}  [Buka]  |
|  .............................................................................  |
|  Nota Temuan Cepat            015/GSP/NOT/X/2026   GSP DATUM v4                 |
|  ▓▓▓▓       Lengkap                                 {Berkas lengkap v3} [Buka]  |
|                                                                                 |
| MISI B . Survei Lokasi Bekasi                   1 dokumen . 0 lengkap           |
|  ...                                                                            |
|                                                  [ Muat lebih banyak ]          |
+---------------------------------------------------------------------------------+
```
- Satu baris = satu tautan ke W6/W7 (seluruh baris dapat diklik, dengan satu elemen fokus per baris).
- Kosong (tanpa filter): "Belum ada dokumen. Agen membuat dokumen saat mengirim bab pertama untuk misi, atau Anda dapat membuat dokumen kosong lebih dulu." `[ Buat dokumen ]`. Kosong (dengan filter): "Tidak ada dokumen yang cocok dengan filter." `[ Hapus filter ]`.
- Ponsel: rel di bawah judul, dan metadata disingkat menjadi satu baris.

### W6. Halaman dokumen: kepala + tab Kelengkapan `/studio/documents/[id]?tab=kelengkapan`

```
+---------------------------------------------------------------------------------+
| Dokumen / Misi A / Laporan Inspeksi Gardu                                       |
| Laporan Inspeksi Gardu                                      ...(ADMIN)          |
| 014/GSP/LAP/X/2026 . Terbit . Templat GSP DATUM versi 4 (dikunci saat dibuat)    |
| ▓▓▓▓▓▓▓░▓▓▓▓▓▒▒▒▒▒░▓▓  Belum lengkap: 7 dari 9 bagian . versi 6                 |
| +-----------------------------------------------------------------------------+ |
| | Buat berkas   [x] PDF [x] Word [ ] Halaman web                              | |
| | [ Berkas lengkap ] (nonaktif, tetap bisa difokus)   [ Draf bab... ]         | |
| | Berkas lengkap dapat dibuat setelah: Lembar kendali, Bab 4 terisi.          | |
| +-----------------------------------------------------------------------------+ |
| [Baca & sunting] [Kelengkapan] [Berkas] [Riwayat]                               |
|---------------------------------------------------------------------------------|
| Bagian            Status          Diisi oleh            Kapan        Tindakan   |
| Sampul            {Otomatis}      dibuat sistem         -            [Draf]     |
| Lembar kendali    {Belum diisi}   -                     -            -          |
| Tanda tangan      {Terisi}        gsp-analis-03         08:39        [Draf]     |
| Daftar isi        {Otomatis}      dibuat sistem         -            -          |
| Isi               {Sebagian} 4 dari 5 bab                                       |
|   [Bab 1 . GA3 08:40] [Bab 2 . GA3 08:41] [Bab 3 . GA1 09:12]                   |
|   [Bab 4 . belum ada] [Bab 5 . GA2 09:12]                         [Draf bab v]  |
| Daftar sumber     {Opsional, kosong}                                            |
| Lampiran          {Tidak dipakai}                                               |
|                                                                                 |
| [ Salin ringkasan kekurangan ]   > Info teknis (ADMIN)                          |
+---------------------------------------------------------------------------------+
```
- Kepala halaman (judul, rel, dan kartu Buat berkas) sama untuk keempat tab. Kartu Buat berkas adalah satu-satunya tindakan primary di halaman, yaitu "Berkas lengkap" bila diizinkan. Bila belum diizinkan, primary tidak ada, dan tombol ditampilkan sebagai `aria-disabled` dengan alasan tertulis di bawahnya (P5).
- Menu `...` ADMIN: "Ganti versi templat…" (K-8), "Nomori ulang bab…" (K-9), "Info teknis dokumen".
- Ponsel: tabel kelengkapan menjadi daftar kartu per bagian.

### W7. Halaman dokumen: tab Baca & sunting `?tab=baca`

```
+---------------------------------------------------------------------------------+
| (kepala W6)                                                                     |
| [Baca & sunting] [Kelengkapan] [Berkas] [Riwayat]                               |
|---------------------------------------------------------------------------------|
| DAFTAR ISI          |   +-----------------------------------------------------+ |
| Sampul (otomatis)   |   |  Lembar baca (--studio-paper), proporsi A4         | |
| Lembar kendali (!)  |   |                                                     | |
| Tanda tangan        |   |  BAB 3  TEMUAN INSPEKSI                             | |
| Daftar isi (otom.)  |   |  3.1  Kondisi Umum                                  | |
| Bab 1 Pendahuluan   |   |  3.1.1  Gardu berada pada kondisi operasi normal... | |
| Bab 2 Metode        |   |  3.2  Pemutus Tenaga                                | |
| > Bab 3 Temuan      |   |  [/] 3.2.2 PMT-2 menunjukkan korosi pada terminal..| |
|     3.1 Kondisi     |   |      ^ sorot + pensil "Sunting" saat fokus/hover   | |
|     3.2 PMT         |   |  +---------------------------------------------+    | |
| Bab 4 (belum ada)   |   |  |        [gambar mini]                        |    | |
| Bab 5 Rekomendasi   |   |  +---------------------------------------------+    | |
|                     |   |  Gambar 3.1  Terminal sisi beban PMT-2              | |
| Tampilan ini untuk  |   |  SUMBER: Inspeksi lapangan 22 Okt 2026              | |
| meninjau. Tata letak|   +-----------------------------------------------------+ |
| akhir: [ Buka PDF ] |                                                           |
+---------------------------------------------------------------------------------+

  Mode sunting di tempat (paragraf 3.2.2):
  +---------------------------------------------------------------------------+
  | Paragraf 3.2.2                       [B] [I] [Kode] [x^2] [x_2]   ...     |
  | +-----------------------------------------------------------------------+ |
  | | PMT-2 menunjukkan korosi berat pada terminal sisi beban dan sisi      | |
  | | sumber.                                                               | |
  | +-----------------------------------------------------------------------+ |
  |                                    [ Batal ] [ Simpan perubahan... * ]   |
  +---------------------------------------------------------------------------+
  Menu ...: Ganti dengan gambar . Sisipkan paragraf di bawah . Sisipkan gambar
            di bawah . Pindahkan... . Riwayat paragraf . Hapus paragraf
            . (ADMIN) Info teknis: pid p-d1g5j8l3mn, versi dasar 9

  Lembar perubahan (<dialog>):
  +---------------------------------------------------+
  | Simpan perubahan paragraf 3.2.2                   |
  | Apa yang diubah*  [Ubah paragraf 3.2.2_________]  |
  | Mengapa*          [Hasil inspeksi ulang 22 Okt__] |
  | Dampaknya*        [Paragraf 3.2.2 saja__________] |
  | [x] Buat ulang berkas lengkap setelah disimpan    |
  |     (hanya tampil bila dokumen Lengkap)           |
  |                      [ Batal ] [ Simpan * ]       |
  +---------------------------------------------------+

  Dialog Ganti dengan gambar:
  +---------------------------------------------------+
  | Ganti paragraf 3.2.2 dengan gambar                |
  | +-----------------------------------------------+ |
  | |  Tarik berkas ke sini atau [ Pilih berkas ]   | |
  | |  PNG, JPG, atau SVG, maksimal 10 MB           | |
  | +-----------------------------------------------+ |
  | [pratinjau gambar]                                |
  | Keterangan gambar* [__________________________]  |
  | Sumber             [__________________________]  |
  | Ukuran dan nomor gambar diatur otomatis oleh      |
  | templat.                                          |
  |                      [ Batal ] [ Lanjut * ]       |
  +---------------------------------------------------+
```
- Satu sunting aktif dalam satu waktu. Membuka sunting kedua saat yang pertama masih berubah memicu K-7.
- Ponsel: daftar isi menjadi tombol "Daftar isi" yang membuka lembar bawah. Lembar baca selebar layar dengan padding 16 px. Bilah format sunting menempel di atas keyboard (sticky bottom + `env(safe-area-inset-bottom)`).
- Batas "maksimal 10 MB" adalah contoh. Nilai sebenarnya dibaca dari kontrak/env aset (**hipotesis**; SR-25/R18 menetapkan).

### W8. Riwayat `?tab=riwayat` + panel Riwayat paragraf

```
+---------------------------------------------------------------------------------+
| (kepala W6)                                                                     |
| [Baca & sunting] [Kelengkapan] [Berkas] [Riwayat]                               |
|---------------------------------------------------------------------------------|
| Versi 10  23 Okt 10:02  Anda (rina@gsp)    Paragraf 3.2.2                        |
|   Apa: Perbarui temuan PMT-2 . Mengapa: Inspeksi ulang 22 Okt . Dampak: 3.2.2   |
|   [ Lihat versi ini ] [ Bandingkan dengan terbaru ] [ Buat berkas... ]          |
| Versi 6   23 Okt 09:12  gsp-analis-02      Bab 5 (dikirim agen)                 |
| Versi 5   23 Okt 09:12  gsp-analis-01      Bab 3 (dikirim agen)                 |
|   ...                                                                           |
|                                                  [ Muat versi lebih lama ]      |
+---------------------------------------------------------------------------------+

 Panel samping "Riwayat paragraf 3.2.2" (dari menu paragraf, W7):
 +--------------------------------------------+
 | Versi 10 . 10:02 . Anda                     |
 |  - korosi pada terminal sisi beban.         |
 |  + korosi berat pada terminal sisi beban    |
 |    dan sisi sumber.                         |
 | Versi 5 . 09:12 . gsp-analis-01 (dibuat)    |
 |              [ Pakai teks ini lagi ]        |
 +--------------------------------------------+
```

### W9. Tab Berkas `?tab=berkas` + dialog pratinjau

```
+---------------------------------------------------------------------------------+
| (kepala W6)                                                                     |
| [Baca & sunting] [Kelengkapan] [Berkas] [Riwayat]                               |
|---------------------------------------------------------------------------------|
| VERSI 10 . 23 Okt 10:03                                    {Berkas lengkap}     |
|  Laporan Inspeksi Gardu   PDF            1,8 MB   [ Buka ] [ Unduh ]            |
|  Laporan Inspeksi Gardu   Word (.docx)   0,9 MB   [ Unduh ]  Word tidak dapat   |
|                                                   dipratinjau. Lihat versi PDF  |
|  > Gambar dalam dokumen (6)                                                     |
| VERSI 6 . 23 Okt 09:13                                     {Draf bab 5}         |
|  Draf Bab 5               PDF   Bertanda DRAF   0,3 MB   [ Buka ] [ Unduh ]     |
|                                                                                 |
| Berkas sedang dibuat (versi 11): PDF selesai . Word sedang dibuat...            |
+---------------------------------------------------------------------------------+

 Dialog pratinjau (<dialog>, hampir layar penuh):
 +-------------------------------------------------------------------------+
 | Laporan Inspeksi Gardu . PDF . versi 10   [ Buka di tab baru ] [ Unduh ] [x] |
 | +---------------------------------------------------------------------+ |
 | |  <object type="application/pdf">  (cadangan: tautan buka di tab)    | |
 | +---------------------------------------------------------------------+ |
 +-------------------------------------------------------------------------+
```
- Status job gagal: "Berkas versi 11 gagal dibuat: mesin cetak PDF tidak siap. Word tetap tersedia." `[ Coba lagi ]` (jeda 3/6/12 s, maksimal 3 kali) + "Hubungi admin bila berulang". ADMIN mendapat tambahan tautan ke Sistem dan Info teknis berisi log job.

### W10. Galeri artefak `/studio/artifacts`

Struktur tiga tab yang ada dipertahankan (`artifact-studio.tsx:1-5`: Galeri, Katalog jenis, Buat). Perubahannya hanya mengikuti pedoman:
- Tombol Buka/Unduh memakai `fileUrl`.
- Istilah mengikuti kamus §1.2.
- Status kosong/galat mengikuti §5.
- Tab "Buat", yang berisi editor spesifikasi JSON, dipindah ke balik label "Mode developer" yang hanya tampil untuk ADMIN. **Hipotesis**: USER tidak membuat artefak manual (P1). Bila salah, tab tetap tampil (§8 T-6).

```
| Galeri artefak                                 Cari [______]  Jenis [Semua v] |
| [Galeri] [Katalog jenis] [Buat (ADMIN)]                                        |
| +--------+ +--------+ +--------+                                               |
| | grafik | | diagram| | simbol |   judul . jenis . misi . [Buka] [Unduh]       |
| +--------+ +--------+ +--------+                                               |
```

### W11. Alat developer `/studio/playground` (ADMIN)

```
+---------------------------------------------------------------------------------+
| Alat developer                                       {Khusus admin}             |
| Uji kiriman agen tanpa memengaruhi alur kerja. Semua kiriman nyata tercatat.    |
| [Kirim dokumen] [Kirim bab] [Kirim bagian] [Unggah aset]                        |
|---------------------------------------------------------------------------------|
| Templat [GSP DATUM v]  Misi [__________]  Contoh: [E1 dokumen v] [ Muat contoh ]|
| +----------------------------------------+ +----------------------------------+ |
| | editor JSON bernomor baris             | | HASIL                            | |
| |                                        | | Validasi: 2 masalah              | |
| |                                        | |  baris 14: "role" tidak dikenal  | |
| |                                        | | Kelengkapan setelah kirim:       | |
| |                                        | |  ▓▓▓░▓▓▒  Belum: Lembar kendali  | |
| +----------------------------------------+ | Respons mentah > (terlipat)      | |
| [ Rapikan ] [ Unggah .json ]               +----------------------------------+ |
|                              [ Validasi ] [ Kirim ke Studio * ]                 |
+---------------------------------------------------------------------------------+
```
- USER yang membuka URL melihat `EmptyState`: "Halaman ini khusus admin. Dokumen dikirim oleh agen; Anda dapat meninjaunya di Dokumen." `[ Buka Dokumen ]`. Server tetap menegakkan hak.
- "Kirim ke Studio" adalah kiriman nyata dan memerlukan konfirmasi K-10.

### W12. Sistem `/studio/system`

- ADMIN: panel yang ada (`render-status/`: kesiapan mesin cetak, fon, Chromium, antrean, job terbaru) dengan judul awam: "Mesin cetak Word/PDF", "Huruf terpasang (22)", "Pembuat PDF dari halaman web", "Antrean". Kode dan sha di Info teknis.
- USER: satu kartu: "Mesin cetak siap. Berkas dibuat normal." atau "Mesin cetak bermasalah sejak 09:40. Pembuatan PDF mungkin tertunda. Admin sudah dapat melihat masalah ini di halaman Sistem."

---

## 5. Status kosong, memuat, galat, dan konfirmasi

### 5.1 Pola bersama

| Status | Pola | Komponen |
|---|---|---|
| Memuat pertama | Kerangka berbentuk sama dengan isi akhir (baris daftar, lembar, kartu), bukan pemutar di tengah layar. `aria-busy="true"` di wadah | `Skeleton` (kit) |
| Memuat ulang (data sudah ada) | Isi lama tetap tampil, indikator kecil "Memperbarui…" di kepala. Tidak berkedip ke kerangka | `shared/notice` |
| Kosong | Kalimat apa yang akan muncul di sini dan bagaimana caranya, ditambah satu tindakan | `EmptyState` (kit) |
| Galat muat (jaringan/5xx) | Judul awam + penjelasan + `[ Coba lagi ]` dengan hitung mundur 3/6/12 s, maksimal 3 kali, tombol nonaktif saat jeda dan menampilkan sisa detik. Setelah 3 kali: "Masih gagal. Muat ulang halaman atau hubungi admin." Galat dicatat ke `client-log` dengan correlationId | `shared/error-view` + `shared/use-cooldown` |
| 401 | "Sesi Anda berakhir." `[ Masuk lagi ]` ke `/login?next=<url>`. Draf sunting tetap di `localStorage` | `shared/error-view` |
| 403 | Mode baca saja + alasan (§2.2). Bukan layar galat | per layar |
| 404 | "Dokumen ini tidak ditemukan. Mungkin tautannya salah atau dokumen dipindah." `[ Kembali ke Dokumen ]` | `not-found.tsx` per segmen bila diperlukan |
| Galat render komponen | Boundary segmen (§6.4): "Bagian halaman ini gagal ditampilkan." `[ Coba lagi ]` (reset boundary) + log ke `client-log` | `app/studio/**/error.tsx` + `shared/error-view` |
| Sukses tindakan | Notifikasi status singkat di pojok kanan bawah (`role="status"`, hilang setelah 5 s, dapat ditutup, berhenti saat fokus/hover) dengan nama tindakan yang sama: "Versi 4 disimpan", "Berkas siap", "Disimpan sebagai versi 10" | `shared/notice` (tanpa pustaka baru, §8 T-7) |
| Galat tindakan | Dekat tombol pemicu (inline, `role="alert"`), bukan notifikasi yang menghilang. Galat validasi medan tampil di bawah medan dengan `aria-describedby` | per formulir |

### 5.2 Katalog pesan galat (kode API ke teks layar)

Satu peta kode-ke-teks di `shared/error-messages.ts`. Pesan per modul yang ada (mis. `template-editor/api.ts:62`, `section-composer/api.ts:58`) dipindah ke sana. Kode mentah hanya tampil di Info teknis (ADMIN).

| Kode (blueprint §2.7) | Judul di layar | Penjelasan + tindakan |
|---|---|---|
| `DOCUMENT_INCOMPLETE` 409 | Dokumen belum lengkap | "Berkas lengkap butuh semua bagian wajib. Belum ada: Lembar kendali, Bab 4." Tindakan: `[ Buat draf bab ini ]`, `[ Lihat kelengkapan ]`. Rel diperbarui dari `details.completeness` |
| `SCOPE_CONFLICT` 409 | Paragraf ini sudah diubah orang lain | Dialog konflik (§3c) |
| `PID_NOT_FOUND` 404 | Paragraf ini sudah tidak ada | "Paragraf mungkin dihapus atau dipindah di versi terbaru." `[ Muat versi terbaru ]` |
| `ASSET_NOT_FOUND` 422/404 | Gambar tidak ditemukan | "Unggah ulang gambar lalu simpan lagi." Kembali ke langkah unggah |
| `SCHEMA_INVALID` 400 (dari UI) | Isian belum sesuai | Pesan per medan dari `issues`. Bila tidak dapat dipetakan: "Isian tidak dapat disimpan. Hubungi admin dan sertakan kode di Info teknis." |
| `PARAM_CLASS_K_FORBIDDEN` 403 | Pengaturan ini dikunci admin | "Pengaturan yang menjaga standar DATUM hanya dapat diubah admin. Kembalikan ke nilai sebelumnya untuk menyimpan." `[ Kembalikan ]` |
| `PARAM_SURFACE_FORBIDDEN` 403 | Pengaturan lanjutan khusus admin | "Hapus perubahan pada pengaturan lanjutan atau minta admin menyimpannya." |
| `PRESET_READONLY` 403 | Gaya hanya dapat diubah admin | "Pilih gaya lain atau minta admin mengubah gaya ini." |
| `FORBIDDEN` 403 (`CANONICAL_ADMIN_ONLY`, templat terbatas) | Hanya admin yang dapat mengubah ini | "Templat kanonik dijaga admin. Buat salinan untuk menyesuaikan." `[ Buat salinan ]` |
| `SLOT_POSITION_LOCKED` 422 | Posisi bagian ini tetap | "Sampul selalu di awal dan Lampiran selalu di akhir." |
| `SLOT_REQUIRED_MISSING` / `SLOT_DUPLICATE` / `SLOT_PARAM_SCOPE_INVALID` 422 | Susunan belum valid | Kalimat dari `message` server (berbahasa Indonesia, §2.7) + tautan ke kartu bagian terkait |
| `META_CONFLICT` / `TEMPLATE_MISMATCH` 409 | Dokumen untuk misi ini sudah ada | `[ Buka dokumen yang ada ]` |
| 429 (FIX-1) | Terlalu banyak permintaan | "Tunggu {n} detik lalu coba lagi." Hitung mundur dari `Retry-After` |
| 503 (FIX-8, mesin cetak) | Mesin cetak sedang tidak siap | "Perubahan Anda sudah tersimpan. Berkas akan bisa dibuat setelah mesin siap." `[ Coba lagi ]` (jeda) |
| Jaringan / 5xx lain | Tidak dapat terhubung ke Studio | Pola coba ulang §5.1 |

### 5.3 Konfirmasi aksi berisiko

Semua konfirmasi memakai `<dialog>` bawaan (`showModal()`; fokus awal di tombol aman; Esc = batal; fokus kembali ke pemicu). Tombol bahaya bergaya `ghost` dengan teks `--down` dan kata kerja spesifik, tidak memakai "OK"/"Ya".

| ID | Aksi | Teks konfirmasi | Tombol |
|---|---|---|---|
| K-1 | Ganti gaya templat yang sudah diatur | "Ganti ke gaya DATUM Kanonik? 5 pengaturan yang Anda ubah akan kembali ke nilai gaya baru. Versi tersimpan tidak berubah." | Batal / **Ganti gaya** |
| K-2 | Hapus bagian dari susunan | "Hapus bagian Lampiran dari susunan? Dokumen yang sudah ada tidak terpengaruh; dokumen baru tidak akan punya bagian ini." | Batal / **Hapus bagian** |
| K-3 | Jadikan opsional bagian yang wajib menurut gaya | "Lembar kendali wajib di gaya GSP DATUM untuk terbitan resmi. Jadikan opsional? Dokumen bisa dinyatakan lengkap tanpa bagian ini." | Batal / **Jadikan opsional** |
| K-4 | Hapus paragraf | "Hapus paragraf 3.2.2? Penomoran paragraf sesudahnya akan bergeser. Teksnya tetap ada di Riwayat." + medan Mengapa | Batal / **Hapus paragraf** |
| K-5 | Timpa saat konflik | "Teks gsp-analis-02 di versi 9 akan diganti teks Anda. Teks mereka tetap ada di Riwayat." | Batal / **Simpan teks saya** |
| K-6 | Tinggalkan editor templat dengan perubahan | "Ada perubahan yang belum disimpan. Tinggalkan halaman? Draf disimpan di browser ini." | Tetap di sini / **Tinggalkan** |
| K-7 | Buang sunting paragraf | "Buang perubahan pada paragraf 3.2.2?" | Lanjut menyunting / **Buang** |
| K-8 | (ADMIN) Ganti versi templat dokumen | "Pindahkan dokumen ke Templat GSP DATUM versi 5? Tampilan berkas berikutnya bisa berubah. Isi tidak berubah. Versi dokumen baru akan dibuat." | Batal / **Pindahkan ke versi 5** |
| K-9 | (ADMIN) Nomori ulang bab | "Nomori ulang bab menjadi 1..n berurutan? Rujukan nomor bab di dalam teks tidak ikut diubah." | Batal / **Nomori ulang** |
| K-10 | (ADMIN) Kirim dari Alat developer | "Kirim ke Studio sebagai kiriman nyata untuk Misi A? Ini membuat versi dokumen baru." | Batal / **Kirim** |

Yang tidak memerlukan konfirmasi (dapat dibalik atau tidak merusak): simpan versi templat (versi lama utuh, D-06/D-62), buat berkas, buat draf, sunting paragraf (sudah melalui lembar perubahan), dan urut ulang bagian sebelum disimpan.

---

## 6. Pedoman komponen

### 6.1 Kit HQ dan gaya

- Pakai `Panel`, `Button`, `Pill`, `SectionHeader`, `EmptyState`, `Skeleton`, `Eyebrow` dari `@/components/ui/kit`. Jangan membuat varian tombol lokal. Bila kit kurang (mis. `Button` tanpa `aria-disabled`/`aria-describedby`), tambahkan properti opsional ke kit secara aditif lewat permintaan ke pemilik kit (§8 T-8).
- Warna hanya lewat token `var(--…)`. Ganti `text-neutral-500` (S86 R16) dengan `text-[var(--text-3)]`. Token lembar baca bersifat lokal Studio (§1.3), di `src/components/studio/shared/studio-tokens.css` atau sebagai variabel di wadah lembar.
- Halaman tidak membungkus ulang dengan `p-6 max-w-7xl` di dalam layout `max-w-6xl` (S86 R16: `templates/page.tsx:9`, `templates/[id]/page.tsx:38`, `templates/[id]/versions/page.tsx:10`, `template-preview/index.tsx:367`). Pengecualiannya hanya editor templat dan halaman dokumen, yang boleh memakai lebar penuh kontainer (`max-w-6xl`) dengan grid dua kolom.
- Ikon hanya `lucide-react` dengan `strokeWidth` seragam (2), `aria-hidden` bila dekoratif, dan selalu berdampingan dengan teks untuk makna status.
- Angka memakai kelas `num` (tabular) dan `toLocaleString("id-ID")`. Tanggal memakai format "23 Okt 2026, 09:12" lewat formatter bersama.

### 6.2 Modul bersama (`src/components/studio/shared/`)

| Modul | Isi | Menutup |
|---|---|---|
| `http.ts` | Satu `requestJson<T>(url, init & {signal, source})` dan satu kelas `StudioApiError {status, code, message, details, correlationId, url, retryable}`. Membaca `x-correlation-id`, memetakan 429 `Retry-After`, `retryable` = jaringan/5xx/429. Setiap galat dicatat ke `client-log` dengan `source` = `studio.ui.<modul>.<sumber>` | S86 R05, R17 |
| `use-studio-query.ts` | Hook muat data dengan `AbortController`, tanpa permintaan ganda untuk kunci yang sama (dedupe selama permintaan masih berjalan; StrictMode aman), coba ulang memakai `use-cooldown` | R05 (pembungkus ganda), "fetch ganda" |
| `use-cooldown.ts` | Satu hook hitung mundur jeda dari `RETRY_DELAYS_S` (`shared/retry.ts:9-12`), kembalian `{secondsLeft, attempt, canRetry, trigger}` | R10 |
| `file-url.ts` | `fileUrl(file, "inline" \| "download")`, validasi awalan `/api/studio/files/` | R06, SEC-3 |
| `error-view.tsx` | Tampilan galat seragam (judul, penjelasan, tindakan, coba ulang, Info teknis ADMIN), dipakai boundary dan galat muat | R07 |
| `error-messages.ts` | Peta kode ke teks §5.2 | R05 (pesan lokal tersebar) |
| `labels.ts` | Kamus §1.2 (gabungan label dari `document-viewer/labels.ts`, `revision/labels.ts`, `artifact-gallery/labels.ts`) | P3 |
| `dialog.tsx` | `ConfirmDialog` dan `Sheet` di atas `<dialog>` bawaan (fokus awal, Esc, pemulihan fokus, `aria-labelledby`) | R11 |
| `notice.tsx` | Notifikasi status + wilayah `aria-live` tunggal per halaman | §5.1 |
| `completeness-rail.tsx` | Rel kelengkapan tiga ukuran (`sm`/`md`/`list`), input = ringkasan kelengkapan kontrak | P4 |
| `info-teknis.tsx` | Panel `<details>` terlipat yang hanya dirender untuk ADMIN | P3 |
| `use-viewer.ts` | Peran dari `/api/auth/me`, dimuat sekali per sesi halaman dan dibagikan lewat context di `app/studio/layout.tsx` | §2.2 (menggantikan `getSessionUser` lokal `section-composer/api.ts:159`) |

Aturan: modul fitur **tidak** boleh membuat pembungkus `fetch`, kelas galat, hook coba ulang, atau pembangun URL berkas sendiri. SR-56 memeriksanya dengan grep `class \w+Error extends Error` dan `fetch(` di `src/components/studio/**` di luar `shared/`.

### 6.3 Data dan kinerja

- Satu layar memuat satu sumber utama dan meneruskannya ke bawah. Komponen anak tidak memuat ulang sumber yang sama. Pengecualian yang disengaja: kartu Beranda memuat sendiri-sendiri (isolasi galat).
- Halaman dokumen: kepala (R05 ringkas + R15) dimuat sekali dan dibagikan ke keempat tab lewat context. Tab Baca memuat R20 secara malas saat dibuka, dan bab panjang dirender per bagian saat terlihat (`content-visibility: auto`, tanpa listener scroll).
- Pratinjau templat memakai jeda 600 ms dan membatalkan permintaan sebelumnya (`AbortController`).
- Polling job (§3b) mengikuti `visibilitychange`, tidak memakai interval tetap tanpa henti.

### 6.4 Error boundary per segmen

| Berkas | Menaungi |
|---|---|
| `src/app/studio/error.tsx` (baru) | Semua rute Studio yang belum punya boundary: `/studio`, `/studio/documents`, `/studio/playground`, `/studio/system` (S86 R07) |
| `src/app/studio/documents/[id]/error.tsx` (baru) | Halaman dokumen dan keempat tab. Kepala tetap bisa dipulihkan lewat reset |
| `src/app/studio/templates/[id]/error.tsx` (baru) | Editor templat + Susunan |
| Boundary lama (`artifacts/error.tsx`, `documents/[id]/{edit,revisions}/error.tsx`, `section-composer/error-boundary.tsx`, `template-editor/shared.tsx:173`, `render-status/index.tsx:19`) | Dipensiunkan atau dijadikan pembungkus tipis `shared/error-view`. Boundary untuk rute yang dialihkan (§2.1) dihapus bersama rutenya (pemilik baris, tidak diam-diam) |

Setiap boundary memanggil `client-log` (sekali per galat) dan menampilkan `shared/error-view` dengan `[ Coba lagi ]` = `reset()`.

### 6.5 Aksesibilitas (WCAG 2.2 AA)

- **Fokus terlihat** di semua kontrol: `focus-visible:outline-2 outline-[var(--accent)] outline-offset-2`. Untuk radio/checkbox `sr-only` di dalam pil, pakai `has-[:focus-visible]:outline` (pola `artifact-gallery/create-panel.tsx:224`; menutup S86 R12).
- **Dialog bawaan** `<dialog>.showModal()` untuk semua modal dan lembar. Tidak memakai `div role="dialog"` (R11).
- **Label**: setiap kontrol berlabel. Bantuan dihubungkan dengan `aria-describedby`. Galat medan memakai `aria-invalid` + `aria-describedby`.
- **Tab** halaman dokumen memakai pola ARIA tablist dengan panah kiri/kanan (pola `artifact-studio.tsx:78-96`). Tab tersimpan di URL.
- **Paragraf yang dapat disunting**: `tabIndex=0`, Enter/Spasi untuk sunting, Esc untuk keluar, dan fokus kembali ke paragraf setelah simpan/batal.
- **Pengumuman**: satu wilayah `aria-live="polite"` per halaman untuk perubahan kelengkapan, pemindahan bagian, dan status job. Galat memakai `role="alert"`.
- **Rel kelengkapan**: `role="img"` + `aria-label` ringkas. Segmen yang dapat difokus diberi label lengkap. Status tidak dibedakan hanya dengan warna (pola, §1.3).
- **Tombol nonaktif yang menjelaskan** memakai `aria-disabled="true"` + `aria-describedby` ke alasan, bukan `disabled` (P5).
- **Kontras** (dihitung dari hex token, rumus luminans WCAG): teks isi dan label yang bermakna di permukaan gelap minimal `--text-2` (#a0a3a8). `--text-3` (#6b6e74) hanya sekitar 3,7:1 terhadap `--surface-1` (#101113), di bawah 4,5:1. Karena itu `--text-3` hanya boleh untuk teks besar (≥ 18,66 px tebal / 24 px) atau dekorasi yang tidak membawa informasi. Petunjuk kecil yang membawa informasi (mis. "Bawaan gaya: A4", alasan tombol nonaktif) memakai `--text-2`. Lembar baca: ink sekitar 14,2:1, ink-2 sekitar 6,9:1 terhadap paper.
- **Target sentuh** ≥ 24×24 px (WCAG 2.5.8). Untuk ikon di ponsel, 44×44 px.
- Hormati `prefers-reduced-motion` (§1.3).

### 6.6 Responsif

| Lebar | Perilaku |
|---|---|
| ≥ 1024 px | Halaman dokumen: daftar isi 240 px + lembar. Editor templat: kenop 1fr + pratinjau 420 px |
| 640-1023 px | Daftar isi menjadi tombol + lembar bawah. Pratinjau templat di bawah kenop |
| < 640 px | Satu kolom. Tabel menjadi kartu. Subnav digulir horizontal (sudah, `studio-subnav.tsx:25`). Seret dinonaktifkan pada `pointer: coarse` (pakai menu). Bilah sunting menempel di bawah dengan `env(safe-area-inset-bottom)` |

Tabel lebar (kelengkapan, berkas) berada dalam wadah `overflow-x-auto` di breakpoint tengah. Halaman tidak pernah menggulir horizontal.

### 6.7 Pencatatan galat klien

Semua jalur galat memakai `shared/client-log.ts` yang ada (dinilai baik oleh S86 §5). Sumbernya `studio.ui.<modul>.<sumber>` (R17), dengan correlationId dari `http.ts`. Tidak ada `console.*` di luar helper itu.

---

## 7. Pemetaan ke baris implementasi

Rekomendasi urutan: FIX-4 dipecah dua. **FIX-4a (fondasi)** dijalankan sebelum atau bersama awal SR-28..SR-31 karena keempatnya bergantung pada `shared/*`. **FIX-4b (migrasi modul lain)** dijalankan setelahnya. Bila controller tidak memecah FIX-4, fondasi §6.2 harus menjadi dependensi B untuk SR-28..SR-31 (§8 T-9).

| Baris | Isi dari spesifikasi ini | Berkas (area) | Bergantung pada |
|---|---|---|---|
| **FIX-4a** fondasi | `shared/{http,use-studio-query,use-cooldown,file-url,error-view,error-messages,labels,dialog,notice,completeness-rail,info-teknis,use-viewer}.ts(x)` + token lembar. `app/studio/error.tsx`, `documents/[id]/error.tsx`, `templates/[id]/error.tsx`. `app/studio/layout.tsx` (judul seragam, context peran, tanpa padding ganda). `STUDIO_NAV` + `audience/shortLabel/paletteLabel` → sidebar, palet, subnav (§2.3) | `src/components/studio/shared/**`, `src/app/studio/{layout,error}.tsx`, `src/app/studio/{documents/[id],templates/[id]}/error.tsx`, `document-viewer/studio-subnav.tsx`, `src/lib/studio/contract/ui.ts` (aditif), `src/components/{sidebar,command-palette}.tsx` | SR-04 (kontrak kelengkapan); kepemilikan berkas kontrak dan HQ bersama perlu izin controller (§8 T-10) |
| **SR-28** Susunan dokumen | W4. Stepper bersama (komponen `template-stepper`, dipakai SR-29) dan komponen langkah 4 "Simpan versi" bersama. Kartu bagian, seret + keyboard + menu, sakelar Wajib, ≤ 8 pengaturan bagian + lanjutan ADMIN, tambah/hapus bagian (K-2, K-3), pemeriksaan susunan (R08), simpan via R19 dengan `ConfirmDialog`/`Sheet` bersama | `src/components/studio/section-composer/**`, `src/app/studio/templates/[id]/sections/page.tsx` | FIX-4a, SR-26, SR-27 |
| **SR-29** Editor templat | W2 (daftar + dialog Buat templat + tab Gaya ADMIN), W3 (Gaya, Pengaturan dengan pratinjau langsung, Simpan memakai komponen SR-28). Mode gaya ADMIN. K-1, K-6. `TemplatePreviewPane` menerima esensial (penyesuaian `template-preview/` disetujui sebagai bagian SR-29 atau permintaan ke pemiliknya) | `src/components/studio/template-editor/**`, (+ `template-preview/**` bila diizinkan), `src/app/studio/templates/{page,[id]/page,[id]/versions/page}.tsx` (bungkus padding, R16) | FIX-4a, SR-27, SR-61, komponen bersama SR-28 |
| **SR-30** Dokumen | W5 (daftar per misi + Buat dokumen D-153), W6 (kepala + kartu Buat berkas + Kelengkapan), W7 (Lembar baca, sunting di tempat, ganti jadi gambar, sisip/hapus/pindah, konflik), W8 (Riwayat dokumen + paragraf, memakai `revision/{diff-view,text-diff}.tsx`), W9 (Berkas + dialog pratinjau, `fileUrl`), W1 Beranda (`studio-home.tsx` ada di folder `document-viewer/`). Pengalihan `/edit`, `/revisions`, `/revisions/[rev]` ke tab | `src/components/studio/document-viewer/**`, `src/app/studio/documents/**`, `src/app/studio/page.tsx` | FIX-4a, SR-20, SR-22, SR-23, SR-24 (+ R16, R18, R20) |
| **SR-31** Alat developer | W11. Mode Kirim dokumen / bab / bagian / Unggah aset, contoh E1/E2, validasi + rel kelengkapan. Hanya ADMIN di UI (layar khusus admin untuk USER). Pecah `playground.tsx` (1079 baris, 25 `useState`) menjadi `useSchemaExamples`, `usePlaygroundActions`, `useDraftAutosave` (R09). `STUDIO_SCHEMA_BASE_URL` dari kontrak (R15). `fileUrl` di `panels.tsx` (R06). K-10 | `src/components/studio/playground/**`, `src/app/studio/playground/page.tsx` | FIX-4a, SR-20, SR-21, SR-25 |
| **FIX-4b** migrasi modul lain | `revision/**`: pakai `shared/http` + `fileUrl` (`job-status.tsx:53,56`), fokus pil (`edit-workspace.tsx:528-535`, R12), hapus ekspor mati `inlineToPlain`, `addressKindLabel` atau pindahkan pemakaiannya (R13). `artifact-gallery/**` dan `template-preview/**` ke `shared/http` + label (R05, R17). `render-status/**` dengan judul awam W12 + kartu USER. Galeri: tab Buat ADMIN (W10, bila T-6 disetujui) | `src/components/studio/{revision,artifact-gallery,template-preview,render-status}/**`, `src/app/studio/{artifacts,system}/**` | FIX-4a; setelah SR-30 (yang memakai ulang komponen `revision/`) |

### 7.1 Penutupan temuan S86 oleh desain ini

| Temuan | Ditutup oleh | Cara |
|---|---|---|
| R05 tujuh pembungkus fetch + tujuh kelas galat | FIX-4a (`shared/http.ts`) + aturan §6.2; SR-28..31 dan FIX-4b memakainya | Satu klien, satu `StudioApiError`, correlationId selalu dibaca |
| R06 "Buka" mengunduh | FIX-4a (`file-url.ts`) + alur 3d; dipakai SR-30, SR-31, FIX-4b | Buka = inline/pratinjau, Unduh = attachment |
| R07 tanpa error boundary | FIX-4a (§6.4) | Boundary akar Studio + per segmen dokumen/templat |
| R09 playground 920 baris | SR-31 | Pecah menjadi hook + ADMIN saja |
| R10 delapan timer coba ulang | FIX-4a (`use-cooldown.ts`) | Satu hook |
| R11 dialog tanpa focus trap | FIX-4a (`dialog.tsx`) + SR-28 | `<dialog>` bawaan |
| R12 fokus radio pil | FIX-4b (bila `edit-workspace` tetap) atau hilang bersama rute `/edit` yang dialihkan (SR-30) | Pola `has-[:focus-visible]` |
| R13 kode mati + uji UI | FIX-4b (kode mati). Uji unit logika murni UI (`client-log`, `completeness-rail` pemetaan status, `use-cooldown`) masuk fase uji akhir (D-133; SR-4x test-expert) | |
| R14 navigasi didefinisikan empat kali | FIX-4a (§2.3) | `STUDIO_NAV` tunggal + `audience` |
| R15 `SCHEMA_URL_BASE` hardcode | SR-31 | Impor kontrak |
| R16 padding ganda, judul tidak seragam, `text-neutral-500` | FIX-4a (layout, judul) + SR-29 (halaman templat) + FIX-4b (`template-preview/index.tsx:367`) | §6.1 |
| R17 dua skema `source` log | FIX-4a (`http.ts` memaksa format) | `studio.ui.<modul>.<sumber>` |
| SEC-3 URL server tanpa cek awalan | FIX-4a (`file-url.ts`) | Validasi awalan |
| SEC-1, SEC-2 | Dipertahankan (iframe `sandbox=""` + `title`; PDF `<object>` + cadangan) | Pola W9 |
| R01-R04, R08, R18-R21 | Di luar lingkup UX (pembanding paritas, runner benchmark, dokumen agent, ekstraktor) | Tetap di baris pemiliknya / FIX-2 |

---

## 8. Keputusan desain dan pertanyaan terbuka (untuk controller)

| ID | Butir | Usulan UX-01 | Perlu |
|---|---|---|---|
| T-1 | "Mode ahli" (blueprint §2.3: lanjutan untuk "ADMIN atau mode ahli") belum punya definisi cara pemberiannya | Pengaturan lanjutan hanya untuk ADMIN di v2.1. Mode ahli untuk USER ditunda sampai ada flag peran di server | Keputusan user/controller |
| T-2 | Simpan langkah 2 (esensial, R02) + langkah 3 (susunan, R19) sebagai satu versi | Satu POST gabungan `studio.template/v2` bila R02 menerimanya. Bila tidak, dua POST berurutan dengan pelaporan gabungan | Konfirmasi SR-21/SR-26 (pemilik route) |
| T-3 | Nama misi yang ramah (bukan nama folder) | Pakai judul misi HQ bila ada endpoint. Bila tidak, ubah `2026-10-23_misi_a` menjadi "Misi A · 23 Okt 2026" | Cek sumber data misi HQ |
| T-4 | Nama agen pengisi | Tampilkan id agen apa adanya (sudah bermakna, mis. `gsp-analis-02`) dan nama bila HQ menyediakan peta | Opsional |
| T-5 | "Dipakai N dokumen" per templat/versi | Tampil hanya bila R01 menyediakan agregat | Permintaan opsional ke pemilik R01 |
| T-6 | Tab "Buat" di Galeri artefak untuk USER | Pindahkan ke ADMIN (P1). Bila user memang membuat grafik manual, tetap untuk semua | Keputusan user |
| T-7 | Notifikasi tanpa pustaka (HQ tidak punya `sonner`/toast; grep `toast` hanya `brand-guard.tsx`) | Komponen `shared/notice.tsx` kecil, tanpa dependensi baru (stack is law) | Diterima bila tidak ada keberatan |
| T-8 | `Button` kit belum mendukung `aria-disabled`/`aria-describedby` | Penambahan properti opsional aditif di `src/components/ui/kit.tsx` | Izin pemilik kit HQ (berkas bersama) |
| T-9 | FIX-4 dipecah 4a (fondasi, sebelum SR-28..31) dan 4b (migrasi, sesudah SR-30) | Lihat §7. Selaras dengan D-161 butir 2 ("UI dibangun ulang sekali dengan benar") | Keputusan controller + pembaruan dependensi |
| T-10 | Berkas di luar area Studio: `src/lib/studio/contract/ui.ts`, `src/components/{sidebar,command-palette}.tsx`, `src/components/ui/kit.tsx` | Diklaim FIX-4a secara aditif | Izin single-writer controller |
| T-11 | Rute lama `/documents/[id]/edit` dan `/revisions*` | Dialihkan (tidak dihapus diam-diam) ke tab halaman dokumen, agar tautan lama dan panduan agent tetap jalan | Konfirmasi. Penghapusan berkas boundary lama dicatat sebagai keputusan |
| T-12 | Lembar baca terang di HQ gelap (satu-satunya permukaan terang) | Diusulkan sebagai risiko estetis yang disengaja (§1.3). Alternatifnya lembar gelap `--surface-1` dengan rasio kertas | Persetujuan user (selera) |
| T-13 | Tabel kompleks (spesifikasi, keuangan, aturan) di Lembar baca | Tampilan sederhana + "lihat di PDF". Sunting tabel di tempat di luar lingkup v2.1 (agen yang mengirim ulang). Sunting paragraf/gambar/daftar sederhana masuk lingkup | Konfirmasi lingkup SR-30 |

---

## 9. Kriteria penerimaan UX (untuk SR-52 E2E dan SR-56 review)

| # | Kriteria | Cara cek |
|---|---|---|
| A1 | Navigasi USER tidak menampilkan Alat developer/Sistem penuh. ADMIN menampilkannya. Urutan: Beranda, Dokumen, Templat, Galeri artefak | E2E dua peran |
| A2 | Tidak ada kata terlarang §1.2 di string JSX permukaan utama (di luar `InfoTeknis`, Alat developer, Pengaturan lanjutan) | grep string JSX `src/components/studio/**` |
| A3 | Editor templat: ≤ 8 kenop per kelompok global dan per bagian di tampilan bawaan. Lanjutan terlipat dan tidak dirender untuk USER | E2E + hitung DOM |
| A4 | Perubahan kenop memperbarui pratinjau ≤ 2 s setelah berhenti mengetik (jeda 600 ms + render) pada data contoh | E2E dengan waktu |
| A5 | Susunan: urut ulang dengan mouse dan dengan keyboard saja, bagian Posisi tetap tidak dapat dipindah, simpan menghasilkan versi baru dan versi lama utuh | E2E + DB |
| A6 | Daftar dokumen dikelompokkan per misi dengan rel kelengkapan yang cocok dengan R15 (segmen = bagian aktif) | E2E + bandingkan respons API |
| A7 | "Berkas lengkap" pada dokumen Belum lengkap tidak memicu render. Ia membuka daftar kekurangan yang sesuai `missingRequired`. Draf bab tetap bisa dibuat | E2E (tidak ada POST R17 scope DOCUMENT) |
| A8 | Tab Baca menampilkan isi sebagai lembar bernomor, bukan JSON/pohon alamat. Klik/Enter pada paragraf membuka sunting. Simpan mewajibkan Apa/Mengapa/Dampak dan menghasilkan versi baru | E2E |
| A9 | Ganti paragraf jadi gambar: unggah, keterangan, simpan. Paragraf (pid sama) kini blok gambar. Tidak ada medan ukuran di UI | E2E + R16 GET |
| A10 | Konflik (dua sesi menyunting paragraf sama) menampilkan dialog konflik dengan dua teks dan tiga pilihan | E2E dua konteks |
| A11 | Buka PDF/HTML/gambar menampilkan pratinjau (respons `inline`). Unduh menghasilkan `attachment`. Word hanya Unduh. Tidak ada `href` berkas yang tidak lewat `fileUrl` | E2E (header respons) + grep |
| A12 | Galat jaringan menampilkan pesan awam + coba ulang dengan hitung mundur 3/6/12 s dan maksimal 3 kali. Setiap galat tercatat di `client-log` dengan correlationId | E2E dengan API dimatikan + log DB |
| A13 | Galat render komponen di `/studio`, `/studio/documents`, `/studio/playground` tertangkap boundary Studio (bukan layar galat Next bawaan) | uji paksa throw |
| A14 | Semua modal memakai `<dialog>`. Fokus terlihat di semua kontrol (keyboard-only walk). Pemindai a11y (axe) 0 pelanggaran serius/kritis di W1-W9 | E2E + axe |
| A15 | 400 px: tanpa gulir horizontal halaman, tabel menjadi kartu, sunting paragraf bisa dilakukan | E2E viewport ponsel |
| A16 | Tidak ada pembungkus `fetch`/kelas galat/hook coba ulang/pembangun URL berkas di luar `shared/` | grep §6.2 |

Akhir spesifikasi.
