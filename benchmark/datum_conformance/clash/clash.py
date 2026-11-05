"""PDF text-clash checker for DATUM Rev A conformance (S24; D-593 detectors G-01..G-06).

    VENV -I -B benchmark/datum_conformance/clash/clash.py --pdf <file> --out <json>
        [--docx <file> [--no-convert]] [--margins-mm l,t,r,b] [--zones <json>]
        [--work-dir C:/tmp/dc_clash] [--soffice <path>]

Reads every text glyph of the PDF with PyMuPDF (`rawdict`, mediabox clipping OFF so
text past the page edge is still seen) and reports, per page:

  overlap        G-01  word boxes of different text lines intersect by > TOL_PT in both
                       axes; words of one visual line only when they overlap by more than
                       kerning (KERN_EM x font size).
  out_of_page    G-02  a word box leaves the page box by > TOL_PT.
  out_of_margin  G-03  body text outside the margin box and outside every allowed zone
                       (running header band, footer/register band, seal band, rail and
                       any --zones entry).
  clipped        G-04  a word box is crossed by a drawn cell edge (table rule, cell
                       rectangle or shaded cell boundary from `page.get_drawings()`);
                       an underline/strike-through that starts and ends with the words
                       of its own line is a text decoration, not an edge.
  overflow       G-06  a label in the header, register or seal zone leaves its zone or
                       cell, crosses a cell separator, or wraps to a second baseline. One
                       exception: the NOTA classification line under the register number
                       cell (ID:611-613, EN:647-649), see classification_line().

With --docx the DOCX is first converted by LibreOffice (the Studio PDF path, D-15) in
a SHORT work directory (soffice 24.2 hangs on long Windows paths, research/34 #20) and
the result is written to --pdf; the DOCX section geometry (w:pgSz, w:pgMar) gives the
margin, header and footer boxes. Without it, --margins-mm or the DATUM default
24/26/20/24 mm with header/footer distance 13 mm (GF-02/GF-03) is used.

Box model: glyph boxes use PyMuPDF "small glyph heights" (box height = font size, the
em box) instead of the ascender-descender box, because the latter of two consecutive
lines at normal leading overlap by design (a 25 pt title at 29 pt leading overlaps by
3.5 pt) and would hide nothing but report noise.

Tolerance TOL_PT = 0.5 pt (0.18 mm): above LibreOffice's 1/20 pt layout rounding and the
0.2 pt edge jitter measured on Studio PDFs, below the 0.18 mm DATUM line floor, so any
reported clash is visible at print size.

Output (the TS harness contract):
    {"pdf": str, "pages": int, "clashes": [{"page": int, "kind": str,
      "bbox": [x0, y0, x1, y1], "text": str, "detail": str}]}
PDF points, origin top-left, page numbers 1-based.
Exit 0 = no clashes, 1 = clashes found, 2 = usage error / unreadable input / failed
conversion (a durable error record `clash_error.json` is written next to --out).
"""
from __future__ import annotations

import argparse
import datetime as _dt
import json
import os
import re
import shutil
import subprocess
import sys
import traceback
import uuid
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from xml.etree import ElementTree as ET

import pymupdf

TOL_PT = 0.5
KERN_EM = 0.2               # same-line words may touch by up to 0.2 em (kerning, italic overhang)
BASELINE_TOL_PT = 1.0       # two words share a baseline when their origins differ by <= 1 pt
MIN_EDGE_PT = 2.0           # shorter drawn segments (dots, ticks) are not cell edges
THIN_FILL_PT = 2.0          # a filled rectangle thinner than this is a rule, drawn as one line
SEAL_RGB = (0x6E / 255, 0x14 / 255, 0x20 / 255)   # seal 6E1420 (SB-02)
SEAL_RGB_TOL = 0.03
MM = 72 / 25.4
DEFAULT_MARGINS_MM = (24.0, 26.0, 20.0, 24.0)     # left, top, right, bottom (GF-02/GF-03)
DEFAULT_HEADER_FOOTER_MM = (13.0, 13.0)
DEFAULT_SOFFICE = os.environ.get("SOFFICE_PATH", r"C:\Program Files\LibreOffice\program\soffice.com")
DEFAULT_WORK_DIR = "C:/tmp/dc_clash"
MAX_PROFILE_PATH = 160      # Studio limit for the soffice profile path (engine/soffice/paths.ts)
SOFFICE_TIMEOUT_S = 180
EXIT_OK, EXIT_CLASH, EXIT_USAGE = 0, 1, 2
OVERFLOW_KINDS = {"header", "register", "seal"}
ZONE_KINDS = OVERFLOW_KINDS | {"footer", "rail", "cover", "allow"}
RULE = {"overlap": "G-01", "out_of_page": "G-02", "out_of_margin": "G-03", "clipped": "G-04", "overflow": "G-06"}
W_NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
# D-599: spine string (EN:2766 "outer margin of cover, dividers, and back cover"; ID:2485 element 12;
# ID:2718 DT-13f) = type . subject . language . REV x . Roman month . year (front/texts.ts spineTextOf)
SPINE_ROLES = frozenset({"cover", "divider", "back"})
ROMAN_MONTHS = {"I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"}
VERTICAL_DIRECTIONS = {"tbRl", "btLr", "tbRlV", "tbLrV", "tbV", "lrTbV"}
# M3 (D-610): untrusted DOCX limits, the same as the TS reader (lib/docx.ts DEFAULT_MAX_*, lib/xml.ts DOCTYPE refusal)
MAX_DOCX_ENTRIES = 20000
MAX_DOCX_PART_BYTES = 64 * 1024 * 1024
MAX_DOCX_TOTAL_BYTES = 256 * 1024 * 1024
MAX_FOOTER_PARTS = 256      # C35 L-04: footer parts read for classification lines (Studio manual000 has 29)
READ_CHUNK_BYTES = 1024 * 1024
_DTD_RE = re.compile(rb"<!\s*(DOCTYPE|ENTITY)", re.IGNORECASE)
# NOTA classification line (C16, R-76): its own paragraph directly under the register row, starting at the text
# edge of the number cell. Manual ID:611-613 ("di baris tersendiri di bawah nomor"), EN:647-649.
CLASSIFICATION_RE = re.compile(r"^(?:Klasifikasi\s*:|Classification\s*:)\s*(?P<value>[^\s:][^:]*)$")
DOC_NUMBER_RE = re.compile(r"\d{1,4}(?:/[A-Z0-9][A-Z0-9.\-]*){3,}")   # 017/GSP/KT/XI/2026
FOOTER_PART_RE = re.compile(r"word/footer\d*\.xml")
ALIGN_TOL_PT = 1.5          # classification line start vs number text start (cell padding is the same)


