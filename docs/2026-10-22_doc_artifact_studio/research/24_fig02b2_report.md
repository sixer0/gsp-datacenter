---
task_id: FIG-02b2
task_slug: doc_artifact_studio
row: FIG-02b2
date: 2026-11-02
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/research/18_figure_layout_audit.md (§6 P1-11, P1-12, P1-14, P2-15; §5 J, K)
status: needs-review
---

# 24 — FIG-02b2: persilangan, pemisahan jalur, kapasitas yang membantu, caption berbungkus, G-04

## 1. Ringkasan

- Pola aktivasi FIG-02b1 dipertahankan dan dipersempit per jenis cacat:
  - render apa adanya, lint (`fit/lint.ts`);
  - render ulang dengan perbaikan hanya pada cacat yang terukur di render pertama (`DiagramFitState.defects` = `lint.counts`);
  - hasil dipakai hanya bila skor lint lebih kecil.
- Pembantu baru (semuanya hanya saat fit):
  - **P1-11** pengurutan simpul dalam lapis (barycenter dua arah + transpose, lalu tukar-pasangan) dinilai dengan rute nyata;
  - **P1-12** pemisahan jalur: segmen dalam yang berimpit digeser ke jalurnya sendiri; detur mulai dari stub; lintasan tengah tidak lagi jatuh di garis tepi simpul;
  - rute rak di sisi kanan badan rak; kaki aparatus turun di bawah rute yang lebih rendah dari simpul terbawah (sld "ke beban");
  - **P1-14** penolakan kapasitas graph/swimlane dicoba ulang dengan tata letak adaptif; penolakan yang tersisa membawa saran aksi konkret;
  - **P2-15** caption/SUMBER diagram dibungkus saat melewati lebar lembar;
  - swimlane: bungkus label simpul FIG-02b1 dipakai ulang; G-04: bungkus 3..6 baris saat fit grafik aktif.
- Hasil Chromium, 55 render diagram yang sudah lolos di FIG-02b1 (out1 -> out2):
  - render bercacat 38 -> 13;
  - persilangan 84 -> 23;
  - segmen berimpit 294 -> 11;
  - garis menembus teks 10 -> 1;
  - teks keluar lembar 9 -> 0;
  - label lebih lebar dari simpul 2 -> 0;
  - pasangan teks bertumpuk 1 -> 1.
- Penolakan 26 -> 17. Sembilan render yang dulu ditolak kini dirender (6 graph, 3 swimlane). Sisanya menolak dengan kode sama dan saran aksi.
- Byte-identik:
  - 15/15 render diagram harness yang lint-bersih;
  - 776/776 render grafik (termasuk 24 keluarga G);
  - 16/22 render fixture paritas DG yang bisa dirakit.
- Fixture DG yang berubah: 3 fixture (6 render). Semua bercacat terukur 1 -> 0; multiset teks, `nHops`, `checksRun` sama; tinggi sld berubah 71,44 -> 80,96 mm (§5).
- Status `needs-review`: deviasi paritas 3 fixture (termasuk perubahan tinggi sld) dan keputusan kebijakan kapasitas (§10).

## 2. Arsitektur yang dibangun

Alur `buildDiagramSvgWith` (`engine/diagram/build/svg.ts`):

1. `buildOnce` merakit spec apa adanya.
   - Bila melempar DATUM-37 untuk graph/swimlane: `capacityRetry` (`build/capacity.ts`).
   - Penolakan lain dilempar ulang lewat `withAction`: kelas, kode, `checkId`, `pointer` sama; pesan ditambah `; saran: ...`.
2. `autoFitDiagram` (`build/autofit.ts`) melint render pertama. Skor 0: dikembalikan apa adanya (jaminan byte-identik).
3. Ada cacat: tangga kandidat FIG-02b1 (penuh -> tanpa tumbuh -> tanpa nomor). Bila lint mengukur cacat rute (`edgeCross`, `edgeCollinear`, `lineThroughText`, `edgeThroughNode`), tiap kandidat dicoba dua kali:
   1. "tanpa rute ulang" (= perilaku FIG-02b1, dicoba lebih dulu sehingga menang bila seri);
   2. "rute ulang" (pembantu FIG-02b2 aktif).

   Skor terkecil dipakai. Tangga turun ke kandidat berikutnya sampai satu varian "rute ulang" berhasil dirakit; contoh: layered many24long, kandidat penuh gagal DATUM-33. `AUTO_FIT` kini mencantumkan skor tiap varian (`dicoba: ...`).
