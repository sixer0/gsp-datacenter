"""H06 benchmark comparator for Manual DATUM 000 (S96, decision D-17).

Usage (spec 01_specs.md section 11, H06):
  VENV -I -B benchmark/harness/compare/bm_compare.py --docx <out.docx> --pdf <out.pdf>
      --ref-docx <BM.docx> --ref-pdf <BM.pdf> --out <dir>
      [--figure-pages 9,12,19,35,37,38,40,42,50,51,54-61]

Criteria (D-17, binding):
  BM1  text units (body paragraph, table cell, caption, source line) identical
       and in order vs BM.docx >= 98 %  (exact LCS over the unit sequences,
       denominator = max(ref units, output units) so extra units also count)
  BM2  per-type count delta <= 2 % of the reference, rounded down
       (pages 102+/-2, chapters 17+/-0, appendices 4+/-0, tables 151+/-3, figures 52+/-1)
  BM3  pages with identical normalised text vs BM.pdf >= 98 %  (min 100/102)
  BM4  mean SSIM over all pages vs BM.pdf >= 0.95 (CAL method; missing pages
       count as 0); per-page and per-figure SSIM on the figure pages are
       diagnosis only and never fail the run.

Outputs: <out>/bm_report.json and <out>/bm_report.md; on an internal error
<out>/bm_error.json (durable error record) is written as well.
Exit: 0 all four criteria pass, 1 any criterion fails or was not run,
2 usage error / unreadable input.

--docx or --pdf may be omitted to run a partial check (e.g. PDF-only
calibration); the omitted criteria are reported NOT-RUN and the exit is 1.
"""
from __future__ import annotations

import argparse
import datetime as _dt
import difflib
import json
import math
import sys
import time
import traceback
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))  # -I drops the script dir

from docx_units import Unit, extract_docx  # noqa: E402
from pdf_pages import compare_pdfs, parse_pages  # noqa: E402
from report_md import render_markdown  # noqa: E402
from ssim_seam import load_ssim  # noqa: E402

DEFAULT_FIGURE_PAGES = "9,12,19,35,37,38,40,42,50,51,54-61"
THRESHOLDS = {"BM1_pct": 98.0, "BM2_pct": 2.0, "BM3_pct": 98.0, "BM4_ssimMean": 0.95}
# Reference counts from research/07_benchmark_inventory.md (sanity check only;
# the comparison always uses counts measured from the --ref-* files).
INVENTORY_REF = {"pages": 102, "chapters": 17, "appendices": 4, "tables": 151, "figures": 52}
EXIT_PASS, EXIT_FAIL, EXIT_USAGE = 0, 1, 2


class UsageError(Exception):
    pass


# ---------------------------------------------------------------- BM1 ----

def lcs_length(a: list[int], b: list[int]) -> int:
    """Exact LCS length, bit-parallel (Hyyro 2004): O(len(b)) big-int steps."""
    m = len(a)
    if m == 0 or not b:
        return 0
    masks: dict[int, int] = {}
    for i, x in enumerate(a):
        masks[x] = masks.get(x, 0) | (1 << i)
    full = (1 << m) - 1
    v = full
    for y in b:
        u = v & masks.get(y, 0)
        v = ((v + u) | (v - u)) & full
    return m - bin(v).count("1")


def _unit_ctx(units: list[Unit], lo: int, hi: int) -> list[dict]:
    return [{"idx": u.idx, "kind": u.kind, "loc": u.loc, "text": u.text} for u in units[lo:hi]]


