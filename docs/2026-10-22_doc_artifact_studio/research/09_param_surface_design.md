---
schema_version: 1.0
task_slug: doc_artifact_studio
row: SR-59
agent: data-analyst
date: 2026-10-23
type: requirements
confidence: HIGH untuk hitungan lapis, pemetaan kenop ke kunci, dan rumus identitas A4. MEDIUM untuk faktor kerapatan margin, dimensi F4, dan kenop lebar chart/diagram (bergantung compose v2). Rincian di §8
status: complete
inputs: identification/05_structural_sections_blueprint.md (baris SR-59 :723, §0 :18-48, §2.3 :213-320), research/08_param_slot_scope_map.md (SR-02, D-162), decisions D-139, D-140, D-147, D-151, D-156, D-158, D-162, src/lib/studio/params/** (7 berkas), src/lib/studio/engine/tokens/{grid,index,merge}.ts, src/lib/studio/services/templates/profile.ts, benchmark/manual000/template.json, prisma/seed-studio.ts, masterplan/04_studio_ux_spec.md (W3), Grep pembaca kunci di src/lib/studio/engine
sr01_alignment: masterplan/03_structural_sections_specs.md BELUM ADA saat analisis (Glob masterplan/* hanya 01_specs.md dan 04_studio_ux_spec.md). Nama kunci baru di dokumen ini bersifat sementara dan wajib diselaraskan dengan register SR-01 (KT-13)
---

# SR-59 Desain Permukaan Parameter (preset, esensial, lanjutan, turunan, internal)

## 1. Source Tasks

| Sumber | Isi yang dipakai |
|---|---|
| `identification/05_structural_sections_blueprint.md:723` | Baris SR-59. Syarat: setiap kunci tepat satu lapis, hitungan per lapis = total modul, esensial ≤ 8 per jenis slot dan total ≤ 60, setiap kenop terpetakan ke kunci rinci atau fungsi turunan bernama |
| Blueprint §0 (:18-48) | Prinsip (a) kontrak = konten murni, (b) keputusan keluaran milik templat dan mesin, (e) pengguna templat hanya melihat preset dan esensial |
| Blueprint §2.3 (:213-320) | Lima lapis, 36 kenop usulan (:234-246), urutan resolusi (:260-268), aturan kelas (:278-282), migrasi templat lama ke preset (:317-320) |
| Blueprint AS-8 (:110) | Kenop hanya memetakan ke kunci yang ada atau turunan T baru. Kenop yang butuh perilaku mesin baru gugur dan dicatat |
| `research/08_param_slot_scope_map.md` | 722 kunci, cakupan per kunci (§5), kelas B 396 / K 290 / T 36 (§7.1), kelompok ukuran halaman 22 kunci (§14.1), duplikat D1-D11 (§14.3), rantai turunan usulan (§14.4) |
| D-139, D-140 | Prinsip inti dan keputusan user meringkas parameter |
| D-147 | `symbol.sheet.fit` (bool, bawaan false, cakupan `section:symbolSheet`). Preset DATUM Manual 000 = true |
| D-151 | P4S-13 `boldFields` disematkan sesuai BM di preset Manual 000 dan GSP DATUM. Renderer membaca P4S-13 di IP-44 |
| D-156 | Lembar simbol isi-pas; tinggi per dialek terukur (konteks `symbol.sheet.fit`) |
| D-158 | Kenop global "Ukuran kertas" `page.size` {A4, A3, A5, Letter, Legal, F4} + `page.orientation` {portrait, landscape}; `page.sizeMm`, `pageSizeTw`, kolom teks, lebar figur sah = TURUNAN; A4 tetap 128/166; slot boleh menimpa orientasi |
| D-162 | SR-02 diterima. Nilai 247 tidak diturunkan sehingga margin bawah −63 mm pada A4 landscape/A5 (BUG, wajib menjadi turunan) |
| `benchmark/manual000/template.json:805-1107` | 87 override profil Manual 000 (sumber preset GSP DATUM dan Manual 000) |
| `prisma/seed-studio.ts:66, 86-107, 172-245` | Asal templat: `datum-kanonik` = tanpa override; `datum-gsp` = override template.json dikurangi `lint.enforcement*`; `datum-manual-000` = template.json apa adanya |

## 2. Exploration & Collection Summary

Metode (tanpa Bash; Read + Grep):
1. Ketujuh berkas modul parameter dibaca utuh. Setiap kunci diberi lapis per ID dengan aturan di §5.1. Hitungan dicocokkan dengan konstanta `*_COUNT` dan tabel §7.1 research/08.
2. Pembaca kunci di mesin dicari dengan Grep (`src/lib/studio/engine`, `!**/params/**`). Hanya kunci yang benar-benar dibaca mesin (atau yang wajib dibaca compose v2 menurut §0) yang sah menjadi pemetaan kenop.
3. Rumus `paramsSha256` ditelusuri: `profile.ts:580-584` = `sha256Hex(stableStringify(resolvedParams))`. `resolvedParams` memuat SELURUH kunci registri, karena `mergeLayers` diawali `canonicalProfile(registry)` (`merge.ts:38-42, 150-155`), ditambah kunci bayangan `grid.marginBottomMm` (`grid.ts:341-352`, `always: true`). `stableStringify` mengurutkan kunci (`services/ingest/util.ts:27`).
4. Override template.json dibandingkan nilai demi nilai dengan bawaan registri. Hasilnya: 45 dari 87 override sama dengan bawaan atau turunan (§6.2).
5. Identitas turunan pada A4 potret dihitung manual dengan `mmToTw` = `round(mm × 1440 / 25,4)` (`section.ts:33-35`).

## 3. Overview

5W1H (Tier 1):
- **Apa:** peta lapis untuk 722 kunci `ALL_PARAMS` + 17 kunci kontrak baru = 739 kunci. Ditambah 28 kenop esensial final, 11 fungsi turunan bernama baru, isi 3 preset, dan penjaga `paramsSha256`.
- **Siapa:** pembaca = SR-05 (transkripsi `PARAM_SURFACE` dan `registry/essentials.ts`), SR-60 (fungsi turunan), SR-16/SR-17 (konsumen DOCX/HTML), SR-36/SR-38 (seed dan migrasi preset), UX-01/SR-28 (label kenop). Pemangku kepentingan = pengguna templat (USER) dan ADMIN.
- **Kapan:** keadaan berkas pada 2026-10-23. Baseline sha diambil SR-36 sebelum registri baru di-seed (§7.3).
- **Lingkup:** dokumen ini saja. Tidak ada perubahan kode.
- **Mengapa:** D-140 (722 parameter terlalu banyak), D-158 (ukuran kertas end-to-end), D-162 (bug 247).
- **Metodologi:** §2.
- **Alternatif yang ditimbang:**
  - (1) Kenop sematan "absolut", yaitu nilai preset menang mutlak (blueprint :222). Ditolak untuk kunci tipografi, karena kenop ukuran huruf tidak akan berefek pada preset terukur. Diganti dengan "turunan beracuan", lihat §4.2.
  - (2) Kunci baru `color.accent`. Ditolak karena `color.interior.signal` sudah menjadi aksen tunggal dan dirujuk lewat token `signal`.
  - (3) Penjaga sha penuh. Mustahil, karena kunci baru selalu mengubah sha penuh (F1). Diganti dengan proyeksi ke kunci lama.
- **Asumsi:** AS-59-1 sampai AS-59-4 di §4.4.
- **Celah:** KT-1 sampai KT-15 di §9.

Hasil ringkas:

| Lapis | Sebelum | Sesudah (kunci) | Tampil untuk |
|---|---|---|---|
| Esensial | 0 (722 datar tampil semua) | 21 kunci di balik 28 kenop | USER + ADMIN (bawaan editor) |
| Lanjutan | 0 | 317 | ADMIN / mode ahli, panel terlipat |
| Turunan | 36 (kelas T) | 72 (44 T-hitung + 28 T-acuan) | Hanya-baca di mode ahli |
| Internal | 0 | 329 | Tidak tampil di editor templat; ADMIN di preset |
| Total | 722 | 739 (722 + 17 baru) | |

## 4. Requirements dan definisi lapis

### 4.1 Persyaratan (dari SR-59 + keputusan)

1. Setiap kunci (722 + kunci kontrak baru) tepat SATU lapis. Hitungan per lapis = total modul.
2. Ada daftar duplikat dan kunci turunan dengan fungsi bernama. Daftar ini mencakup tinggi blok 247 dan lebar figur.
3. Kenop esensial final: label awam bahasa Indonesia, tipe/pilihan, bawaan, dan pemetaan sah.
   - Maksimal 8 per kelompok dan total ≤ 60.
   - Kelompok global WAJIB memuat Ukuran kertas dan Orientasi.
4. Isi 3 preset: nilai sematan, P4S-13 sesuai BM, `symbol.sheet.fit` Manual 000 = true. Penjaga: nilai efektif = versi terbaru, dibuktikan oleh SR-36.
5. Tabel hitungan sebelum/sesudah per lapis.

### 4.2 Definisi lapis (sumber kebenaran untuk SR-05)

| Lapis | Kode | Definisi operasional | Penulis | Galat tulis di luar hak |
|---|---|---|---|---|
| Esensial | E | Kunci yang menjadi tempat simpan kenop esensial (§7). Satu kunci boleh melayani lebih dari satu kenop (mis. `cover.elementOrder`) | Pemilik templat bila kelas B; ADMIN bila K | K: 403 `PARAM_CLASS_K_FORBIDDEN` |
| Lanjutan | L | Keputusan tampilan rinci yang masih boleh ditimpa | ADMIN / mode ahli | 403 `PARAM_SURFACE_FORBIDDEN` |
| Turunan, T-hitung | T | Selalu dihitung mesin (kelas T). Tidak pernah disimpan sebagai override | Tidak ada | 400 `PARAM_CLASS_T_READONLY` |
| Turunan, T-acuan | TA | Kelas tetap B. Nilai tersimpan adalah ACUAN, dan nilai efektif = f(kenop, acuan). Acuan hanya boleh ditulis pada versi preset (`isPreset`, ADMIN). Pada kenop bawaan, f = identitas, sehingga nilai efektif = acuan | ADMIN pada preset saja | Di luar preset: 400 `PARAM_CLASS_T_READONLY` (usulan, KT-4) |
| Internal | I | Mekanisme paket/mesin, kebijakan lint/tata kelola, kanal nonaktif, atau medan yang sejatinya isi per dokumen (F5 research/08) | ADMIN pada preset | Tidak dirender di editor templat |

Penyempurnaan atas blueprint :222 ("kunci yang disematkan preset tetap memakai nilai sematan"). Untuk T-acuan, sematan preset berlaku persis selama kenop berada pada nilai preset. Bila pengguna mengubah kenop, nilai diskalakan dari sematan itu. Untuk geometri halaman tidak ada sematan sama sekali, karena sematan absolut 247 adalah sumber bug D-162.

### 4.3 Kunci kontrak baru (17; nama sementara, selaraskan dengan SR-01)

| # | Kunci | Lapis | Kelas | Cakupan (tambahan research/08) | Tipe, bawaan | Dasar |
|---|---|---|---|---|---|---|
| N1 | `page.size` | E | B | document | enum {A4, A3, A5, Letter, Legal, F4, custom}, "A4". `custom` hanya ADMIN lewat lanjutan | D-158 |
| N2 | `page.orientation` | E | B | slot | enum {portrait, landscape}, "portrait" | D-158, research/08 §14.4 |
| N3 | `page.customSizeMm` | L | K | document | pair mm atau null, null. Dipakai bila `page.size = custom` | D-158 "kustom mm = lanjutan ADMIN" |
| N4 | `grid.marginDensity` | E | B | document | enum {rapat, sedang, lega}, "sedang" | Blueprint :238, :258 |
| N5 | `grid.marginBottomMm` | TA | B | document | mm, 24. Promosi kunci bayangan; nilai lama terhitung juga 24 | `grid.ts:44-45, 341-352`; D-33 |
| N6 | `type.baseSizePt` | E | B | document | pt 8-12 langkah 0,5, 9,5 | Blueprint :238, :258 |
| N7 | `slot.placement` | E | B | slot | enum {controlSheet, separate}, "controlSheet" | Blueprint :258, AS-2 |
| N8 | `slot.setup` | I | K | slot | objek SectionSetup parsial, {} | Blueprint :258, research/08 A21 |
| N9 | `slot.placeholderText` | L | B | slot | string, "" | Blueprint :258 |
| N10 | `render.draft.marker` | I | B | document | string, ditetapkan SR-01 | Blueprint :258, :512 |
| N11 | `render.run.symbolGlyphs` | I | B | document | list char; wajib memuat glif `marks.*.glyph` (P5-30/32/34/36) + simbol R-37 | Blueprint :38, :258 |
| N12 | `ingest.inlineFormat` | I | K | document | enum {strip, reject, allow}, "strip" | D-138 |
| N13 | `symbol.sheet.fit` | L | B | section:symbolSheet | bool, false | D-147 |
| N14 | `table.widthClass` | E | B | section:table | enum {text, full}, "text" | research/08 A26, §14.4 butir 5 |
| N15 | `chart.widthClass` | E | B | section:chart | enum {text, full}, "text" | sama |
| N16 | `diagram.widthClass` | E | B | section:diagram | enum {text, full}, "text" | sama |
| N17 | `appendix.kicker.pattern` | E | B | section:appendix | string berisi `{n}` atau null, null. null = turunan kata "LAMPIRAN" dari pola bab (perilaku sekarang) | Promosi kunci bayangan yang sudah dibaca `structure.ts:55-60` |

Tidak ditambahkan: `color.accent`, karena kenop aksen memetakan ke `color.interior.signal` (P4C-14, `color-type.ts:77`) yang sudah dirujuk token `signal`.

Perubahan cakupan atas research/08 (dibolehkan research/08 A3): PD-01 `sourceRegister.columns` dipindah dari `document` ke `section:sourceRegister` agar dapat menjadi kenop slot Referensi.

Hitungan cakupan sesudah (untuk fixture SR-05):

| Cakupan | Total |
|---|---|
| document | 360 − 1 + 8 = 367 |
| section registri | 300 + 1 + 5 = 306 |
| perangkat | 37 |
| shared | 25 |
| slot | 0 + 4 = 4 |
| **Total** | **739** |

### 4.4 Asumsi

| ID | Asumsi | Dasar |
|---|---|---|
| AS-59-1 | Kenop "sah" bila kuncinya dibaca mesin (Grep), atau dibaca compose v2 karena §0 memindahkan medan itu dari konten ke templat (TOC mode, lebar figur, bahasa, klasifikasi) | Blueprint §0 baris tabel :35-45; AS-8 |
| AS-59-2 | Dimensi kertas: A4 210×297, A3 297×420, A5 148×210 (ISO 216); Letter 215,9×279,4 dan Legal 215,9×355,6 (8,5×11 dan 8,5×14 in). F4 = 215×330 adalah HIPOTESIS, karena ukuran F4 di Indonesia beragam (210 atau 215 × 330) | KT-2 |
| AS-59-3 | Margin, talang, dan rel tetap dalam mm saat kertas berubah. Kolom teks menyerap selisih (kebijakan D11 research/08) | research/08 §14.3 D11 |
| AS-59-4 | Baseline sha = versi terbaru di DB v21 sebelum registri SR-05 di-seed | D-149 (kanonik v5 sudah tertulis), KT-5 |

## 5. Peta lapis seluruh kunci (722 + 17)

### 5.1 Aturan penentu (dievaluasi berurutan; aturan pertama yang cocok menang)

1. Kunci yang menjadi tempat simpan kenop esensial (§7) → **E**.
2. Kelas T sekarang, kunci yang dialihkan ke T (§5.3), atau T-acuan (§5.3) → **T/TA**.
3. Mekanisme paket/renderer, kebijakan lint/gerbang/juri/ambang, kanal nonaktif atau tak dirender (P15, `letter.*`, `brief.*`), konstanta berenum tunggal kelas K, isi per dokumen (F5 research/08), atau kunci yang tidak dibaca mesin dan bukan keputusan tampilan → **I**.
4. Selebihnya (keputusan tampilan rinci yang dibaca mesin) → **L**.

### 5.2 Penetapan per berkas (daftar ID otoritatif untuk transkripsi SR-05)

**`params/governance-language.ts` (115)**

| Lapis | ID | n |
|---|---|---|
| E | P3-23 `doc.language`, PD-01 `sourceRegister.columns` | 2 |
| L | P3-01 `artifact.tier`, P3-18 `doc.number` | 2 |
| T | P3-04, 06, 07, 08, 11, 16, 19, 21 (kelas T sekarang) | 8 |
| I | P1-01..04 (4); P3-02, 03, 05, 09, 10, 12, 13, 14, 15, 17, 20, 22, 24 (13); P11-01..44 (44, kebijakan bahasa/lint); P15-01..31 (31, `inactive`); P16-01..08 (8); PA-01, PB-01, PC-01 (3) | 103 |

Catatan: P3-14 `naming.artifactId.pattern` = I, karena Grep di engine memberi 0 pembaca (penomoran oleh mesin, §2.6 butir 5).

**`params/color-type.ts` (134)**

| Lapis | ID | n |
|---|---|---|
| E | P4C-14 `color.interior.signal` | 1 |
| L | P4C-01..07, 08..13, 15..17, 23, 25..33, 35 (27); P4T-01..05, 10..13, 15, 16 (11); P4T-S* atribut `upper`/`trackEm`/`face`/`weight`/`colour`/`tabular` (46); P4T-X02, X03, X04, X06, X07, X09, X10, X11, X12 (9) | 93 |
| T | P4T-17 `type.baselinePt` (T-hitung, B→T); TA: P4T-S01..S13 `size` (13) + `leading` (chapterTitle, sectionHeading, body, tableBody, caption, sourceLine, evidenceRail, derivation = 8); P4T-X01, X05, X08 (3) | 25 |
| I | P4C-18, 19 (brief), 20, 21, 22 (lint warna), 24 (alasan latar gelap), 34; P4T-06..09 (bobot yang diizinkan, lint), 14, 18; P4T-X13, X14 | 15 |

**`params/page.ts` (91)**

| Grup | E | T | L | I |
|---|---|---|---|---|
| P4G (17) | 16 `layout.railMode` | 01, 03, 11 (dialihkan ke T); 02, 06, 12 (TA kerapatan); 07, 09, 10, 13, 15, 17 (T sekarang) = 12 | 04, 05, 08 = 3 | 14 = 1 |
| P4R (15) | - | 11 = 1 | 01..08, 12..15 = 12 | 09, 10 = 2 |
| P4S (27) | 01, 15, 20 = 3 | 02, 03, 27 = 3 | 04..08, 10..13, 16, 17, 21..26 = 17 | 09, 14, 18, 19 = 4 |
| P4V (16) | 03 `cover.elementOrder`, 08 `cover.kicker.text` = 2 | 02, 11 = 2 | 05, 06, 07, 09, 12, 13, 14, 15, 16 = 9 | 01, 04, 10 = 3 |
| P4K (6) | - | - | 01, 02, 04, 05, 06 = 5 | 03 = 1 |
| P4A (10) | 04 `chapter.kicker.pattern` = 1 | 03 = 1 | 01, 08 = 2 | 02, 05, 06, 07, 09, 10 = 6 |
| **Total 91** | **7** | **19** | **48** | **17** |

**`params/apparatus.ts` (111)**

| Grup | E | T | L | I |
|---|---|---|---|---|
| P5 (68) | - | 10, 14 (dialihkan ke T), 18, 45, 46, 47, 58, 67, 68 = 9 | 03, 04, 07, 08, 09, 12, 13, 24, 26, 27, 28, 30..37, 41, 62 = 21 | 01, 02, 05, 06, 11, 15, 16, 17, 19..23, 25, 29, 38, 39, 40, 42, 43, 44, 48..57, 59, 60, 61, 63..66 = 38 |
| P6 (43) | 02 `classification.level` = 1 | 26 = 1 | 19 `ahs.rows`, 30 `boq.columns` = 2 | 01, 03..18, 20..25, 27, 28, 29, 31..43 = 39 |
| **Total 111** | **1** | **10** | **23** | **77** |

**`params/figure.ts` (135)**

| Grup | E | T | L | I |
|---|---|---|---|---|
| P7 (36) | - | 20 (dialihkan ke T), 30, 31 = 3 | 05, 07..12, 13, 16, 27, 32, 35, 36 = 13 | 01..04, 06, 14, 15, 17, 18, 19, 21..26, 28, 29, 33, 34 = 20 |
| P8 (2) | - | - | - | 01, 02 = 2 |
| P9 (55) | - | 04, 36, 45 (36/45 dialihkan ke T), 38, 51 = 5 | 09..31 (23), 40, 44, 47, 48 = 27 | 01..03, 05..08, 32..35, 37, 39, 41, 42, 43, 46, 49, 50, 52..55 = 23 |
| P10 (42) | - | - | - | 01..42 = 42 (0 pembaca di engine, research/08 F6) |
| **Total 135** | **0** | **8** | **40** | **87** |

**`registry/charts.ts` (99):** L = 99. Kunci ini adalah bawaan tampilan per jenis chart (`chart.kind.<kode>.*`) yang dibaca mesin chart; ADMIN dapat mencari di panel lanjutan.

**`params/render.ts` (37)**

| Lapis | ID | n |
|---|---|---|
| E | R-22 `render.toc.mode` | 1 |
| L | R-15 caption.separator, R-16 table.sourcePlacement, R-20 list.bulletMarker, R-21 list.numberMarker, R-26 runningHead.docLabel, R-27 org.shortName, R-33 section.numberSeparator, R-34 specTable.conditionIndentMm, R-36 run.strong | 9 |
| T | R-13 `render.rail.colsTw` | 1 |
| I | R-01..R-12, R-14, R-17, R-18, R-19, R-23, R-24, R-25, R-28, R-29, R-30, R-31, R-32, R-35, R-37 | 26 |

**Ringkasan per berkas**

| Berkas | E | L | T | I | Total | Cocok konstanta |
|---|---|---|---|---|---|---|
| governance-language | 2 | 2 | 8 | 103 | 115 | `_COUNT` 115 |
| color-type | 1 | 93 | 25 | 15 | 134 | 134 |
| page | 7 | 48 | 19 | 17 | 91 | 91 |
| apparatus | 1 | 23 | 10 | 77 | 111 | 111 |
| figure | 0 | 40 | 8 | 87 | 135 | 135 |
| charts | 0 | 99 | 0 | 0 | 99 | 99 |
| render | 1 | 9 | 1 | 26 | 37 | 37 |
| **ALL_PARAMS** | **12** | **314** | **71** | **325** | **722** | 722 |
| Kunci baru (§4.3) | 9 | 3 | 1 | 4 | 17 | |
| **Sesudah** | **21** | **317** | **72** | **329** | **739** | |

Verifikasi:
- 0 kunci tanpa lapis: setiap ID dari §5.1-5.7 research/08 muncul di salah satu tabel di atas.
- 0 kunci ganda: rentang dalam satu berkas saling lepas, diperiksa per baris.
- Jumlah kolom per berkas = konstanta `*_COUNT`.

### 5.3 Perubahan kelas dan sub-jenis turunan (untuk SR-05/SR-04)

| Jenis | Kunci | n | Hasil kelas |
|---|---|---|---|
| T sekarang | 36 kunci kelas T (research/08 §7.1) | 36 | T |
| B → T | P4G-01 `page.sizeMm`, P4G-03 `grid.textColumnMm`, P4T-17 `type.baselinePt` | 3 | T |
| K → T | P4G-11 `grid.textBlockHeightMm`, P5-14 `table.columnWidthSumMm`, P7-20 `chart.output.widthMm` (enum string dibuang), P9-36 `diagram.widthMm` (enum dibuang), P9-45 `diagram.maxHeightMm` | 5 | T |
| T-acuan (kelas B tetap) | P4G-02, P4G-06, P4G-12; 21 `type.scale.*.size/leading`; P4T-X01, X05, X08; N5 `grid.marginBottomMm` | 28 | B |
| **Lapis T sesudah** | 44 T-hitung + 28 T-acuan | **72** | |

Kelas sesudah untuk 722 kunci: B 393, K 285, T 44. Kunci baru: B 14, K 3. Total B 407, K 288, T 44 = 739.

Usulan medan ParamDef untuk SR-04 (lewat `file_requests.md`): `surface: "essential" | "advanced" | "derived" | "internal"`. T-acuan dikenali dari `surface = "derived"`, kelas ≠ T, dan `derive` terisi.

### 5.4 Kunci dengan sub-medan turunan (lapis kunci tidak berubah)

| Kunci (lapis) | Sub-medan turunan | Fungsi |
|---|---|---|
| R-09 `render.section.wrapper`, R-10 `render.section.interior` (I) | `pageSizeTw` (selalu). `marginTw.top/bottom/left/right` (hanya bila `marginTw` ada). `header.format.tabs[val=right].posTw` (hanya bila ada) | `sectionSetupFromGrid` |
| R-30 `render.docx.headerFooterStyles` (I) | `Header/Footer.tabs[].posTw` | `headerFooterTabsFromSpan` |
| R-07 `render.docx.normalStyle` (I) | `szHalfPt`, `lineTw`, `color` | `typeScaleFromBase`, `colorLiterals` |
| R-20, R-21 (L), R-37 (I) | `szHalfPt` (bila ada); R-21 `color` | `typeScaleFromBase`, `colorLiterals` |

R-06 `render.docx.docDefaults` TIDAK diturunkan. Kanonik kebetulan sama dengan normalStyle (19/270), tetapi Manual 000 menyematkan bawaan Word terukur 22/276 (`template.json:881-895`). Menurunkannya akan merusak penjaga sha.

## 6. Duplikat dan kunci yang dapat diturunkan (masukan SR-60)

### 6.1 Daftar duplikat

| # | Duplikat / konflik | Bukti | Penyelesaian |
|---|---|---|---|
| U1 | Ada tiga sumber ukuran halaman: `page.sizeMm`, `pageSizeTw` R-09/R-10, dan fallback A4 mesin. Sumber keempat: `workbook.print.paper` (P15-12, inactive) | `page.ts:60`; `render.ts:12, 91, 102`; `section.ts:25, 74`; `grid.ts:143`; `governance-language.ts:277-278` | Satu sumber `page.size` + `page.orientation` → `pageSizeFromKnob` → `sectionSetupFromGrid`. Fallback mesin membaca nilai efektif (SR-16/SR-17). P15-12 tetap I dan wajib membaca `page.size` bila kanal diaktifkan |
| U2 | **247 ditulis tiga kali dan tidak diturunkan (BUG D-162)**: P4G-11, P9-45, `DEFAULT_MAX_HEIGHT_MM` DOCX, `textBlock: 247` HTML. Margin bawah = H − 26 − 247 → −63 mm pada A4 landscape dan A5 | `page.ts:92`; `figure.ts:419-421`; `engine/docx/figures/figure.ts:58`; `engine/html/base/params.ts:70`; `grid.ts:341-352` | Dibalik: `grid.marginBottomMm` = masukan (TA, 24). `textBlockFromPage`: blok = H − atas − bawah. `figureMaxHeightFromBlock`: P9-45 = blok. Fallback mesin dihapus (SR-16/17) |
| U3 | Lebar figur ditulis empat kali: P4G-13 (T), P5-14 (rentang 128-166), P7-20/P9-36 (enum string "128"/"166", bawaan angka 128) | `page.ts:101`; `apparatus.ts:80-83`; `figure.ts:144-147, 379-382` | `figureWidthFromClass`: lebar = kolom teks atau bentang penuh menurut `*.widthClass`. Anggota P4G-13 terjamin |
| U4 | Kolom teks 128 berkelas B dan hanya diturunkan ulang bila bukan A4 potret | `page.ts:66`; `grid.ts:228-243` | `textColumnFromPage` selalu. P4G-17 tetap T (nilai true), tetapi perilakunya dipensiunkan |
| U5 | Margin atas/bawah DOCX diambil dari konstanta BM, bukan grid. `grid.topBottomMarginMm` berlabel "atas dan bawah" padahal dipakai sebagai atas saja (D-33) | `section.ts:26, 38-46`; `page.ts:95-100`; `grid.ts:42-45` | Konsumen SR-16: atas = `mmToTw(grid.topBottomMarginMm)`, bawah = `mmToTw(grid.marginBottomMm)`. Pada A4 hasilnya 1474/1361 = konstanta BM. Label P4G-12 sebaiknya "Margin atas" (SR-05) |
| U6 | `marginTw` dan tab kanan header Manual 000 adalah salinan grid dalam twip: 1474, 1361, 1361, 1134, 9411 | `template.json:959-967, 997-1031` | `sectionSetupFromGrid`. Identitas: mmToTw(26) = 1474, mmToTw(24) = 1361, mmToTw(20) = 1134, mmToTw(166) = 9411 |
| U7 | Tab header/footer R-30 tertanam: 4680/9360 tw (165,1 mm) | `render.ts:201-202` | `headerFooterTabsFromSpan`: pos × bentang/166, identitas bila bentang = 166 |
| U8 | `type.baselinePt` = `type.scale.body.leading` (13,5 = 13,5 di kanonik dan Manual 000) | `color-type.ts:159, 208`; `template.json:817, 842` | `baselineFromBodyLeading` |
| U9 | `normalStyle.szHalfPt/lineTw/color` = 2 × body.size, 20 × body.leading, hex ink700 | `render.ts:64`; `template.json:896-904` | `typeScaleFromBase` + `colorLiterals` (sub-medan) |
| U10 | `render.list.numberMarker.color` "B45309" = literal `color.interior.signal` | `render.ts:154`; `template.json:1064` | `colorLiterals` |
| U11 | Glif tanda provenans (P5-30/32/34/36) diulang di `render.run.symbolGlyphs` (baru) | `apparatus.ts:115-137`; blueprint :38 | N11 wajib superset glif P5. Cek konsistensi di SR-05 |
| U12 | `device.evidenceRail.enabled` (HTML) tumpang tindih dengan `layout.railMode` (DOCX); konflik K-11 | `page.ts:214-217`; `html/base/params.ts:57`; `docx/blocks/env.ts:179-182` | Kenop "Rel bukti" memetakan ke `layout.railMode` saja. P4S-07 tetap L. Paritas HTML membaca mode B (SR-17) |
| U13 | Kunci bayangan dibaca mesin tanpa ParamDef: `grid.marginBottomMm`, `appendix.kicker.pattern` | `grid.ts:44-45`; `structure.ts:55` | Dipromosikan menjadi N5 dan N17 |
| U14 | `cover.leftMarginMm` = inner, `cover.datumRule.widthMm` = bentang penuh | `page.ts:369-372, 406-409` | Tetap T (fungsi lama `coverLeftMargin`, `coverRuleWidth`) |
| U15 | `grid.pageWidthCheck` selalu = lebar halaman setelah U4 | `page.ts:116-119` | Tetap T sebagai cek. `pageWidthIssues` (`tokens/index.ts:50-72`) tetap berguna untuk margin negatif |
| U16 | Fallback `org.entityName` berbeda kapitalisasi di dua tempat mesin | `header-footer.ts:107` ("PT Gemilang Satria Perkasa") vs `pages.ts:175` ("PT GEMILANG SATRIA PERKASA") | Mesin membaca nilai efektif saja (SR-16). Di luar fungsi turunan |
| U17 | `render.table.layout.widthTw: 9412` di template.v2 nanti (D-152) ≠ mmToTw(166) = 9411 | D-152 | Nilai terukur BM. Bila SR-32 menambahkannya, perlakukan sebagai sematan preset Manual 000 (sub-medan diskalakan × bentang/166). Tidak termasuk baseline sha sekarang (KT-15) |

### 6.2 Fungsi turunan bernama (DeriveFnId baru untuk SR-04/SR-60)

Notasi: W, H = ukuran halaman efektif per unit; `in`, `out`, `gut`, `rail`, `top`, `bot` = margin dalam, margin luar, talang, rel, atas, bawah (mm); `ref(k)` = nilai acuan tersimpan (preset atau registri); `r1(x)` = pembulatan 0,1; `r05(x)` = pembulatan 0,5; `round4` sesuai `grid.ts:147`.

| Urutan | DeriveFnId | Target | Rumus | Identitas (kenop bawaan, A4 potret) |
|---|---|---|---|---|
| 1 | `pageSizeFromKnob` | P4G-01 `page.sizeMm` | dasar = PAPER[page.size] (§4.4 AS-59-2) atau `page.customSizeMm` bila custom. portrait → [min, maks], landscape → [maks, min]. Orientasi per unit (cakupan slot) | [210, 297] |
| 2 | `marginsFromDensity` (fase lapis) | P4G-02, P4G-06, P4G-12, N5 | eff = r05(ref × f). f: rapat 0,75, sedang 1, lega 1,25 (KT-1). Bila sedang, eff = ref apa adanya | 24 / 20 / 26 / 24 |
| 3 | `textColumnFromPage` | P4G-03 | round4(W − in − gut − rail − out) | 210 − 24 − 6 − 32 − 20 = 128 |
| 4 | `textBlockFromPage` | P4G-11 | round4(H − top − bot) | 297 − 26 − 24 = 247 |
| 5 | (lama) `fullSpan`, `latticeX` | P4G-07, P4G-09 | tetap (`grid.ts:244-252`) | 166; 10,6667 |
| 6 | `typeScaleFromBase` (fase lapis) | 24 kunci TA tipografi; sub-medan R-07 `szHalfPt`, `lineTw`, R-20/R-21/R-37 `szHalfPt` | k = type.baseSizePt / refBase (refBase = nilai preset untuk `type.baseSizePt`, bawaan 9,5). eff = r1(ref × k); half-point = round(ref × k). Bila k = 1, eff = ref apa adanya. normalStyle: szHalfPt = round(2 × eff body.size), lineTw = round(20 × eff body.leading) | 9,5 / 13,5; 19 / 270 |
| 7 | `baselineFromBodyLeading` | P4T-17 | = eff `type.scale.body.leading` | 13,5 |
| 8 | (lama) `latticeY`, `allowedFigureWidths` | P4G-10, P4G-13 | tetap | 4,7625; [128, 166] |
| 9 | `figureWidthFromClass` | P5-14, P7-20, P9-36 | `widthClass` = text → P4G-03; full → P4G-07 | 128 / 128 / 128 (Manual 000 tabel: full → 166) |
| 10 | `figureMaxHeightFromBlock` | P9-45 | = P4G-11 | 247 |
| 11 | (lama) `pageWidthCheck`, `railMode`, `railColsTw` | P4G-15, P4G-16, R-13 | tetap | 210; Manual 000 [7257, 340, 1814] |
| 12 | `sectionSetupFromGrid` | sub-medan R-09/R-10 (§5.4) | pageSizeTw = [mmToTw(W), mmToTw(H)]. marginTw: top = mmToTw(top), bottom = mmToTw(bot), left = mmToTw(in), right = mmToTw(out); header/footer/gutter tidak disentuh. Tab kanan header = mmToTw(P4G-07). Sub-medan yang tidak ada TIDAK ditambahkan | [11906, 16838]; 1474/1361/1361/1134; 9411 |
| 13 | `headerFooterTabsFromSpan` | sub-medan R-30 | posTw' = round(posTw × P4G-07 / 166); identitas bila P4G-07 = 166 | 4680 / 9360 |
| 14 | `colorLiterals` | R-21.color ← hex `signal`; R-07.color ← hex peran `color.role.body` | salin hex token | "B45309"; "2B3640" |
| 15 | (lama, sisa urutan `grid.ts:104-141`) | | tetap. `rederiveNonA4` dipensiunkan: target P4G-17 tetap true tanpa efek samping | |

Pembalikan bug 247: tinggi blok sesudah dan margin bawah pada kerapatan sedang (bawah selalu 24 mm, tidak pernah negatif):

| Kertas | Potret: kolom teks / bentang / blok (mm) | Lanskap: kolom teks / bentang / blok (mm) | Lama (lanskap): margin bawah |
|---|---|---|---|
| A4 | 128 / 166 / 247 | 215 / 253 / 160 | −63 |
| A3 | 215 / 253 / 370 | 338 / 376 / 247 | |
| A5 | 66 / 104 / 160 | 128 / 166 / 98 | A5 potret lama −63 |
| Letter | 133,9 / 171,9 / 229,4 | 197,4 / 235,4 / 165,9 | |
| Legal | 133,9 / 171,9 / 305,6 | 273,6 / 311,6 / 165,9 | |
| F4 (hipotesis) | 133 / 171 / 280 | 248 / 286 / 165 | |

Pada kerapatan lega (30/25/32,5/30), A5 potret menjadi kolom 55 mm dan blok 147,5 mm. Masih positif, tetapi sempit (R6).

Twip (`mmToTw`), semuanya di dalam rentang sectPr [1440, 31680] (`section.ts:110-111`):

| Kertas | pageSizeTw |
|---|---|
| A3 | 16838 × 23811 |
| A5 | 8391 × 11906 |
| Letter | 12240 × 15840 |
| Legal | 12240 × 20160 |
| F4 | 12189 × 18709 |

Syarat idempotensi (R2): `deriveAll` diklaim idempoten (`grid.ts:370-374`) dan dipanggil ulang oleh `computeDerivedWith` (`tokens/index.ts:93-95`). Fungsi berskala-acuan (2, 6, dan sub-medan 6/13) TIDAK idempoten bila kenop ≠ bawaan, karena keluaran yang diskalakan akan diskalakan lagi. SR-60 wajib menjalankannya sekali pada fase resolusi lapis (`resolveParamsWith`), bukan di `computeDerivedWith`. Uji wajib: resolve → computeDerivedWith → nilai TA tidak berubah, untuk k ≠ 1 dan kerapatan ≠ sedang.

## 7. Kenop esensial final (28 kenop, 21 kunci)

Jenis pemetaan:
- **langsung**: nilai kenop = nilai kunci.
- **peta-nilai**: label pilihan dipetakan ke nilai kunci.
- **anggota**: bool menyisipkan atau membuang satu unsur dari daftar kunci. Urutan mengikuti daftar preset; unsur baru disisipkan pada posisi `COVER_ORDER` (`page.ts:338-351`).
- **turunan**: kunci baru yang dibaca fungsi §6.2.

Bawaan ditulis sebagai Kanonik / GSP DATUM / Manual 000.

### 7.1 Global dokumen (8)

| # | Label | Bantuan singkat | Kunci | Tipe / pilihan | Bawaan K / G / M | Pemetaan | Kelas | Bukti pembaca |
|---|---|---|---|---|---|---|---|---|
| G1 | Ukuran kertas | Ukuran halaman untuk semua keluaran | `page.size` (N1) | A4, A3, A5, Letter, Legal, F4 | A4 / A4 / A4 | turunan `pageSizeFromKnob` → rantai §6.2 | B | D-158; konsumen `section.ts:74`, `grid.ts` |
| G2 | Orientasi | Tegak atau mendatar; dapat diubah per bagian | `page.orientation` (N2) | Tegak, Mendatar | Tegak ×3 | turunan `pageSizeFromKnob` | B | D-158 |
| G3 | Kerapatan margin | Seberapa lega tepi halaman | `grid.marginDensity` (N4) | Rapat, Sedang, Lega | Sedang ×3 | turunan `marginsFromDensity` | B | `section.ts:38-46` (setelah SR-16 membaca atas/bawah) |
| G4 | Warna aksen | Satu warna penekanan (label bab, sorotan chart) | `color.interior.signal` | warna hex | B45309 ×3 | langsung; token `signal` dirujuk P4C-31, P7-07, P4T-S02-colour, P4R-14, P9 accent; + `colorLiterals` | B | `color-type.ts:77`; `chart/core/palette.ts:79-106` |
| G5 | Ukuran huruf dasar | Ukuran teks badan; ukuran lain ikut menyesuaikan | `type.baseSizePt` (N6) | 8-12 pt, langkah 0,5 | 9,5 ×3 | turunan `typeScaleFromBase`, `baselineFromBodyLeading` | B | `engine/tokens/roles.ts` (peran dari skala) |
| G6 | Bahasa | Bahasa label otomatis (Bab, Lampiran, Daftar Isi) | `doc.language` | Indonesia (ID), Inggris (EN) | ID ×3 | langsung, lewat compose ke meta | B | `governance-language.ts:123`; `pages.ts:95-107, 152` (b.lang) |
| G7 | Klasifikasi bawaan | Tingkat kerahasiaan yang tercetak | `classification.level` | Biasa, Terbatas, Rahasia, Sangat Rahasia | Terbatas ×3 | langsung, lewat compose ke meta; hanya ADMIN | K | `apparatus.ts:264`; `grid.ts:56, 325` |
| G8 | Rel bukti | Kolom catatan bukti di sisi halaman | `layout.railMode` | Otomatis (auto), Aktif (A), Mati (B) | Otomatis / Aktif / Aktif | peta-nilai | B | `docx/blocks/env.ts:179-182`; `html/blocks/semantic.ts:104` |

### 7.2 Per jenis slot

| Slot (sectionType) | # | Label | Kunci | Tipe / pilihan | Bawaan K / G / M | Pemetaan | Bukti pembaca |
|---|---|---|---|---|---|---|---|
| Sampul (`cover`), 7 | C1 | Tampilkan logo | `cover.elementOrder` ∋ "logo" | ya/tidak | ya ×3 | anggota | `pages.ts:184-212` (iterasi daftar, unsur yang dibuang tidak dirender) |
| | C2 | Tampilkan paragraf pengantar (standfirst) | ∋ "standfirst" | ya/tidak | ya ×3 | anggota | `pages.ts:236-238` |
| | C3 | Tampilkan baris cakupan | ∋ "baris cakupan" | ya/tidak | ya ×3 | anggota | `pages.ts:239-243` |
| | C4 | Tampilkan blok kendali (nomor, revisi, penyusun) | ∋ "blok kendali" | ya/tidak | ya ×3 | anggota | `pages.ts:244-248` |
| | C5 | Tampilkan pita segel | `device.sealBand.enabled` | ya/tidak | ya ×3 | langsung | `pages.ts:83-85, 207` |
| | C6 | Tampilkan string punggung | `device.spine.enabled` | ya/tidak | ya ×3 | langsung | `pages.ts:91-93, 255` |
| | C7 | Teks jenis dokumen | `cover.kicker.text` | teks; kosong = tidak tampil | "" ×3 | langsung (v2: meta hanya `title`, jadi jenis dokumen milik templat) | `pages.ts:226-229` |
| Lembar kendali (`controlSheet`), 1 | K1 | Tampilkan pita segel | `device.sealBand.enabled` | ya/tidak | ya ×3 | langsung (override slot) | `pages.ts:299` |
| Tanda tangan (`signatureBlock`), 1 | S1 | Letak tanda tangan | `slot.placement` (N7) | Di lembar kendali, Halaman tersendiri | Di lembar kendali ×3 | peta-nilai | `pages.ts:292-331` (`controlSheetIncludesSignature`); blueprint :315 |
| Daftar isi (`toc`), 2 | T1 | Nomor halaman daftar isi | `render.toc.mode` | Medan Word (nomor diperbarui saat dibuka) = field; Tabel statis tanpa nomor = static | field / static / static | peta-nilai lewat compose ke TocSpec.mode | `pages.ts:409-427` (KT-11) |
| | T2 | Tampilkan pita segel | `device.sealBand.enabled` | ya/tidak | ya ×3 | langsung | `pages.ts:416` |
| Konten (`chapter`), 5 | H1 | Label nomor bab | `chapter.kicker.pattern` | teks wajib memuat `{n}`; pilihan cepat "BAB {n}", "Bab {n}" | "BAB {n}" ×3 | langsung | `structure.ts:49-63` |
| | H2 | Garis Datum di atas judul bab | `device.datumRule.enabled` | ya/tidak | ya ×3 | langsung (override slot) | `structure.ts:65-70` |
| | H3 | Lebar tabel | `table.widthClass` (N14) | Selebar kolom teks, Bentang penuh | teks / penuh / penuh | turunan `figureWidthFromClass` → P5-14 | `docx/tables/render.ts:159` |
| | H4 | Lebar chart | `chart.widthClass` (N15) | sama | teks ×3 | turunan → P7-20 | compose v2 (§0 :36); Grep engine 0 pembaca hari ini (KT-8) |
| | H5 | Lebar diagram | `diagram.widthClass` (N16) | sama | teks ×3 | turunan → P9-36 | sama (KT-8) |
| Referensi (`sourceRegister`), 1 | R1 | Kolom daftar sumber | `sourceRegister.columns` (cakupan dipindah, §4.3) | subset urut dari DOKUMEN, VERSI/TANGGAL, BAHASA/HALAMAN, KLASIFIKASI, DIPAKAI DI | 5 kolom ×3 | langsung | `docx/tables/presets.ts:9, 50` |
| Lampiran (`appendix`), 3 | A1 | Label nomor lampiran | `appendix.kicker.pattern` (N17) | teks memuat `{n}`; kosong = ikut label bab ("LAMPIRAN {n}") | kosong ×3 | langsung | `structure.ts:54-60` |
| | A2 | Orientasi halaman lampiran | `page.orientation` | Tegak, Mendatar | Tegak ×3 | turunan `pageSizeFromKnob` per unit | D-158 |
| | A3 | Garis Datum di atas judul lampiran | `device.datumRule.enabled` | ya/tidak | ya ×3 | langsung (override slot) | `structure.ts:65-70` |

Jumlah per kelompok:

| Kelompok | Jumlah kenop |
|---|---|
| Global | 8 |
| Sampul | 7 |
| Lembar kendali | 1 |
| Tanda tangan | 1 |
| Daftar isi | 2 |
| Konten | 5 |
| Referensi | 1 |
| Lampiran | 3 |
| **Total** | **28** (≤ 60; setiap kelompok ≤ 8) |

21 kunci berlapis E:
- 12 kunci lama: P3-23, PD-01, P4C-14, P4G-16, P4S-01, P4S-15, P4S-20, P4V-03, P4V-08, P4A-04, P6-02, R-22.
- 9 kunci baru: N1, N2, N4, N6, N7, N14, N15, N16, N17.

### 7.3 Kenop usulan blueprint yang gugur (21 dari 36; AS-8)

| Kelompok | Kenop gugur | Alasan + bukti |
|---|---|---|
| Global | Logo organisasi | Bukan ParamDef. Logo adalah aset templat (`assets`). Tetap tampil sebagai medan aset di tab Gaya (UX W3 :338 perlu disesuaikan, KT-12) |
| Lembar kendali (4) | Tampilkan rantai verifikasi, distribusi, pernyataan metode; judul halaman | Blok tampil hanya bila konten mengirimnya (`pages.ts:304-307`). Label adalah konstanta (`pages.ts:96-100`). `controlSheet.*` P4K tidak dibaca mesin (Grep engine: 0). Kandidat v2.2: kunci daftar-blok yang dibaca compose |
| Tanda tangan (3) | Tata letak baris/kotak, baris tanggal, jumlah kolom | Tidak ada kunci. Peran dan kolom berasal dari konten (`pages.ts:501-507`) |
| Daftar isi (3) | Judul, kedalaman, tampilkan bagian | Judul = konstanta `pages.ts:101`; kedalaman = `\o "1-2"` tertanam `pages.ts:389`; bagian selalu ikut `pages.ts:350-353` |
| Konten (5) | Bab mulai halaman baru; kepala halaman berjalan aktif | Kunci terkait (`render.section.breakPerUnit`, `render.section.interior.header.mode`) bercakupan document, sehingga tidak dapat ditimpa per slot. Hidup kembali bila SR-01 mendefinisikan medan di `slot.setup` (KT-10) |
| | Tampilkan kicker bab | Pola tanpa `{n}` jatuh ke "BAB {n}" (`structure.ts:52`), jadi tidak bisa disembunyikan. Diganti kenop H1 "Label nomor bab" |
| | Posisi caption | P4A-06 K enum ["above"] saja (`page.ts:521-523`); 0 pembaca mesin |
| | Tampilkan baris SUMBER | P5-22 K, lint saja |
| Referensi (3) | Judul, urutan, URL | Tidak ada kunci; PD-01 tanpa kolom URL. Diganti R1 "Kolom daftar sumber" |
| Lampiran (2) | Mulai halaman baru | Sama dengan konten (KT-10) |
| | Judul pembuka | Diganti A1 "Label nomor lampiran" |

Neraca: 36 usulan − 21 gugur = 15 tetap. Ditambah 13 kenop baru yang sah (Orientasi, C4, C7, K1, T2, H1, H3-H5, R1, A1-A3), sehingga final = 28.

## 8. Tiga preset

### 8.1 Isi preset (nilai yang menyimpang dari bawaan registri/turunan)

Sumber: override `benchmark/manual000/template.json:805-1107` (87 kunci). Pembagian:

| Kelompok override | n | Rincian |
|---|---|---|
| Sama dengan bawaan atau turunan; dibuang tanpa mengubah nilai efektif | 45 | `page.sizeMm`; 6 kunci grid; `type.baselinePt`; 12 warna; 4 wajah; 9 skala; `type.body.align`; 4 `render.docx.*`; `breakPerUnit`; `table.sourcePlacement`; `table.layout`; `spacer.autoMode`; `cover.mode`; `html.paged`; `png.dpi` |
| Berinformasi | 42 | Rincian di bawah |

| Kunci | Lapis | Kanonik | GSP DATUM | DATUM Manual 000 |
|---|---|---|---|---|
| **Kenop esensial (nilai preset)** | | | | |
| `layout.railMode` | E | auto | A | A |
| `render.toc.mode` | E | field | static | static |
| `table.widthClass` (menggantikan override P5-14 = 166) | E | text | full | full |
| **Lanjutan (15)** | | | | |
| `type.face.condensed` | L | (bawaan) | "IBM Plex Sans Cond" | sama |
| `type.scale.chapterKicker.trackEm` | L | | 0,2154 | sama |
| `type.scale.tableHeader.trackEm` | L | | 0,0923 | sama |
| `cover.title.sizePt` | L | | 25 | sama |
| `device.spine.rotationDeg` | L | | 0 | sama |
| `device.spine.placements` | L | | ["margin luar sampul"] | sama |
| `device.sealBand.heightMm` | L | | 6,1736 | sama |
| `rules.asideTopMm` | L | | 0,44 | sama |
| `table.numeral.align` | L | | "right" | sama |
| `table.zebra.minRows` | L | | 1000 | sama |
| `render.caption.separator` | L | | "   " | sama |
| `render.list.bulletMarker` | L | | objek `template.json:1053-1060` | sama |
| `render.list.numberMarker` | L | | objek `:1061-1067` | sama |
| `render.run.strong` | L | | {color: "101418"} | sama |
| `org.entityName` | L | | "PT Gemilang Satria Perkasa" | sama |
| **Sematan T-acuan (14)** | | | | |
| `type.scale.chapterKicker.size` | TA | (6,8) | 6,5 | sama |
| `type.scale.tableBody.size` | TA | (8,2) | 8 | sama |
| `type.scale.tableBody.leading` | TA | (11,5) | 11 | sama |
| `type.scale.tableNumerals.size` | TA | (7,8) | 7 | sama |
| `type.scale.tableHeader.size` | TA | (6,8) | 6,5 | sama |
| `type.scale.caption.size` | TA | (7,6) | 7,5 | sama |
| `type.scale.sourceLine.size` | TA | (6,6) | 6,5 | sama |
| `type.scale.evidenceRail.size` | TA | (5,9) | 5,5 | sama |
| `type.scale.runningHead.size` | TA | (6,8) | 6,5 | sama |
| `type.scale.registerBlock.size` | TA | (6,2) | 6 | sama |
| `type.scale.derivation.size` | TA | (7,4) | 7 | sama |
| `type.scale.derivation.leading` | TA | (11,5) | 11 | sama |
| `type.scale.groupBand.size` | TA | (7,4) | 7 | sama |
| `type.scale.asideBody.size` | TA | (8,6) | 8,5 | sama |
| **Internal (GSP 9, M000 10)** | | | | |
| `render.docx.compatibilityMode` | I | | 14 | sama |
| `render.docx.updateFieldsOnOpen` | I | | false | sama |
| `render.docx.docDefaults` | I | | objek `:881-895` (bawaan Word terukur) | sama |
| `render.docx.embedFonts` | I | | objek `:905-953` | sama |
| `render.section.wrapper` | I | | objek `:954-991` (sub-medan sesuai turunan, §6.2 butir 12) | sama |
| `render.section.interior` | I | | objek `:992-1037` | sama |
| `render.rail.renderer` | I | | "table3col" | sama |
| `render.derivation.renderer` | I | | "nestedTable" | sama |
| `render.run.symbolGlyphByRole` | I | | objek `:1076-1107` | sama |
| `lint.enforcementOverride` | I | - | dibuang (`seed-studio.ts:98`) | {DATUM-09, DATUM-04, G3: "release"} (terbatas, ADMIN) |
| **Delta yang disahkan** | | | | |
| `device.registerBlock.boldFields` (P4S-13) | L | ["nomor dokumen", "nomor lembar"] (bawaan) | ["nomor dokumen", "revisi", "nomor lembar", "jumlah lembar", "klasifikasi"] (BM, D-151) | sama |
| **Kunci baru** | | | | |
| `symbol.sheet.fit` | L | false | false (D-147 tersurat; KT-7) | **true** (D-147) |
| `type.baseSizePt` | E | 9,5 | 9,5 (refBase) | 9,5 |
| kunci baru lain | | bawaan §4.3 | sama | sama |

Catatan nilai BM P4S-13: sel BM menebalkan nomor dokumen, huruf revisi, PAGE, NUMPAGES, dan klasifikasi, tetapi tidak `{org}` dan `{tanggal}` (`delegation_progress/coder_execution_rq6.md:10, 17, 26`). Enum P4S-13 sekarang hanya {nomor dokumen, nomor lembar} (`page.ts:250-260`), dan alias HTML tidak mengenal `{N}` (`markup.ts:104-114`). Karena itu, sebelum SR-36:
- SR-05 wajib memperluas enum P4S-13 menjadi {nomor dokumen, revisi, tanggal, nomor lembar, jumlah lembar, klasifikasi, organisasi};
- IP-44 wajib menambah alias "jumlah lembar" → N.

roleFormats (70 peran, `template.json:1109+`) ikut ke preset GSP DATUM dan Manual 000 apa adanya. roleFormats bukan parameter dan tidak masuk `paramsSha256`.

Hitungan override templat sesudah migrasi (blueprint :320): lanjutan tingkat templat = 0 untuk ketiga templat. Seluruh nilai pindah ke preset; templat hanya memuat `baseVersionId` preset, nilai esensial yang dibaca dari preset, dan kerangka.

### 8.2 Penjaga nilai efektif dan cara SR-36 membuktikannya

Temuan pengikat (F1): `paramsSha256` dihitung dari `resolvedParams` yang memuat seluruh kunci registri (`profile.ts:580-584`, `merge.ts:155`). Begitu 17 kunci baru masuk registri, sha PENUH setiap templat pasti berubah. Penjaga yang dapat dibuktikan adalah sha terproyeksi ke himpunan kunci lama.

Definisi:
- `LEGACY(v)` = `Object.keys(v.resolvedParams)` versi baseline. Diharapkan 723 = 722 + `grid.marginBottomMm` bayangan; SR-36 membaca dari DB, tidak mengasumsikan.
- `Δ` (kunci yang boleh berbeda, disahkan keputusan):
  - Kanonik: Δ = ∅.
  - GSP DATUM dan Manual 000: Δ = {`device.registerBlock.boldFields`} (D-151).
  - Bila IP-44 mengubah bawaan P4S-11 ke `{org} · {nomor}` sebelum SR-36, tambahkan `device.registerBlock.cells` ke Δ untuk ketiganya. Render tetap sama karena pola lama dibaca `{org}` (`markup.ts:120-139`; RQ-6).
- `proj(P, S)` = `sha256Hex(stableStringify(pick(P, S)))`. `stableStringify` mengurutkan kunci (`ingest/util.ts:27`), sehingga untuk Δ = ∅, `proj(baseline.resolvedParams, LEGACY)` = `paramsSha256` tersimpan, byte demi byte.

Langkah bukti SR-36 (penulis DB tunggal):
1. **Baseline (sebelum seed registri baru):**
   - Untuk `datum-kanonik`, `datum-gsp`, `datum-manual-000`, baca versi terbaru: `versionNo`, `paramsSha256`, `resolvedParams`.
   - Hitung ulang `sha256(stableStringify(resolvedParams))` dan pastikan sama dengan `paramsSha256` tersimpan (cek integritas yang sama dengan `services/templates/index.ts:387-393`).
   - Simpan JSON baseline beserta sha berkasnya di `<task>/test/` (atau `delegation_progress`).
   - Putuskan dulu KT-5: apakah template.json pasca-RT-01 diimpor sebelum baseline.
2. **Migrasi:** buat preset sesuai §8.1, lalu versi templat baru dengan `baseVersionId` preset + esensial + kerangka.
3. **Resolusi baru:** `resolveTemplate(slug)` dengan registri baru dan kenop pada nilai preset menghasilkan `P'`.
4. **Bandingkan:**
   - Kanonik: `proj(P', LEGACY) == baseline.paramsSha256`.
   - GSP DATUM dan Manual 000: `proj(P', LEGACY \ Δ) == proj(baseline, LEGACY \ Δ)`, dan nilai Δ lama → baru dicetak.
   - Juga cetak daftar kunci yang berbeda di luar Δ; targetnya kosong.
5. **Laporan tabel:** slug, versi lama, sha lama, sha terproyeksi baru, sama?, Δ, sha penuh baru (berbeda, diharapkan), jumlah override lanjutan templat (target 0). Exit ≠ 0 bila ada ketidakcocokan.
6. Jalankan dulu pada `_uji` dalam transaksi yang di-rollback, baru pada v21.

SR-60 (asap "paramsSha256 sama dengan datum-gsp terbaru", blueprint :727) wajib memakai proyeksi yang sama. Sha penuh tidak dapat sama.

Uji identitas tambahan untuk SR-60 (tanpa DB): pada registri baru dengan kenop bawaan, `deriveAll` atas override template.json menghasilkan:
- R-09/R-10 `pageSizeTw` [11906, 16838] dan `marginTw` 1474/1361/1361/1134;
- tab header interior 9411;
- R-13 [7257, 340, 1814];
- P4G-11 = P9-45 = 247; P5-14 = 166.

## 9. Key Findings

| # | Temuan | Confidence | Bukti | Implikasi |
|---|---|---|---|---|
| F1 | Sha penuh berubah untuk setiap kunci baru, karena `resolvedParams` = semua kunci registri. Proyeksi ke kunci lama mereproduksi sha tersimpan tepat | HIGH | `profile.ts:580-584`; `merge.ts:38-42, 155`; `ingest/util.ts:27` | Penjaga §8.2 wajib terproyeksi; blueprint :320 dan SR-60 :727 dibaca sebagai sha terproyeksi |
| F2 | Bug 247 diselesaikan dengan pembalikan masukan: margin bawah menjadi masukan, tinggi blok menjadi turunan. Identitas A4 tepat (297 − 26 − 24 = 247) | HIGH | `grid.ts:341-352`; `page.ts:92`; D-162 | §6.2 butir 4 dan 10; semua 12 kombinasi kertas × orientasi positif |
| F3 | Margin atas/bawah DOCX datang dari konstanta BM, bukan grid | HIGH | `section.ts:26, 38-46` | Kenop kerapatan dan kertas baru berefek di DOCX setelah SR-16 membaca P4G-12 dan N5 |
| F4 | 45 dari 87 override Manual 000 = bawaan atau turunan; 42 berinformasi (15 L, 14 TA, 10 I, 2 E, 1 diganti `widthClass`) | HIGH | `template.json:805-1107` vs modul params | Preset ringkas; lanjutan tingkat templat 0 |
| F5 | 21 dari 36 kenop usulan tidak punya pemetaan sah | HIGH | §7.3 | Final 28 kenop, semuanya terpetakan |
| F6 | Fungsi berskala-acuan tidak idempoten bila dijalankan ulang | HIGH | `grid.ts:370-374`; `tokens/index.ts:93-95` | SR-60 menjalankannya di fase lapis saja + uji idempotensi |
| F7 | Dua kunci bayangan dibaca mesin tanpa ParamDef | HIGH | `grid.ts:44-45`; `structure.ts:55` | Dipromosikan N5, N17 |
| F8 | Enum P4S-13 tidak dapat menyatakan nilai BM; alias HTML tanpa `{N}` | HIGH | `page.ts:250-260`; `markup.ts:104-114`; RQ-6 | Perluasan enum (SR-05) + alias (IP-44) sebelum SR-36 |
| F9 | `chart.output.widthMm`/`diagram.widthMm` tidak dibaca mesin hari ini | MEDIUM | Grep engine 0 hasil | H4/H5 sah hanya bila compose v2 mengisi lebar figur dari turunan (§0 :36) |
| F10 | Mode TOC hari ini berasal dari spec konten. Mode statis tanpa entri tidak punya nomor halaman | HIGH | `pages.ts:409-427` | Compose memetakan R-22. Preset GSP/M000 "static" di slot AUTO menghasilkan TOC tanpa nomor (KT-11) |
| F11 | Fallback 247/A4 tertanam di DOCX dan HTML | HIGH | `figure.ts:58`; `html/base/params.ts:70`; `section.ts:25, 74` | SR-16/SR-17 membaca nilai efektif |

## 10. Files/Modules Involved (konsumen dokumen ini)

| Baris | Berkas | Yang diambil dari dokumen ini |
|---|---|---|
| SR-04 | `contract/types/params.ts` | 11 DeriveFnId baru (§6.2), medan `surface` |
| SR-05 | `params/structure.ts`, `params/index.ts`, `registry/essentials.ts` | §4.3, §5.2, §5.3, §7; perluasan enum P4S-13; perubahan kelas; pindah cakupan PD-01; label P4G-12 |
| SR-60 | `engine/tokens/grid.ts`, `engine/tokens/index.ts` | §6.2 + syarat idempotensi |
| SR-16/SR-17 | `engine/docx/package/section.ts`, `engine/docx/figures/figure.ts`, `engine/html/base/params.ts` | Hapus fallback A4/247; baca atas/bawah dari grid |
| SR-36/SR-38 | `prisma/seed-studio.ts` | §8 |
| UX-01/SR-28 | `masterplan/04_studio_ux_spec.md` W3 | Label §7; Logo dipindah ke medan aset |

## 11. Implementation Order

1. SR-01 menyelaraskan nama kunci §4.3 dan memutuskan KT-4 serta KT-10.
2. SR-04 menambahkan DeriveFnId dan medan `surface`.
3. SR-05 mentranskripsi lapis/kenop, perubahan kelas, enum P4S-13, dan cakupan baru; lalu memperbarui fixture hitungan research/08.
4. SR-60 mengerjakan turunan, uji identitas A4, dan uji idempotensi.
5. SR-16/SR-17 mengalihkan konsumen ke nilai efektif.
6. SR-36: baseline → preset → bukti sha terproyeksi; lalu SR-38.

Plan draft (`masterplan/02_plan_draft.md`) DILEWATI: baris riset tanpa perubahan kode. Rencana pelaksanaan sudah ada di blueprint (SR-04/05/60/16/17/36).

## 12. Risks

| # | Risiko | Mitigasi |
|---|---|---|
| R1 | Sha penuh berbeda dianggap kegagalan penjaga | §8.2 mendefinisikan sha terproyeksi; laporan memuat keduanya |
| R2 | Skala ganda nilai TA lewat `computeDerivedWith` | Fase lapis + uji §6.2 |
| R3 | Baseline basi: versi DB belum memuat template.json pasca-RT-01 (D-149) | KT-5 diputus controller sebelum SR-36 |
| R4 | Perluasan enum P4S-13 belum mendarat, sehingga validasi preset gagal | Urutan §11; SR-36 bergantung SR-05 |
| R5 | Kenop lebar chart/diagram tanpa efek bila compose tidak membacanya | Uji SR-08/SR-51: figur v2 berlebar = turunan |
| R6 | A5 potret dengan rel 32 mm memberi kolom 66 mm (lega: 55 mm) | Lint lebar baris (P4T-X13); rekomendasi rel "Otomatis" pada A5 |
| R7 | Lebar figur BM beragam per figur, sementara kelas lebar per jenis tidak cukup untuk paritas BM | SR-32/SR-01 (KT-8) |
| R8 | Nama kunci baru berbeda dari register SR-01 | Ganti label saja; pemetaan tidak berubah |

## 13. Acceptance Criteria

- AC1: 739 kunci, masing-masing tepat satu lapis. E 21 / L 317 / T 72 / I 329; per berkas sesuai §5.2. PASS (hitung manual tiga arah).
- AC2: Esensial ≤ 8 per kelompok dan total 28 ≤ 60. Global memuat Ukuran kertas (G1) dan Orientasi (G2). PASS.
- AC3: Setiap kenop punya jenis pemetaan + kunci atau DeriveFnId + bukti pembaca; 21 kenop gugur tercatat beralasan. PASS (H4/H5 MEDIUM, KT-8).
- AC4: Turunan bernama untuk 247 (`textBlockFromPage`, `figureMaxHeightFromBlock`) dan lebar figur (`figureWidthFromClass`). Identitas A4 dihitung. PASS.
- AC5: Isi 3 preset mencakup P4S-13 BM dan `symbol.sheet.fit` (M000 true). Prosedur bukti sha untuk SR-36 tersedia. PASS. Bukti eksekusi = SR-36.
- AC6 (untuk SR-60): margin bawah > 0 dan blok > 0 untuk 6 kertas × 2 orientasi × 3 kerapatan; uji idempotensi lolos.

## 14. Recommendations dan keputusan terbuka

| KT | Keputusan terbuka | Usulan | Pemutus |
|---|---|---|---|
| KT-1 | Faktor kerapatan 0,75 / 1 / 1,25 | Terima; sedang = identitas | Controller / user |
| KT-2 | Dimensi F4 (215×330 vs 210×330) | 215×330 (HIPOTESIS) | User |
| KT-3 | `page.size = custom` + `page.customSizeMm` (K) | Terima | SR-01 |
| KT-4 | Semantik T-acuan dan kode galat tulis di luar preset | 400 `PARAM_CLASS_T_READONLY` | SR-01 |
| KT-5 | Baseline sha: versi DB terbaru apa adanya vs impor template.json pasca-RT-01 dulu | Impor dulu dengan kode lama, lalu ambil baseline | Controller |
| KT-6 | Perluasan enum P4S-13 + alias `{N}` | SR-05 + IP-44 sebelum SR-36 | Controller |
| KT-7 | `symbol.sheet.fit` untuk GSP DATUM | false (huruf D-147). Pertimbangkan true demi kesamaan visual | User |
| KT-8 | Kenop lebar chart/diagram bergantung compose; lebar BM beragam per figur | Pertahankan; SR-32/SR-01 memutus paritas BM | SR-01 / SR-32 |
| KT-9 | PD-01 pindah ke `section:sourceRegister` | Terima (research/08 A3) | SR-05 |
| KT-10 | "Mulai halaman baru" dan "kepala halaman berjalan" per slot | Hidupkan bila `slot.setup` punya medan itu | SR-01 |
| KT-11 | TOC statis di slot AUTO tanpa nomor halaman (preset GSP/M000) | SR-32 memutus: field untuk GSP DATUM, atau entri statis dari mesin | SR-32 |
| KT-12 | Logo organisasi di UX W3 sebagai kenop | Pindahkan ke medan aset | UX-01 |
| KT-13 | Nama kunci baru vs register SR-01 | Selaraskan saat SR-01 terbit | SR-01 |
| KT-14 | `artifact.tier` sebagai medan dialog Buat (UX W2 :312), di luar 8 kenop | Biarkan L; dialog menulisnya | UX-01 |
| KT-15 | `render.table.layout.widthTw` 9412 (terukur) di template.v2 | Sematan M000 berskala; bukan bagian baseline | SR-32 |
