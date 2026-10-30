---
task_id: DC-12+DC-13
task_slug: doc_artifact_studio
row: DC-12, DC-13
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/07_document_contract_blueprint.md
status: complete
---

# Laporan DC-12+DC-13: perender contractRecord HTML + DOCX

## Ringkasan
Blok `contractRecord` (DC-10) kini dirender di kedua mesin lewat perender keluarga tabel DATUM yang sudah ada (`tableHtml` / `renderTableXml`): fakta, butir, bukti, rujukan, urutan tetap, dipisah paragraf spacer peran `spacer.generic` (DOCX wajib: dua `w:tbl` bersebelahan digabung Word). Semua label dan kepala kolom dibaca dari blok (C58 via compose), tidak ada label di perender. Blok `contractItem` = proyeksi: tanpa markup; baris ke-n tabel butir HTML membawa `data-address F:record/<n>`, `id`/`data-pid` = `itemPids[n-1]`. CSS struktural tidak diubah (gaya inline), jadi dokumen lain tidak berubah.

## Deklarasi + berkas disentuh
| Berkas | Jenis | Isi |
|---|---|---|
| src/lib/studio/engine/html/blocks/contract-record.ts | add | `renderContractRecord`, validasi isi (BY_CONSTRUCTION_FAILED + log error), jangkar butir |
| src/lib/studio/engine/html/blocks/index.ts | modify | daftar `contractRecord` di `htmlBlocks` + ekspor |
| src/lib/studio/engine/html/assemble/slots.ts | modify | `contractItem: () => ""`, `PROJECTION_BLOCK_TYPES` |
| src/lib/studio/engine/html/assemble/index.ts | modify | keluaran kosong blok proyeksi tidak dibungkus `data-address` |
| src/lib/studio/engine/docx/blocks/contract-record.ts | add | `renderContractRecord` (tabel DATUM + spacer, facesUsed gabungan) |
| src/lib/studio/engine/docx/blocks/index.ts | modify | daftar `contractRecord` di `docxBlocks` (masuk `DOCX_RENDERERS`) |
| src/lib/studio/engine/docx/assemble/index.ts | modify | `SLOT_BLOCK_RENDERERS.contractItem` = `{xml:""}` |
| tests/unit/studio/renderers/dc12-contract-fixture.ts | add | snapshot norm/v2 §5.8 lewat compose (dipakai dc12, dc13, docx-sections) |
| tests/unit/studio/renderers/dc12-contract-record-html.test.ts | add | 13 uji |
| tests/unit/studio/renderers/dc13-contract-record-docx.test.ts | add | 11 uji |
| tests/unit/studio/renderers/docx-sections.test.ts | modify | fixture kontrak §5.8 (cakupan 30 jenis, REQUIRED contractRecord, cek grid tabel) |
`units.ts`, `classes.ts` (html/blocks) tidak perlu disentuh.

## Verifikasi (2026-10-30)
| Cek | Perintah | Hasil |
|---|---|---|
| tsc | `npx tsc --noEmit -p tsconfig.json` | exit 0 (repo penuh) |
| eslint | `npx eslint src/lib/studio/engine/html src/lib/studio/engine/docx/assemble src/lib/studio/engine/docx/blocks` + 4 berkas uji | exit 0 |
| asap HTML §5.8 | dc12 (templat kanonik + GSP DATUM) | 0 log error; `enforceStandalone` 0 pelanggaran; cardId `t_249c6b84`, kunci butir, rujukan bukti ada; F:record/1,/2 tepat sekali |
| asap DOCX §5.8 | dc13 | terbangun, semua bagian XML well-formed, 2 seksi, 4 `w:tbl` tak bersebelahan, `tblHeader`/`cantSplit`, sha dua render sama; paritas sel HTML = DOCX (`toEqual`) |
| Manual 000 | `npx tsx scripts/parity/run/render_cli.ts` doc.json+template.json dan doc.v2.json+template.v2.json, `--formats docx,html`, sebelum vs sesudah | v1 DOCX 38b489b9...ab52c = sama; v1 HTML 8866533e...2276 = sama; v2 DOCX 5cbdc81e...eb74 = sama; v2 HTML abdbc9a2...d515 = sama |
| determinisme lama | `docx-determinism.test.ts` (dalam suite) | lulus |
| suite studio | `npx vitest run tests/unit/studio` | 119/119 berkas, 2874 lulus, 1 skip, 0 gagal (docx-sections :62,:68 tertutup) |

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| tidak ada | - | - | - | - |

## Issues & Decisions
| Langkah | Keputusan | Alasan |
|---|---|---|
| Penempatan perender | `contractRecord` di `engine/{html,docx}/blocks` (masuk dispatch), `contractItem` di perakit | uji :62 menuntut `DOCX_RENDERERS.contractRecord`; pola sama dengan `sourceRegisterEntry` |
| DOCX blocks -> tables | impor langsung `../tables/render` (`renderTableXml`) | dispatch dilarang diimpor mesin; impor melingkar hanya dipakai saat panggil (suite hijau) |
| Tanpa judul per bagian | tabel berurutan tanpa subjudul | blok tidak membawa label bagian; tidak boleh hardcode |

## Permintaan (bukan milik DC-12/13)
1. compose (DC-10, opsional): bila subjudul bagian (mis. "Butir", "Bukti", "Rujukan") diinginkan, tambahkan label bagian ke C58 `labels` dan ke `ContractRecordBlock`; perender tinggal membacanya.
2. pid butir masih berbasis indeks (`slot-record-<n>`) sampai DC-09 menulis baris `F:record/<n>` (KD-34); perender sudah memakai `itemPids` apa adanya.

## Next steps
- Review recommended: lingkup = 7 berkas engine di atas (paritas HTML/DOCX, jalur proyeksi `contractItem`).
