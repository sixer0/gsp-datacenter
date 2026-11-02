---
task_id: FIG-02b1
task_slug: doc_artifact_studio
row: FIG-02b1
date: 2026-11-02
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/research/18_figure_layout_audit.md (§6 P1-10, P1-13, P2-16)
status: needs-review
---

# 20 — FIG-02b1: lebar simpul berbasis label, label tepi tanpa tabrakan, dan label zona/rel diagram

## 1. Ringkasan

- Diagram kini dirender dua tahap, dengan pola yang sama seperti grafik FIG-02a:
  - render apa adanya, lalu lint geometri diagram (`fit/lint.ts`);
  - bila lint menemukan cacat, render ulang dengan perbaikan otomatis;
  - hasil kedua dipakai hanya bila cacatnya lebih sedikit.
- Hasil harness Chromium untuk 55 render diagram yang lolos mesin (sebelum -> sesudah):
  - pasangan teks bertumpuk 291 -> 1;
  - label lebih lebar dari simpul 185 -> 2;
  - teks keluar lembar 126 -> 9 (kesembilannya caption longTitle, butir P2-15, di luar baris ini);
  - garis menembus teks 87 -> 10;
  - teks menimpa tepi simpul 64 -> 0.
- Persilangan (82 -> 84) dan segmen berimpit (291 -> 294) hampir tetap. Keduanya memang bagian FIG-02b2.
- Byte-identik terjaga di tiga kelompok:
  - semua 9 render diagram harness yang lint-bersih;
  - 8 dari 22 render fixture paritas DG yang bisa dirakit: 6 lint-bersih (sequence, stack, swimlane), ditambah `dg_graph_hops` (2 persilangan) yang tidak membaik lewat fit sehingga render pertamanya dipertahankan;
  - 24 render grafik keluarga G.
- Yang berubah hanya 7 fixture paritas (14 render, rilis + draf). Ketujuhnya bercacat menurut lint, dan untuk semuanya:
  - multiset teks sama;
  - tinggi sama;
  - `checksRun` dan `nHops` sama.
- Tidak ada perubahan pada penolakan: 26/26 tetap ditolak dengan kode yang sama.
- Gerbang: tsc 0, eslint 0, vitest studio 182 berkas / 3.795 lulus / 1 dilewati / 0 gagal, convert_v2 SAME x3, determinisme sha gabungan identik.
- Status `needs-review` karena dua hal perlu keputusan controller (§10):
  - temuan lint ditaruh di medan baru `report.geometry`, bukan `report.issues`;
  - deviasi paritas 7 fixture.

## 2. Arsitektur yang dibangun

Alur `buildDiagramSvgWith` (`engine/diagram/build/svg.ts:251-254`):

1. `buildOnce` merakit spec persis seperti sebelum FIG-02b (badan lama, `build/svg.ts:256` dst.).
2. `autoFitDiagram` (`build/autofit.ts:80`) melint SVG.
   - Skor 0: hasil dikembalikan apa adanya, tanpa medan `geometry`. Inilah jaminan byte-identik.
3. Ada cacat: rakit ulang di dalam `withDiagramFit` (`fit/state.ts`).
   - Kandidat dicoba berurutan (`build/autofit.ts:73-77`):
     1. penuh;
     2. tanpa tumbuh tinggi simpul;
     3. tanpa tumbuh tinggi dan tanpa label bernomor.
   - Kandidat berikutnya dicoba hanya bila yang sebelumnya gagal (mis. DATUM-33 karena tinggi melewati 247 mm) atau tidak lebih baik.
   - Hasil dipakai hanya bila skor lint lebih kecil dari render pertama.
