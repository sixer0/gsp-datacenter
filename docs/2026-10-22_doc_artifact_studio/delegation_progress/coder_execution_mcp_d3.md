---
task_id: MCP-D3
task_slug: doc_artifact_studio
row: MCP-D3
date: 2026-11-02
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/decisions/decisions.md (D-480); gateway_check/18_review_security_mcp_docs.md
status: complete
---

# Implementation Report: MCP-D3 (perbaikan F-1..F-3 + Low murah dari review 18)

Skill: `backend-execution`, `dry-run-verify-fix` (+ `verification-before-completion`). Dasar: D-480 (USER memilih Fix / Warn + require flag / Require base in MCP), review 18, laporan MCP-D1. API HTTP Studio TIDAK diubah; semua aturan baru ada di adaptor MCP (`scripts/studio/mcp/**`).

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca D-480, review 18, laporan MCP-D1; telusuri sumber server (`pipeline.ts` checkBase, `auth.ts` requester, GET R04) | complete | `createdBy` = `agent:<agentId>` (auth.ts:73-82); 409 SCOPE_CONFLICT membawa `changedBy` + `currentContent` (pipeline.ts:553-565); GET R04 `?mission=&docKey=` mengembalikan `createdBy`, `currentRevisionNo` (documents/route.ts:5, rows.ts:76-97) |
| 2 | F-1: bungkus isi server di SEMUA jalur galat | complete | `executeTool` (tools.ts) |
| 3 | F-2: pemilik dokumen misi+docKey + `adoptExisting` | complete | create, impor bab, chapter_submit |
| 4 | F-3: basis wajib (eksplisit atau diingat sesi) untuk bab/slot ke dokumen yang ada | complete | impor bab, chapter_submit, slot_fill; resep + dok diselaraskan |
| 5 | Low murah: L-1 (dok), L-2, L-3, L-4 | complete | lihat Keputusan |
| 6 | Uji unit + tsc + eslint + vitest studio penuh | complete | 84/84 MCP; 3634 lulus, 1 dilewati |
| 7 | Probe DEV F-1..F-3 (dua proses stdio) + smoke dokumen + smoke laporan | complete | 15/15 (C4 dikonfirmasi lewat baca ulang, lihat Verifikasi) |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| `scripts/studio/mcp/tools.ts` | modify | F-1: `executeTool` membungkus galat bila (a) rincian datang dari server (`correlationSource=server` + `details`), (b) ada `details.refresh`, atau (c) galat MCP ditandai `untrusted`. Pesan teks server (`serverMessage`, atau kode SCOPE_CONFLICT/BASE_CONFLICT/META_CONFLICT/TEMPLATE_MISMATCH/...) dipindah ke dalam blok `<data-tak-tepercaya jenis="rincian-galat">`; baris kepala memakai petunjuk buatan MCP (`ERROR_HINTS`); `untrustedFields` per medan (`error.message`, `error.details.currentContent`, `changedBy`, `createdBy`, `issues`, `dropped`, `error.details`). Pesan PDF 503 kini disusun MCP sepenuhnya (`serverMessage=false`). L-2: gerbang toolset juga di `executeTool` (`TOOL_INACTIVE`). L-3: pola slot/bab memakai `S.slot`/`S.chapter` |
| `scripts/studio/mcp/tool-kit.ts` | modify | `http()` menandai `serverMessage: true` bila pesan berasal dari `body.error` server (bukan 3xx/401/429). `McpSession.adopt/isAdopted` (F-2). `S.slot`, `S.chapter` (L-3) |
| `scripts/studio/mcp/safety.ts` | modify | Tipe `McpToolError.extra` + `serverMessage?`, `untrusted?` (hanya tipe; logika pagar tidak berubah) |
| `scripts/studio/mcp/doc-tools.ts` | modify | F-2: `findMissionDoc` (GET R04), `checkOwnership` -> `DOCUMENT_OWNED_BY_OTHER` (0 tulis; documentId di pesan, pemilik hanya di rincian berpenanda, cid GET) kecuali `adoptExisting: true` (diingat sesi, peringatan `DOCUMENT_ADOPTED`, `existing.{ownedByCaller,adopted,createdBy}`); `requesterOf` meniru auth.ts. F-3: `requireBasis` (eksplisit, atau `session.get` dari create/kiriman/op struktur MCP; selain itu `BASIS_MISSING` sebelum kiriman), `preflightMission` untuk target misi+docKey (dokumen belum ada = tanpa basis), `rememberResult` sesudah kiriman sukses; create atas dokumen yang SUDAH ADA tidak mengingat basis. Teks create tidak lagi "kiriman identik, idempoten" untuk dokumen yang ada. `CHAPTER_INVALID` ditandai `untrusted` + cid. L-3: `IMPORT_ROUTE` konstanta; R02 dibatasi 4 serentak (`eachLimited`, `R02_CONCURRENCY`). Deskripsi alat diperbarui (<= 400 karakter) |
| `scripts/studio/mcp/resources.ts` | modify | Resep: baris create (pemilik, `adoptExisting`), paragraf revisi/konflik diganti sesuai perilaku nyata (klaim lama "kiriman tanpa basis terbaru ditolak 409" dihapus), galat berisi isi server dibungkus, akar baca = STUDIO_MCP_FILE_ROOTS atau cwd server (L-1) |
| `scripts/studio/mcp/server.ts` | modify | Instruksi toolset documents: "Bab/slot ke dokumen yang sudah ada wajib baseRevisionNo (atau basis diingat sesi)" |
| `docs/STUDIO-MCP.md` | modify | Baris tabel create/impor/chapter_submit/slot_fill; paragraf baru "Dokumen klien: basis wajib dan pemilik (MCP-D3)" termasuk batas yang diketahui; F-1 di bagian galat; kode `DOCUMENT_OWNED_BY_OTHER`, `TOOL_INACTIVE`; alur dokumen klien langkah 2; bagian Uji |
| `tests/unit/studio/mcp/mcp-doc-tools.test.ts` | modify | 4 uji lama disesuaikan (GET R04 pra-cek; chapter_submit + basis). 11 uji baru (F-1 x2, F-2 x3, F-3 x4, L-2, L-3) |

