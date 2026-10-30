---
task_id: 2026-10-22_doc_artifact_studio
task_slug: doc_artifact_studio
row: FIX-H2
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/decisions/decisions.md (D-321, D-322)
status: complete
---

# Catatan FIX-H2: kiriman tidak menimpa suntingan PATCH diam-diam (Hermes C2)

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca brief fase akhir, laporan Hermes C2, D-128/D-131/D-202/D-261/D-275/D-321/D-322 | selesai | |
| 2 | Klaim berkas (`file_claims.md`, baris FIX-H2) | selesai | ditulis atomik (tmp + rename) |
| 3 | Modul `submit/overwrite.ts` + kait di `pipeline.ts` | selesai | `merge.ts` TIDAK diubah (tidak perlu) |
| 4 | Uji unit murni + uji rute DB v21 (fixture 0 sisa) | selesai | |
| 5 | Asap HTTP :9021 skenario Hermes | selesai | 14/14 |
| 6 | Gerbang vitest / tsc / eslint | selesai | |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| `src/lib/studio/services/submit/overwrite.ts` | add | Aturan + pemeriksaan: pembantu murni (`parseScopes`, `isSubmissionRevision`, `referenceRevision`, `lastPidEdits`, `chapterPidStates`, `changedChapterPids`, `addressOfPid`, `overwriteForwardText`) dan `findPatchedOverwrites` / `assertNoPatchedOverwrite` (DB, di dalam kunci) |
| `src/lib/studio/services/submit/pipeline.ts` | modify | Panggil `assertNoPatchedOverwrite` sesudah cek idempoten, sebelum cek dasar §9.2 (kiriman nyata dan dry-run R08); kepala modul diperbarui |
| `src/lib/studio/services/submit/index.ts` | modify | Ekspor `assertNoPatchedOverwrite`, `findPatchedOverwrites`, `OVERWRITE_REASON`, `OverwrittenPid` |
| `tests/unit/studio/structure/fixh2-overwrite-pure.test.ts` | add | 7 uji murni (prisma tiruan melempar) |
| `tests/unit/studio/api-structure/fixh2-overwrite.test.ts` | add | 6 uji rute R12 + R16 + R20 di DB v21 (harness SR-45, 0 sisa) |

## Aturan yang diterapkan
- Revisi sunting = `changeScope` memuat `pid:<pid>` (R16 dan R06 alamat menulis `pid:`; revisi kiriman tidak pernah menulis `pid:`), plus `structure:renumberChapters` untuk kunci bab.
- Acuan lingkup = `baseRevisionNo` bila dikirim; selain itu revisi kiriman TERAKHIR yang memuat lingkup sama (`chapter:<k>` / `slot:<s>`; revisi tanpa `changeScope` = ingest utuh, berlaku semua lingkup); 0 bila tidak ada. `baseRevisionNo` = n -> lolos; tidak sah -> dibiarkan ke `REVISION_NOT_FOUND` lama.
- Konflik bila kiriman mengubah keadaan pid (isi, posisi section/indeks, atau keberadaan) yang terakhir disunting di revisi > acuan. Slot tak-berulang diganti utuh: setiap pid slot yang disunting sesudah acuan dihitung. pid yang dihapus sunting sesudah acuan di bab/slot yang diubah kiriman dihitung (pemilik dibaca dari baris revisi induk). Kiriman ke kunci bab yang sudah diganti `renumberChapters` sesudah acuan = konflik pada pid bab itu.
- 409 `SCOPE_CONFLICT`, `details`: `scope`, `reason: PATCHED_PIDS_OVERWRITTEN`, `baseRevisionNo`, `referenceRevisionNo`, `latestRevisionNo`, `changedInRevisionNo`, `changedBy`, `overwrittenPids` [{pid, address, editedInRevision, editedBy}], `conflictingScopes` (bila > 1), `readContent`, `forwardToController` (awam: "baca isi terkini lewat GET /api/studio/documents/{id}/content, gabungkan, kirim ulang dengan baseRevisionNo {n}").
- Kiriman identik tetap 200 `unchanged` (cek berjalan sesudah jalur idempoten). Bab/slot lain tidak tersentuh (lingkup lain).

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Unit murni | `npx vitest run tests/unit/studio/structure/fixh2-overwrite-pure.test.ts` | 7/7 lulus | |
| Rute DB v21 | `npx vitest run tests/unit/studio/api-structure/fixh2-overwrite.test.ts` | 6/6 lulus | residue `{docs:0,assets:0,templates:0,jobs:0}`, sidik 000/001/002 sama |
| Suite wajib | `npx vitest run tests/unit/studio/api-structure tests/unit/studio/api/ tests/unit/studio/structure` | `Test Files 33 passed (33)`, `Tests 1131 passed (1131)` | termasuk uji baru FIX-H2 dan uji baris lain yang ada di folder itu saat dijalankan |
| tsc repo | `npx tsc --noEmit -p .` | 1 galat, BUKAN milik FIX-H2: `tests/unit/studio/import/md-v1.test.ts(5,39) TS2307 '@/lib/studio/services/import'` (area FIX-H7, sedang dikerjakan); tanpa berkas itu 0 | src 0 |
| eslint area | `npx eslint src/lib/studio/services/submit src/lib/studio/services/compose/merge.ts tests/.../fixh2-*.test.ts` | exit 0, 0 temuan | |
| Asap HTTP :9021 | `FIXH2_SECRET=$(cat .../trial_internal_secret) npx tsx --tsconfig tsconfig.json <scratchpad>/fixh2/fixh2_smoke.ts` | `RESULT pass=14 fail=0` | rahasia lewat env, tidak dicetak; DB diverifikasi `gsp_agent_hq_v21`; fixture dihapus (kaskade), 0 dokumen/0 job sisa, jumlah dokumen kembali |

