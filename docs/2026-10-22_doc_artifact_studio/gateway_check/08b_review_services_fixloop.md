# SR-55b: review ulang layanan setelah siklus perbaikan (D-275)

- **Penulis:** senior-code-reviewer (baris SR-55b).
- **Tanggal:** 2026-10-23.
- **Mode:** REVIEW-ONLY. Tidak ada perubahan pada `src/**` maupun `prisma/**`. Laporan siklus 1 `08_review_structural_services.md` tidak ditimpa.
- **Skill:** code-review-senior.
- **Masukan:** catatan `delegation_progress/coder_execution_{fixs,fixr,fixsec,fixseed,fixv,fixx,fixy,fixw}.md`, keputusan D-244..D-275, dan berkas kode di area layanan.
- **Status git:** area Studio masih untracked terhadap HEAD, jadi delta dibaca langsung dari berkasnya.

## Vonis keseluruhan: APPROVED WITH COMMENTS

- **Temuan siklus 1:** H1 tertutup. Dari 8 temuan Medium, 7 tertutup penuh, dan M2 tertutup untuk `target.documentId` tetapi masih tersisa di jalur upsert misi (dilacak sebagai N1). Kelima temuan Low masih terbuka; semuanya ditunda ke backlog sesuai D-244.
- **Temuan baru:** 0 High, 2 Medium, 4 Low.

| Domain | Vonis | High | Medium | Low |
|---|---|---|---|---|
| Structure | CAUTION | 0 | 0 | 1 |
| Dependency Impact | CAUTION | 0 | 1 | 0 |
| Duplication | PASS | 0 | 0 | 0 |
| Maintainability | CAUTION | 0 | 0 | 2 |
| Reference Integrity | CAUTION | 0 | 1 | 1 |

## Bukti segar sesi ini

| Pemeriksaan | Perintah | Hasil |
|---|---|---|
| tsc seluruh repo | `npx tsc --noEmit --incremental false -p tsconfig.json` | `tsc_exit=0`, 0 `error TS` |
| eslint | `npx eslint src/lib/studio/services src/lib/studio/contract src/app/api/studio prisma/seed-studio.ts` | `eslint_exit=0` |
| vitest | `npx vitest run tests/unit/studio/api tests/unit/studio/api-structure tests/unit/studio/structure tests/unit/studio/security` | 30 berkas, 1112/1112 lulus |
| Biaya gerbang bersama | skrip `gate_timing.ts`: Manual 000 `doc.v2.json` (394 blok), ingest dryRun, lalu `evaluateByConstruction` 3 kali | ingest dryRun 870 ms; gerbang 64-76 ms. Mode report: 0 penahan. Penanda dikupas (tak tepercaya): 2 penahan. Gerbang atas seluruh snapshot di dalam transaksi tidak menimbulkan risiko batas waktu (C28 = 60 s) |
| Pindai §0 (PT-02/PT-06) | `pt_scan.ts` | PT-06 tetap 0. Hanya hit DF `u` di diagram yang tersisa (L1). `render` sudah hilang dari SID01-SID03 |
| RENDER_FIELD dan DF-70/71 | `df_probe.ts` (`validateV2Against`) | `render` dipetakan ke `/render` RENDER_FIELD; panel `widthClass` dan `limit.max` dipetakan ke DISPLAY_FIELD berpointer |
| Instance Ajv | `grep -rn "new Ajv2020" src/lib/studio src/app/api/studio` | 1 (`services/ingest/validate.ts:43`) |

## Status temuan siklus 1

