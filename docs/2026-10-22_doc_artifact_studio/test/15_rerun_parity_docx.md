# SR-46 — Jalankan ulang S76: paritas DOCX (kelas DX, diagnosis D-120) atas fixture v1 dan v2

Baris: SR-46 (fase akhir, gelombang B2 D-293), agen `test-expert`, skill `tdd`. Run: 2026-10-23 12:55-12:58 (lokal).
Area: laporan ini + `tests/parity/out/sr46/**` (klaim `delegation_progress/file_claims.md`, baris SR-46). Kode produksi, harness, pembanding, fixture, dan skill DATUM tidak diubah.

## Ringkasan

- **8 fixture dijalankan**: seluruh `tests/parity/fixtures/doc/**` (4 v1 `kind: doc` + 4 v2 `kind: docV2`), format DOCX, kelas DX. Runner exit 0, `{"DIAGNOSIS":8}`.
- **Vonis per fixture: DIAGNOSIS 8/8**, sesuai D-120 opsi (a). Ambang DX tetap dihitung tetapi `gate: false` (`scripts/parity/compare/thresholds.py:107-119`). Tidak ada ERROR, crash, atau NOT_READY. Render Node 8/8 SUCCEEDED.
- **Deterministik**: dua run memberi vonis, metrik, dan `diffs` yang identik. Satu-satunya selisih adalah path masukan `run1` vs `run2`. sha256 DOCX Node identik byte 8/8, dan XML kanonik acuan identik 8/8. Byte ZIP acuan berbeda karena cap waktu (D-13). Klasifikasi diagnostik run1 = run2 (`cmp` identik).
- **Kontrol pembanding**: Node-vs-Node dan acuan-vs-acuan = 0 cek gagal di 16/16.
- **Jangkar**: DOCX v1 `doc_nota_tables` = `a4e6ff6298e44be3…`, sama dengan jangkar D-279 (`a4e6ff62`, fixture `03a943e9…` + templat pendamping). Semua sha fixture cocok dengan `manifest.json`.
- **Atribusi**: setiap unit teks beracuan yang tidak identik dipetakan ke sisi acuan (adapter S64/Garis A ≠ BM.docx) atau ke batas pembanding. **0 sisa yang hanya dapat dijelaskan oleh cacat mesin DOCX Node** (§5).
- **Temuan baru (minor, tanpa gerbang)**: P-1 regex artefak acuan tidak mengenali caption lampiran `TABEL/GAMBAR A.n` dan baris SUMBER Node → pembanding SR-40. P-2 label vonis `DIAGNOSIS` tidak membedakan nol cek gagal dari banyak cek gagal → SR-40/SR-41. F-1 jalur v1 SERAH kehilangan logo dan perangkat sampul (lint D06/D16 FAIL hanya di v1) → D-256 vs D-197, keputusan controller (§5.3).

## 1. Strategi uji

| Butir | Isi |
|---|---|
| Cakupan | 8 fixture: `doc/doc_{nota_memo,nota_tables,serah_handover,terbit_report}.json` (v1) dan `doc/v2/…` (v2). Templat pendamping `doc/<stem>.template.json` untuk tables/serah/terbit, dipakai juga oleh v2. memo = `file:datum-kanonik` (`render_report.json` medan `template`) |
| Kelas | DX (`compare_docx.py`, D-120: lawan Garis A = DIAGNOSIS; `embeddedFontsGate: false` R02/F-056) |
| Acuan | `ref_doc.py` (Garis A, studio.doc/v1). v2 memakai pasangan v1 (`run_parity.ts:94-108`; catatan fixture "acuan Python dari pasangan v1 …(SR-41)") |
| Dikecualikan | PDF (SR-50), HTML (HT tanpa acuan), chart/diagram/simbol (SR-47/SR-48), dan lint sebagai gerbang (lint dilaporkan sebagai pengamatan §5.3) |
| Python | VENV hermes `-I -B`. Skill DATUM baca-saja |
| Pembanding (sesudah SR-40) | S76-H2 sudah ada (`textOrderReferenced`, pengecualian F-011/F-012, `compare_docx.py:364-421`), S76-H3 caps dilipat (`runProps.caps = "dilipat ke teks (S76-H3)"`), S76-H4 pemasangan LCS (`cellsPerTable.pairing = "LCS tanda tangan teks tabel"`, `sectPrAlignment`), S76-H5 fon = diagnosis. S76-H6 (README `scripts/parity/**`) **masih terbuka** (`ls scripts/parity/README*` = tidak ada; D-120 → FIX-3) |
| Kondisi pohon kerja | belum di-commit (`git status`: `benchmark/`, `docs/2026-10-22_doc_artifact_studio/` untracked). FIX-Z (kontrak tipe) masih tercatat sedang berjalan di file_claims. Hasil berlaku untuk pohon kerja pukul 12:55 |

