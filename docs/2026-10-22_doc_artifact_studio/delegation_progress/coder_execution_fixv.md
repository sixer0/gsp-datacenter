---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: FIX-V (loop perbaikan siklus 2; D-252, D-261; IP-51 + FIX-U M5 + SR-55 M6)
date: 2026-10-23
agent: coder-execution
source_plan: delegation_progress/integration_backlog.md (IP-51, FIX-V); coder_execution_fixu.md (M5); coder_execution_fixs.md; file_requests.md:201 (M6); D-131, D-139, D-207, D-247
status: needs-review
---

# FIX-V: R08 dry-run bab/slot v2 + draf templat v2, kelengkapan satu sumber

Status `needs-review` karena satu keputusan data M6 (lihat Issues & Decisions, file_requests FIX-V butir 1). Seluruh kode selesai dan terverifikasi; tidak ada kegagalan terbuka di area. Skill: backend-execution, frontend-integration, dry-run-verify-fix.

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca brief akhir, FIX-U (M5), FIX-S, file_requests M6, backlog IP-51, D-131/139/207/247/252/261 | selesai | |
| 2 | Klaim `file_claims.md` (prefiks FIX-V), tulis atomik (salin -> sunting `.fixv.tmp` -> rename) | selesai | |
| 3 | M6: state slot E29, urutan + kunci bab yang diharapkan satu sumber di completeness; compose + R05 mengimpor | selesai | sisa aturan `filled` = keputusan (data) |
| 4 | IP-51: opsi dryRun layanan kiriman (transaksi READ ONLY, tanpa kunci, tanpa tulis) | selesai | |
| 5 | IP-51: R08 bab/slot v2 -> dry-run kiriman parsial + kelengkapan pasca-gabung + HTML opsional | selesai | |
| 6 | M5: R08 `draftTemplate` -> ingest dryRun `template`+`skeleton`, HTML norm/v2 sadar slot | selesai | |
| 7 | M5 UI: pratinjau templat jalur v2 (preset + esensial + kerangka), editor mengirim draf simpan | selesai | |
| 8 | Gerbang: tsc, eslint, vitest, glosarium, asap R08, pindai rekonstruksi, bukti READ ONLY, curl | selesai | |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/lib/studio/services/completeness/compute.ts | modify | `expectedChapterKeys(sectionType, outline, present)` (§8.2, satu sumber), `isSlotPayloadFilled` (aturan `M14.filled`), `slotStateOf(SlotStateInput)` (tabel §8.1 dari masukan ringkas, memakai `chapterProgress` + `slotState` yang sama dengan laporan) |
| src/lib/studio/services/completeness/index.ts | modify | ekspor fungsi di atas |
| src/lib/studio/services/compose/snapshot.ts | modify | salinan `compareChapterKeys`/`expectedChapterKeys`/`slotState` dihapus; `compareChapterKeys` diekspor ulang dari completeness, `expectedChapterKeys`/`slotState` = adaptor tipis ke completeness (urutan §8.1 kini AUTO/MIXED dulu, sama dengan laporan) |
| src/app/api/studio/documents/[id]/route.ts | modify | `fallbackState` R05 = `slotStateOf` (contentMode/minItems slot templat, outline payload M14, kunci bab M15); sebelumnya PARTIAL dan AUTO_READY tidak pernah muncul |
| src/lib/studio/services/submit/lock.ts | modify (opsi dryRun) | `withDocumentLock(..., { readOnly })`: `SET TRANSACTION READ ONLY` sebagai pernyataan pertama, tanpa kunci advisory, tanpa pengulangan balapan; `setReadOnly` |
| src/lib/studio/services/submit/pipeline.ts | modify (opsi dryRun) | `SubmitPlan.dryRun`, `runSubmissionDryRun` -> `SubmitDryRunResult { result, lint, snapshot, template, tier }`; dry: aset base64 hanya didekode (`decodeImageDetailed`, galat 413/415/400 sama), dokumen baru di memori, nomor sekuens tidak diambil, titik henti sesudah gerbang by-construction (revisi/baris/kolom tidak ditulis); jalur nyata tidak berubah (`execute` bersama) |
| src/lib/studio/services/submit/index.ts | modify (opsi dryRun) | builder rencana bersama `chapterPlan/slotPlan/documentPlan`; `dryRunChapter`, `dryRunSlot`, `dryRunDocumentV2`; ekspor `DRY_RUN_DOC_NUMBER`, `SubmitDryRunResult` |
| src/app/api/studio/validate/route.ts | modify | bab/slot v2 -> dry-run kiriman parsial (`completenessPreview` pasca-gabung, `submitPreview`, `lint`, `?preview=html`); medan `draftTemplate` (hanya doc/v2); HTML norm/v2 untuk doc v2 dan v1 (adaptor) menggantikan `PREVIEW_UNAVAILABLE`; `issuesFromError` membaca `details.issues` |
| src/app/api/studio/validate/_shared/template-draft.ts | add | resolusi draf `studio.template/v2` tanpa simpan, langkah dan fungsi sama dengan simpan v2 (bentuk SID04, kerangka SR-06, lapis preset, `templateLayerOf`, `carryHiddenForNonAdmin` non-ADMIN dari base, `composeVersion`, `resolveSkeletonSlots` berlapis); D-98 403 untuk preset/base/hasil draf terbatas |
| src/app/api/studio/validate/_shared/preview-v2.ts | add | `versionSlots` (slot efektif versi tersimpan, roleFormats dari templat pemanggil) + `buildPreviewHtmlV2` (assembleHtml sadar slot, mode pratinjau) |
| src/components/studio/template-preview/sample-document-v2.ts | add | dokumen contoh `studio.doc/v2` konten saja dari kerangka draf (sampul, lembar kendali, daftar isi, pengesahan, bab, lampiran; slot lain kosong) |
| src/components/studio/template-preview/{index.tsx,api.ts,param-tools.ts} | modify | prop `draftTemplate`: jalur v2 (`postValidatePreviewV2`, badan doc/v2 + `draftTemplate{template, base}`); jalur v1 tetap sebagai cadangan bila kerangka belum terbaca; `paramKeyFromPointer` mengenali `/draftTemplate/template/(skeleton/slots/n/)?(essentials|advanced)/<kunci>` |
| src/components/studio/template-editor/template-editor.tsx | modify (props pane) | `saveSource` memo (logika simpan yang sama, dipakai `save` dan pratinjau), `previewTemplate = toTemplateV2(saveSource)` diteruskan ke `SettingsStep` -> `TemplatePreviewPane draftTemplate` |
| tests/unit/studio/structure/completeness-shared.test.ts | add | 60 kasus tabel §8.1 (3 contentMode x wajib/opsional x 10 bentuk berulang/tak-berulang/lampiran/outline) dibandingkan dengan harapan dari register lewat tiga pintu (laporan, `slotStateOf`, `compose.slotState`) + urutan/kunci bab + `isSlotPayloadFilled` |
| delegation_progress/file_claims.md, file_requests.md | append | klaim FIX-V; 6 permintaan berkas di luar area |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck repo | `npx tsc --noEmit -p tsconfig.json` | exit 0 (0 galat repo) | |
| Lint area | `npx eslint src/app/api/studio/validate "src/app/api/studio/documents/[id]/route.ts" src/lib/studio/services/compose/snapshot.ts src/lib/studio/services/completeness src/lib/studio/services/submit src/components/studio/template-preview src/components/studio/template-editor/template-editor.tsx tests/unit/studio/structure/completeness-shared.test.ts` | exit 0 | |
| Vitest wajib | `npx vitest run tests/unit/studio/api/ tests/unit/studio/api-structure tests/unit/studio/structure` | `Test Files 25 passed (25); Tests 1035 passed (1035)` | termasuk 61 uji M6 baru |
| Vitest M6 | `npx vitest run tests/unit/studio/structure/completeness-shared.test.ts tests/unit/studio/structure/completeness.test.ts` | 2 berkas, 96 lulus | |
| Vitest fix1 (pemakai validate) | `npx vitest run tests/unit/studio/fix1` | 24 lulus / 14 gagal | uji validate R08 di fix1 (baris 379, 523) LULUS; 14 gagal = R04 render/antrean/PATCH pra-D-247, sudah tercatat gagal di FIX-U, bukan area ini |
| Asap R08 (v21, tanpa fixture tulis) | `STUDIO_RENDER_RATE_LIMIT=200 NODE_PATH=<repo>/node_modules npx tsx --tsconfig tsconfig.json <scratchpad>/fixv/r08_smoke.ts` | `RESULT pass=22 fail=0` | rincian di Verification; log `<scratchpad>/fixv/r08_smoke.log` |
| Bukti READ ONLY | `<scratchpad>/fixv/readonly_guard.ts` | `RESULT PASS`: tulis di `withDocumentLock({readOnly:true})` -> PostgreSQL 25006 "cannot execute UPDATE in a read-only transaction"; kontrol tanpa readOnly count=0 | |
| Pindai rekonstruksi (baca-saja) | `<scratchpad>/fixv/recon_scan.ts` | `RESULT revisions=6 ok=6 bad=0` (state kerangka tersimpan = compose ulang) | 1 revisi fixture baris lain hilang saat pindai pertama (dilewati) |
| Glosarium | `npx tsx scripts/studio/glossary-check.ts` | `files=125 texts_checked=2171 HITS_MAIN=0` | |
| curl dev :9021 | `/studio/templates`, `/studio/templates/x`, `/studio/templates/x/edit` | 307 -> `/login?next=...` (tanpa sesi); POST `/api/studio/validate` anonim 401 | server tidak di-restart |

