---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: FIX-4a
date: 2026-10-23
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/masterplan/04_studio_ux_spec.md (§6.2, §6.4, §7 FIX-4a); decisions D-161, D-163
status: complete
---

# FIX-4a: fondasi UI Studio ramah pengguna

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca spesifikasi UX §1.2/§2/§5/§6/§7/§9, D-161, D-163, S86 R05-R07/R10/R11/R14/R16/R17/SEC-3, blueprint §2.6, kode UI | selesai | |
| 2 | Klaim jalur di `file_claims.md` (prefiks FIX-4a) | selesai | |
| 3 | Uji endpoint nyata (curl :9021) | selesai | `/api/auth/me` 401 `{"user":null}`; `/api/studio/templates` 401 `{"error":"Unauthorized"}` (tanpa `code`, tanpa `x-correlation-id`) -> `http.ts` memetakan 401 tanpa kode ke `UNAUTHORIZED` |
| 4 | 12 modul `shared/` + token + index | selesai | lihat Changes |
| 5 | Kontrak `STUDIO_NAV` + sidebar + palet + subnav | selesai | satu sumber (R14) |
| 6 | Boundary akar + segmen, layout | selesai | R07, R16 (judul) |
| 7 | Kit `Button` aditif (T-8) | selesai | |
| 8 | Gerbang D-133 | selesai | lihat Test Results |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/components/studio/shared/http.ts | add | `requestJson<T>(url,{source,json,body,quietStatuses,logContext,...})`, satu `StudioApiError {status,code,message,details,correlationId,url,method,retryAfterSec,retryable}`, `studioSource` (memaksa `studio.ui.<modul>.<sumber>`, menormalkan `studio-ui:`), `parseRetryAfter`, `issuesOf`, `withQuery`, `isAbortError`; setiap galat dicatat `client-log` dengan correlationId |
| src/components/studio/shared/use-cooldown.ts | add | satu hook jeda 3/6/12 s maks 3 (`arm/trigger/holdFor/reset`, `persistKey` untuk fallback boundary) |
| src/components/studio/shared/use-studio-query.ts | add | muat data: dedupe in-flight per kunci, AbortController, aman StrictMode (abort ditunda satu tick), data/galat terikat kunci, `isRefreshing`, `retry()` berjeda, `refetch()` |
| src/components/studio/shared/file-url.ts | add | `fileUrl(file,"inline"\|"download")` -> `string\|null`; URL server hanya dipakai bila berawalan `/api/studio/files/` + satu segmen id aman (tolak skema, `//`, `..`, backslash, kontrol); `canOpenInline` (Word hanya Unduh) |
| src/components/studio/shared/error-messages.ts | add | `ERROR_CATALOG` (15 kode §5.2 + kode v1 yang masih dipakai route) + `errorMessages(err, ctx)` -> `{title, body, actions, retryable, retryAfterSec, code}`; pesan server mentah tidak pernah dikembalikan |
| src/components/studio/shared/labels.ts | add | kamus §1.2 (TERMS, status kelengkapan/bagian, mode isi, tingkat terbitan, pemeriksaan, format, status berkas, jenis bagian), `formatDateTime` "23 Okt 2026, 09:12", `missionLabel` (T-3), `FORBIDDEN_SURFACE_WORDS` |
| src/components/studio/shared/dialog.tsx | add | `ConfirmDialog` + `Sheet` di atas `<dialog>.showModal()` (inert/focus trap bawaan, fokus awal tombol aman, Esc/latar = batal, pemulihan fokus, aria-labelledby/describedby, tombol bahaya ghost `--down`) |
| src/components/studio/shared/notice.tsx | add | `NoticeProvider`/`useNotice` (`notify`, `announce` lewat satu aria-live), notifikasi 5 s jeda saat hover/fokus, `RefreshingIndicator`; tanpa dependensi (T-7) |
| src/components/studio/shared/completeness-rail.tsx | add | Rel `list`/`md`/`sm`; tipe LOKAL `CompletenessSummary` + `TODO(SR-04)`; fungsi murni `buildRailSegments`, `describeMissing`, `railStats`, `railAriaLabel`; status = warna + pola |
| src/components/studio/shared/info-teknis.tsx | add | `<details>` terlipat, dirender hanya untuk ADMIN |
| src/components/studio/shared/use-viewer.ts | add | `ViewerProvider` + `useViewer` (janji bersama `/api/auth/me`, TTL 5 menit, 401 senyap -> null; gagal/memuat -> `isAdmin=false`) |
| src/components/studio/shared/error-view.tsx | add | `ErrorView` (judul awam, coba ulang berjeda, "Masuk lagi" 401, Info teknis) + `StudioSegmentError` (log sekali per galat, jeda bertahan antar-pasang ulang) |
| src/components/studio/shared/studio-tokens.css | add | token lembar baca lokal `.studio-root`, latar `<dialog>`, keyframe notifikasi, reduced-motion |
| src/components/studio/shared/index.ts | modify (aditif) | ekspor modul non-klien baru; ekspor lama tetap |
| src/app/studio/layout.tsx | modify | `ViewerProvider` + `NoticeProvider` + `.studio-root` + token; judul `studioPageTitle("Beranda")`; teks kepala awam |
| src/app/studio/error.tsx | add | boundary akar Studio |
| src/app/studio/documents/[id]/error.tsx | add | boundary halaman dokumen |
| src/app/studio/templates/[id]/error.tsx | add | boundary editor templat + Susunan |
| src/components/studio/document-viewer/studio-subnav.tsx | modify | dari `STUDIO_NAV` + peran; pemisah sebelum grup admin; ikon Beranda `FileStack` |
| src/lib/studio/contract/ui.ts | modify (aditif) | `StudioNavEntry` + `shortLabel/paletteLabel/audience/exact`; urutan §2.1; label "Templat", "Galeri artefak", "Alat developer", "Sistem"; `STUDIO_PALETTE_ACTIONS`, `studioNavFor`, `studioPageTitle` |
| src/components/sidebar.tsx | modify (bagian Studio) | `STUDIO_SIDEBAR_LABELS` dihapus; item dari `studioNavFor(isAdmin)` + pemisah "Alat admin" |
| src/components/command-palette.tsx | modify (bagian Studio) | `STUDIO_PALETTE_LABELS` dihapus; entri dari `STUDIO_NAV` + `STUDIO_PALETTE_ACTIONS` sesuai peran |
| src/components/ui/kit.tsx | modify (aditif, T-8) | `Button` + `ariaDisabled` (tetap dapat difokus/diklik) dan `ariaDescribedBy` |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck repo | `npx tsc --noEmit -p .` | exit 0, 0 galat | seluruh repo; impor lama tidak rusak |
| Lint area milik FIX-4a | `npx eslint src/components/studio/shared src/app/studio/layout.tsx src/app/studio/error.tsx "src/app/studio/documents/[id]/error.tsx" "src/app/studio/templates/[id]/error.tsx" src/components/studio/document-viewer/studio-subnav.tsx src/lib/studio/contract/ui.ts src/components/ui/kit.tsx` | exit 0 | |
| Lint sidebar + palet | `npx eslint src/components/sidebar.tsx src/components/command-palette.tsx` | 4 galat, SEMUA sudah ada di HEAD | HEAD: sidebar static-components @106,162; palet set-state-in-effect @75,112 (`git show HEAD:<f> \| npx eslint --stdin`) — tidak di bagian Studio; dicatat di `file_requests.md` |
| Asap rute | `curl -s -o /dev/null -w "%{http_code}"` ke :9021 | `/studio` 307 -> /login; `/studio/documents` 307 -> /login; `/login` 200 | redirect sesi wajar |
| Asap tsx | `npx tsx <scratchpad>/fix4a_smoke.ts` | 24/24 PASS, exit 0 | fileUrl (inline/download, tolak absolut/`//`/traversal/`javascript:` -> null), errorMessages (DOCUMENT_INCOMPLETE, 429 "Tunggu 7 detik", 401, jaringan, 5xx, galat render, pesan server tidak bocor), studioSource, rel ("5 dari 7 bagian terisi; belum diisi: Lembar kendali, Bab 4"), missionLabel, nav USER/ADMIN |

