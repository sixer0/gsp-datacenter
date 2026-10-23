---
task_slug: doc_artifact_studio
row: SR-48
date: 2026-10-23
agent: test-expert
skill: tdd
status: complete
source_plan: identification/05_structural_sections_blueprint.md:789
---

# SR-48: jalankan ulang S79 paritas chart (KT-02) setelah IP-39a/IP-41

## Ringkasan

- **52/58 kode LULUS KT-02** (garis dasar D-122: 19/58; **+33**, 0 regresi LULUS -> GAGAL).
- Beracuan 40/46 (S79: 8/46), lint tanpa acuan 12/12 (S79: 11/12).
- 6 GAGAL tersisa:
  - 4 kode CA (P-01, P-02, P-11, W-02) gagal di PNG H9. Ini akibat satuan fon acuan N1 (pembanding/acuan), bukan mesin.
  - H-06 gagal `f.labels` (MESIN). Label kontur ujung -42 dan -84 dibuang oleh `contour.ts:307`.
  - S-03 gagal `c.axisCount`. Ini selisih aparatus sumbu: acuan PC `set_xticks([])` lawan Node menampilkan skala x. Status: perlu keputusan, bukan isi yang hilang.
- Runner meneruskan `chartSpec` untuk 46/46 fixture chart (`cmp/svg.context.json`). Pembanding memakai gerbang D-240/D-246 (`labelNamesRequireRef` = true), dengan selftest 28/28.

## 1. Strategi uji

| Butir | Isi |
|---|---|
| Cakupan | 58 kode chart KT-02 (D-22): 46 fixture beracuan (CA 4, CB1 34, CB2 8) diuji struktural lewat acuan Python + pembanding. 12 kode tanpa acuan (P-14, H-08, H-09, K-05, K-06, K-11, S-07, S-08, W-09, W-10, G-02, G-03) diuji lint KT-02 (c) dalam 2 gaya (datum/galeri) = 24 fixture. |
| Masukan | `tests/parity/fixtures/chart/*.json` (korpus S63) dan `tests/parity/out/s79/lint_fixtures/chart/*.json` (24 spec turunan S79). Keduanya dipakai baca-saja, tanpa perubahan. |
| Alat | `scripts/parity/run/run_parity.ts`, acuan `scripts/parity/reference/fig/ref_fig.py`, pembanding `scripts/parity/compare/compare.py` (CB1 (f) = D-240/D-246). Interpreter acuan: venv hermes `-I -B`. |
| Lebar | Fixture 128/166 mm (A4). Lebar turunan D-245/D-257 tidak mengubah SVG A4: 60/69 SVG Node byte-identik dengan garis dasar, dan selisih 9 berasal dari perbaikan IP-41a (bagian 3.3). |
| Axis templat | D-268/D-287: fixture paritas tidak memakai templat preset, sehingga `chart.kind.<CODE>.axis` = null (perilaku v1). |
| Pengecualian | Tidak ada kode produksi yang diubah. Tidak ada ambang pembanding yang diubah. Uji determinisme ulang tidak dijalankan (S79 sudah membuktikan subset `*03` identik byte; di luar kriteria SR-48). |
| Chromium | Satu instans per proses (`keepBrowser`), run dijalankan berurutan, plafon 3 tidak dilampaui. |

## 2. Berkas yang dihasilkan

| Berkas | Isi |
|---|---|
| `tests/parity/out/sr48/main/` | 46 fixture beracuan: `summary.{json,md}`, `harness_log.jsonl`, dan per kode `chart_<kode>/{ref,node,cmp}/`, `fixture_report.*` |
| `tests/parity/out/sr48/lint/` | 24 fixture lint |
| `tests/parity/out/sr48/run_main_stdout.txt`, `run_lint_stdout.txt` | stdout + `time` + exit |
| `tests/parity/out/sr48/node_svg_sha256.txt` | sha256 70 SVG Node (46 + 24) untuk garis dasar berikutnya |

## 3. Inventaris vonis per kode terhadap KT-02

### 3.1 Beracuan (46): 40 LULUS / 6 GAGAL

