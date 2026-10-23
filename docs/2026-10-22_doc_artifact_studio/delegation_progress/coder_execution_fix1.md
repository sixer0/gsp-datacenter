---
task_id: FIX-1
task_slug: doc_artifact_studio
row: FIX-1 (loop perbaikan siklus 1: layanan + API)
date: 2026-10-23
agent: coder-execution
source_plan: gateway_check/04_review_services_api.md (S85), gateway_check/06_security_review.md (S87)
status: complete
---

# FIX-1: perbaikan S85 + S87 di layanan dan API Studio

Skill: backend-execution, receiving-code-review, dry-run-verify-fix. Klaim: `file_claims.md` (prefiks FIX-1; tambahan `contract/errors.ts` dan `contract/auth.ts`, tidak diklaim baris paralel lain).

## Ringkasan per butir

| Butir | Status | Perubahan inti (berkas) | Bukti |
|---|---|---|---|
| S87 M-02 | selesai | Aset `doc.assets` lewat `decodeImageDetailed` (helper jalur artefak: sniff + batas piksel); melewati batas -> 413 `ASSET_TOO_LARGE`, `reason: pixel_limit` (`services/ingest/assets.ts`, `ingest/index.ts`) | fix1.test "PNG 30000x30000 -> 413"; DB v21: benchmark ADMIN dryRun 31 aset `valid:true`, `assetTooLarge: 0` |
| S87 M-03 | selesai (lapisan API/layanan) | Pembatas laju per identitas terautentikasi (`http/render-guard.ts`, 30/60 dtk, env) di R04 POST, R06 PATCH, R07 POST, R09 POST, R08 `?preview=html` -> 429 `RATE_LIMITED` + Retry-After; antrean render proses berbatas (`services/render/admission.ts`, 2 jalan + 8 tunggu) -> 503 `RENDER_QUEUE_FULL` + Retry-After; cek kapasitas sebelum ingest/sunting; job gagal seluruhnya karena antrean penuh (termasuk dari mesin FIX-8) -> R04/R07 503. Antrean soffice/Chromium sendiri = FIX-8 (mediasi controller) | fix1.test M-03 (5 uji) |
| S87 M-04 = S85 R-01 | selesai | `patchBlock`: pemanggil tak tepercaya menyunting salinan tanpa `x.benchmark`/`x.enforcement`/`x.lintEnforcement`; gerbang DAN snapshot revisi baru memakai salinan itu; ADMIN tetap (`services/revisions/index.ts`) | fix1.test: USER/agent 422 D03, ADMIN 200 penanda tetap, USER 200 penanda dibuang |
| S87 M-05 | selesai | `createTemplateVersion`: templat terbatas -> 403 FORBIDDEN `TEMPLATE_RESTRICTED` untuk non-ADMIN, tanpa tulis (`services/templates/index.ts`) | fix1.test (user/google/agent 403, ADMIN 201); DB v21: USER pada `datum-manual-000` -> 403, jumlah baris tetap |
| S85 R-02 | selesai | PATCH: templat efektif = terpin + `applyDocOverrides` (seperti ingest/render), `assertTemplateUsable` diulang setelah override | fix1.test: ADMIN 200 (dulu 422), USER 403 |
| S85 R-03 / F-053 | selesai | `renderFeasibilityBlockers` (`services/ingest/checks.ts`): prasyarat renderer turunan (bangun, kunci register, id, judul/penutup) = penahan integritas di ingest, validate, PATCH, gerbang artefak HTML; pengecualian hanya `isVerbatimReproduction` (predikat renderer) | fix1.test R-03 (6 uji, termasuk turunan lengkap contoh panduan tetap valid); DB v21 benchmark `renderFeasibility: 0` |
| S85 R-04 | selesai | `assertNoActiveRenderJob` satu sumber di `render/job.ts` (jendela basi C08), dipakai `createRenderJob` dan `rerenderRevision` | fix1.test (filter `queuedAt.gte`); uji S74 409 tetap hijau |
| S85 R-05 | selesai | Route R02 hanya memvalidasi nilai (`assertOverrideValues`); hak K per kunci berubah di layanan (D-62) | uji S74 `templates.test.ts:227` kini hijau |
| S85 R-06 | selesai | DTO satu sumber `services/revisions/rows.ts` (`documentSummary`, `revisionSummary`); repository + route-kit re-export | fix1.test identitas fungsi |
| S85 R-07 | selesai (sisi layanan) | Putusan: `x.enforcement` = penanda D-34 saja, bukan reproduksi verbatim; kelayakan render memakai predikat renderer. Komentar `isBenchmarkDoc` -> permintaan FIX-6 | fix1.test "HANYA x.enforcement -> valid:false D03" |
| S85 R-08 | selesai | JSON kanonik + sha256 satu sumber `services/ingest/util.ts` (revisi, templat, artefak) | fix1.test kesetaraan hash dengan implementasi lama |
| S85 R-09 | selesai | R04 memakai `errorCodeOf(err, "RENDER_FAILED")` services/render | fix1.test; uji S74 ingest.test:284 berubah (disengaja) |
| S87 L-01 | selesai | `secretEquals`: HMAC kunci acak proses + `timingSafeEqual` (`contract/auth.ts`) | fix1.test |
| S87 L-02 | selesai | requester `user:`/`google:<email>`/`agent:<agentId>`; agentId hanya label; ember laju agen bersama | fix1.test; 5 uji S74 berubah (disengaja) |
| S87 L-04 | selesai | Kedalaman JSON maks 64, iteratif, di `parseJsonText` -> 400 `SCHEMA_INVALID` `maxDepth` | fix1.test (badan 1000 tingkat 400; 2 juta tingkat tanpa RangeError) |
| S87 L-05 | selesai | Sink JSONL bersama `http/jsonl.ts`: retensi 90 hari (env), batas 50 MiB per berkas (bagian `.n`), dipakai log api/ingest/revisions/templates/storage (juga S85 R-16) | fix1.test purge |
| S87 L-06 | selesai (layanan) | Path aset templat hanya di `src/lib/studio/assets/`, tanpa segmen `.x`; impor profil + daftar ekstensi; `actual` di fonts.ts -> permintaan FIX-6/RT-01 | fix1.test; DB v21: 0 aset tersimpan di luar folder |
| S87 L-07 | selesai | `Content-Type` hadir tetapi bukan JSON -> 415 `UNSUPPORTED_MEDIA_TYPE` (readJsonBody + R09 cabang JSON); header absen diterima | fix1.test |
| Low S85 | R-12, R-14, R-15, R-16, R-17, R-18, R-19, R-21 selesai | `isAdminCaller`; cabang mati R04 dihapus; `CHANGE_FIELD_MAX` di layanan + `isPlainObject` bersama; deskripsi kanonik dari jumlah registri; R07 formats tak peka huruf; komentar `IngestOptions.template`; `isUniqueViolation` target tak dikenal = false | tsc/eslint, fix1.test (R-18) |
| Low ditunda | R-10, R-11, R-13, R-22 | R-13 dikunci uji S74 (permintaan diajukan); R-10/R-11 mengubah semantik penomoran / tanda tangan I41 (butuh keputusan); R-22 di luar area | - |

