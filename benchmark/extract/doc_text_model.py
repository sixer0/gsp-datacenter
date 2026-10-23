"""Text skeleton of a `studio.doc/v1` document as a renderer would lay it out (S93 data guard).

Reads ONLY doc.json (never the DOCX) and returns the body as a list of nodes:
    ("p", raw_text)                    one body paragraph (raw: \\t for tab, {PAGE}/{NUMPAGES} for fields)
    ("tbl", rows)                      rows = [[cell, ...], ...], cell = [("p", text) | ("tbl", rows), ...]
plus the header/footer text per unit. The layout rules are the renderer contract C1-C14 written in
doc.json `x.benchmark.conventions`; a mismatch against BM.docx therefore means either a wrong
extraction or a convention the renderer must honour.
"""
from __future__ import annotations

from typing import Any

MARK_GLYPH = {"TERUKUR": "■", "DITURUNKAN": "◈", "PEMASOK": "◇", "ASUMSI": "△"}
TABLE_TYPES = {"table", "specTable", "registerTable", "exampleWrongRight", "ruleTable", "checklist", "glossary",
               "sourceRegister", "ruleIndex", "referenceScale", "financialTable"}


def rt(runs: list[dict]) -> str:
    out = []
    for r in runs:
        if "t" in r:
            out.append(r["t"])
        elif "tab" in r:
            out.append("\t")
        elif "br" in r:
            out.append("\n")
        elif "field" in r:
            out.append("{" + r["field"] + "}")
    return "".join(out)


def il(x: dict | None) -> str:
    if x is None:
        return ""
    return rt(x["runs"]) if "runs" in x else x["text"]


