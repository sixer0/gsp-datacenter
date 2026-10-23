# S26 inti diagram (engine/diagram/core), coder-execution, 2026-10-23

Status: complete

Berkas (area eksklusif `src/lib/studio/engine/diagram/core/`): `index.ts` (tanda tangan I16 + ekstra), `pyfmt.ts` (paritas angka Python: round/repr/%f/repr dict), `tokens.ts` (salinan beku HS tokens.json + katalog 9 keluarga, 10 bentuk, 6 konektor, pola garis, LIMITS, util kisi), `defect.ts` (`DiagramDefect extends StudioEngineError`), `spec.ts` (loadSpec, mirrorSource, validateSpec, assertValidSpec), `sheet.ts` (Sheet, nodeSize, footReserveMm, nodeStrokeToken, snapToLattice DATUM-37), `svg.ts` (svgText, 10 bentuk, nodeSvg, jalur/kepala/hop konektor, defs, knockout, line/paper), `estimate.ts` (estimate, warna DATUM-25, renderHint). 1675 baris.

Penjaga:
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/engine/diagram/core"` -> kosong (grep exit 1)
- `npx eslint src/lib/studio/engine/diagram/core` -> exit 0, tanpa keluaran
- Dry-run paritas (scratch, bukan uji): angka 20014 nilai acak vs VENV (`round(x,2/3)`, `repr`, `%.2f`, `round(x)`) -> 0 selisih. good_layered/good_sld: estimate 166.0 x 233.3625 n5 / 128.0 x 109.5375 n4 identik dengan Python; colour_values dan checks_run (tanpa DATUM-32, DATUM-29/30) identik; root, defs (arsiran + 6 kepala), kertas, semua elemen simpul (bentuk, label, sub, glif, tag), jalur konektor, baris KEY tereproduksi byte-identik dan berurutan (30/37, 33/38 baris; sisanya komentar, label tepi, `</svg>`). Knockout label dari x/y yang sudah dibulatkan selisih 0,01 mm (artefak harness; lebar/tinggi identik). bad_cases 17: 12 cacat tingkat spek menghasilkan pesan identik Python (termasuk repr dict); 5 sisanya (E-17, DATUM-25/32/33/37) butuh layout/build.

Keputusan (dicatat controller):
1. Token diagram = salinan beku HS tokens.json (Garis A tanpa templat; paritas DG), bukan ParamMap S11.
2. `validateSpec(s, {release?})` mengembalikan PASS per cek + FAIL per pelanggaran (pointer JSON), id cek sama dengan `ran` Python; `assertValidSpec` = perilaku Python (lempar pada FAIL pertama, kembalikan `ran`).
3. Mermaid dicocokkan tanpa membedakan huruf. Python me-lowercase teks tetapi penandanya berhuruf besar sehingga hanya "```mermaid" yang pernah cocok (temuan, `datum_diagram.py:259-261`).
4. `estimate(s, layout?)`: layout disuntikkan (`DIAGRAM_LAYOUTS[family]`) karena core tidak boleh mengimpor D01 dan Python estimate = build_svg penuh; tanpa layout -> DiagramDefect. DATUM-32 dan DATUM-29/30 tidak dijalankan di estimate (jujur di `checksRun`). Ekstra keluaran: colourValues, nNodes, nEdges, apparatus, family, checksRun.
5. `Sheet(widthMm, heightMm?)`: tinggi default = `height()` Python; `colMm` = 128/12 terhitung (bukan literal 10,6667 stub), sesuai Python. Simpul di `Map` (urutan sisip Python). Kontrak layout S27-S29: `placeNode` + atribut `lanes/lifelines/bus/msgY/msgStep/gutterW/rackX/rowpack`, kembalikan `sheet.toLayoutResult()`.
6. `data-mark="node"` (bentuk simpul) dan `data-mark="link"` + `data-series=<jenis>` (+ `data-index` opsional) ditambahkan SETELAH atribut Python; `dataMarks:false` = keluaran Python murni. Atribut di-escape termasuk `"` (Python tidak; hanya beda bila id berkutip).
7. `PyInt`/`pyInt(0)` untuk koordinat bertipe int di Python (mis. `x="0"` pada baris KEY/caption).

Permintaan lintas pemilik: tidak ada. Untuk S27-S30: impor helper dari `engine/diagram/core` (nodeSize, snap*, Sheet, nodeSvg, edgePathSvg, hopSvg, edgeLabelSvg, diagramDefs, generatorComment, APPARATUS_REQUIRED_COMMENT, diagramColourValues, tokenFloorChecks, sequenceMessageYs).
Temuan: Python `route_sequence_messages` memakai `spec["edges"]` (KeyError bila sequence tanpa edges); di sini `edges ?? []`.
