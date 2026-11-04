---
schema_version: 1.0
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
date: 2026-11-04
agent: data-collector
step: S04 (identification/02_structured_datum_rev_a.md, baris 120)
document: research/34_pdf_text_geometry_tooling.md
evidence_tier: 2 (temuan eksplorasi: apa, mengapa penting, cara verifikasi, sumber)
items_collected: 27
status: complete
---

# Inventaris alat geometri teks PDF dan konversi DOCX ke PDF di host ini (S04)

## 1. Task Overview

- Tujuan: mendata alat yang sudah terpasang di host Windows ini yang dapat mengeluarkan kotak teks per halaman beserta koordinat dari PDF, sebagai bahan pemeriksa "tanpa bentrok teks" (S24: teks tumpang-tindih, keluar halaman/margin, terpotong di sel). Juga: apakah DOCX bisa dikonversi ke PDF secara lokal.
- Batasan: tidak memasang apa pun. Semua uji hidup memakai alat yang sudah ada; berkas uji dibuat di folder sementara `C:/Users/TRIAL/AppData/Local/Temp/gso-s04` dan dihapus sesudahnya (`ls Temp | grep gso-s04` kosong). Tidak ada berkas repo selain dokumen ini yang ditulis.
- Tanggal akses: 2026-11-04. Repo: `C:\Users\TRIAL\gsp-swarm-hq-v2.1`.
- Dimensi riset eksternal (tabel 1-7 pada peran agen): tidak dalam lingkup (inventaris host lokal saja, tanpa sumber web).

## 2. Files Collected

### 2.1 Alat Node di repo (package.json dan node_modules)

