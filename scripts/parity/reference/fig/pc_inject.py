# -*- coding: utf-8 -*-
"""Peta kode chart -> fungsi pustakachart + penyuntik data (S65).

Sumber peta: research/06_chart_map_parity_matrix.md tabel 5.1 dan 6.3.
Fungsi pustakachart tidak menerima argumen data; datanya dibaca dari
atribut modul `pustakachart_data` (diimpor sebagai `D`) saat dipanggil.
Penyuntik di sini menerjemahkan `StudioChartV1.data` (masterplan/01_specs.md
3.5) menjadi nilai atribut `D` yang ditimpa sementara oleh adapter.

Tiga pola (research/06 6.3):
- "pcd"     : timpa atribut D lalu panggil fungsi galeri;
- "param"   : panggil helper ber-parameter langsung (K-01, K-02 -> _stack_rows);
- "literal" : data tertulis di dalam fungsi (P-07, W-03); tidak disuntik,
              data literal acuan dilaporkan agar fixture S63 memakainya.

Modul ini murni (tanpa impor skill); numpy dipakai karena fungsi galeri
memanggil metode ndarray pada beberapa atribut (mis. MTBF[i].min()).
"""
import numpy as np


class InjectError(ValueError):
    """Data spec tidak cocok dengan bentuk yang dibaca fungsi acuan."""

    def __init__(self, code, message):
        super().__init__(message)
        self.code = code


# ----------------------------------------------------------------- pembaca
def _shape(spec, *allowed):
    data = spec.get("data")
    if not isinstance(data, dict):
        raise InjectError("CHART_DATA_MISSING", "spec.data wajib untuk kode %s" % spec.get("kind"))
    sh = data.get("shape")
    if sh not in allowed:
        raise InjectError("CHART_DATA_SHAPE",
                          "kode %s: bentuk data '%s', acuan membaca %s"
                          % (spec.get("kind"), sh, " | ".join(allowed)))
    return data


def _num(v):
    return np.nan if v is None else float(v)


def _labels_values(spec):
    """categorical -> (label[], value[]); series satu seri -> (categories, values)."""
    data = _shape(spec, "categorical", "series")
    if data["shape"] == "categorical":
        pts = data.get("points") or []
        if not pts:
            raise InjectError("CHART_DATA_EMPTY", "points kosong")
        return [str(p["label"]) for p in pts], [_num(p["value"]) for p in pts]
    ser = data.get("series") or []
    if not ser:
        raise InjectError("CHART_DATA_EMPTY", "series kosong")
    return [str(c) for c in data.get("categories") or []], [_num(v) for v in ser[0]["values"]]


def _series(spec, need, exact=False):
    data = _shape(spec, "series")
    ser = data.get("series") or []
    if len(ser) < need or (exact and len(ser) != need):
        raise InjectError("CHART_DATA_COUNT",
                          "kode %s: acuan membaca %s%d seri, spec memberi %d"
                          % (spec.get("kind"), "" if exact else ">= ", need, len(ser)))
    cats = [str(c) for c in data.get("categories") or []]
    return cats, ser


def _groups(spec, need=1, exact=False):
    data = _shape(spec, "distribution")
    groups = data.get("groups") or []
    if len(groups) < need or (exact and len(groups) != need):
        raise InjectError("CHART_DATA_COUNT",
                          "kode %s: acuan membaca %s%d grup, spec memberi %d"
                          % (spec.get("kind"), "" if exact else ">= ", need, len(groups)))
    return [str(g["name"]) for g in groups], [np.asarray(g["values"], dtype=float) for g in groups]


def _xy(spec):
    data = _shape(spec, "xy")
    pts = data.get("points") or []
    if not pts:
        raise InjectError("CHART_DATA_EMPTY", "points kosong")
    xs = np.asarray([float(p["x"]) for p in pts])
    ys = np.asarray([float(p["y"]) for p in pts])
    annot = {i: str(p["label"]) for i, p in enumerate(pts) if p.get("label")}
    return pts, xs, ys, annot


