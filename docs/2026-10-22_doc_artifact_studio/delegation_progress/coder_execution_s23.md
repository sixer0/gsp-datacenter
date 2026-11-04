---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: S23
date: 2026-11-04
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/02_structured_datum_rev_a.md
status: complete
---

# Implementation Report: S23, modul aturan bahasa dan angka (DATUM Rev A)

Skill dimuat: `tdd` (uji ditulis lebih dulu, merah terbukti: 37/38 gagal pada stub, lalu hijau).
Masukan dibaca: blueprint baris S23 (`02_structured_datum_rev_a.md:139, 198`), `delegation_progress/coder_execution_s20.md`
(API harness, `ctx.bfix`, `ctx.spec`), `research/32` (katalog lengkap termasuk §10 B-FIX, §13 X-*), `research/31` (§1, §4, §5, §6, §8),
keputusan D-593, D-598, D-599 (`decisions/decisions.md:599, 604, 605`). Kode mesin dibaca untuk kosakata: `src/lib/studio/engine/front/texts.ts`
(WRAPPER_TEXT, CONTROL_FIELD_LABELS, APPARATUS_TEXT), `src/lib/studio/engine/docx/wrapper/formats.ts:459-481` (nama bulan).

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca masukan, petakan bentuk DOCX nyata (baseline S05 + Manual 000) | complete | Unsur pembungkus tanpa `w:pStyle`; dikenali dari struktur (lihat "Lokasi teks pembungkus") |
| 2 | Tabel harapan bahasa `rules/expect_language.ts` | complete | Satu tabel per bahasa + daftar kode tertutup, pola nomor, kicker per kode jenis |
| 3 | Uji lebih dulu `language.test.ts` | complete | 38 uji awal; merah 37/38 pada stub |
| 4 | Implementasi 21 aturan di `rules/language.ts` | complete | 16 terukur (3 kritis) + X-01..X-05 |
| 5 | Gerbang: suite datum-conformance, tsc, eslint | complete | 199/199 hijau; 0 galat tsc/eslint di berkas S23 |
| 6 | CLI `--implemented-only` pada 4 kasus baseline S05 | complete | Hasil per aturan di bawah |
| 7 | Kalibrasi tambahan pada Manual 000 -> 3 perbaikan deteksi + 4 uji regresi | complete | 42/42 uji modul |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| `benchmark/datum_conformance/rules/language.ts` | modify (isi stub S20) | 21 aturan, analisis WL bersama (cache per DOCX), dokumentasi bentuk `--spec` |
| `benchmark/datum_conformance/rules/expect_language.ts` | add | Tabel harapan bahasa (satu-satunya sumber nilai per bahasa; tanpa cabang slug) |
| `tests/unit/studio/datum-conformance/language.test.ts` | add | 42 uji (sampel DOCX sintetis berbentuk keluaran Studio, `_docx_kit`) |
| `docs/.../delegation_progress/file_claims.md` | modify (append 1 baris) | Klaim path S23 (pola S21/S22) |
| `docs/.../delegation_progress/coder_execution_s23.md` | modify | Laporan ini di atas laporan S23 lama (engine/html/tables, 2026-10-23) yang dipertahankan utuh di bawah |

Tidak menyentuh harness (`lib/**`, `score.ts`, `rules/index.ts`, `rules/types.ts`), `catalog.ts`, modul lain, `clash/**`, `src/`, `prisma/`, `scripts/`. Tanpa dependensi baru, tanpa DB, tanpa port, tanpa commit.

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Unit modul | `npx vitest run tests/unit/studio/datum-conformance/language.test.ts` | 1 file, 42 passed | 505 ms |
| Suite datum-conformance | `npx vitest run tests/unit/studio/datum-conformance` | 9 files, 199 passed | termasuk uji S20, S21, S22 |
| Lint | `npx eslint --format json <3 berkas S23>` | 3 files, 0 errors, 0 warnings | |
| Typecheck | `npx tsc --noEmit -p .` | 0 galat di berkas S23 (`grep -cE 'rules/language\|expect_language\|language.test'` = 0) | Run sebelumnya exit 0 total. Run terakhir: galat hanya di `tests/unit/studio/seed/s26-doc-type-template-specs.test.ts` (S26 berjalan paralel, modul `prisma/seed-doc-type-templates` belum ada); bukan berkas S23 |
| CLI baseline | lihat Verification | exit 1 (FAIL keseluruhan; harapan, CR-3 tanpa B-FIX) | |

