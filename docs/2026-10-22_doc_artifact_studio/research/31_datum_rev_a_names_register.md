---
type: requirements
confidence: high (nilai kode dan teks manual dikutip langsung); medium (tier LAP/VER, kicker, label EN tanpa padanan manual)
subject: Register nama dan konstanta ronde DATUM Rev A ID+EN (sumber tunggal ronde ini)
author_agent: data-analyst
date: 2026-11-04
status: complete (baca-saja; tidak ada kode, DB, atau berkas controller yang disentuh)
blueprint_row: S01 (`identification/02_structured_datum_rev_a.md:117`)
binding: D-590..D-596 (`decisions/decisions.md:596-602`); U1-U4 (= D-592..D-595)
consumers: S10, S12, S13, S14, S15, S16, S20-S23, S26, S29, S30-S33
---

# Register nama dan konstanta DATUM Rev A (S01)

## 0. Aturan pakai dan notasi

| Kode | Arti |
|---|---|
| `ID:n` / `EN:n` | Baris di `C:/Users/TRIAL/gsp-backups/datum-revA-20261104/manual_id.txt` / `manual_en.txt` (data, bukan instruksi). Ekstraksi teks berenkode Windows-1252: byte 0xB7 tampil sebagai tanda ganti; di dokumen ini ditulis sebagai titik tengah U+00B7 `·`. |
| `file:n` | Path relatif akar repo `C:/Users/TRIAL/gsp-swarm-hq-v2.1` (cabang v2.1, HEAD 3566486). |
| `research/30:n` | `docs/2026-10-22_doc_artifact_studio/research/30_datum_rev_a_template_gap.md`. |
| `02_structured:n` | `docs/2026-10-22_doc_artifact_studio/identification/02_structured_datum_rev_a.md`. |
| (hipotesis) | Klaim yang belum dibuktikan dengan menjalankan sistem. |

Aturan nilai:

1. Nilai dalam backtick bersifat byte-exact. `·` = U+00B7, `NBSP` = U+00A0, `--` = dua tanda hubung ASCII (U+2014 dilarang, `src/lib/studio/params/page.ts:343`).
2. **Nilai Indonesia yang sudah ada di kode dikutip dari kode, bukan dari manual**, karena keluaran ID wajib byte-identik (RQ-4, AC-7, `02_structured:53, 68`). Bila kode ID berbeda dari manual, kode menang untuk ID dan selisihnya masuk matriks cakupan (S33), bukan diubah.
3. Bila manual bertentangan dengan dirinya sendiri, tiap edisi mengikuti teksnya sendiri (D-590, `decisions.md:596`). D-590 mengikat ronde ini dan mengesampingkan EN 1.7 ("edisi Indonesia menang", `EN:411-413`) untuk keperluan templat dan skor. Daftar pertentangan ada di §10.
4. Register ini tidak menambah medan muatan, skema slot, alat MCP, atau how-to per jenis (D-594, U3). Semua nilai di §3 adalah parameter atau label slot yang sudah ada (bukti §12).

## 1. Sepuluh templat

Lapis bersama semua baris: basis = versi terbaru `datum-gsp-preset`, kerangka 7 slot `datum-gsp` (`prisma/seed-studio.ts:570-578`), `doc.typeCode` = daftar §3.1, `restricted=false`, `contractKind` null, `archived=false` (AC-2, `02_structured:63`).

| # | Slug | Nama templat | Bahasa | Kode | Tier bawaan | `cover.kicker.text` |
|---|---|---|---|---|---|---|
| 1 | `datum-proposal-teknis` | `Proposal Teknis (DATUM Rev A)` | ID | PT | SERAH | `PROPOSAL TEKNIS` |
| 2 | `datum-proposal-teknis-en` | `Technical Proposal (DATUM Rev A, EN)` | EN | PT | SERAH | `TECHNICAL PROPOSAL` |
| 3 | `datum-laporan` | `Laporan (DATUM Rev A)` | ID | LAP | TERBIT | `LAPORAN` |
| 4 | `datum-laporan-en` | `Report (DATUM Rev A, EN)` | EN | LAP | TERBIT | `REPORT` |
| 5 | `datum-laporan-verifikasi` | `Laporan Verifikasi dan Uji (DATUM Rev A)` | ID | VER | TERBIT | `LAPORAN VERIFIKASI` |
| 6 | `datum-laporan-verifikasi-en` | `Verification and Test Report (DATUM Rev A, EN)` | EN | VER | TERBIT | `VERIFICATION REPORT` |
| 7 | `datum-standar` | `Standar (DATUM Rev A)` | ID | STD | TERBIT | `STANDAR` |
| 8 | `datum-standar-en` | `Standard (DATUM Rev A, EN)` | EN | STD | TERBIT | `STANDARD` |
| 9 | `datum-nota` | `Nota Internal (DATUM Rev A)` | ID | NOT | NOTA | `NOTA INTERNAL` |
| 10 | `datum-nota-en` | `Internal Note (DATUM Rev A, EN)` | EN | NOT | NOTA | `INTERNAL NOTE` |

Sitasi nama dan kicker:

| Kode | Nama jenis di manual | Kicker | Keyakinan |
|---|---|---|---|
| PT | "Proposal teknis" (`ID:647`); "PT technical proposal" (`EN:681`) | ID dan EN = nama jenis kapital; pola kicker sampul = nama jenis kapital di depan (`ID:5` "STANDAR · MANUAL GAYA RUMAH DATUM · ..."; `EN:5` "STANDARD · DATUM HOUSE STYLE MANUAL · ...") | HIGH |
| LAP | "Laporan kegiatan" (`ID:649`); "LAP activity report" (`EN:682`). Bentuk kerja "laporan" / "technical reports" (`ID:13`; `EN:13`); laporan teknis klien memakai LAP (`research/30:60`) | Dipendekkan ke `LAPORAN` / `REPORT` karena templat melayani laporan kegiatan dan laporan teknis (`ID:4283`). Alternatif harfiah `LAPORAN KEGIATAN` / `ACTIVITY REPORT` tetap sah bila controller memilihnya | MEDIUM |
| VER | "Verifikasi data, uji, atau forensik" (`ID:659`); "VER verification" (`EN:683`) | `LAPORAN VERIFIKASI` / `VERIFICATION REPORT` (`research/30:217`) | MEDIUM |
| STD | "Standar atau SOP" (`ID:653`); "STD standard" (`EN:683`) | `STANDAR` (`ID:5`) / `STANDARD` (`EN:5`) | HIGH |
| NOT | "Nota internal" (`ID:655`); "NOT internal note" (`EN:683`) | `NOTA INTERNAL` / `INTERNAL NOTE`. Tier NOTA tidak punya sampul (§2), jadi kicker tidak tercetak di sampul DOCX; nilai tetap diisi karena HTML running head memakai `cover.kicker.text` sebagai "jenis dokumen" (`src/lib/studio/engine/html/base/markup.ts:75-77`) | HIGH |

