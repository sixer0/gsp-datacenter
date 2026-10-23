---
type: test-report
task_id: doc_artifact_studio_s79
row: S79
date: 2026-10-23
agent: test-expert
skills: tdd
status: complete
baseline_for: IP-39 (petunjuk tergambar baru di engine/chart) dan IP-40
---

# 05 Paritas chart (SVG + PNG) — baris S79

Laporan ini adalah **garis dasar sebelum IP-39**. Kode produksi, harness (`scripts/parity/**`), dan fixture (`tests/parity/fixtures/**`) tidak diubah. Skill DATUM dibaca read-only lewat harness (`python -I -B`). Satu-satunya tambalan acuan yang aktif adalah tambalan in-process INT-L PT-01 untuk K-01. Tidak ada DB.

## Ringkasan

| Kelompok (KT-02) | Kode | SVG | PNG | Vonis KT-02 |
|---|---|---|---|---|
| CA datumchart (struktural ketat) | 4 | PASS 4/4 | FAIL 4/4 (gerbang SSIM >= 0,995) | **GAGAL 4** (hanya PNG; sebab H9) |
| CB1 pustakachart PENUH | 34 | PASS 1 (H-02), FAIL 33 | DIAGNOSIS 34 | **LULUS 1, GAGAL 33** |
| CB2 pustakachart PARSIAL | 8 | PASS 7, NODE_ERROR 1 (K-08) | DIAGNOSIS 7, NODE_ERROR 1 | **LULUS 7, GAGAL 1** |
| CC tanpa acuan (lint saja) | 12 | lint: 11 kode PASS, H-08 FAIL (dua gaya) | tidak berlaku | **LULUS 11, GAGAL 1** (H-08; positif palsu lint, L1) |
| Total | 58 | | | **LULUS 19, GAGAL 39** |

Gerbang (d) ukuran root lolos untuk 45 dari 45 kode yang dirender. Gerbang (e) font gagal hanya pada 2 kode. Kegagalan terbanyak ada di (f) label (31 kode), (b) warna (24), dan (a) jumlah tanda (22).

Diagnosis F-051: dari 33 kegagalan CB1, **sebagian besar berasal dari implementasi kriteria di pembanding** (`scripts/parity/compare/compare_svg.py`, pemilik S66), bukan dari engine. Kegagalan yang bersumber dari engine atau fixture hanya ada di 9 kode: P-10, K-07, H-07, K-09, W-07, H-06, K-08, K-12, W-05. Rinciannya ada di bagian 4.

## 1. Strategi uji

| Unsur | Isi |
|---|---|
| Lingkup | KT-01 (D-22): 58 kode. 46 kode beracuan (CA 4, CB1 34, CB2 8; `research/06_chart_map_parity_matrix.md:138-147`, `:249-256`) dijalankan lewat harness paritas penuh dengan format SVG dan PNG. 12 kode TANPA-ACUAN (kelas CC) diperiksa lint saja. |
| Kriteria | KT-02 = (b) struktural untuk kode terpeta dan (c) lint untuk kode tanpa acuan. Ambang dari research/06 §6.2 yang ditanam di `scripts/parity/compare/thresholds.py:19-96`: CA semua gerbang (PNG SSIM >= 0,995, diff <= 0,5 %); CB1 (a)(b)(d)(e)(f) dan (c) jumlah/orientasi/nol sebagai gerbang, (c) domain/tick sebagai diagnosis, PNG diagnosis; CB2 hanya (d)(e); CC lint. |
| Runner | `scripts/parity/run/run_parity.ts` (H05, S67), acuan `scripts/parity/reference/fig/ref_fig.py` (S65), pembanding `scripts/parity/compare/compare.py` (S66). Interpreter `C:\Users\TRIAL\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe` dengan `-I -B` (`scripts/parity/run/lib/python.ts:69`). |
| Fixture beracuan | Korpus S63 `tests/parity/fixtures/chart/*.json` (46 berkas, `manifest.json` counts.chart = 46). |
| Fixture lint (CC) | Korpus S63 tidak memuat fixture untuk 12 kode TANPA-ACUAN. Spec diturunkan **tanpa mengubah sumber**: panel 12 kode diambil dari `benchmark/manual000/figures/specs/bm-fig-17..21.chart.json` (spec S94/IP-02, kunci params penuh), diberi `$schema`, `widthMm: 166`, `title`, dan `source`, lalu ditulis dalam dua gaya (`gallery` dan `datum`) ke `tests/parity/out/s79/lint_fixtures/chart/` (24 berkas). |
| Pengecualian | DF-01..DF-18 (`drawn=false`, research/06 §5.2) tidak dirender, jadi tidak ada paritas. Komposit galeri (BG) adalah lingkup benchmark S98, bukan S79. Format DOCX/PDF/HTML tidak berlaku untuk figur chart. |
| README | Perintah meminta "README `scripts/parity/**`". **Tidak ada README di disk**: `find scripts/parity tests/parity -iname "*readme*"` kosong. Pemakaian dibaca dari docstring `run_parity.ts:1-22` dan `compare.py:1-10`. |

## 2. Berkas yang dihasilkan

Semua berkas ada di `tests/parity/out/s79/`, area eksklusif S79.

| Berkas | Isi |
|---|---|
| `main/` | Run harness untuk 46 fixture beracuan: `summary.{json,md}`, `harness_log.jsonl`, dan per fixture `chart_<kode>/{ref,node,cmp}/` + `fixture_report.{json,md}` |
| `lint/` | Run harness lint untuk 24 fixture CC (12 kode x 2 gaya) |
| `lint_fixtures/chart/*.json` | 24 spec turunan panel benchmark (masukan run lint) |
| `rerun/` | Run ulang subset `chart/*03` untuk uji determinisme |
| `run_main_stdout.txt`, `run_lint_stdout.txt` | stdout run, dikutip di bagian 5 |
| `analysis_main.json` | Ekstraksi per kode: gerbang gagal, diff, metrik PNG |
| `baseline_node_svg_sha256.txt` | sha256 69 SVG Node (45 beracuan + 24 lint). Ini garis dasar pembanding untuk IP-39. K-08 tidak punya SVG. |

