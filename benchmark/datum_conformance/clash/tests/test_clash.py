"""Behaviour tests for clash.py (S24, D-593 G-01..G-06).

Seams under test: the CLI (exit code + JSON contract the TS harness ingests) and
`analyze()` (same report as a dict). Synthetic PDFs are drawn with PyMuPDF on an
A4 page with the DATUM default geometry (margins 24/26/20/24 mm, header and
footer distance 13 mm), so expected coordinates are known literals.

Run: VENV -I -B -m pytest -p no:cacheprovider benchmark/datum_conformance/clash/tests
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pymupdf
import pytest

HERE = Path(__file__).resolve().parent
CLASH_PY = HERE.parent / "clash.py"
sys.path.insert(0, str(HERE.parent))

import clash  # noqa: E402

A4 = (595.2756, 841.8898)
MM = 72 / 25.4
LEFT, TOP, RIGHT, BOTTOM = 24 * MM, 26 * MM, A4[0] - 20 * MM, A4[1] - 24 * MM  # 68.03, 73.70, 538.58, 773.86


def make_pdf(path: Path, draw) -> Path:
    doc = pymupdf.open()
    page = doc.new_page(width=A4[0], height=A4[1])
    draw(page)
    doc.save(path)
    doc.close()
    return path


def clean_content(page) -> None:
    page.insert_text((LEFT, 45), "PT GEMILANG SATRIA PERKASA - BAB 1", fontsize=6.5)   # running header
    page.insert_text((500, 45), "TERBATAS", fontsize=6.5)
    for i in range(10):                                                                # body, 13.5 pt leading
        page.insert_text((LEFT, 120 + i * 13.5), "Kajian ini menghitung biaya pemeliharaan peralatan.", fontsize=9.5)
    page.draw_rect(pymupdf.Rect(LEFT, 300, 300, 320), color=(0, 0, 0), width=0.6)      # table cell, text inside
    page.insert_text((LEFT + 4, 313), "Biaya material", fontsize=7)
    page.draw_line((LEFT, 786), (RIGHT, 786), width=1.0)                               # register block
    page.draw_line((215.5, 786.6), (215.5, 803.5), width=0.6)
    page.insert_text((LEFT, 797), "GSP 017/GSP/KT/XI/2026", fontsize=6)
    page.insert_text((222, 797), "LEMBAR 4 DARI 7", fontsize=6)


def run_cli(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run([sys.executable, "-I", "-B", str(CLASH_PY), *args],
                          capture_output=True, text=True, encoding="utf-8", timeout=600)


def kinds(report: dict) -> list[str]:
    return sorted(c["kind"] for c in report["clashes"])


# -- contract -----------------------------------------------------------------

def test_clean_page_has_no_clashes_and_follows_contract(tmp_path):
    pdf = make_pdf(tmp_path / "clean.pdf", clean_content)
    out = tmp_path / "clean.json"
    res = run_cli("--pdf", str(pdf), "--out", str(out))
    assert res.returncode == 0, res.stdout + res.stderr
    report = json.loads(out.read_text(encoding="utf-8"))
    assert report == {"pdf": str(pdf), "pages": 1, "clashes": []}


def test_usage_errors_exit_2(tmp_path):
    assert run_cli("--out", str(tmp_path / "x.json")).returncode == 2                       # --pdf missing
    assert run_cli("--pdf", str(tmp_path / "missing.pdf"), "--out", str(tmp_path / "x.json")).returncode == 2
    pdf = make_pdf(tmp_path / "c.pdf", clean_content)
    assert run_cli("--pdf", str(pdf), "--out", str(tmp_path / "x.json"), "--margins-mm", "24,26,20").returncode == 2
    assert not (tmp_path / "x.json").exists()


# -- G-01 overlap -------------------------------------------------------------

def test_overlapping_text_from_different_lines_is_detected(tmp_path):
    def draw(page):
        clean_content(page)
        page.insert_text((200, 500), "OVERLAPPING", fontsize=10)
        page.insert_text((205, 503), "COLLIDING", fontsize=10)      # 3 pt lower, 5 pt right: boxes intersect
    pdf = make_pdf(tmp_path / "ov.pdf", draw)
    out = tmp_path / "ov.json"
    res = run_cli("--pdf", str(pdf), "--out", str(out))
    assert res.returncode == 1
    report = json.loads(out.read_text(encoding="utf-8"))
    assert kinds(report) == ["overlap"]
    c = report["clashes"][0]
    assert c["page"] == 1
    assert "OVERLAPPING" in c["text"] and "COLLIDING" in c["text"]
    x0, y0, x1, y1 = c["bbox"]   # intersection of the two word boxes
    assert x0 == pytest.approx(205, abs=0.6) and y0 == pytest.approx(495.2, abs=0.6)
    assert y1 == pytest.approx(502.2, abs=0.6) and 250 < x1 < 275


def test_adjacent_lines_with_normal_leading_do_not_overlap(tmp_path):
    def draw(page):
        for i in range(5):  # leading == font size: em boxes touch, never intersect
            page.insert_text((LEFT, 200 + i * 10), "Baris rapat dengan spasi sama dengan ukuran huruf", fontsize=10)
    report = clash.analyze(make_pdf(tmp_path / "lead.pdf", draw))
    assert report["clashes"] == []


# -- G-02 out of page ---------------------------------------------------------

def test_text_beyond_page_edge_is_detected(tmp_path):
    def draw(page):
        clean_content(page)
        page.insert_text((560, 400), "Overflowing", fontsize=10)    # runs past x = 595.28
    pdf = make_pdf(tmp_path / "oop.pdf", draw)
    report = clash.analyze(pdf)
    assert kinds(report) == ["out_of_page"]
    c = report["clashes"][0]
    assert c["page"] == 1 and c["text"] == "Overflowing"
    assert c["bbox"][0] == pytest.approx(560, abs=0.5) and c["bbox"][2] > A4[0]
    assert c["bbox"][3] == pytest.approx(402.2, abs=0.6)


# -- G-03 out of margin -------------------------------------------------------

def test_body_text_in_outer_margin_is_detected(tmp_path):
    def draw(page):
        clean_content(page)
        page.insert_text((545, 600), "x", fontsize=9.5)             # right margin starts at 538.58
    report = clash.analyze(make_pdf(tmp_path / "om.pdf", draw))
    assert kinds(report) == ["out_of_margin"]
    c = report["clashes"][0]
    assert c["text"] == "x" and c["bbox"][0] == pytest.approx(545, abs=0.5)


def test_margins_parameter_overrides_default(tmp_path):
    def draw(page):
        page.insert_text((40, 400), "inside a 10 mm margin", fontsize=9.5)
    pdf = make_pdf(tmp_path / "m.pdf", draw)
    assert kinds(clash.analyze(pdf)) == ["out_of_margin"]
    assert clash.analyze(pdf, margins_mm=(10, 26, 20, 24))["clashes"] == []


def test_zone_parameter_allows_text_outside_margin(tmp_path):
    def draw(page):
        page.insert_text((545, 600), "rail", fontsize=7)
    pdf = make_pdf(tmp_path / "z.pdf", draw)
    zones = tmp_path / "zones.json"
    zones.write_text(json.dumps({"units": "pt", "zones": [
        {"name": "rail", "kind": "rail", "bbox": [540, 0, 595, 841]}]}), encoding="utf-8")
    out = tmp_path / "z.json"
    assert run_cli("--pdf", str(pdf), "--out", str(out), "--zones", str(zones)).returncode == 0


# -- G-04 clipped -------------------------------------------------------------

def test_text_crossing_a_drawn_cell_edge_is_detected(tmp_path):
    def draw(page):
        clean_content(page)
        page.draw_rect(pymupdf.Rect(100, 600, 300, 612), color=(0, 0, 0), width=0.6)
        page.insert_text((110, 615), "Terpotong", fontsize=9)       # em box 607.96..616.96 crosses y = 612
    report = clash.analyze(make_pdf(tmp_path / "cl.pdf", draw))
    assert kinds(report) == ["clipped"]
    c = report["clashes"][0]
    assert c["text"] == "Terpotong" and c["page"] == 1
    assert c["bbox"][0] == pytest.approx(110, abs=0.5) and c["bbox"][1] < 612 < c["bbox"][3]
    assert "612" in c["detail"]


def test_underline_under_its_own_text_is_not_a_cell_edge(tmp_path):
    def draw(page):
        page.insert_text((100, 400), "Tautan bergaris bawah", fontsize=10)
        w = pymupdf.get_text_length("Tautan bergaris bawah", fontsize=10)
        page.draw_line((100, 401), (100 + w, 401), width=0.5)        # decoration inside the em box
    assert clash.analyze(make_pdf(tmp_path / "ul.pdf", draw))["clashes"] == []


# -- G-06 overflow ------------------------------------------------------------

def test_over_long_header_label_is_detected(tmp_path):
    long_label = ("PT GEMILANG SATRIA PERKASA - BIAYA PEMELIHARAAN GARDU INDUK CIKUPA 150 KV - BAB 1 - "
                  "LINGKUP KAJIAN, METODE DAN SELURUH LAMPIRAN TEKNIS")
    width = pymupdf.get_text_length(long_label, fontsize=6.5)
    assert RIGHT < LEFT + width < A4[0]                              # precondition: past the margin, on the page
    def draw(page):
        page.insert_text((LEFT, 45), long_label, fontsize=6.5)       # runs past the 538.58 right margin
    report = clash.analyze(make_pdf(tmp_path / "hd.pdf", draw))
    assert report["clashes"], report
    assert set(kinds(report)) == {"overflow"}
    c = report["clashes"][0]
    assert c["page"] == 1 and c["bbox"][2] > RIGHT and 30 < c["bbox"][1] < 45
    assert "header" in c["detail"]


def test_wrapped_header_label_is_detected(tmp_path):
    def draw(page):
        page.insert_text((LEFT, 45), "PT GEMILANG SATRIA PERKASA", fontsize=6.5)
        page.insert_text((LEFT, 53), "BIAYA PEMELIHARAAN", fontsize=6.5)   # second line inside the header band
    report = clash.analyze(make_pdf(tmp_path / "wr.pdf", draw))
    assert kinds(report) == ["overflow"]
    assert "wrap" in report["clashes"][0]["detail"]


def test_seal_band_cell_label_overflow_is_detected(tmp_path):
    seal = (0.4314, 0.0784, 0.1255)
    def draw(page):
        page.draw_rect(pymupdf.Rect(LEFT, TOP, 303.4, TOP + 17.5), color=None, fill=seal)
        page.draw_rect(pymupdf.Rect(303.4, TOP, RIGHT, TOP + 17.5), color=None, fill=seal)
        page.insert_text((75, TOP + 12), "KLASIFIKASI TERBATAS", fontsize=6, color=(1, 1, 1))
        page.insert_text((250, TOP + 12), "SALINAN INDUK PENGGUNAAN INTERNAL", fontsize=6, color=(1, 1, 1))
    report = clash.analyze(make_pdf(tmp_path / "seal.pdf", draw))
    assert report["clashes"] and set(kinds(report)) == {"overflow"}
    c = report["clashes"][0]
    assert c["bbox"][0] < 303.4 < c["bbox"][2] and "seal" in c["detail"]


def test_register_cell_wrap_is_detected(tmp_path):
    def draw(page):
        clean_content(page)
        page.insert_text((222, 804), "TAMBAHAN", fontsize=6)        # second baseline in register cell 2
    report = clash.analyze(make_pdf(tmp_path / "reg.pdf", draw))
    assert kinds(report) == ["overflow"]
    assert "register" in report["clashes"][0]["detail"]


# -- DOCX section geometry and conversion -------------------------------------

def _docx(path: Path, left_tw: int) -> Path:
    import docx  # python-docx, present in the hermes venv
    from docx.shared import Twips
    d = docx.Document()
    s = d.sections[0]
    s.page_width, s.page_height = Twips(11906), Twips(16838)
    s.left_margin, s.right_margin = Twips(left_tw), Twips(1134)
    s.top_margin, s.bottom_margin = Twips(1474), Twips(1361)
    s.header_distance = s.footer_distance = Twips(737)
    d.add_paragraph("Paragraf isi pendek.")
    d.save(path)
    return path


def test_docx_section_geometry_is_read(tmp_path):
    geo = clash.docx_geometry(_docx(tmp_path / "g.docx", 567))
    assert len(geo) == 1
    g = geo[0]
    assert g["page"] == pytest.approx((595.3, 841.9), abs=0.1)
    assert g["margins"] == pytest.approx((28.35, 73.7, 56.7, 68.05), abs=0.05)
    assert g["header"] == pytest.approx(36.85, abs=0.05) and g["footer"] == pytest.approx(36.85, abs=0.05)


@pytest.mark.skipif(not Path(clash.DEFAULT_SOFFICE).exists(), reason="LibreOffice not installed")
def test_docx_is_converted_then_checked(tmp_path):
    src = _docx(tmp_path / "conv.docx", 1361)
    pdf = tmp_path / "conv.pdf"
    out = tmp_path / "conv.json"
    res = run_cli("--docx", str(src), "--pdf", str(pdf), "--out", str(out))
    assert res.returncode == 0, res.stdout + res.stderr
    assert pdf.read_bytes()[:5] == b"%PDF-"
    assert json.loads(out.read_text(encoding="utf-8"))["pages"] == 1


def test_repeated_words_are_all_kept_in_the_clash_text(tmp_path):
    def draw(page):
        for i, ch in enumerate("BIAYAA"):                          # letter-spaced label in the outer margin
            page.insert_text((560, 300 + i * 12), ch, fontsize=7)
    report = clash.analyze(make_pdf(tmp_path / "rep.pdf", draw))
    assert [c["text"] for c in report["clashes"] if c["kind"] == "out_of_margin"] == ["B", "I", "A", "Y", "A", "A"] \
        or " ".join(c["text"] for c in report["clashes"]) == "B I A Y A A"


MANUAL_000 = (HERE.parents[3] / "benchmark" / "out" / "fixb" / "official"
              / "Manual Komprehensif DATUM GSP 000-GSP-STD-X-2026 RevA.pdf")


@pytest.mark.skipif(not MANUAL_000.exists(), reason="Manual 000 PDF not present")
def test_fallback_glyph_gap_is_not_an_overlap():
    # Manual 000 p.96 "Yunani, √, ≤, →": LibreOffice draws the Plex comma before the fallback-font
    # glyphs, so PyMuPDF puts "√≤," in a second line whose word box spans the comma; the glyphs
    # themselves only touch (0.04 pt). Overlap must be judged on glyph boxes, not word boxes.
    report = clash.analyze(MANUAL_000)
    assert [c for c in report["clashes"] if c["page"] == 96 and c["kind"] == "overlap"] == []


# -- D-599: spine string in the outer margin of cover / divider / back cover ---

SPINE = "KT · BIAYA PEMELIHARAAN GI CIKUPA · ID · REV A · XI · 2026"


def make_pages(path: Path, *draws) -> Path:
    doc = pymupdf.open()
    for draw in draws:
        draw(doc.new_page(width=A4[0], height=A4[1]))
    doc.save(path)
    doc.close()
    return path


def cover(page) -> None:
    page.insert_text((LEFT, 300), "Kajian Biaya Pemeliharaan", fontsize=25)


def spine(page, x: float = 570, y: float = 400) -> None:
    page.insert_text((x, y), SPINE, fontsize=6, rotate=90)      # outer margin band 538.58..595.28


def test_rotated_spine_in_outer_margin_of_cover_is_allowed(tmp_path):
    pdf = make_pages(tmp_path / "sp1.pdf", lambda p: (cover(p), spine(p)), clean_content)
    assert clash.analyze(pdf)["clashes"] == []


def test_spine_on_a_body_page_is_flagged(tmp_path):
    pdf = make_pages(tmp_path / "sp2.pdf", cover, lambda p: (clean_content(p), spine(p)))
    report = clash.analyze(pdf)
    assert [(c["page"], c["kind"]) for c in report["clashes"]] == [(2, "out_of_margin")]
    assert report["clashes"][0]["bbox"][0] == pytest.approx(565.3, abs=0.5)


def test_horizontal_label_in_outer_margin_of_cover_is_flagged(tmp_path):
    pdf = make_pages(tmp_path / "sp3.pdf", lambda p: (cover(p), p.insert_text((545, 400), "KT · ID · XI", fontsize=6)),
                     clean_content)
    report = clash.analyze(pdf)
    assert [(c["page"], c["kind"]) for c in report["clashes"]] == [(1, "out_of_margin")]


def test_spine_overlapping_other_text_is_flagged(tmp_path):
    def draw(page):
        cover(page)
        spine(page)
        page.insert_text((562, 300), "XX", fontsize=9)                # sits on the spine glyphs
    report = clash.analyze(make_pages(tmp_path / "sp4.pdf", draw, clean_content))
    overlaps = [c for c in report["clashes"] if c["kind"] == "overlap"]
    assert overlaps and overlaps[0]["page"] == 1 and "XX" in overlaps[0]["text"]


def test_spine_out_of_page_is_still_flagged(tmp_path):
    pdf = make_pages(tmp_path / "sp5.pdf", lambda p: (cover(p), spine(p, x=598)), clean_content)  # box 593.3..599.3
    assert [c["kind"] for c in clash.analyze(pdf)["clashes"]] == ["out_of_page"]


def test_rotated_text_not_matching_the_spine_pattern_is_flagged(tmp_path):
    def draw(page):
        cover(page)
        page.insert_text((570, 400), "CATATAN SAMPING BEBAS", fontsize=6, rotate=90)
    report = clash.analyze(make_pages(tmp_path / "sp6.pdf", draw, clean_content))
    assert [(c["page"], c["kind"]) for c in report["clashes"]] == [(1, "out_of_margin")]


def test_docx_spine_text_and_section_kind_are_read(tmp_path):
    import docx
    from docx.oxml import parse_xml
    d = docx.Document()
    d.add_paragraph("Sampul")
    w = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
    tbl = parse_xml(f'<w:tbl {w}><w:tblPr/><w:tblGrid><w:gridCol w:w="240"/></w:tblGrid><w:tr><w:tc><w:tcPr>'
                    f'<w:textDirection w:val="tbRl"/></w:tcPr><w:p><w:r><w:t>KT · Biaya Pemeliharaan GI Cikupa · ID · '
                    f'REV A · XI · 2026</w:t></w:r></w:p></w:tc></w:tr></w:tbl>')
    d.element.body.insert(1, tbl)
    d.add_section()
    d.add_paragraph("Bab 1")
    path = tmp_path / "spine.docx"
    d.save(path)
    spines = clash.docx_spines(path)
    assert spines == {"roles": {"cover"}, "texts": {"KT·BIAYAPEMELIHARAANGICIKUPA·ID·REVA·XI·2026"}}


# -- untrusted DOCX (M3, D-610): same limits as the TS reader (lib/docx.ts, lib/xml.ts) ----

_DOC_XML = (b'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            b'<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
            b'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1474" w:right="1134" w:bottom="1361" '
            b'w:left="1361" w:header="737" w:footer="737" w:gutter="0"/></w:sectPr></w:body></w:document>')


def _zip(path: Path, parts: dict[str, bytes]) -> Path:
    import zipfile
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        for name, data in parts.items():
            z.writestr(name, data)
    return path


def _lie_about_size(path: Path, name: str, declared: int) -> None:
    """Rewrite the uncompressed size of `name` in the local header and the central directory."""
    import struct
    import zipfile
    data = bytearray(path.read_bytes())
    with zipfile.ZipFile(path) as z:
        info = z.getinfo(name)
    struct.pack_into("<I", data, info.header_offset + 22, declared)          # local file header
    pos = 0
    while (pos := data.find(b"PK\x01\x02", pos)) >= 0:                         # central directory entry of `name`
        n = struct.unpack_from("<H", data, pos + 28)[0]
        if bytes(data[pos + 46:pos + 46 + n]) == name.encode():
            struct.pack_into("<I", data, pos + 24, declared)
            break
        pos += 4
    path.write_bytes(bytes(data))
    with zipfile.ZipFile(path) as z:
        assert z.getinfo(name).file_size == declared


def test_docx_minimal_package_is_read_within_limits(tmp_path):
    geo = clash.docx_geometry(_zip(tmp_path / "ok.docx", {"word/document.xml": _DOC_XML}))
    assert geo[0]["margins"] == pytest.approx((68.05, 73.7, 56.7, 68.05), abs=0.05)


def test_docx_oversized_part_is_refused(tmp_path, monkeypatch):
    monkeypatch.setattr(clash, "MAX_DOCX_PART_BYTES", 64 * 1024)
    bomb = _DOC_XML.replace(b"<w:body>", b"<w:body>" + b"<w:p/>" * 200_000)   # 1.2 MB, compresses to a few KB
    path = _zip(tmp_path / "bomb.docx", {"word/document.xml": bomb})
    assert path.stat().st_size < 64 * 1024
    with pytest.raises(clash.DocxLimitError, match="word/document.xml"):
        clash.docx_geometry(path)
    with pytest.raises(clash.DocxLimitError):
        clash.docx_spines(path)


def test_docx_part_larger_than_its_declared_size_is_refused(tmp_path, monkeypatch):
    monkeypatch.setattr(clash, "MAX_DOCX_PART_BYTES", 64 * 1024)
    bomb = _DOC_XML.replace(b"<w:body>", b"<w:body>" + b"<w:p/>" * 200_000)
    path = _zip(tmp_path / "liar.docx", {"word/document.xml": bomb})
    _lie_about_size(path, "word/document.xml", 100)                            # header says 100 B
    with pytest.raises(clash.DocxLimitError, match="word/document.xml"):
        clash.docx_geometry(path)


def test_docx_total_and_entry_caps(tmp_path, monkeypatch):
    parts = {"word/document.xml": _DOC_XML, **{f"word/extra{i}.xml": b"<x/>" * 300 for i in range(8)}}
    path = _zip(tmp_path / "many.docx", parts)
    monkeypatch.setattr(clash, "MAX_DOCX_ENTRIES", 5)
    with pytest.raises(clash.DocxLimitError, match="entries"):
        clash.docx_geometry(path)
    monkeypatch.setattr(clash, "MAX_DOCX_ENTRIES", 20000)
    monkeypatch.setattr(clash, "MAX_DOCX_TOTAL_BYTES", 4 * 1024)
    with pytest.raises(clash.DocxLimitError, match="total"):
        clash.docx_geometry(path)


@pytest.mark.parametrize("prolog", [
    b'<!DOCTYPE w:document [<!ENTITY a "aaaaaaaaaa">]>',
    b'<!DOCTYPE w:document SYSTEM "http://example.invalid/x.dtd">',
])
def test_docx_part_with_doctype_is_refused(tmp_path, prolog):
    xml = _DOC_XML.replace(b'standalone="yes"?>', b'standalone="yes"?>' + prolog)
    path = _zip(tmp_path / "dtd.docx", {"word/document.xml": xml})
    with pytest.raises(clash.DocxLimitError, match="DOCTYPE"):
        clash.docx_geometry(path)


def test_docx_settings_part_with_entity_is_refused(tmp_path):
    settings = (b'<?xml version="1.0"?><!DOCTYPE s [<!ENTITY x "y">]>'
                b'<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>')
    path = _zip(tmp_path / "set.docx", {"word/document.xml": _DOC_XML, "word/settings.xml": settings})
    with pytest.raises(clash.DocxLimitError, match="word/settings.xml"):
        clash.docx_geometry(path)


def test_cli_refuses_hostile_docx_before_conversion_with_exit_2(tmp_path):
    xml = _DOC_XML.replace(b'standalone="yes"?>', b'standalone="yes"?><!DOCTYPE d [<!ENTITY e "e">]>')
    src = _zip(tmp_path / "hostile.docx", {"word/document.xml": xml})
    out = tmp_path / "r" / "out.json"
    res = run_cli("--docx", str(src), "--pdf", str(tmp_path / "never.pdf"), "--out", str(out),
                  "--soffice", str(tmp_path / "no-soffice.exe"))
    assert res.returncode == 2
    record = json.loads((out.parent / "clash_error.json").read_text(encoding="utf-8"))
    assert "DocxLimitError" in record["message"] and "DOCTYPE" in record["message"]
    assert not out.exists() and not (tmp_path / "never.pdf").exists()
