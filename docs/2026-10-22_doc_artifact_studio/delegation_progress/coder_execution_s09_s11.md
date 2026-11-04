---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: S09, S11, S10, D-1 (D-597)
date: 2026-11-04
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/02_structured_datum_rev_a.md
status: complete
---

# Implementation Report: S09 helper seed bersama, S11 NDA, S10 pin latest, D-1 slot depan per tier

Skill dimuat: `backend-execution`, `tdd`, `dry-run-verify-fix`. Sumber: baris S09/S10/S11 cetak biru, `research/33` (kategori a dan c, A-01, A-02, A-04, C-01..C-06), D-590, D-594, D-595, D-597.

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| S09 | Ekstrak `presetSlotEssentials`, `ensureDerivedTemplate`, `runGuardedTemplateTx` (+ cek tersimpan generik dan AC-2) ke modul helper baru | complete | Baseline dry-run DEV direkam sebelum refaktor; sesudahnya log identik kecuali kunci tambahan `storedIssues` |
| S11 | `NDA` masuk enum `doc.typeCode`; bawaan tidak berubah | complete | Uji merah dulu (NDA ditolak), lalu hijau |
| S10 | `template: "latest"` = konstanta `DEFAULT_CLIENT_TEMPLATE_SLUG = "datum-gsp"`; heuristik `startsWith("datum-")`/`updatedAt` dihapus; cek slug `laporan-kerja-agen` diganti keanggotaan registri kontrak C58 | complete | Uji merah dulu (templat `datum-nota` lebih baru terpilih), lalu hijau |
| D-1 | Klien hanya mengirim slot depan yang ada di kerangka templat dan aktif untuk tier efektif | complete | Uji merah dulu (CONTENT_INVALID/SLOT_FORBIDDEN_FOR_TIER), lalu hijau; TERBIT tidak berubah |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| `prisma/seed-studio-templates.ts` | add | Helper bersama: `presetSlotEssentials` (kenop slot dari preset + override per slot tervalidasi), `derivedTemplatePlan`, `derivedTemplateStoredIssues` (contractKind null-aman + AC-2: restricted=false, archived=false, baseVersionId = versi preset terbaru; sidik kerangka, slot, lapis), `ensureDerivedTemplate` (CH-06 hanya bila `contractKind !== null`), `runGuardedTemplateTx` (tabel spec, satu transaksi, penjaga templat lain/section type, dry-run = rollback lewat `DryRunRollback`), `assertTxDatabase`, `snapshotTemplates`; dipindah dari seed apa adanya: `ensureSkeletonVersion` (kini menerima `contractKind: null` = wajib tanpa jenis kontrak), `knobValues`, `latestVersionOf`, `stable`, `asRecord`, `ADMIN_CALLER`, `SEED_ACTOR`, `DryRunRollback`, `TEMPLATE_V2_SCHEMA_ID`, `PRESET_TX_TIMEOUT_MS`, tipe `Tx`/`VersionRow` |
| `prisma/seed-studio.ts` | modify | Mengimpor helper; `buildSkeletonSlots` = pembungkus `presetSlotEssentials`; `ensureContractTemplate` + `runContractTemplates` lama diganti adaptor data `contractDerivedSpec` + `runGuardedTemplateTx` dengan label/pesan log yang sama; `ALLOWED_DATABASES` dan `assertDatabase` tidak disentuh; komentar kepala butir 7 menyebut helper |
| `src/lib/studio/params/governance-language.ts` | modify | `"NDA"` ditambahkan di akhir `enum` P3-20 `doc.typeCode`; daftar bawaan baris 114 tidak berubah |
| `scripts/studio/mcp/write-client-run.ts` | modify | S10: `DEFAULT_CLIENT_TEMPLATE_SLUG`, `resolveTemplate(template)` murni (tanpa R01), `CONTRACT_TEMPLATE_SLUGS` dari `CONTRACT_KIND_DEFS` (pesan galat sama persis). D-1: `templateShape` (R02 `definition.skeleton`, cadangan R19; tier bawaan `doc.defaultTier`, cadangan TERBIT seperti `compose/merge.ts:85`), `frontSlotsForTier` (aturan `isSlotActive` server), peringatan `FRONT_SLOTS_OMITTED`; dokumen baru: tier = `docMeta.tier` ?? bawaan templat; tulis ulang: kerangka versi templat dari R20 `content.template`, tier = `docMeta.tier` ?? `content.meta.tier` ?? bawaan; preflight, `toWrite`, `planned`, dan loop slot memakai slot terpilih |
| `tests/unit/studio/seed/s09-seed-template-helpers.test.ts` | add | 15 uji helper S09 (stub DB dalam memori, tanpa koneksi) |
| `tests/unit/studio/registry/s11-doc-typecode-nda.test.ts` | add | 4 uji S11 (NDA diterima, kode asing ditolak, bawaan tetap, `paramsSha256` kanonik literal tetap) |
| `tests/unit/studio/mcp/implw2-client.test.ts` | modify | Server tiruan: R02 (kerangka 7 slot + tier bawaan per slug), gerbang tier di R08/R13 dan R15 (meniru `structure.ts` SLOT_FORBIDDEN_FOR_TIER), opsi `seedMeta`/`seedTemplate`; 6 uji baru (S10 x2, D-1 x4) |
| `tests/unit/studio/mcp/implw3-client-mock.ts` | modify | Server tiruan bersama menjawab R02 (kerangka 7 slot, bawaan TERBIT) karena jalur buat dokumen kini membaca R02 |

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Unit seed (baru + lama) | `npx vitest run tests/unit/studio/seed/ --reporter=verbose` | 2 files, 26 passed | `dc29-ch06-template-save` 11 + `s09-seed-template-helpers` 15 |
| Unit S11 | `npx vitest run tests/unit/studio/registry/s11-doc-typecode-nda.test.ts` | 4 passed | merah sebelum perubahan: 1 failed (NDA ditolak) |
| Suite MCP | `npx vitest run tests/unit/studio/mcp/` | 31 files, 399 passed | baseline sebelum perubahan 393 passed; +6 uji baru; merah sebelum implementasi: 4 failed (S10 latest, D-1 NOTA baru, D-1 NOTA ada, R02 404) |
| Gabungan akhir | `npx vitest run tests/unit/studio/mcp/ tests/unit/studio/seed/ tests/unit/studio/registry/s11-doc-typecode-nda.test.ts` | 34 files, 429 passed | dijalankan sesudah suntingan terakhir |
| Suite studio penuh | `npx vitest run tests/unit/studio/` | 235 files: 234 passed, 1 failed (17 tests) | satu-satunya yang gagal `tests/unit/studio/engine-core/bind-language.test.ts` (milik baris lain yang sedang mengerjakan bind/format; uji merah TDD mereka), 4367 passed |
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | 0 galat di berkas saya | galat tersisa di berkas baris lain: `bind-language.test.ts` (13), `src/lib/studio/services/compose/snapshot.ts(427)` `wrapperLangOf` tak dikenal, `tests/unit/studio/renderers/s13-wrapper-text-en.test.ts(55,71)` |
| Lint | `npx eslint prisma/seed-studio.ts prisma/seed-studio-templates.ts src/lib/studio/params/governance-language.ts scripts/studio/mcp/write-client-run.ts tests/unit/studio/seed/s09-seed-template-helpers.test.ts tests/unit/studio/registry/s11-doc-typecode-nda.test.ts tests/unit/studio/mcp/implw2-client.test.ts tests/unit/studio/mcp/implw3-client-mock.ts` | exit 0, 0 problems | |
| Dry-run DEV | `npx tsx prisma/seed-studio.ts --contract-templates --dry-run` (DB `gsp_agent_hq_v21` dari `.env` repo; URL tidak dicetak) | exit 0, stderr kosong | lihat Verification |

