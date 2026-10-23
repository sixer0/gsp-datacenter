---
task_slug: doc_artifact_studio
row: SR-40
date: 2026-10-23
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/05_structural_sections_blueprint.md (baris SR-40, :781)
status: complete
---

# SR-40: sisa FIX-3, bagian pembanding (F-050, F-S78-1, F-051, F-056)

Area: `scripts/parity/compare/**` (klaim `file_claims.md`, prefiks SR-40). Skill: receiving-code-review, dry-run-verify-fix.
Masukan: D-117, D-118 (R01/R02), D-122, `test/05_parity_chart.md` §4 dan §8 (H1-H12, R1-R4), `findings_register.md:58,59,64`.
Catatan FIX-3 lama `delegation_progress/coder_execution_fix3.md` TIDAK ADA di disk (FIX-3 dihentikan, D-133). Keadaan awal
pembanding diperiksa langsung: sebagian besar aturan sudah ada di kode peninggalan FIX-3 (selftest 14/14 lulus sebelum perubahan).

## 1. Keadaan per aturan (sesudah SR-40)

| Aturan | Implementasi (berkas:baris) | Kasus selftest (`selftest_compare.py`) |
|---|---|---|
| F-050 / R01 tanda | gerbang `a.markCount`/`b.markColors` hanya bila sumber klasifikasi sama; heuristik rect diterapkan ke Node DG (atribut `data-*` diabaikan); lintas sumber = diagnosis, `markGateCrossSource=true` memulihkan (`compare_svg.py:516-525`, `thresholds.py:39`) | `dg_mark_count_same_source_after_ignoring_node_marks` (:79), `dg_real_mark_difference_still_fails` (:92), `cb1_cross_source_mark_gates_are_diagnosis` (:187), BARU `f050_cross_source_gate_restored_by_threshold` (:261) |
| F-S78-1 hitung warna | `b.colorMax` = `n_colour` laporan mesin (DATUM-25), PAPER/putih dibuang dari hitungan SVG; tanpa laporan = diagnosis (`compare_svg.py:556-567`, `thresholds.py:72`) | `dg_color_max_uses_engine_report_rule` (:102), BARU `fs78_1_color_max_engine_over_limit_fails_and_paper_excluded` (:278) |
| F-051 klasifikasi tanda matplotlib | H1/H11 latar = patch kertas (bukan "patch pertama"); H2 `use` di line2d = point; H3 koleksi (LineCollection, FillBetween via defs, Poly/QuadMesh, ContourSet, image); H4 axhline/axvline = rujukan; H6 colorbar + sumbu tanpa tick dibuang. BARU SR-40: >= 5 garis selebar sumbu sejajar = tanda peristiwa `line` (`EVENT_MIN`, `compare_svg.py:38,186-193`); sel `table_N` = `cell` apa pun isinya, kepala baris/kolom dibuang (`_drop_table_headers` :99, `axes_boxes` melewati sel tabel); `_is_refline` diganti `_refline_orient` (:86) | `mpl_classification_use_markers_collections_reflines_paper` (:160), BARU `f051_h3_contour_image_polycollection_quadmesh` (:297), `f051_h6_colorbar_and_tickless_axes_ignored` (:311), `f051_h4_event_lines_are_marks_not_reflines` (:337), `f051_h11_table_cells_counted_headers_dropped` (:351), `f051_h12_boxplot_decomposition_cross_source_is_diagnosis` (:396) |
| F-051 zero-baseline | H5: hanya bar/column/area; kelompok bersentuhan (tumpukan/divergen) cukup satu menyentuh; garis `data-midpoint`/`data-zero` Node dan garis rujukan acuan dihitung. BARU SR-40: acuan tak dapat dinilai (None) -> hanya bar/column Node yang digerbang (area biola/ridgeline mengambang), `compare_svg.py:45,598-607` | `zero_baseline_stacked_floating_midpoint` (:200), BARU `f051_h5_unassessed_ref_area_floats_but_column_must_touch` (:363), `f051_h5_ref_refline_is_baseline_and_interval_not_judged` (:379) |
| F-051 angka label + aksen | H7 `label_key` menyetarakan desimal `,`/`.`, ribuan, minus U+2212, spasi `%` (`compare_svg.py:443-479`); H8 aksen per subjek D-108 (`accent_subjects` :237) | `label_number_normalisation` (:228), `accent_counted_per_subject` (:244) |
| F-056 fon tertanam | `embeddedFontsGate=false` DX dan PD (`thresholds.py:114,123`; `compare_docx.py:487-489`, `compare_pdf.py:41-46`) | `dx_is_diagnosis_and_caps_folded` (:438), `pd_embedded_fonts_threshold_is_diagnosis` (:484), BARU `f056_pd_embedded_fonts_mismatch_is_diagnosis` (:491; PDF nyata pymupdf: Type1 base-14 lawan Type0 tertanam, plus pemulihan gerbang `embeddedFontsGate=true`) |

