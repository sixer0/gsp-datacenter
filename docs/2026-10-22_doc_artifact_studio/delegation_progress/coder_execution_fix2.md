---
task_slug: doc_artifact_studio
row: FIX-2 (F-055 HIGH / S83 H1; D-46, D-116, D-305)
date: 2026-10-23
agent: coder-execution
status: complete
---

# FIX-2: teks bawaan pembungkus HTML = DOCX (satu sumber teks bersama)

Skill: receiving-code-review (H1 diverifikasi terhadap kode nyata sebelum diubah), dry-run-verify-fix. Klaim: `file_claims.md` baris FIX-2.

## Verifikasi temuan H1 terhadap kode (sebelum perbaikan)
- Benar di keempat tempat, dibuktikan render nyata (tabel di bawah, kolom "HTML sebelum"). Temuan bahkan mengenai Manual 000 v2 HTML: kicker TOC "Daftar Isi" hilang, judul blok lembar kendali "A. RIWAYAT REVISI" bukan "A · Riwayat revisi", kicker lampiran "LAMPIRAN A" bukan "Lampiran A".
- Koreksi kecil atas H1 butir (4): kicker pembuka lampiran DOCX yang benar-benar dirender berasal dari `docx/wrapper/pages.ts` renderAppendixOpener (`dispatch.ts` menimpa `docxBlocks` dengan `docxWrapper`), yaitu "Lampiran X" / "Appendix X". Fungsi itu tidak membaca `appendix.kicker.pattern`. `blocks/structure.ts` kickerText hanya berlaku untuk blok `chapter`. HTML kini mengikuti keduanya persis.
- Cacat tambahan yang ditemukan dan ditutup di area yang sama: (a) HTML TOC `mode: "static"` dengan `entries: []` merender tabel kosong (v1 SERAH), sedangkan DOCX menurunkan entri; (b) catatan TOC HTML berada di atas tabel, padahal DOCX/C6 menaruhnya di bawah; (c) label daftar bab pembatas bagian HTML berupa kunci mentah ("1"), DOCX "Bab 1"; (d) urutan dan keanggotaan entri TOC turunan HTML (bagian dulu, plus chapterKeys) beda dengan DOCX dan normalisasi (bab tanpa bagian dulu, keanggotaan `partId`).

## Perubahan
| Berkas | Jenis | Isi |
|---|---|---|
| `src/lib/studio/engine/front/texts.ts` | baru | SATU sumber: `WRAPPER_TEXT` (tabel `L` DOCX dipindah utuh), `controlSheetBlockHeading` (huruf urut hanya blok yang ada, pemisah " · "), `controlSheetKickerText`, `tocKickerText`, `chapterLabelText`, `appendixOpenerKickerText`, `chapterKickerText` (logika kickerText DOCX), `defaultPartLabelText` |
| `src/lib/studio/engine/front/apparatus.ts` | ubah | `defaultPartLabelText` diekspor ulang dari `texts.ts` (impor lama tetap sah) |
| `src/lib/studio/engine/docx/wrapper/pages.ts` | ubah (netral keluaran) | tabel `L` lokal dihapus, diganti impor `texts.ts`; label bab/lampiran, kicker lembar kendali/TOC/lampiran, judul blok lewat fungsi bersama |
| `src/lib/studio/engine/docx/blocks/structure.ts` | ubah (netral keluaran) | `kickerText` memanggil `chapterKickerText` |
| `src/lib/studio/engine/html/blocks/wrapper.ts` | ubah | lembar kendali auto: kicker bawaan, judul = meta.title, judul blok bersama; TOC: kicker bawaan, judul hanya dari spec (`render.toc.title`, tanpa "DAFTAR ISI" bawaan), entri spec bila ada selain itu turunan, catatan di bawah tabel; label entri/daftar bab = `chapterLabelText` atau teks kicker konten; urutan/keanggotaan = DOCX |
| `src/lib/studio/engine/html/blocks/text.ts` | ubah | `defaultKicker`: lampiran = `appendixOpenerKickerText`, bab = `chapterKickerText` (unit lampiran / kunci huruf seperti DOCX); `appendixKey` = kunci DOCX (key, posisi A..Z, unitKey); regex `chapterKey` = DOCX |
| `tests/unit/studio/renderers/fix2-wrapper-text-parity.test.ts` | baru | 6 uji: 2 nilai tabel bersama; 4 paritas render nyata DOCX vs HTML (TERBIT v1 ID, TERBIT v1 EN, lembar kendali parsial + TOC statis berjudul/catatan + kicker konten, v2 compose dengan kenop `render.toc.title/note`) |

