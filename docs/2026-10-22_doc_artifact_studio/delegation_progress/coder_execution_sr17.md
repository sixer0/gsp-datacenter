# SR-17 coder-execution: perakit HTML sadar slot (status: complete)

Skills: backend-execution, dry-run-verify-fix. Klaim: `file_claims.md` (prefiks SR-17). Area: `engine/html/assemble/**` + `engine/html/base/params.ts` (HANYA sumber ukuran halaman `pageGeometry`, KC-7) + `engine/html/base/css.ts` (HANYA komentar `@page`).

## Perubahan
- `assemble/slots.ts` (baru): `unitViews` (unit v2 -> slot; tpl efektif = `ctx.tpl` + `ResolvedSlot.params/roleFormats`, sekali per slotKey), `isDraft` (`ctx.draft` ?? `scope.kind !== DOCUMENT`), `draftMarker` (R-39), `unitModes` (`slot.setup.runningHead` > `slot.setup.header|footer.mode` > unit), `slotAttrs`, `slotCss`, `SLOT_BLOCK_RENDERERS` (`slotPlaceholder`, `sourceRegisterEntry`, `ruleIndex`: blok struktural compose SR-08 yang tidak ada di dispatch kontrak).
- `assemble/index.ts`: blok tiap unit dirender dengan ctx slot; atribut unit `st-slot st-slot-<key> st-sectype-<type>`, `data-slot-key`, `data-section-type`, `data-placeholder`, `data-draft`, `data-page-mm`; unit placeholder; label draf per unit (layar) + `<meta name="studio:draft">` + kotak sudut `@page` (cetak); `<style data-studio="slots">`. Snapshot v1 = jalur lama.
- `assemble/classes.ts`: kelas `slot`, `sectionType`, `placeholderUnit`, `placeholder`, `flow`, `draftMark`, `sourceEntry`, `ruleIndex` + CSS struktural.
- `base/params.ts`: `pageSizeMm(p)` = SR-60 `pageSizeFromKnob` (DV-01) ?? `page.sizeMm` tersimpan; TANPA fallback A4 (galat BY_CONSTRUCTION_FAILED). `GRID_FALLBACK.pageW/pageH` dihapus.

## Semantik (untuk diselaraskan dengan SR-16)
1. Unit per slot = rencana compose (`snapshot.units`, urutan dokumen); perakit tidak merencanakan ulang.
2. Nilai efektif per unit = `ctx.slots.get(slotKey)` ditumpuk di atas params dokumen (peta parsial tetap lengkap).
3. Placeholder draf = unit `placeholder:true`; isi blok `slotPlaceholder` (teks compose), cadangan `ResolvedSlot.placeholderText`.
4. Penanda draf = `render.draft.marker` {text, placement}; header -> `@top-right-corner`, footer -> `@bottom-right-corner` (kotak tepi dipakai running head/register).
5. `@page` per unit: ukuran kertas + orientasi efektif slot (+ `slot.setup.marginTw` lengkap) ditulis ke halaman bernama shell `st-u-<i>` (indeks `scanUnits`) hanya bila beda dari halaman dokumen; var `--page-w/h` dll. per slot via `.st-unit[data-slot-key]`.
6. `slot.setup.startOnNewPage:false` = kelas `st-flow`, tanpa pemenggalan, nama halaman unit sebelumnya.

## Bukti (2026-10-23)
- tsc repo: 155 galat, 0 di `engine/html` (semua di `src/components/studio/**`, `src/app/api/studio/**`, `services/revisions/v2/ops.ts`, `src/app/login` - baris paralel). eslint area exit 0.
- Benchmark v1 HTML (`sr17/a4_final`): SUCCEEDED, `@page{size:210mm 297mm` + `@page st-sheet{size:210mm 297mm`, guard 0. A4 landscape (`sr17/a4l_final`, override `page.orientation`): `@page{size:297mm 210mm`, guard 0.
- E1 (blueprint §2.4) -> mergeSubmission + composeV2 -> assembleHtml (skrip scratchpad `sr17_smoke.ts`): DOCUMENT: 7 unit slot, 0 log guard, enforceStandalone ulang 0 pelanggaran, @page 210x297. Draf (controlSheet kosong, lampiran landscape, konten runningHead false): `@page st-u-6{size:297mm 210mm` (unit A), placeholder "[Lembar Kendali belum diisi]", 7 label draf, kotak sudut DRAF, data-header none unit 1,2, 0 pelanggaran.

## Temuan / permintaan
- F1: compose memancarkan `sourceRegisterEntry`/`ruleIndex`/`slotPlaceholder` tanpa renderer di dispatch kontrak; HTML ditangani lokal di perakit (entri = paragraf beralamat, URL teks). SR-16 perlu padanan DOCX; bila ingin tabel preset `sourceRegister` (PD-01) di kedua format, putuskan controller.
- F2: `ruleIndex` HTML hanya penanda (log warn); indeks aturan otomatis belum ada di mana pun.
- F3: grid/margin landscape per slot bergantung SR-06 `resolveSlotParams` menurunkan ulang turunan (perakit hanya menurunkan ukuran halaman dari kenop).
- F4: render_cli jalur v2 menunggu `services/compose/index.ts` (SR-08); `scripts/parity/run/lib/render.ts` sempat 32 galat tsc (SR-33, sedang ditulis).
