---
type: mixed
confidence: medium-high
task_id: doc_artifact_studio
step: S01
agent: data-analyst
date: 2026-10-22
status: complete
binding: D-01..D-23 (decisions/decisions.md); KT-01..KT-17 diputus D-22
inputs: identification/02_structured.md, identification/03_blueprint_addendum.md, research/01..07, delegation_progress/file_requests.md (permintaan S02)
---

# 01 Spesifikasi Kontrak: Doc Artifact Studio (S01)

Dokumen ini adalah register nama tunggal untuk S03 (contract landing) dan semua baris paralel. Aturan baca:
- Setiap nama kode didefinisikan TEPAT SATU KALI di tabel register yang berawalan ID (`M`, `E`, `R`, `C`, `I`, `T`, `U`, `D`, `P`). Di tempat lain nama hanya dirujuk.
- Satuan OOXML dipakai apa adanya: `Tw` = twip (1/20 pt), `HalfPt` = setengah poin (`w:sz`), `Eighth` = 1/8 pt (border `w:sz`), `Mm` = milimeter.
- Bentrok penamaan riset: `K-xx` dipakai tiga kali (klaster badan research/07, konflik katalog research/01 §7.1, kode chart komposisi). Di dokumen ini: **klaster badan = `K-xx`/`KT-xx` (research/07)**, **konflik katalog = `konflik Kc-xx`** (di kode medan `conflictRef: "K-xx"`), **kode chart = `chart K-xx`**. Langkah blueprint ditulis `Snn`; registri section katalog ditulis `sec:Snn`.
- Tier naratif: keputusan desain memakai format Keputusan (alternatif + alasan, tier 1); register nama tier 3.

## 0. Source Tasks, eksplorasi dan koleksi

| Sumber | Dipakai untuk | Bukti |
|---|---|---|
| Blueprint rev 3 baris S01, §1.6, §7, §10, Execution Profile | lingkup, nama modul, kriteria | `identification/02_structured.md:149, 80-135, 427-460, 528-542, 258-382` |
| Addendum S100-S102 | route `/render-env`, `TemplatePreviewPane` | `identification/03_blueprint_addendum.md:7-11` |
| D-04, D-06, D-10, D-15, D-17, D-21, D-22, D-23 | aturan mengikat | `decisions/decisions.md:10,29,15,20,22,26,27,28` |
| Katalog 673 parameter, 51 section, lint 83+16 | ParamDef, registri | `research/01_manual_parameter_catalog.md:815-831, 833-890, 972-1003` |
| Pola repo | auth, route, Prisma | `research/02_codebase_map.md:198, 456-472`; `src/lib/require-session.ts:32-73`; `src/lib/hq-session.ts:19-24` |
| Mesin DATUM | antarmuka port | `research/03_datum_engine_inventory.md:145-316, 497-525` |
| Kalibrasi | kontrak soffice, render-env | `research/05_render_calibration.md:15-34` |
| Peta chart + paritas | registri chart, `data-mark` | `research/06_chart_map_parity_matrix.md:77-191, 249-300` |
| Inventaris benchmark | pemetaan 76 klaster | `research/07_benchmark_inventory.md:116-153, 202-243, 251-330, 634-766, 869-990` |
| Prisma CLI lokal | `--from-migrations` butuh shadow DB | `node_modules/prisma/build/index.js:3824-3831` |
| Drift IlSearchDoc | diff mentah memuat rebuild indeks | `prisma/schema.prisma:556-563`; `prisma/migrations/20260927154000_add_ilsearchdoc/migration.sql:29-37` |

Kelengkapan data: cukup. Satu data tidak dapat diambil dengan alat agen ini: tanggal rilis npm (tanpa akses registry). Penanganannya di §10 (aturan verifikasi S03), bukan tebakan.

## 1. Register nama data (Prisma)

### 1.1 Keputusan desain data (tier 1)

| ID | Keputusan | Alternatif ditolak | Alasan dan bukti |
|---|---|---|---|
| KD-01 | Relasi Prisma hanya antar-model Studio; tautan misi = kolom string `missionFolder`, `agentRequestId`, `hermesTaskId` tanpa FK | FK ke `AgentRequest`/`HermesTask` | Pola repo: tidak ada relasi antar model misi (`research/02:198`); FK ke tabel lama membuat rollback menyentuh tabel lama |
| KD-02 | Agregat dokumen: `StudioDocument` -> `StudioRevision` -> `StudioBlock`/`StudioOutputFile`/`StudioRenderJob` `onDelete: Cascade`; rujukan lintas agregat (`StudioTemplateVersion`, `StudioTemplate`) `onDelete: Restrict` | Restrict di semua | Tidak ada API hapus; Cascade hanya memudahkan pembersihan DB uji (S75/S82); Restrict melindungi versi template yang dipin revisi (D-06 render ulang identik) |
| KD-03 | Revisi menyimpan snapshot penuh ternormalisasi (`snapshot`) DAN indeks blok (`StudioBlock`) | Hanya blok, atau hanya snapshot | Snapshot = sumber render ulang deterministik; blok = alamat cepat, diff, cari |
| KD-04 | Nomor dokumen cadangan (KT-05 c) tanpa model baru: `pg_advisory_xact_lock(hashtext('studio-docno:'||typeCode||':'||year))` lalu `max(urut)+1` dari `StudioDocument` | Model ke-10 `StudioNumberSequence`; SEQUENCE Postgres | Menjaga 9 model blueprint; transaksi berkunci menghindari balapan; unik `docNumber` menjadi penjaga terakhir (409) |
| KD-05 | Tidak ada CHECK constraint SQL; invarian "tepat satu induk" di layanan | CHECK manual di migration.sql | Prisma tidak memodelkan CHECK; risiko diff berikutnya tidak konsisten |
| KD-06 | Enum Prisma bernilai HURUF BESAR | camelCase | Pola repo `enum Role { ADMINISTRATOR USER }` (`research/02:378-381`) |

### 1.2 Model (9, tanpa delta)

| ID | Model | Medan (nama: tipe Prisma, atribut) | Unik / indeks | Relasi intra-Studio |
|---|---|---|---|---|
| M01 | `StudioTemplate` | `id: String @id @default(cuid())`; `slug: String @unique` (pola `^[a-z0-9]+(-[a-z0-9]+)*$`, maks 64); `name: String`; `kind: StudioTemplateKind`; `description: String? @db.Text`; `isCanonical: Boolean @default(false)`; `archived: Boolean @default(false)`; `latestVersionNo: Int @default(0)`; `createdBy: String`; `createdAt: DateTime @default(now())`; `updatedAt: DateTime @updatedAt` | `@@index([kind])`, `@@index([archived])` | `versions StudioTemplateVersion[]`, `documents StudioDocument[]` |
| M02 | `StudioTemplateVersion` | `id: String @id @default(cuid())`; `templateId: String`; `versionNo: Int`; `baseVersionId: String?`; `overrides: Json` (peta kunci->nilai, hanya kunci registri); `resolvedParams: Json` (semua kunci, kelas T terhitung); `paramsSha256: String`; `roleFormats: Json` (peta `RoleKey` -> `{para, run}`, §5.6); `sectionPlan: Json` (`SectionPlan`, §5.5); `assets: Json` (peta id aset templat -> `{sha256, path, kind}`); `provenance: Json` (`{tokensVersion, manualRevision, skillVersion, catalogRef}`, usulan konflik Kc-01); `changeNote: String @db.Text`; `createdBy: String`; `createdAt: DateTime @default(now())` | `@@unique([templateId, versionNo])`, `@@index([baseVersionId])` | `template StudioTemplate @relation(fields:[templateId], references:[id], onDelete: Restrict)`; `base StudioTemplateVersion? @relation("TemplateVersionBase", fields:[baseVersionId], references:[id], onDelete: Restrict)`; `derived StudioTemplateVersion[] @relation("TemplateVersionBase")`; `revisions StudioRevision[]`; `artifacts StudioArtifact[]` |
| M03 | `StudioSectionType` | `key: String @id` (mis. `cover`, `slide.request`); `catalogId: String @unique` (`S01`..`S29`, `F1`..`F7`, `C01`..`C15`); `group: StudioSectionGroup`; `register: StudioSectionRegister`; `name: String`; `elements: Json`; `paramRefs: String[]`; `ruleRefs: String[]`; `activeTiers: StudioTier[]`; `renderable: Boolean`; `sourceRef: String`; `registryVersion: String`; `updatedAt: DateTime @updatedAt` | `@@index([group])` | tidak ada (diisi seed S70, 51 baris) |
| M04 | `StudioDocument` | `id: String @id @default(cuid())`; `docNumber: String @unique`; `numberSource: StudioNumberSource`; `title: String`; `typeCode: String`; `language: String @default("ID")`; `classification: String`; `tier: StudioTier`; `templateId: String`; `currentRevisionNo: Int @default(1)`; `missionFolder: String?`; `agentRequestId: String?`; `hermesTaskId: String?`; `createdBy: String`; `archived: Boolean @default(false)`; `createdAt: DateTime @default(now())`; `updatedAt: DateTime @updatedAt` | `@@index([missionFolder])`, `@@index([agentRequestId])`, `@@index([hermesTaskId])`, `@@index([templateId])`, `@@index([createdAt])` | `template StudioTemplate @relation(fields:[templateId], references:[id], onDelete: Restrict)`; `revisions StudioRevision[]`; `outputs StudioOutputFile[]`; `renderJobs StudioRenderJob[]` |
| M05 | `StudioRevision` | `id: String @id @default(cuid())`; `documentId: String`; `revisionNo: Int`; `parentRevisionNo: Int?`; `templateVersionId: String`; `snapshot: Json` (`NormDocSnapshot`, §3.9); `snapshotSha256: String`; `inputSha256: String`; `docRev: String` (huruf ARSIP `meta.rev`); `changeWhat: String @db.Text`; `changeWhy: String @db.Text`; `changeImpact: String @db.Text`; `changedAddresses: String[]`; `releaseStatus: StudioReleaseStatus @default(PENDING)`; `lintReport: Json?`; `createdBy: String`; `createdAt: DateTime @default(now())` | `@@unique([documentId, revisionNo])`, `@@index([templateVersionId])` | `document StudioDocument @relation(fields:[documentId], references:[id], onDelete: Cascade)`; `templateVersion StudioTemplateVersion @relation(fields:[templateVersionId], references:[id], onDelete: Restrict)`; `blocks StudioBlock[]`; `outputs StudioOutputFile[]`; `renderJobs StudioRenderJob[]` |
| M06 | `StudioBlock` | `id: String @id @default(cuid())`; `revisionId: String`; `blockId: String` (identitas stabil lintas revisi, §4.4); `address: String`; `artifactLabel: String?` (`Tabel 3.1`, `Gambar 3.2`, `Turunan D-3.1`); `ordinal: Int`; `chapterKey: String` (`F`, `P1`, `3`, `A`); `sectionNo: Int?`; `paraNo: Int?`; `type: String` (`BlockType` atau kunci struktural); `content: Json`; `textPlain: String @db.Text`; `contentSha256: String` | `@@unique([revisionId, address])`, `@@unique([revisionId, ordinal])`, `@@index([revisionId, blockId])`, `@@index([revisionId, artifactLabel])`, `@@index([revisionId, type])` | `revision StudioRevision @relation(fields:[revisionId], references:[id], onDelete: Cascade)` |
| M07 | `StudioArtifact` | `id: String @id @default(cuid())`; `kind: StudioArtifactKind`; `schemaId: String`; `title: String`; `label: String?`; `spec: Json`; `specSha256: String`; `templateVersionId: String?`; `missionFolder: String?`; `agentRequestId: String?`; `hermesTaskId: String?`; `releaseStatus: StudioReleaseStatus @default(PENDING)`; `lintReport: Json?`; `createdBy: String`; `createdAt: DateTime @default(now())`; `updatedAt: DateTime @updatedAt` | `@@index([kind])`, `@@index([missionFolder])`, `@@index([agentRequestId])`, `@@index([createdAt])` | `templateVersion StudioTemplateVersion? @relation(fields:[templateVersionId], references:[id], onDelete: Restrict)`; `outputs StudioOutputFile[]`; `renderJobs StudioRenderJob[]` |
| M08 | `StudioOutputFile` | `id: String @id @default(cuid())`; `documentId: String?`; `revisionId: String?`; `artifactId: String?`; `renderJobId: String?`; `format: StudioOutputFormat`; `role: StudioOutputRole`; `figureLabel: String?`; `relPath: String` (relatif ke akar, garis miring `/`); `fileName: String`; `bytes: Int`; `sha256: String`; `mime: String`; `lintVerdict: StudioReleaseStatus @default(PENDING)`; `createdAt: DateTime @default(now())` | `@@unique([relPath])`, `@@index([documentId, revisionId])`, `@@index([artifactId])`, `@@index([sha256])` | `document StudioDocument? (onDelete: Cascade)`; `revision StudioRevision? (onDelete: Cascade)`; `artifact StudioArtifact? (onDelete: Cascade)`; `renderJob StudioRenderJob? (onDelete: SetNull)` |
| M09 | `StudioRenderJob` | `id: String @id @default(cuid())`; `documentId: String?`; `revisionId: String?`; `artifactId: String?`; `formats: StudioOutputFormat[]`; `status: StudioRenderJobStatus @default(QUEUED)`; `errorCode: String?`; `errorMessage: String? @db.Text`; `engine: Json?` (`{sofficeVersion, chromiumRevision, renderEnvManifestSha256}`); `requestedBy: String`; `queuedAt: DateTime @default(now())`; `startedAt: DateTime?`; `finishedAt: DateTime?`; `durationMs: Int?` | `@@index([status])`, `@@index([documentId])`, `@@index([artifactId])`, `@@index([queuedAt])` | `document StudioDocument? (Cascade)`; `revision StudioRevision? (Cascade)`; `artifact StudioArtifact? (Cascade)`; `outputs StudioOutputFile[]` |

Invarian layanan (bukan DB): M08 tepat satu dari {`revisionId`, `artifactId`} terisi, dan `documentId` terisi bila `revisionId` terisi; M09 sama. `createdBy`/`requestedBy` = hasil `getRequester(req, agentId)` (`src/lib/hq-session.ts:95`) atau `"anonymous-internal"` bila null.

### 1.3 Enum

Lapis `prisma` = enum Postgres (dibuat migrasi). Lapis `ts` = union konstan di `src/lib/studio/contract/enums.ts` (tidak masuk DB).

| ID | Nama | Lapis | Nilai |
|---|---|---|---|
| E01 | `StudioTier` | prisma | `NOTA`, `TERBIT`, `SERAH` |
| E02 | `StudioParamClass` | prisma | `B`, `K`, `T` |
| E03 | `StudioReleaseStatus` | prisma | `PENDING`, `PASS`, `FAIL`, `NOT_RUN` |
| E04 | `StudioOutputFormat` | prisma | `DOCX`, `PDF`, `HTML`, `SVG`, `PNG` |
| E05 | `StudioRenderJobStatus` | prisma | `QUEUED`, `RUNNING`, `SUCCEEDED`, `PARTIAL`, `FAILED` |
| E06 | `StudioArtifactKind` | prisma | `CHART`, `DIAGRAM`, `IMAGE`, `HTML` |
| E07 | `StudioTemplateKind` | prisma | `DOCUMENT`, `CHART`, `DIAGRAM`, `IMAGE`, `HTML` |
| E08 | `StudioSectionGroup` | prisma | `DOCUMENT`, `PAGE_DEVICE`, `CHANNEL` |
| E09 | `StudioSectionRegister` | prisma | `WRAPPER`, `INTERIOR`, `NONE` |
| E10 | `StudioOutputRole` | prisma | `PRIMARY`, `FIGURE` |
| E11 | `StudioNumberSource` | prisma | `AGENT`, `SEQUENCE` |
| E12 | `ProvenanceMark` | ts | `TERUKUR`, `DITURUNKAN`, `PEMASOK`, `ASUMSI` (glif U+25A0, U+25C8, U+25C7, U+25B3; `research/03:141`) |
| E13 | `LintCheckStatus` | ts | `PASS`, `FAIL`, `NOT_RUN`, `REPORT` |
| E14 | `LintHqMode` | ts | `S`, `R`, `X`, `M` |
| E15 | `LintGroup` | ts | `A` (39 DATUM), `B` (4 guard), `C` (19 bahasa), `D` (21 struktur), `H` (16 manusia) |
| E16 | `BlockType` | ts | 21 nilai blok isi (§3.4) + primitif `spacer`, `device` |
| E17 | `StructuralType` | ts | `cover`, `controlSheet`, `toc`, `partDivider`, `signatureBlock`, `chapter`, `section`, `appendix` |
| E18 | `ChartCode` | ts | 58 kode `P-01..P-15`, `H-01..H-09`, `K-01..K-12`, `W-01..W-10`, `S-01..S-08`, `G-01..G-04` + 18 `DF-01..DF-18` |
| E19 | `DiagramFamily` | ts | `layered`, `topology`, `stack`, `flow`, `swimlane`, `sequence`, `sld`, `rack`, `graph` |
| E20 | `DiagramShape` | ts | `box`, `bus`, `circle`, `cylinder`, `diamond`, `doubled`, `hexagon`, `parallelogram`, `shadowed`, `stadium` |
| E21 | `DiagramEdgeKind` | ts | `accent`, `alert`, `control`, `data`, `sync`, `verify` |
| E22 | `SymbolDialect` | ts | `iec`, `isa`, `sec`, `mil` (41 id `dialek:nama`, `research/03:288`) |
| E23 | `RoleKey` | ts | daftar §5.6 |
| E24 | `StudioErrorCode` | ts | daftar §6.3 |
| E25 | `CallerKind` | ts | `ADMIN_SESSION`, `USER_SESSION`, `GOOGLE_SESSION`, `INTERNAL_AGENT` |

### 1.4 Rollback SQL (lengkap; hanya objek Studio)

Nama migrasi tetap: `20261022120000_add_studio` (lebih baru dari `20260927170000_agentrequest_requestedby_backfill`). S03 menyimpan teks ini apa adanya sebagai `prisma/migrations/20261022120000_add_studio/rollback.sql`? Tidak: Prisma akan mencoba membaca folder migrasi; berkas tambahan di folder migrasi diabaikan Prisma tetapi untuk keamanan rollback disimpan HANYA di dokumen ini dan dijalankan S82 lewat `npx prisma db execute --file <salinan sementara> --url <DB uji>`.

