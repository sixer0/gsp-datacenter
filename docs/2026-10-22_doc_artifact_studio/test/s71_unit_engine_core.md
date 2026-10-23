# S71 Uji unit mesin inti (token, bind, lint)

Penulis: test-expert (baris S71, fase final G3). Tanggal: 2026-10-23.
Status: needs-review. 281 uji: 280 lulus, 1 gagal. Kegagalan itu adalah temuan produksi F-S71-1. Ekspektasinya sengaja tidak diubah agar uji lulus.

## 1. Strategi uji

- Lingkup: `src/lib/studio/engine/{tokens,bind,lint}/**` sesuai I01, I02 dan I34-I37 (`01_specs.md` §8.2). Uji juga mencakup gerbang kepercayaan yang mengatur kapan override penegakan dan penanda benchmark boleh berlaku: `services/ingest/trust.ts` dan `services/templates/access.ts` (`isTrustedCaller`, `templateRestriction`), sesuai D-91, D-98 dan D-102. Gerbang ini diuji karena tanpanya perilaku mesin "override hanya untuk pemanggil tepercaya" tidak bisa dibuktikan. Kode produksi tidak diubah.
- Kerangka uji: vitest 4.1.11 (`vitest.config.ts`, environment node, alias `@` ke `src`). Uji murni: tanpa DB, tanpa jaringan, tanpa menulis berkas. Fixture adalah dokumen mini buatan uji ditambah `benchmark/manual000/{doc.json,template.json}` yang hanya dibaca. Profil kanonik dimuat lewat `resolveProfileInMemory`, profil benchmark lewat `loadResolvedProfileFile`. Polanya sama dengan `tests/unit/studio/docx-fonts-family.test.ts`.
- Dikecualikan:
  - Renderer DOCX/HTML, chart dan diagram (wilayah S72/S73).
  - Layanan ber-DB dan route HTTP (S74/S80).
  - `assertTemplateUsable`, karena fungsi ini menulis log JSONL ke `data/studio-workspace`.
  - Alat cakupan. Brief hanya mengizinkan satu perintah, jadi cakupan tidak diukur dengan alat.
- Kategori: jalur normal, kasus tepi, galat, batas, validasi masukan, dan adversarial. Kasus adversarial mencakup 37 ekspresi jahat untuk parser turunan, kunci prototipe, SVG rusak atau berskrip, nilai parameter sampah, dan pemanggil palsu.

## 2. Berkas uji (area eksklusif `tests/unit/studio/engine-core/`)

| Berkas | Isi |
|---|---|
| `fixtures.ts` | Pembangun dokumen mini, snapshot (`normalizeDocument`), profil kanonik dan benchmark (bukan suite) |
| `tokens.test.ts` | resolveParams/computeDerived (turunan kelas T), checkOverrideRights/assertOverrideRights (kelas K/T, kunci asing), validasi nilai, resolveRoleFormat |
| `bind-format.test.ts` | `fmt` DATUM (ribuan ".", desimal ","), half-even eksak, `-0`, galat masukan, `pyRound`, `withUnit` |
| `bind-arith.test.ts` | `evalArith`: semantik Python, galat aritmetika, masukan jahat, batas kedalaman/panjang, pindai statis tanpa eval/Function |
| `bind-derivation.test.ts` | Register, Derivation, buildDerivationBlock, auditText/auditRetired, `isVerbatimReproduction` (termasuk 2 turunan benchmark) |
| `lint-scan.test.ts` | scanText, byConstructionChecks per tier, ingestPolicy, override profil vs dokumen, D-34, runLint/assembleLintReport, benchmark |
| `lint-runner-fault.test.ts` | Injeksi cacat instrumen (vi.mock `tableGuards`, `lintStructure`) ke runLint |
| `lint-render.test.ts` | renderLintLimitsFromParams (regresi F-044), lintRendered DATUM-14/15/25/28/32/33/37, SVG rusak |
| `lint-structure-language.test.ts` | Cakupan 45 cek struktur, tier, D03 hitung ulang, penegakan; bahasa NOT_RUN jujur, parameter rusak, EN |
| `trust-override.test.ts` | isTrustedCaller, strip penanda/override, alur ujung-ke-ujung tanpa DB, templat TERBATAS |

## 3. Inventaris kasus uji (ringkas per kelompok; rincian per kasus ada di nama `it` di berkasnya)

