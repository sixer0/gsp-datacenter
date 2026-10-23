---
type: test-report
task_id: doc_artifact_studio_sr51
row: SR-51 (S98 benchmark resmi D-17)
date: 2026-10-23
agent: test-expert
skills: tdd
status: complete (vonis FAIL)
revision: 2 (rerun resmi D-275; run 1 diringkas di §9)
---

# 09 Benchmark Manual 000 v2 — run resmi S98 (SR-51, rerun 2)

## Ringkasan

| Run | Perintah | Vonis | BM1 | BM2 | BM3 | BM4 |
|---|---|---|---|---|---|---|
| **RESMI** | `run_benchmark.ts --schema v2 --official --with-diagnosis-raster --out benchmark/out/sr51/official2` | **FAIL, exit 1** | PASS 100 % (4544/4544) | PASS (hlm 101/102; bab 17/17; lampiran 4/4; tabel 151/151; gambar 52/52) | **FAIL 6/102** (5,88 %) | **FAIL 0,7864** (min 0; 58 hlm < 0,95) |
| DIAGNOSIS raster (terpisah) | idem, `diagnosis_raster/` | FAIL | PASS 100 % | PASS (102/102 …) | **FAIL 99/102** (hlm 18, 19, 20) | PASS 0,9929 (min 0,6978; hlm 19, 20, 51 < 0,95) |

Langkah resmi semuanya OK: `load:OK ingest:OK figures:OK docx:OK pdf:OK lint:OK compare:OK report:OK`. Figur: mesin 15, raster 37, hilang 0, bukan-mesin 0. B-1 dan B-2 dari run 1 tertutup. DOCX resmi `0d4b25e1…`, DOCX raster `c64c9a45…`, durasi 77,7 s.

Inti temuan:

1. **Kurang 1 halaman = bm-fig-38**. Tinggi mesin 61,91 mm, sedangkan BM 101,36 mm (−39,5 mm). Akibatnya isi BM hlm 62 terserap ke hlm 61, sehingga hlm keluaran 62–101 = BM hlm 63–102 (offset +1). Isi badan semua halaman itu identik.
2. **BM3 6/102 artefak indeks + kaki halaman**. Kaki "LEMBAR n DARI 101" membuat setiap halaman berkaki beda teks bila jumlah halaman ≠ 102. Badan halaman yang benar-benar beda hanya 9 (hlm 9, 10, 12, 13, 18, 19, 20, 60, 61). Jadi BM3 tetap FAIL (93/102 < 100/102) walau jumlah halaman pulih. Batas BM3 (≤ 2 halaman beda) sudah habis oleh hlm 18 (F-033) + hlm 19–20 (K-2 selisih dikenal).
3. **BM4 gagal hampir seluruhnya karena pergeseran halaman**:
   - Rata-rata per bagian: hlm 1–61 = 0,931; hlm 62–102 = 0,5712.
   - SSIM selaras-offset (hlm keluaran p ≥ 62 dibanding BM p+1, metode `ssim_cal` CAL yang sama): rata-rata 101 hlm = **0,958** (≥ 0,95). Tanpa halaman figur mesin = 0,9835; hlm 62–101 = 0,9992.

## 1. Strategi uji

- Masukan:
  - `doc.v2.json` `79290e07…`
  - `template.v2.json` `882057c5…`
  - preset `datum-manual-000.preset.json` `a951b149…` (D-271)
- Runner SR-34 resmi tanpa tambalan, PDF via soffice.
- Pembanding: `bm_compare.py` terhadap BM.docx/BM.pdf NAS.
- Kriteria D-17 sesuai D-118/D-129, mencakup:
  - D-242 (tinggi diagram ke ukuran BM)
  - D-257/D-259 (K-2 = selisih dikenal, `image.rasterDpi` 150)
  - D-245 (lebar figur turunan)
  - D-265 (rasterisasi deterministik)
  - D-268 (axis)
  - D-224/D-139 (satu kelas lebar per jenis figur)
- Analisis tambahan dengan skrip baca-saja di scratchpad: `drift2.py` (peta awal halaman), `aligned_ssim.py` (SSIM selaras-offset memakai `scripts/parity/compare/ssim_cal.py`), dan pengukuran `wp:extent` DOCX. Semuanya tanpa mengubah kode atau input.
- Uji TDD: tidak ada kode uji baru (area docs-only). Run resmi adalah uji penerimaan.

