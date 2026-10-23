# S102 - panel status mesin render (coder-execution, 2026-10-23)

Status: complete. Skills: frontend-integration, backend-execution, dry-run-verify-fix.

Berkas (7, semua baru, area eksklusif S102):
- `src/app/api/studio/render-env/route.ts` - R11 GET (requireSession; `jobs=1`, `take` 1..200 bawaan 50, `status=A,B`, `log` 0..100 bawaan 20, `refresh=1` khusus ADMIN_SESSION)
- `src/app/api/studio/render-env/_lib/status.ts` - perakit hanya-baca: `checkRenderEnvReadiness` (cache C15), `resetReadinessCache`+`force` saat refresh, `sofficeQueueState`, manifest S91 (nama berkas fon + `required`), `StudioRenderJob` + `groupBy` status, ekor `engine.log` tanpa `stack_trace`
- `src/app/studio/system/page.tsx`
- `src/components/studio/render-status/{index.tsx,readiness.tsx,jobs.tsx,hints.ts,use-render-env.ts,types.ts}`

Respons 200 = perluasan aditif `RenderEnvResponse`: `readiness`, `fonts[{family,style,file,required,fileExists,sha256Ok,registered,ok}]`, `queue{active,queued,max}`, `manifest{path,readable,createdAt,sofficeVersion,chromiumVersion}`, `viewer{canRefresh}`, `refreshed`, `jobs?` (RenderJobDto + `errorSummary`, `logTail`, `logTotal`, `logDropped`), `jobCounts?`, `jobsError?` (DB gagal -> kesiapan tetap dikirim). Galat: 400 SCHEMA_INVALID, 401, 403 refresh non-admin, 500 tanpa stack.

Bukti:
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/(app/studio/system|app/api/studio/render-env|components/studio/render-status)"` -> kosong
- `npx eslint src/app/studio/system src/app/api/studio/render-env src/components/studio/render-status` -> exit 0
- Uji jalan handler `GET` langsung (tsx, DB gsp_agent_hq_v21, baca saja): tanpa sesi 401; USER 200 ready=true, 22/22 fon ok, soffice 24.2.3.2, queue 0/0/2, canRefresh=false; USER `status=FAILED,PARTIAL` 1 job PARTIAL + logTail tanpa stack; USER refresh 403; kueri salah 400 (2 issue); ADMIN refresh 200 + baris log `studio.api.render-env` di `data/studio-workspace/logs/api/studio-api-2026-10-22.jsonl`
- Render statis `ReadinessSection`/`JobsSection` dengan data nyata OK; panel awal = skeleton `aria-busy`
- Browser: TIDAK diverifikasi (HQ v2.1 tidak berjalan; port 3000 = server Express lain). Alur Y di S80.

Keputusan (untuk dicatat controller):
1. Refresh non-admin = 403 dengan `code: "UNAUTHORIZED"` (StudioErrorCode tidak punya kode terlarang generik; status 403 menegaskan sesi sah tetapi bukan admin).
2. Tombol "Periksa ulang" tampil hanya bila `viewer.canRefresh` (tanpa panggilan `/api/auth/me` tambahan).
3. Path user di `readiness.errors` diganti `%USERPROFILE%`; `fonts[].file` hanya nama berkas.
4. Logging server memakai `studioApiLog`/`failure` dari `src/app/api/studio/templates/_lib/http.ts` (S54, impor baca saja, pola sama dengan R03). Klien memakai `useRetryCooldown`/`RetryButton` (S61) dan `studioGet`/`reportClientError`/label (S60).
5. Pemantauan otomatis 15 dtk (bisa dimatikan), hanya saat tab terlihat dan muatan terakhir berhasil.

Temuan: (a) job PARTIAL nyata `cmvju4s670008v1eo852ajom2` (uji asap S100): HTML `FILE_MISSING_ON_DISK` "writeOutput: invalid mime (mime)" - jalur hand-off HTML S51/S52 perlu diperiksa. (b) Belum ada endpoint log galat klien (`reportClientError` hanya konsol, sama seperti S60).
Permintaan lintas pemilik: tidak ada.
