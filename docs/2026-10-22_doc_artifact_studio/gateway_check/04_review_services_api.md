# 04 Review Kode — Kontrak, Layanan, API, Migrasi, Seed (S85)

| Medan | Nilai |
|---|---|
| Baris | S85 (gateway_check, fase final) |
| Agen | senior-code-reviewer (tier R) |
| Skill | code-review-senior |
| Tanggal | 2026-10-23 |
| Repo | `C:\Users\TRIAL\gsp-swarm-hq-v2.1`, branch `v2.1`, berkas kerja belum di-commit (review terhadap working tree) |
| Batas | Tanpa perubahan kode, tanpa tulis DB. Hanya perintah baca: `git status/diff`, `npx prisma validate`, `npx tsc --noEmit -p .` |

## 1. Ringkasan

**Vonis keseluruhan: APPROVED WITH COMMENTS.** Ada 0 temuan High, 9 Medium, dan 13 Low (22 total), ditambah 5 catatan INFO untuk S87. Predikat kepercayaan `isTrustedCaller` sudah benar-benar satu sumber untuk ingest, validate, templat terbatas, dan gerbang HTML artefak. Migrasi aditif dan seed idempoten.

Celah yang tersisa ada di **jalur revisi (PATCH)**. Jalur ini (a) mewarisi penanda benchmark/override tersimpan untuk pemanggil yang tidak tepercaya, (b) menghitung penegakan tanpa override dokumen sehingga berbeda dari ingest, dan (c) tidak menjalankan cek kelayakan render turunan. Temuan **F-053 ternyata lebih luas** daripada rumusan di register: penyebabnya adalah ketidakcocokan antara gerbang ingest dan prasyarat renderer, dan berlaku untuk semua pemanggil serta untuk PATCH, bukan hanya untuk "ADMIN + override".

Bukti segar sesi ini:
- `npx tsc --noEmit -p .` keluar 0 tanpa keluaran galat.
- `npx prisma validate` mencetak "The schema at prisma\schema.prisma is valid".
- `git diff --stat prisma/schema.prisma` mencetak "337 insertions(+)" dan 0 baris dihapus.
- `migration.sql` add_studio: `CREATE TABLE` = 9, `CREATE TYPE` = 11, `DROP` = 0. Tidak ada objek `CREATE/INDEX/TYPE` tanpa awalan `"Studio`.
- Migrasi `worker_trace_baseline` hanya berisi `CREATE TABLE IF NOT EXISTS` dan `CREATE INDEX IF NOT EXISTS`, tanpa DROP.

## 2. Vonis per domain

| Domain | Vonis | High | Medium | Low |
|---|---|---|---|---|
| Structure | CAUTION | 0 | 1 | 4 |
| Dependency Impact | CAUTION | 0 | 4 | 1 |
| Duplication | CAUTION | 0 | 2 | 3 |
| Maintainability | CAUTION | 0 | 1 | 3 |
| Reference Integrity | CAUTION | 0 | 1 | 2 |

## 3. Vonis per modul

