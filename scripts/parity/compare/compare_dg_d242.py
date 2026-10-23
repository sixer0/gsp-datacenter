"""Kelas vonis diagram D-242 (FIX-H, D-298): paritas diagram BUKAN byte Python.

USER D-242 (K-1) sengaja memutus paritas byte dengan skrip Garis A untuk diagram: tinggi simpul dan jarak
tingkat mengikuti aturan mesin baru (D-242, D-288, D-290). Byte/geometri Python tetap dilaporkan sebagai
diagnosis (`d.rootSize`, `geometry`); vonis resmi DG ditentukan cek gerbang berikut (logika setara
`tests/parity/out/sr47/diagram_d242/sr47_d242.py`, SR-47):

(a) `d242.structure` urutan tag, urutan teks, urutan id simpul (`data-node`), gaya tepi berurutan
    (stroke, dasharray, marker), dan pasangan ujung tepi -> simpul terdekat identik.
    `d242.engine` laporan mesin: n_nodes, n_edges, n_hops, colour_values, n_colour, apparatus, family identik.
(b) `d242.datum` 20 cek DATUM `checks_run` mesin = Python, dan lint artefak Node (konteks `nodeLint`)
    tanpa FAIL. (Lint artefak FAIL pra-ada tetap FAIL, mis. DATUM-32 `dg_rack`, IP-81.)
(c) `d242.horizontal` pusat-x setiap simpul dan lebar simpul non-lingkaran dalam `geomTolMm`, lebar akar
    dalam `rootTolMm` (geometri horizontal tidak diubah D-242).
    `d242.vertical` beda tinggi TERJELASKAN aturan: (i) tinggi setiap simpul = tinggi Python x rasio
    famili (`d242NodeHeightRatio`: K-1 = 1/2; graph D-288 = 1/3; rack tidak berubah = 1) dalam
    `d242TolL` baseline; (ii) baris simpul (tepi atas sama) beserta urutan id di tiap baris dan urutan
    baris identik; (iii) margin atas/bawah lembar Node = kelipatan bulat baseline (D-290 kotak pembatas
    + padding baseline); (iv) setiap simpul di dalam lembar.
L = 1 baseline = 13,5 pt = 4,7625 mm (LATTICE_Y).
"""
from __future__ import annotations

import re
import xml.etree.ElementTree as ET
from typing import Any

from common import Checks, r

L_MM = 13.5 * 25.4 / 72.0
_NS = "{http://www.w3.org/2000/svg}"
_NUM = re.compile(r"-?\d+(?:\.\d+)?")
_TOK = re.compile(r"[MmLlHhVvAaZzCcQqSsTt]|-?\d*\.?\d+(?:e-?\d+)?")
_ARGN = {"M": 2, "L": 2, "H": 1, "V": 1, "A": 7, "Z": 0, "C": 6, "Q": 4, "S": 4, "T": 2}
ENGINE_KEYS = ("n_nodes", "n_edges", "n_hops", "colour_values", "n_colour", "apparatus", "family")


def _tag(el: ET.Element) -> str:
    return el.tag.replace(_NS, "")


def _f(v: Any) -> float | None:
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _path_points(d: str) -> list[tuple[float, float]]:
    toks = _TOK.findall(d)
    out: list[tuple[float, float]] = []
    i, cmd = 0, "M"
    cx = cy = sx = sy = 0.0
    while i < len(toks):
        t = toks[i]
        if t.isalpha():
            cmd = t
            i += 1
            if cmd in "Zz":
                cx, cy = sx, sy
                out.append((cx, cy))
                continue
        n = _ARGN[cmd.upper()]
        a = [float(x) for x in toks[i:i + n]]
        i += n
        if len(a) < n:
            break
        rel, u = cmd.islower(), cmd.upper()
        if u == "H":
            cx = a[0] + (cx if rel else 0)
        elif u == "V":
            cy = a[0] + (cy if rel else 0)
        else:
            cx, cy = (cx + a[-2], cy + a[-1]) if rel else (a[-2], a[-1])
        if u == "M":
            sx, sy = cx, cy
            cmd = "l" if rel else "L"
        out.append((cx, cy))
    return out


def _points(el: ET.Element) -> list[tuple[float, float]]:
    t = _tag(el)
    if t == "path":
        return _path_points(el.get("d", ""))
    if t in ("polygon", "polyline"):
        nums = [float(x) for x in _NUM.findall(el.get("points", ""))]
        return list(zip(nums[0::2], nums[1::2]))
    return []


