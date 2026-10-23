---
task_id: 2026-10-22_doc_artifact_studio
task_slug: doc_artifact_studio
row: SR-03
date: 2026-10-23
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/05_structural_sections_blueprint.md
status: complete
---

# Marker: migrasi struktur mendarat (SR-03)

Migrasi `prisma/migrations/20261023200000_add_studio_structure/migration.sql` diterapkan ke `gsp_agent_hq_v21` (localhost:5433) lewat prosedur D-21 / 01_specs §2. DB produksi `gsp_agent_hq` tidak disentuh.

- sha256 `migration.sql` = `abff9bacda61f23e92b0556249dc6b4ff42f9c3c3863315d1f77ccf4b8c9a45d` (330 baris, LF); `_prisma_migrations.checksum` sama, `applied_steps_count` 1, `rolled_back_at` null, selesai 2026-10-22T22:42:50Z.
- sha256 `prisma/schema.prisma` pasca-edit = `0e0972aed0483c1250071462090bb2711e1888d049df2d50a09a8430cd8adf46` (pra-edit `97ac0717…39da3`; CRLF dipertahankan; `git diff --stat` = 595 tambah, 0 hapus terhadap HEAD).

## Yang mendarat (sesuai register SR-01 §3)

Enum (3): `StudioSlotContentMode {AUTO INPUT MIXED}`, `StudioRenderScopeKind {DOCUMENT CHAPTER SLOT}`, `StudioCompleteness {INCOMPLETE COMPLETE}`.

Model baru (9), kolom persis register §3.1:

| ID | Model | Unik/indeks | FK onDelete |
|---|---|---|---|
| M10 | `StudioTemplateSlot` | `[templateVersionId, slotKey]`, `[templateVersionId, position]`, idx `sectionTypeKey` | templateVersion Cascade; sectionType Restrict |
| M11 | `StudioTemplateSlotParam` | `[slotId, paramKey]`, idx `paramKey` | slot Cascade |
| M12 | `StudioTemplateSlotRoleFormat` | `[slotId, roleKey]` | slot Cascade |
| M13 | `StudioAsset` | `sha256` unik, `relPath` unik, idx `missionFolder` | - |
| M14 | `StudioDocSection` | `[revisionId, slotKey]`, `[revisionId, position]`, idx `templateSlotId` | revision Cascade; templateSlot Restrict; sectionType Restrict |
| M15 | `StudioDocChapter` | `[revisionId, chapterKey]`, `[docSectionId, position]`, idx `[revisionId, contentSha256]`, idx `identityId` | revision, docSection Cascade; identity NoAction (KD-07) |
| M16 | `StudioDocSubsection` | `[chapterId, sectionNo]`, idx `identityId` | revision, chapter Cascade; identity NoAction |
| M17 | `StudioDocBlock` | `[revisionId, ordinal]`, `[revisionId, pid]`, `[revisionId, address]`, 5 idx | revision, docSection, chapter, subsection Cascade; identity NoAction; asset Restrict |
| M18 | `StudioDocIdentity` | `[documentId, pid]`, idx `[documentId, kind]` | document Cascade |

Kolom tambahan (14) pada tabel lama: `StudioTemplate.isPreset` (+ idx); `StudioTemplateVersion.skeletonSha256`; `StudioDocument.missionDocKey`, `.completeness` (+ unik `[missionFolder, missionDocKey]`); `StudioRevision.schemaId` (default `studio.doc/v1`), `.structureSha256`, `.completeness`, `.completenessReport`, `.changeScope`; `StudioRenderJob.scopeKind`, `.scopeKey`; `StudioOutputFile.scopeKind`, `.scopeKey`, `.draft`. Relasi balik tanpa SQL: `StudioSectionType.templateSlots/docSections`, `StudioTemplateVersion.slots`, `StudioDocument.identities`, `StudioRevision.docSections/docChapters/docSubsections/docBlocks`.

## Bukti prosedur

| # | Langkah | Hasil |
|---|---|---|
| 2 | baseline diff SEBELUM edit (shadow `gsp_agent_hq_v21_shadow`) | exit 0; 5 pernyataan drift IlSearchDoc (4 DROP INDEX + ALTER `tsv` DROP DEFAULT) = sama dengan S03/INT-K |
| 3 | edit skema aditif; `prisma validate` | "The schema at prisma\schema.prisma is valid", exit 0 |
| 4-5 | diff penuh (82 blok) dikurangi baseline (5 blok, tiap blok ditemukan tepat sekali, teks byte-identik) | 77 blok; `diff full.sql migration.sql` hanya menghapus 5 blok baseline |
| 6 | penjaga isi | DROP 0; CREATE TABLE 9 (non-Studio 0); CREATE TYPE 3 (non-Studio 0); CREATE [UNIQUE] INDEX 30 (non-Studio 0; nama = 30 nama register); ADD CONSTRAINT 20 = 20 FOREIGN KEY (nama = 20 nama register; sasaran non-Studio 0); ALTER TABLE 26 = 6 ADD COLUMN-statement + 20 FK, semua `"Studio…`; ADD COLUMN 14; ALTER COLUMN/RENAME/DROP 0; penyebutan WorkerTrace/IlSearchDoc/"Role"/pg_trgm 0 |
| 8 | `migrate deploy` (DATABASE_URL .env → `/gsp_agent_hq_v21`, tanpa override shell) | "Applying migration `20261023200000_add_studio_structure`" … "All migrations have been successfully applied." |
| 9 | `migrate status` | "7 migrations found … Database schema is up to date!" |
| 10 | diff ulang migrations → schema | identik dengan baseline (AFTER_EQUALS_BASELINE); diff DB nyata → schema: 0 baris menyebut Studio |
| 11 | `prisma generate` | klien JS/TS ditulis ulang (index.d.ts/index.js memuat model baru; probe: 9 delegasi baru `count()` = 0, groupBy `completeness`/`schemaId` jalan, 3 enum diekspor) TETAPI langkah akhir gagal EPERM: `query_engine-windows.dll.node` dikunci `next dev` (PID 26588). Biner mesin byte-identik (`cmp`), jadi klien fungsional; lihat catatan |
| 12 | hitungan baris sebelum = sesudah | AgentRequest 757, HermesTask 2680, IlSearchDoc 18186, WorkerTrace 1488, HermesMemory 878, WebUiUser 9, OrchestrationRecord 681; StudioTemplate 3, StudioTemplateVersion 8, StudioSectionType 51, StudioDocument 3, StudioRevision 3, StudioBlock 446, StudioArtifact 0, StudioOutputFile 9, StudioRenderJob 3 (COUNTS_IDENTICAL) |

Pasca: tabel `Studio%` di DB = 18, tipe baru = 3; 3 dokumen dan 3 revisi lama bernilai default `COMPLETE` / `studio.doc/v1`.

tsc seluruh repo (`npx tsc --noEmit -p tsconfig.json`) sesudah generate: exit 0, 0 galat.

## Catatan

- Server `next dev` (PID 26588) memegang klien LAMA di memori: model baru tidak terlihat di route sampai server di-restart. Salinan `node_modules/.prisma/client/schema.prisma` masih versi lama (langkah salin terakhir generate tak tercapai; runtime memakai `inlineSchema` di index.js). Setelah server dihentikan: `npx prisma generate` sekali lagi.
- Rollback delta tetap teks 03 §3.5 (digladikan SR-53 di `_uji`).
