# -*- coding: utf-8 -*-
"""S94 pembangun spec figur benchmark Manual 000 (D-14, D-17, D-44, D-49).

Membaca BM.docx (read-only) dan BM.pdf (halaman penempatan), lalu menulis ke
benchmark/manual000/figures/:
  assets/          27 media PNG docx disalin byte-identik (sha256 = media docx)
  specs/           spec studio.chart/v1 (komposit galeri), studio.diagram/v1, studio.image/v1
  blocks/          blok figur studio.doc/v1 (ChartBlock/DiagramBlock/ImageBlock/SymbolSheetBlock/DeviceBlock)
  index.json       52 penempatan: id bm-fig-NN -> jenis, berkas, halaman, ukuran mm, caption, sha256

Pemakaian (VENV, cwd di luar folder skill):
  python -I -B benchmark/manual000/figures/tools/build_figures.py --docx <BM.docx> --pdf <BM.pdf> [--out <dir>]
Exit 0 sukses; 1 penjaga data gagal; 2 masukan salah.
"""
import argparse
import hashlib
import json
import os
import re
import sys
import tempfile
import zipfile
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import diagrams  # noqa: E402
import gallery  # noqa: E402

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
WP = "{http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing}"
A = "{http://schemas.openxmlformats.org/drawingml/2006/main}"
PIC = "{http://schemas.openxmlformats.org/drawingml/2006/picture}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
RELNS = "{http://schemas.openxmlformats.org/package/2006/relationships}"

BIG_PAGES = {9, 12, 19, 35, 37, 38, 40, 42, 50, 51, 54, 55, 56, 57, 58, 59, 60, 61}  # D-17
REPO_PREFIX = "benchmark/manual000/figures"

# Klasifikasi 24 figur badan (label Gambar -> jenis). Sisa 28 penempatan = perangkat halaman.
FIGURE_CLASS = {
    "2.1": "diagram", "3.1": "diagram", "4.1": "raster",
    "8.1": "chart", "8.2": "chart", "8.3": "chart", "8.4": "chart", "8.5": "chart",
    "9.1": "diagram", "9.2": "diagram", "9.3": "diagram",
    "10.1": "symbolSheet", "10.3": "symbolSheet", "10.4": "symbolSheet", "10.5": "symbolSheet",
    "10.2": "raster", "10.6": "raster", "10.7": "raster", "10.8": "raster", "10.9": "raster",
    "10.10": "raster", "10.11": "raster", "10.12": "diagram", "10.13": "raster",
}
SYMBOL_DIALECT = {"10.1": "iec", "10.3": "isa", "10.4": "sec", "10.5": "mil"}
SYMBOL_COLS = 6  # lembar datum_symbols.py --sheet: 6 kolom (dilihat pada image15/17/18/19)
# Figur diagram dari Panduan Simbol: spec = rekonstruksi; raster sumber tetap dirujuk sebagai pembanding/cadangan.
EXTERNAL_DIAGRAMS = {"9.1", "9.2", "9.3", "10.12"}
RASTER_REASON = {
    "4.1": "render halaman spesimen (D-14 raster murni)",
    "10.2": "lembar bentuk konvensional dari Panduan Simbol, di luar katalog simbol DATUM",
    "10.6": "ilustrasi anatomi simbol satuan dari Panduan Simbol",
    "10.7": "katalog bentuk ISO 5807 dari Panduan Simbol (lembar simbol, bukan diagram)",
    "10.8": "katalog elemen BPMN dari Panduan Simbol (lembar simbol, bukan diagram)",
    "10.9": "katalog simbol DFD/UML/C4 dari Panduan Simbol (lembar simbol, bukan diagram)",
    "10.10": "legenda rumah topologi dari Panduan Simbol (lembar ikon)",
    "10.11": "contoh lima jenis garis ISO 128-2 (lembar garis)",
    "10.13": "denah perimeter (gambar tata letak skala; tidak ada keluarga Garis A)",
}
DEVICE = {
    "K-01": ("logo", "cover.logo"),
    "K-04": ("datumRule", "wrapper.datumRule"),
    "K-24": ("datumRule", "chapter.datumRule"),
}


def sha256(b):
    return hashlib.sha256(b).hexdigest()


def norm(s):
    return re.sub(r"\s+", " ", s).strip()


def run_texts(p):
    out = []
    for r in p.iter(W + "r"):
        t = "".join((x.text or "") if x.tag == W + "t" else "\t" for x in r if x.tag in (W + "t", W + "tab"))
        if t:
            out.append(t)
    return out