## Verification

Acceptance blueprint S23: "setiap aturan mengutip butir S02; DOCX EN berlabel ID turun skor dan gagal kritis; uji hijau".
- Setiap aturan dibangun `defineRule(<kode katalog>, check)`; indeks S20 menolak metadata menyimpang. Uji `memuat semua kode milik modul language` = 21 kode persis.
- Uji `DOCX EN berlabel ID gagal CR-4, gagal gerbang kritis, dan skor turun`: CR-4 `fail` (bukti memuat `Penyusun`, `LEMBAR`), `critical.ok = false`, `critical.failed` memuat CR-4, `verdict = FAIL`, `score.passed` lebih kecil dari dokumen EN baik.
- Uji brief: kode DS gagal CR-2; pemisah salah di B-FIX gagal CR-3 (EN dan ID); label campur bahasa memicu X-01 (dihitung `clash.xFailures`, bukan skor); dokumen baik ID dan EN (TERBIT dan NOTA) lulus semua aturan bahasa yang berlaku dengan 0 bentrok X.

### Hasil CLI pada baseline S05 (`--implemented-only`)

Perintah: `npx tsx benchmark/datum_conformance/score.ts --manifest <scratch>/manifest_<mode>.json --out <scratch>/out_<mode> --implemented-only`, mode `r08` (sesuai asal baseline: `render_cli.ts`, `render_report.json`) dan `mcp` (informasi untuk LB-06/10/11). Tanpa `--bfix`, tanpa `--spec` (belum ada fiksur B-FIX maupun spec untuk templat kalibrasi). `datum-kanonik` di luar register: `--type-code KT --kicker ""`.

| Kasus (sha256 awal) | Pasangan | Skor total (semua modul) r08 / mcp | Kritis gagal (modul S23) | Bentrok X |
|---|---|---|---|---|
| `a_terbit_datum_gsp` (633e583f59dee6c9) | datum-gsp ID TERBIT KT | 83,0 % (54/65) / 83,8 % (57/68) | CR-3 | 0 |
| `a_terbit_datum_kanonik` (bbbfe86e278178e7) | datum-kanonik ID TERBIT KT | 89,2 % (58/65) / 89,7 % (61/68) | CR-3 | 0 |
| `b_nota_datum_gsp` (5aeac7ccd1399fd3) | datum-gsp ID NOTA KT | 85,2 % (29/34) / sama | CR-3 | 0 |
| `b_nota_datum_kanonik` (3146b14cba5aeea5) | datum-kanonik ID NOTA KT | 85,2 % (29/34) / sama | CR-3 | 0 |

Skor total memuat aturan S21/S22 yang terpasang paralel; kolom berikut hanya modul S23. Sel = r08 / mcp, urutan kasus seperti tabel di atas.

| Aturan | a_terbit_gsp | a_terbit_kanonik | b_nota_gsp | b_nota_kanonik | Bukti utama |
|---|---|---|---|---|---|
| CR-2 | pass / pass | pass / pass | pass / pass | pass / pass | `017/GSP/KT/XI/2026`, kode KT, sama di 5 lokasi (TERBIT) / 4 (NOTA) |
| CR-3 | FAIL (unexercised) | FAIL (unexercised) | FAIL (unexercised) | FAIL (unexercised) | Tanpa fiksur B-FIX = UNEXERCISED = gagal kritis (research/31 F-5). Pindai sampel sendiri: 0 pelanggaran ID (`Rp 1.250.000,50` sah) |
| CR-4 | pass / pass | pass / pass | pass / pass | pass / pass | 0 token cermin EN di 62/60/28/28 lokasi pembungkus; penanda ID lengkap |
| NU-02 | pass / pass | pass / pass | pass / pass | pass / pass | KT di nomor dan string punggung |
| NU-03 | unexercised | unexercised | unexercised | unexercised | `--spec` tidak diberikan |
| NU-05 | pass / pass | pass / pass | pass / pass | pass / pass | revisi `A` |
| NU-07 | pass / pass | pass / pass | pass / pass | pass / pass | XI/2026 = `04-XI-2026` di 4 footer |
| NC-04 | pass / pass | pass / pass | n/a | n/a | `A · 4 November 2026` |
| AC6-03 | n/a | n/a | n/a | n/a | EN saja |
| LB-01 | pass / pass | pass / pass | n/a | n/a | Nomor dokumen, Revisi, Penyusun, Tier, Bahasa |
| LB-02 | pass / pass | pass / pass | n/a | n/a | satu `Daftar Isi` (gsp: tanpa medan TOC, cadangan seksi pembungkus; kanonik: seksi DAFTAR ISI 2) |
| LB-03 | pass / pass | pass / pass | pass / pass | pass / pass | 3 kicker BAB/LAMPIRAN |
| LB-06 | na / pass | na / pass | n/a | n/a | r08 = NA; mcp: `Disusun` |
| LB-09 | pass / pass | pass / pass | pass / pass | pass / pass | 2 keterangan (Tabel, Turunan) + 2 label (SUMBER, PROVENANS) ID |
| LB-10 | na / pass | na / pass | n/a | n/a | mcp: `Terbit pertama` |
| LB-11 | na / pass | na / pass | n/a | n/a | mcp: `Penyusun` |
| X-01..X-05 | pass (0 bentrok) | pass | pass | pass | satu bahasa (token ID 53/52/21/21, EN 0); kode KT tunggal; klasifikasi `TERBATAS` tunggal; kode bahasa ID tunggal |

