# IP-42a coder-execution: lembar simbol isi-pas `fit` (D-137 opsi B)

Status: complete (2026-10-23). Skills: backend-execution, dry-run-verify-fix.

## Berkas (area `src/lib/studio/engine/symbols/**`)
- `sheet-fit.ts` (baru): `symbolSheetFitSvg(d, cols)`, `RL_SHEET_COLS` (= 6). Port RL `datum_symbols.py sheet()` :593-626: kepala `ID · JUDUL` huruf besar 2,7 mm tebal 600 spasi 0,24; petak 24 mm + jarak 4 mm, langkah baris 33; label id Plex Mono 2,1 ink400 (+3,2) dan nama Indonesia Plex Sans Condensed 2,2 ink900 (+6,2) dari registri RL :494-547; amplifier eselon "||" pada mil:friend (:476-483). Urutan = registri RL (sama dengan urutan HS).
- `index.ts` (ubah aditif): `export interface SymbolSheetOptions { fit?: boolean }`; tanda tangan seam IP-42b `symbolSheetSvg(d, cols?, opts?)`. `fit` tidak diisi/false = jalur HS lama tak tersentuh (cols bawaan 3); `fit: true` = satu SVG isi-pas, cols bawaan 6, validasi cols 1..6 tetap.

## Keputusan
| # | Keputusan | Alasan |
|---|---|---|
| 1 | Pita per dialek: viewBox 178 mm (bantalan 6 mm kiri/kanan dan di atas garis dasar kepala), dipotong 6 mm di atas kepala dialek berikutnya; mil (terakhir di RL) sampai ujung lembar; tampil selebar 166 mm | RL menggambar 4 dialek dalam satu lembar; BM = pita per dialek. Diukur dari aset BM: 1500 px = 178 mm (pitch 236 px = 28 mm), garis dasar kepala 50,5 px = 6 mm, tinggi 910/632/405 px = 108/75/48 mm |
| 2 | Geometri simbol tetap HS, ditempatkan di petak RL (pusat x + 12 sama) | paritas SY; port geometri RL bukan lingkup baris |
| 3 | Warna dari token interior (ink900/ink400/paper = literal RL #101418/#6B7783/#FCFCFB) | aturan nol hex literal modul |
| 4 | Id label kanonis bertanda hubung (mil:friend-air) | E-11; aset BM mil masih memakai alias Rev F |

## Bukti penjaga (D-133)
- `npx tsc --noEmit -p tsconfig.json`: exit 0, 0 galat di seluruh repo (area kosong).
- `npx eslint src/lib/studio/engine/symbols`: exit 0.
- Asap `fit:true` (1 lembar per dialek, < 247 mm): iec 166 x 100,7191 (BM 100,707; +0,012), isa 166 x 69,9438 (BM 69,941; +0,003), sec 166 x 69,9438 (BM 69,941; +0,003), mil 166 x 44,764 (BM 44,82; -0,056); data-mark node 16/12/7/6; cols 6 = bawaan; deterministik; cols 7 -> SCHEMA_INVALID.
- Tanpa `fit`: 29 hash sha256 (4 dialek x bawaan + cols 1..6, plus 41 simbol) sebelum = sesudah (`diff` kosong); `{fit:false}` = tanpa opsi.
- Raster visual (playwright-core, scratch): tata letak kepala/petak/label/eselon sesuai aset BM simbol1/simbol5.

## Permintaan lintas pemilik
- IP-42b (`services/render/figures.ts`): tipe lokal `SymbolSheetFn` dan cast boleh dihapus; impor `SymbolSheetOptions` dari `engine/symbols` (tanda tangan sama persis).

## Temuan (D-19)
- F1: label id 2,1 mm pada skala tampil 166/178 = 1,958 mm (5,55 pt), tepat di atas lantai DATUM-28 5,5 pt.
- F2: gambar simbol RL berbeda dari HS (mis. iec:breaker, iec:ct, mil:unknown); selisih visual BM4 pada lembar simbol tetap ada dari geometri, bukan tinggi.