| # | Temuan | Mengapa penting | Cara verifikasi | Sumber |
|---|---|---|---|---|
| 1 | `package.json` dependencies berisi `fflate` 0.8.3 dan `playwright-core` 1.62.1; tidak ada pustaka PDF di `dependencies`/`devDependencies`. | Tidak ada parser PDF sisi Node yang dideklarasikan. | `cat package.json` (keluaran: dependencies memuat `"fflate": "0.8.3"`, `"playwright-core": "1.62.1"`; tidak ada `pdfjs-dist`/`pdf-parse`/`pdf-lib`/`unpdf`/`mupdf`). | `C:\Users\TRIAL\gsp-swarm-hq-v2.1\package.json` baris 24, 33 |
| 2 | `node_modules`: `pdfjs-dist`, `pdf-parse`, `pdf-lib`, `unpdf`, `mupdf`, `playwright` (penuh), `puppeteer`, `puppeteer-core`, `pdfkit` semuanya ABSENT; `playwright-core` hadir versi 1.62.1. | Tidak ada pustaka PDF Node terpasang, termasuk sebagai dependensi transitif. | `for m in pdfjs-dist pdf-parse pdf-lib unpdf mupdf playwright-core playwright puppeteer puppeteer-core pdfkit; do [ -d node_modules/$m ] && grep -m1 '"version"' node_modules/$m/package.json \|\| echo "$m: absent"; done` -> `pdfjs-dist: absent`, `pdf-parse: absent`, `pdf-lib: absent`, `unpdf: absent`, `mupdf: absent`, `playwright-core: "version": "1.62.1"`, `playwright: absent`, `puppeteer: absent`, `puppeteer-core: absent`, `pdfkit: absent`. | `C:\Users\TRIAL\gsp-swarm-hq-v2.1\node_modules\` |

### 2.2 Cara Studio menghasilkan PDF hari ini

| # | Temuan | Mengapa penting | Cara verifikasi | Sumber |
|---|---|---|---|---|
| 3 | PDF Studio = DOCX dikonversi LibreOffice (`soffice`), "tidak pernah lewat Chromium". | Berkas PDF yang diterima pengguna berasal dari mesin tata letak LibreOffice, bukan Chromium. | `grep -rni pdf src/lib/studio`; komentar kepala modul: "PDF = DOCX -> soffice (S92, D-15; tidak pernah lewat Chromium, KT-17)". Juga `render/revision.ts:12` "PDF = DOCX -> soffice (D-15)" dan `render/pure/render.ts:10,53` (`convertDocxToPdf`). | `src/lib/studio/services/render/index.ts:5`; `src/lib/studio/services/render/revision.ts:12`; `src/lib/studio/services/render/pure/render.ts:10,53` |
| 4 | Pemanggilan soffice: `--headless --norestore --nologo --nodefault --nolockcheck -env:UserInstallation=<profil> --convert-to pdf --outdir <out> <in.docx>`; path bawaan `C:\Program Files\LibreOffice\program\soffice.com`; batas waktu bawaan 180000 ms. | Perintah yang sama dapat dipakai langsung terhadap DOCX uji. | `sed -n 195,260p engine/soffice/service.ts`; `grep -n soffice contract/env.ts` -> `DEFAULT_SOFFICE_PATH = "C:\\Program Files\\LibreOffice\\program\\soffice.com"`, `DEFAULT_STUDIO_SOFFICE_TIMEOUT_MS = 180000`. | `src/lib/studio/engine/soffice/service.ts:203-217`; `src/lib/studio/contract/env.ts:21,30` |
| 5 | Studio menolak path panjang untuk soffice (MAX_PATH 260; profil <= 160 karakter) karena soffice LibreOffice 24.2 di Windows menggantung sampai timeout. | Folder kerja pemeriksa konversi harus pendek; kegagalan ini nyata di host ini (lihat butir 18). | `sed -n 1,25p engine/soffice/paths.ts`. | `src/lib/studio/engine/soffice/paths.ts:1-35` |
| 6 | Satu-satunya pemakai `page.pdf` di `src/` dan `scripts/` adalah `measureLayout` untuk menghitung halaman cetak dokumen alir (bukan untuk menghasilkan PDF serahan). | Chromium `page.pdf` ada di kode tetapi hanya untuk hitung halaman. | `grep -rn "page\.pdf\|\.pdf(" --include=*.ts --include=*.mjs src scripts` -> hanya `src/lib/studio/engine/browser/index.ts:401`. | `src/lib/studio/engine/browser/index.ts:396-407` |
| 7 | Studio sudah punya pengukur tata letak Playwright: `measureLayout(html, {media: "screen"\|"print", pageWidthMm, pageHeightMm, ...})` mengeksekusi `MEASURE_SCRIPT` yang memakai `getBoundingClientRect` dan `getClientRects`. Keluarannya per elemen (mm, relatif halaman): `page`, `overflow` (luapan ke bawah/kanan terhadap area isi `.body`/`.reg`/tepi lembar), `clip` (`scrollWidth > clientWidth`), `text` (baris, karakter per baris, ukuran fon), `figure`, `table`. Tidak ada deteksi tumpang-tindih antar-kotak teks dalam skrip. JavaScript halaman dimatikan, jaringan diblokir, konten hanya lewat `setContent`. | Jalur alternatif sisi HTML yang sudah ada tanpa dependensi baru. Tetapi ini mengukur render Chromium dari HTML Studio, bukan PDF soffice (butir 3). | `grep -rn "getBoundingClientRect\|getClientRects" src scripts benchmark tests` -> `engine/browser/measure.ts:57,69,128,134,135,146,147,168,178,196`; `sed -n 1,40p engine/browser/measure.ts`; `MeasureOptions` di `engine/browser/index.ts:111-123`. | `src/lib/studio/engine/browser/measure.ts:1-256`; `src/lib/studio/engine/browser/index.ts:111-123, 377-424` |
| 8 | Kelas penanda markup yang dibaca pengukur: `.page`/`[data-page]`, `.body`, `.reg`, `data-address`; tanpa `.page` dokumen dianggap alir (`kind: "document"`). | Hasil hanya bermakna untuk HTML yang memakai konvensi itu (HTML buatan Studio). | `sed -n 1-20p engine/browser/measure.ts` (komentar "Konvensi markup yang dibaca"). | `src/lib/studio/engine/browser/measure.ts:10-17` |

### 2.3 Chromium/Edge untuk playwright-core

| # | Temuan | Mengapa penting | Cara verifikasi | Sumber |
|---|---|---|---|---|
| 9 | Jalur Chromium bawaan Studio `C:\Users\TRIAL\AppData\Local\ms-playwright\chromium-1234\chrome-win64\chrome.exe` ada; `chromium-1228` dan `chromium-1243` juga ada; `playwright-core/browsers.json` menetapkan revisi chromium 1234 (browserVersion 151.0.7922.34). | Browser yang cocok dengan playwright-core 1.62.1 tersedia tanpa pemasangan. | `ls ms-playwright` -> `chromium-1228, chromium-1234, chromium-1243, chromium_headless_shell-*`; `[ -e <path> ]` -> `EXISTS` untuk ketiganya; `grep -A3 '"name": "chromium"' node_modules/playwright-core/browsers.json` -> `"revision": "1234"`, `"browserVersion": "151.0.7922.34"`. | `src/lib/studio/contract/env.ts:25-26`; `node_modules/playwright-core/browsers.json:5-8` |
| 10 | Chrome sistem `C:\Program Files\Google\Chrome\Application\chrome.exe` (versi 157.0.8103.38) dan Edge `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` (versi 156.0.4314.58) ada. `C:\Program Files\Microsoft\Edge\Application\msedge.exe` dan `C:\Program Files (x86)\Google\Chrome\...` tidak ada. | Cadangan bila Chromium Playwright hilang; keduanya dapat dipakai lewat `executablePath`. | `ls` jalur-jalur itu -> `EXISTS`/`MISSING` seperti di atas; uji hidup di butir 17. | host (jalur di kolom temuan) |
| 11 | Variabel `PLAYWRIGHT_BROWSERS_PATH` kosong; tidak ada `soffice`, `libreoffice`, `mutool`, `qpdf`, `pdftoppm`, `msedge`, `chrome` di PATH shell. `.env` repo tidak mengatur `STUDIO_CHROMIUM_PATH`/`SOFFICE_PATH` (grep nama kunci tanpa hasil), sehingga bawaan butir 4 dan 9 berlaku. | PATH tidak bisa diandalkan; pakai jalur absolut. | `echo $PLAYWRIGHT_BROWSERS_PATH`; `which <nama>` -> "no <nama> in (...)"; `grep -E "^(STUDIO_CHROMIUM_PATH\|SOFFICE_PATH)=" .env` -> tanpa keluaran. | host; `C:\Users\TRIAL\gsp-swarm-hq-v2.1\.env` (hanya nama kunci diperiksa, nilai tidak dicetak) |

### 2.4 Skrip benchmark di repo

| # | Temuan | Mengapa penting | Cara verifikasi | Sumber |
|---|---|---|---|---|
| 12 | `benchmark/harness/compare/pdf_pages.py` memakai `pymupdf` (`import pymupdf`; `page.get_text()`, `get_pixmap(dpi=72)`) dan `numpy`; tidak ada pemanggilan `pdftoppm`/`soffice`/`fitz` di berkas itu. | Harness yang ada sudah bergantung pada PyMuPDF; tidak menambah dependensi bila S24 memakainya. | `grep -n "import\|subprocess\|pdftoppm\|soffice\|fitz" benchmark/harness/compare/pdf_pages.py` -> `import numpy as np`, `import pymupdf`, `from docx_units import norm`. | `benchmark/harness/compare/pdf_pages.py:1-15, 44-50` |
| 13 | `benchmark/harness/compare/ssim_seam.py` hanya memakai `numpy` dan `importlib` (SSIM 7x7, 72 dpi); tidak mengimpor pustaka PDF. | Tidak relevan untuk geometri teks; hanya mengonfirmasi tumpukan Python + numpy. | `grep -n "import" benchmark/harness/compare/ssim_seam.py`. | `benchmark/harness/compare/ssim_seam.py:12-19` |
| 14 | Konvensi menjalankan: `VENV -I -B benchmark/harness/compare/bm_compare.py ...` dengan VENV = `C:\Users\TRIAL\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe`. Juga `scripts/parity/compare/compare_pdf.py` memuat `pymupdf`. | Konvensi interpreter sudah ditetapkan di repo. | `sed -n 1-16p benchmark/harness/compare/README.md`; `grep -rln "pymupdf" benchmark scripts` -> `pdf_pages.py`, `build_figures.py`, `compare_pdf.py`, `selftest_compare.py`, `ssim_cal.py`. | `benchmark/harness/compare/README.md:6,15` |

### 2.5 Python

| # | Temuan | Mengapa penting | Cara verifikasi | Sumber |
|---|---|---|---|---|
| 15 | Hermes venv (Python 3.11.15): `fitz` True, `pymupdf` True, `pdfplumber` True, `pdfminer` True, `pypdf` True, `PyPDF2` False, `pypdfium2` True, `docx` True, `lxml` True. Versi: pymupdf 1.28.2, pdfplumber 0.11.10, pdfminer 20260107, pypdfium2 5.13.0, numpy 2.4.3. | Lima pustaka pembaca PDF dengan koordinat sudah terpasang di interpreter yang dipakai harness. | `C:/Users/TRIAL/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe -I -c "import importlib.util as u; print({m: bool(u.find_spec(m)) for m in [...]})"` -> `{'fitz': True, 'pymupdf': True, 'pdfplumber': True, 'pdfminer': True, 'pypdf': True, 'PyPDF2': False, 'pypdfium2': True, 'docx': True, 'lxml': True}`. | `C:\Users\TRIAL\AppData\Local\hermes\hermes-agent\venv\Lib\site-packages\` |
| 16 | Python lain di PATH: `C:\Users\TRIAL\AppData\Local\Microsoft\WindowsApps\python.exe` (jalan sebagai Python 3.14.7, executable `C:\Users\TRIAL\AppData\Local\Python\pythoncore-3.14-64\python.exe`) memuat `fitz` True, `pymupdf` True (1.28.2), `pypdf` True, `docx` True, `lxml` True; `pdfplumber` False, `pdfminer` False, `pypdfium2` False, `PyPDF2` False. `py -0` mencantumkan juga "Astral\CPython3.11.15" tetapi `py -3.11` menjawab "No runtime installed that matches 3.11". `/mingw64/bin` tidak punya python. | Ada interpreter kedua dengan PyMuPDF yang sama versinya; hanya hermes venv yang memiliki pdfminer/pdfplumber/pdfium. | `python -I -c "import importlib.util as u; print({...})"` -> `{'fitz': True, 'pymupdf': True, 'pdfplumber': False, 'pdfminer': False, 'pypdf': True, 'PyPDF2': False, 'pypdfium2': False, 'docx': True, 'lxml': True}`; `python -I -c "import pymupdf,sys; print(sys.executable); print(pymupdf.__file__)"`; `py -0`; `py -3.11 -I -c ...`. | host |

### 2.6 Uji hidup keluaran geometri (alat yang sudah terpasang)

PDF uji A = `probe.pdf` (1 halaman, hasil konversi soffice dari DOCX uji buatan python-docx; judul + paragraf + tabel 2x3). PDF uji B = artefak yang sudah ada `benchmark/out/fixb/official/Manual Komprehensif DATUM GSP 000-GSP-STD-X-2026 RevA.pdf` (5.423.955 byte; dibaca saja).

| # | Alat | Hasil terukur | Cara verifikasi | Sumber |
|---|---|---|---|---|
| 17a | PyMuPDF 1.28.2 (hermes venv) | A: `page.rect` = [0,0,612,792]; `get_text("words")` = 63 kata dengan bbox (x0,y0,x1,y1) mis. `(90.1, 96.27, 124.58, 113.35, 'Probe', block, line, word)`; `get_text("blocks")` = 3; `get_text("dict")` memberi span dengan kunci `size, flags, font, color, ascender, descender, text, origin, bbox`; `get_drawings()` = 0. B: 105 halaman, 31.490 kata, 0,2 s; halaman 1 `rect` = [0,0,595.30,841.89]. | `"$PY" -I geom.py probe.pdf`; `"$PY" -I -c "import pymupdf ... for p in d: p.get_text('words')" <Manual PDF>` -> `pages 105 words 31490 secs 0.2`. | hermes venv; Manual PDF (path di atas) |
| 17b | pdfplumber 0.11.10 (hermes venv) | A: `extract_words()` = 63 kata dengan `x0,x1,top,bottom` (mis. `Probe`, x0 90.1, top 99.35); `pg.chars` = 335; `pg.rects` = 0; `pg.lines` = 0. | `geom.py` bagian pdfplumber. | hermes venv |
| 17c | pdfminer.six 20260107 (hermes venv) | A: 7 `LTTextBox` pada halaman 1, bbox pertama [90.1, 648.658, 498.64, 692.648], bbox halaman [0,0,612,792] (origin kiri-bawah). B: 167 `LTTextBox` pada 3 halaman pertama, 0,09 s. | `geom.py` bagian pdfminer; `extract_pages(<Manual PDF>, maxpages=3)`. | hermes venv |
| 17d | pypdfium2 5.13.0 (hermes venv) | A: `get_textpage().count_rects()` = 9; rect pertama [91.07, 679.92, 173.99, 691.92]. | `geom.py` bagian pypdfium2. | hermes venv |
| 17e | pdftotext (Xpdf 4.06) di `/mingw64/bin/pdftotext` | Opsi yang tercantum: `-layout`, `-simple`, `-simple2`, `-table`, `-lineprinter`, `-raw`, `-fixed`, `-clip`, `-nodiag`; tidak ada opsi `-bbox`/`-bbox-layout` (perintah `-bbox-layout` mencetak teks bantuan sebagai galat penggunaan). Tidak menghasilkan koordinat. | `pdftotext -v`; `pdftotext -h \| grep -i -E "bbox\|layout\|raw"`; `pdftotext -bbox-layout -f 1 -l 1 probe.pdf -` -> usage. | `/mingw64/bin/pdftotext` |
| 17f | PyMuPDF di Python 3.14 (WindowsApps) | `pymupdf.__version__` = 1.28.2; `get_text('words')` = 63 pada PDF uji A (hasil sama dengan hermes venv). | `python -I -c "import pymupdf; ..."`. | `C:\Users\TRIAL\AppData\Local\Python\pythoncore-3.14-64\Lib\site-packages\pymupdf\` |
| 17g | playwright-core 1.62.1 mengukur HTML (media print) lalu `page.pdf` | Skrip uji: dua `<p>` posisi absolut tumpang-tindih di `.page` 210x297 mm; `getBoundingClientRect` mengembalikan `a: x 37.78 y 53.78 w 151.17 h 36`, `b: x 45.34 y 57.56 w 151.17 h 18`, `getClientRects().length` = 1 untuk keduanya; `page.pdf` menghasilkan PDF berkepala `%PDF-` (22.239 byte). Hasil sama dengan tiga binari: chromium-1234 (v151.0.7922.34), Chrome sistem (v157.0.8103.38), Edge (v156.0.4314.58, via `executablePath`). | `node pw_probe.mjs <exe>` dengan `require("playwright-core")` dari `C:/Users/TRIAL/gsp-swarm-hq-v2.1/package.json`; keluaran per binari seperti di kolom ini. | skrip uji sementara (dihapus); `node_modules/playwright-core` |

### 2.7 Binari dan konversi DOCX ke PDF

| # | Temuan | Mengapa penting | Cara verifikasi | Sumber |
|---|---|---|---|---|
| 18 | LibreOffice 24.2 terpasang: `C:\Program Files\LibreOffice\program\soffice.exe` dan `soffice.com` ada; registri `HKLM\SOFTWARE\LibreOffice\UNO\InstallPath` menyebut "LibreOffice 24.2". `C:\Program Files (x86)\LibreOffice\...` tidak ada. | Konversi DOCX ke PDF lokal tersedia. | `[ -e "/c/Program Files/LibreOffice/program/soffice.exe" ]` -> `EXISTS`; `reg query "HKLM\SOFTWARE\LibreOffice\UNO\InstallPath"` -> `LibreOffice 24.2 REG_SZ C:\Program Files\LibreOffice\program`. | host |
| 19 | Konversi nyata berhasil dengan folder kerja pendek: `soffice.com --headless --norestore --nologo --nodefault --nolockcheck -env:UserInstallation=file:///C:/Users/TRIAL/AppData/Local/Temp/gso-s04/profile --convert-to pdf --outdir .../out .../in/probe.docx` -> "convert ...probe.docx as a Writer document -> ...probe.pdf using filter : writer_pdf_Export", `real 0m6.386s`, `probe.pdf` 31.050 byte berkepala `%PDF-1.7`. Baris stderr "Entity: line 1: parser error : Document is empty" muncul pada kedua percobaan dan tidak menghalangi hasil. | Perintah konversi dan jangka waktunya terukur. | keluaran perintah di kolom ini. | `C:\Program Files\LibreOffice\program\soffice.com` |
| 20 | Percobaan pertama dengan folder kerja di scratchpad sesi (path profil 269 karakter) menggantung 3m25s tanpa membuat PDF dan dihentikan (`taskkill` proses `soffice.bin` anak dari proses uji; `tasklist` sebelumnya menunjukkan satu `soffice.bin` saja). | Mengonfirmasi peringatan MAX_PATH di butir 5; pemeriksa harus memakai folder kerja pendek. | `time soffice.com ... --outdir <path panjang>` -> `real 3m25.822s`, `out/` kosong; `tasklist \| grep -i soffice`. | `src/lib/studio/engine/soffice/paths.ts:1-35` |
| 21 | Word COM terdaftar: `HKCR\Word.Application` = "Microsoft Word Application"; CLSID `{000209FF-0000-0000-C000-000000000046}`; `LocalServer32` = `C:\Program Files\Microsoft Office\Root\Office16\WINWORD.EXE /Automation`; berkas `C:\Program Files\Microsoft Office\root\Office16\WINWORD.EXE` ada. Otomasi Word tidak dijalankan (hanya registri dan berkas dibaca). | Jalur konversi kedua yang mungkin (SaveAs PDF), belum diuji; bukan jalur Studio. | `reg query HKCR\Word.Application` dan `reg query HKCR\CLSID\{000209FF-...}\LocalServer32`; `ls .../Office16/WINWORD.EXE`. | registri dan sistem berkas host |
| 22 | Tidak terpasang / tidak ada di PATH: `pdftoppm`, `mutool`, `qpdf`, `soffice`/`libreoffice` (PATH). `pdftotext` ada di `/mingw64/bin` (butir 17e). Folder di `C:\Program Files` yang cocok: `LibreOffice`, `Microsoft Office`, `Microsoft Office 15` (tidak ada poppler/mupdf/qpdf). | `pdftoppm` tidak ada, sama seperti catatan `research/30` (butir 2 daftar langkah). | `which -a pdftoppm mutool qpdf` -> "no ... in (...)"; `ls "/c/Program Files" \| grep -i -E "office\|libre\|poppler\|mupdf\|qpdf"`. | host; `docs/2026-10-22_doc_artifact_studio/research/30_datum_rev_a_template_gap.md:27` |

