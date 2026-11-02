---
task_slug: doc_artifact_studio
row: FIG-03b
date: 2026-11-02
agent: coder-execution
status: complete
---

# 23 — FIG-03b: alat MCP pratinjau dan revisi SATU figur

Baris FIG-03b (urutan FIG-03 di D-482; aturan keamanan MCP D-480 sampai D-493). Repo `C:\Users\TRIAL\gsp-swarm-hq-v2.1`, branch `v2.1`, tanpa commit.
Kategori: Penyempurnaan (MCP + satu route baca saja). Agen: `coder-execution`. Skill: `tdd`, `backend-execution`, `verification-before-completion`.

## 1. Ringkasan

1. **Dua alat baru di toolset `documents` (11 -> 13 alat; versi server MCP 1.2.0 -> 1.3.0):**
   - `studio_figure_preview`: merender satu chart/diagram tanpa merender dokumen;
   - `studio_figure_revise`: menambal medan konten satu figur v2 tanpa mengirim ulang bab, lalu memratinjau revisi baru.
2. **Satu route baru, baca saja:** `POST /api/studio/documents/[id]/figures/preview`.
   - Tidak ada route lama yang dapat merender satu figur. R17 merender bab/dokumen dan menulis berkas. R09 membuat baris artefak dan berkas. R08 hanya memvalidasi skema chart/diagram.
   - Revisi memakai route yang sudah ada: R05 (pemilik), R16 GET (isi v2 di revisi basis), dan R16 PATCH `op: replace`. Tidak ada route tulis baru.
3. **Isu dan saran sampai ke agen.**
   - Chart: REPORT FIG-02a/02c. Isu `GEOM_*` membawa `suggest` dari mesin. Catatan tata letak tanpa saran mesin (`AUTO_ORIENT`, `LABEL_GUTTER`, `LABEL_DROPPED`, dan lain-lain) diberi saran baku route (`suggestSource: "hint"`) yang menyebut medan maksud D-482.
   - Diagram: `report.issues` ditambah `report.geometry` FIG-02b (catatan controller), misalnya `LABEL_LEADER` dengan `suggest`.
   - `AUTO_FIT`, `DATUM-36`, `FIGURE_LIMITS_DEFAULT`, dan `PARAM_ALIAS` ditandai `info: true`. Karena itu `layoutIssueCount` hanya menghitung masalah tata letak nyata.
4. **Postur keamanan sama dengan alat tulis lain:**
   - semua teks server ada di blok `<data-tak-tepercaya>` dengan `untrusted: true`, dan penanda dinetralkan;
   - aturan basis: `BASIS_MISSING` (tanpa jaringan), `BASIS_REBASED`, dan 409 `SCOPE_CONFLICT`;
   - aturan pemilik: `DOCUMENT_OWNED_BY_OTHER`, kecuali `adoptExisting`;
   - aturan path `downloadDir`.
5. **Medan maksud FIG-03a sudah ada di skema kontrak saat uji akhir** (`common.schema.ts:214-219`). Revisi `patch: { topN: 5 }` di DEV diterima (rev 3 -> 4). Lihat §6.
6. **Gerbang hijau (§5):**
   - `tsc` rc 0;
   - `eslint` rc 0 pada 16 berkas;
   - vitest MCP + route 143/143;
   - suite studio penuh: lihat §5.3;
   - smoke laporan, smoke dokumen, dan smoke figur baru semuanya lulus di DEV.
7. **Review direkomendasikan** (lingkup di §9): route baru dan dua alat MCP, termasuk re-cek keamanan sempit.

## 2. Tanda tangan alat (persis)