| Kelompok | Kategori | Masukan contoh | Diharapkan | Aktual | Status |
|---|---|---|---|---|---|
| Turunan T kanonik | jalur normal | profil kosong | fullSpan 166, latticeX 10,6667, latticeY 4,7625, figur [128,166], cek lebar 210, PPN efektif 11, margin bawah 24 | sama | LULUS |
| Kriteria §7 #1 | jalur normal | textColumn 120 + outer 28 | fullSpan 158, latticeX 10, figur [120,158] | sama | LULUS |
| Grid tak menutup / D-33 | galat | textColumn 120 saja; blok teks 290 | SCHEMA_INVALID pageWidthCheck / marginBottom | sama | LULUS |
| Non-A4 P4G-17 | tepi | page 216x279 | kolom teks 134, cek lebar 216 | sama | LULUS |
| Override kelas T | keamanan | fullSpan/latticeX, juga ADMIN | PARAM_CLASS_T_READONLY, nilai tetap turunan | sama | LULUS |
| Kelas K | auth boundary | VAT + enforcementOverride oleh USER/GOOGLE/INTERNAL vs ADMIN | 403-kode K per kunci; ADMIN lolos | sama | LULUS |
| Kelas bersyarat | batas | rules.primaryMm 0,1/0,18; pdf.enabled NOTA vs TERBIT | K di bawah ambang; T kecuali TERBIT | sama | LULUS |
| Kunci prototipe | adversarial | `__proto__`, `constructor`, `toString` | PARAM_UNKNOWN_KEY | sama | LULUS |
| fmt half-even | batas | 2,5; 2,675 dec 2; 0,125; -0 | "2", "2,67", "0,12", "-0" | sama | LULUS |
| fmt galat | validasi | NaN, Inf, dec -1/1,5/21, string | BindDefect | sama | LULUS |
| evalArith semantik | jalur normal | `-2 ** 2`, `-7 // 2`, `7 % -3`, `round(2.675, 2)` | -4, -4, -2, 2.67 | sama | LULUS |
| evalArith jahat (37) | adversarial/injeksi | `constructor.constructor(...)()`, `require(...)`, `globalThis.x=1`, backtick, `;`, ZWSP | BindDefect, eval tidak dipanggil, tanpa efek samping | sama | LULUS |
| Batas parser | DoS | 105 kurung, 5000 unary, 500 `**`, > 4096 char | BindDefect (tanpa stack overflow) | sama | LULUS |
| Pindai statis bind | keamanan | 6 berkas `engine/bind` | tanpa `eval(`, `new Function`, `Function(`, vm, child_process | sama | LULUS |
| Register | validasi | tanpa tanda/satuan, dec 4, NaN | BindDefect bertanda kunci | sama | LULUS |
| Derivation | galat | result tidak cocok, tanpa result, tanpa penutup, ekspresi jahat | BindDefect | sama | LULUS |
| isVerbatimReproduction | auth boundary | bertanda/tanpa, result/verdict/registerKey/judul kosong | true hanya bertanda + verbatim murni | sama | LULUS |
| Benchmark verbatim | integrasi | doc.json | semua turunan bertanda lolos; tanpa penanda 0 | sama | LULUS |
| byConstruction per tier | penegakan | judul pertanyaan NOTA/TERBIT/SERAH | DATUM-04 menahan TERBIT/SERAH, tidak NOTA | sama | LULUS |
| Integritas G1 | penegakan | baris kurang sel di 3 tier; profil G1 off | G1 selalu menahan | sama | LULUS |
| Override dokumen | auth boundary | `x.lintEnforcement` off/naik/asing | ditolak (rejected), tetap menahan | sama | LULUS |
| D-34 benchmark | penegakan | x.benchmark + G1 + DATUM-04 | [] / downgrade | sama | LULUS |
| Benchmark D-90/D-93 | integrasi | doc.json + profil BM / kanonik | BM: 0 FAIL; kanonik tanpa penanda: DATUM-04, G3 | sama | LULUS |
| runLint laporan | jalur normal | dokumen mini, ingest/post | render NOT_RUN di ingest, ditambahkan pemanggil di post, NOTA = NOT_RUN | sama | LULUS |
| runLint modul crash | ketahanan | vi.mock scan + struktur melempar | cek NOT_RUN beralasan; rilis bukan PASS | rilis **PASS** | **GAGAL (F-S71-1)** |
| Batas render F-044 | regresi | 12 nilai sampah (NaN, Inf, -1, "", "1e400", larik, objek, null) | default {5,5,[66,80],5,5,247}, finit | sama | LULUS |
| lintRendered | jalur normal | SVG 6 warna/4 pt/260 mm | FAIL 25/28/33 | sama | LULUS |
| SVG rusak | adversarial | bukan SVG, terpotong, ENTITY, `<script>` | tidak melempar, skrip tidak jalan | sama | LULUS |
| Struktur tier | penegakan | NOTA/TERBIT/SERAH | NOTA kosong; D01-D03/D07 hanya SERAH | sama | LULUS |
| D03 | jalur normal/galat | ekspresi cocok/salah/jahat | PASS/FAIL beralasan | sama | LULUS |
| Bahasa NOT-RUN | kejujuran | 19 butir | 10 NOT_RUN = `notRunReason` registri persis, tidak pernah PASS | sama | LULUS |
| Bahasa parameter rusak | validasi | ambang string, rentang terbalik | NOT_RUN menyebut kunci | sama | LULUS |
| Kepercayaan | auth boundary | 3 jenis pemanggil tak tepercaya, ADMIN, harness, `trustedHarness:"true"`, kind palsu | hanya ADMIN/harness `true` | sama | LULUS |
| Ujung-ke-ujung trust | auth boundary | dokumen bertanda + override dari USER | dibuang -> DATUM-04 + G1 menahan; ADMIN -> [] | sama | LULUS |