| Modul | Vonis | Temuan | Catatan |
|---|---|---|---|
| `contract/**` | PASS | R-12 (Low, lintas modul) | `getStudioCaller` fail-closed tanpa `INTERNAL_API_SECRET` (`contract/auth.ts` fungsi `internalSecretMatches`), urutan sesi sesuai §6.1 |
| `params/**` | PASS (cakupan antarmuka) | — | Hanya dibaca lewat pemakaian (`ALL_PARAMS`, `PARAMS_BY_KEY`), tidak di-review per baris |
| `registry/**` | CAUTION | R-20 | Berkas nyasar `registry/0` |
| `engine/tokens/**` | PASS (cakupan hak override) | — | `assertOverrideRights`/`checkOverrideRights` konsisten (urutan K, T, unknown) |
| `engine/bind/**` | CAUTION | R-07 | Predikat penanda benchmark bercabang (bind vs lint/scan vs trust) |
| `engine/lint/**` | CAUTION | R-01, R-07 | `byConstructionChecks` mengembalikan `[]` untuk dokumen benchmark, termasuk cek integritas, dan dipakai PATCH |
| `services/ingest/**` | CAUTION | R-03, R-09, R-10, R-15, R-19, R-21 | Akar F-053 ada di `bindRegister` |
| `services/revisions/**` | CAUTION | R-01, R-02, R-03, R-04 | Area paling berisiko di lingkup ini |
| `services/render/**` | CAUTION | R-04, R-11, R-16 | Siklus job baik; kunci RENDER_IN_PROGRESS diduplikasi tanpa jendela basi |
| `services/templates/**` | CAUTION | R-05, R-12, R-13, R-17 | Kunci optimistik versi baik |
| `http/**` | PASS | R-09 (lintas) | Pemetaan galat terpusat, tanpa stack ke respons (`http/errors.ts:54-86`) |
| `src/app/api/studio/**` | CAUTION | R-05, R-06, R-08, R-11, R-14, R-15, R-18 | INT-U benar: gerbang berjalan sebelum baris artefak dibuat |
| `prisma/schema.prisma` | PASS | — | Aditif murni (+337/-0); `prisma validate` lolos |
| `prisma/migrations/20261022120000_add_studio` | PASS | — | 9 tabel, 11 tipe, 0 DROP, semua objek `Studio*` |
| `prisma/migrations/20261023150000_worker_trace_baseline` | PASS | INFO-5 | `IF NOT EXISTS`, 0 DROP; D-21 dipatuhi |
| `prisma/seed-studio.ts` | PASS | R-22 | Penjaga nama DB (`seed-studio.ts:62-67`), upsert idempoten, `--refresh-v1` ditolak eksplisit |

## 4. Tabel temuan

Tingkat: High = FAIL, Medium = CAUTION, Low = minor. Kolom "S87" bernilai **Ya** bila temuan perlu dibawa ke review keamanan S87.

