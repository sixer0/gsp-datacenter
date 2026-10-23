"""Uji mandiri pembanding paritas (FIX-3): SVG/DOCX sintetis kecil dengan hasil yang diketahui.

    VENV -I -B scripts/parity/compare/selftest_compare.py

Setiap kasus menulis masukan ke direktori sementara, memanggil `compare.run(...)` (antarmuka publik
yang sama dengan CLI H04), lalu memeriksa vonis dan cek tertentu. Exit 0 semua lulus, 1 ada yang gagal.
Nilai harapan berasal dari konstruksi masukan (mis. 3 batang ditulis = 3 tanda), bukan dari kode pembanding.
"""
from __future__ import annotations

import json
import sys
import tempfile
import traceback
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import compare as C  # noqa: E402

RESULTS: list[tuple[str, bool, str]] = []


def case(fn):
    def run() -> None:
        try:
            fn()
            RESULTS.append((fn.__name__, True, ""))
        except AssertionError as e:
            RESULTS.append((fn.__name__, False, str(e) or "assert"))
        except Exception as e:  # noqa: BLE001 - laporkan galat kasus apa adanya
            RESULTS.append((fn.__name__, False, f"{type(e).__name__}: {e}\n{traceback.format_exc()}"))
    run.__name__ = fn.__name__
    CASES.append(run)
    return fn


CASES: list = []
TMP = Path(tempfile.mkdtemp(prefix="parity_selftest_"))


def w(name: str, text: str) -> str:
    p = TMP / name
    p.write_text(text, encoding="utf-8")
    return str(p)


def check(rep: dict, cid: str) -> dict:
    for c in rep["metrics"]["checks"]:
        if c["id"] == cid:
            return c
    raise AssertionError(f"cek {cid} tidak ada; ada: {[c['id'] for c in rep['metrics']['checks']]}")


def has_check(rep: dict, cid: str) -> bool:
    return any(c["id"] == cid for c in rep["metrics"]["checks"])


def ctx_file(name: str, obj: dict) -> str:
    return w(name, json.dumps(obj))


# ------------------------------------------------------------------ SVG pembantu
def svg(body: str, w_mm: float = 100, h_mm: float = 50) -> str:
    return (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
            f'width="{w_mm}mm" height="{h_mm}mm" viewBox="0 0 {w_mm} {h_mm}">{body}</svg>')


DG_BODY = ('<rect x="10" y="10" width="20" height="10" fill="none" stroke="#2B3640"{a1}/>'
           '<rect x="60" y="10" width="20" height="10" fill="none" stroke="#2B3640"{a2}/>'
           '<path d="M 30 15 L 60 15" fill="none" stroke="#101418"{a3}/>'
           '<text x="20" y="16" font-size="2.4">Satu</text><text x="70" y="16" font-size="2.4">Dua</text>')


@case
def dg_mark_count_same_source_after_ignoring_node_marks() -> None:
    ref = w("dg_ref.svg", svg(DG_BODY.format(a1="", a2="", a3="")))
    node = w("dg_node.svg", svg(DG_BODY.format(a1=' data-mark="node" data-index="0"',
                                               a2=' data-mark="node" data-index="1"',
                                               a3=' data-mark="link" data-series="data"')))
    # aturan F-050 diuji terisolasi dari kelas D-242 (SVG sintetis tanpa data-node/laporan mesin)
    rep = C.run("svg", "DG", ref, node, ["d242Class=false"])
    mc = check(rep, "a.markCount")
    assert mc["gate"] is True and mc["pass"] is True, mc
    assert rep["metrics"]["marks"]["node"]["source"] == "rect (heuristik datumchart)", rep["metrics"]["marks"]
    assert rep["verdict"] == "PASS", [d for d in rep["diffs"] if d.get("gate")]


@case
def dg_real_mark_difference_still_fails() -> None:
    ref = w("dg_ref2.svg", svg(DG_BODY.format(a1="", a2="", a3="")))
    extra = DG_BODY.format(a1="", a2="", a3="") + '<rect x="40" y="30" width="10" height="5" fill="none" stroke="#2B3640"/>'
    node = w("dg_node2.svg", svg(extra))
    rep = C.run("svg", "DG", ref, node, [])
    assert check(rep, "a.markCount")["pass"] is False
    assert rep["verdict"] == "FAIL"


@case
def dg_color_max_uses_engine_report_rule() -> None:
    # 6 warna non-kertas di SVG, tetapi aturan mesin Python (n_colour) = 5 -> lulus.
    cols = ["#101418", "#2B3640", "#2F6F6B", "#6B7783", "#B45309", "#C3CBD1"]
    body = "".join(f'<rect x="{i * 10}" y="0" width="5" height="5" fill="none" stroke="{c}"/>' for i, c in enumerate(cols))
    ref = w("dg_col_ref.svg", svg(body))
    node = w("dg_col_node.svg", svg(body))
    eng = {"checks_run": ["DATUM-25"], "n_colour": 5, "colour_values": cols[:5], "n_hops": 0, "n_nodes": 6, "n_edges": 0}
    ctx = ctx_file("dg_ctx.json", {"engineReport": {"ref": eng, "node": dict(eng)}})
    # aturan F-S78-1 diuji terisolasi dari kelas D-242 (SVG sintetis tanpa data-node)
    rep = C.run("svg", "DG", ref, node, ["d242Class=false"], ctx)
    cm = check(rep, "b.colorMax")
    assert cm["gate"] is True and cm["pass"] is True, cm
    assert check(rep, "b.colorMaxSvg")["gate"] is False
    assert rep["verdict"] == "PASS", [d for d in rep["diffs"] if d.get("gate")]
    # tanpa laporan mesin: hitungan SVG hanya diagnosis
    rep2 = C.run("svg", "DG", ref, node, [])
    assert check(rep2, "b.colorMax")["gate"] is False


@case
def dg_engine_report_hops_mismatch_fails() -> None:
    ref = w("dg_h_ref.svg", svg(DG_BODY.format(a1="", a2="", a3="")))
    node = w("dg_h_node.svg", svg(DG_BODY.format(a1="", a2="", a3="")))
    a = {"checks_run": ["P1", "DATUM-25"], "n_colour": 2, "colour_values": ["#101418", "#2B3640"], "n_hops": 2, "n_nodes": 2, "n_edges": 1}
    b = dict(a, n_hops=1)
    rep = C.run("svg", "DG", ref, node, [], ctx_file("dg_h.json", {"engineReport": {"ref": a, "node": b}}))
    assert check(rep, "engine.nHops")["pass"] is False and check(rep, "engine.nHops")["gate"] is True
    assert check(rep, "engine.checksRun")["pass"] is True
    assert rep["verdict"] == "FAIL"


@case
def sy_ports_gate() -> None:
    body = '<circle cx="12" cy="12" r="6" fill="none" stroke="#101418" stroke-width="0.35"/>'
    ref = w("sy_ref.svg", svg(body, 24, 24))
    node = w("sy_node.svg", svg(body, 24, 24))
    ok = {"ports": {"ref": {"in": [12.0, 0.0], "out": [12.0, 24.0]}, "node": {"in": [12.0, 0.0], "out": [12.005, 24.0]}}}
    rep = C.run("svg", "SY", ref, node, [], ctx_file("sy_ok.json", ok))
    assert check(rep, "ports")["pass"] is True and check(rep, "ports")["gate"] is True
    bad = {"ports": {"ref": {"in": [12.0, 0.0], "out": [12.0, 24.0]}, "node": {"in": [12.0, 0.0], "out": [12.0, 23.9]}}}
    rep = C.run("svg", "SY", ref, node, [], ctx_file("sy_bad.json", bad))
    assert check(rep, "ports")["pass"] is False and rep["verdict"] == "FAIL"
    missing = {"ports": {"ref": {"in": [12.0, 0.0], "out": [12.0, 24.0]}, "node": {"in": [12.0, 0.0]}}}
    rep = C.run("svg", "SY", ref, node, [], ctx_file("sy_miss.json", missing))
    assert check(rep, "ports")["pass"] is False


# ------------------------------------------------------------------ matplotlib (acuan PC)
def mpl(axes_body: str) -> str:
    # latar sumbu = patch kertas, spine = patch tanpa isi; kotak sumbu x 10..90, y 5..45
    return svg('<g id="figure_1"><g id="axes_1">'
               '<g id="patch_1"><path d="M 10 45 L 90 45 L 90 5 L 10 5 z" style="fill: #fcfcfb"/></g>'
               + axes_body +
               '<g id="patch_9"><path d="M 10 45 L 10 5" style="fill: none; stroke: #6b7783"/></g>'
               '<g id="patch_10"><path d="M 10 45 L 90 45" style="fill: none; stroke: #6b7783"/></g>'
               '</g></g>')