| # | Status | Bukti |
|---|---|---|
| H1 gerbang by-construction R12/R13/R16/R06/R14 | **TERTUTUP** | Gerbang bersama ada di `services/ingest/by-construction.ts:94-123,215-223`. Pemanggilnya: `submit/pipeline.ts:920-948` (di dalam transaksi, sebelum `studioRevision.create` di `:974`) dan `revisions/v2/commit.ts:223-225` (dipakai R16, R06, R14). Cek yang bergantung kelengkapan ditunda selama INCOMPLETE (`by-construction.ts:111-120`, D-131). Uji regresi: `tests/unit/studio/api-structure/submit.test.ts:337` (R12 DATUM-04 422). Asap FIX-S 43/43 juga mencakup R13, R16, dan R06 v2 |
| M1 IP-64 AsyncLocalStorage | **TERTUTUP** | `submit/targeting.ts` kini tanpa ALS (grep `AsyncLocalStorage` = 0). Parameter eksplisit mengalir lewat `ingest/index.ts:178,343`, `ingest/v2.ts:105,637`, dan `documents/route.ts:305` |
| M2 versi templat pada R04 bertarget | **TERTUTUP SEBAGIAN** | `docPinOf` dan `pinTemplate(..., docPin)` (`ingest/v2.ts:182,231,253-261,617-619`) menutup jalur `target.documentId`. Upsert misi ke dokumen yang ada masih memakai versi terbaru di pra-gerbang ingest (lihat N1) |
| M3 IP-66 META_CONFLICT pada medan null | **TERTUTUP** | Isi-bila-kosong ada di `compose/merge.ts:266-283,338,393-398` (lingkup `meta`, `changed`). Cek dasar meta ada di `pipeline.ts:864-872`. Cermin kolom dokumen di transaksi yang sama ada di `pipeline.ts:1000-1008` (`META_MIRRORED_FIELDS`, `merge.ts:56`) |
| M4 `lastFilledBy` dari badan | **TERTUTUP** | `fillerOf(caller)` (`submit/meta.ts:20-23`) dipakai di `pipeline.ts:675`. `agentId` badan kini hanya `authorLabel` (meta.author) dan log. Lihat juga N3 (format) |
| M5 kupas penanda trust terduplikasi | **TERTUTUP** | Satu fungsi `stripTrustMarkersForWriter` dipakai di `pipeline.ts:340,365`, `revisions/v2/service.ts:184`, dan `revisions/index.ts:383` |
| M6 status slot dan urutan bab terduplikasi | **TERTUTUP (sisa tercatat)** | Satu sumber ada di `completeness/compute.ts:37,76,113`. Compose tinggal adaptor tipis (`compose/snapshot.ts:70-100`), begitu juga R05 `fallbackState` (`documents/[id]/route.ts:186-200`). Uji 60 kasus: `tests/unit/studio/structure/completeness-shared.test.ts`. Sisa yang disengaja dan terdokumentasi: `filled` slot tak-berulang dengan payload yang hanya berisi `type` (snapshot FILLED vs laporan AUTO_READY, `compose/snapshot.ts:80-87`), menunggu putusan data FIX-V |
| M7 helper terduplikasi | **TERTUTUP** | `jakartaDate` satu pemilik (`submit/meta.ts:26`, diekspor ulang di `ingest/meta.ts:12,20`). `renderRefusedOf` dihapus (D-247). `revisionCompleteness` tinggal satu (`render/scope.ts:141`) |
| M8 tujuh instance Ajv | **TERTUTUP** | Satu `studioAjv`/`studioValidator` (`services/ingest/validate.ts:43`). grep `new Ajv2020` = 1 |
| L1 `u` diagram vs DF-08 | TERBUKA | `contract/schema/diagram.schema.ts:44`; `pt_scan.ts` masih menemukan hit di SID01 dan SID02 (backlog D-244) |
| L2 `restricted:false` hardcode | TERBUKA | `services/templates/index.ts:635,730,953` |
| L3 logika R05 di route | TERBUKA SEBAGIAN | Status slot kini satu sumber (M6), tetapi masih ada 9 panggilan `prisma.` di `app/api/studio/documents/[id]/route.ts` |
| L4 dua allocator pid berbenih | TERBUKA | `compose/pids.ts:23`, `structure/pid.ts:110` |
| L5 `submit-kit` mengimpor `validate/_shared` | TERBUKA | `app/api/studio/chapters/_shared/submit-kit.ts:39` |
| IP-56 / IP-57 (rekomendasi siklus 1) | TERTUTUP | IP-56 dihapus atas persetujuan USER (D-251); `components/studio/revision/` kini hanya `api.ts`, `diff-view.tsx`, `labels.ts`, `text-diff.tsx`, dan `document-viewer/{api,feedback,labels,index}` sudah tidak ada. IP-57: medan `content` usang dihapus (`playground/rail-summary.ts:6`, `shared/completeness-rail.tsx` tanpa `LegacyContentSummary`) |
| IP-62 | TERTUTUP (siklus 1) | 32 PASS (08 siklus 1) |

## Temuan baru

