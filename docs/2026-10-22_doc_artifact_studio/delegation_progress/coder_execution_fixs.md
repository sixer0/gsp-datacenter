---
task_slug: doc_artifact_studio
row: FIX-S (loop perbaikan siklus 1; D-244 + perluasan D-247/D-248, D-252, D-253, D-258)
date: 2026-10-23
agent: coder-execution
status: needs-review
---

# FIX-S: gerbang by-construction bersama, temuan SR-55, build hanya lewat endpoint, F-070

Status `needs-review`: kode selesai dan terverifikasi; tiga hal menunggu pihak lain: (1) [SELESAI D-261, lihat Audit] perbaikan DATA dokumen 000 rev 2/3, (2) 1 galat tsc + 12 uji usang di berkas uji milik SR-43/SR-44 (ekspektasi pra-D-247/IP-63; patch persis di `file_requests.md`), (3) temuan H1 dan N-01 disajikan ke user bersama SR-57 (keamanan, D-244). Skill: receiving-code-review, backend-execution, dry-run-verify-fix.

## Perubahan

| Berkas | Jenis | Ringkasan |
|---|---|---|
| `src/lib/studio/services/ingest/by-construction.ts` | baru | Gerbang BERSAMA `evaluateByConstruction` / `assertByConstruction` / `typeCodeIssue` (H1) |
| `src/lib/studio/services/submit/integrity.ts` | baru | `assertRevisionReconstructs` (D-258): baca balik baris, `rebuildSource` + recomposer, sha + pid/alamat blok |
| `services/ingest/v2.ts` | ubah | Gerbang bersama; M2 `docPinOf` (templat tersemat untuk R04 bertarget, `TEMPLATE_MISMATCH` setara merge); M1 `V2Options.submitTargeting`; M4 cap pengisi; tanpa `renderRefused`; `inlineFormatPolicyOf` (D-253) |
| `services/ingest/{index,meta,trust,validate}.ts` | ubah | `IngestOptions.submitTargeting` (M1); `jakartaDate` satu pemilik (M7); `stripTrustMarkersForWriter` (M5); `studioAjv`/`studioValidator` satu instans (M8) |
| `services/submit/pipeline.ts` | ubah | Gerbang bersama in-tx sebelum `studioRevision.create`; P3-20 saat pembuatan; M3 lingkup meta + cek dasar meta + cermin kolom; M4 `fillerOf`; M5; M2 (gerbang D-98 pindah ke jalur pembuatan); tanpa render (D-247); cek rekonstruksi D-258 |
| `services/submit/{index,targeting,meta}.ts` | ubah | AsyncLocalStorage dicabut (IP-64); `fillerOf`; tanpa `render` di plan |
| `services/revisions/v2/commit.ts` | ubah | Gerbang bersama (R16/R06/R14); N-01 versi saat ini; D-258 `composeV2` dengan `prevRows` + pembangkit pid, baris = baris compose; cek rekonstruksi |
| `services/revisions/v2/{service,body}.ts`, `revisions/index.ts` | ubah | `renderAfterCommit` dicabut, `render` di badan -> RENDER_FIELD, M5, Ajv bersama, R06 v1 tanpa render otomatis |
| `services/compose/merge.ts` | ubah | IP-66 isi-bila-kosong + `metaFilled` + `META_MIRRORED_FIELDS`; D-252 kepemilikan pid sebelum cek idempoten |
| `services/adapt-v1/index.ts` | ubah | D-247: `render`/`outputs` v1 dibuang, `report.stripped.render/outputs` |
| `contract/schema/v2/forbidden.ts` | ubah | IP-63 DF-70, DF-71 (2 entri; per lokasi 17 -> 19); `renderFieldIssue`, `schemaInvalidMessage`, `RENDER_FIELD`; VF-09 pengganti |
| `contract/{schema,types}/v2/{doc,chapter,slot}` | ubah | Medan `render` dihapus (D-247) |
| route R04, R12/R13 (`submit-kit`), R06, R14 (`route`, `patch-body`), R16, `validate/_shared/v2-kit` | ubah | Ajv bersama; tanpa render/antrean; penolakan RENDER_FIELD; target eksplisit; v1 tanpa build; `revisionCompleteness` dari `render/scope` (M7) |

