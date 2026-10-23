# -*- coding: utf-8 -*-
"""S94 transkripsi data galeri Gambar 8.1-8.5 dari panel PNG Manual 000 (F-005, D-14).

Data TIDAK diambil dari pustakachart_data.py (datanya berbeda, research/06 F-S02-01).
Tiga asal nilai, dicatat per panel di `params.transcription`:
  - "label"  : angka tercetak di panel, dibaca langsung (TERUKUR dari gambar).
  - "pixel"  : diukur dari posisi piksel terhadap sumbu bertanda (DITURUNKAN, presisi ~1 % rentang sumbu).
  - "sintetis": panel tanpa angka per kasus (distribusi, hexbin, contour); sampel deterministik dibangun
               agar ringkasan yang terlihat (bin, kuartil, puncak) sama (ASUMSI).
Nama seri/kategori yang tidak tercetak di panel diberi nama generik dan ditandai ASUMSI.

Koordinat piksel: image7 ditranskripsi pada skala tampilan 1509 px (x 1,2989 = asli); image8 pada skala
asli; image9-11 pada skala tampilan 1875 px (x 1,04533 = asli). Fungsi trace memakai piksel asli.
"""
import math

import numpy as np

import px

S7 = 1960.0 / 1509.0   # image7 tampilan -> asli
S9 = 1960.0 / 1875.0   # image9..11 tampilan -> asli

GALLERY_SOURCE = "pustakachart.py, data ilustrasi · katalog Panduan Jenis Chart v1.1 Bab 5."


def r1(v):
    return round(float(v), 1)


def r2(v):
    return round(float(v), 2)


def lin(p, p0, v0, p1, v1):
    """Peta piksel -> nilai sumbu lewat dua tick bertanda."""
    return v0 + (p - p0) * (v1 - v0) / float(p1 - p0)


def panel(code, name, data, transcription, axis_note=None, **extra):
    spec = {"kind": code, "id": code, "style": "gallery", "data": data}
    params = {"transcription": transcription}
    params.update(extra.pop("params", {}))
    spec["params"] = params
    for k in ("unit", "dec", "limit", "limitLabel", "note", "heightMm"):
        if k in extra:
            spec[k] = extra.pop(k)
    if extra:
        raise ValueError("medan tak dikenal %s" % list(extra))
    p = {"name": name, "code": code, "spec": spec}
    if axis_note:
        p["axisNote"] = axis_note
    return p


def cat(points):
    return {"shape": "categorical", "points": points}


def series(categories, ser):
    return {"shape": "series", "categories": categories, "series": ser}


# ---------------------------------------------------------------- sampel sintetis
def norm_quantiles(n, mean, sd):
    """n kuantil normal (titik tengah) deterministik, tanpa RNG."""
    from statistics import NormalDist
    nd = NormalDist(mean, sd)
    return [nd.inv_cdf((i + 0.5) / n) for i in range(n)]


def from_bins(edges, counts):
    """Nilai merata di dalam setiap bin histogram (jumlah per bin = counts)."""
    out = []
    for i, c in enumerate(counts):
        a, b = edges[i], edges[i + 1]
        for k in range(c):
            out.append(r2(a + (b - a) * (k + 0.5) / c))
    return out


def five_number(lo, q1, med, q3, hi, outliers=(), m=5):
    """Sampel 4m+1+k titik: persentil linear numpy (q1/median/q3) dan ujung kumis tepat sama."""
    n = 4 * m + 1 + len(outliers)
    # indeks persentil linear untuk n titik: (n-1)*p; pilih m sehingga titik jangkar tepat
    vals = []
    base = 4 * m  # titik 0..4m tanpa pencilan
    anchors = [(0, lo), (m, q1), (2 * m, med), (3 * m, q3), (base, hi)]
    for (i0, v0), (i1, v1) in zip(anchors, anchors[1:]):
        for i in range(i0, i1):
            vals.append(v0 + (v1 - v0) * (i - i0) / float(i1 - i0))
    vals.append(hi)
    vals = [r2(v) for v in vals] + [r2(o) for o in outliers]
    assert len(vals) == n
    return sorted(vals)


def clipped_normal(n, med, lo, hi, sd):
    q = norm_quantiles(n, med, sd)
    q = [min(hi, max(lo, v)) for v in q]
    q[0], q[-1] = lo, hi
    return [r2(v) for v in q]