4. Pembantu sadar-fit aktif hanya saat fit dan hanya pada unsur yang memang tidak muat (pagar lokal):
   - **P1-10, teks simpul** (`fit/text.ts`): label yang lebar terukurnya (tabel glif `textfit`) melebihi lebar dalam + setengah rem dibungkus ke <= 3 baris `<tspan>` dalam satu `<text>` (`core/svg.ts:117`, `:231`).
     - Layered/topology/stack (`layout-a/layered.ts:62`): lebar seragam setingkat naik ke kelipatan kisi terkecil tempat semua label muat <= 3 baris, dibatasi lebar lembar (`fitTierWidth`, `fit/text.ts:145`).
     - Flow `per_row` (`layout-a/flow.ts:38`): lebar baris sudah maksimum, jadi hanya bungkus.
     - Tinggi simpul tumbuh per baris (`grownHeight`).
     - Label yang tetap tidak muat 3 baris dibungkus hingga 6 baris dan dilaporkan `NODE_LABEL_LINES`. Label tidak pernah meluap lembar atau dipotong.
     - Silinder: label digeser ke bawah busur tutup (audit §4.2 DG-graph).
   - **P1-13, label tepi** (`fit/labels.ts`, rakitan di `build/fitlabels.ts`):
     1. Label yang posisi bawaannya bebas tabrakan tetap di tempat. Bila dua label bawaan saling timpa, yang pertama tetap.
     2. Sisanya diberi skor di kandidat 1/2, 1/4, 3/4 tiap segmen (segmen terpanjang dulu):
        - irisan keras: simpul, teks simpul, label zona/lajur, label lain, luar lembar atau baris kaki;
        - lalu lunak: konektor lain yang tertutup pita knockout.
     3. Bila tidak ada yang bebas: geser menjauhi segmen dengan garis penunjuk hairline, REPORT `LABEL_LEADER`.
     4. Bila tetap tidak ada: nomor di jalur, teks lengkap di baris catatan di atas kaki (tinggi bertambah satu kisi per baris), REPORT `LABEL_NUMBERED`.
     5. Pada kandidat 3 (tanpa nomor), label tetap di posisi terbaik, REPORT `LABEL_UNPLACED`.
     - Semua saran berbunyi "persingkat label tepi (maks ~20 karakter)".
     - Pita knockout memakai lebar mono terukur 0,6 em + 1,6 mm (`knockWidthMm`; sebelumnya taksiran 0,56 em).
   - **P2-16** (`build/fitlabels.ts:37`): label zona dijepit ke dalam lembar (REPORT `ZONE_LABEL_CLAMP`; persegi zona tidak diubah). Label rel bus sld dipindah ke atas batang (`fit/text.ts nodeTextLayout`).
5. Laporan (`report.geometry`, selalu `status: "REPORT"`, masing-masing dengan `suggest`):
   - `AUTO_FIT`: skor sebelum/sesudah dan kandidat yang dipakai;
   - catatan pembantu;
   - sisa cacat `GEOM_TEXT_OVERLAP`, `GEOM_TEXT_OUTSIDE`, `GEOM_LINE_TEXT`, `GEOM_TEXT_NODE`, `GEOM_LABEL_OVERFLOW`, `GEOM_EDGE_CROSS`, `GEOM_EDGE_COLLINEAR`, `GEOM_EDGE_NODE`.
   - Bila render pertama dipertahankan, `AUTO_FIT` menyebut hasil tiap kandidat dan sisa cacat tetap dilaporkan.

Lembar graph (D-290) dijaga: saat fit, label ditempatkan di dalam rentang y isi bawaan (simpul, rute, pita label bawaan, zona). Dengan begitu tepi atas dan tinggi lembar tidak bergeser karena label (`build/svg.ts:288-301`).

## 3. Perubahan per berkas