```text
studio_figure_preview {
  documentId: string (^[A-Za-z0-9_-]{1,64}$)        wajib
  pid?: string (^[a-z0-9][a-z0-9-]{2,63}$)
  address?: string (1..80; "3.1.4" atau "Gambar 3.1")
  block?: object (blok v2 chart/diagram; dry-run, tidak disimpan)
  rev?: integer 1..999999 (bawaan terkini)
  includeSvg?: boolean (SVG terpotong 6000 karakter, di blok tak tepercaya)
  downloadDir?: string (folder di akar STUDIO_MCP_FILE_ROOTS)
  overwrite?: boolean (hanya bersama downloadDir)
  agentId?: string
}  readOnlyHint=false (menulis berkas hanya dengan downloadDir), idempotentHint=true
   aturan: pid XOR address, atau block (+ salah satunya = dirender di posisi itu); tanpa ketiganya -> INVALID_ARGUMENT

studio_figure_revise {
  documentId: string                                 wajib
  pid?: string | address?: string                    tepat satu
  patch: object (minProperties 1)                    wajib
     chart:   data, caption, source, note, unit, dec, highlight, limit, keyRow, code, form, panels,
              orientation, sort, topN, otherLabel, labelShort
     diagram: spec, caption, source, keyRow
     null = hapus medan; caption/source/keyRow string -> { text }
  change: { what, why, impact }                      wajib
  baseRevisionNo?: integer (kosong = basis sesi, selain itu BASIS_MISSING)
  preview?: boolean (bawaan true)
  adoptExisting?: boolean
  agentId?: string
}  readOnlyHint=false, idempotentHint=false
```

Hasil pratinjau (`structuredContent`):

- `documentId`, `revisionNo`, `currentRevisionNo`, `rendered`, `issueCount`, `layoutIssueCount`;
- `figure`: `type`, `code`, `pid`, `address`, `label`, `inline`, `size { widthMm, heightMm, svgBytes }`, `issues[]` (maks 40: `checkId`, `status`, `detail`, `suggest`, `suggestSource`, `info`), `checksRun`, `data { shape, items, maxLabelChars }`;
- dengan `downloadDir`: `savedTo`, `bytes`, `sha256`, `alreadyPresent`, `backup`;
- dengan `includeSvg`: `svgTruncated`.

Hasil revisi: `pid`, `revisionNo`, `baseRevisionNo`, `changeScope`, `rebased`, `basisFromSession?`, `figure`, `issueCount`, `layoutIssueCount`, `completeness`, dan peringatan `PREVIEW_FAILED` / `BASIS_REBASED` / `DOCUMENT_ADOPTED`.

Route: `POST /api/studio/documents/[id]/figures/preview`, badan `{ pid? | address?, block?, revisionNo?, svg?, agentId? }`. Didokumentasikan di `docs/API-REFERENCE.md` §12 (baris tabel dan bucket kuota `render`).

## 3. Arsitektur

- **Route pratinjau** (`src/app/api/studio/documents/[id]/figures/preview/`):
  - Urutan: `requireSession` -> `reqCtx` (x-correlation-id, log JSONL tahan lama `studio.api.fig03b`) -> badan (`_lib/request.ts`; kunci asing ditolak; `block` divalidasi `validateBlockV2` yang sama dengan R16) -> `getStudioCaller` -> `checkRenderRate` (bucket `render`, sama dengan R06/R16 PATCH; `withQuotaHeaders`) -> muat revisi (`_lib/load.ts`) -> render (`_lib/figure.ts`).
  - Pemuatan revisi memakai dua `findUnique` dan `resolveTemplate` tersemat, sama dengan `prepareScopeRender`. Snapshot diperiksa `asAnySnapshot`.
  - Render memakai jalur yang SAMA dengan `buildFigures`: chart lewat `chartSvg(spec, templateForDoc(tpl, doc))`; diagram lewat `buildDiagramSvg(spec, { release: false, grid: figureGrid(params) })` dan `diagramSpecForBlock`. Rujukan `{ artifactId }` dibaca lewat `ArtifactSpecReader`.
  - Blok inline disusun `mapBlock` compose dengan konteks compose tersimpan di snapshot (`snapshot.compose`: parameter slot sasaran). Akibatnya lebar figur (`chart.output.widthMm` slot) dan id `Gambar n.m` sama dengan kiriman nyata.
  - Tidak ada job, berkas, atau baris DB (D-322). Uji route membuktikan `dbWrites() == []`.
  - Penolakan mesin (`StudioEngineError` < 500, mis. `CHART_KIND_UNKNOWN`, `BY_CONSTRUCTION_FAILED` P1-title) dijawab 200 `rendered: false` + kode. Galat lain lewat `failure` (500 tanpa stack, tercatat).
