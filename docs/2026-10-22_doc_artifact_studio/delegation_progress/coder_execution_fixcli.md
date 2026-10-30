---
task_id: 2026-10-22_doc_artifact_studio
task_slug: doc_artifact_studio
row: FIX-CLI (D-340, D-342; review DOC-3 M-1 opsi CLI, m-5 putusan kode)
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/delegation_progress/final_phase_brief.md (pengecualian baris: mengubah kode di area eksklusif); review/document_review_doc3.md (M-1, m-5)
status: complete
---

# FIX-CLI: opsi pembuatan dokumen di `md2chapter.ts` + pesan 503/404 berbahasa Indonesia

Skill: dry-run-verify-fix. Klaim: `file_claims.md` baris FIX-CLI. Semua tulis atomik (berkas `.tmp` lalu rename); `find scripts src tests -name "*.tmp"` = 0.

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca brief akhir, review DOC-3 (M-1, m-5), catatan FIX-HR1, FIX-H1, FIX-H6, D-340, D-342 | complete | |
| 2 | Rekam keluaran CLI lama (4 varian argumen) sebelum perubahan | complete | dipakai untuk bukti byte-sama |
| 3 | CLI: `--template <slug[@n]>`, `--doc-title <T>`, bantuan `--help` lengkap | complete | `--mission`/`--doc-key`/`--doc-number`/`--doc-id` sudah ada sejak FIX-H7 |
| 4 | Terjemahkan `PDF_NOT_READY_MESSAGE` dan `message`/`hint` ROUTE_NOT_FOUND | complete | hanya string; kode, kunci, route, contoh JSON tetap |
| 5 | Uji CLI (proses nyata) + uji pesan | complete | 15 + 27 uji |
| 6 | tsc, eslint, vitest studio, asap :9021 dengan fixture | complete | |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| `scripts/studio/md2chapter.ts` | modify | Opsi `--template <slug[@n]>` -> `submission.template` (`version` bilangan bulat >= 1; format salah -> exit 2) dan `--doc-title <T>` -> `submission.meta.title` (kosong -> exit 2). Keduanya butuh opsi target (tanpa target -> exit 2). Target yang dapat membuat dokumen (`--mission`/`--doc-number`) tanpa keduanya: satu catatan ke stderr (stdout dan kode keluar tetap). `--help` kini menjelaskan semua opsi, alur bab pertama -> `--doc-id`, dan contoh |
| `src/lib/studio/services/render/preflight.ts` | modify (teks) | `PDF_NOT_READY_MESSAGE` = "Mesin PDF di server belum siap, jadi permintaan render ditolak sebelum job dibuat; isi dokumen tidak berubah". `reason`/`causes` sudah Indonesia sejak FIX-H1 (tidak diubah) |
| `src/lib/studio/http/route-not-found.ts` | modify (teks) | `message`/`error` = "Route Studio tidak ditemukan untuk <METODE> <path>"; 22 `hint` aturan + hint umum berbahasa Indonesia; route, `details.suggestion`, dan contoh badan JSON di dalam hint persis seperti sebelumnya; komentar kepala berkas |
| `tests/unit/studio/import/fixcli-md2chapter.test.ts` | add | 15 uji CLI lewat proses `node tsx` nyata |
| `tests/unit/studio/api/fixcli-messages.test.ts` | add | 27 uji pesan (404 route + 22 hint aturan + hint umum; 503 layanan + badan HTTP) |

## Keputusan

| Butir | Keputusan | Alasan |
|---|---|---|
| Nama opsi judul dokumen | `--doc-title`, BUKAN `--title` seperti tertulis di D-340 | `--title` sudah berarti judul BAB sejak FIX-H7 (`md2chapter.ts:8` lama, `MarkdownImportOptions.title`). Mengubah maknanya memutus pemanggil lama dan melanggar syarat "tanpa opsi tetap perilaku lama". Diuji: `--title` tetap mengisi `chapter.title` |
| `--doc-key` | Sudah ada (FIX-H7), dipakai apa adanya | Kontrak `DocTargetV2` memakai `docKey` di samping `mission` |
| Validasi slug | CLI hanya memeriksa bentuk `slug[@n]`; pola slug ditegakkan validator skema v2 yang sudah dijalankan importer | Satu sumber kebenaran; slug salah -> exit 1 + pointer `/template/slug` (diuji) |
| Catatan stderr | Ditambahkan untuk `--mission`/`--doc-number` tanpa `--template`+`--doc-title` | Menutup M-1 di jalur CLI tanpa mengubah stdout/kode keluar. Teks menyebut kedua kode nyata: `META_REQUIRED_FOR_CREATE` (dengan `--doc-key`) atau `DOC_TARGET_AMBIGUOUS` (misi tanpa `--doc-key`), sesuai asap C1/C1b |
| Bahasa pesan galat CLI | Pesan galat pemakaian tetap Inggris (idiom berkas), bantuan `--help` Indonesia | Konsisten dengan baris FIX-H7; galat pemakaian tidak menjangkau pengguna akhir |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Unit CLI | `npx vitest run tests/unit/studio/import/fixcli-md2chapter.test.ts` | 15 passed | proses nyata, direktori temp dihapus `afterAll` |
| Unit pesan | `npx vitest run tests/unit/studio/api/fixcli-messages.test.ts` | 27 passed | |
| Suite studio | `npx vitest run tests/unit/studio` | 91 files: 90 passed, 1 failed; 2372 passed, 3 failed, 1 skipped | 3 gagal = `renderers/fix2-wrapper-text-parity.test.ts` (ekspektasi TOC), milik FIX-T2 yang sedang berjalan (`file_claims.md` baris FIX-T2 perluasan). Run sebelumnya juga memuat 3 gagal `fixh4-rail-toc.test.ts` yang kemudian lulus setelah FIX-T2 memperbarui ujinya. Tidak ada kegagalan di berkas milik baris ini |
| Typecheck | `npx tsc --noEmit -p .` | exit 0 | |
| Lint | `npx eslint` 5 berkas baris ini | exit 0 | |
| Byte-sama perilaku lama | CLI sebelum vs sesudah, 4 varian (tanpa target; `--mission`; `--doc-id --submission`; `--title --agent`) | stdout IDENTICAL x4 (`cmp`) | stderr hanya bertambah satu catatan pada varian `--mission` |
| Asap :9021 | `NODE_PATH=<repo>/node_modules node node_modules/tsx/dist/cli.mjs <scratchpad>/cli/fixcli_smoke.ts` | `RESULT pass=11 fail=0` | rahasia uji dari berkas, tidak dicetak (grep isi rahasia di log = 0) |

