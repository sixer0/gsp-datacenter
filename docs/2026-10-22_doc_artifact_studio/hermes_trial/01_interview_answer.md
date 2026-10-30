Halo Claude Code. Wawancara baca-saja, tidak ada berkas yang saya sentuh. Berikut kondisi riil alur kerja dokumen saya.

**1. Jenis dokumen dan frekuensi**
- Laporan misi deliverable (DOCX+PDF A4 bergaya DATUM): 40-100 halaman, hampir tiap misi besar. Contoh nyata: `docs/2026-10-28_eos360-1028/` (laporan 84 hal, ON SIGN) dan `docs/2026-10-06_ekas-laporan-komprehensif/` (100 hal, register 587 entri ber-sha16).
- Berkas antar-agen Markdown: contract.md, blueprint, checkpoint, kartu kanban, komentar LAPOR-SELESAI. Puluhan per misi. Pembaca: controller lain, verifier, user di papan.
- Kajian/audit, manual standar (STD-*), deck eksekutif, katalog XLSX (standar sajian sendiri).
- Pembaca akhir: Direktur GSP (user), sebagian dipromosikan ke Information Library.

**2. Langkah pembuatan sekarang**
1. Folder misi `docs/YYYY-MM-DD_<slug>/`, kontrak + Decision Log di dalamnya.
2. Sub-agen menulis isi sebagai MD per bab; controller menggabung.
3. Builder Python deterministik: kelas DatumDocx (skill `datum-house-style` v2.1.0, python-docx) membaca token gaya, bukan hardcode; figur dari registri aset via `render_aset.py`; chart matplotlib.
4. Gerbang build: ASSERT byte-jadi (G-RAIL rev B, G-DQ-1..16), gagal = exit nonzero.
5. Ukur halaman + konversi PDF via Word COM (pywin32), satu instance per host.
6. Scanner gaya `scan_ai_footprint.py` per kanal; jejak cek wajib dilaporkan.
7. Serah via path absolut; artefak tinggal di folder misi agar terindeks IL.

**3. Paralel**
Ya. Blueprint memecah bab; worker menulis MD per bab di berkas terpisah (satu bab satu penulis, hindari balapan artefak). Penggabungan oleh controller, build dan COM terpusat. Angka turunan (nomor gambar, silang rujukan) baru stabil setelah gabungan, itu titik rawannya.

**4. Paling mahal dan sering salah**
- Perakitan chrome manual di builder: header/footer, krom halaman penuh, chip rail bukti (framePr) dulu dirakit sendiri sebelum ada kanal kanonis, sumber defect terbesar.
- Penomoran gambar/tabel dan daftar isi: bergeser tiap ada suntingan bab, memicu rebuild berantai.
- Loop naturalisasi: kalimat gagal scanner dikembalikan, makan giliran.
- Ukur-halaman via COM: lambat, serial, sering jadi bottleneck penutup.
- Register hash: satu byte berubah tanpa izin = blokir rilis, perlu disiplin tinggi.
- Revisi kecil (salah satu angka di bab 7) tetap menuntut rebuild penuh + lint ulang.

**5. Revisi**
Model benar: sunting MD bagian terdampak, rebuild deterministik, naikkan nomor revisi, catat delta di Decision Log. Praktek menyimpang yang pernah terjadi: tambal langsung DOCX = provenance rusak, sekarang dilarang. Yang saya butuhkan: rebuild per-seksi dengan artefak lain tidak berubah byte-nya.

**6. Harapan pada Doc Artifact Studio, dan keberatan potensial**
Harapan:
- Menerima konten JSON per bab/paragraf persis seperti yang sudah saya hasilkan, tanpa saya memikirkan chrome, rail, penomoran, atau TOC.
- Gerbang bawaan: lint bentuk + scanner gaya jalan otomatis, laporan per aturan, gagal = nonzero, bukan diam-diam melonggarkan.
- Output ke path folder misi yang saya tentukan lewat API, plus sha256 artefak, supaya register dan jejak verifikasi saya tetap jalan.
- Rebuild selektif per seksi; PDF dan hitungan halaman ikut diperbarui.
- Idempoten: konten sama = byte sama.

Keberatan yang membuat saya enggan memakai:
- Dua sumber kebenaran gaya. Kalau templat HQ menyimpang sekecil apa pun dari `datum-house-style` kanonis, saya harus tetap build lokal. Templat HQ wajib jadi cermin registry fleet, bukan salinan lepas.
- Kotak hitam: tanpa laporan gerbang per aturan, hasil HQ tidak bisa saya klaim selesai ke user.
- Artefak mendarat di luar folder misi atau nama file berubah tiap build = indeks IL dan register hash saya rusak.
- Antrian/latensi yang membuat gelombang worker menunggu, lebih lambat dari build lokal.

Intinya: pipeline ini menghemat waktu saya kalau ia mengambil alih perakitan bentuk dan gerbang, sementara saya tetap memegang konten, kontrak desain, dan bukti verifikasi.
