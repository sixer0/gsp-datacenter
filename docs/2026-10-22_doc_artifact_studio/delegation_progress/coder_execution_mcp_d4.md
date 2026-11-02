---
task_id: MCP-D4
task_slug: doc_artifact_studio
row: MCP-D4 (siklus perbaikan 2 dari 3)
date: 2026-11-02
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/decisions/decisions.md (D-484); verification/09_mcp_d3_security_recheck.md
status: complete
---

# Implementation Report: MCP-D4 (perbaikan M-1, M-2, L-1, L-2, L-3, L-5, L-6 dari cek ulang 09)

Skill: `tdd`, `receiving-code-review`, `verification-before-completion`. Dasar: D-484 dan cek ulang keamanan 09 (CAUTION: M-1, M-2, L-1..L-6). L-4 (pemilik memercayai agentId yang dinyatakan pemanggil) TIDAK diubah, sesuai brief, dan menunggu keputusan USER. API HTTP Studio tidak diubah. CLI `studio-report` tidak berubah perilakunya: kait baru `CliIo.beforeSubmit` bersifat opsional dan hanya diisi adaptor MCP.

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca cek ulang 09, laporan MCP-D3, kode adaptor (`tool-kit.ts`, `doc-tools.ts`, `tools.ts`), `studio-report.ts`, `draft-check.ts`, `_http-client.ts`; jalankan probe d3/d3b/d3c | complete | Probe sebelum perbaikan mengonfirmasi P1/P2 (L-1), P3a/P3b + d3b (M-1), P4 (L-2), d3c (M-2) |
| 2 | TDD: tulis `mcp-d4-security.test.ts` (18 uji, satu atau lebih per temuan) dan pastikan gagal lebih dulu | complete | 18/18 gagal sebelum perbaikan, dengan alasan yang benar (lihat Test Results) |
| 3 | L-2: penetralan penanda kokoh + satu pintu teks server (`serverBlock`, `serverIssueLine`, `tok`, pola token aman) di `tool-kit.ts` | complete | Lihat Issues & Decisions D-1, D-2 |
| 4 | M-1: dry-run R08 (`dryRunOutput`), `studio_draft_check` remote, `studio_report_check` remote membungkus isu server + `untrusted` | complete | |
| 5 | M-2: `submitPlanOf` + kait `CliIo.beforeSubmit` (studio-report.ts), `guardReportSubmit` (doc-tools.ts), dipasang di `studio_report_submit` | complete | Aturan di D-3 |
| 6 | L-1: baris kepala galat tanpa teks server (asal server = status HTTP ATAU cid; `serverMessage` untuk ReportError/DraftCheckUsageError asal server; kode/cid/pointer tak aman ke blok; Retry-After) | complete | |
| 7 | L-3: `rebased: true` -> basis sesi dilupakan + peringatan `BASIS_REBASED` (bab, slot, impor, struktur) | complete | D-4 |
| 8 | L-5: render (galat, status, nama final), file_verify (nama final, sha), impor (isu + peringatan), status (lint + berkas) | complete | |
| 9 | L-6: `docs/STUDIO-MCP.md` (TOCTOU, L-4, rebased, aturan M-2, klaim F-1 dipersempit sesuai perilaku nyata, L-2, uji) | complete | |
| 10 | Gerbang: vitest (mcp, draft, suite studio penuh), tsc, eslint, dua smoke MCP DEV, probe ulang (fetch tiruan + DEV hanya-GET) | complete | Semua hijau |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| `scripts/studio/mcp/tool-kit.ts` | modify | L-2: `neutralizeMarkers` menormalkan NFKC + membuang spasi/`\p{Cf}`/`\p{Pd}`/minus/garis bawah sebelum mencocokkan nama penanda; string yang menyebut penanda -> setiap `<`/mirip (U+FF1C, U+FE64, U+2329, U+3008, U+27E8, U+276C, U+276E, U+2039, U+02C2) menjadi `&lt;`. Isi `untrustedBlock` meng-escape SETIAP `<`/mirip. Baru: `SAFE_TOKEN`, `SAFE_CODE`, `SAFE_CID`, `SAFE_POINTER`, `HEX64`, `tok()`, `serverIssueLine()`, `serverBlock()` (satu pintu untuk teks server di jalur sukses). `http()`: pesan 429 disusun ulang (Retry-After hanya bila angka) |
| `scripts/studio/mcp/doc-tools.ts` | modify | M-1 `dryRunOutput` (isu di blok `isu-dry-run`, `untrustedFields`, kepala bertoken). M-2 `guardReportSubmit` + `isWorkReport` (GET R21), `findMissionDoc` diekspor, `checkOwnership` menerima teks pemulihan. L-3 `rememberResult`/`rememberRevision` + `withWarnings` + `REBASED_MESSAGE` (dipakai create, impor, chapter_submit, slot, struktur). L-5 impor (isu + peringatan ke blok `isu-impor`), status (lint + berkas ke blok status), kepala/`completenessLine`/struktur memakai `tok()`. L-1 id dari server di pesan `DOCUMENT_OWNED_BY_OTHER`/`BASIS_MISSING` lewat `tok()` |
| `scripts/studio/mcp/tools.ts` | modify | M-1 `studio_draft_check` dan `studio_report_check` remote. M-2 `studio_report_submit` memasang `beforeSubmit: guardReportSubmit` (+ deskripsi alat). L-1 `executeTool` (asal server = status/cid, `SAFE_CODE`/`SAFE_CID`/`SAFE_POINTER`, cid tak aman tidak dicatat), `toToolError` (`serverMessage` untuk ReportError asal server kecuali `REMOTE_REDIRECT`/`REMOTE_UNAUTHORIZED`; DraftCheckUsageError `REMOTE_ERROR`/`REMOTE_BAD_RESPONSE`/`RATE_LIMITED`), petunjuk baru `BASE_CONFLICT`/`DOCUMENT_INCOMPLETE`/`RATE_LIMITED` + petunjuk umum, `pdfUnavailableHint` hanya format dikenal. L-5 `studio_render`, `studio_file_verify` (`OUT_NAME_UNSAFE`/`VERIFY_FAILED` tanpa nama di pesan; nama di rincian `untrusted`) |
| `scripts/studio/studio-report.ts` | modify | Aditif: `SubmitPlanItem`, `submitPlanOf()` (satu sumber rencana untuk `runSubmit` dan kait), `CliIo.beforeSubmit?` dipanggil sesudah cek lokal/EXAMPLE_TARGET/basis, sebelum kiriman pertama. `runSubmit` memakai rencana yang sama (perilaku identik). Ujung baris CRLF dipertahankan |
| `tests/unit/studio/mcp/mcp-d4-security.test.ts` | add | 18 uji MCP-D4 |
| `tests/unit/studio/mcp/mcp-harness.ts` | modify | `studioMock`: rute bawaan `GET /api/studio/documents` -> `{ documents: [] }` (pra-cek M-2; laporan belum ada) |
| `docs/STUDIO-MCP.md` | modify | L-6 (lihat Verification) |
| `scripts/studio/draft-check.ts` | tidak diubah | Tidak perlu: pembungkusan dilakukan di lapisan MCP |

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Uji baru sebelum perbaikan | `npx vitest run tests/unit/studio/mcp/mcp-d4-security.test.ts` | `Tests  18 failed (18)` | Alasan gagal benar, mis. M-1 `expected 'slot controlSheet (dry-run R08, tidak…' not to contain 'ABAIKAN'`; M-2 `expected 'ROUTE_NOT_FOUND' to be 'BASIS_MISSING'` (R12 sudah dipanggil lalu R15 404); L-1 `expected 'galat DOC_TARGET_AMBIGUOUS (HTTP 400)…' not to contain 'ABAIKAN'`; L-2 `"< /data-tak-tepercaya>": expected true to be false`; L-3 `expected undefined to deeply equal [ ObjectContaining{…} ]`; L-5 `expected 'render cmvdoc… scop…' not to contain 'ABAIKAN'`. Baseline suite mcp saat itu: `18 failed \| 84 passed (102)` |
| Uji baru sesudah perbaikan | sama | `Test Files 1 passed (1)`, `Tests 18 passed (18)` | |
| Unit MCP | `npx vitest run tests/unit/studio/mcp` | `Test Files 5 passed (5)`, `Tests 102 passed (102)` | 84 lama + 18 baru |
| Unit studio-report / draft-check | `npx vitest run tests/unit/studio/draft tests/unit/studio/api/dc23-drafts-check-route.test.ts tests/unit/studio/api/fixc2-agent-id.test.ts` | `Test Files 11 passed (11)`, `Tests 157 passed (157)` | Termasuk r2cli-studio-report, r2cli-draft-check, r3cli-md-native, r3fix*, dc22 (CLI tidak regresi) |
| Suite studio penuh | `npx vitest run tests/unit/studio` | `Test Files 173 passed (173)`, `Tests 3687 passed \| 1 skipped (3688)` | Tidak ada kegagalan, juga tidak di figures (agen lain) |
| Typecheck | `npx tsc --noEmit -p .` | rc 0, 0 baris keluaran | Seluruh proyek |
| Lint | `npx eslint scripts/studio/mcp/tool-kit.ts scripts/studio/mcp/doc-tools.ts scripts/studio/mcp/tools.ts scripts/studio/studio-report.ts tests/unit/studio/mcp/mcp-d4-security.test.ts tests/unit/studio/mcp/mcp-harness.ts` | rc 0, 0 masalah | Satu peringatan direktif eslint-disable tak terpakai di berkas uji baru sudah dibuang |
| Smoke laporan (DEV) | `INTERNAL_API_SECRET=<dari berkas, tidak dicetak> npx tsx scripts/studio/mcp/smoke.ts --base-url http://127.0.0.1:9021 --mission 2026-11-02_mcpd4 --agent-id cod-mcp-d4` | rc 0, `SEMUA LULUS (7.7 s)` | submit 065/GSP/LAP/XI/2026 rev6 COMPLETE (melewati pra-cek M-2 nyata), update, refresh, basis sesi, BASIS_MISSING, kueri, cari, render, verifikasi; "pindai rahasia: 14 hasil alat + 15 baris stderr server; rahasia tidak ditemukan" |
| Smoke dokumen (DEV) | `INTERNAL_API_SECRET=<…> STUDIO_MCP_FILE_ROOTS=C:\Users\TRIAL\AppData\Local\Temp\mcpd4_root npx tsx scripts/studio/mcp/smoke-documents.ts --base-url http://127.0.0.1:9021 --mission 2026-11-02_mcpd4 --agent-id cod-mcp-d4` | rc 0, 23 langkah `ok: true`, 0 `ok: false` | dok 010/GSP/KT/XI/2026 (`cmvyqkkvv00j4v1wkgzcjg493`) rev6; DOCX + HTML sha cocok; pdf 503 dengan saran format; "rahasia tidak keluar"; 2 tulis, 0 di luar akar. Folder akar temp dihapus sesudahnya |

