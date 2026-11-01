# 17 — Review kode senior perubahan UI Studio (baris UI-03)

Tanggal: 2026-11-01. Peninjau: senior-code-reviewer. Skill: `code-review-senior`. Lingkup: `git diff HEAD -- src/components/studio src/app/studio src/lib/studio/params src/lib/studio/registry` (38 berkas, +479/-199) + 3 berkas baru (`template-editor/param-labels.ts`, `template-editor/role-format-labels.ts`, `shared/completeness-text.ts`) + `tests/unit/studio/ui02/*`. Konteks: D-449, D-459, D-463; `review/ui_audit_studio.md`; `delegation_progress/coder_execution_ui_02.md`. Peninjau hanya membaca dan menjalankan probe; tidak ada kode produksi yang diubah. Berkas milik ENG-01 (`engine/html`) dan MCP-04 (`scripts/studio/mcp`) tidak disentuh.

## 1. Vonis

| Domain | Vonis | H / M / L |
|---|---|---|
| Struktur | PASS | 0 / 0 / 2 |
| Dampak dependensi | CAUTION | 0 / 1 / 0 |
| Duplikasi | PASS | 0 / 0 / 1 |
| Keterpeliharaan | PASS | 0 / 0 / 4 |
| Integritas rujukan (label = arti di kode) | **FAIL** | 1 / 3 / 2 |
| **Keseluruhan** | **CHANGES REQUESTED** | **1 / 4 / 9 (14 temuan)** |

Pemeriksaan per butir permintaan:

| Butir | Hasil |
|---|---|
| (1) Label sesuai arti di kode (sampel 42 label, §3); tidak ada KUNCI/nilai yang berubah | 38 sesuai, 1 salah (H-1), 3 sebagian (M-1, M-4, L-2). Kunci dan nilai tidak berubah: diff `params/*` hanya mengubah argumen ke-3 (`label`); diff `essentials.ts` hanya mengubah `label`/`help`/`options[].label` (nilai `auto/A/B`, `field/static`, `compact/standard/wide` tetap); `Field.name`/`options`/`kind` di `role-formats-editor.tsx:26-61` tetap; konversi simpan tidak berubah (`role-formats-editor.tsx:330-337`: tw apa adanya, halfPt = n x 2) |
| (2) Jarak baris | BENAR. auto -> `lineTw/240` baris (`role-format-labels.ts:25-30`) cocok dengan HTML `style.ts:119-123` dan DOCX bawaan `auto` bila `lineRule` kosong (`docx/assemble/xml.ts:131`); `overlayRoleFormat` mengganti bagian `para` utuh (`tokens/roles.ts:170-177`) sehingga `lineRule` kosong pada para eksplisit memang auto. Nilai simpan tidak berubah. Batas = skema: `lineTw` 20-1440, `szHalfPt` 8-144, `spacingTw` -200..400, `outlineLvl` 0-8 (`contract/schema/common.schema.ts:55,62,251,262` vs `role-formats-editor.tsx:30,51,54`) |
| (3) Dedup riwayat + indikator tunggal | BENAR. `changedLabel` dedup sesudah pemetaan (`doc-model.ts:468-476`); daftar dokumen ukuran `list` hanya bilah, teks rincian satu baris (`completeness-rail.tsx:247-253`, `document-list.tsx:80-87`). Catatan L-3 (aria-label bilah tidak selaras) |
| (4) Nama tampilan ID | CAUTION (M-2): ID mentah tersedia di Riwayat (`history-tab.tsx:98` title + Info teknis) dan daftar dokumen (`document-list.tsx:91`), tetapi tidak di 5 permukaan lain sementara pemetaan kini lossy |
| (5) Tanpa perubahan API/kontrak/mesin/data | PASS. Tidak ada berkas `engine/`, `services/`, `app/api/` dalam diff. Label `ParamDef` tidak dibaca mesin (grep `def.label|d.label` di `src/lib/studio` hanya chart point label). Satu-satunya efek luar: teks `label`/`help` di respons registri (`?kind=params`, kenop esensial) berubah — teks tampilan, bukan kunci. `convert_v2 --check` SAME (laporan UI-02) konsisten dengan ini |
| (6) Aksesibilitas | PASS dengan catatan (L-3, L-8). `lang="id"` pada wadah Studio, fokus terlihat pada `summary` Tindakan dan judul subbab, `aria-describedby` petunjuk tingkat, label kontrol tetap terhubung (`labelId`) |
| (7) Kualitas | PASS dengan catatan (L-1, L-6, L-9, L-10) |

