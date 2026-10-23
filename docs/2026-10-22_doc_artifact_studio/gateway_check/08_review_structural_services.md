# SR-55: review kode delta struktur (layanan, kontrak, route, migrasi)

Penulis: senior-code-reviewer (baris SR-55). Tanggal: 2026-10-23. Mode: REVIEW-ONLY, tanpa perubahan `src/**` maupun `prisma/**`. Skill: code-review-senior.
Masukan: brief `delegation_progress/final_phase_brief.md`, blueprint `identification/05_structural_sections_blueprint.md:796`, register `masterplan/03_structural_sections_specs.md` (§1 PT-01..PT-09, §3, §9, §11, §12), prinsip D-139 (agen hanya mengirim konten).
Area review: semua berkas Studio masih untracked terhadap HEAD (`git status --short`: `?? src/lib/studio/`, `?? src/app/api/studio/`, `?? prisma/migrations/20261023200000_add_studio_structure/`, `?? prisma/seed-studio.ts`, `?? prisma/backfill-studio-structure.ts`). Karena itu `git diff HEAD --stat` hanya memuat 19 berkas lama yang berubah, dan delta struktur dibaca langsung dari berkasnya.

## Vonis keseluruhan: CHANGES REQUESTED

Ada 1 temuan High: gerbang by-construction ingest tidak berjalan pada jalur kiriman bab/slot dan sunting v2. Selain itu ada 8 temuan Medium dan 5 temuan Low. Temuan yang sudah tercatat di backlog atau register (IP-47, IP-55, F-062) tidak dilaporkan ulang sebagai temuan baru.

| Domain | Vonis | High | Medium | Low |
|---|---|---|---|---|
| Structure | CAUTION | 0 | 1 | 2 |
| Dependency Impact | FAIL | 1 | 2 | 0 |
| Duplication | CAUTION | 0 | 3 | 1 |
| Maintainability | CAUTION | 0 | 1 | 1 |
| Reference Integrity | CAUTION | 0 | 1 | 1 |

## Bukti segar sesi ini

| Pemeriksaan | Perintah | Hasil |
|---|---|---|
| tsc seluruh repo | `npx tsc --noEmit -p .` | `tsc_exit=0` |
| eslint area SR-55 | `npx eslint src/lib/studio/{services,contract,registry,params,engine/lint/structure,engine/tokens} src/app/api/studio prisma/seed-studio.ts prisma/backfill-studio-structure.ts` | `eslint_exit=0`, 0 keluaran |
| Penjaga migrasi (§3.4) | grep pada `migration.sql` | DROP 0; CREATE TABLE 9; CREATE TYPE 3; INDEX 30; ADD CONSTRAINT 20; ADD COLUMN 14; `WorkerTrace`/`IlSearchDoc`/`pg_trgm`/`"Role"` 0; ON DELETE sesuai tabel FK 1-20 (3 NO ACTION ke `StudioDocIdentity`, KD-07) |
| PT-02 / PT-06 (pindai statis skema) | skrip scratchpad `pt_scan.ts` (menelusuri `$ref` SID01-SID03 sampai `common/v2` dan `doc/v1`) | SID01 190 properti / 52 ref; SID02 162 / 39; SID03 106 / 31. Nama `params`/`overrides`/`essentials`/`advanced`/`roleFormats` = 0. Pola kunci parameter = 0. DF global ditemukan 1: `u` di `#DiagramSpecV2/properties/nodes/items` (lihat L1). Objek terbuka hanya `SID01/properties/x` (sesuai register §4.5 T2-46) |
| PT-07 | skrip `ess.ts` | 30 kenop (<= 60); global 8; terbanyak per jenis slot 7 (cover, chapter); kunci kenop yang tidak dikenal = 0 |
| PT-09 | `grep -rnE "11906\|16838\|A4_PORTRAIT_TW\|A4_MM" engine params/render.ts` | 0 kemunculan |
| IP-62 (skrip SR-35 dijalankan ulang) | `NODE_PATH=<repo>/node_modules npx tsx sr35_verify_docs.ts sr35b_completeness.json` | `SEMUA LULUS (32 PASS)`, exit 0, termasuk "kenop esensial panduan: 30/30" setelah tabel kunci kedua RQ-8 di §15 ditambahkan |
| Impor `services/render/pure` (IP-43a) | skrip `pure_probe.ts` | 0 modul prisma/dotenv di `require.cache`, tetapi `DATABASE_URL` sudah terisi lagi setelah impor. Artinya `.env` masih termuat; ini temuan yang sudah tercatat (IP-55), tidak dilaporkan ulang |
| Vitest struktur | `npx vitest run tests/unit/studio/structure tests/unit/studio/api-structure` | 1 berkas / 1 uji lulus (`zz_probe.test.ts`). Uji struktur masih dikerjakan SR-44/SR-45, jadi review ini tidak bertumpu pada cakupan uji |