4. Pembantu FIG-02b2 berpagar jenis cacat (`fit/state.ts diagramFitRoute(...)`):
   - **Urutan simpul** (`build/order.ts`, `fit/order.ts`) untuk layered/topology/graph.
     - Aktif bila lint mengukur persilangan, atau bila agen tidak memberi `col`/`row` dan ada cacat rute terukur.
     - Lapis = simpul dengan tepi atas sama (tingkat agen / baris graph, tetap).
     - Urutan agen = urutan awal. Lalu barycenter dua arah 8 putaran + transpose lokal, lalu tukar-pasangan dalam lapis (maks 400 evaluasi).
     - Setiap langkah dinilai dengan rute nyata (`routePlaced` + `edgeConflicts`, skor 2 x silang + berimpit) dan dipakai hanya bila skor turun tegas.
     - x tetap di kisi: lapis dikemas ulang dari tepi kirinya dengan urutan celah asal. Lebar seragam = tukar slot.
     - REPORT `NODE_ORDER` menyebut urutan baru per tingkat. Saran: "pakai urutan simpul per tingkat di atas, atau pecah menjadi 2 diagram"; graph: "pakai urutan kolom baru di atas, atau hapus class.col agar mesin menata ulang".
   - **Pemisahan jalur** (`build/route.ts`, `build/lanesroute.ts`, `fit/lanes.ts`), aktif bila lint mengukur berimpit atau silang:
     - slot jangkar per sisi diurutkan menurut pusat simpul di ujung lain;
     - lintasan tengah `midy`/`midx` yang dikunci kisi tetapi jatuh di luar rentang dua stub (sering tepat di garis tepi simpul) diganti titik tengah tanpa kunci kisi (`between`);
     - detur mulai dari ujung stub, sehingga konektor keluar tegak lurus sisi simpul dan tidak menyusuri garis tepi;
     - setelah detur, `nudgeRoutes`: segmen dalam berimpit (sumbu +/- 0,15 mm, tumpang > 1 mm) dikelompokkan dan digeser ke jalur sendiri. Varian posisi: berpusat (jarak maks 2,38 mm, lalu 0,6 mm), lalu satu sisi (semua di atas/kiri atau di bawah/kanan garis asal; 1,2 dan 0,6 mm). Urutan jalur dari `laneOrder` (biaya berpasangan, tukar-tetangga), kebalikannya, atau urutan asal; dipilih menurut konflik terukur (2 x silang + berimpit). Pergeseran yang menembus simpul atau membalik segmen ujung ditolak;
     - REPORT `EDGE_LANES`.
   - **Rute rak** (`routeRackSide`), aktif bila lint mengukur garis menembus teks: konektor keluar dari sisi kanan perangkat dan berjalan tegak pada jalur sendiri di kanan rak (rentang terpendek paling dalam, tanpa silang). REPORT `RACK_ROUTE`.
   - **Batas bawah rute** (`Sheet.routeBottom`, `core/sheet.ts`), aktif bila lint mengukur garis menembus teks (keluarga selain graph/sequence): rute yang turun di bawah simpul terbawah mendorong kaki aparatus ke bawah.
   - **Swimlane** (`layout-b/swimlane.ts`): saat fit, lebar simpul dibatasi bagian adil lajur (kelipatan kisi, >= 3 kisi), label dibungkus (`fit/text planNodeText`), tinggi tumbuh.
5. **Kapasitas** (`build/capacity.ts`, `layout-c/graphcap.ts`, `layout-b/swimcap.ts`), hanya setelah render pertama ditolak DATUM-37:
   - graph dengan kolom bersambung: lebar simpul 3 kisi lalu 2 kisi, celah 1 kisi, label dibungkus, tinggi tumbuh. Tidak muat: DATUM-37 "maks N kolom pada W mm; bagi menjadi dua gambar atau pakai layered". Kolom bercelah (kasus buruk `col: 0, 20`) tetap ditolak seperti sebelumnya, dengan saran "rapatkan class.col";
   - swimlane: mode "time" (kolom waktu bersama = lapis longest-path dari tepi, dibungkus per pita k kolom, satu baris per pita per lajur), lalu "pack" (bungkus dalam lajur). Masing-masing dengan dan tanpa tumbuh tinggi; skor lint terkecil dipakai;
   - REPORT `AUTO_FIT` ("render pertama ditolak ...; dicoba: ...") + `CAPACITY_ADAPT` (dengan saran batas konkret) + sisa `GEOM_*`.
