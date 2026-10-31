---
agent: document-reviewer
date: 2026-10-30
row: DC-42
mode: [1]
cycle: 1
cycle_cap: 3
deliverable:
  - docs/STUDIO-AGENT-GUIDE.md (§0, §1.1 butir 9, §12, §13, §16, §17; DC-33)
  - docs/API-REFERENCE.md §12 (DC-34)
  - docs/2026-10-22_doc_artifact_studio/masterplan/03_structural_sections_specs.md (amandemen DOC-5 + §19; DC-32)
  - docs/2026-10-22_doc_artifact_studio/masterplan/05_document_contract_specs.md (amandemen DC-33)
verdict: CAUTION
verdict_contract: NEEDS_REVISION
status: complete
---

# Review dokumen DC-42: panduan agen, API-REFERENCE, register 03/05

## 1. Lingkup

| Berkas | Jenis | Ukuran | Bagian yang direview |
|---|---|---|---|
| `docs/STUDIO-AGENT-GUIDE.md` | Markdown, dokumen teknis (Module A tipe 4) | 2298 baris; `git diff --stat` +578/-? | §17 (baris 1750-2298) penuh; §0 (baris 33), §1.1 butir 9 (128-133), §12 (1512, 1541, 1564-1567, 1569), §13 (1600-1604), §16 (1731, 1742-1745) |
| `docs/API-REFERENCE.md` | Markdown, referensi API | 445 baris; +92 | §12 (baris 228-439) |
| `masterplan/03_structural_sections_specs.md` | Register spesifikasi | 1323 baris (sudah di commit 2a6f78e) | baris 9, 18, 78, 345, 418, 557, 604, 816, 851-860, 941-945, §19 (1285-1323) |
| `masterplan/05_document_contract_specs.md` | Register nama tunggal | 1342 baris; diff DC-33 | 9 blok "Amandemen DC-33" (§0.3, §5.4, §5.5, §6.1, §9.1, §9.5 ×2, §11.3, §15) |

- Mode: 1 (kualitas dokumen). Audiens: agen pengguna (Hermes) untuk panduan §17; pengembang/verifier untuk API-REFERENCE dan register. Tier independensi: internal (Module B tier 1); checklist eksternal F.2 = N/A.
- Rujukan kebenaran: kode di working tree branch `v2.1` (termasuk perubahan belum di-commit FIX-C1/FIX-C2 pada `pipeline.ts`, `draft/check.ts`, `drafts/check/route.ts`, `draft-check.ts`), `decisions.md` D-361..D-398, `gateway_check/11_contract_integration_gate.md`.
- Asumsi: kode working tree adalah keadaan yang akan diuji Hermes (DC-45). Skill dimuat: `document-quality-standards` Module B, D, E, F.1, G.4, H.4.
- Batasan: contoh JSON tidak dijalankan ulang ke server oleh reviewer (Bash dibatasi baca saja); kelima blok `json` §17 diurai ulang dengan `python -I` (5/5 JSON sah: slot/v2 ×3, chapter/v2 ×2) dan medannya dicocokkan manual ke skema; bukti `--remote` diambil dari log produsen `delegation_progress/document_specialist_dc33.md:23`.

## 2. Tabel klaim (42 sampel)

`L/` = `src/lib/studio/`, `API/` = `src/app/api/studio/`. Lokasi dok: G = panduan, A = API-REFERENCE, R3/R5 = register 03/05.