class UsageError(Exception):
    pass


class DocxLimitError(ValueError):
    """A DOCX package or part breaks the untrusted-input limits (size, entry count, DOCTYPE/ENTITY)."""


# -- model --------------------------------------------------------------------

Box = tuple[float, float, float, float]


@dataclass
class Word:
    text: str
    box: Box
    size: float
    baseline: float
    horizontal: bool
    line: tuple[int, int]          # (block, line) as numbered by PyMuPDF
    glyphs: tuple[Box, ...] = ()   # em box of every glyph; overlap and edge tests use these
    vertical: bool = False         # line direction rotated 90 or 270 degrees

    @property
    def center(self) -> tuple[float, float]:
        return ((self.box[0] + self.box[2]) / 2, (self.box[1] + self.box[3]) / 2)


@dataclass
class Zone:
    name: str
    kind: str
    box: Box
    single_line: bool = False


@dataclass
class Edge:
    horizontal: bool
    pos: float                     # y of a horizontal edge, x of a vertical edge
    lo: float                      # extent along the edge
    hi: float


@dataclass
class Finding:
    kind: str
    words: list[str] = field(default_factory=list)
    others: list[str] = field(default_factory=list)   # overlap only: words of the second line
    box: list[float] | None = None
    details: list[str] = field(default_factory=list)
    seen: set[int] = field(default_factory=set)        # id() of words already listed (a word, not a string)

    def add(self, word: "Word", box: Box, detail: str) -> None:
        if id(word) not in self.seen:
            self.seen.add(id(word))
            self.words.append(word.text)
        self.box = list(box) if self.box is None else [min(self.box[0], box[0]), min(self.box[1], box[1]),
                                                       max(self.box[2], box[2]), max(self.box[3], box[3])]
        if detail not in self.details:
            self.details.append(detail)


def _inside(inner: Box, outer: Box, tol: float = TOL_PT) -> bool:
    return (inner[0] >= outer[0] - tol and inner[1] >= outer[1] - tol
            and inner[2] <= outer[2] + tol and inner[3] <= outer[3] + tol)


def _intersection(a: Box, b: Box) -> Box | None:
    x0, y0, x1, y1 = max(a[0], b[0]), max(a[1], b[1]), min(a[2], b[2]), min(a[3], b[3])
    return (x0, y0, x1, y1) if x0 < x1 and y0 < y1 else None


def _fmt(box) -> str:
    return "[" + ", ".join(f"{v:.2f}" for v in box) + "]"


# -- extraction ---------------------------------------------------------------

def extract_words(page: pymupdf.Page) -> list[Word]:
    """Words (whitespace-separated glyph runs inside one PyMuPDF line) with em boxes."""
    flags = pymupdf.TEXTFLAGS_RAWDICT & ~pymupdf.TEXT_MEDIABOX_CLIP
    raw = page.get_text("rawdict", flags=flags, clip=pymupdf.INFINITE_RECT())
    words: list[Word] = []
    for bi, block in enumerate(raw["blocks"]):
        if block.get("type") != 0:
            continue
        for li, line in enumerate(block["lines"]):
            dx, dy = line["dir"]
            horizontal = abs(dy) < 1e-3 and dx > 0
            vertical = abs(dx) < 1e-3 and abs(abs(dy) - 1) < 1e-3
            run: list[tuple[dict, float]] = []           # (char, span font size)
            for span in line["spans"]:
                for ch in span["chars"]:
                    if ch["c"].isspace():
                        _flush(run, words, horizontal, vertical, (bi, li))
                    else:
                        run.append((ch, span["size"]))
            _flush(run, words, horizontal, vertical, (bi, li))
    return _dedupe(words)


def _flush(run: list[tuple[dict, float]], words: list[Word], horizontal: bool, vertical: bool,
           line: tuple[int, int]) -> None:
    if not run:
        return
    boxes = tuple(tuple(c["bbox"]) for c, _ in run)
    box = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
    words.append(Word("".join(c["c"] for c, _ in run), box, run[0][1], run[0][0]["origin"][1], horizontal, line,
                      boxes, vertical))
    run.clear()


def _dedupe(words: list[Word]) -> list[Word]:
    """Drop exact re-draws (same text, same box within 0.1 pt): they print as one glyph run."""
    seen: set[tuple] = set()
    out = []
    for w in words:
        key = (w.text, *(round(v * 10) for v in w.box))
        if key not in seen:
            seen.add(key)
            out.append(w)
    return out


