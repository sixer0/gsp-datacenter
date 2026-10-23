# SR-36 — seed preset + kerangka (coder-execution)

Status: complete (flag --presets-and-skeletons dijalankan di gsp_agent_hq_v21; --import-manual000-v2 disiapkan, belum ditulis ke DB).
Berkas: prisma/seed-studio.ts (satu-satunya kode). Baseline: test/sr36_baseline_{datum_kanonik_v5,datum_gsp_v1,datum_manual_000_v2}.json.
Laporan: implementation/sr36_seed_presets_skeletons.md.

Hasil DB v21 (run 1, exit 0): preset datum-kanonik-preset v1 (0 sematan) dan datum-gsp-preset v1 (42 kunci: esensial 3, lanjutan 15, internal 10, turunan-acuan 14; 70 roleFormats; restricted false);
datum-kanonik v6 dan datum-gsp v2 = rujukan preset + 8 esensial global + kerangka 7 slot (17 esensial slot); lanjutan tersisa 0 (templat dan slot).
Penjaga §8.2: Kanonik proj(v6, 723 kunci v5) = 38c776de... = paramsSha256 v5 (persis). GSP proj(v2, 721 kunci v1 \ P4S-13) = aa942872... = baseline; Δ P4S-13 [nomor dokumen, nomor lembar] -> BM 5 nilai; 0 beda di luar Δ.
Run 2: semua "unchanged" (preset dan templat), jumlah versi tetap. Run tanpa flag: kanonik "preset-managed", registryInSync true (tidak ada versi sinkron baru).
Nilai efektif ke-7 slot = nilai templat (0 beda, kedua templat).
Penjaga: tsc 0 galat di seed (repo 2 galat milik baris lain: benchmark/extract/convert_v2.ts SR-32, services/submit/pipeline.ts); eslint seed 0.

Keputusan untuk controller:
1. KT-11 vs penjaga: GSP DATUM render.toc.mode tetap "static" (baseline v1) karena Δ hanya P4S-13; KT-11 menyebut "field" -> perlu putusan (ubah = Δ bertambah).
2. Sinkron otomatis kanonik (ensureCanonicalTemplate syncRegistry) dihentikan bila kanonik berkerangka; perubahan registri berikutnya = versi preset DATUM Kanonik baru (keputusan proses).
3. --import-datum-gsp / --import-benchmark dilewati (warn) bila templat sudah berkerangka.
4. --import-manual000-v2 TIDAK membuat revisi dokumen 000 (area seed = tabel templat); SR-38 perlu jalur dokumen (R14 templateVersion + kiriman) -> putusan.
Temuan: berkas SR-32 (template.v2.json, datum-manual-000.preset.json) dan template.json berubah selama baris ini. Satu run --import-manual000-v2 tanpa --dry-run terjadi tak sengaja: penjaga gagal -> rollback, 0 baris tertulis (dicek). Dry-run terakhir: DB = mode berkas (49feb89b...), preset terbatas, kerangka 6 slot = berkas; beda KT-5 di luar Δ: render.table.layout (widthTw 9412), chapter.kicker.pattern ("Bab {n}" vs "BAB {n}"), chart.output.widthMm, diagram.widthMm -> SR-32/SR-38.