| # | Klaim | Lokasi dok | Bukti kode | Cocok |
|---|---|---|---|---|
| 1 | R21 = `GET /api/studio/contracts`, R22 = `GET /api/studio/search`, R23 = `POST /api/studio/drafts/check` | G 1742-1745, 1967, 1994, 2104; A 422-424 | `L/contract/env.ts:79-81`; ekspor metode: `API/contracts/route.ts:29`, `API/search/route.ts:31`, `API/drafts/check/route.ts:116` | Ya |
| 2 | R10 mengekspor GET dan HEAD | G 1731; A 405-406 | `API/files/[id]/route.ts:85-93` | Ya |
| 3 | Tabel route A = ekspor nyata semua berkas `route.ts` | A 384-424 | Grep `export (async )?function (GET\|POST\|PATCH\|HEAD)` di 26 berkas `route.ts`: semua baris tabel cocok | Ya |
| 4 | R03 `kind=contracts` menolak parameter lain `400 SCHEMA_INVALID` `/query/<nama>`; respons `{ kind: "contracts", count, items }` | G 1779-1781; A 394 | `API/registry/route.ts:276-292` (A juga menyebut `meta`, benar) | Ya |
| 5 | `templateSlug`/`tier`/`typeCode` = `laporan-kerja-agen`/`NOTA`/`LAP` | G 1785 | `L/registry/contracts.ts:185-187` | Ya |
| 6 | Kerangka `record` wajib tak berulang, `content` wajib berulang, `references` opsional | G 1786 | `L/registry/contracts.ts:189-193` | Ya |
| 7 | Outline wajib 1..5 Ringkasan, Rincian kerja, Bukti, Isu terbuka, Langkah berikut | G 1787 | `L/registry/contracts.ts:195-201` | Ya |
| 8 | Enum status laporan `draft, complete, partial, blocked, needs-review` | G 1788; A 422 | `L/contract/enums.ts:471` (E45) | Ya |
| 9 | Enum status butir 7 nilai; vonis `PASS, CAUTION, FAIL, NEEDS_REVIEW` | G 1789-1790 | `L/contract/enums.ts:475, 479` | Ya |
| 10 | `refRels` dan `evidenceKinds` | G 1791 | `L/contract/enums.ts:483, 487` | Ya |
| 11 | `defaultFormats ["HTML"]`; R17 tanpa `formats` pada dokumen kontrak = HTML saja | G 1795, 2026-2027; A 415 | `L/contract/env.ts:160`; `L/services/render/scope.ts:139` | Ya |
| 12 | `"status": "selesai"` ditolak `400` `checkId: CONTRACT_ENUM` | G 1799-1800 | `L/contract/schema/v2/forbidden.ts` `classifyContractError` (`CONTRACT_ENUM_FIELDS` :516, cabang enum :555-557) | Ya |
| 13 | `label/columns/order/heading` di payload, butir, bukti, rujukan = `DISPLAY_FIELD` | G 1808-1810; R5 §5.5 amandemen | `forbidden.ts:130-135` (DF-72 `location` + `alsoAt`), pencocokan `:477-481` | Ya |
| 14 | Medan wajib payload `type`, `status`, `reportedAt` | G 1814-1816 | `L/contract/schema/v2/common.schema.ts:686-707` (`required` :707) | Ya |
| 15 | Pola `reportedAt` tanggal atau waktu ber-zona, detik dan ms opsional | G 1816 | `L/contract/env.ts:153-154` (zona `Z` atau `±HH:MM` apa pun; lihat F-06) | Sebagian |
| 16 | Tanggal tak ada di kalender (`2026-02-30`) ditolak `CONTRACT_DATE` | G 1816 | `L/services/contracts/validate.ts:87, 97`; `L/services/contracts/dates.ts:23-31` | Ya |
| 17 | Pelaku huruf kecil/angka/`._-` maks 64; `taskRef`/kunci huruf/angka/`._-` maks 64 | G 1818-1819; A 422 | `L/contract/env.ts:149, 151` | Ya |
| 18 | `phase` `{from?, to}` 1..64 | G 1821 | `common.schema.ts:133, 709` | Ya |
| 19 | `cardIds` pola `t_`+8 heksa, unik, maks 64 | G 1822 | `env.ts:147, 158`; `common.schema.ts:697-702` | Ya |
| 20 | Butir wajib `key,title,status`; `dependsOn` maks 32 | G 1823 | `common.schema.ts:746-757`; `env.ts:158` | Ya |
| 21 | `refs`: tepat satu dari `documentId`/`docNumber`; `rel` wajib | G 1824 | `common.schema.ts:710-720` (`xorRequired` :719) | Ya |
| 22 | `line` hanya `kind: file`, `exitCode` hanya `kind: command`; `sha256` 8..64 heksa kecil | G 1825 | `common.schema.ts:721-745`; `env.ts:156` | Ya |
| 23 | Butir = baris `F:record/<n>` berbasis 1 bertipe `contractItem`; pid diwarisi per `key` | G 1835-1837 | `L/services/compose/snapshot.ts:457-463`; `L/services/structure/rows.ts:218-238` `inheritItemPids` | Ya |
| 24 | `META_REQUIRED_FOR_CREATE` saat buat tanpa `template` atau `meta.title` | G 1841-1842 | `L/services/submit/meta.ts:59-64` (salah satu saja sudah memicu; lihat F-03) | Sebagian |
| 25 | `missingRequired` berbentuk `content:<kunci>` | G 1872, 1954 | `L/services/completeness/compute.ts:221` | Ya |
| 26 | `?slot=record&shape=submission` mengembalikan `submission` + `submitTo: "POST /api/studio/slots"` | G 1904-1906; A 421 | `API/documents/[id]/content/route.ts:81-88, 112-118`; `L/services/structure/submission.ts:27-28` | Ya |
| 27 | Bab wajib tetap diharapkan walau `outline` null | G 1957-1958 | `compute.ts:99-104` | Ya |
| 28 | R21: `take` 1..200 bawaan 50, `status` maks 8 butir, `mission` 1..120 | G 1975, 1979; A 422 | `L/contract/env.ts:170`; `L/services/query/filters.ts:33, 189, 195-199, 209` | Ya |
| 29 | R21 `docNumber` cocok tepat atau bentuk aman | G 1973; A 422 | `L/services/query/contracts.ts:88-97` | Ya |
| 30 | R21 `cardId` cocok `cardIds` maupun `items[].key` berpola kartu | G 1976 | `L/services/contracts/project.ts:87-88, 159-168` (kolom cermin = gabungan); `contracts.ts:74` | Ya |
| 31 | R21 urut `updatedAt` terbaru; `matchedItems` hanya bila `cardId` | G 1967-1968, 1984-1985; A 422 | `contracts.ts:102, 154` | Ya |
| 32 | R22: `q` 2..200 sesudah dipangkas, `take` 1..100 bawaan 20, `revisionNo` hanya bersama `documentId`, `type` maks 8 | G 2000-2005; A 423 | `env.ts:166` (`SEARCH_LIMITS`); `filters.ts:252-269`, `:36` | Ya |
| 33 | R22 respons `{ hits, nextCursor, query: { q, config: "simple" } }`; snippet `[[`..`]]`; v1 tidak tercakup; 100.000 karakter | G 2007-2009, 2020-2022; A 423 | `API/search/route.ts:45`; `env.ts:162-168`; `L/services/query/search.ts:9-11, 97` | Ya |
| 34 | R21/R22 menolak parameter sebelum tagihan kuota | G 1964-1965, 2194-2196; A 422-423 | `API/contracts/route.ts:39-41`; `API/search/route.ts:41-43` (parse sebelum `checkQueryRate`) | Ya |
| 35 | Header `X-Studio-Quota-Bucket` / `X-Studio-Quota-Remaining`; bucket `render, validate, import, query` | G 2184-2185; A 300-301 | `env.ts:172-174`; `enums.ts:503` | Ya |
| 36 | Bawaan kuota 30/120/60/120 per 60 detik | G 2189-2192; A 288-311 | `L/http/render-guard.ts:26-27`; `API/validate/_shared/validate-rate.ts:26-27`; `API/import/markdown/_lib/import-rate.ts:22-23`; `L/http/quota.ts:32-34` | Ya |
| 37 | Dua bucket = sisa terkecil; 429 = Remaining 0; kiriman/PATCH hanya ber-header pada 429 | G 2197-2200; A 307-310 | `quota.ts:74, 95-106`; `render-guard.ts:66-77`; route ber-`withQuotaHeaders` hanya 8 berkas (Grep) | Ya |
| 38 | R23 badan `{ markdown, agentId? 1..80 }`, kunci lain 400; batas 4 MiB / 2.000.000 / 20 → 413 `DRAFT_TOO_LONG`/`DRAFT_TOO_MANY_BLOCKS` | G 2104-2106, 2123-2124; A 424 | `API/drafts/check/route.ts:56-57, 77-81, 102-109, 130-133`; `env.ts:185`; `enums.ts:529` | Ya |
| 39 | Kuota `validate` R23 ditagih satu per blok, semua sebelum dry-run pertama | G 2124-2125; A 424 | `API/drafts/check/route.ts:137-141` | Ya |
| 40 | Kode isu draf dan tingkatnya (5 galat, 3 peringatan); pagar `json` kolom 1 | G 2084-2086, 2112-2121; A 424 | `L/services/draft/extract.ts:40-41, 144-157, 196-260`; `L/services/draft/check.ts:96-103` | Ya |
| 41 | CLI `draft-check`: `--remote` baca env `INTERNAL_API_SECRET`; `--agent-id` hanya bersama `--remote`; kode keluar 0/1/2 | G 2093-2102, 2129-2130; R5 §11.3 amandemen | `scripts/studio/draft-check.ts:22-24, 260-278, 337-339`; keluar 1 juga untuk draf di atas batas (:311-316; lihat F-05) | Sebagian |
| 42 | `md2contract`: opsi, kode keluar 0/1/2/3, status/waktu tidak ditebak, `bab-wajib-kosong` di stderr | G 2156-2176 | `scripts/studio/md2contract.ts:7-25, 72-80, 117, 194`; peringatan `L/services/import/contract/index.ts:444, 491, 557` | Ya |
| 43 | Nama final `<aman>_rev<n>_<YYYYMMDDTHHMMSSZ>_<sha8>.<ext>`, aman maks 80, UTC detik dipotong | G 2033-2040; A 327 | `env.ts:178-181`; `L/services/render/final-name.ts:29-34, 70, 82-95` (aturan buang `-`/`.` tepi dan `DOC` tidak disebut; F-08) | Sebagian |
| 44 | R10: `X-Studio-Final-Filename` selalu; bawaan nama final hanya dokumen kontrak; `?name=final\|datum`, lainnya/berulang 400 `/query/name`; HEAD tanpa badan; `X-Studio-Sha256(-Verified)` | G 2042-2053; A 405-406 | `API/files/[id]/route.ts:47-53, 69, 89-93`; `API/files/_lib/serve.ts:98-108, 142-143` | Ya |
| 45 | EC25-EC28 semua 422; total 73 kode | G 2259-2267; A 252, 317-323; R3 851 | `L/contract/errors.ts:96-99`; hitung `python -I` atas `STUDIO_ERROR_CODES` = 73, `STUDIO_ERROR_HTTP` = 73 | Ya |
| 46 | `details` EC25 `{ pointer, documentId, reason }`; EC27 `{ key, positions }` berbasis 1; EC28 `{ pointer, form, dataShape, supported }` | G 2264-2267; A 319-323 | `L/services/contracts/refs.ts:82, 86-88` (rujukan via `docNumber` membawa `docNumber`, bukan `documentId`; F-04); `L/services/contracts/validate.ts:150-154`; `L/services/ingest/by-construction.ts:302-332` | Sebagian |
| 47 | Peringatan `CONTRACT_REF_PID_RETIRED` di `warnings` `[{ code, pointer, message, details? }]` pada kiriman, PATCH, R08 | G 2274-2276; A 323-326 | `L/contract/types/v2/contract.ts:101-106`; `refs.ts:114`; `L/services/revisions/v2/service.ts:340`; `L/services/submit/pipeline.ts:1041, 1099` | Ya |
| 48 | `chart.custom`: 9 bentuk (mark × orientation × stacked × data) → kode preset; DF-73 `palette, axis, max, width, height, legend` | G 2207-2222; R3 345 | `L/registry/charts.ts:1436-1449`; `forbidden.ts:136-140` | Ya |
| 49 | Aturan pasangan `custom`/`form`/`panels`/`artifactId` = `CHART_CUSTOM_FORM`; `orientation` bawaan `vertical`, `stacked` bawaan `false` | G 2223-2227 | `forbidden.ts` `chartCustomProblems`; `common.schema.ts:524-541`; `charts.ts:1459-1467` | Ya |
| 50 | Urutan evaluasi: kiriman dengan base basi + isi salah dijawab galat isi lebih dulu (FIX-C1) | G 2278-2298 | `pipeline.ts:869` (I54) sebelum `:921` (`checkBase` → 409) | Ya |
| 51 | Urutan evaluasi: `CHART_CUSTOM_FORM_UNSUPPORTED` sesudah `CONTRACT_REF_*` (langkah 7 sesudah 6) | G 2290-2292; A 262-265; R3 816; R5 §5.6 | EC28 dilempar compose `L/engine/chart/core/custom.ts:60`, dipanggil `pipeline.ts:926-939`, SEBELUM gerbang I55 `pipeline.ts:980`; `by-construction.ts:51` "EC28 ... dilempar compose SEBELUM gerbang" | Tidak (F-01) |
| 52 | Status per 2026-10-30: R10 HEAD dan `?name=` "belum di kode"; R03 `kind=contracts` "diserahkan ke DC-28"; pid butir "berbasis indeks" | R3 418, 944-945, §19.1 baris "Nama berkas final"; §19.3 | `API/files/[id]/route.ts:89`, `serve.ts:98`; `API/registry/route.ts:276`; `rows.ts:218-238` | Tidak (F-02) |
| 53 | Rujukan baris amandemen R5 DC-33 (`forbidden.ts:77-87, 130-135, 479`, `api.ts:266`, `contract.ts:115`, `sections.ts:20, 480`, `import/contract/types.ts:111-116`, `index.ts:607-610`, `enums.ts:436-452`) | R5 diff DC-33 | Dibaca satu per satu di kode working tree: semua menunjuk konstruk yang disebut | Ya |

