---
task_id: 2026-10-22_doc_artifact_studio
task_slug: doc_artifact_studio
row: DC-04
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/masterplan/05_document_contract_specs.md
status: complete
---

# Implementation Report: DC-04 delta Prisma document contract + migrasi 20261030220000_add_studio_contract

Register mengikat: `masterplan/05_document_contract_specs.md` §7.1-§7.5, §8.1, BA-04 §18; keputusan D-21, D-363. Hanya `gsp_agent_hq_v21` (localhost:5433) dan `gsp_agent_hq_v21_shadow` disentuh; DATABASE_URL tidak dicetak (nama DB dicek di proses: `/gsp_agent_hq_v21`; shell tanpa override DATABASE_URL). Tidak ada `migrate dev` / `db push`; server tidak dijalankan.

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Hitungan baris semua tabel public SEBELUM | done | 54 tabel; `_prisma_migrations` 7 |
| 2 | Baseline `migrate diff --from-migrations --to-schema-datamodel` (shadow) SEBELUM edit | done | exit 0; 5 pernyataan drift lama (4 DROP INDEX ilsearchdoc_* + ALTER `tsv` DROP DEFAULT), sama dengan SR-03 |
| 3 | Edit `schema.prisma` aditif | done | 106 tambah / 0 hapus (`git diff --stat`); CRLF dipertahankan (1307/1307 baris CRLF); sha pra `0e0972ae…adf46`, pasca `9f29b4e3…14bd` |
| 4 | `prisma validate` | done | "The schema at prisma\schema.prisma is valid", exit 0 |
| 5 | Diff penuh dikurangi baseline (5 blok, tiap blok ditemukan tepat 1x, byte-identik) dan blok otomatis `ADD COLUMN "tsv" tsvector` diganti SQL tangan GENERATED + GIN | done | 27 blok Prisma + 2 pernyataan tangan; skrip `build_mig.py` (scratchpad) memakai assert |
| 6 | Penjaga §7.4 | PASS | lihat Verification |
| 7 | Gladi di shadow: replay semua migrasi (termasuk baru) lalu diff | done | exit 0 (SQL tereksekusi); residu = 5 baseline + 2 pola sama untuk `StudioDocBlock.tsv` |
| 8 | `prisma migrate deploy` | done | "Applying migration `20261030220000_add_studio_contract`" … "All migrations have been successfully applied." |
| 9 | `prisma migrate status` | done | "8 migrations found … Database schema is up to date!" |
| 10 | `prisma generate` | done | "Generated Prisma Client (v6.19.2)", exit 0 (tanpa EPERM; :9021 mati) |
| 11 | Hitungan baris SESUDAH + probe DB | done | identik; lihat Verification |
| 12 | Rollback delta disimpan | done | `prisma/rollback/03_rollback_studio_contract_delta.sql` diekstrak byte-identik dari blok §7.5 (17 baris, LF); tidak digladikan (milik DC-38, `_uji`) |
| 13 | `npx tsc --noEmit -p tsconfig.json` | done | exit 0, 0 `error TS` |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| `prisma/schema.prisma` | modify (aditif) | MX08 `StudioTemplate.contractKind` + idx; MX09 6 kolom cermin `StudioDocument` + 5 idx (1 GIN); MX10 `StudioDocBlock.tsv Unsupported("tsvector")?` + komentar larangan db push/migrate dev; MX11/MX12 relasi `contractRecord` di `StudioRevision`/`StudioDocSection`; model baru M19 `StudioContractRecord`, M20 `StudioContractItem`, M21 `StudioDocRef` persis §7.1 |
| `prisma/migrations/20261030220000_add_studio_contract/migration.sql` | add | 151 baris, LF, sha256 `4992bcdf14744d65558f2cce43231720602087797ef238213bb3f77ee32a1e0d` = `_prisma_migrations.checksum` (applied_steps_count 1, rolled_back_at null) |
| `prisma/rollback/03_rollback_studio_contract_delta.sql` | add | teks §7.5, sha256 `994ccb666d83385dc048cf6fca82ff68b7e7424fe22c62119683fd791307a84a` |
| `docs/.../delegation_progress/coder_execution_dc04.md` | add | laporan ini |

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Schema | `npx prisma validate` | exit 0 | valid |
| Migrasi | `npx prisma migrate deploy` | exit 0 | 1 migrasi diterapkan ke v21 |
| Migrasi | `npx prisma migrate status` | exit 0 | up to date (8) |
| Client | `npx prisma generate` | exit 0 | |
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | exit 0 | 0 galat; berjalan saat DC-17/DC-19 sedang menulis (berkas mereka ikut terkompilasi, tanpa galat) |
| Lint/test | - | tidak relevan | baris ini hanya skema + SQL; tidak ada kode TS baru |

