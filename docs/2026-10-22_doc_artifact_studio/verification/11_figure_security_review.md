---
task_id: FIG-03-SEC
task_slug: doc_artifact_studio
row: Review keamanan FIG-03a/FIG-03b (pratinjau/revisi figur)
date: 2026-11-02
agent: security-review
source: research/22_fig03a_report.md; research/23_fig03b_report.md; verification/09_mcp_d3_security_recheck.md; D-480..D-493
status: needs-review
verdict: CAUTION
---

# Review Keamanan Fitur Pratinjau/Revisi Figur (FIG-03a, FIG-03b)

## 1. Ringkasan

| Butir | Nilai |
|---|---|
| Vonis keseluruhan | **CAUTION**: 0 High, 1 Medium, 3 Low |
| Area 1: route `POST /api/studio/documents/[id]/figures/preview` | **CAUTION**. Authn/authz setara route tetangga, validasi masukan lengkap, tidak ada kebocoran galat, tidak ada SSRF/path, dan benar-benar tanpa tulis. Masalahnya ketersediaan: render sinkron tanpa gerbang render dan tanpa batas jumlah kategori (M-1). Validasi berjalan sebelum tagihan laju (L-1) |
| Area 2: alat MCP `studio_figure_preview` / `studio_figure_revise` | **PASS**. Blok tak tepercaya, aturan N-4, SVG `includeSvg`, aturan basis, pemilik, `downloadDir`, dan pembatasan `patch` sesuai postur D-480..D-493. Celah pra-ada `studio_file_verify` terkonfirmasi (L-2, Low, di luar alat figur) |
| Area 3: medan maksud chart (`orientation`, `sort`, `topN`, `otherLabel`, `labelShort`) | **PASS**. Batas ditegakkan di skema v2, skema v1 `intent`, dan mesin (`assertIntentShape`). Escape XML benar, termasuk `<title>`. `topN` justru mengurangi biaya render |
| Ketidaksesuaian GDPR | 0. Dimensi dilewati (alasan di bawah) |
| Celah kontrol ISO 27001 | A.12.1.3 kapasitas/ketersediaan: GAP (M-1). A.9 PARTIAL: tanpa ACL per dokumen, setara tetangga, model penyewa tunggal (L-3) |
| Tingkat review | **L3**, audit mendalam. Isinya: baca kode route, `_lib`, alat MCP, helper `doc-tools`/`tool-kit`/`safety`, skema kontrak, dan mesin `intent.ts`/`render.ts`. Ditambah probe mesin asli tanpa DB dan probe `executeTool` dengan fetch tiruan |
| Dimensi dilewati | GDPR / ISO 27701: fitur hanya merender figur yang sudah tersimpan, atau blok inline milik pemanggil. Tidak ada medan PII, penyimpanan, retensi, atau aliran data pribadi baru, dan pratinjau tidak menyimpan apa pun. ISO A.10 dan A.13: tidak ada perubahan kripto/TLS/jaringan. Klien MCP tetap memakai origin `STUDIO_BASE_URL` lewat `guardedFetch`. ISO A.16 dan A.18: tidak ada perubahan proses insiden atau kepatuhan |

Metode dan batas:

- Berkas baru dibaca utuh: route + `_lib/{figure,load,request}.ts`, `figure-tools.ts`, `tool-kit.ts`, `doc-tools.ts`.
- Berkas terlacak diperiksa lewat `git diff`: `tools.ts`, `server.ts`, `resources.ts`, `config.ts`, `safety.ts`, skema kontrak, `render.ts`.
- Probe ada di scratchpad di luar repo: `probe_fig_render.ts` (mesin asli, tanpa DB) dan `probe_fig_mcp.ts` (`executeTool` + fetch tiruan + akar temp kosong `figsec_root`). Rahasia uji palsu dan disensor dari keluaran.
- Tidak menyentuh DEV, DB, port 9011, atau `.env`. Tidak ada kode yang diubah. `src/lib/studio/engine/diagram/**` tidak dibaca maupun diubah. Karena itu biaya render diagram tidak diukur, hanya chart.

Uji (segar, 2026-11-02 15:42):

- Perintah: `npx vitest run tests/unit/studio/mcp tests/unit/studio/api/fig03b-figure-preview.test.ts tests/unit/studio/contract/fig03a-chart-intent-schema.test.ts tests/unit/studio/figures/fig03a-chart-intent.test.ts`
- Hasil: `Test Files 11 passed (11)`, `Tests 175 passed (175)`, rc 0.

## 2. Tabel Temuan

| ID | Severity | Tipe | Lokasi | Deskripsi | Remediasi |
|---|---|---|---|---|---|
| M-1 | Medium | CWE-400 / CWE-770 (konsumsi sumber daya tanpa batas); OWASP A04; ISO A.12.1.3 | `src/app/api/studio/documents/[id]/figures/preview/route.ts:62` (render sinkron di handler); `_lib/figure.ts:203-205` (`chartSvg`); `src/lib/studio/contract/schema/v2/common.schema.ts:231,237` (`points`/`categories` tanpa `maxItems`); `src/lib/studio/engine/chart/core/render.ts` (`renderPreset`: render + lint geometri + autofit berulang). Pembanding: `src/app/api/studio/validate/_shared/dry-run.ts:116` dan `documents/[id]/render/route.ts:36` memakai gerbang render | Route pratinjau merender di event loop proses Next.js tanpa `renderGate()`/`assertCapacity`. Jumlah kategori hanya dibatasi badan 5 MiB (`STUDIO_MAX_JSON_BYTES`). Probe P-02 inline (tanpa DB): n=50: 28 ms; n=500: 304 ms; n=2000: 3,6 s; n=5000 (badan 151 KB): **21,7 s**. Pertumbuhannya super-linear. **Skenario:** pengguna terautentikasi mana pun (sesi HQ/Google, atau pemegang `x-internal-secret` lewat MCP `studio_figure_preview { block }`) mengirim beberapa blok P-02 berisi ribuan kategori. Setiap permintaan memblokir seluruh proses HQ belasan detik sampai menit (semua route, bukan hanya Studio). Batas 30/menit per identitas tidak mencegahnya, karena satu permintaan sudah cukup. Pemegang rahasia internal berbagi satu ember, tetapi dapat mengirim 30 dalam semenit. Figur tersimpan (pid) dapat dibuat sama beratnya lewat R16 PATCH (tanpa render, D-247) lalu dipratinjau berulang | (1) Pra-cek kardinalitas di route sebelum render, misalnya kategori/titik ≤ 500, seri × kategori ≤ 5000, simpul ≤ 300, dan 422 dengan saran `topN`. Lebih baik lagi `maxItems` di skema v2 `ChartDataV2` agar kiriman nyata juga terbatas. (2) Jalankan render lewat `renderGate().run(...)` seperti R08 `?preview=html` (503 `RENDER_QUEUE_FULL` bila penuh). (3) Opsional: anggaran waktu/worker thread untuk mesin chart. **Verifikasi:** ulangi `probe_fig_render.ts`; n=5000 harus ditolak < 50 ms; uji route baru untuk batas dan 503 |
| L-1 | Low | CWE-770 (kerja tanpa tagihan) | `route.ts:44-54` | `readJsonObject` + `parsePreviewBody` (ajv `validateBlockV2` atas badan sampai 5 MiB) berjalan SEBELUM `getStudioCaller` + `checkRenderRate`. Validasi skema berat tidak ditagih kuota. R16 PATCH menagih dulu, baru `patchPid` memvalidasi. **Skenario:** banjir badan 5 MiB yang sengaja tidak sah membebani CPU tanpa pernah kena 429 | Pindahkan `getStudioCaller` + `checkRenderRate` tepat sesudah `readJsonObject` (`agentId` dibaca polos dari badan seperti R16), lalu validasi. **Verifikasi:** uji 31 badan tidak sah dalam satu jendela menghasilkan 429 |
| L-2 | Low (pra-ada, terkonfirmasi) | CWE-73 / urutan validasi; M-1(b) MCP-04 | `scripts/studio/mcp/tools.ts:848` (cek folder pra-jaringan tanpa cek nama folder instruksi), `:849,867` (HEAD + GET unduhan), `:880` (`mkdirp`), `:884` (`writeFileGuarded` menolak) | `studio_file_verify { downloadDir: "<akar>/.claude" }` lolos `resolveAllowedPath(..., "write-dir")`, karena `assertNotProtected` hanya memeriksa nama berkas dan segmen induk. Probe P7: `calls=HEAD,GET`, folder kosong `<akar>/.claude` **dibuat**, lalu `PATH_PROTECTED`, tanpa berkas yang ditulis. Dampak: unduhan sia-sia dan folder instruksi kosong muncul di akar kerja. Beberapa agen menganggap keberadaan `.claude/` sebagai konfigurasi proyek. Tidak ada isi yang ditulis. Alat figur sudah menutupnya (`figure-tools.ts:143`, probe P6: 0 panggilan). Catatan hardening: di kedua alat, `mkdirp` berjalan sesudah jeda jaringan, jadi ada jendela TOCTOU junction untuk folder kosong di luar akar. Penulisan berkas tetap divalidasi ulang di `writeFileGuarded` | Tambahkan cek yang sama dengan `figure-tools.ts:143` (`resolveAllowedPath(path.join(dir, "x"), …, "write-dir")`) sebelum HEAD. Lebih kokoh: ubah `assertNotProtected` pada tujuan `write-dir` agar basename folder juga dicocokkan ke `PROTECTED_DIRS`. Validasi ulang `dir` tepat sebelum `mkdirp`. **Verifikasi:** probe P7 harus `calls=` kosong dan `dirCreated=false` |
| L-3 | Low (setara tetangga, pra-ada) | CWE-639 / OWASP A01; ISO A.9.4.1 | `route.ts:35-55` (`requireSession` + `getStudioCaller`, tanpa cek akses dokumen); `_lib/figure.ts:199-205` + `src/lib/studio/services/render/figures.ts:48-79` (`ArtifactSpecReader` membaca artefak apa pun menurut id) | Setiap identitas terautentikasi dapat mempratinjau dokumen mana pun berdasarkan id. Lewat blok inline `{ type: "chart", artifactId }` (diizinkan skema `ChartV2`/`DiagramV2`), ia juga dapat merender artefak mana pun, dengan `svg: true` mengembalikan isinya. Galat `ARTIFACT_NOT_FOUND` vs `REGISTRY_KIND_UNKNOWN` membocorkan keberadaan id. Ini setara GET R05/R16/blocks/content dan daftar R09, yang hanya `requireSession`: model Studio memang satu organisasi tanpa ACL per dokumen. Jadi tidak ada eskalasi baru, tetapi route ini menambah satu jalur baca artefak lintas dokumen | Tidak perlu tindakan bila model penyewa tunggal dipertahankan. Catat sebagai risiko diterima. Bila ACL per dokumen/artefak diperkenalkan kelak, tambahkan pemeriksaan di `loadFigureContext` dan `ArtifactSpecReader`, atau batasi `artifactId` inline ke artefak yang dirujuk revisi dokumen itu. **Verifikasi:** uji pemanggil tanpa hak menerima 404 |