- **Alat MCP** (`scripts/studio/mcp/figure-tools.ts`, didaftarkan lewat `FIGURE_TOOLS` di `tools.ts`). Pembantu `doc-tools.ts` yang dipakai ulang kini diekspor (tanpa perubahan perilaku): `requireBasis`, `rememberRevision`, `withWarnings`, `adoptedWarning`, `existingData`, `bodyAgentId`, `requesterOf`, `CHANGE`, `BASE_REV`, `ADOPT`.
  - Alur revisi:
    1. `requireBasis` (tanpa jaringan);
    2. R05 pemilik (`document.createdBy` vs `agent:<agentId>`; adopsi diingat sesi);
    3. bila diberi `address`: pid dicari lewat pratinjau di revisi basis (v1 tanpa pid -> `INVALID_ARGUMENT`);
    4. R16 GET `?rev=basis`;
    5. jenis dan medan `patch` dicek per jenis;
    6. gabung;
    7. R16 PATCH `replace`;
    8. `rememberRevision` (aturan N-1);
    9. pratinjau revisi baru (gagal -> peringatan `PREVIEW_FAILED`, revisi tetap tersimpan).
  - Kunci `patch` yang bukan konten figur ditolak SEBELUM jaringan. Penolakan ada di kode, bukan di skema, agar `tools/list` bawaan tetap < 30 KB.
- **Resep dan instruksi:**
  - Resource `studio://resep/dokumen-klien` mendapat paragraf grafik/diagram.
  - `instructions` toolset `documents` mendapat satu kalimat: "Grafik/diagram: studio_figure_preview -> studio_figure_revise".
- **Smoke baru** `scripts/studio/mcp/smoke-figures.ts`.

## 4. Perubahan per berkas

| Berkas | Jenis | Isi |
|---|---|---|
| `src/app/api/studio/documents/[id]/figures/preview/route.ts` | add | Route POST pratinjau (sesi, laju, log, galat terstruktur) |
| `.../figures/preview/_lib/request.ts` | add | Validasi badan |
| `.../figures/preview/_lib/load.ts` | add | Muat dokumen, revisi, dan templat tersemat (baca saja) |
| `.../figures/preview/_lib/figure.ts` | add | Cari blok, susun inline, render, isu + saran (`FIT_HINTS`, `INFO_CODES`), `report.geometry` diagram, ringkasan data |
| `scripts/studio/mcp/figure-tools.ts` | add | `studio_figure_preview`, `studio_figure_revise` |
| `scripts/studio/mcp/smoke-figures.ts` | add | Smoke stdio figur di DEV |
| `scripts/studio/mcp/doc-tools.ts` | modify | Ekspor pembantu yang dipakai ulang (tanpa perubahan perilaku) |
| `scripts/studio/mcp/tools.ts` | modify | Impor dan daftarkan `FIGURE_TOOLS` |
| `scripts/studio/mcp/server.ts` | modify | Kalimat instruksi figur (toolset documents) |
| `scripts/studio/mcp/resources.ts` | modify | Paragraf figur di resep dokumen klien; catatan tulis SVG |
| `scripts/studio/mcp/config.ts` | modify | `MCP_SERVER_VERSION` 1.3.0 |
| `scripts/studio/mcp/smoke-documents.ts` | modify | Harapan `tools/list` 11 -> 13 |
| `tests/unit/studio/mcp/mcp-fig03b-figure-tools.test.ts` | add | 13 uji (cermin mcp-d4/d5-security untuk alat baru) |
| `tests/unit/studio/api/fig03b-figure-preview.test.ts` | add | 10 uji (mesin asli + route dengan pemuat di-mock) |
| `tests/unit/studio/mcp/mcp-doc-tools.test.ts` | modify | Toolset documents 13 alat; batas `documents` < 19 KB (`reports`/`query` tetap < 17 KB; bawaan tetap < 30 KB) |
| `tests/unit/studio/mcp/mcp-server.test.ts` | modify | 22 alat (nama + `TOOLS` length) |
| `docs/STUDIO-MCP.md` | modify | Asal, daftar kode, §4 dua baris alat, §4.1 paragraf Figur + kode baru, §4.2 toolset + tabel ukuran, §6 tulis berkas, §7 uji/smoke |
| `docs/API-REFERENCE.md` | modify | §12: baris route baru + bucket kuota `render` |

