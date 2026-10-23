"""Pembanding DOCX (kelas DX, research/06 §6.2 baris DX).

Kelas DX lawan Garis A = DIAGNOSIS (D-120, ambang `gate` False); metrik tetap dihitung.
Cek: urutan teks paragraf 100 % identik (juga versi beracuan: tanpa artefak acuan F-011, simetris di
kedua sisi, dan blok no-reference F-012 dari konteks runner); teks dengan `w:caps` dilipat ke huruf besar (S76-H3); sel per
tabel dan `sectPr` dipasangkan lewat penyelarasan LCS, bukan indeks (S76-H4); jumlah paragraf/tabel/sel per tabel/gambar identik;
`sectPr` (ukuran halaman, margin, kolom) identik dalam twip; properti run efektif (wajah, ukuran
half-point, tebal, warna, caps) cocok >= 98 % run; himpunan fon tertanam identik.
Diagnosis: XML kanonik `document.xml`, `styles.xml`, `numbering.xml` (sha256 + kesamaan), selisih
gaya per styleId, teks header/footer. Byte ZIP tidak dibandingkan (cap waktu berbeda, D-13).

Kanonikalisasi XML: atribut `w:rsid*`, `w14:paraId`, `w14:textId` dan elemen `w:proofErr`,
`w:lastRenderedPageBreak` dibuang, lalu C14N. Isi `mc:Fallback` diabaikan untuk hitungan dan teks
(duplikat VML dari `mc:AlternateContent`).

Properti run efektif = docDefaults <- rantai gaya paragraf <- rantai gaya karakter <- rPr langsung
(override, nilai terakhir menang). Batasan: gaya tabel dan semantik XOR properti toggle tidak
dimodelkan; keduanya sama pada kedua sisi selama templat sama. Default yang dihilangkan disetarakan:
b/caps kosong = false, warna kosong = auto, sz kosong = 20 half-point.
"""
from __future__ import annotations

import difflib
import hashlib
import re
import unicodedata
import zipfile
from typing import Any

from lxml import etree

from common import Checks, multiset_diff, r

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
W14 = "http://schemas.microsoft.com/office/word/2010/wordml"
MC = "http://schemas.openxmlformats.org/markup-compatibility/2006"
_w = lambda t: f"{{{W}}}{t}"  # noqa: E731
_WS = re.compile(r"\s+")
_PARSER = etree.XMLParser(resolve_entities=False, no_network=True, huge_tree=True, remove_blank_text=False)
_DROP_ATTR = {f"{{{W14}}}paraId", f"{{{W14}}}textId"}
_DROP_EL = {_w("proofErr"), _w("lastRenderedPageBreak")}
_TRUE = {None, "1", "true", "on"}


# ---------------------------------------------------------------- baca paket
def _read(z: zipfile.ZipFile, name: str) -> bytes | None:
    try:
        return z.read(name)
    except KeyError:
        return None


def _parse(data: bytes) -> etree._Element:
    return etree.fromstring(data, _PARSER)


def canonical(data: bytes | None) -> bytes:
    if data is None:
        return b""
    root = _parse(data)
    for el in list(root.iter()):
        if not isinstance(el.tag, str):
            continue
        if el.tag in _DROP_EL:
            parent = el.getparent()
            if parent is not None:
                parent.remove(el)
            continue
        for a in list(el.attrib):
            if a in _DROP_ATTR or (a.startswith(f"{{{W}}}rsid")):
                del el.attrib[a]
    return etree.tostring(root, method="c14n")


def _strip_fallback(root: etree._Element) -> etree._Element:
    for fb in root.findall(f".//{{{MC}}}Fallback"):
        fb.getparent().remove(fb)
    return root


def _nfc(s: str) -> str:
    return unicodedata.normalize("NFC", s)


def _norm(s: str) -> str:
    return _WS.sub(" ", _nfc(s)).strip()


# ---------------------------------------------------------------- gaya / properti run
def _on(el: etree._Element | None) -> bool | None:
    if el is None:
        return None
    return el.get(_w("val")) in _TRUE


