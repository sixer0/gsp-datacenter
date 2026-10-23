"""Normalisasi SVG untuk pembanding struktur (research/06 §6.1).

Hasil `load(path)`: model datar elemen bergambar dengan koordinat absolut dalam mm (transform
kumulatif diterapkan, satuan root dikonversi), warna heks huruf besar, teks NFC berspasi normal,
ukuran font dalam pt fisik dan angka mentah (untuk §6.4-N1), plus atribut peran kontrak
(`data-mark`, `data-series`, `data-index`, `data-axis`, `data-panel`; spesifikasi §3.5) serta penanda
subjek aksen (`data-accent-group`, `data-accent`, `data-rule`; D-108).
Elemen latar `paper` (isi menutup >= 99 % kanvas, tanpa `data-mark`) dan teks non-data acuan PC
(footer "CONTOH DATA SINTETIS ...") dibuang di kedua sisi.
"""
from __future__ import annotations

import math
import re
import unicodedata
from typing import Any

from lxml import etree

SVG_NS = "http://www.w3.org/2000/svg"
XLINK = "http://www.w3.org/1999/xlink"
MM_PER_PT = 25.4 / 72.0
MM_PER_PX = 25.4 / 96.0
_UNIT_MM = {"mm": 1.0, "cm": 10.0, "in": 25.4, "pt": MM_PER_PT, "pc": 12 * MM_PER_PT, "px": MM_PER_PX, "": MM_PER_PX}
_NUM = re.compile(r"[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?")
_LEN = re.compile(r"^\s*([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)\s*([a-z%]*)\s*$")
_WS = re.compile(r"\s+")
_SKIP = {"defs", "clipPath", "mask", "marker", "symbol", "style", "metadata", "title", "desc", "pattern",
         "linearGradient", "radialGradient", "filter"}
_SHAPES = {"rect", "line", "path", "circle", "ellipse", "polygon", "polyline", "text", "use", "image"}
_NAMED = {"black": "#000000", "white": "#FFFFFF", "red": "#FF0000", "green": "#008000", "blue": "#0000FF",
          "gray": "#808080", "grey": "#808080"}
NON_DATA_TEXT = (re.compile(r"^CONTOH DATA SINTETIS", re.I),)
_PARSER = etree.XMLParser(resolve_entities=False, no_network=True, huge_tree=True)

Matrix = tuple[float, float, float, float, float, float]
IDENT: Matrix = (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)


def _local(tag: Any) -> str:
    return tag.rsplit("}", 1)[-1] if isinstance(tag, str) else ""


def mul(m: Matrix, n: Matrix) -> Matrix:
    a, b, c, d, e, f = m
    A, B, C, D, E, F = n
    return (a * A + c * B, b * A + d * B, a * C + c * D, b * C + d * D, a * E + c * F + e, b * E + d * F + f)


def parse_transform(s: str | None) -> Matrix:
    m = IDENT
    if not s:
        return m
    for name, args in re.findall(r"(\w+)\s*\(([^)]*)\)", s):
        v = [float(x) for x in _NUM.findall(args)]
        if name == "matrix" and len(v) == 6:
            t = tuple(v)
        elif name == "translate":
            t = (1, 0, 0, 1, v[0] if v else 0, v[1] if len(v) > 1 else 0)
        elif name == "scale":
            sx = v[0] if v else 1
            t = (sx, 0, 0, v[1] if len(v) > 1 else sx, 0, 0)
        elif name == "rotate":
            a = math.radians(v[0] if v else 0)
            t = (math.cos(a), math.sin(a), -math.sin(a), math.cos(a), 0, 0)
            if len(v) == 3:
                t = mul(mul((1, 0, 0, 1, v[1], v[2]), t), (1, 0, 0, 1, -v[1], -v[2]))
        elif name == "skewX":
            t = (1, 0, math.tan(math.radians(v[0])), 1, 0, 0)
        elif name == "skewY":
            t = (1, math.tan(math.radians(v[0])), 0, 1, 0, 0)
        else:
            continue
        m = mul(m, t)  # type: ignore[arg-type]
    return m


def apply(m: Matrix, x: float, y: float) -> tuple[float, float]:
    a, b, c, d, e, f = m
    return a * x + c * y + e, b * x + d * y + f


