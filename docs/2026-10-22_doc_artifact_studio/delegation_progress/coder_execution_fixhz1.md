---
task_id: 2026-10-22_doc_artifact_studio
task_slug: doc_artifact_studio
row: FIX-HZ1 (penutup batch Hermes; D-324, D-325)
date: 2026-10-30
agent: coder-execution
source_plan: decisions/decisions.md D-324, D-325; delegation_progress/coder_execution_fixh1.md, coder_execution_fixh2.md; delegation_progress/final_phase_brief.md (pengecualian: baris ini mengubah kode di areanya)
status: complete
---

# Catatan Implementasi FIX-HZ1: details R08, urutan 404/503, R07 preflight + partial, UI awam

Skill: backend-execution, frontend-integration (aturan curl-dulu dipenuhi lewat asap HTTP nyata :9021 sebelum klaim), dry-run-verify-fix. Klaim di `file_claims.md` (baris FIX-HZ1). Semua tulis berkas produksi atomik (`.tmp` lalu rename); `find src tests -name "*.tmp"` tanpa sisa FIX-HZ1.

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca brief, catatan FIX-H1/FIX-H2, D-324, D-325 | selesai | |
| 2 | (1) R08 meneruskan `details` isu | selesai | pemetaan dipindah ke `_shared/error-issues.ts` (route Next hanya boleh mengekspor handler) |
| 3 | (2) R17 urutan auth -> keberadaan dokumen/revisi -> preflight | selesai | dep `assertTarget` (satu baca ringan) hanya sebelum gerbang PDF eksplisit |
| 4 | (3) R07 `rerenderRevision` -> preflight yang sama + penanda sebagian | selesai | gerbang di layanan R07 (bukan `renderRevisionImpl`, yang juga dipakai R04/R09/kiriman) |
| 5 | (4) UI `render-card` + `completeness-tab` | selesai | pembantu murni `render-card-outcome.ts` |
| 6 | Uji unit, tsc, eslint area, glosarium, suite studio | selesai | |
| 7 | Asap :9021 rahasia uji, fixture 0 sisa | selesai | 18/18 |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| `src/app/api/studio/validate/_shared/error-issues.ts` | add | `issuesFromError` (dipindah dari route) + tipe `ValidateIssue`; isu dari galat ber-`details` objek kini membawa `details` apa adanya (mis. `SCOPE_CONFLICT` `reason`, `overwrittenPids`, `forwardToController`, `referenceRevisionNo`...) |
| `src/app/api/studio/validate/route.ts` | modify | impor `issuesFromError` dari modul bersama; perilaku lain tetap |
| `src/app/api/studio/documents/[id]/render/_lib/handler.ts` | modify | dep opsional `assertTarget(documentId, revisionNo)` dipanggil SEBELUM `pdfPreflight` bila `formats` memuat pdf; komentar urutan |
| `src/app/api/studio/documents/[id]/render/_lib/service.ts` | modify | `assertRenderTarget`: 404 `DOCUMENT_NOT_FOUND` / `REVISION_NOT_FOUND` dengan pesan + `details` sama dengan `prepareScopeRender` |
| `src/app/api/studio/documents/[id]/render/route.ts` | modify | pasang `assertTarget: assertRenderTarget`; komentar kontrak |
| `src/lib/studio/services/revisions/index.ts` | modify | HANYA `rerenderRevision`: `assertPdfRenderReady(fmts)` sesudah 404 dokumen/revisi + 409 `RENDER_IN_PROGRESS`, sebelum `renderRevision`; dilewati bila revisi INCOMPLETE (409 `DOCUMENT_INCOMPLETE` tetap didahulukan, sama dengan R17) |
| `src/app/api/studio/documents/[id]/revisions/route.ts` | modify | HANYA POST R07: 200 `{ job, outputs, identical, partial, failedFormats, errors }` + header `X-Studio-Render-Status`; log warn bila job tidak SUCCEEDED; penolakan preflight -> 503 + `Retry-After` (pola R17) |
| `src/components/studio/document-viewer/render-card-outcome.ts` | add | pembantu murni: `pdfNotReadyOf` (503 preflight -> judul, alasan, penyebab awam per `causes[].code`, `suggestedFormats`, label tombol), `outcomeOf` (partial/failedFormats -> kalimat awam; cadangan dari `job.errors` untuk server lama), `formatNames` |
| `src/components/studio/document-viewer/render-card.tsx` | modify | 503 preflight: judul + alasan + daftar penyebab awam + tombol "Buat tanpa PDF (Word, Halaman web)" (memakai `suggestedFormats`; draf -> Word; tidak menunggu hitung mundur), "Coba lagi" tetap dengan hitung mundur `Retry-After`; kode penyebab hanya di Info teknis; hasil sebagian: notifikasi + kalimat format yang belum berhasil |
| `src/components/studio/document-viewer/completeness-tab.tsx` | modify | HANYA `DraftButton` + `draftNotice` baru: 503 preflight -> alasan + penyebab awam + tombol "Buat draf tanpa PDF (Word)"; notifikasi hasil sebagian/gagal dalam bahasa awam |
| `tests/unit/studio/api/fixhz1-render-order.test.ts` | add | 17 uji (butir 1-4) |