## 3. Inventaris kasus: vonis per kode terhadap KT-02

Kolom:
- **SVG gagal**: kode gerbang yang gagal.
- **Diag**: cek diagnosis yang tidak lolos (tidak menggagalkan).
- **Tanda r/n**: jumlah tanda acuan/Node.
- **PNG**: SSIM 300 dpi / SSIM 72 dpi / diff piksel %.
- **Sebab**: kode sebab dari bagian 4.

### 3.1 Kode beracuan (46)

| Kode | Kelas | SVG | SVG gagal | Diag | Tanda r/n | PNG | PNG metrik | Vonis KT-02 | Sebab |
|---|---|---|---|---|---|---|---|---|---|
| P-01 | CA | PASS | - | - | 6/6 | FAIL | 0.9723 / 0.4882 / 0.98 | **GAGAL** | PNG: H9 |
| P-02 | CA | PASS | - | - | 6/6 | FAIL | 0.9786 / 0.6315 / 0.72 | **GAGAL** | PNG: H9 |
| P-11 | CA | PASS | - | - | 5/5 | FAIL | 0.9732 / 0.4308 / 1.01 | **GAGAL** | PNG: H9 |
| W-02 | CA | PASS | - | - | 12/12 | FAIL | 0.9727 / 0.5783 / 0.95 | **GAGAL** | PNG: H9 |
| H-01 | CB1 | FAIL | f | c.domain.y | 24/24 | DIAGNOSIS | 0.8230 / 0.6703 / 6.06 | **GAGAL** | f: H7 |
| H-02 | CB1 | PASS | - | - | 12/12 | DIAGNOSIS | 0.8188 / 0.5897 / 6.27 | **LULUS** | - |
| H-04 | CB1 | FAIL | a, b, f | - | 1/17 | DIAGNOSIS | 0.8131 / 0.6403 / 6.54 | **GAGAL** | a,b: H2; f: A1 (PC:1020) |
| H-05 | CB1 | FAIL | a, b, c.count, c.orient, f | c.domain.y | 0/47 | DIAGNOSIS | 0.7270 / 0.4785 / 26.72 | **GAGAL** | a,b: H3; c: H6; f: H7 |
| H-06 | CB1 | FAIL | a, b, f | - | 0/12 | DIAGNOSIS | 0.7815 / 0.5385 / 58.37 | **GAGAL** | a,b: H3; f: H7 + E6 |
| H-07 | CB1 | FAIL | a, b | - | 12/13 | DIAGNOSIS | 0.9063 / 0.7660 / 3.96 | **GAGAL** | a: H1; b: H1 + E3 |
| K-01 | CB1 | FAIL | b.accent, f | c.ticks.x | 12/12 | DIAGNOSIS | 0.5823 / 0.3145 / 39.85 (bendera < 0,70) | **GAGAL** | b: H8; f: H7 + A1 |
| K-02 | CB1 | FAIL | b.accent, f | c.ticks.x | 12/12 | DIAGNOSIS | 0.4227 / 0.0648 / 61.37 (bendera < 0,70) | **GAGAL** | b: H8; f: H7 |
| K-03 | CB1 | FAIL | a, b, c.zero, f | c.ticks.x | 11/10 | DIAGNOSIS | 0.8285 / 0.6660 / 11.12 | **GAGAL** | a,b: H4 (PC:450); c: H5; f: H7 + A1 (PC:453) |
| K-04 | CB1 | FAIL | c.zero, f | c.ticks.x | 10/10 | DIAGNOSIS | 0.8085 / 0.6699 / 16.58 | **GAGAL** | c: H5; f: H7 + A1 (PC:478) |
| K-07 | CB1 | FAIL | a, b, e, f | - | 99/100 | DIAGNOSIS | 0.4297 / 0.1140 / 72.81 (bendera < 0,70) | **GAGAL** | a,b: H1 + E3; e: E2; f: H7 |
| K-09 | CB1 | FAIL | a, b, f | - | 8/9 | DIAGNOSIS | 0.5513 / 0.4051 / 77.36 (bendera < 0,70) | **GAGAL** | a,b: H1 + E3; f: H7 |
| K-10 | CB1 | FAIL | a, b, c.zero, f | - | 4/5 | DIAGNOSIS | 0.6697 / 0.5057 / 28.64 (bendera < 0,70) | **GAGAL** | a,b: H1; c: H5; f: P1 |
| K-12 | CB1 | FAIL | b, c.zero, f | - | 8/8 | DIAGNOSIS | 0.6028 / 0.3874 / 46.99 (bendera < 0,70) | **GAGAL** | b: F1; c: H5; f: H7 + A1 |
| P-03 | CB1 | FAIL | f | c.ticks.y | 10/10 | DIAGNOSIS | 0.6540 / 0.4731 / 37.28 (bendera < 0,70) | **GAGAL** | f: H7 + A1 (PC:220) |
| P-04 | CB1 | FAIL | a, b, f | c.domain.x, c.ticks.y | 0/10 | DIAGNOSIS | 0.8074 / 0.5815 / 7.97 | **GAGAL** | a,b: H2 + H3; f: H7 |
| P-06 | CB1 | FAIL | a, b, f | c.domain.x, c.ticks.x, c.ticks.y | 0/18 | DIAGNOSIS | 0.8592 / 0.7025 / 6.19 | **GAGAL** | a,b: H2 + H3; f: H7 + A1 (PC:276) |
| P-07 | CB1 | FAIL | a, b, c.zero, f | c.ticks.x, c.ticks.y | 3/78 | DIAGNOSIS | 0.8185 / 0.6396 / 6.11 | **GAGAL** | a,b: H2; c: H5; f: H7 + A1 |
| P-08 | CB1 | FAIL | f | c.ticks.x, c.ticks.y | 6/6 | DIAGNOSIS | 0.7086 / 0.4486 / 11.54 | **GAGAL** | f: H7 + A1 (PC:305) |
| P-10 | CB1 | FAIL | a, b, c.zero, e, f | c.ticks.y | 7/6 | DIAGNOSIS | 0.7481 / 0.5553 / 20.37 | **GAGAL** | a,b: H4 (PC:1191) + E3; c: H5; e: E1; f: H7 + P1 |
| P-12 | CB1 | FAIL | f | c.domain.x | 6/6 | DIAGNOSIS | 0.8012 / 0.5047 / 7.01 | **GAGAL** | f: H7 + A2 |
| P-13 | CB1 | FAIL | a, b, f | c.domain.x, c.domain.y | 14/12 | DIAGNOSIS | 0.7425 / 0.5419 / 8.01 | **GAGAL** | a,b: H4 (PC:1069-1070); f: H7 + A1 (PC:1078-1080) |
| P-15 | CB1 | FAIL | a, b, f | - | 23/15 | DIAGNOSIS | 0.6290 / 0.3867 / 12.03 (bendera < 0,70) | **GAGAL** | a,b: H11; f: H7 |
| S-02 | CB1 | FAIL | a, b, c.zero, f | c.ticks.x, c.ticks.y | 18/19 | DIAGNOSIS | 0.7597 / 0.5193 / 8.67 | **GAGAL** | a,b: H12 + D1 (D-82); c: H5; f: H7 |
| S-03 | CB1 | FAIL | a, b, c.count, c.orient, f | c.ticks.None | 1/2 | DIAGNOSIS | 0.8743 / 0.6969 / 22.94 | **GAGAL** | a,b: H3; c: H6; f: H7 |
| S-04 | CB1 | FAIL | a, b, c.zero, f | c.ticks.x, c.ticks.y | 3/9 | DIAGNOSIS | 0.7552 / 0.5164 / 8.76 | **GAGAL** | a,b: H3 + H12; c: H5; f: H7 |
| S-05 | CB1 | FAIL | a, b, c.zero, f | c.domain.x | 4/8 | DIAGNOSIS | 0.8171 / 0.5153 / 7.02 | **GAGAL** | a,b: H3; c: H5; f: H7 |
| S-06 | CB1 | FAIL | a, b, f | c.ticks.y | 0/75 | DIAGNOSIS | 0.7743 / 0.5859 / 8.12 | **GAGAL** | a,b: H2; f: H7 |
| W-01 | CB1 | FAIL | f | c.domain.x, c.ticks.y | 2/2 | DIAGNOSIS | 0.7442 / 0.4773 / 9.39 | **GAGAL** | f: H7 + A1 (PC:702) + A2 |
| W-03 | CB1 | FAIL | f | c.ticks.x, c.ticks.y | 1/1 | DIAGNOSIS | 0.8055 / 0.5999 / 6.96 | **GAGAL** | f: H7 |
| W-04 | CB1 | FAIL | a, b, f | c.ticks.x, c.ticks.y | 1/2 | DIAGNOSIS | 0.8319 / 0.6446 / 23.31 | **GAGAL** | a,b: H3; f: H7 |
| W-05 | CB1 | FAIL | b, f | c.domain.x, c.ticks.y | 3/3 | DIAGNOSIS | 0.6680 / 0.5269 / 47.73 (bendera < 0,70) | **GAGAL** | b: F1; f: H7 + A1 (PC:725) + A2 |
| W-06 | CB1 | FAIL | a, b, b.accent | - | 5/25 | DIAGNOSIS | 0.7890 / 0.5095 / 10.08 | **GAGAL** | a,b: H2; b.accent: H8 |
| W-07 | CB1 | FAIL | a, b, c.count, c.orient, c.zero, f | - | 6/7 | DIAGNOSIS | 0.8199 / 0.6756 / 9.97 | **GAGAL** | a,b: H2; c: E4 + H5; f: H7 |
| G-01 | CB2 | PASS | - | - | 23/24 | DIAGNOSIS | 0.5652 / 0.2926 / 73.01 (bendera < 0,70) | **LULUS** | - |
| G-04 | CB2 | PASS | - | - | 11/18 | DIAGNOSIS | 0.8555 / 0.7095 / 7.63 | **LULUS** | - |
| H-03 | CB2 | PASS | - | - | 0/48 | DIAGNOSIS | 0.3484 / 0.2155 / 87.62 (bendera < 0,70) | **LULUS** | - |
| K-08 | CB2 | NODE_ERROR | Node BY_CONSTRUCTION_FAILED | - | - | NODE_ERROR | - | **GAGAL** | Node: E5 |
| P-05 | CB2 | PASS | - | - | 3/66 | DIAGNOSIS | 0.7589 / 0.5615 / 8.60 | **LULUS** | - |
| P-09 | CB2 | PASS | - | - | 5/1 | DIAGNOSIS | 0.6493 / 0.3459 / 43.31 (bendera < 0,70) | **LULUS** | - |
| S-01 | CB2 | PASS | - | - | 24/11 | DIAGNOSIS | 0.6913 / 0.4497 / 18.86 (bendera < 0,70) | **LULUS** | - |
| W-08 | CB2 | PASS | - | - | 161/160 | DIAGNOSIS | 0.4818 / 0.2951 / 23.11 (bendera < 0,70) | **LULUS** | - |