## 5. Gerbang (keluaran segar, 2026-11-02)

### 5.1 Statis

| Gerbang | Perintah | Hasil |
|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | rc 0, 0 baris `error TS` (jalan sesudah suntingan terakhir) |
| Lint | `npx eslint` pada 16 berkas tersentuh (route + `_lib` x3, `figure-tools`, `doc-tools`, `tools`, `server`, `resources`, `config`, `smoke-figures`, `smoke-documents`, 4 berkas uji) | rc 0, 0 masalah (2 peringatan awal, impor `READ` tak terpakai dan direktif eslint tak terpakai, sudah diperbaiki) |

### 5.2 Uji unit

| Perintah | Hasil |
|---|---|
| `npx vitest run tests/unit/studio/mcp tests/unit/studio/api/fig03b-figure-preview.test.ts` | `Test Files 9 passed (9)`, `Tests 143 passed (143)` |
| `npx vitest run tests/unit/studio` (latar, sesudah suntingan terakhir) | `Test Files 183 passed (183)`, `Tests 3799 passed \| 1 skipped (3800)`, rc 0, 199 s |

TDD:

- Alat MCP: 13 uji ditulis lebih dulu dan gagal semua (`Tests 13 failed (13)`) sebelum `figure-tools.ts` ada.
- Uji `report.geometry` diagram dibuktikan merah (1 gagal) dengan penggabungan dimatikan, lalu hijau sesudah dipulihkan.
- Uji route lain ditulis tepat sesudah kode route (bukan merah lebih dulu). Dicatat jujur.

Uji yang lebih dulu mengunci jumlah alat ikut diperbarui: `mcp-doc-tools` (11 -> 13; batas toolset `documents` 17 KB -> 19 KB) dan `mcp-server` (20 -> 22).

### 5.3 Smoke stdio di DEV `http://127.0.0.1:9021`

DEV adalah `next dev`, jadi route baru langsung aktif. Rahasia dibaca dari berkas ke env proses dan tidak dicetak. Setiap smoke memakai folder akar temp kosong. Ada jeda 20 detik antarjalan. Tidak ada 429.

| Smoke | Perintah | Hasil |
|---|---|---|
| Laporan | `INTERNAL_API_SECRET=<berkas> npx tsx scripts/studio/mcp/smoke.ts --base-url http://127.0.0.1:9021 --mission 2026-11-02_fig03b --agent-id cod-fig03b` | rc 0, 17 LULUS / 0 GAGAL, `SEMUA LULUS (5.5 s)`; laporan 067/GSP/LAP/XI/2026 rev6 COMPLETE; "rahasia tidak ditemukan" |
| Dokumen | `... STUDIO_MCP_FILE_ROOTS=<temp> npx tsx scripts/studio/mcp/smoke-documents.ts ... --mission 2026-11-02_fig03b --agent-id cod-fig03b` | rc 0, 22/22 `ok`; server 1.3.0, `tools/list` 13 alat 18.181 B; dokumen 013/GSP/KT/XI/2026 COMPLETE; DOCX + HTML sha256 cocok; pdf 503 dengan saran format (diharapkan) |
| Figur (baru) | `... npx tsx scripts/studio/mcp/smoke-figures.ts ... --mission 2026-11-02_fig03b --agent-id cod-fig03b` | rc 0, 11/11 LULUS (2,5 s); rincian di bawah |