class Model:
    def __init__(self, doc: dict) -> None:
        self.doc = doc
        self.body: list[tuple[str, Any]] = []
        self.hf: list[dict] = []  # per unit: {"unit", "header", "footer"}
        self.units: list[str] = []
        self.figure_refs: list[str] = []

    # ── helpers ───────────────────────────────────────────────────────────
    def P(self, text: str, out: list | None = None) -> None:
        (self.body if out is None else out).append(("p", text))

    def T(self, rows: list, out: list | None = None) -> None:
        (self.body if out is None else out).append(("tbl", rows))

    def cell_from(self, cell: dict) -> list:
        items: list = []
        if "paragraphs" in cell:
            paras = cell["paragraphs"]
            if not paras:
                items.append(("p", ""))
            for cp in paras:
                items.append(("p", il(cp)))
        elif "runs" in cell:
            items.append(("p", rt(cell["runs"])))
        elif "text" in cell:
            items.append(("p", cell["text"]))
        else:
            items.append(("p", ""))
        if "nested" in cell:
            items.append(("tbl", self.table_rows(cell["nested"])))
        return items

    def table_rows(self, tb: dict) -> list:
        rows = [[self.cell_from(c) for c in r["cells"]] for r in tb["rows"]]
        if "source" in tb and tb.get("sourcePlacement", "lastRowMerged") == "lastRowMerged":
            rows.append([[("p", il(tb["source"]["inline"]))]])
        return rows

    def caption(self, cap: dict) -> str:
        return cap.get("label", "") + cap.get("separator", "") + il(cap["inline"])

    # ── items ─────────────────────────────────────────────────────────────
    def item(self, b: dict) -> None:
        t = b["type"]
        if t == "spacer":
            self.P("")
        elif t == "device":
            dev = b["device"]
            if dev == "sealBand":
                self.T([[[("p", il(b.get("left")))], [("p", il(b.get("right")))]]])
            elif dev in ("logo", "datumRule"):
                self.figure_refs.append(b["asset"])
                self.P("")
            else:
                self.P(il(b.get("text")))
        elif t == "paragraph":
            if b.get("rail"):
                rail = [("p", rt(ln["runs"]) if "runs" in ln else ln.get("text", "")) for ln in b["rail"]]
                self.T([[[("p", il(b))], [("p", "")], rail]])
            else:
                self.P(il(b))
        elif t == "list":
            for it in b["items"]:
                self.P(rt([it["marker"]]) + "\t" + il(it))
        elif t == "aside":
            self.T([[[("p", il(b["label"]))] + [("p", il(x)) for x in b["body"]]]])
        elif t == "monoBlock":
            self.T([[[("p", il(b["label"]))] + [("p", il(x)) for x in b["lines"]]]])
        elif t == "derivation":
            lines = []
            for ln in b["lines"]:
                v = ln.get("value")
                vt = il(v) if isinstance(v, dict) and ("runs" in v or "text" in v) else ""
                if ln.get("mark"):
                    vt += MARK_GLYPH[ln["mark"]]
                lines.append([[("p", il(ln["label"]))], [("p", vt)]])
            cell: list = [("p", il(b["title"]))]
            if "intro" in b:
                cell.append(("p", il(b["intro"])))
            cell += [("tbl", lines), ("p", ""), ("p", il(b["closing"]))]
            self.T([[cell]])
        elif t in TABLE_TYPES:
            if "caption" in b:
                self.P(self.caption(b["caption"]))
            self.T(self.table_rows(b))
        elif t in ("image", "chart", "diagram", "symbolSheet"):
            self.P(self.caption(b["caption"]))
            self.figure_refs.append(b.get("x", {}).get("figureRef") or b.get("asset", "?"))
            self.P("")
            if "keyRow" in b:
                self.P(il(b["keyRow"]))
            self.P(il(b["source"]["inline"]))
        elif t == "controlBlock":
            self.T([[[("p", il(c))] for c in row] for row in b["rows"]])
        elif t == "colophon":
            self.T([[[("p", il(b["left"]))], [("p", il(b["right"]))]]])
        elif t == "signatureBlock":
            roles = b["roles"]
            self.T([[[("p", il(r["role"]))] for r in roles], [[("p", "")] for _ in roles],
                    [[("p", il(r["holder"]))] for r in roles]])
        else:
            raise ValueError(f"unknown block type {t}")

    def hf_text(self, spec: dict | None) -> str:
        if spec is None:
            return "<inherit>"
        m = spec["mode"]
        if m == "empty":
            return ""
        if m == "runningHead":
            return il(spec.get("left")) + "\t" + il(spec.get("right"))
        if m == "registerBlock":
            return " | ".join(il(c) for c in spec.get("cells", []))
        if m == "custom":
            return " | ".join(rt(p["runs"]) for p in spec.get("paragraphs", []))
        return "<inherit>"

    def unit_end(self, kind: str, setup: dict | None, last: bool) -> None:
        self.units.append(kind)
        self.hf.append({"unit": kind, "header": self.hf_text((setup or {}).get("header")),
                        "footer": self.hf_text((setup or {}).get("footer"))})
        if not last:
            self.P("")  # sectPr holder (K-12)

    # ── document ──────────────────────────────────────────────────────────
    def build(self) -> "Model":
        d = self.doc
        front = d.get("front", {})
        order: list[tuple[str, dict]] = []
        if "cover" in front:
            order.append(("cover", front["cover"]))
        if "controlSheet" in front:
            order.append(("controlSheet", front["controlSheet"]))
        if "toc" in front:
            order.append(("toc", front["toc"]))
        chapters = d.get("chapters", [])
        used = set()
        for part in d.get("parts", []):
            order.append(("part", part))
            for i, ch in enumerate(chapters):
                if ch.get("partId") == part["id"]:
                    order.append(("chapter", ch))
                    used.add(i)
        for i, ch in enumerate(chapters):
            if i not in used:
                order.append(("chapter", ch))
        for ap in d.get("appendices", []):
            order.append(("appendix", ap))
        by_key = {c.get("key"): c for c in chapters}
        for n, (kind, u) in enumerate(order):
            last = n == len(order) - 1
            if kind in ("cover", "controlSheet"):
                for b in u.get("body", []):
                    self.item(b)
            elif kind == "toc":
                if "sealBand" in u:
                    self.item(u["sealBand"])
                if "kicker" in u:
                    self.P(il(u["kicker"]))
                if "title" in u:
                    self.P(il(u["title"]))
                self.T([[[("p", il(e["label"]))], [("p", il(e["title"]))], [("p", e["page"])]] for e in u.get("entries", [])])
                if "note" in u:
                    self.P(il(u["note"]))
            elif kind == "part":
                for b in u.get("body", []):
                    self.item(b)
                self.P(il(u["label"]))
                self.P(il(u["title"]))
                if "lede" in u:
                    self.P(il(u["lede"]))
                if u.get("showChapterList"):
                    self.T([[[("p", il(by_key[k]["kicker"]))], [("p", il(by_key[k]["title"]))]] for k in u["chapterKeys"]])
            else:
                self.P(il(u.get("kicker")))
                self.P("")  # chapter datum rule (derived, K-24)
                self.figure_refs.append("derived:chapter.datumRule")
                self.P(il(u["title"]))
                for b in u.get("intro", []):
                    self.item(b)
                for s in u["sections"]:
                    self.P((s.get("number") or "") + il(s["title"]))
                    for b in s["blocks"]:
                        self.item(b)
            self.unit_end(kind, u.get("setup"), last)
        return self
