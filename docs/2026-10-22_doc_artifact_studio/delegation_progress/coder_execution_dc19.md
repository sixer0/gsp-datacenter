---
task_slug: doc_artifact_studio
row: DC-19
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/masterplan/05_document_contract_specs.md §9.6
status: complete
---

# DC-19 Header kuota (QH-01..QH-06, bucket `query`)

## Ringkasan
- Baru `src/lib/studio/http/quota.ts`: C46/C47 + env `STUDIO_QUERY_RATE_LIMIT`/`_WINDOW_MS`, `checkQueryRate` (identitas = `quotaRateIdentity`, sama dengan validate), `recordQuotaCharge`, `quotaReport` (sisa terkecil, seri urutan E53), `applyQuotaHeaders` (429 -> "0"; header beku disalin), `withQuotaHeaders(ctx, run)`; C48/C49/E53 lokal dengan `// TODO(DC-05): ganti impor dari contract` (register 14.1/14.2 menempatkannya di `L/contract/env.ts` dan `L/contract/enums.ts`).
- Tiga bucket (render-guard, validate-rate, import-rate) kini mencatat tagihan pada ctx dan respons 429 membawa C48=0 + C49 + `Retry-After` tetap. `renderRateIdentity` mendelegasikan ke `quotaRateIdentity` (menghindari siklus impor; perilaku sama). 401 tanpa header (belum ada tagihan).
- needs-review: header pada 2xx/4xx/5xx sesudah tagihan butuh edit route di luar kepemilikan (lihat Titik pasang).

## Titik pasang yang dibutuhkan (route handler, bukan milik DC-19)
| Route | Berkas | Pasang |
|---|---|---|
| R08 validate (+`?preview=html` dua bucket) | `src/app/api/studio/validate/route.ts` POST (sesudah `checkValidateRate`, baris ~427) | bungkus isi `try` dengan `withQuotaHeaders(ctx, ...)` atau `applyQuotaHeaders(res, ctx)` di setiap `return` sesudah tagihan, termasuk cabang `failure` |
| Impor markdown (+`?validate=1`) | `src/app/api/studio/import/markdown/route.ts` POST (sesudah `checkImportRate`, baris ~135) | sama; termasuk respons `readJsonObject` gagal dan `reject` SCHEMA_INVALID sesudah tagihan |
| R17 render | `src/app/api/studio/documents/[id]/render/_lib/handler.ts` `handleRenderPost` (sesudah `deps.checkRate`, baris ~118) | sama |
| R07 POST revisions | `src/app/api/studio/documents/[id]/revisions/route.ts` (baris ~127) | sama |
| R09 POST artifacts | `src/app/api/studio/artifacts/route.ts` (baris ~103) | sama |
| R21, R22 (baru) | route kontrak/search | `checkQueryRate(caller, ctx)` lalu `withQuotaHeaders` |
| Opsional | `src/lib/studio/http/index.ts` | re-ekspor `./quota` (sekarang diimpor langsung `@/lib/studio/http/quota`) |

Catatan: route lain pemakai bucket render (R04 POST documents, R06 PATCH blok, structure, paragraphs, chapters submit-kit) tidak tercantum di QH-01 namun 429-nya ikut membawa header karena dibangun di `checkRenderRate`.

## Bukti
| Cek | Perintah | Hasil |
|---|---|---|
| Uji baru | `npx vitest run tests/unit/studio/api/dc19-quota.test.ts` | 19/19 lulus (sisa 2,1,0 per bucket x4; 429 sisa 0 + bucket + Retry-After; 401 route validate/import/render tanpa header; route nyata 429 validate/import/render-preview; QH-04 terkecil + seri E53) |
| Regresi | `npx vitest run tests/unit/studio/api tests/unit/studio/fix1 tests/unit/studio/import` | 34 berkas, 870 uji lulus |
| Lint | `npx eslint` pada 5 berkas milik DC-19 | exit 0, 0 temuan |
| Tipe | `npx tsc --noEmit -p .` | exit 0, tanpa galat |

## Berkas
- add `src/lib/studio/http/quota.ts`; modify `src/lib/studio/http/render-guard.ts`, `src/app/api/studio/validate/_shared/validate-rate.ts`, `src/app/api/studio/import/markdown/_lib/import-rate.ts`; add `tests/unit/studio/api/dc19-quota.test.ts`.
- Server :9021 tidak dijalankan (sesuai brief); asap diganti uji handler/unit.

## Pembaruan D-364 (opsi b: kepemilikan diperluas ke titik pasang)
- Dibungkus `withQuotaHeaders(ctx, ...)` saja, tanpa perubahan perilaku lain (isi handler dipindah apa adanya ke fungsi dalam): `src/app/api/studio/validate/route.ts` (`postValidate`), `src/app/api/studio/import/markdown/route.ts` (`postImport`), `src/app/api/studio/documents/[id]/render/_lib/handler.ts` (`handleRenderPost` -> `renderPost`), `src/app/api/studio/documents/[id]/revisions/route.ts` (`postRevision`), `src/app/api/studio/artifacts/route.ts` (`postArtifact`). `src/lib/studio/http/index.ts`: re-ekspor `./quota` saja. R21/R22 memasang sendiri nanti.
- C48/C49/E53 tetap lokal dengan `TODO(DC-05)`.

| Cek | Perintah | Hasil |
|---|---|---|
| Uji DC-19 | `npx vitest run tests/unit/studio/api/dc19-quota.test.ts` | 26/26 lulus: validate 2xx sisa 4 lalu 3, 403 dan 500 sesudah tagihan berheader, JSON rusak pratagihan tanpa header, `?preview=html` melaporkan render 1; impor 200 (import 4) dan 400 (import 3); R17 200 (render 2), 404 (render 1), 429 (render 0 + Retry-After), 400 pratagihan tanpa header; 401 validate/impor/R17 tanpa header |
| Regresi | `npx vitest run tests/unit/studio/api tests/unit/studio/import` | 32/33 berkas, 836/837. Satu gagal: `http-errors.test.ts` mengharapkan 69 kode galat, ditemukan 73. Sebabnya EC25-EC28 yang ditambahkan DC-05 di `src/lib/studio/contract/errors.ts` (register 13.3: 69 -> 73), bukan perubahan DC-19; uji itu milik controller/DC-05 untuk diselaraskan. Sebelum perubahan DC-05: 34/34 berkas, 870 lulus |
| Lint | `npx eslint` pada 11 berkas milik DC-19 | exit 0 |
| Tipe | `npx tsc --noEmit -p .` | exit 0 |
