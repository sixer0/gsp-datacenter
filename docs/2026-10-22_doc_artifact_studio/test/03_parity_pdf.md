# S77 / SR-50: paritas PDF dengan mesin yang sama (soffice di kedua sisi)

Baris: SR-50 (blueprint `identification/05_structural_sections_blueprint.md:791`), test-expert, skill tdd. Kriteria: §7.3 `identification/02_structured.md:451-456` baris PDF (D-15). Tanggal: 2026-10-23. Kode produksi dan harness tidak diubah. Biner ada di `tests/parity/out/sr50/**` (di-gitignore, `.gitignore:70`).

## Ringkasan

- **Vonis §7.3: FAIL 9/9** (8 fixture `doc/**` v1+v2 + Manual 000 v2). Jumlah halaman sama hanya pada 2/9. Teks identik per halaman 0% pada 9/9. SSIM rata-rata 0,547-0,813, padahal ambangnya ≥ 0,98.
- **Penyebabnya bukan tahap PDF.** Kontrol "mesin sama" lulus 18/18 (9 × dua arah). DOCX yang sama, dikonversi lewat jalur acuan (`soffice_pdf.py`) dan lewat layanan Node (`engine/soffice`), menghasilkan teks 100%, SSIM 1,0, dan **tanda isi identik**. Seluruh selisih berasal dari DOCX acuan Garis A yang tidak memuat struktur dokumen Node: lembar kendali, daftar isi, pembatas bagian, nomor gambar per bab, dan kepala berjalan. Manual 000 lewat acuan: 267 blok `approximated`, 18 `unsupported`, 28 `rejected`. Ini kelas yang sama dengan D-120 (DX lawan Garis A = DIAGNOSIS).
- **Kestabilan (dua run): PASS.** Tanda isi PDF stabil 18/18 (9 acuan + 9 Node). sha mentah PDF tidak stabil 18/18, sesuai D-258. sha DOCX Node stabil 9/9. Metrik pembanding run1 = run2 pada 9/9.
- **Temuan baru N-SR50-1 (MEDIUM, produk).** Jalur v2 dengan kerangka implisit menambah satu **halaman akhir kosong** (hanya kepala/kaki berjalan) pada 4/4 fixture v2, padahal pasangan v1-nya tidak. Manual 000 (kerangka eksplisit) tidak terkena.
- Baterai `datum_figur.py` (F1-F5): exit 0, 0 cacat pada 18/18 PDF. Fon Plex tertanam di semua PDF Node. DejaVuSans juga tertanam untuk glif geometri (■ △ ◈ ☐ ≤ ≥), sudah dikenal (D-43).

## 1. Strategi uji

| Butir | Isi |
|---|---|
| Lingkup | 8 fixture `tests/parity/fixtures/doc/**` (4 v1, 4 v2; acuan v2 = pasangan v1, SR-41) dan Manual 000 v2 (`benchmark/manual000/doc.v2.json` + `template.v2.json`; acuan Python = pasangan v1 `doc.json`) |
| Sisi acuan | `ref_doc.py --pdf` (H02): DOCX Garis A lalu `soffice_pdf.convert` (profil sementara) |
| Sisi Node | `run_parity.ts` / `render_cli.ts` (H01/H05): DOCX mesin lalu `engine/soffice` (`PDF_CONVERTED`) |
| Mesin sama | `SOFFICE_PATH=C:\Program Files\LibreOffice\program\soffice.com` untuk kedua sisi (ref_report `pdf.exe`; Node `renderEnv.sofficeVersion 24.2.3.2`, ready) |
| Pembanding | `compare.py --format pdf --class PD` (jumlah halaman, teks per halaman, SSIM CAL 72 dpi, fon tertanam) |
| Ambang | Vonis memakai §7.3: halaman sama, teks identik ≥ 98%, SSIM rata-rata ≥ 0,98. Ambang harness `thresholds.py:121-131` lebih ketat (100%, 0,99, min 0,97); vonis tetap sama |
| Tanda isi | Port 1:1 `pdfNormalizedSha256` (`tests/integration/studio/_helpers.ts:105-135`, D-258) di `tools/sr50_tools.py`. Port divalidasi terhadap helper TS asli (`tools/sig_ts.ts`): 2/2 sama (`14a529ce…`, `5dac904f…`) |
| Kontrol tambahan | (A) DOCX Node lewat jalur acuan, dibandingkan dengan PDF Node; (B) DOCX acuan lewat layanan Node, dibandingkan dengan PDF acuan; (C) PDF Node v1 dibandingkan dengan PDF Node v2 |
| Dikecualikan | Kelas HT (tanpa acuan PDF). sha PDF mentah tidak dibandingkan (D-258). BM.docx bukan acuan S77; BM4 milik SR-51 |
| soffice | Satu instans sekaligus dari baris ini (plafon 2 bersama SR-52) |

## 2. Berkas uji dan keluaran

