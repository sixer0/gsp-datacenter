# RT-01 coder-execution: doc.json benchmark konten-saja, tampilan milik templat (D-119), 2026-10-23

Status: needs-review (kode konsisten + bukti asap; iterasi benchmark DIHENTIKAN atas instruksi user lewat controller, sehingga gerbang D-17 untuk keadaan kode akhir belum diukur ulang).

## Hasil
- `benchmark/manual000/doc.verbatim.json` = salinan doc.json lama (sha256 3967f050..., 4.338.456 byte, diagnosis).
- `benchmark/manual000/doc.json` = KONTEN SAJA, 1.135.884 byte (-73,8 %), VALID studio.doc/v1. Hitungan kunci: setup 0, format 0, layout 0, style 0 (ListBlock.style = jenis daftar bullet/number 14, wajib skema, bukan tampilan); semua `x.*Format`, face/szHalfPt/color/caps/spacingTw run, border/margin/lebar sel, cantSplit/repeatHeader, spacer = 0. Verbatim: setup 29, format 4.484, layout 94, face 5.474, color 10.139.
- Bab 1 vs bab 2: kunci identik (`key, kicker, partId, sections, title`; seksi `blocks, number, title`), hanya isi berbeda (teks kicker/judul/blok).
- Ekstraktor: `content_only.py` (baru) + `extract_manual000.py --out` (konten-saja, gagal bila tersisa kunci tampilan) `--verbatim-out` (diagnosis); `verify_manual000.py` kini memeriksa doc.verbatim.json (jejak C1-C14). Deterministik: verbatim sha sama dengan S93, trace tidak berubah.
- Bentuk konten: sampul/lembar kendali `mode: auto` + `data` (teks saja), tanda tangan di `front.signature`, pembatas bagian tanpa `body`, TOC tanpa sealBand, rel = `{kind, mark}` / `{kind, text}`, judul seksi `text` (pemisah dari R-33), run hanya `t` + `b`/`i` bila campuran + `faceRole` mono/symbolGlyph, `meta.subject` "Manual DATUM" (diambil sekali dari kepala berjalan bab 1).
- Templat (87 override, 70 peran, tanpa nilai per bab): `render.spacer.autoMode` template, `render.cover.mode` auto, `render.run.strong` {color 101418}, `render.run.symbolGlyphByRole` (prosa 17, aside 15, sel teks 14, sel mono/SUMBER/KUNCI 12), `org.entityName`, glyphRun methodStatement; setup per jenis unit = `render.section.wrapper|interior` (sudah ada S95), kepala/kaki berjalan dari meta.
- Mesin DOCX (area RT-01): `assemble/index.ts` spacer otomatis peran (opt-in: templat menulis peran spacer.after*), `assemble/bind.ts` pengikatan faceRole/simbol untuk blok tabel/figur/turunan, `blocks/semantic.ts` + `env.ts` run semantik, `rail.ts` warna label tanda dari glyphRun, `wrapper/xml.ts` face XOR faceRole, `wrapper/render.ts` glif symbolGlyph + geometri punggung dari setup templat, `wrapper/formats.ts` lebar teks dari setup templat; `params/render.ts` R-36 `render.run.strong`, R-37 `render.run.symbolGlyphByRole` (default {} = perilaku lama).
- HTML: shell sudah memakai mode kepala/kaki templat bila unit tanpa setup (tanpa perubahan); paritas run semantik/spacer HTML diajukan ke FIX-2.

