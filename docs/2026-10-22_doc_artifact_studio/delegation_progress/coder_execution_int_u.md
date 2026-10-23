# INT-U coder-execution: sisa F-048 / D-107 (R09 meneruskan caller)

Status: complete (2026-10-23). Skills: backend-execution. Klaim INT-U di file_claims.md. Menutup permintaan INT-R (file_requests.md baris INT-R).

Berkas: `src/app/api/studio/artifacts/route.ts` (POST: `prepareArtifact(parsed, { ...ctx, caller })`, `caller` dari `getStudioCaller` yang sudah ada setelah `requireSession`; komentar header R09 diperbarui). Satu-satunya pemanggil `prepareArtifact` di `src/app/api/studio/artifacts/**` (grep). `_lib/prepare.ts` tidak diubah. Pemetaan galat tetap lewat `failure()` dari `src/lib/studio/http` (tanpa helper baru).

Bukti (scratch `intu_verify.ts`, POST handler dipanggil langsung dengan Request buatan + cookie `gsp_hq_session` ditandatangani `createSessionToken`; `current_database()` = gsp_agent_hq_v21, dicek tiap hitungan):
- USER + dokumen inline melanggar (kanonik, `x.lintEnforcement` dibuang ENFORCEMENT_OVERRIDE_STRIPPED): 422 BY_CONSTRUCTION_FAILED, 11 details, pointer pertama `/source/document/chapters/1/sections/3/title`; StudioArtifact 0 -> 0.
- USER + templat `datum-manual-000` (v2 terbatas): 403 FORBIDDEN (log TEMPLATE_RESTRICTED_DENIED); StudioArtifact 0 -> 0.
- ADMIN + `datum-manual-000` + dokumen benchmark: 201, job SUCCEEDED, errors []; StudioArtifact 0 -> 1. Dibersihkan: artefak `cmvjw4xsk0001v1ocyhs0oiav` (cascade job `cmvjw4yi40003v1ochqyoy4ik` + 1 baris output, 1 berkas keluaran dihapus via `resolveSafe`). Sesudah: artifacts/renderJobs/outputs = 0/0/0.
- Run percobaan ADMIN sebelumnya (kanonik + override): 201 dengan job FAILED (HTML_RENDER_FAILED, derivasi tanpa result() karena penanda benchmark dibuang) -> artefak `cmvjvrz0z0001v1g8hm3t2yc2` dan `cmvjvs8og0001v1q8s1dn7iij` (+ job masing-masing) dihapus oleh skrip; satu run yang di-timeout tidak meninggalkan baris (cek `createdBy contains intu-`: kosong, total 0).
- `npx tsc --noEmit -p tsconfig.json` exit 0, 0 galat. `npx eslint src/app/api/studio/artifacts` exit 0.

Keputusan: tidak ada keputusan baru; perilaku mengikuti INT-R (prepare dengan caller = gerbang otoritatif sebelum baris).

Temuan: 1. INFO: ADMIN + dokumen inline tanpa penanda benchmark dengan derivasi tanpa `result()` mendapat 201 + job FAILED (bukan 422) karena gerbang ingest melepas cek itu lewat override ADMIN tetapi renderer HTML tetap menolak derivasi tanpa result(). Perilaku lama, di luar area. Review direkomendasikan (ringan): route.ts baris POST.
