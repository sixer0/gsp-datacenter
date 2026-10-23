# S76 — Paritas DOCX (kelas DX) Python acuan vs Node

Baris: S76 (fase final G4), agen `test-expert`, skill `tdd`. Tanggal run: 2026-10-23 01:49-01:58 (lokal).
Area eksklusif: laporan ini + `tests/parity/out/s76/**`. Kode produksi, harness, fixture, dan skill DATUM tidak diubah.

## Ringkasan

- **4 fixture dokumen dijalankan (seluruh korpus `kind: doc` di `tests/parity/fixtures/manifest.json`), format DOCX, kelas DX.**
- **Vonis harness: FAIL 4/4** terhadap ambang DX research/06 §6.2 (`research/06_chart_map_parity_matrix.md:260`). Exit runner 1.
- Hasil deterministik: run kedua memberi vonis, metrik, dan selisih identik; DOCX Node sha256 identik antar run.
- Kontrol pembanding lulus: Node-vs-Node dan acuan-vs-acuan PASS 8/8, jadi pembanding mampu membedakan dan tidak selalu gagal.
- Atribusi (diagnostik, rule-based; vonis resmi tetap FAIL): **semua unit teks yang tidak identik dipetakan ke sisi acuan** (adapter S64 yang mendekati atau tidak mendukung blok, konvensi DatumDocx Garis A yang berbeda dari benchmark BM.docx) **atau ke pembanding S66**. Tidak ada selisih yang hanya dapat dijelaskan oleh cacat mesin Node. Ada dua ambiguitas semantik kontrak (penanda daftar, label chip rel).
- Inti masalah: dengan acuan Garis A melalui adapter S64, gerbang DX (teks 100 %, hitungan identik, run props >= 98 %, fon tertanam identik) **tidak dapat dicapai oleh port Node mana pun yang setia pada benchmark D-17**. Penyebabnya, Garis A sendiri berbeda dari BM.docx pada caption, geometri seksi, letak SUMBER, gaya run, dan penanaman fon. Ini perlu keputusan controller (lihat Rekomendasi). F-011 dan F-012 sudah memperkirakan hal ini, tetapi pengecualiannya belum diimplementasikan di harness.

## 1. Strategi uji

| Butir | Isi |
|---|---|
| Cakupan | 4 fixture `tests/parity/fixtures/doc/*.json` (sha256 cocok manifest: memo `95a83353…`, tables `bffcb247…`, serah `d13b5546…`, terbit `bda03399…`). Format `docx`, kelas `DX` |
| Dikecualikan | PDF (kelas PD = baris S77; tanpa soffice di S76, 0 instans dipakai). HTML (HT = DIAGNOSIS tanpa acuan Python). Chart/diagram/simbol (S78/S79) |
| Runner | H05 `scripts/parity/run/run_parity.ts` (S67) → acuan H02 `scripts/parity/reference/doc/ref_doc.py` (S64) → pembanding H04 `scripts/parity/compare/compare.py` + `compare_docx.py` (S66) |
| Python acuan | `C:\Users\TRIAL\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe`, di-spawn dengan `-I -B` (`scripts/parity/run/lib/python.ts:72`) |
| Skill DATUM | read-only, tanpa tambalan in-process pada adapter dokumen (grep `monkey\|setattr(\|patch` di `doc_adapter.py` = 0 hasil). `find <HS> <RL> -newermt "-60 minutes"` = kosong, jadi tidak ada berkas skill yang tertulis selama run |
| Templat Node | `file:datum-kanonik` versi `file:093cb1dd821939f3` (render_report.json `template`); fixture tidak punya `*.template.json` |
| Ambang | `scripts/parity/compare/thresholds.py:98-106` = research/06 baris DX persis: `textOrderIdenticalPct 100`, `countsIdentical`, `sectPrIdentical`, `runPropsMatchPctMin 98`, `embeddedFontsIdentical` |
| README | `scripts/parity/**` dan `tests/parity/fixtures` **tidak memiliki README** (Glob `README*` = 0). Antarmuka diambil dari `masterplan/01_specs.md:1019-1023` (H01-H05) dan catatan S64/S66/S67 |
| Catatan §7 | `01_specs.md` §7 = konstanta/env/penyimpanan (C01-C17). Yang relevan bagi S76 hanya bahwa tidak ada DB dan tidak ada soffice. Kriteria paritas ada di `02_structured.md:449` (kriteria 7, S76-S79) |