Pemeriksaan slug: 10 slug unik; 5 slug EN = slug ID + `-en`; semua cocok `^[a-z0-9][a-z0-9-]{0,63}$` (`scripts/studio/mcp/write-client-run.ts:33`); tidak ada yang sama dengan 7 templat produksi (`research/30:44`). Semua slug berawalan `datum-`, jadi masuk kandidat logika `latest` lama (`write-client-run.ts:29`); karena itu §7 (S10) wajib mendahului seed.

## 2. Tier bawaan per jenis

Dasar umum: NOTA = bawaan, naik tier wajib dibenarkan (`ID:406-412`; `EN:440-445`). EN merinci: pembaca hanya di divisi penulis atau Direktur = NOTA; deliverable kontrak atau tender ke pihak luar = SERAH; selain itu TERBIT (`EN:447-451`). ID merangkum: tanpa pembaca bernama di luar divisi tetap NOTA, "hanya pihak luar atau tender yang menaikkannya ke SERAH" (`ID:414`).

| Kode | Tier | Bukti teks manual | Keyakinan |
|---|---|---|---|
| PT | SERAH | ID: proposal yang dibaca Pokja Pemilihan "jadi tier-nya SERAH" (`ID:4038-4039`), dan tender menaikkan ke SERAH (`ID:414`). EN: "tender submission to an outside party: SERAH" (`EN:450`). Kedua edisi sejalan | HIGH |
| LAP | TERBIT | Tidak ada kalimat tier khusus jenis. EN: "Otherwise TERBIT" (`EN:451`), SERAH hanya untuk deliverable kontrak atau tender (`EN:450`, `EN:461`). ID: pembaca bernama di luar divisi menaikkan di atas NOTA (`ID:409-412`); teks ID `ID:414` menyebut "pihak luar" sebagai pemicu SERAH, berbeda dari EN (§10 baris 3) | MEDIUM |
| VER | TERBIT | Sama dengan LAP (`EN:450-451`; `ID:409-414`); tidak ada kalimat tier khusus VER (`ID:659`) | MEDIUM |
| STD | TERBIT | Kedua manual adalah dokumen STD bertier TERBIT: nomor `XXX/GSP/STD/XI/2026` dan TIER TERBIT di sampul (`ID:15-17`; `EN:15-17`), "Tier manual ini TERBIT" (`ID:66`; `EN:70`) | HIGH |
| NOT | NOTA | Nota internal (`ID:655`; `EN:683`); NOTA bawaan (`ID:408`); pembaca dalam divisi = NOTA (`EN:449`) | HIGH |

Override tetap berlaku: `meta.tier` agen menang atas `doc.defaultTier` (`src/lib/studio/services/compose/merge.ts:85`), mis. laporan yang menjadi deliverable kontrak dinaikkan ke SERAH, atau proposal non-tender diturunkan ke TERBIT. Tabel ini adalah kandidat koreksi USER (Q-G, `02_structured:334`; diputus controller lewat register ini, D-596 `decisions.md:602`).

## 3. Lapis parameter templat (masukan S26)

### 3.1 Lapis bersama

| Kunci | Nilai | Bukti |
|---|---|---|
| `doc.typeCode` | `["PT", "KT", "RAB", "SPH", "SP", "BA", "NDA", "DEK", "LAP", "MAT", "STD", "NOT", "MOD", "VER"]` | Daftar tertutup ARSIP Tabel 3.1 (`ID:643-659`), DS pensiun sejak Rev K (`ID:643, 661`); EN mendaftar 14 kode yang sama tanpa DS (`EN:681-683`; kata "DS" tidak muncul di `manual_en.txt`). Urutan = kolom kiri lalu kolom kanan Tabel 3.1 (`02_structured:94`). Bergantung pada NDA masuk enum (S11); bawaan registri `["KT", "PT", "RAB", "SPH", "SP", "BA", "DS", "STD"]` dan enum saat ini (`src/lib/studio/params/governance-language.ts:114-116`) tidak diubah oleh templat |
| Basis | versi terbaru `datum-gsp-preset` | AC-2 (`02_structured:63`) |
| Kerangka | 7 slot `SKELETON_SLOTS` (`prisma/seed-studio.ts:570-578`); STD + slot `ruleIndex` (§3.5) | RQ-1 (`02_structured:50`) |

### 3.2 Lapis jenis

| Kunci | Nilai | Bukti |
|---|---|---|
| `doc.defaultTypeCode` | kode kolom "Kode" §1 | parameter ada, bawaan `"KT"` (`src/lib/studio/params/structure.ts:94-96`) |
| `doc.defaultTier` | tier §2 | parameter ada, enum NOTA/TERBIT/SERAH, bawaan `"TERBIT"` (`structure.ts:97-99`) |
| `cover.kicker.text` | kicker §1 | parameter ada, bawaan `""` (`src/lib/studio/params/page.ts:414-417`) |

### 3.3 Lapis bahasa