Penulisan atomik: berkas lama lewat skrip (tmp lalu `os.replace`, setiap suntingan cocok tepat sekali). Berkas baru ditulis langsung.

## Bukti (perintah + keluaran)
Render: `render_cli.ts --doc <fixture> [--template <stem>.template.json] --formats docx,html --out tests/parity/out/fix2/{before,after}/<nama>`. Varian EN = salinan fixture TERBIT v1/v2 dengan `meta.language: "EN"` (`tests/parity/out/fix2/inputs/`). Acuan DOCX Manual 000 v2 = DOCX resmi `952f65d6…`. Ekstraksi teks dengan pembaca `word/document.xml` dan `data-role` HTML.

### Tabel 4 tempat x ID/EN (DOCX vs HTML sebelum/sesudah)
| Fixture | Tempat | DOCX | HTML sebelum | HTML sesudah | DOCX=HTML sesudah |
|---|---|---|---|---|---|
| v1_terbit_report | cs.kicker | Lembar Kendali | - | Lembar Kendali | ya |
| v1_terbit_report | cs.headings | A · Riwayat revisi / B · Rantai verifikasi / C · Pernyataan metode / D · Distribusi ter... | A. RIWAYAT REVISI / B. RANTAI VERIFIKASI / C. PERNYATAAN METODE / D. DISTRIBUSI | A · Riwayat revisi / B · Rantai verifikasi / C · Pernyataan metode / D · Distribusi ter... | ya |
| v1_terbit_report | toc.kicker | Daftar Isi | - | Daftar Isi | ya |
| v1_terbit_report | toc.title+note | - | DAFTAR ISI | - | ya |
| v1_terbit_report | toc.labels | Bagian I / Bab 1 / Bab 2 / Bagian II / Bab 3 / Lampiran A | Bagian I / BAB 1 / BAB 2 / Bagian II / BAB 3 / LAMPIRAN A | Bagian I / Bab 1 / Bab 2 / Bagian II / Bab 3 / Lampiran A | ya |
| v1_terbit_report | appendix.kicker | Lampiran A | LAMPIRAN A | Lampiran A | ya |
| v1_terbit_report | chapter.kicker | BAB 1 | BAB 1 | BAB 1 | ya |
| v2_terbit_report | cs.kicker | Lembar Kendali | Lembar Kendali | Lembar Kendali | ya |
| v2_terbit_report | cs.headings | A · Riwayat revisi / B · Rantai verifikasi / C · Pernyataan metode / D · Distribusi ter... | A. RIWAYAT REVISI / B. RANTAI VERIFIKASI / C. PERNYATAAN METODE / D. DISTRIBUSI | A · Riwayat revisi / B · Rantai verifikasi / C · Pernyataan metode / D · Distribusi ter... | ya |
| v2_terbit_report | toc.kicker | Daftar Isi | - | Daftar Isi | ya |
| v2_terbit_report | toc.title+note | - | DAFTAR ISI | - | ya |
| v2_terbit_report | toc.labels | Bagian I / Bab 1 / Bab 2 / Bagian II / Bab 3 / Lampiran A | Bagian I / BAB 1 / BAB 2 / Bagian II / BAB 3 / LAMPIRAN A | Bagian I / Bab 1 / Bab 2 / Bagian II / Bab 3 / Lampiran A | ya |
| v2_terbit_report | appendix.kicker | Lampiran A | LAMPIRAN A | Lampiran A | ya |
| v2_terbit_report | chapter.kicker | BAB 1 | BAB 1 | BAB 1 | ya |
| v1_serah_handover | cs.kicker | (explicit: badan konten "Kendali dokumen") | (sama, peran pageTitle) | (sama) | n/a, bukan teks bawaan |
| v1_serah_handover | cs.headings |  |  |  | ya |
| v1_serah_handover | toc.kicker | Daftar Isi | - | Daftar Isi | ya |
| v1_serah_handover | toc.title+note | - | DAFTAR ISI | - | ya |
| v1_serah_handover | toc.labels | Bagian I / Bab 1 / Bab 2 / Lampiran A |  | Bagian I / Bab 1 / Bab 2 / Lampiran A | ya |
| v1_serah_handover | appendix.kicker | Lampiran A | LAMPIRAN A | Lampiran A | ya |
| v1_serah_handover | chapter.kicker | BAB 1 | BAB 1 | BAB 1 | ya |
| v2_serah_handover | cs.kicker | Lembar Kendali | Lembar Kendali | Lembar Kendali | ya |
| v2_serah_handover | cs.headings | A · Riwayat revisi / B · Rantai verifikasi / C · Pernyataan metode / D · Distribusi ter... | A. RIWAYAT REVISI / B. RANTAI VERIFIKASI / C. PERNYATAAN METODE / D. DISTRIBUSI | A · Riwayat revisi / B · Rantai verifikasi / C · Pernyataan metode / D · Distribusi ter... | ya |
| v2_serah_handover | toc.kicker | Daftar Isi | - | Daftar Isi | ya |
| v2_serah_handover | toc.title+note | - | DAFTAR ISI | - | ya |
| v2_serah_handover | toc.labels | Bagian I / Bab 1 / Bab 2 / Lampiran A | Bagian I / BAB 1 / BAB 2 / LAMPIRAN A | Bagian I / Bab 1 / Bab 2 / Lampiran A | ya |
| v2_serah_handover | appendix.kicker | Lampiran A | LAMPIRAN A | Lampiran A | ya |
| v2_serah_handover | chapter.kicker | BAB 1 | BAB 1 | BAB 1 | ya |
| v1_nota_memo | cs.headings |  |  |  | ya |
| v1_nota_memo | toc.title+note | - | - | - | ya |
| v1_nota_memo | toc.labels |  |  |  | ya |
| v1_nota_memo | chapter.kicker | BAB 1 | BAB 1 | BAB 1 | ya |
| v2_nota_memo | cs.headings |  |  |  | ya |
| v2_nota_memo | toc.title+note | - | - | - | ya |
| v2_nota_memo | toc.labels |  |  |  | ya |
| v2_nota_memo | chapter.kicker | BAB 1 | BAB 1 | BAB 1 | ya |
| v1_terbit_en | cs.kicker | Control Sheet | - | Control Sheet | ya |
| v1_terbit_en | cs.headings | A · Revision history / B · Verification chain / C · Method statement / D · Controlled d... | A. REVISION HISTORY / B. VERIFICATION CHAIN / C. METHOD STATEMENT / D. DISTRIBUTION | A · Revision history / B · Verification chain / C · Method statement / D · Controlled d... | ya |
| v1_terbit_en | toc.kicker | Contents | - | Contents | ya |
| v1_terbit_en | toc.title+note | - | CONTENTS | - | ya |
| v1_terbit_en | toc.labels | Bagian I / Chapter 1 / Chapter 2 / Bagian II / Chapter 3 / Appendix A | Bagian I / CHAPTER 1 / CHAPTER 2 / Bagian II / CHAPTER 3 / APPENDIX A | Bagian I / Chapter 1 / Chapter 2 / Bagian II / Chapter 3 / Appendix A | ya |
| v1_terbit_en | appendix.kicker | Appendix A | APPENDIX A | Appendix A | ya |
| v1_terbit_en | chapter.kicker | BAB 1 | CHAPTER 1 | BAB 1 | ya |
| v2_terbit_en | cs.kicker | Lembar Kendali | Lembar Kendali | Lembar Kendali | ya |
| v2_terbit_en | cs.headings | A · Revision history / B · Verification chain / C · Method statement / D · Controlled d... | A. REVISION HISTORY / B. VERIFICATION CHAIN / C. METHOD STATEMENT / D. DISTRIBUTION | A · Revision history / B · Verification chain / C · Method statement / D · Controlled d... | ya |
| v2_terbit_en | toc.kicker | Contents | - | Contents | ya |
| v2_terbit_en | toc.title+note | - | CONTENTS | - | ya |
| v2_terbit_en | toc.labels | Part I / Chapter 1 / Chapter 2 / Part II / Chapter 3 / Appendix A | Part I / CHAPTER 1 / CHAPTER 2 / Part II / CHAPTER 3 / APPENDIX A | Part I / Chapter 1 / Chapter 2 / Part II / Chapter 3 / Appendix A | ya |
| v2_terbit_en | appendix.kicker | Appendix A | APPENDIX A | Appendix A | ya |
| v2_terbit_en | chapter.kicker | BAB 1 | CHAPTER 1 | BAB 1 | ya |
| m000_v2_html | cs.kicker | Lembar Kendali | Lembar Kendali | Lembar Kendali | ya |
| m000_v2_html | cs.headings | A · Riwayat revisi / B · Rantai verifikasi / C · Pernyataan metode / D · Distribusi ter... | A. RIWAYAT REVISI / B. RANTAI VERIFIKASI / C. PERNYATAAN METODE / D. DISTRIBUSI | A · Riwayat revisi / B · Rantai verifikasi / C · Pernyataan metode / D · Distribusi ter... | ya |
| m000_v2_html | toc.kicker | Daftar Isi | - | Daftar Isi | ya |
| m000_v2_html | toc.title+note | Peta Isi Manual / Nomor halaman dicetak dari render PDF terbitan ini. Word dapat memagi... | Peta Isi Manual / Nomor halaman dicetak dari render PDF terbitan ini. Word dapat memagi... | Peta Isi Manual / Nomor halaman dicetak dari render PDF terbitan ini. Word dapat memagi... | ya |
| m000_v2_html | toc.labels | Bagian I / Bab 1 / Bab 2 / Bab 3 / Bagian II / Bab 4 / Bab 5 / Bab 6 / Bagian III / Bab... | Bagian I / Bab 1 / Bab 2 / Bab 3 / Bagian II / Bab 4 / Bab 5 / Bab 6 / Bagian III / Bab... | Bagian I / Bab 1 / Bab 2 / Bab 3 / Bagian II / Bab 4 / Bab 5 / Bab 6 / Bagian III / Bab... | ya |
| m000_v2_html | appendix.kicker | Lampiran A | LAMPIRAN A | Lampiran A | ya |
| m000_v2_html | chapter.kicker | Bab 1 | Bab 1 | Bab 1 | ya |

