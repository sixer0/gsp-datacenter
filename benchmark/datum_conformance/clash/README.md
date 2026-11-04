# benchmark/datum_conformance/clash (S24, D-593 G-01..G-06)

PDF text-clash checker. PyMuPDF 1.28.2 from the hermes venv (research/34), no new dependency.

```
VENV -I -B benchmark/datum_conformance/clash/clash.py --pdf <file> --out <json>
    [--docx <file> [--no-convert]] [--margins-mm l,t,r,b] [--zones <json>]
    [--work-dir C:/tmp/dc_clash] [--soffice <soffice.com>]
```

- `--docx` converts the DOCX with LibreOffice (Studio PDF path) in a short work dir, writes the PDF to
  `--pdf`, and takes margins/header/footer bands from the DOCX sections. `--no-convert` reads only the geometry.
- Without `--docx`/`--margins-mm`: DATUM default 24/26/20/24 mm, header and footer distance 13 mm.
- `--zones`: `{"units": "mm"|"pt", "replace_auto": false, "zones": [{"name": "rail", "kind":
  "header|register|footer|seal|rail|cover|allow", "bbox": [x0, y0, x1, y1], "pages": [1, 2], "single_line": true}]}`.
  Every zone allows text outside the margin box; `header`, `register` and `seal` zones are also checked for
  overflow (leaving the zone or cell, crossing a cell separator, a second baseline).
  Auto zones: running-header band, register/footer band (split into cells at its vertical rules),
  and every filled cell in seal colour 6E1420.

| kind | rule | test |
|---|---|---|
| overlap | G-01 | glyph em boxes of different lines intersect > 0.5 pt in both axes (same visual line: > 0.2 em) |
| out_of_page | G-02 | word box leaves the page by > 0.5 pt (mediabox clipping is off, so such text is seen) |
| out_of_margin | G-03 | word outside the margin box and outside every zone (spine exception below) |
| clipped | G-04 | a drawn cell edge runs through a glyph; underline/strike-through of its own line excluded |
| overflow | G-06 | label in header/register/seal zone leaves its zone or cell, crosses a separator, or wraps |

Spine string (D-599; manual EN:2766, ID:2485, ID:2718): a line rotated 90 or 270 degrees, wholly in the
right (outer) margin band, is not out_of_margin on a cover, divider or back-cover page. Page role: a body page
carries running-header or register text; cover = page 1, back cover = last page, divider = page directly
before a body page, each only when it is not a body page. With `--docx` the text must equal a spine string of
the DOCX (cells with vertical text direction), and the role must belong to a section that carries one
(first section = cover, last = back cover, other = divider). Without it the text must match
`type · subject · language · REV x · Roman month · year`. Overlap, out_of_page and edge checks still apply.

Output: `{"pdf", "pages", "clashes": [{"page", "kind", "bbox": [x0, y0, x1, y1], "text", "detail"}]}`
(PDF points, origin top-left, pages 1-based). Exit 0 = no clashes, 1 = clashes, 2 = usage error,
unreadable input or failed conversion; then `clash_error.json` (durable error record) is written next to
`--out` and `--out` is not written.

Untrusted DOCX (`--docx`): checked before LibreOffice sees it, with the same limits as the TS reader
(`lib/docx.ts`, `lib/xml.ts`): at most 20,000 entries, 64 MiB per XML part and 256 MiB in total (declared sizes
in the directory and the bytes really read through a bounded stream), and no `DOCTYPE`/`ENTITY` declaration.
A breach raises `DocxLimitError` and exits 2.

Tests: `VENV -I -B -m pytest -p no:cacheprovider benchmark/datum_conformance/clash/tests`