Catatan tabel:
- **CB2**: hanya (d) dan (e) yang digerbang (`thresholds.py:54-61`). Selisih jumlah tanda pada baris CB2 tidak menggagalkan.
- **Cek per-kode CB2 di research/06 §6.2** (mis. "S-01 jumlah batang = bins", "H-03 jumlah sel = baris x kolom", "G-01 jumlah ubin = jumlah wilayah") **tidak diimplementasikan** pembanding: kelas CB2 di `thresholds.py:54-61` hanya memuat kunci (d)/(e). Ini celah cakupan (bagian 7).
- **Ukuran PNG**: semua 42 pasangan PNG kelas CB berbeda ukuran. Acuan memakai Agg `bbox_inches="tight"`, sedangkan Node memakai kanvas mm. Sesuai research/06 §6.4-N4, ini tidak menggagalkan.

### 3.2 Kode tanpa acuan (12, lint saja)

Kedua gaya dirender dengan lebar 166 mm. Kolom "Lint harness" adalah vonis `lintVerdict` pada `run_parity.ts:183-187`. Kolom "releaseStatus" adalah vonis lint engine.

| Kode | Gaya datum / gallery | Lint harness | releaseStatus | FAIL | REPORT (selain DATUM-36) | Ukuran mm | Aksen (subjek) | Vonis KT-02 |
|---|---|---|---|---|---|---|---|---|
| P-14 | sama | PASS / PASS | NOT_RUN | - | - | 166 x 44,01 | 1 | **LULUS** |
| H-08 | sama | FAIL / FAIL | PASS | DATUM-32 x12 ("konektor #0 melewati simpul tak terkait '#1' sepanjang 1.0 mm") | H-08-FLATTEN | 166 x 44,01 | 1 | **GAGAL** (L1, positif palsu; H10) |
| H-09 | sama | PASS / PASS | NOT_RUN | - | - | 166 x 44,01 | 1 | **LULUS** |
| K-05 | sama | PASS / PASS | NOT_RUN | - | - | 166 x 44 | 1 | **LULUS** |
| K-06 | sama | PASS / PASS | NOT_RUN | - | - | 166 x 44 | 1 | **LULUS** |
| K-11 | sama | PASS / PASS | PASS | - | K-11.balance ("total per tingkat T0 100, T1 96") | 166 x 44 | 1 | **LULUS** (catat: §6.5 "total tiap tingkat sama" hanya REPORT) |
| W-09 | sama | PASS / PASS | PASS | - | chart.kind.W-09.bandLegend ("horizon tanpa legenda pita") | 166 x 44 | 0 | **LULUS** (catat: §6.5 "legenda pita wajib" hanya REPORT; spec panel menyetel bandLegend=false, D-108) |
| W-10 | sama | PASS / PASS | NOT_RUN | - | - | 166 x 44 | 0 | **LULUS** |
| S-07 | sama | PASS / PASS | NOT_RUN | - | - | 166 x 44 | 1 (44 titik satu grup) | **LULUS** |
| S-08 | sama | PASS / PASS | NOT_RUN | - | - | 166 x 44 | 1 | **LULUS** |
| G-02 | sama | PASS / PASS | PASS | - | KT-12 | 166 x 44 | 1 | **LULUS** |
| G-03 | sama | PASS / PASS | PASS | - | KT-12 | 166 x 44 | 1 (2 tanda, 1 subjek) | **LULUS** |

