---
task_id: 2026-10-22_doc_artifact_studio
task_slug: doc_artifact_studio
row: FIX-HR2 (D-332 C1, C4, C9, C10; D-333 PUT)
date: 2026-10-30
agent: coder-execution
source_plan: decisions/decisions.md D-332, D-333; gateway_check/09d_review_hermes_batch.md; delegation_progress/final_phase_brief.md (pengecualian: baris ini mengubah kode di areanya)
status: needs-review
---

# Catatan Implementasi FIX-HR2: urutan galat R17, ROUTE_NOT_FOUND, cek timpa terbatas, alt-text bersama

Skill: receiving-code-review, dry-run-verify-fix. Klaim di `file_claims.md` (FIX-HR2 + perluasan). Semua tulis produksi atomik (`.tmp` lalu rename); `find src tests -name "*.tmp"` kosong.

Status `needs-review` HANYA karena satu bukti runtime: server dev :9021 memegang instans modul `contract/errors.ts` lama (dimuat sebelum suntingan), sehingga catch-all menjawab badan `ROUTE_NOT_FOUND` yang benar dengan status 200. Butuh restart server dev oleh controller, lalu asap diulang. Semua kriteria lain lulus.

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca brief, review 09d, D-332/D-333, catatan FIX-H1/HZ1/H2/H6/H8 | selesai | |
| 2 | C1 urutan galat R17 seragam | selesai | gerbang route + `assertRenderTarget` dihapus |
| 3 | C9 `ROUTE_NOT_FOUND` di enum + HEAD tanpa badan; PUT | selesai | PUT SUDAH diekspor sejak FIX-H6 (hipotesis DOC-3 keliru); dikunci uji |
| 4 | C10 cek timpa dengan kueri terbatas | selesai | |
| 5 | C4 `alt-text.ts` ke `engine/front/` | selesai | |
| 6 | Uji, tsc, eslint, suite, DOCX, asap | selesai kecuali C9 runtime | lihat Persistent Issues |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| `src/app/api/studio/documents/[id]/render/_lib/handler.ts` | modify | Hapus gerbang PDF route (dulu `:131-135`) dan dep `pdfPreflight`/`assertTarget`; satu gerbang di `renderScope` sesudah `prepareScopeRender`. Komentar urutan 401 -> 404 -> 409/404 alamat/422 -> 503 |
| `src/app/api/studio/documents/[id]/render/_lib/service.ts` | modify | Hapus `assertRenderTarget` (baca DB kedua) beserta impor `prisma`/`StudioEngineError` |
| `src/app/api/studio/documents/[id]/render/route.ts` | modify | Lepas pemasangan `pdfPreflight`/`assertTarget`; komentar kontrak |
| `src/lib/studio/contract/enums.ts` | modify | +`ROUTE_NOT_FOUND` di `STUDIO_ERROR_CODES` (aditif; pasangan wajib errors.ts) |
| `src/lib/studio/contract/errors.ts` | modify | `STUDIO_ERROR_HTTP.ROUTE_NOT_FOUND = 404` |
| `src/lib/studio/http/route-not-found.ts` | modify | `ROUTE_NOT_FOUND_CODE` bertipe `StudioErrorCode`, status dari `STUDIO_ERROR_HTTP`; HEAD -> 404 header sama tanpa badan; contoh `formats` huruf kecil; komentar kepala |
| `src/lib/studio/services/submit/overwrite.ts` | modify | `scopeTokenWhere` (token `changeScope` persis), `scopeReferences` (1 `findFirst` per lingkup), jendela `(minAcuan, n]` hanya revisi `pid:`/`renumberChapters`, 4 kolom. Aturan murni tidak berubah |
| `src/lib/studio/engine/front/alt-text.ts` | add (pindah) | dari `engine/docx/figures/alt-text.ts`, isi sama + catatan lokasi |
| `src/lib/studio/engine/docx/figures/alt-text.ts` | delete (pindah) | dipindah, bukan dihapus (rename) |
| `src/lib/studio/engine/docx/figures/{figure,index}.ts` | modify | impor/ekspor ulang dari `../../front/alt-text` (API publik `engine/docx/figures` tetap) |
| `src/lib/studio/engine/html/tables/figure.ts` | modify | impor dari `../../front/alt-text` (tidak lagi dari folder DOCX) + komentar |
| `src/lib/studio/engine/docx/blocks/media.ts`, `engine/html/blocks/device.ts` | modify | HANYA komentar rujukan path |
| `tests/unit/studio/api-structure/fixhr2-render-order.test.ts` | add | 36 uji: route + `renderScope` nyata + DB v21, matriks 5 formats x 6 kondisi + 503 sah + tanpa job |
| `tests/unit/studio/structure/fixhr2-overwrite-bounded.test.ts` | add | 7 uji: oracle baca-penuh vs terbatas (300 riwayat acak), jumlah baris dibaca, token persis |
| `tests/unit/studio/api/fixhr2-route-not-found.test.ts` | add | 13 uji: enum/HTTP, 7 metode, PUT, HEAD tanpa badan, hint huruf kecil, C4 satu sumber |
| `tests/unit/studio/api/fixh1-render-preflight.test.ts` | modify | HANYA tiruan deps: gerbang pindah ke tiruan layanan |
| `tests/unit/studio/api/fixhz1-render-order.test.ts` | modify | HANYA seksi (2): tanpa `assertRenderTarget`; route tidak membaca DB |
| `tests/unit/studio/api/http-errors.test.ts` | modify | hitungan kode 68 -> 69 + `ROUTE_NOT_FOUND: 404` di `SPEC_HTTP` |

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Unit baru + ubahan | `npx vitest run tests/unit/studio/api-structure/fixhr2-render-order.test.ts` | `Tests 36 passed (36)` | DB `gsp_agent_hq_v21`, residue `{docs:0,assets:0,templates:0,jobs:0}`, sidik 000/001/002 sama |
| | `npx vitest run tests/unit/studio/structure/fixhr2-overwrite-bounded.test.ts` | `Tests 7 passed (7)` | uji mutasi: `scopeTokenWhere` diganti `contains` -> 1 gagal (token persis); dipulihkan |
| | `npx vitest run .../api/fixhr2-route-not-found.test.ts .../fixh6-route-not-found.test.ts .../http-errors.test.ts tests/unit/studio/figures` | `Test Files 14 passed (14)`, `Tests 617 passed (617)` | |
| | `npx vitest run .../api/fixh1-render-preflight.test.ts .../api/fixhz1-render-order.test.ts` | `Tests 33 passed (33)` | |
| | `npx vitest run .../api-structure/fixh2-overwrite.test.ts .../structure/fixh2-overwrite-pure.test.ts .../api-structure/pid.test.ts` | `Tests 32 passed (32)` | uji DB FIX-H2 (hasil sama) |
| Suite studio | `npx vitest run tests/unit/studio` | `Test Files 85 passed (85)`, `Tests 2303 passed / 1 skipped (2304)` | termasuk uji baris lain yang ada saat dijalankan |
| Typecheck | `npx tsc --noEmit -p .` | exit 0 | |
| Lint area | `npx eslint "src/app/api/studio/documents/[id]/render" "src/app/api/studio/[[...notfound]]" src/lib/studio/http/route-not-found.ts src/lib/studio/contract/{errors,enums}.ts src/lib/studio/services/submit/overwrite.ts src/lib/studio/engine/front/alt-text.ts src/lib/studio/engine/docx/figures src/lib/studio/engine/html/tables/figure.ts .../docx/blocks/media.ts .../html/blocks/device.ts` + 5 berkas uji fixhr2/fixh1/fixhz1 | exit 0 | `http-errors.test.ts` punya 3 `no-explicit-any` PRA-ADA (`git show HEAD:` baris 130 `code as any`), bukan dari baris ini |
| DOCX v1 Manual 000 | `npx tsx scripts/parity/run/render_cli.ts --doc benchmark/manual000/doc.json --template benchmark/manual000/template.json --formats docx,html --out <Temp>/hq_v21_clone/fixhr2/...` | HEAD (`git archive`) `53485ebc1eddd145…`; pohon kerja SEBELUM C4 `38b489b97677a98d…`; SESUDAH FIX-HR2 `38b489b97677a98d…`; HTML sebelum = sesudah `e05a18f24291311e…` | FIX-HR2 netral byte. Selisih HEAD -> pohon kerja = HANYA 52 `wp:docPr` (`word/document.xml` identik setelah `wp:docPr` dibuang; mis. `name="Picture 1"` -> `name="Logo sampul (dekoratif)" descr=""`) = FIX-H8 + FIX-HZ2, bukan baris ini |
| Asap :9021 | `FIXHR2_SECRET=$(cat .../trial_internal_secret) NODE_PATH=<repo>/node_modules npx tsx --tsconfig tsconfig.json <scratchpad>/fixhr2/fixhr2_smoke.ts` | `RESULT pass=39 fail=8` | 8 gagal = semua cek status C9 (lihat Persistent Issues); grep rahasia di log = 0 |

