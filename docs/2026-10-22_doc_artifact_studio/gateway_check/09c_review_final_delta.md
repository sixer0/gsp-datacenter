# SR-56c — Review kode akhir: delta setelah 10:05 (D-305 M-2)

- Peninjau: senior-code-reviewer; skill: code-review-senior. REVIEW-ONLY: kode produksi tidak diubah. Siklus sebelumnya tetap utuh di `09_review_structural_engine_ui.md` dan `09b_review_engine_ui_fixloop.md`.
- Tanggal: 2026-10-23. Diff terhadap HEAD. Catatan baris yang dibaca: `delegation_progress/coder_execution_{fixs2,fixu2,fixz,fixserah,fixc2,fixa2,fixb2,fixh,fix2}.md`. Keputusan: D-281, D-287, D-288, D-289, D-290, D-293, D-294, D-297, D-300 s.d. D-303, D-305, D-308, D-309.
- Kriteria: kebenaran, duplikasi, kepatuhan D-139, determinisme, regresi.
- Batas cakupan: middleware HQ (`src/middleware.ts`, 61 baris berubah vs HEAD) dan jalur keamanan dinilai SR-57, tidak di sini.

## 1. Bukti segar

| Pemeriksaan | Perintah | Keluaran |
|---|---|---|
| tsc seluruh repo | `npx tsc --noEmit -p .` | exit 0 |
| eslint | `npx eslint src/lib/studio src/app/api/studio src/components/studio src/app/studio scripts/parity/run scripts/studio benchmark/harness/run` | exit 0 |
| Unit Studio | `npx vitest run tests/unit/studio` | 64 berkas, 2028/2028 lulus |
| Selftest pembanding paritas | `python -I -B selftest_compare.py` dengan venv harness (`scripts/parity/run/lib/python.ts:14`) | 35/35 lulus. Dengan Python sistem: 33/35, dua kasus FAIL `ModuleNotFoundError` (`skimage`, `playwright`), lihat C10 |

## 2. Vonis

**Keseluruhan: APPROVED WITH COMMENTS.** Ada 10 temuan: 0 High, 2 Medium, 8 Low. Tidak ada regresi pada jangkar yang diklaim (DOCX v1 `53485ebc…` dan v2 resmi `952f65d6…` dibuktikan oleh baris pemilik; suite segar hijau). Dua Medium:
- C1: format `lastFilledBy` agen menyimpang dari kontrak terdokumentasi.
- C2: HTML mengabaikan kenop penempatan/aktif perangkat sampul dan pembatas, termasuk kenop esensial USER "Tampilkan string punggung". Ini kelas cacat F-055 yang belum tercakup FIX-2.

| Domain | Vonis | Temuan |
|---|---|---|
| Structure | CAUTION | C4, C7 |
| Dependency Impact | PASS | - |
| Duplication | CAUTION | C3 |
| Maintainability | PASS | C9, C10 (Low) |
| Reference Integrity | CAUTION | C1, C2, C5, C6, C8 |

### 2.1 Vonis per modul

