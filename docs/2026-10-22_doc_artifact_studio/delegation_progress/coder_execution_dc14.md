---
task_slug: doc_artifact_studio
row: DC-14
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/07_document_contract_blueprint.md (DC-14); register masterplan/05_document_contract_specs.md §8.1-§8.2, §9.1-§9.2, §14.1, §15 I65/I66, CA-5
status: complete
---

# Implementation Report: DC-14 layanan retrieval (`services/query`)

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca register §7-§9, §13-§15, CA-5, marker 06, skema Prisma M19/M20/MX09/MX10, pola R04 GET | complete | Kontrak read-only, hanya diimpor |
| 2 | `filters.ts` murni: parse/validasi R21/R22, kursor base64url `{ r, id }` | complete | Isu `/query/<nama>`, lempar `StudioEngineError("SCHEMA_INVALID")` |
| 3 | `contracts.ts` (I65) atas MX09 + M20 `matchedItems` | complete | Prisma `findMany` + prafilter `docNumber` `$queryRaw` bertag |
| 4 | `search.ts` (I66) teks penuh revisi terkini | complete | `websearch_to_tsquery($cfg::regconfig, $q)` terparameter, `ts_headline` hanya di CTE berbatas |
| 5 | `log.ts` (JSONL harian tahan lama `logs/query/`), `db.ts` (suntik klien transaksi), `index.ts` | complete | Tanpa nilai `q`/filter di log (hanya nama medan, panjang q) |
| 6 | Uji unit murni + asap transaksi-rollback v21 | complete | 21/21 unit, 16/16 asap |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/lib/studio/services/query/filters.ts | add | Validasi filter kontrak/pencarian, kursor, set status/type gabungan |
| src/lib/studio/services/query/contracts.ts | add | `queryContracts` (I65), `contractWhere`, `ContractSummaryResult` |
| src/lib/studio/services/query/search.ts | add | `searchBlocks` (I66), `searchConditions` (`Prisma.sql` fragmen) |
| src/lib/studio/services/query/db.ts | add | `QueryDb`/`QueryOptions` (klien suntik, correlationId) |
| src/lib/studio/services/query/log.ts | add | Log terstruktur tahan lama (sink JSONL `http/jsonl`) |
| src/lib/studio/services/query/index.ts | add | Barrel |
| tests/unit/studio/query/dc14-filters.test.ts | add | 21 uji murni |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | exit 0 | repo penuh, 0 galat (termasuk area agen paralel saat dijalankan) |
| Lint | `npx eslint src/lib/studio/services/query tests/unit/studio/query` | exit 0 | 0 masalah |
| Unit | `npx vitest run tests/unit/studio/query` | 1 file, 21 passed | validasi filter, kursor, WHERE terparameter |
| Asap DB | `npx tsx --tsconfig tsconfig.json <scratchpad>/dc14/smoke.ts` | RESULT 16/16, ROLLBACK | DB dicek di proses = `gsp_agent_hq_v21`; DATABASE_URL tidak dicetak |

