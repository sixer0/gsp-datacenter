# Catatan baris S65 (coder-execution)

**Status:** complete

**Berkas** (semua baru, area `scripts/parity/reference/fig/`): `ref_fig.py` (CLI H03), `chart_ref.py` (datumchart + pustakachart), `pc_inject.py` (peta 58 kode + penyuntik), `raster.py` (Playwright set_content), `skills.py` (pemuat HS/RL read-only).

**Angka:** PC_MAP 42 kode (pcd 38, param 2: K-01/K-02 `_stack_rows`, literal 2: P-07/W-03); DC_MAP 4 (P-01, P-02, W-02 -> bar/column, P-11 -> threshold); NO_REFERENCE 12; komposit dan DF-01..18 -> `no-reference`.

**Penjaga (VENV -I -B):**
- `py_compile` 5 berkas: OK semua. `ref_fig.py --help`: exit 0.
- Uji asap di scratch (di luar repo), semua exit 0: P-01 (datumchart, PNG 1512x326), P-03 (pcd), K-02 (param), P-07 (literal), K-05 (no-reference), diagram good_layered (PNG 1961x2756 = render_hint acuan), simbol iec:breaker (+ portsInMm). Spec tak ada: exit 2.
- SVG P-03 dua run byte-identik (sha256 sama). Tidak ada `__pycache__` baru di folder skill.

**Keputusan:**
- SVG backend matplotlib 3.11.1 MENOLAK `metadata={"Software": None}` (`ValueError: Unknown metadata key(s) passed to SVG writer: Software`). Spy `Figure.savefig` mencatat probe di laporan lalu menulis ulang dengan `metadata={"Date": None}`; `svg.hashsalt` tetap agar SVG deterministik.
- Spy membuang teks figur kosong (title="") dan footer berawalan CAPTION_LABEL (menangkap juga v13 yang tidak lewat `finish`); `fontMinPt` diukur setelah pembuangan.
- PNG chart pustakachart = Agg 300 dpi milik acuan (research/06 6.1); datumchart/diagram/simbol = Chromium set_content, skala 300/96.
- datumchart: `sub` tingkat spec diset true bila ada titik ber-`sub` (StudioChartV1 hanya punya `sub` per titik).
- Diagram: `build_svg(release=False)` tetap (CLI 11 tanpa flag release).
- Bentuk data per kode ditetapkan adapter (S09 belum ada): mis. P-09 target = params.target atau limit; K-09 grup = points[].sub; K-12 lebar = params.widths; H-07 posisi = params.positions atau BFS; P-15 params.tableRows/tableHead atau matrix; H-06 matriks diresampel ke grid 40x60.
- Batas acuan tetap dilaporkan sebagai galat berkode (mis. H-03 wajib 6x8, W-01/W-05 wajib 12 nilai, W-07 wajib 1 milestone, G-04 maks 6 langkah, P-12 maks 6 panel).

**Permintaan:** S63: fixture P-07/W-03 memakai `dataInjection.literalData` dari `ref_report.json`; bentuk data fixture mengikuti penyuntik di `pc_inject.py`. S09: selaraskan `ChartDef.dataShape` dengan peta ini.

**Temuan:** hipotesis research/06 6.3 (SVG menolak metadata) terkonfirmasi. Exit 0 juga untuk status no-reference.
