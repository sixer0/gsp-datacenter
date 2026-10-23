# -*- coding: utf-8 -*-
"""H02 - reference DOCX/PDF renderer for the parity harness (blueprint row S64).

Contract (masterplan/01_specs.md section 11, row H02):

    VENV -I -B scripts/parity/reference/doc/ref_doc.py --doc <doc.json> --out <dir> [--pdf]

Input  : a studio.doc/v1 JSON document.
Output : <dir>/ref.docx, <dir>/ref.pdf (with --pdf, LibreOffice with a throw-away
         profile), <dir>/ref_report.json (per-block mapping status, files, errors).
Exit   : 0 success (unsupported / rejected blocks are listed in the report, not fatal)
         1 render failure (fatal build error, a block 'error', or --pdf conversion failed)
         2 usage error (bad arguments, unreadable or non studio.doc/v1 input)

Environment:
  SOFFICE_PATH                 default C:\\Program Files\\LibreOffice\\program\\soffice.com
  REF_DOC_SOFFICE_TIMEOUT_S    soffice timeout in seconds (default 180), tree-kill on expiry
  DATUM_HS_DIR / DATUM_RL_DIR  override the Garis A / Rev L skill folders (read-only)
"""
import argparse
import datetime
import hashlib
import json
import os
import sys
import time
import traceback

_HERE = os.path.dirname(os.path.abspath(__file__))
# -I implies -P: the script folder is not on sys.path, so add it explicitly.
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

REPO_ROOT = os.path.abspath(os.path.join(_HERE, "..", "..", "..", ".."))
REPORT_SCHEMA = "studio.parity.ref-doc/v1"
STATUS_ORDER = ("supported", "approximated", "unsupported", "rejected", "error")


def _now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def _file_entry(fmt, path):
    with open(path, "rb") as fh:
        data = fh.read()
    return {"format": fmt, "path": os.path.abspath(path),
            "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data)}


def _parser():
    ap = argparse.ArgumentParser(
        prog="ref_doc.py",
        description="Acuan Python dokumen (S64/H02): studio.doc/v1 JSON -> DatumDocx Garis A "
                    "(+ Rev L datumchart) -> ref.docx, opsional ref.pdf lewat soffice.",
        epilog="Exit: 0 sukses, 1 galat render, 2 salah pakai. Env: SOFFICE_PATH, "
               "REF_DOC_SOFFICE_TIMEOUT_S, DATUM_HS_DIR, DATUM_RL_DIR.")
    ap.add_argument("--doc", required=True, help="berkas studio.doc/v1 JSON")
    ap.add_argument("--out", help="direktori keluaran (default tests/parity/out/ref_doc/<stamp>)")
    ap.add_argument("--pdf", action="store_true",
                    help="konversi ref.docx ke ref.pdf lewat LibreOffice (profil sementara)")
    return ap


def main(argv=None):
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:  # noqa: BLE001 - non-reconfigurable stream
            pass
    args = _parser().parse_args(argv)
    t0 = time.monotonic()
    out = os.path.abspath(args.out or os.path.join(
        REPO_ROOT, "tests", "parity", "out", "ref_doc",
        datetime.datetime.now().strftime("%Y%m%d-%H%M%S")))
    report = {"schema": REPORT_SCHEMA, "tool": "scripts/parity/reference/doc/ref_doc.py",
              "startedAt": _now(), "status": "failed", "errorCode": None,
              "input": {"path": os.path.abspath(args.doc)}, "outDir": out,
              "engine": None, "files": [], "counts": {}, "blocks": [], "pdf": None,
              "errors": [], "durationMs": 0}
    code = 1
    rasterizer = None
    try:
        os.makedirs(out, exist_ok=True)
    except OSError as ex:
        print("ref_doc: direktori keluaran tidak dapat dibuat: %s" % ex, file=sys.stderr)
        return 2
    try:
        import doc_adapter as A
        from svg_raster import Rasterizer
        import soffice_pdf
        try:
            with open(args.doc, "rb") as fh:
                raw = fh.read()
            report["input"]["sha256"] = hashlib.sha256(raw).hexdigest()
            doc = json.loads(raw.decode("utf-8"))
            A.validate_input(doc)
        except (OSError, ValueError, A.InputError) as ex:
            report["status"] = "usage"
            report["errorCode"] = "USAGE"
            report["errors"].append({"timestamp": _now(), "level": "error",
                                     "source": "ref_doc.input", "message": str(ex),
                                     "context": {"doc": args.doc}})
            print("ref_doc: masukan tidak sah: %s" % ex, file=sys.stderr)
            code = 2
            return code
        engines = A.Engines()
        report["engine"] = engines.describe()
        rasterizer = Rasterizer()
        adapter = A.Adapter(doc, os.path.dirname(os.path.abspath(args.doc)),
                            os.path.join(out, "figures"), engines, rasterizer)
        try:
            D = adapter.build()
        finally:
            report["blocks"] = adapter.entries
        docx_path = os.path.join(out, "ref.docx")
        D.save(docx_path)
        report["files"].append(_file_entry("docx", docx_path))
        if rasterizer.engine:
            report["engine"]["raster"] = rasterizer.engine
        counts = {s: 0 for s in STATUS_ORDER}
        for e in adapter.entries:
            counts[e["status"]] = counts.get(e["status"], 0) + 1
        report["counts"] = counts
        report["unsupported"] = [e["pointer"] for e in adapter.entries
                                 if e["status"] == "unsupported"]
        code = 1 if counts.get("error") else 0
        if code:
            report["errorCode"] = "BLOCK_ERROR"
        if args.pdf:
            res = soffice_pdf.convert(docx_path, os.path.join(out, "ref.pdf"), out)
            report["pdf"] = res
            if res["ok"]:
                report["files"].append(_file_entry("pdf", os.path.join(out, "ref.pdf")))
            else:
                code = 1
                report["errorCode"] = res["errorCode"]
                report["errors"].append({"timestamp": _now(), "level": "error",
                                         "source": "ref_doc.soffice", "message": res["errorCode"],
                                         "context": {"stderrTail": res["stderrTail"],
                                                     "exitCode": res["exitCode"]}})
        if code == 0:
            degraded = counts.get("unsupported") or counts.get("rejected")
            report["status"] = "partial" if degraded else "ok"
        return code
    except Exception as ex:  # noqa: BLE001 - fatal path, recorded in the report
        report["errorCode"] = report["errorCode"] or "REF_BUILD_FAILED"
        report["errors"].append({"timestamp": _now(), "level": "error",
                                 "source": "ref_doc.main", "class": type(ex).__name__,
                                 "message": str(ex), "stackTrace": traceback.format_exc(),
                                 "context": {"doc": args.doc, "out": out}})
        print("ref_doc: gagal: %s: %s" % (type(ex).__name__, ex), file=sys.stderr)
        code = 1
        return code
    finally:
        if rasterizer is not None:
            rasterizer.close()
        report["durationMs"] = int((time.monotonic() - t0) * 1000)
        report["exitCode"] = code
        rp = os.path.join(out, "ref_report.json")
        try:
            with open(rp, "w", encoding="utf-8") as fh:
                json.dump(report, fh, ensure_ascii=False, indent=1)
        except OSError as ex:
            print("ref_doc: laporan tidak dapat ditulis: %s" % ex, file=sys.stderr)
        print("ref_doc: status=%s exit=%d report=%s" % (report["status"], code, rp))


if __name__ == "__main__":
    sys.exit(main())