| Kunci | ID | EN | Bukti |
|---|---|---|---|
| `doc.language` | `"ID"` (diset eksplisit agar templat tidak bergantung pada preset) | `"EN"` | enum ID/EN, bawaan `"ID"` (`governance-language.ts:123-125`); server memakai `sent.language ?? doc.language` (`merge.ts:87`) |
| Label slot `cover` | `Sampul` | `Cover` | ID: `seed-studio.ts:571` |
| Label slot `controlSheet` | `Lembar Kendali` | `Control Sheet` | ID: `seed-studio.ts:572`; EN: `EN:23`. Label ini tercetak sebagai kicker dan judul bawaan lembar kendali (`src/lib/studio/services/compose/front.ts:74-76`) |
| Label slot `signature` | `Tanda Tangan` | `Signatures` | ID: `seed-studio.ts:573` |
| Label slot `toc` | `Daftar Isi` | `Contents` | ID: `seed-studio.ts:574`; EN: `EN:77` |
| Label slot `content` | `Isi` | `Content` | ID: `seed-studio.ts:575` |
| Label slot `references` | `Referensi` | `References` | ID: `seed-studio.ts:576` |
| Label slot `appendices` | `Lampiran` | `Appendices` | ID: `seed-studio.ts:577`. Manual EN memakai "Annex" untuk lampirannya sendiri (`EN:240`, `EN:4441`); label slot tidak tercetak di DOCX selain kicker lembar kendali, jadi selisih ini masuk cakupan (S02 LB-08) |
| Label slot `ruleIndex` (STD) | `Indeks Aturan` | `Rule Index` | ID: nama section registri (`src/lib/studio/registry/sections.ts:431`), manual "Indeks aturan" (`ID:4517`); EN: "Rule index" (`EN:4441`) |

Label EN slot selain `controlSheet` dan `toc` tidak punya padanan kata per kata di manual; dipakai sesuai usulan `research/30:221` (MEDIUM).

### 3.4 Kunci yang TIDAK ditimpa templat

| Kunci | Alasan | Bukti |
|---|---|---|
| `wrapper.header` | Bawaan registri masuk `paramsSha256` templat lama; teks EN dipilih di tabel teks bila nilai parameter = bawaan registri dan bahasa EN (§4.4) | `02_structured:35, 94`; `page.ts:434-443` |
| `device.issueStamp.format` | Sama | `page.ts:334-344` |
| `render.toc.title` | Dibiarkan kosong (bawaan `null`) di ID dan EN. Halaman daftar isi selalu mencetak kicker berbahasa (`Daftar Isi` / `Contents`) dan judul hanya bila kenop diisi (`src/lib/studio/engine/docx/wrapper/pages.ts:465-466`); mengisi `Contents` akan mencetak kata itu dua kali. Manual EN menampilkan satu baris "Contents" (`EN:77`), ID satu baris "Daftar Isi" (`ID:74`). **Menyimpang dari kesepakatan awal blueprint §4** (`02_structured:94`), lihat F-6 | `src/lib/studio/params/render.ts:268`; `pages.ts:465-466` |
| `chapter.kicker.pattern`, `device.registerBlock.cells` | Pelokalan sudah di mesin (`CHAPTER {n}`, SHEET/OF) | `src/lib/studio/engine/front/texts.ts:89-104`; `src/lib/studio/engine/docx/package/header-footer.ts:154, 164, 274` |

### 3.5 Slot `ruleIndex` untuk STD

`{ slotKey: "ruleIndex", sectionType: "ruleIndex", label: <§3.3>, position: 7, required: false, positionLocked: false, repeatable: false, contentMode: "AUTO", tiers: [], admits: [] }`, lalu `appendices` bergeser ke posisi 8 (sebelum lampiran, `02_structured:91`). Jenis slot sah dengan mode bawaan AUTO (`src/lib/studio/registry/slots.ts:37, 92`). `required: false` wajib: penanda AUTO tanpa entri pada slot opsional tidak memancarkan seksi (`src/lib/studio/engine/docx/assemble/units.ts:351-361`), sedangkan slot wajib tanpa isi akan dirender sebagai seksi kosong. Akibatnya DOCX belum memuat indeks aturan (F-3).

## 4. Tabel teks pembungkus ID/EN (masukan S12-S15)

### 4.1 Blok kendali sampul (mode auto, `CONTROL_FIELD_LABELS`)

| Medan | ID (kode, tetap) | EN sekarang | EN target | Bukti |
|---|---|---|---|---|
| NOMOR DOKUMEN | `Nomor dokumen` | `Document number` | tetap | `texts.ts:121`; `EN:15` |
| REVISI | `Revisi` | `Revision` | tetap | `texts.ts:122`; `EN:15` |
| PENYUSUN | `Penyusun` | `Author` | **`Prepared by`** | `texts.ts:123`; `EN:16` "PREPARED BY", `EN:29`, `EN:2558` "preparer"; D-590 |
| KUSTODIAN | `Kustodian` | `Custodian` | tetap | `texts.ts:124`; `EN:16` |
| DITUJUKAN KEPADA | `Ditujukan kepada` | `Addressed to` | tetap | `texts.ts:125`; `EN:17` |
| TIER | `Tier` | `Tier` | tetap | `texts.ts:126`; `EN:17` |
| DASAR | `Dasar` | `Basis` | tetap | `texts.ts:127`; `EN:18` |
| BAHASA | `Bahasa` | `Language` | tetap | `texts.ts:128`; `EN:18` |

Nilai BAHASA: `Indonesia` / `English` (`texts.ts:145`). Manual EN menulis "English (UK)" (`EN:18`); di luar lingkup D-590, dicatat sebagai butir cakupan.

### 4.2 Lembar kendali