Residu yang diwarisi (bukan temuan baru): `studio_figure_revise` memakai cek pemilik yang sama (`createdBy === agent:<agentId>`). Identitas agen dideklarasikan sendiri bila `STUDIO_MCP_LOCK_AGENT_ID` mati. USER sudah menerima risiko ini di D-492 butir (1) (L-4 laporan 09), jadi tidak diangkat ulang.

## 3. Hasil Gerbang (security-review-gate)

| Cek | Hasil | Rincian |
|---|---|---|
| Credential leak | **PASS** | Tidak ada rahasia di diff. Route tidak mencetak env. Alat MCP lewat `redactSecret` di `server.ts`. Probe memakai rahasia palsu, yang tidak muncul di keluaran. `describeConfig` hanya mencetak status terisi |
| Destructive operation | **PASS** | Route pratinjau tanpa tulis: `_lib/load.ts:163-172` hanya `findUnique` x2 + `resolveTemplate`, yang baca saja (`services/templates/index.ts:776-783`). `ArtifactSpecReader` hanya `findUnique`. `grep create\|update\|upsert\|delete\|writeFile\|mkdir` pada folder route: 0 hasil. Uji route `dbWrites() == []`. Satu-satunya efek samping adalah log JSONL `apiLog`, yang memang dimaksudkan (A.12.4). Revisi hanya lewat R16 PATCH yang ada, dengan basis + pemilik. Tulis lokal hanya `downloadDir`: eksklusif `wx`, cadangan sebelum timpa |
| External call | **PASS** | Klien MCP hanya ke origin `STUDIO_BASE_URL` (`guardedFetch`, `redirect: manual`). Route tidak melakukan panggilan keluar. SSRF/path: `request.ts:127-128` hanya menerima `chart`/`diagram`. Skema chart/diagram tidak punya medan URL/aset (`grep url\|href\|asset\|icon\|image` pada `chart.schema.ts`/`diagram.schema.ts`: hanya `$id` skema). Rujukan `artifactId` dibaca dari DB menurut id, bukan path/URL |
| Injection | **PASS** | SVG/XML: probe label `A</title><script>…&"x`, `otherLabel` `<svg onload=x>&"`, dan `labelShort.short` `<b>&"` tidak menghasilkan `<script`, `<svg onload`, atau `<b>` mentah. `<title>` berisi `A&lt;/title&gt;&lt;script&gt;…`. Injeksi prompt: semua teks asal server ada di blok bertanda (probe P1/P2/P4: `ABAIKAN_outside=false`). Tidak ada shell/SQL/eval |
| Permission escalation | **PASS** (catatan L-3) | Tidak ada hak baru. Route memakai `requireSession` + `getStudioCaller`, sama dengan tetangga. Revisi menolak dokumen milik pemanggil lain kecuali `adoptExisting` (probe P4: `DOCUMENT_OWNED_BY_OTHER`, PATCH=0). Templat terbatas: pratinjau memakai templat tersemat revisi yang sudah ada, setara render ulang |
| Dimensi tambahan: ketersediaan (OWASP A04 / CWE-400) | **CAUTION** | M-1 (render sinkron tanpa gerbang/batas), L-1 (validasi tanpa tagihan) |

## 4. Rincian per Area

### 4.1 Route pratinjau (Area 1) - CAUTION

| Pertanyaan brief | Jawaban | Bukti |
|---|---|---|
| Paritas authn/authz dengan route tetangga | Ya. Tanpa ACL per dokumen di mana pun (L-3) | `route.ts:35,52`; tetangga `blocks/[address]`, `paragraphs/[pid]`, `revisions`, `render`, `content`, `structure` (`grep requireSession\|getStudioCaller`). `getStudioCaller` (`contract/auth.ts:90-136`) tidak memeriksa dokumen |
| Dapatkah membaca dokumen yang tidak boleh dibaca? | Tidak ada konsep "tidak boleh dibaca" di Studio saat ini: semua sesi sah membaca semua dokumen (setara GET R05/R16). Jalur baru: artefak lintas dokumen lewat `artifactId` inline (L-3) | probe `artifactId inline` -> `ARTIFACT_NOT_FOUND` (jalur baca DB dijalankan) |
| Validasi + batas blok inline | Kunci asing ditolak (`request.ts:113`); `pid` = C19; `address` ≤ 600 lalu `parseAddress`; `block` divalidasi skema v2 yang sama dengan R16 (`validateBlockV2`, `:130`); badan ≤ 5 MiB dan kedalaman JSON dibatasi (`http/body.ts`). Tidak ada batas jumlah butir data (M-1) | probe `otherLabel 41`, `topN 31`, `labelShort 201` -> `SCHEMA_INVALID` ber-pointer |
| DoS: biaya render, laju, data raksasa/degeneratif | Laju: ember `render` 30/60 s per identitas, sesudah validasi (L-1). Data raksasa: lihat M-1. Kategori P-01 horizontal ditolak cepat oleh DATUM-33 (n=5000: 5 ms), tetapi P-02 vertikal tidak (21,7 s). Seri banyak ditolak `maxSeries` (1 ms). `topN` memangkas sebelum render (n=20000 + `topN: 10`: 15 ms). Sarang dalam: `STUDIO_MAX_JSON_DEPTH` | `probe_fig_render.out` |
| Kebocoran pesan galat | Tidak ada stack/pesan internal. `failure()` (`http/errors.ts:73-118`) membalas galat tak terduga secara generik. Penolakan mesin < 500 dikembalikan 200 `rendered:false` dengan pesan mesin, yang hanya memuat id/label masukan atau isi dokumen yang memang dapat dibaca pemanggil. Galat ≥ 500 dilempar ulang ke `failure` (`route.ts:72`) | kode |
| SSRF / path lewat aset/artefak | Tidak ada: hanya `chart`/`diagram`, tanpa medan URL/aset; `artifactId` = kunci DB | §3 External call |
| Benar-benar tanpa tulis | Ya (kecuali log JSONL) | §3 Destructive |

### 4.2 Alat MCP (Area 2) - PASS

