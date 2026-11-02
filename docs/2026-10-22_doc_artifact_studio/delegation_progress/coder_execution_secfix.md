---
task_id: SEC-FIX
task_slug: doc_artifact_studio
row: SEC-FIX (perbaikan keamanan + review siklus 1)
date: 2026-11-02
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/decisions/decisions.md (D-501, D-502); verification/11_figure_security_review.md; verification/10_round4_code_review.md
status: complete
---

# Laporan Implementasi: SEC-FIX (M-1, L-1, L-2, review #6, laporan pratinjau)

Skill dimuat: `tdd`, `receiving-code-review`, `verification-before-completion` (dipakai sebagai disiplin: uji merah lebih dulu, verifikasi segar sebelum klaim).

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Ukur kapasitas mesin nyata (chart + diagram) dan butir terbesar di fixture | complete | Probe di scratchpad `secfix/` (tanpa DB/DEV); hasil di "Dasar batas" |
| 2 | M-1: batas kardinalitas pra-render di route + `maxItems` skema v2 + `renderGate()` | complete | `_lib/limits.ts` baru; route 422 `FIGURE_CAPACITY`; 503 `RENDER_QUEUE_FULL` |
| 3 | L-1: tagihan kuota sebelum validasi skema | complete | urutan R16 PATCH |
| 4 | L-2: `downloadDir` divalidasi sebelum jaringan/folder, satu pembantu bersama | complete | `resolveDownloadDir` + `prepareDownloadDir` (safety.ts); `write-dir` kini juga mencocokkan nama folder |
| 5 | Review #6: satu fungsi pemilik | complete | `checkOwnership` (doc-tools) menerima teks per alat; `checkFigureOwner` dihapus |
| 6 | Laporan pratinjau: `INTENT_APPLIED`/`CAPACITY_ADAPT` = info; kode/arah/butir yang dirender | complete | `figure.rendered`; baris MCP `dirender:` |
| 7 | Dokumentasi | complete | `docs/API-REFERENCE.md`, `docs/STUDIO-MCP.md` |
| 8 | Verifikasi (tsc, eslint, vitest, probe, convert_v2, smoke DEV) | complete | lihat Test Results |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| `src/app/api/studio/documents/[id]/figures/preview/_lib/limits.ts` | add | `FIGURE_LIMITS` + `chartCapacityIssues` / `diagramCapacityIssues` / `capacityMessage`: batas per larik (= `maxItems` skema) + batas produk/total (sel matriks, total nilai distribusi, total butir panel komposit, simpul/tepi diagram termasuk bentuk `steps`) |
| `src/app/api/studio/documents/[id]/figures/preview/_lib/figure.ts` | modify | `renderFigure` dipecah: `resolveFigure` (baca spec/artefak) -> `figureCapacityIssues` -> `renderResolved` (sinkron); `renderFigure` tetap ada untuk pemanggil langsung dan melempar 422 `FIGURE_CAPACITY` sebelum render. `INFO_CODES` + `INTENT_APPLIED`, `CAPACITY_ADAPT`; `FIT_HINTS` + `AXIS_LABEL_ROTATE`; `figure.rendered` = kode akhir (atribut `data-chart` SVG), arah, butir sesudah maksud |
| `src/app/api/studio/documents/[id]/figures/preview/route.ts` | modify | L-1: `getStudioCaller` + `checkRenderRate` sebelum `parsePreviewBody` (agentId non-string -> 400 tanpa tagihan, sama R16). M-1: 422 `BY_CONSTRUCTION_FAILED` `details.checkId=FIGURE_CAPACITY` sebelum render; render di `renderGate().run(...)`; log `renderedCode` |
| `src/lib/studio/contract/schema/v2/common.schema.ts` | modify (maxItems saja + komentar) | `ChartDataV2`: points/categories/items/tiles/ohlc/rows/cols/values 200, series 24, xy 2000, graph nodes 200 / links 400, distribution groups 50 / values 5000, flows 400, dots 1000, sets 16, overlaps 256; `DiagramSpecV2` nodes 24, edges 48 |
| `scripts/studio/mcp/safety.ts` | modify | `assertNotProtected` untuk `write-dir` juga mencocokkan nama folder itu sendiri ke `PROTECTED_DIRS`; pembantu bersama `resolveDownloadDir` (pra-jaringan) dan `prepareDownloadDir` (validasi ulang tepat sebelum `mkdirp`, OUT_UNWRITABLE) |
| `scripts/studio/mcp/tools.ts` | modify | `studio_file_verify` memakai `resolveDownloadDir` sebelum HEAD dan `prepareDownloadDir` sebelum tulis |
| `scripts/studio/mcp/figure-tools.ts` | modify | `studio_figure_preview` memakai pembantu yang sama (cek `figur.svg` khusus dihapus); `checkFigureOwner` diganti `figureOwnership` = baca R05 -> `ExistingDoc` -> `checkOwnership`; baris `dirender:` di hasil pratinjau |
| `scripts/studio/mcp/doc-tools.ts` | modify | `checkOwnership(a, ctx, doc, agentId, text: string \| OwnershipText)`: teks pembuka/langkah per alat; aturan (milik sendiri / adopsi / tolak + rincian tak tepercaya) satu tempat. Pemanggil lama (string `resume`) tidak berubah |
| `tests/unit/studio/api/secfix-figure-preview.test.ts` | add | 12 uji: M-1 (inline 5000 -> 400 maxItems; tersimpan 5000 -> 422 < 1 s; sel matriks; diagram 60 simpul; renderGate 503), L-1 (31 badan tak sah -> 429), info + rendered |
| `tests/unit/studio/contract/secfix-chart-maxitems.test.ts` | add | 16 uji: batas skema = batas route per bentuk (N lolos, N+1 ditolak keduanya), batas produk/total, pindai fixture paritas/benchmark/perf/prisma, blok bm-fig v2 |
| `tests/unit/studio/mcp/secfix-mcp-paths-owner.test.ts` | add | 7 uji: L-2 (file_verify/figure_preview `.claude`, `.github`, `.hermes`, `.git`, `kerja/.cursor` -> PATH_PROTECTED, 0 HTTP, 0 mkdir), pembantu + validasi ulang sebelum mkdir, satu sumber pembantu, satu fungsi pemilik, baris `dirender:` + info tanpa ajakan revisi |
| `docs/API-REFERENCE.md` | modify | baris route pratinjau: urutan kuota, batas, 422 FIGURE_CAPACITY, 503, `figure.rendered`, kode info |
| `docs/STUDIO-MCP.md` | modify | `studio_file_verify` (L-2) dan `studio_figure_preview` (info, `dirender:`, batas, kode galat) |

