---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: S21
date: 2026-11-04
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/02_structured_datum_rev_a.md
status: complete
---

# Implementation Report: S21, modul aturan structure_a (sampul CV, lembar kendali CS, perilaku tier TR)

Skill dimuat: `tdd`. Masukan dibaca: blueprint baris S21 (`02_structured_datum_rev_a.md:137, 196`), laporan S20
(API harness, `ctx`, status, penjaga indeks), `research/32` §0, §3, §4, §9, §12, §16, `research/31` §1-§4.

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca katalog, register, API harness; inspeksi DOCX baseline S05 (struktur sampul, lembar kendali, daftar isi) | complete | skrip inspeksi sementara dihapus sesudah dipakai |
| 2 | Tabel harapan per bahasa | complete | `rules/expect_structure_a.ts`, satu tabel `STRUCTURE_A_EXPECT[ID/EN]`, tanpa cabang slug |
| 3 | Uji ditulis lebih dulu (merah: 42/42 gagal, "aturan ... tidak ada di modul") | complete | lihat Issues & Decisions soal irisan |
| 4 | 27 aturan di `rules/structure_a.ts` | complete | 16 CV, 6 CS, 5 TR |
| 5 | Hijau, tsc, eslint | complete | |
| 6 | CLI `--implemented-only` pada 2 kasus baseline S05 | complete | tabel per aturan di bawah |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| `benchmark/datum_conformance/rules/structure_a.ts` | modify (stub S20 diisi) | 27 aturan `defineRule`: CV-01..CV-13, CV-16..CV-18, CS-01..CS-04, CS-07, CS-10, TR-01..TR-04, TR-08 |
| `benchmark/datum_conformance/rules/expect_structure_a.ts` | add | Nilai harapan register 31: kicker lembar kendali, judul blok, kepala kolom, label blok kendali, peran tanda tangan, alamat, kolofon, nama tier, geometri, penanda fon R0 |
| `tests/unit/studio/datum-conformance/structure-a.test.ts` | add | 42 uji: kepemilikan/indeks, DOCX baik TERBIT/SERAH/NOTA x ID/EN, mutasi per aturan |
| `docs/.../delegation_progress/file_claims.md` | modify (append 1 baris) | Klaim path S21 |

Tidak menyentuh harness, `catalog.ts`, `rules/index.ts`, modul lain, `clash/**`, `src/`, `prisma/`, `scripts/`. Tanpa dependensi baru, tanpa commit, DB, atau port.

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Unit S21 | `npx vitest run tests/unit/studio/datum-conformance/structure-a.test.ts --reporter=verbose` | 42 passed (42) | |
| Folder datum-conformance | `npx vitest run tests/unit/studio/datum-conformance` | 9 berkas: 8 lulus, 1 gagal; 190 passed, 5 failed (195) | 5 gagal semua di `language.test.ts` (milik S23, sedang berjalan paralel; indeks ujinya `structure_a: []`, tidak bergantung modul ini). Run sebelumnya pada sesi yang sama: 37 gagal saat `language.ts` masih stub |
| Folder tanpa berkas S23 | `npx vitest run tests/unit/studio/datum-conformance --exclude "**/language.test.ts"` | 8 files, 157 passed (157) | termasuk `rule-index.test.ts` S20 dengan modul ini terpasang |
| Typecheck | `npx tsc --noEmit -p .` | exit 0 | |
| Lint | `npx eslint benchmark/datum_conformance/rules/structure_a.ts benchmark/datum_conformance/rules/expect_structure_a.ts tests/unit/studio/datum-conformance/structure-a.test.ts` | exit 0, tanpa keluaran | |
| CLI baseline | `npx tsx benchmark/datum_conformance/score.ts --manifest <scratchpad>/s21_manifest.json --out <scratchpad>/s21_out --implemented-only` | exit 1 (FAIL, sesuai harapan) | skor yang dicetak CLI mencakup aturan S22 yang sudah terisi; tabel di bawah hanya modul structure_a |

## Verification

