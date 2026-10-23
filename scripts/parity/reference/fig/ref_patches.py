# -*- coding: utf-8 -*-
"""Tambalan terarah acuan figur di dalam proses adapter (INT-L, butir IP-29).

Berkas skill tidak diubah. Setiap tambalan:
- hanya aktif selama satu panggilan fungsi acuan yang rusak (context manager,
  dipulihkan di `finally`);
- hanya dipasang bila ekspresi rusak masih ada di sumber skill (bila skill
  sudah diperbaiki di hulu, tambalan tidak dipasang dan laporan mencatatnya);
- dicatat di `ref_report.json` -> `patches` agar laporan paritas jujur.

PT-01 `pustakachart._stack_rows` (K-01, total100=False)
    pustakachart.py `ax.set_xlim(0, max(np.sum(np.array(r) for r in parts)) ...)`.
    numpy 2.x melempar TypeError untuk `np.sum(generator)`. numpy < 2
    (fromnumeric.sum: `isinstance(a, _gentype)` -> `_sum_(a)`) memanggil
    builtin `sum` atas generator itu, dengan DeprecationWarning. Tambalan
    mengganti global `np` modul acuan dengan proksi yang meneruskan semua
    atribut ke numpy, kecuali `sum(<generator>)` tanpa argumen lain yang
    dialihkan ke `builtins.sum` -> hasil numerik identik dengan jalur lama.
"""
import builtins
import contextlib
import inspect
import types

PT01_EXPR = "np.sum(np.array(r) for r in parts)"


class _LegacyGenSumNumpy:
    """Proksi numpy: hanya `sum(<generator>)` memakai jalur numpy < 2."""

    def __init__(self, np):
        self._np = np
        self.hits = 0

    def __getattr__(self, name):
        return getattr(self._np, name)

    def sum(self, a, *args, **kwargs):
        if isinstance(a, types.GeneratorType) and not args and not kwargs:
            self.hits += 1
            return builtins.sum(a)          # = numpy<2 `_sum_(a)`, tanpa DeprecationWarning
        return self._np.sum(a, *args, **kwargs)


def _site(fn, expr):
    """(berkas, baris) ekspresi `expr` di sumber `fn`, atau None bila tak ada."""
    try:
        lines, start = inspect.getsourcelines(fn)
        path = inspect.getsourcefile(fn)
    except (OSError, TypeError):
        return None
    for i, line in enumerate(lines):
        if expr in line:
            return path, start + i
    return None


@contextlib.contextmanager
def stack_rows_legacy_sum(pc, total100, patches):
    """PT-01: pasang proksi numpy di modul `pc` selama `_stack_rows(total100=False)`.

    `patches` (list laporan) diisi satu entri. Untuk total100=True ekspresi
    rusak tidak dievaluasi (cabang `else 100`), jadi tidak ada yang dipasang.
    """
    if total100:
        yield None
        return
    entry = {"id": "PT-01", "row": "INT-L", "item": "IP-29",
             "target": "pustakachart._stack_rows", "expression": PT01_EXPR,
             "trigger": "total100=False (K-01)",
             "problem": "numpy %s menolak np.sum(generator) (TypeError)" % pc.np.__version__,
             "replacement": "builtins.sum(generator), sama dengan jalur numpy<2 "
                            "(fromnumeric.sum: _gentype -> _sum_); argumen lain diteruskan ke numpy",
             "scope": "global `np` modul pustakachart diganti proksi hanya selama panggilan ini; "
                      "dipulihkan di finally",
             "skillFileModified": False}
    site = _site(pc._stack_rows, PT01_EXPR)
    if site is None:
        entry.update(applied=False, hits=0,
                     note="ekspresi rusak tidak ditemukan di sumber skill; tambalan tidak dipasang")
        patches.append(entry)
        yield None
        return
    entry["site"] = "%s:%d" % site
    real = pc.np
    proxy = _LegacyGenSumNumpy(real)
    pc.np = proxy
    try:
        yield proxy
    finally:
        pc.np = real
        entry.update(applied=True, hits=proxy.hits)
        patches.append(entry)
