# FIX-6 coder-execution: F-059 bold condensed kanonik, F-058 status rilis lint, F-S71-2 derive kelas T (2026-10-23)

Status: needs-review (kode selesai dan terverifikasi; 2 uji milik baris lain perlu dimutakhirkan + 1 delta kontrak aditif perlu ratifikasi).

## F-059 (alias keluarga + render.ts)
- Pilihan: alias relabel (bukan mengganti nama kanonik; D-31 dipertahankan: `type.face.condensed` kanonik = "IBM Plex Sans Condensed", profil Manual 000 = "IBM Plex Sans Cond").
- `engine/docx/fonts/rename.ts` (baru): `renameFontFamily` = aturan `relabel()` S99 (nameID 1/3/4 di platform 3 dan 1; 2 dan 6 dipertahankan; tabel lain byte-identik; checksum tabel + `head.checkSumAdjustment` dihitung ulang). Murni, deterministik.
- `relabel.ts`: `RELABEL_ALIAS_FACES` (2 entri: "IBM Plex Sans Condensed" bold/boldItalic dari wajah S99 "IBM Plex Sans Cond"), sha256 terkunci `9c8d4828...` / `d80d29c0...`; `relabelAliasSource` membangun sekali ke cache `STUDIO_FONT_CACHE_DIR` atau `<os.tmpdir()>/gsp-studio-fonts/relabel/<sha>.ttf` (tulis sementara + rename atomik), sumber salah sha atau hasil beda sha = BY_CONSTRUCTION_FAILED. Regular/italic kanonik sudah bernama "IBM Plex Sans Condensed" -> tidak dialiaskan.
- `plan.ts` `relabelled()`: bila tidak ada wajah S99 bernama persis, pakai alias; galat I/O cache dicatat di `relabelFallbacks`.
- `params/render.ts:74-75`: entri R-08 kanonik "IBM Plex Sans Cond" -> "IBM Plex Sans Condensed" (= `color-type.ts:127`). Profil benchmark menimpa R-08 seluruhnya (template.json:898-945) -> tidak terdampak.
- Validasi wajah hasil: fontTools `TTFont(checkChecksums=2)` + dekompilasi semua tabel OK; nama "IBM Plex Sans Condensed"/"Bold", w 700, fsSelection 0x120/0x121, PS `IBMPlexSansCond-SemiBold(Italic)`.

## F-058
- `engine/lint/scan/runner.ts`: `faultedModulesFor` (modul crash yang punya cek berlaku untuk tier dan tidak dilaporkan pihak lain) -> `releaseStatusFor(..., faulted)` tidak pernah PASS (FAIL tetap FAIL, selain itu NOT_RUN); banner menambah "CACAT INSTRUMEN: modul engine/lint scan (...), structure (...) gagal; ...". Detail NOT_RUN per cek tetap memuat galat modul.

## F-S71-2
- `params/figure.ts` P9-04/38/51 + `derive` (`diagramClassification`, `diagramLatticeSnap`, `diagramLineSpacing`); `engine/tokens/grid.ts`: 3 DERIVERS (fungsi sama dengan KEYED_DERIVERS lama), fallback keys, urutan di akhir DERIVE_ORDER (setelah latticeX/Y, sama dengan urutan KEYED lama); KEYED_DERIVERS kini hanya D-33 margin bawah.
- DELTA KONTRAK di luar area: `contract/types/params.ts` union `DeriveFnId` + 3 id (aditif; ada di file_requests, perlu ratifikasi).

## Bukti
- Benchmark (render_cli + salinan awal `doc.json` sha 3967f050 = `doc.verbatim.json`, + salinan awal `template.json` sha 76b2e5ed; `fix6/bm_base{1,2}` sebelum, `fix6/bm_after{1,2}` sesudah): DOCX sha `6515797f3f8dd292...` keempatnya identik (= D-109).
- Fixture kanonik (render_cli docx,pdf,html, `fix6/fx/*`): 4/4 SUCCEEDED; release lint sama dengan INT-S (NOT_RUN, NOT_RUN, FAIL, FAIL). fontTable tables: "IBM Plex Sans Condensed" embedRegular/Bold/Italic/BoldItalic (sebelumnya Regular/Italic saja).
- PDF pymupdf (karakter per fon), sebelum (INT-S `ints/fx`) -> sesudah: memo Bold 236 -> SemiBold 236; tables Bold 1008 -> SemiBold 1008; serah Bold 1328 -> SemiBold 1328; terbit Bold 1175 -> SemiBold 1180. "Bold" = fon terpasang di mesin; "SemiBold" = wajah tertanam berlabel (PS name dipertahankan). Regular sama (439/2527/1412/2043).
- vitest (engine-core + renderers + docx-fonts-family + docx-fonts-alias): 421/425 lulus. docx-fonts-embedded 9/9 (F1 hijau), lint-runner-fault 4/4 (baris 68 hijau tanpa diubah), docx-fonts-family 3/3, alias 4/4 (baru). Gagal: (1) tokens.test.ts:35 kunci daftar pengecualian -> kini [] (diharapkan, file_requests); (2) docx-determinism jangkar e9d08818 -> a9e3fac6: `word/fonts/*`, fontTable, rels dari FIX-6 + `document.xml` (baris total tabel, bukan FIX-6) (file_requests); (3) html-css-csp C0 = F-S72-2 (FIX-2); (4) soffice smoke sisa folder `s72-smoke-*` dari runner paralel lain (s72-smoke-8660 muncul 02:20) -> diulang terisolasi: 3 berkas 26/26 lulus.
- tsc repo penuh: 11 galat, semuanya `benchmark/harness/run/selftest_verdict.ts` (area FIX-5 yang sedang berjalan); 0 di area lain. eslint area FIX-6: exit 0.
- Tidak menyentuh DB, HKCU, port 9011/9021.
