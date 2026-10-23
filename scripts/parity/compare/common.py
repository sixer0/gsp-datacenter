"""Pembantu bersama pembanding: pencatat cek dan vonis CompareReport (spesifikasi §11 H04)."""
from __future__ import annotations

from typing import Any

MAX_DIFF_ITEMS = 50


class Checks:
    """Kumpulan cek. Cek `gate=True` menentukan vonis; cek diagnosis hanya dilaporkan."""

    def __init__(self) -> None:
        self.items: list[dict[str, Any]] = []
        self.diffs: list[dict[str, Any]] = []

    def add(self, cid: str, ok: bool, gate: bool, ref: Any = None, node: Any = None,
            threshold: Any = None, detail: Any = None) -> bool:
        item = {"id": cid, "pass": bool(ok), "gate": bool(gate)}
        if threshold is not None:
            item["threshold"] = threshold
        self.items.append(item)
        if not ok:
            d: dict[str, Any] = {"check": cid, "gate": bool(gate), "ref": ref, "node": node}
            if threshold is not None:
                d["threshold"] = threshold
            if detail is not None:
                d["detail"] = clip(detail)
            self.diffs.append(d)
        return bool(ok)

    def note(self, cid: str, detail: Any) -> None:
        """Selisih informatif tanpa lulus/gagal (mis. hipotesis klasifikasi)."""
        self.diffs.append({"check": cid, "gate": False, "info": True, "detail": clip(detail)})

    def verdict(self) -> str:
        gates = [c for c in self.items if c["gate"]]
        if any(not c["pass"] for c in gates):
            return "FAIL"
        return "PASS" if gates else "DIAGNOSIS"


def clip(v: Any, n: int = MAX_DIFF_ITEMS) -> Any:
    if isinstance(v, list) and len(v) > n:
        return v[:n] + [f"... {len(v) - n} butir lagi"]
    if isinstance(v, dict):
        return {k: clip(x, n) for k, x in v.items()}
    return v


def multiset_diff(a: list[Any], b: list[Any]) -> dict[str, list[Any]]:
    from collections import Counter

    ca, cb = Counter(a), Counter(b)
    only_a = sorted(((ca - cb).elements()), key=str)
    only_b = sorted(((cb - ca).elements()), key=str)
    return {"onlyRef": only_a, "onlyNode": only_b}


def r(x: float | None, n: int = 4) -> float | None:
    return None if x is None else round(float(x), n)
