---
agent: document-reviewer
date: 2026-10-30
mode: 1
cycle: 2
cycle_cap: 3
deliverable: DOC-4 (D-340..D-355) - docs/STUDIO-AGENT-GUIDE.md; docs/API-REFERENCE.md §12; masterplan/03_structural_sections_specs.md
verdict: APPROVED
caller_verdict: PASS
status: complete
prior_report: review/document_review_doc3.md
---

# Re-review DOC-3 (siklus 2, DOC-4)

## 1. Lingkup dan bukti

- Berkas saat review: panduan 1720 baris, API 393 baris, register 1249 baris.
- `npx tsx C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/doc3/verify_doc3.ts` dijalankan ulang dari root repo: exit 0, `159 PASS, 0 FAIL`, `SEMUA LULUS`. Ini termasuk 18 contoh JSON: badan importer bab pertama dan op `setMeta` §1.1 lolos validatornya.
- Hitungan dari kode lewat `tsx`: `ALL_PARAM_COUNT` = 788, `ROLE_KEYS.length` = 76 (`params 788 roles 76`).
- Emoji: 0 di ketiga berkas.
- Bukti empiris kecukupan §1.1: uji ulang Hermes (D-341) membuat dokumen baru `003/GSP/KT/X/2026` dari panduan. Alurnya: importer `?validate=1` 0 isu, create + 2 bab paralel + 4 slot COMPLETE, D16/D17/D18 PASS.

## 2. Temuan siklus 1

| ID | Status | Bukti |
|---|---|---|
| M-1 | Resolved | Panduan §1.1 langkah 1 (:64-92) menyebut bentuk `target` untuk misi baru (`{ mission: { folder }, docKey }` + `template` + `meta.title`, tanpa itu `400 META_REQUIRED_FOR_CREATE`) dan `{ documentId }` sesudahnya, disertai contoh badan yang lolos importer dan validator v2. Langkah 3 (:95-97): bab pertama dulu, simpan `document.id`, lalu paralel. CLI `--template <slug[@versi]>`/`--doc-title` (`scripts/studio/md2chapter.ts:6-21`). Klaim "`--mission` tanpa `--doc-key` dan tanpa `--template` → `DOC_TARGET_AMBIGUOUS`" cocok: tanpa keduanya `docKey` = null (`services/submit/target.ts:51`) lalu ditolak di kunci misi (`services/submit/lock.ts:65-75`) |
| m-1 | Resolved | Panduan §8.0 :1197-1202, API :303, dan register :804 (c) kini memuat 401 → 400 → 429 → 503 antrean → 404 → 409/422 → 503 preflight, cocok dengan `render/_lib/handler.ts:5-14`. Kalimat "503 hanya untuk sasaran sah" dibatasi ke 503 preflight |
| m-2 | Resolved | §12 :1527 (413 importer `MD_*`, tindakan "pecah bab") dan :1552 (429: validate 120/60, impor 60/60) |
| m-3 | Resolved | `OPTIONS` di panduan :1513, API :310, register :804 (`[[...notfound]]/route.ts:36`) |
| m-4 | Resolved | §5.3 :625-631 menyebut `renumberChapters` (R14) dan kiriman dokumen bertarget (R04), cocok dengan `services/submit/overwrite.ts:6-16` |
| m-5 | Resolved | Kode kini berbahasa Indonesia: `PDF_NOT_READY_MESSAGE` (`services/render/preflight.ts:33`), pesan `ROUTE_NOT_FOUND` (`http/route-not-found.ts:273`), dan `hint` (`:78-108`, `:252`). Kalimat bentuk galat §12 :1488-1491 kini jujur bahwa sebagian pesan validasi teknis masih berbahasa Inggris |

Regressed: tidak ada.

## 3. Butir tambahan DOC-4

