---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: FIX-4b
date: 2026-10-23
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/masterplan/04_studio_ux_spec.md (§1.2, §4 W10/W12, §6, §7 FIX-4b, §7.1); decisions D-161, D-163, D-164, D-198, D-212
status: complete
---

# FIX-4b: migrasi modul UI lain ke fondasi `shared/*`

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca UX-01 §1.2/§4 W10+W12/§6/§7/§7.1, D-161/163/164/198/212, review 05 R05/R06/R10/R12/R13/R16/R17, `file_requests.md` (SR-30 baris 201-203, SR-31 D-198) | selesai | |
| 2 | Klaim jalur `file_claims.md` (prefiks FIX-4b) | selesai | termasuk satu baris tambahan `shared/http.ts` HANYA `issuesOf` (diminta brief; berkas FIX-4a) |
| 3 | curl backend nyata :9021 | selesai | lihat Test Results; bentuk sukses tidak bisa diambil tanpa sesi (agen dilarang membuat cookie) -> tipe tetap dari kode route |
| 4 | `shared/{dialog,completeness-rail,http}` aditif | selesai | `Sheet placement="wide"`; rel menerima `CompletenessSummary` kontrak (`chapters`), tipe lokal TODO(SR-04) dihapus; `issuesOf` baca `pointer`/`path` + `keyword`/`checkId` |
| 5 | `revision/**` | selesai | `shared/http`, `fileUrl` (Buka = inline), R12, R13, glosarium |
| 6 | `artifact-gallery/**` + `app/studio/artifacts/**` | selesai | `shared/http`/`useStudioQuery`/`useCooldown`/`ErrorView`/`Sheet wide`, label awam, tab Buat semua pengguna (T-6) |
| 7 | `render-status/**` + `app/studio/system/**` | selesai | W12: judul awam ADMIN + kartu USER |
| 8 | Gerbang D-133 | selesai | tsc 0, eslint area 0, uji logika 18/18, glosarium 0 di permukaan utama |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/components/studio/shared/http.ts | modify (aditif) | `StudioIssue` + `keyword?`, `checkId?`; `issuesOf` mengisi `path` dari `path` ATAU `pointer` (D-198) |
| src/components/studio/shared/dialog.tsx | modify (aditif) | `Sheet placement="wide"` (80rem x tinggi layar) untuk pratinjau PDF (permintaan SR-30) |
| src/components/studio/shared/completeness-rail.tsx | modify | `CompletenessSummary` = tipe kontrak `types/v2` (+ medan usang `content` sementara agar adaptor SR-30/SR-31 tetap kompil); segmen per slot berulang dari `chapters.<slotKey>`; label "Lampiran A" untuk slot `appendix`; `describeMissing` idem |
| src/components/studio/revision/api.ts | rewrite | hanya `requestJson` (sumber `studio.ui.revision.<x>`); kelas galat lokal dihapus (re-ekspor `StudioApiError` bersama); `reportClientError` tidak mencatat ulang galat API |
| src/components/studio/revision/labels.ts | rewrite | teks "nomor/versi/buat berkas"; `friendlyError` jatuh ke katalog bersama; `issuesOf` = bersama; `RELEASE_LABEL`/`JOB_LABEL`/`fmtDate`/`fmtBytes` diturunkan dari `shared/labels`; `addressKindLabel` dihapus (R13) |
| src/components/studio/revision/inline-editor.tsx | modify | `inlineToPlain` dihapus (R13); `runsToPlain` tidak lagi diekspor (tanpa pemakai luar) |
| src/components/studio/revision/diff-view.tsx | rewrite | bebas istilah terlarang (dipakai Riwayat SR-30), `versionLabel`/`sectionTypeLabel`, fokus terlihat |
| src/components/studio/revision/job-status.tsx | rewrite | `fileUrl` inline/unduh (R06, SEC-3), Buka hanya untuk format pratinjau, sidik/id/kode galat di Info teknis |
| src/components/studio/revision/retry.tsx | rewrite | adaptor tipis `useCooldown` bersama (R10) |
| src/components/studio/revision/route-error.tsx | rewrite | pembungkus `StudioSegmentError` |
| src/components/studio/revision/rerender-panel.tsx | rewrite | "Buat berkas versi n lagi", `aria-disabled` |
| src/components/studio/revision/{edit-workspace,revision-viewer,revisions-workspace,block-editor,change-dialog}.tsx | modify | teks glosarium; R12 fokus pil `has-[:focus-visible]` (edit-workspace); `i.path`; JSON blok -> Info teknis |
| src/components/studio/revision/index.ts | rewrite | ekspor mati `EditWorkspace`/`RevisionsWorkspace`/`RevisionViewer` dihapus (R13); kini `DiffView`, `TextDiff`, `contentPlain`, `diffWords` |
| src/components/studio/artifact-gallery/api.ts | rewrite | `requestJson`, `fileUrl` bersama; `ArtifactPostError` + pembangun URL lokal dihapus; `postIssuesOf`, `alternativesOf`, `getJson`, `src()` |
| src/components/studio/artifact-gallery/{artifact-studio,gallery,catalog,create-panel,preview,labels,validate}.tsx/ts | modify/rewrite | `useStudioQuery`/`ErrorView`/`useCooldown`/`Sheet wide`/`InfoTeknis`; label "Grafik", "Halaman web", "Templat"; Buka (pratinjau tab baru) + Unduh; skema/id/kode di Info teknis; h1 "Galeri artefak" |
| src/app/studio/artifacts/{page,error}.tsx | rewrite | `studioPageTitle("Galeri artefak")`; boundary = `StudioSegmentError` |
| src/components/studio/render-status/{index,use-render-env,readiness,jobs,hints}.tsx/ts | modify/rewrite | `requestJson` + `useCooldown` + `ErrorView`; boundary lokal dipensiunkan (akar `app/studio/error.tsx`); W12 ADMIN/USER; jalur/variabel/sidik di Info teknis |
| src/app/studio/system/page.tsx | rewrite | `studioPageTitle("Sistem")` |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck seluruh repo | `npx tsc --noEmit -p .` | exit 0 | tidak ada galat di luar area |
| Lint area | `npx eslint <area> shared/{dialog,completeness-rail,http}` | exit 0, 0 temuan | |
| Logika murni | `npx tsx --tsconfig tsconfig.json <scratchpad>/fix4b_logic.ts` | `RESULT pass=18 fail=0` | rel kontrak + lama, `issuesOf` pointer/path, alternatif/isu POST, label revisi |
| Glosarium §1.2 (+ "revisi", "sha256") | `python -I <scratchpad>/glossary.py <area>` | `files=35 texts_checked=700 HITS=4` | 4 hit semuanya di `FixHint.technical` (`hints.ts:49,98,113`: "render-env/README.md") yang hanya dirender di `InfoTeknis` (ADMIN) = pengecualian sah §1.2; permukaan utama 0 hit |
| curl asap | `curl http://127.0.0.1:9021/studio/artifacts`, `/studio/artifacts?tab=buat`, `/studio/system` | 307 -> `/login?next=%2Fstudio%2F...` | wajar tanpa sesi |
| curl API | `/api/studio/render-env`, `/api/studio/artifacts`, `/api/studio/registry?kind=charts`, `/api/studio/templates` | 401 `{"error":"Unauthorized"}`; `/api/auth/me` 401 `{"user":null}` | dipetakan `UNAUTHORIZED` oleh `http.ts` |
| Grep aturan §6.2 | `grep -rn "fetch(\|class \w+Error extends" <area>` | 0 | |

