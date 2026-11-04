---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: S26, S27, S28, S29 (+ adendum controller D-602 dan adendum 2 kalibrasi S25)
date: 2026-11-04
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/02_structured_datum_rev_a.md
status: complete
---

# Implementation Report: S26 tabel spec, S27 flag `--doc-type-templates`, S28 fresh-seed `_uji`, S29 uji paritas pemakaian

Skill dimuat: `backend-execution`, `tdd`, `dry-run-verify-fix`. Masukan dibaca: baris S26-S29 dan §1-§4 cetak biru, `research/31` (register), `delegation_progress/coder_execution_s09_s11.md`, `coder_execution_s21.md`, `coder_execution_s22.md`, `coder_execution_s23.md` (bentuk `--spec`), `verification/21_datum_conformance_calibration.md`, D-590, D-594..D-602.

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| S26 | Tabel spec data murni 10 templat = lapis bersama x 5 lapis jenis x 2 lapis bahasa | complete | `prisma/seed-doc-type-templates.ts`; tanpa medan muatan/skema slot baru; tanpa kode per slug |
| S26-D602 | Nilai manual untuk kunci yang dikendalikan parameter templat (adendum 1 dan 2) | complete | `org.entityName` (CV-16) dan kenop slot toc `render.toc.mode = field` (TR-03/TR-08) diset; `color.wrapper.cream` TIDAK diset (terbukti tidak efektif di DOCX, lihat tabel D-602) |
| S27 | Flag `--doc-type-templates` lewat helper bersama S09, satu transaksi, `--dry-run`, idempoten, penjaga | complete | Section type dibekukan (opsi generik `freezeSectionTypes`); CH-06 kini tanpa syarat (keputusan S09 needs-review butir 1) |
| S27-DEV | `--doc-type-templates --dry-run` di DEV `gsp_agent_hq_v21` | complete | rencana 10 created, penjaga ok, 0 tulis DB (hitungan sesudah = 7 templat lama tetap) |
| S28 | `--doc-type-templates` dua kali di jalur fresh-seed `uji-run.mjs`, diperiksa dari log | complete | Dijalankan hanya terhadap `gsp_agent_hq_v21_uji`: jalan 1 = 10 created, jalan 2 = 10 unchanged |
| S29 | Uji paritas pemakaian U3 (11 templat, DB-less) + render DOCX murni untuk parameter D-602 | complete | 14 uji hijau; dua risiko tier/bahasa dan satu temuan how-to tercatat |
| NU-03 | Pengekspor JSON `--spec` | complete | `docTypeTemplateSpecJson()`; bentuk = `benchmark/datum_conformance/rules/language.ts` docblock dan `coder_execution_s23.md` §"Bentuk JSON --spec" (laporan S23 sudah ada, tanpa TODO) |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| `prisma/seed-doc-type-templates.ts` | add | `REV_A_TYPE_CODES`, `SHARED_LAYER` (`doc.typeCode` Rev A, `org.entityName` kapital), `SHARED_SLOT_OVERRIDES` (toc `render.toc.mode: field`), `RULE_INDEX_SLOT` (AUTO, opsional, sebelum `appendices`), `DOC_TYPE_LAYERS` (5), `LANGUAGE_LAYERS` (ID/EN; label EN `controlSheet`/`toc` dari `WRAPPER_TEXT`), `composeSpec`, `DOC_TYPE_TEMPLATE_SPECS` (10 = flatMap), `docTypeTemplateSpecJson()` (NU-03), `docTypeTemplateTxOptions(db, dryRun)` (opsi runner: label, pesan, `freezeSectionTypes: true`, hitungan) |
| `prisma/seed-studio-templates.ts` | modify | `DATUM_SKELETON_SLOTS` (kerangka 7 slot dipindah dari seed apa adanya, satu sumber); tipe `SlotShape` diekspor; CH-06 dijalankan untuk SETIAP spec (`contractRecordSkeletonIssues(plan.slots, spec.contractKind)`); opsi `freezeSectionTypes` di runner (penjaga gagal bila ada create/update/sentuhan section type); tanpa perubahan lain |
| `prisma/seed-studio.ts` | modify | Mengimpor `DATUM_SKELETON_SLOTS` (`SKELETON_SLOTS = DATUM_SKELETON_SLOTS`); flag `--doc-type-templates` + izin `--dry-run`; `runDocTypeTemplates` (3 baris, memanggil `runGuardedTemplateTx` dengan `docTypeTemplateTxOptions`); butir 8 di docblock + baris pemakaian. `ALLOWED_DATABASES`/`assertDatabase` tidak disentuh |
| `tests/integration/studio/uji-run.mjs` | modify | `checkDocTypeRun(stdout, expected)` (baca log JSON seed: penjaga ok, setiap templat `outcome` sesuai + `storedOk`); fresh-seed menambah 2 jalan `--doc-type-templates` (created lalu unchanged; gagal = exit 1); `runChild` menerima `onStdout` yang menerima keluaran SUDAH disaring |
| `tests/unit/studio/seed/s26-doc-type-template-specs.test.ts` | add | 9 uji: 10 slug unik = register (nama, kode, tier, bahasa, kicker, lapis), komposisi 5x2, kunci yang tidak boleh ditimpa, jenis slot = kerangka datum-gsp + `ruleIndex` AUTO STD, label per bahasa, EN bebas AC-6, nilai sah registri, rencana seed lolos `validateSkeleton`/CH-06, ekspor NU-03 |
| `tests/unit/studio/seed/s27-doc-type-seed.test.ts` | add | 12 uji: opsi runner, dry-run 10 created/0 tulis, jalan ulang unchanged, penjaga MERAH (templat lain berubah, templat liar bertambah, section type ditulis, AC-2 tidak sesuai, DB transaksi berbeda), CH-06 tanpa syarat, grep 0 kode per slug |
| `tests/unit/studio/compose/s29-usage-parity.test.ts` | add | 14 uji paritas pemakaian U3 + render DOCX murni D-602 |
| `docs/2026-10-22_doc_artifact_studio/delegation_progress/file_claims.md` | modify (append 1 baris) | klaim S26-S29 |