## Verification

Probe ulang dengan fetch tiruan (skrip cek ulang 09 di scratchpad, tanpa jaringan/DB/.env; rahasia uji palsu disensor):

- `probe_d3.ts` P1 (galat tanpa details, cid ada): `ok=false code=DOC_TARGET_AMBIGUOUS untrusted=true canaryOutsideBlock=false`; kepala: `permintaan ke server Studio gagal (lihat kode); pesan dan rincian server ada di blok rincian`.
- P2 (details, tanpa cid): `untrusted=true canaryOutsideBlock=false`, `correlationId: mcp-...`.
- P3a/P3b (dry-run R08 SCOPE_CONFLICT): `ok=true untrusted=true canaryOutsideBlock=false`; kepala `TIDAK SAH, 1 isu (di blok di bawah)` lalu blok `jenis="isu-dry-run"`.
- P4: ketujuh varian kini `neutralized=true` (termasuk `< /data-…`, `<`+ZWSP, fullwidth `＜`, tanda hubung U+2011).
- `probe_d3b.ts` `studio_draft_check`: `untrusted=true canaryBeforeBlock=false`; kepala `draft-check draf (remote, dry-run R08): TIDAK LOLOS (blok 6, blok tidak valid 6)`.
- `probe_d3c.ts` (M-2): target `documentId` -> `code=BASIS_MISSING calls=` (nol panggilan, `R12 dipanggil=false`); target `mission+docKey` -> `R12 dipanggil=false GET R04 pra-cek=true` (mock probe menjawab 404 -> gagal tertutup).
- `probe_d4c.ts` (varian d3c dengan GET nyata-bentuk): pemilik lain -> `DOCUMENT_OWNED_BY_OTHER calls=GET /api/studio/documents`, `R12 dipanggil=false`; dokumen klien milik sendiri -> `BASIS_MISSING calls=GET /api/studio/documents,GET /api/studio/contracts`, `R12 dipanggil=false`.