@case
def mpl_classification_use_markers_collections_reflines_paper() -> None:
    body = (
        # 1 tanda data patch berwarna (patch pertama bukan latar, H1) + 1 sel kosong kertas (H11)
        '<g id="patch_2"><path d="M 20 45 L 30 45 L 30 20 L 20 20 z" style="fill: #2f6f6b"/></g>'
        '<g id="patch_3"><path d="M 40 45 L 50 45 L 50 40 L 40 40 z" style="fill: #fcfcfb"/></g>'
        # garis seri dengan 3 penanda <use> (H2)
        '<g id="line2d_1"><path d="M 20 30 L 50 25 L 80 20" style="fill: none; stroke: #101418"/>'
        '<use xlink:href="#m1" x="20" y="30" style="fill: #101418"/><use xlink:href="#m1" x="50" y="25" style="fill: #101418"/>'
        '<use xlink:href="#m1" x="80" y="20" style="fill: #101418"/></g>'
        # axhline lebar penuh = garis rujukan, bukan tanda (H4)
        '<g id="line2d_2"><path d="M 10 35 L 90 35" style="fill: none; stroke: #6b7783"/></g>'
        # LineCollection 2 segmen (H3)
        '<g id="LineCollection_1"><path d="M 60 45 L 60 30" style="stroke: #101418"/><path d="M 70 45 L 70 28" style="stroke: #101418"/></g>'
        # FillBetween lewat defs + use (H3)
        '<g id="FillBetweenPolyCollection_1"><defs><path id="p1" d="M 0 0 L 5 5 z"/></defs>'
        '<use xlink:href="#p1" x="12" y="12" style="fill: #6b7783"/></g>'
    )
    ref = w("mpl_ref.svg", mpl(body))
    rep = C.run("svg", "CB2", ref, ref, [])
    m = rep["metrics"]["marks"]["ref"]
    assert m["source"].startswith("matplotlib"), m
    # 1 patch + 1 garis + 3 penanda + 2 segmen + 1 area = 8
    assert m["count"] == 8, m
    assert m["types"] == {"rect": 1, "line": 1, "point": 3, "segment": 2, "area": 1}, m["types"]


@case
def cb1_cross_source_mark_gates_are_diagnosis() -> None:
    ref = w("cb_ref.svg", mpl('<g id="patch_2"><path d="M 20 45 L 30 45 L 30 20 L 20 20 z" style="fill: #101418"/></g>'))
    node = w("cb_node.svg", svg('<g data-axis="x"><line x1="10" y1="45" x2="90" y2="45" stroke="#6B7783"/></g>'
                               '<rect data-mark="column" data-series="A" data-index="0" x="20" y="20" width="10" height="25" fill="#101418"/>'
                               '<rect data-mark="column" data-series="A" data-index="1" x="40" y="30" width="10" height="15" fill="#2B3640"/>',
                               128, 50))
    rep = C.run("svg", "CB1", ref, node, [])
    assert check(rep, "a.markCount")["gate"] is False and check(rep, "a.markCount")["pass"] is False
    assert check(rep, "b.markColors")["gate"] is False
    assert "a.markCount" not in [d["check"] for d in rep["diffs"] if d.get("gate")]


@case
def zero_baseline_stacked_floating_midpoint() -> None:
    axis = '<g data-axis="x"><line x1="10" y1="45" x2="90" y2="45" stroke="#6B7783"/></g>'
    # kolom bertumpuk: segmen atas tidak menyentuh sumbu, segmen bawah menyentuh -> lulus
    stacked = axis + ('<rect data-mark="column" data-series="A" data-index="0" x="20" y="30" width="10" height="15" fill="#101418"/>'
                      '<rect data-mark="column" data-series="B" data-index="0" x="20" y="10" width="10" height="20" fill="#6B7783"/>')
    # batang divergen di sekitar garis nol titik tengah Node (data-midpoint) -> lulus
    diverging = ('<line x1="50" y1="5" x2="50" y2="45" stroke="#6B7783" data-midpoint="0"/>'
                 '<rect data-mark="bar" data-series="A" data-index="0" x="50" y="10" width="20" height="5" fill="#101418"/>'
                 '<rect data-mark="bar" data-series="B" data-index="0" x="30" y="10" width="20" height="5" fill="#6B7783"/>')
    # box/interval tidak dinilai (bukan bar/column/area)
    boxes = axis + '<rect data-mark="box" x="20" y="10" width="10" height="5" fill="#101418"/>'
    # kolom mengambang tanpa satu pun menyentuh garis nol -> gagal
    floating = axis + '<rect data-mark="column" data-series="A" data-index="0" x="20" y="10" width="10" height="5" fill="#101418"/>'
    paths = {}
    for name, body, want in (("stk", stacked, True), ("div", diverging, True), ("box", boxes, None), ("flt", floating, False)):
        p = paths[name] = w(f"zb_{name}.svg", svg(body, 128, 50))
        rep = C.run("svg", "CB1", p, p, [])
        zb = rep["metrics"]["axes"]["zeroBaseline"]["node"]
        assert zb is want, (name, zb)
        # Node tanpa garis dasar lulus hanya bila acuan juga tanpa (sisi yang sama di sini)
        assert check(rep, "c.zeroBaseline")["pass"] is True, name
    # acuan bergaris dasar, Node mengambang -> gagal (gerbang)
    rep = C.run("svg", "CB1", paths["stk"], paths["flt"], [])
    zc = check(rep, "c.zeroBaseline")
    assert zc["pass"] is False and zc["gate"] is True, zc


@case
def label_number_normalisation() -> None:
    ref = w("lbl_ref.svg", svg('<text x="1" y="1" font-size="2.4">10.0</text><text x="1" y="5" font-size="2.4">1000</text>'
                               '<text x="1" y="9" font-size="2.4">60%</text><text x="1" y="13" font-size="2.4">−5</text>'
                               '<text x="1" y="17" font-size="2.4">Alfa</text>', 128, 50))
    node = w("lbl_node.svg", svg('<text x="1" y="1" font-size="2.4">10,0</text><text x="1" y="5" font-size="2.4">1.000</text>'
                                 '<text x="1" y="9" font-size="2.4">60 %</text><text x="1" y="13" font-size="2.4">-5</text>'
                                 '<text x="1" y="17" font-size="2.4">Alfa</text>', 128, 50))
    rep = C.run("svg", "CB1", ref, node, [])
    assert check(rep, "f.labels")["pass"] is True, [d for d in rep["diffs"] if d["check"] == "f.labels"]
    bad = w("lbl_bad.svg", svg('<text x="1" y="1" font-size="2.4">10,5</text><text x="1" y="5" font-size="2.4">1.000</text>'
                               '<text x="1" y="9" font-size="2.4">60 %</text><text x="1" y="13" font-size="2.4">-5</text>'
                               '<text x="1" y="17" font-size="2.4">Alfa</text>', 128, 50))
    assert check(C.run("svg", "CB1", ref, bad, []), "f.labels")["pass"] is False


@case
def accent_counted_per_subject() -> None:
    seg = "".join(f'<rect data-mark="segment" data-series="Instalasi" data-index="{i}" x="{10 + i * 10}" y="5" width="5" height="5" '
                  f'fill="#B45309" data-accent="series"/>' for i in range(4))
    line = ('<path data-mark="line" data-series="Bravo" data-index="1" d="M 1 1 L 9 9" fill="none" stroke="#B45309"/>'
            + "".join(f'<circle data-mark="point" data-series="Bravo" data-index="1" cx="{i}" cy="{i}" r="0.7" fill="#B45309"/>'
                      for i in range(1, 5)))
    two = ('<rect data-mark="bar" data-series="A" data-index="0" x="1" y="1" width="3" height="3" fill="#B45309"/>'
           '<rect data-mark="bar" data-series="A" data-index="1" x="5" y="1" width="3" height="3" fill="#B45309"/>')
    for name, body, n in (("seg", seg, 1), ("line", line, 1), ("two", two, 2)):
        p = w(f"acc_{name}.svg", svg(body, 128, 50))
        c = check(C.run("svg", "CB1", p, p, []), "b.accentCount")
        assert c["pass"] is (n <= 1), (name, c)


