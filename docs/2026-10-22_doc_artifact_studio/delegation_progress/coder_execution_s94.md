# S94 Spec figur benchmark Manual 000 (coder-execution)

Status: complete. Skill: dry-run-verify-fix (1 siklus, 0 perbaikan validator; 1 penyetelan ambang titik sebelum validasi).

Berkas (semua di `benchmark/manual000/figures/`): `index.json`; `assets/` 27 PNG media docx (byte-identik); `specs/` 20 spec (5 chart komposit galeri, 6 diagram Garis A, 9 image); `blocks/` 52 blok figur studio.doc/v1; `tools/build_figures.py`, `tools/gallery.py`, `tools/diagrams.py`, `tools/px.py` (pembangun, VENV), `tools/validate_figures.ts` (penjaga, tsx).

Klasifikasi 52 penempatan (id `bm-fig-NN` = urutan = docPr id, selaras D-44 dan `doc.json x.figures`):
- device 28: logo 1 (cover.logo), datumRule 166 mm 6 (wrapper.datumRule), datumRule 128 mm 21 (chapter.datumRule).
- chart 5: Gambar 8.1-8.5 komposit galeri 3 kolom, 58 panel (15+9+12+10+12); data ditranskripsi dari PNG (F-005), asal per panel `params.transcription` = label 16 / pixel 37 / sintetis 5.
- diagram 6: 2.1 layered, 3.1 graph, 9.1 topology, 9.2 swimlane, 9.3 rack, 10.12 sld (9.x/10.12 = rekonstruksi ilustrasi Panduan Simbol, raster sumber di `fallbackAsset`).
- symbolSheet 4: 10.1 iec, 10.3 isa, 10.4 sec, 10.5 mil (cols 6).
- raster 9: 4.1 (render halaman spesimen), 10.2, 10.6-10.11, 10.13 (lembar simbol/ilustrasi eksternal, denah).
- 18 halaman figur besar ditandai `bigPage` (9, 12, 19, 35, 37, 38, 40, 42, 50, 51, 54-61); halaman dari bbox citra BM.pdf.

Bukti penjaga:
- `python -I -B .../build_figures.py --docx BM.docx --pdf BM.pdf` -> `{"chart": 5, "device": 28, "diagram": 6, "raster": 9, "symbolSheet": 4, "total": 52}`; bigPages 18.
- `npx tsx .../validate_figures.ts --docx BM.docx` -> penempatan 52 tanpa sisa; spec lolos 20/20; blok lolos 52/52; sha256 aset = indeks = media docx = doc.json x.figures 52/52; media 27/27; LOLOS.
- Uji negatif ajv: nilai string di panel P-01 ditolak (`/composite/panels/0/spec/data/points/0/value`); dialect salah ditolak.
- tsc (grep area) kosong; eslint area exit 0; py_compile 4 berkas ok; `--help` exit 0.

Keputusan (perlu dicatat controller):
1. 9.1, 9.2, 9.3, 10.12 diklasifikasi diagram (D-14 literal) walau sumbernya ilustrasi raster Panduan Simbol; ikon/BPMN/simbol IEC didekati bentuk Garis A. Bisa dibalik ke raster lewat `fallbackAsset`.
2. 10.2, 10.6-10.11, 10.13 raster: lembar simbol/ikon/garis dan denah tanpa keluarga Garis A.
3. Nama seri/kategori yang tidak tercetak diberi nama generik dan ditandai ASUMSI; distribusi tanpa angka kasus memakai sampel deterministik yang meniru ringkasan terlihat.
4. Semua 27 media disalin (bukan hanya raster) agar setiap id punya byte untuk resolusi aset S48 (D-49) dan pembanding SSIM.

Permintaan: 2 baris di `file_requests.md` (aksen per titik/grup di ChartData; renderer/lint menerima kunci params galeri non-registri). Tidak memblokir.
Temuan: label tile map G-01 tercetak ganda (KALT x3, SULT x2, MALU x2) di gambar manual; K-11 Sankey cabang tercetak 96 dari RAB 100; dot terhitung H-01 38, S-06/S-07 dari pemecahan gumpalan (taksiran).