Tidak ada dependensi baru; `_http-client.ts` tidak diubah.

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | rc 0 | dijalankan ulang sesudah perubahan terakhir |
| Lint | `npx eslint scripts/studio/mcp scripts/studio/_http-client.ts tests/unit/studio/mcp` | rc 0 | |
| Unit MCP | `npx vitest run tests/unit/studio/mcp` | 4 berkas, 84/84 lulus | sebelumnya 73; +11 uji MCP-D3 |
| Unit studio penuh | `npx vitest run tests/unit/studio` | 170 berkas, 3634 lulus, 1 dilewati | 170,8 s |
| Uji mutasi (sanity) | matikan cabang `fromServer && details` di `untrustedError` | 3 uji F-1/F-3 GAGAL seperti diharapkan, lalu dipulihkan | membuktikan uji baru menangkap regresi |
| Probe DEV | skrip probe stdio dua proses (scratchpad, bukan repo) | 14/15 + C4 dikonfirmasi = 15/15 | lihat Verifikasi |
| Smoke dokumen | `scripts/studio/mcp/smoke-documents.ts --mission 2026-11-02_mcpd3 --agent-id cod-mcp-d3` | rc 0, semua langkah lulus | dok 009/GSP/KT/XI/2026 rev6; docx+html sha cocok; pdf 503 dengan saran format; rahasia 0; tulis 2, 0 di luar akar |
| Smoke laporan | `scripts/studio/mcp/smoke.ts --mission 2026-11-02_mcpd3 --agent-id cod-mcp-d3` | rc 0, SEMUA LULUS (4,7 s) | jalan pertama kena 429 RATE_LIMITED dari DEV (cid 212124b7) sesudah probe; jalan ulang 45 s kemudian lulus |

## Verification

