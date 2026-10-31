---
agent: document-reviewer
date: 2026-10-31
row: DC-42b
mode: [1]
cycle: 2
cycle_cap: 3
deliverable:
  - docs/STUDIO-AGENT-GUIDE.md (§1.1, §12, §13, §16, §17)
  - docs/API-REFERENCE.md §12
  - docs/2026-10-22_doc_artifact_studio/masterplan/03_structural_sections_specs.md (amandemen DOC-5 + DOC-FIX-B)
  - docs/2026-10-22_doc_artifact_studio/masterplan/05_document_contract_specs.md (amandemen DC-33 + DOC-FIX-B)
  - docs/2026-10-22_doc_artifact_studio/hermes_trial/04_contract_trial_brief.md
prior_review: review/document_review_dc1.md (siklus 1) + test/22_contract_e2e_session.md (F-43-1, F-43-2)
verdict: PASS
verdict_contract: APPROVED
status: complete
---

# Review dokumen DC-42b (siklus 2 dari 3): panduan agen, API-REFERENCE, register 03/05, brief 04

## 1. Lingkup

| Berkas | Jenis | Ukuran | Bagian yang direview |
|---|---|---|---|
| `docs/STUDIO-AGENT-GUIDE.md` | Markdown, dokumen teknis (Module A tipe 4) | 2.361 baris | §1.1 (61-135), §12 (1502-1585), §13 (1589-1605), §16 (1716-1747), §17 (1751-2361) penuh |
| `docs/API-REFERENCE.md` | Markdown, referensi API | 472 baris | §12 (228-472) |
| `masterplan/03_structural_sections_specs.md` | Register spesifikasi | 1.333 baris; `git diff` +30/-11 | 6 blok "Amandemen DOC-FIX-B" (frontmatter, 419, 819, 861, 950-954, §19.1, §19.3) |
| `masterplan/05_document_contract_specs.md` | Register nama tunggal | 1.395 baris; `git diff` +70 | 12 blok "Amandemen DOC-FIX-B" (§2, §5.6, §5.7, §9.1, §9.2, §9.3, §9.6, §11.3, §13.2, §16.4, §16.5, §19.2, §19.4) |
| `hermes_trial/04_contract_trial_brief.md` | Brief uji (untracked) | 116 baris | penuh |

- Mode: 1 (kualitas dokumen). Audiens: Hermes (panduan §17, brief 04); pengembang/verifier (API-REF, register). Tier independensi: internal (Module B tier 1); checklist eksternal F.2 = N/A.
- Rujukan kebenaran: kode working tree branch `v2.1` (termasuk perubahan belum di-commit FIX-QA/QB/SEC/IMP/CLI2), `decisions.md` D-361..D-412.
- Skill dimuat: `document-quality-standards` Module B, D, F.1, G.4, H.4. Bash baca saja; pemindaian dengan `python -I`.
- Batasan: contoh JSON tidak dijalankan ulang ke server oleh reviewer (bukti `draft-check --remote` 5/5 dari log produsen `delegation_progress/document_specialist_docfix_a.md`); brief 04 untracked sehingga "metrik tidak diubah" dibandingkan dengan protokol `research/11_contract_efficiency_protocol.md`, bukan dengan diff git.

`L/` = `src/lib/studio/`, `API/` = `src/app/api/studio/`, `S/` = `scripts/studio/`. Lokasi dok: G = panduan, A = API-REFERENCE, R3/R5 = register 03/05, B = brief 04.

## 2. Status temuan siklus sebelumnya