6. **Caption/SUMBER** (`build/footwrap.ts`): saat fit dan bila baris melewati W - 0,5 mm (tabel glif `textfit`), dibungkus sampai 4 baris tanpa memotong kata.
   - Kaki tumbuh 1 kisi per baris tambahan. REPORT `CAPTION_WRAP`.
   - Cek DATUM-29/30 kini memeriksa setiap baris caption.
   - Jalur non-fit memancarkan string yang sama seperti sebelumnya.
7. **G-04** (`chart/family-g/flowchart.ts fitLines`): saat fit grafik aktif dan tidak ada belahan 1-2 baris yang muat, label dibungkus 3..6 baris pada ukuran terbesar yang muat. Tanpa fit: perilaku lama.

## 3. Perubahan per berkas

| Berkas | Jenis | Isi |
|---|---|---|
| `engine/diagram/fit/state.ts` | ubah | `defects`, `capacity`, `capMode`, `noRoute`; `diagramFitRoute`, `diagramFitDefects`, `diagramFitCapacity`, `diagramFitCapMode`, `diagramFitQuiet`. |
| `engine/diagram/fit/order.ts` | baru | `bilayerCrossings`, `totalCrossings`, `orderLayers` (barycenter + transpose, hanya bila turun tegas), `longestPathLayers`. |
| `engine/diagram/fit/lanes.ts` | baru | `laneCost`, `laneOrder`, `lanePositions`, `overlapClusters`. |
| `engine/diagram/build/order.ts` | baru | `reorderPlaced` (urutan simpul dinilai rute nyata, REPORT `NODE_ORDER`). |
| `engine/diagram/build/lanesroute.ts` | baru | `simplifyRoute`, `nudgeRoutes` (pemisahan jalur pasca-detur). |
| `engine/diagram/build/route.ts` | ubah | Rute dua tahap, slot jangkar terurut, `between`, detur dari stub, `nudgeRoutes`, `routeRackSide`. Semua berpagar `diagramFitRoute`; jalur non-fit memanggil `detour` dengan masukan yang sama seperti sebelumnya. |
| `engine/diagram/build/capacity.ts` | baru | `isCapacityReject`, `capacityAction`, `withAction`, `capacityRetry`. |
| `engine/diagram/build/footwrap.ts` | baru | `footLines` (bungkus caption/SUMBER). |
| `engine/diagram/build/autofit.ts` | ubah | `defects` ke status fit; varian rute; tangga lanjut sampai varian rute berhasil; `AUTO_FIT` mencantumkan skor tiap varian. |
| `engine/diagram/build/svg.ts` | ubah | Panggil `reorderPlaced`; `routeBottom`; caption/SUMBER berbungkus; cek DATUM-29/30 per baris; pembungkus kapasitas/saran. |
| `engine/diagram/core/sheet.ts` | ubah | Medan opsional `routeBottom` di `height()` (tidak diisi di luar fit). |
| `engine/diagram/layout-b/swimlane.ts` | ubah | Bungkus label + tinggi tumbuh saat fit; cabang kapasitas. |
| `engine/diagram/layout-b/swimcap.ts` | baru | `layoutSwimCapacity` (mode "time"/"pack"). |
| `engine/diagram/layout-c/graph.ts` | ubah | Cabang kapasitas (kolom bersambung) sebelum jalur lama. |
| `engine/diagram/layout-c/graphcap.ts` | baru | `layoutGraphCapacity`, `graphMaxCols`, `contiguousCols`. |
| `engine/chart/family-g/flowchart.ts` | ubah | `fitLines` diekspor; bungkus 3..6 baris saat fit grafik. |
| `engine/chart/core/apparatus.ts` | tidak diubah | Caption/SUMBER grafik sudah dibungkus sejak FIG-02a (`apparatusLines`, aktif hanya saat fit dan teks melewati kanvas). Harness: 0 teks grafik keluar kanvas di out1 maupun out2, jadi tidak ada cacat terukur untuk diperbaiki. |
| `tests/unit/studio/figures/fig02b2-order-lanes.test.ts` | baru | 10 uji fungsi murni. |
| `tests/unit/studio/figures/fig02b2-layout.test.ts` | baru | 10 uji integrasi. |
| `tests/unit/studio/figures/fig02b2-flowchart.test.ts` | baru | 4 uji G-04. |