# ------------------------------------------------------------------ SR-40: sisa FIX-3 per aturan
# Penamaan: awalan = ID temuan yang diuji (F-050, F-S78-1, F-051 H-n, F-056).
@case
def f050_cross_source_gate_restored_by_threshold() -> None:
    # F-050/R01: lintas sumber (matplotlib lawan data-mark) = diagnosis; ambang controller memulihkan gerbang.
    ref = w("f050_ref.svg", mpl('<g id="patch_2"><path d="M 20 45 L 30 45 L 30 20 L 20 20 z" style="fill: #101418"/></g>'))
    node = w("f050_node.svg", svg('<g data-axis="x"><line x1="10" y1="45" x2="90" y2="45" stroke="#6B7783"/></g>'
                                 '<rect data-mark="column" data-series="A" data-index="0" x="20" y="20" width="10" height="25" fill="#101418"/>'
                                 '<rect data-mark="column" data-series="A" data-index="1" x="40" y="30" width="10" height="15" fill="#2B3640"/>',
                                 128, 50))
    rep = C.run("svg", "CB1", ref, node, ["markGateCrossSource=true"])
    mc = check(rep, "a.markCount")
    assert mc["gate"] is True and mc["pass"] is False, mc
    assert "a.markCount" in [d["check"] for d in rep["diffs"] if d.get("gate")]
    assert rep["verdict"] == "FAIL"
    # catatan klasifikasi selalu tercatat bila sumber berbeda
    assert any(d["check"] == "markClassification" for d in rep["diffs"]), rep["diffs"]


@case
def fs78_1_color_max_engine_over_limit_fails_and_paper_excluded() -> None:
    # F-S78-1: gerbang = n_colour mesin; 6 > 5 gagal walau SVG hanya 3 warna non-kertas.
    body = ('<rect x="0" y="0" width="5" height="5" fill="#FCFCFB" stroke="#101418"/>'
            '<rect x="10" y="0" width="5" height="5" fill="#FFFFFF" stroke="#2B3640"/>'
            '<rect x="20" y="0" width="5" height="5" fill="none" stroke="#2F6F6B"/>')
    ref = w("fs78_ref.svg", svg(body))
    node = w("fs78_node.svg", svg(body))
    eng = {"checks_run": ["DATUM-25"], "n_colour": 6, "colour_values": [], "n_hops": 0, "n_nodes": 3, "n_edges": 0}
    rep = C.run("svg", "DG", ref, node, [], ctx_file("fs78_ctx.json", {"engineReport": {"ref": dict(eng, n_colour=5), "node": eng}}))
    cm = check(rep, "b.colorMax")
    assert cm["gate"] is True and cm["pass"] is False, cm
    assert rep["verdict"] == "FAIL"
    # hitungan SVG (diagnosis) membuang PAPER/putih: 3 warna, bukan 5
    d = next(x for x in rep["diffs"] if x["check"] == "b.colorMax")
    assert d["detail"]["svgCount"] == {"ref": 3, "node": 3}, d
    assert check(rep, "b.colorMaxSvg")["pass"] is True


@case
def f051_h3_contour_image_polycollection_quadmesh() -> None:
    # F-051 H3: koleksi matplotlib terklasifikasi; isian kertas pada koleksi dibuang.
    body = ('<g id="QuadContourSet_1"><path d="M 20 20 L 30 25" style="fill: none; stroke: #2b3640"/>'
            '<path d="M 20 30 L 30 35" style="fill: none; stroke: #2b3640"/></g>'
            '<g id="PolyCollection_1"><path d="M 40 40 L 50 40 L 50 30 z" style="fill: #c3cbd1"/>'
            '<path d="M 55 40 L 60 40 L 60 30 z" style="fill: #fcfcfb; stroke: #fcfcfb"/></g>'
            '<g id="QuadMesh_1"><path d="M 62 40 L 66 40 L 66 36 L 62 36 z" style="fill: #2f6f6b"/></g>'
            '<image x="70" y="10" width="10" height="10" xlink:href="data:image/png;base64,AA=="/>')
    rep = C.run("svg", "CB2", w("h3_ref.svg", mpl(body)), w("h3_ref2.svg", mpl(body)), [])
    m = rep["metrics"]["marks"]["ref"]
    assert m["types"] == {"contour": 2, "area": 2, "image": 1}, m


@case
def f051_h6_colorbar_and_tickless_axes_ignored() -> None:
    # F-051 H6: sumbu colorbar (sempit) dan sumbu tanpa tick tidak dihitung; tanda di colorbar bukan data.
    ref = w("h6_ref.svg", svg(
        '<g id="figure_1">'
        '<g id="axes_1"><g id="patch_1"><path d="M 10 45 L 90 45 L 90 5 L 10 5 z" style="fill: #fcfcfb"/></g>'
        '<g id="patch_2"><path d="M 20 45 L 30 45 L 30 20 L 20 20 z" style="fill: #101418"/></g>'
        '<g id="matplotlib.axis_1"><g id="xtick_1"><text x="20" y="48" style="font-size: 6.8px">0</text></g>'
        '<g id="xtick_2"><text x="60" y="48" style="font-size: 6.8px">10</text></g></g>'
        '<g id="matplotlib.axis_2"><g id="ytick_1"><text x="8" y="45" style="font-size: 6.8px">0</text></g></g></g>'
        '<g id="axes_2"><g id="patch_3"><path d="M 100 45 L 104 45 L 104 5 L 100 5 z" style="fill: #2f6f6b"/></g>'
        '<g id="matplotlib.axis_3"><g id="ytick_2"><text x="106" y="45" style="font-size: 6.8px">5</text></g></g></g>'
        '<g id="axes_3"><g id="patch_4"><path d="M 10 49 L 90 49 L 90 47 L 10 47 z" style="fill: none; stroke: #6b7783"/></g>'
        '<g id="matplotlib.axis_4"><path d="M 10 49 L 90 49" style="fill: none; stroke: #6b7783"/></g></g>'
        '</g>', 128, 50))
    node = w("h6_node.svg", svg('<g data-axis="x"><line x1="10" y1="45" x2="90" y2="45" stroke="#6B7783"/><text x="20" y="48" font-size="2.4">0</text></g>'
                               '<g data-axis="y"><line x1="10" y1="5" x2="10" y2="45" stroke="#6B7783"/><text x="8" y="45" font-size="2.4">0</text></g>'
                               '<rect data-mark="column" data-series="A" data-index="0" x="20" y="20" width="10" height="25" fill="#101418"/>',
                               128, 50))
    rep = C.run("svg", "CB1", ref, node, [])
    ax = rep["metrics"]["axes"]["ref"]
    assert ax["count"] == 2 and ax["orientations"] == ["x", "y"], ax
    assert check(rep, "c.axisCount")["pass"] is True and check(rep, "c.axisOrientation")["pass"] is True
    assert rep["metrics"]["marks"]["ref"]["types"] == {"rect": 1}, rep["metrics"]["marks"]["ref"]


@case
def f051_h4_event_lines_are_marks_not_reflines() -> None:
    # F-051 H4 (SR-40): 1-4 garis selebar sumbu = rujukan; >= 5 sejajar (plot peristiwa W-08) = tanda `line`.
    events = "".join(f'<g id="line2d_{i}"><path d="M {20 + i * 10} 45 L {20 + i * 10} 5" style="fill: none; stroke: #101418"/></g>'
                     for i in range(1, 7))
    axh = '<g id="line2d_20"><path d="M 10 30 L 90 30" style="fill: none; stroke: #6b7783"/></g>'
    rep = C.run("svg", "CB2", w("ev_ref.svg", mpl(events + axh)), w("ev_ref2.svg", mpl(axh)), [])
    assert rep["metrics"]["marks"]["ref"]["types"] == {"line": 6}, rep["metrics"]["marks"]["ref"]
    few = "".join(f'<g id="line2d_{i}"><path d="M {20 + i * 10} 45 L {20 + i * 10} 5" style="fill: none; stroke: #101418"/></g>'
                  for i in range(1, 3))
    rep = C.run("svg", "CB2", w("ev_few.svg", mpl(few)), w("ev_few2.svg", mpl(few)), [])
    assert rep["metrics"]["marks"]["ref"]["count"] == 0, rep["metrics"]["marks"]["ref"]


@case
def f051_h11_table_cells_counted_headers_dropped() -> None:
    # F-051 H11 (SR-40): sel `ax.table` berwarna kertas tetap sel data; kepala baris/kolom dibuang.
    # Tabel 3 x 3 (baris 0 = kepala kolom, kolom 0 = kepala baris) -> 2 x 2 = 4 sel data.
    cells = "".join(f'<g id="patch_{2 + r_ * 3 + c_}"><path d="M {20 + c_ * 20} {10 + r_ * 10} L {40 + c_ * 20} {10 + r_ * 10} '
                    f'L {40 + c_ * 20} {20 + r_ * 10} L {20 + c_ * 20} {20 + r_ * 10} z" style="fill: #fcfcfb; stroke: #c3cbd1"/></g>'
                    for r_ in range(3) for c_ in range(3))
    body = f'<g id="table_1">{cells}</g>'
    rep = C.run("svg", "CB2", w("tb_ref.svg", mpl(body)), w("tb_ref2.svg", mpl(body)), [])
    assert rep["metrics"]["marks"]["ref"]["types"] == {"cell": 4}, rep["metrics"]["marks"]["ref"]


