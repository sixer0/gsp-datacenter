---
task_slug: doc_artifact_studio
row: DL-1 (celah M-3 SR-58, D-305)
date: 2026-10-23
agent: test-expert
skill: tdd
status: complete
source_plan: verification/01_verification.md §8 M-3, §9 butir 3; identification/02_structured.md §7.2 butir 7, §7.3 DOCX
---

# DL-1: `datum_lint.py` (VERDICT) dan `datumcheck.py` A2-A5 atas DOCX mesin Node

## 1. Ringkasan

| Dokumen | sha256 DOCX (16) | `datum_lint.py` HS | Cek gagal HS | `datumcheck` A2-A5 | Lint Studio (status rilis) |
|---|---|---|---|---|---|
| TERBIT v1 (Node) | `b61f875f217901d9` | **FAIL** (28 cek file: 23 PASS, 4 FAIL) | DATUM-05, 09, 10, 14 | **PASS** (A2-A5 PASS) | FAIL: C-27, D20 (2 FAIL) |
| TERBIT v2 (Node) | `7157312da22db248` | **FAIL** (sama persis dengan v1) | DATUM-05, 09, 10, 14 | **PASS** | FAIL: C-27, D20 |
| SERAH v1 (Node) | `e6c38f7480f2d734` | **FAIL** (23 PASS, 4 FAIL) | DATUM-05, 09, 10, 14 | **PASS** | FAIL: C-27, D20, D01 x16 (18 FAIL) |
| SERAH v2 (Node) | `3245655e88a5953e` | **FAIL** (beda v1 hanya indeks tabel) | DATUM-05, 09, 10, 14 | **PASS** | FAIL: C-27, D20, D01 x16 |
| Manual 000 v2 resmi `official3` (Node) | `952f65d63c77f615` | **FAIL** (20 PASS, 7 FAIL) | DATUM-03, 05, 07, 10, 14, 17, 22 | **FAIL**: A3 (4 em dash), A5 | FAIL 19 / 8 cek (C-SG-L2-04 x9, DATUM-32 x3, G3 x2, C-27, C-34, D18, D20, DATUM-03) |
| BM.docx acuan (pembanding) | `6f6f11d34c03301a` | **FAIL** (19 PASS, 8 FAIL) | sama dengan Manual 000 + DATUM-38 (garis bawah nama berkas) | **FAIL**: A3 (4), A4, A5 | tidak dijalankan (bukan keluaran mesin) |
| Pembanding tambahan: ref Python Garis A TERBIT v1 | `ad1e317b42c09d49` | PASS (27 PASS, 0 FAIL) | - | PASS | - |
| Pembanding tambahan: ref Python Garis A SERAH v1 | `1e99e211eb96b119` | FAIL (26 PASS, 1 FAIL) | DATUM-09 (tabel 2, 7, 9: isi sampel, D-269) | PASS | - |

Vonis kriteria:
- **§7.2-7 ("`datum_lint.py` VERDICT PASS untuk fixture TERBIT/SERAH"): TIDAK TERPENUHI, FAIL 4/4.** Tidak satu pun kegagalan berasal dari prosa fixture. Keempatnya berasal dari aparatus pembungkus/templat (lembar kendali, glif tanda provenans) dan dari batas ukur HS. Rinciannya di §3.
- **§7.3 DOCX `datumcheck.py` A2-A5: PASS 4/4** untuk TERBIT/SERAH. Manual 000 v2 FAIL A3 dan A5, dua-duanya terjelaskan (§4).
- **Manual 000 v2: 0 cacat khas mesin menurut HS.** Keluaran `datum_lint.py` Manual 000 byte-identik dengan keluaran BM.docx untuk semua 38 baris cek, kecuali DATUM-38. DATUM-38 PASS pada Node karena nama berkas Node memakai spasi (`diff` §6).
- **Konsistensi dengan lint Studio: TIDAK konsisten pada 4 cek** (DATUM-05, 09, 10, 14). Studio memberi PASS/NOT_RUN di empat cek itu karena cakupannya lebih sempit dari HS (§5).

## 2. Lingkup, masukan, metode