## Verification

- **C1** (unit DB + asap): untuk formats `pdf`, `docx+pdf`, `PDF`, bawaan snapshot, `docx`: tanpa sesi 401; dokumen tak ada 404 `DOCUMENT_NOT_FOUND`; `revisionNo` 99 -> 404 `REVISION_NOT_FOUND`; render penuh dokumen INCOMPLETE -> 409 `DOCUMENT_INCOMPLETE` (+ `allowedScopes`, `completeness`); bab 9 -> 404 `ADDRESS_NOT_FOUND`; slot tak dikenal -> 422 `SLOT_UNKNOWN`; cek kesiapan tidak dipanggil pada semua galat sasaran. Sasaran sah + pdf (3 varian) -> 503 `PDF_ENGINE_UNAVAILABLE` `stage:preflight`, `Retry-After: 300`. 0 job untuk dokumen fixture. Sebelumnya `["pdf"]` pada dokumen INCOMPLETE = 503 (review C1). Asap 31/31 cek C1 lulus. Unit fixhz1: route tidak membaca `studioDocument`/`studioRevision` sendiri untuk formats apa pun.
- **C9**: `STUDIO_ERROR_CODES` memuat `ROUTE_NOT_FOUND`, `STUDIO_ERROR_HTTP` 404; catch-all mengekspor GET/HEAD/POST/PUT/DELETE/PATCH/OPTIONS; PUT path tak ada -> 404 JSON (unit); HEAD -> 404, `x-correlation-id`, `content-type`, `no-store`, `res.body === null` (unit); hint `formats` huruf kecil (unit + asap badan). Runtime :9021: badan/hint/correlation benar, status 200 (Persistent Issues).
- **C10**: hasil identik dengan oracle baca-penuh pada 300 riwayat acak (> 30 kasus berkonflik) + 6 skenario terarah; riwayat 253 revisi -> 2 baris revisi dibaca (dulu 253), kolom `revisionNo, changeScope, createdBy, parentRevisionNo`; tanpa sunting sesudah acuan -> 1 baris; dengan `baseRevisionNo` -> tanpa baca acuan. `chapter:1` tidak tertukar `chapter:10`. Uji DB FIX-H2 6/6 dan asap skenario Hermes (PATCH -> kirim ulang bab lama 409 `PATCHED_PIDS_OVERWRITTEN` dengan pid 4.1.2 dan `editedInRevision` benar, 0 tulis; bab lain 201; dengan base terbaru 201) lulus.
- **C4**: `engine/docx/figures` mengekspor fungsi yang SAMA (identitas objek) dengan `engine/front/alt-text`; `html/tables/figure.ts` tanpa impor `docx/figures`; berkas lama tidak ada; DOCX/HTML Manual 000 byte-identik sebelum/sesudah.
- Fixture asap: 2 run, misi `2026-10-30_fixhr2_<acak>`; Z0 sisa `[0,0,0,0]` (dokumen, revisi, identitas, job), Z1 jumlah dokumen dan job global kembali. Pohon sementara DOCX di `%TEMP%/hq_v21_clone/fixhr2/` dibersihkan (junction dilepas lebih dulu dengan `rmdir`; `node_modules` repo utuh, 452 entri).

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Asap :9021: catch-all menjawab badan `ROUTE_NOT_FOUND` benar tetapi status 200 (8 cek C9) | 2 (sentuh ulang `errors.ts`/`enums.ts`, curl ulang) | Server dev Turbopack memakai instans modul `contract/errors.ts` yang dimuat SEBELUM suntingan (server mulai ~11:10; suntingan ~11:19). Bukti: log JSONL entri baru tanpa medan `status` (= `STUDIO_ERROR_HTTP.ROUTE_NOT_FOUND` undefined di proses), padahal chunk hasil kompilasi `.next/dev/server/chunks/[root-of-the-server]__37cf2d44._.js:325` memuat `ROUTE_NOT_FOUND: 404` dan unit (modul segar) = 404. Badan baru (hint huruf kecil) terlayani karena `route-not-found.ts` baru dimuat pertama kali sesudah suntingan | terbuka; perlu restart server dev :9021 (tidak dilakukan: server dipakai baris paralel) lalu ulang skrip asap | tidak untuk kode; ya untuk bukti runtime C9 |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| 2 | Lokasi satu-satunya gerbang PDF | di `renderScope` (sudah ada sejak FIX-H1, sesudah `prepareScopeRender`); route bersih dari baca DB dan gerbang. 429 `RATE_LIMITED` dan 503 `RENDER_QUEUE_FULL` tetap sebelum 404 (pra-ada, bukan preflight) |
| 2 | R07/R09 | R07 `rerenderRevision` sudah 404 -> 409 -> 503 (FIX-HZ1, di luar area); R09 tanpa PDF. Tidak diubah |
| 3 | Enum di `enums.ts`, bukan `errors.ts` | `STUDIO_ERROR_HTTP` bertipe `Record<StudioErrorCode, number>`, jadi kode wajib masuk `STUDIO_ERROR_CODES`; perubahan 1 baris aditif, diklaim sebagai perluasan |
| 3 | PUT (D-333) | catch-all sudah mengekspor PUT sejak FIX-H6; catatan DOC-3 adalah hipotesis "belum diuji". Kini dikunci uji (7 metode Next) |
| 3 | HEAD | tanpa badan di helper (bukan bergantung pada Next), header identik GET |
| 4 | Ketepatan token `changeScope` | `equals` / `startsWith "t;"` / `endsWith ";t"` / `contains ";t;"`; substring polos akan membuat `chapter:10` dianggap acuan `chapter:1` dan menutup konflik (dibuktikan uji mutasi) |
| 4 | Lingkup dengan acuan 0 (belum pernah dikirim) | jendela tetap dari 0 demi hasil sama (bab hasil struktur dapat punya sunting); hanya revisi `pid:`/renumber yang dibaca |
| 6 | Jangkar DOCX `53485ebc…` | tidak berlaku lagi di pohon kerja sejak FIX-H8/FIX-HZ2 (selisih hanya `wp:docPr`); FIX-HR2 netral byte. Controller/SR terkait perlu memperbarui jangkar v1 |
| - | Dokumentasi (DOC-3) | panduan + API-REFERENCE: urutan R17 kini 401 -> 404 -> 409/404 alamat/422 -> 503 untuk semua formats (koreksi "pdf eksplisit 503 dulu"); `ROUTE_NOT_FOUND` anggota enum (69 kode); HEAD tanpa badan; PUT sudah 404 JSON |

## Next Steps

- Controller: restart server dev :9021, lalu ulang `<scratchpad>/fixhr2/fixhr2_smoke.ts` (ekspektasi 47/47).
- DOC-3: sesuaikan teks urutan galat R17 dan daftar kode (butir di atas).
- Review kode direkomendasikan (lingkup: tabel Changes Made).