## 3. Code Context (kutipan yang menentukan)

`src/lib/studio/services/render/index.ts:5` (komentar kepala): `PDF = DOCX -> soffice (S92, D-15; tidak pernah lewat Chromium, KT-17)`

`src/lib/studio/engine/soffice/service.ts:203-217`: argumen `--headless --norestore --nologo --nodefault --nolockcheck -env:UserInstallation=... --convert-to pdf --outdir <outDir> <inFile>`.

`src/lib/studio/engine/browser/index.ts:396-407`: `page.pdf({width, height, preferCSSPageSize: true, printBackground: true})` hanya dipakai untuk `countPdfPages(pdf)` pada dokumen alir tanpa `.page`.

`benchmark/harness/compare/pdf_pages.py:12-15`: `import numpy as np`, `import pymupdf`.

`docs/2026-10-22_doc_artifact_studio/identification/02_structured_datum_rev_a.md:136` (S20): harness konformitas berbasis pembaca DOCX `fflate` (sisi Node/TS); `:140` (S24): modul bentrok PDF bergantung pada S04 dan, bila butuh dependensi baru, "needs-review, bukan memasang".

## 4. Online Resources / External Research Findings

Tidak ada. Dimensi 1-7: tidak dalam lingkup (inventaris host lokal; tidak ada kueri web dikirim).

