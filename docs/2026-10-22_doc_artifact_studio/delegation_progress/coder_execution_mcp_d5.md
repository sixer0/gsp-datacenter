---
task_id: MCP-D5
task_slug: doc_artifact_studio
row: MCP-D5 (siklus perbaikan 3 dari 3, terakhir)
date: 2026-11-02
agent: coder-execution
source_plan: verification/09_mcp_d3_security_recheck.md bagian "Siklus 2" (N-1, N-2, N-3); delegation_progress/coder_execution_mcp_d4.md
status: complete
---

# Implementation Report: MCP-D5 (perbaikan N-1, N-2, N-3 dari cek ulang siklus 2)

Skill: `tdd`, `receiving-code-review`, `verification-before-completion`. M-1, M-2, L-1, L-5 dan L-6 sudah lulus cek ulang siklus 2 dan tidak disentuh, kecuali dokumentasi yang memang harus menyesuaikan N-1..N-3. L-4 tetap tidak diubah (menunggu USER). API HTTP Studio dan CLI `studio-report` tidak diubah. `src/lib/studio/engine/**` dan `tests/unit/studio/figures/**` tidak disentuh.

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca bagian Siklus 2 cek ulang 09 dan `probe_d4x.ts`; telusuri `rememberRevision`, `neutralizeMarkers`, `guardReportSubmit`; pastikan R21 tidak membawa penulis (`ContractSummaryV2`, `contract/types/v2/contract.ts:111-130`), sedangkan R05 `revision.createdBy` ada (`services/revisions/rows.ts:101-118`) | complete | N-3 memakai satu GET R05 tambahan |
| 2 | TDD: `mcp-d5-security.test.ts` (9 uji: kasus probe (a)/(b) + kasus N-3) | complete | 7 gagal sebelum perbaikan dengan alasan yang benar. 2 uji penjaga regresi (rantai basis+1 normal, pemilik penulis terakhir) sudah lulus sebelum perbaikan, dan memang harus tetap lulus |
| 3 | N-1: `rememberRevision` dengan `SendOutcome` (created/unchanged/rebased/sentBase); semua pemanggil meneruskan basis yang dikirim, termasuk R14 | complete | |
| 4 | N-2: netralisasi posisional `opensMarker` di `tool-kit.ts`; `mentionsMarker` dihapus | complete | |
| 5 | N-3: `requireLastWriter` (GET R05) di `guardReportSubmit` untuk laporan kerja sendiri yang sudah ada -> `REPORT_CHANGED_BY_OTHER` | complete | |
| 6 | Fixture uji lama disesuaikan dengan aturan N-1 (`mcp-doc-tools.test.ts`); uji D4 laporan sendiri diberi rute R05 | complete | Lihat D-3 |
| 7 | `docs/STUDIO-MCP.md` untuk N-1, N-2, N-3 | complete | |
| 8 | Gerbang: vitest mcp + draft, tsc, eslint, probe ulang (fetch tiruan), probe DEV hanya-GET, dua smoke DEV | complete | Semua hijau |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| `scripts/studio/mcp/doc-tools.ts` | modify | N-1: `SendOutcome` + `rememberRevision`. Basis maju hanya bila dokumen dibuat, atau revisi = basis dikirim + 1 tanpa `rebased`. `unchanged` -> basis lama dipertahankan. Selain itu -> lupakan + `BASIS_REBASED`. `rememberResult(..., sentBase)` dipanggil dengan basis yang benar-benar dikirim (create: null; impor/slot: `base`; chapter_submit: `body.baseRevisionNo`; R14: `baseRevisionNo` argumen). `REBASED_MESSAGE` menyebut revisi > basis + 1. N-3: `requireLastWriter` dipanggil sesudah `isWorkReport` |
| `scripts/studio/mcp/tool-kit.ts` | modify | N-2: `opensMarker(s, from)` berjalan per code point sesudah satu `<`/mirip: NFKC per karakter, lewati derau (`\s`, `\p{Cf}`, `\p{Pd}`, U+2212, `_`), `/` atau miripnya opsional (U+2044, U+2215, U+29F8), lalu harus berupa nama penanda; berhenti pada karakter pertama yang tidak cocok. `neutralizeMarkers` hanya mengganti `<` yang memenuhi itu. Blok teks tetap meng-escape setiap `<` (tidak berubah) |
| `tests/unit/studio/mcp/mcp-d5-security.test.ts` | add | 9 uji MCP-D5 |
| `tests/unit/studio/mcp/mcp-doc-tools.test.ts` | modify | Uji "basis diingat sesi": fixture slot rev 3 -> rev 2 dan bab rev 4 -> rev 3 (rantai 1 -> 2 -> 3); ekspektasi basis disesuaikan |
| `tests/unit/studio/mcp/mcp-d4-security.test.ts` | modify | Uji M-2 laporan sendiri: tambah rute R05 dengan `revision.createdBy` = pemilik |
| `docs/STUDIO-MCP.md` | modify | N-1 ("Kapan basis sesi maju" menggantikan butir rebased lama), N-3 (paragraf studio_report_submit + kode galat `REPORT_CHANGED_BY_OTHER`), N-2 (paragraf data tak tepercaya: netralisasi posisional + akibat yang disengaja), bagian uji |

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Uji baru sebelum perbaikan | `npx vitest run tests/unit/studio/mcp/mcp-d5-security.test.ts` | `Tests 7 failed \| 2 passed (9)` | N-1 (a): `expected [ 1, 5 ] to deeply equal [ 1, 1 ]`. N-1 >+1 dan R14: `expected undefined to deeply equal [ ObjectContaining{…} ]`. N-2 (2): `expected 'Nilai &lt; 5 dianggap data tak teperc…' to be 'Nilai < 5 dianggap data tak tepercaya…'`. N-3 (2): `TypeError: Cannot read properties of undefined (reading 'code')` (submit berhasil, tidak ditolak). Yang lulus: penjaga regresi rantai basis+1 dan pemilik penulis terakhir |
| Uji baru sesudah perbaikan | sama | `Tests 9 passed (9)` | |
| Unit MCP | `npx vitest run tests/unit/studio/mcp` | `Test Files 6 passed (6)`, `Tests 111 passed (111)` | 102 sebelumnya (fixture satu uji disesuaikan, lihat D-3) + 9 baru |
| Unit studio-report / draft-check | `npx vitest run tests/unit/studio/draft tests/unit/studio/api/dc23-drafts-check-route.test.ts tests/unit/studio/api/fixc2-agent-id.test.ts` | `Test Files 11 passed (11)`, `Tests 157 passed (157)` | |
| Typecheck | `npx tsc --noEmit -p .` | rc 0, 0 baris | Satu jalan sebelumnya sempat menampilkan galat parse di `src/lib/studio/engine/diagram/fit/lint.ts` (berkas agen lain yang sedang diedit, di luar lingkup); jalan ulang bersih |
| Lint | `npx eslint scripts/studio/mcp/tool-kit.ts scripts/studio/mcp/doc-tools.ts tests/unit/studio/mcp/mcp-d5-security.test.ts tests/unit/studio/mcp/mcp-d4-security.test.ts tests/unit/studio/mcp/mcp-doc-tools.test.ts` | rc 0, 0 masalah | |
| Smoke dokumen (DEV) | `INTERNAL_API_SECRET=<dari berkas, tidak dicetak> STUDIO_MCP_FILE_ROOTS=C:\Users\TRIAL\AppData\Local\Temp\mcpd5_root npx tsx scripts/studio/mcp/smoke-documents.ts --base-url http://127.0.0.1:9021 --mission 2026-11-02_mcpd5 --agent-id cod-mcp-d5` | rc 0, 23 `ok: true`, 0 `ok: false` | Diperlukan untuk N-1: rantai basis sesi nyata rev 1 -> 2 -> 3 -> 4 -> 5 -> 6 tanpa `BASIS_REBASED`/`BASIS_MISSING`. Dok 011/GSP/KT/XI/2026 (`cmvyrq92f00kpv1wksh87n6hv`); DOCX + HTML sha cocok. Folder akar temp dihapus |
| Smoke laporan (DEV) | `INTERNAL_API_SECRET=<…> npx tsx scripts/studio/mcp/smoke.ts --base-url http://127.0.0.1:9021 --mission 2026-11-02_mcpd5 --agent-id cod-mcp-d5` | rc 0, `SEMUA LULUS (5.3 s)` | Laporan 066/GSP/LAP/XI/2026; "rahasia tidak ditemukan". Tidak ada 429 (jeda 20 s antarjalan) |