## Verification

- **S09 dry-run DEV unchanged dan 0 tulis.** Baseline (sebelum refaktor) dan hasil akhir (sesudah S09+S11+S10+D-1) dibandingkan baris per baris setelah membuang `timestamp`/`correlationId`: 5 baris log, `identical(excl. storedIssues): true`. Ringkasan hasil akhir:
  - `Templat jenis kontrak` (info): `laporan-kerja-agen` outcome `unchanged`, `storedOk: true`, `storedIssues: []`, versionNo 1, baseVersionId `cmvue8kfk0001v1usfrh1fb94` (= id versi preset `datum-gsp-preset` v2), paramsSha256 `8f98fb0f...9534`; guard `ok: true`, changedTemplates `[]`, addedTemplates `[]`, sectionTypesTouched `[]`; counts `{sectionTypes: 52, contractTemplates: 1, templates: 7}`.
  - `Dry-run templat jenis kontrak selesai; transaksi di-rollback (0 tulis)`: plan `sectionTypes {create: [], update: [], unchanged: 52}`, templates `[laporan-kerja-agen unchanged v1 agentWorkReport]`, `guardOk: true`.
  - `Hitungan DB` sesudah run: 7 templat dengan jumlah versi/latestVersionNo/paramsSha256 sama dengan baseline (datum-gsp 3/3, datum-gsp-preset 2/2, datum-kanonik 6/6, datum-kanonik-preset 1/1, datum-manual-000 4/4, datum-manual-000-preset 2/2, laporan-kerja-agen 1/1).
  - Cek AC-2 baru (restricted, archived, baseVersionId) lolos pada baris DEV yang ada.