| ID | Derajat lama | Status | Bukti dokumen | Bukti kode |
|---|---|---|---|---|
| F-01 | Major | Tertutup | G 2331-2361 (urutan 12 langkah: compose EC28 langkah 9 sebelum rujukan langkah 10; `PID_CONFLICT` di langkah 5 gabung; I54 "sesudah gabung struktur dan sebelum cek lingkup"; 403 sebelum `META_CONFLICT`/`DOC_NUMBER_EXISTS`); A 254-276; R3 819 + baris EC28 861; R5 §5.6 tabel baru (6 → 6b → 7 → 7a → 9a → 9) | `API/chapters/_shared/submit-kit.ts:136-182` (JSON → `SLOT_USE_CHAPTER_ENDPOINT` → skema → `DOC_TARGET_AMBIGUOUS` → `checkRenderRate`); `L/services/submit/pipeline.ts:762-778` (buat: META_REQUIRED → `assertTemplateUsable` 403 → META_CONFLICT → DOC_NUMBER_EXISTS), `:840` gabung, `:869` I54, `:873` idempoten, `:894-907` FIX-H2, `:921` `checkBase`, `:926-939` compose EC28, `:980` gerbang async I55 + by-construction; `L/services/compose/merge.ts:159-164, 251, 280` |
| F-02 | Major | Tertutup | R3 419 (pid butir), 950-954 (header kuota, R10 HEAD/`?name=`, R03 `kind=contracts`), §19.1 tiga baris, §19.3 kolom Status | `L/services/structure/rows.ts:219` (`inheritItemPids`), `:245-249` (`freshItemPid`), `:410`; `API/files/[id]/route.ts:49-53, 89`; `API/registry/route.ts:276-278, 445-446`; `prisma/seed-studio.ts:1180-1184` |
| F-03 | Minor | Tertutup | G 74 ("bila salah satu tidak ada"), G 1843-1844 (+ `details.missing`) | `L/services/submit/pipeline.ts:764` (`missing: ["template"]`); `L/services/submit/meta.ts:52-66` |
| F-04 | Minor | Tertutup | G 2316 (dua bentuk DOCUMENT + bentuk REVISION); A 333-336 | `L/services/contracts/refs.ts:79-91` |
| F-05 | Minor | Tertutup | G 2134-2136 | `S/draft-check.ts:22-24, 311-316` (`return 1` untuk draf di atas batas) |
| F-06 | Minor | Tertutup | G 1817 ("`Z` atau `±HH:MM` (zona apa pun, mis. `+07:00`)") | `L/contract/env.ts:153-154` |
| F-07 | Minor | Tertutup | G 1873-1884 (blok `curl -X POST .../slots` lengkap + "autentikasi: seksi 2"); G 1919-1922 (`&agentId=`) | `API/documents/[id]/content/route.ts:73, 87-88` |
| F-08 | Minor | Tertutup | G 2067-2069 (tepi `-`/`.` dibuang, potong 80, kosong = `DOC`) | `L/services/render/final-name.ts:29-34` |
| F-43-1 | Rendah | Tertutup | G 1826 (`note` = `{ "text": "..." }`, string ditolak); contoh G 1947-1948 | `L/contract/schema/v2/common.schema.ts:61` (`inline = ref("InlineV2")`), `:351` (InlineV2 `type: "object"`), `:731` (`note: inline`) |
| F-43-2 | Rendah | Tertutup | G 2237-2241 (header pada setiap respons sesudah tagihan termasuk 201 `/slots` `/chapters`); A 296-303; catatan "hanya 429" tidak ada lagi (grep "hanya pada 429" di G = 0; A 459-461 hanya sebagai catatan sejarah) | `API/chapters/_shared/submit-kit.ts:128-134` (`withQuotaHeaders`); `L/http/quota.ts:123-146` |

Ringkas: 10/10 temuan lama tertutup.

## 3. Tabel klaim baru (34 sampel, diprioritaskan pada bagian yang berubah)