Ringkas modul S23 per kasus (terukur, berlaku): TERBIT r08 10/12 lulus (gagal CR-3, unexercised NU-03), TERBIT mcp 13/15, NOTA 7/9. Penyebab satu-satunya kegagalan dan UNEXERCISED = masukan yang belum ada (B-FIX, spec), bukan isi DOCX.

Diagnostik tambahan (bukan acceptance):
- `--bfix` = DOCX baseline itu sendiri: CR-3 `fail` "B-FIX tanpa string harapan ID: 1.250.000,5, Rp 1.385.946.000, 25 %, 0,5" (baseline memuat `1.250.000,50`, bukan fiksur), jalur pindai B-FIX berjalan pada teks nyata.
- Manual 000 (`benchmark/out/fixb/official/...RevA.docx`, datum-standar ID TERBIT, r08): CR-2 pass (22 lokasi), NU-05/NU-07/NC-04/LB-01/LB-02/LB-03/LB-09 pass, X-* 0 bentrok; CR-4 fail (cap terbit `// 20261008 ID T — TERBITAN 1` memakai em dash U+2014, bukan ` -- `; render lama), NU-02 fail (jenis string punggung `MANUAL`), CR-3 unexercised (sampel juga memuat `Rp` menempel angka, contoh salah di isi Manual). Masukan kalibrasi S25.

## Lokasi teks pembungkus (WL) yang diimplementasikan

DOCX Studio tidak memberi `w:pStyle` pada unsur pembungkus (diamati: semua paragraf baseline `styleId` kosong), jadi research/32 §0.4 "id gaya penanda ditentukan dari DOCX kalibrasi" diwujudkan sebagai pengenalan struktural:
- semua paragraf header/footer; sel tabel register (token `OF` hanya dihitung di sini);
- seksi pembungkus: sel pita segel; paragraf tingkat atas dengan run pertama ber-caps (kicker); sel 1 dan 3 baris tabel 4 sel di sampul (label blok kendali); cap terbit kolofon; judul blok `X · ...`; baris pertama tabel (kepala kolom, peran tanda tangan); label entri daftar isi (`Bab 1`, `Lampiran A`) di seksi daftar isi;
- seksi interior: kicker bab (paragraf tingkat atas ber-caps `KATA KUNCI`); kata label keterangan (`Tabel 2.1 ...`, `Turunan D-2.1 ...`, run pertama caps/tebal); run label aparatus yang teksnya, sesudah spasi/tanda baca pengapit dibuang, sama persis dengan label (SUMBER, PROVENANS, KUNCI, MEMENUHI, TIDAK MEMENUHI dan padanan EN).
- String punggung tidak dipindai token (subjek = isi agen), tetapi dipakai NU-02, X-02, X-05.

## Bentuk JSON `--spec` (NU-03; dipancarkan tabel spec S26)

```json
{
  "schema": "datum-template-spec/v1",
  "templates": [
    {
      "slug": "datum-standar-en",
      "params": {
        "doc.typeCode": ["PT","KT","RAB","SPH","SP","BA","NDA","DEK","LAP","MAT","STD","NOT","MOD","VER"],
        "doc.defaultTypeCode": "STD",
        "doc.defaultTier": "TERBIT",
        "doc.language": "EN",
        "cover.kicker.text": "STANDARD"
      }
    }
  ]
}
```