## Verification
- Asap C1: amplop CLI lama `--mission` -> `POST /api/studio/chapters` 400 `DOC_TARGET_AMBIGUOUS`; C1b: lama + `--doc-key` -> 400 `META_REQUIRED_FOR_CREATE` ("Dokumen belum ada; untuk membuatnya kirim juga template dan meta.title"). Ini cacat M-1 yang ditutup.
- Asap C2: `--mission ... --template datum-gsp --doc-title "Uji FIX-CLI Kajian Gardu" --submission` -> `POST /api/studio/validate` 200 `valid:true`, lalu `POST /api/studio/chapters` 201 `created:true`; baris DB `title` = judul dokumen, `missionFolder` = misi uji. C3: bab kedua `--doc-id <id>` -> 201.
- Asap C4 (503): `POST /documents/{id}/render { scope:"chapter", key:"1", formats:["pdf"] }` -> 503 `PDF_ENGINE_UNAVAILABLE`, `error` "Mesin PDF di server belum siap, jadi permintaan render ditolak sebelum job dibuat; isi dokumen tidak berubah", `details.stage` preflight, `Retry-After: 300`. (Lingkup `document` menjawab 409 `DOCUMENT_INCOMPLETE` lebih dulu sesuai urutan galat, jadi lingkup bab dipakai.)
- curl 404: `POST /api/studio/documents/abc123/slots` -> 404, `x-correlation-id`, `message` "Route Studio tidak ditemukan untuk POST /api/studio/documents/abc123/slots", `hint` "Slot dikirim ke POST /api/studio/slots dengan badan { "target": { "documentId": "abc123" }, ... }". `GET /api/studio/zzz` -> hint umum "Route Studio ini tidak ada. Sumber daya Studio yang tersedia: ...". Asap C5 `POST /documents/{id}/chapters` -> hint "Bab dikirim ke POST /api/studio/chapters ...".
- Fixture: 2 misi `2026-10-30_fixcli_*` (dua run asap) dibersihkan; Z0 `[dok, rev, identitas, job, berkas]` = `[0,0,0,0,0]` per run; hitung ulang dokumen `missionFolder startsWith 2026-10-30_fixcli` = 0. Tidak ada job/berkas dibuat (503 sebelum job). DB `gsp_agent_hq_v21` saja.

## Uji/dokumen lain yang memeriksa teks pesan (tidak diubah, di luar area)
| Lokasi | Isi | Dampak |
|---|---|---|
| `tests/unit/studio/api/fixh6-route-not-found.test.ts`, `fixhr2-route-not-found.test.ts` | hanya substring route/JSON dan path di `message` | tetap lulus, tidak perlu diubah |
| `tests/unit/studio/api/fixhz1-render-order.test.ts:270` | membuat `StudioApiError` sendiri dengan teks "PDF engine not ready" | tidak bergantung pada konstanta; tetap lulus |
| `docs/STUDIO-AGENT-GUIDE.md:1114` | contoh badan 503 §8.0 masih memuat `"error": "PDF engine not ready; ..."` | untuk DOC-4: ganti dengan teks baru; kalimat §12 "`error` = pesan Indonesia" kini benar untuk 503 preflight dan 404 (m-5) |
| `docs/STUDIO-AGENT-GUIDE.md` §1.1 | belum menyebut `--template`/`--doc-title` | untuk DOC-4 (M-1): sebut opsi CLI baru dan bahwa `--title` = judul bab |

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| 3 uji gagal di `renderers/fix2-wrapper-text-parity.test.ts` | 0 (bukan area baris ini) | ekspektasi TOC sedang diperbarui FIX-T2 (D-342 S2) | terbuka, milik FIX-T2 | tidak |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 3 | D-340 menulis `--title` untuk judul dokumen, tetapi `--title` sudah = judul bab | Dipakai `--doc-title`; controller perlu mencatat penyimpangan nama ini di `decisions.md` dan DOC-4 |
| 6 | Asap C1 tanpa `--doc-key` menghasilkan `DOC_TARGET_AMBIGUOUS`, bukan `META_REQUIRED_FOR_CREATE` | Catatan stderr dan `--help` menyebut kedua kode |

## Next Steps
- DOC-4: perbarui panduan §1.1 (opsi CLI) dan contoh 503 §8.0 (`STUDIO-AGENT-GUIDE.md:1114`).
- Review recommended: `scripts/studio/md2chapter.ts` (opsi baru) dan dua berkas pesan.