## 2. Berkas keluaran

| Path (`tests/parity/out/sr46/`) | Isi |
|---|---|
| `run1/`, `run2/` (+ `run{1,2}_stdout.txt`) | `summary.{json,md}`, `harness_log.jsonl`, per fixture `doc_{doc,v2_doc}_<stem>/{ref,node,cmp}/` + `fixture_report.{json,md}` |
| `extract.txt` | metrik per fixture, determinisme run1/run2, perbandingan v1/v2 |
| `controls/` | 16 kontrol (`*_node_vs_node.json`, `*_ref_vs_ref.json`, `controls_stdout.txt`) |
| `diag/` | `doc_*_classes.txt` (opcode lengkap + kelas per unit), `classes_run{1,2}.json`, `doc_doc_*_textOrderReferenced.txt` (20 opcode pertama dari harness), `diag_v1_v2_node.txt` (diff teks DOCX Node v1 vs v2), skrip `sr46_{extract,classify,v1v2}.py` (read-only, mengimpor `compare_docx.analyse/unit_class/no_reference_leaves`) |

## 3. Perintah dan keluaran (dikutip)

```
$ npx tsx scripts/parity/run/run_parity.ts --fixtures tests/parity/fixtures --out tests/parity/out/sr46/run1 --only "doc/**" --formats docx
run_parity: 8 fixture (dari 110; 3 berkas dilewati) -> ...\tests\parity\out\sr46\run1
  [1/8] DIAGNOSIS     doc/doc_nota_memo docx=DIAGNOSIS
  [2/8] DIAGNOSIS     doc/doc_nota_tables docx=DIAGNOSIS
  [3/8] DIAGNOSIS     doc/doc_serah_handover docx=DIAGNOSIS
  [4/8] DIAGNOSIS     doc/doc_terbit_report docx=DIAGNOSIS
  [5/8] DIAGNOSIS     doc/v2/doc_nota_memo docx=DIAGNOSIS
  [6/8] DIAGNOSIS     doc/v2/doc_nota_tables docx=DIAGNOSIS
  [7/8] DIAGNOSIS     doc/v2/doc_serah_handover docx=DIAGNOSIS
  [8/8] DIAGNOSIS     doc/v2/doc_terbit_report docx=DIAGNOSIS
run_parity: {"DIAGNOSIS":8} exit=0 summary=...\sr46\run1\summary.md
real 0m47.027s   exit=0
```

Run 2 (`--out …/run2`): keluaran sama baris demi baris, `{"DIAGNOSIS":8} exit=0`, real 0m48.524s. Berkas dilewati (sama di kedua run): `diagram/garis_a/good_{layered,sld}.json` (F-S78-2) dan `manifest.json`.

Peringatan log (kedua run, hanya v2 serah/terbit): `FILE_MISSING_ON_DISK assets/96b93f9c….png|.jpg` dan compose `ASSET_INFO_MISSING "Metadata aset denah-ruang (96b93f9cf35a) tidak diberikan; MIME dianggap image/png"`. Dampaknya nihil: media `96b93f9cf35a` tertanam di DOCX v1 dan v2 (cek isi `word/media`). Lihat P-3.

