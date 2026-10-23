"""Pembanding PDF (kelas PD): jumlah halaman, teks per halaman, SSIM CAL per halaman, fon tertanam.

D-299 (PD-1, konsisten D-120): PD lawan acuan Garis A = DIAGNOSIS (ambang `gate` False); metrik tetap
dihitung dan alasan dicatat (`verdictReason`): DOCX acuan Garis A tanpa lembar kendali, TOC, dan pembatas
bagian. Kebenaran PDF dibuktikan kontrol mesin-sama (DOCX yang sama lewat dua jalur soffice) yang WAJIB
dijalankan dengan `--threshold gate=true` (harus PASS) + benchmark BM4. Fon tertanam tetap diagnosis
(F-056) kecuali `embeddedFontsGate=true`.
"""
from __future__ import annotations

import re
from typing import Any

import pymupdf

from common import Checks, r
from ssim_cal import compare_pdf_pages

_SUBSET = re.compile(r"^[A-Z]{6}\+")
PD_DIAGNOSIS_REASON = "D-299 PD-1: acuan Garis A tanpa lembar kendali/TOC/pembatas bagian (kelas D-120)"


def embedded_fonts(doc: "pymupdf.Document") -> list[str]:
    """Himpunan nama fon tertanam, awalan subset (`ABCDEF+`) dibuang agar stabil antar-run."""
    names = set()
    for page in doc:
        for f in page.get_fonts(full=False):
            ext, base = f[1], f[3]
            if ext and ext != "n/a":
                names.add(_SUBSET.sub("", base))
    return sorted(names)


def compare(ref: str, node: str, th: dict[str, Any], ck: Checks) -> dict[str, Any]:
    with pymupdf.open(ref) as a, pymupdf.open(node) as b:
        cal = compare_pdf_pages(a, b, dpi=int(th["dpi"]))
        fa, fb = embedded_fonts(a), embedded_fonts(b)
    g = bool(th.get("gate", True))  # D-299: PD lawan Garis A = diagnosis; kontrol mesin-sama gate=true

    n_common = min(cal["refPages"], cal["nodePages"])
    delta = abs(cal["refPages"] - cal["nodePages"])
    ck.add("pageCount", delta <= th["pageCountDelta"], g, cal["refPages"], cal["nodePages"],
           th["pageCountDelta"])

    pct = 100.0 * cal["textIdenticalPages"] / n_common if n_common else 0.0
    bad_text = [p["page"] for p in cal["perPage"] if not p["textIdentical"]]
    ck.add("textPerPage", pct >= th["textIdenticalPagesPct"], g, n_common,
           cal["textIdenticalPages"], th["textIdenticalPagesPct"], {"pagesDiffering": bad_text})

    fonts_ok = fa == fb
    # R02/F-056: acuan Garis A tidak menanam fon, Node selalu (R-08) -> kelas artefak acuan (diagnosis)
    # kecuali `embeddedFontsGate=true`.
    ck.add("embeddedFonts", fonts_ok or not th["embeddedFontsIdentical"], g and bool(th.get("embeddedFontsGate", True)),
           fa, fb, None,
           {"onlyRef": [x for x in fa if x not in fb], "onlyNode": [x for x in fb if x not in fa],
            "class": "artefak acuan (F-056)"})

    mean, mn = cal["ssimMean"], cal["ssimMin"]
    ck.add("ssimMean", mean is not None and mean >= th["ssimMeanMin"], g, None, r(mean),
           th["ssimMeanMin"])
    low = [{"page": p["page"], "ssim": r(p["ssim"])} for p in cal["perPage"]
           if p["ssim"] < th["ssimMinMin"]]
    ck.add("ssimMin", mn is not None and mn >= th["ssimMinMin"], g, None, r(mn),
           th["ssimMinMin"], {"pagesBelow": low})

    return {
        "verdictClass": "gerbang" if g else "DIAGNOSIS",
        **({} if g else {"verdictReason": PD_DIAGNOSIS_REASON}),
        "pages": {"ref": cal["refPages"], "node": cal["nodePages"], "compared": n_common},
        "textIdenticalPages": cal["textIdenticalPages"],
        "textIdenticalPct": r(pct, 2),
        "ssimMethod": "CAL (abu-abu MuPDF, %d dpi, jendela seragam 7x7 langkah 2)" % int(th["dpi"]),
        "ssimMean": r(mean),
        "ssimMin": r(mn),
        "pagesSsimGe098": cal["pagesSsimGe098"],
        "perPage": [{"page": p["page"], "textIdentical": p["textIdentical"], "ssim": r(p["ssim"])}
                    for p in cal["perPage"]],
        "embeddedFonts": {"ref": fa, "node": fb},
    }