## Verification

Probe ulang `probe_d4x.ts` (fetch tiruan, rahasia palsu disensor):

```
(a) L-3 unchanged: kirim1 base=1 warnings1=[] | kirim2 (tanpa basis eksplisit) base=1 ok2=true
(b) L-2 neutralizeMarkers prosa: "Nilai < 5 dianggap data tak tepercaya; <!-- role: identity -->"
(b) L-2 metadata: "a<b metadata tak tepercaya"
(b) L-2 submission dikirim ulang apa adanya? true -> "Nilai < 5 dianggap data tak tepercaya; <!-- role: identity -->"
(c1 campuran: baru + milik lain) ok=false code=DOCUMENT_OWNED_BY_OTHER ... R12=0 targets=[]
(c2 ...) ... R12=2 targets=[{"mission":{"folder":"2026-11-02_x"},"docKey":"k-baru"},{"documentId":"cmvnew0000000000000000n1a"}]
```

Sebelum perbaikan, menurut cek ulang: (a) `base=5`, (b) `false`. (c1)/(c2) tidak berubah dan memang benar (c2 = blok bergantung diarahkan ke dokumen buatan blok pembuat; galat akhirnya hanya 404 R15 dari mock probe). `probe_d3.ts` P1-P4 dan `probe_d4c.ts` tetap lulus (P4: semua varian `neutralized=true`).