| # | Klaim | Lokasi dok | Bukti kode | Cocok |
|---|---|---|---|---|
| 1 | Langkah 1-3 kiriman bab/slot: transport → skema (slot berulang 422 lebih dulu) → `DOC_TARGET_AMBIGUOUS` → 429 | G 2333-2337 | `API/chapters/_shared/submit-kit.ts:136-178` | Ya |
| 2 | Langkah 4 buat: `META_REQUIRED_FOR_CREATE` → 403 → `META_CONFLICT` → `DOC_NUMBER_EXISTS`; dokumen ada: 403 templat terbatas | G 2338-2341; A 263-266 | `pipeline.ts:762-778`; `guardExistingDocumentWrite` `:375-389` dipanggil `:835` | Ya |
| 3 | `TEMPLATE_NOT_FOUND` di luar transaksi, `DOCUMENT_NOT_FOUND` di dalam kunci | A 262-263 | `pipeline.ts:625` (`prepare`), `L/services/submit/lock.ts:92` | Ya |
| 4 | Langkah 5 gabung struktur memuat `TEMPLATE_MISMATCH`, `META_CONFLICT`, `PID_CONFLICT`, `ASSET_NOT_FOUND` | G 2342-2343 | `merge.ts:159-164, 251, 280`; `pipeline.ts:847` | Ya |
| 5 | Langkah 6 I54 sesudah gabung, sebelum idempoten; CH 400 lebih dulu, EC27 hanya bila tanpa isu CH | G 2344-2346; R5 §5.6 baris 6b | `pipeline.ts:869`; `L/services/contracts/issues.ts:30-41`; `L/services/ingest/by-construction.ts:265-267` | Ya |
| 6 | Langkah 7 idempoten `200 unchanged` sebelum FIX-H2 dan cek dasar | G 2347-2349 | `pipeline.ts:873` sebelum `:894`, `:921` | Ya |
| 7 | Langkah 8 cek lingkup: 409 (pid PATCH tertimpa, basis basi) dan 404 `REVISION_NOT_FOUND` | G 2348-2349 | `pipeline.ts:483, 487, 896-921` | Ya |
| 8 | Langkah 9 compose EC28, langkah 10 rujukan, langkah 11 by-construction | G 2350-2353; R5 7a/9a/9 | `pipeline.ts:926-939, 980`; `L/engine/chart/core/custom.ts:54-63` | Ya |
| 9 | `PID_NOT_FOUND` tidak lagi tercantum di jalur kiriman | G 2331-2354 | Grep `PID_NOT_FOUND` di `pipeline.ts` dan `merge.ts` = 0 hit | Ya |
| 10 | R04 POST v2: laju sebelum skema | A 260 | `API/documents/route.ts:286-293` | Ya |
| 11 | Urutan sama di jalur sunting dan R04 dokumen baru | R5 §5.6 butir 1; R3 819 | `L/services/revisions/v2/commit.ts:211, 215, 228, 251`; `L/services/ingest/v2.ts:579` | Ya |
| 12 | Header kuota pada setiap respons sesudah tagihan (2xx/4xx/429/5xx); 429 = Remaining 0 | G 2237-2244; A 296-306 | `L/http/quota.ts:123-146` (`remaining = res.status === 429 ? "0"`) | Ya |
| 13 | Route ber-`withQuotaHeaders`: R04, R06, R07, R08, R09, R12/R13, R14, R16, R17, R21, R22, R23, importer | G 2230-2235; A 298-301 | Grep `withQuotaHeaders(` di `API/**/route.ts` + `submit-kit.ts:134` + `render/_lib/handler.ts:107` | Ya |
| 14 | Dua kuota ditagih (R08 `?preview=html`, importer `?validate=1`) = sisa terkecil | G 2242-2243; A 303-304 | `quota.ts:106-116`; `API/validate/route.ts:194, 199`; `API/import/markdown/route.ts:140, 159-161` | Ya |
| 15 | Kunci per agen = identitas terautentikasi + `agentId`; plafon F × batas; F = `STUDIO_QUOTA_AGENT_CEILING_FACTOR` 1..64 bawaan 4 | G 2245-2251; A 307-313; R5 §9.6 | `quota.ts:49-52, 78-81, 169-171, 182-196, 227-245` | Ya |
| 16 | Sisa plafon dapat meleset kurang dari F bila slot tidak sejajar | G 2250-2251; R5 §9.6 | `quota.ts:25-28, 195` | Ya |
| 17 | R21/R22 tanpa `agentId` (GET tanpa badan) = satu kuota per identitas | G 2251-2252; A 308-309 | `API/contracts/route.ts:42`; `API/search/route.ts:45` (`getStudioCaller(req)` tanpa agentId) | Ya |
| 18 | Kiriman, PATCH, render, R08, R23 meneruskan `agentId` badan ke kunci kuota | G 2245 | `submit-kit.ts:142`; `API/documents/[id]/paragraphs/[pid]/route.ts:116`; `.../blocks/[address]/route.ts:154`; `.../structure/route.ts:146`; `.../render/route.ts:34`; `API/validate/route.ts:192`; `API/drafts/check/route.ts:137` | Ya |
| 19 | Importer ikut "dipecah per `agentId`" | G 64-68 (§1.1); G 1572 (§12 baris 429); A 307-309 ("semua bucket"); R5 §2 KD-38 amandemen "di semua bucket" | `API/import/markdown/route.ts:139-140`: `checkImportRate(await getStudioCaller(req), ctx)` tanpa agentId, sebelum badan dibaca | Tidak (N-01) |
| 20 | Env bucket `query`: `STUDIO_QUERY_RATE_LIMIT`, `STUDIO_QUERY_RATE_WINDOW_MS`, bawaan 120/60 s, satu limiter R21+R22 | G 1602, 2235; A 313-314 | `quota.ts:44-46, 251-273` | Ya |
| 21 | `includeArchived`: `1` sertakan, `0` = bawaan, nilai lain 400 `/query/includeArchived` | G 1985-1987, 2007, 2034; A 433-434; R5 §9.1 | `L/services/query/filters.ts:109-110, 175-181, 266, 325` | Ya |
| 22 | Arsip dikecualikan juga bila R22 dibatasi `documentId` | G 1985-1986; R5 §9.2 | `L/services/query/search.ts:21, 60`; `L/services/query/contracts.ts:84, 107` | Ya |
| 23 | NUL (`%00`) → 400 `SCHEMA_INVALID` `/query/<nama>` sebelum kuota | G 1981-1983; R5 §9.1 | `filters.ts:183-189`; parse sebelum `checkQueryRate` (`contracts/route.ts:43-44`, `search/route.ts:46-47`) | Ya |
| 24 | Log baca: pemanggil, filter, `q` dipotong, jumlah hasil, cid; isi cuplikan tidak dicatat; 64 karakter | G 1991-1992; R5 §9.1, §9.2 | `L/services/query/log.ts:1-13, 89, 92-95`; `contracts/route.ts:47-54`; `search/route.ts:50-57` | Ya |
| 25 | R23 menagih max(1, blok dry-run), semua sebelum dry-run pertama; setiap 200 ber-header | G 2158-2160, 2233; A 445; R5 §9.3 | `L/services/draft/check.ts:78`; `API/drafts/check/route.ts:140-144` | Ya |
| 26 | `--remote` mengirim rahasia ke URL apa pun dan mengikuti redirect; disarankan hanya server lokal | G 2130-2134; R5 §11.3 | `S/draft-check.ts:118` (URL http(s) apa pun), `:337` (env); tanpa `redirect: "manual"` (grep `redirect` = 0 hit) | Ya |
| 27 | md2contract: status/vonis majemuk → `CONTRACT_STATUS_UNMAPPED`, tidak dipotong; status kepala tanpa `--status` → 3 | G 2206-2209; R5 §13.2 | `L/services/import/contract/parse.ts:145-173`; `index.ts:198, 208, 258-260` | Ya |
| 28 | Butir berstatus majemuk tidak masuk `items`; `owner`/`taskRef` majemuk atau tak cocok pola → kosong + `CONTRACT_FIELD_UNMAPPED` | G 2209-2213; R5 §13.2, §16.4 | `index.ts:269-272, 392-393, 418-419`; `parse.ts:176-199` | Ya |
| 29 | md2contract kode keluar `1` = "ada peringatan dengan `--strict` atau dokumen tidak sah"; stderr hanya peringatan pemetaan | G 2201-2205, 2214-2216; R5 §16.6 baris 1189 | `S/md2contract.ts:22-27` (FIX-CLI2, D-412): unsur dibuang `mapping.prose[].dropped` dicetak ke stderr dan ikut `--strict` | Sebagian (N-02) |
| 30 | `evidence.note` = InlineV2; `item` = kunci butir | G 1826 | `common.schema.ts:729-731` | Ya |
| 31 | Nama final: aturan nomor aman dan stempel UTC detik dipotong | G 2063-2070; A 347-349 | `final-name.ts:29-34, 66-71` | Ya |
| 32 | R08: `submitPreview.warnings` untuk bab/slot, `warnings` tingkat atas untuk `studio.doc/v2` | G 2327-2329; A 344-345; R5 §5.6 butir AM-08 | `API/validate/_shared/dry-run.ts:69-73, 150, 254-257` | Ya |
| 33 | `warnings` juga pada PATCH pid, PATCH alamat, op struktur | G 2328; A 345-346 | `L/services/revisions/v2/service.ts:340, 530` | Ya |
| 34 | EC25 detail dua bentuk; EC26 `{ pointer, documentId, pid }`; EC27 `pointer` ke kemunculan kedua; EC28 `supported` = CU-01..CU-09 | G 2316-2319; A 333-340 | `refs.ts:80-91, 104-110`; `L/services/contracts/validate.ts:150-154` (`positions[1] - 1`); `custom.ts:59-62`; `L/registry/charts.ts:1437-1445` | Ya |
| 35 | 73 kode galat, semua EC25-EC28 = 422 | A 252, 455-456 | Hitung `python -I`: `STUDIO_ERROR_CODES` = 73, `STUDIO_ERROR_HTTP` = 73 | Ya |
| 36 | `?shape=submission&agentId=` 1..80 hanya bersama `shape=submission` | G 1919-1922; A 431 | `API/documents/[id]/content/route.ts:73, 87-88` | Ya |
| 37 | Rujukan baris register 05 DOC-FIX-B (`pipeline.ts:873/894`, `commit.ts:211/215/228/251`, `v2.ts:579/868`, `pid.ts:121-127`, `snapshot.ts:192-195`, `pids.ts:52-55`, `check.ts:78`, `filters.ts:183-189`, `contracts.ts:51-53`, `log.ts:89`) | R5 diff | Dibaca satu per satu: semua menunjuk konstruk yang disebut | Ya |