def compare_units(ref: list[Unit], out: list[Unit], context: int) -> dict:
    vocab: dict[str, int] = {}
    ra = [vocab.setdefault(u.text, len(vocab)) for u in ref]
    ob = [vocab.setdefault(u.text, len(vocab)) for u in out]
    lcs = lcs_length(ra, ob)
    total = max(len(ref), len(out))

    sm = difflib.SequenceMatcher(a=ra, b=ob, autojunk=False)
    matched_ref = [False] * len(ref)
    diffs: list[dict] = []
    aligned = 0
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            aligned += i2 - i1
            for i in range(i1, i2):
                matched_ref[i] = True
            continue
        diffs.append({
            "op": tag,                                  # replace | delete | insert
            "refRange": [i1, i2], "outRange": [j1, j2],
            "ref": _unit_ctx(ref, i1, i2),
            "out": _unit_ctx(out, j1, j2),
            "contextBefore": _unit_ctx(ref, max(0, i1 - context), i1),
            "contextAfter": _unit_ctx(ref, i2, min(len(ref), i2 + context)),
        })

    by_kind: dict[str, dict] = {}
    for u, ok in zip(ref, matched_ref):
        k = by_kind.setdefault(u.kind, {"ref": 0, "matchedInOrder": 0})
        k["ref"] += 1
        k["matchedInOrder"] += int(ok)
    for k in by_kind.values():
        k["pct"] = round(100.0 * k["matchedInOrder"] / k["ref"], 3) if k["ref"] else None
    out_kinds: dict[str, int] = {}
    for u in out:
        out_kinds[u.kind] = out_kinds.get(u.kind, 0) + 1
    for kind, n in out_kinds.items():
        by_kind.setdefault(kind, {"ref": 0, "matchedInOrder": 0, "pct": None})["out"] = n

    pct = 100.0 * lcs / total if total else 100.0
    return {
        "unitsTotal": total,
        "unitsRef": len(ref),
        "unitsOut": len(out),
        "unitsIdenticalInOrder": lcs,
        "pct": round(pct, 4),
        "threshold": THRESHOLDS["BM1_pct"],
        "pass": pct >= THRESHOLDS["BM1_pct"],
        "method": "exact LCS of whitespace-normalised unit texts; pct = LCS / max(unitsRef, unitsOut)",
        "alignmentMatched": aligned,
        "alignmentNote": "diffs and byKind come from difflib alignment (autojunk off); alignmentMatched <= LCS",
        "byKind": by_kind,
        "diffCount": len(diffs),
        "diffs": diffs,
    }


# ---------------------------------------------------------------- BM2 ----

def compare_counts(ref_counts: dict, out_counts: dict) -> dict:
    rows = {}
    all_pass = True
    complete = True
    for key in ("pages", "chapters", "appendices", "tables", "figures"):
        r, o = ref_counts.get(key), out_counts.get(key)
        if r is None or o is None:
            rows[key] = {"ref": r, "out": o, "delta": None, "deltaPct": None, "allowed": None, "pass": None}
            complete = False
            continue
        allowed = math.floor(r * THRESHOLDS["BM2_pct"] / 100.0)
        delta = o - r
        ok = abs(delta) <= allowed
        all_pass &= ok
        rows[key] = {"ref": r, "out": o, "delta": delta,
                     "deltaPct": round(100.0 * abs(delta) / r, 4) if r else None,
                     "allowed": allowed, "pass": ok}
    return {
        "counts": {k: v["out"] for k, v in rows.items()},
        "ref": {k: v["ref"] for k, v in rows.items()},
        "deltaPct": {k: v["deltaPct"] for k, v in rows.items()},
        "perType": rows,
        "threshold": THRESHOLDS["BM2_pct"],
        "rule": "abs(out - ref) <= floor(ref * 2 %) per type",
        "inventoryRef": INVENTORY_REF,
        "pass": all_pass if complete else None,
        "complete": complete,
    }


# ---------------------------------------------------------------- run ----

def _status(v: bool | None) -> str:
    return "NOT-RUN" if v is None else ("PASS" if v else "FAIL")


