# coder-execution FIX-B: B-1 runner kerangka, B-2 lebar rel sld, K-1 tinggi diagram (D-242), D-245 grid diagram turunan

Status: complete (2026-10-23). Skill: diagnosing-bugs, dry-run-verify-fix. Keputusan: D-241 (B-1/B-2), D-242 (K-1), D-245 (bagian diagram). Klaim: 4 baris FIX-B di `file_claims.md`. Permintaan: 3 baris FIX-B di `file_requests.md`.

## Berkas

| Berkas | Ubah | Isi |
|---|---|---|
| `benchmark/harness/run/lib/inputs.ts` | modify | `LoadedInputs.skeleton` (SkeletonInput, implicit false) + `templateInfo.skeletonSha256` dari `loadResolvedTemplateV2File`; loader v2 tanpa skeleton = galat |
| `benchmark/harness/run/lib/pipeline.ts` | modify | ingest menerima `skeleton` dari masukan (B-1) |
| `benchmark/harness/run/selftest_ingest_v2.ts` | add | uji regresi: ingest dryRun nyata doc.v2 + template.v2 dengan kerangka berkas (toc MIXED) -> valid |
| `benchmark/harness/run/README.md` | modify | baris perintah selftest baru |
| `src/lib/studio/engine/diagram/layout-c/sld.ts` | modify | B-2: `sldRailWidth` (rel = W bila W tepat di kisi, selain itu `snapFloor(W)`), baris cabang dibagi di rentang rel; K-1 langkah 2 baseline |
| `src/lib/studio/engine/diagram/core/geometry.ts` | modify | K-1: `textUnitsHeightMm` (unit x 1 baseline), `baselineStepMm` (k baseline, pt ke mm); `nodeSize` memakainya |
| `layout-a/{layered,flow,geometry}.ts`, `layout-b/{sequence,swimlane,geometry}.ts`, `layout-c/{graph,geometry}.ts`, `core/estimate.ts` | modify | K-1: jarak tingkat/baris/pesan/lajur dalam baseline; pitch baris graph = simpul tertinggi + 2 baseline |
| `src/lib/studio/engine/diagram/core/grid.ts` | add | D-245: `DiagramGrid`, `DIAGRAM_GRID_A4`, `resolveDiagramGrid` (grid tidak sah = BY_CONSTRUCTION_FAILED), `widthLabel` |
| `core/{spec,sheet,estimate,index}.ts`, `build/{svg,route,index}.ts` | modify | D-245: `P1-width_mm` dari grid; DATUM-33 dari `grid.maxHeightMm`; `Sheet.colMm` = kisi X turunan (snap, detur, zona); opsi `buildDiagramSvg(spec, { release, grid? })`, `estimate(spec, layout, { grid? })` |

## B-1 (runner tidak meneruskan kerangka)

- Akar: `pipeline.ts` memanggil `ingestDocument` tanpa `skeleton`, sehingga `services/ingest/v2.ts` memakai kerangka implisit (toc AUTO) dan menolak entri daftar isi (`SLOT_INPUT_NOT_ACCEPTED`). Ingest TIDAK diubah.
- Merah dulu: salinan selftest tanpa skeleton -> `false !== true`, 2/3; dengan perbaikan 3/3.
- Catatan SR-12 (di luar area, tidak diubah): jalur templat di memori tidak mengisi `slotParams`.

## B-2 (bm-fig-38 sld pada 166 mm gagal DATUM-37)