def read_docx(path):
    z = zipfile.ZipFile(path)
    rels = {}
    for rel in ET.fromstring(z.read("word/_rels/document.xml.rels")).iter(RELNS + "Relationship"):
        rels[rel.get("Id")] = rel.get("Target")
    root = ET.fromstring(z.read("word/document.xml"))
    paras = [el for el in root.find(W + "body") if el.tag == W + "p"]
    placements = []
    for pi, p in enumerate(paras):
        for inl in p.iter(WP + "inline"):
            ext = inl.find(WP + "extent")
            dp = inl.find(WP + "docPr")
            blip = inl.find(".//" + A + "blip")
            nv = inl.find(".//" + PIC + "cNvPr")
            rid = blip.get(R + "embed")
            placements.append({
                "body_p": pi, "cx": int(ext.get("cx")), "cy": int(ext.get("cy")), "docPrId": int(dp.get("id")),
                "rid": rid, "media": rels[rid], "picName": nv.get("name") if nv is not None else None})
        if p.find(".//" + WP + "anchor") is not None:
            raise SystemExit("penempatan wp:anchor tak terduga di p#%d" % pi)
    media = {}
    for name in z.namelist():
        if name.startswith("word/media/"):
            media[name[len("word/"):]] = z.read(name)
    return paras, placements, media


def pdf_pages(pdf_path):
    """Halaman setiap penempatan figur (urutan baca), dari bbox citra yang dipasang di BM.pdf."""
    import pymupdf
    doc = pymupdf.open(pdf_path)
    seq = []
    for i, pg in enumerate(doc):
        info = sorted(pg.get_image_info(), key=lambda im: (im["bbox"][1], im["bbox"][0]))
        for im in info:
            b = im["bbox"]
            wmm = (b[2] - b[0]) / 72.0 * 25.4
            if wmm > 30:
                seq.append({"page": i + 1, "wmm": round(wmm, 2), "hmm": round((b[3] - b[1]) / 72.0 * 25.4, 2)})
    return seq, len(doc)


def inline_runs(texts):
    return {"runs": [{"t": t} for t in texts]}


def apparatus(paras, p_idx):
    """Caption (p sebelum), baris KUNCI (opsional) dan SUMBER sesudah paragraf gambar."""
    cap = run_texts(paras[p_idx - 1])
    capt = "".join(cap)
    m = re.match(r"^(Gambar (\d+\.\d+))(\s+)(.*)$", capt, re.S)
    if not m:
        return None
    label, num, sep, text = m.group(1), m.group(2), m.group(3), m.group(4)
    key = None
    q = p_idx + 1
    nxt = run_texts(paras[q])
    if nxt and nxt[0].startswith("KUNCI"):
        key = nxt
        q += 1
        nxt = run_texts(paras[q])
    if not (nxt and nxt[0].startswith("SUMBER")):
        raise SystemExit("baris SUMBER tidak ditemukan setelah p#%d" % p_idx)
    src = nxt
    main = src[1].strip() if len(src) > 1 else ""
    prov = []
    joined = "".join(src)
    for mk in ("TERUKUR", "DITURUNKAN", "PEMASOK", "ASUMSI"):
        if "[" + mk in joined:
            prov.append(mk)
    return {"label": label, "num": num, "sep": sep, "text": text, "key": key, "source": src, "sourceMain": main,
            "provenance": prov, "keyText": "".join(key) if key else None, "sourceText": joined}


def figure_common(ap, wmm, hmm):
    fc = {
        "caption": {"label": ap["label"], "separator": ap["sep"], "inline": {"text": ap["text"]}},
        "source": {"inline": inline_runs(ap["source"])},
        "widthMm": wmm, "heightMm": hmm,
    }
    if ap["provenance"]:
        fc["source"]["provenance"] = ap["provenance"]
    if ap["key"]:
        fc["keyRow"] = inline_runs(ap["key"])
    return fc


def write_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
        f.write("\n")


