---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: S22
date: 2026-11-04
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/02_structured_datum_rev_a.md
status: complete
---

# Implementation Report: S22, modul aturan structure_b (CR-1, RH, RB, SB, IS, GF, DV)

Skill dimuat: `tdd`. Masukan dibaca: baris S22 (`02_structured_datum_rev_a.md:138, 197`), `delegation_progress/coder_execution_s20.md` (API harness), `research/32` §0, §2, §5-§7, §12 (LB-03), §15-§16, `research/31` §1, §4.2, §4.4, §4.5, §8, §10, F-4, keputusan D-598. Manual dicek langsung untuk SB-02/RB-05 (`manual_id.txt:2573-2577`).

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Klaim path di `file_claims.md` | complete | 1 baris ditambahkan (S22) |
| 2 | Inspeksi struktur DOCX nyata (Manual 000, 4 kasus baseline S05) dengan pembaca harness | complete | skrip sementara di scratchpad, tidak masuk repo |
| 3 | Uji merah: DOCX baik sintetis + CR-1 (9 uji) | complete | merah: semua aturan "unexercised"/tidak ada |
| 4 | `rules/expect_structure_b.ts` (tabel harapan per bahasa + konstanta) | complete | dipilih lewat `pair.language`, tanpa cabang slug |
| 5 | `rules/structure_b.ts`, 33 aturan | complete | 9/9 hijau |
| 6 | Uji mutasi terarah (41 mutasi + 1 uji F-4) | complete | merah awal 3: GF-04 tema (DOCX uji tanpa tema), GF-07 (kicker tanpa caps tidak dikenali), GF-11 (dasar NA); diperbaiki, 51/51 hijau |
| 7 | CLI `--implemented-only` pada 4 kasus baseline + Manual 000 | complete | hasil per aturan di bawah |
| 8 | Suite datum-conformance, tsc, eslint | complete | 195/195, tsc 0 galat, eslint exit 0 |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| `benchmark/datum_conformance/rules/structure_b.ts` | modify (stub S20 diisi) | 33 aturan: CR-1, RH-01/03/04, RB-01..08, SB-01..03, IS-01..03, GF-01..07, GF-09..15, DV-01 |
| `benchmark/datum_conformance/rules/expect_structure_b.ts` | add | Tabel harapan ID/EN (awalan pita kiri, pita kanan, LEMBAR/DARI vs SHEET/OF, BAB/CHAPTER, format cap terbit) + konstanta warna, geometri, ukuran garis/huruf, fon terlarang, kelas wajah Plex |
| `tests/unit/studio/datum-conformance/structure-b.test.ts` | add | 51 uji: cakupan modul, DOCX baik ID/EN TERBIT + NOTA, CR-1 (5), 41 mutasi terarah, GF-13/RH-03 tidak dilemahkan |
| `docs/.../delegation_progress/file_claims.md` | modify (append 1 baris) | Klaim path S22 |

Tidak menyentuh harness (`lib/**`, `rules/types.ts`, `rules/index.ts`, `score.ts`), `catalog.ts`, `rules/structure_a.ts`, `rules/language.ts`, `clash/**`, `_docx_kit.ts`, `src/`, `prisma/`, `scripts/`. Tanpa dependensi baru, tanpa commit, tanpa DB, tanpa port.

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Unit S22 | `npx vitest run tests/unit/studio/datum-conformance/structure-b.test.ts` | 1 file, 51 tests passed | |
| Suite datum-conformance | `npx vitest run tests/unit/studio/datum-conformance` | 9 files, 195 tests passed | termasuk uji harness S20 dan modul S21/S23 yang berjalan paralel |
| Typecheck | `npx tsc --noEmit -p .` | keluaran kosong (0 galat seluruh proyek) | `--listFilesOnly` memuat ketiga berkas S22 |
| Lint | `npx eslint <3 berkas S22>` | exit 0, tanpa keluaran | |
| CLI | `npx tsx benchmark/datum_conformance/score.ts --docx ... --implemented-only` | 5 run, exit 1 (FAIL) masing-masing | skor total memuat modul lain; tabel di bawah hanya structure_b |

## Verification

### DOCX baik dan mutasi (seam: `rules` lewat `runConformance` dengan indeks berisi structure_b saja)

