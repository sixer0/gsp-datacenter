---
task_id: DC-29+DC-30
task_slug: doc_artifact_studio
row: DC-29, DC-30
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/07_document_contract_blueprint.md (register masterplan/05_document_contract_specs.md §5.4, §6.1, §6.3, BA-29/BA-30)
status: complete
---

# Implementation Report: DC-29 seed templat kontrak + CH-06, DC-30 seed v21 dua kali

Deklarasi berkas (ditulis ke laporan ini dan `file_claims.md` sebelum menulis kode): `prisma/seed-studio.ts`, `src/lib/studio/services/templates/index.ts` (HANYA CH-06 + medan `contractKind` opsional ADMIN), `tests/unit/studio/seed/dc29-ch06-template-save.test.ts` (baru), laporan ini.

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Section type idempoten (52 dari registri) | complete | hanya baris baru/berbeda yang ditulis; jalan ulang 0 tulis, `updatedAt` tidak bergeser. `SECTION_REGISTRY_VERSION` tetap `2026-10-22.1` |
| 2 | Flag `--contract-templates` (pola `--presets-and-skeletons` datum-gsp v3) | complete | spesifikasi dicocokkan dengan C58 (slug, kerangka ringkas, jenis tanpa templat = galat); satu transaksi; dry-run = rollback |
| 3 | Templat `laporan-kerja-agen` | complete | `contractKind` agentWorkReport, kind DOCUMENT, preset `datum-gsp-preset` v2, esensial global dari preset (8), lapis `doc.defaultTier` NOTA / `doc.defaultTypeCode` LAP / `doc.typeCode` bawaan + LAP, kerangka SL-08..SL-10 |
| 4 | Penjaga | complete | templat lain (latestVersionNo, updatedAt, contractKind, jumlah versi, paramsSha256, skeletonSha256) dan `updatedAt` section type lain sama sebelum/sesudah, isi tersimpan dicek; gagal = rollback + exit 1 |
| 5 | CH-06 ke jalur simpan templat | complete | `saveTemplateV2` create (contractKind dari input) + version/R19 (contractKind templat), `importTemplateProfile` (pointer `/skeleton/slots`); CH-06 jalan SEBELUM `validateSkeleton` |
| 6 | Dry-run, seed nyata, jalan kedua di `gsp_agent_hq_v21` | complete | lihat Verification |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| prisma/seed-studio.ts | modify | `planSectionTypes`/`seedSectionTypes` berbasis selisih; `--contract-templates` (`CONTRACT_TEMPLATES`, `contractTemplateSpecs`, `contractTemplateLayer`, `snapshotTemplates`, `ensureContractTemplate`, `runContractTemplates`); `ensureSkeletonVersion` menerima `contractKind` opsional; dry-run boleh dengan flag ini dan melaporkan rencana section type; `reportCounts` memuat `contractKind` + `contractTemplates`; komentar kepala |
| src/lib/studio/services/templates/index.ts | modify | `assertContractRecordSkeleton` (CH-06 -> 400 SCHEMA_INVALID `details.issues[].checkId = SKELETON_CONTRACT_RECORD`); `CreateTemplateV2Input.contractKind` (C58 terdaftar, hanya ADMIN, ditulis ke `StudioTemplate.contractKind`); create memvalidasi contractKind (400 `/contractKind`, 403 `CONTRACT_TEMPLATE_ADMIN_ONLY`); version: bentuk -> findTemplate -> CH-06 + SR-06 |
| tests/unit/studio/seed/dc29-ch06-template-save.test.ts | add | 11 uji (transaksi palsu, tanpa DB) |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| typecheck | `npx tsc --noEmit -p .` | exit 0, 0 `error TS` (repo penuh) | seed termasuk cakupan tsconfig (`--listFilesOnly`) |
| lint | `npx eslint prisma/seed-studio.ts src/lib/studio/services/templates/index.ts tests/unit/studio/seed/dc29-ch06-template-save.test.ts` | exit 0 | |
| unit DC-29 | `npx vitest run tests/unit/studio/seed` | 11/11 lulus | |
| unit studio | `npx vitest run tests/unit/studio` | 120 berkas, 2898 lulus / 1 skip / 0 gagal | |
| dry-run | `npx tsx prisma/seed-studio.ts --contract-templates --dry-run` | exit 0, stderr kosong | snapshot DB sebelum = sesudah (`cmp` identik) |
| seed nyata | `npx tsx prisma/seed-studio.ts --contract-templates` | exit 0, stderr kosong | |
| jalan kedua | perintah sama | exit 0; `outcome unchanged`; snapshot = jalan 1 (`cmp` identik) | |
| HTTP | GET `http://127.0.0.1:9021/api/studio/templates` (rahasia uji lewat `$(cat ...)`, tidak dicetak) | tanpa rahasia 401; dengan rahasia 200, 7 templat memuat `laporan-kerja-agen` (x-correlation-id ab043a1f-60c9-4502-8ba6-d4295fbc6230) | |