def main(argv=None):
    ap_ = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap_.add_argument("--docx", required=True)
    ap_.add_argument("--pdf", required=True)
    ap_.add_argument("--out", default=os.path.dirname(HERE))
    a = ap_.parse_args(argv)
    if not (os.path.isfile(a.docx) and os.path.isfile(a.pdf)):
        print("masukan tidak ada", file=sys.stderr)
        return 2
    out = os.path.abspath(a.out)
    paras, placements, media = read_docx(a.docx)
    seq, npages = pdf_pages(a.pdf)
    if len(placements) != 52 or len(seq) != 52 or len(media) != 27:
        print("hitungan tak terduga: placements %d, pdf %d, media %d" % (len(placements), len(seq), len(media)), file=sys.stderr)
        return 1

    # 1. salin 27 media byte-identik
    media_sha = {}
    asset_rel = {}
    picname = {}
    for pl in placements:
        picname.setdefault(pl["media"], pl["picName"])
    for name, data in sorted(media.items()):
        base = os.path.basename(name)
        stem = os.path.splitext(picname.get(name) or base)[0]
        slug = re.sub(r"[^a-z0-9]+", "-", stem.lower()).strip("-")
        fn = "%s__%s.png" % (os.path.splitext(base)[0], slug)
        dst = os.path.join(out, "assets", fn)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        with open(dst, "wb") as f:
            f.write(data)
        media_sha[name] = sha256(data)
        asset_rel[name] = "%s/assets/%s" % (REPO_PREFIX, fn)

    # 2. galeri: media lokal untuk trace piksel
    tmpdir = tempfile.mkdtemp(prefix="s94_")
    gmedia = {}
    for nm in ("image7.png", "image8.png", "image9.png", "image10.png", "image11.png"):
        pth = os.path.join(tmpdir, nm)
        with open(pth, "wb") as f:
            f.write(media["media/" + nm])
        gmedia[nm] = pth

    try:
        from PIL import Image
        import io
    except ImportError:
        print("PIL tidak tersedia", file=sys.stderr)
        return 2

    index = {"schema": "s94.figures/v1", "benchmark": "Manual 000 000/GSP/STD/X/2026 RevA",
             "source": {"docx": os.path.basename(a.docx), "pdf": os.path.basename(a.pdf), "pdfPages": npages},
             "idScheme": "bm-fig-NN = urutan penempatan 01..52 = docPr id (D-44)",
             "bigPages": sorted(BIG_PAGES), "figures": []}
    counts = {}
    for n, (pl, pg) in enumerate(zip(placements, seq), 1):
        fid = "bm-fig-%02d" % n
        if pl["docPrId"] != n:
            print("docPr id %d != urutan %d" % (pl["docPrId"], n), file=sys.stderr)
            return 1
        wmm, hmm = round(pl["cx"] / 36000.0, 3), round(pl["cy"] / 36000.0, 3)
        if abs(wmm - pg["wmm"]) > 0.6 or abs(hmm - pg["hmm"]) > 0.6:
            print("%s: ukuran docx %.2fx%.2f != pdf %.2fx%.2f" % (fid, wmm, hmm, pg["wmm"], pg["hmm"]), file=sys.stderr)
            return 1
        img = Image.open(io.BytesIO(media[pl["media"]]))
        entry = {"id": fid, "placement": n, "page": pg["page"], "bigPage": pg["page"] in BIG_PAGES,
                 "bodyParagraph": pl["body_p"], "widthMm": wmm, "heightMm": hmm,
                 "media": pl["media"], "mediaName": pl["picName"], "sha256": media_sha[pl["media"]],
                 "widthPx": img.size[0], "heightPx": img.size[1], "asset": asset_rel[pl["media"]]}
        ap = apparatus(paras, pl["body_p"])
        if ap is None:
            # perangkat halaman: klaster dari tetangga (K-01 logo sampul, K-04 rule 166, K-24 rule 128)
            cluster = "K-01" if n == 1 else ("K-04" if abs(wmm - 166) < 0.5 else "K-24")
            dev, role = DEVICE[cluster]
            entry.update({"kind": "device", "device": dev, "roleKey": role, "cluster": cluster,
                          "path": asset_rel[pl["media"]], "explicitInDoc": cluster != "K-24"})
            blk = {"type": "device", "device": dev, "asset": fid, "widthMm": wmm, "heightMm": hmm}
            bpath = os.path.join(out, "blocks", fid + ".block.json")
            write_json(bpath, blk)
            entry["block"] = "%s/blocks/%s.block.json" % (REPO_PREFIX, fid)
            nxt = norm("".join(run_texts(paras[pl["body_p"] + 1])))
            entry["anchorText"] = nxt[:80]
            counts["device"] = counts.get("device", 0) + 1
            index["figures"].append(entry)
            continue
        num = ap["num"]
        kind = FIGURE_CLASS[num]
        entry.update({"kind": kind, "cluster": "K-32", "figure": ap["label"],
                      "caption": ap["label"] + ap["sep"] + ap["text"], "keyRow": ap["keyText"], "sourceLine": ap["sourceText"]})
        fc = figure_common(ap, wmm, hmm)
        spec_rel = None
        if kind == "chart":
            # IP-02/IP-41e: params panel berkunci penuh registri; aksen di medan `accent`, catatan di medan `x` panel
            # (D-87, D-215); asal transkripsi per panel di index.json `transcription`.
            panels, transcription = gallery.build(num, gmedia)
            rows = (len(panels) + 2) // 3
            for p in panels:
                p["spec"]["heightMm"] = round(hmm / rows, 2)
            spec = {"$schema": "studio.chart/v1", "kind": "composite", "id": ap["label"], "title": ap["text"],
                    "source": ap["sourceMain"], "widthMm": 166, "heightMm": hmm, "apparatus": "page", "inDocument": True,
                    "style": "gallery",
                    "note": "Data panel ditranskripsi dari PNG %s (F-005), bukan pustakachart_data.py; asal nilai per panel "
                            "di index.json transcription (label/pixel/sintetis)." % pl["media"],
                    "composite": {"columns": 3, "gapMm": 4.3, "panels": panels}}
            spec_rel = "specs/%s.chart.json" % fid
            blk = dict({"type": "chart"}, **fc)
            blk["spec"] = spec
            entry["panels"] = [p["code"] for p in panels]
            entry["transcription"] = transcription
        elif kind == "diagram":
            spec = diagrams.DIAGRAMS[num](ap["text"], ap["sourceMain"])
            spec_rel = "specs/%s.diagram.json" % fid
            blk = dict({"type": "diagram"}, **fc)
            if num in diagrams.BLOCK_SIZE:
                # IP-42c (D-154): blok ikut lebar spec dan tinggi build, bukan penempatan BM (index.json tetap BM).
                blk["widthMm"], blk["heightMm"] = diagrams.BLOCK_SIZE[num]
            blk["spec"] = spec
            entry["family"] = spec["family"]
            if num in EXTERNAL_DIAGRAMS:
                entry["fallbackAsset"] = asset_rel[pl["media"]]
                entry["note"] = ("rekonstruksi Garis A dari ilustrasi Panduan Simbol (D-14 diagram -> spec); "
                                 "raster sumber di fallbackAsset untuk pembanding/cadangan")
        elif kind == "symbolSheet":
            spec = None
            blk = dict({"type": "symbolSheet", "dialect": SYMBOL_DIALECT[num], "cols": SYMBOL_COLS}, **fc)
            entry["dialect"] = SYMBOL_DIALECT[num]
            entry["note"] = "lembar datum_symbols.py --sheet (paritas simbol S31); raster docx di asset sebagai pembanding"
        else:  # raster
            spec = {"$schema": "studio.image/v1", "id": ap["label"], "title": ap["text"], "source": ap["sourceMain"],
                    "asset": {"kind": "raster", "mime": "image/png", "sha256": media_sha[pl["media"]],
                              "path": asset_rel[pl["media"]], "widthPx": img.size[0], "heightPx": img.size[1]},
                    "widthMm": wmm, "heightMm": hmm, "dpiMin": 150}
            spec_rel = "specs/%s.image.json" % fid
            blk = dict({"type": "image", "asset": fid}, **fc)
            entry["reason"] = RASTER_REASON[num]
            entry["dpiEffective"] = round(img.size[0] / (wmm / 25.4), 1)
        if spec is not None:
            write_json(os.path.join(out, spec_rel), spec)
            entry["spec"] = "%s/%s" % (REPO_PREFIX, spec_rel)
        bpath = os.path.join(out, "blocks", fid + ".block.json")
        write_json(bpath, blk)
        entry["block"] = "%s/blocks/%s.block.json" % (REPO_PREFIX, fid)
        # D-49: path = berkas yang dibaca renderer (raster -> byte aset; chart/diagram -> spec; lembar simbol -> blok)
        entry["path"] = asset_rel[pl["media"]] if kind == "raster" else (entry.get("spec") or entry["block"])
        counts[kind] = counts.get(kind, 0) + 1
        index["figures"].append(entry)

    index["counts"] = dict(sorted(counts.items()), total=sum(counts.values()))
    index["media"] = [{"media": k, "sha256": v, "asset": asset_rel[k]} for k, v in sorted(media_sha.items(),
                                                                                         key=lambda kv: int(re.sub(r"\D", "", kv[0])))]
    write_json(os.path.join(out, "index.json"), index)
    print(json.dumps(index["counts"], ensure_ascii=False))
    big = sorted({f["page"] for f in index["figures"] if f["bigPage"]})
    print("bigPages ditandai:", len(big), big)
    return 0


if __name__ == "__main__":
    sys.exit(main())
