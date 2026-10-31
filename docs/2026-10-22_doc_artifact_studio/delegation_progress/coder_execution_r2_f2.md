---
task_id: R2-F2
task_slug: doc_artifact_studio
row: R2-F2 (D-425, D-426, D-427; review 14 #5 #6 #7 #8 #9)
date: 2026-10-31
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/decisions/decisions.md (D-425, D-426)
status: complete
---

# Implementation Report: R2-F2 perbaikan CLI studio-report / draft-check + tagihan R23

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| #5 | Kiriman terputus melaporkan kemajuan | complete | `progress` di stderr + `fatal.progress`; kode keluar penyebab (1/2) tetap |
| #6 | Klien HTTP bersama `_http-client.ts` | complete | timeout 60 s, peta 3xx/401/429/5xx, code + cid seragam; redirect per CLI dipertahankan |
| #7 | Tagihan R23 per dry-run yang dijalankan | complete | hook `beforeSimulatedDryRun`; 429 sebelum dry-run ulang bila kuota habis |
| #8 | Netralisasi formula CSV `--timing` | complete | awalan `'` untuk `= + - @ \t \r` (kecuali `-` dan bilangan negatif) |
| #9 | `--out` hanya nama `FINAL_FILENAME_PATTERN` | complete | selain itu `OUT_NAME_UNSAFE` rc 2, tanpa tulis |
| D-427 | Penjaga target contoh registri | complete | misi ATAU docKey contoh (dibaca dari `CONTRACT_KIND_DEFS`) -> `EXAMPLE_TARGET` rc 2 sebelum kiriman pertama; `--allow-example` membuka |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| scripts/studio/_http-client.ts | add | `studioRequest`, `httpFailureOf`, `normalizeBaseUrl`, `STUDIO_HTTP_TIMEOUT_MS`, `RedirectPolicy` |
| scripts/studio/studio-report.ts | modify | StudioClient lewat klien bersama (`redirect: "manual"`); `ReportProgress` + `progressOf`/`interrupted`; `csvNeutralize`; `safeFinalName` = C51; `registryExampleTargets` + `guardExampleTargets` + opsi `--allow-example` (D-427); bantuan/kepala |
| scripts/studio/draft-check.ts | modify | `call`/`serverFailure` lewat klien bersama (`redirect: "follow"`); `DraftCheckUsageError.details` -> `fatal.details` |
| src/lib/studio/services/draft/check.ts | modify | `DraftCheckDeps.beforeSimulatedDryRun?` dipanggil sebelum dry-run ulang |
| src/app/api/studio/drafts/check/route.ts | modify | tagih `checkValidateRate` per dry-run ulang; `SimulatedDryRunLimited` -> 429; log `simulatedDryRun`/`charges` |
| tests/unit/studio/draft/r2fix-cli.test.ts | add | 17 uji #5 #6 #8 #9 + D-427 |
| tests/unit/studio/api/r2fix-drafts-charge.test.ts | add | 5 uji #7 + AC-19 hook |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | rc 0 | tanpa keluaran |
| Lint | `npx eslint` 7 berkas tersentuh | rc 0 | |
| Unit baru | `npx vitest run tests/unit/studio/draft/r2fix-cli.test.ts` / `api/r2fix-drafts-charge.test.ts` | 17/17, 5/5 | |
| Unit penuh | `npx vitest run tests/unit/studio` | 158 berkas, 3445 lulus, 1 dilewati | sesudah D-427 |

## Verification
- #5 DEV :9021 (misi `2026-10-31_r2_f2`, agentId `cod-r2-f2`): bab 3 dengan meta berbeda -> rc 1 `META_CONFLICT` 409 cid 60e54da9-fe17-4423-b10e-b32c94f04ca8; `fatal.progress` = dok `cmvw2ysbk01tdv1zg4o669ylt` (020/GSP/LAP/X/2026) rev3, tersimpan blok 1-3, gagal `blok 4 (bab 3)`. Kirim ulang setelah diperbaiki: blok 1-3 `unchanged` rev3, blok 4-6 rev4-6, rc 0.
- Asap submit: dok `cmvw2xylw01n3v1zgrmk3k3j8` (018/GSP/LAP/X/2026) rev6 COMPLETE, verify true, `--out` 1 berkas (nama nyata lolos C51), cid blok 1 aec5172d-b96d-4f86-990d-873a006c57f8; submit ulang 6x `unchanged`; update (status partial) hanya record rev7 cid 6ffcd087-7b61-48fd-834d-6d751a3d9d95.
- #7 DEV: R23 dua kali draf 6 blok bersimulasi: sisa kuota validate 109 -> 98 (turun 11 = 6 + 5 dry-run ulang; sebelumnya 6), cid 1c081c7f-b158-442f-9a0d-7e02d5a6327b.
- AC-19: `draft-check --remote --agent-id --json --with-payload` vs R23, pid/cap waktu disamarkan: identik, 6 blok valid.
- D-427 DEV: draf dari contoh R03 apa adanya -> rc 2 `EXAMPLE_TARGET` (misi `2026-10-31_misi_contoh` dan docKey `laporan-kerja-penulis`), tanpa kiriman; draf bertarget sendiri tetap jalan (018 blok `unchanged`, cid 329b9517-dcf9-4b8c-a1ef-60553d228321).
- #8/#9: uji `r2fix-cli` (sel `=cmd|calc` -> `'=cmd|calc`, run_id `=run` tetap berurutan seq 1-4; `CON.html` ditolak tanpa mkdir/write).

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| - | - | - | - | tidak |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| #5 | Kode keluar khusus (4) vs kode penyebab | Dipilih kode penyebab (1/2) + `progress`: uji r2cli lama (bukan milik baris ini) mengharapkan 1, kelas penyebab tetap terbaca, dan `--json fatal.progress` sudah cukup untuk deteksi. Medan baru `fatal.progress` (bukan `details`, agar `details` server tetap utuh). |
| #6 | Kebijakan redirect | Tidak diseragamkan: studio-report `manual`, draft-check `follow` karena D-402 M-2 menerima "mengikuti redirect ... tidak ada perubahan kode". Mengganti draft-check ke `manual` = satu baris, perlu keputusan USER baru. |
| #6 | Perubahan terlihat | studio-report 401 kini `REMOTE_UNAUTHORIZED` (dulu `HTTP_401`/code server); draft-check timeout 30 -> 60 s dan `fatal.details { httpStatus, serverCode?, correlationId? }` untuk galat server. |
| #6 | Coupling | studio-report masih mengimpor `checkDraftLocal` dari draft-check (cek lokal, bukan HTTP); di luar lingkup. |
| #7 | Kuota habis di tengah | 429 `RATE_LIMITED` sebelum dry-run ulang; dry-run sebelumnya hanya baca. |
| DEV | Fixture dibiarkan (pola D-408) | misi `2026-10-31_r2_f2`: 018 (docKey cod-r2-f2-a rev7), `cmvw2ybd001qpv1zglv30pa81` (cod-r2-f2-b, INCOMPLETE), 020 (cod-r2-f2-c rev6). Folder probe `%TEMP%\r2f2` dihapus. |

## Next Steps
- Panduan §17.0/§17.9 + API-REF (pemilik dokumen): opsi baru `--allow-example` dan kode `EXAMPLE_TARGET` (keluar 2; templat §17.0 yang disalin apa adanya kini ditolak sampai misi/docKey diganti); `fatal.progress` dan baris stderr kemajuan; 401 = `REMOTE_UNAUTHORIZED`; `--out` hanya nama C51 (`OUT_NAME_UNSAFE`); sel timing berawalan formula diberi `'`; draft-check timeout 60 s + `fatal.details`; kuota R23 "satu per dry-run (bab/slot sesudah blok pembuat dokumen yang belum ada dihitung dua), minimal satu" (panduan :1585, :2513).
- Review recommended: diff 5 berkas produksi di atas (senior-code-reviewer + security-review).