| Aturan postur | Status | Bukti |
|---|---|---|
| Semua teks server di `<data-tak-tepercaya>` + `untrusted:true` | PASS | `figure-tools.ts:81,99,183`. `untrustedFields` di `:157,186,299`. Probe P1: `fields=["figure.issues","figure.label","figure.svg"]`. P2: `["error.message","error.details","target"]`. Kode galat server tak aman (`BAD</x> …`) tidak tampil di kepala (`tok`) |
| Netralisasi penanda + aturan N-4 nama penanda | PASS | `untrustedBlock` -> `escapeBlockBody` (`tool-kit.ts:267-268`): NFKC, nama penanda diganti `[penanda-dinetralkan]`, setiap `<`/mirip di-escape. Probe P1 dengan `</data-tak-tepercaya>`, `ᐸ/…` (glyph di luar LT_LIKE), fullwidth `＜/ＤＡＴＡ-…＞`, dan ZWSP + U+2011 + soft hyphen: teks memuat tepat 2 pembuka dan 2 penutup (milik MCP: blok isu + blok SVG), tidak ada `ABAIKAN` di luar blok, dan tidak ada penutup literal di `structuredContent` |
| `includeSvg` (SVG terpotong) tak tepercaya; dapatkah SVG keluar dari blok? | PASS: tidak dapat | `figure-tools.ts:179-183`. `neutralizeMarkers` lalu `slice(0, 6000)`: pemotongan hanya membuang ekor, jadi tidak dapat membentuk penanda baru. Isi blok tetap di-escape penuh oleh `escapeBlockBody`. `figure.svg` tercantum di `untrustedFields`. SVG tidak pernah dicetak di luar blok |
| `BASIS_MISSING` sebelum jaringan | PASS | `figure-tools.ts:247`, sebelum `checkFigureOwner` (`:249`). Probe P5: `calls=0` |
| `BASIS_REBASED`; basis sesi maju hanya pada created atau basis+1 | PASS | `:272` -> `rememberRevision` (`doc-tools.ts:280-288`) dengan `created:false, sentBase: base`. Probe P5b: rev = basis+1 -> basis sesi 3, tanpa peringatan; rev = basis+2 tanpa `rebased` -> `BASIS_REBASED`, basis dilupakan. `unchanged` -> basis dipertahankan |
| `DOCUMENT_OWNED_BY_OTHER` kecuali `adoptExisting` | PASS | `:191-207`. Pemilik ber-spoof hanya di rincian, dengan `untrusted:true`. Probe P4: PATCH=0, `ABAIKAN_outside=false`. Adopsi -> `DOCUMENT_ADOPTED` + `existing.createdBy` tak tepercaya |
| `downloadDir`: akar, `PATH_PROTECTED`, UNC/ADS, nama folder instruksi | PASS | `:140-143`, semuanya sebelum jaringan. Probe P6, semua dengan `calls=0`: `.claude` dan `x\.git` -> `PATH_PROTECTED`; `CLAUDE.md` -> `PATH_PROTECTED`; `\\evil\share` dan `a:ads` -> `PATH_INVALID`; `..\luar` -> `PATH_OUTSIDE_ROOTS`; `con` -> `PATH_INVALID`. Nama berkas dari token aman: `documentId` ber-pola `ID_PATTERN`, `pid` C19, alamat `^[A-Za-z0-9 .]{1,40}$` -> `_` (`:105-109`). Tulis lewat `writeFileGuarded`: validasi ulang, eksklusif, cadangan |
| Celah pra-ada `studio_file_verify` (folder bernama folder instruksi) | **Terkonfirmasi, Low (L-2)** | Probe P7: HEAD + GET terjadi, folder kosong `.claude` dibuat, lalu `PATH_PROTECTED`, tanpa berkas yang ditulis |
| `patch` revisi hanya medan konten? | PASS | Kunci tingkat atas dibatasi daftar putih `CHART_PATCH_KEYS`/`DIAGRAM_PATCH_KEYS` (`:49-51`), dicek dua kali: gabungan sebelum jaringan (`:244-245`), lalu per jenis blok dari R16 GET (`:264-265`). `type`, `id`, `artifactId`, `render`, `__proto__`, dan `width_mm` -> `INVALID_ARGUMENT` dengan 0 jaringan (probe P3). `spec` pada chart lolos cek gabungan (sah untuk diagram), sehingga R05/R16 GET (baca) berjalan, lalu ditolak per jenis sebelum PATCH (probe P3c: PATCH=0). Ini bukan celah. Jenis blok tidak dapat diubah karena `type` diambil dari isi tersimpan. Medan tampilan bersarang (mis. `data.style`) diteruskan apa adanya (probe P3b), lalu ditolak server: R16 PATCH memvalidasi fragmen v2 sekali di layanan (`services/revisions/v2/service.ts:417` `validateBlockV2` + `forbidden.ts` DISPLAY_FIELD). `code` (termasuk `custom`/`composite`) dan `form` adalah medan konten skema `ChartV2` dengan aturan pasangan CH-05 |
| Perubahan `tools.ts`, `server.ts`, `resources.ts`, `config.ts` | PASS | `tools.ts`: hanya mendaftarkan `FIGURE_TOOLS` (gerbang toolset + ajv `additionalProperties:false` berlaku). `server.ts`: kalimat instruksi. `resources.ts`: paragraf resep, teks statis tanpa isi server. `config.ts`: versi 1.3.0. Ekspor `doc-tools.ts` tanpa perubahan perilaku (fungsi yang sama dipakai alat lama; 175 uji lulus) |

### 4.3 Medan maksud chart (Area 3) - PASS

| Pertanyaan | Jawaban | Bukti |
|---|---|---|
| Kelengkapan dan batas validasi | `topN` bilangan bulat 3..30; `otherLabel` 1..40, hanya bersama `topN` (`dependentRequired`); `labelShort` 1..200 pasangan, `label` 1..200, `short` 1..32; `orientation`/`sort` enum. Ditegakkan di tiga lapis: skema v2 (`common.schema.ts:214-219,535,554-557`), skema v1 `intent` (`chart.schema.ts`, `additionalProperties:false`), dan mesin `assertIntentShape` (`engine/chart/core/intent.ts:102-130`) untuk spec tanpa skema. Kecocokan label dengan kategori, label ganda, dan label sumbu kembar -> `SCHEMA_INVALID` ber-pointer (`:171-196`) | `enums.ts` `CHART_INTENT_LIMITS`; probe batas |
| Dapatkah menyebabkan kerja berlebih? | Tidak. `topN` mengurangi kategori sebelum render. `labelShortMap` O(n). `attachFullLabels` O(jumlah `<text>` × ≤200) dengan regex non-katastrofik pada SVG buatan mesin. `estimateHeightMm` menerapkan maksud sekali lagi (biaya kecil). Biaya besar datang dari data, bukan maksud (M-1) | probe `topN=10 n=20000`: 15 ms |
| Injeksi ke SVG; escape `otherLabel`/`labelShort`/`<title>` | Aman. Label ditulis keluarga chart lewat `escText`/`escAttr` (`svg.ts:69-76`: `&`, `<`, `>`, `"` di atribut, karakter XML tak sah dibuang). `<title>` label lengkap memakai `escapeXml` (`intent.ts:388,400,405`: `&`, `<`, `>`), cukup untuk isi elemen. Hardening: `escapeXml` di `intent.ts` tidak meng-escape `"`; jangan dipakai ulang untuk atribut | probe escape (§3 Injection) |
| Pesan galat medan maksud | Memuat label yang dikirim pemanggil dan ≤ 40 label kategori dokumen (`intent.ts:176-179`). Ini data yang memang dapat dibaca pemanggil. Di MCP ia berada di blok tak tepercaya (`previewLines` `rendered:false`) | kode + probe P2 |

## 5. Penilaian GDPR / ISO 27701

| Pasal / kontrol | Status | Temuan | Remediasi |
|---|---|---|---|
| GDPR Art. 5, 7, 15-17, 20, 25, 30, 32-33, 35; inventaris PII | N/A | Fitur tidak menambah medan PII, penyimpanan, retensi, atau aliran data pribadi. Pratinjau tidak menyimpan apa pun. Revisi menulis lewat R16 yang sudah ada. Log JSONL mencatat `requester` (identitas pemanggil), yang sudah ada di semua route Studio | - |
| ISO 27701 / ISO 27001 A.18.1.4 | N/A | Tidak ada perubahan peran pengendali/pemroses atau dokumentasi PIMS | - |

## 6. Pemetaan ISO 27001 Annex A

| Kontrol | Status | Temuan | Remediasi |
|---|---|---|---|
| A.9 Kontrol akses | PARTIAL | Sesi wajib (`requireSession` + `getStudioCaller`), setara tetangga. Tanpa ACL per dokumen/artefak (L-3, model penyewa tunggal). Identitas agen MCP dideklarasikan sendiri (diterima D-492) | Catat L-3 sebagai risiko diterima, atau rancang ACL |
| A.10 Kriptografi | N/A | Tidak ada perubahan | - |
| A.12.1 Prosedur operasional / kapasitas (A.12.1.3) | GAP | M-1: render sinkron tanpa gerbang/batas, sehingga satu permintaan dapat memblokir proses HQ. L-1: validasi tanpa tagihan | Batas kardinalitas + `renderGate` + tagih sebelum validasi |
| A.12.4 Logging dan pemantauan | OK | `apiLog`/`failure` JSONL tahan lama dengan `x-correlation-id`, `requester`, dan `durationMs` (`route.ts:63-73`); tanpa stack di respons. Durasi render tercatat, sehingga M-1 dapat dideteksi dari log | Opsional: peringatan bila `durationMs` > ambang |
| A.12.6 Kerentanan teknis | N/A | Tidak ada dependensi baru (SDK MCP tetap dipin 1.32.1) | - |
| A.13 Komunikasi | OK | MCP hanya ke origin `STUDIO_BASE_URL`, `redirect: manual` | - |
| A.14.2 Pengembangan aman | PARTIAL | 175 uji lulus. Ada uji keamanan alat figur (blok, basis, pemilik, path) dan uji route (401, 400, 422, tanpa tulis). Belum ada uji batas biaya render (M-1), uji urutan tagihan (L-1), dan uji `studio_file_verify` + `.claude` (L-2) | Tambahkan uji sesuai kolom Verifikasi §2 |
| A.16 Insiden | N/A | Tidak ada perubahan | - |
| A.18 Kepatuhan | N/A | Tidak ada persyaratan hukum baru | - |

## 7. Prioritas Remediasi

1. **M-1 (sebelum alat figur dipakai agen secara luas / Hermes U-DOC):**
   - batas kardinalitas data pratinjau (dan sebaiknya `maxItems` skema v2);
   - render lewat `renderGate()`.
   Tanpa ini, satu panggilan `studio_figure_preview { block }` dengan ribuan kategori menghentikan HQ belasan detik atau lebih.
2. **L-1:** pindahkan tagihan laju sebelum validasi skema (perubahan kecil di `route.ts`).
3. **L-2:** samakan cek pra-jaringan `studio_file_verify` dengan `figure-tools.ts:143`, dan validasi ulang sebelum `mkdirp`.
4. **L-3:** keputusan produk, bukan perbaikan kode. Catat sebagai risiko diterima selama Studio satu organisasi.
5. GDPR / ISO 27701: tidak ada celah yang menahan PII produksi. Untuk kesiapan sertifikasi ISO 27001: tutup A.12.1.3 (M-1) dan lengkapi uji A.14.2.

Opsi keputusan untuk controller (FAIL tidak ada; CAUTION dari M-1 wajib disajikan ke USER via `AskUserQuestion`):

