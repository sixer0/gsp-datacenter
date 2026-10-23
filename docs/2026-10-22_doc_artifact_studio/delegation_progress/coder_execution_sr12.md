# SR-12 coder-execution: ingest v2 (`services/ingest`)

Status: needs-review (kode + gerbang ringan D-133 lulus; jalur simpan belum dijalankan karena brief membatasi asap ke dryRun). Skills: backend-execution, dry-run-verify-fix. 2026-10-23.

## Berkas (area `src/lib/studio/services/ingest/**`)
- `index.ts` (ubah): `ingestDocument(req: IngestInput, caller, opts): Promise<IngestResultV2>` dispatch per `$schema` (v2 langsung/amplop -> `ingestDocV2`; v1 -> skema v1 -> `ingestDocV1Adapted`); gerbang kepercayaan D-98/D-134 untuk kedua versi sebelum adaptasi; jalur lama diganti nama `ingestDocumentV1Legacy` (dipakai hanya bila `opts.legacyV1` + tepercaya). Opsi baru `skeleton`, `legacyV1`. Ekspor lama dipertahankan (`docNumberPattern`, `formatDocNumber`, `normalize`, `applyDocOverrides`, dll.).
- `v2.ts` (baru): pipeline templat terpatok + kerangka (SR-06 `resolveSlotsForVersion`; implisit bila templat di memori) -> meta bawaan (compose `defaultMeta`) -> P3-20 -> register DATUM-11 -> aset -> `emptyResolvedDoc` + `mergeSubmission` -> `composeV2` -> gate by-construction yang sama -> kelengkapan SR-11; `renderRefused` (KD-27). v1: kebijakan `ingest.inlineFormat` dari templat, `adaptV1` sesudah gerbang, `code` chart `{artifactId}` diisi dari artefak R09, hasil adaptasi divalidasi skema v2, `AdaptReportV1` di `x.adaptReportV1` (`x.adaptReportV1` kiriman klien dibuang). Simpan v2 -> SR-13 `submitDocumentV2`.
- `assets-v2.ts` (baru): rencana aset tanpa tulis (base64 lewat `decodeImageDetailed`, `assetRef` lewat M13 `findAssetBySha`, `assetPaths` adaptor, sumber harness, berkas datar lama) + `storePlannedAssets` lewat SR-19 `storeAssetRow` (D-175).
- `repository.ts` (tambah `persistAdaptedV1`): dokumen baru v1 (KD-12 `missionDocKey` null), revisi 1 `schemaId=studio.doc/v1`, snapshot norm/v2, `structureSha256` = `computeStructureSha256` SR-10, kelengkapan + `completenessReport`, `changeScope=create;document`, baris M14-M18 + StudioBlock lewat `writeRevisionRows`.
- `meta.ts` (baru): `jakartaDate`, `effectiveTier`, seam CLI `resolveMetaDefaults` (pembungkus compose `defaultMeta`, dipulihkan atas permintaan RQ-7/SR-33).
- `validate.ts` (tambah `validateV2Against`, ajv yang sama + `classifySchemaV2Errors` D-172).

## Bukti (segar)
- `npx tsc --noEmit -p tsconfig.json`: 0 galat di `services/ingest`. Di luar area: `benchmark/harness/run/lib/pipeline.ts:278` (akibat tipe `IngestResultV2`, diajukan ke SR-34), `benchmark/extract/convert_v2.ts:290` dan `src/components/studio/document-viewer/index.ts` (4) milik baris lain.
- `npx eslint src/lib/studio/services/ingest`: exit 0.
- Asap dryRun (DB `current_database()` = `gsp_agent_hq_v21`, tanpa tulis): E1 valid, norm/v2, 16 blok ber-pid, alamat 1.1.1 / 2.1.2 / A.1.1 / F:references/1, `Tabel 2.1`, COMPLETE. memo v1 valid, `schemaId studio.doc/v1`, lint `SCHEMA_V1_ADAPTED:REPORT` + `INLINE_FORMAT_STRIPPED:REPORT`, policy strip. E0 valid, INCOMPLETE, `missingRequired [controlSheet, content]`. E1+`format` -> `DISPLAY_FIELD`. Penanda `x.benchmark` USER dibuang + temuan REPORT.
- Temuan SR-35 (N1/DATUM-38 folder misi): TIDAK terreproduksi di ingest. dryRun E2-like TERBIT `mission.folder 2026-10-23_misi_a` + gambar base64: `DATUM-38 PASS`, `N1 PASS`; path aset internal `d3/<sha>.png` (tanpa folder misi). `documentNames` (`engine/lint/scan/walk.ts:230`) hanya menguji stem path aset + docNumber, jadi sumbernya di luar ingest (kemungkinan jalur kiriman/render). Perlu ditelusuri controller.

## Keputusan (perlu dicatat controller)
1. Simpan v2 didelegasikan ke SR-13 `submitDocumentV2` (I49: pemilik pembuatan/upsert dokumen misi, kunci, revisi). Ingest menjalankan gerbang lebih dulu lalu memanggilnya. Simpan v1 tetap di ingest karena KD-12/KD-10 berbeda dari jalur v2.
2. `IngestResultV2.snapshot` = `AnyNormSnapshot` (bukan dipaksa norm/v1). Medan tambahan: `schemaId`, `completeness`, `adaptReport`, `renderRefused`, `submit`, `warnings`.
3. `opts.legacyV1` (tepercaya saja) mempertahankan jalur norm/v1 untuk alat server (runner v1, paritas).
4. KD-26 `allow`: `snapshot.doc` diganti dokumen v1 asli lalu sha dihitung ulang. Risiko: `rebuildSnapshot` SR-10 tidak dapat merekonstruksi sha untuk revisi `allow`.
5. Register dinormalisasi sebelum gabung, jadi sumber tersimpan sudah ternormalisasi.

## Belum diverifikasi / temuan
- `persistAdaptedV1` dan `persistV2ViaSubmit` belum dijalankan (hanya tsc). Perlu asap transaksi-rollback di fase akhir.
- datum-gsp di v21 belum punya kerangka eksplisit (SR-36). E0 memakai kerangka implisit: `signature` opsional dan ada `ruleIndex`, berbeda dari §7.3 sampai seed berjalan.
- Permintaan: 3 baris di `file_requests.md` (SR-34 pipeline.ts:278, SR-20 tipe hasil, SR-06 `templateSlotIds` opsional).