Kesimpulan tabel: 0 baris "TIDAK" sesudah perbaikan. Sebelum perbaikan, HTML berbeda pada setiap fixture yang memiliki halaman pembungkus.

### DOCX tetap byte-identik
| DOCX | sebelum | sesudah |
|---|---|---|
| Manual 000 v1 (`render_cli --doc benchmark/manual000/doc.json --template .../template.json`) | `53485ebc1eddd145` | `53485ebc1eddd145` |
| Manual 000 v2 resmi (`run_benchmark.ts --schema v2 --official --out tests/parity/out/fix2/official_after`) | `952f65d63c77f615` (official3) | `952f65d63c77f615106d82941d0838cb82798af310e3401cec2d4bcaff9bac2f`; BM1 4544/4544, BM2 102/102, BM3 99/102 (dikenal D-289), BM4 0,96707 = official3 |
| v1 memo / serah / terbit | `a48e5e3e` / `e6c38f74` / `b61f875f` | sama |
| v2 memo / serah / terbit | `a48e5e3e` / `3245655e` / `7157312d` | sama |
| varian EN v1 / v2 | `757519a6` / `89b35537` | sama |

### Uji dan pemeriksaan
- Uji baru: `npx vitest run tests/unit/studio/renderers/fix2-wrapper-text-parity.test.ts` lulus 6/6. Uji mutasi: dengan `html/blocks/wrapper.ts` dan `text.ts` dikembalikan ke kode lama, 4/4 uji paritas GAGAL. Sesudah dipulihkan, `cmp` identik dan 6/6 lulus.
- `npx vitest run tests/unit/studio`: **2023/2023 lulus, 0 gagal, 320 suite** (`tests/parity/out/fix2/vitest_final.json`).
- `npx tsc --noEmit -p tsconfig.json` exit 0. `npx eslint src/lib/studio/engine/html src/lib/studio/engine/front` exit 0, dan eslint 7 berkas yang diubah exit 0.
- Tidak ada konsumen string HTML lama ("DAFTAR ISI", "A. RIWAYAT REVISI") di `scripts/`, `benchmark/harness`, `src/`, maupun uji (grep). `selftest_compare.py` hanya memakai PDF sintetis.
- Browser: halaman HTML tidak diperiksa visual. Perubahan ini menyangkut teks dan urutan. Kapital tampilan tetap ditentukan format peran (D-46).

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| - | - | - | - | tidak |

