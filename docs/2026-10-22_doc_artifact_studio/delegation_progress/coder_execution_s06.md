# S06 coder-execution: params/page.ts (G1a)

Status: complete. Berkas: `src/lib/studio/params/page.ts` (satu-satunya yang ditulis).

## Angka
- `PARAMS_PAGE.length` = 91 = `PARAMS_PAGE_COUNT`; P4G 17, P4R 15, P4S 27, P4V 16, P4K 6, P4A 10; id dan key unik 91/91.
- Kelas: B 58, K 20, T 13 (semua T punya `derive`). Tanpa default null. Tanpa U+2014.
- tsc: grep `src/lib/studio/params/page` kosong (total galat repo 3, di luar area). eslint exit 0.

## Keputusan
- K-06: `rules.hairMm` 0,20 logis; kuantisasi lewat `rules.wordLadderSz` (P4R-11, T, derive wordLadder). Tidak ada R-xx khusus garis rambut di render.ts.
- K-11/KT-07: `layout.railMode` enum auto|A|B, default auto, class B + `derive: "railMode"` (katalog menulis T; T read-only akan memblokir override profil Manual 000).
- G-02: `cover.title.sizePt` type pt default 24, range 24-26 (katalog: "range pt").
- G-03: `grid.topBottomMarginMm` 26 (datum_docx.py:453 interior 26/26; :407 sampul 26 atas, 24 bawah). BM terukur 26,00/24,01 (research/07:641-642).
- D-09/V-03: P4R-08 ink900, `rek: true` (research/04 T035).
- P4V-08 kicker dan P4V-10 scopeLine default "" (isi per dokumen; contoh Manual 000 di classNote). Alamat, entitas, NIB, kepala wrapper, pemegang tanda tangan memakai nilai asli research/04 T001-T008.
- Tebal garis diberi `range.min` 0,18 (lantai P4R-09). Daftar subset diberi `enum`; kunci K tetap berenum satu nilai.

## Temuan
- Margin 26+26 = 52 mm memberi area teks 245 mm, sedangkan P4G-11 = 247 mm (297-247 = 50, tersirat L4009). Tidak diputus; untuk S11/S95.
- P4S-12 default = U+00A0 (ditulis `\u00A0`).

## Permintaan lintas pemilik
Tidak ada.