## Bukti
- `npx tsc --noEmit -p tsconfig.json` exit 0 (repo penuh, 0 baris). `npx eslint src/lib/studio/engine/docx/{assemble,blocks,wrapper} src/lib/studio/engine/html/assemble src/lib/studio/params/render.ts` exit 0. `py_compile` 3 berkas OK. `validate_doc.ts doc.json` VALID.
- Asap: `render_cli --doc doc.json --template template.json --formats docx` SUCCEEDED, 0 log error (sha da8b7275...).
- Kompatibilitas: `doc.verbatim.json` + templat baru -> DOCX hanya beda `docProps/app.xml` (Company); document.xml, header/footer, media byte-identik dengan garis dasar D-109 (6515797f...).
- Angka BM terakhir yang sempat diukur (run `co4`, sebelum ukuran glif R-37 dan templat final; soffice render_cli, bm_compare VENV): BM1 PASS 100,0 %, BM2 PASS, BM3 FAIL 99/102 (hlm 18 = F-033 garis dasar; hlm 93-94 = baris E-32 terbungkus karena glif ≥≤→ seukuran inang -> baris P-05 pindah halaman), BM4 PASS 0,987382 (min hlm 93 0,618, hlm 94 0,690; halaman < 0,98 hanya 93, 94). Run sebelumnya `co3` (tanpa pengikatan wajah): BM3 83/102 karena glif tabel jatuh ke fon cadangan (urutan teks PDF). Perbaikan R-37 untuk hlm 93-94 BELUM diukur ulang. Berkas kerja: `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/rt01/`.
- Selisih XML sisa yang diketahui vs garis dasar: label "SUMBER  "/"KUNCI  "/"PROVENANS" tanpa spacingTw 12 (renderer tabel/figur, diajukan), tblW 9411 vs 9412 (diajukan), run nomor seksi "1.1   " satu run (visual sama), NBSP blok register (kosmetik), rule 166 sampul/pembatas dibangkitkan (bukan raster BM).

## Rekomendasi kebijakan kontrak (untuk FIX-1b, TIDAK diterapkan)
1. Ingest pemanggil tak tepercaya: BUANG + REPORT (bukan tolak) `setup`, `format`, `layout`, `headingFormat`, `paragraphFormat`, `runDefaults`, `fieldFormats`, `labelProps`, `colsTw`, `cellFormats`, `signRowFormat`, sel `widthTw/borders/marginsTw/shading/vAlign`, baris `cantSplit/repeatHeader`, run `face/szHalfPt/color/caps/smallCaps/spacingTw/u/vertAlign`, `x.*Format`; pertahankan teks, struktur, `b`/`i`/`faceRole`/`field`, `columns[].role/widthTw`, geometri figur. Temuan REPORT per pointer (mis. `DOC_DISPLAY_PARAM_STRIPPED`), dokumen tetap dirender dengan tampilan templat.
2. Kendali per templat kelas K `ingest.inlineFormat`: `strip` (bawaan) | `reject` (422, tier TERBIT/SERAH ketat) | `allow` (hanya ADMIN/harness: diagnosis verbatim).
3. Skema: tandai medan di atas `deprecated: true` (anotasi 2020-12) di v1, hapus di v2; jadikan SpacerBlock usang (ganti `render.spacer.autoMode`), `Section.numberSeparator` usang (R-33).
4. Kontrak RoleFormat delta S03-d1 harus diterima validator profil (lihat file_requests).

## Keputusan untuk dicatat controller
- K1: tampilan run semantik lewat 2 parameter renderer baru R-36/R-37 (aditif, bawaan {}), bukan medan RoleFormat baru (kontrak milik FIX-1).
- K2: pengikatan wajah/ukuran simbol di perakit (`assemble/bind.ts`) = solusi sementara atas serializer paket yang tidak menghormati face XOR faceRole; cermin aturan peran sel tabel (tanpa inferensi numerik/preset) - dihapus setelah FIX-2.
- K3: warna label tanda rel = warna glyphRun eksplisit templat (labelRunByMark ditolak validator profil).
- K4: `columns[].widthTw/role/align` dipertahankan sebagai struktur tabel (proporsi kolom bergantung isi tiap tabel, tidak dapat menjadi nilai templat tanpa nilai per tabel); `align` dibuang bila sama dengan turunan peran.
- K5: `meta.subject` diisi "Manual DATUM" (label kepala berjalan; juga mengisi dc:subject).

## Temuan item 8 (bukan area RT-01)
- `src/components/studio/section-composer/skeleton.ts:195` menulis `setup: { header, footer }` per bab.
- `tests/parity/fixtures/doc/doc_serah_handover.json:67,98,131,534,1127,1663`, `doc_nota_tables.json:24,837`, `doc_terbit_report.json:96` membawa setup/format/layout inline (fixture kompatibilitas).
- `docs/STUDIO-AGENT-GUIDE.md`, playground, document viewer: tidak ditemukan parameter tampilan per bab.

Review direkomendasikan: `src/lib/studio/engine/docx/{assemble,blocks,wrapper}/**`, `src/lib/studio/params/render.ts`, `benchmark/extract/content_only.py`.
