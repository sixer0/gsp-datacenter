# S29 coder-execution: diagram tata letak sld, rack, graph (I19)

- Status: complete (2026-10-23). Area: `src/lib/studio/engine/diagram/layout-c/**`. Klaim di `file_claims.md` (2 baris S29).
- Berkas (5): `layout-c/index.ts` (ganti stub), `geometry.ts`, `sld.ts`, `rack.ts`, `graph.ts`.
- Ekspor kontrak §8.2: `layoutSld`, `layoutRack`, `layoutGraph` : `LayoutResult`. Tambahan aditif: `layoutSldDetail` (`bus`), `layoutRackDetail` (`rackX`), `layoutGraphDetail` (`adaptive`, `rowpack`): data samping yang Python simpan di `Sheet`.
- Port: HS `datum_diagram.py` :582-854 (`layout_sld`, `layout_rack`, `_graph_min_width`, `_graph_column_pos` ROWPACK lengkap, `layout_graph`), util :189-249, `Sheet.height` :404 (foot 0; kaki ditambah S30). Pembulatan: `round` setengah-ke-genap, `snap_floor`/`snap_ceil` dengan epsilon 1e-9, `int()` Python (potong, string bulat), urutan string code point, mutasi `ests` lintas anak tangga dipertahankan.
- Cacat: `StudioEngineError("BY_CONSTRUCTION_FAILED", "DIAGRAM DEFECT: ...", { checkId })` untuk E-17, DATUM-37, DATUM-37/ROWPACK (pola sama dengan layout-b).

## Penjaga

- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/engine/diagram/layout-c"`: 0 baris (grep exit 1).
- `npx eslint src/lib/studio/engine/diagram/layout-c`: exit 0, tanpa keluaran.
- Paritas tambahan (scratchpad, VENV `-I -B`, cwd di luar skill): 423 kasus (good_sld, 3 bad_cases sld/graph, 19 rakitan, 400 graph acak seed 29), simpul [x,y,w,h], tinggi, bus, rack_x, rowpack dibandingkan via `float.hex`: `identik bit-per-bit 423 dari 423`. Sebaran: 372 lurus, 26 rowpack (20 center+gap1, 6 center+gap0), 23 tolak ROWPACK, 2 tolak E-17; pesan cacat cocok 24 karakter pertama.

## Keputusan dan temuan

1. Primitif core (S26) dan simbol (S31) tidak diimpor. Python `layout_sld/rack/graph` tidak memakai simbol maupun port (grep "simbol" hanya :347-350 validate_spec). Dari core hanya antarmuka kontrak `DiagramSheet` yang dipakai (colMm, rowMm, widthMm). Kelas `Sheet` masih stub saat S29 jalan.
2. Siaran D-42 (port RL vs kaki HS): tidak berdampak. Python sld menempatkan cabang sebagai kotak di bawah rel, tanpa posisi port, jadi tidak ada selisih yang perlu dicatat di layout. Sisi kaki/port menjadi urusan build/routing (S30) bila memakai simbol.
3. Paritas yang dipertahankan: sld hanya menempatkan rel bus PERTAMA; rel berikutnya tidak masuk `nodes` (sama dengan Python). Temuan untuk S30/S84: spek sld berisi lebih dari satu rel akan kehilangan simpul.
4. Temuan: di `_graph_column_pos` Python, jalur rapat-lebar (`shrink_target`/`room`) tidak pernah aktif dengan token default karena `snap(need) <= snap_ceil(min)`. Hasilnya `rounds` selalu 0 dan ROWPACK langsung ditolak setelah 4 anak tangga. Kode tetap diport persis.
5. Celah paritas yang diketahui (sama dengan S27/S28): JSON `1.0` vs `1` pada `str()`; urutan kunci `Record` JS untuk id berbentuk bilangan bulat berbeda dari dict Python (nilai identik). `involved` Python tidak diport karena tidak pernah dibaca.
6. Permintaan lintas pemilik: tidak ada.
