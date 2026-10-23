---
task_id: doc_artifact_studio_03_datum_engine_inventory
date: 2026-10-22
agent: data-collector
items_collected: 62
---

# 03 Inventaris Mesin Render DATUM di Mesin Ini

Tier bukti: 2 (temuan eksplorasi) dan 3 (inventaris mekanis). Tidak ada analisis, rekomendasi, atau desain di dokumen ini. Setiap butir membawa sitasi `path:baris` atau keluaran perintah. Pengamatan yang bukan fakta terukur diberi label "hipotesis".

Singkatan path (semua absolut):

- `HS` = `C:\Users\TRIAL\AppData\Local\hermes\skills\gsp\datum-house-style\` (skill `datum-house-style` v2.6.0, "garis A")
- `RL` = `C:\Users\TRIAL\AppData\Local\hermes\profiles\gspuser02\skills\datum-revl\` (skill `datum-revl`, DATUM v1.9 Rev L, "garis B")
- `RLW` = `C:\Users\TRIAL\workspace\gsp-hermes\workspace\docs\2026-10-14-datum-revl-adopsi\paket-datum-v1.9-RevL\` (salinan paket Rev L di workspace)
- `VENV` = `C:\Users\TRIAL\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe` (Python 3.11.15; keluaran `--version`)

Semua pemanggilan dijalankan dengan `VENV -I -B` (atau `-X utf8 -I -B`), cwd `/tmp`, sehingga tidak ada `__pycache__` baru di folder skill. Verifikasi: `find HS -newer HS\SKILL.md -type f` tidak mengembalikan berkas.

---

## 1. Task Overview

Sumber kebenaran tugas: `C:\Users\TRIAL\gsp-swarm-hq-v2.1\docs\2026-10-22_doc_artifact_studio\identification\01_translated.md` (baris 32-34: mesin render "pakai ulang skrip skill `datum-house-style` (Python: datum_docx/xlsx/pptx/diagram/figur, datumcheck, datumbind, datumsimbol) vs port ke TypeScript"; format awal DOCX, PDF, HTML, SVG/PNG, XLSX/PPTX menyusul).

Cakupan koleksi: inventaris skrip/modul DATUM yang sudah ada di disk, dengan path, jumlah baris, docstring, API publik, format masukan/keluaran, dependensi, CLI, daftar keluarga/jenis, daftar cek lint, struktur token, fon, dan konverter DOCX ke PDF.

Dimensi riset eksternal (tabel agen): tidak ada yang dalam lingkup tugas ini (lihat bagian 12).

### Temuan struktural paling dasar (ringkas, detail di bawah)

Ada DUA garis kode DATUM di disk, dengan isi berbeda:

| | Garis A: `datum-house-style` v2.6.0 | Garis B: `datum-revl` DATUM v1.9 Rev L |
|---|---|---|
| Lokasi | `HS` (registry fleet `skills\gsp`), identik byte-per-byte dengan `C:\Users\TRIAL\workspace\gsp-hermes\skills\datum-house-style\` (48 berkas, 0 beda; keluaran `cmp` per berkas) | `RL` (profil `gspuser02`), identik dengan `RLW` untuk 15 skrip + `tokens.json`; hanya `SKILL.md` beda (`cmp`: "SKILL DIFF"; ukuran 68546 vs 68553 byte) |
| Asal | "REBUILD lini baru v2.0.0 ... BUKAN restorasi mesin v1.8 Rev J" (`HS\SKILL.md:20-34`) | Paket "DATUM v1.9 Rev L" (`RL\SKILL.md:3`; `RL\tokens.json`: `version "1.9"`, `revision "K"`, `issued "2026-08-14"`) |
| tokens.json | 117 baris, 8 kunci teratas, 169 daun | 1038 baris, 24 kunci teratas, 675 daun |
| Berisi `references/`, `assets/fonts`, `samples/` | tidak (folder tidak ada: `ls` error "No such file or directory") | ya (13 md referensi, 17 ttf, logo, manual PDF/DOCX, 3 sampel) |
| Berisi `datum_render.py`, `datumchart.py`, `datum_symbols.py`, `datum_figma_audit.py`, `datumplot.py` | tidak | ya |
| Berisi `pustakachart.py` (galeri 74 PNG), `datumsimbol.py`, `datum_figur.py`, `datumbuku.py` | ya | tidak (`datumplot.py:5-10` menyatakan "pustakachart.py tidak ikut terkirim") |

Catatan kronologi (fakta dari mtime dan teks): `HS\SKILL.md:26-28` menulis "Mesin Rev J dan tokens.json 1.8 tidak ada di disk (vonis probe 05-10)"; paket Rev L di `RL`/`RLW` bertanggal 14 Oktober 2026 (`ls`: Oct 14 16:10).

---

## 2. Files Collected

### 2.1 Peta berkas garis A (`HS`)

Jumlah baris dari `wc -l`; ukuran byte dari `ls -la`.

| Berkas | Baris | Byte | Peran (ringkas) |
|---|---|---|---|
| `SKILL.md` | 608 | 48759 | manifest skill + daftar instrumen (`SKILL.md:62-83`) |
| `tokens.json` | 117 | 6692 | token tunggal |
| `datumbind.py` | 296 | 13873 | register angka, derivasi, resolver token |
| `datumcheck.py` | 480 | 20824 | guard situs-panggil + audit berkas jadi |
| `datum_docx.py` | 808 | 38199 | builder DOCX (kelas `DatumDocx`) |
| `datum_xlsx.py` | 165 | 7022 | builder XLSX (kelas `DatumWorkbook`) |
| `datum_pptx.py` | 182 | 8024 | builder PPTX (kelas `DatumDeck`) |
| `datum_diagram.py` | 1488 | 74187 | engine diagram: spek JSON ke SVG |
| `datum_figur.py` | 249 | 11246 | baterai figur pada PDF + sensor sidecar |
| `datumsimbol.py` | 403 | 20406 | pustaka 41 simbol SVG |
| `pustakachart.py` | 1711 | 84688 | galeri chart PNG (matplotlib) |
| `pustakachart_data.py` | 235 | 10602 | data sintetis beku untuk galeri |
| `embed_fonts.py` | 248 | 9530 | probe/instal/embed font (Windows, Word COM) |
| `scripts\datum_lint.py` | 938 | 42395 | lint DOCX: 39 cek |
| `scripts\datumbuku.py` | 713 | 31425 | lint XLSX: 23 cek W |
| `scripts\fixtures_lint\make_fixture.py` | 81 | - | pembangun fixture lint |
| `scripts\fixtures_lint\basal_rusak.docx` | - | - | fixture merah |
| `scripts\fixtures_buku\*.xlsx` | - | - | 24 berkas (1 bersih, 22 rusak, 1 peringatan) |
| `fixtures_diagram\good_layered.json`, `good_sld.json`, `bad_cases.json` | 26, 24, 167 | - | fixture spek diagram |
| `selftest_builder.py` | 324 | 15586 | selftest builder (memakai Word COM) |
| `selftest_chip_para.py` | 179 | 6861 | selftest helper rail |
| `selftest_datum_diagram.py` | 545 | 28025 | selftest diagram |
| `selftest_datumbind.py` | 121 | 5789 | selftest datumbind |

Berkas yang disebut tugas tetapi TIDAK ada di `HS`: `datumchart.py`, `datumword.py`, `datum_render.py`, `datum_symbols.py`, `datum_figma_audit.py`, folder `references\`, folder `assets\fonts`. Hasil Glob `**/datumword*` pada `C:\Users\TRIAL\workspace` dan `C:\Users\TRIAL\AppData\Local\hermes`: "No files found". Lima berkas lain ada di garis B (bagian 2.2).

### 2.2 Peta berkas garis B (`RL`)

| Berkas | Baris | Byte | Catatan |
|---|---|---|---|
| `SKILL.md` | 990 | 68546 | |
| `tokens.json` | 1038 | 28884 | identik dengan `RLW\tokens.json` (`cmp`) |
| `scripts\datum_diagram.py` | 2098 | 97033 | |
| `scripts\datum_docx.py` | 459 | 25621 | skrip pembangun, bukan kelas pustaka (bagian 4.6) |
| `scripts\datum_xlsx.py` | 419 | 25396 | idem |
| `scripts\datum_pptx.py` | 234 | 14003 | idem |
| `scripts\datum_lint.py` | 496 | 25877 | lint docx/xlsx/pptx/svg/md/html/txt/pdf |
| `scripts\datum_render.py` | 255 | 11274 | SVG ke PNG/PDF, cek lembar A4 |
| `scripts\datumchart.py` | 296 | 14254 | engine chart bersumbu: JSON ke SVG |
| `scripts\datumplot.py` | 186 | 8804 | tema matplotlib DATUM |
| `scripts\datum_symbols.py` | 663 | 32181 | pustaka 41 simbol |
| `scripts\datum_figma_audit.py` | 193 | 7854 | audit drift Figma terhadap spek |
| `scripts\datumbind.py` | 278 | 12816 | |
| `scripts\datumcheck.py` | 206 | 8806 | guard situs-panggil, rencana JSON |
| `scripts\embed_fonts.py` | 138 | 6781 | embed font OOXML tanpa Word (lxml) |
| `scripts\ujicepat.py` | 293 | 15463 | tes cepat integrasi 3 lapis |
| `scripts\datum_chat_lint.py` | 126 | 5917 | lint register percakapan chat |
| `references\01..13-*.md` | 118-494 per berkas | - | 13 berkas, daftar dan jumlah baris di bagian 9.2 |
| `assets\fonts\` | - | - | 16 ttf Plex + `DejaVuSans.ttf` + `PASANG-DULU.txt` |
| `assets\logo\` | - | - | `gsp-duo.png`, `gsp-penuh.png`, `gsp-putih.png`, `gsp-tinta.png`, `gsp-tinta9.png` |
| `assets\rules\` | - | - | `datum-128.png`, `datum-166.png`, `datum-gelap.png`, `datum-w166.png` |
| `assets\manual\` | - | 2573590 (PDF), 10602892 (DOCX) | Manual Komprehensif DATUM GSP 000-GSP-STD-X-2026 RevA (PDF + DOCX) + 24 PNG gambar manual di `assets\manual\gambar\` |
| `assets\DATUM Lembar Bukti.pdf`, `assets\Sumber Lembar Bukti.html` | - | 206674, 41265 | lembar bukti PDF dan sumber HTML-nya |
| `samples\` | - | - | `GSP DATUM Contoh Laporan Teknis.docx`, `GSP DATUM Contoh RAB.xlsx`, `GSP DATUM Contoh Command Brief.pptx` |
| `Catatan Perubahan Rev K.md`, `Catatan Perubahan Rev L.md` | 58 (Rev L) | - | |

### 2.3 Berkas terkait lain yang ditemukan

| Path | Baris | Catatan |
|---|---|---|
| `C:\Users\TRIAL\workspace\gsp-hermes\workspace\docs\2026-10-04-datum-manual\manual\scripts\build_manual_datum.py` | 1447 | pembangun manual DOCX dari markdown. Docstring baris 2-9: "Masukan : manual/bagian-1.md, bagian-2.md, bagian-3.md ... Keluaran: manual/DATUM Document Manual 002-GSP-STD-X-2026 RevA.docx". Dasar helper `datum_docx.py` garis A (`HS\datum_docx.py:5-9`). |
| `...\2026-10-04-datum-manual\manual\scripts\docx_to_pdf_word.py` | 47 | konversi DOCX ke PDF via Word COM (bagian 11.2) |
| `C:\Users\TRIAL\workspace\gsp-hermes\workspace\docs\2026-10-06-prompt-manual-v2\toolkit\datum_chart_buku.py` | - | generator chart warisan; dipakai opsional oleh `HS\pustakachart.py:1435-1445`; berstatus depresiasi (`HS\SKILL.md:90-98`) |
| `...\2026-10-06-prompt-manual-v2\toolkit\datum_render_buku.py` | - | berkas lain bernama mirip; tidak diperiksa isinya |
| `C:\Users\TRIAL\AppData\Local\hermes\skills\gsp\_salvage-profil-merge-1010\datum-docx-render-pipeline\SKILL.md` | - | skill (hanya SKILL.md), deskripsi: "Use when building DATUM DOCX+PDF. COM and font pitfalls." |
| `C:\Users\TRIAL\AppData\Local\hermes\profiles\rafif01\skills\orchestration\gsp-datum-publish-mission\SKILL.md` | - | deskripsi: "Use when publishing DATUM-styled research reports as PDF." |
| `C:\Users\TRIAL\AppData\Local\hermes\skills\gsp\gsp-word-report-deliverable\scripts\build_md_to_docx.py` | 207 | konverter Markdown ke DOCX, Calibri 10.5 (bukan gaya DATUM); docstring baris 1-21 |
| `...\gsp-docx-business-report\templates\build_report_docx.py` | 165 | kerangka builder laporan (salin-modifikasi) |
| `...\gsp-report-format\templates\gsp_lib.py` | 315 | helper dokumen GSP, fallback fon Office (Segoe UI Semibold/Georgia/Consolas); docstring: "Tanpa mesin render resmi gspdatum.py" |
| `C:\Users\TRIAL\AppData\Local\hermes\kanban\workspaces\t_*\...\snap\pustakachart.py` | - | 24 salinan snapshot kerja `pustakachart.py` (hasil Glob); bukan sumber |

---

## 3. Garis A: inventaris per skrip (`HS`)

Pola pemanggilan resmi di `HS\SKILL.md:520-551` memakai `C:/Users/TRIAL/AppData/Local/hermes/bin/uv run --python 3.11 --with <pkg> python <skrip>`; `uv.exe` ada di `C:\Users\TRIAL\AppData\Local\hermes\bin\` (`ls`). Pemanggilan di bawah memakai `VENV` langsung.

### 3.1 `tokens.json` (sumber token)

- `HS\tokens.json`, 117 baris. Kunci teratas (8) dan jumlah daun (dihitung dengan skrip pembaca JSON): `$schema_note` (1), `_provenance` (6; `versi`, `dibangun`, `status`, `sumber`), `colour` (28), `type` (97), `grid_mm` (12), `rules_mm` (14), `marks` (6), `numerals` (5). Total 169 daun.
- Letak per seksi: `colour` baris 13, `type` 45, `grid_mm` 78, `rules_mm` 91, `marks` 102, `numerals` 110.
- `colour` memuat sub-kunci `wrapper` (paper, ink, body, meta, rule, seal, cream), `interior` (paper, ink900, ink700, ink400, ink200, ink100, signal, alert, verd, link), `brief` (ground, accent), `retired` (`"#1A2B4A navy"`, `"#C9A84C gold"`), `forbidden_body_faces` (Calibri, Times New Roman, Aptos, Arial) (`tokens.json:13-43`).
- `type.faces` (`tokens.json:47-52`): `serif` "IBM Plex Serif", `condensed` "IBM Plex Sans Condensed", `mono` "IBM Plex Mono", `workbook_ui` "IBM Plex Sans". `type.scale_pt` memuat 13 peran (`tokens.json:61-75`): chapter_title, chapter_kicker, section_heading, body, table_body, table_numerals, table_header, caption, source_line, evidence_rail, running_head, register_block, derivation. `baseline_pt` 13,5.
- `grid_mm` (`tokens.json:78-90`): page [210,297], inner_margin 24, text_column 128, gutter 6, evidence_rail 32, outer_margin 20, full_span 166, horizontal_lattice 10.6667, vertical_lattice 4.7625.
- `rules_mm` (`tokens.json:91-101`): primary 0.45, below_header 0.25, hair 0.20, revision_bar 0.50, photocopy_floor 0.18, word_ladder_sz [5,6,8,10,11], tints_percent [15,30].
- `marks` (`tokens.json:102-109`): TERUKUR ■ (U+25A0), DITURUNKAN ◈ (U+25C8), PEMASOK ◇ (U+25C7), ASUMSI △ (U+25B3). `numerals` (`tokens.json:110-116`): thousands ".", decimal ",".
- Resolver: `datumbind.tokens_path()` (`HS\datumbind.py:57-67`) mengembalikan `tokens.json` di samping `datumbind.py`; `pustakachart.py:50-54` dan `datumsimbol.py:42-47` punya daftar kandidat sendiri (env `DATUM_TOKENS`, lalu path hermes, lalu path workspace).
- Hash: `sha256sum tokens.json` awalan `da95cb7b202e7e69`; manifest `pustakachart` mencatat `tokens_sha256 da95cb7b202e7e69d2bc4373ced41f9a189ae0ea9280e50f42010defb4533d9c`.

### 3.2 `datumbind.py` (296 baris)

- Tujuan (docstring `datumbind.py:3`, `:20-30`): "DATUM quantity register, number binding, derivation arithmetic, and audit." Empat hal: `Register`, `Derivation`, `audit_docx`, `audit_retired`.
- API publik (`__all__` baris 50: Register, Derivation, BindDefect, fmt, tokens_path):
  - `tokens_path()` (baris 57)
  - `fmt(v, dec=0)` (baris 70): ribuan ".", desimal ","
  - `class BindDefect(Exception)` (baris 53)
  - `class Register` (baris 83): `__init__(self, path=None, data=None)`, `@staticmethod emit(path, entries)` (baris 100), `v(k)`, `mark(k)`, `src(k)`, `n(k, dec=None)`, `u(k, dec=None)`, `rp(k)`, `pct(k, dec=2)`, `unused()`, `audit_text(text, allow=())`, `audit_docx(path, allow=(), quiet=False)` (baris 197), `audit_retired(path, retired, quiet=False)` (baris 206)
  - `class Derivation` (baris 216): `__init__(label, reg, width=54, note=None)`, `text(s)`, `line(uraian, key=None, dec=None, unit=True, value=None)`, `result(uraian, expr, key, dec=None, tol=0.51, unit=True)`, `verdict(uraian, key, limit, ok='MEMENUHI', bad='TIDAK MEMENUHI', dec=None)`, `closes(note)`, `build()`
- Format masukan (register JSON): dipancarkan `Register.emit(path, entries)` dengan `entries = {'nama': (value, dec, unit, mark, source)}` (docstring baris 101). Berkas keluaran: `{ "nama": {"v":..., "dec":..., "unit":..., "mark":"TERUKUR|DITURUNKAN|PEMASOK|ASUMSI", "src":...} }` (`datumbind.py:116-128`, `json.dump` di baris 128). `emit` menolak mark tak dikenal, `mark=None`, dan `unit` kosong dengan `BindDefect` (baris 117-125).
- Catatan implementasi: `Derivation.result` memakai `eval()` dengan `{'__builtins__': {}, 'abs','round','sqrt','min','max'}` atas ekspresi yang diberikan pemanggil (`datumbind.py:250`).
- CLI (`datumbind.py:290-296`): `python datumbind.py <register.json> <dok.docx> [...]`; exit 0 semua angka tertelusur, exit 1 ada stray. Tanpa argumen: mencetak docstring.
- Dependensi pihak ketiga: `python-docx` (lazy, baris 188). Terpasang di VENV: ya (python-docx 1.2.0).
- Keluaran: JSON register (berkas), teks laporan stdout.

### 3.3 `datumcheck.py` (480 baris)

- Tujuan (docstring baris 2-3): "guard situs-panggil + audit berkas jadi DATUM v2.0.0".
- API publik (daftar di `datumcheck.py:76-410`): `num_floor_mm(tok)`, `solve_widths(rows, total_mm=128.0)`, `audit_wrap_digit(pdf)`, `class CheckDefect(Exception)`, `name_guard(name)` (N1), `table_guards(tid, rows, widths_mm, tol_mm=0.05)` (G1-G4), `check_heading(text)` (cek 03/04), `check_value_unit(tok)` (cek 16), `check_source_line(src, ctx)` (cek 10/29), `px_guard(image_path, w_mm)` (DATUM-39/E-08, min 150 dpi), `figure_guards(caption, h_mm)` (cek 30 + DATUM-33), `audit_links(path)`, `audit_em_dash(path)`, `audit_props(path)`, `audit_update_fields(path)`, `page_count_com(path, timeout_note='')`, `run_cli(argv)`.
- Daftar pemeriksaan audit CLI (`datumcheck.py:23-34`): A1 halaman nyata (Word COM, hanya dengan `--pages-com`), A2 tautan aktif-terlihat, A3 em dash U+2014 nol, A4 properti inti terisi, A5 `updateFields` true, A6 baterai figur ENH-E pada padanan PDF (memanggil `datum_figur.battery`), A7 wrap-digit sel tabel (PDF). Guard G4: lantai lebar kolom numerik (`datumcheck.py:36-41`).
- CLI: `datumcheck.py <dok.docx> [--pages-com]` (`datumcheck.py:410-478`); exit 0 lolos, 1 ada cacat. A6/A7 SKIP jujur bila PDF `<nama>.pdf` di samping DOCX belum ada.
- Dependensi pihak ketiga (baris 136, 250, 289-290, 376, 439): `pymupdf` (terpasang 1.28.2), `PIL` (Pillow 12.3.0), `python-docx` (1.2.0), `win32com.client` (pywin32 311). Semua terpasang di VENV.
- Keluaran: teks stdout `CHECK An: PASS|FAIL|SKIP ...` dan `VERDICT:`.
- Eksekusi nyata (read-only) pada sampel Rev L (`RL\samples\GSP DATUM Contoh Laporan Teknis.docx`): `A2 PASS`, `A3 FAIL (3 em dash)`, `A4 FAIL (core.title kosong; created epoch 2013-12-23)`, `A5 FAIL`, `A6/A7/A1 SKIP`, `VERDICT: FAIL`, exit 1.

### 3.4 `datum_docx.py` (808 baris)

- Tujuan (docstring baris 2-3): "builder DOCX berbasis token paket datum-house-style v2.0.0". Docstring `:18-27` memuat pola pemakaian.
- API publik:
  - fungsi bantu OOXML: `face(role_key)` (55), `oei` (120), `style_run` (142), `fmt_para` (164), `cell_fill` (212), `cell_margins` (221), `cell_borders` (234), `fix_table` (254), `cell_text` (280), `para_border` (294), `tab_right` (308), `add_field` (320), `class RelBag` (202)
  - `class DatumDocx` (341-755): `__init__(self, title, doc_no, rev, issue_date='', author='', subject='', category='Report', comments='', classification='BIASA', copies='SALINAN 01 DARI 01 · PENGGUNAAN INTERNAL GSP', n_pages_hint='2', caption_sep=' - ')`, `cover(kicker='', deck='', identity=None)`, `start_interior(chapter_label='')`, `heading(text, level=1, page_break=False)`, `para(text, role='body', align=None, keep=False)`, `rail_host(p)`, `rail_chip(text, role='evidence_rail')`, `derivation(d)`, `table(rows, source, widths_mm=None, apparatus=False)`, `figure(image_path, w_mm, h_mm, caption, source)`, `save(path)`
  - `chip_texts_para(body_xml)` (759): pembaca teks chip rail
- Format masukan (dari kode, bukan JSON):
  - `rows` pada `table()`: list-of-list; baris pertama = kepala; tiap sel di-`str()` (`datum_docx.py:638`). `source` string wajib (`check_source_line`). `widths_mm` opsional (bila `None`, `solve_widths(rows, 128)`).
  - `identity` pada `cover()`: list empat-tuple `(label1, nilai1, label2, nilai2)` (`datum_docx.py:435`).
  - `para()` memakai penanda inline md-lite: `**tebal**`, `` `mono` ``, `*miring*`, URL `https?://`, `doi.org/`, `iso.org/`, DOI `10.dddd/` (`datum_docx.py:548-575`). `role` harus kunci `type.scale_pt`.
  - `figure()`: berkas gambar raster (PNG/JPG) via `add_picture`; menjalankan `name_guard`, `figure_guards`, `check_source_line`, `px_guard` (>=150 dpi) (`:727-749`).
  - `derivation(d)`: objek `datumbind.Derivation` yang sudah `build()` (`:621`).
