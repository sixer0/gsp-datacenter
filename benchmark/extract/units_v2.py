"""SR-32: compare the S96 text units of two (or three) DOCX files in order.

Used to prove that benchmark/manual000/doc.v2.json (+ template.v2.json) renders exactly the same text units,
in the same order, as doc.json (+ template.json), and optionally as BM.docx (D-17 BM-1 unit model).
Unit rules are the S96 rules (benchmark/harness/compare/docx_units.py, read-only use). Also reported (informative,
not part of the exit code): table grids (column widths, KC-6 profiles) and runs set in the symbol face (glyph detection).

Usage (repo root):
    VENV -I -B benchmark/extract/units_v2.py <a.docx> <b.docx> [--bm <BM.docx>] [--json <out.json>]
Exit: 0 when a and b (and bm, if given) have identical unit sequences (kind + text), 1 otherwise, 2 input error.
"""
from __future__ import annotations

import argparse
import difflib
import hashlib
import json
import re
import sys
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "harness" / "compare"))
import docx_units  # noqa: E402  (S96, read-only use)


def units(path: str) -> list[tuple[str, str]]:
    return [(u.kind, u.text) for u in docx_units.extract_docx(path).units]


_GRID = re.compile(r"<w:tblGrid>(.*?)</w:tblGrid>", re.S)
_COL = re.compile(r'<w:gridCol w:w="(\d+)"')
_SYMRUN = re.compile(r'<w:r>(?:(?!</w:r>).)*?w:ascii="DejaVu Sans"(?:(?!</w:r>).)*?<w:t(?: [^>]*)?>([^<]*)</w:t>', re.S)


def layout_facts(path: str) -> dict:
    """Table grids (column widths per table, document order) and text of runs set in the symbol face (DejaVu Sans)."""
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml").decode("utf-8")
    grids = [[int(w) for w in _COL.findall(g)] for g in _GRID.findall(xml)]
    sym = _SYMRUN.findall(xml)
    return {"grids": grids, "symbolRuns": len(sym), "symbolChars": "".join(sorted(set("".join(sym)))) }


def seq_sha(seq: list[tuple[str, str]]) -> str:
    return hashlib.sha256(json.dumps(seq, ensure_ascii=False).encode("utf-8")).hexdigest()


def diff(a: list[tuple[str, str]], b: list[tuple[str, str]], limit: int = 1000) -> list[dict]:
    out: list[dict] = []
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal":
            continue
        out.append({"op": op, "a": [i1, i2], "b": [j1, j2], "aUnits": a[i1:min(i2, i1 + 3)], "bUnits": b[j1:min(j2, j1 + 3)]})
        if len(out) >= limit:
            break
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("a", help="reference DOCX (doc.json render)")
    ap.add_argument("b", help="candidate DOCX (doc.v2.json render)")
    ap.add_argument("--bm", help="optional BM.docx (S96 reference)")
    ap.add_argument("--json", help="write the full result as JSON")
    args = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")  # unit text carries glyphs (U+25A0..) beyond cp1252
    try:
        ua, ub = units(args.a), units(args.b)
        ubm = units(args.bm) if args.bm else None
    except (OSError, KeyError, ValueError) as e:
        print(f"input error: {e}", file=sys.stderr)
        return 2
    res: dict = {
        "a": {"file": args.a, "units": len(ua), "sha": seq_sha(ua)},
        "b": {"file": args.b, "units": len(ub), "sha": seq_sha(ub)},
        "aEqualsB": ua == ub,
        "diffAB": diff(ua, ub),
    }
    la, lb = layout_facts(args.a), layout_facts(args.b)
    res["layout"] = {
        "tables": [len(la["grids"]), len(lb["grids"])],
        "gridsEqual": la["grids"] == lb["grids"],
        "symbolRuns": [la["symbolRuns"], lb["symbolRuns"]],
        "symbolChars": [la["symbolChars"], lb["symbolChars"]],
    }
    ok = ua == ub
    if ubm is not None:
        lbm = layout_facts(args.bm)
        res["layout"]["gridsEqualBm"] = lb["grids"] == lbm["grids"]
        res["layout"]["symbolRunsBm"] = lbm["symbolRuns"]
        res["bm"] = {"file": args.bm, "units": len(ubm), "sha": seq_sha(ubm)}
        res["aEqualsBm"] = ua == ubm
        res["bEqualsBm"] = ub == ubm
        res["diffBmB"] = diff(ubm, ub)
        ok = ok and ub == ubm
    print(f"units a={len(ua)} b={len(ub)}" + (f" bm={len(ubm)}" if ubm is not None else "")
          + f" aEqualsB={res['aEqualsB']}"
          + (f" aEqualsBm={res['aEqualsBm']} bEqualsBm={res['bEqualsBm']}" if ubm is not None else "")
          + f" shaA={res['a']['sha'][:16]} shaB={res['b']['sha'][:16]}")
    print("layout " + json.dumps(res["layout"], ensure_ascii=False))
    print(f"diffAB hunks={len(res['diffAB'])}")
    for d in res["diffAB"][:20]:
        print("diffAB", json.dumps(d, ensure_ascii=False)[:400])
    for d in res.get("diffBmB", [])[:5]:
        print("diffBmB", json.dumps(d, ensure_ascii=False)[:400])
    if args.json:
        Path(args.json).write_text(json.dumps(res, ensure_ascii=False, indent=2), encoding="utf-8")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