def _rpr_props(rpr: etree._Element | None) -> dict[str, Any]:
    out: dict[str, Any] = {}
    if rpr is None:
        return out
    f = rpr.find(_w("rFonts"))
    if f is not None:
        if f.get(_w("ascii")) is not None:
            out["font"] = f.get(_w("ascii"))
        elif f.get(_w("asciiTheme")) is not None:
            out["font"] = "theme:" + f.get(_w("asciiTheme"))
    sz = rpr.find(_w("sz"))
    if sz is not None and sz.get(_w("val")) is not None:
        out["size"] = int(float(sz.get(_w("val"))))
    b = _on(rpr.find(_w("b")))
    if b is not None:
        out["bold"] = b
    c = _on(rpr.find(_w("caps")))
    if c is not None:
        out["caps"] = c
    col = rpr.find(_w("color"))
    if col is not None and col.get(_w("val")) is not None:
        out["color"] = col.get(_w("val")).upper()
    return out


class Styles:
    def __init__(self, data: bytes | None) -> None:
        self.by_id: dict[str, etree._Element] = {}
        self.defaults: dict[str, Any] = {}
        self.default_para: str | None = None
        self.default_char: str | None = None
        self.root = _parse(data) if data else None
        if self.root is None:
            return
        dd = self.root.find(f"{_w('docDefaults')}/{_w('rPrDefault')}/{_w('rPr')}")
        self.defaults = _rpr_props(dd)
        for st in self.root.findall(_w("style")):
            sid = st.get(_w("styleId"))
            if sid is None:
                continue
            self.by_id[sid] = st
            if st.get(_w("default")) in ("1", "true", "on"):
                if st.get(_w("type")) == "paragraph":
                    self.default_para = sid
                elif st.get(_w("type")) == "character":
                    self.default_char = sid
        self._cache: dict[str, dict[str, Any]] = {}

    def chain(self, sid: str | None) -> dict[str, Any]:
        if sid is None or sid not in self.by_id:
            return {}
        if sid in self._cache:
            return self._cache[sid]
        seen, ids = set(), []
        cur: str | None = sid
        while cur and cur in self.by_id and cur not in seen:
            seen.add(cur)
            ids.append(cur)
            based = self.by_id[cur].find(_w("basedOn"))
            cur = based.get(_w("val")) if based is not None else None
        props: dict[str, Any] = {}
        for i in reversed(ids):
            props.update(_rpr_props(self.by_id[i].find(_w("rPr"))))
        self._cache[sid] = props
        return props

    def canon_by_id(self) -> dict[str, str]:
        out = {}
        for sid, st in self.by_id.items():
            out[sid] = hashlib.sha256(etree.tostring(st, method="c14n")).hexdigest()[:16]
        return out


def _effective(styles: Styles, pstyle: str | None, rpr: etree._Element | None) -> tuple:
    p: dict[str, Any] = dict(styles.defaults)
    p.update(styles.chain(pstyle or styles.default_para))
    rstyle = None
    if rpr is not None and rpr.find(_w("rStyle")) is not None:
        rstyle = rpr.find(_w("rStyle")).get(_w("val"))
    p.update(styles.chain(rstyle or styles.default_char))
    p.update(_rpr_props(rpr))
    color = p.get("color")
    if color in (None, "AUTO"):
        color = "auto"
    return (p.get("font"), p.get("size", 20), bool(p.get("bold", False)), color,
            bool(p.get("caps", False)))


# ---------------------------------------------------------------- analisis dokumen
def _run_text(run: etree._Element) -> str:
    parts = []
    for el in run:
        t = el.tag
        if t == _w("t"):
            parts.append(el.text or "")
        elif t == _w("tab"):
            parts.append("\t")
        elif t in (_w("br"), _w("cr")):
            parts.append("\n")
        elif t == _w("noBreakHyphen"):
            parts.append("‑")
    return "".join(parts)