def mscale(m: Matrix) -> float:
    return math.sqrt(abs(m[0] * m[3] - m[1] * m[2])) or 1.0


def norm_color(v: str | None) -> str | None:
    if v is None:
        return None
    v = v.strip()
    low = v.lower()
    if low in ("none", "transparent", "") or low.startswith("url(") or low == "currentcolor":
        return None
    if low in _NAMED:
        return _NAMED[low]
    if low.startswith("#"):
        h = low[1:]
        if len(h) in (3, 4):
            h = "".join(ch * 2 for ch in h[:3])
        return "#" + h[:6].upper()
    m = re.match(r"rgba?\(([^)]*)\)", low)
    if m:
        parts = [p.strip() for p in m.group(1).split(",")]
        vals = []
        for p in parts[:3]:
            vals.append(round(float(p[:-1]) * 2.55) if p.endswith("%") else int(float(p)))
        return "#%02X%02X%02X" % tuple(max(0, min(255, x)) for x in vals)
    return v.upper()


def norm_text(s: str) -> str:
    return _WS.sub(" ", unicodedata.normalize("NFC", s)).strip()


def _style(el: etree._Element) -> dict[str, str]:
    out: dict[str, str] = {}
    for k in ("fill", "stroke", "stroke-width", "stroke-dasharray", "font-size", "font-family", "display",
              "visibility"):
        if el.get(k) is not None:
            out[k] = el.get(k)
    st = el.get("style")
    if st:
        for decl in st.split(";"):
            if ":" not in decl:
                continue
            k, v = decl.split(":", 1)
            k, v = k.strip(), v.strip()
            if k == "font":
                m = re.search(r"([-+]?(?:\d+\.?\d*|\.\d+))(px|pt)?\s", v + " ")
                if m:
                    out["font-size"] = m.group(1) + (m.group(2) or "")
            else:
                out[k] = v
    return out


def _font_user(v: str) -> float | None:
    m = _LEN.match(v or "")
    if not m:
        return None
    n, u = float(m.group(1)), m.group(2)
    return n * (4.0 / 3.0) if u == "pt" else n  # CSS: 1pt = 4/3 user unit (px)


def root_size_mm(root: etree._Element) -> tuple[float, float, list[float] | None, float]:
    vb = [float(x) for x in _NUM.findall(root.get("viewBox") or "")] or None
    if vb is not None and len(vb) != 4:
        vb = None

    def dim(attr: str, idx: int) -> float | None:
        m = _LEN.match(root.get(attr) or "")
        if m and m.group(2) != "%":
            return float(m.group(1)) * _UNIT_MM.get(m.group(2), MM_PER_PX)
        return vb[idx] * MM_PER_PX if vb else None

    w, h = dim("width", 2), dim("height", 3)
    if w is None or h is None:
        raise ValueError("SVG tanpa width/height maupun viewBox")
    scale = (w / vb[2]) if vb and vb[2] else MM_PER_PX
    return w, h, vb, scale


# ---------------------------------------------------------------- path
_CMD = re.compile(r"([MmLlHhVvCcSsQqTtAaZz])|([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)")
_ARGN = {"M": 2, "L": 2, "H": 1, "V": 1, "C": 6, "S": 4, "Q": 4, "T": 2, "A": 7, "Z": 0}


