# Catatan coder-execution SR-04 (kontrak struktur v2)

Tanggal: 2026-10-23. Area eksklusif: `src/lib/studio/contract/**` (aditif) dan marker `implementation/05_structure_contract_landed.md`. Klaim di `file_claims.md` berprefiks SR-04. DB, HKCU, dan port tidak disentuh.

## Langkah
1. Masukan dibaca: blueprint 05 (§0, §2.4-§2.7, §2.10-§2.11, baris SR-04), register 03 (seluruhnya), D-139, D-153, D-158, D-160, D-163..D-166, research/09 §6.2, dan kontrak v1 yang ada.
2. Enum E26-E43 dan 24 kode galat ditambahkan beserta peta HTTP (`STUDIO_ERROR_CODES` = 68).
3. Konstanta C18-C28, C32, dan C33a-c ditambahkan; route R12-R20; `studioRoutePath` menerima `pid`; `STUDIO_SCHEMA_IDS` 10.
4. Alamat `F:<slotKey>[/n]`; `ParamDef.surface`/`scope`; 12 DeriveFnId baru; `NormUnitKind` + `"slot"`; `RenderContext.slots/scope/draft` + `RenderScope`/`ResolvedSlot`; `RegistryKind` + 4 nilai.
5. Tipe `types/v2/*` (T2-01..T2-60c, `CompletenessSummary`) dan skema `schema/v2/*` (common/v2, SID01-SID05) ditulis.
6. `forbidden.ts` ditulis: C29-C31 dan pemeta `classifySchemaV2Errors`. Pemeta menentukan lokasi dari struktur kiriman, karena `schemaPath` ajv tidak memuat nama `$defs` untuk `$ref` yang dikompilasi terpisah. Ini terbukti lewat probe: `"#/additionalProperties"`.
7. Verifikasi dijalankan (tsc, eslint, skrip ajv); 1 cacat lokator diperbaiki (`pending` tidak di-reset setelah indeks blok).
8. Permintaan `file_requests.md` ditanggapi (SR-34, FIX-4a, SR-05 ×2); marker dan laporan ditulis.

## Bukti
- `npx tsc --noEmit -p tsconfig.json` → exit 0 (seluruh repo).
- `npx eslint src/lib/studio/contract` → exit 0.
- Skrip ajv `verify_sr04.ts` (scratchpad sesi) → 54 PASS, "SEMUA LULUS". Isinya: 10 skema terkompilasi strict; E0, E1, E2, E3a, E3c (blok/change/render), slot, template, dan skeleton valid; 10 varian ditolak dengan checkId yang benar; sapuan DF 62/62; round-trip alamat 11 + 4 penolakan; hitungan 68/68/20/10/52+10/14.

## Tanggapan permintaan
- SR-34 (baris 134): selesai di kontrak. `"studio.doc/v2"` ada di `STUDIO_JSON_SCHEMAS`, dan `NormBlockV2.pid` wajib. Opsi ingest milik SR-12.
- FIX-4a (baris 140): `CompletenessSummary` diekspor. Bentuknya memakai `chapters.<slotKey>` (KD-15), bukan `content`. `buildRailSegments` perlu membaca `chapters` dan memilih slot berulang.
- SR-05 (baris 142): `pageSizeFromKnob` TIDAK dibuang, karena SR-60 `engine/tokens/grid.ts:144,342,486` sudah memakainya (membuangnya = tsc gagal). Registri cukup memakai `pageSizeFromPaper` (DV-01). Penyatuan nama butuh keputusan controller bersama SR-60. `control: "multiEnum"` ditambahkan.
- SR-05 (baris 149): tipe `SlotSetup = Omit<SectionSetup, "pageSizeTw"> & { startOnNewPage?: boolean; runningHead?: boolean }` diekspor (`types/v2/template.ts`).