- Akar: rel bus = `L.W` = 166; `snapToLattice` membulatkan ke kisi 128/12 -> 16 x 10,667 = 170,667 > 166; rel dikecualikan dari clamp (Python sama, F-041/F-052). Bukan lebar spec 128 (spec v2 membuang width, lebar dari kelas templat).
- Aturan umum: rentang rel = W bila `snap(W) <= W` (128 = 12 kisi, keluaran Python bit-identik), selain itu kisi terbesar yang muat (166 -> 160 mm); cabang dibagi di rentang rel. DATUM-37 tidak diubah.
- Bukti: probe `benchmark/out/fixb/probe_sld.ts` 128 OK, 166 OK. Paritas sebelum K-1 (`run_parity --only diagram/**`, `benchmark/out/fixb/parity_b2`): dg_sld_good PASS; SVG Node byte-identik dengan keluaran S78/IP-39b/FIX-3 (`cmp` IDENTICAL x3). Run `benchmark/out/fixb/official`: ingest OK, figur mesin 15, hilang 0; BM1 PASS 100 % (4544/4544), BM2 FAIL halaman 105/102, BM3 FAIL 4/105, BM4 FAIL 0,6274.

## K-1 (D-242): tinggi diagram ke ukuran BM

Aturan: tinggi simpul = unit teks (3 + sub + tag) x 1 baseline (Python x 2); jarak tingkat/baris = `pt2mm(BASELINE_PT * k)` (Python membaca pt sebagai mm: 27 -> 28,575). Rack (`u * LATTICE_Y * 2`, satuan U perangkat, bukan unit teks) tidak diubah. Lebar, kisi, tepi lembar, dan aturan DATUM tetap.

| Figur | Keluarga | BM (mm) | Sebelum h | Sesudah h | Selisih ke BM sebelum -> sesudah |
|---|---|---|---|---|---|
| bm-fig-06 | layered | 166 x 125,706 | 195,262 | 100,013 | +69,6 -> -25,7 |
| bm-fig-08 | graph | 166 x 44,780 | 100,013 | 71,437 | +55,2 -> +26,7 |
| bm-fig-23 | topology | 166 x 110,329 | 242,887 | 119,062 | +132,6 -> +8,7 |
| bm-fig-24 | swimlane | 166 x 78,951 | 161,925 | 85,725 | +83,0 -> +6,8 |
| bm-fig-25 | rack | 100 x 112,938 (v2: 166) | 123,825 | 123,825 | +10,9 -> +10,9 |
| bm-fig-38 | sld | 166 x 101,358 | 100,013 | 61,912 | -1,3 -> -39,4 |
| Total | | | | | +349,9 -> -12,1 |

Fixture paritas diagram (SVG Node, `parity_b2` vs `parity_k1`); paritas byte Python SENGAJA diputus (D-242):

| Fixture | h sebelum | h sesudah |
|---|---|---|
| dg_flow | 223,837 | 109,537 |
| dg_flow_wrapped | 109,537 | 61,912 |
| dg_graph | 100,012 | 71,437 |
| dg_graph_hops | 176,212 | 119,062 |
| dg_sequence | 209,550 | 90,487 |
| dg_sld_good | 109,537 | 71,437 |
| dg_stack | 223,837 | 109,537 |
| dg_swimlane | 138,112 | 76,200 |
| dg_topology | 176,212 | 90,487 |
| dg_rack | sama | sama |
| dg_layered_good | NODE_ERROR DATUM-25 (D-137, pra-ada) | sama |

Run resmi `benchmark/out/fixb/official2`: vonis FAIL, exit 1; ingest OK; figur mesin 15, raster 37, hilang 0. BM1 PASS 100 % (4544/4544); BM2 PASS (pages 101/102; chapters 17/17; appendices 4/4; tables 151/151; figures 52/52); BM3 FAIL 6/102 (5,88 %); BM4 FAIL rata-rata 0,7864. Diagnosis BM3: 101 vs 102 halaman membuat kaki "LEMBAR n DARI ..." berbeda di hampir setiap halaman (hlm 5-8 SSIM 0,998-0,9999 tetapi teks beda); hlm 19-20 tetap bm-fig-11 166 vs 128 (K-2, FIX-FIG).

