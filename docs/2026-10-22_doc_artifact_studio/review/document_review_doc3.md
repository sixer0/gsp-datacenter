---
agent: document-reviewer
date: 2026-10-30
mode: 1
cycle: 1
cycle_cap: 3
deliverable: DOC-3/DOC-3b (D-321..D-338) - docs/STUDIO-AGENT-GUIDE.md; docs/API-REFERENCE.md §12; masterplan/03_structural_sections_specs.md
verdict: NEEDS_REVISION
caller_verdict: CAUTION
status: complete
---

# Review dokumen DOC-3/DOC-3b (siklus 1)

## 1. Lingkup dan bukti

| Berkas | Ukuran saat review |
|---|---|
| `docs/STUDIO-AGENT-GUIDE.md` | 1651 baris |
| `docs/API-REFERENCE.md` §12 | 392 baris (berkas) |
| `docs/2026-10-22_doc_artifact_studio/masterplan/03_structural_sections_specs.md` | 1247 baris |

- Mode 1, tier internal; pembaca utama adalah agen AI (Hermes) dan controller.
- Skill: `document-quality-standards` (Modul C, D, E, F, H).
- Skrip bukti ada di `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/doc3/verify_doc3.ts`, bukan di `doc2/` seperti tertulis di brief. Saya jalankan ulang dengan `npx tsx` dari root repo: exit 0, `140 PASS, 0 FAIL`, `SEMUA LULUS`.
- Pembanding keluhan Hermes: `hermes_trial/02_trial_feedback.md:44-45` (bagian F). `03_retrial_feedback.md` masih 0 byte, jadi belum ada umpan balik Hermes atas panduan baru.
- Emoji: pindai `python -I` ketiga berkas, 0 hit.

## 2. Verdict per dimensi

| # | Dimensi | Verdict | Ringkasan |
|---|---|---|---|
| 1 | Akurasi (30 klaim) | CAUTION | 27 cocok; 3 kurang tepat (m-1, m-3, m-4), semuanya Minor |
| 2 | D-139 | PASS | Agen tidak diminta mengatur tampilan; rel, alt, lebar, framePr, dan TOC dinyatakan milik templat dan mesin |
| 3 | Kecukupan §1.1 untuk agen (Hermes, bagian F) | CAUTION | Kelima kekosongan bagian F sudah ditutup di seksi rinci; tetapi §1.1 tidak menyebut syarat membuat dokumen pada bab pertama, sehingga agen yang hanya membaca §1.1 terkena 400 (M-1, Major) |
| 4 | Konsistensi antar dokumen | CAUTION | Urutan galat, 69 kode, importer, dan 409 overwrite selaras di ketiga dokumen; tabel §12 panduan tertinggal dari §5.5/§5.6 (m-2) |
| 5 | Tanpa emoji | PASS | 0 hit |

## 3. Dimensi 1: sampel klaim

