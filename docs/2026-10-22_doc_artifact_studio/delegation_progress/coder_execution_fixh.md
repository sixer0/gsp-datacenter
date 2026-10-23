---
task_slug: doc_artifact_studio
row: FIX-H
date: 2026-10-23
agent: coder-execution
source_plan: decisions D-295 (P1/P2/P3), D-296 (R5), D-298 (diagram D-242), D-299 (PD-1), D-300/D-301 (spine)
status: needs-review
---

# FIX-H: harness paritas (loop perbaikan siklus 3)

Skill: receiving-code-review, dry-run-verify-fix. Klaim: `file_claims.md` dua baris FIX-H. Semua penulisan
lewat salinan scratchpad lalu `cp` ke `.<berkas>.fixhtmp` + `mv` (0 sisa `.fixhtmp`). Status `needs-review`
HANYA karena P3 (akar di `scripts/parity/run/lib/render.ts`, di luar area); P1, P2, R5, D-298, D-299, D-300 selesai.

## 1. Perubahan

| Berkas | Jenis | Uraian |
|---|---|---|
| `scripts/parity/compare/compare_docx.py` | ubah | P1: `REF_ARTIFACT` simetris: caption `(TABEL\|GAMBAR) (n\|n.m\|A.n)` + baris aparatus `^SUMBER(\s*:)?\s+\S` (label mesin D-145/D-221 diikuti teks, huruf besar, kedua sisi). Kepala kolom "SUMBER"/"Sumber" berdiri sendiri dan kalimat isi "Sumber data ..." tidak dikecualikan |
| `scripts/parity/compare/compare.py` | ubah | P2: CompareReport + `failedChecks {total, failed, failedGate, failedDiagnosis, level CLEAN/DIFF, ids}`; vonis tidak berubah. Konteks diteruskan ke pembanding PNG |
| `scripts/parity/run/lib/summary.ts`, `run_parity.ts` | ubah | P2: `verdictLabel` = `DIAGNOSIS(n)`; `summary.json` `counts.diagnosisByLevel` + `fixtures[].failedChecks`; kunci vonis tetap. Konteks PNG chart `f007 {refSvg,nodeSvg}`, PNG diagram `d242 {nodeSvg}`, SVG diagram `nodeLint`; catatan NODE_ERROR memuat pesan galat |
| `scripts/parity/compare/compare_png.py` | ubah | R5/D-296: PNG CA gagal -> bukti F-007 (SVG CA lulus + root acuan px + acuan dengan font-size x4/3 dirasterkan ulang lewat `reference/fig/raster.py` lulus ambang CA) -> DIAGNOSIS `verdictReason "F-007 px/pt acuan"`; selain itu FAIL tetap. D-298: PNG DG = gerbang integritas raster Node (`d242.rasterSize`, `d242.rasterNotBlank`), SSIM lawan Python = diagnosis |
| `scripts/parity/compare/compare_dg_d242.py` | baru | D-298: kelas vonis diagram D-242 (logika setara `sr47_d242.py`): `d242.structure`, `d242.engine`, `d242.datum` (checks_run = Python + lint artefak Node tanpa FAIL), `d242.horizontal` (pusat-x/lebar simpul, lebar akar), `d242.vertical` (tinggi simpul = Python x rasio famili K-1 1/2, graph D-288 1/3, rack 1; baris + urutan terjaga; margin kelipatan baseline; di dalam lembar) |
| `scripts/parity/compare/compare_svg.py` | ubah | D-300: grup `data-axis` bertanda `data-spine="1"` tanpa teks tick = bingkai/garis dasar, bukan sumbu (setara H6 matplotlib); D-298: bila `d242Class`, `d.rootSize`/`geometry` = diagnosis dan cek `d242.*` dipasang |
| `scripts/parity/compare/svgnorm.py` | ubah | medan `spine` pada grup sumbu (penanda `data-spine`) |
| `scripts/parity/compare/compare_pdf.py`, `thresholds.py` | ubah | D-299: PD `gate: False` + `verdictReason` "acuan Garis A tanpa lembar kendali/TOC/pembatas bagian"; kontrol mesin-sama WAJIB `--threshold gate=true`. Ambang baru: PNG CA `f007PxPtNormalize`/`f007Scale`, SVG DG `d242Class`/`d242TolL`/`d242NodeHeightRatio`, PNG DG `d242Class`/`d242RasterTolPx` 4 (= 1 px CSS pada 300 dpi) |
| `scripts/parity/compare/selftest_compare.py` | ubah | +7 kasus (lihat 2); 2 kasus DG lama diberi `d242Class=false` (menguji aturan F-050/F-S78-1 terisolasi pada SVG sintetis tanpa `data-node`); `f056_pd` rep2 + `gate=true` (D-299) |