- Keluaran: `.docx` (python-docx). Properti inti, `updateFields=true` (`:386-396`), latar halaman `w:background` (`:375-378`).
- Moda rail bukti: `rail_chip`/`rail_host` (`:584-619`), konstanta `RAIL_FRAMEPR_POST` (`HS\SKILL.md:50-57`).
- Tidak ada build saat import (`datum_docx.py:13-14`; `:806-808` `__main__` hanya mencetak docstring).
- Dependensi pihak ketiga: `python-docx` (baris 35-40). Terpasang: ya.
- Tidak ada konversi Markdown/JSON ke DOCX di modul ini; semua konten disusun lewat panggilan metode.

### 3.5 `datum_xlsx.py` (165 baris)

- Tujuan (baris 2-3): "builder workbook DATUM berbasis token v2.0.0". Lint 23 cek milik `datumbuku.py` (baris 13-14).
- API (`datum_xlsx.py:64-160`): `class DatumWorkbook`: `__init__(title, doc_no, rev, author='', classification='TERBATAS')`, `cover(kicker, judul, deck='', identity=())` (identity: list empat-tuple), `sheet(name, tab_color=None)`, `header(ws, labels, row=3, widths=None)`, `row(ws, values, row=None, numeric_cols=(), marks=None)`, `source_line(ws, text, row=None)`, `save(path)`; fungsi `argb`, `track`, `font`.
- Pemakaian (docstring baris 17-23): `W.sheet("RANKING TIER")`, `W.header(ws, [...])`, `W.row(ws, [1, 97.5, "keterangan"], numeric_cols={1})`.
- Keluaran: `.xlsx` (openpyxl). Tanpa sel gabungan, tanpa rumus; nilai ditulis sebagai nilai biasa. Dependensi: `openpyxl` (3.1.5, terpasang).

### 3.6 `datum_pptx.py` (182 baris)

- Tujuan (baris 2-3): "builder deck presentasi DATUM berbasis token v2.0.0". Baris 4-13: "TIDAK ada garis builder pptx terbukti di disk ... kelas BARU".
- API (`datum_pptx.py:59-177`): `class DatumDeck`: `__init__(title, doc_no, rev, author='', classification='BIASA')`, `title_slide(kicker='', deck='')`, `content_slide(heading)`, `bullet(slide, text, level=0, size=14)`, `table_slide(heading, rows, source)`, `save(path)`. Ukuran slide 13,333 x 7,5 in (`:56`).
- Keluaran: `.pptx` (python-pptx). Dependensi: `python-pptx` (1.0.2, terpasang).

