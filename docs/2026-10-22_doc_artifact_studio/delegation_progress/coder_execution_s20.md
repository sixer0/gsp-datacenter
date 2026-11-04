---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: S20
date: 2026-11-04
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/02_structured_datum_rev_a.md
status: complete
---

# Implementation Report: S20, harness skor konformitas DATUM Rev A

Skill dimuat: `tdd` (siklus merah-hijau per seam), `dry-run-verify-fix` (gerbang uji, tsc, eslint, CLI).
Masukan dibaca: blueprint baris S20 dan §2 (AC-8), `research/32` (katalog lengkap, §0-§17), `research/31`
(§1, §6, §8), keputusan D-592, D-593, D-598 (`decisions/decisions.md:598-604`).

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Pembaca DOCX (fflate) | complete | `lib/xml.ts` (pengurai iteratif, tolak DOCTYPE) + `lib/docx.ts` (bagian, rels, seksi, paragraf/run/teks, tabel, medan, format efektif, fon/ukuran, batas ukuran ZIP) |
| 2 | Klasifikasi seksi R0 | complete | `lib/layout.ts`: SAMPUL, PEMBUNGKUS, LEMBAR KENDALI, DAFTAR ISI, INTERIOR, tabel pita segel, tabel register, `colorNear` +-3 |
| 3 | Antarmuka aturan + katalog | complete | `rules/types.ts`, `catalog.ts` (76 terukur, 4 kritis, X-01..X-05, 39 kode cakupan-saja) |
| 4 | Indeks aturan + 4 stub | complete | `rules/index.ts` mengimpor `rules/structure_a.ts`, `rules/structure_b.ts`, `rules/language.ts`, `clash/index.ts` (semua `rules = []`) |
| 5 | Skor, gerbang kritis, bentrok, cakupan, putusan | complete | `lib/score.ts`, `lib/clash.ts` (kontrak JSON S24), `lib/coverage.ts` |
| 6 | Laporan JSON/MD + CLI tunggal/batch | complete | `lib/report.ts`, `lib/pairs.ts` (register research/31 §1), `lib/cli.ts`, `score.ts` |
| 7 | Uji harness | complete | 6 berkas, 64 uji hijau |
| 8 | CLI pada DOCX Manual 000 (0 aturan) | complete | exit 1 (FAIL, sesuai harapan dengan 0 aturan), laporan tertulis |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| `benchmark/datum_conformance/score.ts` | add | Entri CLI (`npx tsx`) |
| `benchmark/datum_conformance/catalog.ts` | add | Katalog research/32 sebagai data, keberlakuan, pemilik modul |
| `benchmark/datum_conformance/lib/xml.ts` | add | Pengurai XML minimal tanpa dependensi |
| `benchmark/datum_conformance/lib/docx.ts` | add | `DocxDocument` (API pembaca untuk S21-S23) |
| `benchmark/datum_conformance/lib/layout.ts` | add | `buildLayout`, `isSealBandTable`, `isRegisterTable`, `colorNear` |
| `benchmark/datum_conformance/lib/score.ts` | add | `runConformance`, `computeScore` |
| `benchmark/datum_conformance/lib/clash.ts` | add | Validasi dan hitung JSON bentrok PDF |
| `benchmark/datum_conformance/lib/coverage.ts` | add | Pembaca JSON cakupan |
| `benchmark/datum_conformance/lib/pairs.ts` | add | Register pasangan (10 slug + `datum-gsp`) |
| `benchmark/datum_conformance/lib/report.ts` | add | Laporan JSON/MD per templat, ringkasan batch |
| `benchmark/datum_conformance/lib/cli.ts` | add | Argumen, manifest, kode exit |
| `benchmark/datum_conformance/rules/types.ts` | add | `Rule`, `RuleContext`, `PairContext`, `defineRule`, `pass/fail/na/unexercised` |
| `benchmark/datum_conformance/rules/index.ts` | add | Indeks aturan (S20 penulis tunggal) dengan penjaga |
| `benchmark/datum_conformance/rules/structure_a.ts` | add | Stub S21 |
| `benchmark/datum_conformance/rules/structure_b.ts` | add | Stub S22 |
| `benchmark/datum_conformance/rules/language.ts` | add | Stub S23 |
| `benchmark/datum_conformance/clash/index.ts` | add | Stub S24 (sisi TS; `clash.py` milik S24) |
| `tests/unit/studio/datum-conformance/_docx_kit.ts` | add | Perakit DOCX sintetis |
| `tests/unit/studio/datum-conformance/docx-reader.test.ts` | add | 11 uji pembaca |
| `tests/unit/studio/datum-conformance/layout.test.ts` | add | 5 uji klasifikasi seksi |
| `tests/unit/studio/datum-conformance/rule-index.test.ts` | add | 9 uji katalog dan indeks |
| `tests/unit/studio/datum-conformance/scoring.test.ts` | add | 11 uji skor/kritis/bentrok/putusan |
| `tests/unit/studio/datum-conformance/inputs.test.ts` | add | 17 uji JSON bentrok dan cakupan |
| `tests/unit/studio/datum-conformance/report-cli.test.ts` | add | 11 uji register, laporan, CLI |
| `docs/.../delegation_progress/file_claims.md` | modify (append 1 baris) | Klaim path S20 |