Cek yang benar-benar berjalan di lint render adalah DATUM-25 (maks 5 warna), DATUM-28 (font >= 5,5 pt), DATUM-32, dan DATUM-33 (tinggi <= 247 mm). Semuanya PASS kecuali DATUM-32 pada H-08. Cek §6.5 lainnya diukur langsung dari SVG Node (grep `data-mark` + `#B45309`, dan teks judul):
- lebar 166 mm;
- subjek aksen <= 1;
- tanpa judul di plot (0 teks "Panel ...").

Cek khusus per kode §6.5 (P-14 panah berpasangan, K-05 mulai jam 12, S-08 utara di atas, dsb.) **tidak punya implementasi lint** dan tidak dinilai (bagian 7).

## 4. Pemetaan kegagalan ke berkas:baris dan baris pemilik (+ diagnosis F-051)

Jenis sebab:
- **H** = harness/pembanding;
- **L** = lint engine;
- **E** = engine chart;
- **F** = fixture;
- **A** = acuan literal (keterbatasan penyuntikan);
- **D** = deviasi terdokumentasi;
- **P** = parameter katalog tanpa padanan acuan.

Path relatif terhadap akar repo. `PC` = `...\hermes\skills\gsp\datum-house-style\pustakachart.py` (read-only).

| ID | Sebab | Berkas:baris | Bukti | Pemilik | Kode terdampak |
|---|---|---|---|---|---|
| H1 | Patch pertama setiap `axes_N` dianggap latar sumbu. Pada chart yang sumbunya mati, patch pertama adalah tanda data, sehingga hitungan acuan kurang satu dan warnanya hilang | `scripts/parity/compare/compare_svg.py:46-48` | Probe svgnorm: patch pertama K-07 `patch_2` isi `#2F6F6B` 4,8 mm; K-10 `#101418`; K-09 `#101418`; G-01 `#727E89`. Pembanding P-03/K-01: `#FCFCFB` selebar plot (latar sungguhan) | S66 | K-07 (99/100), K-09 (8/9), K-10 (4/5), H-07 (12/13), G-01 (CB2) |
| H2 | Garis `line2d_N` hanya dihitung bila tag-nya path/line/polyline. Penanda (`plot(...,'o')`) ditulis matplotlib sebagai `<use>`, jadi tidak terhitung | `compare_svg.py:52-55` | `chart_p04/ref/ref.svg:173-174` `<use xlink:href="#md807ba8e0e" .../>` di dalam `line2d_N` | S66 | H-04, P-04, P-06, P-07, S-06, W-06, W-07, P-05 (CB2) |
| H3 | Koleksi tidak diklasifikasi: LineCollection (`hlines`/`vlines`), QuadContourSet, `image` (imshow), serta PolyCollection/FillBetween yang path-nya ada di `<defs>` lalu dipakai lewat `<use>` (defs dilewati `svgnorm.py:27`) | `compare_svg.py:41-60`, `:58` | `chart_p04/ref/ref.svg:131-137` (LineCollection_1 batang lollipop); `chart_s03/ref/ref.svg:49-51` (FillBetweenPolyCollection_1 > defs > path) | S66 | H-05 (0/47), H-06 (0/12), P-04, P-06, S-03, S-04, S-05, W-04, H-03 (CB2) |
| H4 | Garis rujukan `axhline`/`axvline` (di luar `matplotlib.axis`) dihitung sebagai tanda data `line` | `compare_svg.py:52-55` | PC:450 `ax.axvline(0)` (K-03), PC:1191 `axhline(0)` (P-10), PC:1069-1070 pembagi kuadran (P-13) | S66 | K-03 (11/10), P-10 (7/6), P-13 (14/12) |
| H5 | (c) nol: setiap tanda "rect-like" wajib menyentuh garis sumbu. `RECTLIKE` memuat `interval` dan `box` yang mengambang menurut definisinya. Tanda bertumpuk, berpusat, atau mengambang selalu gagal. Garis nol Node `data-midpoint="0"` di luar grup `data-axis` diabaikan. CH-01 hanya mensyaratkan nol untuk bar/column/area | `compare_svg.py:30`, `:150-165`; garis sumbu hanya dari grup `data-axis` `:100-108` | Probe: K-03 10/10 batang tidak menyentuh garis sumbu, padahal Node punya `<line x1="73.9671" ... data-midpoint="0"/>`. P-03 0/10 tidak menyentuh (lolos) | S66 | K-03, K-04, K-10, K-12, P-07, P-10, S-02, S-04, S-05, W-07 |
| H6 | (c) jumlah sumbu acuan menghitung setiap `matplotlib.axis`, termasuk sumbu colorbar dan sumbu tanpa tick | `compare_svg.py:109-130` | H-05 acuan x,y,y (colorbar). S-03 acuan dua sumbu ber-orient `None` (0 xtick/ytick, `grep -c` = 0) | S66 | H-05, S-03 |
| H7 | (f) label: `texts_of` ikut menghitung label tick, teks legenda, baris KUNCI, dan satuan. Tidak ada normalisasi angka: `10.0` lawan `10,0`, `1000` lawan `1.000`, `60%` lawan `60 %`. Kontrak §3.5 (`masterplan/01_specs.md:368`) menyediakan `data-key="row"` (KUNCI) dan `data-label="value"` (label data), tetapi pembanding mencari `data-role="axis-title"` yang tidak ada di kontrak maupun engine (grep 0 hasil) | `compare_svg.py:178-192`, `:317-319`; `svgnorm.py:110-111` | H-01 hanya beda format desimal; P-15/K-09 hanya beda format angka; S-02 `1000` lawan `1.000` | S66 | 31 kode (semua `f`) |
| H8 | (b) aksen dihitung per tanda, bukan per subjek. Aksen seri (`data-accent="series"`) dengan 4 segmen terhitung 4. D-108 menetapkan subjek DATUM-26 = `data-accent-group` > `data-accent="series"` > `series#index` | `compare_svg.py:258-260` | K-01/K-02 node = 4, W-06 node = 5 (1 garis + 4 titik seri beraksen) | S66 | K-01, K-02, W-06 |
| H9 | Gerbang PNG CA SSIM >= 0,995 bertentangan dengan normalisasi N1. Node menulis pt fisik, DC menulis px: teks Node 4/3 kali lebih besar, sehingga SSIM tertahan di sekitar 0,973 walaupun SVG struktur PASS | `scripts/parity/compare/thresholds.py:87`; research/06 §6.4-N1 (`:283-293`) | P-01 acuan `font-size="6.8"` pada root 483,78 px = 128 mm (1,80 mm). Node `font-size="2.39889"` mm (6,8 pt). Ukuran PNG identik (size identical=True) | S66 + controller (keputusan N1) | P-01, P-02, P-11, W-02 |
| H10 | `lintVerdict` menghitung setiap isu FAIL tanpa memperhatikan tier/releaseStatus engine. H-08 bervonis FAIL walaupun `releaseStatus` = PASS (DATUM-32 tidak berlaku pada tier figur, `src/lib/studio/engine/lint/scan/runner.ts:115-124`) | `scripts/parity/run/run_parity.ts:183-187` | `lint/chart_h08_datum/fixture_report.md`: "Lint Node: PASS ... FAIL 12 ... rilis: PASS" + "lint FAIL: DATUM-32" | S67 | H-08 |
| H11 | Patch berisi warna kertas (`#FCFCFB`, sel tabel kosong) dihitung sebagai tanda | `compare_svg.py:49-51` (hanya `fill None` yang dilewati) | P-15 onlyRef = 8 x `#FCFCFB`; 23 - 8 = 15 = jumlah Node | S66 | P-15 |
| H12 | (a) "jumlah tanda = jumlah datum" tidak bisa dihitung dari primitif matplotlib. `boxplot` menulis satu line2d per whisker, cap, median, dan flier; Node memakai whisker/box/segment/point | `compare_svg.py:35-60` (klasifikasi primitif) | S-02 acuan 3 rect + 15 line, Node 12 whisker + 3 box + 3 segment + 1 point | S66 | S-02, S-04 |
| L1 | Lint DATUM-32: `pathPoints` mengubah busur `A` menjadi titik ujungnya saja, sehingga busur H-08 dibaca sebagai tali busur di sepanjang garis dasar dan "menembus" simpul di antaranya | `src/lib/studio/engine/lint/render/svg.ts:207-241` (komentar `:207` "Busur dan kurva = titik ujung"); pemanggil `lint/render/index.ts:395-421` | `node/*.svg` H-08: `<path data-mark="link" d="M2.1289 39.7522A80.8711 38.5522 0 0 1 163.8711 39.7522"/>` (busur di atas garis dasar y = 39,75) | S45 / INT-O | H-08 (dua gaya) |
| E1 | Label kategori waterfall gaya datum 6,0 pt < min acuan 6,5 - 0,3 | `src/lib/studio/engine/chart/family-p2/waterfall.ts:85` | P-10 Node min 6,0 pt ("Diskon", "Instalasi" ...), acuan min 6,5 pt | S34 | P-10 (e) |
| E2 | Catatan waffle "1 kotak = ..." 6,0 pt di kedua gaya | `family-k2/waffle.ts:38` (T.tick 6,0), dipakai di `:99` | K-07 Node min 6,0 pt ("1 kotak = 1 %"), acuan min 6,5 pt | S38 | K-07 (e) |
| E3 | Peran warna engine berbeda dari acuan (sebagian disengaja dan didokumentasikan di sumber). Waterfall: naik = verd, bukan SIGNAL (`family-p2/waterfall.ts:12-14`). Waffle: ramp tinta ink100..ink700 (`family-k2/waffle.ts:54`), sedangkan acuan VERD. Network: simpul ink700 (`family-h2/network.ts:240`), sedangkan acuan ink100 `#EFF2F4`. Treemap: rona grup (`family-k2/treemap.ts:16-17`) | lihat kolom sebab | onlyRef/onlyNode warna: P-10 `#B45309` x3 lawan `#2F6F6B` x3; K-07 `#2F6F6B` lawan `#101418`; H-07 `#EFF2F4` x6 lawan `#2B3640` x7 | S34, S38, S36 | P-10, K-07, H-07, K-09 |
| E4 | Label tugas Gantt ditulis sebagai teks biasa di luar grup `data-axis="y"`, sehingga Node hanya punya sumbu x. Kontrak §3.5 meminta elemen sumbu membawa `data-axis` | `src/lib/studio/engine/chart/family-w2/gantt.ts:184` (label), `:193` (hanya `data-axis="x"`) | `grep -c data-axis` W-07 Node = 1 | S40 | W-07 (c) |
| E5 | Batas ikon K-08 (`MAX_ICON_UNITS` 100) menolak fixture S63 bertotal 688. Fixture disusun untuk acuan PARSIAL (lingkaran luas proporsional), sedangkan engine menegakkan "satu ikon satu unit" | `family-k2/icon-array.ts:62`; `tests/parity/fixtures/chart/k08.json` (400+170+90+28) | render_report: "688 ikon > 100; jumlah besar, pakai waffle (K-07)" | S38 + S63 (keputusan: fixture atau batas) | K-08 |
| E6 | Level kontur engine berbeda dari acuan (label level -47/-53 lawan -42/-48) | `family-h2/contour.ts:82-99` (`levelsOf`) | H-06 f.labels onlyRef -42,-48,-54 / onlyNode -47,-53,-73 | S36 | H-06 (f) |
| F1 | Acuan mewarnai satu seri dengan SIGNAL secara literal, sedangkan fixture tidak membawa petunjuk aksen. Gaya datum hanya menerapkan aksen yang disetel eksplisit (D-77) | `tests/parity/fixtures/chart/k12.json`, `w05.json` (grep `accent` = 0) | K-12 onlyRef `#B45309` x4 lawan `#6B7783` x4; W-05 `#B45309` lawan `#C3CBD1` | S63 | K-12, W-05 (b) |
| A1 | Teks literal di dalam fungsi acuan tidak dapat disuntik: legenda "Alfa/Bravo" PC:220/233, "H1-2026/H2-2026" PC:276/305, legenda "setuju" PC:453, "Tim kantor" PC:478, "Site A" PC:702/725, anotasi "08:00/23:00" PC:1020, nama kuadran PC:1078-1080 | `scripts/parity/reference/fig/pc_inject.py` (penyuntik hanya atribut `PCD`) + PC | f.labels onlyRef | S65 (batas acuan; tidak bisa diperbaiki tanpa menyalin fungsi) | P-03, P-06, P-08, P-13, K-01, K-03, K-04, K-12, H-04, W-01, W-05, P-07 |
| A2 | Kategori bulan tidak diteruskan ke acuan (sumbu x acuan berupa indeks 2..12) | `pc_inject.py` (`inj_line`, `inj_stacked_area`, `inj_small_multiples`) | W-01 onlyRef 2,4,...,14; onlyNode Jan..Des | S65 | W-01, W-05, P-12 |
| D1 | Median box plot tidak beraksen di Node; acuan mewarnai semua median (melanggar DATUM-26) | D-82 (`decisions.md:87`) | S-02 onlyRef `#B45309` x3 | keputusan D-82 (diterima) | S-02 (b) |
| P1 | Label nilai dari parameter katalog yang tidak dimiliki acuan: `conversionPercent` (K-10), `signedDeltaLabels` (P-10) | registri chart (research/06 §5.1 parameter) | K-10 onlyNode "41 %", "43 %" ...; P-10 "+136,0", "-21,5" | S38, S34 (disengaja); pembanding perlu mengecualikan | K-10, P-10 (f) |

