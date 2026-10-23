# INT-R coder-execution: lanjutan IP-35 / D-98 / D-102 + F-048

Status: complete (2026-10-23). Skills: backend-execution, dry-run-verify-fix (1 siklus perbaikan: TS2353 `correlationId` pada `resolveTemplateFor`). Klaim INT-R di file_claims.md.

Berkas: `src/app/api/studio/validate/route.ts` (FORBIDDEN di `HARD_CODES`), `src/lib/studio/services/render/artifact.ts` (baru `gateHtmlArtifact` + `HtmlArtifactGate`; preflight sebelum job), `src/app/api/studio/artifacts/_lib/prepare.ts` (`PrepareContext.caller?` -> gerbang sebelum baris), `src/lib/studio/services/revisions/index.ts` (`assertTemplateUsable` purpose "revision" di patchBlock), `src/components/studio/template-editor/{api.ts,shared.tsx,template-list.tsx,template-editor.tsx}` (`restrictionOf`, `RestrictedPill` "Terbatas (ADMIN)", tone warn, title = cek yang dilepas), `scripts/ensure-profile-complete.d.mts` (INT-K, hanya tipe).

F-048: `gateHtmlArtifact(spec, caller)` = `resolveTemplateFor(slug, version, caller, { purpose: "render" })` lalu, untuk sumber inline, `ingestDocument(..., { dryRun: true, template: <templat artefak> })` (gerbang ingest utuh: strip penanda trust.ts, templat terbatas setelah override, hak override K/T, skema, P3-20, aset, bind, ingestPolicy per tier). Tidak sah -> 422 BY_CONSTRUCTION_FAILED (lint terisi) / kode hak override / 400 SCHEMA_INVALID; pointer relatif spec (`/source/document/...`). Render memakai dokumen yang sudah dibuang penandanya bila tidak tepercaya (+ job log BENCHMARK_MARKER_STRIPPED/ENFORCEMENT_OVERRIDE_STRIPPED). Tanpa logika gerbang baru.

Seed: `npx tsx prisma/seed-studio.ts --import-benchmark` (DATABASE_URL -> localhost:5433/gsp_agent_hq_v21, dicek `current_database()` oleh seed) exit 0: datum-manual-000 versi baru v2 (paramsSha256 bee70bde...); efek samping skrip: datum-kanonik disinkron v4 (registri berubah). listTemplates: datum-manual-000 v2 restricted=true [DATUM-04, DATUM-09, G3]; datum-kanonik v4 false. TemplateVersion 4 -> 6.

Bukti (scratch tsx, DB v21; hitungan Document/Revision/Block/Artifact/RenderJob/TemplateVersion sebelum = sesudah = 0/0/0/0/0/6, equal=true):
- validate route POST (sesi HQ uji): USER 403 FORBIDDEN; AGENT (x-internal-secret) 403; ADMIN 200 valid=true.
- gate inline (kanonik v4, x.lintEnforcement release DATUM-04/09/G3): USER 422 (11, pointer /source/document/chapters/1/sections/3/title); ADMIN lolos; USER + x.benchmark 422 (11); USER templat m000 403; ADMIN m000 lolos.
- prepareArtifact(caller USER) 422 (11); renderArtifact USER (baris artefak di-stub) 422 sebelum job (RenderJob tetap 0).
- patchBlock stub (dokumen/revisi di-stub berpin m000 v2, target 1.1.1): USER 403, AGENT 403.
- `npx tsc --noEmit -p tsconfig.json` exit 0, 0 galat (TS2305 user-access tertutup). `npx eslint <area>` exit 0.

Keputusan (dicatat controller): (1) gerbang inline memakai `ingestDocument` dryRun dengan templat artefak, juga untuk ADMIN (override/penanda dihormati); aset harus dapat diresolusi seperti ingest (sebelumnya render hanya peringatan). (2) prepare tanpa `ctx.caller` tetap `resolveTemplate` (tidak fail-closed agar ADMIN tidak terblokir); penegak otoritatif = preflight `renderArtifactImpl`. (3) patchBlock dengan caller undefined -> diperlakukan tidak tepercaya (403 untuk templat terbatas).

Permintaan lintas pemilik: route R09 `artifacts/route.ts` meneruskan `caller` ke `prepareArtifact` (file_requests.md, tidak blocking).

Temuan: 1. MINOR: tanpa permintaan di atas, penolakan 403/422 R09 terjadi setelah baris `StudioArtifact` dibuat (baris tanpa keluaran/job). 2. INFO: artefak CHART dengan templat terbatas tidak digerbang (di luar brief; parameter lint tidak berpengaruh ke SVG). Review direkomendasikan (S87 security + senior-code-reviewer: artifact.ts gateHtmlArtifact, prepare.ts, revisions patchBlock).