Tidak menyentuh `src/`, `prisma/`, `scripts/`, `benchmark/datum_conformance/baseline/**`, `clash/clash.py`, `package.json`. Tanpa dependensi baru (hanya `fflate` 0.8.3 dan modul bawaan Node).

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Unit harness | `npx vitest run tests/unit/studio/datum-conformance` | 6 files, 64 tests passed | durasi 1,06 s |
| Typecheck | `npx tsc --noEmit -p .` | 0 galat di 25 berkas S20 (`--listFilesOnly` memuat 25 berkas) | Run pertama exit 0 total. Run terakhir: 2 galat TS2353 hanya di `tests/unit/studio/mcp/s12-client-labels.test.ts` (milik S12, sedang dikerjakan paralel), bukan berkas S20 |
| Lint | `npx eslint benchmark/datum_conformance tests/unit/studio/datum-conformance` | exit 0; format json: 25 berkas, 0 error, 0 warning | |
| CLI tunggal, Manual 000 | lihat Verification | exit 1, `FAIL`, skor 0/72 | harapan dengan 0 aturan |
| CLI batch | manifest 2 kasus baseline S05 (`a_terbit_datum_gsp`, `b_nota_datum_gsp`) | exit 1; penyebut 72 (TERBIT ID) dan 35 (NOTA ID); `summary.json`/`summary.md` tertulis | penyebut = research/32 §16 |
| Integrasi bentrok | `clash.py` S24 pada PDF Manual 000 lalu `--clash` ke CLI | 105 halaman, 0 bentrok, terserap ke laporan | kode S24 masih berjalan paralel; ini cek kontrak, bukan verifikasi S24 |

## Verification

- Harness hijau: 64/64 (daftar uji per nama ada di keluaran `--reporter=verbose`, sesi ini).
- Penyebut katalog = research/32 §16: uji `penyebut maksimum per pasangan` -> T/S ID 72, T/S EN 74, NOTA ID 35, NOTA EN 36; per keluarga = §1 (CR 4, CV 16, CS 6, RH+RB 11, SB+IS 6, GF+DV 15, NU 4, TR 5, NC 1, AC6 1, LB 7).
- CLI pada Manual 000:
  ```
  npx tsx benchmark/datum_conformance/score.ts --docx "benchmark/out/fixb/official/Manual Komprehensif DATUM GSP 000-GSP-STD-X-2026 RevA.docx" --template datum-standar --language ID --tier TERBIT --out "$TEMP/s20/manual000"
  datum-standar_ID: FAIL | skor 0.0 % (0/72) | kritis 0/4 | cakupan ? | bentrok 0 (PDF ?)
    - skor terukur 0.0 % < 85 % (0/72)
    - aturan kritis gagal: CR-1, CR-2, CR-3, CR-4
    - hasil bentrok PDF tidak diberikan (--clash); 0 bentrok belum terbukti
    - detektor bentrok belum terlatih: X-01, X-02, X-03, X-04, X-05
    - cakupan butir tidak diketahui (--coverage tidak diberikan)
  exit 1
  ```
  sha256 DOCX `dc6ae22f16ddf4011dcb9f4da93961ff27270042ebbf5e8bfb89f9f523ca9030`. Struktur R0 terbaca (1,3 s total termasuk start tsx; urai + klasifikasi sekitar 120 ms): 29 seksi; SAMPUL = seksi 0, LEMBAR KENDALI = seksi 1, pembungkus [0, 1, 2, 3], 21 seksi interior, 8 tabel pita segel, 21 footer register; sel register seksi 4 = `GSP · 000/GSP/STD/X/2026 | REV A · 08-X-2026 | LEMBAR 1 DARI 1 | TERBATAS`.