## Verification
- IP-51 bab v2 sah -> pratinjau kelengkapan: A1 bab 1 ke 000 -> `valid:true`, `completenessPreview.status=COMPLETE`, `submitPreview {documentId, revisionNo:5, changeScope:"chapter:1", chapter.pid}`; A1b bab kunci 98 -> `INCOMPLETE`, `missingRequired` 80 kunci `content:18..` , `fullRenderAllowed:false` (kelengkapan PASCA-GABUNG); A4 bab ke misi baru -> `created:true, documentId:null, docNumber:"(nomor dari sekuens)"`, A4b dokumen misi tidak dibuat (count 0); A5 slot controlSheet -> `submitPreview.slot {F:controlSheet, pid}`; A6 `?preview=html` -> HTML pasca-gabung (memuat `data-unit` dan teks bab baru).
- Bab melanggar -> issues: A2 judul pertanyaan TERBIT -> `valid:false` `DATUM-04` (ADMIN), A2u USER sama; A3 PPN 10 % -> `DATUM-19`; A7 bentuk `{schemaId, spec}` -> pointer berawalan `/spec`; A8 dokumen tidak ada -> `DOCUMENT_NOT_FOUND`; A9 `render` di badan -> `RENDER_FIELD` (D-247).
- Draf templat -> HTML v2: B1 doc v2 + `draftTemplate` (base datum-gsp v2, preset datum-gsp-preset, kerangka 7 slot, `color.interior.signal=#B4232C`) -> `valid:true`, HTML norm/v2 memuat `b4232c`; B1b tanpa ubahan tidak memuat warna itu (efek draf nyata); B2 `page.size=A5` -> `@page` 148 mm (tidak ada di B1b); B3 kunci asing -> `valid:false` `/draftTemplate/template/essentials/tidak.dikenal` PARAM_UNKNOWN_KEY; B4 draf pada bab -> `/draftTemplate`; B5 USER (lapis tersembunyi dibawa dari base) -> valid + HTML; B6 doc v2 tanpa draf -> HTML (bukan PREVIEW_UNAVAILABLE); C1 dokumen v1 (adaptor -> norm/v2) -> HTML.
- Tanpa baris DB baru: Z1 sebelum = sesudah `doc=3 rev=6 sec=27 chap=88 sub=417 block=1116 ident=448 legacyBlock=1251 renderJob=5 out=15 asset=26`; Z2 dokumen 000 `currentRevisionNo 4`, `updatedAt` dan kelengkapan tidak berubah.
- M6: 61 uji baru lulus; matriks 60 kasus = harapan register di ketiga pintu. Dengan kode compose LAMA kasus berulang x MIXED/AUTO akan gagal (compose dulu mengembalikan EMPTY/PARTIAL/FILLED dari bab, laporan AUTO_READY), yaitu temuan M6.
- Snapshot tidak berubah oleh M6: pindai rekonstruksi 6/6 cocok dan state kerangka sama.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Aturan `filled` slot tak-berulang di state kerangka snapshot belum diseragamkan dengan `M14.filled` | 1 (diuji lalu dikembalikan) | Menyeragamkan membuat 000 rev 2/3 (`toc = {type:"toc"}`) tidak terekonstruksi (pindai: `matches=false`, toc FILLED -> AUTO_READY) | keputusan controller (file_requests FIX-V butir 1) | tidak untuk kode; ya untuk penutupan penuh M6 |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 3 | M6 satu sumber vs identitas snapshot tersimpan (D-258) | Tabel §8.1, urutan kunci, kunci yang diharapkan, dan R05 kini satu sumber. `filled` tak-berulang di compose tetap "payload ada" (komentar di `slotState`) agar 6/6 revisi tetap terekonstruksi; opsi (a) seragamkan + tulis ulang snapshot 000 rev 2/3 dengan cadangan (pola F-070) atau (b) terima tercatat. needs-review |
| 4 | Cara dry-run tanpa tulis | Transaksi `READ ONLY` (jaminan PostgreSQL, terbukti 25006) + titik henti eksplisit sebelum tulis; TANPA kunci advisory agar validasi tidak menahan penulis; nomor sekuens tidak diambil (meta tanpa nomor, sama dengan ingest dryRun). Cek rekonstruksi D-258 dilewati (baris tidak ditulis) |
| 4 | Pemanggil benchmark (000, penanda D-34) | Dry-run ADMIN ke 000 menurunkan penahan seperti kiriman nyata (sama persis), jadi uji negatif memakai jalur pembuatan datum-gsp |
| 6 | Bentuk `draftTemplate` | `{ template: StudioTemplateV2, base?: { slug, version? } }`, terpisah dari kiriman (doc/v2 `additionalProperties:false`, D-139 kontrak konten murni tidak memuat medan templat). Hak tulis per kunci tidak dinilai pada pratinjau (bukan tulis), D-98 tetap 403 |
| 6 | Pratinjau templat tanpa penanda draf | `draft:false` untuk pratinjau templat; pratinjau kiriman dokumen/bab yang belum lengkap memakai penanda draf |
| 7 | Editor: logika sumber simpan | dipindah ke memo `saveSource` (isi sama) agar pratinjau memakai draf yang persis akan disimpan; jalur v1 pane dipertahankan sebagai cadangan bila kerangka belum terbaca |
| 5 | Pointer isu gerbang bab/slot | sama dengan R12/R13 nyata (struktur dokumen tergabung); usulan pemetaan ke badan -> file_requests FIX-V |
| - | Di luar area -> file_requests | `structure/rows.ts` pakai `isSlotPayloadFilled`; ingest `V2Options.slotParams` untuk kerangka draf; kontrak `TemplatePreviewPaneProps.draftTemplate`; DOC-2 register/API/panduan R08; pointer gerbang (FIX-S) |

## Next Steps
- Controller: putuskan M6 sisa (a/b) di file_requests FIX-V butir 1.
- Pemilik ingest: `V2Options.slotParams` agar compose dry-run draf memakai kenop slot draf.
- Review recommended: `submit/pipeline.ts` + `lock.ts` (jalur dryRun READ ONLY), `validate/_shared/template-draft.ts` (paritas dengan simpan v2, D-98), `validate/route.ts`, `completeness/compute.ts`.
- UI belum dilihat di peramban (halaman butuh sesi login); jalur API yang dipakai pane diverifikasi asap B1-B6 dengan modul dokumen contoh yang sama.