def extract_drawing(page: pymupdf.Page) -> tuple[list[Edge], list[Box]]:
    """Axis-aligned edges of drawn lines/rectangles, plus seal-coloured filled cells."""
    edges: list[Edge] = []
    seals: list[Box] = []

    def seg(x0, y0, x1, y1) -> None:
        if abs(y1 - y0) <= TOL_PT and abs(x1 - x0) >= MIN_EDGE_PT:
            edges.append(Edge(True, (y0 + y1) / 2, min(x0, x1), max(x0, x1)))
        elif abs(x1 - x0) <= TOL_PT and abs(y1 - y0) >= MIN_EDGE_PT:
            edges.append(Edge(False, (x0 + x1) / 2, min(y0, y1), max(y0, y1)))

    def rect(r) -> None:
        x0, y0, x1, y1 = r.x0, r.y0, r.x1, r.y1
        if (y1 - y0) < THIN_FILL_PT and (x1 - x0) >= MIN_EDGE_PT:
            seg(x0, (y0 + y1) / 2, x1, (y0 + y1) / 2)
        elif (x1 - x0) < THIN_FILL_PT and (y1 - y0) >= MIN_EDGE_PT:
            seg((x0 + x1) / 2, y0, (x0 + x1) / 2, y1)
        else:
            for a, b, c, d in ((x0, y0, x1, y0), (x0, y1, x1, y1), (x0, y0, x0, y1), (x1, y0, x1, y1)):
                seg(a, b, c, d)

    for path in page.get_drawings():
        fill = path.get("fill")
        for item in path["items"]:
            op = item[0]
            if op == "l":
                seg(item[1].x, item[1].y, item[2].x, item[2].y)
            elif op == "re":
                rect(item[1])
                if fill and _is_seal(fill) and item[1].height >= THIN_FILL_PT:
                    seals.append(tuple(item[1]))
            elif op == "qu":
                q = item[1]
                if q.is_rectangular:
                    rect(q.rect)
                    if fill and _is_seal(fill):
                        seals.append(tuple(q.rect))
    # identical edges/cells are often drawn twice (fill pass + border pass)
    uniq_e = {(e.horizontal, round(e.pos, 1), round(e.lo, 1), round(e.hi, 1)): e for e in edges}
    uniq_s = {tuple(round(v, 1) for v in s): s for s in seals}
    return list(uniq_e.values()), list(uniq_s.values())


def _is_seal(rgb) -> bool:
    return len(rgb) == 3 and all(abs(a - b) <= SEAL_RGB_TOL for a, b in zip(rgb, SEAL_RGB, strict=True))


# -- untrusted DOCX reading ---------------------------------------------------

def _counted(name: str) -> bool:
    """Parts the TS reader extracts and counts against the total (lib/docx.ts shouldExtract)."""
    lower = name.lower()
    return lower.endswith((".xml", ".rels")) or (lower.startswith("word/media/") and lower.endswith(".svg"))


def read_docx_parts(docx_path: str | Path,
                    names: tuple[str, ...] = ("word/document.xml", "word/settings.xml")) -> dict[str, bytes]:
    """XML parts of an untrusted DOCX, within MAX_DOCX_* limits; absent optional parts are left out.

    The directory is checked first (entry count, declared size per part and in total), then each part is read
    through a bounded stream, so a part whose real size exceeds its declared size is still cut off at the limit.
    Parts carrying a DOCTYPE or ENTITY declaration are refused (no DTD processing, lib/xml.ts).
    """
    max_part, max_total = MAX_DOCX_PART_BYTES, MAX_DOCX_TOTAL_BYTES
    with zipfile.ZipFile(docx_path) as z:
        infos = z.infolist()
        if len(infos) > MAX_DOCX_ENTRIES:
            raise DocxLimitError(f"package has {len(infos)} entries, more than the limit {MAX_DOCX_ENTRIES}")
        declared = 0
        for info in infos:
            if _counted(info.filename):
                if info.file_size > max_part:
                    raise DocxLimitError(f"part {info.filename} ({info.file_size} B) exceeds the limit {max_part} B")
                declared += info.file_size
        if declared > max_total:
            raise DocxLimitError(f"total of XML parts ({declared} B) exceeds the limit {max_total} B")
        present = {info.filename for info in infos}   # C35 L-04: one set, linear per-name lookups
        if "word/document.xml" not in present:
            raise DocxLimitError("package has no word/document.xml")
        out: dict[str, bytes] = {}
        total = 0
        for name in names:
            if name not in present:
                continue
            buf = bytearray()
            try:
                with z.open(name) as stream:
                    while chunk := stream.read(min(READ_CHUNK_BYTES, max_part + 1 - len(buf))):
                        buf += chunk
                        if len(buf) > max_part:
                            raise DocxLimitError(f"part {name} exceeds the limit {max_part} B after decompression")
            except zipfile.BadZipFile as exc:   # stream cut at the declared size, CRC then fails: size lie or corruption
                raise DocxLimitError(f"part {name} does not match its declared size/CRC: {exc}") from exc
            total += len(buf)
            if total > max_total:
                raise DocxLimitError(f"total of XML parts exceeds the limit {max_total} B after decompression")
            data = bytes(buf)
            probe = data
            if data[:2] in (b"\xff\xfe", b"\xfe\xff"):           # UTF-16 part: look for the declaration as text
                probe = data.decode("utf-16", errors="replace").encode("utf-8")
            if _DTD_RE.search(probe):
                raise DocxLimitError(f"part {name}: DOCTYPE/ENTITY declaration refused (untrusted DOCX)")
            out[name] = data
    return out


# -- geometry -----------------------------------------------------------------

