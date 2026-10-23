---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: SR-41
date: 2026-10-23
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/05_structural_sections_blueprint.md
status: complete
---

# SR-41 - Sisa FIX-3 bagian fixture (konten-saja, v2, D-126, garis_a, hop, K-08, S76-H3/H4)

Masukan: D-117, D-120, D-126, D-138; brief `final_phase_brief.md`. Skill: receiving-code-review, dry-run-verify-fix.
Catatan FIX-3 lama `coder_execution_fix3.md` TIDAK ADA di disk (klaim FIX-3 dilepas controller G-3 SR-39, D-239); keadaan FIX-3 direkonstruksi dari berkas dan `tests/parity/out/fix3/*`.

## Ringkasan

Kriteria baris SR-41 terpenuhi (bukti di bawah): 4 fixture v1 konten-saja + 4 salinan v2 lolos validator v1 dan v2 (0 DISPLAY_FIELD), `check_doc_fixtures` 20/20 exit 0, penemuan fixture tidak memungut `garis_a` (juga tanpa manifest). Status `needs-review` karena efek samping di luar area: `tests/parity/fixtures/src/validate_fixtures.ts` (gerbang S63) kini GAGAL 6 (sha manifest 4 berkas doc, 6 berkas baru tak terdaftar, cakupan "moda rel A/B" karena `layout.railMode` pindah ke templat). Perbaikannya butuh menyunting `tests/parity/fixtures/manifest.json`, `tests/parity/fixtures/src/docs.ts` (generator) dan `validate_fixtures.ts` - bukan area SR-41.

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca brief, baris SR-41, D-117/D-120/D-126/D-138 | complete | catatan FIX-3 tidak ada |
| 2 | `check_doc_fixtures` dipulihkan (crash templat `datum-gsp`) | complete | kunci kelas T dibuang lewat `parseTemplateProfile` seperti seed UT-01 |
| 3 | Fixture doc v1 konten-saja + salinan v2 | complete | skrip baru `content_only_doc_fixtures.ts` (idempoten, tulis atomik) |
| 4 | DATUM-20/22/23 fixture serah/terbit (D-126) | complete | sudah PASS (perbaikan fixture FIX-3); kini DIJAGA `check_doc_fixtures` untuk v1 dan v2; aturan tidak disentuh |
| 5 | Penemuan fixture tanpa garis_a | complete | direktori `garis_a/` dikecualikan secara struktural di `lib/fixtures.ts` |
| 6 | Hop persilangan, K-08 <= 100 unit | complete (verifikasi) | sudah ada sejak FIX-3 (di luar area SR-41; tidak diubah) |
| 7 | S76-H3/H4 | complete (verifikasi) | sudah ada di `compare_docx.py` (area SR-40; tidak disentuh); selftest lulus |
| 8 | run_parity: salinan v2 dirender sebagai dokumen | complete | acuan Python dari pasangan v1 |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| `scripts/parity/run/content_only_doc_fixtures.ts` | add | Konversi konten-saja terpandu adaptor: medan/elemen dibuang hanya bila (a) tetap lolos skema v1, (b) stripped+dropped REPORT `SCHEMA_V1_ADAPTED` turun, (c) dokumen v2 hasil `adaptV1` identik (stableStringify) - tidak ada konten hilang. `overrides` dokumen -> `<stem>.template.json`. Tulis `doc/v2/<stem>.json`. `--check` = cek sinkron tanpa tulis |
| `scripts/parity/run/check_doc_fixtures.ts` | modify | Templat `datum-gsp` lewat `parseTemplateProfile` (buang kelas T + `lint.enforcement*`); v1: ingest dryRun USER @datum-kanonik/@datum-gsp/@templat pendamping, format inline 0, elemen dibuang 0; v2: `validateV2Against` 0 isu, 0 DISPLAY_FIELD, pindai kunci DF-01..DF-52 + nilai DF-60/DF-61 = 0, ingest dryRun; SERAH/TERBIT: DATUM-20/22/23 = PASS; pasangan v1<->v2 lengkap |
| `scripts/parity/run/lib/fixtures.ts` | modify | Direktori `garis_a/` tidak pernah dipungut (dilaporkan SKIPPED, terlepas dari manifest); salinan `doc/v2/<stem>.json` mewarisi `doc/<stem>.template.json` |
| `scripts/parity/run/run_parity.ts` | modify | `docV2`/`chapterV2` diperlakukan dokumen (format docx/pdf/html, templat, pembanding DX/PD/HT); acuan ref_doc.py dari pasangan v1 `doc/<stem>.json` |
| `tests/parity/fixtures/doc/doc_nota_memo.json` | modify | 11867 -> 11588 B (sha 1a849ee931c6); dibuang 7 |
| `tests/parity/fixtures/doc/doc_nota_tables.json` | modify | 49506 -> 46721 B (sha 2dcb160a9e2b); dibuang 59 |
| `tests/parity/fixtures/doc/doc_serah_handover.json` | modify | 64331 -> 56271 B (sha a67fe8fa5f13); dibuang 67; overrides dipindah |
| `tests/parity/fixtures/doc/doc_terbit_report.json` | modify | 48538 -> 46356 B (sha a34786242205); dibuang 33; overrides dipindah |
| `tests/parity/fixtures/doc/doc_serah_handover.template.json` | add | profil `{base: datum-kanonik, overrides: {layout.railMode: B}}` |
| `tests/parity/fixtures/doc/doc_terbit_report.template.json` | add | profil `{base: datum-kanonik, overrides: {layout.railMode: A}}` |
| `tests/parity/fixtures/doc/v2/*.json` (4) | add | salinan studio.doc/v2 (memo 71393c78c86e, tables 095c5f821867, serah ade4147fcfe5, terbit d5be9d682264) |