| # | Tingkat | Domain | Berkas:baris | Deskripsi dan bukti | Baris pemilik | Usulan | S87 |
|---|---|---|---|---|---|---|---|
| R-01 | Medium | Dependency Impact | `services/revisions/index.ts:340`, `:367`, `:370`; `engine/lint/scan/index.ts:218-219`; `engine/lint/scan/enforcement.ts:35-39`, `:88` (structure) | PATCH menyalin `baseSnap.doc` utuh (`cloneJson(baseSnap.doc)`), termasuk `x.benchmark`, `x.enforcement`, dan `x.lintEnforcement` yang disimpan saat ingest ADMIN. Pemanggil yang tidak tepercaya (USER/GOOGLE/INTERNAL_AGENT) lalu menyunting dokumen itu. Akibatnya `byConstructionChecks(nextDoc, tpl)` mengembalikan `[]`, sebab `if (policy.benchmark) return []`, termasuk G1/DATUM-11. Pada render, `isVerbatimReproduction` juga menerima turunan tanpa `result()` di konten baru dari pemanggil tidak tepercaya. Prasyarat: dokumen di-ingest ADMIN dengan penanda pada templat yang **tidak** terbatas (D-90: benchmark + penanda sah pada kanonik v3). `assertTemplateUsable` (`:367`) hanya menahan templat terbatas. D-98 butir (2) "kepercayaan melekat saat ingest" tidak mempertimbangkan bahwa PATCH membawa konten baru dari pemanggil lain. | S50 / INT-M (revisi), S44 / INT-C (lint scan) | Di `patchBlock`, untuk `!isTrustedCaller(caller)`, terapkan pilihan (a) atau (b). (a) Evaluasi gerbang atas salinan `nextDoc` tanpa penanda: `stripBenchmarkMarkers` + `stripEnforcementOverride`, lalu `byConstructionChecks` terhadap salinan itu. Snapshot boleh tetap menyimpan penanda agar render blok lama identik. (b) Tolak 403 PATCH dokumen bertanda oleh pemanggil tidak tepercaya. Mana pun yang dipilih, catat sebagai revisi D-98. | **Ya** |
| R-02 | Medium | Dependency Impact | `services/revisions/index.ts:362`, `:367`, `:370` vs `services/ingest/index.ts:302-305`, `:339`; `services/render/common.ts:108-120` | Penegakan dihitung dengan dua semantik. Ingest menerapkan `applyDocOverrides`, sehingga `doc.overrides["lint.enforcementOverride"]` (kelas K, ADMIN) ikut ke `ingestPolicy` dan `guardTemplate`. PATCH memakai templat terpin **tanpa** override dokumen, sementara render memakainya lagi (`templateForDoc`). Dampaknya: dokumen ADMIN yang lolos ingest berkat override dokumen akan 422 pada setiap PATCH, termasuk PATCH oleh ADMIN sendiri. Status terbatas di PATCH juga mengabaikan pelepasan pada tingkat dokumen. | S50 (revisi) | Di `patchBlock`, pakai `applyDocOverrides(tpl, nextDoc)`, persis seperti ingest, sebelum `assertTemplateUsable` dan `byConstructionChecks`. Lebih baik lagi: satu fungsi bersama "templat efektif + gerbang" di `services/ingest`, dipakai ingest, PATCH, dan artefak. |
| R-03 | Medium | Reference Integrity | `services/ingest/checks.ts:147-148`; `registry/lint.ts:403` (D03 `blocksIngest=false`); `engine/html/tables/derivation.ts:26-34`, `:113-114`; `engine/docx/figures/derivation.ts:71-80`, `:296`; `services/revisions/index.ts:353-383` | **F-053 diperluas (menantang rumusan register).** Gerbang ingest menurunkan `BindDefect` dari `buildDerivationBlock` (contohnya turunan tanpa `result()`) menjadi D03: REPORT di NOTA/TERBIT, FAIL tetapi tidak menahan di SERAH. Renderer DOCX dan HTML sebaliknya **selalu** melempar `BY_CONSTRUCTION_FAILED` untuk turunan yang sama, kecuali `isVerbatimReproduction`. Hasilnya: semua pemanggil (USER juga, tanpa override) mendapat 201 lalu job FAILED. Validate mengembalikan `valid:true` dengan `previewError`. PATCH tidak memanggil `bindRegister` sama sekali, jadi revisi yang pasti gagal dirender tetap ter-commit (D-54: render gagal tidak membatalkan revisi). Kasus "ADMIN + override" di `coder_execution_int_u.md:16` hanyalah satu instans. | S48 / INT-M (ingest checks); S50 (revisi). **Bukan** pemilik `services/render` + `engine/html` seperti tercatat di F-053 | Tambahkan cek kelayakan render di gerbang ingest: bila `!isVerbatimReproduction(doc, d)` dan `buildDerivationBlock` melempar `BindDefect`, catat sebagai penahan **integritas**. Perlakuannya sama dengan G1/DATUM-11 (`INTEGRITY_CHECKS`): tidak dapat dilepas override, 422 `BY_CONSTRUCTION_FAILED`. Sertakan juga syarat id turunan DOCX (`docx/figures/derivation.ts:73-74`). Panggil gerbang yang sama di `patchBlock`. Mutakhirkan baris pemilik F-053 di register. |
| R-04 | Medium | Dependency Impact | `services/revisions/index.ts:489-493` vs `services/render/job.ts:127-136` | Ada dua penjaga RENDER_IN_PROGRESS dengan semantik berbeda. `createRenderJob` mengabaikan job QUEUED/RUNNING yang lebih tua dari C08 (`queuedAt >= now - STUDIO_RENDER_JOB_TIMEOUT_MS`). `rerenderRevision` memeriksa ulang **tanpa** jendela basi. Bila proses mati di tengah render, job tetap RUNNING selamanya dan R07 POST membalas 409 untuk selamanya, padahal `createRenderJob` sendiri akan mengizinkan render. | S50 (revisi) / S51 (job) | Hapus cek lokal di `rerenderRevision` dan andalkan `createRenderJob`, yang melempar kode yang sama. Bisa juga ekspor satu fungsi `findActiveRenderJob(target)` dari `job.ts`. |
| R-05 | Medium | Dependency Impact | `src/app/api/studio/templates/[id]/route.ts:72` vs `services/templates/index.ts:532` | Route memanggil `assertOverridesAllowed(input.overrides, caller)` atas **seluruh** override, sedangkan layanan sengaja hanya memeriksa kunci yang berubah (D-62: "cek kelas K hanya pada kunci yang berubah"). UI menyimpan seluruh override versi (D-73, D-76). Akibatnya USER tidak bisa menyimpan versi baru (misalnya hanya `sectionPlan`) untuk templat non-kanonik yang pernah diberi override K oleh ADMIN: 403 `PARAM_CLASS_K_FORBIDDEN`. Logika "changed only" di layanan menjadi kode mati untuk non-ADMIN. | S54 / INT-E (route templat) | Di route R02, validasi hanya **nilai** override (`validateParamValue`) dan serahkan hak K/T sepenuhnya ke layanan (`changedOverrides`). R01 POST boleh tetap memeriksa penuh karena versi 1 tidak punya pembanding. |
| R-06 | Medium | Duplication | `src/app/api/studio/validate/_shared/route-kit.ts:56-78` = `services/ingest/repository.ts:96-118`; `route-kit.ts:80-97` = `services/revisions/rows.ts:63-81` | Pemeta DTO `DocumentSummary` dan `RevisionSummary` disalin persis, medan demi medan. Route `documents/**` mengimpor salinan route-kit, sedangkan layanan memakai salinannya sendiri. Bila kontrak bertambah medan, keduanya akan menyimpang. Route-kit juga masih berada di `validate/_shared/` dan diimpor lintas route (`documents/route.ts:38`, `documents/[id]/route.ts:21`), padahal D-60 menandainya untuk dipindah ke `src/lib/studio/`. | INT-E (http) / S55 | Satu sumber DTO di `services/revisions/rows.ts` (atau `contract`-adjacent `services/dto.ts`); route-kit cukup re-export. Pindahkan sisa route-kit ke `src/lib/studio/http`. |
| R-07 | Medium | Structure | `engine/lint/scan/enforcement.ts:35-39` (`isBenchmarkDoc`: `x.enforcement==="report"` atau `x.benchmark`); `engine/bind/reproduction.ts:31-36` (`hasBenchmarkMarker`: hanya `x.benchmark`); `services/ingest/trust.ts:41` (`BENCHMARK_MARKER_KEYS = ["benchmark","enforcement"]`) | Ada tiga definisi "dokumen benchmark" yang tidak identik. Dokumen ADMIN dengan **hanya** `x.enforcement:"report"` membuat penahan diturunkan D-34 sehingga ingest lolos, tetapi turunan verbatimnya ditolak renderer (instans F-053 lain). INT-M memutus bahwa `x.enforcement` diperlakukan sebagai penanda benchmark, tetapi keputusan itu hanya diterapkan di sisi pembuangan (`trust.ts`), tidak di predikat bind. | INT-M (engine/bind + trust) / INT-C (scan) | Satu predikat `isBenchmarkDoc` di `engine/bind/reproduction.ts` yang dipakai lint/scan, trust (daftar kunci diturunkan dari predikat yang sama), dan renderer. Sebaliknya, bila diputus bahwa `x.enforcement` **tidak** membuka reproduksi verbatim, dokumentasikan sebagai keputusan dan perkuat R-03. |
| R-08 | Medium | Duplication | `services/ingest/util.ts:17-33`; `services/revisions/canonical.ts:7-29`; `services/templates/profile.ts:66-78`; `src/app/api/studio/artifacts/_lib/prepare.ts:80-92` | Ada empat implementasi `stableStringify`/`sha256Hex`, padahal hasilnya **disimpan** sebagai `inputSha256`/`snapshotSha256` (r1 lewat ingest, r2+ lewat revisions), `paramsSha256`, dan `specSha256`. Untuk data JSON murni keluarannya kini setara. Bedanya ada di penanganan nilai fungsi: `profile.ts` menulis `null`, `util.ts` membuang kunci. Perbandingan `identical`/digest lintas jalur bergantung pada kesetaraan yang tidak dijaga uji. | S48 / S49 / S50 / S57 | Satu modul JSON kanonik (mis. `services/ingest/util.ts` atau `contract` netral) dipakai keempat lokasi, plus satu uji kesetaraan. |
| R-09 | Medium | Maintainability | `src/app/api/studio/documents/route.ts:104-106` | Fallback `errorCodeOf` untuk galat render tak bertipe di route adalah `BY_CONSTRUCTION_FAILED`, sedangkan layanan render memakai `RENDER_FAILED` (`services/render/common.ts:29-31`; kode d1, D-69). Galat Prisma atau infrastruktur saat `renderRevision` akan dilaporkan ke agent sebagai pelanggaran by-construction, sehingga diagnosis agent menyimpang. | S55 / INT-E | Pakai `errorCodeOf(err, "RENDER_FAILED")` dari `services/render/common`. |
| R-10 | Low | Dependency Impact | `services/ingest/repository.ts:142-149`, `:34-37` | Kunci advisory lock dan kueri maks memakai `typeCode` + tahun, sedangkan pola nomor diambil dari parameter templat `doc.number` yang hanya wajib memuat `{urut}`. Pola tanpa `{kodeJenis}`/`{tahun}` membuat dua jenis berbagi ruang nomor tetapi memakai kunci berbeda, sehingga P2002 berakhir 409 `DOC_NUMBER_EXISTS` untuk nomor yang tidak dipilih agent. `details.docNumber` juga `null` pada jalur SEQUENCE (`:203`). | S48 | Turunkan kunci lock dari bagian pola yang benar-benar ada, atau wajibkan `{kodeJenis}` dan `{tahun}` di validasi `doc.number`. Kembalikan nomor terhitung di `details`. |
| R-11 | Low | Structure | `services/render/artifact.ts:110` + `src/app/api/studio/artifacts/_lib/prepare.ts:231-233`; `src/app/api/studio/artifacts/route.ts:104-128` | `gateHtmlArtifact` (ingest dryRun penuh, termasuk resolusi aset) berjalan **dua kali** per POST R09: di prepare dan lagi di `renderArtifactImpl`. Bila putusan berubah di antaranya (mis. templat menjadi terbatas), baris `StudioArtifact` sudah tercipta tanpa job dan respons 403/422, sehingga muncul baris yatim. | S57 / INT-U, S51 | Teruskan hasil gerbang dari prepare ke `renderArtifact` (opsi `gate`) dan jalankan gerbang di render hanya bila tidak diberikan. Jendela yatim pun hilang. |
| R-12 | Low | Structure | `services/templates/index.ts:518`; `src/app/api/studio/templates/route.ts:80`; `src/app/api/studio/render-env/route.ts:90`; `contract/auth.ts:74`, `:81` | Selain `isTrustedCaller`, ada predikat "admin" literal `caller.kind === "ADMIN_SESSION"` di empat tempat ditambah medan `canWriteClassK`. Ini bukan bug, tetapi menyimpang dari prinsip satu sumber yang ditetapkan D-102. | INT-P (access) | Ekspor `isAdminCaller(caller)` di `services/templates/access.ts` (tanpa `trustedHarness`) dan pakai di keempat lokasi. |
| R-13 | Low | Reference Integrity | `services/templates/index.ts:518-519`, `:725-726`; `src/app/api/studio/templates/route.ts:81` | Penolakan berbasis **peran** (ubah kanonik, impor profil oleh non-ADMIN) memakai `PARAM_CLASS_K_FORBIDDEN`, padahal delta d2 menambah `FORBIDDEN` untuk "sesi sah tetapi peran tidak berhak atas aksi" (specs §6.3 revisi d2). | S54 / INT-D | Pakai `FORBIDDEN`; `PARAM_CLASS_K_FORBIDDEN` hanya untuk penulisan kunci kelas K. |
| R-14 | Low | Maintainability | `src/app/api/studio/documents/route.ts:126-136` | Cabang `if (!result.valid)` mati. `ingestDocument` dengan `dryRun:false` selalu **melempar** untuk masukan tidak sah (`services/ingest/index.ts:208-212`); `invalidResult` hanya untuk dryRun. | S55 | Hapus cabang itu, atau ganti dengan assertion. |
| R-15 | Low | Duplication | `src/app/api/studio/documents/[id]/blocks/[address]/route.ts:65-67` (`isPlainObject` lokal) vs `http/validation.ts:8-12`; route `:84-139` vs `services/revisions/index.ts:141-170` | Helper lokal mengulang helper bersama. Validasi PATCH juga ditulis dua kali (route dan layanan) dengan aturan berbeda: route membatasi 4.000 karakter (D-57), layanan tidak. Pemanggil layanan non-route lolos tanpa batas. | S56 / INT-E | Impor `isPlainObject` dari `@/lib/studio/http`. Pindahkan batas `CHANGE_FIELD_MAX` ke `requireChange` di layanan agar route cukup memetakan. |
| R-16 | Low | Duplication | `services/ingest/log.ts:9-46`; `services/revisions/log.ts:9-46`; `services/templates/log.ts:10-49`; `services/storage/log.ts:16-54`; `http/log.ts:13-57` | Lima sink JSONL harian yang hampir identik (mkdir + appendFile + sink uji). F-024 hanya menyatukan helper route. | INT-E (pasca-v2.1) | Satu `createJsonlLog(source, prefix)` di `src/lib/studio/http/log.ts` (atau `services/log.ts`). |
| R-17 | Low | Maintainability | `services/templates/index.ts:628` | String `description` profil kanonik masih berbunyi "katalog 673 + renderer 25", padahal D-111 mencatat 685 + 35. String ini **ditulis ke DB** pada DB baru, dan D-111 hanya memperbaiki tiga komentar. | S49 / INT-V | Turunkan dari `CATALOG_PARAM_COUNT` dan jumlah parameter kontrak saat runtime. |
| R-18 | Low | Reference Integrity | `src/app/api/studio/documents/[id]/revisions/route.ts:91-93` vs `src/app/api/studio/artifacts/_lib/request.ts:153-165` vs `contract/schema/doc.schema.ts:146-147` | Casing `formats` masih belum seragam (D-80 mengalihkannya ke S85). R04 hanya menerima huruf kecil (enum skema), R07 hanya huruf besar persis (`"pdf"` ditolak 400), R09 tidak peka huruf (`toUpperCase`). | S56 / INT-E | R07 terima tanpa peka huruf lewat `normalizeFormats` lalu validasi enum, sama seperti R09. Dokumentasikan di API-REFERENCE. |
| R-19 | Low | Maintainability | `services/ingest/index.ts:116-121` vs `src/app/api/studio/validate/route.ts:144` | Komentar `IngestOptions.template` menyatakan "route tidak meneruskannya", padahal R08 meneruskan `template: draftTpl` (roleFormats draf). Gerbang tetap aman karena `guardTemplate` memeriksa `opts.template`, tetapi kontraknya menyesatkan. | S48 | Perbarui komentar: "route validate meneruskan templat draf; gerbang terbatas tetap berlaku". |
| R-20 | Low | Structure | `src/lib/studio/registry/0` (0 byte, `ls -la` 2026-10-23 01:19) | Berkas kosong bernama `0` di folder registri. Kemungkinan besar sisa pengalihan shell (`>0`/`2>0`) oleh agen. Berkas akan ikut ter-commit bersama `src/lib/studio/`. | Controller (area registri S03/S09/S10; hapus butuh keputusan karena berkas tak diminta) | Hapus sebelum commit (`git status` menunjukkannya sebagai bagian folder untracked). |
| R-21 | Low | Structure | `services/ingest/repository.ts:120-124` | `isUniqueViolation` mengembalikan `true` bila `meta.target` bukan array/string (`: true`), sehingga P2002 tak terkait (mis. indeks unik `StudioBlock`) dipetakan menjadi `DOC_NUMBER_EXISTS`. | S48 | Kembalikan `false` untuk target tak dikenal (sama dengan `route-kit.ts:31-38`). |
| R-22 | Low | Maintainability | `prisma/seed-studio.ts:73-89`, `:37`, `:101` | Upsert section type tidak menandai atau menghapus `key` yang sudah keluar dari registri (idempoten, tetapi tidak konvergen). Path profil relatif `cwd` membuat `--import-benchmark` gagal ENOENT bila tidak dijalankan dari akar repo. | S70 / INT-I | Laporkan baris DB yang tidak ada di registri (tanpa hapus, sesuai KD-02). Resolusikan path dari `__dirname`/`import.meta.url`. |

