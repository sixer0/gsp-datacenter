# -*- coding: utf-8 -*-
"""Acuan Python untuk spec `studio.chart/v1` (S65).

- Kode datumchart (P-01, P-02, W-02, P-11) -> `datumchart.render` Rev L (Garis B).
- Kode pustakachart (42) -> fungsi galeri Garis A dengan data disuntik
  (pc_inject.PC_MAP; research/06 6.3).
- Kode TANPA-ACUAN, komposit galeri, dan jenis drawn=false -> status
  `no-reference` (lint saja, kelas CC; research/06 6.5).

Monkeypatch (atribut `pustakachart_data`, `Figure.savefig`, rcParams
`svg.hashsalt`) hanya berlaku di proses adapter dan dipulihkan setelah
setiap panggilan; berkas skill tidak disentuh. Tambalan fungsi acuan yang
rusak ada di `ref_patches.py` (INT-L) dan dicatat di `rep["patches"]`.
"""
import hashlib
import os
import re
import traceback

import pc_inject
import ref_patches
import skills

# research/06 tabel 5.1 + 5.1.1: 18 jenis drawn=false (DF-01..DF-18)
DRAWN_FALSE = tuple("DF-%02d" % i for i in range(1, 19))
PNG_DPI = 300


class ChartRefError(RuntimeError):
    def __init__(self, code, message):
        super().__init__(message)
        self.code = code


def file_entry(fmt, path):
    blob = open(path, "rb").read()
    return {"format": fmt, "path": os.path.abspath(path),
            "sha256": hashlib.sha256(blob).hexdigest(), "bytes": len(blob)}


def font_sizes(svg):
    """Himpunan nilai font-size mentah pada SVG (atribut dan gaya)."""
    vals = re.findall(r'font-size(?:="|:\s*)([0-9.]+)', svg)
    return sorted({float(v) for v in vals})


def parity_class(code):
    if code in pc_inject.DC_MAP:
        return "CA"
    if code in pc_inject.PC_MAP:
        return "CB2" if pc_inject.PC_MAP[code][3] else "CB1"
    return "CC"


# ------------------------------------------------------------ datumchart
def dc_spec(spec, family):
    data = spec.get("data") or {}
    if data.get("shape") != "categorical":
        raise ChartRefError("CHART_DATA_SHAPE",
                            "kode %s: datumchart membaca bentuk categorical, spec '%s'"
                            % (spec.get("kind"), data.get("shape")))
    pts = []
    for p in data.get("points") or []:
        q = {"label": p.get("label"), "value": p.get("value")}
        if p.get("accent"):
            q["accent"] = True
        if p.get("sub"):
            q["sub"] = p["sub"]
        pts.append(q)
    d = {"family": family, "title": spec.get("title", ""), "source": spec.get("source", ""),
         "width_mm": spec.get("widthMm"), "apparatus": spec.get("apparatus", "page"), "data": pts}
    for src, dst in (("id", "id"), ("unit", "unit"), ("dec", "dec"), ("limit", "limit"),
                     ("limitLabel", "limit_label"), ("inDocument", "in_document"), ("note", "note")):
        if spec.get(src) is not None:
            d[dst] = spec[src]
    # datumchart membaca bendera `sub` tingkat spec untuk ruang baris kedua kolom
    # (tinggi() dan render()); StudioChartV1 hanya punya `sub` per titik.
    if any(p.get("sub") for p in pts):
        d["sub"] = True
    return d