## 5. Collection Log

| Waktu (2026-11-04) | Perintah / aksi | Hasil ringkas |
|---|---|---|
| sesi | Read `identification/02_structured_datum_rev_a.md` (baris 1-258 dari 336; baris S04 = 120, S20 = 136, S24 = 140 terbaca) | baris S04 dan konteks dibaca |
| sesi | `cat package.json`; loop `node_modules/<m>` | butir 1, 2 |
| sesi | Grep `pdf` di `src/lib/studio`; grep `page.pdf`, `getBoundingClientRect` | butir 3, 6, 7 |
| sesi | `head benchmark/harness/compare/pdf_pages.py ssim_seam.py` + grep import | butir 12, 13 |
| sesi | hermes venv `find_spec` x9; `python`/`py` di PATH | butir 15, 16 |
| sesi | `which`, `[ -e ]`, `reg query HKCR\Word.Application`, `ls Program Files` | butir 9-11, 18, 21, 22 |
| sesi | Konversi soffice uji (2 percobaan), geometri 5 alat, uji Playwright 3 binari | butir 17a-17g, 19, 20 |
| sesi | Hapus `C:/Users/TRIAL/AppData/Local/Temp/gso-s04` | `ls Temp \| grep gso-s04` kosong |
| sesi | Tulis dokumen ini | satu berkas ditulis |

