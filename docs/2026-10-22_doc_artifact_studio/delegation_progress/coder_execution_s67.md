# Catatan baris S67 (coder-execution)

**Status:** complete. Skills: backend-execution, dry-run-verify-fix. Klaim: `S67 scripts/parity/run/**` (file_claims.md).

**Berkas (baru, `scripts/parity/run/`):** `render_cli.ts` (H01), `run_parity.ts` (H05), `lib/render.ts` (pipeline murni tanpa DB), `lib/template.ts` (profil berkas / slug luring `datum-kanonik`, `datum-manual-000`), `lib/fixtures.ts` (penemuan korpus menurut isi + `--only` glob), `lib/python.ts` (spawn VENV `-I -B` argumen-array, cwd = temp OS, timeout + `taskkill /T /F`), `lib/summary.ts` (laporan MD), `lib/common.ts` (argumen ketat, log JSONL tahan lama, akar repo).

**Antarmuka:** H01 persis §11 + opsi aditif `--asset-index`, `--with-canonical-assets`, `--no-validate`; `render_report.json` memuat `files[{format,path,sha256,bytes}]`, `lint`, `job{status,errorCode}`, `durationMs` + `formatStatus`, `notReady`, `errors`, `validation`, `engineLog`; log `render_log.jsonl`. Exit 0/1/2/3 sesuai §11 (normalisasi gagal = 2; stub = job NOT_READY exit 1). H05 persis §11 + `--formats`, `--template`, `--python`, `--timeout-ms`, `--strict`; per fixture `fixture_report.{json,md}`, agregat `summary.{json,md}`, `harness_log.jsonl`.

**Penjaga (bukti segar):** `npx tsc --noEmit -p tsconfig.json 2>&1 | grep scripts/parity/run` kosong (grep exit 1; 25 galat repo di luar area: 21 pra-ada + 4 `engine/chart/family-k1/common.ts`); `npx eslint scripts/parity/run` exit 0; `render_cli.ts --help` exit 0; `run_parity.ts --help` exit 0; salah pakai = exit 2 (opsi asing, fixture dir tidak ada).

**Uji asap (scratch, bukan repo):** CLI simbol/lembar/diagram/gambar SUCCEEDED; chart komposit benchmark NOT_READY (`engine/chart/family-p1` stub saat itu); dokumen mini (bab 1 benchmark) DOCX+PDF soffice+HTML SUCCEEDED. Runner atas korpus scratch 14 fixture: DF-01 PASS (registri menolak), SVG CA P-01/P-02/P-11/W-02, DG, SY PASS; korpus nyata S63 terdeteksi 107 fixture (manifest.json dilewati).

**Keputusan:**
- K1 Node dipanggil di dalam proses runner (fungsi yang sama dengan CLI; satu browser untuk semua fixture), bukan spawn per fixture.
- K2 Kelas chart = `parityClass` ref_report S65, registri sebagai cadangan (beda dicatat). CC/komposit: snapshot beku `<stem>.snapshot.svg|png` bila ada, selain itu vonis lint Node. drawn=false: PASS hanya bila Node menolak `CHART_KIND_NOT_DRAWN`. HT = DIAGNOSIS + lint (tanpa acuan Python).
- K3 `expectHeightMm` (permintaan S66) diteruskan untuk CB1 dan CB2, HANYA format svg (compare.py menolak kunci itu untuk png, exit 2). Sumber: `CHART_BY_CODE` bila memuat medan tinggi, selain itu `ref_report.referenceCanvasMm.height` (= tinggi_mm registri PC) karena `ChartDef` tidak punya medan tinggi.
- K4 Aset raster dokumen di-inline sebagai `dataBase64` (sumber: `<dir doc>/figures/index.json` otomatis, `--asset-index`, atau `path` relatif dir doc); tidak menulis penyimpanan aset. jobId soffice = `cli-<uuid>`.
- K5 Exit runner: 1 bila ada FAIL/NODE_ERROR/REF_ERROR/COMPARE_ERROR; NOT_READY tidak menggagalkan kecuali `--strict`.

**Temuan (untuk register):**
- T1 `benchmark/manual000/doc.json`: DOCX dan HTML gagal `BY_CONSTRUCTION_FAILED` "D-4.1 ... blok derivasi tanpa satu pun baris result()" (S16/S19/S22 lawan isi S93); setelah derivasi dibuang, DOCX gagal `SCHEMA_INVALID` "isi blok pembungkus appendix tidak sesuai bentuk kontrak" (S18), HTML lolos. Berdampak ke S97/S81.
- T2 PNG Node 2-3 px lebih besar dari acuan (P-01 578x1509 lawan 581x1512; iec:breaker 281 lawan 283): gerbang `size` PNG CA/DG/SY gagal (S25 `rasterizeSvg` lawan S65 raster).
- T3 `services/ingest` dan `services/images` mengimpor `@/lib/prisma` secara transitif (PrismaClient dibuat malas; CLI tidak memanggil fungsi berkueri). Kandidat entri bebas-Prisma dari S48 (tidak blocking).
- T4 Paritas dokumen mini: ref_doc S64 status `partial` 3 halaman lawan Node 7 halaman (untuk S76/S77).

**Permintaan lintas pemilik:** tidak ada yang blocking. Review recommended (S86): `scripts/parity/run/**`.