def _sect(s: etree._Element) -> dict[str, Any]:
    def attrs(tag: str, keys: tuple[str, ...]) -> dict[str, Any]:
        el = s.find(_w(tag))
        return {k: (el.get(_w(k)) if el is not None else None) for k in keys}

    pg = attrs("pgSz", ("w", "h", "orient"))
    pg["orient"] = pg["orient"] or "portrait"
    mar = attrs("pgMar", ("top", "right", "bottom", "left", "header", "footer", "gutter"))
    cols = attrs("cols", ("num", "space"))
    cols["num"] = cols["num"] or "1"
    cols["space"] = cols["space"] or "720"
    return {"pgSz": pg, "pgMar": mar, "cols": cols}


def analyse(path: str) -> dict[str, Any]:
    with zipfile.ZipFile(path) as z:
        doc_b = _read(z, "word/document.xml")
        if doc_b is None:
            raise ValueError(f"{path}: word/document.xml tidak ada")
        sty_b = _read(z, "word/styles.xml")
        num_b = _read(z, "word/numbering.xml")
        ft_b = _read(z, "word/fontTable.xml")
        names = z.namelist()
        hf = {n: _read(z, n) for n in names if re.match(r"word/(header|footer)\d*\.xml$", n)}

    styles = Styles(sty_b)
    root = _strip_fallback(_parse(doc_b))
    body = root.find(_w("body"))
    paras = list(body.iter(_w("p")))
    pidx = {id(p): i for i, p in enumerate(paras)}

    chars: list[list[tuple[str, tuple]]] = [[] for _ in paras]
    for run in body.iter(_w("r")):
        anc = run.getparent()
        while anc is not None and anc.tag != _w("p"):
            anc = anc.getparent()
        if anc is None:
            continue
        txt = _nfc(_run_text(run))
        if not txt:
            continue
        ppr = anc.find(_w("pPr"))
        ps = None
        if ppr is not None and ppr.find(_w("pStyle")) is not None:
            ps = ppr.find(_w("pStyle")).get(_w("val"))
        props = _effective(styles, ps, run.find(_w("rPr")))
        # S76-H3: `w:caps` dilipat ke teks yang tampil (huruf besar); properti caps tidak lagi dibandingkan
        # terpisah, sehingga teks kapital literal (acuan) = teks ber-caps (Node).
        shown = txt.upper() if props[4] else txt
        chars[pidx[id(anc)]].extend((c, props[:4]) for c in shown)

    raw_texts = ["".join(c for c, _ in cs) for cs in chars]
    tables = list(body.iter(_w("tbl")))
    # sel milik tabel itu sendiri (sel tabel bersarang dihitung pada tabel bersarangnya)
    cells = [sum(1 for tc in t.iter(_w("tc")) if next(tc.iterancestors(_w("tbl")), None) is t) for t in tables]
    # tanda tangan tabel untuk penyelarasan (S76-H4): teks sel milik tabel itu sendiri
    table_sig = [_norm(" ".join(_run_text(rn) for tc in t.iter(_w("tc"))
                                if next(tc.iterancestors(_w("tbl")), None) is t for rn in tc.iter(_w("r"))))
                 for t in tables]
    nested = sum(1 for t in tables if next(t.iterancestors(_w("tbl")), None) is not None)
    images = sum(1 for _ in body.iter(_w("drawing"))) + sum(1 for _ in body.iter(_w("pict")))
    sects = [_sect(s) for s in body.iter(_w("sectPr"))]

    emb: set[str] = set()
    if ft_b:
        for f in _parse(ft_b).findall(_w("font")):
            for kind in ("embedRegular", "embedBold", "embedItalic", "embedBoldItalic"):
                if f.find(_w(kind)) is not None:
                    emb.add(f"{f.get(_w('name'))}|{kind[5:]}")
    hf_texts = []
    for n in sorted(hf):
        hr = _strip_fallback(_parse(hf[n]))
        for p in hr.iter(_w("p")):
            t = _norm("".join(_run_text(rn) for rn in p.iter(_w("r"))))
            if t:
                hf_texts.append(t)

    canon = {k: canonical(v) for k, v in (("document", doc_b), ("styles", sty_b), ("numbering", num_b))}
    return {
        "chars": chars,
        "rawTexts": raw_texts,
        "texts": [t for t in (_norm(x) for x in raw_texts) if t],
        "counts": {"paragraphs": len(paras), "tables": len(tables), "tablesNested": nested, "images": images,
                   "sections": len(sects)},
        "cellsPerTable": cells,
        "tableSig": table_sig,
        "sects": sects,
        "embeddedFonts": sorted(emb),
        "fontFiles": sorted(n for n in names if n.startswith("word/fonts/")),
        "hfTexts": hf_texts,
        "styleCanon": styles.canon_by_id(),
        "canonSha": {k: hashlib.sha256(v).hexdigest() for k, v in canon.items()},
    }