@case
def f051_h5_unassessed_ref_area_floats_but_column_must_touch() -> None:
    # F-051 H5 (SR-40): acuan tanpa tanda nol yang dapat dinilai (isian biola via defs -> tanpa bbox).
    ref = w("h5u_ref.svg", mpl('<g id="FillBetweenPolyCollection_1"><defs><path id="v1" d="M 0 0 L 5 5 z"/></defs>'
                               '<use xlink:href="#v1" x="30" y="20" style="fill: #eff2f4"/></g>'))
    axis = '<g data-axis="x"><line x1="10" y1="45" x2="90" y2="45" stroke="#6B7783"/></g>'
    violin = w("h5u_violin.svg", svg(axis + '<path data-mark="area" data-series="A" data-index="0" d="M 30 10 L 35 20 L 30 30 L 25 20 z" fill="#EFF2F4"/>', 128, 50))
    column = w("h5u_col.svg", svg(axis + '<rect data-mark="column" data-series="A" data-index="0" x="20" y="10" width="10" height="5" fill="#101418"/>', 128, 50))
    rep = C.run("svg", "CB1", ref, violin, [])
    assert rep["metrics"]["axes"]["zeroBaseline"] == {"ref": None, "node": False}, rep["metrics"]["axes"]["zeroBaseline"]
    assert check(rep, "c.zeroBaseline")["pass"] is True
    rep = C.run("svg", "CB1", ref, column, [])
    zc = check(rep, "c.zeroBaseline")
    assert zc["pass"] is False and zc["gate"] is True, zc


@case
def f051_h5_ref_refline_is_baseline_and_interval_not_judged() -> None:
    # F-051 H4/H5: batang divergen acuan menyentuh `axvline(0)` (garis rujukan) -> acuan bergaris dasar.
    body = ('<g id="patch_2"><path d="M 50 20 L 70 20 L 70 15 L 50 15 z" style="fill: #101418"/></g>'
            '<g id="patch_3"><path d="M 30 30 L 50 30 L 50 25 L 30 25 z" style="fill: #6b7783"/></g>'
            '<g id="line2d_1"><path d="M 50 45 L 50 5" style="fill: none; stroke: #6b7783"/></g>')
    ref = w("h5r_ref.svg", mpl(body))
    rep = C.run("svg", "CB2", ref, ref, [])
    assert rep["metrics"]["axes"]["zeroBaseline"]["ref"] is True, rep["metrics"]["axes"]
    assert rep["metrics"]["marks"]["ref"]["types"] == {"rect": 2}, rep["metrics"]["marks"]["ref"]
    # `interval` Node mengambang menurut definisinya: tidak dinilai (None)
    iv = w("h5r_iv.svg", svg('<g data-axis="x"><line x1="10" y1="45" x2="90" y2="45" stroke="#6B7783"/></g>'
                            '<rect data-mark="interval" data-series="A" data-index="0" x="20" y="10" width="30" height="3" fill="#101418"/>', 128, 50))
    rep = C.run("svg", "CB1", iv, iv, [])
    assert rep["metrics"]["axes"]["zeroBaseline"]["node"] is None, rep["metrics"]["axes"]


@case
def f051_h12_boxplot_decomposition_cross_source_is_diagnosis() -> None:
    # F-051 H12: boxplot matplotlib (rect + line2d whisker/cap/median) lawan box/whisker Node -> diagnosis.
    ref = w("h12_ref.svg", mpl('<g id="patch_2"><path d="M 20 30 L 30 30 L 30 20 L 20 20 z" style="fill: #eff2f4"/></g>'
                               + "".join(f'<g id="line2d_{i}"><path d="M 25 {10 + i} L 26 {10 + i}" style="fill: none; stroke: #2b3640"/></g>'
                                         for i in range(1, 6))))
    node = w("h12_node.svg", svg('<g data-axis="x"><line x1="10" y1="45" x2="90" y2="45" stroke="#6B7783"/></g>'
                                '<rect data-mark="box" data-series="A" data-index="0" x="20" y="20" width="10" height="10" fill="#EFF2F4"/>'
                                '<path data-mark="whisker" data-series="A" data-index="0" d="M 25 10 L 25 20" stroke="#2B3640"/>', 128, 50))
    rep = C.run("svg", "CB1", ref, node, [])
    mc = check(rep, "a.markCount")
    assert mc["pass"] is False and mc["gate"] is False, mc
    assert check(rep, "b.markColors")["gate"] is False


# ------------------------------------------------------------------ D-240: (f) gerbang label isi
def _t(x: float, y: float, s: str) -> str:
    return f'<text x="{x}" y="{y}" style="font-size: 6.8px">{s}</text>'


def ref_lbl(xticks: list[str], ycats: list[str], body: list[str], legend: str = "") -> str:
    """Acuan matplotlib: tick x angka, tick y kategori, teks badan (label nilai/anotasi), legenda opsional."""
    xs = "".join(f'<g id="xtick_{i}">{_t(20 + i * 10, 48, v)}</g>' for i, v in enumerate(xticks, 1))
    ys = "".join(f'<g id="ytick_{i}">{_t(8, 10 + i * 8, v)}</g>' for i, v in enumerate(ycats, 1))
    bd = "".join(f'<g id="text_{30 + i}">{_t(60, 10 + i * 5, v)}</g>' for i, v in enumerate(body))
    lg = f'<g id="legend_1"><g id="text_90">{_t(70, 4, legend)}</g></g>' if legend else ""
    return mpl(f'<g id="matplotlib.axis_1">{xs}</g><g id="matplotlib.axis_2">{ys}</g>{bd}{lg}')


def node_lbl(xticks: list[str], cats: list[str], body: list[str]) -> str:
    xs = "".join(_t(20 + i * 10, 48, v) for i, v in enumerate(xticks))
    ys = "".join(_t(8, 10 + i * 8, v) for i, v in enumerate(cats))
    bd = "".join(f'<text x="60" y="{10 + i * 5}" font-size="2.4" data-label="value">{v}</text>' for i, v in enumerate(body))
    return svg(f'<g data-axis="x"><line x1="10" y1="45" x2="90" y2="45" stroke="#6B7783"/>{xs}</g>'
               f'<g data-axis="y"><line x1="10" y1="5" x2="10" y2="45" stroke="#6B7783"/>{ys}</g>{bd}', 128, 50)


SPEC_PQ = {"data": {"shape": "series", "categories": ["Kamera", "Penarikan kabel"],
                    "series": [{"name": "Penawaran A", "values": [185, 118.5]}]}}


@case
def d240_missing_category_fails_wrapped_category_passes() -> None:
    # D-240/D-246: kategori yang tampak di acuan lalu hilang di Node = FAIL; nama yang absen di kedua sisi tidak.
    ref = w("d240c_ref.svg", ref_lbl(["0", "100"], ["Kamera", "Penarikan kabel"], ["185.0"]))
    sp = ctx_file("d240c_spec.json", SPEC_PQ)
    ctx = ctx_file("d240c_ctx.json", {"chartSpec": sp})  # path JSON fixture
    # kategori dibungkus dua baris ("Penarikan" / "kabel") + nama seri di baris KUNCI -> lulus
    ok = w("d240c_ok.svg", node_lbl(["0", "100"], ["Kamera", "Penarikan", "kabel", "Penawaran A"], ["185,0"]))
    rep = C.run("svg", "CB1", ref, ok, [], ctx)
    assert check(rep, "f.labels")["pass"] is True, [d for d in rep["diffs"] if d["check"] == "f.labels"]
    assert rep["metrics"]["contentLabels"]["namesSource"].startswith("chartSpec"), rep["metrics"]["contentLabels"]
    # kategori "Penarikan kabel" hilang di Node -> FAIL gerbang
    bad = w("d240c_bad.svg", node_lbl(["0", "100"], ["Kamera", "Penawaran A"], ["185,0"]))
    rep = C.run("svg", "CB1", ref, bad, [], ctx)
    fl = check(rep, "f.labels")
    d = next(x for x in rep["diffs"] if x["check"] == "f.labels")
    assert fl["pass"] is False and fl["gate"] is True and d["detail"]["missingNames"] == ["Penarikan kabel"], d
    # nama seri hilang (spec objek inline) -> FAIL
    noser = w("d240c_noser.svg", node_lbl(["0", "100"], ["Kamera", "Penarikan kabel"], ["185,0"]))
    # D-246 (bawaan `labelNamesRequireRef=true`): nama seri tidak tampak di acuan maupun Node -> tidak FAIL,
    # tetapi tetap dilaporkan (`missingNames` + `absentInRef`)
    ctx2 = ctx_file("d240c_ctx2.json", {"chartSpec": SPEC_PQ})
    rep = C.run("svg", "CB1", ref, noser, [], ctx2)
    assert check(rep, "f.labels")["pass"] is True, [x for x in rep["diffs"] if x["check"] == "f.labels"]
    lab = rep["metrics"]["contentLabels"]
    assert lab["namesSource"].startswith("chartSpec"), lab
    # D-240 harfiah (`labelNamesRequireRef=false`): nama data yang hilang di Node selalu FAIL
    rep = C.run("svg", "CB1", ref, noser, ["labelNamesRequireRef=false"], ctx2)
    d = next(x for x in rep["diffs"] if x["check"] == "f.labels")
    assert d["gate"] is True and d["detail"]["missingNames"] == ["Penawaran A"], d
    assert d["detail"]["absentInRef"] == ["Penawaran A"], d
    # nama tampak di acuan (tick kategori) dan hilang di Node -> FAIL pada bawaan D-246
    rep = C.run("svg", "CB1", ref, bad, [], ctx2)
    d = next(x for x in rep["diffs"] if x["check"] == "f.labels")
    assert d["gate"] is True and d["detail"]["namesGated"] == ["Penarikan kabel"] and rep["verdict"] == "FAIL", d
    # tanpa chartSpec: kategori dari label tick kategori acuan tetap digerbang
    rep = C.run("svg", "CB1", ref, bad, [])
    assert check(rep, "f.labels")["pass"] is False, rep["metrics"]["contentLabels"]