| # | Klaim (lokasi) | Bukti kode | Status |
|---|---|---|---|
| 1 | 8 nilai `role` (panduan §4.2 :355-368) | `contract/enums.ts:388` | Pass |
| 2 | Peran retoris dicetak sama dengan `body` (:370) | `engine/docx/blocks/text.ts:66-75` | Pass |
| 3 | Rel mati: baris rel di bawah paragraf (:378-380) | `engine/docx/blocks/rail.ts:87-88` (moda B) | Pass |
| 4 | `datum-gsp` v3 rel `framePr` (§3 :149-152) | `prisma/seed-studio.ts:452-453`, `:515`; D-329 | Pass |
| 5 | TOC memuat rujukan halaman (§3) | `engine/docx/wrapper/pages.ts:314`, `:345`; `engine/docx/blocks/structure.ts:112` (PAGEREF) | Pass |
| 6 | Pindah versi lewat op `templateVersion`, contoh lolos | rerun verify (structure-patch lewat `parsePatchStructureBody`) | Pass |
| 7 | 409 overwrite: `reason`, `overwrittenPids`, isi `details` (§5.3 :582-605; API) | `services/submit/overwrite.ts:1-20`, `:367`, `:386-390`; rerun: contoh identik dengan keluaran layanan | Pass |
| 8 | Overwrite dipicu "PATCH per pid atau alamat" pada "bab atau slot" (§5.3 :583-584) | `overwrite.ts:6-8`: juga `structure:renumberChapters` (R14) dan kiriman dokumen bertarget (R04) | Kurang lengkap (m-4) |
| 9 | Dry-run R08 menerapkan aturan yang sama, `details` identik (§5.3, §5.5) | `validate/_shared/error-issues.ts`; D-331 | Pass |
| 10 | Kuota R08 120/60 + kuota render 30/60 untuk `?preview=html` (§5.5 :730) | `validate/route.ts:439-446`; `validate/_shared/validate-rate.ts:22` | Pass |
| 11 | Badan importer dan medan respons (§5.6 :752-760) | `import/markdown/route.ts:6-11`, `:39` (`ALLOWED_FIELDS`) | Pass |
| 12 | `template`/`meta`/`slot` hanya sah bersama `target` | `route.ts:72-74` | Pass |
| 13 | Batas importer 4 MiB, 1.000.000 karakter, 200.000 baris, 50.000 blok, 100 kolom, beserta `details.reason` (:764-771) | `services/import/markdown.ts:63-75`, `:79`, `:514`, `:681`, `:700`, `:704` | Pass |
| 14 | Kuota impor 60/60 s, ember sendiri; `?validate=1` juga di ember R08 | `import/markdown/_lib/import-rate.ts:11-19`; `route.ts:12-14` | Pass |
| 15 | Komentar `<!-- role: X -->` + tiga peringatan | `markdown.ts:143-152` | Pass |
| 16 | Alias penanda `[PUBLIC-SOURCE]`→TERUKUR, `[VENDOR]`→PEMASOK, lainnya `UNMAPPED_MARKER` | `markdown.ts:107-110`, `:251-258` | Pass |
| 17 | `TABLE_SOURCE_MISSING` untuk tabel bercaption tanpa `Sumber:` | `markdown.ts:548` | Pass |
| 18 | `###` menjadi `subheading`; penomoran dibuang `NUMBERING` | `markdown.ts:9`, `:226`, `:414` | Pass |
| 19 | Opsi CLI dan kode keluar 0/1/2 (:780-784) | `scripts/studio/md2chapter.ts:4-17` | Pass |
| 20 | Contoh Markdown dikonversi tanpa isu dan menghasilkan `closingAction` | rerun verify (probe importer) | Pass |
| 21 | D16 colophon menyalakan `issueStampColophon`; NOT_APPLICABLE hanya dari lapis ADMIN (§5.7) | `engine/lint/structure/checks-d.ts:457-466`, `:538-626` | Pass |
| 22 | D17 `identityString` atau `role: identity` di halaman depan/bab pertama; D18 `closingAction` di mana pun; NOT_RUN per kunci | `checks-d.ts:649-668` | Pass |
| 23 | Medan `CoverPayloadV2` (§5.4 :687-696) | `contract/schema/v2/common.schema.ts:535-553` | Pass |
| 24 | 503 preflight: `details`, `Retry-After: 300`, 12 kode penyebab (§8.0 :1105-1134) | `services/render/preflight.ts:28-74`, `:206`; `contract/env.ts:53` (300.000 ms) | Pass |
| 25 | Urutan galat render "401 → 404 → 409/422 → 503"; "503 hanya muncul untuk permintaan yang sasarannya sah" (§8.0 :1136-1137; API :303-304; register :804 (c)) | `render/_lib/handler.ts:5-7`: 400 badan, 429 laju, dan 503 `RENDER_QUEUE_FULL` diperiksa SEBELUM `renderScope` (404); sama di R07 `revisions/route.ts:127-129` | Kurang tepat (m-1) |
| 26 | R09 tanpa gerbang PDF; `partial`/`failedFormats`/header di R17, R07, R09 | `services/render/scope.ts:256`, `services/revisions/index.ts:575` (hanya dua pemanggil); `artifacts/route.ts:11-12` | Pass |
| 27 | `ROUTE_NOT_FOUND` anggota enum, 404, 69 kode | `contract/enums.ts:332`; `contract/errors.ts:94`; hitung `STUDIO_ERROR_CODES` = 69 | Pass |
| 28 | Badan 404 `{ error, code, message, hint, correlationId, details: { method, path, suggestion? } }`, HEAD tanpa badan, hint `POST /documents/{id}/slots` | `http/route-not-found.ts:66-80`, `:258-299` | Pass |
| 29 | Metode catch-all "GET, POST, PUT, PATCH, DELETE, HEAD" (panduan :1445; API :309; register :804) | `[[...notfound]]/route.ts:30-36` juga mengekspor `OPTIONS` | Kurang lengkap (m-3) |
| 30 | Nama figur "Gambar n.m — caption" ≤ 80; tinggi minimum 32 mm untuk ≤ 3 batang (§10 :1384-1389) | `engine/front/alt-text.ts:6-8`, `:44`, `:48`; `engine/chart/core/datum.ts:30-37` | Pass |