### 4.1 Diagnosis F-051 per kriteria (5 fixture INT-N)

F-051 (`findings_register.md:59`) mencatat bahwa P-03, K-03, H-01, S-02, dan W-06 "GAGAL kriteria a/b/c/f". Keadaan pada run segar ini:

| Fixture | a | b | c | f | Sebab |
|---|---|---|---|---|---|
| P-03 | lolos (10/10) | lolos | lolos (nol OK) | **gagal** | f: tick acuan 50/150/250/350 lawan Node 500 (H7, tick bukan label data); legenda literal "■ Alfa □ Bravo" PC:220 (A1); KUNCI + nama seri + "juta rupiah" Node tidak dikecualikan (H7) |
| K-03 | **gagal** 11/10 | **gagal** (+`#101418`) | **gagal** zeroBaseline | **gagal** | a,b: `axvline(0)` PC:450 terhitung tanda (H4); c: garis nol Node `data-midpoint="0"` di luar `data-axis` diabaikan (H5); f: legenda literal PC:453 (A1) + tick −20/−40 lawan -25/-50 dan "%" (H7) |
| H-01 | lolos (24/24) | lolos | lolos (domain y hanya diag) | **gagal** | f: **hanya** format desimal tick `10.0` lawan `10,0` (H7; `svgnorm.py:110-111` tanpa normalisasi angka) |
| S-02 | **gagal** 18/19 | **gagal** | **gagal** zeroBaseline | **gagal** | a: dekomposisi boxplot tidak setara (H12); b: median SIGNAL acuan (D1, D-82) + H12; c: `box` di RECTLIKE (H5); f: `1000` lawan `1.000` + "jam" (H7) |
| W-06 | **gagal** 5/25 | **gagal** + accentCount 5 | lolos | lolos | a,b: penanda line2d `<use>` acuan tidak terhitung (H2); accent: dihitung per tanda, bukan per subjek (H8) |