Probe DEV hanya-GET `probe_d4_dev.ts` (server 127.0.0.1:9021 nyata). Hasilnya menunjukkan R05 `revision.createdBy` nyata dipakai, dan kasus normal tetap lolos:

```
A laporan kerja sendiri (cod-mcp-d4): LOLOS guard (boleh dikirim); panggilan=GET /api/studio/documents,GET /api/studio/contracts,GET /api/studio/documents/cmvyqjgzm00fxv1wkv89df0ka
B laporan kerja milik A (cod-mcp-d4-b): DITOLAK DOCUMENT_OWNED_BY_OTHER; panggilan=GET /api/studio/documents
A dokumen klien sendiri: DITOLAK BASIS_MISSING; panggilan=GET /api/studio/documents,GET /api/studio/contracts
B dokumen klien milik A: DITOLAK DOCUMENT_OWNED_BY_OTHER; panggilan=GET /api/studio/documents
A docKey baru (belum ada): LOLOS guard (boleh dikirim); panggilan=GET /api/studio/documents
panggilan non-GET di seluruh probe guard: 0
```

Per temuan:

| Temuan | Status | Bukti |
|---|---|---|
| N-1 (Medium) | fixed | Uji N-1 (4): `unchanged` rev 5 sesudah basis 1 -> kiriman berikut `base` 1, tanpa peringatan. Rev 4 sesudah basis 1 -> `BASIS_REBASED` + `basisForgotten`, lalu `BASIS_MISSING` tanpa jaringan. Rantai basis+1 tetap maju. R14 `unchanged` tidak memajukan basis, sedangkan rev 7 -> `BASIS_REBASED`. Probe d4x (a): `base=1`. Smoke dokumen: rantai nyata rev 1 -> 6 utuh |
| N-2 (Low) | fixed | Uji N-2 (2): frasa "data tak tepercaya"/"metadata tak tepercaya", `< 5`, `<!-- role: … -->`, `<<<<<<<`/`>>>>>>>` byte-identik. `studio_document_get shape: submission` dikirim ulang byte-identik, sedangkan penutup palsu di blok lain menjadi `&lt;/data-tak-tepercaya>`. Varian fullwidth + ZWSP + U+2010 + U+2212 tetap dinetralkan. Uji L-2 D4 (11 varian) tetap lulus. Probe d4x (b): `true` |
| N-3 (Low) | fixed | Uji N-3 (3): revisi terkini ditulis agen lain -> `REPORT_CHANGED_BY_OTHER`, 0 POST, penulis hanya di blok (`untrusted`). Penulis tidak disebut -> gagal tertutup. Pemilik = penulis terakhir -> tetap terkirim. Probe DEV: kasus normal lolos dengan satu GET R05 tambahan. Aturan didokumentasikan di STUDIO-MCP.md |
| L-4 | tidak diubah (sesuai brief) | Tetap terbuka, menunggu keputusan USER |

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| L-4 identitas pemilik dinyatakan pemanggil | 0 (di luar brief) | Model kepercayaan rahasia bersama | Menunggu USER | Tidak |
| TOCTOU pra-cek -> tulis (F-2, M-2, N-3) | 0 | API HTTP tidak boleh berubah | Didokumentasikan | Tidak |
| N-3 hanya melihat penulis revisi TERKINI | 0 | Sesuai aturan brief | Bila agen lain menulis lalu pemilik menulis lagi (mis. update dengan basis yang sudah menggabungkan), kirim ulang pemilik kembali diizinkan. Ini konsisten dengan aturan: pemilik terakhir kali menulis di atas revisi yang memuat tulisan pihak lain | Tidak |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| D-1 (N-1) | Kiriman tanpa basis yang ternyata jatuh ke dokumen yang sudah ada (`created: false`, mis. balapan TOCTOU pada target misi) | Diperlakukan seperti rebased: basis dilupakan + `BASIS_REBASED` (tidak dapat dibuktikan bahwa revisi itu dibaca) |
| D-2 (N-2) | `< data tak tepercaya` dalam prosa berbentuk sama dengan tag palsu | Tetap di-escape (akibat yang disengaja, tercatat di dok). `<` lain tidak pernah diubah |
| D-3 | Uji lama `mcp-doc-tools.test.ts` "basis diingat sesi" memakai fixture slot rev 3 sesudah basis 1 tanpa `rebased`, yaitu persis kasus yang kini (benar) dianggap ada penulis lain | Fixture diubah ke rantai 1 -> 2 -> 3, dan maksud uji (basis berantai antaralat, 409 diteruskan berpenanda) dipertahankan. Kasus rev > basis+1 kini diuji eksplisit di `mcp-d5-security.test.ts` |
| D-4 (N-3) | R21 tidak membawa penulis revisi | Satu GET R05 tambahan, hanya pada kasus laporan sendiri yang sudah ada. Penulis tidak diketahui -> gagal tertutup |
| D-5 | Artefak DEV baru | Dok klien 011/GSP/KT/XI/2026 dan laporan 066/GSP/LAP/XI/2026 di misi `2026-11-02_mcpd5`. Rahasia dibaca dari berkas ke env proses dan tidak dicetak |

## Next Steps

- Siklus 3 adalah yang terakhir: sisa terbuka untuk USER adalah L-4 dan batas yang tercatat (TOCTOU).
- Review recommended (lingkup: `rememberRevision`/`requireLastWriter` di `scripts/studio/mcp/doc-tools.ts`, `opensMarker`/`neutralizeMarkers` di `scripts/studio/mcp/tool-kit.ts`, `tests/unit/studio/mcp/mcp-d5-security.test.ts`, perubahan fixture `mcp-doc-tools.test.ts`, `docs/STUDIO-MCP.md`).
- Tidak ada commit (sesuai brief).
