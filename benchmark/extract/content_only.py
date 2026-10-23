"""RT-01 (D-119): reduce the verbatim BM extraction to a CONTENT-ONLY `studio.doc/v1`.

The verbatim extraction (S93) carries every OOXML format it read: a `setup` per unit, a ParaFormat per
paragraph/cell, RunProps per run, cell borders/margins/widths, spacer paragraphs. D-119: the agent only
prepares CONTENT; every display parameter belongs to the TEMPLATE (defined once per unit kind / block role
and repeated identically in every chapter). This module keeps:

- text and structure (units, sections, block types, paragraph roles, list style, aside variant, table rows/
  cells with gridSpan/vMerge, column roles and widths, figure geometry, asset references);
- semantic run emphasis: `b`/`i` only where a run differs from its siblings (mixed paragraph), and
  `faceRole` ("mono" = code/numeral, "symbolGlyph" = provenance glyph) only where a run's face differs from
  the paragraph majority;
- fields (PAGE/NUMPAGES), tabs, line breaks.

Everything else is dropped. Units whose layout the renderer composes from the template (cover, control
sheet, part dividers, TOC seal band, spacers after table-like blocks and lists, running head/footer) are
expressed by their data (`mode: "auto"` + `data`, part without `body`, ...).
"""
from __future__ import annotations

import copy
from typing import Any

# Keys that only carry display parameters, on any object.
DISPLAY_KEYS = {
    "setup", "format", "layout", "headingFormat", "paragraphFormat", "runDefaults", "fieldFormats",
    "labelProps", "signRowFormat", "colsTw", "cellFormats", "firstRowCell", "rowCell", "trailingFormat",
    "sourcePlacement", "preset", "styleId",
}
CELL_DISPLAY = {"widthTw", "borders", "marginsTw", "shading", "vAlign"}
ROW_DISPLAY = {"cantSplit", "repeatHeader"}
RUN_DISPLAY = {"face", "szHalfPt", "color", "caps", "smallCaps", "spacingTw", "u", "vertAlign", "faceRole"}
FACE_ROLE = {
    "IBM Plex Mono": "mono",
    "DejaVu Sans": "symbolGlyph",
    "IBM Plex Serif": "serif",
    "IBM Plex Sans Cond": "condensed",
}
# Column alignment the renderer derives from the column role (table.numeral.align = right in the profile).
DEFAULT_ALIGN = {"numeral": "right", "id": "left", "text": "left", "unit": "left", "glyph": "left"}
FLOW_SPACER_TYPES = {"spacer"}


class ContentOnlyError(Exception):
    pass


def _need(cond: bool, msg: str) -> None:
    if not cond:
        raise ContentOnlyError(msg)


# ── runs ──────────────────────────────────────────────────────────────────

def _text_runs(runs: list[dict]) -> list[dict]:
    return [r for r in runs if "t" in r]


def reduce_runs(runs: list[dict]) -> list[dict]:
    """Keep text/field/tab/br and the semantic emphasis that differs from the sibling runs."""
    texts = _text_runs(runs)
    weight: dict[str, int] = {}
    for r in texts:
        weight[r.get("face", "")] = weight.get(r.get("face", ""), 0) + len(r["t"].strip() or r["t"])
    major_face = max(weight.items(), key=lambda kv: kv[1])[0] if weight else ""
    all_b = bool(texts) and all(r.get("b") is True for r in texts)
    all_i = bool(texts) and all(r.get("i") is True for r in texts)
    out: list[dict] = []
    for r in runs:
        if "field" in r:
            out.append({"field": r["field"]})
            continue
        if "tab" in r:
            out.append({"tab": True})
            continue
        if "br" in r:
            out.append({"br": r["br"]})
            continue
        _need("t" in r, f"run without t/field/tab/br: {r}")
        n: dict[str, Any] = {"t": r["t"]}
        if r.get("b") is True and not all_b:
            n["b"] = True
        if r.get("i") is True and not all_i:
            n["i"] = True
        face = r.get("face")
        if face and face != major_face and r["t"].strip():
            role = FACE_ROLE.get(face)
            _need(role is not None, f"unknown face {face!r}")
            n["faceRole"] = role
        out.append(n)
    # merge adjacent text runs with identical semantics
    merged: list[dict] = []
    for r in out:
        if merged and "t" in r and "t" in merged[-1]:
            a = {k: v for k, v in merged[-1].items() if k != "t"}
            b = {k: v for k, v in r.items() if k != "t"}
            if a == b:
                merged[-1] = {**merged[-1], "t": merged[-1]["t"] + r["t"]}
                continue
        merged.append(r)
    return merged