## 6. Gaps & Needs More Data

- Konversi dan geometri diuji pada DOCX uji buatan python-docx (halaman Letter), bukan pada PDF yang dibuat pipeline Studio untuk salah satu dari 10 templat baru. Belum ada sampel Studio-DEV untuk dipakai (S35 belum jalan).
- Deteksi "terpotong di sel" pada PDF belum diuji: belum diketahui apakah teks yang terpotong oleh clip path soffice tetap muncul pada keluaran `get_text("words")` dengan bbox di luar sel (HIPOTESIS; perlu sampel PDF dengan sel terpotong). `get_drawings()` PyMuPDF mengembalikan 0 pada PDF uji A (tabel uji tanpa garis); keluaran garis/kotak sel pada PDF Studio belum diukur.
- Tidak diuji: ketelitian margin (margin DOCX vs bbox PDF); skala satuan (PDF = pt dengan origin kiri-atas pada PyMuPDF/pdfplumber, kiri-bawah pada pdfminer/pdfium; halaman uji A 612x792, Manual 595.30x841.89).
- Harness S20 berbasis TS (`fflate`), sedangkan alat geometri yang ada adalah Python (hermes venv). Belum ada pustaka PDF sisi Node; antarmuka TS ke Python (proses anak) belum ada di repo (tidak dicari ke luar `benchmark/`, `scripts/`, `src/`).
- Tidak diuji: Word COM (hanya registri dan berkas), Edge/Chrome sistem untuk `measureLayout` penuh (hanya skrip uji kecil), `measureLayout` pada HTML nyata Studio.
- Hermes venv adalah lingkungan milik Hermes (`AppData\Local\hermes`); kestabilan versi paket di sana tidak dijamin oleh repo (tidak ada berkas `requirements*` di `benchmark/`, `benchmark/harness/`, `scripts/parity/`; `ls` -> "No such file").