# ---------------------------------------------------------------- Gambar 8.1
def fig81(media):
    im = px.load(media["image7.png"])
    P = []
    P.append(panel("P-01", "Bar urut", cat([
        {"label": "Polri", "value": 42, "accent": True}, {"label": "TNI AL", "value": 31},
        {"label": "Kemhan", "value": 24}, {"label": "BNPT", "value": 15},
        {"label": "Kominfo", "value": 11}, {"label": "BIN", "value": 7}]), "label", dec=0,
        params={"sort": "desc", "valueLabel": True}))
    P.append(panel("P-02", "Column", cat([
        {"label": "SD", "value": 4}, {"label": "SMP", "value": 9}, {"label": "SMA", "value": 22},
        {"label": "D3", "value": 14}, {"label": "S1", "value": 31, "accent": True}, {"label": "S2", "value": 8}]),
        "label", dec=0, params={"valueLabel": True}))
    # P-03: tanpa sumbu; tinggi batang dinormalkan ke K4 target = 100 (pixel, ASUMSI skala)
    base = 311.0
    tops = {"K1": (186, 199), "K2": (135, 123), "K3": (111, 161), "K4": (60, 85)}
    sc = 100.0 / (base - 60)
    P.append(panel("P-03", "Grouped column", series(list(tops), [
        {"name": "target", "values": [round((base - t) * sc) for t, _ in tops.values()]},
        {"name": "real", "values": [round((base - r) * sc) for _, r in tops.values()]}]),
        "pixel", params={"seriesLabelsInPlot": True, "accentPoint": {"series": "real", "category": "K3"},
                         "scaleNote": "tanpa sumbu: skala dinormalkan K4 target = 100 (ASUMSI)"}))
    lol = [437, 429, 422, 414, 399, 391, 384, 342, 330, 303]
    P.append(panel("P-04", "Lollipop", cat([
        dict({"label": "V%d" % (i + 1), "value": round(lin(x, 86, 0, 468, 100))}, **({"accent": True} if i == 0 else {}))
        for i, x in enumerate(lol)]), "pixel", dec=0, params={"sort": "desc", "axis": [0, 100]}))
    dots = {"E": (741, 780), "D": (885, 914), "C": (637, 713), "B": (780, 818), "A": (704, 761)}
    P.append(panel("P-05", "Dot plot", {"shape": "distribution", "groups": [
        {"name": k, "values": [round(lin(a, 589, 50, 970, 90)), round(lin(b, 589, 50, 970, 90))]} for k, (a, b) in dots.items()]},
        "pixel", params={"axis": [50, 90], "gridlines": True, "pointRoles": ["sebelum", "sesudah"],
                         "groupOrder": "atas ke bawah E..A"}))
    db = {"Integritas": (1310, 1431), "Cakupan": (1190, 1277), "Ketersediaan": (1261, 1409),
          "Akurasi": (1229, 1316), "Waktu respons": (1157, 1354)}
    P.append(panel("P-06", "Dumbbell", series(list(db), [
        {"name": "awal", "values": [round(lin(a, 1092, 30, 1474, 100)) for a, _ in db.values()]},
        {"name": "akhir", "values": [round(lin(b, 1092, 30, 1474, 100)) for _, b in db.values()], "accent": True}]),
        "pixel", params={"axis": [30, 100], "seriesNames": "ASUMSI"}))
    rg = {"Jyp": (126, 335), "Mks": (173, 404), "Mdn": (104, 381), "Sby": (196, 428), "Jkt": (150, 451)}
    P.append(panel("P-07", "Range plot", {"shape": "distribution", "groups": [
        {"name": k, "values": [r1(lin(a, 126, 20.0, 404, 32.5)), r1(lin(b, 126, 20.0, 404, 32.5))]} for k, (a, b) in rg.items()]},
        "pixel", axis_note="x °C", unit="°C", dec=1, params={"accentGroup": "Sby", "groupValues": "[min, max]"}))
    P.append(panel("P-08", "Slope", series(["2025", "2026"], [
        {"name": "Div C", "values": [71, 66]}, {"name": "Div A", "values": [62, 76]},
        {"name": "Div D", "values": [55, 69]}, {"name": "Div B", "values": [48, 44]}]), "label", dec=0,
        params={"labelsBothSides": True, "upColour": "verd", "downColour": "alert"}))
    bl = {"Patroli": (1428, 1416), "Tiket": (1325, 1398), "Respons": (1390, 1359), "Uptime": (1443, 1455)}
    P.append(panel("P-09", "Bullet", cat([
        {"label": k, "value": round(lin(a, 1092, 0, 1474, 100))} for k, (a, _t) in bl.items()]), "pixel", dec=0,
        params={"targets": [round(lin(t, 1092, 0, 1474, 100)) for _a, t in bl.values()], "bandLevels": [60, 85, 100],
                "max": 100, "belowTargetColour": "alert"}))
    P.append(panel("P-10", "Waterfall", cat([
        {"label": "Awal", "value": 50, "sub": "total"}, {"label": "Masuk", "value": 18, "sub": "delta"},
        {"label": "Gaji", "value": -16, "sub": "delta"}, {"label": "Vendor", "value": -15, "sub": "delta"},
        {"label": "Pajak", "value": -7, "sub": "delta"}, {"label": "Akhir", "value": 30, "sub": "total"}]),
        "label", dec=0, params={"endsGroundedAtZero": True, "signedDeltaLabels": True}))
    P.append(panel("P-11", "Threshold (mesin DATUM)", cat([
        {"label": "Tahap 2", "value": 57.5, "accent": True}, {"label": "Tahap 1", "value": 53.0},
        {"label": "Mode 2", "value": 51.5}, {"label": "Mode 1", "value": 48.0}]), "label",
        unit="dB(A)", dec=1, limit=55.0, limitLabel="batas 55,0 dB(A)",
        params={"axis": [40, 62], "thresholdStyle": "gallery"}))
    # P-12: 6 panel garis tanpa sumbu bernilai; skala relatif 0-100 kotak panel bersama (trace piksel)
    sm = []
    boxes = [("Polda D", 22, 60), ("Polda E", 268, 60), ("Polda F", 515, 60),
             ("Polda A", 22, 305), ("Polda B", 268, 305), ("Polda C", 515, 305)]
    for name, cx0, cy0 in boxes:
        b = (1420 + int(cx0 / 1.5), 1630 + int(cy0 / 1.5), 1420 + int((cx0 + 213) / 1.5), 1630 + int((cy0 + 152) / 1.5))
        col = (180, 83, 9) if name == "Polda C" else (107, 119, 131)
        m = px.mask(im, col, 60, b)
        x0, x1 = px.xextent(m)
        ys = px.trace_mean(m, [x0 + (x1 - x0) * i / 11.0 for i in range(12)])
        top, bot = b[1] - int(40 / 1.5), b[3]
        sm.append({"name": name, "values": [r1((bot - y) * 100.0 / (bot - top)) for y in ys]})
    sm[-1]["accent"] = True
    P.append(panel("P-12", "Small multiples", series([str(i + 1) for i in range(12)], sm), "pixel",
                   params={"sharedScale": True, "grid": [2, 3], "panelOrder": "baris demi baris seperti tercetak",
                           "scaleNote": "tanpa sumbu bernilai: 0-100 = dasar-puncak kotak panel (ASUMSI)"}))
    qd = [(136, 1700, 0), (298, 1681, 1), (407, 1726, 1), (238, 1746, 0), (169, 1769, 0), (197, 1775, 0), (298, 1786, 0),
          (250, 1795, 0), (179, 1806, 0), (183, 1817, 0), (392, 1812, 0), (320, 1859, 0), (293, 1879, 0), (394, 1879, 0)]
    P.append(panel("P-13", "Quadrant", {"shape": "xy", "points": [
        dict({"x": r1(lin(x, 86, 0, 468, 10)), "y": r1(lin(y, 1912, 0, 1647, 10))}, **({"accent": True} if a else {}))
        for x, y, a in qd]}, "pixel", axis_note="y nilai · x kemudahan",
        params={"axis": {"x": [0, 10], "y": [0, 10]}, "divider": {"x": 5, "y": 5},
                "quadrantNames": {"kiriAtas": "rencanakan", "kananAtas": "kejar", "kiriBawah": "tunda", "kananBawah": "cepat"},
                "scaleNote": "tanpa angka sumbu: 0-10 = kotak plot (ASUMSI); dua titik aksen pada kuadran kejar"}))
    ar = {"Cakupan": (857, 910), "Alarm palsu": (774, 631), "Insiden": (703, 675), "MTTR": (807, 707)}
    P.append(panel("P-14", "Arrow chart", series(list(ar), [
        {"name": "awal", "values": [r1(lin(a, 613, 20, 899, 80)) for a, _ in ar.values()]},
        {"name": "akhir", "values": [r1(lin(b, 613, 20, 899, 80)) for _, b in ar.values()]}]), "pixel",
        params={"axis": [15, 95], "accentCategory": "MTTR", "seriesNames": "ASUMSI"}))
    P.append(panel("P-15", "Table chart", {"shape": "matrix", "rows": ["R1", "R2", "R3", "R4", "R5"],
                                           "cols": ["Q1", "Q2", "Q3", "Q4"],
                                           "values": [[43, 75, 56, 81], [91, 61, 94, 71], [71, 85, 87, 94],
                                                      [99, 49, 64, 96], [58, 40, 74, 85]]}, "label", dec=0,
                   params={"colourRule": [{"min": 90, "fill": "signal"}, {"min": 70, "max": 89, "fill": "ink400"},
                                          {"max": 69, "fill": "paper"}],
                           "colourRuleLegend": False}))
    return P