## 2. Berkas uji dan keluaran

| Path | Isi |
|---|---|
| `tests/parity/out/s76/summary.{json,md}`, `harness_log.jsonl`, `run_stdout.txt` | run utama |
| `tests/parity/out/s76/doc_doc_<fixture>/{ref,node,cmp}/` + `fixture_report.{json,md}` | per fixture: `ref/ref.docx`, `ref/ref_report.json`, DOCX Node + `render_report.json`, `cmp/docx.json` (CompareReport) |
| `tests/parity/out/s76/run2/**`, `run2_stdout.txt` | run ulang untuk determinisme |
| `tests/parity/out/s76/controls/*.json` | 8 kontrol: Node-vs-Node, acuan-vs-acuan |
| `tests/parity/out/s76/diag/<fixture>.txt`, `diag/<fixture>_classes.json` | diagnostik: opcode teks lengkap, ketidakcocokan run props per paragraf, atribusi kelas |

Skrip diagnostik (sekali pakai, di luar repo, hanya mengimpor `compare_docx.analyse`/`run_props_match` secara read-only): `diag_text.py`, `s76_classify.py`, `s76_tblprops.py`, `s76_heading.py`, `dump_tables.py` di scratchpad sesi.

## 3. Perintah dan keluaran (dikutip)

Run utama (`tests/parity/out/s76/run_stdout.txt`):

```
$ npx tsx scripts/parity/run/run_parity.ts --fixtures tests/parity/fixtures --out tests/parity/out/s76 --only "doc/**" --formats docx
run_parity: 4 fixture (dari 107; 1 berkas dilewati) -> C:\Users\TRIAL\gsp-swarm-hq-v2.1\tests\parity\out\s76
  [1/4] FAIL          doc/doc_nota_memo docx=FAIL
  [2/4] FAIL          doc/doc_nota_tables docx=FAIL
  [3/4] FAIL          doc/doc_serah_handover docx=FAIL
  [4/4] FAIL          doc/doc_terbit_report docx=FAIL
run_parity: {"FAIL":4} exit=1 summary=C:\Users\TRIAL\gsp-swarm-hq-v2.1\tests\parity\out\s76\summary.md
real	0m14.315s
exit=1
```

Run ulang (`--out tests/parity/out/s76/run2`): keluaran identik (`{"FAIL":4} exit=1`). Perbandingan `cmp/docx.json` run1 vs run2: `verdict`, `textUnits`, `runProps`, sha kanonik acuan, dan `diffs` semuanya `True` untuk 4/4 fixture. sha256 DOCX Node sama di kedua run:

```
7eff336b1362fdd8…  memo    (= D-112 tercatat 7eff336b…)
e9d0881873cfdfd6…  tables  (= D-112 e9d08818…)
579f7aca51bcc62d…  serah   (D-112 mencatat c02c9e90…)
3d74ae3e913d89f0…  terbit  (D-112 mencatat 719b7425…)
```

Byte ZIP acuan berbeda antar run karena cap waktu (D-13), tetapi XML kanoniknya identik.

Kontrol (`compare.py --format docx --class DX`, 8 panggilan): `nota_memo|nota_tables|serah_handover|terbit_report node-vs-node exit=0 verdict PASS | ref-vs-ref exit=0 verdict PASS`.

## 4. Inventaris kasus dan vonis per fixture (ambang research/06 DX)

Status acuan (`ref/ref_report.json`): memo `partial` (supported 7 / approximated 18 / unsupported 5); tables `ok` (7/27/0); serah `partial` (8/24/16); terbit `partial` (11/22/6). Blok `supported` hanya judul bab/seksi, `start_interior`, dan 2 paragraf body.