- DOCX baik sintetis (nilai Rev A dari katalog, bukan dari mesin): ID TERBIT dan EN TERBIT, semua aturan berlaku lulus kecuali GF-11 = NA (tanpa gambar isi, bersyarat). NOTA ID: CR-1 lulus tanpa pita segel; SB/IS/RB-07 tidak berlaku.
- Mutasi yang diminta controller, masing-masing menjatuhkan aturannya ke FAIL (DOCX baik lulus aturan yang sama di uji yang sama):

| Mutasi | Aturan yang gagal |
|---|---|
| Klasifikasi hilang dari kepala halaman interior kedua | CR-1 |
| Klasifikasi hilang dari pita segel sampul | CR-1, SB-03 |
| LEMBAR/DARI di dokumen EN (dan SHEET di dokumen ID) | RB-02 |
| Halaman Letter 12240x15840 | GF-01 |
| Margin kiri 1440 tw; margin atas/bawah interior 1440 tw | GF-02; GF-03 |
| Fon badan Calibri (langsung, dan lewat tema `minorHAnsi`) | GF-04 |
| Cap terbit dengan U+2014; EN memakai TERBITAN; tanggal ISO | IS-01 |

- Mutasi tambahan (satu per aturan lain): RESTRICTED di register, SEGERA di semua lokasi, klasifikasi huruf kecil (CR-1); spasi ASCII di literal register, NUMPAGES hilang (RB-03); nomor tidak tebal (RB-04); garis atas register INK900 (RB-05); tanggal register ISO (RB-06); PAGE di footer sampul (RB-07); `pgNumType start` di bab 2 EN (RB-08); register hilang (RB-01); garis kepala INK200 sz 5 (RH-03); teks kiri tinta gelap (RH-04); label bab salah, logo di header (RH-01); pita bukan blok pertama lembar kendali (SB-01); teks pita F6E9E9, lebar 150 mm (SB-02); pita kanan berbahasa ID di EN (SB-03); tanggal/kelas cap terbit tidak konsisten (IS-02); cap terbit tidak tebal (IS-03); fon Plex tanpa sematan (GF-05); badan Georgia 11 pt, spasi baris 1,15 (GF-06); kicker tanpa caps dan Serif (GF-07); garis sz 2 (GF-09); tabel 180 mm (GF-10); gambar isi 100 mm (GF-11); navy 1A2B4A (GF-12); klasifikasi INK900 (GF-13); dua judul bab per seksi (GF-14); outline tingkat 4 (GF-15); Datum Rule hilang (DV-01).
- GF-13 dan RH-03 tidak dilemahkan: DOCX baik yang diberi pola mesin saat ini (klasifikasi INK900 di header dan register, garis kepala INK200 sz 5) gagal tepat di `['GF-13', 'RH-03']`, aturan structure_b lain tetap lulus.

### Hasil per aturan pada dokumen nyata (CLI `--implemented-only`)

Pasangan: Manual 000 = `datum-standar` ID TERBIT; `a_*` = TERBIT; `b_*` = NOTA; `datum-gsp` dari register (KT); `datum-kanonik` di luar register, dijalankan dengan `--type-code KT --kicker ""`. sha256 (16 awal): Manual 000 `dc6ae22f16ddf401`, a_gsp `633e583f59dee6c9`, b_gsp `5aeac7ccd1399fd3`, a_kan `bbbfe86e278178e7`, b_kan `3146b14cba5aeea5`. Berkas: `benchmark/out/fixb/official/Manual Komprehensif DATUM GSP 000-GSP-STD-X-2026 RevA.docx` dan `C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline/cases/<kasus>/<kasus>.docx`. `-` = tidak berlaku untuk tier/bahasa itu.