## Dasar batas (M-1)

Pengukuran mesin asli tanpa DB/DEV (probe scratchpad `secfix/capacity.ts`, `capacity_diag.ts`, `capacity_composite.ts`; setiap fixture paritas chart/diagram, larik utamanya diperbesar ke N). Angka ms satu kali jalan di mesin ini; agen lain (ENG-FIX) dapat sedang berjalan bersamaan, jadi angka bersifat indikatif.

| Bentuk / larik | Terbesar di fixture nyata | Biaya pada batas (terburuk antarkode) | Biaya di atas batas | Batas |
|---|---|---|---|---|
| Kategori berlabel (`categorical.points`, `series.categories`, `intervals.items`, `ohlc.points`, `tiles`, baris/kolom matriks) | 48 kategori (bm-fig-20), matriks 24x32 (bm-fig-18) | n=200: P-15 169 ms, P-08 151 ms, K-02 116 ms, P-09 108 ms; P-02 inline 102 ms | n=500: P-08 1166 ms, P-15 789 ms, P-09 547 ms; P-02 n=2000 3,6 s, n=5000 21,7 s (peninjau) | 200 |
| Seri (`series.series`) | 6 | P-03 `maxSeries` 3 menolak < 1 ms; small multiples panel <= 24 | - | 24 (24 x 200 = 4800 sel <= 5000 saran peninjau) |
| Titik xy | 600 (bm-fig-18) | n=2000: P-13 120 ms, H-02 70 ms | n=5000: P-13 435 ms; n=10000: 1531 ms | 2000 |
| Sel matriks | 768 | H-06 200 baris x kolom fixture: 39 ms | P-15 500 baris: 789 ms | 5000 (route) |
| Grafik jaringan (`graph.nodes`) | 17 | H-07 n=200: 21 ms | n=2000: 960 ms; n=5000: 5,5 s | 200 simpul, 400 tautan |
| Distribusi | 400 nilai / 6 grup | 5000 nilai/grup: P-05 97 ms, S-06 101 ms | 10000/grup: 207 ms | 50 grup, 5000 nilai/grup, total 20000 |
| Panel komposit | 15 panel, ~82 butir berlabel (bm-fig-17) | k=1: 20 ms; k=4..7 (286..490 butir) ditolak mesin < 1 ms | 694 butir: ditolak route | total 600 |
| Diagram (`nodes`/`edges`) | 13 simpul / 12 tepi (bm-fig-23) | 24 simpul: graph 652 ms / 1449 ms (hops); keluarga lain ditolak mesin < 115 ms | graph 32 simpul: 2,4-4,0 s; 48: 7,7-11,7 s; 60: 10,4 s; 150: 52,9 s | 24 simpul, 48 tepi |