| Fixture | textOrder (>= 100 %) | paragraf ref/node | tabel | gambar | sel/tabel | sectPr ref/node | runProps (>= 98 %) | fon tertanam ref/node | Vonis |
|---|---|---|---|---|---|---|---|---|---|
| doc-nota-memo | **60,66 %** (37 identik; 51/61 unit) | 57/65 F | 2/7 F | 1/3 F | F | 3/2 F | **42,19 %** (27/64) | 0/11 F | **FAIL** |
| doc-nota-tables | **81,36 %** (227; 274/279) | 315/286 F | 23/23 **P** | 0/2 F | F | 3/2 F | **11,76 %** (40/340) | 0/10 F | **FAIL** |
| doc-serah-handover | **49,12 %** (112; 152/228) | 177/247 F | 10/20 F | 4/8 F | F | 4/7 F | **13,90 %** (26/187) | 0/11 F | **FAIL** |
| doc-terbit-report | **34,50 %** (59; 83/171) | 99/201 F | 6/20 F | 5/12 F | F | 5/9 F | **8,77 %** (10/114) | 0/11 F | **FAIL** |

Cek diagnosis (bukan gerbang) juga FAIL di 4/4: `canonicalXml.{document,styles,numbering}`, `styles` (memo: acuan 164 gaya vs Node 8), `headerFooterText`.

## 5. Pemetaan kegagalan ke berkas:baris dan baris pemilik

### 5.1 Atribusi unit teks (gerbang textOrder): `diag/<fixture>_classes.json`

Hitungan unit (sisi ref / sisi node) di opcode non-equal. Klasifikasi rule-based lalu ditinjau manual per opcode di `diag/<fixture>.txt`. Ketepatan kelas B adalah **hipotesis** yang ditopang status `ref_report.json`.

| Kelas | memo | tables | serah | terbit | Sebab, berkas:baris | Pemilik |
|---|---|---|---|---|---|---|
| A1 caption tabel: acuan `TABEL n <SLUG KEPALA>. memuat n kepala kolom…`, Node `Tabel c.n <caption JSON>` (= BM.docx `Tabel 1.1   …`) | 1/1 | 22/22 | 9/9 | 5/5 | Garis A `datum_docx.py:646,652,657`; adapter mencatat `doc_adapter.py:635`; F-011 | S64 / skill read-only; pengecualian = S66 |
| A2 penomoran gambar: acuan `GAMBAR n` global, Node `Gambar c.n` (BM: 29× `Gambar n.m`) | 1/1 | 0 | 4/4 | 5/5 | Garis A `datum_docx.py:743` | skill read-only; pengecualian = S66 |
| A3 provenans SUMBER: acuan selalu `PROVENANS ◇ PEMASOK`, Node mengikuti fixture (`provenance: ["TERUKUR"]` → `■ TERUKUR`; tanpa provenans → tidak ada) | 1/1 | 22/22 | 10/10 | 5/5 | Garis A `datum_docx.py:722` (hard-coded); adapter tidak meneruskan provenans figur (`doc_adapter.py:713`) | S64 / skill read-only |
| A4 baris `KUNCI` figur hanya di Node | 0/1 | 0 | 0/1 | 0/1 | `figure()` Garis A tanpa key (`datum_docx.py:727`); adapter `doc_adapter.py:713,775,807` | S64 |
| A5 penanda daftar/turunan: acuan `•`/`n.`, Node `–`/`n` | 6/6 | 0 | 2/2 | 2/2 | adapter memilih sendiri `doc_adapter.py:555-556`; Node `engine/docx/blocks/text.ts:144-147` (param `render.list.bulletMarker`, default `–`) | ambiguitas kontrak (S01/S03); S64 |
| A6 chip rel `kind: mark` + `label`: acuan `■ TERUKUR 28,6 C`, Node `■ 28,6 C` | 1/1 | 0 | 4/4 | 2/2 | adapter `doc_adapter.py:530-532` (glyph + mark + label); Node `engine/docx/blocks/rail.ts:52` (label menggantikan kata tanda). Kontrak `01_specs.md:307` tidak menetapkan; benchmark tidak memakai `label` (24 tanda tanpa label) | ambiguitas kontrak (S01/S03), lalu S16 atau S64 |
| C1 teks kapital: acuan menulis huruf besar literal, Node memakai `w:caps` (contoh `Log sensor suhu, Oktober 2026` dengan caps=True) | 0 | 0 | 4/4 | 2/2 | pembanding tidak melipat `w:caps` sebelum membandingkan teks: `compare_docx.py:182-194, 245, 271` | S66 (temuan harness) |
| B struktur tanpa padanan acuan atau yang didekati: sampul selalu ada (K2), badan sampul eksplisit, lembar kendali, TOC, pembatas bagian, tanda tangan, aside, device (Datum Rule, spine), tabel bersarang, identitas sampul, label `Lampiran A`/`BAB 1`, impact asumsi, tanda baris turunan | 4/13 | 3/8 | 7/82 | 3/90 | `doc_adapter.py:428` (sampul), `:437` (sampul eksplisit), `:461` (front tanpa padanan), `:515-516` (aside/device), `:598-612` (gridSpan/vMerge/nested dibuang), `:580-581` (asumsi), `:677` (tanda turunan); F-012 | S64; F-012 meminta penandaan `no-reference` |
| Sisa yang hanya dapat dijelaskan oleh Node | 0 | 0 | 0 | 0 | - | - |