## 7. Rekomendasi (urut preferensi)

Rekomendasi ini disusun dari temuan di atas untuk diteruskan ke `data-analyst`; keputusan akhir ada pada controller/USER.

1. **Tanpa dependensi baru (disarankan): PyMuPDF yang sudah ada di hermes venv.** Alasan berbukti: terpasang dan teruji (butir 15, 17a), sudah dipakai harness repo (butir 12, 14), kata dengan bbox per halaman 105 halaman dalam 0,2 s (butir 17a), tersedia juga di Python 3.14 PATH sebagai cadangan (butir 17f). Pelengkap dari venv yang sama bila perlu: pdfplumber (kata + `rects`/`lines`, butir 17b) atau pdfminer (`LTTextBox`, butir 17c), semuanya sudah terpasang. Panggil dengan konvensi repo `VENV -I -B <skrip.py>` (butir 14); pemeriksa dipanggil dari TS lewat proses anak, atau ditulis sebagai modul Python di `benchmark/datum_conformance` (keputusan antarmuka milik S20/S24).
2. **Pelengkap tanpa dependensi baru, pada sisi HTML:** `measureLayout` Playwright milik Studio (butir 7) dengan `media: "print"` mengeluarkan `overflow`/`clip` per elemen dalam mm; Chromium 1234, Chrome, dan Edge semuanya dapat diluncurkan (butir 9, 10, 17g). Batasan: tidak menghitung tumpang-tindih antar-kotak, dan Chromium bukan mesin yang menghasilkan PDF serahan (butir 3), jadi hasilnya tidak dapat menggantikan pemeriksaan PDF.
3. **Konversi DOCX ke PDF lokal:** tersedia lewat `soffice.com` (LibreOffice 24.2) dengan folder kerja pendek (butir 19, 20); Word COM terdaftar tetapi belum diuji (butir 21).
4. **Dependensi baru:** tidak diperlukan. Bila keputusan nanti mensyaratkan pembaca PDF murni Node (tanpa Python), itu "needs user decision: new dependency" dengan kandidat terkecil `pdfjs-dist` (belum diperiksa ukuran/lisensinya di sesi ini; tidak ada pencarian web dilakukan).

**Sumber kebenaran untuk pemeriksa bentrok:** PDF keluaran Studio itu sendiri, yaitu DOCX Studio yang dikonversi soffice (butir 3, 4). Pemeriksa dijalankan pada berkas PDF yang diserahkan; DOCX yang dikonversi ulang ke PDF memakai mesin yang sama (soffice) sehingga setara dengan PDF Studio selama versi LibreOffice sama (24.2, butir 18), tetapi menambah satu langkah konversi dan risiko path panjang (butir 5, 20). Render HTML Chromium tidak dipakai sebagai sumber kebenaran karena PDF Studio tidak melewati Chromium.
