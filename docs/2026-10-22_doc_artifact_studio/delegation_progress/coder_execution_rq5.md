# RQ-5 coder-execution: paritas HTML aturan konten-saja RT-01 (D-138, D-141), 2026-10-23

Status: complete. Masukan: file_requests.md RT-01 (html/**), RT-01 coder_execution_rt01.md, D-91, D-138, pesan controller (paritas register RQ-6).

## Berkas (area `engine/html/**` kecuali assemble/ dan base/fonts.ts)
- `html/blocks/semantic.ts` (baru): aturan run satu sumber dengan DOCX (`applySemanticRuns`, impor modul murni `engine/docx/blocks/semantic`), `symbolBoundRuns` (padanan `docx/assemble/bind.ts`), spacer otomatis `autoSpacerRole` + `withAutoSpacers` (padanan `docx/assemble autoSpacerRole`; opt-in `render.spacer.autoMode`=template + `para` peran ditulis templat; unit bab/lampiran; bukan sebelum spacer eksplisit; paragraf/assumptionInline ber-rel hanya bila rel = tabel `table3col` moda A).
- `html/blocks/index.ts`, `html/tables/index.ts`: peta renderer dibungkus `withAutoSpacers` (perakit SR-17 tidak disentuh; blok sintetis anak pembungkus dikecualikan).
- `html/blocks/inline.ts`: `inlineHtml(..., transform?)`. `html/blocks/text.ts`: `render.run.strong` + glyphRun + `symbolGlyphByRole` per peran inang (paragraf, daftar, aside, monoBlock, assumptionInline; label/judul hanya strong); label baris tanda rel = `labelRunByMark` atau warna `glyphRun` (label = nama tanda bila baris konten-saja `{kind, mark}`). `html/blocks/wrapper.ts`: pernyataan metode memakai glyphRun peran.
- `html/tables/{inline,apparatus,table}.ts`: glif simbol sebaris sel (peran sel), caption, SUMBER tabel/figur, KUNCI -> `symbolGlyphByRole`.
- `html/base/markup.ts`: S72 F-S72-2 `esc` membuang C0 (kecuali tab/LF/CR); register paritas RQ-6: medan `{org}` (org.shortName, bawaan GSP; pola "GSP · {nomor}" dibaca "{org} · {nomor}"), spasi literal -> `device.registerBlock.separator` (bawaan NBSP), EN LEMBAR/DARI -> SHEET/OF. `base/shell.ts` (kotak @page register ikut), `base/params.ts` (+`P.orgShort`).

## Bukti
- `npx tsc --noEmit -p tsconfig.json`: 4 galat, semuanya `benchmark/harness/run/run_benchmark.ts:170` (di luar area); 0 di `engine/html`.
- `npx eslint src/lib/studio/engine/html/blocks src/lib/studio/engine/html/tables src/lib/studio/engine/html/base/{markup,params,shell,css,index}.ts` exit 0.
- Asap `render_cli --doc benchmark/manual000/doc.json --template benchmark/manual000/template.json --formats html`: SUCCEEDED, 0 log error. Sebelum -> sesudah: spacer afterBlock 0 -> 155, afterList 0 -> 14, strong `st-b color:#101418` 0 -> 71, label tanda berwarna 0 -> 24, glif simbol tabel bersize peran 20 -> 39 (6pt/7pt), register NBSP 0 -> 22.
- Potongan: `<p class="st-spacer" style="margin-top:0pt;margin-bottom:0pt;line-height:6.75pt" data-role="spacer.afterBlock" aria-hidden="true" data-spacer="auto">&nbsp;</p>`; `<span class="st-b" style="color:#101418">bentuk</span>`; `data-mark="TERUKUR">■</span> <span style="color:#101418">TERUKUR</span>`; register `GSP·<b>000/GSP/STD/X/2026</b>` dengan NBSP.
- Opt-in: profil kanonik (tanpa --template) -> 0 spacer otomatis, SUCCEEDED, 0 log error.

## Keputusan / temuan
- K-RQ5-1: aturan run HTML mengimpor modul murni DOCX `engine/docx/blocks/semantic.ts` (satu sumber aturan, tanpa duplikasi); bila modul itu dipindah, pindahkan ke modul netral bersama.
- K-RQ5-2: perubahan perilaku bawaan (paritas DOCX, disengaja): register memakai NBSP + `{org}`; baris tanda rel tanpa label/teks kini menampilkan nama tanda.
- Temuan: register HTML tetap memakai `boldFields` P4S-13 (DOCX RQ-6 memakai aturan BM: semua medan kecuali org/tanggal tebal); selaraskan bersama keputusan P4S-13 (lihat temuan RQ-6). `lint=FAIL` render_cli sudah ada sebelum perubahan (sama di garis dasar).
- Uji unit tidak dijalankan (D-133: fase uji akhir). Review direkomendasikan: `html/blocks/semantic.ts`, `html/blocks/text.ts`.