## Issues & Decisions (untuk controller)
| Butir | Keputusan / temuan | Status |
|---|---|---|
| D1 | Acuan = keluaran DOCX nyata (DOCX baca-saja, byte-identik). HTML mengikuti DOCX, termasuk perilaku DOCX yang dipertanyakan di O-1/O-2 | dicatat controller |
| O-1 | Varian EN kicker bab: DOCX (dan kini HTML) menulis "BAB 1" untuk dokumen EN, karena pola P4A-04 tidak diterjemahkan. HTML lama menulis "CHAPTER 1". Bila diinginkan, cukup ubah satu tempat (`chapterKickerText`). Itu akan mengubah DOCX EN (Manual 000 ID tidak terdampak) | butuh putusan |
| O-2 | `chapterKickerText` (logika DOCX lama): cabang kata "LAMPIRAN" huruf besar tidak pernah terpakai karena perbandingan memuat "{n}" huruf kecil. Selain itu `appendix.kicker.pattern` (EK-appendix-01) tidak memengaruhi pembuka lampiran di kedua format, hanya blok `chapter` di unit lampiran. Ini bertalian dengan M10 | backlog / putusan |
| O-3 | Temuan baru di luar 4 tempat F-055: blok kendali dan kolofon sampul auto masih berbeda. HTML memakai kunci medan mentah ("NOMOR DOKUMEN"), nilai revisi/bahasa mentah, dan kolofon klasifikasi + tanggal. DOCX memakai "Nomor dokumen", "rev · tanggal panjang", "Indonesia", serta entitas + NIB dan cap terbit | backlog (calon F-baru) |
| O-4 | TOC medan tanpa entri: DOCX menulis teks penampung "Perbarui medan…". HTML (tanpa medan) tidak menirunya, tabel tetap kosong | sengaja |

