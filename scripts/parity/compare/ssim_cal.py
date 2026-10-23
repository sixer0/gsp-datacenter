"""SSIM per halaman dengan metode CAL (port dari scripts/calib_compare.py kalibrasi research/05).

Metode CAL (dipertahankan apa adanya agar setara angka kalibrasi konfigurasi B):
- raster abu-abu lewat MuPDF (`colorspace=csGRAY`) pada 72 dpi;
- kedua raster dipotong ke ukuran bersama (min tinggi, min lebar), pojok kiri atas;
- jendela seragam 7x7 (rata-rata aritmetika, bukan Gaussian), langkah 2 piksel;
- varians/kovarians populasi (E[x^2] - E[x]^2), C1 = (0,01*255)^2, C2 = (0,03*255)^2;
- SSIM = rata-rata peta SSIM seluruh jendela.

`skimage.metrics.structural_similarity` TIDAK dipakai: fungsi itu menggeser jendela per 1 piksel,
memakai kovarians sampel (koreksi N-1) dan memotong tepi, sehingga angkanya tidak setara CAL.

Modul ini sengaja tanpa impor saudara agar dapat diimpor ulang oleh benchmark S96:

    sys.path.insert(0, str(REPO / "scripts" / "parity" / "compare"))
    from ssim_cal import ssim_pages, ssim_cal, page_gray, norm_text, compare_pdf_pages

atau, dengan akar repo di sys.path: `from scripts.parity.compare.ssim_cal import ssim_pages`.
"""
from __future__ import annotations

import re
from typing import Any, Iterable

import numpy as np
import pymupdf

__all__ = [
    "CAL_DPI",
    "CAL_WIN",
    "CAL_STEP",
    "norm_text",
    "ssim_cal",
    "page_gray",
    "pixmap_gray",
    "png_gray",
    "ssim_pages",
    "compare_pdf_pages",
]

CAL_DPI = 72
CAL_WIN = 7
CAL_STEP = 2
_C1 = (0.01 * 255) ** 2
_C2 = (0.03 * 255) ** 2
_WS = re.compile(r"\s+")


def norm_text(s: str) -> str:
    """Normalisasi teks per halaman persis seperti CAL: runtun spasi -> satu spasi, strip."""
    return _WS.sub(" ", s).strip()


def _win_mean(a: np.ndarray) -> np.ndarray:
    from numpy.lib.stride_tricks import sliding_window_view as sw

    k = sw(a, (CAL_WIN, CAL_WIN))[::CAL_STEP, ::CAL_STEP]
    return k.mean(axis=(-1, -2))


def ssim_cal(x: np.ndarray, y: np.ndarray) -> float:
    """SSIM metode CAL atas dua larik abu-abu 2D. Ukuran berbeda dipotong ke ukuran bersama."""
    if x.ndim != 2 or y.ndim != 2:
        raise ValueError("ssim_cal butuh larik 2D abu-abu")
    h, w = min(x.shape[0], y.shape[0]), min(x.shape[1], y.shape[1])
    if h < CAL_WIN or w < CAL_WIN:
        raise ValueError(f"raster terlalu kecil untuk jendela {CAL_WIN}x{CAL_WIN}: {h}x{w}")
    x = x[:h, :w].astype(np.float64)
    y = y[:h, :w].astype(np.float64)
    mx, my = _win_mean(x), _win_mean(y)
    vx = _win_mean(x * x) - mx**2
    vy = _win_mean(y * y) - my**2
    cxy = _win_mean(x * y) - mx * my
    s = ((2 * mx * my + _C1) * (2 * cxy + _C2)) / ((mx**2 + my**2 + _C1) * (vx + vy + _C2))
    return float(s.mean())


def pixmap_gray(pix: "pymupdf.Pixmap") -> np.ndarray:
    """Pixmap MuPDF -> larik uint8 abu-abu (H, W). Konversi warna lewat MuPDF seperti CAL."""
    if pix.alpha:
        # komposit di atas putih agar piksel transparan tidak terbaca hitam
        rgba = np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width, pix.n)
        if pix.colorspace is None or pix.colorspace.n != 3:
            pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
            rgba = np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width, pix.n)
        alpha = rgba[..., 3:4].astype(np.float64) / 255.0
        rgb = rgba[..., :3].astype(np.float64) * alpha + 255.0 * (1.0 - alpha)
        rgb = np.ascontiguousarray(np.rint(rgb).astype(np.uint8))
        pix = pymupdf.Pixmap(pymupdf.csRGB, pix.width, pix.height, rgb.tobytes(), 0)
    if pix.colorspace is None or pix.colorspace.n != 1:
        pix = pymupdf.Pixmap(pymupdf.csGRAY, pix)
    return np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width).copy()


