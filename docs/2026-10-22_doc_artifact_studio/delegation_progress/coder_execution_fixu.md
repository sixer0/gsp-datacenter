---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: FIX-U
date: 2026-10-23
agent: coder-execution
source_plan: gateway_check/09_review_structural_engine_ui.md (M4, M5, L4, L5, L7); D-245, D-247; masterplan/04_studio_ux_spec.md §1.2, W3
status: needs-review
---

# FIX-U: rel kelengkapan murni, glosarium di repo, Low UI, kode mati IP-56

Status `needs-review` karena dua butir tertahan di luar kendali baris ini: (1) M5 butuh perubahan server di luar area; (2) penghapusan kode mati IP-56 (D-247) ditolak oleh pengklasifikasi izin Claude Code. Daftar berkas dan cadangannya sudah siap. Butir lain selesai dan sudah diverifikasi.

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca brief, review 09 (M4/M5/L1/L4/L5/L7), review 08 (IP-56), fix4b, D-139/164/226/245/247, UX §1.2/W3 | selesai | |
| 2 | Klaim `file_claims.md` (prefiks FIX-U) | selesai | |
| 3 | M4/IP-57: rel memakai `CompletenessSummary` kontrak murni | selesai | |
| 4 | L5: satu pemeta label kekurangan | selesai | |
| 5 | L4: ukuran kertas gambar mini dari kontrak | selesai | |
| 6 | L7/IP-58: `scripts/studio/glossary-check.ts` | selesai | |
| 7 | M5: pratinjau templat lewat jalur v2 | **tertahan (server)** | lihat Issues |
| 8 | D-247: hapus kode mati IP-56 | **tertahan (izin)** | grep 0 pemakai terbukti; `rm` ditolak pengklasifikasi |
| 9 | Gerbang: tsc, eslint, glosarium, uji logika, vitest, curl | selesai | |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/components/studio/shared/completeness-rail.tsx | modify | `CompletenessSummary` = tipe kontrak murni. `LegacyContentSummary` dan cabang `content` dihapus. `describeMissing` mendelegasikan ke `labels.missingLabels`. Label segmen memakai `repeatItemLabel` |
| src/components/studio/shared/labels.ts | modify (aditif) | `repeatItemLabel`, `missingLabel`, `missingLabels` (pemeta tunggal, L5). Mengenali slot berulang dari `sectionType` chapter/appendix, `repeatable`, atau `chapters[slotKey]` |
| src/components/studio/document-viewer/doc-model.ts | modify | `toRailSummary` dan `REPEATABLE_TYPES` dihapus. `missingLabel`/`missingLabels` diekspor ulang dari `shared/labels`, jadi pemakai lain (history-tab, render-card, document-list) tidak berubah |
| src/components/studio/document-viewer/document-list.tsx, meta-panel.tsx | modify | `summary={report}` langsung |
| src/components/studio/playground/panels.tsx | modify | rel dan `describeMissing` menerima `report` langsung; impor `rail-summary` dihapus |
| src/components/studio/playground/rail-summary.ts | modify (dikosongkan) | Tinggal fungsi identitas `@deprecated`, tanpa pemakai. Berkas TIDAK dihapus (bukan bagian daftar IP-56) |
| src/components/studio/template-editor/style-picker.tsx | modify | `PAPER_MM` = alias `PAPER_SIZE_MM` kontrak (L4). `portraitOf` memakai `page.sizeMm` efektif, lalu `page.customSizeMm`, lalu kertas bernama (ditukar bila mendatar). `PagePortrait.sizeMm` baru; label "Ukuran khusus" |
| scripts/studio/glossary-check.ts | add | Pemindai berbasis AST TypeScript. Membaca teks JSX multi-baris, literal string/template, dan atribut. Daftar kata = `FORBIDDEN_SURFACE_WORDS` (`shared/labels.ts`) + sha256/sha-256. Pengecualian dihitung terpisah: isi `<InfoTeknis>`, properti `technical`, `new StudioApiError(...)` bersama (pesan hanya di "Pesan server" InfoTeknis, `error-view.tsx:89`), dan berkas khusus ADMIN (`ADMIN_ONLY`: playground, `param-*`, `role-formats-editor`, `render-status/jobs`, masing-masing dengan bukti). Kode keluar 1 bila ada hit permukaan utama |
| docs/.../delegation_progress/file_claims.md | append | 2 baris klaim FIX-U |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck repo | `npx tsc --noEmit -p .` | exit 2: 21 galat, semuanya di `tests/integration/studio/studio-db.integration.test.ts` (TS18048 `'done' is possibly 'undefined'`) | Berkas milik SR-49 (klaim baris 906), sedang disunting paralel (mtime 08:19:49). **0 galat di `src/**` dan `scripts/**`**. Lintasan sebelumnya juga menunjukkan 8 galat `auth.test.ts` yang kemudian hilang sendiri, tanda baris lain sedang bekerja |
| Lint area | `npx eslint src/components/studio src/app/studio scripts/studio` | exit 0 | |
| Glosarium | `npx tsx scripts/studio/glossary-check.ts --show-excluded` | `files=142 texts_checked=2413 HITS_MAIN=1 excluded_infoteknis=5 excluded_admin=43` | Satu-satunya hit utama: `document-viewer/api.ts:67` "Respons server bukan JSON yang valid." di berkas mati IP-56 (0 importir; kelas `StudioApiError` lokal). **Layar yang dapat dijangkau: 0 hit**. Setelah berkas itu dihapus: 0. Pengecualian InfoTeknis = `hints.ts:49,98,113` (`technical`) + `shared/http.ts:254` |
| Uji logika | `npx tsx --tsconfig tsconfig.json <scratchpad>/fixu/fixu_logic.ts` | `RESULT pass=20 fail=0` | Rel dari laporan kontrak (lampiran kini dipecah per kunci A/B), aria, ringkasan minimal, `@ts-expect-error` pada `content` usang, label L5, ukuran kertas L4, pemindai: teks JSX multi-baris tertangkap dan isi InfoTeknis dikecualikan |
| Vitest | `npx vitest run tests/unit/studio` | `Test Files 9 failed / 40 passed; Tests 31 failed / 1736 passed` | Tidak ada uji yang mengimpor `components/studio` (grep 0). Kegagalan ada di api-structure/pid, submit, api/artifacts, ingest, revisions, figures/diagram-bad-cases, fix1, renderers/asset-bytes, docx-determinism, yaitu area baris paralel (FIX-S/FIX-FIG/SR-41). Baseline D-239: 123/1008 |
| curl | `/studio`, `/studio/templates`, `/studio/documents`, `/studio/playground`, `/studio/documents/x/edit`, `/studio/documents/x/revisions/2` | semua 307 -> `/login?next=...` | Log server dev tidak dapat dibaca agen: tidak ada berkas log, dan tab terminal tidak menjalankan server. Server tidak di-restart. Halaman Studio tidak dikompilasi tanpa sesi (middleware), jadi bukti build = tsc + eslint |