Langkah smoke figur (jalan kedua, sesudah suntingan; jalan pertama juga lulus, dokumen 012/GSP/KT/XI/2026):

```text
LULUS tools/list -> 13 alat, 18181 B
LULUS studio_document_create -> dokumen cmvyzjoba00ulv1wkuggurddw 014/GSP/KT/XI/2026 rev 1
LULUS studio_chapter_submit (grafik padat) -> rev 2; grafik pid p-tvvef65k4p alamat 1.1.2; basis sesi 1
LULUS studio_figure_preview (sebelum) -> 2 isu tata letak / 4 total [DATUM-36, AUTO_FIT, AUTO_ORIENT, LABEL_GUTTER], 2 bersaran, 128x63.6 mm
LULUS studio_figure_preview inline (dry-run) -> 1 isu tata letak [DATUM-36, AUTO_FIT, AUTO_ORIENT]; tidak disimpan
LULUS studio_figure_preview downloadDir -> SVG 4172 B -> ...\fig03b_root2\figur\cmvyzjoba00ulv1wkuggurddw-p-tvvef65k4p-rev2.svg
LULUS studio_figure_revise (basis sesi) -> rev 2 -> 3; 1 isu tata letak [DATUM-36, AUTO_FIT, AUTO_ORIENT]
LULUS studio_figure_preview (sesudah) -> isu tata letak 2 -> 1 (total 4 -> 3)
LULUS studio_figure_revise basis lama -> galat SCOPE_CONFLICT httpStatus 409 untrusted true; revisi tetap 3
LULUS rahasia tidak keluar -> dipindai 9 hasil alat + stderr server
LULUS tulis berkas hanya di akar -> 1 tulis tercatat, 0 di luar akar
```

Teks pratinjau nyata (probe DEV, dokumen di atas, rev 3):

```text
pratinjau figur chart P-02 pid p-tvvef65k4p alamat 1.1.2: dokumen cmvyzjoba00ulv1wkuggurddw rev 3 (terkini 3); 128 x 63.6 mm, SVG 3621 B; 1 isu tata letak (+2 info), di blok di bawah
  data: categorical 8 butir, label terpanjang 14 karakter
<data-tak-tepercaya sumber="studio" jenis="isu-figur" documentId="cmvyzjoba00ulv1wkuggurddw">
label: Gambar 1.1
- DATUM-36 (info): keterangan dan SUMBER dicetak halaman (apparatus page)
- AUTO_FIT (info): cacat geometri terdeteksi (2); tata letak otomatis -> sisa 0
- AUTO_ORIENT: P-02 -> tata letak batang horizontal P-01 (...) | saran: label kategori tidak muat sebagai kolom: persingkat label (labelShort) atau tetapkan orientation horizontal
</data-tak-tepercaya>
```

Probe DEV tambahan:

1. **Diagram inline** (`dg_topology` paritas, di posisi pid yang sama): `rendered true`, `type diagram`, `code topology`, 3 isu (2 tata letak). Isu itu `AUTO_FIT` (info), `ZONE_LABEL_CLAMP`, dan `LABEL_LEADER` dengan saran "persingkat label tepi (maks ~20 karakter)". Jadi `report.geometry` FIG-02b sampai ke agen.
2. **Caption diagram tanpa titik**: `rendered false`, `BY_CONSTRUCTION_FAILED` (`P1-title`). Ini jalur penolakan mesin.
3. **`studio_figure_revise patch { topN: 5 }`**: diterima, rev 3 -> 4 (medan maksud FIG-03a sudah ada di skema).

### 5.4 Ukuran toolset `documents` (beban per giliran)

Diukur dengan `npx tsx scripts/studio/mcp/measure.ts --toolsets documents` dan `--toolsets all` (stdio nyata, tanpa rahasia).

Baris "sebelum" dihitung dari keluaran yang sama: dua entri alat figur (+2 koma) dan kalimat instruksi figur (69 B) dikurangkan. Angka D1 di dokumen (14.992 B) sudah tidak terkini karena D3-D6.