def _matrix(spec):
    data = _shape(spec, "matrix")
    vals = np.asarray(data.get("values") or [], dtype=float)
    rows = [str(r) for r in data.get("rows") or []]
    cols = [str(c) for c in data.get("cols") or []]
    if vals.ndim != 2 or vals.shape != (len(rows), len(cols)):
        raise InjectError("CHART_DATA_SHAPE", "matrix.values %s tidak cocok rows x cols (%d x %d)"
                          % (list(vals.shape), len(rows), len(cols)))
    return rows, cols, vals


def _params(spec):
    p = spec.get("params")
    return p if isinstance(p, dict) else {}


# ------------------------------------------------------------- penyuntik
def inj_grouped(spec):            # P-03 v04_grouped_column
    cats, ser = _series(spec, 2)
    w = ["series > 2 diabaikan acuan (dua seri tetap)"] if len(ser) > 2 else []
    return {"PERANGKAT": cats, "HARGA": [_num(v) for v in ser[0]["values"]],
            "HARGA_B": [_num(v) for v in ser[1]["values"]]}, w


def inj_ranked(spec):             # P-04 v05_lollipop
    labels, values = _labels_values(spec)
    return {"PERANGKAT": labels, "HARGA": values}, []


def _inj_mtbf(need, exact=False):
    def inj(spec):                # P-05, S-02, S-04, S-05, S-06
        names, groups = _groups(spec, need, exact=exact)
        w = []
        if len(groups) > 3:
            w.append("grup > 3: sebagian acuan memakai posisi/warna tetap untuk 3 grup")
        return {"SITE": names, "MTBF": groups}, w
    return inj


def inj_audit(spec):              # P-06 v07_dumbbell, P-08 v11_slope
    cats, ser = _series(spec, 2)
    w = ["series > 2 diabaikan acuan (H1/H2 tetap)"] if len(ser) > 2 else []
    return {"AUDIT_OBJEK": cats, "AUDIT_H1": [_num(v) for v in ser[0]["values"]],
            "AUDIT_H2": [_num(v) for v in ser[1]["values"]]}, w


def inj_bullet(spec):             # P-09 v95_bullet
    labels, values = _labels_values(spec)
    p = _params(spec)
    target = p.get("target", spec.get("limit"))
    if target is None:
        raise InjectError("CHART_DATA_MISSING", "P-09 acuan butuh target: params.target atau limit")
    w = ["acuan menggambar satu baris; point > 1 diabaikan"] if len(values) > 1 else []
    return {"BULLET": {"label": labels[0], "value": float(values[0]), "target": float(target),
                       "max": float(p.get("max", 100.0))}}, w


def inj_waterfall(spec):          # P-10 v91_waterfall
    labels, values = _labels_values(spec)
    return {"WATERFALL": list(zip(labels, values))}, []


def inj_small_multiples(spec):    # P-12 v13_small_multiples
    _cats, ser = _series(spec, 1)
    if len(ser) > 6:
        raise InjectError("CHART_DATA_COUNT", "P-12 acuan berkisi tetap 2x3: maks 6 panel")
    return {"SM_MULT": {str(s["name"]): np.asarray([_num(v) for v in s["values"]]) for s in ser}}, []


def inj_scatter(spec):            # P-13, H-01, H-05
    _pts, xs, ys, annot = _xy(spec)
    return {"SCAT_X": xs, "SCAT_Y": ys, "SCAT_ANNOT": annot}, []


def inj_bubble(spec):             # H-02 v67_bubble
    pts, xs, ys, annot = _xy(spec)
    size = np.asarray([float(p.get("size", 1.0)) for p in pts])
    return {"SCAT_X": xs, "SCAT_Y": ys, "SCAT_SIZE": size, "SCAT_ANNOT": annot}, []


def inj_table(spec):              # P-15 v15_table
    p = _params(spec)
    if isinstance(p.get("tableRows"), list) and isinstance(p.get("tableHead"), list):
        return {"TABLE_ROWS": [list(r) for r in p["tableRows"]],
                "TABLE_HEAD": [str(h) for h in p["tableHead"]]}, ["data dari params.tableRows/tableHead"]
    rows, cols, vals = _matrix(spec)
    head = [str(p.get("rowHeader", ""))] + cols
    return {"TABLE_ROWS": [[r] + [float(v) for v in vals[i]] for i, r in enumerate(rows)],
            "TABLE_HEAD": head}, ["matrix tanpa sel teks: aturan warna kolom 3 acuan membaca angka"]


