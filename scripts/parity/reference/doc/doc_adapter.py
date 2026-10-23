# -*- coding: utf-8 -*-
"""studio.doc/v1 JSON -> DatumDocx (Garis A datum-house-style v2.6.0) calls.

Reference side of the DOCX/PDF parity harness (blueprint row S64, spec
masterplan/01_specs.md sections 3 and 11, decision D-10). Every block kind of
spec section 3.4 is mapped to the nearest DatumDocx / datumbind call; Rev L
(datum-revl) only supplements what Garis A lacks (datumchart for chart kinds
P-01, P-02, P-11, W-02).

Each block produces one report entry with a status:
  supported     direct DatumDocx call, no field lost
  approximated  composed from DatumDocx calls / its own OOXML helpers; the lost or
                re-interpreted fields are listed in ``notes``
  unsupported   no DatumDocx equivalent; nothing emitted (never skipped silently)
  rejected      a skill guard refused it (CheckDefect, BindDefect, DiagramDefect,
                ChartDefect, RefDefect); anything it had emitted is rolled back
  error         unexpected failure (traceback recorded); rolled back

The skill folders are imported read-only through explicit sys.path entries; run
the interpreter with ``-I -B`` so no bytecode is written next to the skill.
"""
import base64
import datetime
import hashlib
import importlib.util
import os
import re
import sys
import traceback

HS_DIR_DEFAULT = r"C:\Users\TRIAL\AppData\Local\hermes\skills\gsp\datum-house-style"
RL_DIR_DEFAULT = r"C:\Users\TRIAL\AppData\Local\hermes\profiles\gspuser02\skills\datum-revl"
DOC_NO_FALLBACK = "REF-TANPA-NOMOR"

# Chart kinds with a Rev L datumchart reference (research/06 section 5.1, row CA).
CHART_FAMILY = {"P-01": "bar", "P-02": "column", "P-11": "threshold", "W-02": "column"}

# paragraph.role (spec 3.4) -> tokens.json type.scale_pt key used by DatumDocx.para().
ROLE_SCALE = {
    "body": "body", "identity": "body", "anchor": "body", "pivot": "body",
    "closingAction": "body", "lede": "body", "note": "body", "methodStatement": "body",
    "addressLine": "body", "standfirst": "body", "scopeLine": "body",
    "subheading": "section_heading", "blockHeading": "section_heading",
    "kicker": "chapter_kicker", "pageTitle": "chapter_title", "title": "chapter_title",
}

TABLE_TYPES = {"table", "specTable", "registerTable", "exampleWrongRight", "ruleTable",
               "checklist", "glossary", "sourceRegister", "ruleIndex", "referenceScale",
               "financialTable"}

_EXPR_FUNCS = ("abs", "round", "sqrt", "min", "max")
_EXPR_REST_RE = re.compile(r"^[0-9\s+\-*/().,%]*$")


class RefDefect(Exception):
    """Adapter-level refusal (e.g. unsafe derivation expression)."""


class InputError(Exception):
    """Input JSON is not a usable studio.doc/v1 document (CLI exit 2)."""


class _Unsupported(Exception):
    """Raised by a block handler, before emitting anything, when the block has no
    reference equivalent; recorded as an 'unsupported' entry."""


# ------------------------------------------------------------------ engines
class Engines:
    """Read-only imports of the reference skills."""

    def __init__(self, hs_dir=None, rl_dir=None):
        self.hs_dir = os.path.abspath(hs_dir or os.environ.get("DATUM_HS_DIR") or HS_DIR_DEFAULT)
        self.rl_dir = os.path.abspath(rl_dir or os.environ.get("DATUM_RL_DIR") or RL_DIR_DEFAULT)
        if not os.path.isfile(os.path.join(self.hs_dir, "datum_docx.py")):
            raise InputError("datum_docx.py tidak ditemukan di %s (DATUM_HS_DIR)" % self.hs_dir)
        if self.hs_dir not in sys.path:
            sys.path.insert(0, self.hs_dir)
        import datum_docx
        import datumbind
        import datumcheck
        self.dd, self.bind, self.check = datum_docx, datumbind, datumcheck
        self.defects = [datumcheck.CheckDefect, datumbind.BindDefect, RefDefect]
        self._diagram = self._symbols = self._chart = None

    def diagram(self):
        if self._diagram is None:
            import datum_diagram
            self._diagram = datum_diagram
            self.defects.append(datum_diagram.DiagramDefect)
        return self._diagram

    def symbols(self):
        if self._symbols is None:
            import datumsimbol
            self._symbols = datumsimbol
        return self._symbols

    def chart(self):
        """Rev L datumchart, loaded by file path under a private module name so the
        Garis B siblings (datum_docx, datumbind, ...) never shadow Garis A."""
        if self._chart is None:
            path = os.path.join(self.rl_dir, "scripts", "datumchart.py")
            spec = importlib.util.spec_from_file_location("revl_datumchart", path)
            if spec is None or not os.path.isfile(path):
                raise RefDefect("datumchart.py Rev L tidak ditemukan: %s" % path)
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            self._chart = mod
            self.defects.append(mod.ChartDefect)
        return self._chart

    def describe(self):
        tok = self.bind.tokens_path()
        with open(tok, "rb") as fh:
            tok_sha = hashlib.sha256(fh.read()).hexdigest()
        try:
            import docx as _pd
            pd_ver = getattr(_pd, "__version__", None)
        except Exception:  # noqa: BLE001
            pd_ver = None
        return {"line": "A", "hsDir": self.hs_dir, "rlDir": self.rl_dir,
                "tokensPath": tok, "tokensSha256": tok_sha, "pythonDocx": pd_ver,
                "python": sys.version.split()[0]}


