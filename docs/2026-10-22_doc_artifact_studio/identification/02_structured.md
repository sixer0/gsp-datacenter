---
schema_version: 1.0
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
date: 2026-10-22
agent: task-architect
revision: 3 (D-12..D-17 dan research/05_render_calibration.md; menggantikan revisi 1 dan 2 utuh)
scale_category: Enhancement (Penyempurnaan besar, fitur baru multi-modul; skala Besar)
blueprint_state: refinement pass setelah riset (research/01-05 ada); baris implementasi dan Execution Profile wajib
binding_decisions: D-01..D-17 (decisions/decisions.md); D-11 direvisi D-15; ambang D-13 diganti D-17
status: needs-review (17 keputusan terbuka; KT-03 dan KT-15 menahan G1)
---

# Blueprint Terstruktur: Doc Artifact Studio (Swarm HQ v2.1)

Singkatan path: `<task>` = `docs/2026-10-22_doc_artifact_studio` (relatif ke akar repo `C:\Users\TRIAL\gsp-swarm-hq-v2.1`). `HS` = `C:\Users\TRIAL\AppData\Local\hermes\skills\gsp\datum-house-style` (Garis A v2.6.0, read-only). `RL` = `C:\Users\TRIAL\AppData\Local\hermes\profiles\gspuser02\skills\datum-revl` (Garis B Rev L, read-only). `VENV` = `C:\Users\TRIAL\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe`. `BM` = `C:\Users\TRIAL\workspace\Manual DATUM GSP\Manual_Komprehensif_DATUM_GSP_000-GSP-STD-X-2026_RevA` (`.pdf` acuan NAS dan `.docx`; terverifikasi Glob; read-only). `SOFFICE` = `C:\Program Files\LibreOffice\program\soffice.com` (konsol; `soffice.exe` juga ada; keduanya terverifikasi Glob; dapat ditimpa env `SOFFICE_PATH`). `CAL` = `C:\Users\TRIAL\AppData\Local\Temp\hq_v21_clone\scripts\calib_compare.py` (pembanding kalibrasi controller; terverifikasi Glob).

## 1. Konteks (naratif, bukan instruksi delegasi)

### 1.1 Tantangan arsitektur

1. **Benchmark penerimaan utama = Manual 000 (D-12, ambang final D-17).** Isi `BM.docx` diekstrak ke JSON masukan aplikasi, dirender aplikasi, lalu dibandingkan ke berkas asli. Kriteria terbagi dua kelompok:
   - Teks dan struktur (ketat, deviasi maks 2 persen): minimal 98 persen unit teks identik dan berurutan; jumlah unsur per jenis selisih maks 2 persen (halaman 102 plus minus 2, tabel 151 plus minus 3, gambar 52 plus minus 1); minimal 98 persen halaman bertekst identik (min 100/102).
   - Visual (maks 5 persen): SSIM rata-rata seluruh halaman minimal 0,95 langsung terhadap `BM.pdf`. Halaman atau figur di bawah ambang hanya diagnosis.

   Akibatnya templat harus mereproduksi tata letak manual sampai pemenggalan halaman, dan skema JSON v1 harus mampu mengungkapkan setiap konstruksi manual.
2. **Lingkungan render sudah dikalibrasi (research/05).** `BM.docx` asli dirender ulang dengan soffice 24.2.3.2 lokal dan fon per-user (konfigurasi B) menghasilkan 102 halaman, 101/102 halaman teks identik, SSIM rata-rata 0,9815, dan 88 halaman minimal 0,98. Sisa selisihnya: acuan menanam wajah SemiBold untuk teks tebal (khas fontconfig Linux) sedangkan lokal memakai Bold, dan Inter tidak terpakai lokal. Konfigurasi B sudah memenuhi D-17. Blueprint menguncinya secara reproducible untuk worker render (S91). Bundel fon SemiBold menjadi baris peningkatan opsional (S99).
3. **`BM.docx` memakai gaya Normal dengan format langsung di semua 748 paragraf dan menanam 18 fon (`word/fonts/*.odttf`).** Fon yang diminta: IBM Plex Serif 2.694 run, IBM Plex Mono 1.590, IBM Plex Sans Cond 1.161, DejaVu Sans 104, Courier 4, Symbol 4 (research/05). Konsekuensinya:
   - Semantik (judul bab, caption, baris sumber, rel bukti, aside) harus disimpulkan dari tanda tangan format langsung lewat klaster (S90).
   - Generator DOCX Node memakai format langsung per paragraf/run dan menanam fon. Pola ini sama dengan `DatumDocx` (helper `style_run`, `fmt_para`; research/03 §3.4), jadi paritas Python dan benchmark menuju arah yang sama.
   - Nama wajah di benchmark (`IBM Plex Sans Cond`) berbeda dari token Garis A (`IBM Plex Sans Condensed`). Nama wajah karena itu menjadi parameter templat, dan profil Manual 000 mengambilnya apa adanya.