- **(a) Perbaiki sekarang:** M-1 + L-1 (dan L-2 opsional), lalu re-cek sempit dengan `probe_fig_render.ts` dan `probe_fig_mcp.ts`;
- **(b) Terima risiko tercatat:** M-1 diterima sementara (pengguna terautentikasi saja; dapat dideteksi dari log `durationMs`);
- **(c) Ubah lingkup:** misalnya nonaktifkan blok inline (`block`) di route/MCP sampai batas ada, sehingga pratinjau hanya untuk figur tersimpan. M-1 tetap tersisa untuk figur tersimpan.

## 8. Log Review Keamanan

| Waktu (2026-11-02) | Lingkup | Level | Hasil | Keputusan |
|---|---|---|---|---|
| 15:30 | Baca kode route `figures/preview` + `_lib`, auth tetangga, `http/{body,errors,render-guard}`, `ArtifactSpecReader`, `resolveTemplate` | L3 | Paritas auth; tanpa tulis; tanpa gerbang render | - |
| 15:42 | `npx vitest run` (MCP + fig03b + fig03a) | L3 | 11 berkas, 175/175 lulus, rc 0 | - |
| 15:50 | `probe_fig_render.ts` (mesin chart asli, tanpa DB) | L3 | P-02 n=5000 -> 21,7 s (M-1); escape `<title>`/`otherLabel`/`labelShort` benar; batas maksud ditegakkan | - |
| 16:07 | `probe_fig_mcp.ts` (`executeTool` + fetch tiruan, akar temp) | L3 | P1-P6 PASS; P7 mengonfirmasi celah `studio_file_verify` (L-2). Rahasia palsu tidak bocor | - |
| 16:15 | Penulisan laporan | L3 | **CAUTION** (0 High, 1 Medium, 3 Low) | Menunggu keputusan USER via controller (perbaiki / terima risiko / ubah lingkup) |

Artefak probe (scratchpad, di luar repo): `probe_fig_render.ts` + `probe_fig_render.out`, `probe_fig_mcp.ts` + `probe_fig_mcp.out`, `fig_sec_vitest.txt`. Folder `figsec_root\.claude` (kosong) adalah sisa probe P7 di scratchpad, bukti L-2.

---

# Siklus 1: Re-cek SEC-FIX (M-1, L-1, L-2; D-501)

## S1.1 Ringkasan

| Butir | Nilai |
|---|---|
| Vonis keseluruhan siklus 1 | **FAIL**: 1 High baru (N-2), 1 Medium baru (N-1), 1 Low baru (N-3). L-1 dan L-2 tuntas. M-1 tuntas untuk bentuk yang dihitung, tetapi batasnya dapat dilewati |
| M-1 | **CAUTION** (sebagian). Kategori/seri/titik pada pratinjau dan render dokumen kini terbatas (P-02 n=5000: 21,7 s menjadi 400 skema). Namun larik figur yang tidak dihitung (`zones` diagram) dan jalur render artefak R09 masih tanpa batas (N-1, N-2) |
| L-1 | **PASS** |
| L-2 | **PASS**. Residu TOCTOU kecil diterima (S1.3) |
| L-3 | Diterima USER (D-501), tidak diperiksa ulang |
| Tingkat review | L3 |
| Uji | Perintah: `npx vitest run tests/unit/studio/api/secfix-figure-preview.test.ts tests/unit/studio/contract/secfix-chart-maxitems.test.ts tests/unit/studio/figures/secfix-render-capacity.test.ts tests/unit/studio/mcp tests/unit/studio/api/fig03b-figure-preview.test.ts`. Hasil: `Test Files 13 passed (13)`, `Tests 180 passed (180)` (2026-11-02 22:26) |
| GDPR / ISO | GDPR tetap N/A. ISO A.12.1.3 tetap **GAP** (N-1, N-2). A.14.2 PARTIAL: uji batas tidak mencakup `zones`/`legend`/`notes`/`sources` maupun R09 |

Metode:

- Berkas yang dibaca: `services/render/figure-limits.ts`, `figures/preview/{route.ts,_lib/figure.ts,_lib/limits.ts}`, diff `common.schema.ts`, `services/render/figures.ts` (`buildFigures`), `services/render/artifact.ts`, `services/render/index.ts`, `validate/_shared/{dry-run,preview-v2}.ts`, skema `chart.schema.ts`/`diagram.schema.ts` v1, diff `scripts/studio/mcp/safety.ts`, dan pemakaian `resolveDownloadDir`/`prepareDownloadDir`.
- Probe lama diulang: `probe_fig_render.ts` -> `probe_fig_render_c1.out`; `probe_fig_mcp.ts` di akar baru `figsec_root_c1` -> `probe_fig_mcp_c1.out`.
- Probe baru: `probe_secfix_bypass.ts`, `probe_secfix_b2*.ts`.
- Mesin diagram hanya DIJALANKAN, tidak disunting.
- Tidak menyentuh DEV, DB, port 9011, atau `.env`. Tidak ada kode yang diubah.

## S1.2 Vonis per Temuan Lama

| ID | Vonis | Bukti |
|---|---|---|
| M-1 | **CAUTION** (perbaikan benar untuk yang dicakup; batas dapat dilewati) | (1) Skema v2 `maxItems` (`common.schema.ts:233-332`). Probe ulang: P-02/P-01 n=500..5000 dan `topN` + 20000 -> `SCHEMA_INVALID /block/data/points must NOT have more than 200 items`; P-03 200 seri -> `/block/data/series` 24; n=50 tetap dirender (26 ms); escape/maksud identik. (2) Pra-cek spec terselesaikan (`figure-limits.ts:139-154`) di route (`route.ts:76-77`, 422 `FIGURE_CAPACITY`) dan di `buildFigures` (`services/render/figures.ts:205,212`). Uji `secfix-render-capacity` lulus. (3) Render pratinjau di `renderGate().run` (`route.ts:80`). R08 `?preview=html` tidak merender figur (`validate/_shared/preview-v2.ts`: `figures.get -> undefined`). R17/R09 lewat `renderGate` (`services/render/index.ts:34,42`). (4) Batas produk: seri 24 x nilai 200 per seri dicek; total panel komposit 600 (probe B6 24x25 -> DATUM-33 1 ms); bentuk `steps` dihitung lewat `diagramInto`. **Celah:** `zones` diagram tidak dihitung dan tanpa `maxItems` (N-2); render artefak R09 tanpa pra-cek dengan skema v1 tanpa `maxItems` (N-1); dimensi `values` matriks tidak terikat `rows x cols` (N-3) |
| L-1 | **PASS** | `route.ts:50-64`: `readJsonObject` -> cek tipe `agentId` (400 tanpa tagihan, sama dengan R16) -> `getStudioCaller` -> `checkRenderRate` -> BARU `parsePreviewBody`. Uji `secfix-figure-preview` (31 badan tidak sah -> 429) lulus |
| L-2 | **PASS** | `safety.ts`: `assertNotProtected(resolved, isDir)` kini mencocokkan nama folder itu sendiri untuk `write-dir`. `resolveDownloadDir` dipakai sebelum jaringan (`tools.ts:849`, `figure-tools.ts:145`). `prepareDownloadDir` memvalidasi ulang tepat sebelum `mkdirp` (`tools.ts:880`, `figure-tools.ts:168`). Probe P7 ulang: `code=PATH_PROTECTED calls= dirCreated=false fileWritten=false`; akar `figsec_root_c1` kosong. P1-P6 identik dengan siklus awal |

## S1.3 Analisis Fokus Koordinator

| Fokus | Hasil | Bukti |
|---|---|---|
| Route lain yang merender figur tanpa batas | **R09 artefak: TANPA batas (N-1).** Pratinjau dan `buildFigures`: berbatas. R08 preview: tidak merender figur. DOCX: memakai SVG dari `buildFigures` | `grep chartSvg\|buildDiagramSvg` di `src`: tersisa `services/render/artifact.ts:185,191` (artefak CHART/DIAGRAM mandiri) dan `:392-393` (artefak HTML yang membungkus artefak lain), tanpa `chartCapacityIssues`/`diagramCapacityIssues` |
| Panel komposit | Berbatas untuk butir berlabel. Titik xy tidak masuk total panel (`figure-limits.ts:93`, `check` bukan `items`), tetapi dibatasi 2000 per panel dan tinggi komposit ditolak mesin cepat (DATUM-33) | probe B6 |
| Bentuk `steps` | Dihitung simpul/tepi saja; `zones` tidak (N-2) | `figure-limits.ts:73-77,130-132` |
| Produk seri x kategori | Berbatas: seri ≤ 24, nilai per seri ≤ 200. Kode bersegmen ditolak mesin lebih dulu (P-03 `maxSeries`, K-02 `maxSegments`, < 5 ms) | probe B5 |
| Produk matriks | `rows x cols ≤ 5000` dicek, tetapi `values` boleh 200x200 berapa pun `rows`/`cols`-nya (N-3) | probe B3b |
| Penggunaan `renderGate` | Benar di pratinjau. Catatan: gerbang membatasi konkurensi (2 jalan, 8 antre), bukan waktu CPU per figur. Render sinkron tetap memblokir event loop, jadi kapasitas per figur harus dibatasi di sumbernya | `route.ts:80`; `admission.ts` |
| Urutan L-1 | PASS | S1.2 |
| TOCTOU L-2 | Jendela tersisa hanya antara validasi ulang (`realpathDeep`) dan `mkdirSync({ recursive: true })`, berurutan sinkron dalam satu panggilan, tanpa jeda jaringan. Eksploitasi butuh penyerang lokal yang dapat menulis di akar dan menang balapan mikrodetik. Dampak terburuk: folder kosong di luar akar, karena penulisan berkas divalidasi ulang di `writeFileGuarded`. **Diterima sebagai residu, bukan temuan** | `safety.ts` `prepareDownloadDir` |