Tidak disentuh: `chart/core/textfit.ts`, `chart/core/geometry.ts` (hanya diimpor), kontrak, ParamDef (pin 136), `decisions.md`, `file_claims.md`, `scripts/studio/mcp/**`, `tests/unit/studio/mcp/**`, `src/app/api/studio/**`.

## 4. Hasil sebelum/sesudah (Chromium, harness FIG-01)

Perintah (keluaran nyata, `C:\Users\TRIAL\AppData\Local\Temp\fig_audit\`):

```
OUT=.../fig02b/out2 npx tsx fig02b/gen_sub.ts       -> total 1009 ok 840 rejected 85 na 84
OUT=.../fig02b/out2 node measure.mjs                -> measured 840
node fig02b/table.mjs fig02b/out1 fig02b/out2
```

`out1` = keadaan sesudah FIG-02b1. Mesin pembanding paritas = salinan pohon kerja sebelum baris ini (`fig02b/base2`, `diff -r` identik saat dibuat).

Diagram per kelas kasus (out1 -> out2). n = render lolos, tlk = ditolak, cct = render bercacat.

| Kasus | n | tlk | cct | tumpuk | keluar | garis | lebar | silang | berimpit |
|---|---|---|---|---|---|---|---|---|---|
| normal | 9 -> 9 | 0 -> 0 | 1 -> 0 | 0 -> 0 | 0 -> 0 | 1 -> 0 | 0 -> 0 | 0 -> 0 | 0 -> 0 |
| longLabel | 7 -> 8 | 2 -> 1 | 2 -> 1 | 0 -> 0 | 0 -> 0 | 2 -> 1 | 2 -> 0 | 0 -> 0 | 0 -> 2 |
| longTitle | 9 -> 9 | 0 -> 0 | 9 -> 0 | 0 -> 0 | 9 -> 0 | 1 -> 0 | 0 -> 0 | 0 -> 0 | 0 -> 0 |
| many15 | 4 -> 6 | 5 -> 3 | 4 -> 3 | 0 -> 0 | 0 -> 0 | 1 -> 0 | 0 -> 0 | 7 -> 33 | 22 -> 9 |
| many15long | 4 -> 6 | 5 -> 3 | 4 -> 3 | 0 -> 0 | 0 -> 0 | 1 -> 0 | 0 -> 0 | 7 -> 33 | 25 -> 9 |
| many24 | 4 -> 5 | 5 -> 4 | 4 -> 4 | 0 -> 0 | 0 -> 0 | 1 -> 0 | 0 -> 0 | 28 -> 15 | 79 -> 8 |
| many24long | 4 -> 5 | 5 -> 4 | 4 -> 4 | 0 -> 2 | 0 -> 0 | 1 -> 0 | 0 -> 0 | 30 -> 15 | 76 -> 7 |
| fit16 | 8 -> 8 | 1 -> 1 | 6 -> 3 | 0 -> 0 | 0 -> 0 | 1 -> 0 | 0 -> 0 | 9 -> 3 | 59 -> 4 |
| fit16long | 6 -> 8 | 3 -> 1 | 4 -> 3 | 1 -> 3 | 0 -> 0 | 1 -> 0 | 0 -> 0 | 3 -> 3 | 33 -> 4 |
| **Total** | **55 -> 64** | **26 -> 17** | **38 -> 21** | **1 -> 5** | **9 -> 0** | **10 -> 1** | **2 -> 0** | **84 -> 102** | **294 -> 43** |

Total di atas mencampur dua himpunan. Dipisah:

| Himpunan (Chromium) | n | cct | tumpuk | keluar | garis | lebar | silang | berimpit |
|---|---|---|---|---|---|---|---|---|
| 55 render yang sama, out1 | 55 | 38 | 1 | 9 | 10 | 2 | 84 | 294 |
| 55 render yang sama, out2 | 55 | **13** | 1 | **0** | **1** | **0** | **23** | **11** |
| 9 render baru (dulu ditolak), out2 | 9 | 8 | 4 | 0 | 0 | 0 | 79 | 32 |

Teks di garis tepi simpul dan konektor menembus simpul: 0 di kedua keadaan.

Rincian 9 render baru (Chromium):
- graph: longLabel 0 cacat; many15 dan many15long 3 silang; many24 8 silang + 5 berimpit; many24long sama + 1 tumpuk; fit16long 3 berimpit;
- swimlane: many15 dan many15long 28 silang + 9 berimpit (rantai 15 langkah dibungkus per pita, konektor balik dari ujung pita ke awal pita berikutnya); fit16long 3 tumpuk (label tepi vs penanda nomor) + 1 silang + 1 berimpit.

Lint Node (`fig02b/dev/loop.ts`) memberi angka sejalan: 55 render yang sama 84/294 -> 23/11 silang/berimpit.

## 5. Bukti paritas dan byte-identik

Pembanding: `fig_audit/fig02b/base2` = salinan `src/lib/studio` sebelum baris ini (FIG-02b1 diterima D-497). Skrip: `fig02b/dev/parity2.ts` (rilis + draf), `fig02b/dev/ident2.ts` (out1 vs out2).

- **Fixture paritas DG** (`tests/parity/fixtures/diagram/*.json` + `garis_a/*.json`): 26 render.
  - 16 sha identik, termasuk `dg_graph` (sisa lint 1) dan `dg_graph_hops` (sisa lint 2): tidak ada varian yang lebih baik, jadi render FIG-02b1 dipertahankan;
  - 6 berubah (3 fixture x rilis/draf);
  - 4 ditolak di keduanya dengan kode sama (`dg_layered_good`, `garis_a/good_layered`, DATUM-25, D-137).

| Fixture (rilis = draf) | sha lama -> baru (16 hex) | Cacat lint lama -> baru | Tinggi mm | Multiset teks | nHops | checksRun | REPORT baru |
|---|---|---|---|---|---|---|---|
| dg_rack | 3641ac971f0567c6 -> baf2a1ed50979da3 | 1 garis tembus -> 0 | 109,54 = | sama | 0 -> 0 | sama | `RACK_ROUTE` |
| dg_sld_good | 6998e27afbe858a9 -> 0f87c5785cebec7c | 1 garis tembus -> 0 | **71,44 -> 80,96** | sama | 0 -> 0 | sama | kaki turun di bawah rute "ke beban" |
| garis_a/good_sld | 6998e27afbe858a9 -> 0f87c5785cebec7c | 1 -> 0 | **71,44 -> 80,96** | sama | 0 -> 0 | sama | sama dengan dg_sld_good |

  - `nHops` tidak berubah pada fixture mana pun. `nHops` memang dapat berubah bila rute berubah; di harness ia berubah pada 18 render tekanan (manifest out1 -> out2):
    - turun: layered many15/many15long 2 -> 0, many24 7 -> 1, many24long 9 -> 1, fit16/fit16long 2 -> 0; topology many15/many15long 1 -> 0, many24/many24long 6 -> 1; graph fit16 1 -> 0;
    - naik: flow many15/many15long/fit16/fit16long 1 -> 2, flow many24/many24long 2 -> 3 (segmen berimpit 2-5 -> 0, satu persilangan tersingkap per render); swimlane fit16 0 -> 1 (berimpit 4 -> 1).
  - Tinggi sld naik 2 kisi (9,525 mm): rute "ke beban" turun ke y 52,39 di bawah simpul terbawah (47,62), dan kaki digeser agar baris SUMBER tidak lagi ditembus. Ini satu-satunya fixture yang berubah tinggi; perlu keputusan controller (§10).
- **Render harness lint-bersih (out1):** 15/15 sha identik (`cleanChanged: []`).
- **Grafik:** 776/776 sha identik, termasuk 24 render keluarga G. G-04 longLabel/longTitle memang render dengan fit aktif, tetapi tidak ada label simpulnya yang memerlukan > 2 baris (simpul flowchart melebar mengikuti label), jadi bungkus baru tidak terpicu di harness.
- **Penolakan:** 85 penolakan sama kode di out1 dan out2 (68 grafik + 17 diagram); 9 penolakan diagram menjadi render; 0 penolakan berganti kode.
- **`convert_v2 --check`:** SAME untuk `doc.v2.json` (79290e07…), `template.v2.json` (882057c5…), `datum-manual-000.preset.json` (a951b149…). Tidak ada ParamDef baru (pin 136).

## 6. Target audit dan sisa cacat

Target audit (research/18 §9 dan brief):

| Target | Hasil (Chromium) | Tercapai? |
|---|---|---|
| normal 0 render bercacat | 9/9 bersih (sebelumnya 1: sld) | ya |
| fit16long 0 tumpuk dan 0 berimpit | 6 render yang sudah lolos di out1: 0 tumpuk, 0 berimpit. 2 render baru: graph 3 berimpit; swimlane 3 tumpuk + 1 berimpit | ya untuk himpunan lama; tidak untuk 2 render baru |
| penolakan < 26 bila tata letak bisa beradaptasi | 17 (graph 0, swimlane 2, sld 6, sequence 4, stack 4, flow 1) | ya |

Sisa cacat:

| Kelompok | Sisa | Alasan | Langkah lanjut |
|---|---|---|---|
| Persilangan 55 render lama (23) | flow 2-3 per render many/fit; layered fit16 3, many24 1-2; topology fit16 1, many24 1; graph fit16 0; swimlane fit16 1 | Flow tidak diurutkan ulang: urutan simpul flow adalah isi (alur baca), jadi hanya jalur yang dipisah; memisah segmen berimpit menyingkap satu persilangan per render. Layered/topology: optimum lokal tukar-pasangan dan detur di sekitar simpul. | Untuk flow: rute konektor lompat (`n2 -> n5`) di luar badan baris. Pencarian urutan global (lebih dari tukar-pasangan) bila diperlukan. |
| Berimpit 55 render lama (11) | topology/layered many24 1-2, fit16 1, swimlane longLabel 2, swimlane fit16 1 | Kelompok yang semua varian jalurnya menembus simpul atau tidak menurunkan skor dibiarkan (pagar `pathOk`). Swimlane longLabel: bungkus label menghapus 2 label meluap, tetapi rute baru berimpit 2; skor lint sama (3 = 3). | Varian jalur bertangga lebih banyak; rute swimlane berkanal. Ditimebox di baris ini. |
| Garis tembus teks (1) | swimlane longLabel | Konektor menembus label tepi bernomor. | Bobot label vs konektor (sudah tercatat FIG-02b1). |
| Tumpuk (1 lama + 4 baru) | topology many24long 1; graph many24long 1; swimlane fit16long 3 | Label tepi vs penanda nomor `LABEL_NUMBERED` pada render padat. | Penempatan penanda nomor ikut rintangan label tepi (fit/labels). |
| 9 render baru | 79 silang, 32 berimpit | Swimlane many15: rantai 15 langkah dibungkus pita 3 kolom; konektor balik pita bersilang dengan lajur lain. Graph many24: 25 simpul acak di 5 kolom. Render ini sebelumnya DITOLAK; kini dirender dengan REPORT `CAPACITY_ADAPT` dan `GEOM_*` beserta saran ("maks N simpul per baris lajur ...; bagi lajur atau pecah menjadi 2 diagram"). | Keputusan controller: terima render adaptif bercacat-terlapor, atau tolak bila skor lint melewati ambang (§10). |
| Penolakan tersisa (17) | swimlane many24/many24long (DATUM-37, semua mode gagal tinggi); sld 6 (> 3 cabang per tingkat); sequence 4 dan stack 4 (DATUM-33); flow longLabel 1 | sld/sequence/stack/flow di luar daftar P1-14 brief. Semuanya kini membawa saran konkret, mis. graph `maks 5 kolom pada 166 mm; bagi menjadi dua gambar atau pakai layered`, sld `maks 3 cabang per tingkat pada 166 mm; pecah rel atau bagi menjadi dua gambar`, DATUM-33 `kurangi simpul/pesan per gambar atau pecah menjadi 2 diagram`. | Bungkus tingkat sld (baris cabang kedua) bila diminta. |
| G-04 flowchart | normal datum/gallery: 2 teks di garis tepi + 1 label lebih lebar (Chromium); longLabel: label tepi di atas simpul | Render normal lint-bersih menurut lint grafik (negatif palsu lint grafik); aturan "lint-bersih = byte-identik" melarang mengubahnya. Bungkus baru aktif hanya saat fit grafik, dan simpul flowchart melebar mengikuti label sehingga tidak terpicu di harness. Cacat longLabel adalah label tepi, bukan label simpul. | Lint grafik mengenali teks simpul flowchart (di luar kepemilikan baris ini: `chart/core/lint`). |
| Caption grafik (P2-15) | 0 teks keluar kanvas | Sudah dibungkus sejak FIG-02a. | Tidak ada. |

## 7. Gerbang (keluaran segar)

| Gerbang | Perintah | Hasil |
|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | exit 0, tanpa keluaran (`fig02b/tsc_b2.log`, 0 baris) |
| Lint | `npx eslint` 16 berkas yang disentuh/baru + 3 uji baru | exit 0, log kosong (`fig02b/eslint_b2.log`, 0 bita) |
| Uji studio | `npx vitest run tests/unit/studio` (latar belakang) | Test Files 1 failed, 185 passed (186); Tests 1 failed, 3822 passed, 1 skipped (3824); 182,62 s (`fig02b/vitest_b2.log`) |
| Uji terkait | 9 berkas: 3 uji baru, `fig02b-*`, `diagram-bad-cases`, `diagram-keyrow-page`, `diagram-families`, `chart-smoke` | 8 berkas lulus; 242 lulus / 1 gagal (sama dengan baris di atas) |
| Uji baru | `fig02b2-order-lanes` (10), `fig02b2-layout` (10), `fig02b2-flowchart` (4) | 24 lulus |
| convert_v2 | `npx tsx benchmark/extract/convert_v2.ts --check` | SAME x3 |
| Pin registri | `chart-smoke.test.ts` (136 ParamDef) | lulus; tidak ada ParamDef baru |
| Determinisme | `gen_sub.ts` ke out2 dan out2b | sha gabungan 840 SVG identik: `624e08af706dd53150e3df3fc1a63c2e986dcbcc6498bf6e0ca9daa2a7c900f7`; `diff` sha per berkas kosong |
| Byte-identik | `fig02b/dev/ident2.ts`, `fig02b/dev/parity2.ts` | 15/15 diagram lint-bersih, 776/776 grafik, 16/22 render fixture DG (§5) |

Satu uji gagal, di berkas milik baris lain (`tests/unit/studio/figures/diagram-families.test.ts:145`, "build graph bersilang: nHops = 1 dan busur r 0,9 mm tergambar"):
- spec uji `HOP_SPEC` adalah graph yang SENGAJA bersilang (a->b melintasi c->d) untuk memeriksa busur lompatan;
- lint mengukur 1 persilangan, sehingga P1-11 aktif sesuai brief ("atau bila lint mengukur persilangan > 0") dan urutan baris ditata ulang: persilangan 1 -> 0, `nHops` 1 -> 0 (`expected +0 to be 1`);
- ini perilaku yang diminta, bukan regresi mekanisme lompatan (busur tetap digambar bila persilangan tersisa, mis. fixture `dg_graph_hops` byte-identik dengan 2 lompatan);
- tidak diubah di sini (berkas bukan milik baris ini). Usulan bagi pemilik: ganti `HOP_SPEC` dengan persilangan yang tak terhindarkan oleh urutan baris, mis. K2,2 (a, b di baris 0; c, d di baris 1; tepi a->c, a->d, b->c, b->d), atau pakai fixture `dg_graph_hops`.

Riwayat run (jujur): satu run vitest penuh. Run pertama uji baru (sebelum implementasi): `fig02b2-layout` + `fig02b2-flowchart` 9 dari 12 gagal; `fig02b2-order-lanes` gagal impor (modul belum ada). Uji G-04 pertama memakai premis salah (label panjang dianggap perlu dibungkus, padahal simpul flowchart melebar); ditulis ulang menjadi uji `fitLines` langsung. Uji MCP (`tests/unit/studio/mcp/*`, milik FIG-03b) lulus di run ini.

## 8. Persistent Issues

| Isu | Percobaan | Akar | Status | Memblokir? |
|---|---|---|---|---|
| `diagram-families.test.ts:145` gagal | 0 (bukan berkas baris ini) | Uji mengunci persilangan yang kini dihilangkan P1-11 | Butuh pemilik uji / keputusan controller | Ya untuk "unit studio hijau" |
| Silang tersingkap di flow (+1 per render many/fit) | 2 (bobot 2x silang di `nudgeRoutes`; varian satu sisi) | Urutan flow adalah isi; berimpit dihapus menyingkap 1 silang | Dilaporkan §6 | Tidak |
| Render swimlane many15 baru: 28 silang | 1 (mode "time" vs "pack", skor terkecil) | Rantai panjang dibungkus pita | Dilaporkan, keputusan §10 | Tidak |

## 9. Issues & Decisions

| Langkah | Isu / keputusan | Penyelesaian |
|---|---|---|
| Aktivasi | Pembantu rute boleh aktif untuk render yang cacatnya hanya teks? | Tidak. Berpagar jenis cacat render pertama (`defects`), dan tiap kandidat juga dicoba "tanpa rute ulang" (= FIG-02b1), yang menang bila seri. Hasil tidak pernah lebih buruk dari pilihan FIG-02b1 pada kandidat yang sama. |
| Jalur | Pemisahan `midy` sebelum detur hanya menurunkan berimpit 14 -> 13 (topology fit16) | Diagnosis: berimpit berasal dari keluaran detur (mulai dari jangkar, menyusuri garis tepi) dan `midx` terkunci kisi di garis tepi simpul. Diganti detur dari stub + `between` + `nudgeRoutes` pasca-detur. |
| `between` | A/B harness: dengan 47 silang + 9 berimpit; tanpa 26 + 53 | Dipertahankan (total lebih kecil). |
| Urutan simpul | Gerbang hanya `edgeCross` vs juga "agen tidak memberi col/row" | Mengikuti brief: graph (col/row agen) hanya bila silang terukur; layered/topology (hanya `tier`) bila ada cacat rute terukur. |
| Lebar tak seragam | Tukar slot x gagal bila simpul terakhir tingkat dijepit lembar (32 vs 53,33 mm) | Lapis dikemas ulang dengan urutan celah asal (tetap di kisi). |
| Kapasitas | Graph kolom bercelah (kasus buruk `col 0, 20`) | Tetap ditolak DATUM-37-lebar (uji bad_cases utuh), ditambah saran "rapatkan class.col". Hanya kolom bersambung yang beradaptasi. |
| Pesan galat | Saran aksi untuk semua penolakan DATUM-37/33 | `withAction` mempertahankan kelas `DiagramDefect`/`StudioEngineError`, kode, checkId, pointer, dan prefiks; hanya menambah `; saran: ...`. Uji bad_cases (substring + kelas + prefiks) tetap lulus. |
| sld | Rute "ke beban" menembus SUMBER | Kaki turun di bawah rute; tinggi fixture sld +9,525 mm. **Perlu keputusan controller** (deviasi paritas dengan perubahan tinggi). |
| P2-15 grafik | `chart/core/apparatus.ts` | Tidak diubah: bungkus sudah ada (FIG-02a), 0 cacat terukur. |
| G-04 | Bungkus hanya saat fit grafik | Render G-04 normal (lint grafik bersih) tetap byte-identik walau Chromium mengukur cacat teks simpul; negatif palsu lint grafik dicatat. |
| TDD | Uji ditulis dulu (merah 9/12), lalu implementasi | Sesuai skill `tdd`; uji G-04 diperbaiki premisnya. |
| Timebox jalur | Varian satu sisi ditambahkan, lalu dihentikan | Sisa berimpit 11 (55 lama) dicatat §6. |

## 10. Langkah berikut

- Controller memutuskan:
  1. penerimaan deviasi paritas 3 fixture DG (dg_rack, dg_sld_good, garis_a/good_sld; 6 render), termasuk tinggi sld 71,44 -> 80,96 mm (§5);
  2. uji `diagram-families.test.ts:145` (`HOP_SPEC`): pemiliknya memperbarui spec ke persilangan tak terhindarkan, atau P1-11 dimatikan untuk graph ber-col/row (konsekuensi belum diukur; graph fit16 kini 0 silang berkat urutan baru, `NODE_ORDER`);
  3. kebijakan render kapasitas bercacat: 9 render dulu ditolak kini dirender dengan REPORT (`CAPACITY_ADAPT` + `GEOM_*` + saran); terima, atau tolak bila skor lint melewati ambang (mis. swimlane many15: 37).
- Review kode direkomendasikan (`senior-code-reviewer`), fokus:
  - `build/lanesroute.ts` (pagar `pathOk`, varian jalur);
  - `build/order.ts` (pengemasan lapis, batas evaluasi);
  - `build/autofit.ts` (tangga dua varian);
  - `build/capacity.ts` (pelestarian kelas galat);
  - pagar byte-identik.
- Konsumen `report.geometry` (pratinjau/revisi FIG-03b) kini juga menerima `NODE_ORDER`, `EDGE_LANES`, `RACK_ROUTE`, `CAPACITY_ADAPT`, `CAPTION_WRAP`, dan `AUTO_FIT` dengan daftar varian.
