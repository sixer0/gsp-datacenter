---
agent: document-specialist
date: 2026-10-31
row: DOC-FIX-A
cycle: 2 dari 3 (review DC-42)
status: complete
---

# DOC-FIX-A: panduan §17, API-REFERENCE §12, brief 04

## Berkas

| Berkas | Baris sesudah | Bagian disunting |
|---|---|---|
| `docs/STUDIO-AGENT-GUIDE.md` | 2.361 | §1.1 (kuota, F-03), §12 baris 429, §13 dua baris kuota, §17 pengantar, §17.3, §17.4, §17.5, §17.7, §17.8, §17.9, §17.10, §17.11, §17.13 |
| `docs/API-REFERENCE.md` | 472 | §12: urutan evaluasi, batas render, header kuota, paragraf kontrak, baris R08/R21/R22/R23, catatan status 2026-10-31, tanggal cek route |
| `hermes_trial/04_contract_trial_brief.md` | 116 | Lingkungan (lokasi `facts/`, `queries/Q.md`, larangan `queries/` sebelum sesi Q dan `answers/`), rujukan R-3 ke R-1, sesi Q (ruang cari arm A dipersempit); metrik tidak diubah |

## Temuan ditutup (sumber kebenaran = kode)

| ID | Perbaikan | Bukti kode |
|---|---|---|
| F-01 | Urutan §17.13 dan API-REF disusun ulang: skema → kuota → templat/dokumen → gabung struktur (termasuk `PID_CONFLICT`) → catatan kontrak murni sesudah gabung → idempoten → 409 lingkup → compose EC28 → rujukan EC25/EC26 → by-construction; `PID_NOT_FOUND` dihapus dari jalur kiriman; 403 jalur buat sebelum `META_CONFLICT`/`DOC_NUMBER_EXISTS`; R04 POST v2 menagih laju sebelum skema | `services/submit/pipeline.ts:761-778, 838-939, 980`; `compose/merge.ts:335-379`; `submit-kit.ts:150-179`; `documents/route.ts:286-289`; `ingest/v2.ts:579-666` |
| F-03 | "bila `template` atau `meta.title` tidak ada" (§1.1 butir 1, §17.4) + `details.missing` | `services/submit/meta.ts:52-66` |
| F-04 | `details` EC25 dua bentuk (`documentId`/`docNumber` + `DOCUMENT`; `revisionNo`, `currentRevisionNo`, `REVISION`); EC27 + `pointer`; EC28 `supported` = CU-01..CU-09 | `services/contracts/refs.ts:77-91`; `contracts/validate.ts:150-155`; `engine/chart/core/custom.ts:52-63` |
| F-05 | Kode keluar `1` juga untuk draf di atas batas | `scripts/studio/draft-check.ts:22-24, 311-317` |
| F-06 | Zona `Z` atau `±HH:MM` apa pun | `contract/env.ts:153-154` |
| F-07 | Blok `curl -X POST .../slots` lengkap di §17.4 + `&agentId=` di §17.5 langkah 1 | `documents/[id]/content/route.ts:73, 87-88`; `structure/submission.ts:70` |
| F-08 | Aturan nomor aman: tepi `-`/`.` dibuang, potong 80, kosong = `DOC` | `services/render/final-name.ts:24-34` |
| F-43-1 | `evidence[].note` = objek `{ "text": "..." }` (InlineV2); contoh §17.5 diberi `item` + `note` | `contract/schema/v2/common.schema.ts:61, 351, 729-731` |
| F-43-2 | §17.11: header kuota pada setiap respons sesudah tagihan termasuk 201 `/slots`/`/chapters` dan PATCH; catatan "hanya 429" dihapus (panduan dan API-REF) | 13 route ber-`withQuotaHeaders` (grep); `submit-kit.ts:131-134` |
| Errata sitasi review | Tidak ditemukan seksi errata di akhir `review/document_review_dc1.md` (150 baris, berakhir di §7); tidak ada tindakan | `grep -i errata` = 0 hit |

Keputusan diselaraskan: D-402/D-407 (log baca, `includeArchived=1`, NUL 400, R23 max(1, blok), kunci per agen + `STUDIO_QUOTA_AGENT_CEILING_FACTOR` 1..64 bawaan 4, M-2: `--remote` hanya ke server lokal); D-403 FIX-QA/FIX-QB (`warnings` R08 cabang `studio.doc/v2`); D-405/D-406 (md2contract majemuk → CW-02/CW-04); D-404 (brief).

Catatan R21/R22: satu limiter `query` bersama (`http/quota.ts:271-272`). Kedua route memanggil `getStudioCaller(req)` tanpa `agentId` (`contracts/route.ts:42`, `search/route.ts:45`), sehingga kuncinya praktis = identitas saja, bukan identitas + agentId; panduan menulis keadaan kode ini.

## Bukti

- `draft-check --remote http://127.0.0.1:9021 --json` atas 4 blok `json` + 1 draf §17 hasil ekstraksi otomatis dari panduan final: exit 0, `valid: true`, `issues: []` (5/5); badan curl F-07 exit 0. Uji negatif `note` string: exit 1, `oneOf`/`type` di `/payload/evidence/1/note`.
- Curl POST F-07 sekali (agentId `doc-fix-a`, misi `2026-10-31_docfix_examples`, docKey `laporan-kerja-docfix-a`): 201, cid `d9465872-8e75-44da-8ddb-f9d1bda434d8`, dokumen `cmvvu2wzz00dlv1jge7iwq19n` `008/GSP/LAP/X/2026` rev 1 `create;slot:record`, INCOMPLETE `content:1..5`, header `X-Studio-Quota-Bucket: render` / `Remaining: 29` (bukti F-43-2).
- Tabel route API-REF vs ekspor `route.ts` (skrip `python -I`): 37 pasangan = 37, 0 selisih; selain itu hanya catch-all `[[...notfound]]` (didokumentasikan sebagai D-323).
- Rahasia: 0 berkas memuat nilai rahasia (grep `-F` di folder kerja dan tiga dokumen); 0 emoji; port 9011 hanya di daftar larangan brief (sudah ada).

## Self-check (bukan review)

Struktur dan hierarki judul tetap (§17.1..§17.13); istilah konsisten (kiriman, medan, galat, butir); tanpa kontradiksi antar panduan dan API-REF untuk urutan, header kuota, `details` EC25-EC28, dan `warnings`. Tidak menyentuh register 03/05 (milik DOC-FIX-B) maupun kode.

Next: send to document-reviewer