- Kepemilikan: uji `mengisi tepat 27 kode milik structure_a` membandingkan id dengan daftar literal tabel pemilik S20 dan membangun `buildRuleIndex` (penjaga metadata lulus, 27 terimplementasi).
- DOCX baik lulus: TERBIT dan SERAH (ID, EN) semua aturan berlaku = `pass` kecuali CS-10 = `na` (salinan induk tanpa nomor, bersyarat menurut research/32 §4); NOTA (ID, EN) hanya TR-02 berlaku dan `pass`.
- DOCX dimutasi gagal pada aturan spesifik (masing-masing satu uji): unsur sampul keluar urutan / Datum Rule hilang (CV-01, CV-06), blok pertama bukan pita segel (CV-02), logo 38,9 mm (CV-03), logo di header atau dua kali (CV-04), alamat berubah / 9 pt (CV-05), kicker salah jenis / tidak kapital / pasangan kosong / kicker ID di EN (CV-07), kicker hitam / fon `IBM Plex Sans Cond` (CV-08), judul 20 pt (CV-09), standfirst 12 pt / tidak miring (CV-10), cakupan 10 pt (CV-11), nilai Serif / 5 baris / tanpa garis atas (CV-12), urutan medan / penyusun hilang / label bahasa lain (CV-13), kolofon huruf campuran (CV-16), punggung tanpa kode bahasa (CV-17), margin 30 mm / rata tengah / menjorok (CV-18), lembar kendali tanpa pita (CS-01), kicker ID di EN (CS-02), blok tertukar / huruf melompat / judul bahasa lain (CS-03), kepala kolom EN `Author` bukan `Prepared by` dan ID `Penyusun` bukan `Oleh` (CS-04), riwayat tanpa baris data (CS-07), SALINAN 2 tanpa pemegang (CS-10), tier SERAH untuk pasangan TERBIT / tanpa medan tier R08 (TR-01), NOTA dengan pita segel, medan TOC, kicker lembar kendali, blok tanda tangan, atau seksi pertama bukan interior (TR-02), tanpa daftar isi / tanpa tanda tangan / lembar kendali sebelum sampul (TR-03), tier EN `ISSUED` (TR-04), TOC `1-1` / tanpa TOC (TR-08).
- Setiap hasil membawa `evidence`; hasil gagal membawa `part`, `location` (`seksi n, blok m`) dan `observed` (uji khusus pada CV-09).

### Baseline S05 per aturan (structure_a, `--implemented-only`)

Masukan: `C:\Users\TRIAL\gsp-backups\datum-rev-a-baseline\cases\a_terbit_datum_gsp\a_terbit_datum_gsp.docx` (sha256 `633e583f59dee6c9bbd8544e60b4cc1538de58cf91a56ea16a284ca2efe9e6af`) dan `...\b_nota_datum_gsp\b_nota_datum_gsp.docx` (sha256 `5aeac7ccd1399fd38d8ba02c15b2db1dedc41ba7f79d1ef389ab9c53458c38dd`); pasangan `datum-gsp` ID (KT, kicker `""`), `producedBy r08`, tier TERBIT dan NOTA.

| Kode | a_terbit_datum_gsp (TERBIT) | Bukti / nilai teramati | b_nota_datum_gsp (NOTA) |
|---|---|---|---|
| CV-01 | pass | `E1@0 E2@1 E3@2 E5@4 E7@5 E8@7 E10@8 E11@10` | tidak berlaku |
| CV-02 | pass | blok 0 = tabel pita segel | tidak berlaku |
| CV-03 | pass | logo cx 1.584.000 EMU (44,0 mm) | tidak berlaku |
| CV-04 | pass | `word/media/fig-6963...png` dirujuk sekali, hanya di sampul | tidak berlaku |
| CV-05 | pass | alamat persis, sz 14 | tidak berlaku |
| CV-06 | pass | Datum Rule blok 4 | tidak berlaku |
| CV-07 | **fail** | kicker pasangan kosong (kalibrasi `datum-gsp`), unsur 6 tidak ada; FAIL sesuai research/32 CV-07 | tidak berlaku |
| CV-08 | na | kicker (E6) tidak ada | tidak berlaku |
| CV-09 | pass | judul sz 50 | tidak berlaku |
| CV-10 | pass | standfirst sz 21 IBM Plex Serif miring | tidak berlaku |
| CV-11 | na | baris cakupan tidak ada | tidak berlaku |
| CV-12 | **fail** | label `IBM Plex Sans Cond` sz 12: nama fon tidak memuat `Condensed` (R0). Ukuran, nilai Mono sz 14, 3 baris, garis atas tcBorders sz 10 lulus | tidak berlaku |
| CV-13 | pass | `Nomor dokumen | Revisi | Penyusun | Tier | Bahasa` -> number, rev, author | tidak berlaku |
| CV-16 | **fail** | teks tampak `PT Gemilang Satria Perkasa · NIB 9120208940517` (bukan kapital seperti register 31 §4.6) | tidak berlaku |
| CV-17 | pass | `KT · BIAYA PEMELIHARAAN GI CIKUPA · ID · REV A · XI · 2026` | tidak berlaku |
| CV-18 | pass | pgMar.left 1361, tanpa rata tengah, tanpa indentasi | tidak berlaku |
| CS-01 | pass | seksi 1 = LEMBAR KENDALI, dibuka pita segel | tidak berlaku |
| CS-02 | pass | kicker dan judul `Lembar Kendali` | tidak berlaku |
| CS-03 | pass | A..D berurutan | tidak berlaku |
| CS-04 | pass | `[Rev, Tanggal, Uraian, Oleh]`, `[Lapis, Peran, Nama, Tanggal]`, `[Salinan, Pemegang]` | tidak berlaku |
| CS-07 | pass | 1 baris data | tidak berlaku |
| CS-10 | na | salinan induk tanpa nomor | tidak berlaku |
| TR-01 | pass | Tier = `TERBIT` | tidak berlaku |
| TR-02 | tidak berlaku | | **pass** (4 seksi, semua interior; tanpa pita, kicker, TOC, tanda tangan) |
| TR-03 | **fail** | seksi 2 (halaman daftar isi) memakai tabel peta isi tanpa medan TOC, jadi tidak ada DAFTAR ISI menurut R0; tanda tangan ada di seksi 1 | tidak berlaku |
| TR-04 | tidak berlaku (ID) | | tidak berlaku |
| TR-08 | **fail** | tidak ada medan TOC di dokumen | tidak berlaku |