| Path | Isi |
|---|---|
| `tests/parity/out/sr50/run1/**`, `run2/**` | Per fixture `ref/ref.{docx,pdf}`, `node/*.{docx,pdf}`, `cmp/pdf.json`, `cmp/docx.json`, `summary.{json,md}`; `run{1,2}_stdout.txt` |
| `tests/parity/out/sr50/run{1,2}/m000_v2/**` | Manual 000 v2 (ref, node, cmp) |
| `tests/parity/out/sr50/control_same_engine/<fixture>/` | `cmp{A,B}.json`, `conv{A,B}.json`, dua PDF kontrol |
| `tests/parity/out/sr50/control_v1_v2/*.json` | PD Node v1 dibandingkan dengan Node v2 |
| `tests/parity/out/sr50/figur/*.json` | Baterai `datum_figur.py --json` |
| `tests/parity/out/sr50/sr50_summary.json` | Agregat tanda isi, sha, metrik, dan kontrol |
| `tests/parity/out/sr50/tools/` | `sr50_tools.py` (sig/pages/convert), `sig_ts.ts`, `node_convert.ts`, `run_m000.sh`, `run_controls.sh`, `aggregate.py` (test-only) |

## 3. Inventaris kasus dan vonis (run1; run2 identik, `cmpEqual` 9/9)

| Fixture | Halaman acuan/Node | Teks identik | SSIM rata-rata / min | Gerbang gagal | Kontrol A / B | Vonis §7.3 |
|---|---|---|---|---|---|---|
| doc/doc_nota_memo | 3 / 2 | 0% | 0,7334 / 0,7191 | pageCount, textPerPage, ssim | PASS / PASS | FAIL |
| doc/doc_nota_tables | 5 / 5 | 0% | 0,6934 / 0,5619 | textPerPage, ssim | PASS / PASS | FAIL |
| doc/doc_serah_handover | 7 / 12 | 0% | 0,7765 / 0,6409 | pageCount, textPerPage, ssim | PASS / PASS | FAIL |
| doc/doc_terbit_report | 9 / 13 | 0% | 0,8101 / 0,7152 | pageCount, textPerPage, ssim | PASS / PASS | FAIL |
| doc/v2/doc_nota_memo | 3 / 3 | 0% | 0,8011 / 0,7191 | textPerPage, ssim | PASS / PASS | FAIL |
| doc/v2/doc_nota_tables | 5 / 6 | 0% | 0,6934 / 0,5619 | pageCount, textPerPage, ssim | PASS / PASS | FAIL |
| doc/v2/doc_serah_handover | 7 / 13 | 0% | 0,7678 / 0,6207 | pageCount, textPerPage, ssim | PASS / PASS | FAIL |
| doc/v2/doc_terbit_report | 9 / 14 | 0% | 0,8129 / 0,7296 | pageCount, textPerPage, ssim | PASS / PASS | FAIL |
| Manual 000 v2 | 62 / 102 | 0% | 0,5467 / 0,4372 | pageCount, textPerPage, ssim | PASS / PASS | FAIL |

Kontrol A/B pada 9/9: `textIdenticalPct 100.0`, `ssimMean 1.0`, dan tanda isi PDF kontrol = tanda isi PDF asli (`sigEqual true`, `sr50_summary.json`). Manual 000 Node menghasilkan 102 halaman, sama dengan BM2 102/102 pada D-293. Gerbang `embeddedFonts` hanya diagnosis (F-056).

Contoh atribusi teks (doc/v2/doc_terbit_report, `sr50_tools.py pages`): halaman 1-4 Node berisi sampul, LEMBAR KENDALI, DAFTAR ISI, dan BAGIAN I; acuan langsung masuk ke isi. Takarir Node `GAMBAR 1.3`, acuan `GAMBAR 3`. Kepala Node `… · BAB 1 · DATA SUHU`, kepala acuan `… · Data suhu`.

### Kestabilan (dua run, tanda isi)

| Ukuran | Hasil |
|---|---|
| Tanda isi PDF acuan run1 = run2 | 9/9 (mis. memo `14a529cee76c` ×2, M000 `464f3ebe5661` ×2) |
| Tanda isi PDF Node run1 = run2 | 9/9 (mis. terbit v1 `5dac904fc6ac` ×2, M000 `45653ce757d7` ×2) |
| sha mentah PDF (acuan dan Node) | tidak stabil 18/18 (mis. M000 Node `86c1663d77ed` lawan `c8ba67bc1895`), sesuai D-258 |
| sha DOCX Node | stabil 9/9 (mis. M000 `c64c9a4586cc` ×2) |
| sha DOCX acuan | tidak stabil 9/9 (artefak acuan; tanda isi PDF-nya tetap stabil) |

## 4. Pemetaan kegagalan ke pemilik