- Render terbaru lewat CLI Node (tanpa DB), templat = sidecar fixture (sama dengan harness paritas `scripts/parity/run/lib/fixtures.ts:98-104`):
  `npx tsx scripts/parity/run/render_cli.ts --doc tests/parity/fixtures/doc/[v2/]doc_<s>.json --template tests/parity/fixtures/doc/doc_<s>.template.json --out <O>/render/<v>_<s> --formats docx`
  Keluaran 4/4: `render_cli: status=SUCCEEDED ... exit=0 lint=FAIL`. sha keempat DOCX sama dengan kolom "sesudah" FIX-SERAH (`delegation_progress/coder_execution_fixserah.md`, tabel bukti: `e6c38f7480f2`, `b61f875f2179`, `3245655e88a5`, `7157312da22d`). Artinya render terkini = keluaran FIX-SERAH.
- Manual 000 v2: `benchmark/out/fixb2/official3/Manual Komprehensif DATUM GSP 000-GSP-STD-X-2026 RevA.docx`, sha `952f65d6…` (= D-305). BM.docx = `C:\Users\TRIAL\workspace\Manual DATUM GSP\Manual_Komprehensif_DATUM_GSP_000-GSP-STD-X-2026_RevA.docx`.
- Setiap DOCX disalin ke folder terpisah `<O>/in/<doc>/` (nama berkas asli dipertahankan karena DATUM-38 menilai nama berkas). Tidak ada PDF pendamping di folder itu, sehingga `datumcheck` A6/A7 SKIP dan hanya A2-A5 (+A1 SKIP) yang dinilai.
- Skill HS baca-saja, dijalankan dari lokasi skill dengan Python VENV hermes 3.11.15 `-I -B`:
  - `cd <HS>/scripts && python -I -B datum_lint.py <docx>`
  - `datumcheck.py` memerlukan `from datumbind import tokens_path` (`datumcheck.py:48`), sedangkan `-I` membuang folder skrip dari `sys.path`. Karena itu skrip dijalankan dengan `python -I -B -c "sys.path.insert(0,HS); runpy.run_path(HS/datumcheck.py, run_name='__main__')" <docx>`. Skrip tidak disalin dan tidak diubah. sha256 `datum_lint.py`, `datumcheck.py`, `datumbind.py` sebelum = sesudah (`SKILL_UNCHANGED`).
- Keluaran: `C:/Users/TRIAL/AppData/Local/Temp/dl1/` (`render/**`, `in/**`, `lint/<doc>.datum_lint.txt`, `lint/<doc>.datumcheck.txt`, `tools/probe.py`, `tools/tables.py`, `tools/studiolint.py`). `tests/datumlint/out/` tidak dipakai karena tidak di-ignore git (`git check-ignore` rc=1).
- Pengecualian: lint 37 HTML (L-4) berada di luar brief DL-1 dan tidak dijalankan. Cek tahap build/eye HS = NOT-RUN 11 sesuai banner skrip.

## 3. TERBIT/SERAH: kegagalan HS, alasan, pemetaan pemilik

