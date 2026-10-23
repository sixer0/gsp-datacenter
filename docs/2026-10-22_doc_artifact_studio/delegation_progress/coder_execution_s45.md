# S45 coder-execution: engine/lint/render (I35)

Status: complete. Penjaga: `npx tsc --noEmit -p tsconfig.json | grep src/lib/studio/engine/lint/render` kosong (grep exit 1; total galat repo 30, semua di luar area); `npx eslint src/lib/studio/engine/lint/render` exit 0.

## Berkas (area eksklusif)
- `src/lib/studio/engine/lint/render/index.ts` (538 baris): `lintRendered(i)` tanda tangan kontrak persis; tambahan `lintRenderedWith(i, limits)`, `renderLintLimitsFromParams(params)`, `RENDER_LINT_DEFAULTS`, `RENDER_LINT_PARAM_KEYS`, `RENDER_CHECK_IDS`.
- `colour.ts` (hitung warna: kromatik HS + ramp tinta K-32), `svg.ts` (pengurai SVG statis: warna, ukuran huruf setelah viewBox/transform, simpul/konektor), `geometry.ts` (DATUM-32).

## Perilaku
- Setiap cek (14, 15, 25, 28, 32, 33, 37) selalu menghasilkan minimal satu butir PASS/FAIL/NOT_RUN; tidak melempar; galat instrumen = NOT_RUN berdetail (pola HS `run()`). FAIL per pelanggar, terburuk dulu, maks 12 (RL check_page).
- 14: warna per `.page` dari metrik S25; dokumen alir (D-45): PASS bila seluruh dokumen <= 5 (batas atas), selain itu NOT_RUN jujur (atribusi per halaman cetak tidak terukur).
- 15: paragraf `st-p` multi-baris, fon modus berbobot +-0,6 pt, kolom >= 0,6 x median; rata-rata berbobot baris penuh vs 66-80.
- 25/28/33: `svgs` diurai statis + figur/svgText/image dari metrik (sumber berbeda, bisa dua butir untuk gambar yang sama); SVG inline HTML hanya cadangan bila `svgs` kosong dan metrik tanpa figur.
- 32: `data-mark="node"`/`"link"` (S30); simpul terkait = terdekat dari ujung (<= 6 mm); cuplikan 0,25 mm, inset 0,4 mm.
- 37: elemen `overflow` S25 (lembar n, sumbu bawah/kanan, mm) + luapan horizontal dokumen alir.
- Metrik `truncated` menurunkan PASS 14/15/37 menjadi NOT_RUN.

## Bukti uji asap (scratch `s45_smoke.ts`, `npx tsx`)
- SVG sintetis: 25 FAIL 8 nilai (7 hex + ramp:ink), 28 FAIL 4.25 pt, 32 FAIL konektor #0 lewat 'B' 19.3 mm, 33 FAIL 260 mm.
- Diagram nyata bm-fig-06 (S30 buildDiagramSvg, 166x195.3 mm): 25 PASS 4 nilai, 28 PASS 24 teks terkecil 5.90 pt, 32 PASS 7 konektor, 33 PASS.
- HTML 2 lembar diukur Chromium (measureLayout S25): 14 PASS maks 3, 15 FAIL 90.9 cpl pada 128 mm (40.7 pada 60 mm), 28 FAIL 3.97 pt setelah skala, 37 FAIL lembar 2 'tall' bawah 79.5 mm.

## Keputusan (untuk dicatat controller)
- K-32 diterapkan: ramp interior (hue 208 +-25, s <= 0,40) dan ramp pembungkus (hue 30 +-18, s <= 0,30) = masing-masing 1 nilai; warna akromatik (< 0,15) tidak dihitung (HS `chromatic`).
- Batas bawaan = katalog (5/5/66-80/5,5 pt/247 mm); kunci templat lewat `renderLintLimitsFromParams` (yang lebih ketat menang). Tanda tangan kontrak tanpa parameter, jadi pemanggil S51 perlu memakai `lintRenderedWith` bila ingin batas templat.

## Permintaan / temuan
- Tidak ada permintaan blocking. Temuan F: DATUM-14 untuk unit alir butuh warna per halaman cetak dari S25 (saat ini satu daftar seluruh dokumen). Temuan: benchmark bm-fig-23 dan bm-fig-38 gagal build S30 (DATUM-35, DATUM-24), di luar area S45.
