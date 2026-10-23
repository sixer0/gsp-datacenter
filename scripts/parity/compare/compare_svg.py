"""Pembanding struktur SVG (kelas CA, CB1, CB2, CC, DG, SY; research/06 §6.1, §6.2, §6.4).

Besaran: (a) jumlah tanda per jenis, (b) himpunan warna, (c) sumbu, (d) ukuran root mm,
(e) font min pt dan himpunan ukuran, (f) teks/label data, plus geometri bertoleransi per elemen.
(f) CB1 (D-240): gerbang = label isi (nama kategori/seri dari data acuan `chartSpec` di SEMUA teks Node,
label nilai data acuan setelah normalisasi angka); tick, literal acuan (A1), aparatus Node = diagnosis.

Klasifikasi tanda data (sumber klasifikasi):
- `data-mark` (kontrak §3.5) bila ada di sisi itu;
- SVG matplotlib (acuan PC) tanpa `data-mark`: id grup (`mpl_marks`, FIX-3/F-051: penanda `use`,
  koleksi, garis rujukan, isi kertas);
- selain itu (acuan datumchart/diagram): setiap `rect` non-latar adalah tanda.
Gerbang `a.markCount`/`a.markTypes`/`b.markColors` hanya berlaku bila kedua sisi diklasifikasi
dengan sumber yang SAMA (R01/F-050). Bila cara acuan dapat diterapkan pada sisi Node (heuristik rect
DG/CA: atribut `data-*` Node diabaikan = setara pembuangan atribut), sisi Node dihitung ulang dengan
cara itu dan gerbang tetap berlaku; selain itu (acuan matplotlib lawan `data-mark`) cek menjadi
diagnosis (ambang CB1 `markGateCrossSource=true` memulihkan gerbang).

Konteks opsional (`--context`, ditulis runner): `engineReport` {ref, node} laporan mesin diagram
(DG: aturan hitung warna maks = DATUM-25 mesin Python, `checks_run`, hop, simpul, edge) dan
`ports` {ref, node} port simbol dalam mm (SY, research/06 port +/- 0,01 mm), dan `chartSpec` (CB1 (f):
objek spec atau path JSON fixture chart; tanpa itu nama kategori diambil dari label tick kategori acuan).
Font acuan kelas CA dibaca sebagai pt nominal (angka mentah `font-size`, §6.4-N1); sisi Node dan
kelas lain memakai pt fisik (ukuran user x skala root/transform).
"""
from __future__ import annotations

import hashlib
import json
import re
from collections import Counter
from typing import Any

from lxml import etree

from common import Checks, multiset_diff, r
from svgnorm import load

AXIS_MIN_FRAC = 0.30
BASE_TOL_MM = 0.2
REFLINE_FRAC = 0.98    # axhline/axvline: >= 98 % bidang sumbu
EVENT_MIN = 5          # >= 5 garis selebar sumbu sejajar dalam satu sumbu = tanda peristiwa (W-08), bukan rujukan
COLORBAR_FRAC = 0.08   # sumbu tersempit < 8 % lebar SVG = colorbar
_NUMLBL = re.compile(r"^[-+−]?[\d.]*\d(?:,\d+)?\s*%?$")
# (c) nol wajib hanya untuk bar/column/area (research/06 CB1, CH-01); acuan matplotlib: patch + isian.
ZERO_TYPES = {"bar", "column", "area"}
# Acuan tanpa tanda nol yang dapat dinilai (None): `area` Node bisa biola/ridgeline/kerapatan yang mengambang
# menurut rancangan (S-04, S-05), jadi hanya bar/column Node yang tetap wajib bergaris dasar nol.
ZERO_TYPES_UNASSESSED_REF = {"bar", "column"}
MPL_ZERO_TYPES = {"rect", "area"}
ZERO_LINE_ATTRS = ("data-midpoint", "data-zero")
PAPER_COLORS = {"#FCFCFB", "#FFFFFF"}  # token PAPER DATUM dan putih: tidak dihitung pada batas maks warna


# ---------------------------------------------------------------- tanda
def _axes_id(e: dict[str, Any]) -> str | None:
    return next((i for i in e["ids"] if i.startswith("axes_")), None)


def _union(b: tuple | None, x: tuple) -> tuple:
    return x if b is None else (min(b[0], x[0]), min(b[1], x[1]), max(b[2], x[2]), max(b[3], x[3]))


def axes_boxes(s: dict[str, Any]) -> dict[str, tuple[float, float, float, float]]:
    """Kotak bidang sumbu matplotlib per `axes_N`: gabungan patch latar (isi kertas) dan spine (tanpa isi).

    Tanpa patch seperti itu: gabungan semua elemen bergeometri di sumbu itu.
    """
    frame: dict[str, tuple] = {}
    every: dict[str, tuple] = {}
    for e in s["elements"]:
        ax = _axes_id(e)
        if ax is None or not e["bbox"]:
            continue
        every[ax] = _union(every.get(ax), e["bbox"])
        grp = e["ids"][-1] if e["ids"] else ""
        if any(i.startswith("table_") for i in e["ids"]):
            continue  # sel tabel bukan latar/spine
        if grp.startswith("patch_") and (e["fill"] is None or e["fill"] in PAPER_COLORS):
            frame[ax] = _union(frame.get(ax), e["bbox"])
    return {ax: frame.get(ax) or every[ax] for ax in every}


def colorbar_axes(s: dict[str, Any], boxes: dict[str, tuple]) -> set[str]:
    """Sumbu sempit (lebar atau tinggi < COLORBAR_FRAC lebar SVG) = colorbar, bukan bidang data (H6)."""
    lim = COLORBAR_FRAC * s["widthMm"]
    return {ax for ax, b in boxes.items() if len(boxes) > 1 and min(b[2] - b[0], b[3] - b[1]) < lim}


def _refline_orient(e: dict[str, Any], box: tuple | None) -> str | None:
    """`axhline`/`axvline`: garis lurus dua titik selebar/setinggi penuh bidang sumbu (H4) -> "h"/"v"."""
    g = e["geo"]
    if box is None or e["tag"] not in ("line", "path", "polyline") or len(g) != 4:
        return None
    x1, y1, x2, y2 = g
    if abs(y1 - y2) < 1e-3 and abs(x2 - x1) >= REFLINE_FRAC * (box[2] - box[0]):
        return "h"
    if abs(x1 - x2) < 1e-3 and abs(y2 - y1) >= REFLINE_FRAC * (box[3] - box[1]):
        return "v"
    return None