| Berkas | Jenis | Isi |
|---|---|---|
| `engine/diagram/fit/lint.ts` (442 baris) | ditinjau, dipakai apa adanya | Lint agen sebelumnya. Diuji terhadap Chromium: pada baseline 46 tp / 0 fp / 0 fn / 9 tn per render; sesudah 38 / 2 / 0 / 15. Kedua fp adalah rak: lint menghitung 1 garis menembus label tepi yang Chromium anggap bersih. Tidak perlu diubah. |
| `engine/diagram/fit/state.ts` | baru (60) | Status fit (`withDiagramFit`, `diagramFitActive`, `diagramFitAllows("grow"/"numbered")`, `diagramFitNote`). |
| `engine/diagram/fit/text.ts` | baru (213) | `planNodeText`, `fitTierWidth`, `grownHeight`, `innerWidthMm` per bentuk, `nodeTextLayout` (bungkus, silinder, rel bus). |
| `engine/diagram/fit/labels.ts` | baru (322) | `placeEdgeLabels` (kandidat, skor, penunjuk, nomor), `knockWidthMm`, `knockBox`, `segHitsBox`, `layoutNotes`. |
| `engine/diagram/build/autofit.ts` | baru (121) | Aktivasi + tangga kandidat + `diagramGeometryIssues` (saran per jenis cacat). |
| `engine/diagram/build/fitlabels.ts` | baru (154) | Rintangan label (kotak simpul, rel bus hanya batangnya, teks simpul, label zona/lajur), `zoneGeom`, `shiftPlan`, `planBands`, `noteRows`. |
| `engine/diagram/build/svg.ts` | ubah (+114/-26) | `buildOnce` + pembungkus; rencana label saat fit; baris catatan; `graphFit` menerima rentang label; `DiagramBuildReport.geometry?`. Jalur non-fit tidak berubah. |
| `engine/diagram/core/svg.ts` | ubah (+36/-6) | `svgTextLines` (satu `<text>` + `<tspan>`); cabang fit di `nodeSvg`; parameter opsional `kwMm` pada `labelKnockoutSvg`/`edgeLabelSvg`. |
| `engine/diagram/core/index.ts` | ubah (+1) | Ekspor `svgTextLines`. |
| `engine/diagram/layout-a/layered.ts` | ubah (+21) | Lebar tingkat berbasis label + tinggi tumbuh (hanya saat fit). |
| `engine/diagram/layout-a/flow.ts` | ubah (+16) | Bungkus + tinggi tumbuh `per_row` (hanya saat fit). |
| `tests/unit/studio/figures/fig02b-node-wrap.test.ts` | baru | 11 uji: rencana bungkus, lebar tingkat, layout layered/flow, `nodeSvg` `<tspan>`, rel bus. |
| `tests/unit/studio/figures/fig02b-edge-labels.test.ts` | baru | 10 uji: lebar pita mono, tetap/pindah/penunjuk/nomor, catatan, aktivasi (lint-bersih tanpa `geometry`, topology 4 -> 0, determinisme, kontrak data-mark). |

Tidak disentuh:
- `engine/chart/core/**` (hanya diimpor: `textfit`, `geometry.pathPolylines`);
- `chart/family-g/**`: G-04 tidak dibungkus di baris ini; 24/24 render keluarga G identik;
- kontrak, ParamDef, `decisions.md`, `file_claims.md`.

## 4. Hasil sebelum/sesudah (Chromium, harness FIG-01)