## 2. Artefak

| Path | Isi |
|---|---|
| `benchmark/out/sr51/official2/` | run RESMI (DOCX, PDF, `compare/bm_report.json`, `figures/` 15 SVG/PNG, `run_summary.json`, `run_report.md`) |
| `benchmark/out/sr51/official2/diagnosis_raster/` | DIAGNOSIS raster |
| `benchmark/out/sr51/official2_console.log` | keluaran konsol (exit=1) |
| `benchmark/out/sr51/official/`, `diag_*`, `diag_runner_skeleton.patch` | run 1 (sejarah, §9) |

## 3. Inventaris kasus uji

| # | Kasus | Bukti | Status |
|---|---|---|---|
| 1 | Pra-run `npx tsx benchmark/extract/convert_v2.ts --check` ×3 | 3×: `SAME doc.v2.json sha256=79290e07…`, `SAME template.v2.json sha256=882057c5…`, `SAME datum-manual-000.preset.json sha256=a951b149…` | PASS |
| 2 | Run RESMI | konsol: `vonis FAIL \| BM1 PASS \| BM2 PASS \| BM3 FAIL \| BM4 FAIL \| exit 1` | FAIL |
| 3 | BM1 | `100 % (4544/4544)` | PASS |
| 4 | BM2 | `pages 101/102` (Δ 0,98 % ≤ 2 %), unsur lain sama | PASS |
| 5 | BM3 | `6/102 (5.8824 %)` | FAIL |
| 6 | BM4 | `rata-rata 0.7864, min 0` (hlm 102 hilang = 0) | FAIL |
| 7 | Raster BM3 | `pagesIdentical 99 of 102`, beda [18, 19, 20] | FAIL |
| 8 | Raster BM4 | `ssimMean 0.992873, pagesBelowThreshold [19,20,51]` | PASS |

## 4. Analisis (a): mengapa 101 halaman, bukan 102

Peta awal teks badan per halaman. Kepala/kaki dibuang, dan "LEMBAR n DARI m" diabaikan.

| Keluaran hlm | Awal sama dengan BM | Sebab | Pulih di |
|---|---|---|---|
| 9 / 10 | hlm 10 mulai di tengah BM hlm 10 (karakter 224/587); hlm 9 memuat butir 2–3 milik BM hlm 10 | **bm-fig-06** diagram mesin 100,01 mm, BM 125,71 mm (−25,7 mm) | hlm 11 (offset 0) |
| 12 / 13 | hlm 13 mulai di BM hlm 12 karakter 1748 (seksi 3.5 terdorong) | **bm-fig-08** 71,44 mm, BM 44,78 mm (+26,7 mm) | hlm 14 |
| 18 | teks beda | F-033 (glif `│` OpenSymbol) | — |
| 19 / 20 | baris SUMBER Gambar 4.1 terdorong ke hlm 20 | **bm-fig-11** raster 166 × 234,75 mm, BM 128 × 181,01 mm (+53,7 mm; K-2 selisih dikenal D-257) | hlm 21 |
| **60 / 61 → 62** | hlm 61 mulai di BM hlm 61 karakter 277; isi BM hlm 62 (tabel "KESALAHAN AKIBAT PERBAIKAN …") muat di hlm 61; hlm 62 = BM hlm 63 (BAB 11) | **bm-fig-38** sld mesin 61,91 mm, BM 101,36 mm (**−39,5 mm**) | tidak pulih: offset +1 sampai akhir (hlm 62–101 = BM 63–102, isi badan identik 40/40) |

Diagram lain hanya bergeser setempat dan diserap halaman berikutnya:

| Figur | Tinggi mesin vs BM |
|---|---|
| bm-fig-23 | +8,7 mm |
| bm-fig-24 | +6,8 mm |
| bm-fig-25 | +10,9 mm, lebar 166 vs 100 (D-224) |
| chart 17–21 | −1,6..+0,2 mm |
| lembar simbol | ±0,1 mm |