Kesimpulan F-051: pada kelima fixture, **tidak ada kegagalan a/b/c/f yang bersumber dari engine chart**. Sebabnya adalah klasifikasi tanda matplotlib (H2, H4, H12), implementasi (c) nol (H5), implementasi (f) (H7), hitungan aksen (H8), plus teks literal acuan (A1) dan satu deviasi terdokumentasi (D1). Hipotesis K4 S66 ("klasifikasi matplotlib berbasis id grup, HIPOTESIS", `coder_execution_s66.md`) **terbantah sebagian**: berlaku untuk bar/scatter (P-03, H-01, H-02 cocok), tetapi gagal untuk penanda `<use>`, koleksi, garis rujukan, dan sumbu yang dimatikan.

Selisih dengan catatan INT-N: P-03 dan H-01 kini hanya gagal di (f), tidak di a/b/c. Tidak ada bukti run sebelumnya di disk untuk membandingkan, sehingga tidak dapat dipastikan apakah ini perubahan atau perumusan INT-N yang kolektif ("FAIL pada a/b/c/f" untuk lima fixture sekaligus).

## 5. Cara menjalankan (perintah + keluaran yang direkam)

Akar repo `C:\Users\TRIAL\gsp-swarm-hq-v2.1`. Python acuan/pembanding otomatis memakai VENV dengan `-I -B` (`lib/python.ts:14, 69`).

