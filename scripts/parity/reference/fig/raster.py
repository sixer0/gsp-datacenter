# -*- coding: utf-8 -*-
"""SVG -> PNG 300 dpi lewat Chromium Playwright `page.set_content` (S65).

`file://` tidak dipakai: di mesin ini `page.goto(file://...)` gagal
ERR_FILE_NOT_FOUND sedangkan `set_content` + screenshot berhasil
(research/03 4.4 dan 11.2). Ukuran CSS diambil dari atribut root SVG
(mm, pt, px atau tanpa satuan = px 96 dpi), lalu device scale factor
300/96 menghasilkan piksel = mm / 25,4 * 300.
"""
import math
import re

DPI = 300
CSS_DPI = 96.0
_UNIT_PX = {"mm": CSS_DPI / 25.4, "cm": CSS_DPI / 2.54, "in": CSS_DPI, "pt": CSS_DPI / 72.0,
            "pc": CSS_DPI / 6.0, "px": 1.0, "": 1.0}
_ROOT = re.compile(r"<svg\b[^>]*>", re.S)
_ATTR = r'\b%s\s*=\s*"([^"]*)"'


class RasterError(RuntimeError):
    pass


def _length_px(raw):
    m = re.fullmatch(r"\s*([-+0-9.eE]+)\s*([a-z]*)\s*", raw or "")
    if not m or m.group(2) not in _UNIT_PX:
        return None
    return float(m.group(1)) * _UNIT_PX[m.group(2)]


def svg_size(svg):
    """(width_px_css, height_px_css, width_mm, height_mm) dari root SVG."""
    root = _ROOT.search(svg)
    if not root:
        raise RasterError("root <svg> tidak ditemukan")
    tag = root.group(0)
    w = re.search(_ATTR % "width", tag)
    h = re.search(_ATTR % "height", tag)
    wp = _length_px(w.group(1)) if w else None
    hp = _length_px(h.group(1)) if h else None
    if wp is None or hp is None:
        vb = re.search(_ATTR % "viewBox", tag)
        if not vb:
            raise RasterError("root SVG tanpa width/height terbaca dan tanpa viewBox")
        parts = [float(x) for x in re.split(r"[\s,]+", vb.group(1).strip())]
        wp, hp = parts[2], parts[3]
    mm = 25.4 / CSS_DPI
    return wp, hp, wp * mm, hp * mm


def _strip_prolog(svg):
    """Buang deklarasi XML dan DOCTYPE agar SVG bisa disisipkan inline di HTML."""
    i = svg.find("<svg")
    return svg[i:] if i > 0 else svg


def svgs_to_png(items, dpi=DPI):
    """items: list (svg_text, png_path). Mengembalikan list info per berkas."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as ex:  # pragma: no cover - lingkungan tanpa playwright
        raise RasterError("playwright tidak terpasang di interpreter ini: %s" % ex)
    scale = dpi / CSS_DPI
    out = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            for svg, png_path in items:
                wp, hp, wmm, hmm = svg_size(svg)
                vw, vh = max(1, math.ceil(wp)), max(1, math.ceil(hp))
                page = browser.new_page(viewport={"width": vw, "height": vh},
                                        device_scale_factor=scale)
                try:
                    html = ('<!doctype html><html><head><meta charset="utf-8"><style>'
                            'html,body{margin:0;padding:0;background:#FFFFFF}'
                            'svg{display:block}</style></head><body>%s</body></html>'
                            % _strip_prolog(svg))
                    page.set_content(html, wait_until="load")
                    page.evaluate("document.fonts.ready.then(() => true)")
                    fonts = page.evaluate(
                        "['IBM Plex Sans Condensed','IBM Plex Mono'].map("
                        "f => [f, document.fonts.check('7pt \"' + f + '\"')])")
                    page.screenshot(path=png_path, clip={"x": 0, "y": 0, "width": wp, "height": hp},
                                    omit_background=False)
                finally:
                    page.close()
                out.append({"path": png_path, "widthPx": int(round(wp * scale)),
                            "heightPx": int(round(hp * scale)), "widthMm": round(wmm, 3),
                            "heightMm": round(hmm, 3), "fontsAvailable": dict(fonts),
                            "chromium": browser.version})
        finally:
            browser.close()
    return out