Cadangan sebelum suntingan (di luar repo, aman dihapus): `C:\Users\TRIAL\AppData\Local\Temp\seed-studio.before-s27.ts`, `seed-studio-templates.before-s27.ts`, `uji-run.before-s28.mjs`; log bukti di `C:\Users\TRIAL\AppData\Local\Temp\s27\` (`dt_dry2.out`, `ct_dry2.out`, `ps_dry.out`, `fresh2.out`, `spec_s26.json`, `summ.js`).

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Unit seed | `npx vitest run tests/unit/studio/seed/` | 4 files, 47 passed | termasuk `s09` (15) dan `dc29` (11) yang lama |
| Unit S29 | `npx vitest run tests/unit/studio/compose/s29-usage-parity.test.ts` | 14 passed | |
| Suite studio penuh | `npx vitest run tests/unit/studio/` | 251 files, 4657 passed, 0 failed | dijalankan sesudah suntingan terakhir |
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | exit 0, tanpa keluaran | seluruh repo |
| Lint | `npx eslint prisma/seed-studio.ts prisma/seed-studio-templates.ts prisma/seed-doc-type-templates.ts tests/unit/studio/seed/ tests/unit/studio/compose/s29-usage-parity.test.ts tests/integration/studio/uji-run.mjs` | exit 0, 0 problems | |
| Sintaks harness | `node --check tests/integration/studio/uji-run.mjs` | OK | |
| Merah TDD S26 | uji ditulis sebelum modul; adendum D-602 dan adendum 2 masing-masing merah dulu (`expected {...(5)}` / `expected {...(2)} to deeply equal { cover }`), lalu hijau | | |
| Merah TDD S27 | mutasi sementara: CH-06 bersyarat + tanpa pembekuan section type -> `2 failed / 10 passed`; dipulihkan -> `12 passed` | | |
| DEV dry-run | `npx tsx prisma/seed-studio.ts --doc-type-templates --dry-run` | exit 0, stderr kosong | lihat Verification |
| DEV dry-run kontrak | `npx tsx prisma/seed-studio.ts --contract-templates --dry-run` | exit 0, stderr kosong, `laporan-kerja-agen unchanged` | |
| DEV dry-run preset | `npx tsx prisma/seed-studio.ts --presets-and-skeletons --dry-run` | exit 0; datum-kanonik dan datum-gsp preset/template `unchanged`, guard true | bukti pemindahan `DATUM_SKELETON_SLOTS` tidak mengubah kerangka |
| Integrasi `_uji` | `node tests/integration/studio/uji-run.mjs fresh-seed` | exit 0; `doc-type-templates created: OK`, `doc-type-templates unchanged: OK` | `whoami` = `gsp_agent_hq_v21_uji`; dijalankan ulang dengan spec final |

## Verification

**S26 (AC-9 sebagian, RQ-1, RQ-8).** Uji S26 membandingkan dengan register `research/31` §1/§3 yang ditulis literal di uji. Grep: tiap slug dasar muncul tepat sekali di modul, tidak ada slug `-en` literal, tidak ada `slug ===`/`typeCode ===`/`startsWith`/`endsWith`/`switch` (uji `S27 0 kode per slug`).

**S27 dry-run DEV (`gsp_agent_hq_v21`), tanpa rahasia** (`grep -ciE "postgres(ql)?://|password"` = 0 pada semua log):

```
info Templat jenis dokumen DATUM Rev A {"db":"gsp_agent_hq_v21","dryRun":true,"sectionTypes":{"registry":52,"created":[],"updated":[],"unchanged":52},"counts":{"sectionTypes":52,"docTypeTemplates":10,"templates":17},"guard":{"ok":true,"other":7,"changed":[],"added":[],"touched":[]}}
   datum-proposal-teknis        created v1 storedOk=true [] contractKind=null base=cmvue8kfk0001v1usfrh1fb94 (= datum-gsp-preset v2) ch06=0 slots=7 skelMatch=true
   datum-proposal-teknis-en     created v1 storedOk=true [] ... slots=7
   datum-laporan                created v1 storedOk=true [] ... slots=7
   datum-laporan-en             created v1 storedOk=true [] ... slots=7
   datum-laporan-verifikasi     created v1 storedOk=true [] ... slots=7
   datum-laporan-verifikasi-en  created v1 storedOk=true [] ... slots=7
   datum-standar                created v1 storedOk=true [] ... slots=8 (ruleIndex:AUTO:false sebelum appendices)
   datum-standar-en             created v1 storedOk=true [] ... slots=8
   datum-nota                   created v1 storedOk=true [] ... slots=7
   datum-nota-en                created v1 storedOk=true [] ... slots=7
