# Catatan coder-execution RQ-4 (validator roleFormats, permintaan RT-01)

Status: complete. Sumber: blueprint 05 baris RQ-4, file_requests.md (RT-01 profile.ts), D-138, D-141.

## Berkas
- `src/lib/studio/services/templates/profile.ts` (modify): `ROLE_FORMAT_FIELDS` + 4 medan delta S03-d1 (`labelRunByMark`, `rightCell`, `firstRowCell`, `signatureCell`); `roleFormatSchema` memvalidasi `labelRunByMark` dengan peta tanda provenans -> RunProps yang sama dengan `glyphRun` (konstanta bersama `RUN_BY_MARK`, `additionalProperties: false`), tiga medan sel dengan `$defs` bersama `CellFormat` (common.schema.ts, sama dengan `firstRowCell`/`cellFormats` di doc.schema.ts). Tipe `RoleFormat` di contract/engine.ts sudah memuat keempatnya; tidak ada perubahan kontrak.

## Penjaga (D-133)
- `npx tsc --noEmit -p tsconfig.json` seluruh repo: exit 0, 0 `error TS`.
- `npx eslint src/lib/studio/services/templates/profile.ts`: exit 0.
- Asap (`npx tsx`, skrip scratchpad `rq4_smoke.ts`):
  - roleFormats dengan keempat medan sah -> `issues: []`, kunci dipertahankan `labelRunByMark,rightCell,firstRowCell,signatureCell`.
  - bentuk salah (tanda `XYZ`, sel dengan medan asing, string, `vAlign: "middle"`) -> 4 x SCHEMA_INVALID di pointer masing-masing.
  - medan asing `leftCell` -> PARAM_UNKNOWN_KEY (perilaku lama tetap).
  - `parseTemplateProfile(benchmark/manual000/template.json)`: OK, 70 peran roleFormats, ignoredFields kosong, droppedDerived 0.

## Temuan
- `benchmark/manual000/template.json` saat ini TIDAK memakai keempat medan di `roleFormats` (0 pemakaian dari 70 peran); `labelRunByMark` hanya muncul sebagai teks usulan di `meta` (baris 180). Template lolos validasi profil; pemindahan warna label dari jalan sementara `glyphRun` ke `labelRunByMark` milik pemilik templat/RT-01 penerus (bukan RQ-4).

## Permintaan lintas pemilik
- Tidak ada.