Kesimpulan: halaman hilang disebabkan oleh **spec bm-fig-38**. Spec itu dipadatkan IP-02/IP-42c ke 4 simpul (acuan 12) dan disetel tinggi 100 mm untuk aturan tinggi Garis A lama (catatan spec: "tinggi 109,537 -> 100,013 mm"). Setelah koreksi tinggi D-242, spec yang sama menjadi 61,9 mm. Lebar sld 166 kini lolos (B-2 tertutup), sehingga pemadatan 4 simpul tidak lagi diperlukan (F-052).

## 5. Analisis (b): dekomposisi BM4

| Cakupan (metode resmi, per indeks) | Hlm | SSIM rata-rata |
|---|---|---|
| semua | 102 | 0,7864 |
| tanpa 13 halaman figur mesin (9, 12, 35, 37, 38, 40, 42, 50, 51, 54, 55, 56, 60) | 89 | 0,7865 |
| hanya halaman figur mesin | 13 | 0,7857 |
| hlm 1–61 | 61 | 0,9310 (tanpa figur mesin 0,9704) |
| hlm 62–102 (offset +1, hlm 102 hilang = 0) | 41 | 0,5712 |
| **diagnosis selaras-offset** (101 hlm) | 101 | **0,9580** (tanpa figur mesin 0,9835; hlm 62–101 0,9992) |

10 halaman terendah (metode resmi): hlm 102 (0,0, halaman hilang), 95 (0,5061), 66 (0,5109), 68 (0,5123), 65 (0,5127), 71 (0,5145), 94 (0,5210), 75 (0,5239), 85 (0,5282), 90 (0,5300). Sebab semuanya **pergeseran aliran** (offset +1 dari bm-fig-38). Bila diselaraskan, hlm 62–101 bernilai 0,9992.

10 halaman terendah setelah diselaraskan (mutu nyata):

| Hlm | SSIM | Sebab |
|---|---|---|
| 61 | 0,574 | pergeseran aliran (bm-fig-38 lebih pendek; raster bm-fig-39 0,3993 bergeser) |
| 37 | 0,635 | **gaya figur mesin**: chart bm-fig-18 (SSIM figur 0,5295); ukuran sama (130,4 vs 132,0 mm), badan teks identik; panel H-03/H-06/H-07 digambar berbeda dari raster BM |
| 50 | 0,667 | gaya diagram (bm-fig-23 0,4482, bm-fig-24 0,4165) + tinggi +8,7/+6,8 mm |
| 13 | 0,670 | pergeseran aliran (bm-fig-08 +26,7 mm) |
| 9 | 0,688 | gaya diagram bm-fig-06 (0,4539): tata letak zona horizontal berarsir vs BM vertikal + tinggi −25,7 mm |
| 42 | 0,692 | gaya chart bm-fig-21 (0,5511) |
| 19 | 0,698 | bm-fig-11 166 vs 128 mm (K-2 selisih dikenal) |
| 35 | 0,701 | gaya chart bm-fig-17 (0,5003) |
| 40 | 0,709 | gaya chart bm-fig-20 (0,5908) |
| 20 | 0,754 | pergeseran aliran dari hlm 19 (K-2) |

Lembar simbol: hlm 54 = 0,959, hlm 55 = 0,939 (bm-fig-29 0,6618), hlm 56 = 0,9496. **Fon**: tidak ditemukan halaman ber-SSIM rendah yang disebabkan fon. F-033 (hlm 18) hanya mengubah urutan teks, SSIM 0,9964. Pengamatan visual 60 dpi pada hlm 9 (hipotesis, perlu cek resolusi penuh): label sisi "NAMA DAN NOMOR" dan "MASUKAN LULUS L6" tampak menimpa tepi kotak di diagram mesin bm-fig-06.

## 6. Pemetaan kegagalan ke baris pemilik

