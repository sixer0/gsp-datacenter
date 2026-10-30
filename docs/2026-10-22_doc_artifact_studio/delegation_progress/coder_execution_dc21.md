---
task_slug: doc_artifact_studio
row: DC-21
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/07_document_contract_blueprint.md (DC-21); register masterplan/05_document_contract_specs.md §11.1-§11.4, §17.2
status: complete
---

# Implementation Report: DC-21 ekstraktor draf/checkpoint MD (I63)

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca register §11, §17.2, I63, C54-C57, E55/E56, T2-70..T2-72; marker 06; gaya `services/import/lexer.ts` | complete | Semua nama kontrak sudah ada di `contract/**`; tidak ada definisi lokal `TODO(contract)` |
| 2 | Pemindai pagar KD-44 + kepala C55/C56 + parse blok | complete | `extract.ts` |
| 3 | Penentu posisi galat JSON independen dari pesan mesin JS (DR-03 line/column) | complete | `json-locate.ts`, iteratif O(n) |
| 4 | Uji DX-1..DX-8 + contoh §11.1 + batas + CRLF/BOM | complete | 21 uji |
| 5 | Dry-run gate tsc/eslint/vitest | complete | lihat di bawah |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/lib/studio/services/draft/index.ts | add | Re-ekspor publik |
| src/lib/studio/services/draft/extract.ts | add | `extractDraft` (I63), `checkDraftLimits` (DR-09/DR-10), `parseDraftBasis` (C56), `toDraftCheckResult` (T2-70 lokal tanpa R08) |
| src/lib/studio/services/draft/json-locate.ts | add | `jsonErrorOffset` |
| tests/unit/studio/draft/dc21-extract-draft.test.ts | add | DX-1..DX-8, contoh §11.1, batas, nomor baris |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Unit | `npx vitest run tests/unit/studio/draft` | 1 file, 21/21 passed | |
| Typecheck | `npx tsc --noEmit -p .` | exit 0, 0 baris keluaran | repo penuh (termasuk berkas agen paralel saat dijalankan) |
| Lint | `npx eslint src/lib/studio/services/draft` (juga uji) | exit 0 | |

## Verification
- DX-1 NO_JSON_BLOCK valid false; DX-2 JSON_MALFORMED line 9 column 20; DX-3 dua blok (6-8, 11-16) valid true; DX-4 SCHEMA_UNKNOWN schema `studio.contract/v1`; DX-5 FENCE_UNCLOSED line 6; DX-6 BLOCK_NOT_OBJECT line 7 col 3; DX-7 HEADER_INCOMPLETE warning valid true; DX-8 tepat 1 blok (line 17-19) dengan pagar text/empat-backtick/berindentasi diabaikan; contoh §11.1 blok line 6 endLine 9 tanpa isu. Semua dalam keluaran vitest di atas.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| none | | | | |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 2 | I63 tidak memuat batas | DR-09/DR-10 lewat `checkDraftLimits(markdown, { bodyBytes? })` yang dipanggil DC-22/DC-23 sebelum I63; `maxChars` dibandingkan dengan `markdown.length` (kode UTF-16, sama dengan importer md/v1) |
| 2 | Pagar json tanpa penutup | Isu DR-02 di baris pembuka; blok tidak dimasukkan ke `blocks` dan tidak memicu DR-01 |
| 2 | `text` blok | Persis seperti tertulis (akhir baris asli dipertahankan) untuk `--emit` byte-identik DC-22; parse/posisi memakai versi LF |
| 2 | `schema` | String `$schema` yang terdeteksi walau bukan anggota C57 (DX-4 terlihat); blok tetap tidak valid |
| 2 | DR-06 | Satu isu agregat (pesan menyebut judul/kunci yang hilang); nilai kunci kosong dianggap tidak ada; kemunculan pertama menang |
| 2 | Lokasi isu blok | DR-03 posisi tepat token galat; DR-04 karakter pertama isi; DR-05 baris pagar pembuka |
| 2 | DR-08 | Tidak di I63 (butuh DB); `parseDraftBasis` disediakan untuk DC-23/DC-22 `--remote` |

## Next Steps
- DC-22/DC-23 memakai `extractDraft` + `checkDraftLimits` + `toDraftCheckResult` lalu menimpa `valid`/`issues` per blok dengan hasil R08. Review recommended (lingkup: services/draft/**).