## Next Steps
- Controller: catat D1, putuskan O-1/O-2, daftarkan O-3. Review direkomendasikan (lingkup: 6 berkas src di atas + uji baru; bagian dari M-2 D-305).

---

# Siklus 2 (D-308): O-1, O-2, O-3

Klaim: baris `FIX-2 siklus 2` di `file_claims.md`. Berkas DOCX diklaim spesifik (pages.ts: autoControlBlock/autoColophon/kicker pembuka lampiran; render.ts: issueStampText; structure.ts: kickerText).

## Perubahan
| Berkas | Isi |
|---|---|
| `engine/front/texts.ts` | `chapterKickerText(..., lang)`: dokumen EN dengan pola bawaan ("BAB {n}" atau absen) menjadi "CHAPTER {n}", pola lain dari templat menang; kata lampiran turunan menurut bahasa ("Lampiran"/"Appendix"). `appendixOpenerKickerText(key, lang, appendixPattern)`: pola `appendix.kicker.pattern` sah dipakai. Baru: `CONTROL_FIELD_LABELS`, `controlBlockRowsText`, `colophonTexts`, `issueStampTextOf`, `ORG_ENTITY_DEFAULT` (pindahan utuh dari DOCX) |
| `docx/wrapper/pages.ts` | autoControlBlock/autoColophon memakai builder bersama; kicker pembuka lampiran meneruskan `appendix.kicker.pattern`; impor tak terpakai dihapus |
| `docx/wrapper/render.ts` | `issueStampText` = `issueStampTextOf` (satu sumber) |
| `docx/blocks/structure.ts` | `kickerText` meneruskan bahasa dokumen |
| `html/blocks/text.ts` | `defaultKicker` meneruskan bahasa + pola lampiran |
| `html/blocks/wrapper.ts` | blok kendali + kolofon sampul auto memakai builder bersama. Sebelumnya HTML memakai kunci medan mentah, nilai mentah, serta kolofon klasifikasi + tanggal |
| `tests/unit/studio/renderers/fix2-wrapper-text-parity.test.ts` | +5 uji (11 total): O-1 EN, O-2 pola lampiran, O-3 builder; paritas render pola templat EN ("Bab {n}" + "Annex {n}"); paritas blok kendali + kolofon sampul auto ID dan EN |