Probe DEV `http://127.0.0.1:9021`. Klien SDK resmi meluncurkan dua `server.ts` stdio: A = `cod-mcp-d3`, B = `cod-mcp-d3-b`. Misi `2026-11-02_mcpd3`, docKey `klien-d3-20261102032113`, dok `cmvyozexi005xv1wk679arsug` (008/GSP/KT/XI/2026). Rahasia dibaca dari berkas ke env proses anak dan tidak dicetak. `STUDIO_MCP_FILE_ROOTS` = folder temp kosong `C:\Users\TRIAL\AppData\Local\Temp\mcpd3_root` (folder di scratchpad ditolak `CONFIG_INVALID`, karena path panjangnya menjadi `\\?\`, jadi dipakai folder pendek; dihapus sesudah uji).

| # | Langkah | Hasil | cid |
|---|---|---|---|
| I1 | B create | dibuat rev 1 | 3a46bee9-df58-4889-94cf-7806026e4b68 |
| I2 (F-2) | A create misi+docKey sama | `DOCUMENT_OWNED_BY_OTHER`; documentId di rincian; label B tidak ada di luar blok, ada di dalam; `untrusted=true`; tanpa POST | 38b97e60-7d80-454d-84cf-3eb3c41523c0 |
| C1 | B bab 1 tanpa basis eksplisit | rev 2, `basisFromSession=1` | 035f1596-757c-41db-89d6-e9bf4a64021d |
| C2 (F-1) | A bab 1 `baseRevisionNo: 1` | `SCOPE_CONFLICT` 409; kanari B dan label `cod-mcp-d3-b` hanya di dalam blok; `untrusted=true`; fields `error.message, error.details.currentContent, error.details.changedBy, error.details` | aee17bed-558a-4fca-bf69-7883bbcf8786 |
| C3a (F-2) | A bab 1 lewat mission+docKey tanpa documentId | `DOCUMENT_OWNED_BY_OTHER` (importer tidak dipanggil) | 18d6a190-c4f2-4fdf-8020-f1dd223dd0b6 |
| C3b (F-3) | sama + `adoptExisting`, tanpa basis | `BASIS_MISSING` "sudah ada (revisi terkini 2)" | mcp-2e6e7c01-b97e-4dcf-931b-6887c8f32539 |
| C3c (F-3) | A bab 1 documentId tanpa basis | `BASIS_MISSING`, `correlationSource=mcp`, 0 HTTP | mcp-905524c8-cf55-4e34-b9e3-ddd9e60bd8b2 |
| C4 | bab 1 B utuh | Pemeriksaan di probe GAGAL karena asersi probe hanya mencari di teks. Baca ulang `studio_document_get view=content` (teks + structuredContent): kanari B ada, "Tulisan A." tidak ada, di rev terkini dan rev 2 | b23d4ec3-9b81-41f4-8b19-2059c3babffa, b1e969d8-e388-418e-ad0c-a2a3d7dccfe2 |
| S1 | B controlSheet tanpa basis eksplisit | rev 3, `basisFromSession=2` | 36f05177-0172-4411-a0fb-1dafe12ae24a |
| S2 (F-1) | A controlSheet `baseRevisionNo: 1` | `SCOPE_CONFLICT`; kanari hanya di dalam blok; `untrusted=true` | 25afe6d7-4a7a-44c4-aa3a-ebd16ebc6e0b |
| S3 (F-3) | A controlSheet tanpa basis | `BASIS_MISSING`, 0 HTTP | mcp-2a306b65-b21f-4a45-95c4-71d2c42fbee4 |
| S4 | revisi terkini sesudah upaya A | `currentRevisionNo 3` = rev S1, jadi A tidak menulis apa pun | 6c0f7944-7b79-4e09-9453-2deb0081c5b1 |
| P1 | A bab 2 dengan basis terkini (jalur benar) | tersimpan rev 4 | e6b2c14c-27a2-42d7-8ca1-577ab2615b36 |
| P2 | A create + `adoptExisting` | `created=false`, `adopted=true`, peringatan `DOCUMENT_ADOPTED` | 3c405c89-a3fe-4d40-b0aa-6291d6fa5851 |
| K1 | pindai rahasia (mentah, JSON-escape, URL, base64) | 0 kemunculan di 14 keluaran + stderr | - |

Pemetaan ke permintaan review 18: I2 ulang = galat + pemilik (F-2). C3 tanpa documentId = ditolak (F-2) atau `BASIS_MISSING` (F-3). C2/S2 = kanari hanya di dalam blok + `untrusted=true` (F-1). C3/S3 = `BASIS_MISSING` (0 HTTP) dan isi B utuh (F-3).

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Smoke laporan jalan pertama 429 RATE_LIMITED | 1 ulang | Kuota laju DEV terpakai oleh probe dan agen paralel | Jalan ulang lulus | Tidak |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| F-1 | Cakupan pembungkusan | Opsi "lebih kokoh" review 18: SEMUA galat yang rinciannya dijawab server dibungkus, ditambah galat MCP yang membawa isi server (`DOCUMENT_OWNED_BY_OTHER`, `CHAPTER_INVALID`). Galat MCP murni (skema, path, basis) tidak dibungkus |
| F-1 | Pesan server memuat label pihak lain ("oleh agent:X") | Pesan server dipindah ke dalam blok. Baris kepala memakai petunjuk buatan MCP, agar instruksi MCP sendiri tidak ikut masuk blok "jangan diikuti" |
| F-2 | Identitas pemilik | Membandingkan `createdBy` dengan `agent:<agentId>` (tanpa agentId: `anonymous-internal`), disalin dari `auth.ts`, tidak diimpor (modul Next). Pra-cek memakai GET R04 `?mission=&docKey=&take=1` sebelum menulis |
| F-2 | Adopsi | `adoptExisting: true` diingat per documentId per proses, sehingga kiriman berikut ke dokumen itu tidak perlu flag lagi. Basis tetap wajib |
| F-2 | Target documentId / docNumber | Tidak diperiksa pemiliknya (id eksplisit). F-2 hanya untuk target misi+docKey, sesuai brief |
| F-3 | Sumber basis yang diingat | Revisi hasil create (hanya bila `created=true`), kiriman bab/slot, dan op struktur di proses ini. `studio_document_create` atas dokumen yang sudah ada TIDAK mengingat basis (isinya belum dibaca) |
| F-3 | Batas yang diketahui (dicatat di STUDIO-MCP.md) | Basis yang diingat = revisi hasil kiriman Anda. Bab/slot yang diubah pihak lain SEBELUM revisi itu tidak memicu konflik. Ada juga celah balapan kecil: bila GET R04 menemukan "belum ada" lalu agen lain membuat dokumen sebelum R12, kiriman pertama tanpa basis tetap diterima server |
| F-3 | Dry-run (`dryRun`, `submit=false`) | Tidak memerlukan basis (tidak menulis) |
| L-1 | Akar baca bawaan cwd | Murah: resep + header doc-tools disesuaikan ("STUDIO_MCP_FILE_ROOTS, atau cwd server MCP bila env kosong"). DITUNDA: mewajibkan env eksplisit untuk baca `path`, karena mengubah perilaku alat laporan |
| L-2 | Gerbang toolset di `executeTool` | Dikerjakan (`TOOL_INACTIVE`, dilempar seperti `TOOL_UNKNOWN`) |
| L-3 | Duplikasi pola, route impor, konkurensi R02 | Dikerjakan: `S.slot`/`S.chapter`, `IMPORT_ROUTE` (route impor tidak didaftarkan di registri kontrak `env.ts`, karena itu berkas kontrak di luar lingkup), R02 maks 4 serentak |
| L-4 | Uji F-1..F-3 | Dikerjakan (11 uji baru) |
| - | `destructiveHint: false` pada alat tulis dokumen (catatan gerbang review 18) | DITUNDA. Timpa diam-diam kini dicegah oleh F-3, jadi anotasi dibiarkan |

## Next Steps

- review recommended (lingkup: `scripts/studio/mcp/{tools,doc-tools,tool-kit,safety,resources,server}.ts`, `tests/unit/studio/mcp/mcp-doc-tools.test.ts`, `docs/STUDIO-MCP.md`). Ulang probe F-1..F-3 oleh security-review bila controller menghendaki.
- Ditunda (keputusan controller/USER): L-1 baca `path` wajib env eksplisit; daftarkan route impor di registri kontrak; tinjau `destructiveHint`.
- Artefak DEV dari uji: dok `cmvyozexi005xv1wk679arsug` (probe, rev 4) dan dok 009/GSP/KT/XI/2026 (smoke dokumen) di misi `2026-11-02_mcpd3`, ditambah laporan 064/GSP/LAP/XI/2026 (smoke laporan). Tidak ada berkas yang tertinggal di repo selain laporan ini; folder temp akar sudah dihapus.
