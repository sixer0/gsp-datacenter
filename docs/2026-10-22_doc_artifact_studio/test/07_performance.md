---
type: test-report
task_id: doc_artifact_studio_sr54
row: SR-54 (S81 kinerja lewat CLI)
date: 2026-10-23
agent: test-expert
skills: tdd
status: complete (vonis: ambang 15 s bab draf GAGAL TIPIS pada wall CLI bab 8, LULUS pada waktu job render; gerbang LULUS)
---

# 07 Kinerja render lewat CLI (SR-54 / S81)

## Ringkasan

| Kasus | Masukan | Hlm | Raster | Wall CLI p50 / p95 (ms) | Job render `durationMs` p50 / p95 (ms) | Ambang | Vonis |
|---|---|---|---|---|---|---|---|
| C1b dokumen ±30 hlm | M000 v2 bab 1-5 + lampiran, figur mesin | 32 | 2 | 12 573 / 12 910 | 11 355 / 11 794 | tidak ada | informatif |
| C1 dokumen ±40 hlm | M000 v2 bab 1-7 + lampiran | 41 | 2 | 13 522 / 13 708 | 12 218 / 12 470 | tidak ada | informatif |
| C2 Manual 000 v2 penuh | DOCX+HTML+PDF, 15 figur mesin | 102 | 15 | 31 154 / 32 285 | 29 997 / 31 004 | tidak ada | informatif |
| **C3a bab draf** | `--scope chapter:8` (5 chart komposit) | 13 | 5 | **15 462 / 15 919** | **14 332 / 14 557** | 15 s | **wall FAIL (+3 % / +6 %); job PASS (sisa 0,44 s)** |
| C3b bab draf | `--scope chapter:10` (4 lembar simbol + 1 diagram) | 11 | 5 | 13 551 / 14 555 | 12 389 / 13 350 | 15 s | PASS |
| C4a chart tunggal | fixture `chart/p01.json` SVG+PNG | - | 1 | 3 303 / 3 404 | 2 132 / 2 210 | tidak ada | informatif |
| C4b chart komposit | `bm-fig-17.chart.json` SVG+PNG | - | 1 | 3 670 / 3 895 | 2 485 / 2 524 | tidak ada | informatif |
| C5a diagram | `bm-fig-23.diagram.json` SVG+PNG | - | 1 | 3 465 / 3 560 | 2 229 / 2 282 | tidak ada | informatif |
| C5b diagram | `bm-fig-38.diagram.json` SVG+PNG | - | 1 | 3 279 / 3 441 | 2 128 / 2 187 | tidak ada | informatif |
| C6 gerbang by-construction kiriman bab | merge bab 8 → compose → `evaluateByConstruction` (393 blok) | - | - | gerbang 27,4 / 34,5 (hangat); 67,4 dingin | merge+compose+gerbang 130,9 / 157,2 | ≈ 70 ms (D-278) | PASS |

Semua 50 run terukur exit 0 dengan status `SUCCEEDED` (`results.json` `summary.exits`/`statuses`). DOCX, HTML, SVG, dan PNG ber-sha256 identik di 5/5 ulangan per kasus (`sha256Stable`), jadi D-265 tetap deterministik di bawah beban ini. Sha PDF berbeda antar-run karena stempel waktu PDF soffice; ini bukan gerbang SR-54 (paritas PDF memakai tanda isi, SR-50).

## 1. Strategi uji

- **Lingkup.** Enam kasus brief SR-54. Kasus 1 tersedia dalam dua ukuran (32 dan 41 halaman), dan kasus 3 dua bab (13 dan 11 halaman).
- **Alat.** CLI resmi `scripts/parity/run/render_cli.ts` (SR-33) dipanggil sebagai proses terpisah lewat `node node_modules/tsx/dist/cli.mjs`. Kasus 6 diukur in-process pada jalur murni yang setara `submit/pipeline.ts:821-948`.
- **Ulangan.** Per kasus 1 pemanasan (dibuang) + 5 ulangan terukur, dijalankan berurutan tanpa paralel. Persentil memakai interpolasi linear R-7 atas 5 sampel, sehingga p95 ≈ maksimum.
- **Metrik.**
  - Wall = spawn sampai exit proses CLI. Angka ini memuat start Node/tsx ±1,1 s dan peluncuran Chromium ±1,05 s per proses.
  - `durationMs` = `render_report.json`, dari muat masukan sampai tulis berkas.
  - Rincian tahap diambil dari stempel waktu `engineLog` (dedup entri ganda cli+pure): compose = mulai sampai `PURE_RENDER_STARTED`; figur = `RENDER_ENV_READY` sampai `ASSETS_PRELOADED`; DOCX = sampai `DOCX_ASSEMBLED`; PDF = sampai `PDF_CONVERTED` (plus `context.durationMs` soffice); HTML; measureLayout+lint = sampai `LINT_DONE`.
  - Raster per figur dari `rasterizeSvg done` `context.durationMs`.