Tidak disentuh: `render_cli.ts`, `lib/render.ts` (SR-33), `scripts/parity/compare/**` (SR-40), `src/**`, `prisma/**`, manifest/generator fixture. Salinan pra-konversi: `%TEMP%/sr41/before/*.json`.

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Cek fixture doc | `npx tsx scripts/parity/run/check_doc_fixtures.ts` | exit 0, `20/20 lolos (v1 4 berkas, v2 4 berkas); gagal himpunan 0` | lihat Verifikasi |
| Uji negatif cek | sama, `--fixtures %TEMP%/sr41/neg` (v2 + `widthMm`, v1 + `format`) | exit 1, `0/4 lolos`; `DISPLAY_FIELD@/widthMm`, `format inline 1` | cek benar-benar menolak |
| Sinkron konversi | `npx tsx scripts/parity/run/content_only_doc_fixtures.ts --check` | exit 0, 4x `tidak berubah`, v2 isu 0 (DISPLAY_FIELD 0) | idempoten |
| Penemuan | `discoverFixtures('tests/parity/fixtures')` | 110 fixture, skipped = 2 `garis_a` + manifest; 0 fixture dari garis_a | tanpa manifest (salinan `diagram/` ke %TEMP%): 11 fixture, 0 garis_a |
| Paritas doc v1+v2 | `run_parity.ts --only "doc/**" --formats docx,html --out %TEMP%/sr41/run_doc` | exit 0, 8 fixture `DIAGNOSIS` (DX = diagnosis D-120) | v2 dirender, acuan dari pasangan v1 |
| Paritas hop / K-08 | `run_parity.ts --only diagram/dg_graph_hops` ; `--only chart/k08` | `PASS svg=PASS png=PASS` ; `DIAGNOSIS svg=PASS png=DIAGNOSIS` exit 0 | K-08 = 58+25+13+4 = 100 |
| S76-H3/H4 | `<venv>\python.exe scripts/parity/compare/selftest_compare.py` | `24/24 lulus` termasuk `dx_is_diagnosis_and_caps_folded`, `dx_alignment_pairing_for_tables_and_sections` | baca-saja |
| eslint | `npx eslint <4 berkas run/>` | exit 0 | |
| tsc | `npx tsc --noEmit -p tsconfig.json` | exit 2: 21 galat, SEMUA di `tests/integration/studio/studio-db.integration.test.ts` (TS18048), 0 di `scripts/parity/**` | berkas itu bukan milik SR-41, tidak disentuh |
| Korpus S63 | `npx tsx tests/parity/fixtures/src/validate_fixtures.ts` | exit 1, `GAGAL (6 kegagalan)`: sha manifest 4 doc, 6 JSON tak terdaftar, cakupan moda rel A/B | efek samping, lihat Persistent Issues |

## Verification

