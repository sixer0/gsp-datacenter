# FIX-SEED: determinisme seed preset/kerangka (D-258 N2, N3)

Status: needs-review (N2 selesai dan terverifikasi; satu putusan controller terbuka untuk v21: R-65 `image.rasterDpi`, lihat butir 4). Tanggal 2026-10-23. Skill: diagnosing-bugs, dry-run-verify-fix.
Berkas: `prisma/seed-studio.ts` (2d36d8e0... -> f8e8e45e...; ditulis lewat salinan kerja + rename). DB uji: `gsp_agent_hq_v21_seedtest` dibuat dari 7 migrasi (`prisma migrate deploy`, DATABASE_URL hanya di lingkungan proses anak), dihapus di akhir (`pg_database` kini: v21, v21_shadow, v21_uji). `.env` tidak diubah, URL tidak dicetak; `_uji` tidak disentuh.

## 1. Akar N2 (reproduksi di DB segar: exit 1, beda `symbol.sheet.fit`, `table.widthClass`, `table.columnWidthSumMm`)

- (a) Kunci keputusan tanpa Δ. Preset GSP memutuskan `symbol.sheet.fit` true (D-165 KT-7) dan `table.widthClass` full (research/09 §8.1), tetapi Δ hanya `[P4S-13]` (`seed-studio.ts:484-485` lama). Di v21 baseline `datum-gsp` v1 dibuat dengan registri lama (721 kunci, tanpa kedua kunci) sehingga keputusan itu tidak pernah dibandingkan; di DB segar v1 diimpor dengan registri kini (781 kunci) dan memuat nilai bawaan false / text.
- (b) Baseline turunan kehilangan nilai terukur. `template.json` menyatakan `table.columnWidthSumMm: 166` (BM L4029); P5-14 kini kelas T, jadi pembaca profil membuangnya (`droppedDerived` = grid.textColumnMm, page.sizeMm, table.columnWidthSumMm, type.baselinePt) dan v1 segar menyimpan turunan 128. Di v21 P5-14 masih kelas K: v1 menyimpan 166 (override 166). Penjaga membandingkan 166 (baru, dari widthClass full) dengan 128.
- Bukan: perbandingan terhadap versi yang tidak ada; Kanonik lolos persis di kedua DB.

## 2. Perbaikan (penjaga tidak dilonggarkan)

- Δ GSP = entri beralasan `{key, reason}`: P4S-13 (D-151/KT-6), `symbol.sheet.fit` (KT-7), `table.widthClass` (§8.1/D-162). Penjaga baru `deltaValueMismatch`: nilai baru kunci Δ wajib = nilai keputusan (Δ bukan pengecualian bebas). Turunan `table.columnWidthSumMm` TIDAK masuk Δ.
- `measuredBaselineCorrections`: bila `provenance.meta.derivedFrom.file` = `benchmark/manual000/template.json` DAN sha berkas kini = sha tercatat, nilai yang dinyatakan profil untuk kunci yang dibuang sebagai T menjadi baseline kunci itu (analog KT-5 `prepareManual000V2` dan `verify_v2.ts` G4). Sumber berubah = tanpa koreksi. DB segar: 1 koreksi `table.columnWidthSumMm` 128 -> 166; v21: `source-changed` (v1 sha 76b2e5ed, berkas kini 930a26ed), 0 koreksi.
- Manual 000 (`--import-manual000-v2`) di DB segar gagal dengan pola yang sama (7 kunci struktur dibandingkan dengan bawaan registri karena tanpa baris lama legacyKeys = semua kunci). Kunci lama kini = definisi `verify_v2.ts` G4 (registri - 21 kunci `PARAMS_STRUCTURE` + `grid.marginBottomMm`, 761 kunci), tidak bergantung isi DB; kunci struktur tetap terkunci oleh `equalsFileMode`. v21: `legacyRowKeysOutsideG4` = [] (superset dari 721 kunci baris v2 = lebih ketat).
- `--dry-run` kini tidak meng-commit apa pun: upsert section type dan sinkron kanonik dilewati; digabung dengan `--import-benchmark/--import-datum-gsp/--import-samples` ditolak (impor itu menulis di luar transaksi). Penjaga DB menerima `gsp_agent_hq_v21_seedtest`.
- Uji negatif (sementara, dipulihkan `cmp`): `table.widthClass` "text" -> penjaga GSP gagal pada `table.columnWidthSumMm` (exit 1). Bukti turunan tetap dibandingkan.

## 3. N3 (Manual 000 v3 vs baris DB v2, 4 kunci di luar Δ)