## 2. Temuan

| # | Derajat | Domain | Berkas:baris | Deskripsi | Rekomendasi |
|---|---|---|---|---|---|
| H-1 | High | Integritas rujukan | `src/lib/studio/registry/essentials.ts:408-413`; `src/lib/studio/params/render.ts:168` | Kenop USER "Nomor halaman daftar isi": opsi `static` diberi label "Daftar tetap tanpa nomor halaman" dan bantuan "daftar tetap tidak memuat nomor halaman". Mesin berkata lain: `staticTocTable` selalu menulis kolom halaman — literal bila ada, selain itu medan PAGEREF (`src/lib/studio/engine/docx/wrapper/pages.ts:384-405`, komentar `:391`; peringatan `:470-473` justru menganggap entri tanpa sasaran halaman sebagai cacat). Perbedaan nyata `field` vs `static` = medan TOC Word yang dapat diperbarui (`pages.ts:408-447`) vs tabel tetap 3 kolom. Label registri `render.toc.mode` "Nomor halaman daftar isi" ikut menyiratkan pilihan ini soal ada/tidaknya nomor. Kesalahan sudah ada sebelum UI-02 ("Tabel statis tanpa nomor"), tetapi UI-02 menulis ulang dan mempertegasnya, padahal mandat D-449 = label sesuai kode | Ganti label kenop + registri menjadi soal bentuk daftar isi, mis. label "Bentuk daftar isi"; `field` = "Otomatis di Word (susunan dan nomor halaman diperbarui saat dibuka)"; `static` = "Tabel tetap (nomor halaman dari rujukan halaman; susunan tidak diperbarui Word)". Tambah uji ui02 yang mengunci teks tanpa "tanpa nomor halaman" |
| M-1 | Medium | Integritas rujukan | `src/components/studio/template-editor/param-labels.ts:12,18-23`; `values.ts:32-44` | `paramDisplayLabel` membuang akhiran "(mm)"/"(derajat)" dengan asumsi satuan tampil dari tipe; `unitOf` hanya mengenal tipe numerik. Probe (`tsx` atas `ALL_PARAMS`, 788 param): 76 label berakhiran satuan, **12 kehilangan satuan sama sekali** (tipe `pair`/`list`/`string`/`object`), 6 di antaranya kelas B yang dapat disunting: `page.customSizeMm` (kotak Lebar/Tinggi tanpa "mm"), `diagram.dashPatternMm.{dashed,dotted,longdash,dashdot,solid}`; lainnya `brief.slideSizeMm`, `page.sizeMm`, `grid.allowedFigureWidthsMm`, `rules.diagramFillHatchDeg`, `diagram.latticeSnap`, `lineWeight.seriesR10Mm` | Buang akhiran hanya bila `unitOf(def.type)` tidak kosong dan sama dengan akhiran; selain itu pertahankan label utuh. Tambah uji untuk `page.customSizeMm` |
| M-2 | Medium | Dampak dependensi | `src/components/studio/shared/labels.ts:256,276-289`; pemanggil: `template-editor/version-history.tsx:134`, `template-editor/template-list.tsx:187`, `document-viewer/reader/paragraph-history.tsx:94`, `shared/completeness-rail.tsx:205,233`, `document-viewer/completeness-tab.tsx:140,228,256` | Keluaran `actorLabel`/`creatorLabel` kini lossy: prefiks `hermes-` dibuang untuk SEMUA ID (bukan hanya profil gsp seperti komentar `:270-274` mengesankan), huruf/pemisah diubah ("hermes-gsp-master01" -> "GSP Master 01"), "seed-studio" -> "Sistem (bawaan)". Sebelum UI-02 permukaan di atas menampilkan ID yang masih dapat dibaca balik; kini tidak ada tooltip/ID mentah di sana. Dua ID yang hanya berbeda prefiks `hermes-` tampil identik. Butir (4) permintaan (ID tetap dapat diakses) belum terpenuhi untuk permukaan ini | Bungkus setiap pemakaian `actorLabel`/`creatorLabel` yang tampil sebagai teks dengan `title={raw}` (komponen kecil `ActorName` di `shared/` menghindari pengulangan); untuk `title` yang sudah memakai `actorLabel` (completeness-tab `:140`, rail `:205`) sertakan ID mentah dalam kurung |
| M-3 | Medium | Integritas rujukan | `src/components/studio/render-status/index.tsx:59`; `src/components/studio/document-viewer/studio-home.tsx:55` | Teks baru "Admin sudah diberi tahu." menyatakan tindakan yang tidak dilakukan sistem: grep `notif|alert|email|telegram` di `src/lib/studio`, `src/app/api/studio/render-env/**` hanya menemukan `apiLog` (`render-env/route.ts:106,118`), tidak ada pengiriman pemberitahuan (hipotesis kuat; tidak ditemukan mekanisme). Kalimat lama ("Admin sudah dapat melihat masalah ini di halaman Sistem") benar walau merujuk diri sendiri. Teks diambil verbatim dari usulan audit UA-M12 tanpa verifikasi | Pakai kalimat yang benar, mis. "PDF sementara tertunda; Word dan halaman web tetap dibuat. Masalah ini tercatat untuk admin." — atau controller memutuskan bila memang ada kanal pemberitahuan di luar repo |
| M-4 | Medium | Integritas rujukan | `src/lib/studio/registry/essentials.ts:360-362`; `src/lib/studio/params/page.ts:303-334` | Kenop "Tampilkan teks tepi sampul": bantuan menyebut isi "(nomor, revisi, tahun)", tetapi medan string punggung adalah `jenis, subjek, bahasa, revisi, bulan, tahun` (`page.ts:313-321`, tanpa nomor); penempatan bawaan juga "pembatas" selain margin luar sampul (`page.ts:324-330`), jadi "tepi sampul" kurang tepat. Kenop ini mengendalikan `device.spine.enabled` di kedua penempatan (`engine/front/apparatus.ts:84`) | Bantuan: "Teks identitas (jenis, subjek, revisi, tahun) berdiri di tepi luar sampul dan halaman pembatas"; selaraskan istilah P4S-21..25 (lihat L-1) |
| L-1 | Low | Keterpeliharaan | `params/page.ts:199-200, 78/133, 303-304, 411/414`; `params/color-type.ts:129-130, 159-160` | Istilah tidak konsisten antar parameter bersaudara sesudah ganti label sebagian: "Garis penanda di atas judul" vs "Tebal Datum Rule (mm)"; "Kolom catatan bukti" vs "Rel bukti (mm)"; "teks tepi sampul" vs "Wajah/Ukuran/Medan string punggung"; "Teks jenis dokumen" vs "Warna kicker sampul"; "Jenis huruf baca" vs "Wajah huruf struktural"; "Jarak antarhuruf label kecil" vs "Pelacakan rapat huruf tampilan". Editor parameter menampilkannya berdampingan | Selaraskan istilah per kelompok (satu istilah per perangkat), teks saja |
| L-2 | Low | Integritas rujukan | `registry/essentials.ts:297` | Opsi "Selalu tampil (kolom 32 mm)" menyematkan nilai bawaan `grid.evidenceRailMm` yang kelas B dan dapat diubah (`page.ts:78`) | Hapus "32 mm" atau tulis "(kolom selebar Rel bukti)" |
| L-3 | Low | Keterpeliharaan (a11y) | `shared/completeness-rail.tsx:137-141, 250, 268` vs `:277` | `aria-label` bilah masih "x dari y bagian terisi" (semua segmen termasuk opsional) sementara teks terlihat "6/6 bagian wajib terisi · 1 opsional kosong" — pembaca layar mendengar angka berbeda | Bangun `railAriaLabel` dari `requiredProgress` |
| L-4 | Low | Keterpeliharaan | `template-editor/role-formats-editor.tsx:387-392` | Pesan batas `lineTw` selalu "Minimum 20 tw (1 pt)" walau aturan auto menampilkan satuan "per 240 = 1 baris" | Pesan mengikuti `lineRule` (auto: "minimal 0,08 baris (20)") |
| L-5 | Low | Integritas rujukan | `template-editor/role-formats-editor.tsx:357` | Hipotesis: "Kolom kosong mengikuti format bawaan gaya" tidak tepat bila sebagian medan satu bagian diisi, karena `overlayRoleFormat` mengganti bagian (`para`/`run`) utuh (`engine/tokens/roles.ts:170-177`), sehingga medan kosong lain tidak lagi mewarisi turunan katalog (HTML: tidak dipancarkan, `html/blocks/style.ts:115-128`). Perlu konfirmasi kaskade gaya DOCX | Konfirmasi; bila benar tulis "Bagian yang tidak diisi sama sekali mengikuti format bawaan gaya; bila satu medan diisi, medan lain bagian itu memakai bawaan Word" |
| L-6 | Low | Duplikasi | `shared/labels.ts:294-302` vs `prisma/seed-studio.ts:149, 917-937, 1056, 1184`; `role-format-labels.ts:85-113` vs `param-labels.ts:26-86` | Deskripsi awam 7 templat bawaan ditulis dua kali (UI + seed) dan peta UI menutupi deskripsi yang diubah admin lewat API (`app/api/studio/templates/[id]/route.ts` menerima `description`); dua peta nama kelompok tumpang-tindih (cover, wrapper, chapter, caption, table, aside, toc, appendix, sourceRegister, controlSheet, derivation) dan "Bagian" dipakai untuk `slot` (`param-labels.ts:84`) sekaligus `part` (`role-format-labels.ts:89`) | Satu sumber deskripsi (ekspor konstanta dipakai seed + UI, atau peta hanya bila deskripsi DB = teks seed lama); satu peta kelompok bersama; `part` -> "Bagian buku" atau `slot` -> "Bagian dokumen" |
| L-7 | Low | Struktur | `template-preview/index.tsx:142-155, 247-249` | `srcDoc` dibuat ulang saat lebar awal 0 -> terukur dan setiap perubahan skala >= 0,01, sehingga iframe dimuat ulang (kedip, posisi gulir hilang) | Tunda render iframe sampai `boxWidth > 0`; debounce perubahan zoom |
| L-8 | Low | Keterpeliharaan (a11y) | `template-preview/index.tsx:347-354` | Tombol memakai `aria-pressed` sekaligus mengganti teksnya ("Ukuran asli (100%)" <-> "Sesuaikan lebar"); pola ARIA toggle mensyaratkan label tetap | Pilih salah satu: label tetap + `aria-pressed`, atau tanpa `aria-pressed` |
| L-9 | Low | Struktur / Keterpeliharaan | `section-composer/advanced-panel.tsx:17-18`; rujukan basi: `engine/front/apparatus.ts:84`, `engine/html/blocks/wrapper.ts:326`, `tests/unit/studio/renderers/fixf-device-placement-parity.test.ts:4,105`, `tests/unit/studio/structure/fixhr3-d16-rail-authority.test.ts:74` | `section-composer` kini bergantung pada internal `template-editor` (`api`, `param-labels`); komentar/judul uji masih menyebut label lama "Tampilkan string punggung", "Rel bukti" | Pindahkan `param-labels.ts` ke `shared/`; perbarui teks komentar/uji pada siklus berikut (berkas engine milik ENG-01 — jangan disentuh paralel) |