## 5. Catatan untuk S87 (keamanan; tidak dihitung sebagai temuan kode di atas)

| # | Berkas:baris | Catatan |
|---|---|---|
| R-01 | lihat tabel | **Utama.** Pewarisan penanda/override oleh pemanggil tidak tepercaya lewat PATCH. Ini menantang D-98 butir (2). |
| INFO-1 | `services/revisions/index.ts:475-505`; `services/render/artifact.ts:385-391` | Render ulang revisi (R07 POST) dan HTML artefak bersumber `document` tidak memeriksa templat terbatas milik **dokumen sumber**; HTML artefak hanya memeriksa templat artefak. Konsisten dengan "kepercayaan melekat saat ingest" karena tidak ada konten baru. S87 perlu mengukuhkan atau menolak. |
| INFO-2 | `contract/auth.ts` (`getStudioCaller`, `requester = getRequester(req, agentId)`) | `agentId` dari badan menentukan `createdBy`/`requester` untuk INTERNAL_AGENT. Atribusinya dapat dipalsukan oleh pemegang `x-internal-secret`; tidak berdampak pada hak. |
| INFO-3 | §6.1 spesifikasi; semua route `documents/**` | Tidak ada kepemilikan per dokumen: sesi sah apa pun dapat membaca, mem-PATCH, atau merender dokumen siapa pun. Ini sesuai desain spesifikasi, bukan defek, tetapi relevan untuk model ancaman. |
| INFO-4 | `src/app/api/studio/files/_lib/serve.ts:95-97` | `Content-Type` R10 diturunkan dari ekstensi `fileName` (daftar tertutup), bukan dari `mime` DB seperti tertulis di §6.2. Ini lebih aman (nama dibangkitkan server, CSP + nosniff), tetapi menyimpang dari teks kontrak dan perlu dicatat. |
| INFO-5 | `prisma/migrations/20261023150000_worker_trace_baseline/migration.sql:19` | Di DB lain (produksi) yang punya indeks `task_id` bernama berbeda, `CREATE INDEX IF NOT EXISTS` akan membuat indeks ganda. Gunakan `migrate resolve --applied` seperti di v21 (D-103). |