- Dengan `--clash` dari `clash.py`: alasan bentrok PDF hilang dari putusan, laporan MD mencatat `PDF ... (105 halaman): 0 bentrok`.

## Module API untuk S21-S23 (dan S24)

Setiap modul hanya mengisi `export const rules: readonly Rule[]` di berkasnya sendiri. Indeks dan harness tidak perlu disentuh.

```ts
import { defineRule, pass, fail, na, unexercised, type Rule } from "./types";
export const rules: readonly Rule[] = [
  defineRule("CV-02", (ctx) => {
    const cover = ctx.layout.cover;
    if (!cover) return fail("tidak ada seksi SAMPUL (tabel pita segel)");
    const first = cover.blocks[0];
    return first && first.name === "w:tbl" && ctx.layout.sealBandTables.includes(first)
      ? pass("blok pertama SAMPUL = pita segel", { part: "word/document.xml", location: `seksi ${cover.index}` })
      : fail("blok pertama SAMPUL bukan pita segel", { location: `seksi ${cover.index}`, observed: first?.name });
  }),
];
```

Pemilik kode (kolom `module` di `catalog.ts`; penjaga indeks menolak modul yang salah):

| Modul | Berkas | Kode |
|---|---|---|
| structure_a (S21) | `rules/structure_a.ts` | CV-01..CV-13, CV-16..CV-18, CS-01..04, CS-07, CS-10, TR-01..04, TR-08 |
| structure_b (S22) | `rules/structure_b.ts` | CR-1, RH-01/03/04, RB-01..RB-08, SB-01..03, IS-01..03, GF-01..07, GF-09..15, DV-01 |
| language (S23) | `rules/language.ts` | CR-2, CR-3, CR-4, NU-02/03/05/07, NC-04, AC6-03, LB-01/02/03/06/09/10/11, X-01..X-05 (`kind: "clash"`) |
| clash (S24) | `clash/index.ts` | tidak ada kode katalog; G-01..G-06 masuk lewat JSON `clash.py` |

Kontrak aturan (`rules/types.ts`):
- `Rule` = entri katalog (`id`, `family`, `title`, `citation` ID:n/EN:n, `applicability {tiers, languages, types}`, `critical`, `kind: "measurable"|"clash"`, `module`) + `check(ctx): RuleResult`.
- `RuleResult` = `{ status: "pass"|"fail"|"na"|"unexercised", evidence, part?, location?, observed? }`. `evidence` wajib, juga untuk pass.
- Keberlakuan per tier/bahasa/jenis disaring harness; `check` hanya dipanggil untuk pasangan yang berlaku. `na` hanya untuk aturan bersyarat (research/32 §16 akhir). Untuk CR-*, `na` diubah harness menjadi `fail` ("NA tidak sah") dan `unexercised` menjadi `fail`.
- Lemparan galat di `check` dicatat `fail` dengan `error`. Jangan menangkap lalu mengembalikan `pass`.
- Detektor X-* mengembalikan `fail` bila ada bentrok, `pass` bila tidak; `fail` dihitung bentrok, bukan skor.

`RuleContext`:
- `ctx.docx: DocxDocument`, `ctx.layout: DocLayout`, `ctx.pair: PairContext { slug, language, tier, typeCode, kicker, producedBy: "mcp"|"r08", agentRevisionText, hasCopyControl }`.
- `ctx.bfix?: DocxDocument` dan `ctx.bfixLayout?` = fiksur B-FIX (research/32 §10) dari `--bfix`; tanpa itu CR-3 wajib `unexercised` (= FAIL, research/31 F-5).
- `ctx.spec?: unknown` = JSON tabel spec dari `--spec` (bukti NU-03); tanpa itu NU-03 = `unexercised`.