| Konfigurasi | Alat | `tools/list` (B) | instructions (B) | per giliran (B / ~token) |
|---|---|---|---|---|
| `documents` sebelum FIG-03b | 11 | 15.655 | 901 | 16.556 / ~4.139 |
| `documents` sesudah | 13 | 18.181 | 970 | 19.151 / ~4.788 (+2.595 B, +15,7 %) |
| semua toolset sesudah | 22 | 29.913 | 1.260 | 31.173 / ~7.794 |

Per alat: `studio_figure_preview` 1.098 B (~275 token), `studio_figure_revise` 1.426 B (~357 token). Deskripsi dipadatkan dari 1.407 + 1.747 B awal agar `tools/list` bawaan tetap < 30 KB.

Hasil alat tipikal di smoke: pratinjau 2,2-2,9 KB, revisi + pratinjau 3,9 KB. Bandingkan dengan mengirim ulang bab (4,4 KB) ditambah render dokumen penuh.

## 6. Verifikasi per kriteria brief

| Kriteria | Bukti |
|---|---|
| Pratinjau satu figur via pid/address atau blok inline tanpa simpan | Uji route `findFigureBlock` + inline; smoke langkah 4-5; uji route membuktikan `dbWrites() == []` |
| Laporan isu (AUTO_ORIENT, LABEL_DROPPED, REPORT) dengan `suggest`, ukuran, SVG opsional ke sandbox | Uji `chart padat` (AUTO_ORIENT `suggestSource: hint`); uji diagram `report.geometry`; smoke `2 bersaran`; `downloadDir` uji + smoke langkah 6 |
| SVG tidak inline bawaan; opsi terpotong + untrusted | Uji `includeSvg` (≤ 6000, `figure.svg` di `untrustedFields`, tidak ada `<svg` di luar blok); badan route tanpa `svg` bawaan |
| Revisi medan konten satu figur tanpa kirim ulang bab | Uji jalur normal (badan PATCH R16 `replace` persis; `null` menghapus; string -> `{ text }`); smoke langkah 7 |
| Basis: `baseRevisionNo` / basis sesi, `BASIS_MISSING`, `BASIS_REBASED` | Uji `BASIS_MISSING` tanpa jaringan; basis sesi 4 dipakai revisi kedua; `rebased:true` -> `BASIS_REBASED` + `basisForgotten`, lalu `BASIS_MISSING` |
| Basis lama -> konflik | Uji 409 `SCOPE_CONFLICT` (isi pihak lain hanya di blok); smoke langkah 9 di DEV: 409 `SCOPE_CONFLICT`, revisi tetap 3 |
| `DOCUMENT_OWNED_BY_OTHER` kecuali `adoptExisting` | Uji: tanpa PATCH, label pemilik ber-spoof hanya di blok; adopsi -> `DOCUMENT_ADOPTED` |
| Teks server di blok + `untrusted: true` + netralisasi penanda | Uji pratinjau, inline/`rendered:false`, SVG, konflik: `ABAIKAN` tidak ada di luar blok, `&lt;/[penanda-dinetralkan]>` di blok, tidak ada `</data-tak-tepercaya>` di `structuredContent` |
| Aturan path `downloadDir` | Uji: `FILE_WRITE_DISABLED`, UNC `//evil-host/...` tanpa panggilan fs ke host itu, luar akar `PATH_OUTSIDE_ROOTS`, folder `.claude` `PATH_PROTECTED` sebelum jaringan, tulis eksklusif, `alreadyPresent`, `OUT_EXISTS`, `overwrite` + cadangan |
| Deskripsi pendek; ukuran toolset diukur | §5.4 |
| Route baru mengikuti konvensi | `requireSession` + `getStudioCaller`, `reject`/`failure` terstruktur + `x-correlation-id` (uji), `checkRenderRate` + `withQuotaHeaders`, baca saja, API-REFERENCE §12 |