def inj_heatmap(spec):            # H-03 v73_heatmap
    rows, cols, vals = _matrix(spec)
    if vals.shape != (6, 8):
        raise InjectError("CHART_DATA_COUNT", "H-03 acuan beriterasi tetap 6x8, spec %s" % list(vals.shape))
    return {"SKOR_M": vals, "FAKTOR": cols, "NAMA_SITE6": rows}, []


def inj_conn_scatter(spec):       # H-04 v68_conn_scatter
    _pts, xs, ys, _annot = _xy(spec)
    return {"CS_X": xs, "CS_Y": ys}, ["anotasi 08:00/23:00 LITERAL acuan"]


def inj_contour(spec):            # H-06 v71_contour: medan_sinyal diganti resampel matriks
    _rows, _cols, vals = _matrix(spec)

    def medan(X, Y):
        if vals.shape == X.shape:
            return vals.copy()
        ny, nx = X.shape
        src_y = np.linspace(0.0, 1.0, vals.shape[0])
        src_x = np.linspace(0.0, 1.0, vals.shape[1])
        tx = np.linspace(0.0, 1.0, nx)
        ty = np.linspace(0.0, 1.0, ny)
        tmp = np.vstack([np.interp(tx, src_x, row) for row in vals])           # (r, nx)
        return np.vstack([np.interp(ty, src_y, tmp[:, j]) for j in range(nx)]).T  # (ny, nx)
    return {"medan_sinyal": medan}, ["matriks diresampel bilinear ke grid LITERAL 40x60 acuan"]


def inj_network(spec):            # H-07 v79_network
    data = _shape(spec, "graph")
    nodes = data.get("nodes") or []
    links = data.get("links") or []
    if not nodes:
        raise InjectError("CHART_DATA_EMPTY", "graph.nodes kosong")
    p = _params(spec)
    name = {n["id"]: str(n["label"]) for n in nodes}
    pos = p.get("positions") if isinstance(p.get("positions"), dict) else None
    w = []
    if pos is None:
        # tata letak bertingkat BFS dari simpul pertama (acuan memakai posisi LITERAL)
        adj = {}
        for lk in links:
            adj.setdefault(lk["from"], []).append(lk["to"])
            adj.setdefault(lk["to"], []).append(lk["from"])
        level = {nodes[0]["id"]: 0}
        queue = [nodes[0]["id"]]
        while queue:
            cur = queue.pop(0)
            for nb in adj.get(cur, []):
                if nb not in level:
                    level[nb] = level[cur] + 1
                    queue.append(nb)
        depth = max(level.values()) if level else 0
        for n in nodes:
            level.setdefault(n["id"], depth + 1)
        depth = max(level.values())
        tiers = {}
        for n in nodes:
            tiers.setdefault(level[n["id"]], []).append(n["id"])
        pos = {}
        for lv, ids in tiers.items():
            y = 0.78 - (0.56 * lv / depth if depth else 0.0)
            for k, nid in enumerate(ids):
                pos[nid] = [(k + 1) / (len(ids) + 1), y]
        w.append("posisi simpul dihitung BFS bertingkat (acuan: posisi LITERAL PCD:NET_NODES)")
    net_nodes = {name[nid]: (float(pos[nid][0]), float(pos[nid][1])) for nid in name}
    edges = [(name[lk["from"]], name[lk["to"]]) for lk in links]
    hot = p.get("accentLink")
    if isinstance(hot, list) and len(hot) == 2:
        utama = (name.get(hot[0], hot[0]), name.get(hot[1], hot[1]))
    elif any(lk.get("value") is not None for lk in links):
        best = max(links, key=lambda lk: lk.get("value") or float("-inf"))
        utama = (name[best["from"]], name[best["to"]])
    else:
        utama = (None, None)
    return {"NET_NODES": net_nodes, "NET_EDGES": edges, "NET_LINK_UTAMA": utama}, w