info Dry-run templat jenis dokumen selesai; transaksi di-rollback (0 tulis) {"sectionTypes":{"create":[],"update":[],"unchanged":52},"templates":[10 x created v1 contractKind null],"counts":{"sectionTypes":52,"docTypeTemplates":10,"templates":17},"guardOk":true}
info Hitungan DB [["datum-gsp",3,3,"21f4e1e727ac"],["datum-gsp-preset",2,2,"21f4e1e727ac"],["datum-kanonik",6,6,"7abfc5f758ac"],["datum-kanonik-preset",1,1,"7abfc5f758ac"],["datum-manual-000",4,4,"c901b47f1bd5"],["datum-manual-000-preset",2,2,"c901b47f1bd5"],["laporan-kerja-agen",1,1,"8f98fb0fe16b"]]
```

- `storedOk=true` per templat = cek AC-2 di dalam transaksi: `restricted` false, `archived` false, `contractKind` null, `baseVersionId` = versi terbaru `datum-gsp-preset`, sidik kerangka/slot/lapis sesuai.
- Lapis tersimpan contoh `datum-standar-en`: `doc.typeCode` 14 kode Rev A, `org.entityName` `PT GEMILANG SATRIA PERKASA`, `doc.defaultTypeCode` STD, `doc.defaultTier` TERBIT, `doc.language` EN.
- 0 tulis: "Hitungan DB" sesudah run = 7 templat lama dengan versi/latestVersionNo/paramsSha256 sama dengan baseline S09 (`coder_execution_s09_s11.md` Verification). Catatan: log layanan templat (`Templat v2 dibuat`, `Kerangka versi templat ditulis`) tetap ditulis ke JSONL workspace DEV `logs/templates/` saat dry-run walau transaksi di-rollback (sink berkas `services/templates/log.ts`, bukan DB); sifat yang sama berlaku untuk dry-run seed lain yang membuat versi.

**`--contract-templates --dry-run` tetap unchanged:** `laporan-kerja-agen unchanged v1 storedOk=true ch06=0`, guard ok, `changed/added/touched` kosong, counts `{sectionTypes: 52, contractTemplates: 1, templates: 7}`.

**S28 fresh-seed `_uji`** (keluaran yang sudah disaring `uji-run.mjs`, `[REDACTED]` 0 kali karena tidak ada rahasia dicetak):

```
### seed-studio --import-benchmark --import-datum-gsp            ### exit=0
### seed-studio --presets-and-skeletons --import-manual000-v2    ### exit=0  (x2)
### seed-studio --doc-type-templates (harapan: created)          ### exit=0
### doc-type-templates created: OK
### seed-studio --doc-type-templates (harapan: unchanged)        ### exit=0
### doc-type-templates unchanged: OK
```
Jalan 2: guard ok, `other: 6`, 10 templat `unchanged v1 storedOk=true`, base = `datum-gsp-preset` v1 DB uji; DB uji akhir 16 templat (6 dasar + 10 baru).

**S29 paritas pemakaian (AC-9).** Satu JSON (sampel how-to §2 tanpa `number`) lewat `buildClient` + bahasa label templat + slot depan per tier (D-1), lalu skema doc/v2, `defaultMeta`, P3-20, `mergeSubmission`, `composeV2`, kelengkapan, gerbang by-construction; templat dalam memori = profil GSP DATUM `benchmark/manual000/template.json` tanpa `lint.enforcement*` (pengganti `datum-gsp-preset`) + lapis `derivedTemplatePlan`.

- 11 templat valid: skema 0 isu, P3-20 null, penahan 0, kelengkapan COMPLETE.
- Isu, peringatan klien/compose, dan temuan lint (FAIL/WARN/REPORT) 10 templat = pembanding `datum-gsp` + meta setara bawaan templat (tier selain TERBIT, bahasa selain ID).
- Isi bab byte-identik untuk ke-11 templat (`stableStringify` slot content sama dengan datum-gsp TERBIT).
- Selisih snapshot hanya jalur milik templat (slug, typeCode, tier, language, docNumber, kerangka/label/kicker, slot depan berlabel, unit/blok slot `ruleIndex` tambahan); kontrol detektor: perubahan teks blok isi tertangkap sebagai `/blocks/i/textPlain`.
- Keluaran milik templat = register: kode jenis, tier, bahasa, nomor `001/GSP/<KODE>/XI/2026`, kicker slot cover, label slot, entitas kapital.
- Slot depan dokumen EN bebas string inti AC-6; NOTA: slot depan tidak dikirim, sama dengan `datum-gsp` + `meta.tier` NOTA.
- Meta agen menang: `datum-nota-en` + `meta.language ID` + `meta.tier TERBIT` -> dokumen ID TERBIT, slot depan dikirim berlabel ID; `datum-laporan` + `meta.tier SERAH` -> SERAH; `datum-gsp` + `meta.language EN` -> label EN.

## D-602: parameter templat untuk penyimpangan Rev A

| Butir | Parameter | Nilai diset | Bukti |
|---|---|---|---|
| CV-16 (entitas kolofon kapital, `ID:20`) | `org.entityName` (P4V-15, kelas B; dipakai `front/texts.ts:323`, `header-footer.ts:111`, `parts.ts:326`) | `"PT GEMILANG SATRIA PERKASA"` (lapis dokumen bersama, 10 templat) | preset menyimpan `PT Gemilang Satria Perkasa` (`benchmark/manual000/template.json:1082`); S29: nilai efektif templat baru kapital, pembanding huruf campur, tanpa isu baru |
| TR-03/TR-08 (daftar isi medan Word) | `render.toc.mode` (P-22 `params/render.ts:168`, kelas B, permukaan esensial, lingkup slot `toc`) | `"field"` sebagai **override kenop slot `toc` bersama** (bukan lapis dokumen) | preset menyalin `static` ke kenop slot toc (`presetSlotEssentials`; teramati `{"render.toc.mode":"static","device.sealBand.enabled":true}`), dan `tocModeFor` membaca kenop slot dulu (`engine/docx/assemble/units.ts:144-161`), jadi nilai di lapis dokumen akan tertimpa. Render murni TERBIT `datum-laporan` dan `datum-laporan-en`: DOCX XML sah, memuat ` TOC \o "1-n" \h \z \u `; pembanding (static) tanpa medan; log render non-info sama; isu/lint sama |
| SB-02 (teks pita segel `F4F5F6`, `ID:2573`) | `color.wrapper.cream` (P4C-07, kelas B, lanjutan) ada dan menerima `F4F5F6` (0 galat lapis) | **tidak diset** | tidak efektif di DOCX: roleFormat preset `wrapper.sealBand.run.color = F6E9E9` (`benchmark/manual000/template.json:1660-1671`, dibawa versi preset/templat) menang atas parameter (`docx/wrapper/render.ts:331-333`). Uji S29: dengan `cream F4F5F6` warna run pita tetap `F6E9E9`; kontrol tanpa roleFormat itu = `F4F5F6`. Menyetelnya hanya akan mengubah HTML (`--w-cream`) sehingga DOCX dan HTML berbeda. Kalibrasi `verification/21` §330 tidak memperhitungkan roleFormat ini |
| GF-13 (warna klasifikasi seal) | tidak ada parameter DOCX: `color.classificationInk` (P4C-35) hanya dibaca HTML (`engine/html/base/params.ts:57`); DOCX INK900 tertulis keras (`header-footer.ts:55, 59`) | tidak diset | penyimpangan non-kritis diketahui (F-4/D-598) |
| RH-03 (garis kepala seal 0,26 mm) | tidak ada parameter (`header-footer.ts:73` INK200 sz 5) | - | penyimpangan non-kritis diketahui |
| RB-05 (garis atas register seal) | tidak ada parameter (`header-footer.ts:324` INK900 sz 8) | - | penyimpangan non-kritis diketahui |

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| SB-02 tidak dapat diperbaiki lewat parameter | 1 (render murni) | roleFormat preset `wrapper.sealBand` memuat warna eksplisit | dilaporkan; opsi di Issues & Decisions | Tidak (non-kritis); memengaruhi skor S36 |
| Sampel how-to §2 apa adanya ditolak klien | 0 (dokumen milik S30) | contoh JSON tanpa `meta.author` (META_MISSING) dan tabel berketerangan tanpa `source` (SOURCE_MISSING) | penolakan identik untuk ke-11 templat (diuji); S29 memakai sampel yang dilengkapi data saja | Tidak untuk S26-S29; perlu perbaikan contoh di S30 |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| S26 | Kerangka 7 slot ada di `seed-studio.ts` yang menjalankan `main()` saat diimpor | Dipindah apa adanya ke helper bersama (`DATUM_SKELETON_SLOTS`); dry-run `--presets-and-skeletons` tetap unchanged |
| S26 | Label EN `controlSheet`/`toc` | Diambil dari `WRAPPER_TEXT.controlKicker.EN` / `tocKicker.EN` (label lembar kendali tercetak sebagai kicker), label lain dari register §3.3 |
| S26 | `render.toc.title` tetap kosong (F-6), `wrapper.header`/`device.issueStamp.format` tidak ditimpa | Diuji (kunci tidak muncul di lapis maupun override) |
| S26-D602 | `render.toc.mode` ditempatkan sebagai override kenop slot toc, bukan lapis dokumen | Alasan: nilai preset `static` tersalin ke kenop slot dan menang; tetap data bersama untuk 10 templat |
| S26-D602 | `color.wrapper.cream` tidak diset | **needs-review controller**: pilihan (a) terima SB-02 sebagai penyimpangan non-kritis; (b) perluas `DerivedTemplateSpec` dengan `roleFormats` bersama (override `wrapper.sealBand.run.color = F4F5F6`), data saja, tetapi roleFormats adalah medan templat khusus ADMIN, bukan parameter, dan cek idempotensi `ensureSkeletonVersion` belum membandingkan roleFormats (perlu tambahan di helper) |
| S27 | Penjaga "section type tidak tersentuh" | Opsi generik `freezeSectionTypes` di runner (jalur kontrak tidak memakainya, perilaku S09 tetap; log kontrak identik) |
| S27 | CH-06 tanpa syarat (S09 needs-review butir 1) | Spec non-kontrak dengan slot `contractRecord` gagal di seed sebelum tulis (diuji); 10 spec lolos CH-06 |
| S29 | Pembanding PT bertier SERAH | Diperluas dari aturan §1 butir 6 (NOTA): pembanding = datum-gsp + meta setara (tier, bahasa). Terhadap datum-gsp polos, 8 templat tanpa temuan baru |
| S29 | R-S29-1: tier SERAH bawaan PT menambah temuan lint D16 "seksi wajib tier SERAH" (registerTable, derivation, evidenceRail, reconciliation) | Non-penahan, sama dengan datum-gsp + `meta.tier SERAH`; risiko untuk konformitas/kesan pengguna PT |
| S29 | R-S29-2: dokumen EN bertier SERAH (PT-EN) mendapat D01 FAIL "angka 1.1 tidak tertelusur ke register" pada subjudul sumber `1.1 Background` | Non-penahan; sama dengan datum-gsp + `meta.language EN` + `meta.tier SERAH`. Tampaknya pola angka EN lint D01 (S16-S18) menganggap nomor subjudul sebagai desimal. Di luar berkas saya (`src/**`); **needs-review** pemilik lint |
| S29 | Templat EN menambah cek NOT_RUN C-20, C-34 | Bukan temuan (cek tidak berlaku), dikeluarkan dari pembandingan |
| S29 | Muatan R04+R13+R12 klien dimodelkan sebagai satu kiriman doc/v2 di jalur ingest murni | Isi dan slot sama dengan yang dikirim klien; jalur submit bab/slot tidak dijalankan (butuh DB) |
| NU-03 | Bentuk `--spec` | Mengikuti S23 (`schema: datum-template-spec/v1`, `templates[{slug, params}]`, 5 kunci). Contoh berkas: `npx tsx -e 'import { docTypeTemplateSpecJson } from "./prisma/seed-doc-type-templates"; process.stdout.write(JSON.stringify(docTypeTemplateSpecJson(), null, 1))' > spec.json` (dijalankan: 10 baris, nilai = register; salinan di `C:\Users\TRIAL\AppData\Local\Temp\s27\spec_s26.json`) |
| - | `tests/integration/studio/studio-db.integration.test.ts` tercatat termodifikasi di `git status` | Bukan suntingan saya (baris lain); tidak disentuh |

## Next Steps

- Controller: jalankan seed DEV nyata `--doc-type-templates` (S34); dry-run sudah menunjukkan rencana 10 created tanpa perubahan templat lain.
- Controller: putuskan SB-02 (opsi a/b di atas), R-S29-2 (D01 EN), dan perbaikan contoh JSON how-to (S30: tambah `author` dan `source` tabel).
- S36: berikan `--spec` dari `docTypeTemplateSpecJson()` agar NU-03 terlatih.
- Review recommended (senior-code-reviewer), lingkup: `prisma/seed-doc-type-templates.ts`, diff `prisma/seed-studio-templates.ts` (CH-06 tanpa syarat, `freezeSectionTypes`, `DATUM_SKELETON_SLOTS`), diff `prisma/seed-studio.ts` (flag), `tests/integration/studio/uji-run.mjs`, tiga berkas uji baru; fokus D-595 (tanpa cabang slug/jenis).
- Tanpa commit. Tulis DB nyata hanya ke `gsp_agent_hq_v21_uji` (fresh-seed, dua kali); DEV `gsp_agent_hq_v21` hanya dry-run.
