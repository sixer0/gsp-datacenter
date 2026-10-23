# IP-45 coder-execution: sinkron generator figur benchmark dengan IP-42c (D-154)

- Status: complete (2026-10-23). Skill: dry-run-verify-fix (1 siklus, 0 perbaikan). Klaim: 3 baris IP-45 di `file_claims.md`. `specs/**`, `blocks/**`, `index.json` tidak disentuh.
- Garis dasar (generator lama, `--out .../ip45/base`): `diff -rq` vs repo = 4 berkas beda (spec + blok bm-fig-25, bm-fig-38); 96 berkas lain sudah identik (perubahan IP-02 sudah ada di generator).
- Berkas diubah:
  - `benchmark/manual000/figures/tools/diagrams.py`: `g93` semua slot u = 1 (rentang U tetap di tag) + notes IP-42c; `g1012` -Q2 label "-Q2 ke UPS -U1", sub "rel hilir -Q3 -Q4 -Q5", tanpa tag + notes IP-42c; konstanta baru `BLOCK_SIZE = {"9.3": (128.0, 123.825), "10.12": (128.0, 100.013)}` (lebar spec, tinggi build engine; harus diukur ulang bila spec berubah).
  - `benchmark/manual000/figures/tools/build_figures.py`: cabang diagram menimpa `widthMm`/`heightMm` blok dari `diagrams.BLOCK_SIZE` (urutan kunci tetap); `index.json` tetap ukuran penempatan BM.
- Bukti: `VENV -I -B build_figures.py --docx BM.docx --pdf BM.pdf --out C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/ip45/new` -> counts `{"chart": 5, "device": 28, "diagram": 6, "raster": 9, "symbolSheet": 4, "total": 52}`; `diff -rq` vs repo (kecuali tools) exit 0; `diff -r | wc -l` = 0; 100 berkas dihasilkan = 100 berkas repo (index.json, 27 aset, 20 spec, 52 blok).
- Generator lain: `gallery.py`/`px.py` (chart) dan seluruh spec/blok IP-02 ikut regenerasi penuh di atas -> byte-identik (tidak membalik IP-02/IP-42c). `validate_figures.ts` hanya membaca (tidak ada writeFile); tidak ada skrip lain yang memanggil generator (grep `build_figures|diagrams.py` = hanya berkas itu sendiri).
- `npx tsx benchmark/manual000/figures/tools/validate_figures.ts` atas berkas asli: spec 20/20, blok 52/52, build 11/11, sha256 52/52, params 50/58; exit 1 HANYA karena 8 PARAM_ALIAS bm-fig-17/21 yang sudah diketahui (IP-41e).
- Penjaga: compile 2 berkas Python ok; `npx eslint benchmark/manual000/figures` exit 0; pyflakes tidak terpasang di VENV (tidak dijalankan). DB, HKCU, port tidak disentuh; skill DATUM dan BM hanya dibaca.