def run(args: argparse.Namespace) -> tuple[dict, int]:
    for flag in ("ref_docx", "ref_pdf", "docx", "pdf"):
        p = getattr(args, flag)
        if p is not None and not Path(p).is_file():
            raise UsageError(f"--{flag.replace('_', '-')}: file not found: {p}")
    if args.docx is None and args.pdf is None:
        raise UsageError("at least one of --docx / --pdf is required")
    try:
        figure_pages = parse_pages(args.figure_pages)
    except ValueError as exc:
        raise UsageError(f"--figure-pages: {exc}") from exc

    t0 = time.perf_counter()
    report: dict = {
        "tool": "bm_compare (S96, H06)",
        "decision": "D-17",
        "generatedAt": _dt.datetime.now(_dt.timezone.utc).isoformat(timespec="seconds"),
        "inputs": {"docx": args.docx, "pdf": args.pdf, "refDocx": args.ref_docx, "refPdf": args.ref_pdf,
                   "figurePages": figure_pages},
        "thresholds": THRESHOLDS,
    }

    ref_counts: dict = {}
    out_counts: dict = {}
    if args.docx is not None:
        ref_x = extract_docx(args.ref_docx)
        out_x = extract_docx(args.docx)
        report["BM1"] = compare_units(ref_x.units, out_x.units, args.context)
        for key in ("chapters", "appendices", "tables", "figures"):
            ref_counts[key] = ref_x.counts[key]
            out_counts[key] = out_x.counts[key]
        report["docxDetail"] = {"ref": ref_x.counts, "out": out_x.counts,
                                "refChapters": ref_x.chapter_titles, "outChapters": out_x.chapter_titles,
                                "refAppendices": ref_x.appendix_titles, "outAppendices": out_x.appendix_titles}
    else:
        report["BM1"] = {"pass": None, "note": "NOT-RUN: --docx not given"}

    if args.pdf is not None:
        ssim_fn, ssim_src, ssim_notes = load_ssim()
        pdf = compare_pdfs(args.ref_pdf, args.pdf, ssim_fn, figure_pages)
        ref_counts["pages"] = pdf["pagesRef"]
        out_counts["pages"] = pdf["pagesOut"]
        per_page = pdf["perPage"]
        of = len(per_page)  # max(ref pages, out pages)
        identical = sum(1 for r in per_page if r["textIdentical"])
        pct3 = 100.0 * identical / of if of else 0.0
        report["BM3"] = {
            "pagesIdentical": identical, "of": of, "pagesRef": pdf["pagesRef"], "pagesOut": pdf["pagesOut"],
            "pct": round(pct3, 4), "threshold": THRESHOLDS["BM3_pct"], "pass": pct3 >= THRESHOLDS["BM3_pct"],
            "method": "CAL: re.sub(r'\\s+',' ',page.get_text()).strip() equality per page index; of = max page count",
            "pagesDiffering": [r["page"] for r in per_page if not r["textIdentical"]],
            "perPage": [{k: r[k] for k in ("page", "textIdentical", "textDiff", "missingIn") if k in r}
                        for r in per_page],
        }
        ssims = [r["ssim"] if r["ssim"] is not None else 0.0 for r in per_page]
        mean = sum(ssims) / len(ssims) if ssims else 0.0
        report["BM4"] = {
            "ssimMean": round(mean, 6), "threshold": THRESHOLDS["BM4_ssimMean"],
            "pass": mean >= THRESHOLDS["BM4_ssimMean"],
            "ssimMin": round(min(ssims), 6) if ssims else None,
            "pagesCompared": sum(1 for r in per_page if r["ssim"] is not None),
            "method": "CAL: SSIM 7x7 window stride 2, grayscale, 72 dpi, common top-left crop; missing page = 0",
            "ssimSource": ssim_src, "ssimNotes": ssim_notes,
            "pagesBelowThreshold": [r["page"] for r in per_page
                                    if r["ssim"] is None or r["ssim"] < THRESHOLDS["BM4_ssimMean"]],
            "perPage": [{"page": r["page"], "ssim": None if r["ssim"] is None else round(r["ssim"], 6)}
                        for r in per_page],
            "perFigure": [{**f, "ssim": None if f.get("ssim") is None else round(f["ssim"], 6)}
                          for f in pdf["perFigure"]],
            "figureDiagnosisOnly": True,
        }
    else:
        report["BM3"] = {"pass": None, "note": "NOT-RUN: --pdf not given"}
        report["BM4"] = {"pass": None, "note": "NOT-RUN: --pdf not given"}

    report["BM2"] = compare_counts(ref_counts, out_counts)

    statuses = {k: _status(report[k].get("pass")) for k in ("BM1", "BM2", "BM3", "BM4")}
    if all(s == "PASS" for s in statuses.values()):
        verdict = "PASS"
    elif any(s == "FAIL" for s in statuses.values()):
        verdict = "FAIL"
    else:
        verdict = "INCOMPLETE"
    report["criteria"] = statuses
    report["verdict"] = verdict
    report["durationMs"] = int((time.perf_counter() - t0) * 1000)
    # key order: summary first
    ordered = {k: report[k] for k in ("tool", "decision", "generatedAt", "verdict", "criteria", "inputs",
                                       "thresholds", "BM1", "BM2", "BM3", "BM4")}
    ordered.update({k: v for k, v in report.items() if k not in ordered})
    return ordered, EXIT_PASS if verdict == "PASS" else EXIT_FAIL


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="bm_compare.py",
        description="D-17 benchmark comparator: output DOCX/PDF vs Manual DATUM 000 (BM.docx / BM.pdf). "
                    "Writes bm_report.json and bm_report.md. Exit 0 = all criteria pass, 1 = fail or partial, "
                    "2 = usage error / unreadable input.",
    )
    p.add_argument("--docx", help="output DOCX under test (BM1, BM2 chapters/appendices/tables/figures)")
    p.add_argument("--pdf", help="output PDF under test (BM2 pages, BM3, BM4)")
    p.add_argument("--ref-docx", required=True, help="reference BM.docx (read-only)")
    p.add_argument("--ref-pdf", required=True, help="reference BM.pdf (read-only)")
    p.add_argument("--out", required=True, help="report directory (created if missing)")
    p.add_argument("--figure-pages", default=DEFAULT_FIGURE_PAGES,
                   help=f"1-based pages for per-figure SSIM diagnosis (default {DEFAULT_FIGURE_PAGES})")
    p.add_argument("--context", type=int, default=2, help="reference units of context around each BM1 diff (default 2)")
    p.add_argument("--md-max-diffs", type=int, default=300,
                   help="max BM1 diffs listed in bm_report.md; the JSON always has all (default 300)")
    return p