Determinisme (`extract.txt`, diff rekursif `cmp/docx.json`):

```
doc_doc_nota_memo        verdict True diffs True nodeDocx True a48e5e3ea8b50a09 refCanon True
doc_doc_nota_tables      verdict True diffs True nodeDocx True a4e6ff6298e44be3 refCanon True
doc_doc_serah_handover   verdict True diffs True nodeDocx True 28b6837da586fec7 refCanon True
doc_doc_terbit_report    verdict True diffs True nodeDocx True b61f875f217901d9 refCanon True
doc_v2_doc_nota_memo     verdict True diffs True nodeDocx True e181dcf83a58187e refCanon True
doc_v2_doc_nota_tables   verdict True diffs True nodeDocx True 683b64a0c6ed6a5d refCanon True
doc_v2_doc_serah_handover verdict True diffs True nodeDocx True a655cebfd13d71e2 refCanon True
doc_v2_doc_terbit_report verdict True diffs True nodeDocx True 7634411bbc284e6f refCanon True
selisih metrics run1/run2 = hanya /metrics/inputs/{context,node,ref} (path run1 vs run2)
```

Kontrol (`controls_stdout.txt`): `compare.py --format docx --class DX`, 8 × node(run1)-vs-node(run2) dan 8 × ref(run1)-vs-ref(run2), semuanya `exit=0 DIAGNOSIS 0 fail`.

## 4. Inventaris dan vonis per fixture

Metrik dihitung terhadap ambang DX (100 / identik / identik / 98 % / identik), tetapi tidak satu pun menggerbang (D-120).

| Fixture | Acuan | textOrder | textOrderReferenced | paragraf ref/node | tabel | gambar | seksi | sel (pasangan LCS: beda/tak berpasangan) | runProps | fon ref/node | Lint Node | Vonis |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| v1 nota_memo | partial (5 unsupported) | 50,82 % | 58,49 % | 55/65 | 2/7 | 1/3 | 3/2 | 0 pasangan; 2/7 | 41,67 % (25/60) | 0/13 | PASS | **DIAGNOSIS** |
| v1 nota_tables | ok | 56,63 % | 61,24 % | 315/290 | 23/23 | 0/2 | 3/2 | 23 pasangan, 19 beda | 11,76 % (40/340) | 0/12 | PASS | **DIAGNOSIS** |
| v1 serah_handover | partial (11) | 38,53 % | 45,73 % | 175/243 | 10/19 | 4/8 | 4/7 | 0; 10/19 | 16,22 % (30/185) | 0/13 | FAIL | **DIAGNOSIS** |
| v1 terbit_report | partial (5) | 28,07 % | 36,51 % | 98/202 | 6/20 | 5/13 | 5/9 | 1 pasangan; 5/19 | 10,62 % (12/113) | 0/13 | FAIL | **DIAGNOSIS** |
| v2 nota_memo | (pasangan v1) | 50,82 % | 58,49 % | 55/67 | 2/7 | 1/3 | 3/3 | 0; 2/7 | 41,67 % | 0/13 | PASS | **DIAGNOSIS** |
| v2 nota_tables | (pasangan v1) | 56,63 % | 61,24 % | 315/292 | 23/23 | 0/2 | 3/3 | 23, 19 beda | 11,76 % | 0/12 | PASS | **DIAGNOSIS** |
| v2 serah_handover | (pasangan v1) | 37,33 % | 44,38 % | 175/255 | 10/22 | 4/10 | 4/8 | 0; 10/22 | 16,22 % | 0/13 | FAIL | **DIAGNOSIS** |
| v2 terbit_report | (pasangan v1) | 27,91 % | 36,51 % | 98/205 | 6/21 | 5/13 | 5/10 | 1; 5/20 | 10,62 % | 0/13 | FAIL | **DIAGNOSIS** |

Cek diagnosis yang gagal di 8/8: textOrder, textOrderReferenced, count.paragraphs, count.images, cellsPerTable, sectPr, runProps, embeddedFonts, canonicalXml.{document,styles,numbering}, styles (acuan 164 gaya vs Node 8), headerFooterText. count.tables gagal di 6/8 (tables 23/23 sama).