## H1: pemetaan per cek (gerbang bersama, D-131)

| Kelompok cek | Asal | Pada kiriman parsial / sunting | Alasan |
|---|---|---|---|
| 28 DATUM `blocksIngest` (01,02,04-13,18-27 kecuali 14-17, 29,30,31,34,35,38) + G1, G2, G3, N1 (= 32) | `byConstructionChecks` + `runLint(ingest)` lewat `runGate` | MENAHAN (422 `BY_CONSTRUCTION_FAILED`) | Menilai sifat elemen yang ADA (judul, tabel, gambar, teks); ketiadaan isi = tanpa temuan (`checks-a.ts` a06 "tidak ada sampul" = lolos) |
| G1, DATUM-11 (integritas) | `tableChecks`, `bindRegister` cacat entri | MENAHAN, tidak dapat dilepas override/D-34 | Integritas; register dibawa kiriman (SID02/SID03 punya `register`) |
| D03 kelayakan render | `renderFeasibilityBlockers` | MENAHAN | Render pasti gagal (F-053) |
| P3-20 typeCode | `typeCodeIssue` | 400 `SCHEMA_INVALID` saat pembuatan (sama R04), FAIL laporan bila D-34 tepercaya | Meta pembuatan |
| LD-01 `SLOT_CONTENT_MISSING`, LD-02 `CONTENT_CHAPTER_GAP` | lint struktur | TIDAK menahan selama INCOMPLETE (juga bila profil menaikkannya ke block); tetap di laporan lint ("ditunda sampai dokumen lengkap (D-131)") | Bergantung kelengkapan |
| Cek rilis lain (D01-D21, R/eye) | lint | Laporan saja (A10) | Tidak berubah |

Kepercayaan: penanda tersimpan/terkirim dibuang untuk penulis tidak tepercaya sebelum gerbang (D-134 R-01), jadi D-34 hanya dari pemanggil tepercaya. Pilihan desain: gerbang menilai SELURUH snapshot hasil gabung (bukan hanya bab yang berubah) agar penulis tidak tepercaya tidak pernah menghasilkan revisi berisi pelanggaran penahan; akibatnya dokumen lama yang sudah memuat pelanggaran (hanya mungkin dari penulis tepercaya ber-D-34) menolak tulis penulis tidak tepercaya sampai diperbaiki.

## Bukti

