# S44 coder-execution: lint inti (engine/lint/scan)

Status: complete (penjaga lulus; uji formal milik S71).

Berkas (area eksklusif `src/lib/studio/engine/lint/scan/**`):
- `index.ts` (tanda tangan I34 persis: `runLint`, `scanText`, `byConstructionChecks`; ekspor tambahan `assembleLintReport`, `collapseIssues`, `releaseStatusFor`, `SCAN_*_CHECKS`, `walkDocument`)
- `runner.ts` (status PASS/FAIL/NOT_RUN/REPORT, ringkas per cek, NOT_RUN beralasan, status rilis per tier P16-01, banner; tidak melempar, tidak menahan berkas A10)
- `checks.ts` (port datum_lint.py c03/c04/c16/c17/c19/c31/c38/c39 + datumcheck check_heading/name_guard; parameter `prose.emDash` P11-41, `vat.*` P6-24/26, `naming.underscore.allowed` P3-09)
- `walk.ts` (segmen teks beralamat §4.1 + pointer JSON; alamat snapshot via blockId bila ada)

Penjaga:
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/engine/lint/scan"` -> kosong (grep exit 1)
- `npx eslint src/lib/studio/engine/lint/scan` -> exit 0, tanpa keluaran
- Smoke `npx tsx <scratchpad>/s44_smoke.ts`: 17/17 kasus port selftest Python PASS (H16-a..d, C39 T-a..e, PPN 10/11/12xDPP, ±, Mermaid, em dash 0 vs 3/1000)

Keputusan:
1. Guard G1-G3 (+G4 sub G3) memanggil I06 `tableGuards` (S17) — satu port datumcheck, tanpa duplikasi; totalMm = `table.columnWidthSumMm`, numeral = `type.scale.tableNumerals.size`.
2. `runLint` juga memanggil `lintStructure` (S46) dan `lintLanguage` (S47); galat/stub -> NOT_RUN per cek dengan alasan. Cek render (S45): tahap `post` diserahkan pemanggil (S51 `addMissing`), tahap `ingest` NOT_RUN. H01-H16 NOT_RUN "pemeriksaan manusia". Entri `notRunReason` (KT-13) dipakai apa adanya.
3. Status rilis: hanya cek yang `tiers`-nya memuat tier; FAIL bila ada FAIL dan P16-01 true; PASS bila ada cek dijalankan; selain itu NOT_RUN (NOTA = NOT_RUN, P3-08).
4. DATUM-04 = gabungan pola datum_lint c04 dan datumcheck check_heading (kata tanya di awal).
5. `byConstructionChecks` = ID scan ber-`blocksIngest` (04, 19, 31, 38, G1, G2, G3, N1); parameter = default registri + `doc.overrides`. Grup S struktur milik S46.
6. N1/DATUM-38 menguji folder misi, path aset (stem), nomor dokumen.

Temuan (D-34 aturan pengaman, untuk S48): `benchmark/manual000/doc.json` memicu blocksIngest DATUM-04 (2.4 "Siapa memiliki keputusan apa", 11.1 "Apa yang diatur dan mengapa"; aturan datumcheck) dan G3 (13.2.2, 13.3.2 sel 603/476 kar di kolom 72 mm). Non-blocking: DATUM-03 FAIL (4 em dash/27214 kata), DATUM-17 FAIL x4. Rilis TERBIT benchmark = FAIL (sesuai A10/R10).

Permintaan lintas pemilik: tidak ada (saran S51: `assembleLintReport` tersedia untuk merakit ulang laporan dengan cek render).
