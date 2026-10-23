"""Pembanding kalibrasi render-env (S91): PDF acuan lawan PDF render lokal, metode CAL.

Port CAL (research/05) memakai ulang modul S66 `scripts/parity/compare/ssim_cal.py` lewat impor,
tidak disalin. Jalankan dengan VENV -I -B (sys.path diisi eksplisit di bawah).

Pakai:
    VENV -I -B render-env/compare_cal.py --ref <acuan.pdf> --pdf <lokal.pdf> --out <hasil.json>

Keluaran JSON: {at, ref, pdf, refPages, nodePages, textIdenticalPages, ssimMean, ssimMin,
pagesSsimGe098, perPage: [{page, textIdentical, ssim}], textMismatchPages, lowSsimPages}.
Exit 0 hasil tertulis, 1 galat baca/banding, 2 salah pakai.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "scripts" / "parity" / "compare"))

from ssim_cal import compare_pdf_pages  # noqa: E402  (S66, D-28)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Bandingkan PDF lokal ke PDF acuan (metode CAL).")
    ap.add_argument("--ref", required=True, help="PDF acuan (BM.pdf)")
    ap.add_argument("--pdf", required=True, help="PDF hasil render lokal")
    ap.add_argument("--out", required=True, help="berkas JSON hasil")
    a = ap.parse_args(argv)
    for p in (a.ref, a.pdf):
        if not Path(p).is_file():
            print(f"berkas tidak ada: {p}", file=sys.stderr)
            return 2
    try:
        r = compare_pdf_pages(a.ref, a.pdf)
    except Exception as e:  # galat baca PDF dilaporkan terstruktur, bukan jejak mentah saja
        print(f"perbandingan gagal: {type(e).__name__}: {e}", file=sys.stderr)
        return 1
    r["at"] = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    r["ref"] = str(Path(a.ref).resolve())
    r["pdf"] = str(Path(a.pdf).resolve())
    r["textMismatchPages"] = [p["page"] for p in r["perPage"] if not p["textIdentical"]]
    r["lowSsimPages"] = [
        {"page": p["page"], "ssim": round(p["ssim"], 4)} for p in r["perPage"] if p["ssim"] < 0.98
    ]
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    Path(a.out).write_text(json.dumps(r, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(
        f"halaman ref={r['refPages']} lokal={r['nodePages']} teks identik={r['textIdenticalPages']}"
        f" SSIM rata={r['ssimMean']:.4f} min={r['ssimMin']:.4f} >=0,98={r['pagesSsimGe098']}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