| Unsur | ID (kode, tetap) | EN | Bukti |
|---|---|---|---|
| Kicker bawaan | `Lembar Kendali` | `Control Sheet` | `texts.ts:22`; kicker aktual = label slot (`front.ts:74-76`, §3.3); `ID:23`; `EN:23` |
| Judul blok (pola `<huruf> · <judul>`) | `Riwayat revisi`, `Rantai verifikasi`, `Pernyataan metode`, `Distribusi terkendali` | `Revision history`, `Verification chain`, `Method statement`, `Controlled distribution` (sudah ada) | `texts.ts:23-26, 43-45`; `ID:27, 37, 56`; `EN:27, 36, 60` |
| Kepala kolom riwayat revisi | `["Rev", "Tanggal", "Uraian", "Oleh"]` | `["Rev", "Date", "Change", "Prepared by"]` | ID: `front.ts:30`. EN: `EN:29` (REV, DATE, CHANGE, PREPARED BY). Kolom `Oleh` memuat penyusun (`front.ts:78`, medan `r.by`), padanannya kolom PREPARED BY manual |
| Kepala kolom rantai verifikasi | `["Lapis", "Peran", "Nama", "Tanggal"]` | `["Layer", "Role", "Name", "Date"]` | ID: `front.ts:31`. EN: "LAYER" (`EN:38`), "DATE" (`EN:29`); "Role" dan "Name" terjemahan langsung karena bentuk data kode (`r.role`, `r.name`, `front.ts:82`) berbeda dari kolom manual METHOD/OBJECT/RESULT (`EN:38`); skema tidak boleh berubah (D-594) |
| Kepala kolom distribusi | `["Salinan", "Pemegang"]` | `["Copy", "Holder"]` | ID: `front.ts:32`. EN: "COPY", "HOLDER" (`EN:62`) |

Kolom manual yang tidak ada di kode (STATUS; METODE/OBJEK/HASIL; MEDIA/KEMBALI; `ID:29, 39, 58`; `EN:29, 38, 62`) dan parameter `controlSheet.*.columns` yang tidak dipakai jalur compose (`page.ts:450-489`) masuk cakupan, tidak diubah ronde ini.

### 4.3 Label klien MCP (`LABELS`, `scripts/studio/mcp/write-client.ts:103-107`)

| Kunci | ID (kode, tetap) | EN sekarang | EN target | Dipakai di |
|---|---|---|---|---|
| number | `Nomor dokumen` | `Document number` | tetap | blok kendali sampul eksplisit (`write-client.ts:142`) |
| rev | `Revisi` | `Revision` | tetap | sama |
| author | `Penyusun` | `Author` | **`Prepared by`** | blok kendali (`:142`), peran lapis 1 rantai verifikasi (`:155`) |
| classification | `Klasifikasi` | `Classification` | tetap | blok kendali (`:143`); `EN:647` "Classification: line" |
| audience | `Ditujukan kepada` | `Addressed to` | tetap | `:143` |
| custodian | `Kustodian` | `Custodian` | tetap | `:143` |
| basis | `Dasar` | `Basis` | tetap | `:143` |
| sheet | `Lembar Kendali` | `Control Sheet` | tetap | judul lembar kendali bila ada nomor (`:161`) |
| made | `Disusun` | `Prepared` | **`Prepared by`** | peran tanda tangan 1 (`:170`) |
| checked | `Diperiksa` | `Checked` | **`Reviewed by`** | peran tanda tangan 2 (`:171`), lapis 2 (`:156`) |
| approved | `Disetujui` | `Approved` | **`Approved by`** | peran tanda tangan 3 (`:172`), lapis akhir (`:157`) |
| first | `Terbit pertama` | `First issue` | tetap | catatan revisi bawaan (`:139`); `EN:31` "First issue" |
| by | `Diolah oleh` | `Compiled by` | tetap | (tidak ada padanan manual) |

Peran tanda tangan EN `Prepared by` / `Reviewed by` / `Approved by` = default controller D-590 (`decisions.md:596`); manual EN hanya menyebut "three signature columns" (`EN:2570`). Bila sweep S03 menyatukan tabel ini dengan `texts.ts` (U4), nilai di atas tetap berlaku. Bahasa label wajib mengikuti bahasa efektif dokumen, lihat F-1.

### 4.4 Pita segel dan cap terbit

| Unsur | ID (kode, tetap) | EN | Bukti |
|---|---|---|---|
| Pita segel kiri | `KLASIFIKASI · {kelas}` | `CLASSIFICATION · {kelas}` | ID: `page.ts:439`, cadangan `src/lib/studio/engine/docx/wrapper/render.ts:324`, `ID:1`; EN: `EN:1`, `EN:21`, `EN:75` |
| Pita segel kanan | `SALINAN INDUK · PENGGUNAAN INTERNAL GSP` | `MASTER COPY · GSP INTERNAL USE` | ID: sama; EN: `EN:1`, `EN:21`, `EN:75` |
| Format cap terbit | `// {YYYYMMDD} {BAHASA} {KELAS} -- TERBITAN {n}` | `// {YYYYMMDD} {BAHASA} {KELAS} -- ISSUE {n}` | ID: `page.ts:339`, cadangan `texts.ts:190`; contoh `// 20261102 ID T -- TERBITAN 1` (`ID:20`, `ID:1979`). EN: `// 20261103 EN T -- ISSUE 1` (`EN:20`, `EN:2061`), "English changes only the words" (`EN:2791-2792`) |

Aturan pemilihan (tantangan 2, `02_structured:35`): entri EN dipakai hanya bila bahasa dokumen EN **dan** nilai parameter = bawaan registri; pasangan atau format lain yang diset templat menang di bahasa apa pun; `meta.copyControl` tetap menimpa sel kanan (`render.ts:326`). `{kelas}` = `meta.classification` apa adanya (`render.ts:325`); `{KELAS}` = huruf pertama klasifikasi kapital (`texts.ts:197`; `EN:2791` "where T is TERBATAS"); `{BAHASA}` = `meta.language` (`texts.ts:196`).

### 4.5 Teks berbahasa lain yang sudah dilokalkan (tetap, rujukan skor)