def _bbox(el: ET.Element) -> tuple[float, float, float, float] | None:
    t = _tag(el)
    if t == "rect":
        x, y, w, h = (_f(el.get(k)) or 0.0 for k in ("x", "y", "width", "height"))
        return (x, y, x + w, y + h)
    if t in ("circle", "ellipse"):
        cx, cy = _f(el.get("cx")) or 0.0, _f(el.get("cy")) or 0.0
        rx = _f(el.get("r")) or _f(el.get("rx")) or 0.0
        ry = _f(el.get("r")) or _f(el.get("ry")) or 0.0
        return (cx - rx, cy - ry, cx + rx, cy + ry)
    p = _points(el)
    if p:
        xs, ys = [a for a, _ in p], [b for _, b in p]
        return (min(xs), min(ys), max(xs), max(ys))
    return None


def _nearest(pt: tuple[float, float], nodes: list[tuple[str, tuple]]) -> str | None:
    best, bd = None, 1e18
    for nid, (x0, y0, x1, y1) in nodes:
        dx = max(x0 - pt[0], 0.0, pt[0] - x1)
        dy = max(y0 - pt[1], 0.0, pt[1] - y1)
        d = dx * dx + dy * dy
        if d < bd:
            best, bd = nid, d
    return best


def analyse(path: str) -> dict[str, Any]:
    root = ET.parse(path).getroot()
    in_defs = {id(x) for d in root.iter(_NS + "defs") for x in d.iter()}
    body = [e for e in root.iter() if id(e) not in in_defs and _tag(e) != "svg"]
    vb = [float(x) for x in re.split(r"[\s,]+", (root.get("viewBox") or "").strip()) if x]
    if len(vb) != 4:
        raise ValueError(f"{path}: viewBox root tidak terbaca")
    nodes = [(e.get("data-node"), _bbox(e), _tag(e)) for e in body if e.get("data-node")]
    nodes = [(n, bb, t) for n, bb, t in nodes if bb is not None]
    nb = [(n, bb) for n, bb, _ in nodes]
    edges = [e for e in body if _tag(e) == "path" and (e.get("marker-end") or e.get("marker-start"))]
    ends = []
    for e in edges:
        p = _points(e)
        if len(p) >= 2:
            ends.append((_nearest(p[0], nb), _nearest(p[-1], nb)))
    rows: dict[float, list[tuple[str, tuple]]] = {}
    for n, bb in nb:
        rows.setdefault(round(bb[1], 2), []).append((n, bb))
    row_ids = [[n for n, _ in sorted(rows[k], key=lambda x: (x[1][0], x[0]))] for k in sorted(rows)]
    return {
        "width": vb[2], "height": vb[3],
        "tags": [_tag(e) for e in body],
        "texts": ["".join(e.itertext()).strip() for e in body if _tag(e) == "text"],
        "nodeIds": [n for n, _ in nb],
        "nodes": {n: {"bbox": bb, "shape": t} for n, bb, t in nodes},
        "edgeSigs": [(e.get("stroke"), e.get("stroke-dasharray"), e.get("marker-end"), e.get("marker-start")) for e in edges],
        "edgeEnds": ends,
        "rows": row_ids,
        "top": min((bb[1] for _, bb in nb), default=None),
        "bottom": max((bb[3] for _, bb in nb), default=None),
    }


def _lattice(v_mm: float, tol_l: float) -> bool:
    q = v_mm / L_MM
    return abs(q - round(q)) <= tol_l