## 4. Analisis cakupan

Cakupan tidak diukur dengan alat; perintah coverage berada di luar perintah yang diizinkan brief. Penilaian kualitatif:

- Seluruh ekspor I01, I02 dan I34-I37 dipanggil: resolveParams, computeDerived, checkOverrideRights, resolveRoleFormat, Register, fmt, Derivation, evalArith, auditText, auditRetired, BindDefect, runLint, scanText, byConstructionChecks, lintRendered, lintStructure, lintLanguage.
- Celah yang tersisa:
  - Cek struktur A/D satu per satu baru diuji D03/D04. 43 cek lain hanya dibuktikan berjalan dan beralasan.
  - Hanya 5 dari 9 pemindai bahasa terimplementasi yang punya kasus FAIL eksplisit.
  - DATUM-15/DATUM-32 hanya diuji jalur NOT_RUN/PASS dasar.
  - `roles.ts` hanya diuji lewat overlay.
- Remediasi: uji tabel per cek struktur memakai fixture `bad_cases` per DATUM-nn (usulan untuk baris lanjutan atau S88).

## 5. Cara menjalankan

```
cd C:\Users\TRIAL\gsp-swarm-hq-v2.1
npx vitest run tests/unit/studio/engine-core
```

Keluaran segar (2026-10-23 02:00, dikutip):

```
 ❯ tests/unit/studio/engine-core/lint-runner-fault.test.ts (3 tests | 1 failed) 46ms
     × modul scan + struktur crash pada dokumen bermasalah -> status rilis TIDAK boleh PASS 6ms
 ✓ tests/unit/studio/engine-core/lint-scan.test.ts (31 tests) 365ms
 ✓ tests/unit/studio/engine-core/lint-render.test.ts (30 tests) 74ms
 ✓ tests/unit/studio/engine-core/trust-override.test.ts (10 tests) 68ms
 ✓ tests/unit/studio/engine-core/bind-derivation.test.ts (35 tests) 39ms
 ✓ tests/unit/studio/engine-core/tokens.test.ts (28 tests) 34ms
 ✓ tests/unit/studio/engine-core/lint-structure-language.test.ts (15 tests) 35ms
 ✓ tests/unit/studio/engine-core/bind-arith.test.ts (84 tests) 14ms
 ✓ tests/unit/studio/engine-core/bind-format.test.ts (45 tests) 5ms
 FAIL  ... > modul scan + struktur crash pada dokumen bermasalah -> status rilis TIDAK boleh PASS
AssertionError: expected 'PASS' not to be 'PASS' // Object.is equality
 Test Files  1 failed | 8 passed (9)
      Tests  1 failed | 280 passed (281)
```

Hitungan per berkas (reporter JSON): bind-arith 84/0, bind-derivation 35/0, bind-format 45/0, lint-render 30/0, lint-runner-fault 2/1, lint-scan 31/0, lint-structure-language 15/0, tokens 28/0, trust-override 10/0 (lulus/gagal).

