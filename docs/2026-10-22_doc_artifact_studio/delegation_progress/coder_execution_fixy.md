---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: FIX-Y (loop perbaikan siklus 2; D-272; permintaan FIX-V file_requests.md:235-239)
date: 2026-10-23
agent: coder-execution
source_plan: delegation_progress/file_requests.md (FIX-V butir rows.ts, ingest slotParams, kontrak ui.ts, pointer gerbang); coder_execution_fixv.md; coder_execution_fixs.md; D-139, D-261, D-272, D-274 (mediasi FIX-X)
status: complete
---

# FIX-Y: satu sumber `filled`, kenop slot kerangka draf, kontrak pratinjau, pointer badan kiriman

Skill: receiving-code-review, dry-run-verify-fix. Area eksklusif diklaim di `file_claims.md` (prefiks FIX-Y). Semua suntingan atomik (salin cadangan ke scratchpad, ganti persis per potongan ke `<berkas>.fixy.tmp`, rename; 0 berkas `.fixy.tmp` tersisa). `ingest/by-construction.ts` tidak disentuh (milik FIX-X).

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca brief akhir, file_requests FIX-V, catatan FIX-V/FIX-S, D-139/D-261/D-272 | selesai | |
| 2 | Klaim area FIX-Y | selesai | |
| 3 | (1) `rows.ts` `hasContentBeyondType` -> `isSlotPayloadFilled` | selesai | identik, dibuktikan 20.023 kasus |
| 4 | (2) `pinTemplate` jalur `opts.skeleton` mengembalikan `slotParams` murni | selesai | benchmark harness tidak berubah (0 selisih unit/blok) |
| 5 | (3) kontrak `TemplatePreviewPaneProps.draftTemplate`, `draftOverrides` opsional/@deprecated; prop lokal dihapus | selesai | |
| 6 | (4) pointer `BY_CONSTRUCTION_FAILED` bab/slot -> badan kiriman + `mergedPointer` | selesai | R12/R13 nyata dan R08 identik |
| 7 | Mediasi D-274: suntingan FIX-X di `ingest/v2.ts` utuh | selesai | probe X1 PASS |
| 8 | Gerbang: tsc, eslint, vitest, asap | selesai | |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/lib/studio/services/structure/rows.ts | modify | salinan lokal `hasContentBeyondType` dihapus; `M14.filled` slot tak-berulang = `isSlotPayloadFilled` dari `../completeness` (SR-55 M6 satu sumber). `isObj` tetap (dipakai `:508`) |
| src/lib/studio/services/ingest/v2.ts | modify | `pureSlotParams(ctx, tpl, skeleton, tier)`: `resolveSkeletonSlots` jalur cepat SR-06 (`tpl.params` = preset -> templat + turunan, lalu parameter slot + turunan; hanya slot aktif tier), isu kunci slot dicatat `warn` `SLOT_PARAM_SKIPPED` lewat `ingestLog`; `pinTemplate` jalur `ctx.opts.skeleton` kini `{ tpl, tier, skeleton, slotParams }`; doc `V2Options.skeleton` diperbarui. Suntingan FIX-X (`v1FigureSizeIssues`, impor `:71` + `:705-707`) utuh |
| src/lib/studio/contract/ui.ts | modify | `TemplatePreviewPaneProps.draftTemplate?: StudioTemplateV2` (kontrak SR-04); `draftOverrides` opsional + `@deprecated` (jalur v1) |
| src/components/studio/template-preview/index.tsx | modify | `draftTemplate` dihapus dari `TemplatePreviewPaneExtraProps` (kini dari kontrak); perilaku pane tidak berubah |
| src/lib/studio/services/submit/pipeline.ts | modify | `bodyPointerRoutes` + `toBodyPointers` (murni, diekspor) dan `BodyRelativeIssue`; gerbang bersama `assertByConstruction` dibungkus: untuk kiriman bab/slot, 422 `BY_CONSTRUCTION_FAILED` dilempar ulang lewat `byConstructionError` dengan pointer relatif badan + `mergedPointer` (pointer dokumen tergabung). Kiriman dokumen tidak berubah |
| delegation_progress/file_claims.md | append | klaim FIX-Y |

