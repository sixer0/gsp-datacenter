# -*- coding: utf-8 -*-
"""ref_fig.py - acuan Python figur untuk harness paritas (S65, CLI H03).

Pemakaian (masterplan/01_specs.md bagian 11, H03):

  VENV -I -B scripts/parity/reference/fig/ref_fig.py --spec <spec.json>
        --kind chart|diagram|symbol --out <dir> [--png]

Keluaran di <dir>: ref.svg, ref.png (dengan --png), ref_report.json.
Exit: 0 sukses (termasuk status no-reference), 1 galat render acuan,
2 salah pakai (argumen, spec tak terbaca, $schema salah).

Jalur acuan:
- diagram `studio.diagram/v1` -> datum_diagram.build_svg Garis A (HS);
- chart: kode datumchart -> datumchart.render Rev L (RL); kode pustakachart
  -> fungsi galeri HS dengan data disuntik; TANPA-ACUAN -> no-reference;
- symbol: id `dialek:nama` (argumen --spec atau berkas JSON {"id": ...}),
  atau lembar {"sheet": "<dialek>"} -> datumsimbol.py (HS); port mm dari
  datum_symbols.render (RL).
- SVG -> PNG 300 dpi lewat Chromium Playwright set_content (bukan file://);
  chart pustakachart memakai PNG Agg 300 dpi milik acuan (research/06 6.1).

Galat ditulis ke ref_report.json (status, kode, pesan, jejak) sebagai
catatan tahan lama di samping keluaran. Tambalan in-process atas fungsi
acuan yang rusak (ref_patches.py, mis. PT-01 K-01) dicatat di `patches`.
"""
import argparse
import json
import os
import re
import sys
import time
import traceback

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:          # -I membuang folder skrip dari sys.path
    sys.path.insert(0, HERE)

import chart_ref  # noqa: E402
import raster  # noqa: E402
import skills  # noqa: E402

VERSION = "1.0.0"
SCHEMAS = {"chart": "studio.chart/v1", "diagram": "studio.diagram/v1"}


class Misuse(Exception):
    pass


class RenderError(Exception):
    def __init__(self, code, message):
        super().__init__(message)
        self.code = code


# ------------------------------------------------------------------- spec
def read_spec(path, kind):
    if kind == "symbol" and not os.path.isfile(path):
        return {"id": path}                       # id simbol langsung, mis. iec:breaker
    try:
        raw = open(path, encoding="utf-8").read()
    except OSError as ex:
        raise Misuse("spec tidak terbaca: %s" % ex)
    try:
        spec = json.loads(raw)
    except ValueError as ex:
        if kind == "diagram":
            return None                           # biarkan load_spec acuan menilai (DATUM-31)
        raise Misuse("spec bukan JSON valid: %s" % ex)
    if not isinstance(spec, dict):
        raise Misuse("spec harus objek JSON")
    want = SCHEMAS.get(kind)
    got = spec.get("$schema")
    if want and got is not None and got != want:
        raise Misuse("$schema '%s' tidak cocok dengan --kind %s (%s)" % (got, kind, want))
    return spec


