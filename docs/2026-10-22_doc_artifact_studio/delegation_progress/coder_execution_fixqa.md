---
task_id: FIX-QA
task_slug: doc_artifact_studio
row: FIX-QA (FIX-R40-1 + FIX-R40-5)
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/gateway_check/12_review_document_contract.md (temuan #1, #6; baris :56, :60); D-364, D-366, D-397, D-399; masterplan/05_document_contract_specs.md §9.6 QH-01..QH-06
status: complete
---

# Implementation Report: FIX-QA header kuota R04/R12/R13/R06/R16/R14 + helper `checkBucketRate`

Skill dimuat: `backend-execution`, `dry-run-verify-fix`.

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Uji karakterisasi 4 limiter ditulis dan dijalankan pada kode LAMA (baseline) | complete | `fixqa-bucket-rate.test.ts` 17/17 sebelum refaktor |
| 2 | FIX-R40-5: `checkBucketRate` + `rateEnvInt` di `http/quota.ts`; render/validate/import/query jadi pemanggil 1 baris | complete | uji karakterisasi 17/17 sesudah refaktor (diff perilaku 0) |
| 3 | FIX-R40-1: bungkus 5 handler (6 route) dengan `withQuotaHeaders` | complete | pola `artifacts/route.ts`; badan handler dipindah ke fungsi dalam tanpa ubah isi |
| 4 | Uji route per R04/R12/R13/R06/R16/R14 | complete | 30/30; pada kode route HEAD (sebelum fix) 18 gagal = 2xx/4xx/5xx tanpa header |
| 5 | tsc, eslint, uji terarah, satu run penuh, asap :9021 | complete | lihat Test Results |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| `src/lib/studio/http/quota.ts` | modify | + `rateEnvInt` (ganti `envInt` lokal) + `checkBucketRate(bucket, limiter, caller, ctx, message, logLabel?)`: kunci sha256(`bucket` NUL `quotaRateIdentity`)[0..32], `hit`, `recordQuotaCharge`, 429 `reject` + `applyQuotaHeaders`; `logLabel` opsional agar konteks log render tetap tanpa `limiter`; `checkQueryRate` memakai helper |
| `src/lib/studio/http/render-guard.ts` | modify | `checkRenderRate` -> `checkBucketRate("render", ...)`; `rateKey`/`envInt` lokal dihapus; `renderRateIdentity` tetap diekspor (dipakai `assets/route.ts`) |
| `src/app/api/studio/validate/_shared/validate-rate.ts` | modify | `checkValidateRate` -> helper; `renderRateIdentity` -> `quotaRateIdentity` (lewat helper); `envInt` lokal dihapus |
| `src/app/api/studio/import/markdown/_lib/import-rate.ts` | modify | sama, bucket `import` |
| `src/app/api/studio/chapters/_shared/submit-kit.ts` | modify | R12/R13: `handleSubmit` -> `withQuotaHeaders(ctx, () => submitBody(...))` |
| `src/app/api/studio/documents/route.ts` | modify | R04 POST -> `withQuotaHeaders(ctx, () => postDocument(...))` |
| `src/app/api/studio/documents/[id]/blocks/[address]/route.ts` | modify | R06 PATCH -> `patchBlockRoute` terbungkus |
| `src/app/api/studio/documents/[id]/paragraphs/[pid]/route.ts` | modify | R16 PATCH -> `patchPidRoute` terbungkus |
| `src/app/api/studio/documents/[id]/structure/route.ts` | modify | R14 PATCH -> `patchStructureRoute` terbungkus |
| `tests/unit/studio/api/fixqa-bucket-rate.test.ts` | add | 17 uji karakterisasi: identitas, kunci hash per bucket x 3 jenis pemanggil, batas bawaan/env/env tidak sah, 429 (kode, pesan, details, konteks log + urutan kunci, Retry-After, C48/C49, correlation id, badan) |
| `tests/unit/studio/api/fixqa-route-quota.test.ts` | add | 30 uji (6 route x 5): 2xx sisa menurun, 403/409/500 sesudah tagihan bawa header, 429 sisa 0 + Retry-After, 401 tanpa header, 400 pra-tagihan tanpa header dan tanpa menagih |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | 0 galat di luar `dc35-*` | 9 galat TS18048 hanya di `tests/unit/studio/contract/dc35-code-matrix|dc35-findings|dc35-golden-md2contract.test.ts` (milik agen uji DC-35, sedang berjalan; bukan berkas FIX-QA) |
| Lint | `npx eslint` 9 berkas src + 2 uji | exit 0 | |
| Unit terarah | `npx vitest run tests/unit/studio/api/fixqa-*.test.ts tests/unit/studio/api/dc19-quota.test.ts` | 3 files, 43+30 passed | dc19 26/26 hijau |
| Unit terarah | `npx vitest run tests/unit/studio/api tests/unit/studio/api-structure` | Test Files 42 passed, Tests 896 passed | api-structure memakai fixture DB uji dengan teardown residu 0 (milik suite, bukan tulisan agen) |
| Unit penuh (1x) | `npx vitest run tests/unit/studio` | Test Files 140 passed; Tests 3144 passed, 3 expected fail, 1 skipped | Duration 145.93s |
| Bukti kebalikan | route HEAD dipulihkan sementara, `fixqa-route-quota` dijalankan, lalu dikembalikan | 18 failed / 12 passed | membuktikan uji menangkap ketiadaan header; berkas dipulihkan (diff stat 5 x +7/-1) |

## Verification
- Asap :9021 (rahasia lewat substitusi shell, tidak dicetak; tanpa tulis DB): POST `/api/studio/chapters` target `documentId` tak ada -> 404 `DOCUMENT_NOT_FOUND` sesudah tagihan: cid `c6a4de0c-ac76-487e-9a5a-cc54139988db` `x-studio-quota-bucket: render`, `x-studio-quota-remaining: 29`; panggilan kedua cid `12c1e032-ae49-42fe-b436-3df5e2983d31` sisa `28`. Tanpa rahasia -> 401 tanpa header kuota (QH-03).
- Diff perilaku 0 FIX-R40-5: uji karakterisasi yang sama hijau sebelum dan sesudah refaktor (kunci hash, pesan, details, konteks log termasuk ketiadaan `limiter` pada render, Retry-After, header, batas/jendela env).

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| tsc 9 galat TS18048 di `tests/unit/studio/contract/dc35-*.test.ts` | 0 (di luar kepemilikan) | uji DC-35 milik agen lain (`r.doc.sections` opsional) | dilaporkan ke controller | Tidak untuk FIX-QA; ya untuk gerbang tsc 0 global |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 2 | Log 429 render tidak pernah memuat `limiter`, tiga bucket lain memuatnya | `logLabel` opsional; render memanggil tanpa label agar log identik |
| 2 | `checkBucketRate` tidak diekspor lewat barrel `http/index.ts` | index.ts di luar kepemilikan; pemanggil mengimpor dari `@/lib/studio/http/quota` (pola yang sudah ada untuk `applyQuotaHeaders`) |
| 3 | R12 dan R13 berbagi `submit-kit.ts` | dibungkus satu kali di `handleSubmit`; `chapters/route.ts` dan `slots/route.ts` tidak disentuh |
| 3 | QH-01 register belum mencantumkan R04/R12/R13/R06/R16/R14 di bucket render | amandemen register milik DC-33/controller (tidak ditulis agen ini) |

## Next Steps
- Controller: amandemen QH-01 (R04/R12/R13/R06/R16/R14 -> bucket render) dan baris API-REFERENCE §12 "header hanya pada 429" untuk keenam route (D-397 selisih (1)) kini usang.
- Review recommended (lingkup: 9 berkas src di atas).