Catatan tambahan (bukan temuan UI-02): `npx tsc --noEmit` rc 2 — keempat galat di `scripts/studio/mcp/tools.ts:1097` dan `tests/unit/studio/mcp/mcp-server.test.ts:45` (pekerjaan MCP-04 yang sedang berjalan). `vitest tests/unit/studio --exclude mcp/**`: 162 lulus, 3 berkas gagal (2 uji: `renderers/fixtl-toc-levels-roles.test.ts`, `renderers/fixserah-front-apparatus.test.ts`) — keduanya tidak mengimpor `components/studio`, `params` atau `essentials`; working tree memuat perubahan ENG-01 di `engine/html/blocks/{style,text,wrapper}.ts`. Bukan akibat UI-02, tetapi gerbang akhir harus dijalankan ulang sesudah ENG-01 dan MCP-04 selesai.

## 3. Sampel label vs arti di kode (42)

| # | Label (berkas:baris) | Arti di kode | Vonis |
|---|---|---|---|
| 1 | EK-G03 bantuan "Rapat = x0,75, Lega = x1,25" (`essentials.ts:225`) | `DENSITY_FACTOR` compact 0.75 (`engine/tokens/layer.ts:54`), classNote `structure.ts:92` | Sesuai |
| 2 | EK-G04 "Warna aksen" (`essentials.ts:239`) | `color.interior.signal` (`color-type.ts:80`) | Sesuai |
| 3 | EK-G05 "8-12 pt" (`essentials.ts:250`) | `range {min 8, max 12, step 0.5}` (`essentials.ts:253`) | Sesuai |
| 4 | EK-G08 "Kolom catatan bukti" (`essentials.ts:290`) | `layout.railMode` (`page.ts:133-139`) | Sesuai |
| 5 | EK-G08 `auto` "muncul bila ada sitasi per paragraf" | `resolveRailMode(p, ctx.railCitations)` (`tokens/grid.ts:397`), classNote `page.ts:138` | Sesuai |
| 6 | EK-G08 `A` "Selalu tampil (kolom 32 mm)" | 3 kolom teks/gutter/rel (`docx/blocks/rail.ts:55`); lebar = `grid.evidenceRailMm` kelas B (`page.ts:78`) | Sebagian (L-2) |
| 7 | EK-G08 `B` "Tidak tampil (teks lebih lebar)" | satu kolom `text + gutter + rail` (`rail.ts:55`) | Sesuai |
| 8 | EK-cover-02 bantuan "Paragraf ringkas di bawah judul sampul" | `cover.elementOrder` anggota standfirst (`essentials.ts:319-321`) | Sesuai |
| 9 | EK-cover-06 "Tampilkan teks tepi sampul" + bantuan | `device.spine.*` medan/penempatan (`page.ts:303-334`) | Sebagian (M-4) |
| 10 | EK-toc-01 `field` | medan TOC + PAGEREF (`docx/wrapper/pages.ts:408-447`) | Sesuai |
| 11 | EK-toc-01 `static` "tanpa nomor halaman" | tabel 3 kolom dengan kolom halaman (`pages.ts:384-405`) | **Salah (H-1)** |
| 12 | `render.toc.mode` "Nomor halaman daftar isi" (`render.ts:168`) | idem | **Menyesatkan (H-1)** |
| 13 | EK-chapter-01 bantuan "{n} di tempat nomor" (`essentials.ts:433`) | `chapter.kicker.pattern` "BAB {n}" (`page.ts:533`) | Sesuai |
| 14 | EK-chapter-02 / EK-appendix-03 "Garis penanda di atas judul ..." | `device.datumRule.enabled` (`page.ts:199`) | Sesuai (istilah L-1) |
| 15 | EK-chapter-07 "Kepala halaman di halaman bab" (`essentials.ts:463`) | `slot.setup` medan runningHead (`essentials.ts:466-468`) | Sesuai |
| 16 | EK-chapter-04 / `chart.widthClass` "Lebar grafik" | `structure.ts:123` enum text/full | Sesuai |
| 17 | P5-17 "Keterangan tabel wajib, di atas tabel" (`apparatus.ts:87`) | `caption.required` kelompok P5 tabel | Sesuai |
| 18 | P6-02 "Klasifikasi bawaan" (`apparatus.ts:265`) | = EK-G07 (`essentials.ts:272-285`) | Sesuai |
| 19 | P4C-18 "Warna latar ringkasan komando (gelap)" (`color-type.ts:87`) | `color.brief.ground` 0E1216 | Sesuai |
| 20 | P4T-01 "Jenis huruf baca (serif)" (`color-type.ts:129`) | `type.face.serif` | Sesuai (istilah L-1) |
| 21 | P4T-16 "Jarak antarhuruf label kecil (renggang)" (`color-type.ts:160`) | tipe `em`; satuan dari `unitOf` (`values.ts:35`) | Sesuai |
| 22 | P7-28 "Ubin dan meteran dasbor dalam dokumen" (`figure.ts:173`) | classNote "tile dan gauge hanya di layar hidup" | Sesuai |
| 23 | P9-52 "Diagram Mermaid dalam berkas hasil" (`figure.ts:438`) | classNote "Mermaid untuk draf saja" | Sesuai |
| 24 | P3-23 "Bahasa" (`governance-language.ts:124`) | `doc.language` = EK-G06 | Sesuai |
| 25 | PD-01 "Kolom daftar sumber" (`governance-language.ts:410`) | = EK-sourceRegister-01 | Sesuai |
| 26 | P4S-15 "Tampilkan pita segel" (`page.ts:288`) | `device.sealBand.enabled` | Sesuai |
| 27 | P4V-08 "Teks jenis dokumen" (`page.ts:414`) | classNote "diisi per dokumen dari jenis dokumen" | Sesuai |
| 28 | P4V-09 "Paragraf pengantar miring" (`page.ts:418`) | `cover.standfirst.italic` | Sesuai |
| 29 | `render.html.paged` "Halaman web dibagi per halaman cetak" (`render.ts:176`) | tidak ada pembaca di `engine/` (grep) | Sesuai dengan nama kunci; perilaku tidak dapat diverifikasi |
| 30 | `page.orientation` "Orientasi" (`structure.ts:83`) | = EK-G02 | Sesuai |
| 31 | `appendix.kicker.pattern` "Label nomor lampiran" (`structure.ts:131`) | pattern `\{n\}` | Sesuai |
| 32 | `lineTw` label dinamis (`role-formats-editor.tsx:418-420`) | HTML `/240` bila bukan exact/atLeast (`html/blocks/style.ts:119-123`); DOCX bawaan auto (`docx/assemble/xml.ts:131`) | Sesuai |
| 33 | `lineRule` "Kelipatan baris/Tepat/Minimal" (`role-format-labels.ts:44`) | enum skema `common.schema.ts:252` | Sesuai |
| 34 | `szHalfPt` "Ukuran huruf (4-72 pt)", min 8 max 144 (`role-formats-editor.tsx:51`) | skema 8-144 (`common.schema.ts:55`); atribut input /2 (`:439-440`) | Sesuai |
| 35 | `spacingTw` "Jarak antarhuruf" -200..400 (`role-formats-editor.tsx:54`) | skema `common.schema.ts:62` | Sesuai |
| 36 | `outlineLvl` "(0 = tingkat 1)" (`role-formats-editor.tsx:43`) | skema 0-8 (`common.schema.ts:262`); OOXML 0 = Level 1 | Sesuai |
| 37 | `face` "isi ini atau peran huruf, bukan keduanya" (`role-formats-editor.tsx:49`) | `atMostOne("face","faceRole")` (`common.schema.ts:66`) | Sesuai |
| 38 | `smallCaps` "Kapital kecil" (medan baru di editor, `:59`) | sudah ada di kontrak (`common.schema.ts:61`) | Sesuai (tanpa perubahan kontrak) |
| 39 | `keepNext/keepLines/pageBreakBefore/widowControl` (`:44-47`) | semantik OOXML w:keepNext/keepLines/pageBreakBefore/widowControl | Sesuai |
| 40 | Kelas "Standar DATUM (admin)" / alasan kunci (`shared.tsx:17`, `param-rules.ts:36-40`) | K hanya ADMIN (KT-16) | Sesuai |
| 41 | Alasan kelas T "Dihitung otomatis ... tidak dapat diubah" (`param-rules.ts:29-31`) | `effectiveClass` T, hanya-baca | Sesuai |
| 42 | `page.customSizeMm` tampil "Ukuran kertas kustom" Lebar/Tinggi (`structure.ts:87`, `param-labels.ts:18-23,118-121`) | `[lebar, tinggi]` mm; tipe `pair` tanpa satuan | Sebagian (M-1) |