def inj_diverging(spec):          # K-03 v21_diverging_bar
    cats, ser = _series(spec, 2)
    return {"SURVEI_ASP": cats, "SETUJU": [_num(v) for v in ser[0]["values"]],
            "TIDAK_SETUJU": [_num(v) for v in ser[1]["values"]]}, []


def inj_pyramid(spec):            # K-04 v23_pyramid
    cats, ser = _series(spec, 2)
    return {"JENJANG": cats, "FRONT_END": [_num(v) for v in ser[0]["values"]],
            "BACK_END": [_num(v) for v in ser[1]["values"]]}, []


def inj_waffle(spec):             # K-07 v24_waffle
    labels, values = _labels_values(spec)
    w = ["bagian > 3: acuan hanya mewarnai 3 bagian pertama"] if len(values) > 3 else []
    return {"WAFFLE_PARTS": [(l, int(round(v))) for l, v in zip(labels, values)]}, w


def inj_icons(spec):              # K-08 v26_icon_circles
    labels, values = _labels_values(spec)
    return {"KAMERA_SITE": [(l, int(round(v))) for l, v in zip(labels, values)]}, []


def inj_treemap(spec):            # K-09 v32_treemap: grup = point.sub
    data = _shape(spec, "categorical")
    groups = {}
    order = []
    for p in data.get("points") or []:
        g = str(p.get("sub") or "Grup lain")
        if g not in groups:
            groups[g] = []
            order.append(g)
        groups[g].append((str(p["label"]), float(p["value"])))
    if not order:
        raise InjectError("CHART_DATA_EMPTY", "points kosong")
    return {"TREEMAP": [(g, groups[g]) for g in order]}, ["grup treemap dibaca dari points[].sub"]


def inj_funnel(spec):             # K-10 v37_funnel
    labels, values = _labels_values(spec)
    return {"FUNNEL": [(l, int(round(v))) for l, v in zip(labels, values)]}, []


def inj_marimekko(spec):          # K-12 v31_marimekko: kategori = kolom, seri = bagian
    cats, ser = _series(spec, 1)
    widths = _params(spec).get("widths")
    w = []
    if not (isinstance(widths, list) and len(widths) == len(cats)):
        widths = [100.0 / len(cats)] * len(cats) if cats else []
        w.append("params.widths tidak ada: lebar kolom dibagi rata")
    mm = {}
    for ci, c in enumerate(cats):
        mm[c] = (float(widths[ci]), [(str(s["name"]), _num(s["values"][ci])) for s in ser])
    return {"MARIMEKKO": mm}, w


def _need12(name, arr):
    if len(arr) != 12:
        raise InjectError("CHART_DATA_COUNT", "%s: acuan memakai sumbu x LITERAL 1..12, spec %d nilai"
                          % (name, len(arr)))
    return arr


def inj_line(spec):               # W-01 v41_line
    _cats, ser = _series(spec, 2)
    a = _need12("W-01", np.asarray([_num(v) for v in ser[0]["values"]]))
    b = _need12("W-01", np.asarray([_num(v) for v in ser[1]["values"]]))
    return {"BITRATE_A": a, "BITRATE_B": b}, ["label ujung 'Site A'/'Site B' LITERAL acuan"]


def inj_area(spec):               # W-04 v42_area
    labels, values = _labels_values(spec)
    return {"BULAN": labels, "BEBAN_KW": np.asarray(values)}, []


def inj_stacked_area(spec):       # W-05 v43_stacked_area
    _cats, ser = _series(spec, 3)
    arrs = [_need12("W-05", np.asarray([_num(v) for v in s["values"]])) for s in ser[:3]]
    w = ["series > 3 diabaikan acuan (tiga lapis tetap)"] if len(ser) > 3 else []
    return {"BITRATE_A": arrs[0], "BITRATE_B": arrs[1], "BITRATE_C": arrs[2]}, w