`src/lib/studio/services/render/preflight.ts` diklaim tetapi TIDAK perlu diubah (dipakai apa adanya).

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Unit baru | `npx vitest run tests/unit/studio/api/fixhz1-render-order.test.ts` | `Tests 17 passed (17)` | |
| Suite studio | `npx vitest run tests/unit/studio` | `Test Files 79 passed (79)`, `Tests 2192 passed / 1 skipped (2193)` | run pertama: 1 gagal `renderers/docx-determinism.test.ts` (jangkar sha DOCX) saat berkas mesin DOCX baris lain (FIX-H4) sedang berubah; dijalankan terpisah `10 passed (10)`, run kedua penuh hijau. Berkas FIX-HZ1 tidak menyentuh mesin DOCX |
| Typecheck | `npx tsc --noEmit -p .` | exit 0 | |
| Lint area | `npx eslint src/app/api/studio/validate "src/app/api/studio/documents/[id]/render" ".../revisions/route.ts" services/revisions/index.ts services/render/preflight.ts render-card.tsx render-card-outcome.ts completeness-tab.tsx fixhz1-render-order.test.ts` | exit 0 | |
| Glosarium | `npx tsx scripts/studio/glossary-check.ts` | `files=125 texts_checked=2202 HITS_MAIN=0` | |
| Asap :9021 | `FIXHZ1_SECRET=$(cat .../trial_internal_secret) NODE_PATH=<repo>/node_modules npx tsx --tsconfig tsconfig.json <scratchpad>/fixhz1/fixhz1_smoke.ts` | `RESULT pass=18 fail=0` | log `<scratchpad>/fixhz1/fixhz1_smoke.log`; grep isi rahasia di log = 0; DB diverifikasi `gsp_agent_hq_v21` |

## Verification