def compare(ref: str, node: str, th: dict[str, Any], ck: Checks, ctx: dict[str, Any]) -> dict[str, Any]:
    a, b = analyse(ref), analyse(node)
    tol, root_tol, tol_l = float(th["geomTolMm"]), float(th["rootTolMm"]), float(th["d242TolL"])

    struct = {
        "tagsOrdered": a["tags"] == b["tags"],
        "textsOrdered": a["texts"] == b["texts"],
        "nodeIdsOrdered": a["nodeIds"] == b["nodeIds"],
        "edgeStylesOrdered": a["edgeSigs"] == b["edgeSigs"],
        "edgeEndpoints": a["edgeEnds"] == b["edgeEnds"],
    }
    ck.add("d242.structure", all(struct.values()) and bool(a["nodeIds"]), True,
           len(a["nodeIds"]), len(b["nodeIds"]), None, {k: v for k, v in struct.items() if not v} or None)

    eng = ctx.get("engineReport") or {}
    er, en = eng.get("ref") or {}, eng.get("node") or {}
    eng_diff = {k: [er.get(k), en.get(k)] for k in ENGINE_KEYS if er.get(k) != en.get(k)}
    ck.add("d242.engine", bool(er) and bool(en) and not eng_diff, True, None, None, None,
           eng_diff or (None if er and en else "laporan mesin acuan/Node tidak tersedia"))

    checks_equal = bool(er.get("checks_run")) and er.get("checks_run") == en.get("checks_run")
    lint = ctx.get("nodeLint")
    lint_fail = sorted({str(c.get("checkId")) for c in lint if isinstance(c, dict) and c.get("status") == "FAIL"}) if isinstance(lint, list) else []
    ck.add("d242.datum", checks_equal and not lint_fail, True, len(er.get("checks_run") or []), len(en.get("checks_run") or []),
           None, {"checksRunEqualPython": checks_equal, "artifactLintFail": lint_fail,
                  "artifactLint": "tersedia" if isinstance(lint, list) else "tidak diberikan (hanya checks_run dinilai)"})

    family = str(en.get("family") or er.get("family") or "")
    ratios = th.get("d242NodeHeightRatio") or {}
    dx_bad, h_bad = [], []
    max_dx = 0.0
    for n, na in a["nodes"].items():
        nbn = b["nodes"].get(n)
        if nbn is None:
            continue
        (ax0, ay0, ax1, ay1), (bx0, by0, bx1, by1) = na["bbox"], nbn["bbox"]
        dc = abs((ax0 + ax1) / 2 - (bx0 + bx1) / 2)
        dw = 0.0 if na["shape"] in ("circle", "ellipse") else abs((ax1 - ax0) - (bx1 - bx0))
        max_dx = max(max_dx, dc, dw)
        if dc > tol or dw > tol:
            dx_bad.append({"node": n, "dCenterXMm": r(dc, 3), "dWidthMm": r(dw, 3)})
        if family in ratios:
            want = (ay1 - ay0) / L_MM * float(ratios[family])
            got = (by1 - by0) / L_MM
            if abs(want - got) > tol_l:
                h_bad.append({"node": n, "refL": r((ay1 - ay0) / L_MM, 3), "nodeL": r(got, 3), "expectL": r(want, 3)})
    dwid = abs(a["width"] - b["width"])
    ck.add("d242.horizontal", not dx_bad and dwid <= root_tol, True, r(a["width"], 3), r(b["width"], 3), tol,
           {"maxDxMm": r(max_dx, 3), "outOfTol": dx_bad[:20], "dRootWidthMm": r(dwid, 3)})

    top_l = b["top"] / L_MM if b["top"] is not None else None
    bot_l = (b["height"] - b["bottom"]) / L_MM if b["bottom"] is not None else None
    vert = {
        "familyRule": family in ratios,
        "nodeHeights": not h_bad,
        "rowsPreserved": a["rows"] == b["rows"],
        "marginsOnLattice": b["top"] is not None and _lattice(b["top"], tol_l) and _lattice(b["height"] - b["bottom"], tol_l),
        "insideSheet": b["top"] is not None and b["top"] >= -tol and b["bottom"] <= b["height"] + tol,
    }
    ck.add("d242.vertical", all(vert.values()), True, r(a["height"], 3), r(b["height"], 3), tol_l,
           {"family": family, "ratio": ratios.get(family), "failed": [k for k, v in vert.items() if not v],
            "nodeHeightOff": h_bad[:20], "marginTopL": r(top_l, 3), "marginBottomL": r(bot_l, 3),
            "dHeightMm": r(b["height"] - a["height"], 3)})

    return {"class": "D-242 (bukan byte Python; D-298)", "family": family, "structure": struct,
            "maxDxMm": r(max_dx, 3), "dHeightMm": r(b["height"] - a["height"], 3), "dHeightL": r((b["height"] - a["height"]) / L_MM, 3),
            "rows": len(b["rows"]), "marginTopL": r(top_l, 3), "marginBottomL": r(bot_l, 3),
            "nodeLintFail": lint_fail, "checks": [k for k in ("d242.structure", "d242.engine", "d242.datum", "d242.horizontal", "d242.vertical")]}