## Kontrak aditif
`contract/enums.ts` + `contract/errors.ts`: `RATE_LIMITED` 429, `RENDER_QUEUE_FULL` 503, `UNSUPPORTED_MEDIA_TYPE` 415 (respons 429/503 membawa `Retry-After` lewat `http/errors.ts`).

## Test Results (perintah dan keluaran sesi ini)

| Uji | Perintah | Hasil |
|---|---|---|
| Typecheck seluruh repo | `npx tsc --noEmit -p .` | exit 0, 0 baris keluaran |
| Lint area | `npx eslint <area FIX-1> tests/unit/studio/fix1` | exit 0 |
| Uji FIX-1 | `npx vitest run tests/unit/studio/fix1` | 38/38 lulus |
| Uji API S74 | `npx vitest run tests/unit/studio/api` | 299/306 lulus; 7 gagal = perilaku baru disengaja (di bawah); sebelum FIX-1: 305/306 (gagal = R-05, kini hijau) |
| DB v21 jalur penolakan/dryRun | `npx tsx <scratchpad>/fix1_db_verify.ts` | `current_database = gsp_agent_hq_v21`; jumlah baris sebelum = sesudah (`documents 3, revisions 3, templates 3, templateVersions 7, artifacts 0, renderJobs 3`, `ROWS_UNCHANGED true`); benchmark ADMIN dryRun valid (561 blok); USER 403; M-05 USER 403 |

7 uji S74 yang berubah karena perilaku baru yang disengaja (berkas uji tidak diubah; permintaan di `file_requests.md`):
- L-02: `auth.test.ts:170`, `ingest.test.ts:86` (google, agent), `revisions.test.ts:116`, `templates.test.ts:111` (requester berprefiks).
- R-09: `ingest.test.ts:284` (`RENDER_FAILED`).
- Kode aditif: `http-errors.test.ts:84` (41 -> 44 kode).

Uji studio lain (`tests/unit/studio`) yang merah berada di engine docx/html/chart/diagram/tokens (area RT-01/FIX-6 sedang diedit; mis. `env.templateGlyphRun is not a function`), bukan berkas FIX-1.

## Issues & Decisions (untuk dicatat controller)

| Butir | Keputusan | Alasan |
|---|---|---|
| R-01/M-04 | Opsi "salinan tanpa penanda" (bukan 403); snapshot revisi dari pemanggil tak tepercaya juga TANPA penanda. Revisi D-98 butir 2: kepercayaan melekat pada pembuat konten | Render ulang konten campuran tidak boleh memakai reproduksi verbatim/D-34; dokumen bertanda dengan turunan verbatim praktis hanya dapat disunting ADMIN (422 D03) |
| R-03 | Penahan kelayakan render tidak dapat dilepas override maupun D-34 | Renderer menolak apa pun penegakannya |
| R-07 | `x.enforcement:"report"` bukan penanda reproduksi verbatim | Alternatif reviewer: perkuat R-03 |
| R-02 | Override dokumen tak sah saat PATCH dilewati + log (seperti render), bukan 422 | PATCH tidak dapat mengubah override; menolak akan mengunci dokumen permanen |
| L-07 | `Content-Type` absen diterima | Peramban selalu mengirim Content-Type untuk permintaan lintas situs sederhana; klien mesin lama tetap jalan |
| M-03 | Laju per identitas sesi (agen x-internal-secret satu ember); batas & antrean via env | agentId dapat dipalsukan (L-02) |

## Next Steps
- S74: mutakhirkan 7 ekspektasi (permintaan diajukan); R-13 menunggu keputusan.
- FIX-8: lempar `RENDER_QUEUE_FULL` dari antrean mesin (sudah dipetakan).
- FIX-6/RT-01: buang `actual` di `engine/html/base/fonts.ts`; komentar `isBenchmarkDoc`.
- Permintaan FIX-5 ke FIX-1 (`renderSnapshotPure`, `chartSvg` komposit + tpl) belum dikerjakan: di luar butir S85/S87, butuh keputusan controller.
- Review direkomendasikan (senior-code-reviewer + security-review ulang cek Permission Escalation) atas berkas di tabel di atas.
