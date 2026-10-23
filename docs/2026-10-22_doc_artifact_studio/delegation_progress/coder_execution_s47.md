# S47 coder-execution — lint bahasa grup C (engine/lint/language)

Status: complete (penjaga tsc + eslint bersih; smoke tsx lulus). Tanggal 2026-10-23.

Berkas (area eksklusif `src/lib/studio/engine/lint/language/`):
- `index.ts` (ganti stub I37): `lintLanguage(s, params)` tanda tangan persis §8.2; ekspor tambahan `LANGUAGE_LINT_DEFS`, `LANGUAGE_SCANNERS`, `countWords`, `splitSentences`.
- `checks.ts`: 9 pemindai C-20, C-26b, C-26c, C-27, C-31, C-34, C-INFO-OPENER, C-SG-L2-09, C-SG-L2-04.
- `tokenize.ts`: tokenisasi Indonesia terdokumentasi (kata Unicode + sambungan `-'.,/`; kalimat `.!?…` dengan pengecualian singkatan, inisial kecuali `Lampiran A.`, huruf kecil berikutnya; koma desimal tidak dihitung).
- `prose.ts`: lapisan prosa (paragraf PROSE_ROLES + badan aside), naratif (semua paragraf, butir daftar, aside), daftar; md-lite `*`/backtick dibuang (KS-03).
- `params.ts`: `params[key]` -> default ParamDef P11; tipe salah -> NOT_RUN bernama kunci.

Angka: 19 entri `module: "language"` dari registri -> 19 checkId dalam keluaran; 9 dijalankan, 10 NOT_RUN dengan `notRunReason` registri (menyebut `lint_mutu.py`, `scan_ai_footprint.py`).
Ambang dari parameter: P11-11 paragraph.maxWords, P11-12 list.numberedWhenItemsGreaterThan, P11-13/14/16 letter.*, P11-25 chainedSentencesPercent, P11-26 semicolonsPer1000Words, P11-27 wordsPerSentenceAvg, P11-28 distinctOpenerRatio, P11-32 inlineProvenanceMarks.

Keputusan (untuk register controller):
1. Status: agregat 1 isu per butir; butir per blok (C-20, C-34, C-SG-L2-09, C-SG-L2-04) = 1 FAIL beralamat per temuan (maks 50 + 1 ringkasan), 1 PASS bila bersih. Runner S44 perlu mengagregasi per checkId.
2. C-INFO-OPENER selalu `REPORT` (INFO); cakupan > 2.000 kalimat = konstanta definisi aturan (T119), bukan parameter.
3. Definisi aturan sebagai konstanta bersumber: kalimat berantai >= 4 koma; sapaan terlarang `Kepada Yth.`, `Halo`, `Hai`; rujukan terlarang `kamu`; tanda provenans = glif PROVENANCE_GLYPHS + label kapital TERUKUR/DITURUNKAN/PEMASOK/ASUMSI.
4. Kanal (doc/etalase/K2) tidak ada di DocMeta: metrik diterapkan ke seluruh prosa; detail menyatakannya.
5. `meta.language` EN: C-20, C-34 NOT_RUN (leksikon khusus Indonesia); metrik lain tetap jalan.
6. Galat parameter/pemindai/snapshot rusak -> NOT_RUN dengan sebab; fungsi murni tanpa I/O, tidak melempar ke runner (pencatatan persisten milik runner/layanan).
7. Tabel (termasuk exampleWrongRight), monoBlock, derivation, figur, assumptionInline tidak dipindai.

Bukti: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/engine/lint/language"` -> 0 baris (exit 1). `npx eslint src/lib/studio/engine/lint/language` -> exit 0. Smoke `npx tsx <scratch>/s47/smoke.ts`: 19 defs, 21 isu, 19 checkId unik; FAIL terpicu sesuai fixture (C-20, C-26c, C-27, C-34, C-SG-L2-09, C-SG-L2-04); param rusak -> NOT_RUN; EN -> NOT_RUN; snapshot rusak -> NOT_RUN.

Permintaan lintas pemilik: tidak ada. Temuan: S44 (runner) belum ada saat S47 selesai; kontrak isu di butir 1 perlu diselaraskan di S44/S71.
