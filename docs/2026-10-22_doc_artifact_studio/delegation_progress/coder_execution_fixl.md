---
task_slug: doc_artifact_studio
row: FIX-L (loop perbaikan siklus 1; D-258, F-062)
date: 2026-10-23
agent: coder-execution
status: complete
---

# FIX-L: presisi 11 cek lint yang FAIL pada dokumen 000 (F-062)

Skill: `diagnosing-bugs`, `dry-run-verify-fix`. Area: `src/lib/studio/engine/lint/**` (klaim di `file_claims.md`, baris FIX-L). Semua tulis atomik (salinan kerja di `%TEMP%\fixl_s\work`, salin ke `<berkas>.fixl_tmp`, lalu `mv -f`).

## Ringkasan

- Dari 11 cek: 3 positif palsu karena implementasi kurang presisi (b): **DATUM-09, DATUM-17, D05**. Ketiganya diperbaiki presisinya, ambang tidak diubah.
- 8 cek adalah selisih isi dokumen dengan aturan DATUM (a): DATUM-03, DATUM-04, G3, C-27, C-34, C-SG-L2-04, D18, D20. Tidak diubah. Pada C-27 ditemukan juga cacat ukur pemecah kalimat (penanda butir `1.` dan `ref.`); cacat itu diperbaiki, tetapi vonis tetap FAIL.
- Dokumen 000 (doc.v2.json + template.v2.json, ingest dryRun, `lintAfterRender`, tanpa DB): **31 FAIL / 11 cek -> 18 FAIL / 8 cek**; releaseStatus TERBIT tetap FAIL.
- Koreksi angka: laporan SR-49 menyebut 33 kejadian, padahal hitungan `evidence.json f062` = 1+1+9+2+1+1+1+2+7+4+2 = **31**. Jalan ulang murni baris ini juga 31 (11 cek identik).

## Acuan eksternal yang dijalankan (baca-saja)

`datum_lint.py` HS (garis A, acuan paritas D-10) dan RL (Rev K) atas berkas resmi `C:\Users\TRIAL\workspace\Manual DATUM GSP\Manual_Komprehensif_DATUM_GSP_000-GSP-STD-X-2026_RevA.docx` (python VENV hermes, `-I -B`, cwd sementara, keluaran di `%TEMP%\fixl_s\hs_lint.txt`, `rl_lint.txt`):

- HS: `DATUM-03 FAIL (0.1268 em-dash/1000)`, `DATUM-04 PASS`, `DATUM-09 PASS`, `DATUM-16 PASS`, `DATUM-17 FAIL ('a spasi 0 berkas 17 ± tanpa arti yang dinyatakan 0 berkas 18'; 'ksaan 17 meloloskan ± bila kata rancangan mun...')`, VERDICT FAIL.
- RL Rev K: satu temuan saja (`[38]` garis bawah nama berkas); cek 3, 4, 17 lolos.

## Tabel vonis 11 cek

