---
task_slug: doc_artifact_studio
row: DC-22
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/masterplan/05_document_contract_specs.md §11.1-§11.4 (DC-22); laporan DC-21
status: complete
---

# Implementation Report: DC-22 CLI `scripts/studio/draft-check.ts`

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca register §11, §5.6, §9.3 (R23), C54-C57, DR-01..DR-10, T2-70/71; laporan DC-21; route R08 + `v2-kit`; gaya `md2chapter.ts`/`glossary-check.ts` | complete | |
| 2 | CLI: batas C54 -> I63 -> skema v2 (`validateV2` R08) + 6b; `--remote` R08 + DR-08 (R05); `--emit`; `--json` | complete | |
| 3 | Uji vitest DC-22 (fungsi + fetch tiruan + proses nyata tsx) | complete | 16 uji |
| 4 | Dry-run gate + asap lokal/remote | complete | lihat di bawah |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| scripts/studio/draft-check.ts | add | CLI DC-22; ekspor `checkDraftLocal`, `checkDraftRemote`, `contractStructureIssues`, `formatHuman`, `parseArgs`, `main` |
| tests/unit/studio/draft/dc22-draft-check.test.ts | add | 16 uji |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Unit | `npx vitest run tests/unit/studio/draft` | 2 files, 37/37 passed | 21 DC-21 + 16 DC-22 |
| Typecheck | `npx tsc --noEmit -p .` | 1 galat, bukan milik DC-22: `tests/unit/studio/figures/dc27-chart-custom.test.ts(190,42) TS2322` (DC-27) | berkas DC-22 bersih |
| Lint | `npx eslint scripts/studio/draft-check.ts tests/unit/studio/draft/dc22-draft-check.test.ts` | exit 0 | |

## Verification
- Draf contoh §11.1 lokal: `blok 1 (baris 6-9) studio.slot/v2: valid`, exit 0.
- Draf rusak: `[galat] baris 9 kolom 41 DRAFT_JSON_MALFORMED`, exit 1.
- `--emit 1` pada draf CRLF: `cmp` stdout terhadap byte isi blok cocok ("emit byte-identik", 202 bita, CRLF dipertahankan).
- `--remote http://127.0.0.1:9021` (rahasia lewat substitusi shell, tidak dicetak): draf bab v2 ke `cmvuiisx200abv11g8zv2x1ue` basis @rev9 -> `LOLOS`, exit 0, `submitPreview.revisionNo` 10. Contoh §11.1 remote -> DR-08 `basis rev3 ... rev10` (peringatan baris 4) + isu R08 `SLOT_UNKNOWN` apa adanya, exit 1 (templat KT tidak punya slot `record`). Rahasia salah -> 401 exit 2; tanpa env -> exit 2; port mati -> exit 2. `grep` nilai rahasia di keluaran tersimpan: 0.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| tsc galat di `dc27-chart-custom.test.ts` | 0 (bukan milik) | berkas DC-27 | dicatat | tidak untuk DC-22 |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 2 | I54 `checkContractRecord` (DC-07) belum ada | 6b lokal = `contractStructureIssues` (hanya `items[].key` unik; status sudah enum skema), keyword `CONTRACT_ITEM_KEY_DUPLICATE`, `details.positions` indeks 0-based; `TODO(DC-07)` ganti ke I54 |
| 2 | Blok mana yang di-dry-run / divalidasi | Hanya blok tanpa isu galat ekstraksi (DR-03/04/05); blok DR-05 tidak dikirim ke R08. DC-23 perlu menyamakan agar `--json` = R23 (KS-8) |
| 2 | Isi isu blok | Lokal: isu `validateV2` (ajv bersama + `classifySchemaV2Errors`), bila kosong lalu 6b. Remote: `valid`/`issues`/`submitPreview`/`completenessPreview` R08 apa adanya; `lint` dibuang (tidak ada di T2-71); badan R08 = teks blok persis |
| 2 | DR-08 | GET R05 `document.currentRevisionNo`; 404 = tidak dicek; isu berisi `line`/`column` baris `basis:`; ditambahkan setelah isu ekstraksi |
| 2 | Galat HTTP R08 | 401/429/5xx/jaringan = exit 2; 4xx lain (403/400/413) = isu blok `{pointer:"", keyword:code}` |
| 2 | Batas C54 | `bodyBytes` = ukuran berkas; exit 1; `--json` mencetak `{ error, code: "PAYLOAD_TOO_LARGE", details: { reason } }` (bentuk badan galat studio) |
| 2 | `--emit` | Tidak boleh digabung `--json`/`--remote` (exit 2); teks tetap dicetak, exit 1 + catatan stderr bila blok tidak valid lokal; blok tak ada = exit 2 |
| 2 | Logging persisten | Tidak berlaku (CLI lokal tanpa server, pola `md2chapter`): galat ke stderr + kode keluar |
| 4 | Direktori asap | Scratchpad sesi terlalu panjang untuk cwd Win32; berkas asap di `C:/Users/TRIAL/AppData/Local/Temp/dc22` |

## Next Steps
- DC-23 menyamakan aturan blok yang di-dry-run, posisi isu DR-08, dan urutan isu agar AC-19 (`--remote` = R23 untuk 3 draf) dapat diasap. Review recommended (lingkup: scripts/studio/draft-check.ts).