| Aturan | Manual 000 | a_terbit_datum_gsp | b_nota_datum_gsp | a_terbit_datum_kanonik | b_nota_datum_kanonik |
|---|---|---|---|---|---|
| CR-1 (K) | PASS | PASS | PASS | PASS | PASS |
| RH-01 | PASS | PASS | PASS | PASS | PASS |
| RH-03 | FAIL (F-4) | FAIL (F-4) | FAIL (F-4) | FAIL (F-4) | FAIL (F-4) |
| RH-04 | PASS | PASS | PASS | PASS | PASS |
| RB-01 | PASS | PASS | PASS | PASS | PASS |
| RB-02 | PASS | PASS | PASS | PASS | PASS |
| RB-03 | PASS | PASS | PASS | PASS | PASS |
| RB-04 | PASS | PASS | PASS | PASS | PASS |
| RB-05 | FAIL | FAIL | FAIL | FAIL | FAIL |
| RB-06 | PASS | PASS | PASS | PASS | PASS |
| RB-07 | PASS | PASS | - | PASS | - |
| RB-08 (EN) | - | - | - | - | - |
| SB-01 | PASS | PASS | - | PASS | - |
| SB-02 | FAIL | FAIL | - | FAIL | - |
| SB-03 | PASS | PASS | - | PASS | - |
| IS-01 | FAIL | PASS | - | PASS | - |
| IS-02 | PASS | PASS | - | PASS | - |
| IS-03 | PASS | PASS | - | PASS | - |
| GF-01 | PASS | PASS | PASS | PASS | PASS |
| GF-02 | PASS | PASS | PASS | PASS | PASS |
| GF-03 | PASS | PASS | PASS | PASS | PASS |
| GF-04 | PASS | PASS | PASS | PASS | PASS |
| GF-05 | PASS | PASS | PASS | PASS | PASS |
| GF-06 | PASS | PASS | PASS | PASS | PASS |
| GF-07 | PASS | PASS | PASS | PASS | PASS |
| GF-09 | PASS | PASS | PASS | PASS | PASS |
| GF-10 | PASS | PASS | PASS | PASS | PASS |
| GF-11 | PASS | NA | NA | NA | NA |
| GF-12 | FAIL | PASS | PASS | PASS | PASS |
| GF-13 | FAIL (F-4) | FAIL (F-4) | FAIL (F-4) | FAIL (F-4) | FAIL (F-4) |
| GF-14 | PASS | PASS | PASS | PASS | PASS |
| GF-15 | PASS | PASS | PASS | PASS | PASS |
| DV-01 | PASS | PASS | PASS | PASS | PASS |
| **structure_b lulus / penyebut** | **26/32** | **27/31** | **21/24** | **27/31** | **21/24** |

Bukti kegagalan (kutipan `evidence` laporan JSON, `$TEMP/s22/<kasus>/*.json`, bukan artefak repo):

