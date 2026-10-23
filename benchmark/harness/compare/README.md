# benchmark/harness/compare (S96, H06)

D-17 comparator for Manual DATUM 000: output DOCX/PDF vs `BM.docx` / `BM.pdf`.

```
VENV -I -B benchmark/harness/compare/bm_compare.py --docx <out.docx> --pdf <out.pdf> \
    --ref-docx <BM.docx> --ref-pdf <BM.pdf> --out <dir> \
    [--figure-pages 9,12,19,35,37,38,40,42,50,51,54-61] [--context 2] [--md-max-diffs 300]
```

| Criterion | Measure | Pass |
|---|---|---|
| BM1 | exact LCS of text units (body paragraph, table cell, caption, source line), whitespace-normalised, document order; pct = LCS / max(ref, out) | >= 98 % |
| BM2 | pages (PDF), chapters (`Bab n`), appendices (`Lampiran X`), top-level tables, `w:drawing`/`w:pict` placements | abs(delta) <= floor(2 % of ref) per type |
| BM3 | per-page CAL text equality (`re.sub(r"\s+"," ",get_text()).strip()`); of = max page count | >= 98 % (100/102) |
| BM4 | mean CAL SSIM (7x7 stride 2, gray, 72 dpi); missing page = 0. Per-page and per-figure SSIM on figure pages = diagnosis only | >= 0.95 |

Outputs `bm_report.json` (shape of spec section 11 H06 plus detail) and `bm_report.md`
(per criterion, per page, per figure, per paragraph diff with context).
Exit 0 = all pass; 1 = any FAIL or NOT-RUN (`--docx`/`--pdf` omitted); 2 = usage error or
unreadable input (also writes `bm_error.json`).

SSIM comes from S66 `scripts/parity/compare/ssim_cal.py:ssim_cal` (checked against a CAL probe at
load); a local CAL copy is the fallback (`ssim_seam.py`). Reference files are only read.