| Cek | n | Vonis | Aturan DATUM (sumber) | Teks dokumen / kasus | Tindakan |
|---|---|---|---|---|---|
| DATUM-03 | 1 | (a) | HS `scripts/datum_lint.py:239-244` ambang 0 "nol mutlak" (putusan user 08-10); HS `datumcheck.py` A3 em dash nol; parameter templat `prose.emDash.maxPer1000Words = 0` | 4 U+2014: kepala berjalan `// 20261008 ID T — TERBITAN 1`; baris format cap terbit `// YYYYMMDD BAHASA KELAS — TERBITAN n`; dua contoh salah dikutip `"Langkah 1 — ..."`, `"Contoh 1 — ..."`. HS atas BM.docx juga FAIL | tidak diubah. Catatan: RL Rev K memberi plafon 3/1.000 (`references/06-lint.md:34`); mengikutinya = melonggarkan parameter, bukan presisi |
| DATUM-04 | 2 | (a) | HS `datumcheck.py:60, 216-221` `check_heading`: judul berawalan apa/siapa/... = pertanyaan; RL `references/06-lint.md:35` contoh aturan "Apa yang Dikerjakan dan Apa yang Ditemukan"; gabungan c04 + check_heading diputus D-55 | 2.4 "Siapa memiliki keputusan apa", 11.1 "Apa yang diatur dan mengapa" (pola persis contoh aturan) | tidak diubah. Konflik antar sumber untuk controller: RL Rev K E-27 (`06-lint.md:129`, RL `datum_lint.py` `QUESTION = \?\s*$`) hanya menandai judul berakhiran `?` |
| DATUM-09 | 7 | **(b)** | HS `datum_lint.py:149-160` `numeric_data_tables` (>= 2 baris, >= 3 kolom, >= 50 % sel badan angka murni) lalu `c09` (`:301-308`) | Ke-7 tabel (1.3, 4.7, 8.6, 8.9, 11.1, 16.1, 16.2) adalah tabel teks dengan kolom nomor urut (No/Langkah), cacah aturan (Jumlah/Aturan) atau batas; porsi sel angka 20-47 %. Kode lama `checks-a.ts:246` menganggap setiap tabel bercaption dengan peran kolom `numeral` sebagai tabel data. HS atas BM.docx: DATUM-09 PASS | diperbaiki: `isNumericDataTable` (HS >= 50 %; tabel 2 kolom tetap dinilai bila ada peran `numeral`) |
| DATUM-17 | 4 | **(b)** | RL `references/06-lint.md:48` "`±` used without a stated meaning; the GUM warns `±` is ambiguous" (tentang nilai); Rev K E-02 `:132` mempersempit cek 17 | Ke-4 kejadian adalah penyebutan tanda, tanpa operan: Tabel 16.1 "± tanpa arti yang dinyatakan", Tabel 17.2 "meloloskan ± bila kata rancangan ...", "Periksa jendela di sekitar ±", Lampiran B "± berarti". Pemakaian nyata "(230 ± 12) V, toleransi rancangan" dan "(63,2 ± 0,1) m" sudah lolos. Port TS = HS c17 (HS juga menembak); RL Rev K lolos | diperbaiki: `isQuantityPlusMinus` (± dinilai bila operan pada baris sama berupa angka atau simbol satu huruf); jendela makna tidak diubah |
| G3 | 2 | (a) | HS `datumcheck.py:189-197`: cap = int(lebar x 2,05) + 8, gagal bila > 3 x cap | Sel 13.2.2 baris 10 (603 kar) dan 13.3.2 baris 10 (476 kar) di kolom 72 mm: cap 155, batas 465. Isi = pernyataan aturan dikutip verbatim. TS `engine/docx/tables/guards.ts:115-135` identik dengan HS | tidak diubah (di luar area; aturan benar) |
| C-27 | 1 | (a), ukur diperbaiki | RL `references/11-gaya-bahasa.md:341` SG-L6-02 "di bawah 18 kata gabungkan fragmen" dan `:366` Tabel 14.2 koridor 18-32 | Pemecah kalimat menghitung penanda butir sebaris "1." "2." "3." di 6 aside (12.1.4 ... 13.3.5) sebagai 18 kalimat satu kata, dan memutus "DATUM ref. 09". Sesudah perbaikan: 15,5 kata/kalimat (376 kalimat), tetap < 18 | `tokenize.ts`: aturan (d) penanda butir + singkatan `ref`. FAIL tetap. Kanal (K2 panjang) tidak ada di meta: penerapan ke manual = putusan controller |
| C-34 | 1 | (a) | RL `11-gaya-bahasa.md:345` SG-L6-06 "kamu tidak pernah muncul di kanal mengikat"; `:439` hitungan manual "kata *kamu*" | 13.3.5 aside: "...dengan nol kamu pada alamat mengikat." Kata tidak dikutip atau dimiringkan; penyebutan vs pemakaian tidak dapat diputus mekanis tanpa penanda kutip | tidak diubah. Selisih isi: bila kata ditandai kutip, pengecualian presisi baru punya dasar |
| C-SG-L2-04 | 9 | (a) | RL `11-gaya-bahasa.md:157` SG-L2-04 "sajikan sebagai struktur bernomor bila lebih dari tiga" | 9 daftar bullet 4-10 butir; mis. 3.2.2 mengumumkan "empat hal berikut" lalu bullet; 16.4.1 10 pemeriksaan manual (RL `06-lint.md` menomori daftar yang sama) | tidak diubah |
| D05 | 2 | **(b)** | SG-L4-05 terbilang cocok; kode sudah mengecualikan contoh salah/benar (`checks-d.ts:30-38`, `ILLUSTRATIVE = exampleWrongRight`) | Tabel 13.5 "Contoh salah dan benar lapis L4", kepala "Salah, salinan nyata / Benar, salinan nyata", sel "3 (satu) Tahun Anggaran ... 36 (dua belas) bulan: pasangan huruf menangkap cacat angka" = cacat kutipan yang disengaja; dokumen menyandikannya sebagai `table` biasa | diperbaiki: `isWrongRightTable` (kepala memuat kolom berawalan Salah DAN kolom berawalan Benar) masuk pengecualian `proseTexts` |
| D18 | 1 | (a) | RL `11-gaya-bahasa.md:90` SG-L0-03 "Penutup dokumen kerja menyebut keputusan atau aksi yang diminta beserta penerimanya" | Tidak ada paragraf `closingAction`; bab 17 ditutup daftar risiko tersisa (17.5.1) | tidak diubah. Penerapan ke manual (bukan "dokumen kerja") = parameter `doc.closing.actionAndRecipient.required` (P11-05), templat v2 tidak mengisinya (default true): putusan controller/templat |
| D20 | 1 | (a) | Manual Tabel 5.4 baris SUMBER (P5-58): "Kedua tabel dicetak sekali di lampiran dokumen yang memakainya" | Manual sendiri memakai skala: Tabel 5.3 (5.3.2) "PROVENANS seluruh nilai ◇ PEMASOK, keandalan C3"; tabel skala ada di 5.8, lampiran A-D tidak memuatnya | tidak diubah. Catatan: deteksi "dipakai" di `d20` juga menghitung kata "Admiralty" saja (lebih longgar dari aturan), tetapi hasil pada 000 sama dengan deteksi presisi |