| Kode | Kelas | SVG | PNG | KT-02 SR-48 | S79 (D-122) | Sebab / gerbang gagal |
|---|---|---|---|---|---|---|
| P-01 | CA | PASS | FAIL (SSIM 0,9723 < 0,995; diff 0,976% > 0,5%) | **GAGAL** | GAGAL | H9/N1 |
| P-02 | CA | PASS | FAIL (0,9760; 0,890%) | **GAGAL** | GAGAL | H9/N1 |
| P-11 | CA | PASS | FAIL (0,9732; 1,004%) | **GAGAL** | GAGAL | H9/N1 |
| W-02 | CA | PASS | FAIL (0,9701; 1,129%) | **GAGAL** | GAGAL | H9/N1 |
| H-06 | CB1 | FAIL | DIAG | **GAGAL** | GAGAL | `f.labels` missingValues ["-42","-84"] (sisa E6, mesin) |
| S-03 | CB1 | FAIL | DIAG | **GAGAL** | GAGAL | `c.axisCount` acuan 0 / Node 1; `c.axisOrientation` [] / ["x"] |
| H-01, H-04, H-05, H-07 | CB1 | PASS | DIAG | LULUS | GAGAL | FAIL -> PASS |
| K-01, K-02, K-03, K-04, K-07, K-09, K-10, K-12 | CB1 | PASS | DIAG | LULUS | GAGAL | FAIL -> PASS (K-07: fon 6,5 pt + peran warna, IP-41a D-157) |
| P-03, P-04, P-06, P-07, P-08, P-10, P-12, P-13, P-15 | CB1 | PASS | DIAG | LULUS | GAGAL | FAIL -> PASS (P-10: fon + warna, D-157) |
| S-02, S-04, S-05, S-06 | CB1 | PASS | DIAG | LULUS | GAGAL | FAIL -> PASS |
| W-01, W-03, W-04, W-05, W-06, W-07 | CB1 | PASS | DIAG | LULUS | GAGAL | FAIL -> PASS (W-07: label tugas di `data-axis="y"`, D-157) |
| H-02 | CB1 | PASS | DIAG | LULUS | LULUS | tetap |
| K-08 | CB2 | PASS | DIAG | LULUS | GAGAL (NODE_ERROR E5) | FAIL -> PASS |
| G-01, G-04, H-03, P-05, P-09, S-01, W-08 | CB2 | PASS | DIAG | LULUS | LULUS | tetap |

PNG kelas CB = DIAGNOSIS (N4, research/06 §6.4), tidak menggerbang.

Bukti: `run_main_stdout.txt` berakhir dengan `run_parity: {"DIAGNOSIS":40,"FAIL":6} exit=1`. `summary.json` formatsByVerdict = `{PASS: 44, DIAGNOSIS: 42, FAIL: 6}`.

### 3.2 Tanpa acuan (12 kode x 2 gaya): 12/12 LULUS

| Kode | Datum / galeri | KT-02 SR-48 | S79 |
|---|---|---|---|
| G-02, G-03, H-09, K-05, K-06, K-11, P-14, S-07, S-08, W-09, W-10 | PASS / PASS | LULUS | LULUS |
| H-08 | PASS / PASS | **LULUS** | GAGAL (DATUM-32 positif palsu L1/H10) |

Bukti: `run_lint_stdout.txt` berakhir dengan `run_parity: {"PASS":24} exit=0`. SVG H-08 identik byte dengan garis dasar. Perubahan vonisnya berasal dari parser busur lint dan vonis lint (IP-41, D-157), bukan dari mesin chart.

### 3.3 Selisih terhadap garis dasar D-122

| | S79 (D-122) | SR-48 | Selisih |
|---|---|---|---|
| LULUS total | 19/58 | **52/58** | +33 |
| Beracuan | 8/46 | 40/46 | +32 |
| Lint | 11/12 | 12/12 | +1 (H-08) |
| LULUS -> GAGAL | - | 0 | - |

SVG Node: 60/69 byte-identik dengan `s79/baseline_node_svg_sha256.txt`. Sembilan yang berubah: G-04, H-06, H-07, K-07, K-09, K-12, P-10, W-05, W-07, ditambah K-08 yang baru merender.

Catatan: sapuan D-246 (40/45) memakai SVG Node garis dasar pra-IP-39. Dengan SVG segar, K-07, P-10, dan W-07 kini lulus, dan K-08 merender (sebelumnya NODE_ERROR). Akibatnya hanya H-06 dan S-03 dari 5 sisa D-246 yang tetap GAGAL.

## 4. Pemetaan GAGAL ke pemilik

