"""Bangun bundel fon render SemiBold (S99, F-001) dengan fontTools.

Wajah SemiBold Plex didaftarkan sebagai gaya Bold keluarga yang diminta DOCX, sehingga
permintaan tebal (w:b) dirender dengan wajah SemiBold seperti PDF acuan (LibreOffice 24.2 di
Linux/fontconfig). Bundel TIDAK dipasang ke sistem: dimuat per job oleh soffice (lihat README).

Set yang dibangun (subfolder `fonts/<set>/`):
- `same`    : nama keluarga persis seperti DOCX (`IBM Plex Serif`, `IBM Plex Mono`,
              `IBM Plex Sans Cond`, `IBM Plex Sans`) + Inter-Regular.
- `renamed` : nama keluarga unik `S99 <keluarga DOCX>` (tidak bertabrakan dengan fon per-user
              terpasang); dipakai bersama penulisan ulang nama fon pada salinan DOCX per job.

Sumber Plex: `datum-revl/assets/fonts` (identik byte dengan fon tertanam BM.docx, subset).
Sumber Inter: fon per-user terpasang `Inter-Regular.ttf` (manifest S91).
Nama PostScript (nameID 6) dipertahankan agar nama fon di PDF sama dengan acuan.

Pakai:  VENV -I -B render-env/semibold-bundle/build_bundle.py [--src <dir>] [--inter <ttf>]
Keluaran: fonts/<set>/*.ttf dan bundle_manifest.json. Exit 0 sukses, 1 galat, 2 salah pakai.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import fontTools
from fontTools.ttLib import TTFont

HERE = Path(__file__).resolve().parent
DEFAULT_SRC = Path(r"C:\Users\TRIAL\AppData\Local\hermes\profiles\gspuser02\skills\datum-revl\assets\fonts")
DEFAULT_INTER = Path(r"C:\Users\TRIAL\AppData\Local\Microsoft\Windows\Fonts\Inter-Regular.ttf")

# keluarga DOCX -> prefiks berkas sumber
FAMILIES = {
    "IBM Plex Serif": "IBMPlexSerif",
    "IBM Plex Mono": "IBMPlexMono",
    "IBM Plex Sans Cond": "IBMPlexSansCond",
    "IBM Plex Sans": "IBMPlexSans",
}
# gaya terdaftar -> (akhiran berkas sumber, bobot, tebal, miring)
STYLES = {
    "Regular": ("Regular", 400, False, False),
    "Italic": ("Italic", 400, False, True),
    "Bold": ("SemiBold", 700, True, False),
    "Bold Italic": ("SemiBoldItalic", 700, True, True),
}
SETS = {"same": "", "renamed": "S99 ", "graft": "", "symfix": ""}
DROP_NAME_IDS = (1, 2, 3, 4, 16, 17, 21, 22)
DEFAULT_DEJAVU = Path(r"C:\Users\TRIAL\AppData\Local\Microsoft\Windows\Fonts\DejaVuSans.ttf")
DEFAULT_OPENSYMBOL = Path(r"C:\Program Files\LibreOffice\program\resource\common\fonts\opens___.ttf")
# Set `symfix`: `same` + salinan OpenSymbol (bawaan LO) yang glif U+2502-nya diganti glif DejaVu Sans
# (bentuk dan lebar); ditanam per job sebagai "OpenSymbol" agar fallback Windows (OpenSymbol) selebar
# fallback acuan (DejaVu Sans) tanpa memindahkan glif ke span lain.
SYMFIX_CPS = (0x2502,)
# Set `graft`: glif fallback yang di acuan (fontconfig Linux) diambil dari DejaVu Sans / Inter, sedangkan
# LibreOffice Windows memilih OpenSymbol / Segoe UI (lebar beda -> pemenggalan baris beda, hlm 18).
# Glif donor ditanam ke wajah IBM Plex Serif Regular (satu-satunya wajah yang memintanya di BM.docx).
GRAFTS = {("IBMPlexSerif", "Regular"): (("dejavu", 0x2502), ("inter", 0x03C6), ("inter", 0x221A))}


def graft(font: TTFont, donors: dict, items) -> list:
    from fontTools.pens.recordingPen import DecomposingRecordingPen
    from fontTools.pens.transformPen import TransformPen
    from fontTools.pens.ttGlyphPen import TTGlyphPen

    for tag in ("hdmx", "LTSH", "VDMX"):  # tabel per-glif yang tidak diperbarui otomatis
        if tag in font:
            del font[tag]
    order = list(font.getGlyphOrder())
    done = []
    for donor_key, cp in items:
        donor = donors[donor_key]
        dname = donor.getBestCmap()[cp]
        scale = font["head"].unitsPerEm / donor["head"].unitsPerEm
        rec = DecomposingRecordingPen(donor.getGlyphSet())
        donor.getGlyphSet()[dname].draw(rec)
        pen = TTGlyphPen(None)
        rec.replay(TransformPen(pen, (scale, 0, 0, scale, 0, 0)))
        gname = f"s99uni{cp:04X}"
        glyph = pen.glyph()
        order.append(gname)
        font.setGlyphOrder(order)
        font["glyf"][gname] = glyph
        glyph.recalcBounds(font["glyf"])
        adv = round(donor["hmtx"][dname][0] * scale)
        font["hmtx"][gname] = (adv, getattr(glyph, "xMin", 0))
        for t in font["cmap"].tables:
            if t.isUnicode():
                t.cmap[cp] = gname
        done.append({"codepoint": f"U+{cp:04X}", "donor": donor_key, "advance": adv})
    return done


def sha256(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def symfix(src: Path, dst: Path, dejavu: TTFont) -> dict:
    from fontTools.pens.recordingPen import DecomposingRecordingPen
    from fontTools.pens.ttGlyphPen import TTGlyphPen

    f = TTFont(str(src))
    if f["head"].unitsPerEm != dejavu["head"].unitsPerEm:
        raise ValueError("unitsPerEm OpenSymbol dan DejaVu berbeda; skala belum didukung")
    cm, dcm = f.getBestCmap(), dejavu.getBestCmap()
    swapped = []
    for cp in SYMFIX_CPS:
        gname, dname = cm[cp], dcm[cp]
        rec = DecomposingRecordingPen(dejavu.getGlyphSet())
        dejavu.getGlyphSet()[dname].draw(rec)
        pen = TTGlyphPen(None)
        rec.replay(pen)
        glyph = pen.glyph()
        f["glyf"][gname] = glyph
        glyph.recalcBounds(f["glyf"])
        adv = dejavu["hmtx"][dname][0]
        f["hmtx"][gname] = (adv, getattr(glyph, "xMin", 0))
        swapped.append({"codepoint": f"U+{cp:04X}", "glyph": gname, "donor": "dejavu", "advance": adv})
    dst.parent.mkdir(parents=True, exist_ok=True)
    f.save(str(dst))
    g = TTFont(str(dst), lazy=True)
    return {
        "file": str(dst.relative_to(HERE)).replace("\\", "/"),
        "source": str(src),
        "sourceSha256": sha256(src),
        "sha256": sha256(dst),
        "family": g["name"].getDebugName(1),
        "subfamily": g["name"].getDebugName(2),
        "fullName": g["name"].getDebugName(4),
        "postScriptName": g["name"].getDebugName(6),
        "usWeightClass": g["OS/2"].usWeightClass,
        "numGlyphs": g["maxp"].numGlyphs,
        "grafted": swapped,
    }


def relabel(src: Path, dst: Path, family: str, style: str, weight: int, bold: bool, italic: bool,
            donors: dict | None = None, grafts=()) -> dict:
    f = TTFont(str(src))
    grafted = graft(f, donors, grafts) if grafts else []
    name = f["name"]
    ps = name.getDebugName(6)
    name.names = [r for r in name.names if r.nameID not in DROP_NAME_IDS]
    full = family if style == "Regular" else f"{family} {style}"
    for nid, val in ((1, family), (2, style), (3, f"S99;{ps};{family};{style}"), (4, full)):
        name.setName(val, nid, 3, 1, 0x409)
        name.setName(val, nid, 1, 0, 0)
    os2 = f["OS/2"]
    os2.usWeightClass = weight
    sel = os2.fsSelection & ~(1 | 1 << 5 | 1 << 6)
    sel |= (1 if italic else 0) | (1 << 5 if bold else 0) | (1 << 6 if not (bold or italic) else 0)
    os2.fsSelection = sel
    f["head"].macStyle = (f["head"].macStyle & ~3) | (1 if bold else 0) | (2 if italic else 0)
    dst.parent.mkdir(parents=True, exist_ok=True)
    f.save(str(dst))
    g = TTFont(str(dst), lazy=True)
    return {
        "file": str(dst.relative_to(HERE)).replace("\\", "/"),
        "source": src.name,
        "sourceSha256": sha256(src),
        "sha256": sha256(dst),
        "family": g["name"].getDebugName(1),
        "subfamily": g["name"].getDebugName(2),
        "fullName": g["name"].getDebugName(4),
        "postScriptName": g["name"].getDebugName(6),
        "usWeightClass": g["OS/2"].usWeightClass,
        "fsSelection": hex(g["OS/2"].fsSelection),
        "macStyle": g["head"].macStyle,
        "numGlyphs": g["maxp"].numGlyphs,
        "grafted": grafted,
    }


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Bangun bundel fon SemiBold-sebagai-Bold (S99).")
    ap.add_argument("--src", type=Path, default=DEFAULT_SRC, help="folder TTF Plex sumber")
    ap.add_argument("--inter", type=Path, default=DEFAULT_INTER, help="Inter-Regular.ttf")
    ap.add_argument("--dejavu", type=Path, default=DEFAULT_DEJAVU, help="DejaVuSans.ttf (donor glif set graft)")
    ap.add_argument("--opensymbol", type=Path, default=DEFAULT_OPENSYMBOL, help="OpenSymbol bawaan LO (set symfix)")
    a = ap.parse_args(argv)
    if not a.src.is_dir() or not all(p.is_file() for p in (a.inter, a.dejavu, a.opensymbol)):
        print(f"sumber tidak ada: {a.src} / {a.inter} / {a.dejavu} / {a.opensymbol}", file=sys.stderr)
        return 2
    faces = []
    try:
        donors = {"inter": TTFont(str(a.inter)), "dejavu": TTFont(str(a.dejavu))}
        for set_name, prefix in SETS.items():
            out = HERE / "fonts" / set_name
            for fam, stem in FAMILIES.items():
                for style, (suffix, weight, bold, italic) in STYLES.items():
                    src = a.src / f"{stem}-{suffix}.ttf"
                    dst = out / f"{stem}-{style.replace(' ', '')}.ttf"
                    items = GRAFTS.get((stem, style), ()) if set_name == "graft" else ()
                    rec = relabel(src, dst, prefix + fam, style, weight, bold, italic, donors, items)
                    rec["set"] = set_name
                    faces.append(rec)
            if set_name == "symfix":
                rec = symfix(a.opensymbol, out / "OpenSymbol.ttf", donors["dejavu"])
                rec["set"] = set_name
                faces.append(rec)
            inter = out / "Inter-Regular.ttf"
            inter.write_bytes(a.inter.read_bytes())
            faces.append({"set": set_name, "file": str(inter.relative_to(HERE)).replace("\\", "/"),
                          "source": a.inter.name, "sourceSha256": sha256(a.inter), "sha256": sha256(inter),
                          "family": "Inter", "subfamily": "Regular", "fullName": "Inter Regular",
                          "postScriptName": "Inter-Regular", "usWeightClass": 400})
    except Exception as e:  # galat baca/tulis fon dilaporkan terstruktur
        print(f"pembangunan bundel gagal: {type(e).__name__}: {e}", file=sys.stderr)
        return 1
    man = {
        "schema": "studio.render-env.semibold-bundle/v1",
        "builtAt": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "fontTools": fontTools.version,
        "sourceDir": str(a.src),
        "faces": faces,
    }
    (HERE / "bundle_manifest.json").write_text(json.dumps(man, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    for r in faces:
        print(f"{r['set']:8} {r['file']:44} family={r['family']!r} sub={r['subfamily']!r} "
              f"ps={r['postScriptName']} w={r['usWeightClass']}"
              + (f" graft={[g['codepoint'] for g in r['grafted']]}" if r.get("grafted") else ""))
    print(f"fontTools {fontTools.version}: {len(faces)} wajah")
    return 0


if __name__ == "__main__":
    sys.exit(main())