@case
def d240_tick_difference_is_diagnosis() -> None:
    ref = w("d240t_ref.svg", ref_lbl(["0", "20", "40", "60"], ["Kamera", "Penarikan kabel"], []))
    node = w("d240t_node.svg", node_lbl(["0", "25", "50"], ["Kamera", "Penarikan kabel", "Penawaran A"], []))
    rep = C.run("svg", "CB1", ref, node, [], ctx_file("d240t_ctx.json", {"chartSpec": SPEC_PQ}))
    assert check(rep, "f.labels")["pass"] is True
    tk = check(rep, "f.ticks")
    assert tk["pass"] is False and tk["gate"] is False, tk
    assert "f.ticks" not in [d["check"] for d in rep["diffs"] if d.get("gate")]


@case
def d240_ref_legend_literal_and_node_apparatus_are_diagnosis() -> None:
    ref = w("d240l_ref.svg", ref_lbl(["0", "100"], ["Kamera", "Penarikan kabel"], ["mahal &amp; cepat"], legend="■ Alfa □ Bravo"))
    node = w("d240l_node.svg", node_lbl(["0", "100"], ["Kamera", "Penarikan kabel", "KUNCI", "Penawaran A", "juta rupiah"], []))
    rep = C.run("svg", "CB1", ref, node, [], ctx_file("d240l_ctx.json", {"chartSpec": SPEC_PQ}))
    assert check(rep, "f.labels")["pass"] is True, [d for d in rep["diffs"] if d["check"] == "f.labels"]
    lit = next(d for d in rep["diffs"] if d["check"] == "f.refLiterals")
    assert lit["gate"] is False and lit["detail"]["onlyRef"] == ["mahal & cepat", "■ Alfa □ Bravo"], lit
    # aparatus Node di luar grup sumbu (KUNCI, satuan) = diagnosis `f.nodeExtra`
    node2 = w("d240l_node2.svg", svg('<g data-axis="y"><line x1="10" y1="5" x2="10" y2="45" stroke="#6B7783"/>'
                                    + _t(8, 18, "Kamera") + _t(8, 26, "Penarikan kabel") + '</g>'
                                    + _t(60, 5, "KUNCI") + _t(70, 5, "Penawaran A") + _t(90, 5, "juta rupiah"), 128, 50))
    rep = C.run("svg", "CB1", ref, node2, [], ctx_file("d240l_ctx2.json", {"chartSpec": SPEC_PQ}))
    ex = next(d for d in rep["diffs"] if d["check"] == "f.nodeExtra")
    assert ex["gate"] is False and ex["detail"]["onlyNode"] == ["KUNCI", "juta rupiah"], ex
    assert not [d["check"] for d in rep["diffs"] if d.get("gate") and d["check"].startswith("f.")], rep["diffs"]


@case
def d240_missing_data_value_fails() -> None:
    ref = w("d240v_ref.svg", ref_lbl(["0", "100"], ["Kamera", "Penarikan kabel"], ["185.0", "118.5", "61%"]))
    ctx = ctx_file("d240v_ctx.json", {"chartSpec": SPEC_PQ})
    ok = w("d240v_ok.svg", node_lbl(["0", "100"], ["Kamera", "Penarikan kabel", "Penawaran A"], ["185,0", "118,5", "61 %", "+12,0"]))
    rep = C.run("svg", "CB1", ref, ok, [], ctx)
    assert check(rep, "f.labels")["pass"] is True, [d for d in rep["diffs"] if d["check"] == "f.labels"]
    # nilai tambahan Node (+12,0) hanya diagnosis
    assert next(d for d in rep["diffs"] if d["check"] == "f.nodeExtra")["detail"]["onlyNode"] == ["+12,0"]
    bad = w("d240v_bad.svg", node_lbl(["0", "100"], ["Kamera", "Penarikan kabel", "Penawaran A"], ["185,0", "61 %"]))
    rep = C.run("svg", "CB1", ref, bad, [], ctx)
    d = next(x for x in rep["diffs"] if x["check"] == "f.labels")
    assert d["gate"] is True and d["detail"]["missingValues"] == ["118.5"] and rep["verdict"] == "FAIL", d


# ------------------------------------------------------------------ DOCX
W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"


def docx(name: str, body: str, fonts: str = "") -> str:
    p = TMP / name
    doc = f'<w:document xmlns:w="{W_NS}"><w:body>{body}</w:body></w:document>'
    ft = f'<w:fonts xmlns:w="{W_NS}">{fonts}</w:fonts>'
    with zipfile.ZipFile(p, "w") as z:
        z.writestr("word/document.xml", doc)
        z.writestr("word/fontTable.xml", ft)
    return str(p)


def para(text: str, caps: bool = False) -> str:
    rpr = "<w:rPr><w:caps/></w:rPr>" if caps else ""
    return f"<w:p><w:r>{rpr}<w:t>{text}</w:t></w:r></w:p>"


def tbl(rows: list[list[str]]) -> str:
    return "<w:tbl>" + "".join("<w:tr>" + "".join(f"<w:tc>{para(c)}</w:tc>" for c in r) + "</w:tr>" for r in rows) + "</w:tbl>"


SECT_A = '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1474" w:right="1134" w:bottom="1361" w:left="1361" w:header="737" w:footer="737" w:gutter="0"/></w:sectPr>'
SECT_COVER = '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="0" w:right="0" w:bottom="0" w:left="0" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr>'


@case
def dx_is_diagnosis_and_caps_folded() -> None:
    a = docx("dx_a.docx", para("LOG SENSOR SUHU") + para("Isi badan") + f"<w:p><w:pPr>{SECT_A}</w:pPr></w:p>")
    b = docx("dx_b.docx", para("Log sensor suhu", caps=True) + para("Isi badan") + f"<w:p><w:pPr>{SECT_A}</w:pPr></w:p>",
             '<w:font w:name="Plex"><w:embedRegular/></w:font>')
    rep = C.run("docx", "DX", a, b, [])
    assert rep["verdict"] == "DIAGNOSIS", rep["verdict"]
    assert check(rep, "textOrder")["pass"] is True, rep["metrics"]["textUnits"]
    assert check(rep, "runProps")["pass"] is True, rep["metrics"]["runProps"]
    assert all(not c["gate"] for c in rep["metrics"]["checks"])
    ef = check(rep, "embeddedFonts")
    assert ef["pass"] is False and ef["gate"] is False
    # gerbang dapat dipulihkan lewat ambang; fon tertanam tetap diagnosis (F-056)
    rep2 = C.run("docx", "DX", a, b, ["gate=true"])
    assert rep2["verdict"] == "PASS", [d for d in rep2["diffs"] if d.get("gate")]