# ---------------------------------------------------------------- Gambar 8.2
def fig82(media):
    im = px.load(media["image8.png"])
    P = []
    m = px.ink_mask(im, (116, 58, 608, 398), white_min=200, exclude=[((180, 83, 9), 120), ((16, 20, 24), 30)])
    pts = px.split_blobs(px.blobs(m, 15), 145)
    P.append(panel("H-01", "Scatter + tren", {"shape": "xy", "points": [
        {"x": r1(lin(x, 184, 20, 585, 100)), "y": r1(lin(y, 390, 0, 96, 60))} for x, y in sorted(pts)]}, "pixel",
        axis_note="y penjualan · x promosi (Rp juta)", params={"trendLine": True, "trendColour": "signal",
                                                                "xIsPresumedCause": True,
                                                                "pointNote": "titik bertumpuk dipecah menurut luas (ASUMSI)"}))
    bub = [(787, 133, 21), (923, 132, 16), (1038, 114, 24), (1056, 192, 21), (1098, 291, 23), (1074, 298, 25),
           (863, 368, 13), (1175, 389, 12), (1238, 78, 25)]
    P.append(panel("H-02", "Bubble", {"shape": "xy", "points": [
        dict({"x": r2(lin(x, 823, 2, 1158, 8)), "y": r1(lin(y, 339, 10, 65, 30)), "size": r * r},
             **({"accent": True} if i == len(bub) - 1 else {})) for i, (x, y, r) in enumerate(bub)]}, "pixel",
        axis_note="y margin % · x nilai (Rp miliar)", params={"areaProportional": True, "sizeNote": "size = r^2 piksel (luas relatif)"}))
    rows = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
    cols = ["%02d" % h for h in range(24)]
    x0, x1, y0, y1 = 1418.0, 1915.0, 62.0, 405.0
    cw, rh = (x1 - x0) / 24.0, (y1 - y0) / 7.0
    vals = []
    for r in range(7):
        row = []
        for c in range(24):
            cx, cy = int(x0 + cw * (c + 0.5)), int(y0 + rh * (r + 0.5))
            patch = im[cy - 3:cy + 4, cx - 3:cx + 4].reshape(-1, 3).mean(axis=0)
            row.append(round(px.ramp_value(patch) * 100))
        vals.append(row)
    P.append(panel("H-03", "Heatmap hari × jam", {"shape": "matrix", "rows": rows, "cols": cols, "values": vals}, "pixel",
                   params={"ramp": "paper-signal", "scaleShown": False, "colTicks": ["00", "06", "12", "18", "23"],
                           "valueNote": "nilai 0-100 = proyeksi warna sel pada ramp kertas->signal"}))
    cs = [(134, 725), (198, 721), (287, 829), (360, 821), (395, 909), (457, 850), (514, 708), (585, 598)]
    P.append(panel("H-04", "Connected scatter", {"shape": "xy", "points": [
        dict({"x": r2(lin(x, 177, 2.5, 586, 15.0)), "y": r2(lin(y, 873, 0, 624, 4)), "label": str(2019 + i)},
             **({"accent": True} if i == len(cs) - 1 else {})) for i, (x, y) in enumerate(cs)]}, "pixel",
        axis_note="y produktivitas · x belanja TI", params={"labelEnds": ["2019", "2026"]}))
    rng = np.random.default_rng(80205)
    cov = [[14.0 ** 2, 0.65 * 14 * 10], [0.65 * 14 * 10, 10.0 ** 2]]
    xy = rng.multivariate_normal([50.0, 45.0], cov, size=600)
    P.append(panel("H-05", "Hexbin", {"shape": "xy", "points": [{"x": r1(a), "y": r1(b)} for a, b in xy]}, "sintetis",
                   params={"axis": {"x": [0, 100], "y": [0, 100]}, "axesUnlabelled": True,
                           "sampleNote": "600 titik normal bivariat (rata 50/45, sd 14/10, rho 0,65, seed 80205) meniru pusat dan sebaran sarang; ASUMSI"}))
    ny, nx = 24, 32
    mat = []
    for j in range(ny):
        yy = j / (ny - 1.0)
        row = []
        for i in range(nx):
            xx = i / (nx - 1.0)
            v = 0.72 * math.exp(-((xx - 0.30) ** 2 + (yy - 0.335) ** 2) / (2 * 0.085 ** 2)) \
                + 1.0 * math.exp(-((xx - 0.66) ** 2 + (yy - 0.58) ** 2) / (2 * 0.10 ** 2))
            row.append(r1(v * 100))
        mat.append(row)
    P.append(panel("H-06", "Contour", {"shape": "matrix", "rows": [str(j) for j in range(ny)], "cols": [str(i) for i in range(nx)],
                                       "values": mat}, "sintetis",
                   params={"levels": 6, "accentLevel": "tertinggi", "rowOrder": "bawah ke atas",
                           "sampleNote": "dua puncak Gauss (0,30;0,335) dan (0,66;0,58) pada kotak plot dinormalkan; ASUMSI"}))
    nodes = [("hub", 355, 1248, "penghubung"), ("n01", 253, 1117), ("n02", 279, 1225), ("n03", 204, 1249), ("n04", 185, 1262),
             ("n05", 134, 1288), ("n06", 266, 1262), ("n08", 432, 1170), ("n09", 414, 1248), ("n10", 438, 1242),
             ("n11", 429, 1262), ("n12", 506, 1266), ("n13", 584, 1206), ("n14", 460, 1305), ("n15", 586, 1360),
             ("n16", 200, 1351), ("n17", 202, 1429)]
    strong = [("hub", "n01"), ("hub", "n04"), ("hub", "n06"), ("hub", "n09"), ("hub", "n10"), ("hub", "n15")]
    weak = [("n01", "n03"), ("n01", "n04"), ("n05", "n04"), ("n05", "n06"), ("n08", "n09"), ("n08", "n10"), ("n08", "n11"),
            ("n08", "n12"), ("n10", "n14"), ("n10", "n15"), ("n11", "n15"), ("n12", "n15"), ("n13", "n14"), ("n16", "n17")]
    P.append(panel("H-07", "Network", {"shape": "graph",
                                       "nodes": [{"id": n[0], "label": n[3] if len(n) > 3 else n[0].upper(), "group": "aksen" if n[0] == "hub" else "simpul"} for n in nodes],
                                       "links": [{"from": a, "to": b, "value": 2} for a, b in strong] + [{"from": a, "to": b, "value": 1} for a, b in weak]},
                   "pixel", params={"positions": {n[0]: [r2(lin(n[1], 112, 0, 610, 1)), r2(lin(n[2], 1450, 0, 1100, 1))] for n in nodes},
                                    "highlightBridges": True, "nodeLabels": "hanya 'penghubung' tercetak; label lain ASUMSI",
                                    "linkNote": "value 2 = garis tinta 400, 1 = garis tipis 200 (ASUMSI dari tebal/warna)"}))
    arcs = [("E1", "E8", 1), ("E2", "E7", 2), ("E1", "E4", 1), ("E2", "E3", 1), ("E3", "E6", 1), ("E4", "E8", 1), ("E5", "E7", 1)]
    P.append(panel("H-08", "Arc diagram", {"shape": "graph", "nodes": [{"id": "E%d" % i, "label": "E%d" % i} for i in range(1, 9)],
                                           "links": [{"from": a, "to": b, "value": v} for a, b, v in arcs]}, "pixel",
                   params={"accentLink": ["E2", "E7"]}))
    P.append(panel("H-09", "Venn / Euler", {"shape": "sets", "sets": [{"name": "OSINT", "size": 53}, {"name": "Forensik", "size": 40}],
                                            "overlaps": [{"sets": ["OSINT", "Forensik"], "size": 12}]}, "label", dec=0,
                   params={"accentSet": "Forensik", "regionLabels": "eksklusif",
                           "labelNote": "label tercetak: OSINT 41, Forensik 28, irisan 12 (wilayah eksklusif); size = total himpunan"}))
    return P