## Verification

Penjaga §7.4 (grep atas `migration.sql`):
- `DROP`: 0
- `CREATE TABLE`: 3; non-`"Studio`: 0
- `CREATE TYPE`: 0
- `CREATE [UNIQUE] INDEX`: 19 (18 Prisma + 1 tangan `StudioDocBlock_tsv_idx`); nama/target non-`Studio`: 0
- `ADD CONSTRAINT`: 4; semua `FOREIGN KEY` dari `"Studio…` ke `REFERENCES "Studio…`: 4
- `ADD COLUMN`: 8 (StudioDocument 6, StudioTemplate 1, StudioDocBlock 1 tangan)
- `IlSearchDoc|pg_trgm|WorkerTrace|Role`: 0; `ALTER COLUMN|RENAME`: 0; identifier non-Studio setelah TABLE/ON/REFERENCES: 0

DB pasca-deploy (probe `$queryRaw`, v21):
- 8 kolom delta ada di `information_schema.columns`; `tsv` `is_generated = ALWAYS`, ekspresi `to_tsvector('simple'::regconfig, "left"(COALESCE("textPlain", ''::text), 100000))`
- 22 indeks delta = 19 + 3 pkey; `StudioDocBlock` 2251 baris, 2251 ber-`tsv`; kueri `tsv @@ websearch_to_tsquery('simple', 'laporan')` = 76 baris
- delegasi klien baru `studioContractRecord/Item/DocRef.count()` = 0/0/0; `StudioDocument.contractCardIds` bawaan `[]`
- Diff DB nyata → skema = 7 pernyataan drift yang sama dengan replay shadow (tanpa objek delta lain yang tertinggal)

Hitungan baris sebelum = sesudah (semua 54 tabel lama; satu-satunya perubahan `_prisma_migrations` 7 → 8; 3 tabel baru = 0):
StudioArtifact 0, StudioAsset 27, StudioBlock 2386, StudioDocBlock 2251, StudioDocChapter 165, StudioDocIdentity 598, StudioDocSection 250, StudioDocSubsection 876, StudioDocument 6, StudioOutputFile 41, StudioRenderJob 32, StudioRevision 38, StudioSectionType 51, StudioTemplate 6, StudioTemplateSlot 66, StudioTemplateSlotParam 81, StudioTemplateSlotRoleFormat 0, StudioTemplateVersion 18; AgentRequest 757, HermesTask 2680, IlSearchDoc 18186, WorkerTrace 1488, HermesMemory 878, WebUiUser 9, OrchestrationRecord 681.

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| - | - | - | none | no |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| 5 | Prisma menghasilkan `ADD COLUMN "tsv" tsvector` biasa untuk `Unsupported` | Blok otomatis dibuang, diganti SQL tangan GENERATED STORED + GIN (§7.3, preseden 20260927154000) |
| 7, 11 | Baseline drift D-21 untuk migrasi berikutnya naik dari 5 menjadi 7 pernyataan: tambahan `DROP INDEX "StudioDocBlock_tsv_idx"` dan `ALTER TABLE "StudioDocBlock" ALTER COLUMN "tsv" DROP DEFAULT` | Diharapkan (pola sama dengan IlSearchDoc; indeks GIN sengaja tidak dideklarasikan di Prisma per §7.2). Agen migrasi berikutnya WAJIB mengurangi ketujuhnya; perlu dicatat controller |
| 12 | Rollback tidak dijalankan | Sesuai §7.5: gladi milik DC-38 di `gsp_agent_hq_v21_uji` |
| - | `file_claims.md` tidak ditulis | Di luar daftar kepemilikan brief; controller sudah mendeklarasikan klaim |

## Next Steps

- Controller: catat baseline drift baru (7 pernyataan) untuk D-21; DC-09/DC-14 kini bisa memakai M19-M21, MX09 dan `tsv` (dibaca via `$queryRaw`).
- Server :9021 boleh dijalankan ulang (klien sudah digenerate ulang). Review recommended (scope: diff `prisma/schema.prisma` + `migration.sql`).