| Modul (baris) | Vonis | Temuan |
|---|---|---|
| Teks + aparatus bersama `engine/front/{texts,apparatus}.ts` (FIX-2, FIX-SERAH) | CAUTION | C2, C3, C4 |
| Pembungkus HTML `engine/html/blocks/{wrapper,text}.ts` (FIX-2, FIX-SERAH, FIX-X) | CAUTION | C2, C3 |
| Pembungkus DOCX `engine/docx/{wrapper/pages.ts, blocks/structure.ts, assemble/units.ts}` (FIX-2, FIX-SERAH) | PASS dengan catatan | C3 |
| Mesin diagram `engine/diagram/**` (FIX-B2: sld multi-rel D-288, layered/graph, kotak pembatas D-293) | PASS dengan catatan | C5, C6 |
| Compose `services/compose/blocks.ts` `keyRowOnPage` + kontrak `diagram.schema.ts` (FIX-B2, FIX-Z) | PASS dengan catatan | C6; IP-80 sudah tercatat |
| Mesin chart `family-h2/contour.ts`, `family-s1/*` (FIX-C2, FIX-A2) | PASS | - |
| `engine/tokens/raster-width.ts`, batas figur chart, R-65 (FIX-A2) | PASS | IP-79 sudah tercatat |
| Layanan tulis/validasi v2 (FIX-S2: `submit/meta.ts`, `validate/_shared/*`, `inline-format/policy.ts`) | CAUTION | C1, C7 |
| UI `components/studio/**` (FIX-U2, FIX-Z) | PASS | - |
| Harness paritas `scripts/parity/compare/**` (FIX-H) | PASS dengan catatan | C8, C9, C10 |
| CLI `scripts/parity/run/lib/render.ts` (FIX-A2 N4, FIX-H) | PASS | IP-78, IP-87 sudah tercatat |

## 3. Temuan