# ---------------------------------------------------------------- diagram
def render_diagram(spec_path, out_dir, want_png, rep):
    dg = skills.load_hs("datum_diagram.py", "hs_datum_diagram")
    rep["reference"] = "datum_diagram.build_svg (Garis A)"
    rep["parityClass"] = "DG"
    try:
        spec = dg.load_spec(spec_path)            # tolak Mermaid (DATUM-31) + cermin source
        spec.pop("$schema", None)
        rep["code"] = spec.get("family")
        svg, erep = dg.build_svg(spec, release=False)
    except dg.DiagramDefect as ex:
        m = re.search(r"(DATUM-\d+(?:/\d+)?|P\d+-[A-Za-z_]+)", str(ex))
        raise RenderError(m.group(1) if m else "DIAGRAM_DEFECT", str(ex))
    rep["engineReport"] = erep
    rep["release"] = False
    svg_path = os.path.join(out_dir, "ref.svg")
    with open(svg_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(svg)
    rep["files"].append(chart_ref.file_entry("svg", svg_path))
    rep["fontSizesRaw"] = chart_ref.font_sizes(svg)
    return [(svg, os.path.join(out_dir, "ref.png"))] if want_png else []


# ----------------------------------------------------------------- simbol
def render_symbol(spec, out_dir, want_png, rep):
    sy = skills.load_hs("datumsimbol.py", "hs_datumsimbol")
    rep["parityClass"] = "SY"
    sheet = spec.get("sheet")
    if sheet is True:
        sheet = spec.get("dialect")
    jobs = []
    if sheet:
        if sheet not in sy.DIALECTS:
            raise RenderError("SYMBOL_DIALECT_UNKNOWN", "dialek '%s' tidak dikenal (%s)"
                              % (sheet, "/".join(sorted(sy.DIALECTS))))
        rep["reference"] = "datumsimbol.sheet_svg"
        rep["code"] = "sheet:%s" % sheet
        pages = sy.sheet_svg(sheet, cols=int(spec.get("cols", 3)))
        rep["pages"] = len(pages)
        for i, svg in enumerate(pages, 1):
            stem = "ref" if i == 1 else "ref-%d" % i
            jobs.append((svg, stem))
    else:
        sid = spec.get("id") or spec.get("symbol")
        if not sid:
            raise Misuse("spec simbol butuh 'id' (mis. iec:breaker) atau 'sheet'")
        rep["reference"] = "datumsimbol.symbol_svg"
        rep["code"] = sid
        try:
            svg = sy.symbol_svg(sid)
        except KeyError:
            raise RenderError("SYMBOL_UNKNOWN", "simbol '%s' tidak dikenal (datumsimbol.py --list)" % sid)
        jobs.append((svg, "ref"))
        try:
            rl = skills.load_rl("datum_symbols.py", "rl_datum_symbols")
            _svg, ports = rl.render(sid, 0.0, 0.0, sy.CELL, sy.CELL)
            rep["portsInMm"] = {k: [round(float(v[0]), 4), round(float(v[1]), 4)] for k, v in ports.items()}
            rep["portsSource"] = "datum_symbols.render (Garis B), petak %s mm" % sy.CELL
        except Exception as ex:   # port hanya pelengkap; simbol tetap dirender
            rep["warnings"].append("port Garis B tidak tersedia: %s: %s" % (type(ex).__name__, ex))
    todo = []
    for svg, stem in jobs:
        path = os.path.join(out_dir, stem + ".svg")
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            f.write(svg)
        rep["files"].append(chart_ref.file_entry("svg", path))
        if want_png:
            todo.append((svg, os.path.join(out_dir, stem + ".png")))
    rep["fontSizesRaw"] = sorted({v for svg, _ in jobs for v in chart_ref.font_sizes(svg)})
    return todo


# -------------------------------------------------------------------- CLI
def build_parser():
    ap = argparse.ArgumentParser(
        prog="ref_fig.py",
        description="Acuan Python figur (chart/diagram/simbol) untuk harness paritas DATUM (S65, H03).",
        epilog="Exit: 0 sukses atau no-reference | 1 galat render acuan | 2 salah pakai. "
               "Keluaran: ref.svg, ref.png (--png), ref_report.json.")
    ap.add_argument("--spec", required=True,
                    help="berkas spec JSON (studio.chart/v1, studio.diagram/v1) atau id simbol")
    ap.add_argument("--kind", required=True, choices=("chart", "diagram", "symbol"))
    ap.add_argument("--out", required=True, help="direktori keluaran")
    ap.add_argument("--png", action="store_true", help="tulis juga PNG 300 dpi")
    return ap


def write_report(out_dir, rep):
    path = os.path.join(out_dir, "ref_report.json")
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(rep, f, ensure_ascii=False, indent=2, default=str)
    return path


def main(argv=None):
    args = build_parser().parse_args(argv)        # salah pakai argparse -> exit 2
    t0 = time.time()
    rep = {"tool": "ref_fig.py", "version": VERSION, "row": "S65", "kind": args.kind,
           "spec": os.path.abspath(args.spec) if os.path.isfile(args.spec) else args.spec,
           "status": None, "code": None, "reference": None, "parityClass": None,
           "files": [], "png": [], "warnings": [], "patches": [], "sources": skills.source_paths(),
           "python": sys.version.split()[0]}
    try:
        os.makedirs(args.out, exist_ok=True)
    except OSError as ex:
        sys.stderr.write("SALAH PAKAI: --out tidak bisa dibuat: %s\n" % ex)
        return 2
    code = 0
    try:
        spec = read_spec(args.spec, args.kind)
        if args.kind == "chart":
            todo = chart_ref.render_chart(spec, args.out, args.png, rep)
        elif args.kind == "diagram":
            todo = render_diagram(args.spec, args.out, args.png, rep)
        else:
            todo = render_symbol(spec, args.out, args.png, rep)
        if todo:
            infos = raster.svgs_to_png(todo)
            for info in infos:
                info["method"] = "chromium-playwright-set_content"
                info["dpi"] = raster.DPI
                rep["files"].append(chart_ref.file_entry("png", info["path"]))
            rep["png"] = infos
        if rep["status"] is None:
            rep["status"] = "ok"
    except Misuse as ex:
        rep["status"] = "error"
        rep["error"] = {"code": "USAGE", "message": str(ex)}
        sys.stderr.write("SALAH PAKAI: %s\n" % ex)
        code = 2
    except (RenderError, chart_ref.ChartRefError) as ex:
        rep["status"] = "error"
        rep["error"] = {"code": ex.code, "message": str(ex), "trace": traceback.format_exc()}
        sys.stderr.write("GALAT ACUAN [%s]: %s\n" % (ex.code, str(ex).splitlines()[0]))
        code = 1
    except raster.RasterError as ex:
        rep["status"] = "error"
        rep["error"] = {"code": "RASTER_FAILED", "message": str(ex), "trace": traceback.format_exc()}
        sys.stderr.write("GALAT RASTER: %s\n" % ex)
        code = 1
    except Exception as ex:   # galat tak terduga tetap dicatat di laporan
        rep["status"] = "error"
        rep["error"] = {"code": "INTERNAL", "message": "%s: %s" % (type(ex).__name__, ex),
                        "trace": traceback.format_exc()}
        sys.stderr.write("GALAT INTERNAL: %s: %s\n" % (type(ex).__name__, ex))
        code = 1
    rep["durationMs"] = int((time.time() - t0) * 1000)
    path = write_report(args.out, rep)
    print(json.dumps({"status": rep["status"], "code": rep["code"], "report": os.path.abspath(path)},
                     ensure_ascii=False))
    return code


if __name__ == "__main__":
    sys.exit(main())