## Perubahan

| Berkas | Jenis | Isi |
|---|---|---|
| `src/lib/studio/engine/lint/scan/checks.ts` | ubah | `PM_OPERAND_17`, `isQuantityPlusMinus`; `check17` melewati ± tanpa operan besaran |
| `src/lib/studio/engine/lint/structure/checks-a.ts` | ubah | `isPureNumberCell` (HS `is_pure_number`), `isNumericDataTable`; `a09` memakai definisi tabel data HS; detail FAIL tidak berubah |
| `src/lib/studio/engine/lint/structure/checks-d.ts` | ubah | `isWrongRightTable`, `isIllustrative`; `proseTexts` mengecualikan tabel contoh salah/benar (berdampak ke D01, D02, D05, D19, D21 seperti `exampleWrongRight`) |
| `src/lib/studio/engine/lint/language/tokenize.ts` | ubah | aturan (d) penanda butir `\d{1,3}.` di awal kalimat; singkatan `ref` |
| `tests/unit/studio/engine-core/lint-fixl-precision.test.ts` | baru | 17 kasus positif dan negatif untuk DATUM-17, DATUM-09, D05, C-27 |

## Bukti

| Uji | Perintah | Hasil |
|---|---|---|
| Lint dokumen 000 sebelum | `npx tsx %TEMP%\fixl_s\lint000.ts --detail` (ingest dryRun doc.v2 + template.v2, `lintAfterRender`, tanpa DB) | `{"tier":"TERBIT","releaseStatus":"FAIL","failTotal":31,"checks":11}` |
| Lint dokumen 000 sesudah | sama | `{"releaseStatus":"FAIL","failTotal":18,"checks":8,"by":{"C-27":1,"C-34":1,"C-SG-L2-04":9,"D18":1,"D20":1,"DATUM-03":1,"DATUM-04":2,"G3":2}}`; DATUM-09 PASS "2 tabel data numerik ... memuat satuan", DATUM-17 PASS, D05 PASS, C-27 "15,5 kata per kalimat (5818 kata, 376 kalimat)" |
| Unit lint/engine-core | `npx vitest run tests/unit/studio/engine-core` | sebelum `9 passed / 281 passed`; sesudah `Test Files 10 passed (10), Tests 298 passed (298)` |
| Unit studio penuh (regresi) | `npx vitest run tests/unit/studio` | `7 failed / 48 passed` berkas, 32 uji gagal. Uji A/B 20 berkas terdampak dengan berkas lint ASLI vs PERBAIKAN: `32 failed / 664 passed` identik di kedua sisi (pra-ada: fix1, api/ingest, structure/adapt-v1, display-field, renderers, diagram-bad-cases; tidak ada yang merujuk cek ini) |
| tsc | `npx tsc --noEmit -p tsconfig.json` | 2 galat, keduanya `tests/unit/studio/structure/adapt-v1.test.ts:47,54` (pra-ada, di luar area); 0 di `engine/lint/**` dan berkas uji baru |
| eslint | `npx eslint src/lib/studio/engine/lint tests/unit/studio/engine-core/lint-fixl-precision.test.ts` | exit 0, 0 temuan |