def docx_geometry(docx_path: str | Path) -> list[dict]:
    """Distinct section geometries of a DOCX: page size, margins (l, t, r, b), header/footer distance in pt."""
    parts = read_docx_parts(docx_path)
    root = ET.fromstring(parts["word/document.xml"])
    mirror = False
    if "word/settings.xml" in parts:
        mirror = ET.fromstring(parts["word/settings.xml"]).find(f"{W_NS}mirrorMargins") is not None
    out: list[dict] = []
    for sect in root.iter(f"{W_NS}sectPr"):
        sz, mar = sect.find(f"{W_NS}pgSz"), sect.find(f"{W_NS}pgMar")
        if sz is None or mar is None:
            continue

        def tw(el, name, default=0.0) -> float:
            v = el.get(f"{W_NS}{name}")
            return abs(float(v)) / 20 if v not in (None, "") else default

        w, h = tw(sz, "w", 595.3), tw(sz, "h", 841.9)
        left = tw(mar, "left") + tw(mar, "gutter")
        geo = {"page": (round(w, 2), round(h, 2)),
               "margins": (round(left, 2), round(tw(mar, "top"), 2), round(tw(mar, "right"), 2), round(tw(mar, "bottom"), 2)),
               "header": round(tw(mar, "header"), 2), "footer": round(tw(mar, "footer"), 2)}
        variants = [geo]
        if mirror:
            left_, top_, right_, bottom_ = geo["margins"]
            variants.append({**geo, "margins": (right_, top_, left_, bottom_)})
        for g in variants:
            if g not in out:
                out.append(g)
    return out


def _norm_spine(text: str) -> str:
    return re.sub(r"\s+", "", text).upper()


def is_spine_text(text: str) -> bool:
    """type . subject . language . REV x . Roman month . year, separated by the middle dot."""
    fields = _norm_spine(text).split("\u00b7")
    return (len(fields) >= 4 and re.fullmatch(r"[A-Z]{2,4}", fields[0]) is not None
            and any(re.fullmatch(r"REV[A-Z0-9]+", f) for f in fields)
            and any(f in ROMAN_MONTHS for f in fields) and re.fullmatch(r"\d{4}", fields[-1]) is not None)


def docx_spines(docx_path: str | Path) -> dict:
    """Spine strings of a DOCX (cells with vertical text direction) and the section kinds carrying them.

    Section kind by position, as Studio emits them (wrapper/pages.ts): the first section is the cover,
    the last one (when not the first) the back cover, any other section carrying a spine a divider.
    """
    body = ET.fromstring(read_docx_parts(docx_path, ("word/document.xml",))["word/document.xml"]).find(f"{W_NS}body")
    sections: list[list[str]] = [[]]
    for child in list(body) if body is not None else []:
        for tc in child.iter(f"{W_NS}tc"):
            td = tc.find(f"{W_NS}tcPr/{W_NS}textDirection")
            if td is not None and td.get(f"{W_NS}val") in VERTICAL_DIRECTIONS:
                text = "".join(t.text or "" for t in tc.iter(f"{W_NS}t"))
                if text.strip():
                    sections[-1].append(_norm_spine(text))
        if child.tag == f"{W_NS}p" and child.find(f"{W_NS}pPr/{W_NS}sectPr") is not None:
            sections.append([])
    roles: set[str] = set()
    texts: set[str] = set()
    last = len(sections) - 1
    for i, found in enumerate(sections):
        if found:
            texts.update(found)
            roles.add("cover" if i == 0 else "back" if i == last else "divider")
    return {"roles": roles, "texts": texts}


def _norm_classification(text: str) -> str:
    return re.sub(r"\s+", "", text).upper()


def docx_classification_lines(docx_path: str | Path) -> set[str]:
    """Classification lines of a DOCX footer: a paragraph directly after the register table (C16 placement).

    Returned normalised (no whitespace, upper case) for comparison with the PDF line text.
    """
    with zipfile.ZipFile(docx_path) as z:
        names = tuple(dict.fromkeys(n for n in z.namelist() if FOOTER_PART_RE.fullmatch(n)))
    if len(names) > MAX_FOOTER_PARTS:   # C35 L-04: bounded work on an untrusted package
        raise DocxLimitError(f"package has {len(names)} footer parts, more than the limit {MAX_FOOTER_PARTS}")
    out: set[str] = set()
    for data in read_docx_parts(docx_path, names).values():
        children = list(ET.fromstring(data))
        for prev, cur in zip(children, children[1:], strict=False):
            if prev.tag == f"{W_NS}tbl" and cur.tag == f"{W_NS}p":
                text = "".join(t.text or "" for t in cur.iter(f"{W_NS}t")).strip()
                if CLASSIFICATION_RE.match(text):
                    out.add(_norm_classification(text))
    return out


def page_roles(body_pages: list[bool]) -> list[str | None]:
    """Cover / divider / back-cover role of each page from where the body (interior) pages are.

    A body page carries running-header or register text. Cover = page 1, back cover = last page,
    divider = a page directly before a body page; all three only when they are not body pages.
    """
    n = len(body_pages)
    roles: list[str | None] = []
    for i, is_body in enumerate(body_pages):
        if is_body:
            roles.append(None)
        elif i == 0:
            roles.append("cover")
        elif i == n - 1:
            roles.append("back")
        elif body_pages[i + 1]:
            roles.append("divider")
        else:
            roles.append(None)
    return roles


def default_geometry(page_rect: pymupdf.Rect, margins_mm=None) -> dict:
    margins = tuple(v * MM for v in (margins_mm or DEFAULT_MARGINS_MM))
    hdr, ftr = (v * MM for v in DEFAULT_HEADER_FOOTER_MM)
    return {"page": (page_rect.width, page_rect.height), "margins": margins, "header": hdr, "footer": ftr}