def inj_bump(spec):               # W-06 v45_bump
    cats, ser = _series(spec, 1)
    if len(cats) != 4:
        raise InjectError("CHART_DATA_COUNT", "W-06 acuan memakai 4 periode tetap, spec %d" % len(cats))
    return {"BUMP_KV": cats, "BUMP_SERI": {str(s["name"]): [_num(v) for v in s["values"]] for s in ser}}, []


def inj_gantt(spec):              # W-07 v94_gantt
    data = _shape(spec, "intervals")
    tasks, ms = [], None
    for it in data.get("items") or []:
        try:
            st, en = float(it["start"]), float(it["end"])
        except (TypeError, ValueError):
            raise InjectError("CHART_DATA_SHAPE", "W-07 acuan butuh start/end numerik (minggu)")
        if it.get("milestone"):
            ms = ms or (st, str(it["label"]))
        else:
            tasks.append((str(it["label"]), st, en - st))
    if ms is None:
        raise InjectError("CHART_DATA_MISSING", "W-07 acuan menggambar tepat satu milestone; tidak ada item milestone")
    return {"GANTT": tasks, "GANTT_MILESTONE": ms}, []


def _inj_dist1(attr):
    def inj(spec):                # W-08 PING_MS, S-01/S-03 LATENSI
        _names, groups = _groups(spec, 1)
        w = ["grup > 1 diabaikan acuan (satu deret)"] if len(groups) > 1 else []
        return {attr: groups[0]}, w
    return inj


def inj_tilemap(spec):            # G-01 v84_tilemap
    data = _shape(spec, "tiles")
    tiles = data.get("tiles") or []
    if not tiles:
        raise InjectError("CHART_DATA_EMPTY", "tiles kosong")
    rows = max(int(t["row"]) for t in tiles) + 1
    cols = max(int(t["col"]) for t in tiles) + 1
    score = np.zeros((rows, cols))
    labels = {}
    for t in tiles:
        score[int(t["row"]), int(t["col"])] = float(t.get("value") or 0.0)
        if t.get("label"):
            labels[(int(t["row"]), int(t["col"]))] = str(t["label"])
    w = []
    if len(tiles) < rows * cols:
        w.append("%d petak kosong diisi 0 (acuan menggambar kisi penuh)" % (rows * cols - len(tiles)))
    return {"TILE_ROWS": rows, "TILE_COLS": cols, "TILE_SCORE": np.round(score, 0), "TILE_LABEL": labels}, w


def inj_flow(spec):               # G-04 v81_flow (galeri; paritas utama lewat diagram flow)
    data = _shape(spec, "steps")
    d = data.get("spec") or {}
    nodes = d.get("nodes") or []
    if not nodes or len(nodes) > 6:
        raise InjectError("CHART_DATA_COUNT", "G-04 acuan galeri memakai 6 posisi LITERAL: 1..6 langkah, spec %d"
                          % len(nodes))
    idx = {n["id"]: i for i, n in enumerate(nodes)}
    steps = [("dia" if n.get("shape") == "diamond" else "box", str(n["label"])) for n in nodes]
    edges = []
    for e in d.get("edges") or []:
        t = (idx[e["from"]], idx[e["to"]])
        edges.append(t + ((str(e["label"]),) if e.get("label") else ()))
    return {"FLOW": {"steps": steps, "edges": edges}}, ["posisi langkah LITERAL acuan (PC:1125-1126)"]


# ---------------------------------------------------------- data literal
def literal_p07(seed):
    """P-07 v09_range: grup literal + RNG SEED+9 (PC:282-287), direplikasi untuk fixture S63."""
    rng = np.random.default_rng(seed + 9)
    groups = [("Panel L1", 42, 58), ("Panel L2", 28, 41), ("Panel L3", 12, 24)]
    return {"shape": "distribution",
            "groups": [{"name": nm, "values": [float(v) for v in rng.uniform(lo, hi, 24)]}
                       for nm, lo, hi in groups]}