### 5.2 Gerbang struktur

| Gerbang | Sebab, berkas:baris | Pemilik |
|---|---|---|
| `count.paragraphs/tables/images` | kelas B di atas. Gambar tambahan Node = `Datum Rule` bab 128 mm (`word/media/fig-b61b40…png`, 1 per bab; dibangkitkan D-101 IP-03) + figur tanpa padanan acuan. Tabel tambahan Node = lembar kendali, tanda tangan, identitas sampul, tabel bersarang | S64 (acuan tidak lengkap) |
| `cellsPerTable` | (a) adapter memecah `gridSpan` menjadi sel kosong dan membuang `nested` (`doc_adapter.py:600-606`): tables T1 acuan 24 vs Node 20. (b) Node menaruh `SUMBER` sebagai baris terakhir tabel (span), +1 sel per tabel, sesuai BM.docx (91/153 tabel ber-baris SUMBER terakhir, 0 paragraf SUMBER sesudah tabel); Garis A menulis SUMBER sebagai paragraf sesudah tabel (`datum_docx.py:716-722`). (c) Pemasangan sel per indeks (`compare_docx.py:352-355`): satu tabel sampul acuan menggeser semua pasangan | S64 / skill; (c) S66 |
| `sectPr` | (a) jumlah: sampul acuan (K2) dan seksi depan/bagian Node. (b) geometri interior Garis A `setup_interior` `datum_docx.py:453-454` (bawah 2,60 cm, header 1,00, footer 0,90 → 1474/567/510 twip) ≠ BM.docx (29/29 seksi: atas 1474, kanan 1134, bawah 1361, kiri 1361, header 737, footer 737) = Node. (c) `chapter.setup` fixture diabaikan adapter (`doc_adapter.py:469-470`); Node menerapkannya (tables bab 1: 1134/1134/1134/1418). (d) Pemasangan per indeks (`compare_docx.py:357-358`) | skill read-only / S64; (d) S66 |
| `runProps` | Gaya peran DatumDocx Garis A ≠ BM.docx, dan Node mengikuti BM. Kepala tabel BM `Sans Cond, b, 6B7783, caps` (91×), Node `Sans Condensed 14, b, 6B7783, caps` (22×), acuan `Sans Condensed 14, b, 101418, tanpa caps`. Sel badan kolom 2: BM Serif 16 2B3640 (79×), Node Serif 16 (11×), acuan Sans Condensed 16. Nomor seksi: BM Mono 6B7783 (98×), Node Mono 6B7783, acuan satu run Sans Cond. Ketidakcocokan per jenis (diag): tables `color+caps` 75, `font` 56, `font+color` 35, paragraf tak berpasangan 109 | skill read-only (pembanding mengukur jarak Garis A↔BM) |
| `embeddedFonts` | acuan 0 fon tertanam (Garis A hanya menanam lewat Word COM `embed_fonts.py embed`, `embed_fonts.py:13-15`, dan adapter tidak memanggilnya: grep `embed` di `reference/doc/*.py` = 0). Node 10-11 slot (R-04 `embedTrueTypeFonts=true`; D-74/D-109). Gerbang `compare_docx.py:366-368` tidak dapat dipenuhi | S64 (langkah embed absen) / definisi ambang research/06 (S02) |

