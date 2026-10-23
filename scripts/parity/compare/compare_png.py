"""Pembanding PNG: diff piksel (persen piksel dengan selisih luminans > 32/255) dan SSIM CAL.

SSIM dilaporkan pada resolusi asli (sasaran 300 dpi, research/06 §6.1) dan pada 72 dpi agar setara
skala benchmark. Turun-sampel ke 72 dpi memakai `skimage.transform.resize(anti_aliasing=True)`;
raster abu-abu dari MuPDF seperti CAL (alpha dikomposit di atas putih).

F-007 / D-296 (R5, kelas CA saja): skrip acuan datumchart menulis `font-size` dalam px (root SVG
ber-satuan px), Node menulis pt fisik sesuai token DATUM, sehingga teks Node teraster 4/3 lebih besar.
Bila gerbang PNG gagal DAN konteks `f007` {refSvg, nodeSvg} diberikan, pembanding membuktikan sebabnya:
(1) gerbang SVG CA atas pasangan SVG yang sama lulus, (2) root SVG acuan memakai px, (3) SVG acuan
dengan setiap `font-size` dikali `f007Scale` (4/3) dirasterkan ulang dengan perasteran acuan yang
sama (`reference/fig/raster.py`, Chromium) lalu lulus ambang CA terhadap PNG Node. Ketiganya terpenuhi
-> vonis DIAGNOSIS beralasan "F-007 px/pt acuan" (cek PNG menjadi diagnosis); salah satu tidak -> FAIL tetap.
"""
from __future__ import annotations

import re
import sys
import tempfile
from pathlib import Path
from typing import Any

import numpy as np

from common import Checks, r
from ssim_cal import CAL_DPI, png_gray, ssim_cal

DEFAULT_DPI = 300.0
F007_REASON = "F-007 px/pt acuan"
_FONT_ATTR = re.compile(r'(font-size\s*=\s*")([0-9.]+)(px)?(")')
_FONT_CSS = re.compile(r"(font-size\s*:\s*)([0-9.]+)(px)?(?=\s*[;\"'}])")
_ROOT = re.compile(r"<svg\b[^>]*>", re.S)


def _to_dpi(g: np.ndarray, src_dpi: float, dst_dpi: float) -> np.ndarray:
    from skimage.transform import resize

    if abs(src_dpi - dst_dpi) < 1e-6:
        return g
    h = max(1, int(round(g.shape[0] * dst_dpi / src_dpi)))
    w = max(1, int(round(g.shape[1] * dst_dpi / src_dpi)))
    out = resize(g.astype(np.float64), (h, w), anti_aliasing=True, preserve_range=True)
    return np.clip(np.rint(out), 0, 255).astype(np.uint8)


def pixel_diff_pct(a: np.ndarray, b: np.ndarray, delta: int) -> float:
    h, w = min(a.shape[0], b.shape[0]), min(a.shape[1], b.shape[1])
    d = np.abs(a[:h, :w].astype(np.int16) - b[:h, :w].astype(np.int16))
    return float(100.0 * np.count_nonzero(d > delta) / d.size) if d.size else 100.0


def ref_root_is_px(svg: str) -> bool:
    """Root SVG acuan berukuran px (tanpa satuan atau `px`) = premis F-007."""
    m = _ROOT.search(svg)
    if not m:
        return False
    w = re.search(r'\bwidth\s*=\s*"\s*[-+0-9.eE]+\s*([a-z]*)\s*"', m.group(0))
    return bool(w) and w.group(1) in ("", "px")


def scale_font_sizes(svg: str, scale: float) -> tuple[str, int]:
    """Kalikan setiap `font-size` (atribut atau CSS, tanpa satuan/px) dengan `scale`; (svg, jumlah)."""
    n = 0

    def sub(m: re.Match[str]) -> str:
        nonlocal n
        n += 1
        tail = m.group(4) if m.re is _FONT_ATTR else ""
        return f"{m.group(1)}{float(m.group(2)) * scale:.6g}{m.group(3) or ''}{tail}"

    return _FONT_CSS.sub(sub, _FONT_ATTR.sub(sub, svg)), n