Kunci (v21 baca-saja, baris v2 dibuat 2026-10-22T11:30Z -> berkas/v3): `device.registerBlock.boldFields` [nomor dokumen, nomor lembar] -> 5 medan BM; `org.entityName` "PT GEMILANG SATRIA PERKASA" -> "PT Gemilang Satria Perkasa"; `render.cover.mode` explicit -> auto; `render.spacer.autoMode` none -> template.
Putusan teknis: seed BENAR, Δ preset TIDAK perlu mencakupnya. Baseline penjaga Manual 000 = `template.json` pasca-RT-01 (KT-5, D-165), bukan baris DB; keempatnya = perubahan baseline yang sudah diputuskan sesudah v2 diimpor, sama di baseline dan v3: P4S-13 BM (D-151, D-216 izin controller); RT-01 konten-saja (D-119: sampul dan spacer otomatis dari templat, kepala berjalan dari meta); nama entitas = teks kepala berjalan BM (`doc.verbatim.json` runningHead left "PT Gemilang Satria Perkasa ·" 21 kemunculan; huruf besar hanya kolofon 1x). Render v2 = BM 4544 unit (D-224) dengan nilai ini. Memasukkannya ke `meta.intendedDelta` akan menggagalkan `verify_v2` G4 (diff harus = Δ) dan melemahkan penjaga. Seed kini melaporkan `baseline.legacyRowDrift` (informasi, tidak menggagalkan): v21 = tepat 4 kunci tsb.

## 4. Bukti

- DB segar, kode akhir (log `51..60_final.log` di scratchpad): `--import-datum-gsp` 0, `--presets-and-skeletons` 0 (Kanonik exact 84b13a14..., GSP proj luar Δ 16204e0b... kedua sisi, unresolved []), `--import-manual000-v2` 0 (761 kunci, proj f7784354... kedua sisi, equalsFileMode, params 40598314...), `--import-samples` 0; jalan kedua: datum-gsp dilewati (warn berkerangka), preset+templat 3/3 `unchanged`, sampel `unchanged`; dry-run gabungan 0 (3/3 ok); `--dry-run --import-datum-gsp` ditolak exit 1. Varian dengan `--import-benchmark` (baris lama Manual 000 di DB segar): exit 0, jalan kedua unchanged, params 40598314... sama (deterministik antar keadaan DB).
- v21 dry-run `--presets-and-skeletons`: exit 0, Kanonik v6 / GSP v2 + preset `unchanged`, penjaga ok (38c776de... = v5; aa942872... kedua sisi = SR-36). Hitungan v21 sebelum = sesudah (6 templat, 14 versi, 40 slot, 49 param slot, section type updatedAt 2026-10-22T17:15:28.738Z) = tidak ada commit.
- v21 dry-run `--import-manual000-v2`: exit 1 (rollback, 0 commit) HANYA karena `image.rasterDpi` (R-65, FIX-FIG D-257): datum-manual-000 v3 `unchanged` dibuat sebelum R-65 (780 kunci); `registryDrift.addedSinceVersion` = [{image.rasterDpi, fileMode 150, registryDefault 150}], `equalsFileModeOnStoredKeys` true. Kode lama juga gagal di sini (syarat `fileSha === paramsSha256` tidak diubah baris ini). PUTUSAN CONTROLLER: (a) versi baru datum-manual-000 v4 (+ preset) yang memuat R-65 lewat seed nyata di v21; (b) terima drift registri (pembaca R-65 jatuh ke bawaan registri, `engine/docx/figures/raster-width.ts:25`) dengan aturan eksplisit. Baris ini tidak memilih.
- tsc `--noEmit --incremental false` seluruh repo exit 0 (0 galat); eslint `prisma/seed-studio.ts` exit 0.

## 5. Catatan

- Sampel `serah-handover` ditolak semua templat kandidat oleh DATUM-09 (`/chapters/0/sections/0/blocks/4`) sejak berkas lint `engine/lint/scan/checks.ts` dll. berubah di pohon kerja (baris lain, FIX-L) di tengah baris ini; jalan sebelumnya created + render SUCCEEDED. Seed tidak melonggarkan aturan; jalan ulang konsisten `rejected`.
- Preset GSP di DB segar 43 kunci lapis vs 42 di v21: baseline berbeda (v1 registri kini vs lama), bukan ketidakdeterministikan.
- Penulisan berkas: dua suntingan awal langsung di tempat (Edit), sisanya salinan kerja + `mv`; tidak ada pembaca serentak berkas seed.