Ringkas: 37 klaim; 35 cocok, 1 sebagian (N-02), 1 tidak cocok (N-01).

## 4. Pemeriksaan (checks)

| Cek | Hasil | Bukti |
|---|---|---|
| (1) Temuan siklus 1 + E2E tertutup | Pass | §2: 10/10 tertutup dengan file:baris dokumen dan kode |
| (2) ≥ 30 klaim baru dicek ke kode | Pass | §3: 37 klaim |
| (3) Konsistensi nama antar-5 dokumen | Pass dengan catatan | Tally `grep -ohE` atas 5 berkas: `includeArchived` 14× tanpa varian; `STUDIO_QUOTA_AGENT_CEILING_FACTOR` 4×; `X-Studio-Quota-Bucket`/`-Remaining`, `X-Studio-Final-Filename`, `X-Studio-Sha256-Verified` tanpa varian; EC25-EC28, `CONTRACT_ENUM/PATTERN/DATE/REF_TARGET`, `CONTRACT_REF_PID_RETIRED`, `CU-01..CU-09`, `laporan-kerja-agen`, `logQueryRead`, `checkBucketRate` identik. Nama yang tampak asing (`CONTRACT_STATUS_INVALID`, `CONTRACT_WRITER_CHANGED`) hanya di kolom "ditolak" KD-32/KD-45 R5 131, 144. Catatan: penomoran langkah berbeda skema (G 1..12; R5 2/6/6b/7/7a/9a/9), sehingga "langkah 9" G = compose sedangkan "langkah 9" R5 = by-construction; G tidak merujuk nomor register, A menyebut "Langkah kontrak = register 05 §5.6" (A 274). Tidak bertentangan isi; tidak dijadikan temuan |
| (4) D-139 | Pass | Perubahan siklus ini hanya menambah isi (`note` = `{ text }`, curl, header kuota, `includeArchived`); tidak ada contoh yang membawa `label`/`heading`/`columns`/`order`/`palette`/`width`; G 1795 "agen tidak mengirim label", G 2260-2261 DF-73 tetap; B tidak meminta medan tampilan |
| (5a) Brief 04: retrieval arm A dibatasi `r1a/`, `r2a/`, `r3a/` | Pass | B 99 "grep/baca hanya berkas laporan di `r1a/`, `r2a/`, `r3a/` dalam folder misi uji ... Berkas di `w/`, `r1b/`, `r2b/`, `r3b/` adalah draf arm B dan tidak dihitung"; selaras D-404 dan manifest `04_contract_trial_facts_manifest.md:57, 78` |
| (5b) Brief 04: lokasi facts/queries | Pass | B 20 `contract_ab/facts/` (`W.md`, `R-1.md`..`R-3.md`), `contract_ab/queries/Q.md`; B 22 larangan membuka `queries/` sebelum sesi Q dan membaca `answers/`; berkas ada (`ls .../contract_ab/facts` = R-1, R-2, R-3, W; `queries` = Q.md) |
| (5c) Brief 04: langkah cari R-1 pada run R-3 simetris | Pass | B 36 (R3B lewat API R21/R20; R3A di `r1a/`), selaras D-404 dan manifest :79 |
| (5d) Brief 04: metrik protokol tidak diubah | Pass (batasan: berkas untracked) | Header `timing.csv` B 77 dan `retrieval.csv` B 105 identik byte dengan protokol `research/11_contract_efficiency_protocol.md:218, 236` (`python -I`: kedua string ada di kedua berkas); tabel metrik B 85-94 = KE-1..KE-7 + MU-1/MU-2 sesuai D-403 |
| (6) Bahasa Indonesia, tanpa emoji, tanpa rahasia/URL produksi/port 9011 | Pass | `python -I` atas 5 berkas: emoji 0; `9011` hanya B 22 (daftar larangan); URL hanya `http://127.0.0.1:<port>`, `http://localhost:<port>` (G), `http://127.0.0.1:<port>` (R5), `http://127.0.0.1:9021` (B, DEV lokal); nilai rahasia dari berkas rahasia trial tidak muncul di kelima berkas (cek boolean, nilai tidak dicetak) |
| F.1 #6 tanpa pernyataan bertentangan | Pass dengan catatan | Satu ketidaktepatan (N-01) dan satu keterlambatan dokumen terhadap D-412 (N-02); keduanya Minor |
| G.4 rujukan silang tidak menggantung | Pass | Rujukan "seksi 2, 4, 5.3, 5.6, 6, 8.0, 9.4, 13, 17.2-17.13" di G ada (`grep -n "^#"`); rujukan "register 05 §5.6/§5.7/§9.6" di R3 ada di R5 |
| Hierarki judul | Pass | G `## 17` → `### 17.1`..`### 17.13`; judul `#` di 2100, 2122-2126 berada di dalam pagar kode |