def _segments(cs: list[tuple[str, tuple]]) -> list[tuple[int, int]]:
    """Run tergabung: rentang [awal, akhir) karakter berurutan dengan properti sama."""
    segs, start = [], 0
    for i in range(1, len(cs) + 1):
        if i == len(cs) or cs[i][1] != cs[start][1]:
            if i > start:
                segs.append((start, i))
            start = i
    return segs


def run_props_match(a: dict[str, Any], b: dict[str, Any]) -> tuple[int, int, list[dict[str, Any]]]:
    """(cocok, total, contoh tidak cocok) atas run tergabung sisi acuan."""
    ra, rb = a["rawTexts"], b["rawTexts"]
    total = ok = 0
    bad: list[dict[str, Any]] = []
    sm = difflib.SequenceMatcher(None, ra, rb, autojunk=False)
    pairs: list[tuple[int, int | None]] = []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal" or (tag == "replace" and i2 - i1 == j2 - j1):
            pairs += [(i1 + k, j1 + k) for k in range(i2 - i1)]
        elif tag in ("delete", "replace"):
            pairs += [(i, None) for i in range(i1, i2)]
    for i, j in pairs:
        ca = a["chars"][i]
        segs = _segments(ca)
        if not segs:
            continue
        cb = b["chars"][j] if j is not None else []
        if j is not None and ra[i] == rb[j]:
            mapping = {k: k for k in range(len(ca))}
        else:
            mapping = {}
            if cb:
                csm = difflib.SequenceMatcher(None, ra[i], rb[j], autojunk=False)
                for blk in csm.get_matching_blocks():
                    for k in range(blk.size):
                        mapping[blk.a + k] = blk.b + k
        for s, e in segs:
            total += 1
            good = all(k in mapping and cb[mapping[k]][1] == ca[k][1] for k in range(s, e))
            ok += good
            if not good and len(bad) < 20:
                k = next(k for k in range(s, e) if k not in mapping or cb[mapping[k]][1] != ca[k][1])
                bad.append({"paragraph": i + 1, "text": ra[i][s:e][:60],
                            "ref": list(ca[k][1]),
                            "node": list(cb[mapping[k]][1]) if k in mapping else None})
    return ok, total, bad


# ---------------------------------------------------------------- penyelarasan dan pengecualian
def align_pairs(sa: list[Any], sb: list[Any]) -> tuple[list[tuple[int, int]], list[int], list[int]]:
    """Pasangan indeks berbasis penyelarasan LCS (S76-H4), bukan indeks: blok `equal` dan `replace`
    sama panjang dipasangkan berurutan; sisanya tak berpasangan (mis. tabel/seksi sampul tambahan)."""
    sm = difflib.SequenceMatcher(None, sa, sb, autojunk=False)
    pairs: list[tuple[int, int]] = []
    only_a: list[int] = []
    only_b: list[int] = []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal" or (tag == "replace" and i2 - i1 == j2 - j1):
            pairs += [(i1 + k, j1 + k) for k in range(i2 - i1)]
        else:
            only_a += list(range(i1, i2))
            only_b += list(range(j1, j2))
    return pairs, only_a, only_b