Aturan pemetaan pointer (4):
- Bab dikenali lewat pid: `blockId` bab di tampilan lint (`snapshot.doc.chapters|appendices[i]`) = `id` bab di dokumen tergabung, lalu (slotKey, key) dicocokkan dengan kiriman. Urutan bab, bagian (parts), dan lampiran tidak dapat menyesatkan.
- R12: `/chapters/<i>/...` -> `/chapter/...`. Bab kiriman diterima utuh (`upsertChapter`), jadi `title`, `intro/k`, `sections/j`, `sections/j/blocks/k` 1:1.
- R13 slot berulang: bab slot itu -> `/payload/chapters/<j>` (indeks berdasar kunci di `payload.chapters`). R13 slot tak-berulang: `/front/<cover|controlSheet|toc|signature>` -> `/payload` (bentuk halaman depan tampilan lint berbeda dari payload).
- Sisa segmen hanya dipertahankan sepanjang benar-benar ada di badan kiriman (`existingPath`), sehingga pointer badan selalu menunjuk medan nyata; selebihnya terpotong ke induk terdekat.
- Isu yang tidak berasal dari bagian kiriman (mis. register, bab lain yang sudah tersimpan) tidak diubah dan tanpa `mergedPointer`.
- R08 `{schemaId, spec}` tetap menambah prefiks `/spec` di route (tidak diubah).

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck repo | `npx tsc --noEmit -p tsconfig.json` | exit 0 (0 galat) | dijalankan sesudah semua suntingan termasuk suntingan FIX-X |
| Lint area | `npx eslint src/lib/studio/services/structure/rows.ts src/lib/studio/services/ingest/v2.ts src/lib/studio/contract/ui.ts src/components/studio/template-preview src/lib/studio/services/submit/pipeline.ts` | exit 0 | |
| Vitest wajib | `npx vitest run tests/unit/studio/api/ tests/unit/studio/api-structure tests/unit/studio/structure` | `Test Files 25 passed (25); Tests 1035 passed (1035)` | sama dengan FIX-V; tidak ada uji SR-43/44/45 yang diubah atau gagal; tidak ada uji unit yang mengasersi pointer gerbang bab/slot (grep `tests/`) |
| Ekuivalensi (1) | `<scratchpad>/fixy/equiv.ts` (salinan persis fungsi lama vs `isSlotPayloadFilled`) | `RESULT cases=20023 diff=0` | 23 kasus tepi (null, array, `{type}`, `{type: undefined}`, nilai falsy, `Object.create(null)`, Date) + 20.000 objek acak |
| Dampak (2) harness benchmark | `<scratchpad>/fixy/bench_cmp.ts` (Manual 000 doc.v2 + template.v2, kenop slot kerangka diterapkan vs dikosongkan) | `units 29 blocks 393`, hash unit dan blok identik, `unit diffs 0` | jalur `opts.skeleton` lain (harness) tidak bergeser |
| Asap DB v21 | `STUDIO_RENDER_RATE_LIMIT=200 NODE_PATH=<repo>/node_modules npx tsx --tsconfig tsconfig.json <scratchpad>/fixy/fixy_smoke.ts` | `RESULT pass=12 fail=0` | log `<scratchpad>/fixy/fixy_smoke.log` |

`<scratchpad>` = `C:\Users\TRIAL\AppData\Local\Temp\claude\C--Users-TRIAL-AppData-Local-Claude-Data-claude-pzs8sxrjxfjjc-scratch-workspaces-82c3eee2-ba3c-4c60-933d-04d93794dde1-2baf709b-3616-4b3d-bc4d-6b5ff33884c7-scratch-2026-10-22-a4e38a\4f3398cf-689f-41f1-aaa2-aa5e16082c93\scratchpad`; cadangan berkas asli di `<scratchpad>\fixy\*.orig`.