## Verification
- R05/R17: area tidak lagi mengimpor `document-viewer/api` atau membuat fetch/kelas galat (grep 0).
- R06: `job-status.tsx` dan `preview.tsx` memakai `fileUrl(file,"inline"|"download")`.
- R10: `revision/retry.tsx`, `create-panel.tsx`, `use-render-env.ts`, `artifacts/error.tsx` memakai `useCooldown` bersama.
- R12: pil tindakan `edit-workspace.tsx` memakai `has-[:focus-visible]:outline...`.
- R13: `inlineToPlain`, `addressKindLabel`, ekspor workspace mati dihapus.
- T-6: tab Buat tanpa penyaringan peran (`artifact-studio.tsx`, komentar D-164).
- Belum diuji di peramban bersesi (agen tidak membuat cookie) -> SR-52.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Halaman tidak dapat dirender bersesi untuk asap visual | 0 | larangan membuat cookie sesi | dicatat untuk SR-52 | tidak |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 4 | `issuesOf` ada di `shared/http.ts` (berkas FIX-4a), bukan di rel | diubah aditif sesuai brief; diklaim eksplisit |
| 4 | Adaptor `doc-model.toRailSummary` (SR-30) dan `playground/rail-summary.ts` (SR-31) | DIBIARKAN (bukan hanya impor); rel menerima `content` usang sementara. Review: hapus kedua adaptor dan teruskan laporan kontrak langsung, lalu hapus `LegacyContentSummary` |
| 4 | Rel kini memecah slot lampiran per kunci bila diberi `chapters` kontrak | perilaku via adaptor SR-30 (satu segmen lampiran) tidak berubah |
| 5 | `edit-workspace`, `revision-viewer`, `revisions-workspace`, `block-editor`, `change-dialog`, `inline-editor`, `rerender-panel` tanpa pemakai sejak T-11 | berkas TIDAK dihapus (garis merah); dimigrasi + glosarium. Review: putuskan penghapusan |
| 5 | `documents/[id]/{edit,revisions}/error.tsx` (area SR-30) masih memakai `RevisionRouteError` | dipertahankan sebagai pembungkus `StudioSegmentError` |
| 6 | `document-viewer/api.ts` dan `document-viewer/feedback.tsx` (`LoadError`) kini tanpa pemakai di luar folder SR-30 | catatan untuk review/SR-56 |
| 6 | Isian spesifikasi tab Buat tetap teks terstruktur (kini untuk semua pengguna) | label tanpa kata terlarang; kode skema ditampilkan kecil; kode/korelasi di Info teknis |
| 7 | USER: R11 dipanggil tanpa `jobs=1` (data minimum); "sejak" W12 memakai waktu pemeriksaan terakhir (`checkedAt`), bukan waktu awal masalah (tidak tersedia di R11) | teks: "Masalah terlihat pada pemeriksaan pukul HH:MM" |
| 7 | Boundary kelas lokal `render-status` dipensiunkan | ditangani `app/studio/error.tsx` (FIX-4a) |

## Next Steps
- SR-30 boleh beralih ke `Sheet placement="wide"` dan meneruskan `CompletenessReportV2` langsung ke `CompletenessRail`.
- Review: keputusan hapus berkas revisi tanpa pemakai + `document-viewer/api.ts`; uji peramban bersesi di SR-52.