| Butir | Status | Bukti |
|---|---|---|
| Op struktur di §1.1 (badan tanpa `$schema`/`target`, contoh `setMeta`) | Pass | Panduan :110-123; contoh lolos `parsePatchStructureBody` (rerun) |
| R20 `?shape=submission`: medan respons, `submitTo`, `editHints`, slot kosong `null` | Pass | §5.3 :653-658; API R20 :378; `content/route.ts:16-28`, `:72-87`; `services/structure/submission.ts:23-36` |
| Aturan `text` ATAU `runs` | Pass | §5.3 :659-661; `contract/schema/v2/common.schema.ts:51`, `:335` (`atMostOne`); `editHints` butir 4 |
| Rel K2 rev B (hanya inang chip menyempit, G-RAIL-3) | Pass | §4.2 :416-419; `engine/docx/assemble/index.ts:378`, `:438`; `engine/docx/blocks/env.ts:185`; D-350 |
| TOC section + lampiran ber-PAGEREF; `toc.levels` R-66 lanjutan ADMIN, 1..3, bawaan 2, `section:toc` | Pass | Panduan §3 :180-185, §15 :1667; register :939; `params/render.ts:325-334`; `registry/essentials.ts:100`; `registry/slots.ts:171` |
| Peran `toc.section*`/`toc.appendix*`; 76 peran; 788 parameter; render 45 | Pass | `contract/enums.ts:253-258`; hitungan `tsx` di atas; `params/render.ts:337` |
| Resep penanda Hermes §5.6 (`[ASSESSED]`, `[EXECUTED-DOC]`, `[GSP-STATEMENT]`) | Pass | §5.6 :854-857; rel yang dihasilkan diuji lewat importer (rerun); tidak ada provenans baru yang ditebak (`services/import/markdown.ts:107-110`, `:251-258`) |
| Opsi CLI `--template`/`--doc-title` | Pass | §1.1 :83-88; `md2chapter.ts:13-21` |
| Pesan galat Indonesia | Pass | Lihat m-5 |
| D-139 | Pass | `toc.levels` "Agen tidak mengirim parameter ini" (:184-185); rel "jadi bentuk ini dijamin tanpa tindakan agen" (:419); resep §5.6 hanya soal makna provenans |

## 4. Kecukupan §1.1 bagi agen baru

Agen baru kini dapat membuat dokumen baru hanya dengan §1.1: bentuk target, `template`/`meta.title`, urutan bab pertama lalu paralel, slot, render (dengan `partial` dan 503), unduhan + sha, PATCH, dan op struktur. Dua hal masih perlu dicari di seksi lain. Keduanya Minor dan masing-masing cukup satu baris rujukan:

| ID | Tingkat | Lokasi | Deskripsi | Rute |
|---|---|---|---|---|
| n-1 | Minor | §1.1 (:60-123) | Header autentikasi (`x-internal-secret`, `Content-Type: application/json`) dan kuota (impor 60/60, validasi 120/60, kiriman + render 30/60) tidak disebut atau dirujuk di §1.1. Agen yang langsung memanggil akan menerima 401 tanpa petunjuk dari §1.1. Usulan: satu kalimat "Semua panggilan memakai header seksi 2; kuota seksi 12 baris 429" | `document-specialist` |
| n-2 | Minor | §5.6 :826-831; register R20 :909 | Contoh CLI §5.6 belum menyebut `--template`/`--doc-title` (hanya ada di §1.1). Kolom galat register R20 tidak memuat 400 `/query/shape` dan 422 `SLOT_USE_CHAPTER_ENDPOINT` untuk `shape=submission` yang ada di API :378 dan `content/route.ts:25-28` | `document-specialist` |

Catatan kosmetik (bukan temuan): di §3 :184-185, kalimat "Dokumen yang dibuat sebelum itu" kini berada sesudah kalimat `toc.levels`, sehingga rujukan "itu" (v3) menjadi kabur.

## 5. Verdict

APPROVED (PASS). M-1 dan m-1..m-5 tertutup tanpa regresi; semua butir tambahan DOC-4 cocok dengan kode; `verify_doc3.ts` 159/159; 0 emoji. Dua temuan Minor baru (n-1, n-2) boleh diperbaiki langsung oleh `document-specialist` tanpa siklus ke-3.