**Run 1 — 46 kode beracuan, SVG + PNG**

```
npx tsx scripts/parity/run/run_parity.ts --fixtures tests/parity/fixtures --out tests/parity/out/s79/main --only "chart/**" --formats svg,png
```

Keluaran (dikutip dari `run_main_stdout.txt`):

```
run_parity: 46 fixture (dari 107; 1 berkas dilewati) -> C:\Users\TRIAL\gsp-swarm-hq-v2.1\tests\parity\out\s79\main
  [1/46] DIAGNOSIS     chart/g01 svg=PASS png=DIAGNOSIS
  [3/46] FAIL          chart/h01 svg=FAIL png=DIAGNOSIS
  [15/46] NODE_ERROR    chart/k08 svg=NODE_ERROR png=NODE_ERROR
  [19/46] FAIL          chart/p01 svg=PASS png=FAIL
  ...
run_parity: {"DIAGNOSIS":8,"FAIL":37,"NODE_ERROR":1} exit=1 summary=C:\Users\TRIAL\gsp-swarm-hq-v2.1\tests\parity\out\s79\main\summary.md
real	2m12.548s
exit=1
```

Berkas yang dilewati: `manifest.json` ("bukan studio.doc|chart|diagram|image/v1 maupun simbol"). `summary.json` counts.formatsByVerdict = `{PASS: 12, DIAGNOSIS: 41, FAIL: 37, NODE_ERROR: 2}`.

**Run 2 — 12 kode tanpa acuan, lint (SVG)**

```
python -I <scratchpad>/mk_lint_fx.py . tests/parity/out/s79/lint_fixtures      -> 24
npx tsx scripts/parity/run/run_parity.ts --fixtures tests/parity/out/s79/lint_fixtures --out tests/parity/out/s79/lint --formats svg
```

Keluaran:

```
run_parity: 24 fixture (dari 24; 0 berkas dilewati) -> ...\tests\parity\out\s79\lint
  [5/24] FAIL          chart/h08_datum svg=FAIL
  [6/24] FAIL          chart/h08_gallery svg=FAIL
  (22 lainnya PASS)
run_parity: {"PASS":22,"FAIL":2} exit=1
```

Skrip pembangun fixture lint ada di scratchpad sesi (di luar repo). Isinya cukup diulang dari bagian 1: salin `panels[].spec` kode TANPA-ACUAN, set `$schema`, `widthMm`, `title`, `source`, dan `style`.

**Run 3 — determinisme (subset `chart/*03`)**

```
npx tsx scripts/parity/run/run_parity.ts --fixtures tests/parity/fixtures --out tests/parity/out/s79/rerun --only "chart/*03" --formats svg,png
run_parity: {"DIAGNOSIS":1,"FAIL":4} exit=1
```

sha256 SVG main lawan rerun: Node dan acuan identik untuk kelima fixture.

```
p03 node ed69a744c6c5/ed69a744c6c5 ref 33b91ab76fb3/33b91ab76fb3
k03 node cfe760e9c877/cfe760e9c877 ref f7c0a3dc7244/f7c0a3dc7244
h03 node 08861dd7d184/08861dd7d184 ref 0fc3e33ce206/0fc3e33ce206
s03 node 3baefdbd06e8/3baefdbd06e8 ref 9aeb97b0ed11/9aeb97b0ed11
w03 node d15588bbad55/d15588bbad55 ref dcea876d3092/dcea876d3092
```

**Penjaga skill read-only**

Daftar berkas HS + RL (148 berkas, `%P %s %T@`) diambil sebelum dan sesudah run, lalu dibandingkan dengan `diff`:

```
SKILLS UNCHANGED (148 files, size+mtime)
```

sha256 tetap `cb805dc9…` (pustakachart.py), `40f13d7d…` (pustakachart_data.py), `e66a4d2a…` (datumchart.py). Dua folder `__pycache__` di skill sudah ada sebelum run (cap waktu 9-22 Okt) dan tidak bertambah.

**Tambalan in-process**

`main/chart_k01/ref/ref_report.json` patches = `[('PT-01', applied=True, hits=1, skillFileModified=False)]`. Tidak ada tambalan lain.

## 6. Catatan CI