- Validator v1 (skema `studio.doc/v1` + ingest dryRun USER) dan v2 (`validateV2Against` + ingest dryRun), keluaran `check_doc_fixtures`:
  - `LOLOS  v1 doc_nota_tables.json @datum-gsp inline=0 dropped={} sisa={}`
  - `LOLOS  v1 doc_serah_handover.json @doc_serah_handover.template.json inline=0 dropped={} sisa={"id":1,"label":1,"mode":1,"source":1,"title":2,"widthMm":5,"width_mm":1}; D-126 DATUM-20:PASS DATUM-22:PASS DATUM-23:PASS`
  - `LOLOS  v2 v2/doc_terbit_report.json @datum-gsp v2Isu=0 DF=0 pindaiDF=0; D-126 DATUM-20:PASS DATUM-22:PASS DATUM-23:PASS`
  - `check_doc_fixtures: 20/20 lolos (v1 4 berkas, v2 4 berkas); gagal himpunan 0`, exit 0.
- Sisa `stripped` v1 = HANYA medan wajib skema v1 (dibuktikan per pointer: menghapusnya -> `must have required property`): `meta.title`, judul bab/seksi, `spec.title/source/widthMm` chart, `widthMm`/`source` figur, `id/title/width_mm` diagram, `parts[].id/label`, `front.*.mode`. Setara pengecualian 14 `style` daftar di D-138. Format inline (R-38) = 0, elemen dibuang (spacer/device/frontItems/tocEntries) = 0. Di salinan v2 semuanya 0 (DF-01..DF-69).
- Tanpa kehilangan konten: dokumen v2 dari v1 baru identik (stableStringify) dengan dokumen v2 dari v1 lama - syarat (c) ditegakkan di skrip dan diperiksa ulang di akhir tiap berkas.
- D-126: DATUM-20/22/23 PASS di SERAH dan TERBIT untuk ketiga templat, v1 dan v2. Aturan lint tidak diubah.
- garis_a: `skipped` memuat `diagram/garis_a/good_layered.json`, `diagram/garis_a/good_sld.json` dengan alasan `direktori garis_a/: ... (F-S78-2)`; `garis_a fixtures: 0`.

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| `validate_fixtures.ts` GAGAL 6 (sha manifest 4 doc; 6 JSON baru tak terdaftar; cakupan "moda rel bukti A/B") | 0 (di luar area) | fixture doc berubah sesuai SR-41; `layout.railMode` kini di `<stem>.template.json`, sedangkan manifest, generator `src/docs.ts` dan aturan cakupan masih mengandaikan fixture bertampilan | butuh pemilik `tests/parity/fixtures/src/**` + `manifest.json`: (1) generator memanggil konversi SR-41 atau menulis konten-saja + v2 + templat pendamping, (2) regenerasi manifest (+6 berkas), (3) cakupan rel/perangkat dibaca dari templat pendamping (D-138) | Ya untuk gerbang S63; tidak untuk kriteria SR-41 |
| Generator `build_fixtures.ts` akan menimpa fixture konten-saja bila dijalankan ulang | - | `src/docs.ts` masih memancarkan v1 bertampilan | sementara: jalankan `content_only_doc_fixtures.ts` sesudahnya (idempoten) | Tidak |
| tsc 21 galat di `tests/integration/studio/studio-db.integration.test.ts` | 0 | bukan SR-41 (pra-ada/penulis lain) | dilaporkan | Tidak untuk SR-41 |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| 2 | `check_doc_fixtures` crash: `grid.textColumnMm (kelas T) ... tidak dapat ditimpa` | ikuti seed UT-01: pembaca profil membuang kelas T, lalu `lint.enforcement*` dibuang |
| 3 | Cara konversi: daftar medan manual vs terpandu adaptor | terpandu adaptor dengan syarat v2-identik (deterministik, bukti tanpa kehilangan konten) |
| 3 | Override dokumen `layout.railMode` (DF-41) | dipindah ke profil pendamping `<stem>.template.json` (dipungut penemuan; dipakai render paritas dan `check_doc_fixtures`) - tampilan milik templat (D-138) |
| 3 | Lokasi salinan v2 | `tests/parity/fixtures/doc/v2/<stem>.json`; penemuan memungutnya sebagai `docV2` (SR-46 dapat menjalankan v1 dan v2) |
| 6-7 | Hop persilangan (`diagram/dg_graph_hops.json`), K-08 (`chart/k08.json`), S76-H3/H4 sudah dikerjakan FIX-3 di berkas di luar area SR-41 | hanya diverifikasi (PASS / selftest lulus), tidak diubah |
| 8 | run_parity tidak mengenal `docV2` sebagai dokumen (jatuh ke cabang gambar: NO_REFERENCE, format SVG/PNG) | diperbaiki di run_parity (area SR-41) |