def path_points(d: str) -> list[tuple[str, list[float]]]:
    """Path -> daftar (perintah absolut huruf besar, argumen absolut)."""
    toks = _CMD.findall(d or "")
    out: list[tuple[str, list[float]]] = []
    i, cmd = 0, None
    cx = cy = sx = sy = 0.0
    nums: list[float] = []

    def flush() -> None:
        nonlocal cx, cy, sx, sy, cmd, nums
        if cmd is None:
            return
        up = cmd.upper()
        n = _ARGN[up]
        rel = cmd.islower()
        if up == "Z":
            out.append(("Z", []))
            cx, cy = sx, sy
            return
        first = True
        while len(nums) >= n and n:
            a, nums = nums[:n], nums[n:]
            if up == "H":
                cx = a[0] + (cx if rel else 0)
                out.append(("L", [cx, cy]))
            elif up == "V":
                cy = a[0] + (cy if rel else 0)
                out.append(("L", [cx, cy]))
            elif up == "A":
                ex, ey = a[5] + (cx if rel else 0), a[6] + (cy if rel else 0)
                out.append(("A", [a[0], a[1], a[2], a[3], a[4], ex, ey]))
                cx, cy = ex, ey
            else:
                pts = []
                for k in range(0, n, 2):
                    px, py = a[k] + (cx if rel else 0), a[k + 1] + (cy if rel else 0)
                    pts += [px, py]
                c2 = "L" if (up == "M" and not first) else up
                out.append((c2, pts))
                cx, cy = pts[-2], pts[-1]
                if up == "M" and first:
                    sx, sy = cx, cy
            first = False
        nums = []

    for c, num in toks:
        if c:
            flush()
            cmd = c
        else:
            nums.append(float(num))
    flush()
    return out


# ---------------------------------------------------------------- muat
def _geom(tag: str, el: etree._Element, m: Matrix) -> list[float]:
    g = lambda k: float(_NUM.findall(el.get(k) or "0")[0]) if _NUM.findall(el.get(k) or "0") else 0.0  # noqa: E731
    s = mscale(m)
    if tag in ("rect", "image"):
        x, y, w, h = g("x"), g("y"), g("width"), g("height")
        return [*apply(m, x, y), *apply(m, x + w, y + h)]
    if tag == "line":
        return [*apply(m, g("x1"), g("y1")), *apply(m, g("x2"), g("y2"))]
    if tag == "circle":
        return [*apply(m, g("cx"), g("cy")), g("r") * s]
    if tag == "ellipse":
        return [*apply(m, g("cx"), g("cy")), g("rx") * s, g("ry") * s]
    if tag in ("polygon", "polyline"):
        v = [float(x) for x in _NUM.findall(el.get("points") or "")]
        out: list[float] = []
        for k in range(0, len(v) - 1, 2):
            out += apply(m, v[k], v[k + 1])
        return out
    if tag == "path":
        out = []
        for c, a in path_points(el.get("d") or ""):
            if c == "A":
                out += [a[0] * s, a[1] * s, a[2], a[3], a[4], *apply(m, a[5], a[6])]
            else:
                for k in range(0, len(a), 2):
                    out += apply(m, a[k], a[k + 1])
        return out
    if tag in ("text", "use"):
        return list(apply(m, g("x"), g("y")))
    return []


def _bbox(tag: str, geo: list[float]) -> tuple[float, float, float, float] | None:
    if tag in ("text", "use") or len(geo) < 2:
        return None
    if tag == "circle":
        return geo[0] - geo[2], geo[1] - geo[2], geo[0] + geo[2], geo[1] + geo[2]
    xs, ys = geo[0::2], geo[1::2]
    return min(xs), min(ys), max(xs), max(ys)


