# -*- coding: utf-8 -*-
"""SVG -> PNG for the S64 reference adapter (figures fed to DatumDocx.figure()).

DatumDocx.figure() only accepts raster images (python-docx add_picture), so every
SVG figure produced by the reference engines (Rev L datumchart, Garis A datum_diagram,
Garis A datumsimbol) is rasterised first.

Method: Chromium via Playwright ``set_content`` with the SVG inlined. This mirrors
Rev L ``datum_render._chromium_png`` (same launch flags, device_scale_factor 1,
white page) except that it never loads ``file://`` URLs: research/03 section 11.2
recorded that ``goto(file://...)`` fails on this host while ``set_content`` works.
"""
import re

MM_PER_IN = 25.4
PX_PER_MM_96 = 96.0 / MM_PER_IN

_SVG_OPEN_RE = re.compile(r"<svg\b[^>]*>", re.S)
_ATTR_RE = r'\b%s="([^"]*)"'


class RasterError(Exception):
    """Raster step failed (no browser, launch failure, bad SVG root)."""


def _num_mm(value):
    """Attribute value -> mm. 'Nmm' is mm; a bare number is CSS px at 96 dpi."""
    if value is None:
        return None
    v = value.strip()
    if v.endswith("mm"):
        return float(v[:-2])
    if v.endswith("px"):
        v = v[:-2]
    try:
        return float(v) / PX_PER_MM_96
    except ValueError:
        return None


def svg_size_mm(svg):
    """Declared root size in mm (width/height attributes, else viewBox as mm)."""
    m = _SVG_OPEN_RE.search(svg)
    if not m:
        raise RasterError("SVG tanpa elemen akar <svg>")
    head = m.group(0)
    w = re.search(_ATTR_RE % "width", head)
    h = re.search(_ATTR_RE % "height", head)
    wm = _num_mm(w.group(1)) if w else None
    hm = _num_mm(h.group(1)) if h else None
    if wm and hm:
        return wm, hm
    vb = re.search(_ATTR_RE % "viewBox", head)
    if vb:
        parts = vb.group(1).replace(",", " ").split()
        if len(parts) == 4:
            return float(parts[2]), float(parts[3])
    raise RasterError("ukuran akar SVG tidak dapat ditentukan")


def _resize_root(svg, px_w, px_h):
    """Rewrite the root <svg> to the target pixel box, keeping/adding a viewBox."""
    m = _SVG_OPEN_RE.search(svg)
    head = m.group(0)
    vb = re.search(_ATTR_RE % "viewBox", head)
    new = re.sub(r'\s(width|height)="[^"]*"', "", head)
    if not vb:
        w = re.search(_ATTR_RE % "width", head)
        h = re.search(_ATTR_RE % "height", head)
        if not (w and h):
            raise RasterError("SVG tanpa viewBox maupun width/height")
        wn = re.sub(r"[a-z]+$", "", w.group(1).strip())
        hn = re.sub(r"[a-z]+$", "", h.group(1).strip())
        new = new[:-1].rstrip("/") + ' viewBox="0 0 %s %s">' % (wn, hn)
    new = new[:-1] + ' width="%d" height="%d">' % (px_w, px_h)
    return svg[:m.start()] + new + svg[m.end():]


class Rasterizer:
    """Lazily launched Chromium; one browser per job, closed by close()."""

    def __init__(self, dpi=300, timeout_ms=60000):
        self.dpi = dpi
        self.timeout_ms = timeout_ms
        self._pw = None
        self._browser = None
        self.engine = None

    def _ensure(self):
        if self._browser is not None:
            return
        try:
            from playwright.sync_api import sync_playwright
        except ImportError as ex:
            raise RasterError("playwright tidak terpasang di interpreter: %s" % ex)
        try:
            self._pw = sync_playwright().start()
            self._browser = self._pw.chromium.launch(
                args=["--force-color-profile=srgb", "--font-render-hinting=none"],
                timeout=self.timeout_ms)
            self.engine = "chromium " + self._browser.version
        except Exception as ex:  # noqa: BLE001 - reported to caller as RasterError
            self.close()
            raise RasterError("Chromium gagal diluncurkan: %s" % ex)

    def svg_to_png(self, svg, dst, w_mm=None):
        """Rasterise ``svg`` to ``dst`` at self.dpi. Returns (px_w, px_h, w_mm, h_mm)."""
        sw, sh = svg_size_mm(svg)
        if w_mm is None:
            w_mm = sw
        h_mm = sh * (w_mm / sw)
        px_w = max(1, int(round(w_mm / MM_PER_IN * self.dpi)))
        px_h = max(1, int(round(h_mm / MM_PER_IN * self.dpi)))
        body = _resize_root(svg, px_w, px_h)
        html = ('<!doctype html><html><head><meta charset="utf-8"><style>'
                'html,body{margin:0;padding:0;background:#fff}'
                'svg{display:block}</style></head><body>%s</body></html>' % body)
        self._ensure()
        page = self._browser.new_page(viewport={"width": px_w, "height": px_h},
                                      device_scale_factor=1)
        try:
            page.set_content(html, timeout=self.timeout_ms)
            page.wait_for_timeout(350)
            page.screenshot(path=dst, omit_background=False,
                            clip={"x": 0, "y": 0, "width": px_w, "height": px_h},
                            timeout=self.timeout_ms)
        finally:
            page.close()
        return px_w, px_h, w_mm, h_mm

    def close(self):
        try:
            if self._browser is not None:
                self._browser.close()
        except Exception:  # noqa: BLE001 - best effort shutdown
            pass
        try:
            if self._pw is not None:
                self._pw.stop()
        except Exception:  # noqa: BLE001 - best effort shutdown
            pass
        self._browser = None
        self._pw = None