| Uji | Perintah | Hasil |
|---|---|---|
| tsc repo | `npx tsc --noEmit -p tsconfig.json --incremental false` | src 0; repo 1 galat: `tests/unit/studio/structure/adapt-v1.test.ts(52)` TS2339 `render` (SR-44, ekspektasi AD-15 pra-D-247) |
| eslint area | `npx eslint <14 jalur area>` | exit 0 |
| vitest api + api-structure | `npx vitest run tests/unit/studio/api tests/unit/studio/api-structure` | 508 lulus / 12 gagal sebelum perbaikan uji revisi; akhir (bersama structure) 931/943: gagal = 7 `ingest.test.ts` (render v1 otomatis, pra-D-247), 3 `display-field` (hitungan DF-69/31 + probe `ChartLimit`), 2 `adapt-v1` (AD-03/AD-15). Lulus: SR-45 render di R12, R16 render, F-065 R12 judul pertanyaan; SR-43 `revisions.test.ts:266` PPN x4 (29/29) |
| Baseline sebelum FIX-S | sama | 8 gagal / 507 lulus (PPN x4, SLOT_FORBIDDEN_FOR_TIER, gateHtmlArtifact x3) -> semuanya kini lulus |
| Asap FIX-S (v21, fixture `FIXS-FX-*`) | `NODE_PATH=... npx tsx --tsconfig tsconfig.json scratchpad/fixs_smoke.ts` | 43/43: H1 R04 acuan vs R12 kode sama `BY_CONSTRUCTION_FAILED` DATUM-04, R12 PPN DATUM-19, R13 slot DATUM-19, R16 agen/USER, R06 v2 -> 422 0 tulis; parsial sah 201/200 INCOMPLETE; D-247 render di R04/R12/R13/R16/R06/R14 -> 400 RENDER_FIELD, RenderJob 5 -> 5, v1 render+outputs -> 201 job null + `stripped.render/outputs = 1`; M3 isi custodian (lingkup `meta;chapter:3`), sama = 201, beda = 409; M4 USER + agentId palsu -> `user:fixs-user`; D-252 PID_CONFLICT 422 (kontrol 200 unchanged); M2 agen bertarget ke dokumen tersemat v1 -> 201 (sebelumnya 403 dari v3 terbaru), versi 3 -> 409, ADMIN judul pertanyaan -> 422 (profil v1); N-01 agen/USER v3 -> v1 403, ADMIN 200; 11 tabel identik, 000/001/002 identik, 0 sisa |
| Asap SUB-1 | `scratchpad/sub1_smoke.ts`, `sub1_gate.ts` | 34/34, 22/22 (0 sisa) |
| D-258 basis backfill | `fixs_bf.ts create` -> `fixs_backfill_scoped.ts` (salinan backfill terbatas prefiks `FIXS-FX-BF-`) -> `fixs_bf.ts edit` -> `cleanup` | BF.0-BF.5 6/6 + Z 3/3: rev 1 norm/v1 berbaris cocok; R14 setMeta -> rev 2 norm/v2 cocok, pid `F:controlSheet` baris rev 1 = rev 2 = snapshot (`b-e8035…`); R16 rev 3 cocok; R12 rev 4 cocok; 0 sisa |
| D-258 uji negatif (baca-saja) | `fixs_guard_neg.ts` | 000 rev 2 dan rev 3 DITOLAK `StructureIntegrityError`, rev 4 LOLOS |
| D-258 pindai data (DRY-RUN, baca-saja) | `fixs_f070_scan.ts` -> `scratchpad/f070_scan.json` | 6 revisi berbaris, 2 tidak cocok (000 rev 2/3), selisih hanya pid/blockId 3 blok slot; usulan di `file_requests.md` (baris kanonik) |
| IP-63 | `fixs_df.ts` | DF-70 panel.widthClass, DF-71 panel/chart `limit.max` -> DISPLAY_FIELD berpointer |

## Persistent issues

| Isu | Percobaan | Akar | Status | Menahan? |
|---|---|---|---|---|
| tsc repo 1 galat di uji SR-44 | 0 (bukan area) | Ekspektasi AD-15 pra-D-247 | patch di file_requests | ya untuk "tsc 0" |
| 12 uji usang (SR-43 ingest x7, SR-44 display-field x3 + adapt-v1 x2) | 0 (bukan area) | Ekspektasi pra-D-247/IP-63 | patch di file_requests | tidak |
| Data 000 rev 2/3 tidak terekonstruksi | dry-run | Bug F-070 sebelum perbaikan | menunggu persetujuan controller | ya (rekonstruksi 000) |
| M6 status slot (compose/snapshot, completeness, R05) dan M8 sisa (templates/v2, profile) | 0 | Di luar area | file_requests | tidak |

## Keputusan dan catatan