## Vonis per modul

| Modul | Vonis | Ringkasan |
|---|---|---|
| Migrasi `20261023200000_add_studio_structure` | PASS | Semua penjaga §3.4 cocok persis. Aditif, tanpa objek non-Studio |
| Kontrak `contract/schema/v2/**`, `contract/types/v2/**` (§0) | CAUTION | PT-06 lulus. PT-02 punya 1 deviasi nama (`u` diagram, L1). `additionalProperties:false` konsisten. `forbidden.ts` memetakan DF/VF |
| Registri `params/**`, `registry/{slots,essentials}.ts` | PASS | PT-07 lulus. Lapis permukaan per ID. Aturan cakupan slot (`PARAM_SCOPE`) terpusat |
| `engine/tokens/**` turunan | PASS | PT-09 lulus, ukuran halaman satu sumber |
| `services/skeleton` | PASS | `checkTemplateWrite` menegakkan PRESET_READONLY, FORBIDDEN untuk templat terbatas, dan permukaan parameter. R19 menghitung `restricted` dari parameter efektif (`skeleton/repository.ts:284`) |
| `services/templates` (+ IP-43b) | PASS (1 Low) | Penolakan berbasis peran memakai FORBIDDEN dan K memakai PARAM_CLASS_K_FORBIDDEN (IP-43b). Templat terbatas ditolak lewat `assertTemplateUsable` (`index.ts:705`, `:1039`). Bendera `restricted:false` mati (L2) |
| `services/compose` | CAUTION | IP-66 berakar di `checkMeta`. Logika status slot dan urutan bab terduplikasi dengan completeness (M6). Ada dua allocator pid berbenih (L4) |
| `services/adapt-v1` | PASS (dibaca di titik integrasi) | Ditinjau lewat pemakai `ingest/v2.ts:620-660`: skema v2 diperiksa ulang atas hasil adaptasi, dan kunci `x.adaptReportV1` palsu dibuang (`v2.ts:545-553`) |
| `services/structure` | PASS | Penulisan baris salinan penuh, pensiun/revive M18 (`repository.ts:60-117`), penolakan tulis ganda, dan pembacaan deterministik |
| `services/completeness` | CAUTION | Benar terhadap §8.1, tetapi terduplikasi (M6) |
| `services/ingest` | CAUTION | Jembatan target lewat AsyncLocalStorage (IP-64, M1). Pada kiriman bertarget, gerbang memakai versi templat terbaru, bukan versi yang dipatok dokumen (M2) |
| `services/submit` | FAIL | Kiriman bab/slot dilayani tanpa gerbang by-construction (H1). Atribusi `lastFilledBy` diambil dari badan (M4). Kupas penanda trust terduplikasi dengan revisions v2 (M5) |
| `services/revisions` (v2) | FAIL | R16 dan R06 pada dokumen v2 tidak menjalankan by-construction, padahal jalur v1 menjalankannya (H1) |
| `services/render` (scope, pure IP-43a) | CAUTION | 409 DOCUMENT_INCOMPLETE ditegakkan di `revision.ts:45` dan `scope.ts:175`. Path draf aman (`naming.ts:92` `safeKey` + `paths.ts:134` resolve). `.env` termuat saat impor pure (IP-55, sudah tercatat) |
| `services/images`, `services/storage` | PASS | Tanpa temuan baru. Pola `missionFolder` masih menunggu IP-47 (sudah tercatat) |
| `engine/lint/structure/**` | PASS (1 Low) | Cek yang crash menjadi NOT_RUN beralasan (pola FIX-6) |
| Route `src/app/api/studio/**` (R01-R20) | CAUTION | 21 route, semuanya `force-dynamic` dan memakai sesi/caller. Ada 7 instance Ajv (M8). R05 memuat logika bisnis di route (L3). `submit-kit` terkait silang ke `validate/_shared` (L5) |
| `prisma/seed-studio.ts` (+ IP-43c) | PASS | Penjaga DB v21/_uji (`:106`, `:175`, `:915`). `REPO_ROOT` dihitung dari `__dirname` (`:110`, IP-43c). Flag dikunci (`:989-992`) |
| `prisma/backfill-studio-structure.ts` | PASS | Penjaga DB (`:84`, `:124-128`). Kunci advisory per dokumen. Rekonstruksi dicek sebelum commit (`:587-597`). Dry-run memakai rollback |

