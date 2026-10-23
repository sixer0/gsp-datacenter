"""Low-level OOXML readers for the Manual 000 extractor (S93).

Everything here maps one WordprocessingML construct to the `studio.doc/v1`
shapes of `src/lib/studio/contract/types/common.ts` without changing any text:
`w:t` content is copied as-is (spaces, NBSP, em dash, capitals), `w:tab` becomes
`{tab: true}`, `w:fldSimple` becomes `{field: ...}`. Unknown child elements are
collected in `UNMAPPED` so the caller can prove that nothing was dropped.

The DOCX is read in memory (zipfile + lxml) and never modified.
"""
from __future__ import annotations

import collections
from typing import Any

from lxml import etree

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
WP = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
A = "http://schemas.openxmlformats.org/drawingml/2006/main"


def q(tag: str) -> str:
    return f"{{{W}}}{tag}"


def wa(el: etree._Element, name: str) -> str | None:
    return el.get(f"{{{W}}}{name}")


def local(el: etree._Element) -> str:
    return etree.QName(el).localname


# Every element name that was seen but has no studio.doc/v1 mapping.
UNMAPPED: collections.Counter = collections.Counter()

_PPR_KNOWN = {"spacing", "jc", "ind", "keepNext", "keepLines", "pageBreakBefore", "widowControl",
              "outlineLvl", "tabs", "pBdr", "shd", "sectPr", "pStyle"}
_RPR_KNOWN = {"rFonts", "sz", "szCs", "color", "b", "i", "caps", "spacing", "u", "vertAlign"}
_TCPR_KNOWN = {"tcW", "gridSpan", "vMerge", "tcBorders", "tcMar", "shd", "vAlign"}
_TRPR_KNOWN = {"cantSplit", "tblHeader"}


def _onoff(el: etree._Element | None) -> bool | None:
    """w:b / w:keepNext style toggle: absent -> None, <x/> -> True, val=0/false -> False."""
    if el is None:
        return None
    v = wa(el, "val")
    return not (v is not None and v.lower() in ("0", "false", "off"))


def _hex(v: str | None) -> str:
    if v is None:
        return "auto"
    return "auto" if v.lower() == "auto" else v.upper()


def border_spec(el: etree._Element) -> dict:
    spec: dict[str, Any] = {"val": wa(el, "val"), "sz": int(wa(el, "sz") or 0), "color": _hex(wa(el, "color"))}
    sp = wa(el, "space")
    if sp is not None:
        spec["space"] = int(sp)
    return spec


def border_sides(el: etree._Element | None, allow_inside: bool = False) -> dict | None:
    if el is None:
        return None
    out: dict[str, Any] = {}
    for ch in el:
        side = local(ch)
        side = {"start": "left", "end": "right"}.get(side, side)
        if side in ("top", "bottom", "left", "right") or (allow_inside and side in ("insideH", "insideV")):
            out[side] = border_spec(ch)
        else:
            UNMAPPED[f"border:{side}"] += 1
    return out or None


def para_format(ppr: etree._Element | None) -> dict | None:
    """w:pPr -> ParaFormat (sectPr is reported separately by the caller)."""
    if ppr is None:
        return None
    f: dict[str, Any] = {}
    for ch in ppr:
        n = local(ch)
        if n not in _PPR_KNOWN:
            UNMAPPED[f"pPr:{n}"] += 1
    sp = ppr.find(q("spacing"))
    if sp is not None:
        for attr, key in (("before", "spacingBeforeTw"), ("after", "spacingAfterTw"), ("line", "lineTw")):
            v = wa(sp, attr)
            if v is not None:
                f[key] = int(v)
        rule = wa(sp, "lineRule")
        if rule is not None:
            f["lineRule"] = rule
        for extra in ("beforeAutospacing", "afterAutospacing", "beforeLines", "afterLines"):
            if wa(sp, extra) is not None:
                UNMAPPED[f"spacing@{extra}"] += 1
    jc = ppr.find(q("jc"))
    if jc is not None:
        f["jc"] = {"start": "left", "end": "right"}.get(wa(jc, "val"), wa(jc, "val"))
    ind = ppr.find(q("ind"))
    if ind is not None:
        for attrs, key in ((("left", "start"), "indLeftTw"), (("right", "end"), "indRightTw"),
                           (("hanging",), "indHangingTw"), (("firstLine",), "indFirstLineTw")):
            for a in attrs:
                v = wa(ind, a)
                if v is not None:
                    f[key] = int(v)
                    break
    for name in ("keepNext", "keepLines", "pageBreakBefore", "widowControl"):
        v = _onoff(ppr.find(q(name)))
        if v is not None:
            f[name] = v
    ol = ppr.find(q("outlineLvl"))
    if ol is not None:
        f["outlineLvl"] = int(wa(ol, "val"))
    tabs = ppr.find(q("tabs"))
    if tabs is not None:
        stops = []
        for t in tabs.findall(q("tab")):
            stop: dict[str, Any] = {"posTw": int(wa(t, "pos")), "val": wa(t, "val")}
            leader = wa(t, "leader")
            if leader is not None:
                stop["leader"] = leader
            stops.append(stop)
        f["tabs"] = stops
    pbdr = border_sides(ppr.find(q("pBdr")))
    if pbdr:
        f["borders"] = pbdr
    shd = ppr.find(q("shd"))
    if shd is not None:
        f["shading"] = {"fill": _hex(wa(shd, "fill")), "val": "clear"}
    return f