## 6. Key challenges (menantang keputusan yang sudah diambil)

1. **D-98 butir (2): "penanda tersimpan dari ingest ADMIN tetap berlaku untuk revisi/render berikutnya".** Kepercayaan diikatkan pada *dokumen*, padahal yang dinilai seharusnya *pembuat konten*. PATCH (`services/revisions/index.ts:340`) membuat konten baru atas nama pemanggil lain, sehingga pelonggaran D-34 dan reproduksi verbatim ikut berlaku untuk konten itu. Untuk render ulang (INFO-1) putusan ini masuk akal; untuk PATCH tidak (R-01).
2. **F-053: pemilik dan cakupan.** Register menyebut akarnya "ADMIN + override" dan menunjuk pemilik `services/render` + `engine/html`. Bukti menunjukkan akarnya di `services/ingest/checks.ts:147-148` (D03 tidak menahan) dan PATCH yang tidak menjalankan bind. Memperbaiki renderer agar "lebih toleran" akan melanggar D-91. Yang benar adalah memajukan prasyarat renderer ke gerbang (R-03).
3. **D-62 vs route R02.** Keputusan "cek K hanya kunci berubah" diterima, tetapi route membatalkannya (R-05). Uji S74/S80 perlu kasus USER yang menyimpan templat ber-override K milik ADMIN.
4. **D-60/D-99 (F-024 SELESAI).** Helper route sudah disatukan, tetapi DTO, hash kanonik, dan sink log di lapisan layanan masih berlipat (R-06, R-08, R-16). F-024 tepat ditutup untuk route, tetapi duplikasi lapisan layanan belum punya butir register.
5. **D-21.** Dipatuhi. Kedua migrasi tanpa DROP; `worker_trace_baseline` idempoten. Tidak ada tantangan.