Batasan O-1 (dicatat): templat yang sengaja mengeset "BAB {n}" tidak bisa dibedakan dari bawaan registri yang sudah teresolusi, sehingga untuk dokumen EN tetap menjadi "CHAPTER {n}". Label bab/lampiran di TOC dan daftar bab pembatas tetap "Bab n"/"Lampiran X" (M10, di luar O-2).

## Bukti
- Manual 000 DOCX v1: `53485ebc1eddd145` = sebelum. DOCX v2 resmi (`run_benchmark.ts --schema v2 --official --out tests/parity/out/fix2/official_c2`): `952f65d63c77f615106d82941d0838cb82798af310e3401cec2d4bcaff9bac2f` = official3; BM1 PASS 100 %, BM2 PASS, BM3 97,06 % (99/102, dikenal D-289), BM4 0,96707.
- Fixture ID (DOCX) identik: v1 memo/serah/terbit `a48e5e3e`/`e6c38f74`/`b61f875f`, v2 memo/serah/terbit `a48e5e3e`/`3245655e`/`7157312d`.
- Fixture EN berubah hanya pada kicker bab. v1 `757519a6…` menjadi `6c42f7da55b22770a219e9ac3a7600f30a13197edc327d8ee3b9a2390cce5245`, v2 `89b35537…` menjadi `01a873f981038db0f20d5d0970d19baa1306cce43ec316f06b2144d3dc35e124`. Diff seluruh bagian ZIP: hanya `word/document.xml`, 3 baris `BAB n` diganti `CHAPTER n`. Bagian ZIP lain sama.
- HTML EN sesudah: `CHAPTER 1..3`, `Appendix A` = DOCX (`tests/parity/out/fix2/evidence_table_c2.md`: 56 baris "ya". Satu baris "TIDAK" adalah lembar kendali explicit v1 SERAH, isi konten, bukan teks bawaan.)
- Uji mutasi: dengan 6 berkas dikembalikan ke kode siklus 1, 7/11 uji GAGAL (3 unit O-1/O-2/O-3 + 4 paritas). Sesudah dipulihkan, `cmp` identik.
- `npx vitest run tests/unit/studio`: **2028/2028 lulus, 0 gagal, 320 suite** (`tests/parity/out/fix2/vitest_c2.json`). `npx tsc --noEmit` exit 0. eslint area (front, html, 3 berkas DOCX, uji) exit 0, 0 peringatan.

## Sisa
- Cabang huruf besar turunan kata lampiran tetap mati, demi byte-identik ID. Tidak berdampak karena pembuka lampiran tidak memakainya.
- Label TOC/pembatas tidak mengikuti pola bab/lampiran (M10).