| Butir | Keputusan |
|---|---|
| Kode penolakan render | `SCHEMA_INVALID` (400) + issue `checkId: "RENDER_FIELD"` + pesan tingkat atas menunjuk endpoint render (pola E41 DISPLAY_FIELD/V1_FIELD); tanpa kode galat baru (errors.ts di luar area) |
| R14 ikut digerbang | `commitV2Revision` dipakai R16, R06, dan R14; satu titik, jadi op struktur (setMeta klasifikasi, templateVersion) juga digerbang |
| Lingkup penilaian | seluruh snapshot hasil gabung (lihat H1) |
| Gerbang D-98 saat kiriman | `prepare` tidak lagi menolak berdasar versi TERBARU slug; dokumen ada = versi tersemat (`guardExistingDocumentWrite`), pembuatan = templat kiriman di dalam kunci. Efek samping kecil: aset base64 kiriman pembuatan ke templat terbatas oleh non-ADMIN tersimpan (dedupe sha) sebelum 403 |
| `gateInlineDocOverrides` | Bukan aturan yang sama (render mengupas per kunci; ingest menolak 403/422), jadi hanya pengurai kebijakan yang disatukan (`inlineFormatPolicyOf`) |
| Cek rekonstruksi | in-memory snapshot + baris dibaca balik (bukan `verifyReconstruction` penuh) agar tanpa kueri relasi tambahan; sensitivitas dibuktikan uji negatif |
| Low SR-55 (L1-L5) | Tidak dikerjakan (backlog sesuai D-244) |
| Token sesi uji | Asap memakai token uji in-process (`createSessionToken`) pada DB v21 lokal, pola sama dengan SR-45/SUB-1; tidak ada kredensial dicetak |

## Langkah berikut

- Controller: setujui/tolak usulan perbaikan data 000 rev 2/3 (`file_requests.md`, `f070_scan.json`).
- SR-43/SR-44: perbarui 12 uji + 1 galat tsc sesuai patch.
- Sajikan H1 (F-065) dan N-01 ke user bersama SR-57; review ulang keamanan disarankan (cakupan: `services/ingest/by-construction.ts`, `submit/pipeline.ts`, `revisions/v2/commit.ts`, `submit/integrity.ts`, `contract/schema/v2/forbidden.ts`).

## Audit perbaikan data F-070 (D-261, disetujui controller)

Cakupan: dokumen `000/GSP/STD/X/2026` rev 2 dan rev 3 SAJA, kolom `StudioRevision.snapshot` + `snapshotSha256`. Skrip `scratchpad/fixs_f070_repair.ts` (dry-run lalu `--apply`): per revisi satu transaksi, kunci advisory `studio-doc`, snapshot dibangun ulang dari baris (rebuildSource + recomposer, prevRows = baris), selisih wajib hanya pid/blockId, penjaga optimis sha lama, `verifyReconstruction` wajib cocok sebelum commit.

| Revisi | revisionId | sha sebelum | sha sesudah | Selisih | Terverifikasi |
|---|---|---|---|---|---|
| 2 | cmvk89lhh0001v1bkdz0f0y0w | c0709a66c07904508efc767eeb74cc03b1400d640688db70c28968fc0fac4caf | 4ca8ee3def2a57d7357641773f3d2d4465e4af28f08af8d637755428d2ca92f5 | /blocks/0..2/{pid,blockId} (F:controlSheet, F:cover, F:signature -> pid baris) | ya |
| 3 | cmvk95gt90001v1xcxjvbhb9a | c6a3d2573bdddbccc5b1476dc1bc40e464c5f60afb944653ec36b988555db434 | 3733f35b6b748e87485b497447d6131a23353612d9b8407de2ccbac123e9bf7a | sama | ya |

Cadangan asli (tulis atomik): `delegation_progress/f070_backup/doc000_rev2_snapshot_before.json`, `doc000_rev3_snapshot_before.json`; audit `audit_dryrun.json`, `audit_apply.json`.
Sesudah: pindai ulang `fixs_f070_scan.ts` -> 6/6 cocok (001#1, 002#1, 000#1-4), `scratchpad/f070_scan_after.json`; `projectContent` 000 rev 1-4 OK; cek in-tx D-258 atas 000 rev 2/3/4 = LOLOS. Revisi/dokumen lain tidak ditulis.
Catatan: penambahan klaim `f070_backup/**` + baris DB ke `file_claims.md` DITOLAK pengklasifikasi izin (Modify Shared Resources); klaim dicatat di sini, mohon controller menambahkannya.
