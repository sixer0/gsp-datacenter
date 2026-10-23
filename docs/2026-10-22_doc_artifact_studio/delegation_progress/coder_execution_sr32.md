# SR-32 coder-execution: benchmark v2 (doc.v2.json, template.v2.json, preset, skrip)

Status: needs-review (2026-10-23). Skills: dry-run-verify-fix. Belum tercapai: 4544 unit (render v2 = 4542; judul + catatan daftar isi tidak punya kenop templat, permintaan SR-05/SR-08) dan dry-run seed SR-36 (Δ seed masih hanya P4S-13).

## Berkas
- Baru: `benchmark/manual000/doc.v2.json` (sha 9c77439b…), `template.v2.json` (882057c5…), `datum-manual-000.preset.json` (3cefdc83…; mediasi controller SR-07), `benchmark/extract/convert_v2.ts` (`--check` = jalankan ulang tanpa tulis), `verify_v2.ts` (G1-G4), `units_v2.py` (unit S96 dua DOCX + grid + run simbol).
- Ubah: `benchmark/manual000/template.json` HANYA +1 kunci P4S-13 nilai BM (izin controller, mediasi SR-16); sha e4edfe51… -> 930a26ed…; DOCX v1 sesudah sematan 53485ebc… (= SR-16).

## Isi
- doc.v2 = `adaptV1(doc.json, "strip", false, {tocMixed:true})` + `preset` per tabel (72 jenis/94 tabel; 3 lembar kendali bernama semantik, sisanya `m000-tNN`) + run label "SUMBER"/"KUNCI" pertama dibuang (115 + 2). 42 run glif dibuang adaptor; mesin mendeteksi dari `render.run.symbolGlyphs` = ■◈◇△σ○≥≤→.
- Preset: 42 override informatif template.json (42 no-op + 4 kelas T dibuang) + 10 tambahan: table/chart/diagram.widthClass full, chapter.kicker.pattern "Bab {n}", render.table.layout.widthTw 9412, columnProfiles (72), symbolGlyphs, symbol.sheet.fit true, chart.composite.gapMm 4,3; roleFormats 70 + rail.mark.labelRunByMark; `meta.intendedDelta` (4 kunci, alasan + bukti BM). Templat: preset ref + 7 esensial global (dibaca dari preset) + 6 slot (toc MIXED; tanpa references/ruleIndex); lanjutan 0.

## Bukti
- `verify_v2.ts`: 6/6 PASS. G1 doc v2 VALID, 0 isu, DISPLAY_FIELD 0. G2 templat VALID, 6 slot. G3 4484 teks inline sama berurutan. G4 baseline KT-5 seperti SR-36 (template.json + nilai T terukur): kunci lama 754, diff = tepat Δ 4 kunci (render.table.layout, chapter.kicker.pattern, chart.output.widthMm, diagram.widthMm), proyeksi 750 kunci lain 1632e00a… kedua sisi; roleFormats beda hanya rail.mark; 6 slot berlapis SR-06 sha sama.
- render_cli DOCX v1/v2 + `units_v2.py`: v1 4544 = BM; v2 4542, 2 hunk = "Peta Isi Manual" + catatan TOC; grid tabel 153 = v1 = BM; run simbol 104 = 104 = BM 104; tblW v2 lebih dekat BM (29 beda vs 105 v1).
- Bukti BM Δ: wp:extent bm-fig-17..21 = 166,00 mm; diagram 6/7 = 166 mm (bm-fig-25 = 100); kicker BM "Bab 1".."Bab 17", "Lampiran A".."D".
- Runner `--schema v2 --dry-run`: exit 0, preset berkas dimuat, aset 79/79; substitusi spec S94 -> doc INVALID 60 isu (SR-34).
- tsc repo exit 0; eslint 2 skrip exit 0; py_compile + `--help` exit 0; `convert_v2.ts --check` SAME x3. Seed dry-run TIDAK dijalankan (main menulis StudioSectionType di luar --dry-run; Δ seed belum memuat 4 kunci -> pasti gagal).

## Keputusan untuk controller
1. Preset Manual 000 = berkas `datum-manual-000.preset.json`; sumber SR-36 `--import-manual000-v2`, Δ dibaca dari `meta.intendedDelta`.
2. Δ dipertahankan dengan bukti BM (kicker, lebar chart/diagram) dan D-152 (layout), bukan disamakan ke baseline.
3. `preset` tabel dan pembuangan label aparatus dilakukan konverter (adaptor membuang widthTw, mempertahankan label).

## Permintaan (file_requests.md, 5 baris SR-32)
SR-05/SR-08 kenop judul/catatan TOC (blocking 4544); SR-36 Δ dari meta.intendedDelta (blocking dry-run seed); SR-34 pemetaan spec S94 ke v2 (blocking run v2); SR-09 buang label aparatus; SR-08/SR-05 kelas lebar image/symbolSheet (RK-10).