## S1.4 Temuan Baru

| ID | Severity | Tipe | Lokasi | Deskripsi | Remediasi |
|---|---|---|---|---|---|
| N-2 | **High** | CWE-400 / CWE-770 / CWE-789 (alokasi memori tanpa batas); OWASP A04; ISO A.12.1.3. Jalan pintas M-1 | `src/lib/studio/contract/schema/v2/common.schema.ts:194-196` (`DiagramSpecV2.zones/legend/notes` = props v1 tanpa `maxItems`); `src/lib/studio/contract/schema/diagram.schema.ts:30,78-90` (v1 `sources`, `zones`, `members`, `legend`, `notes` tanpa `maxItems`); `src/lib/studio/services/render/figure-limits.ts:73-77` (`diagramInto` hanya menghitung `nodes`/`edges`); `src/lib/studio/services/compose/blocks.ts:281-283` (zones/legend/notes diteruskan ke mesin); render: `figures/preview/_lib/figure.ts:261`, `services/render/figures.ts:214` | Diagram sah (fixture `dg_graph`, 5 simpul) ditambah `zones` banyak lolos skema v1/v2 dan cek kapasitas (`cap=0`). Biayanya super-linear. Probe `buildDiagramSvg`: 100 zona 46 ms; 1000 zona 482 ms; 2000 zona (115 KB) 1,37 s; 5000 zona (290 KB) **9,1 s**; 10000 zona: **heap JavaScript habis (~4 GB), proses tsx mati `FATAL ERROR: … heap out of memory`, rc 134**. Probe `probe_secfix_b2e`: blok inline v2 `{ type: "diagram", spec: { family, nodes, edges, zones: [10000] } }` (524 KB, jauh di bawah 5 MiB) lolos `parsePreviewBody` (skema v2), diteruskan compose dengan `zones` utuh (10000), dan `figureCapacityIssues = 0`, sehingga route AKAN memanggil mesin. **Skenario:** pengguna terautentikasi mana pun, atau agen MCP lewat `studio_figure_preview { block }`, mengirim satu permintaan pratinjau sebesar ~0,5 MB. Proses Next.js HQ kehabisan memori dan mati (seluruh layanan HQ turun, bukan hanya Studio). `renderGate` tidak mencegahnya karena satu render cukup. Hal yang sama bisa disimpan lewat R16 PATCH (tanpa render), lalu memicu render dokumen penuh (`buildFigures` juga tidak menghitung `zones`), atau lewat artefak R09 (N-1) | (1) Hitung semua larik spec diagram di `diagramInto`: `zones` (mis. ≤ 12), total `members` (≤ `diagramNodes` x zona), `legend`/`notes`/`sources` (mis. ≤ 12-20), dan panjang label zona. Tetapkan batasnya dari pengukuran mesin seperti batas simpul. (2) Tambahkan `maxItems` yang sama di `DiagramSpecV2` dan di skema diagram v1 (artefak). (3) Kunci dengan uji generik: telusuri skema `ChartV2`/`DiagramV2`/chart v1/diagram v1 dan gagal bila ada larik tanpa `maxItems`, agar celah sejenis tidak muncul lagi. **Verifikasi:** `probe_secfix_b2e.ts` harus menghasilkan `SCHEMA_INVALID .../zones maxItems` untuk 5000/10000/20000; cek kapasitas spec tersimpan > batas -> 422 `FIGURE_CAPACITY` < 10 ms |
| N-1 | **Medium** | CWE-400 / CWE-770; OWASP A04; jalan pintas M-1 (pra-ada, masuk daftar fokus) | `src/lib/studio/services/render/artifact.ts:185,191` (artefak CHART/DIAGRAM), `:392-393` (artefak HTML ber-`source.kind = "artifact"`), tanpa cek kapasitas; `src/lib/studio/contract/schema/chart.schema.ts:93-140` (`ChartData` v1 tanpa `maxItems`) + `ChartComposite.panels` (`:243`) tanpa `maxItems`; `diagram.schema.ts` `nodes`/`edges` v1 tanpa `maxItems`; masuk lewat `POST /api/studio/artifacts` (R09, `artifacts/route.ts:110,140`) | Spec `studio.chart/v1` P-02 dengan 3000 titik: `validateSchema("studio.chart/v1")` -> 0 isu; `chartCapacityIssues` -> 1 (cek ada, tetapi tidak dipanggil di jalur artefak); `chartSvg` (jalur `artifact.ts:185`) **9,2 s**, SVG 1,3 MB. Di batas badan 5 MiB, jumlah titik bisa puluhan kali lipat. Diagram v1 150 simpul ~53 s menurut pengukuran implementer, ditambah `zones` dari N-2. **Skenario:** pengguna terautentikasi `POST /api/studio/artifacts` dengan spec chart/diagram v1 besar. Antrean render menerima job (2 berjalan), lalu event loop HQ membeku belasan detik sampai menit per job. Artefak itu juga dapat dibungkus artefak HTML (`:392`) untuk dirender ulang | Panggil `chartCapacityIssues`/`diagramCapacityIssues` di `renderArtifactImpl` sebelum `chartSvg`/`buildDiagramSvg` (`artifact.ts:185,191,392-393`), sebaiknya juga di `prepareArtifact` agar ditolak 422 sebelum baris dibuat. Tambahkan `maxItems` yang sama ke skema chart v1 (`ChartData`, `ChartComposite.panels`) dan diagram v1. **Verifikasi:** uji R09 dengan P-02 v1 3000 titik -> 422 `FIGURE_CAPACITY` tanpa render; `probe_secfix_bypass.ts` B1 diganti dengan jalur artefak |
| N-3 | Low | CWE-770; batas produk tidak lengkap | `src/lib/studio/services/render/figure-limits.ts:95-99` (sel = `rows x cols`, bukan isi `values`) | Matriks `rows` 10 x `cols` 10 dengan `values` 200x200 (40000 sel): cek kapasitas lolos (100 sel), render **1,03 s**, SVG **7 MB** (probe B3b). Bandingkan 70x70 sah: 186 ms, 0,8 MB. Dibatasi skema v2 (200x200), jadi dampaknya sekitar 1 s/7 MB per permintaan. Untuk data v1 (artefak/dokumen lama) `values` tidak berbatas | Hitung sel dari isi `values` (jumlah panjang larik dalam), atau tolak bila dimensi `values` ≠ `rows x cols` (`SCHEMA_INVALID` ber-pointer). **Verifikasi:** probe B3b -> 422/400 |

## S1.5 Gerbang (siklus 1)

| Cek | Hasil | Rincian |
|---|---|---|
| Credential leak | PASS | Tidak ada rahasia di diff SEC-FIX. Probe memakai rahasia palsu, yang tersensor dan tidak muncul di keluaran |
| Destructive operation | PASS | Route pratinjau tetap tanpa tulis. L-2: tidak ada folder/berkas yang dibuat pada tujuan terlarang (P7) |
| External call | PASS | Tidak berubah |
| Injection | PASS | Escape SVG/`<title>` dan blok tak tepercaya identik dengan siklus awal (probe P1/P2/P4 + escape) |
| Permission escalation | PASS | Pemilik satu fungsi (`checkOwnership`); P4 `DOCUMENT_OWNED_BY_OTHER`, PATCH=0 |
| Ketersediaan (OWASP A04 / CWE-400) | **FAIL** | N-2: satu permintaan pratinjau ~0,5 MB dapat mematikan proses HQ (OOM). N-1: R09 tanpa batas |

## S1.6 Prioritas

1. **N-2 (High), sebelum pratinjau inline/alat figur dipakai agen atau Hermes:** batasi `zones`/`members`/`legend`/`notes`/`sources` di skema v1/v2 dan di `diagramInto`, plus uji "tidak ada larik figur tanpa `maxItems`".
2. **N-1 (Medium):** cek kapasitas di `renderArtifactImpl`/`prepareArtifact`, plus `maxItems` skema chart/diagram v1.
3. **N-3 (Low):** sel matriks dihitung dari `values`.

Ini siklus perbaikan 1 dari maksimum 3 untuk kriteria M-1. Keputusan USER via controller (`AskUserQuestion`):

- (a) perbaiki N-2 + N-1 (+ N-3) lalu siklus 2;
- (b) terima risiko tercatat. Tidak disarankan untuk N-2 karena mematikan proses;
- (c) ubah lingkup: nonaktifkan blok inline diagram di pratinjau sampai batas ada. Jalur tersimpan dan R09 tetap terbuka.

## S1.7 Log Review Keamanan (siklus 1)

| Waktu (2026-11-02) | Lingkup | Level | Hasil | Keputusan |
|---|---|---|---|---|
| 22:05 | Baca laporan `coder_execution_secfix.md`, `figure-limits.ts`, route/_lib, `buildFigures`, `artifact.ts`, R08 preview, skema v1/v2, diff `safety.ts` | L3 | Batas tidak dipanggil di `artifact.ts`; `zones` tidak dihitung | - |
| 22:10 | `probe_fig_mcp.ts` ulang (akar baru) | L3 | P1-P6 identik; P7 `calls=` kosong, `dirCreated=false` -> L-2 PASS | - |
| 22:15 | `probe_fig_render.ts` ulang | L3 | Semua kasus > 200 -> 400 skema; escape identik -> M-1 (lingkup awal) tuntas | - |
| 22:20 | `probe_secfix_bypass.ts`, `probe_secfix_b2*.ts` | L3 | N-1 (R09 v1 3000 titik 9,2 s); N-3 (matriks 7 MB); N-2 (zones 5000: 9,1 s; 10000: OOM, rc 134; v2 inline menerima 10000 zona, kapasitas 0) | - |
| 22:26 | `npx vitest run` (secfix + MCP + fig03b) | L3 | 13 berkas, 180/180 lulus | - |
| 22:40 | Penulisan bagian Siklus 1 | L3 | **FAIL** (1 High, 1 Medium, 1 Low baru; L-1/L-2 PASS; M-1 CAUTION) | Menunggu keputusan USER via controller |