Tidak disentuh: `lib/render.ts`, fixture, manifest, `src/**`, `prisma/**`.

## 2. Bukti (segar, 2026-10-23)

- `selftest_compare.py`: `selftest_compare: 35/35 lulus`, exit 0 (dari 28/28). Kasus baru: `fixh_p1_source_label_and_appendix_caption_excluded_symmetrically`, `fixh_p2_diagnosis_carries_failed_check_count_and_level`, `fixh_d300_tickless_spines_are_frame_on_both_sides`, `fixh_d242_diagram_class_passes_rule_explained_height_and_fails_otherwise`, `fixh_d242_png_raster_integrity_gate_and_python_raster_diagnosis`, `fixh_r5_ca_png_px_pt_is_diagnosis_other_differences_fail`, `fixh_d299_pd_vs_garis_a_is_diagnosis_same_engine_control_gates`.
- Mutasi (kasus menangkap): regex P1 lama -> P1 gagal; SUMBER `re.I` tanpa syarat teks -> gagal; tanpa alternatif `A.n` -> gagal; `failedChecks` hilang -> P2 gagal; `f007PxPtNormalize` false / bukti SVG dilewati / `applies` selalu true -> R5 gagal; compare_svg pra-D-300 -> D-300 gagal; PD `gate` true -> D-299 gagal; `d242Class` false, cek tinggi/baris/lint/horizontal dimatikan -> D-242 gagal (masing-masing 34/35 atau 31/32).
- py_compile 12/12 (pyc ke scratchpad); ruff F/E9: 1 temuan pra-ada `svgnorm.py:172` F841 (dicatat SR-40, tidak disentuh); eslint `run_parity.ts` + `lib/summary.ts` exit 0; `tsc --noEmit` exit 0.
- DOCX (`--only "doc/**" --formats docx`, `tests/parity/out/fixh/{before,after}`): sebelum `{"DIAGNOSIS":8}` label `docx=DIAGNOSIS`; sesudah `{"DIAGNOSIS":8}` label `DIAGNOSIS(14)` (tables `DIAGNOSIS(13)`), `diagnosisByLevel {DIFF: 8}`. Pengecualian artefak acuan ref/node: tables 44/21 -> 44/44, serah 22/11 -> 26/26, terbit 15/8 -> 20/20, memo 3/2 -> 4/4 (simetris di 8/8). `textOrderReferenced` tables 61,24 -> 67,23 %, serah 45,73 -> 48,32 %, memo 58,49 -> 58,82 %, terbit 36,51 -> 35,96 % (unit SUMBER yang tadinya cocok keluar dari kedua sisi; penyebut mengecil). textOrder dan vonis tidak berubah. Kontrol Node-Node: `DIAGNOSIS`, `failedChecks: 0` (2/2).
- Chart (`--only "chart/**" --formats svg,png`, `fixh/chart_final`): `{"DIAGNOSIS":46}` exit 0 (SR-48: DIAGNOSIS 40 + FAIL 6). P-01/P-02/P-11/W-02 PNG FAIL -> DIAGNOSIS `F-007 px/pt acuan` (SSIM asli 0,9723/0,976/0,9732/0,9701 -> ternormalkan 0,9999/0,9966/0,9999/0,996; diff 0,0/0,18/0,012/0,209 %). H-06 dan S-03 SVG FAIL -> PASS karena SVG Node berubah (FIX-C2; sha Node berbeda dari SR-48, pembanding pra-FIX-H juga memberi PASS pada SVG yang sama). Kode lain: 0 berubah.
- Spine D-300: banding ulang 46 pasangan SVG chart pembanding lama lawan baru = 46/46 SAME; `fixc2/s03_spine` S-03 `FAIL [c.axisCount, c.axisOrientation] (Node 2, acuan 0)` -> `PASS (0, 0)`; di `chart_final` S-03 dengan 2 `data-spine="1"` = PASS, garis dasar Node tetap true.
- Diagram (`--only "diagram/**"`, `fixh/diagram`): `{"PASS":9,"NODE_ERROR":1,"FAIL":1}` (SR-47: FAIL 9). dg_rack `svg=FAIL` gerbang `d242.datum` artifactLintFail `["DATUM-32"]` (pra-ada, IP-81); dg_layered_good NODE_ERROR catatan `BY_CONSTRUCTION_FAILED: diagram build failed: DATUM-25: 6 nilai warna ... maksimum 5` (disengaja D-137). dHeight L = -24/-10/-9/-15/-25/-8/-24/-13/-18 = tabel SR-47, maxDx 0,0.
- Simbol (`--only "symbol/**"`): `{"PASS":45}` exit 0 (= SR-47).
- PDF (`--only "doc/**" --formats docx,pdf`, `fixh/pdf`): `{"DIAGNOSIS":8}`, PD `DIAGNOSIS(4|5)` `verdictReason "D-299 PD-1: acuan Garis A tanpa lembar kendali/TOC/pembatas bagian (kelas D-120)"`. Kontrol mesin-sama (`fixh/pdf_controls`: DOCX Node -> PDF lewat `soffice_pdf.py` jalur acuan lawan PDF Node, `--threshold gate=true`): 8/8 PASS, `failedChecks 0`.
- Fixture: `validate_fixtures.ts` `HASIL: LOLOS (0 kegagalan)` exit 0; `check_doc_fixtures` `22/22 lolos` exit 0 (fixture tidak diubah).