- (1) Unit: `issuesFromError` membawa `details.overwrittenPids`; larik isu tetap isu; POST `/api/studio/validate` bab v2 dengan dry-run 409 -> isu `details.reason PATCHED_PIDS_OVERWRITTEN` + `overwrittenPids` + `forwardToController`. Asap V1-V3: kiriman nyata 409, validate payload sama 200 `valid:false` dengan isu ber-`details`, dan `details` R08 IDENTIK (JSON sama) dengan badan galat kiriman nyata.
- (2) Unit: dokumen tak ada + pdf + tidak siap -> 404, cek kesiapan tidak dipanggil; revisi tak ada -> 404 `REVISION_NOT_FOUND`; dokumen ada -> 503 preflight; tanpa pdf tidak ada baca tambahan. Asap R1 (dulu 503, kini 404 `DOCUMENT_NOT_FOUND`), R2 404 `REVISION_NOT_FOUND`, R3 503 + `Retry-After: 300` tanpa job.
- (3) Unit R07: pdf eksplisit dan bawaan snapshot -> 503 preflight + `Retry-After`, `renderRevision` tidak dipanggil; dokumen tak ada -> 404 dulu; revisi INCOMPLETE -> 409 dulu; docx -> 200 `partial:false` + header; PARTIAL -> 200 `partial:true`, `failedFormats ["PDF"]`, `errors`, header PARTIAL. Asap E1 503 (`stage:preflight`, `jobCreated:false`, penyebab, `suggestedFormats ["docx","html"]`, `Retry-After 300`, correlation id), E2 tanpa job baru, E3 404 dulu, E4 docx 200 `partial:false`, `failedFormats []`, header = status job SUCCEEDED. Asap sebelum tanda tangan diisi juga membuktikan urutan 409 `DOCUMENT_INCOMPLETE` mendahului 503 di R07. Jalur PARTIAL runtime tidak dapat dipicu di :9021 (PDF terpotong preflight lebih dulu), jadi teruji unit.
- (4) Unit: `pdfNotReadyOf` (judul, alasan, penyebab awam, label "Buat tanpa PDF (Word, Halaman web)", teks server tidak dipakai; permukaan tanpa render/job/payload/JSON/slot/pid), null untuk galat lain / PDF di dalam job; `outcomeOf` + `draftNotice` kalimat awam. Glosarium 0 hit. Tampilan di peramban TIDAK diperiksa (butuh sesi login), hanya pembantu murni + tsc/eslint.
- Fixture: dokumen A (bab v2 misi `2026-10-30_fixhz1_<acak>`, datum-gsp) dan B (v1 datum-kanonik COMPLETE). Pembersihan 2 dokumen, 4 revisi, 1 job, 1 berkas + direktori kosong induknya (penghapusan non-rekursif); Z0 sisa `[0,0,0,0]` + disk 0, Z1 jumlah dokumen dan job global kembali; dicek ulang 15 s kemudian: direktori fixture tidak ada.

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| tidak ada | - | - | - | tidak |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| 2 | Bentuk `details` di isu R08 | medan opsional `details` per isu (aditif, `ValidationIssue` kontrak tidak diubah; tipe lokal `ValidateIssue`); hanya untuk galat ber-`details` objek; larik isu dan `details.issues` tetap diurai seperti dulu |
| 2 | `issuesFromError` diekspor untuk uji | dipindah ke `_shared/error-issues.ts` karena berkas route Next tidak boleh mengekspor selain handler |
| 3 | "hak" pada urutan auth -> dokumen/hak -> preflight | R17 tidak punya cek hak per dokumen selain sesi + pemanggil (`renderScope` juga tidak); urutan yang ditegakkan: sesi -> pemanggil/laju/antrean -> keberadaan dokumen/revisi -> preflight |
| 3 | Baca tambahan | `assertTarget` hanya dipanggil bila pdf eksplisit (jalur lain tanpa baca tambahan; `renderScope` tetap memeriksa sendiri) |
| 4 | Lokasi gerbang R07 | di `rerenderRevision` (format efektif diketahui di sana), bukan `renderRevisionImpl`: yang terakhir juga dipakai R04/R09/kiriman sesudah revisi dibuat, dan 503 di sana akan meninggalkan revisi tanpa render |
| 4 | Urutan 409 vs 503 R07 | revisi INCOMPLETE melewati gerbang agar 409 `DOCUMENT_INCOMPLETE` didahulukan, konsisten dengan R17 |
| 5 | Teks server `details.reason`/`causes[].message` | tidak ditampilkan di permukaan utama (memuat "job render", path endpoint); penyebab dipetakan dari `causes[].code` ke teks awam; kode penyebab dan waktu cek hanya di Info teknis |
| 5 | Klien `doc-api.ts` / `doc-model.ts` (di luar area) | tidak diubah; medan `partial`/`failedFormats` dibaca lewat tipe lokal opsional (aman untuk server lama). Tab Riwayat (`history-tab.tsx`, pemanggil R07 di UI) di luar area: belum menampilkan 503 preflight/partial secara khusus (tetap lewat katalog galat umum) |
| - | Dokumentasi | untuk DOC-3: R08 isu kini dapat membawa `details`; R17 404 mendahului 503 preflight (koreksi catatan FIX-H1 "503 mendahului 404"); R07 503 preflight + `partial`/`failedFormats`/`errors` + header |

## Next Steps

- DOC-3: panduan agen + API reference (R08 `issues[].details`, urutan R17, R07 503/partial).
- Usul baris lanjutan (di luar area): `history-tab.tsx` memakai `pdfNotReadyOf`/`outcomeOf` untuk tombol buat berkas revisi lama.
- Review kode direkomendasikan (lingkup: berkas di tabel Changes Made).