Artefak probe (scratchpad, di luar repo): `probe_fig_render_c1.out`, `probe_fig_mcp_c1.out`, `probe_secfix_bypass.ts/.out`, `probe_secfix_b2c.ts/.out`, `probe_secfix_b2d.ts/.out`, `probe_secfix_b2e.ts/.out`. Akar `figsec_root_c1` kosong.

---

# Siklus 2: Re-cek SEC-FIX2 (N-2, N-1, N-3; D-506)

## S2.1 Ringkasan

| Butir | Nilai |
|---|---|
| Vonis keseluruhan siklus 2 | **PASS**: 0 High, 0 Medium terbuka. 2 Low baru (N-4 pertahanan berlapis, N-5 konsistensi ingest/render) |
| N-2 (High) | **PASS (tuntas)** |
| N-1 (Medium) | **PASS (tuntas)** |
| N-3 (Low) | **PASS (tuntas)** |
| M-1 (kriteria induk, siklus 2 dari 3) | **PASS**. Setiap jalur render figur kini berbatas di skema dan cek kapasitas pra-render. Sisa: N-4 (tidak terjangkau hari ini) dan N-5 |
| L-1, L-2 | Tetap PASS. Probe MCP identik dengan siklus 1; P7 0 panggilan, akar `figsec_root_c2` kosong |
| Tingkat review | L3 |
| Uji | Perintah: `npx vitest run` atas 4 berkas `secfix2-*`, 3 berkas `secfix-*`, `tests/unit/studio/mcp`, dan `fig03b-figure-preview`. Hasil: `Test Files 17 passed (17)`, `Tests 221 passed (221)` (23:20) |
| GDPR / ISO | GDPR N/A. ISO A.12.1.3: OK. Kapasitas per figur dibatasi di semua jalur, dan risiko sisa Low tercatat. A.14.2: OK. Uji penelusuran skema mengunci "tidak ada larik/string figur tanpa batas" |

Metode:

- Berkas yang dibaca: laporan `coder_execution_secfix2.md`, `contract/schema/figure-bounds.ts`, `services/render/figure-limits.ts` (285 baris), `services/render/figures.ts:192-226`, `services/render/artifact.ts:129-130,399`, `artifacts/_lib/prepare.ts:121-149,276-288`, skema v1/v2 (panel, caption, sumber), `compose/blocks.ts` (judul/sumber/params), `engine/chart/family-p2/table.ts:50-95`, dan `engine/diagram/core/spec.ts` `loadSpec`/`mermaidTellOf` (dibaca saja, tidak disunting).
- Probe lama diulang: `probe_secfix_b2e.ts`, `probe_fig_render.ts` -> `probe_fig_render_c2.out`, `probe_fig_mcp.ts` -> `probe_fig_mcp_c2.out`.
- Probe baru:
  - `probe_secfix2_paths.ts`: skema v1/v2 + cek kapasitas per jalur, tanpa render besar;
  - `probe_secfix2_hunt.ts`: 46 kode fixture dengan teks non-data 2000 karakter dan label 200; P-15 `params.tableRows`;
  - `probe_secfix2_p15.ts` dan `probe_secfix2_comp.ts`: komposit.
- Heap probe dibatasi `--max-old-space-size=2048`; tidak ada probe OOM.
- Tidak menyentuh DEV, DB, port 9011, atau `.env`. Tidak ada kode yang diubah.

## S2.2 Vonis per Temuan Siklus 1

| ID | Vonis | Bukti |
|---|---|---|
| N-2 | **PASS** | Inline v2: `probe_secfix_b2e.ts` tanpa perubahan -> 5000/10000/20000 zona `SCHEMA_INVALID /block/spec/zones maxItems must NOT have more than 24 items` (sebelumnya: diteruskan ke mesin, kapasitas 0, OOM). Legenda v2 25 -> `/block/spec/legend maxItems`. Spec tersimpan / v1 (`probe_secfix2_paths`): zona 25/2000/10000, legenda 25, catatan 25, sumber 13 -> skema v1 1 isu dan cek kapasitas ≥ 1. Total anggota 5x24=120 -> `total anggota zona: 120 > batas 96`. Total teks sumber 12x100 lolos skema tetapi cek kapasitas menolak (`1200 > batas 1000`). Cek dipanggil di route pratinjau (`_lib/figure.ts`, byte blok + spec), `buildFigures` (`figures.ts:197,204`), render R09 (`artifact.ts:129-130`), dan artefak terbungkus HTML (`:399`) |
| N-1 | **PASS** | Buat R09: skema v1 kini berbatas (P-02 v1 3000 titik -> `/data/points maxItems ... 200`), ditambah `assertFigureCapacity` di `prepare.ts` `checkChart` (`:123`) dan `checkDiagram` sebelum DAN sesudah `loadSpec` (`:139-141`), sehingga batas produk juga ditolak saat dibuat. Render R09: pra-cek sebelum job (`artifact.ts:129-130`). Uji `secfix2-artifact-create` dan `secfix2-artifact-render` lulus |
| N-3 | **PASS** | `figure-limits.ts`: sel = maks(isi `values`, `rows x cols`) ≤ 5000; tiap baris ≤ 200. Probe: rows/cols 10x10 + `values` 200x200 -> `sel matriks (isi values / baris x kolom): 40000 > batas 5000` (sebelumnya 1,03 s, 7 MB) |

## S2.3 Perburuan Jalur dan Pengelakan

| Jalur / fokus | Hasil | Bukti |
|---|---|---|
| Pratinjau inline | Berbatas: skema v2 (`maxItems`/`maxLength`/runs 64), lalu cek kapasitas spec terkomposisi + byte blok ≤ 1 MiB | b2e, render probe ulang identik |
| Pratinjau figur tersimpan | Berbatas: cek kapasitas atas spec terselesaikan (termasuk rujukan `artifactId`) | `_lib/figure.ts` `figureCapacityIssues` |
| Render dokumen penuh | Berbatas: `assertFigureCapacity` chart/diagram + byte isi blok sebelum mesin. Gagal = galat figur di job (figur dilewati, dokumen lain tetap) | `figures.ts:197,204,222-226` |
| Buat R09 | Berbatas: skema v1 + cek kapasitas; diagram juga sesudah `loadSpec` | `prepare.ts:123,139-141` |
| Render R09 / HTML terbungkus | Berbatas sebelum job / sebelum mesin | `artifact.ts:129-130,399` |
| Panel komposit | v1 `panels` ≤ 24 (`chart.schema.ts:268`), v2 24. `ChartPanelSpec.kind` = enum kode chart, jadi komposit tidak dapat bersarang. Data panel dihitung per panel + total 600. Komposit P-15 lewat `params.tableRows` (panel tidak wajib `data`) lolos skema dan kapasitas, tetapi jalur komposit murah: 2 panel 100x40 = 137 ms, 60x60 = 75 ms | `probe_secfix2_comp.out` |
| Mermaid | Ditolak seluruhnya (`DATUM-31`) oleh `loadSpec`. Masukan sudah berbatas sebelum `loadSpec` (skema + kapasitas + 1 MiB). Regex `MERMAID_FENCE`/`MERMAID_HEADER_LINE` berjangkar baris tanpa kuantor bersarang (linear) | `engine/diagram/core/spec.ts:46-66,158-196` (dibaca saja) |
| v1 dan v2 | Batas satu sumber (`FIGURE_BOUNDS`) di skema v1 chart/diagram/blok dok v1 dan v2. Uji penelusuran skema mengunci tidak ada larik tanpa `maxItems`/string tanpa `maxLength` (kecuali `x` metadata yang dicakup batas byte) | `secfix2-schema-walk` lulus |
| Pengelakan lewat sarang | `genericInto` iteratif: setiap larik ≤ 5000, larik/kunci `params` ≤ 256, string ≤ 2000, total elemen ≤ 30000, kedalaman ≤ 32. Bentuk `steps` diperiksa penuh oleh `diagramInto` | `figure-limits.ts:72-100` |
| Teks non-data 2000 karakter (judul/sumber/catatan/satuan/label batas) pada 46 kode fixture | Terburuk W-02 `note` 109 ms | `probe_secfix2_hunt.out` H1 |
| Label data 200 karakter (batas) pada semua kode berkategori | Terburuk W-02 17 ms | H4 |
| Batas judul diagram 300 karakter (dari caption v2) | Tidak dapat dielakkan: judul = teks polos caption persis (`compose/blocks.ts:461`, `inline.ts:79-83`), tanpa awalan atau perluasan rujukan. Rujukan artefak memakai judul v1 (skema ≤ 300). Lihat N-5 untuk dampak ke dokumen lama | `probe_secfix2_paths`: caption v2 301 -> ingest 0 isu, kapasitas 1 isu |

## S2.4 Temuan Baru

