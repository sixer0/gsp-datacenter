---
task_id: DC-10
task_slug: doc_artifact_studio
row: DC-10
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/07_document_contract_blueprint.md
status: complete
---

# Laporan DC-10: compose contractRecord -> unit interior F:record

## Ringkasan
Compose kini memetakan payload `contractRecord` ke unit `slot` `F:<slotKey>` berisi blok `contractRecord` (tabel fakta + butir + bukti + rujukan, label C58) plus blok `contractItem` per butir di `F:<slotKey>/<n>` (§5.7). Syarat D-371 terbukti: kerangka eksplisit dengan slot `record` pada tier NOTA diterima oleh `validateSkeleton`, `validateStructure`, `slotLayout`, dan `composeV2`, karena aktivasi slot dibaca dari `slot.tiers` templat, bukan dari `activeTiers` registri. Tidak perlu pengecualian.

## Berkas disentuh
| Berkas | Jenis | Isi |
|---|---|---|
| src/lib/studio/services/compose/contract-record.ts | add | `projectContractRecord`, `resolveContractKind`, `reportedAtDisplay`, tipe `ContractRecordBlock`/`ContractItemBlock` |
| src/lib/studio/services/compose/snapshot.ts | modify | `case "contractRecord"` (dulu jatuh ke `default` BY_CONSTRUCTION_FAILED); `pushBlock` menerima `textPlain` opsional (bawaan tetap `plainText`) |
| src/lib/studio/services/compose/types.ts | modify | `ComposeInput.contractKind?` |
| src/lib/studio/services/compose/context.ts | modify | `ComposeContextRecord.contractKind?`, ditulis hanya bila diberikan |
| src/lib/studio/services/compose/register.ts | modify | recomposer meneruskan `contractKind` tersimpan |
| src/lib/studio/services/compose/index.ts | modify | ekspor modul baru |
| tests/unit/studio/compose/dc10-contract-record.test.ts | add | 15 uji |
`blocks.ts` tidak disentuh.

## Verifikasi (dijalankan 2026-10-30)
| Cek | Perintah | Hasil |
|---|---|---|
| tsc | `npx tsc --noEmit -p tsconfig.json` | 0 baris keluaran (0 galat se-repo) |
| eslint | `npx eslint src/lib/studio/services/compose tests/unit/studio/compose` | exit 0 |
| uji DC-10 | `npx vitest run tests/unit/studio/compose` | 15/15 lulus |
| suite studio | `npx vitest run tests/unit/studio` | 112 berkas: 111 lulus; 2775 lulus, 1 skip, 2 gagal = `docx-sections.test.ts` (dikenal D-371) |

Yang dibuktikan uji: contoh §5.8 (slot + bab) menjadi `studio.norm/v2` dengan unit `F:record` lalu `1`; blok `F:record`/`F:record/1`/`F:record/2`; label fakta dan kepala kolom sama dengan `getContractKindDef('agentWorkReport').labels`; status ditampilkan "Selesai"/"Siap"; `reportedAt` "2026-10-30 12:30 UTC"; textPlain = I57/I58; `validateRows` bersih; sha snapshot dan struktur sama untuk compose ulang dan penggabungan terpisah; payload sumber tanpa label; E1 DATUM tanpa blok kontrak dan tanpa `contractKind` di konteks (snapshot uji compose lama tetap hijau).

## Keputusan
| Keputusan | Alasan |
|---|---|
| Jenis kontrak = `input.contractKind`, selain itu entri C58 dengan `templateSlug` = slug templat; tidak ketemu = 422 BY_CONSTRUCTION_FAILED `checkId CONTRACT_KIND` | ComposeInput belum membawa MX08; lebih baik gagal tertutup daripada label salah |
| Nilai agen ditulis sebagai run harfiah (id/path/perintah dalam mono); judul butir dan catatan bukti (InlineV2) dipetakan apa adanya | path ber-`_` tidak boleh diurai md-lite |
| Kolom yang kosong di semua baris dibuang, urutan kolom registri tetap; kolom pertama selalu dipertahankan | 8 kolom bukti yang kebanyakan kosong tidak terbaca di A4 |
| Tabel tanpa caption (`registerTable`) | bukan artefak bernomor, jadi tidak memicu aturan sumber tabel |
| Perakit (DC-12/13) merender blok `contractRecord`; blok `contractItem` adalah proyeksi alamat/pid; `itemPids[n-1]` = jangkar baris n | butir tetap beralamat untuk `matchedItems` dan `#pid` tanpa menggandakan render |

## Permintaan (needs-review, bukan milik DC-10)
1. `services/structure/rows.ts` (DC-09): `rowsFromSource` hanya membuat baris `F:record` dengan `textPlain = plainText(payload mentah)`. Belum ada baris `F:record/<n>` `contractItem`, dan pid butir belum diwarisi per `key` (KD-34). Akibatnya pid butir kini `slot-record-<n>` berbasis indeks. Compose otomatis memakai pid baris bila baris itu ada (`rowPidOf`). textPlain M17 untuk FTS sebaiknya memakai I57/I58.
2. Pemanggil compose (`services/ingest/v2.ts`, `revisions/v2/commit.ts`, `submit/pipeline.ts`) sebaiknya meneruskan `contractKind` templat (MX08) ke `composeV2`.
3. Modul baru mengimpor `services/contracts/text.ts` dan `dates.ts` (DC-07, belum di-commit). Bila tanda tangan I57/I58 berubah, uji dc10 akan menangkapnya.

## Next steps
- DC-12/DC-13 merender `ContractRecordBlock`; permintaan 1-2 di atas.
