import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Pool as PgPool } from "pg";
import fs from "node:fs";
import path from "node:path";

// ─── ILFIX-0927 F1-4 — lapisan baca kandidat dari mirror FTS IlSearchDoc ─────
// Kontrak mengikat: docs/2026-09-27-ilfix-ingest/f1/F1-DESIGN.md §4.
// Jalur utama: kandidat id+source dari IlSearchDoc (websearch_to_tsquery 'simple'
// + ts_rank; fallback trgm ILIKE ter-indeks gin_trgm_ops), lalu HIDRASI memakai
// pembentuk entri lama di bawah sehingga bentuk respons TIDAK BERUBAH (FR2).
// Fallback PENUH ke perilaku LIKE hari ini bila: token kosong (kueri <3 char),
// scope vault/archive (di luar cakupan indeks — lihat komentar §0), tabel kosong/
// belum ada, query error, atau 0 kandidat. Tidak pernah lebih buruk dari sekarang.
// Semua nilai user lewat parameter $n — NOL concat SQL: satu-satunya string yang
// dibangun aplikasi adalah daftar token hasil regex whitelist digabung operator
// tetap " OR " (mustahil membawa operator tsquery/sintaks SQL).
const IL_CANDIDATE_CAP = 200; // cap kandidat ts_rank (terukur 2 ms @44MB, F1-DESIGN P-6)

let _ilPool: PgPool | null = null;
function getIlPool(): PgPool | null {
  const cs = process.env.DATABASE_URL;
  if (!cs) return null;
  if (!_ilPool) {
    _ilPool = new PgPool({
      connectionString: cs,
      max: 2,
      connectionTimeoutMillis: 2500,
      statement_timeout: 5000,
      query_timeout: 5000,
    });
  }
  return _ilPool;
}

function extractQueryTokens(q: string): string[] {
  // Kontrak §4.1: min 3 char; Latin+CJK+kana+hangul; maks 20 token pertama; lower-case.
  // rentang: \\u4e00-\\u9fff Han · \\u3040-\\u30ff kana · \\uac00-\\ud7af hangul
  const HAN = "\u4e00"; const HAN_END = "\u9fff";
  const KANA = "\u3040"; const KANA_END = "\u30ff";
  const HANGUL = "\uac00"; const HANGUL_END = "\ud7af";
  const re = new RegExp(`[A-Za-z0-9${HAN}-${HAN_END}${KANA}-${KANA_END}${HANGUL}-${HANGUL_END}]{3,}`, "gu");
  const m = q.match(re);
  return m ? m.slice(0, 20).map((t) => t.toLowerCase()) : [];
}

type IlCandidate = { id: string; source: string };

// §4.3 jalur FTS. websearch_to_tsquery pemaaf sintaks (bukti R14: input sampah ->
// 0 hit, bukan exception). BUKAN websearch atas kalimat mentah (terbukti 0/8, P-7).
async function ftsCandidates(pool: PgPool, orTokens: string, cap: number): Promise<IlCandidate[]> {
  const res = await pool.query(
    `SELECT "id", "source", ts_rank("tsv", q) AS score
       FROM "IlSearchDoc", websearch_to_tsquery('simple', $1) q
      WHERE "tsv" @@ q
      ORDER BY score DESC
      LIMIT $2`,
    [orTokens, cap]
  );
  return res.rows.map((r: { id: string; source: string }) => ({ id: r.id, source: r.source }));
}