| ID | Severity | Tipe | Lokasi | Deskripsi | Remediasi |
|---|---|---|---|---|---|
| N-4 | Low | CWE-770 (pertahanan berlapis) | `src/lib/studio/services/render/figure-limits.ts:72-100` (sel tabel `params.tableRows` x `tableHead` hanya dibatasi generik: 256 baris, 256 kolom, total 30000); `src/lib/studio/engine/chart/family-p2/table.ts:75-95` | P-15 tunggal memakai `params.tableRows` bila `data` absen. Spec P-15 dengan `tableRows` 170x170 (28900 elemen, di bawah total 30000) lolos cek kapasitas dan merender **56,7 s** (256x100: 42 s). Hari ini **tidak terjangkau**: skema v1 mewajibkan `data` untuk kode non-komposit (`probe_secfix2_p15`: tanpa `data` -> `required data`; dengan matriks kecil + `tableRows` -> lolos skema, tetapi mesin memakai matriks). Blok v2 wajib `data`/`panels`/`artifactId`, compose tidak pernah membuat `tableRows`, dan jalur panel komposit murah. Bila invarian skema atau templat berubah, celah M-1 terbuka lagi | Di `chartCapacityIssues`, perlakukan `params.tableRows` (spec dan panel) seperti matriks: baris ≤ 200, sel (`tableRows x tableHead`) ≤ 5000. Tambahkan kasus ke uji kapasitas. **Verifikasi:** `probe_secfix2_hunt` H2 170x170 -> cek kapasitas 1 isu |
| N-5 | Low | Konsistensi validasi (bukan eksploit); ISO A.14.2 | Ingest v2: `CaptionV2.text` ≤ 20000 (`v2/common.schema.ts:76-77`), sedangkan render menolak judul diagram > 300 dan string chart > 2000 (`figure-bounds.ts:53,67`) | Kiriman bab/PATCH v2 menerima caption diagram 301..20000 karakter (dan caption chart > 2000). Figur itu lalu ditolak saat pratinjau (422) dan dilewati dengan galat job saat render penuh. Agen baru tahu sesudah render. Dokumen yang SUDAH tersimpan dengan caption seperti itu kehilangan figurnya di render berikutnya. Pindai implementer: 0 fixture/seed. Isi DB produksi tidak dapat diperiksa di review ini (larangan DB). Tidak dapat dipakai pihak lain untuk merusak dokumen orang lain: hanya penyunting dokumen yang menentukan caption, dan ia memang sudah dapat mengubah isi | (1) Terapkan batas yang sama saat ingest/compose blok figur v2 (400 `SCHEMA_INVALID` ber-pointer `/caption`), mis. `figureCapacityIssuesFor` pada spec terkomposisi di jalur kiriman. (2) Sebelum rilis, controller/USER menjalankan pindai baca-saja snapshot revisi terkini untuk caption diagram > 300 / string chart > 2000. **Verifikasi:** uji kiriman caption diagram 301 -> 400 |

## S2.5 Gerbang (siklus 2)

| Cek | Hasil | Rincian |
|---|---|---|
| Credential leak | PASS | Tidak berubah. Probe memakai rahasia palsu |
| Destructive operation | PASS | Jalur render dan pratinjau tetap tanpa tulis baru. N-5: figur ditolak, data tidak dihapus |
| External call | PASS | Tidak berubah |
| Injection | PASS | Escape/blok tak tepercaya identik (probe render dan MCP ulang) |
| Permission escalation | PASS | Tidak berubah |
| Ketersediaan (OWASP A04 / CWE-400) | **PASS** | Semua jalur render figur berbatas sebelum mesin. Terburuk terukur pada batas: < 0,2 s chart; graph 24 simpul ~1,5 s (siklus 1). N-4 tercatat sebagai pertahanan berlapis |

## S2.6 Prioritas

1. N-4 (Low): tambahkan batas sel `tableRows` ke cek kapasitas. Murah dan menutup celah yang akan terbuka bila invarian skema berubah.
2. N-5 (Low): samakan batas caption di ingest, dan pindai DB sebelum rilis (keputusan USER, karena review ini tidak boleh membaca DB).

Tidak ada temuan yang menahan rilis. Kriteria M-1 tuntas pada siklus 2 dari 3.

## S2.7 Log Review Keamanan (siklus 2)

| Waktu (2026-11-02) | Lingkup | Level | Hasil | Keputusan |
|---|---|---|---|---|
| 23:00 | Baca laporan `coder_execution_secfix2.md`, `figure-bounds.ts`, `figure-limits.ts`, `figures.ts`, `artifact.ts`, `prepare.ts`, skema v1/v2, compose, P-15, `loadSpec` | L3 | Cek kapasitas di semua jalur render dan pembuatan | - |
| 23:05 | `probe_secfix_b2e.ts`, `probe_fig_mcp.ts` (akar baru), `probe_fig_render.ts` ulang | L3 | N-2 inline tertutup; MCP dan render identik dengan siklus 1 | - |
| 23:10 | `probe_secfix2_paths.ts` | L3 | N-1, N-2 (semua larik baru, total anggota/sumber), N-3 tertutup; caption 301 lolos ingest | - |
| 23:15 | `probe_secfix2_hunt.ts`, `_p15.ts`, `_comp.ts` (heap ≤ 2 GB) | L3 | Teks non-data/label pada batas ≤ 109 ms; P-15 `tableRows` 170x170 56,7 s tetapi tidak terjangkau (N-4); komposit murah | - |
| 23:21 | `npx vitest run` (secfix2 + secfix + MCP + fig03b) | L3 | 17 berkas, 221/221 lulus | - |
| 23:30 | Penulisan bagian Siklus 2 | L3 | **PASS** (N-1, N-2, N-3 tuntas; N-4, N-5 Low baru) | Low: catat/perbaiki menurut keputusan USER via controller |

Artefak probe (scratchpad, di luar repo): `probe_secfix2_paths.ts/.out`, `probe_secfix2_hunt.ts/.out`, `probe_secfix2_p15.ts`, `probe_secfix2_comp.ts/.out`, `probe_fig_render_c2.out`, `probe_fig_mcp_c2.out`. Akar `figsec_root_c2` kosong.

---

# Siklus 3: Re-cek Sempit SEC-FIX3 (N-4, N-5; D-508)

## S3.1 Ringkasan

| Butir | Nilai |
|---|---|
| Vonis keseluruhan siklus 3 | **PASS**: 0 High, 0 Medium, 0 Low baru. Satu catatan informatif (biaya P-15 pada batas sel, S3.4) |
| N-4 (Low) | **PASS (tuntas)** |
| N-5 (Low) | **PASS (tuntas)** |
| Skrip pindai DB `scripts/studio/scan-figure-limits.ts` | **PASS** (review kode; TIDAK dijalankan, sesuai instruksi) |
| Tingkat review | L2: sempit, dua temuan Low + satu skrip baca-saja |
| Uji | Perintah: `npx vitest run` atas 2 berkas `secfix3-*`, 4 berkas `secfix2-*`, 3 berkas `secfix-*`, `tests/unit/studio/mcp`, dan `fig03b-figure-preview`. Hasil: `Test Files 19 passed (19)`, `Tests 235 passed (235)` (2026-11-03 05:37) |
| GDPR / ISO | Skrip pindai hanya mencetak id dokumen/artefak, pointer, dan angka (tanpa isi dokumen) -> tidak ada pemrosesan PII baru. ISO A.12.1.3 OK; A.14.2 OK (validasi ingest = batas render) |

Metode:

- Berkas yang dibaca: laporan `coder_execution_secfix3.md`, `contract/schema/v2/figure-text.ts`, diff `services/ingest/validate.ts` (`withFigureText`, `FIGURE_V2_REF`), `figure-limits.ts` `tableParamsInto`, `engine/chart/core/params.ts:60-84` dan `core/read.ts:187-190` (cara mesin membaca petunjuk params), `family-p2/table.ts:75-125`, `compose/blocks.ts` (keyRow, panel), semua pemanggil validator (`grep studioValidator|validateV2Against|validateAgainst|studioAjv`), dan `scripts/studio/scan-figure-limits.ts` + `prisma/schema.prisma` datasource.
- Probe (fungsi langsung, heap ≤ 2 GB): `probe_secfix3.ts`, `probe_secfix3b.ts`.
- Tidak menyentuh DEV, DB, port 9011, atau `.env`. Skrip pindai tidak dijalankan. Tidak ada kode yang diubah.

## S3.2 Vonis per Temuan

| ID | Vonis | Bukti |
|---|---|---|
| N-4 | **PASS** | `tableParamsInto` (`figure-limits.ts:234-244`) dipanggil untuk `spec.params` (`:260`) dan `composite.panels[].spec.params` (`:267`). Hasil probe: P-15 `tableRows` 170x170 -> `sel tabel 28900 > batas 5000`, ditolak sebelum mesin (sebelumnya 56,7 s); 201 baris -> `baris 201 > 200`; `tableHead` 5 dengan baris 300 kolom -> `kolom tableRows 300 > 200` (kolom terlebar dipakai, bukan kepala); panel komposit 170x170 -> ditolak. Kunci penuh `chart.kind.P-15.tableRows`: mesin hanya membaca `spec.params["tableRows"]` (`core/read.ts:188`), jadi kunci itu tidak diberi makna (`SCHEMA_INVALID` mesin 1-2 ms) dan bukan jalan pintas. Params 2-D lain: hanya P-15 `tableRows` yang berbentuk 2-D di `CHART_DATA_HINT_KEYS` (`params.ts:68-84`). `colourRule` 256 aturan pada 5000 sel: 1829 ms vs 1736 ms tanpa aturan (tambahan +5 %, bukan pengganda) |
| N-5 | **PASS** | Detail di S3.3 |