| # | Tingkat | Domain | Berkas:baris | Temuan | Rekomendasi | Pemilik |
|---|---|---|---|---|---|---|
| N1 | Medium | Dependency Impact | `services/ingest/v2.ts:499-564` (pra-gerbang atas `emptyResolvedDoc` + kiriman), `:617-619` (`docPin` hanya untuk `target.documentId`); `services/ingest/checks.ts:183-216` (`renderFeasibilityBlockers` hanya memakai `snapshot.register`); `compose/merge.ts:417-420` (register digabung saat kiriman) | Pada R04 ke dokumen yang ADA (bertarget atau upsert misi), ingest tetap menjalankan gerbang atas kiriman parsial yang digabung ke kerangka KOSONG, sebelum gerbang otoritatif di pipeline (`pipeline.ts:920`). Akibatnya bisa terjadi 422 palsu. Contoh: bab berisi turunan yang merujuk kunci register yang tersimpan di dokumen tetapi tidak dikirim ulang ditolak D03 "kunci register tidak terdaftar", padahal kiriman yang sama lewat R12 lolos karena register sudah tergabung. Pada upsert misi, pra-gerbang juga memakai versi templat terbaru, bukan versi yang dipatok dokumen (sisa M2). Penolakan palsu ini disimpulkan dari jalur kode dan belum diasap di DB | Untuk dokumen yang ada, lewati pra-gerbang ingest atau jadikan diagnostik saja, dan biarkan gerbang di dalam transaksi pipeline menjadi satu-satunya penahan. Alternatifnya, beri ingest konten tergabung dan patokan versi dokumen (termasuk resolusi misi dan `docKey`). Tambah uji R04 bertarget dengan turunan yang merujuk register tersimpan | FIX-S / SR-12 (`services/ingest/v2.ts`) |
| N2 | Medium | Reference Integrity | `app/api/studio/validate/_shared/template-draft.ts:166-169,193` vs `services/templates/index.ts:953` (`assertWriteRights`) | Pratinjau draf templat R08 menerapkan lapis lengkap (`templateLayerOf`: esensial dan lanjutan, termasuk kunci kelas K) untuk pemanggil non-ADMIN tanpa `assertWriteRights`/`checkTemplateWrite`. Hanya D-98 yang diperiksa (`assertTemplateUsable` atas hasil). Pratinjau USER bisa menampilkan pengaturan yang ditolak saat disimpan (403 `PARAM_SURFACE_FORBIDDEN` / `PARAM_CLASS_K_FORBIDDEN`). Ini bertentangan dengan klaim catatan FIX-V bahwa langkahnya "sama dengan simpan v2" | Jalankan `assertWriteRights` mode kering (tanpa tulis) di template-draft dan kembalikan pelanggarannya sebagai `issues` berpointer `/draftTemplate/template/...`, atau kupas kunci di luar permukaan peran sebelum `composeVersion` |
| N3 | Low | Reference Integrity | `services/submit/meta.ts:20-23` (`fillerOf`: agen ditulis `<agentId>`) vs `services/revisions/v2/commit.ts:207-209` (`caller.requester`: agen ditulis `agent:<agentId>`) | Format `lastFilledBy` untuk penulis yang sama berbeda antara kiriman (R04/R12/R13) dan sunting (R16/R06/R14). Kelengkapan (`present[].by`) dan pesan `SCOPE_CONFLICT` jadi tidak konsisten | Pakai `fillerOf(caller)` juga di `commitV2Revision` |
| N4 | Low | Maintainability | `services/images/asset-store.ts:346-347` (agregat kuota) vs `:352` (insert) | Kuota unggah aset (FIX-SEC N-07) adalah cek-lalu-tulis tanpa serialisasi. Unggahan paralel dari pemanggil yang sama bisa melampaui kuota, sebanyak (jumlah unggahan paralel) x (ukuran aset maksimum). Dampaknya terbatas oleh laju R18 | Serialisasi per ember kuota dengan advisory lock (`studio-assetq:<bucket>`) dalam transaksi agregat+insert, atau terima dan catat sebagai batas lunak. Teruskan ke SR-57 |
| N5 | Low | Structure | `services/render/common.ts:28` mengimpor `services/ingest/v2.ts:678-681` | Render bergantung pada modul ingest v2 yang berat hanya demi pengurai 3 baris `inlineFormatPolicyOf`, padahal `effectiveInlinePolicy` sudah ada di `adapt-v1` (`render/common.ts:25`). Lapisan menjadi terbalik, dan graf impor `render/pure` makin lebar (IP-55 masih terbuka: `pure_probe.ts` menunjukkan `DATABASE_URL` terisi setelah impor) | Pindahkan `inlineFormatPolicyOf` ke `services/adapt-v1`, lalu render dan ingest mengimpornya dari sana |
| N6 | Low | Maintainability | `tests/unit/studio/api-structure/` (hanya `submit.test.ts:337` yang menguji `BY_CONSTRUCTION_FAILED`) | Regresi gerbang pada R16, R06 v2, dan R14 hanya dibuktikan asap DB FIX-S (skrip scratchpad), belum oleh suite | Tambah uji suite untuk 422 `BY_CONSTRUCTION_FAILED` pada R16 (agen/USER), R06 v2, dan R14 setMeta. Tambah juga uji penundaan LD-01/LD-02 selama INCOMPLETE |

