# S31 coder-execution: pustaka simbol (engine/symbols, I21)

Status: complete (2026-10-23). Skills: backend-execution, dry-run-verify-fix.

## Berkas (area eksklusif `src/lib/studio/engine/symbols/**`)
- `index.ts` (ubah stub): `SYMBOL_IDS` (41), `SYMBOL_IDS_COUNT`, `symbolSvg`, `symbolSheetSvg`, `symbolPortsMm` persis §8.2; tambahan `SYMBOL_COUNTS_BY_DIALECT`, `canonicalSymbolId`.
- `primitives.ts` (baru): port `_g/_r/_c/_p/_path/_lead/_label`; palet dari default ParamDef `color.interior.*` (nol hex literal).
- `dialects.ts` (baru): geometri 41 simbol HS `datumsimbol.py:98-284` + catatan kepala lembar.
- `ports.ts` (baru): `ports_in_mm` RL `datum_symbols.py:490-551` dipetakan ke petak 24 x 24 mm.

## Angka dan bukti
- `npx tsx node.ts`: `SYMBOL_IDS.length = 41 SYMBOL_IDS_COUNT = 41 per dialect = {"iec":16,"isa":12,"sec":7,"mil":6} deterministic = true`.
- Paritas terhadap Python acuan (VENV -I -B; HS symbol_svg/sheet_svg, RL render ports): `ids identical: True`; `symbols 41 compared, sheets 21 pages compared (16 dialect/cols combos), failures 0, port failures 0`; halaman cols=3: iec/isa/sec/mil masing-masing 1. Kriteria: jenis dan jumlah elemen identik, atribut numerik +/- 0,01 mm, teks identik (bungkus catatan 56 karakter = textwrap).
- `npx tsc --noEmit -p tsconfig.json | grep src/lib/studio/engine/symbols` -> kosong (exit 1). `npx eslint src/lib/studio/engine/symbols` -> exit 0.
- Skrip paritas (dapat dipakai ulang S78): scratchpad sesi `.../scratchpad/s31/{ref.py,node.ts,cmp.py}`.

## Keputusan
| # | Keputusan | Alasan |
|---|---|---|
| 1 | Urutan `SYMBOL_IDS` = `--list` HS (dialek terurut iec, isa, mil, sec; id terurut) | sumber kanonis deterministik |
| 2 | `data-mark="node"` + `data-symbol` pada akar SVG simbol dan grup petak lembar; `data-dialect` pada akar lembar | N2; hanya atribut, jumlah elemen tetap identik |
| 3 | Angka ditulis 4 desimal tanpa nol buntut (12 bukan 12.0) | deterministik; selisih <= 5e-5 mm |
| 4 | Id/dialek/kolom tak sah -> `StudioEngineError("SCHEMA_INVALID")`; cols bulat 1..6 | tidak ada kode simbol di kontrak; Python melempar KeyError/ZeroDivision |
| 5 | Alias garis bawah Rev F dan huruf besar diterima (RL `canonical`), tidak didaftar | kompatibilitas spec lama |

## Temuan (D-19, tidak menghentikan)
- F1: port RL tidak selalu cocok dengan kaki HS. HS menggambar kaki kiri/kanan untuk iec:generator, motor, transformer, battery, lamp, sedangkan RL menyatakan port atas/bawah (V); iec:busbar HS 4..20 mm tetapi port RL di 0 dan 24 mm; isa/mil/sec tanpa kaki di tepi petak. Port mengikuti RL sesuai brief; S29/S30 (router) perlu tahu.
- F2: RL `aspect` (busbar 4.0, fence 2.2, barrier 1.6) tidak berlaku pada petak HS persegi 24 mm.

## Permintaan lintas pemilik: tidak ada.