def page_geometry(page_rect: pymupdf.Rect, sections: list[dict], margins_mm) -> tuple[Box, Box, Box]:
    """(body box, header band, footer band) for a page.

    --margins-mm wins; otherwise every DOCX section whose page size matches (+-2 pt) is a
    candidate and the most permissive envelope is used (PDF pages cannot be mapped to
    sections exactly without the layout); otherwise the DATUM default.
    """
    W, H = page_rect.width, page_rect.height
    cands = [] if margins_mm else [g for g in sections
                                   if abs(g["page"][0] - W) <= 2 and abs(g["page"][1] - H) <= 2]
    if not cands:
        cands = [default_geometry(page_rect, margins_mm)]
    bodies = [(g["margins"][0], g["margins"][1], W - g["margins"][2], H - g["margins"][3]) for g in cands]
    body = (min(b[0] for b in bodies), min(b[1] for b in bodies), max(b[2] for b in bodies), max(b[3] for b in bodies))
    header = (body[0], min(g["header"] for g in cands), body[2], max(g["margins"][1] for g in cands))
    footer = (body[0], min(H - g["margins"][3] for g in cands), body[2], max(H - g["footer"] for g in cands))
    return body, header, footer


def load_zones(path: str | None) -> tuple[list[dict], bool]:
    if not path:
        return [], False
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise UsageError(f"--zones {path}: {exc}") from exc
    unit = data.get("units", "mm")
    if unit not in ("mm", "pt"):
        raise UsageError("--zones: units must be 'mm' or 'pt'")
    k = MM if unit == "mm" else 1.0
    zones = []
    for i, z in enumerate(data.get("zones", [])):
        kind = z.get("kind", "allow")
        bbox = z.get("bbox")
        if kind not in ZONE_KINDS or not (isinstance(bbox, list) and len(bbox) == 4):
            raise UsageError(f"--zones entry {i}: kind must be one of {sorted(ZONE_KINDS)} and bbox [x0,y0,x1,y1]")
        kind = "register" if kind == "footer" else kind
        zones.append({"name": z.get("name", f"zone{i}"), "kind": kind,
                      "box": tuple(float(v) * k for v in bbox), "pages": z.get("pages"),
                      "single_line": bool(z.get("single_line", kind in OVERFLOW_KINDS))})
    return zones, bool(data.get("replace_auto", False))


# -- detectors ----------------------------------------------------------------

def _separators(zone: Zone, edges: list[Edge]) -> list[Edge]:
    """Vertical edges that span a single-line zone (register cell separators)."""
    zh = zone.box[3] - zone.box[1]
    return [e for e in edges if not e.horizontal and zone.box[0] + TOL_PT < e.pos < zone.box[2] - TOL_PT
            and min(e.hi, zone.box[3]) - max(e.lo, zone.box[1]) > 0.3 * zh]


def _cells(zone: Zone, edges: list[Edge]) -> list[Zone]:
    """Split a single-line zone into cells at the vertical edges that span it (register block)."""
    xs = sorted({e.pos for e in _separators(zone, edges)})
    bounds = [zone.box[0], *xs, zone.box[2]]
    return [Zone(f"{zone.name} cell {i + 1}", zone.kind, (bounds[i], zone.box[1], bounds[i + 1], zone.box[3]), True)
            for i in range(len(bounds) - 1)]


def _baseline_rows(words: list[Word]) -> list[list[Word]]:
    rows: list[list[Word]] = []
    for w in sorted(words, key=lambda w: w.baseline):
        if rows and w.baseline - rows[-1][-1].baseline <= BASELINE_TOL_PT:
            rows[-1].append(w)
        else:
            rows.append([w])
    return rows


def classification_line(words: list[Word], zone: Zone, edges: list[Edge], body: Box,
                        docx_lines: set[str] | None = None) -> set[int]:
    """id() of the words of the one allowed second line in the register zone: the NOTA classification line.

    Allowed only when all hold (manual ID:611-613, EN:647-649; C16 placement):
      - it is the next baseline after the register row (topmost baseline of the zone) and starts below the row
        (below the cell separators and the row glyphs) within 1.5 line heights;
      - it starts at the text edge of the number cell (the register cell whose row text holds the document number);
      - its text is `Klasifikasi :` / `Classification:` + an upper-case value and, when the DOCX footer has a
        classification paragraph after the register table, equals that paragraph (structural identification);
      - every word stays inside the footer band and the text column.
    Anything else keeps the single-line rule; G-01/G-02/G-04 still apply to the allowed line.
    """
    if zone.kind != "register":
        return set()
    centred = [w for w in words if w.horizontal and _inside((*w.center, *w.center), zone.box, 0)]
    rows = _baseline_rows(centred)
    if len(rows) < 2:
        return set()
    row, base = rows[0], rows[1][0].baseline
    line = sorted((w for w in words if w.horizontal and abs(w.baseline - base) <= BASELINE_TOL_PT
                   and zone.box[1] <= w.center[1] <= zone.box[3]), key=lambda w: w.box[0])
    number = next((ws for c in _cells(zone, edges)
                   if (ws := [w for w in row if c.box[0] <= w.center[0] < c.box[2]])
                   and DOC_NUMBER_RE.search(" ".join(w.text for w in ws))), None)
    if number is None:
        return set()
    row_bottom = max([w.box[3] for w in row] + [e.hi for e in _separators(zone, edges)])
    size = max(w.size for w in line)
    top = min(w.box[1] for w in line)
    if not (row_bottom - TOL_PT <= top <= row_bottom + 1.5 * size):
        return set()
    if abs(line[0].box[0] - min(w.box[0] for w in number)) > ALIGN_TOL_PT:
        return set()
    text = " ".join(w.text for w in line)
    m = CLASSIFICATION_RE.match(text)
    if m is None or m["value"] != m["value"].upper() or not any(ch.isalpha() for ch in m["value"]):
        return set()
    if docx_lines and _norm_classification(text) not in docx_lines:
        return set()
    column = (body[0], zone.box[1], body[2], zone.box[3])
    if not all(_inside(w.box, column) for w in line):
        return set()
    return {id(w) for w in line}


