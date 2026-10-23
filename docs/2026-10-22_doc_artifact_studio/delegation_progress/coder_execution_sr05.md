---
task_slug: doc_artifact_studio
row: SR-05
date: 2026-10-23
agent: coder-execution
status: complete
---

# SR-05 Registri struktur dan permukaan parameter

## Berkas

| Berkas | Jenis | Isi |
|---|---|---|
| `src/lib/studio/registry/slots.ts` | baru | C33 `SLOT_SECTION_TYPES`, `SLOT_KINDS` (contentMode sah/bawaan, repeatable, `admitsAllowed`/`defaultAdmits`, slotKey implisit), C32a `SHARED_PARAM_GROUP_MEMBERS`, `PAGE_DEVICE_SECTION_TYPES`, `PARAM_SCOPE` (research/08 §5.8 + PD-01 + 21 kunci baru), `paramScopeOf`, `parseParamScope`, `isScopeAllowedInSlot` (§13.5) |
| `src/lib/studio/registry/essentials.ts` | baru | `PARAM_SURFACE_LISTS`/`PARAM_SURFACE`/`paramSurfaceOf` (research/09 §5.2), 28 `ESSENTIAL_KNOBS` (`EssentialKnobSpec extends EssentialKnobDef` T2-59: label, help, mapping, member, multiple, range), `essentialKnobsFor` |
| `src/lib/studio/params/structure.ts` | baru | 21 ParamDef kontrak: R-38..R-52 (register SR-01 §13.1) + R-53..R-58 (research/09 tanpa padanan register) |
| `src/lib/studio/params/index.ts` | ubah | agregat + `scope`/`surface` terisi (`ScopedParamDef`); pin nyata 685 / 37 / 21 / 743 (D-162) |
| `src/lib/studio/registry/index.ts` | ubah | ekspor slots, essentials |
| `src/lib/studio/params/render.ts` | ubah | R-09/R-10 tanpa `pageSizeTw` A4 (KC-7, PC-05); konstanta `A4_PORTRAIT_TW` dihapus (PT-09) |
| `src/lib/studio/params/page.ts` | ubah | P4G-01/03 B->T, P4G-11 K->T, P4G-02/06/12 derive `marginsFromDensity`, label P4G-12 "Margin atas" (U5), P4S-13 enum diperluas (KT-6) |
| `src/lib/studio/params/color-type.ts` | ubah | P4T-17 B->T; 12 size + 8 leading + X01/X05/X08 derive `typeScaleFromBase` |
| `src/lib/studio/params/apparatus.ts` | ubah | P5-14 K->T `figureWidthFromClass` |
| `src/lib/studio/params/figure.ts` | ubah | P7-20, P9-36 K->T `figureWidthFromClass` (enum literal dibuang), P9-45 K->T `figureMaxHeightFromBlock` |

## Penyelarasan SR-01 (KT-13) atas research/09

| Butir | Keputusan |
|---|---|
| N6 `type.baseSizePt` | tidak dibuat; kenop G5 menulis `type.scale.body.size` (PC-06) -> P4T-S04-size lapis essential |
| P4G-17 | lapis internal (PC-04), kelas T tetap |
| R-41 `slot.setup` | advanced, kelas B (register); dua medan dibuka kenop lewat `ESSENTIAL_FIELD_PATHS` |
| R-46 `page.customSizeMm` | advanced, kelas B (register) |
| Enum | E35/E38/E39/E43 dari kontrak SR-04 (`standard`, `inControlSheet`, ...) |
| DeriveFnId | `pageSizeFromPaper` (DV-01), bukan `pageSizeFromKnob` |
| R-48..R-52 | ditambahkan (ada di register, tidak di research/09) |
| G1/G2 | dua kenop terpisah (research/09, D-165 global 8), bukan satu kenop KD-21 |
| KT-10 | koreksi controller (mengikat): EK-chapter-06 "Bab mulai di halaman baru" + EK-chapter-07 "Kepala berjalan" -> `slot.setup` medan `startOnNewPage`/`runningHead`; `slot.setup` tetap advanced, izin per kenop (`ESSENTIAL_FIELD_PATHS`/`isEssentialFieldPath`, diterapkan SR-06/SR-07); total 30 (Konten 7) |

## Bukti

- Skrip hitung (scratch `sr05_count.mts`, `npx tsx`): SEMUA CEK LULUS (51 cek, exit 0). 743 kunci = pin; cakupan 722 lama = research/08 §7.1 (+PD-01); jenis cakupan document 368 / section 309 / perangkat 37 / shared 25 / slot 4; lapis E 21 / L 323 / T 70 (43 T-hitung + 27 T-acuan) / I 329, per berkas cocok; kelas 743 B 413 / K 286 / T 44; kenop 28 (G8 cover7 controlSheet1 signatureBlock1 toc2 chapter5 sourceRegister1 appendix3); resolveParams kanonik 0 galat, A4 128/166/247/24.
- `npx tsc --noEmit`: 8 galat, semuanya `contract/schema/v2/forbidden.ts` (SR-04 sedang menulis), 0 di area SR-05.
- `npx eslint src/lib/studio/params src/lib/studio/registry`: exit 0.
- vitest engine-core + registry: 272 lulus, 9 gagal di `tokens.test.ts` (8 karena perubahan kelas yang diniatkan, 1 sudah ada sejak FIX-6) -> file_requests.

## Permintaan lintas baris

Dicatat di `file_requests.md` (prefiks SR-05): SR-60 (id derive final, `pageSizeTw` wajib selalu diturunkan, KEYED `grid.marginBottomMm`), SR-04 (`pageSizeFromKnob` ganda, kontrol multi-pilih), register SR-01 (R-53..R-58), SR-27 (sumber R03), fase uji (9 uji), SR-32/SR-36 (override v1 kunci T dibuang; lebar tabel 166 -> 128 sementara).

## Koreksi controller (KT-10)

Skrip hitung ulang: 52 cek LULUS, exit 0; lapis E 22 / L 322 / T 70 / I 329; kenop 30 (G8 cover7 controlSheet1 signatureBlock1 toc2 chapter7 sourceRegister1 appendix3). tsc seluruh repo: 0 galat; eslint area exit 0. Permintaan medan `startOnNewPage`/`runningHead` ke SR-04 di file_requests.

## Koreksi controller 2

R-41 kembali advanced; ekspor `ESSENTIAL_FIELD_PATHS` (slot.setup -> startOnNewPage, runningHead) + `isEssentialFieldPath`. Skrip hitung: 54 cek LULUS, exit 0; lapis E 21 / L 323 / T 70 / I 329; kenop 30. tsc repo exit 0; eslint area exit 0.
