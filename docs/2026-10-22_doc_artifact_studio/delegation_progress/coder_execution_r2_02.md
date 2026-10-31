---
task_slug: doc_artifact_studio
row: R2-02
date: 2026-10-31
agent: coder-execution
source: decisions/decisions.md D-419; research/12_contract_efficiency_results.md §6, §9 (U-03, U-07)
status: complete
---

# Implementation Report: R2-02 registri contoh kontrak (U-03) + R03 tanpa kind (U-07)

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | U-03 `examples` pada entri C58 agentWorkReport | complete | `howTo` + `record` (studio.slot/v2 amplop buat, payload contractRecord lengkap: items, evidence `note: {text}`, refs) + `chapters["1".."5"]` (studio.chapter/v2; paragraf, list `items: [{text}]`, table `cells: [{text}]` + `source`, peran lede/note/pivot/closingAction) |
| 2 | Tipe `ContractKindExamplesV2` + medan wajib `examples` di `ContractKindDefV2` | complete | hanya tipe examples |
| 3 | U-07 R03 tanpa kind / kind tak dikenal | complete | dipilih 400 `REGISTRY_KIND_UNKNOWN` (lihat keputusan) |
| 4 | dc28 test :91 disesuaikan; uji baru r2reg | complete | |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/lib/studio/registry/contracts.ts | modify | konstanta `AGENT_WORK_REPORT_EXAMPLES`, `examples` di DEFS |
| src/lib/studio/contract/types/v2/contract.ts | modify | `ContractKindExamplesV2`, `ContractKindDefV2.examples` |
| src/app/api/studio/registry/route.ts | modify | `kindRequired()`: details `{pointer, keyword: required/enum, message, received (<=64), validKinds, examples}`; docblock |
| tests/unit/studio/api/dc28-registry-contracts.test.ts | modify | hanya uji :91 (details objek) |
| tests/unit/studio/api/r2reg-contract-examples.test.ts | add | 21 uji: skema v2 tiap contoh, dry-run R08 in-process per bab + gabungan (COMPLETE, lint PASS), kontrol negatif, R03 menyajikan examples, U-07 |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | exit 0 | |
| Lint | `npx eslint <5 berkas tersentuh>` | exit 0 | |
| Unit baru + dc28 | `npx vitest run tests/unit/studio/api/r2reg-contract-examples.test.ts tests/unit/studio/api/dc28-registry-contracts.test.ts` | 34/34 lulus | |
| Unit penuh | `npx vitest run tests/unit/studio` | 153/154 berkas, 3389 lulus, 2 gagal, 1 skip | 2 gagal = `draft/dc22-draft-check.test.ts` (CLI draft-check), tetap gagal dengan 3 berkas sumber saya dikembalikan ke HEAD -> berasal dari perubahan R2-01 yang sedang berjalan (scripts/studio/draft-check.ts, services/draft/**) |

## Verification
- Asap :9021 R03 `?kind=contracts`: 200, 11800 byte (examples 6329 byte; kunci howTo/record/chapters 1..5), cid e5b825bd-1a22-4dfd-9bcb-429921934fd9.
- Asap :9021 R03 tanpa kind: 400 REGISTRY_KIND_UNKNOWN, details.validKinds 13 kind + 3 contoh kueri, cid 5c9a601e-27e6-4bc3-b5d7-b6de1a84f006; `?kind=contract` 400 cid ec3b9da3-cde8-4d1e-ae53-7a3e0b8e1028.
- Asap :9021 R08: contoh bab 1 dari respons R03 apa adanya, hanya `target.documentId` diganti dokumen nyata 014/GSP/LAP/X/2026 -> 200 `valid: true`, `issues: []`, submitPreview changeScope chapter:1, cid 54b1f7f4-fd88-44aa-9598-299249776a5c. Lint gabungan FAIL C-26c/C-27 (DIAGNOSIS, non-penahan) bersumber prosa bab 2 dokumen yang ada (contoh 2.1.1), bukan contoh.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| dc22-draft-check 2 gagal | 0 (bukan milik R2-02) | perubahan R2-01 dalam proses | dilaporkan ke controller | tidak untuk R2-02 |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| U-07 | 400 vs 200 indeks | 400 `REGISTRY_KIND_UNKNOWN`: kontrak R03 (01_specs §6.2 R03, 03 §12 R03, 05 §9.4) hanya mengenal 200 `{kind, items}` per kind dan 400 untuk kind tak dikenal; 200 tanpa kind akan menambah bentuk respons baru. `details` kind kini objek (bukan larik isu); filter tak dikenal tetap larik isu |
| U-03 | Lint contoh awal FAIL (DATUM-10 tabel tanpa source, C-26c titik-koma, C-27 kalimat pendek) | contoh diperbaiki; uji gabungan mewajibkan lint PASS |
| U-03 | Dry-run bab nyata butuh dokumen (DB) | uji unit: skema v2 tiap badan + dry-run R08 ingest nyata (dokumen record + bab); jalur dryRunChapter dibuktikan asap :9021 |

## Next Steps
- Panduan (R2-06) dapat merujuk `items[0].examples` R03. Review recommended: route.ts + contracts.ts (bentuk details U-07 berubah untuk klien yang membaca `details[0]`).