@case
def dx_alignment_pairing_for_tables_and_sections() -> None:
    t1 = tbl([["a", "b"], ["1", "2"]])
    t2 = tbl([["x", "y", "z"]])
    cover = tbl([["SAMPUL"]])
    a = docx("al_a.docx", cover + f"<w:p><w:pPr>{SECT_COVER}</w:pPr></w:p>" + t1 + t2 + f"<w:p><w:pPr>{SECT_A}</w:pPr></w:p>")
    b = docx("al_b.docx", t1 + t2 + f"<w:p><w:pPr>{SECT_A}</w:pPr></w:p>")
    rep = C.run("docx", "DX", a, b, [])
    cells = rep["metrics"]["cellsPerTable"]
    assert cells["unpairedRef"] == 1 and cells["unpairedNode"] == 0 and cells["pairedDiffer"] == [], cells
    sects = rep["metrics"]["sectPrAlignment"]
    assert sects["unpairedRef"] == 1 and sects["unpairedNode"] == 0 and sects["pairedDiffer"] == [], sects


@case
def dx_no_reference_and_reference_artifacts_excluded() -> None:
    spec = {"chapters": [{"sections": [{"blocks": [{"type": "aside", "text": "Catatan samping tanpa padanan"}]}]}]}
    sp = w("nr_spec.json", json.dumps(spec))
    a = docx("nr_a.docx", para("Isi badan") + para("TABEL 1 URAIAN. memuat 2 kepala kolom") + para("PROVENANS ◇ PEMASOK"))
    b = docx("nr_b.docx", para("Isi badan") + para("Catatan samping tanpa padanan") + para("Tabel 1.1 Uraian"))
    ctx = ctx_file("nr_ctx.json", {"noReference": {"spec": sp, "blocks": [
        {"pointer": "/chapters/0/sections/0/blocks/0", "type": "aside", "status": "unsupported"}]}})
    rep = C.run("docx", "DX", a, b, [], ctx)
    ex = rep["metrics"]["textUnits"]["excluded"]
    assert ex["noReference"] == {"ref": 0, "node": 1}, ex
    assert ex["referenceArtifact"] == {"ref": 2, "node": 1}, ex
    assert rep["metrics"]["textUnits"]["referencedPct"] == 100.0, rep["metrics"]["textUnits"]


@case
def fixh_p1_source_label_and_appendix_caption_excluded_symmetrically() -> None:
    # SR46-P1: baris SUMBER bangkitan mesin (Node: di tabel; acuan: SUMBER figur / paragraf PROVENANS)
    # dan caption lampiran `TABEL A.1`/`GAMBAR B.2` = artefak acuan di KEDUA sisi. Kepala kolom isi "SUMBER"
    # yang berdiri sendiri tetap unit beracuan.
    a = docx("p1_a.docx", para("Isi badan") + para("SUMBER Data ilustratif. PROVENANS ◇ PEMASOK")
             + para("TABEL 1 KODE - SUMBER. memuat 2 kepala kolom") + para("SUMBER Gambar ilustratif.")
             + para("Lampiran isi") + para("SUMBER"))
    b = docx("p1_b.docx", para("Isi badan") + para("SUMBER Data ilustratif.") + para("TABEL A.1 Data mentah getaran.")
             + para("SUMBER: Gambar ilustratif. PROVENANS ■ TERUKUR") + para("GAMBAR B.2 Denah ruang.")
             + para("Lampiran isi") + para("Sumber", caps=True))
    rep = C.run("docx", "DX", a, b, [])
    tu = rep["metrics"]["textUnits"]
    assert tu["excluded"]["referenceArtifact"] == {"ref": 3, "node": 4}, tu["excluded"]
    assert tu["referencedRef"] == 3 and tu["referencedNode"] == 3 and tu["referencedPct"] == 100.0, tu
    # bukan label: kalimat isi berhuruf campuran, "SUMBER" tanpa teks, dan "Tabel A" tanpa nomor tetap dinilai
    b2 = docx("p1_b2.docx", para("Isi badan") + para("Sumber data berasal dari log.") + para("Tabel A menunjukkan tren.")
              + para("SUMBER Data ilustratif.") + para("Lampiran isi") + para("Sumber", caps=True))
    tu2 = C.run("docx", "DX", a, b2, [])["metrics"]["textUnits"]
    assert tu2["excluded"]["referenceArtifact"]["node"] == 1, tu2["excluded"]
    assert tu2["referencedNode"] == 5 and tu2["referencedPct"] < 100.0, tu2


@case
def fixf_c8_body_sentence_starting_with_table_ref_is_scored() -> None:
    # FIX-F C8 (D-313): kalimat isi berawalan rujukan ("Tabel 1.1 merangkum ...", "Gambar 2.1 menunjukkan ...")
    # BUKAN caption: tetap unit beracuan sehingga selisih isinya terukur textOrder. Caption sungguhan
    # (`TABEL 1 URAIAN.` acuan, `Tabel 1.1 Uraian` Node) tetap artefak acuan di kedua sisi.
    a = docx("c8_a.docx", para("Isi badan") + para("TABEL 1 URAIAN. memuat 2 kepala kolom")
             + para("Tabel 1.1 merangkum hasil uji getaran pompa.") + para("Gambar 2.1 menunjukkan denah ruang."))
    b = docx("c8_b.docx", para("Isi badan") + para("Tabel 1.1 Uraian")
             + para("Tabel 1.1 merangkum hasil uji suhu panel.") + para("Gambar 2.1 menunjukkan denah ruang."))
    rep = C.run("docx", "DX", a, b, [])
    tu = rep["metrics"]["textUnits"]
    assert tu["excluded"]["referenceArtifact"] == {"ref": 1, "node": 1}, tu["excluded"]
    assert tu["referencedRef"] == 3 and tu["referencedNode"] == 3, tu
    assert tu["referencedPct"] < 100.0 and check(rep, "textOrder")["pass"] is False, tu
    # kalimat isi identik di kedua sisi: tetap beracuan dan cocok penuh
    b2 = docx("c8_b2.docx", para("Isi badan") + para("Tabel 1.1 Uraian")
              + para("Tabel 1.1 merangkum hasil uji getaran pompa.") + para("Gambar 2.1 menunjukkan denah ruang."))
    tu2 = C.run("docx", "DX", a, b2, [])["metrics"]["textUnits"]
    assert tu2["referencedRef"] == 3 and tu2["referencedNode"] == 3 and tu2["referencedPct"] == 100.0, tu2


@case
def fixh_p2_diagnosis_carries_failed_check_count_and_level() -> None:
    # SR46-P2: kelas vonis tetap DIAGNOSIS; `failedChecks` membedakan bersih (0) dari banyak cek gagal.
    body = para("Isi badan") + para("Kalimat kedua") + f"<w:p><w:pPr>{SECT_A}</w:pPr></w:p>"
    a = docx("p2_a.docx", body)
    same = C.run("docx", "DX", a, docx("p2_same.docx", body), [])
    assert same["verdict"] == "DIAGNOSIS", same["verdict"]
    fc = same["failedChecks"]
    assert fc["failed"] == 0 and fc["level"] == "CLEAN" and fc["ids"] == [] and fc["total"] == len(same["metrics"]["checks"]), fc
    diff = C.run("docx", "DX", a, docx("p2_diff.docx", para("Isi lain") + body + para("Tambahan")), [])
    assert diff["verdict"] == "DIAGNOSIS", diff["verdict"]
    fd = diff["failedChecks"]
    failing = [c["id"] for c in diff["metrics"]["checks"] if not c["pass"]]
    assert fd["failed"] == len(failing) > 0 and fd["ids"] == failing and fd["level"] == "DIFF", (fd, failing)
    assert fd["failedGate"] == 0 and fd["failedDiagnosis"] == fd["failed"] and "textOrder" in fd["ids"], fd
    # kelas vonis lain tidak berubah: gerbang dipulihkan -> FAIL dengan cek gerbang terhitung
    g = C.run("docx", "DX", a, docx("p2_diff.docx", para("Isi lain") + body + para("Tambahan")), ["gate=true"])
    assert g["verdict"] == "FAIL" and g["failedChecks"]["failedGate"] > 0, g["failedChecks"]


