# SR-42: Uji ulang S71/S72/S73 (engine-core, renderers, figures)

Baris: SR-42 (blueprint `identification/05_structural_sections_blueprint.md:783`), agen test-expert, skill tdd. Tanggal: 2026-10-23. Status: complete setelah lanjutan D-275 (§10): `tests/unit/studio` 1969/1969 lulus. Status awal pukul 08:16: needs-review (1 kegagalan dipetakan ke SR-41).

## 1. Strategi uji

- Cakupan: memperbarui uji usang di `tests/unit/studio/engine-core/**`, `tests/unit/studio/renderers/**`, `tests/unit/studio/figures/**` agar mengikuti PERILAKU YANG DIPUTUSKAN (D-130, D-136, D-137, D-138, D-151, D-158, D-162, D-165, D-168, D-178, D-180, D-215, D-84), lalu menjalankan ketiga suite.
- Prinsip: setiap ekspektasi yang diubah memuat komentar `SR-42 (D-xxx)` di berkas uji. Bila kode menyimpang dari keputusan, uji dibiarkan gagal. Tidak ada uji yang dilonggarkan menjadi tautologi: pin hitungan dan jangkar sha diverifikasi ke sumber sebelum diganti.
- Pengecualian: kode produksi (`src/**`, `prisma/**`) dan fixture paritas (`tests/parity/fixtures/**`, milik SR-41) tidak disentuh. Spec varian dibentuk di dalam uji bila fixture paritas tidak lagi mewakili kasus sah.
- Kerangka: Vitest 4.1.11 (`vitest.config.ts`, hanya `tests/**`); tanpa konfigurasi coverage.
- Klaim berkas: `delegation_progress/file_claims.md` (4 baris SR-42). Salinan asli uji sebelum diubah ada di scratchpad sesi (bukan repo; folder uji tidak terlacak git).

## 2. Ringkasan berkas uji yang diubah

| Berkas | Uji diubah | Keputusan |
|---|---|---|
| engine-core/tokens.test.ts | 9 | D-130, D-158, D-162, D-165 KT-4, D-168 |
| engine-core/lint-structure-language.test.ts | 2 | D-178, D-180 |
| engine-core/lint-scan.test.ts | 1 | D-178, D-180 |
| renderers/docx-determinism.test.ts | 1 (jangkar + penjaga sha fixture) | D-130, D-151, D-112 |
| renderers/asset-bytes.test.ts | 3 (it.each 2 -> 1 kasus) | D-138 |
| renderers/docx-sections.test.ts | 1 (sampel device sintetis) | D-138 |
| figures/diagram-families.test.ts | 5 diubah + 1 baru | D-137 butir 2 |
| figures/chart-smoke.test.ts | 1 pin + K-08 1 -> 2 uji | D-215, D-84, F-S73-1 |
| figures/chart-params.test.ts | 1 | D-136 |

## 3. Inventaris kasus (ekspektasi yang diubah)