| Kode | Gerbang | Bukti | Jenis | Pemilik usulan |
|---|---|---|---|---|
| H-06 | (f) nilai data | Node menggambar 8 isoline `data-level` -84..-42 (MaxNLocator D-157 benar), tetapi hanya memberi label 6 (-78..-48). Acuan `clabel` memberi label 8 (`ref.svg` `text_16..23` dalam `axes_1` setelah `QuadContourSet_2`). Sebab: `inlineLabel` tidak memasang label bila polyline terpanjang < 3 x lebar label (`src/lib/studio/engine/chart/family-h2/contour.ts:307`) dan tidak menerbitkan REPORT. Tingkat -42 dan -84 hanya berupa busur pendek di sudut. | **MESIN** | Baris perbaikan mesin chart family-h2 (lanjutan IP-41/E6). Opsi: label tetap dipasang (mis. di ujung atau dengan gap lebih kecil), atau REPORT dengan keputusan controller bahwa label yang dibuang = diagnosis. |
| S-03 | (c) jumlah/orientasi sumbu | Acuan PC `v53_density` memanggil `ax.set_xticks([]); ax.set_yticks([])` lalu memberi judul sumbu (`datum-house-style/pustakachart.py:865-867`, dibaca saja). Aturan H6 pembanding membuang sumbu tanpa tick, sehingga acuan = 0 sumbu. Node menggambar sumbu x bertick 0..50 + "ms" (y "kerapatan" juga tanpa tick sehingga ikut dibuang). Tidak ada isi data yang hilang: `f.labels` lulus, dan tick serta "ms" = diagnosis D-240. | **PEMBANDING / keputusan** (selisih aparatus, bukan isi) | Controller memutus salah satu: (i) sumbu skala tambahan Node = diagnosis, konsisten D-139/D-240 (aparatus milik mesin), lalu ubah aturan (c) di `scripts/parity/compare/**`; atau (ii) mesin family-s1 density mengikuti PC tanpa tick (opsi parameter templat). D-246/D-248 mencatat S-03 sebagai "sumbu" tanpa menetapkan sisi. |
| P-01, P-02, P-11, W-02 | PNG CA SSIM >= 0,995 / diff <= 0,5% | SVG lulus semua gerbang (fon refSet = nodeSet [6,2..6,8]). Acuan datumchart menulis `font-size="6.2"` dalam satuan px (`refUnit` "pt nominal (N1)", F-007), sedangkan Node menulis 2,18722 mm (= 6,2 pt fisik). Akibatnya raster teks Node 4/3 lebih besar dan SSIM ~0,97 (identik dengan S79: 0,9723 / 0,9786 / 0,9732 / 0,9727). | **PEMBANDING / ACUAN** (N1) | Controller memutus R5 (`test/05_parity_chart.md` §8; terbuka sejak D-122): PNG CA = diagnosis selama N1, atau acuan dirasterisasi dengan fon x4/3. Bukan mesin. |

## 5. Cara menjalankan (perintah + keluaran direkam)

Akar repo `C:\Users\TRIAL\gsp-swarm-hq-v2.1`.

```
npx tsx scripts/parity/run/run_parity.ts --fixtures tests/parity/fixtures --out tests/parity/out/sr48/main --only "chart/**" --formats svg,png
-> run_parity: 46 fixture (dari 110; 3 berkas dilewati) ... {"DIAGNOSIS":40,"FAIL":6} exit=1   real 4m1.687s

npx tsx scripts/parity/run/run_parity.ts --fixtures tests/parity/out/s79/lint_fixtures --out tests/parity/out/sr48/lint --formats svg
-> run_parity: 24 fixture (dari 24; 0 berkas dilewati) ... {"PASS":24} exit=0   real 0m12.632s

python -I -B scripts/parity/compare/selftest_compare.py
-> selftest_compare: 28/28 lulus

python -I <scratchpad>/hashdiff.py   (sha256 SVG Node sr48 lawan s79/baseline_node_svg_sha256.txt)
-> baseline 69 sr48 70 same 60 diff 9 notInBaseline ['main/chart_k08']
   changed: g04 h06 h07 k07 k09 k12 p10 w05 w07
```

Cek tambahan:
- Konteks `chartSpec`: `ls sr48/main/chart_*/cmp/svg.context.json | wc -l` = 46, dan `grep -l chartSpec` = 46.
- Berkas yang dilewati (3) bukan chart, contohnya `diagram/garis_a/good_layered.json` (F-S78-2).

## 6. Catatan CI

- Durasi: main sekitar 4 menit (lebih lama dari S79 2 m 12 s karena host berbagi Chromium dengan baris B7 lain), lint sekitar 13 detik.
- Exit 1 adalah vonis jujur. Tidak ada `REF_ERROR`, `COMPARE_ERROR`, maupun `NODE_ERROR`.
- Tidak ada flaky yang teramati. `tests/parity/out/` di-gitignore (S69).

## 7. Masalah diketahui dan keterbatasan

1. Fixture lint memakai spec turunan S79 (transkripsi panel, F-S02-01), bukan korpus S63. Keterbatasan ini sama dengan S79.
2. Cek per-kode CB2 (research/06 §6.2) masih belum diimplementasikan. CB2 hanya menggerbang (d) dan (e) (`test/05_parity_chart.md` §7.3).
3. Klasifikasi S-03 sebagai pembanding bersifat tafsir. Bukti mendukung bahwa isi tidak hilang, tetapi aturan (c) KT-02 secara harfiah menggerbang sumbu. Putusan tetap milik controller.

## 8. Rekomendasi

| # | Untuk | Rekomendasi |
|---|---|---|
| R1 | Pemilik mesin chart family-h2 | H-06: label untuk setiap tingkat yang tergambar, atau REPORT eksplisit bila dibuang (`contour.ts:307`). Uji regresi: `chart/h06` (f) dengan nilai -42 dan -84. |
| R2 | Controller | Putuskan S-03 (i) atau (ii) di bagian 4, lalu tugaskan ke `scripts/parity/compare/**` atau family-s1. |
| R3 | Controller | Putuskan R5/H9 untuk PNG CA (4 kode). Tanpa putusan, 4 kode ini akan tetap GAGAL secara konstruksi. |
| R4 | SR-58 | Pakai `tests/parity/out/sr48/node_svg_sha256.txt` sebagai garis dasar SVG Node pasca-IP-41. |