## 2. Perubahan

| Berkas | Jenis | Uraian |
|---|---|---|
| `scripts/parity/compare/compare_svg.py` | ubah | tanda peristiwa (EVENT_MIN), sel tabel + buang kepala, sel tabel tidak memperluas kotak sumbu, gerbang nol saat acuan None, hapus `_is_refline` (tak terpakai) |
| `scripts/parity/compare/selftest_compare.py` | ubah | +10 kasus (awalan ID temuan); hapus impor `os` tak terpakai (ruff F401) |
| `delegation_progress/file_claims.md` | tambah 2 baris | klaim SR-40 |

Tulis atomik: suntingan di salinan scratchpad, lalu `cp` ke `.<berkas>.sr40tmp` + `mv` di folder tujuan (0 sisa `.sr40tmp`).

## 3. Bukti verifikasi (segar, 2026-10-23)

Interpreter: `C:\Users\TRIAL\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe` (sama dengan `scripts/parity/run/lib/python.ts:14`).

| Cek | Perintah | Hasil |
|---|---|---|
| py_compile | `python -I -B -c "py_compile.compile(f, cfile=<scratchpad>, doraise=True)"` untuk 11 berkas `scripts/parity/compare/*.py` | `py_compile OK 11` (pyc ke scratchpad, tanpa `__pycache__` di repo) |
| selftest | `python -I -B scripts/parity/compare/selftest_compare.py` | `selftest_compare: 24/24 lulus`, exit 0 (sebelum SR-40: 14/14) |
| lint | `python -I -m ruff check --isolated --select F,E9 --line-length 140 compare_svg.py selftest_compare.py` | `All checks passed!` (proyek tidak punya konfigurasi lint Python) |
| mutasi (kasus benar-benar menangkap) | selftest dijalankan pada salinan scratchpad dengan `compare_svg.py` pra-SR-40 | 21/24: gagal tepat 3 kasus baru (event lines, table cells, h5 unassessed) |
| mutasi 2 | salinan: `embeddedFontsGate` PD = True, `n_colour` diabaikan, `same_src = True` | 18/24: gagal `dg_color_max...`, `cb1_cross_source...`, `fs78_1...`, `f051_h12...`, `pd_embedded...threshold`, `f056_pd...` |
| regresi data nyata | sapuan CB1 45 kode beracuan `tests/parity/out/s79/main` (SVG Node garis dasar pra-IP-39), sebelum lawan sesudah | hanya 4 baris berubah: P-15 tanda acuan 0 -> 15 (= Node 15); W-08 0 -> 161 (Node 160; selisih 1 = garis aksen); S-04, S-05 `c.zeroBaseline` gagal -> lulus (biola/ridgeline). PASS 9 -> 9; tidak ada kode lain berubah |

## 4. Sisa dan keputusan yang dibutuhkan (bukan cacat SR-40)