| # | Tingkat | Domain | Berkas:baris | Deskripsi dan bukti | Pemilik | Usulan |
|---|---|---|---|---|---|---|
| C1 | Medium | Reference Integrity | `src/lib/studio/services/submit/meta.ts:26-30` (`fillerOf`); pemakai `ingest/v2.ts:483`, `revisions/v2/commit.ts:211`, `submit/pipeline.ts:675`; kontrak `contract/auth.ts:74,81-83,132`; dokumen `docs/STUDIO-AGENT-GUIDE.md:137-139`, `docs/API-REFERENCE.md:244-246`; UI `components/studio/shared/labels.ts:247-250` | Untuk `INTERNAL_AGENT`, `fillerOf` mengembalikan `caller.agentId` TANPA prefiks (mis. `analis-01`), padahal `caller.requester` agen = `agent:<agentId>` dan sesi = `user:<nama>`/`google:<email>`. Panduan dan API-REFERENCE menjanjikan `lastFilledBy`/`by` berprefiks (`agent:<agentId>`). Akibatnya ada dua format dalam satu medan, dan `actorLabel` UI (yang memetakan `agent:x` ke "Agen x") menampilkan id agen mentah tanpa label "Agen". FIX-S2 menyebut "SATU format untuk semua jalur tulis", tetapi format yang dipilih berbeda dari kontrak | FIX-S2 (SR-55b N3); DOC-2 bila kontrak yang diubah | Kembalikan `caller.requester` (sudah `agent:<id>`, dan `anonymous-internal` bila tanpa id) untuk semua jenis pemanggil, atau ubah dokumen + `actorLabel` secara sadar. Tambah uji yang mengunci format |
| C2 | Medium | Reference Integrity | HTML: `engine/html/blocks/wrapper.ts:268-270` (Datum Rule sampul), `:302-306` (string punggung sampul, tanpa cek aktif), `:455` (Datum Rule pembatas), pembatas tanpa string punggung; `engine/html/blocks/text.ts:347` (Datum Rule bab); `engine/html/blocks/device.ts:127-129,200-208`. DOCX pembanding: `engine/docx/wrapper/pages.ts:99-105,185-186,216-218,408,461-463,497`, `engine/docx/blocks/structure.ts:57-62`. Kenop: `registry/essentials.ts:360` (EK sampul "Tampilkan string punggung" = `device.spine.enabled`) | `grep -n placements engine/html/blocks/*.ts` = 0. HTML tidak membaca `device.datumRule.placements` (sampul/pembatas/atas judul bab) maupun `device.spine.enabled`/`device.spine.placements`. Akibatnya: (1) USER yang mematikan kenop esensial "Tampilkan string punggung" tetap mendapat string punggung di sampul auto HTML, sedangkan DOCX/PDF menyembunyikannya; (2) templat yang membatasi penempatan Datum Rule (mis. hanya sampul) tetap memunculkannya di bab dan pembatas HTML; (3) pembatas bagian HTML tidak pernah memasang string punggung padahal DOCX memasangnya bila `pembatas` dipilih. Predikat yang benar sudah ada di `engine/front/apparatus.ts:65-76` (`coverApparatusEnabled`), tetapi hanya dipakai jalur sampul explicit. Kelas cacatnya sama dengan F-055/D-308 O-2 ("kenop templat yang tak berpengaruh = cacat") | FIX-2 / FIX-SERAH (pembungkus HTML) | Satu modul predikat penempatan di `engine/front/apparatus.ts` (sampul, pembatas, atas judul bab) dipakai DOCX dan HTML. Tambah kasus paritas `fix2-wrapper-text-parity` untuk `device.spine.enabled=false` dan `placements=["sampul"]` |
| C3 | Low | Duplication | Urutan sampul bawaan P4V-03 tertulis 4 kali: `params/page.ts:354`, `engine/front/apparatus.ts:24-37`, `engine/docx/wrapper/pages.ts:150-162`, `engine/html/blocks/wrapper.ts:204`. Predikat perangkat 2 kali: `docx/wrapper/pages.ts:95-105` vs `front/apparatus.ts:65-76` | "Satu sumber" FIX-SERAH baru berlaku untuk sampul explicit. Sampul auto DOCX dan HTML masih punya salinan sendiri, dan salinan HTML sudah menyimpang (C2) | FIX-SERAH | `coverElementOrder()` dan `coverApparatusEnabled()` dari `apparatus.ts` dipakai kedua perakit. Bawaan dibaca dari `PARAMS_BY_KEY` (registri), bukan literal |
| C4 | Low | Structure | `engine/front/texts.ts:16` (impor `../docx/wrapper/formats`); `texts.ts:145,151` (`ORG_ENTITY_DEFAULT`, format cap terbit bawaan) | Modul "bersama" bergantung pada mesin DOCX, sehingga HTML kini bergantung pada DOCX lewat `front` (sama dengan IP-79 `html/blocks/semantic.ts:19`). Cadangan `"PT GEMILANG SATRIA PERKASA"` dan `"// {YYYYMMDD} … -- TERBITAN {n}"` menyalin bawaan registri P4V-15 (`params/page.ts:444`) dan P4V-14 (`:339`) sebagai literal kedua | FIX-2 | Pindahkan `dateParts/longDate/pStr/pNum/pStrList/roman` ke modul netral (`engine/tokens` atau `engine/front/util`). Cadangan dibaca dari `PARAMS_BY_KEY.get(...).default` |
| C5 | Low | Reference Integrity | `engine/diagram/layout-c/sld.ts:107-123` (`assignBranches`: "edge pertama" menentukan rel pemilik), `:131-145` (`firstUnfedBus`) | Perluasan D-288 (rel hilir tanpa `multiBus`) bergantung pada URUTAN edge. Cabang pencatu X yang punya edge `rel1 -> X` dan `X -> rel2` ditugaskan ke rel yang muncul pertama di `edges`. Bila `X -> rel2` ditulis lebih dulu, X menjadi milik rel2, `firstUnfedBus` menganggap rel2 tidak dicatu, dan spec yang secara listrik sama ditolak `E-17/MULTI-BUS`. Hasilnya deterministik, tetapi semantiknya bergantung urutan | FIX-B2 | Saat menugaskan cabang, utamakan edge rel -> cabang (arah catu turun) di atas edge cabang -> rel. Tambah uji dua urutan edge yang menghasilkan tata letak sama |
| C6 | Low | Reference Integrity | `services/compose/blocks.ts:457-462` (`keyRowOnPage` hanya bila bukan `artifactId`); `engine/diagram/core/sheet.ts:239-243` (`drawsSvgKeyRow`) | Diagram yang merujuk artefak (`artifactId`) dengan `keyRow` di blok tetap menggambar baris KEY di SVG DAN di halaman. Aparatus ganda yang diputus D-288 hanya tertutup untuk spec inline | FIX-B2 | Teruskan sinyal halaman ke render artefak di `services/render/figures.ts` (opsi build, bukan medan spec, yang sekaligus menghindari IP-80), lalu berlakukan untuk inline dan artefak |
| C7 | Low | Structure | `src/app/api/studio/validate/_shared/template-draft.ts:1-72` (360 baris) | Pratinjau draf templat menyusun ulang urutan langkah `saveTemplateV2Tx` (parse → kerangka → lapis preset → `diffEffective` → `checkTemplateWrite` → `assertAdminOnlyFields` → compose) di lapis route, memakai fungsi layanan satu per satu. Hak tulis per kunci untuk pratinjau dan simpan kini dijaga oleh dua urutan yang harus tetap sama secara manual | FIX-S2 / FIX-V | Ekstrak `planTemplateV2(…, {write:false})` di `services/templates/v2` yang dipakai simpan (dengan tulis) dan R08 (tanpa tulis) |
| C8 | Low | Reference Integrity | `scripts/parity/compare/compare_docx.py:369` (`^(TABEL\|GAMBAR)\s+(\d+…)\b`, `re.I`) | Karena tidak peka huruf, pola caption juga cocok dengan kalimat isi yang diawali rujukan ("Tabel 3.2 merangkum hasil uji …"). Paragraf seperti itu dikecualikan sebagai artefak acuan di kedua sisi, sehingga selisih isinya tidak lagi diukur `textOrder`. Simetris, tetapi menurunkan cakupan, bukan hanya presisi | FIX-H | Batasi ke bentuk caption (huruf besar penuh, atau pemisah sesudah nomor diikuti judul pendek tanpa predikat), atau kecualikan berdasarkan peran paragraf/gaya bila tersedia. Tambah kasus selftest kalimat isi berawalan "Tabel 1.1" |
| C9 | Low | Maintainability | `scripts/parity/compare/compare_dg_d242.py:30` (`L_MM = 13.5 * 25.4 / 72.0`); rasio `d242NodeHeightRatio` di docstring `:16` | Garis dasar 13,5 pt ditanam di pembanding, padahal garis dasar adalah parameter templat (`grid.baselinePt`/`grid.latticeYMm`). Fixture kanonik aman, tetapi fixture berkertas atau templat lain akan dinilai dengan kisi yang salah | FIX-H | Baca kisi Y dari laporan mesin atau templat fixture; bila absen, catat bawaan sebagai diagnosis |
| C10 | Low | Maintainability | `scripts/parity/compare/selftest_compare.py` (kasus `fixh_d242_png_raster_integrity…`, `fixh_r5_ca_png_px_pt…`) | Dengan interpreter tanpa `skimage`/`playwright`, selftest melaporkan FAIL (33/35, exit 1) alih-alih SKIP beralasan. Gerbang dapat merah karena lingkungan, bukan kode | FIX-H | Deteksi dependensi di awal: SKIP dengan alasan + exit khusus, atau paksa interpreter `PARITY_PYTHON` seperti runner |