## Tabel temuan

| # | Tingkat | Domain | Berkas:baris | Temuan | Rekomendasi | Baris pemilik |
|---|---|---|---|---|---|---|
| H1 | High | Dependency Impact | `src/lib/studio/services/submit/pipeline.ts:611-665`; `services/revisions/index.ts:360-361` vs `:445`; `services/revisions/v2/commit.ts:151`; pembanding `services/ingest/v2.ts:490-497` | Gerbang ingest D-34 hanya dijalankan R04 (`runGate`: `byConstructionChecks` dengan 32 cek `blocksIngest`, `runLint(stage ingest)`, dan `renderFeasibilityBlockers`). Kiriman bab/slot (R12/R13 lewat `runSubmission`), sunting pid R16, dan PATCH alamat R06 pada dokumen v2 langsung melakukan `composeV2` lalu menulis revisi tanpa gerbang. Jalur v1 menjalankannya (`revisions/index.ts:445`), tetapi dokumen v2 dialihkan di `:360` ke `patchAddressV2` yang tidak menjalankannya. Akibatnya agen dapat melewati semua cek penolak cukup dengan mengirim per bab. Mekanisme templat terbatas (D-98, F-047) yang melindungi cek itu menjadi tak bermakna di jalur ini. Pelanggaran baru terlihat saat render (lint rilis, A10, tidak menahan berkas) atau sebagai job FAILED (pola F-053). Register ambigu: §11.1 butir 9 berlaku umum, tetapi baris R12/R13 di §12 tidak mencantumkan `BY_CONSTRUCTION_FAILED` | Jalankan `runGate` + `renderFeasibilityBlockers` atas snapshot hasil gabung (atau minimal atas bab/slot yang berubah) di `applyInLock` sebelum `tx.studioRevision.create`, dan di `commitV2Revision`. Kebijakan penegakan memakai `templateRestriction`/`isTrustedCaller` yang sama. Selaraskan register §12 R12/R13/R16 (422 `BY_CONSTRUCTION_FAILED`). Teruskan ke SR-57 sebagai temuan kebijakan keamanan yang harus disajikan ke user | SR-13 (submit), SR-14 (revisions v2), SR-01 (register §12) |
| M1 | Medium | Maintainability | `services/submit/targeting.ts:15-34`; `src/app/api/studio/documents/route.ts:319`; `services/ingest/v2.ts:579-581` | IP-64: `target`/`baseRevisionNo` R04 sampai ke `submitDocumentV2` lewat AsyncLocalStorage. Kopling implisit: jalur R08 validate/dryRun tidak menerima penargetan, sehingga pratinjau kelengkapan dihitung sebagai dokumen baru (terkait IP-51). Setiap pemanggilan `submitDocumentV2` di dalam konteks yang sama ikut mewarisinya. Urutan "argumen, lalu konteks, lalu badan" juga membuat medan badan kalah oleh konteks | Terapkan patch `delegation_progress/file_requests.md:218` (parameter eksplisit `submitTargeting` lewat `IngestOptions`/`V2Options`), lalu hapus `withDocV2Targeting`/`currentDocV2Targeting`. Sekalian tambahkan medan `target`/`baseRevisionNo` ke SID01 (`file_requests.md:216`) agar `splitDocV2Targeting` bisa dicabut |
| M2 | Medium | Dependency Impact | `services/ingest/v2.ts:563` (`pinTemplate(ctx, doc.template, ...)`) vs `services/submit/pipeline.ts:550-551` (`latest.templateVersionId`); `services/compose/merge.ts:214-216` | Pada kiriman R04 bertarget (D-232), ingest menjalankan gerbang, struktur, dan by-construction terhadap versi templat dari `doc.template`. Bila `version` tidak dikirim, yang dipakai adalah versi terbaru. Pipeline justru menyusun terhadap versi yang dipatok dokumen. `checkTemplate` hanya membandingkan slug bila versi tidak dikirim, sehingga gerbang dapat menilai dengan parameter dan kerangka yang berbeda dari render | Untuk kiriman bertarget, resolusikan templat dari patokan dokumen (atau tolak `TEMPLATE_MISMATCH` bila versi terbaru berbeda dari patokan), atau pindahkan gerbang ke pipeline (lihat H1) agar satu sumber |
| M3 | Medium | Reference Integrity | `services/compose/merge.ts:224-235` (`checkMeta`) | IP-66: setiap medan meta yang dikirim dan berbeda dari nilai dokumen menghasilkan 409 `META_CONFLICT`, termasuk bila nilai dokumen `null`/absen (`cur ?? null`). Karena SID01 mewajibkan `meta.title` (`doc.schema.ts:24-26`), kiriman R04 bertarget juga harus mengulang judul persis | Isi bila kosong: lewati konflik bila `cur` null/undefined, dan konflik hanya bila keduanya terisi dan berbeda. Medan yang diisi dicatat sebagai lingkup `meta` di `changeScope` dan ikut `merged.changed`. Medan yang dicerminkan kolom `StudioDocument` (`title`, `typeCode`, `language`, `classification`, `tier`, `docNumber`) jangan diisi diam-diam; tetap lewat `setMeta` atau perbarui kolomnya dalam transaksi yang sama. Terapkan cek dasar lingkup Meta (§9.2) bila `baseRevisionNo` dikirim |
| M4 | Medium | Reference Integrity | `services/submit/pipeline.ts:446`, dipakai di `:626-632` dan `:382` | `by = plan.body.agentId ?? caller.agentId ?? caller.requester`: `agentId` di badan (bebas diisi pemanggil, termasuk sesi USER) menjadi `lastFilledBy`, teks `change` otomatis, dan nama penulis di pesan `SCOPE_CONFLICT`. Ini membalik maksud FIX-1 S87 L-01/L-02 (`contract/auth.ts:16-19`: requester tidak diambil polos dari `agentId` badan). `createdBy` tetap benar | Pakai `caller.agentId` untuk INTERNAL_AGENT (sudah dinormalisasi) dan `caller.requester` untuk sesi. `agentId` badan hanya label tambahan yang dicatat terpisah. Masukkan ke cakupan SR-57 |
| M5 | Medium | Duplication | `services/submit/pipeline.ts:237-245` vs `services/revisions/v2/service.ts:201-208` | Logika keamanan "kupas penanda trust tersimpan untuk penulis tidak tepercaya" (D-134 R-01) ditulis dua kali. D-237 menyebut satu fungsi bersama `guardExistingDocumentWrite`, tetapi sunting v2 memakai salinan sendiri | Ekspor satu fungsi (mis. `services/ingest/trust.ts` `stripStoredTrustMarkers(source, caller, ctx)`) dan pakai di kedua jalur |
| M6 | Medium | Duplication | `services/completeness/compute.ts:31,81` vs `services/compose/snapshot.ts:71,79,90` vs `src/app/api/studio/documents/[id]/route.ts:177-186` | Status slot E29, urutan kunci bab (`compareChapterKeys`), dan kunci bab yang diharapkan dihitung di tiga tempat. Hasilnya sudah berbeda untuk slot berulang ber-`contentMode` AUTO/MIXED: completeness mengembalikan AUTO_READY lebih dulu, compose memeriksa bab lebih dulu. R05 juga punya `fallbackState` sendiri | Satu modul murni (completeness) menjadi sumber. Compose dan R05 mengimpornya. Tambah uji tabel §8.1 untuk kombinasi berulang x mode |
| M7 | Medium | Duplication | `services/submit/meta.ts:12` vs `services/ingest/meta.ts:19`; `app/api/studio/validate/_shared/v2-kit.ts:128` vs `services/ingest/v2.ts:342`; `app/api/studio/documents/route.ts:362` vs `services/render/scope.ts:141` | `jakartaDate`, `renderRefusedOf`, dan `revisionCompleteness` diduplikasi lintas layanan dan route | Satukan ke satu pemilik (submit/meta, render/scope) dan impor |
| M8 | Medium | Structure | `app/api/studio/chapters/_shared/submit-kit.ts:68`, `validate/_shared/v2-kit.ts:59`, `documents/[id]/structure/_lib/patch-body.ts:80`, `services/ingest/validate.ts:39`, `services/revisions/v2/body.ts:93`, `services/templates/v2.ts:54`, `services/templates/profile.ts:342` | Ada 7 instance `Ajv2020`. Masing-masing mengompilasi seluruh `STUDIO_SCHEMA_LOAD_ORDER`. Biaya memori dan waktu dingin berlipat, dan konfigurasinya bisa menyimpang (sumber tunggal `classifySchemaV2Errors` sudah ada di kontrak, tetapi kompilernya belum) | Kontrak mengekspor satu `studioAjv()` (lazy singleton) beserta `validatorFor(schemaId)`. Semua pemakai memakainya |
| L1 | Low | Reference Integrity | `contract/schema/diagram.schema.ts:43` (dipakai ulang di `contract/schema/v2/common.schema.ts:156`) | PT-02 (register §1) menuntut 0 properti bernama DF global di SID01-SID03. `nodes[].u` (angka diagram, sama namanya dengan DF-08 `u` underline) lolos. Mesin tidak membacanya (grep `engine/diagram` = 0) | Tambah pengecualian berlokasi di register §5.1 (DF-08 hanya RunProps) atau buang `u` dari `DiagramSpecV2` (tidak dipakai mesin) |
| L2 | Low | Maintainability | `services/templates/index.ts:635`, `:730`, `:953` | `assertWriteRights(..., { restricted: false, ... })` di-hardcode. Penolakan templat terbatas sebenarnya terjadi di `assertTemplateUsable` (`:705`, `:1039`), sehingga cabang `tpl.restricted` di `skeleton/access.ts:212` mati untuk R01/R02. Komentar route `templates/[id]/route.ts:21` menyiratkan sebaliknya | Hitung `templateRestriction(prev.resolvedParams).restricted` dan teruskan, atau hapus medan dari target. Satu jalur penolakan |
| L3 | Low | Structure | `app/api/studio/documents/[id]/route.ts:134-163`, `:177-186` | R05 menjalankan kueri Prisma struktur dan menurunkan status slot cadangan di route, padahal layanan `structure.readRows` sudah ada | Pindahkan ke layanan (`services/structure` atau `services/revisions/v2/tree.ts`) |
| L4 | Low | Duplication | `services/compose/pids.ts:23` vs `services/structure/pid.ts:110` (+ `:64` vs `compose/pids.ts:34`) | Dua `seededPidAllocator` dengan ordinal awal berbeda (1 vs 0) untuk rumus KD-22 yang sama. Pid bab bawaan juga berbeda: `structure` membuat `bab-<k>` huruf kecil, `compose` tidak. Saat ini aman karena kunci bab numerik, tetapi rentan menyimpang | Satu implementasi di `structure/pid.ts`, dan compose mengimpornya |
| L5 | Low | Structure | `app/api/studio/chapters/_shared/submit-kit.ts:41` | Route R12/R13 mengimpor `S55_BODY_OPTIONS`, `bodyAgentId`, `failFrom` dari `validate/_shared/route-kit.ts` (route lain). Sisa F-024/IP-08 | Pindahkan ketiganya ke `src/lib/studio/http` |