| # | Butir | Bukti | Pemilik/keputusan |
|---|---|---|---|
| K1 | Tafsir kriteria (f) KT-02 (R3 `test/05_parity_chart.md:313`): setelah normalisasi angka, 32/45 kode S79 gagal HANYA `f.labels`; sisa selisih = nilai tick pilihan (K-03 -20/-40 lawan -25/-50), legenda literal acuan (A1), KUNCI/satuan Node. Batas "label data" tidak bisa ditetapkan sepihak: acuan K-09 menulis nama kategori sebagai `text_N` di axes, Node hanya memberi `data-label="value"` pada nilai | sapuan S79 di atas | Controller: putuskan cakupan (f); implementasi pembanding menyusul setelah keputusan (tidak dibuat sakelar spekulatif) |
| K2 | H9 PNG CA SSIM lawan N1 (`thresholds.py:92`) tidak termasuk daftar SR-40; ambang tidak disentuh | `test/05_parity_chart.md` R5 | Controller (R5) |
| K3 | Gagal non-(f) tersisa = mesin/acuan, bukan pembanding: K-07, P-10 `e.fontMinPt` (E1/E2 -> IP-39); S-03 acuan tanpa sumbu lawan Node sumbu x; W-07 sumbu y Gantt (E4) | sapuan S79 | IP-39a / SR-48 menilai ulang |
| K4 | Hitungan tanda lintas sumber tetap diagnosis (H12 boxplot, P-09 pita bullet tanpa `data-mark`, P-12 garis konteks, H-03 `imshow` = 1 image lawan 48 sel) | sapuan S79 | tidak perlu tindakan (`markGateCrossSource=false`) |

Review direkomendasikan (lingkup: `compare_svg.py` mpl_marks/zero baseline + 10 kasus selftest) sebelum SR-46..SR-50 memakai harness.

## 5. Lanjutan D-240: kriteria (f) = gerbang label isi (putusan K1 controller)

Implementasi (`compare_svg.py`): `spec_names` (:496) mengambil nama kategori/seri dari `data` spec (categories/rows/cols, series/groups `.name`, points/items/nodes/tiles `.label`, points `.sub`, label simpul/edge G-04); `load_chart_spec` (:523) membaca konteks `chartSpec` (objek atau path JSON fixture); `content_labels` (:590):
- GERBANG `f.labels`: (1) setiap nama data harus ada di SEMUA teks Node (sama persis ternormalisasi, casefold, atau termuat di gabungan teks berurutan = label yang dibungkus); (2) setiap label nilai acuan (teks angka di badan axes, bukan tick/legenda) harus ada di teks Node setelah normalisasi angka (tanda `%` diabaikan). Nilai Node tambahan TIDAK menggerbang.
- DIAGNOSIS: `f.ticks` (nilai tick pilihan skala), `f.refLiterals` (legenda/anotasi literal acuan, A1), `f.nodeExtra` (KUNCI, satuan, label nilai tambahan).
- Tanpa `chartSpec`: nama kategori = label tick non-angka acuan (cadangan); seri tidak digerbang.
- Detail memuat `absentInRef` (nama yang hilang di Node dan juga tidak tampak di acuan; judul sumbu dikecualikan). Ambang CB1 `labelNamesRequireRef` (bawaan `false` = D-240 harfiah; `thresholds.py:56`) menjadikan nama `absentInRef` diagnosis. Dibuat karena data S79 menunjukkan butir ini (lihat di bawah); keputusan tetap milik controller.
- `compare.py` docstring/`--context` menyebut `chartSpec`.

Kasus selftest (`selftest_compare.py`): `d240_missing_category_fails_wrapped_category_passes` (:437; kategori hilang -> FAIL, kategori terbungkus lulus, seri hilang -> FAIL + `absentInRef`, ambang opsional, cadangan tanpa spec), `d240_tick_difference_is_diagnosis` (:468), `d240_ref_legend_literal_and_node_apparatus_are_diagnosis` (:479), `d240_missing_data_value_fails` (:497; nilai hilang -> FAIL, nilai tambahan Node = diagnosis).