DB tidak disentuh (ingest `dryRun: true`, templat dari berkas). Skill DATUM HS/RL hanya dibaca dan dijalankan baca-saja.

## Persistent Issues

| Isu | Percobaan | Akar | Status | Memblokir? |
|---|---|---|---|---|
| releaseStatus 000 tetap FAIL (8 cek, 18 kejadian) | - | isi dokumen vs aturan (vonis a) | diserahkan ke putusan controller | tidak (mode report D-34) |

## Issues & Decisions (untuk controller)

| Butir | Isu / keputusan | Usulan |
|---|---|---|
| DATUM-04 | HS/D-55 vs RL Rev K E-27 berbeda definisi | putusan sumber aturan; bukan perbaikan presisi |
| DATUM-03 | HS 0 vs RL 3/1.000; cap terbit format DATUM sendiri memuat em dash | putusan isi/parameter |
| C-27, C-34, D18 | penerapan kanal (K2 / kanal mengikat / dokumen kerja) tidak tercatat di meta | putusan kanal dokumen atau parameter templat |
| D20 | deteksi "dipakai" menghitung kata "Admiralty" saja | kandidat presisi lanjutan, tidak terbukti positif palsu pada 000 |
| Uji pra-ada | 32 uji unit studio gagal tanpa kaitan dengan lint | sudah dipetakan baris lain |

## Next Steps

- Render ulang revisi 000 di DB (di luar wewenang baris ini) akan melaporkan 18 FAIL / 8 cek; review recommended (lingkup: 4 berkas lint + uji baru).

---

# Lanjutan D-263 (DATUM-03, DATUM-04) dan D-267 (sampel serah-handover)

## D-263

| Cek | Perubahan | Berkas |
|---|---|---|
| DATUM-03 | Ambang 0 tetap. `TextSegment.role` baru: medan sampul `data.colophon`, `data.identityString`, `data.control` = `apparatus`; sel kolom "Salah" tabel contoh salah/benar (kepala Salah+Benar, atau `exampleWrongRight` kolom 2) = `wrongExample`. Em dash di dalam string cap terbit `// ... — TERBITAN n` di mana pun (kolofon atau tabel spesifikasi) tidak dihitung. Cek lain tetap membaca semua teks. Detail FAIL kini menyebut alamat em dash dan jumlah yang dikecualikan | `scan/walk.ts`, `scan/checks.ts` (`check03`, `stripStampDash`) |
| DATUM-04 | `questionHeading` = berakhiran `?` saja (RL Rev K E-27); `Q_LEAD`/`Q_HEAD` dihapus | `scan/checks.ts` |
| D05 | `isWrongRightTable` dipindah ke `scan/walk.ts` (satu definisi), diekspor ulang dari `structure/checks-d.ts` | `structure/checks-d.ts` |
| Uji | `lint-scan.test.ts`: 3 ekspektasi `questionHeading` + ekspektasi Manual 000 kanonik `['DATUM-04','G3']` -> `['G3']` (konsekuensi langsung D-263; diberi komentar); `lint-fixl-precision.test.ts`: +9 kasus (cap terbit/kolofon PASS, em dash paragraf FAIL, judul sampul ber-em dash FAIL, kolom Salah PASS / kolom Benar FAIL / tabel biasa FAIL, format cap terbit di tabel PASS, label kata tanya tanpa `?` lolos gerbang by-construction, judul `?` ditolak) | tests |