## 4. Baris perbaikan berpemilik (High/Medium)

| Baris | Temuan | Pemilik | Berkas | Bukti selesai |
|---|---|---|---|---|
| UI-04a | H-1 label/bantuan/opsi daftar isi | coder-execution (kepemilikan UI-02: `src/lib/studio/registry`, `src/lib/studio/params` hanya `label`) | `registry/essentials.ts:405-416`, `params/render.ts:168`, uji ui02 | teks tidak lagi menyebut "tanpa nomor halaman"; uji baru lulus; `convert_v2 --check` SAME |
| UI-04b | M-1 satuan hilang | coder-execution | `template-editor/param-labels.ts` (+ uji) | probe: 0 dari 76 label kehilangan satuan |
| UI-04c | M-2 ID mentah di tooltip | coder-execution | `shared/labels.ts` (komponen kecil), 5 pemanggil di §2 | setiap permukaan nama pelaku punya `title` berisi ID mentah; uji lama `actorLabel('agent:analis-01')` tetap |
| UI-04d | M-3 klaim "Admin sudah diberi tahu" | coder-execution (teks); controller bila ada kanal pemberitahuan | `render-status/index.tsx:59`, `document-viewer/studio-home.tsx:55` | kalimat tidak lagi mengklaim pemberitahuan aktif |
| UI-04e | M-4 bantuan string punggung | coder-execution | `registry/essentials.ts:358-362` (+ opsional P4S-21..25 label) | bantuan cocok dengan `device.spine.fields/placements` |

