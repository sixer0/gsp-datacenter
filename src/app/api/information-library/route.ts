import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "node:fs";
import path from "node:path";

// Shared GSP workspace — root tempat AGENTS.md / MEMORY.md / memory/ / docs/ berada.
// Dapat dioverride via env SHARED_WORKSPACE (default: /Users/mbp/workspace/gsp-hermes/workspace).
const SHARED_WS =
  process.env.SHARED_WORKSPACE || "/Users/mbp/workspace/gsp-hermes/workspace";

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".cache",
  "__pycache__",
  ".venv",
  "venv",
  "vault", // staging area — ditampilkan lewat scope=vault, bukan scan workspace
]);

function extractTitle(rel: string, body: string): string {
  // # Heading pertama di body, fallback ke nama file tanpa ekstensi
  const m = body.match(/^\s*#\s+(.+)$/m);
  if (m && m[1].trim()) return m[1].trim();
  const base = path.basename(rel, path.extname(rel)).replace(/[-_]+/g, " ");
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function walkMd(dir: string, relRoot = ""): { rel: string; abs: string }[] {
  const out: { rel: string; abs: string }[] = [];
  let entries: string[] = [];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const abs = path.join(dir, name);
    let stat;
    try {
      stat = fs.statSync(abs);
    } catch {
      continue;
    }
    const rel = relRoot ? `${relRoot}/${name}` : name;
    if (stat.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      out.push(...walkMd(abs, rel));
    } else if (stat.isFile() && /\.(md|markdown|mdx)$/i.test(name)) {
      out.push({ rel, abs });
    }
  }
  return out;
}

function walkFiles(dir: string, relRoot = ""): { rel: string; abs: string }[] {
  // semua file (semua ekstensi) — dipakai untuk entri folder document contract
  const out: { rel: string; abs: string }[] = [];
  let entries: string[] = [];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const abs = path.join(dir, name);
    let stat;
    try {
      stat = fs.statSync(abs);
    } catch {
      continue;
    }
    const rel = relRoot ? `${relRoot}/${name}` : name;
    if (stat.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      out.push(...walkFiles(abs, rel));
    } else if (stat.isFile()) {
      out.push({ rel, abs });
    }
  }
  return out;
}

// ── Vault (staging) ──────────────────────────────────────
// Objek vault ditulis vault_propose.py (gsp-library-data-standards): frontmatter
// YAML sederhana (baris `key: value`), body markdown. Dibaca langsung dari
// filesystem — vault adalah sumber kebenaran staging sebelum terbit ke wiki.
function parseFm(raw: string): Record<string, string> {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return {};
  const fm: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"(.*)"$/, "$1");
  }
  return fm;
}

function walkVault(dir: string, relRoot = ""): { rel: string; abs: string }[] {
  return walkMd(dir, relRoot); // hanya .md, sama aturan skip dir
}