| ID | Kegagalan | Bukti | Pemilik | Remediasi |
|---|---|---|---|---|
| R2-1 | −1 halaman, BM3/BM4 runtuh setelah hlm 61 | §4; bm-fig-38 61,91 vs 101,36 mm; spec 4 simpul, 3 sisi, `width_mm` 128 | **spec bm-fig-38** (IP-42c/IP-02, generator IP-45) setelah FIX-B (D-242); rujuk F-052 | Kembalikan spec ke struktur acuan (12 simpul, sld 166 kini lolos) atau setel ulang tinggi terhadap aturan D-242. Target sekitar 101 mm. |
| R2-2 | Diagram mesin tinggi menyimpang: bm-fig-06 −25,7 mm, bm-fig-08 +26,7, bm-fig-23 +8,7, bm-fig-24 +6,8, bm-fig-25 +10,9 | §4; masing-masing 2 halaman beda badan (9/10, 12/13) | **FIX-B** (`engine/diagram/**`, D-242) + spec S94 IP-42c | Lanjutkan kalibrasi tinggi ke BM. bm-fig-06/08 menghabiskan 4 halaman BM3. |
| R2-3 | BM3 tidak dapat ≥ 100/102 selama K-2 selisih dikenal berlaku | hlm 18 (F-033) + 19/20 (bm-fig-11) = 3 halaman > batas 2 | **Keputusan controller/user** (D-257 vs D-17 BM3) | Kemungkinan jalan: putuskan bm-fig-11 ke 128 (parameter), terima BM3 99/102 sebagai pengecualian tercatat, atau perbaiki F-033. |
| R2-4 | Gaya chart/diagram mesin ≠ raster BM (SSIM figur 0,42–0,59) | §5 | SR-47 paritas / F-051 (chart), FIX-B (diagram) | Diagnosis saja: tidak menggagalkan BM4 bila offset pulih (selaras 0,958). |
| M-1 | Laporan per figur mode raster mencetak ukuran indeks BM (bm-fig-11 "128 x 181.011"), bukan DOCX (166 × 234,75) | `official2/diagnosis_raster/run_report.md:99` | SR-34 | Laporkan `wp:extent` nyata (sisa run 1, belum diperbaiki) |
| M-2 | 182 peringatan `[docx/tables] preset tidak dikenal untuk table: m000-tNN` (91 per run) untuk preset profil kolom yang sah | `src/lib/studio/engine/docx/tables/render.ts:513`; `official2_console.log` | pemilik `engine/docx/tables` (SR-16) | Kenali preset profil kolom (`render.table.columnProfiles`) sebelum memberi peringatan. Log bising, bukan galat render. |

## 7. Cara menjalankan

```
cd C:\Users\TRIAL\gsp-swarm-hq-v2.1
npx tsx benchmark/extract/convert_v2.ts --check     # x3 SAME
npx tsx benchmark/harness/run/run_benchmark.ts --schema v2 --official --with-diagnosis-raster --out benchmark/out/<run-id>
```
Analisis tambahan dengan python venv hermes, `-I`:
- `drift2.py <BM.pdf> <out.pdf>`: peta awal halaman
- `aligned_ssim.py <BM.pdf> <out.pdf> scripts/parity/compare`: SSIM selaras

Skrip ada di scratchpad sesi (tidak masuk repo).

## 8. Catatan CI, batasan, rekomendasi

- Durasi run resmi + raster 77,7 s. Tidak ada uji flaky.
- SSIM selaras-offset adalah diagnosis. Vonis resmi tetap memakai metode indeks `bm_compare.py`.
- Rekomendasi:
  1. Perbaiki R2-1 lebih dulu. Ini memulihkan 102 halaman, dan menurut diagnosis selaras BM4 kemungkinan ≥ 0,95.
  2. Putuskan R2-3. Tanpa keputusan itu, BM3 tidak bisa lulus.
  3. R2-2 mengurangi halaman beda badan dari 9 ke 5.

## 9. Run 1 (sejarah, 2026-10-23 01:00)

Run resmi pertama INCOMPLETE di ingest. Sebabnya B-1: runner tidak meneruskan kerangka, sehingga toc AUTO menolak `entries`. Diagnosis bertambal kemudian menemukan B-2 (bm-fig-38 DATUM-37 di 166 mm) dan K-1 (+351 mm tinggi diagram, 105 halaman). Ketiganya ditutup:
- B-1 oleh D-252
- B-2 oleh FIX-B
- K-1 oleh D-242 (keputusan user)

Artefak ada di `benchmark/out/sr51/official/`, `diag_skeleton/`, `diag_fallback/`.