| Cek HS | Bukti (keluaran) | Akar (diverifikasi) | Kelas | Pemilik |
|---|---|---|---|---|
| DATUM-05 | `DATUM-05 FAIL [file] limit=0 \| DejaVu Sans` (4/4) | Run glif tanda provenans (`■ TERUKUR`, `△ ASUMSI`) memakai `w:rFonts ascii="DejaVu Sans"`: TERBIT 2 run, SERAH 10 run (`tools/probe.py`). HS `c05` (`datum_lint.py:253-271`) menolak wajah di luar token dan fallback. Token HS: glif tetap mono, "jangan tukar font" (`tokens.json:108`). Mesin: `symbolGlyph: "DejaVu Sans"` (`src/lib/studio/engine/docx/package/xml.ts:185`, `tables/style.ts:256`). BM.docx memakai pola yang sama (104 run DejaVu, ikut FAIL). Ref Python tidak memakai DejaVu (PASS) | Konflik acuan: BM (kalibrasi mesin) lawan token HS. Bukan regresi | S14/RQ-2 (glif simbol, D-150/D-152) + putusan controller/user (ikut BM atau ikut token HS). Cakupan Studio `a05` hanya fon bawaan Office (`lint/structure/checks-a.ts:166`) → S46 |
| DATUM-10 | TERBIT: `tabel1, 5, 6, 7, 8 tanpa SUMBER`; SERAH v1: `tabel1, 4, 5, 6`; SERAH v2: `tabel1, 5, 6, 7` | Semua tabel yang ditandai adalah tabel aparatus pembungkus: blok identitas sampul (Nomor/Revisi), lembar kendali A Riwayat revisi, B Rantai verifikasi, D Distribusi, pengesahan (`tools/tables.py`). Tabel konten bercaption (Tabel 2.1, 3.1, dst.) tidak ditandai. HS `c10` (`datum_lint.py:311-324`) hanya melewati tabel tanpa sel angka. Tabel aparatus fixture berisi tanggal ISO `2026-10-20` dan angka telanjang (Rev, salinan `1`), yang lolos `is_pure_number` | Aparatus templat + isi medan kendali fixture. BM ikut FAIL pada kelas yang sama (tabel6 = D Distribusi terkendali), jadi desainnya sama dengan acuan | Pembungkus DOCX lembar kendali (`engine/docx/wrapper/pages.ts`, parameter S06; baris FIX-2 sedang menyentuh teks lembar kendali) + isi fixture SR-41 (tanggal ISO dan angka pada medan kendali). Celah cakupan Studio: `a10` hanya tabel bercaption (`checks-a.ts:304-312`) → S46. Aturan tidak dilonggarkan, perlu putusan controller |
| DATUM-09 | TERBIT/SERAH v2: `tabel7 angka tanpa satuan`; SERAH v1: `tabel6` | Tabel itu = lembar kendali D "Distribusi terkendali" (`No / Penerima / Bentuk / Salinan`), 50 % sel badan angka (No + Salinan) dan tanpa satuan. Memenuhi definisi HS `numeric_data_tables` (`datum_lint.py:149-160`) | Aparatus + isi fixture (BM: 3/12 sel angka → PASS) | Sama dengan DATUM-10 (pembungkus lembar kendali / isi fixture SR-41); Studio `DATUM-09` hanya tabel konten → S46 |
| DATUM-14 | TERBIT: `halaman 1: 6 nilai warna [101418, 14110F, 2B3640, 6B7783, 6E1420, B45309]`; SERAH: 7 (+`2F6F6B`) | HS memotong halaman menurut `lastRenderedPageBreak` (`datum_lint.py:111`). Jumlahnya 0 di SEMUA DOCX yang diuji (Node, Python, BM), sehingga "halaman 1" = seluruh dokumen. Node menambah `14110F` (`color.wrapper.ink`, `params/color-type.ts:61`, kalibrasi BM) dan `2F6F6B` (`verd`) di atas palet ref Python (4-5 warna) | Batas ukur HS (tanpa jejak paginasi) + palet pembungkus kalibrasi BM. BM ikut FAIL (7 warna) | Bukan cacat per halaman yang terbukti. Bukti per halaman butuh lint render S45 (Studio `DATUM-14` = `NOT_RUN "tidak ada HTML terukur"` pada render DOCX saja). Putusan controller |

Catatan pembanding: ref Python Garis A TERBIT PASS karena dokumen Python tidak memuat sampul bertabel, lembar kendali, maupun glif DejaVu. Ref Python tidak setara struktur dengan keluaran Node (D-139/D-197), sehingga tidak bisa dipakai sebagai bukti bahwa Node "seharusnya" PASS.

## 4. Manual 000 v2: selisih isi yang dikenal (D-263/D-269) lawan cacat mesin

| Temuan | Alat | Klasifikasi | Bukti |
|---|---|---|---|
| DATUM-03 FAIL `0.1268 em-dash/1000`; A3 FAIL `('word/document.xml', 4)` | HS lint, datumcheck | **Dikenal, D-269.** 4 em dash = kepala berjalan `// 20261008 ID T — TERBITAN 1` + baris format cap terbit + 2 kutipan judul chart di Tabel 17.1 R-13. Studio menghitung 2 (aparatus dikecualikan D-263/D-269); HS menghitung 4. Jumlahnya sama di BM | pemindai paragraf `\u2014` (§2 `tools`), Studio `DATUM-03 ... 2 dalam 26634 kata ... di 17.1.3` |
| DATUM-05, 07 (5x garis vertikal sel), 10 (tabel6 Distribusi), 14 (7 warna), 17 (± tanpa arti), 22 (klaim eksternal tanpa tingkat Admiralty, "Topologi") | HS lint | **Selisih isi/desain acuan, bukan mesin.** Rincian setiap baris identik dengan BM.docx. DATUM-17 = positif palsu yang diputus D-263 (Studio presisi; HS atas BM juga FAIL, `coder_execution_fixl.md:24`) | `diff` lint Manual 000 lawan BM: hanya DATUM-38 + banner |
| A5 FAIL (`updateFields` tidak ada) | datumcheck | **Keputusan templat benchmark, bukan cacat mesin.** `benchmark/manual000/template.json:885` `"render.docx.updateFieldsOnOpen": false` (bawaan mesin true, `engine/docx/package/parts.ts:248`; fixture PASS A5). Nilai ini meniru BM yang juga FAIL A5. Bertentangan dengan G-DQ-12 HS | Pemilik S95 (profil templat benchmark), perlu putusan controller |
| A4 | datumcheck | Node PASS; BM FAIL (`core.title kosong; core.created ... 2013-12-23`). Mesin lebih baik dari acuan | - |
| Studio C-27, C-34, C-SG-L2-04 x9, D18, D20, G3 x2, DATUM-03 | Studio | **Dikenal, D-263/D-269** | `run_summary.json` `lint.failSample` |
| Studio DATUM-32 x3 `/svgs/3` ("konektor #12/#13 melewati simpul tak terkait 0,7-1,0 mm") | Studio render | **Tidak ada di daftar D-269 dan tidak ditemukan di register/test/09.** Di luar cakupan DOCX HS (HS DATUM-32 = tahap build NOT-RUN). Figur sasaran hipotesis: bm-fig-18 (indeks ke-3 figur ENGINE, belum diverifikasi) | Pemilik S45 / kelas IP-81, triase controller |