Catatan Low tambahan tanpa nomor (bukan cacat): `engine/lint/structure/index.ts:99-103` menelan stack galat cek menjadi NOT_RUN. Sesuai pola mesin murni (pemanggil mencatat), tetapi stack hilang. Pertimbangkan meneruskan `stack` di `details` lint.

## Uji prinsip §0 (D-139) di cakupan SR-55

| Uji | Vonis | Bukti |
|---|---|---|
| PT-02 | CAUTION | 1 deviasi nama (`u` diagram, L1). Objek terbuka `x` sesuai register T2-46; kunci `x` yang dibaca mesin (`lintEnforcement`, `benchmark`, `enforcement`) dikupas untuk pemanggil tidak tepercaya (`pipeline.ts:202-211`) |
| PT-06 | PASS | 0 `params`/`overrides`/`essentials`/`advanced`/`roleFormats`. 0 properti berpola kunci parameter di SID01-SID03 |
| PT-07 | PASS | 30 kenop, global 8, maks 7 per jenis slot |
| PT-09 | PASS | grep fallback A4 = 0 |
| Agen tidak mengirim parameter (§0 e) | PASS | v1 `overrides` hanya bermakna untuk `allow` tepercaya, dan hak K/T tetap diperiksa (`ingest/v2.ts:630-640`) |