# ---------------------------------------------------------------- Gambar 8.3
def fig83(media):
    P = []
    k1 = {"Jawa": (389, 502, 558), "Sumatra": (313, 399, 446), "Kalimantan": (238, 313, 341), "Sulawesi": (211, 266, 304)}
    tot = {"Jawa": 48, "Sumatra": 36, "Kalimantan": 25, "Sulawesi": 21}
    s1, s2, s3 = [], [], []
    for k, (a, b, _c) in k1.items():
        va, vb = round(lin(a, 106, 0, 577, 50)), round(lin(b, 106, 0, 577, 50))
        s1.append(va), s2.append(vb - va), s3.append(tot[k] - vb)
    P.append(panel("K-01", "Stacked bar", series(list(k1), [{"name": "Segmen 1", "values": s1, "accent": True},
                                                             {"name": "Segmen 2", "values": s2}, {"name": "Segmen 3", "values": s3}]),
                   "pixel", params={"totalLabels": True, "totalsFromLabel": tot, "seriesNames": "ASUMSI"}))
    P.append(panel("K-02", "100 % stacked bar", series(["Barat", "Tengah", "Timur"], [
        {"name": "Segmen 1", "values": [55, 42, 30], "accent": True}, {"name": "Segmen 2", "values": [30, 38, 40]},
        {"name": "Segmen 3", "values": [15, 20, 30]}]), "label", dec=0, unit="%",
        params={"segmentValueLabels": True, "keySegmentLeft": True, "seriesNames": "ASUMSI"}))
    dv = {"Q1": (1473, 1746), "Q2": (1404, 1683), "Q3": (1494, 1809), "Q4": (1378, 1641), "Q5": (1441, 1720)}
    P.append(panel("K-03", "Diverging bar", series(list(dv), [
        {"name": "setuju", "values": [round(lin(b, 1536, 0, 1641, 20)) for _a, b in dv.values()], "accent": True},
        {"name": "tidak setuju", "values": [round(-lin(a, 1536, 0, 1641, 20)) for a, _b in dv.values()]}]), "pixel",
        params={"meaningfulMidpoint": 0, "sideLabels": ["tidak setuju", "setuju"]}))
    pyr = {"60+": (280, 424), "50-59": (237, 463), "40-49": (193, 503), "30-39": (149, 544), "20-29": (128, 559),
           "10-19": (149, 535), "0-9": (171, 511)}
    P.append(panel("K-04", "Population pyramid", series(list(pyr), [
        {"name": "pria", "values": [r1(-lin(a, 346, 0, 455, 5)) for a, _b in pyr.values()]},
        {"name": "wanita", "values": [r1(lin(b, 346, 0, 455, 5)) for _a, b in pyr.values()], "accent": True}]), "pixel",
        params={"groups": ["pria", "wanita"], "categoryOrder": "atas ke bawah seperti tercetak"}))
    P.append(panel("K-05", "Donut", cat([{"label": "pemerintah", "value": 68, "accent": True}, {"label": "swasta", "value": 22},
                                          {"label": "lainnya", "value": 10}]), "pixel", unit="%", dec=0,
                   params={"centerLabel": "68 % pemerintah", "startAngle": 0, "clockwise": True,
                           "labelNote": "hanya 68 % pemerintah tercetak; 22/10 dari sudut irisan, nama ASUMSI"}))
    P.append(panel("K-06", "Pie, maks. 5 bagian", cat([{"label": "Bagian A", "value": 58, "accent": True},
                                                        {"label": "Bagian B", "value": 20}, {"label": "Bagian C", "value": 12},
                                                        {"label": "Bagian D", "value": 10}]), "pixel", unit="%", dec=0,
                   params={"oneDominant": True, "sliceLabel": "58 %", "labelNote": "hanya 58 % tercetak; sisanya dari sudut, nama ASUMSI"}))
    P.append(panel("K-07", "Waffle", cat([{"label": "tercapai", "value": 37, "accent": True}, {"label": "sisa", "value": 63}]),
                   "label", unit="%", dec=0, params={"grid": [10, 10], "valueLabel": "37 %", "fillOrder": "baris dari atas"}))
    P.append(panel("K-08", "Icon array", cat([{"label": "petugas tersorot", "value": 3, "accent": True},
                                               {"label": "petugas lain", "value": 7}]), "label", dec=0,
                   params={"grid": [2, 5], "icon": "orang", "caption": "3 dari 10 petugas"}))
    P.append(panel("K-09", "Treemap", cat([
        {"label": "Perimeter", "value": 38, "sub": "Grup 1", "accent": True},
        {"label": "Forensik", "value": 18, "sub": "Grup 2"}, {"label": "OSINT", "value": 24, "sub": "Grup 2"},
        {"label": "Lain", "value": 8, "sub": "Grup 3"}, {"label": "GovTech", "value": 12, "sub": "Grup 3"}]), "label", dec=0,
        params={"labelsInside": True, "groupNote": "pengelompokan kolom dari warna (ASUMSI)"}))
    P.append(panel("K-10", "Funnel", cat([{"label": "Prospek", "value": 120}, {"label": "Kualifikasi", "value": 64},
                                           {"label": "Proposal", "value": 30, "accent": True}, {"label": "Negosiasi", "value": 14},
                                           {"label": "Kontrak", "value": 9}]), "label", dec=0,
                   params={"stageValues": True, "conversionPercent": False}))
    P.append(panel("K-11", "Sankey", {"shape": "graph", "nodes": [
        {"id": "rab", "label": "RAB", "value": 100}, {"id": "jasa", "label": "Jasa", "value": 16},
        {"id": "sipil", "label": "Sipil", "value": 30}, {"id": "perangkat", "label": "Perangkat", "value": 50}],
        "links": [{"from": "rab", "to": "jasa", "value": 16}, {"from": "rab", "to": "sipil", "value": 30},
                  {"from": "rab", "to": "perangkat", "value": 50}]}, "label", dec=0,
        params={"accentLink": ["rab", "perangkat"], "labelNote": "RAB 100 tercetak; jumlah cabang tercetak 96 (selisih 4 apa adanya)"}))
    P.append(panel("K-12", "Marimekko", series(["Barat", "Tengah", "Timur"], [
        {"name": "Segmen 1", "values": [60, 35, 20], "accent": True}, {"name": "Segmen 2", "values": [25, 45, 30]},
        {"name": "Segmen 3", "values": [15, 20, 50]}]), "pixel", unit="%",
        params={"widths": [40, 35, 25], "seriesNames": "ASUMSI"}))
    return P