Kunci `params` = kunci parameter templat yang sudah ada (research/31 §3.1-§3.3). Satu baris `{ slug, params }` tanpa `templates` juga diterima. NU-03: baris `slug = pair.slug` wajib ada; `doc.typeCode` = 14 kode persis berurutan (tanpa DS, dengan NDA); empat kunci lain = konteks pasangan (kode, tier, bahasa, kicker). Tanpa `--spec` = UNEXERCISED; spec tak sah = FAIL. Bentuk yang sama sudah dikutip uji S26 (`tests/unit/studio/seed/s26-doc-type-template-specs.test.ts:151-165`).

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Galat tsc di `tests/unit/studio/seed/s26-doc-type-template-specs.test.ts` | 0 (bukan berkas S23) | S26 sedang berjalan paralel; modul `prisma/seed-doc-type-templates` belum ada | dilaporkan, tidak disentuh | Tidak untuk S23 |
| CR-3 dan NU-03 tidak terlatih pada baseline | n/a | Fiksur B-FIX (research/32 §10) dan spec S26 belum ada | Sesuai desain: CR-3 = gagal kritis sampai B-FIX diberikan | Tidak untuk S23; ya untuk gerbang S36 |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| 4 | Label aparatus ID (Tabel/Gambar/Turunan/SUMBER/PROVENANS/KUNCI/MEMENUHI) di dokumen EN | Mengikuti brief controller dan D-598 F-2: dihitung di CR-4 (kritis), selain di AC6-03 dan LB-09. research/32 §2 CR-4 hanya menyebut daftar inti; ini perluasan sadar, dikendalikan data (`foreignApparatusCritical: true` untuk EN). Dokumen ID: CR-4 tetap daftar cermin research/31 §6 saja |
| 4 | NU-03 juga memeriksa tier, bahasa, kicker, kode bawaan spec terhadap pasangan | Brief meminta bentuk spec memuat kelimanya; mengujinya mencegah spec S26 menyimpang dari register research/31 §1. Konsekuensi: menjalankan pasangan dengan `--tier` yang menimpa register membuat NU-03 gagal kecuali spec diubah (diuji pada kasus NOTA) |
| 4 | LB-03 menerima `LAMPIRAN`/`APPENDIX` selain `BAB`/`CHAPTER` | Kicker pembuka unit lampiran adalah label mesin yang sama (`texts.ts` chapterKickerText; baseline `Lampiran A`); research/32 LB-03 hanya menulis pola BAB/CHAPTER |
| 4 | LB-02 tanpa medan TOC | Bila tidak ada seksi DAFTAR ISI menurut R0 (datum-gsp memakai tabel isi tanpa medan TOC), judul dicari di seksi pembungkus selain sampul/lembar kendali; bukti mencatat cadangan ini. Keberadaan daftar isi tetap urusan TR-03 (S21) |
| 4 | String harapan B-FIX dicocokkan byte-exact sebagai token angka utuh | `0,5` tidak dianggap ada hanya karena `1.250.000,5`; spasi satuan U+0020 sesuai research/31 §5 (NBSP tidak diterima untuk harapan B-FIX) |
| 4 | Perbandingan nilai (penanda, label) menormalkan NBSP ke spasi; pemindaian token menerima spasi atau NBSP dalam frasa | research/31 §6 semantik 1; register memakai NBSP (RB-03) |
| 4 | LB-06/LB-10/LB-11 dengan `producedBy = r08` = NA | research/32 §12; baseline berasal dari R08 (`render_cli.ts`), jadi hasil r08 adalah catatan resmi; hasil mcp dilampirkan sebagai informasi |
| 7 | Kalibrasi Manual 000 menemukan 3 kelemahan deteksi | (1) cap terbit dicari di mana pun di paragraf dan pemisah ditangkap, sehingga em dash dilaporkan sebagai pengamatan; (2) string punggung menyimpan medan `jenis` apa adanya untuk bukti NU-02, X-02 tetap hanya memakai bentuk kode; (3) label aparatus hanya dihitung bila run = label (prosa `SOURCE, SHEET n OF N; ...` tidak lagi memicu X-01/LB-09). Masing-masing dikunci uji regresi |
| 6 | `datum-kanonik` di luar register pasangan | `--type-code KT --kicker ""` (pola `datum-gsp`), dicatat sebagai peringatan oleh CLI |

## Next Steps