Pembanding S76 (laporan `test/02_parity_docx.md` §4): textOrder dulu 60,66 / 81,36 / 49,12 / 34,50 %, kini 50,82 / 56,63 / 38,53 / 28,07 %. Penurunan **bukan regresi Node**. Penyebab utamanya pelipatan `w:caps` (S76-H3, SR-40): kepala tabel Node ber-caps (sama dengan BM.docx, 91×) kini terbaca sebagai teks kapital, sedangkan Garis A menulis huruf campuran tanpa caps, sehingga muncul kelas A7, contohnya 69 unit di tables. runProps praktis tetap (41,67/11,76/16,22/10,62 vs 42,19/11,76/13,90/8,77).

## 5. Diagnosis dan pemetaan ke baris pemilik

### 5.1 Atribusi unit teks beracuan (`diag/classes_run1.json`, ditinjau manual di `diag/doc_*_classes.txt`)

Hitungan unit pada opcode non-equal sesudah pengecualian F-011/F-012 pembanding (format sisi ref / sisi node). Unit `?` dari aturan otomatis ditinjau manual lalu dimasukkan ke kelasnya. Jumlah kelas per fixture sama dengan total unit non-equal: memo 15/22, tables 72/100, serah 39/89 (v2 39/94), terbit 18/80.

| Kelas | memo | tables | serah v1 (v2) | terbit v1 (v2) | Sebab | Pemilik |
|---|---|---|---|---|---|---|
| A7 caps kepala tabel: acuan huruf campuran tanpa `w:caps`, Node caps (= BM) | 4/4 | 69/67 | 30/30 | 14/12 | gaya peran Garis A ≠ BM (S76 §5.2 runProps) | skill read-only / adapter S64 |
| A3 SUMBER: Node menulis baris SUMBER di tabel (= BM), acuan menulis paragraf ber-`PROVENANS ◇ PEMASOK` yang dikecualikan | 0/1 | 0/23 | 1/10 | 0/6 | `datum_docx.py:716-722`. Pengecualian asimetris, lihat P-1 | S64 / pembanding SR-40 |
| A4 KUNCI figur hanya di Node | 0/1 | 0 | 0/1 | 0/1 | `figure()` Garis A tanpa key | S64 |
| A5 penanda daftar `•`/`n.` vs `–`/`n` | 6/6 | 0 | 2/2 | 2/2 | ambiguitas kontrak A5 (S76) | S01/S03 kontrak; S64 |
| A6 glyph tanda register/rel (Node `… kW ■`, acuan tanpa glyph) | 0 | 0 | 5/5 | 0 | adapter `doc_adapter.py:530-532` | S64 / ambiguitas A6 |
| P-1 caption lampiran `TABEL/GAMBAR A.n` Node tidak dikecualikan | 0 | 0/1 | 0/2 | 0/2 | regex `^(TABEL\|GAMBAR)\s+\d+` (`compare_docx.py:364`) tidak menerima huruf lampiran | pembanding SR-40 |
| B struktur tanpa padanan atau didekati: sampul K2 acuan (memo/tables NOTA tanpa sampul di Node), label BAB/BAGIAN/LAMPIRAN, aside (CATATAN/DOKTRIN/KISAH LAPANGAN/CEK CEPAT/BILA RAGU), asumsi terpecah, tabel bersarang, lembar kendali, TOC, tanda tangan, identitas sampul, string punggung, judul sampul terpecah | 5/10 | 3/9 | 1/39 (1/44) | 2/57 (2/57) | `doc_adapter.py:428,437,461,515-516,580-581,598-612`. Label apparatus yang dibangun templat (REV/TANGGAL/DISERAHKAN…) bukan daun spec, jadi tidak tertangkap `noReference` | S64 (F-012); batas pembanding SR-40 |
| **Sisa yang hanya dapat dijelaskan oleh Node** | 0 | 0 | 0 | 0 | - | - |