## 4. Dimensi 2: D-139

| Cek | Status | Bukti |
|---|---|---|
| Rel: agen mengisi baris, templat menentukan bentuk cetak | Pass | Panduan :376-381 "Agen hanya mengisi baris rel" |
| Alt/nama figur dan dekoratif dari mesin | Pass | :1384-1389 "agen tidak perlu menandainya" |
| Peran retoris = makna, bukan tampilan | Pass | :355, :370 |
| Pindah versi templat | Pass dengan catatan | §3 :152-166: agen memilih VERSI templat, bukan medan tampilan, jadi konsisten dengan "sebut templat, bukan parameter". Saran (bukan temuan): sebutkan bahwa pindah versi sebaiknya atas permintaan controller karena mengubah tampilan seluruh dokumen |

## 5. Dimensi 3: kecukupan §1.1 dan bagian F Hermes

| Kekosongan bagian F (`02_trial_feedback.md:45`) | Status sekarang |
|---|---|
| Bentuk `CoverPayloadV2` dan cara menemukan schemaId | Tertutup, §5.4 :687-701 |
| `rail` dan peran `identity`/`anchor`/`pivot`/`closingAction` | Tertutup, §4.2 |
| Cara memenuhi D16-D18 | Tertutup, §5.7 |
| Arti job PARTIAL dan HTTP 200 | Tertutup, §8 :1097-1103 dan §1.1 langkah 5 |
| Path salah tidak dibantu server | Tertutup, 404 `ROUTE_NOT_FOUND` + `hint` |

§1.1 (:60-87) adalah daftar 7 langkah dengan rujukan seksi. Urutannya benar dan teruji (D-321). Agen tetap harus membuka seksi lain untuk empat hal berikut:

1. Bentuk `target` dan syarat pembuatan dokumen (M-1, di bawah).
2. Header autentikasi dan `Content-Type` (§2). §1.1 tidak menyebutnya; satu baris rujukan "seksi 2" sudah cukup.
3. Kuota: impor 60/60, validasi 120/60, dan kiriman berbagi 30/60 dengan render. Ini relevan untuk 10 bab paralel.
4. Apa yang perlu disimpan (`document.id`, `revisionNo`, `x-correlation-id`). Hal ini ada di §1 :58, tepat di atas §1.1.

Panduan kini 1651 baris, sebelumnya 1307 baris saat Hermes mengeluh.

## 6. Temuan

| ID | Tingkat | Lokasi | Deskripsi | Bukti | Rute |
|---|---|---|---|---|---|
| M-1 | Major | Panduan §1.1 langkah 1 dan 3 (:63-74) | §1.1 menyebut `{ markdown, chapterKey, target }` dan "Bab pertama ke dokumen misi yang belum ada membuat dokumennya", tetapi tidak menyebut bentuk `target` (`{ mission: { folder }, docKey? }` untuk dokumen baru, `{ documentId }` sesudahnya), dan tidak menyebut bahwa kiriman yang membuat dokumen wajib membawa `template` dan `meta.title`. Agen yang hanya mengikuti §1.1 akan menerima `400 META_REQUIRED_FOR_CREATE` pada bab pertama. Jalur CLI di langkah 1 tidak punya opsi `--template`/`--meta`, jadi amplop CLI dengan `--mission` tidak pernah dapat membuat dokumen. Usulan: tambah satu kalimat dan satu contoh badan importer untuk bab pertama (`target.mission`, `template: { slug: "datum-gsp" }`, `meta: { title }`), lalu `target.documentId` untuk bab berikutnya; untuk CLI, nyatakan batasannya atau minta opsi baru | `services/submit/meta.ts:53-63`; `services/submit/pipeline.ts:748`; `import/markdown/route.ts:72-74`; `scripts/studio/md2chapter.ts:6-13` | `document-specialist` (teks); opsi CLI = keputusan controller |
| m-1 | Minor | Panduan §8.0 :1136-1137; API :303-304; register :804 (c) | Urutan "401 → 404 → 409/422 → 503" hanya urutan galat sasaran. 400 badan, 429 laju, dan 503 `RENDER_QUEUE_FULL` terjadi sebelum 404. Kalimat panduan "Jadi `503` hanya muncul untuk permintaan yang sasarannya sah" salah untuk `RENDER_QUEUE_FULL`. Usulan: tulis "400 → 429 → 503 antrean → 404 → 409/422 → 503 preflight", atau batasi kalimat itu ke "503 preflight" | `render/_lib/handler.ts:5-14`; `revisions/route.ts:127-129` | `document-specialist` |
| m-2 | Minor | Panduan §12 :1459 dan :1484 | Baris 413 hanya "badan JSON > 5 MiB" dengan tindakan "unggah aset". Importer menjawab 413 untuk badan > 4 MiB atau `details.reason` `MD_*`, dan tindakannya memecah bab (§5.6). Baris 429 tidak menyebut kuota impor 60/60 maupun kuota validasi 120/60, padahal §5.5/§5.6 menyebutnya. Agen yang membaca tabel galat saja mendapat tindakan yang salah | §5.5 :730, §5.6 :764-771 | `document-specialist` |
| m-3 | Minor | Panduan :1445; API :309; register :804 | Daftar metode catch-all tidak memuat `OPTIONS`, yang juga dijawab 404 JSON | `[[...notfound]]/route.ts:36` | `document-specialist` |
| m-4 | Minor | Panduan §5.3 :582-586 | Pemicu overwrite juga mencakup `renumberChapters` (R14) dan kiriman dokumen bertarget (R04). API :317 sudah menyebut R04; panduan belum menyebut keduanya | `overwrite.ts:6-8`, `:14-16` | `document-specialist` |
| m-5 | Minor | Panduan §12 :1423 vs §8.0 contoh 503, §12 baris 404 | Format galat dinyatakan `error` = "pesan Indonesia", tetapi `error` 503 preflight (`PDF engine not ready; ...`), `message`/`hint` `ROUTE_NOT_FOUND`, dan `error` 409 overwrite tidak seragam: dua pertama berbahasa Inggris. `details.reason` 503 dan `forwardToController` 409 berbahasa Indonesia. Pilih: ubah kalimat §12 ("pesan; teks awam Indonesia ada di `details.reason`/`forwardToController`"), atau terjemahkan pesan di kode | `services/render/preflight.ts:32`; `http/route-not-found.ts:269` | controller (pilih teks atau kode); `document-specialist` bila teks |