| ID | Keparahan | Gejala dan bukti | Pemilik |
|---|---|---|---|
| PD-1 | Vonis (bukan cacat mesin) | PD FAIL 9/9 karena DOCX acuan Garis A tidak memuat struktur yang dirender mesin. Kontrol A/B 18/18 identik membuktikan tahap soffice sama. Acuan M000: `ref_report.json` `status partial`, `approximated 267, unsupported 18, rejected 28` | Controller: putuskan apakah PD lawan Garis A diturunkan menjadi DIAGNOSIS, analog D-120 (DX). Bila ya, harness S66 (`scripts/parity/compare/thresholds.py:121-131` `_PDF` belum punya `gate`), lalu kebenaran PDF dibuktikan lewat SR-51 BM4 |
| N-SR50-1 (baru) | MEDIUM | Halaman akhir kosong pada 4/4 fixture v2 (`control_v1_v2/*.json`: `pageCount`; v2 nota_memo hlm 3, nota_tables hlm 6, serah hlm 13, terbit hlm 14; masing-masing hanya kepala/kaki, 114-148 karakter). DOCX v2 memuat seksi tambahan: paragraf kosong dengan `w:sectPr`, lalu paragraf kosong dan `sectPr` akhir ber-header `rId13/rId14`. v1 hanya punya 2 `sectPr`. Laporan compose: `skeleton implicit`, slot `content, appendices, references, ruleIndex` | Hipotesis: slot opsional kosong (references/ruleIndex) pada kerangka implisit tetap menghasilkan seksi. Pemilik SR-16 (perakit DOCX sadar slot, `engine/docx/assemble/**`) atau SR-08 (compose kerangka). Perlu diagnosis pemilik |
| O-1 | Pengamatan | Muka depan v2 berbeda dari v1 (serah hlm 1: 380 lawan 546 karakter; v2 nota_memo 3 halaman lawan v1 2). Konten sama menurut SR-41 | Diagnosis bersama N-SR50-1 (SR-08/SR-16); bukan gerbang S77 |
| O-2 | Pengamatan | Halaman nyaris kosong di sekitar lembar simbol tinggi muncul di kedua sisi (acuan terbit hlm 6; Node terbit v2 hlm 9, lalu SUMBER sendirian di hlm 10). Gejala tata letak soffice untuk figur tinggi | Tidak dipetakan sebagai cacat. Rujuk ke SR-46/SR-47 bila dianggap perlu |

## 5. Analisis cakupan dan celah

Kriteria §7.3 PDF tercakup: jumlah halaman, teks per halaman, SSIM per halaman, fon Plex tertanam, dan baterai F1-F5. Celah: (1) acuan Garis A tidak bisa membuktikan paritas struktur (PD-1). Kebenaran PDF Manual 000 bergantung pada SR-51 (BM4 SSIM terhadap BM.pdf). (2) `datum_figur.py` hanya mendeteksi 1 figur di PDF Node M000 (102 halaman), sehingga cakupan F1-F5 untuk figur raster dalam DOCX lemah; ini keterbatasan alat acuan. (3) Kelas HT tidak diuji.

## 6. Cara menjalankan

```
export SOFFICE_PATH="C:\Program Files\LibreOffice\program\soffice.com"
npx tsx scripts/parity/run/run_parity.ts --fixtures tests/parity/fixtures --out tests/parity/out/sr50/run1 --only "doc/**" --formats docx,pdf
npx tsx scripts/parity/run/run_parity.ts --fixtures tests/parity/fixtures --out tests/parity/out/sr50/run2 --only "doc/**" --formats docx,pdf
bash tests/parity/out/sr50/tools/run_m000.sh run1 ; bash tests/parity/out/sr50/tools/run_m000.sh run2
bash tests/parity/out/sr50/tools/run_controls.sh
VENV -I -B tests/parity/out/sr50/tools/aggregate.py
```

Keluaran yang dikutip: `run_parity: {"FAIL":8} exit=1` pada kedua run (`real 2m46s` / `2m21s`). M000: `ref exit=0`, `node exit=0`, `"verdict": "FAIL", "failedGates": ["pageCount", "textPerPage", "ssimMean", "ssimMin"]`, `compare exit=1` ×2. Kontrol: `convA=0 convB=0 cmpA=0 cmpB=0` ×9 (`real 2m35s`). Baterai: `ref=0 node=0` ×9.

## 7. Catatan CI

- Durasi sekitar 8 menit total (2 run fixture + 2 run M000 + kontrol). soffice dipakai serial. Tidak ada DB.
- Tidak flaky pada metrik pembanding (run1 = run2). Jangan memakai sha PDF mentah sebagai jangkar (D-258); pakai tanda isi.
- `FILE_MISSING_ON_DISK` (aset `96b93f9c…png/jpg`) muncul sebagai peringatan pada v2 serah/terbit, tetapi render tetap SUCCEEDED (log run1). Ini hanya diagnosis.

## 8. Keterbatasan dan rekomendasi

1. Controller memutuskan PD-1 (analog D-120). Vonis S77 menurut §7.3 tetap FAIL sampai ada keputusan.
2. N-SR50-1 dikirim ke loop perbaikan (SR-16/SR-08). Sesudah perbaikan, uji ulang `control_v1_v2` harus memberi `pageCount` sama, dan kontrol A/B ulang harus tetap 18/18.
3. Usul jangkar regresi PDF: tanda isi per sisi (stabil 18/18), bukan sha mentah.