Catatan: diagram graph adalah biaya terberat (adaptasi kapasitas FIG-02b2 di mesin, milik ENG-FIX); batas 24 = ~1,8x fixture terbesar dan menahan render terburuk ~1,5 s. Himpunan Venn: 16 / irisan 256 (mesin `maxSets` menolak lebih dulu). `binEdges` (201) dan `panels` (24) sudah berbatas sebelumnya.

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | rc 0, 0 keluaran | segar sesudah semua suntingan |
| Lint | `npx eslint` pada 11 berkas tersentuh (route, `_lib/figure.ts`, `_lib/limits.ts`, `common.schema.ts`, `safety.ts`, `tools.ts`, `figure-tools.ts`, `doc-tools.ts`, 3 berkas uji) | rc 0, 0 masalah | jalan pertama: 1 galat `no-explicit-any` di uji kontrak, diperbaiki dengan direktif beralasan |
| Uji baru merah dulu | `npx vitest run tests/unit/studio/mcp/secfix-mcp-paths-owner.test.ts` (sebelum kode) | `Tests 5 failed / 1 passed (6)` | L-2 x4 + pemilik bersama; 1 lulus = `studio_figure_preview .claude` yang memang sudah ditutup |
| Uji baru merah dulu | `npx vitest run tests/unit/studio/api/secfix-figure-preview.test.ts` (sebelum kode) | `Tests 10 failed / 2 passed (12)`; inline 5000 merender 8,4 s | lulus awal: batas 200 + topN (perilaku lama) dan agentId non-string 400 |
| Uji baru merah dulu | `secfix-chart-maxitems.test.ts` atas skema LAMA (salinan sebelum suntingan dipasang sementara lalu dipulihkan, `cmp` sama) | `Tests 13 failed / 3 passed (16)` | 3 lulus = batas produk/total route + pindai fixture |
| Uji baru merah dulu | baris `dirender:` MCP dimatikan sementara | `1 failed / 6 passed (7)` | lalu dipulihkan dari salinan |
| Uji baru hijau | 3 berkas `secfix-*` | 12/12, 16/16, 7/7 lulus | |
| MCP + API | `npx vitest run tests/unit/studio/mcp tests/unit/studio/api` | `Test Files 65 passed (65)`, `Tests 1225 passed (1225)`, 75 s, rc 0 | sesudah semua suntingan (termasuk perbaikan eslint uji) |
| Studio penuh | `npx vitest run tests/unit/studio` | `Test Files 192 passed (192)`, `Tests 3879 passed / 1 skipped (3880)`, 197 s, rc 0 | termasuk perubahan ENG-FIX saat itu |
| Konversi benchmark | `npx tsx --tsconfig tsconfig.json benchmark/extract/convert_v2.ts --check` | rc 0; `SAME` doc.v2.json, template.v2.json, datum-manual-000.preset.json | |
| Smoke DEV figur | `INTERNAL_API_SECRET=<berkas trial_internal_secret> STUDIO_MCP_FILE_ROOTS=<scratchpad>/secfix/smoke_root2 npx tsx scripts/studio/mcp/smoke-figures.ts --base-url http://127.0.0.1:9021 --mission 2026-11-02_secfix --agent-id cod-secfix` | rc 0, `"ok": true`, 11/11 langkah lulus; dokumen 015/GSP/KT/XI/2026 rev 1 -> 3; SCOPE_CONFLICT 409 basis lama; "rahasia tidak keluar" (9 hasil + stderr); 1 tulis, 0 di luar akar | jalan pertama gagal karena rahasia `.env` bukan rahasia DEV (401) dan path panjang ber-awalan `\?\` ditolak `CONFIG_INVALID`; keduanya lingkungan, bukan kode. Tidak ada 429 |

## Verification

- **M-1 (probe peninjau diulang, `probe_fig_render.ts`)**: sebelum: P-02 n=500 304 ms, n=2000 3589 ms, n=5000 **21669 ms**. Sesudah: n=500/2000/5000 -> `SCHEMA_INVALID /block/data/points must NOT have more than 200 items`; P-03 200 seri -> `SCHEMA_INVALID /block/data/series`; n=50 tetap dirender (26 ms); uji escape/maksud identik dengan sebelum.
- **M-1 (probe sesudah, `secfix/probe_secfix_after.ts`)**: inline 5000 ditolak skema dalam **0,8 ms**; figur TERSIMPAN 5000 / 20000 kategori (melewati skema) -> `BY_CONSTRUCTION_FAILED FIGURE_CAPACITY` dalam **0,2 ms**; inline 200 dirender 102 ms.
- **M-1 di DEV :9021 (route nyata)**: `POST .../figures/preview` blok 5000 kategori -> **400 dalam 0,027 s** `[{"pointer":"/block/data/points","keyword":"maxItems"}]`; pratinjau normal (pid) 200 dalam 0,025 s.
- **M-1 renderGate**: uji `antrean penuh -> 503 RENDER_QUEUE_FULL + Retry-After`, lalu 200 sesudah slot dilepas dan `running` kembali 0.
- **L-1**: uji 31 badan tidak sah -> 30 x 400 lalu 429; pemuat revisi tidak dipanggil.
- **L-2 (probe peninjau `probe_fig_mcp.ts` diulang di akar kosong baru)**: sebelum: `P7 ... calls=HEAD` (jaringan dipanggil; laporan 11 mencatat HEAD,GET + folder dibuat); sesudah: `P7 file_verify .claude: ok=false code=PATH_PROTECTED calls= dirCreated=false fileWritten=false`; akar `figsec_root_after` kosong (`ls -A` tanpa isi). P1-P6 identik dengan keluaran peninjau (diff hanya baris P7).
- **Review #6**: `grep` di uji: `figure-tools.ts` tanpa `function checkFigureOwner` dan tanpa `session.adopt(`, mengimpor `checkOwnership` dari `./doc-tools`; uji pemilik lama (`mcp-fig03b-figure-tools`: DOCUMENT_OWNED_BY_OTHER tanpa PATCH, adoptExisting -> DOCUMENT_ADOPTED; `mcp-doc-tools`/`mcp-d4-security`) tetap lulus.
- **Laporan pratinjau di DEV**: blok inline 12 kategori + `topN: 5` -> `data.items 12`, `rendered {code P-02, vertical, items 6}`, isu `DATUM-36(info), INTENT_APPLIED(info)`, `layoutIssueCount 0/2`. Figur tersimpan dengan label panjang -> `code P-02`, `rendered {code P-01, horizontal, items 8}` (AUTO_ORIENT).
- **Batas tidak memecah data nyata**: uji pindai fixture (`tests/parity/fixtures`, `benchmark/manual000`, `tests/perf`, `tests/fixtures`, `prisma`) = 0 pelanggaran; 52 blok `bm-fig-*.block.json` lolos skema v2 tanpa `maxItems`; `convert_v2 --check` SAME.

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Render dokumen penuh (R08 / `POST .../render`) tidak memeriksa batas kardinalitas route pratinjau | 0 (di luar lingkup baris) | Batas route hanya di `figures/preview`; render dokumen memakai `renderGate` (job) tetapi tanpa pra-cek butir. Figur yang tersimpan SEBELUM `maxItems` skema ini (bila ada) masih dapat dirender penuh | Kiriman baru (ingest/R16 PATCH) kini dibatasi skema v2, jadi celah hanya untuk data lama atau rujukan `artifactId` v1. Saran: panggil `chartCapacityIssues`/`diagramCapacityIssues` di `services/render/figures.ts` (milik baris lain) | Tidak |
| Mesin tetap sinkron di event loop | 0 | `renderGate` membatasi konkurensi/antrean, bukan waktu CPU per figur; satu render pada batas masih memblokir loop hingga ~0,2 s (chart) atau ~1,5 s (diagram graph 24 simpul) | Opsi peninjau (3) worker thread / anggaran waktu tidak dikerjakan (opsional, menyentuh mesin milik ENG-FIX) | Tidak |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| M-1 | Kode galat untuk figur di atas batas: tidak boleh menambah kode baru (enum `contract/errors.ts` di luar lingkup tulis) | `BY_CONSTRUCTION_FAILED` 422 (kode penolakan kapasitas mesin yang sudah ada) + `details.checkId = "FIGURE_CAPACITY"` + `issues[{ pointer, keyword: "maxItems", limit, actual, message }]`; pesan menyarankan `topN` atau pecah gambar. Blok inline ditolak lebih awal oleh skema (400 `SCHEMA_INVALID` maxItems) |
| M-1 | Batas 422 sebagai HTTP 422, bukan 200 `rendered:false` | Sesuai remediasi peninjau ("422 dengan saran topN"); penolakan mesin lain tetap 200 `rendered:false` seperti sebelumnya |
| M-1 | Perubahan perilaku: kiriman/pratinjau dengan > 200 kategori + `topN` kini ditolak (sebelumnya `topN` memangkas 20000 kategori dalam 15 ms) | Diterima: batas berlaku untuk data masukan (badan dan penyimpanan juga dibatasi), `topN` tetap untuk <= 200 kategori. Perlu diketahui controller/Hermes |
| M-1 | Batas diagram 24 simpul ketat dibanding batas chart | Didasarkan pengukuran (graph 32 simpul 2,4-4 s); semua keluarga lain sudah ditolak mesin pada 13-24 simpul. Bila produk membutuhkan diagram lebih besar, naikkan setelah mesin graph dipercepat (ENG-FIX) |
| M-1 | `maxItems` skema = konstanta `FIGURE_LIMITS` ditulis dua kali (skema kontrak tidak boleh mengimpor dari route) | Dikunci uji `secfix-chart-maxitems` (N lolos, N+1 ditolak di skema dan route, per bentuk) |
| L-2 | Selain pembantu bersama, `resolveAllowedPath(..., "write-dir")` kini juga menolak folder yang namanya sendiri folder instruksi (saran "lebih kokoh" peninjau) | Berlaku untuk kedua alat; cek khusus `figur.svg` di `figure-tools` dihapus karena tercakup |
| #6 | `checkOwnership` menerima objek teks `{ lead, resume, step }` (string lama tetap diterima) | Pesan figur dan langkah `GET /api/studio/documents/{id}` dipertahankan; rincian kini juga memuat `docNumber` (dari R05). Low #15 (adopsi sebelum basis/kiriman sukses) tidak diubah: tidak diminta |
| Laporan | `HINT_IGNORED` tetap dihitung `layoutIssueCount` | Sesuai saran peninjau: medan maksud yang tidak berlaku perlu dibuang agen. `CAPACITY_ADAPT` ikut menjadi info (adaptasi diagram yang lolos lint) |
| Smoke | Rahasia `.env` repo bukan rahasia DEV :9021 (401) | Memakai berkas rahasia uji `trial_internal_secret` (sama dengan baris FIX-H sebelumnya), dibaca ke env, tidak dicetak |

## Next Steps

- Review recommended (lingkup: `figures/preview/**`, `scripts/studio/mcp/{safety,tools,figure-tools,doc-tools}.ts`, `common.schema.ts` maxItems): re-cek sempit `security-review` dengan `probe_fig_render.ts` + `probe_fig_mcp.ts` (keduanya sudah diulang di sini).
- Opsional (baris lain): pra-cek batas yang sama di jalur render dokumen penuh (`services/render/figures.ts`).