- **S09 0 blok seed per-templat tersalin:** loop esensial slot kini satu (`presetSlotEssentials`), dipanggil `buildSkeletonSlots` dan `derivedTemplatePlan`; runner transaksi kontrak = `runGuardedTemplateTx`. `grep` di `prisma/seed-studio-templates.ts` untuk `slug ===`, `startsWith`, literal slug: 0 hasil.
- **S09 penjaga DB:** `git diff -U0 prisma/seed-studio.ts` tidak mengubah `ALLOWED_DATABASES` atau `assertDatabase`; cek `current_database()` dalam transaksi dipindah utuh ke `assertTxDatabase` (pesan galat sama, diuji).
- **S11:** `canonicalVersionPayload().paramsSha256` = `a18d36eafa6bdabe9035d1a68b410c439177c33c342937a281205ed5ac517a9f` sebelum dan sesudah perubahan (diukur dengan skrip tsx sebelum suntingan; sama dengan `registryParamsSha256` log dry-run DEV); bawaan `["KT","PT","RAB","SPH","SP","BA","DS","STD"]` tetap.
- **S10:** `grep -n '"datum-\|laporan-kerja\|startsWith("datum\|-preset"' scripts/studio/mcp/write-client-run.ts` -> satu baris: `29:export const DEFAULT_CLIENT_TEMPLATE_SLUG = "datum-gsp";`. Uji: daftar R01 dengan `datum-nota` lebih baru -> R04 `template: { slug: "datum-gsp" }` dan peringatan `TEMPLATE_RESOLVED` menyebut datum-gsp; `template: "laporan-kerja-agen"` -> `INVALID_ARGUMENT` dengan pesan sama persis, 0 panggilan jaringan.
- **D-1:** templat tiruan bertier bawaan NOTA dengan muatan agen yang sama: 0 slot depan di R08 dan R13, COMPLETE, peringatan `FRONT_SLOTS_OMITTED`; dokumen `datum-gsp` yang ada dengan `meta.tier` NOTA: tulis ulang sukses tanpa slot depan, R02 dibaca dengan `?version=3` dari R20; TERBIT (`datum-gsp`): ketiga slot depan tetap dikirim dan dicek, tanpa peringatan baru; slug tak dikenal -> `TEMPLATE_NOT_FOUND` dari R02 sebelum R04 (0 tulis).

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| `tests/unit/studio/engine-core/bind-language.test.ts` merah (17 uji, 13 galat tsc) | 0 (bukan berkas saya) | Uji baris lain untuk `engine/bind` yang implementasinya belum ada (`bindNumberPatternSource`, `registerForSnapshot`, `Register.language`) | dilaporkan, tidak disentuh | Tidak untuk S09/S10/S11/D-1 |
| tsc `src/lib/studio/services/compose/snapshot.ts(427)` `wrapperLangOf` dan `tests/unit/studio/renderers/s13-wrapper-text-en.test.ts(55,71)` | 0 (bukan berkas saya) | Suntingan baris lain yang sedang berjalan | dilaporkan, tidak disentuh | Tidak untuk baris ini |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| S09 | `seed-studio.ts` menjalankan `main()` saat diimpor, jadi helper tidak dapat diuji unit dari berkas itu | Helper ditaruh di modul baru `prisma/seed-studio-templates.ts` (diizinkan brief); modul tidak membuka koneksi DB dan tidak memeriksa izin DB |
| S09 | CH-06 kini hanya dijalankan bila `contractKind !== null` (sesuai brief/research C-01). Untuk spec `contractKind: null` yang (keliru) memuat slot `contractRecord`, pertahanan seed CH-06 dilewati; layanan `createTemplateV2InTx` tetap menolak 400 SCHEMA_INVALID di dalam transaksi (rollback) | Hasil sama (galat + rollback), hanya teks galat berbeda; bila controller ingin pertahanan seed selalu aktif, cukup panggil CH-06 tanpa syarat (fungsi itu meloloskan kerangka tanpa slot record) |
| S09 | Urutan pemeriksaan dipertahankan: CH-06 tetap sebelum `validateSkeleton` (sidik kerangka dihitung di `ensureSkeletonVersion`, tidak di rencana) | Pesan galat untuk kerangka kontrak tidak sah sama dengan sebelumnya |
| S09 | Log laporan templat menambah satu kunci `storedIssues` (daftar alasan bila `storedOk` false); `kind` diisi dari `contractKind` spec | Satu-satunya beda log; selebihnya identik (diverifikasi) |
| S09 | `runPresetFlags` (SR-36/SR-38) tetap memakai cek DB dan tangkap dry-run sendiri (research C-05 "Pertahankan", AC-3 beku) | Tidak diubah |
| S10 | `resolveTemplate` tidak lagi memanggil R01; keberadaan/aksesibilitas templat kini diperiksa lewat R02 (D-1) | Slug tak dikenal -> `TEMPLATE_NOT_FOUND` dari R02 sebelum dokumen dibuat |
| D-1 | Medan `meta.tier` belum dikenal builder klien (`write-client.ts` `MetaField`/`docMetaOf`, milik S12): `meta.tier` agen saat ini dibuang dengan `META_IGNORED` dan tidak sampai ke server, sehingga tier dokumen baru lewat MCP = bawaan templat | Pemilih slot membaca `built.docMeta.tier` bila ada (otomatis berlaku bila S12 menambah `tier`), lalu tier dokumen di server (R20 `meta.tier`), lalu bawaan templat. Uji "datum-gsp + meta.tier NOTA" memakai dokumen yang sudah ada ber-tier NOTA. needs-review untuk controller: bila S29/S35 butuh `meta.tier` lewat MCP untuk dokumen baru, pemilik `write-client.ts` perlu meneruskan `tier` ke `docMeta` (bukan medan muatan baru: `tier` sudah medan DocMetaV2, D-594 "meta tetap bisa menimpa") |
| D-1 | Jalur buat dokumen kini melakukan satu GET R02 tambahan (baca saja); server tiruan uji yang membuat dokumen klien perlu menjawab R02 | `implw2-client.test.ts` dan `implw3-client-mock.ts` diperbarui; tulis ulang tanpa `content.template` di R20 = perilaku lama (semua slot depan, tanpa R02) |
| D-1 | Kerangka tidak diketahui (R02 tanpa `definition.skeleton` dan R19 tanpa `skeleton`) | Semua slot depan dikirim (perilaku lama) |

## Next Steps

- Review direkomendasikan (senior-code-reviewer), lingkup: `prisma/seed-studio-templates.ts`, diff `prisma/seed-studio.ts`, diff `scripts/studio/mcp/write-client-run.ts`; fokus D-595 (tanpa cabang slug/jenis) dan kesetaraan perilaku `--contract-templates`.
- Controller memutuskan butir needs-review D-1 (`meta.tier` lewat `write-client.ts`, pemilik S12).
- S27 dapat memanggil `runGuardedTemplateTx` dengan tabel spec `DerivedTemplateSpec` (`contractKind: null`, `slotOverrides` untuk `cover.kicker.text`) tanpa kode per slug.
- Tanpa commit, tanpa tulis DB (hanya dry-run), tanpa port/produksi. Berkas sementara di luar repo: `C:\Users\TRIAL\AppData\Local\Temp\seed-studio.before-s09.ts`, `write-client-run.before.ts`, `implw2-client.before.ts`, `s10_tests.py`, `s10_tests_append.ts`, `s11sha.ts` (salinan cadangan dan skrip bantu, aman dihapus).
