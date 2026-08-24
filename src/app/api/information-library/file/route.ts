import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export const dynamic = "force-dynamic";

// Serve file mentah dari shared GSP workspace (dokumen document contract, .md/.py/.json)
// atau wiki (~/.hermes/wiki). Dipakai halaman Information Library untuk tombol
// "buka file asli" — klik dokumen → konten asli terbuka di tab baru.
//
// GET /api/information-library/file?path=<rel>&root=workspace|wiki
const SHARED_WS = process.env.SHARED_WORKSPACE || "/Users/mbp/workspace/gsp-hermes/workspace";
const WIKI = process.env.HERMES_WIKI || path.join(os.homedir(), ".hermes", "wiki");

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rel = (searchParams.get("path") || "").replace(/^\/+/, "");
  const root = searchParams.get("root") === "wiki" ? WIKI : SHARED_WS;

  if (!rel) return NextResponse.json({ error: "path required" }, { status: 400 });

  const rootResolved = path.resolve(root);
  const abs = path.resolve(rootResolved, rel);
  // proteksi path traversal — file harus berada di dalam root
  if (abs !== rootResolved && !abs.startsWith(rootResolved + path.sep)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const data = fs.readFileSync(abs);
  const ext = path.extname(abs).toLowerCase();
  const contentType =
    ext === ".md" || ext === ".markdown" ? "text/markdown; charset=utf-8"
    : ext === ".json" ? "application/json; charset=utf-8"
    : ext === ".py" ? "text/x-python; charset=utf-8"
    : ext === ".csv" ? "text/csv; charset=utf-8"
    : ext === ".txt" || ext === ".log" ? "text/plain; charset=utf-8"
    : "application/octet-stream";

  return new NextResponse(data, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
      "Content-Disposition": `inline; filename="${path.basename(abs)}"`,
    },
  });
}