Low (L-1..L-9) dapat ikut UI-04 bila murah; L-9 bagian engine/uji renderer hanya sesudah ENG-01 selesai.

## 5. Tantangan utama

1. Mandat D-449 adalah "label sesuai arti di kode", tetapi beberapa teks diambil verbatim dari usulan audit (UA-M12 "Admin sudah diberi tahu", L-label daftar isi) tanpa dicek ke mesin. Audit menghasilkan usulan, bukan kebenaran; setiap label perlu bukti `file:baris` di sisi mesin.
2. Strategi "buang akhiran satuan karena satuan tampil dari tipe" benar untuk tipe numerik saja; diuji pada contoh numerik (`ui02-config-labels.test.ts:82-87`) sehingga 12 kasus non-numerik lolos.
3. Nama tampilan agen dibuat heuristik (regex) tanpa registri; konsekuensinya harus dikompensasi dengan ID mentah di setiap permukaan, bukan hanya dua.

## 6. Temuan positif

- Disiplin "hanya teks": tidak ada kunci, nilai enum, tipe, `Field.name`, atau jalur simpan yang berubah; label kontrak baru (`enumLabels`, `pairLabels`) sengaja tidak ditambahkan (laporan UI-02, keputusan L23-L24).
- Logika murni dipisah ke modul teruji (`completeness-text.ts`, `role-format-labels.ts`, `param-labels.ts`, `preview-html.ts` `fitZoom`/`maxPageWidthMm`); 28 uji ui02 lulus.
- Jarak baris benar terhadap kedua mesin dan batas input kini = skema (sebelumnya UI menerima 0 dan > 1440 lalu ditolak server).
- Pratinjau diskala tanpa skrip di iframe (gaya `html{zoom}` disisipkan di induk; sandbox tetap).
- Diagnosis UA-M02 berhenti di batas kepemilikan dan diserahkan ke ENG-01, bukan menambal di UI.
- Dedup riwayat dilakukan sesudah pemetaan, sesuai akar masalah; `initials()` yang mati dihapus.

