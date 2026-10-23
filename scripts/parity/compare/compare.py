"""H04 - pembanding paritas (spesifikasi §11).

    VENV -I -B scripts/parity/compare/compare.py --format docx|pdf|svg|png --ref <path> --node <path>
        --class CA|CB1|CB2|CC|DG|SY|DX|PD|HT --out <report.json> [--threshold KUNCI=NILAI ...]
        [--context <context.json>]

Keluaran: CompareReport JSON `{format, class, verdict, failedChecks, metrics, thresholds, diffs}`.
`failedChecks` (FIX-H/SR46-P2) = `{total, failed, failedGate, failedDiagnosis, level, ids}`; `level` "CLEAN"
(0 cek gagal) atau "DIFF". Vonis tidak berubah: DIAGNOSIS tetap DIAGNOSIS, medan ini membedakan
DIAGNOSIS bersih dari DIAGNOSIS dengan banyak cek diagnosis gagal.
Exit: 0 PASS/DIAGNOSIS, 1 FAIL, 2 salah pakai (argumen, kombinasi format/kelas, berkas tak terbaca).
Kombinasi sah: docx=DX; pdf=PD; svg=CA,CB1,CB2,CC,DG,SY; png=CA,CB1,CB2,CC,DG,SY,HT.
`--threshold` (opsional, berulang) menimpa ambang research/06 §6.2, mis. kalibrasi ulang PD (§6.4-N3):
`--threshold ssimMeanMin=0.985 --threshold ssimMinMin=0.95`.
`--context` (opsional, ditulis runner FIX-3): JSON berisi `engineReport` {ref, node} (DG: aturan warna
maks mesin, checks_run, hop), `ports` {ref, node} (SY: port mm), `chartSpec` (CB1 (f) D-240: objek spec
atau path JSON fixture chart = data acuan untuk gerbang label isi), `noReference` {spec, blocks}
(DX: blok tanpa padanan acuan F-012 dikecualikan dari metrik teks beracuan), atau `f007` {refSvg, nodeSvg}
(PNG CA: bukti skala teks px/pt acuan F-007/D-296 -> DIAGNOSIS beralasan bila terbukti).
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import traceback
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:  # -I tidak menambahkan folder skrip ke sys.path
    sys.path.insert(0, str(HERE))

import thresholds as TH  # noqa: E402
from common import Checks  # noqa: E402

EXIT_OK, EXIT_FAIL, EXIT_USAGE = 0, 1, 2
FORMATS = ("docx", "pdf", "svg", "png")
CLASSES = ("CA", "CB1", "CB2", "CC", "DG", "SY", "DX", "PD", "HT")


class Usage(Exception):
    pass


class _Parser(argparse.ArgumentParser):
    def error(self, message: str) -> None:  # exit 2 sesuai kontrak (argparse juga 2)
        self.print_usage(sys.stderr)
        print(f"compare.py: galat: {message}", file=sys.stderr)
        raise SystemExit(EXIT_USAGE)


def build_parser() -> argparse.ArgumentParser:
    p = _Parser(
        prog="compare.py",
        description="Pembanding paritas acuan Python lawan keluaran Node (H04). "
                    "Exit 0 PASS/DIAGNOSIS, 1 FAIL, 2 salah pakai.",
        epilog="Kombinasi sah: docx=DX; pdf=PD; svg=CA,CB1,CB2,CC,DG,SY; png=CA,CB1,CB2,CC,DG,SY,HT. "
               "SSIM metode CAL (abu-abu, 7x7, 72 dpi) dari modul ssim_cal (dipakai ulang S96).",
    )
    p.add_argument("--format", required=True, choices=FORMATS)
    p.add_argument("--ref", required=True, help="berkas acuan (Python) atau snapshot beku (CC/HT)")
    p.add_argument("--node", required=True, help="berkas keluaran Node")
    p.add_argument("--class", dest="cls", required=True, choices=CLASSES, help="kelas paritas research/06 bagian 6.2")
    p.add_argument("--out", required=True, help="path laporan JSON CompareReport")
    p.add_argument("--threshold", action="append", default=[], metavar="KUNCI=NILAI",
                   help="timpa satu ambang (berulang)")
    p.add_argument("--context", default=None, help="JSON konteks runner (engineReport/ports/chartSpec/noReference)")
    return p


def _log_error(out: str | None, ctx: dict, exc: BaseException) -> None:
    """Galat dicatat berstruktur ke berkas di samping laporan (sink tahan lama) dan ke stderr."""
    rec = {"timestamp": datetime.now(timezone.utc).isoformat(), "level": "error", "source": "parity.compare",
           "message": str(exc), "stack_trace": traceback.format_exc(), "context": ctx}
    print(json.dumps(rec, ensure_ascii=False), file=sys.stderr)
    if out:
        try:
            p = Path(out).with_suffix(".error.json")
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(json.dumps(rec, ensure_ascii=False, indent=2), encoding="utf-8")
        except OSError:
            pass


def load_context(path: str | None) -> dict:
    if not path:
        return {}
    if not os.path.isfile(path):
        raise Usage(f"berkas konteks tidak ada: {path}")
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError) as e:
        raise Usage(f"berkas konteks bukan JSON sah: {path}: {e}") from e
    if not isinstance(data, dict):
        raise Usage(f"berkas konteks harus objek JSON: {path}")
    return data


def run(fmt: str, cls: str, ref: str, node: str, overrides: list[str], context: str | None = None) -> dict:
    if cls not in TH.VALID[fmt]:
        raise Usage(f"kelas {cls} tidak sah untuk format {fmt} (sah: {', '.join(TH.VALID[fmt])})")
    for pth in (ref, node):
        if not os.path.isfile(pth):
            raise Usage(f"berkas tidak ada: {pth}")
    try:
        th = TH.apply_overrides(TH.get(fmt, cls), overrides)
    except ValueError as e:
        raise Usage(str(e)) from e
    ctx = load_context(context)
    ck = Checks()
    if fmt == "pdf":
        import compare_pdf as mod
        metrics = mod.compare(ref, node, th, ck)
    elif fmt == "png":
        import compare_png as mod
        metrics = mod.compare(ref, node, th, ck, ctx)
    elif fmt == "docx":
        import compare_docx as mod
        metrics = mod.compare(ref, node, th, ck, ctx)
    else:
        import compare_svg as mod
        metrics = mod.compare(ref, node, cls, th, ck, ctx)
    metrics["checks"] = ck.items
    metrics["inputs"] = {"ref": str(Path(ref).resolve()), "node": str(Path(node).resolve()),
                         **({"context": str(Path(context).resolve())} if context else {})}
    return {"format": fmt, "class": cls, "verdict": ck.verdict(), "failedChecks": failed_checks(ck.items),
            "metrics": metrics, "thresholds": th, "diffs": ck.diffs}


def failed_checks(items: list[dict]) -> dict:
    """Ringkasan cek gagal (SR46-P2): jumlah dan tingkat, terlepas dari kelas vonis."""
    failed = [c["id"] for c in items if not c["pass"]]
    gate = sum(1 for c in items if c["gate"] and not c["pass"])
    return {"total": len(items), "failed": len(failed), "failedGate": gate, "failedDiagnosis": len(failed) - gate,
            "level": "DIFF" if failed else "CLEAN", "ids": failed}


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    ctx = {"format": args.format, "class": args.cls, "ref": args.ref, "node": args.node, "context": args.context}
    try:
        report = run(args.format, args.cls, args.ref, args.node, args.threshold, args.context)
    except Usage as e:
        print(f"compare.py: salah pakai: {e}", file=sys.stderr)
        return EXIT_USAGE
    except Exception as e:  # berkas rusak/tak terbaca = masukan tidak sah
        _log_error(args.out, ctx, e)
        return EXIT_USAGE
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2, default=str), encoding="utf-8")
    print(json.dumps({"format": report["format"], "class": report["class"], "verdict": report["verdict"],
                      "failedGates": [d["check"] for d in report["diffs"] if d.get("gate")],
                      "failedChecks": report["failedChecks"]["failed"], "out": str(out)}))
    return EXIT_FAIL if report["verdict"] == "FAIL" else EXIT_OK


if __name__ == "__main__":
    sys.exit(main())