## Item backlog

| Item | Penilaian | Rekomendasi |
|---|---|---|
| IP-56 | Terverifikasi tanpa pemakai. Ke-7 berkas `src/components/studio/revision/{edit-workspace,revision-viewer,revisions-workspace,block-editor,change-dialog,inline-editor,rerender-panel}.tsx` hanya saling mengimpor. Rute `app/studio/documents/[id]/edit/page.tsx` dan `.../revisions/page.tsx` adalah `redirect` (tidak merender komponen ini). Tidak ada impor dari `app/**` atau `tests/**`. Secara transitif, `revision/job-status.tsx` dan `revision/retry.tsx` juga hanya dipakai himpunan ini. `document-viewer/api.ts` hanya diimpor `document-viewer/feedback.tsx` dan `document-viewer/index.ts`. `feedback.tsx` dan `labels.ts` (document-viewer) hanya diimpor `index.ts`. `index.ts` (barrel) tidak diimpor siapa pun, dan komentar `index.ts:6-8` ("masih dipakai ... sampai migrasi FIX-4b") sudah basi sejak D-226. Yang tetap dipakai: `revision/{api,labels,diff-view,text-diff,route-error,index}.ts(x)` | Rekomendasi: HAPUS 7 berkas IP-56, ditambah 2 transitif (`job-status.tsx`, `retry.tsx`), ditambah `document-viewer/{api.ts,feedback.tsx,labels.ts}`, lalu pangkas ekspor mati di `document-viewer/index.ts` (atau hapus barrel itu). Total 12 berkas, sekitar 2.520 baris. KEPUTUSAN HAPUS MILIK USER (garis merah). Bila dipertahankan, tandai `@deprecated` dan keluarkan dari cakupan lint/glosarium |
| IP-57 | Terverifikasi. Dua adaptor bernama sama `toRailSummary` (`document-viewer/doc-model.ts:202-229`, `playground/rail-summary.ts:5-33`) masih membentuk medan `content` usang yang diterima `shared/completeness-rail.tsx:53` (`LegacyContentSummary`) | Rel menerima `CompletenessReportV2`/`CompletenessSummary` murni (semua slot berulang lewat `chapters`). Hapus kedua adaptor dan `LegacyContentSummary`. Pemilik area UI: SR-56/loop perbaikan |
| IP-62 | Dijalankan ulang di sesi ini: `SEMUA LULUS (32 PASS)`, exit 0. Parser §15 tetap mengenali 30/30 kenop `EK-` setelah tabel kunci RQ-8 ditambahkan | Tutup IP-62 (bukti di atas) |
| IP-64 | Lihat M1 | Terapkan patch `file_requests.md:218` |
| IP-66 | Lihat M3 | Isi bila kosong, dengan batasan untuk medan berkolom dokumen dan lingkup `meta` |