## 7. Temuan positif

- `isTrustedCaller` (`services/templates/access.ts:40-42`) benar-benar satu sumber untuk empat gerbang: pembuangan penanda ingest (`services/ingest/trust.ts:48-50` lewat `isBenchmarkTrusted`), templat terbatas (`access.ts:61`), gerbang HTML artefak (`services/render/artifact.ts:339`), dan validate (lewat ingest). `trustedHarness` tidak muncul di `src/app/**` (grep sesi ini: 0 kemunculan), sesuai D-98.
- Status terbatas **dihitung** dari `resolvedParams` setiap kali, bukan flag tersimpan (`access.ts:45-48`). Pewarisan rantai `baseVersionId` dengan sendirinya ikut terbatas, sehingga USER tidak bisa "menurunkan" templat terbatas menjadi terbuka.
- Konkurensi optimistik ditegakkan di transaksi: revisi lewat `updateMany where currentRevisionNo` + P2002 menjadi 409 (`services/revisions/index.ts:399-430`); versi templat lewat `updateMany where latestVersionNo` + unik (`services/templates/index.ts:366-379`); nomor dokumen lewat advisory lock + unik (`services/ingest/repository.ts:143`).
- INT-U benar: gerbang 403/422 berjalan sebelum `studioArtifact.create` (`src/app/api/studio/artifacts/route.ts:101-104`).
- Pemetaan galat terpusat tanpa stack di respons (`http/errors.ts:54-86`); 500 generik membawa `correlationId`.
- Seed dijaga nama DB dan idempoten; jalur lama `--refresh-v1` ditolak eksplisit (`prisma/seed-studio.ts:137-139`).
- Skema dan migrasi aditif murni; tsc seluruh repo 0 galat.