def run_props(rpr: etree._Element | None) -> dict:
    """w:rPr -> RunProps. The four rFonts slots are identical in BM (research/07 §1.1); a
    mismatch is reported in UNMAPPED and the ascii slot wins."""
    if rpr is None:
        return {}
    p: dict[str, Any] = {}
    for ch in rpr:
        n = local(ch)
        if n not in _RPR_KNOWN:
            UNMAPPED[f"rPr:{n}"] += 1
    rf = rpr.find(q("rFonts"))
    if rf is not None:
        faces = {wa(rf, a) for a in ("ascii", "hAnsi", "cs", "eastAsia")}
        if len(faces) != 1:
            UNMAPPED["rFonts:mixed"] += 1
        face = wa(rf, "ascii")
        if face:
            p["face"] = face
    sz = rpr.find(q("sz"))
    if sz is not None:
        p["szHalfPt"] = int(wa(sz, "val"))
    col = rpr.find(q("color"))
    if col is not None:
        p["color"] = _hex(wa(col, "val"))
    for name in ("b", "i", "caps"):
        v = _onoff(rpr.find(q(name)))
        if v is not None:
            p[name] = v
    spc = rpr.find(q("spacing"))
    if spc is not None:
        p["spacingTw"] = int(wa(spc, "val"))
    u = rpr.find(q("u"))
    if u is not None:
        p["u"] = "none" if wa(u, "val") == "none" else "single"
    va = rpr.find(q("vertAlign"))
    if va is not None and wa(va, "val") in ("superscript", "subscript"):
        p["vertAlign"] = wa(va, "val")
    return p


def runs_of(container: etree._Element, drawings: list | None = None) -> list[dict]:
    """Ordered Run[] of a paragraph (or of a run container such as w:hyperlink).

    One `w:r` may hold several pieces (`w:tab` then `w:t`); each piece becomes its
    own Run carrying the same props, in order. `w:drawing` pieces are appended to
    `drawings` (when given) instead of producing a Run.
    """
    out: list[dict] = []
    for ch in container:
        n = local(ch)
        if n == "pPr":
            continue
        if n == "r":
            props = run_props(ch.find(q("rPr")))
            for piece in ch:
                pn = local(piece)
                if pn == "rPr":
                    continue
                if pn == "t":
                    out.append({"t": piece.text or "", **props})
                elif pn == "tab":
                    out.append({"tab": True, **props})
                elif pn == "br" and wa(piece, "type") in (None, "textWrapping"):
                    out.append({"br": "line", **props})
                elif pn == "drawing":
                    if drawings is None:
                        UNMAPPED["r:drawing(unexpected)"] += 1
                    else:
                        drawings.append(piece)
                else:
                    UNMAPPED[f"r:{pn}"] += 1
        elif n == "fldSimple":
            instr = (wa(ch, "instr") or "").strip().split()
            kind = instr[0] if instr else ""
            inner = ch.find(q("r"))
            props = run_props(inner.find(q("rPr"))) if inner is not None else {}
            if kind in ("PAGE", "NUMPAGES"):
                out.append({"field": kind, **props})
            else:
                UNMAPPED[f"fldSimple:{kind}"] += 1
        elif n in ("bookmarkStart", "bookmarkEnd", "proofErr"):
            UNMAPPED[f"p:{n}"] += 1
        else:
            UNMAPPED[f"p:{n}"] += 1
    return out


def run_text(runs: list[dict], field_text: dict | None = None) -> str:
    """Raw text of a Run[] (tab -> \\t, line break -> \\n, fields -> placeholder)."""
    parts = []
    for r in runs:
        if "t" in r:
            parts.append(r["t"])
        elif "tab" in r:
            parts.append("\t")
        elif "br" in r:
            parts.append("\n")
        elif "field" in r:
            parts.append((field_text or {}).get(r["field"], "{" + r["field"] + "}"))
    return "".join(parts)


