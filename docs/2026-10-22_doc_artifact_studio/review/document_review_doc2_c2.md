---
agent: document-reviewer
date: 2026-10-23
mode: 1
cycle: 2
cycle_cap: 3
deliverable: DOC-2 revisi (D-286, D-290) - STUDIO-AGENT-GUIDE.md, API-REFERENCE.md §12, masterplan/03_structural_sections_specs.md, STUDIO-ROLLBACK-RUNBOOK.md, prisma/rollback/*.sql
verdict: APPROVED
caller_verdict: PASS
status: complete
prior_report: review/document_review_doc2.md
---

# Re-review DOC-2 (siklus 2)

## 1. Lingkup dan bukti

- Berkas pada saat review: panduan 1304 baris, API 358 baris, register 1235 baris, runbook 298 baris. SQL rollback tidak berubah (sha `10549a93...`, `a28a7a15...`).
- `npx tsx C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/doc2/verify_doc2.ts` saya jalankan ulang dari root repo: exit 0, `104 PASS, 0 FAIL`, `SEMUA LULUS`.
- Runbook: 18 blok ```bash``` diekstrak (indentasi daftar dibuang seperti tampilan Markdown) ke `C:/Users/TRIAL/AppData/Local/Temp/rbchk_review/`. Folder ini dipakai karena path scratchpad melewati batas path Win32; isinya hanya salinan blok. `bash -n` pada ke-18 blok: semua OK.
- Penelusuran perintah DB (gabungan baris `\` diperhitungkan): setiap perintah `psql`/`pg_dump`/`pg_restore`/`prisma` yang menyentuh DB memakai `STUDIO_RB_URL` dan diawali `rb_guard &&`. Ada dua pengecualian yang tidak mengubah apa pun: `psql --version` dan `pg_restore --list <berkas>` (berkas lokal, tanpa koneksi). Kueri baca `server_version` (:71) dijalankan sebelum `rb_guard` didefinisikan, tetapi tetap memakai `STUDIO_RB_URL`.
- Emoji: 0 di keempat dokumen.

## 2. Temuan siklus 1

| ID | Status | Bukti |
|---|---|---|
| R-1 | Resolved | Runbook :3 dan :40 memuat teks D-286 kata per kata ("Runbook ini hanya digladikan di `gsp_agent_hq_v21_uji`. Agen AI DILARANG menjalankannya pada DB produksi `gsp_agent_hq`. Rollback produksi hanya oleh pemilik sistem ..."). Izin lama "rollback di produksi dengan gladi ulang" sudah hilang. `rb_guard` juga berhenti bila DB = `gsp_agent_hq` (:82) |
| R-2 | Resolved | Satu URL `STUDIO_RB_URL` (`read -rsp`, tidak masuk riwayat, :59); `rb_guard` (:79-86) memakai URL yang sama dan membandingkannya dengan `STUDIO_RB_DB`; setiap perintah DB ditulis `rb_guard && ...`; Prisma selalu `DATABASE_URL="$STUDIO_RB_URL"` (:108, :173, :185, :199, :209, :236, :246-247); cek kedua lewat baris `Datasource` (:90-93); larangan menjalankan tanpa URL eksplisit beserta alasan `.env` (:43-45) |
| RB-1..RB-8 (D-285) | Diterapkan | RB-1 :154-157, :255-256, :287; RB-2 :113-124, :218-221, :271-274; RB-3 :81, :181-184; RB-4 :235, :259; RB-5 :65-74; RB-6 :52-53; RB-7 :230-232, :241; RB-8 :167-168 |
| F-1 | Resolved (dengan koreksi penulis yang benar) | Panduan :1171. Saya cek ulang: route struktur memeriksa 4.000 (`structure/route.ts:126`), tetapi layanan `patchStructure` (`revisions/v2/service.ts:465`) memanggil `parsePatchStructureBody`, lalu `requireChangeV2` maks 2.000 (`revisions/v2/body.ts:288`), sehingga batas efektif 2.000. Temuan siklus 1 saya hanya melihat tingkat route; teks baru tepat |
| F-2 | Resolved | Panduan :1258 `image.rasterDpi` 150..600 (`params/render.ts:313`, D-287); :1259 axis mencakup S-01..S-04 (`registry/charts.ts:617-669` memuat P-13, P-14, S-01..S-04) |
| F-3 | Resolved | Panduan :1138 "kiriman slot menunjuk `/payload`"; API :252, :332; register :799, :886. `/slots` hanya untuk slot tak-berulang (`SLOT_USE_CHAPTER_ENDPOINT`), jadi `/payload` tepat (`pipeline.ts:241-242`) |
| F-4 | Resolved | Panduan :1144, :1166 menyebut kuota bersama 30/60 untuk kiriman, PATCH, render, render ulang, artefak, dan validate `?preview=html` |
| F-5 | Resolved | API :285 "R17, R07, dan R09 artefak" (`artifacts/route.ts:102`) |
| F-6 | Resolved, lalu basi oleh kode baru (N-1) | Panduan :560 kini memuat 401, 403, 413, 415, 400, 429; tetapi 429 masih ditulis "hanya `?preview=html`" |
| F-7 | Resolved | Panduan :1145-1146 memisahkan `STORAGE_WRITE_FAILED` pada render (render ulang) dari unggah/kiriman aset (tidak tersimpan, lapor operator); :1048 selaras |

Koreksi tambahan penulis: R06 pada dokumen v2 memakai jalur pid. Cocok dengan kode `revisions/index.ts:353-364` (`patchAddressV2`, respons `PatchPidResult` + `job: null, outputs: []`) dan API :323, :348-352.

Regressed: tidak ada.

## 3. Temuan baru

| ID | Tingkat | Lokasi | Deskripsi | Bukti | Rute |
|---|---|---|---|---|---|
| N-1 | Minor | Panduan :560; baris R08 API :326 dan register R08 ("429 (hanya `?preview=html`)") | Sejak FIX-S2 (D-290, S2-03) SETIAP panggilan R08 dihitung di ember tersendiri, bawaan 120 per 60 detik per pemanggil (`STUDIO_VALIDATE_RATE_LIMIT`), lalu `?preview=html` dihitung juga di kuota render 30/60. Dokumen hanya menyebut yang kedua. Kode diubah 10:17, dokumen 10:24-10:26 | `validate/route.ts:50-53`, `:439-446`; `validate/_shared/validate-rate.ts:15-22`, `:36-37` | `document-specialist` |
| N-2 | Minor | Runbook :124, :135, :148, :219, :272 | Cadangan penuh, cadangan data Studio, `counts*.txt`, dan `counts.sql` ditulis ke direktori kerja. Path `prisma/rollback/...` relatif mengisyaratkan root repo, dan berkas itu tidak di-ignore git (`git check-ignore` untuk `backup_x.dump`, `counts_before.txt`: "not ignored"). Dump berisi seluruh data DB dan bisa ikut ter-commit. Usulan: sebutkan direktori kerja, dan tulis cadangan ke folder di luar repo (mis. variabel `STUDIO_RB_DIR`) | `.gitignore` tanpa pola `*.dump`/`counts*` | `document-specialist` |
| N-3 | Minor | Panduan :1267-1271 (§15, pemilik templat) | Sejak FIX-S2 (D-290, S2-01) draf yang mengubah kunci di luar hak simpan pemanggil (kelas K, lanjutan, preset) menghasilkan `valid: false` dengan isu `keyword` = kode galat simpan (mis. `PARAM_CLASS_K_FORBIDDEN`) berpointer ke kunci draf. Panduan hanya menyebut 403 untuk templat terbatas | `validate/_shared/template-draft.ts:165-183` | `document-specialist` |

Catatan informatif (bukan temuan): heredoc `counts.sql` (:117-123) berada di dalam butir daftar dengan indentasi 3 spasi. Bila disalin dari teks mentah Markdown, terminator `SQL` ikut terindentasi dan bash memperingatkan "here-document ... delimited by end-of-file". Disalin dari tampilan Markdown, blok ini sah (`bash -n` OK).

Jumlah: 0 Critical, 0 Major, 3 Minor baru.

## 4. Verdict

APPROVED (PASS). R-1, R-2, RB-1..RB-8, dan F-1..F-7 tertutup tanpa regresi; `verify_doc2.ts` 104/104; 18 blok bash lolos `bash -n`; setiap perintah DB memakai `STUDIO_RB_URL` dan dijaga `rb_guard`. N-1..N-3 adalah Minor yang dipicu kode FIX-S2 dan kebersihan berkas cadangan. Ketiganya dapat diperbaiki langsung oleh `document-specialist` tanpa siklus review ke-3.