Dokumen 000: 18 FAIL / 8 cek -> **16 FAIL / 7 cek** (DATUM-04 hilang). DATUM-03 masih FAIL: `0.08 em dash per 1.000 kata (2 dalam 26634 kata); di 17.1.3; 2 em dash aparatus/contoh salah tidak dihitung`. Sisa 2 em dash = Tabel 17.1 baris R-13 kolom "Sumber A": `Chart: "Langkah 1 — ...", "Contoh 1 — ..."`. Ini contoh salah yang dikutip di tabel rekonsiliasi (kepala ID/Pokok/Sumber A/Sumber B/Putusan/Dasar), BUKAN tabel Salah/Benar, jadi sesuai brief tetap dihitung. Putusan controller bila kutipan di tabel rekonsiliasi ikut dikecualikan.

Gerbang by-construction (`services/ingest/by-construction.ts`, tidak diubah) memakai `questionHeading` lewat `check04`; uji SR-45 F-065 memakai judul `'Apa temuan utama kajian ini?'` (berakhiran `?`) dan tetap lulus: `✓ F-065 (FIX-S) ... -> 422 BY_CONSTRUCTION_FAILED (DATUM-04)`. `QUESTION_TITLE` uji API juga berakhiran `?`.

## D-267 (serah-handover ditolak DATUM-09)

Tabel yang ditolak: `tests/parity/fixtures/doc/doc_serah_handover.json` `/chapters/0/sections/0/blocks/4`, Tabel 1.2 "Rekonsiliasi dua rute hitung." (registerTable preset reconciliation, peran kolom id/text/text/text):

| ID | Besaran | Rute 1 | Rute 2 |
|---|---|---|---|
| RK-01 | Debit total | 36 | 36 |

Perhitungan: 2 baris, 4 kolom; sel badan 4, angka murni 2 ("36", "36") = 50 % >= 50 % -> tabel data numerik. Satuan: tidak ada peran `unit`, tidak ada `columns[].unit`, kepala tanpa "satuan"/"unit"/kurung. Sel kosong, tanggal atau nomor urut tidak terlibat. HS `c09` atas tabel yang sama juga menolak (porsi 50 %, regex UNIT HS tidak menemukan satuan di seluruh teks tabel). Kode lama melewatkannya hanya karena tidak ada kolom berperan `numeral`. **Vonis: selisih isi sampel (a)**: debit 36 tanpa satuan ("A number without a unit is not an engineering figure", RL `references/06-lint.md:40`). Tidak dilonggarkan; perbaikan sampel = satuan di kepala, mis. "Rute 1 (m3/jam)" (diuji PASS).

Presisi tambahan (ditemukan saat diagnosis, D-267): kolom nomor urut (isi badan tepat 1..n, n >= 2) tidak ikut porsi `isNumericDataTable`. Percobaan pertama (mengecualikan kolom berperan `id`) ditolak sendiri karena memunculkan positif palsu baru pada Manual 000 Tabel 8.9 (No 1..12 + kode CH-nn); aturan urutan 1..n tidak. Sampel lain (SERAH/TERBIT): `doc_terbit_report` PASS, `doc_nota_memo` PASS. `doc_nota_tables` (tier NOTA, DATUM-09 tidak berlaku untuk NOTA) bila dipaksa SERAH: Tabel 1.12 (rekonsiliasi yang sama) dan Tabel 1.18 distribusi satu baris `1 | ... | 1` (n = 1, sengaja tidak dianggap urutan).

## Bukti lanjutan

| Uji | Hasil |
|---|---|
| `npx vitest run tests/unit/studio/engine-core` | `Test Files 10 passed (10), Tests 309 passed (309)` |
| `npx vitest run tests/unit/studio/api-structure` | `Test Files 7 passed (7), Tests 132 passed (132)` (F-065 lulus) |
| `npx vitest run tests/unit/studio` | 21 gagal di 5 berkas: fix1 (14), diagram-bad-cases (4), asset-bytes, docx-determinism, chart-smoke (`expected 133 to be 130`, jumlah ParamDef chart dari baris lain); tidak ada berkas lint. |
| Lint dokumen 000 | 31/11 (awal) -> 18/8 (FIX-L) -> **16/7** (D-263); releaseStatus FAIL |
| `npx tsc --noEmit -p tsconfig.json` | 0 galat (seluruh proyek) |
| `npx eslint src/lib/studio/engine/lint <2 berkas uji>` | exit 0 |