| Unsur | ID | EN | Bukti |
|---|---|---|---|
| Kicker daftar isi (= satu-satunya judul daftar isi, §3.4) | `Daftar Isi` | `Contents` | `texts.ts:27`; `ID:74`; `EN:77` |
| Pola kicker bab | `BAB {n}` | `CHAPTER {n}` | `texts.ts:89-91`; `ID:76`; `EN:79` |
| Kata bab di running head | `Bab` | `Chapter` | `header-footer.ts:96`; `ID:349`; `EN:397` |
| Kata lampiran / bagian | `Lampiran` / `Bagian` | `Appendix` / `Part` | `texts.ts:29-30` |
| Kata blok register | `LEMBAR {n} DARI {N}` | `SHEET {n} OF {N}` | `header-footer.ts:154, 164, 274`; `ID:348`; `EN:396` |
| Pemisah sel register | NBSP | NBSP | `page.ts:260`; `header-footer.ts:162`; DT-13g (`ID:2732-2737`; `EN:2794-2799`) |
| Tanggal register | `DD-<Romawi>-YYYY` | sama | `header-footer.ts:82-87`; `ID:1978`; `EN:2059` |
| Tanggal panjang (REVISI sampul) | `2 November 2026` (nama bulan ID) | `3 November 2026` (nama bulan EN) | `src/lib/studio/engine/docx/wrapper/formats.ts:461-481`; `ID:1975`; `EN:2053` |

### 4.6 Teks Indonesia yang SAH di dokumen EN

| Teks | Bukti |
|---|---|
| Baris alamat `Divisi Engineering & Technical Intelligence · Jl. Bangka Raya No. 27, Pela Mampang, Jakarta Selatan 12720 · Tel. (021) 22715320` | `page.ts:401`; "English documents keep these letterhead lines verbatim" (`EN:2654-2657`) |
| Kolofon kiri `PT GEMILANG SATRIA PERKASA · NIB 9120208940517` | `page.ts:444-445`; `texts.ts:202-210`; `EN:2658` |
| Tingkat klasifikasi Indonesia (`TERBATAS`, bukan RESTRICTED) | EG-50 (`EN:627-634`) |
| Nama tier `NOTA`, `TERBIT`, `SERAH` | `EN:447` |
| Kode jenis (PT, LAP, ...) | `EN:681` |
| Kutipan Indonesia (Rp dalam kutipan) | `EN:2026-2027`, `EN:2079` |

## 5. Konvensi angka (lapisan bind, angka terikat register)

| Unsur | ID (kode, tetap) | EN | Bukti |
|---|---|---|---|
| Pemisah ribuan | `.` | `,` | ID: `src/lib/studio/engine/bind/format.ts:13`, `ID:1931`; EN: `EN:1933`, `ID:2001` |
| Pemisah desimal | `,` | `.` | ID: `format.ts:14`; EN: `EN:1933` |
| Contoh `fmt(1250000.5, 1)` | `1.250.000,5` | `1,250,000.5` | `ID:1931`; `EN:1933`; `ID:2001` |
| Satuan mendahului | `["Rp", "USD", "EUR", "SGD"]` | `["IDR", "USD", "EUR", "SGD"]` (Rp dipetakan ke IDR) | ID: `format.ts:16`; EN: "Write rupiah as IDR", ISO 4217 untuk mata uang lain (`EN:2024-2028`) |
| Rupiah (`rp()`) | `"Rp " + fmt` | `"IDR " + fmt` | ID: `src/lib/studio/engine/bind/register.ts:153`; EN: `EN:423` ("Rp 1.385.946.000 becomes IDR 1,385,946,000"), `EN:2024-2025`, salah = `IDR3,360,000,000` (`EN:2030`) |
| Contoh mata uang | `Rp 1.385.946.000` | `IDR 1,385,946,000` | `EN:423` |
| Persen (`pct()`) | `fmt + " %"` | sama (spasi) | ID: `register.ts:157`, `ID:2001` "25 % berspasi"; EN: `EN:1942` |
| Spasi nilai-satuan | U+0020 | U+0020 (sama dengan ID). EN 6.2 menganjurkan NBSP (`EN:1942`), tetapi uji DT-30a hanya menuntut tidak menempel (`EN:1937-1939`); NBSP di luar lingkup D-590 | `format.ts:131` |
| Pembulatan | half-even atas nilai biner eksak | sama, tidak berubah | `format.ts:6-9` |
| Tanda negatif | `-` | sama | `format.ts:102` |
| Desimal | `dec` entri register | sama. Builder Python EN memformat IDR dengan `f"{v:,.0f}"` (`EN:2222-2223`), konsisten bila entri uang ber-`dec` 0 | `register.ts:151-154` |

Lingkup: hanya angka terikat register (lapisan bind). Label angka chart pada dokumen EN tetap konvensi ID, ditunda ke ronde berikut (Q-C, D-596 `decisions.md:602`). Satu konvensi per berkas (`ID:2000-2003`; `EN:2076-2079`).

## 6. Daftar string terlarang AC-6

Daftar inti (kritis, CR-4 di S02), dikutip dari AC-6 (`02_structured:67`):

`Lembar Kendali`, `KLASIFIKASI`, `SALINAN INDUK`, `TERBITAN`, `Tanggal`, `Uraian`, `Oleh`, `Pemegang`, `LEMBAR`, `Penyusun`, `Rp`

Ditambah syarat positif AC-6: angka register tampil `1,250,000.5` dan mata uang `IDR` (§5).

Semantik pencocokan (mengikat untuk S23):
1. Cocok kata utuh (batas kata Unicode di kedua sisi; `Lembar Kendali` dan `SALINAN INDUK` sebagai frasa dengan spasi biasa atau NBSP).
2. Peka huruf besar-kecil, dicocokkan terhadap DUA bentuk: teks sumber `w:t`, dan teks tampak (teks sumber dikapitalkan bila run atau gaya karakter/paragrafnya ber-`w:caps` aktif). Token ditemukan bila cocok pada salah satu bentuk. Contoh: sumber `Tanggal` di run ber-caps tetap tertangkap lewat bentuk sumber; sumber `Lembar Kendali` di run ber-caps tertangkap juga lewat `LEMBAR`.
3. Lingkup teks: `word/document.xml`, `word/header*.xml`, `word/footer*.xml`. `word/media/*` (gambar chart/diagram) di luar lingkup (Q-C).
4. Pengecualian §4.6 tidak memuat token inti mana pun, jadi tidak ada pengecualian yang perlu diterapkan pada daftar inti.