| Uji | Kategori | Ekspektasi lama -> baru | Alasan + rujukan | Status |
|---|---|---|---|---|
| tokens: kelas T punya derive | registri | 3 kunci pengecualian -> `[]` | P9-04/38/51 kini ber-derive (D-130, F-S71-2; file_requests FIX-6) | PASS |
| tokens: 3 kunci T diagram dari induk | turunan | override `type.baselinePt` 12 -> override `type.scale.body.leading` 12; override langsung baseline = PARAM_CLASS_T_READONLY | P4T-17 menjadi T (D-168) | PASS |
| tokens: kriteria §7 #1 | turunan | override `grid.textColumnMm` 120 -> preset (base) `grid.outerMarginMm` 28 menghasilkan kolom 120, bentang 158, kisi 10 | P4G-03 menjadi T (D-168, PC-02); margin = turunan beracuan, hanya disematkan preset (D-165 KT-4) | PASS |
| tokens: P4G-15 | batas | grid 202 + SCHEMA_INVALID -> override kolom ditolak T, cek tetap 210; 6 kertas x 2 orientasi selalu menutup | kolom teks diturunkan dari halaman (D-158, D-168) | PASS |
| tokens: blok teks (D-33) | batas/galat | base blok 290 -> margin -19 -> blok 290 dibuang (247), A4 landscape 160, base margin bawah 280 -> blok -9 + SCHEMA_INVALID | P4G-11 T `textBlockFromPage` (D-162, D-165, D-168), penjaga SR-60 | PASS |
| tokens: non-A4 | turunan | override `page.sizeMm` -> `page.customSizeMm` [216,279]; override sizeMm = T_READONLY | P4G-01 T `pageSizeFromPaper` (D-158, D-168, D-172) | PASS |
| tokens: kelas B semua pemanggil | hak | `grid.textColumnMm` -> `grid.gutterMm` | D-168 | PASS |
| tokens: assertOverrideRights | hak | idem | D-168 | PASS |
| tokens: validasi nilai | validasi | `grid.textColumnMm` 'lebar' -> `grid.outerMarginMm` 'lebar' (SCHEMA_INVALID, nilai 20 dipertahankan) | D-168 | PASS |
| lint-structure: pin modul struktur | registri | 45 -> 48 | SR-18 +3 cek (D-178; D-178 menyebut SR-43, tetapi berkas ada di area eksklusif SR-42) | PASS |
| lint-structure: tier NOTA | tier | NOTA `[]` -> tepat 4 cek LD-01..LD-04, semua PASS | cek bertier semua (D-178, D-180) | PASS |
| lint-scan: NOTA | rilis | NOT_RUN + banner "lint tidak diwajibkan" -> 4 cek berlaku, SLOT_CONTENT_MISSING PASS, rilis PASS | D-178, D-180 | PASS |
| docx-determinism: jangkar | regresi | e9d08818 -> 76f978a1, terikat sha fixture `ca2c55d4…` | rantai diverifikasi per bagian ZIP, lihat §4 | FAIL (SR-41) |
| asset-bytes: media/HTML/integritas | aset | semua aset (logo + denah) -> aset yang dirujuk blok (denah_ruang) | fixture SERAH konten-saja: device logo disusun templat (D-138) | PASS |
| docx-sections: device | struktur | sampel dari fixture -> 3 blok device sintetis (hairline, spineString, issueStamp) bila fixture tak memuatnya | D-138 (fixture konten-saja tanpa device) | PASS |
| diagram: dg_layered_good | negatif | build sah -> BY_CONSTRUCTION_FAILED DATUM-25, HTTP 422 | D-137 butir 2 (warna dari SVG nyata, 6 > 5) | PASS |
| diagram: build sah, determinisme, labels_verified x2, apparatus | positif | basis layered = fixture -> varian 5 warna (tanpa tanda TERUKUR) | D-137 butir 2 | PASS |
| chart-smoke: pin ParamDef | registri | 99 -> 130 (87 + 12 + 31) | IP-41c (D-215) | PASS |
| chart-smoke: K-08 | penjaga | k08.json 688 unit ditolak -> k08.json (100 unit) terender + spec 688 unit dibentuk di uji tetap ditolak K-08 | F-S73-1 ditutup (fixture diselaraskan); penjaga > 100 ikon D-84 | PASS |
| chart-params: accentPoint | alias | diteruskan apa adanya -> diurai ke `accent.point`, `aliased` + PARAM_ALIAS REPORT | D-136 (alias aksen diurai sekali) | PASS |

## 4. Bukti jangkar determinisme (D-130)

Diverifikasi dengan membandingkan bagian ZIP DOCX arsip (skrip pembanding sementara, scratchpad):

- e9d08818 (`tests/parity/out/s76/.../node/*.docx`, 01:49) -> a9e3fac6 (`tests/parity/out/fix3/.../node/*.docx`, 02:26): `word/fonts/*` (+font11/12), `fontTable.xml`, rels = F-059 bold condensed tertanam (D-130); `document.xml` baris total (sel label gridSpan 5 -> 2 + sel kosong) = fixture `doc_nota_tables.json` ditulis ulang 02:13 (klaim FIX-3), bukan mesin. FIX-6 mencatat hal yang sama (`coder_execution_fix6.md:24`).
- a9e3fac6 -> 76f978a1: hanya `word/footer1.xml` + `footer2.xml` (blok register footer dari P4S-11/P4S-12, pemisah NBSP; D-151, RQ-6).
- Render fixture pra-SR-41 (sha `ca2c55d4…`, salinan SR-41 `%TEMP%/sr41/before/doc_nota_tables.json`) = `76f978a1b9be…`.
- SR-41 menulis ulang fixture doc ke konten-saja pukul 08:06 (selama sesi ini). Render fixture baru (sha `2dcb160a…`) = `74c0d8d04011…`; selisih vs 76f978a1: `document.xml` 3886 baris diff (sel tabel, tcBorders/tcMar, run), `header1.xml`, `footer1.xml`. Jangkar TIDAK disalin ke 74c0d8d0 karena selisih itu belum dianalisis/diterima.

## 5. Keluaran suite (sebelum / sesudah)

Perintah: `npx vitest run tests/unit/studio/<folder>` (Vitest 4.1.11).