## 8. Cakupan review (berkas yang benar-benar dibaca)

Dibaca penuh atau hampir penuh:
- `src/lib/studio/services/templates/access.ts`, `services/templates/index.ts:60-742`
- `src/lib/studio/services/ingest/trust.ts`, `services/ingest/index.ts`, `services/ingest/gate.ts`, `services/ingest/repository.ts`, `services/ingest/checks.ts:95-152`, `services/ingest/util.ts:1-40`
- `src/lib/studio/contract/auth.ts`
- `src/lib/studio/services/revisions/index.ts`, `services/revisions/canonical.ts`, `services/revisions/rows.ts:63-83`
- `src/lib/studio/services/render/artifact.ts`, `services/render/revision.ts`, `services/render/job.ts`, `services/render/common.ts:29-45`, `:108-120`, `services/render/naming.ts:1-40`
- `src/lib/studio/engine/bind/reproduction.ts`, `engine/lint/scan/enforcement.ts`, `engine/lint/scan/index.ts:212-223`, `engine/lint/structure/enforcement.ts:64-140`
- `src/lib/studio/engine/html/tables/derivation.ts:20-45`, `:105-120`; `engine/docx/figures/derivation.ts:70-90`, `:290-305`
- `src/lib/studio/http/errors.ts`, `http/index.ts`, `http/validation.ts`
- `src/app/api/studio/documents/route.ts`, `documents/[id]/route.ts` (struktur), `documents/[id]/revisions/route.ts`, `documents/[id]/blocks/[address]/route.ts`, `documents/[id]/blocks/_lib/http.ts`
- `src/app/api/studio/validate/route.ts`, `validate/_shared/route-kit.ts`
- `src/app/api/studio/artifacts/route.ts`, `artifacts/_lib/prepare.ts`
- `src/app/api/studio/templates/route.ts:60-111`, `templates/[id]/route.ts:30-96`, `templates/_lib/validate.ts:189-225`
- `src/app/api/studio/files/[id]/route.ts`, `files/_lib/serve.ts`, `render-env/route.ts:85-100`
- `prisma/seed-studio.ts`, kedua `migration.sql`, `git diff prisma/schema.prisma`

Dibaca hanya lewat grep/antarmuka, **tidak** di-review per baris (≈ 15.000 baris):
- `src/lib/studio/params/**`, isi `registry/**` (selain D03), `engine/tokens/**` (selain hak override)
- `engine/lint/{render,language,structure}/**` (selain enforcement)
- `services/{images,storage}/**` (selain `mimeBase`), `services/templates/profile.ts` (selain utilitas)
- `http/{body,sanitize,rate-limit,client-log}.ts`, `src/app/api/studio/{registry,client-log}/**`, `render-env/_lib/status.ts`, `contract/schema/**`

Penilaian modul-modul ini terbatas pada antarmuka yang dipakai jalur di atas.

Dokumen tugas yang dibaca: `identification/02_structured.md` baris S85; `masterplan/01_specs.md` §1-2, §6; `decisions/decisions.md` D-21, D-24, D-50..D-114; `findings/findings_register.md` F-041..F-053; `delegation_progress/coder_execution_int_u.md`, `coder_execution_int_m.md` (bagian keputusan).