## Next Steps

- Controller: tetapkan pemilik sinkronisasi `tests/parity/fixtures/manifest.json` + `src/docs.ts` + `src/validate_fixtures.ts` (lihat Persistent Issues) sebelum SR-46/SR-47.
- Review recommended: `scripts/parity/run/content_only_doc_fixtures.ts`, `check_doc_fixtures.ts`, `lib/fixtures.ts`, `run_parity.ts`.

## Lanjutan D-243 / D-246 / D-248 (2026-10-23)

Area diperluas (D-243, diklaim di `file_claims.md`): `tests/parity/fixtures/manifest.json`, `src/docs.ts`, `src/validate_fixtures.ts`, `src/build_fixtures.ts`.

| File | Change | Description |
|---|---|---|
| `scripts/parity/run/lib/content_only.ts` | add | Logika konversi tunggal (generator + skrip): pembuangan terpandu adaptor; aset tak dirujuk dibuang (D-248); `outputs`/`render` akar dibuang (D-247); templat pendamping dari override dokumen atau tampilan yang diangkat penulis |
| `scripts/parity/run/content_only_doc_fixtures.ts` | modify | memakai lib; laporkan aset yang dibuang |
| `scripts/parity/run/check_doc_fixtures.ts` | modify | + cek aset tak dirujuk (v1, v2) |
| `scripts/parity/run/run_parity.ts` | modify | D-246: `figureContext` chart -> `{ chartSpec: <path spec fixture> }` diteruskan ke compare.py (SVG) |
| `tests/parity/fixtures/src/docs.ts` | modify | sumber bertampilan tetap; ekspor `DOC_FIXTURES` = keluaran `toContentOnlyDoc` (+ `templateFile`, `v2File`); `templateOverrides` per fixture (nota_tables: margin A4 -> `grid.*` kelas B) |
| `tests/parity/fixtures/src/build_fixtures.ts` | modify | tulis atomik; tulis templat pendamping (`docTemplate`) + salinan v2 (`docV2`) dan entri manifestnya |
| `tests/parity/fixtures/src/validate_fixtures.ts` | modify | v2 lewat `validateV2Against`; railMode dari `doc/<stem>.template.json` (D-139); dokumen v1 tanpa `overrides`; pasangan v1<->v2; profil pendamping sah tanpa kelas T |
| `tests/parity/fixtures/manifest.json` | regen | 113 entri (doc 4, docV2 4, docTemplate 3, ...) |

Bukti:
- `validate_fixtures.ts`: `entri manifest 113, berkas ada + sha256 cocok 113/113; ... tak terdaftar 0`, `studio.doc/v2: 4/4 VALID`, `moda rel A/B`, `HASIL: LOLOS (0 kegagalan)`, exit 0.
- `check_doc_fixtures.ts`: `22/22 lolos (v1 4 berkas, v2 4 berkas)` (20 + 2 baris templat pendamping nota_tables), exit 0. `content_only_doc_fixtures.ts --check`: 4x `tidak berubah`.
- Bangun ulang `build_fixtures.ts` dua kali: daftar sha256 75 JSON identik (diff kosong); berkas non-doc (chart/diagram/simbol/garis_a) identik dengan sebelum SR-41.
- eslint 8 berkas: exit 0. tsc: 0 galat di berkas SR-41 (galat yang ada di `lib/render.ts` SR-33, `tests/integration/...`, `tests/unit/.../auth.test.ts` milik penulis lain).
- D-246: `run_parity --only P-08` -> `svg=PASS`; `cmp/svg.context.json` = `{"chartSpec": "...\tests\parity\fixtures\chart\p08.json"}`; laporan `contentLabels.namesSource = "chartSpec (data acuan)"`.

