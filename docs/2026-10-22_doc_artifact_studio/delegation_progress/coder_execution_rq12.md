# RQ-12 coder-execution: convert_v2.ts + NORM_COMPOSE_PARAM_KEYS + cakupan slots (sisa RQ-8, D-224)

Status: complete (2026-10-23).

## Berkas
- `benchmark/extract/convert_v2.ts`: `DocConversion.tocTitle/tocNote` dari doc.json `front.toc.title/note` (fungsi `tocText`, run digabung; tanpa masukan baru); additions preset: `image.widthClass`/`symbolSheet.widthClass` full, `render.toc.title`/`render.toc.note`; `INTENDED_DELTA` + 6 entri (teks disalin dari `meta.intendedDelta` preset kini).
- `src/lib/studio/contract/types/v2/norm.ts`: HANYA `NORM_COMPOSE_PARAM_KEYS` +4 (render.toc.title, render.toc.note, image.widthMm, symbolSheet.widthMm) + komentar "Lima belas".
- `src/lib/studio/registry/slots.ts`: `image.widthClass` -> section:image, `symbolSheet.widthClass` -> section:symbolSheet; `image.widthMm`/`symbolSheet.widthMm` -> document.

## Keputusan (penyimpangan dari teks RQ-8)
RQ-8 meminta widthMm juga section. Aturan yang ada: kelas lebar per jenis = section:<jenis> (table/chart/diagram), tetapi turunan T `chart.output.widthMm`/`diagram.widthMm` = DOC (D-162: lebar figur diturunkan dari ukuran kertas, tidak dapat ditimpa per slot). widthMm image/symbolSheet adalah turunan T identik -> DOC.

## Bukti
- `convert_v2.ts --check`: SAME doc.v2.json 9c77439b..., SAME template.v2.json 882057c5..., SAME preset d181efb1... (sebelum: preset DIFF).
- Skrip banding: norm=15 compose=15 identical(order incl.)=true; cakupan 6 kunci sesuai di atas.
- tsc seluruh repo exit 0; eslint 3 berkas exit 0.