# ---------------------------------------------------------------- Gambar 8.4
def fig84(media):
    im = px.load(media["image10.png"])
    P = []

    def o(v):
        return v * S9

    # W-01: trace dua garis pada 12 bulan
    xs = [o(107 + 35.9 * i) for i in range(12)]
    box = (int(o(100)), int(o(55)), int(o(512)), int(o(385)))
    m26 = px.mask(im, (180, 83, 9), 60, box)
    m25 = px.mask(im, (195, 203, 209), 30, box)
    xs_in = [min(max(x, o(109)), o(500)) for x in xs]
    y26 = px.trace_mean(m26, xs_in)
    y25 = px.trace_mean(m25, xs_in)
    months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
    P.append(panel("W-01", "Line, label langsung", series(months, [
        {"name": "2025", "values": [r1(lin(y, o(372), 100, o(69), 140)) if y is not None else None for y in y25]},
        {"name": "2026", "values": [r1(lin(y, o(372), 100, o(69), 140)) if y is not None else None for y in y26], "accent": True}]),
        "pixel", params={"labelAtLineEnd": True, "axis": [100, 140]}))
    P.append(panel("W-02", "Column waktu", cat([{"label": "Jan", "value": 12}, {"label": "Feb", "value": 15},
                                                 {"label": "Mar", "value": 14}, {"label": "Apr", "value": 18},
                                                 {"label": "Mei", "value": 21, "accent": True}, {"label": "Jun", "value": 19}]),
                   "label", dec=0, params={"valueLabel": True}))
    P.append(panel("W-03", "Step line", series([str(i) for i in range(13)], [
        {"name": "harga", "values": [100] * 5 + [115] * 4 + [108] * 3 + [120], "accent": True}]), "pixel",
        axis_note="y harga · x bulan", params={"step": "post", "axis": [100, 120]}))
    # W-04: garis atas area, 24 titik x 0..23
    mk = px.mask(im, (16, 20, 24), 60, (int(o(120)), int(o(560)), int(o(565)), int(o(880))))
    xs = [o(127 + 18.8 * i) for i in range(24)]
    xs[0] += 2
    xs[-1] -= 2
    yt = px.trace_top(mk, xs)
    P.append(panel("W-04", "Area", cat([{"label": str(i), "value": r1(lin(y, o(884), 0, o(614), 30))} for i, y in enumerate(yt)]),
                   "pixel", axis_note="x bulan", params={"zeroBaseline": True}))
    # W-05: tiga lapis, 12 titik x 0..11
    xs = [o(753 + 39.2 * i) for i in range(12)]
    xs[0] += 3
    xs[-1] -= 3
    bx = (int(o(745)), int(o(560)), int(o(1200)), int(o(883)))
    md = px.mask(im, (107, 119, 131), 30, bx)
    ml = px.mask(im, (195, 203, 209), 30, bx)
    mo = px.mask(im, (180, 83, 9), 40, bx)
    td, tl, to = px.trace_top(md, xs), px.trace_top(ml, xs), px.trace_top(mo, xs)
    unit = (o(884) - o(594)) / 60.0
    base = o(884)
    a, b, c = [], [], []
    for d_, l_, o_ in zip(td, tl, to):
        a.append(r1((base - d_) / unit))
        b.append(r1((d_ - l_) / unit) if l_ is not None else 0.0)
        c.append(r1((l_ - o_) / unit) if (o_ is not None and l_ is not None) else 0.0)
    P.append(panel("W-05", "Stacked area", series([str(i) for i in range(12)], [
        {"name": "Lapis 1", "values": a}, {"name": "Lapis 2", "values": b}, {"name": "Lapis 3", "values": c, "accent": True}]),
        "pixel", axis_note="x bulan", params={"largestAtBottom": True, "seriesNames": "ASUMSI"}))
    P.append(panel("W-06", "Bump", series(["22", "23", "24", "25", "26"], [
        {"name": "Seri A", "values": [1, 2, 2, 3, 3]}, {"name": "Seri B", "values": [3, 3, 1, 1, 2]},
        {"name": "Seri C", "values": [4, 4, 4, 4, 4]}, {"name": "Seri D", "values": [2, 1, 3, 2, 1], "accent": True}]),
        "pixel", axis_note="y peringkat", params={"rankAxisInverted": True, "seriesNames": "ASUMSI"}))
    P.append(panel("W-07", "Gantt", {"shape": "intervals", "items": [
        {"label": "Survei", "start": 0, "end": 3, "group": "selesai"}, {"label": "Desain", "start": 2, "end": 6, "group": "selesai"},
        {"label": "Pasok", "start": 5, "end": 10, "group": "berjalan"}, {"label": "Instalasi", "start": 8, "end": 14, "group": "berjalan"},
        {"label": "Uji terima", "start": 13, "end": 15, "group": "aksen"},
        {"label": "BAST", "start": 15, "end": 15, "milestone": True}]}, "pixel", axis_note="x minggu",
        params={"todayLine": 9, "todayLabel": "hari ini", "rowPerTask": True, "milestones": True}))
    # W-08: tick per baris
    rows = [("Ekspor", 1097, (155, 28, 28)), ("USB", 1178, (155, 28, 28)), ("Akses", 1258, (107, 119, 131)),
            ("Login", 1338, (107, 119, 131))]
    groups = []
    for name, yc, col in rows:
        mm = px.mask(im, col, 40, (int(o(735)), int(o(yc - 30)), int(o(1210)), int(o(yc + 30))))
        xs = px.column_runs(mm, int(o(yc - 30)), int(o(yc + 30)))
        groups.append({"name": name, "values": [r2(lin(x, o(732), 0, o(1206), 24)) for x in xs]})
    P.append(panel("W-08", "Barcode", {"shape": "distribution", "groups": groups}, "pixel",
                   params={"rowPerEventType": True, "riskyTypeColour": "alert", "riskyTypes": ["Ekspor", "USB"],
                           "highlightWindow": [r2(lin(o(760), o(732), 0, o(1206), 24)), r2(lin(o(802), o(732), 0, o(1206), 24))],
                           "axis": [0, 24]}))
    # W-09: horizon, 6 baris x 48 sampel; dark = positif, pink = negatif, merah = pita kedua
    hz = []
    xs = [o(1410 + (1830 - 1410) * i / 47.0) for i in range(48)]
    for k in range(6):
        base_y = o(1107 + 54 * k)
        band = o(30)
        bx = (int(o(1405)), int(base_y - band - 2), int(o(1835)), int(base_y + 1))
        mdk = px.mask(im, (107, 119, 131), 30, bx)
        mpk = px.mask(im, (231, 194, 194), 30, bx)
        mrd = px.mask(im, (155, 28, 28), 40, bx)
        vals = []
        for x in xs:
            col = int(round(x))
            v = 0.0
            for mm, sign, off in ((mrd, -1, 1.0), (mdk, 1, 0.0), (mpk, -1, 0.0)):
                ys = np.nonzero(mm[:, col])[0]
                if len(ys):
                    v = sign * (off + (base_y - ys.min()) / band)
                    break
            vals.append(r2(v))
        hz.append({"name": "S-%02d" % (k + 1), "values": vals})
    P.append(panel("W-09", "Horizon", series([str(i) for i in range(48)], hz), "pixel",
                   params={"bands": 2, "fold": True, "subtractBaseline": True, "bandLegend": False,
                           "valueNote": "satuan = tinggi pita; >1 = pita kedua (merah); tanda dari warna (abu positif, merah muda negatif)"}))
    cnd = [(1844, 1804, 1795, 1862, 0), (1809, 1776, 1756, 1832, 0), (1781, 1759, 1740, 1800, 0), (1759, 1788, 1730, 1806, 1),
           (1788, 1780, 1767, 1810, 0), (1780, 1790, 1750, 1808, 1), (1785, 1795, 1772, 1827, 1), (1795, 1753, 1737, 1828, 0),
           (1758, 1725, 1710, 1770, 0), (1730, 1720, 1705, 1760, 0), (1721, 1755, 1690, 1790, 1), (1755, 1641, 1624, 1773, 0),
           (1645, 1589, 1565, 1676, 0), (1589, 1657, 1576, 1684, 1)]
    P.append(panel("W-10", "Candlestick", {"shape": "ohlc", "points": [
        {"t": str(i + 1), "o": r1(lin(op, 1843, 100, 1572, 115)), "h": r1(lin(hi, 1843, 100, 1572, 115)),
         "l": r1(lin(lo, 1843, 100, 1572, 115)), "c": r1(lin(cl, 1843, 100, 1572, 115))}
        for i, (op, cl, hi, lo, _d) in enumerate(cnd)]}, "pixel",
        params={"upColour": "ink900", "downColour": "alert", "axis": [99, 116]}))
    return P