- Durasi: 46 fixture SVG+PNG sekitar 2 m 12 s (130 474 ms); 24 fixture lint sekitar 9 s.
- Satu Chromium dipakai bersama per proses (`keepBrowser`). Plafon host 3 Chromium (`02_structured.md:375`) tidak dilampaui oleh S79.
- Tidak ada uji flaky yang teramati. Subset `*03` deterministik byte demi byte di kedua sisi.
- Exit 1 adalah vonis jujur, bukan galat harness. Tidak ada `COMPARE_ERROR` maupun `REF_ERROR`.
- Keluaran biner di `tests/parity/out/` di-gitignore (S69), sehingga artefak ini tidak ikut commit.

## 7. Masalah yang diketahui dan keterbatasan

1. **Vonis CB1 saat ini didominasi artefak pembanding** (H1-H8, H11, H12). Angka "33 GAGAL" tidak boleh dibaca sebagai 33 port yang salah. Bila H-sebab diperbaiki, sisa sebab non-H teridentifikasi untuk kode berikut:
   - P-10 (E1, E3, P1);
   - K-07 (E2, E3);
   - H-07, K-09 (E3);
   - H-06 (E6);
   - W-07 (E4);
   - K-12, W-05 (F1);
   - K-08 (E5);
   - S-02 (D1, keputusan sudah diterima);
   - teks literal acuan A1/A2 di 14 kode.

   Apakah kode lain akan LULUS setelah perbaikan H adalah **hipotesis** yang belum diuji, karena harness tidak boleh diubah di baris ini.
2. **Gerbang PNG CA tidak tercapai secara konstruksi** selama N1 berlaku (H9). Ini butuh keputusan controller, bukan perbaikan engine.
3. **Cek per-kode CB2 (research/06 §6.2) dan cek khusus CC (§6.5) tidak diimplementasikan.** CB2 hanya menggerbang (d)/(e). CC hanya menjalankan lint render DATUM-25/28/32/33. DATUM-26 tidak muncul di laporan lint figur; subjek aksen <= 1 diukur manual (bagian 3.2).
4. **Kriteria (f) research/06 ("himpunan label data identik, judul sumbu literal dikecualikan") ambigu** terhadap label tick, legenda, dan KUNCI. Pembanding memilih tafsiran terluas.
5. **Spec CC bukan korpus S63.** Spec turunan panel benchmark (gaya galeri + gaya datum) menguji jalur render yang sama, tetapi data panel adalah transkripsi PNG (F-S02-01).
6. **Kosakata `releaseStatus` berbeda.** Lint engine memberi NOT_RUN untuk 7 dari 12 kode CC: tidak ada cek yang berlaku pada tier figur (`runner.ts:115-124`). Harness memberi PASS karena tidak ada FAIL.

## 8. Rekomendasi (untuk controller; dimediasi ke pemilik)

| # | Untuk | Rekomendasi |
|---|---|---|
| R1 | S66 (loop R F-051, maks 3 siklus) | Perbaiki klasifikasi tanda acuan di `compare_svg.py`:<ul><li>latar sumbu hanya bila patch menutup bidang sumbu (H1);</li><li>hitung `<use>` di line2d serta LineCollection/QuadContourSet/PolyCollection-via-defs (H2, H3);</li><li>keluarkan line2d `axhline`/`axvline` lebar penuh dari tanda (H4);</li><li>buang patch berwarna PAPER (H11).</li></ul>Uji regresi minimal: P-04, K-03, K-07, P-15, S-03. |
| R2 | S66 | (c) nol: batasi pada `bar`/`column`/`area` (CH-01). Uji "domain memuat 0 dan satu garis nol" (termasuk `data-midpoint`), bukan "setiap tanda menyentuh sumbu". Keluarkan `interval`/`box` dari `RECTLIKE`. Abaikan colorbar dan sumbu tanpa tick (H5, H6) |
| R3 | S66 + controller (tafsir KT-02 f) | (f) bandingkan hanya label data: Node `data-label="value"` lawan `text_N` matplotlib dalam axes. Normalkan angka (desimal/ribuan/spasi `%`). Keluarkan `data-key="row"`, satuan, dan tick (H7). Tetapkan tafsiran (f) sebagai keputusan |
| R4 | S66 | Hitung aksen per subjek sesuai D-108 (H8) |
| R5 | Controller | Putuskan H9: (i) PNG CA menjadi diagnosis selama N1, atau (ii) acuan CA dirasterisasi dengan font diskalakan 4/3 sebelum SSIM |
| R6 | S67 | `lintVerdict` memakai `releaseStatus` atau menyaring cek yang berlaku pada tier (H10) |
| R7 | S45/INT-O | `pathPoints` mencuplik busur `A` dan kurva (L1). Tanpa ini, H-08 dan setiap konektor melengkung akan memicu DATUM-32 palsu |
| R8 | S34, S38 | Naikkan label waterfall datum dan catatan waffle ke >= 6,2 pt (E1, E2), atau ubah margin (e) lewat keputusan |
| R9 | S63 + S38 | K-08: pilih fixture <= 100 unit, atau terima bahwa paritas K-08 tidak dapat dijalankan (bentuk PARSIAL) (E5). K-12/W-05: tambahkan petunjuk aksen ke fixture agar cek warna CB1 tercapai (F1, D-77) |
| R10 | S40 | Label tugas Gantt di dalam `<g data-axis="y">` (E4; kontrak §3.5) |
| R11 | IP-39 / S79 ulang | Jalankan ulang ketiga perintah bagian 5 ke `tests/parity/out/s79_ip39/`. Bandingkan dengan `baseline_node_svg_sha256.txt` dan tabel 3.1. IP-39 (petunjuk tergambar: domain sumbu, valueLabel) kemungkinan menyentuh (c) domain diag dan (f) |
| R12 | Register temuan | Usul temuan baru: L1 (lint busur, MINOR), H9 (CA PNG lawan N1, MINOR/keputusan), E5 (K-08 fixture lawan batas, MINOR), H10 (lintVerdict lawan releaseStatus, INFO); F-051 diperbarui dengan diagnosis bagian 4.1 |