```sql
-- Rollback Studio (S82, DB uji gsp_agent_hq_v21_uji dulu). Tanpa CASCADE: gagal keras bila ada ketergantungan tak terduga.
BEGIN;
DROP TABLE IF EXISTS "StudioOutputFile";
DROP TABLE IF EXISTS "StudioRenderJob";
DROP TABLE IF EXISTS "StudioBlock";
DROP TABLE IF EXISTS "StudioRevision";
DROP TABLE IF EXISTS "StudioArtifact";
DROP TABLE IF EXISTS "StudioDocument";
DROP TABLE IF EXISTS "StudioTemplateVersion";
DROP TABLE IF EXISTS "StudioTemplate";
DROP TABLE IF EXISTS "StudioSectionType";
DROP TYPE IF EXISTS "StudioTier";
DROP TYPE IF EXISTS "StudioParamClass";
DROP TYPE IF EXISTS "StudioReleaseStatus";
DROP TYPE IF EXISTS "StudioOutputFormat";
DROP TYPE IF EXISTS "StudioRenderJobStatus";
DROP TYPE IF EXISTS "StudioArtifactKind";
DROP TYPE IF EXISTS "StudioTemplateKind";
DROP TYPE IF EXISTS "StudioSectionGroup";
DROP TYPE IF EXISTS "StudioSectionRegister";
DROP TYPE IF EXISTS "StudioOutputRole";
DROP TYPE IF EXISTS "StudioNumberSource";
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261022120000_add_studio';
COMMIT;
```

Batas: tidak ada pernyataan yang menyebut tabel lama (33 model + `WorkerTrace` + `IlSearchDoc`), tipe `Role`, atau ekstensi `pg_trgm`. Urutan DROP: anak sebelum induk (M08, M09, M06, M05, M07, M04, M02, M01, M03). Pemeriksaan S82: hitungan baris semua tabel non-Studio sebelum = sesudah; `SELECT count(*) FROM pg_tables WHERE tablename LIKE 'Studio%'` = 0; `SELECT count(*) FROM pg_type WHERE typname LIKE 'Studio%'` = 0; `prisma migrate status` tidak mencantumkan migrasi Studio sebagai terapan.

## 2. Aturan migrasi (D-21)

Larangan mutlak: `prisma migrate dev`, `prisma db push`, `npm run db:migrate` (= `prisma migrate dev`, `package.json:12`), `npm run db:push` (`package.json:11`).

Fakta yang menentukan prosedur:
- `--from-migrations` mewajibkan `--shadow-database-url` (`node_modules/prisma/build/index.js:3830-3831`); datasource tidak punya `shadowDatabaseUrl` (`prisma/schema.prisma:6-9`).
- Diff mentah migrations -> schema memuat drift pra-ada IlSearchDoc (rebuild indeks GIN/trgm, `prisma/schema.prisma:559-560`). Jadi diff mentah TIDAK boleh disalin utuh.
- `WorkerTrace` ada di DB, tidak di schema maupun migrasi (`research/02:200`). Karena diff bersumber dari folder migrasi (bukan DB), ia tidak memunculkan DROP WorkerTrace; `migrate deploy` hanya menjalankan migration.sql.

Prosedur S03 (urut, setiap langkah dikutip keluarannya di marker):

| # | Perintah | Syarat lulus |
|---|---|---|
| 1 | Buat DB bayangan khusus `gsp_agent_hq_v21_shadow` di `localhost:5433` (bukan v21, bukan produksi; Prisma akan mengosongkannya). Pemilik user migrasi superuser karena `0_init`.. memakai `CREATE EXTENSION pg_trgm` (`migration.sql:6-8`) | DB ada, kosong |
| 2 | SEBELUM menyunting schema: `npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --shadow-database-url <URL shadow> --script > <tmp>/baseline.sql` | berkas ada; isinya = drift pra-ada (boleh berisi DROP/CREATE INDEX IlSearchDoc) |
| 3 | Tambahkan M01-M09 dan E01-E11 ke `prisma/schema.prisma` (aditif, di akhir berkas); `npx prisma validate` | exit 0 |
| 4 | Ulangi langkah 2 ke `<tmp>/full.sql` | exit 0 |
| 5 | `studio.sql` = pernyataan di `full.sql` yang tidak ada di `baseline.sql` (banding per pernyataan berakhiran `;`) | `baseline ⊆ full` |
| 6 | Penjaga isi `studio.sql`: (a) `grep -c "DROP" = 0`; (b) setiap `CREATE TABLE`, `CREATE INDEX`, `CREATE UNIQUE INDEX`, `ALTER TABLE` menyebut nama berawalan `"Studio`; (c) setiap `CREATE TYPE` berawalan `"Studio`; (d) jumlah `CREATE TABLE` = 9, `CREATE TYPE` = 11 | (a)-(d) benar; bila tidak, berhenti dan laporkan `needs-review` |
| 7 | Simpan `studio.sql` sebagai `prisma/migrations/20261022120000_add_studio/migration.sql`; hitung `sha256` | berkas ada |
| 8 | `npx prisma migrate deploy` (DATABASE_URL = `gsp_agent_hq_v21`, cek nama DB di keluaran) | "1 migration ... applied" |
| 9 | `npx prisma migrate status` | "Database schema is up to date" |
| 10 | Ulangi langkah 2 (schema sudah memuat Studio) ke `<tmp>/after.sql`; harus sama dengan `baseline.sql` | residu Studio = 0 |
| 11 | `npx prisma generate` | exit 0 |
| 12 | Hitung baris tabel lama sebelum langkah 8 dan sesudah langkah 9 (`AgentRequest`, `HermesTask`, `IlSearchDoc`, `WorkerTrace`, `HermesMemory`, `WebUiUser`, `OrchestrationRecord`) | identik |

## 3. Skema JSON v1

### 3.1 Keputusan skema (tier 1)

| ID | Keputusan | Alternatif ditolak | Alasan |
|---|---|---|---|
| KS-01 | Sumber kebenaran validasi = JSON Schema 2020-12 yang dipublikasikan (diunduh lewat `/api/studio/registry?kind=schema`), divalidasi `ajv` (§10). Tipe TS ditulis tangan di kontrak; drift dijaga fixture S63 yang bertipe TS sekaligus lolos ajv | zod 4 (`z.toJSONSchema`) sebagai sumber tunggal | Agent memakai skema terpublikasi; refinement zod tidak ikut terekspor sehingga perilaku validasi bisa berbeda dari skema yang dibaca agent; zod hanya transitif dev (`research/02:42`) |
| KS-02 | Paragraf: `text` (md-lite Garis A) XOR `runs[]`; teks tidak pernah ditransformasi (A9); kapital lewat `caps` | md penuh / transformasi tipografi | R7, BM-1 |
| KS-03 | md-lite = semantik `DatumDocx.para()` persis (`**tebal**`, `` `mono` ``, `*miring*`, URL `https?://`, `doi.org/`, `iso.org/`, DOI `10.dddd/`; `research/03:180`). Tanpa escape; teks yang memuat `*`/backtick literal WAJIB memakai `runs[]` | md-lite dengan escape | Paritas S64 memanggil `para()` Python yang sama |
| KS-04 | Format langsung dinyatakan dalam satuan OOXML (`Tw`, `HalfPt`, `Eighth`) | mm/pt desimal | Reproduksi persis klaster research/07 (semua nilai twip bulat) |
| KS-05 | Primitif tata letak `spacer` (paragraf kosong) dan `device` (pita segel, logo, garis rambut, Datum Rule, string punggung) masuk aliran blok tetapi TIDAK beralamat dan TIDAK termasuk 51 registri | Spasi sebagai properti blok | 155 + 14 + 9 paragraf kosong BM (K-27, K-31, K-10, K-16, K-20) memengaruhi pemenggalan halaman (BM-3); pemetaan 1:1 menyederhanakan S93 |
| KS-06 | Batas seksi DOCX diturunkan dari unit (tiap halaman depan, pembatas bagian, bab, lampiran = satu sectPr), dengan `setup` per unit sebagai override | sectionBreak eksplisit | BM: 29 seksi = 3 depan + 5 bagian + 17 bab + 4 lampiran (`research/07:664-692`) |
| KS-07 | Format per peran tinggal di templat (`roleFormats`, §5.6); dokumen hanya menimpa per blok bila menyimpang | Format di setiap blok | Agent cukup mengirim isi; profil Manual 000 (S95) memuat format klaster |
| KS-08 | HTML artefak hanya dari templat; tidak ada medan HTML mentah di skema mana pun; maka tidak perlu sanitizer | Blok HTML tersanitasi | KT-11 (D-22) |
| KS-09 | `additionalProperties: false` di semua objek skema; medan ekstensi hanya di `x` (objek bebas, diabaikan renderer, disimpan) | longgar | Galat ketik agent harus 400, bukan diam |

### 3.2 Bentuk bersama (TypeScript, `src/lib/studio/contract/types/common.ts`)

```ts
export type Hex = string;            // ^[0-9A-F]{6}$ (huruf besar) | "auto"
export type Tw = number;             // integer twip
export type HalfPt = number;         // integer
export type Eighth = number;         // integer 1/8 pt
export interface BorderSpec { val: "single" | "dashed" | "dotted" | "double" | "none"; sz: Eighth; color: Hex; space?: number }
export interface Borders { top?: BorderSpec; bottom?: BorderSpec; left?: BorderSpec; right?: BorderSpec; insideH?: BorderSpec; insideV?: BorderSpec }
export interface Shading { fill: Hex; val: "clear" }
export interface TabStop { posTw: Tw; val: "left" | "right" | "center" | "decimal"; leader?: "none" | "dot" }
export interface ParaFormat {
  spacingBeforeTw?: Tw; spacingAfterTw?: Tw; lineTw?: Tw; lineRule?: "auto" | "exact" | "atLeast";
  jc?: "left" | "right" | "center" | "both";
  indLeftTw?: Tw; indRightTw?: Tw; indHangingTw?: Tw; indFirstLineTw?: Tw;
  keepNext?: boolean; keepLines?: boolean; pageBreakBefore?: boolean; widowControl?: boolean;
  outlineLvl?: 0|1|2|3|4|5|6|7|8; tabs?: TabStop[]; borders?: Omit<Borders, "insideH"|"insideV">; shading?: Shading;
}
export type FaceRole = "serif" | "condensed" | "mono" | "workbookUi" | "symbolGlyph";
export interface RunProps {
  face?: string;            // nama wajah apa adanya, mis. "IBM Plex Sans Cond" (research/05:13)
  faceRole?: FaceRole;      // XOR face
  szHalfPt?: HalfPt; color?: Hex; b?: boolean; i?: boolean; caps?: boolean;
  spacingTw?: number;       // w:spacing w:val (1/20 pt), boleh negatif
  u?: "single" | "none"; vertAlign?: "superscript" | "subscript";
}
export type Run =
  | ({ t: string } & RunProps)                       // teks apa adanya, termasuk spasi
  | ({ tab: true } & RunProps)
  | ({ br: "line" } & RunProps)
  | ({ field: "PAGE" | "NUMPAGES" } & RunProps);
export type Inline = { text: string } | { runs: Run[] };   // oneOf
export interface SpacerSpec { format: ParaFormat }
export type ParamValue = null | boolean | number | string | ParamValue[] | { [k: string]: ParamValue };
```

### 3.3 `studio.doc/v1` (`types/doc.ts`)

```ts
export interface StudioIngestRequest {            // badan POST /documents dan /validate
  agentId?: string;                                // maks 80 (A6)
  document: StudioDocV1;
  render?: { formats?: Array<"docx"|"pdf"|"html">; figures?: Array<"svg"|"png"> };
}
export interface StudioDocV1 {
  $schema: "studio.doc/v1";
  template: { slug: string; version?: number };   // tanpa version = latestVersionNo
  mission?: { folder?: string; agentRequestId?: string; hermesTaskId?: string };
  meta: DocMeta;
  register?: Record<string, RegisterEntry>;
  overrides?: Record<string, ParamValue>;          // hanya kelas B untuk non-admin (KT-16)
  front?: { cover?: FrontPage; controlSheet?: FrontPage; toc?: TocSpec; signature?: SignatureBlock };
  parts?: PartSpec[];
  chapters: Chapter[];                             // minItems 1
  appendices?: Chapter[];                          // key huruf A..Z
  assets?: Record<string, AssetRef>;
  outputs?: Array<"docx" | "pdf" | "html">;        // default dari templat per tier
  x?: Record<string, unknown>;
}
export interface DocMeta {
  title: string; docNumber?: string;               // pola P3-18; absen -> sekuens HQ (KT-05 c)
  rev: string;                                     // ^[A-Z]{1,2}$
  typeCode: string;                                // daftar tertutup P3-20
  tier: "NOTA" | "TERBIT" | "SERAH";
  classification: string; language: "ID" | "EN";
  author: string; issueDate: string;               // YYYY-MM-DD; juga cap waktu deterministik ZIP/PDF
  custodian?: string; audience?: string; basis?: string; subject?: string;
  urgency?: "kilat" | "sangat segera" | "segera" | "biasa";
  issueNumber?: number; copyControl?: string;
}
export interface RegisterEntry { v: number; dec: 0|1|2|3; unit: string /* minLength 1 */; mark: ProvenanceMark; src: string }
export interface AssetRef { kind: "raster"; mime: "image/png" | "image/jpeg"; sha256: string; path?: string /* relatif akar aset */; dataBase64?: string; widthPx?: number; heightPx?: number }
export interface SectionSetup {                    // satu w:sectPr
  pageSizeTw?: [Tw, Tw];                           // BM: [11906, 16838]
  marginTw?: { top: Tw; bottom: Tw; left: Tw; right: Tw; header: Tw; footer: Tw; gutter: Tw };
  cols?: { num: number; spaceTw: Tw }; docGridLinePitch?: number; titlePg?: boolean;
  header?: HeaderFooterSpec; footer?: HeaderFooterSpec;
}
export type HeaderFooterSpec =
  | { mode: "inherit" }                            // dari render.section.* templat
  | { mode: "empty"; format?: ParaFormat }         // BM header1.xml: line 40 exact
  | { mode: "runningHead"; left?: Inline; right?: Inline; format?: ParaFormat }   // BM header5.xml
  | { mode: "registerBlock"; cells?: Inline[] }    // BM footer5.xml, field PAGE/NUMPAGES
  | { mode: "custom"; paragraphs?: Array<{ runs: Run[]; format?: ParaFormat }>; table?: TableBlock };
export interface FrontPage {                       // sec:S01 cover / sec:S02 controlSheet
  mode: "auto" | "explicit";
  data?: CoverData | ControlSheetData;             // mode auto: disusun dari cover.elementOrder (P4V-03)
  body?: FrontItem[];                              // mode explicit: urutan persis (benchmark)
  setup?: SectionSetup;
}
export type FrontItem = Block | ParagraphBlock /* role kicker|pageTitle|blockHeading|addressLine|title|standfirst|scopeLine */ | SignatureBlock | ControlBlock | Colophon;
export interface CoverData { kicker?: Inline; titleLines: Inline[]; standfirst?: Inline; scopeLine?: Inline; addressLine?: Inline; control?: ControlBlock; colophon?: Colophon; identityString?: Inline }
export interface ControlSheetData { kicker?: Inline; title: Inline; revisionHistory?: TableBlock; verificationChain?: TableBlock; methodStatement?: Inline; distribution?: TableBlock }
export interface ControlBlock { type: "controlBlock"; rows: Array<[Inline, Inline, Inline, Inline]>; colsTw?: Tw[] }   // KT-03/KT-04
export interface Colophon { type: "colophon"; left: Inline; right: Inline }                                            // KT-05/KT-06
export interface SignatureBlock { type: "signatureBlock"; roles: Array<{ role: Inline; holder: Inline; date?: Inline }>; signRowFormat?: ParaFormat; colsTw?: Tw[] }   // sec:S05
export interface TocSpec { mode: "field" | "static"; kicker?: Inline; title?: Inline; note?: Inline;
  entries?: Array<{ level: "part" | "chapter" | "appendix"; label: Inline; title: Inline; page: string }>;   // static: halaman literal
  sealBand?: DeviceBlock; setup?: SectionSetup }
export interface PartSpec { id: string /* "P1".. */; label: Inline /* "Bagian I" */; title: Inline; lede?: Inline; chapterKeys: string[]; showChapterList?: boolean; body?: FrontItem[]; setup?: SectionSetup }
export interface Chapter {
  key?: string;                                    // "1".."n" (bab) | "A".."Z" (lampiran); default posisi
  blockId?: string; kicker?: Inline; title: Inline; partId?: string;
  runningHeadTitle?: string; setup?: SectionSetup;
  intro?: Array<Block | SpacerBlock | DeviceBlock>;   // alamat C.0.P
  sections: Section[];
}
export interface Section { blockId?: string; number?: string /* default C.S */; title: Inline; headingFormat?: ParaFormat; blocks: Array<Block | SpacerBlock | DeviceBlock> }
export interface SpacerBlock { type: "spacer"; format: ParaFormat }
export interface DeviceBlock { type: "device"; device: "sealBand" | "logo" | "hairline" | "datumRule" | "spineString" | "issueStamp";
  left?: Inline; right?: Inline; text?: Inline; asset?: string; widthMm?: number; heightMm?: number; format?: ParaFormat }
```

### 3.4 Blok isi (21 jenis, union `Block`)

Medan bersama setiap blok: `type`, `blockId?` (stabil, §4.4), `format?: ParaFormat` (override paragraf utama), `runDefaults?: RunProps`, `x?`.

