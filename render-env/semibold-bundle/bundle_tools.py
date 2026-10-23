"""Alat bantu kalibrasi bundel SemiBold (S99). Dijalankan oleh calibrate_bundle.mjs dengan VENV -I -B.

Subperintah:
  prep-docx --in <docx> --out <docx> --mode {embed,rename,rename-embed} --set-dir <fonts/<set>>
      Menyiapkan SALINAN DOCX per job (berkas asli tidak pernah diubah):
      - embed        : ganti fon tertanam keluarga Plex di word/fonts/*.odttf dengan wajah bundel
                       (slot embedBold/embedBoldItalic = SemiBold berlabel Bold), kunci obfuskasi sama.
      - rename       : tulis ulang nama fon Plex di word/*.xml menjadi `S99 <nama>` (atribut persis).
      - rename-embed : rename + embed (bundel set `renamed`).
      --extra-font KELUARGA=TTF menanam fon tambahan sebagai keluarga baru (mis. OpenSymbol set `symfix`).
  pdf-fonts --pdf <pdf>
      Cetak JSON daftar fon tertanam di PDF (nama dasar tanpa awalan subset, jenis).
Exit 0 sukses, 1 galat, 2 salah pakai.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import uuid
import zipfile
from pathlib import Path

PLEX = ("IBM Plex Serif", "IBM Plex Mono", "IBM Plex Sans Cond", "IBM Plex Sans")
STEM = {"IBM Plex Serif": "IBMPlexSerif", "IBM Plex Mono": "IBMPlexMono",
        "IBM Plex Sans Cond": "IBMPlexSansCond", "IBM Plex Sans": "IBMPlexSans"}
SLOT = {"embedRegular": "Regular", "embedItalic": "Italic", "embedBold": "Bold", "embedBoldItalic": "BoldItalic"}
FONT_RE = re.compile(r'(<w:font w:name=")([^"]+)(">)(.*?)(</w:font>)', re.S)
EMBED_RE = re.compile(r"<w:(embed\w+) ([^>]*)/>")
FONT_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/font"


def _obfuscate(data: bytes, key: str) -> bytes:
    k = bytes.fromhex(key.strip("{}").replace("-", ""))[::-1]
    b = bytearray(data)
    for i in range(32):
        b[i] ^= k[i % 16]
    return bytes(b)


def _rename_xml(xml: str) -> str:
    # atribut bernilai persis nama keluarga Plex (urut terpanjang dulu tidak perlu: pencocokan utuh)
    return re.sub(r'="(%s)"' % "|".join(re.escape(f) for f in PLEX), lambda m: f'="S99 {m.group(1)}"', xml)


def prep_docx(src: Path, dst: Path, mode: str, set_dir: Path, extra=None) -> dict:
    zin = zipfile.ZipFile(src)
    files = {i.filename: zin.read(i.filename) for i in zin.infolist()}
    infos = {i.filename: i for i in zin.infolist()}
    ft = files["word/fontTable.xml"].decode("utf-8")
    rels = files.get("word/_rels/fontTable.xml.rels", b"").decode("utf-8")
    rid2target = {}
    for m in re.finditer(r"<Relationship ([^>]*)/>", rels):
        a = dict(re.findall(r'(\w+)="([^"]*)"', m.group(1)))
        rid2target[a.get("Id")] = a.get("Target")
    replaced = []
    if mode in ("embed", "rename-embed"):
        for m in FONT_RE.finditer(ft):
            fam = m.group(2)
            if fam not in PLEX:
                continue
            for slot, attrs in EMBED_RE.findall(m.group(4)):
                a = dict(re.findall(r'([\w:]+)="([^"]*)"', attrs))
                target = rid2target[a["r:id"]]
                face = set_dir / f"{STEM[fam]}-{SLOT[slot]}.ttf"
                files["word/" + target] = _obfuscate(face.read_bytes(), a["w:fontKey"])
                replaced.append({"family": fam, "slot": slot, "part": target, "face": face.name})
    added = []
    for i, (fam, face) in enumerate(extra or [], start=1):
        # fon tambahan ditanam sebagai keluarga baru (slot embedRegular), kunci GUID deterministik per nama
        if f'<w:font w:name="{fam}">' in ft:
            raise ValueError(f"keluarga sudah ada di fontTable: {fam}")
        key = "{" + str(uuid.uuid5(uuid.NAMESPACE_URL, f"s99:{fam}")).upper() + "}"
        part, rid = f"fonts/s99_extra{i}.odttf", f"rIdS99x{i}"
        files["word/" + part] = _obfuscate(face.read_bytes(), key)
        infos["word/" + part] = zipfile.ZipInfo("word/" + part, date_time=(2026, 1, 1, 0, 0, 0))
        infos["word/" + part].compress_type = zipfile.ZIP_DEFLATED
        ft = ft.replace("</w:fonts>", f'<w:font w:name="{fam}"><w:embedRegular r:id="{rid}" w:fontKey="{key}"/></w:font></w:fonts>')
        rels = rels.replace("</Relationships>", f'<Relationship Id="{rid}" Type="{FONT_REL}" Target="{part}"/></Relationships>')
        added.append({"family": fam, "part": part, "face": face.name})
    if added:
        files["word/fontTable.xml"] = ft.encode("utf-8")
        files["word/_rels/fontTable.xml.rels"] = rels.encode("utf-8")
    renamed = 0
    if mode in ("rename", "rename-embed"):
        for n in list(files):
            if n.startswith("word/") and n.endswith(".xml"):
                s = files[n].decode("utf-8")
                t = _rename_xml(s)
                if t != s:
                    renamed += len(re.findall(r'="S99 IBM Plex', t)) - len(re.findall(r'="S99 IBM Plex', s))
                    files[n] = t.encode("utf-8")
    dst.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as zout:
        for n, data in files.items():
            zi = infos[n]
            zout.writestr(zi, data, compress_type=zi.compress_type)
    return {"mode": mode, "embeddedReplaced": len(replaced), "renamedAttributes": renamed, "faces": replaced, "extraEmbedded": added}


def pdf_fonts(pdf: Path) -> list:
    import pymupdf

    d = pymupdf.open(str(pdf))
    seen = {}
    for pg in d:
        for f in pg.get_fonts(full=True):
            seen[f[3].split("+")[-1]] = f[1]
    return [{"name": k, "ext": v} for k, v in sorted(seen.items())]


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("prep-docx")
    p.add_argument("--in", dest="src", required=True, type=Path)
    p.add_argument("--out", dest="dst", required=True, type=Path)
    p.add_argument("--mode", required=True, choices=("embed", "rename", "rename-embed"))
    p.add_argument("--set-dir", required=True, type=Path)
    p.add_argument("--extra-font", action="append", default=[], metavar="KELUARGA=TTF",
                   help="tanam fon tambahan sebagai keluarga baru (boleh berulang)")
    q = sub.add_parser("pdf-fonts")
    q.add_argument("--pdf", required=True, type=Path)
    a = ap.parse_args(argv)
    try:
        if a.cmd == "prep-docx":
            if not a.src.is_file() or not a.set_dir.is_dir():
                print(f"masukan tidak ada: {a.src} / {a.set_dir}", file=sys.stderr)
                return 2
            extra = []
            for spec in a.extra_font:
                fam, sep, face = spec.partition("=")
                if not sep or not fam or not Path(face).is_file():
                    print(f"--extra-font tidak sah: {spec}", file=sys.stderr)
                    return 2
                extra.append((fam, Path(face)))
            print(json.dumps(prep_docx(a.src, a.dst, a.mode, a.set_dir, extra)))
        else:
            if not a.pdf.is_file():
                print(f"PDF tidak ada: {a.pdf}", file=sys.stderr)
                return 2
            print(json.dumps(pdf_fonts(a.pdf)))
    except Exception as e:  # galat dilaporkan terstruktur ke pemanggil
        print(f"{a.cmd} gagal: {type(e).__name__}: {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
