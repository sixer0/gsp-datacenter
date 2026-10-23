---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: FIX-S2 (loop perbaikan siklus 3; D-278 SR-55b N1 + M2 sisa, N2, N3, N5; D-280 S2-01 = N2, S2-03)
date: 2026-10-23
agent: coder-execution
source_plan: gateway_check/08b_review_services_fixloop.md (N1, N2, N3, N5, M2 sisa); gateway_check/10b_security_rerun2.md (S2-01, S2-03); delegation_progress/final_phase_brief.md
status: complete
---

# FIX-S2: gerbang R04 atas dokumen tergabung, hak draf = hak simpan, satu format pengisi, modul daun inlineFormat, laju R08

Skill: receiving-code-review, backend-execution, dry-run-verify-fix. Area eksklusif diklaim di `file_claims.md` (prefiks FIX-S2). Semua suntingan atomik: cadangan asli di `<scratchpad>/fixs2/orig/*.orig`, sunting `<berkas>.fixs2.tmp` lalu rename; 0 berkas `.fixs2.tmp` tersisa (`find src -name "*.fixs2.tmp"` = 0).

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca brief akhir, SR-55b, SR-57 ulang 2, catatan FIX-S/FIX-V/FIX-Y, D-98..D-280 | selesai | |
| 2 | Klaim area (+ `validate/route.ts`, `_shared/validate-rate.ts` baru, `services/inline-format/policy.ts` baru) | selesai | |
| 3 | N1 + M2 sisa: jalur dokumen yang ADA di ingest v2 | selesai | asap 7 kasus + 3 kasus M2 |
| 4 | N2 / S2-01: pratinjau draf mengikuti hak simpan | selesai | asap 5 kasus |
| 5 | N3: `lastFilledBy` satu helper | selesai | asap 2 kasus |
| 6 | N5: `inlineFormatPolicyOf` ke modul daun | selesai | |
| 7 | S2-03 (tambahan controller): laju R08 | selesai | asap 2 kasus |
| 8 | Gerbang: tsc, eslint, vitest, asap | selesai | |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| `src/lib/studio/services/ingest/v2.ts` | modify | N1/M2: `existingDocPin` (target `documentId`, selain itu upsert misi via `resolveDocTarget` + unik `missionFolder_missionDocKey`; templat di memori dilewati); `pinTemplate` memakai versi TERSEMAT untuk keduanya; `ingestIntoExisting`: hanya cek isi kiriman (`preflightContent`: register DATUM-11 400, aset 413/415), TANPA compose/gerbang atas kerangka kosong; dryRun -> `dryRunDocumentV2` (READ ONLY), simpan -> `submitDocumentV2` (gerbang bersama in-tx atas dokumen tergabung + kerangka tersemat); lint hasil = `evaluateByConstruction` atas snapshot revisi yang ditulis (masukan sama dengan gerbang in-tx). `runPipeline` (pembuatan) tidak berubah perilaku: register+aset diekstrak ke `preflightContent`. `persistV2ViaSubmit` menerima pembentuk hasil. N5: ekspor ulang `inlineFormatPolicyOf` dari modul daun |
| `src/lib/studio/services/inline-format/policy.ts` | add | modul daun `inlineFormatPolicyOf` + `INLINE_FORMAT_PARAM_KEY` (hanya impor tipe kontrak) |
| `src/lib/studio/services/render/common.ts` | modify | impor `inlineFormatPolicyOf` dari modul daun (bukan `ingest/v2`) |
| `src/app/api/studio/validate/_shared/template-draft.ts` | modify | N2/S2-01: langkah 5-7 simpan v2 dicerminkan (roleFormats milik lapis via `ownRoleFormats`, lapis slot lama dibaca untuk semua peran, carry non-ADMIN untuk semua slot, roleFormats slot dibawa), lalu `diffEffective` (templat + slot) -> `checkTemplateWrite` SR-06 + `assertAdminOnlyFields` (= isi `assertWriteRights`); pelanggaran -> `{ok:false, issues}` berpointer `/draftTemplate/template/(skeleton/slots/i/)?(essentials|advanced)/<kunci>`, `keyword` = kode simpan, pesan = pesan simpan; log `DRAFT_TEMPLATE_WRITE_FORBIDDEN` |
| `src/lib/studio/services/submit/meta.ts` | modify | N3: `fillerOf` menerima pemanggil null (-> `ANONYMOUS_FILLER`), requester kosong -> `anonymous`; doc satu format semua jalur tulis v2 |
| `src/lib/studio/services/revisions/v2/commit.ts` | modify | N3: cap `lastFilledBy` = `fillerOf(caller)` (R16/R06/R14); `createdBy` tetap requester (audit) |
| `src/app/api/studio/validate/_shared/validate-rate.ts` | add | S2-03: limiter R08 dari helper FIX-1 yang sama (`createFixedWindowLimiter`, `renderRateIdentity`, `reject` -> 429 `RATE_LIMITED` + `Retry-After`); ember terpisah 120/60 s per pemanggil (env `STUDIO_VALIDATE_RATE_LIMIT`/`_WINDOW_MS`), `resetValidateRateLimiter` untuk uji |
| `src/app/api/studio/validate/route.ts` | modify | S2-03: `checkValidateRate` untuk SETIAP POST sesudah identitas; `?preview=html` tetap juga dihitung ember render; kepala modul diperbarui (S2-01, S2-03) |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck repo | `npx tsc --noEmit --incremental false -p tsconfig.json` | `tsc_exit=0`, 0 `error TS` | percobaan pertama TS6053 berkas `benchmark/out/fixb2/baseline_src/**` hilang (ditulis/dihapus agen lain bersamaan); ulang = 0 |
| Lint area | `npx eslint src/lib/studio/services/ingest/v2.ts src/app/api/studio/validate src/lib/studio/services/submit/meta.ts src/lib/studio/services/revisions/v2/commit.ts src/lib/studio/services/render/common.ts src/lib/studio/services/inline-format` | `eslint_exit=0` | |
| Vitest wajib | `npx vitest run tests/unit/studio/api/ tests/unit/studio/api-structure tests/unit/studio/structure tests/unit/studio/fix1` | `Test Files 26 passed (26); Tests 1075 passed (1075)` | |
| Vitest security | `npx vitest run tests/unit/studio/security` | `5 passed; 77 passed` | tambahan (route R08 berubah) |
| Asap DB v21 | `STUDIO_RENDER_RATE_LIMIT=200 NODE_PATH=<repo>/node_modules npx tsx --tsconfig tsconfig.json <scratchpad>/fixs2/fixs2_smoke.ts` | `RESULT pass=23 fail=0` | log `<scratchpad>/fixs2/fixs2_smoke.log`; run pertama 22/23: skrip asap tidak mengirim `agentId` di badan R16 (R16 membaca agentId dari badan), bukan cacat kode |

