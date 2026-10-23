# Catatan baris INT-L (coder-execution) - butir IP-29

**Status:** complete. Review direkomendasikan (lingkup: `scripts/parity/reference/fig/ref_patches.py` + kabel di `chart_ref.py`).

**Berkas** (area `scripts/parity/reference/fig/`): baru `ref_patches.py`; ubah `chart_ref.py` (import + `with ref_patches.stack_rows_legacy_sum(...)` mengelilingi panggilan `_stack_rows`, docstring), `ref_fig.py` (kunci `patches: []` di laporan, docstring). Skill HS tidak disentuh.

**Tambalan PT-01** (`pustakachart._stack_rows`, pustakachart.py:421 `np.sum(np.array(r) for r in parts)`):
- numpy VENV 2.4.3 melempar TypeError untuk `np.sum(generator)`. numpy < 2 (fromnumeric.sum `_gentype -> _sum_`) memakai builtin `sum`; tambalan meniru jalur itu persis.
- Mekanisme: global `np` modul pustakachart diganti proksi (`_LegacyGenSumNumpy`) yang meneruskan semua atribut ke numpy kecuali `sum(<generator>)` tanpa argumen lain -> `builtins.sum`. Aktif hanya selama satu panggilan `_stack_rows` dengan total100=False (K-01), dipulihkan di `finally`. K-02 (total100=True) tidak memasang apa pun (cabang `else 100`).
- Penjaga hulu: bila ekspresi rusak tak lagi ada di sumber skill, tambalan tidak dipasang dan dicatat `applied: false`.
- Dicatat di `ref_report.json` -> `patches[]` (id, target, expression, site file:baris dinamis, problem, replacement, scope, `skillFileModified: false`, `applied`, `hits`). Kode lain: `patches: []`.

**Penjaga (VENV -I -B, cwd `%TEMP%\intl`, keluaran dihapus):**
- `py_compile` ref_patches/chart_ref/ref_fig: OK. `ref_fig.py --help`: exit 0. `__pycache__` yang terbentuk oleh py_compile di folder fig dihapus.
- Sebelum tambalan: K-01 exit 1 `REFERENCE_RENDER_FAILED` (TypeError np.sum(generator)).
- Sesudah: K-01 (`tests/parity/fixtures/chart/k01.json`, --png) exit 0, status ok, `warnings: []`, stderr 0 byte; `patches[0].applied=true, hits=1`, site pustakachart.py:421. Dua run byte-identik (svg + png).
- Kebocoran: K-02, P-01, H-03 dirender sebelum dan sesudah tambalan -> ref.svg dan ref.png byte-identik (cmp) untuk ketiganya; isi `ref_report.json` sama kecuali kunci baru `patches: []` (dan durationMs/path keluaran).
- Dengan `-W default`: hanya ResourceWarning lama (open() tanpa close di ref_fig/chart_ref/pustakachart), sama untuk semua kode; tidak ada peringatan dari tambalan.

**Temuan:**
- F1 (semantik acuan): jalur lama `max(sum(rows))` = maksimum JUMLAH PER SERI lintas kategori, bukan total baris maksimum. Fixture K-01: xlim acuan = 805 (kolom Perangkat), total baris maks = 480 -> sumbu x acuan ~68% lebih panjang dari batang terpanjang. Tambalan sengaja setia ke perilaku lama; komparator paritas CB1 K-01 harus tahu bahwa xlim acuan bukan "nilai benar" (kemungkinan bug laten acuan HS). Baris berpanjang tak sama tetap gagal (ValueError broadcast) seperti di numpy lama.
- F2: catatan `manifest.json` chart-K-01 ("acuan GAGAL ... tidak dapat dijalankan") kini usang; pemilik manifest (S63) perlu memperbaruinya.
- F3: ResourceWarning open() tanpa close di adapter (ref_fig.py:62, chart_ref.py:36/246) tidak diperbaiki (di luar lingkup; tidak mengubah keluaran).

**Permintaan lintas pemilik:** S63/manifest: perbarui `notes` chart-K-01 (F2), tidak blocking.