| Aturan | Kasus | Bukti |
|---|---|---|
| RH-03 | semua | `header word/header5.xml (seksi 4): garis single/C3CBD1/sz 5, harapan 6E1420/sz 6+-1` (21 header Manual 000; 4 per kasus baseline). Diharapkan, F-4/D-598 |
| GF-13 | semua | `klasifikasi tebal=true warna=101418, harapan tebal 6E1420` (header kanan dan sel 4 register). Diharapkan, F-4/D-598 |
| RB-05 | semua | `sel 1 garis atas single/101418/sz 8, harapan 6E1420/sz 8+-1`; garis bawah C3CBD1 sz 5 lulus. Mesin menulis INK900 untuk garis atas register; Rev A `ID:2577` "Garis atas seal 0,35 mm". **Temuan baru, di luar F-4** |
| SB-02 | semua TERBIT | `pita segel 1: warna teks F6E9E9, harapan F4F5F6`; isian 6E1420 dan lebar 9412 tw lulus. Rev A `ID:2573` "teks #F4F5F6". **Temuan baru, di luar F-4** |
| IS-01 | Manual 000 | `cap terbit "// 20261008 ID T — TERBITAN 1" memuat U+2014` (Manual 000 dibangun mesin lama; kasus baseline S05 sudah `--`) |
| GF-12 | Manual 000 | `word/document.xml: memuat warna pensiun 1A2B4A` dan `C9A84C`. Sumbernya prosa manual "Pasangan navy #1A2B4A dan emas #C9A84C sudah pensiun", bukan warna yang dipakai; katalog mewajibkan pencarian di semua bagian XML, jadi FAIL dipertahankan. Catatan untuk S25 |

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| GF-13, RH-03 gagal pada semua keluaran mesin | n/a (sengaja) | Mesin menulis INK900 / INK200 sz 5 (`header-footer.ts:55, 73`) | Diterima sebagai kegagalan non-kritis yang diketahui (D-598) | Tidak |
| RB-05, SB-02 gagal pada semua keluaran mesin | n/a (bukan cacat modul) | Mesin: garis atas register 101418, teks pita F6E9E9; Rev A meminta 6E1420 dan F4F5F6 | Perlu keputusan controller (lihat di bawah) | Tidak untuk S22; memengaruhi skor S25 |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| 7 | **Perlu keputusan controller:** RB-05 dan SB-02 gagal pada semua keluaran mesin (Manual 000 dan baseline S05), tidak tercakup F-4/D-598 | Aturan diimplementasikan persis menurut katalog dan manual (`ID:2573`, `ID:2577`). Pilihan: (a) terima sebagai kegagalan non-kritis yang diketahui seperti F-4 (memperbaikinya mengubah keluaran ID byte-identik); (b) perbaiki mesin di baris lain. S22 tidak melemahkan aturan |
| 7 | GF-12 Manual 000 gagal karena kode warna pensiun disebut dalam prosa | Faithful pada katalog ("semua bagian XML"); dicatat untuk kalibrasi S25. Tidak memengaruhi sampel templat |
| 5 | R0 "Cond: memuat `Condensed`", tetapi Manual 000 dan datum-gsp menanam wajah `IBM Plex Sans Cond` (nama keluarga pendek), datum-kanonik `IBM Plex Sans Condensed` | `isCondFont` menerima keduanya (`expect_structure_b.ts`); tafsir ini hanya dipakai GF-07. Tanpa tafsir ini GF-07 gagal pada keluaran mesin yang benar |
| 5 | GF-06 pada DOCX mesin: tidak ada `w:pStyle` (format langsung), jadi "format efektif gaya badan" tidak bisa dibaca dari styles.xml saja | Gaya badan = pStyle (termasuk "tanpa pStyle") milik >= 50 % paragraf isi interior (tanpa judul, sel tabel, numPr, keterangan, kicker); format efektif = format modal run terpanjang tiap paragraf itu (fon, sz, line, lineRule). Tanpa gaya mayoritas = FAIL; tanpa paragraf isi = UNEXERCISED |
| 6 | Kicker bab dikenali tanpa beda besar-kecil (`/^(BAB\|CHAPTER) (\S+)$/i`) | Kicker yang kehilangan caps tetap dikenali sehingga gagal di GF-07 (bila hanya teks tampak kapital yang dicocokkan, cek caps GF-07 menjadi hampa). Bahasa kicker tetap urusan LB-03 (S23) |
| 5 | RB-03 "run literal tanpa U+0020" vs nilai klasifikasi `SANGAT RAHASIA` (nilai, bukan pola; `header-footer.ts` tidak mengganti spasi nilai) | Teks K di sel 4 dikecualikan; semua literal pola lain wajib NBSP. Hasil medan (PAGE/NUMPAGES) bukan literal |
| 5 | Lokasi cap terbit | Paragraf di seksi pembungkus yang teks tampaknya diawali `//` (sisi kanan kolofon atau perangkat `issueStamp`); teks interior yang membahas format (Manual 000 seksi interior) tidak ikut |
| 5 | Datum Rule untuk GF-11 | Gambar tipis (cy <= 5 mm, rasio >= 20:1) dikecualikan dari "gambar isi"; DV-01 tetap memakai cx 4.608.000 +-18.000 sebelum judul bab |
| 5 | Kegagalan struktural (sampul, lembar kendali, cap terbit, register tidak ada) | FAIL dengan bukti, bukan NA; NA hanya untuk GF-07/GF-11 bersyarat. RH-01, GF-06, GF-14, DV-01 = UNEXERCISED bila tidak ada bab/paragraf isi untuk diperiksa |
| 2 | `datum-kanonik` tidak ada di register pasangan | Dijalankan dengan `--type-code KT --kicker ""` (CLI memperingatkan); tidak memengaruhi aturan structure_b (tanpa cabang slug) |

## Next Steps

- Controller: putuskan RB-05 dan SB-02 (terima sebagai kegagalan diketahui atau perbaiki mesin), dan catat tafsir Cond/GF-06/GF-12 untuk S25.
- S25 memakai tabel per aturan di atas sebagai baseline structure_b; tidak ada kasus EN di baseline S05, jadi RB-08 dan cabang EN baru diuji pada DOCX sintetis.
- Review recommended (lingkup: `benchmark/datum_conformance/rules/structure_b.ts`, `rules/expect_structure_b.ts`, `tests/unit/studio/datum-conformance/structure-b.test.ts`), terutama tafsir GF-06 dan pengenalan kicker/cap terbit.
