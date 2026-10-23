"""S93 data guard: doc.json vs BM.docx (text identity, counts, mapping completeness).

Usage:
    VENV -I -B benchmark/extract/verify_manual000.py [--doc benchmark/manual000/doc.verbatim.json] [--docx BM.docx]
        [--trace benchmark/extract/out/manual000_trace.json] [--report benchmark/extract/out/verify_report.json]

Checks (each PASS/FAIL, exit 0 only when all pass):
  V1 strict skeleton: body paragraphs and tables of BM.docx (raw text, \\t for tab, every empty paragraph,
     every cell paragraph, nested tables) equal the skeleton rebuilt from doc.json alone (doc_text_model.py).
  V2 strict paragraph lists: 748 body paragraphs and 4159 cell paragraphs (research/07 order) identical.
  V3 header/footer text per unit (29) identical (fields as {PAGE}/{NUMPAGES}).
  V4 S96 text units: benchmark/harness/compare/docx_units.py on BM.docx vs the same unit rules applied to
     the doc.json skeleton: same count (4544) and identical in order.
  V5 counts: 17 chapters, 4 appendices, 151 top-level table constructs + 2 nested, 52 figure references.
  V6 mapping: 0 unmapped body/cell paragraphs in the trace, every trace pointer resolves in doc.json.
  V7 figure references: x.figures = bm-fig-01..52, explicit refs resolve to assets with the media sha256.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import zipfile
from pathlib import Path

from lxml import etree

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(REPO / "benchmark" / "harness" / "compare"))
from doc_text_model import Model  # noqa: E402
import docx_units  # noqa: E402  (S96, read-only use)

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
DEFAULT_BM = Path(r"C:\Users\TRIAL\workspace\Manual DATUM GSP\Manual_Komprehensif_DATUM_GSP_000-GSP-STD-X-2026_RevA.docx")


def q(t: str) -> str:
    return f"{{{W}}}{t}"


# ── BM.docx side (independent minimal reader) ─────────────────────────────
def p_raw(p) -> str:
    out = []
    for ch in p:
        n = etree.QName(ch).localname
        if n == "r":
            for x in ch:
                xn = etree.QName(x).localname
                if xn == "t":
                    out.append(x.text or "")
                elif xn == "tab":
                    out.append("\t")
                elif xn == "br":
                    out.append("\n")
        elif n == "fldSimple":
            out.append("{" + (ch.get(q("instr")) or "").strip().split()[0] + "}")
    return "".join(out)


def tbl_rows(tbl) -> list:
    rows = []
    for tr in tbl.findall(q("tr")):
        row = []
        for tc in tr.findall(q("tc")):
            cell = []
            for ch in tc:
                if ch.tag == q("p"):
                    cell.append(("p", p_raw(ch)))
                elif ch.tag == q("tbl"):
                    cell.append(("tbl", tbl_rows(ch)))
            row.append(cell)
        rows.append(row)
    return rows


def docx_skeleton(path: Path) -> tuple[list, list[dict]]:
    z = zipfile.ZipFile(path)
    root = etree.fromstring(z.read("word/document.xml"), parser=etree.XMLParser(huge_tree=True, resolve_entities=False))
    rels = {r.get("Id"): r.get("Target") for r in etree.fromstring(z.read("word/_rels/document.xml.rels"))}
    body = root.find(q("body"))
    nodes = []
    sects = []
    for ch in body:
        if ch.tag == q("p"):
            nodes.append(("p", p_raw(ch)))
            s = ch.find(f"{q('pPr')}/{q('sectPr')}")
            if s is not None:
                sects.append(s)
        elif ch.tag == q("tbl"):
            nodes.append(("tbl", tbl_rows(ch)))
        elif ch.tag == q("sectPr"):
            sects.append(ch)

    def part_text(rid: str) -> str:
        r = etree.fromstring(z.read("word/" + rels[rid]))
        kids = [k for k in r if k.tag in (q("p"), q("tbl"))]
        if kids and kids[0].tag == q("tbl"):
            tc_texts = []
            for tc in kids[0].iter(q("tc")):
                tc_texts.append("".join(p_raw(p) for p in tc if p.tag == q("p")))
            return " | ".join(tc_texts)
        return "".join(p_raw(p) for p in kids)
    hf = []
    for s in sects:
        h = s.find(q("headerReference"))
        f = s.find(q("footerReference"))
        hf.append({"header": part_text(h.get(f"{{{R_NS}}}id")) if h is not None else "<inherit>",
                   "footer": part_text(f.get(f"{{{R_NS}}}id")) if f is not None else "<inherit>"})
    return nodes, hf


# ── shared flatten / unit rules ───────────────────────────────────────────
def flatten(nodes: list) -> tuple[list[str], list[str]]:
    """Body paragraph texts, and cell paragraph texts in research/07 order (cell paragraphs, then nested)."""
    body, cells = [], []

    def walk(rows):
        for row in rows:
            for cell in row:
                cells.extend(t for k, t in cell if k == "p")
                for k, t in cell:
                    if k == "tbl":
                        walk(t)
    for k, v in nodes:
        if k == "p":
            body.append(v)
        else:
            walk(v)
    return body, cells


def units_of(nodes: list) -> list[tuple[str, str]]:
    """docx_units.py unit rules (S96) applied to a skeleton."""
    out: list[tuple[str, str]] = []

    def walk(rows):
        for row in rows:
            for cell in row:
                texts = [docx_units.norm(t) for k, t in cell if k == "p"]
                text = docx_units.norm(" ".join(t for t in texts if t))
                if text:
                    out.append(("cell", text))
                for k, t in cell:
                    if k == "tbl":
                        walk(t)
    for k, v in nodes:
        if k == "p":
            t = docx_units.norm(v)
            if t:
                out.append((docx_units._classify(t), t))
        else:
            walk(v)
    return out


def diff_list(a: list, b: list, limit: int = 15) -> list[dict]:
    out = []
    for i in range(max(len(a), len(b))):
        x = a[i] if i < len(a) else "<missing>"
        y = b[i] if i < len(b) else "<missing>"
        if x != y:
            out.append({"i": i, "bm": x if isinstance(x, str) else repr(x)[:300],
                        "doc": y if isinstance(y, str) else repr(y)[:300]})
            if len(out) >= limit:
                break
    return out


def resolve(doc, ptr: str):
    cur = doc
    if ptr == "":
        return cur
    for tok in ptr.split("/")[1:]:
        tok = tok.replace("~1", "/").replace("~0", "~")
        cur = cur[int(tok)] if isinstance(cur, list) else cur[tok]
    return cur


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="S93 data guard: doc.json vs BM.docx")
    # RT-01: the data guard checks the verbatim extraction (trace pointers + C1-C14 skeleton);
    # the content-only doc.json is proven by the render benchmark (BM1-BM4).
    ap.add_argument("--doc", type=Path, default=REPO / "benchmark" / "manual000" / "doc.verbatim.json")
    ap.add_argument("--docx", type=Path, default=DEFAULT_BM)
    ap.add_argument("--trace", type=Path, default=HERE / "out" / "manual000_trace.json")
    ap.add_argument("--report", type=Path, default=HERE / "out" / "verify_report.json")
    a = ap.parse_args(argv)
    for f in (a.doc, a.docx, a.trace):
        if not f.is_file():
            print(f"input missing: {f}", file=sys.stderr)
            return 2
    doc = json.loads(a.doc.read_text(encoding="utf-8"))
    trace = json.loads(a.trace.read_text(encoding="utf-8"))
    model = Model(doc).build()
    bm_nodes, bm_hf = docx_skeleton(a.docx)
    res: dict[str, dict] = {}

    # V1
    d1 = diff_list(bm_nodes, model.body, 10)
    res["V1_skeleton"] = {"pass": not d1, "bmNodes": len(bm_nodes), "docNodes": len(model.body), "diffs": d1}
    # V2
    bb, bc = flatten(bm_nodes)
    mb, mc = flatten(model.body)
    d2b, d2c = diff_list(bb, mb), diff_list(bc, mc)
    res["V2_paragraphs"] = {"pass": not d2b and not d2c and len(bb) == 748 and len(bc) == 4159,
                            "bodyBm": len(bb), "bodyDoc": len(mb), "cellBm": len(bc), "cellDoc": len(mc),
                            "bodyDiffs": d2b, "cellDiffs": d2c}
    # V3
    mhf = [{"header": h["header"], "footer": h["footer"]} for h in model.hf]
    d3 = diff_list([json.dumps(x, ensure_ascii=False) for x in bm_hf], [json.dumps(x, ensure_ascii=False) for x in mhf])
    res["V3_headerFooter"] = {"pass": not d3 and len(bm_hf) == 29, "unitsBm": len(bm_hf), "unitsDoc": len(mhf), "diffs": d3}
    # V4
    ex = docx_units.extract_docx(a.docx)
    s96 = [(u.kind, u.text) for u in ex.units]
    mine = units_of(model.body)
    d4 = diff_list([f"{k}|{t}" for k, t in s96], [f"{k}|{t}" for k, t in mine])
    by_kind = {k: sum(1 for kk, _ in mine if kk == k) for k in ("paragraph", "caption", "source", "cell")}
    res["V4_s96Units"] = {"pass": not d4 and len(s96) == len(mine) == 4544, "unitsBm": len(s96), "unitsDoc": len(mine),
                          "identicalInOrder": sum(1 for x, y in zip(s96, mine) if x == y), "byKindDoc": by_kind,
                          "s96Counts": ex.counts, "diffs": d4}
    # V5
    top_tables = sum(1 for k, _ in model.body if k == "tbl")

    nested = sum(1 for k, v in model.body if k == "tbl" for row in v for cell in row for x in cell if x[0] == "tbl")
    n_ch, n_ap = len(doc["chapters"]), len(doc.get("appendices", []))
    res["V5_counts"] = {"pass": (n_ch, n_ap, top_tables, nested, len(model.figure_refs)) == (17, 4, 151, 2, 52),
                        "chapters": n_ch, "appendices": n_ap, "tableConstructsTop": top_tables, "nested": nested,
                        "figureRefs": len(model.figure_refs),
                        "figureRefsExplicit": sum(1 for r in model.figure_refs if not r.startswith("derived")),
                        "figureRefsDerived": sum(1 for r in model.figure_refs if r.startswith("derived")),
                        "constructs": sorted({t["construct"] for t in trace["tables"]})}
    cons: dict[str, int] = {}
    for t in trace["tables"]:
        if t["id"].startswith("T"):
            cons[t["construct"]] = cons.get(t["construct"], 0) + 1
    res["V5_counts"]["topTablesByConstruct"] = cons
    # V6
    unm = [b for b in trace["body"] if b["note"] == "UNMAPPED"] + [c for c in trace["cells"] if c["note"] == "UNMAPPED"]
    bad_ptr = []
    for rec in trace["body"] + trace["cells"] + trace["figures"] + trace["tables"]:
        try:
            resolve(doc, rec["ptr"])
        except (KeyError, IndexError, ValueError, TypeError):
            bad_ptr.append(rec.get("p", rec.get("i", rec.get("id"))))
    res["V6_mapping"] = {"pass": not unm and not bad_ptr and len(trace["body"]) == 748 and len(trace["cells"]) == 4159,
                         "body": len(trace["body"]), "cells": len(trace["cells"]), "unmapped": len(unm),
                         "badPointers": bad_ptr[:20]}
    # V7
    figs = doc["x"]["figures"]
    ids_ok = [f["id"] for f in figs] == [f"bm-fig-{i:02d}" for i in range(1, 53)]
    expl = [r for r in model.figure_refs if not r.startswith("derived")]
    asset_ok = all(r in doc["assets"] and doc["assets"][r]["sha256"] == next(f["sha256"] for f in figs if f["id"] == r)
                   for r in expl)
    z = zipfile.ZipFile(a.docx)
    import hashlib
    media_ok = all(hashlib.sha256(z.read("word/" + f["media"])).hexdigest() == f["sha256"] for f in figs)
    res["V7_figures"] = {"pass": ids_ok and asset_ok and media_ok and len(set(expl)) == len(expl) == 31,
                         "idsSequential": ids_ok, "explicitResolve": asset_ok, "mediaSha256": media_ok,
                         "explicit": len(expl), "kinds": {k: sum(1 for f in figs if f["kind"] == k)
                                                           for k in sorted({f["kind"] for f in figs})}}
    ok = all(v["pass"] for v in res.values())
    report = {"verdict": "PASS" if ok else "FAIL", "doc": str(a.doc), "docx": str(a.docx), "checks": res}
    a.report.parent.mkdir(parents=True, exist_ok=True)
    a.report.write_text(json.dumps(report, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    for k, v in res.items():
        brief = {kk: vv for kk, vv in v.items() if kk not in ("diffs", "bodyDiffs", "cellDiffs", "s96Counts", "constructs")}
        print(f"{k}: {'PASS' if v['pass'] else 'FAIL'} {json.dumps(brief, ensure_ascii=False)}")
        for dk in ("diffs", "bodyDiffs", "cellDiffs"):
            for d in v.get(dk, [])[:5]:
                print("   ", dk, json.dumps(d, ensure_ascii=False)[:400])
    print(f"verdict {report['verdict']} -> {a.report}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main())