| Jenis (`type`) | Medan khusus (selain bersama) |
|---|---|
| `paragraph` | `Inline` (text XOR runs); `role?: "body"\|"identity"\|"anchor"\|"pivot"\|"closingAction"\|"lede"\|"subheading"\|"note"\|"kicker"\|"pageTitle"\|"blockHeading"\|"addressLine"\|"title"\|"standfirst"\|"scopeLine"\|"methodStatement"`; `rail?: RailLine[]` |
| `list` | `style: "bullet"\|"number"`; `items: Array<Inline & { marker?: Run; format?: ParaFormat; rail?: RailLine[] }>` (marker absen = templat; renderer menulis marker + `w:tab` + isi) |
| `aside` | `variant: "generic"\|"doctrine"\|"story"\|"quickCheck"\|"ifInDoubt"`; `label: Inline`; `body: Array<Inline & { format?: ParaFormat }>` |
| `monoBlock` | `label: Inline`; `lines: Array<Inline & { format?: ParaFormat }>` |
| `assumptionInline` | `asmId: string` (pola P5-63); `Inline`; `impact: string` |
| `table`, `specTable`, `registerTable`, `exampleWrongRight`, `ruleTable`, `checklist`, `glossary`, `sourceRegister`, `ruleIndex`, `referenceScale`, `financialTable` | bentuk `TableBlock` (bawah) + `preset?: string` (registerTable 8 preset, financialTable 3 preset: `boq`, `ahs`, `recap`) |
| `derivation` | `id?: string` (default `D-C.n`); `title: Inline`; `intro?: Inline`; `lines: Array<{ label: Inline; value?: Inline \| { registerKey: string; dec?: number }; mark?: ProvenanceMark }>`; `result?: { label: Inline; expr: string; registerKey: string; tol?: number }`; `verdict?: { label: Inline; registerKey: string; limit: number; direction?: "lessOrEqual"\|"greaterOrEqual" }`; `closing: Inline` |
| `chart` | `spec: StudioChartV1 \| { artifactId: string }`; `FigureCommon` |
| `diagram` | `spec: StudioDiagramV1 \| { artifactId: string }`; `FigureCommon` |
| `image` | `asset: string` (kunci `assets`); `FigureCommon` |
| `symbolSheet` | `dialect: SymbolDialect`; `cols?: number`; `FigureCommon` |

```ts
export interface RailLine { kind: "mark" | "source" | "note"; mark?: ProvenanceMark; label?: string; text?: string; runs?: Run[]; format?: ParaFormat }
export interface Caption { label?: string /* default "Tabel n.m"/"Gambar n.m"; bila diisi wajib sama dengan hasil penomoran, selain itu lint REPORT */; separator?: string; inline: Inline; labelProps?: RunProps; format?: ParaFormat }
export interface SourceLine { inline: Inline; provenance?: ProvenanceMark[]; format?: ParaFormat }
export interface FigureCommon { caption: Caption; keyRow?: Inline; source: SourceLine; widthMm: 128 | 166 | number /* aset raster boleh selain 128/166 */; heightMm?: number; paragraphFormat?: ParaFormat }
export interface Cell {
  paragraphs?: Array<Inline & { format?: ParaFormat }>;   // kosong [] = <w:p/> tanpa pPr (KT-19, KT-37)
  text?: string; runs?: Run[];                             // singkatan satu paragraf (XOR paragraphs)
  gridSpan?: number; vMerge?: "restart" | "continue"; widthTw?: Tw;
  borders?: Omit<Borders, "insideH"|"insideV">; marginsTw?: { top?: Tw; left?: Tw; bottom?: Tw; right?: Tw };
  shading?: Shading; vAlign?: "top" | "center" | "bottom"; nested?: TableBlock;
}
export interface Row { kind?: "header" | "body" | "group" | "total"; cells: Cell[]; cantSplit?: boolean; repeatHeader?: boolean }
export interface ColumnSpec { widthTw?: Tw; widthMm?: number; align?: "left" | "right" | "center" | "decimal"; role?: "text" | "numeral" | "id" | "unit" | "glyph"; unit?: string }
export interface TableBlock {
  type: "table" | "specTable" | "registerTable" | "exampleWrongRight" | "ruleTable" | "checklist" | "glossary" | "sourceRegister" | "ruleIndex" | "referenceScale" | "financialTable";
  blockId?: string; caption?: Caption; columns: ColumnSpec[]; rows: Row[];   // baris kepala = rows dengan kind "header"
  source?: SourceLine;              // wajib untuk tabel data (lint 10, by-construction 422) kecuali tabel tanpa caption (perangkat/kotak)
  sourcePlacement?: "lastRowMerged" | "paragraphBelow";   // default render.table.sourcePlacement
  layout?: { widthTw?: Tw; indentTw?: Tw; cellMarginTw?: { left: Tw; right: Tw }; fixed?: boolean; borders?: Borders };
  preset?: string; format?: ParaFormat; x?: Record<string, unknown>;
}
```

Batas skema (penolakan 400): `columns.length` 1..20; `cells` per baris dengan memperhitungkan `gridSpan` = `columns.length` (G1 sebagai 422 by-construction); kedalaman `nested` maks 1; `szHalfPt` 8..144; `spacingTw` -200..400; `lineTw` 20..1440; warna heks huruf besar.

### 3.5 `studio.chart/v1` (`types/chart.ts`)

```ts
export interface StudioChartV1 {
  $schema: "studio.chart/v1";
  kind: ChartCode | "composite";                 // kode drawn=false -> 422 CHART_KIND_NOT_DRAWN + alternatives
  id?: string;                                   // "Gambar 8.1" (P3-14)
  title: string;                                 // satu kalimat, diakhiri titik
  source: string; widthMm: 128 | 166; heightMm?: number;
  unit?: string; dec?: 0|1|2|3; apparatus?: "page" | "figure"; inDocument?: boolean; note?: string;
  data?: ChartData;                              // wajib bila kind != composite
  params?: Record<string, ParamValue>;           // kunci khusus registri chart (99 sejak d3) + global P7 kelas B
  style?: "datum" | "gallery";                   // gallery = gaya panel Gambar 8.1-8.5 (research/06:219)
  limit?: number; limitLabel?: string;           // P-11 threshold
  composite?: ChartComposite;                    // permintaan S02 (file_requests.md:5)
}
export type ChartData =
  | { shape: "categorical"; points: Array<{ label: string; value: number; accent?: boolean; sub?: string }> }
  | { shape: "series"; categories: string[]; series: Array<{ name: string; values: Array<number | null>; accent?: boolean }> }
  | { shape: "xy"; points: Array<{ x: number; y: number; size?: number; label?: string; group?: string; accent?: boolean }> }
  | { shape: "matrix"; rows: string[]; cols: string[]; values: number[][] }
  | { shape: "intervals"; items: Array<{ label: string; start: number | string; end: number | string; group?: string; milestone?: boolean }> }
  | { shape: "graph"; nodes: Array<{ id: string; label: string; value?: number; group?: string }>; links: Array<{ from: string; to: string; value?: number }> }
  | { shape: "distribution"; groups: Array<{ name: string; values: number[] }> }
  | { shape: "tiles"; tiles: Array<{ code: string; row: number; col: number; value?: number; label?: string }>; flows?: Array<{ from: string; to: string; value: number }>; dots?: Array<{ tile: string; dx?: number; dy?: number; label?: string }> }
  | { shape: "ohlc"; points: Array<{ t: string; o: number; h: number; l: number; c: number }> }
  | { shape: "sets"; sets: Array<{ name: string; size: number }>; overlaps: Array<{ sets: string[]; size: number }> }
  | { shape: "steps"; spec: StudioDiagramV1 };   // G-04 lewat mesin diagram flow (S43)
export interface ChartComposite {               // komposit galeri: panel bernama berisi kode chart
  columns: 1 | 2 | 3; gapMm?: number;
  panels: Array<{ name: string /* "Bar urut" */; code: ChartCode; caption?: string; axisNote?: string /* "x ... / y ..." */; spec: Omit<StudioChartV1, "$schema" | "composite" | "widthMm" | "source" | "title"> & { kind: ChartCode } }>;
}
```

Pemetaan bentuk data per kode diletakkan di `ChartDef.dataShape` (S09). Lantai: font min 5,5 pt dalam pt fisik (bukan px, F-007), maks 5 warna, maks 1 aksen, tinggi maks 247 mm, teks nyata di SVG.

Atribut peran SVG (permintaan S02, N2): setiap tanda data membawa `data-mark="<jenis>"` dengan jenis tertutup `bar`, `column`, `point`, `line`, `area`, `segment`, `slice`, `cell`, `node`, `link`, `tile`, `interval`, `box`, `whisker`, `label-value`; plus `data-series="<nama>"` dan `data-index="<i>"`. Dekorasi (sumbu, grid, teks label sumbu, baris KUNCI) TIDAK membawa `data-mark`; elemen sumbu membawa `data-axis="x|y"`; panel komposit dibungkus `<g data-panel="<code>">`.

### 3.6 `studio.diagram/v1` (Garis A, A4/D-10)

Bentuk = `SPEC_FIELDS` Garis A (`research/03:232`) dengan `class{}` pada simpul:

```ts
export interface StudioDiagramV1 {
  $schema: "studio.diagram/v1";
  family: DiagramFamily; id: string /* memuat \d+\.\d+ */; title: string /* diakhiri titik */;
  classification: string; width_mm: 128 | 166; apparatus?: "page" | "figure"; labels_verified?: boolean;
  sources: string[] /* minItems 1 */; source?: string;
  nodes: Array<{ id: string; label: string; sub?: string; shape?: DiagramShape; mark?: ProvenanceMark; tag?: string; u?: number; external?: boolean;
    class: { tier?: number; lane?: number | string; col?: number; row?: number; accent?: boolean; secondary?: boolean; external?: boolean } }>;
  edges?: Array<{ from: string; to: string; kind: DiagramEdgeKind; label: string }>;
  zones?: Array<{ id: string; label: string; members: string[] }>;
  legend?: string[]; notes?: string[]; per_row?: number;
}
```
Nama medan snake_case dipertahankan apa adanya (paritas Garis A; DATUM-38 hanya berlaku nama berkas). Spec Mermaid (`MERMAID_TELL`, `research/03:606`) ditolak 422 `DATUM-31`.

### 3.7 `studio.image/v1`

```ts
export interface StudioImageV1 { $schema: "studio.image/v1"; id?: string; title: string; source: string; asset: AssetRef; widthMm: number; heightMm?: number; dpiMin?: 150 | 300 }
```
`px_guard`: dpi efektif = lebarPx / (widthMm/25,4) >= 150 (300 untuk chart); gagal -> 422 `DATUM-39`.

### 3.8 `studio.html/v1` (KT-11)

```ts
export interface StudioHtmlV1 {
  $schema: "studio.html/v1";
  template: { slug: string; version?: number };
  source: { kind: "document"; documentId: string; revisionNo?: number } | { kind: "artifact"; artifactId: string } | { kind: "inline"; document: StudioDocV1 };
  options?: { paged: boolean; embedFonts: true; previewLabel?: boolean };
}
```
Tidak ada medan HTML/CSS/JS mentah. Keluaran: satu berkas, fon base64, tanpa `<script>`, tanpa URL eksternal.

### 3.9 Model ternormalisasi (`types/model.ts`, isi `StudioRevision.snapshot`)

```ts
export interface NormDocSnapshot { schema: "studio.norm/v1"; doc: StudioDocV1; units: NormUnit[]; blocks: NormBlock[]; numbering: Record<string, string>; register: Record<string, RegisterEntry> }
export interface NormUnit { kind: "cover" | "controlSheet" | "toc" | "part" | "chapter" | "appendix"; key: string; setup: Required<Pick<SectionSetup, "header" | "footer">> & SectionSetup }
export interface NormBlock { blockId: string; address: string | null /* null = spacer/device */; artifactLabel?: string; ordinal: number; unitKey: string; type: string; content: unknown; textPlain: string; contentSha256: string }
```

### 3.10 JSON Schema

Berkas `src/lib/studio/contract/schema/{doc,chart,diagram,image,html,common}.schema.ts` mengekspor objek `as const` dengan `$id`:
`https://hq.gsp.local/studio/schema/studio.doc/v1.json`, `.../studio.chart/v1.json`, `.../studio.diagram/v1.json`, `.../studio.image/v1.json`, `.../studio.html/v1.json`, `.../common/v1.json` (`$defs`: `Hex`, `Run`, `RunProps`, `ParaFormat`, `Borders`, `BorderSpec`, `Inline`, `Caption`, `SourceLine`, `RailLine`, `Cell`, `Row`, `ColumnSpec`, `TableBlock`, `SectionSetup`, `HeaderFooterSpec`). Dialek `https://json-schema.org/draft/2020-12/schema`. `Inline` = `oneOf [{required:[text]},{required:[runs]}]`; union blok = `oneOf` dengan diskriminator `type` (`discriminator: { propertyName: "type" }`, opsi ajv `discriminator: true`). Opsi ajv: `{ strict: true, allErrors: true, discriminator: true, allowUnionTypes: true }`. Galat dikembalikan sebagai `{ pointer: instancePath (JSON Pointer), keyword, message, checkId? }`.

## 4. Tata bahasa alamat dan penomoran

### 4.1 EBNF

```
address   = front | part | chapHead | secHead | block | item | artifact | artSub | cell
front     = "F:" ("cover" | "controlSheet" | "toc" | "signature") [ "/" posint ]
part      = "P:" posint                                   ; pembatas bagian ke-n (Bagian I = P:1)
chapHead  = chap                                          ; "3" judul bab, "A" judul lampiran
secHead   = chap "." posint                               ; "3.2" judul seksi
block     = chap "." nonneg "." posint                    ; "3.2.4"; seksi 0 = intro bab
item      = block "/" posint                              ; butir list, paragraf aside, baris monoBlock, baris turunan
artifact  = ("Tabel" | "Gambar") " " chap "." posint | "Turunan D-" chap "." posint [lower]
artSub    = artifact "/" ("caption" | "source" | "key")
cell      = "Tabel " chap "." posint "/" posint "." posint ; r.c 1-based
chap      = posint | upper
```

Aturan:
- `P` (paragraf) menghitung SEMUA blok isi di seksi (21 jenis) berurutan; `spacer` dan `device` tidak dihitung.
- `r` menghitung semua baris tabel berurutan render (kepala, kelompok, badan, total), tidak termasuk baris sumber (`/source`); `c` = kolom grid tempat sel MULAI (sadar `gridSpan`). Sel yang ditutup `gridSpan`/`vMerge continue` tidak dapat dialamatkan (404 `ADDRESS_NOT_FOUND`).
- Penomoran artefak per bab/lampiran: blok tabel-keluarga ber-`caption` -> `Tabel C.n`; `chart`/`diagram`/`image`/`symbolSheet` ber-`caption` -> `Gambar C.n`; `derivation` -> `Turunan D-C.n`. Tabel tanpa caption (perangkat, kotak) tidak bernomor (BM: 115 caption = 91 tabel + 24 gambar, K-29).
- Alamat URL: dienkode `encodeURIComponent` (`Tabel%203.1%2F2.3`).

### 4.2 Penomoran ulang (D-06)

1. Alamat adalah posisi DALAM satu revisi; dihitung ulang dari snapshot setiap revisi baru. Revisi lama tidak pernah berubah (alamat stabil per revisi).
2. Identitas lintas revisi = `blockId` (diisi ingest bila absen: `b_` + 16 heks dari sha256(`docNumber`|ordinal awal)); dipertahankan oleh PATCH `replace`; blok sisipan mendapat `blockId` baru.
3. Sisip/hapus menggeser `P` blok sesudahnya di seksi yang sama dan nomor artefak sesudahnya di bab yang sama. Respons PATCH memuat `addressMap` (alamat lama -> baru) untuk semua blok yang bergeser.
4. Rujukan dalam prosa ("lihat Tabel 3.1") TIDAK ditulis ulang (A9). Batas yang diterima: rujukan basi dilaporkan sebagai temuan REPORT oleh lint struktur (S46) bila teks memuat label artefak yang tidak ada di revisi itu.
5. PATCH wajib `baseRevisionNo` = `currentRevisionNo`; selisih -> 409 `REVISION_CONFLICT`.

## 5. Registri

### 5.1 Berkas registri dan parameter

| ID | Path | Pemilik isi | Ekspor | Hitungan |
|---|---|---|---|---|
| T01 | `src/lib/studio/params/governance-language.ts` | S04 | `PARAMS_GOVERNANCE_LANGUAGE: readonly ParamDef[]`, `PARAMS_GOVERNANCE_LANGUAGE_COUNT = 115` | P1 4, P3 24, P11-14 44, P15 31, P16 8, PA-PD 4 |
| T02 | `src/lib/studio/params/color-type.ts` | S05 | `PARAMS_COLOR_TYPE`, `PARAMS_COLOR_TYPE_COUNT = 134` | P4C 35, P4T 18 + S 67 + X 14 |
| T03 | `src/lib/studio/params/page.ts` | S06 | `PARAMS_PAGE`, `PARAMS_PAGE_COUNT = 91` | P4G 17, P4R 15, P4S 27, P4V 16, P4K 6, P4A 10 |
| T04 | `src/lib/studio/params/apparatus.ts` | S07 | `PARAMS_APPARATUS`, `PARAMS_APPARATUS_COUNT = 111` | P5 68, P6 43 |
| T05 | `src/lib/studio/params/figure.ts` | S08 | `PARAMS_FIGURE`, `PARAMS_FIGURE_COUNT = 135` | P7 36, P8 2, P9 55, P10 42 |
| T06 | `src/lib/studio/registry/charts.ts` | S09 | `CHART_REGISTRY: readonly ChartDef[]` (76), `CHART_PARAMS: readonly ParamDef[]` (99 sejak d3: 87 katalog + 12 mesin) | 58 + 18 drawn=false |
| T07 | `src/lib/studio/registry/lint.ts` | S10 | `LINT_REGISTRY: readonly LintDef[]` (99) | 83 otomatis + 16 H |

Total katalog: 115 + 134 + 91 + 111 + 135 + 87 = **673** (= `research/01:831`); sejak d3 (INT-V, D-108) registri memuat 99 parameter chart (87 katalog + 12 parameter mesin IP-25) sehingga `CATALOG_PARAMS.length` = 115 + 134 + 91 + 111 + 135 + 99 = **685**. Parameter renderer kontrak (`params/render.ts`, §5.7) berasal `source: "contract"` dan dihitung TERPISAH; kriteria §7.2 #1 "tepat 673" berlaku untuk `source: "catalog"`. Ini butir yang perlu dicatat controller (lihat §14).

Kunci parameter khusus chart: `chart.kind.<KODE>.<nama>` (mis. `chart.kind.P-01.sort`), `group: "P7X"`.