## 4. Catatan tanpa temuan (diperiksa, diterima)

- FIX-2: kicker bab/lampiran HTML dan DOCX kini lewat satu fungsi (`texts.ts:89-103`; DOCX `blocks/structure.ts:51-55`, HTML `html/blocks/text.ts:312-318`). Batas "BAB {n}" eksplisit vs bawaan tercatat IP-91.
- FIX-SERAH: aparatus sampul explicit hanya untuk jenis yang belum ada di badan, logo tepat sekali (`apparatus.ts:101-115`); lint memakai predikat yang sama (`lint/structure/checks-d.ts:209,452`), aturan tidak dilonggarkan.
- FIX-B2 `keyRowOnPage` ditolak di masukan agen dengan `{ not: {} }` (`contract/schema/diagram.schema.ts:103`). D-139 utuh: agen tidak dapat menyembunyikan baris KEY.
- FIX-C2: label kontur cadangan deterministik (tanpa `Math.random`/`Date.now` di `engine/chart/**`; `new Date` hanya dari tanggal data UTC), dilaporkan `H-06-LABEL` (`contour.ts:401-408`). Spine S-03 bertanda `data-spine="1"` (`density.ts:121,124`).
- FIX-U2: sunting tersimpan dulu, baru kemudian R17 (`reader-tab.tsx:466-516`); penolakan render tidak menghilangkan suntingan (D-247). Menu di-portal memakai token global, sehingga tidak bergantung pada `.studio-root` (`reader-tab.tsx:249-275`).
- FIX-H F-007: diagnosis hanya bila ketiga syarat bukti terpenuhi (`compare_png.py:94-122,170`). Selain itu FAIL tetap.
- FIX-S2: pembatas laju R08 memakai identitas terautentikasi, bukan `agentId` badan (`validate-rate.ts:52-60`). `inline-format/policy.ts` adalah modul daun.