- **Masukan turunan** (tanpa mengubah masukan asli). `tools/make_inputs.ts` memanggil `loadInputs` runner benchmark resmi (figures `engine`), sehingga 15 figur mesin tersubstitusi persis seperti run resmi SR-51: `substituted=15 ids=bm-fig-06,…,bm-fig-38`. Subset bab memakai kerangka templat yang sama.
- **Pengecualian.**
  - Jalur layanan HTTP/DB tidak diukur: server :9021 tidak dibebani dan DB tidak disentuh.
  - Tidak ada uji vitest baru, karena area ini docs-only. Harness diasap lebih dulu dengan `--reps 1 --only C5a,C4b` (exit 0).
- **Versi.** Node v24.18.0, Chromium 151.0.7922.34, soffice 24.2.3.2 (`render_report.json` `renderEnv`).

## 2. Kondisi host (dicatat sebelum run)

| Ukuran | Nilai | Sumber |
|---|---|---|
| CPU | AMD Ryzen 7 7700, 8 inti / 16 logis | `Win32_Processor` |
| RAM | 127,1 GB total, 67,7 GB bebas | `Win32_OperatingSystem` |
| Beban CPU awal | 44-49 % (5 sampel 1 s); `LoadPercentage` 51 | `Get-Counter` |
| Beban selama run | 22-79 % per kasus (`cpuBefore`/`cpuAfter`); awal 54, akhir 71 | `results.json` |
| Penyebab beban | ±5 inti logis terpakai terus oleh proses di luar baris ini: 3 proses yatim `find.exe /` (PID 27504, 28124, 16208; mulai 06:27, 08:12, 08:22 dari sesi agen sebelumnya) dan 2 `python -` (PID 30856, 26596) | delta CPU 3 s per proses |

**Host TIDAK tenang** (bertentangan dengan anggapan brief). Proses-proses itu bukan milik SR-54 dan tidak dihentikan. Angka di laporan ini karenanya cenderung pesimistis: render berutas tunggal masih mendapat inti bebas, tetapi boost clock dan bandwidth memori terbagi.

## 3. Rincian tahap (p50 / p95, ms)

| Kasus | compose+muat | figur (raster) | DOCX | PDF (soffice) | HTML | measureLayout+lint |
|---|---|---|---|---|---|---|
| C1b 32 hlm | 386 / 419 | 2 835 / 2 946 | 290 / 315 | 6 066 / 6 302 (6 050) | 168 / 200 | 1 158 / 1 299 |
| C1 41 hlm | 402 / 412 | 2 944 / 3 015 | 344 / 415 | 6 478 / 6 537 (6 459) | 211 / 247 | 1 397 / 1 530 |
| C2 102 hlm | 466 / 584 | 15 145 / 15 600 | 589 / 708 | 9 823 / 10 505 (9 805) | 789 / 804 | 2 661 / 2 698 |
| C3a bab 8 | 475 / 505 | 6 389 / 6 542 | 108 / 111 | 5 628 / 5 915 (5 613) | 106 / 112 | 1 045 / 1 089 |
| C3b bab 10 | 436 / 535 | 5 455 / 5 578 | 86 / 96 | 4 989 / 5 368 (4 975) | 86 / 97 | 911 / 953 |

Figur mandiri (C4/C5): `durationMs` 2,1-2,5 s, terdiri atas peluncuran Chromium 1 051-1 116 ms (p50) dan raster 1 925-2 193 ms. Raster pertama memuat peluncuran halaman awal, sehingga sisanya ±0,9-1,1 s.

Kasus 6 (`gate_results.json`, dokumen tergabung 29 unit / 393 blok, lingkup `chapter:8`):

| Ukuran | p50 / p95 (ms) |
|---|---|
| merge | 17,9 / 22,2 |
| compose | 81,1 / 103,6 |
| gerbang `complete:true` | 27,4 / 34,5 |
| gerbang INCOMPLETE | 23,8 / 28,1 |
| gerbang tak tepercaya (penanda dikupas) | 34,9 / 38,2 |
| ingest dryRun R04 penuh | 203,9 / 210,4 |

Pemanasan dingin: gerbang 67,4 ms dan ingest 434 ms. Angka dingin ini cocok dengan "64-76 ms" D-278, yang diukur 3 kali termasuk panggilan pertama. Penahan: 0 dalam mode laporan, 2 bila tak tepercaya (sama dengan D-278).

## 4. Dampak D-265 (rasterisasi deterministik)

Lantai per raster = jeda 500 ms + 1 interval 150 ms = 650 ms (`engine/browser/index.ts:54-56`). Raster berjalan berurutan (`engine/docx/figures/store.ts:68-90`).