D-248:
1. `doc_nota_tables`: beda render berasal dari margin bab 1 (setup A4) dan nilai tampilan PER INSTANS (17 lebar kolom, 14 rata kolom numeral, 1 arsir sel, 1 vAlign, 1 tata letak tetap, penempatan SUMBER per tabel). Margin punya padanan templat global -> `doc_nota_tables.template.json` (`grid.innerMarginMm` 25, `outerMarginMm` 20, `topBottomMarginMm` 20, `marginBottomMm` 20): baris beda document.xml lama->baru 3600 -> 814. Sisa per instans TIDAK punya padanan parameter templat (templat global; `render.table.sourcePlacement` satu nilai, padahal fixture sengaja memuat dua penempatan; `table.numeral.align=right` diuji: 0 perubahan). Margin yang sama TIDAK diangkat untuk SERAH: kolom teks turunan 127 mm membuat figur 128 mm ditolak G2.
2. `logo_ilustrasi` (SERAH): dirujuk hanya oleh blok perangkat logo sampul (dibuang; sampul disusun templat, D-138) -> dibuang dari v1 dan v2; dicek `check_doc_fixtures` (aset tak dirujuk = gagal).

Sha render DOCX final (render_cli, `--template` pendamping bila ada; dua render identik untuk ke-8):
| Fixture | v1 DOCX sha256 | v2 DOCX sha256 | beda baris lama->v1 | v1->v2 |
|---|---|---|---|---|
| doc_nota_memo | f36195877cdc6ecf99b789748a76581122afcb558ac6c751fdbb67c9d8cd5d61 | 2c6869e5373c02571e2fa417fc7aac605467267512c10429c2af9c7ff9272f53 | 41 | 17 |
| doc_nota_tables | 2bbf1d8e8d211e90ecbb0ecbc13d64ef6fe899f3f522552af90eb8dbb50222db | 6c1e4a788fde744933ee44b673b50e361900c56ffb60d4cea41b85465a793d95 | 814 | 17 |
| doc_serah_handover | 49b36c47380568a68494564a9167ed3c46f0a20ae1bc80265b93101122fcf22b | 5f07f416d296c8e7f94cd0ddf60435b432b154379a217eec6dc096097d96e6bc | 2835 | 4641 |
| doc_terbit_report | 96b676db20d5a9ac0f4155bece497c90b3a9b21cfb9f44f38e1066dc715fb3d9 | a307d24020352fb13ce58a430b9294472c875a1e49ce87daa8fdec8ff838d689 | 1962 | 111 |

Catatan: `src/**` sedang disunting penulis lain selama sesi ini (D-247 `render` dihapus dari studio.doc/v2; sempat `fillerOf`/`FIGURE_WIDTHS_MM` tak terdefinisi sesaat). Salinan v2 dibangun ulang mengikuti adaptor terkini; sha render di atas berlaku untuk keadaan src saat pengukuran dan dapat bergeser bila baris lain mendarat. SERAH v1->v2 4641 baris beda (jalur v2 menyusun halaman depan dari templat) dicatat untuk SR-42/SR-46.

## Lanjutan D-269 (DATUM-09, isi fixture)

- Sebab: preset `reconciliation` (Tabel 1.2 SERAH; juga di nota_tables) = tabel data numerik (2/4 sel badan angka murni) tanpa satuan -> DATUM-09 menolak (`ingest dryRun valid:false [DATUM-09@/chapters/0/sections/0/blocks/4]` pada fixture lama).
- Perbaikan ISI di sumber `tests/parity/fixtures/src/docs.ts:360`: kepala kolom `Rute 1 (m³/jam)`, `Rute 2 (m³/jam)` (penanda satuan kepala, `hasUnitColumn` checks-a.ts:94-99); tanpa medan tampilan. Berlaku untuk v1 dan v2 (keduanya dibangkitkan generator).
- Seed: `prisma/seed-studio.ts:316-318` (`SAMPLES`) membaca `tests/parity/fixtures/doc/doc_*.json` = berkas yang sama; seed tidak diubah.
- `check_doc_fixtures` kini menjaga DATUM-09 di semua fixture (SERAH/TERBIT wajib PASS; NOTA NOT_RUN = tidak berlaku): `doc_serah_handover.json @datum-gsp lint DATUM-09:PASS DATUM-20:PASS DATUM-22:PASS DATUM-23:PASS` (v1 dan v2); `22/22 lolos`, exit 0.
- `validate_fixtures.ts`: `113/113`, `HASIL: LOLOS (0 kegagalan)`, exit 0. Bangun ulang dua kali: sha identik; berubah hanya doc_nota_tables, doc_serah_handover (v1+v2) dan manifest (9a968160...). eslint exit 0.