Uji yang kini gagal karena D-242 (tidak diubah; area SR-42/SR-47): `tests/unit/studio/figures/diagram-bad-cases.test.ts` 4 uji (kasus "DATUM-33 gambar lebih tinggi dari blok teks 247 mm" kini < 247 mm, plus 3 uji yang mengiterasi semua kasus). Vitest figures + engine-core sebelum K-1: 645/645; sesudah (ditambah renderers): 775 lulus / 6 gagal = 4 di atas + 2 di luar area (`renderers/docx-determinism` jangkar fixture SR-41; `renderers/asset-bytes` jumlah aset fixture).

## D-245 (grid diagram turunan, bagian diagram)

- `P1-width_mm` membaca `grid.allowedWidthsMm`; DATUM-33 membaca `grid.maxHeightMm`; kisi X = `grid.latticeXMm` (bawaan lebar terkecil / 12; selisih < 1e-3 dari 128/12 dipakai `LATTICE_X` persis). Tanpa grid = A4 (pesan sama: "harus salah satu dari [128, 166] (P1: 128 atau 166, jangan di antaranya)").
- A4 identik: paritas `parity_d245` vs `parity_k1` SAME 10/10 SVG; SVG bm-fig-06/08/23/24/25/38 di `official3` byte-identik dengan `official2`. Run official3 sendiri gagal di chart bm-fig-17..21 ("Cannot read properties of undefined (reading 'widthsMm')"): engine/chart sedang diubah FIX-FIG, di luar area.
- Probe `benchmark/out/fixb/probe_paper.ts` (`resolveParams` + `page.size`), keluaran `probe_paper.txt`: A5 grid [66, 104], maks 160, kisi 5,5; Letter [133,9, 171,9], maks 229,4, kisi 11,1583. Diagram digambar pada lebar turunan (mis. 104 x 100,013 dan 171,9 x 85,725 mm), DATUM-28 dijalankan, ukuran huruf min 5,90 pt (lantai 5,5). Spec yang tidak muat lebar sempit (mis. bm-fig-08 pada 128 atau 66) gagal bernama DATUM-37 (sudah begitu pada A4 128 sebelum perubahan). Lebar non-A4 tanpa grid ditolak `P1-width_mm` (tidak diskalakan diam-diam).
- Antarmuka untuk FIX-FIG/render tercatat di `file_requests.md` (compose meneruskan lebar turunan; pemanggil build meneruskan `grid`).

## Verifikasi (2026-10-23)

- `npx tsx benchmark/harness/run/selftest_verdict.ts` -> 24/24 lulus; `selftest_ingest_v2.ts` -> 3/3 lulus.
- `npx tsx benchmark/extract/convert_v2.ts --check` x3 -> SAME 3/3 tiap run (doc.v2 9c77439b, template.v2 882057c5, preset d181efb1).
- `npx eslint src/lib/studio/engine/diagram benchmark/harness/run` -> exit 0.
- `npx tsc --noEmit -p tsconfig.json` -> 0 galat di area FIX-B. Galat repo pada run akhir, semua di berkas baris lain yang sedang diubah: `tests/integration/studio/studio-db.integration.test.ts` (24, SR-49), `engine/symbols/index.ts` (2, FIX-FIG), `services/ingest/v2.ts` (3) dan `services/submit/pipeline.ts` (1) (FIX-S/FIX-C).

## Persistent Issues

| Isu | Percobaan | Akar | Status | Memblokir? |
|---|---|---|---|---|
| BM3/BM4 FAIL setelah K-1 | 1 (aturan umum, tanpa penyetelan per figur) | 101 vs 102 halaman (kaki halaman total) + selisih per figur -39..+27 mm; bm-fig-11 K-2 | terbuka, data untuk controller | ya untuk D-17 |
| tsc repo bukan 0 | - | berkas baris lain yang sedang diubah | di luar area | tidak untuk FIX-B |

Review direkomendasikan: `engine/diagram/**` (aturan baseline D-242, grid D-245) dan `benchmark/harness/run/lib/{inputs,pipeline}.ts`.