Asal token bila bocor (untuk diagnosis): `Lembar Kendali` (label slot / `LABELS.sheet`), `KLASIFIKASI` dan `SALINAN INDUK` (pita segel), `TERBITAN` (cap terbit), `Tanggal`/`Uraian`/`Oleh`/`Pemegang` (`front.ts:30-32`), `LEMBAR` (blok register / kicker ber-caps), `Penyusun` (`texts.ts:123`, `write-client.ts:104`), `Rp` (`register.ts:153`).

Daftar perluasan (tidak kritis, aturan AC6-03 di S02), hanya di lokasi teks pembungkus: `Lapis`, `Peran`, `Nama`, `Salinan`, `Disusun`, `Diperiksa`, `Disetujui`, `Terbit pertama`, `Diolah oleh`, `Daftar Isi`, `Bab`, `Lampiran`, `Bagian`, `DARI`, `Riwayat revisi`, `Rantai verifikasi`, `Pernyataan metode`, `Distribusi terkendali`, `Nomor dokumen`, `Revisi`, `Kustodian`, `Ditujukan kepada`, `Dasar`, `Bahasa`, `Klasifikasi`, `Tabel`, `Gambar`, `Turunan`, `SUMBER`, `PROVENANS`, `KUNCI`. Sumber: §4.1-§4.5 dan label aparatus (F-2).

Daftar cermin untuk dokumen ID (CR-4, lokasi pembungkus saja): `CLASSIFICATION`, `MASTER COPY`, `ISSUE`, `SHEET`, `OF` (sel register), `Control Sheet`, `Contents`, `Prepared by`, `Reviewed by`, `Approved by`, `Author`, `Chapter`, `Appendix`, `Revision history`, `Verification chain`, `Controlled distribution`.

## 7. Konstanta default `latest`

| Unsur | Nilai | Bukti |
|---|---|---|
| Nilai | `datum-gsp` | D-590 "`latest` 'Pin to datum-gsp'" (`decisions.md:596`); RQ-3 (`02_structured:52`) |
| Bentuk | satu literal bernama di satu tempat (nama disarankan `LATEST_TEMPLATE_SLUG`; nama akhir milik coder S10) | `02_structured:94` |
| Menggantikan | pengurutan `updatedAt` turun atas templat `datum-*` (`write-client-run.ts:24-35`) | `research/30:240` (R1) |
| Batas | `template` selain `"latest"` diteruskan apa adanya (`write-client-run.ts:26`). Bila `datum-gsp` tidak ada atau terarsip/terbatas di daftar R01, kembalikan galat `TEMPLATE_NOT_FOUND` yang ada (`write-client-run.ts:33`) tanpa cadangan ke urutan `updatedAt` | turunan RQ-3 |
| Uji | templat `datum-*` yang lebih baru tetap menghasilkan `datum-gsp` (S10, `02_structured:126`); AC-4 di DEV, gladi, produksi, sesi Hermes (`02_structured:65`) | |

## 8. Ambang dan aturan kritis

| Ambang | Nilai | Bukti |
|---|---|---|
| Skor terukur | >= 85,0 % per pasangan templat x bahasa = aturan terukur lolos / aturan terukur yang berlaku; dihitung satu desimal tanpa pembulatan ke atas (84,96 = gagal); aturan N/A keluar dari penyebut; penyebut 0 = gagal | U1, D-592 (`decisions.md:598`); RQ-5 |
| 4 aturan kritis | semua lolos; aturan kritis tidak boleh N/A, dan aturan kritis tanpa bukti yang terlatih (UNEXERCISED) dihitung gagal | D-592 |
| Cakupan butir | >= 85,0 % = butir cakupan-saja yang tercakup / butir yang berlaku; butir di luar lingkup wajib beralasan dan keluar dari penyebut | U2, D-593 (`decisions.md:599`); RQ-6 |
| Bentrok teks | 0 per sampel render (PDF ID dan EN), termasuk teks pembungkus yang saling bertentangan | D-593 |
| Tempat gerbang | DEV (S36), gladi (S45), produksi (S52) | AC-8 (`02_structured:69`) |

Empat aturan kritis (D-592; rincian pemeriksaan di S02):

| Kode | Aturan | Dasar manual |
|---|---|---|
| CR-1 | Penandaan klasifikasi: tingkat sah skema ANRI, kapital, identik di pita segel, running head kanan, dan sel terakhir blok register; tingkat Indonesia dipertahankan di EN | DT-28a/c/e (`ID:566-629`; `EN:590-666`), EG-50 (`EN:627-634`); skema ANRI tetap (D-590) |
| CR-2 | Pola nomor dokumen `NNN/GSP/<KODE>/<BULAN ROMAWI>/<TAHUN>`, kode dari daftar §3.1 tanpa DS, tanpa awalan SR/R/T/B | DT-04b (`ID:634-664`; `EN:675-683`), DT-04a (`ID:508-513`; `EN:535-541`) |
| CR-3 | Konvensi angka per bahasa (§5) pada angka terikat register, satu konvensi per berkas | DT-30f/g (`ID:1929-1945`; `EN:1929-1938`, `EN:2022-2030`), `ID:1998-2006`, `EN:2076-2082` |
| CR-4 | Bahasa teks pembungkus: EN bebas daftar inti §6 dan memuat penanda EN; ID bebas daftar cermin §6 dan memuat penanda ID | RQ-2, AC-6 (`02_structured:51, 67`) |

## 9. Aturan paritas pemakaian (U3)

