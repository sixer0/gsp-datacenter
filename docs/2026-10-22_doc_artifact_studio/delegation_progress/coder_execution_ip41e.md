# IP-41e coder-execution: panelParamsMoved -> params kunci penuh / accent / x (D-215, D-154, D-187)

- Status: complete (2026-10-23). Skill: dry-run-verify-fix (1 siklus, 0 perbaikan). Klaim: 5 baris IP-41e di `file_claims.md` (termasuk `blocks/bm-fig-17..21.block.json`: hanya spec tersemat, keluaran generator yang sama; preseden IP-02/IP-39a). `doc.json`, `doc.v2.json`, `template*.json`, preset tidak disentuh.
- Cara: generator diubah lalu regenerasi penuh; berkas repo = keluaran generator (bukan sunting tangan).
  - `tools/gallery.py`: `HINT_KEYS` (31 petunjuk tergambar -> `chart.kind.<KODE>.<nama>` apa adanya) + K-04 `groups` daftar nama apa adanya (bentuk alternatif; 32 total); `fold_accent` melipat alias `accentPoint/accentGroup/accentSeries` ke medan `accent` panel (aturan tingkat 3 `resolveAccent`, galat bila dua sumber aksen); `DUPLICATE_KEYS` P-11.thresholdStyle dibuang (dicek = `style: "gallery"` panel); G-02.accentDot/G-03.accentFlow tetap hanya di `accent`; sisa 41 catatan (termasuk S-05.periodOrder teks; params S-05.periodOrder bool tetap) -> medan `x` panel; `normalize_panel`/`build` kini mengembalikan asal transkripsi.
  - `tools/build_figures.py`: `entry["transcription"]` dari `gallery.build`; `panelParamsMoved` tidak lagi ditulis.
  - Berkas data berubah: `index.json` (kunci `panelParamsMoved` hilang di 5 entri), `specs/bm-fig-17..21.chart.json`, `blocks/bm-fig-17..21.block.json` (spec tersemat = spec berkas, dicek sama 5/5; medan blok lain sama).
- Bukti (segar):
  - Garis dasar generator lama `--out .../ip41e/base`: `diff -r` vs repo = 0 baris. Generator baru `--out .../ip41e/final` (VENV `-I -B`, BM docx/pdf RevA): counts total 52, 100 berkas, `diff -r -x tools` vs repo = 0 baris.
  - `grep panelParamsMoved` di seluruh JSON figures = 0. Hitung spec: 32 kunci petunjuk penuh, 41 catatan `x`, 0 alias aksen di params; `accent` P-03 `{point: K3, series: real}`, P-07/S-02..S-07 `{group: ...}`.
  - `npx tsx benchmark/manual000/figures/tools/validate_figures.ts`: spec 20/20, blok 52/52, params 58/58 (0 PARAM_ALIAS, 0 PARAM_IGNORED), build 11/11, sha256 52/52, `LOLOS`, exit 0.
  - SVG (`renderChart` per panel, widthMm 128, skrip scratch `svgsha.ts`): panel baru dengan 32 petunjuk dilepas (K-04 kembali int 2) = garis dasar 58/58; dengan petunjuk 0 FAIL, berubah disengaja P-05, P-06, P-11, H-05, W-08, W-10 (+ komposit 17, 18, 20) = himpunan IP-41c; K-04 daftar nama, komposit 19/21 (lipat aksen) byte-identik.
  - Contoh P-11 (`axis` [40, 62]): garis batas 55 `x1="93.2616"` (domain 40..60) -> `x1="85.6471"` (domain 40..62; (55-40)/22 x 111,679 + 9,502), tick 40..60 tetap.
  - `ast.parse` 2 berkas Python ok; `npx eslint benchmark/manual000/figures` exit 0. DB, HKCU, port tidak disentuh.
- Keputusan untuk dikukuhkan: (1) blok bm-fig-17..21 ikut berubah (spec tersemat) di luar daftar area brief; (2) P-11.thresholdStyle dibuang tanpa salinan `x` (rangkap tervalidasi = `style`); (3) `transcription` tetap di index.json, tidak di `x`.