def load(path: str) -> dict[str, Any]:
    root = etree.parse(path, _PARSER).getroot()
    if _local(root.tag) != "svg":
        raise ValueError(f"{path}: root bukan <svg>")
    w_mm, h_mm, vb, k = root_size_mm(root)
    base: Matrix = (k, 0.0, 0.0, k, (-vb[0] * k) if vb else 0.0, (-vb[1] * k) if vb else 0.0)
    elems: list[dict[str, Any]] = []
    marks: list[dict[str, Any]] = []
    axes: list[dict[str, Any]] = []
    mpl = False

    def walk(el: etree._Element, m: Matrix, inh: dict[str, str], ctx: dict[str, Any]) -> None:
        nonlocal mpl
        tag = _local(el.tag)
        if not tag or tag in _SKIP:
            return
        st = dict(inh)
        st.update(_style(el))
        if st.get("display") == "none" or st.get("visibility") == "hidden":
            return
        m2 = mul(m, parse_transform(el.get("transform")))
        c = dict(ctx)
        eid = el.get("id") or ""
        if eid:
            c["ids"] = ctx["ids"] + (eid,)
            if eid.startswith(("axes_", "patch_", "figure_")):
                mpl = True
        if el.get("data-axis") is not None and ctx.get("axis") is None:
            c["axis"] = el.get("data-axis")
            c["axisKey"] = len(axes)
            # `spine`: penanda eksplisit Node `data-spine="1"` (garis spine, D-300/D-301)
            axes.append({"orient": el.get("data-axis"), "lines": [], "texts": [],
                         "spine": str(el.get("data-spine") or "").lower() in ("1", "true")})
        if el.get("data-panel") is not None:
            c["panel"] = el.get("data-panel")
        mark_here = el.get("data-mark")
        if mark_here is not None:
            c["markKey"] = len(marks)
            marks.append({"type": mark_here, "series": el.get("data-series"), "index": el.get("data-index"),
                          "panel": c.get("panel"), "fill": None, "stroke": None, "bboxes": [],
                          # subjek aksen D-108 (DATUM-26): data-accent-group > data-accent="series" > series#index
                          "accentGroup": el.get("data-accent-group"),
                          "accentSeries": el.get("data-accent") == "series",
                          "rule": el.get("data-rule") is not None})
        if tag in _SHAPES:
            fill = norm_color(st.get("fill", "#000000")) if tag != "line" else None
            stroke = norm_color(st.get("stroke"))
            sw = st.get("stroke-width")
            sw_mm = None
            if stroke is not None:
                swu = _font_user(sw) if sw else 1.0
                sw_mm = (swu or 0.0) * mscale(m2)
            dash = st.get("stroke-dasharray")
            dash_mm = None
            if dash and dash.strip().lower() != "none":
                dash_mm = tuple(round(float(x) * mscale(m2), 2) for x in _NUM.findall(dash))
            geo = _geom(tag, el, m2)
            rec: dict[str, Any] = {"tag": tag, "fill": fill, "stroke": stroke, "strokeWidthMm": sw_mm,
                                   "dashMm": dash_mm, "geo": geo, "bbox": _bbox(tag, geo),
                                   "ids": c["ids"], "axis": c.get("axis"), "axisKey": c.get("axisKey"),
                                   "markKey": c.get("markKey"), "panel": c.get("panel"),
                                   "dataMark": mark_here, "attrs": dict(el.attrib)}
            if tag == "text":
                rec["text"] = norm_text("".join(el.itertext()))
                fs = _font_user(st.get("font-size", "16"))
                rec["fontRaw"] = float(_LEN.match(st.get("font-size", "16")).group(1)) if fs is not None else None
                rec["fontPt"] = (fs * mscale(m2) / MM_PER_PT) if fs is not None else None
                rec["fontFamily"] = st.get("font-family")
            elems.append(rec)
            if tag in ("text",):
                return  # tspan termasuk dalam teks induk
        for ch in el:
            walk(ch, m2, st, c)

    walk(root, base, {}, {"ids": ()})

    # buang latar paper dan teks non-data acuan
    area = w_mm * h_mm
    kept = []
    for e in elems:
        b = e["bbox"]
        if (e["dataMark"] is None and e["markKey"] is None and e["tag"] in ("rect", "path") and b
                and e["fill"] is not None and (b[2] - b[0]) * (b[3] - b[1]) >= 0.99 * area
                and b[0] <= 0.01 * w_mm and b[1] <= 0.01 * h_mm):
            continue
        if e["tag"] == "text" and (not e["text"] or any(p.search(e["text"]) for p in NON_DATA_TEXT)):
            continue
        kept.append(e)
    elems = kept

    for e in elems:
        if e["markKey"] is not None:
            mk = marks[e["markKey"]]
            if mk["fill"] is None and mk["stroke"] is None and e["tag"] != "text":
                mk["fill"], mk["stroke"] = e["fill"], e["stroke"]
            if e["bbox"]:
                mk["bboxes"].append(e["bbox"])
        if e["axisKey"] is not None:
            ax = axes[e["axisKey"]]
            if e["tag"] == "text":
                ax["texts"].append(e["text"])
            elif e["tag"] in ("line", "path", "polyline"):
                ax["lines"].append(e)

    return {"path": path, "widthMm": w_mm, "heightMm": h_mm, "viewBox": vb, "userToMm": k,
            "elements": elems, "marks": marks, "axisGroups": axes, "matplotlib": mpl,
            "root": root}