### 3.7 `datum_diagram.py` (1488 baris)

- Tujuan (docstring baris 3-4): "kelas DIAGRAM/INFOGRAF paket datum-house-style v2.0.0 ... REBUILD lini baru v2.0.0 dari spesifikasi tertulis". Baris 33-36: "Yang TIDAK dikerjakan berkas ini: datum_render.py (PNG 300 dpi) dan datumword.py (penempatan .docx) = DHS-RB-05; datum_lint.py 38 cek = DHS-RB-02."
- API publik: `class DiagramDefect(Exception)` (66), `load_tokens()` (71), `load_spec(path)` (255; menolak `.mmd/.mermaid` dan teks Mermaid, DATUM-31), `mirror_source(spec)` (270), `validate_spec(spec)` (281), `class Sheet` (391), `layout_layered/flow/swimlane/sequence/sld/rack/graph(spec, sheet)` (452-799), `route_edges(spec, sheet)` (930), `add_crossing_hops(paths)` (1019), `build_svg(spec, release=False)` (1115; mengembalikan `(svg, report)`), `estimate(spec)` (1424), `render_hint(rep)` (1430), `main(argv=None)` (1439).
- Format keluaran: SVG teks (XML) saja. Root `<svg width="166.0mm" height="233.362mm" viewBox="0 0 166.0 233.362">` (satuan 1 = 1 mm; `datum_diagram.py:1207-1209`). Teks berupa elemen `<text font-family="IBM Plex Sans Condensed|IBM Plex Mono">` (tidak diubah jadi kontur; `_svg_text` baris 1044-1059, bukti `grep -o font-family` pada SVG hasil render). Tidak ada keluaran PNG/PDF di modul ini; `render_hint` (baris 1430-1435) hanya menghitung piksel 300 dpi dan menyebut "PNG dihasilkan datum_render.py (DHS-RB-05)".
- Dependensi: hanya stdlib (argparse, json, math, os, re, sys) dan `datumbind.tokens_path` (baris 38-43, 57).
- CLI (keluaran `--help` nyata):

```
usage: datum_diagram.py [-h] [-o OUT] [--schema] [--list] [--estimate]
                        [--release] [--json]
                        [spec]
  spec        berkas diagram-spec.json
  -o OUT      tujuan SVG
  --schema    cetak bidang minimum spek (P1 Tabel 6.1)
  --list      cetak keluarga/bentuk/jenis konektor (P2/P3/P4)
  --estimate  P9 E-19: perkirakan geometri tanpa menulis SVG
  --release   gerbang rilis: labels_verified wajib true
  --json      laporan sebagai JSON
```

  Exit 0 sukses; exit 1 bila `DiagramDefect` ("DIAGRAM DEFECT: ..." ke stderr) (`:1482-1484`). Tanpa `-o`, SVG ditulis di samping berkas spek (`:1476`). Spek tidak bisa dibaca dari stdin di garis A (`load_spec(path)` membuka berkas).
- Keluarga (9 nama, 7 mesin; `datum_diagram.py:125-135`, keluaran `--list`): `flow` (layout_flow), `graph` (layout_graph), `layered` (layout_layered), `rack` (layout_rack), `sequence` (layout_sequence), `sld` (layout_sld), `stack` (layout_layered), `swimlane` (layout_swimlane), `topology` (layout_layered).
- Bentuk simpul (10; `:138-149`): box, bus, circle, cylinder, diamond, doubled, hexagon, parallelogram, shadowed, stadium. Jenis konektor (6; `:152-165`): accent (solid, token signal), alert (longdash, alert), control (dashed, ink700), data (solid, ink900), sync (dotted, ink400), verify (dashdot, verd).
- Batas keras (`LIMITS`, baris 111-118): `diagram_type_min_pt` 5.5, `text_block_max_mm` 247.0, `max_colour_values` 5, `max_accented_subjects` 1, `hop_radius_mm` 0.9.
- Cek yang dijalankan engine (laporan `checks_run`, keluaran `--estimate --json` nyata): P1-family, P1-id, P1-title, P1-classification, P1-width_mm, P1-apparatus, P1-sources, P1-nodes+P3-shapes, DATUM-35, DATUM-24, DATUM-26, DATUM-34, P3-diamond-exits, (P1-labels_verified bila `--release`), DATUM-37-lebar, DATUM-32, DATUM-28, DATUM-27, DATUM-33, DATUM-25, DATUM-29/30.
- Pengecekan tervalidasi pada `validate_spec` (`:281-387`): `family` salah satu dari 9; `id` mengandung `\d+\.\d+`; `title` diakhiri titik; `classification` tidak kosong; `width_mm` 128 atau 166; `apparatus` page|figure (default page); `sources` list tidak kosong; `nodes` tidak kosong, tiap simpul `id`, `label`, `class` (dict); `shape` anggota katalog; `mark` anggota `{TERUKUR, DITURUNKAN, PEMASOK, ASUMSI}`; edges wajib `from/to/kind/label`; maksimal 1 edge `accent`; glif `mark` wajib ada di `legend`; diamond wajib punya edge keluar.

#### Format masukan: spek JSON garis A

Bidang minimum dari `SPEC_FIELDS` (`datum_diagram.py:172-185`; keluaran `--schema`): family, id, title, classification, `nodes[]` (id, label, class (tier/lane/col/row), sub, mark, tag), `edges[]` (from, to, kind, label), `legend[]`, `notes[]`, `sources[]`, `labels_verified`, `width_mm`, `apparatus`. Bidang opsional yang dibaca kode: `per_row` (flow, baris 489), `zones[]` dengan `id`, `label`, `members[]` (baris 1193, 1252-1264), `u` pada simpul rack (baris 612), `class.accent`, `class.secondary`, `class.external` (baris 1189, 1305-1307, 1365-1368), `source` (dicerminkan ke `sources`, baris 270-277).

Contoh spek lengkap (kutipan verbatim `HS\fixtures_diagram\good_layered.json:1-26`; dijalankan `--release`, exit 0):

```json
{
  "_provenans": "Basal BAIK kelas diagram DHS-RB-04. ...",
  "family": "layered",
  "id": "4.2",
  "title": "Arsitektur kendali unit menghubungkan sensor ruang ke pemantauan jarak jauh.",
  "classification": "TERBATAS",
  "width_mm": 166,
  "apparatus": "page",
  "labels_verified": true,
  "sources": ["Proposal Teknis Spesimen UPK-70 000-GSP-PT-X-2026 RevA, Gambar 4.2"],
  "nodes": [
    {"id": "sensor", "label": "Sensor ruang", "sub": "16 titik", "shape": "box", "mark": "TERUKUR",
     "class": {"tier": 0}},
    {"id": "panel", "label": "Panel kendali lokal", "shape": "box", "class": {"tier": 1}},
    {"id": "gateway", "label": "Gerbang data", "shape": "box", "class": {"tier": 2}},
    {"id": "cloud", "label": "Pemantauan jarak jauh", "shape": "shadowed", "external": true,
     "class": {"tier": 3, "external": true}}
  ],
  "edges": [
    {"from": "sensor", "to": "panel", "kind": "data", "label": "analog 4-20 mA"},
    {"from": "panel", "to": "gateway", "kind": "control", "label": "Modbus TCP"},
    {"from": "gateway", "to": "cloud", "kind": "verify", "label": "atestas integritas"}
  ],
  "legend": ["solid data", "dashed perintah", "dash-dot verifikasi integritas", "bingkai berbayang entitas eksternal", "TERUKUR"],
  "notes": ["Satu aksen per gambar; glif rumah wajib baris kunci (DATUM-34)."]
}
```

Contoh kedua: `HS\fixtures_diagram\good_sld.json:1-24` (family `sld`, `width_mm` 128, `apparatus` "figure", simpul berbentuk `bus`). Battery spek rusak: `HS\fixtures_diagram\bad_cases.json:1-167` (17 kasus, tiap satu dengan `name`, `expect`, `spec`; contoh kelas graph memakai `class: {"col": 0, "row": 0}`, baris 135-136).

Hasil eksekusi nyata (cwd `/tmp`, tanpa menulis ke folder skill):
- `--estimate --json` pada `good_layered.json`: `width_mm 166.0`, `height_mm 233.3625`, `n_colour 5` (`#101418, #2B3640, #2F6F6B, #6B7783, #B45309`), `n_nodes 4`, `n_edges 3`, `render_hint {dpi 300, width_px 1961, height_px 2756}`.
- `--estimate --json` pada `good_sld.json`: `width_mm 128.0`, `height_mm 109.5375`, `apparatus "figure"`.
- Render `--release` ke scratchpad: `{"out": ".../good_layered.svg", "bytes": 4998}`, exit 0; SVG 5034 byte.
- Pengamatan visual atas SVG itu (di-render lewat Chromium `set_content`, `probe_inline.png`): baris KEY (legenda) terpotong di tepi kanan viewport pada kata "TERUK..."; label konektor tampil dengan rupa berbeda dari label simpul. Itu pengamatan, bukan vonis.

### 3.8 `datum_figur.py` (249 baris)

- Tujuan (docstring baris 3-27): "baterai figur ENH-E: gerbang mutu gambar pada berkas PDF terbit". Empat pemeriksaan: F1 overflow, F2 caption (<= 40 pt di bawah bingkai), F3 overlap kata, F4 void (>25% tinggi); `main()` mencetak juga F5 lowres (E-08) (`:243`). Mode kedua: `--check-sidecar DIR --forbid "..."` (konsistensi sidecar yaml).
- API: `battery(pdf_path, allow_void=(), cover_pages=(1,))` (78; mengembalikan `(res, err)`), `check_sidecar(dir_path, forbid)` (144; mengembalikan list temuan), `main()` (190). Kunci `res`: pages, figures, overflow_pages, caption_ok, caption_total, caption_missing_pages, overlap, void_pages, lowres, defects (`:234-244`).
- Masukan: PDF terbit; untuk sidecar: folder berisi `*.yaml|*.yml` dengan bidang `label, labels, judul, judul_pesan, alt_text, title` (`:157`).
- CLI (`--help` nyata): `datum_figur.py [-h] [--json] [--allow-void ALLOW_VOID] [--cover-pages COVER_PAGES] [--check-sidecar DIR] [--forbid FORBID] [pdf]`; exit 0 bersih, 1 cacat, 2 tak terbaca/salah pakai.
- Dependensi: `pymupdf` (wajib kecuali `--check-sidecar`), `yaml` (opsional, fallback regex). Terpasang: pymupdf 1.28.2, PyYAML.
- Keluaran: teks stdout / JSON; tidak menghasilkan berkas.

### 3.9 `datumsimbol.py` (403 baris)

- Tujuan (docstring baris 3-4): "PUSTAKA SIMBOL GSP (registry datum-house-style v2.1.0, ENH-F). Empat dialek baseline DATUM dalam geometri vektor SVG milimeter, token-driven".
- API: `symbol_svg(sid)` (297), `sheet_svg(dialect, cols=3)` (313; mengembalikan list halaman SVG), `main()` (358); helper gambar privat (`_iec_switch`, `_isa_bubble`, `_valve`, `_cone`, `_mil_frame`, dst.).
- CLI (`--help` nyata): `datumsimbol.py [-h] [--list] [--dialect {iec,isa,mil,sec}] [--sheet OUT.svg] [--symbol SYMBOL] [--out OUT.svg]`; `--symbol` tanpa `--out` mencetak SVG ke stdout.
- Keluaran: SVG milimeter, 1 simbol per berkas atau lembar per dialek (multi-halaman `OUT-1.svg`, blok maks 247 mm).
- Daftar simbol (keluaran `--list`, total 41): iec (16): arrester, battery, breaker, busbar, changeover, contactor, ct, disconnector, earth, enclosure, fuse, generator, lamp, motor, switch, transformer. isa (12): auxiliary, computer, field, inaccessible, plc, primary, shared, shared-field, valve, valve-diaphragm, valve-motor, valve-solenoid. sec (7): barrier, camera, fence, mast, pir, ptz, reader. mil (6): friend, friend-air, hostile, hostile-air, neutral, unknown. ID berformat `dialek:nama`.
- Dependensi: hanya stdlib. Terpasang: n/a.

### 3.10 `pustakachart.py` (1711 baris) + `pustakachart_data.py` (235 baris)