def para_raw_text(p: etree._Element) -> str:
    """Raw text of a w:p straight from XML (independent of runs_of)."""
    out = []
    for ch in p:
        n = local(ch)
        if n == "r":
            for piece in ch:
                pn = local(piece)
                if pn == "t":
                    out.append(piece.text or "")
                elif pn == "tab":
                    out.append("\t")
                elif pn == "br":
                    out.append("\n")
        elif n == "fldSimple":
            instr = (wa(ch, "instr") or "").strip().split()
            out.append("{" + (instr[0] if instr else "") + "}")
    return "".join(out)


def cell_props(tc: etree._Element) -> dict:
    """w:tcPr -> Cell fields (widthTw = LAST w:tcW, see GS-01; first kept by caller)."""
    tcpr = tc.find(q("tcPr"))
    out: dict[str, Any] = {}
    if tcpr is None:
        return out
    for ch in tcpr:
        n = local(ch)
        if n not in _TCPR_KNOWN:
            UNMAPPED[f"tcPr:{n}"] += 1
    tcws = tcpr.findall(q("tcW"))
    if tcws:
        last = tcws[-1]
        if wa(last, "type") == "dxa":
            out["widthTw"] = int(wa(last, "w"))
        else:
            UNMAPPED[f"tcW:{wa(last, 'type')}"] += 1
    gs = tcpr.find(q("gridSpan"))
    if gs is not None and int(wa(gs, "val")) > 1:
        out["gridSpan"] = int(wa(gs, "val"))
    vm = tcpr.find(q("vMerge"))
    if vm is not None:
        out["vMerge"] = "restart" if wa(vm, "val") == "restart" else "continue"
    b = border_sides(tcpr.find(q("tcBorders")))
    if b:
        out["borders"] = b
    mar = tcpr.find(q("tcMar"))
    if mar is not None:
        m = {}
        for ch in mar:
            side = {"start": "left", "end": "right"}.get(local(ch), local(ch))
            if wa(ch, "type") not in (None, "dxa"):
                UNMAPPED[f"tcMar:{wa(ch, 'type')}"] += 1
            m[side] = int(wa(ch, "w"))
        out["marginsTw"] = m
    shd = tcpr.find(q("shd"))
    if shd is not None:
        out["shading"] = {"fill": _hex(wa(shd, "fill")), "val": "clear"}
    va = tcpr.find(q("vAlign"))
    if va is not None:
        out["vAlign"] = wa(va, "val")
    return out


def all_tcw(tc: etree._Element) -> list[int]:
    tcpr = tc.find(q("tcPr"))
    return [int(wa(e, "w")) for e in tcpr.findall(q("tcW"))] if tcpr is not None else []


def row_props(tr: etree._Element) -> dict:
    trpr = tr.find(q("trPr"))
    out: dict[str, Any] = {}
    if trpr is None:
        return out
    for ch in trpr:
        if local(ch) not in _TRPR_KNOWN:
            UNMAPPED[f"trPr:{local(ch)}"] += 1
    cs = _onoff(trpr.find(q("cantSplit")))
    if cs is not None:
        out["cantSplit"] = cs
    th = _onoff(trpr.find(q("tblHeader")))
    if th is not None:
        out["repeatHeader"] = th
    return out


def table_layout(tbl: etree._Element) -> dict:
    """w:tblPr -> TableBlock.layout (LAST tblW, see GS-01)."""
    tblpr = tbl.find(q("tblPr"))
    lay: dict[str, Any] = {}
    if tblpr is None:
        return lay
    tws = [e for e in tblpr.findall(q("tblW")) if wa(e, "type") == "dxa"]
    if tws:
        lay["widthTw"] = int(wa(tws[-1], "w"))
    ind = tblpr.find(q("tblInd"))
    if ind is not None:
        lay["indentTw"] = int(wa(ind, "w"))
    cm = tblpr.find(q("tblCellMar"))
    if cm is not None:
        m = {local(ch): int(wa(ch, "w")) for ch in cm}
        lay["cellMarginTw"] = {"left": m.get("left", 0), "right": m.get("right", 0)}
    lays = tblpr.findall(q("tblLayout"))
    if lays:
        lay["fixed"] = wa(lays[-1], "type") == "fixed"
    b = border_sides(tblpr.find(q("tblBorders")), allow_inside=True)
    if b:
        lay["borders"] = b
    return lay


def grid_cols(tbl: etree._Element) -> list[int]:
    g = tbl.find(q("tblGrid"))
    return [int(wa(c, "w")) for c in g.findall(q("gridCol"))] if g is not None else []


def drawing_extent(drawing: etree._Element) -> tuple[int, int]:
    ext = drawing.find(f".//{{{WP}}}extent")
    return int(ext.get("cx")), int(ext.get("cy"))


def drawing_docpr_id(drawing: etree._Element) -> int:
    d = drawing.find(f".//{{{WP}}}docPr")
    return int(d.get("id"))


def drawing_embed(drawing: etree._Element) -> str:
    blip = drawing.find(f".//{{{A}}}blip")
    return blip.get(f"{{{R_NS}}}embed")