## Verification (asap :9021, skenario Hermes)
- kirim bab 3 (201) -> kirim bab 4 (201 rev 2) -> PATCH pid 4.1.2 94->93 menit (200 rev 3) -> kirim ulang bab 4 lama: 409 `SCOPE_CONFLICT`, `overwrittenPids` = [{pid 4.1.2, editedInRevision 3, editedBy agen 2}], `forwardToController` memuat `/content` + `baseRevisionNo 3`, `x-correlation-id` ada, revisi tetap 3 (0 tulis).
- bab 3 dan bab 5 paralel tanpa base -> 201, 201.
- bab 4 lama + `baseRevisionNo` terbaru (5) -> 201 rev 6; kiriman identik -> 200 `unchanged`.
- PATCH kedua lalu R08 validate payload lama -> `valid=false`, issue `SCOPE_CONFLICT` menyebut pid (dry-run memakai aturan yang sama).
- Uji rute tambahan: base usang (2 < 3) -> 409 pid sama; isi terkini dari GET /content digabung lalu diubah paragraf lain tanpa base -> 201 (granular per pid); paragraf dihapus lewat PATCH lalu payload lama -> 409 menyebut pid terhapus beralamat 1.1.2.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| tsc repo 1 galat di `tests/unit/studio/import/md-v1.test.ts` | 0 (bukan area) | modul `services/import` FIX-H7 belum ada saat dijalankan | diserahkan ke FIX-H7 | tidak untuk FIX-H2 |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 3 | `merge.ts` tidak perlu diubah: pid-state dibandingkan dari `current` vs `merged.doc` di modul baru | area diklaim, tidak disentuh |
| 3 | Penggolongan revisi sunting memakai `changeScope` (`pid:`), bukan `schemaId` (revisi sunting mewarisi `schemaId` revisi dasar, KD-10) | diterapkan |
| 3 | Cek berjalan SEBELUM cek dasar §9.2 agar kiriman ber-`baseRevisionNo` usang mendapat daftar pid; bila pid tersunting tidak diubah, cek dasar lama tetap berlaku (409 lingkup tanpa `overwrittenPids` / `rebased`) | diterapkan |
| 3 | Targeted doc yang mengirim bab identik tidak mencatat `chapter:<k>` di changeScope, jadi acuan bab itu tetap kiriman sebelumnya (lebih konservatif: dapat 409 yang diselesaikan dengan `baseRevisionNo`) | dicatat, diterima sebagai perilaku aman |
| 3 | Sisa di luar cakupan paragraf: sunting `structure:setOutline`/`reorder` lalu kiriman dokumen tanpa base yang membawa `outline`/`structure` usang masih menimpa (cek dasar lama hanya bila base dikirim) | usul baris lanjutan bila diinginkan |
| 5 | R08 `/api/studio/validate` memetakan galat ke `issues` (200 `valid=false`) dan membuang `details` (tanpa `overwrittenPids`) | konvensi rute R08 (bukan area FIX-H2); usul ke pemilik route validate / DOC-3 |
| 6 | Uji milik baris lain: tidak ada yang diubah; tidak ada uji lama yang gagal | - |

## Next Steps
- DOC-3: dokumentasikan 409 `SCOPE_CONFLICT` `reason: PATCHED_PIDS_OVERWRITTEN` + `overwrittenPids` di panduan agen (§5.3) dan API reference.
- Review recommended: `src/lib/studio/services/submit/overwrite.ts` + kait di `pipeline.ts`.