# F-011: caption/penomoran/provenans yang ditulis sendiri oleh Garis A (`datum_docx.py:646-657, 722, 743`)
# dan padanan Node-nya = kelas "artefak acuan". Diterapkan SIMETRIS ke kedua sisi (FIX-H/SR46-P1):
# - caption bernomor bab (`TABEL 1`, `Tabel 1.1`) dan lampiran (`TABEL A.1`, `GAMBAR B.2`);
# - baris aparatus SUMBER = label mesin (D-145/D-221: dibangkitkan dari medan `source`, bukan teks agen)
#   diikuti teks sumber, di sisi mana pun (Node: baris SUMBER tabel/figur; acuan: SUMBER figur dan
#   paragraf `... PROVENANS ◇ PEMASOK`). Label harus huruf besar dan diikuti teks: kepala kolom isi
#   "SUMBER"/"Sumber" yang berdiri sendiri dan kalimat isi "Sumber data ..." TIDAK dikecualikan.
# FIX-F C8 (D-313): hanya BENTUK caption yang dikecualikan. Label tidak peka huruf, tetapi sesudah nomor
# harus akhir baris, pemisah (. : · | - – —; bukan titik desimal nomor), atau judul berawal huruf
# besar/angka/kutip. Kalimat isi berawalan rujukan ("Tabel 3.2 merangkum ...") tetap dinilai textOrder.
REF_ARTIFACT = (re.compile(r"^(?i:TABEL|GAMBAR)\s+(\d+(\.\d+)*|[A-Z]\.\d+)"
                           r"(?=\s*$|\s*[.:·|–—-](?!\d)|\s+[A-Z0-9\"“‘'(\[])"),
                re.compile(r"PROVENANS\s*◇\s*PEMASOK"),
                re.compile(r"^SUMBER(\s*:)?\s+\S"))
NO_REF_STATUSES = ("unsupported",)
MIN_LEAF = 8


def _json_pointer(doc: Any, ptr: str) -> Any:
    cur = doc
    for raw in ptr.split("/")[1:]:
        k = raw.replace("~1", "/").replace("~0", "~")
        if isinstance(cur, list):
            if not k.isdigit() or int(k) >= len(cur):
                return None
            cur = cur[int(k)]
        elif isinstance(cur, dict):
            if k not in cur:
                return None
            cur = cur[k]
        else:
            return None
    return cur


def _leaves(v: Any, out: list[str]) -> None:
    if isinstance(v, str):
        t = _norm(v)
        if t:
            out.append(t)
    elif isinstance(v, list):
        for x in v:
            _leaves(x, out)
    elif isinstance(v, dict):
        for k, x in v.items():
            if k not in ("$schema", "type", "role", "kind", "shape", "preset", "pointer"):
                _leaves(x, out)


def no_reference_leaves(ctx: dict[str, Any]) -> list[str]:
    """Teks blok tanpa padanan acuan (F-012, status `unsupported` di ref_report S64)."""
    nr = ctx.get("noReference") or {}
    spec_path = nr.get("spec")
    if not spec_path:
        return []
    import json
    with open(spec_path, encoding="utf-8") as fh:
        spec = json.load(fh)
    leaves: list[str] = []
    for b in nr.get("blocks") or []:
        if b.get("status") in NO_REF_STATUSES and isinstance(b.get("pointer"), str) and b["pointer"] not in ("", "/"):
            _leaves(_json_pointer(spec, b["pointer"]), leaves)
    return sorted(set(leaves), key=lambda s: (-len(s), s))


def unit_class(u: str, leaves: list[str]) -> str | None:
    if any(p.search(u) for p in REF_ARTIFACT):
        return "referenceArtifact"
    for leaf in leaves:
        if u == leaf or (len(leaf) >= MIN_LEAF and leaf in u) or (len(u) >= MIN_LEAF and u in leaf):
            return "noReference"
    return None