def _rasterize_ref(svg: str, png_path: str) -> None:
    """Perasteran yang sama dengan PNG acuan (S65: Chromium Playwright set_content, 300 dpi)."""
    fig_dir = Path(__file__).resolve().parent.parent / "reference" / "fig"
    if str(fig_dir) not in sys.path:
        sys.path.insert(0, str(fig_dir))
    import raster  # noqa: PLC0415 - modul acuan, dimuat hanya bila bukti F-007 dibutuhkan

    raster.svgs_to_png([(svg, png_path)])


def _svg_ca_passes(ref_svg: str, node_svg: str) -> tuple[bool, list[str]]:
    import compare_svg  # noqa: PLC0415
    import thresholds as TH  # noqa: PLC0415

    ck = Checks()
    compare_svg.compare(ref_svg, node_svg, "CA", TH.get("svg", "CA"), ck, {})
    return ck.verdict() == "PASS", [d["check"] for d in ck.diffs if d.get("gate")]


def f007_evidence(ref_svg: str, node_svg: str, node_png: str, th: dict[str, Any]) -> dict[str, Any]:
    """Bukti F-007 (lihat docstring modul). `applies` True hanya bila ketiga syarat terpenuhi."""
    ev: dict[str, Any] = {"reason": F007_REASON, "scale": th.get("f007Scale"), "applies": False}
    svg_ok, svg_failed = _svg_ca_passes(ref_svg, node_svg)
    ev["svgCaPass"] = svg_ok
    if not svg_ok:
        ev["why"] = f"gerbang SVG CA gagal: {svg_failed}"
        return ev
    text = Path(ref_svg).read_text(encoding="utf-8")
    ev["refRootPx"] = ref_root_is_px(text)
    if not ev["refRootPx"]:
        ev["why"] = "root SVG acuan tidak ber-satuan px; premis F-007 tidak berlaku"
        return ev
    norm, n = scale_font_sizes(text, float(th["f007Scale"]))
    ev["fontSizesScaled"] = n
    if n == 0:
        ev["why"] = "SVG acuan tanpa font-size; selisih bukan dari skala teks"
        return ev
    with tempfile.TemporaryDirectory(prefix="f007_") as tmp:
        out = str(Path(tmp) / "ref_norm.png")
        _rasterize_ref(norm, out)
        ga, _ = png_gray(out)
    gb, _ = png_gray(node_png)
    size_ok = ga.shape == gb.shape
    s = ssim_cal(ga, gb)
    diff = pixel_diff_pct(ga, gb, int(th["lumaDelta"]))
    ev.update({"normalizedSize": size_ok, "normalizedSsim": r(s), "normalizedPixelDiffPct": r(diff, 3)})
    ev["applies"] = bool(size_ok and s >= th["ssimMin"] and diff <= th["diffPctMax"])
    if not ev["applies"]:
        ev["why"] = "acuan ternormalkan 4/3 tetap di bawah ambang CA: selisih bukan hanya skala teks"
    return ev


_LEN = re.compile(r'\b(width|height)\s*=\s*"\s*([-+0-9.eE]+)\s*([a-z]*)\s*"')
_MM_PER = {"mm": 1.0, "cm": 10.0, "in": 25.4, "pt": 25.4 / 72.0, "pc": 25.4 / 6.0, "px": 25.4 / 96.0, "": 25.4 / 96.0}


def node_raster_px(svg_path: str, dpi: float) -> tuple[int, int]:
    """(tinggi, lebar) px yang diharapkan dari akar SVG Node pada `dpi` (satuan root; tanpa satuan = px CSS)."""
    m = _ROOT.search(Path(svg_path).read_text(encoding="utf-8"))
    dims = {k: float(v) * _MM_PER.get(u, 25.4 / 96.0) for k, v, u in _LEN.findall(m.group(0) if m else "")}
    if "width" not in dims or "height" not in dims:
        raise ValueError(f"akar SVG Node tanpa width/height: {svg_path}")
    return (int(round(dims["height"] / 25.4 * dpi)), int(round(dims["width"] / 25.4 * dpi)))