## 5. Konsistensi HS lawan lint Studio (fixture TERBIT/SERAH)

| Cek | HS (DOCX) | Studio | Sebab beda |
|---|---|---|---|
| DATUM-05 | FAIL (DejaVu Sans) | PASS "0 penyebutan wajah fon, tidak ada fon bawaan Office" | Studio hanya menolak fon bawaan Office, HS menolak semua wajah di luar token |
| DATUM-09 | FAIL (tabel Distribusi) | PASS ("0"/"3 tabel data numerik ... memuat satuan") | Studio menilai blok tabel konten di model, bukan tabel aparatus DOCX |
| DATUM-10 | FAIL (4-5 tabel aparatus) | PASS ("10"/"13 tabel bercaption/gambar memuat SUMBER") | Studio hanya menilai tabel bercaption |
| DATUM-14 | FAIL (seluruh dokumen = 1 segmen) | NOT_RUN "tidak ada HTML terukur" | Studio menilai di tahap render HTML |
| C-27, D20, D01 x16 (SERAH) | tidak ada padanan | FAIL | Cek bahasa/struktur khas Studio, selisih isi fixture (FIX-SERAH: "sisa selisih isi fixture") |

Status rilis Studio FAIL dan VERDICT HS FAIL searah pada keempat dokumen. Namun keduanya FAIL karena kumpulan cek yang berbeda dan tidak saling beririsan.

## 6. Keluaran yang dikutip (ringkas)

```
v1_terbit  datum_lint rc=1 VERDICT: FAIL   BANNER: dijalankan 28 cek file (PASS 23, FAIL 4, REPORT 1); NOT-RUN 11
v2_terbit  datum_lint rc=1 VERDICT: FAIL   (diff lint v1 vs v2 TERBIT: identik)
v1_serah   datum_lint rc=1 VERDICT: FAIL   (PASS 23, FAIL 4)
v2_serah   datum_lint rc=1 VERDICT: FAIL   (beda v1 hanya nomor tabel 6->7, 4->5..7)
m000_v2    datum_lint rc=1 VERDICT: FAIL   (PASS 20, FAIL 7)
bm         datum_lint rc=1 VERDICT: FAIL   (PASS 19, FAIL 8)  diff m000 vs bm: hanya "DATUM-38 PASS" vs "DATUM-38 FAIL ... Manual_Komprehensif_..." + banner
pyref TERBIT rc=0 PASS (27/0) ; pyref SERAH rc=1 FAIL DATUM-09 tabel2,7,9
datumcheck: v1/v2 terbit, v1/v2 serah, pyref x2 -> CHECK A2..A5 PASS, VERDICT: PASS
datumcheck m000_v2 -> VERDICT: FAIL — em dash U+2014 nol semua lapisan XML, settings.xml updateFields=true (G-DQ-12)
datumcheck bm      -> VERDICT: FAIL — em dash ..., properti inti nyata, settings.xml updateFields=true (G-DQ-12)
```

## 7. Cara menjalankan ulang