@case
def fixh_d300_tickless_spines_are_frame_on_both_sides() -> None:
    # D-300: spine tanpa tick = bingkai/garis dasar di KEDUA sisi (acuan patch_* tanpa tick; Node data-spine).
    ref = w("d300_ref.svg", mpl('<g id="patch_2"><path d="M 20 45 L 30 45 L 30 20 L 20 20 z" style="fill: #101418"/></g>'))
    col = '<rect data-mark="column" data-series="A" data-index="0" x="20" y="20" width="10" height="25" fill="#101418"/>'
    spines = ('<g data-axis="y" data-spine="1"><line x1="10" y1="5" x2="10" y2="45" stroke="#6B7783"/></g>'
              '<g data-axis="x" data-spine="1"><line x1="10" y1="45" x2="90" y2="45" stroke="#6B7783"/></g>')
    node = w("d300_node.svg", svg(spines + col, 128, 50))
    rep = C.run("svg", "CB1", ref, node, [])
    axr, axn = rep["metrics"]["axes"]["ref"], rep["metrics"]["axes"]["node"]
    assert axr["count"] == 0 and axn["count"] == 0, (axr, axn)
    assert check(rep, "c.axisCount")["pass"] and check(rep, "c.axisOrientation")["pass"], rep["diffs"]
    assert rep["metrics"]["axes"]["zeroBaseline"]["node"] is True, rep["metrics"]["axes"]  # spine tetap garis dasar
    # sumbu bertick di satu sisi saja tetap selisih nyata (FAIL), ke dua arah
    ticked = ('<g data-axis="x"><line x1="10" y1="45" x2="90" y2="45" stroke="#6B7783"/>'
              '<text x="20" y="48" font-size="2.4">0</text><text x="60" y="48" font-size="2.4">10</text></g>')
    rep2 = C.run("svg", "CB1", ref, w("d300_node2.svg", svg(spines + ticked + col, 128, 50)), [])
    assert check(rep2, "c.axisCount")["pass"] is False and check(rep2, "c.axisCount")["gate"] is True, rep2["metrics"]["axes"]
    ref3 = w("d300_ref3.svg", mpl('<g id="patch_2"><path d="M 20 45 L 30 45 L 30 20 L 20 20 z" style="fill: #101418"/></g>'
                                  '<g id="matplotlib.axis_1"><g id="xtick_1"><text x="20" y="48" style="font-size: 6.8px">0</text></g></g>'))
    rep3 = C.run("svg", "CB1", ref3, node, [])
    assert check(rep3, "c.axisCount")["pass"] is False, rep3["metrics"]["axes"]
    # grup data-axis TANPA penanda spine tetap sumbu walau tanpa teks (label kategori di luar grup)
    plain = spines.replace(' data-spine="1"', "")
    rep4 = C.run("svg", "CB1", ref, w("d300_node4.svg", svg(plain + col, 128, 50)), [])
    assert rep4["metrics"]["axes"]["node"]["count"] == 2 and check(rep4, "c.axisCount")["pass"] is False, rep4["metrics"]["axes"]


L_BASE = 13.5 * 25.4 / 72.0  # 1 baseline mm


def _dg_flow(node_l: float, gap_l: float, ax: float = 20.0, swap: bool = False, flip: bool = False) -> str:
    # dua simpul flow bertumpuk + satu tepi; margin atas 2 L, bawah 3 L (lattice).
    # swap: arah tepi terbalik; flip: urutan vertikal simpul ditukar (b di atas a), tepi tetap a -> b.
    top, h = 2 * L_BASE, node_l * L_BASE
    yb = top + h + gap_l * L_BASE
    H = yb + h + 3 * L_BASE
    ya, yb2 = (yb, top) if flip else (top, yb)
    p0, p1 = (f"{ax + 30} {ya + h}", f"{ax + 30} {yb2}") if not flip else (f"{ax + 30} {ya}", f"{ax + 30} {yb2 + h}")
    if swap:
        p0, p1 = p1, p0
    body = (f'<defs><marker id="m"><path d="M0 0 L2 1 L0 2 z"/></marker></defs>'
            f'<rect data-node="a" x="{ax}" y="{ya}" width="60" height="{h}" fill="#FCFCFB" stroke="#2B3640"/>'
            f'<text x="{ax + 5}" y="{ya + 3}" font-size="2.4" fill="#101418">Sensor ruang</text>'
            f'<rect data-node="b" x="{ax}" y="{yb2}" width="60" height="{h}" fill="#FCFCFB" stroke="#2B3640"/>'
            f'<text x="{ax + 5}" y="{yb2 + 3}" font-size="2.4" fill="#101418">Panel kendali</text>'
            f'<path d="M {p0} L {p1}" fill="none" stroke="#101418" marker-end="url(#m)"/>')
    return svg(body, 166, round(H, 4))


DG_ENGINE = {"checks_run": ["P1-family", "DATUM-25", "DATUM-32"], "n_nodes": 2, "n_edges": 1, "n_hops": 0,
             "colour_values": ["#101418", "#2B3640"], "n_colour": 2, "apparatus": "figure", "family": "flow"}


@case
def fixh_d242_diagram_class_passes_rule_explained_height_and_fails_otherwise() -> None:
    # D-242/D-298: tinggi simpul 6 L -> 3 L (K-1) dan jarak 6 L -> 2 L = PASS walau byte Python berbeda;
    # byte/geometri Python tetap dilaporkan sebagai diagnosis.
    ref = w("d242_ref.svg", _dg_flow(6, 6))
    ctx = {"engineReport": {"ref": DG_ENGINE, "node": DG_ENGINE}, "nodeLint": [{"checkId": "DATUM-32", "status": "PASS"}]}
    cf = ctx_file("d242_ctx.json", ctx)
    rep = C.run("svg", "DG", ref, w("d242_node.svg", _dg_flow(3, 2)), [], cf)
    assert rep["verdict"] == "PASS", [d for d in rep["diffs"] if d.get("gate")]
    assert check(rep, "d.rootSize")["pass"] is False and check(rep, "d.rootSize")["gate"] is False
    assert all(check(rep, c)["pass"] for c in ("d242.structure", "d242.engine", "d242.datum", "d242.horizontal", "d242.vertical"))
    assert rep["metrics"]["d242"]["dHeightL"] == -10.0, rep["metrics"]["d242"]  # (6+6+6) L -> (3+2+3) L
    # byte Python dipulihkan lewat ambang -> FAIL
    assert C.run("svg", "DG", ref, w("d242_node.svg", _dg_flow(3, 2)), ["d242Class=false"], cf)["verdict"] == "FAIL"
    # tinggi simpul tidak menurut aturan famili (4 L, bukan 3 L) -> FAIL d242.vertical
    bad_h = C.run("svg", "DG", ref, w("d242_badh.svg", _dg_flow(4, 2)), [], cf)
    assert bad_h["verdict"] == "FAIL" and check(bad_h, "d242.vertical")["pass"] is False, bad_h["diffs"]
    # geser horizontal -> FAIL d242.horizontal
    bad_x = C.run("svg", "DG", ref, w("d242_badx.svg", _dg_flow(3, 2, ax=25.0)), [], cf)
    assert check(bad_x, "d242.horizontal")["pass"] is False and bad_x["verdict"] == "FAIL"
    # arah tepi terbalik -> FAIL d242.structure
    bad_e = C.run("svg", "DG", ref, w("d242_bade.svg", _dg_flow(3, 2, swap=True)), [], cf)
    assert check(bad_e, "d242.structure")["pass"] is False and bad_e["verdict"] == "FAIL"
    # urutan vertikal simpul ditukar (tepi tetap a -> b) -> baris tidak terjaga -> FAIL d242.vertical
    bad_r = C.run("svg", "DG", ref, w("d242_badr.svg", _dg_flow(3, 2, flip=True)), [], cf)
    assert check(bad_r, "d242.structure")["pass"] is True, bad_r["diffs"]
    assert check(bad_r, "d242.vertical")["pass"] is False and bad_r["verdict"] == "FAIL", bad_r["diffs"]
    # lint artefak Node FAIL (pra-ada, mis. DATUM-32 dg_rack) -> FAIL d242.datum
    cf2 = ctx_file("d242_ctx2.json", {**ctx, "nodeLint": [{"checkId": "DATUM-32", "status": "FAIL"}]})
    bad_l = C.run("svg", "DG", ref, w("d242_node.svg", _dg_flow(3, 2)), [], cf2)
    assert check(bad_l, "d242.datum")["pass"] is False and bad_l["verdict"] == "FAIL", bad_l["diffs"]
    # famili tanpa aturan -> tidak terjelaskan -> FAIL
    eng3 = {**DG_ENGINE, "family": "baru"}
    cf3 = ctx_file("d242_ctx3.json", {**ctx, "engineReport": {"ref": eng3, "node": eng3}})
    assert check(C.run("svg", "DG", ref, w("d242_node.svg", _dg_flow(3, 2)), [], cf3), "d242.vertical")["pass"] is False


@case
def fixh_d242_png_raster_integrity_gate_and_python_raster_diagnosis() -> None:
    import numpy as np
    from PIL import Image

    def png(name: str, h: int, w_: int) -> str:
        p = TMP / name
        a = np.full((h, w_), 255, np.uint8)
        a[10:20, 10:40] = 0
        Image.fromarray(a).save(p, dpi=(300, 300))
        return str(p)

    node_svg = w("d242p_node.svg", _dg_flow(3, 2))
    hh, ww = int(round(61.9125 / 25.4 * 300)), int(round(166 / 25.4 * 300))
    ref_png, node_png = png("d242p_ref.png", int(round(109.5375 / 25.4 * 300)), ww), png("d242p_node.png", hh, ww)
    cf = ctx_file("d242p_ctx.json", {"d242": {"nodeSvg": node_svg}})
    rep = C.run("png", "DG", ref_png, node_png, [], cf)
    assert rep["verdict"] == "PASS" and check(rep, "ssim")["gate"] is False, rep["diffs"]
    bad = C.run("png", "DG", ref_png, png("d242p_bad.png", hh - 40, ww), [], cf)
    assert bad["verdict"] == "FAIL" and check(bad, "d242.rasterSize")["pass"] is False
    assert C.run("png", "DG", ref_png, node_png, [])["verdict"] == "FAIL"  # tanpa konteks: gerbang SSIM lama