```ts
// src/lib/studio/contract/types/params.ts
export type ParamType = "bool" | "int" | "number" | "mm" | "pt" | "em" | "deg" | "percent" | "cm" | "rp" | "ratio" | "hex" | "char" | "string" | "enum" | "list" | "map" | "object" | "tokenRef" | "range" | "pair";
export type ParamGroup = "P1" | "P3" | "P4C" | "P4T" | "P4G" | "P4R" | "P4S" | "P4V" | "P4K" | "P4A" | "P5" | "P6" | "P7" | "P7X" | "P8" | "P9" | "P10" | "P11" | "P12" | "P13" | "P14" | "P15" | "P16" | "PA" | "PB" | "PC" | "PD" | "R";
export interface ParamDef {
  id: string;                 // "P4G-03", "P4T-S01-size", chart "P7X-P-01-sort", renderer "R-01"
  key: string;                // "grid.textColumnMm"
  label: string;              // label UI berbahasa Indonesia
  type: ParamType;
  default: ParamValue;        // null bila [TAK TERBACA]
  range?: { min?: number; max?: number; step?: number };
  enum?: readonly string[];
  pattern?: string;
  class: "B" | "K" | "T";
  classNote?: string;         // mis. "B (>= 0,18: K)"
  derive?: DeriveFnId;        // wajib untuk kelas T
  ruleRef: string;            // "DT-10" atau "-"
  source: string;             // "L721, TK82" | "research/04 T033" | "S01 §5.7"
  origin: "catalog" | "contract";
  group: ParamGroup;
  chapter: string;            // pengelompokan UI per bab manual: "Bab 1-2" | "Bab 3" | "Bab 4" | ... | "Lampiran" | "Renderer"
  namespace: string;          // segmen pertama key
  tiers?: Array<"NOTA" | "TERBIT" | "SERAH">;
  rek?: boolean;              // nilai [REK] sudah diganti research/04 (D-09)
  unreadable?: boolean;       // [TAK TERBACA]
  conflictRef?: string;       // konflik katalog "K-11" (research/01 §7.1)
  gapRef?: string;            // "G-03"
  inactive?: boolean;         // P15 workbook/brief (A5, D-05)
}
export type DeriveFnId = "fullSpan" | "latticeX" | "latticeY" | "allowedFigureWidths" | "pageWidthCheck" | "railMode" | "rederiveNonA4"
  | "tierSuggested" | "pdfEnabledByTier" | "reconciliationByTier" | "lintByTier" | "fileName" | "figureFileFromCaption" | "docNumberFileForm" | "monthRoman"
  | "coverLeftMargin" | "coverRuleWidth" | "ruleWeightFromHair" | "ticksFromSubcolumns" | "runningHeadRule" | "totalRowRule" | "captionIdentifierStyle"
  | "registerMaxDecimals" | "auditByTier" | "admiraltyOnce" | "serahByTier" | "vatEffective" | "issueNumber" | "chartEngine" | "eyeCheckList" | "wordLadder" | "railColsTw";
```
S04-S08 yang menemukan parameter T tanpa fungsi di daftar ini mengajukan `file_requests.md` (baris delta kontrak), tidak menambah sendiri.

### 5.2 Registri section 51 (`src/lib/studio/registry/sections.ts`, ditulis LENGKAP oleh S03)

Ekspor: `SECTION_REGISTRY: readonly SectionTypeDef[]`, `SECTION_REGISTRY_COUNT = 51`.
```ts
export interface SectionTypeDef { key: string; catalogId: string; group: "DOCUMENT" | "PAGE_DEVICE" | "CHANNEL"; register: "WRAPPER" | "INTERIOR" | "NONE"; name: string; elements: readonly string[]; paramRefs: readonly string[]; ruleRefs: readonly string[]; activeTiers: readonly ("NOTA"|"TERBIT"|"SERAH")[]; renderable: boolean; sourceRef: string }
```
Isi (unsur, parameter, aturan, sumber disalin dari `research/01:839-890`; tier dari `research/01:896-916`):

| catalogId | key | grup | register | tier aktif | renderable |
|---|---|---|---|---|---|
| S01 | `cover` | DOCUMENT | WRAPPER | TERBIT, SERAH | ya |
| S02 | `controlSheet` | DOCUMENT | WRAPPER | TERBIT, SERAH | ya |
| S03 | `toc` | DOCUMENT | WRAPPER | TERBIT, SERAH | ya |
| S04 | `partDivider` | DOCUMENT | WRAPPER | TERBIT, SERAH | ya |
| S05 | `signatureBlock` | DOCUMENT | WRAPPER | TERBIT, SERAH | ya |
| S06 | `chapter` | DOCUMENT | INTERIOR | semua | ya |
| S07 | `section` | DOCUMENT | INTERIOR | semua | ya |
| S08 | `appendix` | DOCUMENT | INTERIOR | semua | ya |
| S09 | `paragraph` | DOCUMENT | INTERIOR | semua | ya |
| S10 | `list` | DOCUMENT | INTERIOR | semua | ya |
| S11 | `aside` | DOCUMENT | INTERIOR | semua | ya |
| S12 | `monoBlock` | DOCUMENT | INTERIOR | semua | ya |
| S13 | `assumptionInline` | DOCUMENT | INTERIOR | semua | ya |
| S14 | `table` | DOCUMENT | INTERIOR | semua | ya |
| S15 | `specTable` | DOCUMENT | INTERIOR | semua | ya |
| S16 | `registerTable` | DOCUMENT | INTERIOR | semua (preset rekonsiliasi wajib SERAH, D16) | ya |
| S17 | `exampleWrongRight` | DOCUMENT | INTERIOR | semua | ya |
| S18 | `ruleTable` | DOCUMENT | INTERIOR | semua | ya |
| S19 | `derivation` | DOCUMENT | INTERIOR | semua (wajib SERAH per angka beban keputusan) | ya |
| S20 | `chart` | DOCUMENT | INTERIOR | semua | ya |
| S21 | `diagram` | DOCUMENT | INTERIOR | semua | ya |
| S22 | `image` | DOCUMENT | INTERIOR | semua | ya |
| S23 | `symbolSheet` | DOCUMENT | INTERIOR | semua | ya |
| S24 | `checklist` | DOCUMENT | INTERIOR | semua | ya |
| S25 | `glossary` | DOCUMENT | INTERIOR | semua | ya |
| S26 | `sourceRegister` | DOCUMENT | INTERIOR | semua | ya |
| S27 | `ruleIndex` | DOCUMENT | INTERIOR | semua | ya |
| S28 | `referenceScale` | DOCUMENT | INTERIOR | semua | ya |
| S29 | `financialTable` | DOCUMENT | INTERIOR | semua | ya |
| F1 | `runningHead` | PAGE_DEVICE | NONE | TERBIT, SERAH | ya |
| F2 | `registerBlock` | PAGE_DEVICE | NONE | TERBIT, SERAH | ya |
| F3 | `sealBand` | PAGE_DEVICE | NONE | TERBIT, SERAH | ya |
| F4 | `spineString` | PAGE_DEVICE | NONE | TERBIT, SERAH | ya |
| F5 | `evidenceRail` | PAGE_DEVICE | NONE | TERBIT (opsional), SERAH (wajib) | ya |
| F6 | `datumRule` | PAGE_DEVICE | NONE | TERBIT, SERAH | ya |
| F7 | `issueStampColophon` | PAGE_DEVICE | NONE | TERBIT, SERAH | ya |
| C01 | `letter` | CHANNEL | NONE | - | tidak |
| C02 | `slide.claimNumberBlock` | CHANNEL | NONE | - | tidak |
| C03 | `slide.chartOneAccent` | CHANNEL | NONE | - | tidak |
| C04 | `slide.specTable3Col` | CHANNEL | NONE | - | tidak |
| C05 | `slide.assumption` | CHANNEL | NONE | - | tidak |
| C06 | `slide.request` | CHANNEL | NONE | - | tidak |
| C07 | `sheet.cover` | CHANNEL | NONE | - | tidak |
| C08 | `sheet.petunjuk` | CHANNEL | NONE | - | tidak |
| C09 | `sheet.kendali` | CHANNEL | NONE | - | tidak |
| C10 | `sheet.ringkasanEksekutif` | CHANNEL | NONE | - | tidak |
| C11 | `sheet.rekapitulasi` | CHANNEL | NONE | - | tidak |
| C12 | `sheet.rab` | CHANNEL | NONE | - | tidak |
| C13 | `sheet.ahs` | CHANNEL | NONE | - | tidak |
| C14 | `sheet.hitung` | CHANNEL | NONE | - | tidak |
| C15 | `drawingSheet` | CHANNEL | NONE | - | tidak |

Hitungan: DOCUMENT 29 + PAGE_DEVICE 7 + CHANNEL 15 = 51. CHANNEL `renderable=false` (D-05: XLSX/PPTX di luar v2.1; `letter` belum punya renderer). "semua" = NOTA, TERBIT, SERAH. Tier sampul dilepas di NOTA (`research/01:899`).

### 5.3 ChartDef (S09)

```ts
export interface ChartDef {
  code: ChartCode; name: string; group: "P" | "H" | "K" | "W" | "S" | "G";
  purpose: "perbandingan" | "hubungan" | "komposisi" | "waktu" | "sebaran" | "geospasial" | "aliranProses";
  fn: string; useWhen: string; avoidWhen: string; manualTable: "8.1" | "8.2" | "8.3" | "8.4" | "8.5";
  drawn: boolean;
  dataShape?: ChartData["shape"];                                       // wajib bila drawn
  paramKeys: readonly string[];                                         // kunci di CHART_PARAMS
  pyRef: { kind: "datumchart" | "pustakachart" | "none"; ref?: string; form?: "PENUH" | "PARSIAL"; dataOrigin?: string };
  parityClass?: "CA" | "CB1" | "CB2" | "CC";                            // research/06:253-256
  module?: "core" | "family-p1" | "family-p2" | "family-h1" | "family-h2" | "family-k1" | "family-k2" | "family-w1" | "family-w2" | "family-s1" | "family-s2" | "family-g";
  alternatives?: readonly ChartCode[];                                  // WAJIB tidak kosong bila drawn=false (research/06:172-189)
  renderErrorCode?: "CHART_KIND_NOT_DRAWN";                             // WAJIB bila drawn=false
  benchmarkFigure?: "8.1" | "8.2" | "8.3" | "8.4" | "8.5";
}
```
Pembagian modul: P-01, P-02, P-11, W-02 -> `core` (S32); P-03..P-08 `family-p1`; P-09, P-10, P-12..P-15 `family-p2`; H-01..H-05 `family-h1`; H-06..H-09 `family-h2`; K-01..K-06 `family-k1`; K-07..K-12 `family-k2`; W-01, W-03..W-05 `family-w1` (W-02 di core); W-06..W-10 `family-w2`; S-01..S-04 `family-s1`; S-05..S-08 `family-s2`; G-01..G-04 `family-g`.

### 5.4 LintDef (S10)

```ts
export interface LintDef {
  id: string;                         // "DATUM-01".."DATUM-39" | "G1","G2","G3","N1" | "C-14".. | "D01".."D21" | "H01".."H16"
  group: LintGroup; title: string; limit: string; stage: "file" | "build" | "eye" | "guard" | "human";
  hqMode: readonly LintHqMode[]; partial: boolean; ruleRef: string; tiers: readonly ("NOTA"|"TERBIT"|"SERAH")[];
  blocksIngest: boolean;              // true -> 422 saat ingest (grup S by-construction + guard B, A10)
  module: "scan" | "render" | "structure" | "language" | "human";
  paramRef?: string;                  // mis. "lint.emDash.maxPer1000Words" (KT-06)
  notRunReason?: string;              // alat tidak tersedia (KT-13)
}
```
Hitungan: A 39 + B 4 + C 19 + D 21 = 83; H 16; total 99. Guard G4 (lantai lebar kolom numerik, `research/03:164`) dijalankan sebagai sub-cek G3 dengan `detail: "G4"`, tanpa entri sendiri (menjaga 83).