## Tantangan utama

1. **Satu gerbang atau tiga jalur?** Desain menempatkan gerbang by-construction di ingest (R04), sedangkan layanan submit dan revisions v2 dibangun terpisah. Bila D-131 ("kiriman parsial selalu diterima") dimaksudkan juga melonggarkan mutu, itu harus diputus eksplisit oleh controller dan user, karena F-047 dan D-98 menganggap cek penolak sebagai gerbang kebijakan. Bila tidak, H1 harus diperbaiki sebelum SR-58.
2. **Gerbang ingest pada kiriman bertarget menilai kiriman parsial di atas kerangka kosong** (`v2.ts:442-454`) dengan versi templat yang mungkin berbeda (M2). Pertanyaannya: apakah gerbang seharusnya pindah ke pipeline setelah penggabungan, satu sumber untuk R04, R12, R13, dan R16?
3. **Atribusi penulis** (`lastFilledBy`) kini tampil di kelengkapan yang dibaca controller. Mengambilnya dari badan memungkinkan penyamaran identitas di jejak yang dianggap tepercaya (M4).

## Temuan positif

- Migrasi persis sesuai register: 9/3/30/20/14, 0 DROP, NO ACTION KD-07.
- Konkurensi rapi: urutan kunci tetap `studio-mdoc` lalu `studio-docno` lalu `studio-doc` (`lock.ts:75-104`, `docnumber.ts:43-51`). Balapan pembuatan diulang sekali (`lock.ts:135-141`). Cek dasar per lingkup melaporkan `conflictingScopes` (`pipeline.ts:316-392`).
- Gerbang trust tulis-ke-dokumen-ada disatukan untuk dokumen, bab, dan slot (`pipeline.ts:222-230`, F-064).
- Repositori struktur memvalidasi baris sebelum menulis, menolak revisi yang sudah berbaris, dan menegakkan pid pensiun (`repository.ts:90-97`, `:143-144`).
- Backfill dan seed dijaga nama DB, transaksional, punya dry-run rollback, dan memeriksa rekonstruksi sebelum commit.
- Kontrak v2 konsisten `additionalProperties:false`, dan pemetaan galat DISPLAY_FIELD/V1_FIELD berasal dari satu sumber (`forbidden.ts`).
- Pembungkus R12/R13 tipis (21-26 baris) dan memakai satu kit, dengan urutan evaluasi §11.1 tertulis (`submit-kit.ts:6-17`).