# ---------------------------------------------------------------- Gambar 8.5
def fig85(media):
    im = px.load(media["image11.png"])
    P = []

    def o(v):
        return v * S9

    edges = [r2(16.4 + 2.24 * i) for i in range(17)]
    counts = [8, 4, 14, 19, 16, 39, 45, 52, 59, 49, 42, 25, 11, 9, 7, 1]
    P.append(panel("S-01", "Histogram", {"shape": "distribution", "groups": [{"name": "usia", "values": from_bins(edges, counts)}]},
                   "pixel", axis_note="x usia (tahun)", unit="tahun",
                   params={"bins": 16, "binEdges": edges, "medianMarker": True, "medianLabel": "median 34",
                           "countsNote": "jumlah per bin dibaca dari tinggi batang (n = 400); nilai merata di dalam bin"}))
    P.append(panel("S-02", "Box plot", {"shape": "distribution", "groups": [
        {"name": "Ops", "values": five_number(3.5, 8.9, 11.8, 13.8, 18.5, (21.5,))},
        {"name": "TI", "values": five_number(1.6, 10.2, 13.6, 18.5, 29.3)},
        {"name": "Keu", "values": five_number(6.7, 9.6, 11.1, 12.0, 14.2, (5.5,))},
        {"name": "Lap", "values": five_number(-7.8, 8.2, 14.2, 21.1, 37.5, (44.0, 46.4))}]}, "pixel",
        axis_note="y jam lembur", unit="jam",
        params={"accentGroup": "Lap", "median": True, "box50": True, "outlierPoints": True,
                "sampleNote": "sampel disusun agar min/Q1/median/Q3/maks/pencilan sama dengan gambar (ASUMSI)"}))
    P.append(panel("S-03", "Density", {"shape": "distribution", "groups": [
        {"name": "Grup 1", "values": [r2(v) for v in norm_quantiles(80, 29.5, 6.3)]},
        {"name": "Grup 2", "values": [r2(v) for v in norm_quantiles(80, 40.0, 7.0)]}]}, "sintetis", axis_note="x menit",
        unit="menit", params={"accentGroup": "Grup 2", "axis": [0, 70],
                               "sampleNote": "kuantil normal: puncak 29,5 dan 40 menit dibaca dari piksel; nama grup ASUMSI"}))
    P.append(panel("S-04", "Violin", {"shape": "distribution", "groups": [
        {"name": "A", "values": clipped_normal(41, 10.3, 4.9, 15.0, 2.4)},
        {"name": "B", "values": clipped_normal(41, 12.4, 3.5, 22.0, 4.0)},
        {"name": "C", "values": clipped_normal(41, 9.1, 4.6, 14.4, 2.2)}]}, "sintetis",
        params={"accentGroup": "B", "medianTick": True,
                "sampleNote": "min/maks/median dibaca dari piksel; bentuk kuantil normal (ASUMSI)"}))
    peaks = {"Mei": 62, "Jun": 57, "Jul": 52, "Agu": 46, "Sep": 37, "Okt": 34}
    P.append(panel("S-05", "Ridgeline", {"shape": "distribution", "groups": [
        {"name": k, "values": [r2(v) for v in norm_quantiles(60, mu, 11.0)]} for k, mu in peaks.items()]}, "sintetis",
        params={"accentGroup": "Okt", "periodOrder": "atas ke bawah Mei..Okt", "slightOverlap": True, "sharedAxis": True,
                "sampleNote": "puncak dibaca dari piksel pada skala 0-100 lebar panel (ASUMSI); sumbu x tanpa angka"}))
    # S-06 / S-07: titik per kelompok
    def dots(box, unit_area, colours, excl):
        m = None
        for col, tol in colours:
            mm = px.mask(im, col, tol, box)
            m = mm if m is None else (m | mm)
        for col, tol in excl:
            m &= ~px.mask(im, col, tol)
        return px.split_blobs(px.blobs(m, 30), unit_area)

    grp6 = []
    for name, xc in (("Polda A", 1412), ("Polda B", 1533), ("Polda C", 1654), ("Polda D", 1776)):
        bx = (int(o(xc - 55)), int(o(560)), int(o(xc + 55)), int(o(872)))
        cols = [((191, 109, 46), 90), ((180, 83, 9), 60)] if name == "Polda B" else [((120, 131, 142), 60)]
        pts = dots(bx, 97, cols, [((16, 20, 24), 60)])
        grp6.append({"name": name, "values": sorted(r1(lin(y, o(876), 0, o(799), 10)) for _x, y in pts)})
    P.append(panel("S-06", "Strip / jitter", {"shape": "distribution", "groups": grp6}, "pixel", axis_note="y menit",
                   unit="menit", params={"accentGroup": "Polda B", "meanLine": True, "jitter": True,
                                         "pointNote": "titik bertumpuk dipecah menurut luas (ASUMSI)"}))
    grp7 = []
    for name, xc in (("Tim 1", 154), ("Tim 2", 343), ("Tim 3", 533)):
        bx = (int(o(xc - 60)), int(o(1055)), int(o(xc + 60)), int(o(1378)))
        cols = [((180, 83, 9), 90)] if name == "Tim 3" else [((107, 119, 131), 60)]
        pts = dots(bx, 101, cols, [((16, 20, 24), 60)])
        grp7.append({"name": name, "values": sorted(r1(lin(y, o(1308), 10, o(1080), 40)) for _x, y in pts)})
    P.append(panel("S-07", "Beeswarm", {"shape": "distribution", "groups": grp7}, "pixel",
                   params={"accentGroup": "Tim 3", "columnPerGroup": True, "medianMarker": False}))
    # S-08: radial, 36 sektor 10 derajat, panjang = jumlah (skala relatif)
    cx, cy, rmax = o(968), o(1213), o(135)
    msk = px.mask(im, (107, 119, 131), 40) | px.mask(im, (180, 83, 9), 50)
    secs = []
    for k in range(36):
        ang = math.radians(k * 10 + 5)  # 0 = utara, searah jarum jam
        best = 0.0
        for rr in np.arange(2, rmax, 0.5):
            x, y = cx + rr * math.sin(ang), cy - rr * math.cos(ang)
            if msk[int(round(y)), int(round(x))]:
                best = rr
        secs.append(int(round(best / rmax * 20)))
    vals = []
    for k, n in enumerate(secs):
        vals += [k * 10 + 5] * n
    accent_sector = int(np.argmax(secs)) * 10 + 5
    P.append(panel("S-08", "Radial histogram", {"shape": "distribution", "groups": [{"name": "arah", "values": vals}]}, "pixel",
                   unit="derajat", params={"sectors": 36, "northUp": True, "clockwise": True, "uniformSectors": True,
                                           "compassLabels": ["U", "T", "S", "B"], "accentSectorDeg": accent_sector,
                                           "countsNote": "jumlah per sektor = panjang jari-jari dibagi jari-jari lingkar x 20 (ASUMSI)"}))
    tiles = [(0, 0, "ACEH", 1), (0, 3, "KEPR", 2), (1, 1, "SUMU", 3), (1, 2, "RIAU", 2), (1, 6, "KALT", 2), (1, 8, "GORO", 2),
             (1, 9, "SULU", 1), (2, 1, "SUMB", 3), (2, 2, "JAMB", 1), (2, 3, "BABE", 1), (2, 4, "KALB", 1), (2, 6, "KALT", 1),
             (2, 7, "SULT", 1), (2, 10, "MALU", 1), (2, 11, "PBD", 2), (3, 1, "BENG", 1), (3, 2, "SUMS", 2), (3, 5, "KALT", 1),
             (3, 6, "KALS", 1), (3, 7, "SULB", 2), (3, 11, "PABA", 1), (3, 12, "PAPU", 1), (4, 2, "LAMP", 2), (4, 7, "SULS", 2),
             (4, 8, "SULT", 1), (4, 10, "MALU", 1), (4, 12, "PTEN", 1), (4, 13, "PPEG", 1), (5, 3, "BANT", 3), (5, 4, "DKI", 2),
             (5, 13, "PSEL", 3), (6, 4, "JABA", 1), (6, 5, "JATE", 1), (6, 6, "JATI", 1), (6, 7, "BALI", 1), (6, 8, "NTB", 2),
             (6, 9, "NTT", 2), (7, 5, "DIY", 1)]
    seen = {}
    tl = []
    for r, c, lab, v in tiles:
        seen[lab] = seen.get(lab, 0) + 1
        code = lab if seen[lab] == 1 else "%s_%d" % (lab, seen[lab])
        tl.append({"code": code, "row": r, "col": c, "value": v, "label": lab})
    P.append(panel("G-01", "Tile map 38 provinsi", {"shape": "tiles", "tiles": tl}, "label",
                   params={"standardAbbrev": False, "singleRamp": True, "valueInTile": False,
                           "valueNote": "nilai kelas dari warna petak: 3 signal, 2 tinta 400, 1 tinta 200 (ASUMSI)",
                           "labelNote": "label tercetak apa adanya; KALT x3, SULT x2, MALU x2 berulang di gambar (code diberi akhiran)"}))
    # G-02: titik di wilayah ilustrasi
    bx = (int(o(122)), int(o(1600)), int(o(566)), int(o(1852)))
    m = px.ink_mask(im, bx, white_min=200, exclude=[((180, 83, 9), 120), ((195, 203, 209), 25)])
    pts = px.split_blobs(px.blobs(m, 30), 97)
    x0, y0, x1, y1 = o(117), o(1572), o(571), o(1857)
    dots_ = [{"tile": "WIL", "dx": r2((x - x0) / (x1 - x0)), "dy": r2((y - y0) / (y1 - y0))} for x, y in sorted(pts)]
    dots_.append({"tile": "WIL", "dx": r2((o(368) - x0) / (x1 - x0)), "dy": r2((o(1737) - y0) / (y1 - y0)), "label": "sorot"})
    P.append(panel("G-02", "Dot map", {"shape": "tiles", "tiles": [{"code": "WIL", "row": 0, "col": 0, "label": "wilayah ilustrasi"}],
                                       "dots": dots_}, "pixel",
                   params={"schematic": "KT-12 grid tile", "regionFrame": "dashed", "accentDot": "sorot",
                           "dotNote": "dx/dy relatif bingkai wilayah 0..1 (y ke bawah)"}))
    P.append(panel("G-03", "Flow map", {"shape": "tiles", "tiles": [
        {"code": "MDN", "row": 0, "col": 0, "label": "Medan"}, {"code": "JKT", "row": 5, "col": 1, "label": "Jakarta"},
        {"code": "SBY", "row": 6, "col": 4, "label": "Surabaya"}, {"code": "MKS", "row": 3, "col": 6, "label": "Makassar"},
        {"code": "JYP", "row": 4, "col": 9, "label": "Jayapura"}],
        "flows": [{"from": "JKT", "to": "MDN", "value": 15}, {"from": "JKT", "to": "SBY", "value": 40},
                  {"from": "SBY", "to": "MKS", "value": 25}, {"from": "MKS", "to": "JYP", "value": 10}]}, "pixel",
        params={"schematic": "KT-12 grid tile", "accentFlow": ["JKT", "SBY"],
                "flowNote": "nilai aliran dari tebal garis relatif (ASUMSI); posisi kota pada grid kasar"}))
    flow = {
        "$schema": "studio.diagram/v1", "family": "flow", "id": "8.5-G04",
        "title": "Flowchart ISO 5807 penanganan barang bukti.", "classification": "TERBATAS", "width_mm": 128,
        "apparatus": "figure", "labels_verified": True, "sources": [GALLERY_SOURCE], "per_row": 4,
        "nodes": [
            {"id": "sita", "label": "Sita", "shape": "stadium", "class": {"col": 0, "row": 0}},
            {"id": "akuisisi", "label": "Akuisisi", "shape": "box", "class": {"col": 1, "row": 0}},
            {"id": "hash", "label": "Hash cocok", "shape": "diamond", "class": {"col": 2, "row": 0, "accent": True}},
            {"id": "analisis", "label": "Analisis", "shape": "box", "class": {"col": 3, "row": 0}},
            {"id": "ulang", "label": "Ulang", "shape": "box", "class": {"col": 2, "row": 1}},
            {"id": "laporan", "label": "Laporan", "shape": "stadium", "class": {"col": 3, "row": 1}}],
        "edges": [
            {"from": "sita", "to": "akuisisi", "kind": "data", "label": ""},
            {"from": "akuisisi", "to": "hash", "kind": "data", "label": ""},
            {"from": "hash", "to": "analisis", "kind": "data", "label": "ya"},
            {"from": "hash", "to": "ulang", "kind": "alert", "label": "tidak"},
            {"from": "analisis", "to": "laporan", "kind": "data", "label": ""}]}
    P.append(panel("G-04", "Flowchart ISO 5807", {"shape": "steps", "spec": flow}, "label",
                   params={"singleReadingDirection": True, "standardShapes": True, "maxSteps": 6,
                           "titleNote": "judul spec langkah ASUMSI (panel tanpa judul)"}))
    return P