def spine_lines(words: list[Word], body: Box, page_box: Box, role: str | None, spines: dict | None) -> set:
    """D-599: lines allowed in the outer margin = rotated spine string on a cover/divider/back-cover page.

    Outer margin band = right margin (Studio anchors the spine at the recto outer margin,
    wrapper/render.ts spineXml). With a DOCX the text must equal one of its spine strings and the page
    role must be one whose section kind carries a spine; without it, the spine pattern is required.
    """
    allowed_roles = spines["roles"] if spines is not None else SPINE_ROLES
    if role is None or role not in allowed_roles:
        return set()
    band = (body[2], page_box[1], page_box[2], page_box[3])
    by_line: dict[tuple[int, int], list[Word]] = {}
    for w in words:
        by_line.setdefault(w.line, []).append(w)
    ok = set()
    for key, ws in by_line.items():
        if not all(w.vertical for w in ws) or not all(_inside(w.box, band) for w in ws):
            continue
        text = "".join(w.text for w in ws)
        if (_norm_spine(text) in spines["texts"]) if spines is not None else is_spine_text(text):
            ok.add(key)
    return ok


def check_page(page: pymupdf.Page, pno: int, sections: list[dict], margins_mm, user_zones: list[dict],
               replace_auto: bool, words: list[Word] | None = None, role: str | None = None,
               spines: dict | None = None, classification_lines: set[str] | None = None) -> list[dict]:
    words = extract_words(page) if words is None else words
    edges, seals = extract_drawing(page)
    prect = page.rect
    body, header, footer = page_geometry(prect, sections, margins_mm)
    zones: list[Zone] = []
    if not replace_auto:
        zones += [Zone("running header", "header", header, True), Zone("register/footer", "register", footer, True)]
        zones += [Zone(f"seal band cell {i + 1}", "seal", s, True) for i, s in enumerate(sorted(seals))]
    for z in user_zones:
        if z["pages"] is None or pno in z["pages"]:
            zones.append(Zone(z["name"], z["kind"], z["box"], z["single_line"]))

    findings: dict[tuple, Finding] = {}

    def report(kind: str, key, w: Word, box: Box, detail: str) -> None:
        findings.setdefault((kind, key), Finding(kind)).add(w, box, f"{RULE[kind]} {detail}")

    # G-02 / G-03 / G-06 (zone width): containment
    lines_in_overflow_zone: dict[tuple[int, int], Zone] = {}
    for w in words:
        for z in zones:
            if z.kind in OVERFLOW_KINDS and _inside(w.box, z.box):
                lines_in_overflow_zone.setdefault(w.line, z)
    page_box = (prect.x0, prect.y0, prect.x1, prect.y1)
    spine_ok = spine_lines(words, body, page_box, role, spines)
    for w in words:
        if not _inside(w.box, page_box):
            report("out_of_page", w.line, w, w.box, f"text leaves the page box {_fmt(page_box)}")
            continue
        if _inside(w.box, body) or any(_inside(w.box, z.box) for z in zones) or w.line in spine_ok:
            continue
        hit = next((z for z in zones if z.kind in OVERFLOW_KINDS and _intersection(w.box, z.box)), None)
        hit = hit or lines_in_overflow_zone.get(w.line)
        if hit is not None:
            report("overflow", w.line, w, w.box, f"label leaves the {hit.kind} zone '{hit.name}' {_fmt(hit.box)}")
        else:
            report("out_of_margin", w.line, w, w.box, f"body text outside the margin box {_fmt(body)}")

    # G-06: one baseline per single-line zone/cell, no label wider than its cell
    for z in zones:
        if not z.single_line:
            continue
        allowed = classification_line(words, z, edges, body, classification_lines)
        for cell in (_cells(z, edges) if z.kind == "register" else [z]):
            members = [w for w in words if w.horizontal and id(w) not in allowed
                       and _inside((*w.center, *w.center), cell.box, 0)]
            for w in members:
                if not _inside(w.box, cell.box):
                    report("overflow", w.line, w, w.box, f"label wider than {cell.kind} cell '{cell.name}' {_fmt(cell.box)}")
            baselines: list[float] = []
            for b in sorted(w.baseline for w in members):
                if not baselines or b - baselines[-1] > BASELINE_TOL_PT:
                    baselines.append(b)
            if len(baselines) > 1:
                for w in members:
                    if abs(w.baseline - baselines[0]) > BASELINE_TOL_PT:
                        report("overflow", (w.line, "wrap"), w, w.box,
                               f"label wraps in {cell.kind} zone '{cell.name}': {len(baselines)} baselines "
                               f"(y={', '.join(f'{b:.2f}' for b in baselines)}), expected 1")

    # G-04: drawn cell edge through a word (decorations excluded)
    by_line: dict[tuple[int, int], list[Word]] = {}
    for w in words:
        by_line.setdefault(w.line, []).append(w)
    for e in edges:
        for w in words:
            if not any(_crosses(e, g) for g in w.glyphs):
                continue
            if e.horizontal:
                if _is_decoration(e, by_line[w.line]):
                    continue
                where = f"horizontal cell edge y={e.pos:.2f} (x {e.lo:.2f}..{e.hi:.2f})"
            else:
                where = f"vertical cell edge x={e.pos:.2f} (y {e.lo:.2f}..{e.hi:.2f})"
            z = next((z for z in zones if z.kind in OVERFLOW_KINDS and _inside((*w.center, *w.center), z.box, 0)), None)
            if z is not None:
                report("overflow", w.line, w, w.box, f"label crosses {where} in {z.kind} zone '{z.name}'")
            else:
                report("clipped", w.line, w, w.box, f"text crosses {where}")

    # G-01: overlapping word boxes (sweep on y)
    order = sorted(range(len(words)), key=lambda i: words[i].box[1])
    for oi, i in enumerate(order):
        a = words[i]
        for j in order[oi + 1:]:
            b = words[j]
            if b.box[1] >= a.box[3] - TOL_PT:
                break
            if _intersection(a.box, b.box) is None:
                continue
            same_line = a.line == b.line or (a.horizontal and b.horizontal and abs(a.baseline - b.baseline) <= TOL_PT)
            min_w = max(TOL_PT, KERN_EM * min(a.size, b.size)) if same_line else TOL_PT
            # judged on glyph boxes: a word box can span a gap that another line's glyph fills
            hits = [g for ga in a.glyphs for gb in b.glyphs
                    if (g := _intersection(ga, gb)) is not None and g[2] - g[0] > min_w and g[3] - g[1] > TOL_PT]
            if not hits:
                continue
            inter = (min(h[0] for h in hits), min(h[1] for h in hits), max(h[2] for h in hits), max(h[3] for h in hits))
            iw, ih = max(h[2] - h[0] for h in hits), max(h[3] - h[1] for h in hits)
            first, second = (a, b) if a.line <= b.line else (b, a)
            f = findings.setdefault(("overlap", (first.line, second.line)), Finding("overlap"))
            f.add(first, inter, f"G-01 '{first.text}' {_fmt(first.box)} overlaps '{second.text}' "
                                     f"{_fmt(second.box)} by {iw:.2f} x {ih:.2f} pt")
            if -id(second) not in f.seen:
                f.seen.add(-id(second))
                f.others.append(second.text)

    clashes = []
    for (kind, _), f in findings.items():
        if kind == "overlap":   # one clash per pair of lines; bbox = union of the word intersections
            text = " ".join(f.words) + " | " + " ".join(f.others)
            details = f.details[:3] + ([f"... {len(f.details) - 3} more word pairs"] if len(f.details) > 3 else [])
        else:
            text, details = " ".join(f.words), f.details
        clashes.append({"page": pno, "kind": kind, "bbox": [round(v, 2) for v in f.box],
                        "text": text, "detail": "; ".join(details)})
    return clashes