- B-FIX per pasangan (research/32 §10) dan berkas `--spec` dari S26 agar CR-3 dan NU-03 terlatih di S25/S36.
- S25: kalibrasi WL pada sampel EN nyata begitu tersedia (belum ada DOCX EN Studio di repo; sisi EN hanya diuji dengan sampel sintetis).
- Review recommended (lingkup: `benchmark/datum_conformance/rules/language.ts`, `rules/expect_language.ts`, `tests/unit/studio/datum-conformance/language.test.ts`), terutama heuristik WL dan perluasan CR-4.

---

# Laporan lama (S23 ronde sebelumnya, 2026-10-23), dipertahankan

# S23 coder-execution: engine/html/tables

Status: complete (penjaga lulus). Skills: backend-execution, dry-run-verify-fix.

Berkas (9, semua di `src/lib/studio/engine/html/tables/`): `index.ts` (ganti stub), `table.ts`, `figure.ts`, `derivation.ts`, `apparatus.ts`, `svg.ts`, `inline.ts`, `style.ts`, `escape.ts` (1584 baris).

Isi: `htmlTables` 16 kunci (11 TableBlock + chart, diagram, image, symbolSheet, derivation), tanda tangan I12 tetap. Ekspor tambahan: `tableHtml`, `renderTableBlock`, `renderFigureBlock`, `renderDerivationBlock`, `sanitizeSvg`, `SVG_DROPPED_ELEMENTS`, `rasterDataUri`, `base64DataUri`, `sniffRasterMime`, `toBase64`, `captionHtml`, `sourceInner`, `sourceParagraphHtml`, `provenanceHtml`, `MAX_NESTED_DEPTH`.

Penjaga (2026-10-23):
- `npx tsc --noEmit -p tsconfig.json | grep src/lib/studio/engine/html/tables` -> 0 baris (grep exit 1). Total repo 22 galat di luar area: 21 pra-ada (S03 marker) + 1 `src/lib/studio/services/render/job.ts` (milik S51, tidak disentuh).
- `npx eslint src/lib/studio/engine/html/tables` -> exit 0, tanpa keluaran.
- Smoke `npx tsx <scratch>/s23_smoke.ts`: 23/23 cek benar (thead berulang, zebra >12 baris, tanpa garis tegak, rowspan/colspan, tabel bersarang, baris SUMBER+PROVENANS, escape, SVG berteks nyata, prefiks id, mm, data-figure/data-address, data URI, placeholder tercatat, derivation monoLines + nestedTable, cacat aritmetika -> BY_CONSTRUCTION_FAILED, deterministik).

Keputusan (perlu dicatat controller):
1. CSS INLINE per elemen (bukan kelas bergantung lembar gaya S21/S24); kelas `st-*` hanya penanda. S24 tidak perlu menyisipkan CSS tambahan untuk modul ini.
2. Kunci FigureStore dicoba berurutan: blockId, label artefak, alamat, artifactId spec, kunci aset. Tidak ada entri -> placeholder berlabel + log `ARTIFACT_NOT_FOUND` (warn), tidak melempar. Chart/diagram TIDAK dirender ulang di modul ini (produsen mengisi FigureStore, S51).
3. Sanitizer SVG (string, tanpa DOM): buang `script`, `style` (CSS SVG inline tidak berlingkup, bocor ke halaman), `foreignObject`, animasi (`set`/`animate*`), iframe/object/embed/media; atribut `on*`, `src`, href non-`#`/non-data-raster, `url()` eksternal, nilai `javascript:`; DOCTYPE/ENTITY/komentar/PI dibuang; id diberi prefiks `fig-<blockId>-` (cegah tabrakan antar-SVG).
4. Derivation: `buildDerivationBlock` (S12) dijalankan ulang; cacat -> log error + lempar `StudioEngineError("BY_CONSTRUCTION_FAILED")` (bukan render diam).
5. Label `SUMBER`/`KUNCI` ditambahkan hanya bila teks belum diawali kata itu; bahasa EN -> Source/Provenance/Key/Derivation.
6. Deviasi HTML-only: padding kanan sel 2,5 mm bila margin sel R-17 = 0 (pola RL `.tbl`; DOCX tetap 0); padding vertikal default 1,5 mm (kepala 1,6, pita 3,2/1).
7. Caps = `text-transform:uppercase` (sesuai D-46). `escapeHtml`/`attr` dari `../blocks/escape` (D-46); tidak mengimpor indeks blocks.

Permintaan lintas pemilik: tidak ada.
Temuan: galat tsc baru di `services/render/job.ts` (milik S51), di luar area S23.