## Verification
- Dry-run rencana = register: section type create `[contractRecord]`, update `[]`, unchanged 51; templat `laporan-kerja-agen` created v1 `contractKind agentWorkReport`; hitungan dalam transaksi 52 section type / 1 templat ber-contractKind; guard ok; lalu rollback (0 tulis, snapshot identik).
- Jalan 1: section type created `[contractRecord]`; templat created v1, `storedOk` true, `skeletonShaMatchesSeed` true, skeletonSha256 `0355fcea7c765d14d9dc88c5d064493005098ee6a3244ed27e3eba215bd2635f`, slot DB: record/contractRecord pos 1 positionLocked; content/chapter pos 2 repeatable minItems 1 admits 21; references/sourceRegister pos 3; semua `tiers []`; lapis `doc.defaultTier NOTA`, `doc.defaultTypeCode LAP`, `doc.typeCode [KT,PT,RAB,SPH,SP,BA,DS,STD,LAP]`; ch06Issues 0.
- Jalan 2: section type 0 tulis (52 unchanged), templat `unchanged` v1, guard ok.
- Hitungan (SQL `select count(*) from "StudioSectionType"`, `... from "StudioTemplate" where "contractKind" is not null`): sebelum 51 / 0 / versi 18 / slot 66; sesudah 52 / 1 / versi 19 / slot 69; byGroup DOCUMENT 30, PAGE_DEVICE 7, CHANNEL 15; `max(updatedAt)` section type selain contractRecord tetap `2026-10-30T03:16:29.989Z`.
- Templat lama: 6 templat (datum-gsp v3, datum-gsp-preset v2, datum-kanonik v6, datum-kanonik-preset v1, datum-manual-000 v4, datum-manual-000-preset v2) identik pada latestVersionNo, updatedAt, contractKind, jumlah versi, paramsSha256, skeletonSha256 (mis. datum-gsp `21f4e1e7...c182` / `396a4ad1...5bdd`).
- CH-06: kerangka laporan + contractKind lolos (create berhenti di preset TEMPLATE_NOT_FOUND pada DB palsu; seed nyata lewat layanan sukses); contractRecord tanpa contractKind 400 SCHEMA_INVALID `/template/skeleton/slots/0` dependentRequired; ganda maxContains `/slots/3`; berulang const; versi templat tanpa contractKind ditolak, ber-contractKind lolos.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| GET R01 menampilkan `contractKind: null` untuk `laporan-kerja-agen` padahal DB `agentWorkReport` | 0 (di luar lingkup "HANYA CH-06") | `toSummary` (templates/index.ts:142) belum memetakan `t.contractKind`; DC-05 hanya menambah tipe | terbuka; satu baris `contractKind: t.contractKind` untuk pemilik ringkasan templat (DC-18/DC-28 atau controller) | tidak untuk DC-29/30 |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 5 | Templat ber-contractKind tidak bisa dibuat lewat layanan tanpa medan input | ditambah `CreateTemplateV2Input.contractKind` (C58 terdaftar, ADMIN saja); route R01 tidak meneruskannya (pembuatan hanya seed/ADMIN layanan) |
| 5 | Urutan galat R02/R19 berubah: kerangka sekarang divalidasi sesudah `findTemplate` (CH-06 butuh contractKind templat) | hanya beda bila templat tidak ada DAN kerangka tidak sah (404 sebelum 400); suite studio hijau |
| 5 | CH-06 sebelum `validateSkeleton` agar ganda/berulang membawa checkId register, bukan SKELETON_* lama | diterapkan |
| 1 | `SECTION_REGISTRY_VERSION` tidak dinaikkan (keputusan seed dari DC-06) | tetap `2026-10-22.1`; menaikkan akan menulis ulang 51 baris lama |
| 3 | `doc.typeCode` = bawaan registri P3-20 + LAP (register "daftar bawaan"); sama dengan nilai efektif preset GSP | tercatat |
| 3 | Dry-run menulis entri log layanan "Templat v2 dibuat" walau transaksi di-rollback | perilaku sama dengan dry-run preset yang ada |
| - | Peringatan kanonik "berbeda dari registri" muncul di setiap jalan | sudah ada sebelum DC-29, tidak disentuh |

## Next Steps
- Pemetaan `contractKind` di `toSummary` (lihat Persistent Issues). Review recommended: diff `prisma/seed-studio.ts` + `services/templates/index.ts` (CH-06).