def _ca_px_svg(font_px: float, bar_x: float = 20.0) -> str:
    # acuan datumchart: root px, font-size dalam px (F-007); Node: angka font-size x4/3 = pt fisik yang sama
    rows = "".join(
        f'<rect x="{bar_x}" y="{10 + 18 * i}" width="{60 + 25 * i}" height="10" fill="#B45309"/>'
        f'<text x="160" y="{18 + 18 * i}" font-family="IBM Plex Mono" font-size="{font_px:g}" fill="#3F4A54">'
        f'Kategori panjang nomor {i + 1} = {40 + i}</text>' for i in range(5))
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100" viewBox="0 0 300 100">'
            f'<rect width="300" height="100" fill="#FCFCFB"/>{rows}</svg>')


@case
def fixh_r5_ca_png_px_pt_is_diagnosis_other_differences_fail() -> None:
    # F-007/D-296: PNG CA gagal hanya karena font-size px acuan -> DIAGNOSIS beralasan; selisih lain tetap FAIL.
    # masukan PNG dibuat dengan perasteran acuan yang sama (reference/fig/raster.py, Chromium 300 dpi)
    ref_svg, node_svg = w("r5_ref.svg", _ca_px_svg(6.6)), w("r5_node.svg", _ca_px_svg(8.8))
    moved_svg = w("r5_moved.svg", _ca_px_svg(8.8, bar_x=45.0))
    fig_dir = HERE.parent / "reference" / "fig"
    sys.path.insert(0, str(fig_dir))
    import raster
    pngs = {k: str(TMP / f"r5_{k}.png") for k in ("ref", "node", "moved")}
    raster.svgs_to_png([(Path(ref_svg).read_text(encoding="utf-8"), pngs["ref"]),
                        (Path(node_svg).read_text(encoding="utf-8"), pngs["node"]),
                        (Path(moved_svg).read_text(encoding="utf-8"), pngs["moved"])])
    assert C.run("svg", "CA", ref_svg, node_svg, [])["verdict"] == "PASS", "SVG CA pasangan px/pt harus lulus"
    plain = C.run("png", "CA", pngs["ref"], pngs["node"], [])
    assert plain["verdict"] == "FAIL", plain["metrics"]  # tanpa bukti F-007: gerbang CA tetap
    ctx = ctx_file("r5_ctx.json", {"f007": {"refSvg": ref_svg, "nodeSvg": node_svg}})
    rep = C.run("png", "CA", pngs["ref"], pngs["node"], [], ctx)
    ev = rep["metrics"].get("f007", {})
    assert rep["verdict"] == "DIAGNOSIS" and rep["metrics"].get("verdictReason") == "F-007 px/pt acuan", (rep["verdict"], ev)
    assert ev["applies"] and ev["svgCaPass"] and ev["refRootPx"] and ev["normalizedSsim"] >= 0.995, ev
    off = C.run("png", "CA", pngs["ref"], pngs["node"], ["f007PxPtNormalize=false"], ctx)
    assert off["verdict"] == "FAIL", off["verdict"]
    # SVG CA gagal (batang bergeser) -> FAIL tetap, walau skala teks juga berbeda
    ctx2 = ctx_file("r5_ctx2.json", {"f007": {"refSvg": ref_svg, "nodeSvg": moved_svg}})
    rep2 = C.run("png", "CA", pngs["ref"], pngs["moved"], [], ctx2)
    assert rep2["verdict"] == "FAIL" and rep2["metrics"]["f007"]["svgCaPass"] is False, rep2["metrics"].get("f007")
    # SVG lulus tetapi PNG berbeda di luar teks -> acuan ternormalkan tetap di bawah ambang -> FAIL
    rep3 = C.run("png", "CA", pngs["ref"], pngs["moved"], [], ctx)
    ev3 = rep3["metrics"]["f007"]
    assert rep3["verdict"] == "FAIL" and ev3["svgCaPass"] and not ev3["applies"], ev3


@case
def pd_embedded_fonts_threshold_is_diagnosis() -> None:
    import thresholds as TH
    th = TH.get("pdf", "PD")
    assert th.get("embeddedFontsGate") is False, th


@case
def f056_pd_embedded_fonts_mismatch_is_diagnosis() -> None:
    # F-056/R02: acuan tanpa fon tertanam (Type1 base-14) lawan Node bertanam fon -> diagnosis, bukan gerbang.
    import pymupdf

    def pdf(name: str, embed: bool) -> str:
        p = TMP / name
        doc = pymupdf.open()
        page = doc.new_page(width=200, height=100)
        if embed:
            page.insert_font(fontname="EmbHelv", fontbuffer=pymupdf.Font("helv").buffer)
            page.insert_text((20, 50), "Halo paritas", fontname="EmbHelv", fontsize=11)
        else:
            page.insert_text((20, 50), "Halo paritas", fontname="helv", fontsize=11)
        doc.save(str(p))
        doc.close()
        return str(p)

    a, b = pdf("f056_ref.pdf", False), pdf("f056_node.pdf", True)
    rep = C.run("pdf", "PD", a, b, [])
    ef = check(rep, "embeddedFonts")
    assert ef["pass"] is False and ef["gate"] is False, ef
    assert rep["metrics"]["embeddedFonts"]["ref"] == [] and rep["metrics"]["embeddedFonts"]["node"], rep["metrics"]["embeddedFonts"]
    assert "embeddedFonts" not in [d["check"] for d in rep["diffs"] if d.get("gate")]
    # pemulihan gerbang eksplisit lewat ambang tetap mungkin (D-299: PD bergerbang hanya dengan gate=true)
    rep2 = C.run("pdf", "PD", a, b, ["gate=true", "embeddedFontsGate=true"])
    assert "embeddedFonts" in [d["check"] for d in rep2["diffs"] if d.get("gate")] and rep2["verdict"] == "FAIL"


@case
def fixh_d299_pd_vs_garis_a_is_diagnosis_same_engine_control_gates() -> None:
    # D-299 PD-1: PD lawan acuan Garis A = DIAGNOSIS beralasan; kontrol mesin-sama (gate=true) wajib PASS.
    import pymupdf

    def pdf(name: str, pages: list[str]) -> str:
        p = TMP / name
        doc = pymupdf.open()
        for t in pages:
            doc.new_page(width=200, height=100).insert_text((20, 50), t, fontname="helv", fontsize=11)
        doc.save(str(p))
        doc.close()
        return str(p)

    ref = pdf("d299_ref.pdf", ["Isi bab satu"])
    node = pdf("d299_node.pdf", ["LEMBAR KENDALI", "DAFTAR ISI", "Isi bab satu"])
    rep = C.run("pdf", "PD", ref, node, [])
    assert rep["verdict"] == "DIAGNOSIS" and "D-299" in rep["metrics"].get("verdictReason", ""), rep["verdict"]
    assert check(rep, "pageCount")["pass"] is False and check(rep, "pageCount")["gate"] is False
    # kontrol mesin-sama: PDF yang sama dari dua jalur -> PASS dengan gerbang; selisih nyata -> FAIL
    same = pdf("d299_same.pdf", ["LEMBAR KENDALI", "DAFTAR ISI", "Isi bab satu"])
    ctl = C.run("pdf", "PD", same, node, ["gate=true"])
    assert ctl["verdict"] == "PASS" and "verdictReason" not in ctl["metrics"], [d for d in ctl["diffs"] if d.get("gate")]
    assert C.run("pdf", "PD", ref, node, ["gate=true"])["verdict"] == "FAIL"


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
    except (AttributeError, ValueError):
        pass
    for c in CASES:
        c()
    for name, ok, msg in RESULTS:
        print(f"{'PASS' if ok else 'FAIL'} {name}{'' if ok else ' :: ' + msg}")
    bad = sum(1 for _, ok, _ in RESULTS if not ok)
    print(f"selftest_compare: {len(RESULTS) - bad}/{len(RESULTS)} lulus")
    if not bad:
        import shutil
        shutil.rmtree(TMP, ignore_errors=True)
    else:
        print(f"masukan kasus disimpan di {TMP}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