# ── generic walk ──────────────────────────────────────────────────────────

def _strip_x(x: Any) -> Any:
    if not isinstance(x, dict):
        return x
    return {k: v for k, v in x.items() if not k.endswith("Format")}


def _walk(o: Any) -> Any:
    """Drop display keys everywhere; reduce every run list; cells/rows/columns get their own rules."""
    if isinstance(o, list):
        return [_walk(v) for v in o]
    if not isinstance(o, dict):
        return o
    out: dict[str, Any] = {}
    for k, v in o.items():
        if k in DISPLAY_KEYS:
            continue
        if k == "x":
            out[k] = _strip_x(v)
            continue
        if k == "runs" and isinstance(v, list):
            out[k] = reduce_runs(v)
            continue
        if k == "rows" and isinstance(v, list) and v and isinstance(v[0], dict):
            out[k] = [_row(r) for r in v]
            continue
        if k == "columns" and isinstance(v, list):
            out[k] = [_column(c) for c in v]
            continue
        if k == "marker" and isinstance(v, dict):
            continue  # list marker = template render.list.bulletMarker / numberMarker
        if k == "rail" and isinstance(v, list):
            out[k] = [_rail_line(line) for line in v]
            continue
        out[k] = _walk(v)
    return out


def _row(r: dict) -> dict:
    out = {k: _walk(v) for k, v in r.items() if k not in ROW_DISPLAY and k != "cells"}
    out["cells"] = [_cell(c) for c in r["cells"]]
    return out


def _cell(c: dict) -> dict:
    return {k: _walk(v) for k, v in c.items() if k not in CELL_DISPLAY}


def _column(c: dict) -> dict:
    out = {k: v for k, v in c.items()}
    role = out.get("role")
    if role in DEFAULT_ALIGN and out.get("align") == DEFAULT_ALIGN[role]:
        del out["align"]
    return out


# ── units ─────────────────────────────────────────────────────────────────

def _flow(blocks: list[dict]) -> list[dict]:
    return [_walk(b) for b in blocks if b.get("type") not in FLOW_SPACER_TYPES]


def _section(s: dict) -> dict:
    out = _walk({k: v for k, v in s.items() if k not in ("blocks", "title")})
    runs = s["title"].get("runs")
    if s.get("number") and runs:
        # BM writes the number gap "   " as the first title run (C3); the renderer adds the gap
        # (render.section.numberSeparator) to a text title.
        if "t" in runs[0] and not runs[0]["t"].strip():
            runs = runs[1:]
        reduced = reduce_runs(runs)
        if len(reduced) == 1 and set(reduced[0]) == {"t"}:
            out["title"] = {"text": reduced[0]["t"]}
        else:
            out["title"] = {"runs": reduced}
    else:
        out["title"] = _walk(s["title"])
    out["blocks"] = _flow(s["blocks"])
    return out


def _rail_line(line: dict) -> dict:
    """Rail line as semantics: a mark line = {kind, mark} (glyph + label composed by the renderer);
    source/note = {kind, text}."""
    runs = line.get("runs")
    if not runs:
        return _walk(line)
    text = "".join(r.get("t", "") for r in runs)
    if line["kind"] == "mark" and line.get("mark"):
        from_glyph = {"■": "TERUKUR", "◈": "DITURUNKAN", "◇": "PEMASOK", "△": "ASUMSI"}
        glyph = text[:1]
        if from_glyph.get(glyph) == line["mark"] and text[1:] == f" {line['mark']}":
            return {"kind": "mark", "mark": line["mark"]}
    if line["kind"] in ("source", "note") and all("t" in r for r in runs):
        return {"kind": line["kind"], "text": text}
    return _walk(line)