FIGS = {"8.1": fig81, "8.2": fig82, "8.3": fig83, "8.4": fig84, "8.5": fig85}


# ---------------------------------------------------------------- IP-02: kunci params penuh (D-87)
# Spec galeri memakai kunci penuh registri `chart.kind.<KODE>.<nama>` (src/lib/studio/registry/charts.ts) atau
# kunci global P7 (`chart.zeroBaseline`), sehingga benchmark tidak bergantung pada alias pendek (resolver
# engine/chart/core/params.ts). Yang tetap di params dengan kunci pendek: petunjuk data per kode
# (CHART_DATA_HINT_KEYS). IP-41e (D-215): petunjuk tergambar -> kunci penuh `chart.kind.<KODE>.<nama>` (HINT_KEYS);
# alias aksen kontrak (accentPoint/accentGroup/accentSeries) dilipat ke medan `accent` panel; petunjuk rangkap
# dibuang karena medannya sudah ada (DUPLICATE_KEYS, ACCENT_FIELDS); catatan tak tergambar -> medan `x` panel (IP-40,
# D-185). Asal transkripsi -> index.json `transcription`. Tidak ada lagi `panelParamsMoved`.
# validate_figures.ts menegakkan: resolver engine melaporkan 0 PARAM_ALIAS dan 0 PARAM_IGNORED untuk setiap panel.

ACCENT_HINTS = {"accentPoint", "accentGroup", "accentSeries"}
# Urutan kunci sasaran titik pada bentuk objek accentPoint (= POINT_OBJECT_KEYS engine/chart/core/params.ts).
POINT_OBJECT_KEYS = ("point", "category", "label", "index")

# Salinan CHART_DATA_HINT_KEYS (engine/chart/core/params.ts) untuk kode yang dipakai galeri.
DATA_HINTS = {
    "P-09": {"target", "targets", "max", "belowTargetColour"},
    "P-12": {"grid"},
    "P-13": {"axis", "divider"},
    "P-14": {"axis", "accentCategory"},
    "P-15": {"colourRule", "tableRows", "tableHead"},
    "H-06": {"levels", "accentLevel", "rowOrder"},
    "H-07": {"positions", "accentLink", "labels"},
    "H-08": {"accentLink", "labels", "order"},
    "H-09": {"accentSet", "regionLabels"},
    "S-01": {"axis", "binEdges", "medianLabel"},
    "S-02": {"axis"},
    "S-03": {"axis"},
    "S-04": {"axis", "medianTick"},
    "S-06": {"jitter", "meanLine"},
    "S-08": {"sectors", "compassLabels", "accentSectorDeg"},
}


def _sort(v):
    return {"desc": "valueDesc", "asc": "valueAsc"}.get(v, v)


def _value_label(v):
    return "barEnd" if v is True else ("none" if v is False else v)


