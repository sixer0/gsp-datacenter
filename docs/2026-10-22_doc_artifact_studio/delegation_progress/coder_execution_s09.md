# S09 registri chart (coder-execution)

Status: complete (penjaga lulus). Berkas: `src/lib/studio/registry/charts.ts` (satu-satunya yang ditulis, di luar catatan ini).

## Angka (tsx runtime check, scratchpad s09_check.ts)
- CHART_REGISTRY 76 = 58 drawn + 18 drawn=false; urutan kode sama dengan CHART_CODES enum.
- CHART_PARAMS 87 (P 26, H 9, K 16, W 16, S 14, G 6); id dan key unik 87; paramKeys 87, tidak ada rujukan menggantung.
- pyRef: datumchart 4 (CA), pustakachart 42 (CB1 34 + CB2 8), none 12 (CC) = persis research/06 §5.1. DF-09 (v36_dendro) dan DF-12 (v47_spline) membawa pyRef pustakachart; 16 lainnya none.
- 18 DF: semua alternatives tidak kosong + renderErrorCode CHART_KIND_NOT_DRAWN.
- Kelas parameter: B 84, K 3 (P-11 limitLine.labelled, P-11 overLimitColour, W-04 zeroBaseline).

## Penjaga
- tsc penuh (`-p tsconfig.json`) berhenti di galat sintaks area lain (`engine/soffice/readiness.ts` 125-127, TS1161, milik S92); karena galat sintaks menekan diagnostik semantik, tsc diulang dengan tsconfig sementara (extends, include hanya charts.ts + registry/index.ts, sudah dihapus): exit 0.
- `npx eslint src/lib/studio/registry/charts.ts`: exit 0.

## Keputusan
- `pyRef.ref` memuat nama fungsi/keluarga polos (`v04_grouped_column`, `bar`); baris PC/DC ada di `dataOrigin` bila perlu.
- Enum nilai non-default (mis. sort valueAsc/natural, valueLabel inside, nodeSize uniform) adalah tambahan S09, bukan dari katalog (hipotesis); default dan batas dari katalog.
- `ramp` H-03 bertipe pair ["white","signal"] (KT-08). K-11 dan G-04 purpose aliranProses; DF-16..18 group G.
- Ekspor tambahan: `CHART_BY_CODE`, `CHART_DATA_CONSTRAINTS` (30 batas bentuk data adapter acuan).

## Permintaan S65 (dataShape vs pc_inject.py)
dataShape sudah cocok dengan pembaca adapter untuk semua 42 kode pustakachart (P-09 categorical, K-09 categorical dengan sub=grup, K-12 series + params.widths, H-07 graph + params.positions, P-15 matrix atau params.tableRows/tableHead, H-06 matrix diresampel, W-07 intervals, G-04 steps). Batas H-03 6x8, W-07 satu milestone, W-01/W-05 12 titik, W-06 4 periode, P-12 maks 6 seri tertulis di CHART_DATA_CONSTRAINTS. Tidak ada perubahan kontrak diperlukan.

## Temuan
- ChartDef tidak punya kolom catatan batas data; ditaruh di CHART_DATA_CONSTRAINTS (ekspor tambahan, tanpa ubah kontrak).
- Galat sintaks `engine/soffice/readiness.ts:125` menggagalkan tsc penuh seluruh repo (area S92; kemungkinan berkas sedang ditulis).