## 3. Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| P3 ASSET_INFO_MISSING / FILE_MISSING_ON_DISK (v2 serah/terbit) | 1 (analisis) | Bukan fixture: `AssetInputV2` hanya `{assetRef}` atau `{mime, dataBase64}` (`contract/types/v2/common.ts:29`, `schema/v2/common.schema.ts:337-342`, oneOf tertutup) dan fixture sudah membawa `mime` + `dataBase64`. `renderDocumentV2` memanggil `composeV2` tanpa `assets` info (`scripts/parity/run/lib/render.ts:805`) sehingga `snapshot.ts:205` memperingatkan; AssetRef hasil compose tanpa `dataBase64`/path sehingga pramuat layanan membaca `assets/<sha>.{png,jpg}` dari disk (hipotesis kuat dari urutan log; cadangan `extendContext.assetBytes` `render.ts:624-628` lalu berhasil) | Perbaikan di `lib/render.ts` (di luar area FIX-H): kumpulkan `{mime}` per sha di `resolveAsset` (`render.ts:774-781`) dan teruskan `assets` ke `composeV2`; pertimbangkan `dataBase64`/`extraSha256` agar pramuat tidak menyentuh disk | Tidak (media tertanam benar, D-295) |
| ruff F841 `svgnorm.py:172` | 0 | pra-ada (SR-40) | dibiarkan | Tidak |

## 4. Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| P1 | Kepala kolom isi "Sumber" (caps -> "SUMBER") tidak boleh ikut dikecualikan | label wajib diikuti teks dan huruf besar; kalimat isi berhuruf campuran tetap dinilai (selftest) |
| P2 | Bentuk vonis | kelas vonis tetap `DIAGNOSIS` (agregat/exit tidak berubah); jumlah dan tingkat di medan + label tampilan `DIAGNOSIS(n)` |
| R5 | Normalisasi lawan penanda | normalisasi terbukti: acuan dirasterkan ulang dengan font-size x4/3 memakai perasteran acuan yang sama; DIAGNOSIS hanya bila SVG CA lulus dan acuan ternormalkan lulus ambang CA |
| D-300 | "tanpa teks" saja terlalu lebar (17 pasangan chart berubah hitungan sumbu, 12 menjadi FAIL palsu, karena label kategori Node berada di luar grup `data-axis`) | dipersempit ke penanda eksplisit `data-spine="1"` (D-301) tanpa teks tick; 46/46 tak berubah |
| D-298 | Aturan tinggi "terjelaskan" otomatis | rasio tinggi simpul per famili + baris terjaga + margin kelipatan baseline + di dalam lembar; famili tanpa aturan = FAIL. Rasio graph 1/3 dikalibrasi dari fixture (6 L -> 2 L, 4,08 -> 1,36 L) sesuai D-288; dicatat sebagai butir review |
| D-298 | PNG diagram | SSIM lawan Python = diagnosis; gerbang integritas raster Node (toleransi 4 px = 1 px CSS; Node membulatkan px CSS ke bawah, mis. 1293,7 -> 1291) |
| D-298 | dg_rack | FAIL dipertahankan (lint artefak DATUM-32 pra-ada, IP-81), sesuai kriteria (b) SR-47 |
| D-299 | Kontrol mesin-sama | memakai `--threshold gate=true` (preseden D-120 DX); skrip kontrol SR-50 (`tests/parity/out/sr50/tools/run_controls.sh`) belum memakai bendera itu (bukan area FIX-H) |

## 5. Next Steps

- Pemilik `scripts/parity/run/lib/render.ts`: perbaikan P3 (lihat Persistent Issues).
- Review direkomendasikan: `compare_dg_d242.py` (tabel rasio famili), bukti F-007 `compare_png.py`, penyempitan spine `compare_svg.py`, P1 regex `compare_docx.py`.