def compare(ref: str, node: str, th: dict[str, Any], ck: Checks, ctx: dict[str, Any] | None = None) -> dict[str, Any]:
    ctx = ctx or {}
    ga, dpi_a = png_gray(ref)
    gb, dpi_b = png_gray(node)
    da, db = dpi_a or DEFAULT_DPI, dpi_b or DEFAULT_DPI
    size_ok = ga.shape == gb.shape
    s_native = ssim_cal(ga, gb)
    s72 = ssim_cal(_to_dpi(ga, da, CAL_DPI), _to_dpi(gb, db, CAL_DPI))
    diff = pixel_diff_pct(ga, gb, int(th["lumaDelta"]))
    extra: dict[str, Any] = {}

    d242 = ctx.get("d242") if isinstance(ctx.get("d242"), dict) else None
    if th.get("gate") and th.get("d242Class") and d242 and d242.get("nodeSvg"):
        # D-242/D-298 (DG): raster lawan Python = diagnosis; gerbang = raster Node utuh terhadap SVG Node-nya.
        want = node_raster_px(str(d242["nodeSvg"]), db)
        tolp = int(th.get("d242RasterTolPx", 4))
        ok_px = abs(gb.shape[0] - want[0]) <= tolp and abs(gb.shape[1] - want[1]) <= tolp
        ck.add("d242.rasterSize", ok_px, True, list(want), list(gb.shape), tolp)
        ck.add("d242.rasterNotBlank", int(np.count_nonzero(gb < 250)) > 0, True, None, int(np.count_nonzero(gb < 250)))
        ck.add("size", size_ok, False, list(ga.shape), list(gb.shape))
        ck.add("ssim", s_native >= th["ssimMin"], False, None, r(s_native), th["ssimMin"])
        ck.add("pixelDiffPct", diff <= th["diffPctMax"], False, None, r(diff, 3), th["diffPctMax"])
        extra["d242"] = {"class": "D-242 (bukan byte Python; D-298)", "expectPx": list(want), "dpi": db}
    elif th.get("gate"):
        gates_ok = size_ok and s_native >= th["ssimMin"] and diff <= th["diffPctMax"]
        f007 = ctx.get("f007") if isinstance(ctx.get("f007"), dict) else None
        gate = True
        if not gates_ok and th.get("f007PxPtNormalize") and f007 and f007.get("refSvg") and f007.get("nodeSvg"):
            ev = f007_evidence(str(f007["refSvg"]), str(f007["nodeSvg"]), node, th)
            extra["f007"] = ev
            if ev["applies"]:
                gate = False  # D-296: selisih terbukti hanya skala teks px/pt acuan -> DIAGNOSIS
                extra["verdictReason"] = F007_REASON
                ck.note("f007", ev)
        ck.add("size", size_ok, gate, list(ga.shape), list(gb.shape))
        ck.add("ssim", s_native >= th["ssimMin"], gate, None, r(s_native), th["ssimMin"])
        ck.add("pixelDiffPct", diff <= th["diffPctMax"], gate, None, r(diff, 3), th["diffPctMax"])
    else:
        if not size_ok:
            ck.note("size", {"ref": list(ga.shape), "node": list(gb.shape)})
        if "ssimFlag" in th and s_native < th["ssimFlag"]:
            ck.note("ssimFlag", {"ssim": r(s_native), "flagBelow": th["ssimFlag"]})

    return {
        "size": {"ref": list(ga.shape), "node": list(gb.shape), "identical": size_ok},
        "dpi": {"ref": dpi_a, "node": dpi_b, "assumedWhenMissing": DEFAULT_DPI},
        "ssim": r(s_native),
        "ssim72": r(s72),
        "pixelDiffPct": r(diff, 3),
        "ssimMethod": "CAL (abu-abu MuPDF, jendela seragam 7x7 langkah 2); ukuran beda dipotong ke ukuran bersama",
        **extra,
    }