## Tantangan utama

1. **Gerbang atas seluruh snapshot hasil gabung (FIX-S).** Penulis tidak tepercaya tidak dapat menulis ke dokumen yang sudah memuat pelanggaran warisan penulis tepercaya ber-D-34. Biaya terukur rendah (sekitar 70 ms pada 394 blok), dan dokumen semacam itu (000) memakai templat terbatas yang memang ditolak D-98 untuk non-ADMIN. Trade-off ini dapat diterima, tetapi sebaiknya dicatat eksplisit di panduan agen: galat 422 bisa menunjuk bab yang tidak dikirim, dan dalam kasus itu `mergedPointer` tidak ada.
2. **R04 kini menjalankan gerbang dua kali** (ingest, lalu pipeline). Untuk pembuatan, keduanya setara. Untuk dokumen yang ada, keduanya bisa memberi hasil berbeda (N1). Sebaiknya hanya satu yang menjadi penahan.

## Temuan positif

- H1 ditutup dengan satu fungsi bersama dan satu titik di dalam transaksi untuk 6 route tulis. Kebijakan kepercayaan dan D-34 berasal dari satu sumber, dan cek yang bergantung kelengkapan ditunda dengan catatan (D-131).
- Penjaga rekonstruksi D-258 (`submit/integrity.ts:51-71`) dipakai di kedua jalur tulis v2, dan sensitivitasnya dibuktikan uji negatif (000 rev 2/3 ditolak sebelum perbaikan data).
- Dry-run R08 (FIX-V) memakai transaksi `SET TRANSACTION READ ONLY` sebagai pernyataan pertama (`submit/lock.ts:51-52,127`), tanpa kunci advisory dan tanpa pengulangan balapan (`:149`). Jalur nyata dan dry-run berbagi `execute`.
- Duplikasi siklus 1 (M5-M8) dibersihkan: satu Ajv, satu tabel status slot dengan uji 60 kasus, dan satu fungsi kupas trust.
- Penolakan medan render (D-247) memberi pesan berpointer `RENDER_FIELD` tanpa kode galat baru. IP-63 DF-70/71 berpointer.

## Berkas yang dibaca

- **Layanan:** `submit/pipeline.ts:600-1072`, `submit/integrity.ts` (penuh), `submit/meta.ts:20-30`, `submit/targeting.ts` (penuh), `submit/lock.ts` (grep readOnly), `ingest/by-construction.ts` (penuh), `ingest/v2.ts:182-261,499-681`, `ingest/checks.ts:176-216`, `compose/merge.ts` (grep meta/register), `compose/snapshot.ts:70-100`, `revisions/v2/commit.ts:150-215` (+ grep), `revisions/v2/service.ts` dan `revisions/index.ts` (grep), `images/asset-store.ts:101-191,330-380`, `render/common.ts:1-31`, `templates/index.ts` (grep `restricted`), `templates/v2.ts:159-170`.
- **Route:** `validate/_shared/template-draft.ts:130-205`, `documents/[id]/route.ts:182-200`, `documents/route.ts` (grep targeting), `chapters/_shared/submit-kit.ts` (grep).
- **Seed:** `prisma/seed-studio.ts:113,182`.
- **UI (status IP-56/57):** `components/studio/revision/`, `document-viewer/`, `playground/rail-summary.ts`, `shared/completeness-rail.tsx`.
- **Dokumen:** 8 catatan coder FIX-*, `decisions.md` D-247..D-275.
- **Skrip pemeriksa (scratchpad, di luar repo):** `gate_timing.ts`, `pt_scan.ts`, `df_probe.ts`, `pure_probe.ts`, `tsc2.txt`, `eslint2.txt`, `vitest2.txt`.
