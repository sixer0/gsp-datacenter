# -*- coding: utf-8 -*-
"""Pemuat modul skill DATUM read-only (S65).

Garis A (HS) dan Garis B (RL) punya nama berkas yang sama (mis.
datum_diagram.py), jadi setiap modul dimuat dari path absolutnya dengan nama
modul unik (`hs_*`, `rl_*`), tanpa menaruh folder RL di sys.path. Modul HS
sendiri menyisipkan foldernya untuk impor saudara (pustakachart_data,
datumbind); itu perilaku skill, bukan perubahan skill. Jalankan dengan
`python -I -B` agar tidak ada __pycache__ yang ditulis ke folder skill.
"""
import importlib.util
import os
import sys

HS_DIR = os.environ.get("DATUM_HS_DIR") or \
    r"C:\Users\TRIAL\AppData\Local\hermes\skills\gsp\datum-house-style"
RL_DIR = os.environ.get("DATUM_RL_DIR") or \
    r"C:\Users\TRIAL\AppData\Local\hermes\profiles\gspuser02\skills\datum-revl\scripts"


class SkillMissing(ImportError):
    pass


def _load(folder, filename, modname):
    if modname in sys.modules:
        return sys.modules[modname]
    path = os.path.join(folder, filename)
    if not os.path.isfile(path):
        raise SkillMissing("berkas skill tidak ada: %s" % path)
    spec = importlib.util.spec_from_file_location(modname, path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[modname] = mod
    try:
        spec.loader.exec_module(mod)
    except BaseException:
        sys.modules.pop(modname, None)
        raise
    return mod


def load_hs(filename, modname):
    return _load(HS_DIR, filename, modname)


def load_rl(filename, modname):
    return _load(RL_DIR, filename, modname)


def source_paths():
    return {"HS": HS_DIR, "RL": RL_DIR}