## 5. Tantangan

1. **F-055 ditutup untuk teks, belum untuk perangkat (C2).** FIX-2 menyamakan string, tetapi aturan "di mana perangkat muncul" masih dua implementasi, dan HTML tidak punya separuhnya. Karena salah satu kenop yang terdampak tampil ke USER, cacat ini terlihat oleh pengguna di format HTML.
2. **"Satu format" `lastFilledBy` (C1) dipilih berlawanan dengan dokumen.** Ini perlu diputus eksplisit (kode mengikuti dokumen, atau dokumen mengikuti kode) sebelum agen eksternal bergantung pada salah satunya.

## 6. Temuan positif

- Seluruh suite unit Studio hijau (2028/2028), tsc dan eslint bersih, selftest paritas 35/35 di interpreter harness.
- `engine/front/texts.ts` menjadikan teks bawaan pembungkus satu sumber yang diuji paritas (`tests/unit/studio/renderers/fix2-wrapper-text-parity.test.ts`). Pendekatan ini tepat untuk menutup C2/C3 dengan pola yang sama.
- Perluasan sld D-288 tetap menolak rel yang tidak dicatu dengan pesan yang dapat ditindaklanjuti, tidak pernah membuangnya diam-diam (`sld.ts:157-167`).
- Batas siklus perbaikan (maks 3) dipatuhi untuk fig-08 (D-290/D-293).

## 7. Berkas yang dibaca

`engine/front/{texts.ts, apparatus.ts}`; `engine/html/blocks/{wrapper.ts:195-310,345-475, text.ts:305-350, device.ts:120-210, semantic.ts:1-25}`; `engine/docx/wrapper/pages.ts:90-225,400-500`; `engine/docx/blocks/structure.ts:45-66`; `engine/diagram/layout-c/sld.ts` (utuh); `engine/diagram/core/sheet.ts:220-245`; `services/compose/blocks.ts:450-465`; `contract/schema/diagram.schema.ts:103`; `engine/chart/family-h2/contour.ts:20-30,295-420` (bagian label), `engine/chart/family-s1/density.ts:1-10,115-125`; `services/submit/meta.ts`; `services/inline-format/policy.ts`; `contract/auth.ts:70-135`; `app/api/studio/validate/_shared/{template-draft.ts:1-72, validate-rate.ts}`; `components/studio/document-viewer/reader/reader-tab.tsx:140-275,460-530`; `components/studio/shared/{labels.ts:240-255, studio-tokens.css:1-25}`; `registry/essentials.ts` (kenop perangkat); `params/page.ts:330-445` (bawaan sampul); `scripts/parity/compare/{compare_dg_d242.py:1-40, compare_png.py:1-30,90-175, compare_docx.py:355-375}`; `scripts/parity/run/lib/python.ts:14-28`; `docs/STUDIO-AGENT-GUIDE.md:136-139`, `docs/API-REFERENCE.md:243-246`.
