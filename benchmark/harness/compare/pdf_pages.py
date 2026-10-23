"""Per-page text, raster and SSIM comparison of two PDFs (S96, D-17 BM-3/BM-4).

Method = CAL (`calib_compare.py`): page text from PyMuPDF `get_text()`,
whitespace-normalised; raster = 72 dpi grayscale; SSIM on the common top-left
crop of both rasters. Figure regions come from the image placements on the
reference page (BM figures are embedded PNGs).
"""
from __future__ import annotations

from typing import Callable

import numpy as np
import pymupdf

from docx_units import norm

SsimFn = Callable[[np.ndarray, np.ndarray], float]
MIN_FIGURE_SIDE_PT = 20.0   # skips hairline Datum Rule images and tiny glyph images
MIN_SSIM_SIDE_PX = 7        # CAL window size


def parse_pages(spec: str) -> list[int]:
    """'9,12,54-61' -> [9, 12, 54, ..., 61] (1-based, sorted, unique)."""
    pages: set[int] = set()
    for part in spec.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            lo, hi = part.split("-", 1)
            a, b = int(lo), int(hi)
            if a < 1 or b < a:
                raise ValueError(f"bad page range: {part!r}")
            pages.update(range(a, b + 1))
        else:
            n = int(part)
            if n < 1:
                raise ValueError(f"bad page number: {part!r}")
            pages.add(n)
    return sorted(pages)


def page_texts(doc: pymupdf.Document) -> list[str]:
    return [norm(p.get_text()) for p in doc]


def raster(page: pymupdf.Page) -> np.ndarray:
    pix = page.get_pixmap(dpi=72, colorspace=pymupdf.csGRAY)
    return np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width)


def ssim_common(a: np.ndarray, b: np.ndarray, ssim: SsimFn) -> float | None:
    h, w = min(a.shape[0], b.shape[0]), min(a.shape[1], b.shape[1])
    if h < MIN_SSIM_SIDE_PX or w < MIN_SSIM_SIDE_PX:
        return None
    return float(ssim(a[:h, :w], b[:h, :w]))


def first_difference(a: str, b: str, ctx: int = 80) -> dict:
    """Locate the first differing character and return context from both sides."""
    n = min(len(a), len(b))
    i = 0
    while i < n and a[i] == b[i]:
        i += 1
    lo = max(0, i - ctx)
    return {
        "charIndex": i,
        "ref": a[lo:i + ctx],
        "out": b[lo:i + ctx],
        "refLen": len(a),
        "outLen": len(b),
    }


def image_boxes(page: pymupdf.Page, min_side: float = MIN_FIGURE_SIDE_PT) -> list[tuple[float, float, float, float]]:
    boxes = []
    for info in page.get_image_info():
        x0, y0, x1, y1 = info["bbox"]
        if (x1 - x0) >= min_side and (y1 - y0) >= min_side:
            boxes.append((round(x0, 2), round(y0, 2), round(x1, 2), round(y1, 2)))
    # top-to-bottom, left-to-right reading order; drop exact duplicates
    return sorted(set(boxes), key=lambda b: (b[1], b[0]))


def _iou(a, b) -> float:
    ix = max(0.0, min(a[2], b[2]) - max(a[0], b[0]))
    iy = max(0.0, min(a[3], b[3]) - max(a[1], b[1]))
    inter = ix * iy
    union = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter
    return inter / union if union > 0 else 0.0


def _crop(img: np.ndarray, box) -> np.ndarray:
    x0, y0, x1, y1 = (int(round(v)) for v in box)
    x0, y0 = max(0, x0), max(0, y0)
    x1, y1 = min(img.shape[1], x1), min(img.shape[0], y1)
    return img[y0:y1, x0:x1]


def compare_pdfs(ref_path: str, out_path: str, ssim: SsimFn, figure_pages: list[int]) -> dict:
    """Return raw per-page data used by BM-2 (pages), BM-3 and BM-4."""
    ref = pymupdf.open(ref_path)
    out = pymupdf.open(out_path)
    try:
        n_ref, n_out = ref.page_count, out.page_count
        t_ref, t_out = page_texts(ref), page_texts(out)
        n_max = max(n_ref, n_out)
        per_page: list[dict] = []
        per_figure: list[dict] = []
        fig_set = set(figure_pages)
        for i in range(n_max):
            pno = i + 1
            row: dict = {"page": pno}
            if i >= n_ref or i >= n_out:
                row.update({"textIdentical": False, "ssim": None,
                            "missingIn": "ref" if i >= n_ref else "out"})
                per_page.append(row)
                if pno in fig_set:
                    per_figure.append({"page": pno, "figure": None, "ssim": None,
                                       "note": f"page missing in {row['missingIn']}"})
                continue
            same = t_ref[i] == t_out[i]
            a, b = raster(ref[i]), raster(out[i])
            s = ssim_common(a, b, ssim)
            row.update({"textIdentical": same, "ssim": s,
                        "sizeRef": [a.shape[1], a.shape[0]], "sizeOut": [b.shape[1], b.shape[0]]})
            if not same:
                row["textDiff"] = first_difference(t_ref[i], t_out[i])
            per_page.append(row)
            if pno in fig_set:
                boxes_ref = image_boxes(ref[i])
                boxes_out = image_boxes(out[i])
                if not boxes_ref:
                    per_figure.append({"page": pno, "figure": None, "bboxRef": None, "ssim": s,
                                       "note": "no image >= 20 pt on reference page; whole-page SSIM"})
                for k, box in enumerate(boxes_ref, start=1):
                    fs = ssim_common(_crop(a, box), _crop(b, box), ssim)
                    best = max(boxes_out, key=lambda ob: _iou(box, ob), default=None)
                    per_figure.append({
                        "page": pno, "figure": k, "bboxRef": list(box), "ssim": fs,
                        "outNearestBbox": list(best) if best else None,
                        "iou": round(_iou(box, best), 4) if best else 0.0,
                    })
        return {"pagesRef": n_ref, "pagesOut": n_out, "perPage": per_page, "perFigure": per_figure}
    finally:
        ref.close()
        out.close()