def page_gray(page: "pymupdf.Page", dpi: int = CAL_DPI, clip: Any = None) -> np.ndarray:
    """Raster abu-abu satu halaman PDF (CAL: get_pixmap(dpi=72, colorspace=csGRAY)).

    `clip` (pymupdf.Rect atau tuple x0,y0,x1,y1 dalam pt) dipakai S96 untuk SSIM per figur.
    """
    kw: dict[str, Any] = {"dpi": dpi, "colorspace": pymupdf.csGRAY}
    if clip is not None:
        kw["clip"] = pymupdf.Rect(clip)
    pix = page.get_pixmap(**kw)
    return np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width).copy()


def png_gray(path: str) -> tuple[np.ndarray, float | None]:
    """Baca PNG -> (larik abu-abu uint8, dpi dari pHYs atau None)."""
    pix = pymupdf.Pixmap(path)
    dpi = float(pix.xres) if getattr(pix, "xres", 0) else None
    return pixmap_gray(pix), dpi


def _open(doc: "str | pymupdf.Document") -> tuple["pymupdf.Document", bool]:
    if isinstance(doc, pymupdf.Document):
        return doc, False
    return pymupdf.open(doc), True


def ssim_pages(
    ref_pdf: "str | pymupdf.Document",
    node_pdf: "str | pymupdf.Document",
    dpi: int = CAL_DPI,
    pages: Iterable[int] | None = None,
) -> list[dict[str, Any]]:
    """SSIM CAL per halaman untuk halaman bersama (1-based). Antarmuka publik untuk S96.

    Kembalian: [{page, ssim, refSize: [h, w], nodeSize: [h, w]}].
    `pages` (1-based) membatasi halaman; default semua halaman bersama.
    """
    a, close_a = _open(ref_pdf)
    b, close_b = _open(node_pdf)
    try:
        n = min(a.page_count, b.page_count)
        idx = range(1, n + 1) if pages is None else [p for p in pages if 1 <= p <= n]
        out = []
        for p in idx:
            ga, gb = page_gray(a[p - 1], dpi), page_gray(b[p - 1], dpi)
            out.append(
                {
                    "page": p,
                    "ssim": ssim_cal(ga, gb),
                    "refSize": list(ga.shape),
                    "nodeSize": list(gb.shape),
                }
            )
        return out
    finally:
        if close_a:
            a.close()
        if close_b:
            b.close()


def compare_pdf_pages(
    ref_pdf: "str | pymupdf.Document",
    node_pdf: "str | pymupdf.Document",
    dpi: int = CAL_DPI,
) -> dict[str, Any]:
    """Ringkasan CAL penuh: jumlah halaman, teks identik per halaman, SSIM per halaman.

    Kembalian: {refPages, nodePages, perPage: [{page, textIdentical, ssim}], textIdenticalPages,
    ssimMean, ssimMin, pagesSsimGe098}. Kunci terakhir setara `RenderEnvManifest.calibration`.
    """
    a, close_a = _open(ref_pdf)
    b, close_b = _open(node_pdf)
    try:
        n = min(a.page_count, b.page_count)
        per = []
        for i in range(n):
            ta, tb = norm_text(a[i].get_text()), norm_text(b[i].get_text())
            s = ssim_cal(page_gray(a[i], dpi), page_gray(b[i], dpi))
            per.append({"page": i + 1, "textIdentical": ta == tb, "ssim": s})
        ss = [p["ssim"] for p in per]
        return {
            "refPages": a.page_count,
            "nodePages": b.page_count,
            "perPage": per,
            "textIdenticalPages": sum(p["textIdentical"] for p in per),
            "ssimMean": (sum(ss) / len(ss)) if ss else None,
            "ssimMin": min(ss) if ss else None,
            "pagesSsimGe098": sum(s >= 0.98 for s in ss),
        }
    finally:
        if close_a:
            a.close()
        if close_b:
            b.close()