// §4.5 fallback trgm (CJK tanpa spasi / substring): `||` di sisi SQL atas parameter,
// bukan concat JS; ter-indeks gin_trgm_ops (EXPLAIN nyata P-8).
// F1-7 (D-10b): ORDER BY similarity DESC + tie-break id sebelum LIMIT — cap 200
// deterministik (baris terbaik yang terpotong, bukan urutan fisik nondeterministik).
async function trgmCandidates(pool: PgPool, phrase: string, cap: number): Promise<IlCandidate[]> {
  const res = await pool.query(
    `SELECT "id", "source",
            GREATEST(similarity("body", $1), similarity("title", $1)) AS sim
       FROM "IlSearchDoc"
      WHERE "body" ILIKE '%' || $1 || '%' OR "title" ILIKE '%' || $1 || '%'
      ORDER BY sim DESC, "id" ASC
      LIMIT $2`,
    [phrase, cap]
  );
  return res.rows.map((r: { id: string; source: string }) => ({ id: r.id, source: r.source }));
}

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
  // Toleran CRLF (vault_propose.py menulis \r\n di Windows) dan LF.
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return {};
  const fm: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"(.*)"$/, "$1");
  }
  return fm;
}

function walkVault(dir: string, relRoot = ""): { rel: string; abs: string }[] {
  return walkMd(dir, relRoot); // hanya .md, sama aturan skip dir
}