def render_dc(spec, family, out_dir, want_png, rep):
    dc = skills.load_rl("datumchart.py", "rl_datumchart")
    d = dc_spec(spec, family)
    rep["referenceInput"] = d
    try:
        svg = dc.render(d)
    except dc.ChartDefect as ex:
        m = re.match(r"\[([^\]]+)\]", str(ex))
        raise ChartRefError("DATUMCHART-%s" % (m.group(1) if m else "DEFECT"), str(ex))
    svg_path = os.path.join(out_dir, "ref.svg")
    with open(svg_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(svg)
    rep["files"].append(file_entry("svg", svg_path))
    rep["fontSizesRaw"] = font_sizes(svg)
    rep["heightMmEstimate"] = round(dc.tinggi(d), 3)
    rep["dataInjection"] = {"mode": "spec", "notes": ["spec datumchart dibangun dari StudioChartV1"]}
    return [(svg, os.path.join(out_dir, "ref.png"))] if want_png else []


# ----------------------------------------------------------- pustakachart
def _strip_apparatus(fig, caption_label):
    """Buang judul (title="") dan footer CAPTION_LABEL dari teks tingkat figur."""
    n = 0
    for t in list(fig.texts):
        s = t.get_text()
        if not s.strip() or s.startswith(caption_label):
            t.remove()
            n += 1
    return n


def _numbers_equal(a, b, tol=1e-6):
    if isinstance(a, dict) and isinstance(b, dict):
        return a.keys() == b.keys() and all(_numbers_equal(a[k], b[k], tol) for k in a)
    if isinstance(a, list) and isinstance(b, list):
        return len(a) == len(b) and all(_numbers_equal(x, y, tol) for x, y in zip(a, b))
    if isinstance(a, (int, float)) and isinstance(b, (int, float)) and not isinstance(a, bool):
        return abs(float(a) - float(b)) <= tol
    return a == b


def _stack_args(spec):
    cats, ser = pc_inject._series(spec, 1)
    parts = [[pc_inject._num(s["values"][i]) for s in ser] for i in range(len(cats))]
    return cats, parts


def render_pc(spec, code, out_dir, want_png, rep):
    import matplotlib
    import matplotlib.figure
    import matplotlib.pyplot as plt

    pc = skills.load_hs("pustakachart.py", "hs_pustakachart")
    D = pc.D
    fn_name, mode, inj, _partial = pc_inject.PC_MAP[code]
    warnings = rep["warnings"]
    if not pc.REGISTRY:
        pc.build_registry()
    reg = {e["fn"].__name__: e for e in pc.REGISTRY}

    width = spec.get("widthMm")
    if fn_name in reg:
        e = reg[fn_name]
        rep["referenceCanvasMm"] = {"width": e["lebar_mm"], "height": e["tinggi_mm"], "vc": e["id"]}
        if width is not None and float(width) != float(e["lebar_mm"]):
            warnings.append("lebar acuan tetap %s mm (spec %s mm)" % (e["lebar_mm"], width))
        if spec.get("heightMm") is not None and float(spec["heightMm"]) != float(e["tinggi_mm"]):
            warnings.append("tinggi acuan tetap %s mm (spec %s mm)" % (e["tinggi_mm"], spec["heightMm"]))
    if spec.get("style") == "gallery":
        warnings.append("style=gallery tidak dimiliki acuan pustakachart; gaya DATUM dipakai")

    overrides = {}
    if mode == "pcd":
        try:
            overrides, notes = inj(spec)
        except pc_inject.InjectError as ex:
            raise ChartRefError(ex.code, str(ex))
        rep["dataInjection"] = {"mode": "pcd", "attrs": sorted(overrides), "notes": notes}
    elif mode == "param":
        try:
            labels, parts = _stack_args(spec)
        except pc_inject.InjectError as ex:
            raise ChartRefError(ex.code, str(ex))
        height = float(spec.get("heightMm") or 50.0)
        rep["dataInjection"] = {"mode": "param", "call": "_stack_rows(labels, parts, total100=%s, %s, %s, out, '')"
                                % (code == "K-02", width, height), "notes": []}
        rep["referenceCanvasMm"] = {"width": width, "height": height, "vc": "VC-19" if code == "K-02" else None}
    else:
        literal = pc_inject.literal_p07(pc.SEED) if code == "P-07" else pc_inject.literal_w03(D.BULAN)
        given = spec.get("data")
        match = None if given is None else _numbers_equal(
            {k: v for k, v in given.items() if k in literal}, literal)
        rep["dataInjection"] = {"mode": "literal", "literalData": literal, "specMatchesLiteral": match,
                                "notes": ["data LITERAL di dalam fungsi acuan (research/06 6.3); "
                                          "fixture S63 wajib memakai literalData"]}
        if match is False:
            warnings.append("data spec berbeda dari data LITERAL acuan; paritas %s tidak bermakna" % code)

    svg_path = os.path.join(out_dir, "ref.svg")
    png_path = os.path.join(out_dir, "ref.png")
    captured = {}
    orig = matplotlib.figure.Figure.savefig

    def spy(fig, fname, *a, **kw):
        if captured.get("done"):
            return orig(fig, fname, *a, **kw)
        captured["apparatusTextsRemoved"] = _strip_apparatus(fig, pc.CAPTION_LABEL)
        captured["fontMinPt"] = float(pc.measure_min_pt(fig))
        svg_kw = {k: v for k, v in kw.items() if k not in ("dpi", "metadata", "format")}
        # Uji jujur: metadata acuan ({"Software": None}) pada penulis SVG.
        try:
            orig(fig, svg_path, *a, format="svg", metadata=kw.get("metadata"), **svg_kw)
            captured["svgMetadataProbe"] = {"metadata": repr(kw.get("metadata")), "result": "accepted"}
        except ValueError as ex:
            captured["svgMetadataProbe"] = {"metadata": repr(kw.get("metadata")),
                                            "result": "rejected", "error": str(ex),
                                            "fallback": "metadata={'Date': None}"}
            orig(fig, svg_path, *a, format="svg", metadata={"Date": None}, **svg_kw)
        if want_png:
            orig(fig, png_path, *a, **kw)   # jalur PNG Agg 300 dpi acuan apa adanya
        captured["savefigKwargs"] = {k: repr(v) for k, v in kw.items()}
        captured["done"] = True
        return None

    saved = {k: getattr(D, k) for k in overrides if hasattr(D, k)}
    missing = [k for k in overrides if not hasattr(D, k)]
    old_salt = plt.rcParams.get("svg.hashsalt")
    try:
        for k, v in overrides.items():
            setattr(D, k, v)
        pc.fn_ax[0] = None
        pc.fn_grid[0] = None
        plt.rcParams["svg.hashsalt"] = "datum-s65-ref"
        matplotlib.figure.Figure.savefig = spy
        try:
            if mode == "param":
                total100 = code == "K-02"
                with ref_patches.stack_rows_legacy_sum(pc, total100, rep.setdefault("patches", [])):
                    pc._stack_rows(labels, parts, total100, float(width), height, png_path, "")
            else:
                getattr(pc, fn_name)(png_path, "")
        except AssertionError as ex:
            raise ChartRefError("CHART_WIDTH", "acuan menolak kanvas: %s" % ex)
        except ChartRefError:
            raise
        except Exception as ex:
            raise ChartRefError("REFERENCE_RENDER_FAILED", "%s: %s\n%s"
                                % (type(ex).__name__, ex, traceback.format_exc()))
    finally:
        matplotlib.figure.Figure.savefig = orig
        plt.rcParams["svg.hashsalt"] = old_salt
        for k, v in saved.items():
            setattr(D, k, v)
        for k in missing:
            delattr(D, k)
        pc.fn_ax[0] = None
        pc.fn_grid[0] = None
        plt.close("all")

    if not captured.get("done"):
        raise ChartRefError("REFERENCE_NO_SAVEFIG", "fungsi acuan %s tidak memanggil savefig" % fn_name)
    rep["savefig"] = {k: captured[k] for k in ("svgMetadataProbe", "savefigKwargs", "apparatusTextsRemoved")}
    rep["fontMinPt"] = captured["fontMinPt"]
    svg = open(svg_path, encoding="utf-8").read()
    rep["files"].append(file_entry("svg", svg_path))
    rep["fontSizesRaw"] = font_sizes(svg)
    if want_png:
        rep["files"].append(file_entry("png", png_path))
        info = {"method": "matplotlib-agg (jalur PNG acuan pustakachart, research/06 6.1)", "dpi": PNG_DPI}
        try:
            from PIL import Image
            with Image.open(png_path) as im:
                info["widthPx"], info["heightPx"] = im.size
        except Exception as ex:  # ukuran hanya informatif
            warnings.append("ukuran PNG tidak terbaca: %s" % ex)
        rep["png"] = [info]
    return []


# ------------------------------------------------------------------ pintu
def render_chart(spec, out_dir, want_png, rep):
    """Isi `rep`; mengembalikan list (svg, png_path) yang perlu dirasterisasi Chromium."""
    kind = spec.get("kind")
    rep["code"] = kind
    rep["parityClass"] = parity_class(kind)
    if kind == "composite":
        rep["status"] = "no-reference"
        rep["reason"] = ("komposit galeri: pembangun galeri Gambar 8.1-8.5 tidak ada di disk "
                         "(research/06 bagian 3, F-S02-01); paritas BG lawan PNG manual")
        rep["parityClass"] = "BG"
        return []
    if kind in DRAWN_FALSE:
        rep["status"] = "no-reference"
        rep["reason"] = "jenis drawn=false: tidak dirender (research/06 5.2)"
        rep["parityClass"] = None
        return []
    if kind in pc_inject.NO_REFERENCE:
        rep["status"] = "no-reference"
        rep["reason"] = "TANPA-ACUAN (research/06 5.1): lint saja + snapshot diri (kelas CC)"
        return []
    if kind in pc_inject.DC_MAP:
        fam = pc_inject.DC_MAP[kind]
        rep["reference"] = "datumchart:%s" % fam
        return render_dc(spec, fam, out_dir, want_png, rep)
    if kind in pc_inject.PC_MAP:
        rep["reference"] = "pustakachart:%s" % pc_inject.PC_MAP[kind][0]
        return render_pc(spec, kind, out_dir, want_png, rep)
    raise ChartRefError("CHART_KIND_UNKNOWN", "kind '%s' bukan kode chart yang dikenal" % kind)