Minimal `blocksIngest=true` (§7.2 #6): DATUM-04, DATUM-10, DATUM-26, DATUM-31, DATUM-38, G1, G2, G3, N1. Pengecualian benchmark: DATUM-03 (em dash) `blocksIngest=false` (A10, R10).

### 5.5 Rencana section per tier

```ts
export interface SectionPlan { [tier: string]: { required: readonly string[]; optional: readonly string[]; forbidden: readonly string[]; requiredPresets?: Record<string, readonly string[]> } }
```
Default kanonik: SERAH `requiredPresets.registerTable = ["reconciliation"]` (D16, §7.2 #3).

### 5.6 RoleKey (format per peran; kunci `roleFormats` templat)

Resolusi format satu paragraf/run: format eksplisit blok > `roleFormats[role]` versi templat > turunan katalog (`type.scale.*`, `rules.*`) > gaya Normal templat.

| ID | RoleKey | Isi `{para, run}` untuk |
|---|---|---|
| U01 | `cover.logo` | paragraf logo sampul |
| U02 | `cover.addressLine` | baris alamat |
| U03 | `cover.hairline` | paragraf garis rambut |
| U04 | `wrapper.datumRule` | paragraf Datum Rule 166 |
| U05 | `wrapper.kicker` | kicker sampul dan pembatas bagian |
| U06 | `cover.titleFirst` | judul sampul baris pertama |
| U07 | `cover.titleLast` | judul sampul baris terakhir |
| U08 | `cover.standfirst` | lede sampul |
| U09 | `cover.scopeLine` | baris cakupan |
| U10 | `cover.identityString` | string identitas/punggung |
| U11 | `unit.sectionHolder` | paragraf pemegang sectPr |
| U12 | `front.kicker` | kicker Lembar Kendali/Daftar Isi |
| U13 | `front.pageTitle` | judul halaman depan |
| U14 | `controlSheet.blockHeading` | judul blok A/B/C/D |
| U15 | `controlSheet.methodStatement` | pernyataan metode |
| U16 | `toc.title` | judul daftar isi |
| U17 | `toc.note` | catatan daftar isi |
| U18 | `part.title` | judul pembatas bagian |
| U19 | `part.lede` | lede pembatas bagian |
| U20 | `chapter.kicker` | kicker bab/lampiran |
| U21 | `chapter.datumRule` | paragraf Datum Rule 128 |
| U22 | `chapter.title` | judul bab/lampiran |
| U23 | `section.heading` | judul seksi (`run` = judul, `numberRun` = nomor) |
| U24 | `body.paragraph` | badan |
| U25 | `caption` | caption (`run` = teks, `labelRun` = label) |
| U26 | `list.bullet` | butir bertanda (`markerRun`) |
| U27 | `list.number` | butir bernomor (`markerRun`) |
| U28 | `figure.paragraph` | paragraf gambar |
| U29 | `figure.keyRow` | baris KUNCI (`labelRun`) |
| U30 | `figure.source` | SUMBER di bawah gambar (`labelRun`) |
| U31 | `body.subheading` | sub-judul langkah |
| U32 | `wrapper.sealBand` | sel pita segel kiri/kanan |
| U33 | `cover.controlLabel` | label blok kendali sampul |
| U34 | `cover.controlValue` | nilai blok kendali, sel nilai Mono |
| U35 | `cover.colophonLeft` | kolofon kiri |
| U36 | `cover.colophonRight` | kolofon kanan (cap terbit) |
| U37 | `controlTable.header` | kepala tabel lembar kendali |
| U38 | `controlTable.cell` | sel tabel lembar kendali |
| U39 | `signature.space` | sel ruang tanda tangan |
| U40 | `toc.partLabel` | sel label Bagian |
| U41 | `toc.partTitle` | sel judul Bagian |
| U42 | `toc.partPage` | sel halaman Bagian |
| U43 | `toc.chapterLabel` | sel label Bab/Lampiran |
| U44 | `toc.chapterTitle` | sel judul Bab/Lampiran |
| U45 | `toc.chapterPage` | sel halaman Bab/Lampiran |
| U46 | `part.chapterNo` | sel nomor bab daftar bagian |
| U47 | `part.chapterTitle` | sel judul bab daftar bagian |
| U48 | `rail.prose` | prosa di kotak rel |
| U49 | `cell.empty` | paragraf sel kosong |
| U50 | `rail.mark` | baris tanda provenans (`glyphRun` per tanda) |
| U51 | `rail.source` | baris sumber rel |
| U52 | `rail.note` | catatan rel |
| U53 | `table.headerLeft` | kepala kolom rata kiri |
| U54 | `table.cellMono` | sel numeral/ID Mono |
| U55 | `table.cellText` | sel badan Serif |
| U56 | `table.source` | baris SUMBER dalam tabel (`labelRun`) |
| U57 | `table.headerRight` | kepala kolom rata kanan |
| U58 | `table.cellNumeralRight` | sel numeral rata kanan |
| U59 | `aside.label` | label aside |
| U60 | `aside.body` | prosa aside (`numberRun`) |
| U61 | `table.groupBand` | pita kelompok |
| U62 | `derivation.label` | label turunan |
| U63 | `derivation.intro` | prosa turunan |
| U64 | `derivation.expr` | sel ekspresi Mono / baris monoBlock |
| U65 | `derivation.value` | sel nilai + tanda rata kanan |
| U66 | `table.cellGlyph` | sel glif tunggal (centang) |
| U67 | `monoBlock.label` | label blok kode |
| U68 | `spacer.afterBlock` | paragraf kosong pemisah 6,75 pt |
| U69 | `spacer.afterList` | paragraf kosong penutup 3,4 pt |
| U70 | `spacer.generic` | paragraf kosong lain (spasi sampul, lembar kendali, atas judul bagian) |

Peran tingkat sel juga membawa `cell: { borders, marginsTw, shading }` (registri TCP research/07 §5.3).

### 5.7 Parameter renderer kontrak (`src/lib/studio/params/render.ts`, ditulis LENGKAP oleh S03; `origin: "contract"`, `group: "R"`, kelas B kecuali ditulis)

| ID | Kunci | Tipe | Default kanonik | Nilai profil Manual 000 (S95 mengukur) |
|---|---|---|---|---|
| R-01 | `render.docx.compatibilityMode` | int | 15 | 14 (`research/07:926`) |
| R-02 | `render.docx.defaultTabStopTw` | int | 720 | 720 |
| R-03 | `render.docx.updateFieldsOnOpen` | bool | true (Garis A A5) | false (`research/07:921`) |
| R-04 | `render.docx.embedTrueTypeFonts` | bool | true | true |
| R-05 | `render.docx.saveSubsetFonts` | bool | false | false |
| R-06 | `render.docx.docDefaults` | object | `{szHalfPt:19, spacingAfterTw:0, lineTw:270, lineRule:"exact", lang:"id-ID"}` | `research/07:896` |
| R-07 | `render.docx.normalStyle` | object | Serif sz19 2B3640 after0 line270 exact id-ID | `research/07:897` |
| R-08 | `render.docx.embedFonts` | list | Plex Serif/Sans Cond/Mono 4 slot + DejaVu Sans | 18 berkas; slot Bold = wajah SemiBold (`research/07:953-976`) |
| R-09 | `render.section.wrapper` | object (`SectionSetup`) | A4, margin dari grid, header/footer `empty` | `research/07:638-654, 744, 758` |
| R-10 | `render.section.interior` | object (`SectionSetup`) | header `runningHead`, footer `registerBlock` | `research/07:751, 765` |
| R-11 | `render.section.breakPerUnit` | bool | true | true |
| R-12 | `render.rail.renderer` | enum `framePr`, `table3col` | `framePr` (Garis A) | `table3col` (T013 dkk.) |
| R-13 | `render.rail.colsTw` | list int | T, `derive: railColsTw` | [7257, 340, 1814] |
| R-14 | `render.derivation.renderer` | enum `monoLines`, `nestedTable` | `monoLines` | `nestedTable` (N01, N02) |
| R-15 | `render.caption.separator` | string | " " | diukur S95 |
| R-16 | `render.table.sourcePlacement` | enum `lastRowMerged`, `paragraphBelow` | `lastRowMerged` | `lastRowMerged` (KT-26) |
| R-17 | `render.table.layout` | object | `{fixed:true, indentTw:0, cellMarginTw:{left:0,right:0}, borders:none}` | TP-01 (`research/07:269`) |
| R-18 | `render.spacer.autoMode` | enum `none`, `template` | `template` | `none` (S93 menulis spacer eksplisit) |
| R-19 | `render.spacer.defaults` | map jenis blok -> ParaFormat | tabel: line 135 exact; list: line 68 exact | tidak dipakai |
| R-20 | `render.list.bulletMarker` | object (`Run`) | `{t:"–"}` | RS21 |
| R-21 | `render.list.numberMarker` | object (`RunProps`) | Mono amber tebal | RS25 |
| R-22 | `render.toc.mode` | enum `field`, `static` | `field` | `static` (T010) |
| R-23 | `render.cover.mode` | enum `auto`, `explicit` | `auto` | `explicit` |
| R-24 | `render.html.paged` | bool | true | true |
| R-25 | `render.png.dpi` | int, K | 300 | 300 |

Jumlah: 25. `RoleFormatMap` disimpan di kolom `roleFormats`, bukan ParamDef.

**Revisi d1/d2 (§5.7)** — catatan revisi 2026-10-23, aditif; tabel di atas tidak diubah. Sumber: `implementation/02_contract_delta_d1.md` (D-69), `implementation/03_contract_delta_d2.md` (INT-D, IP-07). Default baru = perilaku mesin saat ini, sehingga profil kanonik tidak berubah makna.

| ID | Kunci | Tipe | Default kanonik | Catatan |
|---|---|---|---|---|
| R-26 (d1) | `runningHead.docLabel` | string | `""` | kosong = `meta.subject`, lalu `meta.title` (D-39) |
| R-27 (d1) | `org.shortName` | string | `"GSP"` | sel pertama blok register footer (D-39) |
| R-28 (d1) | `render.derivation.nestedColsTw` | list | `null` | null = diturunkan renderer; Manual 000 [5216, 1814] (S95-C08) |
| R-29 (d1) | `render.section.registerBlockLayout` | object | `{}` | `{ colsTw?, cellFormats?, trailingFormat? }` (G-08, S95-C09) |
| R-30 (d1) | `render.docx.headerFooterStyles` | object | gaya Header/Footer yang kini ditulis S14 (tab 4680 center + 9360 right, after 0, line 240 auto) | G-07, S95-C10 |
| R-31 (d1) | `render.docx.settingsExtras` | map | `{}` | S95-C11 |
| R-32 (d1) | `render.runningHead.runProps` | object | `{}` | `{ left?, right?: RunProps }` (S95-C05) |
| R-33 (d1) | `render.section.numberSeparator` | string | `"   "` | `Section.numberSeparator` dokumen menang (G-01, S95-C14) |
| R-34 (d1) | `render.specTable.conditionIndentMm` | mm 0..50 | 0 | D-51; P5-27 tanpa besar (celah) |
| R-35 (d2) | `lint.enforcementOverride` | map, **K** | `{}` | `{ "<checkId>": "block"\|"release"\|"report"\|"off" }`; dibaca S46 `engine/lint/structure/enforcement.ts` (`ENFORCEMENT_PARAM_KEY`); profil boleh semua mode, dokumen `x.lintEnforcement` hanya block -> release; id/mode tak sah dilaporkan REPORT `STRUCT-ENFORCEMENT` (D-34, D-70); `chapter: "Bab 16"`, `namespace: "lint"` |

Jumlah sesudah revisi: 35 (`RENDER_PARAM_COUNT` = `PARAMS_RENDER_COUNT` = 35); registri total 673 + 35 = 708 (d2); sejak d3 (INT-V, D-108) 685 + 35 = 720. `type.face.<role>` tidak ditambah sebagai parameter renderer (sudah ada P4T-01..05). Revisi d1 juga mengubah parameter katalog (bukan §5.7): R01/F-023 (P1-04, P3-20 + `STD`, P15-28 -> `list`+`enum`; P5-48/63/65 pola templat; P9-02 boleh kosong; P10-34 `"1/2"`) dan P5-03 menerima `top`.

**Revisi d3 (INT-V, D-108)** — catatan revisi 2026-10-23, aditif; hanya angka hitungan. Hitungan nyata dari modul (skrip tsx): `CATALOG_PARAMS` = 685 (115 + 134 + 91 + 111 + 135 + 99), parameter renderer kontrak = 35, `ALL_PARAMS` = 720; `origin` catalog 685 / contract 35. Kenaikan 673 -> 685 = 12 parameter mesin chart (IP-25, `origin: "catalog"`, `source` "mesin ..."). Baris 28 (673 = acuan manual `research/01`) sengaja tidak diubah.

## 6. Route API

### 6.1 Konvensi

- Semua handler: `export const dynamic = "force-dynamic"`; baris pertama `const denied = await requireSession(req); if (denied) return denied;` (`src/lib/require-session.ts:22-27`), termasuk GET.
- Identitas pemanggil: `getStudioCaller(req): Promise<StudioCaller>` di `src/lib/studio/contract/auth.ts` (ditulis LENGKAP S03): cookie `gsp_hq_session` valid dengan `r === "ADMINISTRATOR"` -> `ADMIN_SESSION`; cookie lain -> `USER_SESSION`; JWT NextAuth -> `GOOGLE_SESSION` (diperlakukan USER); `x-internal-secret` -> `INTERNAL_AGENT`. Hanya `ADMIN_SESSION` boleh menulis kelas K (KT-16); kelas T tidak boleh ditulis siapa pun (400 `PARAM_CLASS_T_READONLY`).
- Galat: `NextResponse.json({ error: <pesan>, code: StudioErrorCode, details?: ValidationIssue[] }, { status })` (pola `{error}` repo `research/02:472` + `code`).
- Param route dinamis Next 16: `{ params }: { params: Promise<{ id: string }> }` (`research/02:472`).
- Batas badan: tolak sebelum parse bila `content-length` > `STUDIO_MAX_JSON_BYTES` (413 `PAYLOAD_TOO_LARGE`).

### 6.2 Tabel route

| ID | Path | Metode | Pemilik | Permintaan | Respons sukses | Galat khusus |
|---|---|---|---|---|---|---|
| R01 | `/api/studio/templates` | GET | S54 | `?kind=&archived=0` | 200 `{ templates: TemplateSummary[] }` | - |
| R01 | `/api/studio/templates` | POST | S54 | `{ slug, name, kind, baseVersionId?, overrides, roleFormats?, sectionPlan?, changeNote }` | 201 `{ template, version }` | 409 `TEMPLATE_SLUG_EXISTS`; 403 `PARAM_CLASS_K_FORBIDDEN`; 422 `PARAM_UNKNOWN_KEY` |
| R02 | `/api/studio/templates/[id]` | GET | S54 | `?version=n` | 200 `{ template, version, versions: VersionSummary[] }` | 404 `TEMPLATE_NOT_FOUND` |
| R02 | `/api/studio/templates/[id]` | POST | S54 | `{ overrides, roleFormats?, sectionPlan?, changeNote, baseVersionNo }` (simpan = versi baru) | 201 `{ version }` | 409 `VERSION_CONFLICT`; 403; 400 `CHANGE_NOTE_REQUIRED` |
| R03 | `/api/studio/registry` | GET | S54 | `?kind=sections\|params\|charts\|diagram\|symbols\|lint\|roles\|schema&schemaId=studio.doc/v1` | 200 `{ kind, items }` atau dokumen JSON Schema (`application/schema+json`) | 400 `REGISTRY_KIND_UNKNOWN` |
| R04 | `/api/studio/documents` | GET | S55 | `?mission=&agentRequestId=&hermesTaskId=&take=&cursor=` (take maks 200) | 200 `{ documents: DocumentSummary[], nextCursor }` | - |
| R04 | `/api/studio/documents` | POST | S55 | `StudioIngestRequest` | 201 `{ document, revision, outputs: OutputFileDto[], job, releaseStatus, lint }` | 400 `SCHEMA_INVALID`; 403; 404 `MISSION_REF_NOT_FOUND`/`TEMPLATE_NOT_FOUND`; 409 `DOC_NUMBER_EXISTS`; 422 `BY_CONSTRUCTION_FAILED`; 503-tanpa-gagal: PDF tidak siap -> 201 dengan `job.status = PARTIAL` dan `errors:[{code:"PDF_ENGINE_UNAVAILABLE"}]` |
| R05 | `/api/studio/documents/[id]` | GET | S55 | `?rev=n` | 200 `{ document, revision, tree: AddressNode[], outputs }` | 404 `DOCUMENT_NOT_FOUND`/`REVISION_NOT_FOUND` |
| R06 | `/api/studio/documents/[id]/blocks/[address]` | GET | S56 | `?rev=n` | 200 `{ address, blockId, type, content, revisionNo }` | 400 `ADDRESS_INVALID`; 404 `ADDRESS_NOT_FOUND` |
| R06 | `/api/studio/documents/[id]/blocks/[address]` | PATCH | S56 | `{ baseRevisionNo, op: "replace"\|"insertBefore"\|"insertAfter"\|"delete", block?, cell?, change: { what, why, impact } }` | 200 `{ revision, addressMap, job, outputs }` | 400 `CHANGE_FIELDS_REQUIRED`; 409 `REVISION_CONFLICT`; 422 |
| R07 | `/api/studio/documents/[id]/revisions` | GET | S56 | - | 200 `{ revisions: RevisionSummary[] }` | 404 |
| R07 | `/api/studio/documents/[id]/revisions` | POST | S56 | `{ revisionNo, formats? }` (render ulang revisi lama, tanpa revisi baru) | 200 `{ job, outputs, identical: boolean }` | 404; 409 `RENDER_IN_PROGRESS` |
| R08 | `/api/studio/validate` | POST | S55 | `StudioIngestRequest` atau `{ schemaId, spec }` + `?preview=html` | 200 `{ valid, issues: ValidationIssue[], lint, previewHtml? }` (tidak menyimpan; 422 TIDAK dipakai, invalid = 200 `valid:false`) | 400 hanya untuk JSON rusak |
| R09 | `/api/studio/artifacts` | GET | S57 | `?kind=&mission=&take=` | 200 `{ artifacts }` | - |
| R09 | `/api/studio/artifacts` | POST | S57 | `{ agentId?, spec: StudioChartV1\|StudioDiagramV1\|StudioImageV1\|StudioHtmlV1, mission?, formats? }`; multipart `file` untuk aset raster | 201 `{ artifact, outputs, job }` | 400; 413 `ASSET_TOO_LARGE`; 415 `ASSET_TYPE_UNSUPPORTED`; 422 `CHART_KIND_NOT_DRAWN` (+`alternatives`), `DATUM-31`, `DATUM-39` |
| R10 | `/api/studio/files/[id]` | GET | S57 | `?download=1` | 200 berkas; `Content-Type` dari `mime`; `Content-Disposition` `inline`/`attachment` dengan nama berkas; `Cache-Control: no-store` | 404 `FILE_NOT_FOUND`; 403 `PATH_OUTSIDE_ROOT`; 410 `FILE_MISSING_ON_DISK` |
| R11 | `/api/studio/render-env` | GET | S102 | `?jobs=1&take=50` | 200 `{ readiness: RenderEnvReadiness, jobs?: RenderJobDto[] }` (hanya baca) | - |

Satu ID route = satu path; metode ganda pada path sama memakai ID yang sama. Path S54 yang ditambahkan spesifikasi ini: R02 (`/templates/[id]`), dalam area S54 (`studio/templates`).

### 6.3 Kode galat (`StudioErrorCode`, E24)

| Kode | HTTP | Arti |
|---|---|---|
| `UNAUTHORIZED` | 401 | dari `requireSession` (pesan `Unauthorized` tetap) |
| `PARAM_CLASS_K_FORBIDDEN` | 403 | kelas K oleh non-ADMIN_SESSION |
| `PARAM_CLASS_T_READONLY` | 400 | kunci kelas T ditulis |
| `PARAM_UNKNOWN_KEY` | 422 | kunci tidak ada di registri |
| `SCHEMA_INVALID` | 400 | JSON tidak lolos skema; `details` berisi pointer |
| `JSON_MALFORMED` | 400 | badan bukan JSON |
| `CHANGE_FIELDS_REQUIRED` | 400 | apa/mengapa/dampak kosong |
| `CHANGE_NOTE_REQUIRED` | 400 | versi templat tanpa catatan |
| `ADDRESS_INVALID` | 400 | tidak sesuai EBNF |
| `ADDRESS_NOT_FOUND` | 404 | alamat tidak ada di revisi |
| `DOCUMENT_NOT_FOUND`, `REVISION_NOT_FOUND`, `TEMPLATE_NOT_FOUND`, `ARTIFACT_NOT_FOUND`, `FILE_NOT_FOUND` | 404 | |
| `MISSION_REF_NOT_FOUND` | 404 | `agentRequestId`/`hermesTaskId` tidak ada, atau `mission.folder` tidak valid |
| `DOC_NUMBER_EXISTS`, `TEMPLATE_SLUG_EXISTS` | 409 | unik |
| `REVISION_CONFLICT`, `VERSION_CONFLICT`, `RENDER_IN_PROGRESS` | 409 | |
| `BY_CONSTRUCTION_FAILED` | 422 | `details[].checkId` (mis. `DATUM-04`, `G1`) |
| `CHART_KIND_NOT_DRAWN` | 422 | `details.alternatives: ChartCode[]` |
| `CHART_KIND_UNKNOWN` | 422 | |
| `DATUM-31`, `DATUM-39` | 422 | Mermaid; resolusi gambar |
| `PAYLOAD_TOO_LARGE`, `ASSET_TOO_LARGE` | 413 | |
| `ASSET_TYPE_UNSUPPORTED` | 415 | sniff bukan PNG/JPEG |
| `PATH_OUTSIDE_ROOT` | 403 | guard traversal |
| `FILE_MISSING_ON_DISK` | 410 | baris DB ada, berkas hilang |
| `PDF_ENGINE_UNAVAILABLE` | (dalam job) | soffice/fon tidak siap (KT-17); bila hanya PDF diminta: 503 |
| `PDF_CONVERT_FAILED` | (dalam job) | soffice exit != 0 / PDF kosong |
| `RENDER_TIMEOUT` | (dalam job) | batas waktu |
| `STORAGE_ROOT_FORBIDDEN` | 500 saat start | akar Studio sama/di dalam `SHARED_WORKSPACE` (KT-03) |
| `REGISTRY_KIND_UNKNOWN` | 400 | |

**Revisi d1/d2 (§6.3)** — catatan revisi 2026-10-23, aditif; 36 -> 40 (d1, D-69) -> 41 (d2, D-72/IP-07). Sumber: `contract/enums.ts` `STUDIO_ERROR_CODES`, `contract/errors.ts` `STUDIO_ERROR_HTTP`.

| Kode | HTTP | Arti | Revisi |
|---|---|---|---|
| `BROWSER_UNAVAILABLE` | 503 | Chromium tidak dapat diluncurkan/beroperasi (S25, D-38) | d1 |
| `HTML_RENDER_FAILED` | 500 | perakitan HTML gagal (`HtmlAssembleError` S24, D-45) | d1 |
| `RENDER_FAILED` | 500 | job render gagal di luar kode khusus (S51, D-52) | d1 |
| `STORAGE_WRITE_FAILED` | 500 | tulis berkas keluaran gagal (S51, D-52) | d1 |
| `FORBIDDEN` | 403 | sesi sah tetapi peran tidak berhak atas aksi (mis. `render-env?refresh=1` non-admin). 401 tetap `UNAUTHORIZED`; penulisan kelas K tetap `PARAM_CLASS_K_FORBIDDEN` | d2 |

Catatan d2: S102 (R11) kini masih mengirim 403 dengan `code: "UNAUTHORIZED"` (D-72); pengalihan ke `FORBIDDEN` dijadwalkan di pass integrasi INT-E (helper route IP-08), bukan di delta ini.

## 7. Konstanta, env, penyimpanan

### 7.1 Env dan konstanta (`src/lib/studio/contract/env.ts`)

| ID | Nama | Jenis | Default | Catatan |
|---|---|---|---|---|
| C01 | `SOFFICE_PATH` | env | `C:\Program Files\LibreOffice\program\soffice.com` | terverifikasi Glob sesi ini |
| C02 | `STUDIO_WORKSPACE_ROOT` | env | `data/studio-workspace` (relatif `process.cwd()` = akar repo) | KT-03; `.gitignore` oleh S69 |
| C03 | `STUDIO_CHROMIUM_PATH` | env | `C:\Users\TRIAL\AppData\Local\ms-playwright\chromium-1234\chrome-win64\chrome.exe` | terverifikasi Glob; revisi 1234 = `playwright-core@1.62.1/browsers.json:5-8` |
| C04 | `STUDIO_RENDER_ENV_MANIFEST` | env | `render-env/manifest.json` | S91 |
| C05 | `STUDIO_SOFFICE_TIMEOUT_MS` | env | 180000 | hipotesis untuk 102 halaman; S81 mengukur |
| C06 | `STUDIO_SOFFICE_MAX_INSTANCES` | env | 2 | A3; nilai > 2 ditolak (clamp 2) |
| C07 | `STUDIO_CHROMIUM_TIMEOUT_MS` | konstanta | 30000 | per operasi halaman |
| C08 | `STUDIO_RENDER_JOB_TIMEOUT_MS` | konstanta | 600000 | |
| C09 | `STUDIO_MAX_JSON_BYTES` | konstanta | 5242880 | 5 MiB |
| C10 | `STUDIO_MAX_ASSET_BYTES` | konstanta | 20971520 | 20 MiB per aset |
| C11 | `STUDIO_MAX_ASSETS_PER_DOC` | konstanta | 200 | |
| C12 | `STUDIO_MAX_BLOCKS_PER_DOC` | konstanta | 20000 | |
| C13 | `STUDIO_MAX_TABLE_CELLS` | konstanta | 5000 | per tabel |
| C14 | `STUDIO_MAX_RUN_CHARS` | konstanta | 20000 | per run |
| C15 | `STUDIO_READINESS_CACHE_MS` | konstanta | 300000 | cek render-env di-cache 5 menit |
| C16 | `STUDIO_ROUTES` | konstanta | objek path R01-R11 | satu sumber path untuk UI/S68 |
| C17 | `STUDIO_SCHEMA_IDS` | konstanta | 5 id skema §3 | |

Fungsi `getStudioEnv(): StudioEnv` membaca env sekali, mengembalikan path absolut, dan melempar `STORAGE_ROOT_FORBIDDEN` bila `path.resolve(C02)` sama dengan atau di dalam `path.resolve(process.env.SHARED_WORKSPACE)`.

### 7.2 Tata letak penyimpanan (S52)

```
<STUDIO_WORKSPACE_ROOT>/
  docs/<YYYY-MM-DD>_<misi>/studio/<nomor-berkas>/rev-<n>/<Judul> <nomor-berkas> Rev<X>.<ext>
  docs/<YYYY-MM-DD>_<misi>/studio/<nomor-berkas>/rev-<n>/figur/<Gambar C.n Judul>.<svg|png>
  docs/<YYYY-MM-DD>_<misi>/studio/artefak/<artifactId>/<Label atau Judul>.<ext>
  assets/<sha256>.<png|jpg>
  tmp/<jobId>/{in,out,lo-profile}/          (dihapus setelah job, sukses maupun gagal)
```
- `<YYYY-MM-DD>_<misi>` = `mission.folder` (regex `^\d{4}-\d{2}-\d{2}[_-][a-z0-9][a-z0-9_-]{0,80}$`, cocok `classifyPath` IL `research/02:412`); absen -> `<issueDate>_studio`.
- `<nomor-berkas>` = `docNumber` dengan `/` -> `-` (P3-19), mis. `000-GSP-STD-X-2026`.
- Nama berkas DATUM tanpa garis bawah (DATUM-38): `_` -> spasi; karakter `<>:"/\|?*` dan kendali dibuang; spasi beruntun dirapatkan; maks 120 karakter sebelum ekstensi; titik/spasi akhir dibuang. Contoh: `Manual Komprehensif DATUM GSP 000-GSP-STD-X-2026 RevA.docx`.
- Guard: setiap path dibangun dengan `path.join` lalu `path.resolve` dan wajib berawalan akar + pemisah; selain itu `PATH_OUTSIDE_ROOT`.
- `relPath` di DB memakai `/`.

## 8. Antarmuka modul mesin dan layanan

### 8.1 Tipe konteks bersama (`src/lib/studio/contract/engine.ts`)

```ts
export type ParamMap = Readonly<Record<string, ParamValue>>;
export interface RoleFormat { para?: ParaFormat; run?: RunProps; labelRun?: RunProps; numberRun?: RunProps; markerRun?: RunProps; glyphRun?: Partial<Record<ProvenanceMark, RunProps>>; cell?: { borders?: Borders; marginsTw?: Cell["marginsTw"]; shading?: Shading } }
export type RoleFormatMap = Readonly<Partial<Record<RoleKey, RoleFormat>>>;
export interface ResolvedTemplate { templateId: string; versionId: string; versionNo: number; params: ParamMap; roleFormats: RoleFormatMap; sectionPlan: SectionPlan; assets: Readonly<Record<string, { sha256: string; absPath: string; kind: "font" | "raster" | "base" }>> }
export interface RenderContext { snapshot: NormDocSnapshot; tpl: ResolvedTemplate; register: RegisterApi; fixedDate: string /* meta.issueDate, determinisme */; figures: FigureStore; log: (e: RenderLogEntry) => void }
export interface FigureStore { get(label: string): { svg?: string; png?: Uint8Array; widthMm: number; heightMm: number } | undefined }
export interface DocxFragment { xml: string; media?: Array<{ name: string; data: Uint8Array; contentType: string }>; facesUsed?: string[] }
export type DocxBlockRenderer = (block: NormBlock, ctx: RenderContext) => DocxFragment;
export type HtmlBlockRenderer = (block: NormBlock, ctx: RenderContext) => string;
export interface SvgResult { svg: string; widthMm: number; heightMm: number; report: { checksRun: string[]; issues: LintIssue[] } }
export interface LintIssue { checkId: string; status: LintCheckStatus; detail?: string; address?: string; pointer?: string }
export interface LintReport { tier: "NOTA" | "TERBIT" | "SERAH"; checks: LintIssue[]; releaseStatus: "PASS" | "FAIL" | "NOT_RUN"; banner: string }
```

**Revisi d1/d2 (§8.1)** — catatan revisi 2026-10-23, aditif (medan opsional); satu pelebaran tipe atas keputusan D-63. Sumber: `contract/engine.ts`, `contract/types/params.ts`.

```ts
// d1 (D-69)
export interface RoleFormat { /* ...§8.1 */ labelRunByMark?: Partial<Record<ProvenanceMark, RunProps>>; rightCell?: CellFormat; firstRowCell?: CellFormat; signatureCell?: CellFormat }
export interface RenderContext { /* ...§8.1 */ assetBytes?: (sha256: string, key?: string) => Uint8Array | undefined /* sinkron; D-63 S48 */ }
export interface ChartCanvas { /* ... */ widthMm: number /* sebelumnya 128 | 166; D-63 S32 */ }
export interface LayoutResult { /* ... */ family?: DiagramFamily; laneOrder?: string[]; gutterMm?: number; lifelines?: Array<{ id: string; x: number; top: number }>; msgY?: number; msgStep?: number; msgEnd?: number }
export interface EmbedFontFamilyEntry { family?: string; slots: Array<"regular" | "bold" | "italic" | "boldItalic">; role?: FaceRole; boldFace?: "canonical" | "semibold"; files?: Partial<Record<"regular" | "bold" | "italic" | "boldItalic", string>>; forceEmbed?: boolean /* S95-C15; bentuk entri R-08 */ }
// CellFormat (types/common.ts): { para?, borders?, marginsTw?, shading?, vAlign?, widthTw? }

// d2 (IP-23, D-76): ResolvedTemplate.sectionPlan: SectionPlan (§5.5) menerima medan opsional per tier
export interface SectionPlan { [tier: string]: { required: readonly string[]; optional: readonly string[]; forbidden: readonly string[]; requiredPresets?: Record<string, readonly string[]>; order?: readonly string[] } }
```
- `order` = urutan tampil lintas status; kunci registri, unik, masing-masing tercantum di salah satu daftar tier; absen = urutan registri; kunci yang tidak disebut menyusul dalam urutan registri (`orderedPlanSections`, `registry/sections.ts`). Tidak mengubah makna wajib/opsional/terlarang. Divalidasi `validateSectionPlan` (S49): kunci asing `PARAM_UNKNOWN_KEY`, ganda/tidak tercantum `SCHEMA_INVALID`; disimpan/dimuat apa adanya di `StudioTemplateVersion.sectionPlan`. Profil kanonik tidak mengisi `order`.
- `CANONICAL_REQUIRED_BY_TIER` (daftar wajib per tier profil kanonik) kini diekspor `registry/sections.ts` (hanya impor tipe; aman-klien); `services/templates/profile.ts` mengekspor ulang nilai yang sama.

### 8.2 Register modul (path = `src/lib/studio/<path>/index.ts`; stub S03 mengekspor tanda tangan yang sama dengan badan `throw new StudioNotImplemented("<modul>")`, kecuali peta renderer = `{}` bertipe)

| ID | Path | Pemilik | Ekspor (tanda tangan) |
|---|---|---|---|
| I01 | `engine/tokens` | S11 | `resolveParams(i: { base: ParamMap; overrides: ParamMap; registry: readonly ParamDef[] }): { params: ParamMap; errors: ParamIssue[] }`; `computeDerived(p: ParamMap): ParamMap`; `checkOverrideRights(o: ParamMap, caller: CallerKind, registry: readonly ParamDef[]): ParamIssue[]`; `resolveRoleFormat(tpl: ResolvedTemplate, role: RoleKey): RoleFormat` |
| I02 | `engine/bind` | S12 | `class Register implements RegisterApi`; `fmt(v: number, dec?: number): string`; `class Derivation`; `evalArith(expr: string, vars: Readonly<Record<string, number>>): number` (parser aman, tanpa eval/Function); `auditText(text: string, reg: RegisterApi, allow?: readonly string[]): AuditFinding[]`; `auditRetired(text: string, retired: readonly string[]): AuditFinding[]`; `class BindDefect extends Error` |
| I03 | `engine/docx/package` | S14 | `buildDocxPackage(i: DocxPackageInput): Uint8Array` (ZIP deterministik, mtime = `fixedDate`); `sectPrXml(s: SectionSetup, rel: { headerRId: string; footerRId: string }): string`; `headerFooterXml(spec: HeaderFooterSpec, ctx: RenderContext, unit: NormUnit, kind: "hdr" \| "ftr"): string`; `stylesXml(tpl: ResolvedTemplate): string`; `settingsXml(tpl: ResolvedTemplate): string`; `corePropsXml(meta: DocMeta): string` |
| I04 | `engine/docx/fonts` | S15 | `obfuscateFont(ttf: Uint8Array, guid: string): Uint8Array`; `planEmbeddedFonts(tpl: ResolvedTemplate, facesUsed: ReadonlySet<string>): EmbeddedFontPlan` |
| I05 | `engine/docx/blocks` | S16 | `docxBlocks: Partial<Record<"paragraph" \| "list" \| "aside" \| "monoBlock" \| "assumptionInline" \| "spacer" \| "device" \| "chapter" \| "section", DocxBlockRenderer>>`; `runsXml(runs: readonly Run[], base: RunProps): string`; `parseMdLite(text: string, roles: { mono: RunProps; bold: RunProps; italic: RunProps }): Run[]` |
| I06 | `engine/docx/tables` | S17 | `docxTables: Partial<Record<TableBlock["type"], DocxBlockRenderer>>`; `solveWidths(rows: readonly string[][], totalMm: number): number[]`; `tableGuards(b: TableBlock): LintIssue[]` (G1-G3, G4 sub) |
| I07 | `engine/docx/wrapper` | S18 | `docxWrapper: Partial<Record<"cover" \| "controlSheet" \| "toc" \| "partDivider" \| "signatureBlock" \| "appendix", DocxBlockRenderer>>` |
| I08 | `engine/docx/figures` | S19 | `docxFigures: Partial<Record<"chart" \| "diagram" \| "image" \| "symbolSheet" \| "derivation", DocxBlockRenderer>>` |
| I09 | `engine/docx/assemble` | S20 | `assembleDocx(ctx: RenderContext): Promise<{ bytes: Uint8Array; facesUsed: string[] }>` (memakai `DOCX_RENDERERS` dari dispatcher D01) |
| I10 | `engine/html/base` | S21 | `htmlShell(i: { tpl: ResolvedTemplate; meta: DocMeta; bodyHtml: string; fontsCss: string; previewLabel?: boolean }): string`; `tokenCss(tpl: ResolvedTemplate): string`; `fontFaceCss(tpl: ResolvedTemplate, faces: ReadonlySet<string>): string` |
| I11 | `engine/html/blocks` | S22 | `htmlBlocks: Partial<Record<BlockType \| StructuralType, HtmlBlockRenderer>>` (himpunan S16+S18); `escapeHtml(s: string): string` |
| I12 | `engine/html/tables` | S23 | `htmlTables: Partial<Record<TableBlock["type"] \| "chart" \| "diagram" \| "image" \| "symbolSheet" \| "derivation", HtmlBlockRenderer>>` |
| I13 | `engine/html/assemble` | S24 | `assembleHtml(ctx: RenderContext, opts: { preview: boolean }): Promise<string>` |
| I14 | `engine/browser` | S25 | `getBrowser(): Promise<BrowserHandle>`; `rasterizeSvg(svg: string, i: { widthMm: number; heightMm: number; dpi: 300 }): Promise<Uint8Array>`; `measureLayout(html: string): Promise<LayoutMetrics>`; `closeBrowser(): Promise<void>` (setContent saja, rute jaringan diblokir, `javaScriptEnabled:false`, semafor 1) |
| I15 | `engine/soffice` | S92 | `checkRenderEnvReadiness(opts?: { force?: boolean }): Promise<RenderEnvReadiness>`; `convertDocxToPdf(docx: Uint8Array, i: { jobId: string; fileName: string }): Promise<{ pdf: Uint8Array; durationMs: number }>` (melempar `StudioEngineError` kode `PDF_ENGINE_UNAVAILABLE` / `PDF_CONVERT_FAILED` / `RENDER_TIMEOUT`) |
| I16 | `engine/diagram/core` | S26 | `loadSpec(input: unknown): StudioDiagramV1` (tolak Mermaid); `validateSpec(s: StudioDiagramV1): LintIssue[]`; `class Sheet`; `svgText(...)`; `estimate(s: StudioDiagramV1): { widthMm: number; heightMm: number; nColour: number }` |
| I17 | `engine/diagram/layout-a` | S27 | `layoutLayered(s, sheet)`, `layoutFlow(s, sheet)` (juga `stack`, `topology`) : `LayoutResult` |
| I18 | `engine/diagram/layout-b` | S28 | `layoutSwimlane(s, sheet)`, `layoutSequence(s, sheet)` : `LayoutResult` |
| I19 | `engine/diagram/layout-c` | S29 | `layoutSld(s, sheet)`, `layoutRack(s, sheet)`, `layoutGraph(s, sheet)` : `LayoutResult` |
| I20 | `engine/diagram/build` | S30 | `routeEdges(s, sheet)`, `addCrossingHops(paths)`, `buildDiagramSvg(s: StudioDiagramV1, opts: { release: boolean }): SvgResult` (memakai `DIAGRAM_LAYOUTS` dispatcher) |
| I21 | `engine/symbols` | S31 | `SYMBOL_IDS: readonly string[]` (41); `symbolSvg(id: string): string`; `symbolSheetSvg(d: SymbolDialect, cols?: number): string[]`; `symbolPortsMm(id: string): Array<{ name: string; x: number; y: number }>` |
| I22 | `engine/chart/core` | S32 | `chartCanvas(widthMm: 128 \| 166, heightMm: number): ChartCanvas`; `renderChart(spec: StudioChartV1, tpl: ResolvedTemplate): SvgResult` (cari `CHART_RENDERERS`; `drawn=false` -> `CHART_KIND_NOT_DRAWN`); `renderComposite(spec)`; `chartCore: ChartRendererMap` (P-01, P-02, P-11, W-02) |
| I23-I33 | `engine/chart/family-p1`, `family-p2`, `family-h1`, `family-h2`, `family-k1`, `family-k2`, `family-w1`, `family-w2`, `family-s1`, `family-s2`, `family-g` | S33-S43 | masing-masing satu ekspor `chartFamilyP1` .. `chartFamilyG`: `ChartRendererMap` (= `Partial<Record<ChartCode, (spec: StudioChartV1, canvas: ChartCanvas, tpl: ResolvedTemplate) => SvgResult>>`), berisi kode §5.3 |
| I34 | `engine/lint/scan` | S44 | `runLint(i: { snapshot: NormDocSnapshot; tpl: ResolvedTemplate; tier: StudioTier; stage: "ingest" \| "post" }): LintReport`; `scanText(text: string, params: ParamMap): LintIssue[]`; `byConstructionChecks(doc: StudioDocV1): LintIssue[]` |
| I35 | `engine/lint/render` | S45 | `lintRendered(i: { html?: string; svgs: readonly SvgResult[]; metrics: LayoutMetrics }): LintIssue[]` (14, 15, 25, 28, 32, 33, 37) |
| I36 | `engine/lint/structure` | S46 | `lintStructure(s: NormDocSnapshot, tpl: ResolvedTemplate, tier: StudioTier): LintIssue[]` (D01-D21) |
| I37 | `engine/lint/language` | S47 | `lintLanguage(s: NormDocSnapshot, params: ParamMap): LintIssue[]` (NOT_RUN jujur dengan `notRunReason`) |
| I38 | `services/ingest` | S48 | `ingestDocument(req: StudioIngestRequest, caller: StudioCaller, opts: { dryRun: boolean }): Promise<IngestResult>`; `normalize(doc: StudioDocV1, tpl: ResolvedTemplate): NormDocSnapshot`; `validateSchema(schemaId: string, data: unknown): ValidationIssue[]` |
| I39 | `services/templates` | S49 | `listTemplates(q)`, `getTemplate(id, versionNo?)`, `createTemplate(input, caller)`, `createTemplateVersion(id, input, caller)`, `resolveTemplate(slug: string, version?: number): Promise<ResolvedTemplate>` |
| I40 | `services/revisions` | S50 | `getBlock(docId, address, rev?)`, `patchBlock(docId, address, input: PatchBlockInput, caller): Promise<PatchResult>`, `listRevisions(docId)`, `rerenderRevision(docId, revNo, formats?)` |
| I41 | `services/render` | S51 | `renderRevision(revisionId: string, formats: readonly StudioOutputFormat[], caller: StudioCaller): Promise<RenderOutcome>`; `renderArtifact(artifactId: string, formats, caller): Promise<RenderOutcome>` |
| I42 | `services/storage` | S52 | `docDir(i: { missionFolder?: string; issueDate: string; docNumber: string; revisionNo: number }): string`; `datumFileName(title: string, docNumber: string, rev: string, ext: string): string`; `writeOutput(i: WriteOutputInput): Promise<StudioOutputFileDto>`; `resolveSafe(relPath: string): string`; `assertMissionRefs(m: StudioDocV1["mission"]): Promise<void>` |
| I43 | `services/images` | S53 | `decodeImage(input: { base64?: string; bytes?: Uint8Array }): { mime: "image/png" \| "image/jpeg"; widthPx: number; heightPx: number; bytes: Uint8Array; sha256: string }`; `pxGuard(widthPx: number, widthMm: number, minDpi: 150 \| 300): LintIssue \| null` |

**Revisi d1 (§8.2 I40)** — catatan revisi 2026-10-23, aditif (D-54, D-69): `rerenderRevision` menerima argumen ke-4 opsional `caller`; tipe kontrak `RerenderRevisionFn` (`contract/types/api.ts`):
```ts
export type RerenderRevisionFn = (docId: string, revNo: number, formats?: readonly StudioOutputFormat[], caller?: StudioCaller) => Promise<RerenderResult>;
```
Tanpa `caller` = perilaku semula. Revisi d2 tidak mengubah I40.

### 8.3 Dispatcher statis milik kontrak

| ID | Path | Isi |
|---|---|---|
| D01 | `src/lib/studio/contract/dispatch.ts` | Impor statis indeks I05-I08, I11-I12, I17-I19, I22-I33. Ekspor `DOCX_RENDERERS = { ...docxBlocks, ...docxTables, ...docxWrapper, ...docxFigures }`, `HTML_RENDERERS`, `DIAGRAM_LAYOUTS: Record<DiagramFamily, LayoutFn>` (stack/topology -> layered), `CHART_RENDERERS = { ...chartCore, ...chartFamilyP1, ..., ...chartFamilyG }`, dan `dispatchCoverage(): { docx: string[]; html: string[]; charts: string[] }` (daftar yang belum terisi, dipakai uji S72/S73). Modul mesin TIDAK mengimpor D01 kecuali I09, I13, I20, I22. |

### 8.4 Kontrak soffice (S92) dan render-env (S91)

Perintah (argumen array, tanpa shell, `windowsHide: true`):
```
<SOFFICE_PATH> --headless --norestore --nologo --nodefault --nolockcheck
  "-env:UserInstallation=file:///<root>/tmp/<jobId>/lo-profile"
  --convert-to pdf --outdir "<root>/tmp/<jobId>/out" "<root>/tmp/<jobId>/in/<fileName>.docx"
```
- Tanpa opsi filter PDF (sama dengan kalibrasi B, `research/05:21-28`).
- Semafor `STUDIO_SOFFICE_MAX_INSTANCES` (2) + antrean FIFO; `StudioRenderJob.status = QUEUED` selama menunggu.
- Batas waktu `STUDIO_SOFFICE_TIMEOUT_MS`: `taskkill /PID <pid> /T /F` (pola `bridge.mjs:60-98`), kode `RENDER_TIMEOUT`.
- Sukses = exit 0 DAN berkas PDF ada DAN > 0 byte DAN diawali `%PDF-`; selain itu `PDF_CONVERT_FAILED` dengan 2 KB stderr terakhir.
- Profil default user tidak pernah dipakai; HKCU tidak pernah ditulis; direktori `tmp/<jobId>` dihapus di `finally`.
- Kesiapan (sebelum job pertama, cache C15): biner ada; `--version` memuat `24.2.3.2`; setiap fon `required` di manifest ada di disk dengan sha256 cocok DAN terdaftar di `HKCU\Software\Microsoft\Windows NT\CurrentVersion\Fonts` (baca lewat `reg.exe query` argumen tetap). Gagal -> `PDF_ENGINE_UNAVAILABLE`; DOCX/HTML tetap dibuat; PDF tidak pernah dibuat lewat Chromium (KT-17).

```ts
// src/lib/studio/contract/render-env.ts
export interface RenderEnvManifest {
  schema: "studio.render-env/v1"; config: "B"; createdAt: string;
  soffice: { path: string; version: "24.2.3.2" };
  chromium: { executablePath: string; revision: "1234"; version: "151.0.7922.34" };
  fonts: Array<{ family: string; style: string; file: string; sha256: string; hkcuValueName: string; required: boolean }>;   // Plex 16 + DejaVuSans + Inter (research/05:18)
  calibration: { pages: number; textIdenticalPages: number; ssimMean: number; pagesSsimGe098: number; at: string };
}
export interface RenderEnvReadiness {
  ready: boolean; checkedAt: string; manifestSha256: string | null;
  soffice: { found: boolean; version: string | null; versionOk: boolean };
  chromium: { found: boolean };
  fonts: Array<{ family: string; style: string; fileExists: boolean; sha256Ok: boolean; registered: boolean }>;
  errors: string[];
}
```
Skrip cek S91 (bahasa bebas, nama snake_case) menulis `RenderEnvReadiness` sebagai JSON ke stdout, exit 0 bila `ready`, 3 bila tidak, 2 salah pakai.

## 9. Titik mount UI dan navigasi

| ID | Nama | Path | Pemilik | Kontrak |
|---|---|---|---|---|
| U71 | `TemplatePreviewPane` | `src/components/studio/template-preview/index.tsx` | stub S03, isi S101; diimpor S58 | `export function TemplatePreviewPane(props: TemplatePreviewPaneProps): React.ReactElement \| null`; `TemplatePreviewPaneProps = { templateId: string; versionNo?: number; draftOverrides: Readonly<Record<string, ParamValue>>; sampleDocument?: StudioDocV1; debounceMs?: number }` (tipe di `contract/ui.ts`); komponen klien (`"use client"`) |
| U72 | `STUDIO_NAV` | `src/lib/studio/contract/ui.ts` | S03 | daftar entri navigasi dibaca S69 untuk sidebar dan palet |

Isi `STUDIO_NAV` (ikon terverifikasi di `node_modules/lucide-react/dist/lucide-react.d.ts`: Activity 82, FileStack 8168, FileText 8207, Files 8337, FlaskConical 8571, LayoutTemplate 11353, Shapes 16800):

| href | label | ikon |
|---|---|---|
| `/studio` | Studio | `FileStack` |
| `/studio/templates` | Template | `LayoutTemplate` |
| `/studio/documents` | Dokumen | `FileText` |
| `/studio/artifacts` | Artefak | `Shapes` |
| `/studio/playground` | Playground JSON | `FlaskConical` |
| `/studio/system` | Status Mesin | `Activity` |

## 10. Dependensi npm (dipasang S03; versi tepat, tanpa `^`)

| Paket | Versi | Jenis | Alasan | Bukti versi |
|---|---|---|---|---|
| `ajv` | `8.20.0` | dependencies | validator JSON Schema 2020-12 (`ajv/dist/2020`), galat dengan pointer; JS murni | ada terpasang `C:\Users\TRIAL\AppData\Local\hermes\lsp\node_modules\ajv\package.json:3`. Repo memuat `ajv 6.12.6` transitif (`node_modules/ajv/package.json:3`) untuk eslint; npm memasang 8.x di akar dan memindah 6.x ke bawah eslint |
| `fflate` | `0.8.3` | dependencies | ZIP DOCX deterministik (`zipSync` dengan `mtime` tetap); JS murni, tipe bawaan | terpasang `hermes-agent\node_modules\fflate\package.json:3` |
| `playwright-core` | `1.62.1` | dependencies | Chromium headless lewat `executablePath` C03; tanpa unduh browser | terpasang `hermes-agent\node_modules\playwright-core\package.json:3`; `browsers.json:5-8` meminta chromium revisi 1234 = folder terpasang |

Ditolak: `jszip` (mtime ZIP perlu penanganan tambahan; fflate cukup), `fontkit`/`opentype.js` (obfuscation odttf hanya operasi byte XOR, `research/03:555`; ukuran teks diagram memakai heuristik Garis A demi paritas), sanitizer HTML (KS-08), `pngjs`/`image-size` (dimensi dibaca dari header PNG IHDR/JPEG SOF secara manual, S53), `zod` (KS-01). Tidak ada dependensi native. `tsx 4.22.4` sudah ada (`package.json:47`) untuk CLI S67.

Aturan verifikasi S03 (alat agen S01 tidak dapat membaca registry npm): sebelum `npm install --save-exact`, jalankan `npm view <paket>@<versi> time --json` dan pastikan tanggal rilis <= 2026-10-08 (>= 14 hari). Bila gagal, pilih versi stabil terbaru yang memenuhi syarat dan laporkan sebagai deviasi. `npm view playwright-core@<v> --json` harus mencantumkan chromium 1234 bila versi diganti. `serverExternalPackages: ["playwright-core"]` ditambahkan S69 (`next.config.ts`). Kompatibilitas: ketiga paket JS murni, ESM/CJS, tanpa ketergantungan React/Next; Node terpasang v24.18.0 (`research/02:40`).

## 11. Antarmuka CLI harness

| ID | Perintah | Pemilik | Masukan | Keluaran | Exit |
|---|---|---|---|---|---|
| H01 | `npx tsx scripts/parity/run/render_cli.ts --doc <doc.json> [--template <template.json>] --out <dir> [--formats docx,pdf,html,svg,png] [--json]` | S67 | `StudioDocV1` atau spec chart/diagram/image; templat = `{ base: "datum-kanonik", overrides, roleFormats, sectionPlan }` | `<dir>/<nama DATUM>.<ext>`, `<dir>/render_report.json` (`{ files: [{format, path, sha256, bytes}], lint: LintReport, job: {status, errorCode?}, durationMs }`) | 0 sukses, 1 galat render/lint FAIL tidak menggagalkan, 2 salah pakai, 3 `PDF_ENGINE_UNAVAILABLE` |
| H02 | `VENV -I -B scripts/parity/reference/doc/ref_doc.py --doc <doc.json> --out <dir> [--pdf]` | S64 | `StudioDocV1` | `<dir>/ref.docx`, `ref.pdf` (soffice profil sementara) , `ref_report.json` | 0/1/2 |
| H03 | `VENV -I -B scripts/parity/reference/fig/ref_fig.py --spec <spec.json> --kind chart\|diagram\|symbol --out <dir> [--png]` | S65 | spec chart/diagram atau id simbol | `ref.svg`, `ref.png`, `ref_report.json` | 0/1/2 |
| H04 | `VENV -I -B scripts/parity/compare/compare.py --format docx\|pdf\|svg\|png --ref <path> --node <path> --class CA\|CB1\|CB2\|CC\|DG\|SY\|DX\|PD\|HT --out <report.json>` | S66 | dua berkas | `CompareReport` JSON: `{ format, class, verdict: "PASS"\|"FAIL"\|"DIAGNOSIS", metrics: {...}, thresholds: {...}, diffs: [...] }` | 0 PASS/DIAGNOSIS, 1 FAIL, 2 salah pakai |
| H05 | `npx tsx scripts/parity/run/run_parity.ts --fixtures tests/parity/fixtures --out tests/parity/out/<sNN> [--only <glob>]` | S67 | korpus S63 | `summary.json` + `summary.md` (per fixture: vonis per format) | 0 semua PASS, 1 ada FAIL |
| H06 | `VENV -I -B benchmark/harness/compare/bm_compare.py --docx <out.docx> --pdf <out.pdf> --ref-docx <BM.docx> --ref-pdf <BM.pdf> --out <dir> [--figure-pages 9,12,19,35,37,38,40,42,50,51,54-61]` | S96 | keluaran Node + BM | `bm_report.json`: `{ BM1: {unitsTotal, unitsIdenticalInOrder, pct}, BM2: {counts: {pages, chapters, appendices, tables, figures}, ref, deltaPct}, BM3: {pagesIdentical, of, pct}, BM4: {ssimMean, perPage: [...], perFigure: [...]}, verdict }` + `bm_report.md` | 0 lulus D-17, 1 tidak, 2 salah pakai |
| H07 | `npx tsx benchmark/harness/run/run_benchmark.ts --doc benchmark/manual000/doc.json --template benchmark/manual000/template.json --out benchmark/out/<stamp>` | S97 | doc + templat | memanggil H01 lalu H06; `run_summary.json` | sama dengan H06 |

Semua CLI Python: `--help` exit 0, impor skill read-only dengan `-I -B`, cwd di luar folder skill. Metode SSIM = CAL (7x7, abu-abu, 72 dpi) dipakai ulang dari H04 oleh H06.

## 12. Daftar stub S03 dan marker

### 12.1 Berkas yang ditulis LENGKAP oleh S03 (bukan stub)

| ID | Path |
|---|---|
| T08 | `src/lib/studio/contract/index.ts` (re-ekspor publik) |
| T09 | `src/lib/studio/contract/types/common.ts` |
| T10 | `src/lib/studio/contract/types/doc.ts` |
| T11 | `src/lib/studio/contract/types/chart.ts` |
| T12 | `src/lib/studio/contract/types/diagram.ts` |
| T13 | `src/lib/studio/contract/types/image.ts` |
| T14 | `src/lib/studio/contract/types/html.ts` |
| T15 | `src/lib/studio/contract/types/model.ts` |
| T16 | `src/lib/studio/contract/types/params.ts` |
| T17 | `src/lib/studio/contract/types/api.ts` (DTO: `TemplateSummary`, `VersionSummary`, `DocumentSummary`, `RevisionSummary`, `OutputFileDto`, `RenderJobDto`, `ValidationIssue`, `AddressNode`, `PatchBlockInput`, `PatchResult`, `IngestResult`, `RenderOutcome`) |
| T18 | `src/lib/studio/contract/enums.ts` (E12-E25 + cermin E01-E11 sebagai union) |
| T19 | `src/lib/studio/contract/schema/common.schema.ts` |
| T20 | `src/lib/studio/contract/schema/doc.schema.ts` |
| T21 | `src/lib/studio/contract/schema/chart.schema.ts` |
| T22 | `src/lib/studio/contract/schema/diagram.schema.ts` |
| T23 | `src/lib/studio/contract/schema/image.schema.ts` |
| T24 | `src/lib/studio/contract/schema/html.schema.ts` |
| T25 | `src/lib/studio/contract/address.ts` (`parseAddress`, `formatAddress`, tipe `ParsedAddress`; pengurai EBNF §4.1) |
| T26 | `src/lib/studio/contract/env.ts` (C01-C17, `getStudioEnv`) |
| T27 | `src/lib/studio/contract/errors.ts` (`StudioErrorCode` -> HTTP, `StudioEngineError`, `StudioNotImplemented`, `studioError(code, message, details?)`) |
| T28 | `src/lib/studio/contract/auth.ts` (`StudioCaller`, `getStudioCaller`) |
| T29 | `src/lib/studio/contract/engine.ts` (§8.1) |
| T30 | `src/lib/studio/contract/render-env.ts` (§8.4) |
| T31 | `src/lib/studio/contract/ui.ts` (U71 props, U72) |
| T32 | `src/lib/studio/contract/dispatch.ts` (D01) |
| T33 | `src/lib/studio/params/render.ts` (R-01..R-25) |
| T34 | `src/lib/studio/params/index.ts` (`ALL_PARAMS`, `CATALOG_PARAM_COUNT = 685` (673 sebelum d3), `RENDER_PARAM_COUNT = 35` (25 sebelum d1/d2)) |
| T35 | `src/lib/studio/registry/sections.ts` (51 entri §5.2) |
| T36 | `src/lib/studio/registry/index.ts` (re-ekspor T06, T07, T35) |
| T37 | `prisma/migrations/20261022120000_add_studio/migration.sql` |

### 12.2 Stub (S03 membuat, pemilik baris mengisi)

Isi minimal bertipe: tanda tangan persis §8.2 / §5.1 / §9 dengan badan `throw new StudioNotImplemented("<id>")`, konstanta hitungan, dan larik kosong bertipe (`[] as readonly ParamDef[]`), peta renderer `{}` bertipe `Partial<...>`.

| ID | Path stub | Pengisi |
|---|---|---|
| T01-T07 | 5 berkas `params/*.ts` + `registry/charts.ts` + `registry/lint.ts` (§5.1) | S04-S10 |
| T38 | `src/lib/studio/engine/tokens/index.ts` | S11 |
| T39 | `src/lib/studio/engine/bind/index.ts` | S12 |
| T40 | `src/lib/studio/engine/docx/package/index.ts` | S14 |
| T41 | `src/lib/studio/engine/docx/fonts/index.ts` | S15 |
| T42 | `src/lib/studio/engine/docx/blocks/index.ts` | S16 |
| T43 | `src/lib/studio/engine/docx/tables/index.ts` | S17 |
| T44 | `src/lib/studio/engine/docx/wrapper/index.ts` | S18 |
| T45 | `src/lib/studio/engine/docx/figures/index.ts` | S19 |
| T46 | `src/lib/studio/engine/docx/assemble/index.ts` | S20 |
| T47 | `src/lib/studio/engine/html/base/index.ts` | S21 |
| T48 | `src/lib/studio/engine/html/blocks/index.ts` | S22 |
| T49 | `src/lib/studio/engine/html/tables/index.ts` | S23 |
| T50 | `src/lib/studio/engine/html/assemble/index.ts` | S24 |
| T51 | `src/lib/studio/engine/browser/index.ts` | S25 |
| T52 | `src/lib/studio/engine/soffice/index.ts` | S92 |
| T53 | `src/lib/studio/engine/diagram/core/index.ts` | S26 |
| T54 | `src/lib/studio/engine/diagram/layout-a/index.ts` | S27 |
| T55 | `src/lib/studio/engine/diagram/layout-b/index.ts` | S28 |
| T56 | `src/lib/studio/engine/diagram/layout-c/index.ts` | S29 |
| T57 | `src/lib/studio/engine/diagram/build/index.ts` | S30 |
| T58 | `src/lib/studio/engine/symbols/index.ts` | S31 |
| T59 | `src/lib/studio/engine/chart/core/index.ts` | S32 |
| T60 | `src/lib/studio/engine/chart/family-p1/index.ts` | S33 |
| T61 | `src/lib/studio/engine/chart/family-p2/index.ts` | S34 |
| T62 | `src/lib/studio/engine/chart/family-h1/index.ts` | S35 |
| T63 | `src/lib/studio/engine/chart/family-h2/index.ts` | S36 |
| T64 | `src/lib/studio/engine/chart/family-k1/index.ts` | S37 |
| T65 | `src/lib/studio/engine/chart/family-k2/index.ts` | S38 |
| T66 | `src/lib/studio/engine/chart/family-w1/index.ts` | S39 |
| T67 | `src/lib/studio/engine/chart/family-w2/index.ts` | S40 |
| T68 | `src/lib/studio/engine/chart/family-s1/index.ts` | S41 |
| T69 | `src/lib/studio/engine/chart/family-s2/index.ts` | S42 |
| T70 | `src/lib/studio/engine/chart/family-g/index.ts` | S43 |
| T71 | `src/lib/studio/engine/lint/scan/index.ts` | S44 |
| T72 | `src/lib/studio/engine/lint/render/index.ts` | S45 |
| T73 | `src/lib/studio/engine/lint/structure/index.ts` | S46 |
| T74 | `src/lib/studio/engine/lint/language/index.ts` | S47 |
| T75 | `src/lib/studio/services/ingest/index.ts` | S48 |
| T76 | `src/lib/studio/services/templates/index.ts` | S49 |
| T77 | `src/lib/studio/services/revisions/index.ts` | S50 |
| T78 | `src/lib/studio/services/render/index.ts` | S51 |
| T79 | `src/lib/studio/services/storage/index.ts` | S52 |
| T80 | `src/lib/studio/services/images/index.ts` | S53 |
| T81 | `src/components/studio/template-preview/index.tsx` | S101 |

Hitungan stub: 7 (T01-T07) + 43 modul (T38-T80) + 1 UI (T81) = 51. Berkas lengkap S03: 30 (T08-T37).

### 12.3 Marker `docs/2026-10-22_doc_artifact_studio/implementation/01_contract_landed.md`

Isi wajib: (1) `SECTION_REGISTRY_COUNT = 51` dan hitungan per grup 29/7/15 dari skrip; (2) daftar 51 stub + 30 berkas lengkap dengan path; (3) nama dan `sha256` `migration.sql`, keluaran langkah 6, 8, 9, 10, 12 §2; (4) versi terpasang `ajv`, `fflate`, `playwright-core` dari `npm ls`; (5) `npx tsc --noEmit -p tsconfig.json 2>&1 | grep "src/lib/studio"` kosong; (6) `npx prisma validate` exit 0; (7) `RENDER_PARAM_COUNT = 25`; (8) deviasi dari spesifikasi ini (bila ada) beserta alasan.

## 13. Pemetaan klaster benchmark -> peran dan medan JSON

Kolom "Medan" = tempat isi dan format klaster dinyatakan di `studio.doc/v1`; "Peran" = `RoleKey` templat yang memuat format terukur S95.

### 13.1 Klaster badan (36)

| Klaster | n | Peran | Medan JSON |
|---|---|---|---|
| K-01 | 1 | U01 | `front.cover.body[] {type:"device", device:"logo", asset}` |
| K-02 | 1 | U02 | `front.cover.body[] paragraph role "addressLine"` |
| K-03 | 1 | U03 | `device:"hairline"` (`format.borders.bottom`) |
| K-04 | 6 | U04 | `device:"datumRule", widthMm:166` di sampul dan `parts[].body` |
| K-05 | 6 | U05 | `paragraph role "kicker"` sampul; `parts[].label` |
| K-06 | 1 | U06 | `paragraph role "title"` (baris pertama) |
| K-07 | 1 | U07 | `paragraph role "title"` (baris terakhir; `format.spacingAfterTw:180`) |
| K-08 | 1 | U08 | `paragraph role "standfirst"` |
| K-09 | 1 | U09 | `paragraph role "scopeLine"` |
| K-10 | 1 | U70 | `spacer` |
| K-11 | 1 | U10 | `device:"spineString", text` |
| K-12 | 28 | U11 | diturunkan renderer: satu paragraf pemegang sectPr per akhir unit (KS-06), `render.section.breakPerUnit` |
| K-13 | 2 | U12 | `paragraph role "kicker"` di `front.controlSheet.body`; `front.toc.kicker` |
| K-14 | 1 | U13 | `paragraph role "pageTitle"` lembar kendali |
| K-15 | 4 | U14 | `paragraph role "blockHeading"` |
| K-16 | 3 | U70 | `spacer` |
| K-17 | 1 | U15 | `paragraph role "methodStatement"` dengan `runs[]` (glif DejaVu RS11) |
| K-18 | 1 | U16 | `front.toc.title` |
| K-19 | 1 | U17 | `front.toc.note` |
| K-20 | 5 | U70 | `spacer` di `parts[].body` |
| K-21 | 5 | U18 | `parts[].title` (`outlineLvl 0`) |
| K-22 | 5 | U19 | `parts[].lede` |
| K-23 | 21 | U20 | `chapters[].kicker`, `appendices[].kicker` |
| K-24 | 21 | U21 | diturunkan renderer per bab (`device.datumRule.placements`, P4S-06); aset `rule128` templat |
| K-25 | 21 | U22 | `chapters[].title` |
| K-26 | 98 | U23 | `sections[].title` + `sections[].number` (`numberRun`) |
| K-27 | 155 | U68 | `spacer` |
| K-28 | 85 | U24 | `paragraph` (role body) dengan `runs[]` (RS17/RS18) atau `text` |
| K-29 | 115 | U25 | `caption` tabel/gambar (`label`, `inline`, `labelProps`) |
| K-30 | 52 | U26 | `list(style:"bullet").items[]` (`marker` RS21, tab dari peran) |
| K-31 | 14 | U69 | `spacer` |
| K-32 | 24 | U28 | `chart`/`diagram`/`image`/`symbolSheet` `paragraphFormat` |
| K-33 | 2 | U29 | `FigureCommon.keyRow` |
| K-34 | 24 | U30 | `FigureCommon.source` |
| K-35 | 28 | U27 | `list(style:"number").items[]` (`marker` RS25) |
| K-36 | 11 | U31 | `paragraph role "subheading"` |

Jumlah anggota: 1+1+1+6+6+1+1+1+1+1+1+28+2+1+4+3+1+1+1+5+5+5+21+21+21+98+155+85+115+52+14+24+2+24+28+11 = 748 (sama dengan `research/07:157`).

### 13.2 Klaster sel (40)

| Klaster | n | Peran | Medan JSON |
|---|---|---|---|
| KT-01 | 8 | U32 | `device:"sealBand", left` (sel kiri, shading 6E1420 TCP-01) |
| KT-02 | 8 | U32 | `device:"sealBand", right` (TCP-02) |
| KT-03 | 8 | U33 | `ControlBlock.rows[][0], [2]` |
| KT-04 | 15 | U34 | `ControlBlock.rows[][1], [3]`; sel nilai Mono tabel lembar kendali (`Cell.runs`) |
| KT-05 | 1 | U35 | `Colophon.left` |
| KT-06 | 1 | U36 | `Colophon.right` |
| KT-07 | 16 | U37 | `rows[kind:"header"]` tabel lembar kendali dan `SignatureBlock.roles[].role` |
| KT-08 | 25 | U38 | sel badan tabel lembar kendali; `SignatureBlock.roles[].holder` |
| KT-09 | 3 | U39 | `SignatureBlock.signRowFormat` (line 680 exact) |
| KT-10 | 5 | U40 | `toc.entries[level:"part"].label` |
| KT-11 | 5 | U41 | `toc.entries[level:"part"].title` |
| KT-12 | 5 | U42 | `toc.entries[level:"part"].page` |
| KT-13 | 21 | U43 | `toc.entries[level:"chapter"\|"appendix"].label` |
| KT-14 | 21 | U44 | `toc.entries[...].title` |
| KT-15 | 21 | U45 | `toc.entries[...].page` |
| KT-16 | 17 | U46 | diturunkan dari `parts[].chapterKeys` (`showChapterList`); override `parts[].body[]` tabel |
| KT-17 | 17 | U47 | idem, judul bab |
| KT-18 | 24 | U48 | `paragraph` ber-`rail[]` dengan `render.rail.renderer = "table3col"` |
| KT-19 | 26 | U49 | diturunkan renderer: sel penyela rel dan paragraf penutup sel setelah tabel bersarang; eksplisit lewat `Cell.paragraphs: []` |
| KT-20 | 18 | U50 | `rail[] {kind:"mark", mark:"TERUKUR", label}` |
| KT-21 | 40 | U51 | `rail[] {kind:"source"}` |
| KT-22 | 3 | U52 | `rail[] {kind:"note"}` |
| KT-23 | 306 | U53 | `rows[kind:"header"].cells[]` kolom `align:"left"` |
| KT-24 | 897 | U54 | `cells[]` pada kolom `role:"id"\|"numeral"` rata kiri |
| KT-25 | 2270 | U55 | `cells[]` kolom `role:"text"` (glif RS60 lewat `runs[]`) |
| KT-26 | 91 | U56 | `TableBlock.source` dengan `sourcePlacement:"lastRowMerged"` |
| KT-27 | 15 | U57 | kepala kolom `align:"right"` |
| KT-28 | 163 | U58 | sel kolom `role:"numeral", align:"right"` |
| KT-29 | 1 | U50 | `rail[] {kind:"mark", mark:"ASUMSI"}` (`glyphRun.ASUMSI`) |
| KT-30 | 10 | U59 | `aside.label` |
| KT-31 | 10 | U60 | `aside.body[]` (`runs[]` dengan RS61 "1.") |
| KT-32 | 3 | U61 | `rows[kind:"group"]` |
| KT-33 | 2 | U62 | `derivation.title` (`render.derivation.renderer = "nestedTable"`) |
| KT-34 | 2 | U63 | `derivation.intro` |
| KT-35 | 33 | U64 | `derivation.lines[].label`; `monoBlock.lines[]` |
| KT-36 | 14 | U65 | `derivation.lines[].value` + `mark` |
| KT-37 | 1 | U49 | `Cell.paragraphs: [{ runs: [], format }]` |
| KT-38 | 24 | U66 | sel kolom `role:"glyph"` (`checklist`) dengan `runs[]` DejaVu |
| KT-39 | 5 | U50 | `rail[] {kind:"mark", mark:"DITURUNKAN"}` |
| KT-40 | 4 | U67 | `monoBlock.label` |

Jumlah anggota: 8+8+8+15+1+1+16+25+3+5+5+5+21+21+21+17+17+24+26+18+40+3+306+897+2270+91+15+163+1+10+10+3+2+2+33+14+1+24+5+4 = 4159 (sama dengan `research/07:247`).

### 13.3 Konstruksi non-paragraf

| Konstruksi | Medan |
|---|---|
| 29 sectPr (A4, margin identik, header/footer default per seksi, PAGE/NUMPAGES) | `render.section.wrapper`/`interior` (R-09, R-10) + `SectionSetup` per unit; `HeaderFooterSpec` `runningHead` (tab kanan 9411, border bawah) dan `registerBlock` (tabel 4 sel, `Run.field`) |
| TP-01..03 (`tblW`, `tblLayout fixed`, `tblCellMar` 0) | `TableBlock.layout`, R-17 |
| TCP-01..21 (border/margin/shading per sel) | `RoleFormat.cell` per peran + `Cell.borders/marginsTw/shading` |
| `cantSplit` semua baris, `tblHeader` 91 tabel | `Row.cantSplit` (default true, P5-13), `Row.repeatHeader` (P5-12) |
| `gridSpan` 94 sel; tabel bersarang N01/N02 | `Cell.gridSpan`; `Cell.nested` (kedalaman 1) |
| 52 penempatan `wp:inline` | 27 diturunkan (K-04 6, K-24 21 rule) + logo 1 + 24 figur (`chart`/`diagram`/`image`/`symbolSheet`, `widthMm`, `heightMm`), aset raster `assets{}` bersha256 |
| 18 fon tertanam, slot Bold = SemiBold | R-08 |
| settings.xml, docDefaults, Normal | R-01..R-07 |
| Daftar isi statis T010 | `TocSpec.mode:"static"`, R-22 |

### 13.4 Celah tersisa (dicatat, bukan penghalang)

| ID | Celah | Usulan medan | Pemicu delta |
|---|---|---|---|
| GS-01 | 153 `tblPr` memuat dua `tblW`/`tblLayout`; 4083 `tcPr` memuat dua `tcW`, 795 berbeda nilai (`research/07:273-275`). Skema v1 menulis satu nilai | `Cell.widthTwAlt?: Tw` dan `TableBlock.layout.widthTwAlt?: Tw` (ditulis sebagai `tcW`/`tblW` kedua) | Hanya bila diagnosis S98 menunjukkan lebar kolom LibreOffice mengikuti nilai pertama dan memengaruhi BM-3/BM-4; diajukan lewat `file_requests.md` sebagai S03-dN |
| GS-02 | Separator caption antara label dan teks belum terukur | R-15 sudah ada; S95 mengisi | tidak perlu delta |

Pemetaan: 36 + 40 = 76 klaster, sisa tanpa medan = 0.

## 14. Requirements, risiko, kriteria penerimaan

### 14.1 Butir yang perlu dicatat controller (keputusan/deviasi)

1. Parameter renderer kontrak (R-01..R-35) di luar katalog; kriteria §7.2 #1 dibaca "685 berasal `catalog`" sejak d3 (673 manual + 12 parameter mesin).
2. Route tambahan R02 `/api/studio/templates/[id]` di area S54.
3. S03 menulis lengkap `params/render.ts`, `registry/sections.ts`, `contract/auth.ts`, `contract/dispatch.ts`.
4. DB bayangan `gsp_agent_hq_v21_shadow` dibuat S03 (dibutuhkan `--from-migrations`); migrasi = selisih diff terhadap baseline (drift IlSearchDoc pra-ada tidak boleh masuk).
5. Nomor dokumen cadangan tanpa model ke-10 (KD-04).
6. Visibilitas IL (§7.2 #4) di E2E S80 butuh `SHARED_WORKSPACE` instans uji menunjuk akar sandbox yang sama; tanpa itu IL tidak melihat berkas Studio (KT-03). Penjaga `STORAGE_ROOT_FORBIDDEN` melarang sebaliknya di runtime normal, jadi S80 memakai akar sandbox untuk KEDUA env dan penjaga mengizinkan bila `SHARED_WORKSPACE` sendiri berada di dalam `data/` repo (aturan: tolak hanya bila `SHARED_WORKSPACE` di luar repo dan akar Studio di dalamnya atau sama).

### 14.2 Risiko

| # | Risiko | Mitigasi |
|---|---|---|
| RS-1 | Diff mentah membawa DROP indeks IlSearchDoc | Prosedur baseline §2 langkah 2-6, 10 |
| RS-2 | Versi npm melanggar aturan 14 hari | Verifikasi `npm view time` di S03 (§10) |
| RS-3 | `discriminator` ajv menolak `oneOf` dengan `$ref` tertentu | S03 boleh mengganti ke `if/then` per `type`; galat tetap berpointer |
| RS-4 | Format per peran tidak cukup untuk varian dalam klaster (mis. K-07 vs K-06) | Override `format` per blok selalu tersedia |
| RS-5 | Rujukan prosa basi setelah penomoran ulang | Lint REPORT (§4.2 butir 4) |

### 14.3 Kriteria penerimaan spesifikasi (diukur S03 dan verifier)

| # | Kriteria | Ukuran |
|---|---|---|
| AC-1 | 9 model, 11 enum Prisma, 11 route path, 43 modul, 51 stub, 51 section, 35 parameter renderer (25 awal + d1/d2) dibuat dengan nama persis | Grep definisi di kode = tabel ini |
| AC-2 | Migrasi hanya objek Studio | §2 langkah 6 dan 10 |
| AC-3 | Rollback memulihkan DB uji | S82, §1.4 |
| AC-4 | Fixture BM (S93) lolos skema v1 dengan 0 paragraf tak terpetakan | 748 + 4159 paragraf terpetakan ke §13 |
| AC-5 | `tsc` bersih di `src/lib/studio` setelah S03 | marker butir 5 |

Draf rencana (`masterplan/02_plan_draft.md`) tidak dibuat: D-22 menetapkan Execution Profile + dokumen ini sebagai rencana.

## 15. Verifikasi (hitungan register)

Hitungan dihitung dari tabel di dokumen ini dan diperiksa ulang dengan Grep setelah penulisan (keluaran dikutip di `delegation_progress/data_analyst_s01.md`).

| Register | Prefiks baris | Jumlah | Nama |
|---|---|---|---|
| Model | `M01`-`M09` | 9 | StudioTemplate, StudioTemplateVersion, StudioSectionType, StudioDocument, StudioRevision, StudioBlock, StudioArtifact, StudioOutputFile, StudioRenderJob |
| Enum | `E01`-`E25` | 25 (11 prisma + 14 ts) | §1.3 |
| Route path | `R01`-`R11` | 11 path, 17 pasangan metode | §6.2 |
| Konstanta/env | `C01`-`C17` | 17 | §7.1 |
| Modul | `I01`-`I43` | 43 | §8.2 (I23-I33 = 11 keluarga chart dalam satu baris) |
| Dispatcher | `D01` | 1 | `contract/dispatch.ts` |
| Berkas S03 | `T01`-`T81` | 81 = 51 stub + 30 lengkap | §12 |
| Peran/UI | `U01`-`U72` | 70 RoleKey + 2 UI | §5.6, §9 |
| Param renderer | `R-01`-`R-25` | 25 | §5.7 |
| Section | 51 | 29 + 7 + 15 | §5.2 |
| CLI | `H01`-`H07` | 7 | §11 |
| Klaster | K-01..K-36, KT-01..KT-40 | 76, sisa 0 | §13 |
