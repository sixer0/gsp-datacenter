---
task_slug: doc_artifact_studio
row: DC-15, DC-16 (+ T2-68 amandemen, IB-DC-1 bagian quota.ts)
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/07_document_contract_blueprint.md
status: complete
---

# Laporan: DC-15 R21 + DC-16 R22 + T2-68 + IB-DC-1 (quota)

## Changes Made
| File | Jenis | Deskripsi |
|---|---|---|
| `src/app/api/studio/contracts/route.ts` | add | R21 GET: `requireSession` -> `reqCtx` -> `withQuotaHeaders` { `getStudioCaller`, `parseContractQuery` (400), `checkQueryRate` (429), `queryContracts` } ; galat lewat `failure` (`exposeCorrelationId`) |
| `src/app/api/studio/search/route.ts` | add | R22 GET: pola sama; `parseSearchQuery`, `searchBlocks`; 200 + `query: { q, config: STUDIO_FTS_CONFIG }`; log galat hanya `qLength` |
| `src/lib/studio/contract/types/v2/contract.ts` | modify | HANYA T2-68 `ContractSummaryV2.status: AgentWorkReportStatus \| null` (D-370, §7.6) |
| `src/lib/studio/services/query/contracts.ts`, `index.ts` | modify | HANYA tipe: `ContractSummaryResult` dihapus, memakai `ContractSummaryV2` |
| `src/lib/studio/http/quota.ts` | modify | IB-DC-1: 4 definisi lokal bertanda `TODO(DC-05)` diganti impor dari `contract/enums` (E53) + `contract/env` (C48/C49); diteruskan sebagai binding yang sama (bukan definisi kedua) agar `http/index.ts` dan `dc19-quota.test.ts` tetap jalan; nilai identik |
| `tests/unit/studio/api/dc15-contracts-route.test.ts`, `dc16-search-route.test.ts` | add | 6 + 11 uji (layanan di-mock, parser asli) |

## Test Results
| Jenis | Perintah | Hasil |
|---|---|---|
| Uji handler baru | `npx vitest run tests/unit/studio/api/dc15-contracts-route.test.ts tests/unit/studio/api/dc16-search-route.test.ts` | 2 berkas, 17/17 lulus |
| Regresi | `npx vitest run tests/unit/studio/api tests/unit/studio/query` | 30 berkas, 788/788 lulus (termasuk dc19-quota) |
| Typecheck | `npx tsc --noEmit` | 0 galat di berkas DC-15/16; 5 galat di berkas uji agen paralel yang sedang berjalan: `tests/unit/studio/draft/dc22-draft-check.test.ts` (4, DC-22) dan `tests/unit/studio/figures/dc27-chart-custom.test.ts` (1, DC-27) — bukan kepemilikan baris ini |
| Lint | `npx eslint` atas 2 route, quota.ts, services/query, contract.ts, 2 berkas uji | exit 0 |

## Verification (asap :9021, rahasia uji lewat substitusi shell, hanya GET, 0 tulis DB)
- Tanpa rahasia: R21 dan R22 -> 401, tanpa header kuota.
- R21 `?status=complete` -> 200 `{"contracts":[],"nextCursor":null}`, `x-studio-quota-bucket: query`, sisa 119 lalu 118 (cid `59a68a9d-00f3-4826-ae69-326669470cbd`, `ea51f1d0-83b3-4d21-9fba-74be06e2237a`). Daftar kosong: v21 belum punya dokumen ber-contractKind.
- R21 `?status=issued` -> 400 `SCHEMA_INVALID` `/query/status` (cid `4a40fac3-a788-4f45-bf73-3f873501c869`): `issued` bukan anggota E45 (`draft, complete, partial, blocked, needs-review`), sesuai §9.1.
- R21 `?foo=1` -> 400 `/query/foo` (cid `ac57597a-70a5-4f8c-9bc8-8ec672ce52ee`), tanpa header kuota.
- R22 `?q=laporan&take=3` -> 200, 3 hit ber-`pid` + `address` (mis. `b-bc3bc6429c97b72f` @ `8.4.2`, `p-bga87q2bpz` @ `F:references/1`), `nextCursor` ada, `query.config: simple` (cid `1b5f8b9b-d269-45d2-a682-6ac5da110abc`).
- R22 `?q=` -> 400 `/query/q` (cid `b9212026-6fc7-488c-900b-e2eaf3fe2549`); `q='; DROP TABLE "StudioDocument"; --` -> 200 `hits: []` (cid `132aab5d-383c-4a56-afea-2dd877a67b0f`); `q=!!!` -> 200 `hits: []`.

## Issues & Decisions
| Langkah | Isu / Keputusan | Resolusi |
|---|---|---|
| Urutan galat | Brief: 401 -> 400 -> 429. Validasi parameter diletakkan SEBELUM tagihan bucket, sehingga 400 tidak memakan kuota dan tidak membawa header kuota (konsisten QH-03: header hanya sesudah tagihan). 200/429/5xx membawa header | Diterapkan di R21/R22; diuji (kuota 1: sah 200 -> salah 400 -> sah 429) |
| Asap `?status=issued` | Brief mengharapkan 200; spesifikasi §9.1 + parser DC-14 menolaknya (bukan anggota E45) | Asap memakai `status=complete` untuk 200; `issued` tercatat 400 sesuai register |
| IB-DC-1 | `http/index.ts` (bukan milik baris ini) dan `dc19-quota.test.ts` mengimpor 4 nama dari `http/quota` | quota.ts meneruskan binding kontrak (satu definisi). Bila controller ingin menghapus terusan, ubah `http/index.ts` + uji dc19 agar mengimpor dari `@/lib/studio/contract` |

## Next Steps
- Review recommended (lingkup: 2 route baru + quota.ts) bersama tanda akses AS-2/DC-41 dari D-370.
