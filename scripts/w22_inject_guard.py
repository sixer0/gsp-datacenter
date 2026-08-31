#!/usr/bin/env python3
"""W2.2: pasang guard requireSession di SEMUA handler mutatif route.ts yang belum
berguard sendiri. Deterministik, idempoten, fail-closed:
 - target = file src/app/api/**/route.ts dengan `export async function (POST|PATCH|PUT|DELETE)`
   dan TANPA salah satu penanda guard yang sah;
 - handler mutatif yang param request-nya `_` → diganti nama agar bisa dipakai guard;
 - import ditambahkan setelah baris import terakhir bila belum ada;
 - file yang tidak match ekspektasi → dicetak SKIP-alasan, tidak diubah.
"""
import re, sys, io
from pathlib import Path

ROOT = Path(r"C:/Users/TRIAL/gsp-datacenter/src/app/api")
GUARD_MARKERS = ("requireSession", "rbacTokenOk", "CRON_SECRET", "INTERNAL_API_SECRET",
                 "x-internal-secret", "x-rbac-token", "isAuthorized", "verifyHqSession")
MUTATORS = ("POST", "PATCH", "PUT", "DELETE")

def read_raw(fp: Path) -> str:
    with open(fp, "r", encoding="utf-8", newline="") as fh:
        return fh.read()

def write_raw(fp: Path, content: str) -> None:
    with open(fp, "w", encoding="utf-8", newline="") as fh:
        fh.write(content)

def process(fp: Path):
    src = read_raw(fp)
    nl = "\r\n" if "\r\n" in src else "\n"
    if any(m in src for m in GUARD_MARKERS):
        return ("SKIP", "sudah-berguard", src)
    lines = src.split(nl)
    # kumpulkan indeks handler mutatif
    pat = re.compile(r"^export async function (POST|PATCH|PUT|DELETE)\((.*?)\)")
    handlers = []  # (line_idx, method, params)
    for i, ln in enumerate(lines):
        m = pat.match(ln)
        if m:
            handlers.append((i, m.group(1), m.group(2)))
    if not handlers:
        return ("SKIP", "tanpa-handler-mutatif-named", src)

    out = list(lines)
    # proses dari bawah agar indeks handler sebelumnya tidak bergeser oleh insert
    for idx, method, params in sorted(handlers, key=lambda h: -h[0]):
        params = params.strip()
        # normalisasi param request
        parts = [p.strip() for p in re.split(r",(?![^<>]*>)", params)] if params else []
        if not parts:
            return ("SKIP", f"{method}-tanpa-param-request", src)
        req = parts[0]
        mreq = re.match(r"^([A-Za-z_][A-Za-z0-9_]*)\s*(!?):\s*(.+)$", req)
        if mreq:
            name, bang, typ = mreq.groups()
        else:
            return ("SKIP", f"{method}-param-bukan-nama-typed: {req!r}", src)
        if name.startswith("_"):
            parts[0] = f"req{bang}: {typ}"
            sig = out[idx].replace(f"({params})", f"({', '.join(parts)})", 1)
            out[idx] = sig
            name = "req"
        guard_block = nl.join([
            f"  // W2.2 guard (F-SEC-004): tolak tanpa sesi/identitas internal — level route.",
            f"  const denied = await requireSession({name});",
            "  if (denied) return denied;",
        ])
        # sisipkan guard tepat setelah baris signature
        sig = out[idx]
        assert sig.startswith(f"export async function {method}("), f"unexpected sig {sig!r}"
        out.insert(idx + 1, guard_block)

    body = nl.join(out)
    # import helper bila belum ada
    if "require-session" not in body:
        imp = "import { requireSession } from '@/lib/require-session';"
        last_imp = max(i for i, ln in enumerate(out) if ln.startswith("import "))
        out.insert(last_imp + 1, imp)
        body = nl.join(out)
    return ("EDIT", f"{len(handlers)} handler", body)

def main():
    files = sorted(ROOT.rglob("route.ts"))
    edited, skipped = [], []
    for fp in files:
        status, reason, content = process(fp)
        if status == "EDIT":
            orig = read_raw(fp)
            if content != orig:
                write_raw(fp, content)
                edited.append((str(fp.relative_to(ROOT.parent.parent)), reason))
        else:
            skipped.append((str(fp.relative_to(ROOT.parent.parent)), reason))
    print("=== EDITED ===")
    for f, r in edited: print(f"  {f} [{r}]")
    print(f"total edited: {len(edited)}")
    print("=== SKIPPED ===")
    for f, r in skipped: print(f"  {f} [{r}]")
    print(f"total skipped: {len(skipped)}")

if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