## Verification
- Fixture terisolasi: satu dokumen misi `2026-10-23_fixy_<acak>` (datum-gsp), dokumen 000 tidak disentuh (RESEED aktif). Hitungan sisa dicek per dokumen fixture, bukan global: Z0 `deleted 1`, 0 dokumen/revisi/M14-M17 (per revisionId)/identitas/RenderJob tersisa.
- P1 R08 bab melanggar (pembuatan) -> `valid:false`, pointer `["/chapter/sections/1/title", "/chapter/sections/1/blocks/1"]`, `mergedPointer` `["/chapters/0/sections/1/title", "/chapters/0/sections/1/blocks/1"]` (DATUM-04 judul pertanyaan, DATUM-19 PPN 10 %). P1s bentuk `{schemaId, spec}` -> `/spec/chapter/sections/1/title`.
- P2 R12 NYATA bab 2 melanggar ke dokumen fixture -> 422 `BY_CONSTRUCTION_FAILED`, pointer badan sama, `mergedPointer` `/chapters/1/...` (bab 1 tersimpan di indeks 0: bukti pemetaan lewat pid, bukan indeks). P2r R08 sama -> pointer identik dengan R12.
- P3 R13 NYATA slot controlSheet melanggar -> 422, pointer `["/payload"]`, `mergedPointer` `["/front/controlSheet"]`; P3r R08 identik. P4 422 tidak menulis revisi (tetap 1).
- D1 pratinjau draf (R08 `?preview=html` + `draftTemplate`): kenop slot toc `render.toc.title = "Peta Isi Uji FIXY"` -> `valid:true`, HTML memuat judul itu, HTML tanpa kenop tidak memuatnya (HTML berubah). D2 jalur layanan: `ingestDocument` dryRun + kerangka siap pakai -> snapshot `front.toc.title = {"text":"Peta Isi Uji FIXY"}` (compose kini memakai kenop slot kerangka; sebelumnya `pinTemplate` jalur ini tidak mengembalikan `slotParams` sehingga compose memakai params templat, temuan FIX-V).
- X1 (mediasi D-274) R04 v1 chart `widthMm: 150` pada datum-gsp A4 -> 422 `BY_CONSTRUCTION_FAILED` `G2` pointer `/document/chapters/0/sections/1/blocks/0/spec/widthMm` ("lebar 150 mm bukan 128 mm maupun 166 mm"): suntingan FIX-X di `ingest/v2.ts` utuh dan bekerja; `grep v1FigureSizeIssues` -> `:71` impor, `:706` panggilan.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| - | - | - | tidak ada | tidak |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 6 | Brief menyebut pointer slot `/slot/...`, tetapi di badan R13 `slot` adalah kunci string (`studio.slot/v2` required `slot`, `payload`) | isi slot ada di `/payload`; pointer badan slot = `/payload/...` (satu-satunya pointer relatif badan yang dapat diresolusi). Mohon DOC-2 menulis `/payload` |
| 6 | Kedalaman pointer slot tak-berulang | tampilan lint halaman depan (`{mode, data}`) berbeda bentuk dari payload, jadi dipetakan ke `/payload` (tanpa sisa); `mergedPointer` membawa lokasi asal |
| 6 | Tempat pemetaan | di pipeline (pemilik kiriman), membungkus gerbang bersama `assertByConstruction` dan melempar ulang `byConstructionError` (fungsi diekspor by-construction, tanpa menyunting berkas FIX-X); satu jalur untuk R12/R13 nyata dan R08 dry-run |
| 4 | Resolusi slot murni: jalur cepat vs berlapis | jalur cepat (`tpl.params` sudah preset -> templat); setara jalur berlapis untuk kunci slot (cakupan slot/section, bukan kenop fase lapis, `skeleton/resolve.ts` kepala modul); `V2Options.slotParams` eksplisit tidak ditambahkan karena route R08 (area FIX-V) tidak perlu berubah |
| 5 | `draftOverrides` | opsional + `@deprecated`; editor templat (bukan area FIX-Y) masih mengirim `EMPTY`, tetap kompatibel |
| 7 | D-274 FIX-X menyunting `ingest/v2.ts` (klaim FIX-Y) | suntingan FIX-X dan FIX-Y hidup berdampingan; diverifikasi grep + probe X1 |

## Next Steps
- DOC-2: register §12 R12/R13/R08 + API-REFERENCE + panduan agen: isu `BY_CONSTRUCTION_FAILED` kiriman bab/slot berpointer badan (`/chapter/...`, `/payload/...`, R08 bentuk `spec` berprefiks `/spec`) + medan `mergedPointer`; kontrak `ValidationIssue` (`contract/types/api.ts`, pemilik SR-04) belum memuat `mergedPointer` sebagai medan opsional (tipe lokal `BodyRelativeIssue` di pipeline) -> usul tambah `mergedPointer?: string`.
- Review recommended: `submit/pipeline.ts` (`bodyPointerRoutes`/`toBodyPointers` + bungkus gerbang), `ingest/v2.ts` (`pureSlotParams`).