def compare(ref: str, node: str, th: dict[str, Any], ck: Checks, ctx: dict[str, Any] | None = None) -> dict[str, Any]:
    ctx = ctx or {}
    a, b = analyse(ref), analyse(node)
    g = bool(th.get("gate", True))  # D-120: DX lawan Garis A = diagnosis (gate False)
    has_nr = bool((ctx.get("noReference") or {}).get("spec"))

    sm = difflib.SequenceMatcher(None, a["texts"], b["texts"], autojunk=False)
    matched = sum(blk.size for blk in sm.get_matching_blocks())
    denom = max(len(a["texts"]), len(b["texts"])) or 1
    pct = 100.0 * matched / denom
    first = []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag != "equal" and len(first) < 20:
            first.append({"op": tag, "refIndex": i1 + 1, "ref": a["texts"][i1:i2][:3],
                          "nodeIndex": j1 + 1, "node": b["texts"][j1:j2][:3]})
    ck.add("textOrder", pct >= th["textOrderIdenticalPct"], g and not has_nr, len(a["texts"]), len(b["texts"]),
           th["textOrderIdenticalPct"], first)

    # S76-H2: unit teks beracuan = tanpa artefak acuan (F-011) dan tanpa blok no-reference (F-012).
    leaves = no_reference_leaves(ctx)
    excl: dict[str, dict[str, int]] = {"referenceArtifact": {"ref": 0, "node": 0}, "noReference": {"ref": 0, "node": 0}}
    kept: dict[str, list[str]] = {"ref": [], "node": []}
    for side, units in (("ref", a["texts"]), ("node", b["texts"])):
        for u in units:
            c = unit_class(u, leaves)
            if c:
                excl[c][side] += 1
            else:
                kept[side].append(u)
    sm2 = difflib.SequenceMatcher(None, kept["ref"], kept["node"], autojunk=False)
    matched2 = sum(blk.size for blk in sm2.get_matching_blocks())
    pct2 = 100.0 * matched2 / (max(len(kept["ref"]), len(kept["node"])) or 1)
    first2 = [{"op": t, "ref": kept["ref"][i1:i2][:3], "node": kept["node"][j1:j2][:3]}
              for t, i1, i2, j1, j2 in sm2.get_opcodes() if t != "equal"][:20]
    ck.add("textOrderReferenced", pct2 >= th["textOrderIdenticalPct"], g and has_nr, len(kept["ref"]),
           len(kept["node"]), th["textOrderIdenticalPct"], first2)

    cell_pairs, cell_ua, cell_ub = align_pairs(a["tableSig"], b["tableSig"])
    cell_differ = [{"refTable": i + 1, "nodeTable": j + 1, "ref": a["cellsPerTable"][i], "node": b["cellsPerTable"][j]}
                   for i, j in cell_pairs if a["cellsPerTable"][i] != b["cellsPerTable"][j]]
    if th["countsIdentical"]:
        for k in ("paragraphs", "tables", "images"):
            ck.add(f"count.{k}", a["counts"][k] == b["counts"][k], g, a["counts"][k], b["counts"][k], 0)
        ck.add("cellsPerTable", not cell_differ and not cell_ua and not cell_ub, g,
               len(a["cellsPerTable"]), len(b["cellsPerTable"]), None,
               {"pairedDiffer": cell_differ, "unpairedRef": [i + 1 for i in cell_ua],
                "unpairedNode": [j + 1 for j in cell_ub]})

    sect_keys_a = [repr(sorted((k, sorted(v.items())) for k, v in s.items())) for s in a["sects"]]
    sect_keys_b = [repr(sorted((k, sorted(v.items())) for k, v in s.items())) for s in b["sects"]]
    sect_pairs, sect_ua, sect_ub = align_pairs(sect_keys_a, sect_keys_b)
    sect_differ = [{"refSection": i + 1, "nodeSection": j + 1, "ref": a["sects"][i], "node": b["sects"][j]}
                   for i, j in sect_pairs if a["sects"][i] != b["sects"][j]]
    sect_ok = not sect_differ and not sect_ua and not sect_ub
    ck.add("sectPr", sect_ok or not th["sectPrIdentical"], g, len(a["sects"]), len(b["sects"]), None,
           {"pairedDiffer": sect_differ, "unpairedRef": [i + 1 for i in sect_ua], "unpairedNode": [j + 1 for j in sect_ub]})

    ok, total, bad = run_props_match(a, b)
    rp = 100.0 * ok / total if total else 100.0
    ck.add("runProps", rp >= th["runPropsMatchPctMin"], g, total, ok, th["runPropsMatchPctMin"], bad)

    # R02/F-056: kelas artefak acuan (Garis A tidak menanam fon; Node R-08 selalu) -> diagnosis.
    ck.add("embeddedFonts", a["embeddedFonts"] == b["embeddedFonts"] or not th["embeddedFontsIdentical"],
           g and bool(th.get("embeddedFontsGate", True)), a["embeddedFonts"], b["embeddedFonts"], None,
           {**multiset_diff(a["embeddedFonts"], b["embeddedFonts"]), "class": "artefak acuan (F-056)"})

    # diagnosis
    canon_eq = {k: a["canonSha"][k] == b["canonSha"][k] for k in a["canonSha"]}
    for k, eq in canon_eq.items():
        ck.add(f"canonicalXml.{k}", eq, False)
    sa, sb = a["styleCanon"], b["styleCanon"]
    style_diff = {"onlyRef": sorted(set(sa) - set(sb)), "onlyNode": sorted(set(sb) - set(sa)),
                  "differ": sorted(k for k in set(sa) & set(sb) if sa[k] != sb[k])}
    ck.add("styles", not any(style_diff.values()), False, len(sa), len(sb), None, style_diff)
    ck.add("headerFooterText", a["hfTexts"] == b["hfTexts"], False, len(a["hfTexts"]), len(b["hfTexts"]),
           None, multiset_diff(a["hfTexts"], b["hfTexts"]))

    return {
        "verdictClass": "gerbang" if g else "DIAGNOSIS (D-120: DX lawan Garis A)",
        "textUnits": {"ref": len(a["texts"]), "node": len(b["texts"]), "identicalInOrder": matched,
                      "pct": r(pct, 2), "excluded": excl, "referencedRef": len(kept["ref"]),
                      "referencedNode": len(kept["node"]), "referencedIdentical": matched2,
                      "referencedPct": r(pct2, 2), "noReferenceLeaves": len(leaves)},
        "counts": {"ref": a["counts"], "node": b["counts"]},
        "tables": {"ref": len(a["cellsPerTable"]), "node": len(b["cellsPerTable"])},
        "cellsPerTable": {"paired": len(cell_pairs), "pairedDiffer": cell_differ,
                          "unpairedRef": len(cell_ua), "unpairedNode": len(cell_ub), "pairing": "LCS tanda tangan teks tabel"},
        "sectPr": {"ref": a["sects"], "node": b["sects"]},
        "sectPrAlignment": {"paired": len(sect_pairs), "pairedDiffer": sect_differ,
                            "unpairedRef": len(sect_ua), "unpairedNode": len(sect_ub), "pairing": "LCS nilai sectPr"},
        "runProps": {"runsRef": total, "matched": ok, "pct": r(rp, 2),
                     "props": ["font", "sizeHalfPt", "bold", "color"], "caps": "dilipat ke teks (S76-H3)"},
        "embeddedFonts": {"ref": a["embeddedFonts"], "node": b["embeddedFonts"],
                          "fontFilesRef": len(a["fontFiles"]), "fontFilesNode": len(b["fontFiles"])},
        "canonicalXml": {"sha256": {"ref": a["canonSha"], "node": b["canonSha"]}, "identical": canon_eq},
        "styles": {"ref": len(sa), "node": len(sb)},
    }