`DocxDocument` (`lib/docx.ts`):
- Bagian: `partNames()`, `partEntries()` (nama + ukuran, termasuk fon/raster yang tidak didekompresi), `hasPart(n)`, `partXml(n)`, `part(n)` (akar XML ter-cache), `partBytes(n)` (XML/rels/SVG), `document`, `body`, `styles`, `settings`, `numbering`, `fontTable`, `theme`, `headerParts()`, `footerParts()`, `textPartNames()`, `rels(sourcePart)` -> `Map<rId, {type, target, part, external}>`.
- Seksi: `sections()` -> `Section { index, blocks, sectPr, pgSz {w, h, orient}, pgMar {top, right, bottom, left, header, footer, gutter}, titlePg, pgNumStart, headers/footers {default, first, even} (sesudah pewarisan), inherited }`. Paragraf pembawa sectPr tanpa run tidak termasuk `blocks`.
- Teks: `paragraphs(scope)`, `runs(p)`, `runText(r, {visible})`, `paragraphText(p, {visible})` (w:t, w:tab=`\t`, w:br=`\n`, w:noBreakHyphen=`-`; w:instrText bukan teks; `visible` mengkapitalkan run ber-caps efektif), `text(scope, opts)`. `scope` = elemen atau larik blok (mis. `section.blocks`). Isi `w:txbxContent` dilewati.
- Tabel: `tables(scope)`, `tableRows(tbl)`, `rowCells(tr)`, `cellText(tc, opts)`, `gridCols(tbl)`, `enclosingTable(el)`.
- Medan: `fieldInstructions(scope)` -> `{ kind: "simple"|"complex", instr, node }[]` (instr dipangkas, mis. `PAGE`, `TOC \o "1-2" \h \z \u`).
- Format efektif: `effectiveRunProps(run)` -> `{ fonts {ascii, hAnsi, cs, eastAsia} (tema diresolusi), sz (setengah poin), bold, italic, caps, color (hex kapital atau "auto"), spacing (twip), rStyle }`; `effectiveParaProps(p)` -> `{ styleId, outlineLvl, jc, indLeft, spacingLine, lineRule }`; `styleById`, `styleChain`, `themeFont`.
- Inventaris: `fontsUsed()`, `sizesUsed()`.
- Navigasi XML mentah (`lib/xml.ts`): `children`, `child`, `childPath`, `descendants(el, name|Set, {skip})`, `attr`, `attrNum`, `ancestor`, `rawText`. Nama simpul memakai awalan apa adanya (`w:p`).

`DocLayout` (`lib/layout.ts`): `sections` (dengan `classes`), `cover`, `controlSheet`, `toc`, `wrappers`, `interiors`, `firstInteriorIndex`, `sealBandTables`, `registerTables: Map<footerPart, tbl>`; helper `isSealBandTable`, `isRegisterTable`, `colorNear(a, b, tol = 3)`, `SEAL_HEX`, `CONTROL_SHEET_KICKERS`.

Uji modul: bangun indeks sendiri dengan `buildRuleIndex({ structure_a: rules, structure_b: [], language: [], clash: [] })` lalu `runConformance({ docx, pair, index, implementedOnly: true })`, atau panggil `rule.check(ctx)` langsung dengan `buildLayout(docx)`. Perakit DOCX sintetis: `tests/unit/studio/datum-conformance/_docx_kit.ts`. Jangan menguji modul lewat `defaultRuleIndex()` dengan angka tetap, karena modul lain terisi paralel.

## CLI dan keluaran

```
npx tsx benchmark/datum_conformance/score.ts --docx <f> --template <slug> --language ID|EN --tier NOTA|TERBIT|SERAH
    [--clash <json>] [--coverage <json>] --out <dir>
    [--bfix <docx>] [--spec <json>] [--type-code <KODE>] [--kicker <teks>] [--produced-by mcp|r08]
    [--copy-control] [--agent-revision-text] [--implemented-only]
npx tsx benchmark/datum_conformance/score.ts --manifest <json> --out <dir> [--implemented-only]
```