def _crosses(e: Edge, g: Box) -> bool:
    """A drawn edge runs through the inside of a glyph box (not merely along its border)."""
    x0, y0, x1, y1 = g
    if e.horizontal:
        return y0 + TOL_PT < e.pos < y1 - TOL_PT and min(x1, e.hi) - max(x0, e.lo) > TOL_PT
    return x0 + TOL_PT < e.pos < x1 - TOL_PT and min(y1, e.hi) - max(y0, e.lo) > TOL_PT


def _is_decoration(e: Edge, line_words: list[Word]) -> bool:
    """Underline / strike-through: starts at a word start and ends at a word end of the same line."""
    size = max(w.size for w in line_words)
    starts = any(abs(e.lo - w.box[0]) <= 1.0 for w in line_words)
    ends = any(-1.0 <= e.hi - w.box[2] <= 0.4 * size for w in line_words)
    return starts and ends


def analyze(pdf_path: str | Path, docx_path: str | Path | None = None, margins_mm=None,
            zones_path: str | None = None, pdf_label: str | None = None) -> dict:
    sections = docx_geometry(docx_path) if docx_path else []
    spines = docx_spines(docx_path) if docx_path else None
    cl_lines = docx_classification_lines(docx_path) if docx_path else None
    user_zones, replace_auto = load_zones(zones_path)
    small = pymupdf.TOOLS.set_small_glyph_heights()
    pymupdf.TOOLS.set_small_glyph_heights(True)
    try:
        with pymupdf.open(str(pdf_path)) as doc:
            page_words = [extract_words(page) for page in doc]
            body_pages = []
            for page, words in zip(doc, page_words, strict=True):
                _, header, footer = page_geometry(page.rect, sections, margins_mm)
                body_pages.append(any(w.horizontal and (_inside(w.box, header) or _inside(w.box, footer))
                                      for w in words))
            roles = page_roles(body_pages)
            clashes = []
            for pno, page in enumerate(doc, start=1):
                clashes += check_page(page, pno, sections, margins_mm, user_zones, replace_auto,
                                      page_words[pno - 1], roles[pno - 1], spines, cl_lines)
            pages = doc.page_count
    finally:
        pymupdf.TOOLS.set_small_glyph_heights(small)
    clashes.sort(key=lambda c: (c["page"], c["bbox"][1], c["bbox"][0], c["kind"]))
    return {"pdf": pdf_label if pdf_label is not None else str(pdf_path), "pages": pages, "clashes": clashes}


# -- DOCX -> PDF (LibreOffice, short work path) -------------------------------

