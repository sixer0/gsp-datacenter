---
task_id: DC-24
task_slug: doc_artifact_studio
row: DC-24
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/masterplan/05_document_contract_specs.md (§15 I64, §16, §13.2, KD-42, BA-24)
status: complete
---

# Implementation Report: DC-24 generator MD lama -> kontrak (`md2contract/v1`)

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca blueprint DC-24, register §16/§13.2/§15, registri C58, importer md/v1, validator v2, 3 laporan nyata | done | baca saja |
| 2 | Generator murni `services/import/contract/` (I64 `markdownToContract`) | done | F1 + F2 |
| 3 | Uji `dc24-md2contract.test.ts` (19) termasuk asap 3 laporan nyata (`skipIf` bila berkas tak ada) | done | asap berjalan, tidak dilewati |
| 4 | tsc, eslint area, vitest import | done | lihat Test Results |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/lib/studio/services/import/contract/types.ts | add | Opsi I64, laporan (`generator`, `warnings` CW, `mapping`), `ContractImportError` (exitCode 2/3) |
| src/lib/studio/services/import/contract/parse.ts | add | Pemindai murni: pagar kode, frontmatter, `norm_h` DC-01, regex KV DC-01, tabel GFM, tanggal C37, segmen bukti GL-03 |
| src/lib/studio/services/import/contract/index.ts | add | `markdownToContract`, `validateContractDoc` (validator v2 `validateV2Against`), alias dari registri C58 |
| tests/unit/studio/import/dc24-md2contract.test.ts | add | 19 uji |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| typecheck | `npx tsc --noEmit -p tsconfig.json` | exit 0 (repo penuh) | |
| lint | `npx eslint src/lib/studio/services/import tests/unit/studio/import` | exit 0 | |
| unit | `npx vitest run tests/unit/studio/import` | 7 berkas, 114/114 lulus | dc24 19/19 |

## Verification (asap 3 laporan nyata DC-03; opsi fallback `status: complete`, `reportedAt: 2026-10-30` hanya untuk nilai yang absen)
| Laporan | Tanpa fallback (KD-42) | Bab terpetakan (GA) | Peringatan | Status record | Validasi v2 |
|---|---|---|---|---|---|
| prompt-manual `LAPORAN-SELESAI.md` | exit 3, hilang `reportedAt` | 3 (Artefak + Gerbang) | CW-03 x4 | `complete` dari kepala `STATUS:` | valid, 0 isu |
| game-success-formula `01_verifier_report.md` | exit 3, hilang `status`, `reportedAt` (tidak ada kunci status) | 1 (pembuka) | CW-04 x3, CW-03 x7 | dari opsi (bukan tebakan); verdict `FAIL` dari `VERDICT:` | valid, 0 isu |
| tracero-dispatcher `laporan.md` | exit 3, hilang `reportedAt` | 1 (pembuka), 4 (Batas klaim) | CW-03 x6 | `complete` dari kepala `STATUS:` | valid, 0 isu |

Determinisme: dua jalan `JSON.stringify` identik (uji sintetis + 3 nyata); CRLF/BOM = LF. 0 status ditebak: `mapping.record` status hanya bersumber `header` atau `option`.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| none | - | - | - | - |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 2 | I64 mengembalikan `doc`, tetapi KD-42 mensyaratkan exit 3 tanpa status | Lempar `ContractImportError` `MD2CONTRACT_REQUIRED_MISSING` (exitCode 3, `missing`, `report` berisi CW) ; pemakaian salah = `MD2CONTRACT_USAGE` exitCode 2. Hasil sukses menambah `validation` (aditif, pola md/v1) |
| 2 | Nilai kepala `FAIL (keterangan...)` | Hanya token pertama dicocokkan ke alias (keterangan penulis diabaikan); tanpa alias = CW-02, tidak ditebak |
| 2 | Lingkup kunci kepala | KV di 40 baris pertama; di pembuka (sebelum `##` pertama) kunci tanpa alias = CW-04 dan baris tetap teks bab 1; di dalam ruas `##` hanya kunci ber-alias dibaca (teks tetap di ruas), sehingga baris prosa `Format:` dsb. tidak menjadi CW-04 |
| 2 | Jam tanpa zona (`2026-10-03 14:05`, judul entri F2 tanpa `WIB`) | Hanya tanggal dipakai + catatan `REPORTED_AT_TIME_DROPPED`; zona tidak ditebak |
| 2 | Bab CO wajib tanpa isi sumber | Tidak dikarang ("Tidak ada" dsb.); dicatat `mapping.missingChapters` (kelengkapan DC-11 yang menilai) |
| 2 | Nomor tampilan awal judul `##` (`2.`, `A.`) | Dibuang dari judul section/bab (D-139); importer md/v1 tidak membuangnya untuk `##` |
| 2 | `checkContractRecord` I54 (DC-07) belum ada | Keunikan `items[].key` dijamin saat konstruksi (baris ganda = catatan `ITEM_KEY_DUPLICATE`) |

## Next Steps
- DC-25 CLI memetakan `ContractImportError.exitCode` (2/3) dan `report.warnings` (exit 1 bila `--strict`).
- review recommended: `src/lib/studio/services/import/contract/**` (aturan lingkup kepala dan token pertama di atas).