- Exit: 0 semua PASS, 1 ada FAIL, 2 salah pakai/masukan tak terbaca (DOCX rusak, JSON bentrok menyimpang).
- Keluaran: `<out>/<slug>_<LANG>.json` (skema `datum-conformance/v1`: `input` termasuk `structure`, `rules`, `score` + `byFamily`, `critical`, `clash`, `coverage`, `verdict`, `reasons`, `outcomes`) dan `.md`. Batch menambah `summary.json` (`datum-conformance-batch/v1`) dan `summary.md`; nama ganda diberi akhiran `_2`.
- Manifest: `{ "coverage"?: <json bersama>, "entries": [ { docx, template, language, tier, clash?, coverage?, bfix?, spec?, typeCode?, kicker?, producedBy?, copyControl?, agentRevisionText? } ] }`, path relatif terhadap folder manifest.
- JSON cakupan (S33): `{ "percent" }`, `{ "covered", "applicable" }`, atau `{ "pairs": [ { template, language, percent | covered+applicable } ] }`.
- Putusan PASS hanya bila skor >= 85 (aritmetika bulat, 84,95 = gagal), semua CR-* berlaku lulus, cakupan >= 85, total bentrok 0, JSON bentrok PDF diberikan, dan tidak ada detektor X-* yang belum terlatih.

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Galat tsc TS2353 di `tests/unit/studio/mcp/s12-client-labels.test.ts` | 0 (bukan berkas S20) | Pekerjaan S12 yang sedang berjalan paralel | dilaporkan, tidak disentuh | Tidak untuk S20 |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| 5 | Aturan katalog yang berlaku tetapi belum diimplementasikan | Dihitung UNEXERCISED (masuk penyebut) secara bawaan, agar gerbang tidak lolos dengan modul belum lengkap; `--implemented-only` mengeluarkannya untuk pengembangan (CR-* tetap UNEXERCISED). Controller dapat membalik bawaan bila dikehendaki |
| 5 | Putusan tanpa `--clash` atau `--coverage` | FAIL dengan alasan tertulis ("0 bentrok belum terbukti", "cakupan tidak diketahui"), bukan dianggap lulus |
| 5 | Detektor X-* belum terlatih | Membuat `clash.ok = false` (bentrok belum terverifikasi) |
| 3 | NU-03 dinilai dari tabel spec, CR-3 dari fiksur B-FIX | Disediakan masukan opsional `--spec <json>` (`ctx.spec`) dan `--bfix <docx>` (`ctx.bfix`); bentuk spec diputus S23 bersama S26 |
| 3 | Pemilik CR-1 | Modul structure_b (rumah SB, RH, RB menurut research/32 §2); CR-2..CR-4 di language |
| 2 | Klasifikasi seksi R0 ditaruh di harness (`lib/layout.ts`) | research/32 §0.4 mengikat S20-S23 pada definisi yang sama; satu implementasi mencegah tafsir ganda |
| 2 | Pengamatan kalibrasi Manual 000 untuk S25 | Tidak ada medan TOC (seksi 2 memakai tabel "Peta Isi"), jadi DAFTAR ISI tidak terdeteksi menurut R0; seksi 7, 11, 16, 21 berfooter tanpa PAGE (pembatas) tidak terhitung interior; 8 tabel 1x2 berisian seal (termasuk di luar sampul/lembar kendali). Belum dinilai: milik S21/S22/S25 |
| 1 | Keamanan pembacaan DOCX tak tepercaya (masukan S39) | Hanya XML/rels/SVG didekompresi; batas 64 MiB per bagian, 256 MiB total, 20.000 entri; DOCTYPE ditolak; tanpa ekspansi entitas selain 5 bawaan dan rujukan angka; pengurai iteratif tanpa rekursi; nama berkas laporan disanitasi |

## Next Steps

- S21, S22, S23 mengisi modulnya (API di atas); S24 sudah menulis `clash/clash.py` dan kontraknya cocok dengan `lib/clash.ts` (diuji pada PDF Manual 000).
- Review recommended (lingkup: `benchmark/datum_conformance/**` milik S20 dan `tests/unit/studio/datum-conformance/**`), terutama pembacaan DOCX tak tepercaya untuk S39.