## Verification
- M4: `grep -rn "toRailSummary\|LegacyContent" src` hanya menyisakan definisi identitas di `playground/rail-summary.ts` dan komentar. Tiga pemakai rel meneruskan `CompletenessReportV2` langsung. Uji logika "rail keys" membuktikan Lampiran A/B kini tampil (dulu hilang lewat adaptor).
- L5: `doc-model.missingLabels === describeMissing` (uji "doc-model re-export same").
- L4: Letter 215,9 x 279,4; Legal mendatar 355,6 x 215,9; ukuran khusus; `page.sizeMm` menang.
- L7: skrip ada di repo dan terbukti memindai teks multi-baris (uji "multiline main hit": hit "slot" di teks JSX dua baris).

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Hapus 18 berkas IP-56 (D-247) | 1 | Pengklasifikasi izin Claude Code menolak `rm` ("Irreversible Local Destruction"); berkas Studio untracked di git | Tidak satu pun terhapus (Glob: 15 berkas `revision/` masih ada). Cadangan + daftar siap. Perlu user/controller menjalankan penghapusan atau memberi izin | ya, untuk D-247 |
| M5 pratinjau v2 | 0 (sengaja tidak dikodekan) | Server belum menyediakan jalur: R08 v2 tidak menerima draf templat dan tidak menghasilkan HTML untuk snapshot norm/v2 | needs-review | ya, untuk M5 |
| tsc repo 21 galat | 0 | Di berkas SR-49 yang sedang disunting paralel | di luar area | tidak untuk FIX-U |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 7 | **M5 tidak dapat diselesaikan di area UI.** Bukti: `validate/route.ts:238-261`, cabang v2 memanggil `ingestDocument(req, caller, { dryRun: true })` tanpa `template`/`skeleton`, dan `previewHtml` hanya diisi bila ingest mengembalikannya. `grep previewHtml services/ingest` = 0, jadi setiap pratinjau v2 menjadi `previewError PREVIEW_UNAVAILABLE`. `studio.doc/v2` tidak punya `overrides` (D-139), jadi esensial/kerangka draf tidak dapat dibawa dokumen. Mengalihkan pane ke v2 sekarang akan merusak pratinjau untuk semua pengguna (regresi), jadi jalur v1 dipertahankan. Kontrak `TemplatePreviewPaneProps.draftOverrides` ada di `contract/ui.ts` (luar area) | Butuh baris server (pemilik validate/IP-51, area FIX-S/SR-20): R08 menerima `studio.doc/v2` + medan draf (mis. `draftTemplate: { essentials, skeleton, advanced?, roleFormats? }`) dan meneruskannya sebagai `template`/`skeleton` ke `ingestDocument` dryRun (opsi sudah ada, `ingest/v2.ts:91-93`). Lalu `previewHtml` dirakit dari snapshot norm/v2 dengan `assembleHtml` sadar slot (dipakai `services/render/pure/render.ts:424`). Setelah kontrak itu ada dan di-curl, FIX-U lanjutan: sampel `studio.doc/v2`, pane mengirim draf, prop `draftOverrides` dihapus dari `contract/ui.ts` |
| 8 | Daftar IP-56 gabungan review 08 + 09 = 18 berkas, 2.607 baris (`wc -l`): `revision/{edit-workspace,revision-viewer,revisions-workspace,block-editor,change-dialog,inline-editor,rerender-panel,job-status,retry,route-error}.tsx`, `revision/index.ts`, `document-viewer/{api.ts,feedback.tsx,labels.ts,index.ts}`, `shared/index.ts`, `app/studio/documents/[id]/edit/error.tsx`, `app/studio/documents/[id]/revisions/error.tsx` | Bukti 0 pemakai: grep impor relatif/alias/barel atas `src tests scripts benchmark` (*.ts, *.tsx, *.mjs, *.mts, *.cjs, *.json). Importir yang ditemukan hanya saling-impor di dalam himpunan ini. `route-error` hanya diimpor kedua `error.tsx`. Barel `revision/index.ts`, `document-viewer/index.ts`, `shared/index.ts`: 0 importir (yang cocok `./shared` adalah `template-editor/shared.tsx` dan `chart/family-h2/shared`). Rujukan non-impor tinggal komentar di `shared/labels.ts:4,139`. Rute: kedua `error.tsx` dimuat Next per konvensi, tetapi segmennya (termasuk anak `revisions/[rev]`) hanya `redirect()`, dan boundary induk `documents/[id]/error.tsx` tetap menangkap galat. Sisa `revision/{api,labels,diff-view,text-diff}` tidak masuk daftar. Cadangan utuh: `<scratchpad>/fixu_ip56_backup/` (18 berkas + `LIST.txt`). Perintah hapus siap: `while read -r f; do rm -- "$f"; done < <scratchpad>/fixu_ip56_backup/LIST.txt` dari akar repo, lalu tsc/eslint/glosarium ulang |
| 3 | `playground/rail-summary.ts` kini tanpa pemakai | Dikosongkan menjadi identitas `@deprecated`, TIDAK dihapus (bukan daftar IP-56). Kandidat paket hapus berikutnya |
| 3 | Perubahan perilaku rel: slot lampiran kini dipecah per kunci di penampil dokumen dan Alat developer (dulu satu segmen lewat adaptor SR-30) | Sesuai temuan M4 |
| 9 | L1 sisanya (boundary di segmen pengalih) termasuk daftar IP-56 di atas | |

## Next Steps
- Controller/user: jalankan penghapusan IP-56 dari daftar cadangan (atau beri izin), lalu jalankan ulang glosarium (harus `HITS_MAIN=0`), tsc, dan eslint.
- Baris server untuk kontrak pratinjau v2 R08 (M5), lalu FIX-U lanjutan di UI.
- Review recommended: `shared/completeness-rail.tsx`, `shared/labels.ts`, `scripts/studio/glossary-check.ts`.