## Verification
- Hitungan sebelum/sesudah (v21): sebelum `{"k":0,"m19":0,"m20":0,"blk":"013e7d62d44dc0e8e441fba2e729866c"}`; selama fixture `{"k":3,"m19":1,"m20":1,...}`; sesudah ROLLBACK `{"k":0,"m19":0,"m20":0,"blk":"013e7d62d44dc0e8e441fba2e729866c"}` (k = dokumen ber-contractKind, blk = md5 seluruh `textPlain` StudioDocBlock) -> 0 baris tersisa, teks blok identik.
- Q1 `status=blocked` -> 1 (`002/GSP/STD/X/2026`); Q2 `cardId=t_ac989baa` -> 1 dengan `matchedItems [{key:"t_ac989baa",status:"done",pid:"p-fx1"}]`; Q3 `owner=gsp-master01` -> 1; Q4 `dueAfter=2026-11-01&dueBefore=2026-11-30` -> 1 (`dueOn 2026-11-05`); tambahan: tanpa filter 3 (status null untuk dokumen tanpa record), `docNumber` tepat 1, kursor kontrak take=2 -> 2 + 1 tanpa tumpang tindih.
- Q5 `q=laporan` -> hit memuat pid + alamat, mis. `000/GSP/STD/X/2026 rev5 pid b-bc3bc6429c97b72f address 8.4.2 slot content chapter 8 type table`; total 15 hit di revisi terkini; kursor search 5 + 5 = 10 unik.
- Q7 q berisi kutip/operator tanpa galat: `"laporan kerja"` 0, `laporan' OR '1'='1` 15, `-laporan or "kerja` 20, `x'); DROP TABLE "StudioDocument"; --` 0, `!!! ::` 0 (tsquery kosong -> `hits: []`), `t_ac989baa & | ! <->` 1.
- CA-5 TERBUKTI: `to_tsvector('simple','kartu t_ac989baa selesai')` = `'ac989baa':3 'kartu':1 'selesai':4 't':2`; `websearch_to_tsquery('simple','t_ac989baa')` = `'t' <-> 'ac989baa'` (frasa) -> cocok; via layanan Q6 1 hit pada blok fixture, cuplikan `kartu [[t]]_[[ac989baa]] selesai`. Efek samping: frasa juga cocok `t ac989baa`/`t-ac989baa` (bisa positif palsu sempit; dapat diterima).

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| T2-68 `ContractSummaryV2.status` bertipe tidak-null, padahal §7.6 membuat dokumen ber-contractKind tanpa slot `record` terisi ber-`contractStatus` null | 0 (di luar kepemilikan) | celah tipe kontrak (DC-05) | Layanan mengembalikan `ContractSummaryResult` (= T2-68 dengan `status: ... \| null`); diajukan amandemen tipe | Tidak |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| Hak akses | Tidak ada `services/documents`; pola visibilitas daftar dokumen ada di R04 GET (`documents/route.ts`: `requireSession` lalu `findMany` tanpa syarat pemanggil) | Layanan tanpa saringan pemanggil, sesuai register §9 / AS-2 (semua pemanggil terautentikasi membaca semua dokumen; dinilai DC-41). Route R21/R22 wajib `requireSession` lebih dulu. Dokumen arsip ikut tercakup (sama dengan R04) |
| Validasi | Layanan memvalidasi ulang filter bertipe (`assert*Filter`) selain parser query string | Pemanggil non-route tidak bisa melewati batas register; parameter ganda juga ditolak (`duplicate`) |
| Kursor kontrak | id dokumen (Prisma cursor); id yang tidak ada -> halaman kosong, bukan galat | Dokumentasi di modul |
| Kursor search | rank dibawa `::float8` di SELECT dan perbandingan keyset agar bolak-balik JSON tepat | Terbukti 5 + 5 unik |
| `type` R22 | dicocokkan ke `StudioDocBlock.type` (set: CONTENT_BLOCK_TYPES ∪ C33 ∪ {sourceRegisterEntry, contractItem}); data v21 memang memakai jenis seksi (cover, toc, ...) sebagai `type` blok | Sesuai |
| `address` null | Kolom nullable, T2-69 string | Dipetakan ke `""` (v21: 0 blok tanpa alamat) |
| Untuk DC-15/DC-16 | Pakai `parseContractQuery(sp)` / `parseSearchQuery(sp)` + `queryContracts`/`searchBlocks(filter, { correlationId: ctx.correlationId })`; `StudioEngineError` SCHEMA_INVALID -> `failFrom` 400 | Info |
| Review | review recommended: `src/lib/studio/services/query/**` (SQL mentah bertag, keyset) | Untuk controller |

## Next Steps
- Controller: ajukan amandemen T2-68 `status: AgentWorkReportStatus | null` ke pemilik kontrak (file_requests), lalu layanan bisa kembali ke `ContractSummaryV2` langsung.
- DC-15/DC-16 memasang route di atas layanan ini.