## S3.3 N-5: Jalur Kiriman dan Pengelakan

| Fokus | Hasil | Bukti |
|---|---|---|
| Satu titik penegakan | `withFigureText` membungkus validator v2 bersama di DUA pabrik: `studioValidator(ref)` (`ingest/validate.ts:89`) dan `getValidator(id)` (`:117`), untuk rujukan `studio.(doc\|chapter\|slot)/v2.json` dan `common/v2.json#...` (`:53`). Basis URL `https://hq.gsp.local/studio/schema` cocok dengan pola. Tidak ada `new Ajv` lain di `src/lib/studio`/`src/app/api/studio`. `studioAjv().getSchema` hanya dipakai `templates/profile.ts` (skema format peran, bukan figur) | grep pemanggil |
| R04 | `ingest/v2.ts:775,989` -> `validateV2Against` -> `getValidator` (terbungkus) | kode |
| R08 dry-run | `validate/_shared/v2-kit.ts:47` -> `studioValidator` | kode |
| R12/R13 (bab/slot) | `chapters/_shared/submit-kit.ts:61` -> `studioValidator` | kode |
| R16/R06 PATCH + pratinjau figur + MCP `studio_figure_revise` | `revisions/v2/body.ts:84` (`validateWrapped`, dipakai `validateBlockV2`) -> `studioValidator` chapter/v2. `studio_figure_revise` mengirim R16 PATCH -> `patchPid` -> `service.ts:417` `validateBlockV2`. Probe `validateBlockV2`: pointer dipetakan ke `/block/caption` | probe |
| R14 struktur | `structure/_lib/patch-body.ts:74` -> `studioValidator(common/v2.json#/$defs/...)` | kode |
| Importer markdown | `import/validate.ts:21` -> `studioValidator(CHAPTER_V2_REF)`; impor kontrak `import/contract/index.ts:669` -> `validateV2Against` | kode |
| Run inline | Teks polos = compose `inlineV2Plain` (paritas dikunci uji). Hasil probe: run 2x151 = 302 -> `FIGURE_TEXT`; run 300 + tab = 301 -> `FIGURE_TEXT`; 300 tepat -> lolos | probe |
| `keyRow` sebagai ganti caption | Bukan jalan pintas. Compose menaruh `keyRow` di aparatus halaman (`compose/blocks.ts:454-467`), bukan di spec mesin (diagram hanya mendapat flag `keyRowOnPage`). Jadi `keyRow` tidak masuk loop tata letak mesin, dan tidak dinilai `FIGURE_TEXT` (probe: `keyRow` 5000 -> 0 isu). Batas `keyRow` = batas teks halaman bersama (20000, run ≤ 64) | kode + probe |
| Rujukan `artifactId` | Dilewati dengan benar. Judul/sumber spec datang dari artefak v1 (skema ≤ 300 + cek kapasitas saat buat/render), sedangkan caption blok hanya dicetak halaman (probe: caption 5000 + `artifactId` -> 0 `FIGURE_TEXT`). Render tetap menjalankan cek kapasitas atas spec artefak | kode + probe |
| Panel komposit | Caption panel ≤ 300 dan `axisNote` ≤ 200 sudah di skema. Caption/sumber blok komposit = judul/sumber chart (≤ 2000). Panel `steps` memakai batas diagram atas caption blok (probe: panel `steps` + caption blok 301 -> `FIGURE_TEXT /block/caption`) | probe |
| Chart dan `steps` | Caption chart 2001 -> `FIGURE_TEXT`; chart `steps` caption 301 -> `FIGURE_TEXT`; sumber diagram 1001 -> `FIGURE_TEXT /block/source` | probe |
| Caption tabel | Tidak terpengaruh: hanya `type` chart/diagram yang dinilai. Probe: caption tabel 5000 -> `figureTextErrorsV2` 0; tabel 5000 + diagram 301 di bab yang sama -> tepat 1 (milik diagram) | probe |
| Pengelakan kedalaman | `figureTextErrorsV2` berhenti pada kedalaman 64. Blok v2 tidak bersarang (BlockV2 hanya di `SectionV2.blocks` dan `ChapterV2.intro`; `common.schema.ts:609-619`), jadi blok figur selalu ≤ ~8 level. Badan dibatasi 64 level oleh transport | kode |
| Sisa | Dokumen lama tidak dinilai ulang pada PATCH yang tidak menyentuh bloknya. Itu dicakup cek kapasitas render (422 / galat figur) sejak siklus 2. Pindai DEV implementer: 0 dokumen terkena | laporan implementer |

## S3.4 Skrip Pindai DB (review kode, tidak dijalankan)

| Butir | Hasil | Bukti (`scripts/studio/scan-figure-limits.ts`) |
|---|---|---|
| Menolak DB selain `gsp_agent_hq_v21` SEBELUM koneksi | PASS. Nama DB dari path `DATABASE_URL` diperiksa sebelum `new PrismaClient()`. `.env` dimuat lebih dulu bila variabel absen, sehingga cek dan Prisma membaca sumber yang sama. Prisma memakai `env("DATABASE_URL")` (`prisma/schema.prisma:8`). URL tak terbaca -> berhenti ("tidak terbaca", gagal-tertutup), exit 2, tanpa koneksi | `:22,27-35,51-62` |
| Cek ulang sesudah koneksi | PASS: `SELECT current_database()` di dalam transaksi; beda nama -> berhenti | `:68-72` |
| Transaksi READ ONLY | PASS: `SET TRANSACTION READ ONLY` adalah pernyataan pertama transaksi interaktif (koneksi sama), dengan string konstan, tanpa masukan | `:65-67` |
| Hanya SELECT | PASS: hanya `findMany`/`findUnique`/`$queryRaw` SELECT; tidak ada create/update/delete/upsert/`$executeRaw` lain | grep |
| Rahasia/keluaran | PASS: URL tidak dicetak, hanya nama DB. Galat mencetak nama kelas + kode saja (pesan Prisma bisa memuat host). Temuan hanya id, pointer, dan angka, tanpa isi dokumen | `:73,120-140,153-157` |
| Catatan kecil (bukan temuan) | Bila `current_database()` tidak cocok, fungsi mengembalikan 2 dari dalam `$transaction` (commit transaksi baca-saja, bukan rollback). Tidak ada dampak karena belum ada pernyataan lain dan transaksi READ ONLY. Melempar galat lebih tegas bila skrip kelak diperluas | `:69-71` |

Catatan informatif (bukan temuan): biaya P-15 pada batas sel 5000 (200x25) adalah **~1,7 s** per figur (`probe_secfix3b.out`), setara dengan biaya terburuk diagram graph 24 simpul (~1,5 s) yang sudah tercatat di siklus 1-2. Batas sel 5000 berasal dari siklus 1 dan tidak berubah di SEC-FIX3. Bila latensi per figur menjadi masalah, turunkan batas sel khusus P-15 (mis. 2000) sesudah diukur. `renderGate` dan laju 30/menit membatasi dampak agregatnya.

## S3.5 Gerbang (siklus 3)

| Cek | Hasil | Rincian |
|---|---|---|
| Credential leak | PASS | Skrip pindai tidak mencetak URL/rahasia; probe tanpa rahasia |
| Destructive operation | PASS | Skrip pindai baca-saja (pengaman nama DB ganda + READ ONLY). Perubahan validator hanya menolak kiriman, tidak menghapus apa pun |
| External call | PASS | Tidak ada panggilan baru; skrip pindai hanya ke DB DEV yang terkunci namanya |
| Injection | PASS | Satu-satunya SQL mentah berupa string konstan / template tanpa interpolasi masukan |
| Permission escalation | PASS | Tidak berubah |
| Ketersediaan | PASS | N-4 tertutup; catatan biaya P-15 pada batas di atas |

## S3.6 Prioritas dan Keputusan

Tidak ada temuan terbuka dari rangkaian M-1 (M-1, N-1..N-5). Opsional, bukan penahan rilis:

- turunkan batas sel P-15 bila latensi ~1,7 s per figur dianggap terlalu tinggi;
- ubah cabang `current_database()` di skrip pindai agar melempar galat, bukan mengembalikan.

## S3.7 Log Review Keamanan (siklus 3)

| Waktu (2026-11-03) | Lingkup | Level | Hasil | Keputusan |
|---|---|---|---|---|
| 05:15 | Baca laporan `coder_execution_secfix3.md`, `figure-text.ts`, `ingest/validate.ts`, `tableParamsInto`, cara mesin membaca petunjuk params, pemanggil validator | L2 | Satu titik penegakan menjangkau semua jalur kiriman v2 | - |
| 05:25 | `probe_secfix3.ts`, `probe_secfix3b.ts` (heap ≤ 2 GB) | L2 | N-4 tertutup (termasuk panel, kunci penuh bukan jalan pintas); N-5 tertutup (run, `keyRow`, `artifactId`, panel, `steps`, tabel) | - |
| 05:30 | Review kode `scan-figure-limits.ts` (tidak dijalankan) | L2 | Pengaman nama DB sebelum/sesudah koneksi, READ ONLY, hanya SELECT, tanpa rahasia | - |
| 05:37 | `npx vitest run` (secfix3 + secfix2 + secfix + MCP + fig03b) | L2 | 19 berkas, 235/235 lulus | - |
| 05:45 | Penulisan bagian Siklus 3 | L2 | **PASS** | Rangkaian M-1 tuntas; tidak ada keputusan USER yang wajib |

Artefak probe (scratchpad, di luar repo): `probe_secfix3.ts/.out`, `probe_secfix3b.ts/.out`.
