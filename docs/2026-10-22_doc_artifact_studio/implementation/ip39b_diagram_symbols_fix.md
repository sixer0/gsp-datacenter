---
task_id: IP-39b
task_slug: doc_artifact_studio
row: IP-39b (loop perbaikan siklus 1, S84 #2/#3/#4/#6/#7 + Low diagram/simbol; tambahan lingkup FIX-5 tinggi benchmark)
date: 2026-10-23
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/gateway_check/03_review_figures.md (D-124)
status: needs-review
---

# Implementation Report: IP-39b mesin diagram + simbol

Skill: backend-execution (tanpa I/O; modul murni, tidak ada jalur catch baru), receiving-code-review (temuan diverifikasi ulang di kode sebelum diubah).

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Klaim path `IP-39b` di `file_claims.md` | complete | 5 baris |
| 2 | Garis dasar sebelum ubah (dump 170 keluaran, paritas Python S30 8 spec, vitest, validate_figures) | complete | 8/8 identik, 361 lulus, LOLOS |
| 3 | S84 #4 karakter tidak sah XML | complete | satu helper `core/xml.ts` dipakai diagram + simbol |
| 4 | S84 #3 komentar tanpa "--" | complete | `xmlCommentText` pada `generatorComment` |
| 5 | S84 #6 deteksi Mermaid berbasis posisi | complete | menantang D-50, aturan + contoh di bawah |
| 6 | S84 #7 satu modul geometri | complete | `core/geometry.ts`; layout-a/b/c jadi pengekspor ulang |
| 7 | S84 #2 DATUM-25 dari SVG nyata | complete | deviasi paritas disengaja; `dg_layered_good` kini 422 |
| 8 | Low #12 (`pyValue` mati), #14 (basis cek), #15 (`LABEL_MM`) | complete | |
| 9 | Tambahan lingkup FIX-5: tinggi figur benchmark | needs-review | bukan bug skala; keputusan controller |

## Changes Made
| File (di bawah `src/lib/studio/engine/`) | Type | Description |
|---|---|---|
| `diagram/core/xml.ts` | add | `XML_INVALID_CHARS` (C0 selain TAB/LF/CR, U+FFFE/U+FFFF, surrogate tunggal), `stripXmlInvalid`, `xmlEscapeText`, `xmlCommentText` |
| `diagram/core/colour.ts` | add | `svgColourValues(svg)` (fill/stroke/style di luar `<defs>` + definisi yang dirujuk, kertas dibuang) dan `diagramColourValues` model emisi lengkap (dipindah dari estimate.ts) |
| `diagram/core/geometry.ts` | add | modul geometri tunggal: `GARIS_A_TOKENS` (diturunkan dari `DIAGRAM_TOKENS`, bukan literal), `latticeOf`, `nodeSize`, `sheetHeight`, `textNeedMm`, `pyTruthy`, `nodeGet`, `pyScalarStr`, `layoutDefect` |
| `diagram/core/svg.ts` | modify | `escText` buang karakter tidak sah; `generatorComment` lewat `xmlCommentText` |
| `diagram/core/spec.ts` | modify | `MERMAID_FENCE`, `MERMAID_HEADER_LINE`, `mermaidTellOf`; periksa teks mentah + tiap nilai string spek |
| `diagram/core/tokens.ts` | modify | `estTextPt(text, sizePt)` = satu definisi; `estTextMm` memanggilnya |
| `diagram/core/sheet.ts` | modify | `nodeSize`/`height()` mendelegasikan ke geometry; `applyLayout` menyalin data samping seperti `build/place.ts` |
| `diagram/core/estimate.ts` | modify | memakai model warna dari colour.ts |
| `diagram/core/pyfmt.ts` | modify | hapus `pyValue`/`numValue` (0 rujukan) |
| `diagram/core/index.ts` | modify | ekspor aditif (colour, geometry, xml, Mermaid, `estTextPt`) |
| `diagram/build/svg.ts` | modify | DATUM-25 setelah `toSvg()` dari `svgColourValues`; JSDoc basis cek (#14) |
| `diagram/layout-a/geometry.ts`, `layout-b/geometry.ts`, `layout-c/geometry.ts` | modify | salinan dihapus, ekspor ulang dari `core/geometry`; helper khusus tetap (`pyFloorDiv`, `pyInt`, `pyStrCmp`, `classGet`, `graphMinWidth`) |
| `diagram/layout-a/flow.ts`, `layered.ts` | modify | urutan argumen `sheetHeight(lat, boxes)` |
| `symbols/primitives.ts`, `symbols/index.ts` | modify | `xmlEscape` lewat `xmlEscapeText`; `LABEL_PT` -> `LABEL_MM` + komentar satuan benar (keluaran sama) |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Unit figur | `npx vitest run tests/unit/studio/figures` | 6 berkas: 355 lulus, 7 gagal | 5 gagal milik IP-39b = semua karena `dg_layered_good` kini DATUM-25 (disengaja, uji S73 tidak diubah, permintaan ke FIX-3); 1 `chart-params` accentPoint (IP-39a), 1 `k08.json` (FIX-3 fixture) |
| Paritas diagram | `npx tsx scripts/parity/run/run_parity.ts ... --out tests/parity/out/ip39b/diagram --only "diagram/**" --formats svg,png` | PASS 10, NODE_ERROR 3, exit 1 | `dg_layered_good` = DATUM-25 disengaja; `garis_a/good_layered`, `garis_a/good_sld` = F-S78-2 (deteksi `symbol` harness, FIX-3) |
| Paritas simbol | `... --out tests/parity/out/ip39b/symbol --only "symbol/**" --formats svg,png` | PASS 45/45, exit 0 | |
| Byte-identik Python (D-106 8 spec) | Python HS `build_svg` vs dump TS, buang `data-mark/series/index` + komentar generator | 7/8 identik | `good_layered` = DATUM-25 disengaja (butir 1). Fixture paritas kini: 10/11 identik + laporan identik (`dg_layered_good` sama) |
| Determinisme | dump 166 keluaran diagram/simbol dua proses | 0 beda | plus 2 build per spec dalam proses |
| Probe | `npx tsx <scratch>/ip39b/probe.ts` | 102 PASS, 0 FAIL | model warna = SVG (27 spec), tinggi estimate = build, karakter kendali, komentar, Mermaid 6 negatif + 9 positif |
| validate_figures | `npx tsx benchmark/manual000/figures/tools/validate_figures.ts` | GAGAL 8 (exit 1) | 8 = `PARAM_ALIAS accentPoint/accentGroup` chart (IP-39a #1); bagian diagram "build engine tanpa FAIL 11/11" LOLOS. Garis dasar sebelum perubahan: LOLOS |
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | exit 0, 0 galat | run sebelumnya 3 galat `mid` di engine/chart (IP-39a sedang berjalan), bukan area ini |
| Lint | `npx eslint src/lib/studio/engine/diagram src/lib/studio/engine/symbols` | exit 0 | |

## Verification
- #2 DATUM-25: `svgColourValues` = `report.colourValues` di 27 spec dan = model `estimate` di 27 spec. `dg_layered_good` 6 warna -> `DATUM-25: 6 nilai warna ... maksimum 5`. bm-fig-23 5 (dulu 4), bm-fig-25 3 (dulu 2), keduanya tetap <= 5.
- #3: `xmlCommentText("Biaya---per unit")` = `Biaya- - -per unit`; "--", "-", "akhir-" tidak menyisakan "--"/akhiran "-".
- #4: label/judul/sumber dengan U+0001/U+0003/U+FFFE/U+FFFF/U+D800 -> SVG tanpa karakter itu; TAB/LF/CR, entitas, dan pasangan surrogate (emoji) tetap.
- #6: lihat aturan baru di bawah; semua contoh negatif lolos, semua positif 422 DATUM-31.
- #7: 4 salinan `pyRound`/`snap`/`estTextMm`/`nodeSize`, 3 `latticeOf`/`sheetHeight`, dan literal 13,5/7,6/6,6/128 kini satu definisi; keluaran byte-identik dengan garis dasar di semua spec (selisih hanya akibat butir 1 dan perubahan fixture paralel FIX-3, yang identik dengan Python fixture baru).

## Aturan DATUM-31 baru (menantang D-50)
Mermaid terdeteksi bila (a) pagar ```` ```mermaid ```` atau `~~~mermaid` di mana pun, atau (b) sebuah BARIS adalah kepala diagram Mermaid: `^[ \t]*(graph|flowchart)[ \t]+(TD|TB|BT|LR|RL)[ \t]*(;.*)?$` atau `sequenceDiagram` / `stateDiagram(-v2)?` sendirian. Tanpa beda huruf (niat D-50 tetap). Diperiksa pada teks mentah dan setiap nilai string spek hasil parse.
- Positif (ditolak): `flowchart TD\n A-->B`; `  graph LR`; `graph TD; A-->B`; `sequenceDiagram`; `stateDiagram-v2\r\n`; judul berisi ```` ```mermaid ````; label `"graph TD\nA-->B"`; `GRAPH td`.
- Negatif (lolos, dulu 422): `Alur data paragraph TD-3.`; `Telegraph LR pada panel.`; `graph TD-3 revisi.`; `Diagram sequenceDiagram lama.`; `Photograph TD dan LR.`.

## Kelas paritas
- `dg_layered_good` / `garis_a/good_layered` / S30 `good_layered`: DEVIASI-SENGAJA DATUM-25 (Python build 5 warna terhitung, Node 422 karena 6 warna tercetak). Laporan `colourValues/nColour` juga berbeda dari Python untuk spec ber-`shadowed`/label ink900 (mis. S30 `layered_num` py 3 -> ts 4), SVG tetap byte-identik.
- Lainnya: tetap byte-identik (escape hanya berbeda untuk karakter tidak sah, yang di Python menghasilkan XML rusak).

## Tinggi benchmark (tambahan lingkup FIX-5)
Diagnosis: BUKAN bug skala mesin. Root SVG mm = viewBox (1 unit = 1 mm) dan `services/render/figures.ts` memakai mm asli; geometri mesin = Python HS Garis A (byte-identik, di atas). BM.docx digambar pembangkit lain: diagram berupa ilustrasi berikon (mis. bm-fig-23, aset `image12__simbol14.png` 200 dpi) dan lembar simbol dari RL Garis B `datum_symbols.py --sheet` (isi-pas, 6 kolom, nama Indonesia; sumber blok menyebut perintah itu), sedangkan mesin memporting lembar HS `sheet_svg` yang selalu satu halaman blok 247 mm (E-18, D-42).

| Figur | Keluarga | BM w x h mm | Mesin w x h mm | Rasio | Eksperimen "kompak" h mm (scratch, bukan kode) |
|---|---|---|---|---|---|
| bm-fig-06 | layered | 166 x 125.7 | 166 x 195.3 | 1.55 | 100.0 |
| bm-fig-08 | graph | 166 x 44.8 | 166 x 100.0 | 2.23 | 81.0 |
| bm-fig-23 | topology | 166 x 110.3 | 166 x 242.9 | 2.20 | 119.1 |
| bm-fig-24 | swimlane | 166 x 79.0 | 166 x 161.9 | 2.05 | 85.7 |
| bm-fig-25 | rack | 100 x 112.9 | 128 x 238.1 | 2.11 | 128.6 |
| bm-fig-38 | sld | 166 x 101.4 | 128 x 109.5 | 1.08 | 66.7 |
| bm-fig-27/29/30/31 | lembar iec/isa/sec/mil | 166 x 100.7/69.9/69.9/44.8 | 166 x 247 (1 halaman tiap dialek) | 2.5-5.5 | isi berakhir ~118/84/84/50 mm, sisa kosong sampai SUMBER di 243 |

Sebab utama tinggi diagram: kuirk Garis A yang dipertahankan demi paritas (D-41): tinggi simpul `units * LATTICE_Y * 2` (28,6 mm untuk label satu baris) dan jarak tingkat `snap(BASELINE_PT * 2)` dengan pt dibaca sebagai mm (28,6 mm alih-alih 9,5 mm). Eksperimen kompak (keduanya dikoreksi) mendekatkan 3/6 figur (rasio 0,80-1,14) tetapi tidak semua (fig-08 1,81; fig-38 0,66), jadi BM bukan keluaran Garis A terkoreksi. Selisih spec S94: fig-25 width 128 vs BM 100 (100 tidak sah), fig-38 width 128 vs BM 166. Tidak ada perubahan mesin untuk ini (keputusan arsitektur/paritas).

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| 5 uji S73 + paritas `dg_layered_good` gagal | 0 (disengaja) | fixture mencetak 6 warna; aturan benar | permintaan ke FIX-3 di `file_requests.md` | ya untuk hijau penuh S73/paritas DG |
| validate_figures GAGAL 8 | 0 | PARAM_ALIAS aksen chart (IP-39a) | di luar area | tidak untuk IP-39b |
| Tinggi figur benchmark | 1 diagnosis | pembangkit acuan BM berbeda dari Garis A | menunggu keputusan controller | ya untuk pemenggalan S98 |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 7 | DATUM-25 dari SVG nyata menyimpang dari Garis A | diterapkan sesuai D-124; kelas paritas dicatat; aturan tidak dilonggarkan |
| 7 | `estimate` sequence tanpa garis kehidupan dan tinggi salah (152,4 vs build 209,55 mm), cacat lama | `Sheet.applyLayout` menyalin data samping seperti `place.ts`; kini tinggi estimate = build di 27 spec |
| 6 | Penyatuan `str()`/truthiness layout ke semantik Python (`pyfmt.pyStr`, `pyTruthy`) | beda hanya untuk masukan patologis (label `null` -> "None" seperti Python; float < 1e-4 sebagai lajur); 0 beda keluaran di 27 spec |
| 6 | `latticeOf` layout-a kini memvalidasi kisi/lebar (dulu tidak) | lembar tidak sah -> `BY_CONSTRUCTION_FAILED` bernama, sama dengan layout-b/c |
| 5 | Aturan Mermaid menggantikan substring D-50 | perlu ratifikasi controller (menantang D-50) |
| 9 | Pilihan tinggi benchmark | (A) terima geometri Garis A, catat sebagai selisih dikenal S98; (B) port lembar simbol isi-pas RL sebagai opsi `fit` aditif (default HS tetap, paritas SY aman) + pemilik `services/render/figures.ts` meneruskannya; (C) koreksi kuirk BASELINE_PT/tinggi simpul (memutus paritas D-41/D-106, hasil parsial); (D) S94 merestrukturisasi spec + perbaiki width fig-25/38. Usul: B + D, A untuk diagram |

## Next Steps
- Controller: ratifikasi aturan DATUM-31 (D-50), kelas paritas DATUM-25, dan pilih opsi tinggi benchmark.
- FIX-3: ubah `dg_layered_good` (permintaan tercatat), lalu ulang paritas DG dan uji S73.
- Review recommended: `senior-code-reviewer` atas `diagram/core/{colour,geometry,xml,spec}.ts` dan `build/svg.ts`.