## 5. Tabel konsistensi (tujuh sumbu)

| Sumbu | Hasil | Contoh / bukti |
|---|---|---|
| Terminologi | Pass | "kiriman", "medan", "galat", "butir", "bukti", "rujukan", "plafon", "kuota" seragam di G §17, A §12, R5 amandemen |
| Format angka dan tanggal | Pass | `2.000.000`, `100.000`, `2.361`; MiB biner; tanggal ISO |
| Gaya | Pass | Kalimat perintah untuk agen di G; amandemen register berlabel "Amandemen DOC-FIX-B" + rujukan keputusan |
| Hierarki judul | Pass | Lihat §4 |
| Kapitalisasi | Pass | Enum ditulis persis (status huruf kecil, vonis huruf besar, kode galat huruf besar) |
| Satuan | Pass dengan catatan | G 66 "60 per menit" vs G 2234 "60 per 60 detik" untuk importer (setara, gaya saja) |
| Format rujukan | Pass | `seksi N.M` di G; `D-xxx`, `§`, file:baris di A/R3/R5 |

## 6. Temuan baru

| ID | Derajat | Lokasi | Deskripsi | Bukti | Usulan | Rute |
|---|---|---|---|---|---|---|
| N-01 | Minor | G 64-68 (§1.1), G 1572 (§12 baris 429); A 307-309; R5 §2 amandemen KD-38 ("di semua bucket, pemanggil yang mengirim `agentId` dikunci per identitas + `agentId`") dan R5 §9.6 butir "Bucket per agen" | Bucket `import` tidak pernah dipecah per `agentId`: route importer menagih kuota `import` dengan pemanggil tanpa `agentId`, sebelum badan dibaca. §1.1 menempatkan importer di bawah "dipecah per `agentId`", A dan R5 menyebut "semua bucket". §17.11 (G 2245) sudah benar karena daftarnya tidak memuat importer, tetapi tidak menyebut importer sebagai pengecualian. Register 05 juga belum mencatat bahwa R21/R22 selalu satu kuota per identitas (catatan yang D-411 serahkan ke review ini). Dampak bagi agen kecil (60 per 60 detik per identitas), tetapi dua agen yang berbagi rahasia saling menghabiskan kuota importer, berlawanan dengan janji §1.1 | `API/import/markdown/route.ts:139-140` (`checkImportRate(await getStudioCaller(req), ctx)`); bandingkan `:150, :159-161` (kuota `validate` `?validate=1` memakai pemanggil ber-`agentId`); `API/contracts/route.ts:42`, `API/search/route.ts:45` | G §1.1: "Kuota per identitas (kiriman, PATCH, render, R08, dan R23 dipecah per `agentId` di bawah plafon identitas; importer dan R21/R22 satu kuota per identitas, seksi 17.11)"; G 2251-2252: "Permintaan tanpa `agentId`, termasuk R21 dan R22 (GET tanpa badan), serta kuota `import` importer (ditagih sebelum badan dibaca)..."; G 1572 idem. A 307-309 dan R5 KD-38/§9.6: ganti "semua bucket" dengan "bucket `render` dan `validate`; bucket `import` dan `query` selalu per identitas (route menagih tanpa `agentId`)" | G, A: `document-specialist`; R5: pemilik register 05 lewat controller |
| N-02 | Minor | G 2201-2205, 2214-2216 (§17.10); R5 §16.6 baris 1189 | Sesudah FIX-CLI2 (D-412), `md2contract` mencetak unsur prosa yang dibuang (`mapping.prose[].dropped`, mis. `LIST_NESTING`, `THEMATIC_BREAK`) ke stderr dan `--strict` keluar `1` juga bila ada unsur dibuang. G dan R5 hanya menyebut peringatan pemetaan. Dampak kecil: brief 04 melarang Hermes memakai `md2contract`, dan CLI hanya untuk uji banding | `S/md2contract.ts:22-27` ("unsur yang dibuang importer prosa ... dilaporkan ke stderr per kode ... dan ikut dihitung oleh --strict"; "1 ada peringatan atau unsur dibuang dengan --strict"); `decisions.md` D-412 | G 2214: "`1` ada peringatan atau unsur prosa yang dibuang (mis. `LIST_NESTING`) dengan `--strict`, atau dokumen tidak sah"; tambah satu kalimat di G 2202: "Unsur prosa yang dibuang importer dilaporkan ke stderr per kode beserta baris sumbernya (`dropped=N` di ringkasan)". R5 §16.6: amandemen setara (D-412) | G: `document-specialist`; R5: pemilik register 05 lewat controller |