Kelas v2 = v1 untuk memo dan tables. Untuk serah dan terbit, v2 hanya menambah unit kelas B (pita klasifikasi sampul, string punggung, label lembar kendali A-D). Lihat 5.2.

### 5.2 v1 vs v2 (DOCX Node, `diag/diag_v1_v2_node.txt`)

Isi konten sama (D-256/D-270), tetapi DOCX berbeda: `styles.xml` dan `numbering.xml` identik, `document.xml` berbeda di 4/4.
- Keempat fixture v2 punya satu seksi kosong di akhir. Asalnya slot `ruleIndex` (render_report: "ruleIndex (F:ruleIndex) dirender sebagai penanda saja; indeks aturan otomatis belum dibangun di DOCX"). Ini **sudah diterima D-197 (sampai RQ-7)**, jadi bukan temuan baru.
- serah/terbit v2: compose sadar slot menambah sampul templat (pita KLASIFIKASI, logo, string punggung `BA · Serah terima · ID · REV A · X · 2026`), sub-label lembar kendali A-D, dan TOC berbentuk paragraf tanpa entri `Bagian I/II` (v1: TOC tabel dengan entri Bagian). Jalur v1 tidak berubah menurut D-197. Perbedaan entri Bagian di TOC v2 adalah **hipotesis untuk ditinjau** pemilik compose/perakit DOCX (SR-16/SR-17). DX tidak dapat menilainya karena acuan tidak mendukung TOC.

### 5.3 Temuan

| ID | Tingkat | Temuan | Bukti | Pemilik |
|---|---|---|---|---|
| SR46-P1 | MINOR (pembanding) | Pengecualian artefak acuan F-011 asimetris. SUMBER acuan (`PROVENANS ◇ PEMASOK`) dikecualikan, tetapi baris SUMBER Node tidak (tables 23 unit sisip). Caption lampiran Node `TABEL A.1`/`GAMBAR A.1` lolos dari regex `\d+`. Akibatnya `textOrderReferenced` turun palsu (tables 61,24 %) | `compare_docx.py:364,416-418`; `diag/doc_doc_nota_tables_classes.txt` | SR-40 (pembanding) |
| SR46-P2 | MINOR (pelaporan) | Dengan `gate: false`, verdict selalu `DIAGNOSIS`, termasuk pada kontrol yang 0 cek gagal. Ringkasan runner tidak membedakan "bersih" dari "14 cek gagal" | `controls_stdout.txt` (0 fail → DIAGNOSIS); `compare_docx.py:503` | SR-40 / SR-41 (`run_parity`/`summary`) |
| SR46-P3 | INFO | Fixture v2 serah/terbit memuat aset `denah-ruang` (dataBase64 + mime), tetapi compose memperingatkan `ASSET_INFO_MISSING`, dan storage mencari `assets/<sha>.{png,jpg}` di disk (`FILE_MISSING_ON_DISK`) sebelum fallback berhasil | `run1_stdout.txt`; `render_report.json` `compose.warnings` | SR-41 (fixture v2) / compose |
| SR46-F1 | MINOR (SC-6, butuh keputusan) | Lint SERAH **v1** FAIL 5 vs v2 FAIL 3: v1 tidak punya logo (D06 "tepat sekali, di sampul") dan perangkat wajib tier SERAH `datumRule`/`sealBand`/`spineString` (D16). Ini konsekuensi gabungan D-256 (`logo_ilustrasi` dihapus karena sampul dibangun templat) dan D-197 (jalur v1 tak berubah, tanpa slot templat). Di luar gerbang DX | `run1/doc_doc_serah_handover/node/render_report.json` `lint.checks` | controller (D-256 vs D-197) / SR-41 |
| (rujukan) | - | D01 angka tak tertelusur register (serah, 16) dan D20 skala Admiralty (serah/terbit) muncul di v1 dan v2. Ini lint isi fixture, bukan DX | `render_report.json` lint | SR-41 (fixture), bila belum tercatat |