// GET ?q=&scope=wiki|workspace|all|vault|archive&status=&type=&domain=&project=
// - wiki      : entri HermesMemory dari DB (dimirror bridge dari ~/.hermes/wiki)
// - workspace : file markdown di shared GSP workspace (AGENTS.md, MEMORY.md, memory/, docs/)
//               — legacy-archive/ TIDAK ikut (dump mentah, bukan knowledge aktif)
// - vault     : objek usulan/terkurasi di workspace/vault/ (STAGING, belum terbit)
// - archive   : KHUSUS legacy-archive/ (dump mentah migrasi) — tersembunyi dari default
// - all       : gabungan wiki + workspace (default; vault & archive TIDAK ikut)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const scope = (url.searchParams.get("scope") || "all").toLowerCase();
  const type = url.searchParams.get("type");
  const status = url.searchParams.get("status") || "active";
  const domain = (url.searchParams.get("domain") || "").trim().toLowerCase();
  const project = (url.searchParams.get("project") || "").trim().toLowerCase();

  const wantWiki = scope === "all" || scope === "wiki";
  const wantWs = scope === "all" || scope === "workspace" || scope === "archive";
  // Vault (analisa) ikut scope default "all" — analisa = pengetahuan bernilai (rank 1)
  const wantVault = scope === "vault" || scope === "all";
  const isArchiveScope = scope === "archive";

  // ── 0. Kandidat IlSearchDoc (ILFIX F1-4, kontrak F1-DESIGN §4) ─────────────
  // null  => TIDAK ada kandidat tepercaya (tanpa q / token kosong / scope archive
  //          di luar cakupan indeks / tabel kosong / error) => perilaku LIKE lama utuh.
  // object => himpunan id mentah per source dari indeks FTS; hidrasi TETAP memakai
  //          pembentuk entri lama (bentuk respons identik, FR2) dengan keanggotaan
  //          himpunan ini sebagai penyaring pembanding substring lama.
  let ilCand: { wiki: Set<string>; ws: Set<string>; vault: Set<string>; tokens: string[] } | null =
    null;
  if (q && !isArchiveScope) {
    const tokens = extractQueryTokens(q);
    const pool = tokens.length > 0 ? getIlPool() : null;
    if (pool) {
      try {
        // §4.3 FTS utama (token OR, terukur 8/8 recall); error sintaks mustahil
        // (websearch pemaaf + input sudah whitelist-regex) tapi tetap dalam try/catch.
        const fts = await ftsCandidates(pool, tokens.join(" OR "), IL_CANDIDATE_CAP).catch(
          () => [] as IlCandidate[]
        );
        // §4.5 trgm substring — pelengkap recall CJK-tanpa-spasi & subtoken Latin
        // (mis. "supply" tak bertemu token "supply-chain"); ter-indeks, LIMIT cap.
        const trgm = await trgmCandidates(pool, q, IL_CANDIDATE_CAP).catch(
          () => [] as IlCandidate[]
        );
        const pairs: IlCandidate[] = [];
        const seen = new Set<string>();
        for (const c of [...fts, ...trgm]) {
          const key = `${c.source}\u0000${c.id}`;
          if (seen.has(key)) continue;
          seen.add(key);
          pairs.push(c);
        }
        if (pairs.length > 0) {
          const wiki = new Set<string>();
          const ws = new Set<string>();
          const vault = new Set<string>();
          for (const c of pairs) {
            if (c.source === "wiki") wiki.add(c.id); // id HermesMemory apa adanya
            else if (c.source === "workspace") ws.add(c.id.replace(/^ws:/, "")); // = rel route.ts
            else if (c.source === "vault") vault.add(c.id.replace(/^vault:/, "")); // rel root vault
          }
          ilCand = { wiki, ws, vault, tokens };
        }
      } catch {
        ilCand = null; // §4.6 fallback penuh — tidak pernah lebih buruk dari hari ini
      }
    }
  }

  const wikiEntries: Record<string, unknown>[] = [];
  const wsEntries: Record<string, unknown>[] = [];

  // ── 1. Wiki (DB) ────────────────────────────────────────
  if (wantWiki) {
    const where: Record<string, unknown> = {};
    if (status !== "all") where.status = status;
    if (type && type !== "all") where.type = type;
    if (q && !ilCand) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { body: { contains: q, mode: "insensitive" } },
        { tags: { has: q } },
      ];
    }
    const rows = await prisma.hermesMemory.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 5000,
    });
    // domain entri wiki: infer dari tags bila ada (proposa vault membawa tag domain),
    // fallback 'wiki'
    const DOMAIN_TAG_ALIASES: Record<string, string> = {
      "defense-intel": "defense-intel", "defense": "defense-intel", "intel": "defense-intel",
      "corporate": "corporate", "digital": "digital", "engineering": "engineering",
      "operations": "operations", "library": "library",
    };
    let mapped = rows.map((r) => {
      let ddomain = "wiki";
      const tags = (Array.isArray(r.tags) ? r.tags : []).join(" ").toLowerCase();
      for (const [k, v] of Object.entries(DOMAIN_TAG_ALIASES)) {
        if (tags.includes(k)) { ddomain = v; break; }
      }
      return {
        ...r,
        source: "wiki",
        confidence: r.confidence != null ? Number(r.confidence) : null,
        domain: ddomain,
        project: null,
      };
    });
    // jalur kandidat: muat semua baris terfilter lalu saring dgn himpunan id indeks;
    // tag HermesMemory TIDAK terindeks tsv → tetap pakai kecocokan tag lama sebagai OR.
    // F1-7 (D-10b) opsi (a): fallback token in-memory atas title+body — pola sama dgn
    // jalur workspace (:320). Tanpa ini, himpunan id tercap 200/kueri MEMANGKAS recall
    // LIKE-lama pada token高频 (M-1: 549 vs 190 pada korpus nyata) sehingga klaim
    // paritas DIFF-NOTE §2 salah utk wiki. Token adalah subsequence lowercase dari q
    // => bila LIKE-lama (substring q utuh) kena, token fallback pasti kena: superset.
    if (q && ilCand) {
      const cand = ilCand;
      mapped = mapped.filter((r) => {
        if (cand.wiki.has(String(r.id))) return true;
        if (Array.isArray(r.tags) && (r.tags as string[]).some((t) => t.toLowerCase() === q))
          return true;
        const hay = `${r.title} ${r.body}`.toLowerCase();
        return cand.tokens.some((t) => hay.includes(t));
      });
    }
    wikiEntries.push(...mapped);
  }

  // ── 2. Shared workspace (filesystem) ─────────────────────
  if (wantWs && fs.existsSync(SHARED_WS)) {
    const files = walkMd(SHARED_WS);
    for (const f of files) {
      // legacy-archive/ = dump mentah migrasi — hanya tampil di scope archive
      if (f.rel.startsWith("legacy-archive/") && !isArchiveScope) continue;
      if (isArchiveScope && !f.rel.startsWith("legacy-archive/")) continue;
      let body = "";
      try {
        body = fs.readFileSync(f.abs, "utf8");
      } catch {
        continue;
      }
      const stat = fs.statSync(f.abs);
      const title = extractTitle(f.rel, body);
      const haystack = `${f.rel} ${title} ${body}`.toLowerCase();
      // F1-4: jalur kandidat → keanggotaan himpunan indeks ATAU kecocokan token per
      // kata atas haystack lama (path+title+body); tanpa kandidat → substring lama.
      if (q) {
        if (ilCand) {
          if (!ilCand.ws.has(f.rel) && !ilCand.tokens.some((t) => haystack.includes(t))) continue;
        } else if (!haystack.includes(q)) continue;
      }
      // type asli dari path; filter type HANYA menyaring (bukan memaksa type)
      const t = inferType(f.rel);
      if (type && type !== "all" && t !== type) continue;
      const cls = classifyPath(f.rel);
      // ukuran body dibatasi agar response tetap ringan
      wsEntries.push({
        id: `ws-${f.rel.replace(/[^a-z0-9]+/gi, "-")}`,
        path: f.rel,
        type: t,
        title,
        status: "active",
        confidence: null,
        domain: cls.domain,
        project: cls.project,
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
    // tetap terlihat walau tidak ada file .md. (tidak berlaku di scope archive)
    const docsRoot = path.join(SHARED_WS, "docs");
    if (!isArchiveScope && fs.existsSync(docsRoot)) {
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
        // entri folder sintetis TIDAK terindeks IlSearchDoc — tetap substring/token atas path
        if (q) {
          const hay = `docs/${dir}`.toLowerCase();
          if (ilCand) {
            if (!ilCand.tokens.some((t) => hay.includes(t))) continue;
          } else if (!hay.includes(q)) continue;
        }
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
        const pretty = dir.replace(/^\d{4}[-_]\d{2}[-_]\d{2}[-_]/, "").replace(/[-_]+/g, " ").trim();
        const cls = classifyPath(`docs/${dir}/`);
        wsEntries.push({
          id: `ws-docs-${dir.replace(/[^a-z0-9]+/gi, "-")}`,
          path: `docs/${dir}/`,
          type: "project",
          title: `📁 ${pretty.charAt(0).toUpperCase() + pretty.slice(1)}`,
          status: "active",
          confidence: null,
          domain: cls.domain,
          project: cls.project,
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
        // F1-4: jalur kandidat vault (indeks id = "vault:"+rel root vault = f.rel);
        // tanpa kandidat → substring lama.
        if (q) {
          if (ilCand) {
            if (!ilCand.vault.has(f.rel) && !ilCand.tokens.some((t) => haystack.includes(t))) continue;
          } else if (!haystack.includes(q)) continue;
        }
        if (type && type !== "all" && vtype !== type) continue;
        // status: di scope "all", tampilkan SEMUA lifecycle vault (usulan/dll) —
        // analisa adalah pengetahuan; filter status hanya berlaku di scope vault.
        if (scope !== "all" && status !== "all" && vstatus !== status) continue;
        const stat = fs.statSync(f.abs);
        const cls = classifyPath(`vault/${f.rel}`);
        // domain proposa: dari frontmatter 'domain' bila ada, lalu tag, terakhir 'library' (staging)
        const DOMAIN_ALIASES: Record<string, string> = {
          "defense-intel": "defense-intel", "defense": "defense-intel", "intel": "defense-intel",
          "corporate": "corporate", "digital": "digital", "engineering": "engineering",
          "operations": "operations", "library": "library",
        };
        let vdomain = cls.domain || "library";
        const fmDomain = String(fm.domain || "").trim().toLowerCase();
        if (fmDomain && DOMAIN_ALIASES[fmDomain]) vdomain = DOMAIN_ALIASES[fmDomain];
        else {
          const tags = String(fm.tags || "").toLowerCase();
          for (const [k, v] of Object.entries(DOMAIN_ALIASES)) {
            if (tags.includes(k)) { vdomain = v; break; }
          }
        }
        vaultEntries.push({
          id: `vault-${f.rel.replace(/[^a-z0-9]+/gi, "-")}`,
          path: `vault/${f.rel}`,
          type: vtype,
          title,
          status: vstatus,
          confidence: null,
          domain: vdomain,
          project: cls.project || fm.perkara || null,
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

  // ── 3b. (TIDAK dipakai) Klasifikasi siklus raw tidak diangkat jadi knowledge.
  // Prinsip IL: workspace = RAW. Analisa → vault → wiki dilakukan gsp-librarian
  // lewat gsp-library-analysis; IL hanya menyajikan hasil analisa (vault/wiki).

  let entries: Record<string, unknown>[] =
    scope === "vault"
      ? vaultEntries
      : scope === "archive"
      ? [...wsEntries]
      : [...wsEntries, ...wikiEntries, ...vaultEntries];

  // ── Rank kepentingan — pengetahuan terkurasi lebih dulu, raw terakhir ──
  // Sesuai prinsip IL: WIKI (0) = paling berharga · VAULT (1) = analisa terkurasi
  // · docs insight (1-2) · raw workspace (3) · legacy raw (4, scope Arsip).
  for (const e of entries) e.rank = entryRank(e as Record<string, unknown>);

  // ── Domain counts — dihitung SEBELUM filter domain/project (chip domain stabil) ──
  const domainCounts: Record<string, number> = {};
  for (const e of entries) {
    const d = (e.domain as string) || "other";
    domainCounts[d] = (domainCounts[d] || 0) + 1;
  }

  // ── Filter domain ──
  if (domain && domain !== "all") {
    entries = entries.filter(
      (e) => ((e.domain as string) || "other").toLowerCase() === domain
    );
  }

  // ── Project counts — setelah filter domain, sebelum filter project (cascading) ──
  const projectCounts: Record<string, number> = {};
  for (const e of entries) {
    const p = (e.project as string) || "";
    if (p) projectCounts[p] = (projectCounts[p] || 0) + 1;
  }

  // ── Filter project ──
  if (project && project !== "all") {
    entries = entries.filter(
      (e) => ((e.project as string) || "").toLowerCase() === project
    );
  }

  // urutkan: rank kepentingan (terkurasi dulu) → updatedAt terbaru
  entries.sort((a, b) => {
    const ra = (a.rank as number) ?? 3;
    const rb = (b.rank as number) ?? 3;
    if (ra !== rb) return ra - rb;
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
    { entries, domainCounts, projectCounts, typeCounts, statusCounts, total, lastSync },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
  );
}

function inferType(rel: string): string {
  const lower = rel.toLowerCase();
  const first = rel.split("/")[0];
  // Project FOLDER entries (trailing slash) — hanya folder tugas/docs & item legacy
  if (
    rel.endsWith("/") &&
    (/^\d{4}[-_]\d{2}[-_]\d{2}[-_]/.test(first) || /-\d{8}T\d{6}Z/i.test(first))
  )
    return "project";
  // Dokumen di dalam project (sudah terindeks domain/project) → type "document",
  // bukan fact/decision/lesson — menghindari klasifikasi ganda & noise.
  const cls = classifyPath(rel);
  if (cls.project) return "document";
  if (lower.startsWith("legacy-archive/")) return "document";
  if (lower.startsWith("ekas/")) {
    if (lower.includes("04_knowledge") || lower.includes("knowledge-card"))
      return "lesson";
    if (
      lower.includes("03_source-vault") ||
      lower.includes("02_registers") ||
      lower.includes("register")
    )
      return "reference";
    if (lower.includes("01_governance")) return "decision";
    return "note";
  }
  if (lower.includes("refs") || lower.includes("lesson")) return "lesson";
  if (lower.includes("decision")) return "decision";
  if (lower.startsWith("memory/")) return "note";
  if (lower.includes("docs/03_reference")) return "reference";
  if (lower.startsWith("agents.md") || lower.startsWith("memor")) return "fact";
  return "note";
}

// ── Domain & project classification (organisasi knowledge) ──
// Domain  = area knowledge tingkat atas (structural root workspace).
// Project = item kerja spesifik di dalam domain (folder tugas / item / perkara).
function classifyPath(rel: string): { domain: string; project: string | null } {
  const lower = rel.toLowerCase();

  if (lower === "agents.md" || lower === "memory.md")
    return { domain: "core", project: null };

  if (lower.startsWith("ekas/"))
    return { domain: "engineering", project: null };

  if (lower.startsWith("vault/")) {
    const seg = (rel.split("/")[1] || "").trim();
    return { domain: "library", project: seg || null };
  }

  if (lower.startsWith("memory/"))
    return { domain: "operations", project: null };

  if (lower.startsWith("legacy-archive/")) {
    const seg = (rel.split("/")[1] || "").trim();
    // file longgar di root archive (bukan folder item) → bukan project
    if (!seg || seg === "logs" || seg === "ocr" || /\.[a-z0-9]+$/i.test(seg))
      return { domain: "legacy", project: null };
    const project = seg
      .replace(/-\d{8}T\d{6}Z-\d+-\d+$/i, "")
      .replace(/-\d{8}T\d{6}Z$/i, "")
      .trim();
    return { domain: "legacy", project: project || seg };
  }

  if (lower.startsWith("docs/")) {
    const rest = rel.slice("docs/".length);
    const seg = (rest.split("/")[0] || "").trim();
    if (seg === "01_DOMAIN") {
      const d = (rest.split("/")[1] || "").trim();
      return { domain: d || "docs", project: null };
    }
    if (seg === "00_INDEX") return { domain: "core", project: null };
    if (seg === "02_PROJECT") return { domain: "docs", project: null };
    if (seg === "03_REFERENCE") return { domain: "reference", project: null };
    // docs/[tanggal]_[project]/... → project operasional
    if (/^\d{4}[-_]\d{2}[-_]\d{2}[-_]/.test(seg)) {
      const project = seg.replace(/^\d{4}[-_]\d{2}[-_]\d{2}[-_]/, "").trim();
      return { domain: "operations", project: project || seg };
    }
    return { domain: "docs", project: null };
  }

  return { domain: "other", project: null };
}

// ── Rank kepentingan — menentukan urutan tampil (terkurasi dulu, dump mentah terakhir) ──
// 0 = wiki (pengetahuan terdistilasi) · 1 = vault / ekas / dokumen insight docs
// 2 = dokumen docs lain & core · 3 = log memory · 4 = legacy-archive (dump mentah)
function entryRank(e: Record<string, unknown>): number {
  if (e.source === "wiki") return 0;
  if (e.source === "vault") return 1;
  const p = String(e.path || "").toLowerCase();
  const t = String(e.title || "").toLowerCase();
  if (p.startsWith("legacy-archive/")) return 4;
  if (p.startsWith("memory/")) return 3;
  if (p.startsWith("ekas/")) return 1; // knowledge system terkurasi
  if (p.startsWith("docs/")) {
    // dokumen yang berbentuk insight/final/ringkasan/kajian/review diutamakan
    if (
      /(insight|final|kesimpulan|ringkasan|rekomendasi|brief|analys|review|kajian|00_|01_|02_)/.test(p) ||
      /(insight|final|kesimpulan|ringkasan|rekomendasi|brief|analys|review|kajian)/.test(t)
    )
      return 1;
    return 2;
  }
  if (p === "agents.md" || p === "memory.md") return 2;
  return 3;
}
