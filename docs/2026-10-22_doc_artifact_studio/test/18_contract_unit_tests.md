# 18 Uji unit document contract (DC-35)

Baris: DC-35 (blueprint `identification/07_document_contract_blueprint.md:322`, BA-35). Penulis: test-expert. Tanggal: 2026-10-30. Branch: v2.1. Kode produksi tidak diubah.

Status: complete. Matriks 26/26 kode register tercakup. Satu temuan produk (DC35-F1) dicatat sebagai `it.fails`.

## 1. Strategi uji

- Lingkup: register `masterplan/05_document_contract_specs.md` §5.4 (CH-01..CH-06), §5.5 (DF-72, DF-73), §10 (FN-08), §11.1-§11.3 (DR-01..DR-10, `--emit`), §12 (CU-01..CU-09), §13.1-§13.2 (EC25-EC28, CW-01..CW-04), §16 (md2contract), BA-35/BA-03 (golden = 3 laporan kerja nyata).
- Seam yang diuji (antarmuka publik saja): `validateV2Against` (skema v2), I54 `checkContractRecord`, I55 `resolveContractRefs` (reader tiruan, baca saja), I59-I62 nama final, I63 `extractDraft` + `checkDraftLimits` + `staleBasisIssue`, I64 `markdownToContract`, I68 `resolveChartCustom`, compose `mapBlock`, `contractRecordSkeletonIssues` (CH-06), CLI `scripts/studio/md2contract.ts` (proses tsx) dan `scripts/studio/draft-check.ts` `main()` (in-process).
- Di luar lingkup: jalur DB/route (sudah diuji dc08/dc15-dc23/dcwire*). Tidak ada tulis DB. Workspace Hermes hanya dibaca.
- Kerangka: Vitest 4.1.11 (`vitest.config.ts`, alias `@` = `src`). Properti memakai PRNG mulberry32 ber-benih tetap (tanpa dependensi baru), dan benih + indeks kasus dicetak di pesan galat.

## 2. Berkas uji (baru, semua di `tests/unit/studio/contract/`)

| Berkas | Uji | Isi |
|---|---|---|
| `dc35-code-matrix.test.ts` | 34 | 3 uji kesetaraan register dengan enum, 1 meta-uji cakupan, dan 30 kasus negatif, minimal satu per kode |
| `dc35-golden-md2contract.test.ts` | 23 | 7 uji × 3 laporan + 2 uji KD-42. Golden = sha256 keluaran + ringkasan; `skipIf` bila berkas tidak ada |
| `dc35-roundtrip.test.ts` | 6 | Nama final: 4 properti × 300 kasus. Draf: 60 draf acak, plus `--emit` untuk 20 draf |
| `dc35-chart-custom.test.ts` | 51 | 9 CU ujung ke ujung, 39 kombinasi di luar tabel, dan 3 uji bawaan/hitungan |
| `dc35-findings.test.ts` | 4 | 3 `it.fails` (DC35-F1) dan 1 kontrol |

## 3. Matriks kode register -> uji (kasus negatif yang memicu)

Uji dc35 ada di `dc35-code-matrix.test.ts` dan berjudul `<ID> <KODE>: …`. Kolom "Sudah ada" mencatat uji lama yang juga memicu kode itu (audit).