Ringkasan structure_a: TERBIT 25 berlaku, 17 pass, 5 fail, 3 na, skor modul 17/22 = 77,3 %. NOTA 1 berlaku, 1 pass.
Dengan alias fon `IBM Plex Sans Cond` (belum diputus, lihat bawah) CV-12 akan lulus (18/22 = 81,8 %).

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| 5 uji gagal di `tests/unit/studio/datum-conformance/language.test.ts` | 0 (bukan berkas S21) | Modul S23 sedang dikerjakan paralel | dilaporkan, tidak disentuh | Tidak untuk S21 |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| 4 | Wajah Cond: R0 menetapkan "nama memuat `Condensed`"; mesin (profil Manual 000) menulis `IBM Plex Sans Cond` (`src/lib/studio/params/color-type.ts:131`) | Mengikuti R0 secara harfiah (`COND_FONT_MARKERS = ["Condensed"]`, satu konstanta). Akibat di baseline: CV-12 FAIL; CV-08 dan CV-11 juga akan gagal bila unsurnya ada. Perlu putusan controller/S25: tambah alias di R0 atau biarkan sebagai temuan. Mengubah satu konstanta cukup |
| 4 | CV-13 memetakan label per bahasa pasangan; EN `author` menerima `Author` (EN sekarang) dan `Prepared by` (target) | Pemetaan medan dipisah dari kebenaran label; label `Prepared by` ditegakkan LB-01 (modul language). Label bahasa lain di dokumen = tidak terpetakan = FAIL CV-13 |
| 4 | CV-09 dinilai pada paragraf sampul berukuran run terbesar, bukan E7 | E7 didefinisikan oleh ukuran 48-52, jadi menilai E7 akan selalu lulus; paragraf terbesar membuat CV-09 dapat gagal |
| 4 | Pengenal E8 (standfirst) = semua run miring atau semua Seri; E9 (cakupan) = semua run Cond dan sesudah judul | Kicker yang salah jenis tidak salah dikenali sebagai baris cakupan; konsekuensinya urutan E9 sebelum judul tidak terdeteksi CV-01 |
| 4 | Blok tanda tangan (TR-02, TR-03) dikenali struktural: baris 1 memuat peran (31 §4.3, ID/EN, sekarang dan target), baris 2 kosong (`render.ts:521-566`) | Menghindari salah kenal kolom `Prepared by` tabel riwayat revisi EN dan peran rantai verifikasi |
| 4 | TR-04 tanpa medan Tier = FAIL (bukan NA) | Katalog §16 hanya mengizinkan NA bersyarat untuk TR-01 pada blok MCP; TR-04 tidak termasuk |
| 4 | CV-16 dibanding teks tampak, persis dan peka huruf | Katalog menulis "=" tanpa "tanpa beda besar-kecil" (berbeda dengan RH-01/CV-07); baseline FAIL karena huruf campuran. Bila controller menghendaki banding tanpa beda huruf, satu baris |
| 3 | Irisan TDD | Uji ditulis dalam satu berkas sebelum implementasi (42 merah), bukan satu uji per siklus; harapan setiap uji berasal dari katalog research/32 dan register 31, tidak dari kode modul. Seam diambil dari brief controller (DOCX baik lulus, DOCX dimutasi gagal per aturan), tidak dikonfirmasi terpisah ke pengguna karena sub-agen tidak dapat bertanya |
| 6 | Temuan kalibrasi untuk S25 | Baseline datum-gsp: halaman daftar isi berupa tabel peta isi tanpa medan TOC (TR-03, TR-08 FAIL); kolofon huruf campuran (CV-16); kicker kosong (CV-07, sesuai katalog) |

## Next Steps