1. Alat sama (`studio_write`, `studio_edit`, R08), bentuk muatan sama (`meta` tingkat atas + JSON `sections`), bentuk edit, toleransi, dan peringatan sama; yang berbeda antartemplat hanya slug `template` (D-594 `decisions.md:600`; RQ-7, AC-9 `02_structured:56, 70`).
2. Dilarang: medan muatan baru, skema muatan slot baru, format permintaan per jenis, alat atau toolset baru, how-to per jenis (D-594).
3. Bawaan milik templat: kode jenis, tier, bahasa, kicker, label pembungkus; `meta` tetap menimpa seperti biasa (pola `sent ?? param`, `merge.ts:85-87`).
4. Slot `ruleIndex` STD = AUTO dari isi, tanpa masukan (D-594).
5. Pembanding paritas `datum-nota` = `datum-gsp` dengan `meta.tier = NOTA`, bukan dokumen TERBIT (`02_structured:39`), karena slot 1-4 dilarang untuk NOTA (`seed-studio.ts:571-574`; `src/lib/studio/services/compose/structure.ts:265`).
6. Ukuran AC-9: satu JSON isi kajian identik ke `datum-gsp` dan 10 templat: valid, tanpa issue atau peringatan baru, selisih hanya keluaran milik templat; pada smoke MCP, selisih muatan antarpanggilan = medan `template` saja.
7. Konsekuensi yang mengikat implementasi (dari temuan §11):
   - Label pembungkus yang disusun klien MCP mengikuti **bahasa efektif** = `meta.language` bila dikirim, selain itu `doc.language` templat, tanpa medan muatan baru (F-1).
   - Muatan bersama untuk sampel konformitas (S35, S44, S51) tidak mengirim `number`, sehingga nomor server memakai kode jenis templat (`src/lib/studio/services/ingest/repository.ts:52, 66-73`); nomor tampilan yang dikirim agen dengan kode jenis lain akan menjadi bentrok kode jenis (F-8).

## 10. Pertentangan di manual dan penanganannya (D-590)

| # | Pertentangan | Penanganan ronde ini |
|---|---|---|
| 1 | Isi blok kendali sampul: prosa = nomor, revisi, penyusun, kustodian, ditujukan kepada, halaman, datum geodetik, verifikasi (`ID:2486-2487`; `EN:2558-2559`) lawan spesimen sampul = ... TIER, DASAR, BAHASA (`ID:15-18`; `EN:15-18`). Pertentangan ada di dalam KEDUA edisi | Mesin tetap `COVER_CONTROL_FIELDS` = medan spesimen (`page.ts:368-377`). Skor mengukur inti bersama (nomor, revisi, penyusun, kustodian, ditujukan kepada); tiga medan sisanya cakupan-saja (S02 CV-13, CV-14) |
| 2 | Penomoran lembar: ID "Sampul, lembar kendali, dan pembatas tidak bernomor. Penomoran lembar dimulai dari halaman pertama Bab 1" (`ID:2510-2511`); EN "Sheets count from the cover" (`EN:2582`). Praktik kedua manual: blok register pertama di lembar 6 (`ID:304`; `EN:310`) dan tidak ada blok register di halaman sebelumnya | Kedua edisi: halaman depan tanpa blok register (terukur; `ID:2510`, `EN:2765`). EN: hitungan dari sampul tanpa mulai ulang (terukur, EN saja). ID: apakah nomor mulai ulang di Bab 1 ambigu dalam teks ID, jadi cakupan-saja (S02 RB-07, RB-08, RB-08c) |
| 3 | Pemicu SERAH: ID "hanya pihak luar atau tender" (`ID:414`); EN "contractual deliverable or tender" (`EN:450`, `EN:461`) | Tier LAP/VER = TERBIT di kedua edisi (§2), MEDIUM; override `meta.tier` |
| 4 | DS: ID menyatakan pensiun (`ID:643, 661`); EN tidak menyebut DS dan mendaftar 14 kode (`EN:681-683`) | Daftar tertutup sama di kedua edisi (§3.1) |
| 5 | Kolom lembar kendali manual (`ID:29, 39, 58`; `EN:29, 38, 62`) lawan kode (`front.ts:30-32`) | ID tetap kode (byte-identik); EN mengikuti bentuk data kode dengan kosakata manual (§4.2); kolom manual = cakupan |
| 6 | Warna logo: ID "Logo ... bernilai seal" (`ID:2545-2547`); EN "keep the logo black" (`EN:2611`, `EN:2643`) | Isi gambar, tidak terukur dari DOCX; cakupan-saja dengan catatan edisi (S02 CV-21) |
| 7 | Lampiran: kode EN "Appendix" (`texts.ts:29`) lawan manual EN "Annex" (`EN:240`, `EN:4441`) | Di luar lingkup D-590; cakupan-saja (S02 LB-08) |
| 8 | Bobot nomor di blok register: ID "nomor dokumen dan nomor lembar tebal ink900" (`ID:2732`); EN DT-13g tidak menyebut tebal (`EN:2794-2799`) | Aturan tebal berlaku ID saja (S02 RB-04) |

## 11. Temuan kunci

**F-1. Label klien MCP mengikuti `meta.language` klien, bukan bahasa templat.**
- Confidence: HIGH.
- Evidence: `normalizeMeta` hanya mengisi `language` bila agen mengirimnya (`write-client.ts:83-86`); `labelsOf` jatuh ke ID bila `language` kosong (`write-client.ts:107`); label itu dipakai untuk blok kendali, judul lembar kendali, catatan revisi, peran rantai verifikasi, dan peran tanda tangan (`write-client.ts:133-175`). Server memakai `sent.language ?? doc.language` templat (`merge.ts:87`).
- Implication: dengan U3 (hanya slug berubah, tanpa `language` di meta), templat `-en` akan menerima `Penyusun`, `Lembar Kendali`, `Disusun`, `Terbit pertama` dari klien, sehingga CR-4/AC-6 gagal. S12 harus menurunkan bahasa efektif dari templat tanpa medan muatan baru (cara memperoleh `doc.language` templat diputus coder S12; belum diverifikasi apakah respons R01 memuatnya, hipotesis).