## 7. Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Batas uji pemadatan per toolset 17 KB tidak cukup untuk `documents` | 1 | Dua alat menambah 2,5 KB; `documents` sesudah = 18.181 B | Batas `documents` dinaikkan ke 19 KB di uji; `reports`/`query` tetap 17 KB; bawaan tetap < 30 KB (29.913 B, sisa ~87 B) | Tidak (perlu diketahui controller: sisa ruang `tools/list` bawaan hampir habis) |
| `resolveAllowedPath(..., "write-dir")` tidak menolak folder yang NAMANYA folder instruksi (mis. `<akar>/.claude`) sebelum jaringan | 1 | `assertNotProtected` hanya memeriksa basename sebagai berkas dan segmen induk | Di alat figur ditutup (cek tambahan `path.join(dir, "figur.svg")` sebelum jaringan). `studio_file_verify` (lama) tetap: tulis tetap ditolak `writeFileGuarded`, tetapi sesudah unduhan. Tidak diubah karena di luar baris ini | Tidak (Low, pra-ada) |

## 8. Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| Route | Tidak ada route yang merender satu figur | Satu route baca saja `POST /api/studio/documents/[id]/figures/preview` (diizinkan brief); revisi memakai R05/R16 yang ada |
| Inline tanpa dokumen | Pratinjau inline memerlukan templat (lebar figur, batas tinggi) | `documentId` wajib, juga untuk inline (konteks templat + compose dokumen). Pratinjau tanpa dokumen tidak dibangun; agen dapat membuat dokumen lebih dulu (murah, idempoten). **Butuh keputusan controller** bila tetap diinginkan |
| Saran | Mesin hanya memberi `suggest` untuk `GEOM_*`; catatan fit tanpa saran | Saran baku route (`FIT_HINTS`, `suggestSource: "hint"`) yang menyebut medan maksud D-482; catatan informatif `info: true` + `layoutIssueCount` |
| Diagram | FIG-02b menaruh temuan di `report.geometry` (catatan controller) | Digabung ke `issues` pratinjau (issues lalu geometry), dibungkus seperti teks server lain; uji merah-hijau + probe DEV |
| Revisi via alamat | R06 GET pada dokumen v2 tidak memberi isi v2/pid | `address` -> pid lewat route pratinjau di revisi basis, lalu R16; v1 -> `INVALID_ARGUMENT` |
| Kunci `patch` | `propertyNames` di skema menambah ~200 B per giliran | Dicek di kode sebelum jaringan (sama efeknya: `INVALID_ARGUMENT`, 0 jaringan) |
| Penolakan mesin | Galat mesin adalah hasil pratinjau yang berguna | 200 `rendered: false` + kode; MCP: hasil sukses, kode aman di kepala, pesan di blok |
| Medan maksud FIG-03a | Belum ada saat mulai; ada saat uji akhir | Diteruskan apa adanya ke R16; skema kontrak memvalidasi. DEV `topN: 5` diterima |
| Kode baru | SVG tidak dikirim untuk `downloadDir` | Kode MCP `SVG_UNAVAILABLE`; peringatan `PREVIEW_FAILED` (didokumentasikan §4.1) |
| Artefak DEV | Dokumen baru di misi `2026-11-02_fig03b` | 012, 013, 014/GSP/KT/XI/2026 dan laporan 067/GSP/LAP/XI/2026; dokumen 014 sampai rev 4 (probe `topN`). Folder akar temp dihapus sesudah uji |

## 9. Langkah berikut

- Review direkomendasikan (`senior-code-reviewer` + re-cek `security-review` sempit). Lingkup:
  - route `figures/preview` dan `_lib` (baca saja, laju, galat);
  - `figure-tools.ts` (blok tak tepercaya, basis/pemilik, `downloadDir`);
  - ekspor pembantu `doc-tools.ts`.
- Keputusan controller: pratinjau inline tanpa dokumen (§8) dan sisa ruang `tools/list` bawaan (§7).
- Uji Hermes U-DOC dapat mencabut tanda `[menunggu FIG-03]` di brief dokumen (D-490) sesudah review.