# kode -> {kunci pendek: (nama registri, fungsi nilai atau None)}; None = nilai apa adanya.
FULL_KEYS = {
    "P-01": {"sort": ("sort", _sort), "valueLabel": ("valueLabel", _value_label)},
    "P-04": {"sort": ("sort", _sort)},
    "P-05": {"gridlines": ("gridlines", None)},
    "P-08": {"labelsBothSides": ("labelsBothSides", None), "upColour": ("upColour", None),
             "downColour": ("downColour", None)},
    "P-09": {"bandLevels": ("bandLevels", None)},
    "P-10": {"endsGroundedAtZero": ("endsGroundedAtZero", None), "signedDeltaLabels": ("signedDeltaLabels", None)},
    "P-12": {"sharedScale": ("sharedScale", None)},
    "P-13": {"quadrantNames": ("quadrantNames", None)},
    "P-15": {"colourRuleLegend": ("colourRuleLegend", None)},
    "H-01": {"trendLine": ("trendLine", None), "xIsPresumedCause": ("xIsPresumedCause", None)},
    "H-02": {"areaProportional": ("areaProportional", None)},
    "H-03": {"ramp": ("ramp", None), "scaleShown": ("scaleShown", None)},
    "H-07": {"highlightBridges": ("highlightBridges", None)},
    "K-02": {"keySegmentLeft": ("keySegmentLeft", None)},
    # K-03: 0 = titik tengah bermakna (nol) -> bool registri meaningfulMidpoint.
    "K-03": {"meaningfulMidpoint": ("meaningfulMidpoint", lambda v: True)},
    # K-04: daftar nama kelompok apa adanya (bentuk alternatif CHART_PARAM_ALT_FORMS, IP-41c/D-215).
    "K-04": {"groups": ("groups", None)},
    "K-05": {"startAngle": ("startAngle", None), "clockwise": ("clockwise", None)},
    "K-06": {"oneDominant": ("oneDominant", None)},
    # K-07: [baris, kolom] -> bentuk ParamDef "RxC".
    "K-07": {"grid": ("grid", lambda v: "%dx%d" % tuple(v) if isinstance(v, list) else v)},
    "K-08": {"grid": ("grid", None), "icon": ("icon", None), "caption": ("caption", None)},
    "K-09": {"labelsInside": ("labelsInside", None)},
    "K-10": {"stageValues": ("stageValues", None), "conversionPercent": ("conversionPercent", None)},
    "K-11": {"accentLink": ("accentLink", None)},
    "K-12": {"widths": ("widths", None)},
    "W-01": {"labelAtLineEnd": ("labelAtLineEnd", None)},
    "W-04": {"zeroBaseline": ("zeroBaseline", None)},
    "W-05": {"largestAtBottom": ("largestAtBottom", None)},
    # W-07 (permintaan S40): posisi garis hari ini = todayAt; milestones = daftar nama (BAST tercetak).
    "W-07": {"rowPerTask": ("rowPerTask", None), "todayLabel": ("todayLabel", None),
             "todayLine": ("todayAt", None), "milestones": ("milestones", lambda v: ["BAST"] if v is True else v)},
    "W-08": {"rowPerEventType": ("rowPerEventType", None), "riskyTypeColour": ("riskyTypeColour", None),
             "riskyTypes": ("riskyTypes", None), "highlightWindow": ("highlightWindow", None)},
    "W-09": {"bands": ("bands", None), "fold": ("fold", None), "subtractBaseline": ("subtractBaseline", None),
             "bandLegend": ("bandLegend", None)},
    "S-01": {"bins": ("bins", None), "medianMarker": ("medianMarker", None)},
    "S-02": {"median": ("median", None), "box50": ("box50", None), "outlierPoints": ("outlierPoints", None)},
    # S-05: teks urutan periode -> bool registri periodOrder (periode berurutan); teks tetap di medan `x` (D-215).
    "S-05": {"periodOrder": ("periodOrder", lambda v: True if isinstance(v, str) else v),
             "slightOverlap": ("slightOverlap", None), "sharedAxis": ("sharedAxis", None)},
    "S-07": {"columnPerGroup": ("columnPerGroup", None), "medianMarker": ("medianMarker", None)},
    "S-08": {"northUp": ("northUp", None), "clockwise": ("clockwise", None), "uniformSectors": ("uniformSectors", None)},
    "G-01": {"standardAbbrev": ("standardAbbrev", None), "singleRamp": ("singleRamp", None),
             "valueInTile": ("valueInTile", None)},
    # G-04: true = bentuk standar ISO 5807 (ParamDef string).
    "G-04": {"singleReadingDirection": ("singleReadingDirection", None), "maxSteps": ("maxSteps", None),
             "standardShapes": ("standardShapes", lambda v: "ISO 5807" if v is True else v)},
}
# Kunci yang nilai aslinya tetap disimpan di medan `x` walau diterjemahkan ke kunci penuh.
KEEP_ORIGINAL = {("S-05", "periodOrder")}

# IP-41e (D-215): petunjuk tergambar ber-ParamDef `chart.kind.<KODE>.<nama>` (IP-41c), nilai apa adanya.
HINT_KEYS = {
    "P-02": {"valueLabel"},
    "P-03": {"seriesLabelsInPlot"},
    "P-04": {"axis"},
    "P-05": {"axis", "pointRoles"},
    "P-06": {"axis"},
    "P-11": {"axis"},
    "H-01": {"trendColour"},
    "H-03": {"colTicks"},
    "H-04": {"labelEnds"},
    "H-05": {"axis", "axesUnlabelled"},
    "K-01": {"totalLabels", "totalsFromLabel"},
    "K-02": {"segmentValueLabels"},
    "K-03": {"sideLabels"},
    "K-05": {"centerLabel"},
    "K-06": {"sliceLabel"},
    "K-07": {"valueLabel"},
    "W-01": {"axis"},
    "W-02": {"valueLabel"},
    "W-03": {"step", "axis"},
    "W-06": {"rankAxisInverted"},
    "W-08": {"axis"},
    "W-10": {"upColour", "downColour", "axis"},
    "G-02": {"schematic", "regionFrame"},
    "G-03": {"schematic"},
}

# Petunjuk rangkap dengan medan panel yang sudah ada (D-215): dibuang, nilainya harus sama dengan medan itu.
DUPLICATE_KEYS = {("P-11", "thresholdStyle"): ("style", "gallery")}

# kode -> params kunci penuh tambahan (IP-02 c: D-63, permintaan S33).
EXTRA_FULL = {
    "P-06": {"chart.kind.P-06.sort": "natural"},   # manual menggambar urutan alami (bawaan byDifference menata ulang)
    "P-11": {"chart.zeroBaseline": False},          # sumbu 40..62 terpotong (D-63)
}

# kode -> (kunci pendek, pembentuk medan accent) yang dilipat ke medan `accent` kontrak (permintaan S43).
ACCENT_FIELDS = {
    "G-02": ("accentDot", lambda v: {"point": v}),
    "G-03": ("accentFlow", lambda v: {"point": ">".join(v) if isinstance(v, list) else v}),
}
EXTRA_ACCENT = {"W-07": {"point": "Uji terima"}}   # permintaan S40: grup "aksen" bukan sumber aksen W-07


def fold_accent(code, src):
    """Alias aksen kontrak -> medan `accent` (aturan tingkat 3 resolveAccent: objek accentPoint lalu group/series)."""
    acc = {}
    v = src.get("accentPoint")
    if isinstance(v, dict):
        at = next((v[k] for k in POINT_OBJECT_KEYS if v.get(k) not in (None, "")), None)
        if at is not None:
            acc["point"] = at
        for f in ("group", "series"):
            if v.get(f):
                acc[f] = v[f]
    elif v is not None:
        acc["point"] = v
    for f, key in (("group", "accentGroup"), ("series", "accentSeries")):
        if key in src and f not in acc:
            acc[f] = src[key]
    if any(k in src for k in ACCENT_HINTS) and not acc:
        raise ValueError("%s: alias aksen tanpa nilai sah" % code)
    return {f: acc[f] for f in ("point", "group", "series") if f in acc}


def normalize_panel(p):
    """Tulis ulang params satu panel ke kunci penuh, aksen ke medan `accent`, catatan ke medan `x`.

    Kembalikan nilai asal transkripsi panel (untuk index.json `transcription`).
    """
    code = p["code"]
    spec = p["spec"]
    src = spec.get("params", {})
    out, notes = {}, {}
    transcription = None
    fk = FULL_KEYS.get(code, {})
    hints = DATA_HINTS.get(code, set())
    drawn = HINT_KEYS.get(code, set())
    accent_field = ACCENT_FIELDS.get(code)
    accent = fold_accent(code, src)
    if accent:
        if "accent" in spec or accent_field or code in EXTRA_ACCENT:
            raise ValueError("%s: dua sumber aksen" % code)
        spec["accent"] = accent
    for k, v in src.items():
        if k == "transcription":
            transcription = v
        elif k in ACCENT_HINTS:
            continue
        elif k in hints:
            out[k] = v
        elif k in fk:
            name, fn = fk[k]
            out["chart.kind.%s.%s" % (code, name)] = fn(v) if fn else v
            if (code, k) in KEEP_ORIGINAL:
                notes[k] = v
        elif k in drawn:
            out["chart.kind.%s.%s" % (code, k)] = v
        elif accent_field and k == accent_field[0]:
            spec["accent"] = accent_field[1](v)    # rangkap: nilai hidup di medan `accent`
        elif (code, k) in DUPLICATE_KEYS:
            field, want = DUPLICATE_KEYS[(code, k)]
            if spec.get(field) != want or v != want:
                raise ValueError("%s.%s rangkap tidak sama dengan medan %s" % (code, k, field))
        else:
            notes[k] = v
    out.update(EXTRA_FULL.get(code, {}))
    if code in EXTRA_ACCENT:
        spec["accent"] = EXTRA_ACCENT[code]
    if out:
        spec["params"] = out
    else:
        spec.pop("params", None)
    if notes:
        spec["x"] = notes
    return transcription


def build(num, media):
    """Panel galeri Gambar `num` dengan params ternormalisasi, plus {kode: asal transkripsi}."""
    panels = FIGS[num](media)
    transcription = {}
    for p in panels:
        transcription[p["code"]] = normalize_panel(p)
    return panels, transcription
