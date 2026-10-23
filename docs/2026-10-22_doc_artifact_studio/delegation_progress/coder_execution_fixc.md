# FIX-C — catatan coder-execution (loop perbaikan siklus 1, D-245: M2 + L3 SR-56)

Status: complete. Skills: receiving-code-review, dry-run-verify-fix. Klaim: `file_claims.md` prefiks FIX-C. Tanggal: 2026-10-23.

## Berkas (ubah)
- `scripts/parity/run/lib/render.ts`
  - M2: `V2_SEAMS`, `loadSeam`, `seamNotReady`, dan antarmuka seam lokal (`ComposeSeam`, `PidsSeam`, `MetaSeam`, `ScopeSeam`, `TemplateV2Seam`, `SkeletonInputLocal`) DIHAPUS; impor statis bertipe dari layanan: `services/compose` (`composeV2`, `mergeSubmission`, `emptyResolvedDoc`, `seededPidAllocator`, tipe `SkeletonInput`/`ComposeResult`), `services/ingest/meta` (`resolveMetaDefaults`), `services/render/pure` (`applyRenderScope`), `services/templates/import` (`loadResolvedTemplateV2File`, `readTemplateProfileFile`), `services/skeleton/resolve` (`resolveSkeletonSlots`, `SlotParamLayers`).
  - Nilai efektif per slot murni (`resolveSlotsPure`): urutan lapis = `resolveSlotsForVersion` layanan (`skeleton/repository.ts`): preset = override profil preset (kanonik `{}`), templat = `splitDerivedOverrides(templateLayerOf(definition)).kept`, `presetPins` = kunci preset, filter tier. Isu dicatat warn `SLOT_PARAM_SKIPPED`. Kerangka dari loader (kanonik SR-06, `skeletonSha256` loader), bukan salinan mentah.
  - `composeV2({..., slotParams})` (= `services/ingest/v2.ts:466`), dan `renderSnapshot` menerima `slots` + `tier` (= `services/render/scope.ts` runScopeJob). Laporan aditif `compose.slots`.
  - L3: salinan `svgSizeMm` dihapus; lembar simbol lewat `symbolSheetFigures` layanan (`services/render/figures`) sehingga `symbol.sheet.fit` templat dibaca (D-147); tanpa `--template` = parameter kosong = bawaan fit false.
- `scripts/parity/run/render_cli.ts`: hanya komentar kepala (seam dinamis tidak ada lagi; slotParams; fit simbol).

## Bukti
- v1 Manual 000 (`doc.json` + `template.json`, docx): DOCX `53485ebc1eddd145…` (sebelum = sesudah).
- v2 Manual 000 (`doc.v2.json` + `template.v2.json`, docx): DOCX `4a06d9c68106dd31…` (sebelum = sesudah, = RQ-8); 6 slot diteruskan, 0 `SLOT_PARAM_SKIPPED`. `units_v2.py v1 v2` (VENV hermes `-I -B`): `units a=4544 b=4544 aEqualsB=True`, grid 153=153, run simbol 104=104, hunk 0.
- Sama dengan jalur layanan (skrip scratchpad `service_path.ts`: loader v2 -> `resolveSkeletonSlots` berlapis -> `composeV2(slotParams)` -> `renderSnapshot(slots,tier)`, tanpa kode CLI): templat asli DOCX `4a06d9c6…` + snapshotSha `3da62bc7…` = CLI; templat dengan slot `appendices.essentials.page.orientation=landscape`: DOCX `de0de00f…` + snapshotSha `40f6aeb9…` = CLI.
- Uji asap M2 (saran SR-56): templat lampiran mendatar -> CLI sesudah: 29 seksi, 4 `orient="landscape"` (4 lampiran); kode CLI sebelum (salinan `render.ts` asli, impor dialihkan): 0 landscape, DOCX = garis dasar `4a06d9c6…` (kenop slot diabaikan, temuan M2 terbukti dan tertutup).
- Uji L3: `{"sheet":"iec","cols":3}` + `--template datum-manual-000.preset.json` (fit true): sesudah 166 x 193,0449 mm; sebelum 166 x 247 mm; tanpa templat sesudah 166 x 247 mm (bawaan).
- Lingkup v2: `--scope chapter:2` SUCCEEDED (1 unit, 17 blok, draft); `chapter:99` exit 2 `ADDRESS_NOT_FOUND`; `--scope bogus` exit 2.
- `run_parity.ts` tidak punya `--dry-run`/selftest; dijalankan per subset ke scratchpad: `symbol/*` 45/45 PASS (exit 0). `doc/*`, `chart/p0*`, `diagram/dg_flow*`: verdik FAIL/REF_ERROR/DIAGNOSIS milik pembanding/acuan Python; NODE_ERROR sementara (`widthsMm` undefined, `FIGURE_WIDTHS_MM is not defined`, G2 127/165) muncul saat FIX-FIG menulis `engine/chart/core` + `engine/docx/figures` (mtime 08:28-08:30) dan hilang saat diulang. Keluaran node sebelum = sesudah byte-identik: chart p01 `3adf00c0…`, p02 `05a148ad…`, diagram dg_flow `12afa33d…`, doc serah_handover DOCX `49b36c47…` (dua putaran berselang).
- `npx eslint scripts/parity/run/render_cli.ts scripts/parity/run/lib/render.ts`: exit 0.
- tsc repo: 0 galat di `scripts/parity/**`. Putaran pertama: 29 galat hanya di `tests/integration/studio/studio-db.integration.test.ts` + `tests/unit/studio/api-structure/auth.test.ts` (baris SR-49/SR-45). Putaran akhir: tambahan galat sementara di `src/app/api/studio/documents/route.ts`, `services/ingest/v2.ts`, `services/submit/pipeline.ts`, `tests/unit/studio/structure/adapt-v1.test.ts` (baris lain sedang menulis; bukan area FIX-C). "tsc repo 0" tidak dapat dibuktikan saat ini karena penulisan paralel.

## Temuan / catatan
- Layanan ingest v2 dengan templat di memori + `opts.skeleton` (`ingest/v2.ts` `pinTemplate`) juga tidak membawa `slotParams`; itu M3 (FIX-B), tidak disentuh.
- Aset kiriman v2 di CLI tetap tanpa `assets` compose (peringatan `ASSET_INFO_MISSING`, MIME diasumsikan PNG), sama dengan sebelum; di luar M2/L3.

Review direkomendasikan (lingkup `scripts/parity/run/lib/render.ts`).