Kutipan asap: `fileUrl({id:"f1",url:"/api/studio/files/f1?inline=1&verify=1"},"download")` = `"/api/studio/files/f1?download=1"`; `errorMessages(409 DOCUMENT_INCOMPLETE,{missing:["Lembar kendali","Bab 4"]})` = `["Dokumen belum lengkap","Berkas lengkap butuh semua bagian wajib. Belum ada: Lembar kendali, Bab 4.",["Buat draf bab ini","Lihat kelengkapan"],false]`.

## Verification
- R05/R17: satu `requestJson` + satu `StudioApiError`, sumber log dipaksa `studio.ui.*` — asap `source format` PASS.
- R06/SEC-3: `fileUrl` + validasi awalan — 8 kasus asap PASS.
- R07: `src/app/studio/error.tsx` + dua boundary segmen ada; tsc/eslint 0.
- R10: `use-cooldown.ts` satu hook; R11: `dialog.tsx` `<dialog>` bawaan.
- R14: `STUDIO_NAV` satu sumber untuk sidebar, palet, subnav — asap nav USER/ADMIN PASS.
- R16 (bagian layout): judul seragam lewat `studioPageTitle`; halaman milik baris lain belum memakainya (permintaan dicatat).
- Render halaman `/studio` dengan sesi TIDAK diverifikasi di peramban (tanpa sesi uji; brief membatasi asap ke curl) -> E2E SR-52.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| 4 galat eslint di sidebar/palet | 0 (di luar bagian Studio) | kode HQ lama (static-components, set-state-in-effect) | dilaporkan `file_requests.md` | tidak |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| use-cooldown | Model jeda: "jeda dulu, baru coba" (`arm` saat gagal, lalu `trigger`) agar 3/6/12 s benar-benar mendahului percobaan ke-1/2/3 | diterapkan; pola lama "coba dulu lalu jeda" di `artifacts/error.tsx` dibiarkan untuk FIX-4b |
| fileUrl | Mengembalikan `string \| null` (bukan melempar) bila tidak ada URL aman | pemanggil tidak merender tautan saat `null` |
| error-messages | Fungsi bernama `errorMessages(err, ctx)` + konstanta `ERROR_CATALOG`; kode bertipe `string` karena kode v2 (DOCUMENT_INCOMPLETE dkk.) belum ada di `STUDIO_ERROR_CODES` (SR-04) | selaraskan saat SR-04 |
| completeness-rail | Tipe lokal + `TODO(SR-04)`; `md` memakai `role="group"` (segmen interaktif tidak boleh di dalam `role="img"`), `list`/`sm` memakai `role="img"` | dicatat |
| use-viewer | Janji bersama tingkat modul (TTL 5 menit) dipakai provider dan komponen di luar Studio (sidebar/palet), sehingga `/api/auth/me` dimuat sekali | dicatat |
| layout | Tanpa `title.template` (halaman lain sudah menulis judul penuh -> akan ganda); diganti helper `studioPageTitle` | permintaan ke SR-28..31/FIX-4b |
| error-view | Tanpa `useSearchParams` (memaksa Suspense/CSR pada halaman statis); `next` hanya jalur | login belum membaca `next` -> permintaan |
| kontrak nav | Label `STUDIO_NAV.label` berubah ("Template" -> "Templat", "Artefak" -> "Galeri artefak", "Playground JSON" -> "Alat developer", "Status Mesin" -> "Sistem") dan urutan Dokumen sebelum Templat, sesuai §1.2/§2.1; konsumen hanya sidebar + palet (grep) | diterapkan |
| tidak dibuat | `implementation/NN_*.md` tidak ditulis; brief meminta catatan ini di `delegation_progress/` | - |

## Next Steps
- SR-28..31 + FIX-4b memigrasi modul ke `shared/*` (pembungkus fetch/kelas galat/timer/URL berkas lama masih ada di modul mereka).
- SR-04: ekspor tipe ringkasan kelengkapan; ganti tipe lokal rel.
- Uji unit `use-cooldown`, `buildRailSegments`, `fileUrl`, `errorMessages` di fase uji akhir (D-133); review recommended (senior-code-reviewer: `shared/**`, kit, sidebar, palet).
