---
task_id: 2026-10-22_doc_artifact_studio
task_slug: doc_artifact_studio
row: FIX-H1 (batch Hermes, D-321 friksi C1, D-322)
date: 2026-10-30
agent: coder-execution
source_plan: decisions/decisions.md D-321, D-322; hermes_trial/02_trial_report_full.md C1, G1; delegation_progress/final_phase_brief.md
status: complete
---

# Catatan Implementasi FIX-H1: gagal cepat PDF + penanda hasil sebagian

Skill: backend-execution, dry-run-verify-fix. Area diklaim di `file_claims.md` (prefiks FIX-H1). Semua tulis atomik (berkas `.tmp` lalu rename); `find src tests -name "*.tmp"` tidak memuat berkas FIX-H1.

## Langkah yang Dijalankan

| Langkah | Tugas | Status | Catatan |
|---|---|---|---|
| 1 | Baca brief, laporan Hermes (C1, F, G1), D-247, D-321, D-322 | selesai | |
| 2 | Petakan R17, `renderScope`, R09, modul kesiapan | selesai | modul kesiapan = `engine/soffice/readiness.ts` + `readiness-rules.mjs` (cache C15 300 s); dipakai baca-saja, tidak diubah |
| 3 | Gerbang awal PDF (`services/render/preflight.ts`) | selesai | dipakai di route R17 (formats eksplisit) dan di `renderScope` (format efektif/bawaan) |
| 4 | Penanda hasil sebagian R17 + R09 | selesai | `partial`, `failedFormats`, `errors`, header `X-Studio-Render-Status` |
| 5 | Uji unit, tsc, eslint, suite studio | selesai | lihat Hasil Uji |
| 6 | Asap :9021 dengan rahasia uji, fixture terisolasi | selesai | 9/9, 0 sisa |

## Perubahan

| Berkas | Jenis | Deskripsi |
|---|---|---|
| `src/lib/studio/services/render/preflight.ts` | tambah | `assertPdfRenderReady(formats, readiness?)`: PDF di format + `ready=false` (atau cek melempar) -> `StudioEngineError("PDF_ENGINE_UNAVAILABLE")` dengan `details` tahap preflight; `layCausesOf` (galat teknis -> penyebab awam bergrup, tanpa path); `renderOutcomeMarker`; `renderStatusHeaders`; `isPdfPreflightRejection`; `withRetryAfterHeader` |
| `src/lib/studio/services/render/scope.ts` | ubah | `renderScope`: gerbang PDF atas format efektif (`pureRequestedFormats`) SETELAH validasi rencana (404/409/422 tetap didahulukan) dan SEBELUM antrean/`createRenderJob` |
| `src/lib/studio/services/render/index.ts` | ubah | ekspor preflight (aditif) |
| `src/app/api/studio/documents/[id]/render/_lib/handler.ts` | ubah | dep opsional `pdfPreflight` dipanggil bila `formats` memuat pdf (tanpa sentuh DB); tangkap penolakan preflight (route atau layanan) -> 503 + `Retry-After`; respons 200 + `partial`, `failedFormats`, `errors` + header; log warn bila job tidak SUCCEEDED |
| `src/app/api/studio/documents/[id]/render/route.ts` | ubah | pasang `pdfPreflight: assertPdfRenderReady`; komentar kontrak |
| `src/app/api/studio/artifacts/route.ts` | ubah | R09 201 + `partial`, `failedFormats` + header (penanda sama dengan R17) |
| `tests/unit/studio/api/fixh1-render-preflight.test.ts` | tambah | 16 uji |

## Keputusan desain

| Butir | Keputusan | Alasan |
|---|---|---|
| Kode galat | Pakai kode lama `PDF_ENGINE_UNAVAILABLE` (503), tanpa kode baru | `contract/errors.ts` sudah menyatakan "hanya PDF diminta -> 503 PDF_ENGINE_UNAVAILABLE"; panduan §12 sudah memberi tindakan agen ("render ulang setelah GET /render-env siap"). Kode baru akan menyentuh `contract/enums.ts` (di luar area). Pembeda dari galat PDF di dalam job: `details.stage = "preflight"`, `jobCreated: false` |
| Badan 503 | `{ error, code, details: { stage, jobCreated, reason, causes[{code,message,count}], retryable, requiresOperatorAction, retryAfterSec, requestedFormats, suggestedFormats, statusEndpoint, checkedAt } }` + header `Retry-After: 300` + `x-correlation-id` | `reason`/`causes` awam; `suggestedFormats` langsung dapat dipakai sebagai `formats`; `retryAfterSec` = cache kesiapan C15 (300 s) karena hasil "tidak siap" juga di-cache |
| Hasil sebagian: kode HTTP | TETAP 200 (R17) / 201 (R09) + medan `partial: boolean` (selalu ada), `failedFormats` (selalu ada), `errors`, header `X-Studio-Render-Status` | Bukan 207: 207 Multi-Status adalah WebDAV dengan badan multistatus; `fetch().ok` tetap true untuk 207 sehingga tidak menambah keterdeteksian; R09 wajib tetap 201 (baris artefak sudah dibuat); mengganti status memutus klien/uji yang ada. Satu medan boolean selalu-ada lebih mudah dicek mesin daripada membedakan 200/207 |
| `failedFormats` | format job tanpa berkas keluaran + format di `errors[].format`; pada render dokumen SVG/PNG tanpa berkas tidak dihitung (dokumen bisa tanpa figur); huruf besar seperti `job.formats` | `partial` mengikuti status job, jadi PARTIAL tanpa format gagal (mis. galat lint) tetap ditandai |
| Urutan R17 | pdf eksplisit diperiksa sebelum dokumen dibaca: dokumen tak ada + pdf -> 503, + docx -> 404 | gagal cepat tanpa DB; format bawaan diperiksa di layanan setelah validasi rencana |
| Format bawaan | Tanpa `formats`, bawaan snapshot (DOCX+PDF+HTML) juga digerbang | mencegah PARTIAL diam-diam pada permintaan tanpa formats |