| Suite | Sebelum (07:59) | Sesudah (08:14-08:16) |
|---|---|---|
| engine-core | `Tests 12 failed / 269 passed (281)`, `Test Files 3 failed / 6 passed (9)` | `Tests 281 passed (281)`, `Test Files 9 passed (9)` |
| renderers | `Tests 1 failed / 136 passed (137)`, `Test Files 1 failed / 7 passed (8)` | `Tests 1 failed / 135 passed (136)`, `Test Files 1 failed / 7 passed (8)` |
| figures | `Tests 8 failed / 354 passed (362)`, `Test Files 3 failed / 3 passed (6)` | `Tests 364 passed (364)`, `Test Files 6 passed (6)` |
| Total | 21 gagal / 759 lulus (780) | 1 gagal / 780 lulus (781) |

Catatan antara: setelah konversi fixture SR-41 (08:06), renderers sempat `5 failed / 132 passed`: asset-bytes x3, docx-sections device, jangkar. Empat yang pertama diadaptasi ke D-138 (§3). Selisih jumlah uji: renderers -1 (it.each integritas 2 -> 1 aset dirujuk), figures +2 (DATUM-25 negatif, K-08 dipecah dua).

Kegagalan tersisa (kutipan):
```
FAIL docx-determinism.test.ts > jangkar lintas sesi (log keputusan) > fixture tabel (tanpa figur) = sha256 76f978a1...
AssertionError: fixture doc_nota_tables.json berubah (SR-41): ambil ulang jangkar setelah SR-41 diterima:
expected '2dcb160a9e2b8245ce0160703b583916bfa88…' to be 'ca2c55d49d7c154c944e6171b4a4b0a07c66e…'
```
Pemilik: SR-41 (konversi fixture konten-saja masih berjalan; `coder_execution_sr41.md` belum ada saat 08:16). Setelah controller menerima SR-41, jangkar diambil ulang dengan analisis selisih per bagian (bukan disalin).

Pemeriksaan pendukung: `npx eslint tests/unit/studio/engine-core tests/unit/studio/renderers tests/unit/studio/figures` exit 0. `npx tsc --noEmit -p .`: 0 galat di area SR-42; 29 galat di luar area (`tests/integration/studio/studio-db.integration.test.ts` 21, `tests/unit/studio/api-structure/auth.test.ts` 8).

## 6. Analisis cakupan dan celah

- Cabang `pageWidthIssues` P4G-15 (`engine/tokens/index.ts:52-64`) tidak dapat dicapai lewat registri: deriver cadangan selalu menghitung ulang kolom teks, bahkan bila ParamDef dibuat B tanpa derive (probe). Grid kini menutup by construction; cabang itu tinggal penjaga defensif tanpa uji.
- KT-4 (turunan beracuan hanya disematkan preset) ditegakkan di `services/skeleton/access.ts:230-231`, bukan di `resolveParams` (override `grid.outerMarginMm` diterima mesin tanpa galat). Uji tokens memakai lapis base untuk sematan. Uji gerbang KT-4 ada di luar area SR-42.
- Device v1 hanya diuji dengan blok sintetis (sealBand/logo/datumRule butuh aset, tidak disampel).

## 7. Catatan CI dan uji tidak stabil

- Jangkar determinisme bergantung pada fixture SR-41; selama SR-41 berjalan, uji ini gagal dengan pesan eksplisit.
- Uji renderer membaca `tests/parity/fixtures/doc/*` langsung. Penulisan fixture paralel oleh baris lain dapat mengubah hasil di tengah run (terjadi pukul 08:06).
- Tidak ada uji tidak stabil (flaky) pada run berulang.

## 8. Temuan dan rekomendasi (untuk controller)

1. SR-41: `doc_nota_tables.json` konten-saja tanpa templat pendamping menghasilkan DOCX yang berbeda nyata dari versi sebelumnya (3886 baris diff `document.xml`). Hipotesis: format tabel inline dibuang tanpa dipindah ke templat (D-138 mewajibkan tampilan di templat). SR-41 perlu memastikan hal ini sebelum jangkar diambil ulang.
2. SR-41: aset `logo_ilustrasi` di `doc_serah_handover.json` v1 kini tidak dirujuk blok mana pun (device logo dibuang). Aset itu juga tidak ada di salinan v2.
3. D-178 menyebut "SR-43 pin uji 45 -> 48", tetapi berkas uji ada di area eksklusif SR-42. Pin sudah diperbarui di sini; SR-43 tidak perlu menyentuhnya.
4. Rekomendasi: setelah SR-41 diterima, jalankan ulang `npx vitest run tests/unit/studio/renderers`, analisis selisih bagian ZIP, lalu perbarui `TABLES_FIXTURE_SHA` + jangkar dengan rujukan D penerimaan SR-41.

