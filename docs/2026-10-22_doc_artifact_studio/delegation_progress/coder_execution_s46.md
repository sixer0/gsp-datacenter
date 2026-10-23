# S46 coder-execution: lint struktur (engine/lint/structure)

- Status: complete (penjaga tsc + eslint bersih; uji unit milik S71).
- Berkas (8, 2.229 baris): `src/lib/studio/engine/lint/structure/{index,enforcement,context,walk,text,props,checks-a,checks-d}.ts`.
- Antarmuka kontrak I36 tetap: `lintStructure(s, tpl, tier): LintIssue[]`. Ekspor tambahan: `lintStructureWith(opts)`, `STRUCTURE_CHECKS`, `STRUCTURE_LINT_DEFS` (45), `structureCoverageGaps()` (= []), `benchmarkSafetyOverrides`, `resolveEnforcement`, `effectiveEnforcement`, `isIngestBlocking`, `applyEnforcement`, `safetyOverridesFrom`.
- Cakupan: 45/45 entri registri module "structure" (24 grup A mode S + D01-D21). Hanya cek yang berlaku untuk tier dijalankan (NOTA = 0 cek registri). Setiap cek berlaku memberi PASS (detail), FAIL/REPORT per temuan (address §4.1 + pointer JSON ke snapshot.doc), atau NOT_RUN beralasan; plafon 100 temuan per cek + ringkasan. Tidak melempar: kegagalan cek = NOT_RUN.
- Penegakan D-34: mode `block|release|report|off`; default registri (blocksIngest -> block, batas "lapor" -> report, lain release). Profil templat `tpl.params["lint.enforcementOverride"]` boleh semua mode; dokumen `doc.x.lintEnforcement` hanya block -> release; permintaan ditolak dilaporkan REPORT `STRUCT-ENFORCEMENT`.
- Bukti penjaga: `npx tsc --noEmit -p tsconfig.json | grep -E "src/lib/studio/engine/lint/structure"` -> kosong (grep exit 1; total repo 27 galat, semua di luar area); `npx eslint src/lib/studio/engine/lint/structure` exit 0.
- Smoke benchmark (`benchmark/manual000/doc.json`, profil kanonik default, sectionPlan seperti S70): TERBIT 89 temuan / 42 cek, 38 ms. Non-PASS: DATUM-09 FAIL 7 (kolom "Jumlah" numeral tanpa satuan), D05 FAIL 2 (Tabel 13.5 "3 (satu) Tahun Anggaran", contoh dalam ruleTable), D11 REPORT 22 (sumber gambar tanpa tahun), D17 FAIL 1 dan D18 FAIL 1 (doc.json tidak menandai role identity/closingAction), D20 FAIL 1 (skala Admiralty Tabel 5.4 di bab 5, bukan lampiran), STRUCT-XREF REPORT 20. `benchmarkSafetyOverrides` = `{"DATUM-09":"release"}` (satu-satunya entri blocksIngest yang terpicu benchmark).
- Uji sintetis (skrip scratch, dokumen cacat buatan): cek A (02, 06-12, 18, 20-24, 26, 29, 34, 35) dan D (01, 03-07, 09, 11-13, 15-20) memicu sesuai harapan; override profil/dokumen dan penolakan bekerja; snapshot rusak -> 0 lemparan.

## Keputusan (untuk dicatat controller)
1. Cek di luar registri diberi checkId sendiri, selalu REPORT: `STRUCT-XREF` (rujukan basi §4.2 butir 4) dan `STRUCT-ENFORCEMENT` (override ditolak).
2. Parameter kelas T per tier (P5-46/47/68) dipakai hanya bila `artifact.tier` templat = tier lint; selain itu diturunkan (aktif SERAH), karena resolvedParams templat dihitung dari tier templat.
3. D11 "tanggal berlaku" = REPORT (cek sebagian); caption > 1 kalimat = FAIL. D12 tanpa `chart.purposeGroup` = REPORT. D09 artefak dirujuk (bukan spec inline) = REPORT. D10 tanpa tabel KENDALI = PASS "tidak berlaku". D07 lingkup satu dokumen (total baris vs kolom numeral).
4. Blok `exampleWrongRight` dikecualikan dari audit prosa (D01, D02, D05, D19, D21, XREF): cacat ilustratif disengaja.
5. DATUM-21 rona dihitung relatif kertas -> ink900 interior (zebra15 = 15 %); garis < 0,18 mm = sz <= 4.

## Permintaan lintas pemilik (file_requests.md)
- ParamDef `lint.enforcementOverride` (kontrak params, kelas K) agar profil S95 lolos resolveParams.
- S48/S44: pakai `isIngestBlocking` dari modul ini untuk 422 blocksIngest agar override D-34 berlaku.

## Temuan
- D17/D18 FAIL pada benchmark karena ekstraksi S93 tidak memberi `role`; bukan blocksIngest, hanya status rilis TERBIT. Kandidat profil S95 atau tag S93.
- D05 pada Tabel 13.5 adalah contoh cacat di ruleTable (bukan exampleWrongRight): positif palsu terdokumentasi.