### 5.3 Temuan harness (tanpa perubahan harness)

| ID usulan | Tingkat | Temuan | Berkas:baris | Pemilik |
|---|---|---|---|---|
| S76-H1 | MAYOR (validitas gerbang) | Gerbang DX membandingkan Node dengan DatumDocx Garis A, yang pada caption, geometri seksi, letak SUMBER, gaya run, dan fon tertanam berbeda dari BM.docx (sumber kebenaran D-17). Port yang lulus benchmark (D-101/D-109) pasti gagal DX, jadi gerbang tidak mengukur kebenaran port | `thresholds.py:98-106`; `research/06:260` | S02/S66 + keputusan controller |
| S76-H2 | MAYOR | Pengecualian "artefak acuan" (F-011) dan penandaan `no-reference` (F-012) tidak diimplementasikan: `compare_docx.compare` tidak menerima daftar pointer unsupported/approximated dari `ref_report.json`, dan `run_parity.ts:315-334` tidak meneruskannya | `compare_docx.py:334-368`; `run_parity.ts:328-333` | S66, S67 |
| S76-H3 | MINOR | Teks dibandingkan tanpa melipat `w:caps` → selisih ganda (teks + runProps) untuk teks yang dirender identik | `compare_docx.py:182-194, 271` | S66 |
| S76-H4 | MINOR | `cellsPerTable` dan `sectPr` dipasangkan per indeks (`zip`); satu sisipan (tabel/seksi sampul) menggeser semua pasangan sesudahnya | `compare_docx.py:352-355, 357-358` | S66 |
| S76-H5 | MINOR | Gerbang `embeddedFonts` mustahil dipenuhi: adapter acuan tidak punya langkah penanaman | `reference/doc/ref_doc.py` (tanpa embed); `compare_docx.py:366` | S64 / S02 |
| S76-H6 | INFO | `scripts/parity/**` dan `tests/parity/fixtures` tanpa README, padahal brief S76 menyebutnya | - | S67/S63 |

### 5.4 Pengamatan sampingan (di luar gerbang DX, untuk S83/S98)

- **O1 (hipotesis)**: nomor seksi Node pada templat kanonik ber-run `Mono 22 half-point, tebal, 6B7783`, sedangkan BM.docx `Mono 16, tidak tebal` (profil benchmark `benchmark/manual000/template.json:1399-1405` menetapkan 16/false). Dugaan: `numberRun` kanonik mewarisi ukuran dan tebal judul (`engine/docx/blocks/structure.ts:137`; turunan token `engine/tokens/roles.ts:155-157`). Tidak memengaruhi benchmark, yang memakai profilnya sendiri. Pemilik: S11 (tokens) / S16.
- **O2 (hipotesis)**: sha256 DOCX Node serah/terbit berbeda dari nilai D-112 (`c02c9e90…`, `719b7425…`), sedangkan memo/tables sama. Kedua fixture itu memuat diagram dan lembar simbol, jadi dugaan sebabnya perubahan figur sesudah INT-W (mis. S30 D-106 atau IP-02 D-113). Tidak diverifikasi, karena berkas D-112 tidak tersedia di area S76.
- **O3**: memo (tier NOTA) memuat Datum Rule bab (gambar 128 mm) yang tidak ada di acuan. Kesesuaian tier perlu dicek lint/benchmark, bukan DX.

## 6. Analisis cakupan dan celah

- Korpus dokumen: 4/4 fixture (`counts.doc = 4`, manifest). Format DOCX: 4/4.
- Celah 1: acuan Python hanya `supported` untuk judul, `start_interior`, dan 2 paragraf. Sisanya approximated/unsupported, sehingga paritas DX atas tabel, figur, rel, sampul, dan pembungkus tidak punya acuan Python yang setia. Remediasi: lihat Rekomendasi 1-2.
- Celah 2: tidak ada fixture DX yang membandingkan Node dengan benchmark pada tingkat run props. BM1-BM4 (S98) hanya mengukur teks, hitungan, dan SSIM.
- Celah 3: atribusi kelas di §5.1 rule-based. Kelas B diterima berdasarkan status `ref_report.json`, bukan pembuktian per blok bahwa keluaran Node benar.