Temuan lama S76: H1 ditutup D-120. H2/H3/H4/H5 terimplementasi (§1). H6 masih terbuka (FIX-3). A5/A6 masih ambiguitas kontrak. O1/O2 tidak diulang di sini.

## 6. Cakupan dan celah

- Korpus dokumen 8/8 (v1 4 + v2 4), format DOCX 8/8.
- Celah 1: acuan Garis A hanya `supported` untuk sebagian kecil blok, sehingga DX tidak menilai sampul, front, TOC, slot v2, maupun perangkat tier. Kebenaran struktur bertumpu pada S98/D-293 (BM1-BM4 LULUS) dan unit S72.
- Celah 2: v2 tidak punya acuan Python sendiri (memakai pasangan v1), jadi selisih khas compose v2 hanya terlihat lewat diff v1/v2 (§5.2), bukan lewat vonis.
- Celah 3: atribusi §5.1 berbasis aturan lalu ditinjau manual. Kelas B adalah hipotesis yang ditopang `ref_report.json` (status unsupported/approximated).

## 7. Cara menjalankan

```
cd C:\Users\TRIAL\gsp-swarm-hq-v2.1
npx tsx scripts/parity/run/run_parity.ts --fixtures tests/parity/fixtures --out tests/parity/out/sr46/run1 --only "doc/**" --formats docx
npx tsx scripts/parity/run/run_parity.ts --fixtures tests/parity/fixtures --out tests/parity/out/sr46/run2 --only "doc/**" --formats docx
<VENV>\python.exe -I -B tests/parity/out/sr46/diag/sr46_extract.py          # metrik + determinisme + v1/v2
<VENV>\python.exe -I -B tests/parity/out/sr46/diag/sr46_classify.py run1    # atribusi kelas
```

## 8. Catatan CI

- Sekitar 47-49 s untuk 8 fixture. Tanpa DB. Python `-I -B`. Satu peluncuran soffice (render-env ready, manifest `ec233534…`).
- Tidak ada uji flaky: 2 run identik (vonis, metrik, diffs, sha DOCX Node). Byte ZIP acuan berubah per run (D-13), XML kanonik tetap.
- `tests/parity/out/` di-gitignore.

## 9. Keterbatasan

- Vonis resmi = keluaran harness (DIAGNOSIS 8/8). Atribusi adalah analisis penguji.
- sha DOCX v1 serah/terbit berbeda dari catatan D-265 (`7f5f9c87…` untuk terbit). Dugaan sebabnya perubahan figur sesudah FIX-B2/FIX-A2 (D-293 "3 graph berubah"). Ini hipotesis, tidak diverifikasi di baris ini.

## 10. Rekomendasi (loop maks 3 siklus)

1. SR-40: buat F-011 simetris. Kecualikan baris `SUMBER …` Node dan caption `(TABEL|GAMBAR)\s+([A-Z]|\d+)\.\d+`, beserta kasus selftest (P1).
2. SR-40/SR-41: tampilkan jumlah cek gagal (atau `DIAGNOSIS-CLEAN`) di ringkasan untuk kelas non-gerbang (P2).
3. Controller: putuskan apakah render v1 SERAH wajib lulus lint D06/D16 (SC-6) setelah D-256, atau catat sebagai konsekuensi yang diterima (F1).
4. SR-16/SR-17: konfirmasi bahwa TOC v2 tanpa entri `Bagian` memang disengaja (§5.2).

## Status akhir

```
status: complete
SR-46: 8/8 fixture DOCX (v1 4 + v2 4) dijalankan, DIAGNOSIS 8/8 (D-120), exit 0; 2 run identik (sha DOCX Node 8/8, metrik/diffs 8/8); kontrol 16/16 0 gagal.
0 sisa khas Node; selisih = Garis A/adapter S64 (A3-A7, B) + batas pembanding (P1 → SR-40).
Temuan: P1/P2 → SR-40/SR-41, P3 → SR-41, F1 lint v1 SERAH D06/D16 → keputusan controller.
```