Informasi (bukan temuan): (1) §10 :1386 "figur tanpa caption" tidak dapat terjadi pada konten v2 karena `caption` wajib (D-222); kalimat ini hanya relevan untuk artefak/v1. (2) Lokasi skrip bukti di brief salah (`doc2/` seharusnya `doc3/`). (3) Retrial Hermes (`03_retrial_feedback.md`) belum berisi, jadi kecukupan §1.1 belum diuji pembaca nyata.

Jumlah: 0 Critical, 1 Major, 5 Minor.

## 7. Konsistensi antar dokumen

| Butir | Panduan | API §12 | Register | Status |
|---|---|---|---|---|
| Urutan galat render | :1136 | :303 | :804 (c) | Selaras (ketiganya punya celah m-1 yang sama) |
| 69 kode, `ROUTE_NOT_FOUND` | :1445 | :252, :313 | :804 (a), :1212 | Pass |
| Importer: badan, batas, kuota, role | §5.6 | :376 | :908 | Pass |
| 409 `PATCHED_PIDS_OVERWRITTEN` | §5.3 | :317-323 | :804 (b) | Pass (cakupan pemicu lihat m-4) |
| R09 tanpa preflight | :1138 | :304 | :804 (c) | Pass |
| D16 lapis ADMIN | §5.7 | - | :804 (d) | Pass |
| Tabel galat §12 vs seksi rinci | :1459, :1484 vs §5.5/§5.6 | - | - | Fail kecil (m-2) |

Tujuh sumbu: terminologi Pass; format angka Pass ("1.000.000", "60/60 s"); gaya Pass; hierarki judul Pass (§1.1, §4.2, §5.6, §5.7, §8.0 bersarang benar; judul Markdown di dalam blok contoh §5.6 :810-827 berada di dalam pagar kode); kapitalisasi Pass; satuan Pass; rujukan Pass.

## 8. Verdict dan tindakan berikutnya

- Verdict: **NEEDS_REVISION** (CAUTION menurut skala pemanggil), karena satu Major (M-1) membuat §1.1 gagal pada langkah pertama untuk dokumen misi baru. Isi rinci lainnya akurat (27/30), dan `verify_doc3.ts` 140/140.
- Rute: `document-specialist` memperbaiki M-1 dan m-1..m-4 dalam satu revisi. Untuk m-5, controller memilih antara mengubah teks atau kode. Opsi `--template`/`--meta` di CLI adalah keputusan controller.
- Siklus 2 dari 3 cukup memeriksa §1.1, §8.0, §12, §5.3, dan baris yang disentuh.