def _chapter(c: dict) -> dict:
    out = _walk({k: v for k, v in c.items() if k not in ("sections", "intro")})
    if "intro" in c:
        out["intro"] = _flow(c["intro"])
    out["sections"] = [_section(s) for s in c["sections"]]
    return out


def _by_type(body: list[dict], t: str) -> list[dict]:
    return [b for b in body if b.get("type") == t]


def _by_role(body: list[dict], role: str) -> list[dict]:
    return [b for b in body if b.get("type") == "paragraph" and b.get("role") == role]


def _inline(p: dict) -> dict:
    """Inline (text XOR runs) of a paragraph block, reduced."""
    if "runs" in p:
        return {"runs": reduce_runs(p["runs"])}
    return {"text": p["text"]}


def _cover(cover: dict) -> dict:
    body = cover["body"]
    titles = _by_role(body, "title")
    _need(len(titles) >= 1, "cover without title paragraphs")
    data: dict[str, Any] = {}
    for role, key in (("addressLine", "addressLine"), ("kicker", "kicker"), ("standfirst", "standfirst"), ("scopeLine", "scopeLine")):
        ps = _by_role(body, role)
        _need(len(ps) <= 1, f"cover: more than one {role}")
        if ps:
            data[key] = _inline(ps[0])
    data["titleLines"] = [_inline(p) for p in titles]
    cbs = _by_type(body, "controlBlock")
    if cbs:
        data["control"] = _walk(cbs[0])
    cols = _by_type(body, "colophon")
    if cols:
        data["colophon"] = _walk(cols[0])
    spines = [b for b in _by_type(body, "device") if b.get("device") == "spineString" and b.get("text")]
    if spines:
        data["identityString"] = _inline(spines[0]["text"])
    # Order the data keys like CoverData for a stable diff.
    order = ["kicker", "titleLines", "standfirst", "scopeLine", "addressLine", "control", "colophon", "identityString"]
    return {"mode": "auto", "data": {k: data[k] for k in order if k in data}}


def _control_sheet(cs: dict) -> tuple[dict, dict | None]:
    body = cs["body"]
    data: dict[str, Any] = {}
    k = _by_role(body, "kicker")
    if k:
        data["kicker"] = _inline(k[0])
    t = _by_role(body, "pageTitle")
    _need(len(t) == 1, "control sheet: one pageTitle expected")
    data["title"] = _inline(t[0])
    # Block headings "A · Riwayat revisi" ... are composed by the renderer (auto mode); the table / method
    # paragraph that follows a heading is the content.
    slot = {
        "Riwayat revisi": "revisionHistory",
        "Rantai verifikasi": "verificationChain",
        "Pernyataan metode": "methodStatement",
        "Distribusi terkendali": "distribution",
    }
    current = None
    for b in body:
        if b.get("type") == "paragraph" and b.get("role") == "blockHeading":
            text = "".join(r.get("t", "") for r in b.get("runs", [])) if "runs" in b else b["text"]
            label = text.split("·", 1)[-1].strip()
            _need(label in slot, f"control sheet: unknown block heading {text!r}")
            current = slot[label]
        elif current and b.get("type") == "table":
            data[current] = _walk(b)
            current = None
        elif current == "methodStatement" and b.get("type") == "paragraph" and b.get("role") == "methodStatement":
            data[current] = _inline(b)
            current = None
    sig = _by_type(body, "signatureBlock")
    signature = _walk(sig[0]) if sig else None
    order = ["kicker", "title", "revisionHistory", "verificationChain", "methodStatement", "distribution"]
    return {"mode": "auto", "data": {k: data[k] for k in order if k in data}}, signature