| Kasus | Raster | Σ raster p50 (ms) | Porsi dari `durationMs` | Lantai D-265 (n × 650 ms) | Per raster p50 / p95, tanpa raster pertama (ms) |
|---|---|---|---|---|---|
| C2 | 15 | 14 873 | 50 % | 9 750 | 919 / 1 037 |
| C3a | 5 | 6 189 | 43 % | 3 250 | 1 005 / 1 071 |
| C3b | 5 | 5 393 | 44 % | 3 250 | 871 / 911 |
| C1b | 2 | 2 787 | 25 % | 1 300 | 839 |

Raster pertama tiap proses ±1,9-2,3 s karena memuat peluncuran Chromium ±1,05 s. Lantai D-265 saja memakan 3,25 s dari 14,3 s di C3a. Tanpa lantai itu, C3a turun ke kira-kira 11 s. Ini estimasi dari selisih aritmetika dan **hipotesis**, karena tidak diukur.

## 5. Kegagalan ambang dan pemilik (tanpa perbaikan)

C3a (bab 8, 13 hlm) wall CLI p50 15,46 s / p95 15,92 s > 15 s. Job render p95 14,56 s ≤ 15 s. Penyebab terurut menurut besar porsi:

| # | Penyebab | Besar (p50) | Pemilik |
|---|---|---|---|
| 1 | Raster berurutan + lantai settle D-265 (5 × ±1,0 s) | 6,19 s | FIX-FIG (D-265) / `engine/browser` |
| 2 | Konversi soffice per job (profil per job; 13 hlm tetap 5,6 s, 102 hlm 9,8 s → ongkos tetap ±4-5 s) | 5,61 s | runtime soffice SR-38 / `engine/soffice` |
| 3 | Overhead proses CLI: start Node/tsx ±1,1 s + peluncuran Chromium per proses ±1,05 s (`renderToDir` menutup browser di akhir kecuali `keepBrowser`) | ±2,2 s | SR-33 (`scripts/parity/run/lib/render.ts:489-496`) |
| 4 | Beban host ±5 inti dari proses yatim | tak terkuantifikasi | Controller (host) |

Ambang 15 s masih berstatus "usul", dan vonisnya bergantung pada definisi metrik (wall CLI atau job render). Keputusan definisi ini milik controller/pengguna.

## 6. Berkas dan cara menjalankan

| Path | Isi |
|---|---|
| `tests/perf/out/sr54/tools/make_inputs.ts` | masukan turunan (figur mesin, subset bab) |
| `tests/perf/out/sr54/tools/bench.mjs` | runner C1-C5 (pemanasan + N, wall, tahap, raster, stabilitas sha) |
| `tests/perf/out/sr54/tools/gate_bench.ts` | kasus 6 |
| `tests/perf/out/sr54/results.json`, `results_C1b.json`, `gate_results.json` | angka mentah per run |
| `tests/perf/out/sr54/bench_console.log`, `gate_console.log` | keluaran konsol |
| `tests/perf/out/sr54/runs/<kasus>/<warmup\|r1..r5>/` | keluaran CLI, `render_report.json`, `render_log.jsonl`, stdout/stderr |
| `tests/perf/out/sr54/inputs/` | `m000_engine.v2.json`, `m000_engine_ch1-{5,6,7}.v2.json` |

```
npx tsx tests/perf/out/sr54/tools/make_inputs.ts --subset 1-5 --subset 1-7
node tests/perf/out/sr54/tools/bench.mjs --reps 5            # C1..C5 (±10 menit)
node tests/perf/out/sr54/tools/bench.mjs --reps 5 --only C1b
npx tsx tests/perf/out/sr54/tools/gate_bench.ts --reps 5
```

## 7. CI, batasan, dan rekomendasi

- **CI.** Ini bukan uji CI, karena bergantung pada soffice, Chromium, dan beban host. Variasi antar-run kecil (wall C2 30,4-32,5 s), tetapi angka absolut sensitif terhadap beban host.
- **Batasan.**
  - Hanya ada 5 sampel, sehingga p95 ≈ maksimum.
  - Kasus 1 memakai subset Manual 000 karena fixture `doc/**` terlalu kecil. C1b berisi 32 halaman, bukan tepat 30.
  - Jalur layanan HTTP, dengan browser yang mungkin sudah hangat, tidak diukur.
  - `tests/perf/` belum tercantum di `.gitignore` (273 MB biner). Controller perlu menambahkannya atau membersihkan folder itu.
- **Rekomendasi** (untuk pemilik, tidak diterapkan di sini):
  - Tetapkan metrik resmi ambang 15 s.
  - FIX-FIG: evaluasi raster paralel antarhalaman atau lantai jeda adaptif dengan tetap mempertahankan determinisme 2 tangkapan identik.
  - SR-38: evaluasi soffice yang tetap hangat atau penggunaan ulang profil.
  - Ukur ulang dengan host tenang setelah proses yatim dihentikan.