`<scratchpad>` = `C:\Users\TRIAL\AppData\Local\Temp\claude\C--Users-TRIAL-AppData-Local-Claude-Data-claude-pzs8sxrjxfjjc-scratch-workspaces-82c3eee2-ba3c-4c60-933d-04d93794dde1-2baf709b-3616-4b3d-bc4d-6b5ff33884c7-scratch-2026-10-22-a4e38a\4f3398cf-689f-41f1-aaa2-aa5e16082c93\scratchpad`.

## Verification
- Fixture: dokumen misi `2026-10-23_fixs2_<ts>_{a,b}` bernomor `FIXS2-FX-*`; Z0 `deleted 2`, 0 sisa (dokumen, revisi, M14-M18, identitas, RenderJob per fixture); Z1 000 + dokumen lain tidak berubah; Z2 versi templat datum-gsp tidak bertambah.
- N1 (dokumen A, datum-gsp, register 3 entri + bab 1 turunan): N1.0 kontrol jalur LAMA (gabung ke kerangka kosong, dipaksa `opts.template`) -> `valid:false` D03 "kunci register tidak terdaftar" (sumber 422 palsu); N1.1 R04 BERTARGET bab 2 turunan tanpa register -> 201, scope `document;chapter:2`; N1.2 R04 UPSERT MISI bab 3 -> 201 dokumen sama; N1.3 bertarget PPN 10 % -> 422 `BY_CONSTRUCTION_FAILED` DATUM-19, 0 tulis; N1.4 upsert misi judul pertanyaan -> 422 DATUM-04, 0 tulis; N1.5 R08 upsert misi sah -> `valid:true` (kelengkapan INCOMPLETE pasca-gabung), melanggar -> `valid:false` DATUM-19.
- M2 sisa (dokumen B, ADMIN, datum-manual-000 v1): M2.0 kontrol agen membuat dokumen BARU di versi terbaru -> 403 (v3 terbatas); M2.1 agen UPSERT MISI ke B tanpa versi -> 201 tersemat v1 (dulu pra-gerbang memakai v3 terbaru -> 403); M2.2 versi 3 -> 409 `TEMPLATE_MISMATCH`.
- N2: N2.1 USER draf `advanced.color.classificationInk` -> `valid:false` `PARAM_CLASS_K_FORBIDDEN` pointer `/draftTemplate/template/advanced/color.classificationInk`, tanpa `previewHtml`; N2.2 USER `advanced.color.wrapper.paper` -> `PARAM_SURFACE_FORBIDDEN`; N2.3 ADMIN draf sama -> `valid:true` + HTML; N2.4 USER esensial saja (`color.interior.signal`) -> `valid:true`, HTML memuat `b4232c`; N2.5 simpan NYATA USER draf sama (POST R03 v2) -> 403 `PARAM_CLASS_K_FORBIDDEN`, pesan identik dengan isu pratinjau, versi tidak bertambah.
- N3: agen R12 bab 6 -> `lastFilledBy = "fixs2-agent"`; agen R16 sunting blok bab 6 -> `"fixs2-agent"` dengan `lastFilledRevisionNo` naik (dulu R16 = `caller.requester` `agent:fixs2-agent`, `commit.ts:207` lama); N3b ingest R04 bertarget mencap `"fixs2-agent"`.
- N5: `grep -rn "ingest/v2" src/lib/studio/services/render/` = 0 hit; modul daun hanya `import type` kontrak.
- S2-03: `STUDIO_VALIDATE_RATE_LIMIT=3` -> burst `[200,200,200,429]`, `code RATE_LIMITED`, `Retry-After: 60`; pemanggil lain tetap 200 (ember per identitas).

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| - | - | - | tidak ada | tidak |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 3 | Lewati pra-gerbang vs beri ingest konten tergabung (dua opsi SR-55b) | Lewati: dokumen yang ada -> satu penahan (gerbang layanan kiriman atas dokumen tergabung + kerangka tersemat, sama dengan R12/R13). Cek ISI kiriman tetap di ingest (skema, batas, templat tersemat + D-98 + `TEMPLATE_MISMATCH`, register DATUM-11, aset 413/415). P3-20 dan `META_REQUIRED_FOR_CREATE` hanya untuk pembuatan (sama dengan layanan kiriman). `ASSET_NOT_FOUND` rujukan kunci tidak ditolak ingest untuk dokumen yang ada (aset dapat tersimpan di dokumen); diputus layanan kiriman |
| 3 | Pencarian dokumen misi di luar kunci | Hanya memilih jalur cek ingest; keputusan otoritatif di dalam kunci. Target misi tidak sah -> log `MISSION_TARGET_DEFERRED`, galat dilempar layanan kiriman saat simpan (perilaku lama). `opts.template`/`opts.skeleton` (harness, draf R08) tidak dicocokkan ke dokumen misi |
| 3 | Lint hasil jalur dokumen yang ada | dryRun: lint dry-run layanan + temuan kepercayaan ingest; simpan: `evaluateByConstruction` atas snapshot revisi yang ditulis (~70 ms). Kiriman identik (`unchanged`) dryRun: lint null. R04 HTTP hanya memakai medan `submit` (tidak berubah) |
| 4 | Satu sumber hak tulis | `assertWriteRights` tidak diekspor (`templates/index.ts`, di luar area); draf memanggil isinya persis (`checkTemplateWrite` + `assertAdminOnlyFields`) atas `diffEffective` yang sama. Usul konsolidasi: ekspor helper `templateWriteChanges` + `assertWriteRights` dari `templates` agar simpan dan draf berbagi satu fungsi (file request, bukan penahan) |
| 4 | Templat preset gaya (base `isPreset`) oleh non-ADMIN | Draf -> isu `PRESET_READONLY` di `/draftTemplate/base` (sama dengan simpan) |
| 7 | S2-03: ember render vs ember terpisah | Ember TERPISAH dari helper yang sama (pola FIX-1, satu sumber mekanisme + identitas + respons), lebih longgar (120/menit) sesuai rekomendasi SR-57 agar validasi interaktif editor tidak menghabiskan jatah kiriman/build. Alternatif (`checkRenderRate` untuk semua R08, ember bersama 30/menit) tinggal satu baris bila controller memilihnya |
| 6 | N5 transitif | `render/common.ts` masih mengimpor `applyDocOverrides` dari `ingest/index.ts` (yang memuat `ingest/v2`). Pemindahan `applyDocOverrides` ke modul daun = di luar area (pemilik `ingest/index.ts`); IP-55 tetap terbuka |

## Next Steps
- Controller: (opsional) file request ekspor `assertWriteRights`/`templateWriteChanges` dari `services/templates` (N2 satu fungsi), dan `applyDocOverrides` ke modul daun (N5 transitif, IP-55).
- DOC-2: R04 dokumen yang ada (bertarget/upsert misi) kini digerbang hanya atas dokumen tergabung; R08 429 `RATE_LIMITED` (ember validasi 120/menit, env); draf R08 non-ADMIN memberi isu kode simpan.
- SR-45 lanjutan: uji suite permanen untuk N1 (R04 bertarget/upsert misi dengan turunan register tersimpan), N2 (USER kelas K/lanjutan), S2-03 (429 R08).
- Review recommended: `services/ingest/v2.ts` (`existingDocPin`, `ingestIntoExisting`, `preflightContent`), `validate/_shared/template-draft.ts` (langkah 5-7b), `validate/_shared/validate-rate.ts`.