## Berkas yang benar-benar dibaca

- Migrasi: `prisma/migrations/20261023200000_add_studio_structure/migration.sql` (penjaga grep + FK).
- Kontrak: `contract/schema/v2/{doc,chapter,slot,skeleton}.schema.ts` (penuh), `common.schema.ts:1-60,148-175,440-470`, `forbidden.ts:1-80`, `contract/schema/doc.schema.ts:113-176`, `contract/schema/diagram.schema.ts:30-60`, `contract/types/diagram.ts:15-30`, `contract/auth.ts:10-132`, `contract/index.ts:35-52`.
- Registri: `registry/essentials.ts:29-181,566-595` (+ eksekusi), `registry/slots.ts` (ekspor).
- Layanan: `submit/{pipeline,lock,docnumber,meta,target,targeting,index}.ts` (penuh); `ingest/v2.ts:380-680`; `compose/merge.ts:195-300`, `compose/register.ts`, `compose/pids.ts`, `compose/snapshot.ts:71-115`; `completeness/compute.ts:31-110`; `structure/repository.ts:60-396`, `structure/pid.ts:58-136`; `revisions/v2/service.ts` (grep + `:150-215`), `revisions/v2/commit.ts` (grep), `revisions/index.ts:44,360-361,445`; `templates/access.ts` (penuh), `templates/index.ts:295-298,385-390,600-735,855-1060`; `skeleton/access.ts:199-229`, `skeleton/repository.ts:225-290`; `render/{scope,revision,naming,index}.ts` (grep), `storage/paths.ts:134`; `engine/lint/structure/index.ts:92-140`; `engine/lint/scan/index.ts:212-224`; `ingest/gate.ts:91-120`; `ingest/trust.ts:63-80`.
- Route: `chapters/route.ts`, `slots/route.ts`, `chapters/_shared/submit-kit.ts` (penuh); `documents/route.ts:270-400`; `documents/[id]/route.ts:130-200`; `templates/[id]/route.ts` (grep); 21 `route.ts` (audit `force-dynamic` + sesi).
- Skrip: `prisma/backfill-studio-structure.ts:80-130,500-620`; `prisma/seed-studio.ts` (grep penjaga dan flag).
- UI (khusus item backlog): `components/studio/revision/*` (graf impor), `components/studio/document-viewer/{index,api,feedback,labels,doc-model}.ts(x)`, `playground/rail-summary.ts`, `shared/completeness-rail.tsx:19-56`, `app/studio/documents/[id]/{edit,revisions,revisions/[rev]}/page.tsx`.
- Dokumen: brief fase akhir, blueprint 05 (§0, §1, SR-55), register 03 (§1-§3, §9-§12), `integration_backlog.md`, `findings_register.md`, `decisions.md` (D-226, D-229, D-237, D-238), `file_requests.md:216-218`, `gateway_check/07_refactor_complete_gate.md:1-60`.

Skrip pemeriksa (scratchpad, di luar repo): `pt_scan.ts`, `ess.ts`, `ess2.ts`, `pure_probe.ts`, `sr35_verify_docs.ts`, `tsc.txt`, `eslint.txt`.