## 7. Cara menjalankan

```
cd C:\Users\TRIAL\gsp-swarm-hq-v2.1
npx tsx scripts/parity/run/run_parity.ts --fixtures tests/parity/fixtures --out tests/parity/out/s76 --only "doc/**" --formats docx
# kontrol pembanding (contoh satu fixture)
C:\Users\TRIAL\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe -I -B scripts/parity/compare/compare.py --format docx --class DX --ref <a.docx> --node <b.docx> --out <cmp.json>
```

## 8. Catatan CI

- Durasi 12-15 detik untuk 4 fixture tanpa soffice. Tidak ada DB. Python dipanggil `-I -B`.
- Tidak ada uji flaky: vonis, metrik, selisih, dan sha256 DOCX Node identik di 2 run. Byte ZIP acuan berubah per run (cap waktu, D-13), XML kanonik tetap.
- `tests/parity/out/` di-gitignore (`.gitignore:70`).

## 9. Keterbatasan

- Atribusi sebab adalah analisis penguji. Bukan perubahan vonis: vonis resmi = keluaran harness (FAIL 4/4).
- Rujukan BM.docx dibaca read-only (`C:\Users\TRIAL\workspace\Manual DATUM GSP\Manual_Komprehensif_DATUM_GSP_000-GSP-STD-X-2026_RevA.docx`) hanya untuk menentukan sisi mana yang menyimpang. Bukan gerbang S76.
- Ambiguitas A5/A6 tidak diputuskan di sini.

## 10. Rekomendasi (keputusan controller; loop maks 3 siklus)

1. **Putuskan ulang peran gerbang DX** (S76-H1). Pilihan: (a) DX terhadap Garis A diturunkan menjadi DIAGNOSIS, dan kebenaran struktur DOCX dibuktikan lewat benchmark S98 plus lint; atau (b) gerbang DX dipertahankan hanya untuk blok `supported` setelah pengecualian F-011/F-012 diimplementasikan (S76-H2: S66 menerima daftar pointer dari `ref_report.json`, S67 meneruskannya); atau (c) acuan DX diganti dengan potongan BM.docx. Catat sebagai keputusan D-nn.
2. Bila (b): perbaiki S76-H3 (lipat caps) dan S76-H4 (pemasangan berbasis alignment), lalu tetapkan ambang `embeddedFonts` sebagai diagnosis (S76-H5). Sesudah itu jalankan ulang S76 dengan perintah §7 yang sama.
3. Tetapkan semantik kontrak untuk `RailLine.label` pada `kind: mark` (A6) dan penanda daftar default (A5) di §3 kontrak (S01/S03), lalu selaraskan adapter S64 atau Node S16.
4. Teruskan O1 ke S83 (review) dan S98 (benchmark), dan O2 ke controller untuk mencatat garis dasar sha256 fixture yang baru.

## Status akhir

```
status: needs-review
S76 DX: 4/4 fixture dijalankan, FAIL 4/4 (ambang research/06:260; exit runner 1).
textOrder 60,66 / 81,36 / 49,12 / 34,50 %; runProps 42,19 / 11,76 / 13,90 / 8,77 %; fon tertanam acuan 0.
Deterministik (2 run identik); kontrol Node-vs-Node dan ref-vs-ref PASS 8/8.
Semua selisih dipetakan ke acuan S64/Garis A atau pembanding S66; 0 sisa khas Node.
Temuan harness: S76-H1 (gerbang DX vs Garis A tidak valid terhadap D-17), S76-H2 (F-011/F-012 belum ada).
Minor: S76-H3 caps, S76-H4 pemasangan per indeks, S76-H5 fon tertanam acuan, S76-H6 README.
Ambiguitas kontrak: A5 penanda daftar, A6 label chip rel. Sampingan: O1 nomor seksi kanonik, O2 sha serah/terbit.
Keluaran: tests/parity/out/s76/ (run, run2, controls, diag).
Butuh keputusan controller atas peran gerbang DX sebelum run ulang.
```
