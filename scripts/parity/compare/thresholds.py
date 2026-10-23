"""Ambang paritas per format dan kelas (research/06 §6.2 dan §6.4; spesifikasi §11 H04).

Setiap nilai dapat ditimpa dari CLI dengan `--threshold KUNCI=NILAI` (mis. kalibrasi ulang lantai
derau PD sesuai §6.4-N3). Kunci yang tidak dikenal untuk pasangan format/kelas ditolak (exit 2).
"""
from __future__ import annotations

import copy
from typing import Any

# Kelas sah per format (H04). Kombinasi lain = salah pakai (exit 2).
VALID: dict[str, tuple[str, ...]] = {
    "docx": ("DX",),
    "pdf": ("PD",),
    "svg": ("CA", "CB1", "CB2", "CC", "DG", "SY"),
    "png": ("CA", "CB1", "CB2", "CC", "DG", "SY", "HT"),
}

_SVG: dict[str, dict[str, Any]] = {
    # CA: datumchart lawan port Node; semua cek gerbang.
    "CA": {
        "tagCountDelta": 0,
        "markCountDelta": 0,
        "colorSetIdentical": True,
        "axesIdentical": True,
        "zeroBaselineRequired": True,
        "geomTolMm": 0.05,
        "rootTolMm": 0.01,
        "fontSetIdentical": True,
        "fontMinPt": 5.5,
        "refFontNominalPt": True,  # §6.4-N1: angka font-size DC dibaca sebagai pt nominal
        "textMultisetIdentical": True,
    },
    # CB1: pustakachart PENUH; (a)(b)(d)(e)(f) gerbang, (c) domain/tick diagnosis.
    "CB1": {
        "markCountDelta": 0,
        # R01/F-050: (a)/(b) tanda hanya gerbang bila sumber klasifikasi sama; acuan matplotlib lawan
        # `data-mark` Node = diagnosis. `true` memulihkan gerbang lintas sumber (keputusan controller).
        "markGateCrossSource": False,
        "markColorMultisetIdentical": True,
        "accentMax": 1,
        "accentColor": "#B45309",
        "axisCountIdentical": True,
        "axisOrientationIdentical": True,
        "zeroBaselineRequired": True,
        "domainTolPct": 5.0,
        "tickCountTol": 2,
        "widthMmAllowed": [128.0, 166.0],
        "widthTolMm": 0.01,
        "expectHeightMm": None,  # tinggi_mm registri PC; bila diisi, gerbang +/- heightTolMm
        "heightTolMm": 3.0,
        "fontMinPt": 5.5,
        "fontRefMarginPt": 0.3,
        "labelSetIdentical": True,  # D-240: gerbang label isi (nama data + nilai data), lihat content_labels
        # D-246: nama data digerbang hanya bila acuan juga menampilkannya (nilai data selalu digerbang);
        # false = D-240 harfiah (semua nama data wajib ada di Node)
        "labelNamesRequireRef": True,
    },
    # CB2: pustakachart PARSIAL; hanya (d) dan (e) dari CB1 sebagai gerbang.
    "CB2": {
        "widthMmAllowed": [128.0, 166.0],
        "widthTolMm": 0.01,
        "expectHeightMm": None,
        "heightTolMm": 3.0,
        "fontMinPt": 5.5,
        "fontRefMarginPt": 0.3,
    },
    # CC: tanpa acuan; --ref = snapshot SVG Node beku (regresi), kanonik harus identik.
    "CC": {"snapshotIdentical": True},
    # DG: diagram Garis A.
    "DG": {
        "tagCountDelta": 0,
        "markCountDelta": 0,
        "colorSetIdentical": True,
        "colorMax": 5,  # F-S78-1: aturan DATUM-25 mesin dari laporan mesin; tanpa laporan = diagnosis
        "engineReportIdentical": True,  # F-S78-5: checks_run, n_nodes, n_edges, n_hops identik (research/06 DG)
        "dashMultisetIdentical": True,
        "textMultisetIdentical": True,
        "rootTolMm": 0.1,
        "geomTolMm": 0.1,
        # D-242/D-298: kelas vonis diagram resmi = bukan byte Python (compare_dg_d242). `d.rootSize` dan
        # `geometry` terhadap Python menjadi diagnosis; `d242Class=false` memulihkan gerbang byte Python.
        "d242Class": True,
        "d242TolL": 0.02,  # toleransi baseline untuk tinggi simpul dan margin kelipatan baseline
        # Rasio tinggi simpul Node/Python per famili: K-1 (D-242) Python menggandakan satuan tinggi -> 1/2;
        # graph D-288 baris teks + 1 baseline (Python 6 L -> 2 L) -> 1/3; rack tidak diubah D-242 -> 1.
        "d242NodeHeightRatio": {"flow": 0.5, "stack": 0.5, "layered": 0.5, "topology": 0.5, "sld": 0.5,
                                "sequence": 0.5, "swimlane": 0.5, "graph": 1.0 / 3.0, "rack": 1.0},
    },
    # SY: simbol.
    "SY": {
        "tagCountDelta": 0,
        "colorSetIdentical": True,
        "strokeWidthMultisetIdentical": True,
        "viewBoxIdentical": True,
        "rootTolMm": 0.01,
        "geomTolMm": 0.01,
        "portTolMm": 0.01,  # F-S78-4: port +/- 0,01 mm (research/06 SY), butuh konteks `ports`
    },
}

