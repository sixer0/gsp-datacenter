# -*- coding: utf-8 -*-
"""S94 helper piksel: membaca panel PNG galeri Manual 000 (transkripsi, F-005).

Semua fungsi deterministik dan hanya membaca berkas media yang diberikan.
Koordinat dalam piksel ASLI media (bukan koordinat tampilan).
"""
import numpy as np
from PIL import Image
from scipy import ndimage

_CACHE = {}


def load(path):
    """RGB int array (H, W, 3); di-cache per path."""
    if path not in _CACHE:
        _CACHE[path] = np.asarray(Image.open(path).convert("RGB")).astype(int)
    return _CACHE[path]


def mask(im, rgb, tol=40, box=None):
    """Piksel dengan jarak L1 ke `rgb` <= tol, opsional dibatasi kotak (x0, y0, x1, y1)."""
    m = np.abs(im - np.array(rgb)).sum(axis=2) <= tol
    if box:
        x0, y0, x1, y1 = box
        out = np.zeros_like(m)
        out[y0:y1, x0:x1] = m[y0:y1, x0:x1]
        return out
    return m


def ink_mask(im, box, white_min=235, exclude=()):
    """Piksel bukan kertas (salah satu kanal < white_min) di dalam kotak, minus warna `exclude`."""
    x0, y0, x1, y1 = box
    m = np.zeros(im.shape[:2], dtype=bool)
    sub = im[y0:y1, x0:x1]
    m[y0:y1, x0:x1] = (sub < white_min).any(axis=2)
    for rgb, tol in exclude:
        m &= ~mask(im, rgb, tol)
    return m


def blobs(m, min_area=20):
    """Komponen terhubung: (cx, cy, area, w, h) per komponen >= min_area."""
    lab, _n = ndimage.label(m)
    res = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        if sl is None:
            continue
        a = int((lab[sl] == i).sum())
        if a < min_area:
            continue
        cy, cx = ndimage.center_of_mass(lab == i)
        res.append((float(cx), float(cy), a, sl[1].stop - sl[1].start, sl[0].stop - sl[0].start))
    return res


def split_blobs(bl, unit_area):
    """Pecah gumpalan titik bertumpuk menjadi n titik (n = area / luas satu titik), berjajar di sumbu terpanjang."""
    pts = []
    for cx, cy, a, w, h in bl:
        n = max(1, int(round(a / float(unit_area))))
        if n == 1:
            pts.append((cx, cy))
            continue
        if w >= h:
            span = w - (w / n)
            for k in range(n):
                pts.append((cx - span / 2.0 + span * k / (n - 1), cy))
        else:
            span = h - (h / n)
            for k in range(n):
                pts.append((cx, cy - span / 2.0 + span * k / (n - 1)))
    return pts


def trace_mean(m, xs):
    """Rerata y piksel mask di setiap kolom x (None bila kosong)."""
    out = []
    for x in xs:
        ys = np.nonzero(m[:, int(round(x))])[0]
        out.append(float(ys.mean()) if len(ys) else None)
    return out


def trace_top(m, xs):
    """y teratas piksel mask di setiap kolom x (None bila kosong)."""
    out = []
    for x in xs:
        ys = np.nonzero(m[:, int(round(x))])[0]
        out.append(float(ys.min()) if len(ys) else None)
    return out


def xextent(m):
    xs = np.nonzero(m.any(axis=0))[0]
    return int(xs.min()), int(xs.max())


def column_runs(m, y0, y1, min_gap=2):
    """Pusat x setiap deret kolom bertanda di pita y0..y1 (tick barcode)."""
    cols = m[y0:y1].any(axis=0)
    xs = np.nonzero(cols)[0]
    runs = []
    if len(xs) == 0:
        return runs
    start = prev = xs[0]
    for x in xs[1:]:
        if x - prev > min_gap:
            runs.append((start + prev) / 2.0)
            start = x
        prev = x
    runs.append((start + prev) / 2.0)
    return runs


def ramp_value(rgb, paper=(255, 255, 255), signal=(180, 83, 9)):
    """Proyeksi warna pada ramp kertas -> signal, 0..1 (heatmap KT-08)."""
    c = np.array(rgb, dtype=float)
    p = np.array(paper, dtype=float)
    s = np.array(signal, dtype=float)
    t = float(np.dot(c - p, s - p) / np.dot(s - p, s - p))
    return min(1.0, max(0.0, t))
