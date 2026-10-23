# S21 HTML dasar paged-media (engine/html/base), coder-execution, 2026-10-23

Status: complete

Berkas (area eksklusif `src/lib/studio/engine/html/base/`): `index.ts` (I10 persis: `htmlShell`, `tokenCss`, `fontFaceCss` + ekspor aditif), `params.ts` (pembaca parameter, geometri D-33), `fonts.ts` (@font-face base64), `css.ts` (token + @page + kosakata kelas), `markup.ts` (running head, register, `pageSheet`), `shell.ts` (dokumen, @page per unit, perabot layar).

Penjaga:
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep "src/lib/studio/engine/html/base"` -> kosong (exit 1); grep `html/assemble` juga kosong.
- `npx eslint src/lib/studio/engine/html/base` -> exit 0, tanpa keluaran.
- Cek runtime (skrip scratch, token dari `resolveParams` registri penuh, paramErrors 0): dua panggilan sha256 identik; 1.598.974 bait; tanpa `<script>`/URL non-data; `enforceStandalone` S24 = 0 pelanggaran; `fontsCss` ber-URL https ditolak `BY_CONSTRUCTION_FAILED`; berkas fon hilang -> `FILE_MISSING_ON_DISK`; 0 sitasi rel -> `st-rail-b`.
- Chromium (S25 runtime): PDF cetak 3 halaman A4; kotak margin "BAB 5 · BASELINE KUANTITAS & UJI", "LEMBAR 2 DARI 3"/"LEMBAR 3 DARI 3", sampul tanpa perabot; fon tertanam Plex Serif/SansCond/Mono + DejaVuSans (◈). `measureLayout` print 3 halaman, blocked 0, overflow 0.

Keputusan (dicatat controller):
1. Dua mode tanpa skrip: alir (unit `.st-unit` S24) = `@page` margin grid (atas 26, bawah turunan 24, dalam 24, luar 20) + kotak margin `counter(page)`/`counter(pages)`, halaman bernama `st-u-<i>` per unit; berhalaman (`pageSheet` -> `.page/.body/.reg`, D-38) = `@page st-sheet` margin 0, n = penghitung CSS `st-sheet`, N = `--st-sheets` dihitung `htmlShell`.
2. Running head per unit dari `data-header`/`data-footer` S24 (D-45; `inherit`/absen -> `render.section.*`, `custom` -> kosong); tengah = teks `.st-chapter-kicker` + `.st-chapter-title` S22.
3. Layar: tiap `.st-unit` tampil sebagai lembar galai dengan salinan perabot `.st-screen` (disisipkan setelah tag pembuka unit); LEMBAR di layar = urutan unit, bukan halaman cetak.
4. Moda rel: P4S-07 false -> B; selain itu `railModeFor` S11 atas hitungan `.st-rail`/`.r`. Variabel `--st-rail-width/gap` untuk CSS S22.
5. Kunci wajah: `Keluarga`, `Keluarga|slot`, atau alias peran; "IBM Plex Sans Cond" (R-08) = alias condensed, didaftarkan dengan nama `type.face.*`. Mime `font/ttf` / `application/font-sfnt` (D-45). Glif simbol: unicode-range RL + titik kode `marks.*.glyph`; `shellFaces` hanya slot regular DejaVu.
6. Register: sel P4S-11; sel "REV · {tanggal}" diberi huruf revisi ("REV B · 31-VII-2026", acuan RL); tanggal `DD-<Romawi>-YYYY`; nomor kosong -> "—".
7. Kosakata RL (h1-h3, tabel `.tbl`) dibatasi ke `.body`/`.tbl` agar tidak mengenai markup S22/S23.

Temuan: `fonts/DejaVuSans-Bold.ttf` kini ada di manifest S13 (S13 mencatat 25 entri). Batas cetak Chromium: kotak margin tanpa garis bawah running head (garis hanya di layar/`.page`). Mode campuran `.page` + `.st-unit`: nomor LEMBAR lembar vs halaman cetak dapat berbeda.

Permintaan lintas pemilik: tidak ada. Review direkomendasikan (S83).