def literal_w03(bulan):
    """W-03 v48_step: tarif LITERAL (PC:771) + PCD:BULAN."""
    tariff = [1444, 1444, 1544, 1544, 1650, 1650, 1650, 1755, 1755, 1848, 1848, 1932]
    return {"shape": "series", "categories": list(bulan),
            "series": [{"name": "Tarif tenaga listrik", "values": [float(v) for v in tariff]}]}


# ----------------------------------------------------------------- peta
# kode -> (fungsi PC, pola, penyuntik, bentuk PARSIAL?)
PC_MAP = {
    "P-03": ("v04_grouped_column", "pcd", inj_grouped, False),
    "P-04": ("v05_lollipop", "pcd", inj_ranked, False),
    "P-05": ("v06_dotplot", "pcd", _inj_mtbf(3), True),
    "P-06": ("v07_dumbbell", "pcd", inj_audit, False),
    "P-07": ("v09_range", "literal", None, False),
    "P-08": ("v11_slope", "pcd", inj_audit, False),
    "P-09": ("v95_bullet", "pcd", inj_bullet, True),
    "P-10": ("v91_waterfall", "pcd", inj_waterfall, False),
    "P-12": ("v13_small_multiples", "pcd", inj_small_multiples, False),
    "P-13": ("v72_quadrant", "pcd", inj_scatter, False),
    "P-15": ("v15_table", "pcd", inj_table, False),
    "H-01": ("v66_scatter", "pcd", inj_scatter, False),
    "H-02": ("v67_bubble", "pcd", inj_bubble, False),
    "H-03": ("v73_heatmap", "pcd", inj_heatmap, True),
    "H-04": ("v68_conn_scatter", "pcd", inj_conn_scatter, False),
    "H-05": ("v70_hexbin", "pcd", inj_scatter, False),
    "H-06": ("v71_contour", "pcd", inj_contour, False),
    "H-07": ("v79_network", "pcd", inj_network, False),
    "K-01": ("_stack_rows", "param", None, False),
    "K-02": ("_stack_rows", "param", None, False),
    "K-03": ("v21_diverging_bar", "pcd", inj_diverging, False),
    "K-04": ("v23_pyramid", "pcd", inj_pyramid, False),
    "K-07": ("v24_waffle", "pcd", inj_waffle, False),
    "K-08": ("v26_icon_circles", "pcd", inj_icons, True),
    "K-09": ("v32_treemap", "pcd", inj_treemap, False),
    "K-10": ("v37_funnel", "pcd", inj_funnel, False),
    "K-12": ("v31_marimekko", "pcd", inj_marimekko, False),
    "W-01": ("v41_line", "pcd", inj_line, False),
    "W-03": ("v48_step", "literal", None, False),
    "W-04": ("v42_area", "pcd", inj_area, False),
    "W-05": ("v43_stacked_area", "pcd", inj_stacked_area, False),
    "W-06": ("v45_bump", "pcd", inj_bump, False),
    "W-07": ("v94_gantt", "pcd", inj_gantt, False),
    "W-08": ("v60_barcode", "pcd", _inj_dist1("PING_MS"), True),
    "S-01": ("v52_hist", "pcd", _inj_dist1("LATENSI"), True),
    "S-02": ("v54_box", "pcd", _inj_mtbf(1), False),
    "S-03": ("v53_density", "pcd", _inj_dist1("LATENSI"), False),
    "S-04": ("v55_violin", "pcd", _inj_mtbf(3, exact=True), False),
    "S-05": ("v59_ridge", "pcd", _inj_mtbf(1), False),
    "S-06": ("v57_jitter", "pcd", _inj_mtbf(1), False),
    "G-01": ("v84_tilemap", "pcd", inj_tilemap, True),
    "G-04": ("v81_flow", "pcd", inj_flow, True),
}

# datumchart Rev L (Garis B): kode -> keluarga
DC_MAP = {"P-01": "bar", "P-02": "column", "W-02": "column", "P-11": "threshold"}

# research/06 tabel 5.1: 12 kode tanpa acuan Python (lint saja, kelas CC)
NO_REFERENCE = ("P-14", "H-08", "H-09", "K-05", "K-06", "K-11",
                "W-09", "W-10", "S-07", "S-08", "G-02", "G-03")