## Hasil Uji

| Jenis | Perintah | Hasil |
|---|---|---|
| Unit baru | `npx vitest run tests/unit/studio/api/fixh1-render-preflight.test.ts` | 16 passed (16) |
| Suite studio | `npx vitest run tests/unit/studio` | Test Files 77 passed (77); Tests 2135 passed, 1 skipped (run kedua; run pertama sempat memuat 2 berkas uji baris lain yang sedang ditulis, FIX-H7 `import/md-v1` dan FIX-H4 `zz-fixh4-explore2`, lalu hilang/hijau) |
| Typecheck | `npx tsc --noEmit -p .` | exit 0 |
| Lint area | `npx eslint preflight.ts scope.ts index.ts "src/app/api/studio/documents/[id]/render" src/app/api/studio/artifacts/route.ts fixh1-render-preflight.test.ts` | exit 0 |
| Asap :9021 | `NODE_PATH=<repo>/node_modules npx tsx --tsconfig tsconfig.json <scratchpad>/fixh1/fixh1_smoke.ts` | `RESULT pass=9 fail=0`; log `<scratchpad>/fixh1/fixh1_smoke.log` (rahasia tidak tercetak: grep isi rahasia di log = 0) |

## Verifikasi per kriteria

- (1) pdf + `ready=false` -> 503 tanpa job: unit "formats memuat pdf ... renderScope TIDAK dipanggil"; asap S2 (503, `stage:"preflight"`, `causes[0].code FONTS_NOT_LOADED_IN_SESSION` count 17, `Retry-After 300`, correlation id), S2b job dokumen fixture 0 -> 0, S3 tanpa formats -> 503 dari layanan, Z1 total job global 10 -> 10.
- (2) tanpa pdf tetap jalan: unit "tanpa pdf saat render-env tidak siap -> 200" (cek kesiapan tidak dipanggil); asap S4 docx+html -> 200 SUCCEEDED, `partial:false`, `failedFormats:[]`, header SUCCEEDED, keluaran DOCX+HTML.
- (3) penanda sebagian: unit R17 PARTIAL (`PDF_CONVERT_FAILED`) -> 200 `partial:true`, `failedFormats:["PDF"]`, `errors`, header PARTIAL; unit R09 PARTIAL -> 201 `partial:true` + header; aturan marker bersama 3 uji. Runtime PARTIAL tidak dapat dipicu di :9021 (render-env tidak siap memotong PDF lebih dulu), jadi bukti jalur ini unit saja.
- Fixture: dokumen misi `2026-10-30_fixh1_mvudqt2f` (datum-gsp, R12 201); pembersihan 1 dokumen, 1 revisi, 1 job, 2 berkas + direktori misi; Z0 sisa `[0,0,0,0,0,0,0]` (dokumen, revisi, bab, blok, identitas, job, berkas) dan disk 0.

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| tidak ada | - | - | - | tidak |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| 3 | Kode galat baru vs lama | Kode lama `PDF_ENGINE_UNAVAILABLE`; tidak ada perubahan `contract/errors.ts`/`enums.ts` |
| 4 | 207 vs 200 + medan | 200/201 + `partial`/`failedFormats` + header (alasan di atas), konsisten R17 dan R09 |
| 4 | Penanda header baru `X-Studio-Render-Status` | aditif, dicatat untuk DOC-3 |
| - | Dokumentasi | permintaan DOC-3 dicatat di `file_requests.md` (baris FIX-H1): panduan §12, API-REFERENCE R17/R09, register 03 |
| - | Di luar area, untuk controller | (a) R07 `POST /documents/[id]/revisions` (`renderRevision`) belum digerbang; dapat memakai `assertPdfRenderReady` yang sama bila diinginkan; (b) UI `render-card.tsx`/`completeness-tab.tsx` (bawaan pdf dicentang; draf `["pdf"]`) kini menerima 503 saat render-env tidak siap: perlu menampilkan `details.reason`/`suggestedFormats` (area komponen); (c) urutan 503 mendahului 404 untuk pdf eksplisit perlu disebut di panduan |

## Next Steps

- DOC-3: dokumentasi sesuai `file_requests.md` FIX-H1.
- Review kode direkomendasikan (lingkup: berkas di tabel Perubahan).