| ID | Kode | Uji dc35 (pemicu) | Sudah ada |
|---|---|---|---|
| EC25 | CONTRACT_REF_NOT_FOUND | docNumber tak dikenal -> DOCUMENT; revisionNo 6 > 5 -> REVISION | dc07 `revisionNo > revisi terkini`; dc08 NV-11 |
| EC26 | CONTRACT_REF_PID_NOT_FOUND | pid tak ada lewat docNumber | dc07/dc08 NV-12 |
| EC27 | CONTRACT_ITEM_KEY_DUPLICATE | 3 butir, positions [1, 3] | dc07/dc08 NV-10; dc22 langkah 6b; dc25 |
| EC28 | CHART_CUSTOM_FORM_UNSUPPORTED | line horizontal × series (dan 39 kombinasi di `dc35-chart-custom`) | dc27 di luar tabel; dc08 pointer |
| CH-01 | CONTRACT_ENUM | evidence kind `url`; verdict `PARTIAL` | dc05/dc07 NV-01/02/08 |
| CH-02 | CONTRACT_PATTERN | owner huruf besar; sha256 7 heksa | dc05/dc07 NV-03/04 |
| CH-03 | CONTRACT_DATE | items[1].due bulan 13; reportedAt 2025-02-29 (I54) | dc07 NV-05/06 |
| CH-04 | CONTRACT_REF_TARGET | ref hanya pid | dc05/dc07 NV-07 |
| CH-05 | CHART_CUSTOM_FORM | custom + artifactId | dc05 chart.custom |
| CH-06 | SKELETON_CONTRACT_RECORD | tanpa contractKind + dua slot + berulang (4 isu) | dc06, dc29, dc28 |
| DF-72 | DISPLAY_FIELD | payload.columns + refs[0].heading | dc05 DF-72; dc07 NV-09 |
| DF-73 | DISPLAY_FIELD | form.width | dc05 DF-73 |
| CW-01 | CONTRACT_REF_PID_RETIRED | pid pensiun rev4, diterima dengan peringatan | dc07, dc08 |
| CW-02 | CONTRACT_STATUS_UNMAPPED | status `PARKED` + opsi status, scope record | dc24 |
| CW-03 | CONTRACT_HEADING_UNMAPPED | `## Lampiran mentah` -> bab 6 (dan 20 kemunculan di golden) | dc24, dc25 |
| CW-04 | CONTRACT_FIELD_UNMAPPED | kunci `Reviewer`, teks tetap (dan 3 kemunculan di golden) | dc24 |
| DR-01 | DRAFT_NO_JSON_BLOCK | hanya pagar `JSON` huruf besar | dc21 DX-1 |
| DR-02 | DRAFT_FENCE_UNCLOSED | blok ke-2 tanpa penutup sesudah blok sah | dc21 DX-5 |
| DR-03 | DRAFT_JSON_MALFORMED | koma ekor, baris 8 | dc21 DX-2; dc22 |
| DR-04 | DRAFT_BLOCK_NOT_OBJECT | string JSON | dc21 DX-6 |
| DR-05 | DRAFT_SCHEMA_UNKNOWN | `studio.doc/v1` | dc21 DX-4 |
| DR-06 | DRAFT_HEADER_INCOMPLETE | tanpa judul dan langkah-berikut | dc21 DX-7 |
| DR-07 | DRAFT_BASIS_INVALID | `@rev0` | dc21 basis |
| DR-08 | DRAFT_BASIS_STALE | rev3 < 4 (`staleBasisIssue`); rev3 = 3 -> null | dc22 `--remote`; dc23 |
| DR-09 | DRAFT_TOO_LONG | bodyBytes C54+1 (C54 tepat -> null) | dc21; dc23 |
| DR-10 | DRAFT_TOO_MANY_BLOCKS | 21 pagar, termasuk pagar tak tertutup (20 -> null) | dc21; dc22 |

Hitungan: 26 kode register (4 EC + 6 CH + 2 DF + 4 CW + 8 DR + 2 alasan 413). Ke-26 punya kasus negatif dc35 dan semuanya sudah punya minimal satu uji lama. Meta-uji `26 kode register tercakup` gagal bila ada kode register tanpa kasus, atau ada kasus berkode asing. Uji `daftar kode register = enum repo` gagal bila enum berubah tanpa register.

## 4. Golden md2contract (BA-35)

Masukan dibaca dari `C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/`. Opsi tetap: `--reported-at 2026-10-30T12:00+07:00`. Laporan verifier tidak punya kunci Status, jadi dipakai juga `--status needs-review` (tanpa opsi ini hasilnya exit 3, KD-42, dan itu diuji).

| Laporan | sha256 masukan (pin) | sha256 keluaran (stdout CLI) | Bab | Peringatan |
|---|---|---|---|---|
| `2026-10-04-prompt-manual/_work/t_ac989baa/LAPORAN-SELESAI.md` | `04497341…98f7` | `5cad8776…1d80` | 3, 6-9 | 4 × CW-03 (baris 29, 38, 47, 51) |
| `2026-10-12-game-success-formula/verification/01_verifier_report.md` | `5852de3e…9fc3` | `f35b10bd…007e` | 1, 6-12 | 3 × CW-04 (baris 3, 4, 7), 7 × CW-03 |
| `2026-10-10-tracero-dispatcher-1010/laporan.md` | `746f79e2…296c` | `eff5a14a…ba19` | 1, 4, 6-11 | 6 × CW-03 |

Isi golden lengkap (sha penuh, record, judul bab, kode+baris peringatan, bab wajib kosong) ada di berkas uji, tanpa salinan isi laporan. Pemeriksaan per laporan:

- pin sha256 masukan;
- sha keluaran in-process sama dengan sha keluaran CLI (proses tsx);
- dua jalan menghasilkan byte identik;
- validasi v2 valid;
- setiap baris CW-03 menunjuk judul `##` di sumber;
- tidak ada teks yang dibuang: setiap token sumber (alfanumerik, minimal 6 karakter) ada di dokumen. Satu-satunya pengecualian adalah `STATUS` di laporan 1, yaitu kunci kepala yang dipetakan ke record.

## 5. Cara menjalankan

```
npx vitest run tests/unit/studio/contract/dc35        # 5 berkas DC-35
npx vitest run tests/unit/studio                      # suite studio penuh
npx tsc --noEmit -p tsconfig.json
npx eslint tests/unit/studio/contract/dc35-*.test.ts
```

## 6. Bukti jalan (2026-10-30)

- `npx vitest run tests/unit/studio/contract/dc35`: `Test Files 5 passed (5)`, `Tests 115 passed | 3 expected fail (118)`, durasi 7.08s.
- `npx vitest run tests/unit/studio`, run pertama: `Test Files 136 passed (136)`, `Tests 3096 passed | 3 expected fail | 1 skipped (3100)`.
- `npx vitest run tests/unit/studio`, run kedua (sesudah agen paralel menambah berkas): `Test Files 1 failed | 138 passed (139)`, `Tests 1 failed | 3141 passed | 3 expected fail | 1 skipped (3146)`. Satu-satunya yang gagal adalah `tests/unit/studio/contracts/fixqb-contract-issues.test.ts` > `summarizeContractChecks …`. Berkas itu milik agen paralel (FIX-R40-3, belum dilacak git, sedang dikerjakan), bukan DC-35.
- `npx eslint tests/unit/studio/contract/dc35-*.test.ts`: exit 0, 0 temuan.
- `npx tsc --noEmit -p tsconfig.json`: 0 galat di berkas dc35. Ada 5 galat TS2554, semuanya di `tests/unit/studio/api/fixqa-route-quota.test.ts` (berkas agen paralel, belum dilacak git), bukan milik DC-35.

## 7. Temuan produk dan keterbatasan

**DC35-F1 (sedang): md2contract menebak nilai majemuk.** Lokasi: `src/lib/studio/services/import/contract/parse.ts:139-142` (`leadToken`, regex `/^[A-Za-z0-9_.-]+/`), dipakai di `index.ts:196` (status), `:204` (vonis), dan `:366` (status butir). Token awal berhenti di `/` atau `,`, sehingga nilai majemuk dipetakan ke alternatif pertama tanpa CW-02. Ini bertentangan dengan register §16.5 ("dicocokkan") dan KD-42 ("tidak ditebak").

Contoh pemetaan yang salah:
- `Verdict: PASS/FAIL` -> `PASS`
- `Status: complete/blocked` -> `complete`
- status butir `done/blocked` -> `done`
- status butir `todo,blocked` -> `todo`

Reproduksi: `markdownToContract(MAJEMUK, { kind: 'agentWorkReport' })` dengan `MAJEMUK` dari `dc35-findings.test.ts`. Hasilnya `record.verdict = "PASS"`, `record.status = "complete"`, dan `report.warnings = []`.

Uji `it.fails` menyatakan perilaku yang diharapkan register. Begitu cacat diperbaiki, uji itu berubah merah dan perlu diganti menjadi `it`. Kasus kontrol `FAIL (keterangan)` -> `FAIL` tetap lolos karena memang disengaja (`parse.ts:138`).

Keterbatasan:
- Golden bergantung pada berkas Hermes. Bila berkas tidak ada, uji di-skip. Bila isinya berubah, uji pin gagal dengan pesan "golden harus dibangkitkan ulang".
- Uji CLI golden menjalankan 5 proses tsx (sekitar 1-2 detik per proses).

## 8. Catatan CI dan rekomendasi

- Tidak ada uji flaky yang teramati. Properti memakai benih tetap.
- Pada mesin CI tanpa workspace Hermes, 23 uji golden akan di-skip (`describe.skipIf`). Itu bukan kegagalan.
- Rekomendasi 1: perbaiki DC35-F1. Token awal sebaiknya hanya diterima bila diikuti spasi, `(`, atau akhir nilai. Selain itu, nilai dianggap tanpa alias dan diberi CW-02.
- Rekomendasi 2: controller memutuskan apakah kepala `Kunci: nilai` di dalam badan seksi (baris 30 laporan verifier, `VERDICT: FAIL (...)`, di bawah 40 baris pertama) memang dimaksud ikut dipetakan. Perilaku ini sesuai teks §16.1 ("40 baris pertama"), tetapi mungkin di luar niat penulis register.