Penjaga tambahan (hanya baca):
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -c engine-core` menghasilkan `0`.
- `npx eslint tests/unit/studio/engine-core` keluar dengan kode 0, tanpa keluaran.

## 6. Catatan CI

- Durasi sekitar 4-5 detik, deterministik, tanpa DB, jaringan, berkas tulis maupun waktu dinding. Tidak ada uji flaky yang teramati: 4 run berturut-turut memberi hasil sama.
- Satu-satunya batas waktu adalah uji pemindaian patologis `scanText` (< 5 s); nilai aktualnya jauh di bawah itu.
- `lint-runner-fault.test.ts` memakai `vi.mock` tingkat berkas dan hanya memengaruhi berkasnya sendiri.
- Vite mencetak peringatan `configLoader: 'native'` (ESM di vitest.config.ts). Peringatan ini milik konfigurasi repo, bukan uji.

## 7. Temuan dan keterbatasan

**F-S71-1 (produksi, sedang, needs-review). Pemilik: S44 (`engine/lint/scan/runner.ts`).**

`releaseStatusFor` (`src/lib/studio/engine/lint/scan/runner.ts:115-124`) mengembalikan PASS bila satu saja cek berlaku tercatat bukan NOT_RUN. Akibatnya, ketika modul scan dan modul struktur sama-sama crash (`src/lib/studio/engine/lint/scan/index.ts:166-175` menangkap galat ke `moduleErrors`), status rilis TERBIT tetap PASS. PASS ini hanya ditopang pemindai bahasa yang lolos, sementara G1, DATUM-04 dan DATUM-10 tidak pernah dinilai.

Bukti: kontrol tanpa cacat memberi rilis FAIL; dengan injeksi cacat, rilis menjadi PASS (`lint-runner-fault.test.ts:68`). Probe pada snapshot dengan `doc: null` menghasilkan pola yang sama ("dijalankan 9 cek (PASS 8 ...) status rilis TERBIT: PASS").

Ini bertentangan dengan prinsip runner sendiri ("cacat instrumen dilaporkan, bukan disembunyikan") dan dengan KT-13 (tanpa PASS palsu). Usulan untuk diputuskan controller: bila `moduleErrors` tidak kosong, status rilis paling baik NOT_RUN (atau FAIL), plus banner yang menyebut modul yang gagal.

**F-S71-2 (registri, minor, informasi). Pemilik: S03/S11.**

Kontrak §5.1 menyatakan `derive` wajib untuk kelas T, tetapi 3 kunci kelas T tidak membawa `derive`: `diagram.classification`, `diagram.latticeSnap`, `diagram.docxPlacement.exactLineSpacingPt`. Nilainya tetap dihitung lewat `KEYED_DERIVERS` (`src/lib/studio/engine/tokens/grid.ts`) dan uji membuktikan perhitungannya. Daftar pengecualian dikunci uji (`tokens.test.ts`). Bukan bug perilaku; perlu catatan deviasi kontrak.

**F-S71-3 (warisan acuan, minor, keputusan). Pemilik: S12 (`engine/bind/audit.ts`).**

Pola audit angka `BIND_NUMBER_PATTERN_SOURCE` identik dengan Python `datumbind.py:89` (`(?![\w.])`). Akibatnya angka yang langsung diikuti titik di akhir kalimat ("Rp 2.500.000." atau "3,14.") tidak pernah diaudit D01. Angka tak terlacak di akhir kalimat lolos audit SERAH. Uji karakterisasi mengunci paritas ini (`bind-derivation.test.ts`), bukan menyetujuinya. Keputusan apakah akan menyimpang dari acuan ada di controller.

Keterbatasan lain:
- Gerbang kepercayaan diuji di tingkat fungsi murni. Jalur HTTP/route (403/422 nyata) adalah wilayah S74/S80.
- `vi.mock` mensimulasikan cacat instrumen; crash alami belum ditemukan.
- Profil kanonik di memori tidak memuat aset kanonik. Ini tidak relevan untuk token/bind/lint.

## 8. Rekomendasi

1. Controller memutuskan F-S71-1. Bila disetujui, pemilik S44 mengubah `releaseStatusFor`/`assembleLintReport` agar memperhitungkan `moduleErrors`. Uji merah `lint-runner-fault.test.ts` menjadi penjaga regresinya.
2. Catat F-S71-2 sebagai deviasi kontrak §5.1 (atau tambahkan DeriveFnId untuk 3 kunci itu pada delta kontrak berikutnya).
3. Putuskan F-S71-3: pertahankan paritas Python, atau perluas pola agar titik akhir kalimat diizinkan. Bila diperluas, uji karakterisasi diubah sesuai keputusan.
4. Tambahkan uji tabel per cek struktur A/D memakai fixture `bad_cases` agar cakupan per cek tidak hanya "berjalan dan beralasan".
