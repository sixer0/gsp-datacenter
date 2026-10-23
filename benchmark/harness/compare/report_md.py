"""Markdown rendering of the bm_compare report (S96): per criterion, per page,
per figure, and per paragraph (BM1 units that differ, with context)."""
from __future__ import annotations


def _esc(s: object, limit: int = 160) -> str:
    t = "" if s is None else str(s)
    if len(t) > limit:
        t = t[: limit - 3] + "..."
    return t.replace("|", "\\|").replace("\n", " ")


def _fmt(v: object, nd: int = 4) -> str:
    if v is None:
        return "-"
    if isinstance(v, bool):
        return "ya" if v else "tidak"
    if isinstance(v, float):
        return f"{v:.{nd}f}"
    return str(v)


def _units(lst: list[dict], prefix: str) -> list[str]:
    return [f"  - {prefix} `{u['loc']}` ({u['kind']}): {_esc(u['text'], 220)}" for u in lst]


def render_markdown(r: dict, max_diffs: int = 300) -> str:
    L: list[str] = []
    c = r["criteria"]
    L += [
        "# Laporan benchmark Manual DATUM 000 (D-17)",
        "",
        f"- Alat: {r['tool']}; dibuat {r['generatedAt']}; durasi {r.get('durationMs')} ms",
        f"- Keluaran DOCX: `{r['inputs']['docx']}`; PDF: `{r['inputs']['pdf']}`",
        f"- Acuan: `{r['inputs']['refDocx']}`; `{r['inputs']['refPdf']}`",
        f"- **Vonis: {r['verdict']}**",
        "",
        "## Ringkasan per kriteria",
        "",
        "| Kriteria | Nilai | Ambang | Status |",
        "|---|---|---|---|",
    ]
    b1, b2, b3, b4 = r["BM1"], r["BM2"], r["BM3"], r["BM4"]
    L.append(f"| BM1 unit teks identik berurutan | "
             f"{_fmt(b1.get('unitsIdenticalInOrder'))}/{_fmt(b1.get('unitsTotal'))} = {_fmt(b1.get('pct'))} % "
             f"| >= 98 % | {c['BM1']} |")
    worst = [f"{k} {v['out']}/{v['ref']}" for k, v in b2["perType"].items() if v.get("pass") is False]
    L.append(f"| BM2 selisih jumlah per jenis | {'; '.join(worst) if worst else 'semua dalam toleransi'} "
             f"| <= 2 % (dibulatkan ke bawah) | {c['BM2']} |")
    L.append(f"| BM3 halaman bertekst identik | {_fmt(b3.get('pagesIdentical'))}/{_fmt(b3.get('of'))} = "
             f"{_fmt(b3.get('pct'))} % | >= 98 % (min 100/102) | {c['BM3']} |")
    L.append(f"| BM4 SSIM rata-rata | {_fmt(b4.get('ssimMean'))} | >= 0,95 | {c['BM4']} |")
    L.append("")

    # BM2
    L += ["## BM2 jumlah per jenis", "", "| Jenis | Acuan | Keluaran | Selisih | Selisih % | Toleransi | Status |",
          "|---|---|---|---|---|---|---|"]
    for k, v in b2["perType"].items():
        st = "NOT-RUN" if v.get("pass") is None else ("PASS" if v["pass"] else "FAIL")
        L.append(f"| {k} | {_fmt(v['ref'])} | {_fmt(v['out'])} | {_fmt(v['delta'])} | {_fmt(v['deltaPct'])} "
                 f"| +/-{_fmt(v['allowed'])} | {st} |")
    L.append(f"\nInventaris research/07 (cek kewajaran acuan): {b2['inventoryRef']}\n")

    # BM1 summary by kind
    if b1.get("byKind"):
        L += ["## BM1 per jenis unit", "", "| Jenis | Acuan | Cocok berurutan (alignment) | % | Keluaran |",
              "|---|---|---|---|---|"]
        for k, v in b1["byKind"].items():
            L.append(f"| {k} | {v.get('ref')} | {v.get('matchedInOrder')} | {_fmt(v.get('pct'), 3)} | {_fmt(v.get('out'))} |")
        L.append(f"\nMetode: {b1['method']}. Unit acuan {b1['unitsRef']}, keluaran {b1['unitsOut']}, "
                 f"LCS {b1['unitsIdenticalInOrder']}, alignment {b1['alignmentMatched']}.\n")
    elif b1.get("note"):
        L += ["## BM1", "", b1["note"], ""]

    # BM3 + BM4 per page
    if "perPage" in b3:
        ssim_by_page = {p["page"]: p["ssim"] for p in b4.get("perPage", [])}
        L += ["## Per halaman (BM3 teks, BM4 SSIM)", "",
              f"SSIM: {b4.get('method')}. Sumber fungsi SSIM: {b4.get('ssimSource')}.", "",
              "| Hal | Teks identik | SSIM | Perbedaan pertama (acuan / keluaran) |", "|---|---|---|---|"]
        for p in b3["perPage"]:
            d = p.get("textDiff")
            diff = f"acuan: {_esc(d['ref'], 120)} / keluaran: {_esc(d['out'], 120)}" if d else (
                f"halaman hilang di {p['missingIn']}" if p.get("missingIn") else "")
            L.append(f"| {p['page']} | {_fmt(p['textIdentical'])} | {_fmt(ssim_by_page.get(p['page']))} | {diff} |")
        L.append("")
        L.append(f"Halaman SSIM < 0,95 (diagnosis): {b4.get('pagesBelowThreshold')}\n")

        L += ["## Per figur, halaman figur besar (diagnosis, tidak menggagalkan)", "",
              "| Hal | Figur | bbox acuan (pt) | SSIM | bbox keluaran terdekat | IoU | Catatan |",
              "|---|---|---|---|---|---|---|"]
        for f in b4.get("perFigure", []):
            L.append(f"| {f['page']} | {_fmt(f.get('figure'))} | {_fmt(f.get('bboxRef'))} | {_fmt(f.get('ssim'))} "
                     f"| {_fmt(f.get('outNearestBbox'))} | {_fmt(f.get('iou'))} | {_esc(f.get('note', ''))} |")
        L.append("")
    else:
        L += ["## BM3 / BM4", "", b3.get("note", ""), ""]

    # BM1 per paragraph diffs
    if "diffs" in b1:
        diffs = b1["diffs"]
        L += ["## Per paragraf: unit yang berbeda (BM1)", "",
              f"{len(diffs)} blok beda; ditampilkan {min(len(diffs), max_diffs)} (lengkap di bm_report.json).", ""]
        for n, d in enumerate(diffs[:max_diffs], start=1):
            L.append(f"### D{n:03d} {d['op']} acuan[{d['refRange'][0]}:{d['refRange'][1]}] "
                     f"keluaran[{d['outRange'][0]}:{d['outRange'][1]}]")
            L += _units(d["contextBefore"], "konteks")
            L += _units(d["ref"], "- acuan")
            L += _units(d["out"], "+ keluaran")
            L += _units(d["contextAfter"], "konteks")
            L.append("")
    return "\n".join(L) + "\n"