## 7. Bukti perintah (segar, 2026-11-01)

| Perintah | Hasil |
|---|---|
| `npx vitest run tests/unit/studio/ui02` | 2 berkas, 28/28 lulus |
| `npx eslint src/app/studio src/components/studio src/lib/studio/registry src/lib/studio/params tests/unit/studio/ui02` | rc 0 |
| `npx tsc --noEmit -p .` | rc 2; 4 galat, semuanya di `scripts/studio/mcp/tools.ts` dan `tests/unit/studio/mcp/mcp-server.test.ts` (MCP-04, di luar lingkup); 0 galat di lingkup UI |
| `npx vitest run tests/unit/studio --exclude "tests/unit/studio/mcp/**"` | 165 berkas: 162 lulus, 3 gagal (2 uji renderer, terkait perubahan ENG-01 yang belum selesai di `engine/html`); 3528 lulus / 2 gagal / 1 skip |
| probe satuan (`npx tsx` skrip di scratchpad atas `ALL_PARAMS` + `unitOf`) | `{ total: 788, withSuffix: 76, unitLost: 12 }` |
| grep label lama di repo | hanya komentar/judul uji (L-9); tidak ada kode yang membaca label sebagai kunci |

Audit Playwright tidak dijalankan ulang: working tree DEV sedang diubah ENG-01 (mesin HTML) sehingga hasil visual tidak akan menilai UI-02 saja; layar admin tetap hanya terverifikasi lewat kode (keterbatasan yang sama dengan UI-02).

