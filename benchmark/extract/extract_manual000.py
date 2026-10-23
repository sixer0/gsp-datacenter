"""S93: extract Manual DATUM 000 (BM.docx) into a `studio.doc/v1` document.

Usage (VENV = hermes-agent venv python, see README.md):
    VENV -I -B benchmark/extract/extract_manual000.py [--docx BM.docx] [--research 07_benchmark_data.json]
        [--out benchmark/manual000/doc.json] [--verbatim-out benchmark/manual000/doc.verbatim.json]
        [--trace benchmark/extract/out/manual000_trace.json]

RT-01 (D-119): `--out` receives the CONTENT-ONLY document (content_only.py: text, structure and semantic
run emphasis; every display parameter lives in the template profile benchmark/manual000/template.json).
The verbatim extraction below goes to `--verbatim-out` for diagnosis only (not used by default).

Mapping source of truth: masterplan/01_specs.md §3 (schema), §13 (36 body clusters K-xx and
40 cell clusters KT-xx -> role and JSON field). Cluster membership per paragraph is read from
research/07_benchmark_data.json (`body_assign`, `cell_assign`) and cross-checked against the
DOCX structure (table id, row, column) before anything is emitted.

Text is never transformed: every paragraph is emitted as explicit `runs[]` copied from the
`w:t` content, with the run's direct formatting as RunProps and the paragraph's direct
formatting as ParaFormat. The few places where the v1 schema has no field for something are
listed in CONVENTIONS (renderer contract) and GAPS (schema gaps, sent to file_requests.md).

Exit codes: 0 ok, 1 structural assertion failed (message on stderr), 2 input error.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import struct
import sys
import zipfile
from pathlib import Path
from typing import Any

from lxml import etree

sys.path.insert(0, str(Path(__file__).resolve().parent))
import docx_read as dr  # noqa: E402
from content_only import content_only, count_display_keys  # noqa: E402
from docx_read import q  # noqa: E402

REPO = Path(__file__).resolve().parents[2]
DEFAULT_BM = Path(r"C:\Users\TRIAL\workspace\Manual DATUM GSP\Manual_Komprehensif_DATUM_GSP_000-GSP-STD-X-2026_RevA.docx")
DEFAULT_RESEARCH = REPO / "docs" / "2026-10-22_doc_artifact_studio" / "research" / "07_benchmark_data.json"
DEFAULT_OUT = REPO / "benchmark" / "manual000" / "doc.json"
DEFAULT_VERBATIM_OUT = REPO / "benchmark" / "manual000" / "doc.verbatim.json"
DEFAULT_TRACE = REPO / "benchmark" / "extract" / "out" / "manual000_trace.json"
TEMPLATE_SLUG = "datum-manual-000"
FIG_ID = "bm-fig-{:02d}"  # placement order 01..52 (document order of w:drawing = docPr id)

GLYPH_MARK = {"■": "TERUKUR", "◈": "DITURUNKAN", "◇": "PEMASOK", "△": "ASUMSI"}
SPACER_CLUSTERS = {"K-10", "K-16", "K-20", "K-27", "K-31"}

# Renderer contract assumed by this document (reported to the controller; see README.md).
CONVENTIONS = [
    "C1 Inline.runs are complete and verbatim: renderer writes them as-is and adds no label/prefix "
    "(applies to SourceLine.inline incl. 'SUMBER  '/'PROVENANS', keyRow incl. 'KUNCI  ', derivation.title incl. "
    "'Turunan D-x.y · ', RailLine.runs incl. glyph and mark label, aside/monoBlock label).",
    "C2 Caption = label + separator + inline.runs; label run uses labelProps.",
    "C3 Section heading = number (numberRun) + title.runs; the BM separator '   ' is the first title run "
    "(RunProps of the number run), no extra separator is added (gap G-01).",
    "C4 List item = marker run + w:tab (marker props) + runs.",
    "C5 PartSpec order = sealBand/spacer/datumRule from body[] -> label -> title -> lede -> chapter list "
    "(showChapterList: label = chapter kicker text, title = chapter title text, cell formats from roles U46/U47) (gap G-02).",
    "C6 TocSpec order = sealBand -> kicker -> title -> entries table (3 cols) -> note.",
    "C7 SignatureBlock rows = role row, sign row (signRowFormat, empty), holder row (gap G-03).",
    "C8 derivation (render.derivation.renderer = nestedTable): cell = title, [intro], nested lines table, "
    "empty <w:p/> (KT-19), closing; line value = value.runs + glyph run of `mark` (glyphRun U65).",
    "C9 Rail paragraph (render.rail.renderer = table3col): prose cell, empty spacer cell (KT-19), rail cell with one "
    "paragraph per RailLine (runs verbatim).",
    "C10 Chapter: kicker -> datumRule (asset rule128, derived; figure ids bm-fig-* in x.figures) -> title -> intro -> sections; "
    "one sectPr holder paragraph (empty, no pPr) closes every unit except the last (KS-06).",
    "C11 Figure blocks are `image` blocks with asset = x.figureRef = bm-fig-NN; S94 resolves bm-fig-NN to a chart/diagram "
    "spec or a raster asset with the same sha256 (D-14).",
    "C12 Explicit `format`/RunProps on blocks, cells and runs win over template roleFormats (KS-07 resolution order).",
    "C13 Cell.widthTw / layout.widthTw = the LAST w:tcW / w:tblW of BM (both values kept in the trace, GS-01).",
    "C14 Unit order = cover, controlSheet, toc, then per part: the part followed by the chapters whose partId is that part, "
    "then appendices; every unit is one sectPr (KS-06).",
]
GAPS = [
    "G-01 Section has no number separator field: BM writes '1.1   ' (3 spaces) in the Mono number run; closest = "
    "leading title run with the number RunProps. Proposal: Section.numberSeparator?: string (or param render.section.numberSeparator).",
    "G-02 PartSpec: order of body[] relative to label/title/lede/chapter list is not defined by §3.3. Proposal: "
    "document order body[] -> label -> title -> lede -> chapter list, or PartSpec.bodyAfter?: FrontItem[].",
    "G-03 SignatureBlock: row order (role, sign space, holder) is not defined. Proposal: fix order in spec "
    "(BM T008: role, sign, holder) or SignatureBlock.rowOrder.",
    "G-04 Cell paragraphs vs nested table order is not expressible (Cell.paragraphs + Cell.nested); BM derivations put "
    "the nested table between title and closing. Covered by DerivationBlock; generic Cell has no ordering field.",
    "G-05 Spec §13.2 maps KT-34 to derivation.intro but in BM (T034, T050) the KT-34 paragraph comes AFTER the nested "
    "lines table -> mapped to derivation.closing (intro absent).",
    "G-06 Inline-only fields carry no ParaFormat (chapter kicker/title, part label/title/lede, toc kicker/title/note, keyRow, "
    "aside/monoBlock/derivation labels, ControlBlock/Colophon/sealBand/TOC/registerBlock cells): their paragraph and cell "
    "formats come from template roles only (S95).",
    "G-07 HeaderFooterSpec has no style reference: BM header/footer paragraphs use pStyle Header/Footer.",
    "G-08 registerBlock cannot express the footer table's cell borders/margins/paragraph formats nor the empty paragraph "
    "after the table (BM footer5..29: pStyle Footer, line 20 exact); these come from template render.section.interior (R-10).",
]


class ExtractError(Exception):
    pass


def need(cond: bool, msg: str) -> None:
    if not cond:
        raise ExtractError(msg)


def png_size(data: bytes) -> tuple[int, int]:
    need(data[:8] == b"\x89PNG\r\n\x1a\n", "media is not PNG")
    w, h = struct.unpack(">II", data[16:24])
    return w, h


class Extractor:
    def __init__(self, docx: Path, research: Path) -> None:
        self.docx = docx
        self.z = zipfile.ZipFile(docx)
        self.root = etree.fromstring(self.z.read("word/document.xml"),
                                     parser=etree.XMLParser(huge_tree=True, resolve_entities=False, no_network=True))
        self.body = self.root.find(q("body"))
        rels = etree.fromstring(self.z.read("word/_rels/document.xml.rels"))
        self.rels = {r.get("Id"): r.get("Target") for r in rels}
        self.research = json.loads(research.read_text(encoding="utf-8"))

        # Paragraph indices (research/07 §1.1).
        self.body_ps = [p for p in self.body if p.tag == q("p")]
        # research/07 cell order: per cell its direct paragraphs, THEN the nested tables' cells.
        self.cell_ps = []

        def walk_tbl(tbl) -> None:
            for tr in tbl.findall(q("tr")):
                for tc in tr.findall(q("tc")):
                    self.cell_ps.extend(ch for ch in tc if ch.tag == q("p"))
                    for nt in tc.findall(q("tbl")):
                        walk_tbl(nt)
        for t in self.body:
            if t.tag == q("tbl"):
                walk_tbl(t)
        self.bidx = {p: i for i, p in enumerate(self.body_ps)}
        self.cidx = {p: i for i, p in enumerate(self.cell_ps)}
        need(len(self.body_ps) == len(self.research["body_assign"]) == 748, "body paragraph count != 748")
        need(len(self.cell_ps) == len(self.research["cell_assign"]) == 4159, "cell paragraph count != 4159")

        # Table ids: T001..T151 top level, N01..N02 nested (document order).
        self.tid: dict[Any, str] = {}
        top = [t for t in self.body if t.tag == q("tbl")]
        for i, t in enumerate(top, 1):
            self.tid[t] = f"T{i:03d}"
        n = 0
        for t in self.root.iter(q("tbl")):
            if t not in self.tid:
                n += 1
                self.tid[t] = f"N{n:02d}"
        need(len(top) == 151 and n == 2, f"tables {len(top)}+{n} != 151+2")

        # Cross-check research cell_assign (table, row, col) against the DOCX tree.
        for i, p in enumerate(self.cell_ps):
            tc = p.getparent()
            tr = tc.getparent()
            tbl = tr.getparent()
            row = tbl.findall(q("tr")).index(tr)
            col = tr.findall(q("tc")).index(tc)
            exp = self.research["cell_assign"][i]
            need([self.tid[tbl], row, col] == exp[:3], f"cell paragraph {i}: tree {self.tid[tbl]},{row},{col} != research {exp[:3]}")
        self.bclu = {p: self.research["body_assign"][i] for i, p in enumerate(self.body_ps)}
        self.cclu = {p: self.research["cell_assign"][i][3] for i, p in enumerate(self.cell_ps)}

        # Drawings in document order -> figure ids.
        self.drawings = list(self.body.iter(f"{{{dr.W}}}drawing"))
        need(len(self.drawings) == 52, f"drawings {len(self.drawings)} != 52")
        self.fig_of = {}
        for i, d in enumerate(self.drawings, 1):
            need(dr.drawing_docpr_id(d) == i, f"drawing {i}: docPr id {dr.drawing_docpr_id(d)} != placement order")
            self.fig_of[d] = FIG_ID.format(i)
        self.figures: list[dict] = [None] * 52  # type: ignore[list-item]
        self.assets: dict[str, dict] = {}

        self.trace_body: list[tuple[Any, str] | None] = [None] * 748
        self.trace_cell: list[tuple[Any, str] | None] = [None] * 4159
        self.trace_tables: list[dict] = []
        self.part_lists: list[tuple[dict, list[tuple[str, str]], Any]] = []

    # ── trace helpers ─────────────────────────────────────────────────────
    def mb(self, p, obj, note: str) -> None:
        i = self.bidx[p]
        need(self.trace_body[i] is None, f"p#{i} mapped twice")
        self.trace_body[i] = (obj, note)

    def mc(self, p, obj, note: str) -> None:
        i = self.cidx[p]
        need(self.trace_cell[i] is None, f"cell paragraph {i} mapped twice")
        self.trace_cell[i] = (obj, note)

    def mtable(self, tbl, construct: str, obj) -> None:
        tcws = [dr.all_tcw(tc) for tc in tbl.iter(q("tc"))]
        diff = sum(1 for w in tcws if len(w) == 2 and w[0] != w[1])
        self.trace_tables.append({"id": self.tid[tbl], "construct": construct, "obj": obj,
                                  "tcWPairsDiffer": diff, "tcW": tcws, "grid": dr.grid_cols(tbl)})

    # ── primitives ────────────────────────────────────────────────────────
    def inline(self, p) -> dict:
        drawings: list = []
        runs = dr.runs_of(p, drawings)
        need(not drawings, f"unexpected drawing in text paragraph {self.where(p)}")
        return {"runs": runs}

    def fmt(self, p) -> dict | None:
        return dr.para_format(p.find(q("pPr")))

    def where(self, p) -> str:
        if p in self.bidx:
            return f"p#{self.bidx[p]}"
        return f"cell-p{self.cidx[p]}"

    def clu(self, p) -> str:
        return self.bclu[p] if p in self.bclu else self.cclu[p]

    def cps(self, tc) -> list:
        return [ch for ch in tc if ch.tag == q("p")]

    def tbl_clusters(self, tbl) -> set[str]:
        out = set()
        for tr in tbl.findall(q("tr")):
            for tc in tr.findall(q("tc")):
                for p in self.cps(tc):
                    out.add(self.cclu[p])
        return out

    def table_cells(self, tbl) -> list[list]:
        return [tr.findall(q("tc")) for tr in tbl.findall(q("tr"))]

    def para_block(self, p, role: str) -> dict:
        b: dict[str, Any] = {"type": "paragraph", "role": role, **self.inline(p)}
        f = self.fmt(p)
        if f is not None:
            b["format"] = f
        b["x"] = {"bm": self.where(p)}
        self.mb(p, b, f"paragraph:{role}")
        return b

    def spacer(self, p) -> dict:
        need(not dr.para_raw_text(p), f"spacer {self.where(p)} has text")
        f = self.fmt(p)
        need(f is not None, f"spacer {self.where(p)} without pPr")
        s = {"type": "spacer", "format": f}
        self.mb(p, s, f"spacer:{self.clu(p)}")
        return s

    def drawing_of(self, p):
        drawings: list = []
        runs = dr.runs_of(p, drawings)
        need(len(drawings) == 1 and not runs, f"{self.where(p)}: expected exactly one drawing and no text")
        return drawings[0]

    def register_figure(self, drawing, kind: str, ref_obj, note: str, explicit: bool) -> dict:
        fid = self.fig_of[drawing]
        cx, cy = dr.drawing_extent(drawing)
        target = self.rels[dr.drawing_embed(drawing)]
        data = self.z.read("word/" + target)
        sha = hashlib.sha256(data).hexdigest()
        wpx, hpx = png_size(data)
        num = int(fid.split("-")[-1])
        entry = {"id": fid, "placement": num, "kind": kind, "media": target, "sha256": sha,
                 "widthPx": wpx, "heightPx": hpx, "widthMm": round(cx / 36000, 6), "heightMm": round(cy / 36000, 6),
                 "cx": cx, "cy": cy, "explicit": explicit, "_obj": ref_obj, "_note": note}
        self.figures[num - 1] = entry
        if explicit:
            self.assets[fid] = {"kind": "raster", "mime": "image/png", "sha256": sha, "widthPx": wpx, "heightPx": hpx}
        return entry

    def device_image(self, p, device: str, kind: str) -> dict:
        d = self.drawing_of(p)
        dev: dict[str, Any] = {"type": "device", "device": device, "asset": self.fig_of[d]}
        e = self.register_figure(d, kind, dev, f"device:{device}", True)
        dev["widthMm"] = e["widthMm"]
        dev["heightMm"] = e["heightMm"]
        f = self.fmt(p)
        if f is not None:
            dev["format"] = f
        self.mb(p, dev, f"device:{device}")
        return dev

    def device_text(self, p, device: str) -> dict:
        dev: dict[str, Any] = {"type": "device", "device": device}
        if dr.para_raw_text(p):
            dev["text"] = self.inline(p)
        f = self.fmt(p)
        if f is not None:
            dev["format"] = f
        self.mb(p, dev, f"device:{device}")
        return dev

    # ── cells and tables ──────────────────────────────────────────────────
    def cell_para(self, p) -> dict:
        cp: dict[str, Any] = self.inline(p)
        f = self.fmt(p)
        if f is not None:
            cp["format"] = f
        return cp

    def build_cell(self, tc) -> dict:
        cell: dict[str, Any] = {}
        ps = self.cps(tc)
        need(all(ch.tag in (q("p"), q("tcPr")) for ch in tc), "generic cell with nested table")
        if len(ps) == 1 and not dr.para_raw_text(ps[0]) and ps[0].find(q("pPr")) is None:
            cell["paragraphs"] = []
            self.mc(ps[0], cell, "cell:emptyParagraphNoPPr")
        else:
            paras = []
            for p in ps:
                cp = self.cell_para(p)
                paras.append(cp)
                self.mc(p, cp, "cell:paragraph")
            cell["paragraphs"] = paras
        cell.update(dr.cell_props(tc))
        return cell

    def inline_cell(self, tc, note: str) -> dict:
        ps = self.cps(tc)
        need(len(ps) == 1, f"single-paragraph cell expected ({note}), got {len(ps)}")
        il = self.inline(ps[0])
        self.mc(ps[0], il, note)
        return il

    def seal_band(self, tbl) -> dict:
        rows = self.table_cells(tbl)
        need(len(rows) == 1 and len(rows[0]) == 2, "seal band must be 1x2")
        dev: dict[str, Any] = {"type": "device", "device": "sealBand"}
        dev["left"] = self.inline_cell(rows[0][0], "sealBand.left")
        dev["right"] = self.inline_cell(rows[0][1], "sealBand.right")
        self.mtable(tbl, "device:sealBand", dev)
        return dev

    def column_specs(self, tbl, body_rows: list[list], grid: list[int], header_rows: list[list]) -> list[dict]:
        ncol = len(grid)
        votes: list[dict[str, int]] = [dict() for _ in range(ncol)]
        jcv: list[dict[str, int]] = [dict() for _ in range(ncol)]
        hjc: list[str | None] = [None] * ncol
        for row in body_rows:
            c = 0
            for tc in row:
                span = int(dr.cell_props(tc).get("gridSpan", 1))
                if span == 1:
                    for p in self.cps(tc):
                        cl = self.cclu[p]
                        votes[c][cl] = votes[c].get(cl, 0) + 1
                        jc = (self.fmt(p) or {}).get("jc", "left")
                        jcv[c][jc] = jcv[c].get(jc, 0) + 1
                c += span
        for row in header_rows:
            c = 0
            for tc in row:
                span = int(dr.cell_props(tc).get("gridSpan", 1))
                ps = self.cps(tc)
                if span == 1 and ps:
                    hjc[c] = (self.fmt(ps[0]) or {}).get("jc", "left")
                c += span
        role_of = {"KT-24": "id", "KT-28": "numeral", "KT-25": "text", "KT-38": "glyph", "KT-08": "text", "KT-04": "id"}
        cols = []
        for c in range(ncol):
            spec: dict[str, Any] = {"widthTw": grid[c]}
            v = {k: n for k, n in votes[c].items() if k not in ("KT-19", "KT-37")}
            if v:
                top = max(sorted(v), key=lambda k: v[k])
                spec["role"] = role_of.get(top, "text")
            align = max(sorted(jcv[c]), key=lambda k: jcv[c][k]) if jcv[c] else (hjc[c] or "left")
            spec["align"] = align if align in ("left", "right", "center") else "left"
            cols.append(spec)
        return cols

    def table_block(self, tbl, caption: dict | None, construct: str) -> dict:
        grid = dr.grid_cols(tbl)
        rows_el = tbl.findall(q("tr"))
        rows_c = [tr.findall(q("tc")) for tr in rows_el]
        source = None
        last = rows_c[-1]
        if len(last) == 1 and int(dr.cell_props(last[0]).get("gridSpan", 1)) == len(grid) and \
                all(self.cclu[p] == "KT-26" for p in self.cps(last[0])):
            ps = self.cps(last[0])
            need(len(ps) == 1, "source row must have one paragraph")
            source = {"inline": self.inline(ps[0])}
            f = self.fmt(ps[0])
            if f is not None:
                source["format"] = f
            self.mc(ps[0], source, "table.source")
            rows_el, rows_c = rows_el[:-1], rows_c[:-1]
        rows = []
        header_rows, body_rows = [], []
        for tr, tcs in zip(rows_el, rows_c):
            rp = dr.row_props(tr)
            clusters = {self.cclu[p] for tc in tcs for p in self.cps(tc)}
            if rp.get("repeatHeader") or clusters <= {"KT-07"} or clusters <= {"KT-23", "KT-27"}:
                kind = "header"
                header_rows.append(tcs)
            elif clusters == {"KT-32"}:
                kind = "group"
            else:
                kind = "body"
                body_rows.append(tcs)
            row: dict[str, Any] = {"kind": kind, "cells": [self.build_cell(tc) for tc in tcs]}
            row["cantSplit"] = rp.get("cantSplit", False)
            if kind == "header":
                row["repeatHeader"] = rp.get("repeatHeader", False)
            rows.append(row)
        cols = self.column_specs(tbl, body_rows, grid, header_rows)
        glyph_cells = [p for tcs in body_rows for tc in tcs for p in self.cps(tc) if self.cclu[p] == "KT-38"]
        ttype = "table"
        if glyph_cells and all(dr.para_raw_text(p) == "☐" for p in glyph_cells):
            ttype = "checklist"
        tb: dict[str, Any] = {"type": ttype}
        if caption is not None:
            tb["caption"] = caption
        tb["columns"] = cols
        tb["rows"] = rows
        if source is not None:
            tb["source"] = source
            tb["sourcePlacement"] = "lastRowMerged"
        tb["layout"] = dr.table_layout(tbl)
        tb["x"] = {"bm": self.tid[tbl]}
        self.mtable(tbl, construct, tb)
        return tb

    def rail_paragraph(self, tbl) -> dict:
        rows = self.table_cells(tbl)
        need(len(rows) == 1 and len(rows[0]) == 3, "rail table must be 1x3")
        prose_c, gap_c, rail_c = rows[0]
        pps = self.cps(prose_c)
        need(len(pps) == 1 and self.cclu[pps[0]] == "KT-18", "rail prose cell must be one KT-18 paragraph")
        b: dict[str, Any] = {"type": "paragraph", "role": "body", **self.inline(pps[0])}
        f = self.fmt(pps[0])
        if f is not None:
            b["format"] = f
        self.mc(pps[0], b, "rail.prose")
        gps = self.cps(gap_c)
        need(len(gps) == 1 and self.cclu[gps[0]] == "KT-19" and not dr.para_raw_text(gps[0]), "rail gap cell")
        self.mc(gps[0], b, "derived:rail.gapCell(KT-19)")
        rail = []
        for p in self.cps(rail_c):
            cl = self.cclu[p]
            line: dict[str, Any] = {}
            runs = dr.runs_of(p)
            if cl in ("KT-20", "KT-29", "KT-39"):
                glyph = runs[0].get("t", "").strip()
                need(glyph in GLYPH_MARK, f"rail mark glyph {glyph!r}")
                mark = GLYPH_MARK[glyph]
                need(dr.run_text(runs).strip().endswith(mark), f"rail mark label != {mark}")
                line = {"kind": "mark", "mark": mark}
            elif cl == "KT-21":
                line = {"kind": "source"}
            elif cl == "KT-22":
                line = {"kind": "note"}
            else:
                raise ExtractError(f"rail cell cluster {cl}")
            line["runs"] = runs
            f = self.fmt(p)
            if f is not None:
                line["format"] = f
            self.mc(p, line, f"rail.{line['kind']}")
            rail.append(line)
        b["rail"] = rail
        b["x"] = {"bm": self.tid[tbl]}
        self.mtable(tbl, "paragraph+rail(table3col)", b)
        return b

    def aside(self, tbl) -> dict:
        rows = self.table_cells(tbl)
        need(len(rows) == 1 and len(rows[0]) == 1, "aside must be 1x1")
        ps = self.cps(rows[0][0])
        need(self.cclu[ps[0]] == "KT-30" and all(self.cclu[p] == "KT-31" for p in ps[1:]) and len(ps) >= 2, "aside clusters")
        label_text = dr.para_raw_text(ps[0])
        if label_text.startswith("Diktum"):
            variant = "doctrine"
        elif label_text.startswith("Bila ragu"):
            variant = "ifInDoubt"
        elif label_text.startswith("Tiga cek"):
            variant = "quickCheck"
        else:
            variant = "generic"
        a: dict[str, Any] = {"type": "aside", "variant": variant, "label": self.inline(ps[0])}
        self.mc(ps[0], a["label"], "aside.label")
        body = []
        for p in ps[1:]:
            cp = self.cell_para(p)
            self.mc(p, cp, "aside.body")
            body.append(cp)
        a["body"] = body
        a["x"] = {"bm": self.tid[tbl]}
        self.mtable(tbl, "aside", a)
        return a

    def mono_block(self, tbl) -> dict:
        rows = self.table_cells(tbl)
        need(len(rows) == 1 and len(rows[0]) == 1, "monoBlock must be 1x1")
        ps = self.cps(rows[0][0])
        need(self.cclu[ps[0]] == "KT-40" and all(self.cclu[p] == "KT-35" for p in ps[1:]), "monoBlock clusters")
        m: dict[str, Any] = {"type": "monoBlock", "label": self.inline(ps[0])}
        self.mc(ps[0], m["label"], "monoBlock.label")
        lines = []
        for p in ps[1:]:
            cp = self.cell_para(p)
            self.mc(p, cp, "monoBlock.line")
            lines.append(cp)
        m["lines"] = lines
        m["x"] = {"bm": self.tid[tbl]}
        self.mtable(tbl, "monoBlock", m)
        return m

    def derivation(self, tbl) -> dict:
        rows = self.table_cells(tbl)
        need(len(rows) == 1 and len(rows[0]) == 1, "derivation must be 1x1")
        kids = [ch for ch in rows[0][0] if ch.tag in (q("p"), q("tbl"))]
        need(kids[0].tag == q("p") and self.cclu[kids[0]] == "KT-33", "derivation title first")
        title_p = kids[0]
        title_text = dr.para_raw_text(title_p)
        mid = re.search(r"\bD-[0-9]+\.[0-9]+[a-z]?\b", title_text)
        need(mid is not None, "derivation id")
        d: dict[str, Any] = {"type": "derivation", "id": mid.group(0), "title": self.inline(title_p)}
        self.mc(title_p, d["title"], "derivation.title")
        nested = [k for k in kids if k.tag == q("tbl")]
        need(len(nested) == 1, "derivation needs one nested table")
        ni = kids.index(nested[0])
        before = [k for k in kids[1:ni]]
        after = kids[ni + 1:]
        for p in before:  # intro (KT-34 before the lines table) - none in BM
            need(self.cclu[p] == "KT-34", "derivation intro cluster")
            d["intro"] = self.inline(p)
            self.mc(p, d["intro"], "derivation.intro")
        lines = []
        for tr in nested[0].findall(q("tr")):
            tcs = tr.findall(q("tc"))
            need(len(tcs) == 2, "derivation line row must have 2 cells")
            ln: dict[str, Any] = {"label": self.inline_cell(tcs[0], "derivation.line.label")}
            vps = self.cps(tcs[1])
            need(len(vps) == 1 and self.cclu[vps[0]] == "KT-36", "derivation value cell")
            vruns = dr.runs_of(vps[0])
            g = vruns[-1].get("t") if vruns else None
            if g in GLYPH_MARK:
                ln["value"] = {"runs": vruns[:-1]}
                ln["mark"] = GLYPH_MARK[g]
            else:
                ln["value"] = {"runs": vruns}
            self.mc(vps[0], ln["value"], "derivation.line.value(+mark glyph)")
            lines.append(ln)
        d["lines"] = lines
        need(len(after) >= 1 and self.cclu[after[0]] == "KT-19" and not dr.para_raw_text(after[0]) and
             after[0].find(q("pPr")) is None, "derivation: empty paragraph after nested table")
        self.mc(after[0], d, "derived:derivation.afterNested(KT-19)")
        rest = after[1:]
        need(len(rest) <= 1, "derivation: at most one closing paragraph")
        if rest:
            need(self.cclu[rest[0]] == "KT-34", "derivation closing cluster")
            d["closing"] = self.inline(rest[0])
            self.mc(rest[0], d["closing"], "derivation.closing(KT-34)")
        else:
            d["closing"] = {"runs": []}
        d["x"] = {"bm": self.tid[tbl], "nested": self.tid[nested[0]], "closingFormat": self.fmt(rest[0]) if rest else None,
                  "titleFormat": self.fmt(title_p)}
        self.mtable(tbl, "derivation", d)
        self.mtable(nested[0], "derivation.lines(nested)", d)
        return d

    def classify_table(self, tbl) -> str:
        cl = self.tbl_clusters(tbl)
        rows = self.table_cells(tbl)
        if cl <= {"KT-01", "KT-02"}:
            return "sealBand"
        if cl <= {"KT-03", "KT-04"}:
            return "controlBlock"
        if cl <= {"KT-05", "KT-06"}:
            return "colophon"
        if "KT-09" in cl:
            return "signature"
        if cl & {"KT-10", "KT-13"}:
            return "toc"
        if cl <= {"KT-16", "KT-17"}:
            return "partList"
        if "KT-18" in cl:
            return "rail"
        if "KT-30" in cl:
            return "aside"
        if "KT-33" in cl:
            return "derivation"
        if "KT-40" in cl:
            return "monoBlock"
        if "KT-26" in cl:
            return "data"
        if cl <= {"KT-04", "KT-07", "KT-08"} and len(rows) > 1:
            return "controlTable"
        raise ExtractError(f"{self.tid[tbl]}: unclassified table clusters {sorted(cl)}")

    # ── units ─────────────────────────────────────────────────────────────
    def units(self) -> list[tuple[list, Any]]:
        out, cur = [], []
        for ch in self.body:
            if ch.tag == q("sectPr"):
                out.append((cur, ch))
                cur = []
                continue
            cur.append(ch)
            if ch.tag == q("p") and ch.find(f"{q('pPr')}/{q('sectPr')}") is not None:
                out.append((cur, ch.find(f"{q('pPr')}/{q('sectPr')}")))
                cur = []
        need(not cur, "content after final sectPr")
        need(len(out) == 29, f"units {len(out)} != 29")
        return out

    def holder(self, p, unit_obj) -> None:
        need(self.bclu[p] == "K-12" and not dr.para_raw_text(p), "unit must end with K-12 holder")
        self.mb(p, unit_obj, "derived:sectionHolder(K-12)")

    def hf_part(self, rid: str) -> dict:
        part = "word/" + self.rels[rid]
        root = etree.fromstring(self.z.read(part))
        kids = [k for k in root if k.tag in (q("p"), q("tbl"))]
        if len(kids) == 1 and kids[0].tag == q("p"):
            p = kids[0]
            runs = dr.runs_of(p)
            fmt = dr.para_format(p.find(q("pPr"))) or {}
            if not runs:
                return {"mode": "empty", "format": fmt}
            tabs = [i for i, r in enumerate(runs) if "tab" in r]
            need(len(tabs) == 1, f"{part}: running head needs exactly one tab")
            i = tabs[0]
            return {"mode": "runningHead", "left": {"runs": runs[:i]}, "right": {"runs": runs[i + 1:]}, "format": fmt}
        need(kids[0].tag == q("tbl") and all(k.tag == q("p") and not dr.para_raw_text(k) for k in kids[1:]),
             f"{part}: unexpected footer structure")
        tbl = kids[0]
        rows = tbl.findall(q("tr"))
        need(len(rows) == 1, f"{part}: register block must have one row")
        cells = []
        for tc in rows[0].findall(q("tc")):
            ps = [p for p in tc if p.tag == q("p")]
            need(len(ps) == 1, f"{part}: register cell must have one paragraph")
            cells.append({"runs": dr.runs_of(ps[0])})
        if len(kids) > 1:
            dr.UNMAPPED[f"footer:trailingEmptyParagraph:{part}"] += 1
        return {"mode": "registerBlock", "cells": cells}

    def setup_of(self, sect) -> dict:
        pgsz = sect.find(q("pgSz"))
        mar = sect.find(q("pgMar"))
        s: dict[str, Any] = {"pageSizeTw": [int(dr.wa(pgsz, "w")), int(dr.wa(pgsz, "h"))]}
        s["marginTw"] = {k: int(dr.wa(mar, k)) for k in ("top", "bottom", "left", "right", "header", "footer", "gutter")}
        cols = sect.find(q("cols"))
        if cols is not None:
            s["cols"] = {"num": int(dr.wa(cols, "num") or 1), "spaceTw": int(dr.wa(cols, "space") or 0)}
        grid = sect.find(q("docGrid"))
        if grid is not None and dr.wa(grid, "linePitch"):
            s["docGridLinePitch"] = int(dr.wa(grid, "linePitch"))
        if sect.find(q("titlePg")) is not None:
            s["titlePg"] = True
        for ch in sect:
            n = dr.local(ch)
            if n not in ("pgSz", "pgMar", "cols", "docGrid", "titlePg", "headerReference", "footerReference"):
                dr.UNMAPPED[f"sectPr:{n}"] += 1
        for ref in sect.findall(q("headerReference")):
            need(dr.wa(ref, "type") == "default", "only default header references supported")
            s["header"] = self.hf_part(ref.get(f"{{{dr.R_NS}}}id"))
        for ref in sect.findall(q("footerReference")):
            need(dr.wa(ref, "type") == "default", "only default footer references supported")
            s["footer"] = self.hf_part(ref.get(f"{{{dr.R_NS}}}id"))
        return s

    def front_paragraph(self, p, body: list) -> None:
        cl = self.bclu[p]
        if cl == "K-01":
            body.append(self.device_image(p, "logo", "logo"))
        elif cl == "K-04":
            body.append(self.device_image(p, "datumRule", "datumRule166"))
        elif cl == "K-03":
            body.append(self.device_text(p, "hairline"))
        elif cl == "K-11":
            body.append(self.device_text(p, "spineString"))
        elif cl in SPACER_CLUSTERS:
            body.append(self.spacer(p))
        else:
            role = {"K-02": "addressLine", "K-05": "kicker", "K-06": "title", "K-07": "title", "K-08": "standfirst",
                    "K-09": "scopeLine", "K-13": "kicker", "K-14": "pageTitle", "K-15": "blockHeading",
                    "K-17": "methodStatement"}.get(cl)
            need(role is not None, f"{self.where(p)}: cluster {cl} not allowed on a front page")
            body.append(self.para_block(p, role))

    def cover(self, items, sect) -> dict:
        fp: dict[str, Any] = {"mode": "explicit", "body": []}
        for el in items[:-1]:
            if el.tag == q("tbl"):
                kind = self.classify_table(el)
                rows = self.table_cells(el)
                if kind == "sealBand":
                    fp["body"].append(self.seal_band(el))
                elif kind == "controlBlock":
                    cb: dict[str, Any] = {"type": "controlBlock", "rows": []}
                    for r, row in enumerate(rows):
                        need(len(row) == 4, "control block rows have 4 cells")
                        cb["rows"].append([self.inline_cell(tc, f"controlBlock.rows[{r}][{c}]") for c, tc in enumerate(row)])
                    cb["colsTw"] = dr.grid_cols(el)
                    self.mtable(el, "controlBlock", cb)
                    fp["body"].append(cb)
                elif kind == "colophon":
                    need(len(rows) == 1 and len(rows[0]) == 2, "colophon 1x2")
                    co = {"type": "colophon", "left": self.inline_cell(rows[0][0], "colophon.left"),
                          "right": self.inline_cell(rows[0][1], "colophon.right")}
                    self.mtable(el, "colophon", co)
                    fp["body"].append(co)
                else:
                    raise ExtractError(f"cover table {self.tid[el]} kind {kind}")
            else:
                self.front_paragraph(el, fp["body"])
        fp["setup"] = self.setup_of(sect)
        self.holder(items[-1], fp)
        return fp

    def control_sheet(self, items, sect) -> dict:
        fp: dict[str, Any] = {"mode": "explicit", "body": []}
        for el in items[:-1]:
            if el.tag == q("tbl"):
                kind = self.classify_table(el)
                if kind == "sealBand":
                    fp["body"].append(self.seal_band(el))
                elif kind == "controlTable":
                    fp["body"].append(self.table_block(el, None, "table(controlSheet)"))
                elif kind == "signature":
                    fp["body"].append(self.signature(el))
                else:
                    raise ExtractError(f"control sheet table {self.tid[el]} kind {kind}")
            else:
                self.front_paragraph(el, fp["body"])
        fp["setup"] = self.setup_of(sect)
        self.holder(items[-1], fp)
        return fp

    def signature(self, tbl) -> dict:
        rows = self.table_cells(tbl)
        need(len(rows) == 3, "signature table has 3 rows")
        cl = [[self.cclu[self.cps(tc)[0]] for tc in row] for row in rows]
        need(all(c == "KT-07" for c in cl[0]) and all(c == "KT-09" for c in cl[1]) and all(c == "KT-08" for c in cl[2]),
             f"signature row order {cl}")
        sb: dict[str, Any] = {"type": "signatureBlock", "roles": []}
        sign_fmts = []
        for c in range(len(rows[0])):
            sb["roles"].append({"role": self.inline_cell(rows[0][c], "signature.role"),
                                "holder": self.inline_cell(rows[2][c], "signature.holder")})
            sp = self.cps(rows[1][c])
            need(len(sp) == 1 and not dr.para_raw_text(sp[0]), "signature sign cell empty")
            sign_fmts.append(self.fmt(sp[0]))
            self.mc(sp[0], sb, "signature.signRow")
        need(all(f == sign_fmts[0] for f in sign_fmts), "sign row formats differ")
        sb["signRowFormat"] = sign_fmts[0]
        sb["colsTw"] = dr.grid_cols(tbl)
        self.mtable(tbl, "signatureBlock", sb)
        return sb

    def toc(self, items, sect) -> dict:
        order = []
        t: dict[str, Any] = {"mode": "static"}
        for el in items[:-1]:
            if el.tag == q("tbl"):
                kind = self.classify_table(el)
                if kind == "sealBand":
                    t["sealBand"] = self.seal_band(el)
                    order.append("sealBand")
                elif kind == "toc":
                    entries = []
                    for row in self.table_cells(el):
                        need(len(row) == 3, "toc row has 3 cells")
                        c0 = self.cclu[self.cps(row[0])[0]]
                        label = self.inline_cell(row[0], "toc.entry.label")
                        if c0 == "KT-10":
                            level = "part"
                        else:
                            need(c0 == "KT-13", "toc chapter label cluster")
                            level = "appendix" if dr.run_text(label["runs"]).startswith("Lampiran") else "chapter"
                        title = self.inline_cell(row[1], "toc.entry.title")
                        pps = self.cps(row[2])
                        need(len(pps) == 1, "toc page cell")
                        e = {"level": level, "label": label, "title": title, "page": dr.para_raw_text(pps[0])}
                        self.mc(pps[0], e, "toc.entry.page")
                        entries.append(e)
                    t["entries"] = entries
                    self.mtable(el, "toc.entries", t)
                    order.append("entries")
                else:
                    raise ExtractError(f"toc table {self.tid[el]} kind {kind}")
            else:
                cl = self.bclu[el]
                key = {"K-13": "kicker", "K-18": "title", "K-19": "note"}.get(cl)
                need(key is not None, f"toc paragraph cluster {cl}")
                t[key] = self.inline(el)
                self.mb(el, t[key], f"toc.{key}")
                order.append(key)
        need(order == ["sealBand", "kicker", "title", "entries", "note"], f"toc order {order}")
        t["setup"] = self.setup_of(sect)
        self.holder(items[-1], t)
        return t

    def part(self, items, sect, n: int) -> dict:
        ps: dict[str, Any] = {"id": f"P{n}"}
        body: list = []
        order = []
        for el in items[:-1]:
            if el.tag == q("tbl"):
                kind = self.classify_table(el)
                if kind == "sealBand":
                    body.append(self.seal_band(el))
                    order.append("body")
                elif kind == "partList":
                    lst = []
                    for row in self.table_cells(el):
                        need(len(row) == 2, "part chapter list rows have 2 cells")
                        p0, p1 = self.cps(row[0])[0], self.cps(row[1])[0]
                        lst.append((dr.para_raw_text(p0), dr.para_raw_text(p1)))
                        self.mc(p0, ps, "derived:part.chapterList.label")
                        self.mc(p1, ps, "derived:part.chapterList.title")
                    self.part_lists.append((ps, lst, el))
                    self.mtable(el, "derived:part.chapterList", ps)
                    order.append("list")
                else:
                    raise ExtractError(f"part table {self.tid[el]} kind {kind}")
            else:
                cl = self.bclu[el]
                if cl in ("K-05", "K-21", "K-22"):
                    key = {"K-05": "label", "K-21": "title", "K-22": "lede"}[cl]
                    ps[key] = self.inline(el)
                    self.mb(el, ps[key], f"part.{key}")
                    order.append(key)
                else:
                    self.front_paragraph(el, body)
                    order.append("body")
        need(order == ["body", "body", "body", "label", "title", "lede", "list"], f"part order {order}")
        ps["chapterKeys"] = []
        ps["showChapterList"] = True
        ps["body"] = body
        ps["setup"] = self.setup_of(sect)
        self.holder(items[-1], ps)
        return ps

    def chapter(self, items, sect, part_id: str | None, has_holder: bool) -> tuple[dict, bool]:
        need(len(items) >= 4, "chapter too short")
        k, r, t = items[0], items[1], items[2]
        need(k.tag == r.tag == t.tag == q("p") and [self.bclu[k], self.bclu[r], self.bclu[t]] == ["K-23", "K-24", "K-25"],
             "chapter must start with kicker, datum rule, title")
        ktext = dr.para_raw_text(k)
        m = re.fullmatch(r"(Bab|Lampiran) ([0-9]+|[A-Z])", ktext)
        need(m is not None, f"chapter kicker {ktext!r}")
        is_app = m.group(1) == "Lampiran"
        ch: dict[str, Any] = {"key": m.group(2), "kicker": self.inline(k), "title": self.inline(t)}
        self.mb(k, ch["kicker"], "chapter.kicker")
        self.mb(t, ch["title"], "chapter.title")
        rule = self.drawing_of(r)
        self.register_figure(rule, "datumRule128", ch, "derived:chapter.datumRule", False)
        self.mb(r, ch, "derived:chapter.datumRule(K-24)")
        if part_id and not is_app:
            ch["partId"] = part_id
        ch["setup"] = self.setup_of(sect)
        intro: list = []
        sections: list = []
        target = intro
        pending_caption = None
        els = items[3:-1] if has_holder else items[3:]
        i = 0
        while i < len(els):
            el = els[i]
            if pending_caption is not None:
                need(el.tag == q("tbl") or self.bclu.get(el) == "K-32", f"caption {self.where(pending_caption[1])} not followed by table/figure")
            if el.tag == q("tbl"):
                kind = self.classify_table(el)
                if kind == "data":
                    need(pending_caption is not None and pending_caption[0]["label"].startswith("Tabel"),
                         f"{self.tid[el]}: data table without Tabel caption")
                    target.append(self.table_block(el, pending_caption[0], "table"))
                    pending_caption = None
                elif kind == "rail":
                    target.append(self.rail_paragraph(el))
                elif kind == "aside":
                    target.append(self.aside(el))
                elif kind == "derivation":
                    target.append(self.derivation(el))
                elif kind == "monoBlock":
                    target.append(self.mono_block(el))
                else:
                    raise ExtractError(f"{self.tid[el]}: table kind {kind} inside chapter")
                i += 1
                continue
            cl = self.bclu[el]
            if cl == "K-26":
                runs = dr.runs_of(el)
                need(len(runs) >= 2 and "t" in runs[0], f"{self.where(el)}: section heading runs")
                mnum = re.fullmatch(r"([0-9]+|[A-Z])\.([0-9]+)(\s*)", runs[0]["t"])
                need(mnum is not None, f"{self.where(el)}: section number run {runs[0]['t']!r}")
                num = f"{mnum.group(1)}.{mnum.group(2)}"
                need(mnum.group(1) == ch["key"], f"{self.where(el)}: section {num} outside chapter {ch['key']}")
                title_runs = list(runs[1:])
                sep = mnum.group(3)
                if sep:
                    props = {k2: v for k2, v in runs[0].items() if k2 != "t"}
                    title_runs.insert(0, {"t": sep, **props})
                sec: dict[str, Any] = {"number": num, "title": {"runs": title_runs}}
                f = self.fmt(el)
                if f is not None:
                    sec["headingFormat"] = f
                sec["blocks"] = []
                sections.append(sec)
                target = sec["blocks"]
                self.mb(el, sec, "section.heading")
                i += 1
            elif cl in SPACER_CLUSTERS:
                target.append(self.spacer(el))
                i += 1
            elif cl == "K-28":
                target.append(self.para_block(el, "body"))
                i += 1
            elif cl == "K-36":
                target.append(self.para_block(el, "subheading"))
                i += 1
            elif cl == "K-29":
                need(pending_caption is None, "two captions in a row")
                runs = dr.runs_of(el)
                mcap = re.fullmatch(r"((?:Tabel|Gambar) (?:[0-9]+|[A-Z])\.[0-9]+)(\s*)", runs[0].get("t", ""))
                need(mcap is not None, f"{self.where(el)}: caption label run {runs[0].get('t')!r}")
                cap: dict[str, Any] = {"label": mcap.group(1)}
                if mcap.group(2):
                    cap["separator"] = mcap.group(2)
                cap["inline"] = {"runs": runs[1:]}
                cap["labelProps"] = {k2: v for k2, v in runs[0].items() if k2 != "t"}
                f = self.fmt(el)
                if f is not None:
                    cap["format"] = f
                self.mb(el, cap, "caption")
                pending_caption = (cap, el)
                i += 1
            elif cl in ("K-30", "K-35"):
                style = "bullet" if cl == "K-30" else "number"
                lst: dict[str, Any] = {"type": "list", "style": style, "items": []}
                first = el
                while i < len(els) and els[i].tag == q("p") and self.bclu[els[i]] == cl:
                    p = els[i]
                    runs = dr.runs_of(p)
                    need(len(runs) >= 3 and "t" in runs[0] and "tab" in runs[1], f"{self.where(p)}: list marker + tab")
                    mprops = {k2: v for k2, v in runs[0].items() if k2 != "t"}
                    tprops = {k2: v for k2, v in runs[1].items() if k2 != "tab"}
                    need(mprops == tprops, f"{self.where(p)}: marker and tab props differ")
                    item: dict[str, Any] = {"runs": runs[2:], "marker": runs[0]}
                    f = self.fmt(p)
                    if f is not None:
                        item["format"] = f
                    lst["items"].append(item)
                    self.mb(p, item, f"list.{style}.item")
                    i += 1
                lst["x"] = {"bm": f"{self.where(first)}..{self.where(els[i - 1])}"}
                target.append(lst)
            elif cl == "K-32":
                need(pending_caption is not None and pending_caption[0]["label"].startswith("Gambar"),
                     f"{self.where(el)}: figure without Gambar caption")
                d = self.drawing_of(el)
                fid = self.fig_of[d]
                img: dict[str, Any] = {"type": "image", "asset": fid, "caption": pending_caption[0]}
                pending_caption = None
                e = self.register_figure(d, "figure", img, "image", True)
                f = self.fmt(el)
                if f is not None:
                    img["paragraphFormat"] = f
                self.mb(el, img, "figure.paragraph")
                i += 1
                if i < len(els) and els[i].tag == q("p") and self.bclu[els[i]] == "K-33":
                    img["keyRow"] = self.inline(els[i])
                    self.mb(els[i], img["keyRow"], "figure.keyRow")
                    img.setdefault("x", {})["keyRowFormat"] = self.fmt(els[i])
                    i += 1
                need(i < len(els) and els[i].tag == q("p") and self.bclu[els[i]] == "K-34", f"figure {fid} without SUMBER line")
                src: dict[str, Any] = {"inline": self.inline(els[i])}
                f = self.fmt(els[i])
                if f is not None:
                    src["format"] = f
                self.mb(els[i], src, "figure.source")
                img["source"] = src
                img["widthMm"] = e["widthMm"]
                img["heightMm"] = e["heightMm"]
                x = img.pop("x", {})
                img["x"] = {"bm": f"p#{self.bidx[el]}", "figureRef": fid, "media": e["media"], "resolveBy": "S94", **x}
                target.append(img)
                i += 1
            else:
                raise ExtractError(f"{self.where(el)}: cluster {cl} not mapped inside a chapter")
        need(pending_caption is None, "dangling caption at end of chapter")
        if intro:
            ch["intro"] = intro
        ch["sections"] = sections
        if has_holder:
            self.holder(items[-1], ch)
        return ch, is_app

    # ── document ──────────────────────────────────────────────────────────
    def run(self) -> dict:
        units = self.units()
        front: dict[str, Any] = {}
        parts: list = []
        chapters: list = []
        appendices: list = []
        unit_kinds = []
        cur_part = None
        for n, (items, sect) in enumerate(units):
            last_unit = n == len(units) - 1
            if not last_unit:
                need(items[-1].tag == q("p") and self.bclu[items[-1]] == "K-12", f"unit {n + 1} must end with holder")
            if n == 0:
                front["cover"] = self.cover(items, sect)
                unit_kinds.append("cover")
            elif n == 1:
                front["controlSheet"] = self.control_sheet(items, sect)
                unit_kinds.append("controlSheet")
            elif n == 2:
                front["toc"] = self.toc(items, sect)
                unit_kinds.append("toc")
            elif items[0].tag == q("tbl"):
                ps = self.part(items, sect, len(parts) + 1)
                parts.append(ps)
                cur_part = ps["id"]
                unit_kinds.append("part")
            else:
                ch, is_app = self.chapter(items, sect, cur_part, not last_unit)
                (appendices if is_app else chapters).append(ch)
                unit_kinds.append("appendix" if is_app else "chapter")
        # part chapter lists -> chapterKeys (derived), checked against chapter kicker/title text
        by_kicker = {dr.run_text(c["kicker"]["runs"]): c for c in chapters}
        for ps, lst, el in self.part_lists:
            for label, title in lst:
                c = by_kicker.get(label)
                need(c is not None, f"{ps['id']}: list label {label!r} has no chapter")
                need(dr.run_text(c["title"]["runs"]) == title, f"{ps['id']}: list title {title!r} != chapter title")
                need(c.get("partId") == ps["id"], f"{ps['id']}: chapter {c['key']} partId {c.get('partId')}")
                ps["chapterKeys"].append(c["key"])
        need(all(e is not None for e in self.figures), "figure registry incomplete")
        meta = self.meta(front)
        doc: dict[str, Any] = {
            "$schema": "studio.doc/v1",
            "template": {"slug": TEMPLATE_SLUG},
            "meta": meta,
            "front": front,
            "parts": parts,
            "chapters": chapters,
            "appendices": appendices,
            "assets": self.assets,
            "outputs": ["docx", "pdf"],
        }
        bm_bytes = self.docx.read_bytes()
        doc["x"] = {
            "benchmark": {
                "source": self.docx.name,
                "sha256": hashlib.sha256(bm_bytes).hexdigest(),
                "bytes": len(bm_bytes),
                "extractor": "benchmark/extract/extract_manual000.py (S93)",
                "units": unit_kinds,
                "conventions": CONVENTIONS,
                "gaps": GAPS,
            },
            "figures": [{k: v for k, v in e.items() if not k.startswith("_")} for e in self.figures],
        }
        self.doc = doc
        return doc

    def meta(self, front: dict) -> dict:
        cb = next(b for b in front["cover"]["body"] if b.get("type") == "controlBlock")
        kv = {}
        for row in cb["rows"]:
            for c in (0, 2):
                kv[dr.run_text(row[c]["runs"])] = dr.run_text(row[c + 1]["runs"])
        seal = front["cover"]["body"][0]
        colo = next(b for b in front["cover"]["body"] if b.get("type") == "colophon")
        title = next(b for b in front["cover"]["body"] if b.get("role") == "title")
        cstamp = dr.run_text(colo["right"]["runs"])
        mdate = re.search(r"(\d{4})(\d{2})(\d{2})", cstamp)
        missue = re.search(r"TERBITAN (\d+)", cstamp)
        need(mdate is not None and missue is not None, "colophon stamp")
        num = kv["Nomor dokumen"]
        return {
            "title": dr.run_text(title["runs"]),
            "docNumber": num,
            "rev": kv["Revisi"].split(" ")[0],
            "typeCode": num.split("/")[2],
            "tier": kv["Tier"].split(",")[0],
            "classification": dr.run_text(seal["left"]["runs"]).split("·")[-1].strip(),
            "language": "ID" if kv["Bahasa"] == "Indonesia" else "EN",
            "author": kv["Penyusun"],
            "issueDate": f"{mdate.group(1)}-{mdate.group(2)}-{mdate.group(3)}",
            "custodian": kv["Kustodian"],
            "audience": kv["Ditujukan kepada"],
            "basis": kv["Dasar"],
            "issueNumber": int(missue.group(1)),
        }

    # ── trace ─────────────────────────────────────────────────────────────
    def pointers(self) -> dict[int, str]:
        ptr: dict[int, str] = {}

        def esc(k: str) -> str:
            return k.replace("~", "~0").replace("/", "~1")

        def walk(o, p):
            if isinstance(o, dict):
                ptr.setdefault(id(o), p)
                for k, v in o.items():
                    walk(v, f"{p}/{esc(k)}")
            elif isinstance(o, list):
                ptr.setdefault(id(o), p)
                for i, v in enumerate(o):
                    walk(v, f"{p}/{i}")
        walk(self.doc, "")
        return ptr

    def trace(self) -> dict:
        ptr = self.pointers()

        def res(t):
            if t is None:
                return None, "UNMAPPED"
            obj, note = t
            return ptr.get(id(obj), "?"), note
        body = []
        for i, t in enumerate(self.trace_body):
            p, note = res(t)
            body.append({"p": i, "cluster": self.research["body_assign"][i], "ptr": p, "note": note})
        cells = []
        for i, t in enumerate(self.trace_cell):
            p, note = res(t)
            a = self.research["cell_assign"][i]
            cells.append({"i": i, "table": a[0], "r": a[1], "c": a[2], "cluster": a[3], "ptr": p, "note": note})
        tables = []
        for t in self.trace_tables:
            tables.append({"id": t["id"], "construct": t["construct"], "ptr": ptr.get(id(t["obj"]), "?"),
                           "grid": t["grid"], "tcWPairsDiffer": t["tcWPairsDiffer"], "tcW": t["tcW"]})
        figs = []
        for e in self.figures:
            figs.append({"id": e["id"], "kind": e["kind"], "ptr": ptr.get(id(e["_obj"]), "?"), "note": e["_note"],
                         "media": e["media"], "sha256": e["sha256"], "explicit": e["explicit"]})
        return {"source": str(self.docx), "body": body, "cells": cells, "tables": tables, "figures": figs,
                "unmappedXml": dict(dr.UNMAPPED), "conventions": CONVENTIONS, "gaps": GAPS}


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="S93: BM.docx -> benchmark/manual000/doc.json (studio.doc/v1)")
    ap.add_argument("--docx", type=Path, default=DEFAULT_BM)
    ap.add_argument("--research", type=Path, default=DEFAULT_RESEARCH, help="research/07_benchmark_data.json")
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT, help="content-only doc.json (RT-01, D-119)")
    ap.add_argument("--verbatim-out", type=Path, default=DEFAULT_VERBATIM_OUT, help="verbatim extraction (diagnosis)")
    ap.add_argument("--trace", type=Path, default=DEFAULT_TRACE)
    a = ap.parse_args(argv)
    for f in (a.docx, a.research):
        if not f.is_file():
            print(f"input missing: {f}", file=sys.stderr)
            return 2
    try:
        ex = Extractor(a.docx, a.research)
        doc = ex.run()
        trace = ex.trace()
    except ExtractError as e:
        print(f"EXTRACT FAILED: {e}", file=sys.stderr)
        return 1
    a.verbatim_out.parent.mkdir(parents=True, exist_ok=True)
    a.verbatim_out.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    co = content_only(doc)
    keys = count_display_keys(co)
    if any(n for k, n in keys.items() if k != "listBlock.style(kind)"):
        print(f"CONTENT-ONLY FAILED: display keys left {keys}", file=sys.stderr)
        return 1
    a.out.parent.mkdir(parents=True, exist_ok=True)
    a.out.write_text(json.dumps(co, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    a.trace.parent.mkdir(parents=True, exist_ok=True)
    a.trace.write_text(json.dumps(trace, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    unm_b = sum(1 for b in trace["body"] if b["note"] == "UNMAPPED")
    unm_c = sum(1 for c in trace["cells"] if c["note"] == "UNMAPPED")
    print(f"wrote {a.out} content-only ({a.out.stat().st_size} bytes, display keys {keys}); "
          f"verbatim {a.verbatim_out} ({a.verbatim_out.stat().st_size} bytes); trace {a.trace}")
    print(f"chapters {len(doc['chapters'])} appendices {len(doc['appendices'])} parts {len(doc['parts'])} "
          f"tables(top) {sum(1 for t in trace['tables'] if t['id'].startswith('T'))} figures {len(doc['x']['figures'])} "
          f"unmapped body {unm_b} cells {unm_c} unmappedXml {trace['unmappedXml']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