- Controller/S25: putuskan alias fon `IBM Plex Sans Cond` (R0) dan kepekaan huruf CV-16.
- Review recommended (lingkup: `benchmark/datum_conformance/rules/structure_a.ts`, `rules/expect_structure_a.ts`, `tests/unit/studio/datum-conformance/structure-a.test.ts`).

## B-1 fix (2026-11-04, coder-execution, skill `tdd`)

Bug B-1 (verification/21_datum_conformance_calibration.md, bug skor): `structure_a` menolak wajah `IBM Plex Sans Cond` (alias Cond sah menurut D-602, Manual ID:4430) karena `COND_FONT_MARKERS = ["Condensed"]`; akibatnya CV-08/CV-11/CV-12 gagal atau NA palsu. Seam uji: hasil `rule.check` structure_a (CV-08, CV-11, CV-12) dan predikat bersama `isCondFont`.

| File | Perubahan |
|---|---|
| `benchmark/datum_conformance/rules/fonts.ts` | baru: satu `isCondFont` bersama (semantik lama structure_b: memuat `Condensed` atau kata utuh `IBM Plex Sans Cond`) |
| `benchmark/datum_conformance/rules/expect_structure_a.ts` | hapus `COND_FONT_MARKERS` (daftar penanda duplikat) |
| `benchmark/datum_conformance/rules/expect_structure_b.ts` | hapus `isCondFont` (dipindah ke `fonts.ts`) |
| `benchmark/datum_conformance/rules/structure_a.ts` | impor `isCondFont`; 4 pemakaian (E9 pengenal baris cakupan, CV-08, CV-11, CV-12) memakai `isCondFont(runFont(doc, r))`; teks bukti menyebut "fon Cond/Condensed" |
| `benchmark/datum_conformance/rules/structure_b.ts` | impor `isCondFont` dari `./fonts` (bukan `expect_structure_b`) |
| `tests/unit/studio/datum-conformance/fonts.test.ts` | baru: predikat menerima Condensed/Cond; menolak Arial, IBM Plex Sans/Serif/Mono, Calibri, `IBM Plex Sans Conduit`, kosong, undefined |
| `tests/unit/studio/datum-conformance/structure-a.test.ts` | uji lama yang menegaskan bug (CV-08 "Sans Cond = fail") diganti; tambah CV-08 (Cond dan Condensed pass, Arial fail), CV-11 (Cond dikenali dan pass, Arial tidak pass), CV-12 (label Cond pass, Arial fail); `controlBlock` diberi opsi `labelFont` |

Merah dulu: sebelum perbaikan 3 uji structure_a gagal (CV-08 `fail`!=`pass`, CV-11 `na`!=`pass`, CV-12 `fail`!=`pass`) dan `fonts.test.ts` tidak bisa memuat `rules/fonts`. Setelah perbaikan:

- `npx vitest run tests/unit/studio/datum-conformance` -> Test Files 10 passed (10), Tests 213 passed (213) (sebelumnya 199 pada 9 berkas).
- `npx tsc --noEmit -p .` exit 0; `npx eslint benchmark/datum_conformance/rules tests/unit/studio/datum-conformance/structure-a.test.ts tests/unit/studio/datum-conformance/fonts.test.ts` exit 0 tanpa keluaran.
- Skor ulang `C:\Users\TRIAL\gsp-backups\datum-rev-a-baseline\cases\a_terbit_datum_gsp\a_terbit_datum_gsp.docx` (CLI kalibrasi `npx tsx benchmark/datum_conformance/score.ts --template datum-gsp --language ID --tier TERBIT --produced-by r08 --bfix <diri> --clash C:/tmp/dc_s25/clash/a_terbit_datum_gsp.json`): `datum-gsp_ID: FAIL | skor 84.6 % (55/65)`, **CV-12 = pass** (sebelumnya fail; sebelum 54/65 = 83,0 %). CV-08 dan CV-11 = na (kicker kosong dan tanpa baris cakupan, sah menurut katalog). Putusan keseluruhan tetap FAIL (CR-3, skor < 85 %, cakupan tidak diberikan), sesuai proyeksi kalibrasi.
- Repro `C:/tmp/dc_s25/mut/k_short.docx` dan `k_long.docx` (`--kicker "KAJIAN TEKNIS"`): CV-07 pass, **CV-08 pass pada keduanya** (k_short sebelumnya fail). k_short 57/66 = 86,3 %, k_long 56/66 = 84,8 %. Keluaran skor di luar repo (scratchpad sesi).

Catatan: semantik predikat dipertahankan persis (tidak diperketat), jadi nama lain yang memuat `Condensed` (mis. `Arial Condensed`) tetap diterima seperti pada R0 dan GF-07; tidak ada uji yang menuntut sebaliknya. Tidak ada perubahan di `src/`, `prisma/`, `scripts/`; tidak ada commit. Review recommended (lingkup: berkas `rules/` dan uji di atas).