4. **Asal-usul benchmark.** `build_manual_datum.py` (research/03 §2.3) membangun manual saudara "DATUM Document Manual 002" dari Markdown, bukan manual 000 (docstring baris 2-11, dibaca sesi ini). Skrip itu tetap rujukan pola DOCX DATUM (`oei`, `style_run`, `fix_table`, tangga garis `sz`). Pembangun manual 000 tidak ditemukan. Berkas 000 pernah diaudit di `C:\Users\TRIAL\workspace\gsp-hermes\workspace\docs\2026-10-08-datum-terpadu-audit\scripts\enh-1008\`: `k9_tambal_docx.py` membaca `BM.docx` dan menghitung U+2014 (baris 16-19). Itu rujukan cara baca, bukan acuan render.
5. **Jalur PDF dokumen = DOCX Node lalu `soffice --headless --convert-to pdf` (D-15).** Chromium hanya untuk artefak HTML, pratinjau UI, rasterisasi SVG ke PNG, dan metrik lint pasca-render. Paritas PDF Python lawan Node memakai mesin yang sama di kedua sisi.
6. **Tidak ada mesin "JSON ke dokumen" di sisi Python.** Harness paritas butuh adapter Python (JSON v1 ke panggilan `DatumDocx`) (D-04).
7. **Gambar benchmark (D-14).** Chart dan diagram manual ditulis ulang sebagai spec JSON dan dirender Node. Raster murni masuk sebagai aset. 18 halaman berfigur besar (9, 12, 19, 35, 37, 38, 40, 42, 50, 51, 54-61) diperkirakan menambah selisih visual 1,5-2,6 persen (hipotesis D-17). Harness melaporkan SSIM per figur di halaman itu.
8. **Chart.** Hanya bar/column/threshold dan diagram punya spec Python (paritas ketat). 55 jenis lain hanya ada di galeri matplotlib berdata beku. Sekitar 12 kode manual tanpa acuan Python (hipotesis; S02 menghitung).
9. **IL tidak punya tabel misi.** Studio menyimpan berkas di folder misi `SHARED_WORKSPACE/docs/<YYYY-MM-DD>_<slug>/`, mencatat barisnya di DB, dan tidak menulis `IlSearchDoc`.
10. **Batas kerja vs perilaku produk.** `.env` v2.1 disalin dari produksi (D-02). Tanpa akar sandbox, tulisan Studio akan mendarat di workspace produksi (KT-03).
11. **Ukuran.** Ada 99 baris S/M. 71 baris implementasi hanya bergantung kontrak (C) dan berjalan paralel menurut kepemilikan berkas (D-07, D-08). S99 opsional.

### 1.2 Kategori skala

Enhancement (Penyempurnaan besar). Postur verifikasi penuh (uji unit, integrasi, E2E, paritas, benchmark Manual 000, review kode, security review, verifier), digeser ke fase final sesuai D-07. Riset dan kalibrasi lingkungan ada di research/01-05. Inventaris klaster benchmark (S90) dan spesifikasi kontrak (S01) berjalan sebelum gelombang 0.

### 1.3 Asumsi (dibawa ke spesifikasi S01, dapat dikoreksi)

| ID | Asumsi | Dasar |
|---|---|---|
| A1 | Paritas Python lawan Node tidak harus identik byte. Benchmark Manual 000 memakai ambang D-17 | D-04, D-17 |
| A2 | Chromium memakai binari terpasang lewat `executablePath` (`C:\Users\TRIAL\AppData\Local\ms-playwright\chromium-1234`, `-1243`, terverifikasi Glob) | research/03 §11.2 |
| A3 | Render sinkron per permintaan. Chromium memakai semafor tunggal. soffice memakai profil `-env:UserInstallation` per job, maks 2 instans. `StudioRenderJob` mencatat setiap run | D-15 |
| A4 | Skema spec diagram v2.1 = Garis A (`class{}`) | D-10 |
| A5 | Parameter workbook/brief (P15) ada di registri tetapi tidak aktif | D-05 |
| A6 | Agent mengidentifikasi diri lewat `agentId` di badan permintaan | research/02 §2.5-2.6 |
| A7 | Penegakan peran ADMINISTRATOR untuk kelas K adalah hal baru dan hanya berlaku di Studio | research/02 §2.5 |
| A8 | Nilai `[REK]` katalog diganti nilai tabel `.docx` asli (research/04) | D-09 |
| A9 | Teks disimpan dan dirender apa adanya, tanpa transformasi tipografi. Kapital memakai properti run `caps`. Paragraf berupa `text` (md-lite, untuk agent) atau `runs[]` eksplisit (untuk reproduksi) | D-17(1) |
| A10 | Lint tidak pernah mencegah pembuatan berkas; ia menentukan status rilis (P16-01). Penolakan 422 saat ingest hanya untuk pelanggaran by-construction (grup S dan guard) | Benchmark memuat em dash (`k9_tambal_docx.py` baris 18) |
| A11 | Generator DOCX memakai format langsung per paragraf/run seperti `DatumDocx` dan `BM.docx`. styles.xml minimal, docDefaults dari templat, fon tertanam | research/05 baris 12; research/03 §3.4 |
| A12 | Lingkungan render terkunci = konfigurasi B research/05: soffice 24.2.3.2, fon per-user Plex 16 TTF + DejaVuSans + Inter terdaftar di HKCU. Worker memeriksa kesiapan fon saat mulai dan gagal cepat | research/05, D-16 |

### 1.4 Batasan (mengikat)

- Hanya repo `C:\Users\TRIAL\gsp-swarm-hq-v2.1` (branch `v2.1`) dan DB `gsp_agent_hq_v21` (localhost:5433). `gsp_agent_hq` produksi dan `~/gsp-datacenter` tidak disentuh. `HS`, `RL`, `VENV`, `BM` read-only. Impor Python harness memakai `-I -B`.
- Migrasi lewat `prisma migrate`. `db push` dilarang (`IlSearchDoc`).
- `next.config.ts` memakai `typescript.ignoreBuildErrors: true` (Grep baris 13), sehingga setiap baris menjalankan `npx tsc --noEmit` sendiri dan menyaring galat ke areanya.
- soffice dipanggil hanya lewat layanan S92, atau lewat profil sementara sendiri untuk S91, S64, S99. Profil default user tidak pernah dipakai. Setiap panggilan diberi batas waktu dan tree-kill (`taskkill /T /F`, pola `bridge.mjs`).
- Pendaftaran fon HKCU tidak diubah oleh baris mana pun; S91 hanya memverifikasi.
- Push ke remote hanya dengan izin user. Commit lokal di akhir fase final.

### 1.5 Kontinuitas

Intake, D-01..D-17, dan research/01-05 sudah tercatat. Revisi 3 menggantikan revisi 1 dan 2 secara utuh. Perubahan revisi 3:
- S91 kini "kunci lingkungan render", karena kalibrasi awal sudah dilakukan controller (research/05).
- S99 opsional (bundel SemiBold) ditambahkan.
- Ambang benchmark diubah ke D-17.
- Berkas riset S02/S90 dinomori 06/07, karena nomor 05 sudah terpakai.
- KT lama tentang SSIM halaman berfigur, pemasangan fon, dan plafon lingkungan gugur karena sudah diputus D-16/D-17, dan KT dinomori ulang.

### 1.6 Ringkasan arsitektur

#### Lapisan dan modul

| Lapis | Modul (usulan nama, dikunci S01) | Isi |
|---|---|---|
| Data (Prisma, migrasi baru) | `StudioTemplate`, `StudioTemplateVersion`, `StudioSectionType`, `StudioDocument`, `StudioRevision`, `StudioBlock`, `StudioArtifact`, `StudioOutputFile`, `StudioRenderJob` | Template berversi tak berubah. Dokumen dengan revisi bersnapshot penuh (apa/mengapa/dampak). Blok beralamat per revisi. Artefak mandiri. Berkas keluaran (path, sha256, format, vonis lint). Tautan misi sebagai kolom string `missionFolder`, `agentRequestId`, `hermesTaskId`, tanpa FK, sesuai pola repo |
| Kontrak | `src/lib/studio/contract/` | Tipe TS, skema JSON v1 (`studio.doc/v1`, `studio.chart/v1`, `studio.diagram/v1`, `studio.image/v1`, `studio.html/v1`), enum, registri section 51, konstanta route dan env (`SOFFICE_PATH`, akar penyimpanan), tipe manifest lingkungan render, antarmuka modul mesin, stub indeks per modul |
| Registri data | `src/lib/studio/params/`, `src/lib/studio/registry/` | 673 ParamDef. Registri chart 58 + 18 `drawn=false`. Registri lint 83 + 16 |
| Mesin | `src/lib/studio/engine/{tokens,bind,docx,soffice,html,browser,diagram,symbols,chart,lint}` | Port DATUM ke TypeScript (D-04). PDF dokumen lewat `soffice` (D-15) |
| Lingkungan render | `render-env/` | Manifest konfigurasi B (soffice, fon, sha256), skrip cek kesiapan, port pembanding kalibrasi |
| Layanan | `src/lib/studio/services/{ingest,templates,revisions,render,storage,images}` | Validasi, normalisasi, alamat, revisi, orkestrasi, penyimpanan per misi |
| API | `src/app/api/studio/**` | `requireSession` di setiap handler; kelas K hanya ADMINISTRATOR |
| UI | `src/app/studio/**`, `src/components/studio/**` | Editor template, penyusun section, penampil/penyunting beralamat, riwayat revisi, galeri artefak |
| Harness paritas | `scripts/parity/**`, `tests/parity/fixtures/**` | Adapter acuan Python, pembanding, CLI Node, runner |
| Benchmark Manual 000 | `benchmark/**` | Ekstraktor, `manual000/doc.json`, spec figur dan aset, profil templat, harness pembanding D-17 dan runner |

#### Alur agent ke IL (diagram teks)

```
Agent Hermes (profil gsp-*)                       User HQ (browser, sesi cookie)
  | POST JSON studio.doc/v1                         | UI /studio
  | header x-internal-secret, body agentId          |
  v                                                 v
[API /api/studio/*]  requireSession (3 jalur) + cek peran untuk kelas K
  | /validate (dry-run) atau /documents (simpan + render)
  v
[ingest] validator skema v1 -> by-construction (grup S, guard G1-G4, N1) -> 422 bila gagal
  |      -> normalisasi (text md-lite atau runs[] apa adanya) -> penomoran per bab
  |      -> alamat bab.seksi.paragraf -> pengikatan register (port datumbind)
  v
[DB] StudioDocument + StudioRevision r1 (snapshot) + StudioBlock (alamat)
  |
[template] StudioTemplateVersion -> token resolver:
  |        DATUM-kanonik (atau profil turunan, mis. Manual 000) -> override dokumen; kelas T dihitung
  v
[orkestrator render] StudioRenderJob  (worker: cek kesiapan render-env saat mulai)
  |-- DOCX : paket OOXML, format langsung per run, fon tertanam (odttf)
  |-- PDF  : DOCX -> soffice --headless --convert-to pdf (SOFFICE_PATH, -env:UserInstallation per job)
  |-- HTML : paged-media (CSS token, fon base64, tanpa skrip) -> artefak HTML mandiri + pratinjau UI
  |-- SVG  : diagram 9 keluarga / chart 58 jenis / simbol 41
  |-- PNG  : SVG -> Chromium 300 dpi (setContent, jaringan diblokir)
  v
[lint pasca-render] grup R, X, D, C (NOT-RUN jujur) -> status rilis per tier (tidak menahan berkas)
  v
[penyimpanan] <akar KT-03>/docs/<YYYY-MM-DD>_<misi>/studio/<nomor-berkas>/rev-<n>/<Judul nomor RevX>.<ext>
  |            StudioOutputFile (path, sha256, bytes, format, lint) + cek AgentRequest/HermesTask ada
  v
[IL] GET /api/information-library menampilkan folder misi dan berkasnya (tanpa tulis IlSearchDoc)
```

#### Skema masukan agent (garis besar; medan final dikunci S01)

`studio.doc/v1`: `template {slug, version?}`, `mission {folder?, agentRequestId?, hermesTaskId?}`, `meta {title, docNumber, rev, typeCode, tier NOTA/TERBIT/SERAH, classification, language, author, issueDate}`, `register {<kunci>: {v, dec, unit, mark TERUKUR/DITURUNKAN/PEMASOK/ASUMSI, src}}`, `front {cover, controlSheet, toc, signature}`, `parts [...]`, `chapters [{kicker, title, sections [{title, blocks [{type: <sectionType>, text atau runs[], rail[], ...}]}]}]`, `appendices [...]`, `assets {<id>: {kind: raster, path, sha256}}`, `outputs [docx, pdf, html]`. Chart/diagram tertanam memakai `studio.chart/v1` (bentuk `datumchart` B + kode jenis) dan `studio.diagram/v1` (Garis A).

Alamat (usulan, dikunci S01): `C.S.P` (mis. `3.2.4`), lampiran berhuruf (`A.1.2`), artefak per bab (`Tabel 3.1`, `Gambar 3.2`, `Turunan D-3.1`), halaman depan `F:cover`, `F:controlSheet`.

## Structured Task Breakdown

Pemetaan kolom permintaan ke kolom standar (V2 menghitung 8 kolom standar): ID = Step; Langkah = Task Description (memuat "Masukan: ..."); Agen = Agent_to_Invoke; Dependensi = Depends On (setiap tepi berlabel `:B` build atau `:C` contract); Keluaran/Expected paths = Expected Output (penanda EXISTS / NEW under / docs); Verifikasi = Verification (maks 3 cek); Phase = Phase.

Catatan baca:
- Untuk baris implementasi (D-07), verifikasi per baris hanya penjaga kompilasi atau kelengkapan data (tsc, eslint, py_compile, klaim berkas, hitungan), bukan uji. S91 mengukur ulang lingkungan, bukan kode aplikasi.
- Setiap baris paralel juga menulis catatan `<task>/delegation_progress/<agent>_<sNN>.md` (§8, bukan deliverable).
- Urutan nomor tidak sama dengan urutan gelombang; gelombang ada di Execution Profile.
- S99 bertanda OPSIONAL: tidak ada baris lain yang bergantung padanya.

| Step | Task Description | Agent_to_Invoke | Skills_to_Load | Expected Output | Depends On | Verification | Phase |
|---|---|---|---|---|---|---|---|
| S01 | Tulis register nama dan konstanta + spesifikasi kontrak: 9 model Prisma dan medannya, enum, tabel route API, medan skema JSON v1 (doc/chart/diagram/image/html, termasuk runs[] eksplisit, nama wajah apa adanya, aset raster), tata bahasa alamat, tata letak penyimpanan per misi, dependensi npm berversi, kontrak soffice dan manifest render-env (SOFFICE_PATH, profil per job, cek kesiapan fon, galat bila tidak siap), antarmuka modul mesin, daftar stub, antarmuka CLI harness, rollback SQL. Masukan: research 01-05, research/07 (S90), decisions D-01..D-17, §1.6 | data-analyst | - | NEW <task>/masterplan/01_specs.md | S90:B | setiap model, route, enum, dan stub bernama tepat sekali; rollback SQL, versi dependensi, kontrak soffice, dan manifest render-env tercantum; setiap klaster format research/07 terpetakan ke jenis section atau parameter (0 sisa) | masterplan |
| S02 | Peta kode chart dan matriks paritas: 58 kode manual P/H/K/W/S/G ke acuan Python (datumchart B / fungsi VC pustakachart A / tanpa acuan), 18 jenis drawn=false, lalu per format dan jenis: acuan, metode banding, ambang usulan. Masukan: research 01 §3.6, research 03 §3.10, §4.2, §7 | data-analyst | - | NEW <task>/research/06_chart_map_parity_matrix.md | none | 58 kode + 18 drawn=false terhitung; setiap kode punya acuan atau label tanpa-acuan; ambang usulan per format tercantum | research |
| S03 | Contract landing gelombang 0 (sendirian): tambah 9 model Studio ke schema.prisma, buat dan terapkan migrasi ke gsp_agent_hq_v21 lewat prisma migrate (tanpa db push), tipe TS, skema JSON v1, enum dan registri section 51, konstanta route dan env, tipe manifest render-env, antarmuka modul mesin (termasuk soffice), stub indeks kosong per modul, stub params dan registry, pasang dependensi npm dari S01, tulis marker. Masukan: masterplan/01_specs.md | coder-execution | backend-execution, dry-run-verify-fix | EXISTS prisma/schema.prisma (aditif); NEW under prisma/migrations/: migrasi studio; NEW under src/lib/: studio/contract + stub; EXISTS package.json, package-lock.json; NEW <task>/implementation/01_contract_landed.md (marker) | S01:B | prisma validate lulus dan prisma migrate status bersih di v21; tsc --noEmit tanpa galat di src/lib/studio; marker ada dengan hitungan registri section 51 | implementation |
| S04 | Isi stub parameter tata kelola, tier, penamaan, bahasa, kanal, gerbang, lampiran: P1 (4), P3 (24), P11-14 (44), P15 (31), P16 (8), PA-PD (4) = 115 ParamDef; nilai [REK] dari research 04 (D-09). Masukan: research 01 §3.1, §3.2, §3.9-3.12 | coder-execution | dry-run-verify-fix | NEW under src/lib/: studio/params/governance-language.ts (stub S03) | S03:B | hitungan 115 cocok katalog; tsc bersih pada berkas | implementation |
| S05 | Isi stub parameter warna dan tipografi: P4C (35) + P4T dasar 18 + skala 67 + prosa 14 = 134 ParamDef; nilai [REK] dari research 04. Masukan: research 01 §3.3.1-3.3.4 | coder-execution | dry-run-verify-fix | NEW under src/lib/: studio/params/color-type.ts (stub S03) | S03:B | hitungan 134 cocok katalog; tsc bersih pada berkas | implementation |
| S06 | Isi stub parameter halaman: grid 17, garis 15, perangkat tanda tangan 27, sampul 16, lembar kendali 6, anatomi 10 = 91 ParamDef. Masukan: research 01 §3.3.5-3.3.10, research 04 | coder-execution | dry-run-verify-fix | NEW under src/lib/: studio/params/page.ts (stub S03) | S03:B | hitungan 91 cocok katalog; tsc bersih pada berkas | implementation |
| S07 | Isi stub parameter aparatus bukti dan kepatuhan: P5 (68) + P6 (43) = 111 ParamDef. Masukan: research 01 §3.4-3.5, research 04 | coder-execution | dry-run-verify-fix | NEW under src/lib/: studio/params/apparatus.ts (stub S03) | S03:B | hitungan 111 cocok katalog; tsc bersih pada berkas | implementation |
| S08 | Isi stub parameter figur global: chart P7 (36) + peta P8 (2) + diagram P9 (55) + simbol P10 (42) = 135 ParamDef. Masukan: research 01 §3.6.1, §3.6.3, §3.7, §3.8 | coder-execution | dry-run-verify-fix | NEW under src/lib/: studio/params/figure.ts (stub S03) | S03:B | hitungan 135 cocok katalog; tsc bersih pada berkas | implementation |
| S09 | Isi stub registri chart: 58 jenis (kode, nama, kelompok, fungsi, pakai/hindari, 87 parameter khusus) + 18 jenis drawn=false + rujukan acuan Python dari S02. Masukan: research 01 §3.6.2, research/06 | coder-execution | dry-run-verify-fix | NEW under src/lib/: studio/registry/charts.ts (stub S03) | S02:B, S03:B | 58 + 18 entri dan 87 parameter terhitung; tsc bersih pada berkas | implementation |
| S10 | Isi stub registri lint: 39 lint (batas, tahap, mode HQ S/R/X/M), 4 guard, 19 pemindai bahasa, 21 cek struktur D = 83 otomatis, + 16 pemeriksaan manusia H01-H16 dengan tier aktif. Masukan: research 01 §5, §6 | coder-execution | dry-run-verify-fix | NEW under src/lib/: studio/registry/lint.ts (stub S03) | S03:B | 83 + 16 entri terhitung; tsc bersih pada berkas | implementation |
| S11 | Mesin token: gabung DATUM-kanonik atau profil turunan ke override dokumen; hitung kelas T (fullSpan, kisi X/Y, lebar figur sah, railMode A/B, rederivasi non-A4); tolak override kelas K tanpa peran admin. Masukan: kontrak, params | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/tokens | S03:B, S05:C, S06:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S12 | Mesin register dan turunan (port datumbind): Register (tolak tanda dan satuan kosong), format angka DATUM, Derivation dengan parser aritmetika aman tanpa eval atau Function, audit_text, audit_retired. Masukan: HS datumbind.py | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/bind | S03:B | tsc tanpa galat di area; eslint area bersih; grep tanpa eval/new Function di area | implementation |
| S13 | Salin aset acuan read-only ke repo dengan manifest sha256: 16 ttf IBM Plex + DejaVuSans dari RL assets/fonts, default.docx python-docx dari VENV site-packages, logo RL assets/logo hanya bila KT-15 = ya. Masukan: path terverifikasi §1 | coder-execution | dry-run-verify-fix | NEW under src/lib/: studio/assets (fonts, base, logo, manifest) | S03:B | sha256 setiap salinan sama dengan sumber; jumlah berkas sesuai manifest | implementation |
| S14 | DOCX paket inti OOXML: basis default.docx (S13), docDefaults dan styles.xml minimal dari templat, settings updateFields, properti inti, sectPr per seksi (A4, margin, kolom, header/footer berbeda per seksi sampai 29 seksi), header/footer running head + blok register (NUMPAGES), wadah fon tertanam, zip deterministik. Masukan: HS datum_docx.py, build_manual_datum.py (pola), research/05 | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/docx/package | S03:B, S11:C, S13:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S15 | DOCX penanaman fon: port skema odttf terobfuskasi dari RL embed_fonts.py (tanpa Word COM) untuk keluarga yang dipakai dokumen (Plex, DejaVu, Inter bila dirujuk). Masukan: RL scripts/embed_fonts.py | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/docx/fonts | S03:B, S13:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S16 | DOCX blok teks dengan format langsung per paragraf/run: chapter (kicker BAB n, Datum Rule, judul label), section (nomor mono + judul), paragraph (md-lite atau runs[] apa adanya, caps sebagai properti), list, aside 5 varian, monoBlock, assumptionInline, chip rel bukti moda A. Masukan: HS datum_docx.py heading/para/rail_chip | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/docx/blocks | S03:B, S11:C, S12:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S17 | DOCX keluarga tabel: table (garis mendatar saja, kepala, pita kelompok, total, kolom satuan, SUMBER + PROVENANS), specTable, registerTable 8 preset, financialTable 3 preset, checklist, glossary, sourceRegister, ruleIndex, referenceScale, ruleTable, exampleWrongRight; solve_widths dan guard G1-G4. Masukan: HS datum_docx.py, datumcheck.py, research/04 | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/docx/tables | S03:B, S11:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S18 | DOCX halaman pembungkus: cover rata kiri (pita segel, logo sekali, blok kendali, kolofon), controlSheet, toc (medan TOC), partDivider, signatureBlock, pembuka appendix; perangkat seal band, spine, issue stamp, datum rule (citra rule di header/footer). Masukan: HS datum_docx.py cover | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/docx/wrapper | S03:B, S11:C, S13:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S19 | DOCX figur dan turunan: tempatkan chart, diagram, image (PNG 300 dpi dari layanan browser, atau aset raster) dengan spasi baris tepat, caption satu kalimat, SUMBER + PROVENANS; blok derivation; symbolSheet. Masukan: HS datum_docx.py figure/derivation | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/docx/figures | S03:B, S12:C, S25:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S20 | DOCX perakit: telusuri model ternormalisasi, penomoran per bab (Tabel n.m, Gambar n.m, Turunan D-n.m), panggil modul S14-S19 lewat antarmuka kontrak, hasilkan buffer .docx deterministik. Masukan: kontrak | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/docx/assemble | S03:B, S14:C, S15:C, S16:C, S17:C, S18:C, S19:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S21 | HTML dasar paged-media untuk artefak HTML dan pratinjau UI (bukan sumber PDF dokumen, D-15): CSS dari token, @font-face Plex base64, @page A4 dan margin grid, kolom rel moda A/B, running head dan LEMBAR n DARI N. Masukan: kontrak, RL assets/Sumber Lembar Bukti.html | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/html/base | S03:B, S11:C, S13:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S22 | HTML blok teks dan pembungkus: padanan HTML semantik untuk himpunan S16 + S18. Masukan: kontrak | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/html/blocks | S03:B, S12:C, S21:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S23 | HTML tabel, figur (SVG inline berteks nyata), dan derivation: padanan himpunan S17 + S19. Masukan: kontrak | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/html/tables | S03:B, S12:C, S21:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S24 | HTML perakit dan artefak HTML mandiri: satu berkas, fon tertanam, tanpa skrip, tanpa rujukan eksternal; juga sumber pratinjau UI. Masukan: kontrak | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/html/assemble | S03:B, S21:C, S22:C, S23:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S25 | Layanan browser: playwright-core dengan executablePath Chromium terpasang, instans tunggal + semafor, setContent saja (file:// gagal, research 03 §4.4), blokir request jaringan, JS mati, rasterisasi SVG ke PNG 300 dpi pada ukuran mm, metrik tata letak untuk lint R, pratinjau HTML; batas waktu. Masukan: kontrak, S01 | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/browser | S03:B | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S26 | Diagram inti (port HS datum_diagram.py): load_spec + tolak Mermaid (DATUM-31), validate_spec penuh, Sheet dan kisi 10,6667 x 4,7625 mm, primitif SVG (teks Plex, 10 bentuk, 6 jenis penghubung + pola garis), estimate. Masukan: HS datum_diagram.py | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/diagram/core | S03:B, S11:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S27 | Diagram tata letak layered (juga stack, topology) dan flow (per_row). Masukan: HS datum_diagram.py | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/diagram/layout-a | S03:B, S26:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S28 | Diagram tata letak swimlane dan sequence. Masukan: HS datum_diagram.py | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/diagram/layout-b | S03:B, S26:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S29 | Diagram tata letak sld, rack, graph. Masukan: HS datum_diagram.py | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/diagram/layout-c | S03:B, S26:C, S31:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S30 | Diagram rute dan rakitan: route_edges (jangkar dikipas, hindari kotak tak terkait), add_crossing_hops (r 0,9 mm), build_svg (zona, legenda baris KUNCI, catatan, laporan checks_run, gerbang release labels_verified). Masukan: HS datum_diagram.py | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/diagram/build | S03:B, S26:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S31 | Pustaka simbol: port HS datumsimbol.py (41 simbol, dialek iec/isa/sec/mil, lembar per dialek blok 247 mm) + ports_in_mm dari RL datum_symbols.py. Masukan: kedua skrip | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/symbols | S03:B, S11:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S32 | Chart inti: kanvas mm 128/166, skala dan sumbu (nol untuk bar/column/area), label langsung, baris KUNCI, caption dan SUMBER, peran warna (aksen maks 1, maks 5 warna), font min 5,5 pt, tinggi maks 247 mm, format angka DATUM; keluarga bar, column, threshold (port RL datumchart.py). Masukan: RL datumchart.py, params figure | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/chart/core | S03:B, S09:C, S11:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S33 | Chart P-03..P-08: grouped column, lollipop, dot plot, dumbbell, range plot, slope, dengan parameter khusus registri dan rujukan VC dari S02. Masukan: research/06, HS pustakachart.py | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/chart/family-p1 | S02:B, S03:B, S32:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S34 | Chart P-09, P-10, P-12..P-15: bullet, waterfall, small multiples, quadrant, arrow chart, table chart. Masukan: research/06, HS pustakachart.py | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/chart/family-p2 | S02:B, S03:B, S32:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S35 | Chart H-01..H-05: scatter, bubble, heatmap (ramp per KT-08), connected scatter, hexbin. Masukan: research/06, HS pustakachart.py | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/chart/family-h1 | S02:B, S03:B, S32:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S36 | Chart H-06..H-09: contour, network, arc diagram, venn/euler. Masukan: research/06, HS pustakachart.py | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/chart/family-h2 | S02:B, S03:B, S32:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S37 | Chart K-01..K-06: stacked bar, 100 persen stacked bar, diverging bar, population pyramid, donut, pie. Masukan: research/06, HS pustakachart.py | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/chart/family-k1 | S02:B, S03:B, S32:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S38 | Chart K-07..K-12: waffle, icon array, treemap, funnel, sankey, marimekko. Masukan: research/06, HS pustakachart.py | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/chart/family-k2 | S02:B, S03:B, S32:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S39 | Chart W-01..W-05: line, column waktu, step line, area, stacked area. Masukan: research/06, HS pustakachart.py | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/chart/family-w1 | S02:B, S03:B, S32:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S40 | Chart W-06..W-10: bump, gantt, barcode, horizon, candlestick. Masukan: research/06, HS pustakachart.py | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/chart/family-w2 | S02:B, S03:B, S32:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S41 | Chart S-01..S-04: histogram, box plot, density, violin. Masukan: research/06, HS pustakachart.py | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/chart/family-s1 | S02:B, S03:B, S32:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S42 | Chart S-05..S-08: ridgeline, strip/jitter, beeswarm, radial histogram. Masukan: research/06, HS pustakachart.py | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/chart/family-s2 | S02:B, S03:B, S32:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S43 | Chart G-01..G-04: tile map 38 provinsi, dot map dan flow map (menurut KT-12), flowchart lewat tata letak flow mesin diagram. Masukan: research/06, HS pustakachart.py | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/chart/family-g | S02:B, S03:B, S27:C, S32:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S44 | Lint inti: runner (status PASS/FAIL/NOT-RUN/REPORT, banner, status rilis per tier P16-01, tidak menahan berkas), pemindai teks X (03 em dash berparameter KT-06, 04, 16, 17, 19, 31, 38, 39), guard G1-G4 dan N1. Masukan: HS scripts/datum_lint.py, datumcheck.py | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/lint/scan | S03:B, S10:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S45 | Lint pasca-render R pada HTML dan SVG lewat metrik tata letak Chromium: 14, 15, 25, 28, 32, 33, 37. Masukan: registri lint, RL datum_render.py check_page | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/lint/render | S03:B, S10:C, S25:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S46 | Lint struktur D01-D21 (audit angka terhadap register, turunan dihitung ulang, logo sekali, section wajib per tier, labels_verified, Admiralty sekali) + penegasan grup S by-construction. Masukan: research 01 §6.2 | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/lint/structure | S03:B, S10:C, S12:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S47 | Lint bahasa grup C (19 butir): bangun yang definisinya ada di manual, sisanya NOT-RUN dengan nama alat (G-07, KT-13). Masukan: research 01 §3.9, §6.2 | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/lint/language | S03:B, S10:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S48 | Layanan ingest: validasi skema JSON v1, normalisasi ke model dokumen (text md-lite atau runs[] apa adanya), penomoran dan alamat bab.seksi.paragraf, pengikatan register, tolak by-construction dengan ID cek (422). Masukan: kontrak | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/services/ingest | S03:B, S12:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S49 | Layanan template: CRUD Template dan TemplateVersion tak berubah (ubah = versi baru), pewarisan dari DATUM-kanonik, profil turunan, kelas K hanya ADMINISTRATOR (KT-16), kelas T dihitung ulang, rencana section per tier. Masukan: kontrak | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/services/templates | S03:B, S11:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S50 | Layanan revisi: sunting blok per alamat menghasilkan revisi baru (apa, mengapa, dampak wajib), snapshot penuh per revisi, diff blok, riwayat, buka dan render ulang revisi lama. Masukan: kontrak | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/services/revisions | S03:B, S48:C, S51:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S51 | Orkestrator render: StudioRenderJob, cek kesiapan render-env saat worker mulai, pilih renderer per format (DOCX, PDF lewat soffice, HTML, SVG/PNG), rakit figur, jalankan lint, tetapkan status rilis per tier, serahkan ke penyimpanan; keluaran deterministik. Masukan: kontrak | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/services/render | S03:B, S20:C, S24:C, S25:C, S30:C, S32:C, S44:C, S52:C, S92:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S52 | Layanan penyimpanan dan tautan misi: akar menurut KT-03, jalur docs/misi/studio/nomor/rev-n, nama berkas DATUM tanpa garis bawah, guard traversal, sha256, StudioOutputFile, cek keberadaan folder misi, AgentRequest, HermesTask. Masukan: kontrak, research 02 §2.4, §2.7 | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/services/storage | S03:B | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S53 | Layanan gambar: dekode base64 atau multipart, sniff MIME PNG/JPEG, baca dimensi tanpa dependensi native, px_guard (min 150 dpi efektif, 300 untuk chart), batas ukuran. Masukan: HS datumcheck.py px_guard | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/services/images | S03:B | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S54 | Route /api/studio/templates dan /api/studio/registry (section, parameter, chart, diagram, lint, unduh skema JSON v1); requireSession di setiap handler. Masukan: kontrak | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/app/api/: studio/templates, studio/registry | S03:B, S49:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S55 | Route /api/studio/documents (POST ingest + render, GET daftar per misi), /api/studio/documents/[id] (GET), /api/studio/validate (POST dry-run tanpa simpan). Masukan: kontrak | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/app/api/: studio/documents/route.ts, studio/documents/[id]/route.ts, studio/validate | S03:B, S48:C, S51:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S56 | Route /api/studio/documents/[id]/blocks/[address] (GET, PATCH dengan apa/mengapa/dampak) dan /api/studio/documents/[id]/revisions (GET riwayat, POST render ulang). Masukan: kontrak | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/app/api/: studio/documents/[id]/blocks, studio/documents/[id]/revisions | S03:B, S50:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S57 | Route /api/studio/artifacts (chart, diagram, image, html mandiri) dan /api/studio/files/[id] (sajikan berkas dengan Content-Type benar, guard sesi dan jalur). Masukan: kontrak | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/app/api/: studio/artifacts, studio/files | S03:B, S51:C, S52:C, S53:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S58 | UI daftar template dan editor parameter: form dihasilkan dari registri (B dapat disunting, K terkunci kecuali admin, T tampil terhitung), simpan = versi baru, riwayat versi. Masukan: kontrak, globals.css, ui/kit.tsx | coder-execution | frontend-integration, dry-run-verify-fix | NEW under src/app/: studio/templates (kecuali [id]/sections); NEW under src/components/: studio/template-editor | S03:B, S54:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S59 | UI penyusun section: pilih dan urutkan jenis section per template dan tier, pratinjau HTML lewat API validate. Masukan: kontrak | coder-execution | frontend-integration, dry-run-verify-fix | NEW under src/app/: studio/templates/[id]/sections; NEW under src/components/: studio/section-composer | S03:B, S54:C, S55:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S60 | UI beranda Studio, layout sub-navigasi, daftar dokumen per misi, penampil dokumen (pohon bab/seksi/paragraf beralamat, unduh berkas, tautan misi dan AgentRequest). Masukan: kontrak | coder-execution | frontend-integration, dry-run-verify-fix | NEW under src/app/: studio/page.tsx, studio/layout.tsx, studio/documents (kecuali [id]/edit dan [id]/revisions); NEW under src/components/: studio/document-viewer | S03:B, S55:C, S57:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S61 | UI sunting per alamat (dialog apa/mengapa/dampak) dan riwayat revisi dengan diff serta render ulang revisi lama. Masukan: kontrak | coder-execution | frontend-integration, dry-run-verify-fix | NEW under src/app/: studio/documents/[id]/edit, studio/documents/[id]/revisions; NEW under src/components/: studio/revision | S03:B, S56:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S62 | UI galeri artefak (chart, diagram, gambar, HTML): daftar, pratinjau, buat dari template + JSON. Masukan: kontrak | coder-execution | frontend-integration, dry-run-verify-fix | NEW under src/app/: studio/artifacts; NEW under src/components/: studio/artifact-gallery | S03:B, S57:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S63 | Korpus fixture paritas: dokumen JSON v1 yang mencakup 29 jenis section dan 3 tier, spec diagram 9 keluarga (termasuk good_layered dan good_sld Garis A), spec chart per kode yang punya acuan (research/06), 41 simbol. Masukan: kontrak, HS fixtures_diagram | coder-execution | dry-run-verify-fix | NEW under tests/: parity/fixtures | S02:B, S03:B | setiap fixture lolos skema v1 lewat validator kontrak; cakupan 29 section dan 9 keluarga terhitung; klaim = berkas tertulis | implementation |
| S64 | Adapter acuan Python dokumen: JSON v1 ke panggilan DatumDocx/datumbind Garis A (+ pelengkap Rev L per D-10), DOCX ke PDF lewat soffice (SOFFICE_PATH, profil per job); impor skill read-only dengan VENV -I -B. Masukan: antarmuka CLI S01, HS datum_docx.py | coder-execution | dry-run-verify-fix | NEW under scripts/: parity/reference/doc | S01:B, S03:B | py_compile lulus; CLI --help exit 0; klaim = berkas tertulis | implementation |
| S65 | Adapter acuan Python figur: diagram ke build_svg Garis A, chart bar/column/threshold ke datumchart B, kode bertanda VC ke fungsi pustakachart dengan data disuntik, simbol ke datumsimbol, SVG ke PNG via Playwright Python set_content. Masukan: research/06, S01 | coder-execution | dry-run-verify-fix | NEW under scripts/: parity/reference/fig | S01:B, S02:B, S03:B | py_compile lulus; CLI --help exit 0; klaim = berkas tertulis | implementation |
| S66 | Pembanding Python: DOCX (XML kanonik, teks, gaya, tabel, sectPr), PDF (jumlah halaman, teks per halaman, SSIM per halaman dengan metode CAL 7x7 abu-abu 72 dpi, fon tertanam), SVG (struktur, geometri bertoleransi), PNG (diff piksel dan SSIM); modul SSIM dipakai ulang benchmark. Masukan: S01, research/06, CAL | coder-execution | dry-run-verify-fix | NEW under scripts/: parity/compare | S01:B, S02:B, S03:B | py_compile lulus; CLI --help exit 0; klaim = berkas tertulis | implementation |
| S67 | CLI render Node (tsx) atas berkas JSON v1 + templat opsional dan runner harness paritas: acuan Python, lalu Node, lalu pembanding, lalu laporan JSON dan MD; biner ke tests/parity/out (gitignore oleh S69). Masukan: kontrak, S01 | coder-execution | backend-execution, dry-run-verify-fix | NEW under scripts/: parity/run | S03:B, S64:C, S65:C, S66:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S68 | Panduan agent (cara POST JSON v1, contoh minimal per jenis, kode galat 400/401/403/422, alamat dan revisi) dan seksi Studio di API-REFERENCE.md. Masukan: route S54-S57, kontrak | data-analyst | - | NEW under docs/: STUDIO-AGENT-GUIDE.md; EXISTS docs/API-REFERENCE.md (seksi baru) | S54:B, S55:B, S56:B, S57:B | setiap route Studio tercantum dengan metode dan contoh; contoh JSON lolos validator kontrak | implementation |
| S69 | Integrasi (daftar tetap, pemilik tunggal): entri Studio di navGroups sidebar.tsx, entri NAV command-palette.tsx, serverExternalPackages playwright-core di next.config.ts, .gitignore untuk tests/parity/out, benchmark/out, render-env/out, dan akar sandbox KT-03, dependensi tertunda dari file_requests. Masukan: file_requests.md | coder-execution | dry-run-verify-fix | EXISTS src/components/sidebar.tsx, src/components/command-palette.tsx, next.config.ts, .gitignore | S25:C, S60:B | tsc tanpa galat di area; npm run build sukses; /studio ada di sidebar dan palet | implementation |
| S70 | Seed profil DATUM-kanonik (673 parameter, rencana section per tier) dan 51 baris StudioSectionType ke gsp_agent_hq_v21 lewat skrip seed idempoten. Masukan: params, registri | coder-execution | backend-execution, dry-run-verify-fix | NEW under prisma/: seed-studio.ts (+ baris seed di DB v21) | S04:B, S05:B, S06:B, S07:B, S08:B, S09:B, S10:B, S49:C | seed dijalankan dua kali tanpa duplikat; hitungan 673 parameter dan 51 section di DB | implementation |
| S71 | Uji unit mesin inti: token (turunan T, kunci K), bind (format angka, Derivation, parser aman), lint (scan, render, struktur, bahasa NOT-RUN jujur). Masukan: modul terkait | test-expert | tdd | NEW under tests/: studio/unit/engine-core | S11:B, S12:B, S44:B, S45:B, S46:B, S47:B | suite dijalankan dan keluaran dikutip; hitungan lulus/gagal per berkas; kegagalan dipetakan ke baris pemilik | test |
| S72 | Uji unit renderer DOCX, HTML, soffice: struktur XML per jenis section, determinisme (sha256 sama dua kali), CSS token, smoke PDF lewat layanan soffice dan cek kesiapan render-env. Masukan: modul terkait | test-expert | tdd | NEW under tests/: studio/unit/renderers | S14:B, S15:B, S16:B, S17:B, S18:B, S19:B, S20:B, S21:B, S22:B, S23:B, S24:B, S25:B, S92:B | suite dijalankan dan keluaran dikutip; hitungan lulus/gagal per berkas; kegagalan dipetakan ke baris pemilik | test |
| S73 | Uji unit diagram (17 kasus bad_cases Garis A sebagai fixture negatif), simbol 41, chart inti dan keluarga. Masukan: modul terkait | test-expert | tdd | NEW under tests/: studio/unit/figures | S26:B, S27:B, S28:B, S29:B, S30:B, S31:B, S32:B, S33:B, S34:B, S35:B, S36:B, S37:B, S38:B, S39:B, S40:B, S41:B, S42:B, S43:B | suite dijalankan dan keluaran dikutip; hitungan lulus/gagal per berkas; kegagalan dipetakan ke baris pemilik | test |
| S74 | Uji route dan layanan (prisma di-mock): 3 jalur auth dan 401 anonim, 403 ubah kelas K oleh non-admin, 422 by-construction, alur revisi. Masukan: pola tests/unit/reject-reason-route.test.ts | test-expert | tdd | NEW under tests/: studio/unit/api | S48:B, S49:B, S50:B, S51:B, S52:B, S53:B, S54:B, S55:B, S56:B, S57:B | suite dijalankan dan keluaran dikutip; hitungan lulus/gagal per berkas; kegagalan dipetakan ke baris pemilik | test |
| S75 | Uji integrasi pada DB uji (KT-04) dan akar penyimpanan sementara: ingest, render (termasuk PDF soffice), berkas di disk dengan sha256 cocok DB, sunting, revisi, render ulang revisi lama identik. Masukan: fixture S63 | test-expert | tdd | NEW under tests/: studio/integration; NEW <task>/test/01_integration_db.md | S48:B, S50:B, S51:B, S52:B, S70:B | suite dijalankan dan keluaran dikutip; determinisme render ulang terbukti sha256 DOCX; DB produksi tidak tersentuh (nama DB dikutip) | test |
| S76 | Jalankan harness paritas DOCX (struktur XML, teks, gaya) atas seluruh fixture dokumen. Masukan: harness S64, S66, S67 | test-expert | tdd | NEW <task>/test/02_parity_docx.md | S20:B, S63:B, S64:B, S66:B, S67:B | N fixture dijalankan dan keluaran dikutip; vonis per fixture terhadap ambang research/06; kegagalan dipetakan ke baris pemilik | test |
| S77 | Jalankan harness paritas PDF dengan mesin sama: DOCX Python lewat soffice lawan DOCX Node lewat soffice, per halaman (jumlah, teks, SSIM). Masukan: harness | test-expert | tdd | NEW <task>/test/03_parity_pdf.md | S20:B, S63:B, S64:B, S66:B, S67:B, S92:B | N fixture dijalankan dan keluaran dikutip; vonis terhadap kriteria §7.3; kegagalan dipetakan ke baris pemilik | test |
| S78 | Jalankan harness paritas diagram dan simbol (diff struktur SVG + diff piksel PNG). Masukan: harness | test-expert | tdd | NEW <task>/test/04_parity_diagram.md | S30:B, S31:B, S63:B, S65:B, S66:B, S67:B | 9 keluarga dan 41 simbol dijalankan; vonis per fixture terhadap ambang; kegagalan dipetakan ke baris pemilik | test |
| S79 | Jalankan harness paritas chart (SVG + PNG) untuk semua kode yang punya acuan; kode tanpa acuan diperiksa lint saja. Masukan: harness | test-expert | tdd | NEW <task>/test/05_parity_chart.md | S32:B, S33:B, S34:B, S35:B, S36:B, S37:B, S38:B, S39:B, S40:B, S41:B, S42:B, S43:B, S63:B, S65:B, S66:B, S67:B | setiap kode dalam lingkup KT-01 dijalankan; vonis per kode terhadap kriteria KT-02; kegagalan dipetakan ke baris pemilik | test |
| S80 | Sesi E2E browser tunggal terskrip: alur A (agent POST lalu berkas), T (template dan versi), E (sunting alamat, revisi, render ulang), G (galeri), N (sidebar dan palet). Masukan: HQ hidup di 9011 | test-expert | tdd, webapp-testing | NEW under tests/: studio/e2e; NEW <task>/test/06_e2e_session.md | S54:B, S55:B, S56:B, S57:B, S58:B, S59:B, S60:B, S61:B, S62:B, S69:B, S70:B | lima alur dijalankan dengan tangkapan layar; galat konsol nol; kegagalan dipetakan ke baris pemilik | test |
| S81 | Ukur anggaran kinerja lewat CLI S67: dokumen fixture 30 halaman (DOCX + PDF soffice + HTML), Manual 000 penuh, satu chart, satu diagram; p50 dan p95 (ambang usulan dokumen 30 halaman 60 s, figur 5 s). Masukan: CLI S67 | test-expert | tdd | NEW <task>/test/07_performance.md | S51:B, S67:B, S92:B | angka p50/p95 dikutip dari keluaran; vonis terhadap ambang | test |
| S82 | Gladi rollback pada DB uji: terapkan rollback SQL dari masterplan/01_specs.md, pastikan tabel Studio hilang, tabel lama utuh (hitungan baris), prisma migrate status konsisten. Masukan: S01, DB uji S75 | test-expert | tdd | NEW <task>/test/08_rollback_rehearsal.md | S03:B, S75:B | hitungan baris tabel lama sebelum dan sesudah sama; tabel Studio tidak ada; keluaran perintah dikutip | test |
| S83 | Review kode mesin dokumen: DOCX, HTML, browser, soffice, render-env (S14-S25, S91, S92). Masukan: diff area | senior-code-reviewer | code-review-senior | NEW <task>/gateway_check/02_review_engine_docs.md | S14:B, S15:B, S16:B, S17:B, S18:B, S19:B, S20:B, S21:B, S22:B, S23:B, S24:B, S25:B, S91:B, S92:B | vonis PASS/CAUTION/FAIL per modul; setiap temuan punya berkas:baris dan baris pemilik | gateway_check |
| S84 | Review kode mesin figur: diagram, simbol, chart (S26-S43). Masukan: diff area | senior-code-reviewer | code-review-senior | NEW <task>/gateway_check/03_review_figures.md | S26:B, S27:B, S28:B, S29:B, S30:B, S31:B, S32:B, S33:B, S34:B, S35:B, S36:B, S37:B, S38:B, S39:B, S40:B, S41:B, S42:B, S43:B | vonis PASS/CAUTION/FAIL per modul; setiap temuan punya berkas:baris dan baris pemilik | gateway_check |
| S85 | Review kode kontrak, migrasi, token, bind, lint, layanan, route, seed. Masukan: diff area | senior-code-reviewer | code-review-senior | NEW <task>/gateway_check/04_review_services_api.md | S03:B, S11:B, S12:B, S44:B, S45:B, S46:B, S47:B, S48:B, S49:B, S50:B, S51:B, S52:B, S53:B, S54:B, S55:B, S56:B, S57:B, S70:B | vonis PASS/CAUTION/FAIL per modul; setiap temuan punya berkas:baris dan baris pemilik | gateway_check |
| S86 | Review kode UI, harness paritas, integrasi, dokumen agent, dan benchmark (S58-S69, S93-S97). Masukan: diff area | senior-code-reviewer | code-review-senior | NEW <task>/gateway_check/05_review_ui_harness.md | S58:B, S59:B, S60:B, S61:B, S62:B, S63:B, S64:B, S65:B, S66:B, S67:B, S68:B, S69:B, S93:B, S94:B, S95:B, S96:B, S97:B | vonis PASS/CAUTION/FAIL per modul; setiap temuan punya berkas:baris dan baris pemilik | gateway_check |
| S87 | Security review: auth 3 jalur dan peran kelas K, traversal penyimpanan, sandbox Chromium (jaringan diblokir, JS mati, setContent), proses soffice (argumen, profil sementara, batas waktu, tree-kill), skrip render-env (tanpa tulis HKCU), parser turunan tanpa eval, batas masukan, zip, sajian berkas. Masukan: diff area | security-review | security-review-gate | NEW <task>/gateway_check/06_security_review.md | S03:B, S25:B, S48:B, S49:B, S50:B, S51:B, S52:B, S53:B, S54:B, S55:B, S56:B, S57:B, S69:B, S91:B, S92:B | vonis PASS/CAUTION/FAIL; setiap temuan punya berkas:baris dan tingkat; CAUTION/FAIL ditandai untuk user | gateway_check |
| S88 | Verifikasi menyeluruh terhadap kriteria penerimaan §7 (benchmark Manual 000 D-17 utama, kemampuan 1-7, per format), dengan bukti segar dari S71-S87 dan S98. Masukan: semua laporan test dan gateway_check | verifier | verification-before-completion | NEW <task>/verification/01_verification.md | S71:B, S72:B, S73:B, S74:B, S75:B, S76:B, S77:B, S78:B, S79:B, S80:B, S81:B, S82:B, S83:B, S84:B, S85:B, S86:B, S87:B, S98:B | setiap kriteria §7 punya vonis dan bukti; nol klaim tanpa sumber; intake dan approval tercatat | verification |
| S89 | Commit lokal di branch v2.1 (pesan merujuk tugas dan keputusan); push hanya bila user mengizinkan. Masukan: verifikasi PASS | git-specialist | finishing-a-development-branch | EXISTS .git (commit baru di v2.1, hash dilaporkan) | S88:B | git status bersih setelah commit; hash dan daftar berkas dikutip | report |
| S90 | Inventaris klaster format benchmark (read-only BM.docx dengan VENV -I -B): tanda tangan format langsung 748 paragraf (wajah, ukuran, warna, tebal, caps, indentasi, spasi, garis, shading) dikelompokkan menjadi klaster, sectPr 29 seksi, 52 penempatan dengan letak (badan atau header/footer) dan ukuran; hitungan dasar dikutip dari research/05. Masukan: BM.docx, research/04, research/05 | data-collector | - | NEW <task>/research/07_benchmark_inventory.md | none | 748 paragraf masing-masing masuk tepat satu klaster; 29 seksi dan 52 penempatan terhitung | research |
| S91 | Kunci lingkungan render (konfigurasi B research/05) secara reproducible: manifest (path soffice dan versi 24.2.3.2, fon Plex 16 TTF + DejaVuSans + Inter dengan sha256 dan nama registri HKCU), skrip cek kesiapan fon untuk worker (hanya verifikasi, tanpa menulis HKCU), port pembanding CAL ke repo, lalu jalankan ulang kalibrasi BM.docx ke PDF lokal. Masukan: research/05, CAL, SOFFICE | coder-execution | dry-run-verify-fix | NEW under akar repo (verified): render-env (kecuali subfolder semibold-bundle milik S99) | S03:B | manifest lengkap dengan sha256 cocok berkas terpasang; cek kesiapan exit 0 dan keluarannya dikutip; kalibrasi ulang 102 halaman, minimal 101/102 teks identik, SSIM rata-rata minimal 0,98 (setara research/05) | implementation |
| S92 | Layanan soffice: konversi DOCX ke PDF lewat SOFFICE_PATH (default dari manifest render-env), profil -env:UserInstallation per job di direktori sementara, maks 2 instans, antrean, batas waktu dan tree-kill, cek kesiapan render-env saat mulai, galat PDF_ENGINE_UNAVAILABLE bila biner atau fon tidak siap (KT-17). Masukan: kontrak, D-15, research/05, pola spawn bridge.mjs | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/: studio/engine/soffice | S03:B, S91:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S93 | Ekstraktor benchmark teks dan struktur: BM.docx ke benchmark/manual000/doc.json (studio.doc/v1) dengan runs[] apa adanya; klaster research/07 dipetakan ke sampul, lembar kendali, daftar isi, pembatas bagian, bab, seksi, paragraf, tabel, caption, sumber, rel bukti, turunan, aside/doktrin, lampiran; figur sebagai rujukan ke id S94. Masukan: research/07, kontrak | coder-execution | dry-run-verify-fix | NEW under benchmark/: extract, manual000/doc.json | S03:B, S90:B | doc.json lolos validator kontrak; hitungan 17 bab + 4 lampiran, 151 tabel, 52 rujukan figur, 0 paragraf tak terpetakan; rangkaian teks doc.json identik dengan rangkaian teks BM.docx | implementation |
| S94 | Spec figur benchmark (D-14): klasifikasi 27 media dan 52 penempatan menjadi chart (spec studio.chart/v1, data dari pustakachart_data.py bila berasal dari galeri), diagram (spec studio.diagram/v1 Garis A), raster murni (salin sebagai aset bersha256), perangkat halaman (citra rule, logo); tandai figur di 18 halaman figur besar. Masukan: research/07, research/06, BM.docx media | coder-execution | dry-run-verify-fix | NEW under benchmark/: manual000/figures | S02:B, S03:B, S90:B | 52 penempatan terklasifikasi tanpa sisa; setiap spec lolos validator kontrak; sha256 aset raster sama dengan media docx | implementation |
| S95 | Profil templat benchmark: ukur format langsung BM.docx (docDefaults, margin per seksi, wajah persis seperti IBM Plex Sans Cond, ukuran, leading, spasi per klaster, garis dan padding tabel, perangkat header/footer, 18 fon tertanam) menjadi override parameter di benchmark/manual000/template.json dalam 673 kunci; format yang tidak dapat diungkapkan dicatat sebagai daftar celah. Masukan: research/07, params | coder-execution | dry-run-verify-fix | NEW under benchmark/: manual000/template.json | S03:B, S90:B, S05:C, S06:C | setiap kunci di template.json ada di registri parameter; setiap klaster punya nilai atau tercatat sebagai celah | implementation |
| S96 | Harness benchmark pembanding D-17 (Python): (1) persen unit teks identik berurutan (paragraf, sel tabel, caption, baris sumber) lawan BM.docx; (2) selisih jumlah per jenis (halaman, bab, lampiran, tabel, gambar); (3) persen halaman bertekst identik lawan BM.pdf; (4) SSIM rata-rata seluruh halaman lawan BM.pdf langsung (metode CAL), SSIM per halaman dan per figur untuk 18 halaman figur besar sebagai diagnosis; laporan per halaman dan per paragraf. Masukan: S01, modul SSIM S66, CAL | coder-execution | dry-run-verify-fix | NEW under benchmark/: harness/compare | S01:B, S03:B, S66:C, S91:C | py_compile lulus; CLI --help exit 0; klaim = berkas tertulis | implementation |
| S97 | Runner benchmark: render doc.json + template.json lewat CLI Node S67 ke DOCX, lalu soffice ke PDF, lalu pembanding S96, lalu laporan JSON dan MD ke benchmark/out (gitignore oleh S69). Masukan: S67, S92, S96 | coder-execution | backend-execution, dry-run-verify-fix | NEW under benchmark/: harness/run | S03:B, S67:C, S92:C, S96:C | tsc tanpa galat di area; eslint area bersih; klaim = berkas tertulis | implementation |
| S98 | Jalankan benchmark Manual 000 (D-17) dan laporkan per kriteria, per halaman, per paragraf, serta per figur di 18 halaman figur besar. Masukan: runner S97 | test-expert | tdd | NEW <task>/test/09_benchmark_manual000.md | S20:B, S30:B, S32:B, S33:B, S34:B, S35:B, S36:B, S37:B, S38:B, S39:B, S40:B, S41:B, S42:B, S43:B, S91:B, S92:B, S93:B, S94:B, S95:B, S96:B, S97:B | unit teks identik berurutan minimal 98 persen dan selisih jumlah per jenis maks 2 persen dikutip; halaman bertekst identik minimal 100/102; SSIM rata-rata minimal 0,95 dengan halaman dan figur di bawah ambang terdaftar sebagai diagnosis | test |
| S99 | OPSIONAL (D-16/D-17, peningkatan): bundel fon render dengan wajah SemiBold Plex dipetakan sebagai gaya tebal keluarga IBM Plex Sans Cond/Mono/Serif lewat fontTools 4.63.0 (VENV), plus Inter, dimuat worker tanpa mengubah HKCU (misalnya folder fon profil per job, hipotesis); kalibrasi ulang target 102/102 teks identik. Masukan: research/05, manifest S91 | coder-execution | dry-run-verify-fix | NEW under akar repo (verified): render-env/semibold-bundle | S91:B | bundel terbangun dengan nama keluarga dan bobot terdaftar (keluaran fontTools dikutip); kalibrasi ulang dikutip: halaman teks identik dan SSIM rata-rata lawan konfigurasi B | implementation |

## Execution Profile

Penanda path:
- `EXISTS:` diverifikasi Glob/Read di sesi ini.
- `NEW under <induk> (verified)`: induk ada dan target dikonfirmasi tidak ada. Glob `src/lib/studio*`, `src/app/studio/**`, `src/app/api/studio/**`, `src/components/studio/**`, `tests/studio/**`, `tests/parity/**`, `scripts/parity/**`, `prisma/seed-studio*`, `docs/STUDIO*`, `benchmark/**`, `render-env/**` semuanya kosong.
- Nama berkas di dalam area ditetapkan eksekutor.

Singkatan: CK = tsc area + eslint area + klaim. Alur gerbang E2E: A agent, T template, E edit/revisi, G galeri, N navigasi. BM = benchmark.

| Step | Ownership area (exact paths) | Size | Dep kind | Model | Checks | Review |
|---|---|---|---|---|---|---|
| S01 | docs only: <task>/masterplan/01_specs.md | M | S90:B | inherit | 3 | batched |
| S02 | docs only: <task>/research/06_chart_map_parity_matrix.md | M | none | inherit | 3 | batched |
| S03 | shared contract, penulis tunggal: EXISTS: prisma/schema.prisma, package.json, package-lock.json (Glob sesi ini); NEW under prisma/migrations/ (verified): migrasi studio; NEW under src/lib/ (verified): studio/contract + semua stub indeks modul, params, registry; marker <task>/implementation/01_contract_landed.md | M (estimasi, risiko tertinggi) | S01:B | inherit | 3 | batched |
| S04 | NEW under src/lib/ (verified): studio/params/governance-language.ts | S | S03:B | sonnet (transkripsi tabel katalog) | 2 | batched |
| S05 | NEW under src/lib/ (verified): studio/params/color-type.ts | S | S03:B | sonnet (transkripsi tabel katalog) | 2 | batched |
| S06 | NEW under src/lib/ (verified): studio/params/page.ts | S | S03:B | sonnet (transkripsi tabel katalog) | 2 | batched |
| S07 | NEW under src/lib/ (verified): studio/params/apparatus.ts | S | S03:B | sonnet (transkripsi tabel katalog) | 2 | batched |
| S08 | NEW under src/lib/ (verified): studio/params/figure.ts | S | S03:B | sonnet (transkripsi tabel katalog) | 2 | batched |
| S09 | NEW under src/lib/ (verified): studio/registry/charts.ts | M | S02:B, S03:B | sonnet (transkripsi registri terpeta) | 2 | batched |
| S10 | NEW under src/lib/ (verified): studio/registry/lint.ts | S | S03:B | sonnet (transkripsi registri lint) | 2 | batched |
| S11 | NEW under src/lib/ (verified): studio/engine/tokens | M | S03:B, S05:C, S06:C | inherit | 3 CK | batched |
| S12 | NEW under src/lib/ (verified): studio/engine/bind | M | S03:B | inherit | 3 | batched |
| S13 | NEW under src/lib/ (verified): studio/assets; sumber read-only RL assets/fonts, RL assets/logo, VENV docx/templates/default.docx (Glob sesi ini) | S | S03:B | sonnet (salin berkas, hash) | 2 | batched |
| S14 | NEW under src/lib/ (verified): studio/engine/docx/package | M | S03:B, S11:C, S13:C | inherit | 3 CK; BM | batched |
| S15 | NEW under src/lib/ (verified): studio/engine/docx/fonts | S | S03:B, S13:C | inherit | 3 CK; BM | batched |
| S16 | NEW under src/lib/ (verified): studio/engine/docx/blocks | M | S03:B, S11:C, S12:C | inherit | 3 CK; BM | batched |
| S17 | NEW under src/lib/ (verified): studio/engine/docx/tables | M? | S03:B, S11:C | inherit | 3 CK; BM | batched |
| S18 | NEW under src/lib/ (verified): studio/engine/docx/wrapper | M | S03:B, S11:C, S13:C | inherit | 3 CK; BM | batched |
| S19 | NEW under src/lib/ (verified): studio/engine/docx/figures | M | S03:B, S12:C, S25:C | inherit | 3 CK; BM | batched |
| S20 | NEW under src/lib/ (verified): studio/engine/docx/assemble | M | S03:B, S14:C, S15:C, S16:C, S17:C, S18:C, S19:C | inherit | 3 CK; BM | batched |
| S21 | NEW under src/lib/ (verified): studio/engine/html/base | M | S03:B, S11:C, S13:C | inherit | 3 CK | batched |
| S22 | NEW under src/lib/ (verified): studio/engine/html/blocks | M | S03:B, S12:C, S21:C | inherit | 3 CK | batched |
| S23 | NEW under src/lib/ (verified): studio/engine/html/tables | M | S03:B, S12:C, S21:C | inherit | 3 CK | batched |
| S24 | NEW under src/lib/ (verified): studio/engine/html/assemble | S | S03:B, S21:C, S22:C, S23:C | inherit | 3 CK | batched |
| S25 | NEW under src/lib/ (verified): studio/engine/browser | M | S03:B | inherit | 3 CK | batched |
| S26 | NEW under src/lib/ (verified): studio/engine/diagram/core | M | S03:B, S11:C | inherit | 3 CK | batched |
| S27 | NEW under src/lib/ (verified): studio/engine/diagram/layout-a | M | S03:B, S26:C | inherit | 3 CK | batched |
| S28 | NEW under src/lib/ (verified): studio/engine/diagram/layout-b | M | S03:B, S26:C | inherit | 3 CK | batched |
| S29 | NEW under src/lib/ (verified): studio/engine/diagram/layout-c | M | S03:B, S26:C, S31:C | inherit | 3 CK | batched |
| S30 | NEW under src/lib/ (verified): studio/engine/diagram/build | M? | S03:B, S26:C | inherit | 3 CK | batched |
| S31 | NEW under src/lib/ (verified): studio/engine/symbols | M | S03:B, S11:C | inherit | 3 CK | batched |
| S32 | NEW under src/lib/ (verified): studio/engine/chart/core | M | S03:B, S09:C, S11:C | inherit | 3 CK | batched |
| S33 | NEW under src/lib/ (verified): studio/engine/chart/family-p1 | M | S02:B, S03:B, S32:C | inherit | 3 CK | batched |
| S34 | NEW under src/lib/ (verified): studio/engine/chart/family-p2 | M | S02:B, S03:B, S32:C | inherit | 3 CK | batched |
| S35 | NEW under src/lib/ (verified): studio/engine/chart/family-h1 | M | S02:B, S03:B, S32:C | inherit | 3 CK | batched |
| S36 | NEW under src/lib/ (verified): studio/engine/chart/family-h2 | M? | S02:B, S03:B, S32:C | inherit | 3 CK | batched |
| S37 | NEW under src/lib/ (verified): studio/engine/chart/family-k1 | M | S02:B, S03:B, S32:C | inherit | 3 CK | batched |
| S38 | NEW under src/lib/ (verified): studio/engine/chart/family-k2 | M? | S02:B, S03:B, S32:C | inherit | 3 CK | batched |
| S39 | NEW under src/lib/ (verified): studio/engine/chart/family-w1 | M | S02:B, S03:B, S32:C | inherit | 3 CK | batched |
| S40 | NEW under src/lib/ (verified): studio/engine/chart/family-w2 | M | S02:B, S03:B, S32:C | inherit | 3 CK | batched |
| S41 | NEW under src/lib/ (verified): studio/engine/chart/family-s1 | M | S02:B, S03:B, S32:C | inherit | 3 CK | batched |
| S42 | NEW under src/lib/ (verified): studio/engine/chart/family-s2 | M | S02:B, S03:B, S32:C | inherit | 3 CK | batched |
| S43 | NEW under src/lib/ (verified): studio/engine/chart/family-g | M? | S02:B, S03:B, S27:C, S32:C | inherit | 3 CK | batched |
| S44 | NEW under src/lib/ (verified): studio/engine/lint/scan | M | S03:B, S10:C | inherit | 3 CK | batched |
| S45 | NEW under src/lib/ (verified): studio/engine/lint/render | M | S03:B, S10:C, S25:C | inherit | 3 CK | batched |
| S46 | NEW under src/lib/ (verified): studio/engine/lint/structure | M | S03:B, S10:C, S12:C | inherit | 3 CK | batched |
| S47 | NEW under src/lib/ (verified): studio/engine/lint/language | M? | S03:B, S10:C | inherit | 3 CK | batched |
| S48 | NEW under src/lib/ (verified): studio/services/ingest | M | S03:B, S12:C | inherit | 3 CK; alur A | batched |
| S49 | NEW under src/lib/ (verified): studio/services/templates | M | S03:B, S11:C | inherit | 3 CK; alur T | batched |
| S50 | NEW under src/lib/ (verified): studio/services/revisions | M | S03:B, S48:C, S51:C | inherit | 3 CK; alur E | batched |
| S51 | NEW under src/lib/ (verified): studio/services/render | M | S03:B, S20:C, S24:C, S25:C, S30:C, S32:C, S44:C, S52:C, S92:C | inherit | 3 CK; alur A, E | batched |
| S52 | NEW under src/lib/ (verified): studio/services/storage | M | S03:B | inherit | 3 CK; alur A | batched |
| S53 | NEW under src/lib/ (verified): studio/services/images | S | S03:B | inherit | 3 CK; alur G | batched |
| S54 | NEW under src/app/api/ (verified): studio/templates, studio/registry | M | S03:B, S49:C | inherit | 3 CK; alur T | batched |
| S55 | NEW under src/app/api/ (verified): studio/documents/route.ts, studio/documents/[id]/route.ts, studio/validate | M | S03:B, S48:C, S51:C | inherit | 3 CK; alur A | batched |
| S56 | NEW under src/app/api/ (verified): studio/documents/[id]/blocks, studio/documents/[id]/revisions | M | S03:B, S50:C | inherit | 3 CK; alur E | batched |
| S57 | NEW under src/app/api/ (verified): studio/artifacts, studio/files | M | S03:B, S51:C, S52:C, S53:C | inherit | 3 CK; alur A, G | batched |
| S58 | NEW under src/app/ (verified): studio/templates (tanpa [id]/sections); NEW under src/components/ (verified): studio/template-editor | M | S03:B, S54:C | inherit | 3 CK; alur T | batched |
| S59 | NEW under src/app/ (verified): studio/templates/[id]/sections; NEW under src/components/ (verified): studio/section-composer | M | S03:B, S54:C, S55:C | inherit | 3 CK; alur T | batched |
| S60 | NEW under src/app/ (verified): studio/page.tsx, studio/layout.tsx, studio/documents (tanpa [id]/edit, [id]/revisions); NEW under src/components/ (verified): studio/document-viewer | M | S03:B, S55:C, S57:C | inherit | 3 CK; alur A, N | batched |
| S61 | NEW under src/app/ (verified): studio/documents/[id]/edit, studio/documents/[id]/revisions; NEW under src/components/ (verified): studio/revision | M | S03:B, S56:C | inherit | 3 CK; alur E | batched |
| S62 | NEW under src/app/ (verified): studio/artifacts; NEW under src/components/ (verified): studio/artifact-gallery | M | S03:B, S57:C | inherit | 3 CK; alur G | batched |
| S63 | NEW under tests/ (verified): parity/fixtures | M | S02:B, S03:B | inherit | 3 | batched |
| S64 | NEW under scripts/ (verified): parity/reference/doc | M | S01:B, S03:B | inherit | 3 | batched |
| S65 | NEW under scripts/ (verified): parity/reference/fig | M | S01:B, S02:B, S03:B | inherit | 3 | batched |
| S66 | NEW under scripts/ (verified): parity/compare | M | S01:B, S02:B, S03:B | inherit | 3 | batched |
| S67 | NEW under scripts/ (verified): parity/run | M | S03:B, S64:C, S65:C, S66:C | inherit | 3 CK | batched |
| S68 | NEW under docs/ (verified): STUDIO-AGENT-GUIDE.md; EXISTS: docs/API-REFERENCE.md (penulis tunggal) | S | S54:B, S55:B, S56:B, S57:B | inherit | 2 | batched |
| S69 | EXISTS: src/components/sidebar.tsx, src/components/command-palette.tsx, next.config.ts, .gitignore (penulis tunggal; package.json untuk permintaan tunda) | S | S25:C, S60:B | sonnet (daftar sambungan tetap) | 3; alur N | batched |
| S70 | NEW under prisma/ (verified): seed-studio.ts; DB v21 seed runner (penulis tunggal) | S | S04:B, S05:B, S06:B, S07:B, S08:B, S09:B, S10:B, S49:C | inherit | 2 | batched |
| S71 | NEW under tests/ (verified): studio/unit/engine-core | M | S11:B, S12:B, S44:B, S45:B, S46:B, S47:B | inherit (agen verifikasi) | 3 | n/a |
| S72 | NEW under tests/ (verified): studio/unit/renderers | M | S14:B, S15:B, S16:B, S17:B, S18:B, S19:B, S20:B, S21:B, S22:B, S23:B, S24:B, S25:B, S92:B | inherit (agen verifikasi) | 3 | n/a |
| S73 | NEW under tests/ (verified): studio/unit/figures | M | S26:B, S27:B, S28:B, S29:B, S30:B, S31:B, S32:B, S33:B, S34:B, S35:B, S36:B, S37:B, S38:B, S39:B, S40:B, S41:B, S42:B, S43:B | inherit (agen verifikasi) | 3 | n/a |
| S74 | NEW under tests/ (verified): studio/unit/api | M | S48:B, S49:B, S50:B, S51:B, S52:B, S53:B, S54:B, S55:B, S56:B, S57:B | inherit (agen verifikasi) | 3 | n/a |
| S75 | NEW under tests/ (verified): studio/integration; laporan <task>/test/01_integration_db.md; DB uji (penulis tunggal); pengguna soffice | M | S48:B, S50:B, S51:B, S52:B, S70:B | inherit (agen verifikasi) | 3 | n/a |
| S76 | docs only: <task>/test/02_parity_docx.md (biner ke tests/parity/out/s76) | M | S20:B, S63:B, S64:B, S66:B, S67:B | inherit (agen verifikasi) | 3 | n/a |
| S77 | docs only: <task>/test/03_parity_pdf.md (biner ke tests/parity/out/s77); pengguna soffice | M | S20:B, S63:B, S64:B, S66:B, S67:B, S92:B | inherit (agen verifikasi) | 3 | n/a |
| S78 | docs only: <task>/test/04_parity_diagram.md (biner ke tests/parity/out/s78) | M | S30:B, S31:B, S63:B, S65:B, S66:B, S67:B | inherit (agen verifikasi) | 3 | n/a |
| S79 | docs only: <task>/test/05_parity_chart.md (biner ke tests/parity/out/s79) | M | S32:B, S33:B, S34:B, S35:B, S36:B, S37:B, S38:B, S39:B, S40:B, S41:B, S42:B, S43:B, S63:B, S65:B, S66:B, S67:B | inherit (agen verifikasi) | 3 | n/a |
| S80 | NEW under tests/ (verified): studio/e2e; laporan <task>/test/06_e2e_session.md; port 9011 (penulis tunggal); pengguna soffice lewat HQ | M | S54:B, S55:B, S56:B, S57:B, S58:B, S59:B, S60:B, S61:B, S62:B, S69:B, S70:B | inherit (agen verifikasi) | 3; alur A, T, E, G, N | n/a |
| S81 | docs only: <task>/test/07_performance.md; pengguna soffice, host tenang | S | S51:B, S67:B, S92:B | inherit (agen verifikasi) | 2 | n/a |
| S82 | docs only: <task>/test/08_rollback_rehearsal.md; DB uji (penulis tunggal, setelah S75) | S | S03:B, S75:B | inherit (agen verifikasi) | 3 | n/a |
| S83 | docs only: <task>/gateway_check/02_review_engine_docs.md | M | S14:B, S15:B, S16:B, S17:B, S18:B, S19:B, S20:B, S21:B, S22:B, S23:B, S24:B, S25:B, S91:B, S92:B | inherit (agen verifikasi) | 2 | n/a |
| S84 | docs only: <task>/gateway_check/03_review_figures.md | M | S26:B, S27:B, S28:B, S29:B, S30:B, S31:B, S32:B, S33:B, S34:B, S35:B, S36:B, S37:B, S38:B, S39:B, S40:B, S41:B, S42:B, S43:B | inherit (agen verifikasi) | 2 | n/a |
| S85 | docs only: <task>/gateway_check/04_review_services_api.md | M | S03:B, S11:B, S12:B, S44:B, S45:B, S46:B, S47:B, S48:B, S49:B, S50:B, S51:B, S52:B, S53:B, S54:B, S55:B, S56:B, S57:B, S70:B | inherit (agen verifikasi) | 2 | n/a |
| S86 | docs only: <task>/gateway_check/05_review_ui_harness.md | M | S58:B, S59:B, S60:B, S61:B, S62:B, S63:B, S64:B, S65:B, S66:B, S67:B, S68:B, S69:B, S93:B, S94:B, S95:B, S96:B, S97:B | inherit (agen verifikasi) | 2 | n/a |
| S87 | docs only: <task>/gateway_check/06_security_review.md | M | S03:B, S25:B, S48:B, S49:B, S50:B, S51:B, S52:B, S53:B, S54:B, S55:B, S56:B, S57:B, S69:B, S91:B, S92:B | inherit (agen verifikasi) | 3 | n/a |
| S88 | docs only: <task>/verification/01_verification.md | M | S71:B, S72:B, S73:B, S74:B, S75:B, S76:B, S77:B, S78:B, S79:B, S80:B, S81:B, S82:B, S83:B, S84:B, S85:B, S86:B, S87:B, S98:B | inherit (agen verifikasi) | 3 | n/a |
| S89 | EXISTS: .git (Glob .git/objects sesi ini); indeks git branch v2.1 (penulis tunggal) | S | S88:B | sonnet (commit berkas terverifikasi) | 2 | batched |
| S90 | docs only: <task>/research/07_benchmark_inventory.md; BM.docx read-only | S | none | sonnet (inventaris format mekanis) | 2 | batched |
| S91 | NEW under akar repo (verified): render-env (tanpa render-env/semibold-bundle); pengguna soffice di G1 | M | S03:B | inherit | 3; BM | batched |
| S92 | NEW under src/lib/ (verified): studio/engine/soffice | M | S03:B, S91:C | inherit | 3 CK; BM | batched |
| S93 | NEW under akar repo (verified): benchmark/extract, benchmark/manual000/doc.json | M? | S03:B, S90:B | inherit | 3; BM | batched |
| S94 | NEW under akar repo (verified): benchmark/manual000/figures | M? | S02:B, S03:B, S90:B | inherit | 3; BM | batched |
| S95 | NEW under akar repo (verified): benchmark/manual000/template.json | M | S03:B, S90:B, S05:C, S06:C | inherit | 2; BM | batched |
| S96 | NEW under akar repo (verified): benchmark/harness/compare | M | S01:B, S03:B, S66:C, S91:C | inherit | 3 | batched |
| S97 | NEW under akar repo (verified): benchmark/harness/run | M | S03:B, S67:C, S92:C, S96:C | inherit | 3 CK | batched |
| S98 | docs only: <task>/test/09_benchmark_manual000.md (biner ke benchmark/out); pengguna soffice | M | S20:B, S30:B, S32:B, S33:B, S34:B, S35:B, S36:B, S37:B, S38:B, S39:B, S40:B, S41:B, S42:B, S43:B, S91:B, S92:B, S93:B, S94:B, S95:B, S96:B, S97:B | inherit (agen verifikasi) | 3; BM | n/a |
| S99 | NEW under akar repo (verified): render-env/semibold-bundle; pengguna soffice (opsional) | M? | S91:B | inherit | 2; BM | batched |

### Shared resources (single-writer)

| Sumber daya | Satu-satunya penulis | Catatan |
|---|---|---|
| `prisma/schema.prisma`, folder migrasi baru, `prisma migrate` ke `gsp_agent_hq_v21` | S03 (G0) | Aditif saja. Kebutuhan kolom berikutnya diajukan lewat `file_requests.md`, lalu menjadi baris delta baru (S03-dN) yang dijadwalkan controller di antara sub-gelombang |
| `package.json`, `package-lock.json`, `npm install` | S03 (G0); S69 (G1e) untuk permintaan tertunda | Dependensi dipasang di G0 karena setiap baris G1 menjalankan tsc yang butuh tipe paketnya (alasan tertulis menyimpang dari daftar integrasi permintaan) |
| `src/lib/studio/contract/**` | S03 | Read-only setelah marker ada. Perubahan lewat `file_requests.md`, diputus controller, lalu disiarkan |
| Stub indeks modul (`engine/*/index.ts`, `params/*.ts`, `registry/*.ts`) | Dibuat S03; sesudahnya milik baris modul | Dispatcher (milik kontrak) mengimpor indeks setiap modul secara statis, sehingga tidak ada registri bersama yang ditulis paralel |
| `src/components/sidebar.tsx`, `src/components/command-palette.tsx`, `next.config.ts`, `.gitignore` | S69 | Satu suntingan aditif per berkas, dengan alat Edit, setelah membaca ulang |
| `docs/API-REFERENCE.md` | S68 | Seksi baru saja |
| `prisma/seed-studio.ts` + eksekusi seed ke DB v21 | S70 | Beda batch dengan S03 |
| DB uji (nama menurut KT-04) | S75, lalu S82 | Berurutan |
| LibreOffice soffice (instans dan profil) | S91 (G1a), S99 opsional (G1b); runtime S75, S77 (G4); S80, S98 (G5); S81 (G5b) | Setiap pemanggilan memakai `-env:UserInstallation` sementara per job. Maks 2 baris pengguna soffice per batch. Profil default user tidak pernah dipakai |
| Fon per-user Windows (HKCU) | Tidak ada baris yang menulis | S91 hanya memverifikasi. Konfigurasi B dipasang controller (research/05). S99 tidak boleh menulis HKCU |
| `render-env/` | S91 (semua kecuali `render-env/semibold-bundle/`), S99 (`render-env/semibold-bundle/`) | Subfolder terpisah, beda batch |
| Beban Chromium host | runtime S78, S79, S80 | Maks 3 bersamaan. CPU di atas 85 persen berarti tunda |
| Port 9011 / HQ hidup | S80 | Controller me-restart HQ (`scripts/hq_restart.mjs`) sebelum S80 |
| Akar penyimpanan sandbox (KT-03) | S52 (kode); runtime S75 (direktori sementara), S80 (sandbox) | Selama v2.1 tidak pernah ke `SHARED_WORKSPACE` produksi bila KT-03 = sandbox |
| `benchmark/` | Per subfolder: extract + manual000/doc.json S93, manual000/figures S94, manual000/template.json S95, harness/compare S96, harness/run S97 | Tanpa berkas bersama. `benchmark/out` hanya ditulis runner saat S98 |
| `tests/parity/out/` | Subfolder per langkah S76-S79, S81 | Tanpa berbagi berkas |
| `BM.pdf`, `BM.docx`, `HS`, `RL`, `VENV`, `CAL` | Tidak ada (read-only) | S91 menyalin metode CAL ke repo, tidak mengubah aslinya |
| Indeks git branch `v2.1` | S89 | Commit hanya di titik tenang; push atas izin user |
| Berkas controller (`status_tasks.md`, `README.md`, `decisions/decisions.md`, `implementation/99_implementation_report.md`, `report/report.md`, `gateway_check/01_gate_report.md`, `delegation_progress/driver_rules.md`, `delegation_progress/file_ownership.md`) | Controller | Baris melapor lewat hasil Agent dan catatannya sendiri |

### Gelombang, jalur kritis, estimasi relatif

Gelombang logis dari tepi B: L0 {S02, S90}; L1 {S01}; L2 {S03}; L3 {S04-S67, S91-S97}; L4 {S68, S69, S70, S71-S74, S76-S79, S81, S83, S84, S98, S99}; L5 {S75, S80, S85, S86, S87}; L6 {S82}; L7 {S88}; L8 {S89}. Batch peluncuran (D-07 mengizinkan lebih dari 4 dengan kepemilikan terdeklarasi; controller mencatat alasan per batch):

| Batch | Baris | Lebar | Estimasi relatif (1 unit = satu sub-gelombang M, kira-kira 45 menit) |
|---|---|---|---|
| GP-a (inventaris, peta chart) | S90, S02 | 2 | 0,5 (S02 boleh melewati GP-b) |
| GP-b (spesifikasi) | S01 | 1 | 1 |
| G0 (kontrak, sendirian) | S03 | 1 | 1 (berisiko 1,5) |
| G1a | S04, S05, S06, S07, S08, S09, S10, S11, S12, S13, S14, S25, S91, S92, S93 | 15 | 1 |
| G1b (+ S99 opsional) | S15, S16, S17, S18, S19, S21, S22, S23, S26, S27, S28, S31, S94, S95 | 14 (15) | 1 |
| G1c (+ S70) | S20, S24, S29, S30, S32, S44, S45, S46, S47, S48, S49, S50, S51, S52 | 15 | 1 |
| G1d | S53, S54, S55, S56, S57, S58, S59, S60, S61, S62, S63, S64, S65, S66 | 14 | 1 |
| G1e (+ S68, S69) | S67, S96, S97, S33-S43 (kandidat potong KT-01) | 16 | 1 |
| G3 (final ringan) | S71, S72, S73, S74, S83, S84, S85, S86, S87 | 9 | 1 |
| G4 (final berat) | S75, S76, S77, S78, S79 | 5 (soffice 2, Chromium 2) | 1,5 |
| G5 | S80, S82, S98 | 3 (soffice 2) | 1,5 |
| G5b | S81 sendirian (host tenang) | 1 | 0,5 |
| G6 | S88 | 1 | 1 |
| Loop perbaikan | baris R baru per temuan (§8.4) | menurut temuan | 1-3 |
| G7 | S89 | 1 | 0,2 |

Penempatan baris benchmark dan lingkungan:
- S91 (kunci lingkungan) dan S93 (ekstraksi) di G1a, S95 (profil templat) di G1b. Dengan begitu daftar celah (format manual yang belum dapat diungkapkan kontrak) muncul sedini mungkin dan menjadi baris delta kontrak sebelum renderer selesai.
- S99 opsional: controller meluncurkannya di G1b bila murah. Bila dijalankan, review-nya ditambahkan ke lingkup S83 (MINOR).
- Semua tepi di dalam G1 berjenis C, jadi pengelompokan sub-gelombang murni penjadwalan.

Jalur kritis (tepi B): S90 -> S01 -> S03 -> S60 -> S69 -> S80 -> S88 -> S89. Jalur waktu sebenarnya didominasi pengemasan G1 (5 sub-gelombang) dan fase final. Totalnya kira-kira 14-17 unit. Cara memperpendek:
1. Perlebar sub-gelombang G1 bila CPU di bawah 85 persen.
2. Pakai KT-01 untuk memindahkan sebagian S33-S43 ke v2.1.x, kecuali jenis yang dipakai Manual 000 (S94 menyebutnya).
3. Bila user melonggarkan "G0 sendirian", S64-S66 dan S96 (Python, tanpa berkas bersama) dapat berjalan bersama S03.

### Pernyataan biaya (estimasi)

- Baris: 99, terdiri dari S 17 dan M 82 (9 di antaranya berlabel M?). Model: 11 sonnet (S04-S10, S13, S69, S89, S90) dan 88 inherit. Tidak ada baris L.
- Gelombang: 9 tingkat logis dan 15 batch peluncuran (termasuk loop). Gelombang logis terlebar L3 = 71 baris; batch peluncuran terlebar 16 (G1e).
- Jalur kritis: S90 -> S01 -> S03 -> S60 -> S69 -> S80 -> S88 -> S89.
- Tiga baris termahal:
  - S03: kontrak lintas lapis, satu penulis.
  - S93: ekstraksi 748 paragraf dan 151 tabel dengan teks identik.
  - S88: verifier membaca 18 laporan dan kriteria benchmark.
- Grounding: EXISTS = 9 path pada 4 baris (S03: 3, S68: 1, S69: 4, S89: 1), semuanya terverifikasi Glob di sesi ini. NEW-under = 81 baris (induk terverifikasi, target terkonfirmasi tidak ada). UNKNOWN = 0. docs only = 16 baris.

## 7. Kriteria penerimaan terukur

### 7.1 Benchmark Manual 000 (kriteria penerimaan utama; D-12, D-14, ambang final D-17)

| Kode | Kriteria | Ambang | Cara ukur | Baris |
|---|---|---|---|---|
| BM-1 | Unit teks (paragraf, sel tabel, caption, baris sumber) identik dan berurutan dengan `BM.docx` | minimal 98 persen unit | Penyejajaran urutan unit teks keluaran lawan `BM.docx` | S96, S98 |
| BM-2 | Jumlah unsur per jenis | selisih maks 2 persen per jenis: halaman 102 plus minus 2, tabel 151 plus minus 3, gambar 52 plus minus 1; bab 17 dan lampiran 4 (2 persen dibulatkan ke bawah = 0) | Hitungan di DOCX dan PDF keluaran | S96, S98 |
| BM-3 | Halaman bertekst identik (pemisah halaman) | minimal 98 persen halaman (min 100/102) | Teks per halaman PDF keluaran (soffice) lawan `BM.pdf`, ternormalisasi spasi seperti CAL | S96, S98 |
| BM-4 | Visual | SSIM rata-rata seluruh halaman minimal 0,95 langsung lawan `BM.pdf` | Metode CAL (SSIM 7x7, abu-abu, 72 dpi). Halaman dan figur di bawah ambang hanya diagnosis. SSIM per figur wajib dilaporkan untuk halaman 9, 12, 19, 35, 37, 38, 40, 42, 50, 51, 54-61 | S96, S98 |
| BM-0 | Lingkungan render terkunci dan reproducible | Konfigurasi B: 102 halaman, minimal 101/102 teks identik, SSIM rata-rata minimal 0,98 dari `BM.docx` asli; worker gagal cepat bila fon atau soffice tidak siap | Kalibrasi ulang dan cek kesiapan S91 | S91 |

### 7.2 Per kemampuan

| # | Kemampuan | Kriteria terukur | Dibuktikan oleh |
|---|---|---|---|
| 1 | Template dapat dikustom sedetail manual | Registri tepat 673 ParamDef dengan medan lengkap (hitungan skrip, 0 medan kosong). Lima jenis template dapat dibuat. Ubah = versi baru, dan versi lama tidak berubah. Ubah `grid.textColumnMm` menggerakkan `grid.fullSpanMm`, `grid.latticeXMm`, `grid.allowedFigureWidthsMm`. Override kelas K oleh USER atau agent ditolak 403; oleh ADMINISTRATOR diterima. Profil templat Manual 000 (S95) hanya memakai kunci registri | S71, S74, S80 alur T, S95 |
| 2 | Template diterapkan ke JSON menjadi keluaran | `/validate` mengembalikan galat skema dengan pointer JSON. `/documents` atas fixture lengkap mengembalikan 201 beserta berkas DOCX, PDF (soffice), HTML, serta SVG/PNG figur. Manual 000 dirender dari doc.json + template.json | S74, S75, S80, S98 |
| 3 | Section dan jenis section, isi per chapter | Registri 51 entri. Fixture 29 jenis section dirender di DOCX dan HTML tanpa galat. Manual 000 terpetakan dengan 0 paragraf tak terpetakan. Rencana section per tier ditegakkan: SERAH tanpa tabel rekonsiliasi berstatus rilis FAIL dengan ID D16 | S72, S75, S93 |
| 4 | Penyimpanan per misi/task di IL | Berkas ada di `<akar>/docs/<misi>/studio/<nomor>/rev-<n>/`. sha256 dan ukuran di DB sama dengan di disk. `agentRequestId` atau `hermesTaskId` yang tidak ada ditolak 404. Folder misi tampil di `GET /api/information-library` dengan berkas Studio | S75, S80 alur A |
| 5 | Tersimpan di DB, sunting lewat alamat, revisi berversi | `GET .../blocks/3.2.4` mengembalikan blok yang tepat. PATCH tanpa apa/mengapa/dampak ditolak 400. PATCH sah membuat revisi n+1, dan revisi n tetap terbaca. Render ulang revisi lama menghasilkan DOCX dengan sha256 sama (determinisme) | S74, S75, S80 alur E |
| 6 | AI agent cukup POST JSON; HQ menegakkan standar | Semua route Studio menerima `x-internal-secret` dan menolak anonim 401. Masukan cacat by-construction ditolak 422 dengan ID cek (minimal lint 04 judul pertanyaan, 10 tabel tanpa SUMBER, 26 lebih dari satu aksen, 31 Mermaid, 38 garis bawah di nama). Lint lain menentukan status rilis tanpa menahan berkas. Skema JSON v1 dapat diunduh. Panduan agent tersedia | S74, S68, S80 |
| 7 | Port Node + paritas Python | Harness berjalan untuk setiap format dan memenuhi §7.3. Lint Python acuan (`HS scripts/datum_lint.py`) atas DOCX Node menghasilkan VERDICT PASS untuk fixture TERBIT/SERAH | S76-S79 |

### 7.3 Per format (paritas Python lawan Node)

| Format | Kriteria | Ambang usulan (final per research/06 dan KT) |
|---|---|---|
| DOCX | Urutan dan jumlah paragraf sama. Teks ternormalisasi sama. Properti paragraf/run efektif sama. Struktur tabel sama. `sectPr` sama. `datum_lint.py` PASS. `datumcheck.py` A2-A5 PASS | Teks 100 persen; properti efektif minimal 98 persen run cocok |
| PDF (D-15, mesin sama) | DOCX Python lewat soffice lawan DOCX Node lewat soffice: jumlah halaman, teks per halaman, SSIM per halaman, fon Plex tertanam, baterai `datum_figur.py` F1-F5 lolos | Halaman sama; minimal 98 persen halaman teks identik; SSIM rata-rata minimal 0,98 (mesin sama, lebih ketat dari benchmark) |
| HTML (artefak dan pratinjau) | Satu berkas mandiri. Nol request jaringan saat dimuat. Tanpa elemen script. Lint 37 (luapan A4) nol. Pemindai teks X lolos | Mutlak |
| SVG diagram dan simbol | viewBox, lebar, tinggi mm sama (selisih maks 0,01). Jumlah elemen per tag sama. Himpunan teks dan warna sama. Geometri dalam toleransi | Geometri maks 0,1 mm |
| PNG diagram | Raster Chromium kedua sisi pada 300 dpi | Maks 0,5 persen piksel berbeda |
| SVG/PNG chart | bar/column/threshold: kriteria struktur seperti diagram. Kode terpeta VC: KT-02. Kode tanpa acuan: lint saja. Semua chart: font min 5,5 pt, maks 5 warna, maks 1 aksen, lebar 128/166, tinggi maks 247 mm, teks nyata di SVG | Menurut KT-02 |

## 8. Mediasi D-08: kepemilikan berkas dan berkas mediasi

### 8.1 Berkas mediasi (di `<task>/delegation_progress/`)

| Berkas | Penulis | Aturan |
|---|---|---|
| `driver_rules.md` | Controller, sekali per batch | Memuat: mode (paralel, D-07); area milik baris; larangan menyentuh area lain; perintah penjaga (`npx tsc --noEmit -p tsconfig.json` disaring ke area sendiri, `npx eslint <area>`, `VENV -I -B -m py_compile` untuk Python); larangan menjalankan suite uji penuh; panjang laporan maks 30 baris; Documentation Contract verbatim |
| `file_ownership.md` | Controller | Pemilik eksklusif per area per batch (disalin dari Execution Profile), berkas bersama dan penulis tunggalnya, putusan tumpang tindih bertanggal, pembaruan saat baris mulai atau mendarat |
| `file_claims.md` | Append-only oleh setiap driver | Tindakan PERTAMA setiap baris kode: tulis path persis yang akan ditulis (satu baris per path, berawalan ID langkah). Controller membandingkan klaim baris yang berjalan bersamaan sebelum kode ditulis. Klaim di luar area ditolak |
| `file_requests.md` | Append-only oleh driver | Satu baris per permintaan: path, perubahan persis, blocking ya/tidak, ID peminta. Driver lanjut di balik seam. Controller merutekan ke pemilik, ke baris delta (S03-dN untuk kontrak), atau ke S69 untuk sambungan. Daftar celah S93 dan S95 masuk lewat berkas ini |

### 8.2 Aturan standar driver

1. Kerjakan area sendiri saja. Semua yang lain read-only, termasuk `src/lib/studio/contract/**` setelah G0 dan semua sumber acuan (`HS`, `RL`, `VENV`, `BM`, `CAL`).
2. Berkas bersama hanya disunting pemilik tunggalnya, dengan alat Edit, satu suntingan aditif kecil, setelah membaca ulang.
3. Penjaga per baris (D-07) hanya tsc, eslint, py_compile, klaim, dan hitungan data. Uji ditulis dan dijalankan di fase final oleh `test-expert`.
4. Galat tsc di area lain tidak diperbaiki. Laporkan saja; controller mengatribusikannya menurut nama berkas.
5. soffice hanya lewat layanan S92 atau profil sementara sendiri (S91, S64, S99). Profil default user tidak pernah dipakai. HKCU tidak pernah ditulis.
6. Laporan pendek ke `delegation_progress/<agent>_<sNN>.md`: status, berkas, angka, keputusan, permintaan.

### 8.3 Tugas controller di antara batch

1. Putus tumpang tindih klaim seketika.
2. Rutekan setiap baris `file_requests.md`, terutama daftar celah benchmark (S93, S95) yang menjadi baris delta kontrak.
3. Siarkan perubahan kontrak ke baris yang sedang berjalan.
4. Jalankan `npx tsc --noEmit` penuh setelah setiap batch dan atribusikan galat per baris.
5. Jalankan completion gate 8 cek.
6. Jangan meluncurkan batch baru bila ada permintaan blocking yang belum dirutekan.
7. Catat lebar batch di atas 4 beserta alasannya di `decisions/decisions.md`.
8. Bila kalibrasi ulang S91 tidak mereproduksi konfigurasi B, hentikan G1b dan laporkan ke user.

### 8.4 Loop perbaikan (fase final)

1. Setiap temuan FAIL dari uji, paritas, benchmark, atau review menjadi baris baru `Rnn`:
   - ukuran S, agen `coder-execution`, skill `receiving-code-review, dry-run-verify-fix`;
   - pemilik = pemilik area asal;
   - B pada laporan temuan.
2. Sesudah baris R selesai, hanya uji atau review terdampak yang dijalankan ulang.
3. Maksimal 3 siklus per kriteria (misalnya BM-3 dihitung satu kriteria). Setelah itu ajukan sekali `AskUserQuestion`: lanjut dengan cacat tercatat, ubah lingkup, atau batal.
4. Diagnosis BM-4 (halaman atau figur di bawah ambang) tidak memicu loop selama rata-rata memenuhi ambang (D-17).
5. Temuan security CAUTION dan FAIL selalu diajukan ke user.
6. Baris R di dalam lingkup yang sudah disetujui berstatus MINOR.

## 9. Risiko dan mitigasi

| # | Risiko | Kemungkinan / dampak | Mitigasi |
|---|---|---|---|
| R1 | Integrasi tertunda karena pengujian di akhir (D-07): 71 baris bertemu pertama kali di G3/G4 | Tinggi / tinggi | Kontrak dan antarmuka dikunci di G0 dengan stub bertipe. tsc penuh oleh controller setelah setiap batch. Daftar celah benchmark dirutekan sejak G1a/G1b. Loop R dibatasi 3 siklus |
| R2 | Kontrak S03 keliru atau tidak lengkap untuk konstruksi Manual 000 | Sedang / tinggi | S90 menginventaris klaster format sebelum S01. S01 wajib memetakan setiap klaster (cek 3). Perubahan lewat baris delta S03-dN |
| R3 | Lingkungan render tidak reproducible: fon per-user hanya aktif setelah logon atau `AddFontResourceW`; akun layanan atau sesi lain tidak punya fon | Sedang / tinggi | S91 mengunci manifest dan cek kesiapan. Worker (S92) gagal cepat dengan `PDF_ENGINE_UNAVAILABLE`, bukan menghasilkan PDF dengan fon pengganti |
| R4 | Selisih SemiBold lawan Bold (acuan dari fontconfig Linux) menyisakan sekitar 1,85 persen selisih visual dan 1 halaman teks berbeda di lingkungan | Pasti / rendah | Sudah di dalam ambang D-17 (teks 2 persen, visual 5 persen). S99 opsional sebagai peningkatan |
| R5 | Halaman berfigur besar (18 halaman) menambah selisih visual 1,5-2,6 persen (hipotesis D-17), sehingga margin terhadap ambang 5 persen menipis (lingkungan 1,85 + figur 2,6 = 4,45 persen pada kasus terburuk) | Sedang / sedang | Data chart dari `pustakachart_data.py` bila gambar berasal dari galeri. SSIM per figur dilaporkan untuk diagnosis. Perbaikan figur terburuk lewat baris R |
| R6 | Semantik harus disimpulkan dari format langsung (semua paragraf bergaya Normal); salah klasifikasi merusak urutan teks dan tata letak | Tinggi / tinggi | Klaster S90. Cek "0 tak terpetakan" dan "rangkaian teks identik" di S93 sebagai penjaga data (bukan uji kode) |
| R7 | Mesin mengubah teks (md-lite menelan `*`, backtick, tautan otomatis; kapital diubah), sehingga BM-1 gagal | Sedang / tinggi | A9: `runs[]` eksplisit apa adanya, kapital lewat properti `caps`, tanpa transformasi tipografi |
| R8 | Nama wajah benchmark (`IBM Plex Sans Cond`) berbeda dari token Garis A (`IBM Plex Sans Condensed`); lint DATUM-05 Garis A pernah menandai nama itu | Pasti / sedang | Nama wajah menjadi parameter. Profil Manual 000 memakai nilai apa adanya. Lint 05 hanya memeriksa daftar larangan (Calibri, Times New Roman, Aptos, Arial) |
| R9 | 2.754 objek gambar di `BM.pdf`: citra perangkat halaman (rule, logo) berulang per halaman, bukan 52 figur | Pasti / sedang | S90 membedakan penempatan header/footer dari figur badan. S94 memetakannya ke perangkat halaman. S18 menempatkan citra di header/footer |
| R10 | Benchmark memuat em dash (`k9_tambal_docx.py` baris 18) dan pelanggaran lint lain | Pasti / rendah | A10: lint menentukan status rilis tanpa menahan render; teks tetap identik |
| R11 | soffice menggantung, kunci profil, atau instans bersamaan saling tunggu | Sedang / sedang | Profil per job, maks 2 instans, batas waktu + `taskkill /T /F` (S92). Security review S87 |
| R12 | Ukuran port 58 chart dan acuan matplotlib yang tidak sebanding piksel | Tinggi / sedang | KT-01, KT-02. Chart di sub-gelombang terakhir. Jenis yang dipakai Manual 000 tidak boleh dipotong |
| R13 | Versi playwright-core tidak cocok dengan revisi Chromium terpasang | Sedang / rendah (Chromium hanya untuk HTML, raster, pratinjau) | `executablePath` eksplisit. Cadangan: Chrome 155 terpasang |
| R14 | Tulisan ke `SHARED_WORKSPACE` produksi selama dev/uji | Tinggi bila tidak dicegah / tinggi | KT-03 akar sandbox. S75 memakai direktori sementara. S87 memeriksa traversal |
| R15 | 14-16 agen paralel di satu working tree membebani CPU | Tinggi / sedang | Sinyal CPU sebelum setiap batch. Lebar dapat diturunkan tanpa mengubah blueprint |
| R16 | Walker IL mungkin tidak menyertakan berkas di subfolder bersarang `studio/` | Sedang / sedang | Diuji S75/S80. Bila gagal, menjadi baris R dengan pemilik route IL |
| R17 | Penegakan peran baru (kelas K) bertentangan dengan kebijakan "semua yang login akses penuh" | Rendah / sedang | KT-16. Hanya berlaku di route Studio |
| R18 | Pemindai bahasa (G-07) tidak tersedia | Pasti / rendah | KT-13. Status NOT-RUN dilaporkan jujur |

## 10. Konflik katalog menjadi parameter (tidak diputus diam-diam)

| Konflik / celah | Kunci parameter | Default usulan | Butuh putusan user |
|---|---|---|---|
| K-09 em dash | `lint.emDash.maxPer1000Words`, `lint.emDash.inHeadings` | 0 dan 0 (kode Garis A); hanya memengaruhi status rilis (A10) | Ya, KT-06 |
| K-11 rel bukti | `layout.railMode` (auto/A/B) | auto (skill); profil Manual 000 (S95) memakai nilai terukur | Ya, KT-07 |
| K-13 ramp heatmap | `chart.heatmap.ramp` | tunggal putih ke signal (manual) | Ya, KT-08 |
| K-07 zebra | `color.role.zebra` + token baru `color.interior.zebra15` | token baru dengan rona 15 persen | Ya, KT-09 |
| K-12 / G-05 kode chart | registri chart `pyRef` | peta S02 | Lewat KT-01/KT-02 |
| K-03, K-04, K-05, K-06, K-14, K-15, K-17, K-18, K-19, K-20, K-29, K-31, K-32, G-01, G-02, G-03, G-08 | kunci masing-masing di katalog | kolom "Usulan" katalog §7.1; G-03 = nilai margin terukur Manual 000 (S95) atau `HS datum_docx.py`; G-02 = 24 pt; G-01 = 400 | Ya, en bloc KT-10 |
| K-01, K-02, K-08, K-10, K-26, K-27, K-28, K-30 | meta versi, registri | sudah diputus katalog atau D-09 | Tidak |
| K-16, K-33, G-04, G-06, G-09 | brief, workbook, A3 | di luar rilis (D-05) | Tidak |
| Nama wajah condensed (temuan research/05) | `type.face.condensed` | kanonik `IBM Plex Sans Condensed`; profil Manual 000 `IBM Plex Sans Cond` | Tidak (profil turunan) |

Catatan: profil DATUM-kanonik memakai default di atas. Profil templat Manual 000 (S95) adalah turunan dengan nilai terukur dari `BM.docx`. Benchmark menguji kemampuan template mereproduksi manual, bukan default kanonik.

## Recommendation & Next-Plan Summary

**Urutan gelombang yang direkomendasikan:**
1. GP-a (S90, S02), lalu GP-b (S01).
2. G0: S03 sendirian, sampai marker ada.
3. G1a..G1e: 71 baris dalam sub-gelombang 14-16, termasuk S70, S68, S69, dan S99 opsional.
4. G3: uji unit dan 5 review.
5. G4: integrasi, paritas DOCX/PDF/diagram/chart.
6. G5: E2E, rollback, benchmark Manual 000. Lalu G5b: kinerja.
7. G6: verifier.
8. Loop R, maks 3 siklus per kriteria.
9. G7: commit lokal. Push hanya atas izin user.

**Yang butuh persetujuan user:** blueprint ini (lewat Plan Mode; status `BLUEPRINT_NOT_APPROVED` sampai tercatat), lebar batch di atas 4 (D-07 sudah mengizinkan; controller mencatat alasan per batch), dan keputusan terbuka di bawah. Waktu putus:
- Sebelum G1: KT-03 (S52, S69) dan KT-15 (S13, S94).
- Sebelum G1e: KT-01, KT-02, KT-08, KT-12.
- Sebelum G4: KT-04.
- KT lainnya hanya mengubah default parameter dan boleh menyusul.

**Catatan untuk controller:**
- Tidak ada baris `pm-planner`. Execution Profile + `masterplan/01_specs.md` berfungsi sebagai rencana. Bila quality gate pra-implementasi mewajibkan `masterplan/02_plan.md`, tambahkan satu baris S `pm-planner` (`writing-plans`) paralel dengan S01 (MINOR).
- research/05 sudah membuktikan konfigurasi B memenuhi D-17 untuk berkas asli. S91 hanya mengunci dan mereproduksinya.
- Harness paritas dan benchmark dibangun paralel di G1 dan hanya dijalankan di fase final (KT-14).

### Keputusan terbuka (bernomor, dengan opsi dan rekomendasi)

| KT | Pertanyaan | Opsi | Rekomendasi |
|---|---|---|---|
| KT-01 | Potongan rilis chart | (a) 58 jenis di v2.1; (b) v2.1 inti = bar, column, threshold + kelompok P penuh + W-01..W-05 + K-01..K-06 + S-01, S-02 + H-01..H-03 + setiap jenis yang dipakai Manual 000 (daftar dari S94), sisanya v2.1.x; (c) hanya 3 keluarga datumchart + jenis Manual 000 | (b): menghemat sekitar 5 baris M dan tetap memenuhi D-14 |
| KT-02 | Kriteria paritas chart berbasis pustakachart (matplotlib) dan chart tanpa acuan | (a) diff piksel ketat; (b) kesetaraan struktural (jenis dan jumlah tanda, himpunan warna, sumbu, ukuran mm, font min) + diff piksel dilaporkan tanpa menahan; (c) lint saja | (b) untuk kode terpeta, (c) untuk kode tanpa acuan. Chart Manual 000 tetap tunduk BM-4 (rata-rata halaman) |
| KT-03 | Akar penyimpanan selama dev/uji v2.1 | (a) env baru `STUDIO_WORKSPACE_ROOT` ke sandbox `data/studio-workspace` (gitignore), produksi kelak `SHARED_WORKSPACE`; (b) langsung `SHARED_WORKSPACE` produksi | (a): menepati batas kerja |
| KT-04 | DB untuk uji integrasi dan gladi rollback | (a) DB baru `gsp_agent_hq_v21_uji` di 5433 lewat `prisma migrate deploy`; (b) transaksi dengan pembersihan di `gsp_agent_hq_v21` | (a): gladi rollback menghapus tabel |
| KT-05 | Sumber nomor dokumen (Register Induk ARSIP tidak ada) | (a) agent memberi nomor, HQ memvalidasi pola P3-18; (b) HQ menerbitkan dari sekuens lokal; (c) keduanya, sekuens sebagai cadangan | (c) |
| KT-06 | Default ambang em dash (K-09) | (a) 0 per 1.000 kata (kode); (b) 3 per 1.000 kata, 0 di judul (manual) | (a); hanya memengaruhi status rilis |
| KT-07 | Default moda rel bukti (K-11) | (a) auto A/B (skill v2.6); (b) rel 32 mm tetap (manual DT-43) | (a) untuk kanonik; profil Manual 000 memakai nilai terukur |
| KT-08 | Default ramp heatmap (K-13) | (a) tunggal putih ke signal (manual); (b) ramp tinta pustakachart | (a); paritas H-03 dijalankan dengan parameter disetel ke (b) |
| KT-09 | Token zebra (K-07) | (a) token baru rona 15 persen; (b) pertahankan ink100; (c) tanpa zebra | (a) |
| KT-10 | Paket default en bloc untuk konflik/celah sisa (§10 baris ke-6) | (a) terima usulan katalog; (b) tinjau satu per satu | (a); semuanya tetap parameter yang dapat diubah admin |
| KT-11 | Lingkup HTML artifact (G-12) | (a) hanya HTML dari template (dokumen paged dan figur), tanpa HTML mentah dari agent, dashboard hidup di luar lingkup; (b) izinkan blok HTML mentah tersanitasi | (a) |
| KT-12 | Dot map dan flow map (G-02, G-03) tanpa peta dasar | (a) tunda ke v2.1.x; (b) skematis di atas grid tile map; (c) user menyediakan GeoJSON | (a), kecuali dipakai Manual 000 |
| KT-13 | Pemindai bahasa grup C (G-07) | (a) subset terdefinisi + NOT-RUN; (b) tunda semua; (c) tunggu alat standar induk | (a) |
| KT-14 | Waktu pembangunan harness paritas dan benchmark | (a) bangun paralel di G1, jalankan di final; (b) bangun dan jalankan di final | (a) |
| KT-15 | Salin aset ke repo | (a) fon Plex + DejaVu (OFL), logo GSP ("GSP Internal Use Only"), dan media raster Manual 000 ke repo; (b) fon saja, logo dan media dibaca dari sumber read-only saat runtime; (c) tidak menyalin | (a) bila repo privat; bila tidak, (b) |
| KT-16 | Hak ubah parameter kelas K | (a) hanya ADMINISTRATOR lewat sesi cookie; agent `x-internal-secret` hanya kelas B; (b) agent juga boleh | (a) |
| KT-17 | Perilaku bila soffice atau fon render tidak siap | (a) PDF rilis gagal `PDF_ENGINE_UNAVAILABLE`; Chromium hanya untuk pratinjau bertanda PRATINJAU; (b) cadangan diam-diam ke Chromium | (a) |

## Validasi V1-V12 (dihitung sendiri; controller wajib menghitung ulang)

| # | Kriteria | Hasil |
|---|---|---|
| V1 | Tabel ada | PASS: satu tabel `## Structured Task Breakdown` |
| V2 | Tepat 8 kolom | PASS: Step, Task Description, Agent_to_Invoke, Skills_to_Load, Expected Output, Depends On, Verification, Phase |
| V3 | Semua sel terisi | PASS: 99 baris (S01-S99, tanpa celah ID). `-` hanya di Skills_to_Load (S01, S02, S68, S90). `none` di Depends On (S02, S90) |
| V4 | Atomik | PASS (bersama V9): satu area dan satu deliverable per baris. Kunci lingkungan, ekstraksi, figur, profil templat, pembanding, dan runner benchmark dipisah |
| V5 | Agen dan skill dari roster, ada lokal | PASS: agen coder-execution, data-analyst, data-collector, test-expert, senior-code-reviewer, security-review, verifier, git-specialist (ada di `~/.claude/agents`). Skill backend-execution, frontend-integration, dry-run-verify-fix, tdd, webapp-testing, code-review-senior, security-review-gate, verification-before-completion, finishing-a-development-branch, receiving-code-review (loop R) ada (Glob/Read SKILL.md). Tidak ada requesting-code-review, to-issues, to-prd, pair-programming |
| V6 | Phase dari 10 nilai baku | PASS: masterplan 1, research 2, implementation 76, test 13, gateway_check 5, verification 1, report 1 (= 99) |
| V7 | Dependensi ada dan DAG | PASS: semua ID rujukan ada. Tepi ke ID lebih besar hanya S01->S90 (B), S19->S25, S29->S31, S50->S51, S51->S52, S51->S92 (C). Tanpa siklus: S90, S25, S31, S52, S92 tidak bergantung balik (S92 hanya ke S03, S91); S51 tidak bergantung S50 |
| V8 | Profil lengkap | PASS: 99 baris profil, ID sama, 7 kolom terisi, tabel Shared resources dan pernyataan biaya ada |
| V9 | Ukuran | PASS: baris L = 0. Baris dengan lebih dari 3 cek = 0. Tidak ada daftar "also/inherited". S03 berlabel risiko |
| V10 | Kepemilikan grounded dan eksklusif | PASS:<br>- Area per batch saling lepas.<br>- `documents` dibagi eksplisit (S55 berkas route.ts, S56 subfolder).<br>- `src/app/studio` dibagi per subfolder (S58-S62).<br>- `benchmark/` dibagi per subfolder (S93-S97).<br>- `render-env/` dibagi S91/S99.<br>- Setiap berkas bersama punya satu penulis.<br>- EXISTS 9 path terverifikasi.<br>- Induk NEW-under (src/lib, src/app, src/app/api, src/components, tests, scripts, prisma, prisma/migrations, docs, akar repo) ada |
| V11 | Jenis dependensi | PASS: setiap tepi berlabel B/C dan identik antara Depends On dan Dep kind. Gelombang diturunkan dari tepi B. Alasan tepi B yang perlu dicatat:<br>- S03:B pada baris G1: kontrak harus mendarat dulu; G0 sendirian per instruksi.<br>- S75:B pada S82: DB uji harus sudah tersiapkan (artefak nyata).<br>- S90:B pada S01: inventaris klaster (artefak nyata).<br>- S91:B pada S98 dan S99: lingkungan terkunci (artefak nyata) |
| V12 | Model dan review | PASS: 11 baris sonnet, masing-masing dengan alasan tiga kata dan lolos uji tiga (keluaran ditentukan masukan, tanpa pilihan desain, dapat dicek mekanis lewat hitungan, sha256, keluaran perintah, atau git status). Agen verifikasi semuanya inherit. Review batched atau n/a. Tidak ada pair |