## 9. Cara menjalankan

```
npx vitest run tests/unit/studio/engine-core
npx vitest run tests/unit/studio/renderers
npx vitest run tests/unit/studio/figures
npx eslint tests/unit/studio/engine-core tests/unit/studio/renderers tests/unit/studio/figures
```

## 10. Lanjutan SR-42 (D-275, setelah siklus perbaikan 1+2 mendarat)

Brief controller: (1) ambil jangkar baru dari fixture final SR-41 (D-256/D-270) setelah D-265; (2) diagram-bad-cases D-242; (3) pin chart 130 -> 133 (D-268); (4) diagnosis asset-bytes.

Keadaan awal (09:57, `npx vitest run tests/unit/studio/<folder>`): engine-core `309 passed (309)` (ada berkas baru `lint-fixl-precision.test.ts` dari baris lain; lulus); renderers `2 failed | 134 passed (136)`; figures `5 failed | 359 passed (364)`.

| Uji | Diagnosis | Perubahan + rujukan | Status |
|---|---|---|---|
| docx-determinism: jangkar | fixture final SR-41 (sha `03a943e9…`, 09:27) tidak sama dengan fixture penjaga `ca2c55d4…` | Jangkar dirender dengan templat pendamping `doc_nota_tables.template.json` (helper kit baru `fixtureTemplate`, setara `render_cli --template`). Uji merender 3 kali dalam proses dan memeriksa ketiganya identik, lalu jangkar `a4e6ff62`; penjaga sha fixture = `03a943e9…` (D-256, D-270) | PASS |
| asset-bytes: fixture memuat >= 2 aset | uji usang: SR-41 menghapus `logo_ilustrasi` (D-256); bukan hard link (D-255), bukan raster (D-265). Uji ini tidak menyentuh penyimpanan maupun Chromium | ekspektasi: >= 1 aset; himpunan aset yang dideklarasikan = aset yang dirujuk blok (D-256: check_doc_fixtures menandai aset tak dirujuk) | PASS |
| diagram-bad-cases (DATUM-33 + 3 uji agregat) | D-242: tinggi simpul/jarak tingkat dikoreksi; kasus HS 5 tingkat kini 152,4 mm (probe: 8 tingkat 238,1 mm, 10 tingkat 295,3 mm) | `bad_cases.json` dibiarkan identik byte dengan HS (penjaga drift). Di dalam uji, kasus diperpanjang menjadi 10 tingkat berantai. Uji baru mematok bahwa kasus HS asli < 247 mm dan varian ditolak DATUM-33 | PASS |
| chart-smoke: pin ParamDef | D-268 +3 `chart.kind.{P-13,P-14,S-01}.axis` | 130 -> 133, petunjuk 31 -> 34, tiga kunci axis wajib ada | PASS |

Bukti jangkar `a4e6ff6298e44be3f0315c14041fb1e1f51c1cbf87ae1f33ded0e50827020417`:
- 3 render dalam satu proses identik (asersi `new Set(shas).size === 1`), dan 3 proses vitest terpisah: `Tests 10 passed (10)` x3.
- `npx tsx scripts/parity/run/render_cli.ts --doc .../doc_nota_tables.json --template .../doc_nota_tables.template.json --formats docx` -> `status=SUCCEEDED ... lint=PASS`, DOCX sha `a4e6ff6298e44be3` = render kit uji.
- Selisih vs 76f978a1, per bagian ZIP: `document.xml` 1150 baris diff (tblW/tcW 7257 -> 7200 tw = kolom 127 mm dari margin pendamping; lebar kolom/perataan per tabel dibuang), PNG garis datum berganti nama sesuai lebar baru, header/footer/styles/rels berubah panjang-tetap. Semua sesuai putusan D-256: format per tabel bukan milik konten (D-139).
- Uji renderer lain tetap memakai profil kanonik (menguji sifat renderer, bukan fidelitas fixture). Hanya jangkar yang memakai pendamping.

Keluaran akhir:
```
npx vitest run tests/unit/studio      (10:02)
 Test Files  57 passed (57)
      Tests  1969 passed (1969)
npx eslint tests/unit/studio/engine-core tests/unit/studio/renderers tests/unit/studio/figures  -> exit 0
npx tsc --noEmit -p .                  -> 0 galat (repo)
```
Temuan §8 butir 1-2 untuk SR-41 ditutup oleh D-256 (selisih tabel diterima, `logo_ilustrasi` dihapus).