# ------------------------------------------------------------------ inline
def _run_text(r):
    if "t" in r:
        return r["t"]
    if r.get("tab"):
        return "\t"
    if r.get("br"):
        return "\n"
    return ""


def _is_runs(inline):
    return isinstance(inline, dict) and "runs" in inline


class Adapter:
    def __init__(self, doc, doc_dir, work_dir, engines, rasterizer):
        self.doc = doc
        self.doc_dir = doc_dir
        self.work_dir = work_dir
        self.E = engines
        self.raster = rasterizer
        self.entries = []
        self.D = None
        self.fig_files = 0
        self.cur_key = None
        self.deriv_seq = 0
        dd = engines.dd
        self.MARKS = dd.MARKS
        self.SCALE = dd._SCALE

    # ---------------------------------------------------------- reporting
    def _entry(self, pointer, btype, status, call=None, notes=None, error=None):
        e = {"pointer": pointer, "type": btype, "status": status}
        if call:
            e["call"] = call
        if notes:
            e["notes"] = notes
        if error:
            e["error"] = error
        self.entries.append(e)
        return e

    def _guarded(self, pointer, btype, fn):
        """Run fn() -> (status, call, notes). Roll back emitted body XML on failure."""
        body = self.D.doc.element.body
        before = list(body)
        seqs = (self.D.t_seq, self.D.f_seq)
        try:
            status, call, notes = fn()
            return self._entry(pointer, btype, status, call, notes)
        except _Unsupported as ex:
            return self._entry(pointer, btype, "unsupported", None, [str(ex)])
        except Exception as ex:  # noqa: BLE001 - classified and recorded below
            for child in list(body):
                if not any(child is b for b in before):
                    body.remove(child)
            self.D.t_seq, self.D.f_seq = seqs
            rejected = isinstance(ex, tuple(self.E.defects))
            err = {"timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                   "level": "warn" if rejected else "error",
                   "source": "ref_doc.doc_adapter",
                   "class": type(ex).__name__, "message": str(ex),
                   "context": {"pointer": pointer, "type": btype}}
            if not rejected:
                err["stackTrace"] = traceback.format_exc()
            return self._entry(pointer, btype, "rejected" if rejected else "error",
                               None, None, err)

    # ------------------------------------------------------------ inline
    def md_plain(self, text):
        """md-lite -> plain text (markers removed; URLs kept as written)."""
        out = []
        for tok in self.E.dd.INLINE_RE.split(text or ""):
            if not tok:
                continue
            if tok.startswith("**") and tok.endswith("**") and len(tok) > 4:
                out.append(tok[2:-2])
            elif tok.startswith("`") and tok.endswith("`") and len(tok) > 2:
                out.append(tok[1:-1])
            elif tok.startswith("*") and tok.endswith("*") and len(tok) > 2:
                out.append(tok[1:-1])
            else:
                out.append(tok)
        return "".join(out)

    def plain(self, inline):
        if inline is None:
            return ""
        if isinstance(inline, str):
            return self.md_plain(inline)
        if _is_runs(inline):
            return "".join(_run_text(r) for r in inline["runs"])
        return self.md_plain(inline.get("text", ""))

    def raw_md(self, inline):
        """Inline -> md-lite string (text kept verbatim, runs concatenated)."""
        if inline is None:
            return ""
        if _is_runs(inline):
            return "".join(_run_text(r) for r in inline["runs"])
        return inline.get("text", "")

    def _base(self, role):
        dd = self.E.dd
        s = self.SCALE[role]
        return s, dd.face(s["face"]), s["size"], dd._hex(dd._COL["interior"][s["colour"]])

    def runs_para(self, runs, role):
        """Run-level paragraph built with Garis A's own helpers (style_run,
        fmt_para, add_field) at the role's scale, mirroring para()'s spacing."""
        dd = self.E.dd
        s, f, size, colour = self._base(role)
        p = self.D.doc.add_paragraph()
        dd.fmt_para(p, line_pt=s.get("leading", s["size"] * 1.4), after=4)
        for r in runs:
            if "field" in r:
                rf = self._run_face(r) or f
                rs = r["szHalfPt"] / 2.0 if r.get("szHalfPt") else size
                dd.add_field(p, r["field"], "1" if r["field"] == "PAGE" else "",
                             font=rf, size=rs, color=r.get("color") or colour,
                             bold=bool(r.get("b")))
                continue
            run = p.add_run()
            if "t" in r:
                run.text = r["t"]
            elif r.get("tab"):
                run.add_tab()
            elif r.get("br"):
                run.add_break()
            dd.style_run(run, f, size, colour)
            self.apply_run_props(run, r)
        return p

    def emit_inline(self, inline, role, fmt=None, run_defaults=None):
        if _is_runs(inline):
            p = self.runs_para(inline["runs"], role)
        else:
            p = self.D.para(inline.get("text", ""), role=role)
        if run_defaults:
            for run in p.runs:
                self.apply_run_props(run, run_defaults)
        if fmt:
            self.apply_para_format(p, fmt)
        return p

    # ------------------------------------------------------ OOXML overrides
    def _run_face(self, props):
        dd = self.E.dd
        if props.get("face"):
            return props["face"]
        fr = props.get("faceRole")
        return {"serif": dd.SERIF, "condensed": dd.COND, "mono": dd.MONO,
                "workbookUi": dd.face("workbook_ui")}.get(fr)

    def apply_run_props(self, run, props):
        dd = self.E.dd
        rPr = run._r.get_or_add_rPr()
        qn, O = dd.qn, dd.OxmlElement
        face = self._run_face(props)
        if face:
            rf = O("w:rFonts")
            for a in ("ascii", "hAnsi", "eastAsia", "cs"):
                rf.set(qn("w:" + a), face)
            dd.oei(rPr, dd.RPR_ORDER, rf)
        for key, tag in (("b", "w:b"), ("i", "w:i"), ("caps", "w:caps")):
            if key in props:
                if props[key]:
                    dd.oei(rPr, dd.RPR_ORDER, O(tag))
                else:
                    for el in rPr.findall(qn(tag)):
                        rPr.remove(el)
        if props.get("color"):
            dd.oei(rPr, dd.RPR_ORDER, dd.val_el("w:color", "val", props["color"]))
        if "spacingTw" in props:
            dd.oei(rPr, dd.RPR_ORDER, dd.val_el("w:spacing", "val", int(props["spacingTw"])))
        if props.get("szHalfPt"):
            dd.oei(rPr, dd.RPR_ORDER, dd.val_el("w:sz", "val", int(props["szHalfPt"])))
            dd.oei(rPr, dd.RPR_ORDER, dd.val_el("w:szCs", "val", int(props["szHalfPt"])))
        if props.get("u"):
            dd.oei(rPr, dd.RPR_ORDER, dd.val_el("w:u", "val", props["u"]))
        if props.get("vertAlign"):
            dd.oei(rPr, dd.RPR_ORDER, dd.val_el("w:vertAlign", "val", props["vertAlign"]))

    def apply_para_format(self, p, f):
        dd = self.E.dd
        qn, O = dd.qn, dd.OxmlElement
        pPr = p._p.get_or_add_pPr()

        def merged(tag, attrs):
            el = pPr.find(qn(tag))
            if el is None:
                el = O(tag)
                dd.oei(pPr, dd.PPR_ORDER, el)
            for k, v in attrs.items():
                el.set(qn("w:" + k), str(v))

        sp = {k: f[j] for j, k in (("spacingBeforeTw", "before"), ("spacingAfterTw", "after"),
                                   ("lineTw", "line"), ("lineRule", "lineRule")) if j in f}
        if sp:
            merged("w:spacing", sp)
        ind = {k: f[j] for j, k in (("indLeftTw", "left"), ("indRightTw", "right"),
                                    ("indHangingTw", "hanging"),
                                    ("indFirstLineTw", "firstLine")) if j in f}
        if ind:
            merged("w:ind", ind)
        if f.get("jc"):
            dd.oei(pPr, dd.PPR_ORDER, dd.val_el("w:jc", "val", f["jc"]))
        for key, tag in (("keepNext", "w:keepNext"), ("keepLines", "w:keepLines"),
                         ("pageBreakBefore", "w:pageBreakBefore")):
            if key in f:
                if f[key]:
                    dd.oei(pPr, dd.PPR_ORDER, O(tag))
                else:
                    for el in pPr.findall(qn(tag)):
                        pPr.remove(el)
        if "widowControl" in f:
            dd.oei(pPr, dd.PPR_ORDER, dd.val_el("w:widowControl", "val",
                                                 "1" if f["widowControl"] else "0"))
        if "outlineLvl" in f:
            dd.oei(pPr, dd.PPR_ORDER, dd.val_el("w:outlineLvl", "val", f["outlineLvl"]))
        if f.get("tabs"):
            tabs = O("w:tabs")
            for t in f["tabs"]:
                el = O("w:tab")
                el.set(qn("w:val"), t["val"])
                if t.get("leader"):
                    el.set(qn("w:leader"), t["leader"])
                el.set(qn("w:pos"), str(t["posTw"]))
                tabs.append(el)
            dd.oei(pPr, dd.PPR_ORDER, tabs)
        if f.get("borders"):
            pbdr = O("w:pBdr")
            for edge in ("top", "left", "bottom", "right"):
                b = f["borders"].get(edge)
                if not b:
                    continue
                el = O("w:" + edge)
                el.set(qn("w:val"), b["val"])
                el.set(qn("w:sz"), str(b["sz"]))
                el.set(qn("w:space"), str(b.get("space", 0)))
                el.set(qn("w:color"), b["color"])
                pbdr.append(el)
            dd.oei(pPr, dd.PPR_ORDER, pbdr)
        if f.get("shading"):
            shd = O("w:shd")
            shd.set(qn("w:val"), f["shading"].get("val", "clear"))
            shd.set(qn("w:color"), "auto")
            shd.set(qn("w:fill"), f["shading"]["fill"])
            dd.oei(pPr, dd.PPR_ORDER, shd)

    # ----------------------------------------------------------- document
    def build(self):
        dd = self.E.dd
        meta = self.doc["meta"]
        kw = dict(title=meta["title"], doc_no=meta.get("docNumber") or DOC_NO_FALLBACK,
                  rev=meta["rev"], issue_date=meta.get("issueDate", ""),
                  author=meta.get("author", ""), subject=meta.get("subject", ""),
                  category=meta.get("typeCode", "Report"),
                  classification=meta.get("classification", "BIASA"))
        if meta.get("copyControl"):
            kw["copies"] = meta["copyControl"]
        notes = []
        if not meta.get("docNumber"):
            notes.append("meta.docNumber absen: doc_no = %s (sekuens HQ tidak tersedia di acuan)"
                         % DOC_NO_FALLBACK)
        self.D = dd.DatumDocx(**kw)
        stamp = self._issue_stamp(meta.get("issueDate"))
        if stamp:
            cp = self.D.doc.core_properties
            cp.created = stamp
            cp.modified = stamp
            notes.append("core created/modified = meta.issueDate 00:00:00 (deterministik)")
        ignored = [k for k in ("mission", "overrides", "outputs", "x") if k in self.doc]
        if ignored:
            notes.append("medan diabaikan acuan: " + ", ".join(ignored))
        self._entry("/meta", "meta", "approximated" if notes else "supported",
                    "DatumDocx(title, doc_no, rev, ...)", notes)

        self.front(self.doc.get("front") or {})
        for i, part in enumerate(self.doc.get("parts") or []):
            self._entry("/parts/%d" % i, "part", "unsupported", None,
                        ["DatumDocx tidak punya halaman pembatas bagian; bab di dalamnya tetap dirender"])
        for i, ch in enumerate(self.doc["chapters"]):
            self.chapter(ch, "/chapters/%d" % i, ch.get("key") or str(i + 1), "BAB")
        for i, ch in enumerate(self.doc.get("appendices") or []):
            self.chapter(ch, "/appendices/%d" % i, ch.get("key") or chr(65 + i), "LAMPIRAN")
        return self.D

    @staticmethod
    def _issue_stamp(value):
        try:
            return datetime.datetime.strptime(value, "%Y-%m-%d") if value else None
        except (TypeError, ValueError):
            return None

    def front(self, front):
        cover = front.get("cover")
        if cover is None:
            self.D.cover()
            self._entry("/front/cover", "cover", "approximated", "DatumDocx.cover()",
                        ["front.cover absen: Garis A selalu memancarkan sampul wrapper (section 0)"])
        else:
            def do_cover():
                notes = []
                data = cover.get("data") or {}
                if cover.get("mode") == "explicit":
                    notes.append("mode explicit: body tidak dapat direproduksi; cover() dari meta saja")
                    for j, _item in enumerate(cover.get("body") or []):
                        self._entry("/front/cover/body/%d" % j, "frontItem", "unsupported", None,
                                    ["isi sampul eksplisit tanpa padanan DatumDocx"])
                    self.D.cover()
                    return "approximated", "DatumDocx.cover()", notes
                ident = []
                ctrl = data.get("control")
                if ctrl:
                    for row in ctrl.get("rows", []):
                        ident.append(tuple(self.plain(c) for c in row))
                lines = [self.plain(x) for x in data.get("titleLines") or []]
                if lines and " ".join(lines) != self.doc["meta"]["title"]:
                    notes.append("cover() mencetak meta.title; titleLines diabaikan")
                for k in ("scopeLine", "addressLine", "colophon", "identityString"):
                    if data.get(k) is not None:
                        notes.append("cover.data.%s tanpa padanan cover()" % k)
                if cover.get("setup"):
                    notes.append("setup diabaikan: geometri sampul dari tokens (setup_cover)")
                self.D.cover(kicker=self.plain(data.get("kicker")),
                             deck=self.plain(data.get("standfirst")), identity=ident or None)
                return ("approximated" if notes else "supported",
                        "DatumDocx.cover(kicker, deck, identity)", notes)
            self._guarded("/front/cover", "cover", do_cover)
        for k in ("controlSheet", "toc", "signature"):
            if front.get(k) is not None:
                self._entry("/front/" + k, k, "unsupported", None,
                            ["tanpa padanan DatumDocx Garis A"])

    def chapter(self, ch, ptr, key, word):
        self.cur_key = key
        self.deriv_seq = 0
        label = ch.get("runningHeadTitle") or self.plain(ch["title"])
        self.D.start_interior(chapter_label=label)
        notes = []
        for k in ("setup", "partId"):
            if ch.get(k) is not None:
                notes.append("chapter.%s diabaikan (geometri interior dari tokens)" % k)
        self._entry(ptr, "chapter", "approximated" if notes else "supported",
                    "DatumDocx.start_interior(chapter_label)", notes)
        def do_kicker():
            self.emit_inline(ch["kicker"], "chapter_kicker")
            return ("approximated", "DatumDocx.para(role='chapter_kicker')",
                    ["kicker bab sebagai paragraf skala chapter_kicker"])

        def do_title():
            self.D.heading(self.plain(ch["title"]), level=1)
            return "supported", "DatumDocx.heading(level=1)", None

        if ch.get("kicker") is not None:
            self._guarded(ptr + "/kicker", "kicker", do_kicker)
        self._guarded(ptr + "/title", "heading", do_title)
        for i, b in enumerate(ch.get("intro") or []):
            self.block(b, "%s/intro/%d" % (ptr, i))
        for si, sec in enumerate(ch.get("sections") or []):
            sptr = "%s/sections/%d" % (ptr, si)
            number = sec.get("number") or "%s.%d" % (key, si + 1)

            def do_heading(sec=sec, number=number):
                p = self.D.heading("%s %s" % (number, self.plain(sec["title"])), level=2)
                if sec.get("headingFormat"):
                    self.apply_para_format(p, sec["headingFormat"])
                    return ("approximated", "DatumDocx.heading(level=2)",
                            ["headingFormat diterapkan di atas pPr heading()"])
                return "supported", "DatumDocx.heading(level=2)", None
            self._guarded(sptr + "/title", "heading", do_heading)
            for bi, b in enumerate(sec.get("blocks") or []):
                self.block(b, "%s/blocks/%d" % (sptr, bi))

    # -------------------------------------------------------------- blocks
    def block(self, b, ptr):
        t = b.get("type")
        if t in TABLE_TYPES:
            fn = self.b_table
        else:
            fn = {"paragraph": self.b_paragraph, "list": self.b_list,
                  "monoBlock": self.b_mono, "assumptionInline": self.b_assumption,
                  "derivation": self.b_derivation, "chart": self.b_chart,
                  "diagram": self.b_diagram, "image": self.b_image,
                  "symbolSheet": self.b_symbols, "spacer": self.b_spacer}.get(t)
        if fn is None:
            why = {"aside": "kotak aside tanpa padanan DatumDocx",
                   "device": "perangkat tata letak (pita, logo, Datum Rule) tanpa padanan DatumDocx"}
            self._entry(ptr, t or "?", "unsupported", None,
                        [why.get(t, "jenis blok tidak dikenal adapter")])
            return
        self._guarded(ptr, t, lambda: fn(b, ptr))

    def _rail(self, p, rail, notes):
        if not rail:
            return
        self.D.rail_host(p)
        for rl in rail:
            if rl.get("runs"):
                txt = "".join(_run_text(r) for r in rl["runs"])
            elif rl.get("kind") == "mark" and rl.get("mark"):
                txt = "%s %s" % (self.MARKS[rl["mark"]], rl["mark"])
                if rl.get("label"):
                    txt += " " + rl["label"]
            else:
                txt = rl.get("text") or rl.get("label") or ""
            chip = self.D.rail_chip(txt)
            if rl.get("format"):
                self.apply_para_format(chip, rl["format"])
        notes.append("rail: rail_host + %d rail_chip" % len(rail))

    def b_paragraph(self, b, ptr):
        role = b.get("role", "body")
        scale = ROLE_SCALE.get(role, "body")
        notes = [] if role == "body" else ["role %s -> skala %s" % (role, scale)]
        p = self.emit_inline(b, scale, b.get("format"), b.get("runDefaults"))
        if _is_runs(b):
            notes.append("runs[] lewat style_run per run (para() hanya md-lite)")
        self._rail(p, b.get("rail"), notes)
        st = "supported" if role == "body" and not _is_runs(b) else "approximated"
        return st, "DatumDocx.para(role=%r)" % scale, notes

    def b_list(self, b, ptr):
        notes = ["DatumDocx tanpa API daftar: marker + tab + isi lewat para()"]
        for i, item in enumerate(b.get("items") or []):
            marker = item.get("marker")
            mtext = marker.get("t", "") if marker else ("\u2022" if b.get("style") == "bullet"
                                                         else "%d." % (i + 1))
            if _is_runs(item):
                runs = [marker or {"t": mtext}, {"tab": True}] + list(item["runs"])
                p = self.emit_inline({"runs": runs}, "body", None, b.get("runDefaults"))
            else:
                p = self.emit_inline({"text": "%s\t%s" % (mtext, item.get("text", ""))},
                                     "body", None, b.get("runDefaults"))
            fmt = dict(b.get("format") or {})
            fmt.update(item.get("format") or {})
            if fmt:
                self.apply_para_format(p, fmt)
            self._rail(p, item.get("rail"), notes)
        return "approximated", "DatumDocx.para(role='body') per butir", notes

    def b_mono(self, b, ptr):
        self.emit_inline(b["label"], "caption", b.get("format"))
        for ln in b.get("lines") or []:
            self.emit_inline(ln, "derivation", ln.get("format"), b.get("runDefaults"))
        return ("approximated", "DatumDocx.para(role='caption'|'derivation')",
                ["monoBlock: label skala caption, baris skala derivation (mono)"])

    def b_assumption(self, b, ptr):
        p = self.emit_inline(b, "body", b.get("format"), b.get("runDefaults"))
        self.D.rail_host(p)
        self.D.rail_chip("%s ASUMSI %s" % (self.MARKS["ASUMSI"], b["asmId"]))
        self.D.rail_chip(b.get("impact", ""))
        return ("approximated", "DatumDocx.para + rail_host + rail_chip x2",
                ["asmId dan impact sebagai chip rail"])

    # tables
    def _cell_text(self, cell, notes):
        if cell.get("paragraphs") is not None:
            return "\n".join(self.raw_md(p) for p in cell["paragraphs"])
        if cell.get("runs") is not None:
            return "".join(_run_text(r) for r in cell["runs"])
        return cell.get("text", "")

    def b_table(self, b, ptr):
        dc = self.E.check
        notes = []
        cols = b.get("columns") or []
        rows = []
        lost = set()
        for ri, row in enumerate(b.get("rows") or []):
            out = []
            for cell in row.get("cells") or []:
                out.append(self._cell_text(cell, notes))
                out.extend([""] * (int(cell.get("gridSpan") or 1) - 1))
                for k in ("gridSpan", "vMerge", "borders", "marginsTw", "shading",
                          "vAlign", "widthTw", "nested"):
                    if cell.get(k) is not None:
                        lost.add("cell." + k)
            if row.get("kind") in ("group", "total"):
                lost.add("row.kind=" + row["kind"])
            if row.get("cantSplit") is not None or row.get("repeatHeader") is not None:
                lost.add("row.cantSplit/repeatHeader (table() menetapkan sendiri)")
            rows.append(out)
        if not rows:
            raise dc.CheckDefect("%s: tabel kosong." % ptr)
        heads = sum(1 for r in b.get("rows") or [] if r.get("kind") == "header")
        if heads != 1:
            notes.append("table() memperlakukan baris pertama sebagai kepala (JSON: %d baris header)" % heads)
        widths = None
        if cols and all(c.get("widthMm") is not None or c.get("widthTw") is not None for c in cols):
            widths = [float(c["widthMm"]) if c.get("widthMm") is not None
                      else float(c["widthTw"]) * 25.4 / 1440.0 for c in cols]
            tot = sum(widths)
            if min(abs(tot - 128.0), abs(tot - 166.0)) > 0.05:
                notes.append("lebar kolom %.2f mm bukan 128/166: solver Garis A dipakai" % tot)
                widths = None
        else:
            notes.append("lebar kolom dari solve_widths() Garis A")
        if any(c.get("align") or c.get("role") or c.get("unit") for c in cols):
            lost.add("columns.align/role/unit (table() mendeteksi kolom angka sendiri)")
        source = self.plain(b["source"]["inline"]) if b.get("source") else ""
        apparatus = b.get("caption") is None and not source.strip()
        if not apparatus:
            dc.check_source_line(source, ptr)      # cek 10 sebelum emisi apa pun
        if b.get("caption") is not None:
            notes.append("caption JSON diabaikan: table() menulis 'TABEL n <slug kepala>'")
        for k in ("preset", "layout", "sourcePlacement", "format"):
            if b.get(k) is not None:
                lost.add(k)
        if b.get("type") != "table":
            notes.append("jenis %s dirender sebagai table() biasa" % b["type"])
        if lost:
            notes.append("diabaikan: " + ", ".join(sorted(lost)))
        self.D.table(rows, source, widths_mm=widths, apparatus=apparatus)
        return ("approximated" if notes else "supported",
                "DatumDocx.table(rows, source, widths_mm, apparatus=%s)" % apparatus, notes)

    # derivation
    def _safe_expr(self, expr, keys):
        if "__" in expr:
            raise RefDefect("ekspresi derivasi memuat '__': %r" % expr)
        rest = expr
        for k in sorted(keys, key=len, reverse=True):
            rest = rest.replace(k, " ")
        rest = re.sub(r"\b(%s)\b" % "|".join(_EXPR_FUNCS), " ", rest)
        if not _EXPR_REST_RE.match(rest):
            raise RefDefect("ekspresi derivasi memuat token di luar register/aritmetika: %r" % expr)

    def b_derivation(self, b, ptr):
        bind = self.E.bind
        reg = bind.Register(data=self.doc.get("register") or {})
        self.deriv_seq += 1
        did = b.get("id") or "D-%s.%d" % (self.cur_key, self.deriv_seq)
        notes = ["label = 'Turunan <id> \u00b7 <title>' (pola docstring datumbind)"]
        d = bind.Derivation("Turunan %s \u00b7 %s" % (did, self.plain(b["title"])), reg)
        if b.get("intro") is not None:
            d.text(self.plain(b["intro"]))
        for ln in b.get("lines") or []:
            lab = self.plain(ln["label"])
            val = ln.get("value")
            if val is None:
                d.text(lab)
            elif isinstance(val, dict) and "registerKey" in val:
                d.line(lab, val["registerKey"], dec=val.get("dec"))
            else:
                d.line(lab, value=self.plain(val))
            if ln.get("mark"):
                notes.append("lines[].mark tidak dicetak Derivation")
        res = b.get("result")
        if res:
            self._safe_expr(res["expr"], reg.d.keys())
            d.result(self.plain(res["label"]), res["expr"], res["registerKey"],
                     tol=res.get("tol", 0.51))
        ver = b.get("verdict")
        if ver:
            if ver.get("direction", "lessOrEqual") == "lessOrEqual":
                d.verdict(self.plain(ver["label"]), ver["registerKey"], ver["limit"])
            else:
                notes.append("verdict greaterOrEqual tanpa padanan Derivation.verdict (v <= limit); baris dilewati")
        d.closes(self.plain(b.get("closing")))
        self.D.derivation(d)
        return "approximated", "datumbind.Derivation + DatumDocx.derivation", notes

    # figures
    def _fig_path(self, ext):
        self.fig_files += 1
        os.makedirs(self.work_dir, exist_ok=True)
        return os.path.join(self.work_dir, "gambar %d.%s" % (self.fig_files, ext))

    def _figure_text(self, b):
        cap = b.get("caption") or {}
        src = b.get("source") or {}
        return self.plain(cap.get("inline")), self.plain(src.get("inline"))

    def _place_svg(self, svg, b, notes):
        if self.raster is None:
            raise RefDefect("rasterizer tidak tersedia")
        png = self._fig_path("png")
        w_mm = float(b.get("widthMm") or 128)
        _pw, _ph, _w, h_mm = self.raster.svg_to_png(svg, png, w_mm=w_mm)
        if b.get("heightMm"):
            h_mm = float(b["heightMm"])
        cap, src = self._figure_text(b)
        self.D.figure(png, w_mm, round(h_mm, 2), cap, src)
        notes.append("SVG -> PNG 300 dpi (Chromium set_content) -> figure()")
        return png

    def b_chart(self, b, ptr):
        spec = b.get("spec") or {}
        if "artifactId" in spec:
            raise _Unsupported("spec {artifactId}: acuan tidak membaca penyimpanan artefak")
        fam = CHART_FAMILY.get(spec.get("kind"))
        data = spec.get("data") or {}
        if fam is None:
            raise _Unsupported("kind %s tanpa acuan datumchart (acuan pustakachart = S65)"
                               % spec.get("kind"))
        if data.get("shape") != "categorical":
            raise _Unsupported("datumchart hanya menerima data categorical (diterima %s)"
                               % data.get("shape"))
        dc = self.E.chart()
        pts = []
        for x in data.get("points") or []:
            q = {"label": x["label"], "value": x["value"]}
            if x.get("accent"):
                q["accent"] = True
            if x.get("sub") is not None:
                q["sub"] = x["sub"]
            pts.append(q)
        cs = {"family": fam, "title": spec.get("title", ""), "source": spec.get("source", ""),
              "width_mm": spec.get("widthMm", b.get("widthMm", 128)), "data": pts,
              "dec": spec.get("dec", 0), "unit": spec.get("unit", ""),
              "apparatus": spec.get("apparatus", "page")}
        for src_k, dst_k in (("id", "id"), ("note", "note"), ("limit", "limit"),
                             ("inDocument", "in_document")):
            if spec.get(src_k) is not None:
                cs[dst_k] = spec[src_k]
        notes = ["Rev L datumchart.render family=%s (D-10)" % fam]
        for k in ("params", "style", "limitLabel", "heightMm"):
            if spec.get(k) is not None:
                notes.append("spec.%s diabaikan datumchart" % k)
        self._place_svg(dc.render(cs), b, notes)
        return "approximated", "datumchart.render + DatumDocx.figure", notes

    def b_diagram(self, b, ptr):
        spec = b.get("spec") or {}
        if "artifactId" in spec:
            raise _Unsupported("spec {artifactId}: acuan tidak membaca penyimpanan artefak")
        dg = self.E.diagram()
        ds = {k: v for k, v in spec.items() if k != "$schema"}
        svg, rep = dg.build_svg(ds)
        notes = ["datum_diagram.build_svg family=%s checks=%d" % (rep.get("family"),
                                                                 len(rep.get("checks_run", [])))]
        self._place_svg(svg, b, notes)
        return "approximated", "datum_diagram.build_svg + DatumDocx.figure", notes

    def b_symbols(self, b, ptr):
        sy = self.E.symbols()
        pages = sy.sheet_svg(b["dialect"], cols=int(b.get("cols") or 3))
        notes = ["datumsimbol.sheet_svg: %d lembar, satu figure() per lembar" % len(pages)]
        cap, src = self._figure_text(b)
        for i, svg in enumerate(pages):
            png = self._fig_path("png")
            w_mm = float(b.get("widthMm") or 166)
            _pw, _ph, _w, h_mm = self.raster.svg_to_png(svg, png, w_mm=w_mm)
            c = cap if len(pages) == 1 else "%s (lembar %d/%d)" % (cap, i + 1, len(pages))
            self.D.figure(png, w_mm, round(h_mm, 2), c, src)
        return "approximated", "datumsimbol.sheet_svg + DatumDocx.figure", notes

    def b_image(self, b, ptr):
        asset = (self.doc.get("assets") or {}).get(b.get("asset"))
        if asset is None:
            raise RefDefect("aset %r tidak ada di doc.assets" % b.get("asset"))
        ext = "jpg" if asset.get("mime") == "image/jpeg" else "png"
        dst = self._fig_path(ext)
        notes = []
        if asset.get("dataBase64"):
            raw = base64.b64decode(asset["dataBase64"])
        elif asset.get("path"):
            srcp = asset["path"]
            if not os.path.isabs(srcp):
                srcp = os.path.join(self.doc_dir, srcp)
                notes.append("asset.path relatif terhadap folder doc.json")
            with open(srcp, "rb") as fh:
                raw = fh.read()
        else:
            raise RefDefect("aset %r tanpa dataBase64 maupun path" % b.get("asset"))
        if asset.get("sha256") and hashlib.sha256(raw).hexdigest() != asset["sha256"].lower():
            notes.append("sha256 aset tidak cocok dengan isi")
        with open(dst, "wb") as fh:
            fh.write(raw)
        w_mm = float(b.get("widthMm") or 128)
        h_mm = b.get("heightMm")
        if h_mm is None:
            from PIL import Image
            with Image.open(dst) as im:
                h_mm = w_mm * im.size[1] / float(im.size[0])
        cap, src = self._figure_text(b)
        self.D.figure(dst, w_mm, round(float(h_mm), 2), cap, src)
        notes.append("berkas aset disalin ke nama 'gambar n' (guard N1 berlaku pada nama dokumen)")
        return "approximated", "DatumDocx.figure", notes

    def b_spacer(self, b, ptr):
        f = b.get("format") or {}
        pt = float(f.get("lineTw", 240)) / 20.0
        p = self.D._spacer(pt)
        if f:
            self.apply_para_format(p, f)
        return "supported", "DatumDocx._spacer(pt)", None


def validate_input(doc):
    """Minimal shape check; full validation is the contract's ajv schema (S03)."""
    if not isinstance(doc, dict):
        raise InputError("dokumen bukan objek JSON")
    if doc.get("$schema") != "studio.doc/v1":
        raise InputError("$schema harus 'studio.doc/v1' (diterima %r)" % doc.get("$schema"))
    meta = doc.get("meta")
    if not isinstance(meta, dict) or not meta.get("title") or not meta.get("rev"):
        raise InputError("meta.title dan meta.rev wajib")
    ch = doc.get("chapters")
    if not isinstance(ch, list) or not ch:
        raise InputError("chapters wajib berisi minimal 1 bab")