def _toc(toc: dict) -> dict:
    out = _walk({k: v for k, v in toc.items() if k != "sealBand"})  # seal band = template wrapper.header
    return out


def _part(p: dict) -> dict:
    # body (seal band, spacer 1400, Datum Rule 166) = autoPartBody of the renderer.
    return _walk({k: v for k, v in p.items() if k != "body"})


def running_head_subject(verbatim: dict) -> str | None:
    """Document label of the BM running head ('<entity> · <label> · Bab n · <title>') = meta.subject.

    The renderer composes the running head from meta (entity param, meta.subject, chapter label/title),
    so the label is read once from the first chapter instead of being copied per chapter."""
    for ch in verbatim.get("chapters", []):
        left = ch.get("setup", {}).get("header", {}).get("left", {})
        text = "".join(r.get("t", "") for r in left.get("runs", [])) if "runs" in left else left.get("text", "")
        parts = [p.strip() for p in text.split("·")]
        if len(parts) >= 4:
            return parts[1]
    return None


CONTENT_ONLY_NOTE = (
    "RT-01 (D-119): content-only document. No setup/format/layout per unit, block, paragraph, cell or run; "
    "runs keep text + semantic emphasis (b/i where mixed, faceRole mono/symbolGlyph); spacers, cover/control "
    "sheet/part layout, running head/footer and every format come from the template (datum-manual-000). "
    "Conventions C1-C14 describe the verbatim extraction (doc.verbatim.json); C12 does not apply here."
)


def content_only(verbatim: dict, subject: str | None = None) -> dict:
    """Return a new content-only document; `verbatim` is not modified."""
    subject = subject or running_head_subject(verbatim)
    d = copy.deepcopy(verbatim)
    out: dict[str, Any] = {}
    for k, v in d.items():
        if k == "front":
            front: dict[str, Any] = {}
            if "cover" in v:
                front["cover"] = _cover(v["cover"])
            signature = None
            if "controlSheet" in v:
                front["controlSheet"], signature = _control_sheet(v["controlSheet"])
            if "toc" in v:
                front["toc"] = _toc(v["toc"])
            if signature:
                front["signature"] = signature
            out[k] = front
        elif k == "parts":
            out[k] = [_part(p) for p in v]
        elif k in ("chapters", "appendices"):
            out[k] = [_chapter(c) for c in v]
        elif k == "meta":
            meta = dict(v)
            if subject and "subject" not in meta:
                meta["subject"] = subject
            out[k] = meta
        elif k == "x":
            x = dict(v)
            if isinstance(x.get("benchmark"), dict):
                x["benchmark"] = {**x["benchmark"], "contentOnly": CONTENT_ONLY_NOTE}
            out[k] = x
        else:
            out[k] = _walk(v)
    return out


# ── evidence ──────────────────────────────────────────────────────────────

COUNTED_KEYS = ("setup", "format", "layout", "style")


def count_display_keys(doc: Any) -> dict[str, int]:
    """Count display keys; `style` of a ListBlock (bullet/number = list kind, schema-required) is reported apart."""
    counts = {k: 0 for k in COUNTED_KEYS}
    counts["listBlock.style(kind)"] = 0
    extra: dict[str, int] = {}

    def walk(o: Any) -> None:
        if isinstance(o, list):
            for v in o:
                walk(v)
            return
        if not isinstance(o, dict):
            return
        for k, v in o.items():
            if k == "style" and o.get("type") == "list" and v in ("bullet", "number"):
                counts["listBlock.style(kind)"] += 1
            elif k in counts:
                counts[k] += 1
            elif k in DISPLAY_KEYS or k in RUN_DISPLAY - {"faceRole"} or k.endswith("Format"):
                extra[k] = extra.get(k, 0) + 1
            walk(v)
    walk(doc)
    counts.update({f"other:{k}": n for k, n in sorted(extra.items())})
    return counts
