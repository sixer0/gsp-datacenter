---
row: FIX-T
date: 2026-10-23
agent: coder-execution
source: D-277 (loop perbaikan siklus 3), test/09_benchmark_manual000.md M-2
status: complete
---

# FIX-T: 182 peringatan `preset tidak dikenal` (engine/docx/tables)

## Diagnosis (akar)

- Yang dicari: `b.preset` = `m000-t01..t72` (69 unik terlihat di log, 91 tabel per run x 2 run resmi+raster = 182; termasuk `checklist: m000-t65`). Sumber nilai: medan `preset` tabel di `doc.v2.json` (SR-32: 94 tabel, 72 jenis) = jenis tabel semantik per D-166 KC-6 / D-139, bukan preset tampilan.
- Jalur v2: compose `services/compose/blocks.ts:194-224` (`columnProfile`) mencocokkan preset dengan `render.table.columnProfiles` templat (R-52, preset `datum-manual-000.preset.json`, 72 profil) dan mengisi `widthTw` per kolom; lalu meneruskan `preset` ke blok v1. Mesin `engine/docx/tables/render.ts:512-513` -> `presets.ts resolvePresetDefaults` hanya mengenal 8 preset registerTable + 3 financialTable, sehingga setiap preset profil = "unknown" -> peringatan.
- Akibat visual: TIDAK ADA. Lebar sudah diterapkan compose. Bukti sebelum perbaikan (official2): 94/94 tabel `doc.verbatim.json` widthTw = gridCol DOCX persis (skrip baca-saja `gridcmp.py` di scratchpad). Peringatan = derau, bukan jatuh ke bawaan; tidak memengaruhi BM4.
- Prasyarat terverifikasi: mesin melihat `render.table.columnProfiles` di `tpl.params` (snapshot norm/v2 memakai parameter dokumen untuk semua unit, log "parameter dokumen dipakai untuk semua unit").

## Perbaikan (resolusi preset, area tables saja)

- `src/lib/studio/engine/docx/tables/presets.ts`: `resolvePresetDefaults(type, preset, profileNames?)` -> token yang menjadi kunci profil kolom masuk `profiled` (sah), bukan `unknown`. Preset mesin (registerTable/financialTable) tetap memberi default peran walau juga berprofil. Tanpa `profileNames` = perilaku lama.
- `src/lib/studio/engine/docx/tables/render.ts`: `columnProfilesOf` (pObj `render.table.columnProfiles`), `profileNamesFor` (kunci profil + token preset utuh yang berprofil, cocok dengan pencocokan string utuh compose; `Object.hasOwn`, kunci prototipe bukan profil), `checkProfileApplied` (peringatan BARU yang bermakna: profil ada tetapi tabel tiba tanpa lebar lengkap karena jumlah kolom beda -> lebar otomatis). Preset tanpa profil dan tanpa makna mesin tetap `preset tidak dikenal` (bukan diturunkan ke debug: itu celah templat yang nyata).
- compose/blocks.ts dan params TIDAK diubah.
- Uji baru `tests/unit/studio/renderers/docx-table-preset-profile.test.ts` (7 kasus).

## Bukti

| Cek | Perintah | Hasil |
|---|---|---|
| Peringatan preset sebelum/sesudah | `npx tsx benchmark/harness/run/run_benchmark.ts --schema v2 --official --with-diagnosis-raster --out C:/Users/TRIAL/AppData/Local/Temp/fixt_run` (argv = official2) | official2: `preset tidak dikenal` 182, total warn 252; sesudah: 0, total warn 70; `profil lebar kolom` 0; warn lain identik (diff hanya id run) |
| Lebar kolom vs BM | `gridcmp.py` (DOCX gridCol vs `doc.verbatim.json` widthTw) | sebelum 94/94 exact, sesudah 94/94 exact (mis. revisionHistory 567/1134/1587/5216/907, verificationChain 680/1927/4762/2041) |
| DOCX v2 | sha256 | resmi `0d4b25e19687dc01…` = official2; raster `c64c9a4586cc3b81…` = official2 (byte-identik) |
| BM1 / grid | `compare/bm_report.json` | BM1 4544/4544; tabel 151 + 2 bersarang = 153 `<w:tbl>` = BM 151 + 2; langkah semua OK; vonis FAIL (BM3/BM4 pra-ada, FIX-B2) |
| DOCX v1 | `npx tsx scripts/parity/run/render_cli.ts --doc benchmark/manual000/doc.json --template benchmark/manual000/template.json --formats docx --out C:/Users/TRIAL/AppData/Local/Temp/fixt_v1` | `53485ebc1eddd145…` tetap |
| tsc repo | `npx tsc --noEmit -p tsconfig.json` | 0 galat di luar `benchmark/out/fixb2/baseline_src/**` (149 galat, salinan sumber baseline milik baris FIX-B2 paralel, bukan FIX-T; run pertama sebelum salinan itu ada: exit 0) |
| eslint area | `npx eslint src/lib/studio/engine/docx/tables tests/unit/studio/renderers/docx-table-preset-profile.test.ts` | exit 0 |
| vitest | `npx vitest run tests/unit/studio/renderers` | 9 berkas, 143 lulus, 0 gagal |

Catatan lingkungan: run harness dengan `--out` di scratchpad (path panjang) gagal `spawn ENOTCONN` pada langkah compare (cwd > MAX_PATH Windows); dengan path pendek berjalan normal. Bukan regresi kode.

## Issues & Decisions

| Issue / Decision | Resolution |
|---|---|
| Peringatan salah atau preset opsional? | Preset profil = jenis tabel sah (KC-6); dikenali, bukan diturunkan ke debug. Preset tanpa profil tetap warn. |
| Terapkan profil juga di mesin? | Tidak: compose pemilik (D-166, header blocks.ts); mesin hanya melaporkan bila profil gagal diterapkan. Keluaran byte-identik. |
| tsc repo merah oleh `benchmark/out/fixb2/baseline_src` | Dilaporkan ke controller (pemilik FIX-B2; folder sebaiknya dikecualikan dari tsconfig atau dihapus setelah dipakai). |
