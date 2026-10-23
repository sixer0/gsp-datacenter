"""SSIM seam for the benchmark harness (S96).

Spec 01_specs.md section 11: the SSIM method is CAL (7x7 window, stride 2,
grayscale, 72 dpi) and H06 reuses it from the S66 comparator in
`scripts/parity/compare/`. S66 is built in parallel, so this module looks for
an SSIM function there and falls back to a local copy of CAL when none is found
or when the candidate disagrees with CAL on a fixed probe.

The local fallback (label "TODO-S66") only guards against a missing or changed
S66 module; the report's BM4.ssimSource states which one was used.
"""
from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from typing import Callable

import numpy as np

REPO_ROOT = Path(__file__).resolve().parents[3]
S66_DIR = REPO_ROOT / "scripts" / "parity" / "compare"

# (file in scripts/parity/compare, function name) tried in order.
# S66 landed `scripts/parity/compare/ssim_cal.py` exporting `ssim_cal(x, y)`
# (verified 2026-10-22: passes the CAL probe below).
CANDIDATES: tuple[tuple[str, str], ...] = (
    ("ssim_cal.py", "ssim_cal"),
)


def ssim_cal_local(x: np.ndarray, y: np.ndarray) -> float:
    """Verbatim CAL method (calib_compare.py): mean SSIM over 7x7 windows taken
    every 2 px, constants C1=(0.01*255)^2, C2=(0.03*255)^2. TODO-S66 fallback."""
    from numpy.lib.stride_tricks import sliding_window_view as sw

    x = x.astype(np.float64)
    y = y.astype(np.float64)
    c1, c2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2

    def m(a: np.ndarray) -> np.ndarray:
        k = sw(a, (7, 7))[::2, ::2]
        return k.mean(axis=(-1, -2))

    mx, my = m(x), m(y)
    vx = m(x * x) - mx ** 2
    vy = m(y * y) - my ** 2
    cxy = m(x * y) - mx * my
    return float((((2 * mx * my + c1) * (2 * cxy + c2)) / ((mx ** 2 + my ** 2 + c1) * (vx + vy + c2))).mean())


def _probe_ok(fn: Callable[[np.ndarray, np.ndarray], float]) -> bool:
    rng = np.random.default_rng(17)
    a = rng.integers(0, 256, size=(64, 48), dtype=np.uint8)
    b = np.clip(a.astype(np.int16) + rng.integers(-40, 41, size=a.shape), 0, 255).astype(np.uint8)
    try:
        return abs(float(fn(a, b)) - ssim_cal_local(a, b)) < 1e-9 and abs(float(fn(a, a)) - 1.0) < 1e-12
    except Exception:  # candidate with an incompatible signature
        return False


def load_ssim() -> tuple[Callable[[np.ndarray, np.ndarray], float], str, list[str]]:
    """Return (ssim_fn, source_label, notes)."""
    notes: list[str] = []
    if S66_DIR.is_dir():
        for fname, func in CANDIDATES:
            path = S66_DIR / fname
            if not path.is_file():
                continue
            mod_name = f"_s96_s66_{path.stem}"
            try:
                spec = importlib.util.spec_from_file_location(mod_name, path)
                if spec is None or spec.loader is None:
                    continue
                mod = sys.modules.get(mod_name)
                if mod is None:
                    mod = importlib.util.module_from_spec(spec)
                    # S66 modules may import their siblings.
                    sys.path.insert(0, str(S66_DIR))
                    try:
                        spec.loader.exec_module(mod)
                    finally:
                        sys.path.remove(str(S66_DIR))
                    sys.modules[mod_name] = mod
            except Exception as exc:  # noqa: BLE001 - report and keep looking
                notes.append(f"import {path.name} failed: {type(exc).__name__}: {exc}")
                continue
            fn = getattr(mod, func, None)
            if not callable(fn):
                continue
            if _probe_ok(fn):
                return fn, f"S66 {path.relative_to(REPO_ROOT).as_posix()}:{func}", notes
            notes.append(f"{path.name}:{func} disagrees with CAL probe; ignored")
    else:
        notes.append(f"{S66_DIR.relative_to(REPO_ROOT).as_posix()} not present")
    notes.append("using local CAL copy (TODO-S66)")
    return ssim_cal_local, "local-fallback CAL (TODO-S66)", notes