def convert_docx(docx: Path, pdf_out: Path, work_dir: str, soffice: str) -> None:
    if not Path(soffice).exists():
        raise UsageError(f"soffice not found: {soffice}")
    run = Path(work_dir) / uuid.uuid4().hex[:8]
    profile = run / "p"
    if len(str(profile)) > MAX_PROFILE_PATH:
        raise UsageError(f"--work-dir too long for soffice ({len(str(profile))} > {MAX_PROFILE_PATH} chars): {work_dir}")
    (run / "in").mkdir(parents=True)
    (run / "out").mkdir()
    try:
        src = run / "in" / "d.docx"
        shutil.copyfile(docx, src)
        cmd = [soffice, "--headless", "--norestore", "--nologo", "--nodefault", "--nolockcheck",
               f"-env:UserInstallation={profile.resolve().as_uri()}", "--convert-to", "pdf",
               "--outdir", str(run / "out"), str(src)]
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, errors="replace")
        try:
            out, err = proc.communicate(timeout=SOFFICE_TIMEOUT_S)
        except subprocess.TimeoutExpired as exc:
            if os.name == "nt":  # soffice.com spawns soffice.bin; kill the tree, not only the launcher
                subprocess.run(["taskkill", "/T", "/F", "/PID", str(proc.pid)], capture_output=True)
            proc.kill()
            proc.communicate()
            raise RuntimeError(f"soffice timed out after {SOFFICE_TIMEOUT_S}s converting {docx}") from exc
        produced = run / "out" / "d.pdf"
        if proc.returncode != 0 or not produced.exists():
            raise RuntimeError(f"soffice failed (exit {proc.returncode}): {(err or out).strip()[-500:]}")
        pdf_out.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(produced, pdf_out)
    finally:
        shutil.rmtree(run, ignore_errors=True)


# -- CLI ----------------------------------------------------------------------

def _margins(spec: str | None):
    if spec is None:
        return None
    try:
        vals = tuple(float(v) for v in spec.split(","))
    except ValueError as exc:
        raise UsageError(f"--margins-mm must be four numbers l,t,r,b: {spec!r}") from exc
    if len(vals) != 4 or any(v < 0 for v in vals):
        raise UsageError(f"--margins-mm must be four non-negative numbers l,t,r,b: {spec!r}")
    return vals


class _Parser(argparse.ArgumentParser):
    def error(self, message):  # argparse already exits 2; keep the message on stderr
        self.print_usage(sys.stderr)
        print(f"clash: {message}", file=sys.stderr)
        sys.exit(EXIT_USAGE)


def build_parser() -> argparse.ArgumentParser:
    p = _Parser(description="DATUM PDF text-clash checker (D-593 G-01..G-06). "
                            "Exit 0 = no clashes, 1 = clashes, 2 = usage error / unreadable input.")
    p.add_argument("--pdf", required=True, help="PDF to check; with --docx the converted PDF is written here")
    p.add_argument("--out", required=True, help="JSON report path")
    p.add_argument("--docx", help="DOCX to convert with LibreOffice first; its sections give margins and zones")
    p.add_argument("--no-convert", action="store_true", help="with --docx: only read its geometry, check --pdf as is")
    p.add_argument("--margins-mm", help="l,t,r,b margins in mm for every page (overrides DOCX geometry)")
    p.add_argument("--zones", help='JSON {"units": "mm|pt", "replace_auto": false, '
                                   '"zones": [{"name", "kind", "bbox", "pages", "single_line"}]}')
    p.add_argument("--work-dir", default=DEFAULT_WORK_DIR, help=f"short soffice work dir (default {DEFAULT_WORK_DIR})")
    p.add_argument("--soffice", default=DEFAULT_SOFFICE, help="soffice.com path")
    return p


def run(args: argparse.Namespace) -> tuple[dict, int]:
    margins = _margins(args.margins_mm)
    pdf = Path(args.pdf)
    docx = Path(args.docx) if args.docx else None
    if docx is not None and not docx.is_file():
        raise UsageError(f"--docx not found: {docx}")
    if docx is not None:
        read_docx_parts(docx)   # M3: an untrusted DOCX is checked against the limits before LibreOffice sees it
    if docx is not None and not args.no_convert:
        convert_docx(docx, pdf, args.work_dir, args.soffice)
    if not pdf.is_file():
        raise UsageError(f"--pdf not found: {pdf}")
    report = analyze(pdf, docx, margins, args.zones, pdf_label=args.pdf)
    return report, (EXIT_CLASH if report["clashes"] else EXIT_OK)


def _write_error(out: Path | None, exc: BaseException, args, level: str) -> None:
    record = {
        "timestamp": _dt.datetime.now(_dt.timezone.utc).isoformat(timespec="seconds"),
        "level": level,
        "source": "benchmark/datum_conformance/clash/clash.py",
        "correlationId": str(uuid.uuid4()),
        "message": f"{type(exc).__name__}: {exc}",
        "stack_trace": traceback.format_exc(),
        "context": {"argv": sys.argv[1:], "args": vars(args) if args is not None else None},
    }
    print(f"clash: {record['message']} (correlationId {record['correlationId']})", file=sys.stderr)
    if out is not None:
        try:
            out.parent.mkdir(parents=True, exist_ok=True)
            (out.parent / "clash_error.json").write_text(json.dumps(record, indent=2, ensure_ascii=False), encoding="utf-8")
        except OSError as werr:
            print(f"clash: could not write clash_error.json: {werr}", file=sys.stderr)


def main(argv: list[str] | None = None) -> int:
    for stream in (sys.stdout, sys.stderr):   # -I ignores PYTHONIOENCODING; paths may be non-ASCII
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")
    args = build_parser().parse_args(argv)
    out = Path(args.out)
    try:
        report, code = run(args)
    except UsageError as exc:
        _write_error(out, exc, args, "warn")
        return EXIT_USAGE
    except Exception as exc:  # noqa: BLE001 - unreadable PDF / failed conversion: record durably, exit 2
        _write_error(out, exc, args, "error")
        return EXIT_USAGE
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    by_kind: dict[str, int] = {}
    for c in report["clashes"]:
        by_kind[c["kind"]] = by_kind.get(c["kind"], 0) + 1
    print(f"clash: {len(report['clashes'])} clashes on {report['pages']} pages {by_kind or ''} | {out}")
    return code


if __name__ == "__main__":
    sys.exit(main())