def _write_error(out_dir: Path | None, exc: BaseException, args: argparse.Namespace | None, level: str) -> None:
    record = {
        "timestamp": _dt.datetime.now(_dt.timezone.utc).isoformat(timespec="seconds"),
        "level": level,
        "source": "benchmark/harness/compare/bm_compare.py",
        "correlationId": str(uuid.uuid4()),
        "message": f"{type(exc).__name__}: {exc}",
        "stack_trace": traceback.format_exc(),
        "context": {"argv": sys.argv[1:], "args": vars(args) if args is not None else None},
    }
    print(f"bm_compare: {record['message']} (correlationId {record['correlationId']})", file=sys.stderr)
    if out_dir is not None:
        try:
            out_dir.mkdir(parents=True, exist_ok=True)
            (out_dir / "bm_error.json").write_text(json.dumps(record, indent=2, ensure_ascii=False), encoding="utf-8")
        except OSError as werr:
            print(f"bm_compare: could not write bm_error.json: {werr}", file=sys.stderr)


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)  # argparse exits 2 on misuse, 0 on --help
    out_dir = Path(args.out)
    try:
        report, code = run(args)
    except UsageError as exc:
        _write_error(out_dir, exc, args, "warn")
        return EXIT_USAGE
    except Exception as exc:  # noqa: BLE001 - unreadable/corrupt input: record durably, exit 2
        _write_error(out_dir, exc, args, "error")
        return EXIT_USAGE
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "bm_report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    (out_dir / "bm_report.md").write_text(render_markdown(report, args.md_max_diffs), encoding="utf-8")
    c = report["criteria"]
    print(f"verdict {report['verdict']} | BM1 {c['BM1']} {report['BM1'].get('pct')}% | "
          f"BM2 {c['BM2']} | BM3 {c['BM3']} {report['BM3'].get('pagesIdentical')}/{report['BM3'].get('of')} | "
          f"BM4 {c['BM4']} ssimMean {report['BM4'].get('ssimMean')} | {out_dir / 'bm_report.json'}")
    return code


if __name__ == "__main__":
    sys.exit(main())