```
P=C:/Users/TRIAL/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe
HS=C:/Users/TRIAL/AppData/Local/hermes/skills/gsp/datum-house-style
# render (repo root)
npx tsx scripts/parity/run/render_cli.ts --doc tests/parity/fixtures/doc/v2/doc_terbit_report.json \
  --template tests/parity/fixtures/doc/doc_terbit_report.template.json --out <O>/render/v2_terbit_report --formats docx
# lint (cwd = skill)
cd $HS/scripts && $P -I -B datum_lint.py "<docx>"
cd $HS && $P -I -B -c "import sys,runpy; H=r'<HS>'; sys.path.insert(0,H); sys.argv=[H+'/datumcheck.py',sys.argv[1]]; runpy.run_path(H+'/datumcheck.py',run_name='__main__')" "<docx tanpa .pdf pendamping>"
```

## 8. Batasan dan rekomendasi

- FIX-2 belum mendarat pada run pertama (14:31). Run ulang sesudah FIX-2 (D-309) ada di §9: hasilnya tidak berubah.
- §7.2-7 tidak bisa PASS tanpa salah satu putusan berikut (aturan HS tidak dilonggarkan): (a) aparatus lembar kendali membawa SUMBER/satuan, atau medan kendali fixture tidak memuat angka telanjang/tanggal ISO; (b) glif tanda memakai wajah token (mono) alih-alih DejaVu, yang menyimpang dari BM; (c) DATUM-14 HS atas DOCX tanpa jejak paginasi diterima sebagai DIAGNOSIS, diganti bukti per halaman dari S45/PDF. Semua putusan ini milik controller/user (lihat M-4).
- Celah cakupan lint Studio (S46: DATUM-05, 09, 10 tidak menilai aparatus/wajah non-token) membuat status rilis Studio tidak memprediksi VERDICT HS.
- Studio DATUM-32 x3 pada Manual 000 perlu triase (belum tercatat).

## 9. Run ulang sesudah FIX-2 (D-309)

Prasyarat: `src/lib/studio/engine/front/texts.ts` ada (14:53). Prosedur sama dengan §2 dan §7. Keluaran: `C:/Users/TRIAL/AppData/Local/Temp/dl1/rerun/` (`render/**`, `in/**`, `lint/*.txt`). Skill HS: sha sebelum = sesudah (`SKILL_UNCHANGED_BEFORE`, `SKILL_UNCHANGED_AFTER`).

| Dokumen | sha256 DOCX (16) run ulang | `datum_lint.py` | `datumcheck` A2-A5 | Dibanding run pertama |
|---|---|---|---|---|
| TERBIT v1 | `b61f875f217901d9` | FAIL: DATUM-05, 09, 10, 14 | PASS | DOCX byte-identik; lint dan datumcheck identik (`diff` kosong) |
| TERBIT v2 | `7157312da22db248` | FAIL: DATUM-05, 09, 10, 14 | PASS | identik |
| SERAH v1 | `e6c38f7480f2d734` | FAIL: DATUM-05, 09, 10, 14 | PASS | identik |
| SERAH v2 | `3245655e88a5953e` | FAIL: DATUM-05, 09, 10, 14 | PASS | identik |
| Manual 000 v2 official3 | `952f65d63c77f615` | FAIL: DATUM-03, 05, 07, 10, 14, 17, 22 | FAIL A3, A5 | identik (D-309: v2 resmi byte-identik) |
| Manual 000 v2 render CLI terbaru (`render_cli.ts --doc benchmark/manual000/doc.v2.json --template benchmark/manual000/template.v2.json --asset-index benchmark/manual000/figures/index.json`) | `c64c9a4586cc3b81` | FAIL: 7 cek yang sama | FAIL A3, A5 | Keluaran lint dan datumcheck identik dengan official3. sha berbeda karena jalur figur CLI berbeda dengan `run_benchmark`: part yang beda hanya `word/document.xml`, `document.xml.rels`, dan nama/isi `word/media/fig-*.png` |
| BM.docx | `6f6f11d34c03301a` | FAIL: 7 cek yang sama + DATUM-38 | FAIL A3, A4, A5 | identik |

Kesimpulan run ulang: FIX-2 tidak mengubah keluaran DOCX TERBIT/SERAH, sehingga vonis tetap. §7.2-7 masih FAIL 4/4 (DATUM-05/09/10/14). §7.3 A2-A5 tetap PASS 4/4. Manual 000 tetap 7 cek = BM (selisih hanya DATUM-38). Pemetaan pemilik di §3/§4 tetap berlaku. Kenyataan bahwa tabel lembar kendali DOCX tidak berubah oleh FIX-2 sesuai dengan D-309 ("fixture ID identik"; FIX-2 menyelaraskan HTML ke DOCX).