- Tujuan (docstring baris 1-9): "PUSTAKA CHART GSP ... Render deterministik galeri chart katalog VCTL-1007 ... dalam palet dan tipografi DATUM".
- Bukan engine berbasis spek: `main()` hanya menerima `--out` dan `--check-min-pt` (`:1613-1618`); semua data berasal dari `pustakachart_data.py` ("DATA CONTOH SINTETIS BEKU", seed 42; `pustakachart_data.py:1-9`). Tidak ada parameter masukan JSON atau data pengguna.
- API publik: `init_fonts()` (71), `canvas(width_mm, height_mm)` (118; menolak lebar selain 128/166), `style_ax`, `finish(fig, out_png, title, footer_extra='')` (141), `measure_min_pt`, `entry(id_, nama, kelas, lebar_mm, tinggi_mm, resep, caption, fn)` (186), 61 fungsi `v01_...v99_`, 12 fungsi `ap01_...ap06_` (salah/benar), `legacy_threshold`, `build_registry()` (1463), `main()` (1613).
- Keluaran: PNG 300 dpi (`DPI = 300`, baris 66) ke `<out>\render\<ID>__<nama>.png`, `manifest.json` (sha256, lebar_mm, tinggi_mm, font_min_pt, kelas, caption, data_seed per entri), `katalog-gambar.md`. Teks di-set `svg.fonttype none` (baris 112) tetapi keluaran yang ditulis adalah PNG.
- CLI: `pustakachart.py --out <dir> [--check-min-pt]`; exit 0 bersih, 1 teks < 5,5 pt, 2 salah pakai.
- Dependensi: `numpy`, `matplotlib` (backend Agg). Terpasang: numpy 2.4.3 (terimpor) / 2.3.5 (metadata pip), matplotlib 3.11.1.
- Eksekusi nyata ke scratchpad: 8,7 detik, `TOTAL 74 PNG | manifest.json | katalog-gambar.md`, `MIN-PT: semua figur >= 5,5 pt`, exit 0; 74 berkas di `render\`; 2 baris peringatan `findfont: Failed to find font weight bold, now using 400.`. Manifest: `python 3.11.15`, `matplotlib 3.11.1`, `fonts.plex_added` 12 ttf dari `%LOCALAPPDATA%\Microsoft\Windows\Fonts`.
- Entri terdaftar (`pustakachart.py:1465-1611`, 73 panggilan `E(`, ditambah blok warisan `LEGACY-THRESHOLD` = 74 PNG):

| Kelas | ID dan nama |
|---|---|
| K1 (perbandingan) | VC-01 Bar chart, VC-02 Column chart, VC-03 Grouped bar, VC-04 Grouped column, VC-05 Lollipop, VC-06 Dot plot, VC-07 Dumbbell, VC-09 Range plot, VC-11 Slope, VC-12 Matrix, VC-13 Small multiples, VC-15 Table chart, VC-16 Pareto |
| K2 (komposisi) | VC-19 Stacked bar, VC-20 Stacked column, VC-21 Diverging bar, VC-22 Diverging column, VC-23 Population pyramid, VC-24 Waffle, VC-25 Square area, VC-26 Icon chart, VC-31 Marimekko, VC-32 Treemap, VC-36 Dendrogram, VC-37 Funnel, VC-40 Org chart |
| K3 (waktu) | VC-41 Line, VC-42 Area, VC-43 Stacked area, VC-45 Bump, VC-47 Spline, VC-48 Step line, VC-49 Calendar heatmap, VC-50 Fan chart, VC-51 Sparkline |
| K4 (sebaran) | VC-52 Histogram, VC-53 Density, VC-54 Box, VC-55 Violin, VC-56 Strip, VC-57 Jitter, VC-59 Ridgeline, VC-60 Barcode, VC-61 One-dimensional heatmap, VC-63 ECDF, VC-65 Error bar |
| K5 (hubungan) | VC-66 Scatter, VC-67 Bubble, VC-68 Connected scatter, VC-69 Categorical scatter, VC-70 Hexagonal binning, VC-71 Contour, VC-72 Quadrant, VC-73 Heatmap (matrix) |
| K6 | VC-79 Network diagram, VC-81 Flowchart |
| K7 | VC-84 Tile map |
| K8 | VC-91 Waterfall, VC-94 Gantt, VC-95 Bullet, VC-99 Control chart |
| AP (pasangan salah/benar) | AP-01S/B baseline, AP-02S/B pie vs batang tersusun, AP-03S/B dual-axis, AP-04S/B legenda, AP-05S/B 3-D, AP-06S/B rainbow colormap (12 entri) |
| Warisan | LEGACY-THRESHOLD (memakai `datum_chart_buku.py`, opsional) |

  Hitungan dari `grep`: 61 entri `VC-` + 12 entri `AP-` = 73. `VC-35 Sunburst` sengaja tidak dirender (`pustakachart.py:1677-1680`).

### 3.11 `embed_fonts.py` (248 baris)

- Tujuan (docstring baris 2-3): "langkah font DATUM v2.0.0: probe registry, instal per-user, embed TrueType ke DOCX".
- API: `class FontDefect`, `ensure_fonts(families=None)` (77; hard-fail bila trio Plex tidak terdaftar), `install_fonts(report=print)` (116), `embed_docx(path, subset=True)` (182; Word COM `EmbedTrueTypeFonts`), `verify_embedded(path)` (212), `main(argv)` (222). Konstanta `FONT_DIR = %LOCALAPPDATA%\Microsoft\Windows\Fonts`, `REG_PATH = Software\Microsoft\Windows NT\CurrentVersion\Fonts`, `SRC_DIRS` dua folder fleet (`:44-49`).
- CLI: `python embed_fonts.py check | install | embed <dok.docx>` (`:12-16`).
- Dependensi: stdlib Windows-only (`winreg`, `ctypes`), `win32com.client` (pywin32 311, terpasang). Mengubah registri HKCU dan menyalin font: tidak dijalankan kecuali `check`.
- Eksekusi `check`: `CHECK fonts: PASS trio Plex terdaftar: IBM Plex Serif, IBM Plex Mono, IBM Plex Sans Condensed`, exit 0.

### 3.12 `scripts\datum_lint.py` (938 baris): lint DOCX, 39 cek

- Tujuan (docstring baris 1-21): "instrumen lint berkas DATUM, 39 cek DATUM-01..DATUM-39". Cakupan: `.docx` rilis (kelas "file"); tahap build dan mata dilaporkan `NOT-RUN` dengan nama pemilik.
- CLI: `datum_lint.py <dok.docx>`, `--selftest`, `--allow-register <json>` (hanya DATUM-22); exit 0 bersih, 1 FAIL, 2 salah pakai (`:20-21`, `:916-938`). Tanpa argumen: mencetak docstring, exit 2.
- Format keluaran: baris `DATUM-NN  PASS|FAIL|NOT-RUN|REPORT [tahap] limit=... | detail`, lalu `BANNER:` dan `VERDICT: PASS|FAIL`. Tidak ada flag `--json`.
- Dependensi pihak ketiga: `python-docx` (baris 92). Terpasang.
- Daftar cek (`datum_lint.py:35-75`, `CHECKS = (id, cek, limit, tahap)`):

| ID | Deskripsi (verbatim kode) | Limit | Tahap |
|---|---|---|---|
| DATUM-01 | KPI tile rows, dashboard stat strips | 0 | file |
| DATUM-02 | Filled callout boxes with coloured bars | 0 | file |
| DATUM-03 | Em dashes per 1.000 words; none in headings | 0 | file |
| DATUM-04 | Question-form headings | 0 | file |
| DATUM-05 | Office default faces in output | 0 | file |
| DATUM-06 | Centred cover layouts | 0 | file |
| DATUM-07 | Vertical rules in tables | 0 | file |
| DATUM-08 | Filled table header rows in Word or PDF | 0 | eye |
| DATUM-09 | Data table without a unit column | 0 | file |
| DATUM-10 | Table or figure without SUMBER line | 0 | file |
| DATUM-11 | Load-bearing number without provenance mark | 0 | file |
| DATUM-12 | Decorative colour | 0 | eye |
| DATUM-13 | Rasterised charts | 0 | eye |
| DATUM-14 | Colour values visible on one page | 5 | file |
| DATUM-15 | Body measure in characters | 66-80 | eye |
| DATUM-16 | Value and unit without a space | 0 | file |
| DATUM-17 | ± without a stated meaning | 0 | file |
| DATUM-18 | Wrong classification for the recipient | 0 | file |
| DATUM-19 | VAT other than 11 % for 2026 non-luxury | 0 | file |
| DATUM-20 | Merged cells in a computation zone | 0 | file |
| DATUM-21 | Rules below 0,18 mm or tints below 15 % | 0 | file |
| DATUM-22 | External claim without Admiralty grade | 0 | file |
| DATUM-23 | Rounded corners outside a terminator | 0 | file |
| DATUM-24 | Connector without a label | 0 | build |
| DATUM-25 | Colour values in one figure | 5 | file |
| DATUM-26 | Accented subjects in one figure | 1 | build |
| DATUM-27 | Diagram strokes below 0,18 mm | 0 | file |
| DATUM-28 | Diagram type below 5,5 pt | 0 | file |
| DATUM-29 | Figure without a SUMBER line | 0 | file |
| DATUM-30 | Figure without number or caption | 0 | file |
| DATUM-31 | Mermaid source in a deliverable | 0 | file |
| DATUM-32 | Connector routed through an unrelated box | 0 | build |
| DATUM-33 | Figure taller than the 247 mm text block | 0 | build |
| DATUM-34 | House marks without the published legend | 0 | build |
| DATUM-35 | More than one symbol dialect in a drawing | 0 | build |
| DATUM-36 | Apparatus delegated to the page | report | file |
| DATUM-37 | Composed sheet overflows the A4 page | 0 | build |
| DATUM-38 | Underscore in file, folder or sheet name | 0 | file |
| DATUM-39 | Swallowed token-range residue in published text | 0 | file |

- Eksekusi nyata: `--selftest` pada VENV: `CHECK 2..33: PASS`, `VERDICT: PASS`, exit 0; banner "dijalankan 28 cek file (PASS 27, FAIL 0, REPORT 1); NOT-RUN 11". Lint atas sampel Rev L: 28 cek file dijalankan, `PASS 21, FAIL 6, REPORT 1`, `VERDICT: FAIL`, exit 1 (FAIL pada DATUM-03, 05, 07, 10, 14, 17).

### 3.13 `scripts\datumbuku.py` (713 baris): lint XLSX, 23 cek W

- Tujuan (docstring baris 3): "lint workbook DATUM: 23 cek W01..W23 atas berkas .xlsx".
- CLI (`--help` nyata): `datumbuku [-h] [--json] [--silent] [--selftest] [berkas]`; exit 0 bersih, 1 temuan penahan, 2 tak terbaca; W19 hanya peringatan (`WARN_ONLY = {"W19"}`, baris 71).
- Dependensi: `openpyxl` (baris 35-36). Terpasang. Keluaran: tabel teks atau JSON (`--json`).
- Daftar cek (`datumbuku.py:45-68`, kolom ketiga = kode butir manual `BK-nn`):

| ID | Deskripsi | Butir manual |
|---|---|---|
| W01 | Wajah huruf di luar IBM Plex | BK-21 |
| W02 | Konstanta di luar MASUKAN dan AHS | BK-02 |
| W03 | Literal angka di dalam rumus | BK-53 |
| W04 | Warna angka tidak sesuai asalnya | BK-31 |
| W05 | Warna pada format angka | BK-44 |
| W06 | Fungsi terlarang atau penutup galat | BK-52 |
| W07 | Rujukan lembar tanpa tanda kutip | BK-14 |
| W08 | Sel gabungan | BK-38 |
| W09 | Lembar, baris atau kolom tersembunyi | BK-38 |
| W10 | Tautan ke berkas luar | BK-66 |
| W11 | Nama terdefinisi di luar pola Kelompok.Nama | BK-13 |
| W12 | Bendera induk atau panel beku tidak sesuai | BK-36 |
| W13 | Pengaturan cetak tidak lengkap | BK-61 |
| W14 | Persen tanpa spasi | BK-43 |
| W15 | Isian sel selain baris kepala | BK-32 |
| W16 | Komentar sel | BK-66 |
| W17 | Terbilang diketik tangan | BK-57 |
| W18 | Uji KENDALI tanpa rujukan | BK-92 |
| W19 | Masukan tanpa validasi data (peringatan) | BK-65 |
| W20 | Properti berkas tidak lengkap | BK-63 |
| W21 | Nama lembar di luar pola | BK-12 |
| W22 | Tebal sintetis pada Plex | BK-24 |
| W23 | Nilai tembolok rumus kosong | BK-59 |

- Eksekusi nyata `--selftest`: semua `CHECK W01..W23`, `W19-peringatan`, `berkas-rusak` PASS; `VERDICT: PASS`, exit 0.

### 3.14 Selftest yang TIDAK dijalankan

`selftest_datum_diagram.py` menulis ke `HS\_st_diag_tmp` lalu `shutil.rmtree` (`:39-41`, `:541`); `selftest_builder.py` menyimpan berkas dan meluncurkan Word COM lewat skrip sementara di `%LOCALAPPDATA%\Temp\selftest_rail_t_fcdd32ac` (`:283-302`); `selftest_datumbind.py:93` dan `selftest_chip_para.py:123` menyimpan `.docx`. Keempatnya dilewati karena menulis ke folder skill atau luar folder kerja.

---

## 4. Garis B: inventaris per skrip (`RL\scripts`)

### 4.1 `datum_diagram.py` (2098 baris)

- Tujuan (docstring baris 2-4): "DATUM diagram engine — GSP House Style v1.9 (GSP-DS-001). Turns a declarative JSON spec into a DATUM-compliant technical diagram as SVG."
- CLI (`main`, baris 2045-2090): `datum_diagram.py [spec|-] [-o OUT] [--png PNG] [--schema] [--selftest] [--check]`. `spec` boleh `-` (stdin). `--selftest -o <dir>` menulis satu SVG per keluarga dari `_samples()`. `--png` memakai `to_png` (baris 2031): `rsvg-convert`, lalu `inkscape`, lalu `cairosvg`.
- API (fungsi tingkat atas): `load_tokens` (59), `snap/snap_down/snap_up`, `text_w`, `wrap_balanced`, `wrap`, `class Node/Edge/Diagram` (dataclass), `layout_layered/flow/swimlane/sequence/sld/rack/graph` (502-810), `fit_page`, `route`, `avoid_obstacles`, `validate(spec)` (1750), `build(spec)` (1814; mengembalikan `(Diagram, svg)`), `check(svg, spec, d)`, `to_png`, `main`.
- Keluaran: SVG (mm). Dependensi: stdlib + `datum_symbols` (impor opsional, baris 36-39) + `cairosvg` (opsional, baris 2038). `cairosvg` paket terpasang tetapi gagal diimpor (`OSError: no library called "cairo-2" was found`; keluaran probe impor).
- Keluarga (`--schema`): `layered | topology | stack | flow | swimlane | sequence | sld | rack | graph` (9).
- Bentuk (`--schema`): box, stadium, diamond, parallelogram, cylinder, hexagon, doubled, shadowed, circle, bus, sym-block (11). Jenis edge: data, control, sync, accent, alert, verify.
- Skema (`datum_diagram.py:1833-1875`, keluaran `--schema` nyata) berbeda dari garis A: kunci rata `tier`/`lane`/`col`/`row` pada simpul (bukan `class{}`), blok `tiers[]`, `lanes[]`, `actors[]` (sequence), `messages[]` (sequence), `boundaries[]` (bukan `zones`), `legend` sebagai list objek `{symbol,label}`, bidang `provenance`, `lang`, `dir` (TB|LR), `max_accents`, simpul `symbol`, `desig` (IEC 81346), `u`, `size`.

Kutipan skema `--schema` (verbatim):

```
{
  "family":   "layered | topology | stack | flow | swimlane | sequence | sld | rack | graph",
  "id":       "3.1",                     figure number, chapter-prefixed
  "title":    "one sentence, ends with a full stop",
  "source":   "document + clause the drawing was built from",
  "provenance": "topologi [DITURUNKAN] · kapasitas [PEMASOK, keandalan B2]",
  "lang":     "id | en",
  "width_mm": 166,                       128 for text-column width, 166 for full span
  "dir":      "TB | LR",                 flow and sld only
  "per_row":  3,                          flow only
  "max_accents": 1,
  "tiers":  [ {"id":"edge","label":"TINGKAT 1 · POLSEK","note":"1.847 lokasi"} ],
  "lanes":  [ {"id":"penyidik","label":"PENYIDIK"} ],
  "actors": [ {"id":"ue","label":"Perangkat","sub":"UE"} ],          sequence only
  "nodes": [
    {"id":"cam", "label":"Ruang Pemeriksaan", "sub":"2 kamera · 1 mik",
     "tier":"edge", "lane":"penyidik", "col":0, "row":0,
     "shape":"box | stadium | diamond | parallelogram | cylinder | hexagon | doubled | shadowed | circle | bus | sym-block",
     "mark":"TERUKUR | DITURUNKAN | PEMASOK | ASUMSI",
     "tag":"REQ-CAP-01", "accent":false,
     "u":12, "size":2}                                              rack only
  ],
  "edges": [ {"from":"cam","to":"nvr","label":"H.265 · 4 Mbps", "kind":"data | control | sync | accent | alert | verify"} ],
  "messages": [ {"from":"ue","to":"bts","label":"Attach Request","kind":"data"} ],
  "boundaries": [ {"label":"ZONA TEPERCAYA POLDA","nodes":["nvr","idx"]} ],
  "legend":     [ {"symbol":"data","label":"aliran bukti"}, {"symbol":"control","label":"kendali"}, {"symbol":"DITURUNKAN","label":"nilai turunan"} ]
}
```

Contoh spek lengkap, keluarga `layered` (verbatim `RL\scripts\datum_diagram.py:1879-1913`, fungsi `_samples()`):

```json
{"family": "layered", "id": "4.1",
 "title": "Arsitektur federasi bukti digital empat tingkat.",
 "source": "Kajian Teknis 004/GSP/KT/VIII/2026 §4.2",
 "provenance": "topologi [DITURUNKAN] · kapasitas tautan [PEMASOK, keandalan B2]",
 "tiers": [{"id": "t1", "label": "TINGKAT 1 · POLSEK", "note": "1.847 lokasi"},
           {"id": "t2", "label": "TINGKAT 2 · POLRES", "note": "514 lokasi"},
           {"id": "t3", "label": "TINGKAT 3 · POLDA", "note": "34 lokasi"},
           {"id": "t4", "label": "TINGKAT 4 · MABES", "note": "1 lokasi"}],
 "nodes": [{"id": "ruang", "label": "Ruang Pemeriksaan", "sub": "2 kamera · 1 mik", "tier": "t1", "mark": "TERUKUR", "tag": "REQ-CAP-01"},
           {"id": "gw", "label": "Gerbang Kriptografi", "sub": "AES-256", "tier": "t1", "tag": "REQ-SEC-03"},
           {"id": "nvr", "label": "Simpan Bukti", "sub": "48 TB · RAID 6", "tier": "t2", "mark": "DITURUNKAN"},
           {"id": "idx", "label": "Indeks Kustodi", "sub": "SHA-256", "tier": "t2", "accent": true, "tag": "REQ-INT-01"},
           {"id": "asr", "label": "Transkripsi Otomatis", "sub": "GPU L40S", "tier": "t3", "mark": "PEMASOK"},
           {"id": "arsip", "label": "Arsip Polda", "shape": "cylinder", "tier": "t3"},
           {"id": "pusat", "label": "Simpul Nasional", "sub": "replikasi 3×", "tier": "t4", "mark": "DITURUNKAN"}],
 "edges": [{"from": "ruang", "to": "gw", "label": "H.265 · 4 Mbps"},
           {"from": "gw", "to": "nvr", "label": "TLS 1.3", "kind": "data"},
           {"from": "gw", "to": "idx", "label": "cap waktu", "kind": "accent"},
           {"from": "nvr", "to": "asr", "label": "antrean kerja"},
           {"from": "idx", "to": "arsip", "label": "manifes", "kind": "control"},
           {"from": "asr", "to": "pusat", "label": "transkrip"},
           {"from": "arsip", "to": "pusat", "label": "replikasi", "kind": "sync"}],
 "boundaries": [{"label": "ZONA TEPERCAYA POLDA", "nodes": ["asr", "arsip"]}],
 "legend": [{"symbol": "data", "label": "aliran bukti"}, {"symbol": "control", "label": "kendali"},
            {"symbol": "sync", "label": "replikasi"}, {"symbol": "DITURUNKAN", "label": "nilai turunan"}]}
```

(Dikutip dengan format kompak; isi sama dengan sumber.) Sampel keluarga lain di `_samples()` (baris 1878-2028): `flow` (baris ~1914, memakai `dir`, `per_row`, bentuk stadium/diamond/parallelogram/cylinder), `swimlane` (`lanes`, `lane`, `col`), `sequence` (`actors`, `messages`), `sld` (`dir`, simpul `bus`), serta `rack`, `graph`, `stack`/`topology` (keluaran di `_samples()`; tidak dikutip semua).

- Spec contract dengan PRISMA: `RL\references\08-skema-diagram.md:18-20` (alur `PRISMA Gate 0-5 -> diagram-spec.json -> datum_diagram.py -> SVG -> lint DATUM`), tabel bidang minimum baris 29-44; envelope fields (`classification`, `notes[]`, `sources[]`, `labels_verified`) "the engine carries without complaint and does not draw them" (`08-skema-diagram.md:46-50`).
- Aturan validasi (`validate`, `:1750-1811`): family dikenal, id simpul unik, edge/boundary merujuk simpul ada, simbol dikenal dan satu dialek per gambar, `desig` sesuai pola IEC 81346. Penolakan memakai `SystemExit` dengan daftar masalah.

### 4.2 `datumchart.py` (296 baris): chart bersumbu, JSON ke SVG

- Tujuan (docstring baris 3-9, 12-25): "DATUM chart engine. Figures with an AXIS." Keluarga: `bar`, `column`, `threshold` (3 saja). Mencerminkan kontrak engine diagram.
- API: `class ChartDefect`, `fmt(v, dec=0)`, `esc`, `tinggi(spec)` (73), `periksa(spec)` (93), `render(spec)` (135), `main(argv=None)` (268).
- CLI (`main`, baris 268-292): `datumchart.py [spec|-] [-o OUT] [--estimate] [--schema]`. `spec` `-` membaca stdin. Tanpa `-o` SVG dicetak ke stdout.
- Keluaran: SVG. Dependensi: stdlib saja (`json, sys, argparse, math`). Palet heks dituliskan literal di kode (`datumchart.py:46-51`: `INK900 '#101418'` ... `VERD '#2F6F6B'`, `STRUCT = 'IBM Plex Sans Condensed'`), bukan dibaca dari tokens.json.
- Cek (`periksa`, baris 93-123; kode G1, G2, G4, G5, N1, 10, 33, 36): lebar 128/166 (toleransi 1.5), tanpa garis bawah pada id/title, `source` wajib, `apparatus figure` tidak boleh bersama `in_document`, `data` tidak kosong, maks 1 `accent`, tiap titik punya `label` dan `value`, tinggi perkiraan <= 247 mm, `threshold` wajib `limit`.
- Skema masukan (keluaran `--schema`):

```
{
  "family":    "bar | column | threshold",
  "id":        "Gambar 2.1",           word, space, number
  "title":     "one sentence, ends with a full stop",
  "source":    "document + clause the values were read from",
  "width_mm":  128,                    128 text column | 166 full span
  "unit":      "W",
  "dec":       1,
  "limit":     100.0,                  threshold family only
  "limit_label": "BATAS ETHERNET",
  "apparatus": "page",                 default. "figure" only for a standalone SVG.
  "in_document": true,
  "note":      "footline inside the figure, optional",
  "data": [ {"label":"C-01", "value":60.0, "accent":false, "sub":"PTZ"} ]
}
```

- Katalog 58 jenis chart ada sebagai dokumen (`RL\references\10-chart.md:262-351`, bagian 8.2), tetapi engine yang menggambar hanya 3 keluarga; `tokens.json` `chart.families_engine = ["bar","column","threshold"]`.

### 4.3 `datumplot.py` (186 baris)

- Tujuan (docstring baris 3-30): "gaya DATUM untuk matplotlib ... Modul ini tidak menggambar chart untuk Anda. Ia memasang bentuk DATUM pada matplotlib dan menulis SVG yang bisa dibaca lint".
- API: `terapkan()` (69), `kanvas(lebar_mm=128, tinggi_mm=70, **kw)` (100), `label_ujung(ax, x, y, teks, aksen=True, **kw)` (119), `label_nilai(ax, x, y, v, dec=0, **kw)` (125), `simpan(fig, path, caption, sumber, apparatus='page')` (131), `angka(v, dec=0)` (63), `WARNA` (dict).
- Keluaran: SVG berteks nyata + penanda `DATUM-APPARATUS-REQUIRED`. Dependensi: `matplotlib` (lazy). Membaca `RL\tokens.json` (baris 36-37) dan `assets\fonts`.

### 4.4 `datum_render.py` (255 baris): SVG ke PNG/PDF dan cek lembar A4

- Tujuan (docstring baris 2-24): "DATUM SVG renderer ... renders at a stated DPI, preserving the millimetre dimensions declared on the SVG root". Urutan renderer: rsvg-convert, Inkscape, cairosvg, headless Chromium (baris 22-24).
- API: `svg_size_mm(path)` (36), `which(cmd)` (51; memakai `subprocess.call(["which", cmd])`), `render_png(src, dst, dpi)` (56), `_chromium_png` (82), `render_pdf(src, dst)` (114), `check_page(html_path, w_mm=210.0, h_mm=297.0)` (153), `main()` (203).
- CLI: `datum_render.py <svg...> [-o OUT] [--outdir DIR] [--dpi N (default 300)] [--pdf OUT.pdf] [--check-page]`. `--check-page` menerima HTML dengan elemen `.page`, `.body`, `.reg` dan melaporkan overflow dengan label "LINT 37".
- Dependensi: `playwright` (1.62.0 terpasang; Chromium 1234 diharapkan oleh paket, `ms-playwright\chromium-1234` ada), `cairosvg` (terpasang tetapi libcairo tidak ada), binari `rsvg-convert`/`inkscape` (tidak ada di PATH, bagian 11).
- Eksekusi nyata: `datum_render.py good_layered.svg -o <scratchpad>\good_layered.png --dpi 300` gagal: `chromium render failed: Page.goto: net::ERR_FILE_NOT_FOUND at file:///C:/Users/.../good_layered.png.render.html` lalu `no SVG renderer available`, exit 2. Probe terpisah: `page.goto(<file:// URI berkas di scratchpad>)` juga `ERR_FILE_NOT_FOUND`, sedangkan `page.set_content(<SVG inline>)` + screenshot berhasil (17607 byte PNG; `document.fonts.check` untuk "IBM Plex Sans Condensed" dan "IBM Plex Mono" = true; Chromium 151.0.7922.34). Penyebab kegagalan `file://`: tidak ditentukan (hipotesis: pembatasan tampilan filesystem pada sesi sandbox; tidak diverifikasi).

### 4.5 `datum_symbols.py` (663 baris)

- Tujuan (docstring baris 2-31): "DATUM standards symbol library ... Four libraries: iec:* (IEC 60617 DB), isa:* (ANSI/ISA-5.1-2024), sec:* (GSP project legend), mil:* (MIL-STD-2525E)".
- API: `canonical(sym_id)` (564), `resolve(sym_id)` (569), `dialect(sym_id)` (573), `render(sym_id, x, y, w, h, colour='#101418', sw=0.3, echelon=None)` (577; mengembalikan `(svg_string, ports_in_mm)`), `sheet(path='datum_symbols.svg', width=166.0)` (593), `main()` (629); `class Box`.
- CLI: `--list`, `--sheet symbols.svg`, `--check iec:breaker`.
- Daftar: 41 simbol, identik dengan `HS\datumsimbol.py` (iec 16, isa 12, sec 7, mil 6; keluaran `--list`), dengan metadata standar per simbol. Dependensi: stdlib. Keluaran: SVG. `ports_in_mm` (terminal sambungan) hanya ada di garis B.

### 4.6 `datum_docx.py`, `datum_xlsx.py`, `datum_pptx.py` (garis B)

- Berbentuk skrip pembangun yang menyusun satu dokumen contoh pada tingkat modul, bukan kelas pustaka: `RL\scripts\datum_docx.py:1-4` ("DATUM v1.9 — Word report builder"); konstanta `DOC_ID, REV, REV_DATE, CLASS, NPAGES = '005/GSP/KT/VIII/2026', 'B', '01-VIII-2026', 'RAHASIA', 6` (baris 32); keluaran ke `OUT = os.environ.get('DATUM_OUT', os.getcwd())` (baris 20); aset logo dan garis dari `RL\assets` (baris 143, 150, 264) dengan nama `GSP DATUM Contoh Laporan Teknis.docx` (baris 454-457); fon ditanam lewat `embed_fonts.embed` (baris 454). Fungsi pembantu yang ada: `h1`, `h2`, `h3`, `block`, `derivation`, `figure(fid, caption, png, width_mm=128, source='', provenance='')`, `datatable(tid, caption, head, widths, rows, total=None, source='')`. Tidak ada `if __name__`.
- `datum_xlsx.py` (docstring baris 2-3): "workbook builder. FAST / ICAEW / Operis discipline, Permen PUPR No. 8 Tahun 2023 AHS structure, PPN 11 % on the recapitulation sheet only"; `DOC_ID = '008/GSP/RAB/VIII/2026'`; `datum_pptx.py`: "command-brief builder. 16:9"; tema gelap via `DATUM_BRIEF=gelap` (baris 3, 23); `DOC_ID` baris 26 (xlsx) dan 34 (pptx).
- Dependensi: python-docx, openpyxl, python-pptx (terpasang).

### 4.7 `embed_fonts.py` (138 baris, garis B)

- Docstring baris 2-8: "Embed TrueType fonts into an OOXML file (.docx / .pptx) using the MS obfuscated-font (.odttf) scheme". API: `obfuscate(data: bytes, guid: str) -> bytes` (24), `embed(path_in, path_out, families)` (32; `families = {'IBM Plex Serif': {'Regular': ttf, 'Bold': ttf, 'Italic': ttf, 'BoldItalic': ttf}, ...}`). Dependensi: `lxml` (6.1.2, terpasang), stdlib `zipfile`. Tidak memakai Word COM. Mendukung `.docx` dan `.pptx` (`part = 'word' if ... else 'ppt'`, baris 36-37).

### 4.8 `datum_lint.py` (496 baris, garis B)

- Docstring baris 2-9: "DATUM de-tell lint ... Accepts .docx .xlsx .pptx .svg .md .html .txt" (fungsi `lint_docx`, `lint_xlsx`, `lint_pptx`, `lint_text`, `lint_svg`, `lint_pdf`, `check_mermaid`). Exit 0 bersih, 1 ada cek gagal, 2 tak terbaca/tak didukung. Inventaris cek: `FILE_LINT_CHECKS` 27 ID, `BUILD_TIME_CHECKS` 7, `HUMAN_EYE_CHECKS` 4, total 38 (`:35-47`). Daftar 38 cek dengan limit ada di `RL\tokens.json` kunci `lint` (38 objek `{id, check, max}`; contoh `{"id": 3, "check": "em-dashes per 1000 words", "max": 3, "and": "0 in headings"}`, `{"id": 15, ..., "range": [66, 80]}`); padanan tabel 3.12 dengan perbedaan: DATUM-03 limit 3 (garis A: 0), tanpa DATUM-39 (38 cek), dan teks deskripsi berbeda (bahasa Inggris huruf kecil).

### 4.9 Skrip lain garis B

| Skrip | Tujuan (kutipan docstring) | Masukan | Keluaran |
|---|---|---|---|
| `datum_figma_audit.py` (193) | "DATUM Figma drift audit ... diffs that tree against the spec the drawing was built from" (`:2-40`) | `spec.json metadata.xml [--quiet]` | teks; exit code |
| `datumcheck.py` (206) | "guard rails that fire at authoring time" (`:3-35`); API `heading, prose, table, nama, figure, pohon, plan`; kelas `DatumDefect` | argumen panggilan; batch `datumcheck.py rencana.json` | pesan, exit code |
| `datumbind.py` (278) | sama dengan garis A (register, derivasi) | register JSON | teks |
| `ujicepat.py` (293) | "tes cepat integrasi DATUM v1.9 Rev L" 3 lapis (A SKILL.md, B paket, C mesin) | `[folder-skill]` | teks, exit code |
| `datum_chat_lint.py` (126) | "§0 register percakapan" ukur balasan chat (rata-rata kalimat <= 18 kata dst.) | `reply.md` atau `--stdin` | teks, exit 1 bila melanggar aturan mutlak |

---

## 5. Online Resources / External Research Findings

Tidak ada riset eksternal yang dilakukan (tidak dalam lingkup; dimensi 1 sampai 7 dicatat di bagian 12). Satu-satunya akses jaringan: tidak ada.

---

## 6. Code Context (potongan penting dengan nomor baris)

### 6.1 Konstruksi dokumen: pola panggil `DatumDocx` (`HS\datum_docx.py:18-27`)

```python
from datum_docx import DatumDocx
D = DatumDocx(title="...", doc_no="00X/GSP-STD-X-2026", rev="A", ...)
D.cover(); D.start_interior()
D.heading("Judul pernyataan", level=1); D.para("prosa **tebal** `mono` https://tautan")
D.table(rows, source="SUMBER ...", widths_mm=[40, 88])
D.derivation(d)          # d = datumbind.Derivation yang sudah build()
D.save("out.docx")       # guard N1 nama berkas + updateFields + properti inti
```

Catatan kode: `DatumDocx.__init__` memanggil `DC.name_guard(doc_no)` (baris 349): `doc_no` dengan garis bawah memicu `CheckDefect`. `heading()` memanggil `DC.check_heading(text)` (baris 514): judul berbentuk pertanyaan (awalan apa/siapa/kapan/di mana/bagaimana/mengapa/kenapa/apakah, `datumcheck.py:60`) ditolak.

### 6.2 Rantai Register/Derivation (`HS\datumbind.py:35-45` docstring)

```python
N = Register('model/quantities.json')
d = Derivation('Turunan D-03 · Ruang nilai yang terbuka', N)
d.line('nilai basis terkendali', 'nilai basis')
d.result('ruang nilai yang terbuka', 'nilai basis - nilai skenario', 'ruang nilai')
```

### 6.3 Penolakan Mermaid (`HS\datum_diagram.py:251-262`)

`MERMAID_TELL = ("```mermaid", "graph TD", "graph LR", "flowchart TD", "flowchart LR", "sequenceDiagram", "stateDiagram")`; `load_spec` menolak ekstensi `.mmd/.mermaid` dan teks mengandung salah satu penanda dengan `DiagramDefect("DATUM-31: sumber Mermaid ...")`.

### 6.4 Guard resolusi gambar (`HS\datumcheck.py:245-266`)

`px_guard(image_path, w_mm)` membaca ukuran piksel via Pillow dan menolak sumber di bawah 150 dpi efektif pada lebar tempel `w_mm`.

---

## 7. Pustaka dan galeri: jenis chart dan keluarga

### 7.1 Garis A

- Diagram (SVG): 9 keluarga, 10 bentuk, 6 jenis konektor (bagian 3.7).
- Chart (PNG, galeri tetap, bukan data pengguna): 61 entri VC + 12 entri AP + 1 warisan (bagian 3.10).
- Simbol (SVG): 41 simbol 4 dialek (bagian 3.9).
- Tidak ada engine chart yang menerima data JSON pengguna di garis A. Hasil `grep` fungsi: `pustakachart.py` hanya punya `main()` dengan `--out`/`--check-min-pt`; data dari modul `pustakachart_data.py`.

### 7.2 Garis B

- Diagram: 9 keluarga (bagian 4.1).
- Chart berbasis spek JSON: 3 keluarga (`bar`, `column`, `threshold`) via `datumchart.py`.
- Chart lain: tema matplotlib (`datumplot.py`) untuk 55 jenis sisanya (`datumplot.py:5-10`).
- Katalog dokumen 58 jenis (`RL\references\10-chart.md:262-351`): P-01..P-15 (Bar urut, Column, Grouped column, Lollipop, Dot plot, Dumbbell, Range plot, Slope, Bullet, Waterfall, Threshold, Small multiples, Quadrant, Arrow chart, Table chart); H-01..H-09 (Scatter, Bubble, Heatmap, Connected scatter, Hexbin, Contour, Network, Arc diagram, Venn atau Euler); K-01..K-12 (Stacked bar, 100 % stacked bar, Diverging bar, Population pyramid, Donut, Pie, Waffle, Icon array, Treemap, Funnel, Sankey, Marimekko); W-01..W-10 (Line, Column waktu, Step line, Area, Stacked area, Bump, Gantt, Barcode, Horizon, Candlestick); S-01..S-08 (Histogram, Box plot, Density, Violin, Ridgeline, Strip atau jitter, Beeswarm, Radial histogram); G-01..G-04 (Tile map, Dot map, Flow map, Flowchart). `RL\tokens.json` `chart.catalogue_codes`: "P-01..P-15, H-01..H-09, K-01..K-12, W-01..W-10, S-01..S-08, G-01..G-04".

---

## 8. Token garis B (`RL\tokens.json`)

- 1038 baris, 24 kunci teratas, 675 daun (skrip pembaca JSON). Kunci dan jumlah daun: `$schema` 1, `name` 1, `version` 1, `owner` 1, `custodian` 1, `issued` 1, `colour` 39 (wrapper, interior, brief, base_default, ground_policy, workbook, rules), `type` 80 (pdf_stack, office_stack, forbidden, baseline_pt, scale_pt, tracking, symbol_face), `grid` 18 (page, margin_mm, text_col_mm, gutter_mm, rail_mm, body_top_mm, body_bottom_mm, full_span_mm, subcolumns, subcolumn_pitch_mm, measure_chars, check), `rules_mm` 6, `signature_devices` 45 (datum_rule, evidence_rail, register_block, seal_band, spine_string, issue_stamp, datum_rule_progress_gauge, register_block_spacing), `provenance` 51 (marks, admiralty, estimative_language, rule), `classification` 29 (WARNING, schemes, marking, distribution_axis), `table` 15, `figure` 18, `diagram` 146 (engine, renderer, families, unit_note, node, gap, tier, stroke, arrow, route, edge_kinds, type, boundary, legend), `sparkline` 8, `units` 14, `workbook` 54, `brief` 13, `lint` 116 (list 38 objek), `revision` 1, `issued_rev_k` 1, `chart` 15.
- Perbedaan nama kunci terhadap garis A: `grid` (A: `grid_mm`), `text_col_mm`/`full_span_mm` (A: `text_column`/`full_span`), `rules_mm.strong/mid/hair/min_for_photocopy` (A: `primary/below_header/hair/photocopy_floor`).
- Garis B menyertakan fallback heks literal di kode (`datum_diagram.py:45-57` `_FALLBACK`; `datumchart.py:46-48`).

---

## 9. Dokumen referensi dan skill saudara

### 9.1 `HS\SKILL.md` (608 baris)

- Frontmatter: `name: datum-house-style`, `version: 2.6.0`, deskripsi "Bangun/lint dokumen standar DATUM: token gaya tunggal, register angka datumbind, lint 39+23 cek, builder docx/xlsx/pptx, audit+embed font, pustaka chart+simbol, baris figur ENH-E" (`SKILL.md:1-11`).
- Tabel "DAFTAR INSTRUMEN" 13 instrumen: `SKILL.md:62-83` (tokens.json, datumbind, datum_lint, datumbuku, datum_diagram, datum_docx, datum_xlsx, datum_pptx, datumcheck, embed_fonts, pustakachart, datumsimbol, datum_figur).
- Moda tata letak interior (RAIL-1008): `SKILL.md:36-60` (Moda A kolom 128 mm + rail 32 mm bila ada provenans per paragraf; Moda B teks 166 mm).
- Kompatibilitas gerbang naturalisasi: `SKILL.md:100-126`; token register tidak mendukung rentang: `SKILL.md:128-143`.
- Perintah eksekusi: `SKILL.md:520-551`; pitfalls: `SKILL.md:560-589` (Word COM `ReadOnly=True` gagal `ExportAsFixedFormat`; hapus PDF target sebelum ekspor ulang; IBM Plex tidak terpasang default; glif ■◈◇△ tanpa glyph di Plex; `w:updateFields` dibuang Word saat embed).
- Lokasi: kanonik `C:/Users/TRIAL/workspace/gsp-hermes/skills/datum-house-style/` dan registry fleet (`SKILL.md:511-518`); "Profil pekerja TIDAK memegang salinan fisik (kebijakan LEAN FLEET 29-08)".

### 9.2 Referensi garis B (`RL\references`, baris dari `wc -l`)

01-kepatuhan-klasifikasi (205), 02-grid-tipografi (185), 03-tabel-gambar-apparatus (209), 04-workbook (136), 05-command-brief (118), 06-lint (139), 07-ekosistem-routing (315), 08-skema-diagram (467), 09-simbol-standar (471), 10-chart (487), 11-gaya-bahasa (459), 12-rekonsiliasi-gerbang (494), 13-bahasa-percakapan (306).

### 9.3 Skill saudara yang diminta: ARSIP, LOKUS, KRONIK, veritas, PRISMA (gsp-visual-commander)

Hasil pencarian: TIDAK ditemukan sebagai skill/folder berdiri sendiri di `C:\Users\TRIAL\AppData\Local\hermes\skills`, `...\profiles\*\skills`, `C:\Users\TRIAL\workspace\gsp-hermes\skills`, `C:\Users\TRIAL\.claude\skills`, `C:\Users\TRIAL\.agents\skills`, `C:\Users\TRIAL\gsp-agent`. Satu-satunya `SKILL.md` ber-`name:` berawalan "prisma" adalah skill pustaka ORM Prisma (`prisma-expert`, `prisma-cli`, dst.), tidak terkait. Nama-nama itu hanya muncul sebagai rujukan teks di `RL`:

| Nama | Bukti rujukan |
|---|---|
| LOKUS (`gsp-output-locality`, `GSP-OL-001`) | `RL\SKILL.md:11-17` "Tempat setiap artefak mendarat dipegang `gsp-output-locality` (LOKUS, `GSP-OL-001`) ... `SendUserFile` ... `device_commit_files`" |
| ARSIP (`arsip`, `GSP-AR-001`) | `RL\SKILL.md:19-26` "Setiap berkas terbit mengambil nomornya dari Register Induk sebelum dibangun, memakai nama `<Judul> <nomor> Rev<X>.<ext>` tanpa garis bawah"; `RL\SKILL.md:528` "Document type codes come from ARSIP's closed list; `DS` is retired" |
| KRONIK (`kronik`) | `RL\SKILL.md:750-755` ("KRONIK owns ... if the KRONIK plugin is installed"); `RL\SKILL.md:950` "KRONIK (SHA-256)" |
| veritas | `RL\SKILL.md:737` "certifies the numbers DATUM labels"; `RL\references\07-ekosistem-routing.md:247` |
| PRISMA (`gsp-visual-commander`) | `RL\SKILL.md:732-733`; `RL\references\07-ekosistem-routing.md:99-115`; `HS\datum_diagram.py:173` ("dipilih PRISMA, bukan DATUM"); `RL\references\07-ekosistem-routing.md:148` mencatat `gsp-visual-commander` berstatus rebuild dengan 54 berkas (tanda centang di sumber tidak disalin) |

Satu-satunya berkas non-referensi yang memuat `GSP-AR-001`/`GSP-OL-001` di luar `datum-revl` adalah `C:\Users\TRIAL\AppData\Local\hermes\skills\gsp\gsp-report-format\templates\gsp_lib.py` (hasil `grep`; isi tidak dibaca lebih lanjut).

### 9.4 Skill terkait dokumen yang ADA di `C:\Users\TRIAL\AppData\Local\hermes\skills\gsp\`

`create-deck-gsp` (deskripsi: "deck presentasi Imagegen 3.0 no-edit"), `create-image-gsp`, `gsp-docx-business-report`, `gsp-word-report-deliverable`, `gsp-report-format`, `gsp-doc-to-executive-deck`, `gsp-comfyui-slide-stack` (skrip `build_deck.py`, `build_deck_html.py`, `make_chart.py`, `render_textured.py`, ComfyUI workflows), `gsp-doc-layout-gates`, `gsp-doc-layout-verification` (`scripts\tcw_probe.py`), `gsp-document-quality-standards`, `gsp-document-style-audit`, `gsp-long-document-assembly`, `gsp-canvas-design`, `gsp-image-enhancer`. Hanya daftar; isi tidak diinventaris.

---

## 10. Fon

### 10.1 Terpasang di host (per-user)

- Folder `C:\Users\TRIAL\AppData\Local\Microsoft\Windows\Fonts\` (keluaran `ls`): 12 berkas IBM Plex: `IBMPlexMono-Bold.ttf` (136008 B), `IBMPlexMono-Regular.ttf` (23976), `IBMPlexSans-Regular.ttf` (200500), `IBMPlexSans-SemiBold.ttf` (46228), `IBMPlexSansCond-Regular.ttf` (36556), `IBMPlexSansCondensed-Bold.ttf` (112228), `IBMPlexSerif-Bold.ttf` (161000), `IBMPlexSerif-BoldItalic.ttf` (169840), `IBMPlexSerif-Italic.ttf` (170004), `IBMPlexSerif-Regular.ttf` (160380), `IBMPlexSerif-SemiBold.ttf` (222876), `IBMPlexSerif-SemiBoldItalic.ttf` (232112). Fon lain di folder itu: `NotoEmoji-Regular-static.ttf`, `NotoSansMath-Regular.ttf`, `NotoSansSC-Regular.ttf`, `NotoSansSymbols2-Regular.ttf`.
- Registri HKCU `Software\Microsoft\Windows NT\CurrentVersion\Fonts` (probe `winreg`): entri nama-wajah untuk Serif Regular/Bold/Italic/Bold Italic, Sans Condensed Regular/Bold, Mono Regular/Bold, Sans SemiBold (nama format `IBM Plex <Family> <Style> (TrueType)`), plus tiga entri path-penuh (`IBMPlexSans (Regular)`, `IBMPlexSerif (SemiBold)`, `IBMPlexSerif (SemiBoldItalic)`). HKLM: tidak ada entri Plex.
- `C:\Windows\Fonts`: tidak ada berkas bernama Plex (`ls | grep -i plex` hanya `complex_.ttf`, `simplex_.ttf`).
- Nama internal tabel `name` (fontTools): `IBMPlexSerif-SemiBold.ttf` dan `-SemiBoldItalic.ttf` terpasang berfamili `IBM Plex Serif SmBld` (ID 1) dengan ID 16 `IBM Plex Serif`/ID 17 `SemiBold`; `IBMPlexSans-SemiBold.ttf` berfamili `IBM Plex Sans SemiBold`; `IBMPlexMono-Regular.ttf` (280 glyph) dan `IBMPlexMono-Bold.ttf` (1028 glyph) berbeda ukuran glyph set. Tidak terpasang: IBM Plex Sans Condensed SemiBold, IBM Plex Mono SemiBold, Plex Sans Italic/SemiBoldItalic.
- Dasar token garis A memakai `IBM Plex Sans Condensed` bobot 400 dan 600 (`tokens.json:54`); yang terpasang untuk wajah itu: Regular dan Bold (bobot 400 dan 700).

### 10.2 Sumber berkas fon

| Lokasi | Isi |
|---|---|
| `RL\assets\fonts\` (juga di `RLW`) | 16 ttf Plex: Mono (Italic, Regular, SemiBold, SemiBoldItalic), Sans (Italic, Regular, SemiBold, SemiBoldItalic), SansCond (Italic, Regular, SemiBold, SemiBoldItalic), Serif (Italic, Regular, SemiBold, SemiBoldItalic) + `DejaVuSans.ttf` (759720 B) + `PASANG-DULU.txt` ("lisensi SIL Open Font, bebas dipakai komersial"; berkas `.docx` contoh "sudah ditanam"; xlsx/pptx butuh fon dipasang). Glyph set 263-270 per berkas (fontTools). |
| `C:\Users\TRIAL\workspace\EXPO [2026]\Font_DATUM\` | 6 ttf (Mono Regular/SemiBold, Sans Regular/SemiBold, SansCond Regular/SemiBold) + `PASANG-DULU.txt` (413 B) |
| `C:\Users\TRIAL\workspace\gsp-hermes\skills\gsp-canvas-design\canvas-fonts\` (juga `C:\Users\TRIAL\.agents\skills\canvas-design\canvas-fonts\`) | `IBMPlexMono-Bold/Regular`, `IBMPlexSerif-Bold/BoldItalic/Italic/Regular`, `IBMPlexMono-OFL.txt`, plus puluhan keluarga lain (Lora, WorkSans, JetBrainsMono, DMMono, GeistMono, dll.) dengan berkas OFL |
| Dua lokasi terakhir dirujuk `HS\embed_fonts.py:44-49` | `SRC_DIRS` = `Font_DATUM` dan `canvas-fonts` |

Catatan skema nama: `RL\scripts\datum_docx.py:30` memakai nama wajah literal `'IBM Plex Sans Cond'`, sedangkan `HS\tokens.json:49` memakai `"IBM Plex Sans Condensed"`; nama internal ttf sampel: `IBM Plex Sans Condensed` (fontTools). Lint garis A atas sampel Rev L menandai `DATUM-05 FAIL | IBM Plex Sans Cond`.

### 10.3 Observasi pustakachart

`pustakachart.py:71-100` (`init_fonts`) memilih wajah dengan rantai fallback: `IBM Plex Sans Condensed` lalu `Segoe UI Semibold`, `Segoe UI`, `DejaVu Sans`; serif `IBM Plex Serif`, `Georgia`, `DejaVu Serif`; mono `IBM Plex Mono`, `Consolas`, `DejaVu Sans Mono`. Glif ■□ memakai `DejaVu Sans` (`:103`).

---

## 11. Konverter dan renderer di mesin

### 11.1 DOCX ke PDF

| Alat | Hasil probe |
|---|---|
| `soffice` / `libreoffice` | `where soffice` dan `where libreoffice`: "INFO: Could not find files for the given pattern(s)". `C:\Program Files\LibreOffice` dan `C:\Program Files (x86)\LibreOffice` tidak ada. `find / -maxdepth 4 -iname soffice.exe`: kosong. Python `shutil.which("soffice")`, `("libreoffice")`: `None`. |
| Microsoft Word (COM) | Registri `Word.Application\CurVer` = `Word.Application.16`. `C:\Program Files\Microsoft Office\root\Office16\WINWORD.EXE`, `EXCEL.EXE`, `POWERPNT.EXE` ada. Probe nyata dengan `win32com.client.DispatchEx("Word.Application")`: `Word Version: 16.0 Build: 16.0.17932`, `Path: C:\Program Files\Microsoft Office\Root\Office16`, `Docs open: 0`, `Quit` sukses, proses `WINWORD.EXE` tidak tersisa. |
| `docx2pdf` (paket Python) | `ModuleNotFoundError` di VENV |
| `pandoc` | `where`/`shutil.which`: tidak ada; paket `pypandoc_binary 1.17` terdaftar di pip (binari bawaan; tidak diuji) |
| Skrip konversi yang sudah ada | `C:\Users\TRIAL\workspace\gsp-hermes\workspace\docs\2026-10-04-datum-manual\manual\scripts\docx_to_pdf_word.py` (47 baris, Word COM, `wdFormatPDF = 17`, memperbarui TOC dan field dua kali sebelum `ExportAsFixedFormat`, membuka dengan `ReadOnly=True` (catatan pitfall di `HS\SKILL.md:561-563` menyatakan `ReadOnly=True` gagal; skrip ini justru memakainya)). Pemanggilan: `uv run --python 3.11 --with pywin32 python docx_to_pdf_word.py [src.docx] [out.pdf]`. Skrip lain dengan pola serupa: `...\2026-10-08-eosadint-rebuild-uji\scripts\render_uji.py` (tidak dibaca isinya). |
| Lainnya | `HS\datumcheck.py:371-` `page_count_com` memakai Word COM `ComputeStatistics(2)`. Paket PDF di VENV: `pymupdf 1.28.2`, `pypdf 6.16.2`, `pypdfium2 5.13.0`, `pdfplumber 0.11.10`, `pikepdf 10.13.0.post1`, `img2pdf 0.6.3`, `reportlab`: tidak ada. |

### 11.2 SVG ke PNG/PDF dan HTML ke PDF

| Alat | Hasil probe |
|---|---|
| `rsvg-convert`, `inkscape`, `magick`, `gs`, `pdftoppm`, `mutool`, `dot`, `wkhtmltopdf` | `shutil.which`: `None` semuanya (`convert` ada tetapi `C:\WINDOWS\system32\convert.EXE`, utilitas Windows, bukan ImageMagick) |
| `cairosvg` | paket `CairoSVG 2.9.1` + `cairocffi 1.7.1` terdaftar di pip, tetapi `import cairosvg` gagal: `OSError no library called "cairo-2" was found` |
| Chromium (Playwright) | `playwright 1.62.0` terpasang; folder `C:\Users\TRIAL\AppData\Local\ms-playwright\` berisi `chromium-1228`, `-1234`, `-1243`, `chromium_headless_shell-1228/1234/1243`, `ffmpeg-1011`, `winldd-1007`; `browsers.json` paket meminta `chromium 1234`. Peluncuran `p.chromium.launch()` berhasil (versi 151.0.7922.34); render `set_content` ke PNG berhasil. `goto(file://...)` ke berkas di scratchpad gagal `ERR_FILE_NOT_FOUND` (bagian 4.4). |
| Google Chrome / Edge terpasang | `C:\Program Files\Google\Chrome\Application\155.0.8059.84\` dan `155.0.8059.85\`; `C:\Program Files (x86)\Microsoft\Edge\Application\155.0.4283.62\` (tidak ada di PATH; `where chrome`, `where msedge` kosong) |
| `matplotlib` (Agg) | menulis PNG langsung (`pustakachart.py`) |
| `pymupdf` | dapat merender halaman PDF; tidak dipakai skrip DATUM untuk itu (hanya baca) |
| Node | `C:\Program Files\nodejs\node.exe` dan `C:\Users\TRIAL\AppData\Local\hermes\node\node.exe`; `npx` ada |

### 11.3 Interpreter dan paket (VENV, `pip list` + impor nyata)

`python-docx 1.2.0`, `openpyxl 3.1.5`, `python-pptx 1.0.2`, `pymupdf 1.28.2`, `Pillow 12.3.0`, `lxml 6.1.2`, `fonttools 4.63.0`, `matplotlib 3.11.1`, `numpy` (impor 2.4.3; metadata pip 2.3.5), `PyYAML` (impor 6.0.3; metadata pip 6.0.2), `pywin32 311`, `pypdf 6.16.2`, `playwright 1.62.0`, `xlsxwriter 3.2.9`, `Jinja2 3.1.6`, `svgelements 1.9.6`, `graphviz 0.21` (paket Python; binari `dot` tidak ada), `Markdown 3.10.2`. Tidak ada: `reportlab`, `docx2pdf`, `svglib`.

---

## 12. Dimensi riset eksternal (status cakupan)

| # | Dimensi | Status |
|---|---|---|
| 1 | Technology Trends | tidak dalam lingkup |
| 2 | Technology Evaluation | tidak dalam lingkup |
| 3 | Vendor Evaluation | tidak dalam lingkup |
| 4 | Market Share & Positioning | tidak dalam lingkup |
| 5 | Regulatory & Compliance | tidak dalam lingkup |
| 6 | Competitive Landscape | tidak dalam lingkup |
| 7 | Industry Trends | tidak dalam lingkup |

---

## 13. Collection Log

Perintah dan sumber utama (urut kerja):

1. `ls`/`find` struktur `hermes\skills\gsp\datum-house-style`; Glob 7 nama berkas manual di `hermes` (menemukan 5 di `profiles\gspuser02\skills\datum-revl\scripts` dan 24 snapshot `pustakachart.py` di `kanban\workspaces`).
2. `wc -l`, `ls -la` semua berkas; `Read` `SKILL.md` (608 baris) penuh; `Read` `tokens.json` penuh.
3. Ekstraksi AST (skrip `scratchpad\api.py`, `ast.parse`, tanpa mengimpor modul) untuk tanda tangan fungsi/kelas semua skrip A dan B.
4. `Read` bagian kode: `datum_docx.py` 341-808, `datum_xlsx.py` 64-165, `datum_pptx.py` 56-182, `datum_diagram.py` 1-330, 330-560, 1115-1365, 1420-1488, `datum_figur.py`, `pustakachart.py` 1-200, 1460-1711, `datumsimbol.py`, `embed_fonts.py`, `datumcheck.py`, `datumbind.py`, `datum_lint.py` 30-110 dan 840-938, `datumbuku.py` 1-71.
5. Eksekusi read-only (VENV `-I -B`, cwd `/tmp`):
   - `datum_diagram.py --help | --list | --schema`, `--estimate --json` pada 2 fixture, render `--release` ke scratchpad (exit 0 semua).
   - `datumsimbol.py --list`, `--help`; `datum_figur.py --help`; `datumbuku.py --help`; `embed_fonts.py check`.
   - `scripts\datum_lint.py --selftest` (exit 0), `scripts\datumbuku.py --selftest` (exit 0).
   - `datum_lint.py` dan `datumcheck.py` atas `RL\samples\GSP DATUM Contoh Laporan Teknis.docx` (exit 1, hasil di 3.3 dan 3.12).
   - `pustakachart.py --out <scratchpad>\pc_out --check-min-pt` (8,7 s; 74 PNG; exit 0).
   - Garis B: `datumchart.py --schema`, `datum_diagram.py --schema`, `datum_symbols.py --list`; `datum_render.py` (gagal, 4.4).
   - Probe: impor paket, `shutil.which`, registri HKCU/HKLM font dan Word, `DispatchEx("Word.Application")` (Version/Path/Quit), fontTools nama ttf, Playwright `launch` + `set_content`.
6. `cmp` per berkas: `HS` vs `C:\Users\TRIAL\workspace\gsp-hermes\skills\datum-house-style` (48 berkas, 0 beda); `RL` vs `RLW` (15 skrip dan `tokens.json` sama; `SKILL.md` beda).
7. Pencarian teks: `ARSIP|LOKUS|KRONIK|veritas|PRISMA|visual-commander|datumword` pada `hermes\skills`, `profiles\*\skills`, `workspace\docs\2026-10-04-datum-manual`.
8. Artefak sementara tertulis HANYA di scratchpad sesi: `...\scratchpad\api.py`, `good_layered.svg`, `probe.html`, `probe.png` (tidak terbentuk), `probe_inline.png`, `pc_out\` (74 PNG + manifest), `pc_log.txt`.

Tidak dijalankan: selftest yang menulis ke folder skill atau memakai Word COM (3.14); `embed_fonts.py install|embed`; `datumcheck.py --pages-com`; `build_manual_datum.py`.

---

## 14. Gaps & Needs More Data

1. `datumword.py`: tidak ada di disk di lokasi mana pun yang dicari. Hanya disebut sebagai nama modul di `RL\references\12-rekonsiliasi-gerbang.md:245` ("datumword.py manual ini sebagai purwarupa", usulan P-01), `HS\datum_diagram.py:34`, dan `C:\Users\TRIAL\workspace\gsp-hermes\workspace\docs\2026-10-04-datum-manual\corpus\lajur1-datum-dokumen.md:65` (DAT-29). Pembangun manual yang ada: `build_manual_datum.py` (bagian 2.3).
2. Skill ARSIP, LOKUS (`gsp-output-locality`), KRONIK (`kronik`), veritas, PRISMA (`gsp-visual-commander`): tidak ditemukan sebagai skill di mesin ini (bagian 9.3). Konten, antarmuka, dan format `Register Induk` ARSIP tidak tersedia.
3. Pencarian `find` rekursif luas pada `hermes` mengembalikan kosong walau Glob menemukan berkas (alasan tidak ditentukan); hasil akhir bertumpu pada Glob, `ls`, dan `grep` bertarget. Cakupan di luar root yang dicari (`C:\Users\TRIAL`, depth-limited, dan beberapa root `hermes`) tidak dijamin lengkap.
4. Tidak ditemukan modul DATUM yang menerima JSON spesifikasi DOKUMEN (docx/xlsx/pptx) atau memuat "template" yang dapat dikustom lewat data; builder garis A bersifat imperatif (panggilan metode), builder garis B berupa skrip dengan konten tertanam. Konversi Markdown ke DOCX berbentuk DATUM hanya ada di `build_manual_datum.py` (konten dari `bagian-*.md`).
5. Tidak ada pembangun HTML artifact DATUM selain `RL\assets\Sumber Lembar Bukti.html` (sumber statis lembar bukti, 41265 B, memuat token CSS dan `@font-face` ke `fonts/*.ttf`) dan `datum_render.py --check-page` yang mengukur HTML ber-kelas `.page/.body/.reg`. `RL\references\05-command-brief.md` dan sampel PPTX tidak diperiksa.
6. Selftest `selftest_builder.py`, `selftest_chip_para.py`, `selftest_datum_diagram.py`, `selftest_datumbind.py` tidak dijalankan (menulis ke folder skill/Word COM); status lulus-tidaknya tidak diverifikasi di sesi ini. Klaim jumlah CHECK (23, 42) di `HS\SKILL.md:600` tidak direproduksi.
7. Render PNG nyata dari SVG via `datum_render.py` gagal di sesi ini (bagian 4.4); penyebab `file://` `ERR_FILE_NOT_FOUND` tidak ditentukan. Jalur yang berhasil: `set_content` inline. Tidak diuji: `page.pdf()`.
8. Tidak diperiksa: isi `RL\references\*.md` selain `08` (baris 1-70) dan `10` (baris 1-30, 262-351), `RL\samples\*`, `RL\assets\manual\*`, `datum_figma_audit.py`/`ujicepat.py` selain docstring dan API, serta `HS\scripts\fixtures_lint\make_fixture.py`.
9. Perbedaan metadata pip vs impor di VENV: `numpy` 2.3.5 (pip list) vs 2.4.3 (impor); `PyYAML` 6.0.2 vs 6.0.3. Sebabnya tidak diselidiki.
10. `selftest_datum_diagram.py` mengacu "23 CHECK" di SKILL tetapi daftar `CHECK n` di berkas berlanjut sampai 30; selisih tidak direkonsiliasi.
11. Lisensi: IBM Plex dinyatakan SIL OFL di `RL\assets\fonts\PASANG-DULU.txt` dan ada `IBMPlexMono-OFL.txt` di `canvas-fonts`; `RL\SKILL.md` berlisensi "GSP Internal Use Only" (`RL\SKILL.md:4`), `HS\SKILL.md:6` berlisensi MIT. Status lisensi manual dan logo di `assets` tidak dikaji.
12. Tidak ada riset eksternal (web) yang dilakukan.

---

## 15. Catatan keluaran terstruktur untuk `data-analyst`

- Ringkasan kontrak tiap mesin (masukan, keluaran, bahasa, dependensi), baris tunggal:

| Mesin | Masukan | Keluaran | Dependensi pihak ketiga (terpasang di VENV?) |
|---|---|---|---|
| `datum_docx.DatumDocx` (A) | panggilan metode Python (rows list-of-list, string inline md-lite) | `.docx` | python-docx (ya), datumcheck (Pillow, ya) |
| `datum_xlsx.DatumWorkbook` (A) | panggilan metode Python | `.xlsx` | openpyxl (ya) |
| `datum_pptx.DatumDeck` (A) | panggilan metode Python | `.pptx` | python-pptx (ya) |
| `datum_diagram.py` (A) | spek JSON berkas | SVG mm | stdlib |
| `datum_diagram.py` (B) | spek JSON berkas/stdin | SVG mm (+ PNG via rsvg/inkscape/cairosvg) | stdlib; cairosvg (paket ada, libcairo tidak) |
| `datumchart.py` (B) | spek JSON berkas/stdin | SVG | stdlib |
| `pustakachart.py` (A) | tidak ada (galeri tetap, data sintetis) | 74 PNG 300 dpi + manifest.json + katalog md | matplotlib, numpy (ya) |
| `datumsimbol.py` (A) / `datum_symbols.py` (B) | id simbol | SVG | stdlib |
| `datum_figur.py` (A) | PDF terbit / folder sidecar yaml | teks/JSON | pymupdf, PyYAML (ya) |
| `datum_lint.py` (A) | `.docx` | teks (PASS/FAIL per cek) | python-docx (ya) |
| `datumbuku.py` (A) | `.xlsx` | teks / JSON | openpyxl (ya) |
| `datumbind.py` (A, B) | register JSON + dokumen | JSON / teks | python-docx (ya) |
| `datum_render.py` (B) | SVG / HTML | PNG / PDF | playwright (ya), cairosvg (tidak berfungsi) |
| `embed_fonts.py` (A) | `.docx` | `.docx` dengan font tertanam (Word COM) | pywin32 (ya), Windows |
| `embed_fonts.py` (B) | `.docx`/`.pptx` + ttf | berkas dengan `.odttf` | lxml (ya) |