Probe DEV hanya-GET `probe_d4_dev.ts` (guard M-2 terhadap server 127.0.0.1:9021 nyata, artefak smoke di misi `2026-11-02_mcpd4`):

```
laporan kerja smoke di misi: 1; docKey dipakai: lapkerja-mcp01-20261102040447
A laporan kerja sendiri (cod-mcp-d4): LOLOS guard (boleh dikirim); panggilan=GET /api/studio/documents,GET /api/studio/contracts
B laporan kerja milik A (cod-mcp-d4-b): DITOLAK DOCUMENT_OWNED_BY_OTHER; panggilan=GET /api/studio/documents
A dokumen klien sendiri: DITOLAK BASIS_MISSING; panggilan=GET /api/studio/documents,GET /api/studio/contracts
B dokumen klien milik A: DITOLAK DOCUMENT_OWNED_BY_OTHER; panggilan=GET /api/studio/documents
A docKey baru (belum ada): LOLOS guard (boleh dikirim); panggilan=GET /api/studio/documents
panggilan non-GET di seluruh probe guard: 0
```

Per temuan:

| Temuan | Status | Bukti |
|---|---|---|
| M-1 | fixed | Uji `M-1` (3): slot_fill/chapter_submit dryRun (ringkas + detail), draft_check remote, report_check remote: kanari hanya di dalam blok, `untrusted: true`, tidak ada penutup literal di structuredContent. Probe P3a/P3b, d3b |
| M-2 | fixed | Uji `M-2` (4): documentId/docNumber -> BASIS_MISSING tanpa POST; milik lain -> DOCUMENT_OWNED_BY_OTHER sesudah satu GET; dokumen klien sendiri -> BASIS_MISSING sesudah GET R04 + R21; laporan MD milik lain ditolak, laporan sendiri tetap dikirim. Probe d3c/d4c, probe DEV, smoke laporan lulus |
| L-1 | fixed | Uji `L-1` (4): tanpa details / tanpa cid / kode laporan tak terdaftar (`SOME_NEW_CODE`) / kode-cid-pointer berteks bebas / Retry-After bukan angka: tidak ada kanari di luar blok. Probe P1/P2 |
| L-2 | fixed | Uji `L-2` (2): 11 varian (spasi, ZWSP, ZWJ, fullwidth, small form, huruf besar, U+2011, U+2010+U+2212, huruf fullwidth) tidak menyisakan `<`/mirip; teks tanpa nama penanda (`nilai < 5 dan <b>`) utuh. Probe P4 |
| L-3 | fixed | Uji `L-3`: slot `rebased: true` -> peringatan `BASIS_REBASED`, kiriman berikut tanpa basis -> BASIS_MISSING tanpa jaringan |
| L-5 | fixed | Uji `L-5` (4): render (galat, status header, nama final tak aman), file_verify (nama tak aman, sha bukan heks), impor (isu + peringatan), status (lint + nama berkas) |
| L-6 | fixed | `docs/STUDIO-MCP.md`: paragraf "Batas yang diketahui" (TOCTOU pra-cek -> tulis, L-4, rebased), paragraf "studio_report_submit dan dokumen yang sudah ada", klaim F-1 dipersempit ke perilaku nyata (termasuk batas: kode server bertoken aman tetap tercetak), paragraf "Teks server di hasil sukses" beserta batasnya, L-2 di bagian data tak tepercaya, uji MCP-D4 di bagian 7. `grep -n "TOCTOU\|balapan\|BASIS_REBASED" docs/STUDIO-MCP.md` -> baris 268, 278, 292, 321, 485 |
| L-4 | tidak diubah (sesuai brief) | Didokumentasikan sebagai batas terbuka yang menunggu keputusan USER |

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Balapan pra-cek -> tulis (TOCTOU) di F-2 dan M-2 | 0 (di luar lingkup perbaikan) | GET R04 dan kiriman adalah dua permintaan; API HTTP tidak boleh diubah | Didokumentasikan di STUDIO-MCP.md | Tidak |
| Residu teks bertoken dari server di luar blok | 0 | `studio_template_get` (kunci slot/sectionType), outline `studio_registry` (berasal dari kode server, tidak dapat ditulis agen), ringkasan langkah `studio_report_submit`/`update` (formatter CLI), dan kode galat server yang berbentuk token aman | Didokumentasikan sebagai batas; bukan teks bebas | Tidak |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| D-1 (L-2) | Escape setiap `<` di structuredContent akan merusak badan yang dikirim ulang (`studio_document_get shape: submission`, Markdown dengan `<`) | Dua tingkat: isi blok TEKS meng-escape setiap `<`/mirip (tidak ada tag apa pun yang bisa muncul di blok); di structuredContent hanya string yang menyebut nama penanda (sesudah NFKC + buang spasi/format/tanda hubung, tak peka huruf) yang di-escape. Homoglif lintas aksara (mis. huruf Kiril) di structuredContent tidak dinormalkan NFKC; di teks tetap aman karena semua `<` di-escape |
| D-2 (L-1) | Selain pesan, kode galat, cid header, pointer, Retry-After, dan nilai di pesan buatan MCP (documentId, nama final, sha, saran format PDF) juga teks server | Pola token aman (`SAFE_CODE`, `SAFE_CID`, `SAFE_POINTER`, `SAFE_TOKEN`); nilai tak aman dipindah ke blok atau tidak dicetak. cid tak aman diganti `mcp-<uuid>` (`correlationSource: "mcp"`), cid mentahnya ada di blok sebagai `serverCorrelationId` |
| D-3 (M-2) | Aturan paling sederhana yang setara F-2/F-3 untuk alat tanpa basis | Di adaptor MCP lewat kait opsional `CliIo.beforeSubmit` (dipanggil sesudah cek lokal, jadi galat lokal tetap tanpa jaringan): target documentId/docNumber -> BASIS_MISSING; mission+docKey: belum ada -> boleh; milik lain -> DOCUMENT_OWNED_BY_OTHER (adopsi sesi -> BASIS_MISSING); milik sendiri + laporan kerja di R21 -> boleh (perilaku CLI lama); milik sendiri bukan laporan kerja -> BASIS_MISSING. Berlaku untuk MD dan json. `studio_report_update` tetap (target documentId + basis wajib, setara alat dokumen) |
| D-4 (L-3) | Pilihan "pertahankan basis lama" vs "lupakan + wajib eksplisit" | Lupakan + peringatan `BASIS_REBASED` + `basisForgotten: true`: mempertahankan basis lama akan memicu 409 atas tulisan sendiri (server tidak mengecualikan penulis sendiri, R3-F3), membingungkan agen |
| D-5 | Harness `studioMock` perlu rute GET R04 untuk pra-cek baru | Tambah rute bawaan `{ documents: [] }` (hanya di `mcp-harness.ts`); uji lama tidak diubah |
| D-6 | DEV dipakai untuk 2 smoke + 1 probe hanya-GET; artefak baru di DEV | Laporan 065/GSP/LAP/XI/2026 dan dokumen klien 010/GSP/KT/XI/2026 di misi `2026-11-02_mcpd4`. Tidak ada 429 kali ini (jeda 15-20 s antarjalan). Rahasia dibaca dari berkas ke env proses dan tidak dicetak |

## Next Steps

- review recommended (lingkup: `scripts/studio/mcp/{tool-kit,doc-tools,tools}.ts`, `scripts/studio/studio-report.ts` bagian `submitPlanOf`/`beforeSubmit`, `tests/unit/studio/mcp/mcp-d4-security.test.ts`, `docs/STUDIO-MCP.md`). Cek ulang keamanan sempit atas M-1/M-2/L-1/L-2/L-3/L-5 bila controller menghendaki.
- Keputusan USER atas L-4 (kunci agentId wajib untuk banyak agen per misi, atau pemanggil tanpa agentId diperlakukan bukan-pemilik).
- Tidak ada commit (sesuai brief).