Perintah (keluaran nyata, `C:\Users\TRIAL\AppData\Local\Temp\fig_audit\`):

```
OUT=.../fig02b/out1  tsx fig02b/gen_sub.ts   -> total 1009 ok 831 rejected 94 na 84
OUT=.../fig02b/out1b tsx fig02b/gen_sub.ts   (run kedua, determinisme)
OUT=.../fig02b/out1  node measure.mjs         -> measured 831, exit 0
node fig02b/table.mjs fig02b/out_before fig02b/out1
```

Garis dasar `fig02b/out_before` = mesin sebelum FIG-02b. Mesin diagram identik dengan HEAD; keluarga G sama dengan baseline `fig02c`.

Diagram per kelas kasus. n = render lolos, tlk = ditolak, cct = render bercacat. Kolom cacat: tumpuk, keluar, garis tembus teks, lebih lebar dari simpul, tepi simpul, silang, berimpit.

| Kasus | n | tlk | cct | tumpuk | keluar | garis | lebar | tepi | silang | berimpit |
|---|---|---|---|---|---|---|---|---|---|---|
| normal | 9 | 0 | 5 -> 1 | 3 -> 0 | 1 -> 0 | 1 -> 1 | 2 -> 0 | 4 -> 0 | 0 -> 0 | 0 -> 0 |
| longLabel | 7 | 2 | 5 -> 2 | 10 -> 0 | 12 -> 0 | 3 -> 2 | 12 -> 2 | 5 -> 0 | 0 -> 0 | 0 -> 0 |
| longTitle | 9 | 0 | 9 -> 9 | 3 -> 0 | 10 -> 9 | 1 -> 1 | 2 -> 0 | 4 -> 0 | 0 -> 0 | 0 -> 0 |
| many15 | 4 | 5 | 4 -> 4 | 5 -> 0 | 0 -> 0 | 1 -> 1 | 0 -> 0 | 2 -> 0 | 7 -> 7 | 22 -> 22 |
| many15long | 4 | 5 | 4 -> 4 | 62 -> 0 | 28 -> 0 | 22 -> 1 | 45 -> 0 | 10 -> 0 | 7 -> 7 | 22 -> 25 |
| many24 | 4 | 5 | 4 -> 4 | 9 -> 0 | 0 -> 0 | 1 -> 1 | 0 -> 0 | 7 -> 0 | 28 -> 28 | 79 -> 79 |
| many24long | 4 | 5 | 4 -> 4 | 122 -> 0 | 40 -> 0 | 38 -> 1 | 72 -> 0 | 14 -> 0 | 28 -> 30 | 79 -> 76 |
| fit16 | 8 | 1 | 6 -> 6 | 8 -> 0 | 0 -> 0 | 1 -> 1 | 3 -> 0 | 7 -> 0 | 9 -> 9 | 59 -> 59 |
| fit16long | 6 | 3 | 5 -> 4 | 69 -> 1 | 35 -> 0 | 19 -> 1 | 49 -> 0 | 11 -> 0 | 3 -> 3 | 30 -> 33 |
| **Total** | **55** | **26** | **46 -> 38** | **291 -> 1** | **126 -> 9** | **87 -> 10** | **185 -> 2** | **64 -> 0** | **82 -> 84** | **291 -> 294** |

Catatan pembacaan:
- Penolakan sama persis: 26 sebelum, 26 sesudah, kode sama (`ident.ts`: `rejectedSame: 26`). DATUM-37 flow longLabel diamond, graph >= 5 kolom, swimlane > 3 simpul per lajur, dan DATUM-33 tetap ditolak. Kapasitas (P1-14) di luar baris ini.
- "Render bercacat" baru turun 46 -> 38 karena sebagian besar render many/fit hanya tersisa silang/berimpit. Itu lingkup FIG-02b2.
- Tanpa menghitung silang/berimpit, render dengan cacat teks turun dari 46 menjadi 19:
  - 9 longTitle (caption keluar kanan; rak dan sld longTitle juga membawa 1 garis tembus);
  - 6 rak many/fit (konektor antarperangkat menembus label perangkat; rute);
  - 2 sld normal/longLabel (rute "KE BEBAN" lewat baris SUMBER);
  - swimlane longLabel;
  - topology fit16long (1 tumpuk).
- Sisi lint Node (`fig02b/nodelint_tab.ts`) memberi angka yang sejalan. Contoh: skor many24long 387 -> 107, dan sisanya hampir semua silang/berimpit.

Contoh visual (PNG 4 px/mm, `fig02b/`):
- `fx1.png`: rak dan sld lama/baru. Label tepi rak dipindah ke kiri dengan penunjuk; label rel bus di atas batang.
- `fx2.png`: topology. Label zona di dalam lembar, simpul lingkaran dibungkus 2 baris, "REPLIKASI HARIAN" berpenunjuk. Flow: "NILAI" dan "TIDAK, PANTAU ULANG" terpisah.
- `graph.png`: label silinder di bawah tutup, label tepi bebas.
- `flow24.png`: flow many24long dengan kandidat 2. Kandidat penuh ditolak DATUM-33 karena tinggi.

## 5. Bukti paritas

Pembanding: salinan mesin sebelum FIG-02b di `fig_audit/fig02b/base` (mesin diagram = HEAD; `diff -r` hanya berbeda pada `fit/`). Skrip: `fig02b/parity.ts`, `fig02b/fxdetail.ts`, `fig02b/ident.ts`.

- **Fixture paritas DG** (`tests/parity/fixtures/diagram/*.json` + `garis_a/*.json`, rilis dan draf): 26 render.
  - 8 sha identik;
  - 14 berubah;
  - 4 ditolak di keduanya dengan kode sama: `dg_layered_good` dan `garis_a/good_layered`, DATUM-25 (D-137).
  - Semua yang berubah bercacat menurut lint di baseline (D-482 butir 3).

| Fixture (rilis = draf) | sha lama -> baru (16 hex) | Cacat lint lama | Sesudah | Tinggi mm | Multiset teks | nHops / checksRun | REPORT |
|---|---|---|---|---|---|---|---|
| dg_flow | 12afa33d02f1ba28 -> 3a5ec19cdd57b104 | 1 (1 tumpuk) | 0 | 109,54 = | sama | 0/0, sama | AUTO_FIT, LABEL_MOVED |
| dg_flow_wrapped | ce863bbf9489a62f -> 0bae3127484d8832 | 2 (2 tepi simpul) | 0 | 61,91 = | sama | 0/0, sama | AUTO_FIT, LABEL_MOVED, LABEL_LEADER x4 |
| dg_graph | 7d345ee33f8ef30e -> 0857ab891b3e0216 | 3 (3 tepi simpul: busur silinder + glif) | 1 | 57,15 = | sama | 0/0, sama | AUTO_FIT, LABEL_MOVED, LABEL_LEADER x2, GEOM_TEXT_NODE |
| dg_rack | ec6a80d0b6baf21d -> 3641ac971f0567c6 | 2 (1 tumpuk, 1 garis) | 1 | 109,54 = | sama | 0/0, sama | AUTO_FIT, LABEL_LEADER, GEOM_LINE_TEXT |
| dg_sld_good | 8fba8850d353b9df -> 6998e27afbe858a9 | 3 (tumpuk, garis, tepi) | 1 | 71,44 = | sama | 0/0, sama | AUTO_FIT, LABEL_MOVED, GEOM_LINE_TEXT |
| garis_a/good_sld | 8fba8850d353b9df -> 6998e27afbe858a9 | 3 | 1 | 71,44 = | sama | 0/0, sama | sama dengan dg_sld_good |
| dg_topology | 28f39a1377feb8a4 -> 0d8f5c012e6853fa | 4 (1 keluar, 1 tepi, 2 lebar) | 0 | 90,49 = | sama | 0/0, sama | AUTO_FIT, ZONE_LABEL_CLAMP, LABEL_LEADER |

  Penjelasan sisa cacat:
  - Sisa 1 di dg_graph adalah glif asal "◈" yang menyentuh garis tepi. Chromium mengukur 0.
  - Sisa 1 di rak dan sld adalah konektor yang menembus label perangkat atau baris SUMBER (rute, bukan label).

  Tidak ada fixture yang memakai label bernomor. Tag bertambah hanya berupa `<line>` penunjuk hairline (rak, flow_wrapped, graph, topology). Untuk kelas DG ini termasuk deviasi tercatat `tagCountDelta`.
- **Render harness lint-bersih di baseline:** 9/9 sha identik (`cleanChanged: []`).
- **Grafik keluarga G** (diikutkan `gen_sub.ts`): 24/24 identik.
- **Render harness bercacat:** 36/46 berubah. 10 tetap karena tidak ada kandidat yang lebih baik (mis. `dg_graph_hops` dan render rak/silang murni).
- **Determinisme:** `out1` dan `out1b` memberi sha gabungan identik, `1f8c4049f67219abcc618af369292d6911468eb5ff06cd46f6e233039bb47574`. Uji unit juga merakit 4 fixture bercacat dua kali dan membandingkan string SVG.
- **`convert_v2 --check`:** SAME untuk `doc.v2.json` (79290e07…), `template.v2.json` (882057c5…), dan `datum-manual-000.preset.json` (a951b149…). Pin 136 ParamDef tidak tersentuh, karena tidak ada ParamDef baru.

## 6. Sisa cacat dan alasannya

| Kelompok | Sisa (Chromium) | Alasan | Langkah lanjut |
|---|---|---|---|
| Persilangan dan segmen berimpit (many/fit, layered/topology/flow) | 84 silang, 294 berimpit (sebelum 82/291) | Urutan simpul dari agen; rute 3 segmen dengan `midy`/`midx` tunggal tanpa pemisahan jalur (audit §5 J). Pelebaran tingkat sedikit menggeser rute (+2 silang, +3 berimpit total). | **FIG-02b2**: pengurutan barycenter/Sugiyama (P1-11) + pemisahan jalur (P1-12). |
| Caption longTitle (9 keluarga) | 9 teks keluar kanan | Caption/SUMBER satu baris (`build/svg.ts` kaki aparatus), butir P2-15. | Bungkus caption diagram (P2-15). Bukan lingkup baris ini. |
| Rak many/fit (6) + rak/sld longTitle | 1 garis tembus per render | Konektor antarperangkat bertumpuk menembus label perangkat di antaranya (rute). | Rute rak di sisi kanan/kiri badan rak (FIG-02b2). |
| sld normal/longLabel | 1 garis tembus | Rute "KE BEBAN" turun melewati baris SUMBER. Label tepinya sudah dipindah. | Batas bawah rute = tepi kaki (FIG-02b2). |
| swimlane longLabel | 2 lebih lebar + 1 garis | Lebar dan tinggi simpul swimlane tetap (`layout-b/swimlane.ts`). Bungkus dibatasi tinggi simpul. Swimlane tidak termasuk daftar P1-10 baris ini. | Tinggi tumbuh swimlane (perubahan kecil di `layout-b`). |
| topology fit16long | 1 tumpuk | Label tepi yang dipaksa ke tempat terbaik oleh kandidat yang memenangkan skor total. | Bobot label vs konektor di FIG-02b2. |
| Diamond flow `per_row` (kandidat 2, mis. flow many24long) | Label 4-5 baris tampak menyentuh sisi diamond | Kandidat penuh melewati 247 mm (DATUM-33). Kandidat tanpa tumbuh membungkus di dalam tinggi tetap. | REPORT `NODE_LABEL_LINES` menyarankan maks ~40 karakter. |
| Penolakan (26) | Tidak berubah | Kapasitas (DATUM-37/33). Mengubah penolakan menjadi render berisiko terhadap uji bad_cases (DATUM-37). | P1-14 (kapasitas yang membantu). |

`LABEL_DROPPED` sengaja tidak pernah dipancarkan. Teks label tepi tidak pernah dihapus atau dipotong, karena D-491 mewajibkan multiset teks DATA tetap sama. Sebagai gantinya ada tiga REPORT:
- `LABEL_LEADER` (digeser dengan penunjuk);
- `LABEL_NUMBERED` (nomor di jalur + teks lengkap di baris catatan);
- `LABEL_UNPLACED` (kandidat tanpa nomor).

Nomor penanda ("1", "2", …) adalah teks non-data tambahan. Sejauh ini hanya muncul pada render tekanan, tidak pada fixture.

## 7. Gerbang (keluaran segar)

| Gerbang | Perintah | Hasil |
|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | exit 0, tanpa keluaran (`fig02b/tsc.log`) |
| Lint | `npx eslint` 11 berkas diagram yang disentuh/baru + 2 uji baru | exit 0, log kosong (`fig02b/eslint.log`, 0 bita) |
| Uji studio | `npx vitest run tests/unit/studio` (latar belakang) | Test Files 182 passed (182); Tests 3795 passed, 1 skipped (3796); 193,74 s (`fig02b/vitest3.log`) |
| Uji figur | `npx vitest run tests/unit/studio/figures` | 19 berkas, 512 lulus |
| Uji baru | `fig02b-node-wrap.test.ts` + `fig02b-edge-labels.test.ts` | 21 lulus |
| convert_v2 | `npx tsx benchmark/extract/convert_v2.ts --check` | SAME x3 |
| Pin registri | `chart-smoke.test.ts` (136 ParamDef) | lulus; tidak ada ParamDef baru |
| Determinisme | gen_sub x2 | sha gabungan identik (§5) |
| Paritas | `fig02b/parity.ts` | 8/22 identik, 14 berubah (7 fixture, semua bercacat terukur, teks/tinggi/hops sama), 4 ditolak sama |

Riwayat run (jujur):
- Run vitest pertama: 4 gagal di `tests/unit/studio/mcp/*` (jumlah alat MCP 22 vs 20). Itu pekerjaan MCP paralel, tidak terkait diagram.
- Run kedua: 2 gagal di `diagram-keyrow-page.test.ts` (D-288/D-290, lembar graph). Penyebabnya, label graph sempat ditempatkan di atas isi sehingga lembar bertambah satu kisi.
  - Perbaikan: label graph dijaga di dalam rentang y isi bawaan.
  - Run ketiga (final): 0 gagal.

## 8. Persistent Issues

| Isu | Percobaan | Akar | Status | Memblokir? |
|---|---|---|---|---|
| Silang/berimpit tidak turun | Di luar lingkup | Rute + urutan simpul | Diserahkan ke FIG-02b2 | Tidak |
| Diamond pada kandidat tanpa tumbuh | 1 | Tinggi 247 mm membatasi | Dilaporkan `NODE_LABEL_LINES` | Tidak |

## 9. Issues & Decisions

| Langkah | Isu / keputusan | Penyelesaian |
|---|---|---|
| Lint | Lint agen sebelumnya (442 baris, belum diuji) layak dipakai? | Ya. Kesepakatan render dengan Chromium 46/0/0/9 di baseline. Tidak diubah. |
| Laporan | `diagram-families.test.ts:88` mengunci `report.issues == []` untuk semua fixture (berkas uji milik baris lain), padahal sebagian besar fixture bercacat | Temuan ditaruh di medan baru `DiagramBuildReport.geometry` (REPORT + `suggest`). `issues` tidak berubah. **Perlu keputusan controller**: gabungkan ke `issues` (uji itu diperbarui pemiliknya) atau biarkan terpisah. Konsumen MCP/laporan perlu membaca `geometry` agar saran sampai ke agen (`services/render/figures.ts` di luar kepemilikan). |
| Paritas DG | 7 fixture berubah | Semua bercacat terukur; teks, tinggi, `checksRun`, `nHops` sama; sha di §5. Diajukan sebagai deviasi tercatat D-482 butir 3. Termasuk `tagCountDelta` (+`<line>` penunjuk pada 4 fixture). |
| Penolakan | Mencoba ulang render yang ditolak DATUM-37 dengan fit? | Tidak. Pagar bad_cases DATUM-37 dan P1-14 di luar lingkup. Penolakan tetap. |
| Tinggi | Tumbuh tinggi melewati 247 mm (DATUM-33) | Tangga kandidat (penuh -> tanpa tumbuh -> tanpa nomor). Tidak pernah melempar karena fit. Render pertama dipertahankan bila semua kandidat gagal. |
| Graph D-290 | Label di luar isi menggeser tepi lembar | Label graph dibatasi rentang y isi bawaan. Uji D-290 tetap hijau. |
| TDD | Uji unit ditulis setelah implementasi (siklus merah diwakili lint + harness baseline) | Dicatat sebagai deviasi dari skill `tdd`. 21 uji mengunci perilaku. |
| G-04 | Bungkus flowchart family-g opsional | Tidak dikerjakan. Kode tidak berbagi secara alami (flowchart memakai `SvgDoc` grafik). 24/24 render G identik. |

## 10. Langkah berikut

- Controller memutuskan:
  1. `report.geometry` vs `report.issues`;
  2. penerimaan deviasi paritas 7 fixture (§5).
- Review kode direkomendasikan (`senior-code-reviewer`, review gabungan FIG-02a/02b/02c sesuai D-491 c). Fokus:
  - `build/autofit.ts` (tangga kandidat);
  - `fit/labels.ts` (skor, penunjuk, nomor);
  - `build/svg.ts` (jalur fit vs non-fit, lembar graph);
  - pagar byte-identik.
- FIG-02b2: pengurutan simpul (P1-11), pemisahan jalur (P1-12), rute rak/sld. Lint `edgeCross`/`edgeCollinear` di `fit/lint.ts` sudah siap sebagai loop merah.
- Kecil, terpisah: tinggi tumbuh swimlane; bungkus caption diagram (P2-15).
