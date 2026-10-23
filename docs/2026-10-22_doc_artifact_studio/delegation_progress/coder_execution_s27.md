# S27 — diagram layout-a (coder-execution)

- Status: complete
- Skills: backend-execution, dry-run-verify-fix (loaded by brief; pure geometry module, no I/O or catch paths, so persistent logging N/A)
- Berkas (src/lib/studio/engine/diagram/layout-a/): `index.ts` (ganti stub; ekspor `layoutLayered`, `layoutFlow` sesuai I17), `geometry.ts` (pyRound setengah-ke-genap, pyFloorDiv CPython, pyInt, pyTruthy, pyStr, pt2mm, snap, estTextMm code point, latticeOf, nodeSize, sheetHeight), `layered.ts` (port `layout_layered` :452-479), `flow.ts` (port `layout_flow` :482-532, termasuk `per_row`).
- Paritas: urutan operasi float dipertahankan (mis. layered `(y+hmax)+langkah` vs flow `y+(hmax+langkah)`); kisi dipilih seperti Python (128/12 dan 13,5*25,4/72 bila selisih < 1e-3 dari `sheet.colMm/rowMm`).
- Bukti paritas: 301 spek (good_layered.json + 300 acak seed 27: layered 55, stack 59, topology 65, flow 48, flow+per_row 74; lebar 128/166; sub/tag/diamond/unicode/per_row 0, 2.7, 20) dijalankan Python `VENV -I -B` dan TS `npx tsx`: 8885 nilai (x,y,w,h, tinggi) dibandingkan `Object.is` -> mismatches 0.
- Penjaga: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/engine/diagram/layout-a"` -> kosong (grep exit 1); `npx eslint src/lib/studio/engine/diagram/layout-a` -> exit 0 tanpa keluaran.

## Keputusan

| # | Keputusan | Alasan |
|---|---|---|
| 1 | `heightMm` = `Sheet.height()` dengan `foot = 0`, atas kotak pra-snap | `build_svg` menambah cadangan kaki dan snap akhir setelah layout; itu milik S30 |
| 2 | Token (caption 7,6 pt, source_line 6,6 pt, baseline 13,5 pt, text_column 128) ditulis sebagai konstanta berprovenans | Belum ada cermin tokens.json di TS untuk peran ini |
| 3 | Variabel mati Python `w = snap(W*0.42)` (flow tanpa per_row) tidak diport | Tidak dipakai; tanpa efek koordinat |
| 4 | `Sheet.top` dan kisi dihitung lokal dari `DiagramSheet.colMm/rowMm` | Antarmuka kontrak tidak memuat `top` |

## Temuan (untuk register)

- F-S27-1: `LayoutResult.nodes` bertipe `Record`; id simpul berbentuk bilangan bulat ("1","2") diurutkan JS lebih dulu, berbeda dari urutan sisip dict Python. Koordinat tidak terpengaruh; S30 sebaiknya beriterasi menurut `s.nodes`, bukan `Object.keys(nodes)`.
- F-S27-2: celah paritas `str(tier)`: Python membedakan tier `1` dan `1.0` (dua tingkat), JS menggabungkannya.
- F-S27-3: stub S26 `Sheet.colMm = 10.6667`; layout-a tetap memakai 128/12 persis (seleksi Python), jadi aman bila S26 mempertahankan nilai itu.
- Permintaan lintas pemilik: tidak ada.