def _drop_table_headers(cells: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Sel `ax.table` matplotlib: baris teratas dan kolom terkiri = kepala kolom/baris, bukan sel data.

    Heuristik geometri (tabel >= 2 baris dan >= 2 kolom); sel tanpa bbox dibuang. Dipakai hanya untuk
    hitungan lintas sumber yang bersifat diagnosis (P-15: 24 sel acuan = 15 data + 9 kepala).
    """
    boxed = [c for c in cells if c["bboxes"]]
    if not boxed:
        return []
    tol = BASE_TOL_MM
    if len({round(c["bboxes"][0][1], 1) for c in boxed}) < 2 or len({round(c["bboxes"][0][0], 1) for c in boxed}) < 2:
        return boxed
    top, left = min(c["bboxes"][0][1] for c in boxed), min(c["bboxes"][0][0] for c in boxed)
    return [c for c in boxed if abs(c["bboxes"][0][1] - top) > tol and abs(c["bboxes"][0][0] - left) > tol]


def mpl_marks(s: dict[str, Any]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Tanda data SVG matplotlib (acuan PC) menurut id grup, plus garis rujukan (`axhline`/`axvline`).

    - `patch_N` berisi isi non-kertas = `rect` (latar sumbu, spine, dan sel kosong berwarna kertas
      dibuang; tidak lagi "patch pertama = latar", H1/H11);
    - `line2d_N`: path = satu `line` per grup, kecuali garis rujukan selebar sumbu (H4); setiap `use`
      di dalamnya = penanda `point` (H2);
    - `PathCollection_N` -> `point`; `PolyCollection_N`/`FillBetweenPolyCollection_N` (path atau `use`
      ke defs) -> `area`; `LineCollection_N` -> `segment` per path; `*ContourSet_N` -> `contour` per
      path; `image` di bidang sumbu -> `image` (H3);
    - elemen di `matplotlib.axis_*`, `legend_*`, dan sumbu colorbar tidak dihitung (H6);
    - garis selebar sumbu yang muncul >= EVENT_MIN kali sejajar dalam satu sumbu = tanda peristiwa
      `line` (plot peristiwa/rug W-08, satu `axvline` per peristiwa), bukan garis rujukan (SR-40);
    - sel `table_N` -> `cell` apa pun isinya (sel tabel berwarna kertas menurut rancangan), kepala
      baris/kolom dibuang (SR-40, P-15).
    Isi berwarna kertas pada koleksi juga dibuang (sel heksbin kosong). Dekomposisi boxplot (H12)
    tetap tidak setara dengan tanda Node; karena itu hitungan lintas sumber hanya diagnosis.
    """
    boxes = axes_boxes(s)
    cbar = colorbar_axes(s, boxes)
    marks: list[dict[str, Any]] = []
    refl_cand: dict[tuple, list[dict[str, Any]]] = {}
    tables: dict[tuple, list[dict[str, Any]]] = {}
    groups: dict[tuple, dict[str, Any]] = {}

    def mk(t: str, e: dict[str, Any]) -> dict[str, Any]:
        return {"type": t, "fill": e["fill"], "stroke": e["stroke"], "bboxes": [e["bbox"]] if e["bbox"] else []}

    def add(t: str, e: dict[str, Any]) -> None:
        marks.append(mk(t, e))

    for e in s["elements"]:
        ids = e["ids"]
        axes = _axes_id(e)
        if axes is None or axes in cbar or e["tag"] == "text":
            continue
        if any(i.startswith(("matplotlib.axis", "legend")) for i in ids):
            continue
        grp = ids[-1] if ids else ""
        paper = e["fill"] in PAPER_COLORS and (e["stroke"] is None or e["stroke"] in PAPER_COLORS)
        table = next((i for i in ids if i.startswith("table_")), None)
        if table is not None and grp.startswith("patch_") and e["tag"] in ("path", "rect"):
            tables.setdefault((axes, table), []).append(mk("cell", e))
        elif grp.startswith("patch_") and e["tag"] in ("path", "rect"):
            if e["fill"] is None or e["fill"] in PAPER_COLORS:
                continue
            add("rect", e)
        elif grp.startswith("line2d_"):
            if e["tag"] == "use":
                add("point", e)
            elif e["tag"] in ("path", "line", "polyline"):
                orient = _refline_orient(e, boxes.get(axes))
                if orient is not None:
                    refl_cand.setdefault((axes, orient), []).append(e)
                    continue
                key = (axes, grp)
                if key not in groups:
                    groups[key] = {"type": "line", "fill": None, "stroke": e["stroke"], "bboxes": [e["bbox"]] if e["bbox"] else []}
                elif e["bbox"]:
                    groups[key]["bboxes"].append(e["bbox"])
        elif any(i.startswith("PathCollection_") for i in ids) and e["tag"] in ("use", "path", "circle"):
            if not paper:
                add("point", e)
        elif e["tag"] in ("path", "use") and any(
                i.startswith(("PolyCollection_", "FillBetweenPolyCollection_", "QuadMesh_")) for i in ids):
            if not paper:
                add("area", e)
        elif any(i.startswith("LineCollection_") for i in ids) and e["tag"] in ("path", "line", "polyline"):
            add("segment", e)
        elif any(re.match(r"^\w*ContourSet_", i) for i in ids) and e["tag"] == "path":
            add("contour", e)
        elif e["tag"] == "image":
            add("image", e)
    refl: list[dict[str, Any]] = []
    for lines in refl_cand.values():
        if len(lines) >= EVENT_MIN:
            marks.extend(mk("line", e) for e in lines)
        else:
            refl.extend(lines)
    for cells in tables.values():
        marks.extend(_drop_table_headers(cells))
    return marks + list(groups.values()), refl


def rect_marks(s: dict[str, Any]) -> list[dict[str, Any]]:
    """Heuristik acuan datumchart/diagram: setiap `rect` non-latar = tanda (atribut `data-*` diabaikan)."""
    return [{"type": "rect", "fill": e["fill"], "stroke": e["stroke"], "bboxes": [e["bbox"]]}
            for e in s["elements"] if e["tag"] == "rect" and e["bbox"]]


SRC_DATA_MARK = "data-mark"
SRC_MPL = "matplotlib-id"
SRC_RECT = "rect (heuristik datumchart)"


def native_source(s: dict[str, Any]) -> str:
    if s["marks"]:
        return SRC_DATA_MARK
    if s["matplotlib"]:
        return SRC_MPL
    return SRC_RECT


def applicable(src: str, s: dict[str, Any]) -> bool:
    """Apakah cara klasifikasi `src` dapat diterapkan pada sisi `s` (rect berlaku untuk SVG apa pun)."""
    return src == SRC_RECT or (src == SRC_MPL and s["matplotlib"]) or (src == SRC_DATA_MARK and bool(s["marks"]))


def marks_by(s: dict[str, Any], src: str) -> list[dict[str, Any]]:
    if src == SRC_DATA_MARK:
        return s["marks"]
    if src == SRC_MPL:
        return mpl_marks(s)[0]
    return rect_marks(s)


def marks_of(s: dict[str, Any]) -> tuple[list[dict[str, Any]], str]:
    """Tanda menurut sumber klasifikasi asli sisi itu (kompatibel dengan pemanggil lama)."""
    src = native_source(s)
    return marks_by(s, src), src


def accent_subjects(marks: list[dict[str, Any]], accent: str) -> list[str]:
    """Subjek beraksen D-108 (= DATUM-26 mesin `core/guards.ts accentSubjectKey`); `data-rule` dilewati."""
    acc = accent.upper()
    keys = set()
    for m in marks:
        if m.get("rule") or not (m.get("fill") == acc or m.get("stroke") == acc):
            continue
        if m.get("accentGroup") is not None:
            keys.add(f"group:{m['accentGroup']}")
        elif m.get("accentSeries"):
            keys.add(f"series:{m.get('series') or ''}")
        else:
            keys.add(f"{m.get('series') or ''}#{m.get('index') or ''}")
    return sorted(keys)


# ---------------------------------------------------------------- sumbu
def _straight(e: dict[str, Any]) -> tuple[str, float, float, float] | None:
    g = e["geo"]
    if e["tag"] not in ("line", "path", "polyline") or len(g) != 4 or e["dashMm"]:
        return None
    x1, y1, x2, y2 = g
    if abs(y1 - y2) < 1e-3 and abs(x1 - x2) > 1e-3:
        return ("x", y1, min(x1, x2), max(x1, x2))
    if abs(x1 - x2) < 1e-3 and abs(y1 - y2) > 1e-3:
        return ("y", x1, min(y1, y2), max(y1, y2))
    return None


def _num(t: str) -> float | None:
    t = t.replace("−", "-").replace("%", "").strip()
    if not _NUMLBL.match(t):
        return None
    try:
        return float(t.replace(".", "").replace(",", "."))
    except ValueError:
        return None


def axes_of(s: dict[str, Any]) -> dict[str, Any]:
    """Deskripsi sumbu: jumlah, orientasi, garis sumbu (posisi mm), domain numerik, jumlah tick.

    D-300 (simetris): garis spine TANPA tick = bingkai/garis dasar, bukan sumbu, di KEDUA sisi. Matplotlib:
    sumbu tanpa tick tidak dihitung (H6) tetapi garis `patch_*` tetap kandidat garis dasar; Node: grup
    `data-axis` bertanda `data-spine="1"` tanpa teks tick tidak dihitung, garis panjangnya tetap garis dasar.
    Grup `data-axis` TANPA penanda spine tetap sumbu walau tanpa teks (label kategori di luar grup)."""
    lines: list[tuple[str, float, float, float]] = []
    groups: list[dict[str, Any]] = []
    if s["axisGroups"]:
        src = "data-axis"
        for ax in s["axisGroups"]:
            nums = [v for v in (_num(t) for t in ax["texts"]) if v is not None]
            own = [x for x in (_straight(e) for e in ax["lines"]) if x]
            long_ = [x for x in own if (x[3] - x[2]) >= AXIS_MIN_FRAC * (s["widthMm"] if x[0] == "x" else s["heightMm"])]
            lines += long_
            if ax.get("spine") and not ax["texts"]:
                continue  # D-300: spine tanpa tick = bingkai/garis dasar (setara H6 sisi matplotlib)
            groups.append({"orient": ax["orient"], "ticks": len(ax["texts"]),
                           "domain": [min(nums), max(nums)] if nums else None})
    elif s["matplotlib"]:
        src = "matplotlib-id"
        cbar = colorbar_axes(s, axes_boxes(s))
        by: dict[tuple, dict[str, Any]] = {}
        for e in s["elements"]:
            ax = next((i for i in e["ids"] if i.startswith("matplotlib.axis")), None)
            if ax is None or _axes_id(e) in cbar:
                continue  # H6: sumbu colorbar bukan sumbu data
            d = by.setdefault((_axes_id(e), ax), {"orient": None, "tickIds": set(), "nums": []})
            for i in e["ids"]:
                if i.startswith("xtick_"):
                    d["orient"] = "x"
                    d["tickIds"].add(i)
                elif i.startswith("ytick_"):
                    d["orient"] = "y"
                    d["tickIds"].add(i)
            if e["tag"] == "text":
                v = _num(e["text"])
                if v is not None:
                    d["nums"].append(v)
        for d in by.values():
            if not d["tickIds"]:
                continue  # H6: sumbu tanpa tick (dimatikan) tidak dihitung
            groups.append({"orient": d["orient"], "ticks": len(d["tickIds"]),
                           "domain": [min(d["nums"]), max(d["nums"])] if d["nums"] else None})
        for e in s["elements"]:
            if e["fill"] is None and any(i.startswith("patch_") for i in e["ids"][-1:]):
                x = _straight(e)
                if x:
                    lines.append(x)
    else:
        src = "garis lurus panjang (heuristik)"
        for e in s["elements"]:
            if e["markKey"] is not None:
                continue
            x = _straight(e)
            if x and (x[3] - x[2]) >= AXIS_MIN_FRAC * (s["widthMm"] if x[0] == "x" else s["heightMm"]):
                lines.append(x)
        for o in sorted({x[0] for x in lines}):
            groups.append({"orient": o, "ticks": None, "domain": None})
    return {"source": src, "count": len(groups), "orientations": sorted(str(g["orient"]) for g in groups),
            "groups": groups, "lines": sorted(lines)}


def zero_lines(s: dict[str, Any], axes: dict[str, Any], extra: list[dict[str, Any]] | None = None) -> list[tuple]:
    """Garis dasar kandidat: garis sumbu panjang + garis nol bertanda Node (`data-midpoint`, `data-zero`)
    + garis rujukan acuan (`axhline`/`axvline`)."""
    out = list(axes["lines"])
    for e in s["elements"]:
        a = e["attrs"]
        if any(k in a and str(a[k]) in ("0", "1", "true") for k in ZERO_LINE_ATTRS):
            x = _straight_any(e)
            if x:
                out.append(x)
    for e in extra or []:
        x = _straight_any(e)
        if x:
            out.append(x)
    return out


def _straight_any(e: dict[str, Any]) -> tuple[str, float, float, float] | None:
    g = e["geo"]
    if e["tag"] not in ("line", "path", "polyline") or len(g) != 4:
        return None
    x1, y1, x2, y2 = g
    if abs(y1 - y2) < 1e-3 and abs(x1 - x2) > 1e-3:
        return ("x", y1, min(x1, x2), max(x1, x2))
    if abs(x1 - x2) < 1e-3 and abs(y1 - y2) > 1e-3:
        return ("y", x1, min(y1, y2), max(y1, y2))
    return None


def _bbox_of(m: dict[str, Any]) -> tuple[float, float, float, float]:
    bs = m["bboxes"]
    return (min(b[0] for b in bs), min(b[1] for b in bs), max(b[2] for b in bs), max(b[3] for b in bs))


def _clusters(boxes: list[tuple]) -> list[list[int]]:
    """Komponen terhubung kotak yang bersentuhan/bertumpuk (tumpukan, kolom mekko, batang divergen)."""
    n = len(boxes)
    parent = list(range(n))

    def find(i: int) -> int:
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    t = BASE_TOL_MM
    for i in range(n):
        for j in range(i + 1, n):
            a, b = boxes[i], boxes[j]
            if a[0] <= b[2] + t and b[0] <= a[2] + t and a[1] <= b[3] + t and b[1] <= a[3] + t:
                parent[find(i)] = find(j)
    out: dict[int, list[int]] = {}
    for i in range(n):
        out.setdefault(find(i), []).append(i)
    return list(out.values())


def zero_baseline(marks: list[dict[str, Any]], lines: list[tuple], types: set[str] = ZERO_TYPES) -> bool | None:
    """(c) garis dasar nol (FIX-3/F-051 H5): None bila tidak ada tanda bar/column/area; True bila setiap
    kelompok tanda yang bersentuhan (tumpukan, mekko, divergen) punya minimal satu tanda yang menyentuh
    garis dasar (sumbu, garis nol titik tengah Node, garis rujukan acuan); False bila tidak.
    `interval`/`box`/`segment` tidak dinilai (mengambang menurut definisinya)."""
    rl = [m for m in marks if m["type"] in types and m["bboxes"]]
    if not rl:
        return None
    hy = [p for o, p, _, _ in lines if o == "x"]
    vx = [p for o, p, _, _ in lines if o == "y"]
    if not hy and not vx:
        return False
    boxes = [_bbox_of(m) for m in rl]

    def touches(b: tuple) -> bool:
        on_h = any(abs(y - h) <= BASE_TOL_MM for h in hy for y in (b[1], b[3]))
        return on_h or any(abs(x - v) <= BASE_TOL_MM for v in vx for x in (b[0], b[2]))

    return all(any(touches(boxes[i]) for i in grp) for grp in _clusters(boxes))


# ---------------------------------------------------------------- font, warna, teks
def fonts_of(s: dict[str, Any], nominal: bool) -> list[float]:
    key = "fontRaw" if nominal else "fontPt"
    return [round(e[key], 1) for e in s["elements"] if e["tag"] == "text" and e.get(key) is not None]


def colors_of(s: dict[str, Any]) -> list[str]:
    return sorted({c for e in s["elements"] for c in (e["fill"], e["stroke"]) if c})


def texts_of(s: dict[str, Any], exclude_axis_titles: bool = False) -> list[str]:
    out = []
    for e in s["elements"]:
        if e["tag"] != "text":
            continue
        if exclude_axis_titles:
            a = e["attrs"]
            if a.get("data-role") == "axis-title" or "data-axis-title" in a:
                continue
            ids = e["ids"]
            if any(i.startswith("matplotlib.axis") for i in ids) and not any(
                    i.startswith(("xtick_", "ytick_")) for i in ids):
                continue  # label sumbu matplotlib
        out.append(e["text"])
    return out


_ID_NUM = re.compile(r"^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?$")   # 1.234,5 / 1234,5 (format DATUM)
_EN_NUM = re.compile(r"^(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?$")   # 1,234.5 / 1234.5 (matplotlib)
_SPACES = re.compile(r"[\s   ]+")


def label_key(t: str) -> tuple:
    """Kunci label ternormalisasi (F-051 H7): spasi, tanda minus U+2212, spasi sebelum `%`, dan format
    angka (desimal `,`/`.`, pemisah ribuan) disetarakan. Angka -> ("num", {nilai kandidat}, persen)."""
    u = _SPACES.sub(" ", t.replace("−", "-")).strip()
    u = re.sub(r"\s+%", "%", u)
    pct = u.endswith("%")
    core = u[:-1].strip() if pct else u
    sign = -1.0 if core.startswith("-") else 1.0
    digits = core.lstrip("+-").strip()
    cands = set()
    if _ID_NUM.match(digits):
        cands.add(round(sign * float(digits.replace(".", "").replace(",", ".")), 6))
    if _EN_NUM.match(digits):
        cands.add(round(sign * float(digits.replace(",", "")), 6))
    if cands:
        return ("num", frozenset(cands), pct)
    return ("txt", u)


def label_set_diff(xa: list[str], xb: list[str]) -> dict[str, list[str]]:
    """Selisih himpunan label setelah normalisasi; angka cocok bila himpunan nilai kandidat beririsan."""
    ka: dict[tuple, str] = {}
    kb: dict[tuple, str] = {}
    for t in xa:
        ka.setdefault(label_key(t), t)
    for t in xb:
        kb.setdefault(label_key(t), t)

    def match(k: tuple, other: dict) -> bool:
        if k in other:
            return True
        if k[0] != "num":
            return False
        return any(o[0] == "num" and o[2] == k[2] and (o[1] & k[1]) for o in other)

    return {"onlyRef": sorted(t for k, t in ka.items() if not match(k, kb)),
            "onlyNode": sorted(t for k, t in kb.items() if not match(k, ka))}


# ---------------------------------------------------------------- (f) label isi (D-240)
# Gerbang (f) = label ISI saja: (1) nama kategori/seri dari data acuan (spec fixture, konteks `chartSpec`)
# harus ada di SEMUA teks SVG Node; (2) setiap label nilai data acuan harus ada di teks Node setelah
# normalisasi angka. Diagnosis (tidak menggerbang): nilai tick pilihan skala, teks literal skrip acuan
# (legenda/anotasi, A1), dan teks aparatus Node (KUNCI, satuan, label nilai tambahan).
_SPEC_LISTS = ("categories", "rows", "cols")
_SPEC_ITEMS = (("series", "name"), ("groups", "name"), ("points", "label"), ("points", "sub"),
               ("items", "label"), ("nodes", "label"), ("tiles", "label"))


def spec_names(spec: Any) -> list[str]:
    """Nama kategori/seri dari `data` spec chart (fixture = data yang disuntikkan ke acuan)."""
    data = spec.get("data") if isinstance(spec, dict) else None
    if not isinstance(data, dict):
        return []
    out: list[str] = []

    def take(v: Any) -> None:
        if isinstance(v, str) and v.strip() and v not in out:
            out.append(v)

    for k in _SPEC_LISTS:
        for v in data.get(k) or []:
            take(v)
    for k, f in _SPEC_ITEMS:
        for it in data.get(k) or []:
            if isinstance(it, dict):
                take(it.get(f))
    inner = data.get("spec")  # chart diagram (G-04): label simpul dan edge
    if isinstance(inner, dict):
        for k in ("nodes", "edges"):
            for it in inner.get(k) or []:
                if isinstance(it, dict):
                    take(it.get("label"))
    return out


def load_chart_spec(ctx: dict[str, Any]) -> dict[str, Any] | None:
    """Konteks `chartSpec`: objek spec atau path JSON fixture chart. Galat baca dilempar (exit 2 di CLI)."""
    sp = ctx.get("chartSpec")
    if sp is None:
        return None
    if isinstance(sp, str):
        with open(sp, encoding="utf-8") as fh:
            sp = json.load(fh)
    if not isinstance(sp, dict):
        raise ValueError("konteks chartSpec harus objek spec atau path JSON")
    return sp


def _ntxt(t: str) -> str:
    return _SPACES.sub(" ", t.replace("−", "-")).strip().casefold()


def _is_num(t: str) -> bool:
    return label_key(t)[0] == "num"


def _num_in(t: str, keys: list[tuple]) -> bool:
    """Angka `t` cocok dengan salah satu kunci angka (nilai kandidat beririsan; tanda `%` diabaikan)."""
    k = label_key(t)
    return k[0] == "num" and any(o[0] == "num" and (o[1] & k[1]) for o in keys)


def _name_in(name: str, texts: list[str], joined: str) -> bool:
    """Nama ada di teks Node: sama persis (ternormalisasi) atau termuat dalam gabungan teks berurutan
    (label kategori yang dibungkus ke beberapa baris)."""
    if _is_num(name):
        return _num_in(name, [label_key(t) for t in texts])
    n = _ntxt(name)
    return any(_ntxt(t) == n for t in texts) or n in joined


def _text_roles(s: dict[str, Any]) -> dict[str, list[str]]:
    """Kelompokkan teks satu sisi: `tick` (label tick sumbu), `title` (judul sumbu), `body` (lainnya:
    label nilai, anotasi, legenda, KUNCI). Matplotlib: id grup; selain itu: grup `data-axis`."""
    roles: dict[str, list[str]] = {"tick": [], "title": [], "body": [], "legend": []}
    cbar = colorbar_axes(s, axes_boxes(s)) if s["matplotlib"] else set()
    for e in s["elements"]:
        if e["tag"] != "text":
            continue
        ids = e["ids"]
        if s["matplotlib"]:
            if _axes_id(e) in cbar:
                continue
            if any(i.startswith(("xtick_", "ytick_")) for i in ids):
                roles["tick"].append(e["text"])
            elif any(i.startswith("matplotlib.axis") for i in ids):
                roles["title"].append(e["text"])
            elif any(i.startswith("legend") for i in ids):
                roles["legend"].append(e["text"])
            else:
                roles["body"].append(e["text"])
        else:
            a = e["attrs"]
            if a.get("data-role") == "axis-title" or "data-axis-title" in a:
                roles["title"].append(e["text"])
            elif e["axis"] is not None:
                roles["tick"].append(e["text"])
            else:
                roles["body"].append(e["text"])
    return roles


def content_labels(a: dict[str, Any], b: dict[str, Any], ctx: dict[str, Any], ck: Checks,
                   names_require_ref: bool = False) -> dict[str, Any]:
    """(f) D-240: gerbang label isi + tiga cek diagnosis (`f.ticks`, `f.refLiterals`, `f.nodeExtra`).

    Nama data yang hilang di Node dan JUGA tidak tampak di acuan (tick/badan/legenda; judul sumbu literal
    dikecualikan) dilaporkan di `absentInRef`. Bawaan D-246 (`labelNamesRequireRef=true`): nama itu
    diagnosis; `false` = D-240 harfiah (tetap menggerbang). Nilai data selalu digerbang.
    """
    ra, rb = _text_roles(a), _text_roles(b)
    node_all = [e["text"] for e in b["elements"] if e["tag"] == "text"]
    joined = " ".join(_ntxt(t) for t in node_all)
    node_keys = [label_key(t) for t in node_all]
    spec = load_chart_spec(ctx)
    if spec is not None:
        names, src = spec_names(spec), "chartSpec (data acuan)"
    else:
        # Tanpa spec: kategori = label tick non-angka acuan (sumbu kategori dibentuk dari data); seri
        # tidak dapat dibedakan dari legenda literal (A1), jadi tidak digerbang.
        names, src = sorted({t for t in ra["tick"] if not _is_num(t)}), "label tick kategori acuan (tanpa chartSpec)"
    ref_values = sorted({t for t in ra["body"] if _is_num(t)})
    miss_names = [n for n in names if not _name_in(n, node_all, joined)]
    ref_shown = ra["tick"] + ra["body"] + ra["legend"]
    shown_joined = " ".join(_ntxt(t) for t in ref_shown)
    absent_ref = [n for n in miss_names if not _name_in(n, ref_shown, shown_joined)]
    gate_names = [n for n in miss_names if n not in absent_ref] if names_require_ref else miss_names
    miss_values = [v for v in ref_values if not _num_in(v, node_keys)]
    ck.add("f.labels", not gate_names and not miss_values, True, {"names": len(names), "values": len(ref_values)},
           len(node_all), None, {"missingNames": miss_names, "missingValues": miss_values, "absentInRef": absent_ref,
                                 "namesGated": gate_names, "namesSource": src})

    ticks = label_set_diff(sorted(set(ra["tick"])), sorted(set(rb["tick"])))
    ck.add("f.ticks", not ticks["onlyRef"] and not ticks["onlyNode"], False, len(set(ra["tick"])),
           len(set(rb["tick"])), None, {**ticks, "class": "nilai tick pilihan skala (diagnosis D-240)"})
    lits = sorted({t for t in ra["body"] + ra["legend"] if not _is_num(t) and not _name_in(t, node_all, joined)})
    ck.add("f.refLiterals", not lits, False, None, None, None,
           {"onlyRef": lits, "class": "teks literal skrip acuan, legenda/anotasi (A1, diagnosis D-240)"})
    ref_all = ra["tick"] + ra["title"] + ra["body"] + ra["legend"]
    ref_keys = [label_key(t) for t in ref_all]
    ref_joined = " ".join(_ntxt(t) for t in ref_all)
    extra = sorted({t for t in rb["body"] if not (_num_in(t, ref_keys) if _is_num(t) else
                    (_name_in(t, ref_all, ref_joined) or any(_ntxt(t) == _ntxt(n) for n in names)))})
    ck.add("f.nodeExtra", not extra, False, None, None, None,
           {"onlyNode": extra, "class": "aparatus Node (KUNCI, satuan, label nilai tambahan; diagnosis D-240)"})
    return {"names": names, "namesSource": src, "refValues": ref_values}


def geometry(a: dict[str, Any], b: dict[str, Any], tol: float) -> dict[str, Any]:
    ea, eb = a["elements"], b["elements"]
    tags_a, tags_b = [e["tag"] for e in ea], [e["tag"] for e in eb]
    if tags_a != tags_b:
        return {"comparable": False, "reason": "urutan/jumlah tag berbeda", "outOfTol": None, "maxDevMm": None}
    out, worst = [], 0.0
    for i, (x, y) in enumerate(zip(ea, eb)):
        gx, gy = x["geo"], y["geo"]
        if len(gx) != len(gy):
            out.append({"element": i + 1, "tag": x["tag"], "reason": "jumlah token geometri beda",
                        "ref": len(gx), "node": len(gy)})
            continue
        dev = max((abs(p - q) for p, q in zip(gx, gy)), default=0.0)
        worst = max(worst, dev)
        if dev > tol:
            out.append({"element": i + 1, "tag": x["tag"], "devMm": r(dev, 4)})
    return {"comparable": True, "outOfTol": out, "maxDevMm": r(worst, 4)}


def _canon(s: dict[str, Any]) -> bytes:
    root = s["root"]
    for c in root.iter(etree.Comment):
        if c.getparent() is not None:
            c.getparent().remove(c)
    return etree.tostring(root, method="c14n")


# ---------------------------------------------------------------- banding
def compare(ref: str, node: str, cls: str, th: dict[str, Any], ck: Checks,
            ctx: dict[str, Any] | None = None) -> dict[str, Any]:
    ctx = ctx or {}
    a, b = load(ref), load(node)
    src_a, src_b_native = native_source(a), native_source(b)
    ma = marks_by(a, src_a)
    mb_native = marks_by(b, src_b_native)
    # Sumber klasifikasi pembandingan: cara acuan bila dapat diterapkan pada sisi Node (R01/F-050).
    if src_a == src_b_native:
        src_b, mb = src_b_native, mb_native
    elif applicable(src_a, b):
        src_b, mb = src_a, marks_by(b, src_a)
    else:
        src_b, mb = src_b_native, mb_native
    same_src = src_a == src_b
    mark_gate = same_src or bool(th.get("markGateCrossSource"))
    refl_a = mpl_marks(a)[1] if src_a == SRC_MPL else []
    ax_a, ax_b = axes_of(a), axes_of(b)
    nominal_ref = bool(th.get("refFontNominalPt"))
    fa, fb = fonts_of(a, nominal_ref), fonts_of(b, False)
    ca, cb = colors_of(a), colors_of(b)
    tags_a = Counter(e["tag"] for e in a["elements"])
    tags_b = Counter(e["tag"] for e in b["elements"])
    zb_a = zero_baseline(ma, zero_lines(a, ax_a, refl_a), MPL_ZERO_TYPES if src_a == SRC_MPL else ZERO_TYPES)
    zb_b = zero_baseline(mb_native, zero_lines(b, ax_b),
                         MPL_ZERO_TYPES if src_b_native == SRC_MPL else ZERO_TYPES)
    mtype_a, mtype_b = Counter(m["type"] for m in ma), Counter(m["type"] for m in mb)

    if "markCountDelta" in th and (src_a != src_b_native or not same_src):
        ck.note("markClassification", {"ref": src_a, "nodeNative": src_b_native, "nodeCompared": src_b,
                                       "gate": mark_gate,
                                       "rule": "gerbang tanda hanya bila sumber klasifikasi sama (R01/F-050)"})

    if "tagCountDelta" in th:
        bad = {t: [tags_a.get(t, 0), tags_b.get(t, 0)] for t in sorted(set(tags_a) | set(tags_b))
               if abs(tags_a.get(t, 0) - tags_b.get(t, 0)) > th["tagCountDelta"]}
        ck.add("a.tagCounts", not bad, True, dict(tags_a), dict(tags_b), th["tagCountDelta"], bad)
    if "markCountDelta" in th:
        ck.add("a.markCount", abs(len(ma) - len(mb)) <= th["markCountDelta"], mark_gate, len(ma), len(mb),
               th["markCountDelta"], None if same_src else {"ref": src_a, "node": src_b})
        if same_src and src_a == SRC_DATA_MARK:
            ck.add("a.markTypes", mtype_a == mtype_b, True, dict(mtype_a), dict(mtype_b))
    if th.get("colorSetIdentical"):
        ck.add("b.colorSet", ca == cb, True, ca, cb, None, multiset_diff(ca, cb))
    if "colorMax" in th:
        na = [c for c in ca if c not in PAPER_COLORS]
        nb = [c for c in cb if c not in PAPER_COLORS]
        eng = ctx.get("engineReport") or {}
        er, en = eng.get("ref") or {}, eng.get("node") or {}
        if isinstance(en.get("n_colour"), int):
            # F-S78-1: aturan hitung warna maks = DATUM-25 mesin (HS datum_diagram.py:1179-1199: nilai token
            # yang benar-benar dipakai mesin, PAPER dibuang), bukan semua fill/stroke SVG.
            ck.add("b.colorMax", en["n_colour"] <= th["colorMax"], True, er.get("n_colour"), en["n_colour"],
                   th["colorMax"], {"rule": "DATUM-25 mesin (n_colour)", "svgCount": {"ref": len(na), "node": len(nb)}})
            ck.add("b.colorMaxSvg", len(nb) <= th["colorMax"], False, len(na), len(nb), th["colorMax"])
        else:
            ck.add("b.colorMax", len(nb) <= th["colorMax"], False, len(na), len(nb), th["colorMax"],
                   "tanpa laporan mesin: hitungan fill/stroke SVG hanya diagnosis (F-S78-1)")
    if th.get("engineReportIdentical") and ctx.get("engineReport"):
        er, en = ctx["engineReport"].get("ref") or {}, ctx["engineReport"].get("node") or {}
        for key, cid in (("checks_run", "engine.checksRun"), ("n_nodes", "engine.nNodes"),
                         ("n_edges", "engine.nEdges"), ("n_hops", "engine.nHops")):
            ck.add(cid, er.get(key) is not None and er.get(key) == en.get(key), True, er.get(key), en.get(key))
        # Diagnosis: nilai warna mesin (IP-39b / D-124 #2 boleh menyimpang dari Garis A secara sengaja).
        ck.add("engine.colourValues", er.get("colour_values") == en.get("colour_values"), False,
               er.get("colour_values"), en.get("colour_values"))
    if th.get("markColorMultisetIdentical"):
        xa = sorted(m["fill"] or m["stroke"] or "-" for m in ma)
        xb = sorted(m["fill"] or m["stroke"] or "-" for m in mb)
        ck.add("b.markColors", xa == xb, mark_gate, len(xa), len(xb), None, multiset_diff(xa, xb))
    acc_subj: list[str] = []
    if "accentMax" in th:
        # H8: dihitung per SUBJEK (D-108) dari tanda asli Node (data-mark), bukan per tanda.
        acc_subj = accent_subjects(mb_native, th["accentColor"])
        ck.add("b.accentCount", len(acc_subj) <= th["accentMax"], True, None, len(acc_subj), th["accentMax"],
               acc_subj)

    if th.get("axesIdentical"):
        tol = th["geomTolMm"]
        la, lb = ax_a["lines"], ax_b["lines"]
        same = len(la) == len(lb) and all(
            p[0] == q[0] and all(abs(u - v) <= tol for u, v in zip(p[1:], q[1:])) for p, q in zip(la, lb))
        ck.add("c.axes", same, True, [list(map(_rnd, x)) for x in la], [list(map(_rnd, x)) for x in lb], tol)
    if th.get("axisCountIdentical"):
        ck.add("c.axisCount", ax_a["count"] == ax_b["count"], True, ax_a["count"], ax_b["count"])
    if th.get("axisOrientationIdentical"):
        ck.add("c.axisOrientation", ax_a["orientations"] == ax_b["orientations"], True,
               ax_a["orientations"], ax_b["orientations"])
    if th.get("zeroBaselineRequired"):
        # Node wajib bergaris dasar nol untuk bar/column/area, kecuali acuan juga tidak (tumpukan/corong/
        # waterfall mengambang menurut rancangan, bukan cacat port). Acuan tak dapat dinilai (None, mis.
        # isian biola lewat defs): hanya bar/column Node yang dinilai (area biola/ridgeline mengambang).
        zb_gate = zb_b
        if zb_a is None and zb_b is False:
            zb_gate = zero_baseline(mb_native, zero_lines(b, ax_b),
                                    {"rect"} if src_b_native == SRC_MPL else ZERO_TYPES_UNASSESSED_REF)
        ck.add("c.zeroBaseline", zb_gate is not False or zb_a is False, True, zb_a, zb_b, None,
               None if zb_gate is not False else "Node tanpa garis dasar nol; lulus hanya bila acuan juga tanpa")
    if "domainTolPct" in th:
        for ga, gb in zip(ax_a["groups"], ax_b["groups"]):
            da, db = ga.get("domain"), gb.get("domain")
            if da and db:
                span = (da[1] - da[0]) or 1.0
                dev = 100.0 * max(abs(da[0] - db[0]), abs(da[1] - db[1])) / abs(span)
                ck.add(f"c.domain.{ga['orient']}", dev <= th["domainTolPct"], False, da, db, th["domainTolPct"])
            ta, tb = ga.get("ticks"), gb.get("ticks")
            if ta is not None and tb is not None:
                ck.add(f"c.ticks.{ga['orient']}", abs(ta - tb) <= th["tickCountTol"], False, ta, tb,
                       th["tickCountTol"])

    # D-242/D-298: kelas diagram bukan byte Python -> ukuran akar dan geometri Python = diagnosis,
    # vonis resmi dari cek `d242.*` (compare_dg_d242).
    d242 = cls == "DG" and bool(th.get("d242Class"))
    if "rootTolMm" in th:
        dw, dh = abs(a["widthMm"] - b["widthMm"]), abs(a["heightMm"] - b["heightMm"])
        ck.add("d.rootSize", max(dw, dh) <= th["rootTolMm"], not d242,
               [_rnd(a["widthMm"]), _rnd(a["heightMm"])], [_rnd(b["widthMm"]), _rnd(b["heightMm"])], th["rootTolMm"])
    if "widthMmAllowed" in th:
        okw = any(abs(b["widthMm"] - w) <= th["widthTolMm"] for w in th["widthMmAllowed"])
        ck.add("d.widthMm", okw, True, None, _rnd(b["widthMm"]), th["widthMmAllowed"])
        if th.get("expectHeightMm") is not None:
            ck.add("d.heightMm", abs(b["heightMm"] - th["expectHeightMm"]) <= th["heightTolMm"], True,
                   th["expectHeightMm"], _rnd(b["heightMm"]), th["heightTolMm"])
        else:
            ck.add("d.heightMm", True, False, _rnd(a["heightMm"]), _rnd(b["heightMm"]))
    if th.get("viewBoxIdentical"):
        va, vb = a["viewBox"], b["viewBox"]
        same = va is not None and vb is not None and all(abs(x - y) <= 1e-6 for x, y in zip(va, vb))
        ck.add("d.viewBox", same, True, va, vb)
    ports = ctx.get("ports")
    if "portTolMm" in th and ports is not None:
        # F-S78-4: port simbol +/- portTolMm (research/06 SY), acuan RL datum_symbols vs Node symbolPortsMm.
        pa, pb = ports.get("ref") or {}, ports.get("node") or {}
        names_ok = sorted(pa) == sorted(pb) and len(pa) > 0
        dev = max((max(abs(pa[k][0] - pb[k][0]), abs(pa[k][1] - pb[k][1])) for k in pa if k in pb), default=0.0)
        ck.add("ports", names_ok and dev <= th["portTolMm"], True, len(pa), len(pb), th["portTolMm"],
               {"maxDevMm": r(dev, 4), "onlyRef": sorted(set(pa) - set(pb)), "onlyNode": sorted(set(pb) - set(pa))})

    if "fontMinPt" in th:
        mn_b = min(fb) if fb else None
        ok = mn_b is None or mn_b >= th["fontMinPt"]
        if "fontRefMarginPt" in th and fa and mn_b is not None:
            ok = ok and mn_b >= min(fa) - th["fontRefMarginPt"]
        ck.add("e.fontMinPt", ok, True, min(fa) if fa else None, mn_b, th["fontMinPt"])
    if th.get("fontSetIdentical"):
        sa, sb = sorted(set(fa)), sorted(set(fb))
        ck.add("e.fontSet", sa == sb, True, sa, sb, "N1: acuan pt nominal" if nominal_ref else None)

    if th.get("textMultisetIdentical"):
        xa, xb = sorted(texts_of(a)), sorted(texts_of(b))
        ck.add("f.texts", xa == xb, True, len(xa), len(xb), None, multiset_diff(xa, xb))
    lbl = None
    if th.get("labelSetIdentical"):
        lbl = content_labels(a, b, ctx, ck, bool(th.get("labelNamesRequireRef", True)))
    if th.get("dashMultisetIdentical"):
        xa = sorted(str(e["dashMm"]) for e in a["elements"] if e["dashMm"])
        xb = sorted(str(e["dashMm"]) for e in b["elements"] if e["dashMm"])
        ck.add("dashPatterns", xa == xb, True, len(xa), len(xb), None, multiset_diff(xa, xb))
    if th.get("strokeWidthMultisetIdentical"):
        xa = sorted(round(e["strokeWidthMm"], 3) for e in a["elements"] if e["strokeWidthMm"] is not None)
        xb = sorted(round(e["strokeWidthMm"], 3) for e in b["elements"] if e["strokeWidthMm"] is not None)
        ck.add("strokeWidths", xa == xb, True, len(xa), len(xb), None, multiset_diff(xa, xb))

    geo = None
    if "geomTolMm" in th:
        geo = geometry(a, b, th["geomTolMm"])
        ck.add("geometry", bool(geo["comparable"]) and not geo["outOfTol"], not d242, None, geo["maxDevMm"],
               th["geomTolMm"], geo["outOfTol"] if geo["comparable"] else geo["reason"])
    d242_metrics = None
    if d242:
        import compare_dg_d242  # noqa: PLC0415 - hanya kelas DG
        d242_metrics = compare_dg_d242.compare(ref, node, th, ck, ctx)

    snap = None
    if th.get("snapshotIdentical"):
        ha = hashlib.sha256(_canon(a)).hexdigest()
        hb = hashlib.sha256(_canon(b)).hexdigest()
        snap = {"ref": ha, "node": hb}
        ck.add("snapshot", ha == hb, True, ha, hb)

    return {
        "rootMm": {"ref": [_rnd(a["widthMm"]), _rnd(a["heightMm"])], "node": [_rnd(b["widthMm"]), _rnd(b["heightMm"])]},
        "viewBox": {"ref": a["viewBox"], "node": b["viewBox"]},
        "tagCounts": {"ref": dict(tags_a), "node": dict(tags_b)},
        "marks": {"ref": {"count": len(ma), "types": dict(mtype_a), "source": src_a},
                  "node": {"count": len(mb), "types": dict(mtype_b), "source": src_b,
                           "native": {"count": len(mb_native), "source": src_b_native,
                                      "types": dict(Counter(m["type"] for m in mb_native))}},
                  "sameSource": same_src, "gate": mark_gate},
        "accentSubjects": acc_subj,
        "colors": {"ref": ca, "node": cb},
        "axes": {"ref": {k: ax_a[k] for k in ("source", "count", "orientations", "groups")},
                 "node": {k: ax_b[k] for k in ("source", "count", "orientations", "groups")},
                 "zeroBaseline": {"ref": zb_a, "node": zb_b}},
        "fonts": {"refMin": min(fa) if fa else None, "nodeMin": min(fb) if fb else None,
                  "refSet": sorted(set(fa)), "nodeSet": sorted(set(fb)),
                  "refUnit": "pt nominal (N1)" if nominal_ref else "pt fisik", "nodeUnit": "pt fisik"},
        "texts": {"ref": len(texts_of(a)), "node": len(texts_of(b))},
        "contentLabels": lbl,
        "engineReport": ctx.get("engineReport"),
        "ports": ports,
        "geometry": geo,
        "snapshotSha256": snap,
        **({"d242": d242_metrics} if d242_metrics is not None else {}),
    }


def _rnd(x: Any) -> Any:
    return round(x, 3) if isinstance(x, float) else x