Bukti segar:
- `selftest_compare.py`: `28/28 lulus`, exit 0. py_compile OK 11. ruff F/E9 pada berkas yang disunting: bersih (temuan pra-ada `svgnorm.py:172` F841, berkas tidak disentuh).
- Mutasi: M1 pembanding pra-D-240 -> 24/28 (4 kasus d240 gagal); M2 nama tidak digerbang -> 27/28; M3 nilai tidak digerbang -> 26/28; M4 tick menggerbang -> 26/28; M5 tanpa pencocokan baris terbungkus -> 27/28.
- Sapuan S79 45 kode (`tests/parity/out/s79/main`, konteks `chartSpec` = `tests/parity/fixtures/chart/<kode>.json`): PASS 9 -> 35. Berubah FAIL -> PASS (26): G-01, G-04, H-03, H-04, H-05, K-01, K-02, K-03, K-04, K-10, K-12, P-03..P-09, P-13, S-02, S-04, S-05, S-06, W-01, W-04, W-05; sebab: selisih yang tersisa hanya tick/legenda literal/aparatus (kini diagnosis). PASS -> FAIL: 0.
- Sisa FAIL dengan spec (10): `f.labels` H-06 (nilai kontur -42..-84 lawan Node -47..-79 = E6 mesin, nyata; nama grid x2/y4.. ditipiskan di kedua sisi), K-09 (`sub` grup "Proyek ..." tidak ditulis Node maupun acuan), P-12 (bulan ditipiskan Feb/Mar.. di kedua sisi), S-01/S-03/W-08 (nama seri/grup tunggal tidak ditulis di kedua sisi), W-03 (nama seri tunggal hanya ada di judul sumbu acuan); non-(f): K-07, P-10 `e.fontMinPt` (E1/E2), S-03, W-07 sumbu.
- Dengan `labelNamesRequireRef=true`: PASS 40/45; sisa = H-06 (nilai kontur, mesin) + K-07, P-10, S-03, W-07.
- Tanpa `chartSpec` (keadaan runner sekarang): PASS 39/45; P-08 GAGAL palsu karena cadangan memungut tick literal acuan "H1-2026/H2-2026" (A1) sebagai kategori.

Tindak lanjut:
- R-1 (pemilik `scripts/parity/run/**` = SR-41): `figureContext` (`run_parity.ts:234`) perlu menambah `chartSpec: <path fixture>` untuk kind chart. Tanpa itu, gerbang memakai cadangan.
- R-2 (controller): putuskan `labelNamesRequireRef` (nama data yang tidak ditampilkan acuan maupun Node: seri tunggal, grup `sub`, tick kategori yang ditipiskan).

## 6. D-246: `labelNamesRequireRef = true` sebagai bawaan

- `thresholds.py:56` bawaan `True`: nama data hanya digerbang bila acuan juga menampilkannya (tick/badan/legenda; judul sumbu dikecualikan). Nilai data tetap selalu digerbang. `false` = D-240 harfiah. Docstring `content_labels` dan pembacaan ambang (`compare_svg.py`, bawaan `True`) disesuaikan.
- Selftest `d240_missing_category_fails_wrapped_category_passes` diubah agar menguji kedua sisi pada bawaan: kategori tampak di acuan dan hilang di Node -> FAIL (`namesGated == ["Penarikan kabel"]`, vonis FAIL); nama seri tidak tampak di acuan maupun Node -> `f.labels` lulus; `labelNamesRequireRef=false` -> FAIL dengan `absentInRef`.
- Bukti: `selftest_compare: 28/28 lulus`, exit 0; py_compile OK 11; ruff F/E9 bersih. Mutasi: bawaan dikembalikan ke false -> 27/28; semua nama dianggap absen di acuan -> 27/28.
- Sapuan S79 45 kode dengan konteks `chartSpec` = path fixture (setara `figureContext` runner, yang kini meneruskan `chartSpec` untuk kind chart, `run_parity.ts:237`; runner TIDAK dijalankan ujung-ke-ujung di baris ini): PASS 40/45, sisa H-06 (nilai kontur, E6 mesin), K-07 dan P-10 (`e.fontMinPt`), S-03 dan W-07 (sumbu). Tanpa `chartSpec`: 39/45 (+P-08 gagal palsu karena cadangan tick literal A1).