**F-2. Label aparatus DOCX selalu Indonesia.**
- Confidence: HIGH.
- Evidence: penomoran `Tabel C.n` / `Gambar C.n` tertulis keras (`src/lib/studio/engine/docx/assemble/numbering.ts:110-111`); label `SUMBER`, `Turunan` (`src/lib/studio/engine/docx/figures/defaults.ts:36-41`; `src/lib/studio/engine/docx/tables/render.ts:383, 440`). Padanan EN hanya ada di HTML (`src/lib/studio/engine/html/tables/style.ts:251-252`). Sampel how-to memuat tabel berketerangan dan grafik bersumber (`docs/STUDIO-HOWTO-DOCUMENT.md:33-35`). Manual EN memakai TABLE, FIGURE, SOURCE, DERIVATION (`EN:2327`, `EN:2721`, `EN:2496`, `EN:2727`).
- Implication: token ini tidak ada di daftar inti AC-6, tetapi melanggar RQ-2 ("tanpa teks pembungkus Indonesia") dan memicu bentrok "dua bahasa dalam teks pembungkus" (D-593, ambang 0) pada setiap sampel EN. Controller perlu memutus: masukkan pelokalan label aparatus ke lingkup S03/S13 (disarankan), atau catat pengecualian bentrok secara eksplisit (bertentangan dengan D-593).

**F-3. Indeks aturan STD belum dibangkitkan.**
- Confidence: HIGH.
- Evidence: penanda `ruleIndex` AUTO tanpa entri pada slot opsional tidak memancarkan seksi, "indeks aturan otomatis belum dibangun" (`units.ts:351-361`, `units.ts:188-193`); HTML hanya penanda (`src/lib/studio/engine/html/assemble/slots.ts:229-231`).
- Implication: slot harus `required: false` (§3.5); butir indeks aturan STD (`ID:4517`; `EN:4441`) tercatat "tidak tercakup" atau "sebagian" di S33. Risiko 4 blueprint (`02_structured:313`) terkonfirmasi sebagian: tidak butuh input, tetapi juga tidak menghasilkan isi.

**F-4. Warna klasifikasi dan garis running head di mesin berbeda dari Rev A.**
- Confidence: MEDIUM (nilai kode terbaca; render aktual belum diukur).
- Evidence: run klasifikasi running head = INK900 (`header-footer.ts:55`); peta `color.classificationInk` T = ink900 (`src/lib/studio/params/color-type.ts:122`); garis kepala INK200 sz 5 (`header-footer.ts:73`). Rev A: klasifikasi seal tebal (`ID:619-623`; `EN:657-661`), garis kepala seal 0,26 mm (`ID:2576`; `EN:2646`).
- Implication: aturan terukur S02 GF-13 dan RH-03 diperkirakan gagal pada mesin saat ini. Memperbaikinya mengubah keluaran ID (bertentangan dengan RQ-4/AC-7) dan di luar lingkup kode D-590; disarankan dibiarkan sebagai aturan tidak kritis yang gagal dan dikonfirmasi pada kalibrasi S25.

**F-5. CR-3 tidak terlatih oleh muatan how-to.**
- Confidence: HIGH.
- Evidence: jalur `studio_write` klien tidak mengirim register (tidak ada rujukan register di `scripts/studio/mcp/write-client.ts`); `Register` hanya dibangun dari `snapshot.register` saat render (`src/lib/studio/services/render/pure/render.ts:351`; `src/lib/studio/services/render/artifact.ts:455`).
- Implication: S02 mendefinisikan fiksur bind per bahasa (B-FIX) untuk CR-3; tanpa fiksur itu CR-3 = UNEXERCISED = gagal. Fiksur adalah alat uji, bukan cara pakai agen, jadi tidak melanggar U3; perlu diakui controller.

**F-6. `render.toc.title` "Contents" akan mencetak judul ganda.**
- Confidence: HIGH.
- Evidence: kicker daftar isi selalu dicetak dari bahasa, judul hanya bila kenop diisi (`pages.ts:465-466`); kicker EN = `Contents` (`texts.ts:27`).
- Implication: register mengosongkan `render.toc.title` di semua templat baru (§3.4), menyimpang dari kesepakatan awal blueprint §4 (`02_structured:94`).

**F-7. Tier LAP/VER bertumpu pada aturan umum, dan teks ID berbeda dari EN.**
- Confidence: MEDIUM.
- Evidence: §2 dan §10 baris 3.
- Implication: TERBIT dipilih untuk kedua edisi; deliverable kontrak memakai `meta.tier = SERAH`.

**F-8. Nomor tampilan bersama di muatan U3 dapat membawa kode jenis yang salah.**
- Confidence: MEDIUM.
- Evidence: `meta.number` = nomor tampilan (`write-client.ts:56-57`, D-527) dan tercetak di blok kendali serta blok register (`header-footer.ts:227-237`); how-to menyertakan `number` (`docs/STUDIO-HOWTO-DOCUMENT.md:30`).
- Implication: satu JSON identik untuk 11 templat dengan satu nomor menghasilkan kode jenis yang tidak cocok dengan templat (bentrok kode jenis, D-593). Sampel konformitas menghilangkan `number` (§9 butir 7).

## 12. Verifikasi register ini

| Cek (`02_structured:117`) | Hasil |
|---|---|
| Setiap nilai bersitasi `ID:n`/`EN:n`, D-590, kode, atau `research/30` | Ya; nilai EN tanpa padanan manual ditandai MEDIUM (§3.3, §4.2, §4.3) |
| 10 slug unik, EN berakhiran `-en` | Ya (§1) |
| Tidak ada medan muatan atau skema slot baru | Semua kunci sudah ada: `doc.defaultTypeCode` (`structure.ts:94`), `doc.defaultTier` (`structure.ts:97`), `doc.language` (`governance-language.ts:123`), `cover.kicker.text` (`page.ts:414`), `doc.typeCode` (`governance-language.ts:114`), label slot (`seed-studio.ts:570-578`), jenis slot `ruleIndex` (`slots.ts:92`). Satu-satunya perubahan enum (NDA) milik S11 |
| Nilai ID yang ada di kode dikutip dari kode | Ya: §3.3, §4.1-§4.5, §5 |

Draf rencana (`masterplan/02_plan_draft.md`) tidak dibuat: perubahan sudah direncanakan di blueprint `02_structured_datum_rev_a.md`.
