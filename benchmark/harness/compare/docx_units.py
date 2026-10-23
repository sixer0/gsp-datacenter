"""Text-unit and element-count extraction from a DOCX (S96, D-17 BM-1/BM-2).

Unit definitions follow research/07_benchmark_inventory.md section 1.1:
- body paragraph = w:p that is a direct child of w:body (non-empty text only);
- table cell = w:tc; its unit text is the text of its direct-child paragraphs
  joined by a space (nested tables are walked recursively as their own cells);
- caption = body paragraph whose text starts with "Tabel X.n" / "Gambar X.n"
  followed by a title (not a lowercase sentence continuation);
- source line = body paragraph whose text starts with "SUMBER" or "PROVENANS".
Units are emitted in document order. Text is whitespace-normalised the same way
as CAL (`re.sub(r"\\s+", " ", s).strip()`); w:tab and w:br count as whitespace.
Headers, footers, footnotes and text inside drawings/text boxes are not units.

The DOCX is read in memory (zipfile + lxml); the file is never modified.
"""
from __future__ import annotations

import re
import zipfile
from dataclasses import dataclass, asdict
from pathlib import Path

from lxml import etree

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS = {"w": W}
_P, _TBL, _TR, _TC, _R = (f"{{{W}}}{t}" for t in ("p", "tbl", "tr", "tc", "r"))
_T, _TAB, _BR, _CR, _SYM, _SDT, _SDTC, _HL, _FLD, _INS, _SMART = (
    f"{{{W}}}{t}"
    for t in ("t", "tab", "br", "cr", "sym", "sdt", "sdtContent", "hyperlink", "fldSimple", "ins", "smartTag")
)

_WS = re.compile(r"\s+")
# Caption = label + title that does not continue as a sentence ("Gambar 2.1
# memperlihatkan ..." is body text): the word after the label is not lowercase.
CAPTION_RE = re.compile(r"^(Tabel|Gambar)\s+[A-Z0-9]+(\.[0-9]+)+(\s+[^a-z\s]|$)")
SOURCE_RE = re.compile(r"^(SUMBER|PROVENANS)\b")
CHAPTER_RE = re.compile(r"^Bab\s+\d+$", re.IGNORECASE)
APPENDIX_RE = re.compile(r"^Lampiran\s+[A-Z]$", re.IGNORECASE)


def norm(s: str) -> str:
    """CAL whitespace normalisation."""
    return _WS.sub(" ", s).strip()


@dataclass
class Unit:
    idx: int          # position in the unit sequence
    kind: str         # paragraph | caption | source | cell
    text: str         # normalised text
    loc: str          # B<p#> for body paragraph, T<nnn>.r<row>.c<col>[/N..] for cells

    def to_dict(self) -> dict:
        return asdict(self)


def _run_text(r: etree._Element, out: list[str]) -> None:
    for ch in r:
        tag = ch.tag
        if tag == _T:
            out.append(ch.text or "")
        elif tag in (_TAB, _BR, _CR):
            out.append(" ")
        elif tag == _SYM:
            code = ch.get(f"{{{W}}}char")
            if code:
                try:
                    out.append(chr(int(code, 16)))
                except ValueError:
                    pass


def _para_text(p: etree._Element) -> str:
    """Text of runs that belong to this paragraph (descends into hyperlink,
    fldSimple, ins, smartTag, sdt wrappers; never into nested paragraphs such as
    text boxes inside drawings). w:delText and w:instrText are excluded."""
    out: list[str] = []

    def walk(node: etree._Element) -> None:
        for ch in node:
            tag = ch.tag
            if tag == _R:
                _run_text(ch, out)
            elif tag in (_HL, _FLD, _INS, _SMART, _SDT, _SDTC):
                walk(ch)

    walk(p)
    return "".join(out)


def _classify(text: str) -> str:
    if CAPTION_RE.match(text):
        return "caption"
    if SOURCE_RE.match(text):
        return "source"
    return "paragraph"


def _cell_children(tc: etree._Element):
    """Direct block children of a cell, unwrapping w:sdt/w:sdtContent."""
    for ch in tc:
        if ch.tag == _SDT:
            content = ch.find(_SDTC)
            if content is not None:
                yield from _cell_children(content)
        else:
            yield ch


def _table_units(tbl: etree._Element, prefix: str, units: list[Unit], nested_counter: list[int]) -> None:
    for ri, tr in enumerate(tbl.findall(_TR)):
        for ci, tc in enumerate(tr.findall(_TC)):
            texts: list[str] = []
            nested: list[etree._Element] = []
            for ch in _cell_children(tc):
                if ch.tag == _P:
                    t = norm(_para_text(ch))
                    if t:
                        texts.append(t)
                elif ch.tag == _TBL:
                    nested.append(ch)
            loc = f"{prefix}.r{ri + 1}.c{ci + 1}"
            text = norm(" ".join(texts))
            if text:
                units.append(Unit(len(units), "cell", text, loc))
            for nt in nested:
                nested_counter[0] += 1
                _table_units(nt, f"{loc}/N{nested_counter[0]:02d}", units, nested_counter)


@dataclass
class DocxExtract:
    units: list[Unit]
    counts: dict          # chapters, appendices, tables, figures (+ bodyParagraphs, cellUnits)
    chapter_titles: list[str]
    appendix_titles: list[str]


def extract_docx(path: str | Path) -> DocxExtract:
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml")
    root = etree.fromstring(xml, parser=etree.XMLParser(huge_tree=True, resolve_entities=False, no_network=True))
    body = root.find(f"{{{W}}}body")
    if body is None:
        raise ValueError(f"{path}: word/document.xml has no w:body")

    units: list[Unit] = []
    nested_counter = [0]
    chapters: list[str] = []
    appendices: list[str] = []
    tables = 0
    body_paras = 0

    def body_blocks(node: etree._Element):
        for ch in node:
            if ch.tag == _SDT:
                content = ch.find(_SDTC)
                if content is not None:
                    yield from body_blocks(content)
            else:
                yield ch

    p_index = -1
    for blk in body_blocks(body):
        if blk.tag == _P:
            p_index += 1
            body_paras += 1
            t = norm(_para_text(blk))
            if not t:
                continue
            units.append(Unit(len(units), _classify(t), t, f"B{p_index}"))
            if CHAPTER_RE.match(t):
                chapters.append(t)
            elif APPENDIX_RE.match(t):
                appendices.append(t)
        elif blk.tag == _TBL:
            tables += 1
            _table_units(blk, f"T{tables:03d}", units, nested_counter)

    # Figures = drawing/picture placements inside the main body (headers/footers
    # live in other parts and are therefore excluded by construction).
    figures = len(body.findall(".//w:drawing", NS)) + len(body.findall(".//w:pict", NS))

    counts = {
        "chapters": len(chapters),
        "appendices": len(appendices),
        "tables": tables,
        "figures": figures,
        "bodyParagraphs": body_paras,
        "nestedTables": nested_counter[0],
        "units": len(units),
        "unitsByKind": {k: sum(1 for u in units if u.kind == k) for k in ("paragraph", "caption", "source", "cell")},
    }
    return DocxExtract(units, counts, chapters, appendices)