Hitungan: 0 Critical, 0 Major, 2 Minor.

## 7. Vonis dan tindak lanjut

Vonis keseluruhan: **PASS** (padanan kontrak: `APPROVED`). Kesepuluh temuan siklus 1 dan E2E (F-01..F-08, F-43-1, F-43-2) tertutup, dengan bukti di dokumen dan di kode. Dari 37 klaim baru, 35 cocok dengan kode. Urutan evaluasi §17.13, A, R3, dan R5 kini sama dengan `pipeline.ts` (EC28 dari compose sebelum rujukan; I54 di dalam kunci sesudah gabung). D-139 lulus. Brief 04 selaras dengan D-404 dan memakai metrik serta header CSV yang sama dengan protokol. Tidak ada emoji, rahasia, URL produksi, atau port 9011 di luar daftar larangan.

- Dua temuan Minor (N-01, N-02) boleh ditutup oleh `document-specialist` (G, A) dan pemilik register 05 lewat controller, tanpa siklus review tambahan. Menurut aturan loop, temuan Minor saja tidak membenarkan siklus ke-3.
- DC-45 (uji Hermes) tidak tertahan oleh dokumen ini. N-01 menyangkut kuota importer, dan brief 04 tidak memakai importer. N-02 menyangkut `md2contract`, yang dilarang dalam brief.
- Siklus tersisa: 1 dari 3 (cadangan, tidak diperlukan).