// GET ?q=&scope=wiki|workspace|all|vault&status=&type=
// - wiki      : entri HermesMemory dari DB (dimirror bridge dari ~/.hermes/wiki)
// - workspace : file markdown di shared GSP workspace (AGENTS.md, MEMORY.md, memory/, docs/)
// - vault     : objek usulan/terkurasi di workspace/vault/ (STAGING, belum terbit)
// - all       : gabungan wiki + workspace (default; vault TIDAK ikut — staging terpisah)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const scope = (url.searchParams.get("scope") || "all").toLowerCase();
  const type = url.searchParams.get("type");
  const status = url.searchParams.get("status") || "active";

  const wantWiki = scope === "all" || scope === "wiki";
  const wantWs = scope === "all" || scope === "workspace";
  const wantVault = scope === "vault";

  const wikiEntries: Record<string, unknown>[] = [];
  const wsEntries: Record<string, unknown>[] = [];

  // ── 1. Wiki (DB) ────────────────────────────────────────
  if (wantWiki) {
    const where: Record<string, unknown> = {};
    if (status !== "all") where.status = status;
    if (type && type !== "all") where.type = type;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { body: { contains: q, mode: "insensitive" } },
        { tags: { has: q } },
      ];
    }
    const rows = await prisma.hermesMemory.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 300,
    });
    wikiEntries.push(
      ...rows.map((r) => ({
        ...r,
        source: "wiki",
        confidence: r.confidence != null ? Number(r.confidence) : null,
      }))
    );
  }

  // ── 2. Shared workspace (filesystem) ─────────────────────
  if (wantWs && fs.existsSync(SHARED_WS)) {
    const files = walkMd(SHARED_WS);
    for (const f of files) {
      let body = "";
      try {
        body = fs.readFileSync(f.abs, "utf8");
      } catch {
        continue;
      }
      const stat = fs.statSync(f.abs);
      const title = extractTitle(f.rel, body);
      const haystack = `${f.rel} ${title} ${body}`.toLowerCase();
      if (q && !haystack.includes(q)) continue;
      // type asli dari path; filter type HANYA menyaring (bukan memaksa type)
      const t = inferType(f.rel);
      if (type && type !== "all" && t !== type) continue;
      // ukuran body dibatasi agar response tetap ringan
      wsEntries.push({
        id: `ws-${f.rel.replace(/[^a-z0-9]+/gi, "-")}`,
        path: f.rel,
        type: t,
        title,
        status: "active",
        confidence: null,
        provenance: "shared-workspace",
        tags: [],
        links: [],
        body: body.length > 6000 ? body.slice(0, 6000) + "\n\n…(dipotong)" : body,
        validFrom: null,
        validTo: null,
        updatedAt: stat.mtime.toISOString(),
        syncedAt: stat.mtime.toISOString(),
        source: "workspace",
      });
    }

    // ── 2b. Folder document contract (docs/[date]_[task]/) ──
    // Folder tugas dengan artefak non-markdown (script, data, laporan biner)
    // diwakili satu entri berisi daftar file, agar jejak Documentation Contract
    // tetap terlihat walau tidak ada file .md.
    const docsRoot = path.join(SHARED_WS, "docs");
    if (fs.existsSync(docsRoot)) {
      let taskDirs: string[] = [];
      try {
        taskDirs = fs
          .readdirSync(docsRoot)
          .filter((n) => {
            try {
              return fs.statSync(path.join(docsRoot, n)).isDirectory();
            } catch {
              return false;
            }
          })
          .sort();
      } catch {
        taskDirs = [];
      }
      for (const dir of taskDirs) {
        const abs = path.join(docsRoot, dir);
        const nonMd = walkFiles(abs).filter((f) => !/\.(md|markdown|mdx)$/i.test(f.rel));
        // hanya folder yang punya artefak non-md (folder .md saja sudah terwakili)
        if (nonMd.length === 0) continue;
        if (q && !`docs/${dir}`.toLowerCase().includes(q)) continue;
        // entri folder docs selalu type "project" — hormati filter type
        if (type && type !== "all" && type !== "project") continue;
        const bodyLines = [
          `Folder tugas: \`docs/${dir}/\``,
          "",
          `${nonMd.length} file pendukung (non-markdown).`,
          "",
          ...nonMd.slice(0, 60).map((f) => {
            let size = "";
            try {
              size = `${Math.max(1, Math.round(fs.statSync(f.abs).size / 1024))} KB`;
            } catch {
              /* ignore */
            }
            return `- \`${f.rel.replace(/^docs\//, "")}\` (${size})`;
          }),
          ...(nonMd.length > 60 ? [`- … dan ${nonMd.length - 60} file lain`] : []),
        ];
        let newest = 0;
        for (const f of nonMd) {
          try {
            newest = Math.max(newest, fs.statSync(f.abs).mtimeMs);
          } catch {
            /* ignore */
          }
        }
        const pretty = dir.replace(/^\d{4}_\d{2}_\d{2}_/, "").replace(/[-_]+/g, " ").trim();
        wsEntries.push({
          id: `ws-docs-${dir.replace(/[^a-z0-9]+/gi, "-")}`,
          path: `docs/${dir}/`,
          type: "project",
          title: `📁 ${pretty.charAt(0).toUpperCase() + pretty.slice(1)}`,
          status: "active",
          confidence: null,
          provenance: "shared-workspace",
          tags: [],
          links: [],
          // daftar file pendukung (non-markdown) — dipakai UI untuk link per-file
          files: nonMd.map((f) => f.rel),
          body: bodyLines.join("\n"),
          validFrom: null,
          validTo: null,
          updatedAt: newest ? new Date(newest).toISOString() : new Date().toISOString(),
          syncedAt: newest ? new Date(newest).toISOString() : new Date().toISOString(),
          source: "workspace",
        });
      }
    }
  }

  // ── 3. Vault (staging) — scope=vault ─────────────────────
  const vaultEntries: Record<string, unknown>[] = [];
  if (wantVault && fs.existsSync(SHARED_WS)) {
    const vaultRoot = path.join(SHARED_WS, "vault");
    if (fs.existsSync(vaultRoot)) {
      for (const f of walkVault(vaultRoot)) {
        let raw = "";
        try {
          raw = fs.readFileSync(f.abs, "utf8");
        } catch {
          continue;
        }
        const fm = parseFm(raw);
        const body = raw.replace(/^---\n[\s\S]*?\n---\n?/, "");
        const title = fm.title || extractTitle(f.rel, raw);
        const vtype = fm.type || "note";
        const vstatus = fm.status || "usulan";
        const haystack = `vault/${f.rel} ${title} ${body} ${vtype} ${vstatus}`.toLowerCase();
        if (q && !haystack.includes(q)) continue;
        if (type && type !== "all" && vtype !== type) continue;
        if (status !== "all" && vstatus !== status) continue;
        const stat = fs.statSync(f.abs);
        vaultEntries.push({
          id: `vault-${f.rel.replace(/[^a-z0-9]+/gi, "-")}`,
          path: `vault/${f.rel}`,
          type: vtype,
          title,
          status: vstatus,
          confidence: null,
          provenance: fm.sumber || null,
          tags: [],
          links: [],
          body: body.length > 6000 ? body.slice(0, 6000) + "\n\n…(dipotong)" : body,
          validFrom: null,
          validTo: null,
          updatedAt: stat.mtime.toISOString(),
          syncedAt: stat.mtime.toISOString(),
          source: "vault",
          sensitif: fm.sensitif || "tidak",
          perkara: fm.perkara || null,
          kelas_bukti: fm.kelas_bukti || null,
          halaman: fm.halaman || null,
          attest: fm["di-attest-oleh"] || null,
          keputusan: fm.catatan_keputusan || null,
        });
      }
    }
  }

  const entries =
    scope === "vault" ? vaultEntries : [...wsEntries, ...wikiEntries];
  // urutkan dari yang terbaru (updatedAt desc) — dokumen & memori terkini di atas
  entries.sort((a, b) => {
    const ta = new Date((a.updatedAt as string) || 0).getTime();
    const tb = new Date((b.updatedAt as string) || 0).getTime();
    return tb - ta;
  });
  const total = entries.length;
  const typeCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  for (const e of entries) {
    const t = (e.type as string) || "note";
    typeCounts[t] = (typeCounts[t] || 0) + 1;
    const s = (e.status as string) || "active";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }
  const lastSync = wikiEntries[0]?.syncedAt as string | null | undefined ?? null;
  return NextResponse.json(
    { entries, typeCounts, statusCounts, total, lastSync },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
  );
}

function inferType(rel: string): string {
  const lower = rel.toLowerCase();
  if (lower.includes("refs") || lower.includes("lesson")) return "lesson";
  if (lower.includes("tasks") || lower.includes("report")) return "project";
  if (lower.includes("docs") || lower.includes("decision")) return "decision";
  if (lower.includes("log") || lower.includes("memory/")) return "note";
  if (lower.startsWith("agents.md") || lower.startsWith("memor")) return "fact";
  return "note";
}
