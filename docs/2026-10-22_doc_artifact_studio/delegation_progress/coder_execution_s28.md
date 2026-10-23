# Catatan S28: engine/diagram/layout-b (swimlane, sequence)

Status: complete. Agen: coder-execution. Tanggal: 2026-10-23.

## Berkas
- `src/lib/studio/engine/diagram/layout-b/index.ts` (ganti stub; ekspor ulang)
- `src/lib/studio/engine/diagram/layout-b/geometry.ts` (pt2mm, snap, pyRound half-to-even, est_text_mm, _node_size, kisi, Sheet.height)
- `src/lib/studio/engine/diagram/layout-b/swimlane.ts` (`layoutSwimlane`, HS :535-562)
- `src/lib/studio/engine/diagram/layout-b/sequence.ts` (`layoutSequence` HS :565-579, `routeSequenceMessages` HS :912-927)

## Penjaga
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/engine/diagram/layout-b"` -> 0 baris (grep exit 1)
- `npx eslint src/lib/studio/engine/diagram/layout-b` -> exit 0, tanpa keluaran
- Paritas (scratch, bukan suite): 4 spek (swimlane 166/128 termasuk lajur numerik 1/0, tanpa lajur, Unicode astral; sequence 166 dengan pesan-ke-diri, sequence 128 tanpa edges); HS `layout_*` via VENV -I -B vs TS via tsx -> `cases 4 IDENTICAL` (bit-per-bit float).

## Keputusan
1. Nilai yang dikembalikan = keadaan lembar Python tepat setelah mesin layout; lintasan snap/clamp `build_svg` :1124-1136 tetap milik S30.
2. Kisi: 128/12 dan 13,5x25,4/72 bila `sheet.colMm/rowMm` berselisih < 1e-3 (aturan HS :99-104). Token tetap (`GARIS_A_TOKENS`: text_column 128, baseline 13,5 pt, caption 7,6 pt, source_line 6,6 pt) karena `LayoutFn` tidak menerima templat.
3. Kembalian = subtipe `SwimlaneLayout` (lanes x=0/w=W, `laneOrder`, `nodeLane`, `gutterMm`) dan `SequenceLayout` (`lifelines`, `msgY`, `msgStep`, `msgEnd`); tetap memenuhi `LayoutFn`.
4. `heightMm` = HS `Sheet.height()` dengan foot = 0; sequence menyertakan `msg_end` (HS :1145). S30 menambah cadangan kaki apparatus.
5. Spek tidak dimutasi (Python menulis `n["_lane_i"]`).
6. Galat = `StudioEngineError("BY_CONSTRUCTION_FAILED", "DIAGRAM DEFECT: ...")` (nodes kosong, edge ke simpul tak dikenal); modul murni, tanpa sink log (log persisten di lapisan layanan).

## Permintaan lintas pemilik
- `file_requests.md`: S28 -> contract/engine.ts `LayoutResult` medan opsional (family, laneOrder, gutterMm, lifelines, msgY, msgStep, msgEnd). Tidak blocking.
- Untuk S30: pakai `routeSequenceMessages(s, layout)` dari layout-b pada family sequence; urutan lajur dari `laneOrder` (kunci numerik `Record` JS diurutkan ulang).
- Untuk S26: `Sheet.colMm` literal 10,6667 aman (direkonsiliasi ke 128/12 di sini); modul lain sebaiknya memakai aturan yang sama (12 x 10,6667 = 128,0004 memicu DATUM-37 palsu, HS :95-98).

## Temuan
- F1: HS `route_sequence_messages` membaca `spec["edges"]` (KeyError bila tidak ada); TS memperlakukan sebagai tanpa pesan.
- F2: HS memakai `BASELINE_PT` (pt) sebagai mm pada `snap(BASELINE_PT*k, LATTICE_Y)` (jarak lajur/pesan); dipertahankan demi paritas.
- F3: lajur JSON `1.0` -> Python "1.0", JS "1" (tak terbedakan setelah JSON.parse).