Ringkas: 53 klaim; 46 cocok, 5 sebagian (F-03..F-06, F-08), 2 tidak cocok (F-01, F-02).

## 3. Pemeriksaan (checks)

| Cek | Hasil | Bukti |
|---|---|---|
| (a) ≥ 30 klaim dicek terhadap kode dengan file:baris | Pass | Tabel §2: 53 klaim |
| (b) Vonis D-139: panduan tidak meminta agen mengirim tampilan/label/format | Pass | G 1794 "label tampil (milik templat; agen tidak mengirim label)"; G 1808-1810 DF-72; G 2207-2209 "Warna, ukuran, sumbu, dan legenda tetap milik templat"; `formats` hanya opsi render (G 2026-2028, selaras R5 CV-25); `form.mark/orientation/stacked` = R5 §3 CV-17 "Lulus bersyarat" (pilihan analitis setara memilih kode preset). Tidak ada contoh yang membawa `label`/`heading`/`columns`/`order`/`palette`/`width` di luar `data.points[].label` (label kategori data, isi) |
| (c) Konsistensi antar-tiga dokumen dan dengan register 05 (nama sama persis) | Fail (sebagian) | Nama EC25-EC28, CH-01..CH-06, CW-01..04, DR-01..08, E53, C48-C51, R21-R23 identik huruf demi huruf di G, A, R3, R5 dan kode. Gagal: urutan EC28 (F-01) dan status "belum di kode"/§19.3 basi di R3 yang bertentangan dengan amandemen R5 DC-33 dan kode (F-02) |
| (d) Keterbacaan untuk Hermes: alur §17 dapat diikuti tanpa membaca seluruh panduan; contoh lengkap | Pass dengan catatan | §17 berurutan buat → bab → perbarui → kelengkapan → cari → render/unduh → draf → kuota → galat; 5 contoh JSON lengkap (diurai 5/5 sah). Celah: tidak ada satu panggilan HTTP POST lengkap (header rahasia + Content-Type) di §17 (F-07) |
| (e) Bahasa Indonesia, tanpa emoji, istilah konsisten | Pass | Pindai `python -I` bab 17 dan A: 0 emoji; 0 kata Inggris lepas (`should/must/please/the`); istilah tetap: kiriman, medan, galat, butir, bukti, rujukan, tenggat, pelaku, kode keluar; istilah teknis EN (dry-run, by-construction, checkpoint) tidak dimiringkan (Module H.4.2) |
| (f) Tanpa rahasia, URL produksi, port 9011 | Pass | Grep `9011\|https?://\|127.0.0.1\|localhost\|INTERNAL_API_SECRET=` pada keempat berkas: 0 hit di G, R3, R5; A hanya baris lama `/api/brahma/rbac/login` (bukan rahasia). Contoh memakai `$HQ_URL` dan `$INTERNAL_API_SECRET` |
| F.1 #6 Tanpa pernyataan bertentangan | Fail | F-01, F-02 |
| G.4 Rujukan silang tidak menggantung | Pass | Rujukan seksi 4, 4.1, 5.6, 6, 8.0, 9.4, 13, 17.2-17.13 di bab 17 semuanya ada (daftar judul `grep -n "^#"`) |
| Heading hierarchy §17 | Pass | `## 17` → `### 17.1`..`### 17.13`; judul `#` di dalam pagar kode tidak terhitung |
| Kriteria DC-33 "setiap contoh JSON lolos draft-check --remote" | Pass (bukti produsen) | `delegation_progress/document_specialist_dc33.md:23` (4 blok + 1 draf, exit 0, `valid: true`); reviewer: 5/5 JSON sah + medan cocok skema (§2 #14-#22) |
| Kriteria DC-34 "tabel route sama dengan ekspor route nyata" | Pass | §2 #3 |

## 4. Tabel konsistensi (tujuh sumbu)

| Sumbu | Hasil | Contoh / bukti |
|---|---|---|
| Terminologi | Pass | "laporan kerja", "slot `record`", "butir", "bukti", "rujukan" seragam di G §17, §0, §1.1, §12; A §12 memakai nama sama |
| Format angka dan tanggal | Pass | Ribuan bertitik (`2.000.000`, `100.000`, `20.000`), MiB biner; tanggal ISO di contoh |
| Gaya | Pass | Kalimat perintah untuk agen, tabel parameter seragam (Parameter / Isi) |
| Hierarki judul | Pass | Lihat §3 |
| Kapitalisasi | Pass | Kode enum ditulis persis (huruf kecil status, huruf besar vonis) |
| Satuan | Pass | "per 60 detik" seragam di G §17.11 dan A; ukuran 4 MiB di G dan A |
| Format rujukan | Pass | `seksi N.M` di G; `D-xxx` dan `§` di A/R3/R5 |

## 5. Temuan

| ID | Derajat | Lokasi | Deskripsi | Bukti | Usulan perbaikan | Rute |
|---|---|---|---|---|---|---|
| F-01 | Major | G 2290-2292 (§17.13 langkah 6-7); A 262-265; R3 816; R5 §5.6 (baris 9 tabel) | Urutan evaluasi menempatkan `422 CHART_CUSTOM_FORM_UNSUPPORTED` pada langkah by-construction SESUDAH rujukan kontrak (`CONTRACT_REF_*`). Di kode EC28 dilempar compose, sesudah cek dasar 409 dan SEBELUM gerbang I55 (rujukan) dan by-construction. Kiriman yang memuat rujukan salah dan bentuk custom yang tak didukung menerima EC28 lebih dulu, bukan EC25/EC26. Dampak ke agen kecil (keduanya galat isi), tetapi pernyataan urutan bertentangan dengan kode di empat dokumen. Catatan serupa yang lebih ringan: langkah 4 berlabel "murni dan sebelum kunci" padahal I54 berjalan di dalam kunci dokumen sesudah gabung (`pipeline.ts:840, 869`); `PID_CONFLICT` dari gabung (`L/services/compose/merge.ts:159-164`) muncul sebelum EC27, bukan di langkah 5; pada jalur buat `403 FORBIDDEN` (`pipeline.ts:766`) mendahului `META_CONFLICT`/`DOC_NUMBER_EXISTS` (`:769, :778`) | `L/engine/chart/core/custom.ts:60`; `pipeline.ts:926-939` lalu `:980`; `by-construction.ts:51` | G: pindahkan `CHART_CUSTOM_FORM_UNSUPPORTED` ke langkah baru "6. Susun (compose): 422 `CHART_CUSTOM_FORM_UNSUPPORTED`" sebelum rujukan; ganti "murni dan sebelum kunci" dengan "murni, sesudah gabung struktur, sebelum cek lingkup"; sebut `PID_CONFLICT` gabung di langkah 4. A: sesuaikan rantai baris 261-265. R3 §11.1 dan R5 §5.6: amandemen "EC28 dilempar compose (D-374), sesudah langkah 7 dan sebelum 9a" | G, A: `document-specialist`; R3: `data-analyst` (pemilik DC-32); R5: pemilik register 05 lewat controller |
| F-02 | Major | R3 418 ("sementara pid butir berbasis indeks, D-380"), 944 ("`API/files/[id]/route.ts` baru mengekspor `GET`"), 945 ("R03 `?kind=contracts` diserahkan ke DC-28"), §19.1 baris "Templat kontrak" ("seed DC-29/DC-30 berjalan") dan "Nama berkas final" ("R10 HEAD dan `?name=` belum di kode"), §19.3 baris 1-3 ("05 tidak disunting", "pencatatan ke 05 saat DC-33") | Register 03 memuat keadaan per waktu DC-32 yang kini bertentangan dengan kode dan dengan amandemen register 05 DC-33. Kode sudah punya HEAD R10 dan `?name=`, R03 `kind=contracts`, pewarisan pid butir per `key`; register 05 sudah mengamandemen `activeTiers`, `alsoAt`, dan baris E41 sehingga ketiga ketidakcocokan §19.3 tertutup. Pembaca register 03 menerima status pekerjaan yang salah | `API/files/[id]/route.ts:89-93`; `API/files/_lib/serve.ts:98-103`; `API/registry/route.ts:276-292`; `L/services/structure/rows.ts:218-238`; diff R5 DC-33 (amandemen §0.3, §5.4, §5.5, §6.1) | Tambah satu amandemen DC-42/fix di R3: perbarui baris 418, 944-945, dua baris §19.1, dan beri §19.3 kolom "Status" = "ditutup amandemen 05 DC-33 (D-384, D-367, D-371)"; atau tandai pernyataan berstempel sebagai sejarah "per DC-32" dengan rujukan ke keadaan sekarang | `data-analyst` (pemilik R3) |
| F-03 | Minor | G 1842 | "(tanpa keduanya `400 META_REQUIRED_FOR_CREATE`)" dapat dibaca "hanya bila keduanya tidak ada". Kode menolak bila salah satu tidak ada | `L/services/submit/meta.ts:59-64` | "bila `template` atau `meta.title` tidak ada: `400 META_REQUIRED_FOR_CREATE` (`details.missing`)" | `document-specialist` |
| F-04 | Minor | G 2264 | `details` EC25 ditulis `{ pointer, documentId, reason }`. Rujukan lewat `docNumber` membawa `docNumber` (bukan `documentId`); `reason: "REVISION"` menambah `revisionNo` dan `currentRevisionNo`, dengan `pointer` ke `.../revisionNo` | `L/services/contracts/refs.ts:82, 86-88` | `{ pointer, documentId \| docNumber, reason: "DOCUMENT" }` atau `{ pointer, documentId, revisionNo, currentRevisionNo, reason: "REVISION" }` | `document-specialist` |
| F-05 | Minor | G 2100-2102 | Daftar kode keluar CLI `draft-check` tidak menyebut bahwa draf di atas batas (4 MiB / 2.000.000 / 20 blok) menghasilkan kode `1` | `scripts/studio/draft-check.ts:22-24, 311-316` | Tambah "atau draf melebihi batas" pada kode `1` | `document-specialist` |
| F-06 | Minor | G 1816 | Notasi `(Z\|+07:00)` lebih sempit dari pola: zona `±HH:MM` apa pun diterima | `L/contract/env.ts:153-154` | `(Z\|±HH:MM, mis. +07:00)` | `document-specialist` |
| F-07 | Minor | G §17.4-§17.5, §17.8 | Keterbacaan Hermes: §17 menampilkan badan JSON kiriman tetapi tidak satu pun panggilan `POST` lengkap (header `x-internal-secret`, `Content-Type: application/json`); header hanya terlihat di contoh GET §17.7 dan R23 §17.9, atau di seksi 2. Langkah 1 §17.5 juga tidak menyebut `&agentId=<id>` agar `submission` langsung membawa `agentId` | `API/documents/[id]/content/route.ts:87-88` (opsi `agentId` untuk `shape=submission`) | Tambah satu blok `curl -X POST "$HQ_URL/api/studio/slots" -H "Content-Type: application/json" -H "x-internal-secret: $INTERNAL_API_SECRET" --data-binary @record.json` di §17.4 dan rujukan "autentikasi: seksi 2"; sebut `&agentId=` di §17.5 langkah 1 | `document-specialist` |
| F-08 | Minor | G 2038-2039 | Aturan "nomor dokumen aman" tidak menyebut pembuangan `-`/`.` di awal dan akhir serta pengganti `DOC` bila kosong. Dampak kecil karena agen mengambil nama dari header | `L/services/render/final-name.ts:29-34` | Tambah "lalu `-` dan `.` di tepi dibuang; hasil kosong = `DOC`" | `document-specialist` |

Hitungan: 0 Critical, 2 Major, 6 Minor.

## 6. Temuan siklus sebelumnya

Tidak ada (siklus 1).

## 7. Vonis dan tindak lanjut

Vonis keseluruhan: **CAUTION** (padanan kontrak: `NEEDS_REVISION`). Klaim isi untuk agen (route, parameter, batas, enum, kode galat dan HTTP, header, CLI) cocok dengan kode pada 46 dari 53 sampel; D-139 lulus; tanpa rahasia, URL produksi, atau port 9011. Dua temuan Major perlu ditutup sebelum DC-45: urutan EC28 di empat dokumen (F-01) dan status basi register 03 (F-02).

- `document-specialist`: F-01 (bagian G dan A), F-03..F-08. Semuanya suntingan teks kecil di §17.13, §17.3, §17.4, §17.5, §17.8, §17.9 dan A §12 baris 261-265.
- `data-analyst` (lewat controller): F-01 bagian R3 §11.1 (baris 816), F-02 (R3 baris 418, 944-945, §19.1, §19.3).
- Pemilik register 05 (lewat controller): amandemen §5.6 untuk F-01.
- Siklus berikut: tersisa 2 dari 3. Re-review cukup memeriksa ulang baris yang disebut di atas. Temuan Minor saja tidak membenarkan siklus tambahan.