## 8. Berkas yang dibaca

Diff penuh: semua 38 berkas dalam `git diff HEAD --stat` lingkup + `template-editor/param-labels.ts`, `template-editor/role-format-labels.ts`, `shared/completeness-text.ts`, `tests/unit/studio/ui02/*` (daftar uji). Berkas terdampak/acuan: `template-editor/values.ts`, `template-editor/param-control.tsx` (`ReadonlyValue`), `template-editor/api.ts`, `shared/use-studio-query.ts`, `shared/completeness-rail.tsx` (utuh 120-285), `document-viewer/document-list.tsx:55-95`, `document-viewer/completeness-tab.tsx:125-150`, `contract/schema/common.schema.ts:40-70,235-275`, `engine/tokens/index.ts:130-170`, `engine/tokens/roles.ts:126,141-177`, `engine/tokens/layer.ts:44-130`, `engine/html/blocks/style.ts:115-128`, `engine/docx/assemble/xml.ts:131`, `engine/docx/assemble/index.ts:414-430`, `engine/docx/wrapper/pages.ts:370-480`, `engine/docx/blocks/rail.ts:55-63`, `params/page.ts:70-140,196-335,405-420,530-535`, `params/structure.ts:80-135`, `registry/essentials.ts:185-600`, `services/submit/change.ts:45-59`, `services/ingest/repository.ts:315`, `app/api/studio/render-env/route.ts`, `prisma/seed-studio.ts:149,280-300,686-720`, `review/ui_audit_studio.md` (UA-M03/M05/M06/M12, L21/L22/L26), `decisions.md` D-449/D-459/D-463, `delegation_progress/coder_execution_ui_02.md`.