_PNG: dict[str, dict[str, Any]] = {
    # CA: F-007/D-296 (R5) - gerbang gagal yang terbukti hanya akibat font-size px acuan (SVG CA lulus,
    # acuan ternormalkan f007Scale lulus ambang) = DIAGNOSIS beralasan; `f007PxPtNormalize=false` mematikan.
    "CA": {"ssimMin": 0.995, "diffPctMax": 0.5, "lumaDelta": 32, "gate": True,
           "f007PxPtNormalize": True, "f007Scale": 4.0 / 3.0},
    # DG: D-242/D-298 - raster Python berbeda tinggi menurut rancangan -> SSIM/diff lawan Python = diagnosis;
    # gerbang = integritas raster Node (ukuran px = akar SVG Node pada dpi PNG, +/- d242RasterTolPx) bila
    # konteks `d242.nodeSvg` diberikan. `d242Class=false` memulihkan gerbang SSIM lawan Python.
    # Toleransi 4 px = 1 px CSS pada 300 dpi (perasteran Node membulatkan ke bawah px CSS, mis. 1293,7 -> 1291).
    "DG": {"ssimMin": 0.99, "diffPctMax": 1.0, "lumaDelta": 32, "gate": True, "d242Class": True, "d242RasterTolPx": 4},
    "SY": {"ssimMin": 0.995, "diffPctMax": 0.5, "lumaDelta": 32, "gate": True},
    # CB: rasterisator berbeda (Agg lawan Skia) -> diagnosis; bendera bila SSIM < 0,70 (§6.4-N4).
    "CB1": {"ssimFlag": 0.70, "lumaDelta": 32, "gate": False},
    "CB2": {"ssimFlag": 0.70, "lumaDelta": 32, "gate": False},
    # CC/HT: snapshot regresi tangkapan Chromium -> dilaporkan saja.
    "CC": {"lumaDelta": 32, "gate": False},
    "HT": {"lumaDelta": 32, "gate": False},
}

_DOCX = {
    "DX": {
        # D-120 (opsi a): DX lawan Garis A = DIAGNOSIS; metrik tetap dihitung, kebenaran struktur dokumen
        # dibuktikan S98 (BM.docx, D-17) + uji unit S72. `gate=true` memulihkan gerbang (fon tertanam tidak).
        "gate": False,
        "textOrderIdenticalPct": 100.0,
        "countsIdentical": True,
        "sectPrIdentical": True,
        "runPropsMatchPctMin": 98.0,
        "embeddedFontsIdentical": True,
        # R02/F-056: Node selalu menanam fon (R-08), acuan Garis A tidak -> kelas artefak acuan, diagnosis.
        "embeddedFontsGate": False,
    }
}

_PDF = {
    "PD": {
        # D-299 (PD-1, analog D-120): PD lawan acuan Garis A = DIAGNOSIS (DOCX acuan tanpa lembar kendali/
        # TOC/pembatas bagian). Kontrol mesin-sama (DOCX sama, dua jalur soffice) WAJIB `gate=true` -> PASS.
        "gate": False,
        "pageCountDelta": 0,
        "textIdenticalPagesPct": 100.0,
        "embeddedFontsIdentical": True,
        "embeddedFontsGate": False,  # R02/F-056: kelas artefak acuan (DOCX acuan tanpa fon tertanam)
        "ssimMeanMin": 0.99,
        "ssimMinMin": 0.97,
        "dpi": 72,
    }
}

_TABLE = {"svg": _SVG, "png": _PNG, "docx": _DOCX, "pdf": _PDF}


def get(fmt: str, cls: str) -> dict[str, Any]:
    return copy.deepcopy(_TABLE[fmt][cls])


def _coerce(raw: str, current: Any) -> Any:
    low = raw.strip().lower()
    if isinstance(current, bool) or low in ("true", "false"):
        if low not in ("true", "false"):
            raise ValueError(f"nilai boolean tidak sah: {raw}")
        return low == "true"
    if isinstance(current, list):
        return [float(x) for x in raw.split(",") if x.strip()]
    if low in ("none", "null", ""):
        return None
    if isinstance(current, str):
        return raw
    if isinstance(current, int) and not isinstance(current, bool) and "." not in raw:
        return int(raw)
    return float(raw)


def apply_overrides(th: dict[str, Any], pairs: list[str]) -> dict[str, Any]:
    for p in pairs:
        if "=" not in p:
            raise ValueError(f"--threshold harus KUNCI=NILAI: {p}")
        k, v = p.split("=", 1)
        k = k.strip()
        if k not in th:
            raise ValueError(f"kunci ambang tidak dikenal untuk kelas ini: {k} (sah: {', '.join(sorted(th))})")
        th[k] = _coerce(v, th[k])
    return th
